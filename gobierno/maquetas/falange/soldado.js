/* Pieza «soldado» (TP7a: el falangita; viene de la del hastatus): la figura de 0 A.D. (Wildfire Games, CC BY-SA 3.0) y su tabla de huesos.
   · generaTabla: las filas del modelo y, detrás, las posturas hechas por cuentas (esqueleto.js): subir el escudo al muro
     o al techo, encogerse, mirar a los lados, lanzar el pilum, luchar (GP1) y correr inclinado (TP1).
   · hueso: la matriz de un hueso mezclando dos filas, igual que el sombreador (A, B y la mezcla).
   · filasMarcha: qué dos filas toca a un hombre según su paso (locomocion.js), con la fase de pierna casada entre clips.
   · datosPies / pieEn / faseCero: dónde está cada pie (para medir si patina y para casar las fases). Valen para cualquier
     figura con tabla de huesos (también los galos).
   Sin pantalla: corre en Node si se le da la tabla. Después: el soldado nuevo (manos, brazos) entra aquí con las mismas fichas. */
import { crearEsqueleto } from './esqueleto.js';
import { mezcla } from './locomocion.js';
const lerp = (a, b, t) => a + (b - a) * t;

/* TP7a · la tabla del falangita: las filas del modelo y, detrás, siete «conjuntos» de 110 filas (una por fotograma de
   «idle», 60, y de «walk», 50: así el hombre sigue respirando o andando mientras baja la sarisa).
   0-2 bajando la sarisa a la cadera (1/3, 2/3, abajo; la primera fila) · 3-5 lo mismo, sobre el hombro (filas 2.ª a 5.ª)
   · 6 la estocada (las manos se van 35 cm adelante). Las manos van donde pasa la sarisa: la de atrás (derecha) a la
   cadera o al hombro, la de delante (izquierda) medio metro más allá, por el mismo lado. */
export const CJF = { baja: 0, alta: 3, golpe: 6, n: 7, filas: 110 };
const POSF = {
  baja: { manoD: [-0.17, 1.0, -0.02], manoI: [-0.11, 1.07, 0.52], dobla: 0.1, baja: 0.04 },
  alta: { manoD: [-0.2, 1.42, -0.06], manoI: [-0.17, 1.4, 0.48], dobla: 0.06, baja: 0.02 },
  golpe: { manoD: [-0.13, 1.04, 0.3], manoI: [-0.09, 1.1, 0.86], dobla: 0.24, baja: 0.08, tuerce: 0.08 },
};
export function generaTablaFalange(base, meta, geo, E, HM) {
  const hues = meta.slots, N0 = meta.frames, C = meta.clips, total = N0 + CJF.n * CJF.filas, T = new Float32Array(total * hues * 12); T.set(base.subarray(0, N0 * hues * 12));
  const esq = crearEsqueleto(base, hues, N0, geo.attributes.position.array, geo.attributes.aSkinI.array, geo.attributes.aSkinW.array, HM);
  const u = v => v.map(x => x / E), pon = (fila, q, b) => T.set(esq.postura(b, q), fila * hues * 12);
  const bases = [...Array(C.idle.frames)].map((_, i) => C.idle.start + i).concat([...Array(C.walk.frames)].map((_, i) => C.walk.start + i));
  bases.forEach((b, j) => {
    const mD = esq.en(b, HM.anteD, 'munecaD').map(x => x * E), mI = esq.en(b, HM.anteI, 'munecaI').map(x => x * E);
    for (const [c0, P] of [[CJF.baja, POSF.baja], [CJF.alta, POSF.alta]]) for (let k = 1; k <= 3; k++) {
      const p = k / 3, s = Math.sin(Math.PI * p);
      /* de la postura del modelo (sarisa alzada en la derecha) a la bajada, con un arco hacia fuera para no cruzar el cuerpo */
      const md = [lerp(mD[0], P.manoD[0], p) - 0.08 * s, lerp(mD[1], P.manoD[1], p), lerp(mD[2], P.manoD[2], p) + 0.1 * s];
      const mi = [lerp(mI[0], P.manoI[0], p) + 0.05 * s, lerp(mI[1], P.manoI[1], p) + 0.1 * s, lerp(mI[2], P.manoI[2], p) + 0.12 * s];
      pon(N0 + (c0 + k - 1) * CJF.filas + j, { manoD: u(md), manoI: u(mi), dobla: P.dobla * p, baja: P.baja * p / E, poloD: [-0.7, -0.7, -0.1], poloI: [0.8, -0.6, 0] }, b);
    }
    const G = POSF.golpe;
    pon(N0 + CJF.golpe * CJF.filas + j, { manoD: u(G.manoD), manoI: u(G.manoI), dobla: G.dobla, baja: G.baja / E, tuerce: G.tuerce, poloD: [-0.7, -0.7, -0.1], poloI: [0.8, -0.6, 0] }, b);
  });
  /* la fila del conjunto c que corresponde a una fila de idle o walk del modelo (las demás, sin conjunto: se quedan) */
  const fila = (c, b) => b >= C.idle.start && b < C.idle.start + C.idle.frames ? N0 + c * CJF.filas + (b - C.idle.start)
    : b >= C.walk.start && b < C.walk.start + C.walk.frames ? N0 + c * CJF.filas + C.idle.frames + (b - C.walk.start) : b;
  return { T, esq, N0, hues, total, fila };
}

