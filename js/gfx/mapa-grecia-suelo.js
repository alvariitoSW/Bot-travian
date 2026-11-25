/* AQVILA · AM2 — mapa vivo de Grecia: el suelo, el mar y las líneas tendidas (ríos y caminos).
   Cómo está hecho (para que vaya fluido en el móvil):
   - El relieve es UNA textura de alturas (assets/mapa-grecia/alturas.png). Una sola malla sigue a la cámara y se levanta en la
     tarjeta gráfica leyendo esa textura: de lejos cubre toda Grecia, de cerca solo lo que se ve, siempre con los mismos triángulos.
   - El color de lejos viene ya pintado (suelo-a.webp / suelo-b.webp, tools/mapa-grecia). De cerca, el propio sombreador dibuja
     encima parcelas, copas de árbol, matorral y roca, a un tamaño que se adapta a la altura: por eso no se ve borroso al ampliar.
   - La costa sale de la textura de alturas punto a punto (no de la malla): limpia a cualquier altura.
   Arte propio. Datos de relieve de dominio público (assets/mapa-grecia/LICENSE.txt). */
import { THREE } from './models.js';
import { MARCO, X, Z } from './mapa-grecia-datos.js';

export const ANCHO = (MARCO.x1 - MARCO.x0) * MARCO.kx, FONDO = (MARCO.y1 - MARCO.y0) * MARCO.kz, XI = X(MARCO.x0), ZN = Z(MARCO.y1);
export const KY_CERCA = 2.2e-4, KY_LEJOS = 7.0e-4;   // unidades de mapa por metro de altura (de cerca casi real; de lejos, relieve exagerado)
const BASE = new URL('../../assets/mapa-grecia/', import.meta.url).href;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x, mix = (a, b, t) => a + (b - a) * t;
const h2 = (x, y) => { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

/* ---------- carga del relieve ---------- */
export async function cargarRelieve() {
  const bl = await (await fetch(BASE + 'alturas.png')).blob();
  let img; try { img = await createImageBitmap(bl, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }); } catch (e) { img = await createImageBitmap(bl); }
  const nx = img.width, nz = img.height, c = document.createElement('canvas'); c.width = nx; c.height = nz;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); if (img.close) img.close();
  const d = g.getImageData(0, 0, nx, nz).data, n = nx * nz, alt = new Int16Array(n), media = new Uint16Array(n), costa = new Uint8Array(n), aMedia = THREE.DataUtils.toHalfFloat;
  /* el dato redondea el mar a 20 m y deja a 0 los bajíos: aquí se decide con la distancia a la costa (canal azul) qué es mar y qué tierra,
     para que la orilla sea una sola línea limpia: el mar baja deprisa junto a la costa y la tierra sube al menos 2 */
  for (let i = 0; i < n; i++) { let m = Math.round((d[i * 4] * 256 + d[i * 4 + 1]) / 6 - 5000); const co = d[i * 4 + 2];
    if (co < 128) m = Math.min(m, -4 - Math.round(40 * Math.min(1, (128 - co) / 12))); else if (m < 2) m = 2;
    alt[i] = m; media[i] = aMedia(m); costa[i] = co; }
  c.width = c.height = 1;
  const tAlt = new THREE.DataTexture(media, nx, nz, THREE.RedFormat, THREE.HalfFloatType); tAlt.magFilter = tAlt.minFilter = THREE.LinearFilter; tAlt.needsUpdate = true;
  const tCosta = new THREE.DataTexture(costa, nx, nz, THREE.RedFormat, THREE.UnsignedByteType); tCosta.magFilter = tCosta.minFilter = THREE.LinearFilter; tCosta.needsUpdate = true;
  /* altura en metros de un punto del mapa (x, z en unidades), interpolada como lo hace la tarjeta gráfica */
  const altura = (x, z) => { let fx = (x - XI) / ANCHO * nx - 0.5, fz = (z - ZN) / FONDO * nz - 0.5; fx = clamp(fx, 0, nx - 1.001); fz = clamp(fz, 0, nz - 1.001);
    const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * nx + i; return mix(mix(alt[k], alt[k + 1], u), mix(alt[k + nx], alt[k + nx + 1], u), v); };
  /* distancia a la costa en km (tierra +, mar −; satura a ±5,8) */
  const costaKm = (x, z) => { const i = clamp(Math.round((x - XI) / ANCHO * nx - 0.5), 0, nx - 1), j = clamp(Math.round((z - ZN) / FONDO * nz - 0.5), 0, nz - 1); return (costa[j * nx + i] - 128) / 8 * 0.366; };
  return { alt, nx, nz, tAlt, tCosta, altura, costaKm };
}
export function cargarImagen(nombre, color) {
  return new Promise((ok, mal) => new THREE.TextureLoader().load(BASE + nombre, t => { t.flipY = false; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; t.needsUpdate = true; ok(t); }, undefined, mal));
}
/* lee una imagen a memoria (para saber dónde hay bosque o campos al colocar cosas) */
export async function leerImagen(nombre) {
  const bl = await (await fetch(BASE + nombre)).blob(), img = await createImageBitmap(bl), c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data, w = c.width, h = c.height; c.width = c.height = 1;
  return (x, z, canal) => { const i = clamp(Math.floor((x - XI) / ANCHO * w), 0, w - 1), j = clamp(Math.floor((z - ZN) / FONDO * h), 0, h - 1); return d[(j * w + i) * 4 + canal] / 255; };
}

