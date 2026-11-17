/* AQVILA — modelos estáticos reales (edificios, murallas y árboles de 0 A.D., Wildfire Games, CC BY-SA 3.0) */
import { THREE } from './models.js';

const BASE = 'assets/static/';
let index = null; const loaded = new Map(), pending = new Map(), texs = new Map(), mats = new Map();

export async function loadStaticIndex() {
  if (index) return index;
  try { const r = await fetch(BASE + 'static.json'); index = r.ok ? await r.json() : {}; } catch (e) { index = {}; console.warn('Sin edificios reales', e); }
  return index;
}
export const getStatic = key => loaded.get(key) || null;

function texture(file, data) {
  if (!texs.has(file)) { const t = new THREE.TextureLoader().load(BASE + file); t.flipY = false; if (!data) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texs.set(file, t); }
  return texs.get(file);
}
/* modo 1: el alfa de la textura marca dónde va el color del bando · modo 2: alfa recortado (hojas) */
function material(file, mode, color, p) {
  p = p || {}; const id = file + '|' + mode + '|' + (mode === 1 ? color : '') + '|' + (p.ao || '');
  if (mats.has(id)) return mats.get(id);
  const m = new THREE.MeshPhongMaterial({ map: file ? texture(file) : null, color: file ? '#ffffff' : '#9a917e', side: THREE.DoubleSide, alphaTest: mode === 2 ? 0.45 : 0, shininess: 22, specular: p.spec ? '#8a8a8a' : '#161616' });
  if (p.ao) { m.aoMap = texture(p.ao, true); m.aoMap.channel = 1; m.aoMapIntensity = 1.15; }          // sombreado horneado del edificio (segundo juego de UV)
  if (p.norm) { m.normalMap = texture(p.norm, true); m.normalScale = new THREE.Vector2(0.8, -0.8); }
  if (p.spec) m.specularMap = texture(p.spec, true);
  if (mode === 1) {
    const team = new THREE.Color(color || '#b3261e');
    m.onBeforeCompile = sh => { sh.uniforms.uTeam = { value: team }; sh.fragmentShader = 'uniform vec3 uTeam;\n' + sh.fragmentShader.replace('#include <map_fragment>', 'vec4 tx = texture2D(map, vMapUv); tx.rgb = mix(uTeam, tx.rgb, tx.a); diffuseColor.rgb *= tx.rgb;'); };
    m.customProgramCacheKey = () => 'aqvila-static-team';
  }
  mats.set(id, m); return m;
}

/* Formato antiguo (sin índices, a 32 bits): lo siguen usando las piezas hechas con build_static.mjs sin pasar por indexar_static.mjs */
function partesAntiguas(buf, u) {
  const n = u.verts, P = new Float32Array(buf, u.off[0], n * 3), N = new Int8Array(buf, u.off[1], n * 3), UV = new Float32Array(buf, u.off[2], n * 2), UV1 = u.off[3] !== undefined ? new Float32Array(buf, u.off[3], n * 2) : null;
  return u.groups.map(g => { const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P.subarray(g.start * 3, (g.start + g.count) * 3), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N.subarray(g.start * 3, (g.start + g.count) * 3), 3, true)); geo.setAttribute('uv', new THREE.BufferAttribute(UV.subarray(g.start * 2, (g.start + g.count) * 2), 2)); if (UV1 && g.aoFile) geo.setAttribute('uv1', new THREE.BufferAttribute(UV1.subarray(g.start * 2, (g.start + g.count) * 2), 2));
    geo.computeBoundingSphere(); return { geo: geo, file: g.file, mode: g.mode, maps: { ao: UV1 && g.aoFile, norm: g.normFile, spec: g.specFile } }; });
}
/* Formato indexado (tools/indexar_static.mjs): vértices únicos a 16 bits dentro de la caja de la pieza + índices. Se desescalan una vez a decimales. */
function partesIndexadas(buf, u) {
  const nv = u.nv, q = u.q, O = u.off, tieneUV1 = O.length > 4;
  const P16 = new Uint16Array(buf, O[0], nv * 3), N = new Int8Array(buf, O[1], nv * 3), T16 = new Uint16Array(buf, O[2], nv * 2), T1 = tieneUV1 ? new Uint16Array(buf, O[3], nv * 2) : null;
  const I = u.i32 ? new Uint32Array(buf, O[O.length - 1]) : new Uint16Array(buf, O[O.length - 1]);
  const P = new Float32Array(nv * 3), UV = new Float32Array(nv * 2), UV1 = T1 ? new Float32Array(nv * 2) : null, k = 1 / 65535;
  for (let i = 0; i < nv * 3; i++) P[i] = q[i % 3] + P16[i] * k * q[3 + i % 3];
  for (let i = 0; i < nv * 2; i++) { UV[i] = q[6 + i % 2] + T16[i] * k * q[8 + i % 2]; if (T1) UV1[i] = q[10 + i % 2] + T1[i] * k * q[12 + i % 2]; }
  const pos = new THREE.BufferAttribute(P, 3), nor = new THREE.BufferAttribute(N, 3, true), uv = new THREE.BufferAttribute(UV, 2), uv1 = UV1 ? new THREE.BufferAttribute(UV1, 2) : null;
  return u.groups.map(g => { const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', pos); geo.setAttribute('normal', nor); geo.setAttribute('uv', uv); if (uv1 && g.aoFile) geo.setAttribute('uv1', uv1);
    geo.setIndex(new THREE.BufferAttribute(I.subarray(g.start, g.start + g.count), 1)); geo.computeBoundingSphere();
    return { geo: geo, file: g.file, mode: g.mode, maps: { ao: uv1 && g.aoFile, norm: g.normFile, spec: g.specFile } }; });
}

