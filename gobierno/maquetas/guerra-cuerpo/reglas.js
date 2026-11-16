/* Maqueta GM2 «guerra cuerpo a cuerpo» — REGLAS. Sin pantalla: corre igual en Node (prueba.mjs) y en el navegador.
   Parte de GC1 (guerra-cero/reglas.js): tres pulsos (ala izquierda, centro, ala derecha) y cuatro órdenes
   (empujar, aguantar, relevo, caballería). Lo nuevo:
   1) COMBATE EN VIVO: los dos bandos se acercan, se tiran y chocan a la vez. Cada tropa tiene su arma (alcance, carga)
      y su formación (falange, manípulos, tropel, línea cerrada, línea de tiro, tropa ligera, hilera de elefantes).
   2) FLANCOS Y RETAGUARDIA: cada cuerpo sabe si le pegan de frente, por el costado o por la espalda. Costado y espalda
      pegan más y hunden antes el ánimo; cuánto, depende de la formación. El enemigo también lo busca.
   El estado son datos sencillos (el azar es un número guardado en B.s): se puede guardar a medias. */

export const NOMBRE_SECTOR = ['Ala izquierda', 'Centro', 'Ala derecha'];
export const DONDE = ['por la izquierda', 'en el centro', 'por la derecha'];

/* ARMAS. alcance en metros · tiro = bajas por tirador y segundo a pecho descubierto · frena = clavada en tierra, para una carga */
export const ARMAS = {
  espada:   { n: 'espada',   alcance: 0,   tiro: 0 },
  lanza:    { n: 'lanza',    alcance: 0,   tiro: 0, frena: true },
  jabalina: { n: 'jabalina', alcance: 30,  tiro: 0.034 },
  arco:     { n: 'arco',     alcance: 120, tiro: 0.011 },
  elefante: { n: 'elefante', alcance: 0,   tiro: 0 },
};

/* FORMACIONES. filas y paso (metros por hombre) son para dibujar · marcha en m/s de juego · frente = cuánto pega de frente
   recibe = cuánto daño encaja de frente · flanco = cuánto se agrava un golpe de costado o de espalda
   cubre = una línea de reserva puede volverse a tapar el costado · delante = pelea delante y se retira al chocar */
export const FORMACIONES = {
  falange:   { n: 'falange',             filas: 16, paso: 0.9, marcha: 3.5, frente: 1.5,  recibe: 0.55, flanco: 1.9 },
  manipulos: { n: 'manípulos',           filas: 6,  paso: 1.8, marcha: 5,   frente: 1,    recibe: 1,    flanco: 1, cubre: true },
  cerrada:   { n: 'línea cerrada',       filas: 8,  paso: 1.0, marcha: 4.5, frente: 1,    recibe: 0.92, flanco: 1.35 },
  tropel:    { n: 'tropel',              filas: 8,  paso: 1.3, marcha: 6,   frente: 1,    recibe: 1,    flanco: 1.25 },
  tiro:      { n: 'línea de tiro',       filas: 2,  paso: 1.5, marcha: 4,   frente: 0.3,  recibe: 1.7,  flanco: 1.4, delante: true },
  ligera:    { n: 'tropa ligera',        filas: 3,  paso: 2.5, marcha: 6.5, frente: 0.5,  recibe: 1.3,  flanco: 1.1, delante: true },
  hilera:    { n: 'hilera de elefantes', filas: 1,  paso: 0.5, marcha: 6.5, frente: 1,    recibe: 0.8,   flanco: 1.2, delante: true },
};

/* TROPAS. cal = calidad en el choque · cansa = cuánto se fatiga al empujar · carga = golpe del primer choque
   coraza = parte de los proyectiles que para · pilum = arroja una salva al chocar · mun = segundos de tiro que lleva
   genio = cómo decide sola (furia, firme, alterno, muro, tira) */
