/* AQVILA — campos de cultivo alrededor de la ciudad (CI1-8, AG1-B). Solo vista: no cambia la economía ni js/ciudad.js.
   Cada cuadro de la vega (y el campo de cada granja) se clasifica por SUELO con la pendiente, la distancia al río, la altura
   sobre el río y la solana (js/agricultura.js, `clasificarSuelo`) y recibe el campo que mejor encaja entre los cinco de Catón:
   trigo (tiras con surcos), olivar (hileras de olivos sobre tierra parda), viña (espalderas), huerto (cuadritos con acequias)
   y pasto (hierba con ovejas). La labor de la estación (`laborEstacion`) se ve: siega, vendimia, aceituna, esquileo, arada,
   trashumancia. Las mejoras se ven como una pieza pequeña en la esquina del cuadro (almazara, lagar, bodega, noria, redil, era, estercolero).
   SOLANA: el sur es +z (convención del mapa: el norte queda arriba y la cámara por defecto mira hacia -z). Una cuesta «cara al sur»
   es la que baja hacia +z.
   Arte PROPIO por código (geometría y texturas pintadas en un lienzo); los olivos y cipreses son los de siempre (0 A.D.), los pone city3d.
   Dibujo: 4 llamadas (suelo con surcos, suelo de hierba y huerto, piezas fusionadas, ovejas en instancias); antes de AG1 era 1, así que suma 3.
   CAMPOS = false lo apaga. */
import { THREE } from './models.js';
import * as Agro from '../agricultura.js';

export const CAMPOS = true;
/* LADO = lado del cuadro de la vega (m); MARGEN = borde sin cultivo; HUECO = linde entre tiras; PASO = lado de la rejilla del suelo (m);
   ALZA = lo que flota el suelo sobre el terreno (evita parpadeo) */
const LADO = 44, MARGEN = 1.6, HUECO = 1.3, PASO = 7, ALZA = 0.22;
/* DESNIVEL_MAX = desnivel máximo del cuadro (m) para cultivarlo: las laderas llevan olivar y viña, un risco no (antes 7) */
const DESNIVEL_MAX = 16;
/* tipos de suelo pintado (índice en COL): 0 trigo, 1 legumbre, 2 barbecho, 3 tierra de olivar, 4 tierra de viña, 5 pasto, 6 huerto, 7 acequia.
   Los 0-4 van en la malla de surcos; 5-7 en la de hierba */
const COL = [
  [[0.50, 0.66, 0.27], [0.95, 0.80, 0.42], [0.76, 0.66, 0.46], [0.50, 0.60, 0.30]],      /* CV4a: en invierno el trigo sembrado en otoño ya verdea */
  [[0.36, 0.56, 0.22], [0.47, 0.60, 0.26], [0.56, 0.54, 0.32], [0.38, 0.50, 0.24]],
  [[0.56, 0.50, 0.35], [0.66, 0.56, 0.38], [0.52, 0.44, 0.31], [0.52, 0.40, 0.27]],
  [[0.50, 0.40, 0.27], [0.54, 0.45, 0.30], [0.50, 0.40, 0.28], [0.46, 0.38, 0.27]],      /* olivar: tierra parda, sin verde chillón */
  [[0.50, 0.42, 0.27], [0.44, 0.42, 0.24], [0.50, 0.38, 0.24], [0.48, 0.38, 0.27]],      /* viña: tierra con hierba rala entre espalderas */
  [[0.40, 0.62, 0.24], [0.56, 0.58, 0.30], [0.46, 0.56, 0.26], [0.40, 0.52, 0.28]],      /* pasto: verde de primavera, pajizo en verano */
  [[0.38, 0.58, 0.24], [0.44, 0.60, 0.26], [0.40, 0.52, 0.24], [0.36, 0.48, 0.26]],      /* huerto (base; cada cuadrito toma uno de HUERTO) */
  [[0.28, 0.50, 0.66], [0.26, 0.50, 0.68], [0.28, 0.48, 0.62], [0.30, 0.46, 0.58]]       /* acequia: azul apagado, más gris en invierno */
];
/* verdes distintos de los cuadritos del huerto (col, lechuga, haba, puerro) y su luz por estación */
const HUERTO = [[0.34, 0.58, 0.22], [0.52, 0.68, 0.30], [0.24, 0.48, 0.26], [0.44, 0.62, 0.40]], HUERTO_LUZ = [1, 1.02, 0.9, 0.8];
const TIERRA_ARADA = [0.46, 0.35, 0.24];
/* labor → color que manda sobre la estación, por tipo de suelo pintado */
function tinte(tipo, lab) {
  if (tipo <= 1) { if (lab === 'siega') return tipo ? [0.62, 0.58, 0.34] : [0.88, 0.76, 0.44]; if (lab === 'trilla') return [0.80, 0.68, 0.42]; if (lab === 'arada') return [0.50, 0.38, 0.26]; if (lab === 'siembra') return [0.58, 0.46, 0.30]; return null; }
  if (tipo === 3) return lab === 'arada' ? [0.42, 0.31, 0.21] : null;
  if (tipo === 4) return lab === 'cava' ? [0.45, 0.33, 0.22] : null;
  if (tipo === 5) return lab === 'trashumancia' ? [0.66, 0.60, 0.38] : lab === 'heno' ? [0.64, 0.60, 0.34] : null;
  if (tipo === 7) return lab === 'riego' ? [0.22, 0.55, 0.78] : null;
  return null;
}
const EN_HIERBA = t => t >= 5;
let C = null, mA = null, mB = null, mP = null, mO = null, firma = '', estQ = -1, claveP = '', pars = [], cuadros = [], extra = [], tapaSet = new Set(), GA = null, GB = null, OVEJAS = [];
/* opciones del banco de pruebas y del juego: mejoras 'ninguna' | 'todas' | null (null = las que mande el juego con fijarMejoras; si no, ninguna);
   mes 0..11 | null (null = la estación del juego); forzar (suelo, i, j) → id de campo | null (solo para el banco) */
