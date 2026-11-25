/* AQVILA · FE2 · El soldado nuevo en la falange. PUNTO ÚNICO: aquí se decide quién sale y con qué gestos; escena.js solo lo pinta.
   Soldados (assets/soldados/, js/gfx/soldado.js; licencia en assets/soldados/LICENSE.txt): cuerpo y esqueleto de MakeHuman (CC0),
   movimientos de Quaternius (CC0), equipo hecho por código en AQVILA.
     tu falange: el falangita macedonio de FA2 y, en tu puesto, su oficial (penacho y plumas blancas: ya no hace falta la cresta).
     la espada:  la del peltasta (puño, guarda y hoja) en la mano derecha; su vaina, pasada al costado izquierdo (se envaina a la izquierda).
     la escolta de los elefantes: el peltasta nuevo (ver rival.js, crearTropaNueva).
   GESTOS hechos por cuentas sobre la textura de movimientos (filas nuevas detrás de las del modelo; los brazos se resuelven con dos
   huesos, como esqueleto.js de TP7a): la sarisa bajada de cada una de las cinco filas (a la altura de su carril de formacion.js), la
   estocada, soltar la pica rota y sacar la espada, la guardia con espada y el tajo. Sin arte nuevo.
   COSTE: tres niveles de detalle por distancia a la cámara (cerca, _lejos, _muylejos), el oficial aparte, la espada de los de cerca
   aparte; las sombras, de la figura más sencilla en una malla que solo pinta la sombra.
   Corre en el navegador (necesita three); las cuentas de las posturas no tocan la pantalla. */
import { THREE } from '../../../js/gfx/models.js';
import { cargarSoldado, tropa, PUEBLOS, gama } from '../../../js/gfx/soldado.js';
import { mul, punto, gira } from './esqueleto.js';

export const SOLDADOS = {
  falange: { tropa: 'falangita', oficial: 'oficial-falange', color: '#3a64a8' },
  espada: 'peltasta',
  escolta: 'peltasta',
};
/* niveles de detalle que usa la falange (de js/gfx/soldado.js: '', _lejos, _muylejos, _fondo) y cuántos hombres van en cada uno,
   los más cercanos a la cámara primero (el resto, en el último) */
export const NIVELES_F = [0, 2], CUANTOS = [10];

