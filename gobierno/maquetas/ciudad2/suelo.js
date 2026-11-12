/* Maqueta Q1b2 — suelo, río, cielo y montes. El suelo MEZCLA texturas de 0 A.D. (terr_*) con máscaras pintadas en canvas.
   Dos juegos de máscaras: uno fino para la ciudad (±EC) y otro basto para el campo (±EP). Todo lo pintado es inventado. */
import { THREE } from '/js/gfx/models.js';
import { altura, RIO, NIVEL_RIO, FORO, FORO_GIRO, FORO_M, ARX, fbm, azar, fracMuro } from './mundo.js';

export const EC = 420, EP = 1700;
const TC = 2048, TP = 2048;

function lienzo(n, color) { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, n, n); return g; }
const camino = (g, p) => { g.beginPath(); p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); };
const poli = (g, p) => { camino(g, p); g.closePath(); };

/* Sin ctx.filter (el desenfoque del canvas es lentísimo): los bordes blandos se hacen con trazos apilados y degradados radiales. */
const trazo = (g, p, w, r, rgb, a = 1, cerrado) => { for (let k = 0; k < 4; k++) { g.lineWidth = w + r * 2 * (1 - k / 3); g.strokeStyle = `rgba(${rgb},${a * [0.28, 0.42, 0.62, 1][k]})`; cerrado ? poli(g, p) : camino(g, p); g.stroke(); } };
const mancha = (g, x, z, rx, ry, giro, rgb, a) => { g.save(); g.translate(x, z); g.rotate(giro); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); };

