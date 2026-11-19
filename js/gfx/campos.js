/* AQVILA — campos de cultivo alrededor de la ciudad (CI1-8). Solo vista: no cambia la economía ni js/ciudad.js.
   Franjas de trigo, legumbre y barbecho en las granjas (e.campo) y en la vega fuera de la muralla, en parcelas cuadradas
   alineadas con el foro (centuriación suave), con lindes de tierra entre franjas e hileras de cipreses u olivos en algunas lindes.
   El color cambia con la estación: verde en primavera, dorado en verano, rastrojo en otoño y pardo en invierno.
   Arte PROPIO por código (geometría y textura de surcos pintada en un lienzo); los árboles son los de siempre (0 A.D.).
   Una malla, una llamada de dibujo. CAMPOS = false lo apaga. */
import { THREE } from './models.js';

export const CAMPOS = true;
const LADO = 44, MARGEN = 1.6, HUECO = 1.3, PASO = 7, ALZA = 0.22;
/* color por cultivo y estación (0 primavera, 1 verano, 2 otoño, 3 invierno) */
const COL = {
  trigo: [[0.50, 0.66, 0.27], [0.95, 0.80, 0.42], [0.76, 0.66, 0.46], [0.47, 0.41, 0.31]],
  verde: [[0.36, 0.56, 0.22], [0.47, 0.60, 0.26], [0.56, 0.54, 0.32], [0.40, 0.44, 0.29]],
  barbecho: [[0.56, 0.50, 0.35], [0.66, 0.56, 0.38], [0.52, 0.44, 0.31], [0.45, 0.39, 0.30]],
  vina: [[0.30, 0.46, 0.18], [0.27, 0.42, 0.16], [0.52, 0.36, 0.18], [0.36, 0.30, 0.22]]      // viña en hileras: verde oscuro, rojiza en otoño
};
const TIPOS = ['trigo', 'verde', 'barbecho', 'vina'];
let C = null, malla = null, firma = '', tipoV = null, varV = null, estQ = -1, cuadros = [], extra = [];

function texturaSurcos() {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const g = cv.getContext('2d');
  g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 16) { g.fillStyle = 'rgba(40,30,20,0.38)'; g.fillRect(x, 0, 4, 128); g.fillStyle = 'rgba(255,255,240,0.28)'; g.fillRect(x + 7, 0, 5, 128); }
  let a = 7; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.5 ? `rgba(50,40,20,${0.25 * r()})` : `rgba(255,250,220,${0.3 * r()})`; g.fillRect(r() * 128, r() * 128, 2, 3); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/* C = { scene, altura, distRio, NIVEL_RIO, CI } */
