/* AQVILA — unidades con modelos reales (arte de 0 A.D., Wildfire Games, CC BY-SA 3.0).
   Cada unidad es una malla con esqueleto cuyas animaciones están horneadas en una textura de matrices:
   el sombreador lee el fotograma de cada soldado, así miles de figuras se animan en una sola llamada. */
import { THREE } from './models.js';

export const UNIT_SCALE = 0.486;          // las figuras de 0 A.D. miden ~3,66 unidades
const BASE = 'assets/units/';
let index = null; const loaded = new Map(), pending = new Map();

const VERT_HEAD = `attribute vec4 aSkinI;\nattribute vec4 aSkinW;\nattribute float aMode;\nattribute float aFrame;\nuniform sampler2D uBones;\nvarying float vMode;
mat4 boneM(float slot, int row) { int x = int(slot + 0.5) * 3; vec4 a = texelFetch(uBones, ivec2(x, row), 0), b = texelFetch(uBones, ivec2(x + 1, row), 0), c = texelFetch(uBones, ivec2(x + 2, row), 0);
  return mat4(vec4(a.x, b.x, c.x, 0.0), vec4(a.y, b.y, c.y, 0.0), vec4(a.z, b.z, c.z, 0.0), vec4(a.w, b.w, c.w, 1.0)); }\n`;
const VERT_NORMAL = `int row = int(aFrame + 0.5);
  mat4 sk = boneM(aSkinI.x, row) * aSkinW.x; if (aSkinW.y > 0.0) sk += boneM(aSkinI.y, row) * aSkinW.y; if (aSkinW.z > 0.0) sk += boneM(aSkinI.z, row) * aSkinW.z; if (aSkinW.w > 0.0) sk += boneM(aSkinI.w, row) * aSkinW.w;
  vec3 objectNormal = normalize(mat3(sk) * normal); vMode = aMode;`;
const FRAG_MAP = `vec4 tx = texture2D(map, vMapUv);
  if (vMode > 1.5 && tx.a < 0.5) discard;
  if (vMode > 0.5 && vMode < 1.5) tx.rgb = mix(uTeam, tx.rgb, tx.a);
  diffuseColor.rgb *= tx.rgb;`;

export async function loadIndex() {
  if (index) return index;
  try { const r = await fetch(BASE + 'units.json'); index = r.ok ? await r.json() : {}; } catch (e) { index = {}; console.warn('Sin modelos reales, se usan los generados por código', e); }
  return index;
}
export const hasUnit = key => !!(index && index[key]);
export const getUnit = key => loaded.get(key) || null;

