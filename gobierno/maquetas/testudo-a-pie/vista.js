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
const V_CORRE = 5, V_PASO = 1.8, V_TESTUDO = 0.9, V_CARGA = 5.5, VUELO = 2.2, CADA = 8;
const ABIERTO = { dx: 1.25, dz: 2.3 }, CERRADO = { dx: 0.62, dz: 1.0 };
const APARTA = 0.14;   /* en testudo, el compañero de tu derecha se aparta un poco: su escudo no entra en la cámara */
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
  const tonos = ['#8a6238', '#7b5630', '#93693e', '#73502c', '#866036', '#7a5532', '#8f663b'];
  for (let i = 0; i < 7; i++) { const x0 = i * w / 7; g.fillStyle = tonos[i]; g.fillRect(x0, 0, w / 7 + 1, h);
    for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(70,40,15,${0.12 + azar() * 0.18})`; g.lineWidth = 1; g.beginPath(); const xx = x0 + 3 + azar() * (w / 7 - 6); g.moveTo(xx, 0); g.bezierCurveTo(xx + 3, h * 0.3, xx - 3, h * 0.6, xx + 2, h); g.stroke(); }
    g.fillStyle = 'rgba(40,22,8,.85)'; g.fillRect(x0 - 1.5, 0, 3, h); }
  for (let i = 0; i < 26; i++) { const m = g.createRadialGradient(0, 0, 1, 0, 0, 8 + azar() * 26); m.addColorStop(0, `rgba(30,16,6,${0.15 + azar() * 0.25})`); m.addColorStop(1, 'rgba(30,16,6,0)'); g.save(); g.translate(azar() * w, azar() * h); g.scale(1, 1.5 + azar() * 2); g.fillStyle = m; g.fillRect(-40, -40, 80, 80); g.restore(); }
  g.fillStyle = '#4e3119'; g.fillRect(0, cy - 22, w, 44); g.fillStyle = 'rgba(255,220,170,.18)'; g.fillRect(0, cy - 22, w, 6); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, cy + 18, w, 4);
  g.fillStyle = '#2c1a0e'; g.beginPath(); g.ellipse(cx, cy, 34, 40, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#3b2414'; g.fillRect(cx - 46, cy - 9, 92, 18); g.fillStyle = 'rgba(255,220,170,.22)'; g.fillRect(cx - 46, cy - 9, 92, 4);
  const sb = g.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.5, cx, cy, ry); sb.addColorStop(0, 'rgba(0,0,0,0)'); sb.addColorStop(0.7, 'rgba(10,5,2,.2)'); sb.addColorStop(1, 'rgba(10,5,2,.65)'); g.fillStyle = sb; g.fillRect(0, 0, w, h);
  g.restore();
  g.lineWidth = 12; g.strokeStyle = '#3a2312'; g.beginPath(); g.ellipse(cx, cy, rx - 6, ry - 6, 0, 0, Math.PI * 2); g.stroke();
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
/* por fuera, rojo y bronce; por dentro, madera (tDentro) */
function matEscudoDe(fuera, dentroTex) {
  const m = new THREE.MeshLambertMaterial({ map: fuera, alphaTest: 0.5, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => { sh.uniforms.tDentro = { value: dentroTex }; sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n if (!gl_FrontFacing) diffuseColor.rgb = texture2D(tDentro, vMapUv).rgb;').replace('void main() {', 'uniform sampler2D tDentro;\nvoid main() {'); };
  return m;
}
const matEscudo = matEscudoDe(texEscudo, texDentro);
/* tu escudo de delante, con su daño: 0 entero, 1 astillas y grieta, 2 grieta grande y un trozo fuera */
function conDanio(tex, estado) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 448; const g = c.getContext('2d'); g.drawImage(tex.image, 0, 0);
  const grieta = (pts, ancho) => { g.strokeStyle = 'rgba(12,6,2,.95)'; g.lineWidth = ancho; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.strokeStyle = 'rgba(230,200,150,.5)'; g.lineWidth = 1.5; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x + 2, y + 1) : g.moveTo(x + 2, y + 1)); g.stroke(); };
  grieta([[96, 12], [104, 60], [92, 110], [110, 170]], 4);
  for (let i = 0; i < 10; i++) { const x = 70 + i * 9, y = 20 + (i % 3) * 30; g.strokeStyle = 'rgba(235,205,160,.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y + 14); g.stroke(); }
  if (estado >= 2) {
    grieta([[110, 170], [128, 240], [116, 300], [140, 380], [132, 440]], 7); grieta([[128, 240], [180, 262], [230, 250]], 5);
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(150, 0); g.lineTo(256, 0); g.lineTo(256, 150); g.lineTo(200, 120); g.lineTo(184, 70); g.lineTo(160, 46); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const MATS_MIO = [matEscudo, matEscudoDe(conDanio(texEscudo, 1), conDanio(texDentro, 1)), matEscudoDe(conDanio(texEscudo, 2), conDanio(texDentro, 2))];
const miEscudo = new THREE.Mesh(geoEscudo, matEscudo); miEscudo.visible = false; escena.add(miEscudo);
const VIDA_ESCUDO = 4;
const NESC = M * 2 + FILAS * 2, escudos = new THREE.InstancedMesh(geoEscudo, matEscudo, NESC); escudos.frustumCulled = false; escena.add(escudos);

/* astiles hechos por código: piezas [radio atrás, radio delante, largo, centro en z, color]; el eje va por +z y la punta delante */
function geoAsta(piezas) {
  const pos = [], nor = [], col = [];
  for (const [r0, r1, l, zc, c] of piezas) {
    const g = new THREE.CylinderGeometry(r1, r0, l, 6, 1).toNonIndexed(); g.rotateX(Math.PI / 2); g.translate(0, 0, zc);
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); const cc = new THREE.Color(c);
    for (let i = 0; i < g.attributes.position.count; i++) col.push(cc.r, cc.g, cc.b);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}
const matAsta = new THREE.MeshLambertMaterial({ vertexColors: true });
/* venablo: astil de 2,2 cm y 1,6 m, madera clara, punta de hierro pequeña (punta en z = +0,8) */
const geoVenablo = geoAsta([[0.011, 0.011, 1.48, -0.06, '#c8a678'], [0.012, 0.012, 0.06, 0.70, '#4a4a48'], [0.014, 0, 0.1, 0.78, '#5c5c5a']]);
/* pilum: astil de madera y hierro largo y fino con su punta (punta en z = +0,95) */
const geoPilum = geoAsta([[0.015, 0.015, 1.2, -0.45, '#b48a5a'], [0.018, 0.012, 0.12, 0.2, '#3d3d3b'], [0.0055, 0.0055, 0.62, 0.56, '#6a6a68'], [0.011, 0, 0.08, 0.91, '#555553']]);
const PUNTA = 0.8;
const NFL = 260, flechas = new THREE.InstancedMesh(geoVenablo, matAsta, NFL); flechas.frustumCulled = false; escena.add(flechas);
const FL = []; for (let i = 0; i < NFL; i++) FL.push({ est: 0, p: new THREE.Vector3(), q: new THREE.Quaternion() });
/* astillas del escudo roto */
const ASTILLAS = Array.from({ length: 7 }, (_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06 + (i % 3) * 0.04, 0.12 + (i % 2) * 0.12, 0.02), new THREE.MeshLambertMaterial({ color: i % 2 ? 0x7b5632 : 0x6e1a12 })); m.visible = false; escena.add(m); return { m, v: new THREE.Vector3(), w: new THREE.Vector3(), t: -9 }; });

function nuevoSprite(tex, aditivo) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending })); s.visible = false; escena.add(s); return s; }
const CHISPAS = Array.from({ length: 40 }, () => ({ s: nuevoSprite(texChispa, true), t: -9 }));
const POLVO = Array.from({ length: 36 }, () => ({ s: nuevoSprite(texPolvo, false), t: -9, v: new THREE.Vector3() }));

function nuevoPilum() { const g = new THREE.Mesh(geoPilum, matAsta); g.visible = false; escena.add(g); return g; }
const PILA = Array.from({ length: FILES * 2 }, () => ({ g: nuevoPilum(), est: 0 }));

/* ---------- estado de la partida ---------- */
const S = {};
function reinicia() {
  semilla = 43;
  Object.assign(S, { T: 0, zF: 0, k: 0, escudos: false, andando: false, fase: 'avance', proxima: 4, aviso: false, impacto: -1, paso: 0, tCinta: 0, tFin: -1, choque: false, llegaron: 0, sacude: 0, vel: 0, golpes: 0, roto: false, encoge: -9, destello: 0, corre: false, corriendo: false, aliento: 1, tGrito: -9 });
  S.romanos = []; for (let i = 0; i < M; i++) S.romanos.push({ f: i % FILES, r: Math.floor(i / FILES), vivo: true, muere: 0, lanza: -9, x: 0, z: 0, jx: (azar() - 0.5) * 0.18, jz: (azar() - 0.5) * 0.22, fase: azar() * 2 });
  S.tiradores = []; for (let i = 0; i < 10; i++) S.tiradores.push({ x: (i - 4.5) * 1.7 + (azar() - 0.5) * 0.5, z: Z_TIRADORES + (azar() - 0.5) * 1.2, vivo: true, muere: 0, huye: false, yaw: 0, fase: azar() * 4 });
  S.galos = []; for (let i = 0; i < 16; i++) S.galos.push({ x: ((i % 8) - 3.5) * 1.25 + (azar() - 0.5) * 0.3, z: Z_GALOS - Math.floor(i / 8) * 1.6 + (azar() - 0.5) * 0.4, vivo: true, muere: 0, fila: Math.floor(i / 8), fase: azar() * 3 });
  for (const f of FL) f.est = 0; for (const a of ASTILLAS) { a.t = -9; a.m.visible = false; } for (const p of PILA) { p.est = 0; p.g.visible = false; }
  for (const c of CHISPAS) c.t = -9; for (const p of POLVO) p.t = -9;
  $('fin').hidden = true; $('accion').hidden = true; cinta('', false);
}
const vivos = () => S.romanos.filter(h => h.vivo).length;

/* sitio de un hombre (sin vida propia: depende de dónde va el frente y de lo cerrado del testudo) */
function sitio(h) {
  if (!h.vivo) return;
  const k = S.k, dx = lerp(ABIERTO.dx, CERRADO.dx, k), dz = lerp(ABIERTO.dz, CERRADO.dz, k);
  h.x = (h.f - (FILES - 1) / 2) * dx + h.jx * (1 - k) + (h.r === 0 && h.f === YO + 1 ? APARTA * k : 0); h.z = S.zF + h.r * dz + h.jz * (1 - k);
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

/* ---------- la cámara: al hombro en la marcha; bajo los escudos, al lado de tu soldado (idea de Ryse) ---------- */
const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
function camBase() {
  const k = S.k, zc = S.zF + lerp(2.0, 0.42, k), xt = (YO - (FILES - 1) / 2) * CERRADO.dx + 0.30;
  CAM.x = xt * k; CAM.z = zc; CAM.y = H(CAM.x, zc) + lerp(2.2, 1.40, k);
  const dist = Math.max(8, zc - Z_TIRADORES), sube = Math.atan2(H(0, Z_TIRADORES) + 1.2 - CAM.y, dist);
  CAM.pitch = lerp(vertical ? -0.1 : -0.06, vertical ? -0.1 : 0, k) + sube * 0.6 * (1 - k); CAM.yaw = lerp(0, vertical ? 0.3 : 0.17, k);
  return CAM;
}
const lejos = (pt, d) => Math.hypot(pt.x - CAM.x, pt.y - CAM.y, pt.z - CAM.z) >= d;

/* ---------- descargas enemigas: venablos de los peltastas ---------- */
const enCierre = (h, z0) => ({ x: (h.f - (FILES - 1) / 2) * CERRADO.dx + (h.r === 0 && h.f === YO + 1 ? APARTA : 0), z: z0 + h.r * CERRADO.dz });
function descarga() {
  const tir = S.tiradores.filter(t => t.vivo && !t.huye); if (!tir.length) return;
  const v = S.corriendo ? V_CORRE : S.andando ? (S.escudos ? V_TESTUDO : V_PASO) : 0, zPrev = Math.max(Z_PILA, S.zF - v * VUELO), vivosR = S.romanos.filter(h => h.vivo);
  const fondo = FILAS * lerp(ABIERTO.dz, CERRADO.dz, S.k), yo = S.romanos[YO];
  let n = 0;
  for (const f of FL) {
    if (f.est !== 0 || n >= 30) continue; n++;
    const t = tir[n % tir.length]; f.t0 = S.T + azar() * 0.35;
    f.p0 = new THREE.Vector3(t.x + (azar() - 0.5) * 0.6, H(t.x, t.z) + 1.7, t.z);
    let x, y, z; f.h = null; f.tipo = 'fallo';
    /* uno a tu escudo de delante y dos a los techos que se ven: así se nota cada salva */
    const fijo = n === 1 ? yo : n === 2 ? S.romanos[YO - 1] : n === 3 ? S.romanos[YO - 2] : null;
    if (fijo || (azar() < 0.6 && vivosR.length)) {
      const h = fijo || vivosR[Math.floor(azar() * vivosR.length)], c = enCierre(h, zPrev); f.h = h;
      if ((n === 1 || (h.r === 0 && azar() < 0.35)) && h.vivo) { f.tipo = 'muro'; x = c.x + (h === yo ? -0.12 - azar() * 0.12 : (azar() - 0.5) * 0.3); y = MURO + 0.05 + azar() * 0.3; z = c.z - 0.47; }
      else { f.tipo = 'techo'; x = c.x + (azar() - 0.5) * 0.3; y = TECHO + h.r * 0.035 + 0.03; z = c.z - (fijo ? 0.35 : 0.05) + (azar() - 0.5) * 0.3; }
    } else {
      /* falla: corta, larga o a un lado */
      const lado = azar(); if (lado < 0.4) { x = (azar() - 0.5) * 10; z = zPrev - 3 - azar() * 12; } else if (lado < 0.7) { x = (azar() - 0.5) * 8; z = zPrev + fondo + 1 + azar() * 8; } else { x = (azar() < 0.5 ? -1 : 1) * (3 + azar() * 5); z = zPrev + azar() * fondo; }
      y = 0;
    }
    f.p1 = new THREE.Vector3(x, H(x, z) + y, z);
    f.dur = VUELO + (azar() - 0.5) * 0.3; f.alto = 0.12 * f.p0.distanceTo(f.p1) + 4; f.est = 1; f.p.copy(f.p0);
  }
  S.impacto = S.T + VUELO; for (const t of tir) t.tira = S.T;
}
/* el venablo en tierra: clavado inclinado o rebotado y tumbado; nunca pegado a la cámara */
function alSuelo(f, x, z, tumbado) {
  camBase();
  if (tumbado) { f.q.setFromEuler(new THREE.Euler(0, azar() * 6.28, 0)); f.p.set(x, H(x, z) + 0.03, z); }
  else { V3.set(0, 0, 1).applyQuaternion(f.q); f.p.set(x, H(x, z), z).addScaledVector(V3, -(PUNTA - 0.2)); }
  f.est = lejos(f.p, 1.3) ? 3 : 0;
}
/* llega un venablo */
function aterriza(f) {
  const h = f.h; V3.set(0, 0, 1).applyQuaternion(f.q);
  if (f.tipo === 'fallo') { alSuelo(f, f.p1.x, f.p1.z, azar() < 0.3); if (f.est === 3 && azar() < 0.3) chispa(f.p1, 0.5); return; }
  const roto = f.tipo === 'muro' && h === S.romanos[YO] && S.roto;
  if (S.k > 0.7 && h && h.vivo && !roto) {
    /* se clava en el escudo: solo entra la punta */
    camBase(); const c = f.p1.clone().addScaledVector(V3, -(PUNTA - 0.07)), cola = c.clone().addScaledVector(V3, -0.8);
    chispa(f.p1, 1); ruido(0.1, 240, 0.25);
    if (f.tipo === 'muro' && h === S.romanos[YO]) golpeEscudo();
    if (!lejos(c, 1.1) || !lejos(cola, 1.1) || !lejos(f.p1, 0.75) || azar() < 0.2) { f.est = 0; return; }
    const b = enCierre(h, S.zF); f.est = 2; f.rel = new THREE.Vector3(c.x - h.x, c.y - H(h.x, h.z), c.z - h.z);
    return;
  }
  /* sin escudo: el hombre cae (lo decide la salva) y el venablo queda tirado */
  alSuelo(f, f.p1.x + (azar() - 0.5) * 0.6, f.p1.z + (azar() - 0.5) * 0.6, true);
}
function golpeEscudo() {
  if (S.roto) return; S.golpes++;
  if (S.golpes >= VIDA_ESCUDO) {
    S.roto = true; ruido(0.5, 1800, 0.8, 'bandpass'); ruido(0.3, 300, 0.8); grita('¡Mi escudo!');
    const yo = S.romanos[YO], y0 = H(yo.x, yo.z);
    ASTILLAS.forEach((a, i) => { a.t = S.T; a.m.visible = true; a.m.position.set(yo.x + (azar() - 0.5) * 0.4, y0 + MURO + (azar() - 0.5) * 0.6, yo.z - 0.5); a.v.set((azar() - 0.5) * 2.4, 1 + azar() * 1.5, 0.6 + azar() * 1.8); a.w.set(azar() * 9, azar() * 9, azar() * 9); });
  }
}
/* los hombres que caen cuando llegan los venablos sin escudos (nunca tú ni los dos de tu lado) */
function bajas(n) {
  const cand = S.romanos.filter((h, i) => h.vivo && Math.abs(i - YO) > 1).sort((a, b) => (a.r + azar() * 2.5) - (b.r + azar() * 2.5));
  for (let i = 0; i < n && i < cand.length; i++) { const h = cand[i]; h.vivo = false; h.muere = S.T + azar() * 0.25; }
}
const GRITOS = { aguante: ['¡Aguantad!', '¡Firmes!', '¡Juntos!', '¡No os mováis!'], aviso: ['¡Escudos!', '¡Arriba los escudos!', '¡Ahí vienen!'], paso: ['¡Ya casi!', '¡Paso a paso!', '¡Adelante, juntos!'] };
function grita(t) { if (Array.isArray(t)) t = t[Math.floor(azar() * t.length)]; const g = $('grito'); g.textContent = t; g.classList.add('ve'); S.tGrito = S.T; }
function llegaDescarga() {
  S.impacto = -1;
  if (S.k > 0.7) {
    S.encoge = S.T; S.sacude = 0.38; S.destello = 0.14; ruido(0.3, 200, 0.8); grita(GRITOS.aguante);
    camBase(); for (let i = 0; i < 8; i++) { const q = POLVO.find(q => S.T - q.t > 3); if (!q) break; q.t = S.T + azar() * 0.2; q.e = 0.1 + azar() * 0.08; q.s.position.set(CAM.x + (azar() - 0.6) * 1.4, CAM.y + 0.22, CAM.z - 0.4 - azar() * 0.9); q.v.set(0, -0.45 - azar() * 0.3, 0); }
    if (S.roto) { bajas(1); cinta('Sin tu escudo, cae un hombre', false); } else cinta('¡Aguantan! Los venablos no pasan', true);
  }
  else { const n = S.k > 0.3 ? 1 : 2 + Math.floor(azar() * 3); bajas(n); S.sacude = 0.18; cinta(`¡Sin escudos! Caen ${n} hombres`, false); ruido(0.3, 900, 0.5, 'bandpass'); }
}
function chispa(p, e) { const c = CHISPAS.find(c => S.T - c.t > 0.3); if (!c) return; c.t = S.T; c.s.position.copy(p); c.s.visible = true; c.e = e; const q = POLVO.find(q => S.T - q.t > 3); if (q) { q.t = S.T; q.e = 0.3 * e; q.s.position.copy(p); q.v.set(0, 0.25, 0); } }

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
  S.corriendo = S.fase === 'avance' && S.corre && S.aliento > 0.02 && !S.escudos;
  if (S.corriendo) { S.aliento = Math.max(0, S.aliento - dt / 3); v = V_CORRE * (1 - S.k); } else S.aliento = Math.min(1, S.aliento + dt * 0.12);
  if (S.fase === 'avance' && S.andando && !S.corriendo) v = lerp(V_PASO, V_TESTUDO, S.k);
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
    if (!S.aviso && T >= S.proxima - 1.2) { S.aviso = true; cinta('¡Venablos! Escudos arriba', false); if (S.k > 0.3) grita(GRITOS.aviso); }
    if (T >= S.proxima) { S.aviso = false; S.proxima = T + CADA; descarga(); }
  }
  if (S.impacto > 0 && T >= S.impacto) llegaDescarga();
  if (S.tCinta && T - S.tCinta > 2.6 && !(S.aviso || S.impacto > 0)) cinta('', false);
  /* flechas */
  for (const f of FL) {
    if (f.est !== 1 || T < f.t0) continue;
    const s = (T - f.t0) / f.dur;
    if (s >= 1) { aterriza(f); continue; }
    f.p.lerpVectors(f.p0, f.p1, s); f.p.y += f.alto * 4 * s * (1 - s);
    V3.subVectors(f.p1, f.p0); V3.y += f.alto * 4 * (1 - 2 * s); f.q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), V3.normalize());
  }
  /* los clavados en escudos caen al bajar los escudos o si cae su hombre */
  for (const f of FL) if (f.est === 2 && (S.k < 0.7 || !f.h.vivo)) alSuelo(f, f.h.x + f.rel.x, f.h.z + f.rel.z, true);
  /* polvo que cae o sube, astillas que saltan */
  for (const q of POLVO) if (T - q.t >= 0 && T - q.t < 3) q.s.position.addScaledVector(q.v, dt);
  for (const a of ASTILLAS) { if (T - a.t > 1.4 || a.t < 0) continue; a.v.y -= 9.8 * dt; a.m.position.addScaledVector(a.v, dt); a.m.rotation.x += a.w.x * dt; a.m.rotation.y += a.w.y * dt; const yg = H(a.m.position.x, a.m.position.z) + 0.02; if (a.m.position.y < yg) { a.m.position.y = yg; a.v.set(0, 0, 0); a.w.set(0, 0, 0); } }
  if (S.tGrito > 0 && T - S.tGrito > 1.7) { $('grito').classList.remove('ve'); S.tGrito = -9; }
  S.destello = Math.max(0, S.destello - dt);
  /* pila */
  for (const p of PILA) {
    if (p.est !== 1 || T < p.t0) continue;
    const s = (T - p.t0) / p.dur;
    if (s >= 1) {
      p.est = 2; const x = p.p1.x, z = p.p1.z;
      if (p.blanco && p.blanco.vivo) { p.blanco.vivo = false; p.blanco.muere = T; p.g.quaternion.setFromEuler(new THREE.Euler(0, azar() * 6.28, 0)); p.g.position.set(x + 0.5, H(x, z) + 0.03, z + 0.4); }
      else { V3.set(0, 0, 1).applyQuaternion(p.g.quaternion); p.g.position.set(x, H(x, z), z).addScaledVector(V3, -0.7); }
      continue;
    }
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
function pon(fig, i, x, y, z, yaw, frame, agacha, inclina) {
  O.position.set(x, y, z); O.rotation.set(-(inclina || 0), yaw, 0); O.scale.set(UNIT_SCALE, UNIT_SCALE * (1 - agacha), UNIT_SCALE); O.updateMatrix();
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
    else if (S.corriendo && h.vivo) fr = frameOf(C.run, T + h.fase);
    else if (S.vel > 0) fr = frameOf(C.walk, S.paso / lerp(V_PASO, V_TESTUDO * 1.4, k) + h.fase);
    else fr = frameOf(C.idle, T + h.fase);
    if (!h.vivo && !h.fijo) { h.fijo = true; }
    /* al caer la salva se encogen y agachan la cabeza, tú primero y los demás con desfase */
    const te = T - S.encoge - (i === YO ? 0 : 0.05 + (i % 5) * 0.04), en = h.vivo && te > 0 && te < 0.5 ? Math.sin(Math.PI * te / 0.5) : 0;
    pon(R, i, h.x, H(h.x, h.z) - 0.03 - (h.vivo ? BAJA * k + 0.09 * en : 0), h.z, Math.PI + (i === YO ? 0.25 * en : 0), fr, h.vivo ? 0.15 * k : 0, 0.3 * en);
  });
  R.m.instanceMatrix.needsUpdate = true; R.fr.needsUpdate = true;
  /* escudos del testudo: suben y bajan en medio segundo */
  let e = 0;
  const yo = S.romanos[YO]; miEscudo.visible = false;
  const escudo = (h, ox, oy, oz, q, muro) => {
    if (!h.vivo || k < 0.02) { escudos.setMatrixAt(e++, CERO); return; }
    const y0 = H(h.x, h.z);
    PA.set(h.x - 0.32, y0 + 0.85, h.z - 0.3); PB.set(h.x + ox, y0 + oy, h.z + oz); PA.lerp(PB, k);
    QA.copy(Q_FRENTE).slerp(q, k); O.position.copy(PA); O.quaternion.copy(QA); O.scale.setScalar(1); O.updateMatrix();
    if (muro && h === yo) { escudos.setMatrixAt(e++, CERO); miEscudo.visible = !S.roto; miEscudo.position.copy(O.position); miEscudo.quaternion.copy(O.quaternion); miEscudo.material = MATS_MIO[S.golpes <= 0 ? 0 : S.golpes <= 2 ? 1 : 2]; return; }
    escudos.setMatrixAt(e++, O.matrix);
  };
  for (const h of S.romanos) escudo(h, 0, TECHO + h.r * 0.035, -0.05, Q_TECHO);
  for (const h of S.romanos) { if (h.r === 0) escudo(h, 0, MURO, -0.45, Q_FRENTE, true); else escudos.setMatrixAt(e++, CERO); }
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
  /* venablos: en vuelo, clavados en escudos (siguen a su hombre) o en tierra */
  FL.forEach((f, i) => {
    if (f.est === 0 || (f.est === 1 && T < f.t0)) { flechas.setMatrixAt(i, CERO); return; }
    if (f.est === 2) f.p.set(f.h.x + f.rel.x, H(f.h.x, f.h.z) + f.rel.y, f.h.z + f.rel.z);
    O.position.copy(f.p); O.quaternion.copy(f.q); O.scale.setScalar(1); O.updateMatrix(); flechas.setMatrixAt(i, O.matrix);
  });
  flechas.instanceMatrix.needsUpdate = true;
  for (const c of CHISPAS) { const a = T - c.t; c.s.visible = a >= 0 && a < 0.25; if (c.s.visible) { c.s.scale.setScalar((c.e || 1) * (0.6 + a * 5)); c.s.material.opacity = 1 - a / 0.25; } }
  for (const p of POLVO) { const a = T - p.t; p.s.visible = a >= 0 && a < 3; if (p.s.visible) { const e = p.e || 1; p.s.scale.setScalar(e * (1.2 + a * 1.6)); p.s.material.opacity = 0.85 * (1 - a / 3) * (e < 1 ? Math.max(0, 1 - a) : 1); } }
  for (const p of PILA) p.g.visible = p.est === 1 ? T >= p.t0 : p.est === 2;
  /* la cámara (ver camBase), con cabeceo al paso, temblor al correr y sacudida con giro al llegar cada salva */
  camBase(); const andar = S.vel > 0 ? (S.corriendo ? 2.5 : 1) : 0, ph = S.paso / 0.85 * Math.PI;
  let cx = CAM.x + Math.sin(ph) * 0.03 * andar, cy = CAM.y + Math.abs(Math.sin(ph)) * 0.05 * andar;
  const sac = (S.fase === 'carga' && !S.choque ? 0.06 : 0) + (S.corriendo ? 0.02 : 0), golpe = S.sacude * 0.1;
  cx += (Math.random() - 0.5) * (sac + golpe); cy += (Math.random() - 0.5) * (sac + golpe);
  camara.position.set(cx, cy, CAM.z); dentro.position.set(cx - 0.2, cy + 0.12, CAM.z - 0.5); dentro.intensity = 3 * k + S.destello * 30;
  const fov = vertical ? lerp(76, 82, k) : lerp(62, 70, k), cerca = lerp(0.06, 0.24, k);
  if (camara.fov !== fov || camara.near !== cerca) { camara.fov = fov; camara.near = cerca; camara.updateProjectionMatrix(); }
  camara.rotation.set(CAM.pitch + Math.sin(ph * 2) * 0.006 * andar + Math.sin(T * 47) * S.sacude * 0.05, CAM.yaw + Math.sin(ph) * 0.004 * andar, Math.sin(T * 31) * S.sacude * 0.09);
  camara.updateMatrixWorld();
  /* la rendija: oscuro por encima del techo y por debajo del muro */
  $('sombra').classList.toggle('ve', k > 0.5);
  if (k > 0.02) {
    const yF = H(0, S.zF), a = new THREE.Vector3(cx - 0.2, yF + MURO + 0.56, S.zF - 0.45).project(camara), b = new THREE.Vector3(cx - 0.2, yF + TECHO - 0.07, S.zF - 0.62).project(camara);
    const ri = Math.max(2, Math.min(95, (a.y + 1) * 50)), rs = Math.max(ri + 4, Math.min(98, (b.y + 1) * 50));
    document.documentElement.style.setProperty('--ri', ri.toFixed(1) + '%'); document.documentElement.style.setProperty('--rs', rs.toFixed(1) + '%');
  }
  renderer.render(escena, camara);
}

/* ---------- interfaz ---------- */
function hud() {
  const n = vivos(), f = n / M, b = $('barra').firstElementChild;
  $('cuenta').textContent = n + '/' + M; b.style.width = (f * 100).toFixed(0) + '%'; b.style.background = f > 0.7 ? 'var(--verde)' : f > 0.45 ? '#e6ac3c' : 'var(--rojo)';
  const av = $('avanzar'), es = $('escudos'), ac = $('accion'), co = $('correr');
  co.hidden = S.fase !== 'avance'; co.classList.toggle('activa', S.corriendo); $('aliento').style.width = (S.aliento * 100).toFixed(0) + '%';
  const me = $('miescudo'); me.className = S.roto ? 'roto' : 'e' + (S.golpes <= 0 ? 0 : S.golpes <= 2 ? 1 : 2); me.title = S.roto ? 'Tu escudo está roto' : 'Tu escudo';
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
const correr = $('correr');
correr.addEventListener('pointerdown', e => { e.preventDefault(); try { correr.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } S.corre = true; S.escudos = false; });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) correr.addEventListener(ev, () => { S.corre = false; });
$('escudos').addEventListener('pointerdown', e => { e.preventDefault(); S.escudos = !S.escudos; if (S.escudos) S.corre = false; ruido(0.18, 220, 0.5); });
$('accion').addEventListener('pointerdown', e => { e.preventDefault(); if (S.fase === 'pila') lanzarPila(); else cargar(); });
$('otra').addEventListener('click', () => { location.href = location.pathname; });
$('salir').addEventListener('click', () => { location.href = document.baseURI; });

/* ---------- fases para las capturas: colocan la escena y la congelan ---------- */
let parado = false;
const salta = s => { for (let t = 0; t < s; t += 1 / 30) paso(1 / 30); };
function prepara(f) {
  if (f === 'avance') { S.zF = -14; S.proxima = 99; S.andando = true; salta(1.3); }
  if (f === 'flechas') { S.zF = -28; S.andando = true; S.proxima = S.T + 1.25; salta(1.25 + 0.8); }
  if (['testudo', 'cara', 'roto', 'pila', 'final', 'carga'].includes(f)) {
    S.zF = -30; S.andando = true; S.proxima = S.T + 0.5; salta(3.2);
    S.escudos = true; S.proxima = S.T + 0.6; salta(3.4);
    if (f === 'roto') for (let i = 0; i < 3; i++) { S.proxima = S.T + 0.3; salta(2.9); }
    if (f === 'testudo' || f === 'cara' || f === 'roto') S.zF = -50;
    S.proxima = S.T + 0.5; salta(f === 'testudo' ? 0.5 + 2.25 : f === 'cara' || f === 'roto' ? 0.5 + 2.2 + 0.27 : 3);
  }
  if (f === 'pila' || f === 'final' || f === 'carga') { S.zF = Z_PILA + 0.5; salta(1); S.escudos = false; salta(0.6); lanzarPila(); salta(f === 'pila' ? 0.95 : 2.6); }
  if (f === 'final') { cargar(); salta(8); }
  if (f === 'carga') { cargar(); salta(2.6); }
  if (['testudo', 'cara', 'roto'].includes(f)) S.andando = true;
  parado = true;
}

/* ---------- arranque ---------- */
let ultimo = 0;
function bucle(t) {
  const dt = Math.min(0.05, (t - ultimo) / 1000 || 0); ultimo = t;
  if (!parado) paso(dt);
  dibuja(); hud(); requestAnimationFrame(bucle);
}
window.__tp = { lista: false, S, salta: s => salta(s), estado: () => ({ golpes: S.golpes, roto: S.roto, clavadosCerca: FL.filter(f => f.est >= 2 && (camBase(), !lejos(f.p, 1.0))).length, enHombre: FL.filter(f => f.est === 2 && S.k < 0.7).length, andando: S.andando, fase: S.fase, zF: S.zF, k: S.k, vivos: vivos(), flechas: FL.filter(f => f.est).length }) };
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
