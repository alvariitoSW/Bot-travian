/* AQVILA — la ciudad nueva: «fundar, colocar, crecer». REGLAS sin pantalla: corre igual en Node y en el navegador (módulo ESM).
   Viene de la maqueta gobierno/maquetas/ciudad3/reglas.js. Todo lo de este archivo es INVENTADO (reglas de juego).
   El relieve y el río son los de js/gfx/mundo.js (los mismos que ciudad2/mundo.js).
   Unidades: las de los modelos de 0 A.D. (una casa ~15 de lado). Ejes: +x este, +z sur. El río cruza por el norte.
   Piezas: terreno en rejilla -> nota de sitio -> calles (ruta que rodea lo empinado) -> parcelas a los lados -> casas que nacen y
   suben de nivel -> barrios -> sucesos (crecida, incendio, hambre). La vista solo lee el estado E y E.rev (cambia al cambiar algo). */
import { azar, suavizar, distPoli, altura, RIO, NIVEL_RIO, distRio } from './gfx/mundo.js';
export { altura, RIO, NIVEL_RIO, distRio, azar };

/* ---------- rejilla del terreno jugable ---------- */
export const X0 = -480, Z0 = -520, LADO = 960, C = 4, N = LADO / C;
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const ROMANOS = ['', 'I', 'II', 'III', 'IV'];
export const RETRASO_BARRIO = 3;   // meses seguidos de déficit antes de que un barrio baje un nivel (igual que D.BARRIO_RETRASO; una prueba lo vigila)
const ALT = new Float32Array(N * N), DRIO = new Float32Array(N * N), PEND = new Float32Array(N * N);
let terrenoHecho = false;
function terreno() { if (terrenoHecho) return; terrenoHecho = true;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = X0 + (i + 0.5) * C, z = Z0 + (j + 0.5) * C; ALT[j * N + i] = altura(x, z); DRIO[j * N + i] = distPoli(RIO, x, z); }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = ALT[j * N + Math.min(N - 1, i + 1)] - ALT[j * N + Math.max(0, i - 1)], b = ALT[Math.min(N - 1, j + 1) * N + i] - ALT[Math.max(0, j - 1) * N + i]; PEND[j * N + i] = Math.hypot(a, b) / (2 * C); } }
const ci = (x, z) => { const i = Math.floor((x - X0) / C), j = Math.floor((z - Z0) / C); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
const alt = (x, z) => { const k = ci(x, z); return k < 0 ? altura(x, z) : ALT[k]; };
const drio = (x, z) => { const k = ci(x, z); return k < 0 ? 400 : DRIO[k]; };
const pend = (x, z) => { const k = ci(x, z); return k < 0 ? 0 : PEND[k]; };
export const esAgua = (x, z) => drio(x, z) < 52 || alt(x, z) < NIVEL_RIO + 0.5;
export const inundable = (x, z) => drio(x, z) < 120 && alt(x, z) < 1.2;
/* CN14-B: sucesos apagables y dificultad de la ciudad (no confundir con Fácil/Normal/Difícil, que son del enemigo en la batalla).
   Los números viven en DATA.DIFICULTAD (js/data.js); esta copia solo vale si data.js no está cargado (una prueba vigila que coincidan). */
const DIF_RESERVA = { tranquila: { nombre: 'Tranquila', crecida: { ruina: 3 }, incendio: { prob: 0.045, max: 2 }, hambre: { meses: 1 }, aviso: 6 },
  normal: { nombre: 'Normal', crecida: { ruina: 5 }, incendio: { prob: 0.09, max: 3 }, hambre: { meses: 3 }, aviso: 5 },
  dura: { nombre: 'Dura', crecida: { ruina: 7 }, incendio: { prob: 0.13, max: 4 }, hambre: { meses: 3 }, aviso: 3 } };
const ON_TIPO = { crecida: 'crecida', incendio: 'fuego', hambre: 'hambre' };
/* suceso(E, tipo, mesN): tipo 'crecida' | 'incendio' | 'hambre' -> { activo, dif, aviso, ...parámetros del tipo }. E.suc(mesN) -> { dif, on: { crecida, fuego, hambre } }; sin E.suc = Normal con todo encendido. */
export function suceso(E, tipo, mesN) {
  const T = (typeof globalThis !== 'undefined' && globalThis.DATA && globalThis.DATA.DIFICULTAD) || DIF_RESERVA;
  const c = E && E.suc ? E.suc(mesN ?? E.mesN) : null, dif = c && T[c.dif] ? c.dif : 'normal', on = (c && c.on) || {}, N = T[dif];
  return { activo: on[ON_TIPO[tipo]] !== false, dif, aviso: N.aviso, ...N[tipo] };
}
/* ribera: ¿es ribera baja Y la crecida está encendida? Único sitio donde se decide (CN13b añadirá aquí la protección). */
export const ribera = (E, x, z, mesN) => inundable(x, z) && suceso(E, 'crecida', mesN).activo;
const vega = (x, z) => { const d = drio(x, z); return d >= 120 && d < 330 && alt(x, z) < 6; };

/* puente y camino que ya estaban antes de la colonia */
const iP = RIO.reduce((m, p, i) => Math.hypot(p[0] - 82, p[1] + 450) < Math.hypot(RIO[m][0] - 82, RIO[m][1] + 450) ? i : m, 0);
export const PUENTE = { x: RIO[iP][0], z: RIO[iP][1], ang: Math.atan2(RIO[iP + 1][1] - RIO[iP - 1][1], RIO[iP + 1][0] - RIO[iP - 1][0]) + Math.PI / 2 };
const pS = [PUENTE.x + Math.cos(PUENTE.ang) * 45, PUENTE.z + Math.sin(PUENTE.ang) * 45], pN = [PUENTE.x - Math.cos(PUENTE.ang) * 45, PUENTE.z - Math.sin(PUENTE.ang) * 45];
const CAMINO = suavizar([[0, 2600], [60, 1500], [-40, 900], [-20, 560], [-20, 440], [60, 290], [215, 215], [325, 70], [320, -90], [245, -225], [140, -330], pS[1] > pN[1] ? pS : pN, pS[1] > pN[1] ? pN : pS, [60, -640], [140, -900], [60, -1300], [200, -2400]], 4);

/* ---------- fichas ---------- */
/* Costes en los 5 recursos del juego. Los de las piezas que existen en D.BUILD (data.js) son los de su nivel 0 (copiados:
   ciudad.js no puede importar game.js, que es un script clásico). Fuente, granero, taller y compitum no están allí: costes modestos inventados. */
const R5 = (madera = 0, piedra = 0, hierro = 0, grano = 0, oro = 0) => ({ madera, piedra, hierro, grano, oro });
export const RECURSOS = ['madera', 'piedra', 'hierro', 'grano', 'oro'];
/* Misma fórmula que G.cost de game.js: coste base × 1.5^L, redondeado a múltiplos de 5. Si cambia allí, cambiar aquí. */
const costeNivel = (base, L) => { const o = {}; for (const r of RECURSOS) o[r] = Math.round((base[r] || 0) * Math.pow(1.5, L) / 5) * 5; return o; };
const sumaCostes = l => { const o = R5(); for (const c of l) for (const r of RECURSOS) o[r] += c[r]; return o; };
/* bid = id en D.BUILD (null si no existe allí). Las piezas de producción y el almacén se abren desde 0 habitantes. */
export const EDIF = {
  fuente: { nombre: 'Fuente', bid: null, coste: R5(10, 60, 10, 0, 0), obra: 1, w: 9, d: 9, radio: 85, desde: 0, que: 'Da agua a las casas de alrededor' },
  granero: { nombre: 'Granero', bid: null, coste: R5(80, 30, 10, 20, 0), obra: 2, w: 17, d: 22, radio: 0, desde: 0, que: 'Sin granero hay hambre en invierno' },
  granja: { nombre: 'Granja', bid: 'granja', coste: R5(40, 40, 20, 10, 0), obra: 1, w: 24, d: 18, radio: 0, desde: 0, que: 'Llegan más familias y da grano' },
  aserradero: { nombre: 'Aserradero', bid: 'aserradero', coste: R5(30, 50, 20, 20, 0), obra: 1, w: 20, d: 16, radio: 0, desde: 0, que: 'Da madera; va junto al bosque' },
  cantera: { nombre: 'Cantera', bid: 'cantera', coste: R5(50, 20, 30, 20, 0), obra: 1, w: 22, d: 22, radio: 0, desde: 0, que: 'Da piedra; va en una ladera de roca' },
  mina: { nombre: 'Mina de hierro', bid: 'mina', coste: R5(50, 40, 15, 25, 0), obra: 2, w: 20, d: 20, radio: 0, desde: 0, que: 'Da hierro; va en una ladera' },
  almacen: { nombre: 'Almacén', bid: 'almacen', coste: R5(70, 60, 30, 20, 0), obra: 1, w: 20, d: 18, radio: 0, desde: 0, que: 'Guarda más recursos; va dentro del surco, cerca del foro' },
  templo: { nombre: 'Templo', bid: 'templo', coste: R5(80, 100, 30, 60, 50), obra: 2, w: 18, d: 34, radio: 100, desde: 0, que: 'Las casas con agua suben a nivel III' },
  mercado: { nombre: 'Mercado', bid: 'mercado', coste: R5(80, 70, 30, 30, 40), obra: 2, w: 26, d: 21, radio: 110, desde: 450, que: 'Cambia recursos y da renta por cada casa cercana' },
  taller: { nombre: 'Taller', bid: null, coste: R5(50, 40, 40, 15, 20), obra: 2, w: 17, d: 17, radio: 75, desde: 700, que: 'Da monedas; su humo molesta' },
  muelle: { nombre: 'Muelle', bid: 'puerto', coste: R5(140, 80, 50, 30, 60), obra: 2, w: 20, d: 30, radio: 0, desde: 700, que: 'Solo en la orilla; da comercio' },
  herreria: { nombre: 'Herrería', bid: 'herreria', coste: R5(70, 60, 90, 30, 30), obra: 2, w: 18, d: 16, radio: 0, desde: 600, que: 'Forja armas; cerca del foro y lejos de las casas (humo)' },
  escuela: { nombre: 'Escuela', bid: 'escuela', coste: R5(70, 90, 10, 40, 60), obra: 2, w: 22, d: 20, radio: 0, desde: 300, que: 'Los sabios estudian aquí; cerca del foro y lejos del humo' },
  cuartel: { nombre: 'Cuartel', bid: 'cuartel', coste: R5(90, 60, 70, 40, 0), obra: 2, w: 24, d: 20, radio: 0, desde: 300, que: 'Recluta infantería; junto a una puerta del surco' },
  establo: { nombre: 'Establo', bid: 'establo', coste: R5(110, 60, 80, 70, 0), obra: 2, w: 26, d: 20, radio: 0, desde: 500, que: 'Recluta caballería; en llano y junto a una puerta' },
  muralla: { nombre: 'Muralla', bid: 'muralla', coste: R5(40, 120, 30, 20, 0), obra: 3, radio: 0, desde: 1000, accion: true, que: 'Sigue el surco' },
  compitum: { nombre: 'Abrir barrio', bid: null, coste: R5(40, 40, 10, 20, 20), obra: 1, w: 9, d: 9, radio: 0, desde: 1400, que: 'Capilla de cruce: nace un barrio' }
};
/* id de D.BUILD -> id de pieza; y nivel de D.BUILD equivalente a cada mejora (0, I, II, III). */
export const PIEZA_DE = Object.fromEntries(Object.entries(EDIF).filter(([, D]) => D.bid).map(([k, D]) => [D.bid, k]));
export const NIVEL_MEJORA = [1, 3, 6, 10];
export const MEJORA_DE_NIVEL = n => n < 1 ? -1 : n === 1 ? 0 : n <= 3 ? 1 : n <= 6 ? 2 : 3;
/* Mejoras I, II, III. Con bid: suma de los costes de D.BUILD de los niveles que salta (I: 1-2, II: 3-5, III: 6-9).
   Sin bid: coste base × 1.5 por mejora. radioMul = cuánto crece su radio; rinde = multiplicador de lo que da (provisional). */
const SALTA = [[1, 2], [3, 4, 5], [6, 7, 8, 9]], MEJ = [[1.15, 1.2], [1.3, 1.5], [1.5, 2]];
for (const D of Object.values(EDIF)) D.mejoras = MEJ.map(([radioMul, rinde], k) => ({ coste: D.bid ? sumaCostes(SALTA[k].map(L => costeNivel(D.coste, L))) : costeNivel(D.coste, k + 1), radioMul, rinde }));
export const ORDEN = ['fuente', 'granero', 'granja', 'aserradero', 'cantera', 'mina', 'almacen', 'templo', 'mercado', 'taller', 'muelle', 'herreria', 'escuela', 'cuartel', 'establo', 'muralla', 'compitum'];
/* Monedero interno E.monedas: solo para pruebas y modo normal sin juego. Un coste en 5 recursos vale la suma de sus números. */
const valor = c => RECURSOS.reduce((s, r) => s + (c[r] || 0), 0);
/* Cobro: pago(coste)->bool lo decide el juego; sin pago se descuenta del monedero interno. */
function cobrar(E, coste, pago) { if (pago) return pago(coste) ? null : 'Faltan recursos'; const v = valor(coste); if (E.monedas < v) return 'Faltan ' + Math.ceil(v - E.monedas) + ' monedas'; E.monedas -= v; return null; }
const CABEN = [0, 15, 25, 40, 60], RENTA = [0, 0.2, 0.5, 1, 1.6];
const MAX_CASAS = 200, R_BARRIO = 150, R_AGUA_RIO = 90;

/* ---------- estado ---------- */
export function crear(semilla = 1) {
  terreno();
  const E = { semilla, modoJuego: false, rnd: azar(semilla * 7919 + 13), mesN: 0, monedas: 300, fundada: false, foro: null, surco: null, RS: null,
    vias: [], parcelas: [], bocas: [], edificios: [], barrios: [], puertas: [], arboles: [], bosquetes: [], muralla: { fase: 0, obra: 0 }, diario: [],
    abiertas: ['fuente', 'granero', 'granja', 'aserradero', 'cantera', 'mina', 'almacen', 'templo'], crecida: -99, hambre: false, avisado: {}, rev: 0, nId: 1,
    ocup: new Uint8Array(N * N), lote: new Int16Array(N * N), dVia: new Float32Array(N * N).fill(999), aVia: new Float32Array(N * N), tVia: new Uint8Array(N * N) };
  nuevaVia(E, CAMINO, 4.2, 'camino');
  bosque(E);
  return E;
}
export const fecha = E => { const m = 3 + E.mesN; return { mes: m % 12, ano: 273 - Math.floor(m / 12), texto: MESES[m % 12][0].toUpperCase() + MESES[m % 12].slice(1) + ' de ' + (273 - Math.floor(m / 12)) + ' a. C.' }; };
export const casas = E => E.parcelas.filter(p => p.casa);
export const poblacion = E => E.parcelas.reduce((s, p) => s + (p.casa && !p.casa.ruina ? CABEN[p.casa.nivel] : 0), 0);

/* bosque: manchas de árboles dentro del terreno jugable y, más ralas, hasta el horizonte */
function bosque(E) {
  const rnd = azar(E.semilla * 31 + 5), R = (a, b) => a + (b - a) * rnd();
  const pon = (pieza, x, z, esc) => { if (distPoli(RIO, x, z) < 34 || altura(x, z) < NIVEL_RIO + 0.6) return; const k = ci(x, z); if (k >= 0 && E.ocup[k]) return; E.arboles.push({ x, z, pieza, esc, tono: rnd(), ang: R(0, 6.28), talado: false }); };
  const mancha = (x, z, rad, dens) => { E.bosquetes.push({ x, z, r: rad }); const n = Math.floor(rad * rad / 150 * dens); for (let j = 0; j < n; j++) { const a = R(0, 6.283), q = Math.sqrt(rnd()) * rad, v = rnd(); pon(v < 0.1 ? 'cipres' : v < 0.4 ? 'olivo' : 'algarrobo', x + Math.cos(a) * q, z + Math.sin(a) * q * 0.75, R(0.75, 1.25)); } };
  for (let i = 0; i < 34; i++) { const x = R(-470, 470), z = R(-330, 430); if (Math.hypot(x - 12, z - 52) < 70 && rnd() < 0.7) continue; mancha(x, z, R(28, 70), R(0.45, 1)); }
  for (let i = 0; i < 130; i++) { const t = R(0, 6.283), r = R(520, 2500); mancha(Math.cos(t) * r, Math.sin(t) * r, R(40, 120), R(0.35, 0.8)); }
  for (let i = 0; i < RIO.length; i++) { const p = RIO[i]; if (Math.abs(p[0]) > 1500) continue; for (const l of [1, -1]) if (rnd() < 0.55) { const q = RIO[Math.min(RIO.length - 1, i + 1)], ang = Math.atan2(q[1] - p[1], q[0] - p[0]), r = R(62, 105); if (Math.hypot(p[0] - PUENTE.x, p[1] - PUENTE.z) > 40) pon('algarrobo', p[0] - Math.sin(ang) * r * l + R(-6, 6), p[1] + Math.cos(ang) * r * l + R(-6, 6), R(0.7, 1.2)); } }   // soto de ribera
  for (let i = 0; i < 260; i++) pon(rnd() < 0.5 ? 'olivo' : 'algarrobo', R(-480, 480), R(-380, 440), R(0.6, 1.1));                    // sueltos
}
function talar(E) { for (const a of E.arboles) { if (a.talado) continue; for (const [dx, dz] of [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5]]) { const k = ci(a.x + dx, a.z + dz); if (k >= 0 && E.ocup[k] && E.ocup[k] !== 5) { a.talado = true; break; } } } }

