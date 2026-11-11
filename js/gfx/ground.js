/* AQVILA — suelo con texturas reales mezcladas (hierba, hierba seca, tierra, empedrado) y agua animada.
   Texturas de 0 A.D. (Wildfire Games, CC BY-SA 3.0). */
import { THREE } from './models.js';
import { loadStaticIndex } from './statics.js';

const BASE = 'assets/static/'; let extra = null; const cache = new Map();
export async function loadGroundTextures() { const idx = await loadStaticIndex(); extra = idx.__extra || {}; for (const k in extra) tex(k); return extra; }
function tex(name, srgb) {
  if (!extra || !extra[name]) return null;
  if (!cache.has(name)) { const t = new THREE.TextureLoader().load(BASE + extra[name]); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (!/norm/.test(name)) t.colorSpace = THREE.SRGBColorSpace; cache.set(name, t); }
  return cache.get(name);
}
export const hasGround = () => !!(extra && extra.terr_grass);

/* Material de suelo. El color de vértice son PESOS: r = hierba, g = tierra, b = empedrado; lo que falta hasta 1 = hierba seca.
   Sin texturas, los pesos se convierten en colores lisos. */
export function groundMaterial(scale) {
  if (!hasGround()) return null;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { tGrass: { value: tex('terr_grass') }, tDirt: { value: tex('terr_dirt') }, tPave: { value: tex('terr_paving') }, tDry: { value: tex('terr_dry') }, uScale: { value: scale || 0.05 } });
    sh.vertexShader = 'varying vec2 vXZ;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vXZ = (modelMatrix * vec4(position, 1.0)).xz;');
    sh.fragmentShader = 'uniform sampler2D tGrass, tDirt, tPave, tDry; uniform float uScale; varying vec2 vXZ;\n' + sh.fragmentShader.replace('#include <color_fragment>', `
      vec3 w = clamp(vColor.rgb, 0.0, 1.0); float w4 = max(0.0, 1.0 - w.r - w.g - w.b); vec2 u = vXZ * uScale;
      vec3 terr = texture2D(tGrass, u).rgb * w.r + texture2D(tDirt, u * 0.8).rgb * w.g + texture2D(tPave, u * 1.6).rgb * w.b + texture2D(tDry, u).rgb * w4;
      float macro = 0.75 + 0.5 * texture2D(tGrass, u * 0.061).g;            // variación a gran escala para que no se note la repetición
      diffuseColor.rgb *= terr * macro * 1.05;`);
  };
  return m;
}
const FLAT = [new THREE.Color('#7c9a48'), new THREE.Color('#b59a68'), new THREE.Color('#c9bea4'), new THREE.Color('#a7a45c')];
/* Aplica los pesos a la geometría y devuelve el material adecuado */
export function applyGround(geo, weights, scale) {
  const m = groundMaterial(scale);
  if (!m) { const c = new THREE.Color(); for (let i = 0; i < weights.length; i += 3) { const r = weights[i], g = weights[i + 1], b = weights[i + 2], d = Math.max(0, 1 - r - g - b); c.setRGB(FLAT[0].r * r + FLAT[1].r * g + FLAT[2].r * b + FLAT[3].r * d, FLAT[0].g * r + FLAT[1].g * g + FLAT[2].g * b + FLAT[3].g * d, FLAT[0].b * r + FLAT[1].b * g + FLAT[2].b * b + FLAT[3].b * d); weights[i] = c.r; weights[i + 1] = c.g; weights[i + 2] = c.b; } }
  geo.setAttribute('color', new THREE.BufferAttribute(weights, 3)); geo.computeVertexNormals();
  return m || new THREE.MeshLambertMaterial({ vertexColors: true });
}

/* Agua: dos capas de normales que se deslizan en sentidos distintos. Devuelve un grupo con userData.tick(t) */
export function waterMesh(w, h, rep) {
  const g = new THREE.Group(), n1 = tex('water_norm'), n2 = tex('water_norm2');
  const mk = (n, color, op, y) => { const t = n ? n.clone() : null; if (t) { t.repeat.set(rep || 40, (rep || 40) * h / w); t.needsUpdate = true; }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhongMaterial({ color: color, transparent: true, opacity: op, shininess: 140, specular: '#dff4ff', normalMap: t, normalScale: new THREE.Vector2(0.9, 0.9), depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = y; g.add(m); return t; };
  const a = mk(n1, '#1d6a8f', 0.88, 0), b = mk(n2, '#3f9bbf', 0.35, 0.05);
  g.userData.tick = t => { if (a) a.offset.set(t * 0.012, t * 0.007); if (b) b.offset.set(-t * 0.009, t * 0.013); };
  return g;
}
