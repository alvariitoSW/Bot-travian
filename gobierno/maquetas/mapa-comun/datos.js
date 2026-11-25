/* AQVILA · AM1 — datos de la maqueta del mapa vivo de Grecia: marco, polis, recursos y caminos.
   Es una PROPUESTA para que el usuario elija aspecto: las reglas y las cifras de los recursos son del Cerebro (AM3).
   Geografía y recursos con su fuente en HISTORIA.md (misma carpeta). Coordenadas en grados (lon, lat). */

export const MARCO = { x0: 19.3, x1: 28.3, y0: 34.7, y1: 41.0, nx: 720, nz: 640, lon0: 23.8, lat0: 37.85, kx: 8.77, kz: 11.13 };   // 1 unidad = 10 km

/* Recursos básicos (los cuatro de la partida, con «materiales» partido en madera y piedra para que se vea de dónde sale cada cosa) */
export const BASICOS = {
  grano: { n: 'Grano', color: '#d9a92b' },
  madera: { n: 'Madera', color: '#4f7a3a' },
  piedra: { n: 'Piedra', color: '#b9b4a6' },
  hierro: { n: 'Hierro', color: '#6b7280' }
};
/* Recursos de lujo: solo en algunas ciudades */
export const LUJOS = {
  plata: { n: 'Plata', color: '#cfd6dd' },
  purpura: { n: 'Púrpura', color: '#8b2f7a' },
  ceramica: { n: 'Cerámica fina', color: '#c8643a' },
  caballos: { n: 'Caballos', color: '#8a5a33' },
  anguilas: { n: 'Manjares del lago', color: '#3f7f86' },
  sal: { n: 'Sal', color: '#eef0ee' },
  lana: { n: 'Lana fina', color: '#e6dcc4' },
  bronce: { n: 'Bronce', color: '#b0792e' }
};

/* Las 8 polis de PN2. costa: tiene puerto (barcos). lujo: su recurso de lujo. et: hacia dónde cae la etiqueta. */
export const POLIS = [
  { id: 'atenas', et: 'der', n: 'Atenas', lon: 23.73, lat: 37.98, costa: true, puerto: [23.62, 37.93], lujo: 'plata', lujoDe: 'minas del Laurion', color: '#2f5fa8', pri: 1 },
  { id: 'esparta', et: 'izq', n: 'Esparta', lon: 22.43, lat: 37.07, costa: false, puerto: [22.57, 36.76], lujo: 'purpura', lujoDe: 'caracolas de Laconia y Citera', color: '#a8262b', pri: 1 },
  { id: 'corinto', et: 'izq', n: 'Corinto', lon: 22.88, lat: 37.905, costa: true, puerto: [22.88, 37.94], lujo: 'ceramica', lujoDe: 'vasos corintios', color: '#b7791f', pri: 1 },
  { id: 'argos', et: 'izq', n: 'Argos', lon: 22.72, lat: 37.63, costa: true, puerto: [22.80, 37.56], lujo: 'caballos', lujoDe: 'la llanura «criadora de caballos»', color: '#5d7a2c', pri: 2 },
  { id: 'tebas', et: 'izq', n: 'Tebas', lon: 23.32, lat: 38.32, costa: false, lujo: 'anguilas', lujoDe: 'anguilas del lago Copais', color: '#7a4a9a', pri: 2 },
  { id: 'megara', et: 'abajo', n: 'Mégara', lon: 23.34, lat: 38.0, costa: true, puerto: [23.36, 37.97], lujo: 'sal', lujoDe: 'salinas de la costa', color: '#3d8c8c', pri: 3 },
  { id: 'mileto', n: 'Mileto', lon: 27.28, lat: 37.53, costa: true, puerto: [27.22, 37.5], lujo: 'lana', lujoDe: 'lana milesia', color: '#c4577a', pri: 1 },
  { id: 'calcis', et: 'der', n: 'Calcis', lon: 23.6, lat: 38.46, costa: true, puerto: [23.64, 38.43], lujo: 'bronce', lujoDe: 'talleres de bronce', color: '#8c6a3d', pri: 2 }
];

