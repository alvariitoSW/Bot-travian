/* Maqueta GM4 «guerra arte» — ARTE. Todo el dibujo nuevo de la batalla grande vive aquí; vista.js solo tiene enganches de una línea (marcados con GM4).
   Lo hecho aquí es propio del proyecto (licencia del proyecto): luz, sombreadores, sombras, polvo, estandartes, suelo. El único arte
   ajeno que se usa es el de siempre: los soldados de 0 A.D. (Wildfire Games, CC BY-SA 3.0), ya cargados por js/gfx/units.js.
   Qué hay:
   · luces(): sol bajo y cálido + cielo. Es la MISMA luz para la escena y para hornear los cartones.
   · materialFigura / geometriaFigura: la figura completa con normales suavizadas, luz envolvente, borde de contraluz,
     variación por hombre y tramado de transición con el cartón.
   · atlasDe(): el cartón. Se hornea con el modelo quieto (orientación de batalla de su bando), la luz del mundo y la cámara dando la vuelta.
   · carton(): sombreador del cartón (parchea el de vista.js para no repetir su colocación) + sombra arrojada de cada hombre (2 triángulos).
   · campo(): suelo con grano y tierra pisada, polvo con viento, estandartes de paño que ondea.
   Qué habría que llevar a js/gfx/units.js: normales suavizadas (suavizadas()), mipmaps y anisotropía de la textura de la figura,
   y la luz envolvente + contraluz de materialFigura (ver «LLEVAR A units.js» más abajo). */
import { THREE } from '../../../js/gfx/models.js';
import * as GE from './gentio.js';   /* GM33 */
import { getUnit, unitMaterialReal, instancedGeometry, UNIT_SCALE } from '../../../js/gfx/units.js';

export const COLS = 11, DIRS = 8, INCL = 0.38, STEP = Math.PI * 2 / DIRS;
const COSI = Math.cos(INCL);
/* El sol del mundo (de él salen la luz de la escena, la de los cartones y la dirección de las sombras) */
const SOL = new THREE.Vector3(-90, 72, 60), SOL_H = Math.hypot(SOL.x, SOL.z), SOL_AZ = Math.atan2(SOL.x, SOL.z), SOL_EL = Math.atan2(SOL.y, SOL_H);
export function luces() {
  const s = new THREE.DirectionalLight('#ffe0b4', 3.0); s.position.copy(SOL);
  return [new THREE.HemisphereLight('#c8dcfa', '#7d6a45', 1.2), s];
}
/* Uniformes que comparten cartones, sombras y figuras */
const UNI = { uSol: { value: new THREE.Vector4(Math.sin(SOL_AZ), Math.cos(SOL_AZ), SOL_AZ, 0) }, uBanda: { value: 3 }, uSolV: { value: new THREE.Vector3(SOL.x, SOL.y, SOL.z).normalize() } };
let CO = null;                                                   // COMUN de vista.js (cámara, zona de figuras, niebla)

/* Variación por hombre: la misma cuenta en JS (figuras) y en el sombreador (cartones), por el número del hombre en su regimiento */
const fr = x => x - Math.floor(x);
export const varDe = (id, out) => { out[0] = fr(id * 0.7548777); out[1] = fr(id * 0.5698403 + 0.3); out[2] = fr(id * 0.618034 + 0.11); out[3] = fr(id * 0.4142136 + 0.7); return out; };
const GLSL_VAR = `
vec3 varC(vec4 h, vec3 c) {
  float br = 1.0 + (h.x - 0.5) * 0.24; float d = h.y - 0.5; vec3 tinte = vec3(1.0 + d * 0.16, 1.0 + d * 0.02, 1.0 - d * 0.16);
  float l = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(vec3(l), c, 0.88 + 0.3 * h.z); return c * br * tinte;
}
float ruidoPantalla(vec2 f) { return fract(52.9829189 * fract(dot(f, vec2(0.06711056, 0.00583715)))); }
${GE.ON ? GE.GLSL : ''}`;

/* ---------- normales suavizadas (copia de la geometría de la unidad; la original no se toca) ---------- */
function suavizadas(u) {
  if (u.arteN) return u.arteN;
  const P = u.geo.attributes.position, N = u.geo.attributes.normal, n = P.count, out = new Float32Array(n * 3), grupos = new Map();
  for (let i = 0; i < n; i++) { const k = Math.round(P.getX(i) * 400) + ',' + Math.round(P.getY(i) * 400) + ',' + Math.round(P.getZ(i) * 400); let a = grupos.get(k); if (!a) grupos.set(k, a = []); a.push(i); }
  const COS = 0.3;                                              // se unen las caras que se tuercen menos de ~72°; las aristas vivas de verdad (escudo, borde) se quedan
  for (const a of grupos.values()) for (const i of a) {
    let x = 0, y = 0, z = 0; const ix = N.getX(i), iy = N.getY(i), iz = N.getZ(i);
    for (const j of a) { const jx = N.getX(j), jy = N.getY(j), jz = N.getZ(j); if (ix * jx + iy * jy + iz * jz > COS) { x += jx; y += jy; z += jz; } }
    const l = Math.hypot(x, y, z) || 1; out[i * 3] = x / l; out[i * 3 + 1] = y / l; out[i * 3 + 2] = z / l;
  }
  return (u.arteN = new THREE.BufferAttribute(out, 3));
}
export function geometriaFigura(u, cap) {
  const g = instancedGeometry(u, cap); g.setAttribute('normal', suavizadas(u));
  const v = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4).fill(0.5), 4); v.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aVar', v); return g;
}

