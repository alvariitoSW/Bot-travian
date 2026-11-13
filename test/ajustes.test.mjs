// AQVILA — CN14-B: ajustes y dificultades. Bot agresivo y pasivo por nivel: node test/ajustes.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const { Battle } = require('../js/battle.js'); const G = require('../js/game.js');
const fallos = [];
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function campaign(aggressive, seed, region, dif) {
  const rndOrig = Math.random; if (seed) Math.random = mulberry32(seed);
  try { return campaign1(aggressive, region, dif); } finally { Math.random = rndOrig; }
}
function campaign1(aggressive, region, dif) {
  const s = G.newGame('Test', region, { dificultad: dif }); const meta = G.region().capitalRival; const events = [];
  G.onEvent = (t, p) => { events.push(t); if (process.env.V && t === 'log' && /⚠|🔥|🏆|💀|rechaza|📜/.test(p.x)) console.log('  ', G.yearOf(s.t), p.x); };
  const dist = {}; dist[meta] = 0; for (let q = [meta], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
  let guard = 0;
  while (!s.over && guard++ < 200000) {
    G.tick(0.25);
    while (s.pending.length && !s.over) { const info = G.battleInfo(s.pending[0]); const b = new Battle(info.cfg); b.finish(); if (process.env.DBG) console.log(G.yearOf(s.t), JSON.stringify(info.cfg.sides.map(x => x.units)), 'def', info.cfg.defender, 'wall', info.cfg.wall, '->', b.result().winner, Math.round(b.t)); G.applyBattle(b.result()); }
    if (guard % 8) continue;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const n = Math.min(150, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); break; } } }
      for (let hz = 0; G.huecosLibres(c) > 0 && hz < 4; hz++) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'escuela', 'muralla'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (G.prod().grano < 25 ? (q === 'granja') - (p === 'granja') : 0) * 3); let hizo = false; for (const b of bs) if (G.upgrade(id, b)) { hizo = true; break; } if (!hizo) break; }
      G.levantarMuralla(id);   // CN7: la muralla de la guerra sale de la obra de ciudad, no de c.b.muralla
      if (!aggressive) continue;
      const yr = G.yearOf(s.t); if (yr <= 230 && yr >= 209) continue;   // el bot se atrinchera ante la invasión de Aníbal
      // concentración: las tropas avanzan por la ruta más corta hacia Carthago mientras la siguiente plaza sea romana
      const sig = G.neighbors(id).sort((a, b) => dist[a] - dist[b])[0];
      if (id !== meta && dist[sig] < dist[id] && s.cities[sig].owner === 'roma' && !s.marches.some(m => m.owner === 'roma' && m.from === id)) { const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === "roma" ? 0.15 : 0.65)); if (G.men(u) >= 100 && G.send(id, sig, u, false)) continue; }
      for (const n of G.neighbors(id)) {
        const t = s.cities[n]; if (t.owner === 'roma') continue;
        const keepHome = id === 'roma' ? 0.35 : 0.2, u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (1 - keepHome));
        if (G.power(u) > G.power(t.units) * (1.6 + 0.12 * t.b.muralla) && !s.marches.some(m => m.owner === 'roma' && s.cities[m.to].owner !== 'roma')) { G.send(id, n, u, G.heroAvailable(id)); break; }
      }
    }
  }
  assert(s.over, 'la campaña debe terminar');
  assert(events.includes('event'));
  return s;
}