/* ---------- cuentas con matrices 3×4 (las de esqueleto.js) ---------- */
const resta = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], suma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], por = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const esc = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const largo = a => Math.hypot(a[0], a[1], a[2]), uno = a => { const l = largo(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mezcla3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const ss = t => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };
function giraDe(c, u, v) {
  u = uno(u); v = uno(v); const e = cruz(u, v), s = largo(e), k = esc(u, v);
  if (s < 1e-6) return k > 0 ? [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0] : gira(c, Math.abs(u[0]) < 0.9 ? cruz(u, [1, 0, 0]) : cruz(u, [0, 1, 0]), Math.PI);
  return gira(c, e, Math.atan2(s, k));
}
function codo(a, b, l1, l2, polo) {
  let d = resta(b, a), L = largo(d); const max = (l1 + l2) * 0.985, min = Math.abs(l1 - l2) * 1.05 + 0.01;
  if (L > max) { d = por(d, max / L); L = max; } if (L < min) { d = por(uno(L ? d : [0, 0, 1]), min); L = min; }
  const u = por(d, 1 / L), x = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let p = resta(polo, por(u, esc(polo, u))); if (largo(p) < 1e-5) p = cruz(u, [1, 0, 0]); p = uno(p);
  return { medio: suma(a, suma(por(u, x), por(p, h))), fin: suma(a, d) };
}

/* ---------- el esqueleto de MakeHuman (74 huesos; +X es la izquierda del hombre, +Z delante, metros) ---------- */
export function crearEsqueletoNuevo(T, nb, huesos, geo, punos) {
  const P = geo.position, SI = geo.aSkinI, SW = geo.aSkinW, nv = P.length / 3, H = n => huesos.indexOf(n);
  const filas = T.length / (nb * 12);
  const mat = (fila, h) => { const o = (fila * nb + h) * 12, m = new Array(12); for (let i = 0; i < 12; i++) m[i] = T[o + i]; return m; };
  /* la articulación entre dos huesos: el punto que los dos llevan al mismo sitio en todos los fotogramas (como en esqueleto.js) */
  function junta(a, b) {
    let c = [0, 0, 0], n = 0;
    for (let i = 0; i < nv; i++) { let wa = 0, wb = 0; for (let k = 0; k < 4; k++) { if (SI[i * 4 + k] === a) wa += SW[i * 4 + k]; if (SI[i * 4 + k] === b) wb += SW[i * 4 + k]; } const w = Math.min(wa, wb); if (w > 20) { c[0] += P[i * 3] * w; c[1] += P[i * 3 + 1] * w; c[2] += P[i * 3 + 2] * w; n += w; } }
    if (!n) throw new Error('FE2: los huesos ' + huesos[a] + ' y ' + huesos[b] + ' no comparten vértices');
    c = por(c, 1 / n);
    const N = [0, 0, 0, 0, 0, 0, 0, 0, 0], t = [0, 0, 0], lam = 0.02 * filas;
    for (let f = 0; f < filas; f += 2) { const A = mat(f, a), B = mat(f, b);
      for (let r = 0; r < 3; r++) { const d = [A[r * 4] - B[r * 4], A[r * 4 + 1] - B[r * 4 + 1], A[r * 4 + 2] - B[r * 4 + 2]], e = -(A[r * 4 + 3] - B[r * 4 + 3]); for (let i = 0; i < 3; i++) { t[i] += d[i] * e; for (let j = 0; j < 3; j++) N[i * 3 + j] += d[i] * d[j]; } } }
    for (let i = 0; i < 3; i++) { N[i * 4] += lam; t[i] += lam * c[i]; }
    const det = m => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]), D = det(N), p = [0, 0, 0];
    for (let k = 0; k < 3; k++) { const m = N.slice(); for (let r = 0; r < 3; r++) m[r * 3 + k] = t[r]; p[k] = det(m) / D; }
    return p;
  }
  const lado = s => ({
    brazo: [H('upperarm01.' + s), H('upperarm02.' + s)],
    ante: huesos.map((n, i) => /^(lowerarm0[12]|wrist|finger|metacarpal)/.test(n) && n.endsWith('.' + s) ? i : -1).filter(i => i >= 0),
    hombro: junta(H('shoulder01.' + s), H('upperarm01.' + s)), codo: junta(H('upperarm02.' + s), H('lowerarm01.' + s)), muneca: junta(H('lowerarm02.' + s), H('wrist.' + s)),
    mano: huesos.map((n, i) => /^(wrist|finger|metacarpal)/.test(n) && n.endsWith('.' + s) ? i : -1).filter(i => i >= 0),
    hB: H('upperarm01.' + s), hA: H('lowerarm02.' + s), hM: H('wrist.' + s),
    dedos: dedosDe(s),
  });
  /* FU3c: los dedos para cerrar el puño: por cada dedo, sus tres falanges con la articulación (en reposo) donde se doblan */
  function dedosDe(s) {
    const out = [];
    for (let n = 1; n <= 5; n++) {
      let prev = n < 5 ? H('metacarpal' + n + '.' + s) : H('wrist.' + s);
      for (let k = 1; k <= 3; k++) {
        const cur = H('finger' + n + '-' + k + '.' + s); if (cur < 0 || prev < 0) break;
        let piv = null; try { piv = junta(prev, cur); } catch (e) { piv = null; }
        out.push({ h: cur, n, k, piv }); prev = cur;
      }
    }
    return out;
  }
  const B = { D: lado('R'), I: lado('L') };
  /* el puño: el centro de los dedos de cada mano en reposo (vértices casi enteros de sus huesos) */
  const puno = s => { const c = [0, 0, 0]; let n = 0; for (let i = 0; i < nv; i++) { const nm = huesos[SI[i * 4]]; if (SW[i * 4] > 200 && /^(finger|metacarpal)/.test(nm) && nm.endsWith('.' + s)) { c[0] += P[i * 3]; c[1] += P[i * 3 + 1]; c[2] += P[i * 3 + 2]; n++; } } return por(c, 1 / Math.max(1, n)); };
  /* el esqueleto sencillo (36 huesos, niveles lejanos) no tiene dedos: usa los puños del fino (mismo cuerpo en reposo) */
  B.D.puno = punos ? punos.D : puno('R'); B.I.puno = punos ? punos.I : puno('L');
  const en = (fila, h, p) => punto(mat(fila, h), p);
  /* una postura nueva desde la fila base: q = { manoD, manoI } (dónde va el PUÑO, en el modelo), poloD, poloI (hacia dónde sale el codo),
     y si se da, dirD = hacia dónde apunta lo que lleva en la mano derecha (la hoja de la espada): la mano gira sobre el puño */
  function postura(base, q) {
    const X = new Array(nb).fill(null);
    const brazo = (b, blanco, polo, dir, cierra, sgn) => {
      if (!blanco) return;
      const s0 = en(base, b.hB, b.hombro), c0 = en(base, b.hB, b.codo), m0 = en(base, b.hA, b.muneca), p0 = en(base, b.hA, b.puno);
      const objetivo = suma(blanco, resta(m0, p0));      /* la muñeca va donde el puño, con el mismo desfase que en la base */
      const r = codo(s0, objetivo, largo(resta(c0, s0)), largo(resta(m0, c0)), polo);
      const xb = giraDe(s0, resta(c0, s0), resta(r.medio, s0));
      const xa = mul(giraDe(r.medio, resta(punto(xb, m0), r.medio), resta(r.fin, r.medio)), xb);
      for (const h of b.brazo) X[h] = xb; for (const h of b.ante) X[h] = xa;
      if (cierra && !dir) {   /* FU3c: puño cerrado: cada dedo se dobla hacia la palma en sus articulaciones (eje a lo ancho de la mano) */
        const Mm = mul(xa, mat(base, b.hM)), eje = [0, 0, sgn], ax = [Mm[0] * eje[0] + Mm[1] * eje[1] + Mm[2] * eje[2], Mm[4] * eje[0] + Mm[5] * eje[1] + Mm[6] * eje[2], Mm[8] * eje[0] + Mm[9] * eje[1] + Mm[10] * eje[2]];
        const ANG = { 1: [0.5, 0.5, 0.4], 2: [1.15, 1.3, 0.9], 3: [1.2, 1.35, 0.95], 4: [1.2, 1.35, 0.95], 5: [1.15, 1.3, 0.9] };
        const rs = {};
        for (const d of b.dedos) { if (!d.piv) continue; const Mh = mul(xa, mat(base, d.h)); rs[d.n] = rs[d.n] || [];
          rs[d.n].push({ d, R: gira(punto(Mh, d.piv), ax, ANG[d.n][d.k - 1] * cierra) }); }
        for (const n in rs) { const l = rs[n]; for (let i = 0; i < l.length; i++) { let m = xa; for (let j = i; j >= 0; j--) m = mul(l[j].R, m); X[l[i].d.h] = m; } }
      }
      if (dir) {   /* la hoja: del puño a la punta en reposo (ESPADA), girada hasta dir alrededor del puño */
        const Mw = mul(xa, mat(base, b.hM)), p1 = punto(Mw, ESPADA.puno), p2 = punto(Mw, ESPADA.punta), xm = mul(giraDe(p1, resta(p2, p1), dir), xa);
        for (const h of b.mano) X[h] = xm;
      }
    };
    brazo(B.D, q.manoD, q.poloD || [-0.7, -0.7, -0.1], q.dirD, q.cierra, 1);
    brazo(B.I, q.manoI, q.poloI || [0.8, -0.6, 0], undefined, q.cierra, -1);
    const out = new Float32Array(nb * 12);
    for (let h = 0; h < nb; h++) out.set(X[h] ? mul(X[h], mat(base, h)) : mat(base, h), h * 12);
    return out;
  }
  return { B, mat, en, postura, junta };
}