/* ---------- material de la figura completa (y del cartón horneado: es el mismo) ---------- */
const mats = new Map();
export function materialFigura(u, color, horneo) {
  const id = u.key + color + (horneo ? 'h' : ''); if (mats.has(id)) return mats.get(id);
  const base = unitMaterialReal(u, color), m = new THREE.MeshLambertMaterial({ map: u.tex, side: THREE.DoubleSide });
  if (u.tex) { u.tex.anisotropy = 8; u.tex.generateMipmaps = true; u.tex.minFilter = THREE.LinearMipmapLinearFilter; }
  const lamb = THREE.ShaderChunk.lights_lambert_pars_fragment.replace('float dotNL = saturate( dot( geometryNormal, directLight.direction ) );', 'float dotNL = saturate( ( dot( geometryNormal, directLight.direction ) + 0.32 ) / 1.32 );');   // luz envolvente: el borde de sombra se ablanda
  m.onBeforeCompile = (sh, r) => {
    base.onBeforeCompile(sh, r);                                // esqueleto y color de bando: lo de js/gfx/units.js, sin copiarlo
    sh.uniforms.uDet = CO ? CO.uDet : { value: new THREE.Vector3(0, 0, -1) }; sh.uniforms.uBanda = UNI.uBanda; sh.uniforms.uSolV = UNI.uSolV;
    sh.vertexShader = 'attribute vec4 aVar; varying vec4 vH; varying float vDet; uniform vec3 uDet;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vH = aVar; vDet = distance(instanceMatrix[3].xz, uDet.xy);');
    sh.fragmentShader = 'varying vec4 vH; varying float vDet; uniform vec3 uDet; uniform float uBanda; uniform vec3 uSolV;\n' + GLSL_VAR + '\n' + sh.fragmentShader
      .replace('#include <lights_lambert_pars_fragment>', lamb)
      .replace('void main() {', 'void main() {\n' + (horneo ? '' : ' if (ruidoPantalla(gl_FragCoord.xy) < smoothstep(uDet.z - uBanda, uDet.z, vDet)) discard;      /* tramado: aquí la figura, allá el cartón */\n'))
      .replace('#include <opaque_fragment>', `
        { vec3 n = normalize(normal); float nv = clamp(dot(n, normalize(vViewPosition)), 0.0, 1.0);
          vec3 sV = normalize((viewMatrix * vec4(uSolV, 0.0)).xyz); float contra = clamp(dot(n, -sV) * 0.5 + 0.5, 0.0, 1.0);
          outgoingLight += diffuseColor.rgb * pow(1.0 - nv, 2.4) * (0.05 + 0.2 * contra) * vec3(1.0, 0.9, 0.75);   // borde de contraluz
          ${horneo ? '' : 'outgoingLight = varC(vH, outgoingLight);'} }
        #include <opaque_fragment>`);
  };
  if (GE.ON) { const ob = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { ob(sh, r); GE.retocaFigura(sh, horneo, RUIDO); }; }   /* GM33 */
  m.customProgramCacheKey = () => 'arte-fig' + (horneo ? 'h' : '') + (GE.ON ? 'G' : ''); mats.set(id, m); return m;
}
/* Pone la figura al día: material nuevo, normales suavizadas y atributo de variación. m = { malla, fr, u } de vista.js */
function equipa(m, color) {
  const g = m.malla.geometry; g.setAttribute('normal', suavizadas(m.u));
  const v = new THREE.InstancedBufferAttribute(new Float32Array(m.malla.instanceMatrix.count * 4).fill(0.5), 4); v.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aVar', v); m.v = v;
  m.malla.material = materialFigura(m.u, color);
}
const H4 = [0, 0, 0, 0];
/* Después de que vista.js coloque la figura número «slot»: estatura, ladeo y variación de color según el hombre «id». Mismo hash que el cartón. */
export function figura(m, slot, id) {
  if (!m.v) return; const h = varDe(id, H4), e = 1 + (h[3] - 0.5) * 0.08, lean = h[2] > 0.72 ? (h[2] - 0.86) * 0.5 : 0, a = m.malla.instanceMatrix.array, o = slot * 16;
  a[o + 4] = a[o] * lean; a[o + 6] = a[o + 2] * lean;
  for (let k = 0; k < 11; k++) if (k !== 3 && k !== 7) a[o + k] *= e;
  const q = slot * 4; m.v.array[q] = h[0]; m.v.array[q + 1] = h[1]; m.v.array[q + 2] = h[2]; m.v.array[q + 3] = h[3]; m.v.needsUpdate = true;
}

