/* Maqueta Q1b2 — segunda maqueta 3D de la ciudad itálica. Página independiente: NO toca el juego.
   Parámetros por URL: ?cultura=roma|grecia|punica &vista=cerca|lejos|calle|catalogo &sombra=4096 &cam=x,y,z,tx,ty,tz,fov
   REAL (arte de 0 A.D., Wildfire Games, CC BY-SA 3.0): todos los edificios, casas, muralla, árboles, atrezo (carreta, pozo, paja,
   sacos, cestos, cajas, mesas, vasijas), la gente (ciudadana) y las texturas del suelo y del agua.
   INVENTADO por código: el plano, el relieve, el río, las máscaras del suelo, la luz, el humo, los toldos de tela, las tumbas,
   las cercas, el puente, las barcas, las cañas y los pájaros. Los tintes (toba, encalado, teja vieja) retiñen piezas reales. */
import { THREE } from '/js/gfx/models.js';
import { preloadStatic, getStatic } from '/js/gfx/statics.js';
import * as UN from '/js/gfx/units.js';
import { generar, altura, azar, ARX, FORO, FORO_GIRO, FORO_M, RIO, NIVEL_RIO, fracMuro, distRio } from './mundo.js';
import { crearSuelo, crearRio, crearCielo, texturaRuido, GLSL_NUBES } from './suelo.js';