export function loadUnit(key) {
  if (loaded.has(key)) return Promise.resolve(loaded.get(key));
  if (pending.has(key)) return pending.get(key);
  const p = (async () => {
    await loadIndex(); const u = index[key]; if (!u) return null;
    const [buf, tex] = await Promise.all([fetch(BASE + key + '.bin').then(r => r.arrayBuffer()), new THREE.TextureLoader().loadAsync(BASE + key + '.webp')]);
    const n = u.verts, o = u.off, P = new Float32Array(buf, o[0], n * 3), N = new Int8Array(buf, o[1], n * 3), UV = new Float32Array(buf.slice(o[2], o[2] + n * 8)), SI = new Uint8Array(buf, o[3], n * 4), SW = new Uint8Array(buf, o[4], n * 4), MD = new Uint8Array(buf, o[5], n), CELL = new Uint8Array(buf, o[6], n), A = new Float32Array(buf, o[7], u.slots * 12 * u.frames);
    for (let i = 0; i < n; i++) {                                   // UV de cada pieza -> su celda del atlas
      const r = u.cells[CELL[i]].rect, pad = 0.004; let x = UV[i * 2], y = UV[i * 2 + 1]; x -= Math.floor(x); y -= Math.floor(y); if (UV[i * 2] === 1) x = 1; if (UV[i * 2 + 1] === 1) y = 1;
      UV[i * 2] = r[0] + pad + x * (r[2] - 2 * pad); UV[i * 2 + 1] = r[1] + pad + (1 - y) * (r[3] - 2 * pad);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3, true)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
    g.setAttribute('aSkinI', new THREE.BufferAttribute(SI, 4)); g.setAttribute('aSkinW', new THREE.BufferAttribute(SW, 4, true)); g.setAttribute('aMode', new THREE.BufferAttribute(MD, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 8);
    tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.premultiplyAlpha = false; tex.anisotropy = 4; tex.needsUpdate = true;
    const bones = new THREE.DataTexture(A, u.slots * 3, u.frames, THREE.RGBAFormat, THREE.FloatType); bones.minFilter = bones.magFilter = THREE.NearestFilter; bones.generateMipmaps = false; bones.needsUpdate = true;
    const unit = { key: key, geo: g, tex: tex, bones: bones, clips: u.clips, tris: n / 3, mats: new Map(), height: Math.min(u.maxY, key === 'elefantes' ? 9 : 5.6) * UNIT_SCALE, wide: u.slots > 50 };
    loaded.set(key, unit); return unit;
  })().catch(e => { console.warn('No se pudo cargar la unidad ' + key, e); return null; });
  pending.set(key, p); return p;
}
export function preload(keys) { return loadIndex().then(() => Promise.all([...new Set(keys)].filter(hasUnit).map(loadUnit))); }

export function unitMaterialReal(unit, color) {
  if (unit.mats.has(color)) return unit.mats.get(color);
  const m = new THREE.MeshLambertMaterial({ map: unit.tex, side: THREE.DoubleSide }), team = new THREE.Color(color);
  m.onBeforeCompile = sh => {
    sh.uniforms.uBones = { value: unit.bones }; sh.uniforms.uTeam = { value: team };
    sh.vertexShader = VERT_HEAD + sh.vertexShader.replace('#include <beginnormal_vertex>', VERT_NORMAL).replace('#include <begin_vertex>', 'vec3 transformed = (sk * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = 'uniform vec3 uTeam;\nvarying float vMode;\n' + sh.fragmentShader.replace('#include <map_fragment>', FRAG_MAP);
  };
  m.customProgramCacheKey = () => 'aqvila-real';
  unit.mats.set(color, m); return m;
}

/* Geometría propia de una malla instanciada: comparte los datos y añade el fotograma por soldado */
export function instancedGeometry(unit, cap) {
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv', 'aSkinI', 'aSkinW', 'aMode']) g.setAttribute(k, unit.geo.attributes[k]);
  const fr = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1); fr.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aFrame', fr);
  g.boundingSphere = unit.geo.boundingSphere; return g;
}

/* Fotograma (fila de la textura) de un clip en el instante t */
export function frameOf(clip, t) {
  if (!clip) return 0;
  const k = clip.loop ? (t / clip.dur) % 1 : (t / clip.dur) % 1;
  return clip.start + Math.min(clip.frames - 1, Math.floor(k * clip.frames));
}
export function frameOnce(clip, t) { return clip ? clip.start + Math.min(clip.frames - 1, Math.floor(t / clip.dur * clip.frames)) : 0; }

/* Retrato de una unidad real */
let pr = null; const portraits = new Map();
export function realPortrait(key, color) {
  const unit = loaded.get(key); if (!unit) return ''; const id = key + color; if (portraits.has(id)) return portraits.get(id);
  let url = '';
  try {
    if (!pr) { const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setSize(256, 256, false); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.2;
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6e0', '#4a3a30', 1.7)); const d = new THREE.DirectionalLight('#fff', 3); d.position.set(3, 4, 5); sc.add(d); pr = { r: r, sc: sc, cam: new THREE.PerspectiveCamera(28, 1, 0.1, 50) }; }
    const g = instancedGeometry(unit, 1); g.attributes.aFrame.array[0] = frameOf(unit.clips.idle, 0);
    const m = new THREE.InstancedMesh(g, unitMaterialReal(unit, color), 1); m.setMatrixAt(0, new THREE.Matrix4().makeRotationY(unit.wide ? 0.9 : 0.5).scale(new THREE.Vector3(UNIT_SCALE, UNIT_SCALE, UNIT_SCALE))); m.frustumCulled = false;
    const hh = unit.height, dist = unit.wide ? hh * 2.6 : 4.6; pr.sc.add(m); pr.cam.position.set(unit.wide ? hh * 0.5 : 0, hh * 0.62, dist); pr.cam.lookAt(0, unit.wide ? hh * 0.5 : 1.05, 0); pr.r.render(pr.sc, pr.cam); url = pr.r.domElement.toDataURL('image/png'); pr.sc.remove(m); g.dispose();
  } catch (e) { console.warn('retrato', key, e); url = ''; }
  portraits.set(id, url); return url;
}
