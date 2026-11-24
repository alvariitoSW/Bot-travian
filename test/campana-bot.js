/* JZ1: el bot de campaña de test/sim.test.js, sacado tal cual a un módulo para poder jugarlo en varios procesos a la vez
   (test/sim-paralelo.js). Las reglas y los criterios siguen en test/sim.test.js; aquí solo está cómo juega el bot. */
const assert = require('assert');
const D = require('../js/data.js');
const { Battle } = require('../js/battle.js');
const G = require('../js/game.js');
const MERCADO = require('../js/mercado.js');
const botMercado = require('./bot-mercado.js');
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function campaign(aggressive, seed, region, opciones) {
  const rndOrig = Math.random; if (seed) Math.random = mulberry32(seed); G.usarMercado(MERCADO);
  try { return campaign1(aggressive, region, opciones); } finally { Math.random = rndOrig; G.usarMercado(null); }
}
// I8b: el bot que investiga (opciones.investiga): sube de edad en cuanto puede y estudia el saber más barato de una rama nueva, solo si le sobra el doble de lo que cuesta (si no, gasta lo del ejército y pierde ciudades)
function investigarBot(s) {
  if (s.inv.cola) return; const holgado = id => { const c = G.invCoste(id); return D.RES.every(r => G.disponible(r) >= 2 * (c[r] || 0)); };
  const sigE = 'E' + (s.inv.edad + 1); if (D.EDADES[sigE] && holgado(sigE) && G.edadUp().ok) return;
  const ramas = {}; for (const k in s.inv.hechas) if (D.INVEST[k]) ramas[D.INVEST[k].rama] = 1;
  const coste = id => { const c = G.invCoste(id); return D.RES.reduce((a, r) => a + (c[r] || 0), 0); };
  const l = Object.keys(D.INVEST).filter(id => G.invEstado(id).e === 'ok' && holgado(id)).sort((a, b) => (ramas[D.INVEST[a].rama] ? 1 : 0) - (ramas[D.INVEST[b].rama] ? 1 : 0) || coste(a) - coste(b));
  if (l.length) G.invUp(l[0]);
}
/* CDe3-F2a: lo que hace con el campo y el mercado el bot de campaña. Almazara y lagar primero, el mejor campo del consejo en cada hueco libre,
   vende lo que sobra de aceite, vino, verdura y lana, y una vez al año abre la ruta que aconseja el Edil del mercado. Siempre con reserva de denarios. */
