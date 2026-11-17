/* AQVILA · maqueta GM44 «soldado Rome II»: visor. Arrastra para girar, pellizca para acercar. */
import { THREE, cargar, tropa } from './soldado.js';
const Q = new URLSearchParams(location.search), lienzo = document.getElementById('c'), FOTO = Q.has('foto'); if (Q.has('limpio')) document.body.classList.add('foto');
const r = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, preserveDrawingBuffer: FOTO });
r.setPixelRatio(Math.min(2, +Q.get('dpr') || window.devicePixelRatio || 1)); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = +Q.get('exp') || 1.0;
r.shadowMap.enabled = !Q.has('sinsombra'); r.shadowMap.type = THREE.PCFSoftShadowMap;
const escena = new THREE.Scene(), cam = new THREE.PerspectiveCamera(+Q.get('fov') || 30, 1, 0.05, 400);

/* cielo: fondo y reflejo del metal */
function lienzoDe(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; }
const cieloTex = new THREE.CanvasTexture(lienzoDe(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#35619c'); gr.addColorStop(0.3, '#7ea0c4'); gr.addColorStop(0.46, '#d5d3c4'); gr.addColorStop(0.5, '#efdcb8'); gr.addColorStop(0.515, '#9a8a66'); gr.addColorStop(1, '#5d5038'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 260; i++) { const x = rnd() * w, y = h * (0.12 + 0.34 * Math.pow(rnd(), 0.7)), r = (14 + rnd() * 60) * (0.4 + y / h), rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,248,235,0.20)'); rg.addColorStop(1, 'rgba(255,248,235,0)'); g.fillStyle = rg; g.save(); g.translate(x, y); g.scale(2.6, 0.55); g.translate(-x, -y); g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); } }));
cieloTex.colorSpace = THREE.SRGBColorSpace;
const cupula = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: cieloTex, side: THREE.BackSide, fog: false, depthWrite: false })); escena.add(cupula);
{ const e = new THREE.Scene(); e.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: cieloTex, side: THREE.BackSide })));
  const s = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(40, 34, 26) })); s.position.set(-34, 21, 24); e.add(s);
  const pm = new THREE.PMREMGenerator(r); escena.environment = pm.fromScene(e, 0.03).texture; pm.dispose(); escena.environmentIntensity = 0.6; }
escena.fog = new THREE.Fog('#d9cdb4', 22, 200);
const sol = new THREE.DirectionalLight('#ffe2bd', 3.5); sol.position.set(-6, 8, 7); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.012; escena.add(sol, sol.target);
escena.add(new THREE.HemisphereLight('#c9d8ee', '#8a7350', 0.95));