/* ---------- la tabla de la falange: filas del modelo y, detrás, los conjuntos de gestos ----------
   BAJA r (r = 0–4): la sarisa bajada en el carril de la fila r (117 filas: los 76 fotogramas de «quieto» y los 41 de «andar»)
   GOLPE: la estocada de la primera fila (117) · SACA: soltar la pica y sacar la espada (16) · GUARDIA: espada en guardia (76, sobre
   «quieto») · TAJO: la estocada con espada (10). */
export const CJ = { baja: 0, golpe: 5, n: 6, filas: 117, saca: 16, guardia: 76, tajo: 10 };
export function generaTabla(T0, j, geo, carril, punos) {
  const nb = j.huesos.length, N0 = j.cuadros, C = j.clips;
  const total = N0 + CJ.n * CJ.filas + CJ.saca + CJ.guardia + CJ.tajo, T = new Float32Array(total * nb * 12); T.set(T0.subarray(0, N0 * nb * 12));
  const esq = crearEsqueletoNuevo(T0.subarray(0, N0 * nb * 12), nb, j.huesos, geo, punos);
  const pon = (fila, base, q) => T.set(esq.postura(base, q), fila * nb * 12);
  const bases = [...Array(C.quieto.n)].map((_, i) => C.quieto.ini + i).concat([...Array(C.andar.n)].map((_, i) => C.andar.ini + i));
  /* dónde van los puños: la mano de atrás (derecha) en el carril y la de delante 42 cm más allá, por el mismo lado */
  const bajaQ = r => { const c = carril(r); return { manoD: [-c.x, c.y - 0.03, -0.12], manoI: [-c.x + 0.03, c.y - 0.01, 0.30], cierra: 1 }; };
  const GOLPE = { manoD: [-0.17, 1.0, 0.24], manoI: [-0.15, 1.03, 0.66], cierra: 1 };
  bases.forEach((b, k) => { for (let r = 0; r < 5; r++) pon(N0 + (CJ.baja + r) * CJ.filas + k, b, bajaQ(r)); pon(N0 + CJ.golpe * CJ.filas + k, b, GOLPE); });
  /* la espada: puño en la empuñadura de la vaina (costado izquierdo), luego arriba y a la guardia */
  const q0 = C.quieto.ini, vainaEn = esq.en(q0, j.huesos.indexOf('root'), PUNO_VAINA), GUARD = { manoD: [-0.2, 1.14, 0.36], manoI: [0.2, 1.1, 0.2], dirD: uno([0.05, 0.92, 0.4]) };   /* BT1: la hoja alzada (66°) y el escudo 10 cm más pegado al cuerpo: delante de él y sin llegar al que tiene delante en diagonal (antes 25° y 0,30) */
  const D_ARRIBA = uno([0.05, 0.95, 0.3]), D_VAINA = uno([0.13, -0.97, -0.17]);   /* D_VAINA: el eje de la vaina, hacia abajo y atrás */   /* la hoja sale de la vaina hacia arriba y baja al frente, a la guardia */
  const b0 = bajaQ(0), ARRIBA = [-0.04, 1.4, 0.12];
  const camino = u => {
    if (u < 0.45) { const t = ss(u / 0.45); return { manoD: mezcla3(b0.manoD, suma(vainaEn, [0.02, 0.02, 0.04]), t), manoI: mezcla3(b0.manoI, GUARD.manoI, t), poloD: [-0.5, -0.5, -0.7], dirD: D_VAINA }; }
    if (u < 0.72) { const t = ss((u - 0.45) / 0.27); return { manoD: mezcla3(suma(vainaEn, [0.02, 0.02, 0.04]), ARRIBA, t), manoI: GUARD.manoI, poloD: [-0.8, -0.3, -0.5], dirD: uno(mezcla3(D_VAINA, D_ARRIBA, t)) }; }
    const t = ss((u - 0.72) / 0.28); return { manoD: mezcla3(ARRIBA, GUARD.manoD, t), manoI: GUARD.manoI, poloD: [-0.8, -0.5, -0.2], dirD: uno(mezcla3(D_ARRIBA, GUARD.dirD, t)) };
  };
  const F_SACA = N0 + CJ.n * CJ.filas, F_GUARD = F_SACA + CJ.saca, F_TAJO = F_GUARD + CJ.guardia;
  for (let k = 0; k < CJ.saca; k++) pon(F_SACA + k, q0, camino(k / (CJ.saca - 1)));
  for (let k = 0; k < CJ.guardia; k++) pon(F_GUARD + k, C.quieto.ini + k, GUARD);
  for (let k = 0; k < CJ.tajo; k++) { const t = Math.sin(Math.PI * k / (CJ.tajo - 1)); pon(F_TAJO + k, q0, { manoD: mezcla3(GUARD.manoD, [-0.1, 1.24, 0.86], t), manoI: mezcla3(GUARD.manoI, [0.2, 1.1, 0.2], t), poloD: [-0.8, -0.5, -0.2], dirD: uno(mezcla3(GUARD.dirD, [0.05, 0.12, 0.99], t)) }); }
  /* la fila del conjunto c que corresponde a una fila de «quieto» o «andar» del modelo (las demás, sin conjunto: se quedan) */
  const fila = (c, b) => b >= C.quieto.ini && b < C.quieto.ini + C.quieto.n ? N0 + c * CJ.filas + (b - C.quieto.ini)
    : b >= C.andar.ini && b < C.andar.ini + C.andar.n ? N0 + c * CJ.filas + C.quieto.n + (b - C.andar.ini) : b;
  return { T, nb, N0, total, esq, fila, F_SACA, F_GUARD, F_TAJO };
}
/* la espada del peltasta en su mano, en reposo (centros de las piezas espada_puno y espada_hoja de assets/soldados/peltasta) */
const ESPADA = { puno: [-0.515, 0.977, 0.255], punta: [-0.34, 1.18, 0.475] };
/* la empuñadura de la espada envainada: la del peltasta (a su derecha, x = -0,217) pasada a la izquierda, en reposo */
const PUNO_VAINA = [0.217, 1.09, 0.035];