/* Pinta un juego (máscara + tinte) con la transformación mundo->píxel ya puesta. fino = ciudad. */
function pintar(M, T, W, fino, rnd) {
  const R = (a, b) => a + (b - a) * rnd(), px = fino ? EC * 2 / TC : EP * 2 / TP, E = fino ? EC : EP;       // px: unidades de mundo por píxel
  M.lineCap = M.lineJoin = T.lineCap = T.lineJoin = 'round';
  /* manchas grandes de tinte (rompen la repetición) */
  for (let i = 0; i < (fino ? 500 : 1700); i++) { const x = R(-E, E), z = R(-E, E), r = R(fino ? 10 : 40, fino ? 50 : 230); mancha(T, x, z, r, r * R(0.4, 1), R(0, 3), rnd() < 0.5 ? `${R(70, 100) | 0},${R(62, 88) | 0},${R(40, 60) | 0}` : `${R(165, 190) | 0},${R(150, 170) | 0},${R(105, 125) | 0}`, R(0.1, 0.3)); }
  /* parcelas */
  const COL = { rastrojo: [186, 164, 108], barbecho: [98, 82, 66], vina: [80, 94, 54], olivar: [142, 130, 94], pasto: [120, 122, 84], huerta: [74, 102, 52] };
  for (const pa of W.parcelas) { if (fino && pa.pol.every(q => Math.abs(q[0]) > E + 60 || Math.abs(q[1]) > E + 60)) continue; const c = COL[pa.clase], k = 0.86 + pa.v * 0.28;
    M.globalCompositeOperation = 'lighter'; M.fillStyle = pa.clase === 'pasto' || pa.clase === 'olivar' ? (fino ? 'rgb(0,0,0)' : 'rgb(0,60,0)') : pa.clase === 'huerta' ? (fino ? 'rgb(0,0,150)' : 'rgb(0,90,150)') : (fino ? 'rgb(0,0,0)' : 'rgb(0,200,0)'); poli(M, pa.pol); M.fill();
    T.fillStyle = `rgba(${c[0] * k | 0},${c[1] * k | 0},${c[2] * k | 0},0.88)`; poli(T, pa.pol); T.fill();
    if (pa.clase !== 'pasto') { T.save(); poli(T, pa.pol); T.clip(); const cx = (pa.pol[0][0] + pa.pol[2][0]) / 2, cz = (pa.pol[0][1] + pa.pol[2][1]) / 2, co = Math.cos(pa.ang), si = Math.sin(pa.ang), sep = pa.clase === 'vina' ? 5.2 : pa.clase === 'olivar' ? 9 : fino ? 2.2 : 3.6;
      T.strokeStyle = pa.clase === 'vina' ? 'rgba(52,66,30,0.5)' : pa.clase === 'huerta' ? 'rgba(50,74,30,0.4)' : 'rgba(70,52,34,0.22)'; T.lineWidth = pa.clase === 'vina' ? 2 : Math.max(px * 0.9, 0.9); T.beginPath();
      for (let s = -120; s <= 120; s += sep) { T.moveTo(cx - si * s - co * 130, cz + co * s - si * 130); T.lineTo(cx - si * s + co * 130, cz + co * s + si * 130); } T.stroke(); T.restore(); }
    T.setLineDash([R(8, 30), R(2, 9)]); T.lineWidth = fino ? 1.5 : 3.6; T.strokeStyle = pa.linde < 0.6 ? 'rgba(50,58,32,0.7)' : 'rgba(150,140,118,0.5)'; poli(T, pa.pol); T.stroke(); T.setLineDash([]); }
  /* ribera: verde, arena, orilla húmeda */
  M.globalCompositeOperation = 'lighter'; trazo(M, RIO, 170, 30, '0,0,150', 0.5);
  M.globalCompositeOperation = 'source-over'; trazo(M, RIO, 104, 8, '235,0,30');
  trazo(T, RIO, 104, 8, '205,188,150', 0.85); trazo(T, RIO, 82, 5, '70,66,48', 0.7);
  /* interior de la ciudad: tierra pisada, más oscura hacia los muros */
  const dentro = W.contorno.map(p => [p[0] * 1.01, p[1] * 1.01]);
  M.fillStyle = 'rgb(205,0,0)'; poli(M, dentro); M.fill(); trazo(M, dentro, 2, 6, '205,0,0', 1, true);
  T.fillStyle = 'rgba(146,132,110,0.6)'; poli(T, dentro); T.fill();
  for (let i = 0; i < 1500; i++) { const a = R(0, 6.283), f = Math.sqrt(rnd()) * 0.97, x = Math.cos(a) * f, z = Math.sin(a) * f, q = W.contorno[Math.floor(a / 6.2832 * 720) % 720], r = R(5, 15); mancha(M, q[0] * f, q[1] * f, r, r * R(0.5, 1), R(0, 3), '0,0,0', R(0.5, 0.95)); }      // calvas de hierba seca en los solares
  /* huertos y patios verdes dentro de las manzanas */
  for (const h of W.huertos) { mancha(M, h.x, h.z, h.r * 1.25, h.r * R(0.7, 1.2), R(0, 3), `${R(40, 110) | 0},0,${R(170, 245) | 0}`, 1); mancha(T, h.x, h.z, h.r * 1.2, h.r * 1.2, 0, `${R(104, 126) | 0},${R(112, 130) | 0},${R(70, 86) | 0}`, 0.5); }
  /* caminos y calles: tierra batida, centro gastado y rodadas (sin losas: el primer empedrado de Roma es de 174 a.C.) */
  const vias = W.caminos.concat(W.calles);
  for (const c of vias) { trazo(M, c.p, c.w * 2 + (c.t === 'camino' ? 2 : 1.2), 1.4, '255,0,0'); trazo(T, c.p, c.w * 2, 1.6, '142,128,104', 0.8); trazo(T, c.p, c.w * 0.8, c.w * 0.4, '196,178,142', 0.7);
    if (fino && c.w > 2.3) { T.strokeStyle = 'rgba(74,62,48,0.38)'; T.lineWidth = 0.55; for (const o of [-1.25, 1.25]) { T.beginPath(); for (let i = 0; i < c.p.length - 1; i++) { const a = c.p[i], b = c.p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L, w = o + Math.sin(i * 0.37) * 0.35; i ? T.lineTo(a[0] + nx * w, a[1] + nz * w) : T.moveTo(a[0] + nx * w, a[1] + nz * w); } T.stroke(); } } }
  /* foro enlosado (lo único con losas) y explanada de la arx */
  const cf = Math.cos(FORO_GIRO), sf = Math.sin(FORO_GIRO), rect = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [FORO[0] + u * FORO_M[0] * cf - v * FORO_M[1] * sf, FORO[1] + u * FORO_M[0] * sf + v * FORO_M[1] * cf]);
  M.fillStyle = fino ? 'rgb(40,255,0)' : 'rgb(230,0,0)'; poli(M, rect); M.fill(); trazo(M, rect, 1, 2, fino ? '40,255,0' : '230,0,0', 1, true); T.fillStyle = 'rgba(150,140,124,0.55)'; poli(T, rect); T.fill();
  mancha(M, ARX[0], ARX[1], 46, 38, 0.25, '215,0,0', 1);
  /* suciedad: sombra de contacto de cada edificio, muralla y manchas */
  const huella = (c, m, a) => { T.save(); T.translate(c.x, c.z); T.rotate(c.ang); for (let k = 0; k < 3; k++) { const e = m * (1 - k / 3); T.fillStyle = `rgba(50,42,34,${a * [0.3, 0.45, 0.7][k]})`; T.beginPath(); T.roundRect(-c.w / 2 - e, -c.d / 2 - e, c.w + 2 * e, c.d + 2 * e, e + 0.5); T.fill(); } T.restore(); };
  for (const c of W.casas) { mancha(M, c.x, c.z, c.w * (c.intramuros ? 1.0 : 1.3), c.w * (c.intramuros ? 1.0 : 1.3), 0, '225,0,0', 0.95); huella(c, 3, 0.6); }
  for (const g of W.granjas) { mancha(M, g.x, g.z, 36, 36, 0, '215,0,0', 0.95); huella(g, 3, 0.5); }
  for (const u of W.unicos) huella({ x: u.x, z: u.z, ang: u.ang, w: 26, d: 30 }, 4, 0.5);
  trazo(T, W.contorno, 9, 5, '48,42,34', 0.55, true);
  if (!fino) for (const a of W.arboles) { if (fracMuro(a.x, a.z) < 1) continue; const r = (a.pieza === 'cipres' ? 3 : 8) * a.esc; mancha(T, a.x + r * 0.9, a.z + r * 0.55, r * 1.9, r * 1.1, 0.58, '40,40,30', 0.75); }
  if (fino) for (let i = 0; i < 2600; i++) mancha(T, R(-EC, EC), R(-EC, EC), R(1.5, 6), R(1, 4), R(0, 3), rnd() < 0.6 ? '60,50,40' : '190,176,150', R(0.1, 0.35));
}