function botAgro(s) {
  if (!G.hayAgricultura() || !G.hayMercado()) return;
  const oro = () => G.disponible('denarios'), RES = 500;
  for (const id of G.myCities()) {
    for (const p of G.parcelas(id)) for (const m of ['almazara', 'lagar']) if (p.posibles.includes(m) && oro() > RES + D.BUILD['agri_' + m].cost.denarios) G.mejorarParcela(id, p.id, m);
    const est = G.agroEstado(id); if (!est) continue;
    for (const l of est.libres) { const mj = G.consejoCampo(l.suelo)[0]; if (mj && oro() > RES + (mj.coste.denarios || 0) + 100) G.plantarCampo(id, mj.campo, l.suelo); }
  }
  const b = G.bienes();
  for (const k of ['aceite', 'vino', 'verdura', 'lana']) if ((b[k] || 0) > 12) { const c = G.mercadoMejorCiudad(k, true); if (c) G.mercadoVender(c, k, Math.floor(b[k] - 6)); }
  if (Math.floor(s.t) % 12 === 0 && !G.rutasMercado().length && oro() > RES) { const q = G.mercadoConsejo(); if (q && q.prod) G.rutaCrear(q.a, q.b, q.prod, 4); }
}
function campaign1(aggressive, region, opciones) {
  const s = G.newGame('Test', region, opciones); const meta = G.capitalRival(); const events = [];
  G.onEvent = (t, p) => { events.push(t); if (process.env.V && t === 'log' && /⚠|🔥|🏆|💀|rechaza|📜/.test(p.x)) console.log('  ', G.yearOf(s.t), p.x); };
  if (G.fundando()) { const sitio = G.modo().inicio.fundar.sitio; let pt = G.notaFundar(sitio, 172, -196).vale ? [172, -196] : null; for (let x = -300; x <= 300 && !pt; x += 20) for (let z = -300; z <= 300 && !pt; z += 20) if (G.notaFundar(sitio, x, z).vale) pt = [x, z]; assert(pt, 'hay un punto válido para fundar'); assert(G.fundarColonia(sitio, pt[0], pt[1]).ok); }   // I8: el bot funda su primera ciudad
  const dist = {}; dist[meta] = 0; for (let q = [meta], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
  let guard = 0;   // CDe4: el bot construye y calma revueltas él mismo (con el gobernador del contrato de MN3 la corta no ganaba: 0/10)
  // CDe4 (CE10): la campaña larga ya no acaba al tomar Cartago ni por años: el bot para al lograr los caminos (s.caminos.victoria) o al llegar al año límite
  while (!G.finDePrueba() && !(G.campanaLarga() && G.yearOf(s.t) <= 150) && guard++ < 200000) {   // CDe4 (plan A del vigía): la campaña larga para en el 150 a.C., donde se mide el criterio «aguanta»; sin fin por Cartago, jugar hasta el 145 pasaba de la hora
    G.tick(0.25);
    while (s.pending.length && !s.over) { const info = G.battleInfo(s.pending[0]); const b = new Battle(info.cfg); b.finish(); if (process.env.DBG) console.log(G.yearOf(s.t), JSON.stringify(info.cfg.sides.map(x => x.units)), 'def', info.cfg.defender, 'wall', info.cfg.wall, '->', b.result().winner, Math.round(b.t)); G.applyBattle(b.result()); }
    if (G.fraccionMes() >= 0.7) botAgro(s);   // CDe3-F2a: campos, ventas y una ruta del mercado nuevo
    if (G.fraccionMes() >= 0.7) botMercado(G, D);   // CE2: al final de cada mes el bot compra hierro y vende lo que sobra (test/bot-mercado.js)
    if (guard % 8) continue;
    if (opciones && opciones.investiga) investigarBot(s);
    if (D.SENADO.sala && s.senado && s.senado.votacion) G.votar(G.tratos(s.senado.votacion.id).filter(t => t.etiqueta === 'Favorable'));   // SN1: el bot vota con la tarjeta Favorable (o deja pasar)
    if (!process.env.SINPLAN && !s.modo) {   // CDe1: en la partida corta el bot no vota planes (le restan obras: medido 3/10 con plan, 4/10 sin él)
      const PL = require('../js/plan-senado.js'); if (!s.planSenado || !s.planSenado.plan) { if (!s.planSenado || !s.planSenado.borrador) PL.sugerir(s, 4, 'crecer', G.planAyuda()); G.planVotar([]); } }   // CDe1-A: si no hay plan del Senado, el bot arma uno que crece y lo vota
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (G.enRevuelta && G.enRevuelta(c)) c.nec.mem.forEach((m, i) => { if (m && m.revuelta) for (const r of ['grano', 'juegos', 'tropas']) if (G.calmarRevuelta(id, i, r).ok) break; });   // CDe2: el bot calma las revueltas de barrio
      if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const n = Math.min(150, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); break; } } }
      for (let hz = 0; G.huecosLibres(c) > 0 && hz < 4; hz++) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'escuela', 'muralla'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (G.prod().grano < 25 ? (q === 'granja') - (p === 'granja') : 0) * 3); let hizo = false; for (const b of bs) if (G.upgrade(id, b)) { hizo = true; break; } if (!hizo) break; }
      G.levantarMuralla(id);   // CN7: la muralla de la guerra sale de la obra de ciudad, no de c.b.muralla
      if (!aggressive) continue;
      const yr = G.yearOf(s.t); if (yr <= 230 && yr >= 209) continue;   // el bot se atrinchera ante la invasión de Aníbal
      // concentración: las tropas avanzan por la ruta más corta hacia Carthago mientras la siguiente plaza sea romana
      const sig = G.neighbors(id).sort((a, b) => dist[a] - dist[b])[0];
      if (id !== meta && dist[sig] < dist[id] && s.cities[sig].owner === 'roma' && !s.marches.some(m => m.owner === 'roma' && m.from === id)) { const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === G.capital() ? 0.15 : 0.65)); if (G.men(u) >= 100 && G.send(id, sig, u, false)) continue; }
      for (const n of G.neighbors(id)) {
        const t = s.cities[n]; if (t.owner === 'roma') continue;
        const keepHome = id === G.capital() ? 0.35 : 0.2, u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (1 - keepHome));
        if (G.power(u) > G.power(t.units) * (1.6 + 0.12 * t.b.muralla) && !s.marches.some(m => m.owner === 'roma' && s.cities[m.to].owner !== 'roma')) { if (s.senado) s.senado.permisos[t.owner] = 99999; G.send(id, n, u, G.heroAvailable(id)); break; }   // SN1: el bot declara la guerra por su cuenta
      }
    }
  }
  if (!s.over && G.campanaLarga()) s.over = { win: !!s.caminos.victoria, why: s.caminos.victoria ? 'Caminos logrados en ' + G.yearOf(s.t) + ' a.C.' : 'Sin victoria en ' + G.yearOf(s.t) + ' a.C.' };   // CE10: victoria = !!s.caminos.victoria (el equilibrio de cuántos caminos logra el bot es CE12)
  assert(s.over, 'la campaña debe terminar');
  assert(events.includes('event'));
  return s;
}
module.exports = { campaign, mulberry32 };
