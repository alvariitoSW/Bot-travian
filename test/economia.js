/* Juez de la economía (CE2): node test/economia.js [--n 5] [--modo corta|larga]
   El bot de test/sim.test.js (el mismo que gana la campaña) juega la partida corta y la campaña larga, agresivo y pasivo.
   Mide, por modo:
   - % de cada recurso perdido por el tope del almacén en toda la partida (perdido al cerrar el mes / lo que entró: producción, botín,
     compras y ventas en el mercado), y de los bienes;
   - % de estaciones (3 meses) en que FALTA al menos uno: una obra o recluta que el bot quiso y no pudo pagar,
     una cuota detenida por falta de fondos, o el grano a cero con la producción en negativo;
   - si gana y en qué año acaba.
   Criterio CE1 §5: ningún recurso pierde más del 10 %; en 7 de cada 10 estaciones falta alguno; el bot sigue ganando. */
const D = require('../js/data.js');
const { Battle } = require('../js/battle.js');
const G = require('../js/game.js');
const CIMOD = require('../js/ciudad.js');
const botMercado = require('./bot-mercado.js');
// para afinar: CE2_SET='HIERRO_COMPRA=0.8,SOBRA_MUL=0.6' cambia constantes de D antes de jugar (no se guarda nada)
for (const kv of (process.env.CE2_SET || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='), p = k.split('.'); let o = D; while (p.length > 1) o = o[p.shift()]; o[p[0]] = +v; }   // admite rutas: MODOS.corta.inicio.enPie.factores.guarnicion=3

const arg = (k, def) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : def; };
const N = +arg('n', 5), SOLO = arg('modo', null), BOT = arg('bot', null);   // --bot agresivo|pasivo
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// medida de una partida: se reinicia en cada partida
let M = null;
const nuevaMedida = () => ({ gan: {}, per: {}, bGan: 0, bPer: 0, est: new Set(), falta: new Set(), porQue: {} });
const estacion = () => Math.floor(G.state.t / 3);
function marcaFalta(por) { if (!M) return; const e = estacion(); M.falta.add(e); M.porQue[por] = (M.porQue[por] || 0) + 1; }
// recurso que falta en un coste (para saber de qué falta)
const queFalta = c => { for (const r in c) if (G.disponible(r) < c[r]) return r; return null; };

// envoltorios: no cambian la lógica, solo cuentan
const cierreOrig = G.cierreMes;
G.cierreMes = function () {
  const s = G.state, b0 = s.bienesPerdidos || 0;
  cierreOrig.apply(G, arguments);
  if (!M) return; const e = (s.informe || [])[(s.informe || []).length - 1];
  if (e && e.r) for (const r in e.r) { M.gan[r] = (M.gan[r] || 0) + (e.r[r].gan || 0); M.per[r] = (M.per[r] || 0) + (e.r[r].per || 0); }
  if (s.bienesGan !== undefined) { M.bGan = s.bienesGan; M.bPer = s.bienesPerdidos || 0; }
};
// entradas que no son producción (botín, compras y ventas): se suman al divisor del % perdido
const stock = r => (G.state.res[r] || 0) + ((G.state.alm && G.state.alm[r]) || 0);
const suma = (r, n) => { if (M && n > 0) M.gan[r] = (M.gan[r] || 0) + n; };
const abOrig = G.applyBattle; G.applyBattle = function () { const a = {}; for (const r of D.RES) a[r] = stock(r); const o = abOrig.apply(G, arguments); for (const r of D.RES) suma(r, stock(r) - a[r]); return o; };
const trOrig = G.trade; G.trade = function (from, to) { const got = trOrig.apply(G, arguments); suma(to, got); return got; };
if (G.venderBien) { const vbOrig = G.venderBien; G.venderBien = function () { const got = vbOrig.apply(G, arguments); suma('denarios', got); return got; }; }
let enObra = false;
const caOrig = G.canAfford;
G.canAfford = function (c) { const ok = caOrig(c); if (!ok && enObra) { enObra = false; marcaFalta('obra:' + queFalta(c)); } return ok; };

function partida(aggressive, seed, region, opciones) {
  const rndOrig = Math.random; Math.random = mulberry32(seed);
  try { return partida1(aggressive, region, opciones); } finally { Math.random = rndOrig; }
}
function partida1(aggressive, region, opciones) {
  const s = G.newGame('Test', region, opciones); const meta = G.capitalRival(); M = nuevaMedida();
  G.onEvent = (t, p) => { if (t === 'log' && p && /detenida por falta|Sin (oro|denarios) para pagar/.test(p.x)) marcaFalta('cuota'); };
  if (G.fundando()) { const sitio = G.modo().inicio.fundar.sitio; let pt = null; for (let x = -300; x <= 300 && !pt; x += 20) for (let z = -300; z <= 300 && !pt; z += 20) if (G.notaFundar(sitio, x, z).vale) pt = [x, z]; G.fundarColonia(sitio, pt[0], pt[1]); }
  const dist = {}; dist[meta] = 0; for (let q = [meta], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
  let guard = 0;
  while (!G.finDePrueba() && guard++ < 200000) {
    G.tick(0.25); M.est.add(estacion());
    if (process.env.DBG_ANIO && s.t % 12 < 0.25) { const p = G.prod(); console.log(G.yearOf(s.t), 'ciud', G.myCities().length, 'hombres', G.men(G.myCities().reduce((u, id) => { for (const k in s.cities[id].units) u[k] = (u[k] || 0) + s.cities[id].units[k]; return u; }, {})), 'disp', D.RES.map(r => r[0] + Math.round(G.disponible(r))).join(' '), 'prod', D.RES.map(r => r[0] + Math.round(p[r])).join(' '), 'rate', G.tradeRate().toFixed(2)); }
    if (s.res.grano + s.alm.grano <= 0 && G.prod().grano < 0) marcaFalta('grano');
    while (s.pending.length && !s.over) { const info = G.battleInfo(s.pending[0]); const b = new Battle(info.cfg); b.finish(); G.applyBattle(b.result()); }
    if (G.bienes && G.fraccionMes() >= 0.7) botMercado(G, D);   // CE2: al final de cada mes el bot compra hierro y vende lo que sobra (solo con la economía nueva)
    if (guard % 8) continue;
    if (D.SENADO.sala && s.senado && s.senado.votacion) G.votar(G.tratos(s.senado.votacion.id).filter(t => t.etiqueta === 'Favorable'));
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (c.train.length < 4 && G.prod().grano > 8) {
        let hizo = false, quiso = false, falto = null;
        for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { if (G.recruits(c) >= 10) quiso = true; const n = Math.min(150, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); hizo = true; break; } else if (!falto) falto = queFalta(G.unitCost(k, 10)); } }
        if (quiso && !hizo) marcaFalta('recluta:' + falto);
      }
      for (let hz = 0; G.huecosLibres(c) > 0 && hz < 4; hz++) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'escuela', 'muralla'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (G.prod().grano < 25 ? (q === 'granja') - (p === 'granja') : 0) * 3); let hizo = false; for (const b of bs) { enObra = true; const ok = G.upgrade(id, b); enObra = false; if (ok) { hizo = true; break; } } if (!hizo) break; }
      G.levantarMuralla(id);
      if (!aggressive) continue;
      const yr = G.yearOf(s.t); if (yr <= 230 && yr >= 209) continue;
      const sig = G.neighbors(id).sort((a, b) => dist[a] - dist[b])[0];
      if (id !== meta && dist[sig] < dist[id] && s.cities[sig].owner === 'roma' && !s.marches.some(m => m.owner === 'roma' && m.from === id)) { const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === G.capital() ? 0.15 : 0.65)); if (G.men(u) >= 100 && G.send(id, sig, u, false)) continue; }
      for (const n of G.neighbors(id)) {
        const t = s.cities[n]; if (t.owner === 'roma') continue;
        const keepHome = id === G.capital() ? 0.35 : 0.2, u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (1 - keepHome));
        if (G.power(u) > G.power(t.units) * (1.6 + 0.12 * t.b.muralla) && !s.marches.some(m => m.owner === 'roma' && s.cities[m.to].owner !== 'roma')) { if (s.senado) s.senado.permisos[t.owner] = 99999; G.send(id, n, u, G.heroAvailable(id)); break; }
      }
    }
  }
  if (!s.over && G.campanaLarga()) s.over = { win: !!(s.caminos && s.caminos.victoria), why: 'fin de prueba' };   // CE10
  G.onEvent = null; const m = M; M = null;
  return { s: s, m: m };
}

