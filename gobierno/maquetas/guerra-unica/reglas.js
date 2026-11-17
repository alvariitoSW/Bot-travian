/* Maqueta GM11/GM21 «guerra única» — REGLAS. Sin pantalla: corre igual en Node (prueba.mjs) y en el navegador.
   Es la batalla de tres cuerpos de GC1/GM1 (ala izquierda, centro, ala derecha; tres líneas que se relevan) con esto nuevo:
   1) EMPIEZA DE LEJOS. Las líneas salen a DIST0 metros. Delante van los tiradores (vélites, honderos): tiran, y se
      retiran por los huecos antes del choque. Cada cuerpo choca cuando llega: no todos a la vez.
   2) CUBRIRSE. Mientras se acerca, el legionario elige: avanzar (sin cubrirse: bajas), escudos (menos bajas, cansa, va
      despacio) o testudo (casi inmune, agota, casi no anda, y si le chocan dentro se deshace).
   3) UNA FICHA POR TROPA. Cada tropa es una línea de TROPAS que dice su arma (ARMAS), su formación (FORMACIONES) y su
      cartón. Un ejército es una lista de nombres (EJERCITOS). Para añadir una tropa o un arma no se toca el motor ni el dibujo.
   4) EL PLAN (GM21). Antes de marchar se elige: fondo de cada cuerpo (ancho, normal, hondo), disposición (recta, centro fuerte,
      ala fuerte, centro atrás), dónde espera la caballería y si los vélites van delante. Sin plan, todo es como antes.
   El jugador da las mismas pocas órdenes; los cuatro botones dicen otra cosa según el cuerpo esté lejos o luchando. */

export const LADO_ROMA = 0, LADO_ENEMIGO = 1;
export const NOMBRE_SECTOR = ['Ala izquierda', 'Centro', 'Ala derecha'];
export const DONDE = ['por la izquierda', 'en el centro', 'por la derecha'];

/* ARMAS. alcance en metros · tiro = bajas por tirador y segundo contra tropa sin cubrir · salva = parte de la primera
   línea rival que cae de una sola descarga al chocar · vuelo = cómo se pinta el proyectil (segundos, altura, largo, grosor, color) */
export const ARMAS = {
  espada:   { n: 'espada',   alcance: 0 },
  lanza:    { n: 'lanza',    alcance: 0, frena: true },   // frena = clavada en tierra: para una carga y aguanta mejor al esperar
  jabalina: { n: 'jabalinas', alcance: 30,  tiro: 0.032, vuelo: { seg: 1.3, alto: 5,  largo: 0.07, grueso: 1.8, color: '#2b1d0e' } },
  honda:    { n: 'piedras',   alcance: 80,  tiro: 0.15, vuelo: { seg: 2.0, alto: 13, largo: 0.03, grueso: 2.8, color: '#ffffff' } },
  arco:     { n: 'flechas',   alcance: 110, tiro: 0.110, vuelo: { seg: 2.4, alto: 20, largo: 0.07, grueso: 1.8, color: '#efe2c0' } },
  pilum:    { n: 'pila',      alcance: 14,  salva: 0.05, vuelo: { seg: 0.9, alto: 3,  largo: 0.1,  grueso: 1.7, color: '#2e2010' } },
};

/* FORMACIONES. px, pz = metros entre hombres y entre filas (para dibujar) · marcha = metros por segundo al acercarse
   frente = cuánto pega de frente · recibe = cuánto daño encaja de frente · flanco = cuánto se agrava un golpe de costado o de espalda · cubre = si le entran de lado y aguanta, la reserva se vuelve a taparlo
   delante = pelea delante de la línea y se retira antes del choque · adelanto = cuántos metros se adelanta */
export const FORMACIONES = {
  manipulos: { n: 'manípulos',     px: 1,   pz: 1.15, marcha: 2.4, frente: 1, recibe: 1, flanco: 1, cubre: true },
  tropel:    { n: 'tropel',        px: 1,   pz: 1.15, marcha: 2.7, frente: 1, recibe: 1, flanco: 1.25 },
  cerrada:   { n: 'línea cerrada', px: 1,   pz: 1.15, marcha: 1.8, frente: 1, recibe: 1, flanco: 1.35 },
  falange:   { n: 'falange',       px: 1,   pz: 1.0,  marcha: 1.5, frente: 1.05, recibe: 0.95, flanco: 1.9 },
  ligera:    { n: 'tropa ligera',  px: 1.5, pz: 1.8,  marcha: 3.6, frente: 0.5, recibe: 1.3, flanco: 1.1, delante: true, adelanto: 34 },
  tiro:      { n: 'línea de tiro', px: 1.5, pz: 1.9,  marcha: 3.0, frente: 0.3, recibe: 1.7, flanco: 1.4, delante: true, adelanto: 34 },
  escuadron: { n: 'escuadrón',     px: 1.7, pz: 2.0,  marcha: 9 },
};

/* POSTURAS mientras se acercan. paso = metros por segundo · recibe = parte de los proyectiles que hacen baja
   cansa = fatiga por segundo de todas las líneas del cuerpo · aprieta = cuánto se juntan los hombres · techo = se pinta el tejado de escudos */
export const POSTURAS = {
  avanzar: { paso: 2.4,  recibe: 1,    cansa: 0,      aprieta: 1 },
  escudos: { paso: 1.3,  recibe: 0.42, cansa: 1 / 90, aprieta: 0.82 },
  testudo: { paso: 0.35, recibe: 0.1,  cansa: 1 / 40, aprieta: 0.62, techo: true },
};

/* LAS FICHAS. cal = calidad en el choque · cansa = cuánto se fatiga · blanco = cuánto le aciertan los proyectiles sin cubrirse
   cubre = sabe formar escudos y testudo · arroja = arma que lanza justo antes de chocar · mun = segundos de tiro que lleva
   genio = cómo decide sola (furia, firme, alterno) · carton = modelo que se fotografía · montado = va a caballo */
