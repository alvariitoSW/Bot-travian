/* AQVILA — el mundo de la ciudad: relieve, río, ruido y el campo (caminos, parcelas, puente). Solo números: sin pantalla ni three.
   Es el terreno de la maqueta aprobada gobierno/maquetas/ciudad2/mundo.js (misma semilla y mismas fórmulas): tareas posteriores
   montarán la ciudad densa encima, en estas mismas coordenadas. Todo lo de aquí es INVENTADO (relieve, río, trazado).
   Ejes: +x este, +z sur; la cámara mira al norte (−z). El juego conserva sus coordenadas locales (recinto ±104 × ±84): el punto
   local (x, z) es el punto del mundo (x + OX, z + OZ). */

export const OX = 40, OZ = 80;

export function azar(semilla) { let a = semilla >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const h2 = (x, y) => { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) | 0; n = Math.imul(n ^ n >>> 13, 1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967296; };
export function ruido(x, y) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function fbm(x, y, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * ruido(x * f, y * f); f *= 2.03; a *= 0.5; } return s / (1 - Math.pow(0.5, o)); }
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

/* ---------- polilíneas ---------- */
export function suavizar(p, paso = 4) {               // Catmull-Rom y remuestreo a paso fijo
  const o = []; const n = p.length;
  for (let i = 0; i < n - 1; i++) { const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(n - 1, i + 2)]; const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), k = Math.max(2, Math.ceil(L / paso));
    for (let j = 0; j < k; j++) { const t = j / k, t2 = t * t, t3 = t2 * t; o.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  o.push(p[n - 1]); return o;
}
export function distPoli(p, x, z) { let m = 1e9; for (let i = 0; i < p.length - 1; i++) { const ax = p[i][0], az = p[i][1], bx = p[i + 1][0] - ax, bz = p[i + 1][1] - az, l = bx * bx + bz * bz; let t = l ? ((x - ax) * bx + (z - az) * bz) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; const d = Math.hypot(x - ax - bx * t, z - az - bz * t); if (d < m) m = d; } return m; }

/* ---------- río ---------- */
export const NIVEL_RIO = -3;
export const RIO = suavizar([[-2600, -620], [-1700, -540], [-1000, -470], [-560, -440], [-300, -395], [-90, -405], [70, -470], [200, -440], [300, -365], [420, -335], [560, -385], [820, -430], [1500, -390], [2600, -460]], 14);
const rioCelda = new Map();
export function distRio(x, z) { if (z > 200 || z < -1100) return 400; const k = Math.round(x / 6) + ',' + Math.round(z / 6); let d = rioCelda.get(k); if (d === undefined) { d = distPoli(RIO, Math.round(x / 6) * 6, Math.round(z / 6) * 6); rioCelda.set(k, d); } return d; }
const distRioFina = (x, z) => (z > -60 || z < -1100) ? 400 : distPoli(RIO, x, z);     // el río nunca baja de z = −325: más al sur la distancia pasa de 235 y no cuenta

/* ---------- relieve ---------- */
export const ARX = [-70, -118], FORO = [12, 52], FORO_GIRO = 0.12, FORO_M = [52, 36];      // foro: medias anchuras
function alturaDe(x, z, pliegues) {
  const R = Math.hypot(x, z);
  let h = 7 * (fbm(x / 300 + 7.3, z / 300 + 2.1, 3) - 0.5) + 1.2 * (fbm(x / 40, z / 40, 2) - 0.5);
  const ga = Math.exp(-((x - ARX[0]) ** 2 / 115 ** 2 + (z - ARX[1]) ** 2 / 95 ** 2)); h += 50 * (1 - Math.exp(-3.2 * ga)) / (1 - Math.exp(-3.2));
  h += 21 * Math.exp(-((x - 160) ** 2 / 140 ** 2 + (z - 20) ** 2 / 125 ** 2));
  h += 9 * Math.exp(-((x + 230) ** 2 / 120 ** 2 + (z - 120) ** 2 / 150 ** 2));
  const df = Math.hypot(x - FORO[0], z - FORO[1]); h = mix(3.2, h, ss(45, 115, df));                                     // el foro, en la vaguada, casi llano
  if (R > 900) h += (R - 900) * 0.085 * (0.25 + 1.5 * fbm(x / 700 + 3, z / 700 + 9, 3)) * ss(900, 1500, R);                // lomas lejanas
  if (pliegues && R > 1250) { const pl = 1 - Math.abs(2 * fbm(x / 520 + 60, z / 520 + 13, 3) - 1); h += ss(1250, 2000, R) * (40 + (R - 1250) * 0.03) * (pl - 0.72); }   // pliegues y barrancos en las lomas lejanas
  const d = distRioFina(x, z); if (d < 235) { h = mix(-1.6 + 1.2 * (fbm(x / 60, z / 60, 2) - 0.5), h, ss(60, 230, d)); h = mix(-8, h, ss(38, 70, d)); }
  return h;
}
export const altura = (x, z) => alturaDe(x, z, true);