const OPC = { mejoras: null, mes: null, forzar: null };
let DAME = null;
export function opciones(o = {}) { for (const k of ['mejoras', 'mes', 'forzar']) if (k in o) OPC[k] = o[k]; firma = ''; estQ = -1; return { ...OPC }; }
/* el juego dice qué mejoras tiene cada parcela: f({campo, suelo, x, z}) → [ids] */
export function fijarMejoras(f) { DAME = f; firma = ''; }
/* lista de campos puestos (para rótulos, fichas y pruebas) */
export function parcelas() { return pars.map(p => ({ x: p.cx, z: p.cz, campo: p.campo, suelo: p.suelo, nota: p.nota, labor: p.lab, mejoras: p.mej.slice(), lado: p.lu })); }

function lienzo(w, f) { const cv = document.createElement('canvas'); cv.width = cv.height = w; f(cv.getContext('2d'), w); const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const azar = s => { let a = s; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; };
function texturaSurcos() {
  return lienzo(128, (g, w) => {
    g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, w);
    for (let x = 0; x < 128; x += 16) { g.fillStyle = 'rgba(40,30,20,0.38)'; g.fillRect(x, 0, 4, 128); g.fillStyle = 'rgba(255,255,240,0.28)'; g.fillRect(x + 7, 0, 5, 128); }
    const r = azar(7); for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? `rgba(50,40,20,${0.25 * r()})` : `rgba(255,250,220,${0.3 * r()})`; g.fillRect(r() * 128, r() * 128, 2, 3); }
  });
}
/* hierba sin surcos: motas claras y oscuras, para pasto, huerto y acequias */
function texturaHierba() {
  return lienzo(128, (g, w) => {
    g.fillStyle = '#dcdcdc'; g.fillRect(0, 0, w, w); const r = azar(11);
    for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? `rgba(40,60,20,${0.22 * r()})` : `rgba(255,255,230,${0.3 * r()})`; const s = 1 + r() * 2.5; g.fillRect(r() * 128, r() * 128, s, s * 1.4); }
  });
}
/* CV4a: en la vista de plano (uPlano = 1) los cuadros ganan color para leerse como en un mapa; surcos = bandas en el plano solo en la malla de surcos */
function plano(mat, surcos, clave) {
  if (!C.uPlano) return;
  mat.onBeforeCompile = sh => {
    sh.uniforms.uPlano = C.uPlano;
    const banda = surcos ? '\n float bnd = vMapUv.x * 2.6 / 2.2, bi = floor(bnd), bf = fract(bnd), bh = fract(sin(bi * 12.9898 + floor(vMapUv.y * 9.0 / 40.0) * 3.7) * 43758.5453);\n float surco = 0.86 + 0.2 * smoothstep(0.0, 0.25, bf) * (1.0 - smoothstep(0.7, 1.0, bf));\n diffuseColor.rgb *= mix(1.0, surco * (0.88 + 0.26 * bh), uPlano);' : '';
    sh.fragmentShader = 'uniform float uPlano;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n float lpl = dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2)); diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(lpl), diffuseColor.rgb, 1.7) * 0.82, uPlano);' + banda);
  };
  mat.customProgramCacheKey = () => clave;
}
/* C = { scene, altura, distRio, NIVEL_RIO, CI, uPlano } */
export function iniciar(ctx) {
  C = ctx; const op = { vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 };
  const matA = new THREE.MeshLambertMaterial({ map: texturaSurcos(), ...op }), matB = new THREE.MeshLambertMaterial({ map: texturaHierba(), ...op });
  plano(matA, true, 'campos-plano'); plano(matB, false, 'campos-plano-hierba');
  const nueva = m => { const x = new THREE.Mesh(new THREE.BufferGeometry(), m); x.receiveShadow = true; x.visible = false; x.renderOrder = 1; C.scene.add(x); return x; };
  mA = nueva(matA); mB = nueva(matB);
  /* piezas fusionadas (setos de viña, haces, uvas, casitas, ruedas, cercas): una malla de color por vértice; flota un poco más que el suelo */
  mP = nueva(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 })); mP.receiveShadow = false; mP.renderOrder = 2;
  /* ovejas: una sola malla en instancias; cuerpo = icosaedro aplastado (20 caras) + cabeza oscura (12 caras) */
  const gO = geometriaOveja(); mO = new THREE.InstancedMesh(gO, new THREE.MeshLambertMaterial({ vertexColors: true }), 700); mO.count = 0; mO.visible = false; mO.frustumCulled = false; mO.renderOrder = 2; C.scene.add(mO);
}
function geometriaOveja() {
  const P = [], K = [], ico = new THREE.IcosahedronGeometry(1, 0), a = ico.attributes.position;
  for (let i = 0; i < a.count; i++) { P.push(a.getX(i) * 1.15, a.getY(i) * 0.7 + 0.7, a.getZ(i) * 0.8); K.push(0.94, 0.92, 0.85); }
  const cab = [[1.1, 0.55, -0.32], [1.1, 0.55, 0.32], [1.1, 1.15, 0], [1.1, 0.55, -0.32], [1.1, 0.55, 0.32], [1.8, 0.8, 0], [1.1, 0.55, -0.32], [1.1, 1.15, 0], [1.8, 0.8, 0], [1.1, 0.55, 0.32], [1.1, 1.15, 0], [1.8, 0.8, 0]];
  for (const q of cab) { P.push(q[0], q[1], q[2]); K.push(0.26, 0.22, 0.19); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(K, 3)); g.computeVertexNormals(); return g;
}
const hash = (a, b, s) => { let x = Math.imul(a * 374761393 + b * 668265263, 1274126177) ^ (s | 0); x = Math.imul(x ^ (x >>> 13), 1103515245); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const hyp = v => Math.hypot(v[0], v[1]);

/* ---------- suelo: qué suelo es y qué campo lleva ---------- */
function suelo(x, z) {
  const h = C.altura, d = 14, gx = (h(x + d, z) - h(x - d, z)) / (2 * d), gz = (h(x, z + d) - h(x, z - d)) / (2 * d), g = Math.hypot(gx, gz);
  /* sz = 1 si la cuesta baja hacia el sur (+z): cara al sol. Este/oeste queda en 0,45: ladera seca */
  const sz = g > 1e-6 ? -gz / g : 0, solana = Math.max(0, Math.min(1, 0.45 + 0.5 * sz));
  return Agro.clasificarSuelo({ pend: g, distAgua: C.distRio(x, z), altAgua: h(x, z) - C.NIVEL_RIO, solana, pobre: false });
}
/* el campo que mejor encaja, con algo de variedad (peso = rinde²); en las granjas el trigo pesa el triple (su grano es el pan) */
function elegir(su, i, j, sem, granja) {
  if (OPC.forzar) { const f = OPC.forzar(su, i, j); if (f) return f; }
  const lista = Agro.consejo(su); if (!lista.length) return { campo: 'pasto', nota: 'regular' };
  const pesos = lista.map(x => x.rinde * x.rinde * (granja && x.campo === 'trigo' ? 3 : 1)), tot = pesos.reduce((a, b) => a + b, 0); let r = hash(i, j, sem) * tot;
  for (let q = 0; q < lista.length; q++) { r -= pesos[q]; if (r <= 0) return lista[q]; } return lista[0];
}
const nombreCampo = c => (typeof c === 'string' ? c : c.campo);

function nuevoPar(c, su, o, U, V, sem) {
  const lu = hyp(U), lv = hyp(V), ch = typeof c === 'string' ? { campo: c, nota: Agro.encaje(c, su).nota } : c;
  return { campo: ch.campo, nota: ch.nota, suelo: su, o, U, V, lu, lv, c: U[0] / lu, s: U[1] / lu, cx: o[0] + (U[0] + V[0]) / 2, cz: o[1] + (U[1] + V[1]) / 2, sem, mej: [], strips: [], olivos: [], lab: '', filas: [] };
}
const W = (p, fu, fv) => [p.o[0] + p.U[0] * fu + p.V[0] * fv, p.o[1] + p.U[1] * fu + p.V[1] * fv];

/* parcelas: granjas (campo propio) y cuadros de la vega alineados con el foro */
function franjas(E) {
  const CI = C.CI, arb = []; cuadros = []; pars = [];
  const libre = (x, z) => { const i = Math.floor((x - CI.X0) / CI.C), j = Math.floor((z - CI.Z0) / CI.C); if (i < 0 || j < 0 || i >= CI.N || j >= CI.N) return Math.abs(x) < 900 && Math.abs(z) < 900; const k = j * CI.N + i; return !E.ocup[k] && E.dVia[k] > 9; };
  const tierra = (x, z) => C.distRio(x, z) > 26 && C.altura(x, z) > C.NIVEL_RIO + 0.8;
  /* (a) las granjas: su campo */
  for (const e of E.edificios) { if (e.tipo !== 'granja' || !e.campo || e.obra || e.ruina) continue; const [a, b, , d] = e.campo, U = [b[0] - a[0], b[1] - a[1]], V = [d[0] - a[0], d[1] - a[1]];
    const sem = Math.round(e.x * 3 + e.z), su = suelo(a[0] + (U[0] + V[0]) / 2, a[1] + (U[1] + V[1]) / 2); pars.push(nuevoPar(elegir(su, sem, 7, 5, true), su, a, U, V, sem)); }
  /* (b) la vega */
  const f = E.foro, c = Math.cos(f.ang), s = Math.sin(f.ang), mu = (u, v) => [f.x + c * u - s * v, f.z + s * u + c * v], esc = {};
  for (const a of E.arboles) (esc[a.pieza] = esc[a.pieza] || []).push(a.esc); for (const k in esc) { esc[k].sort((x, y) => x - y); esc[k] = esc[k][esc[k].length >> 1]; }
  const granjas = E.edificios.filter(e => e.tipo === 'granja');
  /* CV4a: con la urbe grande a la vista la vega llega más lejos y ningún cuadro se mete dentro de la urbe */
  const urbe = !!(E.urbe && C.CI.enUrbe), LEJOS = urbe ? 540 : 400;
  for (let j = -13; j <= 13; j++) for (let i = -13; i <= 13; i++) {
    const cx = (i + 0.5) * LADO, cz = (j + 0.5) * LADO, p = mu(cx, cz), d = Math.hypot(p[0] - f.x, p[1] - f.z); if (d > LEJOS || d < 60) continue;
    const hacia = (x, z, m) => { const dx = x - f.x, dz = z - f.z, dd = Math.hypot(dx, dz) || 1; return [x - dx / dd * m, z - dz / dd * m]; };
    let ok = true; const pts = []; for (let b = 0; b <= 2 && ok; b++) for (let a = 0; a <= 2; a++) { const q = mu(cx + (a - 1) * LADO * 0.5, cz + (b - 1) * LADO * 0.5); pts.push(q); const h = hacia(q[0], q[1], 24), h2 = hacia(q[0], q[1], 12);
      if (!libre(q[0], q[1]) || !tierra(q[0], q[1]) || (E.fundada && C.CI.cercado(E, h[0], h[1])) || (urbe && C.CI.enUrbe(E, h2[0], h2[1]))) { ok = false; break; } }
    if (!ok) continue; const ys = pts.map(q => C.altura(q[0], q[1])); if (Math.max(...ys) - Math.min(...ys) > DESNIVEL_MAX) continue;
    if (granjas.some(g => Math.hypot(g.x - p[0], g.z - p[1]) < 46)) continue; if (hash(i, j, E.semilla) < 0.18) continue;
    const su = suelo(p[0], p[1]), ch = elegir(su, i, j, 23, false), o = mu(cx - LADO / 2 + MARGEN, cz - LADO / 2 + MARGEN), L = LADO - 2 * MARGEN, U = [c * L, s * L], V = [-s * L, c * L];
    pars.push(nuevoPar(ch, su, o, U, V, i * 31 + j)); cuadros.push({ x: p[0], z: p[1], c, s });
    /* seto de cipreses u olivos en una linde del cuadro de trigo */
    if (nombreCampo(ch) === 'trigo' && hash(i, j, 11) < 0.3) { const pz = hash(i, j, 13) < 0.5 ? 'cipres' : 'olivo', e0 = esc[pz] || 1; for (let t = 3; t < LADO - 2; t += pz === 'cipres' ? 6 : 9) { const q = mu(cx - LADO / 2 + t, cz - LADO / 2 + 0.2); if (tierra(q[0], q[1]) && libre(q[0], q[1])) arb.push({ x: q[0], z: q[1], pieza: pz, esc: e0 * (0.85 + 0.3 * hash(t, i, j)), ang: t, tono: hash(j, t, i) }); } }
  }
  /* olivos de cada olivar: rejilla de 8 m en hileras (los dibuja city3d con arbolesExtra) */
  const eO = esc.olivo || 1;
  for (const p of pars) if (p.campo === 'olivar') { const nu = Math.max(2, Math.round(p.lu / 8.5)), nv = Math.max(2, Math.round(p.lv / 8.5));
    for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) { const q = W(p, (a + 0.5) / nu, (b + 0.5) / nv); p.olivos.push(q); arb.push({ x: q[0], z: q[1], pieza: 'olivo', esc: eO * (0.8 + 0.25 * hash(a, b, p.sem)), ang: a * b, tono: hash(b, a, p.sem) }); } }
  extra = arb; tapaSet = new Set(arb.map(a => Math.round(a.x * 100) + ',' + Math.round(a.z * 100)));
}

