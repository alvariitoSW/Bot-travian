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

function texture(file) {
  if (!texs.has(file)) { const t = new THREE.TextureLoader().load(BASE + file); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texs.set(file, t); }
  return texs.get(file);
}
/* modo 1: el alfa de la textura marca dónde va el color del bando · modo 2: alfa recortado (hojas) */
function material(file, mode, color) {
  const id = file + '|' + mode + '|' + (mode === 1 ? color : '');
  if (mats.has(id)) return mats.get(id);
  const m = new THREE.MeshLambertMaterial({ map: file ? texture(file) : null, color: file ? '#ffffff' : '#9a917e', side: THREE.DoubleSide, alphaTest: mode === 2 ? 0.45 : 0 });
  if (mode === 1) {
    const team = new THREE.Color(color || '#b3261e');
    m.onBeforeCompile = sh => { sh.uniforms.uTeam = { value: team }; sh.fragmentShader = 'uniform vec3 uTeam;\n' + sh.fragmentShader.replace('#include <map_fragment>', 'vec4 tx = texture2D(map, vMapUv); tx.rgb = mix(uTeam, tx.rgb, tx.a); diffuseColor.rgb *= tx.rgb;'); };
    m.customProgramCacheKey = () => 'aqvila-static-team';
  }
  mats.set(id, m); return m;
}

export function loadStatic(key) {
  if (loaded.has(key)) return Promise.resolve(loaded.get(key));
  if (pending.has(key)) return pending.get(key);
  const p = (async () => {
    await loadStaticIndex(); const u = index[key]; if (!u) return null;
    const buf = await fetch(BASE + key + '.bin').then(r => r.arrayBuffer()), n = u.verts;
    const P = new Float32Array(buf, u.off[0], n * 3), N = new Int8Array(buf, u.off[1], n * 3), UV = new Float32Array(buf, u.off[2], n * 2);
    const parts = u.groups.map(g => { const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(P.subarray(g.start * 3, (g.start + g.count) * 3), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(N.subarray(g.start * 3, (g.start + g.count) * 3), 3, true)); geo.setAttribute('uv', new THREE.BufferAttribute(UV.subarray(g.start * 2, (g.start + g.count) * 2), 2));
      geo.computeBoundingSphere(); return { geo: geo, file: g.file, mode: g.mode }; });
    const st = { key: key, parts: parts, bb: u.bb }; loaded.set(key, st); return st;
  })().catch(e => { console.warn('No se pudo cargar ' + key, e); return null; });
  pending.set(key, p); return p;
}
export function preloadStatic(keys) { return loadStaticIndex().then(() => Promise.all(keys.filter(k => index[k]).map(loadStatic))); }

/* Un ejemplar */
export function staticMesh(key, color) {
  const st = loaded.get(key); if (!st) return null; const g = new THREE.Group();
  for (const p of st.parts) g.add(new THREE.Mesh(p.geo, material(p.file, p.mode, color)));
  return g;
}
/* Muchos ejemplares (árboles, casas, tramos de muralla): matrices = lista de THREE.Matrix4 */
export function staticInstances(key, matrices, color) {
  const st = loaded.get(key); if (!st || !matrices.length) return null; const g = new THREE.Group();
  for (const p of st.parts) { const im = new THREE.InstancedMesh(p.geo, material(p.file, p.mode, color), matrices.length); matrices.forEach((m, i) => im.setMatrixAt(i, m)); im.frustumCulled = false; g.add(im); }
  return g;
}