const MODOS = [
  { id: 'corta', n: 'Partida corta (en pie)', region: null, opc: { modo: 'corta', inicio: 'enPie' }, ciudad: true },
  { id: 'larga', n: 'Campaña larga (Mediterráneo)', region: undefined, opc: undefined, ciudad: true }   // como test/sim.test.js: la campaña corre con la ciudad nueva
];
const pct = (a, b) => b > 0 ? Math.round(1000 * a / b) / 10 : 0;
const filas = [];
for (const mo of MODOS) {
  if (SOLO && SOLO !== mo.id) continue;
  G.usarCiudad(mo.ciudad ? CIMOD : null);
  for (const ag of [true, false]) {
    if (BOT && BOT !== (ag ? 'agresivo' : 'pasivo')) continue;
    const gan = {}, per = {}; let bG = 0, bP = 0, est = 0, fal = 0, vict = 0; const anios = [], porQue = {};
    for (let sd = 1; sd <= N; sd++) {
      const { s, m } = partida(ag, sd, mo.region, mo.opc);
      for (const r in m.gan) { gan[r] = (gan[r] || 0) + m.gan[r]; per[r] = (per[r] || 0) + m.per[r]; }
      bG += m.bGan; bP += m.bPer; est += m.est.size; fal += m.falta.size; if (s.over && s.over.win) vict++; anios.push((s.over && s.over.win ? 'V' : 'd') + G.yearOf(s.t));
      for (const k in m.porQue) porQue[k] = (porQue[k] || 0) + m.porQue[k];
    }
    const perdido = D.RES.map(r => r + ' ' + pct(per[r] || 0, gan[r] || 0) + ' %').join(', ') + (bG ? ', bienes ' + pct(bP, bG) + ' %' : '');
    const f = { modo: mo.n, bot: ag ? 'agresivo' : 'pasivo', perdido: perdido, falta: pct(fal, est), gana: vict + '/' + N, anios: anios.join(' '), porQue: porQue };
    filas.push(f);
    console.log(f.modo + ' · ' + f.bot + ': perdido [' + f.perdido + '] · falta algo en ' + f.falta + ' % de estaciones · gana ' + f.gana + ' · ' + f.anios);
    console.log('   motivos (veces): ' + Object.keys(porQue).sort((a, b) => porQue[b] - porQue[a]).map(k => k + ' ' + porQue[k]).join(', '));
  }
}
G.usarCiudad(null);
if (process.argv.includes('--md')) {
  console.log('\n| Modo | Bot | % perdido por recurso | % estaciones con falta | Gana | Años finales |\n|---|---|---|---|---|---|');
  for (const f of filas) console.log('| ' + f.modo + ' | ' + f.bot + ' | ' + f.perdido + ' | ' + f.falta + ' % | ' + f.gana + ' | ' + f.anios + ' |');
}