/* textura de ruido que se repite: R y G ondas (dos tamaños), B nubes anchas, A ondas finas */
export function texturaRuido() {
  const N = 256, im = new Uint8Array(N * N * 4);
  const per = (x, y, f, s) => { const xi = Math.floor(x * f / N), yi = Math.floor(y * f / N), fx = x * f / N - xi, fy = y * f / N - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = (a, b) => h2((a % f) + s * 131, (b % f) + s * 71);
    return mix(mix(q(xi, yi), q(xi + 1, yi), u), mix(q(xi, yi + 1), q(xi + 1, yi + 1), u), v); };
  const f = (x, y, f0, s) => (per(x, y, f0, s) * 0.5 + per(x, y, f0 * 2, s + 1) * 0.28 + per(x, y, f0 * 4, s + 2) * 0.15 + per(x, y, f0 * 8, s + 3) * 0.07);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = (y * N + x) * 4; im[k] = f(x, y, 8, 1) * 255; im[k + 1] = f(x, y, 16, 9) * 255; im[k + 2] = f(x, y, 4, 20) * 255; im[k + 3] = f(x, y, 32, 31) * 255; }
  const t = new THREE.DataTexture(im, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
}
/* dados: cuatro números al azar por casilla (para parcelas y copas), sin suavizar */
export function texturaAzar() {
  const N = 64, im = new Uint8Array(N * N * 4); for (let i = 0; i < N * N * 4; i++) im[i] = h2(i, 977) * 255;
  const t = new THREE.DataTexture(im, N, N, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
export const crudo = c => { const k = new THREE.Color(); k.setRGB(parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255, THREE.LinearSRGBColorSpace); return k; };

/* ---------- trozos comunes de los sombreadores ---------- */
export const GLSL_COMUN = `
uniform sampler2D tAlt, tCosta, tRuido, tAzar;
uniform vec4 uMarco;            // esquina noroeste (x, z) y 1/ancho, 1/fondo
uniform float t, uKy, uPx, uCerca, uNubes, uRec;
uniform vec3 cNiebla;
vec2 uvM(vec2 p){ return (p - uMarco.xy) * uMarco.zw; }
float altM(vec2 p){ return texture2D(tAlt, clamp(uvM(p), 0.0003, 0.9997)).r; }
/* la orilla, de cerca, con sus entrantes y salientes (el dato es de una casilla cada 370 m) */
/* altura con curvas suaves entre casillas (B-spline cúbica con 4 lecturas): de cerca la orilla no hace esquinas */
float altFina(vec2 p){ vec2 res = vec2(2160.0, 1920.0), st = clamp(uvM(p), 0.0003, 0.9997) * res - 0.5, i = floor(st), f = st - i;
  vec2 w0 = (1.0 - f) * (1.0 - f) * (1.0 - f) / 6.0, w1 = (4.0 - 6.0 * f * f + 3.0 * f * f * f) / 6.0, w2 = (1.0 + 3.0 * f + 3.0 * f * f - 3.0 * f * f * f) / 6.0, w3 = f * f * f / 6.0;
  vec2 g0 = w0 + w1, g1 = w2 + w3, h0 = (i - 0.5 + w1 / g0) / res, h1 = (i + 1.5 + w3 / g1) / res;
  return (texture2D(tAlt, vec2(h0.x, h0.y)).r * g0.x + texture2D(tAlt, vec2(h1.x, h0.y)).r * g1.x) * g0.y + (texture2D(tAlt, vec2(h0.x, h1.y)).r * g0.x + texture2D(tAlt, vec2(h1.x, h1.y)).r * g1.x) * g1.y; }
float costaKm(vec2 p){ return (texture2D(tCosta, clamp(uvM(p), 0.0003, 0.9997)).r * 255.0 - 128.0) / 8.0 * 0.366; }
float altCosta(vec2 p, float a){ if (uCerca < 0.01 || abs(a) > 60.0) return a; float af = mix(a, altFina(p), uCerca), n = texture2D(tRuido, p * 2.3).r - 0.5;
  return af + n * clamp(abs(af) * 1.6, 2.0, 14.0) * smoothstep(50.0, 0.0, abs(af)) * smoothstep(0.5, 0.15, abs(costaKm(p))) * uCerca; }
vec4 dado(vec2 id){ return texture2D(tAzar, (id + 0.5) / 64.0); }
/* grano fino que no cambia de tamaño en pantalla al ampliar (dos octavas que se relevan) */
float grano(vec2 p, float k){ float l = log2(k / uPx), f = exp2(floor(l)), b = fract(l); return mix(texture2D(tRuido, p * f).g, texture2D(tRuido, p * f * 2.0).g, b); }
/* luz del relieve calculada al vuelo (de cerca la pintura ya hecha queda blanda): pendiente a un lado y otro de la casilla */
float luzRelieve(vec2 p){ vec2 e = vec2(1.0) / (uMarco.zw * vec2(2160.0, 1920.0)); float hx = altM(p + vec2(e.x, 0.0)) - altM(p - vec2(e.x, 0.0)), hz = altM(p + vec2(0.0, e.y)) - altM(p - vec2(0.0, e.y));
  vec3 n = normalize(vec3(-hx * 0.0035, 1.0, -hz * 0.0035)); return clamp(dot(n, vec3(-0.553, 0.623, -0.553)) / 0.623, 0.0, 1.6); }
float sombraNube(vec2 p){ float n = texture2D(tRuido, p * 0.011 + vec2(t * 0.0042, t * 0.0017)).b, m = texture2D(tRuido, p * 0.031 - vec2(t * 0.003, -t * 0.002)).b; return 1.0 - uNubes * smoothstep(0.50, 0.66, n * 0.7 + m * 0.3); }
float borde(vec2 p){ vec2 e = vec2(1.0) / uMarco.zw, q = min(p - uMarco.xy, uMarco.xy + e - p); return smoothstep(-0.5, 3.5, min(q.x, q.y)); }
/* más allá del marco: en A, bruma y bancos de nubes; en B, el margen del pergamino con su doble filete */
uniform float uCarta;
vec3 fuera(vec3 c, vec2 p){ vec2 e = vec2(1.0) / uMarco.zw, q = min(p - uMarco.xy, uMarco.xy + e - p); float d = min(q.x, q.y);
  if (uCarta > 0.5) { vec3 papel = cNiebla * (0.95 + 0.1 * texture2D(tRuido, p * 0.05).b); float w = max(0.12, uPx * 1.6);
    c = mix(papel, c, smoothstep(-0.2, 0.2, d / w)); float f1 = smoothstep(w, 0.0, abs(d + 0.6)) + smoothstep(w * 0.6, 0.0, abs(d + 1.0)); return mix(c, vec3(0.29, 0.19, 0.12), clamp(f1, 0.0, 1.0) * 0.9); }
  float n = texture2D(tRuido, p * 0.03 + vec2(t * 0.002, 0.0)).b * 0.6 + texture2D(tRuido, p * 0.11).r * 0.4; float n2 = texture2D(tRuido, p * 0.27 + vec2(t * 0.004, 0.0)).g; vec3 bruma = mix(cNiebla * vec3(0.9, 0.94, 0.99), vec3(0.98, 0.98, 0.97), smoothstep(0.52, 0.8, n * 0.75 + n2 * 0.25) * 0.85);
  return mix(bruma, c, smoothstep(0.2, 3.0 + n * 6.0, d)); }
float bordeMar(vec2 p){ vec2 e = vec2(1.0) / uMarco.zw; return smoothstep(-0.5, 3.5, min(p.y - uMarco.y, uMarco.x + e.x - p.x)) * smoothstep(-34.0, -12.0, p.x - uMarco.x) * smoothstep(-40.0, -14.0, uMarco.y + e.y - p.y); }
`;
const GLSL_FORMAS = `
/* copas de árbol vistas desde arriba: en cada casilla de lado d, un redondel con su luz y su sombra */
vec3 copa(vec2 p, float d, float dens){ vec2 q = p / d, id = floor(q), f = fract(q); vec4 h = dado(id);
  vec2 c = 0.3 + 0.4 * h.xy; float r = 0.12 + 0.18 * h.z * h.z, hay = step(h.w, dens);
  float cuerpo = hay * smoothstep(r, r * 0.72, length(f - c)), luz = hay * smoothstep(r * 0.75, 0.0, length(f - c + vec2(0.07, 0.07))), som = hay * smoothstep(r * 1.15, r * 0.6, length(f - c - vec2(0.13, 0.11)));
  return vec3(cuerpo, luz, som * (1.0 - cuerpo)); }
/* copas a un tamaño que se adapta a la altura de la cámara: siempre miden unos 9-18 px, con un tamaño mínimo real */
vec3 copas(vec2 p, float dMin, float dens){ float l = log2(max(uPx * 10.0, dMin) / dMin), k = floor(l), b = fract(l), d = dMin * exp2(k);
  vec3 a = copa(p, d, dens), c = copa(p + 3.7, d * 2.0, dens); return mix(a, c, smoothstep(0.35, 0.95, b)); }
/* parcelas: hileras giradas, cada una partida en trozos de ancho distinto */
/* (p ya viene curvado con el ruido: esa lectura se hace fuera de las ramas) */
void parcela(vec2 p, float tam, out vec4 h, out float bord, out vec2 f){ vec2 q = vec2(p.x * 0.94 + p.y * 0.34, p.y * 0.94 - p.x * 0.34) / tam; float fila = floor(q.y);
  vec4 hf = dado(vec2(fila, 11.0)); q.x = q.x * (0.5 + 0.6 * hf.x) + hf.y * 9.0; vec2 id = vec2(floor(q.x), fila); f = fract(q); h = dado(id); bord = min(min(f.x, 1.0 - f.x) / (0.5 + 0.6 * hf.x), min(f.y, 1.0 - f.y)); }
`;

const VERT_SUELO = `
uniform sampler2D tAlt; uniform vec4 uMarco; uniform float uKy; uniform vec3 uRejilla;   // centro (x, z) y lado de casilla
varying vec3 vW;
void main(){ vec2 p = uRejilla.xy + position.xz * uRejilla.z; float a = texture2D(tAlt, clamp((p - uMarco.xy) * uMarco.zw, 0.0003, 0.9997)).r;
  vW = vec3(p.x, a > 0.0 ? a * uKy : max(a, -60.0) * uKy * 0.5, p.y); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`;

/* estilo A: relieve natural */
const FRAG_SUELO_A = `
uniform sampler2D tMacro, tMasc; varying vec3 vW;` + GLSL_COMUN + GLSL_FORMAS + `
vec3 cultivo(float h){ return h < 0.26 ? vec3(0.86, 0.74, 0.40) : h < 0.46 ? vec3(0.60, 0.66, 0.36) : h < 0.62 ? vec3(0.66, 0.53, 0.37) : h < 0.80 ? vec3(0.78, 0.72, 0.48) : vec3(0.68, 0.64, 0.42); }
void main(){
  vec2 p = vW.xz, uv = uvM(p), pc = p + (texture2D(tRuido, p * 0.35).rg - 0.5) * 0.13; float a = altM(p), ac = altCosta(p, a);
  vec3 c = texture2D(tMacro, uv).rgb, m = texture2D(tMasc, uv).rgb;
  float campos = m.r, bosque = m.g, roca = m.b, lum = dot(c, vec3(0.35, 0.5, 0.15));
  float g1 = grano(p, 0.006), g2 = grano(p + 5.3, 0.0015);
  /* de cerca la orilla tiene playa propia */
  float playa = smoothstep(7.0, 0.5, ac) * smoothstep(0.3, 0.06, costaKm(p)) * uCerca; campos *= 1.0 - playa; bosque *= 1.0 - playa;
  float monte = clamp(1.0 - campos - bosque - roca, 0.0, 1.0);
  if (uPx < 0.02) {
  /* monte bajo: tierra seca y hierba a manchas, con matas de matorral que dan sombra */
 float vm = smoothstep(0.02, 0.006, uPx) * monte, mch = texture2D(tRuido, p * 9.0).r, mch2 = texture2D(tRuido, p * 31.0).g;
  c = mix(c, c * mix(vec3(1.08, 1.0, 0.86), vec3(0.86, 0.98, 0.78), smoothstep(0.35, 0.65, mch)), vm * 0.7 * uCerca); c = mix(c, c * vec3(1.1, 1.04, 0.9), smoothstep(0.55, 0.75, mch2) * vm * 0.5 * uCerca);
  float claros = texture2D(tRuido, p * 3.1 + 0.37).r; vec3 mt = copas(p, 0.0026, 0.75 * smoothstep(0.42, 0.62, mch * 0.5 + claros * 0.5));
  c = mix(c, vec3(0.80, 0.70, 0.50) * (0.75 + 0.5 * lum), smoothstep(0.62, 0.74, texture2D(tRuido, p * 17.0 + 0.11).r) * vm * 0.55 * uCerca);   // calvas de tierra y piedra
  c = mix(c, vec3(0.33, 0.40, 0.22) * (0.7 + 0.6 * lum), mt.x * 0.8 * vm); c *= 1.0 - mt.z * 0.3 * vm; c += vec3(0.06, 0.07, 0.02) * mt.y * vm;
  }
  /* campos de labor: pagos grandes y, dentro, parcelas con surcos */
  float v1 = smoothstep(4.0, 12.0, 0.085 / uPx) * smoothstep(0.25, 0.6, campos), v2 = smoothstep(5.0, 15.0, 0.012 / uPx) * smoothstep(0.25, 0.6, campos);
  if (v1 > 0.001) { vec4 h1, h2; float b1, b2; vec2 f1, f2; parcela(pc, 0.085, h1, b1, f1); parcela(pc + 1.3, 0.012, h2, b2, f2);
    float clase = h2.b > 0.86 ? h2.r : h1.r; vec3 cf = cultivo(mix(h1.r, clase, v2)); cf *= 0.88 + 0.24 * mix(h1.b, 0.5 * (h1.b + h2.g), v2);
    float sur = sin((h2.a > 0.5 ? f2.x : f2.y) * (22.0 + 30.0 * h2.g)) * 0.5 + 0.5; cf *= 1.0 - 0.14 * sur * step(0.42, h2.g) * v2 * smoothstep(0.0035, 0.0012, uPx);
    float mot = texture2D(tRuido, p * 23.0).r, mot2 = texture2D(tRuido, p * 71.0 + 0.3).g; cf *= 1.0 + ((mot - 0.5) * 0.26 + (mot2 - 0.5) * 0.16) * v2; cf = mix(cf, vec3(0.80, 0.72, 0.52), smoothstep(0.62, 0.8, mot2 * 0.6 + mot * 0.4) * step(h2.g, 0.42) * v2 * 0.35);
    if (h1.r > 0.80) { vec3 ol = copas(p, 0.0016, 0.9); float vo = smoothstep(0.012, 0.004, uPx); cf = mix(cf, vec3(0.36, 0.44, 0.26), ol.x * 0.9 * vo); cf *= 1.0 - ol.z * 0.25 * vo; }   // olivar
    cf = mix(cf, cf * 0.74, smoothstep(0.07, 0.02, b2) * v2 * 0.6); cf = mix(cf, vec3(0.78, 0.70, 0.52), smoothstep(0.022, 0.006, b1) * 0.5);     // lindes y sendas
    c = mix(c, cf * (0.55 + 0.75 * lum), v1 * 0.78); }
  /* bosque: copas con su luz y su sombra */
  if (bosque > 0.03) { vec3 cp = copas(p, 0.0028, 0.5 + 0.5 * bosque); float vb = smoothstep(0.03, 0.01, uPx) * smoothstep(0.1, 0.5, bosque);
    vec3 cb = c * (0.82 + 0.3 * g1); cb = mix(cb * 0.84, cb * 1.1 + vec3(0.0, 0.03, 0.0), cp.x); cb += vec3(0.11, 0.15, 0.05) * cp.y; cb *= 1.0 - cp.z * 0.28; c = mix(c, cb, vb); }
  /* roca: vetas claras y oscuras */
  c = mix(c, c * (0.72 + 0.6 * g2), roca * 0.8 * smoothstep(0.02, 0.004, uPx));
  c = mix(c, vec3(0.90, 0.84, 0.66) * (0.9 + 0.2 * g2), playa * 0.85);
  c *= 0.90 + 0.20 * g1; c *= 0.94 + 0.12 * g2;
  if (uPx < 0.03) c *= mix(1.0, min(1.12, 0.74 + 0.36 * luzRelieve(p)), smoothstep(0.03, 0.004, uPx) * 0.8);
  c *= sombraNube(p); c = fuera(c, p);
  if (ac < -2.5) discard;   // el mar lo pinta su propia capa (se descarta al final: las lecturas de textura de arriba necesitan a sus vecinos)
  gl_FragColor = vec4(c, 1.0);
}`;

/* estilo B: carta antigua. Aguada ya pintada; aquí la tinta: rayado de sombras, arbolitos, surcos, línea de costa y fibra del papel */
const FRAG_SUELO_B = `
uniform sampler2D tMacro, tMasc; varying vec3 vW;` + GLSL_COMUN + GLSL_FORMAS + `
float raya(vec2 p, float ang, float k){ float l = log2(k / uPx), f = exp2(floor(l)), b = fract(l), u = dot(p, vec2(cos(ang), sin(ang)));
  return mix(smoothstep(0.16, 0.06, abs(fract(u * f) - 0.5)), smoothstep(0.16, 0.06, abs(fract(u * f * 2.0) - 0.5)), b); }
void main(){
  vec2 p = vW.xz, uv = uvM(p), pc = p + (texture2D(tRuido, p * 0.35).rg - 0.5) * 0.22; float a = altM(p), ac = altCosta(p, a);
  vec3 c = texture2D(tMacro, uv).rgb, m = texture2D(tMasc, uv).rgb, tinta = vec3(0.29, 0.19, 0.12);
  float campos = m.r, bosque = m.g, sombra = m.b, g1 = grano(p, 0.006), g2 = grano(p + 5.3, 0.0015);
  /* rayado de las umbrías: una trama, y otra cruzada donde más oscuro */
  float r1 = raya(p + (g1 - 0.5) * uPx * 5.0, 0.9, 0.17), r2 = raya(p + (g2 - 0.5) * uPx * 4.0, 0.9, 0.34), lejosR = smoothstep(0.0015, 0.006, uPx);
  float tr = r1 * smoothstep(0.12, 0.4, sombra) * 0.55 + r2 * smoothstep(0.5, 0.85, sombra) * 0.4;
  c = mix(c, tinta, tr * (1.0 - bosque * 0.6) * mix(0.18, 1.0, lejosR)); c *= 1.0 - 0.2 * smoothstep(0.15, 0.8, sombra) * (1.0 - lejosR);
  /* bosque: arbolitos a tinta con aguada verde */
  if (bosque > 0.05) { vec3 cp = copas(p, 0.003, 0.45 + 0.5 * bosque); float vb = smoothstep(0.04, 0.012, uPx) * smoothstep(0.1, 0.5, bosque);
    float aro = cp.x * (1.0 - smoothstep(0.0, 0.9, cp.y * 1.8)); c = mix(c, vec3(0.52, 0.62, 0.38), cp.x * 0.75 * vb); c = mix(c, tinta, clamp(aro * 0.9 + cp.z * 0.5, 0.0, 1.0) * vb * 0.8); }
  /* campos: aguadas de dos tonos por pagos; a media altura, surcos a pluma en la mitad de ellos; de cerca, lindes finas (un trazo de pluma, no un catastro) */
  float v2 = smoothstep(5.0, 15.0, 0.011 / uPx) * smoothstep(0.25, 0.6, campos), v1 = smoothstep(4.0, 12.0, 0.2 / uPx) * smoothstep(0.25, 0.6, campos);
  if (v1 > 0.001) { vec4 h1, h2; float b1, b2; vec2 f1, f2; parcela(pc, 0.085, h1, b1, f1); parcela(mix(p, pc, 0.25) + 1.3, 0.012, h2, b2, f2);
    c = mix(c, c * mix(vec3(1.09, 1.0, 0.76), vec3(0.84, 1.0, 0.80), h1.r), v1 * 0.72);
    float rs = raya(p + (g1 - 0.5) * uPx * 4.0, h1.g * 3.1, 0.2) * step(0.45, h1.b); c = mix(c, tinta, rs * v1 * (1.0 - v2) * 0.13);
    float sur = smoothstep(0.6, 0.95, sin((h2.a > 0.5 ? f2.x : f2.y) * 31.0)) * step(0.35, h2.r); c = mix(c, tinta, sur * v2 * 0.09 * smoothstep(0.0035, 0.0012, uPx));
    c = mix(c, c * mix(vec3(1.05, 0.98, 0.8), vec3(0.88, 0.98, 0.82), h2.g), v2 * 0.4);
    if (h1.r > 0.78) { vec3 ol = copas(p, 0.0016, 0.85); float vo = smoothstep(0.012, 0.004, uPx), aro = ol.x * (1.0 - smoothstep(0.0, 0.9, ol.y * 1.8)); c = mix(c, vec3(0.56, 0.64, 0.40), ol.x * 0.7 * vo); c = mix(c, tinta, clamp(aro * 0.8 + ol.z * 0.4, 0.0, 1.0) * vo * 0.7); }   // olivar a pluma
    float w2 = uPx / 0.012, w1 = uPx / 0.085, cerca1 = smoothstep(0.012, 0.004, uPx);
    c = mix(c, tinta, smoothstep(w2 * 1.5, w2 * 0.5, b2) * v2 * 0.12 * step(0.35, h2.b));
    float agu = texture2D(tRuido, p * 19.0).r, agu2 = texture2D(tRuido, p * 57.0 + 0.4).g; c *= 1.0 + ((agu - 0.5) * 0.2 + (agu2 - 0.5) * 0.12) * v2; c = mix(c, tinta, smoothstep(0.7, 0.9, agu2) * step(h2.g, 0.3) * v2 * 0.1); c = mix(c, tinta, smoothstep(w1 * 2.0, w1 * 0.6, b1) * v1 * cerca1 * mix(0.16, 0.07, v2)); }
  /* monte bajo: matas sueltas a pluma (de cerca) */
  if (uPx < 0.006) { float monte = clamp(1.0 - campos * 1.6 - bosque * 2.0, 0.0, 1.0), vm = smoothstep(0.006, 0.002, uPx) * monte; vec3 mt = copas(p + 7.1, 0.0024, 0.2 + 0.4 * smoothstep(0.4, 0.6, texture2D(tRuido, p * 4.3).r)); float am = texture2D(tRuido, p * 15.0 + 0.2).r; c *= 1.0 + (am - 0.5) * 0.22 * vm; c = mix(c, c * vec3(0.9, 0.98, 0.8), smoothstep(0.5, 0.7, am) * vm * 0.5);
    float aro = mt.x * (1.0 - smoothstep(0.0, 0.9, mt.y * 1.8)); c = mix(c, vec3(0.60, 0.66, 0.42), mt.x * 0.55 * vm); c = mix(c, tinta, clamp(aro * 0.8 + mt.z * 0.35, 0.0, 1.0) * vm * 0.6); }
  /* línea de costa a tinta, siempre fina */
  c = mix(c, vec3(0.2, 0.13, 0.09), mix(smoothstep(1.0, 0.15, abs(costaKm(p)) / max(0.25, uPx * 14.0)), smoothstep(2.4, 1.0, abs(ac) / max(fwidth(ac), 1e-5)) * step(abs(costaKm(p)), 0.35), uCerca) * 0.9);
  c *= 0.93 + 0.14 * g2; c *= 0.96 + 0.08 * texture2D(tRuido, p * vec2(0.9, 0.25)).a;
  c *= sombraNube(p); c = fuera(c, p);
  if (ac < -2.5) discard;   // el mar lo pinta su propia capa (se descarta al final: las lecturas de textura de arriba necesitan a sus vecinos)
  gl_FragColor = vec4(c, 1.0);
}`;

const VERT_MAR = 'varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }';
const FRAG_MAR = `
uniform vec3 cA, cB, cEsp, cEspuma, uSol; uniform float uBrillo, uEspuma, uOndas, uDura, uRayas, uTinta; varying vec3 vW;` + GLSL_COMUN + `
void main(){
  vec2 p = vW.xz, u = uvM(p); float ext = step(u.x, 0.0) + step(1.0, u.x) + step(u.y, 0.0) + step(1.0, u.y);
  float a = altM(p); if (ext < 0.5 && a > 60.0) discard;                       // tierra firme: el mar no tiene nada que pintar
  float ac = altCosta(p, a), dk = -costaKm(p);
  if (ext > 0.5) { vec2 e0 = vec2(1.0) / uMarco.zw, q0 = max(uMarco.xy - p, p - uMarco.xy - e0); float s0 = smoothstep(0.0, 1.5, max(q0.x, q0.y)); ac = -mix(clamp(-a, 400.0, 3000.0), 1800.0, s0); dk = 9.0; }
  if (ac > 1.0 && ext < 0.5) discard;
  float hondo = max(0.0, -ac), px = uPx * 10.0;                                   // px: km por píxel
  /* distancia a la orilla: de lejos, la del dato; de cerca, la que da el fondo (así sigue a la orilla fina) */
  float dOr = mix(max(dk, 0.0), hondo * 0.011, uCerca);
  /* olas a tres tamaños que se relevan al ampliar */
  float l = log2(0.02 / uPx), f = exp2(floor(l)), fb = fract(l);
  float n1 = texture2D(tRuido, p * 0.09 * f + vec2(t * 0.010, t * 0.006) * f).r, n1b = texture2D(tRuido, p * 0.18 * f + vec2(t * 0.010, t * 0.006) * f * 2.0).r;
  float n2 = texture2D(tRuido, p * 0.23 * f - vec2(t * 0.015, -t * 0.010) * f).g, n3 = texture2D(tRuido, p * 0.8 * f + vec2(t * 0.028, t * 0.019) * f).a;
  n1 = mix(n1, n1b, fb); float w = n1 * 0.5 + n2 * 0.33 + n3 * 0.17, lejos = texture2D(tRuido, p * 0.02).b;
  vec3 c = mix(cA, cB, smoothstep(0.0, 1.0, sqrt(clamp(hondo / 1400.0, 0.0, 1.0)) + (w - 0.5) * 0.05 + (lejos - 0.5) * 0.05));
  c = mix(c, cA * 1.12, smoothstep(14.0, 0.0, hondo) * 0.55 * uCerca);          // bajíos claros junto a la playa
  c *= 1.0 + uOndas * (w - 0.5) * 0.42;
  vec3 V = normalize(cameraPosition - vW), N = normalize(vec3((n2 - 0.5) * 0.5 + (n1 - 0.5) * 0.3, 1.0, (n1 - 0.5) * 0.5 + (n2 - 0.5) * 0.3)), Hh = normalize(V + uSol);
  c += cEsp * pow(max(dot(N, Hh), 0.0), 60.0) * uBrillo * (0.4 + n3);
  c += cEsp * smoothstep(0.78, 0.92, n3 * 0.6 + n2 * 0.4) * 0.05 * uBrillo * smoothstep(0.3, 2.0, dOr / max(px * 30.0, 0.05));   // crestas sueltas mar adentro
  /* espuma: una franja de unos 12 px que rompe contra la orilla */
  float wk = clamp(px * 12.0, 0.03, 1.6), q = dOr / wk;
  if (uRayas > 0.0) { float r = sin(q * 9.0 - t * 0.5); c = mix(c, cEspuma, uRayas * smoothstep(0.80, 0.97, r) * smoothstep(3.2, 0.3, q)); }
  float ola = sin(q * 7.0 - t * 1.1 + n1 * 7.0) * 0.5 + 0.5;
  float esp = smoothstep(1.0, 0.08, q) * smoothstep(0.5, 0.92, ola * (0.55 + n2)); esp = max(esp, smoothstep(0.28, 0.03, q) * 0.85);
  esp = mix(esp, step(0.4, esp), uDura); c = mix(c, cEspuma, esp * uEspuma * mix(0.6, 1.0, uCerca));
  if (uTinta > 0.0) c = mix(c, vec3(0.2, 0.13, 0.09), mix(smoothstep(1.0, 0.15, abs(costaKm(p)) / max(0.25, uPx * 14.0)), smoothstep(2.4, 1.0, abs(ac) / max(fwidth(ac), 1e-5)) * step(abs(costaKm(p)), 0.35), uCerca) * 0.9 * uTinta * (1.0 - ext));   // la carta: la tinta de la orilla también por el lado del mar
  c *= sombraNube(p); vec2 e2 = vec2(1.0) / uMarco.zw;
  if (uCarta > 0.5 || p.y < uMarco.y + 4.0 || p.x > uMarco.x + e2.x - 4.0) c = fuera(c, p); else c = mix(cNiebla, c, bordeMar(p));
  gl_FragColor = vec4(c, ext > 0.5 ? 1.0 : smoothstep(1.0, -1.5, ac));
}`;

/* líneas tendidas sobre el relieve (ríos, caminos, cercos): una cinta que siempre mide al menos unos píxeles de ancho */
const VERT_LINEA = `
attribute vec3 lado; attribute float largo; uniform sampler2D tAlt; uniform vec4 uMarco; uniform float uKy, uPx, uAncho, uMinPx, uAlza; varying float vL, vS, vA;
void main(){ float w = max(uAncho * lado.z, uPx * uMinPx * (0.6 + 0.4 * lado.z)); vec2 p = position.xz + lado.xy * w * 0.5;
  float a = texture2D(tAlt, clamp((p - uMarco.xy) * uMarco.zw, 0.0003, 0.9997)).r; vA = a; vL = position.y; vS = largo / max(w, 1e-6);
  gl_Position = projectionMatrix * viewMatrix * vec4(p.x, max(a, 0.0) * uKy + uPx * uAlza, p.y, 1.0); }`;
const FRAG_LINEA = `
uniform vec3 uColor, uColor2; uniform float uOpacidad, uTrazo, uPx, uNubes, t; uniform sampler2D tRuido; varying float vL, vS, vA;
void main(){ if (vA < -1.0) discard; float e = abs(vL); float al = smoothstep(1.0, 0.55, e) * uOpacidad; if (uTrazo > 0.0 && fract(vS / uTrazo) > 0.6) discard;
  vec3 c = mix(uColor2, uColor, smoothstep(0.75, 0.45, e)); gl_FragColor = vec4(c, al); }`;

/* geometría de cinta a partir de polilíneas en (x, z). ancho relativo por línea (w) */
export function cintas(lineas) {
  const pos = [], lado = [], largo = [], idx = []; let n = 0;
  for (const L of lineas) { const P = L.p, w = L.w || 1; let s = 0; if (P.length < 2) continue;
    for (let i = 0; i < P.length; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
      if (i) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      pos.push(P[i][0], -1, P[i][1], P[i][0], 1, P[i][1]); lado.push(dz, -dx, w, -dz, dx, w); largo.push(s, s);
      if (i) idx.push(n + i * 2 - 2, n + i * 2 - 1, n + i * 2, n + i * 2 - 1, n + i * 2 + 1, n + i * 2); }
    n += P.length * 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('lado', new THREE.Float32BufferAttribute(lado, 3)); g.setAttribute('largo', new THREE.Float32BufferAttribute(largo, 1)); g.setIndex(idx); return g;
}
/* suaviza una polilínea (Chaikin) */
export function suave(P, veces) { for (let v = 0; v < (veces || 2); v++) { const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; Q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } Q.push(P[P.length - 1]); P = Q; } return P; }

export function materialLinea(com, o) {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -60, vertexShader: VERT_LINEA, fragmentShader: FRAG_LINEA,
    uniforms: Object.assign({ uAncho: { value: o.ancho || 0 }, uMinPx: { value: o.minPx || 2 }, uAlza: { value: o.alza || 1.5 }, uColor: { value: crudo(o.color) }, uColor2: { value: crudo(o.borde || o.color) }, uOpacidad: { value: o.opacidad === undefined ? 1 : o.opacidad }, uTrazo: { value: o.trazo || 0 } }, com) });
}

