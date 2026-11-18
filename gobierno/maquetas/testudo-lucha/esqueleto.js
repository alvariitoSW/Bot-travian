/* Maqueta GM43c «Testudo a pie»: posturas nuevas para el hastatus de 0 A.D., hechas por cuentas (sin arte nuevo).
   El modelo trae sus animaciones horneadas como una tabla: una fila por fotograma y, en cada fila, una matriz 3×4 por hueso.
   Aquí se añaden filas: se parte de un fotograma de «idle» o «walk» y se le dobla la cintura, se le bajan las caderas
   (las rodillas se resuelven solas para que el pie no se mueva), se le gira la cabeza y se le lleva la mano adonde está
   el asa del escudo. Todo son cuentas con matrices: corre igual en Node (pruebas) y en el navegador. No toca js/. */

/* ---------- matrices 3×4 (fila a fila) ---------- */
export const ident = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
export function mul(a, b) {
  const o = new Array(12);
  for (let r = 0; r < 3; r++) {
    const a0 = a[r * 4], a1 = a[r * 4 + 1], a2 = a[r * 4 + 2];
    o[r * 4] = a0 * b[0] + a1 * b[4] + a2 * b[8]; o[r * 4 + 1] = a0 * b[1] + a1 * b[5] + a2 * b[9];
    o[r * 4 + 2] = a0 * b[2] + a1 * b[6] + a2 * b[10]; o[r * 4 + 3] = a0 * b[3] + a1 * b[7] + a2 * b[11] + a[r * 4 + 3];
  }
  return o;
}
export const punto = (m, p) => [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3], m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7], m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11]];
const resta = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], suma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], por = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const esc = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const largo = a => Math.hypot(a[0], a[1], a[2]), uno = a => { const l = largo(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const traslada = t => [1, 0, 0, t[0], 0, 1, 0, t[1], 0, 0, 1, t[2]];
/* giro de «ang» radianes alrededor del eje «eje» que pasa por el punto «c» */
export function gira(c, eje, ang) {
  const [x, y, z] = uno(eje), s = Math.sin(ang), k = Math.cos(ang), t = 1 - k;
  const R = [t * x * x + k, t * x * y - s * z, t * x * z + s * y, 0, t * x * y + s * z, t * y * y + k, t * y * z - s * x, 0, t * x * z - s * y, t * y * z + s * x, t * z * z + k, 0];
  const rc = punto(R, c); R[3] = c[0] - rc[0]; R[7] = c[1] - rc[1]; R[11] = c[2] - rc[2]; return R;
}
/* el giro más corto que lleva la dirección u a la dirección v, alrededor de c */
function giraDe(c, u, v) {
  u = uno(u); v = uno(v); const e = cruz(u, v), s = largo(e), k = esc(u, v);
  if (s < 1e-6) return k > 0 ? ident() : gira(c, Math.abs(u[0]) < 0.9 ? cruz(u, [1, 0, 0]) : cruz(u, [0, 1, 0]), Math.PI);
  return gira(c, e, Math.atan2(s, k));
}
/* dos huesos (largos l1 y l2) desde a hasta el blanco b: devuelve dónde queda la articulación del medio; «polo» dice hacia dónde dobla */
function codo(a, b, l1, l2, polo) {
  let d = resta(b, a), L = largo(d); const max = (l1 + l2) * 0.985, min = Math.abs(l1 - l2) * 1.05 + 0.01;
  if (L > max) { d = por(d, max / L); L = max; } if (L < min) { d = por(uno(L ? d : [0, 0, 1]), min); L = min; }
  const u = por(d, 1 / L), x = (l1 * l1 - l2 * l2 + L * L) / (2 * L), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  let p = resta(polo, por(u, esc(polo, u))); if (largo(p) < 1e-5) p = cruz(u, [1, 0, 0]); p = uno(p);
  return { medio: suma(a, suma(por(u, x), por(p, h))), fin: suma(a, d) };
}

/* ---------- los huesos del hastatus (units/romans/infantry_swordsman_b), sacados mirando qué vértices mueve cada uno ---------- */
export const H = {
  pelvis: 2, vientre: 0, pecho: 4, cuello: 10, cabeza: 11, cara: 24, casco: 25, vaina: 26, espada: 27, escudo: 28,
  claI: 7, brazoI: 5, anteI: 12, manoI: 13, dedosI: [14, 15], claD: 9, brazoD: 8, anteD: 16, manoD: 17, dedosD: [18, 19],
  musloI: 6, piernaI: 20, pieI: 23, musloD: 3, piernaD: 21, pieD: 22,
};
const G_CABEZA = [H.cuello, H.cabeza, H.cara, H.casco];
const G_ANTE_I = [H.anteI, H.manoI, ...H.dedosI, H.escudo], G_ANTE_D = [H.anteD, H.manoD, ...H.dedosD, H.espada];
const G_TRONCO = [H.vientre, H.pecho, H.claI, H.claD];

/* tabla: Float32Array con filas × huesos × 12 */
export function crearEsqueleto(tabla, huesos, filas, pos, pesoI, pesoW) {
  const mat = (fila, h) => { const o = (fila * huesos + h) * 12, m = new Array(12); for (let i = 0; i < 12; i++) m[i] = tabla[o + i]; return m; };
  /* dónde está la articulación entre dos huesos, en la postura de partida del modelo: el punto que los dos huesos
     llevan al mismo sitio en todos los fotogramas. Si el giro es de bisagra (rodilla, codo), a lo largo del eje no se
     sabe: ahí se queda con el centro de los vértices que comparten los dos huesos. */
  function junta(a, b) {
    let c = [0, 0, 0], n = 0;
    for (let i = 0; i < pos.length / 3; i++) {
      let wa = 0, wb = 0; for (let k = 0; k < 4; k++) { if (pesoI[i * 4 + k] === a) wa += pesoW[i * 4 + k]; if (pesoI[i * 4 + k] === b) wb += pesoW[i * 4 + k]; }
      const w = Math.min(wa, wb); if (w > 20) { c[0] += pos[i * 3] * w; c[1] += pos[i * 3 + 1] * w; c[2] += pos[i * 3 + 2] * w; n += w; }
    }
    if (!n) throw new Error('los huesos ' + a + ' y ' + b + ' no comparten vértices');
    c = por(c, 1 / n);
    const N = [0, 0, 0, 0, 0, 0, 0, 0, 0], t = [0, 0, 0], lam = 0.02 * filas;
    for (let f = 0; f < filas; f++) {
      const A = mat(f, a), B = mat(f, b);
      for (let r = 0; r < 3; r++) {
        const d = [A[r * 4] - B[r * 4], A[r * 4 + 1] - B[r * 4 + 1], A[r * 4 + 2] - B[r * 4 + 2]], e = -(A[r * 4 + 3] - B[r * 4 + 3]);
        for (let i = 0; i < 3; i++) { t[i] += d[i] * e; for (let j = 0; j < 3; j++) N[i * 3 + j] += d[i] * d[j]; }
      }
    }
    for (let i = 0; i < 3; i++) { N[i * 4] += lam; t[i] += lam * c[i]; }
    /* resolver N p = t (3×3, por Cramer) */
    const det = m => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]), D = det(N), p = [0, 0, 0];
    for (let k = 0; k < 3; k++) { const m = N.slice(); for (let r = 0; r < 3; r++) m[r * 3 + k] = t[r]; p[k] = det(m) / D; }
    return p;
  }
  const J = {
    cintura: junta(H.pelvis, H.vientre), nuca: junta(H.pecho, H.cuello),
    hombroI: junta(H.claI, H.brazoI), codoI: junta(H.brazoI, H.anteI), munecaI: junta(H.anteI, H.manoI),
    hombroD: junta(H.claD, H.brazoD), codoD: junta(H.brazoD, H.anteD), munecaD: junta(H.anteD, H.manoD),
    caderaI: junta(H.pelvis, H.musloI), rodillaI: junta(H.musloI, H.piernaI), tobilloI: junta(H.piernaI, H.pieI),
    caderaD: junta(H.pelvis, H.musloD), rodillaD: junta(H.musloD, H.piernaD), tobilloD: junta(H.piernaD, H.pieD),
  };
  /* dónde está cada articulación en un fotograma (unidades del modelo) */
  const en = (fila, h, j) => punto(mat(fila, h), J[j]);

  /* Una postura nueva a partir de la fila «base». q (todo en unidades del modelo; +X es la izquierda del hombre, +Z delante):
     baja      cuánto bajan las caderas          dobla    giro de cintura hacia delante (rad)
     tuerce    giro del tronco a su izquierda    cabeza   [cabeceo hacia abajo, giro a su izquierda] (rad)
     manoI     dónde va la muñeca izquierda      manoD    lo mismo con la derecha (null: el brazo sigue su animación)
     poloI/D   hacia dónde apunta el codo
     Devuelve las 12×huesos cifras de la fila nueva. */
  function postura(base, q) {
    const X = new Array(huesos).fill(null), M = h => mat(base, h);
    const baja = traslada([0, -(q.baja || 0), 0]);
    /* tronco: baja con las caderas, se dobla por la cintura y se tuerce */
    const cin = punto(baja, en(base, H.pelvis, 'cintura'));
    let tronco = mul(gira(cin, [1, 0, 0], q.dobla || 0), baja);
    if (q.tuerce) tronco = mul(gira(cin, [0, 1, 0], q.tuerce), tronco);
    for (const h of G_TRONCO) X[h] = tronco;
    X[H.pelvis] = baja; X[H.vaina] = baja;
    /* cabeza: sobre el tronco, cabecea y gira por la nuca */
    const nuca = punto(tronco, en(base, H.pecho, 'nuca')), cb = q.cabeza || [0, 0];
    const cab = mul(gira(nuca, [0, 1, 0], cb[1]), mul(gira(nuca, [1, 0, 0], cb[0]), tronco));
    for (const h of G_CABEZA) X[h] = cab;
    /* brazos: siguen al tronco; si hay blanco, hombro y codo se giran para que la muñeca llegue */
    const brazo = (hBrazo, grupoAnte, jH, jC, jM, hAnte, blanco, polo) => {
      if (!blanco) { X[hBrazo] = tronco; for (const h of grupoAnte) X[h] = tronco; return; }
      const s0 = en(base, hBrazo, jH), c0 = en(base, hBrazo, jC), m0 = en(base, hAnte, jM);
      const s = punto(tronco, s0), r = codo(s, blanco, largo(resta(c0, s0)), largo(resta(m0, c0)), polo);
      const xb = mul(giraDe(s, resta(punto(tronco, c0), s), resta(r.medio, s)), tronco);
      const xa = mul(giraDe(r.medio, resta(punto(xb, m0), r.medio), resta(r.fin, r.medio)), xb);
      X[hBrazo] = xb; for (const h of grupoAnte) X[h] = xa;
    };
    brazo(H.brazoI, G_ANTE_I, 'hombroI', 'codoI', 'munecaI', H.anteI, q.manoI, q.poloI || [0.6, -1, 0.1]);
    brazo(H.brazoD, G_ANTE_D, 'hombroD', 'codoD', 'munecaD', H.anteD, q.manoD, q.poloD || [-0.6, -1, 0.1]);
    /* piernas: la cadera baja, el tobillo se queda; la rodilla sale hacia delante */
    const pierna = (hMuslo, hPierna, hPie, jCa, jRo, jTo) => {
      const ca0 = en(base, H.pelvis, jCa), ro0 = en(base, hMuslo, jRo), to0 = en(base, hPierna, jTo);
      const ca = punto(baja, ca0), r = codo(ca, to0, largo(resta(ro0, ca0)), largo(resta(to0, ro0)), [0, 0.2, 1]);
      const xm = mul(giraDe(ca, resta(punto(baja, ro0), ca), resta(r.medio, ca)), baja);
      const xp = mul(giraDe(r.medio, resta(punto(xm, to0), r.medio), resta(r.fin, r.medio)), xm);
      X[hMuslo] = xm; X[hPierna] = xp; X[hPie] = ident();
    };
    if (q.baja) { pierna(H.musloI, H.piernaI, H.pieI, 'caderaI', 'rodillaI', 'tobilloI'); pierna(H.musloD, H.piernaD, H.pieD, 'caderaD', 'rodillaD', 'tobilloD'); }
    const out = new Float32Array(huesos * 12);
    for (let h = 0; h < huesos; h++) { const m = X[h] ? mul(X[h], M(h)) : M(h); out.set(m, h * 12); }
    return out;
  }
  return { J, mat, en, postura, huesos, filas };
}
