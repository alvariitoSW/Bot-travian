/* Maqueta Q1b2 (aligerada en Q1c) — segunda maqueta 3D de la ciudad itálica. Página independiente: NO toca el juego.
   Parámetros por URL: ?cultura=roma|grecia|punica &vista=cerca|lejos|calle|catalogo &sombra=4096 &cam=x,y,z,tx,ty,tz,fov
   REAL (arte de 0 A.D., Wildfire Games, CC BY-SA 3.0): todos los edificios, casas, muralla, árboles, atrezo (carreta, pozo, paja,
   sacos, cestos, cajas, mesas, vasijas), la gente (ciudadana) y las texturas del suelo y del agua.
   INVENTADO por código: el plano, el relieve, el río, las máscaras del suelo, la luz, el humo, los toldos de tela, las tumbas,
   las cercas, el puente, las barcas, las cañas y los pájaros. Los tintes (toba, encalado, teja vieja) retiñen piezas reales. */
import { THREE } from '../../../js/gfx/models.js';
import { preloadStatic, getStatic } from '../../../js/gfx/statics.js';
import * as UN from '../../../js/gfx/units.js';
import { generar, altura, azar, ARX, FORO, FORO_GIRO, FORO_M, RIO, NIVEL_RIO, fracMuro, distRio } from './mundo.js';
import { crearSuelo, crearRio, crearCielo, texturaRuido, GLSL_NUBES } from './suelo.js';

let VISTA; const Q = new URLSearchParams(location.search), CULTURA = Q.get('cultura') || 'roma'; VISTA = Q.get('vista') || 'cerca';
const PIEZAS = 'gobierno/maquetas/piezas/', ASSETS = 'assets/static/';
const HORIZ = '#cdc3b2';
const lienzo = document.getElementById('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || 0.92); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;      // Q1c: la sombra se calcula una vez (al montar y al cambiar de vista)
const scene = new THREE.Scene(); scene.background = new THREE.Color(HORIZ); scene.fog = new THREE.FogExp2(HORIZ, 0.00029);
const U = { uRuido: { value: null }, uTiempo: { value: 0 } };

/* ---------- carga: piezas de assets/static (por statics.js) y de gobierno/maquetas/piezas (mismo formato) ---------- */
const esperas = [], texs = new Map();
function textura(file, datos) {                     // busca primero en assets/static y, si no está, en piezas/
  if (texs.has(file)) return texs.get(file);
  const t = new THREE.Texture(); t.flipY = false; if (!datos) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texs.set(file, t);
  esperas.push(new Promise(ok => { const im = new Image(); let paso = 0; im.onload = () => { t.image = im; t.needsUpdate = true; ok(); }; im.onerror = () => { if (paso++ === 0) im.src = PIEZAS + file; else { console.warn('Falta la textura ' + file); ok(); } }; im.src = ASSETS + file; }));
  return t;
}
let indiceP = {}; const piezasP = new Map();
async function cargarPiezas() {
  try { const r = await fetch(PIEZAS + 'static.json'); indiceP = r.ok ? await r.json() : {}; } catch (e) { indiceP = {}; }
  await Promise.all(Object.keys(indiceP).filter(k => !k.startsWith('__')).map(async key => { const u = indiceP[key], buf = await fetch(PIEZAS + key + '.bin').then(r => r.arrayBuffer()), n = u.verts;
    const P = new Float32Array(buf, u.off[0], n * 3), N = new Int8Array(buf, u.off[1], n * 3), UV = new Float32Array(buf, u.off[2], n * 2), UV1 = u.off[3] !== undefined ? new Float32Array(buf, u.off[3], n * 2) : null;
    const parts = u.groups.map(g => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P.subarray(g.start * 3, (g.start + g.count) * 3), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N.subarray(g.start * 3, (g.start + g.count) * 3), 3, true)); geo.setAttribute('uv', new THREE.BufferAttribute(UV.subarray(g.start * 2, (g.start + g.count) * 2), 2)); if (UV1 && g.aoFile) geo.setAttribute('uv1', new THREE.BufferAttribute(UV1.subarray(g.start * 2, (g.start + g.count) * 2), 2)); geo.computeBoundingSphere(); return { geo, file: g.file, mode: g.mode, maps: { ao: UV1 && g.aoFile } }; });
    piezasP.set(key, { key, parts, bb: u.bb }); }));
}
const pieza = k => piezasP.get(k) || getStatic(k);

/* ---------- material de edificio: Lambert + AO horneado + tinte de muro y de teja por ejemplar + mugre en la base ---------- */
const PIEL = {
  roma: { equipo: '#6d4a38', desat: 0.28, tejaSat: 0.56, base: 0.62, plano: 0 },
  grecia: { equipo: '#5b6a78', desat: 0.4, tejaSat: 0.5, base: 0.72, plano: 0, tejaForma: true },
  punica: { equipo: '#7a6248', desat: 0.35, tejaSat: 0.5, base: 0.7, plano: 0 }
}[CULTURA] || {};
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
      float teja = ${o.sinTeja ? '0.0' : PIEL.tejaForma ? 'max(rojo * smoothstep(0.12, 0.3, vUp), smoothstep(0.15, 0.32, vUp) * smoothstep(3.6, 5.0, vAlt) * (1.0 - smoothstep(0.5, 0.75, lum) * 0.0))' : 'rojo * smoothstep(0.12, 0.3, vUp)'};
      vec3 muro = mix(tx.rgb, vec3(lum), ${(PIEL.desat || 0.3).toFixed(2)});
      muro = mix(muro, vec3(0.30 + 0.62 * pow(lum, 0.7)), vTeja.a * (1.0 - rojo)) * vMuro;
      vec3 tj = mix(vec3(lum), tx.rgb, ${(PIEL.tejaSat || 0.6).toFixed(2)}) * vTeja.rgb;
      ${PIEL.tejaForma ? 'tj = mix(vec3(0.22 + 0.7 * lum) * vec3(1.0, 0.70, 0.52) * vTeja.rgb, tj, rojo);' : ''}
      vec3 c = mix(muro, tj, teja);
      c *= mix(${(PIEL.base || 0.62).toFixed(2)}, 1.0, max(teja, smoothstep(-0.5, 5.5, vAlt + (lum - 0.5) * 2.0)));`}
      diffuseColor.rgb *= c * nubes(vWP);`)
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n #ifdef USE_AOMAP\n reflectedLight.directDiffuse *= mix(1.0, ambientOcclusion, 0.55);\n #endif');
  };
  m.customProgramCacheKey = () => 'q1b2|' + id;
  if (p.mode === 2) { m.userData.prof = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: m.map, alphaTest: 0.45, side: THREE.DoubleSide }); }
  mats.set(id, m); return m;
}
/* ---------- Q1c: aligerado. Tres vías: (1) solo se dibuja lo que entra en pantalla, (2) versiones ligeras de lejos,
   (3) árboles lejanos como cartel. Todo depende de la cámara del momento: al moverla se vuelve a repartir. ---------- */