/* los dos estilos: colores del mar y del aire */
export const ESTILOS = {
  a: { n: 'Relieve natural', suelo: 'suelo-a.webp', masc: 'mascaras-a.webp', niebla: '#b4c3cd', nubes: 0.3, nubesAltas: 0.5,
    mar: { costa: '#4fb5b0', hondo: '#143f6b', brillo: '#fff2c8', espuma: '#ffffff', fuerzaBrillo: 0.3, fuerzaEspuma: 0.85, ondas: 1, rayas: 0, dura: 0, tinta: 0 },
    rio: { color: '#5fa2bd', borde: '#2c5a70', opacidad: 0.95 }, camino: { color: '#e6d2a2', borde: '#6a543a', opacidad: 0.9, trazo: 0 } },
  b: { n: 'Carta antigua viva', suelo: 'suelo-b.webp', masc: 'mascaras-b.webp', niebla: '#d9c9a0', nubes: 0.16, nubesAltas: 0,
    mar: { costa: '#a9c2b4', hondo: '#8fb0ae', brillo: '#fff8e0', espuma: '#f4ecd6', fuerzaBrillo: 0.05, fuerzaEspuma: 0.5, ondas: 0.3, rayas: 0.7, dura: 0, tinta: 1 },
    rio: { color: '#8fb4b8', borde: '#2f5666', opacidad: 0.95, minPx: 2.1, ancho: 0.0034 }, camino: { color: '#8a2c20', borde: '#8a2c20', opacidad: 0.95, trazo: 5, minPx: 2.5 } }
};

