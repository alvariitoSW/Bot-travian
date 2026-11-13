/* AQVILA — suelo con texturas reales mezcladas (hierba, hierba seca, tierra, empedrado) y agua animada.
   Texturas de 0 A.D. (Wildfire Games, CC BY-SA 3.0). */
import { THREE } from './models.js';
import { loadStaticIndex } from './statics.js';
import { azar, fbm, altura, RIO, NIVEL_RIO } from './mundo.js';
import { X0, Z0, LADO, N_CALOR } from '../ciudad.js';

/* Navegadores antiguos no tienen roundRect: sin esquinas redondas se ve casi igual y no rompe la ciudad. */
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
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

/* Terreno del mapa de campaña: los colores de vértice siguen mandando (llanura, sequedad, roca, nieve) y la textura de hierba o
   de hierba seca (0 A.D.) solo añade el grano, normalizado por su media para no oscurecer ni cambiar el tono del conjunto.
   El atributo aT = (sequedad, fuerza). Sin texturas cargadas (uOn = 0) se ve igual que antes. */
export function mapaMaterial() {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true }), U = { tA: { value: null }, tB: { value: null }, uOn: { value: 0 }, uS: { value: 0.42 } };
  m.userData.U = U;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'attribute vec2 aT; varying vec2 vT; varying vec2 vXZ;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vT = aT; vXZ = (modelMatrix * vec4(position, 1.0)).xz;');
    sh.fragmentShader = 'uniform sampler2D tA, tB; uniform float uOn, uS; varying vec2 vT; varying vec2 vXZ;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if (uOn > 0.5) {
        vec2 u = vXZ * uS;
        vec3 d = mix(texture2D(tA, u).rgb, texture2D(tB, u * 0.8 + 0.37).rgb, vT.x), mu = mix(texture2D(tA, u, 12.0).rgb, texture2D(tB, u * 0.8, 12.0).rgb, vT.x);
        diffuseColor.rgb *= mix(vec3(1.0), clamp(d / max(mu, vec3(0.05)), 0.55, 1.6), vT.y * 0.85);
      }`);
  };
  return m;
}
/* Pone las texturas en el material del mapa cuando ya existen; devuelve true al lograrlo */
export function mapaTexturas(m) { if (!m || !hasGround()) return false; const U = m.userData.U, a = tex('terr_grass'), b = tex('terr_dry'); if (!a || !b) return false; U.tA.value = a; U.tB.value = b; U.uOn.value = 1; return true; }


/* ================= Q1d — suelo, río y cielo de la maqueta aprobada (gobierno/maquetas/ciudad2/suelo.js), sin sombra de nubes =================
   El suelo MEZCLA texturas de 0 A.D. con máscaras pintadas en canvas: un juego fino para la ciudad (±EC) y otro basto para el campo (±EP).
   Todo lo pintado es inventado. Las coordenadas del suelo son las del MUNDO de la maqueta; el grupo del mundo se desplaza en city3d. */
export const EC = 420, EP = 1700;
const TC = 1536, TP = 1536, MC = 1024, MP = 512;      // lienzos de Q1c: el tinte lleva el detalle; la máscara solo mezcla

function lienzo(n, color) { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, n, n); return g; }
const camino = (g, p) => { g.beginPath(); p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); };
const poli = (g, p) => { camino(g, p); g.closePath(); };
/* Sin ctx.filter (lentísimo): los bordes blandos son trazos apilados y degradados radiales. */
const trazo = (g, p, w, r, rgb, a = 1, cerrado) => { for (let k = 0; k < 4; k++) { g.lineWidth = w + r * 2 * (1 - k / 3); g.strokeStyle = `rgba(${rgb},${a * [0.28, 0.42, 0.62, 1][k]})`; cerrado ? poli(g, p) : camino(g, p); g.stroke(); } };
const mancha = (g, x, z, rx, ry, giro, rgb, a) => { g.save(); g.translate(x, z); g.rotate(giro); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); };


/* ruido tileable pequeño (variación a gran escala del suelo y dibujo de los montes) */
export function texturaRuido() { const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), im = g.createImageData(n, n); const per = (x, y, f) => { let s = 0; for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const wx = ox ? x : 1 - x, wy = oy ? y : 1 - y; s += wx * wy * fbm((x - ox) * f + 50, (y - oy) * f + 50, 4); } return s; };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = i / n, y = j / n, o = (j * n + i) * 4; im.data[o] = 255 * per(x, y, 4); im.data[o + 1] = 255 * per(x + 0.37, y + 0.11, 9) % 256; im.data[o + 2] = 255 * per(y, x, 18); im.data[o + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t; }

/* textura de reserva de un solo color (si no han cargado las de 0 A.D.) */
function lisa(hex) { const c = new THREE.Color(hex).convertLinearToSRGB(), t = new THREE.DataTexture(new Uint8Array([c.r * 255, c.g * 255, c.b * 255, 255]), 1, 1); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t; }
const RESERVA = { terr_grass: '#908c58', terr_dry: '#868a50', terr_dirt: '#a99f83', terr_paving: '#959384' };
export const texturasMundo = () => { const o = {}; for (const k in RESERVA) o[k] = tex(k) || lisa(RESERVA[k]); o.water_norm = tex('water_norm'); return o; };


export function crearRio(texs, U) {
  const n = RIO.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = []; let s = 0;
  for (let i = 0; i < n; i++) { const a = RIO[Math.max(0, i - 1)], b = RIO[Math.min(n - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L, w = 80; if (i) s += Math.hypot(RIO[i][0] - RIO[i - 1][0], RIO[i][1] - RIO[i - 1][1]);
    pos.set([RIO[i][0] + nx * w, NIVEL_RIO, RIO[i][1] + nz * w, RIO[i][0] - nx * w, NIVEL_RIO, RIO[i][1] - nz * w], i * 6); uv.set([0, s / 60, 1.3, s / 60], i * 4); if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const nm = texs.water_norm || null, mat = new THREE.MeshPhongMaterial({ color: '#6f8288', specular: '#e0d2b8', shininess: 60, normalMap: nm, normalScale: new THREE.Vector2(0.35, 0.35), transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  if (nm) mat.onBeforeCompile = sh => { sh.uniforms.uTiempo = U.uTiempo; sh.vertexShader = 'uniform float uTiempo;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vNormalMapUv.y += uTiempo * 0.02;'); };
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; return m;
}

/* puente de madera sobre pilotes (una sola malla instanciada); P = {x, z, ang} del mundo */
export function crearPuente(P) {
  const c = Math.cos(P.ang), s = Math.sin(P.ang), L = 84, y = NIVEL_RIO + 4.2, lista = [], q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const caja = (w, h, d, x, yy, z, col) => lista.push([new THREE.Matrix4().compose(new THREE.Vector3(x, yy, z), q.setFromAxisAngle(up, -P.ang).clone(), new THREE.Vector3(w, h, d)), col]);
  caja(L, 0.5, 8.4, P.x, y, P.z, '#6e5a44');
  for (const l of [-4, 4]) caja(L, 0.22, 0.22, P.x - s * l, y + 1.5, P.z + c * l, '#5c4a38');
  for (let u = -L / 2 + 3; u <= L / 2 - 3; u += 7) for (const l of [-3.6, 3.6]) { const x = P.x + c * u - s * l, z = P.z + s * u + c * l; caja(0.5, 8.5, 0.5, x, y - 3.4, z, '#4e4032'); caja(0.22, 1.6, 0.22, x - s * Math.sign(l) * 0.4, y + 0.8, z + c * Math.sign(l) * 0.4, '#5c4a38'); }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#ffffff' }), lista.length), col = new THREE.Color();
  lista.forEach(([m, k], i) => { im.setMatrixAt(i, m); im.setColorAt(i, col.set(k)); }); im.frustumCulled = false; im.castShadow = im.receiveShadow = true; return im;
}

/* cielo: degradado del horizonte cálido al azul frío, resplandor hacia el sol, y tres capas de montes en la bruma */
export function crearCielo(dirSol, HORIZ, U) {
  const g = new THREE.Group();
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uSol: { value: dirSol.clone().normalize() }, uH: { value: new THREE.Color(HORIZ) } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vD; uniform vec3 uSol, uH; void main(){ vec3 d = normalize(vD); float h = clamp(d.y, 0.0, 1.0);
      vec3 c = mix(uH, vec3(0.40, 0.55, 0.76), smoothstep(0.0, 0.075, h)); c = mix(c, vec3(0.20, 0.34, 0.60), smoothstep(0.06, 0.5, h));
      float s = max(dot(d, uSol), 0.0); c += vec3(1.0, 0.78, 0.5) * (pow(s, 6.0) * 0.22 + pow(s, 60.0) * 0.5);
      float n = sin(d.x * 9.0 + d.z * 4.0) * sin(d.z * 13.0 - d.x * 3.0); c = mix(c, vec3(0.96, 0.9, 0.84), smoothstep(0.35, 1.0, n) * 0.22 * smoothstep(0.03, 0.2, h) * (1.0 - smoothstep(0.3, 0.6, h)));
      gl_FragColor = vec4(c, 1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }` }));
  cielo.renderOrder = -10; g.add(cielo);
  const H = new THREE.Color(HORIZ);
  g.userData.luz = { uSol: cielo.material.uniforms.uSol, uH: [cielo.material.uniforms.uH.value, H] };      // Q11: la ciudad los cambia por estación
  /* montes con pliegues, manchas de bosque, roca arriba y bruma al pie (un dibujo por capa, pintado en el sombreador) */
  [[4300, 300, '#3f5468', 0.24, 1.7, 9], [5600, 480, '#54708c', 0.4, 1.1, 7], [7200, 720, '#6e8cae', 0.52, 0.7, 5]].forEach(([r, alt, col, bruma, fq, rep], k) => {
    const n = 360, pos = [], uv = [], idx = []; for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2, x = Math.cos(t) * r, z = Math.sin(t) * r, cx = Math.cos(t) * 3 * fq + k * 9.1 + 20, cz = Math.sin(t) * 3 * fq + k * 3.3 + 20, h = alt * (0.25 + 0.95 * fbm(cx, cz, 4) + 0.16 * (fbm(cx * 6, cz * 6, 3) - 0.5)); pos.push(x, -60, z, x, h, z); uv.push(i / n * rep, 0, i / n * rep, h / (alt * 1.05)); if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ side: THREE.DoubleSide, fog: false, uniforms: { uRuido: U.uRuido, uC: { value: new THREE.Color(col) }, uH: { value: H }, uBruma: { value: bruma } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec2 vUv; uniform sampler2D uRuido; uniform vec3 uC, uH; uniform float uBruma; void main(){
        float n1 = texture2D(uRuido, vec2(vUv.x, vUv.y * 0.35)).r, n2 = texture2D(uRuido, vec2(vUv.x * 3.0, vUv.y * 0.9 + 0.3)).g, n3 = texture2D(uRuido, vec2(vUv.x * 7.0, vUv.y * 2.2)).b;
        float pl = texture2D(uRuido, vec2(vUv.x * 2.0 + vUv.y * 0.22, 0.37 + vUv.y * 0.05)).g;                 // pliegues: franjas que bajan torcidas
        vec3 c = uC * mix(0.66, 1.16, smoothstep(0.3, 0.7, pl + (n3 - 0.5) * 0.35));
        c = mix(c, uC * vec3(0.5, 0.64, 0.5), smoothstep(0.42, 0.6, n2 + (0.45 - vUv.y) * 0.5) * 0.65);         // bosque en las faldas
        c = mix(c, uC * vec3(1.45, 1.4, 1.34), smoothstep(0.5, 0.72, n1 * 0.45 + n3 * 0.4 + vUv.y * 0.4) * 0.6); // roca clara hacia la cumbre
        c = mix(c, uH, uBruma); c = mix(c, uH, (1.0 - smoothstep(0.0, 0.55, vUv.y)) * 0.75);                    // bruma: más densa al pie
        gl_FragColor = vec4(c, 1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }` })); m.renderOrder = -9 + (2 - k); g.add(m); });
  return g;
}

/* ================= CN3-B — suelo de la ciudad nueva que se REPINTA al jugar (de gobierno/maquetas/ciudad3/suelo3.js) =================
   Mismas texturas que crearSuelo, más calles, plaza, campos y huellas de casas pintados sobre el terreno base, y un mapa de calor. Usa `altura` sin desplazar. */
export const CZ = -40;          // el suelo fino de la ciudad nueva va centrado en (0, CZ)
const TC3 = 1536, TP3 = 1024, MC3 = 1024, MP3 = 512;
export const GLSL_NUBES = `uniform sampler2D uRuido; uniform float uTiempo;
float nubes(vec3 p){ float n = texture2D(uRuido, p.xz*0.00042 + vec2(uTiempo*0.004, uTiempo*0.0015)).r; n = n*0.65 + 0.35*texture2D(uRuido, p.xz*0.0011 + vec2(0.3,0.7)).r; return mix(0.66, 1.0, smoothstep(0.31, 0.45, n)); }`;

/* terreno vacío: manchas de tinte, prados, ribera y la sombra verde de los bosquetes */
function pintarBase3(M, T, bosquetes, fino, rnd) {
  const R = (a, b) => a + (b - a) * rnd(), E = fino ? EC : EP, oz = fino ? CZ : 0;
  M.lineCap = M.lineJoin = T.lineCap = T.lineJoin = 'round';
  for (let i = 0; i < (fino ? 500 : 1700); i++) { const x = R(-E, E), z = R(-E, E) + oz, r = R(fino ? 10 : 40, fino ? 50 : 230); mancha(T, x, z, r, r * R(0.4, 1), R(0, 3), rnd() < 0.5 ? `${R(70, 100) | 0},${R(62, 88) | 0},${R(40, 60) | 0}` : `${R(165, 190) | 0},${R(150, 170) | 0},${R(105, 125) | 0}`, R(0.1, 0.3)); }
  M.globalCompositeOperation = 'lighter';
  for (let i = 0; i < (fino ? 90 : 520); i++) { const x = R(-E, E), z = R(-E, E) + oz, r = R(fino ? 30 : 60, fino ? 90 : 260); mancha(M, x, z, r, r * R(0.5, 1), R(0, 3), '0,0,' + (R(70, 150) | 0), R(0.4, 0.9)); }      // prados más verdes
  trazo(M, RIO, 170, 30, '0,0,150', 0.5);
  M.globalCompositeOperation = 'source-over'; trazo(M, RIO, 104, 8, '235,0,30');
  trazo(T, RIO, 104, 8, '205,188,150', 0.85); trazo(T, RIO, 82, 5, '70,66,48', 0.7);
  for (const b of bosquetes) { if (fino && (Math.abs(b.x) > E + b.r || Math.abs(b.z - oz) > E + b.r)) continue; for (let k = 0; k < 7; k++) { const a = R(0, 6.28), q = R(0, b.r * 0.7); mancha(T, b.x + Math.cos(a) * q, b.z + Math.sin(a) * q * 0.7, b.r * R(0.35, 0.7), b.r * R(0.25, 0.5), R(0, 3), `${R(44, 62) | 0},${R(58, 76) | 0},${R(34, 46) | 0}`, R(0.4, 0.75)); } mancha(M, b.x, b.z, b.r * 1.1, b.r * 0.8, 0, '0,0,200', 0.8); }
  if (fino) for (let i = 0; i < 1400; i++) mancha(T, R(-EC, EC), R(-EC, EC) + oz, R(1.5, 6), R(1, 4), R(0, 3), rnd() < 0.6 ? '60,50,40' : '190,176,150', R(0.08, 0.25));
}

/* lo que ha hecho el jugador (y lo que ha nacido solo) */
function pintarCiudad3(M, T, E, fino) {
  const px = fino ? EC * 2 / TC3 : EP * 2 / TP3;
  M.globalCompositeOperation = 'source-over';
  /* campos de las granjas */
  for (const e of E.edificios) { if (!e.campo) continue; const lodo = e.ruina > 0;
    if (!fino) { M.globalCompositeOperation = 'lighter'; M.fillStyle = 'rgb(0,200,0)'; poli(M, e.campo); M.fill(); M.globalCompositeOperation = 'source-over'; }
    T.fillStyle = lodo ? 'rgba(92,80,62,0.9)' : e.obra ? 'rgba(112,96,74,0.85)' : e.vega ? 'rgba(150,150,84,0.88)' : 'rgba(186,164,108,0.88)'; poli(T, e.campo); T.fill();
    T.save(); poli(T, e.campo); T.clip(); const a = e.campo[0], b = e.campo[1], c = e.campo[3], L = Math.hypot(c[0] - a[0], c[1] - a[1]); T.strokeStyle = lodo ? 'rgba(60,50,40,0.3)' : e.vega ? 'rgba(60,84,34,0.42)' : 'rgba(70,52,34,0.26)'; T.lineWidth = Math.max(px * 0.9, 0.9); T.beginPath();
    for (let s = 1.5; s < L; s += fino ? 2.6 : 4) { T.moveTo(a[0] + (c[0] - a[0]) * s / L, a[1] + (c[1] - a[1]) * s / L); T.lineTo(b[0] + (c[0] - a[0]) * s / L, b[1] + (c[1] - a[1]) * s / L); } T.stroke(); T.restore();
    T.setLineDash([14, 4]); T.lineWidth = fino ? 1.5 : 3.2; T.strokeStyle = 'rgba(50,58,32,0.7)'; poli(T, e.campo); T.stroke(); T.setLineDash([]); }
  /* tierra pisada alrededor de cada casa y de cada edificio */
  for (const l of E.parcelas) if (l.casa && !l.fuera) mancha(M, l.x, l.z, 12, 12, 0, '225,0,0', 0.95);
  for (const e of E.edificios) mancha(M, e.x, e.z, 22, 22, 0, '215,0,0', 0.95);
  /* calles: tierra batida con el centro gastado; las de barrio alto, empedradas */
  for (const c of E.vias) { if (fino && (c.caja[2] < -EC - 20 || c.caja[0] > EC + 20 || c.caja[3] < CZ - EC - 20 || c.caja[1] > CZ + EC + 20)) continue;
    if (c.emp) { trazo(M, c.p, c.w * 2 + 1, 1.2, fino ? '70,255,0' : '230,0,0'); trazo(T, c.p, c.w * 2, 1.4, '150,140,124', 0.6); }
    else { trazo(M, c.p, c.w * 2 + (c.t === 'camino' ? 2 : 1.2), 1.4, '255,0,0'); trazo(T, c.p, c.w * 2, 1.6, '142,128,104', 0.8); trazo(T, c.p, c.w * 0.8, c.w * 0.4, '196,178,142', 0.7); } }
  /* plaza del foro, enlosada */
  if (E.foro) { const f = E.foro, c = Math.cos(f.ang), s = Math.sin(f.ang), rect = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [f.x + u * f.w / 2 * c - v * f.d / 2 * s, f.z + u * f.w / 2 * s + v * f.d / 2 * c]);
    M.fillStyle = fino ? 'rgb(40,255,0)' : 'rgb(230,0,0)'; poli(M, rect); M.fill(); trazo(M, rect, 1, 2, fino ? '40,255,0' : '230,0,0', 1, true); T.fillStyle = 'rgba(150,140,124,0.55)'; poli(T, rect); T.fill(); }
  /* sombra de contacto */
  const huella = (x, z, ang, w, d, m, a) => { T.save(); T.translate(x, z); T.rotate(ang); for (let k = 0; k < 3; k++) { const e = m * (1 - k / 3); T.fillStyle = `rgba(50,42,34,${a * [0.3, 0.45, 0.7][k]})`; T.beginPath(); T.roundRect(-w / 2 - e, -d / 2 - e, w + 2 * e, d + 2 * e, e + 0.5); T.fill(); } T.restore(); };
  if (fino) for (const l of E.parcelas) if (l.casa && !l.fuera) { const k = [0, 0.55, 0.66, 0.86, 0.98][l.casa.nivel]; huella(l.x, l.z, l.ang, 13.5 * k, 14 * k, 2.5, l.casa.ruina ? 0.8 : 0.55); }
  for (const e of E.edificios) huella(e.x, e.z, e.ang + Math.PI / 2, e.w, e.d, 3, 0.45);
  if (E.muralla.fase && E.surco) trazo(T, E.surco, 8, 5, '48,42,34', 0.5, true);
}

/* CN15a: tintes por estación (primavera, verano, otoño, invierno). MULTIPLICADORES, no repintan texturas: así el terreno futuro (CN19) también los recibe.
   Suaves: primavera verde fresco, verano dorado y seco, otoño ocre, invierno apagado y frío. Mezcla de la estación k hacia la siguiente con f (0..1). */
const EST_SUELO = [[0.94, 1.06, 0.92], [1.03, 1.0, 0.93], [1.10, 0.95, 0.80], [0.91, 0.96, 1.03]];
const EST_ARBOL = [[0.95, 1.08, 0.90], [1.02, 1.0, 0.92], [1.22, 0.92, 0.70], [0.88, 0.94, 1.0]];
/* Multiplicador del suelo por terreno de colonia: costa arena clara, pantano verde oscuro húmedo, terrazas ocre, llanura verde claro. */
const TINTE_TERRENO = { costa: [1.18, 1.12, 0.92], pantano: [0.74, 0.88, 0.7], terrazas: [1.12, 1.0, 0.78], llanura: [0.94, 1.1, 0.9] };
export function tintesEstacion(k, f) { const a = ((k % 4) + 4) % 4, b = (a + 1) % 4, m = (T) => T[a].map((x, i) => x + (T[b][i] - x) * f); return { suelo: m(EST_SUELO), arbol: m(EST_ARBOL) }; }
export function crearSuelo3(texs, U, bosquetes) {
  const juego = (fino, semilla) => { const n = fino ? TC3 : TP3, nm = fino ? MC3 : MP3, Ex = fino ? EC : EP, oz = fino ? CZ : 0;
    const M = lienzo(nm, 'rgb(0,0,0)'), T = lienzo(n, 'rgb(128,128,128)'), pon = (g, k) => g.setTransform(k / (2 * Ex), 0, 0, k / (2 * Ex), k / 2, k / 2 - oz * k / (2 * Ex)); pon(M, nm); pon(T, n);
    pintarBase3(M, T, bosquetes, fino, azar(semilla));
    const copia = g => { const c = document.createElement('canvas'); c.width = c.height = g.canvas.width; c.getContext('2d').drawImage(g.canvas, 0, 0); return c; };
    const tex = c => { const t = new THREE.CanvasTexture(c.canvas); t.colorSpace = THREE.NoColorSpace; t.flipY = false; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
    return { M, T, bM: copia(M), bT: copia(T), m: tex(M), t: tex(T), pon: () => { pon(M, nm); pon(T, n); }, fino }; };
  const Cj = juego(true, 11), Pj = juego(false, 23);
  /* mapa de calor */
  const cc = document.createElement('canvas'); cc.width = cc.height = N_CALOR; const cg = cc.getContext('2d'), tCal = new THREE.CanvasTexture(cc); tCal.colorSpace = THREE.NoColorSpace; tCal.flipY = false; tCal.magFilter = tCal.minFilter = THREE.LinearFilter; tCal.generateMipmaps = false;
  const uCal = { value: 0 }, uEst = { value: new THREE.Vector3(1, 1, 1) }, uTer = { value: new THREE.Vector3(1, 1, 1) };
  /* malla: densa en el centro, se estira hacia fuera (igual que ciudad2, algo más densa cerca) */
  const NN = 128, pos = new Float32Array((NN + 1) * (NN + 1) * 3), idx = [], f = u => Math.sign(u) * (Math.abs(u) * 520 + Math.pow(Math.abs(u), 3.2) * 3300);
  for (let j = 0; j <= NN; j++) for (let i = 0; i <= NN; i++) { const x = f(i / NN * 2 - 1), z = f(j / NN * 2 - 1) + CZ, o = (j * (NN + 1) + i) * 3; pos[o] = x; pos[o + 1] = altura(x, z); pos[o + 2] = z; }
  for (let j = 0; j < NN; j++) for (let i = 0; i < NN; i++) { const a = j * (NN + 1) + i, b = a + 1, c = a + NN + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uMC: { value: Cj.m }, uTC: { value: Cj.t }, uMP: { value: Pj.m }, uTP: { value: Pj.t }, uCalor: { value: tCal }, uCal, tDry: { value: texs.terr_grass }, tGreen: { value: texs.terr_dry }, tDirt: { value: texs.terr_dirt }, tPav: { value: texs.terr_paving }, uRuido: U.uRuido, uTiempo: U.uTiempo, uEst, uTer });
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `varying vec3 vWP; uniform sampler2D uMC, uTC, uMP, uTP, uCalor, tDry, tGreen, tDirt, tPav; uniform float uCal; uniform vec3 uEst, uTer;\n${GLSL_NUBES}\n` + sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 uc = (vWP.xz - vec2(0.0, ${CZ.toFixed(1)})) / ${(EC * 2).toFixed(1)} + 0.5, up = clamp(vWP.xz / ${(EP * 2).toFixed(1)} + 0.5, 0.002, 0.998);
      vec2 dc = abs(uc - 0.5); float kc = 1.0 - smoothstep(0.42, 0.495, max(dc.x, dc.y));
      vec3 mc = texture2D(uMC, uc).rgb, mp = texture2D(uMP, up).rgb, tc = texture2D(uTC, uc).rgb, tp = texture2D(uTP, up).rgb;
      float tierra = mix(mp.r, mc.r, kc), losa = mc.g * kc, labor = mp.g, verde = mix(mp.b, mc.b, kc);
      vec3 tinte = mix(tp, tc, kc) * 2.0;
      float g1 = texture2D(uRuido, vWP.xz * 0.0031).g, g2 = texture2D(uRuido, vWP.xz * 0.00071 + 0.21).r, g3 = texture2D(uRuido, vWP.xz * 0.023).b;
      vec2 q = vWP.xz;
      vec3 seco = mix(texture2D(tDry, q / 23.0).rgb, texture2D(tDry, q / 71.0 + 0.37).rgb, 0.45); seco = mix(seco, vec3(dot(seco, vec3(0.33))), 0.38) * vec3(0.98, 0.93, 0.80);
      vec3 hier = texture2D(tGreen, q / 19.0).rgb * vec3(0.80, 0.86, 0.62);
      vec3 tie0 = texture2D(tDirt, q / 17.0).rgb * (0.92 + 0.16 * g3); vec3 tie = tie0 * vec3(1.2, 1.02, 0.82);
      vec3 lab = tie0 * vec3(1.05, 0.98, 0.86);
      vec3 pav = texture2D(tPav, q / 11.0).rgb * vec3(0.98, 0.93, 0.84);
      vec3 col = seco * mix(0.86, 1.1, g2);
      col = mix(col, tie * 1.02, smoothstep(0.55, 0.8, g1 + g2 * 0.5) * 0.55);
      col = mix(col, hier, clamp(verde * 1.1, 0.0, 1.0) * (0.75 + 0.25 * g3));
      col = mix(col, lab, clamp(labor, 0.0, 1.0));
      col = mix(col, tie, smoothstep(0.35 - g3 * 0.25, 0.75, tierra));
      col = mix(col, pav, smoothstep(0.4, 0.7, losa + (g3 - 0.5) * 0.3));
      col *= tinte;
      float lejos = smoothstep(500.0, 2200.0, length(vWP.xz)); col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * vec3(0.92, 1.0, 1.1), lejos * 0.42);
      float monte = smoothstep(0.36, 0.56, g2 * 0.55 + g1 * 0.6) * smoothstep(1100.0, 1900.0, length(vWP.xz)); col = mix(col, vec3(0.16, 0.20, 0.12) * (0.7 + 0.6 * g3), monte * 0.8); col *= mix(1.0, 0.8, lejos); col = mix(col, vec3(0.17, 0.21, 0.14) * (0.75 + 0.5 * g1), smoothstep(30.0, 170.0, vWP.y) * smoothstep(800.0, 1300.0, length(vWP.xz)) * 0.75);
      float lj = smoothstep(1500.0, 2300.0, length(vWP.xz)), g4 = texture2D(uRuido, vWP.xz * 0.0052 + 0.4).b;
      col = mix(col, vec3(0.42, 0.40, 0.27) * (0.8 + 0.4 * g3), lj * smoothstep(0.45, 0.62, g4 + g2 * 0.3) * 0.7); col = mix(col, vec3(0.07, 0.10, 0.06), lj * smoothstep(0.40, 0.56, g1 * 0.75 + g4 * 0.4) * 0.8); col = mix(col, vec3(0.60, 0.57, 0.52), lj * smoothstep(0.62, 0.78, g3 * 0.55 + g4 * 0.6) * smoothstep(60.0, 220.0, vWP.y) * 0.7);
      vec2 uh = (vWP.xz - vec2(${X0.toFixed(1)}, ${Z0.toFixed(1)})) / ${LADO.toFixed(1)}; vec4 ca = texture2D(uCalor, clamp(uh, 0.0, 1.0));
      float lum = dot(col, vec3(0.3, 0.5, 0.2)); col = mix(col, ca.rgb * (0.55 + 0.9 * lum), ca.a * uCal * step(0.0, uh.x) * step(uh.x, 1.0) * step(0.0, uh.y) * step(uh.y, 1.0));
      diffuseColor.rgb = col * uEst * uTer * nubes(vWP);`);
  };
  mat.customProgramCacheKey = () => 'q1k-suelo';
  const malla = new THREE.Mesh(geo, mat); malla.receiveShadow = true;
  return { malla,
    /* tinte de la estación k (0..3) mezclado con la siguiente según f (0..1) */
    /* CN19-B: tinte por terreno de colonia, como multiplicador (no repinta texturas) */
    terreno(t) { uTer.value.set(...(TINTE_TERRENO[t] || [1, 1, 1])); },
    estacion(k, f) { uEst.value.set(...tintesEstacion(k, f).suelo); },
    /* repinta lo construido sobre el terreno base */
    pintar(E) { const fb = E.edificios.map(e => e.tipo === 'granja' ? (e.obra ? 'o' : e.ruina ? 'r' : 'g') : '').join('') + '|' + E.vias.length + '|' + E.vias.filter(v => v.emp).length + '|' + E.muralla.fase + '|' + !!E.foro, basto = fb !== this.fb; this.fb = fb;
      for (const J of basto ? [Cj, Pj] : [Cj]) { for (const [g, b] of [[J.M, J.bM], [J.T, J.bT]]) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'copy'; g.drawImage(b, 0, 0); g.globalCompositeOperation = 'source-over'; } J.pon(); pintarCiudad3(J.M, J.T, E, J.fino); J.m.needsUpdate = J.t.needsUpdate = true; } },
    /* notas (Float32Array N_CALOR²) o null para apagar */
    calor(notas) { if (!notas) { uCal.value = 0; return; } const im = cg.createImageData(N_CALOR, N_CALOR), d = im.data;
      for (let i = 0; i < notas.length; i++) { const n = notas[i], o = i * 4; if (n <= -99) { d[o + 3] = 0; continue; } const c = n >= 3 ? [70, 170, 60] : n >= 0 ? [215, 165, 50] : [190, 50, 36]; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = n >= 3 ? 150 : n >= 0 ? 95 : n <= -9 ? 100 : 135; }
      cg.putImageData(im, 0, 0); tCal.needsUpdate = true; uCal.value = 1; } };
}
