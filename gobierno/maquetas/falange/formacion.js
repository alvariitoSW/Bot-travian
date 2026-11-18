/* Pieza «formación»: la falange de picas (TP7a). Dónde va cada hombre por columna (f) y fila (r, 0 delante) y hacia
   dónde apunta su sarisa. Sin pantalla: corre en Node. Mismo contrato que el testudo: puesto(f, r, zF) → { x, z }.
   HISTORIA. Polibio 18.29–30 (histórico): la sarisa medía unos 14 codos (más de 6 m); en orden cerrado cada hombre ocupa
   unos 3 pies; las cinco primeras filas la bajan hacia delante y sus puntas sobresalen escalonadas por delante de la
   primera; las de detrás la llevan alzada, inclinada hacia delante sobre los hombros de los de delante, y así frenan los
   proyectiles. Plutarco, Pirro 21 (Ásculo, 279 a.C.) para el marco: falange de Pirro contra legiones de Roma.
   Licencia de juego: 8 columnas por 7 filas (una sintagma tenía 16 de fondo), el combate uno a uno y las órdenes como botones.
   OJO A LA ESCALA: la figura de 0 A.D. mide 1,9 «metros» con UNIT_SCALE; todo va en esa escala (1 m ≈ 1 m de juego). */
export const FILES = 8, FILAS = 7, M = FILES * FILAS;
export const DX = 0.78, DZ = 0.95;          /* entre hombres y entre filas: prietos (Polibio: unos 3 pies) */
export const BAJAN = 5;                      /* las cinco primeras filas bajan la sarisa */
export const YO = 3;                         /* tú, el oficial, eres el cuarto de la primera fila; la cámara va detrás, entre tú y el quinto */
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
export const bajada = r => r === 0 ? 0.02 : -0.05;
/* el retraso de cada fila al bajar o alzar (s): escalonado, la primera antes */
export const retraso = (r, azar) => r * 0.22 + azar * 0.12;
/* cuánto oscila cada asta: su propio ritmo (rad/s) y su fase, sacados del azar del hombre (nunca todas a la vez) */
export const vaiven = (a, b) => ({ w: 1.05 + a * 0.9, w2: 0.8 + b * 0.7, fi: a * 6.283, fi2: b * 6.283 });
