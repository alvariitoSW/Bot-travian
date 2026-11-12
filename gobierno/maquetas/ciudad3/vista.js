/* Maqueta Q1k — VISTA 3D de «fundar, colocar, crecer». Página independiente: NO toca el juego. Lee el estado de reglas.js.
   REAL (arte de 0 A.D., Wildfire Games, CC BY-SA 3.0): las casas de nivel II a IV (casa, casa_b, casa_c, casa_d), el foro, el templo,
   el mercado, el granero (almacén), el taller (aserradero), la granja, el muelle (puerto), la capilla de cruce (templo de Vesta
   reducido), el pozo de la fuente, la muralla de piedra con torres y puertas, los árboles, las texturas del suelo y del agua.
   INVENTADO por código: las reglas, el relieve y el río (los de ciudad2), las máscaras del suelo (calles, plaza, campos), el mapa
   de calor, la luz, el humo y el fuego, las chozas y tiendas de nivel I, los andamios, la empalizada, el surco y el arado, los
   mojones de las puertas, el puente y las cañas. Los tintes (toba, encalado, teja vieja) retiñen piezas reales.
   Copiado de ciudad2/ciudad.js y adaptado: carga de piezas, material con tinte por ejemplar, versiones ligeras, carteles de árbol
   y lotes (aquí con cupo fijo y contenido que cambia). Importado tal cual: ciudad2/mundo.js y de ciudad2/suelo.js el río, el cielo,
   el ruido y las nubes; js/gfx/statics.js (carga) y js/gfx/models.js (three). */
import { THREE } from '../../../js/gfx/models.js';
import { preloadStatic, getStatic } from '../../../js/gfx/statics.js';
import * as UN from '../../../js/gfx/units.js';
import { crearRio, crearCielo, texturaRuido, GLSL_NUBES } from '../ciudad2/suelo.js';
import { crearSuelo3 } from './suelo3.js';
import * as R from './reglas.js';
const { altura, RIO, NIVEL_RIO, azar, PUENTE } = R;

const PIEZAS = 'gobierno/maquetas/piezas/', ASSETS = 'assets/static/', HORIZ = '#cdc3b2';
const lienzo = document.getElementById('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92; renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;      // la sombra se calcula a petición
const scene = new THREE.Scene(); scene.background = new THREE.Color(HORIZ); scene.fog = new THREE.FogExp2(HORIZ, 0.00029);
const U = { uRuido: { value: null }, uTiempo: { value: 0 } };

/* ---------- carga (copiado de ciudad2) ---------- */
const esperas = [], texs = new Map();
const EN_PIEZAS = new Set(['structural_ao_rome_house_b.webp', 'structural_ao_rome_house_c.webp', 'structural_ao_rome_house_d.webp', 'props_wrld_well_a_1.webp', 'props_wrld_wood_2.webp', 'props_celt_prop_1.webp', 'props_wrld_hay_a.webp']);      // texturas que solo están en piezas/
function textura(file, datos) {
  if (texs.has(file)) return texs.get(file);
  const t = new THREE.Texture(); t.flipY = false; if (!datos) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texs.set(file, t);
  esperas.push(new Promise(ok => { const im = new Image(); let paso = 0; im.onload = () => { t.image = im; t.needsUpdate = true; ok(); }; im.onerror = () => { if (paso++ === 0) im.src = PIEZAS + file; else { console.warn('Falta la textura ' + file); ok(); } }; im.src = (EN_PIEZAS.has(file) ? PIEZAS : ASSETS) + file; }));
  return t;
}
let indiceP = {}; const piezasP = new Map();
async function cargarPiezas() {
  try { const r = await fetch(PIEZAS + 'static.json'); indiceP = r.ok ? await r.json() : {}; } catch (e) { indiceP = {}; }
  await Promise.all(['casa_b', 'casa_c', 'casa_d', 'prop_pozo', 'prop_paja'].filter(k => indiceP[k]).map(async key => { const u = indiceP[key], buf = await fetch(PIEZAS + key + '.bin').then(r => r.arrayBuffer()), n = u.verts;
    const P = new Float32Array(buf, u.off[0], n * 3), N = new Int8Array(buf, u.off[1], n * 3), UV = new Float32Array(buf, u.off[2], n * 2), UV1 = u.off[3] !== undefined ? new Float32Array(buf, u.off[3], n * 2) : null;
    const parts = u.groups.map(g => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P.subarray(g.start * 3, (g.start + g.count) * 3), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N.subarray(g.start * 3, (g.start + g.count) * 3), 3, true)); geo.setAttribute('uv', new THREE.BufferAttribute(UV.subarray(g.start * 2, (g.start + g.count) * 2), 2)); if (UV1 && g.aoFile) geo.setAttribute('uv1', new THREE.BufferAttribute(UV1.subarray(g.start * 2, (g.start + g.count) * 2), 2)); geo.computeBoundingSphere(); return { geo, file: g.file, mode: g.mode, maps: { ao: UV1 && g.aoFile } }; });
    piezasP.set(key, { key, parts, bb: u.bb }); }));
}
const pieza = k => piezasP.get(k) || getStatic(k);

