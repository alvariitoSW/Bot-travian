/* AQVILA · AM2 — datos del mapa vivo de Grecia: marco, polis, recursos por comarcas, caminos y nombres de lugares.
   Sin pantalla: corre también en Node (test/mapa-grecia.test.mjs) y lo puede leer el Cerebro (AM3).
   AQUÍ SOLO SE DICE DÓNDE ESTÁ CADA COSA Y CÓMO SE PINTA. Las reglas y las cifras de los recursos son de AM3 (js/game.js, js/data.js).
   Geografía y recursos con su fuente en gobierno/historia/AM2-mapa-grecia.md. Coordenadas en grados (lon, lat). 1 unidad del mapa = 10 km. */

export const MARCO = { x0: 19.3, x1: 28.3, y0: 34.7, y1: 41.0, nx: 2160, nz: 1920, lon0: 23.8, lat0: 37.85, kx: 8.77, kz: 11.13 };
export const X = lon => (lon - MARCO.lon0) * MARCO.kx, Z = lat => -(lat - MARCO.lat0) * MARCO.kz;
export const LON = x => x / MARCO.kx + MARCO.lon0, LAT = z => -z / MARCO.kz + MARCO.lat0;

/* Recursos básicos (los de la partida, con «materiales» partido en madera y piedra para que se vea de dónde sale cada cosa) */
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

/* Las 8 polis de PN2. costa: tiene puerto propio (barcos). puerto: dónde fondean. lujo: su recurso de lujo.
   et: hacia dónde cae la etiqueta de lejos. alto: la polis tiene acrópolis sobre un cerro. giro: hacia dónde mira el caserío (rad). */
export const POLIS = [
  { id: 'atenas', et: 'der', n: 'Atenas', lon: 23.73, lat: 37.98, costa: true, puerto: [23.62, 37.93], puertoN: 'El Pireo', lujo: 'plata', lujoDe: 'minas del Laurion', color: '#2f5fa8', pri: 1, casas: 300 },
  { id: 'esparta', et: 'izq', n: 'Esparta', lon: 22.43, lat: 37.07, costa: false, puerto: [22.57, 36.76], puertoN: 'Gitio', lujo: 'purpura', lujoDe: 'caracolas de Laconia y Citera', color: '#a8262b', pri: 1, casas: 220, aldeas: true },
  { id: 'corinto', et: 'izq', n: 'Corinto', lon: 22.88, lat: 37.905, costa: true, puerto: [22.88, 37.94], puertoN: 'Lequeo', lujo: 'ceramica', lujoDe: 'vasos corintios', color: '#b7791f', pri: 1, casas: 280 },
  { id: 'argos', et: 'izq', n: 'Argos', lon: 22.72, lat: 37.63, costa: true, puerto: [22.80, 37.56], puertoN: 'Nauplia', lujo: 'caballos', lujoDe: 'la llanura «criadora de caballos»', color: '#5d7a2c', pri: 2, casas: 260 },
  { id: 'tebas', et: 'izq', n: 'Tebas', lon: 23.32, lat: 38.32, costa: false, lujo: 'anguilas', lujoDe: 'anguilas del lago Copais', color: '#7a4a9a', pri: 2, casas: 260 },
  { id: 'megara', et: 'abajo', n: 'Mégara', lon: 23.34, lat: 38.0, costa: true, puerto: [23.36, 37.97], puertoN: 'Nisea', lujo: 'sal', lujoDe: 'salinas de la costa', color: '#3d8c8c', pri: 3, casas: 180 },
  { id: 'mileto', n: 'Mileto', lon: 27.28, lat: 37.53, costa: true, puerto: [27.22, 37.5], puertoN: 'Puerto de los Leones', lujo: 'lana', lujoDe: 'lana milesia', color: '#c4577a', pri: 1, casas: 280 },
  { id: 'calcis', et: 'der', n: 'Calcis', lon: 23.6, lat: 38.46, costa: true, puerto: [23.64, 38.43], puertoN: 'Euripo', lujo: 'bronce', lujoDe: 'talleres de bronce', color: '#8c6a3d', pri: 2, casas: 200 }
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
  [[23.32, 38.32], [23.1, 38.42], [22.87, 38.5], [22.62, 38.62], [22.4, 38.79], [22.42, 39.05], [22.38, 39.35], [22.42, 39.64]],
  [[27.28, 37.53], [27.42, 37.68], [27.6, 37.84], [27.85, 37.85]],
  [[22.43, 37.07], [22.25, 37.1], [22.03, 37.12]],
  [[23.73, 37.98], [23.66, 37.95], [23.63, 37.94]],
  [[22.43, 37.07], [22.5, 36.92], [22.56, 36.77]],
  [[22.72, 37.63], [22.75, 37.61], [22.8, 37.57]]
];