/* Zonas de recursos básicos: cada uno en 3 o más comarcas. r en km. */
export const ZONAS = [
  { t: 'grano', n: 'Tesalia', lon: 22.35, lat: 39.5, r: 42 },
  { t: 'grano', n: 'Beocia', lon: 23.1, lat: 38.4, r: 16 },
  { t: 'grano', n: 'Mesenia', lon: 22.0, lat: 37.12, r: 15 },
  { t: 'grano', n: 'Élide', lon: 21.4, lat: 37.85, r: 18 },
  { t: 'grano', n: 'Valle del Meandro', lon: 27.6, lat: 37.82, r: 24 },
  { t: 'grano', n: 'Macedonia', lon: 22.5, lat: 40.62, r: 28 },
  { t: 'madera', n: 'Pindo', lon: 21.25, lat: 39.55, r: 40 },
  { t: 'madera', n: 'Olimpo y Pieria', lon: 22.3, lat: 40.1, r: 22 },
  { t: 'madera', n: 'Norte de Eubea', lon: 23.35, lat: 38.85, r: 18 },
  { t: 'madera', n: 'Arcadia', lon: 22.1, lat: 37.62, r: 26 },
  { t: 'madera', n: 'Monte Ida', lon: 26.85, lat: 39.7, r: 24 },
  { t: 'piedra', n: 'Pentélico', lon: 23.9, lat: 38.08, r: 7 },
  { t: 'piedra', n: 'Paros', lon: 25.2, lat: 37.06, r: 8 },
  { t: 'piedra', n: 'Ténaro', lon: 22.4, lat: 36.55, r: 9 },
  { t: 'piedra', n: 'Tasos', lon: 24.68, lat: 40.68, r: 9 },
  { t: 'piedra', n: 'Canteras de Corinto', lon: 22.78, lat: 37.86, r: 6 },
  { t: 'piedra', n: 'Canteras de Mégara', lon: 23.3, lat: 38.04, r: 5 },
  { t: 'hierro', n: 'Laconia', lon: 22.75, lat: 36.85, r: 14 },
  { t: 'hierro', n: 'Eubea', lon: 23.85, lat: 38.55, r: 12 },
  { t: 'hierro', n: 'Sérifos', lon: 24.5, lat: 37.15, r: 7 },
  { t: 'hierro', n: 'Calcídica', lon: 23.6, lat: 40.42, r: 20 }
];

/* Caminos de tierra entre polis (puntos intermedios para no pisar el mar) */
export const CAMINOS = [
  [[23.73, 37.98], [23.56, 38.05], [23.34, 38.0], [23.12, 37.95], [22.98, 37.92], [22.88, 37.905], [22.76, 37.8], [22.72, 37.63], [22.55, 37.52], [22.42, 37.45], [22.4, 37.25], [22.43, 37.07]],
  [[23.73, 37.98], [23.62, 38.16], [23.45, 38.26], [23.32, 38.32], [23.48, 38.4], [23.58, 38.45]],
  [[23.32, 38.32], [23.1, 38.42], [22.87, 38.5], [22.62, 38.62], [22.52, 38.8], [22.42, 39.05], [22.38, 39.35], [22.42, 39.64]],
  [[27.28, 37.53], [27.42, 37.68], [27.6, 37.84], [27.85, 37.85]],
  [[22.43, 37.07], [22.25, 37.1], [22.03, 37.12]]
];

/* Lago Copais (Beocia): hoy desecado; en la Antigüedad, lago y marisma. Se pinta como agua (dictamen: histórico). */
export const COPAIS = { lon: 23.02, lat: 38.45, rx: 13, rz: 6.5 };

/* Vistas de cámara de las capturas y los botones: centro (lon, lat), distancia y giro */
export const VISTAS = {
  corazon: { lon: 23.05, lat: 37.75, d: 21 },
  entera: { lon: 24.75, lat: 36.5, d: 56 },
  atenas: { lon: 23.6, lat: 37.98, d: 9.5 },
  egeo: { lon: 25.5, lat: 37.6, d: 46 },
  peloponeso: { lon: 22.55, lat: 37.35, d: 17 }
};

/* Distancia en km entre dos puntos (lon, lat) */
export function km(a, b) { const dx = (a[0] - b[0]) * 87.7, dz = (a[1] - b[1]) * 111.3; return Math.hypot(dx, dz); }
/* Básicos que una polis tiene cerca (su comarca: a menos de 32 km del borde de la zona) y los que le faltan */
export function comarca(p) {
  const tiene = {};
  for (const z of ZONAS) if (km([p.lon, p.lat], [z.lon, z.lat]) - z.r < 32) (tiene[z.t] = tiene[z.t] || []).push(z.n);
  return { tiene, faltan: Object.keys(BASICOS).filter(k => !tiene[k]) };
}
