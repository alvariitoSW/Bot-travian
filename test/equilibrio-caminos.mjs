/* CE12 fase 1: banco de medida de los cuatro caminos de victoria (js/caminos.js).
   Uso: node test/equilibrio-caminos.mjs [--n 10] [--modo corta|larga] [--bot armas|comercio|politica|ciudad] [--hilos 4] [--var gob|viejo|hibrido (obras del bot; por defecto hibrido en armas y gob en los demás)] [--gobcada K (estaciones entre llamadas al gobernador fuera de la capital; por defecto 6 en armas y 2 en los demás)] [--json ruta]
   Cuatro bots (uno por camino) juegan N semillas por modo. Cada mes entero se llama a CAM.paso(s, CAM.foto(s, G), mes)
   (los caminos aún no están enganchados a game.js) y se apunta cuándo se logra, si se pierde y si llega la victoria (3 de 4).
   Es una MEDIDA: no falla por no cumplir las metas; solo sale con código 1 si una partida lanza una excepción.
   Base de los bots: campaign1 de test/sim.test.js, pero con el gobernador (GOB.estacion, pase de MN3) en vez de calmar a mano y
   del bucle de obras. Todo es licencia de juego de banco: no toca cifras. */
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const D = require('../js/data.js');
const { Battle } = require('../js/battle.js');
const G = require('../js/game.js');
const CAM = require('../js/caminos.js');
const GOB = require('../js/gobernador.js');
const MIN = require('../js/ministros.js');
const CI = require('../js/ciudad.js');
const DIP = require('../js/diplomacia.js');
const PL = require('../js/plan-senado.js');
const botMercado = require('./bot-mercado.js');

// ---- opciones de línea ----
const arg = (k, def) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : def; };
const N = parseInt(arg('n', '10'), 10), SOLO_MODO = arg('modo', ''), SOLO_BOT = arg('bot', ''), RUTA_JSON = arg('json', '');
const VAR = arg('var', ''), GOBCADA_ARG = parseInt(arg('gobcada', '0'), 10), SEMILLA = parseInt(arg('semilla', '0'), 10);
const BOTS = ['armas', 'comercio', 'politica', 'ciudad'];
const MODOS = [{ id: 'corta', n: 'Partida corta', region: 'italia', opc: { modo: 'corta' } }, { id: 'larga', n: 'Campaña larga', region: undefined, opc: undefined }];

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const CIUDADES_0 = JSON.stringify(D.CITIES);
const restaurarCiudades = () => { const c0 = JSON.parse(CIUDADES_0); for (const id in c0) if (D.CITIES[id]) for (const k of ['g', 'w', 'wl', 'f', 'post', 'en228']) if (c0[id][k] !== undefined) D.CITIES[id][k] = c0[id][k]; };