/* ---------- sellos en la rejilla: 0 libre · 1 calle · 2 edificio · 3 parcela · 4 plaza · 5 franja del surco ---------- */
function sello(E, x, z, ang, w, d, v, id = 0, soloSobre = -1) { const c = Math.cos(ang), s = Math.sin(ang);
  for (let u = -w / 2; u <= w / 2 + 0.01; u += 2) for (let t = -d / 2; t <= d / 2 + 0.01; t += 2) { const k = ci(x + u * c - t * s, z + u * s + t * c); if (k >= 0 && (soloSobre < 0 || E.ocup[k] === soloSobre || (soloSobre === 3 && E.lote[k] === id))) { E.ocup[k] = v; E.lote[k] = id; } } }
function huella(E, x, z, ang, w, d, f) { const c = Math.cos(ang), s = Math.sin(ang);       // f(valor, k) -> true para cortar
  for (let u = -w / 2; u <= w / 2 + 0.01; u += Math.max(2, w / 4)) for (let t = -d / 2; t <= d / 2 + 0.01; t += Math.max(2, d / 4)) { const k = ci(x + u * c - t * s, z + u * s + t * c); if (k < 0 || f(E.ocup[k], k)) return false; } return true; }
function quitarParcela(E, p) { if (p.fuera) return; p.fuera = true; for (let k = 0; k < N * N; k++) if (E.ocup[k] === 3 && E.lote[k] === p.id) { E.ocup[k] = 0; E.lote[k] = 0; } }

/* ---------- calles ---------- */
const T_VIA = { camino: 1, via: 2, calle: 3, callejon: 4, senda: 5 };
export function nuevaVia(E, p, w, t) {
  const v = { id: E.nId++, p, w, t, emp: false, largo: 0, puntas: 0, caja: [Math.min(...p.map(q => q[0])), Math.min(...p.map(q => q[1])), Math.max(...p.map(q => q[0])), Math.max(...p.map(q => q[1]))] }; for (let i = 1; i < p.length; i++) v.largo += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  const r = w + 1.5, n = Math.ceil(r / C) + 1;
  p.forEach((q, qi) => { const i0 = Math.floor((q[0] - X0) / C), j0 = Math.floor((q[1] - Z0) / C); if (i0 < -20 || j0 < -20 || i0 > N + 20 || j0 > N + 20) return;
    for (let j = j0 - n; j <= j0 + n; j++) for (let i = i0 - n; i <= i0 + n; i++) { if (i < 0 || j < 0 || i >= N || j >= N) continue; const k = j * N + i; if (Math.hypot(X0 + (i + 0.5) * C - q[0], Z0 + (j + 0.5) * C - q[1]) > r) continue; if (E.ocup[k] === 3) { const l = E.parcelas[E.lote[k] - 1]; if (l && !l.casa) quitarParcela(E, l); } if (E.ocup[k] !== 2 && E.ocup[k] !== 4 && E.ocup[k] !== 3) { E.ocup[k] = 1; E.lote[k] = 0; } }
    if (qi % 2 === 0) { const a = p[Math.max(0, qi - 1)], b = p[Math.min(p.length - 1, qi + 1)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), m = 16;
      for (let j = j0 - m; j <= j0 + m; j++) for (let i = i0 - m; i <= i0 + m; i++) { if (i < 0 || j < 0 || i >= N || j >= N) continue; const k = j * N + i, d = Math.hypot(X0 + (i + 0.5) * C - q[0], Z0 + (j + 0.5) * C - q[1]); if (d < E.dVia[k]) { E.dVia[k] = d; E.aVia[k] = ang; E.tVia[k] = T_VIA[t]; } } } });
  E.vias.push(v); E.rev++; return v;
}
/* ruta más barata por la rejilla (Dijkstra): rodea lo empinado, no pisa agua, edificios ni casas. meta(k) -> true al llegar */
let topeRuta = Infinity;       // solo lo pone fundarAuto en su ensayo: corta las rutas que no salen (si no, recorren todo el mapa)
function ruta(E, x0, z0, meta, libreCerca = 0) {
  const k0 = ci(x0, z0); if (k0 < 0) return null; const coste = new Float32Array(N * N).fill(1e9), de = new Int32Array(N * N).fill(-1), H = [[0, k0]]; coste[k0] = 0; let fin = -1;
  const sube = i => { while (i > 0) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } }, baja = () => { let i = 0; for (;;) { let m = i; const a = 2 * i + 1, b = a + 1; if (a < H.length && H[a][0] < H[m][0]) m = a; if (b < H.length && H[b][0] < H[m][0]) m = b; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } };
  while (H.length) { const [c, k] = H[0]; const u = H.pop(); if (H.length) { H[0] = u; baja(); } if (c > coste[k]) continue; if (c > topeRuta) break; if (k !== k0 && meta(k)) { fin = k; break; }
    const i = k % N, j = (k - i) / N;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const a = i + di, b = j + dj; if (a < 1 || b < 1 || a >= N - 1 || b >= N - 1) continue; const q = b * N + a, L = C * (di && dj ? 1.414 : 1), o = E.ocup[q];
      const cerca = libreCerca && Math.hypot((a - k0 % N) * C, (b - Math.floor(k0 / N)) * C) < libreCerca;
      if (!meta(q) && !cerca) { if (o === 2 || o === 4) continue; if (o === 3) { const l = E.parcelas[E.lote[q] - 1]; if (l && l.casa) continue; } if (DRIO[q] < 56 || ALT[q] < NIVEL_RIO + 0.6) continue; }
      const p = Math.abs(ALT[q] - ALT[k]) / L; if (p > 0.42 && !cerca) continue;
      const nc = c + L * (1 + 55 * p * p + PEND[q] * 3) * (o === 3 ? 2.5 : 1) + (o === 5 ? 30 : 0); if (nc < coste[q]) { coste[q] = nc; de[q] = k; H.push([nc, q]); sube(H.length - 1); } } }
  if (fin < 0) return null; const celdas = []; for (let k = fin; k >= 0; k = de[k]) celdas.push(k); celdas.reverse();
  const pts = []; celdas.forEach((k, n) => { if (n % 4 === 0 || n === celdas.length - 1) pts.push([X0 + (k % N + 0.5) * C, Z0 + (Math.floor(k / N) + 0.5) * C]); });
  return pts.length > 1 ? pts : null;
}
const alisar = pts => { let p = pts; for (let n = 0; n < 2; n++) p = p.map((q, i) => i === 0 || i === p.length - 1 ? q : [(p[i - 1][0] + 2 * q[0] + p[i + 1][0]) / 4, (p[i - 1][1] + 2 * q[1] + p[i + 1][1]) / 4]); return suavizar(p, 3); };
/* punto más cercano de una calle ya hecha (para enganchar bien el final de una ruta) */
function engancha(E, pts) { const f = pts[pts.length - 1]; let m = 1e9, mq = null; for (const v of E.vias) for (const q of v.p) { const d = Math.hypot(q[0] - f[0], q[1] - f[1]); if (d < m) { m = d; mq = q; } } if (mq && m < 14 && m > 0.5) pts.push([mq[0], mq[1]]); return pts; }