/* Lago Copais (Beocia): hoy desecado; en la Antigüedad, lago y marisma. Se pinta como agua (dictamen: histórico). */
export const COPAIS = { lon: 23.02, lat: 38.45, rx: 13, rz: 6.5 };

/* Nombres sobre el mapa. c: clase (mar, region, comarca, isla, monte, lugar). a: ancho de pantalla (en decenas de km) entre
   los que se ve [mín, máx]; si falta, el de su clase. Todos son nombres de época en su forma española. */
export const CLASES = { mar: [14, 400], golfo: [3, 30], region: [16, 140], comarca: [3.5, 34], isla: [2.5, 30], islaG: [4, 80], monte: [1.5, 22], lugar: [0, 9] };
export const LUGARES = [
  { n: 'Mar Egeo', c: 'mar', lon: 25.15, lat: 38.7 }, { n: 'Mar Jónico', c: 'mar', lon: 20.2, lat: 37.3 }, { n: 'Mar de Creta', c: 'mar', lon: 24.7, lat: 36.0 },
  { n: 'Mar de Tracia', c: 'mar', lon: 25.1, lat: 40.45, a: [10, 90] }, { n: 'Mar Icario', c: 'mar', lon: 26.3, lat: 37.3, a: [8, 60] }, { n: 'Mar Mirtoo', c: 'mar', lon: 23.7, lat: 36.75, a: [8, 60] },
  { n: 'Golfo de Corinto', c: 'golfo', lon: 22.45, lat: 38.2 }, { n: 'Golfo Sarónico', c: 'golfo', lon: 23.5, lat: 37.62 }, { n: 'Golfo de Argos', c: 'golfo', lon: 22.92, lat: 37.4 },
  { n: 'Golfo de Laconia', c: 'golfo', lon: 22.75, lat: 36.55 }, { n: 'Golfo de Mesenia', c: 'golfo', lon: 22.05, lat: 36.8 }, { n: 'Golfo Termaico', c: 'golfo', lon: 22.85, lat: 40.2 }, { n: 'Golfo de Eubea', c: 'golfo', lon: 23.25, lat: 38.67, a: [2.5, 16] },
  { n: 'Peloponeso', c: 'region', lon: 22.05, lat: 37.42 }, { n: 'Tesalia', c: 'region', lon: 22.1, lat: 39.42 }, { n: 'Macedonia', c: 'region', lon: 22.2, lat: 40.78 }, { n: 'Epiro', c: 'region', lon: 20.7, lat: 39.62 },
  { n: 'Tracia', c: 'region', lon: 25.6, lat: 40.95 }, { n: 'Jonia', c: 'region', lon: 27.65, lat: 38.3 }, { n: 'Creta', c: 'region', lon: 24.9, lat: 35.18 }, { n: 'Caria', c: 'region', lon: 28.0, lat: 37.15 }, { n: 'Lidia', c: 'region', lon: 27.95, lat: 38.6 },
  { n: 'Ática', c: 'comarca', lon: 23.92, lat: 37.9 }, { n: 'Beocia', c: 'comarca', lon: 23.1, lat: 38.3 }, { n: 'Laconia', c: 'comarca', lon: 22.62, lat: 36.98 }, { n: 'Mesenia', c: 'comarca', lon: 21.88, lat: 37.12 },
  { n: 'Arcadia', c: 'comarca', lon: 22.15, lat: 37.6 }, { n: 'Élide', c: 'comarca', lon: 21.5, lat: 37.82 }, { n: 'Acaya', c: 'comarca', lon: 22.0, lat: 38.12 }, { n: 'Argólide', c: 'comarca', lon: 23.02, lat: 37.6 },
  { n: 'Fócide', c: 'comarca', lon: 22.55, lat: 38.6 }, { n: 'Etolia', c: 'comarca', lon: 21.6, lat: 38.62 }, { n: 'Megáride', c: 'comarca', lon: 23.22, lat: 38.04, a: [1.5, 12] }, { n: 'Calcídica', c: 'comarca', lon: 23.45, lat: 40.42 },
  { n: 'Eubea', c: 'islaG', lon: 23.95, lat: 38.62 }, { n: 'Lesbos', c: 'islaG', lon: 26.25, lat: 39.2 }, { n: 'Quíos', c: 'islaG', lon: 26.05, lat: 38.4 }, { n: 'Samos', c: 'islaG', lon: 26.82, lat: 37.74 }, { n: 'Rodas', c: 'islaG', lon: 27.95, lat: 36.2 },
  { n: 'Corcira', c: 'islaG', lon: 19.85, lat: 39.6 }, { n: 'Cefalenia', c: 'islaG', lon: 20.55, lat: 38.24 }, { n: 'Naxos', c: 'islaG', lon: 25.52, lat: 37.06 }, { n: 'Lemnos', c: 'islaG', lon: 25.2, lat: 39.9 },
  { n: 'Egina', c: 'isla', lon: 23.5, lat: 37.74 }, { n: 'Salamina', c: 'isla', lon: 23.47, lat: 37.94, a: [1, 14] }, { n: 'Citera', c: 'isla', lon: 22.98, lat: 36.25 }, { n: 'Paros', c: 'isla', lon: 25.18, lat: 37.06 },
  { n: 'Delos', c: 'isla', lon: 25.27, lat: 37.4 }, { n: 'Cos', c: 'isla', lon: 27.1, lat: 36.85 }, { n: 'Melos', c: 'isla', lon: 24.42, lat: 36.7 }, { n: 'Andros', c: 'isla', lon: 24.85, lat: 37.85 }, { n: 'Zacinto', c: 'isla', lon: 20.75, lat: 37.8 },
  { n: 'Léucade', c: 'isla', lon: 20.65, lat: 38.72 }, { n: 'Ítaca', c: 'isla', lon: 20.68, lat: 38.42, a: [1, 14] }, { n: 'Tasos', c: 'isla', lon: 24.65, lat: 40.68 }, { n: 'Esciros', c: 'isla', lon: 24.55, lat: 38.87 }, { n: 'Tera', c: 'isla', lon: 25.43, lat: 36.41 }, { n: 'Sérifos', c: 'isla', lon: 24.5, lat: 37.15 },
  { n: 'Olimpo', c: 'monte', lon: 22.35, lat: 40.08, a: [1.5, 60] }, { n: 'Parnaso', c: 'monte', lon: 22.62, lat: 38.53 }, { n: 'Taigeto', c: 'monte', lon: 22.35, lat: 36.95 }, { n: 'Pindo', c: 'monte', lon: 21.2, lat: 39.75, a: [6, 60] },
  { n: 'Helicón', c: 'monte', lon: 22.88, lat: 38.3 }, { n: 'Citerón', c: 'monte', lon: 23.25, lat: 38.18 }, { n: 'Himeto', c: 'monte', lon: 23.82, lat: 37.95, a: [0.8, 9] }, { n: 'Pentélico', c: 'monte', lon: 23.88, lat: 38.08, a: [0.8, 9] },
  { n: 'Osa', c: 'monte', lon: 22.68, lat: 39.8 }, { n: 'Pelión', c: 'monte', lon: 23.05, lat: 39.44 }, { n: 'Atos', c: 'monte', lon: 24.33, lat: 40.16 }, { n: 'Parnón', c: 'monte', lon: 22.62, lat: 37.22 }, { n: 'Cilene', c: 'monte', lon: 22.4, lat: 37.94 }, { n: 'Ida', c: 'monte', lon: 24.77, lat: 35.22 },
  { n: 'Acrocorinto', c: 'monte', lon: 22.87, lat: 37.89, a: [0.3, 3.5] }, { n: 'Larisa de Argos', c: 'monte', lon: 22.713, lat: 37.638, a: [0.3, 3] },
  { n: 'Delfos', c: 'lugar', lon: 22.5, lat: 38.48, a: [0, 22], s: 'santuario' }, { n: 'Olimpia', c: 'lugar', lon: 21.63, lat: 37.64, a: [0, 22], s: 'santuario' }, { n: 'Epidauro', c: 'lugar', lon: 23.08, lat: 37.6 },
  { n: 'Eleusis', c: 'lugar', lon: 23.54, lat: 38.04, s: 'santuario' }, { n: 'Maratón', c: 'lugar', lon: 23.95, lat: 38.15 }, { n: 'Termópilas', c: 'lugar', lon: 22.53, lat: 38.8, a: [0, 16] }, { n: 'Micenas', c: 'lugar', lon: 22.756, lat: 37.73, s: 'ruina' },
  { n: 'Tirinto', c: 'lugar', lon: 22.8, lat: 37.6, s: 'ruina' }, { n: 'Nauplia', c: 'lugar', lon: 22.805, lat: 37.565 }, { n: 'El Pireo', c: 'lugar', lon: 23.635, lat: 37.94 }, { n: 'Laurion', c: 'lugar', lon: 24.05, lat: 37.72 },
  { n: 'Cabo Sunion', c: 'lugar', lon: 24.03, lat: 37.655 }, { n: 'Dodona', c: 'lugar', lon: 20.79, lat: 39.55, a: [0, 22], s: 'santuario' }, { n: 'Pilos', c: 'lugar', lon: 21.7, lat: 36.95 }, { n: 'Gitio', c: 'lugar', lon: 22.565, lat: 36.765 },
  { n: 'Éfeso', c: 'lugar', lon: 27.34, lat: 37.94, a: [0, 22] }, { n: 'Esmirna', c: 'lugar', lon: 27.14, lat: 38.42, a: [0, 22] }, { n: 'Cnosos', c: 'lugar', lon: 25.16, lat: 35.3, a: [0, 22], s: 'ruina' }, { n: 'Platea', c: 'lugar', lon: 23.27, lat: 38.22 },
  { n: 'Sición', c: 'lugar', lon: 22.72, lat: 37.98 }, { n: 'Lequeo', c: 'lugar', lon: 22.885, lat: 37.935, a: [0, 4] }, { n: 'Cencreas', c: 'lugar', lon: 22.99, lat: 37.885, a: [0, 5] }, { n: 'Istmo', c: 'lugar', lon: 22.99, lat: 37.93, a: [0, 12] },
  { n: 'Áulide', c: 'lugar', lon: 23.6, lat: 38.425, a: [0, 4] }, { n: 'Eretria', c: 'lugar', lon: 23.8, lat: 38.4 }, { n: 'Larisa', c: 'lugar', lon: 22.42, lat: 39.64, a: [0, 22] }, { n: 'Amiclas', c: 'lugar', lon: 22.45, lat: 37.035, a: [0, 3.5] },
  { n: 'Lago Copais', c: 'golfo', lon: 23.02, lat: 38.45, a: [1.5, 16] }, { n: 'Río Eurotas', c: 'golfo', lon: 22.5, lat: 36.98, a: [0.8, 7] }, { n: 'Río Meandro', c: 'golfo', lon: 27.55, lat: 37.78, a: [1.5, 12] }, { n: 'Río Peneo', c: 'golfo', lon: 22.2, lat: 39.62, a: [2, 16] }
];