/* versión ligera de una pieza: quita los trozos sueltos pequeños (rejas, vigas, tinajas...) y, si se pide, los triángulos diminutos */
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
/* cartel de un árbol: su propia imagen de perfil, horneada al cargar en una textura pequeña, sobre dos planos cruzados (4 triángulos) */
const hornos = [];
function cartel(clave) {
  const st = pieza(clave), b = st.bb, w = Math.max(b[3] - b[0], b[5] - b[2]), cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2, h = b[4] - b[1], AN = 128, AL = Math.min(512, Math.max(64, Math.round(AN * h / w / 16) * 16));
  const rt = new THREE.WebGLRenderTarget(AN, AL, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  hornos.push(() => { const esc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 300); cam.position.set(cx, (b[1] + b[4]) / 2, cz + 100); cam.lookAt(cx, (b[1] + b[4]) / 2, cz);
    for (const p of st.parts) esc.add(new THREE.Mesh(p.geo, new THREE.MeshBasicMaterial({ map: textura(p.file), alphaTest: p.mode === 2 ? 0.45 : 0, side: THREE.DoubleSide })));
    const ca = new THREE.Color(), al = renderer.getClearAlpha(); renderer.getClearColor(ca); renderer.setRenderTarget(rt); renderer.setClearColor('#1c2410', 0); renderer.clear(); renderer.render(esc, cam);
    const px = new Uint8Array(AN * AL * 4), med = [0, 0, 0]; let np = 0; renderer.readRenderTargetPixels(rt, 0, 0, AN, AL, px); for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 128) { med[0] += px[i]; med[1] += px[i + 1]; med[2] += px[i + 2]; np++; }      // el fondo se rellena con el color medio de la copa: así no se oscurece al reducirse de lejos
    if (np) { renderer.setClearColor(new THREE.Color(med[0] / np / 255, med[1] / np / 255, med[2] / np / 255), 0); renderer.clear(); renderer.render(esc, cam); }
    renderer.setRenderTarget(null); renderer.setClearColor(ca, al); });
  const geo = new THREE.BufferGeometry(), P = [], UV = [], N = [];
  for (const [dx, dz] of [[1, 0], [0, 1]]) for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1], [1, 0], [-1, 0], [1, 1], [1, 1], [-1, 0], [-1, 1]]) { /* las dos caras, cada una con su normal hacia arriba: luz pareja */ P.push(cx + dx * u * w / 2, b[1] + v * h, cz + dz * u * w / 2); UV.push(u * 0.5 + 0.5, v); N.push(0, 1, 0); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  return { key: clave, parts: [{ geo, tex: rt.texture, file: 'cartel_' + clave, mode: 2, maps: {}, alfa: 0.3, lado: THREE.FrontSide }], bb: st.bb };
}
/* lote: los ejemplares de una pieza, en varios niveles de detalle. repartir() mira la cámara y deja en cada nivel solo los que se ven. */
const lotes = [];
class Lote {
  constructor(clave, niveles, lista, o) {
    const n = this.n = lista.length, b = niveles[0].bb, rb = 0.5 * Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]), cy = (b[1] + b[4]) / 2; this.clave = clave; this.cortes = o.cortes || [];
    this.M = new Float32Array(n * 16); this.aM = new Float32Array(n * 3); this.aT = new Float32Array(n * 4); this.E = new Float32Array(n * 4);
    lista.forEach((e, i) => { e.m.toArray(this.M, i * 16); this.aM.set(e.muro || [1, 1, 1], i * 3); this.aT.set(e.teja || [1, 1, 1, 0], i * 4); const s = e.m.getMaxScaleOnAxis(), el = e.m.elements; this.E.set([el[12], el[13] + cy * s, el[14], rb * s], i * 4); });
    this.niv = niveles.map(st => { const iM = new THREE.InstancedBufferAttribute(new Float32Array(n * 16), 16), iA = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), iT = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4); for (const a of [iM, iA, iT]) a.setUsage(THREE.DynamicDrawUsage);
      const mallas = st.parts.map(p => { const geo = p.geo.clone(); geo.setAttribute('aMuro', iA); geo.setAttribute('aTeja', iT); const mat = material(p, o), im = new THREE.InstancedMesh(geo, mat, 0); im.instanceMatrix = iM; im.frustumCulled = false; im.castShadow = o.sombra !== false && !p.tex; im.receiveShadow = true; if (mat.userData.prof) im.customDepthMaterial = mat.userData.prof; scene.add(im); return im; });
      return { iM, iA, iT, mallas, n: 0 }; });
    lotes.push(this);
  }
  repartir(fr, cam, kf, todo) {
    const E = this.E, P = fr.planes, nv = this.niv, c0 = this.cortes[0] || 0, c1 = this.cortes[1] || 0, ult = nv.length - 1, M = this.M, aM = this.aM, aT = this.aT; for (const v of nv) v.n = 0;
    for (let i = 0; i < this.n; i++) { const x = E[i * 4], y = E[i * 4 + 1], z = E[i * 4 + 2], r = E[i * 4 + 3]; let k = 0;
      if (!todo) { let fuera = false; for (let j = 0; j < 6; j++) { const pl = P[j]; if (pl.normal.x * x + pl.normal.y * y + pl.normal.z * z + pl.constant < -r) { fuera = true; break; } } if (fuera) continue;
        const s = r * kf / Math.max(1, Math.hypot(x - cam.x, y - cam.y, z - cam.z)); k = s >= c0 ? 0 : s >= c1 ? Math.min(1, ult) : ult; }
      const v = nv[k], j = v.n++, dM = v.iM.array, dA = v.iA.array, dT = v.iT.array; for (let q = 0; q < 16; q++) dM[j * 16 + q] = M[i * 16 + q]; for (let q = 0; q < 3; q++) dA[j * 3 + q] = aM[i * 3 + q]; for (let q = 0; q < 4; q++) dT[j * 4 + q] = aT[i * 4 + q]; }
    for (const v of nv) { for (const m of v.mallas) m.count = v.n; if (v.n) for (const a of [v.iM, v.iA, v.iT]) { a.clearUpdateRanges(); a.addUpdateRange(0, v.n * a.itemSize); a.needsUpdate = true; } }
  }
}
/* lista: [{m: Matrix4, muro: [r,g,b], teja: [r,g,b,cal]}]. o.ligeras: [[diagMin, areaFrac]...] niveles ligeros; o.cartel: último nivel en cartel; o.cortes: tamaño en pantalla al que se cambia */
const cuenta = {}, tris = {};
const tris1 = k => { const st = pieza(k); return st ? st.parts.reduce((s, p) => s + p.geo.attributes.position.count / 3, 0) : 0; };
function instanciar(clave, lista, o = {}) {
  const st = pieza(clave); if (!st || !lista.length) { if (!st) console.warn('Falta la pieza ' + clave); return null; }
  const niveles = [st, ...(o.ligeras || []).map(a => ligera(clave, a[0], a[1]))]; if (o.cartel) niveles.push(cartel(clave));
  cuenta[clave] = (cuenta[clave] || 0) + lista.length; tris[clave] = (tris[clave] || 0) + lista.length * st.parts.reduce((s, p) => s + p.geo.attributes.position.count / 3, 0);
  return new Lote(clave, niveles, lista, o);
}
const _q = new THREE.Quaternion(), _e = new THREE.Euler();
const matriz = (x, y, z, giro, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(0, giro, 0)), new THREE.Vector3(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz));
const suelo = (x, z, r = 6) => Math.min(altura(x, z), altura(x + r, z), altura(x - r, z), altura(x, z + r), altura(x, z - r));