/* ---------- barrios ---------- */
function radioSurco(E, x, z) { const t = Math.atan2(z - E.foro.z, x - E.foro.x), n = E.RS.length, f = ((t / (Math.PI * 2)) % 1 + 1) % 1 * n, i = Math.floor(f), u = f - i; return E.RS[i % n] * (1 - u) + E.RS[(i + 1) % n] * u; }
export const dentro = (E, x, z) => E.fundada && Math.hypot(x - E.foro.x, z - E.foro.z) < radioSurco(E, x, z);
export function barrioDe(E, x, z) { let m = 1e9, mb = -1; E.barrios.forEach((b, i) => { const d = Math.hypot(x - b.x, z - b.z), lim = b.tipo === 'foro' ? radioSurco(E, x, z) + 45 : R_BARRIO; if (d <= lim) { const dn = d / lim; if (dn < m) { m = dn; mb = i; } } }); return mb; }

/* ---------- parcelas a los lados de una calle; cada 4 huecos se reserva una boca de callejón ---------- */
function parcelar(E, v) {
  if (v.t === 'senda') return; let s = 0, sig = v.t === 'callejon' ? 7 : 9, k = v.kHecho || 0; const p = v.p;
  for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!L) continue;
    while (sig <= s + L) { const u = (sig - s) / L, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(ang), nz = Math.cos(ang), kk = Math.round((sig - 9) / 15.5); sig += 15.5;
      if (sig > v.largo + 8.5 - (v.t === 'callejon' ? 0 : 7)) break; if (v.hechos && v.hechos.has(kk)) continue; if (barrioDe(E, x, z) < 0) continue; (v.hechos = v.hechos || new Set()).add(kk);
      for (const lado of [1, -1]) { const ret = v.w + 1.4 + 7.75, cx = x + nx * ret * lado, cz = z + nz * ret * lado;
        if ((kk + (lado > 0 ? 2 : 0)) % 4 === (v.t === 'callejon' ? 2 : 1)) { E.bocas.push({ via: v.id, x: x + nx * (v.w + 0.5) * lado, z: z + nz * (v.w + 0.5) * lado, dx: nx * lado, dz: nz * lado, hecha: false }); continue; }
        const b = barrioDe(E, cx, cz); if (b < 0) continue; let mn = 1e9, mx = -1e9;
        if (!huella(E, cx, cz, ang, 12, 13, (o, q) => { mn = Math.min(mn, ALT[q]); mx = Math.max(mx, ALT[q]); return o === 2 || o === 4 || o === 5 || DRIO[q] < 56 || ALT[q] < NIVEL_RIO + 1; }) || mx - mn > 4.6) continue;
        if (E.parcelas.some(l => !l.fuera && Math.abs(l.x - cx) < 14 && Math.hypot(l.x - cx, l.z - cz) < 13.6)) continue;
        if (E.vias.some(o => !(cx < o.caja[0] - 14 || cz < o.caja[1] - 14 || cx > o.caja[2] + 14 || cz > o.caja[3] + 14) && distPoli(o.p, cx, cz) < o.w + (o === v ? 7.6 : 8.2))) continue;
        const l = { id: E.parcelas.length + 1, x: cx, z: cz, ang, lado, via: v.id, barrio: b, casa: null, tono: E.rnd(), teja: E.rnd(), tipo: E.rnd(), fuera: false, arrabal: !dentro(E, cx, cz) };
        E.parcelas.push(l); sello(E, cx, cz, ang, 11, 12, 3, l.id, 0); } }
    s += L; }
}
function reparcelar(E) { for (const v of E.vias) parcelar(E, v); talar(E); E.rev++; }

/* callejón recto desde una boca: para ante el agua, lo empinado, una casa o el surco; si topa con otra calle, se une a ella */
function callejon(E, b, largoMax = 78) {
  b.hecha = true; const pts = [[b.x, b.z]]; let x = b.x, z = b.z, une = false;
  for (let s = 3; s <= largoMax; s += 3) { const nx = b.x + b.dx * s, nz = b.z + b.dz * s, k = ci(nx, nz); if (k < 0) break; const o = E.ocup[k];
    if (o === 1 && s > 12) { pts.push([nx, nz]); une = true; break; } if (o === 2 || o === 4 || o === 5) break; if (o === 3) { const l = E.parcelas[E.lote[k] - 1]; if (l && l.casa) break; }
    if (DRIO[k] < 60 || ALT[k] < NIVEL_RIO + 1 || Math.abs(ALT[k] - alt(x, z)) / 3 > 0.3 || barrioDe(E, nx, nz) < 0) break; pts.push([nx, nz]); x = nx; z = nz; }
  if (pts.length < 10) return null; const v = nuevaVia(E, pts, 1.9, 'callejon'); v.punta = une ? null : [x, z]; return v;
}
/* dos puntas de callejón vecinas se unen con una calle: se cierra la manzana */
function unirPuntas(E) {
  const c = E.vias.filter(v => v.punta && v.puntas < 2);
  for (const a of c) for (const b of c) { if (a.id >= b.id || a.puntas >= 2 || b.puntas >= 2) continue; const d = Math.hypot(a.punta[0] - b.punta[0], a.punta[1] - b.punta[1]); if (d < 34 || d > 96 || (a.unidas || []).includes(b.id)) continue;
    let ok = true; const pts = []; for (let s = 0; s <= d; s += 3) { const x = a.punta[0] + (b.punta[0] - a.punta[0]) * s / d, z = a.punta[1] + (b.punta[1] - a.punta[1]) * s / d, k = ci(x, z), o = k < 0 ? 2 : E.ocup[k]; if (o === 2 || o === 4 || o === 5 || (o === 1 && s > 6 && s < d - 6) || DRIO[k] < 60 || PEND[k] > 0.3) { ok = false; break; } if (o === 3) { const l = E.parcelas[E.lote[k] - 1]; if (l && l.casa) { ok = false; break; } } pts.push([x, z]); }
    (a.unidas = a.unidas || []).push(b.id); if (!ok) continue; pts.push([b.punta[0], b.punta[1]]); nuevaVia(E, pts, 2.3, 'calle'); a.puntas++; b.puntas++; return true; }
  return false;
}

/* ---------- servicios ---------- */
const hechos = (E, t) => E.edificios.filter(e => e.tipo === t && !e.obra && !e.ruina);
/* Radio real de un edificio en (x, z): el de su ficha (el templo sube con la altura) por la mejora (0 = sin mejorar). */
export function alcance(E, tipo, x, z, mejora = 0) { const D = EDIF[tipo]; if (!D) return 0; const base = tipo === 'templo' ? radioTemplo(E, x, z) : (D.radio || 0); return base * (mejora > 0 ? D.mejoras[mejora - 1].radioMul : 1); }
/* Casas que quedarían dentro de ese radio. */
export function casasEnRadio(E, tipo, x, z, mejora = 0) { const r = alcance(E, tipo, x, z, mejora); return r ? E.parcelas.reduce((n, l) => n + (l.casa && !l.fuera && Math.hypot(l.x - x, l.z - z) < r ? 1 : 0), 0) : 0; }
export const radioTemplo = (E, x, z) => Math.max(100, Math.min(230, 100 + 7 * (alt(x, z) - (E.foro ? alt(E.foro.x, E.foro.z) : 0))));
function servicios(E) { return { fu: hechos(E, 'fuente'), te: hechos(E, 'templo'), me: hechos(E, 'mercado'), ta: E.edificios.filter(e => e.tipo === 'taller' && !e.ruina) }; }
const cerca = (l, x, z, r) => l.some(e => Math.hypot(e.x - x, e.z - z) < (r || e.radio));
function sirve(S, x, z) { return { agua: drio(x, z) < R_AGUA_RIO || cerca(S.fu, x, z), fuente: cerca(S.fu, x, z), templo: cerca(S.te, x, z), mercado: cerca(S.me, x, z), humo: cerca(S.ta, x, z) }; }
const topeNivel = s => s.humo ? 1 : !s.agua ? 1 : !s.templo ? 2 : !s.mercado ? 3 : 4;
function atractivo(E, S, l, mn) { const s = sirve(S, l.x, l.z), b = E.barrios[l.barrio], d = Math.hypot(l.x - b.x, l.z - b.z);
  return (s.agua ? 2 : 0) + (s.templo ? 1.2 : 0) + (s.mercado ? 1.2 : 0) - (s.humo ? 3 : 0) - (ribera(E, l.x, l.z, mn) ? 4 : 0) - pend(l.x, l.z) * 8 - d / 45 - (l.arrabal ? 1.2 : 0) + (b.tipo === 'foro' ? 0.6 : 0); }

export function nivelBarrio(E, i) { const S = servicios(E), cs = E.parcelas.filter(l => l.casa && !l.fuera && l.barrio === i), n = cs.length || 1; let ag = 0, te = 0, me = 0, hu = 0;
  for (const l of cs) { const s = sirve(S, l.x, l.z); ag += s.agua; te += s.templo; me += s.mercado; hu += s.humo; }
  const nivel = !cs.length || ag / n < 0.5 ? 1 : te / n < 0.5 ? 2 : me / n < 0.5 ? 3 : 4, falta = nivel === 4 ? '' : nivel === 1 ? 'agua (una fuente)' : nivel === 2 ? 'templo' : 'mercado';
  return { nivel, falta, casas: cs.length, humo: hu, arrabal: cs.filter(l => l.arrabal).length, ag, te, me }; }