export const TROPAS = {
  velites:    { n: 'vélites',    uno: 'los vélites',    arma: 'jabalina', forma: 'ligera',    cal: 0.55, cansa: 1.00, carga: 0.10, coraza: 0.25, hombres: 60,  mun: 16, genio: 'tira' },
  hastati:    { n: 'hastati',    uno: 'los hastati',    arma: 'espada',   forma: 'manipulos', cal: 1.00, cansa: 1.00, carga: 0.40, coraza: 0.55, hombres: 120, pilum: true, genio: 'alterno' },
  principes:  { n: 'príncipes',  uno: 'los príncipes',  arma: 'espada',   forma: 'manipulos', cal: 1.14, cansa: 0.90, carga: 0.40, coraza: 0.60, hombres: 120, pilum: true, genio: 'alterno' },
  triarii:    { n: 'triarios',   uno: 'los triarios',   arma: 'lanza',    forma: 'manipulos', cal: 1.12, cansa: 0.80, carga: 0.20, coraza: 0.65, hombres: 60,  genio: 'firme' },
  galos:      { n: 'galos',      uno: 'los galos',      arma: 'espada',   forma: 'tropel',    cal: 1.40, cansa: 1.75, carga: 0.90, coraza: 0.25, hombres: 270, genio: 'furia' },
  iberos:     { n: 'iberos',     uno: 'los iberos',     arma: 'espada',   forma: 'tropel',    cal: 1.16, cansa: 1.05, carga: 0.55, coraza: 0.40, hombres: 270, pilum: true, genio: 'alterno' },
  libios:     { n: 'libios',     uno: 'los libios',     arma: 'lanza',    forma: 'cerrada',   cal: 1.26, cansa: 0.72, carga: 0.30, coraza: 0.60, hombres: 300, genio: 'firme' },
  tarentinos: { n: 'tarentinos', uno: 'los tarentinos', arma: 'lanza',    forma: 'cerrada',   cal: 1.02, cansa: 0.95, carga: 0.30, coraza: 0.55, hombres: 260, genio: 'alterno' },
  falange:    { n: 'falange',    uno: 'la falange',     arma: 'lanza',    forma: 'falange',   cal: 1.05, cansa: 0.85, carga: 0.30, coraza: 0.65, hombres: 300, genio: 'muro' },
  arqueros:   { n: 'arqueros',   uno: 'los arqueros',   arma: 'arco',     forma: 'tiro',      cal: 0.45, cansa: 1.00, carga: 0.00, coraza: 0.10, hombres: 80,  mun: 40, genio: 'tira' },
  elefantes:  { n: 'elefantes',  uno: 'los elefantes',  arma: 'elefante', forma: 'hilera',    cal: 1.60, cansa: 2.40, carga: 1.60, coraza: 0.45, hombres: 150, cadaFigura: 15, genio: 'furia' },
};
export const arma = t => ARMAS[TROPAS[t].arma], forma = t => FORMACIONES[TROPAS[t].forma];

/* RIVALES. Tres cuerpos (de su izquierda a su derecha vistos desde Roma) y su caballería */
export const ROMA = [['velites', 'hastati', 'principes', 'triarii'], ['velites', 'hastati', 'principes', 'triarii'], ['velites', 'hastati', 'principes', 'triarii']];
export const RIVALES = {
  pirro:   { n: 'Pirro de Epiro', jinetes: 'tesalios', cuerpos: [['arqueros', 'tarentinos'], ['falange'], ['elefantes', 'falange']] },
  cartago: { n: 'Cartago',        jinetes: 'númidas',  cuerpos: [['galos'], ['elefantes', 'libios'], ['iberos']] },
};

export const DIST0 = 140;          // metros entre las dos líneas al empezar
const CONTACTO = 3;                // a esta distancia ya se lucha cuerpo a cuerpo
const T_RELEVO = 3.2, T_CABALLERIA = 24, BASE_FATIGA = 1 / 42, DESCANSO = 1 / 120, K_BAJAS = 1.25;
const CEDE = 0.5;                  // un cuerpo que ha cedido tanto terreno descubre el costado de su vecino
export const GOLPE = { costado: { dano: 0.5, moral: 0.02 }, espalda: { dano: 0.9, moral: 0.035 } };

function rnd(B) { B.s = (B.s * 1664525 + 1013904223) >>> 0; return B.s / 4294967296; }

function cuerpo(lado, i, lineas) {
  const c = { lado, i, lineas: lineas.map(l => { const t = typeof l === 'string' ? l : l.tipo, h = typeof l === 'string' ? TROPAS[t].hombres : l.hombres; return { tipo: t, hombres: h, max: h, fatiga: 0, mun: TROPAS[t].mun || 0, tras: false }; }),
    postura: 'aguantar', moral: 1, roto: false, relevo: 0, libre: 0, tPost: 0, desorden: 0,
    envuelto: false, golpe: 0, golpePor: '', acoso: 0, flanco: { costado: 0, espalda: 0, cubre: false }, tiraT: 0 };
  c.inicial = c.lineas.reduce((a, l) => a + l.hombres, 0);
  return c;
}

/* nueva(semilla, opciones). opciones.rival: 'pirro' | 'cartago' · opciones.ejercitos: [cuerposRoma, cuerposRival] (cada línea, un
   tipo o {tipo, hombres}) · opciones.auto: [bool, bool] quién decide solo · opciones.sinJinetes: duelo limpio, sin caballería */
export function nueva(semilla, op) {
  op = op || {}; const riv = RIVALES[op.rival || 'pirro'], ej = op.ejercitos || [ROMA, riv.cuerpos];
  const B = { t: 0, fase: 'marcha', s: (semilla >>> 0) || 7, sect: [], eventos: [], resultado: null, ordenes: 0, rival: op.rival || 'pirro', jinetes: riv.jinetes,
    auto: op.auto || [false, true], sinJinetes: !!op.sinJinetes,
    cab: { estado: 'lista', sect: -1, t: 0, por: '' },
    num: { estado: 'lejos', sect: -1, t: 0, veces: 0, proxima: 0 } };
  for (let i = 0; i < ej[0].length; i++) B.sect.push({ i, frente: 0, dist: DIST0, c: [cuerpo(0, i, ej[0][i]), cuerpo(1, i, ej[1][i])] });
  B.num.proxima = 36 + rnd(B) * 8;
  for (const s of B.sect) { s.c[1].postura = 'empujar'; if (B.auto[0]) s.c[0].postura = 'empujar'; }
  return B;
}

