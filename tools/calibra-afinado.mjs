// AQVILA — afinado del Saber (I5d): node tools/calibra-afinado.mjs [--meses 120] [--semillas 2] [--solo id,id]
// Bot agresivo de sim.test.js, cada saber SOLO (hecho desde el mes 0, sin pagar ni requisitos) contra la partida sin saberes.
// Mide a los N meses: ciudades tomadas, oro+recursos, población, ejército y puntos. Banda: ningún saber debe mover la «puntuación» más de ±15 % ni dejarla igual (inútil) en sus métricas propias.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); const { Battle } = require('../js/battle.js');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const MESES = +arg('meses', 120), NS = +arg('semillas', 2), SOLO = arg('solo', '') ? arg('solo', '').split(',') : null;
const mulberry32 = a => function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function campana(saber, seed) {
  const rnd0 = Math.random; Math.random = mulberry32(seed);
  try {
    const s = G.newGame('Test'); const meta = G.region().capitalRival; G.turnos = false;
    if (saber) { s.inv.hechas[saber] = 0; s.inv.rev++; const ed = D.INVEST[saber].edad; if (ed > s.inv.edad) s.inv.edad = ed; }
    const dist = {}; dist[meta] = 0; for (let q = [meta], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
    let guard = 0; const t0 = s.t;
    while (!s.over && s.t - t0 < MESES && guard++ < 200000) {
      G.tick(0.25);
      while (s.pending.length && !s.over) { const b = new Battle(G.battleInfo(s.pending[0]).cfg); b.finish(); G.applyBattle(b.result()); }
      if (guard % 8) continue;
      for (const id of G.myCities()) {
        const c = s.cities[id];
        if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const n = Math.min(150, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); break; } } }
        if (!c.queue) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'escuela', 'muralla'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (G.prod().grano < 25 ? (q === 'granja') - (p === 'granja') : 0) * 3); for (const b of bs) if (G.upgrade(id, b)) break; }
        G.levantarMuralla(id);   // CN7: la defensa sale de la obra de ciudad
        const yr = G.yearOf(s.t); if (yr <= 230 && yr >= 209) continue;
        const sig = G.neighbors(id).sort((a, b) => dist[a] - dist[b])[0];
        if (id !== meta && dist[sig] < dist[id] && s.cities[sig].owner === 'roma' && !s.marches.some(m => m.owner === 'roma' && m.from === id)) { const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === 'roma' ? 0.15 : 0.65)); if (G.men(u) >= 100 && G.send(id, sig, u, false)) continue; }
        for (const n of G.neighbors(id)) {
          const t = s.cities[n]; if (t.owner === 'roma') continue;
          const keepHome = id === 'roma' ? 0.35 : 0.2, u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (1 - keepHome));
          if (G.power(u) > G.power(t.units) * (1.6 + 0.12 * t.b.muralla) && !s.marches.some(m => m.owner === 'roma' && s.cities[m.to].owner !== 'roma')) { G.send(id, n, u, G.heroAvailable(id)); break; }
        }
      }
    }
    const mis = G.myCities(); let pob = 0, tropas = 0; for (const id of mis) { const c = s.cities[id]; pob += c.pop || 0; tropas += G.men(c.units); }
    const P = G.prod(); let rec = 0; for (const r of D.RES) rec += P[r] || 0;   // producción mensual total
    return { ciu: mis.length, rec: rec, pob: pob, tropas: tropas, win: s.over ? (s.over.win ? 1 : -1) : 0 };
  } finally { Math.random = rnd0; }
}
const ids = [null].concat(SOLO || Object.keys(D.INVEST)), R = {};
for (const id of ids) { const r = []; for (let sd = 1; sd <= NS; sd++) r.push(campana(id, sd)); R[id || 'base'] = r; process.stderr.write('.'); }
const med = (l, k) => l.reduce((a, x) => a + x[k], 0) / l.length, B = R.base;
console.log('\nAfinado a ' + MESES + ' meses, ' + NS + ' semillas. Columnas: ciudades · producción/mes · población · tropas (y % frente a sin saber)');
const f = (v, b) => String(Math.round(v)).padStart(7) + (b ? ' ' + ((v / b - 1) * 100 >= 0 ? '+' : '') + Math.round((v / b - 1) * 100) + '%' : '');
for (const k of Object.keys(R)) console.log(k.padEnd(11) + ' ciu ' + med(R[k], 'ciu').toFixed(1).padStart(5) + '  rec ' + f(med(R[k], 'rec'), k === 'base' ? 0 : med(B, 'rec')).padEnd(14) + ' tro ' + f(med(R[k], 'tropas'), k === 'base' ? 0 : med(B, 'tropas')));