const SEM_AGR = [1, 2, 3, 4, 5], SEM_PAS = [1, 2];
const vic = {};   // vic[dif] = { agr, pas }
for (const dif of ['tranquila', 'normal', 'dura']) {
  const t0 = Date.now();
  const agr = SEM_AGR.map(sd => campaign(true, sd, undefined, dif)), pas = SEM_PAS.map(sd => campaign(false, sd, undefined, dif));
  const va = agr.filter(s => s.over.win).length, vp = pas.filter(s => s.over.win).length;
  vic[dif] = { agr: va, pas: vp };
  console.log(dif.padEnd(10), 'agresivo ' + va + '/' + SEM_AGR.length, 'pasivo ' + vp + '/' + SEM_PAS.length, ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  if (vp !== 0) fallos.push(dif + ': el pasivo no debe ganar nunca (' + vp + ')');
}
const n = vic.normal.agr;
if (n < 4) fallos.push('Normal: el agresivo debe ganar >= 4 de 5 (' + n + ')');
if (vic.tranquila.agr < n - 1) fallos.push('Tranquila debe ganar >= Normal - 1 (' + vic.tranquila.agr + ' vs ' + n + ')');
// Dura: umbral = medido - 1 (minimo 3). MEDIDO_DURA se fija tras medir (ver comentario)
const MEDIDO_DURA = 5;   // victorias del agresivo en Dura medidas (medido: Tranquila 5/5, Normal 5/5, Dura 5/5; umbral Dura = 4)
const UMBRAL_DURA = Math.max(3, MEDIDO_DURA - 1);
if (vic.dura.agr < UMBRAL_DURA) fallos.push('Dura: el agresivo debe ganar >= ' + UMBRAL_DURA + ' de 5 (' + vic.dura.agr + ')');

// Comprobaciones breves: cambiar ajustes a mitad de campaña deja seguir jugando
try {
  const s = G.newGame('Ajustes', undefined, { dificultad: 'tranquila', asesor: true });
  assert.strictEqual(G.ajustes().dif, 'tranquila');
  for (let i = 0; i < 400; i++) G.tick(0.25);
  for (const p of [{ dif: 'dura' }, { suc: { fuego: false } }, { asesor: false }, { dif: 'normal', suc: { crecida: false, hambre: false }, asesor: true }]) {
    const r = G.ponerAjustes(p); assert(r && r.ok !== false, 'ponerAjustes ' + JSON.stringify(p) + ' → ' + (r && r.motivo));
    for (let i = 0; i < 300; i++) G.tick(0.25);
  }
  assert.strictEqual(G.ajustes().dif, 'normal'); assert.strictEqual(G.ajustes().suc.fuego, false);
  assert(typeof G.sucesosEn === 'function' && typeof G.avisoMeses === 'function');
  assert(!G.ponerAjustes({ dif: 'imposible' }).ok, 'una dificultad inventada se rechaza');
  assert(JSON.parse(JSON.stringify(G.state)).ajustes, 'los ajustes se guardan');
} catch (e) { fallos.push('ajustes a mitad de campaña: ' + e.message); }

// Asesor y dificultades: lecciones, separación, reinicio y copia de reserva idéntica a D.DIFICULTAD
try {
  const A = require('../js/asesor.js'), Ci = await import('../js/ciudad.js');
  assert.strictEqual(A.LECCIONES.length, 8); assert.strictEqual(new Set(A.LECCIONES.map(l => l.id)).size, 8);
  assert(A.LECCIONES.every(l => l.texto.length <= 110 && typeof l.cuando === 'function'), 'texto de lección > 110 o sin cuando');
  const todo = { bandeja: true, cifra: true, cuotas: true, riesgo: true, barrioSube: true, almacenLleno: true, arrabal: true, turnos: 2 };
  assert.strictEqual(A.siguiente({ asesor: false }, todo), null); assert.strictEqual(A.siguiente(null, todo), null);
  assert.strictEqual(A.siguiente({ asesor: true }, Object.assign({}, todo, { colocando: true })), null);
  const a = { asesor: true, vistos: [] }; assert.strictEqual(A.siguiente(a, todo).id, 'bandeja');
  A.marcar(a, 'bandeja', { mes: 5, ahora: 1000 }); A.marcar(a, 'bandeja', { mes: 5, ahora: 1000 });
  assert.deepStrictEqual(a.vistos, ['bandeja']); assert.strictEqual(a.asesorMes, 5);
  assert.strictEqual(A.siguiente(a, Object.assign({ mes: 6, ahora: 2000 }, todo)), null, 'separación mínima');
  assert.strictEqual(A.siguiente(a, Object.assign({ mes: 8, ahora: 2000 }, todo)).id, 'cifra', '3 meses bastan');
  assert.strictEqual(A.siguiente(a, Object.assign({ mes: 6, ahora: 61000 }, todo)).id, 'cifra', '60 s bastan');
  A.marcar(a, 'cifra', { mes: 9, ahora: 70000 }); assert.notStrictEqual(A.siguiente(a, Object.assign({ mes: 20, ahora: 99999 }, todo)).id, 'cifra', 'no repite');
  A.repetir(a); assert.deepStrictEqual(a.vistos, []); assert.strictEqual(a.asesorMes, undefined);
  assert.strictEqual(A.siguiente(a, Object.assign({ mes: 0, ahora: 0 }, todo)).id, 'bandeja');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(Ci.DIF_RESERVA)), JSON.parse(JSON.stringify(D.DIFICULTAD)).constructor === Object ? Object.fromEntries(Object.entries(D.DIFICULTAD).map(([k, v]) => [k, { nombre: v.nombre, crecida: v.crecida, incendio: v.incendio, hambre: v.hambre, aviso: v.aviso }])) : null, 'DIF_RESERVA (ciudad.js) debe coincidir con D.DIFICULTAD (data.js)');
} catch (e) { fallos.push('asesor/dificultades: ' + e.message); }

/* E5: ambiente de la ciudad 3D (booleano, por defecto sí; migra partidas viejas) */
try {
  G.newGame('Test', undefined, {}); assert.strictEqual(G.ambiente(), true, 'por defecto encendido');
  delete G.state.ajustes.ambiente; assert.strictEqual(G.ajustes().ambiente, true, 'migra: partida vieja sin el campo');
  assert.strictEqual(G.ponerAjustes({ ambiente: false }).ok, true); assert.strictEqual(G.ambiente(), false);
  assert.strictEqual(G.ponerAjustes({ ambiente: 'no' }).ok, false, 'solo booleano'); assert.strictEqual(G.ambiente(), false);
  G.ponerAjustes({ ambiente: true }); assert.strictEqual(G.ambiente(), true);
} catch (e) { fallos.push('ambiente: ' + e.message); }

if (fallos.length) { console.log('FALLOS:\n - ' + fallos.join('\n - ')); process.exit(1); }
console.log('ajustes.test: bien');