/* ---------- pieles por cultura ---------- */
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const CASAS = { roma: ['casa', 'casa_b', 'casa_c', 'casa_d'], grecia: ['grie_casa', 'grie_casa_b', 'grie_casa_c', 'grie_casa_d', 'grie_casa_e'], punica: ['cart_casa', 'cart_casa_b', 'cart_casa_c'] }[CULTURA];
function tinte(c) {                                   // muro y teja de cada casa
  const a = c.tono, b = c.teja, v = 0.9 + 0.2 * ((a * 7.13) % 1);
  if (CULTURA === 'roma') { const muro = a < 0.45 ? lerp3([0.80, 0.70, 0.58], [0.92, 0.80, 0.64], a / 0.45) : a < 0.75 ? [0.96, 0.84, 0.62] : [0.98, 0.95, 0.88]; const cal = a < 0.45 ? 0.1 : a < 0.75 ? 0.35 : 0.8;
    const teja = b < 0.4 ? [1.12, 0.98, 0.9] : b < 0.78 ? [0.98, 0.9, 0.84] : [0.76, 0.7, 0.66]; return { muro: muro.map(x => x * v), teja: [...teja, cal] }; }
  if (CULTURA === 'grecia') { const muro = a < 0.7 ? lerp3([1.12, 1.06, 0.94], [1.04, 0.95, 0.80], a / 0.7) : [0.98, 0.84, 0.64]; const teja = b < 0.5 ? [1.12, 1.02, 0.92] : b < 0.85 ? [0.98, 0.94, 0.88] : [0.8, 0.76, 0.72]; return { muro: muro.map(x => x * v), teja: [...teja, a < 0.7 ? 0.85 : 0.4] }; }
  const muro = a < 0.3 ? [0.98, 0.92, 0.80] : a < 0.8 ? lerp3([0.98, 0.84, 0.60], [0.88, 0.72, 0.52], (a - 0.3) / 0.5) : [0.82, 0.66, 0.50]; return { muro: muro.map(x => x * v), teja: [0.9, 0.86, 0.8, a < 0.3 ? 0.7 : 0.25] };
}
const FRENTE = { casa: 0, casa_b: 0, casa_c: 0, casa_d: 0 };      // giro para que la fachada mire a la calle (se ajusta mirando el catálogo)

/* ---------- atrezo por código: cajas, conos y telas de un solo color, todo en una malla ---------- */
class Bulto { constructor() { this.p = []; this.n = []; this.c = []; }
  add(geo, col, m) { const g = geo.index ? geo.toNonIndexed() : geo; if (m) g.applyMatrix4(m); const P = g.attributes.position, N = g.attributes.normal, c = new THREE.Color(col); for (let i = 0; i < P.count; i++) { this.p.push(P.getX(i), P.getY(i), P.getZ(i)); this.n.push(N.getX(i), N.getY(i), N.getZ(i)); this.c.push(c.r, c.g, c.b); } }
  caja(w, h, d, x, y, z, col, giro = 0, rx = 0, rz = 0) { this.add(new THREE.BoxGeometry(w, h, d), col, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(rx, giro, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); }
  cono(r, h, seg, x, y, z, col, sy = 1, giro = 0) { this.add(new THREE.ConeGeometry(r, h, seg), col, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(0, giro, 0)), new THREE.Vector3(1, sy, 1))); }
  malla() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.castShadow = m.receiveShadow = true; return m; } }
/* Q1c: los bultos se guardan por casillas del terreno, para que solo se dibujen las que entran en pantalla */
const matBulto = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), otrosRepartos = [];
class Bultos { constructor(cel = 240) { this.cel = cel; this.m = new Map(); }
  de(x, z) { const k = Math.floor(x / this.cel) + ',' + Math.floor(z / this.cel); let b = this.m.get(k); if (!b) this.m.set(k, b = new Bulto()); return b; }
  add(geo, col, m) { this.de(m.elements[12], m.elements[14]).add(geo, col, m); }
  caja(w, h, d, x, y, z, col, giro = 0, rx = 0, rz = 0) { this.de(x, z).caja(w, h, d, x, y, z, col, giro, rx, rz); }
  cono(r, h, seg, x, y, z, col, sy = 1, giro = 0) { this.de(x, z).cono(r, h, seg, x, y, z, col, sy, giro); }
  malla() { const g = new THREE.Group(); for (const b of this.m.values()) { const m = b.malla(); m.material = matBulto; g.add(m); } return g; } }