export const frente = c => c.lineas[0];
export const hombres = c => c.lineas.reduce((a, l) => a + l.hombres, 0);
export const hombresLado = (B, lado) => B.sect.reduce((a, s) => a + hombres(s.c[lado]), 0);
export const inicialLado = (B, lado) => B.sect.reduce((a, s) => a + s.c[lado].inicial, 0);
const reserva = c => c.lineas.slice(1).filter(l => !l.tras && l.hombres > 0);
const Uno = t => TROPAS[t].uno.replace(/^l/, 'L');

function ev(B, tipo, sect, texto, mas) { B.eventos.push(Object.assign({ tipo, sect, texto, t: B.t }, mas || {})); }

/* Con qué fuerza pega un cuerpo DE FRENTE a su rival. Aquí entran el arma y la formación. */
export function fuerza(c, rival) {
  const l = frente(c), T = TROPAS[l.tipo], F = FORMACIONES[T.forma];
  const fondo = Math.max(0.3, Math.min(1, l.hombres / (0.4 * l.max)));
  let f = T.cal * fondo * (1 - 0.55 * l.fatiga) * (c.postura === 'empujar' ? 1.25 : 0.8) * (c.relevo > 0 ? 0.7 : 1) * (0.7 + 0.3 * c.moral);
  f *= T.forma === 'falange' ? 1 + (F.frente - 1) * (1 - c.desorden) : F.frente;                        // la falange vale lo que vale su orden
  f *= 1 - 0.15 * c.flanco.costado - 0.25 * c.flanco.espalda;                                           // quien se vuelve a mirar atrás no pega delante
  if (rival) {
    const R = TROPAS[frente(rival).tipo];
    f *= Math.max(0.75, Math.min(1.3, Math.pow(hombres(c) / Math.max(1, hombres(rival)), 0.3)));        // el número pesa, sin mandar
    if (T.arma === 'espada' && R.forma === 'falange') f *= 0.8 + 0.9 * rival.desorden;                 // la espada no entra en las picas… hasta que se abren
    if (T.arma === 'elefante' && R.arma === 'lanza' && rival.postura === 'aguantar') f *= 0.6;         // lanzas clavadas
    if (T.arma === 'elefante' && R.forma === 'ligera') f *= 0.5;                                        // no hay a quién pisar
  }
  return f;
}

/* Cuánto agrava el daño lo que le llega por el costado y la espalda (1 = nada) */
export function agravante(c) { const k = c.flanco.cubre ? 0.4 : 1, fl = forma(frente(c).tipo).flanco; return 1 + (GOLPE.costado.dano * c.flanco.costado + GOLPE.espalda.dano * c.flanco.espalda) * fl * k; }

/* Qué ganaría la caballería si carga ahora ese sector: 'espalda' si el enemigo está volcado hacia delante o ya cogido de costado */
export function ocasion(B, i) {
  const e = B.sect[i].c[1]; if (e.roto) return '';
  if ((B.num.estado === 'hostiga' || B.num.estado === 'llega') && B.num.sect === i) return 'jinetes';
  return B.sect[i].dist <= CONTACTO && (e.postura === 'empujar' || e.flanco.costado > 0) ? 'espalda' : 'costado';
}

export function puede(B, i, orden) {
  const c = B.sect[i].c[0];
  if (B.fase === 'fin') return 'La batalla ha terminado';
  if (orden === 'caballeria') {
    if (B.sinJinetes) return 'No hay jinetes';
    if (B.cab.estado !== 'lista') return 'Los jinetes se están rehaciendo';
    if (B.sect[i].c[1].roto) return 'Ahí ya no queda enemigo';
    return '';
  }
  if (c.roto) return 'Ese cuerpo ha huido';
  if (orden === 'relevo') { if (!reserva(c).length) return 'No queda línea de refresco'; if (c.relevo > 0) return 'El relevo ya está en marcha'; return ''; }
  if (orden === 'empujar' || orden === 'aguantar') return c.postura === orden ? 'Ya lo están haciendo' : '';
  return 'Orden desconocida';
}

function relevar(c) { const l = c.lineas.shift(); if (forma(l.tipo).delante) l.tras = true; c.lineas.push(l); while (frente(c).tras && reserva(c).length) c.lineas.push(c.lineas.shift()); c.relevo = T_RELEVO; }

export function ordenar(B, i, orden) {
  const no = puede(B, i, orden); if (no) return no;
  const s = B.sect[i], c = s.c[0]; B.ordenes++;
  if (orden === 'empujar' || orden === 'aguantar') { c.postura = orden; ev(B, 'orden', i, orden === 'empujar' ? (s.dist > CONTACTO ? '¡A paso ligero!' : '¡Adelante!') : (s.dist > CONTACTO ? 'Alto: escudos arriba' : 'Escudos juntos'), { orden }); }
  else if (orden === 'relevo') { relevar(c); c.moral = Math.min(1, c.moral + 0.1); ev(B, 'relevo', i, 'Entran ' + TROPAS[frente(c).tipo].uno, { orden }); }
  else if (orden === 'caballeria') { const por = ocasion(B, i); B.cab.estado = 'yendo'; B.cab.sect = i; B.cab.t = por === 'espalda' ? 4 : 3; B.cab.por = por; ev(B, 'caballeria', i, por === 'espalda' ? 'Los jinetes rodean ' + DONDE[i] : 'Los jinetes cargan ' + DONDE[i], { orden, por }); }
  return '';
}

