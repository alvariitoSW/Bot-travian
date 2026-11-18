/* Pieza «soldado»: la figura del hastatus de 0 A.D. (Wildfire Games, CC BY-SA 3.0) y su tabla de huesos.
   · generaTabla: las filas del modelo y, detrás, las posturas hechas por cuentas (esqueleto.js): subir el escudo al muro
     o al techo, encogerse, mirar a los lados, lanzar el pilum, luchar (GP1) y correr inclinado (TP1).
   · hueso: la matriz de un hueso mezclando dos filas, igual que el sombreador (A, B y la mezcla).
   · filasMarcha: qué dos filas toca a un hombre según su paso (locomocion.js), con la fase de pierna casada entre clips.
   · datosPies / pieEn / faseCero: dónde está cada pie (para medir si patina y para casar las fases). Valen para cualquier
     figura con tabla de huesos (también los galos).
   Sin pantalla: corre en Node si se le da la tabla. Después: el soldado nuevo (manos, brazos) entra aquí con las mismas fichas. */
import { crearEsqueleto, H as HU } from './esqueleto.js';
import { MURO_Y, MURO_Z, TECHO_Y, TECHO_Z, CORRE } from './formacion.js';
import { mezcla } from './locomocion.js';
const lerp = (a, b, t) => a + (b - a) * t;

/* Cada «conjunto» tiene 120 filas: una por cada fotograma de «idle» (70) y de «walk» (50), para que el hombre siga
   respirando o andando mientras hace el gesto.
   0-3 muro (subiendo el escudo: 1/4, 2/4, 3/4 y arriba) · 4 muro encogido · 5-8 techo · 9 techo encogido
   10-11 muro mirando a su derecha (a medias y del todo) · 12-13 muro mirando a su izquierda
   GP1 · 14 brazo armado atrás · 15 guardia · 16 empujón de escudo · 17 cubrirse · 18 recibe el golpe · 19 los de detrás empujan
   · 20 espada en alto · TP1b · 21 escudo quieto al costado (el brazo del escudo no se mece al andar). Después, 5 filas sueltas de lanzar (GM43h; la última, el brazo armado del todo, la que sostiene el
   dedo) y, al final (TP1), el clip «run» entero con el cuerpo inclinado hacia delante y la cabeza alzada. */
export const CJ = { muro: 0, techo: 5, miraD: 10, miraI: 12, prep: 14, guardia: 15, empuje: 16, cubre: 17, recibe: 18, empuja: 19, alza: 20, quieto: 21, lanza: 22 };
/* TP1b: en el testudo el paso es más corto. Las posturas del testudo se hacen sobre un andar «encogido»: cada fotograma de
   andar mezclado con el reposo (CORTO de reposo); así la pierna barre menos y la zancada (medida aparte) sale más corta */
export const CORTO = 0.38;
/* las posturas de luchar (GP1), en metros (+x es la izquierda del hombre, +z delante; la mano derecha lleva el arma) */
const POS = {
  prep: { tuerce: -0.55, dobla: -0.1, manoD: [-0.45, 1.85, -0.42], poloD: [-0.6, -0.6, -0.6], manoI: [0.22, 1.42, 0.5], poloI: [0.8, -0.6, 0], cabeza: [-0.05, 0.5] },
  guardia: { baja: 0.12, dobla: 0.14, tuerce: 0.18, manoI: [0.2, 1.1, 0.48], manoD: [-0.3, 1.02, 0.28], cabeza: [-0.05, -0.18] },
  empuje: { baja: 0.18, dobla: 0.34, tuerce: 0.38, manoI: [0.12, 1.18, 0.8], manoD: [-0.34, 0.98, 0.02], cabeza: [-0.12, -0.32] },
  cubre: { baja: 0.22, dobla: 0.24, tuerce: 0.22, manoI: [0.08, 1.5, 0.5], poloI: [0.9, -0.3, 0], manoD: [-0.32, 1.0, 0.12], cabeza: [0.3, -0.15] },
  recibe: { baja: 0.06, dobla: 0.55, tuerce: -0.15, manoI: [0.34, 0.95, 0.32], manoD: [-0.32, 0.88, 0.22], cabeza: [0.45, 0.05] },
  empuja: { baja: 0.15, dobla: 0.3, tuerce: 0.12, manoI: [0.12, 1.25, 0.55], manoD: [-0.3, 1.02, 0.18], cabeza: [-0.25, 0] },
  alza: { baja: 0.08, dobla: 0.12, tuerce: -0.12, manoI: [0.16, 1.25, 0.48], manoD: [-0.34, 2.0, 0.08], poloD: [-0.8, -0.3, -0.4], cabeza: [-0.3, 0.1] },
};
/* TP1: al correr, la cintura se dobla hacia delante y la cabeza se alza para seguir mirando al frente (el clip de 0 A.D. va tieso) */
const CARRERA = { dobla: 0.3, cabeza: [-0.26, 0] };

