/* PN3e: el bot de polis. Juega una partida de polis (contra las otras 7 polis griegas) como un jugador razonable que solo se defiende:
   levanta mercado y cuartel, sube lo más bajo (granja primero si falta grano), recluta hoplitas, peltastas y su tropa propia, y compra
   hierro en el mercado para la leva siguiente. Las Minas de Eubea solo se levantan donde hay veta (Calcis).
   Uso: const { jugarPolis } = require('./polis-bot.js'); jugarPolis('atenas', 3, { anos: 15, compraHierro: true })
   Devuelve { polis, semilla, cae: año a.C. o null, hombres a los N años, hombres máximos, hierro comprado }. Lo usa test/polis-equilibrio.mjs. */
const D = require('../js/data.js');
const G = require('../js/game.js');
const MERCADO = require('../js/mercado.js');
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const TROPAS = p => { const l = ['hoplitas', 'peltastas']; const t = D.POLIS[p].tropa.id; if (l.indexOf(t) < 0) l.push(t); return l; };
const PRIMERO = ['mercado', 'cuartel'];   // el mercado abre la compra de hierro; el cuartel, la leva
const NUNCA = ['herreria', 'escuela', 'muralla'];

function construir(id, c) {
  for (let hz = 0; G.huecosLibres(c) > 0 && hz < 4; hz++) {
    let hizo = false;
    for (const b of PRIMERO) if (!(c.b[b] > 0) && G.upgrade(id, b)) { hizo = true; break; }
    if (!hizo) {
      const falta = G.prod().grano < 10;
      const bs = Object.keys(D.BUILD).filter(b => NUNCA.indexOf(b) < 0 && (c.b[b] || 0) < D.MAX_LVL)
        .sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (falta ? ((q === 'granja') - (p === 'granja')) * 3 : 0));
      for (const b of bs) if (G.upgrade(id, b)) { hizo = true; break; }
    }
    if (!hizo) break;
  }
  G.levantarMuralla(id);
}
function reclutar(id, c, p) {
  if (c.train.length >= 3 || G.prod().grano < 2) return;
  let hechos = 0;
  for (const k of TROPAS(p)) {
    if (!G.unitOk(c, k)) continue;
    const n = Math.min(60, G.maxTrain(k, id), G.recruits(c));
    if (n >= 5 && G.train(id, k, n) && ++hechos >= 2) break;
  }
}
/* compra el hierro de 40 hoplitas (o de la tropa que más pida), guardando denarios para la paga. Devuelve lo comprado. */
function comprarHierro(p) {
  const s = G.state; let got = 0;
  if (!G.tradeRate() && !G.myCities().some(id => G.mercadoPuede && !G.mercadoPuede(id))) return 0;
  let quiere = 0; for (const k of TROPAS(p)) quiere = Math.max(quiere, (D.UNITS[k].cost.hierro || 0) * 40);
  for (let k = 0; k < 6; k++) {
    const falta = quiere - G.disponible('hierro'); if (falta <= 0) break;
    const reserva = 120 + 3 * Math.max(0, -G.prod().denarios), gastable = G.disponible('denarios') - reserva; if (gastable < 20) break;
    const n = G.trade('denarios', 'hierro', Math.min(gastable, Math.ceil(falta * 2))); if (!n) break; got += n;
  }
  return got;
}
function resolver(s) { while (s.pending.length && !s.over) G.resolverPendiente(); }

function jugarPolis(p, semilla, o) {
  o = Object.assign({ anos: 15, compraHierro: true }, o || {});
  const rnd0 = Math.random; Math.random = mulberry32(semilla); G.usarMercado(MERCADO);
  try {
    const s = G.newGame('Bot', 'italia', { polis: p, semilla, dificultad: 'normal', asesor: false }); G.onEvent = null; G.turnos = true; s.turnos = true;
    const y0 = G.yearOf(s.t), est = Math.round(o.anos * 12 / (D.TURNO_MESES || 3));
    let cae = null, max = 0, hierro = 0, hombres = 0;
    for (let i = 0; i < est; i++) {
      resolver(s); if (s.over) break;
      const c = s.cities.roma; if (!c || c.owner !== 'roma') break;
      construir('roma', c); reclutar('roma', c, p);
      if (o.compraHierro) hierro += comprarHierro(p);
      G.pasarEstacion(); resolver(s);
      const c2 = s.cities.roma; hombres = c2 && c2.owner === 'roma' ? G.men(c2.units) : 0; max = Math.max(max, hombres);
      if (s.over || !c2 || c2.owner !== 'roma') { cae = G.yearOf(s.t); break; }
    }
    return { polis: p, semilla, anio0: y0, cae, anos: cae == null ? o.anos : y0 - cae, hombres, max, hierro, veta: G.vetaHierro('roma') };
  } finally { Math.random = rnd0; G.usarMercado(null); G.onEvent = null; }
}
module.exports = { jugarPolis, mulberry32 };