/* Vistas de cámara de capturas y botones: centro (lon, lat) y ancho de pantalla en decenas de km (en vertical) */
export const VISTAS = {
  entera: { lon: 24.2, lat: 37.7, a: 84 }, corazon: { lon: 23.05, lat: 37.75, a: 21 }, comarca: { lon: 22.78, lat: 37.6, a: 3.2 },
  atenas: { lon: 23.6, lat: 37.98, a: 9.5 }, egeo: { lon: 25.5, lat: 37.6, a: 46 }, peloponeso: { lon: 22.55, lat: 37.35, a: 17 }
};

/* Distancia en km entre dos puntos (lon, lat) */
export function km(a, b) { const dx = (a[0] - b[0]) * 87.7, dz = (a[1] - b[1]) * 111.3; return Math.hypot(dx, dz); }
/* Básicos que una polis tiene cerca (su comarca: a menos de 32 km del borde de la zona) y los que le faltan */
export function comarca(p) {
  const tiene = {};
  for (const z of ZONAS) if (km([p.lon, p.lat], [z.lon, z.lat]) - z.r < 32) (tiene[z.t] = tiene[z.t] || []).push(z.n);
  return { tiene, faltan: Object.keys(BASICOS).filter(k => !tiene[k]) };
}
/* Lo que AM3 necesita de un vistazo: por polis, sus básicos de comarca, su lujo y lo que le falta */
export function recursosPorPolis() {
  const o = {};
  for (const p of POLIS) { const c = comarca(p); o[p.id] = { basicos: Object.keys(c.tiene), zonas: c.tiene, lujo: p.lujo, faltan: c.faltan }; }
  return o;
}
/* Peso de cada básico en un punto (0..1): 1 en el centro de la comarca, 0 fuera. Lo usan la pintura del suelo y las pruebas. */
export function pesoZonas(lon, lat, o) {
  o = o || {}; o.grano = o.madera = o.piedra = o.hierro = 0;
  for (let i = 0; i < ZONAS.length; i++) { const z = ZONAS[i], dx = (lon - z.lon) * 87.7; if (dx > z.r || dx < -z.r) continue; const dz = (lat - z.lat) * 111.3, q = Math.hypot(dx, dz) / z.r;
    if (q < 1) { const t = Math.min(1, Math.max(0, (q - 0.55) / 0.45)), w = 1 - t * t * (3 - 2 * t); if (w > o[z.t]) o[z.t] = w; } }
  return o;
}