/* la matriz de un hueso (tabla T de «hues» huesos), mezclando dos filas igual que el sombreador */
const _e = new Array(12);
export function hueso(tab, slot, A, B, mx, out) {
  const t = tab.T, oa = (A * tab.hues + slot) * 12, ob = (B * tab.hues + slot) * 12;
  if (mx < 0.001 || A === B) for (let i = 0; i < 12; i++) _e[i] = t[oa + i]; else for (let i = 0; i < 12; i++) _e[i] = t[oa + i] * (1 - mx) + t[ob + i] * mx;
  return out.set(_e[0], _e[1], _e[2], _e[3], _e[4], _e[5], _e[6], _e[7], _e[8], _e[9], _e[10], _e[11], 0, 0, 0, 1);
}

/* ---------- los pies ----------
   Los vértices más bajos de la figura en reposo, separados por lado (+x izquierda); de cada lado, el hueso que más los mueve
   y su centro. Con eso se sabe dónde pisa cada pie en cualquier fila (o mezcla de dos). */
const fila3x4 = (T, hues, row, slot) => T.subarray((row * hues + slot) * 12, (row * hues + slot) * 12 + 12);
function piel(T, hues, geo, i, row, out) {
  const P = geo.attributes.position.array, SI = geo.attributes.aSkinI.array, SW = geo.attributes.aSkinW.array, norm = SW instanceof Uint8Array ? 255 : 1;
  out[0] = out[1] = out[2] = 0;
  for (let k = 0; k < 4; k++) {
    const w = SW[i * 4 + k] / norm; if (!w) continue; const m = fila3x4(T, hues, row, SI[i * 4 + k]);
    for (let c = 0; c < 3; c++) out[c] += w * (m[c * 4] * P[i * 3] + m[c * 4 + 1] * P[i * 3 + 1] + m[c * 4 + 2] * P[i * 3 + 2] + m[c * 4 + 3]);
  }
  return out;
}
export function datosPies(T, hues, geo, filaReposo) {
  const n = geo.attributes.position.count, p = [0, 0, 0], ys = new Float32Array(n), xs = new Float32Array(n); let my = 1e9, My = -1e9;
  for (let i = 0; i < n; i++) { piel(T, hues, geo, i, filaReposo, p); xs[i] = p[0]; ys[i] = p[1]; my = Math.min(my, p[1]); My = Math.max(My, p[1]); }
  const P = geo.attributes.position.array, SI = geo.attributes.aSkinI.array, SW = geo.attributes.aSkinW.array, corte = my + (My - my) * 0.06, lados = {};
  for (const [lado, signo] of [['I', 1], ['D', -1]]) {
    const cuenta = new Map(), vs = [];
    for (let i = 0; i < n; i++) if (ys[i] < corte && xs[i] * signo > 0) { vs.push(i); let b = 0; for (let k = 1; k < 4; k++) if (SW[i * 4 + k] > SW[i * 4 + b]) b = k; const s = SI[i * 4 + b]; cuenta.set(s, (cuenta.get(s) || 0) + 1); }
    const slot = [...cuenta].sort((a, b) => b[1] - a[1])[0][0], c = [0, 0, 0]; let k = 0;
    for (const i of vs) { let b = 0; for (let j = 1; j < 4; j++) if (SW[i * 4 + j] > SW[i * 4 + b]) b = j; if (SI[i * 4 + b] !== slot) continue; c[0] += P[i * 3]; c[1] += P[i * 3 + 1]; c[2] += P[i * 3 + 2]; k++; }
    lados[lado] = { slot, p: c.map(x => x / k) };
  }
  return lados;
}
/* el pie (I o D) en el espacio del modelo, en la mezcla de dos filas */
export function pieEn(T, hues, pie, A, B, mx) {
  const a = fila3x4(T, hues, A, pie.slot), b = fila3x4(T, hues, B, pie.slot), p = pie.p, o = [0, 0, 0];
  for (let c = 0; c < 3; c++) { const r = k => a[c * 4 + k] * (1 - mx) + b[c * 4 + k] * mx; o[c] = r(0) * p[0] + r(1) * p[1] + r(2) * p[2] + r(3); }
  return o;
}
/* en qué fracción del clip va el pie izquierdo más adelantado: ahí se pone la fase 0 (así andar y correr casan la pierna) */
export function faseCero(T, hues, pies, clip, inicio = clip.start) {
  let mejor = 0, dm = -1e9;
  for (let f = 0; f < clip.frames; f++) { const d = pieEn(T, hues, pies.I, inicio + f, inicio + f, 0)[2] - pieEn(T, hues, pies.D, inicio + f, inicio + f, 0)[2]; if (d > dm) { dm = d; mejor = f; } }
  return mejor / clip.frames;
}
/* ---------- el paso casado con el suelo ----------
   Los clips de 0 A.D. no llevan el pie apoyado a velocidad constante (al principio del apoyo va despacio y al final
   deprisa). Si la fase avanzara igual por metro, el pie resbalaría aunque la zancada media fuera la buena. Por eso se hace
   una tabla: fotograma a fotograma, cuánto retrocede el pie más bajo (el apoyado). Su suma es la zancada; y la fase de
   andar (fracción de lo recorrido en el ciclo) se convierte en el fotograma en que el pie apoyado ha retrocedido justo eso:
   el pie queda clavado en el suelo. Empieza en el fotograma en que el pie izquierdo va delante (fase 0) */