function romper(B, s, lado) {
  const c = s.c[lado]; if (c.roto) return; c.roto = true; c.moral = 0;
  const quien = lado === 0 ? 'Tu ' + NOMBRE_SECTOR[s.i].toLowerCase() + ' huye' : Uno(frente(c).tipo) + (TROPAS[frente(c).tipo].uno.startsWith('la ') ? ' se deshace' : ' huyen');
  ev(B, 'roto', s.i, quien, { lado });
  for (const o of B.sect) { if (o === s) continue; if (!o.c[lado].roto) o.c[lado].moral = Math.max(0.02, o.c[lado].moral - 0.13); if (!o.c[1 - lado].roto) o.c[1 - lado].moral = Math.min(1, o.c[1 - lado].moral + 0.1); }
  s.c[1 - lado].libre = 6;
  if (lado === 0 && B.num.estado === 'hostiga' && B.num.sect === s.i) { B.num.estado = 'lejos'; B.num.proxima = B.t + 25; }
}

export function vecino(B, i, ladoRival) {
  const js = [i - 1, i + 1].filter(j => j >= 0 && j < B.sect.length);
  for (const j of js) { const o = B.sect[j]; if (!o.c[ladoRival].roto && !o.c[1 - ladoRival].roto) return o; }
  for (const j of js) { const o = B.sect[j]; if (!o.c[ladoRival].roto) return o; }
  return null;
}

/* Bajas a la línea de delante. Si queda deshecha, se retira sola; los elefantes deshechos se revuelven contra los suyos. */
function bajas(B, s, c, n) {
  const l = frente(c), T = TROPAS[l.tipo]; l.hombres = Math.max(0, l.hombres - n);
  if (T.arma === 'elefante' && l.hombres < 0.5 * l.max && c.lineas.length > 1) {
    c.lineas.shift(); c.relevo = Math.max(c.relevo, 2.5); c.moral -= 0.16; c.desorden = Math.min(1, c.desorden + 0.5); frente(c).hombres *= 0.93;
    ev(B, 'estampida', s.i, 'Los elefantes se revuelven contra los suyos', { lado: c.lado }); return true;
  }
  if (T.arma === 'elefante' && l.hombres < 0.5 * l.max) { c.moral = 0; return false; }                 // sin nadie detrás, huyen sin más
  if (l.hombres < 0.15 * l.max && c.lineas.length > 1) { c.lineas.shift(); c.relevo = Math.max(c.relevo, 1.5); while (frente(c).tras && reserva(c).length) c.lineas.push(c.lineas.shift()); return true; }
  return false;
}

/* Cada cuerpo sin jugador decide solo, según el genio de su tropa, y siempre se le ve venir */
function mente(B, s, lado, dt) {
  const e = s.c[lado], r = s.c[1 - lado], l = frente(e), g = TROPAS[l.tipo].genio; e.tPost += dt; let quiere = e.postura;
  const aprovecha = !r.roto && (r.flanco.costado > 0 || r.flanco.espalda > 0) && !r.flanco.cubre && l.fatiga < 0.7;
  if (s.dist > CONTACTO) quiere = g === 'tira' && l.mun > 0 && arma(l.tipo).alcance >= s.dist ? 'aguantar' : 'empujar';      // se acercan; el tirador se planta a tirar
  else if (aprovecha) quiere = 'empujar';
  else if (g === 'furia') quiere = e.postura === 'empujar' ? (l.fatiga > 0.78 ? 'aguantar' : 'empujar') : (l.fatiga < 0.5 || e.tPost > 16 ? 'empujar' : 'aguantar');
  else if (g === 'firme') quiere = e.postura === 'empujar' ? (e.tPost > 15 || l.fatiga > 0.85 ? 'aguantar' : 'empujar') : ((e.tPost > 9 && l.fatiga < 0.7) || (!r.roto && frente(r).fatiga > 0.6 && e.tPost > 4) ? 'empujar' : 'aguantar');
  else if (g === 'muro') quiere = e.postura === 'empujar' ? (e.desorden > 0.55 || l.fatiga > 0.85 ? 'aguantar' : 'empujar') : (e.desorden < 0.2 && l.fatiga < 0.7 ? 'empujar' : 'aguantar');   // avanza hasta que se le abren las filas y se rehace
  else if (g === 'tira') quiere = 'aguantar';
  else quiere = e.postura === 'empujar' ? (e.tPost > 11 || l.fatiga > 0.8 ? 'aguantar' : 'empujar') : (e.tPost > 8 && l.fatiga < 0.65 ? 'empujar' : 'aguantar');
  if (quiere !== e.postura && (e.tPost > 3 || s.dist > CONTACTO)) {
    e.postura = quiere; e.tPost = 0;
    if (lado === 1 && !r.roto && s.dist <= CONTACTO) ev(B, quiere === 'empujar' ? 'carga-enemiga' : 'enemigo-cede', s.i, Uno(l.tipo) + (quiere === 'empujar' ? (TROPAS[l.tipo].uno.startsWith('la ') ? ' carga ' : ' cargan ') : (TROPAS[l.tipo].uno.startsWith('la ') ? ' flaquea ' : ' flaquean ')) + DONDE[s.i]);
  }
  if (B.auto[lado] && lado === 0 && s.dist <= CONTACTO && e.relevo <= 0) { const sig = reserva(e)[0]; if (sig && sig.fatiga < 0.4 && (l.fatiga > 0.72 || l.hombres < 0.4 * l.max)) relevar(e); }
}

