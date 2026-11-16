/* Maqueta GM7 «guerra de lejos» — PANTALLA. La batalla grande de GM1, que ahora empieza de lejos: tiradores delante,
   proyectiles que se ven, escudos y testudo. Todo lo que se pinta de una tropa sale de su ficha (reglas.js: TROPAS, ARMAS, FORMACIONES).
   Lo de GM1 sigue igual:
   La idea: el regimiento es lo que se simula y lo que se mueve; cada hombre se dibuja como un CARTÓN (dos triángulos con su
   foto, sacada del soldado real al cargar) y su sitio lo calcula la tarjeta gráfica a partir de seis números del regimiento.
   Las figuras completas solo salen cerca de la cámara, con un tope fijo. Al caer gente, el regimiento pierde filas por detrás.
   No cambia nada de js/: solo importa sus módulos de dibujo. Arte de 0 A.D. (Wildfire Games, CC BY-SA 3.0). */
import { THREE } from '../../../js/gfx/models.js';
import { preload, getUnit, unitMaterialReal, instancedGeometry, frameOf, UNIT_SCALE } from '../../../js/gfx/units.js';
import { loadGroundTextures, applyGround, crearCielo, texturaRuido } from '../../../js/gfx/ground.js';
import { preloadStatic, staticInstances } from '../../../js/gfx/statics.js';
import * as R from './reglas.js';
import * as F from './formacion.js';

const $ = id => document.getElementById(id);
const par = new URLSearchParams(location.search);
const HOMBRES = Math.max(300, Math.min(12000, Math.round(+par.get('hombres')) || 5000));
const MAXFIG = Math.max(0, Math.min(400, par.has('figuras') ? +par.get('figuras') : 220));   // tope de figuras completas, sea cual sea el ejército
const DE_PIE = window.innerHeight > window.innerWidth;                                         // la formación se decide al desplegar, según cómo se sujeta el móvil
const FILES = F.filesDe(Math.round(120 * HOMBRES / R.BASE_HOMBRES), DE_PIE ? 1.25 : 3.2), PASO = 1, ANCHO = FILES * PASO;   // medidas del campo, en metros
const S = ANCHO + Math.max(2.5, ANCHO * 0.1), HUECO = 2.4 + ANCHO * 0.03, CAMPO = 7 + ANCHO * 0.06, MEDIO = S * 1.5 + 1.5;
const ESC = Math.max(0.5, Math.min(1, ANCHO / (DE_PIE ? 42 : 75))), LEJOS = R.DIST0 * ESC;      // los metros de las reglas se pintan a la escala del ejército
const RIVAL = par.get('rival') || 'cartago';
const COLOR = ['#b3261e', '#5b3a8c'], ficha = t => R.TROPAS[t], forma = t => R.FORMACIONES[R.TROPAS[t].forma], montado = t => !!R.TROPAS[t].montado;
const xs = i => (i - 1) * S;
const miles = n => String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+$)/g, ' ');

