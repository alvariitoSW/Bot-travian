// EV8 · «Gobierno y ciudad juntos» — reglas sin pantalla. Corren en Node y en el navegador. Diseño: DISENO-EV8.md.
// Doce estaciones (264–262 a.C.). Cada primavera (turnos 0, 4, 8): CONSEJO DEL AÑO → eliges hasta 3 encargos (plan del año).
// Cada estación: suceso → JUICIO del Senado (▲/▼ que suman o restan favor) → CUESTIÓN DE ESTADO (3 leyes sin obras; tratos,
// recuento senador a senador, veto del tribuno) → un ACTO opcional (banquete, juegos, rito) → obras a mano cuando quieras →
// terminar(): la ciudad cumple las órdenes, los consejeros delegados empiezan solos su parte del plan, y se juzga.
// El azar sale de una semilla guardada en el estado (mulberry32): pasar `e` por JSON entre pasos no cambia nada.
//
// Fases: 'consejo' (primavera, eligiendo plan) → 'senado' (eligiendo ley) → 'mando' (votado o dejado pasar) → terminar() → … → 'fin'.
//   En 'consejo', elegir/trato/votar/dejarPasar/terminar cierran el consejo sin plan si no se eligió.
// Uso:  crear(semilla) → e · nombreEstacion(t) · estacionVisual(e) → 'primavera'|'verano'|'otono'|'invierno' · fuerza(e) · nota(e)
// CONSEJO Y CARGOS
//   encargosPropuestos(e) → [{id, cargo:'edil'|'consul'|'pontifice', bando, tipo:'obra'|'legion'|'saber', obj, n, titulo, da,
//       cuesta:{oro, grano, dura}, cuestaTexto, falta:[textos], puede, elegido}]  (3 por consejero; ids 'obra-mercado-2', 'legion', 'saber-quinque')
//   elegirPlan(e, ids[]) → {ok, porque?, plan}: hasta 3 encargos; solo en fase 'consejo'. e.plan = [{…encargo, hecho, enCurso}]
//   planDelAnio(e) → e.plan con hecho/enCurso al día · delegar(e, cargo, bool) → e.delegados {edil, consul, pontifice}
//   Delegado: al terminar la estación el consejero empieza UNA obra/encargo de su parte del plan, por orden, si le queda oro tras
//   la reserva (K.reserva); cuesta K.delegaSobre más (licencia de juego) y empieza a contar en la estación siguiente. Sesgo: el
//   Cónsul recluta si sobra mucho oro; el Pontífice hace un rito pequeño; el Edil, si el Foro bloquea, sube antes el Foro.
// CIUDAD
//   e.edif = {foro, granja, mercado, muelle, cuartel, templo, muralla}: niveles 0–3. Ninguno pasa del nivel del Foro; Foro 3 pide la
//   Edad II; el nivel 3 de cada edificio pide un saber (EDIFICIOS[id].saber3). Escaños de cada bando: pesos(e).
//   fichaEdificio(e, id) → {id, nombre, nivel, max, produce, produceSiguiente|null, cargo, cargoNombre, delegado, enPlan,
//       coste:{oro, grano}, dura, falta:[textos en llano], puede, enObra:{faltan, mano}|null, bando, fuente, dictamen}
//   mejorar(e, id) → {ok, porque?}: empieza ya la obra del nivel siguiente y pagas tú.
//   empezarEncargo(e, idEncargo) → {ok, porque?}: lo mismo para cualquier encargo ('legion', 'saber-castra', 'obra-…').
// SENADO
//   juicio(e) → {lineas:[{marca:'▲'|'▼'|'·', n, texto}], total, imagen:'senado'}: ya aplicado al favor al empezar la estación.
//   elegir(e, i) · votar(e) → recuento · dejarPasar(e) · requisitosEdad(e, n) → {ok, faltan}
//   trato(e, bando, 'oro'|'promesa'|null) → bool (igual que EV7) · costeTrato(e, b) · plazoPromesa(e) → {vence, estacion, nombre, puede, favor, humor}
//   prevision(e, i?) → {seguros, dudosos, contra, esperado, veto, por:[{i,bando,p,clase}], bandos:{ter|mer|mil:{seguros,dudosos,contra,yaTeVotan}}}
//   gusta(ley, b) · disgusta(ley, b) · efectoBando(ley) → {ter,mer,mil: +1|0|−1} · gustoLey(ley) · perjudicaPlebe(ley)
//   leyTexto(ley, e?) → {titulo, efecto, ciudad, sitio, imagen, fuente, dictamen}: `ciudad` dice en llano qué cambia en la ciudad;
//       `sitio` es el id del lugar del dibujo: uno de los 7 edificios o 'plebe'.
//   llega(e, ley) · golpe(e) → {estacion, ahora, min, esperado, max, fuerza, enCola, falta} · amenazaFinal(e)
//   costeLeva(e) · puedeLeva(e) · levaPagada(e): legión con oro sin votar (una por estación), como en EV7.
// ACTOS (uno por estación, opcional)
//   actos(e) → [{tipo:'banquete'|'juegos'|'rito', titulo, texto, oro, puede, porque, bandos?, sitio, imagen}]
//   hacerActo(e, tipo, bando?) → {ok, porque?, tipo, titulo, efectos:[{que, n}], confidencia: texto|null,
//       aprende:{texto, fuente, dictamen, imagen}, imagen, cambiosCiudad:[…]}. `imagen` casa con imagenes/creditos.json.
// FIN DE ESTACIÓN
//   terminar(e) → informe {turno, cambios, suceso, aprobadas, delegaron:[textos],
//       nuevo:[{tipo:'edificio'|'legion'|'saber'|'edad', id, n}], cambiosCiudad:[{sitio, antes, despues, porque}]}
//       ids estables: edificio → 'granja'… (n = nivel); legión → 'legion-K'; saber → 'castra'…; edad → 'edad-2'.
//   consejo(e) → texto: al final, por qué ganaste o perdiste; durante la partida, lo que más aprieta.
//   Revuelta: plebe por debajo de K.revuelta.umbral dos estaciones seguidas (o a 0) → final «Revuelta de la plebe».
//   Las promesas rotas restan favor en el juicio siguiente: si pierdes antes, no se cobran.
// Equilibrio (prueba.mjs, 200 semillas): nada 0 %, azar 6 %, delegaTodo 46 %, sensato 68,5 %, cabeza 100 % (ninguna por hambre).