/* El nivel de nivelBarrio es el OBJETIVO (por servicios). El EFECTIVO es b.nivel (1-4): sube uno por mes y baja tras RETRASO_BARRIO meses de déficit (b.bdef). */
export function mesesParaBajar(E, i) { const b = E.barrios[i], o = nivelBarrio(E, i).nivel; return o < (b.nivel || 1) ? Math.max(0, RETRASO_BARRIO - (b.bdef || 0)) : 0; }
export function textoBarrio(E, i) { const b = E.barrios[i], n = nivelBarrio(E, i), niv = b.nivel || 1, baja = mesesParaBajar(E, i);
  return b.nombre + ' · nivel ' + ROMANOS[niv] + ' · ' + n.casas + ' casas' + (n.nivel > niv ? ' · subirá pronto' : n.falta ? ' · para subir falta ' + n.falta : ' · lo tiene todo') + (baja ? ' · bajará en ' + baja + (baja === 1 ? ' mes' : ' meses') : '') + (n.humo > n.casas / 3 ? ' · le molesta el humo' : '') + (n.arrabal > 2 && E.muralla.fase ? ' · ' + n.arrabal + ' fuera de la muralla' : ''); }


/* ---------- fundar ---------- */
export function notaFundar(E, x, z) {
  if (Math.abs(x) > 250 || z < -400 || z > 230) return { nota: -99, vale: false, razones: ['Demasiado lejos: funda más cerca del río y del camino'] };
  if (esAgua(x, z)) return { nota: -9, vale: false, razones: ['En el agua no se funda'] };
  let des = 0; for (const r of [45, 100]) for (let a = 0; a < 8; a++) des = Math.max(des, Math.abs(alt(x + Math.cos(a * 0.785) * r, z + Math.sin(a * 0.785) * r) - alt(x, z)));
  if (pend(x, z) > 0.22) return { nota: -9, vale: false, razones: ['Ladera demasiado empinada para un foro'] };
  const d = drio(x, z), h = alt(x, z), k = ci(x, z), dc = k < 0 ? 999 : E.dVia[k], raz = []; let n = 0;
  if (ribera(E, x, z, E.mesN + 1)) { n -= 3; raz.push('Se inunda en primavera −3'); }
  if (d < 230) { n += 2; raz.push('Agua cerca +2'); } else if (d > 360) { n -= 1; raz.push('Lejos del agua −1'); }
  if (h >= 6) { n += 2; raz.push('En la loma: se defiende mejor +2'); }
  if (des < 9) { n += 1; raz.push('Llano para crecer +1'); } else if (des > 22) { n -= 2; raz.push('Muy empinado alrededor −2'); }
  if (dc < 110) { n += 1; raz.push('Junto al camino +1'); }
  if (!raz.length) raz.push('Sitio corriente');
  return { nota: n, vale: true, razones: raz };
}
export function fundar(E, x, z) {
  if (E.fundada || !notaFundar(E, x, z).vale) return false;
  const rnd = E.rnd, f1 = rnd() * 6.28, f2 = rnd() * 6.28;
  /* surco: anillo irregular; se encoge donde toparía con el agua */
  const NR = 96, RS = []; for (let i = 0; i < NR; i++) { const t = i / NR * Math.PI * 2; let r = 150 * (1 + 0.09 * Math.sin(2 * t + f1) + 0.06 * Math.sin(3 * t + f2)); while (r > 55 && (drio(x + Math.cos(t) * (r + 12), z + Math.sin(t) * (r + 12)) < 66 || ci(x + Math.cos(t) * r, z + Math.sin(t) * r) < 0)) r -= 5; RS.push(r); }
  for (let n = 0; n < 6; n++) { const o = RS.slice(); for (let i = 0; i < NR; i++) RS[i] = Math.min(o[i], (o[(i + NR - 1) % NR] + o[i] * 2 + o[(i + 1) % NR]) / 4 + 0.5); }
  E.RS = RS; E.surco = RS.map((r, i) => [x + Math.cos(i / NR * Math.PI * 2) * r, z + Math.sin(i / NR * Math.PI * 2) * r]);
  /* vía 1: del foro al camino (hacia el río y el puente). vía 2: hacia lo más alto de alrededor */
  const p1 = ruta(E, x, z, k => E.ocup[k] === 1, 30); let ang = 0;
  if (p1) { const q = p1[Math.min(p1.length - 1, 3)]; ang = Math.atan2(q[1] - z, q[0] - x); }
  E.foro = { x, z, ang, w: 46, d: 34 }; E.fundada = true;
  E.barrios.push({ nombre: 'Barrio del Foro', corto: 'Foro', x, z, tipo: 'foro', nivel: 1, bdef: 0 });
  let mh = -1e9, mk = -1; for (let j = 0; j < N; j += 2) for (let i = 0; i < N; i += 2) { const k = j * N + i, qx = X0 + (i + 0.5) * C, qz = Z0 + (j + 0.5) * C, d = Math.hypot(qx - x, qz - z); if (d < 120 || d > 215 || DRIO[k] < 90 || PEND[k] > 0.3) continue; const cosA = p1 ? ((qx - x) * Math.cos(ang) + (qz - z) * Math.sin(ang)) / d : 0; const v = ALT[k] - cosA * 6 - (cosA > 0.3 ? 100 : 0); if (v > mh) { mh = v; mk = k; } }
  const corta = pts => { const o = pts.filter(q => { const u = (q[0] - x) * Math.cos(ang) + (q[1] - z) * Math.sin(ang), t = -(q[0] - x) * Math.sin(ang) + (q[1] - z) * Math.cos(ang); return Math.abs(u) > 23 || Math.abs(t) > 17; }); return o; };
  sello(E, x, z, ang, 46, 34, 4);
  if (p1) { const c = corta(p1); c.unshift([x + Math.cos(ang) * 23, z + Math.sin(ang) * 23]); nuevaVia(E, alisar(engancha(E, c)), 3.6, 'via'); }
  const p2 = mk >= 0 ? ruta(E, x, z, k => k === mk, 30) : null;
  if (p2) { const c = corta(p2), q = c[0] || p2[p2.length - 1], t = Math.atan2(q[1] - z, q[0] - x), du = Math.cos(t - ang), dt = Math.sin(t - ang), e = Math.abs(du) * 17 > Math.abs(dt) * 23 ? [Math.sign(du) * 23, dt / Math.abs(du) * 23 * 0.5] : [du / Math.abs(dt) * 17 * 0.5, Math.sign(dt) * 17];
    c.unshift([x + e[0] * Math.cos(ang) - e[1] * Math.sin(ang), z + e[0] * Math.sin(ang) + e[1] * Math.cos(ang)]); nuevaVia(E, alisar(c), 3.6, 'via'); }
  /* franja sagrada del surco: nadie construye encima; las calles la cruzan por las puertas */
  for (let i = 0; i < NR; i++) { const a = E.surco[i], b = E.surco[(i + 1) % NR], L = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s = 0; s <= L; s += 2) for (const o of [-4, 0, 4]) { const t = Math.atan2(a[1] - z, a[0] - x), k = ci(a[0] + (b[0] - a[0]) * s / L + Math.cos(t) * o, a[1] + (b[1] - a[1]) * s / L + Math.sin(t) * o); if (k >= 0 && E.ocup[k] === 0) E.ocup[k] = 5; else if (k >= 0 && E.ocup[k] === 3) { const l = E.parcelas[E.lote[k] - 1]; if (l) quitarParcela(E, l); E.ocup[k] = 5; } } }
  puertas(E); reparcelar(E);
  /* las primeras chozas de los colonos, pegadas al foro */
  const S = servicios(E), libres = E.parcelas.filter(l => !l.fuera && !l.arrabal).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z)).slice(0, 20);
  for (const l of libres) l.casa = { nivel: 1, desde: 0, nace: 0, ruina: 0 };
  E.sitio = { x, z }; E.rev++; return true;
}
function puertas(E) { if (!E.fundada) return; const o = [];
  for (const v of E.vias) for (let i = 1; i < v.p.length; i++) { const a = v.p[i - 1], b = v.p[i]; if (dentro(E, a[0], a[1]) !== dentro(E, b[0], b[1])) { const x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2; if (!o.some(q => Math.hypot(q.x - x, q.z - z) < 30)) o.push({ x, z, ang: Math.atan2(z - E.foro.z, x - E.foro.x) + Math.PI / 2, via: Math.atan2(b[1] - a[1], b[0] - a[0]) }); } }
  E.puertas = o; geoMuralla(E); }

/* ---------- nota de sitio de cada edificio. ang = hacia dónde mira la fachada (a la calle más cercana) ---------- */
/* árboles en cubos de 45 para contar los cercanos sin recorrerlos todos */
function cubosArboles(E) { const m = new Map(); for (const a of E.arboles) { if (a.talado) continue; const q = Math.floor(a.x / 45) * 4096 + Math.floor(a.z / 45); (m.get(q) || m.set(q, []).get(q)).push(a); } return m; }
function arbolesCerca(m, x, z, r) { let n = 0; const i = Math.floor(x / 45), j = Math.floor(z / 45); for (let a = i - 1; a <= i + 1; a++) for (let b = j - 1; b <= j + 1; b++) { const l = m.get(a * 4096 + b); if (l) for (const t of l) if (Math.hypot(t.x - x, t.z - z) < r) n++; } return n; }
function contexto(E) { const S = servicios(E); return { S, casas: E.parcelas.filter(l => l.casa && !l.fuera).map(l => ({ x: l.x, z: l.z, s: sirve(S, l.x, l.z) })), arb: cubosArboles(E) }; }
export function orientar(E, id, x, z) { if (id === 'muelle') { let m = 1e9, a = 0; for (let t = 0; t < 6.28; t += 0.196) { const d = distPoli(RIO, x + Math.cos(t) * 20, z + Math.sin(t) * 20); if (d < m) { m = d; a = t; } } return a; } const k = ci(x, z); if (k >= 0 && E.dVia[k] < 70) { const g = (dx, dz) => { const q = ci(x + dx, z + dz); return q < 0 ? 999 : E.dVia[q]; }, gx = g(6, 0) - g(-6, 0), gz = g(0, 6) - g(0, -6); if (gx || gz) return Math.atan2(-gz, -gx); } return E.foro ? Math.atan2(E.foro.z - z, E.foro.x - x) : 0; }
/* Efecto corto de colocar una pieza, para mostrarlo en pantalla: {n: entero con signo, txt, tono} o null.
   Una entrada por pieza (CN13b añadirá dique y tejar). ctx.c = casas que cuenta la rama de notaSitio. */