/* suelo: tierra y hierba seca */
function sueloTex() { const N = 1024; let alt; const c = lienzoDe(N, N, (g) => { const im = g.createImageData(N, N), d = im.data; let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const cap = [], K = [5, 13, 37, 97, 251]; for (const k of K) { const a = new Float32Array(k * k); for (let i = 0; i < a.length; i++) a[i] = rnd(); cap.push(a); }
    const val = (a, k, x, y) => { const fx = x * k / N, fy = y * k / N, i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v), A = (p, q) => a[(q % k) * k + (p % k)]; return (A(i, j) * (1 - su) + A(i + 1, j) * su) * (1 - sv) + (A(i, j + 1) * (1 - su) + A(i + 1, j + 1) * su) * sv; };
    alt = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const g1 = val(cap[0], 5, x, y) * 0.5 + val(cap[1], 13, x, y) * 0.5, f = val(cap[3], 97, x, y) * 0.55 + val(cap[4], 251, x, y) * 0.45, m = val(cap[2], 37, x, y);
      const hier = Math.max(0, Math.min(1, (g1 - 0.45) * 5 + (m - 0.5) * 1.5)), o = (y * N + x) * 4, k = 0.80 + f * 0.40; alt[y * N + x] = f + hier * 0.3;
      d[o] = (122 * (1 - hier) + 112 * hier) * k; d[o + 1] = (100 * (1 - hier) + 106 * hier) * k; d[o + 2] = (70 * (1 - hier) + 58 * hier) * k; d[o + 3] = 255; }
    g.putImageData(im, 0, 0);
    for (let i = 0; i < 3600; i++) { const x = rnd() * N, y = rnd() * N, l = 5 + rnd() * 14, a = -1.57 + (rnd() - 0.5) * 1.6, v = rnd(); g.strokeStyle = v < 0.5 ? `rgba(${160 + rnd() * 40 | 0},${148 + rnd() * 34 | 0},${96 + rnd() * 26 | 0},0.30)` : `rgba(${84 + rnd() * 24 | 0},${88 + rnd() * 26 | 0},${50 + rnd() * 18 | 0},0.32)`; g.lineWidth = 1 + rnd(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    for (let i = 0; i < 260; i++) { const x = rnd() * N, y = rnd() * N, r = 1.2 + rnd() * 3; g.fillStyle = `rgba(${150 + rnd() * 60 | 0},${140 + rnd() * 55 | 0},${120 + rnd() * 50 | 0},0.8)`; g.beginPath(); g.ellipse(x, y, r, r * 0.7, rnd() * 3, 0, 6.3); g.fill(); g.fillStyle = 'rgba(30,22,12,0.45)'; g.beginPath(); g.ellipse(x + 1, y + r * 0.6, r, r * 0.35, 0, 0, 6.3); g.fill(); } });
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(110, 110); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  const nc = lienzoDe(N, N, (g) => { const im = g.createImageData(N, N), d = im.data; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const a = (p, q) => alt[((q + N) % N) * N + ((p + N) % N)], dx = (a(x + 1, y) - a(x - 1, y)) * 3.2, dy = (a(x, y + 1) - a(x, y - 1)) * 3.2, l = Math.hypot(dx, dy, 1), o = (y * N + x) * 4; d[o] = (-dx / l * 0.5 + 0.5) * 255; d[o + 1] = (-dy / l * 0.5 + 0.5) * 255; d[o + 2] = (1 / l * 0.5 + 0.5) * 255; d[o + 3] = 255; } g.putImageData(im, 0, 0); });
  const n = new THREE.CanvasTexture(nc); n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(110, 110); n.anisotropy = 16; sueloTex.normal = n; return t; }
const sueloMat = new THREE.MeshStandardMaterial({ map: sueloTex(), roughness: 0.95, metalness: 0 }); sueloMat.normalMap = sueloTex.normal; sueloMat.normalScale.set(0.8, 0.8);
sueloMat.onBeforeCompile = sh => { sh.vertexShader = 'varying vec3 vMundo;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vMundo = (modelMatrix * vec4(position, 1.0)).xyz;');
  sh.fragmentShader = 'varying vec3 vMundo;\nfloat rs(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5), b = fract(sin(dot(i + vec2(1, 0), vec2(127.1, 311.7))) * 43758.5), c = fract(sin(dot(i + vec2(0, 1), vec2(127.1, 311.7))) * 43758.5), d = fract(sin(dot(i + vec2(1, 1), vec2(127.1, 311.7))) * 43758.5); return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }\n'
    + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n float g = rs(vMundo.xz * 0.07) * 0.6 + rs(vMundo.xz * 0.31) * 0.4; diffuseColor.rgb *= mix(vec3(1.10, 1.02, 0.86), vec3(0.88, 0.98, 0.78), smoothstep(0.3, 0.7, g)) * (0.85 + 0.3 * rs(vMundo.xz * 1.7));'); };