/* ---------- el cartón: la foto de cada soldado, horneada con la luz del mundo ---------- */
const atlas = new Map();
export function atlasDe(renderer, tipo, lado, MONTADO, COLOR) {
  const id = tipo + lado; if (atlas.has(id)) return atlas.get(id);
  const u = getUnit(tipo), mont = !!MONTADO[tipo], cw = mont ? 112 : 72, ch = mont ? 112 : 96, W = mont ? 4.6 : 2.1, H = mont ? 4.6 : 2.9, yc = mont ? 1.75 : 1.3, y0 = lado === 0 ? Math.PI : 0;
  const rt = new THREE.WebGLRenderTarget(cw * COLS, ch * DIRS, { colorSpace: THREE.SRGBColorSpace, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  rt.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  /* bordes suaves: cada celda se pinta al doble de tamaño y se baja con filtro lineal (un MSAA del atlas entero se quedaría ocupando memoria de vídeo) */
  const tmp = new THREE.WebGLRenderTarget(cw * 2, ch * 2, { colorSpace: THREE.SRGBColorSpace, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false });
  const bajar = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { t: { value: tmp.texture } }, depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec2 v; void main() { v = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: 'uniform sampler2D t; varying vec2 v; void main() { gl_FragColor = texture2D(t, v); }' })), escB = new THREE.Scene(), camB = new THREE.Camera(); escB.add(bajar);
  const esc = new THREE.Scene(); esc.add(...luces());
  const g = geometriaFigura(u, 1), m = new THREE.InstancedMesh(g, materialFigura(u, COLOR[lado], true), 1); m.frustumCulled = false; esc.add(m);
  const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 60);
  const C = u.clips, de = (c, f) => c ? c.start + Math.min(c.frames - 1, Math.floor(f * c.frames)) : 0, anda = mont ? (C.run || C.walk) : C.walk, pega = C.attack_melee || C.attack_ranged;
  const poses = [de(C.idle, 0), de(anda, 0), de(anda, 0.25), de(anda, 0.5), de(anda, 0.75), de(pega, 0.1), de(pega, 0.35), de(pega, 0.6), de(pega, 0.85), de(C.death, 0.45), de(C.death, 0.999)];
  const color = renderer.getClearColor(new THREE.Color()), alfa = renderer.getClearAlpha(), auto = renderer.autoClear, M = new THREE.Matrix4(), E = new THREE.Vector3(UNIT_SCALE, UNIT_SCALE, UNIT_SCALE);
  renderer.autoClear = false; renderer.setClearColor(0x000000, 0); rt.scissorTest = false; renderer.setRenderTarget(rt); renderer.clear(); rt.scissorTest = true;
  m.setMatrixAt(0, M.makeRotationY(y0).scale(E)); m.instanceMatrix.needsUpdate = true;                 // el modelo NO gira: la que da la vuelta es la cámara
  for (let k = 0; k < DIRS; k++) {
    const fi = k * STEP; cam.position.set(Math.sin(fi) * COSI * 20, yc + Math.sin(INCL) * 20, Math.cos(fi) * COSI * 20); cam.lookAt(0, yc, 0); cam.updateMatrixWorld();
    for (let c = 0; c < COLS; c++) {
      g.attributes.aFrame.array[0] = poses[c]; g.attributes.aFrame.needsUpdate = true;
      renderer.setRenderTarget(tmp); renderer.clear(); renderer.render(esc, cam);
      rt.viewport.set(c * cw, k * ch, cw, ch); rt.scissor.set(c * cw, k * ch, cw, ch); renderer.setRenderTarget(rt); renderer.render(escB, camB);
    }
  }
  renderer.setRenderTarget(null); renderer.autoClear = auto; renderer.setClearColor(color, alfa); g.dispose(); tmp.dispose(); bajar.geometry.dispose(); bajar.material.dispose();
  const fy = 0.5 - yc * COSI / H, Lc = (H / COSI) / Math.tan(SOL_EL) * 0.58;           // fy: dónde están los pies dentro de la celda; Lc: largo de la sombra de una celda entera
  const a = { tex: rt.texture, W, H, yc, mont, y0, fy, Lc, mb: cw * COLS * ch * DIRS * 4 * 1.33 / 1048576 }; atlas.set(id, a); return a;
}
export const memoriaMB = () => { let s = 0; for (const a of atlas.values()) s += a.mb; return Math.round(s * 10) / 10; };