const EFECTO_SITIO = {
  fuente: ctx => ({ n: ctx.c, txt: ctx.c ? '+' + ctx.c + ' casas con agua' : '0 casas con agua', tono: ctx.c ? 'bien' : 'neutro' }),
  templo: ctx => ({ n: ctx.c, txt: (ctx.c ? '+' : '') + ctx.c + ' casas con templo cerca', tono: ctx.c ? 'bien' : 'neutro' }),
  mercado: ctx => ({ n: ctx.c, txt: ctx.c + ' casas lo usarían', tono: ctx.c ? 'bien' : 'neutro' }),
  taller: ctx => ({ n: -ctx.c, txt: ctx.c ? '\u2212' + ctx.c + ' casas con humo' : '0 casas con humo', tono: ctx.c ? 'mal' : 'neutro' }),
  herreria: ctx => EFECTO_SITIO.taller(ctx),
};
export function notaSitio(E, id, x, z, cx) {
  const D = EDIF[id], k = ci(x, z); cx = cx || contexto(E);
  if (k < 0 || Math.abs(x) > 460 || z < Z0 + 20 || z > Z0 + LADO - 20) return { nota: -99, vale: false, razones: ['Fuera del territorio'] };
  const d = DRIO[k], h = ALT[k], ang = orientar(E, id, x, z), mal = t => ({ nota: -9, vale: false, razones: [t], ang });
  if (id === 'muelle') { if (d < 50 || d > 76) return mal('El muelle solo vale en la orilla'); if (Math.hypot(x - PUENTE.x, z - PUENTE.z) < 40) return mal('Pegado al puente no'); }
  else if (esAgua(x, z)) return mal('En el agua no');
  if (id !== 'muelle' && PEND[k] > (id === 'granja' ? 0.12 : id === 'cantera' || id === 'mina' ? 0.5 : 0.24)) return mal(id === 'granja' ? 'En cuesta no se labra' : 'Demasiado empinado');
  let choque = ''; if (!huella(E, x, z, ang + Math.PI / 2, D.w, D.d, (o, q) => { if (o === 1) choque = 'Encima de una calle no'; else if (o === 2 || o === 4) choque = 'Ya hay un edificio'; else if (o === 5) choque = 'Sobre el surco sagrado no'; else if (o === 3) { const l = E.parcelas[E.lote[q] - 1]; if (l && l.casa) choque = 'Hay casas: busca un solar libre'; } return !!choque; })) return mal(choque || 'Fuera del territorio');
  const raz = [], inu = id !== 'muelle' && ribera(E, x, z, E.mesN + 1), den = dentro(E, x, z), dF = Math.hypot(x - E.foro.x, z - E.foro.z); let n = 0, radio = D.radio || 0, ctx = { c: 0 };   // ctx.c = casas que cuenta la rama; EFECTO_SITIO lo convierte en texto
  const cuantas = (r, f) => cx.casas.reduce((s, c) => s + (Math.hypot(c.x - x, c.z - z) < r && (!f || f(c)) ? 1 : 0), 0);
  if (id === 'fuente') { const c = cuantas(radio, c => !c.s.agua), ya = cuantas(radio, c => c.s.fuente); ctx.c = c;
    if (d < R_AGUA_RIO) { n -= 2; raz.push('Aquí ya beben del río −2'); }
    if (c) { const p = Math.min(3, Math.ceil(c / 4)); n += p; raz.push('Daría agua a ' + c + ' casas +' + p); } else raz.push(ya ? 'Estas casas ya tienen fuente' : 'Sin casas con sed cerca');
    if (ya > c && c) { n -= 1; raz.push('Pisa a otra fuente −1'); } }
  else if (id === 'templo') { radio = radioTemplo(E, x, z); const c = cuantas(radio, c => !c.s.templo), sube = h - alt(E.foro.x, E.foro.z);
    if (sube >= 5) { n += 2; raz.push('En alto: se ve desde lejos +2'); } else raz.push('En llano: llega poco');
    if (dF < 95) { n += 1; raz.push('Junto al foro +1'); }
    ctx.c = c; if (c) { const p = Math.min(2, Math.ceil(c / 12)); n += p; raz.push('Llegaría a ' + c + ' casas +' + p); } else { n -= 1; raz.push('No llega a ninguna casa −1'); } }
  else if (id === 'mercado') { const c = cuantas(radio), pr = E.dVia[k] < 34 && E.tVia[k] <= 2;
    if (dF < 95) { n += 2; raz.push('Junto al foro +2'); } else if (pr) { n += 1; raz.push('En calle principal +1'); } else { n -= 1; raz.push('Lejos del foro y de las calles principales −1'); }
    ctx.c = c; if (c) { const p = Math.min(2, Math.ceil(c / 15)); n += p; raz.push(c + ' casas comprarían aquí: +' + Math.round(c * 0.2) + ' monedas al mes'); } else raz.push('Sin casas cerca: no vende'); }
  else if (id === 'granero') { if (!den) return mal('El granero va dentro del surco'); const dp = Math.min(...E.puertas.map(p => Math.hypot(p.x - x, p.z - z)), 999);
    n += 1; raz.push('Dentro del surco +1'); if (dp < 75) { n += 2; raz.push('Cerca de una puerta: los carros llegan +2'); } else { n -= 1; raz.push('Lejos de las puertas −1'); } }
  else if (id === 'taller') { if (d > 170) return mal('El taller necesita agua: ponlo cerca de la orilla'); const c = cuantas(radio); ctx.c = c;
    n += 1; raz.push('Tiene agua +1'); if (c) { n -= Math.min(3, 1 + Math.ceil(c / 6)); raz.push('Su humo molestaría a ' + c + ' casas −' + Math.min(3, 1 + Math.ceil(c / 6))); } else { n += 2; raz.push('Lejos de las casas +2'); } }
  else if (id === 'granja') { if (den) return mal('Dentro del surco no se labra'); if (cuantas(40)) return mal('Demasiado pegada a las casas');
    if (vega(x, z)) { n += 3; raz.push('En la vega: rinde más +3'); } else if (PEND[k] < 0.05) { n += 1; raz.push('Llano fértil +1'); } else raz.push('Tierra pobre');
    if (E.dVia[k] < 50) { n += 1; raz.push('Junto a un camino +1'); } }
  else if (id === 'muelle') { n += 1; raz.push('En la orilla +1'); if (E.dVia[k] < 60) { n += 2; raz.push('Junto a una calle +2'); } else { n -= 1; raz.push('Lejos de las calles −1'); } }
  else if (id === 'aserradero') { const a = arbolesCerca(cx.arb, x, z, 45);
    if (a < 6) return mal('Sin bosque cerca: no hay madera'); n += Math.min(3, Math.ceil(a / 10)); raz.push('Junto al bosque (' + a + ' árboles) +' + Math.min(3, Math.ceil(a / 10)));
    if (E.dVia[k] < 60) { n += 1; raz.push('Junto a una calle: sale la madera +1'); } if (dF < 260) { n += 1; raz.push('No lejos del foro +1'); } else raz.push('Lejos del foro'); }
  else if (id === 'cantera' || id === 'mina') { const mn = id === 'cantera' ? 0.1 : 0.14;
    if (PEND[k] < mn) return mal(id === 'cantera' ? 'Sin roca: la cantera pide ladera' : 'Sin veta: la mina pide ladera'); if (den) return mal('Dentro del surco no se excava');
    n += PEND[k] > mn + 0.08 ? 3 : 2; raz.push(id === 'cantera' ? 'Ladera de roca +' + (PEND[k] > mn + 0.08 ? 3 : 2) : 'Ladera con veta +' + (PEND[k] > mn + 0.08 ? 3 : 2));
    if (E.dVia[k] < 60) { n += 1; raz.push('Junto a una calle +1'); } const c = cuantas(45); if (c) { n -= 1; raz.push('Ruido y polvo para ' + c + ' casas −1'); } }
  else if (id === 'almacen') { if (!den) return mal('El almacén va dentro del surco');
    if (dF < 100) { n += 2; raz.push('Cerca del foro +2'); } else { n += 0; raz.push('Lejos del foro'); } if (E.dVia[k] < 40) { n += 1; raz.push('Junto a una calle +1'); } }
  else if (id === 'cuartel' || id === 'establo') { const dp = Math.min(...E.puertas.map(p => Math.hypot(p.x - x, p.z - z)), 999);
    if (dp > 120) return mal(id === 'cuartel' ? 'El cuartel va junto a una puerta del surco' : 'El establo va junto a una puerta del surco');
    if (id === 'establo' && PEND[k] > 0.06) return mal('Los caballos piden llano');
    n += dp < 70 ? 3 : 1; raz.push(dp < 70 ? 'Junto a una puerta: la tropa sale +3' : 'No lejos de una puerta +1'); if (id === 'establo') { n += 1; raz.push('Llano +1'); } const c = cuantas(40); if (c) { n -= 1; raz.push('Ruido para ' + c + ' casas −1'); } }
  else if (id === 'herreria') { if (dF > 150) return mal('La herrería va cerca del foro');
    const c = cuantas(45); ctx.c = c; n += 1; raz.push('Cerca del foro +1'); if (c) { const p = Math.min(3, 1 + Math.ceil(c / 6)); n -= p; raz.push('Su humo molestaría a ' + c + ' casas −' + p); } else { n += 2; raz.push('Lejos de las casas +2'); } }
  else if (id === 'escuela') { if (dF > 170) return mal('La escuela va cerca del foro');
    const c = cuantas(45), t = E.edificios.some(q => q.tipo === 'taller' || q.tipo === 'herreria') && E.edificios.some(q => (q.tipo === 'taller' || q.tipo === 'herreria') && Math.hypot(q.x - x, q.z - z) < 70);
    n += 1; raz.push('Cerca del foro +1'); if (t) { n -= 2; raz.push('El humo del taller molesta al estudio −2'); } else { n += 2; raz.push('Lejos del humo +2'); } if (c) { n += 1; raz.push('Entre casas: llegan alumnos +1'); } }
  else if (id === 'compitum') { const db = Math.min(...E.barrios.map(b => Math.hypot(b.x - x, b.z - z)));
    if (den) return mal('El barrio nuevo se abre fuera del surco'); if (db < 215) return mal('Demasiado cerca de otro barrio'); if (E.dVia[k] > 22) return mal('Tiene que estar junto a un camino'); if (cuantas(45)) return mal('Aquí ya hay casas');
    n += 2; raz.push('Junto al camino +2'); if (PEND[k] < 0.06) { n += 1; raz.push('Llano para crecer +1'); } if (d < 230 && !inu) { n += 1; raz.push('Agua cerca +1'); } }
  if (inu) { n -= 3; raz.push(id === 'granja' ? 'Ribera baja: se inunda −3' : 'Se inunda en primavera −3'); }
  return { nota: n, vale: true, razones: raz, radio, ang, efecto: (EFECTO_SITIO[id] || (() => null))(ctx) };
}
/* mapa de calor: una nota cada 8 unidades. -99 = sin color; -9 = no vale */
export const PASO_CALOR = 8, N_CALOR = LADO / PASO_CALOR;
export function mapaCalor(E, id) { const o = new Float32Array(N_CALOR * N_CALOR), cx = id === 'fundar' ? null : contexto(E);
  for (let j = 0; j < N_CALOR; j++) for (let i = 0; i < N_CALOR; i++) { const x = X0 + (i + 0.5) * PASO_CALOR, z = Z0 + (j + 0.5) * PASO_CALOR; o[j * N_CALOR + i] = (id === 'fundar' ? notaFundar(E, x, z) : notaSitio(E, id, x, z, cx)).nota; } return o; }
export const color = n => n <= -99 ? 'nada' : n >= 3 ? 'verde' : n >= 0 ? 'ocre' : 'rojo';      // verde bueno · ocre regular · rojo malo o no vale

