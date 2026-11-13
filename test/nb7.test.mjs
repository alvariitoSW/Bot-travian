// AQVILA — NB7: batalla nueva conectada con la campaña, tribunos-generales e interruptor. node test/nb7.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); require('../js/battle.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const store = {}; global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };

t('ajuste «Batalla»: nueva por defecto, se cambia, se guarda y rechaza lo raro', () => {
  G.newGame('T'); assert.strictEqual(G.batalla(), 'nueva'); assert.strictEqual(G.ajustes().batalla, 'nueva');
  assert.strictEqual(G.ponerAjustes({ batalla: 'clasica' }).ok, true); assert.strictEqual(G.batalla(), 'clasica');
  assert.strictEqual(G.ponerAjustes({ batalla: 'rara' }).ok, false); assert.strictEqual(G.batalla(), 'clasica');
  G.save(); G.state = null; assert(G.load()); assert.strictEqual(G.batalla(), 'clasica');
});
t('migración: la partida vieja carga con batalla nueva y cuatro tribunos', () => {
  const raw = fs.readFileSync(new URL('./partida-vieja.json', import.meta.url), 'utf8'); const v = JSON.parse(raw); assert(v.tribunos === undefined);
  store['aqvila-save-v1'] = raw; assert(G.load()); assert.strictEqual(G.batalla(), 'nueva'); assert.strictEqual(G.tribunos().length, 4);
  assert.strictEqual(G.maxEjercitos(), 5);
});
t('planBatalla: >600 maniobra, menos directo, triple se resuelve sola, clásica sin cambios', () => {
  G.newGame('T'); const mk = (a, b) => ({ cfg: { sides: [{ units: { hastati: a } }, { units: { hoplitas: b } }] } });
  assert.strictEqual(G.planBatalla(mk(400, 300)).via, 'maniobra'); assert.strictEqual(G.planBatalla(mk(200, 150)).via, 'directo');
  assert.strictEqual(G.planBatalla(mk(900, 300)).via, 'sola'); assert.strictEqual(G.planBatalla(mk(100, 400)).via, 'sola');
  G.ponerAjustes({ batalla: 'clasica' }); assert.strictEqual(G.planBatalla(mk(400, 300)).modo, 'clasica');
});
t('tribunos: cada ejército sin el César necesita uno; si no quedan, no parte; se nombran con favor alto', () => {
  const s = G.newGame('T'); s.cities.roma.units = { hastati: 2000 }; let k = 0;
  while (G.send('roma', G.neighbors('roma')[0], { hastati: 10 }, false)) k++;
  assert.strictEqual(k, 4); assert(/tribunos/.test(G.sendMotivo)); assert.strictEqual(G.tribunoLibre(), null);
  s.favor.senado = 80; s.t += 13; G.tribunosMes(); assert.strictEqual(G.tribunos().length, 5); assert(G.tribunoLibre());
  assert.strictEqual(G.send('roma', G.neighbors('roma')[0], { hastati: 10 }, false), true);
});
t('si el tribuno cae en el choque, se pierde', () => {
  const s = G.newGame('T'); s.cities.capua.owner = 'campanos'; s.cities.capua.units = { hoplitas: 200, milicia: 200 }; s.cities.roma.units = { hastati: 500, principes: 300 };
  assert(G.send('roma', 'capua', { hastati: 500, principes: 300 }, false)); const m = s.marches.find(x => x.owner === 'roma'), tid = m.tribuno; assert(tid); s.marches.splice(s.marches.indexOf(m), 1); s.pending.push({ kind: 'attack', m }); const info = G.battleInfo(s.pending[0]); assert(info.cfg.sides[0].tribuno);
  const res = G.jugarNueva(info, { bono0: 1 }); res.tribunoMuerto = true; res.winner = 0; const out = G.applyBattle(res);
  assert(out.tribunoMuerto && !s.tribunos.some(x => x.id === tid), 'el tribuno desaparece');
});
function campana(modo, sem) {
  const rnd = Math.random; Math.random = mulberry32(sem);
  try {
    const s = G.newGame('Test'); G.ponerAjustes({ batalla: modo }); const meta = G.region().capitalRival, cuenta = { maniobra: 0, directo: 0, sola: 0, clasica: 0 };
    const dist = {}; dist[meta] = 0; for (let q = [meta], i = 0; i < q.length; i++) for (const nb of G.neighbors(q[i])) if (!(nb in dist)) { dist[nb] = dist[q[i]] + 1; q.push(nb); }
    G.onEvent = () => {}; let guard = 0;
    while (!s.over && guard++ < 200000) {
      G.tick(0.25);
      while (s.pending.length && !s.over) { const r = G.resolverPendiente(); cuenta[r.plan.via]++; assert(r.out && typeof r.out.win === 'boolean'); }
      if (guard % 8) continue;
      for (const id of G.myCities()) {
        const c = s.cities[id];
        if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const q = Math.min(150, G.maxTrain(k)); if (q >= 10) { G.train(id, k, q); break; } } }
        for (let hz = 0; G.huecosLibres(c) > 0 && hz < 4; hz++) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'escuela', 'muralla'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0)); let hizo = false; for (const b of bs) if (G.upgrade(id, b)) { hizo = true; break; } if (!hizo) break; }
        const yr = G.yearOf(s.t); if (yr <= 230 && yr >= 209) continue;
        const sig = G.neighbors(id).sort((a, b) => dist[a] - dist[b])[0];
        if (id !== meta && dist[sig] < dist[id] && s.cities[sig].owner === 'roma' && !s.marches.some(m => m.owner === 'roma' && m.from === id)) { const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === 'roma' ? 0.15 : 0.65)); if (G.men(u) >= 100) G.send(id, sig, u, false); }
        for (const nb of G.neighbors(id)) { const tt = s.cities[nb]; if (tt.owner === 'roma') continue; const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === 'roma' ? 0.65 : 0.8)); if (G.power(u) > G.power(tt.units) * (1.6 + 0.12 * tt.b.muralla) && !s.marches.some(m => m.owner === 'roma' && s.cities[m.to].owner !== 'roma')) { G.send(id, nb, u, G.heroAvailable(id)); break; } }
      }
    }
    assert(s.over, 'la campaña debe terminar'); return { s, cuenta };
  } finally { Math.random = rnd; G.onEvent = null; }
}
for (const sd of (process.env.SEMS||'').split(',').filter(Boolean)) { for (const m of ['nueva','clasica']) { const r = campana(m, +sd); console.log(sd, m, r.s.over.win ? 'V' : 'D', JSON.stringify(r.cuenta), G.yearOf(r.s.t)); } }
t('campaña con el bot y batalla nueva: termina y usa maniobra y choque', () => {
  const t0 = Date.now(), r = campana('nueva', 3); console.log('     ', JSON.stringify(r.cuenta), r.s.over.win ? 'victoria' : 'derrota', ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  assert(r.cuenta.maniobra + r.cuenta.directo + r.cuenta.sola > 0 && r.cuenta.clasica === 0, 'solo batallas nuevas');
});
t('campaña con el bot y batalla clásica: sigue funcionando', () => {
  const r = campana('clasica', 3); console.log('     ', JSON.stringify(r.cuenta), r.s.over.win ? 'victoria' : 'derrota');
  assert(r.cuenta.clasica > 0 && r.cuenta.maniobra + r.cuenta.directo + r.cuenta.sola === 0);
});
delete global.localStorage;
console.log(n + ' bien, ' + mal + ' mal'); process.exit(mal ? 1 : 0);
