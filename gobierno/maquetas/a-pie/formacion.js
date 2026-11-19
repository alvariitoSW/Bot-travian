/* Pieza «formación»: el testudo. Dónde va cada hombre por fila (r, 0 delante) y columna (f), según lo cerrado que esté
   (k: 0 abierto, 1 cerrado), y dónde va su escudo. Sin pantalla: corre en Node.
   Después: línea manipular, falange, muro hoplita… con el mismo contrato: puesto(f, r, k, zF, jx, jz) → { x, z }.
   OJO A LA ESCALA: las figuras de 0 A.D. miden 2,15 «metros» con UNIT_SCALE; todo va en esa escala. */
const lerp = (a, b, t) => a + (b - a) * t;
/* TP8b-E2: hombres por bando (?hombres=N, por defecto 96: una centuria completa; bájalo si en el móvil va a tirones).
   Con 60 o más, 12 de frente y el fondo que salga (8 con 96); con menos, el manípulo de antes (6 de frente). En Node, 96.
   Licencia de juego: la centuria de la época tenía 60–80 hombres en orden de 6 a 10 de fondo; aquí 12 × 8 */
const PARAM = typeof location !== 'undefined' ? +new URLSearchParams(location.search).get('hombres') : 0;
export const HOMBRES = Math.max(30, Math.min(160, Math.round(PARAM) || 96));
export const FILES = HOMBRES >= 60 ? 12 : 6, FILAS = Math.max(2, Math.min(14, Math.round(HOMBRES / FILES))), M = FILES * FILAS;
/* los hombres de la maqueta de antes (6 × 5): cada baja pesa en el ánimo como pesaba entonces */
export const REF_R = 30;
export const ABIERTO = { dx: 0.95, dz: 2.6 }, CERRADO = { dx: 0.68, dz: 0.7 };
export const YO = FILES / 2 - 1, CMP = FILES / 2;   /* tú eres el tercero de la primera fila; tu compañero, el cuarto. La cámara va detrás, entre los dos */
/* el escudo (medidas del modelo, en sus unidades): 1,58 de ancho, 2,98 de alto, curvo con radio 1,05 */
export const R_ESC = 1.05, ySup = lx => R_ESC - Math.sqrt(Math.max(0.01, R_ESC * R_ESC - lx * lx));
/* dónde va el centro de cada escudo respecto a su hombre (metros): muro delante, techo sobre la cabeza y algo adelantado,
   con el canto de delante un poco más alto (así el escudo de atrás monta sobre el de delante, como las tejas) */
export const MURO_Y = 0.87, MURO_Z = 0.42, TECHO_Y = 2.06, TECHO_Z = 0.2, TECHO_SUBE = 0.05, ALERO = 0.5;
/* el techo va corrido media fila hacia la izquierda, como los ladrillos */
export const CORRE = CERRADO.dx / 2;
/* el puesto de un hombre: jx, jz es su desorden propio cuando la formación va abierta (cerrada, cada uno en su sitio) */
export function puesto(f, r, k, zF, jx = 0, jz = 0) {
  const dx = lerp(ABIERTO.dx, CERRADO.dx, k), dz = lerp(ABIERTO.dz, CERRADO.dz, k);
  return { x: (f - (FILES - 1) / 2) * dx + jx * (1 - k), z: zF + r * dz + jz * (1 - k) };
}
/* el puesto en el testudo ya cerrado, con el frente en z0 */
export const enCierre = (f, r, z0) => ({ x: (f - (FILES - 1) / 2) * CERRADO.dx, z: z0 + r * CERRADO.dz });
/* cuánto puede adelantarse (−) o quedarse atrás (+) un hombre de su puesto: suelto, casi un metro; cerrado, unos centímetros */
export const holgura = k => ({ atras: lerp(0.9, 0.06, k), delante: lerp(0.3, 0.04, k) });