const TIEMPOS = { sitio: 0, nSitio: 0, nulos: 0, ok: 0, mal: 0, tipos: {} };   // PERFIL=1: dónde se va el tiempo
// copia de test/bot-mercado.js con la reserva de denarios a elegir (el bot de comercio guarda el tesoro)
function mercadoConReserva(reservaMin) {
  const s = G.state; if (!s || s.over) return; const rate = G.tradeRate();
  if (rate) for (const r of ['grano', 'materiales', 'hierro']) if (G.previsionCierre()[r].perdera >= 1) G.venderSobrante(r);
  const b = G.bienes();
  for (const k in b) { if (G.bienesPerdera()[k] >= 1) G.venderSobrante(k); const guarda = D.LUJO.indexOf(k) >= 0 ? D.BIEN_TOPE / 2 : 0; if (b[k] > guarda + 5) G.venderBien(k, b[k] - guarda); }
  if (!rate) return;
  let quiere = 0; for (const id of G.myCities()) { const c = s.cities[id]; for (const k of ['triarii', 'principes', 'equites', 'hastati']) if (G.unitOk(c, k)) { quiere = Math.max(quiere, (D.UNITS[k].cost.hierro || 0) * 150); break; } }
  const falta = quiere - G.disponible('hierro'); if (falta <= 0) return;
  const reserva = reservaMin + 3 * Math.max(0, -G.prod().denarios), gastable = G.disponible('denarios') - reserva; if (gastable < 20) return;
  G.trade('denarios', 'hierro', Math.min(gastable, Math.ceil(falta / (rate * D.HIERRO_COMPRA))));
}
// ---- ayuda y hacer del gobernador (copiados de gobierno/maquetas/gobernador/enganche.cjs) ----
function gobierno(s) {
  const ayuda = {
    barrios: c => { const E = G.ciudadE(c); if (!E) return []; return E.barrios.map((b, i) => { const x = G.necBarrio(c, i); return x ? { i, nombre: b.nombre, casas: E.parcelas.filter(l => l.casa && !l.casa.ruina && !l.fuera && l.barrio === i).length, cob: x.cob, mem: x.mem } : null; }).filter(Boolean); },
    huecosLibres: c => G.huecosLibres(s.cities[c]), prod: () => G.prod(), obras: c => s.cities[c].obras.map(o => o.pieza || o.b), disponible: r => G.disponible(r)
  };
  const hacer = {
    calmar: (c, i, r) => G.calmarRevuelta(c, i, r),
    obra: (c, t) => { if (CI.EDIF[t]) { const E = G.ciudadE(c); const t0 = process.hrtime.bigint(); const p = CI.mejorSitio(E, t); TIEMPOS.sitio += Number(process.hrtime.bigint() - t0) / 1e6; TIEMPOS.nSitio++; if (!p) TIEMPOS.nulos++; else { const rr = G.colocar(c, t, p[0], p[1]); TIEMPOS.ok += rr.ok ? 1 : 0; TIEMPOS.mal += rr.ok ? 0 : 1; TIEMPOS.tipos[t] = (TIEMPOS.tipos[t] || 0) + 1; return rr; } return p ? G.colocar(c, t, p[0], p[1]) : { ok: false, motivo: 'No hay sitio' }; } return { ok: !!G.upgrade(c, t), motivo: G.ultimoMotivo || 'Faltan recursos' }; },
    encargar: (mid, e) => MIN.encargar(s, mid, e)
  };
  return { ayuda, hacer };
}