/* ---------- sombreadores ---------- */
/* la sombra de un soldado nuevo: la misma piel que js/gfx/soldado.js (filas A y B de la textura, mezcla, piezas ocultas) */
const SK_SOMBRA = `attribute vec4 aSkinI; attribute vec4 aSkinW; attribute float aSet; attribute vec3 aCuadro; attribute float aMuestra; uniform sampler2D uHuesos;
mat4 huesoS(float h, int f) { int x = int(h + 0.5) * 3; vec4 a = texelFetch(uHuesos, ivec2(x, f), 0), b = texelFetch(uHuesos, ivec2(x + 1, f), 0), c = texelFetch(uHuesos, ivec2(x + 2, f), 0);
  return mat4(vec4(a.x, b.x, c.x, 0.0), vec4(a.y, b.y, c.y, 0.0), vec4(a.z, b.z, c.z, 0.0), vec4(a.w, b.w, c.w, 1.0)); }
mat4 pielS(int f) { mat4 m = huesoS(aSkinI.x, f) * aSkinW.x; if (aSkinW.y > 0.0) m += huesoS(aSkinI.y, f) * aSkinW.y; if (aSkinW.z > 0.0) m += huesoS(aSkinI.z, f) * aSkinW.z; if (aSkinW.w > 0.0) m += huesoS(aSkinI.w, f) * aSkinW.w; return m; }
`;
function matSombra(tex) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => { sh.uniforms.uHuesos = { value: tex }; sh.vertexShader = SK_SOMBRA + sh.vertexShader.replace('#include <begin_vertex>', `mat4 sk = pielS(int(aCuadro.x + 0.5)); if (aCuadro.z > 0.001) sk = sk * (1.0 - aCuadro.z) + pielS(int(aCuadro.y + 0.5)) * aCuadro.z;
    float oculto = (aSet > 0.5 && mod(floor(aMuestra / exp2(aSet - 1.0) + 0.001), 2.0) < 0.5) ? 0.0 : 1.0; vec3 transformed = (sk * vec4(position, 1.0)).xyz * oculto;`); };
  m.customProgramCacheKey = () => 'fe2-sombra'; return m;
}
/* el material de un nivel con otra textura de huesos (la tabla de la falange): un clon que la cambia al compilar */
function conHuesos(mat, tex) {
  const m = mat.clone(), ob = mat.onBeforeCompile; m.onBeforeCompile = (sh, r) => { ob(sh, r); sh.uniforms.uHuesos = { value: tex }; };
  m.customProgramCacheKey = mat.customProgramCacheKey; return m;
}
function texTabla(T, nb) { const t = new THREE.DataTexture(T, nb * 3, T.length / (nb * 12), THREE.RGBAFormat, THREE.FloatType); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; }