/* ---------- azar guardable ---------- */
function rnd(e) { let t = (e.rng = (e.rng + 0x6D2B79F5) | 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const ri = (e, n) => Math.floor(rnd(e) * n);
const cl = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- cifras del equilibrio (afinadas con prueba.mjs) ---------- */
export const K = {
  turnos: 12, mayoria: 16, escanos: 30, minBando: 4,
  ini: { oro: 100, grano: 80, plebe: 55, favor: 50, legiones: 2, amenaza: 30, pob: 90 },
  ingresoBase: 20, porMil: 1 / 8,
  legion: { oro: 4, grano: 4, fuerza: 12 }, muralla: 14, amenazaSube: 3, amenazaQuinque: 3, corvus: 25,
  plebeBaja: 1, tratoOro: 6, tratoPorEscano: 1, tratoEmpuje: 0.32, promesaPlazo: 3, promesaRota: { favor: 7, humor: 15 },
  favorAprobada: 3, base: 0.42, favorCae: 4, favorPasa: 6,
  gusta: 0.15, disgusta: -0.1, // umbral único: por encima «le gusta» (▲, humor +5, cumple promesa); por debajo «no le gusta» (▼, humor −4)
  edad2Legion: 1, // legión de regalo al llegar a la Edad II: Polibio 1.20.14 (socios navales). Dictamen: licencia de juego
  leva: { oro: 60, sube: 20, favor: 5, grano: 6 },
  reserva: 30, delegaSobre: 0.2, obrasForo: 1, // obras a la vez = nivel del Foro + obrasForo
  encargo: { legion: { oro: 22, grano: 8 }, saber: { oro: 24 } },
  revuelta: { umbral: 20 },
  juicio: { plebeAlta: 60, plebeBaja: 35, contenta: 2, murmura: -2, borde: -4, sinGrano: -3, poco: -1, plan: 3, abandono: -3, sinPlan: -2, enMarcha: 1, promesa: 2, banquete: -1, cartago: -2 },
  actos: { banquete: { oro: 20, humor: 12, otros: -4, empuje: 0.12, confidencia: 0.5 }, juegos: { oro: 30, plebe: 14, favor: 1 }, rito: { oro: 8, favor: 4, plebe: 3 } },
};

/* ---------- bandos del Senado ---------- */
export const BANDOS = {
  ter: { id: 'ter', nombre: 'Terratenientes', corto: 'Terraten.', color: '#5d7a2a', fuente: 'Livio 7.16, 21.63 (los padres de la tierra; lex Claudia 218 a.C.)', dictamen: 'probable' },
  mer: { id: 'mer', nombre: 'Mercaderes', corto: 'Mercad.', color: '#b8862b', fuente: 'Polibio 3.22-25 (tratados de comercio con Cartago)', dictamen: 'probable' },
  mil: { id: 'mil', nombre: 'Militares', corto: 'Militares', color: '#a3231a', fuente: 'Polibio 6.19 (la carrera exige diez campañas)', dictamen: 'probable' },
};
export const BS = ['ter', 'mer', 'mil'];
export const TRIBUNO = { nombre: 'Tribuno de la plebe', fuente: 'Livio 2.33; Polibio 6.16.4-5 (el veto de los tribunos)', dictamen: 'histórico', umbral: 30 };

/* ---------- consejeros (cargos) ---------- */
export const CARGOS = {
  edil: { id: 'edil', nombre: 'Edil', bando: 'mer', area: 'la ciudad: Foro, granjas, mercado y muelle', fuente: 'Livio 6.42 (ediles curules, 367 a.C.); Cicerón, Leyes 3.7 (cuidan la ciudad, el grano y los juegos)', dictamen: 'probable; el reparto de tareas es licencia de juego' },
  consul: { id: 'consul', nombre: 'Cónsul', bando: 'mil', area: 'la guerra: Campo de Marte, muralla y legiones', fuente: 'Polibio 6.12 (los cónsules mandan el ejército)', dictamen: 'histórico' },
  pontifice: { id: 'pontifice', nombre: 'Pontífice', bando: 'ter', area: 'el templo, los saberes, las fiestas y los ritos', fuente: 'Livio 1.20 (Numa crea el pontífice); Cicerón, Leyes 2.20', dictamen: 'probable; que lleve los saberes es licencia de juego' },
};
export const ORDEN_CARGOS = ['edil', 'consul', 'pontifice'];

/* ---------- edificios: niveles 0–3; arrays por nivel [0,1,2,3] ---------- */
export const EDIFICIOS = {
  foro: { id: 'foro', nombre: 'Foro', cargo: 'edil', bando: null, max: 3, oro: [0, 0, 45, 80], grano: [0, 0, 0, 0], dura: [0, 1, 2, 2], prod: { favor: [0, 0, 1, 2] }, saber3: null, fuente: 'Livio 1.38, 1.56 (Tarquinio drena el Foro con la Cloaca Máxima); tiendas y basílicas llegan después', dictamen: 'probable; que mande en el nivel de los demás es licencia de juego' },
  granja: { id: 'granja', nombre: 'Granjas', cargo: 'edil', bando: 'ter', max: 3, oro: [0, 15, 30, 50], grano: [0, 0, 0, 0], dura: [0, 1, 2, 2], prod: { grano: [0, 20, 34, 48] }, saber3: 'apio', fuente: 'Catón, De agri cultura 1 (la finca del Lacio)', dictamen: 'probable' },
  mercado: { id: 'mercado', nombre: 'Mercado', cargo: 'edil', bando: 'mer', max: 3, oro: [0, 18, 35, 55], grano: [0, 0, 0, 0], dura: [0, 1, 2, 2], prod: { oro: [0, 14, 26, 38] }, saber3: 'griego', fuente: 'Livio 1.35, 3.27 (el Foro y sus tabernae)', dictamen: 'probable' },
  muelle: { id: 'muelle', nombre: 'Muelle del Tíber', cargo: 'edil', bando: 'mer', max: 3, oro: [0, 25, 40, 60], grano: [0, 0, 0, 0], dura: [0, 1, 2, 2], prod: { oro: [0, 8, 14, 20], grano: [0, 6, 12, 18] }, saber3: 'quinque', fuente: 'Livio 35.10 (el Emporio sobre el Tíber, 193 a.C.: aquí adelantado)', dictamen: 'licencia de juego' },
  cuartel: { id: 'cuartel', nombre: 'Campo de Marte', cargo: 'consul', bando: 'mil', max: 3, oro: [0, 18, 35, 55], grano: [0, 0, 0, 0], dura: [0, 1, 2, 2], prod: { tope: [2, 4, 6, 8] }, saber3: 'castra', fuente: 'Polibio 6.19-20 (la leva se reúne en Roma)', dictamen: 'probable' },
  templo: { id: 'templo', nombre: 'Templo', cargo: 'pontifice', bando: 'ter', max: 3, oro: [0, 20, 35, 55], grano: [0, 0, 0, 0], dura: [0, 1, 2, 2], prod: { plebe: [0, 3, 5, 7] }, saber3: 'griego', fuente: 'Livio 10.33 y Fasti (templos votados en guerra, de toba, madera y terracota)', dictamen: 'histórico' },
  muralla: { id: 'muralla', nombre: 'Muralla Serviana', cargo: 'consul', bando: 'mil', max: 3, oro: [0, 22, 40, 60], grano: [0, 0, 0, 0], dura: [0, 1, 2, 2], prod: { fuerza: [0, 14, 28, 42] }, saber3: 'apio', fuente: 'Livio 6.32 (muralla de toba de Grotta Oscura, 378 a.C.)', dictamen: 'histórico' },
};
export const ORDEN_EDIF = ['foro', 'granja', 'mercado', 'muelle', 'cuartel', 'templo', 'muralla'];
const P = (id, k, n) => (EDIFICIOS[id].prod[k] || [])[cl(n, 0, 3)] || 0;
export const topeLegiones = e => P('cuartel', 'tope', e.edif.cuartel);

/* ---------- saberes: seis en tres ramas ---------- */
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
const SITIO_RAMA = { guerra: 'cuartel', mar: 'muelle', ciudad: 'foro' };

/* ---------- edades ---------- */
export const EDADES = {
  1: { n: 1, nombre: 'Roma itálica' },
  2: { n: 2, nombre: 'Roma sale al mar', saberes: 2, edif: { muelle: 1, mercado: 2 }, fuente: 'Polibio 1.20-21 (Roma construye su primera flota, 261-260 a.C.). Las edades son licencia de juego.', dictamen: 'licencia de juego' },
  3: { n: 3, nombre: 'Aníbal', saberes: 4, edif: { muralla: 2, cuartel: 2 }, fuente: 'Hechos de 218-201 a.C. Las edades son licencia de juego.', dictamen: 'licencia de juego' },
};

/* ---------- estaciones ---------- */
const EST = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
export const nombreEstacion = t => EST[t % 4] + ' de ' + (264 - Math.floor(t / 4)) + ' a.C.';
export const estacionVisual = e => ['primavera', 'verano', 'otono', 'invierno'][e.turno % 4];

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

/* ---------- leyes (cuestiones de Estado; las obras ya no se votan) ---------- */
export const TIPOS = {
  reclutar: { nombre: 'Reclutar una legión', icono: 'legion', imagen: 'legionario', gusta: { ter: -0.12, mer: -0.05, mil: 0.35 }, plebe: -3, fuente: 'Polibio 6.19-21 (la leva)', dictamen: 'histórico' },
  socios: { nombre: 'Pedir tropas a los socios', icono: 'legion', imagen: 'legionario', gusta: { ter: -0.15, mer: 0.05, mil: 0.25 }, plebe: 0, fuente: 'Polibio 2.24, 6.26 (los aliados itálicos aportan tropas)', dictamen: 'histórico' },
  estudiar: { nombre: 'Estudiar un saber', icono: 'saber', imagen: 'barco', gusta: {}, plebe: 0, fuente: 'Licencia de juego: Roma no «estudiaba»; aprendía de griegos y púnicos', dictamen: 'licencia de juego' },
  edad: { nombre: 'Pasar de edad', icono: 'edad', imagen: 'barco', gusta: { ter: -0.12, mer: 0.25, mil: 0.08 }, plebe: 0, fuente: 'Licencia de juego (ver EDADES)', dictamen: 'licencia de juego' },
  impuestos: { nombre: 'Tributo extraordinario', icono: 'oro', imagen: 'moneda', gusta: { ter: -0.2, mer: -0.18, mil: 0.22 }, plebe: -12, fuente: 'Livio 7.27, 23.31 (tributum doble en guerra)', dictamen: 'histórico' },
  granoBarato: { nombre: 'Grano barato para la plebe', icono: 'grano', imagen: 'loba', gusta: { ter: -0.3, mer: 0.02, mil: 0.1 }, plebe: 15, fuente: 'Livio 2.34, 10.11 (repartos de grano en carestía)', dictamen: 'probable' },
  leva: { nombre: 'Leva pagada', icono: 'legion', imagen: 'legionario', gusta: {}, plebe: 0, sinSenado: true, fuente: 'Livio 22.57.11-12 (volones, 216 a.C.); Livio 24.11.7-9. Aquí adelantado y sin decreto del Senado', dictamen: 'licencia de juego' },
  obra: { nombre: 'Obra', icono: 'obra', imagen: 'templo', gusta: {}, plebe: 0, sinSenado: true, fuente: 'Livio 10.23, 10.33 (obras con multas y botín)', dictamen: 'probable' },
};

/* ---------- estado ---------- */
const marcasVacias = () => ({ planHecho: 0, abandonados: 0, promCumplidas: 0, promRotas: [], banquete: null });
export function crear(semilla = 1) {
  const s = (semilla | 0) || 1, I = K.ini;
  const e = {
    semilla: s, rng: Math.imul(s, 0x9E3779B1) ^ 0x5bd1e995, turno: 0, fase: 'senado', fin: null,
    oro: I.oro, grano: I.grano, plebe: I.plebe, favor: I.favor, legiones: I.legiones, amenaza: I.amenaza, pob: I.pob,
    edad: 1, saberes: [], edif: { foro: 1, granja: 1, mercado: 1, muelle: 0, cuartel: 1, templo: 0, muralla: 1 },
    humor: { ter: 50, mer: 50, mil: 50 }, escanos: null, senadores: [],
    cartas: [], sel: -1, tratos: {}, recuento: null, ordenes: [], promesas: [], suceso: null, proxSuceso: null,
    cambios: [], aprobadas: [], cambiosCiudad: [], delegaron: [], rojos: { oro: 0, grano: 0 }, revuelta: 0, salidos: [], historial: [], sigId: 1,
    plan: [], propuestos: [], delegados: { edil: false, consul: false, pontifice: false },
    juicio: null, marcas: marcasVacias(), actoTurno: -1, banquete: null, vistos: {},
  };
  e.senadores = Array.from({ length: K.escanos }, (_, i) => ({ i, sesgo: +(rnd(e) * 0.5 - 0.25).toFixed(3) }));
  repartirEscanos(e);
  empezarEstacion(e);
  return e;
}

/* escaños: cuántos tiene cada bando sale de la ciudad */
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

/* ---------- fuerza y amenaza ---------- */
export function fuerzaLegion(e) { return K.legion.fuerza + (e.saberes.includes('castra') ? 3 : 0) + (e.saberes.includes('pilum') ? 3 : 0) + (e.edif.cuartel >= 3 ? 2 : 0); }
export function fuerza(e) { return e.legiones * fuerzaLegion(e) + P('muralla', 'fuerza', e.edif.muralla) + (e.saberes.includes('corvus') ? K.corvus : 0); }
export const amenazaSube = e => K.amenazaSube - (e.saberes.includes('quinque') ? K.amenazaQuinque : 0);
const legPorLeva = e => (e.edad >= 2 ? 2 : 1);
export function golpe(e) {
  const fin = e.fase === 'fin', cierres = fin ? 0 : K.turnos - e.turno, n = fin ? 0 : Math.max(0, K.turnos - 1 - e.turno);
  const q = e.saberes.includes('quinque');
  const mazo = SUCESOS.filter(x => !e.salidos.includes(x.id)).map(x => { const a = x.ef.amenaza || 0; return x.mar && q ? Math.round(a / 2) : a; }).sort((a, b) => a - b);
  const k = Math.min(n, mazo.length), media = mazo.length ? mazo.reduce((a, b) => a + b, 0) / mazo.length : 0;
  const base = e.amenaza + amenazaSube(e) * cierres;
  const min = base + mazo.slice(0, k).reduce((a, b) => a + b, 0), max = base + mazo.slice(mazo.length - k).reduce((a, b) => a + b, 0);
  const esperado = Math.round(base + media * k), f = fuerza(e), fl = fuerzaLegion(e);
  const enCola = e.ordenes.reduce((s, o) => { const t = o.ley.tipo; return s + (t === 'reclutar' ? legPorLeva(e) * fl : t === 'leva' || t === 'socios' ? fl : t === 'obra' && o.ley.obj === 'muralla' ? K.muralla : t === 'estudiar' && o.ley.obj === 'corvus' ? K.corvus : 0); }, 0);
  return { estacion: K.turnos, ahora: e.amenaza, min, esperado, max, fuerza: f, enCola, falta: Math.max(0, esperado - f - enCola) };
}
export const amenazaFinal = e => golpe(e).esperado;

/* ---------- órdenes: lo que tarda y cuesta cada ley (se paga por estación, como en EV7) ---------- */
export function plantillaOrden(e, ley) {
  const ap = e.saberes.includes('apio') ? 1 : 0, gr = e.saberes.includes('griego') ? 1 : 0;
  switch (ley.tipo) {
    case 'reclutar': return { dura: e.edif.cuartel >= 2 ? 1 : 2, oro: 12, grano: 8 };
    case 'socios': return { dura: 1, oro: 0, grano: 20 };
    case 'estudiar': return { dura: Math.max(1, 2 - gr), oro: 14, grano: 0 };
    case 'edad': return { dura: 1, oro: 30, grano: 10 };
    case 'impuestos': return { dura: 1, oro: 0, grano: 0 };
    case 'granoBarato': return { dura: 1, oro: 0, grano: 26 };
    case 'leva': return { dura: 1, oro: 0, grano: K.leva.grano };
    case 'obra': { const x = EDIFICIOS[ley.obj]; return { dura: Math.max(1, x.dura[cl(ley.n, 1, 3)] - ap), oro: 0, grano: 0 }; }
  }
  return { dura: 1, oro: 0, grano: 0 };
}
const enCola = (e, tipo, obj) => e.ordenes.some(o => o.ley.tipo === tipo && (obj == null || o.ley.obj === obj));
const legionesEnCola = e => e.ordenes.reduce((s, o) => s + (o.ley.tipo === 'reclutar' ? legPorLeva(e) : o.ley.tipo === 'leva' || o.ley.tipo === 'socios' ? 1 : 0), 0);
export const cabeLegion = e => e.legiones + legionesEnCola(e) < topeLegiones(e);

/* gusto de cada bando por una ley concreta */
export function gustoLey(ley) {
  const g = Object.assign({ ter: 0, mer: 0, mil: 0 }, (TIPOS[ley.tipo] || {}).gusta);
  if (ley.tipo === 'estudiar') { const r = SABERES[ley.obj].rama; if (r === 'guerra') g.mil += 0.28; if (r === 'mar') { g.mer += 0.28; g.ter -= 0.08; } if (r === 'ciudad') { g.ter += 0.12; g.mer += 0.12; g.mil -= 0.08; } }
  return g;
}
export function gusta(ley, b) { return gustoLey(ley)[b] > K.gusta; }
export function disgusta(ley, b) { return gustoLey(ley)[b] < K.disgusta; }
export function efectoBando(ley) { const o = {}; BS.forEach(b => o[b] = gusta(ley, b) ? 1 : disgusta(ley, b) ? -1 : 0); return o; }
export function perjudicaPlebe(ley) { return (TIPOS[ley.tipo] || {}).plebe < 0; }

/* ---------- requisitos ---------- */
export function requisitosEdad(e, n) {
  const E = EDADES[n]; if (!E) return { ok: false, faltan: ['No hay más edades'] };
  const f = [];
  if (e.edad !== n - 1) f.push('Estar en la ' + EDADES[n - 1].nombre);
  if (e.saberes.length < E.saberes) f.push(`${E.saberes} saberes (tienes ${e.saberes.length})`);
  for (const k in E.edif) if (e.edif[k] < E.edif[k]) f.push(`${EDIFICIOS[k].nombre} ${E.edif[k]} (tienes ${e.edif[k]})`);
  return { ok: f.length === 0, faltan: f };
}
export function saberesPosibles(e) { return ORDEN_SAB.filter(id => { const s = SABERES[id]; return !e.saberes.includes(id) && !enCola(e, 'estudiar', id) && s.edad <= e.edad && s.req.every(r => e.saberes.includes(r)) && (!s.edif || e.edif[s.edif] > 0); }); }

/* ---------- textos de producción ---------- */
export function produceTexto(id, n) {
  if (id === 'foro') { const f = P('foro', 'favor', n); return n ? `Deja subir los demás edificios hasta nivel ${n} y dirige ${n + K.obrasForo} obras a la vez${f ? `; +${f} de favor cada estación` : ''}` : 'Sin Foro no hay gobierno'; }
  if (id === 'cuartel') { const t = P('cuartel', 'tope', n); return `Caben ${t} legiones${n >= 2 ? '; reclutar tarda 1 estación' : ''}${n >= 3 ? '; +2 de fuerza por legión' : ''}`; }
  if (!n) return 'Aún no está construido';
  if (id === 'granja') return `+${P(id, 'grano', n)} de grano cada estación`;
  if (id === 'mercado') return `+${P(id, 'oro', n)} de oro cada estación`;
  if (id === 'muelle') return `+${P(id, 'oro', n)} de oro y +${P(id, 'grano', n)} de grano cada estación; abre los saberes del mar`;
  if (id === 'templo') return `+${P(id, 'plebe', n)} de contento de la plebe cada estación`;
  if (id === 'muralla') return `+${P(id, 'fuerza', n)} de fuerza contra Cartago`;
  return '';
}

/* ---------- encargos (lo que proponen los consejeros y se puede empezar a mano) ---------- */
export function encargoDeId(id) {
  if (id === 'legion') return { id, tipo: 'legion' };
  const m = /^obra-(\w+)-(\d)$/.exec(id); if (m && EDIFICIOS[m[1]]) return { id, tipo: 'obra', obj: m[1], n: +m[2] };
  const s = /^saber-(\w+)$/.exec(id); if (s && SABERES[s[1]]) return { id, tipo: 'saber', obj: s[1] };
  return null;
}
const cargoDe = sp => sp.tipo === 'obra' ? EDIFICIOS[sp.obj].cargo : sp.tipo === 'legion' ? 'consul' : SABERES[sp.obj].rama === 'guerra' ? 'consul' : 'pontifice';
export function costeEncargo(e, sp, delegado = false) {
  const x = delegado ? 1 + K.delegaSobre : 1, gr = e.saberes.includes('griego') ? 1 : 0;
  let c;
  if (sp.tipo === 'obra') { const E = EDIFICIOS[sp.obj], n = cl(sp.n, 1, 3); c = { oro: E.oro[n], grano: E.grano[n], dura: plantillaOrden(e, { tipo: 'obra', obj: sp.obj, n }).dura }; }
  else if (sp.tipo === 'legion') c = { oro: K.encargo.legion.oro, grano: K.encargo.legion.grano, dura: e.edif.cuartel >= 2 ? 1 : 2 };
  else c = { oro: K.encargo.saber.oro, grano: 0, dura: Math.max(1, 2 - gr) };
  return { oro: Math.round(c.oro * x), grano: c.grano, dura: c.dura };
}
const obrasEnMarcha = e => e.ordenes.filter(o => o.ley.tipo === 'obra').length;
/* qué falta para poder empezar un encargo ahora (textos en llano; vacío = se puede) */
export function faltaEncargo(e, sp, delegado = false) {
  const f = [];
  if (e.fase === 'fin') return ['La partida ha terminado'];
  const c = costeEncargo(e, sp, delegado);
  if (sp.tipo === 'obra') {
    const E = EDIFICIOS[sp.obj], niv = e.edif[sp.obj];
    if (enCola(e, 'obra', sp.obj)) return ['Ya hay obras en ' + E.nombre.toLowerCase()];
    if (niv >= 3) return ['Ya está al nivel máximo'];
    if (sp.n <= niv) return ['Ya está hecho'];
    if (sp.n > niv + 1) f.push(`Antes, ${E.nombre.toLowerCase()} a nivel ${niv + 1}`);
    if (sp.obj !== 'foro' && sp.n > e.edif.foro) f.push(`Primero el Foro a nivel ${sp.n}`);
    if (sp.obj === 'foro' && sp.n === 3 && e.edad < 2) f.push('El Foro 3 pide la Edad II «Roma sale al mar»');
    if (sp.n === 3 && E.saber3 && !e.saberes.includes(E.saber3)) f.push(`El nivel 3 pide el saber «${SABERES[E.saber3].nombre}»`);
    if (obrasEnMarcha(e) >= e.edif.foro + K.obrasForo) f.push(`El Foro solo dirige ${e.edif.foro + K.obrasForo} obras a la vez`);
  } else if (sp.tipo === 'legion') {
    if (!cabeLegion(e)) f.push(`No caben más legiones: sube el Campo de Marte (caben ${topeLegiones(e)})`);
  } else {
    const s = SABERES[sp.obj];
    if (e.saberes.includes(sp.obj)) return ['Ya lo sabes'];
    if (enCola(e, 'estudiar', sp.obj)) return ['Ya se está aprendiendo'];
    if (s.edad > e.edad) f.push('Pide la Edad II «Roma sale al mar»');
    s.req.forEach(r => { if (!e.saberes.includes(r)) f.push(`Antes, «${SABERES[r].nombre}»`); });
    if (s.edif && !e.edif[s.edif]) f.push(`Pide ${EDIFICIOS[s.edif].nombre.toLowerCase()} (nivel 1)`);
  }
  if (e.oro < c.oro) f.push(`Cuesta ${c.oro} de oro (tienes ${e.oro})`);
  if (c.grano && e.grano < c.grano) f.push(`Cuesta ${c.grano} de grano (tienes ${e.grano})`);
  return f;
}
function decorar(e, sp) {
  const c = costeEncargo(e, sp), cargo = sp.cargo || cargoDe(sp), fl = fuerzaLegion(e);
  let titulo, da;
  if (sp.tipo === 'obra') { titulo = `${EDIFICIOS[sp.obj].nombre} a nivel ${sp.n}`; da = produceTexto(sp.obj, sp.n); }
  else if (sp.tipo === 'legion') { titulo = legPorLeva(e) > 1 ? 'Dos legiones más' : 'Una legión más'; da = `+${legPorLeva(e) * fl} de fuerza; cada legión come ${K.legion.grano} de grano y cobra ${K.legion.oro} de oro por estación`; }
  else { const s = SABERES[sp.obj]; titulo = 'Aprender: ' + s.nombre; da = s.efecto.charAt(0).toUpperCase() + s.efecto.slice(1); }
  const falta = faltaEncargo(e, sp);
  return Object.assign({}, sp, { cargo, bando: CARGOS[cargo].bando, titulo, da, cuesta: c, cuestaTexto: `${c.oro} de oro${c.grano ? ` y ${c.grano} de grano` : ''}; ${c.dura === 1 ? '1 estación' : c.dura + ' estaciones'}`, falta, puede: !falta.length });
}
function proponer(e) {
  const baraja = a => { for (let i = a.length - 1; i > 0; i--) { const j = ri(e, i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const obra = id => e.edif[id] < 3 && !(id === 'foro' && e.edif.foro === 2 && e.edad < 2) ? { id: `obra-${id}-${e.edif[id] + 1}`, tipo: 'obra', obj: id, n: e.edif[id] + 1 } : null;
  const out = [];
  // Edil: el Foro primero si limita a otros; después tres de la ciudad
  let ed = ['foro', 'granja', 'mercado', 'muelle'].map(obra).filter(Boolean);
  if (ed.length > 3) { const sinForo = baraja(ed.filter(x => x.obj !== 'foro')); ed = ed.filter(x => x.obj === 'foro').concat(sinForo).slice(0, 3); }
  out.push(...ed);
  // Cónsul: una legión, y dos entre Campo de Marte, muralla y un saber de guerra
  const co = [{ id: 'legion', tipo: 'legion' }], resto = baraja([obra('cuartel'), obra('muralla'), ...ORDEN_SAB.filter(s => SABERES[s].rama === 'guerra' && !e.saberes.includes(s) && SABERES[s].edad <= e.edad && SABERES[s].req.every(r => e.saberes.includes(r))).map(s => ({ id: 'saber-' + s, tipo: 'saber', obj: s }))].filter(Boolean));
  out.push(...co.concat(resto).slice(0, 3));
  // Pontífice: el templo y saberes de mar y ciudad; si faltan, cualquier saber que quede
  const libres = ORDEN_SAB.filter(s => !e.saberes.includes(s) && !out.some(x => x.obj === s) && SABERES[s].edad <= e.edad && SABERES[s].req.every(r => e.saberes.includes(r)));
  const sab = baraja(libres.filter(s => SABERES[s].rama !== 'guerra')).concat(libres.filter(s => SABERES[s].rama === 'guerra')).map(s => ({ id: 'saber-' + s, tipo: 'saber', obj: s, cargo: 'pontifice' }));
  out.push(...[obra('templo')].filter(Boolean).concat(sab).slice(0, 3));
  return out.map(sp => ({ id: sp.id, tipo: sp.tipo, obj: sp.obj, n: sp.n, cargo: sp.cargo || cargoDe(sp) }));
}
export function encargosPropuestos(e) { return (e.propuestos || []).map(sp => Object.assign(decorar(e, sp), { elegido: e.plan.some(p => p.id === sp.id) })); }
function hechoEncargo(e, it) { return it.tipo === 'obra' ? e.edif[it.obj] >= it.n : it.tipo === 'saber' ? e.saberes.includes(it.obj) : e.legiones >= it.meta; }
function enCursoEncargo(e, it) { return it.tipo === 'obra' ? enCola(e, 'obra', it.obj) : it.tipo === 'saber' ? enCola(e, 'estudiar', it.obj) : e.ordenes.some(o => o.ley.tipo === 'reclutar'); }
export function planDelAnio(e) { return e.plan.map(p => Object.assign(p, { hecho: p.hecho || hechoEncargo(e, p), enCurso: !p.hecho && enCursoEncargo(e, p) })); }
export function elegirPlan(e, ids = []) {
  if (e.fase !== 'consejo') return { ok: false, porque: 'El consejo del año se reúne en primavera', plan: e.plan };
  const uni = [...new Set(ids)];
  if (uni.length > 3) return { ok: false, porque: 'Como mucho 3 encargos por año', plan: e.plan };
  const props = encargosPropuestos(e);
  if (uni.some(id => !props.some(p => p.id === id))) return { ok: false, porque: 'Ese encargo no está en la mesa', plan: e.plan };
  e.plan = uni.map(id => { const p = props.find(x => x.id === id); return { id, tipo: p.tipo, obj: p.obj, n: p.n, cargo: p.cargo, bando: p.bando, titulo: p.titulo, da: p.da, anio: Math.floor(e.turno / 4), hecho: false, meta: p.tipo === 'legion' ? e.legiones + legionesEnCola(e) + legPorLeva(e) : undefined }; });
  e.fase = 'senado';
  return { ok: true, plan: e.plan };
}
const abrirSenado = e => { if (e.fase === 'consejo') { e.fase = 'senado'; } };
export function delegar(e, cargo, si) { if (CARGOS[cargo]) e.delegados[cargo] = !!si; return e.delegados; }

/* empezar un encargo: paga ya y entra en la cola de órdenes */
function empezar(e, sp, delegado, quien) {
  const f = faltaEncargo(e, sp, delegado);
  if (f.length) return { ok: false, porque: f[0] };
  const c = costeEncargo(e, sp, delegado), cargo = sp.cargo || cargoDe(sp);
  const ley = sp.tipo === 'obra' ? { tipo: 'obra', obj: sp.obj, n: sp.n } : sp.tipo === 'legion' ? { tipo: 'reclutar', encargo: true } : { tipo: 'estudiar', obj: sp.obj };
  e.oro -= c.oro; e.grano -= c.grano;
  const m = (quien || 'Tú') + ': ' + leyTexto(ley, e).titulo;
  e.cambios.push({ que: 'oro', n: -c.oro, motivo: m }); if (c.grano) e.cambios.push({ que: 'grano', n: -c.grano, motivo: m });
  e.ordenes.push({ id: e.sigId++, ley, dura: c.dura, hecho: 0, oro: 0, grano: 0, desde: e.turno, retraso: '', cargo, mano: !delegado });
  return { ok: true, coste: c };
}
export function mejorar(e, id) {
  if (!EDIFICIOS[id]) return { ok: false, porque: 'No existe ese edificio' };
  return empezar(e, { tipo: 'obra', obj: id, n: e.edif[id] + 1 }, false);
}
export function empezarEncargo(e, id) { const sp = encargoDeId(id); return sp ? empezar(e, sp, false) : { ok: false, porque: 'No existe ese encargo' }; }

export function fichaEdificio(e, id) {
  const E = EDIFICIOS[id]; if (!E) return null;
  const n = e.edif[id], sp = { tipo: 'obra', obj: id, n: n + 1 }, o = e.ordenes.find(x => x.ley.tipo === 'obra' && x.ley.obj === id);
  const c = n < 3 ? costeEncargo(e, sp) : { oro: 0, grano: 0, dura: 0 }, falta = faltaEncargo(e, sp);
  return {
    id, nombre: E.nombre, nivel: n, max: E.max, produce: produceTexto(id, n), produceSiguiente: n < 3 ? produceTexto(id, n + 1) : null,
    cargo: E.cargo, cargoNombre: CARGOS[E.cargo].nombre, delegado: !!e.delegados[E.cargo], enPlan: e.plan.some(p => p.tipo === 'obra' && p.obj === id && !p.hecho),
    coste: { oro: c.oro, grano: c.grano }, dura: c.dura, falta, puede: !falta.length,
    enObra: o ? { faltan: o.dura - o.hecho, mano: !!o.mano, nivel: o.ley.n } : null, bando: E.bando, fuente: E.fuente, dictamen: E.dictamen,
  };
}

/* ---------- textos de las leyes: qué cambia en la ciudad y dónde ---------- */
export function leyTexto(ley, e) {
  const T = TIPOS[ley.tipo] || TIPOS.obra, fl = e ? fuerzaLegion(e) : K.legion.fuerza;
  if (ley.tipo === 'obra') { const x = EDIFICIOS[ley.obj]; return { titulo: `${x.nombre} a nivel ${ley.n}`, efecto: produceTexto(ley.obj, ley.n) + '.', ciudad: `${x.nombre} sube a nivel ${ley.n}: ${produceTexto(ley.obj, ley.n).toLowerCase()}.`, sitio: ley.obj, imagen: 'templo', fuente: x.fuente, dictamen: x.dictamen }; }
  if (ley.tipo === 'estudiar') { const s = SABERES[ley.obj], sitio = SITIO_RAMA[s.rama]; return { titulo: 'Estudiar: ' + s.nombre, efecto: 'Rama de ' + RAMAS[s.rama].toLowerCase() + ': ' + s.efecto + '.', ciudad: `${sitio === 'cuartel' ? 'En el Campo de Marte se ensaya' : sitio === 'muelle' ? 'En el muelle se trabaja' : 'En el Foro se enseña'} «${s.nombre}»: ${s.efecto}.`, sitio, imagen: s.rama === 'mar' ? 'barco' : s.rama === 'guerra' ? 'legionario' : 'templo', fuente: s.fuente, dictamen: s.dictamen }; }
  if (ley.tipo === 'edad') { const E = EDADES[ley.obj]; return { titulo: 'Pasar a la edad «' + E.nombre + '»', efecto: ley.obj === 2 ? 'Abre el pilum y el corvus; cada leva da 2 legiones.' : 'Roma, lista para la guerra grande. Sube la nota.', ciudad: ley.obj === 2 ? 'El Foro se engalana y el muelle bota la primera flota: llega una legión de marineros, cada leva da dos legiones y el Foro podrá subir a nivel 3.' : 'Roma entra en la edad de Aníbal: el Foro se llena de trofeos.', sitio: ley.obj === 2 ? 'muelle' : 'foro', imagen: 'barco', fuente: E.fuente, dictamen: E.dictamen }; }
  const nLeg = e ? legPorLeva(e) : 1;
  const ef = {
    reclutar: (!e ? 'Una legión más (dos desde la Edad II).' : nLeg === 2 ? 'Dos legiones más (Edad II).' : 'Una legión más (dos desde la Edad II).') + ' Cuesta oro y grano.',
    socios: `Una legión de los aliados (+${fl} de fuerza). Cuesta 20 de grano.`,
    leva: 'Una legión ya, sin votar. Cuesta ' + (e ? costeLeva(e) : K.leva.oro) + ' de oro y ' + K.leva.favor + ' de favor.',
    impuestos: 'Entran 70 de oro. La plebe pierde 12 de contento.',
    granoBarato: 'La plebe gana 15 de contento. Cuesta 26 de grano.',
  }[ley.tipo];
  const ciudad = {
    reclutar: `Llega${nLeg > 1 ? 'n dos legiones' : ' una legión'} al Campo de Marte: +${nLeg * fl} de fuerza; cuesta${nLeg > 1 ? 'n' : ''} ${nLeg * K.legion.oro} de oro y ${nLeg * K.legion.grano} de grano cada estación.`,
    socios: `Los soldados aliados acampan junto a la muralla: +${fl} de fuerza; se llevan 20 de grano y luego comen ${K.legion.grano} cada estación.`,
    leva: `Una legión pagada entra en el Campo de Marte: +${fl} de fuerza.`,
    impuestos: 'Los cuestores cobran en el mercado: entran 70 de oro, pero la plebe pierde 12 de contento.',
    granoBarato: 'Se abren los graneros a la plebe: gana 15 de contento; salen 26 de grano.',
  }[ley.tipo];
  const sitio = { reclutar: 'cuartel', socios: 'muralla', leva: 'cuartel', impuestos: 'mercado', granoBarato: 'granja' }[ley.tipo];
  return { titulo: T.nombre, efecto: ef, ciudad, sitio, imagen: T.imagen, fuente: T.fuente, dictamen: T.dictamen };
}

/* ¿da tiempo a cumplirla? Lo aprobado en la estación t avanza al cerrar t; debe acabar al cerrar la última (K.turnos − 1) */
export function llega(e, ley) { return plantillaOrden(e, ley).dura <= K.turnos - e.turno; }
function sacarCartas(e) {
  const cartas = [], tiene = c => cartas.some(x => x.tipo === c.tipo && x.obj === c.obj);
  const sab = saberesPosibles(e), hueco = cabeLegion(e);
  // A · progreso: pasar de edad si se puede; si no, un saber
  if (EDADES[e.edad + 1] && requisitosEdad(e, e.edad + 1).ok && !enCola(e, 'edad')) cartas.push({ tipo: 'edad', obj: e.edad + 1 });
  else if (sab.length) cartas.push({ tipo: 'estudiar', obj: sab[ri(e, sab.length)] });
  else cartas.push({ tipo: 'impuestos' });
  // B · guerra
  { let op = hueco ? [{ tipo: 'reclutar' }, { tipo: 'reclutar' }, { tipo: 'socios' }] : [];
    sab.filter(s => SABERES[s].rama !== 'ciudad').forEach(s => op.push({ tipo: 'estudiar', obj: s }));
    op = op.filter(c => !tiene(c)); cartas.push(op.length ? op[ri(e, op.length)] : (tiene({ tipo: 'impuestos' }) ? { tipo: 'granoBarato' } : { tipo: 'impuestos' })); }
  // C · pueblo y arca
  { let op = [];
    if (e.plebe < 40) op.push({ tipo: 'granoBarato' }, { tipo: 'granoBarato' });
    if (e.oro < 60) op.push({ tipo: 'impuestos' }, { tipo: 'impuestos' });
    op.push({ tipo: 'impuestos' }, { tipo: 'granoBarato' });
    sab.filter(s => SABERES[s].rama === 'ciudad').forEach(s => op.push({ tipo: 'estudiar', obj: s }));
    op = op.filter(c => !tiene(c));
    cartas.push(op.length ? op[ri(e, op.length)] : [{ tipo: 'impuestos' }, { tipo: 'granoBarato' }, { tipo: 'socios' }].find(c => !tiene(c))); }
  cartas.forEach((c, i) => {
    if (llega(e, c)) return;
    const alt = [{ tipo: 'impuestos' }, { tipo: 'granoBarato' }, { tipo: 'socios' }, { tipo: 'reclutar' }].find(a => llega(e, a) && !cartas.some(x => x.tipo === a.tipo) && (a.tipo !== 'reclutar' && a.tipo !== 'socios' || hueco));
    if (alt) cartas[i] = alt; else c.noLlega = true;
  });
  for (let i = cartas.length - 1; i > 0; i--) { const j = ri(e, i + 1); [cartas[i], cartas[j]] = [cartas[j], cartas[i]]; }
  return cartas;
}

/* ---------- suceso, juicio y comienzo de estación ---------- */
function aplicar(e, ef, motivo) {
  for (const k in ef) {
    const v = ef[k]; if (!v) continue;
    if (k === 'legiones') e.legiones = Math.max(0, e.legiones + v);
    else if (k === 'plebe' || k === 'favor') e[k] = cl(e[k] + v, 0, 100);
    else e[k] += v;
    e.cambios.push({ que: k, n: v, motivo });
  }
}
const nb = b => BANDOS[b].nombre.toLowerCase();
function juzgarEstacion(e) {
  const J = K.juicio, m = e.marcas, L = [], add = (n, texto) => L.push({ marca: n > 0 ? '▲' : n < 0 ? '▼' : '·', n, texto });
  if (e.plebe < K.revuelta.umbral) add(J.borde, `La plebe está al borde de la revuelta (${e.plebe}).`);
  else if (e.plebe < J.plebeBaja) add(J.murmura, `La plebe murmura en las calles (${e.plebe}).`);
  else if (e.plebe >= J.plebeAlta) add(J.contenta, `La plebe está contenta (${e.plebe}).`);
  if (e.grano < 0) add(J.sinGrano, 'Faltó grano: hay colas en los graneros.');
  else if (e.grano < 20) add(J.poco, 'Los graneros están casi vacíos.');
  if (m.planHecho) add(J.plan * m.planHecho, m.planHecho === 1 ? 'Cumpliste un encargo del plan del año.' : `Cumpliste ${m.planHecho} encargos del plan del año.`);
  if (m.abandonados) add(J.abandono * m.abandonados, m.abandonados === 1 ? 'Un encargo del plan del año quedó sin hacer.' : `${m.abandonados} encargos del plan del año quedaron sin hacer.`);
  if (e.turno % 4 !== 0) {
    if (!e.plan.length) add(J.sinPlan, 'Roma no tiene plan este año.');
    else if (!m.planHecho && e.plan.some(p => !p.hecho && enCursoEncargo(e, p))) add(J.enMarcha, 'El plan del año está en marcha.');
  }
  if (m.promCumplidas) add(J.promesa * m.promCumplidas, 'Cumpliste tu palabra a un bando.');
  m.promRotas.forEach(b => add(-K.promesaRota.favor, `Rompiste tu promesa a los ${nb(b)}.`));
  if (m.banquete) add(J.banquete, `Los otros bandos murmuran por tu banquete con los ${nb(m.banquete)}.`);
  if (fuerza(e) < e.amenaza) add(J.cartago, `Cartago enseña los dientes (${e.amenaza}) y Roma no está lista (${fuerza(e)}).`);
  if (!L.length) add(0, 'El Senado no tiene quejas ni alabanzas esta vez.');
  const total = L.reduce((s, x) => s + x.n, 0);
  if (total) aplicar(e, { favor: total }, 'Juicio del Senado');
  return { lineas: L, total, imagen: 'senado' };
}
export const juicio = e => e.juicio || { lineas: [], total: 0, imagen: 'senado' };
function empezarEstacion(e) {
  e.cambios = []; e.aprobadas = []; e.sel = -1; e.tratos = {}; e.recuento = null; e.cambiosCiudad = []; e.delegaron = [];
  // suceso: el que se rumoreaba (proxSuceso) o uno al azar; mazo sin repetición
  const quedan = SUCESOS.filter(x => !e.salidos.includes(x.id));
  const su = quedan.find(x => x.id === e.proxSuceso) || quedan[ri(e, quedan.length)], ef = Object.assign({}, su.ef);
  if (su.mar && e.saberes.includes('quinque')) ef.amenaza = Math.round(ef.amenaza / 2);
  e.salidos.push(su.id);
  e.suceso = { id: su.id, titulo: su.titulo, texto: su.texto, ef, fuente: su.fuente, dictamen: su.dictamen };
  aplicar(e, ef, su.titulo);
  const resto = SUCESOS.filter(x => !e.salidos.includes(x.id)); e.proxSuceso = resto.length ? resto[ri(e, resto.length)].id : null;
  // año nuevo: se cierra el plan viejo y se reúne el consejo
  if (e.turno % 4 === 0) { if (e.turno > 0) e.marcas.abandonados = planDelAnio(e).filter(p => !p.hecho).length; e.plan = []; e.propuestos = proponer(e); e.fase = 'consejo'; }
  else e.fase = 'senado';
  e.juicio = e.turno > 0 ? juzgarEstacion(e) : { lineas: [{ marca: '·', n: 0, texto: 'El Senado te recibe. Te juzgará cada estación: plebe, grano, plan del año y palabra dada.' }], total: 0, imagen: 'senado' };
  e.marcas = marcasVacias();
  if (e.banquete && e.banquete.turno < e.turno - 1) e.banquete = null;
  e.cartas = sacarCartas(e);
}

/* ---------- elegir ley y tratos (como en EV7) ---------- */
export function elegir(e, i) { abrirSenado(e); if (e.fase === 'senado' && i >= -1 && i < e.cartas.length) e.sel = i; return e.sel; }
export function costeTrato(e, b) { return K.tratoOro + K.tratoPorEscano * e.escanos[b]; }
export function plazoPromesa(e) {
  const vence = Math.min(e.turno + K.promesaPlazo, K.turnos - 1);
  return { vence, estacion: vence + 1, nombre: nombreEstacion(vence), puede: vence > e.turno, favor: K.promesaRota.favor, humor: K.promesaRota.humor };
}
function yaTeVotan(e, b, i = e.sel) {
  const ley = e.cartas[i]; if (!ley) return false;
  const sin = Object.assign({}, e.tratos); delete sin[b];
  return e.senadores.every(s => s.bando !== b || clase(probSi(e, ley, s, sin)) === 'seguro');
}
export function trato(e, b, tipo) {
  abrirSenado(e);
  if (e.fase !== 'senado' || !BS.includes(b)) return false;
  if (!tipo) { delete e.tratos[b]; return true; }
  if (yaTeVotan(e, b)) return false;
  if (tipo === 'promesa' && !plazoPromesa(e).puede) return false;
  if (tipo === 'oro' && e.oro < costeTrato(e, b) + BS.filter(x => x !== b && e.tratos[x] === 'oro').reduce((s, x) => s + costeTrato(e, x), 0)) return false;
  if (tipo === 'promesa' && e.promesas.some(p => p.bando === b)) return false;
  e.tratos[b] = tipo; return true;
}
const banqueteVivo = e => e.banquete && !e.banquete.usado && e.banquete.turno >= e.turno - 1 ? e.banquete.bando : null;
function probSi(e, ley, s, tratos) {
  const g = gustoLey(ley)[s.bando];
  let p = K.base + g + s.sesgo + (e.humor[s.bando] - 50) / 160 + (e.favor - 50) / 220;
  if (tratos[s.bando]) p += K.tratoEmpuje;
  if (banqueteVivo(e) === s.bando) p += K.actos.banquete.empuje;
  return cl(p, 0.02, 0.98);
}
const clase = p => p >= 0.75 ? 'seguro' : p <= 0.3 ? 'contra' : 'dudoso';
export function prevision(e, i = e.sel, tratos = e.tratos) {
  const ley = e.cartas[i]; if (!ley) return null;
  const r = { seguros: 0, dudosos: 0, contra: 0, esperado: 0, por: [], bandos: {} };
  BS.forEach(b => r.bandos[b] = { seguros: 0, dudosos: 0, contra: 0, yaTeVotan: yaTeVotan(e, b, i) });
  for (const s of e.senadores) { const p = probSi(e, ley, s, tratos), c = clase(p), k = c === 'seguro' ? 'seguros' : c === 'dudoso' ? 'dudosos' : 'contra'; r[k]++; r.bandos[s.bando][k]++; r.esperado += p; r.por.push({ i: s.i, bando: s.bando, p, clase: c }); }
  r.veto = e.plebe < TRIBUNO.umbral && perjudicaPlebe(ley);
  return r;
}

/* ---------- votar ---------- */
export function votar(e) {
  abrirSenado(e);
  if (e.fase !== 'senado' || e.sel < 0) return null;
  const ley = e.cartas[e.sel], pv = prevision(e), votos = [];
  for (const b of BS) if (e.tratos[b] && pv.bandos[b].yaTeVotan) delete e.tratos[b];
  for (const b of BS) {
    if (e.tratos[b] === 'oro') { const c = costeTrato(e, b); e.oro -= c; e.cambios.push({ que: 'oro', n: -c, motivo: 'Trato con los ' + nb(b) }); }
    if (e.tratos[b] === 'promesa') e.promesas.push({ bando: b, vence: plazoPromesa(e).vence, desde: e.turno });
  }
  if (e.banquete) e.banquete.usado = true;
  let si = 0;
  for (const x of pv.por) { const v = x.clase === 'seguro' ? true : x.clase === 'contra' ? false : rnd(e) < x.p; if (v) si++; votos.push({ i: x.i, bando: x.bando, clase: x.clase, si: v }); }
  const mayoria = si >= K.mayoria, veto = mayoria && pv.veto, aprobada = mayoria && !veto;
  e.recuento = { ley, votos, si, no: K.escanos - si, aprobada, veto, texto: leyTexto(ley, e) };
  if (aprobada) {
    const pl = plantillaOrden(e, ley);
    e.ordenes.push({ id: e.sigId++, ley, dura: pl.dura, hecho: 0, oro: pl.oro, grano: pl.grano, desde: e.turno, retraso: '' });
    e.aprobadas.push(ley);
    aplicar(e, { favor: K.favorAprobada }, 'Ley aprobada');
    BS.forEach(b => { if (gusta(ley, b)) e.humor[b] = cl(e.humor[b] + 5, 0, 100); if (disgusta(ley, b)) e.humor[b] = cl(e.humor[b] - 4, 0, 100); });
    e.promesas = e.promesas.filter(p => { if (gusta(ley, p.bando) && p.desde < e.turno) { e.humor[p.bando] = cl(e.humor[p.bando] + 5, 0, 100); e.marcas.promCumplidas++; e.cambios.push({ que: 'promesa', n: 1, motivo: 'Cumples tu promesa a los ' + nb(p.bando) }); return false; } return true; });
  } else aplicar(e, { favor: -K.favorCae }, veto ? 'El tribuno veta la ley' : 'La ley cae en el Senado');
  e.fase = 'mando';
  return e.recuento;
}
export const costeLeva = e => K.leva.oro + K.leva.sube * (e.levas || 0);
export function puedeLeva(e) {
  if (!['consejo', 'senado', 'mando'].includes(e.fase)) return { ok: false, porque: 'La partida ha terminado' };
  if (e.levaTurno === e.turno) return { ok: false, porque: 'Ya pagaste una leva esta estación' };
  if (!cabeLegion(e)) return { ok: false, porque: `No caben más legiones: sube el Campo de Marte (caben ${topeLegiones(e)})` };
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
export function dejarPasar(e) { abrirSenado(e); if (e.fase !== 'senado') return; e.recuento = null; aplicar(e, { favor: -K.favorPasa }, 'Dejas pasar la votación'); e.fase = 'mando'; }

/* ---------- actos de la estación ---------- */
const APRENDE = {
  banquete: [
    { texto: 'Los romanos cenaban recostados: tres lechos en forma de U alrededor de una mesa baja, el triclinio, con tres comensales en cada uno.', fuente: 'Horacio, Sátiras 2.8 (la cena de Nasidieno, con sus lechos alto, medio y bajo)', dictamen: 'probable (fuente de dos siglos después)', imagen: 'banquete' },
    { texto: 'Roma acuñó plata por primera vez en 269 a.C., cinco años antes de esta partida. El denario llegaría hacia el 211 a.C.', fuente: 'Plinio, Historia natural 33.44', dictamen: 'probable', imagen: 'moneda' },
    { texto: 'El lujo de los banquetes preocupaba al Senado: la ley Orquia (182 a.C.) limitó cuántos invitados podía tener una cena.', fuente: 'Macrobio, Saturnales 3.17.2', dictamen: 'histórico', imagen: 'senado' },
  ],
  juegos: [
    { texto: 'En 264 a.C., para honrar a su padre muerto, Marco y Décimo Junio Bruto hicieron luchar a tres parejas de gladiadores en el Foro Boario: los primeros de Roma.', fuente: 'Valerio Máximo 2.4.7; Livio, Periocha 16', dictamen: 'histórico', imagen: 'gladiadores' },
    { texto: 'Las carreras de carros se corrían en el Circo Máximo, en el valle entre el Palatino y el Aventino; la tradición lo atribuye al rey Tarquinio Prisco.', fuente: 'Livio 1.35', dictamen: 'probable', imagen: 'circo' },
    { texto: 'Aún no hay Coliseo: se inaugurará en el 80 d.C., más de tres siglos después. Ahora se lucha en el Foro, con gradas de madera que se montan y desmontan.', fuente: 'Suetonio, Tito 7.3; Vitruvio 5.1.1 (los combates en el foro)', dictamen: 'histórico', imagen: 'gladiadores' },
  ],
  rito: [
    { texto: 'Antes de decidir algo grande se tomaban los auspicios: un augur miraba el vuelo de las aves para saber si los dioses estaban de acuerdo.', fuente: 'Livio 1.18 (la toma de auspicios de Numa)', dictamen: 'histórico', imagen: 'templo' },
    { texto: 'Para purificar los campos se sacrificaban juntos un cerdo, una oveja y un toro: la suovetaurilia.', fuente: 'Catón, De agri cultura 141', dictamen: 'histórico', imagen: 'sacrificio' },
    { texto: 'En 296 a.C. los ediles Ogulnios pusieron junto a la higuera Ruminal la estatua de los gemelos mamando de la loba.', fuente: 'Livio 10.23.12', dictamen: 'histórico', imagen: 'loba' },
  ],
};
export function actos(e) {
  const A = K.actos, vivo = ['consejo', 'senado', 'mando'].includes(e.fase), hecho = e.actoTurno === e.turno;
  const es = (oro) => { const porque = !vivo ? 'La partida ha terminado' : hecho ? 'Ya hiciste un acto esta estación' : e.oro < oro ? `Cuesta ${oro} de oro (tienes ${e.oro})` : ''; return { puede: !porque, porque }; };
  return [
    Object.assign({ tipo: 'banquete', titulo: 'Banquete en tu casa', texto: `Invitas a un bando al triclinio: +${A.banquete.humor} de humor y sus dudosos se inclinan a tu favor en la próxima votación; los otros dos se enteran (${A.banquete.otros} de humor). A veces alguien habla de más.`, oro: A.banquete.oro, bandos: BS.slice(), sitio: 'foro', imagen: 'banquete' }, es(A.banquete.oro)),
    Object.assign({ tipo: 'juegos', titulo: 'Juegos en el Foro Boario', texto: `Combates de gladiadores y carreras en el Circo Máximo: +${A.juegos.plebe} de contento de la plebe y +${A.juegos.favor} de favor.`, oro: A.juegos.oro, sitio: 'plebe', imagen: 'gladiadores' }, es(A.juegos.oro)),
    Object.assign({ tipo: 'rito', titulo: 'Rito en el templo', texto: `Sacrificio y auspicios: +${A.rito.favor} de favor y +${A.rito.plebe + e.edif.templo} de plebe (más si el templo es mayor).`, oro: A.rito.oro, sitio: 'templo', imagen: 'sacrificio' }, es(A.rito.oro)),
  ];
}
export function hacerActo(e, tipo, bando) {
  const a = actos(e).find(x => x.tipo === tipo);
  if (!a) return { ok: false, porque: 'No existe ese acto' };
  if (!a.puede) return { ok: false, porque: a.porque };
  if (tipo === 'banquete' && !BS.includes(bando)) return { ok: false, porque: 'Elige a qué bando invitas' };
  const A = K.actos, c0 = e.cambios.length, antesPlebe = e.plebe, antesFavor = e.favor;
  e.actoTurno = e.turno;
  let confidencia = null, cc;
  if (tipo === 'banquete') {
    aplicar(e, { oro: -A.banquete.oro }, 'Banquete con los ' + nb(bando));
    BS.forEach(b => e.humor[b] = cl(e.humor[b] + (b === bando ? A.banquete.humor : A.banquete.otros), 0, 100));
    e.banquete = { bando, turno: e.turno, usado: false }; e.marcas.banquete = bando;
    if (rnd(e) < A.banquete.confidencia) {
      const prox = SUCESOS.find(x => x.id === e.proxSuceso);
      if (prox && rnd(e) < 0.5) confidencia = `Un senador de los ${nb(bando)} te susurra con la copa en la mano: «Se dice que la próxima estación llega esto: ${prox.titulo}».`;
      else { const ss = e.senadores.filter(s => s.bando === bando).sort((x, y) => x.sesgo - y.sesgo)[0]; if (ss) { ss.sesgo = +Math.min(0.25, ss.sesgo + 0.3).toFixed(3); confidencia = `El senador ${ss.i + 1}, de los ${nb(bando)}, brinda contigo: desde hoy se inclina a tu lado.`; } }
    }
    cc = { sitio: 'foro', antes: `Humor de los ${nb(bando)} ${e.humor[bando] - A.banquete.humor}`, despues: `Humor de los ${nb(bando)} ${e.humor[bando]}`, porque: 'Banquete' };
  } else if (tipo === 'juegos') {
    aplicar(e, { oro: -A.juegos.oro, plebe: A.juegos.plebe, favor: A.juegos.favor }, 'Juegos en el Foro Boario');
    cc = { sitio: 'plebe', antes: `Plebe ${antesPlebe}`, despues: `Plebe ${e.plebe}`, porque: 'Juegos' };
  } else {
    aplicar(e, { oro: -A.rito.oro, favor: A.rito.favor, plebe: A.rito.plebe + e.edif.templo }, 'Rito en el templo');
    e.humor.ter = cl(e.humor.ter + 2, 0, 100);
    cc = { sitio: 'templo', antes: `Favor ${antesFavor}`, despues: `Favor ${e.favor}`, porque: 'Rito' };
  }
  e.cambiosCiudad.push(cc);
  const pool = APRENDE[tipo], k = e.vistos[tipo] || 0; e.vistos[tipo] = k + 1;
  const aprende = pool[k % pool.length];
  return { ok: true, tipo, titulo: a.titulo, efectos: e.cambios.slice(c0).map(x => ({ que: x.que, n: x.n })), confidencia, aprende, imagen: aprende.imagen, cambiosCiudad: [cc] };
}

/* ---------- fin de estación ---------- */
function legionesNuevas(e, n, m) { for (let k = 0; k < n; k++) e.nuevos.push({ tipo: 'legion', id: 'legion-' + (e.legiones + k + 1), n: e.legiones + k + 1 }); aplicar(e, { legiones: n }, m); }
function cumplir(e, o) {
  const l = o.ley, tx = leyTexto(l, e), m = (l.tipo === 'obra' ? 'Obra terminada: ' : 'Orden cumplida: ') + tx.titulo;
  const leg0 = e.legiones, cc = (antes, despues) => e.cambiosCiudad.push({ sitio: tx.sitio, antes, despues, porque: m });
  switch (l.tipo) {
    case 'reclutar': legionesNuevas(e, legPorLeva(e), m); aplicar(e, { plebe: -3 }, m); cc(`${leg0} legiones`, `${e.legiones} legiones`); break;
    case 'leva': case 'socios': legionesNuevas(e, 1, m); cc(`${leg0} legiones`, `${e.legiones} legiones`); break;
    case 'obra': e.edif[l.obj] = Math.max(e.edif[l.obj], l.n); e.pob += 4; e.cambios.push({ que: 'edif', obj: l.obj, n: 1, motivo: m }); e.nuevos.push({ tipo: 'edificio', id: l.obj, n: e.edif[l.obj] }); cc(`${EDIFICIOS[l.obj].nombre} ${l.n - 1}`, `${EDIFICIOS[l.obj].nombre} ${l.n}`); break;
    case 'estudiar': e.saberes.push(l.obj); e.cambios.push({ que: 'saber', obj: l.obj, n: 1, motivo: m }); e.nuevos.push({ tipo: 'saber', id: l.obj, n: e.saberes.length }); cc('Sin «' + SABERES[l.obj].nombre + '»', '«' + SABERES[l.obj].nombre + '»: ' + SABERES[l.obj].efecto); break;
    case 'edad': e.edad = l.obj; e.cambios.push({ que: 'edad', obj: l.obj, n: 1, motivo: m }); e.nuevos.push({ tipo: 'edad', id: 'edad-' + l.obj, n: l.obj }); cc('Edad ' + 'I'.repeat(l.obj - 1), 'Edad ' + 'I'.repeat(l.obj) + ' «' + EDADES[l.obj].nombre + '»');
      if (l.obj === 2 && K.edad2Legion) legionesNuevas(e, K.edad2Legion, 'La flota nueva trae una legión de marineros'); break;
    case 'impuestos': { const a = e.oro; aplicar(e, { oro: 70, plebe: -12 }, m); cc(`Oro ${a}`, `Oro ${e.oro}`); break; }
    case 'granoBarato': { const a = e.plebe; aplicar(e, { plebe: 15 }, m); cc(`Plebe ${a}`, `Plebe ${e.plebe}`); break; }
  }
}
function revisarPlan(e) {
  for (const p of e.plan) if (!p.hecho && hechoEncargo(e, p)) { p.hecho = true; e.marcas.planHecho++; e.humor[p.bando] = cl(e.humor[p.bando] + 4, 0, 100); e.cambios.push({ que: 'plan', n: 1, motivo: 'Plan del año: ' + p.titulo }); }
}
/* los consejeros delegados empiezan UNA cosa de su parte del plan; después, su sesgo */
function actuanConsejeros(e) {
  for (const c of ORDEN_CARGOS) {
    if (!e.delegados[c]) continue;
    const C = CARGOS[c], quien = C.nombre;
    e.humor[C.bando] = cl(e.humor[C.bando] + 1, 0, 100);
    let hizo = false;
    // el Edil cuida el grano (cura annonae, Cicerón, Leyes 3.7) aunque no esté en el plan
    if (c === 'edil' && e.grano < 50 && P('granja', 'grano', e.edif.granja) + P('muelle', 'grano', e.edif.muelle) < Math.round(e.pob * K.porMil) + e.legiones * K.legion.grano) {
      const sp = { tipo: 'obra', obj: 'granja', n: e.edif.granja + 1 };
      if (e.oro - costeEncargo(e, sp, true).oro >= K.reserva) { const r = empezar(e, sp, true, quien); if (r.ok) { e.delegaron.push(`${quien}: el grano no llega y sube las granjas (${r.coste.oro} de oro).`); hizo = true; } }
    }
    if (!hizo) for (const p of e.plan.filter(x => x.cargo === c && !x.hecho)) {
      if (hechoEncargo(e, p) || enCursoEncargo(e, p)) continue;
      let sp = p.tipo === 'obra' ? { tipo: 'obra', obj: p.obj, n: e.edif[p.obj] + 1 } : p;
      if (sp.tipo === 'obra' && c === 'edil' && sp.obj !== 'foro' && sp.n > e.edif.foro && !enCola(e, 'obra', 'foro')) sp = { tipo: 'obra', obj: 'foro', n: e.edif.foro + 1 };
      if (e.oro - costeEncargo(e, sp, true).oro < K.reserva) continue;
      const r = empezar(e, sp, true, quien);
      if (r.ok) { e.delegaron.push(`${quien}: empieza «${decorar(e, sp).titulo}» (${r.coste.oro} de oro).`); hizo = true; break; }
    }
    if (!hizo && c === 'consul' && e.oro > K.reserva + 90 && !e.ordenes.some(o => o.ley.tipo === 'reclutar')) { const r = empezar(e, { tipo: 'legion' }, true, quien); if (r.ok) e.delegaron.push(`${quien}: le sobra oro y recluta por su cuenta (${r.coste.oro} de oro).`); }
    if (!hizo && c === 'pontifice' && e.oro > K.reserva + 40) { aplicar(e, { oro: -6, plebe: 2 }, 'El Pontífice ofrece un sacrificio'); e.delegaron.push(`${quien}: ofrece un sacrificio pequeño (6 de oro, +2 de plebe).`); }
  }
}
export function terminar(e) {
  abrirSenado(e);
  if (e.fase === 'senado') dejarPasar(e);
  if (e.fase !== 'mando') return null;
  e.nuevos = [];
  // 1 · órdenes: las leyes pagan su parte de cada estación (sin recursos se retrasan); las obras ya están pagadas
  for (const o of e.ordenes) {
    if (o.oro > e.oro || o.grano > Math.max(0, e.grano)) { o.retraso = o.oro > e.oro ? 'falta oro' : 'falta grano'; e.cambios.push({ que: 'retraso', n: -1, motivo: leyTexto(o.ley, e).titulo + ': ' + o.retraso }); continue; }
    e.oro -= o.oro; e.grano -= o.grano; o.retraso = ''; o.hecho++;
    if (o.hecho >= o.dura) { o.lista = true; cumplir(e, o); }
  }
  e.ordenes = e.ordenes.filter(o => !o.lista);
  revisarPlan(e);
  // 2 · economía
  const d = e.edif;
  aplicar(e, { oro: K.ingresoBase + P('mercado', 'oro', d.mercado) + P('muelle', 'oro', d.muelle) - e.legiones * K.legion.oro }, 'Tributos y soldadas');
  aplicar(e, { grano: P('granja', 'grano', d.granja) + P('muelle', 'grano', d.muelle) + (e.saberes.includes('apio') ? 6 : 0) - Math.round(e.pob * K.porMil) - e.legiones * K.legion.grano }, 'Cosecha y raciones');
  let dp = -K.plebeBaja + P('templo', 'plebe', d.templo); if (e.grano < 15) dp -= 5; if (fuerza(e) < e.amenaza) dp -= 2;
  aplicar(e, { plebe: dp }, 'Ánimo de la plebe');
  aplicar(e, { favor: P('foro', 'favor', d.foro) }, 'El Foro');
  if (e.plebe > 50) e.pob += 2;
  // 3 · amenaza
  aplicar(e, { amenaza: amenazaSube(e) }, 'Cartago se arma');
  // 4 · promesas vencidas: el humor cae ya; el favor lo quita el juicio siguiente (si pierdes antes, no se cobra)
  e.promesas = e.promesas.filter(p => { if (e.turno >= p.vence) { e.humor[p.bando] = cl(e.humor[p.bando] - K.promesaRota.humor, 0, 100); e.marcas.promRotas.push(p.bando); e.cambios.push({ que: 'promesa', n: -1, motivo: 'Rompes tu promesa a los ' + nb(p.bando) }); return false; } return true; });
  // 5 · cuentas en rojo y revuelta
  e.rojos.oro = e.oro < 0 ? e.rojos.oro + 1 : 0; e.rojos.grano = e.grano < 0 ? e.rojos.grano + 1 : 0;
  e.revuelta = e.plebe < K.revuelta.umbral ? (e.revuelta || 0) + 1 : 0;
  // 6 · ¿se acaba? Si no, actúan los consejeros delegados
  const fin = juzgar(e);
  if (!fin) actuanConsejeros(e);
  const informe = { turno: e.turno, cambios: e.cambios.slice(), suceso: e.suceso, aprobadas: e.aprobadas.slice(), delegaron: e.delegaron.slice(), nuevo: e.nuevos.slice(), cambiosCiudad: e.cambiosCiudad.slice() };
  e.historial.push({ turno: e.turno, oro: e.oro, grano: e.grano, plebe: e.plebe, favor: e.favor, legiones: e.legiones, amenaza: e.amenaza, fuerza: fuerza(e), edad: e.edad, saberes: e.saberes.length, edif: Object.assign({}, e.edif), plan: e.plan.filter(p => p.hecho).length + '/' + e.plan.length, ley: e.recuento ? leyTexto(e.recuento.ley, e).titulo : null, aprobada: !!(e.recuento && e.recuento.aprobada) });
  e.ultimo = informe;
  if (fin) { e.fin = fin; e.fase = 'fin'; return informe; }
  e.turno++; repartirEscanos(e); empezarEstacion(e);
  return informe;
}

/* ---------- veredicto: siete finales ---------- */
export function juzgar(e) {
  if (e.plebe <= 0 || e.revuelta >= 2) return { gana: false, titulo: 'Revuelta de la plebe', causas: [e.plebe <= 0 ? 'La plebe llegó a 0 de contento y se echó a la calle.' : `La plebe estuvo por debajo de ${K.revuelta.umbral} dos estaciones seguidas y se rebeló.`], nota: 0 };
  if (e.rojos.grano >= 2) return { gana: false, titulo: 'Hambre en Roma', causas: ['El grano estuvo en negativo dos estaciones seguidas.'], nota: 0 };
  if (e.rojos.oro >= 2) return { gana: false, titulo: 'El arca está vacía', causas: ['El oro estuvo en negativo dos estaciones seguidas: nadie paga a las legiones.'], nota: 0 };
  if (e.favor <= 0) return { gana: false, titulo: 'El Senado te depone', causas: ['El favor del Senado llegó a 0.'], nota: 0 };
  if (e.turno < K.turnos - 1) return null;
  const f = fuerza(e);
  if (f < e.amenaza) return { gana: false, titulo: 'Roma saqueada', causas: [`Cartago golpea con ${e.amenaza} y tus fuerzas solo suman ${f}.`], nota: 1 };
  if (e.edad < 2) return { gana: false, titulo: 'Sin triunfo', causas: ['Aguantaste el golpe, pero Roma no salió al mar: sigues en la Edad I.', 'Para el triunfo hace falta la Edad II «Roma sale al mar».'], nota: 3 };
  return { gana: true, titulo: 'Triunfo', causas: [`Cartago golpea con ${e.amenaza}; tus fuerzas suman ${f}.`, 'Roma está en la ' + (e.edad === 3 ? 'Edad III «Aníbal»' : 'Edad II «Roma sale al mar»') + '.'], nota: nota(e) };
}
export function nota(e) {
  let n = 6; const f = fuerza(e);
  if (e.edad >= 3) n += 2; if (e.saberes.length >= 4) n += 1; if (e.plebe >= 60) n += 0.5; if (f - e.amenaza >= 20) n += 0.5;
  return Math.min(10, n);
}

/* ---------- consejo: lo que faltó (al final) o lo que más aprieta (en juego) ---------- */
export function consejo(e) {
  const f = fuerza(e), fl = fuerzaLegion(e), fin = e.fin;
  const legs = x => { const n = Math.ceil(x / fl); return n === 1 ? 'una legión' : n === 2 ? 'dos legiones' : n + ' legiones'; };
  const reqII = () => requisitosEdad(e, 2).faltan.filter(t => !t.startsWith('Estar')).join(', ');
  if (fin) {
    switch (fin.titulo) {
      case 'Roma saqueada': { const x = e.amenaza - f; return `Te faltaron ${x} de fuerza: ${legs(x)}${x <= K.muralla ? ' o un nivel de muralla' : ''}. La amenaza sube ${amenazaSube(e)} cada estación y los sucesos la empujan: recluta pronto, que la leva tarda.`; }
      case 'Sin triunfo': return `Aguantaste el golpe, pero no llegaste a la Edad II. Te faltó: ${reqII() || 'votar «Pasar de edad»'}. Ponlo en el plan del año.`;
      case 'Revuelta de la plebe': return `La plebe se rebeló. Cuando baje de 40, haz juegos o vota grano barato; un templo la sostiene cada estación.`;
      case 'Hambre en Roma': return `Te quedaste sin grano dos estaciones. Cada legión come ${K.legion.grano}: sube las granjas antes de reclutar.`;
      case 'El arca está vacía': return `El oro estuvo en rojo dos estaciones. Cada legión cuesta ${K.legion.oro} por estación: aprueba el tributo o sube el mercado.`;
      case 'El Senado te depone': return `El favor llegó a 0. Una ley que cae resta ${K.favorCae}, dejar pasar resta ${K.favorPasa} y el juicio castiga no tener plan o dejarlo a medias.`;
      case 'Triunfo': { const m = f - e.amenaza, mas = []; if (e.edad < 3) mas.push('llegar a la Edad III'); if (e.saberes.length < 4) mas.push('cuatro saberes'); if (m < 20) mas.push('20 de margen sobre el golpe'); return `Ganaste con ${m} de margen sobre el golpe.${mas.length ? ' Para más nota: ' + mas.join(', ') + '.' : ''}`; }
    }
    return fin.causas.join(' ');
  }
  const g = golpe(e);
  if (e.fase === 'consejo') return 'Es primavera: elige hasta tres encargos para el año. El Senado juzgará si los cumples.';
  if (e.grano < 25) return `El grano escasea (${e.grano}): sube las granjas o evita reclutar esta estación.`;
  if (e.plebe < 35) return `La plebe está en ${e.plebe}: haz juegos o vota grano barato antes de que se rebele.`;
  if (e.favor < 25) return `El favor está en ${e.favor}: no dejes caer otra ley; ofrece tratos o un banquete.`;
  if (g.falta > 0) return `Para el golpe te faltan unos ${g.falta} de fuerza (se espera ${g.esperado}, entre ${g.min} y ${g.max}): ${legs(g.falta)}${g.falta <= K.muralla ? ' o un nivel de muralla' : ', o legiones y muralla'}.`;
  if (e.edad < 2) return `Vas cubierto ante el golpe. Falta la Edad II: ${reqII() || 'vota «Pasar de edad»'}.`;
  return 'Vas cubierto y en la Edad II. Guarda margen: los sucesos aún pueden subir la amenaza.';
}