/* ---------- cámaras ---------- */
const VISTAS = { cerca: { o: [-22, 12, -10], d: 520, el: 15, az: 3, fov: 40 }, lejos: { o: [-10, 8, -20], d: 900, el: 14, az: -3, fov: 38 }, calle: { o: [FORO[0] - 14, 9, FORO[1] - 24], d: 172, el: 9, az: 12, fov: 40 }, catalogo: { o: [0, 4, 0], d: 150, el: 26, az: 0, fov: 30 } };
const camara = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 2, 20000);
function ponerCamara() { const v = VISTAS[VISTA] || VISTAS.cerca, c = Q.get('cam');
  if (c) { const a = c.split(',').map(Number); camara.position.set(a[0], a[1], a[2]); camara.fov = a[6] || 35; camara.lookAt(a[3], a[4], a[5]); }
  else { const el = (+(Q.get('el') || v.el)) * Math.PI / 180, az = (+(Q.get('az') || v.az)) * Math.PI / 180, d = +(Q.get('d') || v.d); camara.fov = +(Q.get('fov') || v.fov); camara.position.set(v.o[0] + Math.sin(az) * Math.cos(el) * d, v.o[1] + Math.sin(el) * d, v.o[2] + Math.cos(az) * Math.cos(el) * d); camara.lookAt(v.o[0], v.o[1], v.o[2]); }
  camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); }

/* ---------- luz ---------- */
const SOL = new THREE.Vector3(-0.84, 0.49, 0.26).normalize();          // ~29° de altura, rasante desde la izquierda (suroeste: la cámara mira al norte)
const sol = new THREE.DirectionalLight('#ffdfb4', 3.3), hemi = new THREE.HemisphereLight('#b6c6de', '#927252', 1.45);
function ponerLuz() { const v = VISTAS[VISTA] || VISTAS.cerca, R = VISTA === 'calle' ? 190 : VISTA === 'lejos' ? 640 : VISTA === 'catalogo' ? 150 : 430, cz = VISTA === 'lejos' ? -40 : VISTA === 'cerca' ? -30 : v.o[2];
  sol.position.set(v.o[0], 0, cz).addScaledVector(SOL, 1500); sol.target.position.set(v.o[0], 0, cz); sol.castShadow = true; const s = sol.shadow; s.mapSize.set(+(Q.get('sombra') || 2048), +(Q.get('sombra') || 2048)); if (s.map) { s.map.dispose(); s.map = null; } s.camera.left = -R; s.camera.right = R; s.camera.top = R; s.camera.bottom = -R; s.camera.near = 600; s.camera.far = 2400; s.bias = -0.0006; s.normalBias = 0.5; s.radius = 2.2; s.camera.updateProjectionMatrix();
  scene.add(sol, sol.target, hemi); }

/* ---------- construcción ---------- */
async function construir() {
  const claves = ['casa', 'almacen', 'aserradero', 'mercado', 'foro', 'vesta', 'templo', 'cuartel', 'granja', 'muro', 'torre', 'puerta', 'cipres', 'olivo', 'pino', 'algarrobo', 'grie_templo', 'cart_templo', 'barco'];
  await Promise.all([preloadStatic(claves), cargarPiezas(), UN.preload(['ciudadana'])]);
  const T = {}; for (const k of ['terr_grass', 'terr_dry', 'terr_dirt', 'terr_paving']) T[k] = textura(k + '.webp'); T.water_norm = textura('water_norm.webp', true);
  U.uRuido.value = texturaRuido();
  ponerCamara(); ponerLuz(); scene.add(crearCielo(SOL, HORIZ, U));
  if (VISTA === 'catalogo') return catalogo();
  const W = generar(7), rnd = azar(99), R = (a, b) => a + (b - a) * rnd();
  scene.add(crearSuelo(W, T, U)); scene.add(crearRio(T, U));

  /* casas */
  const porPieza = {}, EC_ = CULTURA === 'punica' ? 1.17 : CULTURA === 'grecia' ? 1.06 : 1;      // las casas griegas y púnicas de 0 A.D. son algo menores
  for (const c of W.casas.concat(W.ladera, W.casasFondo)) { const k = CASAS[CULTURA === 'roma' ? (c.tipo < 0.1 ? 0 : 1 + Math.floor((c.tipo - 0.1) / 0.9 * 3) % 3) : Math.floor(c.tipo * CASAS.length) % CASAS.length], t = tinte(c), y = suelo(c.x, c.z, 6) - 0.25, giro = -c.ang + (c.lado > 0 ? Math.PI : 0) + (FRENTE[k] || 0);
    (porPieza[k] = porPieza[k] || []).push({ m: matriz(c.x, y, c.z, giro, c.ex * 0.97 * EC_, (c.ex + c.ez) / 2 * (0.94 + 0.2 * c.teja) * EC_, c.ez * 0.97 * EC_), ...t }); }
  for (const k in porPieza) instanciar(k, porPieza[k], { ligeras: [[3, 0], [6, 0]], cortes: [+(Q.get('c0') || 0.09), +(Q.get('c1') || 0.05)] });
  /* granjas */
  instanciar('granja', W.granjas.map(g => ({ m: matriz(g.x, suelo(g.x, g.z, 9) - 0.2, g.z, g.ang, g.esc), ...tinte(g) })), { ligeras: [[3, 0], [6, 0]], cortes: [0.09, 0.05] });
  /* muralla: sigue el terreno; sillar de toba oscurecido */
  const tm = () => { const v = R(0.62, 0.8); return { muro: [v, v * 0.94, v * 0.84], teja: [0.8, 0.76, 0.72, 0] }; };
  instanciar('muro', W.muros.map(m => ({ m: matriz(m.x, suelo(m.x, m.z, 10) - 1.5, m.z, -m.ang, 0.83, 0.86, 0.8), ...tm() })), { sinTeja: true, ligeras: [[3, 0], [4, 0]], cortes: [0.11, 0.06] });
  instanciar('puerta', W.puertas.map(m => ({ m: matriz(m.x, suelo(m.x, m.z, 8) - 1.2, m.z, -m.ang, 0.83, 0.86, 0.8), ...tm() })), { sinTeja: true, ligeras: [[3, 0], [4, 0]], cortes: [0.11, 0.06] });
  instanciar('torre', W.torres.map(m => ({ m: matriz(m.x, suelo(m.x, m.z, 4) - 1.5, m.z, R(0, 0.2) - Math.atan2(m.z, m.x), 0.8, 0.72, 0.8), ...tm() })), { sinTeja: true, ligeras: [[3, 0], [4, 0]], cortes: [0.11, 0.06] });
  /* edificios singulares */
  const UNICO = { roma: { templo_arx: ['templo', 1.22], curia: ['foro', 0.78], vesta: ['vesta', 0.85], mercado: ['mercado', 0.8], almacen_g: ['aserradero', 1.25], cuartel: ['cuartel', 0.95] },
    grecia: { templo_arx: ['grie_templo', 1.55], curia: ['grie_templo', 0.95], mercado: ['mercado', 0.8], almacen_g: ['aserradero', 1.25] },
    punica: { templo_arx: ['cart_templo', 1.45], curia: ['cart_templo', 0.9], mercado: ['mercado', 0.8], almacen_g: ['aserradero', 1.25] } }[CULTURA];
  const pielU = CULTURA === 'roma' ? { muro: [0.93, 0.86, 0.76], teja: [0.86, 0.8, 0.76, 0.15] } : CULTURA === 'grecia' ? { muro: [1, 0.97, 0.9], teja: [1.05, 0.98, 0.9, 0.5] } : { muro: [0.96, 0.86, 0.68], teja: [0.9, 0.86, 0.8, 0.4] };
  for (const u of W.unicos) { const d = UNICO[u.pieza]; if (!d) continue; instanciar(d[0], [{ m: matriz(u.x, altura(u.x, u.z) - (u.pieza === 'templo_arx' ? 1.5 : 0.2), u.z, -u.ang, d[1]), ...pielU }], tris1(d[0]) > 4000 ? { ligeras: [[0, 0.012]], cortes: [0.12] } : {}); }      // solo los grandes (templo, curia, Vesta, cuartel) tienen versión sin triángulos diminutos
  /* árboles */
  const arb = {}; for (const a of W.arboles) { const y = altura(a.x, a.z); if (y < NIVEL_RIO + 0.6) continue; const v = 0.62 + 0.3 * a.tono, col = a.pieza === 'olivo' ? [v * 1.7, v * 1.7, v * 1.5] : a.pieza === 'cipres' ? [v * 1.5, v * 1.5, v * 1.2] : [v * 1.9, v * 1.75, v * 1.25]; (arb[a.pieza] = arb[a.pieza] || []).push({ m: matriz(a.x, y - 0.3, a.z, a.ang, a.esc, a.esc * (0.9 + 0.3 * a.tono), a.esc), muro: col }); }
  for (const k in arb) instanciar(k, arb[k], { arbol: true, cartel: true, cortes: [+(Q.get('carb') || 0.05)] });

  atrezo(W, rnd, R); humo(W, rnd, R); gente(W, rnd, R);
  window.__mundo = { casas: W.casas.length + W.ladera.length + W.casasFondo.length, ladera: W.ladera.length, caserios: W.patios.length, casasFondo: W.casasFondo.length, bosquetes: W.bosquetes.length, dentro: W.nDentro, fuera: W.casas.length - W.nDentro, granjas: W.granjas.length, arboles: W.arboles.length, tumbas: W.tumbas.length };
}