/* ---------- escena ---------- */
const lienzo = $('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
let dpr = Math.min(window.devicePixelRatio || 1, 2); renderer.setPixelRatio(dpr);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
const escena = new THREE.Scene(), HORIZ = '#d9d2b8';
escena.fog = new THREE.Fog(HORIZ, 90, 520);
const camara = new THREE.PerspectiveCamera(50, 1, 0.5, 12000);
const luces = () => { const s = new THREE.DirectionalLight('#ffe6b8', 3.0); s.position.set(-90, 95, 60); return [new THREE.HemisphereLight('#cfe2ff', '#7a6238', 1.3), s]; };
const [cielo0, sol] = luces(); escena.add(cielo0, sol);

/* lo que comparten todos los cartones: reloj, cámara, zona de figuras completas y niebla */
const COMUN = { uT: { value: 0 }, uCamR: { value: new THREE.Vector3(1, 0, 0) }, uCamU: { value: new THREE.Vector3(0, 1, 0) }, uCamAz: { value: 0 }, uPix: { value: 800 },
  uDet: { value: new THREE.Vector3(0, 0, -1) }, uNiebla: { value: new THREE.Vector2(90, 520) }, uNieblaC: { value: new THREE.Color(HORIZ) }, uRes: { value: new THREE.Vector2(1, 1) } };

let ancho = 0, alto = 0, vertical = true;
function medir() {
  ancho = window.innerWidth; alto = window.innerHeight; vertical = alto > ancho;
  renderer.setSize(ancho, alto, false); camara.aspect = ancho / alto; camara.fov = vertical ? 54 : 40; camara.updateProjectionMatrix();
  COMUN.uPix.value = alto * dpr / (2 * Math.tan(camara.fov * Math.PI / 360)); COMUN.uRes.value.set(ancho * dpr, alto * dpr);
}
window.addEventListener('resize', medir); medir();

/* ---------- el cartón: la foto de cada soldado, desde ocho lados y en once poses ---------- */
const COLS = 11, DIRS = 8, INCL = 0.38, atlas = new Map();
function atlasDe(tipo, lado) {
  const id = tipo + lado; if (atlas.has(id)) return atlas.get(id);
  const u = getUnit(ficha(tipo).carton), mont = montado(tipo), cw = mont ? 112 : 72, ch = mont ? 112 : 96, W = mont ? 4.6 : 2.1, H = mont ? 4.6 : 2.9, yc = mont ? 1.75 : 1.3;
  const rt = new THREE.WebGLRenderTarget(cw * COLS, ch * DIRS, { colorSpace: THREE.SRGBColorSpace, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  const esc = new THREE.Scene(); esc.add(...luces());
  const g = instancedGeometry(u, 1), m = new THREE.InstancedMesh(g, unitMaterialReal(u, COLOR[lado]), 1); m.frustumCulled = false; esc.add(m);
  const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 60); cam.position.set(0, yc + Math.sin(INCL) * 20, Math.cos(INCL) * 20); cam.lookAt(0, yc, 0);
  const C = u.clips, de = (c, f) => c ? c.start + Math.min(c.frames - 1, Math.floor(f * c.frames)) : 0, anda = mont ? (C.run || C.walk) : C.walk, pega = C.attack_ranged && forma(tipo).delante ? C.attack_ranged : C.attack_melee || C.attack_ranged;
  const poses = [de(C.idle, 0), de(anda, 0), de(anda, 0.25), de(anda, 0.5), de(anda, 0.75), de(pega, 0.1), de(pega, 0.35), de(pega, 0.6), de(pega, 0.85), de(C.death, 0.45), de(C.death, 0.999)];
  const color = renderer.getClearColor(new THREE.Color()), alfa = renderer.getClearAlpha(), auto = renderer.autoClear, M = new THREE.Matrix4(), E = new THREE.Vector3(UNIT_SCALE, UNIT_SCALE, UNIT_SCALE);
  renderer.autoClear = false; renderer.setClearColor(0x000000, 0); rt.scissorTest = false; renderer.setRenderTarget(rt); renderer.clear();
  rt.scissorTest = true;
  for (let k = 0; k < DIRS; k++) for (let c = 0; c < COLS; c++) {
    g.attributes.aFrame.array[0] = poses[c]; g.attributes.aFrame.needsUpdate = true; m.setMatrixAt(0, M.makeRotationY(k * Math.PI / 4).scale(E)); m.instanceMatrix.needsUpdate = true;
    rt.viewport.set(c * cw, k * ch, cw, ch); rt.scissor.set(c * cw, k * ch, cw, ch); renderer.setRenderTarget(rt); renderer.render(esc, cam);
  }
  renderer.setRenderTarget(null); renderer.autoClear = auto; renderer.setClearColor(color, alfa); g.dispose();
  const a = { tex: rt.texture, W, H, yc, mont }; atlas.set(id, a); return a;
}
/* El sombreador coloca a cada hombre: su número (gl_InstanceID) da fila y columna; ver formacion.js, que hace la misma cuenta */
const VS = `
uniform vec2 uCentro, uPaso, uFuga, uTam, uNiebla; uniform vec3 uDet, uCamR, uCamU;
uniform float uRev, uYaw, uFiles, uVivos, uT, uAnim, uAtaca, uCalma, uHuida, uOrden, uGiro, uCamAz, uAlto, uPix, uVida;
#ifdef CAIDO
attribute vec4 aC;
#endif
varying vec2 vUv; varying float vLejos, vNiebla;
float fr(float x) { return x - floor(x); }
void main() {
  float id = uRev > 0.5 ? uVivos - 1.0 - float(gl_InstanceID) : float(gl_InstanceID), esc = 1.0, cual = 0.0, yaw = uYaw; vec2 p;
#ifdef CAIDO
  float t = uT - aC.z; p = aC.xy; yaw = aC.w; cual = t < 0.4 ? 9.0 : 10.0;
  esc = (t < 0.0 || t > uVida) ? 0.0 : 1.0 - smoothstep(uVida - 4.0, uVida, t);
#else
  float fila = floor((id + 0.5) / uFiles), col = id - fila * uFiles, enFila = min(uFiles, uVivos - fila * uFiles);
  float h1 = fr(id * 0.618034), h2 = fr(id * 0.754878 + 0.31);
  vec2 loc = vec2((col - (enFila - 1.0) * 0.5) * uPaso.x + (h1 - 0.5) * 0.34, fila * uPaso.y + (h2 - 0.5) * 0.34);
  vec2 d = vec2(sin(uYaw), cos(uYaw)); p = uCentro - d * loc.y + vec2(d.y, -d.x) * loc.x;
  if (uHuida >= 0.0) {
    float t = max(0.0, uHuida - h2 * 1.8), v = mix(4.2, 7.2, h1) * uOrden;
    p += uFuga * v * t + vec2(uFuga.y, -uFuga.x) * (h1 - 0.5) * t * 2.2 * uOrden;
    if (t > 0.0) { yaw = atan(uFuga.x, uFuga.y); cual = 1.0 + mod(floor(uT * 9.0 + h1 * 4.0), 4.0); }
    esc = 1.0 - smoothstep(10.0, 13.0, t + h1 * 3.0);
  } else if (uGiro > 0.5) {
    float a = uT * 0.9 + id * 0.785; p += vec2(cos(a) * 1.6, sin(a) * 3.2); yaw = atan(-sin(a) * 1.6, cos(a) * 3.2); cual = 1.0 + mod(floor(uT * 9.0 + h1 * 4.0), 4.0);
  } else if (uAnim > 0.5) cual = 1.0 + mod(floor(uT * (uAnim > 1.5 ? 9.0 : 5.5) + h1 * 4.0), 4.0);
  else if (fila < uAtaca && sin(uT * 0.8 + h2 * 19.0) > uCalma) cual = 5.0 + mod(floor(uT * 5.0 + h1 * 4.0), 4.0);
  if (uHuida < 0.0 && distance(p, uDet.xy) < uDet.z) esc = 0.0;
#endif
  float k = mod(floor((yaw - uCamAz) / 0.7853982 + 0.5), 8.0);
  vec4 mv = viewMatrix * vec4(p.x, uAlto, p.y, 1.0);
  vLejos = clamp(1.0 - (uTam.y * uPix / -mv.z - 14.0) / 18.0, 0.0, 1.0);
  vec2 rec = mix(vec2(1.0), vec2(0.5, 0.74), vLejos);                 /* de lejos el cartón se recorta al cuerpo: menos píxeles que pintar */
  vec3 w = vec3(p.x, uAlto, p.y) + uCamR * (position.x * uTam.x * rec.x * esc) + uCamU * (position.y * uTam.y * rec.y * esc);
  mv = viewMatrix * vec4(w, 1.0); gl_Position = projectionMatrix * mv;
  vUv = vec2((0.5 + (uv.x - 0.5) * rec.x + cual) / ${COLS}.0, (0.5 + (uv.y - 0.5) * rec.y + k) / ${DIRS}.0);
  vNiebla = smoothstep(uNiebla.x, uNiebla.y, -mv.z);
}`;
const FS = `
uniform sampler2D uMap; uniform vec3 uNieblaC, uBando;
varying vec2 vUv; varying float vLejos, vNiebla;
void main() {
  vec4 t = texture2D(uMap, vUv); if (t.a < mix(0.5, 0.16, vLejos)) discard;
  vec3 c = t.rgb / max(t.a, 0.06); c = mix(c, uBando, vLejos * 0.3);
  gl_FragColor = vec4(mix(c, uNieblaC, vNiebla), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const QUAD = new THREE.PlaneGeometry(1, 1);
function carton(at, lado, propios, caido) {
  const g = new THREE.InstancedBufferGeometry(); g.index = QUAD.index.clone(); g.setAttribute('position', QUAD.attributes.position.clone()); g.setAttribute('uv', QUAD.attributes.uv.clone());   // copias propias: al deshacer un regimiento no se lleva los datos de los demás
  const un = Object.assign({ uMap: { value: at.tex }, uTam: { value: new THREE.Vector2(at.W, at.H) }, uAlto: { value: at.yc }, uBando: { value: new THREE.Color(COLOR[lado]) } }, propios, COMUN);
  const malla = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: un, vertexShader: (caido ? '#define CAIDO\n' : '') + VS, fragmentShader: FS })); malla.frustumCulled = false; escena.add(malla);
  return { g, un, malla };
}

/* ---------- estado ---------- */
let B = null, regs = new Map(), todos = [], rc = null, rn = null, T = 0, nEv = 0, sel = 1, pausa = false, lista = false, FONDO_R = 30, FONDO_E = 20, ZCAB = 40;
let avisoTir = 0, avisoTir2 = 0, foco = { i: -1, hasta: 0, ultimo: -99 }, cerca = false, cintaHasta = 0, tocado = false, temblor = 0, nFig = 0, maxFig = 0;
const cam = { x: 0, y: 0, z: 6, d: 80, p: 0.6, a: 0 };
const estand = [], pend = [], polvoN = 240, figM = new Map(), caidos = new Map(); let polvo = null, marca = null, sombras = null;

function regimiento(tipo, lado, cap, files) {
  const mont = montado(tipo), px = forma(tipo).px, pz = forma(tipo).pz;
  const c = carton(atlasDe(tipo, lado), lado, { uCentro: { value: new THREE.Vector2() }, uYaw: { value: 0 }, uFiles: { value: files }, uVivos: { value: cap }, uRev: { value: 0 }, uPaso: { value: new THREE.Vector2(px, pz) }, uAnim: { value: 0 }, uAtaca: { value: 0 }, uCalma: { value: 0.1 },
    uHuida: { value: -1 }, uFuga: { value: new THREE.Vector2(0, 1) }, uOrden: { value: 1 }, uGiro: { value: 0 }, uVida: { value: 0 } });
  const manto = new THREE.Mesh(MANTO, new THREE.MeshBasicMaterial({ color: '#1a1408', transparent: true, opacity: 0.2, depthWrite: false })); manto.renderOrder = 1; escena.add(manto);   // sombra del bloque
  const rg = { tipo, lado, cap, n: cap, files, px, pz, px0: px, pz0: pz, pxQ: px, pzQ: pz, cubre: 0, cubreQ: 0, x: 0, z: 0, yaw: lado === 0 ? Math.PI : 0, tx: 0, tz: 0, tyaw: 0, est: 0, tH: 0, anim: 0, ataca: 0, calma: 0.1, giro: 0, vQ: 0, mont, manto, ...c };
  if (ficha(tipo).cubre) rg.techo = tejado();
  todos.push(rg); return rg;
}
const MANTO = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, 0.5);
function caidosDe(rg) {
  const id = rg.tipo + rg.lado; if (caidos.has(id)) return caidos.get(id);
  const cap = 140, a = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4).fill(-999), 4); a.setUsage(THREE.DynamicDrawUsage);
  const c = carton(atlasDe(rg.tipo, rg.lado), rg.lado, { uVida: { value: 45 }, uRev: { value: 0 }, uVivos: { value: 0 } }, true); c.g.setAttribute('aC', a); c.g.instanceCount = cap; c.malla.renderOrder = 60;
  const p = { a, cap, k: 0, ...c }; caidos.set(id, p); return p;
}
const O = {};
function cae(rg, cuantos) {                                     // los que caen quedan en el suelo, en las dos primeras filas
  const p = caidosDe(rg), n = Math.ceil(rg.n);
  for (let j = 0; j < Math.min(cuantos, 3); j++) { F.sitio(rg, Math.floor(Math.random() * Math.min(rg.files * 2, n)), T, O); const o = (p.k++ % p.cap) * 4; p.a.array[o] = O.x; p.a.array[o + 1] = O.z; p.a.array[o + 2] = T; p.a.array[o + 3] = rg.yaw + (Math.random() - 0.5); }
  p.a.needsUpdate = true;
}

function montar(semilla) {
  for (const rg of todos) { escena.remove(rg.malla, rg.manto); rg.g.dispose(); rg.malla.material.dispose(); rg.manto.material.dispose(); if (rg.techo) { escena.remove(rg.techo.gr); rg.techo.mapa.dispose(); rg.techo.mapaM.dispose(); rg.techo.mat.dispose(); rg.techo.matM.dispose(); } }
  if (pro) { pro.aT.array.fill(-999); pro.aT.needsUpdate = true; }
  for (const p of caidos.values()) { p.a.array.fill(-999); p.a.needsUpdate = true; p.k = 0; }
  B = R.nueva(semilla, HOMBRES, RIVAL); regs = new Map(); todos = []; nEv = 0; T = 0; sel = 1; avisoTir = avisoTir2 = 0; foco = { i: -1, hasta: 0, ultimo: -99 }; tocado = false; maxFig = 0;
  for (const s of B.sect) for (const c of s.c) {
    for (const l of c.lineas) { const rg = regimiento(l.tipo, c.lado, l.max, FILES); rg.c = c; rg.s = s; regs.set(l, rg); }
    if (c.tir) { const rg = regimiento(c.tir.tipo, c.lado, c.tir.max, Math.max(6, Math.floor(ANCHO / forma(c.tir.tipo).px))); rg.c = c; rg.s = s; rg.tir = c.tir; regs.set(c.tir, rg); }   // los que salen delante a tirar
  }
  const fj = n => Math.max(4, Math.round(Math.sqrt(n * 1.2)));
  rc = regimiento(B.cab.tipo, 0, B.cab.hombres, fj(B.cab.hombres)); rn = regimiento(B.num.tipo, 1, B.num.hombres, fj(B.num.hombres));
  for (const q of [rc, rn]) { q.ancho = q.files * q.px; q.hondo = Math.ceil(q.cap / q.files) * q.pz; }
  const fondo = c => c.lineas.reduce((a, l) => a + Math.ceil(l.max / FILES) * 1.15 + HUECO, 0.8);
  FONDO_R = fondo(B.sect[1].c[0]); FONDO_E = Math.max(...B.sect.map(s => fondo(s.c[1]))); ZCAB = FONDO_R + 4;
  colocar(0); for (const rg of todos) { rg.x = rg.tx; rg.z = rg.tz; rg.yaw = rg.tyaw; }
  pintarCartas(true);
}

/* ---------- dónde debe estar cada regimiento (los hombres van dentro, cada uno en su sitio) ---------- */
/* El motor da, por sector, dónde va cada frente (c.z, en metros de las reglas). Aquí solo se pasa a metros de pantalla */
const zFrente = s => (s.c[0].z - s.c[1].z) / 2 * ESC - s.frente * CAMPO;       // la raya donde chocan (o chocarán)
const hueco = s => s.dist * ESC;                                              // lo que les falta para tocarse
function colocar() {
  const vistas = new Set();
  for (const s of B.sect) for (const c of s.c) {
    const dir = c.lado === 0 ? 1 : -1, rival = s.c[1 - c.lado], lejos = R.lejos(s), h = hueco(s) / 2;
    const r = B.resultado, vencido = r && (r.como === 'victoria') === (c.lado === 1);                 // al acabar, el bando vencido deja el campo
    if (c.roto || vencido) { for (const rg of regs.values()) if (rg.c === c) { vistas.add(rg); huir(rg, dir, !c.roto && r && r.como === 'retirada'); } continue; }
    /* el vencedor de su duelo se vuelve contra el costado del vecino (GM8: aquí va el giro en rueda y la entrada andando) */
    let fl = null; if (rival.roto && c.libre <= 0) { const o = R.vecino(B, s.i, 1 - c.lado); if (o && o !== s) { const sg = Math.sign(xs(s.i) - xs(o.i)); fl = { sg, x: xs(o.i) + sg * (ANCHO / 2 + 0.9), z: zFrente(o) - dir * (hueco(o) / 2 + ANCHO / 2 - 1.5) }; } }
    const lucha = !lejos && c.relevo <= 0 && (!rival.roto || fl), empuja = c.postura === 'empujar', P = lejos && ficha(R.frente(c).tipo).cubre ? R.POSTURAS[c.postura] : null;
    let d = 0.8 + h;
    const t = c.tir, atras = t && t.estado === 'fuera' && !t.huido;
    (atras ? c.lineas.concat(t) : c.lineas).forEach((l, k) => {
      const rg = regs.get(l); if (!rg) return; vistas.add(rg);
      const baj = Math.ceil(rg.n) - Math.ceil(l.hombres); if (baj > 0 && (k === 0 || l === t) && B.t > 0.2) cae(rg, baj);
      rg.n = l.hombres; rg.pxQ = rg.px0 * (P ? P.aprieta : 1); rg.pzQ = l === t ? rg.pz0 : P ? 1.15 * P.aprieta : k === 0 && empuja ? 0.95 : 1.15; rg.cubreQ = !P || l === t ? 0 : P.techo ? 2 : P.recibe < 1 ? 1 : 0;
      if (fl) { rg.tx = fl.x + fl.sg * (d - 0.8 - h); rg.tz = fl.z; rg.tyaw = -fl.sg * Math.PI / 2; } else { rg.tx = xs(s.i); rg.tz = zFrente(s) + dir * d; rg.tyaw = c.lado === 0 ? Math.PI : 0; }
      rg.ataca = lucha && k === 0 ? (empuja ? 3 : 2) : 0; rg.calma = empuja ? -2 : 0.1; rg.vQ = l === t ? 8 : 0;
      d += F.filasDe(l.hombres, rg.files) * rg.pzQ + HUECO;
    });
    c.fondo = d - h;
    if (t && !atras) {                                                        // tiradores delante: van por delante de su línea, tiran y vuelven por los huecos
      const rg = regs.get(t); vistas.add(rg);
      const baj = Math.ceil(rg.n) - Math.ceil(t.hombres); if (baj > 0 && !t.huido) cae(rg, baj); rg.n = t.hombres;
      if (t.huido) huir(rg, dir, false);
      else { rg.tx = xs(s.i); rg.tz = zFrente(s) + dir * (0.8 + h - t.av * ESC); rg.tyaw = c.lado === 0 ? Math.PI : 0; rg.ataca = t.estado === 'tira' ? 99 : 0; rg.calma = -0.35; rg.vQ = t.estado === 'vuelve' ? 9 : 0; }
    }
  }
  for (const rg of regs.values()) if (!vistas.has(rg)) huir(rg, rg.lado === 0 ? 1 : -1, true);      // línea deshecha: se retira
  jinetes();
}
function huir(rg, dir, orden) { if (rg.est === 3) return; rg.est = 3; rg.tH = 0; rg.un.uFuga.value.set(0, dir); rg.un.uOrden.value = orden ? 0.55 : 1; }

/* GM8: aquí se cambia cómo carga la caballería (arranque, galope, choque, vuelta, persecución). El motor solo dice
   B.cab.estado (lista, yendo, cargando, volviendo), B.cab.sect y si va a por los tiradores */
function jinetes() {
  const c = B.cab, lado = i => i === 0 ? -1 : 1, llegar = (q, x, z, yaw, seg) => { q.tx = x; q.tz = z; q.tyaw = yaw; q.vQ = Math.max(6, Math.hypot(x - q.x, z - q.z) / Math.max(0.25, seg)); };
  const zRoma = s => zFrente(s) + hueco(s) / 2;
  rc.giro = 0; rc.ataca = 0;
  if (c.estado === 'yendo' || c.estado === 'cargando') {
    const s = B.sect[c.sect], sg = lado(c.sect), e = s.c[1], rt = e.tir && regs.get(e.tir), aTir = rt && (R.tirando(e) || (e.tir.huido && c.estado === 'cargando'));
    const mx = aTir ? xs(c.sect) + sg * 2 : xs(c.sect) + sg * (ANCHO / 2 + 1.2), mz = aTir ? rt.z - 2 : zFrente(s) - hueco(s) / 2 - Math.min(rc.ancho, e.fondo || FONDO_E) / 2 - 1, total = 3 + B.lejos + (R.lejos(s) ? 2.5 : 0);
    if (c.estado === 'yendo' && c.t > total * 0.5) llegar(rc, xs(c.sect) + sg * (ANCHO / 2 + 1.2 + rc.ancho * 0.5), zRoma(s) + 2, Math.PI, c.t - total * 0.5);      // primero corren por el costado de los suyos
    else llegar(rc, mx, mz, -sg * Math.PI / 2, c.estado === 'yendo' ? c.t : 0.3);
    if (c.estado === 'cargando') { rc.ataca = 3; rc.calma = -2; }
  } else { rc.tx = 0; rc.tz = zRoma(B.sect[1]) + ZCAB; rc.tyaw = Math.PI; rc.vQ = 14; }
  const n = B.num;
  if (n.estado === 'llega' || n.estado === 'hostiga') {
    const s = B.sect[n.sect], sg = lado(n.sect);
    llegar(rn, xs(n.sect) + sg * (ANCHO / 2 + 3.5), zRoma(s) + rn.ancho / 2 + 2, -sg * Math.PI / 2, n.estado === 'llega' ? n.t : 0.3); rn.giro = n.estado === 'hostiga' ? 1 : 0;
  } else { const sg = n.sect === 0 ? -1 : 1; rn.tx = sg * (MEDIO + 45); rn.tz = -(FONDO_E + LEJOS / 2 + 70); rn.tyaw = 0; rn.vQ = 16; rn.giro = 0; }
}

/* ---------- mover: una cuenta por regimiento, no por hombre ---------- */
const VREG = 3.4 + ANCHO * 0.11;
const porCerca = (a, b) => a.dc - b.dc;
function mover(dt) {
  /* se pinta de cerca a lejos (regimientos y hombres): lo que queda tapado no gasta */
  const fx = -Math.sin(cam.a), fz = -Math.cos(cam.a), px = camara.position.x, pz = camara.position.z; let k = 0;
  for (const rg of todos) { const h = F.filasDe(rg.n, rg.files) * rg.pz / 2; rg.dc = Math.hypot(rg.x - Math.sin(rg.yaw) * h - px, rg.z - Math.cos(rg.yaw) * h - pz); rg.un.uRev.value = Math.sin(rg.yaw) * fx + Math.cos(rg.yaw) * fz > 0 ? 1 : 0; }
  for (const rg of todos.slice().sort(porCerca)) rg.malla.renderOrder = 10 + k++;
  for (const rg of todos) {
    const u = rg.un;
    if (rg.est === 3) rg.tH += dt;
    else {
      const dx = rg.tx - rg.x, dz = rg.tz - rg.z, d = Math.hypot(dx, dz), v = rg.vQ || VREG, mueve = d > 0.15;
      if (mueve) { const p = Math.min(d, v * dt); rg.x += dx / d * p; rg.z += dz / d * p; }
      rg.anim = mueve && !(rg.ataca > 50) ? (rg.mont || (v > 5 && d > 1.5) ? 2 : 1) : 0;
      let g = rg.tyaw - rg.yaw; g = Math.atan2(Math.sin(g), Math.cos(g)); rg.yaw += g * Math.min(1, dt * 3.5);
      rg.pz += (rg.pzQ - rg.pz) * Math.min(1, dt * 4); rg.px += (rg.pxQ - rg.px) * Math.min(1, dt * 4); rg.cubre += (rg.cubreQ - rg.cubre) * Math.min(1, dt * 2.2);
    }
    const n = Math.ceil(rg.n); rg.g.instanceCount = rg.est === 3 && rg.tH > 17 ? 0 : n;
    u.uCentro.value.set(rg.x, rg.z); u.uYaw.value = rg.yaw; u.uVivos.value = n; u.uPaso.value.set(rg.px, rg.pz); u.uAnim.value = rg.anim; u.uAtaca.value = rg.ataca; u.uCalma.value = rg.calma; u.uHuida.value = rg.est === 3 ? rg.tH : -1; u.uGiro.value = rg.giro;
    const filas = F.filasDe(n, rg.files), m = rg.manto; m.visible = rg.est !== 3 && n > 0;
    if (m.visible) { m.position.set(rg.x + Math.sin(rg.yaw) * 0.6, 0.04, rg.z + Math.cos(rg.yaw) * 0.6); m.rotation.y = rg.yaw + Math.PI; m.scale.set(rg.files * rg.px + 0.9, 1, (filas - 1) * rg.pz + 1.5); }
    if (rg.techo) cubrir(rg, n, filas);
  }
}

/* ---------- escudos y testudo: un tejado de escudos pintados sobre el bloque (las figuras con el escudo en alto son de GM4) ---------- */
let TEJA = null;
function teja() {
  if (TEJA) return TEJA;
  const c = document.createElement('canvas'); c.width = 64; c.height = 96; const g = c.getContext('2d');
  g.fillStyle = '#240806'; g.fillRect(0, 0, 64, 96);
  g.fillStyle = '#a3231a'; g.beginPath(); g.roundRect(6, 6, 52, 84, 9); g.fill(); g.strokeStyle = '#d9b45a'; g.lineWidth = 3; g.stroke();
  g.strokeStyle = '#e9c063'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(32, 12); g.lineTo(32, 84); g.moveTo(10, 30); g.quadraticCurveTo(32, 44, 54, 30); g.moveTo(10, 66); g.quadraticCurveTo(32, 52, 54, 66); g.stroke();
  g.fillStyle = '#d8d2c2'; g.beginPath(); g.ellipse(32, 48, 10, 13, 0, 0, 7); g.fill();
  TEJA = new THREE.CanvasTexture(c); TEJA.colorSpace = THREE.SRGBColorSpace; TEJA.wrapS = TEJA.wrapT = THREE.RepeatWrapping; return TEJA;
}
const G_TECHO = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 1, 0.5);
const G_MURO = (() => { const g = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1).translate(0, 0.5, 0.5), i = g.index.array; g.setIndex([...i.slice(0, 12), ...i.slice(24, 36)]); return g; })();   // cuatro paredes, sin tapa ni suelo
function tejado() {
  const mapa = teja().clone(), mapaM = teja().clone(); mapa.needsUpdate = mapaM.needsUpdate = true;
  const mat = new THREE.MeshLambertMaterial({ map: mapa, transparent: true }), matM = new THREE.MeshLambertMaterial({ map: mapaM, transparent: true });
  const gr = new THREE.Group(), techo = new THREE.Mesh(G_TECHO, mat), muro = new THREE.Mesh(G_MURO, matM); gr.add(techo, muro); gr.visible = false; techo.renderOrder = muro.renderOrder = 55; escena.add(gr);
  return { gr, mapa, mapaM, mat, matM };
}
function cubrir(rg, n, filas) {
  const t = rg.techo, q = rg.cubre; t.gr.visible = q > 0.05 && rg.est !== 3 && n > 0; if (!t.gr.visible) return;
  const cuantas = Math.min(filas, q > 1 ? Math.ceil(3 + (filas - 3) * (q - 1)) : 3), anchoB = rg.files * rg.px + 0.25, hondo = (cuantas - 1) * rg.pz + 1.1, alto = 1.25 + 0.75 * Math.min(1, q);
  t.gr.position.set(rg.x + Math.sin(rg.yaw) * 0.55, 0, rg.z + Math.cos(rg.yaw) * 0.55); t.gr.rotation.y = rg.yaw + Math.PI; t.gr.scale.set(anchoB, alto, hondo);
  t.mapa.repeat.set(rg.files, cuantas); t.mapaM.repeat.set(rg.files, 1); t.mat.opacity = t.matM.opacity = Math.min(1, q * 1.6);
}

/* ---------- proyectiles: cada uno es una raya que vuela en arco. Su forma y color salen de la ficha del arma (ARMAS.vuelo) ---------- */
const NPRO = 900; let pro = null, kPro = 0;
function proyectiles() {
  const g = new THREE.InstancedBufferGeometry(); g.index = QUAD.index.clone(); g.setAttribute('position', QUAD.attributes.position.clone()); g.setAttribute('uv', QUAD.attributes.uv.clone());   // copias propias: al deshacer un regimiento no se lleva los datos de los demás
  const aS = new THREE.InstancedBufferAttribute(new Float32Array(NPRO * 4), 4), aT = new THREE.InstancedBufferAttribute(new Float32Array(NPRO * 4).fill(-999), 4), aC = new THREE.InstancedBufferAttribute(new Float32Array(NPRO * 4), 4);
  for (const a of [aS, aT, aC]) a.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aS', aS); g.setAttribute('aT', aT); g.setAttribute('aC', aC); g.instanceCount = NPRO;
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uT: COMUN.uT, uRes: COMUN.uRes, uDpr: { value: 1 } }, depthWrite: false, transparent: true,
    vertexShader: `attribute vec4 aS, aT, aC; uniform float uT, uDpr; uniform vec2 uRes; varying vec4 vC;
      vec4 arco(float g) { vec2 p = mix(aS.xy, aS.zw, g); return projectionMatrix * viewMatrix * vec4(p.x, 1.5 + aT.z * 4.0 * g * (1.0 - g) - 1.3 * g, p.y, 1.0); }
      void main() {
        float f = (uT - aT.x) / aT.y; vec4 c1 = arco(clamp(f, 0.0, 1.0)), c0 = arco(clamp(f - aT.w, 0.0, 1.0));
        vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * uRes * 0.5; float L = length(d); d = L > 0.001 ? d / L : vec2(0.0, 1.0);
        vec4 c = mix(c0, c1, uv.x); float mas = max(0.0, 3.0 * uDpr - L) * (uv.x - 0.5);
        c.xy += (vec2(-d.y, d.x) * (uv.y - 0.5) * aC.w * uDpr + d * mas) / uRes * 2.0 * c.w;
        gl_Position = f <= 0.0 || f >= 1.0 ? vec4(0.0, 0.0, -9.0, 1.0) : c; vC = vec4(aC.rgb * (0.75 + 0.25 * uv.x), 1.0);
      }`,
    fragmentShader: 'varying vec4 vC; void main() { gl_FragColor = vC; }' }));
  m.frustumCulled = false; m.renderOrder = 70; escena.add(m); pro = { m, aS, aT, aC }; return pro;
}
const COL = new THREE.Color(), O2 = {};
/* un proyectil del regimiento «de» al regimiento «a», con el arma «A». «filas» = hasta qué fila del blanco puede caer */
function lanza(de, a, A, retraso, filas) {
  if (!pro || !de || !a || de.n < 1 || a.n < 1) return; const v = A.vuelo, k = kPro++ % NPRO, o = k * 4;
  F.sitio(de, Math.floor(Math.random() * Math.min(Math.ceil(de.n), de.files * 4)), T, O); F.sitio(a, Math.floor(Math.random() * Math.min(Math.ceil(a.n), a.files * (filas || 5))), T, O2);
  const dist = Math.hypot(O2.x - O.x, O2.z - O.z), parte = Math.max(0.35, Math.min(1.2, dist / (A.alcance * ESC)));
  pro.aS.array.set([O.x, O.z, O2.x, O2.z], o); pro.aT.array.set([T + (retraso || 0), v.seg * parte * (0.85 + 0.3 * Math.random()), v.alto * parte * ESC, v.largo], o);
  COL.set(v.color); pro.aC.array.set([COL.r, COL.g, COL.b, v.grueso], o); pro.aS.needsUpdate = pro.aT.needsUpdate = pro.aC.needsUpdate = true;
}
function disparos(dt) {
  if (!pro) return; pro.m.material.uniforms.uDpr.value = dpr;
  for (const s of B.sect) for (const c of s.c) {
    const t = c.tir; if (!t || t.estado !== 'tira' || !t.blanco) continue;
    const de = regs.get(t), o = s.c[1 - c.lado], A = R.ARMAS[ficha(t.tipo).arma], aTir = o.tir && regs.get(o.tir), aLin = regs.get(R.frente(o)), pT = t.blanco === 'tir' ? 1 : t.blanco === 'ambos' ? 0.35 : 0;
    de.sale = (de.sale || 0) + dt * Math.max(4, Math.min(24, t.hombres * 0.1));
    while (de.sale >= 1) { de.sale--; lanza(de, Math.random() < pT ? aTir : aLin, A, 0, 8); }
  }
  if (B.num.estado === 'hostiga') { rn.sale = (rn.sale || 0) + dt * 14; const a = regs.get(R.frente(B.sect[B.num.sect].c[0])); while (rn.sale >= 1) { rn.sale--; lanza(rn, a, R.ARMAS[ficha(B.num.tipo).arma], 0, 6); } }
}
/* la descarga de pila: muchas a la vez, de las primeras filas a las primeras filas */
function salva(e) {
  const s = B.sect[e.sect], de = regs.get(R.frente(s.c[e.lado])), a = regs.get(R.frente(s.c[1 - e.lado])); if (!de || !a) return;
  for (let k = 0, n = Math.min(90, Math.ceil(de.n * 0.15)); k < n; k++) lanza(de, a, R.ARMAS[e.arma], Math.random() * 0.7, 3);
}

/* ---------- de cerca: figuras completas solo alrededor de donde mira la cámara, con tope ---------- */
const cand = [];
function detalle() {
  for (const m of figM.values()) m.malla.count = 0;
  nFig = 0; COMUN.uDet.value.z = -1;
  if (!MAXFIG || cam.d > 50) { sombras.count = 0; return; }
  const k = Math.min(cam.d * 0.32, 10), cx = cam.x + Math.sin(cam.a) * k, cz = cam.z + Math.cos(cam.a) * k, RM = 16; cand.length = 0;
  for (const rg of todos) {
    if (rg.est === 3 || rg.n < 1) continue;
    const sy = Math.sin(rg.yaw), cy = Math.cos(rg.yaw), ox = cx - rg.x, oz = cz - rg.z, lz = -(ox * sy + oz * cy), lx = ox * cy - oz * sy;
    const nn = Math.ceil(rg.n), Fi = rg.files, filas = Math.ceil(nn / Fi), m = RM + (rg.giro ? 4 : 1);
    if (lz < -m || lz > filas * rg.pz + m || Math.abs(lx) > Fi * rg.px / 2 + m) continue;
    const f0 = Math.max(0, Math.floor((lz - m) / rg.pz)), f1 = Math.min(filas - 1, Math.ceil((lz + m) / rg.pz));
    for (let f = f0; f <= f1; f++) {
      const enF = Math.min(Fi, nn - f * Fi), c0 = Math.max(0, Math.floor((lx - m) / rg.px + (enF - 1) / 2)), c1 = Math.min(enF - 1, Math.ceil((lx + m) / rg.px + (enF - 1) / 2));
      for (let c = c0; c <= c1; c++) { const id = f * Fi + c; F.sitio(rg, id, T, O); const d2 = (O.x - cx) * (O.x - cx) + (O.z - cz) * (O.z - cz); if (d2 < RM * RM) cand.push({ rg, id, d2 }); }
    }
  }
  let r2 = RM * RM; if (cand.length > MAXFIG) { cand.sort((a, b) => a.d2 - b.d2); r2 = cand[MAXFIG].d2; cand.length = MAXFIG; }
  COMUN.uDet.value.set(cx, cz, Math.sqrt(r2));
  const sm = sombras.instanceMatrix.array;
  for (const q of cand) {
    const rg = q.rg, m = figM.get(rg.tipo + rg.lado); if (!m) continue; F.sitio(rg, q.id, T, O);
    const C = m.u.clips, ph = F.h1(q.id) * 5, corre = rg.giro || rg.anim > 1;
    const fr = rg.giro || rg.anim ? frameOf(corre ? (C.run || C.walk) : C.walk, T + ph) : O.fila < rg.ataca && Math.sin(T * 0.8 + F.h2(q.id) * 19) > rg.calma ? frameOf(rg.tir && C.attack_ranged ? C.attack_ranged : C.attack_melee || C.attack_ranged, T + ph) : frameOf(C.idle, T + ph);
    const slot = m.malla.count++, o = slot * 16, a = m.malla.instanceMatrix.array, c = Math.cos(O.yaw) * UNIT_SCALE, s = Math.sin(O.yaw) * UNIT_SCALE;
    a[o] = c; a[o + 1] = 0; a[o + 2] = -s; a[o + 3] = 0; a[o + 4] = 0; a[o + 5] = UNIT_SCALE; a[o + 6] = 0; a[o + 7] = 0; a[o + 8] = s; a[o + 9] = 0; a[o + 10] = c; a[o + 11] = 0; a[o + 12] = O.x; a[o + 13] = 0; a[o + 14] = O.z; a[o + 15] = 1;
    m.fr.array[slot] = fr;
    const e = rg.mont ? 1.5 : 1, w = nFig++ * 16; sm[w] = e; sm[w + 1] = 0; sm[w + 2] = 0; sm[w + 3] = 0; sm[w + 4] = 0; sm[w + 5] = 1; sm[w + 6] = 0; sm[w + 7] = 0; sm[w + 8] = 0; sm[w + 9] = 0; sm[w + 10] = e; sm[w + 11] = 0; sm[w + 12] = O.x; sm[w + 13] = 0.06; sm[w + 14] = O.z; sm[w + 15] = 1;
  }
  for (const m of figM.values()) if (m.malla.count) { m.malla.instanceMatrix.needsUpdate = true; m.fr.needsUpdate = true; }
  sombras.count = nFig; sombras.instanceMatrix.needsUpdate = true; if (nFig > maxFig) maxFig = nFig;
}

/* ---------- campo: suelo, cielo, árboles, estandartes, polvo (todo a la medida del ejército) ---------- */
function campo() {
  const rnd = (() => { let s = 99; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  const dGen = Math.max(MEDIO * 1.04 / (Math.tan(27 * Math.PI / 180) * 390 / 844), 60, camaraMeta().d), lado = Math.max(900, dGen * 5), llano = MEDIO + FONDO_R + 40 + LEJOS / 2;
  escena.fog.near = dGen * 1.25 + 60; escena.fog.far = dGen * 3.6 + 500; COMUN.uNiebla.value.set(escena.fog.near, escena.fog.far);
  const g = new THREE.PlaneGeometry(lado, lado, 110, 110).rotateX(-Math.PI / 2), P = g.attributes.position, W = new Float32Array(P.count * 3), ez = CAMPO * 2 + 4 + LEJOS * 0.2, ex = MEDIO * 1.15;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i), n = 0.5 + 0.5 * Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.06 - 0.4) + 0.25 * Math.sin(x * 0.13 + z * 0.09);
    const pis = 0.55 * Math.exp(-(z * z) / (ez * ez)) * Math.exp(-(x * x) / (ex * ex));                       // tierra pisada donde se lucha
    W[i * 3] = Math.max(0, Math.min(0.75, 0.3 + 0.4 * n) * (1 - pis)); W[i * 3 + 1] = pis + 0.08 * Math.max(0, Math.sin(x * 0.21) * Math.sin(z * 0.17)); W[i * 3 + 2] = 0;
    const lejos = Math.hypot(x, z); if (lejos > llano) P.setY(i, Math.max(0, (lejos - llano) * 0.05 * (0.5 + 0.5 * Math.sin(x * 0.021 + 2) * Math.cos(z * 0.017))));
  }
  escena.add(new THREE.Mesh(g, applyGround(g, W, 0.09)));
  try { escena.add(crearCielo(sol.position.clone(), HORIZ, { uRuido: { value: texturaRuido() } })); } catch (e) { escena.background = new THREE.Color(HORIZ); console.warn('sin cielo', e); }
  const arboles = { cipres: [], olivo: [], pino: [] }, E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(), gr = 1 + ANCHO * 0.012;
  for (let k = 0; k < 190; k++) {
    const a = rnd() * Math.PI * 2, r = llano * (0.55 + rnd() * 1.9), x = Math.cos(a) * r * 1.25, z = Math.sin(a) * r - 20; if (Math.abs(x) < MEDIO + 14 && z > -(FONDO_E + LEJOS / 2 + 14) && z < ZCAB + LEJOS / 2 + 34) continue;
    const tipo = rnd() < 0.45 ? 'olivo' : rnd() < 0.6 ? 'cipres' : 'pino', e = UNIT_SCALE * (0.75 + rnd() * 0.6) * (tipo === 'pino' ? 0.8 : 1) * gr;
    arboles[tipo].push(new THREE.Matrix4().compose(V.set(x, 0, z), Q.setFromEuler(E.set(0, rnd() * 6.28, 0)), SC.set(e, e, e)));
  }
  for (const t in arboles) { const m = staticInstances(t, arboles[t]); if (m) escena.add(m); }
  /* un estandarte por cuerpo: es lo que se mira para saber cómo va */
  for (let l = 0; l < 2; l++) for (let i = 0; i < 3; i++) {
    const gr = new THREE.Group(), palo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.6, 6), new THREE.MeshLambertMaterial({ color: '#6b4a22' })); palo.position.y = 2.3; gr.add(palo);
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.35), new THREE.MeshLambertMaterial({ color: l === 0 ? '#c0281d' : '#6a45a8', side: THREE.DoubleSide })); tela.position.y = 3.75; gr.add(tela);
    const orla = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.14), new THREE.MeshLambertMaterial({ color: '#e9c063', side: THREE.DoubleSide })); orla.position.y = 4.5; gr.add(orla);
    escena.add(gr); estand.push({ gr, tela, l, i });
  }
  marca = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending })); marca.position.y = 0.05; marca.renderOrder = 2; escena.add(marca);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(polvoN * 3), 3)); pg.setAttribute('aV', new THREE.BufferAttribute(new Float32Array(polvoN), 1));
  polvo = new THREE.Points(pg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 300 } },
    vertexShader: 'attribute float aV; varying float vA; uniform float uT; void main(){ vA = aV; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(220.0, uT * (0.6 + aV) / -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * vA * 0.5; gl_FragColor = vec4(0.86, 0.78, 0.6, a); }' }));
  polvo.frustumCulled = false; polvo.renderOrder = 3; polvo.userData.p = Array.from({ length: polvoN }, (_, k) => ({ s: k % 3, v: Math.random(), x: Math.random() - 0.5, z: Math.random() - 0.5 })); escena.add(polvo);
  for (let i = 0; i < 3; i++) { const d = document.createElement('div'); d.className = 'pend'; d.innerHTML = '<span></span><em></em><i><b></b></i>'; $('pendones').appendChild(d); pend.push(d); }
  /* las figuras completas: una malla por tipo de tropa, vacía hasta que la cámara baja */
  for (const rg of todos) {
    const id = rg.tipo + rg.lado, u = getUnit(ficha(rg.tipo).carton); if (!u || !MAXFIG || figM.has(id)) continue;
    const g = instancedGeometry(u, MAXFIG), malla = new THREE.InstancedMesh(g, unitMaterialReal(u, COLOR[rg.lado]), MAXFIG); malla.frustumCulled = false; malla.count = 0; escena.add(malla);
    figM.set(id, { malla, fr: g.attributes.aFrame, u });
  }
  proyectiles();
  sombras = new THREE.InstancedMesh(new THREE.CircleGeometry(0.62, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#1a1408', transparent: true, opacity: 0.3, depthWrite: false }), Math.max(1, MAXFIG)); sombras.frustumCulled = false; sombras.renderOrder = 2; sombras.count = 0; escena.add(sombras);
}
function adornos(dt) {
  const grande = Math.max(1, Math.min(9, cam.d / 60));
  for (const e of estand) {
    const s = B.sect[e.i], c = s.c[e.l], dir = e.l === 0 ? 1 : -1; e.gr.visible = !c.roto && !(B.resultado && (B.resultado.como === 'victoria') === (e.l === 1));
    const rg = regs.get(c.lineas[0]), filas = rg ? F.filasDe(rg.n, FILES) : 1;
    const zz = (rg ? rg.z : zFrente(s)) + dir * (filas * 1.15 + 0.5); e.gr.position.x += ((rg ? rg.x : xs(e.i)) - e.gr.position.x) * 0.2; e.gr.position.z += (zz - e.gr.position.z) * Math.min(1, dt * 3); e.gr.scale.setScalar(grande);
    e.gr.rotation.z = Math.sin(T * 1.7 + e.i) * 0.03 + (1 - c.moral) * 0.22 * Math.sin(T * 3 + e.i); e.tela.scale.y = 0.35 + 0.65 * Math.max(0, c.moral); e.tela.position.y = 4.43 - 0.675 * e.tela.scale.y;
  }
  const c = B.sect[sel].c[0]; marca.visible = !c.roto && B.fase !== 'fin';
  if (marca.visible) { const f = c.fondo || 10; marca.scale.set(ANCHO + 1.6, 1, f); marca.position.x = xs(sel); marca.position.z = zFrente(B.sect[sel]) + hueco(B.sect[sel]) / 2 + f / 2 + 0.2; marca.material.opacity = 0.14 + 0.06 * Math.sin(T * 4); }
  const P = polvo.geometry.attributes.position.array, A = polvo.geometry.attributes.aV.array; polvo.material.uniforms.uT.value = alto * 1.6 * (1 + ANCHO * 0.07);
  polvo.userData.p.forEach((p, k) => {
    const s = B.sect[p.s], vivo = B.fase === 'lucha' && !R.lejos(s) && !s.c[0].roto && !s.c[1].roto, fuerza = vivo ? (s.c[0].postura === 'empujar' || s.c[1].postura === 'empujar' ? 1 : 0.5) : 0;
    p.v += dt * 0.28; if (p.v > 1) { p.v = 0; p.x = Math.random() - 0.5; p.z = Math.random() - 0.5; p.f = fuerza; }
    P[k * 3] = xs(p.s) + p.x * (ANCHO + 1); P[k * 3 + 1] = 0.4 + p.v * (3.2 + ANCHO * 0.06); P[k * 3 + 2] = zFrente(s) + p.z * (4 + ANCHO * 0.1); A[k] = (p.f || 0) * Math.sin(p.v * Math.PI);
  });
  polvo.geometry.attributes.position.needsUpdate = true; polvo.geometry.attributes.aV.needsUpdate = true;
}

/* ---------- cámara: vista general a la medida del ejército; baja sola a donde pasa algo, o cuando se pide «De cerca» ---------- */
/* GM8: la cámara que sigue a los jinetes va aquí: otra rama de camaraMeta que mire a (rc.x, rc.z) mientras B.cab no esté 'lista' */
function camaraMeta() {
  const i = foco.i >= 0 && T < foco.hasta ? foco.i : cerca ? sel : -1;
  if (i >= 0 && B.fase !== 'fin') { const s = B.sect[i], h = hueco(s) / 2; return { x: xs(i), y: 1.2, z: zFrente(s) + 1.5 + h * 0.8, d: (vertical ? 30 : 21) + Math.min(26, h * 0.5), p: 0.3 + Math.min(0.1, h * 0.004), a: (1 - i) * 0.3 + 0.28 }; }
  const tanV = Math.tan(camara.fov * Math.PI / 360), tanH = tanV * camara.aspect, p = vertical ? 0.48 : 0.42, hm = Math.max(...B.sect.map(hueco)), zm = B.sect.reduce((a, s) => a + zFrente(s), 0) / 3, hondo = (FONDO_R + FONDO_E + hm) / 2 + 6;
  return { x: 0, y: 0, z: zm + (FONDO_R - FONDO_E) * (vertical ? 0.5 : 0.36) + 2, d: Math.max(40, MEDIO * (vertical ? 1.04 : 1.2) / tanH, hondo * Math.sin(p) / (tanV * (vertical ? 0.62 : 0.5))), p, a: 0 };
}
const bajada = () => (foco.i >= 0 && T < foco.hasta) || cerca;
function moverCamara(dt, ya) {
  const m = camaraMeta(), k = ya ? 1 : 1 - Math.exp(-dt * 2.4); for (const q in m) cam[q] += (m[q] - cam[q]) * k;
  temblor = Math.max(0, temblor - dt * 1.6); const tb = temblor * 0.25 * Math.max(1, cam.d / 70);
  const cp = Math.cos(cam.p); camara.position.set(cam.x + Math.sin(cam.a) * cp * cam.d + Math.sin(T * 47) * tb, cam.y + Math.sin(cam.p) * cam.d + Math.sin(T * 53) * tb, cam.z + Math.cos(cam.a) * cp * cam.d);
  camara.lookAt(cam.x, cam.y, cam.z);
  if (!bajada()) camara.setViewOffset(ancho, alto, 0, alto * (vertical ? 0.1 : 0.14), ancho, alto); else camara.clearViewOffset();   // deja sitio a los botones de abajo
  camara.updateMatrixWorld(); COMUN.uCamR.value.setFromMatrixColumn(camara.matrixWorld, 0); COMUN.uCamU.value.setFromMatrixColumn(camara.matrixWorld, 1); COMUN.uCamAz.value = cam.a; COMUN.uT.value = T;
}
function mirar(i, seg, fuerte) { if (cerca) return; if (!fuerte && (T - foco.ultimo < 7 || (foco.i >= 0 && T < foco.hasta))) return; foco = { i, hasta: T + seg, ultimo: T + seg }; }

/* ---------- interfaz ---------- */
const ICONO = {
  avanzar: '<svg viewBox="0 0 24 24"><path d="M12 20V5M12 5l-6 6M12 5l6 6"/></svg>',
  escudos: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M12 7v10M8 12h8"/></svg>',
  testudo: '<svg viewBox="0 0 24 24"><path d="M3 17c0-6 4-10 9-10s9 4 9 10z"/><path d="M8 8.5V17M12 7v10M16 8.5V17M4 13h16"/></svg>',
  empujar: '<svg viewBox="0 0 24 24"><path d="M5 19L18 6M18 6h-5M18 6v5M4 14l6 6M7 17l-3 3"/></svg>',
  aguantar: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
  relevo: '<svg viewBox="0 0 24 24"><path d="M7 20V6M7 6l-3.5 3.5M7 6l3.5 3.5M17 4v14M17 18l-3.5-3.5M17 18l3.5-3.5"/></svg>',
  caballeria: '<span class="glifo">♞</span>',
};
const tinte = f => f < 0.45 ? 'var(--verde)' : f < 0.75 ? 'var(--ambar)' : 'var(--rojo)';
let cartaClave = '';
function pintarCartas(fuerza) {
  /* la tarjeta solo se rehace si cambia su forma (líneas, huida, acoso); los números se cambian en su sitio, para no perder toques */
  let clave = '';
  B.sect.forEach((s, i) => {
    const c = s.c[0], alerta = !c.roto && !R.lejos(s) && c.lineas.length > 1 && c.relevo <= 0 && (R.frente(c).fatiga > 0.75 || R.frente(c).hombres < 0.4 * R.frente(c).max) && c.lineas[1].fatiga < 0.5;
    c.alerta = alerta || (R.lejos(s) && R.bajoFuego(B, c) && c.postura === 'avanzar'); c.acoso = (B.num.estado === 'llega' || B.num.estado === 'hostiga') && B.num.sect === i; clave += (c.roto ? 'x' : c.lineas.length) + (c.acoso ? 'a' : '-');
  });
  if (fuerza || clave !== cartaClave) {
    cartaClave = clave;
    $('cuerpos').innerHTML = B.sect.map((s, i) => { const c = s.c[0]; return '<button class="cuerpo" data-i="' + i + '"><span class="nom">' + R.NOMBRE_SECTOR[i] + '</span>' + (c.roto ? '<span class="nom">ha huido</span>' : '<span class="escudos">' + (c.acoso ? '<span class="acoso">♞</span>' : '') + c.lineas.map(() => '<span class="esc"><b></b></span>').join('') + '</span><span class="hom"></span><span class="moral"><b></b></span>') + '</button>'; }).join('');
  }
  B.sect.forEach((s, i) => {
    const c = s.c[0], b = $('cuerpos').children[i], cls = 'cuerpo' + (i === sel ? ' sel' : '') + (c.roto ? ' roto' : '') + (c.alerta || c.acoso ? ' alerta' : ''); if (b.className !== cls) b.className = cls; if (c.roto) return;
    b.querySelectorAll('.esc b').forEach((e, k) => { const l = c.lineas[k]; e.style.height = Math.round(100 * l.hombres / l.max) + '%'; e.style.background = tinte(l.fatiga); });
    const t = miles(R.hombres(c)) + ' hombres', h = b.querySelector('.hom'); if (h.textContent !== t) h.textContent = t; b.querySelector('.moral b').style.width = Math.round(100 * Math.max(0, c.moral)) + '%';
  });
  const s = B.sect[sel], c = s.c[0], lej = R.lejos(s), ord = R.ordenesDe(B, sel), et = R.tirando(s.c[1]), leTiran = et && et.estado === 'tira';
  document.querySelectorAll('.orden').forEach((b, j) => {
    const o = ord[j], sub = b.querySelector('.sub');
    if (b.dataset.o !== o) { b.dataset.o = o; b.firstElementChild.outerHTML = ICONO[o]; b.querySelector('.que').textContent = R.ORDENES[o].que; sub.textContent = R.ORDENES[o].sub; }   // el botón cambia de oficio: lejos o luchando
    const no = R.puede(B, sel, o), activa = !c.roto && (c.cambio > 0 ? c.luego === o : c.postura === o);
    b.classList.toggle('activa', activa); b.classList.toggle('no', !!no && !activa);
    b.classList.toggle('pide', !no && ((o === 'relevo' && c.alerta) || (o === 'caballeria' && c.acoso) || (o === 'escudos' && leTiran && c.postura === 'avanzar') || (o === 'avanzar' && ((c.postura !== 'avanzar' && !leTiran && s.dist > 25) || (c.postura === 'testudo' && s.dist < 34))) || (!tocado && !lej && o === 'empujar')));
    if (o === 'testudo') sub.textContent = c.cambio > 0 ? 'deshaciéndolo…' : R.ORDENES[o].sub;
    if (o === 'relevo') sub.textContent = c.roto || c.lineas.length < 2 ? 'no queda nadie' : c.relevo > 0 ? 'relevando…' : 'entran ' + R.TROPAS[c.lineas[1].tipo].n;
    if (o === 'caballeria') { const k = B.cab, falta = k.estado === 'yendo' ? k.t + 21 : k.estado === 'cargando' ? k.t + 17 : k.t; sub.textContent = k.estado === 'lista' ? (et ? 'a sus ' + R.TROPAS[et.tipo].n : 'carga al flanco') : k.estado === 'volviendo' || k.estado === 'cargando' ? 'vuelve en ' + Math.ceil(falta) + ' s' : 'cargando…'; }
  });
  $('cuenta').textContent = 'Roma ' + miles(R.hombresLado(B, 0)) + ' · Enemigo ' + miles(R.hombresLado(B, 1)) + (fps ? ' · ' + Math.round(fps) + ' img/s' : '');
}
const V3 = new THREE.Vector3();
function pintarPendones() {
  B.sect.forEach((s, i) => {
    const e = s.c[1], d = pend[i]; if (e.roto || B.fase === 'fin') { d.hidden = true; return; } d.hidden = false;
    const rg = regs.get(e.lineas[0]); V3.set(rg ? rg.x : xs(i), 5.6, (rg ? rg.z : zFrente(s)) - (e.fondo || 6) * (bajada() ? 0.35 : 1) + 1).project(camara);
    const x = (V3.x * 0.5 + 0.5) * ancho, y = (-V3.y * 0.5 + 0.5) * alto - 34; d.style.transform = 'translate(' + Math.round(Math.max(40, Math.min(ancho - 40, x))) + 'px,' + Math.round(Math.max(vertical ? 112 : 76, y)) + 'px)';
    const lej = R.lejos(s), et = R.tirando(e), tiran = lej && et && et.estado === 'tira', fl = !lej && R.frente(e).fatiga > 0.6, carga = !lej && e.postura === 'empujar', cls = 'pend' + (carga || tiran ? ' carga' : fl ? ' flaquea' : ''), txt = lej ? (tiran ? 'tiran ' + R.ARMAS[R.TROPAS[et.tipo].arma].n : 'a ' + Math.round(s.dist) + ' m') : carga ? 'cargan' : fl ? 'flaquean' : 'aguantan', hom = miles(R.hombres(e));
    if (d.className !== cls) d.className = cls; if (d.firstChild.textContent !== txt) d.firstChild.textContent = txt; if (d.children[1].textContent !== hom) d.children[1].textContent = hom; d.lastChild.firstChild.style.width = Math.round(100 * Math.max(0, e.moral)) + '%';
  });
}
function cinta(texto, tono) { const c = $('cinta'); c.textContent = texto; c.className = 've' + (tono ? ' ' + tono : ''); cintaHasta = performance.now() + 2800; }
function eventos() {
  for (; nEv < B.eventos.length; nEv++) {
    const e = B.eventos[nEv];
    if (e.tipo === 'orden') { mirar(e.sect, 2.2, true); continue; }
    if (e.tipo === 'fin') { fin(); continue; }
    if (e.tipo === 'caballeria-lista') { if (performance.now() > cintaHasta) cinta(e.texto); continue; }
    if (e.tipo === 'pila') salva(e);
    if (e.tipo === 'tir-vuelven' || (e.tipo === 'lluvia' && !e.linea && avisoTir++) || (e.tipo === 'tir-tiran' && avisoTir2++)) continue;      // lo que se ve solo no hace falta decirlo cada vez
    const mala = ['carga-enemiga', 'numidas-aviso', 'cansados', 'linea-deshecha', 'lluvia', 'testudo-roto'].includes(e.tipo) || (e.tipo === 'roto' && e.lado === 0) || (e.tipo === 'envuelve' && e.lado === 1);
    const buena = ['enemigo-cede', 'impacto', 'numidas-fuera', 'calma', 'tir-tiran'].includes(e.tipo) || (e.tipo === 'pila' && e.lado === 0) || (e.tipo === 'roto' && e.lado === 1) || (e.tipo === 'envuelve' && e.lado === 0);
    cinta(e.texto, mala ? 'mala' : buena ? 'buena' : '');
    if (e.tipo === 'impacto' || e.tipo === 'choque') temblor = 1;
    if (e.tipo === 'roto' || e.tipo === 'impacto' || e.tipo === 'relevo' || e.tipo === 'caballeria') mirar(e.sect, e.tipo === 'caballeria' ? 6.5 + B.lejos : 3.2, true);
    else if (e.tipo === 'carga-enemiga' || e.tipo === 'envuelve' || e.tipo === 'numidas-aviso' || (e.tipo === 'lluvia' && e.linea) || e.tipo === 'choque' || e.tipo === 'pila') mirar(e.sect, 2.8, false);
    if (e.tipo === 'roto' && e.lado === 0 && e.sect === sel) { const j = [1, 0, 2].find(k => !B.sect[k].c[0].roto); if (j !== undefined) sel = j; }
  }
}
function fin() {
  const r = B.resultado, t = { victoria: 'Victoria', derrota: 'Derrota', retirada: 'Retirada' }[r.como], seg = Math.round(r.t), m = Math.floor(seg / 60), s = seg % 60;
  $('fin-t').textContent = t; $('fin-t').style.color = r.como === 'victoria' ? 'var(--oro)' : '#e0937f'; $('fin-p').textContent = r.motivo;
  $('fin-c').innerHTML = '<span>Tus bajas</span><b>' + miles(r.bajas[0]) + ' de ' + miles(r.inicial[0]) + '</b><span>Bajas enemigas</span><b>' + miles(r.bajas[1]) + ' de ' + miles(r.inicial[1]) + '</b><span>Caídos por proyectil</span><b>' + miles(B.porTiro[0]) + ' tuyos · ' + miles(B.porTiro[1]) + ' suyos</b><span>Duración</span><b>' + m + ' min ' + s + ' s</b><span>Fluidez en este móvil</span><b>' + (nMed ? Math.round(nMed / tMed) + ' imágenes por segundo' : 'sin medir') + '</b>';
  setTimeout(() => { $('fin').hidden = false; $('mando').hidden = true; $('arriba').hidden = true; $('cinta').className = ''; }, r.como === 'retirada' ? 0 : 1600);
}
function ordenar(o) {
  const no = R.ordenar(B, sel, o); tocado = true;
  if (no) cinta(no); else if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* sin vibración */ } }
  pintarCartas();
}
function elegir(i) { if (i === sel || B.fase === 'fin') return; sel = i; pintarCartas(); }
function verCerca(v) { cerca = v; foco.hasta = 0; $('ojo').classList.toggle('activa', v); $('ojo-t').textContent = v ? 'De lejos' : 'De cerca'; }

$('ordenes').addEventListener('click', e => { const b = e.target.closest('.orden'); if (b) ordenar(b.dataset.o); });
$('cuerpos').addEventListener('click', e => { const b = e.target.closest('.cuerpo'); if (b) elegir(+b.dataset.i); });
$('retirar').addEventListener('click', () => { if (B.fase === 'fin') return; pausa = true; $('salir').hidden = false; });
$('salir-no').addEventListener('click', () => { pausa = false; $('salir').hidden = true; });
$('salir-si').addEventListener('click', () => { pausa = false; $('salir').hidden = true; R.retirarse(B); eventos(); });
$('otra').addEventListener('click', () => { $('fin').hidden = true; $('mando').hidden = false; $('arriba').hidden = false; verCerca(false); montar(Math.floor(Math.random() * 1e6)); moverCamara(0, true); });
$('ojo').addEventListener('click', () => verCerca(!cerca));
$('talla').addEventListener('click', () => { pausa = true; $('tallas').hidden = false; });
$('tallas').addEventListener('click', e => { const b = e.target.closest('[data-h]'); if (!b) return; if (+b.dataset.h === HOMBRES || !+b.dataset.h) { pausa = false; $('tallas').hidden = true; } else { par.set('hombres', b.dataset.h); par.delete('semilla'); location.search = par.toString(); } });
/* tocar la tropa en el campo también la elige */
const rayo = new THREE.Raycaster(), plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), toque = { x: 0, y: 0, t: 0 };
lienzo.addEventListener('pointerdown', e => { toque.x = e.clientX; toque.y = e.clientY; toque.t = performance.now(); });
lienzo.addEventListener('pointerup', e => {
  if (!lista || pausa || Math.hypot(e.clientX - toque.x, e.clientY - toque.y) > 12 || performance.now() - toque.t > 600) return;
  rayo.setFromCamera(new THREE.Vector2(e.clientX / ancho * 2 - 1, -(e.clientY / alto) * 2 + 1), camara); const p = rayo.ray.intersectPlane(plano, V3); if (!p || Math.abs(p.x) > MEDIO + 3 || p.z > ZCAB + LEJOS + 20 || p.z < -(FONDO_E + LEJOS + 10)) return;
  elegir(Math.max(0, Math.min(2, Math.round(p.x / S) + 1)));
});

/* ---------- bucle ---------- */
function avanza(dt) { T += dt; R.paso(B, dt); eventos(); colocar(); mover(dt); disparos(dt); }
let antes = 0, acum = 0, cuadros = 0, lentos = 0, tHud = 0, fps = 0, nMed = 0, tMed = 0;
function cuadro(ahora) {
  requestAnimationFrame(cuadro);
  const bruto = (ahora - antes) / 1000 || 0, real = Math.min(0.1, bruto); antes = ahora;
  if (!lista) return;
  if (!pausa) {
    if (B.fase !== 'fin') { acum += real; while (acum >= 0.05) { avanza(0.05); acum -= 0.05; } }
    else { T += real; colocar(); mover(real); }
    if (bruto > 0 && bruto < 1) { fps = fps ? fps * 0.95 + 0.05 / bruto : 1 / bruto; if (B.fase !== 'fin') { nMed++; tMed += bruto; } }
  }
  adornos(real); moverCamara(real); detalle(); renderer.render(escena, camara); pintarPendones();
  if (ahora - tHud > 200) { tHud = ahora; pintarCartas(); if (ahora > cintaHasta) $('cinta').classList.remove('ve'); }
  /* si el móvil no puede, se baja la nitidez antes que la fluidez */
  if (cuadros < 240) { cuadros++; if (real > 0.04) lentos++; if (cuadros === 240 && lentos > 120 && dpr > 1) { dpr = Math.max(1, dpr * 0.6); renderer.setPixelRatio(dpr); medir(); } }
}

async function arrancar() {
  try {
    $('talla-t').textContent = miles(HOMBRES); document.querySelectorAll('#tallas [data-h]').forEach(b => b.classList.toggle('b', +b.dataset.h !== HOMBRES));
    const B0 = R.nueva(1, HOMBRES, RIVAL), tipos = [B0.cab.tipo, B0.num.tipo]; for (const q of B0.sect) for (const c of q.c) { for (const l of c.lineas) tipos.push(l.tipo); if (c.tir) tipos.push(c.tir.tipo); }
    for (let k = 0; k < tipos.length; k++) tipos[k] = ficha(tipos[k]).carton;      // cada tropa dice en su ficha qué modelo se fotografía
    await Promise.all([preload(tipos), loadGroundTextures().then(() => preloadStatic(['cipres', 'olivo', 'pino']))]);
    if (!getUnit('hastati')) throw new Error('No se han podido cargar los soldados');
    B = B0; montar(+(par.get('semilla') || 0) || Math.floor(Math.random() * 1e6)); campo(); moverCamara(0, true);
    lista = true; $('carga').hidden = true; $('mando').hidden = false; $('arriba').hidden = false; cinta('Se acercan. Cúbrete cuando tiren'); cintaHasta = performance.now() + 6000;
  } catch (e) { console.error(e); $('carga-p').textContent = 'No se ha podido cargar la batalla. Recarga la página.'; }
}
requestAnimationFrame(cuadro); arrancar();

/* ganchos para las pruebas y las capturas */
window.__gc = {
  get lista() { return lista; }, get B() { return B; }, R,
  ordenar: (i, o) => { sel = i; ordenar(o); }, elegir, cerca: verCerca,
  pausa: v => { pausa = v; },
  salta: seg => { for (let k = 0; k < seg * 20 && B.fase !== 'fin'; k++) avanza(0.05); },
  mirar: (i, seg) => { foco = { i, hasta: i < 0 ? 0 : T + seg, ultimo: T }; moverCamara(0, true); },
  estado: () => ({ t: B.t, fase: B.fase, sel, res: B.resultado, hombres: [Math.round(R.hombresLado(B, 0)), Math.round(R.hombresLado(B, 1))], jinetes: rc.cap + rn.cap, cartones: todos.reduce((a, r) => a + r.g.instanceCount, 0), figs: nFig, maxFig, tri: renderer.info.render.triangles, llamadas: renderer.info.render.calls, fps: Math.round(fps), dCam: Math.round(cam.d), ancho: Math.round(MEDIO * 2), dist: B.sect.map(s => Math.round(s.dist)), posturas: B.sect.map(s => s.c[0].postura), botones: [...document.querySelectorAll('.orden .que')].map(b => b.textContent), volando: pro ? Array.from({ length: NPRO }, (_, k) => (T - pro.aT.array[k * 4]) / pro.aT.array[k * 4 + 1]).filter(f => f > 0 && f < 1).length : 0, tejados: todos.filter(r => r.techo && r.techo.gr.visible).length, porTiro: B.porTiro.map(Math.round) }),
  /* mide la fluidez de verdad: n imágenes seguidas, con la batalla en marcha */
  medir: n => new Promise(ok => { let k = 0, t0 = 0, peor = 0, ult = 0; const f = t => { if (!t0) t0 = t; else peor = Math.max(peor, t - ult); ult = t; if (++k > n) ok({ ms: (t - t0) / n, peor }); else requestAnimationFrame(f); }; requestAnimationFrame(f); }),
};