// ---- una partida con un bot ----
function partida(bot, modo, seed) {
  const rndOrig = Math.random; Math.random = mulberry32(seed);
  try { return jugar(bot, modo); } finally { Math.random = rndOrig; }
}
function jugar(bot, modo) {
  restaurarCiudades(); G.usarCiudad(CI);
  const s = G.newGame('T', modo.region, modo.opc); G.onEvent = null;
  const meta = G.capitalRival(), aggressive = bot === 'armas';
  const GOBCADA = GOBCADA_ARG || (bot === 'armas' ? 6 : 2);   // armas conquista muchas ciudades: el gobernador solo vigila la capital cada estación
  const variante = VAR || (bot === 'armas' ? 'hibrido' : 'gob'), usaGob = variante !== 'viejo', usaViejo = variante !== 'gob';
  if (G.fundando()) { const sitio = G.modo().inicio.fundar.sitio; let pt = G.notaFundar(sitio, 172, -196).vale ? [172, -196] : null; for (let x = -300; x <= 300 && !pt; x += 20) for (let z = -300; z <= 300 && !pt; z += 20) if (G.notaFundar(sitio, x, z).vale) pt = [x, z]; if (!pt || !G.fundarColonia(sitio, pt[0], pt[1]).ok) throw new Error('no se pudo fundar'); }
  const dist = {}; dist[meta] = 0; for (let q = [meta], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
  const { ayuda, hacer } = gobierno(s);
  GOB.migrar(s); for (const id of G.myCities()) GOB.poner(s, id, true);
  const R = { variante, cartagoExiste: !!s.cities.carthago, capRival: meta, capRivalMes: null, max: {}, logro: {}, perdidas: {}, victoria: null, cartagoMes: null, mesFinal: 0, derrota: false, fotoFin: null, evFin: null, maxPlazas: 0 };
  BOTS.forEach(k => { R.logro[k] = null; R.perdidas[k] = 0; });
  let mesVisto = -1, guard = 0;
  const mesDe = t => Math.floor(t + 1e-9);
  const medir = () => {   // una vez por mes entero: el motor de caminos, como lo hará game.js
    const mes = mesDe(s.t); if (mes === mesVisto) return; mesVisto = mes;
    const f = CAM.foto(s, G), o = CAM.paso(s, f, mes);
    o.logra.forEach(k => { if (R.logro[k] === null) R.logro[k] = mes; });
    o.pierde.forEach(k => { R.perdidas[k]++; });
    if (o.gana && R.victoria === null) R.victoria = mes;
    if (f.cartago && R.cartagoMes === null) R.cartagoMes = mes;
    if (s.cities[meta] && s.cities[meta].owner === 'roma' && R.capRivalMes === null) R.capRivalMes = mes;
    CAM.evaluar(f).caminos.forEach(c => c.hitos.forEach(h => { const k = c.id + '.' + h.id; R.max[k] = Math.max(R.max[k] === undefined ? -1 : R.max[k], h.v); }));
    R.maxPlazas = Math.max(R.maxPlazas, f.plazas);
    if (usaGob && mes % D.TURNO_MESES === 0) {   // una vez por estación y ciudad propia (la capital siempre; las demás cada GOBCADA estaciones: mejorSitio de ciudad.js cuesta ~20 ms por obra)
      const est = Math.floor(mes / D.TURNO_MESES);
      for (const id of G.myCities()) {
        if (id !== G.capital() && est % GOBCADA !== 0) continue;
        if (!GOB.activo(s, id)) GOB.poner(s, id, true);
        GOB.estacion(s, id, mes, ayuda, hacer);
      }
    }
  };
  while (!s.over && guard++ < 200000) {
    G.tick(0.25);
    while (s.pending.length && !s.over) { const info = G.battleInfo(s.pending[0]); const b = new Battle(info.cfg); b.finish(); G.applyBattle(b.result()); }
    medir();
    if (G.fraccionMes() >= 0.7) { if (bot === 'comercio') mercadoConReserva(1500); else if (bot === 'politica') mercadoConReserva(1100);  else botMercado(G, D); }   // política: el bando mercader pide más de 1000 denarios
    if (guard % 8) continue;
    // Senado: vota Favorable
    if (D.SENADO.sala && s.senado && s.senado.votacion) G.votar(G.tratos(s.senado.votacion.id).filter(t => t.etiqueta === 'Favorable'));
    // plan del Senado: en la larga todos como el bot de sim; en la corta solo el político (a los demás les resta obras)
    if (!s.modo || bot === 'politica') { if (!s.planSenado || !s.planSenado.plan) { if (!s.planSenado || !s.planSenado.borrador) PL.sugerir(s, 4, 'crecer', G.planAyuda()); G.planVotar([]); } }
    if (bot === 'politica') accionesPolitica(s, hacer);
    if (bot === 'comercio') accionesComercio(s);
    if (bot === 'ciudad') accionesCiudad(s, hacer);
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (G.enRevuelta && G.enRevuelta(c) && (bot !== 'ciudad' || !usaGob)) c.nec.mem.forEach((m, i) => { if (m && m.revuelta) for (const r of ['grano', 'juegos', 'tropas']) if (G.calmarRevuelta(id, i, r).ok) break; });   // entre estaciones, como el bot viejo
      if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const n = Math.min(150, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); break; } } }
      if (usaViejo) for (let hz = 0; G.huecosLibres(c) > 0 && hz < 4; hz++) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'escuela', 'muralla'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (G.prod().grano < 25 ? (q === 'granja') - (p === 'granja') : 0) * 3); let hizo = false; for (const b of bs) if (G.upgrade(id, b)) { hizo = true; break; } if (!hizo) break; }   // el bucle de obras de sim.test.js
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
  if (!s.over) throw new Error('la partida no terminó');
  medir();
  const f = CAM.foto(s, G);
  R.mesFinal = mesDe(s.t); R.derrota = !s.over.win; R.fotoFin = f; R.evFin = CAM.evaluar(f);
  R.logradosFin = BOTS.filter(k => s.caminos.estado[k].logrado);
  R.diag = { prueba: (() => { const cap = G.capital(), o = {}; for (const b of ['almacen', 'templo', 'mercado']) { o[b] = [s.cities[cap].b[b], !!G.upgrade(cap, b), G.ultimoMotivo, (s.cities[cap].obras || []).length]; } return o; })(), pide: s.senado && s.senado.pide, actos: s.senado && s.senado.actos, planSeq: s.planSenado && s.planSenado.seq, historial: s.planSenado && s.planSenado.historial, humor: s.senado && s.senado.humor, favor: s.favor && s.favor.senado, plan: s.planSenado && s.planSenado.plan ? { e0: s.planSenado.plan.e0, n: s.planSenado.plan.obras.length, hechas: s.planSenado.plan.obras.filter(o => o.hecha).length, obras: s.planSenado.plan.obras.map(o => o.b + ' n' + o.nivel + ' c' + (s.cities[o.ciudad] && s.cities[o.ciudad].b[o.b]) + ' e' + o.est), avisos: s.planSenado.avisos.map(a => a.texto).slice(0, 4), foro: s.cities[G.capital()].b.foro, perdidas: s.planSenado.plan.obras.filter(o => o.perdida).length } : null, ciudades: G.myCities().length };
  R.anioFin = G.yearOf(s.t); R.porQue = String(s.over.why || "").slice(0, 60);
  return R;
}