/* ---------- atrezo: piezas reales pequeñas + bultos por código ---------- */
function atrezo(W, rnd, R) {
  const B = new Bultos(), real = {}, pon = (k, x, z, giro, esc = 0.9) => (real[k] = real[k] || []).push({ m: matriz(x, altura(x, z), z, giro, esc) });
  const TELAS = ['#a3392b', '#c2932f', '#3f5d80', '#d6cbb0', '#7d8a4a', '#b8632e', '#d6cbb0'];
  /* mercado en el foro: puestos con toldo de tela (lo único de color vivo), mesas, cestos, sacos, vasijas */
  const puesto = (x, z, giro) => { const y = altura(x, z), c = Math.cos(giro), s = Math.sin(giro), en = (u, v) => [x + u * c + v * s, z - u * s + v * c];
    for (const [u, v] of [[-2.4, -1.7], [2.4, -1.7], [-2.4, 1.7], [2.4, 1.7]]) { const p = en(u, v); B.caja(0.22, v < 0 ? 3.9 : 3.1, 0.22, p[0], y + (v < 0 ? 1.95 : 1.55), p[1], '#5a4632'); }
    B.caja(5.6, 0.08, 4.3, x, y + 3.55, z, TELAS[Math.floor(rnd() * TELAS.length)], giro, 0.2);
    pon('prop_mesa', x, z, giro, 0.8); const q = en(R(-3.4, 3.4), 2.6); pon(rnd() < 0.5 ? 'prop_cesto' : 'prop_sacos', q[0], q[1], R(0, 6), 1); const q2 = en(R(-2, 2), -2.4); pon(rnd() < 0.5 ? 'prop_vaso' : 'prop_caja', q2[0], q2[1], R(0, 6), 1); };
  for (let i = 0; i < 9; i++) { const p = W.enF(8 + i % 5 * 8.2 + R(-1, 1), -FORO_M[1] + 9 + Math.floor(i / 5) * 9.5 + R(-1, 1)); puesto(p[0], p[1], -FORO_GIRO + R(-0.12, 0.12)); }
  for (let i = 0; i < 5; i++) { const p = W.enF(-44 + i * 8 + R(-1, 1), FORO_M[1] - 7 + R(-1, 1)); puesto(p[0], p[1], -FORO_GIRO + Math.PI + R(-0.1, 0.1)); }
  /* carros en las vías, pozos en plazuelas, paja y sacos por la ciudad */
  const enCalle = (c, t, lat) => { const i = Math.min(c.p.length - 2, Math.floor(t * (c.p.length - 1))), a = c.p[i], b = c.p[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]); return { x: a[0] - Math.sin(ang) * lat, z: a[1] + Math.cos(ang) * lat, ang }; };
  for (const c of W.calles.slice(0, 4).concat(W.caminos.slice(0, 4))) for (let i = 0; i < 3; i++) { const q = enCalle(c, R(0.05, 0.6), R(-1.5, 1.5)); pon('prop_carreta', q.x, q.z, -q.ang + (rnd() < 0.5 ? Math.PI : 0), 1.15); }
  { const p = W.enF(-12, -6); pon('prop_pozo', p[0], p[1], 0.3, 1); }
  for (const h of W.huertos) { const v = rnd(); if (v < 0.035) pon('prop_pozo', h.x, h.z, R(0, 6), 0.95); else if (v < 0.09) pon('prop_paja', h.x, h.z, R(0, 6), 0.9); else if (v < 0.12) pon('prop_cajas', h.x, h.z, R(0, 6), 1);
    else if (v < 0.2) { const g = R(0, 3.1), L = R(5, 8), c = Math.cos(g), s = Math.sin(g), y = altura(h.x, h.z);                       // ropa tendida
      B.caja(0.14, 2.7, 0.14, h.x - c * L / 2, y + 1.35, h.z + s * L / 2, '#5a4632'); B.caja(0.14, 2.7, 0.14, h.x + c * L / 2, y + 1.35, h.z - s * L / 2, '#5a4632'); B.caja(L, 0.04, 0.04, h.x, y + 2.6, h.z, '#3a3026', g);
      for (let k = 0; k < 4; k++) { const u = (k + 0.5) / 4 - 0.5 + R(-0.05, 0.05); B.caja(L / 5.5, R(1, 1.6), 0.05, h.x + c * L * u, y + 1.95, h.z - s * L * u, ['#d9d0bc', '#cfc3a6', '#b9a988', '#9a5a44', '#7c8a9a'][Math.floor(rnd() * 5)], g); } } }
  /* granjas: corral con cerca, ganado, pajares y era */
  for (const g of W.granjas) { const t = R(0, 6.28), cx = g.x + Math.cos(t) * 26, cz = g.z + Math.sin(t) * 26, y = altura(cx, cz), giro = R(0, 3), c = Math.cos(giro), s = Math.sin(giro), w = R(12, 18), d = R(9, 13);
    for (const [u, v, l, o] of [[0, -d / 2, w, 0], [0, d / 2, w, 0], [-w / 2, 0, d, 1], [w / 2, 0, d, 1]]) for (const hh of [0.7, 1.3]) B.caja(l, 0.14, 0.14, cx + u * c + v * s, y + hh, cz - u * s + v * c, '#6a5540', giro + o * Math.PI / 2);
    for (let i = 0; i < 6; i++) { const u = R(-w / 2 + 1.5, w / 2 - 1.5), v = R(-d / 2 + 1.5, d / 2 - 1.5), x = cx + u * c + v * s, z = cz - u * s + v * c, ga = R(0, 6.28), col = rnd() < 0.6 ? '#cfc6b2' : '#6b5644'; B.caja(1.7, 0.95, 0.8, x, y + 1.05, z, col, ga); B.caja(0.6, 0.55, 0.5, x + Math.cos(ga) * 1.1, y + 1.45, z - Math.sin(ga) * 1.1, col, ga); for (const lx of [-0.6, 0.6]) B.caja(0.16, 0.7, 0.5, x + Math.cos(ga) * lx, y + 0.35, z - Math.sin(ga) * lx, '#4a3c30', ga); }
    for (let i = 0; i < 2 + Math.floor(rnd() * 3); i++) { const a = t + 2 + i * 0.5, r = R(20, 30); pon('prop_paja', g.x + Math.cos(a) * r, g.z + Math.sin(a) * r, R(0, 6), R(1.2, 1.9)); } }
  /* necrópolis: cipos, edículas y túmulos junto a la vía */
  for (const t of W.tumbas) { const y = altura(t.x, t.z), e = t.esc; if (t.clase === 'cipo') { B.caja(1.5 * e, 0.5, 1.5 * e, t.x, y + 0.25, t.z, '#8d8576', -t.ang); B.caja(0.9 * e, 2.6 * e, 0.9 * e, t.x, y + 0.5 + 1.3 * e, t.z, '#a59c8a', -t.ang); }
    else if (t.clase === 'edicula') { B.caja(4 * e, 3 * e, 4.8 * e, t.x, y + 1.5 * e, t.z, '#9c907c', -t.ang); B.cono(3.5 * e, 1.5 * e, 4, t.x, y + 3.75 * e, t.z, '#8a6a58', 1, -t.ang + Math.PI / 4); }
    else { B.add(new THREE.CylinderGeometry(6 * e, 6.2 * e, 1.3, 14), '#948a78', new THREE.Matrix4().makeTranslation(t.x, y + 0.5, t.z)); B.add(new THREE.SphereGeometry(5.9 * e, 12, 6, 0, 6.3, 0, 1.57), '#8a8256', new THREE.Matrix4().compose(new THREE.Vector3(t.x, y + 1.1, t.z), _q.identity(), new THREE.Vector3(1, 0.55, 1))); } }
  /* puente de madera sobre pilotes */
  { const P = W.PUENTE, c = Math.cos(P.ang), s = Math.sin(P.ang), L = 84, y = NIVEL_RIO + 4.2; B.caja(L, 0.5, 8.4, P.x, y, P.z, '#6e5a44', -P.ang);
    for (const l of [-4, 4]) B.caja(L, 0.22, 0.22, P.x - s * l, y + 1.5, P.z + c * l, '#5c4a38', -P.ang);
    for (let u = -L / 2 + 3; u <= L / 2 - 3; u += 7) for (const l of [-3.6, 3.6]) { const x = P.x + c * u - s * l, z = P.z + s * u + c * l; B.caja(0.5, 8.5, 0.5, x, y - 3.4, z, '#4e4032', -P.ang); B.caja(0.22, 1.6, 0.22, x - s * Math.sign(l) * 0.4, y + 0.8, z + c * Math.sign(l) * 0.4, '#5c4a38', -P.ang); } }
  /* barcas y cañas del río */
  for (let i = 0; i < RIO.length - 1; i++) { const p = RIO[i], q = RIO[i + 1]; if (Math.abs(p[0]) > 900) continue; const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
    if (i % 9 === 4 && rnd() < 0.7) { const l = R(-12, 12), x = p[0] - Math.sin(ang) * l, z = p[1] + Math.cos(ang) * l, m = new THREE.Matrix4().compose(new THREE.Vector3(x, NIVEL_RIO + 0.15, z), _q.setFromEuler(_e.set(0, -ang + R(-0.4, 0.4), 0)), new THREE.Vector3(3.6, 0.75, 1.15)); B.add(new THREE.SphereGeometry(1, 10, 5, 0, 6.3, 1.45, 1.7), '#4a3a2c', m); B.caja(1.2, 0.12, 2, x, NIVEL_RIO + 0.35, z, '#6a5846', -ang); }
    for (const l of [1, -1]) for (let k = 0; k < 3; k++) { if (rnd() < 0.45) continue; const r = R(17, 27), x = p[0] - Math.sin(ang) * r * l + R(-5, 5), z = p[1] + Math.cos(ang) * r * l + R(-5, 5), y = altura(x, z); if (y > NIVEL_RIO + 2.5 || y < NIVEL_RIO - 1.2) continue; for (let j = 0; j < 4; j++) B.cono(R(0.5, 0.9), R(3, 5), 4, x + R(-1.6, 1.6), Math.max(y, NIVEL_RIO) + 1.8, z + R(-1.6, 1.6), rnd() < 0.5 ? '#7c8448' : '#9a9050', 1, R(0, 3)); } }
  /* pájaros: unas pocas uves oscuras sobre la ciudad */
  for (let i = 0; i < 11; i++) { const x = R(-90, 110) + 30, z = R(-260, 60), y = R(95, 150), g = R(-0.5, 0.5), e = R(0.9, 1.5); B.caja(1.6 * e, 0.06, 0.5 * e, x - 0.7 * e, y, z, '#2c2a28', g, 0, 0.45); B.caja(1.6 * e, 0.06, 0.5 * e, x + 0.7 * e, y, z, '#2c2a28', g, 0, -0.45); }
  /* Q1c: barrio en cuesta: muretes de contención al pie de cada bancal y escalones en las sendas que suben a la arx */
  { const rm = azar(31), TOBA = ['#a39883', '#978c76', '#ada28b', '#8d836e'];
    for (const m of W.muretes) for (let i = 0; i < m.length - 1; i++) { const a = m[i], b = m[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 4.5)), ang = Math.atan2(b[1] - a[1], b[0] - a[0]); if (L > 22) continue;
      for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u, hh = 2.1 + rm() * 0.8; B.caja(L / n + 0.3, hh + 1.5, 0.8, x, altura(x, z) + hh / 2 - 0.75, z, TOBA[Math.floor(rm() * 4)], -ang); } }
    for (const c of W.escaleras) for (let i = 1; i < c.p.length - 1; i++) { const a = c.p[i - 1], b = c.p[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), x = c.p[i][0], z = c.p[i][1]; B.caja(1.3, 0.5, 3.1, x, altura(x, z) + 0.06, z, i % 2 ? '#a89c84' : '#9a8e78', -ang); } }
  scene.add(B.malla());
  for (const k in real) instanciar(k, real[k], { sinTeja: true });
}

