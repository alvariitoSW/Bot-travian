/* Maqueta Q1k — suelo que se REPINTA al jugar. Adaptado de ciudad2/suelo.js (misma mezcla de texturas de 0 A.D. con máscaras
   pintadas en canvas, mismos colores). Diferencias: el terreno base se pinta una vez (vacío: hierba, ribera, bosque) y encima,
   cada vez que cambia la ciudad, se repintan calles, plaza, solares, campos y la huella de cada casa. Además lleva una tercera
   textura pequeña: el mapa de calor del sitio. Todo lo pintado es inventado. */
import { THREE } from '../../../js/gfx/models.js';
import { altura, RIO, azar } from '../ciudad2/mundo.js';
import { GLSL_NUBES } from '../ciudad2/suelo.js';
import { X0, Z0, LADO, N_CALOR } from './reglas.js';

export const EC = 420, EP = 1700, CZ = -40;          // el juego fino va centrado en (0, CZ): cubre del río a la vaguada
const TC = 1536, TP = 1024, MC = 1024, MP = 512;

function lienzo(n, color) { const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, n, n); return g; }
const camino = (g, p) => { g.beginPath(); p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); };
const poli = (g, p) => { camino(g, p); g.closePath(); };
const trazo = (g, p, w, r, rgb, a = 1, cerrado) => { for (let k = 0; k < 4; k++) { g.lineWidth = w + r * 2 * (1 - k / 3); g.strokeStyle = `rgba(${rgb},${a * [0.28, 0.42, 0.62, 1][k]})`; cerrado ? poli(g, p) : camino(g, p); g.stroke(); } };
const mancha = (g, x, z, rx, ry, giro, rgb, a) => { g.save(); g.translate(x, z); g.rotate(giro); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); };

/* terreno vacío: manchas de tinte, prados, ribera y la sombra verde de los bosquetes */
function pintarBase(M, T, bosquetes, fino, rnd) {
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
function pintarCiudad(M, T, E, fino) {
  const px = fino ? EC * 2 / TC : EP * 2 / TP;
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

export function crearSuelo3(texs, U, bosquetes) {
  const juego = (fino, semilla) => { const n = fino ? TC : TP, nm = fino ? MC : MP, Ex = fino ? EC : EP, oz = fino ? CZ : 0;
    const M = lienzo(nm, 'rgb(0,0,0)'), T = lienzo(n, 'rgb(128,128,128)'), pon = (g, k) => g.setTransform(k / (2 * Ex), 0, 0, k / (2 * Ex), k / 2, k / 2 - oz * k / (2 * Ex)); pon(M, nm); pon(T, n);
    pintarBase(M, T, bosquetes, fino, azar(semilla));
    const copia = g => { const c = document.createElement('canvas'); c.width = c.height = g.canvas.width; c.getContext('2d').drawImage(g.canvas, 0, 0); return c; };
    const tex = c => { const t = new THREE.CanvasTexture(c.canvas); t.colorSpace = THREE.NoColorSpace; t.flipY = false; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
    return { M, T, bM: copia(M), bT: copia(T), m: tex(M), t: tex(T), pon: () => { pon(M, nm); pon(T, n); }, fino }; };
  const Cj = juego(true, 11), Pj = juego(false, 23);
  /* mapa de calor */
  const cc = document.createElement('canvas'); cc.width = cc.height = N_CALOR; const cg = cc.getContext('2d'), tCal = new THREE.CanvasTexture(cc); tCal.colorSpace = THREE.NoColorSpace; tCal.flipY = false; tCal.magFilter = tCal.minFilter = THREE.LinearFilter; tCal.generateMipmaps = false;
  const uCal = { value: 0 };
  /* malla: densa en el centro, se estira hacia fuera (igual que ciudad2, algo más densa cerca) */
  const NN = 128, pos = new Float32Array((NN + 1) * (NN + 1) * 3), idx = [], f = u => Math.sign(u) * (Math.abs(u) * 520 + Math.pow(Math.abs(u), 3.2) * 3300);
  for (let j = 0; j <= NN; j++) for (let i = 0; i <= NN; i++) { const x = f(i / NN * 2 - 1), z = f(j / NN * 2 - 1) + CZ, o = (j * (NN + 1) + i) * 3; pos[o] = x; pos[o + 1] = altura(x, z); pos[o + 2] = z; }
  for (let j = 0; j < NN; j++) for (let i = 0; i < NN; i++) { const a = j * (NN + 1) + i, b = a + 1, c = a + NN + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uMC: { value: Cj.m }, uTC: { value: Cj.t }, uMP: { value: Pj.m }, uTP: { value: Pj.t }, uCalor: { value: tCal }, uCal, tDry: { value: texs.terr_grass }, tGreen: { value: texs.terr_dry }, tDirt: { value: texs.terr_dirt }, tPav: { value: texs.terr_paving }, uRuido: U.uRuido, uTiempo: U.uTiempo });
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `varying vec3 vWP; uniform sampler2D uMC, uTC, uMP, uTP, uCalor, tDry, tGreen, tDirt, tPav; uniform float uCal;\n${GLSL_NUBES}\n` + sh.fragmentShader.replace('#include <map_fragment>', `
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
      diffuseColor.rgb = col * nubes(vWP);`);
  };
  mat.customProgramCacheKey = () => 'q1k-suelo';
  const malla = new THREE.Mesh(geo, mat); malla.receiveShadow = true;
  return { malla,
    /* repinta lo construido sobre el terreno base */
    pintar(E) { const fb = E.edificios.map(e => e.tipo === 'granja' ? (e.obra ? 'o' : e.ruina ? 'r' : 'g') : '').join('') + '|' + E.vias.length + '|' + E.vias.filter(v => v.emp).length + '|' + E.muralla.fase + '|' + !!E.foro, basto = fb !== this.fb; this.fb = fb;
      for (const J of basto ? [Cj, Pj] : [Cj]) { for (const [g, b] of [[J.M, J.bM], [J.T, J.bT]]) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'copy'; g.drawImage(b, 0, 0); g.globalCompositeOperation = 'source-over'; } J.pon(); pintarCiudad(J.M, J.T, E, J.fino); J.m.needsUpdate = J.t.needsUpdate = true; } },
    /* notas (Float32Array N_CALOR²) o null para apagar */
    calor(notas) { if (!notas) { uCal.value = 0; return; } const im = cg.createImageData(N_CALOR, N_CALOR), d = im.data;
      for (let i = 0; i < notas.length; i++) { const n = notas[i], o = i * 4; if (n <= -99) { d[o + 3] = 0; continue; } const c = n >= 3 ? [70, 170, 60] : n >= 0 ? [215, 165, 50] : [190, 50, 36]; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = n >= 3 ? 150 : n >= 0 ? 95 : n <= -9 ? 100 : 135; }
      cg.putImageData(im, 0, 0); tCal.needsUpdate = true; uCal.value = 1; } };
}