/* ---------- la espada: solo puño, guarda y hoja del peltasta (en la mano) y su vaina con la espada dentro, pasada a la izquierda ---------- */
function geoEspada(nv) {
  const piezas = nv.j.piezas || {}, idx = nv.geo.index.array, A = nv.geo.attributes, usa = new Map(), tris = [], setNuevo = [], espejo = [];
  let t = 0;
  for (const [nom, n] of Object.entries(piezas)) {
    const mano = /^espada_(puno|guarda|hoja)$/.test(nom), funda = /^(vaina|espada_env_)/.test(nom);
    if (mano || funda) for (let k = t * 3; k < (t + n) * 3; k++) { const v = idx[k]; if (!usa.has(v)) { usa.set(v, usa.size); setNuevo.push(mano ? 2 : nom === 'vaina' ? 0 : 1); espejo.push(funda); } tris.push(usa.get(v)); }
    t += n;
  }
  const g = new THREE.BufferGeometry(), vs = [...usa.keys()];
  for (const k of ['position', 'normal', 'uv', 'aSkinI', 'aSkinW']) {
    const a = A[k], s = a.itemSize, arr = new a.array.constructor(vs.length * s);
    vs.forEach((v, j) => { for (let c = 0; c < s; c++) arr[j * s + c] = a.array[v * s + c]; if (espejo[j] && (k === 'position' || k === 'normal')) arr[j * s] = -arr[j * s]; });
    g.setAttribute(k, new THREE.BufferAttribute(arr, s, a.normalized));
  }
  g.setAttribute('aSet', new THREE.BufferAttribute(new Uint8Array(setNuevo), 1));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(tris), 1)); g.computeBoundingBox();
  return { ...nv, geo: g };
}

/* ---------- la falange entera ----------
   crearFalangitas({ escena, cap, carril }) → null si no carga (la escena sigue con el falangita de 0 A.D.)
   La figura que devuelve habla como la de la escena: C (clips con start, frames, dur, loop), tab { T, hues, fila }, paso, pies… y
   además ancla (dónde está la mano, el escudo, el pecho y la cabeza en reposo) y pinta(lista, yo, camara). */