// ---- lo que añade cada bot a la base ----
function accionesComercio(s) {
  for (const id of G.myCities()) {   // más mercados y puertos (G.rutaMax); almacén solo si el techo de denarios (G.cap) frena
    const c = s.cities[id];
    for (const b of ['mercado', 'puerto']) if ((c.b[b] || 0) < D.MAX_LVL && (b === 'mercado' || c.b.puerto > 0 || G.neighbors(id).some(n => { const e = G.edge(id, n); return e && e[2]; }))) G.upgrade(id, b);
    for (const n of G.neighbors(id)) { if (G.rutaPuede(id, n) === null) G.rutaAbrir(id, n); }   // rutas hasta donde deje G.rutaMax
  }
  if (G.cap() < CAM.CIFRAS.comercio.denarios * 1.1 && G.disponible('denarios') > 0.8 * G.cap()) for (const id of G.myCities()) if (G.upgrade(id, 'almacen')) break;
  for (const f of Object.keys(D.FACTIONS)) {   // acuerdos: alianza (foedus) o tributo
    if (f === 'roma') continue;
    if (!DIP.motivoAlianza(s, f, G)) G.dipAlianza(f); else if (!DIP.motivoTributo(s, f)) G.dipTributo(f);
  }
}
// Política: cortejar a los bandos (D.SENADO.actos: lo que contenta a cada uno) y que el plan del Senado salga 'bien'
// Cada estación cada bando pide algo (s.senado.pide[b] = {id, n}; D.SENADO.pide): cumplirlo da +4, fallarlo -4. El bot hace lo que piden.
function accionesPolitica(s, hacer) {
  const cap = G.capital(), q = s.senado || {}, hum = q.humor || {}, pide = q.pide || {}, c = s.cities[cap];
  const sube = (t) => { if (G.disponible('denarios') < 100 || (c.obras || []).length >= 2) return;
 const x = hacer.obra(cap, t); void x; };
  for (const b in pide) {
    if (typeof hum[b] !== 'number') continue; const x = pide[b]; if (!x) continue;
    switch (x.id) {
      case 'leva': if (c.pop > 60) G.leva(cap, 15); break;   // (ter pide 'sinLeva': se nota el choque con los militares)
      case 'rutaMercado': { let ok = false; for (const n of G.neighbors(cap)) if (G.rutaPuede(cap, n) === null) { ok = G.rutaAbrir(cap, n); break; } if (!ok) sube('mercado'); break; }
      case 'granja': sube('granja'); break;
      case 'templo': sube('templo'); break;
      case 'juegos': if (G.disponible('denarios') > 200) G.juegos(); break;
    }
  }
  const plan = s.planSenado && s.planSenado.plan;   // ayuda a los ministros: sube ella misma las obras del plan que ya tocan (hace falta el 80 % para 'bien', P.JUICIO)
  if (plan) { const k = Math.floor(s.t / D.TURNO_MESES) - plan.e0; for (const o of plan.obras) { const c = s.cities[o.ciudad]; if (!o.hecha && !o.perdida && o.est <= k + 1 && c && c.owner === 'roma' && D.BUILD[o.b] && (c.b[o.b] || 0) < o.nivel) G.upgrade(o.ciudad, o.b); } }
}
// Ciudad: construir exactamente lo que falta para el siguiente nivel de barrio (G.barrioInfo(c).falta)
const SERV_OBRA = { templo: 'templo', mercado: 'mercado', agua: 'fuente', grano: 'granja' };
function accionesCiudad(s, hacer) {
  const cap = G.capital(), c = s.cities[cap]; if (!c || c.owner !== 'roma') return;
  let bi = null; try { bi = G.barrioInfo(c); } catch (e) { bi = null; } if (!bi) return;
  const falta = new Set(bi.falta || []); (bi.barrios || []).forEach(b => { if (b.falta) String(b.falta).split(/[ ,]+/).forEach(k => { if (SERV_OBRA[k]) falta.add(k); }); });
  for (const k of falta) if (SERV_OBRA[k]) hacer.obra(cap, SERV_OBRA[k]);
  if (G.enRevuelta && G.enRevuelta(c)) c.nec.mem.forEach((m, i) => { if (m && m.revuelta) for (const r of ['grano', 'juegos', 'tropas']) if (G.calmarRevuelta(cap, i, r).ok) break; });
}

