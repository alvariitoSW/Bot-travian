/* Pieza «formación»: la falange de picas (TP7a). Dónde va cada hombre por columna (f) y fila (r, 0 delante) y hacia
   dónde apunta su sarisa. Sin pantalla: corre en Node. Mismo contrato que el testudo: puesto(f, r, zF) → { x, z }.
   HISTORIA. Polibio 18.29–30 (histórico): la sarisa medía unos 14 codos (más de 6 m); en orden cerrado cada hombre ocupa
   unos 3 pies; las cinco primeras filas la bajan hacia delante y sus puntas sobresalen escalonadas por delante de la
   primera; las de detrás la llevan alzada, inclinada hacia delante sobre los hombros de los de delante, y así frenan los
   proyectiles. Plutarco, Pirro 21 (Ásculo, 279 a.C.) para el marco: falange de Pirro contra legiones de Roma.
   Licencia de juego: 12 columnas por 8 filas con 96 (una sintagma tenía 16 de fondo), el combate uno a uno y las órdenes como botones.
   OJO A LA ESCALA: la figura de 0 A.D. mide 1,9 «metros» con UNIT_SCALE; todo va en esa escala (1 m ≈ 1 m de juego). */
/* TP8b-E1: hombres por bando (?hombres=N, por defecto 96; bájalo si en el móvil va a tirones). 12 de frente y el fondo
   que salga (8 con 96; hasta 16, Polibio 18.30). En Node no hay location: 96 */
const PARAM = typeof location !== 'undefined' ? +new URLSearchParams(location.search).get('hombres') : 0;
export const HOMBRES = Math.max(24, Math.min(192, Math.round(PARAM) || 96));
export const FILES = 12, FILAS = Math.max(2, Math.min(16, Math.round(HOMBRES / FILES))), M = FILES * FILAS;
/* fondo y frente de la maqueta de antes (8 × 7): cada baja pesa en el ánimo como pesaba en una columna de entonces */
export const REF_F = 7 * FILES;
export const DX = 0.78, DZ = 0.95;          /* entre hombres y entre filas: prietos (Polibio: unos 3 pies) */
export const BAJAN = 5;                      /* las cinco primeras filas bajan la sarisa */
export const YO = FILES / 2 - 1;                      /* tú, el oficial, eres el cuarto de la primera fila; la cámara va detrás, entre tú y el quinto */
export const SARISA = 6.3, AGARRE = 1.7;     /* largo de la sarisa y de la contera a la mano de atrás */
export const ALCANCE = SARISA - AGARRE - 0.25; /* cuánto sale la punta de la primera fila por delante de su pecho */
export function puesto(f, r, zF) { return { x: (f - (FILES - 1) / 2) * DX, z: zF + r * DZ }; }
/* inclinación de la sarisa alzada (radianes desde la vertical, hacia delante). Marchando, casi derechas; con las cinco
   primeras abajo, las de atrás se inclinan sobre los de delante, en abanico (más las más cercanas) */
export function alzada(f, r, abanico) {
  const marcha = 0.13 + 0.025 * (FILAS - 1 - r), atras = 0.62 - 0.12 * Math.max(0, r - BAJAN);
  return { delante: marcha + (atras - marcha) * abanico, lado: (f - (FILES - 1) / 2) * 0.022 };
}
/* cabeceo de la sarisa bajada (radianes, + arriba): la primera fila, a la cadera y casi a nivel; las de detrás, sobre el
   hombro del de delante y algo hacia abajo, para que las puntas queden escalonadas a la altura del pecho enemigo */
export const bajada = r => -0.015;
/* TP8b: el carril de cada sarisa bajada, respecto a su hombre (x a su derecha, y desde el suelo). La 1.ª fila, a la cadera;
   cada fila de detrás, más alta y algo más a la derecha: pasa por encima del hombro derecho del de delante. Como todas van
   casi paralelas, las cinco hileras de puntas no se cruzan (licencia de juego: alturas fijas por fila) */
export const CARRIL = r => ({ x: 0.18 + 0.07 * Math.min(4, r), y: [1.0, 1.24, 1.42, 1.58, 1.72][Math.min(4, r)] });
/* el retraso de cada fila al bajar o alzar (s): escalonado, la primera antes */
export const retraso = (r, azar) => r * 0.14 + azar * 0.03;   /* TP8b: en ola, fila a fila */
/* cuánto oscila cada asta: su propio ritmo (rad/s) y su fase, sacados del azar del hombre (nunca todas a la vez) */
export const vaiven = (a, b) => ({ w: 1.05 + a * 0.9, w2: 0.8 + b * 0.7, fi: a * 6.283, fi2: b * 6.283 });