export function generaTabla(base, meta, geo, E) {
  const hues = meta.slots, N0 = meta.frames, run = meta.clips.run, total = N0 + CJ.lanza * 120 + 5 + run.frames, T = new Float32Array(total * hues * 12); T.set(base.subarray(0, N0 * hues * 12));
  const esq = crearEsqueleto(base, hues, N0, geo.attributes.position.array, geo.attributes.aSkinI.array, geo.attributes.aSkinW.array);
  /* el andar encogido del testudo: los 50 fotogramas de andar, mezclados con el primero de reposo */
  const W0 = meta.clips.walk.start, nW = meta.clips.walk.frames, baseC = base.slice(0, N0 * hues * 12), L12 = hues * 12, R0 = meta.clips.idle.start * L12;
  for (let f = 0; f < nW; f++) { const o = (W0 + f) * L12; for (let i = 0; i < L12; i++) baseC[o + i] = base[o + i] * (1 - CORTO) + base[R0 + i] * CORTO; }
  const esqC = crearEsqueleto(baseC, hues, N0, geo.attributes.position.array, geo.attributes.aSkinI.array, geo.attributes.aSkinW.array), ponC = (fila, q, b) => T.set(esqC.postura(b, q), fila * hues * 12);
  /* el brazo del escudo al andar: la muñeca, quieta donde está en reposo (respecto al cuerpo) */
  const mR = esq.en(meta.clips.idle.start, HU.anteI, 'munecaI');
  const u = v => v.map(x => x / E), pon = (fila, q, b) => T.set(esq.postura(b, q), fila * hues * 12);
  const enModelo = q => { const o = { ...q }; if (q.baja) o.baja = q.baja / E; for (const k of ['manoI', 'manoD']) if (q[k]) o[k] = u(q[k]); return o; };
  const ROL = [
    { c: CJ.muro, baja: 0.22, dobla: 0.2, cab: -0.12, mano: [-0.01, MURO_Y, MURO_Z - 0.03], enc: [0, 0, -0.03] },
    { c: CJ.techo, baja: 0.14, dobla: 0.1, cab: 0.02, mano: [CORRE + 0.02, TECHO_Y - 0.1, TECHO_Z - 0.03], enc: [0, -0.05, 0] },
  ];
  for (let b = 0; b < 120; b++) {
    const m0 = esq.en(b, HU.anteI, 'munecaI').map(x => x * E);
    for (const R of ROL) {
      for (let j = 1; j <= 4; j++) {
        const p = j / 4, s = Math.sin(Math.PI * p), mano = [lerp(m0[0], R.mano[0], p) + 0.2 * s, lerp(m0[1], R.mano[1], p), lerp(m0[2], R.mano[2], p) + 0.18 * s];
        ponC(N0 + (R.c + j - 1) * 120 + b, { baja: R.baja * p / E, dobla: R.dobla * p, cabeza: [R.cab * p, 0], manoI: u(mano) }, b);
      }
      ponC(N0 + (R.c + 4) * 120 + b, { baja: (R.baja + 0.06) / E, dobla: R.dobla + 0.12, cabeza: [0.45, 0.22], manoI: u([R.mano[0] + R.enc[0], R.mano[1] + R.enc[1], R.mano[2] + R.enc[2]]) }, b);
    }
    const W = ROL[0];
    for (const [c, giro, tu] of [[CJ.miraD, -0.62, -0.12], [CJ.miraD + 1, -1.24, -0.24], [CJ.miraI, 0.55, 0.1], [CJ.miraI + 1, 1.1, 0.2]]) ponC(N0 + c * 120 + b, { baja: W.baja / E, dobla: W.dobla, tuerce: tu, cabeza: [-0.05, giro], manoI: u(W.mano) }, b);
    for (const k in POS) pon(N0 + CJ[k] * 120 + b, enModelo(POS[k]), b);
    pon(N0 + CJ.quieto * 120 + b, { manoI: mR }, b);
  }
  const L = N0 + CJ.lanza * 120;
  pon(L, { tuerce: -0.45, dobla: -0.1, manoD: u([-0.36, 1.78, -0.3]), poloD: [-0.6, -0.6, -0.5] }, 0);
  pon(L + 1, { tuerce: -0.1, dobla: 0.05, manoD: u([-0.3, 2.02, 0.05]), poloD: [-0.8, -0.4, -0.3] }, 0);
  pon(L + 2, { tuerce: 0.3, dobla: 0.22, manoD: u([-0.2, 1.85, 0.5]), poloD: [-0.8, -0.5, 0] }, 0);
  pon(L + 3, { tuerce: 0.45, dobla: 0.35, manoD: u([-0.02, 1.2, 0.5]) }, 0);
  pon(L + 4, { tuerce: -0.62, dobla: -0.14, baja: 0.06 / E, manoD: u([-0.42, 1.74, -0.52]), poloD: [-0.7, -0.5, -0.6] }, 0);
  const LC = L + 5;
  for (let f = 0; f < run.frames; f++) pon(LC + f, CARRERA, run.start + f);
  /* en qué punto de cada clip de ataque llega la mano más adelante: ahí es el golpe */
  const golpe = {};
  for (const n of ['attack_melee', 'attack_melee2']) { const c = meta.clips[n]; let mejor = 0, zm = -1e9; for (let f = 0; f < c.frames; f++) { const z = esq.en(c.start + f, HU.anteD, 'munecaD')[2]; if (z > zm) { zm = z; mejor = f; } } golpe[n] = mejor / (c.frames - 1); }
  return { T, esq, N0, hues, total, L, LC, golpe };
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