export const TROPAS = {
  velites:   { n: 'vélites',   uno: 'los vélites',   arma: 'jabalina', forma: 'ligera',    carton: 'velites',   cal: 0.5,  cansa: 1,    blanco: 0.3, hombres: 40, mun: 15 },
  hastati:   { n: 'hastati',   uno: 'los hastati',   arma: 'espada',   forma: 'manipulos', carton: 'hastati',   cal: 1.00, cansa: 1.00, blanco: 0.8,  hombres: 120, cubre: true, arroja: 'pilum' },
  principes: { n: 'príncipes', uno: 'los príncipes', arma: 'espada',   forma: 'manipulos', carton: 'principes', cal: 1.14, cansa: 0.90, blanco: 0.75, hombres: 120, cubre: true, arroja: 'pilum' },
  triarii:   { n: 'triarios',  uno: 'los triarios',  arma: 'lanza',    forma: 'manipulos', carton: 'triarii',   cal: 1.12, cansa: 0.80, blanco: 0.7,  hombres: 60, cubre: true, firme: true },
  galos:     { n: 'galos',     uno: 'los galos',     arma: 'espada',   forma: 'tropel',    carton: 'galos',     cal: 1.45, cansa: 1.75, blanco: 1.0,  hombres: 230, genio: 'furia' },
  libios:    { n: 'libios',    uno: 'los libios',    arma: 'lanza',    forma: 'cerrada',   carton: 'libios',    cal: 1.31, cansa: 0.72, blanco: 0.6,  hombres: 260, genio: 'firme' },
  iberos:    { n: 'iberos',    uno: 'los iberos',    arma: 'espada',   forma: 'tropel',    carton: 'iberos',    cal: 1.22, cansa: 1.05, blanco: 0.75, hombres: 230, genio: 'alterno', arroja: 'pilum' },
  honderos:  { n: 'honderos',  uno: 'los honderos',  arma: 'honda',    forma: 'tiro',      carton: 'honderos',  cal: 0.4,  cansa: 1,    blanco: 0.7,  hombres: 30, mun: 24 },
  equites:   { n: 'équites',   uno: 'los équites',   arma: 'lanza',    forma: 'escuadron', carton: 'equites',   montado: true, hombres: 66 },
  numidas:   { n: 'númidas',   uno: 'los númidas',   arma: 'jabalina', forma: 'escuadron', carton: 'numidas',   montado: true, hombres: 66 },
  /* fichas de muestra para el segundo rival: prueban que añadir tropas es añadir líneas. Los arqueros no tienen modelo propio todavía */
  arqueros:  { n: 'arqueros',  uno: 'los arqueros',  arma: 'arco',     forma: 'tiro',      carton: 'honderos',  cal: 0.4,  cansa: 1,    blanco: 0.8,  hombres: 30, mun: 30 },
  falange:   { n: 'falange',   uno: 'la falange',    arma: 'lanza',    forma: 'falange',   carton: 'falange',   cal: 1.22, cansa: 0.8,  blanco: 0.55, hombres: 260, genio: 'firme' },
  hoplitas:  { n: 'hoplitas',  uno: 'los hoplitas',  arma: 'lanza',    forma: 'cerrada',   carton: 'hoplitas',  cal: 1.12, cansa: 1.0,  blanco: 0.6,  hombres: 230, genio: 'alterno' },
  tesalios:  { n: 'tesalios',  uno: 'los tesalios',  arma: 'lanza',    forma: 'escuadron', carton: 'tesalios',  montado: true, hombres: 66 },
};

/* EJÉRCITOS. Tres cuerpos, de izquierda a derecha vistos desde Roma. La tropa «delante» sale a tirar; las demás son las líneas */
export const EJERCITOS = {
  roma:    { n: 'Roma',           jinetes: 'equites',  cuerpos: [['velites', 'hastati', 'principes', 'triarii'], ['velites', 'hastati', 'principes', 'triarii'], ['velites', 'hastati', 'principes', 'triarii']] },
  cartago: { n: 'Cartago',        jinetes: 'numidas',  cuerpos: [['galos'], ['honderos', 'libios'], ['honderos', 'iberos']] },
  pirro:   { n: 'Pirro de Epiro', jinetes: 'tesalios', cuerpos: [['arqueros', 'hoplitas'], ['falange'], ['arqueros', 'hoplitas']] },
};

/* LOS BOTONES. Cuatro huecos; dicen una cosa lejos y otra luchando */
export const ORDENES = {
  avanzar:    { que: 'Avanzar',    sub: 'sin cubrirse' },
  escudos:    { que: 'Escudos',    sub: 'cubre, cansa' },
  testudo:    { que: 'Testudo',    sub: 'inmune, agota' },
  empujar:    { que: 'Empujar',    sub: 'pega más, cansa' },
  aguantar:   { que: 'Aguantar',   sub: 'menos bajas' },
  relevo:     { que: 'Relevo',     sub: 'línea fresca' },
  caballeria: { que: 'Caballería', sub: 'carga al flanco' },
};


/* EL PLAN (GM21). Lo que se elige antes de marchar. Las pantallas sacan de aquí los nombres y las líneas «qué da y qué cuesta».
   FONDOS: razon = cuántas veces más ancha que honda se dibuja cada línea (es lo que se pasa a formacion.filesDe) · anchura = frente relativo
   (decide quién desborda a quién) · frente = cuánto pega de frente · moral = cuánto deprisa cae la moral · relevo = cuánto tarda el relevo */
export const FONDOS = {
  ancho:  { n: 'Ancho',  razon: 6,    anchura: 1.35, frente: 1.1, moral: 1.4, relevo: 1.6,  sub: 'Pega más y desborda; cede antes y relevar tarda' },
  normal: { n: 'Normal', razon: 3.2,  anchura: 1,    frente: 1,    moral: 1,   relevo: 1,    sub: 'Equilibrado: ni gana ni pierde nada' },
  hondo:  { n: 'Hondo',  razon: 1.25, anchura: 0.7,  frente: 0.95, moral: 0.7, relevo: 0.8, sub: 'Aguanta y releva deprisa; pega menos y lo desbordan' },
};
/* DISPOSICIONES. grande = cuerpo que recibe hombres de los otros · atras = metros que sale más atrás cada cuerpo (z mayor) · pasa = parte de los hombres que cede cada cuerpo */
export const DISPOSICIONES = {
  'recta':         { n: 'Línea recta',       sub: 'Los tres cuerpos, iguales y a la par',                 grande: -1, atras: [0, 0, 0],   pasa: [0, 0, 0] },
  'centro-fuerte': { n: 'Centro fuerte',     sub: 'Más hombres al centro; las alas, más flacas',          grande: 1,  atras: [0, 0, 0],   pasa: [0.2, 0, 0.2] },
  'ala-izquierda': { n: 'Ala izquierda fuerte', sub: 'Golpe a la izquierda; la derecha, rehusada y atrasada', grande: 0,  atras: [0, 0, 30],  pasa: [0, 0.2, 0.2] },
  'ala-derecha':   { n: 'Ala derecha fuerte',   sub: 'Golpe a la derecha; la izquierda, rehusada y atrasada', grande: 2,  atras: [30, 0, 0],  pasa: [0.2, 0.2, 0] },
  'centro-atras':  { n: 'Centro atrás',      sub: 'Las alas chocan antes; el centro llega tarde',         grande: -1, atras: [0, 35, 0],  pasa: [0, 0, 0] },
};
/* SITIOS_CABALLERIA. adelanto = segundos que antes (negativo) o después llega la carga a cada sector · mitad = el golpe vale la mitad */
export const SITIOS_CABALLERIA = {
  reserva:   { n: 'En reserva',    sub: 'Espera tras el centro; llega igual a todas partes',   llega: [0, 0, 0],   mitad: false },
  izquierda: { n: 'Ala izquierda', sub: 'Llega antes a la izquierda y tarda en las demás',     llega: [-2, 2, 2],  mitad: false },
  derecha:   { n: 'Ala derecha',   sub: 'Llega antes a la derecha y tarda en las demás',       llega: [2, 2, -2],  mitad: false },
  repartida: { n: 'Repartida',     sub: 'Llega antes a las dos alas, pero el golpe vale la mitad', llega: [-1, 0, -1], mitad: true },
};
export const VELITES = { true: { n: 'Sí', sub: 'Tiran y se retiran por los huecos antes del choque' }, false: { n: 'No', sub: 'Quedan tras los triarios: ni tiran ni caen' } };
export const PLAN_BASE = { fondo: ['normal', 'normal', 'normal'], disposicion: 'recta', caballeria: 'reserva', velites: true };
/* Plan completo y válido a partir de uno parcial (o de ninguno) */
export function planNormal(p) {
  const b = { fondo: PLAN_BASE.fondo.slice(), disposicion: PLAN_BASE.disposicion, caballeria: PLAN_BASE.caballeria, velites: PLAN_BASE.velites };
  if (!p) return b;
  if (p.fondo) { const f = Array.isArray(p.fondo) ? p.fondo : [p.fondo, p.fondo, p.fondo]; for (let i = 0; i < 3; i++) if (FONDOS[f[i]]) b.fondo[i] = f[i]; }
  if (DISPOSICIONES[p.disposicion]) b.disposicion = p.disposicion;
  if (SITIOS_CABALLERIA[p.caballeria]) b.caballeria = p.caballeria;
  if (typeof p.velites === 'boolean') b.velites = p.velites;
  return b;
}