const suelo = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), sueloMat); suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; escena.add(suelo);
{ const N = 96, pos = [], idx = [], col = []; let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, alt = []; for (let i = 0; i <= N; i++) alt.push(8 + 22 * rnd() * rnd() + 10 * Math.sin(i * 0.37) + 8 * Math.sin(i * 0.11 + 1));
  for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2, h = Math.max(4, (alt[i % N] + alt[(i + 1) % N] + alt[(i + N - 1) % N]) / 3); pos.push(Math.sin(a) * 260, -2, Math.cos(a) * 260, Math.sin(a) * 290, h, Math.cos(a) * 290); col.push(0.50, 0.50, 0.38, 0.56, 0.60, 0.58); if (i < N) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); escena.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }))); }
{ const tx = new THREE.CanvasTexture(lienzoDe(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); let s = 11; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 46; i++) { const x = 14 + rnd() * 100, t = 30 + rnd() * 90, d = (rnd() - 0.5) * 34; g.strokeStyle = `rgb(${150 + rnd() * 50 | 0},${140 + rnd() * 40 | 0},${88 + rnd() * 30 | 0})`; g.lineWidth = 1.6 + rnd() * 1.6; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + d * 0.3, h - t * 0.6, x + d, h - t); g.stroke(); } })); tx.colorSpace = THREE.SRGBColorSpace;
  const pg = new THREE.PlaneGeometry(0.3, 0.15); pg.translate(0, 0.075, 0); const g2 = pg.clone(); g2.rotateY(Math.PI / 2); const pos = [...pg.attributes.position.array, ...g2.attributes.position.array], uv = [...pg.attributes.uv.array, ...g2.attributes.uv.array], ix = [...pg.index.array, ...[...g2.index.array].map(i => i + 4)];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); g.computeVertexNormals(); const nn = g.attributes.normal; for (let i = 0; i < nn.count; i++) nn.setXYZ(i, 0, 1, 0);
  const M = 2600, mat = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ map: tx, alphaTest: 0.4, side: THREE.DoubleSide, color: '#8d8566' }), M), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(), p = new THREE.Vector3(); let s = 23; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < M; i++) { const r = 1.5 + 75 * Math.pow(rnd(), 1.3), a = rnd() * 6.283; p.set(Math.sin(a) * r, 0, Math.cos(a) * r + 4); q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 3.14); const k = 0.6 + rnd() * 0.9; e.set(k, k * (0.7 + rnd() * 0.6), k); m4.compose(p, q, e); mat.setMatrixAt(i, m4); }
  mat.receiveShadow = true; escena.add(mat); }

const dato = document.getElementById('dato'), abajo = document.getElementById('abajo');
const QUIEN = (Q.get('quien') || 'hastatus,galo').split(','), NIV = ['', '_lejos', '_muylejos', '_fondo'], MOD = {}; for (const n of QUIEN) MOD[n] = [await cargar(n)];
const S = Object.fromEntries(QUIEN.map(n => [n, MOD[n][0]]));
let tropas = [], hombres = [], grupos = {}, reparto = [0, 0, 0, 0], claveCam = '', modo = Q.get('modo') || 'quieto', vista = Q.get('vista') || 'uno', quienUno = 0;
let dist = 4.4, giro = 0.5, alto = 0.95, elev = 0.1, cx = 0, cz = 0;
/* Mismo detalle para todos: cada hombre se dibuja con los triángulos que su tamaño en pantalla puede enseñar.
   UMBRAL = altura en pantalla (px) a partir de la cual toca cada nivel; CERCA = tope de figuras finas (gobierno/arte.json). */