function juego(W, fino, semilla) {
  const n = fino ? TC : TP, E = fino ? EC : EP, M = lienzo(n, 'rgb(0,0,0)'), T = lienzo(n, 'rgb(128,128,128)');
  for (const g of [M, T]) { g.setTransform(n / (2 * E), 0, 0, n / (2 * E), n / 2, n / 2); }
  pintar(M, T, W, fino, azar(semilla));
  const tex = c => { const t = new THREE.CanvasTexture(c.canvas); t.colorSpace = THREE.NoColorSpace; t.flipY = false; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  return { m: tex(M), t: tex(T) };
}

/* ruido tileable pequeño (nubes, variación a gran escala) */
export function texturaRuido() { const n = 256, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), im = g.createImageData(n, n); const per = (x, y, f) => { let s = 0; for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const wx = ox ? x : 1 - x, wy = oy ? y : 1 - y; s += wx * wy * fbm((x - ox) * f + 50, (y - oy) * f + 50, 4); } return s; };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = i / n, y = j / n, o = (j * n + i) * 4; im.data[o] = 255 * per(x, y, 4); im.data[o + 1] = 255 * per(x + 0.37, y + 0.11, 9) % 256; im.data[o + 2] = 255 * per(y, x, 18); im.data[o + 3] = 255; }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace; return t; }