export function iniciar(ctx) {
  C = ctx; const mat = new THREE.MeshLambertMaterial({ map: texturaSurcos(), vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  malla = new THREE.Mesh(new THREE.BufferGeometry(), mat); malla.receiveShadow = true; malla.visible = false; malla.renderOrder = 1; C.scene.add(malla);
}
const hash = (a, b, s) => { let x = Math.imul(a * 374761393 + b * 668265263, 1274126177) ^ (s | 0); x = Math.imul(x ^ (x >>> 13), 1103515245); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

/* franjas: cada una es [o, u (largo), v (ancho), tipo, variación]; o, u, v en el plano XZ */
function franjas(E) {
  const CI = C.CI, out = [], arb = []; cuadros = [];
  const libre = (x, z) => { const i = Math.floor((x - CI.X0) / CI.C), j = Math.floor((z - CI.Z0) / CI.C); if (i < 0 || j < 0 || i >= CI.N || j >= CI.N) return Math.abs(x) < 900 && Math.abs(z) < 900; const k = j * CI.N + i; return !E.ocup[k] && E.dVia[k] > 9; };
  const tierra = (x, z) => C.distRio(x, z) > 26 && C.altura(x, z) > C.NIVEL_RIO + 0.8;
  const reparte = (o, U, V, n, eje, s) => { /* parte el rectángulo o + a·U + b·V en n franjas a lo largo de U (eje 0) o de V (eje 1) */
    const lu = Math.hypot(U[0], U[1]), lv = Math.hypot(V[0], V[1]), A = eje ? V : U, B = eje ? U : V, la = eje ? lv : lu, lb = eje ? lu : lv, w = (lb - HUECO * (n - 1)) / n;
    for (let q = 0; q < n; q++) { const b0 = q * (w + HUECO) / lb, bw = w / lb, oq = [o[0] + B[0] * b0, o[1] + B[1] * b0], r = hash(s, q, 91), t = r < 0.52 ? 0 : r < 0.7 ? 1 : r < 0.84 ? 2 : 3;
      out.push({ o: oq, u: A, v: [B[0] * bw, B[1] * bw], la, lb: w, tipo: t, var: 0.9 + 0.2 * hash(q, s, 7) }); } };
  /* (a) las granjas: su campo en franjas */
  for (const e of E.edificios) { if (e.tipo !== 'granja' || !e.campo || e.obra || e.ruina) continue; const [a, b, , d] = e.campo, U = [b[0] - a[0], b[1] - a[1]], V = [d[0] - a[0], d[1] - a[1]];
    const n = Math.max(2, Math.round(Math.hypot(V[0], V[1]) / 9)); reparte(a, U, V, n, 0, Math.round(e.x * 3 + e.z)); }
  /* (b) la vega: cuadros alineados con el foro, fuera de la muralla y cerca de la ciudad */
  const f = E.foro, c = Math.cos(f.ang), s = Math.sin(f.ang), mu = (u, v) => [f.x + c * u - s * v, f.z + s * u + c * v], esc = {};
  for (const a of E.arboles) (esc[a.pieza] = esc[a.pieza] || []).push(a.esc); for (const k in esc) { esc[k].sort((x, y) => x - y); esc[k] = esc[k][esc[k].length >> 1]; }
  const granjas = E.edificios.filter(e => e.tipo === 'granja');
  for (let j = -10; j <= 10; j++) for (let i = -10; i <= 10; i++) {
    const cx = (i + 0.5) * LADO, cz = (j + 0.5) * LADO, p = mu(cx, cz), d = Math.hypot(p[0] - f.x, p[1] - f.z); if (d > 400 || d < 60) continue;
    const hacia = (x, z, m) => { const dx = x - f.x, dz = z - f.z, dd = Math.hypot(dx, dz) || 1; return [x - dx / dd * m, z - dz / dd * m]; };
    let ok = true; const pts = []; for (let b = 0; b <= 2 && ok; b++) for (let a = 0; a <= 2; a++) { const q = mu(cx + (a - 1) * LADO * 0.5, cz + (b - 1) * LADO * 0.5); pts.push(q); const h = hacia(q[0], q[1], 24);
      if (!libre(q[0], q[1]) || !tierra(q[0], q[1]) || (E.fundada && C.CI.cercado(E, h[0], h[1]))) { ok = false; break; } }
    if (!ok) continue; const ys = pts.map(q => C.altura(q[0], q[1])); if (Math.max(...ys) - Math.min(...ys) > 7) continue;
    if (granjas.some(g => Math.hypot(g.x - p[0], g.z - p[1]) < 46)) continue; if (hash(i, j, E.semilla) < 0.18) continue;
    /* olivar en cuadrícula (la tríada romana: trigo, vid y olivo) en algún cuadro */
    if (hash(i, j, 17) < 0.14) { const e0 = esc.olivo || 1; for (let b = 4; b < LADO - 2; b += 8) for (let a = 4; a < LADO - 2; a += 8) { const q = mu(cx - LADO / 2 + a, cz - LADO / 2 + b); arb.push({ x: q[0], z: q[1], pieza: 'olivo', esc: e0 * (0.8 + 0.25 * hash(a, b, i + j)), ang: a * b, tono: hash(b, a, j) }); } cuadros.push({ x: p[0], z: p[1], c, s }); continue; }
    const o = mu(cx - LADO / 2 + MARGEN, cz - LADO / 2 + MARGEN), L = LADO - 2 * MARGEN, U = [c * L, s * L], V = [-s * L, c * L];
    reparte(o, U, V, 3 + (hash(j, i, 3) < 0.5 ? 1 : 0), hash(i, j, 5) < 0.5 ? 0 : 1, i * 31 + j); cuadros.push({ x: p[0], z: p[1], c, s });
    /* seto de cipreses u olivos en una linde */
    if (hash(i, j, 11) < 0.3) { const pz = hash(i, j, 13) < 0.5 ? 'cipres' : 'olivo', e0 = esc[pz] || 1; for (let t = 3; t < LADO - 2; t += pz === 'cipres' ? 6 : 9) { const q = mu(cx - LADO / 2 + t, cz - LADO / 2 + 0.2); if (tierra(q[0], q[1]) && libre(q[0], q[1])) arb.push({ x: q[0], z: q[1], pieza: pz, esc: e0 * (0.85 + 0.3 * hash(t, i, j)), ang: t, tono: hash(j, t, i) }); } }
  }
  extra = arb; return out;
}
/* rehace la malla si cambió algo que la mueve; devuelve true si cambió (para repintar árboles) */
export function poner(E, k, fe) {
  if (!CAMPOS || !malla) return false;
  const fi = E && E.fundada ? E.semilla + '|' + E.edificios.filter(e => e.tipo === 'granja').map(e => Math.round(e.x) + ',' + (e.obra ? 1 : 0) + (e.ruina ? 1 : 0)).join(';') + '|' + E.vias.length + '|' + E.parcelas.length + '|' + E.edificios.length + '|' + E.muralla.fase : '';
  if (fi === firma) { estacion(k, fe); return false; } firma = fi;
  if (!fi) { malla.visible = false; cuadros = []; extra = []; return true; }
  const F = franjas(E), P = [], UV = [], T = [], VR = [];
  for (const q of F) { const nu = Math.max(1, Math.ceil(q.la / PASO)), nv = Math.max(1, Math.ceil(q.lb / PASO)), pt = (a, b) => { const x = q.o[0] + q.u[0] * a + q.v[0] * b, z = q.o[1] + q.u[1] * a + q.v[1] * b; return [x, C.altura(x, z) + ALZA, z, b * q.lb / 2.6, a * q.la / 9]; };
    for (let a = 0; a < nu; a++) for (let b = 0; b < nv; b++) { const p00 = pt(a / nu, b / nv), p10 = pt((a + 1) / nu, b / nv), p11 = pt((a + 1) / nu, (b + 1) / nv), p01 = pt(a / nu, (b + 1) / nv);
      const ux = p10[0] - p00[0], uz = p10[2] - p00[2], vx = p01[0] - p00[0], vz = p01[2] - p00[2], arriba = ux * vz - uz * vx > 0;      // que la cara de delante mire hacia arriba
      for (const p of arriba ? [p00, p11, p10, p00, p01, p11] : [p00, p10, p11, p00, p11, p01]) { P.push(p[0], p[1], p[2]); UV.push(p[3], p[4]); T.push(q.tipo); VR.push(q.var); } } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(P.length), 3)); g.computeVertexNormals();
  /* las normales de cada triángulo hacia arriba */
  const N = g.attributes.normal; for (let i = 0; i < N.count; i++) if (N.getY(i) < 0) N.setXYZ(i, -N.getX(i), -N.getY(i), -N.getZ(i));
  malla.geometry.dispose(); malla.geometry = g; tipoV = T; varV = VR; malla.visible = P.length > 0; estQ = -1; estacion(k, fe); return true;
}
export function estacion(k, fe = 0) {
  if (!malla || !tipoV) return; const q = Math.round(((k % 4) + fe) * 8); if (q === estQ) return; estQ = q;
  const a = ((k % 4) + 4) % 4, b = (a + 1) % 4, cs = TIPOS.map(t => COL[t][a].map((x, i) => x + (COL[t][b][i] - x) * fe)), A = malla.geometry.attributes.color;
  for (let i = 0; i < tipoV.length; i++) { const c = cs[tipoV[i]], v = varV[i]; A.setXYZ(i, c[0] * v, c[1] * v, c[2] * v); } A.needsUpdate = true;
}
/* ¿cae (x, z) dentro de un cuadro de la vega? (para no dejar árboles del bosque dentro de un campo) */
export function tapa(x, z) { for (const q of cuadros) { const dx = x - q.x, dz = z - q.z; if (Math.abs(dx * q.c + dz * q.s) < LADO / 2 + 1 && Math.abs(-dx * q.s + dz * q.c) < LADO / 2 + 1) return true; } return false; }
export function arbolesExtra() { return extra; }