/* PREMIO Y CASTIGO (GM6). Cuánto sube o baja el ÁNIMO DE LA LEGIÓN (B.animo, 0 a 1, empieza en 0,5) cada acierto o error del mando */
export const MANDO = { relevoBien: 0.06, relevoMal: 0.06, ordenBien: 0.03, ordenMal: 0.05, contraorden: 0.03, cubre: 0.03, escudos: 0.02, vuelve: 0.004, deshecha: 0.07, costado: 0.05,
  empuje: 6, empujeFuerza: 1.2, fuerza: 0.2, moral: 0.012, enfria: 6 };
const CEDE = 0.5;                  // un cuerpo que ha cedido tanto terreno descubre el costado de su vecino
export const GOLPE = { costado: { dano: 0.5, moral: 0.01 }, espalda: { dano: 0.9, moral: 0.035 } };   // lo que agrava un golpe de lado o de atrás (por la «flanco» de la formación)
const BRIO = 0.05;                 // cada cuerpo enemigo llega un poco mejor o peor según el día (±7 %)
export const DESBORDE = { razon: 1.25, desde: 6, peso: 0.1 };   // quien tiene un frente 25 % mayor que el de enfrente le llega de costado, a media fuerza, desde 6 s tras el choque
export const DIST0 = 150;         // metros entre las dos líneas al empezar
const CONTACTO = 1;               // a esta distancia ya se lucha cuerpo a cuerpo
export const T_RELEVO = 3.2;             // lo que tarda una línea en pasar por los huecos de la otra
const T_CABALLERIA = 24;          // descanso de los équites entre cargas
const BASE_FATIGA = 1 / 46;       // empujando sin parar, una línea se agota en unos 45 s
const DESCANSO = 1 / 120;         // una línea en retaguardia recobra el aliento despacio
const K_BAJAS = 1.36;
const T_DESHACER = 3.5;           // segundos que tarda un testudo en deshacerse para volver a andar
const SUSTO = 0.02;                 // ánimo que pierde por segundo un cuerpo al que le llueven proyectiles sin cubrirse             // hombres por segundo que causa una fuerza de 1