const CERCA = 40, UMBRAL = (Q.get('u') || '200,90,42').split(',').map(Number), FIJO = Q.has('nivel') ? +Q.get('nivel') : Q.has('todofino') ? 0 : -1, SOMBRA_HASTA = Q.has('sombra') ? +Q.get('sombra') : 3;
async function montar() {
  for (const t of tropas) { escena.remove(t.malla); t.malla.geometry.dispose(); } tropas = []; hombres = []; grupos = {}; cx = cz = 0;
  const lista = [], pon = (n, x, z, g, sem, o = {}) => lista.push({ n: QUIEN[n % QUIEN.length], x, z, g, sem, o });
  if (vista === 'hoja') { const L = (Q.get('hoja') || 'quieto:0').split(','), n = L.length; L.forEach((e, k) => { const [c, tt] = e.split(':'); pon(0, (k - (n - 1) / 2) * 1.15, 0, 0, 3, { clip: c, t: +tt }); }); dist = 2.2 + n * 1.25; alto = 0.95; giro = 0.5; elev = 0.12; }
  else if (vista === 'niveles') { for (let k = 0; k < 4; k++) pon(quienUno, (k - 1.5) * 1.05, 0, 0, 3 + quienUno * 2, { fase: 0, nv: k }); dist = 9.5; alto = 0.95; giro = 0.35; elev = 0.06; }
  else if (vista === 'uno') { pon(quienUno, 0, 0, 0, 3 + quienUno * 2, { fase: 0 }); dist = 4.3; alto = 0.95; giro = -0.6; elev = 0.08; }
  else if (vista === 'cara') { pon(quienUno, 0, 0, 0, 3 + quienUno * 2, { fase: 0 }); dist = 1.25; alto = 1.56; giro = 0.4; elev = 0.02; }
  else if (vista === 'pareja') { pon(0, -0.75, 0, 0.12, 3, { fase: 0 }); pon(1, 0.85, 0, -0.12, 5, { fase: 0.4 }); dist = innerWidth < innerHeight ? 9.6 : 5.6; alto = 0.98; giro = 0.3; elev = 0.07; }
  else if (vista === 'cuarenta') { for (let i = 0; i < 40; i++) pon(0, (i % 10 - 4.5) * 1.18 + ((i * 37) % 7 - 3) * 0.025, -Math.floor(i / 10) * 1.6 + ((i * 53) % 7 - 3) * 0.035, ((i * 29) % 9 - 4) * 0.014, i + 1); dist = 8.2; alto = 1.15; elev = 0.1; cz = -1.2; giro = 0.62; }
  else if (vista === 'linea') { const N = +Q.get('n') || 320, F = 4; for (let i = 0; i < N; i++) { const c = Math.floor(i / F), f = i % F, hueco = Math.floor(c / 20) * 2.2; pon(0, (c - N / F / 2) * 1.18 + hueco - 4 + ((i * 37) % 7 - 3) * 0.03, -f * 1.6 + ((i * 53) % 7 - 3) * 0.04, ((i * 29) % 9 - 4) * 0.014, i + 1); }
    if (QUIEN.length > 1) for (let i = 0; i < N; i++) { const c = Math.floor(i / F), f = i % F; pon(1, (c - N / F / 2) * 1.25 + ((i * 31) % 9 - 4) * 0.07, 14 + f * 1.6 + ((i * 53) % 9 - 4) * 0.08 + 1.2 * Math.sin(c * 0.21), Math.PI + ((i * 29) % 9 - 4) * 0.04, i + 1000, { clip: Q.get('modo2') || undefined }); }
    dist = 8.5; alto = 1.35; elev = 0.07; giro = 0.95; cz = 0.5; cx = -5; }
  for (const k of ['dist', 'giro', 'alto', 'elev', 'cx', 'cz']) if (Q.has(k)) eval(k + ' = ' + (+Q.get(k)));
  if (lista.length > 1 || FIJO > 0 || vista === 'niveles') for (const n of QUIEN) for (let k = 1; k < 4; k++) if (!MOD[n][k]) MOD[n][k] = await cargar(n + NIV[k]).catch(() => null) || MOD[n][k - 1];
  { const tx = new THREE.CanvasTexture(lienzoDe(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 3, 32, 32, 31); gr.addColorStop(0, 'rgba(20,14,6,0.62)'); gr.addColorStop(0.55, 'rgba(20,14,6,0.28)'); gr.addColorStop(1, 'rgba(20,14,6,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
    const pg = new THREE.PlaneGeometry(1.25, 1.05); pg.rotateX(-Math.PI / 2); const sm = new THREE.InstancedMesh(pg, new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }), lista.length), m4 = new THREE.Matrix4(); lista.forEach((h, i) => { m4.makeTranslation(h.x, 0.012, h.z); sm.setMatrixAt(i, m4); }); sm.renderOrder = 1; escena.add(sm); tropas.push({ malla: sm }); }
  const cuenta = {}; lista.forEach(h => cuenta[h.n] = (cuenta[h.n] || 0) + 1);
  for (const n of QUIEN) if (cuenta[n]) grupos[n] = MOD[n].map((mod, k) => { const t = tropa(mod, cuenta[n]); t.malla.castShadow = k < SOMBRA_HASTA; escena.add(t.malla); tropas.push(t); return t; });
  hombres = lista.map(h => ({ n: h.n, x: h.x, z: h.z, g: h.g, sem: h.sem, talla: (h.n === 'galo' ? 1.03 : 0.97) + 0.06 * ((h.sem * 7.3) % 1), fase: h.o.fase ?? h.sem * 1.7, clip: h.o.clip, tfijo: h.o.t, nvFijo: h.o.nv, vq: ['quieto', 'quieto2', 'quieto3'][Math.floor((Math.abs(Math.sin(h.sem * 12.9898)) * 43758.5453) % 3)] }));
  claveCam = '';
}
/* reparto por tamaño en pantalla; se rehace solo cuando la cámara se mueve */
function repartir() { const p = cam.position, clave = [p.x, p.y, p.z, giro, elev, innerWidth, innerHeight].map(v => v.toFixed(3)).join(); if (clave === claveCam) return; claveCam = clave;
  const k = innerHeight / (2 * Math.tan(cam.fov * Math.PI / 360)); cam.updateMatrixWorld(); const v = new THREE.Vector3();
  for (const h of hombres) { h.d = Math.hypot(h.x - p.x, 0.9 - p.y, h.z - p.z); const px = 1.75 * h.talla * k / h.d; h.nv = h.nvFijo != null ? h.nvFijo : FIJO >= 0 ? FIJO : px >= UMBRAL[0] ? 0 : px >= UMBRAL[1] ? 1 : px >= UMBRAL[2] ? 2 : 3;
    v.set(h.x, 0.9, h.z).project(cam); if (FIJO < 0 && h.nvFijo == null && (v.z > 1 || Math.abs(v.x) > 1 + 0.7 * px / innerWidth || Math.abs(v.y) > 1 + 1.3 * px / innerHeight)) h.nv = 3; }   // fuera de la pantalla: solo cuenta su sombra
  if (FIJO < 0) hombres.filter(h => h.nv === 0).sort((a, b) => a.d - b.d).slice(CERCA).forEach(h => h.nv = 1);
  for (const n in grupos) for (const t of grupos[n]) t.malla.count = 0; reparto = [0, 0, 0, 0];
  for (const h of hombres) { const g = grupos[h.n], nv = Math.min(h.nv, g.length - 1), t = g[nv]; h.t = t; h.i = t.malla.count; t.pon(h.i, h.x, h.z, h.g, h.sem, h.talla); reparto[nv]++; } }
