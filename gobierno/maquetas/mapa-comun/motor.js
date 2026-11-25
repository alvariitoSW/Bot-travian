/* AQVILA · AM1 — motor común de las maquetas del mapa vivo de Grecia.
   Cada maqueta (mapa-a-natural, mapa-b-carta, mapa-c-tablero) le pasa su «estilo»: cómo se pinta el suelo, el mar y las ciudades.
   Relieve real (grecia-alturas.png); el color del suelo se hornea una vez en una textura (barato para el móvil);
   lo vivo (mar, sombras de nube, humo, barcos, rebaños) se mueve en cada fotograma.
   Arte: modelos de 0 A.D. (Wildfire Games, CC BY-SA 3.0) por js/gfx/statics.js; lo demás, propio y hecho aquí. */
import { THREE } from '../../../js/gfx/models.js';
import { preloadStatic, staticMesh } from '../../../js/gfx/statics.js';
import { MARCO, POLIS, ZONAS, BASICOS, LUJOS, CAMINOS, COPAIS, VISTAS, comarca } from './datos.js';
import RUTAS from './rutas.js';
import AGUA from '../../../assets/mapa/agua.js';
import { ICONOS } from './iconos.js';
export { THREE };

/* ---------- utilidades ---------- */
export const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
export const mix = (a, b, t) => a + (b - a) * t;
export const paso = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function azar(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const h2 = (x, y) => { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
export const hash = h2;
export function ruido(x, y) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return mix(mix(h2(xi, yi), h2(xi + 1, yi), u), mix(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v); }
export function fbm(x, y, o) { let s = 0, a = 0.5, t = 0; for (let i = 0; i < (o || 4); i++) { s += a * ruido(x, y); t += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; a *= 0.5; } return s / t; }
export const X = lon => (lon - MARCO.lon0) * MARCO.kx, Z = lat => -(lat - MARCO.lat0) * MARCO.kz;
const ANCHO = (MARCO.x1 - MARCO.x0) * MARCO.kx, FONDO = (MARCO.y1 - MARCO.y0) * MARCO.kz, XI = X(MARCO.x0), ZN = Z(MARCO.y1);

/* ---------- relieve ---------- */
async function cargarAlturas() {
  const img = new Image(); img.src = new URL('./grecia-alturas.png', import.meta.url).href; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, n = c.width * c.height, alt = new Float32Array(n);
  for (let i = 0; i < n; i++) alt[i] = (d[i * 4] * 256 + d[i * 4 + 1]) / 6 - 5000;
  return alt;
}
function muestreador(a, nx, nz) { return (fx, fz) => { fx = clamp(fx, 0, nx - 1.001); fz = clamp(fz, 0, nz - 1.001); const i = fx | 0, j = fz | 0, u = fx - i, v = fz - j, k = j * nx + i;
  return mix(mix(a[k], a[k + 1], u), mix(a[k + nx], a[k + nx + 1], u), v); }; }
/* distancia a la costa con signo (casillas de ~1,1 km; tierra +, mar −), dos pasadas */
function distanciaCosta(alt, nx, nz) {
  const d = new Float32Array(nx * nz), G = 1e4;
  for (let s = 0; s < 2; s++) {
    const f = new Float32Array(nx * nz); for (let i = 0; i < nx * nz; i++) f[i] = ((alt[i] > 0) === (s === 0)) ? G : 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; let v = f[k]; if (i > 0) v = Math.min(v, f[k - 1] + 1); if (j > 0) { v = Math.min(v, f[k - nx] + 1); if (i > 0) v = Math.min(v, f[k - nx - 1] + 1.41); if (i < nx - 1) v = Math.min(v, f[k - nx + 1] + 1.41); } f[k] = v; }
    for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) { const k = j * nx + i; let v = f[k]; if (i < nx - 1) v = Math.min(v, f[k + 1] + 1); if (j < nz - 1) { v = Math.min(v, f[k + nx] + 1); if (i < nx - 1) v = Math.min(v, f[k + nx + 1] + 1.41); if (i > 0) v = Math.min(v, f[k + nx - 1] + 1.41); } f[k] = v; }
    for (let i = 0; i < nx * nz; i++) d[i] += s === 0 ? Math.min(f[i], 60) : -Math.min(f[i], 60);
  }
  return d;
}