export async function crearFalangitas({ escena, cap, carril, sombra = true }) {
  const S = SOLDADOS.falange, pal = gama(S.color, PUEBLOS.falangita);
  const [F, O, P] = await Promise.all([cargarSoldado(S.tropa, pal), cargarSoldado(S.oficial, Object.assign({}, pal, { escudos: PUEBLOS.falangita.escudos })), cargarSoldado(SOLDADOS.espada)]);
  if (!F || !O) { console.warn('[FE2] no cargó el falangita nuevo: sigue el de 0 A.D.'); return null; }
  const nv0 = F.niveles[0], j = nv0.j, nb = j.huesos.length, H = n => j.huesos.indexOf(n);
  /* dos tablas con las mismas filas: la del esqueleto fino (74 huesos: cerca, el oficial y la espada) y la del sencillo (36: lejos) */
  const h2f = THREE.DataUtils.fromHalfFloat, aFloat = c => { const T = new Float32Array(c.length); for (let i = 0; i < T.length; i++) T[i] = h2f(c[i]); return T; };
  const geoDe = nv => { const a = nv.geo.attributes; return { position: a.position.array, aSkinI: a.aSkinI.array, aSkinW: a.aSkinW.array }; };
  const ga = nv0.geo.attributes, tab = generaTabla(aFloat(nv0.crudo), j, geoDe(nv0), carril), tex = texTabla(tab.T, nb);
  const nv1 = F.niveles[1], tab36 = generaTabla(aFloat(nv1.crudo), nv1.j, geoDe(nv1), carril, { D: tab.esq.B.D.puno, I: tab.esq.B.I.puno }), tex36 = texTabla(tab36.T, nv1.j.huesos.length), mSombra = matSombra(tex36);
  if (tab36.total !== tab.total) throw new Error('FE2: las dos tablas no casan');
  /* las mallas: tres niveles de tropa, el oficial (cerca) y la espada de los de cerca; la sombra, del nivel _fondo */
  const malla = (nv, n, mat) => { const t = tropa(Object.assign({}, nv, { mat }), n); t.malla.castShadow = false; t.malla.receiveShadow = true; escena.add(t.malla); return t; };
  const texDe = nv => nv.j.huesos.length === nb ? tex : tex36;
  const niveles = NIVELES_F.map(k => malla(F.niveles[k], cap, conHuesos(F.niveles[k].mat, texDe(F.niveles[k]))));
  const oficial = malla(O.niveles[0], 1, conHuesos(O.niveles[0].mat, texDe(O.niveles[0])));
  const espada = P ? malla(geoEspada(P.niveles[0]), CUANTOS[0] + 25, conHuesos(P.niveles[0].mat, tex)) : null;
  /* la hoja brilla un poco por sí misma: a contraluz (el sol de la escena viene de frente) el hierro salía negro */
  if (espada) { const m = espada.malla.material; m.emissive = new THREE.Color(0.42, 0.4, 0.37); m.emissiveMap = m.map; }
  /* la sombra: nivel _fondo de todos (y el oficial), solo en el mapa de sombras (ver soloSombra) */
  const sombraT = sombra ? malla(F.niveles[3], cap + 1, conHuesos(F.niveles[3].mat, tex36)) : null;
  if (typeof window !== 'undefined') window.__fe2 = { niveles, oficial, espada, sombra: sombraT };   /* para revisar en el navegador */
  if (sombraT) { sombraT.malla.castShadow = true; sombraT.malla.receiveShadow = false; sombraT.malla.customDepthMaterial = mSombra; soloSombra(sombraT.malla); }
  /* clips con la forma de los de 0 A.D. (start, frames, dur, loop) para la locomoción de la escena */
  const clip = c => ({ start: c.ini, frames: c.n - 1, dur: (c.n - 1) / c.fps, loop: !!c.bucle, fps: c.fps });
  const C = { idle: clip(j.clips.quieto), walk: clip(j.clips.andar), run: clip(j.clips.correr), death: clip(j.clips.morir), guardia: clip(j.clips.guardia) };
  C.death.frames = j.clips.morir.n; C.death.dur = j.clips.morir.n / j.clips.morir.fps;
  /* puntos de anclaje en reposo: el puño derecho (la sarisa), el centro del escudo, el pecho y lo alto de la cabeza */
  const cen = (re, peso = 200) => { const P = ga.position.array, SI = ga.aSkinI.array, SW = ga.aSkinW.array, c = [0, 0, 0]; let n = 0; for (let i = 0; i < P.length / 3; i++) if (SW[i * 4] > peso && re.test(j.huesos[SI[i * 4]])) { c[0] += P[i * 3]; c[1] += P[i * 3 + 1]; c[2] += P[i * 3 + 2]; n++; } return por(c, 1 / Math.max(1, n)); };
  const piezaCen = nom => { const pz = j.piezas, idx = nv0.geo.index.array, P = ga.position.array; let t = 0; const c = [0, 0, 0]; let n = 0; for (const [k, m] of Object.entries(pz)) { if (k === nom) for (let i = t * 3; i < (t + m) * 3; i++) { const v = idx[i]; c[0] += P[v * 3]; c[1] += P[v * 3 + 1]; c[2] += P[v * 3 + 2]; n++; } t += m; } return por(c, 1 / Math.max(1, n)); };
  const ancla = { manoD: [H('wrist.R'), tab.esq.B.D.puno], escudo: [H('lowerarm01.L'), piezaCen('escudo_frente')], pecho: [H('spine02'), cen(/^spine02$/)], cabeza: [H('head'), [0, 1.72, 0.02]] };

  console.log(`[FE2] soldado nuevo: ${F.niveles.map(n => n.j.tris).join(' / ')} triángulos por nivel; tabla de ${tab.total} filas`);

  /* variación de cada hombre (tela, piel, pelo, escudo): fija por hombre, aunque cambie de nivel o de hueco */
  const varDe = h => h.vv || (h.vv = [0, 1, 2, 3].map(k => { const v = Math.sin((h.i + 1) * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); }));
  const cu = t => t.malla.geometry.attributes.aCuadro, mu = t => t.malla.geometry.attributes.aMuestra;
  function poner(t, i, h) { t.matriz(i, h.inst.elements); t.vars(i, varDe(h)); cu(t).setXYZ(i, h.A, h.B, h.mx); mu(t).setX(i, 0); }
  function fin(t) { t.malla.instanceMatrix.needsUpdate = true; cu(t).needsUpdate = true; mu(t).needsUpdate = true; t.malla.geometry.attributes.aVar.needsUpdate = true; }
  const fig = {
    nuevo: true, esc: 1, C, tab: { T: tab.T, hues: nb, fila: tab.fila, total: tab.total }, T: tab.T, hues: nb, j, tabla: tab, ancla, niveles, oficial, espada, sombra: sombraT,
    /* geometría para los pies (datosPies de soldado.js) */
    geoPies: { attributes: { position: { array: ga.position.array, count: ga.position.count }, aSkinI: { array: ga.aSkinI.array }, aSkinW: { array: ga.aSkinW.array } } },
    /* cada fotograma: los hombres (con h.inst, h.A, h.B, h.mx ya puestos), tu índice y la cámara. espadaDe(h) → 0 sin espada, 1 envainada, 2 en la mano */
    pinta(lista, yo, cp, espadaDe) {
      for (const h of lista) h.dCam = (h.x - cp.x) ** 2 + (h.z - cp.z) ** 2;
      const orden = lista.filter(h => h !== yo).sort((a, b) => a.dCam - b.dCam);
      for (const t of niveles) t.limpiar(); oficial.limpiar(); if (espada) espada.limpiar(); if (sombraT) sombraT.limpiar();
      orden.forEach((h, k) => { let n = 0; for (let a = CUANTOS[0]; n < CUANTOS.length && k >= a; a += CUANTOS[++n] || 0); const t = niveles[Math.min(n, niveles.length - 1)]; poner(t, t.sig(), h); });
      if (yo) poner(oficial, oficial.sig(), yo);
      /* la espada: primero los que la tienen en la mano (estén donde estén, los más cercanos antes), luego la envainada de los de cerca */
      if (espada) { const todos = (yo ? [yo] : []).concat(orden), e2 = todos.filter(h => espadaDe && espadaDe(h) === 2), e1 = todos.slice(0, CUANTOS[0] + 1).filter(h => !espadaDe || espadaDe(h) === 1);
        for (const h of e2.concat(e1)) { const i = espada.sig(); if (i < 0) break; poner(espada, i, h); mu(espada).setX(i, espadaDe ? espadaDe(h) : 1); } }
      if (sombraT) for (const h of lista) if (h.vivo || h.caido) poner(sombraT, sombraT.sig(), h);
      for (const t of niveles.concat([oficial], espada ? [espada] : [], sombraT ? [sombraT] : [])) fin(t);
      for (const t of niveles.concat([oficial], espada ? [espada] : [])) t.malla.visible = t.malla.count > 0;   /* sin hombres, sin llamada */
    },
    triangulos() { return niveles.reduce((s, t) => s + t.malla.count * t.s.j.tris, 0) + oficial.malla.count * oficial.s.j.tris + (espada ? espada.malla.count * espada.s.geo.index.count / 3 : 0); },
  };
  return fig;
}

