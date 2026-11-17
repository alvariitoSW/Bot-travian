/* AQVILA · maqueta GM44 «soldado Rome II»: carga un soldado (malla con huesos y movimientos horneados en una
   textura) y lo pinta muchas veces en una sola llamada. Cada hombre lleva su cuadro, su tinte y su suciedad. */
import * as THREE from '../../../js/vendor/three.module.min.js';
export { THREE };
const AQUI = new URL('./datos/', import.meta.url).href;

const V_CAB = `attribute vec4 aSkinI; attribute vec4 aSkinW; attribute float aSet;
attribute vec3 aCuadro; attribute vec4 aVar; attribute float aMuestra;
uniform sampler2D uHuesos; uniform vec4 uCab; varying vec4 vVar; varying vec3 vObj;
mat4 hueso(float h, int f) { int x = int(h + 0.5) * 3; vec4 a = texelFetch(uHuesos, ivec2(x, f), 0), b = texelFetch(uHuesos, ivec2(x + 1, f), 0), c = texelFetch(uHuesos, ivec2(x + 2, f), 0);
  return mat4(vec4(a.x, b.x, c.x, 0.0), vec4(a.y, b.y, c.y, 0.0), vec4(a.z, b.z, c.z, 0.0), vec4(a.w, b.w, c.w, 1.0)); }
mat4 piel(int f) { mat4 m = hueso(aSkinI.x, f) * aSkinW.x; if (aSkinW.y > 0.0) m += hueso(aSkinI.y, f) * aSkinW.y; if (aSkinW.z > 0.0) m += hueso(aSkinI.z, f) * aSkinW.z; if (aSkinW.w > 0.0) m += hueso(aSkinI.w, f) * aSkinW.w; return m; }
`;
const V_SK = `mat4 sk = piel(int(aCuadro.x + 0.5)); if (aCuadro.z > 0.001) { mat4 s2 = piel(int(aCuadro.y + 0.5)); sk = sk * (1.0 - aCuadro.z) + s2 * aCuadro.z; }
  /* cada hombre, su cabeza: algo más ancha, más larga o más honda (el yelmo va con ella) */
  float wc = 0.0; if (abs(aSkinI.x - uCab.w) < 0.5) wc += aSkinW.x; if (abs(aSkinI.y - uCab.w) < 0.5) wc += aSkinW.y; if (abs(aSkinI.z - uCab.w) < 0.5) wc += aSkinW.z; if (abs(aSkinI.w - uCab.w) < 0.5) wc += aSkinW.w;
  vec3 fc = vec3(0.94 + 0.12 * fract(aVar.z * 23.7), 0.96 + 0.09 * fract(aVar.y * 31.3), 0.95 + 0.10 * fract(aVar.x * 17.9)); vec3 pcab = uCab.xyz + (position - uCab.xyz) * mix(vec3(1.0), fc, wc);
  float oculto = (aSet > 0.5 && mod(floor(aMuestra / exp2(aSet - 1.0) + 0.001), 2.0) < 0.5) ? 0.0 : 1.0;`;