/* ACERCAMIENTO EN VIVO: marchan, se tiran y, al llegar, chocan */
function acercar(B, s, dt) {
  const [r, e] = s.c; let v = 0;
  for (const c of s.c) { const F = forma(frente(c).tipo); v += c.relevo > 0 ? 0 : c.postura === 'empujar' ? F.marcha * 1.5 : 0; }
  const ligero = s.c.some((c, k) => { const l = frente(c); return forma(l.tipo).delante && l.mun > 0 && arma(l.tipo).alcance >= s.dist && !forma(frente(s.c[1 - k]).tipo).delante; });
  if (ligero) v *= 0.45;                                               // la tropa ligera cede terreno mientras tira
  if (v === 0 && B.t > 20) v = 2;
  let tope = CONTACTO;
  s.c.forEach((c, k) => { const l = frente(c), o = frente(s.c[1 - k]); if (TROPAS[l.tipo].forma === 'ligera' && !reserva(c).length && l.fatiga < 0.9 && forma(o.tipo).marcha * 1.5 < forma(l.tipo).marcha) { tope = 14; l.fatiga = Math.min(1, l.fatiga + 0.002 * dt); } });                                      // nadie se queda mirando toda la tarde
  const antes = s.dist; s.dist = Math.max(Math.min(tope, s.dist), s.dist - v * dt);
  for (const c of s.c) { const l = frente(c); if (c.postura === 'empujar' && s.dist < antes) l.fatiga = Math.min(1, l.fatiga + 0.004 * dt); }
  tirar(B, s, dt);
  /* la tropa de delante (vélites, arqueros) se mete por los huecos antes del choque */
  for (const c of s.c) { const l = frente(c), F = forma(l.tipo); if (F.delante && TROPAS[l.tipo].arma !== 'elefante' && s.dist <= 9 && reserva(c).length) { relevar(c); c.relevo = 1.2; ev(B, 'se-retiran', s.i, Uno(l.tipo) + ' se retiran por los huecos', { lado: c.lado }); } }
  if (s.dist <= CONTACTO) chocar(B, s);
}

/* Proyectiles: tira la línea de delante si alcanza, y los arqueros ya retirados por encima de los suyos */
function tirar(B, s, dt) {
  for (const c of s.c) {
    const rival = s.c[1 - c.lado]; if (c.roto || rival.roto || c.relevo > 0) continue; let salva = '';
    c.lineas.forEach((l, k) => {
      const A = arma(l.tipo); if (!A.tiro || l.mun <= 0 || l.hombres <= 0 || A.alcance < s.dist) return;
      if (k > 0 && !(l.tras && (TROPAS[l.tipo].arma === 'arco' || TROPAS[frente(rival).tipo].arma === 'elefante'))) return;      // los vélites retirados siguen acribillando a las bestias
      const lr = frente(rival), R = TROPAS[lr.tipo]; l.mun -= dt;
      let d = l.hombres * A.tiro * dt * (1 - R.coraza) * (k > 0 ? 0.4 : 1) * (rival.postura === 'aguantar' ? 0.55 : 1) * (0.85 + 0.3 * rnd(B));
      if (R.arma === 'elefante') d *= TROPAS[l.tipo].arma === 'jabalina' ? 4.5 : 2.2;      // la bestia herida no obedece
      if (R.forma === 'ligera') d *= 0.6;                                                    // en orden abierto se esquiva
      rival.moral -= d / rival.inicial * 1.6; salva = TROPAS[l.tipo].arma;
      bajas(B, s, rival, d);
    });
    c.tiraT -= dt; if (salva && c.tiraT <= 0) { c.tiraT = salva === 'arco' ? 2.4 : 1.8; ev(B, 'salva', s.i, '', { lado: c.lado, arma: salva }); }
  }
}

/* El primer choque: pila, carga y lo que la para */
function chocar(B, s) {
  const golpe = [0, 0];
  for (const c of s.c) {
    const rival = s.c[1 - c.lado], l = frente(c), T = TROPAS[l.tipo], lr = frente(rival), R = TROPAS[lr.tipo];
    if (T.pilum) { golpe[1 - c.lado] += l.hombres * 0.07 * (1 - R.coraza); rival.cargaRota = true; ev(B, 'pila', s.i, '', { lado: c.lado }); }
    let k = T.carga * (c.postura === 'empujar' ? 1 : 0.4) * (c.cargaRota ? 0.7 : 1);
    if (ARMAS[R.arma].frena && rival.postura === 'aguantar') k *= 0.35;                                  // lanzas clavadas
    if (R.forma === 'falange') k *= 0.5;                                                                 // nadie carga contra un erizo
    if (T.arma === 'elefante' && R.forma === 'manipulos' && rival.postura === 'aguantar') { k *= 0.3; ev(B, 'calles', s.i, c.lado === 1 ? 'Abres calles: los elefantes pasan de largo' : 'Abren calles a tus elefantes', { lado: rival.lado }); }
    golpe[1 - c.lado] += k * 26; rival.moral -= k * 0.11; if (T.arma === 'elefante') rival.desorden = Math.min(1, rival.desorden + 0.35 * k);
  }
  for (const c of s.c) { delete c.cargaRota; bajas(B, s, c, golpe[c.lado]); c.tPost = 0; }
  if (!B.chocado) { B.chocado = true; B.fase = 'lucha'; ev(B, 'choque', s.i, 'Las líneas chocan'); }
}

