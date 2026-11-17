// EV7 · «Gobierno por turnos: el Senado manda y la ciudad obedece» — reglas sin pantalla. Corren en Node y en el navegador.
// Doce estaciones (264–262 a.C.). Cada estación: suceso → el Senado presenta 3 leyes → eliges una y ofreces tratos → recuento
// senador a senador → lo aprobado pasa a la cola de mando → al terminar la estación la ciudad cumple sola las órdenes.
// El azar sale de una semilla guardada en el estado (mulberry32): pasar `e` por JSON entre pasos no cambia nada.
//
// Uso:  crear(semilla) → e · elegir(e, i) · votar(e) → recuento · dejarPasar(e) · fuerza(e) · requisitosEdad(e, n) · nota(e)
//   trato(e, bando, 'oro'|'promesa'|null) → bool. Rechaza (false) si el bando ya vota todo «sí» sin trato, si no llega el oro,
//       si ya hay promesa abierta con él o si no queda estación para cumplirla.
//   prevision(e, i?) → {seguros, dudosos, contra, esperado, veto, por:[{i,bando,p,clase}], bandos:{ter|mer|mil:{seguros,dudosos,contra,yaTeVotan}}}
//   gusta(ley, b) → bool · disgusta(ley, b) → bool · efectoBando(ley) → {ter,mer,mil: +1|0|−1}  (umbral único K.gusta / K.disgusta,
//       el mismo que mueve el humor y cumple promesas; la vista pinta ▲ con +1 y ▼ con −1)
//   plazoPromesa(e) → {vence (turno 0-11), estacion (1-12), nombre, puede, favor, humor}: «cumple como tarde en la estación N;
//       si no, pierdes `favor` de favor y `humor` de humor con ese bando». Las promesas nunca vencen después de la última estación.
//   leyTexto(ley, e?) → {titulo, efecto, fuente, dictamen}: con `e`, «Reclutar» dice una o dos legiones según la edad.
//   llega(e, ley) → bool: si da tiempo a cumplirla antes del golpe. sacarCartas las cambia; si no puede, la carta lleva noLlega: true.
//   golpe(e) → {estacion, ahora, min, esperado, max, fuerza, enCola, falta}: previsión honesta (subida fija + sucesos que quedan);
//       falta = esperado − fuerza − enCola (fuerza que ya viene en la cola), nunca negativa. amenazaFinal(e) = golpe(e).esperado.
//   costeLeva(e) → oro · puedeLeva(e) → {ok, porque?, oro, favor, grano} · levaPagada(e) → bool: legión con oro sin votar (una por estación).
//   terminar(e) → informe {turno, cambios, suceso, aprobadas, nuevo:[{tipo:'edificio'|'legion'|'saber'|'edad', id, n}]}
//       ids estables: edificio → 'granja'… (n = nivel); legión → 'legion-K' (n = K); saber → 'castra'…; edad → 'edad-2' (n = 2).
//   consejo(e) → texto: al final, por qué ganaste o perdiste y qué faltó; durante la partida, lo que más aprieta.
//   estacionVisual(e) → 'primavera'|'verano'|'otono'|'invierno'.
// Fases: 'senado' (eligiendo) → 'mando' (votado o dejado pasar) → terminar() → 'senado' de la estación siguiente, o 'fin'.
// Equilibrio (prueba.mjs, 200 semillas): nada 0 %, primera 7 %, azar 10 %, sensato 49 %, cabeza 82 %.

