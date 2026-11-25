// AQVILA — bot investigador (prueba 7 de I5b): node test/investigador.test.mjs
// Mismo bot agresivo de sim.test.js (4 primeras semillas) + estudia en orden fijo, levanta la Escuela y pone 30 sabios.
// Debe ganar ≥3/4 y no tomar Carthago, de media, más de 10 años antes que el agresivo normal.
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const botMercado = require('./bot-mercado.js');   // CE2
const D = require('../js/data.js'); const G = require('../js/game.js'); const { Battle } = require('../js/battle.js');
const mulberry32 = a => function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const CAMINO = ['griego', 'apio', 'castra', 'E2', 'quinque', 'corvus', 'fasti', 'vina', 'pilum', 'E3', 'latif', 'sambuca', 'astilleros', 'medicina', 'E4', 'magon', 'perseo', 'acoger', 'hormigon'];
const SEMILLAS = [1, 2, 3, 4], BASE = [174, 145, 170, 182];   // año final del agresivo normal (sim.test.js; V10a: V174 d145 V170 V182)

function campana(inv, seed) {
  const rnd0 = Math.random; Math.random = mulberry32(seed);
  try {
    const s = G.newGame('Test'); const meta = G.region().capitalRival;
    const dist = {}; dist[meta] = 0; for (let q = [meta], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
    let guard = 0, i = 0, escuela = false;
    while (!G.finDePrueba() && !(G.campanaLarga() && G.yearOf(s.t) <= 150) && guard++ < 5000) {   // ES20: por estaciones: pulsa «Pasar estación», resuelve las batallas y ordena
      if (guard > 1) G.pasarEstacion();
      while (s.pending.length && !s.over) { const b = new Battle(G.battleInfo(s.pending[0]).cfg); b.finish(); G.applyBattle(b.result()); }
      if (inv) {
        if (!s.inv.cola && i < CAMINO.length) { const r = G.invUp(CAMINO[i]); if (r.ok) i++; else if (/Ya estás|Cerrada|Pide la Edad/.test(r.motivo) && !/Faltan|Pide:/.test(r.motivo)) i++; }
        const c = s.cities.roma;
        if (!escuela && s.inv.hechas.griego !== undefined && !c.obras.length) {
          const E = G.ciudadE('roma'); if (E && E.fundada) { for (let dx = -170; dx <= 170 && !escuela; dx += 20) for (let dz = -170; dz <= 170 && !escuela; dz += 20) { const x = E.foro.x + dx, z = E.foro.z + dz, n = G.notaSitio('roma', 'escuela', x, z); if (n && n.vale && G.colocar('roma', 'escuela', x, z).ok) escuela = true; } }
        }
        if (c.b.escuela && (!c.sabios || c.sabios.dot < 3)) G.setSabios('roma', 3, 'ple');
      }
      for (const id of G.myCities()) {
        const c = s.cities[id];
        if (G.enRevuelta && G.enRevuelta(c)) c.nec.mem.forEach((m, k) => { if (m && m.revuelta) for (const r of ['grano', 'juegos', 'tropas']) if (G.calmarRevuelta(id, k, r).ok) break; });   // CDe2: como el bot de sim.test.js, calma las revueltas de barrio
        { let hechos = 0; if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['hastati', 'principes', 'triarii', 'equites']) { if (G.unitOk(c, k)) { const n = Math.min(150, G.maxTrain(k), G.recruits(c)); if (n >= 10 && G.train(id, k, n) && ++hechos >= 2) break; } } }   // ES20: como test/campana-bot.js
        { const E = G.ciudadE(id), bi = E && G.barrioInfo(c);      // CI1b: como un jugador (y como el bot de sim.test.js), si a un barrio le falta agua pone una fuente
          if (bi && G.huecosLibres(c) > 0 && bi.barrios.some(x => /agua/.test(x.falta || '')) && E.edificios.filter(e => e.tipo === 'fuente').length < 1 + bi.barrios.reduce((n, x) => n + x.casas, 0) / 25) {
            const q = require('../js/ciudad.js').mejorSitio(E, 'fuente'); if (q) G.colocar(id, 'fuente', q[0], q[1]); } }
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
      botMercado(G, D);   // CE2: compra hierro y vende lo que sobra (test/bot-mercado.js); ES20: una vez por estación, tras ordenar
    }
    if (!s.over && G.campanaLarga()) s.over = { win: !!(s.caminos && s.caminos.victoria), why: 'fin de prueba' };   // CE10: sin plazo ni final por Cartago, el bot para en G.finDePrueba()
    assert(s.over, 'la campaña debe terminar');
    return { win: !!s.over.win, year: G.yearOf(s.t), saberes: Object.keys(s.inv.hechas).length, escuela: !!s.cities.roma.b.escuela };
  } finally { Math.random = rnd0; }
}
const r = SEMILLAS.map(sd => campana(true, sd));
console.log('Investigador →', r.map(x => (x.win ? 'V' : 'd') + x.year + '(' + x.saberes + (x.escuela ? '+E' : '') + ')').join(' '), '| agresivo normal →', BASE.map(y => y + '').join(' '));
const gana = r.filter(x => x.win).length, media = r.reduce((a, x) => a + x.year, 0) / r.length, mediaB = BASE.reduce((a, y) => a + y, 0) / BASE.length;
// Relajado hasta CE12 (usuario, 19/11: no se exige ganar al bot hasta el ajuste final). Medido tras CE3+CE6: 1/4.
if (gana < 1) console.log('  aviso: ' + 'el investigador debe ganar al menos 1 de 4 hasta CE12 (medido 1/4; antes de CE3, 2/4) (' + gana + '/4)');   // CDe4: con CE10 tomar Cartago ya no gana; el mínimo de victorias vuelve con CE12 (equilibrio de caminos)
assert(r.every(x => x.escuela && x.saberes >= 3), 'debe levantar la Escuela y estudiar');
// CI1b: la media es la de las victorias (tomar Carthago); antes metía las derrotas con el año en que acaba la partida y una derrota que aguanta más parecía una toma temprana
const ws = r.filter(x => x.win), mediaW = ws.length ? ws.reduce((a, x) => a + x.year, 0) / ws.length : mediaB;
assert(mediaB - mediaW <= 10, 'no debe tomar Carthago más de 10 años antes de media (' + mediaB + ' vs ' + mediaW + ')');
console.log('APTO · investigador ' + gana + '/4, año medio ' + media + ' frente a ' + mediaB);