/* De dónde le llega el peligro a cada cuerpo. Se recalcula a cada paso y avisa cuando cambia. */
function flancos(B) {
  for (const s of B.sect) for (const c of s.c) {
    const fl = c.flanco, antes = fl.espalda > 0 ? 'espalda' : fl.costado > 0 ? 'costado' : ''; let costado = 0, espalda = 0, causa = '';
    if (!c.roto) {
      if (c.envuelto) { costado = 1; causa = 'envuelto'; }
      /* el vecino amigo ha cedido mucho terreno: por ese hueco entra el enemigo */
      let hueco = false;
      for (const j of [s.i - 1, s.i + 1]) {
        const o = B.sect[j]; if (!o || o.c[1 - c.lado].roto || o.c[c.lado].roto || o.dist > CONTACTO || s.dist > CONTACTO) continue;
        const sg = c.lado === 0 ? -1 : 1, cedido = sg * o.frente, mas = sg * (o.frente - s.frente), u = c.hueco ? 0.12 : 0;      // u: para que el aviso no parpadee
        if (cedido > CEDE - u && mas > 0.35 - u) hueco = true;
      }
      c.hueco = hueco; if (hueco) { costado = 1; causa = causa || 'hueco'; }
      if (c.golpe > 0) { if (c.golpePor === 'espalda') espalda = 1; else costado = 1; causa = 'jinetes'; }
      if (c.acoso > 0) { espalda = Math.max(espalda, 0.6); causa = 'jinetes'; }
    }
    const T = TROPAS[frente(c).tipo];
    fl.costado = costado; fl.espalda = espalda; fl.causa = causa;
    fl.cubre = (costado > 0 || espalda > 0) && !!FORMACIONES[T.forma].cubre && c.postura === 'aguantar' && reserva(c).length > 0;   // la reserva se vuelve
    const ahora = espalda > 0 ? 'espalda' : costado > 0 ? 'costado' : '';
    if (ahora && ahora !== antes && causa !== 'jinetes' && causa !== 'envuelto') ev(B, 'flanco', s.i, c.lado === 0 ? '¡Te entran por el costado ' + DONDE[s.i] + '!' : 'Costado enemigo al aire ' + DONDE[s.i], { lado: c.lado, por: ahora, causa });
    if (ahora && !antes && fl.cubre && c.lado === 0) ev(B, 'cubre', s.i, 'Tu reserva se vuelve y cubre ' + (ahora === 'espalda' ? 'la espalda' : 'el costado'), { lado: 0 });
  }
}

