// AQVILA — PN2: las 8 polis de «Partida nueva». node test/polis.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); const R = require('../js/registro.js');
const { POLIS: MAPA } = await import('../js/gfx/mapa-grecia-datos.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const IDS = ['atenas', 'esparta', 'corinto', 'argos', 'tebas', 'megara', 'mileto', 'calcis'];
const nueva = (p) => { const s = G.newGame('Test', 'italia', { polis: p }); G.onEvent = null; return s; };
const rasgo = p => JSON.stringify(p.rasgo.bono), ed = p => p.edificio.id, tr = p => p.tropa.id + '|' + p.tropa.n;

t('hay 8 polis con todos sus campos', () => {
  assert.deepStrictEqual(Object.keys(D.POLIS).sort(), IDS.slice().sort()); assert.deepStrictEqual(D.POLIS_ORDEN.slice().sort(), IDS.slice().sort());
  for (const id of IDS) { const p = D.POLIS[id];
    for (const c of ['n', 'color', 'sello', 'lema', 'lujo', 'lujoN', 'lujoDe', 'heroe']) assert.ok(typeof p[c] === 'string' && p[c], id + '.' + c);
    assert.ok(p.lema.length <= 60, id + ' lema largo'); assert.strictEqual(p.heroe, 'Polemarco de ' + p.n);
    assert.ok(p.rasgo.n && p.rasgo.d && Object.keys(p.rasgo.bono).length, id + ' rasgo');
    assert.ok(D.BUILD[p.edificio.id] && p.edificio.n && p.edificio.d, id + ' edificio');
    assert.ok(D.UNITS[p.tropa.id] && D.UNITS[p.tropa.id].griega && p.tropa.n && p.tropa.d, id + ' tropa');
    assert.ok(Object.keys(p.leva).length && Object.keys(p.leva).every(k => D.UNITS[k] && D.UNITS[k].griega && p.leva[k] > 0), id + ' leva'); }
});
t('cada par de polis se distingue en 2 de 3 (rasgo, edificio, tropa)', () => {
  for (let i = 0; i < IDS.length; i++) for (let j = i + 1; j < IDS.length; j++) { const a = D.POLIS[IDS[i]], b = D.POLIS[IDS[j]];
    const d = (rasgo(a) !== rasgo(b)) + (ed(a) !== ed(b)) + (tr(a) !== tr(b)); assert.ok(d >= 2, IDS[i] + ' y ' + IDS[j] + ' solo difieren en ' + d); }
});
t('color, lujo y origen del lujo coinciden con el mapa de Grecia', () => {
  assert.strictEqual(MAPA.length, 8);
  for (const m of MAPA) { const p = D.POLIS[m.id]; assert.ok(p, m.id); assert.strictEqual(p.n, m.n); assert.strictEqual(p.color, m.color); assert.strictEqual(p.lujo, m.lujo); assert.strictEqual(p.lujoDe, m.lujoDe); }
});
t('toda polis tiene ficha de registro con fuente y dictamen', () => {
  for (const id of IDS) { const f = R.fichas.polis[id]; assert.ok(f && f.historia, id); assert.ok(f.historia.fuente.length > 5, id + ' fuente'); assert.ok(['historico', 'probable', 'licencia de juego'].includes(f.historia.dictamen), id + ' dictamen'); assert.ok(f.historia.texto.length >= 40, id + ' texto'); }
});
for (const id of IDS) t('partida con ' + id + ': nombre, leva, reclutas, bono y 40 estaciones', () => {
  const p = D.POLIS[id], s = nueva(id);
  assert.strictEqual(s.polis, id); assert.strictEqual(D.polis, id);
  assert.strictEqual(D.CITIES.roma.n, p.n); assert.strictEqual(D.FACTIONS.roma.n, p.n); assert.strictEqual(D.FACTIONS.roma.col, p.color);
  assert.deepStrictEqual(G.myCities(), ['roma']); assert.strictEqual(s.hero.name, 'Test');
  const c = s.cities.roma; assert.ok(!c.units.hastati && !c.units.velites, 'sin tropa romana');
  for (const k in p.leva) assert.strictEqual(c.units[k], p.leva[k]);
  c.b.cuartel = Math.max(c.b.cuartel || 0, 2); c.b.establo = Math.max(c.b.establo || 0, 1);
  assert.ok(!G.unitOk(c, 'hastati') && !G.unitOk(c, 'velites') && !G.unitOk(c, 'equites'), 'romanas no');
  assert.ok(G.unitOk(c, 'hoplitas') && G.unitOk(c, p.tropa.id), 'hoplitas y su tropa propia sí');
  const val = k => k === 'fel' ? G.bonoSum(k) : G.bonoMul(k), con = {}; for (const k in p.rasgo.bono) con[k] = val(k);
  nueva(null); for (const k in p.rasgo.bono) { const sin = val(k); assert.notStrictEqual(con[k], sin, id + ': el bono ' + k + ' no se nota'); assert.ok(Math.abs(Math.abs(con[k] - sin) - Math.abs(p.rasgo.bono[k] - (k === 'fel' ? 0 : 1))) < 0.05 + sin * 0.2, id + ' ' + k + ' sale muy distinto de su ficha'); }
  G.newGame('Test', 'italia', { polis: id }); const s2 = G.state; s2.cities.roma.b.cuartel = 2;
  for (let i = 0; i < 40 && !s2.over; i++) { G.pasarEstacion(); if (s2.pending.length) s2.pending.length = 0; }
  const c2 = s2.cities.roma; assert.strictEqual(c2.owner, 'roma'); assert.ok(c2.pop > 0, 'población ' + c2.pop);
  for (const r of ['grano', 'denarios', 'materiales', 'hierro']) assert.ok(Number.isFinite(s2.res[r]), 'NaN en ' + r);
  assert.ok(Number.isFinite(c2.pop) && Object.values(c2.units).every(Number.isFinite), 'NaN en ciudad');
  assert.ok(G.myCities().includes('roma'));
});
t('PN3: arranque mínimo; el edificio propio no está construido (Tebas: dos granjas)', () => {
  for (const id of IDS) { const e = D.POLIS[id].edificio.id, c = nueva(id).cities.roma, b = c.b[e] || 0; assert.ok(e === 'granja' ? b === 2 : b === 0, id + ' ' + e + ' ' + b); assert.strictEqual(c.b.foro, 1); }
});
t('la crónica dice con qué polis empiezas', () => {
  const s = nueva('atenas'); assert.ok(s.log.some(l => /Empiezas como Atenas: Plata del Laurion/.test(l.x)));
});
t('partida de Roma: sin polis, «Roma», hastati sí y hoplitas no; Capua suya', () => {
  const s = nueva(null); assert.strictEqual(s.polis, null); assert.strictEqual(D.polis, null); assert.strictEqual(D.CITIES.roma.n, 'Roma'); assert.strictEqual(D.FACTIONS.roma.n, 'Roma'); assert.strictEqual(D.FACTIONS.roma.col, '#b3261e');
  const c = s.cities.roma; c.b.cuartel = 2; c.b.establo = 1;
  assert.ok(G.unitOk(c, 'hastati') && G.unitOk(c, 'equites')); assert.ok(!G.unitOk(c, 'hoplitas') && !G.unitOk(c, 'peltastas') && !G.unitOk(c, 'jinetes'));
  assert.ok(c.units.hastati > 0 && G.myCities().includes('capua')); assert.strictEqual(G.bonoMul('impuestos'), 1);
});
t('la partida corta no cambia aunque se pida polis', () => {
  const s = G.newGame('T', null, { modo: 'corta', polis: 'atenas' }); assert.strictEqual(s.polis, null); assert.strictEqual(D.CITIES.roma.n, 'Roma');
});
t('una partida vieja sin polis carga como Roma', () => {
  const s = nueva('esparta'); G.save(); assert.ok(true);
  const mem = {}; globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
  const v = nueva(null); delete v.polis; G.save(); D.polis = 'atenas'; assert.ok(G.load()); assert.strictEqual(G.state.polis, null); assert.strictEqual(D.CITIES.roma.n, 'Roma');
  const a = nueva('argos'); G.save(); D.polis = null; assert.ok(G.load()); assert.strictEqual(G.state.polis, 'argos'); assert.strictEqual(D.CITIES.roma.n, 'Argos');
  delete globalThis.localStorage; nueva(null);
});
t('élite 2 estaciones; las griegas siguen la misma regla', () => {
  nueva(null); const L = { triarii: 2, equites: 2, hastati: 1, hoplitas: 1, peltastas: 1, jinetes: 2 };
  for (const k in L) assert.strictEqual(G.loteEstaciones(k), L[k], k);
});
console.log(mal ? '\n' + mal + ' fallos de ' + (n + mal) : '\nPOLIS: APTO (' + n + ' pruebas)'); process.exit(mal ? 1 : 0);