const F_CAB = `varying vec4 vVar; varying vec3 vObj; uniform sampler2D uMasc; uniform float uHayMasc; uniform vec3 uTela[6]; uniform vec3 uEscudo[4]; uniform vec3 uPiel[2]; uniform vec3 uPelo[2]; uniform vec3 uBarba;
float ruido(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float n = dot(i, vec3(1.0, 57.0, 113.0));
  vec4 a = fract(sin(vec4(n, n + 1.0, n + 57.0, n + 58.0)) * 43758.5453), b = fract(sin(vec4(n + 113.0, n + 114.0, n + 170.0, n + 171.0)) * 43758.5453);
  vec4 m = mix(a, b, f.z); vec2 q = mix(m.xy, m.zw, f.y); return mix(q.x, q.y, f.x); }
`;
const F_COLOR = `#include <map_fragment>
#ifdef USE_MAP
  if (uHayMasc > 0.5) { vec4 mk = texture2D(uMasc, vMapUv);
    float pelo = min(mk.r, mk.b), barba = clamp(min(mk.r, mk.g) * 2.0 - pelo * 2.0, 0.0, 1.0); mk.r = max(mk.r - max(pelo, min(mk.r, mk.g)), 0.0); mk.b = max(mk.b - pelo, 0.0);
    int it = int(floor(vVar.x * 5.999)); vec3 tela = uTela[it];
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * tela * 2.2, mk.r);
    diffuseColor.rgb *= mix(vec3(1.0), mix(uPiel[0], uPiel[1], vVar.y), mk.g);
    float h1 = fract(vVar.z * 17.3 + vVar.y * 5.1), h2 = fract(vVar.x * 13.7 + vVar.w * 9.1); vec3 tono = mix(uPelo[0], uPelo[1], h1 * h1);
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * tono, pelo); diffuseColor.rgb = mix(diffuseColor.rgb, uBarba * tono, barba * smoothstep(0.25, 0.95, h2) * 0.75);
    int ie = int(floor(vVar.w * 3.999)); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * uEscudo[ie] * 2.2, mk.b); }
#endif
  { float alto = vObj.y; float n = ruido(vObj * 9.0 + vVar.z * 31.0) * 0.6 + ruido(vObj * 31.0 + vVar.z * 7.0) * 0.4;
    float barro = smoothstep(0.55, 0.0, alto) * (0.35 + 0.65 * vVar.z) * smoothstep(0.25, 0.75, n + 0.25 * (1.0 - alto));
    float polvo = (0.16 + 0.34 * vVar.z) * smoothstep(0.3, 0.8, n); diffuseColor.rgb *= 0.86 + 0.24 * fract(vVar.z * 7.31 + vVar.x * 3.7);
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.19, 0.14, 0.09), clamp(barro * 0.85 + polvo * 0.5, 0.0, 0.9)); }`;

function parche(mat, u, profundidad) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = V_CAB + sh.vertexShader
      .replace('#include <beginnormal_vertex>', V_SK + '\n vec3 objectNormal = normalize(mat3(sk) * normal);')
      .replace('#include <begin_vertex>', (profundidad ? V_SK : '') + '\n vec3 transformed = (sk * vec4(pcab, 1.0)).xyz * oculto; vVar = aVar; vObj = transformed;');
    if (!profundidad) sh.fragmentShader = F_CAB + sh.fragmentShader.replace('#include <map_fragment>', F_COLOR);
    else sh.fragmentShader = 'varying vec4 vVar; varying vec3 vObj;\n' + sh.fragmentShader;
  };
  mat.customProgramCacheKey = () => 'gm44b-' + (profundidad ? 'p' : 'c');
  return mat;
}
const TELAS = ['#8f2f22', '#a03a26', '#7a2a24', '#983624', '#a8946c', '#94452c'], ESCUDOS = ['#8f2a20', '#9c3324', '#7d2620', '#a23a22'];
async function imagen(url, srgb) { try { const t = await new THREE.TextureLoader().loadAsync(url); t.flipY = false; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; } catch (e) { return null; } }