export function paso(B, dt) {
  if (B.fase === 'fin') return;
  B.t += dt;
  flancos(B);
  for (const s of B.sect) {
    const r = s.c[0], e = s.c[1];
    for (const c of s.c) { if (c.relevo > 0) c.relevo = Math.max(0, c.relevo - dt); if (c.golpe > 0) c.golpe = Math.max(0, c.golpe - dt); for (let k = 1; k < c.lineas.length; k++) c.lineas[k].fatiga = Math.max(0, c.lineas[k].fatiga - DESCANSO * dt); }
    if (r.roto && e.roto) continue;
    if (r.roto || e.roto) {                                           // el vencedor se vuelve contra el costado del vecino
      const v = r.roto ? e : r; if (v.libre > 0) { v.libre -= dt; if (v.libre <= 0) { const o = vecino(B, s.i, 1 - v.lado); if (o) { const w = o.c[1 - v.lado]; if (!w.envuelto) { w.envuelto = true; ev(B, 'envuelve', o.i, v.lado === 0 ? 'Tus hombres envuelven ' + (o.i === 1 ? 'el centro enemigo' : 'el ala enemiga') : 'El enemigo te envuelve ' + DONDE[o.i], { lado: 1 - v.lado, por: 'costado' }); } } } }
      frente(v).fatiga = Math.max(0, frente(v).fatiga - DESCANSO * dt); continue;
    }
    for (const lado of [0, 1]) if (B.auto[lado]) mente(B, s, lado, dt);
    if (s.dist > CONTACTO) { acercar(B, s, dt); for (const c of s.c) if (c.moral <= 0) romper(B, s, c.lado); continue; }
    tirar(B, s, dt);                                                   // los arqueros retirados siguen tirando por encima
    const fr = fuerza(r, e), fe = fuerza(e, r), ruido = 0.9 + 0.2 * rnd(B);
    for (const [c, f, rival] of [[r, fe, e], [e, fr, r]]) {
      const l = frente(c), T = TROPAS[l.tipo], F = FORMACIONES[T.forma], fl = c.flanco, k = fl.cubre ? 0.4 : 1;
      let d = f * K_BAJAS * dt * ruido * (c.postura === 'aguantar' ? (ARMAS[T.arma].frena ? 0.45 : 0.6) : 1);
      d *= T.forma === 'falange' ? F.recibe + (1 - F.recibe) * c.desorden : F.recibe;
      d *= agravante(c);
      if (c.postura === 'empujar' && rival.postura === 'aguantar') d *= 1.12; if (c.postura === 'empujar' && rival.postura === 'empujar') d *= 1.2;
      const mio = c === r ? fr : fe;
      const pesa = Math.max(0.3, Math.min(1.2, hombres(rival) / Math.max(1, hombres(c))));              // un puñado de hombres en tu costado asusta menos
      c.moral -= d / c.inicial * 1.2 + (GOLPE.costado.moral * fl.costado + GOLPE.espalda.moral * fl.espalda) * F.flanco * k * pesa * dt + (f > mio ? 0.013 * (f - mio) * dt : 0) + (l.fatiga > 0.85 ? 0.006 * dt : 0);
      if (TROPAS[frente(rival).tipo].arma === 'elefante' && T.forma !== 'ligera' && T.arma !== 'elefante') c.moral -= 0.011 * dt;      // el miedo a las bestias
      if (c.postura === 'aguantar' && !fl.costado && !fl.espalda) c.moral += 0.004 * dt;
      l.fatiga = Math.max(0, Math.min(1, l.fatiga + (c.postura === 'empujar' ? BASE_FATIGA * T.cansa : -BASE_FATIGA * 0.22) * dt));
      /* el orden de las filas: se abre al avanzar y cuando llega peligro de lado; se rehace a pie firme */
      c.desorden = Math.max(0, Math.min(1, c.desorden + ((c.postura === 'empujar' ? 0.03 : -0.05) + 0.07 * (fl.costado + fl.espalda) * k) * dt));
      const cayo = bajas(B, s, c, d);
      if (cayo && c.lado === 0 && !c.roto) ev(B, 'linea-deshecha', s.i, 'Línea deshecha: entran ' + TROPAS[frente(c).tipo].uno);
      c.moral = Math.min(1, c.moral);
    }
    s.frente = Math.max(-1, Math.min(1, s.frente + (fr - fe) * 0.045 * dt));
    if (Math.abs(s.frente) >= 1) (s.frente > 0 ? e : r).moral -= 0.02 * dt;
    for (const c of s.c) { const l = frente(c); if (c.moral <= 0 || (!reserva(c).length && l.hombres < 0.15 * l.max)) romper(B, s, c.lado); }
    if (!r.roto && !r.avisado && frente(r).fatiga > 0.8 && reserva(r).length && r.relevo <= 0) { r.avisado = B.t; ev(B, 'cansados', s.i, 'Tus ' + TROPAS[frente(r).tipo].n + ' están agotados ' + DONDE[s.i]); }
    if (r.avisado && (frente(r).fatiga < 0.6)) r.avisado = 0;
  }
  if (!B.sinJinetes) jinetes(B, dt);

  const rotos = [0, 1].map(l => B.sect.filter(s => s.c[l].roto).length), hacen = Math.ceil(B.sect.length * 2 / 3);
  if (rotos[1] >= hacen) fin(B, 'victoria'); else if (rotos[0] >= hacen) fin(B, 'derrota');
  else if (B.t > 280) fin(B, hombresLado(B, 0) / inicialLado(B, 0) > hombresLado(B, 1) / inicialLado(B, 1) ? 'victoria' : 'derrota', 'Cae la tarde y los ejércitos se separan');
}

/* Caballería de los dos bandos: la tuya carga al costado o rodea hasta la espalda; la suya busca la espalda de un ala */
function jinetes(B, dt) {
  const cab = B.cab, num = B.num, Jin = B.jinetes[0].toUpperCase() + B.jinetes.slice(1);
  if (cab.estado !== 'lista') {
    cab.t -= dt;
    if (cab.t <= 0) {
      if (cab.estado === 'yendo') {
        const s = B.sect[cab.sect], e = s.c[1];
        if ((num.estado === 'hostiga' || num.estado === 'llega') && num.sect === cab.sect) { num.estado = 'lejos'; num.proxima = B.t + 34 + rnd(B) * 10; s.c[0].acoso = 0; ev(B, 'numidas-fuera', cab.sect, 'Tus jinetes espantan a los ' + B.jinetes); }
        else if (!e.roto) {
          const por = cab.por === 'espalda' ? 'espalda' : 'costado', fl = forma(frente(e).tipo).flanco, k = por === 'espalda' ? 1.4 : 1;
          e.moral -= 0.10 * k * (1 + (fl - 1) / 2); bajas(B, s, e, 20 * k); e.golpe = 5; e.golpePor = por; e.desorden = Math.min(1, e.desorden + 0.3 * k);
          ev(B, 'impacto', cab.sect, por === 'espalda' ? '¡Por la espalda! ' + Uno(frente(e).tipo) + ' no pueden volverse' : 'Carga en el costado enemigo', { lado: 1, por });
          if (e.moral <= 0) romper(B, s, 1);
        }
        cab.estado = 'cargando'; cab.t = 4;
      } else if (cab.estado === 'cargando') { cab.estado = 'volviendo'; cab.t = T_CABALLERIA - 7; }
      else { cab.estado = 'lista'; cab.sect = -1; ev(B, 'caballeria-lista', -1, 'Jinetes listos'); }
    }
  }
  if (num.estado === 'lejos' && B.chocado && B.t >= num.proxima && num.veces < 3) {
    /* buscan la espalda del ala más floja, o la del cuerpo que ya tiene el costado al aire */
    const alas = B.sect.filter(s => !s.c[0].roto && (s.i === 0 || s.i === B.sect.length - 1));
    if (alas.length) { alas.sort((a, b) => (a.c[0].moral - 0.3 * a.c[0].flanco.costado) - (b.c[0].moral - 0.3 * b.c[0].flanco.costado)); num.sect = (rnd(B) < 0.7 ? alas[0] : alas[alas.length - 1]).i; num.estado = 'llega'; num.t = 5; num.veces++; ev(B, 'numidas-aviso', num.sect, '¡' + Jin + ' hacia tu espalda ' + DONDE[num.sect] + '!', { lado: 0, por: 'espalda' }); }
    else num.proxima = B.t + 20;
  } else if (num.estado === 'llega') { num.t -= dt; if (num.t <= 0) { num.estado = 'hostiga'; num.t = 15; } }
  else if (num.estado === 'hostiga') {
    num.t -= dt; const s = B.sect[num.sect], r = s.c[0];
    if (!r.roto) { r.acoso = 1; const m = r.flanco.cubre ? 0.35 : 1; bajas(B, s, r, 1.3 * m * dt); if (r.moral <= 0) romper(B, s, 0); }   // el ánimo lo quita la regla de la espalda (flancos + paso)
    if (num.t <= 0 || r.roto) { num.estado = 'lejos'; r.acoso = 0; num.proxima = B.t + 30 + rnd(B) * 10; if (!r.roto) ev(B, 'numidas-fuera', num.sect, Jin + ': se alejan'); }
  }
}

