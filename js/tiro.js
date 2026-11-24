/* AQVILA — ES3a: las reglas de los tiradores (honderos, arqueros, vélites). Sin pantalla ni three: corre en Node.
   Fuente: gobierno/estudios/ES1-escaramuza-combinada.md §4 y §7. Etiquetas: histórico / probable / licencia de juego.

   MUNDO que recibe pasoTiro (lo arma js/bloque-ia.js en la etapa siguiente):
     mundo = { cuerpos: [ { id, bando, x, z, ang, ancho, fondo, tipo, trabado, testudo, sarisasAlzadas, hombres, carga } ] }
       x, z: centro (m). ang: hacia dónde mira (0 = hacia −z; frente = (sin ang, −cos ang)). ancho: a lo largo de la línea; fondo: de
       delante atrás. tipo: 'falange' | 'manipulo' | 'ligera' | 'caballeria' | 'elefante' | 'arqueros' | 'honderos' | 'velites'.
       trabado: id (o lista de ids) del cuerpo rival con el que está en contacto, o true si solo se sabe que lo está.
       testudo: true si está en tortuga. sarisasAlzadas: true si es una falange con las picas arriba. carga: true si viene cargando.
     La función NO cambia el mundo: devuelve las salvas y quien llama aplica las bajas. */

/* Cada tipo: hombres 40 (Polibio 6.21: 1.200 vélites por legión = 40 por manípulo, histórico). Alcances comprimidos a la escala del
   campo (~150 m): licencia de juego (Vegecio 2.23 da 600 pies ≈ 180 m de práctica, histórico). Alcance de la jabalina 20–30 m: probable.
   Munición: vélites 7 (Livio 26.4, histórico, a cotejar); honderos 20 y arqueros 24: licencia de juego. Cadencias y daños: licencia.
   Honderos baleares (Diodoro 5.18) y arqueros cretenses de Pirro (Plutarco, Pirro 15.1): histórico. */
export const TIRADORES = {
  honderos: { nombre: 'Honderos', hombres: 40, proyectil: 'piedra',   alcance: 60, maximo: 75,  municion: 20, cadencia: 6, modos: ['directo', 'parabola'], cerca: 0,
              dano: 1.3, bueno: { ligera: 1.4, arqueros: 1.4, honderos: 1.4, caballeria: 1.2 }, flojo: { falange: 0.8, manipulo: 0.8 }, vel: 3.8 },
  arqueros: { nombre: 'Arqueros', hombres: 40, proyectil: 'flecha',   alcance: 80, maximo: 100, municion: 24, cadencia: 5, modos: ['parabola', 'directo'], cerca: 30,
              dano: 1.0, bueno: { ligera: 1.5, velites: 1.5, arqueros: 1.4, honderos: 1.4 }, flojo: { manipulo: 0.6, falange: 0.8 }, vel: 3.6 },
  velites:  { nombre: 'Vélites',  hombres: 40, proyectil: 'jabalina', alcance: 25, maximo: 25,  municion: 7,  cadencia: 6, modos: ['directo'], cerca: 0,
              dano: 1.2, bueno: { manipulo: 1.2, falange: 1.2, ligera: 1.3, arqueros: 1.3 }, flojo: {}, vel: 4.2 },
};
/* velocidad de lanzamiento (m/s), de PROYECTIL en js/fisica-batalla.js: se copia para no cargarlo (pruebas lo comprueban) */
export const V_TIRO = { piedra: 30, flecha: 45, jabalina: 22 };
export const AJUSTE = {   /* todo licencia de juego */
  base: { directo: 0.10, parabola: 0.06 },   /* muertos por tiro (directo pega más) */
  sarisas: 0.7,         /* sarisas alzadas entre medias: −30 % en parábola (Polibio 18.30.3, histórico; la cifra, licencia) */
  testudo: 0.03,        /* testudo rival: casi inmune */
  fueraAlcance: 0.5,    /* entre alcance y máximo */
  amigo: { parabola: 0.25, directo: 0.10 },   /* parte de los muertos que cae en los tuyos si el blanco está trabado con un cuerpo tuyo */
  roto: 1.5,            /* m: a esta distancia de una carga se rompen */
  margen: 0.8,          /* medio ancho de un tirador al pasar por un hueco */
  hostigaTiros: 2,
};
export const AVISOS = {
  encima: n => 'Tirando por encima de la falange · ' + n + ' tiros', sinMunicion: '¡Sin munición!',
  trabados: '¡Están trabados con los tuyos!', sinTiro: 'Sin tiro', rotos: '¡Los tiradores huyen de la carga!',
};