/* Colores por pueblo: telas, escudos y tono de piel (del más claro al más moreno). */
export const PUEBLOS = { galo: { pelo: [[0.50, 0.42, 0.34], [1.12, 1.02, 0.92]], barba: [0.42, 0.33, 0.20], telas: ['#3f5f7a', '#5a7a4a', '#9a7a3a', '#8a4a30', '#6a5a7a', '#4a6a6a'], escudos: ['#2f5a84', '#3f7a4a', '#b08a2a', '#8f2f22'], piel: [[1.06, 0.99, 0.95], [0.88, 0.78, 0.72]] } };
export async function cargar(nombre, o = PUEBLOS[nombre.split('_')[0]] || {}) {
  const j = await (await fetch(AQUI + nombre + '.json')).json(), buf = await (await fetch(AQUI + nombre + '.bin')).arrayBuffer(), n = j.verts, off = j.off;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(buf, off.pos, n * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buf, off.nor, n * 3), 3, true));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(buf, off.uv, n * 2), 2));
  g.setAttribute('aSkinI', new THREE.BufferAttribute(new Uint8Array(buf, off.si, n * 4), 4)); g.setAttribute('aSkinW', new THREE.BufferAttribute(new Uint8Array(buf, off.sw, n * 4), 4, true));
  g.setAttribute('aSet', new THREE.BufferAttribute(new Uint8Array(buf, off.set, n), 1));
  g.setIndex(new THREE.BufferAttribute(j.idx32 ? new Uint32Array(buf, off.idx, j.tris * 3) : new Uint16Array(buf, off.idx, j.tris * 3), 1));
  const nb = j.huesos.length, anim = new THREE.DataTexture(new Uint16Array(buf, off.anim, j.cuadros * nb * 12), nb * 3, j.cuadros, THREE.RGBAFormat, THREE.HalfFloatType);
  anim.minFilter = anim.magFilter = THREE.NearestFilter; anim.generateMipmaps = false; anim.needsUpdate = true;
  const tx = j.texturas || {}, [color, normal, orm, masc] = await Promise.all([tx.color && imagen(AQUI + tx.color, true), tx.normal && imagen(AQUI + tx.normal), tx.orm && imagen(AQUI + tx.orm), tx.masc && imagen(AQUI + tx.masc)]);
  const u = { uHuesos: { value: anim }, uMasc: { value: masc || null }, uHayMasc: { value: masc ? 1 : 0 }, uTela: { value: (o.telas || TELAS).map(c => new THREE.Color(c)) }, uEscudo: { value: (o.escudos || ESCUDOS).map(c => new THREE.Color(c)) }, uPiel: { value: (o.piel || [[1.10, 1.02, 0.96], [0.76, 0.64, 0.57]]).map(c => new THREE.Vector3(...c)) },
    uPelo: { value: (o.pelo || [[0.45, 0.42, 0.42], [2.3, 1.9, 1.5]]).map(c => new THREE.Vector3(...c)) }, uBarba: { value: new THREE.Vector3(...(o.barba || [0.13, 0.095, 0.07])) }, uCab: { value: new THREE.Vector4(0, 1.5, 0, -9) } };
  { const ic = j.huesos.indexOf('head'), si = g.attributes.aSkinI, sw = g.attributes.aSkinW, po = g.attributes.position; let y0 = 9, z0 = 9, z1 = -9;      // pivote: la base del cráneo
    for (let i = 0; i < n; i++) if (si.getX(i) === ic && sw.getX(i) > 0.9) { y0 = Math.min(y0, po.getY(i)); z0 = Math.min(z0, po.getZ(i)); z1 = Math.max(z1, po.getZ(i)); } if (ic >= 0 && y0 < 9) u.uCab.value.set(0, y0 + 0.03, (z0 + z1) / 2 - 0.02, ic); }
  const mat = parche(new THREE.MeshStandardMaterial({ map: color || null, color: color ? '#ffffff' : '#b8926e', normalMap: normal || null, roughnessMap: orm || null, metalnessMap: orm || null, aoMap: orm || null,
    roughness: orm ? 1 : 0.75, metalness: orm ? 1 : 0, side: THREE.DoubleSide, alphaTest: 0.5 }), u, false);
  if (normal) mat.normalScale.set(1, 1);
  const prof = parche(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }), u, true);
  return { j, geo: g, mat, prof, anim };
}

/* Una tropa: N hombres de un mismo soldado en una llamada de dibujo. */
export function tropa(s, cap) {
  const g = new THREE.BufferGeometry(); for (const k in s.geo.attributes) g.setAttribute(k, s.geo.attributes[k]); g.setIndex(s.geo.index);
  const cu = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3), va = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4), mu = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
  cu.setUsage(THREE.DynamicDrawUsage); mu.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aCuadro', cu); g.setAttribute('aVar', va); g.setAttribute('aMuestra', mu);
  const m = new THREE.InstancedMesh(g, s.mat, cap); m.customDepthMaterial = s.prof; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.count = 0;
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  return { malla: m, s,
    pon(i, x, z, giro, semilla, talla = 1) { p.set(x, 0, z); q.setFromAxisAngle(Y, giro); const an = 0.95 + 0.12 * (Math.abs(Math.sin(semilla * 91.7)) % 1); e.set(talla * an, talla, talla * an); M.compose(p, q, e); m.setMatrixAt(i, M); const r = k => { const v = Math.sin(semilla * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
      va.setXYZW(i, r(1), r(2), r(3), r(4)); va.needsUpdate = true; m.instanceMatrix.needsUpdate = true; if (i >= m.count) m.count = i + 1; },
    /* clip y tiempo -> dos filas de la textura y su mezcla */
    pose(i, clip, t, muestra = 0) { const c = s.j.clips[clip] || s.j.clips.quieto; let f = t * c.fps; f = c.bucle ? f % (c.n - 1) : Math.min(f, c.n - 1); if (f < 0) f += c.n - 1; const a = Math.floor(f), b = Math.min(a + 1, c.n - 1);
      cu.setXYZ(i, c.ini + a, c.ini + b, f - a); cu.needsUpdate = true; mu.setX(i, muestra); mu.needsUpdate = true; } };
}