/* ---------- sombreador del cartón: se parchea el de vista.js (su colocación) y se le pone una cola propia ---------- */
const DECL = `uniform float uY0, uFy, uLc; uniform float uBanda; uniform vec4 uSol; varying float vShare, vFade, vA; varying vec4 vH; float dDet = 1e5;\n`;
const COLA_C = `
  float kk = mod(floor((uY0 - yaw + uCamAz) / ${STEP} + 0.5), ${DIRS}.0);
  vec4 hh = vec4(fr(id * 0.7548777), fr(id * 0.5698403 + 0.3), fr(id * 0.618034 + 0.11), fr(id * 0.4142136 + 0.7));
  float est = 1.0 + (hh.w - 0.5) * 0.08, lean = hh.z > 0.72 ? (hh.z - 0.86) * 0.5 : 0.0, E = esc;
#ifdef CAIDO
  E = (t < 0.0 || t > uVida) ? 0.0 : 1.0; vFade = 1.0 - smoothstep(uVida - 14.0, uVida, t);      /* los caídos no se encogen: se funden con tramado */
#else
  vFade = 1.0;
#endif
  vShare = smoothstep(uDet.z - uBanda, uDet.z, dDet);
  float alto = uTam.y * est * uCamU.y / ${COSI};                      /* la figura real se ve más baja si la cámara mira desde más arriba: el cartón también */
  vec4 mv = viewMatrix * vec4(p.x, 0.0, p.y, 1.0);
  vLejos = clamp(1.0 - (alto * uPix / -mv.z - 14.0) / 18.0, 0.0, 1.0);
  float rx = mix(1.0, 0.5, vLejos), ry = mix(1.0, 0.8, vLejos), Ec = (dDet < uDet.z - uBanda) ? 0.0 : E, yh = position.y + 0.5;
  vec3 w = vec3(p.x, 0.0, p.y) + uCamR * (position.x * uTam.x * est * rx * Ec + lean * yh * alto * ry * Ec) + uCamU * ((yh * ry - uFy) * alto * Ec);   /* anclado a los pies */
  float atras = 0.7 * (1.0 - vShare);                                  /* en la franja de transición el cartón se echa atrás (misma imagen en pantalla): la figura, tramada, va delante y el cartón rellena sus huecos */
  w = cameraPosition + (w - cameraPosition) * (1.0 + atras / max(length(w - cameraPosition), 1.0));
  mv = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mv;
  vUv = vec2((0.5 + (uv.x - 0.5) * rx + cual) / ${COLS}.0, (uv.y * ry + kk) / ${DIRS}.0);
  vH = hh; vNiebla = smoothstep(uNiebla.x, uNiebla.y, -mv.z);
}`;
const COLA_S = `
  float kk = mod(floor((uY0 - yaw + uSol.z) / ${STEP} + 0.5), ${DIRS}.0), est = 1.0 + (fr(id * 0.4142136 + 0.7) - 0.5) * 0.08;
  vec2 lejos = vec2(-uSol.x, -uSol.y), ancho = vec2(uSol.y, -uSol.x);         /* la sombra cae alejándose del sol; su silueta es el hombre visto desde el sol */
  vec2 q = p + ancho * (position.x * uTam.x * est * esc) + lejos * ((position.y + 0.5 - uFy) * uLc * est * esc);
  vec4 mf = viewMatrix * vec4(p.x, 0.0, p.y, 1.0);
  vLejos = clamp(1.0 - (uTam.y * est * uPix / -mf.z - 14.0) / 18.0, 0.0, 1.0);
  vA = esc * (1.0 - smoothstep(0.3, 0.85, vLejos)) * (1.0 - smoothstep(uNiebla.x, uNiebla.y, -mf.z));
  if (vA < 0.01) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vUv = vec2(0.0); return; }
  vUv = vec2((uv.x + cual) / ${COLS}.0, (uv.y + kk) / ${DIRS}.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(q.x, 0.08, q.y, 1.0);
}`;
const DET = 'if (uHuida < 0.0 && distance(p, uDet.xy) < uDet.z) esc = 0.0;';
function armarVS(base, caido, sombra) {
  const i = base.indexOf('  float k = mod('); if (i < 0 || !base.includes(DET) || !base.includes('float id =')) return null;
  return (caido ? '#define CAIDO\n' : '') + DECL + base.slice(0, i).replace(DET, 'if (uHuida < 0.0) dDet = distance(p, uDet.xy);') + (sombra ? COLA_S : COLA_C);
}
const FS_C = `
uniform sampler2D uMap; uniform vec3 uNieblaC, uBando;
varying vec2 vUv; varying float vLejos, vNiebla, vShare, vFade; varying vec4 vH;
${GLSL_VAR}
void main() {
  vec2 f = gl_FragCoord.xy;
  if (vFade < 1.0 && ruidoPantalla(f + 17.0) >= vFade) discard;
  vec4 t = texture2D(uMap, vUv); if (t.a < mix(0.5, 0.16, vLejos)) discard;
  vec3 c = t.rgb / max(t.a, 0.06); c = varC(vH, c); ${GE.ON ? 'c = gentio(c, vH, uBando, vLejos);' : '{ float l = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(c, uBando * (0.25 + 1.8 * l), vLejos * 0.42); }'}   /* de lejos el bando se sigue leyendo */
  gl_FragColor = vec4(mix(c, uNieblaC, vNiebla), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const FS_S = `