export function loadStatic(key) {
  if (loaded.has(key)) return Promise.resolve(loaded.get(key));
  if (pending.has(key)) return pending.get(key);
  const p = (async () => {
    await loadStaticIndex(); const u = index[key]; if (!u) return null;
    const buf = await fetch(BASE + key + '.bin').then(r => r.arrayBuffer());
    const parts = u.nv === undefined ? partesAntiguas(buf, u) : partesIndexadas(buf, u);
    const st = { key: key, parts: parts, bb: u.bb }; loaded.set(key, st); return st;
  })().catch(e => { console.warn('No se pudo cargar ' + key, e); return null; });
  pending.set(key, p); return p;
}
export function preloadStatic(keys) { return loadStaticIndex().then(() => Promise.all(keys.filter(k => index[k] && !k.startsWith('__')).map(loadStatic))); }

/* Un ejemplar */
export function staticMesh(key, color) {
  const st = loaded.get(key); if (!st) return null; const g = new THREE.Group();
  for (const p of st.parts) g.add(new THREE.Mesh(p.geo, material(p.file, p.mode, color, p.maps)));
  return g;
}
/* Muchos ejemplares (árboles, casas, tramos de muralla): matrices = lista de THREE.Matrix4 */
export function staticInstances(key, matrices, color) {
  const st = loaded.get(key); if (!st || !matrices.length) return null; const g = new THREE.Group();
  for (const p of st.parts) { const im = new THREE.InstancedMesh(p.geo, material(p.file, p.mode, color, p.maps), matrices.length); matrices.forEach((m, i) => im.setMatrixAt(i, m)); im.frustumCulled = false; g.add(im); }
  return g;
}

/* Cultura de cada bando -> piezas de 0 A.D. propias de su ciudad (las usan el mapa y la batalla; etruscos, campanos y mamertinos siguen con lo romano) */
export const CULTURA = { cartago: 'cart', epiro: 'grie', macedonia: 'grie', aquea: 'grie', siracusa: 'grie', akragas: 'grie', griegos: 'grie', galos: 'galo', iberos: 'iber' };
export const PIEZA_CULTURA = { cart: 'cart_templo', grie: 'grie_templo', galo: 'galo_centro', iber: 'iber_centro' };
/* pieza central de la ciudad de un bando (por id de facción o por su nombre), o null si usa lo romano */
export function piezaCultura(bando) { const D = window.DATA; let id = D.FACTIONS[bando] ? bando : Object.keys(D.FACTIONS).find(k => D.FACTIONS[k].n === bando); return PIEZA_CULTURA[CULTURA[id]] || null; }