// ---- estadística ----
const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const mediana = a => { if (!a.length) return null; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
const f1 = x => x === null ? '-' : (Math.round(x * 10) / 10).toString();
const anio = (mes) => mes === null ? '-' : (D.START_YEAR - Math.floor(mes / 12)) + ' a.C.';
const aniosPartida = mes => mes / 12;
const rellena = (t, n) => (t + ' '.repeat(n)).slice(0, n);

function resumen(modo, bot, rs) {
  const propio = rs.filter(r => r.logro[bot] !== null).map(r => r.logro[bot]);
  const perdieron = rs.filter(r => r.perdidas[bot] > 0).length;
  const vic = rs.filter(r => r.victoria !== null).map(r => r.victoria);
  const cart = rs.filter(r => r.cartagoMes !== null).length;
  const derr = rs.filter(r => r.derrota).length;
  const dePaso = {}; BOTS.forEach(k => { if (k !== bot) dePaso[k] = rs.filter(r => r.logro[k] !== null).length; });
  const hitos = {};   // por hito: valor medio al final, media de los máximos de cada partida y máximo absoluto
  rs.forEach(r => r.evFin.caminos.forEach(c => c.hitos.forEach(h => { const k = c.id + '.' + h.id; const o = (hitos[k] = hitos[k] || { v: [], mx: [], meta: h.meta }); o.v.push(h.v); o.mx.push(r.max[k] === undefined ? h.v : r.max[k]); })));
  const pq = {}; rs.forEach(r => { pq[r.porQue] = (pq[r.porQue] || 0) + 1; }); const porQue = Object.keys(pq).map(k => pq[k] + 'x ' + k).join(', ');
  const capRival = rs.filter(r => r.capRivalMes !== null).length;
  return { modo, bot, n: rs.length, porQue, variante: rs[0] && rs[0].variante, cartagoExiste: rs.filter(r => r.cartagoExiste).length, capRival, logran: propio.length, mesMedio: media(propio), mesMediana: mediana(propio), mesMedioAnios: media(propio.map(aniosPartida)), perdieron, victorias: vic.length, victoriaMes: media(vic), victoriaMed: mediana(vic), cartago: cart, derrotas: derr, dePaso, hitos: Object.fromEntries(Object.entries(hitos).map(([k, h]) => [k, { media: media(h.v), maxMedio: media(h.mx), maxAbs: Math.max.apply(null, h.mx), meta: h.meta }])) };
}
const NOMBRE_HITO = { 'armas.cartago': 'Cartago', 'armas.plazas': 'plazas', 'comercio.tesoro': 'tesoro', 'comercio.rutas': 'rutas', 'comercio.acuerdos': 'acuerdos', 'politica.princeps': 'príncipe', 'politica.bandos': 'bandos', 'politica.planes': 'planes bien', 'ciudad.barrios': 'barrios', 'ciudad.urbe': 'nivel urbe' };
function textoHitos(bot, r) {   // «hito: final medio / máximo medio / máximo absoluto de meta»
  const n = x => (Math.round(x * 100) / 100).toString();
  return Object.keys(r.hitos).filter(k => k.startsWith(bot + '.')).map(k => { const h = r.hitos[k]; return NOMBRE_HITO[k] + ' ' + n(h.media) + ' / máx medio ' + n(h.maxMedio) + ' / máx ' + n(h.maxAbs) + ' de ' + h.meta; }).join(' | ');
}

// ---- programa ----
// Cada partida tarda ~1 min: los trabajos (modo x bot) se reparten en procesos hijos (--hilos K, por defecto los núcleos, máx. 4).
const HIJO = arg('hijo', '');
if (HIJO) {   // proceso hijo: una pareja modo/bot, vuelca sus partidas en JSON
  const modo = MODOS.find(m => m.id === SOLO_MODO), rs = [];
  for (let sd = SEMILLA || 1; sd <= (SEMILLA || N); sd++) { try { rs.push(partida(SOLO_BOT, modo, sd)); } catch (e) { console.error('EXCEPCIÓN en ' + modo.id + '/' + SOLO_BOT + '/semilla ' + sd + ':', e && e.stack || e); process.exit(1); } }
  if (process.env.PERFIL) console.error('mejorSitio: ' + Math.round(TIEMPOS.sitio) + ' ms en ' + TIEMPOS.nSitio + ' llamadas ' + JSON.stringify(TIEMPOS)); fs.writeFileSync(HIJO, JSON.stringify(rs)); process.exit(0);
}
const t0 = Date.now(), datos = {}, res = [];
const trabajos = [];
for (const modo of MODOS) { if (SOLO_MODO && SOLO_MODO !== modo.id) continue; datos[modo.id] = {}; for (const bot of BOTS) { if (SOLO_BOT && SOLO_BOT !== bot) continue; datos[modo.id][bot] = []; for (let sd = 1; sd <= N; sd++) trabajos.push({ modo, bot, sd }); } }
const { spawn } = require('child_process'), os = require('os'), path = require('path');
const HILOS = Math.max(1, parseInt(arg('hilos', String(Math.min(4, os.cpus().length))), 10));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'caminos-'));
await new Promise((fin, mal) => {
  let sig = 0, vivos = 0, hechos = 0, roto = false;
  const lanza = () => {
    while (!roto && vivos < HILOS && sig < trabajos.length) {
      const j = trabajos[sig++]; vivos++; j.t1 = Date.now(); j.fich = path.join(tmp, j.modo.id + '-' + j.bot + '-' + j.sd + '.json');
      const p = spawn(process.execPath, [process.argv[1], '--n', String(N), '--modo', j.modo.id, '--bot', j.bot, '--semilla', String(j.sd), '--hijo', j.fich].concat(VAR ? ['--var', VAR] : [], (GOBCADA_ARG ? ['--gobcada', String(GOBCADA_ARG)] : [])), { stdio: ['ignore', 'inherit', 'inherit'] });
      p.on('exit', cod => {
        vivos--; hechos++;
        if (cod !== 0) { roto = true; return mal(new Error('falló ' + j.modo.id + '/' + j.bot)); }
        datos[j.modo.id][j.bot][j.sd - 1] = JSON.parse(fs.readFileSync(j.fich, 'utf8'))[0];
        process.stderr.write('  ' + j.modo.id + '/' + j.bot + '/' + j.sd + ' en ' + ((Date.now() - j.t1) / 1000).toFixed(0) + ' s (' + hechos + '/' + trabajos.length + ')\n');
        if (hechos === trabajos.length) fin(); else lanza();
      });
    }
  };
  lanza();
}).catch(e => { console.error(e.message); process.exit(1); });
for (const m of Object.keys(datos)) for (const b of Object.keys(datos[m])) res.push(resumen(m, b, datos[m][b]));
res.sort((a, b) => MODOS.findIndex(m => m.id === a.modo) - MODOS.findIndex(m => m.id === b.modo) || BOTS.indexOf(a.bot) - BOTS.indexOf(b.bot));
G.usarCiudad(null);