function azar(semilla) { let s = semilla >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function cuerpo(lado, i, tipos, k) {
  const linea = t => { const h = Math.round(TROPAS[t].hombres * k); return { tipo: t, hombres: h, max: h, fatiga: 0 }; };
  const del = tipos.filter(t => FORMACIONES[TROPAS[t].forma].delante)[0], lineas = tipos.filter(t => t !== del).map(linea);
  const tir = del ? Object.assign(linea(del), { estado: 'sale', av: 3, mun: TROPAS[del].mun, blanco: null }) : null;   // los que van delante a tirar
  return { lado, i, lineas, tir, z: DIST0 / 2, postura: 'avanzar', moral: 1, roto: false, relevo: 0, golpe: 0, impulso: 0, frenada: 0, fuego: -9, pila: false, flanqueado: false, ff: FONDOS.normal, nf: 'normal', anch: lineas.length && TROPAS[lineas[0].tipo].forma === 'falange' ? 0.85 : 1, flanco: { costado: 0, espalda: 0, cubre: false, causa: '' }, hueco: false, desorden: 0, empuje: 0, relevoDe: 0, tOrd: -9, tBien: -9, tFlanco: 0, golpePor: '', libre: 0, tPost: 0,
    inicial: lineas.reduce((a, l) => a + l.max, 0) + (tir ? tir.max : 0) };
}

export const BASE_HOMBRES = 1020;   // romanos de la batalla base (tres cuerpos de 40 vélites + 120 + 120 + 60)
export function nueva(semilla, hombresRoma, rival, cuerpos, plan) {   // cuerpos = [[3 cuerpos de Roma], [3 del rival]] de nombres de tropa: para probar duelos
  const k = Math.max(0.3, (hombresRoma || BASE_HOMBRES) / BASE_HOMBRES), lejos = 2.2 * (Math.sqrt(Math.max(1, k)) - 1);   // el campo crece: los jinetes tardan más en llegar
  const yo = EJERCITOS.roma, el = EJERCITOS[rival] || EJERCITOS.cartago;
  const B = { k, lejos, t: 0, fase: 'lejos', rnd: azar(semilla || 7), sect: [], eventos: [], animo: 0.5, mando: { bien: 0, mal: 0 }, fijo: false, dt: 0, resultado: null, ordenes: 0, rival: el.n, porTiro: [0, 0], porTiroLinea: [0, 0],
    cab: { tipo: yo.jinetes, estado: 'lista', sect: -1, t: 0, total: 3, mitad: 1, hombres: Math.round(TROPAS[yo.jinetes].hombres * k) },
    num: { tipo: el.jinetes, estado: 'lejos', sect: -1, t: 0, veces: 0, proxima: 1e9, hombres: Math.round(TROPAS[el.jinetes].hombres * k) } };
  for (let i = 0; i < 3; i++) { B.sect.push({ i, frente: 0, dist: DIST0, tChoque: -1, c: [cuerpo(0, i, (cuerpos ? cuerpos[0] : yo.cuerpos)[i], k), cuerpo(1, i, (cuerpos ? cuerpos[1] : el.cuerpos)[i], k)] }); B.sect[i].c[1].brio = 1 + BRIO * (2 * B.rnd() - 1); }
  B.plan = planNormal(plan); aplicarPlan(B);
  return B;
}

/* El plan en las reglas: fondo de cada cuerpo, reparto de hombres, quién sale más atrás y si los vélites van delante */
function aplicarPlan(B) {
  const P = B.plan, tropas = c => c.lineas.concat(c.tir ? [c.tir] : []), D = DISPOSICIONES[P.disposicion], cs = B.sect.map(s => s.c[0]);
  cs.forEach((c, i) => { c.nf = P.fondo[i]; c.ff = FONDOS[c.nf]; c.anch = c.ff.anchura; });
  const cede = cs.map((c, i) => tropas(c).map(l => Math.round(l.max * D.pasa[i])));      // lo que cede cada tropa de cada cuerpo, calculado antes de mover a nadie
  const dest = P.disposicion === 'centro-fuerte' ? [1, 1, 1] : P.disposicion === 'ala-izquierda' ? [0, 0, 0] : P.disposicion === 'ala-derecha' ? [2, 2, 2] : null;
  if (dest) cs.forEach((c, i) => { if (dest[i] === i) return; tropas(c).forEach((l, j) => { const m = cede[i][j], z = tropas(cs[dest[i]])[j]; if (!z) return; l.max -= m; l.hombres -= m; z.max += m; z.hombres += m; }); });
  cs.forEach((c, i) => { c.z += D.atras[i]; c.inicial = tropas(c).reduce((a, l) => a + l.max, 0); B.sect[i].dist = c.z + B.sect[i].c[1].z; });
  if (!P.velites) for (const c of cs) if (c.tir) { c.tir.estado = 'fuera'; c.tir.av = 0; c.tir.atras = true; }       // se quedan detrás: ni tiran ni los alcanzan
}

export const frente = c => c.lineas[0];
export const hombres = c => c.lineas.reduce((a, l) => a + l.hombres, 0) + (c.tir ? c.tir.hombres : 0);
export const hombresLado = (B, lado) => B.sect.reduce((a, s) => a + hombres(s.c[lado]), 0);
export const inicialLado = (B, lado) => B.sect.reduce((a, s) => a + s.c[lado].inicial, 0);
export const lejos = s => s.dist > 0;                                        // el cuerpo aún se acerca
export const tirando = c => c.tir && (c.tir.estado === 'sale' || c.tir.estado === 'tira') ? c.tir : null;   // tiradores que siguen delante
export const bajoFuego = (B, c) => B.t - c.fuego < 0.6;                      // le están cayendo proyectiles ahora mismo
/* Los cuatro botones que tocan ahora en un sector */
export const ordenesDe = (B, i) => lejos(B.sect[i]) ? ['avanzar', 'escudos', 'testudo', 'caballeria'] : ['empujar', 'aguantar', 'relevo', 'caballeria'];
const May = t => t.replace(/^l/, 'L');

function ev(B, tipo, sect, texto, mas) { B.eventos.push(Object.assign({ tipo, sect, texto, t: B.t }, mas || {})); }

export function fuerza(c, rival) {
  const l = frente(c), T = TROPAS[l.tipo], F = FORMACIONES[T.forma], R = rival && TROPAS[frente(rival).tipo], clavada = R && ARMAS[R.arma].frena && rival.postura === 'aguantar';
  const fondo = Math.max(0.3, Math.min(1, l.hombres / (0.4 * l.max)));          // pega con todo hasta que la línea se queda en el 40 %
  return T.cal * fondo * (1 - 0.55 * l.fatiga) * (c.postura === 'empujar' ? 1.25 : 0.8) * (c.relevo > 0 ? 0.7 : 1) * (0.7 + 0.3 * c.moral) * (c.impulso > 0 && !clavada ? 1.15 : 1) * F.frente * (R && T.arma === 'espada' && R.forma === 'falange' ? 0.8 : 1) * (c.frenada > 0 ? 0.8 : 1) * (c.brio || 1) * c.ff.frente * (c.empuje > 0 ? MANDO.empujeFuerza : 1) * (1 - 0.15 * c.flanco.costado - 0.25 * c.flanco.espalda);   // quien se vuelve a mirar atrás no pega delante
}

/* Cuánto agrava el daño lo que le llega por el costado o la espalda (1 = nada). La reserva que se vuelve lo rebaja */
export function agravante(c) { const k = c.flanco.cubre ? 0.4 : 1, fl = FORMACIONES[TROPAS[frente(c).tipo].forma].flanco; return 1 + (GOLPE.costado.dano * c.flanco.costado + GOLPE.espalda.dano * c.flanco.espalda) * fl * k; }

/* JUICIO DEL MANDO. Apunta el acierto o el error, mueve el ánimo de la legión y lo cuenta con un evento 'mando' (juicio: 'bien' | 'mal') */
function mando(B, i, bien, texto, cuanto) {
  B.animo = Math.max(0, Math.min(1, B.animo + (bien ? cuanto : -cuanto))); B.mando[bien ? 'bien' : 'mal']++;
  ev(B, 'mando', i, texto, { juicio: bien ? 'bien' : 'mal', animo: B.animo });
}
/* Cuánto lleva hecho el relevo en curso (0 al ordenarlo, 1 al terminar). La pantalla pinta el paso de líneas con esto: dura lo que dicen las reglas. */
export const progresoRelevo = c => c.relevoDe > 0 ? Math.max(0, Math.min(1, 1 - c.relevo / c.relevoDe)) : 0;   // 1 = ya terminó (o no hay relevo en curso)
/* ¿Es buen momento para relevar? '' = ni bien ni mal. Se mira ANTES de mover las líneas. El relevo visible (encargo C) usa esto. */
export function juicioRelevo(B, i) {
  const s = B.sect[i], c = s.c[0], e = s.c[1], l = frente(c), sig = c.lineas[1];
  if (lejos(s) || !sig || c.roto) return '';
  if (l.fatiga < 0.5 && l.hombres > 0.55 * l.max) return 'sin-necesidad';
  if (!e.roto && e.postura === 'empujar' && e.tPost < 4) return 'bajo-carga';
  if (sig.fatiga > 0.5) return 'sin-aliento';
  return 'a-tiempo';
}
/* ¿Y para empujar o aguantar? Solo se juzga ya trabados. */
export function juicioPostura(B, i, orden) {
  const s = B.sect[i], c = s.c[0], e = s.c[1], l = frente(c);
  if (lejos(s) || e.roto) return '';
  if (B.t - c.tOrd < 2) return 'contraorden';
  const abierto = e.flanco.costado > 0 || e.flanco.espalda > 0 || e.desorden > 0.5;
  if (orden === 'empujar') {
    if (l.fatiga > 0.75) return 'agotados';
    if (TROPAS[frente(e).tipo].forma === 'falange' && !abierto && TROPAS[l.tipo].arma === 'espada') return 'picas';
    if (e.postura === 'aguantar' || abierto || frente(e).fatiga > 0.6) return 'flaquean';
    return '';
  }
  return e.postura === 'empujar' && e.tPost < 5 ? 'carga' : '';
}
const JUICIOS = {
  contraorden: [false, 'Órdenes y contraórdenes: dudan', 'contraorden'], agotados: [false, 'Empujas con hombres agotados', 'ordenMal'], picas: [false, 'De frente contra las picas', 'ordenMal'],
  flaquean: [true, 'Bien visto: empujas cuando flaquean', 'ordenBien'], carga: [true, 'Bien: aguantas la carga', 'ordenBien'],
};

/* De dónde le llega el peligro a cada cuerpo. Se recalcula a cada paso y avisa cuando cambia. */
function flancos(B) {
  for (const s of B.sect) for (const c of s.c) {
    const fl = c.flanco, antes = fl.espalda > 0 ? 'espalda' : fl.costado > 0 ? 'costado' : ''; let costado = 0, espalda = 0, causa = '';
    if (!c.roto) {
      if (c.flanqueado) { costado = 1; causa = 'envuelto'; }          // el vecino huyó y el vencedor se ha vuelto contra este costado
      let hueco = false;                                              // el vecino amigo ha cedido mucho terreno: por ese hueco entra el enemigo
      for (const j of [s.i - 1, s.i + 1]) {
        const o = B.sect[j]; if (!o || o.c[1 - c.lado].roto || o.c[c.lado].roto || lejos(o) || lejos(s)) continue;
        const sg = c.lado === 0 ? -1 : 1, cedido = sg * o.frente, mas = sg * (o.frente - s.frente), u = c.hueco ? 0.12 : 0;      // u: para que el aviso no parpadee
        if (cedido > CEDE - u && mas > 0.35 - u) hueco = true;
      }
      c.hueco = hueco; if (hueco) { costado = 1; causa = causa || 'hueco'; }
      if (c.golpe > 0 && c.golpePor) { costado = 1; causa = 'jinetes'; }
      const o = s.c[1 - c.lado];                                      // DESBORDE: el frente de enfrente es un 25 % más largo que el mío y ya llevan 6 s luchando
      if (!lejos(s) && s.tChoque >= 0 && B.t - s.tChoque >= DESBORDE.desde && !o.roto && o.anch >= c.anch * DESBORDE.razon && costado < DESBORDE.peso) { costado = DESBORDE.peso; causa = 'desborde'; }
    }
    fl.costado = costado; fl.espalda = espalda; fl.causa = causa;
    fl.cubre = costado > 0 && !!FORMACIONES[TROPAS[frente(c).tipo].forma].cubre && c.postura === 'aguantar' && c.lineas.length > 1 && !lejos(s);   // la reserva se vuelve
    const ahora = costado > 0 ? 'costado' : '';
    if (ahora && !antes && causa === 'hueco') ev(B, 'flanco', s.i, c.lado === 0 ? '¡Te entran por el hueco ' + DONDE[s.i] + '!' : 'Hueco en su línea ' + DONDE[s.i], { lado: c.lado, por: ahora, causa });
    if (ahora && !antes && causa === 'desborde') ev(B, 'flanco', s.i, c.lado === 0 ? 'Te desbordan ' + DONDE[s.i] : 'Desbordas su línea ' + DONDE[s.i], { lado: c.lado, por: ahora, causa });
    if (ahora && !antes && fl.cubre && c.lado === 0) ev(B, 'cubre', s.i, 'Tu reserva se vuelve y cubre el costado', { lado: 0 });
    /* premio y castigo: tapar el costado a tiempo cuenta; dejarlo al aire seis segundos, pudiendo taparlo, también */
    if (c.lado === 0 && !c.roto) {
      const pudo = !!FORMACIONES[TROPAS[frente(c).tipo].forma].cubre && c.lineas.length > 1;
      if (!ahora) c.tFlanco = 0;
      else if (fl.cubre) { if (c.tFlanco >= 0 && B.t - c.tOrd < 6) mando(B, s.i, true, 'Bien: la reserva tapa el costado', MANDO.cubre); c.tFlanco = -1; }
      else if (pudo && c.tFlanco >= 0) { c.tFlanco += B.dt; if (c.tFlanco >= 6) { mando(B, s.i, false, 'Costado al aire sin respuesta ' + DONDE[s.i], MANDO.costado); c.tFlanco = -1; } }
    }
  }
}

/* Qué puede hacer el jugador ahora mismo en un sector. Devuelve '' si se puede, o el motivo en llano. */
export function puede(B, i, orden) {
  const s = B.sect[i], c = s.c[0];
  if (B.fase === 'fin') return 'La batalla ha terminado';
  if (orden === 'caballeria') {
    if (B.cab.estado !== 'lista') return 'Los jinetes se están rehaciendo';
    if (s.c[1].roto) return 'Ahí ya no queda enemigo';
    return '';
  }
  if (c.roto) return 'Ese cuerpo ha huido';
  if (POSTURAS[orden]) {
    if (!lejos(s)) return 'Ya están luchando cuerpo a cuerpo';
    if (orden !== 'avanzar' && !TROPAS[frente(c).tipo].cubre) return May(TROPAS[frente(c).tipo].uno) + ' no saben formar así';
    if (c.cambio > 0) return 'Están deshaciendo el testudo';
    return c.postura === orden ? 'Ya lo están haciendo' : '';
  }
  if (lejos(s)) return 'Aún no han chocado';
  if (orden === 'relevo') { if (c.golpe > 0 && c.deshecho) return 'Están desordenados: aún no pueden relevarse'; if (c.lineas.length < 2) return 'No queda línea de refresco'; if (c.relevo > 0) return 'El relevo ya está en marcha'; return ''; }
  if (orden === 'empujar' || orden === 'aguantar') return c.postura === orden ? 'Ya lo están haciendo' : '';
  return 'Orden desconocida';
}

export function ordenar(B, i, orden) {
  const no = puede(B, i, orden); if (no) return no;
  const s = B.sect[i], c = s.c[0]; B.ordenes++;
  if (orden === 'empujar' || orden === 'aguantar') {
    const j = JUICIOS[juicioPostura(B, i, orden)];
    if (j && (!j[0] || B.t - c.tBien >= MANDO.enfria)) { mando(B, i, j[0], j[1], MANDO[j[2]]); if (j[0]) c.tBien = B.t; }
    c.tOrd = B.t;
  }
  if ((orden === 'escudos' || orden === 'testudo') && c.postura === 'avanzar' && bajoFuego(B, c) && B.t - c.tBien >= MANDO.enfria) { mando(B, i, true, 'Bien: te cubres bajo los proyectiles', MANDO.escudos); c.tBien = B.t; }
  if (POSTURAS[orden] && c.postura === 'testudo') { c.luego = orden; c.cambio = T_DESHACER; ev(B, 'orden', i, 'Deshacen el testudo', { orden }); }
  else if (POSTURAS[orden]) { c.postura = orden; ev(B, 'orden', i, orden === 'avanzar' ? '¡Adelante!' : orden === 'escudos' ? 'Escudos arriba' : 'Forman el testudo', { orden }); }
  else if (orden === 'empujar' || orden === 'aguantar') { c.postura = orden; ev(B, 'orden', i, orden === 'empujar' ? '¡Adelante!' : 'Escudos juntos', { orden }); }
  else if (orden === 'relevo') {
    const j = juicioRelevo(B, i); c.lineas.push(c.lineas.shift()); const TR = T_RELEVO * c.ff.relevo; c.relevo = c.relevoDe = TR; const entran = TROPAS[frente(c).tipo].uno;
    if (j === 'a-tiempo') { c.relevo = c.relevoDe = TR * 0.6; c.empuje = MANDO.empuje; c.moral = Math.min(1, c.moral + 0.1); }      // limpio: entran antes y con empuje
    else if (j === 'sin-necesidad') { c.desorden = Math.min(1, c.desorden + 0.25); c.moral = Math.min(1, c.moral + 0.05); }
    else if (j === 'bajo-carga') { c.relevo = c.relevoDe = TR * 1.4; c.desorden = Math.min(1, c.desorden + 0.35); c.moral -= 0.05; }
    else c.moral = Math.min(1, c.moral + (j === '' ? 0.05 : 0.1));
    ev(B, 'relevo', i, 'Entran ' + entran, { orden, juicio: j });
    if (j === 'a-tiempo') mando(B, i, true, 'Relevo a tiempo: entran ' + entran + ' con empuje', MANDO.relevoBien);
    else if (j === 'sin-necesidad') mando(B, i, false, 'Relevo sin necesidad: la línea se desordena', MANDO.relevoMal);
    else if (j === 'bajo-carga') mando(B, i, false, 'Relevo bajo la carga: se desordenan', MANDO.relevoMal);
    else if (j === 'sin-aliento') mando(B, i, false, 'Entran ' + entran + ' sin aliento', MANDO.relevoMal / 2);
  } else if (orden === 'caballeria') {
    const t = tirando(s.c[1]);                                             // si sus tiradores siguen delante, la carga va a por ellos
    const SC = SITIOS_CABALLERIA[B.plan.caballeria]; B.cab.estado = 'yendo'; B.cab.sect = i; B.cab.t = Math.max(0.8, 3 + B.lejos + (lejos(s) ? 2.5 : 0) + SC.llega[i]); B.cab.total = B.cab.t; B.cab.mitad = SC.mitad ? 0.5 : 1;
    ev(B, 'caballeria', i, t ? 'Los jinetes van a por ' + TROPAS[t.tipo].uno : 'Los jinetes cargan ' + DONDE[i], { orden });
  }
  return '';
}

function romper(B, s, lado) {
  const c = s.c[lado]; if (c.roto) return; c.roto = true; c.moral = 0;
  const quien = lado === 0 ? 'Tu ' + NOMBRE_SECTOR[s.i].toLowerCase() : May(TROPAS[frente(c).tipo].uno);
  ev(B, 'roto', s.i, lado === 0 ? quien + ' huye' : quien + ' huyen', { lado });
  if (lejos(s)) { s.dist = 0; s.tChoque = B.t; }
  for (const o of B.sect) { if (o === s) continue; if (!o.c[lado].roto) o.c[lado].moral = Math.max(0.02, o.c[lado].moral - 0.13); if (!o.c[1 - lado].roto) o.c[1 - lado].moral = Math.min(1, o.c[1 - lado].moral + 0.1); }
  s.c[1 - lado].libre = 4;                                          // el vencedor tarda un poco en volverse contra el flanco vecino
  if (lado === 0 && B.num.estado === 'hostiga' && B.num.sect === s.i) { B.num.estado = 'lejos'; B.num.proxima = B.t + 25; }
}

/* El vecino más cercano que aún lucha, para envolverlo */
export function vecino(B, i, ladoRival) {
  for (const j of i === 1 ? [0, 2] : [1, 2 - i]) { const o = B.sect[j]; if (!o.c[ladoRival].roto && !o.c[1 - ladoRival].roto) return o; }
  for (const j of i === 1 ? [0, 2] : [1, 2 - i]) { const o = B.sect[j]; if (!o.c[ladoRival].roto) return o; }
  return null;
}

function bajas(c, n) {
  const l = frente(c); l.hombres = Math.max(0, l.hombres - n);
  if (l.hombres < 0.15 * l.max && c.lineas.length > 1) { c.lineas.shift(); c.relevo = Math.max(c.relevo, 1.5); return true; }   // la línea deshecha se retira sola
  return false;
}

/* El enemigo decide solo, y siempre avisa: su postura se ve antes de que haga daño. Cada tropa decide según su «genio» */
function mente(B, s, dt) {
  const e = s.c[1], r = s.c[0], l = frente(e), tipo = l.tipo, genio = TROPAS[tipo].genio || 'alterno'; e.tPost += dt; let quiere = e.postura;
  if (genio === 'furia') quiere = e.postura === 'empujar' ? (l.fatiga > 0.78 ? 'aguantar' : 'empujar') : (l.fatiga < 0.5 || e.tPost > 16 ? 'empujar' : 'aguantar');
  else if (genio === 'firme') { if (B.t < s.tChoque + 14) quiere = 'aguantar'; else quiere = e.postura === 'empujar' ? (e.tPost > 15 || l.fatiga > 0.85 ? 'aguantar' : 'empujar') : ((e.tPost > 9 && l.fatiga < 0.7) || (!r.roto && frente(r).fatiga > 0.6 && e.tPost > 4) ? 'empujar' : 'aguantar'); }
  else quiere = e.postura === 'empujar' ? (e.tPost > 11 || l.fatiga > 0.8 ? 'aguantar' : 'empujar') : (e.tPost > 8 && l.fatiga < 0.65 ? 'empujar' : 'aguantar');
  if (quiere !== e.postura) { e.postura = quiere; e.tPost = 0; if (!r.roto) ev(B, quiere === 'empujar' ? 'carga-enemiga' : 'enemigo-cede', s.i, May(TROPAS[tipo].uno) + (quiere === 'empujar' ? ' cargan ' : ' flaquean ') + DONDE[s.i]); }
}

/* ---------- DE LEJOS: acercarse, tirar, cubrirse ---------- */
const postura = c => POSTURAS[c.postura] || POSTURAS.avanzar;

/* Los tiradores de un cuerpo: se adelantan, tiran a lo que tengan a tiro y se retiran antes del choque */
function tirar(B, s, c, dt) {
  const t = c.tir; if (!t || t.estado === 'fuera') return;
  const T = TROPAS[t.tipo], A = ARMAS[T.arma], Fm = FORMACIONES[T.forma], o = s.c[1 - c.lado], ot = tirando(o);
  if (t.estado === 'vuelve') { t.blanco = null; t.av -= 7 * dt; if (t.av <= 0) { t.av = 0; t.estado = 'fuera'; } return; }
  t.av = Math.max(0, Math.min(Fm.adelanto, t.av + Fm.marcha * dt, ot ? (s.dist - 8) / 2 : s.dist - 12));   // se adelantan, y ceden terreno según se echa encima el enemigo
  if (s.dist < 22 || t.mun <= 0 || t.hombres < 0.35 * t.max) {       // el choque se echa encima, no queda munición o han caído demasiados
    t.estado = 'vuelve'; t.blanco = null;
    ev(B, c.lado === 0 ? 'tir-vuelven' : 'calma', s.i, c.lado === 0 ? 'Tus ' + T.n + ' se retiran tras las líneas' : May(T.uno) + ' se retiran ' + DONDE[s.i], { lado: c.lado }); return;
  }
  const aLinea = s.dist - t.av <= A.alcance, aTir = ot && s.dist - t.av - ot.av <= A.alcance;
  t.blanco = aLinea ? (aTir ? 'ambos' : 'linea') : aTir ? 'tir' : null; if (!t.blanco) { t.estado = 'sale'; return; }
  t.estado = 'tira';
  if (c.lado === 0 && !t.dicho) { t.dicho = 1; ev(B, 'tir-tiran', s.i, 'Tus ' + T.n + ' lanzan sus ' + A.n, { lado: 0, arma: T.arma }); }
  if (c.lado === 1 && (t.dicho || 0) < (aLinea ? 2 : 1)) { t.dicho = aLinea ? 2 : 1; ev(B, 'lluvia', s.i, '¡' + May(A.n) + ' sobre tu' + (aLinea ? ' ' + NOMBRE_SECTOR[s.i].toLowerCase() : 's ' + TROPAS[ot.tipo].n) + '!', { lado: 1, arma: T.arma, linea: aLinea }); }
  t.mun -= dt;
  const d = t.hombres * A.tiro * dt * (0.85 + 0.3 * B.rnd()), parteTir = t.blanco === 'tir' ? 1 : t.blanco === 'ambos' ? 0.35 : 0;
  if (parteTir) { const n = Math.min(ot.hombres, d * parteTir * TROPAS[ot.tipo].blanco); ot.hombres -= n; B.porTiro[o.lado] += n; }
  if (parteTir < 1 && !o.roto) {
    const l = frente(o), P = TROPAS[l.tipo].cubre ? postura(o) : POSTURAS.avanzar, n = d * (1 - parteTir) * TROPAS[l.tipo].blanco * P.recibe;
    o.fuego = B.t; o.moral -= n / o.inicial * 1.5 + (P.recibe >= 1 ? SUSTO : 0) * dt; B.porTiro[o.lado] += n; B.porTiroLinea[o.lado] += n;
    if (bajas(o, n) && o.lado === 0) ev(B, 'linea-deshecha', s.i, 'Línea deshecha: entran ' + TROPAS[frente(o).tipo].uno);
    if (o.moral <= 0) romper(B, s, o.lado);
  }
}

function acercar(B, s, dt) {
  for (const c of s.c) {
    if (c.cambio > 0) { c.cambio -= dt; if (c.cambio <= 0) { c.cambio = 0; c.postura = c.luego; } }
    const l = frente(c), T = TROPAS[l.tipo], P = T.cubre ? postura(c) : POSTURAS.avanzar;
    c.z -= (T.cubre ? P.paso : FORMACIONES[T.forma].marcha) * dt;
    if (P.cansa) for (const q of c.lineas) q.fatiga = Math.min(1, q.fatiga + P.cansa * TROPAS[q.tipo].cansa * dt + (q === l ? 0 : DESCANSO * dt));   // el escudo en alto cansa a las tres líneas, no solo a la primera
    if (c.flanqueado) c.moral -= 0.028 * dt;
  }
  s.dist = Math.max(0, s.c[0].z + s.c[1].z);
  for (const c of s.c) tirar(B, s, c, dt);
  if (s.c[0].roto || s.c[1].roto) return;
  /* la descarga antes de chocar: pila y jabalinas pesadas. Dentro del testudo no se puede lanzar */
  for (const c of s.c) {
    const T = TROPAS[frente(c).tipo], A = ARMAS[T.arroja]; if (!A || c.pila || s.dist > A.alcance) continue; c.pila = true;
    if (c.postura === 'testudo') continue;
    const o = s.c[1 - c.lado], l = frente(o), P = TROPAS[l.tipo].cubre ? postura(o) : POSTURAS.avanzar, n = A.salva * frente(c).hombres * TROPAS[l.tipo].blanco * (P.recibe < 1 ? 0.45 : 1);
    bajas(o, n); o.moral -= n / o.inicial * 1.5; o.frenada = 5; B.porTiro[o.lado] += n; B.porTiroLinea[o.lado] += n;
    ev(B, 'pila', s.i, c.lado === 0 ? 'Tus ' + T.n + ' arrojan los pila' : May(T.uno) + ' arrojan sus jabalinas', { lado: c.lado, arma: T.arroja });
  }
  if (s.dist <= CONTACTO) chocar(B, s);
}

function chocar(B, s) {
  const r = s.c[0], e = s.c[1], primero = B.fase === 'lejos'; s.dist = 0; s.tChoque = B.t; B.fase = 'lucha';
  for (const c of s.c) if (c.tir && c.tir.estado !== 'fuera') { c.tir.estado = 'fuera'; c.tir.av = 0; c.tir.blanco = null; }
  ev(B, 'choque', s.i, primero ? 'Las líneas chocan ' + DONDE[s.i] : 'Chocan ' + DONDE[s.i]);
  if (r.postura === 'testudo') { r.golpe = 14; r.deshecho = true; r.cambio = 0; r.moral -= 0.3; ev(B, 'testudo-roto', s.i, 'El choque deshace tu testudo ' + DONDE[s.i]); }
  if (r.postura === 'avanzar') { r.postura = 'empujar'; r.impulso = 5; } else r.postura = 'aguantar';
  e.tPost = 0; e.postura = (TROPAS[frente(e).tipo].genio === 'furia') ? 'empujar' : 'aguantar';
  if (e.postura === 'empujar') { e.impulso = 5; ev(B, 'carga-enemiga', s.i, May(TROPAS[frente(e).tipo].uno) + ' cargan ' + DONDE[s.i]); }
  if (primero) B.num.proxima = B.t + 28 + B.rnd() * 8;
}

export function paso(B, dt) {
  if (B.fase === 'fin') return;
  B.t += dt; B.dt = dt;
  if (!B.fijo) B.animo += Math.max(-MANDO.vuelve * dt, Math.min(MANDO.vuelve * dt, 0.5 - B.animo));      // el ánimo vuelve poco a poco a su sitio: hay que seguir mandando bien
  flancos(B);

  for (const s of B.sect) {
    const r = s.c[0], e = s.c[1];
    for (const c of s.c) { if (c.relevo <= 0 && c.empuje > 0) c.empuje = Math.max(0, c.empuje - dt); for (const q of ['relevo', 'golpe', 'impulso', 'frenada']) if (c[q] > 0) c[q] = Math.max(0, c[q] - dt); if (!(c.golpe > 0)) c.golpePor = ''; for (let k = 1; k < c.lineas.length; k++) c.lineas[k].fatiga = Math.max(0, c.lineas[k].fatiga - DESCANSO * dt); }
    if (r.roto && e.roto) continue;
    if (r.roto || e.roto) {                                           // el vencedor se vuelve contra el flanco del vecino
      const v = r.roto ? e : r; if (v.libre > 0) { v.libre -= dt; if (v.libre <= 0) { const o = vecino(B, s.i, 1 - v.lado); if (o) { const w = o.c[1 - v.lado]; if (!w.flanqueado) { w.flanqueado = true; ev(B, 'envuelve', o.i, v.lado === 0 ? 'Tus hombres envuelven ' + (o.i === 1 ? 'el centro enemigo' : 'el ala enemiga') : 'El enemigo te envuelve ' + DONDE[o.i], { lado: v.lado }); } } } }
      frente(v).fatiga = Math.max(0, frente(v).fatiga - DESCANSO * dt); continue;
    }
    if (lejos(s)) { acercar(B, s, dt); continue; }
    mente(B, s, dt);
    const fr = fuerza(r, e) * (1 + MANDO.fuerza * (B.animo - 0.5)), fe = fuerza(e, r), ruido = 0.9 + 0.2 * B.rnd();
    for (const [c, f, rival] of [[r, fe, e], [e, fr, r]]) {
      const l = frente(c), T = TROPAS[l.tipo];
      let d = f * K_BAJAS * B.k * dt * ruido * (T.forma === 'falange' ? FORMACIONES.falange.recibe + (1 - FORMACIONES.falange.recibe) * c.desorden : FORMACIONES[T.forma].recibe) * (c.postura === 'aguantar' ? (T.firme ? 0.45 : 0.6) : 1) * agravante(c) * (c.golpe > 0 && !c.golpePor ? 1.4 : 1);
      if (c.postura === 'empujar' && rival.postura === 'aguantar') d *= 1.12; if (c.postura === 'empujar' && rival.postura === 'empujar') d *= 1.2;      // quien se lanza contra un muro de escudos paga más
      const total = c.inicial, fl = c.flanco, F = FORMACIONES[T.forma], kc = fl.cubre ? 0.4 : 1, pesa = Math.max(0.3, Math.min(1.2, hombres(rival) / Math.max(1, hombres(c))));   // un puñado de hombres en tu costado asusta menos
      c.moral -= (d / total * 1.2 + GOLPE.costado.moral * fl.costado * F.flanco * kc * pesa * dt + GOLPE.espalda.moral * fl.espalda * F.flanco * kc * pesa * dt + (f > fuerza(c, rival) ? 0.013 * (f - fuerza(c, rival)) * dt : 0) + (l.fatiga > 0.85 ? 0.006 * dt : 0)) * c.ff.moral;
      if (c.postura === 'aguantar' && !fl.costado && !fl.espalda) c.moral += 0.004 * dt;
      c.desorden = Math.max(0, Math.min(1, c.desorden + ((c.postura === 'empujar' ? 0.03 : -0.05) + 0.07 * (fl.costado + fl.espalda) * kc) * dt));   // el orden de las filas se abre al avanzar y con peligro de lado; se rehace a pie firme
      l.fatiga = Math.max(0, Math.min(1, l.fatiga + (c.postura === 'empujar' ? BASE_FATIGA * T.cansa : -BASE_FATIGA * 0.22) * dt));
      const cayo = bajas(c, d);
      if (cayo && c.lado === 0) { ev(B, 'linea-deshecha', s.i, 'Línea deshecha: entran ' + TROPAS[frente(c).tipo].uno); mando(B, s.i, false, 'Línea deshecha sin relevo ' + DONDE[s.i], MANDO.deshecha); }
      if (c.lado === 0) c.moral += MANDO.moral * (B.animo - 0.5) * dt;      // el ánimo de la legión sostiene o hunde a cada cuerpo
      c.moral = Math.min(1, c.moral);
    }
    s.frente = Math.max(-1, Math.min(1, s.frente + (fr - fe) * 0.045 * dt));
    if (Math.abs(s.frente) >= 1) (s.frente > 0 ? e : r).moral -= 0.02 * dt;      // sin sitio para ceder más
    for (const c of s.c) { const l = frente(c); if (c.moral <= 0 || (c.lineas.length === 1 && l.hombres < 0.15 * l.max)) romper(B, s, c.lado); }
    if (!r.roto && !r.avisado && frente(r).fatiga > 0.8 && r.lineas.length > 1 && r.relevo <= 0) { r.avisado = B.t; ev(B, 'cansados', s.i, 'Tus ' + TROPAS[frente(r).tipo].n + ' están agotados ' + DONDE[s.i]); }
    if (r.avisado && (frente(r).fatiga < 0.6)) r.avisado = 0;
  }

  /* Caballería romana: va, golpea (a los tiradores si siguen delante, al flanco si no, o espanta a los jinetes rivales) y vuelve a rehacerse */
  const cab = B.cab, num = B.num;
  if (cab.estado !== 'lista') {
    cab.t -= dt;
    if (cab.t <= 0) {
      if (cab.estado === 'yendo') {
        const s = B.sect[cab.sect], e = s.c[1], t = tirando(e);
        if ((num.estado === 'hostiga' || num.estado === 'llega') && num.sect === cab.sect) { num.estado = 'lejos'; num.proxima = B.t + 34 + B.rnd() * 10; ev(B, 'numidas-fuera', cab.sect, 'Tus jinetes espantan a ' + TROPAS[num.tipo].uno); }
        else if (t) { t.hombres *= 1 - 0.55 * cab.mitad; t.estado = 'fuera'; t.huido = true; t.blanco = null; e.moral -= 0.06 * cab.mitad; ev(B, 'impacto', cab.sect, 'Tus jinetes barren a ' + TROPAS[t.tipo].uno, { a: 'tir' }); }
        else if (!e.roto) { e.moral -= 0.2 * cab.mitad; bajas(e, 22 * B.k * cab.mitad); e.golpe = 6; e.golpePor = 'costado'; ev(B, 'impacto', cab.sect, 'Carga en el flanco enemigo'); if (e.moral <= 0) romper(B, s, 1); }
        cab.estado = 'cargando'; cab.t = 4;
      } else if (cab.estado === 'cargando') { cab.estado = 'volviendo'; cab.t = T_CABALLERIA - 7; }
      else { cab.estado = 'lista'; cab.sect = -1; ev(B, 'caballeria-lista', -1, 'Jinetes listos'); }
    }
  }
  /* Jinetes rivales: avisan, rodean un ala y la hostigan hasta que alguien los eche o se cansen. Solo cuando ya se lucha */
  if (num.estado === 'lejos' && B.t >= num.proxima && num.veces < 3) {
    const alas = [0, 2].filter(i => !B.sect[i].c[0].roto);
    if (alas.length) { alas.sort((a, b) => B.sect[a].c[0].moral - B.sect[b].c[0].moral); num.sect = B.rnd() < 0.7 ? alas[0] : alas[alas.length - 1]; num.estado = 'llega'; num.t = (5 + B.lejos) * ((B.plan.caballeria === 'izquierda' && num.sect === 0) || (B.plan.caballeria === 'derecha' && num.sect === 2) ? 2 : 1); num.veces++; ev(B, 'numidas-aviso', num.sect, '¡' + May(TROPAS[num.tipo].n) + ' ' + DONDE[num.sect] + '!'); }
    else num.proxima = B.t + 20;
  } else if (num.estado === 'llega') { num.t -= dt; if (num.t <= 0) { num.estado = 'hostiga'; num.t = 15; } }
  else if (num.estado === 'hostiga') {
    num.t -= dt; const s = B.sect[num.sect], r = s.c[0];
    if (!r.roto) { const m = (frente(r).tipo === 'triarii' && r.postura === 'aguantar') || r.postura === 'escudos' || r.postura === 'testudo' ? 0.35 : 1; r.moral -= 0.024 * m * dt; bajas(r, 1.3 * B.k * m * dt); if (r.moral <= 0) romper(B, s, 0); }
    if (num.t <= 0 || r.roto) { num.estado = 'lejos'; num.proxima = B.t + 30 + B.rnd() * 10; if (!r.roto) ev(B, 'numidas-fuera', num.sect, May(TROPAS[num.tipo].uno) + ' se alejan'); }
  }

  const rotos = [0, 1].map(l => B.sect.filter(s => s.c[l].roto).length);
  if (rotos[1] >= 2) fin(B, 'victoria'); else if (rotos[0] >= 2) fin(B, 'derrota');
  else if (B.t > 340) fin(B, hombresLado(B, 0) / inicialLado(B, 0) > hombresLado(B, 1) / inicialLado(B, 1) ? 'victoria' : 'derrota', 'Cae la tarde y los ejércitos se separan');
}

export function fin(B, como, motivo) {
  if (B.fase === 'fin') return;
  B.fase = 'fin';
  const cuales = l => B.sect.filter(s => s.c[l].roto).map(s => ['ala izquierda', 'centro', 'ala derecha'][s.i]).join(' y ');
  if (!motivo) motivo = como === 'victoria' ? 'Rompiste su ' + cuales(1) + ': el resto huye.' : como === 'derrota' ? 'Cedieron tu ' + cuales(0) + ': la legión se deshace.' : 'Sacas a la legión en orden. El campo queda para el enemigo.';
  B.resultado = { como, motivo, t: B.t, bajas: [inicialLado(B, 0) - Math.round(hombresLado(B, 0)), inicialLado(B, 1) - Math.round(hombresLado(B, 1))], inicial: [inicialLado(B, 0), inicialLado(B, 1)], ordenes: B.ordenes, animo: B.animo, mando: { bien: B.mando.bien, mal: B.mando.mal } };
  ev(B, 'fin', -1, '');
}
export const retirarse = B => fin(B, 'retirada');