export class Suelo {
  constructor(escena, rel) {
    this.escena = escena; this.rel = rel; this.tex = {};
    this.com = { tAlt: { value: rel.tAlt }, tCosta: { value: rel.tCosta }, tRuido: { value: texturaRuido() }, tAzar: { value: texturaAzar() }, uMarco: { value: new THREE.Vector4(XI, ZN, 1 / ANCHO, 1 / FONDO) },
      t: { value: 0 }, uKy: { value: KY_LEJOS }, uPx: { value: 0.1 }, uCerca: { value: 0 }, uNubes: { value: 0.3 }, uRec: { value: 0 }, uCarta: { value: 0 }, cNiebla: { value: crudo('#b4c3cd') } };
    this.uSuelo = Object.assign({ tMacro: { value: null }, tMasc: { value: null }, uRejilla: { value: new THREE.Vector3() } }, this.com);
    this.mat = { a: new THREE.ShaderMaterial({ uniforms: this.uSuelo, vertexShader: VERT_SUELO, fragmentShader: FRAG_SUELO_A }), b: new THREE.ShaderMaterial({ uniforms: this.uSuelo, vertexShader: VERT_SUELO, fragmentShader: FRAG_SUELO_B }) };
    this.malla = new THREE.Mesh(new THREE.BufferGeometry(), this.mat.a); this.malla.frustumCulled = false; this.malla.renderOrder = 0; escena.add(this.malla); this.forma = '';
    this.uMar = Object.assign({ cA: { value: new THREE.Color() }, cB: { value: new THREE.Color() }, cEsp: { value: new THREE.Color() }, cEspuma: { value: new THREE.Color() }, uBrillo: { value: 0 }, uEspuma: { value: 0 }, uOndas: { value: 1 }, uDura: { value: 0 }, uRayas: { value: 0 }, uTinta: { value: 0 },
      uSol: { value: new THREE.Vector3(-0.45, 0.55, -0.7).normalize() } }, this.com);
    this.mar = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO * 3, FONDO * 3).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: this.uMar, vertexShader: VERT_MAR, fragmentShader: FRAG_MAR }));
    this.mar.position.set(0, 0, 0); this.mar.renderOrder = 1; this.mar.frustumCulled = false; escena.add(this.mar);
  }
  async estilo(k) {
    const E = ESTILOS[k]; if (!this.tex[k]) this.tex[k] = await Promise.all([cargarImagen(E.suelo), cargarImagen(E.masc)]);
    this.uSuelo.tMacro.value = this.tex[k][0]; this.uSuelo.tMasc.value = this.tex[k][1]; this.malla.material = this.mat[k];
    this.com.cNiebla.value = crudo(E.niebla); this.com.uCarta.value = k === 'b' ? 1 : 0; this.com.uNubes.value = E.nubes; const M = E.mar, u = this.uMar;
    u.cA.value = crudo(M.costa); u.cB.value = crudo(M.hondo); u.cEsp.value = crudo(M.brillo); u.cEspuma.value = crudo(M.espuma); u.uBrillo.value = M.fuerzaBrillo; u.uEspuma.value = M.fuerzaEspuma; u.uOndas.value = M.ondas; u.uRayas.value = M.rayas; u.uDura.value = M.dura; u.uTinta.value = M.tinta;
    return E;
  }
  /* rejilla que sigue a la cámara: nx × nz casillas; el lado de casilla va por escalones para que el relieve no «nade» al ampliar */
  rejilla(cx, cz, tx, tz, apaisado) {
    const nx = apaisado ? 270 : 180, nz = apaisado ? 170 : 256, k = nx + 'x' + nz;
    if (this.forma !== k) { this.forma = k; const pos = new Float32Array((nx + 1) * (nz + 1) * 3), idx = new Uint32Array(nx * nz * 6);
      for (let j = 0, q = 0; j <= nz; j++) for (let i = 0; i <= nx; i++, q++) { pos[q * 3] = i - nx / 2; pos[q * 3 + 2] = j - nz / 2; }
      for (let j = 0, q = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); this.malla.geometry.dispose(); this.malla.geometry = g; }
    const lado = Math.pow(2, Math.ceil(2 * Math.log2(Math.max(Math.min(tx, ANCHO + 10) / nx, Math.min(tz, FONDO + 10) / nz))) / 2);
    cx = clamp(cx, XI + lado * nx / 2 - 6, XI + ANCHO - lado * nx / 2 + 6); cz = clamp(cz, ZN + lado * nz / 2 - 6, ZN + FONDO - lado * nz / 2 + 6);
    if (lado * nx >= ANCHO + 10) cx = XI + ANCHO / 2; if (lado * nz >= FONDO + 10) cz = ZN + FONDO / 2;
    this.uSuelo.uRejilla.value.set(Math.round(cx / lado) * lado, Math.round(cz / lado) * lado, lado); return lado;
  }
}