for (const modo of MODOS) {
  const filas = res.filter(r => r.modo === modo.id); if (!filas.length) continue;
  console.log('\n=== ' + modo.n + ' (N = ' + filas[0].n + ' semillas) ===');
  console.log(rellena('bot', 9) + rellena('logra SU camino', 17) + rellena('mes medio (año) / mediana', 30) + rellena('lo pierden', 11) + rellena('victoria 3/4', 14) + rellena('año victoria', 14) + rellena('Cartago', 9) + 'derrota');
  for (const r of filas) {
    const mm = r.mesMedio === null ? '-' : f1(r.mesMedio) + ' (' + anio(Math.round(r.mesMedio)) + ') / ' + f1(r.mesMediana);
    console.log(rellena(r.bot, 9) + rellena(r.logran + '/' + r.n, 17) + rellena(mm, 30) + rellena(r.perdieron + '/' + r.n, 11) + rellena(r.victorias + '/' + r.n, 14) + rellena(r.victoriaMes === null ? '-' : anio(Math.round(r.victoriaMes)), 14) + rellena(r.cartago + '/' + r.n, 9) + r.derrotas + '/' + r.n);
  }
  console.log('Fin de partida: ' + filas.map(r => r.bot + ' [' + r.porQue + ']').join('; '));
  console.log('Obras del bot: ' + filas.map(r => r.bot + '=' + r.variante).join(', ') + ' · capital rival (' + (G.capitalRival ? '' : '') + 'tomada): ' + filas.map(r => r.bot + ' ' + r.capRival + '/' + r.n).join(', ') + ' · Carthago existe en s.cities: ' + filas[0].cartagoExiste + '/' + filas[0].n);
  console.log('Otros caminos que logra de paso:');
  for (const r of filas) console.log('  ' + rellena(r.bot, 9) + BOTS.filter(k => k !== r.bot).map(k => k + ' ' + r.dePaso[k] + '/' + r.n).join(' · '));
  console.log('Por hito: valor medio al final / máximo medio alcanzado en la partida / máximo absoluto, de la meta:');
  for (const r of filas) console.log('  ' + rellena(r.bot, 9) + textoHitos(r.bot, r));
}