/* ---------- colocar ---------- */
/* pago(costeObjeto)->bool: lo decide el juego. Sin pago: monedero interno E.monedas (solo pruebas). */
export function colocar(E, id, x, z, gratis, pago) {
  const D = EDIF[id]; if (!E.fundada || !D || D.accion) return { ok: false, motivo: 'No se puede' };
  const s = notaSitio(E, id, x, z); if (!s.vale) return { ok: false, motivo: s.razones[0] };
  if (!gratis) { const mo = cobrar(E, D.coste, pago); if (mo) return { ok: false, motivo: mo }; }
  const rot = s.ang + Math.PI / 2, e = { id: E.nId++, tipo: id, x, z, ang: s.ang, w: D.w, d: D.d, obra: D.obra, total: D.obra, ruina: 0, radio: s.radio, nota: s.nota, desde: E.mesN, mejora: 0 };
  /* calle sola desde el edificio hasta la calle más cercana */
  const sendas = ['granja', 'aserradero', 'cantera', 'mina'].includes(id), k = ci(x, z), lejos = E.dVia[k] > Math.max(D.w, D.d) / 2 + 7;
  const r = lejos ? ruta(E, x, z, q => E.ocup[q] === 1, Math.max(D.w, D.d) / 2 + 3) : null;
  huella(E, x, z, rot, D.w + 2, D.d + 2, (o, q) => { if (o === 3) { const l = E.parcelas[E.lote[q] - 1]; if (l && !l.casa) quitarParcela(E, l); } return false; });
  sello(E, x, z, rot, D.w, D.d, 2);
  if (r) { const c = Math.cos(rot), sn = Math.sin(rot), pts = r.filter(q => { const u = (q[0] - x) * c + (q[1] - z) * sn, t = -(q[0] - x) * sn + (q[1] - z) * c; return Math.abs(u) > D.w / 2 + 1 || Math.abs(t) > D.d / 2 + 1; });
    if (pts.length > 1) nuevaVia(E, alisar(engancha(E, pts)), sendas ? 1.8 : 2.4, sendas ? 'senda' : 'calle'); }
  if (id === 'granja') { const c = Math.cos(rot), sn = Math.sin(rot); e.campo = [[-36, 11], [36, 11], [36, 62], [-36, 62]].map(([u, t]) => [x + u * c - t * sn, z + u * sn + t * c]); e.vega = vega(x, z); for (const a of E.arboles) { const u = (a.x - x) * c + (a.z - z) * sn, t = -(a.x - x) * sn + (a.z - z) * c; if (Math.abs(u) < 39 && t > 8 && t < 65) a.talado = true; } }
  if (id === 'compitum') { const n = E.barrios.length, nombre = drio(x, z) < 200 ? 'del Vado' : alt(x, z) > 8 ? 'de la Loma' : ['del Olivar', 'de los Pastores', 'de la Vía'][n % 3];
    E.barrios.push({ nombre: 'Barrio ' + nombre, corto: nombre.replace(/^(del|de la|de los) /, ''), x, z, tipo: 'compitum', nivel: 1, bdef: 0 });
    const a = s.ang, dv = E.dVia[k]; for (const sg of [-1, 1]) { const o = sg < 0 ? 7 : dv + 9, b = { x: x + Math.cos(a) * o * sg, z: z + Math.sin(a) * o * sg, dx: Math.cos(a) * sg, dz: Math.sin(a) * sg, hecha: false }; const v = callejon(E, b, 96); if (v) { v.t = 'via'; v.w = 3; v.punta = null; } } }
  E.edificios.push(e); E.diario.push({ a: 'c', n: E.mesN, tipo: id, x, z }); puertas(E); reparcelar(E); return { ok: true, e };
}
/* ---------- muralla y guerra (CN7): una tabla sencilla de fase a nivel de guerra ---------- */
export const NIVEL_FASE = [0, 3, 6];
export function nivelMuralla(E) { const m = E && E.muralla; if (!m) return 0; return typeof m.nivel === 'number' ? m.nivel : (NIVEL_FASE[m.fase] || 0); }
export function faseDeNivel(n) { return n <= 0 ? 0 : n <= 3 ? 1 : 2; }
export function casasArrabal(E) { let n = 0; for (const l of E.parcelas) if (l.casa && !l.casa.ruina && l.arrabal && !l.fuera) n++; return n; }
/* Geometría para CN12: solo se guarda, no se usa aquí. */
function geoMuralla(E) { if (!E.muralla) return; const r = v => Math.round(v * 10) / 10;
  E.muralla.geo = { surco: (E.surco || []).map(q => ({ x: r(q[0]), z: r(q[1]) })), puertas: (E.puertas || []).map(p => Object.assign({}, p)), fase: E.muralla.fase }; }
/* Saqueo de lo de fuera: deja en ruina (5 meses) casas vivas del arrabal. Reproducible con E.rnd. */
export function saquearArrabal(E, fuerza) {
  const viv = []; for (const l of E.parcelas) if (l.casa && !l.casa.ruina && l.arrabal && !l.fuera) viv.push(l);
  const f = [0.6, 0.5, 0.25][E.muralla.fase] ?? 0.6, fz = Math.round(Math.max(0, Math.min(1, fuerza || 0)) * 1000) / 1000;   // redondeada: el diario la guarda así y la repetición da lo mismo
  const n = Math.min(12, viv.length, Math.max(1, Math.round(viv.length * fz * f)));
  if (!viv.length || fz <= 0 || n <= 0) return { n: 0, ids: [] };
  const claves = viv.map(l => ({ l, k: E.rnd() })); claves.sort((a, b) => a.k - b.k || a.l.id - b.l.id);
  const ids = []; for (const q of claves.slice(0, n)) { q.l.casa.ruina = 5; ids.push(q.l.id); }
  E.diario.push({ a: 'q', n: E.mesN, fz: Math.round(fz * 1000) / 1000 }); E.rev++;
  return { n, ids };
}
export function murallaSiguiente(E) { const m = E.muralla; if (!E.fundada || m.obra) return null; return m.fase === 0 ? { nombre: 'Levantar empalizada', coste: EDIF.muralla.coste } : m.fase === 1 ? { nombre: 'Levantar muralla de piedra', coste: sumaCostes([costeNivel(EDIF.muralla.coste, 1), costeNivel(EDIF.muralla.coste, 2)]) } : null; }
export function levantarMuralla(E, gratis, pago) { const s = murallaSiguiente(E); if (!s) return { ok: false, motivo: E.muralla.obra ? 'La obra ya está en marcha' : 'La muralla ya es de piedra' };
  if (!gratis) { const mo = cobrar(E, s.coste, pago); if (mo) return { ok: false, motivo: mo }; } E.muralla.obra = 3; E.diario.push({ a: 'm', n: E.mesN }); geoMuralla(E); E.rev++; return { ok: true }; }

/* ---------- mejoras I, II, III (solo datos mínimos: la economía real es CN2) ---------- */
export function mejoraSiguiente(E, id) { const e = E.edificios.find(q => q.id === id); if (!e || e.obra || e.ruina || !EDIF[e.tipo].mejoras || (e.mejora || 0) >= 3) return null; const m = EDIF[e.tipo].mejoras[e.mejora || 0]; return { nombre: EDIF[e.tipo].nombre + ' ' + ROMANOS[(e.mejora || 0) + 1], coste: m.coste, radioMul: m.radioMul, rinde: m.rinde }; }
export function mejorar(E, id, gratis, pago) { const s = mejoraSiguiente(E, id); if (!s) return { ok: false, motivo: 'No se puede mejorar' };
  if (!gratis) { const mo = cobrar(E, s.coste, pago); if (mo) return { ok: false, motivo: mo }; }
  const e = E.edificios.find(q => q.id === id); e.mejora = (e.mejora || 0) + 1; e.radio = alcance(E, e.tipo, e.x, e.z, e.mejora); E.diario.push({ a: 'u', n: E.mesN, id }); E.rev++; return { ok: true, e }; }

/* ---------- guardar y cargar ---------- */
/* Lo mínimo para guardar: la semilla, el sitio de fundación y lo que hizo el jugador mes a mes. La ciudad se rehace al cargar. */
export function aDatos(E) {
  return { v: 1, semilla: E.semilla, sitio: E.sitio ? { x: E.sitio.x, z: E.sitio.z } : null, mesN: E.mesN, monedas: Math.round(E.monedas * 100) / 100,
    piezas: E.edificios.map(e => { const o = { id: e.id, tipo: e.tipo, x: Math.round(e.x * 10) / 10, z: Math.round(e.z * 10) / 10, mejora: e.mejora || 0, mesN: e.desde }; if (e.ang) o.ang = Math.round(e.ang * 1000) / 1000; return o; }), muralla: E.diario.filter(d => d.a === 'm').map(d => d.n),
    barrios: E.barrios.map(b => ({ nombre: b.nombre, corto: b.corto })), acciones: E.diario.map(d => Object.assign({}, d)),
    ...(E.n0 === undefined ? {} : { n0: E.n0 }),      // solo una ciudad de plantilla (o de partida) lo trae: el diario arranca en ese mes y las piezas nacen terminadas
    cultura: E.cultura || 'roma', tinte: E.tinte || E.cultura || 'roma', tam: E.tam || null };   // cultura/tinte/tam (CN9a)
}
/* Rehace la misma ciudad: funda, y repite cada obra en su mes con los meses entre medias (la semilla manda el azar). */
export function deDatos(datos) {
  const E = crear(datos.semilla); E.modoJuego = datos.n0 !== undefined; if (E.modoJuego) E.n0 = datos.n0; E.mesN = datos.n0 || 0;
  E.cultura = datos.cultura || 'roma'; E.tinte = datos.tinte || E.cultura; E.tam = datos.tam || null;      // datos viejos sin cultura: romana
  if (datos.sitio) fundar(E, datos.sitio.x, datos.sitio.z);
  const ac = datos.acciones || [];
  for (let n = datos.n0 || 0; n <= datos.mesN; n++) {
    for (const a of ac) { if (a.n !== n) continue; if (a.a === 'c') { const r = colocar(E, a.tipo, a.x, a.z, true); if (r.ok && E.modoJuego) r.e.obra = 0; } else if (a.a === 'u') mejorar(E, a.id, true); else if (a.a === 'm') levantarMuralla(E, true); else if (a.a === 's') sembrarCasas(E, a.pob); else if (a.a === 'q') saquearArrabal(E, a.fz); }
    if (n < datos.mesN) mes(E);
  }
  E.monedas = datos.monedas; (datos.barrios || []).forEach((b, i) => { if (E.barrios[i]) { E.barrios[i].nombre = b.nombre; E.barrios[i].corto = b.corto; } }); E.rev++;
  return E;
}

/* ---------- economía ---------- */
export function ingreso(E) { const S = servicios(E); let t = 0;
  for (const l of E.parcelas) if (l.casa && !l.casa.ruina) { t += RENTA[l.casa.nivel]; if (cerca(S.me, l.x, l.z)) t += 0.2; }
  for (const e of E.edificios) { if (e.obra || e.ruina) continue; if (e.tipo === 'granja') t += e.vega ? 6 : 3; if (e.tipo === 'taller') t += 7; if (e.tipo === 'muelle') t += e.nota >= 3 ? 12 : 7; }
  return Math.round(t); }