/* ---------- suelo pintado: cuadrículas que siguen el terreno ---------- */
const nuevaG = (ub, ua) => ({ P: [], UV: [], T: [], VR: [], PR: [], ub, ua });
/* rectángulo o + a·u + b·v, con t = tipo pintado, vr = variación, pi = índice de parcela */
function plancha(G, o, u, v, t, vr, pi) {
  const la = hyp(u), lb = hyp(v), nu = Math.max(1, Math.ceil(la / PASO)), nv = Math.max(1, Math.ceil(lb / PASO));
  const pt = (a, b) => { const x = o[0] + u[0] * a + v[0] * b, z = o[1] + u[1] * a + v[1] * b; return [x, C.altura(x, z) + ALZA, z, b * lb / G.ub, a * la / G.ua]; };
  for (let a = 0; a < nu; a++) for (let b = 0; b < nv; b++) { const p00 = pt(a / nu, b / nv), p10 = pt((a + 1) / nu, b / nv), p11 = pt((a + 1) / nu, (b + 1) / nv), p01 = pt(a / nu, (b + 1) / nv);
    const ux = p10[0] - p00[0], uz = p10[2] - p00[2], vx = p01[0] - p00[0], vz = p01[2] - p00[2], arriba = ux * vz - uz * vx > 0;      // que la cara de delante mire hacia arriba
    for (const q of arriba ? [p00, p11, p10, p00, p01, p11] : [p00, p10, p11, p00, p11, p01]) { G.P.push(q[0], q[1], q[2]); G.UV.push(q[3], q[4]); G.T.push(t); G.VR.push(vr); G.PR.push(pi); } }
}
/* parte el rectángulo del cuadro de trigo en n tiras a lo largo de U (eje 0) o de V (eje 1) */
function tiras(G, p, pi) {
  const eje = p.sem & 1 ? 1 : 0, A = eje ? p.V : p.U, B = eje ? p.U : p.V, la = hyp(A), lb = hyp(B), n = Math.max(2, Math.round(lb / 10.5)), w = (lb - HUECO * (n - 1)) / n;
  for (let q = 0; q < n; q++) { const b0 = q * (w + HUECO) / lb, bw = w / lb, oq = [p.o[0] + B[0] * b0, p.o[1] + B[1] * b0], r = hash(p.sem, q, 91), t = r < 0.6 ? 0 : r < 0.8 ? 1 : 2, v = [B[0] * bw, B[1] * bw], vr = 0.9 + 0.2 * hash(q, p.sem, 7);
    plancha(G, oq, A, v, t, vr, pi); p.strips.push({ o: oq, u: A, v, la, lb: w, tipo: t }); }
}
function suelos(E) {
  GA = nuevaG(2.6, 9); GB = nuevaG(9, 9);
  pars.forEach((p, pi) => {
    const vr = 0.92 + 0.16 * hash(p.sem, 3, 5);
    if (p.campo === 'trigo') tiras(GA, p, pi);
    else if (p.campo === 'olivar') plancha(GA, p.o, p.U, p.V, 3, vr, pi);
    else if (p.campo === 'vina') plancha(GA, p.o, p.U, p.V, 4, vr, pi);
    else if (p.campo === 'pasto') plancha(GB, p.o, p.U, p.V, 5, vr, pi);
    else if (p.campo === 'huerto') {
      /* cuadritos de ~9 m con una acequia de 1,1 m entre ellos y alrededor */
      const nu = Math.max(2, Math.round(p.lu / 9.5)), nv = Math.max(2, Math.round(p.lv / 9.5)), gu = 1.1 / p.lu, gv = 1.1 / p.lv, u1 = [p.U[0] / p.lu, p.U[1] / p.lu];
      for (let b = 0; b < nv; b++) for (let a = 0; a < nu; a++) { const f0 = [a / nu + gu / 2, b / nv + gv / 2], f1 = [(a + 1) / nu - gu / 2, (b + 1) / nv - gv / 2];
        plancha(GB, W(p, f0[0], f0[1]), [p.U[0] * (f1[0] - f0[0]), p.U[1] * (f1[0] - f0[0])], [p.V[0] * (f1[1] - f0[1]), p.V[1] * (f1[1] - f0[1])], 6, hash(a, b, p.sem), pi); }
      /* acequias: franjas finas entre cuadritos (más anchas que el hueco para que el azul se lea desde arriba) */
      for (let a = 0; a <= nu; a++) { const fu = a / nu, w = 1.1 / p.lu; plancha(GB, W(p, Math.max(0, fu - w * (a === nu ? 1.2 : 0.6)), 0), [p.U[0] * w * 1.2, p.U[1] * w * 1.2], p.V, 7, 1, pi); }
      for (let b = 0; b <= nv; b++) { const fv = b / nv, w = 1.1 / p.lv; plancha(GB, W(p, 0, Math.max(0, fv - w * (b === nv ? 1.2 : 0.6))), p.U, [p.V[0] * w * 1.2, p.V[1] * w * 1.2], 7, 1, pi); }
    }
  });
  const hacer = (m, G) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(G.P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(G.UV, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(G.P.length), 3)); g.computeVertexNormals();
    const N = g.attributes.normal; for (let i = 0; i < N.count; i++) if (N.getY(i) < 0) N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i));       // las normales de cada triángulo hacia arriba
    m.geometry.dispose(); m.geometry = g; m.visible = G.P.length > 0; };
  hacer(mA, GA); hacer(mB, GB);
}