/* GLSL común: sombra de nubes que cruza el suelo (también la usan los edificios) */
export const GLSL_NUBES = `uniform sampler2D uRuido; uniform float uTiempo;
float nubes(vec3 p){ float n = texture2D(uRuido, p.xz*0.00042 + vec2(uTiempo*0.004, uTiempo*0.0015)).r; n = n*0.65 + 0.35*texture2D(uRuido, p.xz*0.0011 + vec2(0.3,0.7)).r; return mix(0.66, 1.0, smoothstep(0.31, 0.45, n)); }`;

export function crearSuelo(W, texs, U) {
  const C = juego(W, true, 11), P = juego(W, false, 23);
  /* malla: densa en el centro, se estira hacia fuera */
  const N = 180, pos = new Float32Array((N + 1) * (N + 1) * 3), idx = [], f = u => Math.sign(u) * (Math.abs(u) * 520 + Math.pow(Math.abs(u), 3.2) * 3300);
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const x = f(i / N * 2 - 1), z = f(j / N * 2 - 1), o = (j * (N + 1) + i) * 3; pos[o] = x; pos[o + 1] = altura(x, z); pos[o + 2] = z; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uMC: { value: C.m }, uTC: { value: C.t }, uMP: { value: P.m }, uTP: { value: P.t }, tDry: { value: texs.terr_grass }, tGreen: { value: texs.terr_dry }, tDirt: { value: texs.terr_dirt }, tPav: { value: texs.terr_paving }, tFarm: { value: texs.terr_farm }, tSand: { value: texs.terr_sand }, uRuido: U.uRuido, uTiempo: U.uTiempo });
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `varying vec3 vWP; uniform sampler2D uMC, uTC, uMP, uTP, tDry, tGreen, tDirt, tPav, tFarm, tSand;\n${GLSL_NUBES}\n` + sh.fragmentShader.replace('#include <map_fragment>', `
      vec2 uc = vWP.xz / ${(EC * 2).toFixed(1)} + 0.5, up = clamp(vWP.xz / ${(EP * 2).toFixed(1)} + 0.5, 0.002, 0.998);
      vec2 dc = abs(uc - 0.5); float kc = 1.0 - smoothstep(0.42, 0.495, max(dc.x, dc.y));
      vec3 mc = texture2D(uMC, uc).rgb, mp = texture2D(uMP, up).rgb, tc = texture2D(uTC, uc).rgb, tp = texture2D(uTP, up).rgb;
      float tierra = mix(mp.r, mc.r, kc), losa = mc.g * kc, labor = mp.g, verde = mix(mp.b, mc.b, kc);
      vec3 tinte = mix(tp, tc, kc) * 2.0;
      float g1 = texture2D(uRuido, vWP.xz * 0.0031).g, g2 = texture2D(uRuido, vWP.xz * 0.00071 + 0.21).r, g3 = texture2D(uRuido, vWP.xz * 0.023).b;
      vec2 q = vWP.xz;
      vec3 seco = mix(texture2D(tDry, q / 23.0).rgb, texture2D(tDry, q / 71.0 + 0.37).rgb, 0.45); seco = mix(seco, vec3(dot(seco, vec3(0.33))), 0.38) * vec3(0.98, 0.93, 0.80);
      vec3 hier = texture2D(tGreen, q / 19.0).rgb * vec3(0.80, 0.86, 0.62);
      vec3 tie = mix(texture2D(tDirt, q / 17.0).rgb, texture2D(tDirt, q / 53.0 + 0.61).rgb, 0.4) * vec3(1.2, 1.02, 0.82);
      vec3 lab = texture2D(tDirt, q / 29.0).rgb * vec3(1.05, 0.98, 0.86);
      vec3 pav = texture2D(tPav, q / 11.0).rgb * vec3(0.98, 0.93, 0.84);
      vec3 col = seco * mix(0.86, 1.1, g2);
      col = mix(col, tie * 1.02, smoothstep(0.55, 0.8, g1 + g2 * 0.5) * 0.55);                 // calvas de tierra en el pasto
      col = mix(col, hier, clamp(verde * 1.1, 0.0, 1.0) * (0.75 + 0.25 * g3));
      col = mix(col, lab, clamp(labor, 0.0, 1.0));
      col = mix(col, tie, smoothstep(0.35 - g3 * 0.25, 0.75, tierra));
      col = mix(col, pav, smoothstep(0.4, 0.7, losa + (g3 - 0.5) * 0.3));
      col *= tinte;
      float lejos = smoothstep(500.0, 2200.0, length(vWP.xz)); col = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))) * vec3(0.92, 1.0, 1.1), lejos * 0.42);
      float monte = smoothstep(0.36, 0.56, g2 * 0.55 + texture2D(uRuido, vWP.xz * 0.0019).g * 0.6) * smoothstep(1100.0, 1900.0, length(vWP.xz)) * (1.0 - smoothstep(0.1, 0.5, labor)); col = mix(col, vec3(0.16, 0.20, 0.12) * (0.7 + 0.6 * g3), monte * 0.8); col *= mix(1.0, 0.8, lejos); col = mix(col, vec3(0.17, 0.21, 0.14) * (0.75 + 0.5 * g1), smoothstep(30.0, 170.0, vWP.y) * smoothstep(800.0, 1300.0, length(vWP.xz)) * 0.75);
      diffuseColor.rgb = col * nubes(vWP);`);
  };
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; return m;
}