/* ---------- material de edificio (copiado de ciudad2, piel romana): Lambert + AO + tinte de muro y teja por ejemplar ---------- */
const PIEL = { equipo: '#6d4a38', desat: 0.28, tejaSat: 0.56, base: 0.62 };
const mats = new Map();
function material(p, o = {}) {
  const id = [p.file, p.mode, p.maps.ao || '', o.arbol ? 'a' : '', o.sinTeja ? 's' : '', p.alfa || ''].join('|'); if (mats.has(id)) return mats.get(id);
  const m = new THREE.MeshLambertMaterial({ map: p.tex || textura(p.file), side: p.lado !== undefined ? p.lado : THREE.DoubleSide, alphaTest: p.mode === 2 ? (p.alfa || 0.45) : 0 });
  if (p.maps.ao) { m.aoMap = textura(p.maps.ao, true); m.aoMap.channel = 1; m.aoMapIntensity = 1.0; }
  const equipo = new THREE.Color(PIEL.equipo);
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uEquipo: { value: equipo }, uRuido: U.uRuido, uTiempo: U.uTiempo });
    sh.vertexShader = 'attribute vec3 aMuro; attribute vec4 aTeja; varying vec3 vMuro; varying vec4 vTeja; varying float vAlt, vUp; varying vec3 vWP;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vMuro = aMuro; vTeja = aTeja; vAlt = position.y; vUp = abs(normalize(mat3(instanceMatrix) * normal).y);')
      .replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform vec3 uEquipo; varying vec3 vMuro; varying vec4 vTeja; varying float vAlt, vUp; varying vec3 vWP;\n${GLSL_NUBES}\n` + sh.fragmentShader.replace('#include <map_fragment>', `
      vec4 tx = texture2D(map, vMapUv);
      ${p.mode === 1 ? 'tx.rgb = mix(uEquipo, tx.rgb, tx.a);' : p.mode === 2 ? 'diffuseColor.a *= tx.a;' : ''}
      float lum = dot(tx.rgb, vec3(0.3, 0.59, 0.11));
      ${o.arbol ? 'vec3 c = mix(vec3(lum), tx.rgb, 0.62) * vMuro;' : `
      float rojo = smoothstep(0.05, 0.16, tx.r - tx.g * 1.12);
      float teja = ${o.sinTeja ? '0.0' : 'rojo * smoothstep(0.12, 0.3, vUp)'};
      vec3 muro = mix(tx.rgb, vec3(lum), ${PIEL.desat.toFixed(2)});
      muro = mix(muro, vec3(0.30 + 0.62 * pow(lum, 0.7)), vTeja.a * (1.0 - rojo)) * vMuro;
      vec3 tj = mix(vec3(lum), tx.rgb, ${PIEL.tejaSat.toFixed(2)}) * vTeja.rgb;
      vec3 c = mix(muro, tj, teja);
      c *= mix(${PIEL.base.toFixed(2)}, 1.0, max(teja, smoothstep(-0.5, 5.5, vAlt + (lum - 0.5) * 2.0)));`}
      diffuseColor.rgb *= c * nubes(vWP);`)
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n #ifdef USE_AOMAP\n reflectedLight.directDiffuse *= mix(1.0, ambientOcclusion, 0.55);\n #endif');
  };
  m.customProgramCacheKey = () => 'q1k|' + id;
  if (p.mode === 2) { m.userData.prof = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: m.map, alphaTest: 0.45, side: THREE.DoubleSide }); }
  mats.set(id, m); return m;
}
/* versión ligera de una pieza (copiado de ciudad2): quita los trozos sueltos pequeños y, si se pide, los triángulos diminutos */
const ligeras = new Map();
function ligera(clave, diagMin, areaFrac = 0) {
  const id = clave + '|' + diagMin + '|' + areaFrac; if (ligeras.has(id)) return ligeras.get(id);
  const st = pieza(clave), par = [], idv = new Map(), tri = [], f = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  st.parts.forEach((p, pi) => { const A = p.geo.attributes.position.array; for (let i = 0; i + 8 < A.length; i += 9) { const v = [0, 3, 6].map(k => { const key = Math.round(A[i + k] * 50) + ',' + Math.round(A[i + k + 1] * 50) + ',' + Math.round(A[i + k + 2] * 50); let n = idv.get(key); if (n === undefined) { n = par.length; par.push(n); idv.set(key, n); } return n; }); par[f(v[1])] = f(v[0]); par[f(v[2])] = f(v[0]);
    const ax = A[i + 3] - A[i], ay = A[i + 4] - A[i + 1], az = A[i + 5] - A[i + 2], bx = A[i + 6] - A[i], by = A[i + 7] - A[i + 1], bz = A[i + 8] - A[i + 2]; tri.push({ pi, i: i / 3, v: v[0], area: Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx) }); } });
  const caja = new Map(); for (const t of tri) { const c = f(t.v), A = st.parts[t.pi].geo.attributes.position.array; let b = caja.get(c); if (!b) caja.set(c, b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]); for (let k = t.i * 3; k < t.i * 3 + 9; k += 3) for (let d = 0; d < 3; d++) { b[d] = Math.min(b[d], A[k + d]); b[d + 3] = Math.max(b[d + 3], A[k + d]); } }
  let vivos = tri.filter(t => { const b = caja.get(f(t.v)); return Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]) >= diagMin; });
  if (areaFrac) { const tot = vivos.reduce((s, t) => s + t.area, 0), ord = vivos.slice().sort((a, b) => a.area - b.area), fuera = new Set(); let s = 0; for (const t of ord) { s += t.area; if (s > tot * areaFrac) break; fuera.add(t); } vivos = vivos.filter(t => !fuera.has(t)); }
  const parts = st.parts.map((p, pi) => { const keep = vivos.filter(t => t.pi === pi); if (!keep.length) return null; const geo = new THREE.BufferGeometry(); for (const nombre in p.geo.attributes) { const a = p.geo.attributes[nombre], is = a.itemSize, arr = new a.array.constructor(keep.length * 3 * is); keep.forEach((t, k) => arr.set(a.array.subarray(t.i * is, (t.i + 3) * is), k * 3 * is)); geo.setAttribute(nombre, new THREE.BufferAttribute(arr, is, a.normalized)); } return { ...p, geo }; }).filter(Boolean);
  const r = { key: clave, parts, bb: st.bb }; ligeras.set(id, r); return r;
}
/* cartel de un árbol (copiado de ciudad2): su perfil horneado en una textura pequeña, sobre dos planos cruzados */
const hornos = [];
function cartel(clave) {
  const st = pieza(clave), b = st.bb, w = Math.max(b[3] - b[0], b[5] - b[2]), cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2, h = b[4] - b[1], AN = 128, AL = Math.min(512, Math.max(64, Math.round(AN * h / w / 16) * 16));
  const rt = new THREE.WebGLRenderTarget(AN, AL, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  hornos.push(() => { const esc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 300); cam.position.set(cx, (b[1] + b[4]) / 2, cz + 100); cam.lookAt(cx, (b[1] + b[4]) / 2, cz);
    for (const p of st.parts) esc.add(new THREE.Mesh(p.geo, new THREE.MeshBasicMaterial({ map: textura(p.file), alphaTest: p.mode === 2 ? 0.45 : 0, side: THREE.DoubleSide })));
    const ca = new THREE.Color(), al = renderer.getClearAlpha(); renderer.getClearColor(ca); renderer.setRenderTarget(rt); renderer.setClearColor('#1c2410', 0); renderer.clear(); renderer.render(esc, cam);
    const px = new Uint8Array(AN * AL * 4), med = [0, 0, 0]; let np = 0; renderer.readRenderTargetPixels(rt, 0, 0, AN, AL, px); for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 128) { med[0] += px[i]; med[1] += px[i + 1]; med[2] += px[i + 2]; np++; }
    if (np) { renderer.setClearColor(new THREE.Color(med[0] / np / 255, med[1] / np / 255, med[2] / np / 255), 0); renderer.clear(); renderer.render(esc, cam); }
    renderer.setRenderTarget(null); renderer.setClearColor(ca, al); });
  const geo = new THREE.BufferGeometry(), P = [], UV = [], N = [];
  for (const [dx, dz] of [[1, 0], [0, 1]]) for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1], [1, 0], [-1, 0], [1, 1], [1, 1], [-1, 0], [-1, 1]]) { P.push(cx + dx * u * w / 2, b[1] + v * h, cz + dz * u * w / 2); UV.push(u * 0.5 + 0.5, v); N.push(0, 1, 0); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  return { key: clave, parts: [{ geo, tex: rt.texture, file: 'cartel_' + clave, mode: 2, maps: {}, alfa: 0.3, lado: THREE.FrontSide }], bb: st.bb };
}
/* lote (adaptado de ciudad2): cupo fijo de ejemplares de una pieza; poner() cambia el contenido; repartir() deja en cada nivel de
   detalle solo los que se ven con la cámara del momento */
const lotes = [];
class Lote {
  constructor(clave, niveles, cupo, o) {
    const b = niveles[0].bb; this.rb = 0.5 * Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]); this.cy = (b[1] + b[4]) / 2; this.clave = clave; this.cortes = o.cortes || []; this.cupo = cupo; this.n = 0;
    this.M = new Float32Array(cupo * 16); this.aM = new Float32Array(cupo * 3); this.aT = new Float32Array(cupo * 4); this.E = new Float32Array(cupo * 4);
    this.niv = niveles.map(st => { const iM = new THREE.InstancedBufferAttribute(new Float32Array(cupo * 16), 16), iA = new THREE.InstancedBufferAttribute(new Float32Array(cupo * 3), 3), iT = new THREE.InstancedBufferAttribute(new Float32Array(cupo * 4), 4); for (const a of [iM, iA, iT]) a.setUsage(THREE.DynamicDrawUsage);
      const mallas = st.parts.map(p => { const geo = p.geo.clone(); geo.setAttribute('aMuro', iA); geo.setAttribute('aTeja', iT); const mat = material(p, o), im = new THREE.InstancedMesh(geo, mat, cupo); im.count = 0; im.instanceMatrix = iM; im.frustumCulled = false; im.castShadow = o.sombra !== false && !p.tex; im.receiveShadow = true; if (mat.userData.prof) im.customDepthMaterial = mat.userData.prof; (o.escena || scene).add(im); return im; });
      return { iM, iA, iT, mallas, n: 0 }; });
    if (!o.escena) lotes.push(this);
  }
  poner(lista) { const n = this.n = Math.min(lista.length, this.cupo); for (let i = 0; i < n; i++) { const e = lista[i]; e.m.toArray(this.M, i * 16); this.aM.set(e.muro || [1, 1, 1], i * 3); this.aT.set(e.teja || [1, 1, 1, 0], i * 4); const s = e.m.getMaxScaleOnAxis(), el = e.m.elements; this.E.set([el[12], el[13] + this.cy * s, el[14], this.rb * s], i * 4); } }
  repartir(fr, cam, kf, todo) {
    const E = this.E, P = fr.planes, nv = this.niv, c0 = this.cortes[0] || 0, c1 = this.cortes[1] || 0, ult = nv.length - 1, M = this.M, aM = this.aM, aT = this.aT; for (const v of nv) v.n = 0;
    for (let i = 0; i < this.n; i++) { const x = E[i * 4], y = E[i * 4 + 1], z = E[i * 4 + 2], r = E[i * 4 + 3]; let k = 0;
      if (todo) { if (Math.abs(x) > 640 || Math.abs(z + 70) > 640) continue; if (this.cortes.length > 1) k = 1; /* pase de sombra: solo lo que cae en el mapa, y casas y muralla en su versión ligera */ } else { let fuera = false; for (let j = 0; j < 6; j++) { const pl = P[j]; if (pl.normal.x * x + pl.normal.y * y + pl.normal.z * z + pl.constant < -r) { fuera = true; break; } } if (fuera) continue;
        const s = r * kf / Math.max(1, Math.hypot(x - cam.x, y - cam.y, z - cam.z)); k = s >= c0 ? 0 : s >= c1 ? Math.min(1, ult) : ult; }
      const v = nv[k], j = v.n++, dM = v.iM.array, dA = v.iA.array, dT = v.iT.array; for (let q = 0; q < 16; q++) dM[j * 16 + q] = M[i * 16 + q]; for (let q = 0; q < 3; q++) dA[j * 3 + q] = aM[i * 3 + q]; for (let q = 0; q < 4; q++) dT[j * 4 + q] = aT[i * 4 + q]; }
    for (const v of nv) { for (const m of v.mallas) m.count = v.n; if (v.n) for (const a of [v.iM, v.iA, v.iT]) { a.clearUpdateRanges(); a.addUpdateRange(0, v.n * a.itemSize); a.needsUpdate = true; } }
  }
}
const tris1 = k => { const st = pieza(k); return st ? st.parts.reduce((s, p) => s + p.geo.attributes.position.count / 3, 0) : 0; };
function lote(clave, cupo, o = {}) { const st = pieza(clave); if (!st) { console.warn('Falta la pieza ' + clave); return { poner() {}, n: 0 }; }
  const niveles = [st, ...(o.ligeras || []).map(a => ligera(clave, a[0], a[1]))]; if (o.cartel) niveles.push(cartel(clave)); return new Lote(clave, niveles, cupo, o); }
const _q = new THREE.Quaternion(), _e = new THREE.Euler();
const matriz = (x, y, z, giro, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(0, giro, 0)), new THREE.Vector3(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz));
const suelo = (x, z, r = 6) => Math.min(altura(x, z), altura(x + r, z), altura(x - r, z), altura(x, z + r), altura(x, z - r));
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function tinte(a, b) {                                   // muro y teja de cada casa (el romano de ciudad2). a: 0 toba … 1 encalado
  const v = 0.9 + 0.2 * ((a * 7.13) % 1), muro = a < 0.45 ? lerp3([0.80, 0.70, 0.58], [0.92, 0.80, 0.64], a / 0.45) : a < 0.75 ? [0.96, 0.84, 0.62] : [0.98, 0.95, 0.88], cal = a < 0.45 ? 0.1 : a < 0.75 ? 0.35 : 0.8;
  const teja = b < 0.4 ? [1.12, 0.98, 0.9] : b < 0.78 ? [0.98, 0.9, 0.84] : [0.76, 0.7, 0.66]; return { muro: muro.map(x => x * v), teja: [...teja, cal] };
}

/* ---------- bultos por código: cajas y conos de un color, en una malla (copiado de ciudad2) ---------- */
class Bulto { constructor() { this.p = []; this.n = []; this.c = []; }
  add(geo, col, m) { const g = geo.index ? geo.toNonIndexed() : geo; if (m) g.applyMatrix4(m); const P = g.attributes.position, N = g.attributes.normal, c = new THREE.Color(col); for (let i = 0; i < P.count; i++) { this.p.push(P.getX(i), P.getY(i), P.getZ(i)); this.n.push(N.getX(i), N.getY(i), N.getZ(i)); this.c.push(c.r, c.g, c.b); } }
  caja(w, h, d, x, y, z, col, giro = 0, rx = 0, rz = 0) { this.add(new THREE.BoxGeometry(w, h, d), col, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(rx, giro, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); }
  cono(r, h, seg, x, y, z, col, sy = 1, giro = 0, sx = 1, sz = 1) { this.add(new THREE.ConeGeometry(r, h, seg), col, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(0, giro, 0)), new THREE.Vector3(sx, sy, sz))); }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); return g; } }
const matBulto = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });

/* ---------- cámara: gira alrededor de un punto del suelo ---------- */
export const cam = { tx: 110, tz: -150, d: 640, az: 0, el: 0 };
const camara = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 2, 20000);
export function ponerCamara() {
  cam.d = Math.max(120, Math.min(1050, cam.d)); cam.tx = Math.max(-430, Math.min(430, cam.tx)); cam.tz = Math.max(-440, Math.min(400, cam.tz));
  const k = Math.min(1, Math.max(0, (cam.d - 120) / 700)); cam.el = cam.elF || (21 + 13 * k * (2 - k)) * Math.PI / 180;
  const ty = altura(cam.tx, cam.tz); camara.position.set(cam.tx + Math.sin(cam.az) * Math.cos(cam.el) * cam.d, ty + Math.sin(cam.el) * cam.d, cam.tz + Math.cos(cam.az) * Math.cos(cam.el) * cam.d); camara.lookAt(cam.tx, ty, cam.tz);
  camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); camara.updateMatrixWorld();
}
const _ray = new THREE.Raycaster(), _v2 = new THREE.Vector2(), _v3 = new THREE.Vector3();
/* punto del suelo bajo un punto de la pantalla (marcha por el rayo hasta cruzar el relieve) */
export function sueloEn(px, py) { _v2.set(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1); _ray.setFromCamera(_v2, camara); const o = _ray.ray.origin, d = _ray.ray.direction; if (d.y > -0.02) return null;
  let t0 = 0, t1 = 0; for (let t = 20; t < 6000; t += 12) { const y = o.y + d.y * t; if (y < altura(o.x + d.x * t, o.z + d.z * t)) { t1 = t; t0 = t - 12; break; } if (y < -20) return null; } if (!t1) return null;
  for (let i = 0; i < 8; i++) { const t = (t0 + t1) / 2; if (o.y + d.y * t < altura(o.x + d.x * t, o.z + d.z * t)) t1 = t; else t0 = t; } return [o.x + d.x * t1, o.z + d.z * t1]; }
export function aPantalla(x, z, dy = 0) { _v3.set(x, altura(x, z) + dy, z).project(camara); return { x: (_v3.x + 1) / 2 * innerWidth, y: (1 - _v3.y) / 2 * innerHeight, ok: _v3.z < 1 && Math.abs(_v3.x) < 1.1 && Math.abs(_v3.y) < 1.1 }; }

/* ---------- luz: el sol bajo de ciudad2, con un solo mapa de sombras para todo el terreno jugable ---------- */
const SOL = new THREE.Vector3(-0.84, 0.49, 0.26).normalize();
const sol = new THREE.DirectionalLight('#ffdfb4', 3.3), hemi = new THREE.HemisphereLight('#b6c6de', '#927252', 1.45);
function ponerLuz() { const RS = 600; sol.position.set(0, 0, -70).addScaledVector(SOL, 1500); sol.target.position.set(0, 0, -70); sol.castShadow = true; const s = sol.shadow; s.mapSize.set(2048, 2048); s.camera.left = -RS; s.camera.right = RS; s.camera.top = RS; s.camera.bottom = -RS; s.camera.near = 500; s.camera.far = 2600; s.bias = -0.0006; s.normalBias = 0.5; s.radius = 2.2; s.camera.updateProjectionMatrix(); scene.add(sol, sol.target, hemi); }

/* ---------- piezas del juego ---------- */
/* tipo -> [pieza, escala, giro de fachada, hundido] */
const PZ = { foro: ['foro', 0.78, 0, 0.2], fuente: ['prop_pozo', 2.2, 0, 0.1], granero: ['almacen', 1.35, 0, 0.3], granja: ['granja', 1.0, 0, 0.3], templo: ['templo', 0.86, 0, 1.2], mercado: ['mercado', 0.82, 0, 0.2], taller: ['aserradero', 1.25, 0, 0.2], muelle: ['puerto', 0.85, 0, 0], compitum: ['vesta', 0.5, 0, 0.6] };
const PIEL_U = { muro: [0.93, 0.86, 0.76], teja: [0.86, 0.8, 0.76, 0.15] };
const L = {}, G = {};                 // lotes y mallas sueltas
let pinM, sueloJ, rio, crecida, humoM, dinM, estM, anilloM, surcoM, gromaM, aradoM, chozaM, tiendaM;
let E = null, revVista = -1, fantasma = null, sombraPend = true, animHasta = 0, surcoT0 = -1, esperaSurco = 0, nTalados = -1;
const tNace = new Map(), firma = new Map();
const ahora = () => performance.now() / 1000;

export async function montar() {
  const claves = ['casa', 'almacen', 'aserradero', 'mercado', 'foro', 'vesta', 'templo', 'granja', 'puerto', 'muro', 'torre', 'puerta', 'cipres', 'olivo', 'pino', 'algarrobo'];
  await Promise.all([preloadStatic(claves), cargarPiezas(), UN.preload(['ciudadana'])]);
  const T = {}; for (const k of ['terr_grass', 'terr_dry', 'terr_dirt', 'terr_paving']) T[k] = textura(k + '.webp'); T.water_norm = textura('water_norm.webp', true);
  U.uRuido.value = texturaRuido(); ponerCamara(); ponerLuz(); scene.add(crearCielo(SOL, HORIZ, U));
  G.T = T;
  /* casas: cuatro piezas reales, con versiones ligeras de lejos */
  for (const k of ['casa', 'casa_b', 'casa_c', 'casa_d']) L[k] = lote(k, 220, { ligeras: [[3, 0], [6, 0]], cortes: [0.09, 0.05] });
  for (const t in PZ) { const k = PZ[t][0]; if (!L[k]) L[k] = lote(k, t === 'fuente' ? 24 : 12, tris1(k) > 4000 ? { ligeras: [[0, 0.012]], cortes: [0.12], sinTeja: t === 'fuente' } : { sinTeja: t === 'fuente' }); }
  L.muro = lote('muro', 48, { sinTeja: true, ligeras: [[3, 0], [4, 0]], cortes: [0.11, 0.06] }); L.torre = lote('torre', 40, { sinTeja: true, ligeras: [[3, 0], [4, 0]], cortes: [0.11, 0.06] }); L.puerta = lote('puerta', 10, { sinTeja: true, ligeras: [[3, 0], [4, 0]], cortes: [0.11, 0.06] });
  L.arbol = {}; for (const k of ['cipres', 'olivo', 'pino', 'algarrobo']) L.arbol[k] = lote(k, 3200, { arbol: true, cartel: true, cortes: [0.05] });
  /* chozas y tiendas de nivel I (por código) */
  { /* choza: cabaña oval de adobe con techo de paja (texturas reales de 0 A.D.: paja y tierra); tienda: lona por código */
    const une = (gs) => { const g = new THREE.BufferGeometry(); for (const n of ['position', 'normal', 'uv', 'color']) { const is = n === 'uv' ? 2 : 3, a = new Float32Array(gs.reduce((t, x) => t + x.attributes[n].count * is, 0)); let o = 0; for (const x of gs) { a.set(x.attributes[n].array, o); o += x.attributes[n].count * is; } g.setAttribute(n, new THREE.BufferAttribute(a, is)); } return g; };
    const col = (g, v, ku = 1, kv = 1) => { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, c = new Float32Array(n * 3).fill(v); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); const uv = g.attributes.uv; for (let i = 0; i < n; i++) uv.setXY(i, uv.getX(i) * ku, uv.getY(i) * kv); return g; };
    const muro = une([col(new THREE.CylinderGeometry(3.5, 3.75, 4.6, 12, 1, true).translate(0, 1.1, 0).scale(1.25, 1, 1), 1, 3, 1), col(new THREE.BoxGeometry(1.5, 2.7, 0.5).translate(0.4, 1.35, 3.62), 0.22)]);
    const techo = col(new THREE.ConeGeometry(5.2, 4.9, 12, 1, true).translate(0, 5.45, 0).scale(1.25, 1, 1), 1, 5, 2.2);
    const mMuro = new THREE.MeshLambertMaterial({ map: textura('terr_dirt.webp'), color: '#e2c8a0', vertexColors: true, side: THREE.DoubleSide }), mTecho = new THREE.MeshLambertMaterial({ map: textura('props_wrld_hay_a.webp'), color: '#c2aa76', vertexColors: true, side: THREE.DoubleSide });
    chozaM = [new THREE.InstancedMesh(muro, mMuro, 220), new THREE.InstancedMesh(techo, mTecho, 220)];
    const t = new Bulto(); t.cono(5.2, 4.6, 4, 0, 2.3, 0, '#d8ccb0', 1, Math.PI / 4, 1.15, 0.8); t.caja(0.25, 5.6, 0.25, 0, 2.8, 0, '#5a4632'); t.caja(1.6, 0.7, 1.2, 4.6, 0.35, 1.5, '#8a6a48');
    tiendaM = new THREE.InstancedMesh(t.geo(), matBulto, 40); for (const m of [...chozaM, tiendaM]) { m.count = 0; m.castShadow = m.receiveShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); } }
  L.paja = lote('prop_paja', 90, { sinTeja: true });
}
/* el terreno de una partida: suelo, río, bosque, puente */
export function mundo(estado) {
  E = estado; revVista = -1; if (gente) { gente.l = []; gente.im.count = 0; } tNace.clear(); firma.clear(); fantasma = null; surcoT0 = -1; esperaSurco = 0; nTalados = -1;
  for (const m of [sueloJ && sueloJ.malla, rio, crecida, estM, dinM, humoM, surcoM, aradoM]) if (m) { scene.remove(m); if (m.geometry) m.geometry.dispose(); }
  dinM = humoM = surcoM = aradoM = null;
  sueloJ = crearSuelo3(G.T, U, E.bosquetes); scene.add(sueloJ.malla); rio = crearRio(G.T, U); scene.add(rio);
  /* lámina de la crecida: una cinta más ancha que el río, escondida bajo el cauce hasta que toca */
  { const n = RIO.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = []; let sl = 0; for (let i = 0; i < n; i++) { const a = RIO[Math.max(0, i - 1)], b = RIO[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l, w = 124; if (i) sl += Math.hypot(RIO[i][0] - RIO[i - 1][0], RIO[i][1] - RIO[i - 1][1]); pos.set([RIO[i][0] + nx * w, 0, RIO[i][1] + nz * w, RIO[i][0] - nx * w, 0, RIO[i][1] - nz * w], i * 6); uv.set([0, sl / 60, 2.5, sl / 60], i * 4); if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const mc = rio.material.clone(); mc.color.set('#78847e'); mc.opacity = 0.92; mc.onBeforeCompile = rio.material.onBeforeCompile; crecida = new THREE.Mesh(g, mc); crecida.receiveShadow = true; crecida.visible = false; crecida.position.y = NIVEL_RIO; scene.add(crecida); }
  /* fijo: puente de madera y cañas (de ciudad2) */
  { const B = new Bulto(), rnd = azar(99), Rr = (a, b) => a + (b - a) * rnd(), P = PUENTE, c = Math.cos(P.ang), s = Math.sin(P.ang), Lp = 84, y = NIVEL_RIO + 4.2; B.caja(Lp, 0.5, 8.4, P.x, y, P.z, '#6e5a44', -P.ang);
    for (const l of [-4, 4]) B.caja(Lp, 0.22, 0.22, P.x - s * l, y + 1.5, P.z + c * l, '#5c4a38', -P.ang);
    for (let u = -Lp / 2 + 3; u <= Lp / 2 - 3; u += 7) for (const l of [-3.6, 3.6]) { const x = P.x + c * u - s * l, z = P.z + s * u + c * l; B.caja(0.5, 8.5, 0.5, x, y - 3.4, z, '#4e4032', -P.ang); B.caja(0.22, 1.6, 0.22, x - s * Math.sign(l) * 0.4, y + 0.8, z + c * Math.sign(l) * 0.4, '#5c4a38', -P.ang); }
    for (let i = 0; i < RIO.length - 1; i++) { const p = RIO[i], q = RIO[i + 1]; if (Math.abs(p[0]) > 900) continue; const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      for (const l of [1, -1]) for (let k = 0; k < 3; k++) { if (rnd() < 0.45) continue; const r = Rr(17, 27), x = p[0] - Math.sin(ang) * r * l + Rr(-5, 5), z = p[1] + Math.cos(ang) * r * l + Rr(-5, 5), yy = altura(x, z); if (yy > NIVEL_RIO + 2.5 || yy < NIVEL_RIO - 1.2) continue; for (let j = 0; j < 4; j++) B.cono(Rr(0.5, 0.9), Rr(3, 5), 4, x + Rr(-1.6, 1.6), Math.max(yy, NIVEL_RIO) + 1.8, z + Rr(-1.6, 1.6), rnd() < 0.5 ? '#7c8448' : '#9a9050', 1, Rr(0, 3)); } }
    estM = new THREE.Mesh(B.geo(), matBulto); estM.castShadow = estM.receiveShadow = true; scene.add(estM); }
  /* anillo de alcance y groma */
  if (!anilloM) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(97 * 6), 3)); const ix = []; for (let i = 0; i < 96; i++) ix.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); g.setIndex(ix);
    anilloM = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#fff4d0', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, fog: false })); anilloM.frustumCulled = false; anilloM.visible = false; anilloM.renderOrder = 3; scene.add(anilloM);
    const b = new Bulto(); b.caja(0.5, 13, 0.5, 0, 6.5, 0, '#6a4a2c'); b.caja(9, 0.45, 0.45, 0, 12.6, 0, '#8a6a3c'); b.caja(0.45, 0.45, 9, 0, 12.6, 0, '#8a6a3c'); for (const [u, v] of [[4.3, 0], [-4.3, 0], [0, 4.3], [0, -4.3]]) b.caja(0.12, 3.4, 0.12, u, 10.9, v, '#d8c890'); b.cono(1, 2, 6, 0, 14, 0, '#c9a13c');
    gromaM = new THREE.Mesh(b.geo(), matBulto); gromaM.visible = false; scene.add(gromaM);
    const pg = new THREE.ConeGeometry(2.6, 6, 4).rotateX(Math.PI).translate(0, 3, 0); pinM = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false })); pinM.visible = false; pinM.renderOrder = 4; scene.add(pinM); }
  sombraPend = true; sincronizar(true);
}

/* ---------- anillo en el suelo (alcance de un edificio, o tamaño de la ciudad al fundar) ---------- */
function anillo(x, z, r, color, ancho = 1.6) { if (!r) { anilloM.visible = false; return; } const P = anilloM.geometry.attributes.position;
  for (let i = 0; i <= 96; i++) { const t = i / 96 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), a = [x + c * (r - ancho), z + s * (r - ancho)], b = [x + c * (r + ancho), z + s * (r + ancho)]; P.setXYZ(i * 2, a[0], Math.max(altura(a[0], a[1]), NIVEL_RIO) + 0.9, a[1]); P.setXYZ(i * 2 + 1, b[0], Math.max(altura(b[0], b[1]), NIVEL_RIO) + 0.9, b[1]); }
  P.needsUpdate = true; anilloM.material.color.set(color); anilloM.visible = true; }
const COLOR = { verde: '#9be07a', ocre: '#f2c45a', rojo: '#f07a5a', nada: '#f07a5a' }, TINTE_F = { verde: [0.75, 1.35, 0.7], ocre: [1.4, 1.15, 0.6], rojo: [1.6, 0.55, 0.45], nada: [1.6, 0.55, 0.45] };
export function calor(notas) { sueloJ.calor(notas); }
export function ponerGroma(g) { if (!g) { gromaM.visible = false; if (!fantasma) anillo(0, 0, 0); return; } gromaM.visible = true; gromaM.position.set(g.x, altura(g.x, g.z), g.z); gromaM.scale.setScalar(Math.max(1, cam.d / 260)); anillo(g.x, g.z, 150, COLOR[g.color], 1.4); }
export function ponerFantasma(f) { fantasma = f; pinM.visible = !!f; if (f) { const d = PZ[f.id], st = pieza(d[0]); pinM.position.set(f.x, altura(f.x, f.z) + (st ? st.bb[4] * d[1] : 8) + 3, f.z); pinM.material.color.set(COLOR[f.color]); pinM.scale.setScalar(Math.max(1, cam.d / 330)); }
  if (!f) anillo(0, 0, 0); else anillo(f.x, f.z, f.radio || Math.max(R.EDIF[f.id].w, R.EDIF[f.id].d) * 0.75, COLOR[f.color], f.radio ? 1.6 : 0.9); edificios(); pedirReparto = true; }

/* ---------- lo que cambia: casas, edificios, muralla, obras, humo ---------- */
const _c = new THREE.Color();
const facil = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);
function casas(t) {
  const por = { casa: [], casa_b: [], casa_c: [], casa_d: [] }; let nc = 0, nt = 0, anim = false;
  for (const l of E.parcelas) { const c = l.casa; if (!c || l.fuera) continue;
    const fm = c.nivel + '|' + (c.ruina ? 1 : 0); if (firma.get(l.id) !== fm) { firma.set(l.id, fm); tNace.set(l.id, Math.max(t, esperaSurco) + (E.mesN === 0 ? 0.3 + (l.id % 20) * 0.09 : (l.id % 7) * 0.06)); }
    const u = (t - tNace.get(l.id)) / 0.9, f = facil(u); if (u < 1) anim = true; const giro = -l.ang + (l.lado > 0 ? Math.PI : 0), sy = 0.12 + 0.88 * f, sx = u < 0 ? 0.001 : 0.8 + 0.2 * f;
    if (c.ruina) { const k = ['casa_d', 'casa_c'][l.id % 2]; por[k].push({ m: matriz(l.x, suelo(l.x, l.z, 5) - 0.3, l.z, giro, 0.8, 0.26, 0.8), muro: c.arde ? [0.26, 0.22, 0.2] : [0.5, 0.45, 0.38], teja: [0.4, 0.36, 0.34, 0] }); continue; }
    if (c.nivel === 1) { const tienda = c.desde === 0 && E.mesN < 8, i = tienda ? nt++ : nc++, e = tienda ? 0.82 + 0.3 * l.tono : 0.8 + 0.2 * l.tono; if (i < (tienda ? 40 : 220)) { const mm = matriz(l.x, suelo(l.x, l.z, 4) - 0.05, l.z, giro + (tienda ? l.tipo * 3 : Math.PI / 2 + (l.tipo - 0.5) * 0.5), e * sx, e * sy, e * sx), cc = _c.setScalar(0.8 + 0.34 * l.teja); for (const m of tienda ? [tiendaM] : chozaM) { m.setMatrixAt(i, mm); m.setColorAt(i, cc); } } continue; }
    const k = c.nivel === 2 ? (l.tipo < 0.5 ? 'casa_c' : 'casa_d') : c.nivel === 3 ? ['casa_b', 'casa_c', 'casa_d'][Math.floor(l.tipo * 3) % 3] : (l.tipo < 0.55 ? 'casa' : 'casa_b');
    const e = c.nivel === 2 ? 0.64 : c.nivel === 3 ? 0.84 : 0.97, alto = c.nivel === 4 ? 1.3 : c.nivel === 3 ? 1 : 0.9, tn = c.nivel === 2 ? l.tono * 0.42 : c.nivel === 3 ? 0.3 + l.tono * 0.45 : 0.62 + l.tono * 0.38, tj = c.nivel === 2 ? 0.6 + l.teja * 0.4 : c.nivel === 4 ? l.teja * 0.6 : l.teja;
    por[k].push({ m: matriz(l.x, suelo(l.x, l.z, 6 * e) - 0.25, l.z, giro, e * sx, e * alto * sy, e * sx), ...tinte(tn, tj) }); }
  for (const k in por) L[k].poner(por[k]);
  tiendaM.count = nt; for (const m of [...chozaM, tiendaM]) { if (m !== tiendaM) m.count = nc; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  return anim;
}
function edificios() {
  const por = {}; for (const t in PZ) por[PZ[t][0]] = [];
  const pon = (tipo, x, z, ang, sy, piel, dy = 0) => { const d = PZ[tipo], y = tipo === 'muelle' ? NIVEL_RIO + 1.4 : suelo(x, z, tipo === 'fuente' || tipo === 'compitum' ? 2 : 7) - d[3]; por[d[0]].push({ m: matriz(x, y + dy, z, Math.PI / 2 - ang + d[2], d[1], d[1] * sy, d[1]), ...piel }); };
  if (E.foro && ahora() >= esperaSurco) { const f = E.foro; pon('foro', f.x - Math.cos(f.ang) * 8, f.z - Math.sin(f.ang) * 8, f.ang, 1, PIEL_U); }
  for (const e of E.edificios) { const pr = e.obra ? 1 - e.obra / (e.total + 0.6) : 1; pon(e.tipo, e.x, e.z, e.ang, e.ruina ? 0.55 : 0.3 + 0.7 * pr, e.ruina ? { muro: [0.5, 0.45, 0.4], teja: [0.5, 0.45, 0.42, 0] } : e.obra ? { muro: [0.86, 0.82, 0.76], teja: [0.8, 0.76, 0.72, 0.3] } : PIEL_U); }
  if (fantasma) pon(fantasma.id, fantasma.x, fantasma.z, fantasma.ang, 1, { muro: TINTE_F[fantasma.color], teja: [...TINTE_F[fantasma.color], 0.5] }, 0.4);
  for (const k in por) L[k].poner(por[k]);
}
function arboles() { const n = E.arboles.reduce((s, a) => s + (a.talado ? 1 : 0), 0); if (n === nTalados) return; nTalados = n; const arb = {};
  for (const a of E.arboles) { if (a.talado) continue; const y = altura(a.x, a.z), v = 0.62 + 0.3 * a.tono, col = a.pieza === 'olivo' ? [v * 1.7, v * 1.7, v * 1.5] : a.pieza === 'cipres' ? [v * 1.5, v * 1.5, v * 1.2] : [v * 1.9, v * 1.75, v * 1.25]; (arb[a.pieza] = arb[a.pieza] || []).push({ m: matriz(a.x, y - 0.3, a.z, a.ang, a.esc, a.esc * (0.9 + 0.3 * a.tono), a.esc), muro: col }); }
  for (const k in L.arbol) L.arbol[k].poner(arb[k] || []); }
/* muralla: por el surco; primero empalizada (por código), luego tramos de piedra reales con torres; puertas donde cruzan las calles */
function muralla(B) {
  const m = E.muralla; L.muro.poner([]); L.torre.poner([]); L.puerta.poner([]); if (!E.surco) return;
  const S = E.surco, n = S.length, cerca = (x, z, r) => E.puertas.find(p => Math.hypot(p.x - x, p.z - z) < r);
  /* mojones en las puertas mientras no hay muralla de piedra */
  if (m.fase < 2) for (const p of E.puertas) for (const sg of [1, -1]) { const x = p.x + Math.cos(p.ang) * 7 * sg, z = p.z + Math.sin(p.ang) * 7 * sg, y = altura(x, z); if (m.fase === 1 || m.obra) { B.caja(1.1, 9, 1.1, x, y + 4.5, z, '#5c4630', -p.ang); if (sg > 0) B.caja(15.5, 1, 1, p.x, altura(p.x, p.z) + 8.6, p.z, '#5c4630', -p.ang); } else { B.caja(1.6, 3.4, 1.6, x, y + 1.7, z, '#b0a690', -p.ang); B.cono(1.2, 1.2, 4, x, y + 4, z, '#b0a690', 1, -p.ang + 0.785); } }
  if (!m.fase && !m.obra) return;
  const per = []; let largo = 0; for (let i = 0; i < n; i++) { const a = S[i], b = S[(i + 1) % n]; per.push(largo); largo += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  const en = s => { s = ((s % largo) + largo) % largo; let i = 0; while (i < n - 1 && per[i + 1] <= s) i++; const a = S[i], b = S[(i + 1) % n], u = (s - per[i]) / Math.hypot(b[0] - a[0], b[1] - a[1]); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0])]; };
  const hechoEmp = m.fase >= 1 ? 1 : (3 - m.obra) / 3, hechoPie = m.fase >= 2 ? 1 : m.fase === 1 && m.obra ? (3 - m.obra) / 3 : 0, rr = azar(5);
  /* piedra: tramos de 30,5 entre puertas */
  const tm = () => { const v = 0.62 + 0.18 * rr(); return { muro: [v, v * 0.94, v * 0.84], teja: [0.8, 0.76, 0.72, 0] }; }, muros = [], torres = [], puertasL = [];
  const nT = Math.round(largo / 30.5), paso = largo / nT;
  for (let i = 0; i < nT; i++) { const q = en((i + 0.5) * paso), ini = en(i * paso); if (i / nT >= hechoPie) {            // empalizada: estacas
      if (i / nT < hechoEmp) for (let s = i * paso; s < (i + 1) * paso; s += 1.7) { const e = en(s); if (cerca(e[0], e[1], 7)) continue; const h = 6.2 + rr() * 1.4; B.caja(1.5, h + 2, 1.2, e[0], altura(e[0], e[1]) + h / 2 - 1, e[1], rr() < 0.5 ? '#6b5338' : '#7a6042', -e[2]); }
      continue; }
    const pu = cerca(q[0], q[1], paso * 0.55);
    if (pu && !pu._hecha) { pu._hecha = true; puertasL.push({ m: matriz(pu.x, suelo(pu.x, pu.z, 8) - 1.2, pu.z, -pu.ang, 0.83, 0.86, 0.8), ...tm() }); torres.push({ m: matriz(ini[0], suelo(ini[0], ini[1], 4) - 1.5, ini[1], 0, 0.8, 0.72, 0.8), ...tm() }); }
    else if (!pu) { muros.push({ m: matriz(q[0], suelo(q[0], q[1], 10) - 1.5, q[1], -q[2], paso / 30.5 * 0.83, 0.86, 0.8), ...tm() }); if (i % 3 === 0) torres.push({ m: matriz(ini[0], suelo(ini[0], ini[1], 4) - 1.5, ini[1], rr() * 0.2, 0.8, 0.72, 0.8), ...tm() }); } }
  for (const p of E.puertas) delete p._hecha;
  L.muro.poner(muros); L.torre.poner(torres); L.puerta.poner(puertasL);
}
function dinamico() {
  const B = new Bulto(), rr = azar(7), pajas = [];
  muralla(B);
  for (const e of E.edificios) { const c = Math.cos(e.ang + Math.PI / 2), s = Math.sin(e.ang + Math.PI / 2), en = (u, v) => [e.x + u * c - v * s, e.z + u * s + v * c];
    if (e.obra) { const h = Math.min(16, Math.max(e.w, e.d) * 0.6) + 2; for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1]]) { const p = en(u * (e.w / 2 + 1), v * (e.d / 2 + 1)); B.caja(0.4, h + 2, 0.4, p[0], altura(p[0], p[1]) + h / 2 - 1, p[1], '#8a6c48'); }
      for (const hh of [0.38, 0.72, 1]) for (const v of [-1, 1]) { const p = en(0, v * (e.d / 2 + 1)); B.caja(e.w + 2.4, 0.3, 0.9, p[0], altura(e.x, e.z) + h * hh, p[1], '#a08458', -(e.ang + Math.PI / 2)); } for (const hh of [0.38, 0.72]) for (const u of [-1, 1]) { const p = en(u * (e.w / 2 + 1), 0); B.caja(0.3, 0.3, e.d + 2.4, p[0], altura(e.x, e.z) + h * hh, p[1], '#a08458', -(e.ang + Math.PI / 2)); }
      for (let i = 0; i < 3; i++) { const p = en((rr() - 0.5) * (e.w + 10), (e.d / 2 + 3 + rr() * 3) * -1); B.caja(2.2, 1.2, 1.4, p[0], altura(p[0], p[1]) + 0.6, p[1], ['#b0a48c', '#9a8e78', '#8a6c48'][i], rr() * 3); } }
    if (e.tipo === 'granja' && !e.obra && e.campo) { for (let i = 0; i < 4; i++) { const a = e.campo[i], b = e.campo[(i + 1) % 4], Lg = Math.hypot(b[0] - a[0], b[1] - a[1]), nn = Math.round(Lg / 6); for (let k = 0; k <= nn; k++) { const x = a[0] + (b[0] - a[0]) * k / nn, z = a[1] + (b[1] - a[1]) * k / nn; B.caja(0.3, 1.5, 0.3, x, altura(x, z) + 0.75, z, '#6a5540'); } }
      if (!e.ruina) for (let i = 0; i < 5; i++) { const p = en(-28 + i * 14 + rr() * 4, 20 + rr() * 34); pajas.push({ m: matriz(p[0], altura(p[0], p[1]), p[1], rr() * 6, 1.1 + rr() * 0.6) }); } }
    if (e.tipo === 'fuente' && !e.obra) { const y = altura(e.x, e.z); B.add(new THREE.CylinderGeometry(6.6, 6.9, 0.5, 14), '#a89e8a', new THREE.Matrix4().makeTranslation(e.x, y + 0.2, e.z)); } }
  L.paja.poner(pajas);
  if (dinM) { scene.remove(dinM); dinM.geometry.dispose(); } dinM = new THREE.Mesh(B.geo(), matBulto); dinM.castShadow = dinM.receiveShadow = true; scene.add(dinM);
}
/* humo (de ciudad2, con color por columna): hogares, talleres y casas que arden */
const matHumo = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uH: { value: new THREE.Color(HORIZ) }, uTiempo: U.uTiempo },
  vertexShader: 'attribute vec4 aPos; attribute vec3 aOp; attribute vec3 aCol; uniform float uTiempo; varying vec2 vUv; varying vec3 vOp; varying vec3 vCol; varying float vD; void main(){ vUv = uv; vOp = aOp; vCol = aCol; vec3 p = aPos.xyz; p.x += sin(uTiempo * 0.7 + aOp.y * 20.0) * aPos.w * 0.12; p.y += sin(uTiempo * 0.5 + aOp.y * 31.0) * aPos.w * 0.1; vec4 mv = modelViewMatrix * vec4(p, 1.0); mv.xy += position.xy * aPos.w * (1.0 + aOp.z * 0.25 * sin(uTiempo * 9.0 + aOp.y * 50.0)); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'varying vec2 vUv; varying vec3 vOp; varying vec3 vCol; varying float vD; uniform vec3 uH; void main(){ vec2 d = vUv - 0.5; float r = length(d) * 2.0; float a = smoothstep(1.0, 0.15, r) * vOp.x; a *= 0.75 + 0.25 * sin(vUv.x * 9.0 + vOp.y * 30.0) * sin(vUv.y * 7.0 + vOp.y * 17.0); vec3 c = vCol * mix(0.84, 1.0, smoothstep(-0.3, 0.4, d.y - d.x)); c = mix(c, uH, (1.0 - exp(-vD * vD * 0.00000011)) * (1.0 - vOp.z)); gl_FragColor = vec4(c, a);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }' });
function humo() {
  const cols = [], rnd = azar(3), Rr = (a, b) => a + (b - a) * rnd();
  for (const l of E.parcelas) { const c = l.casa; if (!c || l.fuera) continue; if (c.arde && c.ruina) { cols.push({ x: l.x, z: l.z, y: 2, f: 1.1, col: [0.12, 0.11, 0.1], op: 1.25 }); cols.push({ x: l.x - 3, z: l.z, y: 0.5, f: 0.3, col: [1.5, 0.42, 0.06], op: 1.3, fuego: 1 }); cols.push({ x: l.x + 2, z: l.z + 2, y: 0.5, f: 0.24, col: [1.7, 0.7, 0.1], op: 1.3, fuego: 1 }); } else if (!c.ruina && l.id % (c.nivel === 1 ? 6 : 4) === 0) cols.push({ x: l.x, z: l.z, y: c.nivel === 1 ? 5 : 8, f: c.nivel === 1 ? 0.5 : 0.75, col: [0.9, 0.86, 0.8], op: 0.8 }); }
  for (const e of E.edificios) if (e.tipo === 'taller' && !e.obra && !e.ruina) cols.push({ x: e.x, z: e.z, y: 11, f: 1.7, col: [0.36, 0.33, 0.31], op: 1 });
  if (humoM) { scene.remove(humoM); humoM.geometry.dispose(); humoM = null; } if (!cols.length) return;
  const NP = 9, n = cols.length * NP, geo = new THREE.InstancedBufferGeometry(), pl = new THREE.PlaneGeometry(1, 1); geo.index = pl.index; geo.setAttribute('position', pl.attributes.position); geo.setAttribute('uv', pl.attributes.uv);
  const a = new Float32Array(n * 4), b = new Float32Array(n * 3), cc = new Float32Array(n * 3); let i = 0;
  for (const c of cols) { const y0 = altura(c.x, c.z) + c.y, f = c.f * Rr(0.8, 1.2), fase = Rr(0, 1); for (let k = 0; k < NP; k++, i++) { const t = (k + fase) / NP; a.set([c.x + 2 + t * t * 46 * f + Rr(-1, 1), y0 + t * 42 * f, c.z + 1 + t * t * 20 * f + Rr(-1, 1), (2.6 + t * 15) * f * (c.fuego ? 1.6 : 1)], i * 4); b.set([(1 - t) * 0.78 * (0.4 + 0.6 * Math.min(1, t * 5)) * c.op, rnd(), c.fuego ? 1 : 0], i * 3); cc.set(c.col, i * 3); } }
  geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(a, 4)); geo.setAttribute('aOp', new THREE.InstancedBufferAttribute(b, 3)); geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(cc, 3)); geo.instanceCount = n;
  humoM = new THREE.Mesh(geo, matHumo); humoM.frustumCulled = false; humoM.renderOrder = 5; scene.add(humoM);
}
/* gente: la ciudadana real de 0 A.D. (js/gfx/units.js), andando por las calles con casas. Pocas y solo de cerca */
let gente = null;
function ponerGente() {
  const u = UN.getUnit('ciudadana'); if (!u) return; const NG = 44;
  if (!gente) { const geo = UN.instancedGeometry(u, NG), mat = UN.unitMaterialReal(u, '#b9aa8c'), im = new THREE.InstancedMesh(geo, mat, NG); im.count = 0; im.frustumCulled = false; im.receiveShadow = true; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(im); gente = { u, im, fr: geo.attributes.aFrame, l: [] }; }
  const nc = {}; for (const l of E.parcelas) if (l.casa && !l.fuera && !l.casa.ruina) nc[l.via] = (nc[l.via] || 0) + 1;
  const vs = E.vias.filter(v => nc[v.id] >= 2 && v.largo > 30), rnd = azar(E.vias.length * 13 + 1), quiero = Math.min(NG, Math.floor(R.casas(E).length / 3));
  gente.l = gente.l.filter(g => vs.includes(g.v)).slice(0, quiero); let guard = 0;
  while (gente.l.length < quiero && vs.length && guard++ < 200) { const v = vs[Math.floor(rnd() * vs.length)]; gente.l.push({ v, s: rnd() * v.largo, vel: (rnd() < 0.5 ? 1 : -1) * (3.2 + rnd() * 1.6), lat: (rnd() - 0.5) * v.w * 1.1, fase: rnd() * 6, e: 0.7 + rnd() * 0.1 }); }
}
function moverGente(t, dt) {
  if (!gente) return; const ver = cam.d < 560 && t >= esperaSurco, im = gente.im; im.count = ver ? gente.l.length : 0; if (!ver) return; const A = im.instanceMatrix.array;
  gente.l.forEach((g, i) => { g.s += g.vel * dt; if (g.s < 1) { g.s = 1; g.vel = Math.abs(g.vel); } if (g.s > g.v.largo - 1) { g.s = g.v.largo - 1; g.vel = -Math.abs(g.vel); }
    const p = g.v.p, f = g.s / g.v.largo * (p.length - 1), k = Math.min(p.length - 2, Math.floor(f)), u = f - k, a = p[k], b = p[k + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), x = a[0] + (b[0] - a[0]) * u - Math.sin(ang) * g.lat, z = a[1] + (b[1] - a[1]) * u + Math.cos(ang) * g.lat;
    matriz(x, altura(x, z) + 0.05, z, -ang + Math.PI / 2 + (g.vel < 0 ? Math.PI : 0), g.e).toArray(A, i * 16); gente.fr.array[i] = UN.frameOf(gente.u.clips.walk, t * 0.9 + g.fase); });
  im.instanceMatrix.needsUpdate = true; gente.fr.needsUpdate = true;
}
/* el surco: una cinta oscura pegada al relieve que el arado va abriendo */
export function surcar() {
  const S = E.surco, n = S.length, pos = [], idx = []; for (let i = 0; i <= n; i++) { const p = S[i % n], t = Math.atan2(p[1] - E.foro.z, p[0] - E.foro.x); for (const o of [-1.5, 1.5]) { const x = p[0] + Math.cos(t) * o, z = p[1] + Math.sin(t) * o; pos.push(x, altura(x, z) + 0.35, z); } if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  surcoM = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: '#4a3524', side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); surcoM.receiveShadow = true; surcoM.frustumCulled = false; g.setDrawRange(0, 0); scene.add(surcoM);
  const b = new Bulto(); for (const v of [-1.6, 1.6]) { b.caja(5, 2.8, 2, 3, 2.6, v, v < 0 ? '#e8e2d2' : '#d8d0bc'); b.caja(1.6, 1.5, 1.4, 6, 3.4, v, '#e8e2d2'); for (const u of [1.2, 4.8]) b.caja(0.6, 1.4, 0.6, u, 0.7, v, '#cfc6b2'); } b.caja(6, 0.3, 0.3, -1.5, 2.2, 0, '#6a4a2c', 0, 0, 0.3); b.caja(0.4, 2.6, 0.4, -4.4, 2.2, 0, '#6a4a2c'); b.caja(0.9, 3.4, 0.9, -5.6, 2.2, 0, '#b8a888');
  aradoM = new THREE.Mesh(b.geo(), matBulto); aradoM.castShadow = true; scene.add(aradoM);
  surcoT0 = ahora(); esperaSurco = surcoT0 + 2.7; animHasta = esperaSurco + 3;
}
let pedirReparto = false;
/* pone la escena al día con el estado. Las sombras se piden aquí (como mucho una vez por cambio) */
export function sincronizar(forzar) {
  if (!E || (!forzar && E.rev === revVista) || ahora() < esperaSurco) return; revVista = E.rev;
  sueloJ.pintar(E); arboles(); edificios(); dinamico(); humo(); ponerGente();
  if (surcoM) surcoM.visible = E.muralla.fase < 2;
  if (casas(ahora())) animHasta = Math.max(animHasta, ahora() + 2.6);
  sombraPend = true; pedirReparto = true;
}

/* ---------- miniaturas de las fichas: cada pieza real, dibujada una vez en un lienzo pequeño ---------- */
export function miniaturas() {
  const out = {}, T = 144, rt = new THREE.WebGLRenderTarget(T, T), esc = new THREE.Scene(); esc.add(new THREE.DirectionalLight('#ffe8c8', 3.2).translateX(-3).translateY(4).translateZ(3), new THREE.HemisphereLight('#c8d4e8', '#8a7458', 1.6));
  const c2 = document.createElement('canvas'); c2.width = c2.height = T; const g = c2.getContext('2d'), px = new Uint8Array(T * T * 4), ca = new THREE.Color(); renderer.getClearColor(ca);
  for (const [id, k] of [...Object.entries(PZ).map(([t, d]) => [t, d[0]]), ['muralla', 'torre']]) { const st = pieza(k); if (!st) continue; const lt = new Lote(k, [st], 1, { escena: esc, sinTeja: id === 'fuente' || id === 'muralla' }); lt.poner([{ m: new THREE.Matrix4(), ...(id === 'muralla' ? { muro: [0.7, 0.66, 0.6] } : PIEL_U) }]); for (const m of lt.niv[0].mallas) { m.count = 1; lt.niv[0].iM.array.set(lt.M.subarray(0, 16)); lt.niv[0].iA.array.set(lt.aM.subarray(0, 3)); lt.niv[0].iT.array.set(lt.aT.subarray(0, 4)); }
    const b = st.bb, y0 = Math.max(b[1], -1), cx = (b[0] + b[3]) / 2, cy = (y0 + b[4]) / 2, cz = (b[2] + b[5]) / 2, r = 0.5 * Math.hypot(b[3] - b[0], b[4] - y0, b[5] - b[2]), cm = new THREE.PerspectiveCamera(30, 1, 1, 500); cm.position.set(cx + r * 2.1, cy + r * 1.7, cz + r * 2.4); cm.lookAt(cx, cy, cz);
    renderer.setRenderTarget(rt); renderer.setClearColor('#000000', 0); renderer.clear(); renderer.render(esc, cm); renderer.readRenderTargetPixels(rt, 0, 0, T, T, px); renderer.setRenderTarget(null);
    const im = g.createImageData(T, T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const o = ((T - 1 - y) * T + x) * 4, d = (y * T + x) * 4; for (let q = 0; q < 3; q++) im.data[d + q] = 255 * Math.pow(Math.min(1, px[o + q] / 255 * 1.15), 1 / 2.2); im.data[d + 3] = px[o + 3]; }
    g.putImageData(im, 0, 0); out[id] = c2.toDataURL('image/png'); for (const m of lt.niv[0].mallas) { esc.remove(m); m.geometry.dispose(); } }
  renderer.setClearColor(ca, 1); rt.dispose(); return out;
}

/* ---------- cuadro ---------- */
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _ult = new Float32Array(16);
function repartir(todo) { camara.updateMatrixWorld(); _pm.multiplyMatrices(camara.projectionMatrix, camara.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm); const kf = 1 / Math.tan(camara.fov * Math.PI / 360); for (const l of lotes) l.repartir(_fr, camara.position, kf, todo); }
export const medidas = { triangulos: 0, llamadas: 0, sombras: 0, conSombra: 0 };
export function cuadro() {
  const t = ahora(), dtC = Math.min(0.25, t - (U.uTiempo.value || t)); moverGente(t, Math.min(0.1, dtC)); U.uTiempo.value = t; if (pinM && pinM.visible) pinM.rotation.y = t * 2;
  sincronizar(false);
  /* arado y surco */
  if (surcoM && surcoT0 >= 0) { const u = Math.min(1, (t - surcoT0) / 2.6), n = E.surco.length, k = Math.floor(u * n); surcoM.geometry.setDrawRange(0, k * 6); if (aradoM) { if (u >= 1) { scene.remove(aradoM); aradoM.geometry.dispose(); aradoM = null; surcoT0 = -1; revVista = -1; } else { const p = E.surco[k % n], q = E.surco[(k + 1) % n]; aradoM.position.set(p[0], altura(p[0], p[1]), p[1]); aradoM.rotation.y = -Math.atan2(q[1] - p[1], q[0] - p[0]); } } }
  /* crecida: el agua sube el mes de la crecida y baja después */
  if (crecida && E) { const sube = E.crecida === E.mesN && E.fundada, obj = NIVEL_RIO + (sube ? 3.9 : -0.6), y = crecida.position.y + (obj - crecida.position.y) * Math.min(1, dtC * 1.6); crecida.position.y = y; crecida.visible = y > NIVEL_RIO + 0.05; }
  const anim = t < animHasta; if (anim && E && t >= esperaSurco) { if (!casas(t) && t > esperaSurco + 1) animHasta = 0; pedirReparto = true; if (animHasta === 0) sombraPend = true; }
  if (sombraPend && !anim) { repartir(true); renderer.shadowMap.needsUpdate = true; renderer.render(scene, camara); sombraPend = false; _ult[0] = NaN; medidas.sombras++; medidas.conSombra = renderer.info.render.triangles; }
  camara.updateMatrixWorld(); _pm.multiplyMatrices(camara.projectionMatrix, camara.matrixWorldInverse); let igual = !pedirReparto; for (let i = 0; i < 16; i++) if (_pm.elements[i] !== _ult[i]) { igual = false; _ult[i] = _pm.elements[i]; }
  if (!igual) { repartir(false); pedirReparto = false; }
  renderer.render(scene, camara); medidas.triangulos = renderer.info.render.triangles; medidas.llamadas = renderer.info.render.calls;
}
export const listo = async () => { await Promise.all(esperas); hornos.forEach(f => f()); hornos.length = 0; };
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); ponerCamara(); });