/* ---------- piezas: lo que se ve encima del suelo (labores y mejoras) ---------- */
let PP = [], PC = [];
const T3 = (a, b, c, k) => { PP.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); for (let i = 0; i < 3; i++) PC.push(k[0], k[1], k[2]); };
const Q4 = (a, b, c, d, k) => { T3(a, b, c, k); T3(a, c, d, k); };
const alt = (x, z) => C.altura(x, z) + ALZA;
const marco = (c, s, cx, cz) => (lu, lv, y) => [cx + c * lu - s * lv, y, cz + s * lu + c * lv];
const oscuro = (k, f) => [k[0] * f, k[1] * f, k[2] * f];
/* caja con tapa; w a lo largo de (c, s); la base se hunde un poco para no flotar en cuesta */
function caja(c, s, cx, cz, w, d, h, col, top) {
  const F = marco(c, s, cx, cz), y = alt(cx, cz) - 0.2, hw = w / 2, hd = d / 2, b = [F(-hw, -hd, y), F(hw, -hd, y), F(hw, hd, y), F(-hw, hd, y)], t = b.map(q => [q[0], q[1] + h, q[2]]);
  Q4(t[0], t[1], t[2], t[3], top || col); for (let i = 0; i < 4; i++) Q4(b[i], b[(i + 1) % 4], t[(i + 1) % 4], t[i], i & 1 ? oscuro(col, 0.86) : col);
}
/* tejado a dos aguas sobre una caja de altura h0 (cumbrera a lo largo de w) */
function techo(c, s, cx, cz, w, d, h0, hh, col, pared) {
  const F = marco(c, s, cx, cz), y = alt(cx, cz) - 0.2 + h0, hw = w / 2 + 0.4, hd = d / 2 + 0.5, r0 = F(-hw, 0, y + hh), r1 = F(hw, 0, y + hh);
  Q4(F(-hw, -hd, y), F(hw, -hd, y), r1, r0, col); Q4(F(-hw, hd, y), F(hw, hd, y), r1, r0, oscuro(col, 0.84));
  T3(F(-w / 2, -d / 2, y), F(-w / 2, d / 2, y), F(-w / 2, 0, y + hh * 0.9), pared); T3(F(w / 2, -d / 2, y), F(w / 2, d / 2, y), F(w / 2, 0, y + hh * 0.9), pared);
}
function disco(cx, cz, r, col, dy = 0.06, seg = 14) { const y = alt(cx, cz) + dy, pt = k => { const a = k / seg * 6.2832; return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]; }; for (let k = 0; k < seg; k++) T3([cx, y, cz], pt(k), pt(k + 1), col); }
function cono(cx, cz, r, h, col, seg = 6) { const y = alt(cx, cz) - 0.2, pt = k => { const a = k / seg * 6.2832; return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]; }; for (let k = 0; k < seg; k++) T3([cx, y + h, cz], pt(k), pt(k + 1), k & 1 ? oscuro(col, 0.88) : col); }
function suelito(c, s, cx, cz, w, d, col, dy = 0.08) { const F = marco(c, s, cx, cz), y = alt(cx, cz) + dy; Q4(F(-w / 2, -d / 2, y), F(w / 2, -d / 2, y), F(w / 2, d / 2, y), F(-w / 2, d / 2, y), col); }

