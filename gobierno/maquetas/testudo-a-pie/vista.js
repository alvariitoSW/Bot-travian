/* Maqueta GM43 «Testudo a pie»: un manípulo de hastati cruza el campo bajo las flechas, visto a pie, pegado a la espalda de la primera fila.
   Idea de cámara tomada de Ryse: Son of Rome (solo la idea; nada de su arte ni de su código).
   Soldados: arte de 0 A.D. (Wildfire Games, CC BY-SA 3.0), con js/gfx/units.js. Los escudos del testudo, las flechas, los pila,
   el suelo y la hierba se hacen aquí por código. No toca nada de js/: solo lo importa.
   Licencia de juego ya aprobada: el testudo en campo abierto.
   ?fase=avance|flechas|testudo|pila|final coloca la escena en ese momento y la congela (para las capturas). */
import { THREE } from '../../../js/gfx/models.js';
import { preload, getUnit, unitMaterialReal, instancedGeometry, frameOf, frameOnce, UNIT_SCALE } from '../../../js/gfx/units.js';
import { crearCielo, texturaRuido } from '../../../js/gfx/ground.js';

const Q = new URLSearchParams(location.search), FASE = Q.get('fase');
const $ = id => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t, suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let semilla = 43; const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };

/* ---------- números de la maqueta ---------- */
const FILES = 6, FILAS = 5, M = FILES * FILAS;
const Z_TIRADORES = -100, Z_GALOS = -106, Z_PILA = -75, Z_CHOQUE = -104.2;
const V_PASO = 1.8, V_TESTUDO = 0.9, V_CARGA = 5.5, VUELO = 2.2, CADA = 8;
const ABIERTO = { dx: 1.25, dz: 2.3 }, CERRADO = { dx: 0.62, dz: 1.0 };
const TECHO = 1.68, MURO = 0.775, HUECO = 0, BAJA = 0.2;   /* BAJA: en testudo la figura se agacha y baja, para que el penacho no pase el techo */
const YO = 3;   /* en testudo, la cámara es el hombre 3 (primera fila, cuarto por la izquierda): se oculta su figura y quedan sus escudos */

/* el terreno: llano con algo de ondulación y una loma al fondo */
const H = (x, z) => 3.4 * suave(-70, -103, z) * (1 + 0.06 * Math.sin(x * 0.07)) + 0.22 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(z * 0.045 + 1.3) + 0.6 * suave(30, 90, Math.abs(x)) * Math.sin(z * 0.03);