const G = 9.81;
export function generador(semilla = 1) { let a = semilla | 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const F_ = a => ({ x: Math.sin(a), z: -Math.cos(a) }), R_ = a => ({ x: Math.cos(a), z: Math.sin(a) });
const loc = (c, x, z) => { const f = F_(c.ang || 0), r = R_(c.ang || 0), dx = x - c.x, dz = z - c.z; return { l: dx * r.x + dz * r.z, p: dx * f.x + dz * f.z }; };

/* ángulos de tiro (rad) para un blanco a d m y dy m más alto que el origen, con velocidad v: {bajo, alto} o null si no llega */
export function angulos(d, v, g = G, dy = 0) {
  if (!(d > 0)) return null;
  const D = v ** 4 - g * (g * d * d + 2 * dy * v * v); if (D < 0) return null;
  const s = Math.sqrt(D); return { bajo: Math.atan((v * v - s) / (g * d)), alto: Math.atan((v * v + s) / (g * d)) };
}

/* ¿el segmento a→b corta el rectángulo del cuerpo c? (con margen m) */
export function cortaCuerpo(a, b, c, m = 0) {
  const A = loc(c, a.x, a.z), B = loc(c, b.x, b.z), hl = c.ancho / 2 + m, hp = c.fondo / 2 + m;
  let t0 = 0, t1 = 1;
  for (const [o, d, h] of [[A.l, B.l - A.l, hl], [A.p, B.p - A.p, hp]]) {
    if (Math.abs(d) < 1e-9) { if (Math.abs(o) > h) return false; continue; }
    let u = (-h - o) / d, w = (h - o) / d; if (u > w) [u, w] = [w, u];
    t0 = Math.max(t0, u); t1 = Math.min(t1, w); if (t0 > t1) return false;
  }
  return true;
}
const dentro = (c, x, z) => { const q = loc(c, x, z); return Math.abs(q.l) <= c.ancho / 2 && Math.abs(q.p) <= c.fondo / 2; };
const distCuerpo = (c, x, z) => { const q = loc(c, x, z); return Math.hypot(Math.max(0, Math.abs(q.l) - c.ancho / 2), Math.max(0, Math.abs(q.p) - c.fondo / 2)); };

/* ¿la línea de vuelo origen→blanco pasa sobre un cuerpo propio? Devuelve ese cuerpo o null. El cuerpo donde está el tirador no cuenta */
export function cruzaTuyos(origen, blanco, cuerpos) {
  for (const c of cuerpos || []) if (!dentro(c, origen.x, origen.z) && cortaCuerpo(origen, blanco, c)) return c;
  return null;
}

/* qué tiro toca: 'directo' | 'parabola' | 'sinTiro'. Si no hay nadie tuyo en medio: directo (el arquero, de lejos, en parábola). */
export function eligeModo(tipo, origen, blanco, tuyos) {
  const T = TIRADORES[tipo], d = Math.hypot(blanco.x - origen.x, blanco.z - origen.z), v = V_TIRO[T.proyectil];
  const medio = cruzaTuyos(origen, blanco, tuyos);
  if (medio) return T.modos.includes('parabola') && angulos(d, v, G, -1) ? 'parabola' : 'sinTiro';
  if (T.modos[0] === 'parabola' && T.modos.includes('directo') && d > T.cerca && angulos(d, v, G, -1)) return 'parabola';
  return T.modos.includes('directo') ? 'directo' : 'sinTiro';
}

/* un cuerpo de tiradores. op: { tipo, x, z, ang, id, bando, hombres, azar | semilla } */
export function crearTiradores(op = {}) {
  const tipo = op.tipo || 'honderos', C = TIRADORES[tipo];
  return { id: op.id || tipo, bando: op.bando ?? 0, tipo, x: op.x || 0, z: op.z || 0, ang: op.ang || 0, hombres: op.hombres ?? C.hombres,
    municion: op.municion ?? C.municion, recarga: 0, orden: op.orden || 'tirar', blanco: op.blanco ?? null,
    roto: false, ruta: null, hostiga: null, aviso: null, _ultimo: null, azar: op.azar || generador(op.semilla ?? 1) };
}

/* ruta por el hueco más cercano entre tus cuerpos. atras = true: retirada, hacia la retaguardia, por los cuerpos que quedan detrás.
   atras = false: salida (hostigar), por los que quedan delante, hacia la vanguardia; sin cuerpos delante, ruta vacía.
   Por la falange no se pasa; sin hueco, por el ala más cercana. Devuelve [{x, z}] con .por = 'hueco' | 'ala' | 'libre'. */
function rutaPor(T, tuyos, atras) {
  const f = F_(T.ang), r = R_(T.ang), m = AJUSTE.margen, sg = atras ? -1 : 1, pto = (l, p) => ({ x: T.x + r.x * l + f.x * p, z: T.z + r.z * l + f.z * p });
  const B = [];
  for (const c of tuyos || []) {
    if (c === T || c.id === T.id) continue;
    const q = loc({ x: T.x, z: T.z, ang: T.ang }, c.x, c.z); if (atras ? q.p >= 0 : q.p <= 0) continue;   /* solo los que quedan de ese lado */
    const rel = (c.ang || 0) - T.ang, cs = Math.abs(Math.cos(rel)), sn = Math.abs(Math.sin(rel));
    const hl = cs * c.ancho / 2 + sn * c.fondo / 2, hp = sn * c.ancho / 2 + cs * c.fondo / 2;
    B.push({ lo: q.l - hl - m, hi: q.l + hl + m, fondo: q.p + sg * hp });
  }
  if (!B.length) { const ru = atras ? [pto(0, -12)] : []; ru.por = 'libre'; return ru; }
  B.sort((a, b) => a.lo - b.lo);
  const M = []; for (const b of B) { const u = M[M.length - 1]; if (u && b.lo <= u.hi) u.hi = Math.max(u.hi, b.hi); else M.push({ ...b }); }
  const lejos = atras ? Math.min(...B.map(b => b.fondo)) : Math.max(...B.map(b => b.fondo));
  if (!atras && !M.some(u => u.lo <= 0 && u.hi >= 0)) { const ru = []; ru.por = 'libre'; return ru; }   /* el carril de delante está libre */
  let mejor = null;
  for (let i = 0; i + 1 < M.length; i++) { const l = (M[i].hi + M[i + 1].lo) / 2; if (!mejor || Math.abs(l) < Math.abs(mejor)) mejor = l; }
  let por = 'hueco', l = mejor;
  if (mejor === null) { por = 'ala'; const a = M[0].lo - 1, b = M[M.length - 1].hi + 1; l = Math.abs(a) < Math.abs(b) ? a : b; }
  const ru = Math.abs(l) < 0.3 ? [pto(0, lejos + sg * 3)] : [pto(l, 0), pto(l, lejos + sg * 3)]; ru.por = por; return ru;
}
/* ruta de retirada (ver rutaPor) */
export function rutaRetirada(T, tuyos) { return rutaPor(T, tuyos, true); }
/* ruta de salida hacia delante por el hueco (hostigar); vacía si no hay línea tuya delante */
export function rutaSalida(T, tuyos) { return rutaPor(T, tuyos, false); }

const bin = (n, p, az) => { let k = 0; for (let i = 0; i < n; i++) if (az() < p) k++; return k; };
const idsDe = b => [].concat(b.trabado || []).filter(x => typeof x !== 'boolean');

/* un paso (dt s). Mueve a T (hostigar, retirarse) y devuelve las salvas de este paso:
   [{ de, a, n, modo, proyectil, angulo, muertos, bajasPropias, propios, avisos: [texto] }] (el array trae además .avisos con todos los textos).
   T.orden: 'tirar' | 'alto' | 'hostigar' | 'retirarse' ('huir' si se rompen). T.blanco: id del cuerpo marcado o null. */
export function pasoTiro(T, dt, mundo) {
  const salvas = []; salvas.avisos = []; const C = TIRADORES[T.tipo], cu = mundo.cuerpos || [];
  const aviso = t => { if (t && T._ultimo !== t) { T._ultimo = t; salvas.avisos.push(t); } T.aviso = t || T.aviso; };
  const tuyos = cu.filter(c => c.bando === T.bando && c.id !== T.id), rivales = cu.filter(c => c.bando !== T.bando && (c.hombres ?? 1) > 0);
  const va = (x, z, paso) => { const d = Math.hypot(x - T.x, z - T.z); if (d <= paso) { T.x = x; T.z = z; return true; } T.x += (x - T.x) / d * paso; T.z += (z - T.z) / d * paso; return false; };
  if (T.recarga > 0) T.recarga -= dt;
  if (T.roto || T.orden === 'huir') {   /* rotos: huyen hacia atrás, sin tirar */
    T.orden = 'huir'; const f = F_(T.ang); T.x -= f.x * C.vel * 1.2 * dt; T.z -= f.z * C.vel * 1.2 * dt; return salvas;
  }
  for (const c of rivales) if (c.carga && distCuerpo(c, T.x, T.z) <= AJUSTE.roto) { T.roto = true; T.orden = 'huir'; aviso(AVISOS.rotos); return salvas; }
  if (T.orden === 'retirarse') {
    if (!T.ruta) { T.ruta = rutaRetirada(T, tuyos); T.rutaI = 0; }
    if (T.rutaI < T.ruta.length) { const p = T.ruta[T.rutaI]; if (va(p.x, p.z, C.vel * dt)) T.rutaI++; }
    else { T.orden = 'alto'; T.ruta = null; }
    return salvas;
  }
  if (T.orden === 'alto') return salvas;
  if (T.hombres <= 0) return salvas;
  /* el blanco: el marcado, si no el más cercano a su alcance (en 'hostigar' el más cercano de todos) */
  const dist = c => distCuerpo(c, T.x, T.z);
  let bl = T.blanco != null ? rivales.find(c => c.id === T.blanco) : null;
  if (!bl) { let m = Infinity; const lim = T.orden === 'hostigar' ? Infinity : C.maximo; for (const c of rivales) { const d = dist(c); if (d < m && d <= lim) { m = d; bl = c; } } }
  if (!bl) return salvas;
  const d = dist(bl);
  if (T.orden === 'hostigar') {
    if (!T.hostiga) T.hostiga = { fase: 'avanza', tiros: 0, x: T.x, z: T.z, ruta: null, i: 0 };
    const H = T.hostiga;
    const sigue = () => { if (H.i >= H.ruta.length) return false; const p = H.ruta[H.i]; if (va(p.x, p.z, C.vel * dt)) H.i++; return true; };
    if (H.fase === 'vuelve') {   /* de vuelta por el hueco (si la línea quedó detrás) y al sitio de partida */
      if (!H.ruta) { const r = rutaRetirada(T, tuyos); H.ruta = r.por === 'libre' ? [] : [...r]; H.ruta.push({ x: H.x, z: H.z }); H.i = 0; }
      if (!sigue()) { T.orden = 'tirar'; T.hostiga = null; }
      return salvas;
    }
    if (H.fase === 'avanza' && !H.salio) { if (!H.ruta) { H.ruta = [...rutaSalida(T, tuyos)]; H.i = 0; } if (sigue()) return salvas; H.salio = true; }   /* sale por el hueco */
    if (d > C.alcance * 0.95 && H.fase === 'avanza') { va(bl.x, bl.z, C.vel * dt); return salvas; }
  } else if (d > C.maximo) return salvas;
  if (T.municion <= 0) { aviso(AVISOS.sinMunicion); return salvas; }
  const origen = { x: T.x, z: T.z }, modo = eligeModo(T.tipo, origen, bl, tuyos);
  if (modo === 'sinTiro') { aviso(AVISOS.sinTiro); return salvas; }
  if (T.recarga > 0) return salvas;
  const amigos = idsDe(bl).filter(id => tuyos.some(c => c.id === id)), trabado = amigos.length > 0 || (bl.trabado === true);
  const medio = cruzaTuyos(origen, bl, tuyos), avisos = [];
  if (trabado) avisos.push(AVISOS.trabados);
  const n = Math.max(0, Math.round(T.hombres)), v = V_TIRO[C.proyectil];
  if (modo === 'parabola' && medio) avisos.push(AVISOS.encima(n));
  /* daño: base por modo × bueno/flojo × alcance × sarisas × testudo */
  let k = AJUSTE.base[modo] * C.dano * (C.bueno[bl.tipo] || C.flojo[bl.tipo] || 1);
  if (d > C.alcance) k *= AJUSTE.fueraAlcance;
  if (bl.testudo) k *= AJUSTE.testudo;
  if (modo === 'parabola' && rivales.some(c => c.sarisasAlzadas && c !== bl && cortaCuerpo(origen, bl, c))) k *= AJUSTE.sarisas;
  const az = T.azar; let tot = Math.min(bin(n, Math.min(1, k), az), bl.hombres ?? Infinity), propias = 0;
  if (trabado) { propias = bin(tot, AJUSTE.amigo[modo], az); tot -= propias; }
  T.municion--; T.recarga = C.cadencia;
  const ang = angulos(Math.max(1, d), v, G, -1);
  salvas.push({ de: T.id, a: bl.id, n, modo, proyectil: C.proyectil, angulo: ang ? (modo === 'parabola' ? ang.alto : ang.bajo) : null,
    muertos: tot, bajasPropias: propias, propios: propias ? (amigos[0] ?? null) : null, avisos });
  for (const t of avisos) aviso(t);
  if (T.municion <= 0) aviso(AVISOS.sinMunicion);
  if (T.orden === 'hostigar' && T.hostiga && ++T.hostiga.tiros >= AJUSTE.hostigaTiros) { T.hostiga.fase = 'vuelve'; T.hostiga.ruta = null; }
  return salvas;
}

/* ===== ES3b · Tus tiradores dentro del combate de js/bloque-ia.js (sin pantalla: corre en Node) =====
   montaTiradores(C, M, { tipo, semilla, alSalva, avisa }) → X, o null si el combate no tiene S.apoyo (crearCombate({ apoyo })).
   El cuerpo de tiradores es un bloque más de S.bloques (papel 'tiradores', bando 'r'): lo dibuja tropas.js, lo ataca el rival y
   sus bajas son las del combate. Cada paso: se arma el «mundo» de pasoTiro con los bloques, se mueve a los tiradores y se
   aplican las bajas de las salvas (a los rivales y, con fuego amigo, a los tuyos) cuando llega el proyectil (X.pend).
     X.T         el cuerpo de tiradores (crearTiradores)     X.b   su bloque
     X.orden(n)  'tirar' (↔ alto el fuego) | 'hostigar' | 'retirarse' | 'alto'. true si la acepta
     X.util()    la orden que conviene iluminar o null       X.vida()  { n, de, f }
     X.marca(blq) marca (o desmarca, si ya lo era) un bloque rival como blanco    X.blancoBloque()  el bloque marcado o null
     X.alFrente(a, p, { todos })  los lleva a su sitio (todos: 20 m detrás de la raya)    X.paso(dt)  un paso (lo llama M.paso)
   alSalva({ T, de, a, n, proyectil, modo, angulo, v, vuelo, muertos, propias }) lo oye la pantalla para dibujar el vuelo. */
export const DETRAS = 20;   /* m: a qué distancia detrás de la línea se ponen (licencia de juego) */
const TIPO_MUNDO = { falange: 'falange', manipulo: 'manipulo', galos: 'ligera', nobles: 'ligera', tiradores: 'velites' };
export function montaTiradores(C, M, op = {}) {
  const S = C.S, b = S.apoyo; if (!b) return null;
  const tipo = op.tipo && TIRADORES[op.tipo] ? op.tipo : 'honderos', Cf = TIRADORES[tipo];
  const f0 = F_(b.ang), cx = b.x - f0.x * b.fondo / 2, cz = b.z - f0.z * b.fondo / 2;
  const T = crearTiradores({ tipo, id: 'tiradores', bando: 0, x: cx, z: cz, ang: b.ang, semilla: op.semilla ?? 7, hombres: b.U.enPie });
  const X = { T, b, tipo, pend: [], salvas: [], total: { tiros: 0, muertos: 0, propias: 0 } };
  const idDe = bl => bl === b ? 'tiradores' : 'b' + bl.id, porId = id => S.bloques.find(bl => idDe(bl) === id) || null;
  const cuerpoDe = bl => {
    const f = F_(bl.ang), n = bl.U.enPie;
    return { id: idDe(bl), bando: bl.bando === 'r' ? 0 : 1, x: bl.x - f.x * bl.fondo / 2, z: bl.z - f.z * bl.fondo / 2, ang: bl.ang, ancho: bl.ancho, fondo: bl.fondo,
      tipo: bl === S.tuyo ? 'falange' : (TIPO_MUNDO[bl.tipo] || 'manipulo'), hombres: n, trabado: (bl.contactos || []).map(c => idDe(c.b)),
      testudo: bl.orden === 'testudo', carga: (bl.orden === 'cargar' || bl.cargaAl) && (bl.v || 0) > 1.5 && bl.estado !== 'huye' };
  };
  X.mundo = () => ({ cuerpos: S.bloques.filter(bl => bl.estado !== 'fuera' && bl !== b && bl.U.enPie > 0).map(cuerpoDe) });
  X.blancoBloque = () => T.blanco != null ? porId(T.blanco) : null;
  X.marca = bl => { T.blanco = bl && T.blanco !== idDe(bl) ? idDe(bl) : null; return T.blanco; };
  const vivo = () => T.hombres > 0 && !T.roto && b.estado !== 'fuera';
  X.orden = n => {
    if (!vivo() || S.ganador) return false;
    if (n === 'tirar') { T.orden = T.orden === 'tirar' ? 'alto' : 'tirar'; T.hostiga = null; T.ruta = null; T.marcha = null; return true; }
    if (n === 'hostigar') { if (T.municion <= 0) return false; T.orden = 'hostigar'; T.hostiga = null; T.marcha = null; return true; }
    if (n === 'retirarse') { T.orden = 'retirarse'; T.ruta = null; T.marcha = null; return true; }
    if (n === 'alto') { if (T.orden === 'hostigar' || T.orden === 'retirarse') { T.orden = 'tirar'; T.hostiga = null; T.ruta = null; } T.marcha = null; return true; }
    return false;
  };
  X.vida = () => { const d = b.U.hombres, n = b.U.enPie; return { n, de: d, f: d ? n / d : 0 }; };
  X.util = () => {
    if (!vivo() || S.ganador) return null;
    const m = X.mundo(), yo = { x: T.x, z: T.z };
    if (T.municion <= 0) return 'retirarse';
    if (m.cuerpos.some(c => c.bando === 1 && c.carga && Math.hypot(c.x - T.x, c.z - T.z) < 28)) return 'retirarse';
    const bl = X.blancoBloque(), c = bl && m.cuerpos.find(q => q.id === idDe(bl));
    if (c && T.orden === 'tirar' && c.trabado.some(id => m.cuerpos.some(q => q.id === id && q.bando === 0))) return 'tirar';   /* «Alto el fuego» */
    if (c && eligeModo(tipo, yo, c, m.cuerpos.filter(q => q.bando === 0)) === 'sinTiro') return 'hostigar';
    return null;
  };
  X.alFrente = (a, p, o = {}) => {
    if (!vivo() || T.orden === 'retirarse') return false;
    const dx = p.x - a.x, dz = p.z - a.z, c1 = Math.atan2(dz, dx), c2 = c1 + Math.PI;
    const dif = (u, v) => { let d = (u - v) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
    const rumbo = Math.abs(dif(c1, T.ang)) <= Math.abs(dif(c2, T.ang)) ? c1 : c2, F = F_(rumbo), mx = (a.x + p.x) / 2, mz = (a.z + p.z) / 2;
    T.marcha = o.todos ? { x: mx - F.x * DETRAS, z: mz - F.z * DETRAS, ang: rumbo } : { x: mx, z: mz, ang: rumbo };
    if (T.orden === 'alto') T.orden = 'tirar';
    return true;
  };
  const vuelo = (d, s) => { const v = V_TIRO[s.proyectil]; return s.angulo != null ? d / Math.max(2, v * Math.cos(s.angulo)) : d / v; };
  X.paso = dt => {
    if (S.ganador) return;
    T.hombres = b.U.enPie;
    if ((b.U.roto || b.estado === 'huye') && !T.roto) { T.roto = true; T.orden = 'huir'; X.avisos.push(AVISOS.rotos); }
    /* la marcha a su sitio (frente dibujado): solo si no hace otra cosa */
    if (T.marcha && !T.roto && (T.orden === 'tirar' || T.orden === 'alto')) {
      const q = T.marcha, d = Math.hypot(q.x - T.x, q.z - T.z), paso = Cf.vel * dt;
      if (d <= paso) { T.x = q.x; T.z = q.z; T.ang = q.ang; T.marcha = null; } else { T.x += (q.x - T.x) / d * paso; T.z += (q.z - T.z) / d * paso; }
    }
    const m = X.mundo(), S_ = pasoTiro(T, dt, m);
    for (const t of S_.avisos) X.avisos.push(t);
    for (const s of S_) {
      const bl = porId(s.a), propio = s.propios ? porId(s.propios) : null;
      const d = bl ? Math.hypot(bl.x - T.x, bl.z - T.z) : 0, v = vuelo(d, s);
      X.pend.push({ t: S.T + v, a: bl, muertos: s.muertos, propias: s.bajasPropias, propio });
      X.total.tiros++; X.salvas.push(s);
      try { (op.alSalva || (() => {}))({ T, de: b, a: bl, n: s.n, proyectil: s.proyectil, modo: s.modo, angulo: s.angulo, v: V_TIRO[s.proyectil], vuelo: v, muertos: s.muertos, propias: s.bajasPropias, propio }); } catch (e) { console.warn('salva', e); }
    }
    for (let i = X.pend.length - 1; i >= 0; i--) {   /* llega el proyectil: caen los que dicen las reglas */
      const p = X.pend[i]; if (S.T < p.t) continue; X.pend.splice(i, 1);
      if (p.a && p.a.estado !== 'fuera' && p.muertos > 0) { const k = C.baja(p.a, p.muertos); X.total.muertos += k; p.a.U.anima && p.a.U.anima(-0.01 * k / Math.max(1, p.a.U.hombres) * 10); }
      if (p.propio && p.propias > 0) X.total.propias += C.baja(p.propio, p.propias);
    }
    /* el bloque sigue a los tiradores */
    const f = F_(T.ang); b.ang = T.ang; b.x = T.x + f.x * b.fondo / 2; b.z = T.z + f.z * b.fondo / 2;
    if (T.roto) { b.estado = 'huye'; b.obj = null; }
    while (X.avisos.length) { const t = X.avisos.shift(); try { (op.avisa || (() => {}))(t); } catch (e) { /* sin aviso */ } }
  };
  X.avisos = [];
  /* el mando llama a X.paso tras cada paso del combate */
  const paso0 = M.paso; M.paso = dt => { const r = paso0(dt); if (r) X.paso(dt); return r; };
  M.anade({ id: 'tiradores', nombre: Cf.nombre, corto: Cf.nombre, ordenes: ['tirar', 'hostigar', 'retirarse', 'alto'], vida: X.vida, alOrden: X.orden, alFrente: X.alFrente, alUtil: X.util, b });
  C.tiradores = X; return X;
}