/* ---------- humo: columnas de bocanadas suaves (un solo dibujo) ---------- */
function humo(W, rnd, R) {
  const cols = W.casas.filter(() => rnd() < 0.085), N = 9, n = cols.length * N, geo = new THREE.InstancedBufferGeometry(); geo.index = new THREE.PlaneGeometry(1, 1).index; geo.setAttribute('position', new THREE.PlaneGeometry(1, 1).attributes.position); geo.setAttribute('uv', new THREE.PlaneGeometry(1, 1).attributes.uv);
  const a = new Float32Array(n * 4), b = new Float32Array(n * 2); let i = 0;
  for (const c of cols) { const y0 = altura(c.x, c.z) + 9, f = R(0.7, 1.3), fase = R(0, 1); for (let k = 0; k < N; k++, i++) { const t = (k + fase) / N; a.set([c.x + 2 + t * t * 46 * f + R(-1, 1), y0 + t * 42 * f, c.z + 1 + t * t * 20 * f + R(-1, 1), (2.6 + t * 15) * f], i * 4); b.set([(1 - t) * 0.78 * (0.4 + 0.6 * Math.min(1, t * 5)), rnd()], i * 2); } }
  geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(a, 4)); geo.setAttribute('aOp', new THREE.InstancedBufferAttribute(b, 2)); geo.instanceCount = n;
  const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uH: { value: new THREE.Color(HORIZ) } },
    vertexShader: 'attribute vec4 aPos; attribute vec2 aOp; varying vec2 vUv; varying vec2 vOp; varying float vD; void main(){ vUv = uv; vOp = aOp; vec4 mv = modelViewMatrix * vec4(aPos.xyz, 1.0); mv.xy += position.xy * aPos.w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec2 vUv; varying vec2 vOp; varying float vD; uniform vec3 uH; void main(){ vec2 d = vUv - 0.5; float r = length(d) * 2.0; float a = smoothstep(1.0, 0.15, r) * vOp.x; a *= 0.75 + 0.25 * sin(vUv.x * 9.0 + vOp.y * 30.0) * sin(vUv.y * 7.0 + vOp.y * 17.0); vec3 c = mix(vec3(0.78, 0.74, 0.70), vec3(0.93, 0.88, 0.80), smoothstep(-0.3, 0.4, d.y - d.x)); c = mix(c, uH, 1.0 - exp(-vD * vD * 0.00000011)); gl_FragColor = vec4(c, a);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }' }));
  m.frustumCulled = false; m.renderOrder = 5; scene.add(m);
}