/* ---------- motor ---------- */
const lienzo = $('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const HORIZ = '#c8c0a6';
const escena = new THREE.Scene(); escena.background = new THREE.Color(HORIZ); escena.fog = new THREE.Fog(HORIZ, 45, 380);
const camara = new THREE.PerspectiveCamera(55, 1, 0.06, 12000); camara.rotation.order = 'YXZ';
const SOL = new THREE.Vector3(-0.45, 0.5, 0.75).normalize();
escena.add(new THREE.HemisphereLight(0xe4e8ee, 0x6a5636, 1.25));
const luz = new THREE.DirectionalLight(0xffeccc, 2.1); luz.position.copy(SOL).multiplyScalar(100); escena.add(luz);
/* luz cálida bajo el testudo: el techo y el escudo de delante se ven de madera, no negros */
const dentro = new THREE.PointLight(0xffd6a0, 0, 3.2, 1.2); escena.add(dentro);
const U = { uRuido: { value: texturaRuido() } };
escena.add(crearCielo(SOL.clone().setY(0.25), HORIZ, U));
let vertical = false;
function medir() {
  const w = innerWidth, h = innerHeight; vertical = h > w;
  renderer.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix();
}
addEventListener('resize', medir); medir();

/* ---------- lienzos pintados por código ---------- */
function lienzoTex(w, h, pinta, repetir) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
/* hierba: base clara (el color lo pone el vértice) con trazos */
const texHierba = lienzoTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b9b9a6'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { const x = azar() * w, y = azar() * h, l = 3 + azar() * 7, v = azar(); g.strokeStyle = v < 0.5 ? `rgba(70,80,40,${0.25 + v * 0.4})` : `rgba(235,228,190,${(v - 0.5) * 0.5})`; g.lineWidth = 1 + azar(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (azar() - 0.5) * 3, y - l); g.stroke(); }
}, true);
texHierba.repeat.set(150, 150);
/* mata de hierba con alfa */
const texMata = lienzoTex(128, 96, (g, w, h) => {
  for (let i = 0; i < 46; i++) { const x = 10 + azar() * (w - 20), a = (azar() - 0.5) * 0.7, l = h * (0.45 + azar() * 0.55), v = azar(); g.strokeStyle = `rgb(${150 + v * 60 | 0},${165 + v * 50 | 0},${70 + v * 40 | 0})`; g.lineWidth = 3 + azar() * 2.5; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + a * 20, h - l * 0.6, x + a * l, h - l); g.stroke(); }
});
texMata.generateMipmaps = false; texMata.minFilter = THREE.LinearFilter;
/* escudo del testudo: ovalado (scutum republicano), rojo oscuro, borde y umbo de bronce, espina central y un motivo propio de ondas */
const texEscudo = lienzoTex(256, 448, (g, w, h) => {
  const cx = w / 2, cy = h / 2, rx = w / 2 - 4, ry = h / 2 - 4;
  g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.clip();
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#4e100c'); gr.addColorStop(0.5, '#86211a'); gr.addColorStop(1, '#4a0f0b');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${azar() < 0.5 ? '0,0,0' : '255,220,190'},${azar() * 0.07})`; g.fillRect(azar() * w, azar() * h, 2 + azar() * 6, 1 + azar() * 3); }
  g.strokeStyle = '#d6a440'; g.lineWidth = 7;
  for (const s of [-1, 1]) { g.beginPath(); for (let k = 0; k <= 30; k++) { const y = cy + s * (60 + k * 4.5), x = cx + Math.sin(k * 0.6) * 46; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  g.fillStyle = '#9a6b28'; g.fillRect(cx - 9, 0, 18, h); g.fillStyle = 'rgba(255,230,160,.35)'; g.fillRect(cx - 9, 0, 5, h);
  g.restore();
  g.lineWidth = 9; g.strokeStyle = '#b8862b'; g.beginPath(); g.ellipse(cx, cy, rx - 4, ry - 4, 0, 0, Math.PI * 2); g.stroke();
  const um = g.createRadialGradient(cx - 10, cy - 12, 4, cx, cy, 42); um.addColorStop(0, '#ffe3a0'); um.addColorStop(0.45, '#c08a34'); um.addColorStop(1, '#5c3a12');
  g.fillStyle = um; g.beginPath(); g.ellipse(cx, cy, 36, 44, 0, 0, Math.PI * 2); g.fill();
});
/* el escudo por dentro: tablas verticales, borde de cuero, travesaño con asa, remaches y el hueco del umbo */
const texDentro = lienzoTex(256, 448, (g, w, h) => {
  const cx = w / 2, cy = h / 2, rx = w / 2 - 4, ry = h / 2 - 4;
  g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.clip();
  const tonos = ['#b88a56', '#a87a48', '#c29662', '#9f7242', '#b58550', '#a77b4a', '#bd8f5b'];
  for (let i = 0; i < 7; i++) { const x0 = i * w / 7; g.fillStyle = tonos[i]; g.fillRect(x0, 0, w / 7 + 1, h);
    for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(70,40,15,${0.12 + azar() * 0.18})`; g.lineWidth = 1; g.beginPath(); const xx = x0 + 3 + azar() * (w / 7 - 6); g.moveTo(xx, 0); g.bezierCurveTo(xx + 3, h * 0.3, xx - 3, h * 0.6, xx + 2, h); g.stroke(); }
    g.fillStyle = 'rgba(40,22,8,.85)'; g.fillRect(x0 - 1.5, 0, 3, h); }
  g.fillStyle = '#6e4826'; g.fillRect(0, cy - 22, w, 44); g.fillStyle = 'rgba(255,220,170,.18)'; g.fillRect(0, cy - 22, w, 6); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, cy + 18, w, 4);
  g.fillStyle = '#2c1a0e'; g.beginPath(); g.ellipse(cx, cy, 34, 40, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3b2414'; g.fillRect(cx - 46, cy - 9, 92, 18); g.fillStyle = 'rgba(255,220,170,.22)'; g.fillRect(cx - 46, cy - 9, 92, 4);
  g.restore();
  g.lineWidth = 12; g.strokeStyle = '#4a2e18'; g.beginPath(); g.ellipse(cx, cy, rx - 6, ry - 6, 0, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 3; g.strokeStyle = '#b8862b'; g.beginPath(); g.ellipse(cx, cy, rx - 1.5, ry - 1.5, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#d6a440';
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * (rx - 7), cy + Math.sin(a) * (ry - 7), 3, 0, 7); g.fill(); }
  for (const x of [14, 60, w - 60, w - 14]) { g.beginPath(); g.arc(x, cy, 3.5, 0, 7); g.fill(); }
});
const sprite = (pinta) => lienzoTex(64, 64, pinta);
const texLlama = sprite((g) => { const r = g.createRadialGradient(32, 36, 2, 32, 32, 30); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.3, 'rgba(255,170,40,.9)'); r.addColorStop(1, 'rgba(200,40,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const texChispa = sprite((g) => { g.translate(32, 32); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); const l = i % 2 ? 14 : 28; const r = g.createLinearGradient(0, 0, l, 0); r.addColorStop(0, 'rgba(255,255,220,1)'); r.addColorStop(1, 'rgba(255,190,60,0)'); g.fillStyle = r; g.fillRect(0, -1.5, l, 3); } });
const texPolvo = sprite((g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, 'rgba(170,150,115,.75)'); r.addColorStop(1, 'rgba(150,130,100,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });

/* ---------- suelo ---------- */
{
  const g = new THREE.PlaneGeometry(700, 700, 175, 175); g.rotateX(-Math.PI / 2); g.translate(0, 0, -80);
  const p = g.attributes.position, col = [], c = new THREE.Color(), verde = new THREE.Color('#6f8a3c'), seco = new THREE.Color('#a99d5a'), oscuro = new THREE.Color('#4d6a2f');
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); p.setY(i, H(x, z));
    const n = Math.sin(x * 0.09 + Math.sin(z * 0.05) * 2) * Math.sin(z * 0.08 - x * 0.03) + 0.5 * Math.sin(x * 0.31 + z * 0.23);
    c.copy(verde).lerp(seco, suave(0.1, 0.9, n)).lerp(oscuro, suave(-0.3, -1.0, n) * 0.8); col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
  escena.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: texHierba, vertexColors: true })));
  /* matas de hierba cerca de la marcha: dan suelo a la cámara baja */
  const mg = new THREE.PlaneGeometry(0.7, 0.42); mg.translate(0, 0.2, 0);
  const m2 = mg.clone().rotateY(Math.PI / 2); const pos = [...mg.attributes.position.array, ...m2.attributes.position.array], uv = [...mg.attributes.uv.array, ...m2.attributes.uv.array];
  const cruz = new THREE.BufferGeometry(); cruz.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cruz.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); cruz.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, i) => i % 3 === 1 ? 1 : 0), 3)); cruz.setIndex([0, 2, 1, 2, 3, 1, 4, 6, 5, 6, 7, 5]);
  const N = 3200, matas = new THREE.InstancedMesh(cruz, new THREE.MeshBasicMaterial({ map: texMata, alphaTest: 0.4, side: THREE.DoubleSide }), N), o = new THREE.Object3D();
  for (let i = 0; i < N; i++) { const x = (azar() - 0.5) * 50, z = 12 - azar() * 130; o.position.set(x, H(x, z) - 0.03, z); o.rotation.y = azar() * 3; const t = 0.5 + azar() * 1.1; o.scale.set(t * (0.7 + azar() * 0.6), t * (0.6 + azar() * 0.8), t); o.updateMatrix(); matas.setMatrixAt(i, o.matrix); matas.setColorAt(i, new THREE.Color().setHSL(0.17 + azar() * 0.08, 0.3 + azar() * 0.25, 0.3 + azar() * 0.2)); }
  matas.frustumCulled = false; escena.add(matas);
}

/* ---------- piezas: escudos del testudo, flechas, pila, chispas ---------- */
const geoEscudo = (() => {
  const g = new THREE.PlaneGeometry(0.66, 1.15, 12, 2), p = g.attributes.position, R = 0.46;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), a = x / R; p.setX(i, R * Math.sin(a)); p.setZ(i, R * (Math.cos(a) - 1)); }
  g.computeVertexNormals(); return g;
})();
const matEscudo = new THREE.MeshLambertMaterial({ map: texEscudo, alphaTest: 0.5, side: THREE.DoubleSide });
/* por dentro el escudo es madera y cuero: oscuro */
matEscudo.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb = texture2D(tDentro, vMapUv).rgb;').replace('void main() {', 'uniform sampler2D tDentro;\nvoid main() {'); sh.uniforms.tDentro = { value: texDentro }; };
const NESC = M * 2 + FILAS * 2, escudos = new THREE.InstancedMesh(geoEscudo, matEscudo, NESC); escudos.frustumCulled = false; escena.add(escudos);

const geoFlecha = new THREE.CylinderGeometry(0.02, 0.022, 1.45, 5, 1); geoFlecha.rotateX(Math.PI / 2);
const NFL = 260, flechas = new THREE.InstancedMesh(geoFlecha, new THREE.MeshLambertMaterial({ color: 0x3a2a18 }), NFL); flechas.frustumCulled = false; escena.add(flechas);
const FL = []; for (let i = 0; i < NFL; i++) FL.push({ est: 0 });

function nuevoSprite(tex, aditivo) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending })); s.visible = false; escena.add(s); return s; }
const LLAMAS = Array.from({ length: 30 }, () => nuevoSprite(texLlama, true));
const CHISPAS = Array.from({ length: 40 }, () => ({ s: nuevoSprite(texChispa, true), t: -9 }));
const POLVO = Array.from({ length: 36 }, () => ({ s: nuevoSprite(texPolvo, false), t: -9, v: new THREE.Vector3() }));

function nuevoPilum() {
  const g = new THREE.Group();
  const asta = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.3, 5), new THREE.MeshLambertMaterial({ color: 0x6b4a2a })); asta.rotation.x = Math.PI / 2; asta.position.z = -0.45;
  const hierro = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.75, 4), new THREE.MeshLambertMaterial({ color: 0x8a8a88 })); hierro.rotation.x = Math.PI / 2; hierro.position.z = 0.55;
  g.add(asta, hierro); g.visible = false; escena.add(g); return g;
}
const PILA = Array.from({ length: FILES * 2 }, () => ({ g: nuevoPilum(), est: 0 }));

/* ---------- estado de la partida ---------- */
const S = {};
function reinicia() {
  semilla = 43;
  Object.assign(S, { T: 0, zF: 0, k: 0, escudos: false, andando: false, fase: 'avance', proxima: 4, aviso: false, impacto: -1, paso: 0, tCinta: 0, tFin: -1, choque: false, llegaron: 0, sacude: 0, vel: 0 });
  S.romanos = []; for (let i = 0; i < M; i++) S.romanos.push({ f: i % FILES, r: Math.floor(i / FILES), vivo: true, muere: 0, lanza: -9, x: 0, z: 0, jx: (azar() - 0.5) * 0.18, jz: (azar() - 0.5) * 0.22, fase: azar() * 2 });
  S.tiradores = []; for (let i = 0; i < 10; i++) S.tiradores.push({ x: (i - 4.5) * 1.7 + (azar() - 0.5) * 0.5, z: Z_TIRADORES + (azar() - 0.5) * 1.2, vivo: true, muere: 0, huye: false, yaw: 0, fase: azar() * 4 });
  S.galos = []; for (let i = 0; i < 16; i++) S.galos.push({ x: ((i % 8) - 3.5) * 1.25 + (azar() - 0.5) * 0.3, z: Z_GALOS - Math.floor(i / 8) * 1.6 + (azar() - 0.5) * 0.4, vivo: true, muere: 0, fila: Math.floor(i / 8), fase: azar() * 3 });
  for (const f of FL) f.est = 0; for (const p of PILA) { p.est = 0; p.g.visible = false; }
  for (const c of CHISPAS) c.t = -9; for (const p of POLVO) p.t = -9;
  $('fin').hidden = true; $('accion').hidden = true; cinta('', false);
}
const vivos = () => S.romanos.filter(h => h.vivo).length;

/* sitio de un hombre (sin vida propia: depende de dónde va el frente y de lo cerrado del testudo) */
function sitio(h) {
  if (!h.vivo) return;
  const k = S.k, dx = lerp(ABIERTO.dx, CERRADO.dx, k), dz = lerp(ABIERTO.dz, CERRADO.dz, k);
  h.x = (h.f - (FILES - 1) / 2) * dx + h.jx * (1 - k) + (h.r === 0 && (h.f === 2 || h.f === 3) ? (h.f === 2 ? -1 : 1) * HUECO * k : 0); h.z = S.zF + h.r * dz + h.jz * (1 - k);
}

/* ---------- avisos ---------- */
function cinta(texto, buena) { const c = $('cinta'); c.textContent = texto; c.classList.toggle('ve', !!texto); c.classList.toggle('buena', !!buena); S.tCinta = texto ? S.T : 0; }

/* ---------- sonido sintetizado (WebAudio, sin archivos) ---------- */
let audio = null;
function ruido(dur, frec, vol, tipo) {
  if (!audio) return; const n = Math.floor(audio.sampleRate * dur), b = audio.createBuffer(1, n, audio.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  const s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain(); s.buffer = b; f.type = tipo || 'lowpass'; f.frequency.value = frec; g.gain.value = vol;
  s.connect(f).connect(g).connect(audio.destination); s.start();
}
addEventListener('pointerdown', () => { if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; } } }, { once: true });

/* ---------- descargas enemigas ---------- */
function descarga() {
  const tir = S.tiradores.filter(t => t.vivo && !t.huye); if (!tir.length) return;
  const v = S.andando ? (S.escudos ? V_TESTUDO : V_PASO) : 0, zPrev = Math.max(Z_PILA, S.zF - v * VUELO), vivosR = S.romanos.filter(h => h.vivo);
  let n = 0;
  for (const f of FL) {
    if (f.est !== 0 || n >= 34) continue; n++;
    const t = tir[n % tir.length], sale = S.T + azar() * 0.35;
    f.p0 = new THREE.Vector3(t.x + (azar() - 0.5) * 0.6, H(t.x, t.z) + 1.7, t.z);
    f.fijo = n <= 5;
    if (n <= 3) { const x = (YO + (n % 2 ? -1 : 1) - (FILES - 1) / 2) * CERRADO.dx + (azar() - 0.5) * 0.3, z = zPrev - 0.1 + (azar() - 0.5) * 0.5; f.p1 = new THREE.Vector3(x, H(x, z) + TECHO + 0.05, z); f.blanco = true; f.muro = false; }
    else if (n <= 5) { const x = (YO - (FILES - 1) / 2) * CERRADO.dx + (n === 4 ? -0.27 : 0.25) + (azar() - 0.5) * 0.06, z = zPrev - 0.5; f.p1 = new THREE.Vector3(x, H(x, z) + MURO + 0.35, z); f.blanco = true; f.muro = true; }
    else if (n % 10 < 7 && vivosR.length) {
      const h = vivosR[Math.floor(azar() * vivosR.length)], dz = lerp(ABIERTO.dz, CERRADO.dz, 1);
      const x = (h.f - (FILES - 1) / 2) * CERRADO.dx + (azar() - 0.5) * 0.5, z = zPrev + h.r * dz + (azar() - 0.5) * 0.7;
      f.muro = azar() < 0.3; f.blanco = true;
      if (f.muro) { const x2 = ((n % FILES) - (FILES - 1) / 2) * CERRADO.dx + (azar() - 0.5) * 0.3, z2 = zPrev - 0.5; f.p1 = new THREE.Vector3(x2, H(x2, z2) + MURO + 0.25, z2); }
      else f.p1 = new THREE.Vector3(x, H(x, z) + TECHO + 0.05, z);
    } else {
      const x = (azar() - 0.5) * 16, z = zPrev - 6 + azar() * 16; f.p1 = new THREE.Vector3(x, H(x, z) + 0.3, z); f.blanco = false;
    }
    f.t0 = sale; f.dur = VUELO + (azar() - 0.5) * 0.3; f.alto = 0.12 * f.p0.distanceTo(f.p1) + 4; f.fuego = false; f.est = 1; f.q = new THREE.Quaternion(); f.p = f.p0.clone();
  }
  S.impacto = S.T + VUELO; for (const t of tir) t.tira = S.T;
}
/* los hombres que caen cuando llegan las flechas sin escudos */
function bajas(n) {
  const cand = S.romanos.filter((h, i) => h.vivo && Math.abs(i - YO) > 1).sort((a, b) => (a.r + azar() * 2.5) - (b.r + azar() * 2.5));
  for (let i = 0; i < n && i < cand.length; i++) { const h = cand[i]; h.vivo = false; h.muere = S.T + azar() * 0.25; }
}
function llegaDescarga() {
  S.impacto = -1;
  if (S.k > 0.7) { cinta('¡Aguantan! Los venablos no pasan', true); ruido(0.25, 300, 0.6); S.sacude = 0.25; }
  else { const n = S.k > 0.3 ? 1 : 2 + Math.floor(azar() * 3); bajas(n); cinta(`¡Sin escudos! Caen ${n} hombres`, false); ruido(0.3, 900, 0.5, 'bandpass'); }
}
function chispa(p) { const c = CHISPAS.find(c => S.T - c.t > 0.3); if (!c) return; c.t = S.T; c.s.position.copy(p); c.s.visible = true; const q = POLVO.find(q => S.T - q.t > 3); if (q) { q.t = S.T; q.e = 0.25; q.s.position.copy(p); } }

/* ---------- órdenes ---------- */
function lanzarPila() {
  if (S.fase !== 'pila') return; S.fase = 'lanzando'; S.escudos = false; cinta('¡Pila!', true);
  const blancos = S.tiradores.filter(t => t.vivo); let k = 0;
  for (const h of S.romanos) {
    if (!h.vivo || h.r > 1) continue; h.lanza = S.T + h.r * 0.25 + azar() * 0.1;
    const p = PILA[k++]; if (!p) break; const b = blancos[(k * 3) % Math.max(1, blancos.length)];
    p.est = 1; p.t0 = h.lanza + 0.35; p.dur = 1.3 + azar() * 0.2; p.p0 = new THREE.Vector3(h.x + 0.2, H(h.x, h.z) + 1.9, h.z - 0.3);
    const bx = b ? b.x + (azar() - 0.5) * 0.6 : (azar() - 0.5) * 8, bz = b ? b.z + (azar() - 0.5) * 0.6 : Z_TIRADORES;
    p.p1 = new THREE.Vector3(bx, H(bx, bz) + 0.5, bz); p.blanco = b; p.alto = 2.6 + azar() * 1.2;
  }
  S.tFin = S.T + 2.4;
}
function cargar() {
  if (S.fase !== 'cargar') return; S.fase = 'carga'; S.escudos = false; cinta('¡Cargad!', true); ruido(0.6, 180, 0.7);
}

/* ---------- el paso de la simulación ---------- */
const V3 = new THREE.Vector3();
function paso(dt) {
  S.T += dt; const T = S.T;
  S.k += Math.sign((S.escudos ? 1 : 0) - S.k) * Math.min(Math.abs((S.escudos ? 1 : 0) - S.k), dt * 2);
  /* marcha */
  let v = 0;
  if (S.fase === 'avance' && S.andando) v = lerp(V_PASO, V_TESTUDO, S.k);
  if (S.fase === 'carga' && !S.choque) v = V_CARGA;
  S.vel = v; S.zF -= v * dt; S.paso += v * dt;
  if (S.fase === 'avance' && S.zF <= Z_PILA) { S.zF = Z_PILA; S.fase = 'pila'; S.andando = false; cinta('¡A tiro de pilum! Lanza', true); }
  if (S.fase === 'carga' && S.zF <= Z_CHOQUE && !S.choque) {
    S.zF = Z_CHOQUE; S.choque = true; S.llegaron = vivos(); S.sacude = 0.9; ruido(0.9, 1400, 0.9, 'bandpass'); ruido(0.6, 160, 1);
    for (const p of POLVO) { p.e = 1; p.t = T + azar() * 0.4; const x = (azar() - 0.5) * 8; p.s.position.set(x, H(x, Z_CHOQUE) + 0.4 + azar() * 0.6, Z_CHOQUE - 1 - azar() * 2.5); p.v.set((azar() - 0.5) * 1.5, 0.6 + azar() * 0.6, (azar() - 0.5) * 1.5); }
    S.galos.filter(g => g.fila === 0).slice(0, 8).forEach((g, i) => { if (i % 3 === 1) { g.vivo = false; g.muere = T + 0.2 + azar() * 0.6; } });
    S.tFin = T + 1.8;
  }
  if (S.fase === 'carga' && S.choque && T >= S.tFin) { S.fase = 'fin'; muestraFin(); }
  if (S.fase === 'lanzando' && T >= S.tFin) { S.fase = 'cargar'; cinta('Los tiradores huyen. ¡Carga!', true); }
  for (const h of S.romanos) sitio(h);
  /* descargas: aviso 1,2 s antes de soltar */
  if (S.fase === 'avance') {
    if (!S.aviso && T >= S.proxima - 1.2) { S.aviso = true; cinta('¡Venablos! Escudos arriba', false); }
    if (T >= S.proxima) { S.aviso = false; S.proxima = T + CADA; descarga(); }
  }
  if (S.impacto > 0 && T >= S.impacto) llegaDescarga();
  if (S.tCinta && T - S.tCinta > 2.6 && !(S.aviso || S.impacto > 0)) cinta('', false);
  /* flechas */
  for (const f of FL) {
    if (f.est !== 1 || T < f.t0) continue;
    const s = (T - f.t0) / f.dur;
    if (s >= 1) {
      if (f.blanco && S.k > 0.7) {
        let mejor = null, d = 9; for (const h of S.romanos) if (h.vivo) { const e = Math.hypot(h.x - f.p1.x, h.z - f.p1.z); if (e < d) { d = e; mejor = h; } }
        if (mejor && d > 0.9) { f.est = 3; f.p.set(f.p1.x, H(f.p1.x, f.p1.z) + 0.5, f.p1.z); }
        else if (mejor) { f.est = 2; f.h = mejor; f.rel = new THREE.Vector3(f.p1.x - mejor.x, f.muro ? MURO + 0.35 : TECHO + 0.16, f.p1.z - mejor.z); if (f.muro) f.rel.add(V3.set(0, 0, 1).applyQuaternion(f.q).multiplyScalar(-0.64)); if (!f.fijo && azar() < 0.6) { f.est = 0; } chispa(f.p1); ruido(0.12, 260, 0.25); }
        else f.est = 0;
      } else if (f.blanco) { f.est = 3; f.p.set(f.p1.x, H(f.p1.x, f.p1.z) + 0.3, f.p1.z); }
      else { f.est = 3; f.p.copy(f.p1); }
      continue;
    }
    f.p.lerpVectors(f.p0, f.p1, s); f.p.y += f.alto * 4 * s * (1 - s);
    V3.subVectors(f.p1, f.p0); V3.y += f.alto * 4 * (1 - 2 * s); f.q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), V3.normalize());
  }
  /* pila */
  for (const p of PILA) {
    if (p.est !== 1 || T < p.t0) continue;
    const s = (T - p.t0) / p.dur;
    if (s >= 1) { p.est = 2; if (p.blanco && p.blanco.vivo) { p.blanco.vivo = false; p.blanco.muere = T; } continue; }
    p.g.position.lerpVectors(p.p0, p.p1, s); p.g.position.y += p.alto * 4 * s * (1 - s);
    V3.subVectors(p.p1, p.p0); V3.y += p.alto * 4 * (1 - 2 * s); p.g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), V3.normalize());
  }
  /* los tiradores que quedan huyen tras los pila */
  if (S.fase === 'cargar' || S.fase === 'carga' || S.fase === 'fin') for (const t of S.tiradores) if (t.vivo) { t.huye = true; if (t.z > -122) t.z -= 4 * dt; }
  S.sacude = Math.max(0, S.sacude - dt);
}

/* ---------- dibujo ---------- */
const figuras = {};
function malla(tipo, n, color) {
  const u = getUnit(tipo), g = instancedGeometry(u, n), m = new THREE.InstancedMesh(g, unitMaterialReal(u, color), n);
  m.frustumCulled = false; escena.add(m); figuras[tipo] = { m, u, fr: g.attributes.aFrame }; return figuras[tipo];
}
const O = new THREE.Object3D(), QA = new THREE.Quaternion(), QB = new THREE.Quaternion(), PA = new THREE.Vector3(), PB = new THREE.Vector3(), CERO = new THREE.Matrix4().makeScale(0, 0, 0);
const giroY = a => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
const Q_FRENTE = giroY(Math.PI), Q_IZQ = giroY(-Math.PI / 2), Q_DER = giroY(Math.PI / 2);
const Q_TECHO = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2 - 0.12);
function pon(fig, i, x, y, z, yaw, frame, agacha) {
  O.position.set(x, y, z); O.rotation.set(0, yaw, 0); O.scale.set(UNIT_SCALE, UNIT_SCALE * (1 - agacha), UNIT_SCALE); O.updateMatrix();
  fig.m.setMatrixAt(i, O.matrix); fig.fr.array[i] = frame;
}
function dibuja() {
  const T = S.T, R = figuras.hastati, C = R.u.clips, k = S.k;
  /* romanos */
  S.romanos.forEach((h, i) => {
    let fr;
    if (!h.vivo) fr = frameOnce(C.death, Math.max(0, T - h.muere));
    else if (T >= h.lanza && T - h.lanza < 1) fr = frameOnce(C.attack_melee, T - h.lanza);
    else if (S.fase === 'carga' && !S.choque) fr = frameOf(C.run, T + h.fase);
    else if (S.choque && h.r === 0) fr = frameOf(C.attack_melee, T + h.fase);
    else if (S.vel > 0) fr = frameOf(C.walk, S.paso / lerp(V_PASO, V_TESTUDO * 1.4, k) + h.fase);
    else fr = frameOf(C.idle, T + h.fase);
    if (!h.vivo && !h.fijo) { h.fijo = true; }
    pon(R, i, h.x, H(h.x, h.z) - 0.03 - (h.vivo ? BAJA * k : 0), h.z, Math.PI, fr, h.vivo ? 0.15 * k : 0);
    if (i === YO && k > 0.6) R.m.setMatrixAt(i, CERO);
  });
  R.m.instanceMatrix.needsUpdate = true; R.fr.needsUpdate = true;
  /* escudos del testudo: suben y bajan en medio segundo */
  let e = 0;
  const escudo = (h, ox, oy, oz, q) => {
    if (!h.vivo || k < 0.02) { escudos.setMatrixAt(e++, CERO); return; }
    const y0 = H(h.x, h.z);
    PA.set(h.x - 0.32, y0 + 0.85, h.z - 0.3); PB.set(h.x + ox, y0 + oy, h.z + oz); PA.lerp(PB, k);
    QA.copy(Q_FRENTE).slerp(q, k); O.position.copy(PA); O.quaternion.copy(QA); O.scale.setScalar(1); O.updateMatrix(); escudos.setMatrixAt(e++, O.matrix);
  };
  for (const h of S.romanos) escudo(h, 0, TECHO + h.r * 0.035, -0.05, Q_TECHO);
  for (const h of S.romanos) { if (h.r === 0) escudo(h, h.f === 2 ? HUECO * k : h.f === 3 ? -HUECO * k : 0, MURO, -0.45, Q_FRENTE); else escudos.setMatrixAt(e++, CERO); }
  for (const h of S.romanos) { if (h.f === 0) escudo(h, -0.36, 0.8, 0, Q_IZQ); if (h.f === FILES - 1) escudo(h, 0.36, 0.8, 0, Q_DER); }
  escudos.count = e; escudos.instanceMatrix.needsUpdate = true;
  /* enemigos */
  const P = figuras.peltastas, CP = P.u.clips;
  S.tiradores.forEach((t, i) => {
    let fr, yaw = 0;
    if (!t.vivo) fr = frameOnce(CP.death, Math.max(0, T - t.muere));
    else if (t.huye) { fr = frameOf(CP.run, T + t.fase); yaw = Math.PI; }
    else if (t.tira !== undefined && T - t.tira < 2.4 && T - t.tira > -1.5) fr = frameOnce(CP.attack_ranged, (T - t.tira + 1.5) * 1.3);
    else fr = frameOf(CP.idle, T + t.fase);
    pon(P, i, t.x, H(t.x, t.z), t.z, yaw, fr, 0);
  });
  P.m.instanceMatrix.needsUpdate = true; P.fr.needsUpdate = true;
  const G = figuras.galos, CG = G.u.clips;
  S.galos.forEach((g, i) => {
    const fr = !g.vivo ? frameOnce(CG.death, Math.max(0, T - g.muere)) : S.choque && g.fila === 0 ? frameOf(CG.attack_melee, T + g.fase) : frameOf(CG.idle, T + g.fase);
    pon(G, i, g.x, H(g.x, g.z), g.z, 0, fr, 0);
  });
  G.m.instanceMatrix.needsUpdate = true; G.fr.needsUpdate = true;
  /* flechas y llamas */
  let nl = 0;
  FL.forEach((f, i) => {
    if (f.est === 0 || (f.est === 1 && T < f.t0) || (f.est === 2 && !f.h.vivo)) { flechas.setMatrixAt(i, CERO); return; }
    if (f.est === 2) f.p.set(f.h.x + f.rel.x, H(f.h.x, f.h.z) + f.rel.y - 0.2 * (1 - k), f.h.z + f.rel.z);
    O.position.copy(f.p); O.quaternion.copy(f.q); if (f.est === 1) O.scale.set(2, 2, 1.3); else O.scale.setScalar(1); O.updateMatrix(); flechas.setMatrixAt(i, O.matrix);
    if (f.fuego && f.est === 1 && nl < LLAMAS.length) { const l = LLAMAS[nl++]; l.visible = true; V3.set(0, 0, 0.5).applyQuaternion(f.q); l.position.copy(f.p).add(V3); l.scale.setScalar(1.1 + 0.25 * Math.sin(T * 40 + i)); }
  });
  for (; nl < LLAMAS.length; nl++) LLAMAS[nl].visible = false;
  flechas.instanceMatrix.needsUpdate = true;
  for (const c of CHISPAS) { const a = T - c.t; c.s.visible = a >= 0 && a < 0.25; if (c.s.visible) { c.s.scale.setScalar(0.5 + a * 4); c.s.material.opacity = 1 - a / 0.25; } }
  for (const p of POLVO) { const a = T - p.t; p.s.visible = a >= 0 && a < 3; if (p.s.visible) { const e = p.e || 1; p.s.scale.setScalar(e * (1.2 + a * 1.6)); p.s.material.opacity = 0.85 * (1 - a / 3) * (e < 1 ? Math.max(0, 1 - a) : 1); } }
  for (const p of PILA) p.g.visible = p.est === 1 ? T >= p.t0 : p.est === 2;
  /* la cámara: a pie, entre la fila 1 y la 2, al hombro */
  const zc = S.zF + lerp(2.0, 0.5, k), andar = S.vel > 0 ? 1 : 0, ph = S.paso / 0.85 * Math.PI;
  let cy = H(0, zc) + lerp(2.2, 1.45, k) + Math.abs(Math.sin(ph)) * 0.05 * andar, cx = Math.sin(ph) * 0.03 * andar + 0.5 * CERRADO.dx * k;
  const sac = S.fase === 'carga' && !S.choque ? 0.06 : 0; const golpe = S.sacude * 0.12;
  cx += (Math.random() - 0.5) * (sac + golpe); cy += (Math.random() - 0.5) * (sac + golpe);
  camara.position.set(cx, cy, zc); dentro.position.set(cx, cy + 0.05, zc - 0.45); dentro.intensity = 3 * k;
  const fov = vertical ? lerp(76, 80, k) : lerp(62, 66, k); if (camara.fov !== fov) { camara.fov = fov; camara.updateProjectionMatrix(); }
  const dist = Math.max(8, zc - Z_TIRADORES), sube = Math.atan2(H(0, Z_TIRADORES) + 1.2 - cy, dist);
  camara.rotation.set(lerp(vertical ? -0.1 : -0.06, vertical ? -0.14 : 0, k) + sube * 0.6 * (1 - k) + Math.sin(ph * 2) * 0.006 * andar, Math.sin(ph) * 0.004 * andar, 0);
  camara.updateMatrixWorld();
  /* la rendija: oscuro por encima del techo y por debajo del muro */
  $('sombra').classList.toggle('ve', k > 0.5);
  if (k > 0.02) {
    const yF = H(0, S.zF), a = new THREE.Vector3(cx, yF + MURO + 0.56, S.zF - 0.45).project(camara), b = new THREE.Vector3(cx, yF + TECHO - 0.07, S.zF - 0.62).project(camara);
    const ri = Math.max(2, Math.min(95, (a.y + 1) * 50)), rs = Math.max(ri + 4, Math.min(98, (b.y + 1) * 50));
    document.documentElement.style.setProperty('--ri', ri.toFixed(1) + '%'); document.documentElement.style.setProperty('--rs', rs.toFixed(1) + '%');
  }
  renderer.render(escena, camara);
}

/* ---------- interfaz ---------- */
function hud() {
  const n = vivos(), f = n / M, b = $('barra').firstElementChild;
  $('cuenta').textContent = n + '/' + M; b.style.width = (f * 100).toFixed(0) + '%'; b.style.background = f > 0.7 ? 'var(--verde)' : f > 0.45 ? '#e6ac3c' : 'var(--rojo)';
  const av = $('avanzar'), es = $('escudos'), ac = $('accion');
  av.hidden = S.fase !== 'avance'; av.classList.toggle('activa', S.andando);
  es.hidden = !(S.fase === 'avance' || S.fase === 'pila'); es.classList.toggle('activa', S.escudos); es.classList.toggle('pide', S.aviso && !S.escudos);
  $('escudos-t').textContent = S.escudos ? 'Bajar escudos' : 'Escudos';
  ac.hidden = !(S.fase === 'pila' || S.fase === 'cargar'); $('accion-t').textContent = S.fase === 'cargar' ? '¡Cargar!' : 'Lanzar pila';
  ac.classList.toggle('pide', !ac.hidden);
  $('objetivo').textContent = S.fase === 'avance' ? 'Lleva el cuerpo hasta la loma' : S.fase === 'pila' || S.fase === 'lanzando' ? 'Lanza los pila' : 'Carga contra su línea';
}
function muestraFin() {
  const n = S.llegaron; $('fin-t').textContent = n >= M * 0.8 ? '¡Choque!' : n >= M * 0.5 ? 'Llegasteis' : 'Llegasteis a duras penas';
  $('fin-p').textContent = `Llegaron ${n} de ${M} hombres. ` + (n >= M * 0.8 ? 'El testudo aguantó los venablos.' : 'Sube los escudos a tiempo cuando suene el aviso.');
  $('fin').hidden = false;
}
const avanzar = $('avanzar');
avanzar.addEventListener('pointerdown', e => { e.preventDefault(); try { avanzar.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } S.andando = true; });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) avanzar.addEventListener(ev, () => { S.andando = false; });
$('escudos').addEventListener('pointerdown', e => { e.preventDefault(); S.escudos = !S.escudos; ruido(0.18, 220, 0.5); });
$('accion').addEventListener('pointerdown', e => { e.preventDefault(); if (S.fase === 'pila') lanzarPila(); else cargar(); });
$('otra').addEventListener('click', () => { location.href = location.pathname; });
$('salir').addEventListener('click', () => { location.href = document.baseURI; });

/* ---------- fases para las capturas: colocan la escena y la congelan ---------- */
let parado = false;
const salta = s => { for (let t = 0; t < s; t += 1 / 30) paso(1 / 30); };
function prepara(f) {
  if (f === 'avance') { S.zF = -14; S.proxima = 99; S.andando = true; salta(1.3); }
  if (f === 'flechas') { S.zF = -28; S.andando = true; S.proxima = S.T + 1.25; salta(1.25 + 0.8); }
  if (f === 'testudo' || f === 'pila' || f === 'final') {
    S.zF = -30; S.andando = true; S.proxima = S.T + 0.5; salta(3.2);
    S.escudos = true; S.proxima = S.T + 0.6; salta(3.4);
    S.zF = f === 'testudo' ? -50 : S.zF; S.proxima = S.T + 0.5; salta(f === 'testudo' ? 0.5 + 2.25 : 3);
  }
  if (f === 'pila' || f === 'final') { S.zF = Z_PILA + 0.5; salta(1); S.escudos = false; salta(0.6); lanzarPila(); salta(f === 'pila' ? 0.95 : 2.6); }
  if (f === 'final') { cargar(); salta(8); }
  if (f === 'testudo') S.andando = true;
  parado = true;
}

/* ---------- arranque ---------- */
let ultimo = 0;
function bucle(t) {
  const dt = Math.min(0.05, (t - ultimo) / 1000 || 0); ultimo = t;
  if (!parado) paso(dt);
  dibuja(); hud(); requestAnimationFrame(bucle);
}
window.__tp = { lista: false, S, salta: s => salta(s), estado: () => ({ andando: S.andando, fase: S.fase, zF: S.zF, k: S.k, vivos: vivos(), flechas: FL.filter(f => f.est).length }) };
(async () => {
  await preload(['hastati', 'peltastas', 'galos']);
  if (!getUnit('hastati') || !getUnit('peltastas') || !getUnit('galos')) { $('carga').querySelector('p').textContent = 'No se han podido cargar los soldados'; throw new Error('No se han podido cargar los soldados'); }
  malla('hastati', M, '#c23a2e'); malla('peltastas', 10, '#3456a8'); malla('galos', 16, '#3456a8');
  reinicia();
  if (FASE) prepara(FASE);
  $('carga').hidden = true;
  requestAnimationFrame(t => { ultimo = t; bucle(t); });
  setTimeout(() => { window.__tp.lista = true; }, 400);
})();