export function fin(B, como, motivo) {
  if (B.fase === 'fin') return;
  B.fase = 'fin';
  const cuales = l => B.sect.filter(s => s.c[l].roto).map(s => NOMBRE_SECTOR[s.i].toLowerCase()).join(' y ');
  if (!motivo) motivo = como === 'victoria' ? 'Rompiste su ' + cuales(1) + ': el resto huye.' : como === 'derrota' ? 'Cedieron tu ' + cuales(0) + ': la legión se deshace.' : 'Sacas a la legión en orden. El campo queda para el enemigo.';
  B.resultado = { como, motivo, t: B.t, bajas: [inicialLado(B, 0) - Math.round(hombresLado(B, 0)), inicialLado(B, 1) - Math.round(hombresLado(B, 1))], inicial: [inicialLado(B, 0), inicialLado(B, 1)], ordenes: B.ordenes };
  ev(B, 'fin', -1, '');
}
export const retirarse = B => fin(B, 'retirada');

/* RETRATO: lo que necesita quien dibuje (esta maqueta o la de ejércitos grandes, GM1). Una ficha por línea de cada cuerpo:
   quién es, cuántos hombres y en cuántas filas, dónde está (metros; x a lo ancho, z hacia el enemigo desde el centro del campo),
   hacia dónde mira (grados: 0 = al enemigo, ±90 = al costado, 180 = atrás), su alcance y qué está haciendo. */
export const ANCHO_SECTOR = 70, CAMPO = 22;
export function retrato(B) {
  const fichas = [];
  for (const s of B.sect) for (const c of s.c) {
    const dir = c.lado === 0 ? 1 : -1, z0 = -s.frente * CAMPO + dir * s.dist / 2; let fondo = 0;
    c.lineas.forEach((l, k) => {
      const T = TROPAS[l.tipo], F = FORMACIONES[T.forma], fig = T.cadaFigura || 1, n = l.hombres / fig, filas = Math.max(1, Math.min(F.filas, Math.ceil(n / 4)));
      const ancho = Math.min(ANCHO_SECTOR - 8, Math.ceil(n / filas) * F.paso * (T.cadaFigura ? 14 : 1)), hondo = filas * F.paso * (T.cadaFigura ? 8 : 1);
      const hace = c.roto ? 'huye' : c.relevo > 0 && k === 0 ? 'relevo' : k > 0 ? (l.tras && T.arma === 'arco' && l.mun > 0 && s.dist <= ARMAS.arco.alcance ? 'tira' : 'reserva') : s.dist > CONTACTO ? (ARMAS[T.arma].tiro && l.mun > 0 && ARMAS[T.arma].alcance >= s.dist ? 'tira' : c.postura === 'empujar' ? 'marcha' : 'espera') : 'lucha';
      const mira = k === 1 && c.flanco.cubre ? (c.flanco.espalda > 0 ? 180 : 90) : 0;
      fichas.push({ lado: c.lado, sector: s.i, linea: k, tipo: l.tipo, nombre: T.n, arma: T.arma, forma: T.forma, hombres: Math.round(l.hombres), max: l.max, cadaFigura: fig, filas, ancho, hondo,
        x: (s.i - (B.sect.length - 1) / 2) * ANCHO_SECTOR, z: z0 + dir * (fondo + hondo / 2), mira, alcance: ARMAS[T.arma].alcance, hace, fatiga: l.fatiga, postura: c.postura, moral: c.moral, desorden: c.desorden,
        peligro: k === 0 ? { costado: c.flanco.costado, espalda: c.flanco.espalda, cubre: c.flanco.cubre, causa: c.flanco.causa || '' } : null });
      fondo += hondo + 5;
    });
  }
  return fichas;
}