/* ---------- gente: la ciudadana real de 0 A.D., con sombra alargada pintada a sus pies ---------- */
function gente(W, rnd, R) {
  const u = UN.getUnit('ciudadana'); if (!u) { console.warn('Sin gente real'); return; }
  const sitios = [], ESC = 0.74;
  for (let i = 0; i < 40; i++) { const p = W.enF(R(-FORO_M[0] + 3, FORO_M[0] - 3), R(-FORO_M[1] + 3, FORO_M[1] - 3)); sitios.push([p[0], p[1], R(0, 6.28), rnd() < 0.55]); }
  const enCalle = (c, t, lat) => { const i = Math.min(c.p.length - 2, Math.floor(t * (c.p.length - 1))), a = c.p[i], b = c.p[i + 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]); return [a[0] - Math.sin(ang) * lat, a[1] + Math.cos(ang) * lat, -ang + Math.PI / 2 + (rnd() < 0.5 ? Math.PI : 0), true]; };
  for (const c of W.calles.slice(0, 5)) for (let i = 0; i < 6; i++) sitios.push(enCalle(c, R(0, 0.75), R(-c.w * 0.7, c.w * 0.7)));
  for (let i = 0; i < 22; i++) { const c = W.calles[5 + Math.floor(rnd() * (W.calles.length - 5))]; sitios.push(enCalle(c, rnd(), R(-c.w * 0.6, c.w * 0.6))); }
  for (const c of W.caminos.slice(0, 4)) for (let i = 0; i < 4; i++) sitios.push(enCalle(c, R(0, 0.12), R(-c.w * 0.6, c.w * 0.6)));
  const n = sitios.length, TONOS = ['#b9aa8c', '#8f6f4c', '#c9bfa6', '#7d5a48', '#9a8a62', '#a65f43'], grupos = TONOS.map(() => []);
  sitios.forEach((s, i) => grupos[i % TONOS.length].push(s));
  /* Q1c: cerca, la figura real animada; lejos, la figura ligera de 60 triángulos (js/gfx/units.js). Se reparte con la cámara. */
  let cerca = 0; const grs = grupos.map((g, k) => { const geo = UN.instancedGeometry(u, g.length), mat = UN.unitMaterialReal(u, TONOS[k]), im = new THREE.InstancedMesh(geo, mat, g.length), fr = geo.attributes.aFrame, luz = new THREE.InstancedMesh(UN.lightGeometry(u, TONOS[k]), UN.lightMaterial(), g.length); mat.color.set(['#d9cdb4', '#b39676', '#cbbd9f', '#a98468', '#c2b28c', '#b88a6c'][k]);
    const M = new Float32Array(g.length * 16), F = new Float32Array(g.length);
    g.forEach((s, i) => { const e = ESC * R(0.92, 1.08); matriz(s[0], altura(s[0], s[1]) + 0.05, s[1], s[2], e).toArray(M, i * 16); F[i] = UN.frameOf(s[3] ? u.clips.walk : u.clips.idle, R(0, 6)); });
    for (const m of [im, luz]) { m.frustumCulled = false; m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); } return { im, luz, fr, M, F, n: g.length }; });
  otrosRepartos.push((fr, cam, kf) => { cerca = 0; for (const g of grs) { let a = 0, b = 0; const A = g.im.instanceMatrix.array, B = g.luz.instanceMatrix.array;
    for (let i = 0; i < g.n; i++) { const x = g.M[i * 16 + 12], y = g.M[i * 16 + 13] + 1.5, z = g.M[i * 16 + 14]; let fuera = false; for (let j = 0; j < 6; j++) { const pl = fr.planes[j]; if (pl.normal.x * x + pl.normal.y * y + pl.normal.z * z + pl.constant < -3) { fuera = true; break; } } if (fuera) continue;
      if (1.7 * kf / Math.max(1, Math.hypot(x - cam.x, y - cam.y, z - cam.z)) >= 0.0125) { for (let q = 0; q < 16; q++) A[a * 16 + q] = g.M[i * 16 + q]; g.fr.array[a] = g.F[i]; a++; } else { for (let q = 0; q < 16; q++) B[b * 16 + q] = g.M[i * 16 + q]; b++; } }
    g.im.count = a; g.luz.count = b; g.im.instanceMatrix.needsUpdate = g.luz.instanceMatrix.needsUpdate = g.fr.needsUpdate = true; cerca += a; } window.__genteCerca = cerca; });
  /* sombras pintadas (la figura animada por textura de huesos no entra en el mapa de sombras) */
  const c = document.createElement('canvas'); c.width = 32; c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 50, 1, 16, 34, 30); gr.addColorStop(0, 'rgba(0,0,0,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 64);
  const pl = new THREE.PlaneGeometry(1.5, 6.6).rotateX(-Math.PI / 2).translate(0, 0, -2.6), sm = new THREE.InstancedMesh(pl, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), n), giroS = Math.atan2(-SOL.x, -SOL.z);
  sitios.forEach((s, i) => sm.setMatrixAt(i, matriz(s[0], altura(s[0], s[1]) + 0.12, s[1], giroS + Math.PI, 1))); sm.frustumCulled = false; sm.renderOrder = 2; scene.add(sm);
  window.__gente = n;
}