export function crearRio(texs, U) {
  const n = RIO.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = []; let s = 0;
  for (let i = 0; i < n; i++) { const a = RIO[Math.max(0, i - 1)], b = RIO[Math.min(n - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L, w = 80; if (i) s += Math.hypot(RIO[i][0] - RIO[i - 1][0], RIO[i][1] - RIO[i - 1][1]);
    pos.set([RIO[i][0] + nx * w, NIVEL_RIO, RIO[i][1] + nz * w, RIO[i][0] - nx * w, NIVEL_RIO, RIO[i][1] - nz * w], i * 6); uv.set([0, s / 60, 1.3, s / 60], i * 4); if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshPhongMaterial({ color: '#6f8288', specular: '#e0d2b8', shininess: 60, normalMap: texs.water_norm, normalScale: new THREE.Vector2(0.35, 0.35), transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  mat.onBeforeCompile = sh => { sh.uniforms.uTiempo = U.uTiempo; sh.vertexShader = 'uniform float uTiempo;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vNormalMapUv.y += uTiempo * 0.02;'); };
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; return m;
}

/* cielo: degradado del horizonte cálido al azul frío, resplandor hacia el sol, y tres capas de montes en la bruma */
export function crearCielo(dirSol, HORIZ) {
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
  [[4300, 300, '#465c76', 0.3, 1.7], [5600, 480, '#587694', 0.42, 1.1], [7200, 720, '#6e8cae', 0.52, 0.7]].forEach(([r, alt, col, bruma, fq], k) => {
    const n = 220, pos = [], idx = []; for (let i = 0; i <= n; i++) { const t = i / n * Math.PI * 2, x = Math.cos(t) * r, z = Math.sin(t) * r, h = alt * (0.25 + 0.95 * fbm(Math.cos(t) * 3 * fq + k * 9.1 + 20, Math.sin(t) * 3 * fq + k * 3.3 + 20, 4)); pos.push(x, -60, z, x, h, z); if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).lerp(H, bruma), side: THREE.DoubleSide, fog: false })); m.renderOrder = -9 + (2 - k); g.add(m); });
  return g;
}