uniform sampler2D uMap; varying vec2 vUv; varying float vA;
void main() { float a = texture2D(uMap, vUv, 1.2).a * vA * 0.3; if (a < 0.012) discard; gl_FragColor = vec4(0.06, 0.045, 0.03, a); }`;
const QUAD = new THREE.PlaneGeometry(1, 1);
export function carton(escena, at, lado, propios, caido, COMUN, COLOR, VS0) {
  CO = COMUN; const vc = armarVS(VS0, caido, false), vs = caido ? null : armarVS(VS0, false, true);
  if (!vc || (!caido && !vs)) { if (!window.__arteAviso) { window.__arteAviso = 1; console.warn('arte.js: el sombreador de vista.js ha cambiado; se usa el cartón antiguo'); } return null; }
  const g = new THREE.InstancedBufferGeometry(); g.index = QUAD.index; g.setAttribute('position', QUAD.attributes.position); g.setAttribute('uv', QUAD.attributes.uv);
  const un = Object.assign({ uMap: { value: at.tex }, uTam: { value: new THREE.Vector2(at.W, at.H) }, uAlto: { value: at.yc }, uBando: { value: new THREE.Color(COLOR[lado]) }, uY0: { value: at.y0 }, uFy: { value: at.fy }, uLc: { value: at.Lc } }, propios, COMUN, UNI);
  const mat = new THREE.ShaderMaterial({ uniforms: un, vertexShader: vc, fragmentShader: FS_C }), malla = new THREE.Mesh(g, mat); malla.frustumCulled = false; escena.add(malla);
  if (!caido) {                                                  // sombra de cada hombre: otro par de triángulos, tumbado en el suelo, con la silueta del cartón
    const sm = new THREE.ShaderMaterial({ uniforms: un, vertexShader: vs, fragmentShader: FS_S, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const s = new THREE.Mesh(g, sm); s.frustumCulled = false; s.renderOrder = 2; malla.add(s); mat.addEventListener('dispose', () => sm.dispose());
  }
  return { g, un, malla };
}

/* Ruido aleatorio (una sola textura pequeña, cuatro canales): el suelo y el polvo lo leen en vez de calcular ruido en cada píxel */
const RUIDO = (() => { const n = 128, d = new Uint8Array(n * n * 4); let r = 12345; for (let i = 0; i < d.length; i++) { r = (r * 1664525 + 1013904223) >>> 0; d[i] = r >>> 24; }
  const t = new THREE.DataTexture(d, n, n, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
/* ---------- suelo: grano de cerca y tierra pisada donde se marcha y se lucha ---------- */
function suelo(mesh, zona) {
  const m = mesh.material, prev = m.onBeforeCompile; if (!m.onBeforeCompile) return;
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r); sh.uniforms.uZ = { value: new THREE.Vector3(zona[0], zona[1], zona[2]) }; sh.uniforms.tRuido = { value: RUIDO };
    sh.fragmentShader = 'uniform vec3 uZ; uniform sampler2D tRuido;\n float vn(vec2 p) { return texture2D(tRuido, p / 128.0).r; }\n'
      + sh.fragmentShader.replace('diffuseColor.rgb *= terr * macro * 1.05;', `diffuseColor.rgb *= terr * macro * 1.05;
      float dc = length(vViewPosition), cerca = 1.0 - smoothstep(30.0, 170.0, dc), g1 = 0.5, g3 = vn(vXZ * 0.35 + 3.0), g4 = 0.5 + 0.5 * sin(vXZ.x * 0.11 + vXZ.y * 0.07) * sin(vXZ.y * 0.05 - vXZ.x * 0.03);
      if (cerca > 0.01) { g1 = vn(vXZ * 4.0); float g2 = vn(vXZ * 15.0 + 7.0); diffuseColor.rgb *= 1.0 + ((g1 - 0.5) * 0.34 + (g2 - 0.5) * 0.28 + (g4 - 0.5) * 0.2) * cerca; }      /* grano de cerca */
      float caja = (1.0 - smoothstep(0.0, 16.0, abs(vXZ.x) - uZ.x)) * smoothstep(uZ.y - 12.0, uZ.y + 8.0, vXZ.y) * (1.0 - smoothstep(uZ.z - 8.0, uZ.z + 14.0, vXZ.y));
      float pis = caja * (0.30 + 0.70 * g3) * (0.75 + 0.5 * g4);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.82, 0.67, 0.49) * (0.82 + 0.36 * g1), clamp(pis * 0.8, 0.0, 0.85));   /* tierra pisada */`);
  };
  m.needsUpdate = true;
}

/* ---------- polvo: nubes blandas que se lleva el viento ---------- */
const POLVO_N = 1100, VIENTO = new THREE.Vector3(1.5, 0.0, 0.45); let polvo = null, pCur = 0;
function crearPolvo(escena) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(POLVO_N * 3), 3));
  const aP = new THREE.BufferAttribute(new Float32Array(POLVO_N * 4).fill(-999), 4), aQ = new THREE.BufferAttribute(new Float32Array(POLVO_N * 4), 4); aP.setUsage(THREE.DynamicDrawUsage); aQ.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aP', aP); g.setAttribute('aQ', aQ);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: CO.uT, uPix: CO.uPix, uViento: { value: VIENTO }, tRuido: { value: RUIDO } },
    vertexShader: `attribute vec4 aP, aQ; uniform float uT, uPix; uniform vec3 uViento; varying float vA; varying float vS;
      void main() {
        float edad = uT - aP.w, f = edad / aQ.x; vS = aQ.z;
        if (f < 0.0 || f > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
        vec3 p = aP.xyz + uViento * edad * (0.5 + 0.9 * aQ.z) + vec3(sin(edad * 0.8 + aQ.z * 40.0), 0.0, cos(edad * 0.65 + aQ.z * 23.0)) * 0.6;
        p.y += 0.25 + edad * 0.22 * (1.0 - f * 0.5);
        vec4 mv = modelViewMatrix * vec4(p, 1.0); float tam = aQ.y * (0.45 + 1.4 * sqrt(f));
        gl_PointSize = min(200.0, tam * uPix / -mv.z); gl_Position = projectionMatrix * mv;
        vA = aQ.w * smoothstep(0.0, 0.1, f) * pow(1.0 - f, 1.6) * smoothstep(5.0, 16.0, -mv.z);       /* cerca de la cámara se funde: no tapa */
      }`,
    fragmentShader: `varying float vA, vS;
      uniform sampler2D tRuido;
      void main() {
        vec2 c = gl_PointCoord - 0.5; float a0 = vS * 6.283, cs = cos(a0), sn = sin(a0); c = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs);
        float d = length(c) * 2.0, n = texture2D(tRuido, c * 0.2 + vS * 7.0).r;
        float a = smoothstep(1.0, 0.05, d + (n - 0.5) * 0.4) * vA; if (a < 0.004) discard;
        gl_FragColor = vec4(mix(vec3(0.62, 0.52, 0.38), vec3(0.86, 0.76, 0.58), n), a);
      }` });
  polvo = new THREE.Points(g, mat); polvo.frustumCulled = false; polvo.renderOrder = 4; escena.add(polvo); polvo.userData = { aP, aQ };
}
function suelta(x, y, z, T, vida, tam, fuerza) {
  const { aP, aQ } = polvo.userData, k = pCur++ % POLVO_N; aP.array.set([x, y, z, T], k * 4); aQ.array.set([vida * (0.8 + Math.random() * 0.4), tam * (0.7 + Math.random() * 0.6), Math.random(), fuerza], k * 4); aP.needsUpdate = aQ.needsUpdate = true;
}
const cuenta = new Map();
const tanda = (clave, tasa, dt) => { const v = (cuenta.get(clave) || 0) + tasa * dt, n = Math.floor(v); cuenta.set(clave, v - n); return n; };
function emitirPolvo(dt, T, B, todos) {
  const lucha = B.fase === 'lucha';
  for (let q = 0; q < todos.length; q++) {
    const rg = todos[q]; if (rg.n < 1) continue; const sy = Math.sin(rg.yaw), cy = Math.cos(rg.yaw), ancho = rg.files * rg.px, filas = Math.ceil(rg.n / rg.files), fondo = filas * rg.pz;
    let tasa = 0, fila = 0, fuerza = 0.2, tam = 4, vida = 6;
    if (rg.est === 3) { if (rg.tH < 14) { tasa = rg.mont ? 16 : 11; fila = 0.5; fuerza = 0.42; tam = 6; } }
    else if (lucha && rg.ataca > 0) { tasa = rg.ataca > 2 ? 14 : 9; fila = -0.1; fuerza = 0.36; tam = 9; vida = 8; }       // la línea de choque
    else if (rg.anim > 0) { tasa = rg.mont ? 12 : (rg.anim > 1 ? 7 : 4); fila = 0.6; fuerza = 0.3; tam = 4.6; }        // la marcha: polvo detrás
    if (!tasa) continue;
    for (let n = tanda(q, tasa, dt); n > 0; n--) {
      const lx = (Math.random() - 0.5) * ancho, lz = (fila < 0 ? -0.2 : fila * fondo * (0.5 + Math.random() * 0.6)), x = rg.x - sy * lz + cy * lx, z = rg.z - cy * lz - sy * lx;
      suelta(x, 0.2 + Math.random() * 0.8, z, T, vida, tam * (rg.mont ? 1.2 : 1), fuerza);
    }
  }
}

/* ---------- estandartes: signum/vexillum romano y enseña enemiga, con paño que ondea ---------- */
const UT = { value: 0 };
function lienzoPano(lado) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  if (lado === 0) {                                              // paño romano: rojo con orla de oro y corona de laurel
    x.fillStyle = GE.pano ? GE.pano.rojo : '#a8231c'; x.fillRect(0, 0, 128, 128); x.fillStyle = GE.pano ? GE.pano.rojo2 : '#7e1812'; for (let i = 0; i < 128; i += 8) x.fillRect(i, 0, 3, 128);
    x.strokeStyle = '#e2b24f'; x.lineWidth = 7; x.strokeRect(5, 5, 118, 110); x.lineWidth = 4; x.beginPath(); x.arc(64, 58, 28, 0, 7); x.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillStyle = '#e2b24f'; x.beginPath(); x.ellipse(64 + Math.cos(a) * 28, 58 + Math.sin(a) * 28, 6, 3, a + 1.57, 0, 7); x.fill(); }
    x.fillStyle = '#e2b24f'; x.fillRect(58, 40, 12, 36); x.fillRect(46, 52, 36, 10);
    x.clearRect(0, 116, 128, 12); x.fillStyle = '#e2b24f'; for (let i = 0; i < 128; i += 16) { x.fillRect(i + 2, 114, 10, 14); }   // flecos
  } else {                                                       // enseña enemiga: banderola morada con creciente
    x.fillStyle = GE.pano ? GE.pano.azul : '#5b3a8c'; x.fillRect(0, 0, 128, 128); x.fillStyle = GE.pano ? GE.pano.azul2 : '#42286b'; for (let i = 0; i < 128; i += 16) x.fillRect(0, i, 128, 6);
    x.fillStyle = '#d9d2bd'; x.fillRect(0, 0, 128, 8); x.fillRect(0, 120, 128, 8); x.strokeStyle = '#d9d2bd'; x.lineWidth = 9; x.beginPath(); x.arc(56, 64, 28, 0.6, 5.7); x.stroke();
    x.fillStyle = '#d9d2bd'; x.beginPath(); x.arc(96, 64, 9, 0, 7); x.fill();
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(128, 0); x.lineTo(92, 64); x.lineTo(128, 128); x.fill();   // cola de golondrina
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function materialPano(lado) {
  const m = new THREE.MeshLambertMaterial({ map: lienzoPano(lado), side: THREE.DoubleSide, alphaTest: 0.5 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = UT; sh.uniforms.uAmp = { value: lado === 0 ? 0.16 : 0.3 };
    sh.vertexShader = 'uniform float uT, uAmp;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float suj = ${lado === 0 ? '1.0 - uv.y' : 'uv.x'};                           /* lo que se aleja del asta ondea más */
      transformed.z += sin(uv.x * 7.0 - uv.y * 3.0 - uT * 4.2 + ${(lado * 1.7).toFixed(2)}) * uAmp * suj * suj * 2.0 + sin(uT * 2.1 + uv.y * 5.0) * uAmp * 0.3 * suj;
      ${lado === 0 ? 'transformed.x += sin(uT * 3.0 + uv.y * 4.0) * uAmp * 0.12 * suj;' : 'transformed.y += sin(uT * 3.6 + uv.x * 6.0) * uAmp * 0.25 * suj;'}`);
  };
  m.customProgramCacheKey = () => 'arte-pano' + lado; return m;
}
/* las piezas fijas de cada estandarte se funden en una sola malla (una llamada de dibujo en vez de ocho) con el color en los vértices */
function fusionar(partes) {
  let nv = 0, ni = 0; for (const [g] of partes) { nv += g.attributes.position.count; ni += g.index.count; }
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), I = new Uint32Array(ni); let ov = 0, oi = 0;
  for (const [g, hex] of partes) {
    const n = g.attributes.position.count, col = new THREE.Color(hex); P.set(g.attributes.position.array, ov * 3); N.set(g.attributes.normal.array, ov * 3);
    for (let k = 0; k < n; k++) { C[(ov + k) * 3] = col.r; C[(ov + k) * 3 + 1] = col.g; C[(ov + k) * 3 + 2] = col.b; }
    for (let k = 0; k < g.index.count; k++) I[oi + k] = g.index.array[k] + ov; ov += n; oi += g.index.count;
  }
  const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(P, 3)); r.setAttribute('normal', new THREE.BufferAttribute(N, 3)); r.setAttribute('color', new THREE.BufferAttribute(C, 3)); r.setIndex(new THREE.BufferAttribute(I, 1)); return r;
}
const FIJO = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: '#1a1204' }), OROC = '#d9a83a', BRONCE = '#b98b4a', MADERA = '#6b4a22';
function armarEstandarte(e) {
  for (const h of [...e.gr.children]) h.visible = false;         // se esconde el de siempre (palo y paño planos)
  const g = new THREE.Group(), pano = materialPano(e.l), partes = [[new THREE.CylinderGeometry(0.045, 0.055, 4.7, 8).translate(0, 2.35, 0), MADERA]];
  if (e.l === 0) {                                               // romano: vexillum de paño rojo colgado de una barra, con remate de lanza y discos dorados (phalerae)
    partes.push([new THREE.BoxGeometry(1.35, 0.07, 0.07).translate(0, 4.3, 0), OROC], [new THREE.SphereGeometry(0.11, 10, 8).translate(0, 4.78, 0), OROC], [new THREE.ConeGeometry(0.09, 0.4, 8).translate(0, 5.1, 0), OROC]);
    for (let i = 0; i < 3; i++) partes.push([new THREE.CylinderGeometry(0.16, 0.16, 0.035, 14).rotateX(Math.PI / 2).translate(0, 2.5 + i * 0.3, 0.07), OROC]);
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.2, 10, 10).translate(0, -0.6, 0), pano); tela.position.set(0, 4.27, 0); g.add(tela); e.pano = tela;
  } else {                                                       // enemigo: banderola morada de cola de golondrina con creciente de bronce
    partes.push([new THREE.TorusGeometry(0.24, 0.045, 6, 16, Math.PI * 1.35).rotateZ(Math.PI * 0.82).translate(0, 4.95, 0), BRONCE], [new THREE.SphereGeometry(0.09, 8, 6).translate(0, 4.85, 0), BRONCE]);
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.8, 12, 6).translate(0.85, 0, 0), pano); tela.position.set(0.04, 4.15, 0); g.add(tela); e.pano = tela;
  }
  const fijo = new THREE.Mesh(fusionar(partes), FIJO); g.add(fijo); e.gr.add(g); e.arte = g;
}
function estandartes(estand, B) {
  for (const e of estand) {
    if (!e.arte) armarEstandarte(e);
    const c = B.sect[e.i].c[e.l], mor = Math.max(0, c.moral); e.pano.scale.y = 0.45 + 0.55 * mor;           // con la moral baja el paño cae
    if (e.l === 1) e.pano.rotation.z = -0.25 * (1 - mor);
  }
}