/* una malla que solo pinta su sombra: en el paso de color no dibuja nada (sin llamada: se oculta antes y se enseña para el mapa de sombras).
   Lo hace el gancho onBeforeShadow / onAfterShadow de la escena (ver activaSoloSombra). */
const SOLO_SOMBRA = new Set();
function soloSombra(m) { SOLO_SOMBRA.add(m); m.visible = false; }
/* la escena llama a esto con su renderer: pinta las sombras con las mallas «solo sombra» visibles y luego el color sin ellas */
export function activaSoloSombra(renderer) {
  const sm = renderer.shadowMap, render0 = sm.render.bind(sm);
  sm.render = (luces, escena, camara) => { for (const m of SOLO_SOMBRA) m.visible = true; try { render0(luces, escena, camara); } finally { for (const m of SOLO_SOMBRA) m.visible = false; } };
}

/* el falangita que sale en una fila r (0 delante) con la sarisa bajada k (0–1), quieto o andando, o muerto:
   las filas A y B de la tabla y su mezcla. base(h) = [A, B, mx] del paso (filasMarcha de soldado.js). */
export function filasNuevo(fig, h, T, base, frameOnce) {
  const C = fig.C, tb = fig.tabla;
  if (!h.vivo) { const t = Math.max(0, T - h.muere); h.A = h.B = frameOnce(C.death, t); h.mx = 0; return; }
  /* la pica rota: suelta el muñón, saca la espada y queda en guardia (con algún tajo) */
  if (h.tRotaD !== undefined && !h.huye) { const u = T - h.tRotaD; if (u >= 0) { espadaFilas(fig, h, u, T); return; } }
  let [A, B, mx] = base;
  const r = Math.min(4, h.r), k = h.huye ? 0 : h.kB, fila = tb.fila;
  if (k <= 0.002) { h.A = A; h.B = B; h.mx = mx; return; }
  const b = mx < 0.5 ? A : B, c0 = CJ.baja + r;
  if (k >= 0.998 && !(h.kG > 0.002)) { h.A = fila(c0, A); h.B = fila(c0, B); h.mx = mx; return; }
  if (k >= 0.998) { h.A = fila(c0, b); h.B = fila(CJ.golpe, b); h.mx = h.kG; return; }
  h.A = b; h.B = fila(c0, b); h.mx = ss(k);
}
/* los tiempos del gesto (s desde que se parte la pica): sujeta el muñón, lo suelta, saca la espada, guardia */
export const GESTO = { suelta: 0.3, saca: 0.75, fin: 1.3 };
function espadaFilas(fig, h, u, T) {
  const tb = fig.tabla, C = fig.C, r = Math.min(4, h.r);
  if (u < GESTO.suelta) { const b = C.idle.start; h.A = h.B = tb.fila(CJ.baja + r, b); h.mx = 0; return; }
  if (u < GESTO.suelta + GESTO.saca * 0.25) {   /* de su carril al camino de la espada (que empieza en el carril de la primera fila) */
    const t = (u - GESTO.suelta) / (GESTO.saca * 0.25); h.A = tb.fila(CJ.baja + r, C.idle.start); h.B = tb.F_SACA; h.mx = ss(t); return; }
  if (u < GESTO.suelta + GESTO.saca) { const x = (u - GESTO.suelta) / GESTO.saca * (CJ.saca - 1), a = Math.min(CJ.saca - 2, Math.floor(x)); h.A = tb.F_SACA + a; h.B = h.A + 1; h.mx = Math.min(1, x - a); return; }
  /* en guardia: respira con «quieto»; cada 2,2 s (cada uno a su ritmo) un tajo de 0,45 s */
  const tq = (T + (h.fase || 0)) % C.idle.dur, f = Math.floor(tq / C.idle.dur * (CJ.guardia - 1));
  const per = 2.2 + (h.i % 5) * 0.17, tt = (u - GESTO.suelta - GESTO.saca + (h.i % 7) * 0.3) % per;
  if (u > GESTO.fin + 0.4 && tt < 0.45) { const x = tt / 0.45 * (CJ.tajo - 1), a = Math.min(CJ.tajo - 2, Math.floor(x)); h.A = tb.F_TAJO + a; h.B = h.A + 1; h.mx = x - a; return; }
  if (u < GESTO.suelta + GESTO.saca + 0.12) { h.A = tb.F_SACA + CJ.saca - 1; h.B = tb.F_GUARD + f; h.mx = ss((u - GESTO.suelta - GESTO.saca) / 0.12); return; }
  h.A = tb.F_GUARD + f; h.B = tb.F_GUARD + Math.min(CJ.guardia - 1, f + 1); h.mx = tq / C.idle.dur * (CJ.guardia - 1) - f;
}
/* qué se ve de la espada de un hombre: 1 envainada, 2 en la mano (desde que la saca de la vaina) */
export const espadaVista = (h, T) => h.tRotaD !== undefined && !h.huye && h.vivo && T - h.tRotaD >= GESTO.suelta + GESTO.saca * 0.45 ? 2 : 1;