const HOJA = [[0.30, 0.52, 0.18], [0.24, 0.44, 0.14], [0.62, 0.30, 0.12], [0.40, 0.33, 0.22]], PALO = [0.50, 0.38, 0.25], UVA = [0.36, 0.15, 0.34], PAJA = [0.88, 0.76, 0.42], MANTO = [0.76, 0.72, 0.58], LANA = [0.92, 0.89, 0.80], TEJA = [0.72, 0.36, 0.23];
/* esquinas donde caen las mejoras (fracción del cuadro) */
const ESQ = [[0.9, 0.9], [0.1, 0.9], [0.9, 0.1], [0.1, 0.1]];
function mejora(p, id, i) {
  const q = W(p, ESQ[i % 4][0], ESQ[i % 4][1]), [x, z] = q, c = p.c, s = p.s, F = marco(c, s, x, z);
  if (id === 'almazara') { caja(c, s, x, z, 6.4, 4.4, 2.6, [0.80, 0.72, 0.56]); techo(c, s, x, z, 6.4, 4.4, 2.6, 1.7, TEJA, [0.80, 0.72, 0.56]); const m = F(0, 4, 0); disco(m[0], m[2], 1.5, [0.62, 0.60, 0.56], 0.1); }
  else if (id === 'lagar') { caja(c, s, x, z, 5.2, 4.2, 2.5, [0.82, 0.74, 0.60]); techo(c, s, x, z, 5.2, 4.2, 2.5, 1.6, [0.62, 0.30, 0.22], [0.82, 0.74, 0.60]); const m = F(0, 3.7, 0); disco(m[0], m[2], 1.4, UVA, 0.1); }
  else if (id === 'bodega') { caja(c, s, x, z, 8.4, 4.2, 2.4, [0.72, 0.62, 0.48]); techo(c, s, x, z, 8.4, 4.2, 2.4, 1.5, [0.56, 0.28, 0.20], [0.72, 0.62, 0.48]); for (let k = -1; k <= 1; k++) { const m = F(k * 2.4, -3.4, 0); disco(m[0], m[2], 0.9, [0.62, 0.38, 0.24], 0.1, 8); } }
  else if (id === 'noria') {
    /* estanque azul y una rueda de madera de pie junto a él: aro de 12 tramos en el plano vertical (v, y) y rayos */
    const m0 = F(0, 3.4, 0); disco(m0[0], m0[2], 2.8, [0.30, 0.52, 0.68], 0.1, 16);
    const R = 2.3, y0 = alt(x, z) + R + 0.3, an = k => k / 12 * 6.2832, P = (dv, dy) => [F(0, dv, 0)[0], y0 + dy, F(0, dv, 0)[2]], Pa = (dv, dy, du) => [F(du, dv, 0)[0], y0 + dy, F(du, dv, 0)[2]];
    for (let k = 0; k < 12; k++) { const c0 = Math.cos(an(k)), s0 = Math.sin(an(k)), c1 = Math.cos(an(k + 1)), s1 = Math.sin(an(k + 1));
      Q4(Pa(R * c0, R * s0, 0.35), Pa(R * c0, R * s0, -0.35), Pa(R * c1, R * s1, -0.35), Pa(R * c1, R * s1, 0.35), PALO);
      T3(P(0, 0), P(R * 0.85 * c0, R * 0.85 * s0), P(R * 0.85 * c1, R * 0.85 * s1), [0.62, 0.50, 0.34]); }
    caja(c, s, x, z, 0.5, 0.5, R + 0.3, oscuro(PALO, 0.8));
  }
  else if (id === 'redil') { suelito(c, s, x, z, 9, 9, [0.62, 0.54, 0.38], 0.08); for (const [dx, dz, w, d] of [[0, -4.5, 9, 0.35], [0, 4.5, 9, 0.35], [-4.5, 0, 0.35, 9], [4.5, 0, 0.35, 9]]) { const m = F(dx, dz, 0); caja(c, s, m[0], m[2], w, d, 1.0, [0.52, 0.40, 0.27]); } }
  else if (id === 'era') { disco(x, z, 4.3, [0.86, 0.79, 0.62], 0.09, 18); disco(x, z, 0.6, [0.60, 0.52, 0.40], 0.12, 6); }
  else if (id === 'estercolero') { cono(x, z, 3.0, 1.6, [0.38, 0.27, 0.17]); const m = F(3.2, 1.2, 0); cono(m[0], m[2], 1.6, 0.9, [0.34, 0.25, 0.16]); }
}
function mejorasDe(p) { const o = OPC.mejoras; if (o === 'ninguna') return []; if (o === 'todas') return Agro.mejorasDe(p.campo); if (DAME) { try { return DAME({ campo: p.campo, suelo: p.suelo, x: p.cx, z: p.cz }) || []; } catch (e) { return []; } } return []; }