/* Altura en coordenadas LOCALES del juego, con una rejilla horneada (celda de 3,5) que se muestrea de forma bilineal:
   la gente y la guarnición la piden cada cuadro. Fuera de la rejilla se llama a altura. */
const G = { x0: -300, z0: -560, paso: 3.5, nx: 230, nz: 286, d: null };     // coordenadas del MUNDO: x −300…505, z −560…441
function hornear() {
  const d = new Float32Array(G.nx * G.nz);
  for (let j = 0; j < G.nz; j++) for (let i = 0; i < G.nx; i++) d[j * G.nx + i] = altura(G.x0 + i * G.paso, G.z0 + j * G.paso);
  G.d = d;
}
export function alturaRejilla(x, z) {              // x, z del mundo
  if (!G.d) hornear();
  const u = (x - G.x0) / G.paso, v = (z - G.z0) / G.paso;
  if (u < 0 || v < 0 || u >= G.nx - 1 || v >= G.nz - 1) return altura(x, z);
  const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, d = G.d, o = j * G.nx + i;
  return (d[o] * (1 - fu) + d[o + 1] * fu) * (1 - fv) + (d[o + G.nx] * (1 - fu) + d[o + G.nx + 1] * fu) * fv;
}
export const alt = (x, z) => alturaRejilla(x + OX, z + OZ);       // punto local → altura

/* ---------- muralla de la maqueta (solo para no poner parcelas dentro de lo que será la ciudad densa) ---------- */
function radioMuro(t) { const c = Math.cos(t), s = Math.sin(t); return (1 / Math.sqrt(c * c / (335 * 335) + s * s / (285 * 285))) * (1 + 0.085 * Math.sin(2 * t + 1.3) + 0.06 * Math.sin(3 * t + 4.1) + 0.035 * Math.sin(5 * t + 0.7) + 0.02 * Math.sin(9 * t + 2)); }
export const fracMuro = (x, z) => Math.hypot(x, z) / radioMuro(Math.atan2(z, x));     // <1 dentro