const Q = new URLSearchParams(location.search), CULTURA = Q.get('cultura') || 'roma', VISTA = Q.get('vista') || 'cerca';
const PIEZAS = 'gobierno/maquetas/piezas/', ASSETS = 'assets/static/';
const HORIZ = '#cdc3b2';
const lienzo = document.getElementById('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || 0.92); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  const id = [p.file, p.mode, p.maps.ao || '', o.arbol ? 'a' : '', o.sinTeja ? 's' : ''].join('|'); if (mats.has(id)) return mats.get(id);
  const m = new THREE.MeshLambertMaterial({ map: textura(p.file), side: THREE.DoubleSide, alphaTest: p.mode === 2 ? 0.45 : 0 });
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
/* lista: [{m: Matrix4, muro: [r,g,b], teja: [r,g,b,cal]}] */
const cuenta = {}, tris = {};
function instanciar(clave, lista, o = {}) {
  const st = pieza(clave); if (!st || !lista.length) { if (!st) console.warn('Falta la pieza ' + clave); return null; }
  const g = new THREE.Group(), n = lista.length, aM = new Float32Array(n * 3), aT = new Float32Array(n * 4);
  lista.forEach((e, i) => { aM.set(e.muro || [1, 1, 1], i * 3); aT.set(e.teja || [1, 1, 1, 0], i * 4); });
  for (const p of st.parts) { const geo = p.geo.clone(); geo.setAttribute('aMuro', new THREE.InstancedBufferAttribute(aM, 3)); geo.setAttribute('aTeja', new THREE.InstancedBufferAttribute(aT, 4));
    const mat = material(p, o), im = new THREE.InstancedMesh(geo, mat, n); lista.forEach((e, i) => im.setMatrixAt(i, e.m)); im.frustumCulled = false; im.castShadow = o.sombra !== false; im.receiveShadow = true; if (mat.userData.prof) im.customDepthMaterial = mat.userData.prof; g.add(im);
    cuenta[clave] = (cuenta[clave] || 0) + 0; }
  cuenta[clave] = (cuenta[clave] || 0) + n; tris[clave] = (tris[clave] || 0) + n * st.parts.reduce((s, p) => s + p.geo.attributes.position.count / 3, 0); scene.add(g); return g;
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
  sol.position.set(v.o[0], 0, cz).addScaledVector(SOL, 1500); sol.target.position.set(v.o[0], 0, cz); sol.castShadow = true; const s = sol.shadow; s.mapSize.set(+(Q.get('sombra') || 4096), +(Q.get('sombra') || 4096)); s.camera.left = -R; s.camera.right = R; s.camera.top = R; s.camera.bottom = -R; s.camera.near = 600; s.camera.far = 2400; s.bias = -0.0006; s.normalBias = 0.5; s.radius = 2.2; s.camera.updateProjectionMatrix();
  scene.add(sol, sol.target, hemi); }

/* ---------- construcción ---------- */
async function construir() {
  const claves = ['casa', 'almacen', 'aserradero', 'mercado', 'foro', 'vesta', 'templo', 'cuartel', 'granja', 'muro', 'torre', 'puerta', 'cipres', 'olivo', 'pino', 'algarrobo', 'grie_templo', 'cart_templo', 'barco'];
  await Promise.all([preloadStatic(claves), cargarPiezas(), UN.preload(['ciudadana'])]);
  const T = {}; for (const k of ['terr_grass', 'terr_dry', 'terr_dirt', 'terr_paving', 'terr_farm', 'terr_sand']) T[k] = textura(k + '.webp'); T.water_norm = textura('water_norm.webp', true);
  U.uRuido.value = texturaRuido();
  ponerCamara(); ponerLuz(); scene.add(crearCielo(SOL, HORIZ));
  if (VISTA === 'catalogo') return catalogo();
  const W = generar(7), rnd = azar(99), R = (a, b) => a + (b - a) * rnd();
  scene.add(crearSuelo(W, T, U)); scene.add(crearRio(T, U));

  /* casas */
  const porPieza = {}, EC_ = CULTURA === 'punica' ? 1.17 : CULTURA === 'grecia' ? 1.06 : 1;      // las casas griegas y púnicas de 0 A.D. son algo menores
  for (const c of W.casas) { const k = CASAS[CULTURA === 'roma' ? (c.tipo < 0.1 ? 0 : 1 + Math.floor((c.tipo - 0.1) / 0.9 * 3) % 3) : Math.floor(c.tipo * CASAS.length) % CASAS.length], t = tinte(c), y = suelo(c.x, c.z, 6) - 0.25, giro = -c.ang + (c.lado > 0 ? Math.PI : 0) + (FRENTE[k] || 0);
    (porPieza[k] = porPieza[k] || []).push({ m: matriz(c.x, y, c.z, giro, c.ex * 0.97 * EC_, (c.ex + c.ez) / 2 * (0.94 + 0.2 * c.teja) * EC_, c.ez * 0.97 * EC_), ...t }); }
  for (const k in porPieza) instanciar(k, porPieza[k]);
  /* granjas */
  instanciar('granja', W.granjas.map(g => ({ m: matriz(g.x, suelo(g.x, g.z, 9) - 0.2, g.z, g.ang, g.esc), ...tinte(g) })));
  /* muralla: sigue el terreno; sillar de toba oscurecido */
  const tm = () => { const v = R(0.62, 0.8); return { muro: [v, v * 0.94, v * 0.84], teja: [0.8, 0.76, 0.72, 0] }; };
  instanciar('muro', W.muros.map(m => ({ m: matriz(m.x, suelo(m.x, m.z, 10) - 1.5, m.z, -m.ang, 0.83, 0.86, 0.8), ...tm() })), { sinTeja: true });
  instanciar('puerta', W.puertas.map(m => ({ m: matriz(m.x, suelo(m.x, m.z, 8) - 1.2, m.z, -m.ang, 0.83, 0.86, 0.8), ...tm() })), { sinTeja: true });
  instanciar('torre', W.torres.map(m => ({ m: matriz(m.x, suelo(m.x, m.z, 4) - 1.5, m.z, R(0, 0.2) - Math.atan2(m.z, m.x), 0.8, 0.72, 0.8), ...tm() })), { sinTeja: true });
  /* edificios singulares */
  const UNICO = { roma: { templo_arx: ['templo', 1.22], curia: ['foro', 0.78], vesta: ['vesta', 0.85], mercado: ['mercado', 0.8], almacen_g: ['aserradero', 1.25], cuartel: ['cuartel', 0.95] },
    grecia: { templo_arx: ['grie_templo', 1.55], curia: ['grie_templo', 0.95], mercado: ['mercado', 0.8], almacen_g: ['aserradero', 1.25] },
    punica: { templo_arx: ['cart_templo', 1.45], curia: ['cart_templo', 0.9], mercado: ['mercado', 0.8], almacen_g: ['aserradero', 1.25] } }[CULTURA];
  const pielU = CULTURA === 'roma' ? { muro: [0.93, 0.86, 0.76], teja: [0.86, 0.8, 0.76, 0.15] } : CULTURA === 'grecia' ? { muro: [1, 0.97, 0.9], teja: [1.05, 0.98, 0.9, 0.5] } : { muro: [0.96, 0.86, 0.68], teja: [0.9, 0.86, 0.8, 0.4] };
  for (const u of W.unicos) { const d = UNICO[u.pieza]; if (!d) continue; instanciar(d[0], [{ m: matriz(u.x, altura(u.x, u.z) - (u.pieza === 'templo_arx' ? 1.5 : 0.2), u.z, -u.ang, d[1]), ...pielU }]); }
  /* árboles */
  const arb = {}; for (const a of W.arboles) { const y = altura(a.x, a.z); if (y < NIVEL_RIO + 0.6) continue; const v = 0.62 + 0.3 * a.tono, col = a.pieza === 'olivo' ? [v * 1.7, v * 1.7, v * 1.5] : a.pieza === 'cipres' ? [v * 1.5, v * 1.5, v * 1.2] : [v * 1.9, v * 1.75, v * 1.25]; (arb[a.pieza] = arb[a.pieza] || []).push({ m: matriz(a.x, y - 0.3, a.z, a.ang, a.esc, a.esc * (0.9 + 0.3 * a.tono), a.esc), muro: col }); }
  for (const k in arb) instanciar(k, arb[k], { arbol: true });

  atrezo(W, rnd, R); humo(W, rnd, R); gente(W, rnd, R);
  window.__mundo = { casas: W.casas.length, dentro: W.nDentro, fuera: W.casas.length - W.nDentro, granjas: W.granjas.length, arboles: W.arboles.length, tumbas: W.tumbas.length };
}

/* ---------- atrezo: piezas reales pequeñas + bultos por código ---------- */
function atrezo(W, rnd, R) {
  const B = new Bulto(), real = {}, pon = (k, x, z, giro, esc = 0.9) => (real[k] = real[k] || []).push({ m: matriz(x, altura(x, z), z, giro, esc) });
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
  grupos.forEach((g, k) => { const geo = UN.instancedGeometry(u, g.length), mat = UN.unitMaterialReal(u, TONOS[k]), im = new THREE.InstancedMesh(geo, mat, g.length), fr = geo.attributes.aFrame; mat.color.set(['#d9cdb4', '#b39676', '#cbbd9f', '#a98468', '#c2b28c', '#b88a6c'][k]);
    g.forEach((s, i) => { const e = ESC * R(0.92, 1.08); im.setMatrixAt(i, matriz(s[0], altura(s[0], s[1]) + 0.05, s[1], s[2], e)); fr.array[i] = UN.frameOf(s[3] ? u.clips.walk : u.clips.idle, R(0, 6)); }); fr.needsUpdate = true; im.frustumCulled = false; im.receiveShadow = true; scene.add(im); });
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
  const B = new Bulto(); const ES = +(Q.get('esc') || 1); lista.forEach((k, i) => { const x = (i % 2 - 0.5) * 24, z = (Math.floor(i / 2) - 1) * 27; instanciar(k, [{ m: matriz(x, 0, z, +(Q.get('giro') || 0), ES), ...tinte({ tono: (i * 0.37) % 1, teja: (i * 0.61) % 1 }) }]); B.caja(0.4, 3.2, 0.4, x, 1.6, z + 10, '#c03020'); B.caja(3, 0.3, 0.3, x + 9, 0.3, z + 10, '#2040c0'); });
  scene.add(B.malla());
}

/* ---------- arranque ---------- */
await construir(); await Promise.all(esperas);
let cuadros = 0; const reloj = new THREE.Clock();
function cuadro() {
  U.uTiempo.value = Q.has('quieto') ? 0 : reloj.getElapsedTime(); renderer.render(scene, camara); cuadros++;
  if (cuadros === 2) { window.__medidasConSombra = { triangulos: renderer.info.render.triangles, llamadas: renderer.info.render.calls }; renderer.shadowMap.autoUpdate = false; }       // sol y edificios quietos: la sombra se calcula una vez
  if (cuadros === 4) { window.__medidas = { triangulos: renderer.info.render.triangles, llamadas: renderer.info.render.calls, texturas: renderer.info.memory.textures, geometrias: renderer.info.memory.geometries, piezas: cuenta, trisPorPieza: tris, mundo: window.__mundo, gente: window.__gente, cultura: CULTURA, vista: VISTA }; window.__lista = true; if (Q.has('quieto')) return; }
  requestAnimationFrame(cuadro);
}
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); ponerCamara(); });
cuadro();