/* ---------- ganchos que usa vista.js ---------- */
export function campo(o) {                                         // al final de campo() de vista.js
  CO = o.COMUN; CAM = o.camara; const ge = o.suelo; if (ge) suelo(ge, o.zona);
  if (o.polvo) o.polvo.visible = false; if (o.sombras) o.sombras.visible = false;
  for (const m of o.figM.values()) equipa(m, o.COLOR[['galos', 'libios', 'iberos', 'numidas'].includes(m.u.key) ? 1 : 0]);
  crearPolvo(o.escena);
}
export function paso(dt, T, B, todos, estand) {                    // al final de mover(): cada paso de la simulación (también al adelantar el tiempo)
  if (!polvo || !B) return; ULT = todos; emitirPolvo(dt, T, B, todos); estandartes(estand, B);
}
/* el reloj del paño y el ancho de la franja de tramado van por su cuenta, a la velocidad de la pantalla */
let ULT = null, CAM = null;
const reloj = t => { UT.value = t / 1000;
  if (ULT && CAM) for (const rg of ULT) { const sm = rg.malla.children[0]; if (!sm) continue;      // sombras de cada hombre solo en los regimientos cercanos (presupuesto de triángulos de lejos); se decide con la cámara de este instante
    const h = Math.ceil(rg.n / rg.files) * rg.pz; sm.visible = rg.est !== 3 && Math.hypot(rg.x - CAM.position.x, rg.z - CAM.position.z) - 0.5 * Math.hypot(rg.files * rg.px, h) - h * 0.5 < 80; } if (CO) UNI.uBanda.value = window.__banda ?? 0.35; requestAnimationFrame(reloj); }; requestAnimationFrame(reloj);