const laborDe = (campo, est) => (OPC.mes != null ? Agro.labor(campo, OPC.mes) : Agro.laborEstacion(campo, est));
function piezas(est) {
  PP = []; PC = []; OVEJAS = [];
  for (const p of pars) {
    const lab = p.lab, hoja = HOJA[est], fin = lab === 'vendimia' || lab === 'pisado';
    if (p.campo === 'trigo' && (lab === 'siega' || lab === 'trilla')) {
      /* haces atados sobre el rastrojo, a lo largo de cada tira */
      const paso = lab === 'siega' ? 7 : 15;
      for (const t of p.strips) { const lu = t.la, c = t.u[0] / lu, s = t.u[1] / lu, n = Math.max(1, Math.floor(lu / paso));
        for (let k = 0; k < n; k++) { const fu = (k + 0.5 + 0.2 * (hash(k, p.sem, 3) - 0.5)) / n, x = t.o[0] + t.u[0] * fu + t.v[0] * 0.5, z = t.o[1] + t.u[1] * fu + t.v[1] * 0.5;
          caja(c, s, x, z, 2.0, 0.9, 0.7, PAJA, [0.95, 0.84, 0.50]); } }
    } else if (p.campo === 'olivar' && lab === 'aceituna') {
      /* mantos claros extendidos bajo cada olivo para recoger la aceituna */
      for (const q of p.olivos) suelito(p.c, p.s, q[0], q[1], 5.6, 5.6, MANTO, 0.1);
    } else if (p.campo === 'vina') {
      const nf = Math.max(3, Math.round(p.lv / 5.2)), ancho = (lab === 'poda' || lab === 'reposo') ? 0.5 : lab === 'cava' || lab === 'atar' ? 1.0 : 1.4, nu = Math.max(1, Math.ceil(p.lu / 11)), vx = -p.s, vz = p.c;
      for (let r = 0; r < nf; r++) { const fv = (r + 0.5) / nf; let prev = null;
        for (let k = 0; k <= nu; k++) { const q = W(p, 0.03 + 0.94 * k / nu, fv), y = alt(q[0], q[1]), cur = { x: q[0], z: q[1], y };
          if (prev) { const hb = 1.2, hw = ancho / 2, a = [prev.x - vx * hw, prev.y + hb, prev.z - vz * hw], b = [prev.x + vx * hw, prev.y + hb, prev.z + vz * hw], c2 = [cur.x + vx * hw, cur.y + hb, cur.z + vz * hw], d = [cur.x - vx * hw, cur.y + hb, cur.z - vz * hw];
            Q4(a, b, c2, d, hoja); Q4([a[0], prev.y - 0.1, a[2]], a, d, [d[0], cur.y - 0.1, d[2]], oscuro(hoja, 0.78)); Q4([b[0], prev.y - 0.1, b[2]], b, c2, [c2[0], cur.y - 0.1, c2[2]], oscuro(hoja, 0.78)); }
          if (k < nu && k % 1 === 0) { const hb = 1.7, w = 0.3; Q4([cur.x - w, cur.y - 0.1, cur.z], [cur.x + w, cur.y - 0.1, cur.z], [cur.x + w, cur.y + hb, cur.z], [cur.x - w, cur.y + hb, cur.z], PALO); Q4([cur.x, cur.y - 0.1, cur.z - w], [cur.x, cur.y - 0.1, cur.z + w], [cur.x, cur.y + hb, cur.z + w], [cur.x, cur.y + hb, cur.z - w], PALO); }
          prev = cur; }
        if (fin) { const na = Math.max(4, Math.round(p.lu / 3)); for (let k = 0; k < na; k++) { const q = W(p, 0.04 + 0.92 * (k + 0.5) / na, fv + (k & 1 ? 0.012 : -0.012)), y = alt(q[0], q[1]) + 1.35; Q4([q[0] - 0.45, y, q[1] - 0.45], [q[0] + 0.45, y, q[1] - 0.45], [q[0] + 0.45, y, q[1] + 0.45], [q[0] - 0.45, y, q[1] + 0.45], UVA); } } }
      if (lab === 'vendimia') for (let k = 0; k < 4; k++) { const q = W(p, 0.5 + 0.12 * k - 0.2, 0.02); caja(p.c, p.s, q[0], q[1], 1.3, 1.3, 0.9, [0.62, 0.46, 0.28]); }
    } else if (p.campo === 'pasto') {
      const area = p.lu * p.lv, nb = Math.max(4, Math.round(area / 130)), esq = lab === 'esquileo', crias = lab === 'paridera', n = lab === 'trashumancia' ? 2 : lab === 'heno' ? Math.ceil(nb / 3) : nb, sc = (esq ? 0.72 : 1) * 1.5;      /* las ovejas van algo grandes a propósito: desde arriba deben leerse */
      for (let k = 0; k < n; k++) { const q = W(p, 0.1 + 0.8 * hash(k * 7 + 1, p.sem, 41), 0.1 + 0.8 * hash(p.sem, k * 13 + 5, 43)); OVEJAS.push([q[0], q[1], hash(k, p.sem, 47) * 6.2832, sc * (0.9 + 0.2 * hash(k, p.sem, 49)), 0]);
        if (crias && k % 2 === 0) OVEJAS.push([q[0] + 1.3, q[1] + 0.9, hash(k, p.sem, 53) * 6.2832, 0.5, 0]); }
      if (esq) for (let k = 0; k < 4; k++) { const q = W(p, 0.14 + 0.07 * k, 0.12); caja(p.c, p.s, q[0], q[1], 1.5, 1.0, 0.9, LANA, [0.97, 0.95, 0.88]); }
      if (lab === 'heno') for (let k = 0; k < 5; k++) { const q = W(p, 0.2 + 0.14 * k, 0.5 + 0.2 * (k & 1 ? 1 : -1)); caja(p.c, p.s, q[0], q[1], 1.9, 1.1, 1.1, PAJA, [0.95, 0.84, 0.50]); }
    }
    p.mej.forEach((id, i) => mejora(p, id, i));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(PP, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(PC, 3)); g.computeVertexNormals();
  mP.geometry.dispose(); mP.geometry = g; mP.visible = PP.length > 0;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), esc = new THREE.Vector3(), n = Math.min(OVEJAS.length, mO.instanceMatrix.count), paso = OVEJAS.length / n || 1;      /* con más ovejas que el tope se toman repartidas, no solo las primeras */
  for (let i = 0; i < n; i++) { const o = OVEJAS[Math.floor(i * paso)]; q.setFromAxisAngle(e, o[2]); pos.set(o[0], alt(o[0], o[1]) - 0.1, o[1]); esc.setScalar(o[3]); m.compose(pos, q, esc); mO.setMatrixAt(i, m); }
  mO.count = n; mO.instanceMatrix.needsUpdate = true; mO.visible = n > 0; PP = PC = null;
}
/* mes (0 = Ianuarius) → estación (0 primavera … 3 invierno): dic-feb invierno, mar-may primavera, jun-ago verano, sep-nov otoño */
const estDeMes = m => (m === 11 || m <= 1 ? 3 : m < 5 ? 0 : m < 8 ? 1 : 2);