/* ---------- horneado del suelo: una textura con el color de cada punto ---------- */
function hornear(est, T) {
  const W = est.lienzo || 1440, H = Math.round(W * 8 / 9), K = 1440 / W, nx = MARCO.nx, nz = MARCO.nz, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), im = g.createImageData(W, H), o = im.data, A = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) A[y * W + x] = T.alt((x + 0.5) / W * nx - 0.5, (y + 0.5) / H * nz - 0.5);
  const B = new Float32Array(W * H);   // suavizado 3x3 y detalle fino en tierra
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const xa = x > 0 ? x - 1 : x, xb = x < W - 1 ? x + 1 : x, ya = y > 0 ? y - 1 : y, yb = y < H - 1 ? y + 1 : y;
    let v = (A[y * W + x] * 4 + (A[y * W + xa] + A[y * W + xb] + A[ya * W + x] + A[yb * W + x]) * 2 + A[ya * W + xa] + A[ya * W + xb] + A[yb * W + xa] + A[yb * W + xb]) / 16;
    if (v > 2) v += (fbm(x * K * 0.045, y * K * 0.045, 4) - 0.5) * Math.min(90, 6 + v * 0.07) * (est.detalleRelieve === undefined ? 1 : est.detalleRelieve);
    B[y * W + x] = v; }
  const L = est.luz || [-0.55, 0.62, -0.55], ln = Math.hypot(L[0], L[1], L[2]), S = (est.fuerzaSombra || 3.2) / (550 * K), zw = { grano: 0, madera: 0, piedra: 0, hierro: 0 }, px = [0, 0, 0];
  const dlon = (MARCO.x1 - MARCO.x0) / W, dlat = (MARCO.y1 - MARCO.y0) / H, p = { h: 0, pend: 0, luz: 0, costa: 0, zw, x: 0, y: 0, lago: false, lon: 0, lat: 0 };
  for (let y = 0; y < H; y++) { const lat = MARCO.y1 - (y + 0.5) * dlat;
    for (let x = 0; x < W; x++) { const k = y * W + x, lon = MARCO.x0 + (x + 0.5) * dlon;
      const gx = (B[y * W + Math.min(W - 1, x + 1)] - B[y * W + Math.max(0, x - 1)]) * 0.5, gz = (B[Math.min(H - 1, y + 1) * W + x] - B[Math.max(0, y - 1) * W + x]) * 0.5;
      const ax = -gx * S, az = -gz * S, n = Math.hypot(ax, 1, az);
      p.h = B[k]; p.pend = Math.hypot(gx, gz) / (550 * K); p.luz = Math.max(0, (ax * L[0] + L[1] + az * L[2]) / (n * ln)); p.costa = T.dist((x + 0.5) / W * nx - 0.5, (y + 0.5) / H * nz - 0.5); p.x = x * K; p.y = y * K; p.lon = lon; p.lat = lat;
      zw.grano = zw.madera = zw.piedra = zw.hierro = 0;
      for (let i = 0; i < ZONAS.length; i++) { const z = ZONAS[i], dx = (lon - z.lon) * 87.7; if (dx > z.r || dx < -z.r) continue; const dz = (lat - z.lat) * 111.3, q = Math.hypot(dx, dz) / z.r; if (q < 1) { const w = 1 - paso(0.55, 1, q); if (w > zw[z.t]) zw[z.t] = w; } }
      const cx = (lon - COPAIS.lon) * 87.7 / COPAIS.rx, cz = (lat - COPAIS.lat) * 111.3 / COPAIS.rz; p.lago = cx * cx + cz * cz < 0.8 + 0.4 * ruido(x * K * 0.08, y * K * 0.08) && p.h < 130 && p.h > 0;
      est.pintar(px, p); o[k * 4] = px[0]; o[k * 4 + 1] = px[1]; o[k * 4 + 2] = px[2]; o[k * 4 + 3] = 255; } }
  g.putImageData(im, 0, 0);
  g.scale(1 / K, 1 / K);
  const ay = { W: 1440, H: 1280, px: (lon, lat) => [(lon - MARCO.x0) / (MARCO.x1 - MARCO.x0) * 1440, (MARCO.y1 - lat) / (MARCO.y1 - MARCO.y0) * 1280], alt: (lon, lat) => T.altLL(lon, lat),
    linea(l) { g.beginPath(); l.forEach((q, i) => { const a = ay.px(q[0], q[1]); i ? g.lineTo(a[0], a[1]) : g.moveTo(a[0], a[1]); }); g.stroke(); },
    rios: AGUA.rios.filter(r => r.l.some(l => l.some(q => q[0] > MARCO.x0 && q[0] < MARCO.x1 && q[1] > MARCO.y0 && q[1] < MARCO.y1))), caminos: CAMINOS, zonas: ZONAS, polis: POLIS };
  if (est.dibujar) est.dibujar(g, ay);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}

/* textura de ruido que se repite: R y G ondas, B nubes anchas */
function texturaRuido() {
  const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), im = g.createImageData(N, N);
  const per = (x, y, f, s) => { const P = f, xi = Math.floor(x * f / N), yi = Math.floor(y * f / N), fx = x * f / N - xi, fy = y * f / N - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), q = (a, b) => h2((a % P) + s * 131, (b % P) + s * 71);
    return mix(mix(q(xi, yi), q(xi + 1, yi), u), mix(q(xi, yi + 1), q(xi + 1, yi + 1), u), v); };
  const f = (x, y, f0, s) => (per(x, y, f0, s) * 0.5 + per(x, y, f0 * 2, s + 1) * 0.28 + per(x, y, f0 * 4, s + 2) * 0.15 + per(x, y, f0 * 8, s + 3) * 0.07);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = (y * N + x) * 4; im.data[k] = f(x, y, 8, 1) * 255; im.data[k + 1] = f(x, y, 16, 9) * 255; im.data[k + 2] = f(x, y, 4, 20) * 255; im.data[k + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function texturaMancha(color, borde) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  r.addColorStop(0, color); r.addColorStop(borde || 0.5, color.replace(/[\d.]+\)$/, '0.45)')); r.addColorStop(1, color.replace(/[\d.]+\)$/, '0)')); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