/* ---------- puerto: orilla sur del río, cerca del punto del mundo x ≈ 150 ---------- */
export function puertoMundo() {
  let m = -1; RIO.forEach((p, i) => { if (i > 0 && i < RIO.length - 1 && p[1] > -600 && p[1] < -300 && (m < 0 || Math.abs(p[0] - 150) < Math.abs(RIO[m][0] - 150))) m = i; });
  const p = RIO[m], a = RIO[m - 1], b = RIO[m + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L;
  let nx = -tz, nz = tx; if (nz < 0) { nx = -nx; nz = -nz; }                                  // la normal hacia el sur
  return { rx: p[0], rz: p[1], tx, tz, nx, nz, x: p[0] + nx * 78, z: p[1] + nz * 78, giro: Math.atan2(-nx, -nz) * 180 / Math.PI };       // el edificio a 78 del eje, de cara al agua (giro en grados)
}

/* ---------- campo: lo que se pinta en el suelo y el puente ----------
   (WX, WZ) = media anchura y medio fondo del recinto del juego. Devuelve coordenadas del MUNDO. */
export function generarCampo(WX, WZ) {
  const puertas = { sur: [OX, OZ + WZ], norte: [OX, OZ - WZ], este: [OX + WX, OZ], oeste: [OX - WX, OZ] };
  const contorno = [[OX - WX, OZ - WZ], [OX + WX, OZ - WZ], [OX + WX, OZ + WZ], [OX - WX, OZ + WZ]];
  /* calles del interior: cardo y decumano, de puerta a puerta */
  const calles = [{ p: suavizar([puertas.norte, [OX, OZ], puertas.sur], 3), w: 4.6, t: 'via' }, { p: suavizar([puertas.oeste, [OX, OZ], puertas.este], 3), w: 4.6, t: 'via' }];
  /* caminos de fuera: salen de las cuatro puertas; el del norte rodea la arx por el este y cruza el río por el puente */
  const iPuente = RIO.reduce((m, p, i) => Math.hypot(p[0] - 82, p[1] + 450) < Math.hypot(RIO[m][0] - 82, RIO[m][1] + 450) ? i : m, 0), PUENTE = { x: RIO[iPuente][0], z: RIO[iPuente][1], ang: Math.atan2(RIO[iPuente + 1][1] - RIO[iPuente - 1][1], RIO[iPuente + 1][0] - RIO[iPuente - 1][0]) + Math.PI / 2 };
  const fuera = { sur: [puertas.sur, [-10, 420], [30, 620], [-40, 900], [60, 1500], [0, 2600]], norte: [puertas.norte, [50, -80], [78, -150], [60, -215], [70, -350], [PUENTE.x - Math.cos(PUENTE.ang) * 45, PUENTE.z - Math.sin(PUENTE.ang) * 45], [PUENTE.x + Math.cos(PUENTE.ang) * 45, PUENTE.z + Math.sin(PUENTE.ang) * 45], [60, -640], [140, -900], [60, -1300], [200, -2400]], este: [puertas.este, [470, 60], [640, 10], [900, 90], [1500, 40], [2600, 200]], oeste: [puertas.oeste, [-470, 110], [-640, 60], [-900, 150], [-1600, 80], [-2600, 200]] };
  const caminos = Object.entries(fuera).map(([k, p]) => ({ p: suavizar(p, 5), w: 4.2, t: 'camino', k }));
  caminos.push({ p: suavizar([[-10, 420], [-160, 470], [-330, 560], [-520, 610], [-900, 760]], 5), w: 2.6, t: 'senda' }, { p: suavizar([[70, -350], [-80, -330], [-260, -330], [-420, -300], [-640, 60]], 5), w: 2.4, t: 'senda' }, { p: suavizar([[470, 60], [430, 240], [300, 420], [30, 620]], 5), w: 2.4, t: 'senda' }, { p: suavizar([[60, -640], [-200, -700], [-520, -820], [-1000, -900]], 5), w: 2.4, t: 'senda' }, { p: suavizar([[140, -900], [420, -820], [760, -900]], 5), w: 2.2, t: 'senda' });
  const pu = puertoMundo(); caminos.push({ p: suavizar([[pu.x, pu.z], [(pu.x + 70) / 2 + 8, (pu.z - 350) / 2], [70, -350]], 5), w: 2.4, t: 'senda' });      // del puerto al camino del norte

  /* parcelas: rejilla deformada de cuadriláteros que comparten lindes (las de la maqueta; sin las que caerían a menos de 30 del recinto) */
  const parcelas = [], PASO = 96, N = 34, nodo = (i, j) => { const x = (i - N / 2) * PASO, z = (j - N / 2) * PASO; return [x + (fbm(x / 420 + 11, z / 420 + 5, 2) - 0.5) * 150 + (h2(i * 7 + 3, j * 13 + 1) - 0.5) * 46, z + (fbm(x / 420 + 31, z / 420 + 17, 2) - 0.5) * 150 + (h2(i * 5 + 9, j * 3 + 7) - 0.5) * 46]; };
  const cercaRecinto = e => e[0] > OX - WX - 30 && e[0] < OX + WX + 30 && e[1] > OZ - WZ - 30 && e[1] < OZ + WZ + 30;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const q = [nodo(i, j), nodo(i + 1, j), nodo(i + 1, j + 1), nodo(i, j + 1)], cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cz = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4, f = fracMuro(cx, cz), dr = distRio(cx, cz);
    if (q.some(e => fracMuro(e[0], e[1]) < 1.07 || cercaRecinto(e)) || dr < 40 || alturaDe(cx, cz, false) > 60) continue; const v = h2(i * 31 + 5, j * 17 + 11), lejos = ss(1.6, 4.5, f);
    if (v < 0.1 + 0.45 * lejos) continue;                                                             // erial / pasto seco
    const u = h2(i * 3 + 77, j * 29 + 3); let clase = dr < 150 && u < 0.6 ? 'huerta' : u < 0.36 ? 'rastrojo' : u < 0.56 ? 'barbecho' : u < 0.74 ? 'vina' : u < 0.9 ? 'olivar' : 'pasto';
    /* se parte en 1-3 tiras para que no sean todas iguales */
    const tiras = 1 + Math.floor(h2(i + 100, j + 50) * 3), dir = h2(i + 9, j + 77) < 0.5;
    for (let k = 0; k < tiras; k++) { const a = k / tiras, b = (k + 1) / tiras, L = (p, r, t) => [p[0] + (r[0] - p[0]) * t, p[1] + (r[1] - p[1]) * t]; const pol = dir ? [L(q[0], q[1], a), L(q[0], q[1], b), L(q[3], q[2], b), L(q[3], q[2], a)] : [L(q[0], q[3], a), L(q[1], q[2], a), L(q[1], q[2], b), L(q[0], q[3], b)];
      const cl = k === 0 ? clase : ['rastrojo', 'barbecho', 'vina', 'pasto', clase][Math.floor(h2(i * 9 + k, j * 5 + k) * 5)]; parcelas.push({ pol, clase: cl, ang: Math.atan2(pol[1][1] - pol[0][1], pol[1][0] - pol[0][0]) + (dir ? Math.PI / 2 : 0), v: h2(i + k * 13, j + k * 7), linde: h2(i * 2 + k, j * 11) }); } }
  return { puertas, contorno, calles, caminos, parcelas, PUENTE };
}