/* rehace la malla si cambió algo que la mueve; devuelve true si cambió (para repintar árboles) */
export function poner(E, k, fe) {
  if (!CAMPOS || !mA) return false;
  const fi = E && E.fundada ? E.semilla + '|' + E.edificios.filter(e => e.tipo === 'granja').map(e => Math.round(e.x) + ',' + (e.obra ? 1 : 0) + (e.ruina ? 1 : 0)).join(';') + '|' + E.vias.length + '|' + E.parcelas.length + '|' + E.edificios.length + '|' + E.muralla.fase : '';
  if (fi === firma) { estacion(k, fe); return false; } firma = fi;
  if (!fi) { mA.visible = mB.visible = mP.visible = mO.visible = false; cuadros = []; extra = []; pars = []; tapaSet = new Set(); return true; }
  franjas(E); for (const p of pars) p.mej = mejorasDe(p); suelos(E); estQ = -1; claveP = ''; estacion(k, fe); return true;
}
export function estacion(k, fe = 0) {
  if (!mA || !pars.length && !mA.visible) return; if (OPC.mes != null) { k = estDeMes(OPC.mes); fe = 0; }
  const q = Math.round(((k % 4) + fe) * 8); if (q === estQ) return; estQ = q;
  const a = ((k % 4) + 4) % 4, b = (a + 1) % 4, cerca = fe < 0.5 ? a : b;
  for (const p of pars) { const l = laborDe(p.campo, cerca); p.lab = l ? l.id : ''; }
  const cache = new Map(), col = (t, vr, pi) => {
    const lab = pars[pi].lab, key = t + '|' + (t === 6 ? Math.floor(vr * 3.999) : 0) + '|' + lab; let c = cache.get(key); if (c) return c;
    if (t === 6) { const hi = Math.floor(vr * 3.999), h = HUERTO[hi], luz = HUERTO_LUZ[a] + (HUERTO_LUZ[b] - HUERTO_LUZ[a]) * fe; c = lab === 'siembra' && hi < 2 ? oscuro(TIERRA_ARADA, 0.9 + 0.1 * hi) : oscuro(h, luz); }
    else { const ov = tinte(t, lab); c = ov || COL[t][a].map((x, i) => x + (COL[t][b][i] - x) * fe); }
    cache.set(key, c); return c;
  };
  for (const [m, G] of [[mA, GA], [mB, GB]]) { if (!G || !G.T.length) continue; const A = m.geometry.attributes.color;
    for (let i = 0; i < G.T.length; i++) { const t = G.T[i], vr = G.VR[i], c = col(t, vr, G.PR[i]), f = t === 6 || t === 7 ? 1 : vr; A.setXYZ(i, c[0] * f, c[1] * f, c[2] * f); } A.needsUpdate = true; }
  const clave = cerca + '|' + pars.map(p => p.lab + p.mej.join('+')).join(','); if (clave !== claveP) { claveP = clave; piezas(cerca); }
}
/* ¿cae (x, z) dentro de un cuadro de la vega? (para no dejar árboles del bosque dentro de un campo); los olivos del propio campo sí se pintan */
export function tapa(x, z) { if (tapaSet.has(Math.round(x * 100) + ',' + Math.round(z * 100))) return false; for (const q of cuadros) { const dx = x - q.x, dz = z - q.z; if (Math.abs(dx * q.c + dz * q.s) < LADO / 2 + 1 && Math.abs(-dx * q.s + dz * q.c) < LADO / 2 + 1) return true; } return false; }
export function arbolesExtra() { return extra; }