/* ---------- azar guardable ---------- */
function rnd(e) { let t = (e.rng = (e.rng + 0x6D2B79F5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const ri = (e, n) => Math.floor(rnd(e) * n);
const cl = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- cifras del equilibrio (afinadas con prueba.mjs) ---------- */
export const K = {
  turnos: 12, mayoria: 16, escanos: 30, minBando: 4,
  ini: { oro: 100, grano: 80, plebe: 55, favor: 50, legiones: 2, amenaza: 30, pob: 90 },
  ingreso: { base: 20, mercado: 14, muelle: 8 }, grano: { granja: 13, muelle: 6, porMil: 1 / 8 },
  legion: { oro: 4, grano: 4, fuerza: 12 }, muralla: 14, amenazaSube: 3, amenazaQuinque: 3, corvus: 25,
  plebeBaja: 1, templo: 3, tratoOro: 6, tratoPorEscano: 1, tratoEmpuje: 0.32, promesaPlazo: 3, promesaRota: { favor: 7, humor: 15 },
  favorAprobada: 3, base: 0.42, favorCae: 4, favorPasa: 6,
  gusta: 0.15, disgusta: -0.1, // umbral único: por encima «le gusta» (▲, humor +5, cumple promesa); por debajo «no le gusta» (▼, humor −4)
  edad2Legion: 1, // legión de regalo al llegar a la Edad II: Polibio 1.20.14 (los socios navales de Tarento, Locris, Elea y Nápoles prestan naves y marinos, 264 a.C.). Dictamen: licencia de juego (aquí son soldados)
  leva: { oro: 60, sube: 20, favor: 5, grano: 6 }, // leva pagada: oro que sube con cada compra; baja el favor
};

/* ---------- bandos del Senado ---------- */
export const BANDOS = {
  ter: { id: 'ter', nombre: 'Terratenientes', corto: 'Terraten.', color: '#5d7a2a', fuente: 'Livio 7.16, 21.63 (los padres de la tierra; lex Claudia 218 a.C.)', dictamen: 'probable' },
  mer: { id: 'mer', nombre: 'Mercaderes', corto: 'Mercad.', color: '#b8862b', fuente: 'Polibio 3.22-25 (tratados de comercio con Cartago)', dictamen: 'probable' },
  mil: { id: 'mil', nombre: 'Militares', corto: 'Militares', color: '#a3231a', fuente: 'Polibio 6.19 (la carrera exige diez campañas)', dictamen: 'probable' },
};
export const BS = ['ter', 'mer', 'mil'];
export const TRIBUNO = { nombre: 'Tribuno de la plebe', fuente: 'Livio 2.33; Polibio 6.16.4-5 (el veto de los tribunos)', dictamen: 'histórico', umbral: 30 };

/* ---------- edificios: cada uno da escaños a un bando ---------- */
export const EDIFICIOS = {
  granja: { id: 'granja', nombre: 'Granjas', una: 'una granja', bando: 'ter', max: 4, oro: 12, dura: 2, fuente: 'Catón, De agri cultura 1 (la finca del Lacio)', dictamen: 'probable' },
  mercado: { id: 'mercado', nombre: 'Mercado', una: 'un mercado', bando: 'mer', max: 3, oro: 14, dura: 2, fuente: 'Livio 1.35, 3.27 (el Foro y sus tabernae)', dictamen: 'probable' },
  muelle: { id: 'muelle', nombre: 'Muelle del Tíber', una: 'un muelle', bando: 'mer', max: 2, oro: 16, dura: 2, fuente: 'Livio 35.10 (el Emporio sobre el Tíber, 193 a.C.: aquí adelantado)', dictamen: 'licencia de juego' },
  cuartel: { id: 'cuartel', nombre: 'Campo de Marte', una: 'barracones en el Campo de Marte', bando: 'mil', max: 3, oro: 14, dura: 2, fuente: 'Polibio 6.19-20 (la leva se reúne en Roma)', dictamen: 'probable' },
  templo: { id: 'templo', nombre: 'Templo', una: 'un templo', bando: 'ter', max: 2, oro: 16, dura: 2, fuente: 'Livio 10.33 y Fasti (templos votados en guerra, de toba y madera)', dictamen: 'histórico' },
  muralla: { id: 'muralla', nombre: 'Muralla Serviana', una: 'un tramo de muralla', bando: 'mil', max: 3, oro: 18, dura: 3, fuente: 'Livio 6.32 (muralla de toba de Grotta Oscura, 378 a.C.)', dictamen: 'histórico' },
};
export const ORDEN_EDIF = ['granja', 'mercado', 'muelle', 'cuartel', 'templo', 'muralla'];

/* ---------- saberes: seis en tres ramas (nombres de D.INVEST) ---------- */
export const SABERES = {
  castra: { id: 'castra', nombre: 'Campamento y disciplina', rama: 'guerra', edad: 1, req: [], efecto: '+3 de fuerza por legión', fuente: 'Polibio 6.27-39', dictamen: 'probable' },
  pilum: { id: 'pilum', nombre: 'Pilum y manípulo', rama: 'guerra', edad: 2, req: ['castra'], efecto: '+3 de fuerza por legión', fuente: 'Polibio 6.23.9-11', dictamen: 'histórico' },
  quinque: { id: 'quinque', nombre: 'Quinquerreme copiada', rama: 'mar', edad: 1, req: [], edif: 'muelle', efecto: 'la amenaza sube 3 menos cada estación', fuente: 'Polibio 1.20 (copian una nave púnica varada, 260 a.C.: aquí adelantado)', dictamen: 'licencia de juego' },
  corvus: { id: 'corvus', nombre: 'Corvus', rama: 'mar', edad: 2, req: ['quinque'], efecto: '+25 de fuerza en el mar', fuente: 'Polibio 1.22 (la pasarela de abordaje)', dictamen: 'histórico' },
  griego: { id: 'griego', nombre: 'Preceptores griegos', rama: 'ciudad', edad: 1, req: [], efecto: 'los estudios tardan 1 estación menos', fuente: 'Suetonio, De grammaticis 1; Cicerón, Bruto 72 (Livio Andronico)', dictamen: 'probable' },
  apio: { id: 'apio', nombre: 'Obras de Apio Claudio', rama: 'ciudad', edad: 1, req: [], efecto: 'las obras tardan 1 estación menos y +6 de grano', fuente: 'Livio 9.29; Frontino, De aquaeductu 5 (Vía Apia y Aqua Appia, 312 a.C.)', dictamen: 'histórico' },
};
export const RAMAS = { guerra: 'Guerra', mar: 'Mar', ciudad: 'Ciudad' };
export const ORDEN_SAB = ['castra', 'pilum', 'quinque', 'corvus', 'griego', 'apio'];

/* ---------- edades (nombres de D.EDADES) ---------- */
export const EDADES = {
  1: { n: 1, nombre: 'Roma itálica' },
  2: { n: 2, nombre: 'Roma sale al mar', saberes: 2, edif: { muelle: 1, mercado: 2 }, fuente: 'Polibio 1.20-21 (Roma construye su primera flota, 261-260 a.C.). Las edades son licencia de juego.', dictamen: 'licencia de juego' },
  3: { n: 3, nombre: 'Aníbal', saberes: 4, edif: { muralla: 2, cuartel: 2 }, fuente: 'Hechos de 218-201 a.C. Las edades son licencia de juego.', dictamen: 'licencia de juego' },
};

/* ---------- estaciones ---------- */
const EST = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
export const nombreEstacion = t => EST[t % 4] + ' de ' + (264 - Math.floor(t / 4)) + ' a.C.';

/* ---------- sucesos (uno por estación, sorteado) ---------- */
export const SUCESOS = [
  { id: 'mesana', titulo: 'Cartago ocupa Mesana', texto: 'Una guarnición púnica se planta en el Estrecho.', ef: { amenaza: 8 }, fuente: 'Polibio 1.10-11', dictamen: 'histórico' },
  { id: 'flota', titulo: 'Naves púnicas en la costa', texto: 'Saquean aldeas del litoral. Con quinquerremes, menos.', ef: { amenaza: 7, plebe: -3 }, mar: true, fuente: 'Polibio 1.20.7 (Cartago domina el mar)', dictamen: 'probable' },
  { id: 'sequia', titulo: 'Sequía en el Lacio', texto: 'Los campos rinden poco este año.', ef: { grano: -30 }, fuente: 'Hambrunas en Livio 4.12 (otra época)', dictamen: 'licencia de juego' },
  { id: 'cosecha', titulo: 'Buena cosecha', texto: 'Los graneros se llenan.', ef: { grano: 28 }, fuente: 'Invento para jugar', dictamen: 'licencia de juego' },
  { id: 'hieron', titulo: 'Embajada de Hierón de Siracusa', texto: 'Siracusa pide paz y paga por ella.', ef: { oro: 40, amenaza: -6 }, fuente: 'Polibio 1.16 (paz con Hierón, 263 a.C.)', dictamen: 'histórico' },
  { id: 'incendio', titulo: 'Incendio en el barrio del Velabro', texto: 'Arden casas de madera y adobe.', ef: { oro: -25, plebe: -5 }, fuente: 'Livio 24.47, 26.27 (incendios en Roma)', dictamen: 'probable' },
  { id: 'massalia', titulo: 'Mercaderes de Massalia', texto: 'Traen vino y compran grano.', ef: { oro: 30, grano: -10 }, fuente: 'Alianza antigua con Massalia (Justino 43.5)', dictamen: 'probable' },
  { id: 'fiebres', titulo: 'Fiebres de verano', texto: 'La plebe enferma y se queja.', ef: { plebe: -7 }, fuente: 'Pestes en Livio 10.31 (otra época)', dictamen: 'licencia de juego' },
  { id: 'prodigio', titulo: 'Un rayo cae en el Capitolio', texto: 'Los augures lo leen como un aviso al gobierno.', ef: { favor: -6 }, fuente: 'Prodigios en Livio 21.62', dictamen: 'probable' },
  { id: 'socios', titulo: 'Los aliados itálicos envían tropas', texto: 'Los socios cumplen su tratado.', ef: { legiones: 1 }, fuente: 'Polibio 2.24 (los socii)', dictamen: 'histórico' },
  { id: 'agrigento', titulo: 'Cartago refuerza Agrigento', texto: 'Mercenarios íberos y galos desembarcan en Sicilia.', ef: { amenaza: 7 }, fuente: 'Polibio 1.17-18 (262 a.C.)', dictamen: 'histórico' },
  { id: 'tormenta', titulo: 'Tormenta en el mar Tirreno', texto: 'Se hunden barcos cargados de trigo.', ef: { grano: -22 }, fuente: 'Polibio 1.37 (tormentas que hunden flotas romanas)', dictamen: 'probable' },
  { id: 'censo', titulo: 'Los censores cierran el censo', texto: 'Roma cuenta a sus ciudadanos y el Senado se tranquiliza.', ef: { favor: 5, oro: 10 }, fuente: 'Livio, Periocha 16 (censo de 264 a.C.)', dictamen: 'probable' },
  { id: 'botin', titulo: 'Botín de Sicilia', texto: 'Las legiones mandan esclavos y plata.', ef: { oro: 30, plebe: 3 }, fuente: 'Polibio 1.19.15 (Agrigento vendida)', dictamen: 'probable' },
];

/* ---------- leyes: plantillas (tipo → cómo se vota y qué orden da) ---------- */
// gusta: empuje a favor (+) o en contra (−) de cada bando; plebe: si la perjudica (el tribuno puede vetar).
export const TIPOS = {
  reclutar: { nombre: 'Reclutar una legión', icono: 'legion', gusta: { ter: -0.12, mer: -0.05, mil: 0.35 }, plebe: -3, fuente: 'Polibio 6.19-21 (la leva)', dictamen: 'histórico' },
  ampliar: { nombre: 'Ampliar la ciudad', icono: 'obra', gusta: {}, plebe: 0, fuente: 'Livio 10.23, 10.33 (obras con multas y botín)', dictamen: 'probable' },
  estudiar: { nombre: 'Estudiar un saber', icono: 'saber', gusta: {}, plebe: 0, fuente: 'Licencia de juego: Roma no «estudiaba»; aprendía de griegos y púnicos', dictamen: 'licencia de juego' },
  edad: { nombre: 'Pasar de edad', icono: 'edad', gusta: { ter: -0.12, mer: 0.25, mil: 0.08 }, plebe: 0, fuente: 'Licencia de juego (ver EDADES)', dictamen: 'licencia de juego' },
  impuestos: { nombre: 'Tributo extraordinario', icono: 'oro', gusta: { ter: -0.2, mer: -0.18, mil: 0.22 }, plebe: -12, fuente: 'Livio 7.27, 23.31 (tributum doble en guerra)', dictamen: 'histórico' },
  granoBarato: { nombre: 'Grano barato para la plebe', icono: 'grano', gusta: { ter: -0.3, mer: 0.02, mil: 0.1 }, plebe: 15, fuente: 'Livio 2.34, 10.11 (repartos de grano en carestía)', dictamen: 'probable' },
  leva: { nombre: 'Leva pagada', icono: 'legion', gusta: {}, plebe: 0, sinSenado: true, fuente: 'Livio 22.57.11-12 (tras Cannas, 216 a.C., el Estado compra 8000 esclavos y los arma: los volones); Livio 24.11.7-9 (214 a.C., los ricos pagan remeros de su bolsa). Aquí adelantado y sin decreto del Senado', dictamen: 'licencia de juego' },
  juegos: { nombre: 'Juegos en el Circo Máximo', icono: 'juegos', gusta: { ter: 0.05, mer: 0.12, mil: 0.05 }, plebe: 18, fuente: 'Livio 1.35 (ludi Romani en el Circo Máximo; primeros juegos de gladiadores 264 a.C., Valerio Máximo 2.4.7)', dictamen: 'histórico' },
};

/* ---------- estado ---------- */
export function crear(semilla = 1) {
  const s = (semilla | 0) || 1, I = K.ini;
  const e = {
    semilla: s, rng: Math.imul(s, 0x9E3779B1) ^ 0x5bd1e995, turno: 0, fase: 'senado', fin: null,
    oro: I.oro, grano: I.grano, plebe: I.plebe, favor: I.favor, legiones: I.legiones, amenaza: I.amenaza, pob: I.pob,
    edad: 1, saberes: [], edif: { granja: 2, mercado: 1, muelle: 0, cuartel: 1, templo: 0, muralla: 1 },
    humor: { ter: 50, mer: 50, mil: 50 }, escanos: null, senadores: [],
    cartas: [], sel: -1, tratos: {}, recuento: null, ordenes: [], promesas: [], suceso: null,
    cambios: [], aprobadas: [], rojos: { oro: 0, grano: 0 }, salidos: [], historial: [], sigId: 1,
  };
  e.senadores = Array.from({ length: K.escanos }, (_, i) => ({ i, sesgo: +(rnd(e) * 0.5 - 0.25).toFixed(3) }));
  repartirEscanos(e);
  empezarEstacion(e);
  return e;
}

/* escaños: cuántos tiene cada bando sale de la ciudad (granjas→ter, mercados→mer, legiones→mil) */
export function pesos(e) {
  const d = e.edif;
  return { ter: 4 + d.granja * 3 + d.templo * 2, mer: 4 + d.mercado * 3 + d.muelle * 3, mil: 4 + e.legiones * 2 + d.cuartel * 2 + d.muralla };
}
export function repartirEscanos(e) {
  const p = pesos(e), tot = p.ter + p.mer + p.mil, libre = K.escanos - K.minBando * 3;
  const crudo = BS.map(b => ({ b, v: libre * p[b] / tot })), out = {};
  crudo.forEach(c => { out[c.b] = K.minBando + Math.floor(c.v); });
  let falta = K.escanos - BS.reduce((s, b) => s + out[b], 0);
  crudo.sort((a, b) => (b.v % 1) - (a.v % 1)).forEach(c => { if (falta > 0) { out[c.b]++; falta--; } });
  e.escanos = out;
  let i = 0; BS.forEach(b => { for (let k = 0; k < out[b]; k++) e.senadores[i++].bando = b; });
}

/* fuerza de Roma frente a la amenaza */
export function fuerzaLegion(e) { return K.legion.fuerza + (e.saberes.includes('castra') ? 3 : 0) + (e.saberes.includes('pilum') ? 3 : 0); }
export function fuerza(e) { return e.legiones * fuerzaLegion(e) + e.edif.muralla * K.muralla + (e.saberes.includes('corvus') ? K.corvus : 0); }
export const amenazaSube = e => K.amenazaSube - (e.saberes.includes('quinque') ? K.amenazaQuinque : 0);
/* previsión honesta del golpe final: subida fija de cada cierre + lo que pueden traer los sucesos que quedan en el mazo.
   Los sucesos que faltan por salir son los de las estaciones turno+1 … K.turnos−1 (el de esta ya se aplicó). */
export function golpe(e) {
  const fin = e.fase === 'fin', cierres = fin ? 0 : K.turnos - e.turno, n = fin ? 0 : Math.max(0, K.turnos - 1 - e.turno);
  const q = e.saberes.includes('quinque');
  const mazo = SUCESOS.filter(x => !e.salidos.includes(x.id)).map(x => { const a = x.ef.amenaza || 0; return x.mar && q ? Math.round(a / 2) : a; }).sort((a, b) => a - b);
  const k = Math.min(n, mazo.length), media = mazo.length ? mazo.reduce((a, b) => a + b, 0) / mazo.length : 0;
  const base = e.amenaza + amenazaSube(e) * cierres;
  const min = base + mazo.slice(0, k).reduce((a, b) => a + b, 0), max = base + mazo.slice(mazo.length - k).reduce((a, b) => a + b, 0);
  const esperado = Math.round(base + media * k), f = fuerza(e);
  const enCola = e.ordenes.reduce((s, o) => s + (o.ley.tipo === 'reclutar' ? (e.edad >= 2 ? 2 : 1) * fuerzaLegion(e) : o.ley.tipo === 'leva' ? fuerzaLegion(e) : o.ley.tipo === 'ampliar' && o.ley.obj === 'muralla' ? K.muralla : o.ley.tipo === 'estudiar' && o.ley.obj === 'corvus' ? K.corvus : 0), 0);
  return { estacion: K.turnos, ahora: e.amenaza, min, esperado, max, fuerza: f, enCola, falta: Math.max(0, esperado - f - enCola) };
}
export const amenazaFinal = e => golpe(e).esperado;

/* lo que tarda y cuesta cada orden */
export function plantillaOrden(e, ley) {
  const ap = e.saberes.includes('apio') ? 1 : 0, gr = e.saberes.includes('griego') ? 1 : 0;
  switch (ley.tipo) {
    case 'reclutar': return { dura: e.edif.cuartel >= 2 ? 1 : 2, oro: 12, grano: 8 };
    case 'ampliar': { const x = EDIFICIOS[ley.obj]; return { dura: Math.max(1, x.dura - ap), oro: x.oro, grano: 0 }; }
    case 'estudiar': return { dura: Math.max(1, 2 - gr), oro: 14, grano: 0 };
    case 'edad': return { dura: 1, oro: 30, grano: 10 };
    case 'impuestos': return { dura: 1, oro: 0, grano: 0 };
    case 'granoBarato': return { dura: 1, oro: 0, grano: 26 };
    case 'juegos': return { dura: 1, oro: 34, grano: 0 };
    case 'leva': return { dura: 1, oro: 0, grano: K.leva.grano };
  }
}

/* gusto de cada bando por una ley concreta */
export function gustoLey(ley) {
  const g = Object.assign({ ter: 0, mer: 0, mil: 0 }, TIPOS[ley.tipo].gusta);
  if (ley.tipo === 'ampliar') { const b = EDIFICIOS[ley.obj].bando; g[b] += 0.3; if (ley.obj === 'templo') BS.forEach(x => g[x] += 0.06); }
  if (ley.tipo === 'estudiar') { const r = SABERES[ley.obj].rama; if (r === 'guerra') g.mil += 0.28; if (r === 'mar') { g.mer += 0.28; g.ter -= 0.08; } if (r === 'ciudad') { g.ter += 0.12; g.mer += 0.12; g.mil -= 0.08; } }
  return g;
}
/* umbral único (K.gusta / K.disgusta): lo usan la vista (▲/▼), el humor tras aprobar y las promesas */
export function gusta(ley, b) { return gustoLey(ley)[b] > K.gusta; }
export function disgusta(ley, b) { return gustoLey(ley)[b] < K.disgusta; }
export function efectoBando(ley) { const o = {}; BS.forEach(b => o[b] = gusta(ley, b) ? 1 : disgusta(ley, b) ? -1 : 0); return o; }
export function perjudicaPlebe(ley) { return TIPOS[ley.tipo].plebe < 0; }

/* ---------- cartas: tres leyes por estación, sacadas del mazo según la situación ---------- */
export function requisitosEdad(e, n) {
  const E = EDADES[n]; if (!E) return { ok: false, faltan: ['No hay más edades'] };
  const f = [];
  if (e.edad !== n - 1) f.push('Estar en la ' + EDADES[n - 1].nombre);
  if (e.saberes.length < E.saberes) f.push(`${E.saberes} saberes (tienes ${e.saberes.length})`);
  for (const k in E.edif) if (e.edif[k] < E.edif[k]) f.push(`${EDIFICIOS[k].nombre} ${E.edif[k]} (tienes ${e.edif[k]})`);
  return { ok: f.length === 0, faltan: f };
}
const enCola = (e, tipo, obj) => e.ordenes.some(o => o.ley.tipo === tipo && (obj == null || o.ley.obj === obj));
export function saberesPosibles(e) { return ORDEN_SAB.filter(id => { const s = SABERES[id]; return !e.saberes.includes(id) && !enCola(e, 'estudiar', id) && s.edad <= e.edad && s.req.every(r => e.saberes.includes(r)) && (!s.edif || e.edif[s.edif] > 0); }); }
export function obrasPosibles(e) { return ORDEN_EDIF.filter(id => e.edif[id] + e.ordenes.filter(o => o.ley.tipo === 'ampliar' && o.ley.obj === id).length < EDIFICIOS[id].max); }

export function leyTexto(ley, e) {
  const T = TIPOS[ley.tipo];
  if (ley.tipo === 'ampliar') { const x = EDIFICIOS[ley.obj]; return { titulo: 'Ampliar: ' + x.nombre, efecto: 'Levantar ' + x.una + '. Da escaños a los ' + BANDOS[x.bando].nombre.toLowerCase() + '.', fuente: x.fuente, dictamen: x.dictamen }; }
  if (ley.tipo === 'estudiar') { const s = SABERES[ley.obj]; return { titulo: 'Estudiar: ' + s.nombre, efecto: 'Rama de ' + RAMAS[s.rama].toLowerCase() + ': ' + s.efecto + '.', fuente: s.fuente, dictamen: s.dictamen }; }
  if (ley.tipo === 'edad') { const E = EDADES[ley.obj]; return { titulo: 'Pasar a la edad «' + E.nombre + '»', efecto: ley.obj === 2 ? 'Abre el pilum y el corvus; cada leva da 2 legiones.' : 'Roma, lista para la guerra grande. Sube la nota.', fuente: E.fuente, dictamen: E.dictamen }; }
  const nLeg = e && e.edad >= 2 ? 2 : 1;
  const ef = { reclutar: (!e ? 'Una legión más (dos desde la Edad II).' : nLeg === 2 ? 'Dos legiones más (Edad II).' : 'Una legión más (dos desde la Edad II).') + ' Cuesta oro y grano.', leva: 'Una legión ya, sin votar. Cuesta ' + (e ? costeLeva(e) : K.leva.oro) + ' de oro y ' + K.leva.favor + ' de favor.', impuestos: 'Entran 70 de oro. La plebe pierde 12 de contento.', granoBarato: 'La plebe gana 15 de contento. Cuesta 26 de grano.', juegos: 'La plebe gana 18 y el Senado 3 de favor. Cuesta 34 de oro.' }[ley.tipo];
  return { titulo: T.nombre, efecto: ef, fuente: T.fuente, dictamen: T.dictamen };
}

/* ¿da tiempo a cumplirla? Lo aprobado en la estación t avanza al cerrar t; debe acabar al cerrar la última (K.turnos − 1) */
export function llega(e, ley) { return plantillaOrden(e, ley).dura <= K.turnos - e.turno; }
function sacarCartas(e) {
  const cartas = [];
  // A · progreso: pasar de edad si se puede; si no, un saber o una obra que acerque a la edad
  const sigEdad = e.edad + 1;
  if (EDADES[sigEdad] && requisitosEdad(e, sigEdad).ok && !enCola(e, 'edad')) cartas.push({ tipo: 'edad', obj: sigEdad });
  else {
    const sab = saberesPosibles(e), ob = obrasPosibles(e).filter(o => ['mercado', 'muelle', 'templo', 'granja'].includes(o));
    const E = EDADES[sigEdad], faltaObra = E ? ob.filter(o => E.edif[o] > e.edif[o]) : [], faltaSab = E && e.saberes.length + e.ordenes.filter(o => o.ley.tipo === 'estudiar').length < E.saberes;
    if ((faltaObra.length || (faltaSab && sab.length)) && rnd(e) < 0.7) { if (faltaSab && sab.length && (!faltaObra.length || rnd(e) < 0.5)) cartas.push({ tipo: 'estudiar', obj: sab[ri(e, sab.length)] }); else cartas.push({ tipo: 'ampliar', obj: faltaObra[ri(e, faltaObra.length)] }); }
    else if (sab.length && (rnd(e) < 0.6 || !ob.length)) cartas.push({ tipo: 'estudiar', obj: sab[ri(e, sab.length)] });
    else if (ob.length) cartas.push({ tipo: 'ampliar', obj: ob[ri(e, ob.length)] });
    else cartas.push({ tipo: 'juegos' });
  }
  // B · guerra: legión, muralla, cuartel o un saber de guerra
  { const op = [{ tipo: 'reclutar' }, { tipo: 'reclutar' }];
    obrasPosibles(e).filter(o => o === 'muralla' || o === 'cuartel').forEach(o => op.push({ tipo: 'ampliar', obj: o }));
    saberesPosibles(e).filter(s => SABERES[s].rama !== 'ciudad' && !cartas.some(c => c.obj === s)).forEach(s => op.push({ tipo: 'estudiar', obj: s }));
    cartas.push(op[ri(e, op.length)]); }
  // C · pueblo y arca: según lo que apriete
  { const op = [];
    if (e.plebe < 40) op.push({ tipo: 'juegos' }, { tipo: 'granoBarato' });
    if (e.oro < 60) op.push({ tipo: 'impuestos' }, { tipo: 'impuestos' });
    op.push({ tipo: 'impuestos' }, { tipo: 'juegos' }, { tipo: 'granoBarato' });
    obrasPosibles(e).filter(o => !cartas.some(c => c.obj === o) && o !== 'muralla' && o !== 'cuartel').forEach(o => op.push({ tipo: 'ampliar', obj: o }));
    let c = op[ri(e, op.length)]; if (cartas.some(x => x.tipo === c.tipo && x.obj === c.obj)) c = { tipo: 'juegos' };
    cartas.push(c); }
  // lo que no da tiempo a cumplir antes del golpe se cambia por una ley de una estación; si no hay, se marca
  cartas.forEach((c, i) => {
    if (llega(e, c)) return;
    const alt = [{ tipo: 'reclutar' }, { tipo: 'impuestos' }, { tipo: 'juegos' }, { tipo: 'granoBarato' }].find(a => llega(e, a) && !cartas.some(x => x.tipo === a.tipo));
    if (alt) cartas[i] = alt; else c.noLlega = true;
  });
  // barajar: el orden no dice nada
  for (let i = cartas.length - 1; i > 0; i--) { const j = ri(e, i + 1); [cartas[i], cartas[j]] = [cartas[j], cartas[i]]; }
  return cartas;
}

/* ---------- suceso y comienzo de estación ---------- */
function aplicar(e, ef, motivo) {
  for (const k in ef) {
    let v = ef[k]; if (!v) continue;
    if (k === 'legiones') e.legiones = Math.max(0, e.legiones + v);
    else if (k === 'plebe' || k === 'favor') e[k] = cl(e[k] + v, 0, 100);
    else e[k] += v;
    e.cambios.push({ que: k, n: v, motivo });
  }
}
function empezarEstacion(e) {
  e.cambios = []; e.aprobadas = []; e.sel = -1; e.tratos = {}; e.recuento = null; e.fase = 'senado';
  // mazo sin repetición: cada suceso sale como mucho una vez por partida
  const quedan = SUCESOS.filter(x => !e.salidos.includes(x.id)), su = quedan[ri(e, quedan.length)], ef = Object.assign({}, su.ef);
  if (su.mar && e.saberes.includes('quinque')) ef.amenaza = Math.round(ef.amenaza / 2);
  e.salidos.push(su.id);
  e.suceso = { id: su.id, titulo: su.titulo, texto: su.texto, ef };
  aplicar(e, ef, su.titulo);
  e.cartas = sacarCartas(e);
}

/* ---------- elegir ley y tratos ---------- */
export function elegir(e, i) { if (e.fase === 'senado' && i >= -1 && i < e.cartas.length) e.sel = i; return e.sel; }
export function costeTrato(e, b) { return K.tratoOro + K.tratoPorEscano * e.escanos[b]; }
/* plazo y coste de una promesa hecha ahora: hay que aprobar, en una estación posterior y como tarde en `estacion` (1-12),
   una ley que le guste a ese bando. Si no hay estación posterior, no se puede prometer. */
export function plazoPromesa(e) {
  const vence = Math.min(e.turno + K.promesaPlazo, K.turnos - 1);
  return { vence, estacion: vence + 1, nombre: nombreEstacion(vence), puede: vence > e.turno, favor: K.promesaRota.favor, humor: K.promesaRota.humor };
}
/* ¿ese bando ya vota «sí» entero a la ley elegida sin trato? */
function yaTeVotan(e, b, i = e.sel) {
  const ley = e.cartas[i]; if (!ley) return false;
  const sin = Object.assign({}, e.tratos); delete sin[b];
  return e.senadores.every(s => s.bando !== b || clase(probSi(e, ley, s, sin)) === 'seguro');
}
export function trato(e, b, tipo) {
  if (e.fase !== 'senado' || !BS.includes(b)) return false;
  if (!tipo) { delete e.tratos[b]; return true; }
  if (yaTeVotan(e, b)) return false; // no se compra lo que ya es tuyo
  if (tipo === 'promesa' && !plazoPromesa(e).puede) return false; // en la última estación no queda plazo
  if (tipo === 'oro' && e.oro < costeTrato(e, b) + BS.filter(x => x !== b && e.tratos[x] === 'oro').reduce((s, x) => s + costeTrato(e, x), 0)) return false;
  if (tipo === 'promesa' && e.promesas.some(p => p.bando === b)) return false; // una promesa abierta por bando
  e.tratos[b] = tipo; return true;
}

/* probabilidad de «sí» de cada senador */
function probSi(e, ley, s, tratos) {
  const g = gustoLey(ley)[s.bando];
  let p = K.base + g + s.sesgo + (e.humor[s.bando] - 50) / 160 + (e.favor - 50) / 220;
  if (tratos[s.bando]) p += K.tratoEmpuje;
  return cl(p, 0.02, 0.98);
}
const clase = p => p >= 0.75 ? 'seguro' : p <= 0.3 ? 'contra' : 'dudoso';
export function prevision(e, i = e.sel, tratos = e.tratos) {
  const ley = e.cartas[i]; if (!ley) return null;
  const r = { seguros: 0, dudosos: 0, contra: 0, esperado: 0, por: [], bandos: {} };
  BS.forEach(b => r.bandos[b] = { seguros: 0, dudosos: 0, contra: 0, yaTeVotan: yaTeVotan(e, b, i) });
  for (const s of e.senadores) { const p = probSi(e, ley, s, tratos), c = clase(p); r[c === 'seguro' ? 'seguros' : c === 'dudoso' ? 'dudosos' : 'contra']++; r.bandos[s.bando][c === 'seguro' ? 'seguros' : c === 'dudoso' ? 'dudosos' : 'contra']++; r.esperado += p; r.por.push({ i: s.i, bando: s.bando, p, clase: c }); }
  r.veto = e.plebe < TRIBUNO.umbral && perjudicaPlebe(ley);
  return r;
}

/* ---------- votar ---------- */
export function votar(e) {
  if (e.fase !== 'senado' || e.sel < 0) return null;
  const ley = e.cartas[e.sel], pv = prevision(e), votos = [];
  for (const b of BS) if (e.tratos[b] && pv.bandos[b].yaTeVotan) delete e.tratos[b];
  // se pagan los tratos
  for (const b of BS) {
    if (e.tratos[b] === 'oro') { const c = costeTrato(e, b); e.oro -= c; e.cambios.push({ que: 'oro', n: -c, motivo: 'Trato con los ' + BANDOS[b].nombre.toLowerCase() }); }
    if (e.tratos[b] === 'promesa') e.promesas.push({ bando: b, vence: plazoPromesa(e).vence, desde: e.turno });
  }
  let si = 0;
  for (const x of pv.por) { const v = x.clase === 'seguro' ? true : x.clase === 'contra' ? false : rnd(e) < x.p; if (v) si++; votos.push({ i: x.i, bando: x.bando, clase: x.clase, si: v }); }
  const mayoria = si >= K.mayoria, veto = mayoria && pv.veto, aprobada = mayoria && !veto;
  e.recuento = { ley, votos, si, no: K.escanos - si, aprobada, veto };
  if (aprobada) {
    const pl = plantillaOrden(e, ley);
    e.ordenes.push({ id: e.sigId++, ley, dura: pl.dura, hecho: 0, oro: pl.oro, grano: pl.grano, desde: e.turno, retraso: '' });
    e.aprobadas.push(ley);
    aplicar(e, { favor: K.favorAprobada }, 'Ley aprobada');
    BS.forEach(b => { if (gusta(ley, b)) e.humor[b] = cl(e.humor[b] + 5, 0, 100); if (disgusta(ley, b)) e.humor[b] = cl(e.humor[b] - 4, 0, 100); });
    // promesas cumplidas: una ley que gusta a ese bando
    e.promesas = e.promesas.filter(p => { if (gusta(ley, p.bando) && p.desde < e.turno) { e.humor[p.bando] = cl(e.humor[p.bando] + 5, 0, 100); e.cambios.push({ que: 'promesa', n: 1, motivo: 'Cumples tu promesa a los ' + BANDOS[p.bando].nombre.toLowerCase() }); return false; } return true; });
  } else aplicar(e, { favor: -K.favorCae }, veto ? 'El tribuno veta la ley' : 'La ley cae en el Senado');
  e.fase = 'mando';
  return e.recuento;
}
/* leva pagada: una legión con oro, sin pasar por el Senado. Una por estación; cada compra sube el precio y resta favor */
export const costeLeva = e => K.leva.oro + K.leva.sube * (e.levas || 0);
export function puedeLeva(e) {
  if (e.fase !== 'senado' && e.fase !== 'mando') return { ok: false, porque: 'La partida ha terminado' };
  if (e.levaTurno === e.turno) return { ok: false, porque: 'Ya pagaste una leva esta estación' };
  if (e.oro < costeLeva(e)) return { ok: false, porque: `Cuesta ${costeLeva(e)} de oro (tienes ${e.oro})` };
  return { ok: true, oro: costeLeva(e), favor: K.leva.favor, grano: K.leva.grano };
}
export function levaPagada(e) {
  if (!puedeLeva(e).ok) return false;
  const c = costeLeva(e); e.levas = (e.levas || 0) + 1; e.levaTurno = e.turno;
  aplicar(e, { oro: -c, favor: -K.leva.favor }, 'Leva pagada sin el Senado');
  e.ordenes.push({ id: e.sigId++, ley: { tipo: 'leva' }, dura: 1, hecho: 0, oro: 0, grano: K.leva.grano, desde: e.turno, retraso: '' });
  return true;
}
export function dejarPasar(e) { if (e.fase !== 'senado') return; e.recuento = null; aplicar(e, { favor: -K.favorPasa }, 'Dejas pasar la votación'); e.fase = 'mando'; }

/* ---------- fin de estación: la ciudad cumple las órdenes ---------- */
/* lo nuevo que aparece en la ciudad, con id estable para que la vista haga zoom y destello:
   edificio → id del edificio y n = nivel nuevo; legión → id 'legion-K' y n = K (número de orden); saber → id del saber; edad → id 'edad-N' */
function legionesNuevas(e, n, m) { for (let k = 0; k < n; k++) e.nuevos.push({ tipo: 'legion', id: 'legion-' + (e.legiones + k + 1), n: e.legiones + k + 1 }); aplicar(e, { legiones: n }, m); }
function cumplir(e, o) {
  const l = o.ley, m = 'Orden cumplida: ' + leyTexto(l, e).titulo;
  e.nuevos = e.nuevos || [];
  switch (l.tipo) {
    case 'reclutar': legionesNuevas(e, e.edad >= 2 ? 2 : 1, m); aplicar(e, { plebe: -3 }, m); break;
    case 'leva': legionesNuevas(e, 1, m); break;
    case 'ampliar': e.edif[l.obj]++; e.pob += 4; e.cambios.push({ que: 'edif', obj: l.obj, n: 1, motivo: m }); e.nuevos.push({ tipo: 'edificio', id: l.obj, n: e.edif[l.obj] }); break;
    case 'estudiar': e.saberes.push(l.obj); e.cambios.push({ que: 'saber', obj: l.obj, n: 1, motivo: m }); e.nuevos.push({ tipo: 'saber', id: l.obj, n: e.saberes.length }); break;
    case 'edad': e.edad = l.obj; e.cambios.push({ que: 'edad', obj: l.obj, n: 1, motivo: m }); e.nuevos.push({ tipo: 'edad', id: 'edad-' + l.obj, n: l.obj });
      if (l.obj === 2 && K.edad2Legion) legionesNuevas(e, K.edad2Legion, 'La flota nueva trae una legión de marineros'); break;
    case 'impuestos': aplicar(e, { oro: 70, plebe: -12 }, m); break;
    case 'granoBarato': aplicar(e, { plebe: 15 }, m); break;
    case 'juegos': aplicar(e, { plebe: 18, favor: 3 }, m); break;
  }
}
export function terminar(e) {
  if (e.fase === 'senado') dejarPasar(e);
  if (e.fase !== 'mando') return null;
  e.nuevos = [];
  // 1 · órdenes: cada una paga su parte de la estación; sin recursos se retrasa
  for (const o of e.ordenes) {
    if (o.oro > e.oro || o.grano > Math.max(0, e.grano)) { o.retraso = o.oro > e.oro ? 'falta oro' : 'falta grano'; e.cambios.push({ que: 'retraso', n: -1, motivo: leyTexto(o.ley, e).titulo + ': ' + o.retraso }); continue; }
    e.oro -= o.oro; e.grano -= o.grano; o.retraso = ''; o.hecho++;
    if (o.hecho >= o.dura) { o.lista = true; cumplir(e, o); }
  }
  e.ordenes = e.ordenes.filter(o => !o.lista);
  // 2 · economía
  const d = e.edif, I = K.ingreso, G = K.grano;
  aplicar(e, { oro: I.base + d.mercado * I.mercado + d.muelle * I.muelle - e.legiones * K.legion.oro }, 'Tributos y soldadas');
  aplicar(e, { grano: d.granja * G.granja + d.muelle * G.muelle + (e.saberes.includes('apio') ? 6 : 0) - Math.round(e.pob * G.porMil) - e.legiones * K.legion.grano }, 'Cosecha y raciones');
  let dp = -K.plebeBaja + d.templo * K.templo; if (e.grano < 15) dp -= 5; if (fuerza(e) < e.amenaza) dp -= 2;
  aplicar(e, { plebe: dp }, 'Ánimo de la plebe');
  if (e.plebe > 50) e.pob += 2;
  // 3 · amenaza
  aplicar(e, { amenaza: amenazaSube(e) }, 'Cartago se arma');
  // 4 · promesas vencidas
  e.promesas = e.promesas.filter(p => { if (e.turno >= p.vence) { e.humor[p.bando] = cl(e.humor[p.bando] - K.promesaRota.humor, 0, 100); aplicar(e, { favor: -K.promesaRota.favor }, 'Rompes tu promesa a los ' + BANDOS[p.bando].nombre.toLowerCase()); return false; } return true; });
  // 5 · cuentas en rojo
  e.rojos.oro = e.oro < 0 ? e.rojos.oro + 1 : 0; e.rojos.grano = e.grano < 0 ? e.rojos.grano + 1 : 0;
  const informe = { turno: e.turno, cambios: e.cambios.slice(), suceso: e.suceso, aprobadas: e.aprobadas.slice(), nuevo: e.nuevos.slice() };
  e.historial.push({ turno: e.turno, oro: e.oro, grano: e.grano, plebe: e.plebe, favor: e.favor, legiones: e.legiones, amenaza: e.amenaza, fuerza: fuerza(e), edad: e.edad, saberes: e.saberes.length, ley: e.recuento ? leyTexto(e.recuento.ley, e).titulo : null, aprobada: !!(e.recuento && e.recuento.aprobada) });
  e.ultimo = informe;
  // 6 · ¿se acaba?
  const fin = juzgar(e);
  if (fin) { e.fin = fin; e.fase = 'fin'; return informe; }
  e.turno++; repartirEscanos(e); empezarEstacion(e);
  return informe;
}

/* ---------- veredicto ---------- */
export function juzgar(e) {
  const causas = [];
  if (e.plebe <= 0) return { gana: false, titulo: 'Motín de la plebe', causas: ['La plebe llegó a 0 de contento y se echó a la calle.'], nota: 0 };
  if (e.rojos.grano >= 2) return { gana: false, titulo: 'Hambre en Roma', causas: ['El grano estuvo en negativo dos estaciones seguidas.'], nota: 0 };
  if (e.rojos.oro >= 2) return { gana: false, titulo: 'El arca está vacía', causas: ['El oro estuvo en negativo dos estaciones seguidas: nadie paga a las legiones.'], nota: 0 };
  if (e.favor <= 0) return { gana: false, titulo: 'El Senado te depone', causas: ['El favor del Senado llegó a 0.'], nota: 0 };
  if (e.turno < K.turnos - 1) return null;
  const f = fuerza(e), cubre = f >= e.amenaza;
  if (!cubre) return { gana: false, titulo: 'Roma saqueada', causas: [`Cartago golpea con ${e.amenaza} y tus legiones solo suman ${f}.`], nota: 1 };
  if (e.edad < 2) return { gana: false, titulo: 'Sin triunfo', causas: ['Aguantaste el golpe, pero Roma no salió al mar: sigues en la Edad I.', 'Para el triunfo hace falta la Edad II «Roma sale al mar».'], nota: 3 };
  return { gana: true, titulo: 'Triunfo', causas: [`Cartago golpea con ${e.amenaza}; tus fuerzas suman ${f}.`, 'Roma está en la ' + (e.edad === 3 ? 'Edad III «Aníbal»' : 'Edad II «Roma sale al mar»') + '.'], nota: nota(e) };
}
export function nota(e) {
  let n = 6; const f = fuerza(e);
  if (e.edad >= 3) n += 2; if (e.saberes.length >= 4) n += 1; if (e.plebe >= 60) n += 0.5; if (f - e.amenaza >= 20) n += 0.5;
  return Math.min(10, n);
}

/* ---------- consejo: una o dos frases concretas sobre lo que faltó (al final) o lo que más aprieta (en juego) ---------- */
export function consejo(e) {
  const f = fuerza(e), fl = fuerzaLegion(e), fin = e.fin;
  const legs = x => { const n = Math.ceil(x / fl); return n === 1 ? 'una legión' : n === 2 ? 'dos legiones' : n + ' legiones'; };
  const reqII = () => requisitosEdad(e, 2).faltan.filter(t => !t.startsWith('Estar')).join(', ');
  if (fin) {
    switch (fin.titulo) {
      case 'Roma saqueada': { const x = e.amenaza - f; return `Te faltaron ${x} de fuerza: ${legs(x)}${x <= K.muralla ? ' o un tramo de muralla' : ''}. La amenaza sube ${amenazaSube(e)} cada estación y los sucesos la empujan: recluta pronto, que la leva tarda.`; }
      case 'Sin triunfo': return `Aguantaste el golpe, pero no llegaste a la Edad II. Te faltó: ${reqII() || 'votar «Pasar de edad»'}.`;
      case 'Motín de la plebe': return 'La plebe llegó a 0. Cuando baje de 40, vota juegos o grano barato; un templo la sostiene cada estación.';
      case 'Hambre en Roma': return `Te quedaste sin grano dos estaciones. Cada legión come ${K.legion.grano}: amplía las granjas antes de reclutar.`;
      case 'El arca está vacía': return `El oro estuvo en rojo dos estaciones. Cada legión cuesta ${K.legion.oro} por estación: aprueba el tributo o un mercado.`;
      case 'El Senado te depone': return `El favor llegó a 0. Una ley que cae resta ${K.favorCae} y dejar pasar resta ${K.favorPasa}: elige leyes que gusten y ofrece tratos a los bandos que dudan.`;
      case 'Triunfo': { const m = f - e.amenaza, mas = []; if (e.edad < 3) mas.push('llegar a la Edad III'); if (e.saberes.length < 4) mas.push('cuatro saberes'); if (m < 20) mas.push('20 de margen sobre el golpe'); return `Ganaste con ${m} de margen sobre el golpe.${mas.length ? ' Para más nota: ' + mas.join(', ') + '.' : ''}`; }
    }
    return fin.causas.join(' ');
  }
  const g = golpe(e);
  if (e.grano < 25) return `El grano escasea (${e.grano}): amplía las granjas o evita reclutar esta estación.`;
  if (e.plebe < 35) return `La plebe está en ${e.plebe}: vota juegos o grano barato antes de que se amotine.`;
  if (e.favor < 25) return `El favor está en ${e.favor}: no dejes caer otra ley; ofrece tratos.`;
  if (g.falta > 0) return `Para el golpe te faltan unos ${g.falta} de fuerza (se espera ${g.esperado}, entre ${g.min} y ${g.max}): ${legs(g.falta)}${g.falta <= K.muralla ? ' o un tramo de muralla' : ', o menos legiones y muralla'}. Si te sobra oro, la leva pagada no pasa por el Senado.`;
  if (e.edad < 2) return `Vas cubierto ante el golpe. Falta la Edad II: ${reqII() || 'vota «Pasar de edad»'}.`;
  return 'Vas cubierto y en la Edad II. Guarda margen: los sucesos aún pueden subir la amenaza.';
}
/* estación para pintar la ciudad (cielo, árboles, nieve) */
export const estacionVisual = e => ['primavera', 'verano', 'otono', 'invierno'][e.turno % 4];