/* ---------- catálogo: todas las piezas en fila, para mirarlas de cerca ---------- */
function catalogo() {
  const lista = (Q.get('piezas') || 'casa,casa_b,casa_c,casa_d,grie_casa,grie_casa_b,grie_casa_c,grie_casa_d,grie_casa_e,cart_casa,cart_casa_b,cart_casa_c').split(',');
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#8f8163' })); piso.receiveShadow = true; scene.add(piso);
  const B = new Bulto(); const ES = +(Q.get('esc') || 1); lista.forEach((k, i) => { const x = (i % 2 - 0.5) * 24, z = (Math.floor(i / 2) - 1) * 27; instanciar(k, [{ m: matriz(x, 0, z, +(Q.get('giro') || 0), ES), ...tinte({ tono: (i * 0.37) % 1, teja: (i * 0.61) % 1 }) }], Q.has('lig') ? { ligeras: [[+Q.get('lig'), 0]], cortes: [99, 99] } : Q.has('cartel') ? { arbol: true, cartel: true, cortes: [99] } : {}); B.caja(0.4, 3.2, 0.4, x, 1.6, z + 10, '#c03020'); B.caja(3, 0.3, 0.3, x + 9, 0.3, z + 10, '#2040c0'); });
  scene.add(B.malla());
}

/* ---------- arranque ---------- */
/* ---------- arranque ---------- */
await construir(); await Promise.all(esperas); hornos.forEach(f => f());
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _ult = new Float32Array(16); let sombraPend = true, cuadros = 0; const reloj = new THREE.Clock();
function repartir(todo) { camara.updateMatrixWorld(); _pm.multiplyMatrices(camara.projectionMatrix, camara.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm); const kf = 1 / Math.tan(camara.fov * Math.PI / 360); for (const l of lotes) l.repartir(_fr, camara.position, kf, todo); for (const f of otrosRepartos) f(_fr, camara.position, kf); }
function cuadro() {
  U.uTiempo.value = Q.has('quieto') ? 0 : reloj.getElapsedTime();
  if (sombraPend) {                                    // sol y edificios quietos: la sombra se calcula una sola vez, con todo en su versión completa
    repartir(true); renderer.shadowMap.needsUpdate = true; renderer.render(scene, camara); sombraPend = false; _ult[0] = NaN;
    window.__medidasConSombra = { triangulos: renderer.info.render.triangles, llamadas: renderer.info.render.calls }; }
  camara.updateMatrixWorld(); _pm.multiplyMatrices(camara.projectionMatrix, camara.matrixWorldInverse); let igual = true; for (let i = 0; i < 16; i++) if (_pm.elements[i] !== _ult[i]) { igual = false; _ult[i] = _pm.elements[i]; }
  if (!igual) repartir(false);                         // la cámara se ha movido: recorte y nivel de detalle de nuevo
  renderer.render(scene, camara); cuadros++;
  if (cuadros === 3) { window.__medidas = { triangulos: renderer.info.render.triangles, llamadas: renderer.info.render.calls, texturas: renderer.info.memory.textures, geometrias: renderer.info.memory.geometries, piezas: cuenta, trisPorPieza: tris, visibles: Object.fromEntries(lotes.map(l => [l.clave + (l.cortes.length ? '' : '*'), l.niv.map(v => v.n).join('/')])), mundo: window.__mundo, gente: window.__gente, genteCerca: window.__genteCerca, sombra: sol.shadow.mapSize.x, cultura: CULTURA, vista: VISTA }; window.__lista = true; if (Q.has('quieto')) return; }
  requestAnimationFrame(cuadro);
}
window.__info = renderer.info; window.__vista = n => { VISTA = n; ponerCamara(); ponerLuz(); sombraPend = true; }; window.__objetivo = () => (VISTAS[VISTA] || VISTAS.cerca).o; window.__camara = camara; window.__sombras = () => { ponerLuz(); sombraPend = true; };      // para la página de prueba: mover la cámara basta; al cambiar de vista, pedir sombras nuevas
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); ponerCamara(); });
cuadro();
