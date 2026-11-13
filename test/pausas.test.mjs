// AQVILA — R3: el reloj se para con motivo. node test/pausas.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const nueva = () => { const s = G.newGame('Test', 'mediterraneo', {}); G.onEvent = null; return s; };
const oyente = () => { const v = []; G.onEvent = (tipo, p) => { if (tipo === 'parar') v.push(p); }; return v; };
const correr = (s, meses) => { for (let i = 0; i < meses * 4 && !s.over; i++) { G.tick(0.25); if (s.pending.length) s.pending.length = 0; } };

t('por defecto: pausas «todas»', () => { nueva(); assert.strictEqual(G.ajustes().pausas, 'todas'); });

t('una obra terminada para con motivo', () => {
  const s = nueva(); const v = oyente(); const b = Object.keys(D.BUILD).find(k => G.upgrade('roma', k));
  assert.ok(b, 'alguna obra empieza'); correr(s, 30);
  assert.ok(v.some(p => /^Obra terminada/.test(p.motivo) && !p.grave), JSON.stringify(v.map(p => p.motivo)));
});

t('una leva lista para con motivo', () => {
  const s = nueva(); const v = oyente(); s.res.grano = s.res.oro = s.res.madera = s.res.hierro = s.res.piedra = 5000;
  const k = ['hastati', 'principes', 'milicia'].find(u => G.unitOk(s.cities.roma, u)); assert.ok(k && G.train('roma', k, 10), 'recluta');
  correr(s, 30); assert.ok(v.some(p => /^Tropa lista/.test(p.motivo) && !p.grave), JSON.stringify(v.map(p => p.motivo)));
});

t('misión cumplida (suave) y misión fallida (grave)', () => {
  let s = nueva(); let v = oyente(); const m = Object.values(D.MISIONES)[0]; const ct = G.MISION_TIPOS[m.cond.tipo], antes = ct.cumple;
  s.mision = { id: m.id, t0: 0, t1: 99 }; ct.cumple = () => true; try { G.senadoMes(false); } finally { ct.cumple = antes; }
  assert.ok(v.length === 1 && /^Misión cumplida/.test(v[0].motivo) && !v[0].grave, JSON.stringify(v));
  s = nueva(); v = oyente(); s.t = 20; s.mision = { id: m.id, t0: 0, t1: 5 }; ct.cumple = () => false; try { G.senadoMes(false); } finally { ct.cumple = antes; }
  assert.ok(v.some(p => /^Misión fallida/.test(p.motivo) && p.grave), JSON.stringify(v));
});

t('ataque en camino (grave)', () => {
  const s = nueva(); const v = oyente(), rnd = Math.random; Math.random = () => 0;
  try { for (let a = 0; a < 40 && !v.some(p => /^Ataque:/.test(p.motivo)); a++) { correr(s, 12); } } finally { Math.random = rnd; }
  const p = v.find(x => /^Ataque:/.test(x.motivo)); assert.ok(p && p.grave, 'no salió ataque: ' + v.length);
});

t('«ninguna» no para; «solo graves» solo ataque y misión fallida', () => {
  const s = nueva(); const v = oyente(); const m = Object.values(D.MISIONES)[0], ct = G.MISION_TIPOS[m.cond.tipo], antes = ct.cumple;
  assert.ok(G.ponerAjustes({ pausas: 'ninguna' }).ok); assert.strictEqual(G.parar('x', true), false); assert.strictEqual(G.parar('x'), false); assert.strictEqual(v.length, 0);
  assert.ok(G.ponerAjustes({ pausas: 'graves' }).ok); assert.strictEqual(G.parar('suave'), false); assert.strictEqual(G.parar('grave', true), true); assert.strictEqual(v.length, 1);
  s.mision = { id: m.id, t0: 0, t1: 99 }; ct.cumple = () => true; try { G.senadoMes(false); } finally { ct.cumple = antes; } assert.strictEqual(v.length, 1, 'misión cumplida no para en graves');
  assert.ok(G.ponerAjustes({ pausas: 'todas' }).ok); assert.strictEqual(G.parar('suave'), true);
  assert.strictEqual(G.ponerAjustes({ pausas: 'rara' }).ok, false);
});

t('las pausas no cambian el resultado de la simulación', () => {
  const corre = modo => { const rnd = Math.random; let a = 7; Math.random = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    try { const s = nueva(); G.ponerAjustes({ pausas: modo }); if (modo === 'todas') G.onEvent = (tipo) => { if (tipo === 'parar') s.speed = 0; }; for (const b of Object.keys(D.BUILD)) G.upgrade('roma', b); correr(s, 24); return JSON.stringify([s.res, s.t, Object.keys(s.cities.roma.b).map(k => s.cities.roma.b[k])]); } finally { Math.random = rnd; } };
  assert.strictEqual(corre('todas'), corre('ninguna'));
});

t('migración: partida vieja sin ajuste carga con «todas»; valor raro se corrige', () => {
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  try {
    const raw = require('node:fs').readFileSync(new URL('./partida-vieja.json', import.meta.url), 'utf8'); store['aqvila-save-v1'] = raw;
    assert.ok(G.load()); assert.strictEqual(G.ajustes().pausas, 'todas');
    G.ponerAjustes({ pausas: 'graves' }); G.save(); assert.ok(G.load()); assert.strictEqual(G.pausas(), 'graves');
    const o = JSON.parse(store['aqvila-save-v1']); o.ajustes.pausas = 'zzz'; store['aqvila-save-v1'] = JSON.stringify(o); assert.ok(G.load()); assert.strictEqual(G.pausas(), 'todas');
    delete o.ajustes.pausas; store['aqvila-save-v1'] = JSON.stringify(o); assert.ok(G.load()); assert.strictEqual(G.pausas(), 'todas');
  } finally { delete global.localStorage; }
});

console.log(mal ? 'FALLAN ' + mal : 'TODO BIEN (' + n + ')'); process.exit(mal ? 1 : 0);