const COMUN_GLSL = `
uniform sampler2D tRuido; uniform float t; uniform vec3 cNiebla; uniform float uNubes; uniform vec4 uMarco;
float sombraNube(vec2 p){ float n = texture2D(tRuido, p*0.011 + vec2(t*0.0042, t*0.0017)).b; float m = texture2D(tRuido, p*0.031 - vec2(t*0.003, -t*0.002)).b; return 1.0 - uNubes*smoothstep(0.50,0.66,n*0.7+m*0.3); }
float borde(vec2 p){ vec2 q = min(p - uMarco.xy, uMarco.zw - p); return smoothstep(-0.5, 3.5, min(q.x, q.y)); }
float bordeMar(vec2 p){ return smoothstep(-0.5, 3.5, min(p.y - uMarco.y, uMarco.z - p.x)) * smoothstep(-34.0, -12.0, p.x - uMarco.x) * smoothstep(-40.0, -14.0, uMarco.w - p.y); }`;

/* ---------- la maqueta ---------- */
export async function crear(est) {
  const t0 = performance.now(), Q = new URLSearchParams(location.search);
  const lienzo = document.getElementById('lienzo'), capa = document.getElementById('etiquetas');
  const R = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
  R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R.setClearColor(est.niebla);
  const escena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(42, 1, 0.5, 600);
  escena.add(new THREE.HemisphereLight('#fff6e4', '#6b6a55', 1.5)); const sol = new THREE.DirectionalLight('#fff1d6', 2.2); sol.position.set(-40, 60, 30); escena.add(sol);

  const alt = await cargarAlturas(), nx = MARCO.nx, nz = MARCO.nz, mAlt = muestreador(alt, nx, nz), dist = distanciaCosta(alt, nx, nz), mDist = muestreador(dist, nx, nz);
  const altLL = (lon, lat) => mAlt((lon - MARCO.x0) / (MARCO.x1 - MARCO.x0) * nx - 0.5, (MARCO.y1 - lat) / (MARCO.y1 - MARCO.y0) * nz - 0.5);
  const ky = est.relieve / 10000, yLL = (lon, lat) => Math.max(0, altLL(lon, lat)) * ky + 0.02;
  const tRuido = texturaRuido(), tMapa = hornear(est, { alt: mAlt, dist: mDist, altLL });
  const uT = { value: 0 }, com = { tRuido: { value: tRuido }, t: uT, cNiebla: { value: new THREE.Color(est.niebla) }, uNubes: { value: est.nubes === undefined ? 0.3 : est.nubes }, uMarco: { value: new THREE.Vector4(XI, ZN, XI + ANCHO, ZN + FONDO) } };
  const crudo = c => { const k = new THREE.Color(); k.setRGB(parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255, THREE.LinearSRGBColorSpace); return k; };
  com.cNiebla.value = crudo(est.niebla);

  /* suelo */
  const GX = est.malla || 400, GZ = Math.round(GX * FONDO / ANCHO), pos = new Float32Array((GX + 1) * (GZ + 1) * 3), uv = new Float32Array((GX + 1) * (GZ + 1) * 2), idx = new Uint32Array(GX * GZ * 6);
  for (let j = 0, k = 0; j <= GZ; j++) for (let i = 0; i <= GX; i++, k++) { const a = mAlt(i / GX * nx - 0.5, j / GZ * nz - 0.5);
    pos[k * 3] = XI + i / GX * ANCHO; pos[k * 3 + 1] = a > 0 ? a * ky : Math.max(a, -500) * ky * 0.5; pos[k * 3 + 2] = ZN + j / GZ * FONDO; uv[k * 2] = i / GX; uv[k * 2 + 1] = 1 - j / GZ; }
  for (let j = 0, q = 0; j < GZ; j++) for (let i = 0; i < GX; i++) { const a = j * (GX + 1) + i, b = a + 1, c = a + GX + 1, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  const gs = new THREE.BufferGeometry(); gs.setAttribute('position', new THREE.BufferAttribute(pos, 3)); gs.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); gs.setIndex(new THREE.BufferAttribute(idx, 1));
  const suelo = new THREE.Mesh(gs, new THREE.ShaderMaterial({ uniforms: Object.assign({ tMapa: { value: tMapa }, uDet: { value: est.detalle === undefined ? 0.16 : est.detalle }, uFacetas: { value: est.facetas || 0 } }, com),
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vW = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D tMapa; uniform float uDet, uFacetas; varying vec2 vUv; varying vec3 vW;' + COMUN_GLSL + `
      void main(){ vec3 c = texture2D(tMapa, vUv).rgb; float d = texture2D(tRuido, vW.xz*1.9).r*0.6 + texture2D(tRuido, vW.xz*6.3).g*0.4;
        c *= 1.0 + uDet*(d-0.5)*2.0;
        if (uFacetas > 0.0) { vec3 n = normalize(cross(dFdx(vW), dFdy(vW))); c *= max(0.6, 1.0 + uFacetas*(dot(n, normalize(vec3(-0.5,0.6,-0.5))) - 0.62)); }
        c *= sombraNube(vW.xz); c = mix(cNiebla, c, borde(vW.xz));
        gl_FragColor = vec4(c, 1.0); }` }));
  suelo.frustumCulled = false; escena.add(suelo);

  /* mar: un plano; la costa sale de la textura de distancias, no de la malla */
  const dd = new Uint8Array(nx * nz * 4);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i, q = ((nz - 1 - j) * nx + i) * 4, a = alt[k];
    dd[q] = clamp(-dist[k] / 16, 0, 1) * 255; dd[q + 1] = Math.sqrt(clamp(-a / 3000, 0, 1)) * 255; dd[q + 2] = clamp(0.5 + a / 30, 0, 1) * 255; dd[q + 3] = 255; }
  const tDist = new THREE.DataTexture(dd, nx, nz, THREE.RGBAFormat); tDist.magFilter = tDist.minFilter = THREE.LinearFilter; tDist.needsUpdate = true;
  const M = est.mar, mar = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO * 3, FONDO * 3).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    uniforms: Object.assign({ tDist: { value: tDist }, cA: { value: crudo(M.costa) }, cB: { value: crudo(M.hondo) }, cEsp: { value: crudo(M.brillo || '#fff4d0') }, cEspuma: { value: crudo(M.espuma || '#ffffff') },
      uBrillo: { value: M.fuerzaBrillo === undefined ? 0.5 : M.fuerzaBrillo }, uEspuma: { value: M.fuerzaEspuma === undefined ? 0.8 : M.fuerzaEspuma }, uAlfa: { value: M.alfaCosta === undefined ? 0.55 : M.alfaCosta }, uOndas: { value: M.ondas === undefined ? 1 : M.ondas },
      uDura: { value: M.espumaDura || 0 }, uRayas: { value: M.rayas || 0 }, uSol: { value: new THREE.Vector3(-0.45, 0.55, -0.7).normalize() } }, com),
    vertexShader: 'varying vec3 vW; void main(){ vW = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D tDist; uniform vec3 cA, cB, cEsp, cEspuma, uSol; uniform float uBrillo, uEspuma, uAlfa, uOndas, uDura, uRayas; varying vec3 vW;' + COMUN_GLSL + `
      void main(){ vec2 p = vW.xz, u = vec2((p.x-uMarco.x)/(uMarco.z-uMarco.x), 1.0-(p.y-uMarco.y)/(uMarco.w-uMarco.y));
        vec4 d = texture2D(tDist, clamp(u, 0.001, 0.999)); float fuera = step(u.x,0.0)+step(1.0,u.x)+step(u.y,0.0)+step(1.0,u.y);
        if (step(1.0,u.x)+step(1.0,u.y) > 0.5) { gl_FragColor = vec4(cNiebla, 1.0); return; }
        if (fuera > 0.5) d = vec4(1.0, 0.75, 0.0, 1.0);
        float dc = d.r*16.0, prof = d.g, tierra = d.b;
        float n1 = texture2D(tRuido, p*0.09 + vec2(t*0.010, t*0.006)).r, n2 = texture2D(tRuido, p*0.23 - vec2(t*0.015, -t*0.010)).g, n3 = texture2D(tRuido, p*0.8 + vec2(t*0.028, t*0.019)).r;
        float w = n1*0.5 + n2*0.33 + n3*0.17;
        vec3 c = mix(cA, cB, smoothstep(0.02, 0.32, prof + (w-0.5)*0.07));
        c *= 1.0 + uOndas*(w-0.5)*0.55;
        vec3 V = normalize(cameraPosition - vW), N = normalize(vec3((n2-0.5)*0.5+(n1-0.5)*0.3, 1.0, (n1-0.5)*0.5+(n2-0.5)*0.3)), Hh = normalize(V + uSol);
        c += cEsp * pow(max(dot(N, Hh), 0.0), 70.0) * uBrillo * (0.4+n3);
        if (uRayas > 0.0) { float r = sin(dc*4.2 - t*0.5); c = mix(c, cEspuma, uRayas*smoothstep(0.86, 0.97, r)*smoothstep(7.0, 0.5, dc)); }
        float ola = sin(dc*5.0 - t*1.1 + n1*7.0)*0.5 + 0.5;
        float esp = smoothstep(1.5, 0.1, dc) * smoothstep(0.5, 0.92, ola*(0.55+n2)); esp = max(esp, smoothstep(0.42, 0.05, dc)*0.85);
        esp = mix(esp, step(0.4, esp), uDura);
        c = mix(c, cEspuma, esp*uEspuma);
        c *= sombraNube(p); float b = bordeMar(p); c = mix(cNiebla, c, b);
        float a = mix(uAlfa, 1.0, smoothstep(0.0, 2.2, dc)) * smoothstep(0.62, 0.42, tierra);
        gl_FragColor = vec4(c, mix(1.0, a, b)); }` }));
  mar.position.set(0, 0.012, 0); mar.renderOrder = 1; escena.add(mar);

  /* ---------- lo que hay sobre el mapa ---------- */
  const vivos = [], escalables = [], rnd = azar(7), usaModelos = est.ciudades !== 'dibujo';
  if (usaModelos) await preloadStatic(['grie_templo', 'grie_casa', 'grie_casa_b', 'grie_casa_c', 'grie_casa_d', 'grie_casa_e', 'grie_trirreme', 'barco', 'olivo', 'cipres']);
  const tHumo = texturaMancha(est.humo || 'rgba(235,228,214,1)'), tEstela = texturaMancha('rgba(255,255,255,1)', 0.3);
  const humo = (grupo, x, y, z, n, tam) => { for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tHumo, transparent: true, depthWrite: false, opacity: 0 })); s.renderOrder = 4; grupo.add(s);
    const f = i / n, vx = 0.5 + rnd() * 0.3; vivos.push(t => { const q = (t * 0.11 + f) % 1; s.position.set(x + q * q * 26 * vx * tam, y + q * 34 * tam, z + Math.sin(f * 9) * 2 * tam); const e = (5 + q * 15) * tam; s.scale.set(e, e, 1); s.material.opacity = (est.humoOpacidad || 0.8) * Math.sin(Math.PI * Math.min(1, q * 1.15)) * (1 - q * 0.5); }); } };

  const E = 0.019;   // escala de los modelos de 0 A.D. sobre el mapa
  for (const p of POLIS) {
    const g = new THREE.Group(), x = X(p.lon), z = Z(p.lat), y = yLL(p.lon, p.lat); g.position.set(x, y, z); p._pos = new THREE.Vector3(x, y, z);
    if (usaModelos) {
      const m = new THREE.Group(); m.scale.setScalar(E); g.add(m);
      if (est.peana) { const b = new THREE.Mesh(new THREE.CylinderGeometry(46, 50, 5, 28), new THREE.MeshLambertMaterial({ color: p.color })); b.position.y = 0.5; m.add(b); const b2 = new THREE.Mesh(new THREE.CylinderGeometry(42, 42, 5.6, 28), new THREE.MeshLambertMaterial({ color: '#d9c9a0' })); b2.position.y = 0.6; m.add(b2); }
      else { const b = new THREE.Mesh(new THREE.CircleGeometry(44, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: texturaMancha('rgba(196,170,120,1)', 0.7), transparent: true, depthWrite: false, opacity: 0.75 })); b.position.y = 0.6; m.add(b); }
      const roca = new THREE.Mesh(new THREE.CylinderGeometry(15, 21, 7, 9), new THREE.MeshLambertMaterial({ color: '#a89d86' })); roca.position.y = 4; m.add(roca);
      const tp = staticMesh('grie_templo', p.color); if (tp) { tp.position.y = 9.5; tp.rotation.y = 0.5; tp.scale.setScalar(0.9); m.add(tp); }
      const nc = p.pri === 1 ? 11 : 8, casas = ['grie_casa', 'grie_casa_b', 'grie_casa_c', 'grie_casa_d', 'grie_casa_e'];
      for (let i = 0; i < nc; i++) { const a = i / nc * Math.PI * 2 + rnd() * 0.4, r = 25 + (i % 2) * 12 + rnd() * 4, c = staticMesh(casas[i % 5], p.color); if (!c) continue; c.position.set(Math.cos(a) * r, 4.2, Math.sin(a) * r); c.rotation.y = -a + Math.PI / 2 + (rnd() - 0.5) * 0.6; c.scale.setScalar(0.82); m.add(c); }
      for (let i = 0; i < 7; i++) { const a = rnd() * 6.28, r = 40 + rnd() * 8, c = staticMesh(i % 3 ? 'olivo' : 'cipres'); if (!c) continue; c.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r); c.scale.setScalar(i % 3 ? 0.8 : 1.3); c.rotation.y = rnd() * 6; m.add(c); }
      humo(m, 8, 16, -6, 5, 1); humo(m, -22, 10, 14, 3, 0.7);
    } else if (est.iconoCiudad) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(est.iconoCiudad(p)), transparent: true, depthWrite: false })); s.center.set(0.5, 0.08); s.scale.set(1.7, 1.7, 1); s.renderOrder = 3; g.add(s);
      const m = new THREE.Group(); m.scale.setScalar(E); g.add(m); humo(m, 6, 40, 0, 4, 0.8);
    }
    escena.add(g); escalables.push({ o: g, k: 1 });
  }
  /* barcos por las rutas del mar */
  const barcos = [];
  RUTAS.forEach((r, ri) => { const pts = r.l.map(q => new THREE.Vector3(X(q[0]), 0.03, Z(q[1]))), lon = [0]; for (let i = 1; i < pts.length; i++) lon.push(lon[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const total = lon[lon.length - 1], cuantos = total > 30 ? 2 : 1;
    for (let b = 0; b < cuantos; b++) { const g = new THREE.Group(); let casco;
      if (usaModelos) { casco = staticMesh(ri % 3 === 0 ? 'grie_trirreme' : 'barco', POLIS[ri % POLIS.length].color); if (casco) { casco.scale.setScalar(E * 0.95); g.add(casco); } }
      else if (est.iconoBarco) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(est.iconoBarco(ri)), transparent: true, depthWrite: false })); s.center.set(0.5, 0.3); s.scale.set(0.9, 0.9, 1); s.renderOrder = 3; g.add(s); }
      const est2 = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 1.5).rotateX(-Math.PI / 2).translate(0, 0.005, -0.9), new THREE.MeshBasicMaterial({ map: tEstela, transparent: true, opacity: est.estela === undefined ? 0.5 : est.estela, depthWrite: false })); est2.renderOrder = 2; g.add(est2);
      escena.add(g); escalables.push({ o: g, k: 0.8 }); const f0 = (b / cuantos + ri * 0.137) % 1, sentido = b % 2 ? -1 : 1; barcos.push(g);
      vivos.push(t => { let f = (f0 + sentido * t * 0.9 / total / 60 * (est.prisa || 6)) % 1; if (f < 0) f += 1; const s = f * total; let i = 1; while (i < lon.length - 1 && lon[i] < s) i++;
        const u = (s - lon[i - 1]) / (lon[i] - lon[i - 1] || 1), a = pts[i - 1], c = pts[i]; g.position.lerpVectors(a, c, u); g.position.y = 0.03 + Math.sin(t * 1.7 + ri) * 0.006;
        g.rotation.y = Math.atan2((c.x - a.x) * sentido, (c.z - a.z) * sentido); g.rotation.z = Math.sin(t * 1.3 + ri * 2) * 0.05; }); } });
  /* bosques: conos propios (5 triángulos cada uno) donde el relieve y las zonas de madera lo piden */
  let nArboles = 0;
  if (est.arboles) {
    const A = est.arboles, geo = new THREE.ConeGeometry(A.radio, A.alto, 5, 1, true).translate(0, A.alto / 2, 0), mat = new THREE.MeshLambertMaterial({ color: '#ffffff' }), im = new THREE.InstancedMesh(geo, mat, A.cuantos), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), col = new THREE.Color();
    for (let k = 0; k < A.cuantos * 14 && nArboles < A.cuantos; k++) { const lon = MARCO.x0 + rnd() * (MARCO.x1 - MARCO.x0), lat = MARCO.y0 + rnd() * (MARCO.y1 - MARCO.y0), h = altLL(lon, lat); if (h < 20) continue;
      let w = paso(250, 600, h) * (1 - paso(1500, 1900, h)) * paso(0.42, 0.6, fbm(lon * 9, lat * 9, 3)); for (const z of ZONAS) if (z.t === 'madera') { const d = Math.hypot((lon - z.lon) * 87.7, (lat - z.lat) * 111.3) / z.r; if (d < 1) w = Math.max(w, (1 - d * d) * paso(60, 200, h) * (1 - paso(1700, 2000, h))); }
      if (rnd() > w) continue; const e = 0.7 + rnd() * 0.6; s.set(e, e * (0.8 + rnd() * 0.5), e); v.set(X(lon), h * ky - 0.01, Z(lat)); m4.compose(v, q, s); im.setMatrixAt(nArboles, m4);
      col.set(A.colores[(rnd() * A.colores.length) | 0]); im.setColorAt(nArboles, col); nArboles++; }
    im.count = nArboles; im.frustumCulled = false; escena.add(im);
  }
  /* rebaños: ovejas blancas que pacen despacio */
  if (est.rebanos) {
    const pastos = [[22.25, 37.55], [22.5, 39.45], [23.2, 38.38], [23.85, 38.0], [22.5, 37.15], [27.45, 37.6], [23.3, 38.05], [22.65, 37.68], [21.5, 37.8], [23.5, 38.5]], n = 12, geo = new THREE.SphereGeometry(1, 5, 4).scale(1.5, 1, 1), im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#f4f0e6' }), pastos.length * n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), eje = new THREE.Vector3(0, 1, 0);
    im.frustumCulled = false; escena.add(im); const sem = []; for (let i = 0; i < pastos.length * n; i++) sem.push([rnd() * 6.28, 0.25 + rnd() * 0.5, rnd() * 6.28]);
    vivos.push((t, esc) => { const e = 0.03 * Math.min(esc, 1.6); for (let i = 0; i < pastos.length; i++) { const P = pastos[i], cx = X(P[0]) + Math.sin(t * 0.02 + i) * 0.4, cz = Z(P[1]) + Math.cos(t * 0.017 + i * 2) * 0.4;
      for (let j = 0; j < n; j++) { const S = sem[i * n + j], a = S[0] + Math.sin(t * 0.05 + S[2]) * 0.8, r = S[1] * esc * 0.55, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r, lon = x / MARCO.kx + MARCO.lon0, lat = -z / MARCO.kz + MARCO.lat0;
        v.set(x, Math.max(0, altLL(lon, lat)) * ky + e * 0.8, z); q.setFromAxisAngle(eje, -a + Math.cos(t * 0.05 + S[2])); s.setScalar(e); m4.compose(v, q, s); im.setMatrixAt(i * n + j, m4); } } im.instanceMatrix.needsUpdate = true; });
  }
  /* nubes altas: manchas blandas que pasan (se apagan al acercarse) */
  const nubes = [];
  if (est.nubesAltas) { const tN = texturaMancha('rgba(255,255,255,1)', 0.35); for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tN, transparent: true, depthWrite: false, opacity: 0 }));
    const sx = 9 + rnd() * 12, x0 = rnd(), z0 = (rnd() - 0.5) * FONDO, y = 5.5 + rnd() * 2; m.scale.set(sx, 1, sx * (0.45 + rnd() * 0.3)); m.renderOrder = 5; escena.add(m); nubes.push(m);
    vivos.push((t, esc, ancho) => { const f = (x0 + t * 0.0035) % 1; m.position.set(XI - 10 + f * (ANCHO + 20), y, z0); m.material.opacity = est.nubesAltas * paso(16, 46, ancho) * Math.sin(Math.PI * f); }); } }
  if (est.extra) est.extra({ THREE, escena, vivos, escalables, X, Z, yLL, altLL, ky, rnd, humo, E });

  /* ---------- etiquetas y fichas (HTML: nítidas a 390 px) ---------- */
  const etq = [];
  const pon = (html, clase, v, pri, alza) => { const d = document.createElement('div'); d.className = 'etq ' + clase; d.innerHTML = html; capa.appendChild(d); const e = { d, v, pri, alza: alza || 0, w: 0, h: 0 }; etq.push(e); return e; };
  for (const p of POLIS) { const e = pon('<b style="--c:' + p.color + '"></b><span>' + p.n + '</span><i class="lujo" style="--c:' + LUJOS[p.lujo].color + '">' + ICONOS[p.lujo] + '</i>', 'polis pri' + p.pri, p._pos, p.pri, est.alzaEtiqueta || 1.25); e.polis = p; e.ancla = p.et || 'arriba'; e.d.dataset.polis = p.id; e.d.addEventListener('click', () => ficha(p)); }
  for (const z of ZONAS) { const e = pon('<i style="--c:' + BASICOS[z.t].color + '">' + ICONOS[z.t] + '</i><span>' + z.n + '</span>', 'zona z-' + z.t, new THREE.Vector3(X(z.lon), yLL(z.lon, z.lat) + 0.15, Z(z.lat)), 4, 0); e.zona = z; }
  etq.sort((a, b) => a.pri - b.pri); const hoja = document.getElementById('ficha');
  function ficha(p) { if (!p) { hoja.hidden = true; return; } const c = comarca(p), ic = k => '<span class="rec"><i style="--c:' + (BASICOS[k] || LUJOS[k]).color + '">' + ICONOS[k] + '</i>' + (BASICOS[k] || LUJOS[k]).n + '</span>';
    const quien = k => { const o = POLIS.filter(q => q !== p && comarca(q).tiene[k]).map(q => q.n); return o.length ? o.slice(0, 2).join(' o ') : 'las comarcas libres'; };
    hoja.innerHTML = '<button class="cerrar" aria-label="Cerrar">×</button><h2><b style="background:' + p.color + '"></b>' + p.n + '</h2>' +
      '<p><em>En su comarca:</em> ' + (Object.keys(c.tiene).map(ic).join(' ') || 'poca cosa') + '</p>' +
      '<p><em>De lujo, solo aquí:</em> ' + ic(p.lujo) + '<small> (' + p.lujoDe + ')</small></p>' +
      (c.faltan.length ? '<p class="falta"><em>Le falta:</em> ' + c.faltan.map(ic).join(' ') + '<small> Por comercio o conquista: ' + quien(c.faltan[0]) + '.</small></p>' : '');
    hoja.hidden = false; hoja.querySelector('.cerrar').addEventListener('click', () => ficha(null)); }

  /* ---------- cámara y dedos ---------- */
  const V = { x: 0, z: 0, ancho: 30 }, apaisado = () => innerWidth > innerHeight;
  function vista(n) { const v = VISTAS[n] || VISTAS.corazon; V.x = X(v.lon); V.z = Z(v.lat); V.ancho = v.d * (apaisado() ? 1.75 : 1); }
  function colocar() { const w = lienzo.clientWidth, h = lienzo.clientHeight; if (lienzo.width !== Math.round(w * R.getPixelRatio()) || lienzo.height !== Math.round(h * R.getPixelRatio())) R.setSize(w, h, false);
    cam.aspect = w / h; cam.fov = apaisado() ? 34 : 44; cam.updateProjectionMatrix();
    V.ancho = clamp(V.ancho, 5, apaisado() ? 150 : 84); V.x = clamp(V.x, XI + 4, XI + ANCHO - 4); V.z = clamp(V.z, ZN + 8, ZN + FONDO - 2);
    const hf = 2 * Math.atan(Math.tan(cam.fov * Math.PI / 360) * cam.aspect), d = V.ancho / 2 / Math.tan(hf / 2), el = mix(est.inclinaCerca || 0.84, est.inclinaLejos || 1.06, paso(8, 80, V.ancho));
    cam.position.set(V.x, d * Math.sin(el), V.z + d * Math.cos(el)); cam.lookAt(V.x, 0, V.z - (apaisado() ? 0 : V.ancho * 0.08)); cam.far = d * 6 + 200; cam.updateProjectionMatrix(); return w / V.ancho; }
  const dedos = new Map(); let pell = 0;
  lienzo.addEventListener('pointerdown', e => { dedos.set(e.pointerId, [e.clientX, e.clientY]); lienzo.setPointerCapture(e.pointerId); pell = 0; });
  lienzo.addEventListener('pointermove', e => { const a = dedos.get(e.pointerId); if (!a) return; const k = V.ancho / lienzo.clientWidth;
    if (dedos.size === 1) { V.x -= (e.clientX - a[0]) * k; V.z -= (e.clientY - a[1]) * k * 1.25; }
    dedos.set(e.pointerId, [e.clientX, e.clientY]);
    if (dedos.size === 2) { const q = [...dedos.values()], d = Math.hypot(q[0][0] - q[1][0], q[0][1] - q[1][1]); if (pell) V.ancho *= pell / d; pell = d; } });
  const suelta = e => { dedos.delete(e.pointerId); pell = 0; }; lienzo.addEventListener('pointerup', suelta); lienzo.addEventListener('pointercancel', suelta);
  lienzo.addEventListener('wheel', e => { V.ancho *= e.deltaY > 0 ? 1.12 : 0.89; e.preventDefault(); }, { passive: false });

  /* ---------- bucle ---------- */
  const v3 = new THREE.Vector3(); let recursos = Q.get('rec') === '1', cuadros = 0, msSuma = 0, tFijo = Q.has('t') ? +Q.get('t') : null;
  document.body.classList.toggle('con-recursos', recursos);
  function cuadro(ms) { const a = performance.now(), t = tFijo !== null ? tFijo + ms / 1000 : ms / 1000; uT.value = t;
    const ppu = colocar(), esc = clamp((est.tamCiudad || 30) / (1.9 * ppu), 1, est.escalaMax || 2.3);
    for (const e of escalables) e.o.scale.setScalar(esc * e.k);
    for (const f of vivos) f(t, esc, V.ancho);
    R.render(escena, cam); document.body.classList.toggle('lejos', ppu < 9);
    const w = lienzo.clientWidth, h = lienzo.clientHeight, cajas = []; 
    for (const e of etq) { if (e.zona && !recursos) { e.d.style.display = 'none'; continue; }
      let an = e.ancla || 'arriba'; v3.copy(e.v); v3.y += e.alza * esc * (an === 'arriba' ? 1 : an === 'abajo' ? 0 : 0.45); v3.project(cam); const x = (v3.x * 0.5 + 0.5) * w, y = (-v3.y * 0.5 + 0.5) * h;
      if (v3.z > 1 || x < 8 || x > w - 8 || y < (recursos ? 118 : 44) || y > h - 60) { e.d.style.display = 'none'; continue; }
      if (!e.w) { e.d.style.display = ''; e.w = e.d.offsetWidth; e.h = e.d.offsetHeight; }
      const compacta = e.zona && ppu < 14; const bw = compacta ? 24 : e.w, sep = an === 'izq' || an === 'der' ? Math.max(12, esc * ppu * 0.8) : 0; if (an === 'izq' && x - sep - bw < 4) an = 'der'; else if (an === 'der' && x + sep + bw > w - 4) an = 'izq'; const c = an === 'izq' ? [x - sep - bw, y - e.h / 2, x - sep, y + e.h / 2] : an === 'der' ? [x + sep, y - e.h / 2, x + sep + bw, y + e.h / 2] : an === 'abajo' ? [x - bw / 2, y + 5, x + bw / 2, y + 5 + e.h] : [x - bw / 2, y - e.h, x + bw / 2, y]; let choca = false; for (const o of cajas) if (c[0] < o[2] - 2 && c[2] > o[0] + 2 && c[1] < o[3] - 2 && c[3] > o[1] + 2) { choca = true; break; }
      if (choca) { e.d.style.display = 'none'; continue; } cajas.push(c); e.d.classList.toggle('compacta', !!compacta);
      e.d.style.display = ''; e.d.style.transform = 'translate(' + Math.round(c[0]) + 'px,' + Math.round(c[1]) + 'px)'; }
    cuadros++; msSuma += performance.now() - a; requestAnimationFrame(cuadro); }
  vista(Q.get('vista') || 'corazon'); addEventListener('resize', () => { for (const e of etq) e.w = 0; });
  document.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => vista(b.dataset.vista)));
  const bRec = document.getElementById('b-recursos'); if (bRec) bRec.addEventListener('click', () => { recursos = !recursos; document.body.classList.toggle('con-recursos', recursos); bRec.setAttribute('aria-pressed', recursos); });
  if (Q.get('polis')) ficha(POLIS.find(p => p.id === Q.get('polis')));
  requestAnimationFrame(cuadro);
  const arranque = Math.round(performance.now() - t0);
  window.__mapa = { listo: true, arranque, vista, ficha: id => ficha(POLIS.find(p => p.id === id)), recursos(v) { recursos = v; document.body.classList.toggle('con-recursos', v); },
    info: () => ({ arranqueMs: arranque, triangulos: R.info.render.triangles, llamadas: R.info.render.calls, texturas: R.info.memory.textures, geometrias: R.info.memory.geometries, arboles: nArboles, barcos: barcos.length, msPorCuadro: +(msSuma / Math.max(1, cuadros)).toFixed(1) }),
    medir() { cuadros = 0; msSuma = 0; } };
  document.body.classList.add('listo');
}