export function tablaPaso(T, hues, pies, clip, inicio = clip.start, f0 = 0, reposo = 0) {
  const n = clip.frames, k0 = Math.round(f0 * n), acu = [0], z = f => { const r = inicio + ((k0 + f) % n), a = pieEn(T, hues, pies.I, r, r, 0), b = pieEn(T, hues, pies.D, r, r, 0); return a[1] < b[1] ? ['I', a[2], b] : ['D', b[2], a]; };
  /* al correr hay un momento en el aire: ahí no apoya ningún pie y el cuerpo sigue a la velocidad media de los apoyos */
  const h0 = pieEn(T, hues, pies.I, reposo, reposo, 0)[1], d = [];
  for (let f = 0; f < n; f++) {
    const [la] = z(f), ra = inicio + ((k0 + f) % n), rb = inicio + ((k0 + f + 1) % n), p0 = pieEn(T, hues, pies[la], ra, ra, 0), p1 = pieEn(T, hues, pies[la], rb, rb, 0);
    d.push(p0[1] < h0 + 0.35 ? Math.max(0.004, p0[2] - p1[2]) : null);   /* lo que retrocede el pie que apoya (si no está a más de 0,35 del modelo, unos 17 cm) */
  }
  const enSuelo = d.filter(x => x !== null), media = enSuelo.reduce((a, b) => a + b, 0) / Math.max(1, enSuelo.length);
  let atras = 0; for (const x of d) { atras += x === null ? media : x; acu.push(atras); }
  return { acu, total: atras, k0, n, inicio };
}
/* el fotograma (con decimales) de una fase del paso: donde lo apoyado ha retrocedido fase × zancada */
export function fotogramaEnFase(tp, fase) {
  const d = ((fase % 1) + 1) % 1 * tp.total, a = tp.acu; let lo = 0, hi = tp.n;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (a[m] <= d) lo = m; else hi = m; }
  const fr = lo + (d - a[lo]) / Math.max(1e-6, a[lo + 1] - a[lo]);
  return tp.k0 + fr;
}
/* la fila (y la siguiente, con su mezcla) de un clip en una fase */
export function filasEnFase(tp, fase) {
  const x = fotogramaEnFase(tp, fase), f = Math.floor(x), n = tp.n;
  return [tp.inicio + (f % n), tp.inicio + ((f + 1) % n), x - f];
}
export const filaEnFase = (tp, fase) => { const [a, b, m] = filasEnFase(tp, fase); return m < 0.5 ? a : b; };
/* qué dos filas tocan a quien lleva el paso p. «fig» = { C (clips), f0: { anda, corre }, corre0 (primera fila del correr) } */
export function filasMarcha(fig, p, tQuieto, frameOf) {
  /* fig = { C (clips), paso: { anda, corre } (tablas de tablaPaso) }. Solo andando o solo corriendo, se mezclan dos
     fotogramas seguidos (el paso va suave aunque el clip tenga pocos); al fundir dos modos, uno de cada */
  const z = mezcla(p), C = fig.C;
  const fila = modo => modo === 'quieto' ? frameOf(C.idle, tQuieto) : filaEnFase(fig.paso[modo], z.fase);
  if (z.a === z.b && z.a !== 'quieto') return filasEnFase(fig.paso[z.a], z.fase);
  return [fila(z.a), fila(z.b), z.mx];
}