await montar();
function botones() { abajo.innerHTML = ''; const b = (txt, on, f) => { const e = document.createElement('button'); e.textContent = txt; if (on) e.className = 'on'; e.onclick = async () => { await f(); botones(); }; abajo.appendChild(e); };
  for (const [k, n] of [['quieto', 'Quieto'], ['andar', 'Andar'], ['guardia', 'En guardia'], ['lanzar', 'Lanzar'], ['golpear', 'Golpear'], ['cubrirse', 'Cubrirse'], ['morir', 'Caer']]) b(n, modo === k, () => { modo = k; t0 = performance.now(); });
  for (const [k, n] of [['uno', 'Uno'], ['cara', 'La cara'], ['pareja', 'Romano y galo'], ['cuarenta', 'Ver 40'], ['linea', 'La línea']]) b(n, vista === k, () => { vista = k; return montar(); });
  if (QUIEN.length > 1 && (vista === 'uno' || vista === 'cara')) b(quienUno ? 'Ver al romano' : 'Ver al galo', false, () => { quienUno = 1 - quienUno; return montar(); }); }
const dedos = new Map(); let d0 = 0; const lim = () => { dist = Math.max(0.5, Math.min(60, dist)); elev = Math.max(-0.08, Math.min(1.3, elev)); };
lienzo.addEventListener('pointerdown', e => { dedos.set(e.pointerId, [e.clientX, e.clientY]); lienzo.setPointerCapture(e.pointerId); });
lienzo.addEventListener('pointermove', e => { const p = dedos.get(e.pointerId); if (!p) return; if (dedos.size === 1) { giro -= (e.clientX - p[0]) * 0.008; elev += (e.clientY - p[1]) * 0.005; }
  dedos.set(e.pointerId, [e.clientX, e.clientY]); if (dedos.size === 2) { const [a, b] = [...dedos.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (d0) dist *= d0 / d; d0 = d; } lim(); });
const fuera = e => { dedos.delete(e.pointerId); d0 = 0; }; lienzo.addEventListener('pointerup', fuera); lienzo.addEventListener('pointercancel', fuera);
lienzo.addEventListener('wheel', e => { dist *= 1 + e.deltaY * 0.001; lim(); });
function medida() { const w = innerWidth, h = innerHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } addEventListener('resize', medida); medida();

let t0 = performance.now(), cuadros = 0, tf = t0, fps = 0; const fijo = Q.has('t') ? +Q.get('t') : null;
function bucle(ahora) { const t = fijo ?? (ahora - t0) / 1000;
  const f = cam.aspect < 1 ? 1 : 0.62, d = dist * f; cam.position.set(cx + Math.sin(giro) * Math.cos(elev) * d, alto + Math.sin(elev) * d, cz + Math.cos(giro) * Math.cos(elev) * d); cam.lookAt(cx, alto, cz); repartir();
  for (const h of hombres) { let c = h.clip || modo; if (c === 'quieto' && hombres.length > 1) c = h.vq; const cl = h.t.s.j.clips[c] ? c : 'quieto', k = h.t.s.j.clips[cl], tt = h.tfijo ?? (k.bucle ? t + h.fase : Math.max(0, (t + (vista === 'uno' ? 0 : h.fase)) % (k.n / k.fps + 1.2)));
    let mu = 0; for (const [t1, v] of (h.t.s.j.muestra || {})[cl] || []) if (tt >= t1) mu = v; h.t.pose(h.i, cl, tt, Q.has('muestra') ? +Q.get('muestra') : mu); }
  const sd = Math.max(3.5, Math.min(34, d * 0.9)); sol.target.position.set(cx, 0, cz); sol.position.set(cx - 17, 10.5, cz + 12); const sc = sol.shadow.camera; sc.left = -sd; sc.right = sd; sc.top = sd; sc.bottom = -sd; sc.near = 0.5; sc.far = 80; sc.updateProjectionMatrix();
  cupula.position.copy(cam.position); r.info.autoReset = false; r.info.reset(); r.render(escena, cam); ultimo.tris = r.info.render.triangles; ultimo.llamadas = r.info.render.calls; cuadros++;
  if (ahora - tf > 500) { fps = cuadros * 1000 / (ahora - tf); cuadros = 0; tf = ahora; dato.textContent = info().texto; }
  window.__listo = true; if (!Q.has('una')) requestAnimationFrame(bucle); }
function info() { const tr = n => (MOD[QUIEN[0]][n] || { j: { tris: 0 } }).j.tris, s = S[QUIEN[0]].j; return { tris: ultimo.tris, llamadas: ultimo.llamadas, porNivel: [0, 1, 2, 3].map(tr), reparto, huesos: s.huesos.length, hombres: hombres.length,
  texto: `${hombres.length} hombres · ${hombres.length > 1 ? 'por tamaño: ' + reparto.map((n, k) => n + '×' + tr(k).toLocaleString('es')).join(', ') : s.tris.toLocaleString('es') + ' triángulos'} · ${ultimo.tris.toLocaleString('es')} triángulos en pantalla · ${ultimo.llamadas} llamadas · ${fps.toFixed(0)} img/s` }; }
const ultimo = { tris: 0, llamadas: 0 };
window.__info = info; requestAnimationFrame(bucle);