/* ---------- un mes ---------- */
/* Riesgos que se ven venir (pura: no muta E ni gasta E.rnd). meses = ticks de mes() que faltan SIN contar el que lo trae: 0 = ocurre en el próximo mes() */
const enInvierno = (m, n) => m === 11 || m < n - 1;      // n = meses de hambre (3: dic-feb · 1: solo dic)
const mesesHasta = (E, m) => { for (let k = 1; k <= 12; k++) if (fecha({ mesN: E.mesN + k }).mes === m) return k - 1; return 12; };
export function riesgos(E) {
  if (!E || !E.fundada) return []; const r = [], S = servicios(E);
  const sC = suceso(E, 'crecida', E.mesN + 1), sF = suceso(E, 'incendio', E.mesN + 1), sH = suceso(E, 'hambre', E.mesN + 1), mC = mesesHasta(E, 2), mH = enInvierno(fecha(E).mes, sH.meses) ? 0 : mesesHasta(E, 11);
  let c = 0, g = 0; for (const l of E.parcelas) if (l.casa && !l.casa.ruina && ribera(E, l.x, l.z, E.mesN + 1)) c++; for (const e of E.edificios) if (e.tipo !== 'muelle' && !e.ruina && ribera(E, e.x, e.z, E.mesN + 1)) g++;
  if (c + g && mC <= sC.aviso) r.push({ c: 'crecida', p: 5, meses: mC, n: c + g, t: 'Crecida de primavera: el río puede llevarse ' + (c ? c + (c === 1 ? ' casa' : ' casas') : '') + (c && g ? ' y ' : '') + (g ? g + (g === 1 ? ' obra' : ' obras') : '') + ' de la ribera baja.', remedio: 'No pongas más obras en la ribera baja (zona azul del mapa de calor)', pieza: null });
  let peor = -1, nPeor = 0, nTot = 0; E.barrios.forEach((b, i) => { const cs = E.parcelas.filter(l => l.casa && !l.casa.ruina && l.barrio === i && !l.fuera); if (cs.length <= 10 || E.mesN - (b.fuego || -9) < 8) return; const sin = cs.filter(l => !cerca(S.fu, l.x, l.z)).length; if (!sin) return; nTot += sin; if (sin > nPeor) { nPeor = sin; peor = i; } });
  if (peor >= 0 && sF.activo) { const nb = E.barrios[peor].nombre; r.push({ c: 'fuego', p: 5, meses: 0, n: nTot, t: 'Riesgo de incendio: ' + nTot + (nTot === 1 ? ' casa' : ' casas') + ' sin fuente cerca.', remedio: 'Pon una fuente cerca del ' + nb, pieza: 'fuente' }); }
  if (sH.activo && !hechos(E, 'granero').length && mH <= sH.aviso) { const ya = mH === 0 && enInvierno(fecha(E).mes, sH.meses); const n = E.parcelas.filter(l => l.casa && !l.casa.ruina).length; r.push({ c: 'hambre', p: 4, meses: mH, n, t: 'Hambre de invierno (sin granero): las casas no ' + (ya ? 'crecen' : 'crecerán') + ' hasta la primavera.', remedio: ya ? 'Coloca un granero para el próximo invierno' : 'Coloca un granero antes de diciembre', pieza: 'granero' }); }
  return r.sort((a, b) => b.p - a.p);
}
export function mes(E) {
  if (!E.fundada) return []; const av = [], rnd = E.rnd, di = (t, p = 1, c = '') => av.push({ t, p, c });
  E.mesN++; const f = fecha(E), S0 = servicios(E);
  /* obras */
  for (const e of E.edificios) { if (e.obra && --e.obra === 0) di(EDIF[e.tipo].nombre.replace('Abrir barrio', 'Capilla de cruce') + ' terminada' + (e.tipo === 'fuente' ? ': las casas de alrededor ya tienen agua' : ''), 1); if (e.ruina) e.ruina--; }
  if (E.muralla.obra && --E.muralla.obra === 0) { E.muralla.fase++; delete E.muralla.nivel; geoMuralla(E); di(E.muralla.fase === 1 ? 'Empalizada terminada: la ciudad ya tiene cerca' : 'Muralla de piedra terminada, con torres y puertas', 2); }
  for (const l of E.parcelas) if (l.casa && l.casa.ruina && --l.casa.ruina === 0) { l.casa.nivel = 1; l.casa.nace = E.mesN; l.casa.arde = false; }
  if (!E.modoJuego) E.monedas += ingreso(E);      // en modo juego, la renta la cobra game.js
  /* crecida de primavera: se lleva lo que esté en la ribera baja */
  const scr = suceso(E, 'crecida'), sin = suceso(E, 'incendio'), sha = suceso(E, 'hambre');
  if (f.mes === 2 && scr.activo) { let c = 0, g = 0; for (const l of E.parcelas) if (l.casa && !l.casa.ruina && ribera(E, l.x, l.z)) { l.casa.ruina = scr.ruina; c++; } for (const e of E.edificios) if (e.tipo !== 'muelle' && !e.ruina && ribera(E, e.x, e.z)) { e.ruina = scr.ruina; g++; }
    E.crecida = E.mesN; di(c + g ? 'Crecida de primavera: el río anegó ' + (c ? c + (c === 1 ? ' casa' : ' casas') : '') + (c && g ? ' y ' : '') + (g ? g + (g === 1 ? ' obra' : ' obras') : '') + ' de la ribera baja. Lo alto se salvó.' : 'Crecida de primavera: el río se salió, pero nada tuyo estaba en la ribera baja.', c + g ? 5 : 2, 'crecida'); if (c + g) av[av.length - 1].cg = [c, g]; }
  /* incendio: en barrios de más de 10 casas, una casa sin fuente cerca */
  E.barrios.forEach((b, i) => { const cs = E.parcelas.filter(l => l.casa && !l.casa.ruina && l.barrio === i && !l.fuera); if (!sin.activo || cs.length <= 10 || rnd() > sin.prob || E.mesN - (b.fuego || -9) < 8) return; const l = cs[Math.floor(rnd() * cs.length)];
    if (cerca(S0.fu, l.x, l.z)) { b.fuego = E.mesN; di('Fuego en el ' + b.nombre + ': la fuente estaba cerca y se apagó a tiempo.', 3, 'fuego'); return; }
    let n = 1; l.casa.ruina = 5; l.casa.arde = true; for (const o of cs) if (o !== l && n < sin.max && Math.hypot(o.x - l.x, o.z - l.z) < 24 && !cerca(S0.fu, o.x, o.z) && rnd() < 0.7) { o.casa.ruina = 5; o.casa.arde = true; n++; }
    b.fuego = E.mesN; E.fuego = { mes: E.mesN, x: l.x, z: l.z }; di('Incendio en el ' + b.nombre + ': ' + (n === 1 ? 'ardió una casa' : 'ardieron ' + n + ' casas') + '. No había fuente cerca para apagarlo.', 5, 'fuego'); av[av.length - 1].cg = [n, 0]; });
  /* hambre de invierno */
  const invierno = enInvierno(f.mes, sha.meses); E.hambre = sha.activo && invierno && !hechos(E, 'granero').length;
  if (E.hambre && f.mes === 11) di('Invierno sin granero: hay hambre. Las casas no crecen hasta la primavera.', 4, 'hambre');
  /* llegan familias: casas nuevas en las mejores parcelas libres */
  const S = servicios(E), nCasas = E.parcelas.filter(l => l.casa).length;
  if (!E.hambre && nCasas < MAX_CASAS) { const libres = E.parcelas.filter(l => !l.casa && !l.fuera), llegan = Math.min(libres.length, 3 + Math.min(3, hechos(E, 'granja').length) + (S.me.length ? 1 : 0), MAX_CASAS - nCasas);
    libres.forEach(l => { l._a = atractivo(E, S, l, E.mesN) + rnd() * 1.6; }); libres.sort((a, b) => b._a - a._a);
    for (let i = 0; i < llegan; i++) if (libres[i]._a > -3.5) libres[i].casa = { nivel: 1, desde: E.mesN, nace: E.mesN, ruina: 0 }; }
  /* las casas suben cuando su sitio tiene los servicios */
  if (!E.hambre) { let sub = 0; for (const l of E.parcelas) { const c = l.casa; if (!c || c.ruina || l.fuera || sub >= 10) continue; const tope = topeNivel(sirve(S, l.x, l.z)); if (c.nivel < tope && E.mesN - c.desde >= 3 && rnd() < 0.4) { c.nivel++; c.desde = E.mesN; c.nace = E.mesN; sub++; } else if (c.nivel > Math.max(1, tope) && rnd() < 0.3) { c.nivel--; c.desde = E.mesN; c.nace = E.mesN; } } }
  /* callejones: cuando una calle se llena le salen solos; las puntas vecinas se unen y cierran manzanas */
  let nuevos = 0; const libresT = E.parcelas.filter(l => !l.casa && !l.fuera).length;
  const lleno = v => { let n = 0, o = 0; for (const l of E.parcelas) if (l.via === v && !l.fuera) { n++; if (l.casa) o++; } return n ? o / n : 1; }, llenoDe = {};
  for (const b of E.bocas) { if (b.hecha || nuevos >= 2) continue; if (llenoDe[b.via] === undefined) llenoDe[b.via] = lleno(b.via); if (llenoDe[b.via] < 0.55 && libresT > 8) continue; if (rnd() < 0.5 && libresT > 8) continue; if (callejon(E, b)) nuevos++; }
  for (let i = 0; i < 2; i++) if (unirPuntas(E)) nuevos++;
  if (nuevos) reparcelar(E);
  if (libresT < 3 && !nuevos && !E.avisado.lleno) { E.avisado.lleno = true; di(E.abiertas.includes('compitum') ? 'No queda sitio junto a las calles: abre un barrio nuevo.' : 'Las calles están llenas: cada obra nueva trae su calle y sus solares.', 2); }
  /* barrios: nivel y empedrado */
  E.barrios.forEach((b, i) => { const o = nivelBarrio(E, i).nivel, a = b.nivel || 1;
    if (o > a) { b.nivel = a + 1; b.bdef = 0; di(b.nombre + ' sube a nivel ' + ROMANOS[b.nivel] + (b.nivel >= 3 ? ': se empiedran sus calles' : ''), 2); }
    else if (o < a) { b.bdef = (b.bdef || 0) + 1; if (b.bdef >= RETRASO_BARRIO) { b.nivel = a - 1; b.bdef = 0; di(b.nombre + ' baja a nivel ' + ROMANOS[b.nivel], 3); } }
    else { b.bdef = 0; b.nivel = a; } });
  for (const v of E.vias) { if (v.t === 'camino' || v.t === 'senda' || v.emp) continue; const q = v.p[v.p.length >> 1], b = barrioDe(E, q[0], q[1]); if (b >= 0 && (E.barrios[b].nivel || 1) >= (v.t === 'callejon' ? 4 : 3)) v.emp = true; }
  /* fichas nuevas al crecer */
  const pob = poblacion(E); for (const id of ORDEN) if (!E.abiertas.includes(id) && pob >= EDIF[id].desde) { E.abiertas.push(id); di('Nueva obra en la bandeja: ' + EDIF[id].nombre + ' — ' + EDIF[id].que.toLowerCase(), 3, 'ficha'); }
  E.rev++; av.sort((a, b) => b.p - a.p); return av;
}
export function estado(E) { const cs = casas(E), f = fecha(E); return { fecha: f.texto, mesN: E.mesN, fundada: E.fundada, monedas: Math.round(E.monedas), ingreso: ingreso(E), poblacion: poblacion(E), casas: cs.length, niveles: [1, 2, 3, 4].map(n => cs.filter(l => l.casa.nivel === n && !l.casa.ruina).length), ruinas: cs.filter(l => l.casa.ruina).length, arrabal: cs.filter(l => l.arrabal).length,
  parcelasLibres: E.parcelas.filter(l => !l.casa && !l.fuera).length, vias: E.vias.length, callejones: E.vias.filter(v => v.t === 'callejon').length, empedradas: E.vias.filter(v => v.emp).length, edificios: E.edificios.map(e => e.tipo + (e.obra ? '(obra)' : e.ruina ? '(ruina)' : '')), barrios: E.barrios.map((b, i) => textoBarrio(E, i)), muralla: E.muralla, puertas: E.puertas.length, abiertas: E.abiertas.slice(), hambre: E.hambre }; }