// ---- metas (solo informan) ----
console.log('\n=== Metas ===');
const linea = (ok, t) => console.log((ok ? 'APTO ' : 'NO   ') + t);
for (const modo of MODOS) {
  const filas = res.filter(r => r.modo === modo.id); if (!filas.length) continue;
  for (const r of filas) { const x = Math.round(10 * r.logran / r.n * 10) / 10; linea(x >= 4 && x <= 7, '(a) ' + modo.id + ': camino ' + r.bot + ' lo logra su bot en ' + r.logran + '/' + r.n + ' (meta 4-7 de 10)'); }
  const ar = filas.find(r => r.bot === 'armas');
  if (ar && ar.mesMedio !== null) for (const r of filas) { if (r.bot === 'armas') continue; if (r.mesMedio === null) { linea(true, '(b) ' + modo.id + ': ' + r.bot + ' no llega a lograrlo (sin comparación)'); continue; } const frac = r.mesMedio / ar.mesMedio; linea(frac >= 0.75, '(b) ' + modo.id + ': ' + r.bot + ' se logra en ' + f1(aniosPartida(r.mesMedio)) + ' años, armas en ' + f1(aniosPartida(ar.mesMedio)) + ' (' + Math.round(frac * 100) + ' % del tiempo de armas; meta >= 75 %)'); }
  else if (!SOLO_BOT || SOLO_BOT === 'armas') linea(false, '(b) ' + modo.id + ': el bot de armas no logra su camino: no hay comparación');
  if (modo.id === 'larga' && ar) linea(ar.cartago >= Math.round(4 * ar.n / 10), '(c) larga: el bot de armas toma Cartago en ' + ar.cartago + '/' + ar.n + ' (meta >= 4 de 10)');
}
console.log('\nTiempo total: ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
if (RUTA_JSON) { fs.writeFileSync(RUTA_JSON, JSON.stringify({ resumen: res, partidas: datos }, null, 1)); console.log('Datos crudos en ' + RUTA_JSON); }