/* el mejor sitio para una ficha (lo usan las pruebas y el botón de ayuda) */
export function mejorSitio(E, id, cerca) { const m = mapaCalor(E, id); let b = -1e9, bx = null; for (let j = 0; j < N_CALOR; j++) for (let i = 0; i < N_CALOR; i++) { const x = X0 + (i + 0.5) * PASO_CALOR, z = Z0 + (j + 0.5) * PASO_CALOR; let n = m[j * N_CALOR + i]; if (n < -8) continue; if (cerca) n -= Math.hypot(x - cerca[0], z - cerca[1]) / 400; else if (E.foro) n -= Math.hypot(x - E.foro.x, z - E.foro.z) / 2000; if (n > b) { b = n; bx = [x, z]; } } return bx; }

/* ---------- arranque de una ciudad ya hecha (CN2) ---------- */
/* Hace nacer casas sin esperar meses, con el mismo atractivo de siempre, hasta poblacion(E) >= poblacion o hasta que no queden
   parcelas con atractivo (si faltan, abre callejones como en mes()). Se anota en el diario para que deDatos lo repita. */
export function sembrarCasas(E, poblacion_) {
  if (!E.fundada) return 0; E.diario.push({ a: 's', n: E.mesN, pob: poblacion_ });
  for (let ronda = 0; ronda < 60 && poblacion(E) < poblacion_ && casas(E).length < MAX_CASAS; ronda++) {
    const S = servicios(E), libres = E.parcelas.filter(l => !l.casa && !l.fuera);
    libres.forEach(l => { l._a = atractivo(E, S, l, E.mesN + 1) + E.rnd() * 1.6; }); libres.sort((a, b) => b._a - a._a);
    let puso = 0; for (const l of libres.slice(0, 6)) { if (poblacion(E) >= poblacion_ || l._a <= -3.5) break; l.casa = { nivel: 1, desde: E.mesN, nace: E.mesN, ruina: 0 }; puso++; }
    if (poblacion(E) >= poblacion_) break;
    if (!puso) { let nuevos = 0; for (const b of E.bocas) { if (!b.hecha && nuevos < 2 && callejon(E, b)) nuevos++; } for (let i = 0; i < 2; i++) if (unirPuntas(E)) nuevos++; if (!nuevos) break; reparcelar(E); } }
  E.rev++; return poblacion(E);
}
/* Elige dónde fundar sin el jugador: rejilla de paso 40 sobre el terreno jugable, descarta lo que no vale, un surco chico
   (muy pegado al agua) o estar encima del camino (la ruta del foro al camino no sale: tarda segundos) y se queda con la mejor nota. Con semilla, entre las mejores desempata con azar(semilla). Funda y devuelve [x, z]. */
export function fundarAuto(E, semilla) {
  const cand = []; for (let x = -240; x <= 240; x += 40) for (let z = -400; z <= 220; z += 40) { const n = notaFundar(E, x, z); const k = ci(x, z), dc = k < 0 ? 999 : E.dVia[k]; if (n.vale && drio(x, z) > 100 && !inundable(x, z) && dc >= 25 && dc <= 110) cand.push({ x, z, nota: n.nota }); }
  if (!cand.length) return null; const mejor = Math.max(...cand.map(c => c.nota)), r = azar((semilla || 0) * 104729 + 7);
  /* mejores notas primero, con un empujón de azar de la semilla (hasta 1.2 puntos) para que dos ciudades no caigan juntas (sin semilla, el orden de la rejilla) */
  const top = cand.filter(c => c.nota >= mejor - 1).map(c => Object.assign(c, { u: semilla === undefined ? 0 : r() })).sort((a, b) => (b.nota + b.u * 1.2) - (a.nota + a.u * 1.2));
  /* ensayo en una ciudad desechable: vale si sale la calle del foro al camino y las 20 chozas (si no, se prueba el siguiente) */
  let n = 0; for (const c of top) { if (n++ >= 10) break; const P = crear(E.semilla); topeRuta = 1200; let ok; try { ok = fundar(P, c.x, c.z) && P.vias.length >= 2 && poblacion(P) >= 250; } finally { topeRuta = Infinity; } if (ok && fundar(E, c.x, c.z)) return [c.x, c.z]; }
  for (const c of top) if (fundar(E, c.x, c.z)) return [c.x, c.z]; return null;
}

/* ---------- ciudades por cultura (CN9a) ---------- */
/* Facción de D.CITIES -> cultura de arte ('roma','grie','cart') y tinte. Las que no tienen arte propio usan la romana con su tinte. */
export function culturaDe(faccion, id) {
  if (id === 'capua') return { cultura: 'roma', tinte: 'campanos' };
  const m = { roma: 'roma', cartago: 'cart', epiro: 'grie', siracusa: 'grie', akragas: 'grie', griegos: 'grie', macedonia: 'grie' };
  if (m[faccion]) return { cultura: m[faccion], tinte: m[faccion] };
  return { cultura: 'roma', tinte: faccion || 'roma' };      // etruscos, galos, mamertinos, iberos
}
export const tamano = w => w <= 2 ? 'peq' : w === 3 ? 'med' : 'gra';
/* Piezas [tipo, mejora]. Nivel de D.BUILD = NIVEL_MEJORA[mejora]. 'med' romana = edificiosBase('capua',3,1): producción I (nivel 3), almacén, mercado y cuartel nivel 1. */
const PROD = m => [['granja', m], ['aserradero', m], ['cantera', m], ['mina', m]];
export const PLANTILLAS = {
  roma: {
    peq: { pob: 301, meses: 0, piezas: [['fuente', 0], ['granero', 0], ...PROD(0), ['granja', 1], ['almacen', 0], ['mercado', 0], ['cuartel', 0]] },
    med: { pob: 392, meses: 1, piezas: [['fuente', 0], ['granero', 0], ...PROD(1), ['almacen', 0], ['mercado', 0], ['cuartel', 0]] },
    gra: { pob: 518, meses: 1, piezas: [['fuente', 1], ['granero', 0], ...PROD(2), ['almacen', 1], ['mercado', 1], ['cuartel', 1], ['establo', 0]] } },
  grie: {
    peq: { pob: 301, meses: 0, piezas: [['fuente', 0], ['granero', 0], ...PROD(0), ['granja', 1], ['almacen', 0], ['mercado', 0], ['cuartel', 0]] },
    med: { pob: 392, meses: 1, piezas: [['fuente', 1], ['granero', 0], ...PROD(1), ['almacen', 0], ['mercado', 1], ['cuartel', 0]] },
    gra: { pob: 518, meses: 1, piezas: [['fuente', 1], ['granero', 0], ...PROD(2), ['almacen', 1], ['mercado', 1], ['cuartel', 1], ['establo', 0]] } },
  cart: {
    peq: { pob: 301, meses: 0, piezas: [['fuente', 0], ['granero', 0], ...PROD(0), ['granja', 1], ['almacen', 0], ['mercado', 0], ['cuartel', 0], ['muelle', 0]] },
    med: { pob: 392, meses: 1, piezas: [['fuente', 0], ['granero', 0], ...PROD(1), ['almacen', 1], ['mercado', 0], ['cuartel', 0], ['muelle', 0]] },
    gra: { pob: 609, meses: 1, piezas: [['fuente', 0], ['granero', 0], ...PROD(2), ['almacen', 1], ['mercado', 1], ['cuartel', 1], ['establo', 0], ['muelle', 1]] } }
};
/* La plantilla que toca (Roma, sin mercado ni más población que su base, es un caso aparte; los muelles solo si hay río: si no hay sitio, se omiten). */
export function plantillaDe(id, faccion, w) {
  const c = culturaDe(faccion, id), t = PLANTILLAS[c.cultura][tamano(w)];
  if (id === 'roma') return { pob: 287, meses: 0, piezas: t.piezas.filter(p => p[0] !== 'mercado') };
  return t;
}
export const semillaDe = id => { let h = 7; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100003; return h + 1; };
/* El muelle mide contra todo el río (~5 s con mejorSitio): solo se prueban las celdas de la orilla válida (50 a 76 del río), cada 16 unidades. */
let candMuelle = null;
function sitioMuelle(E) {
  if (!candMuelle) { candMuelle = []; for (let j = 0; j < N_CALOR; j += 2) for (let i = 0; i < N_CALOR; i += 2) { const x = X0 + (i + 0.5) * PASO_CALOR, z = Z0 + (j + 0.5) * PASO_CALOR, d = distRio(x, z); if (d >= 49 && d <= 77) candMuelle.push([x, z]); } }
  let b = -1e9, r = null; for (const [x, z] of candMuelle) { const nt = notaSitio(E, 'muelle', x, z); if (!nt.vale) continue; const v = nt.nota - Math.hypot(x - E.foro.x, z - E.foro.z) / 2000; if (v > b) { b = v; r = [x, z]; } } return r;
}
/* Ciudad completa y determinista desde una plantilla. opt.finEn: mes con el que termina E (n0 = finEn - meses); opt.rapido: sin simular meses. */
export function desdePlantilla(id, faccion, w, opt = {}) {
  const P = plantillaDe(id, faccion, w), cu = culturaDe(faccion, id), sem = semillaDe(id), E = crear(sem);
  const meses = opt.rapido ? 0 : P.meses, fin = opt.finEn === undefined ? P.meses : opt.finEn;
  E.modoJuego = true; E.cultura = cu.cultura; E.tinte = cu.tinte; E.tam = tamano(w); E.n0 = fin - meses; E.mesN = E.n0;
  if (!fundarAuto(E, sem)) return null;
  const pon = (tipo, mejora) => { const s = tipo === 'muelle' ? sitioMuelle(E) : mejorSitio(E, tipo); if (!s) return false; const r = colocar(E, tipo, s[0], s[1], true); if (!r.ok) return false; r.e.obra = 0; for (let k = 0; k < mejora; k++) mejorar(E, r.e.id, true); return true; };
  /* Primero lo que produce; las casas crecen unos meses sin fuente ni mercado (así no se disparan de nivel); al final los servicios y la siembra hasta la población. */
  const serv = p => p[0] === 'fuente' || p[0] === 'mercado' || p[0] === 'templo', pob = opt.pob || P.pob;
  for (const [t, m] of P.piezas) if (!serv([t])) pon(t, m);
  if (!E.edificios.some(e => e.tipo === 'granero')) pon('granero', 0);
  for (let i = 0; i < meses; i++) mes(E);
  for (const [t, m] of P.piezas) if (serv([t])) pon(t, m);
  if (poblacion(E) < pob) sembrarCasas(E, pob);
  E.mesN = fin;
  return E;
}
