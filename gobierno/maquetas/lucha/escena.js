/* Maqueta TP9-0 «Lucha a pie»: tú en la primera fila, peleando con los dedos. Esta escena solo pinta y suena;
   lo que pasa lo deciden las reglas (reglas.js, que corren también en Node). Gestos: dedos.js. Interfaz: hud.js.
   Campo y sonido, los de la maqueta «Testudo a pie» (../a-pie/). Soldados: el soldado nuevo (js/gfx/soldado.js;
   MakeHuman y Quaternius, CC0). Sin postproceso ni sombras; todo se crea en la carga.
   ?semilla=N cambia el azar de la lucha. Gancho para pruebas: window.__lucha = { gesto(nombre), estado() }. */
import { THREE } from '../../../js/gfx/models.js';
import { cargarSoldado, tropa } from '../../../js/gfx/soldado.js';
import { crearCampo } from '../a-pie/campo.js';
import * as Son from '../a-pie/sonido.js';
import { crear, paso, resumen, rival, enLinea, DIST, N } from './reglas.js';
import { crearDedos } from './dedos.js';
import { crearHud } from './hud.js';

const Q = new URLSearchParams(location.search), $ = id => document.getElementById(id);
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const SEP = 0.95, Z_GALO = -1.6, Z_FILA2 = 1.0, Z_GALO2 = -2.7;
/* el suelo del testudo, llano donde se lucha */
const H = (x, z) => 3.4 * suave(-70, -103, z) * (1 + 0.06 * Math.sin(x * 0.07)) + suave(5, 14, Math.hypot(x, z)) * 0.22 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(z * 0.045 + 1.3) + 0.6 * suave(30, 90, Math.abs(x)) * Math.sin(z * 0.03);

/* ---------- motor, luz y cielo (los del testudo: sol bajo de frente y bruma) ---------- */
const lienzo = $('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const HORIZ = '#dcb888';
const escena = new THREE.Scene(); escena.background = new THREE.Color(HORIZ); escena.fog = new THREE.FogExp2('#c9a77a', 0.0045);
const camara = new THREE.PerspectiveCamera(55, 1, 0.08, 12000);
const SOL = new THREE.Vector3(0.13, 0.33, -0.94).normalize();
escena.add(new THREE.HemisphereLight(0xa9bcd8, 0x6e5a3e, 1.7));   /* relleno alto: a contraluz, los escudos romanos se veían negros */
const luz = new THREE.DirectionalLight(0xffcb90, 3.6); luz.position.copy(SOL).multiplyScalar(40); escena.add(luz);
const relleno = new THREE.DirectionalLight(0xbfc8d8, 2.0); relleno.position.set(0.15, 0.5, 1);   /* desde la cámara */ escena.add(relleno);
/* el campo pide los retoques de luz del testudo; aquí basta con darle sus valores (sin el borde de contraluz) */
const cine = (sh, borde) => { sh.uniforms.uBorde = { value: borde || 0 }; sh.uniforms.uAmb = { value: 1 }; sh.uniforms.uTrasluz = { value: 0 }; };
const sueloCine = sh => cine(sh, 0);
{ const t = new THREE.TextureLoader().load('gobierno/maquetas/testudo-luz-campo/arte/cielo.jpg'); t.colorSpace = THREE.SRGBColorSpace;
  const c = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false, color: '#f0dcc0' }));
  c.renderOrder = -10; c.frustumCulled = false; escena.add(c); }

/* chispa del rebote */
const chispa = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.translate(32, 32);
  for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); const l = i % 2 ? 14 : 28, r = g.createLinearGradient(0, 0, l, 0); r.addColorStop(0, 'rgba(255,255,220,1)'); r.addColorStop(1, 'rgba(255,190,60,0)'); g.fillStyle = r; g.fillRect(0, -1.5, l, 3); }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.scale.set(0.35, 0.35, 1); s.visible = false; escena.add(s); return s; })();

/* ---------- figuras ---------- */
let S, T = {}, ROM = null, GAL = null, comps = [], vivos = new Map(), yoF, ultimo = 0, parada = 0, sacude = 0, chispaT = 0, ayudaCerrada = false;
const M4 = new THREE.Matrix4(), Qt = new THREE.Quaternion(), P = new THREE.Vector3(), E3 = new THREE.Vector3(), EJE = new THREE.Vector3(0, 1, 0), V = new THREE.Vector3();
const azarV = (k => () => { k = (k * 16807) % 2147483647; return (k - 1) / 2147483646; })(91);
function figura(x, z, semilla) { return { x, z, tx: x, tz: z, giro: 0, semilla, talla: 0.96 + 0.08 * azarV(), clip: 'guardia', t: azarV() * 3, espejo: false }; }
function var4(s) { const r = k => { const v = Math.sin(s * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); }; return [r(1), r(2), r(3), r(4)]; }
/* pone una figura en la tropa que le toca (fina si está cerca de ti) */
function dibuja(f, fina, R, giroBase) {
  const tr = fina ? R.fina : R.lejos, i = tr.sig(); if (i < 0) return;
  P.set(f.x, H(f.x, f.z), f.z); Qt.setFromAxisAngle(EJE, giroBase + f.giro); const an = 0.95 + 0.12 * (Math.abs(Math.sin(f.semilla * 91.7)) % 1);
  E3.set(f.talla * an * (f.espejo ? -1 : 1), f.talla, f.talla * an); M4.compose(P, Qt, E3); tr.matriz(i, M4.elements); tr.vars(i, var4(f.semilla));
  tr.pose(i, f.clip, f.t, tr.muestra(f.clip, f.t));
}
const acerca = (f, dt, k = 8) => { const a = 1 - Math.exp(-dt * k); f.x += (f.tx - f.x) * a; f.z += (f.tz - f.z) * a; };

/* golpear: 0,2 s el brazo arriba, 0,5 s el golpe, 1,2 s de vuelta (medidas del clip). Mapa del tiempo de la acción al del clip */
function tiempoGolpe(t, ant, gol, rec) { return t < ant ? 0.2 * t / ant : t < ant + gol ? 0.2 + 0.3 * (t - ant) / gol : Math.min(1.2, 0.5 + 0.7 * (t - ant - gol) / rec); }

function reinicia() {
  S = crear(+(Q.get('semilla') || 0) || Math.floor(Math.random() * 1e6));
  comps = []; for (let c = 0; c < N; c++) if (c !== S.yo.puesto) comps.push({ ...figura((c - 3) * SEP, -0.3, 10 + c), puesto: c, fila: 1 });
  for (let c = 0; c < N; c++) comps.push({ ...figura((c - 3) * SEP, Z_FILA2, 30 + c), puesto: c, fila: 2 });
  yoF = figura(0, 0.4, 3.3); yoF.talla = 1.0;
  vivos = new Map(); for (const col of S.cols) { const g = col.frente; vivos.set(g, { ...figura((g.c - 3) * SEP, Z_GALO, g.semilla), talla: g.talla }); }
  ROM.reserva = []; for (let c = 0; c < N; c++) ROM.reserva.push(figura((c - 3) * SEP + 0.1, Z_GALO2, 60 + c));
  muertos = []; huyen = 0; $('fin').hidden = true;
}
let muertos = [], huyen = 0;

/* ---------- lo que pasa: efectos de los hechos ---------- */
function rivalPantalla() { const g = rival(S), f = g && vivos.get(g); V.set(f ? f.x : yoF.x, 1.75, f ? f.z : yoF.z - 1.5).project(camara); return [(V.x + 1) / 2 * innerWidth, (1 - V.y) / 2 * innerHeight]; }
function efectos(Hs) {
  for (const h of Hs) {
    const [ex, ey] = rivalPantalla(), eco = (t, c) => hud.eco(t, c, ex, ey);
    switch (h.tipo) {
      case 'golpe': parada = 0.07; sacude = 0.18; eco(h.mata ? '¡Cae!' : '¡Buen golpe!', 'bien'); Son.hierro(0, 0, 1); Son.herido(0, 0.05); break;
      case 'rebote': { eco('Rebota', 'mal'); Son.hierro(0, 0, 0.8); Son.madera(0.6); const g = rival(S), f = g && vivos.get(g); if (f) { chispa.position.set(f.x + (g.lado === 'izq' ? -0.25 : 0.25), 1.2, f.z + 0.35); chispa.visible = true; chispaT = 0.12; } break; }
      case 'parada': eco('¡Parado!', 'bien'); Son.madera(1.2); Son.hierro(0, 0.02, 0.7); break;
      case 'bloqueo': eco('Bloqueado'); Son.madera(1); break;
      case 'rajado': eco('Tu escudo se raja', 'mal'); break;
      case 'roto': eco('Tu escudo se rompe', 'mal'); Son.crac(); break;
      case 'herido': sacude = 0.3; eco(h.como === 'flanco' ? 'Te hieren por el flanco' : h.como === 'contra' ? '¡Contraataque!' : 'Herido', 'mal'); Son.herido(0); Son.hierro(0, 0, 0.9); break;
      case 'remate': eco('¡Bien, ' + h.nombre + '!', 'bien'); Son.hierro(0.4, 0, 1); Son.voz('Ea'); break;
      case 'empujon': Son.esfuerzo(0, 1); Son.madera(1.1); break;
      case 'corto': eco('No llegas: acércate'); break;
      case 'hueco': eco('Nadie delante: muévete a un lado'); break;
      case 'contra': eco('¡Cuidado, contraataque!', 'mal'); break;
      case 'descubierto': eco('Descubierto', 'mal'); break;
      case 'sinAliento': eco('Sin aliento', 'mal'); break;
      case 'rodeado': eco('Te rodean: cede un paso', 'mal'); Son.voz('grito'); break;
      case 'paso': { const c = comps.find(k => k.fila === 1 && k.puesto === h.puesto); if (c) c.puesto = h.puesto + (h.lado === 'izq' ? 1 : -1); break; }
      case 'retirada': { const c = comps.find(k => k.fila === 2 && k.puesto === S.yo.puesto); if (c) c.fila = 1; } eco('A la segunda fila: recobra el aliento'); break;
      case 'vuelve': { const c = comps.find(k => k.fila === 1 && k.puesto === S.yo.puesto); if (c) c.fila = 2; } eco('A la primera fila'); break;
      case 'ajeno': if (h.c !== undefined && Math.abs(h.c - S.yo.puesto) <= 2) Son.madera(0.35, (h.c - S.yo.puesto) * 0.4); break;
      case 'cae': if (h.yo) { setTimeout(() => hud.fin('caido'), 1400); } else { const g = [...vivos.keys()].find(k => k.c === h.c && k.vida <= 0); if (g) { const f = vivos.get(g); muertos.push({ ...f, clip: 'morir', t: 0 }); vivos.delete(g); } } break;
      case 'llega': if (h.viene) { const g = S.cols[h.c].frente, r = ROM.reserva[h.c]; vivos.set(g, { ...(r || figura((h.c - 3) * SEP, Z_GALO2, g.semilla)), talla: g.talla, semilla: g.semilla }); ROM.reserva[h.c] = null; } break;
      case 'rompe': Son.voz('Victoria'); setTimeout(() => hud.fin('rompe'), 2200); break;
    }
  }
}

/* ---------- cada fotograma: posiciones y movimientos ---------- */
function actualiza(dt) {
  const y = S.yo, r = resumen(S), linea = enLinea(S);
  /* tú */
  const xY = (y.puesto - 3) * SEP; yoF.tx = xY; yoF.tz = y.fila === 2 ? Z_FILA2 : Z_GALO + DIST[y.dist];
  const a = y.acc; let adel = 0; yoF.giro = 0;
  if (S.fin === 'caido') { yoF.clip = 'morir'; yoF.t += dt; }
  else if (S.t - y.enc < 0.37) { yoF.clip = 'encajar'; yoF.t = S.t - y.enc; }
  else if (a && a.tipo === 'estocada') { yoF.clip = 'golpear'; yoF.t = tiempoGolpe(a.t, 0.06, 0.09, a.dur - 0.15); adel = -0.22 * Math.sin(Math.min(1, a.t / 0.25) * Math.PI); }
  else if (a && a.tipo === 'tajo') { yoF.clip = 'golpear'; yoF.t = tiempoGolpe(a.t, 0.12, 0.1, a.dur - 0.22); yoF.giro = (a.lado === 'izq' ? 0.5 : -0.5) * Math.sin(Math.min(1, a.t / a.dur) * Math.PI); adel = -0.1 * Math.sin(Math.min(1, a.t / 0.3) * Math.PI); }
  else if (a && a.tipo === 'empujon') { yoF.clip = 'cubrirse'; yoF.t = Math.min(0.42, a.t * 2); adel = -0.38 * Math.sin(Math.min(1, a.t / a.dur) * Math.PI); }
  else if (y.alzado) { yoF.clip = 'cubrirse'; yoF.t = Math.min(0.42, (S.t - y.tAlzo) * 3.5); }
  else if (y.mov) { yoF.clip = 'andar'; yoF.t += dt; }
  else { yoF.clip = 'guardia'; yoF.t += dt; }
  acerca(yoF, dt, y.mov && y.mov.tipo === 'paso' ? 14 : 9); yoF.adel = adel; const yz = yoF.z + adel;
  /* compañeros: cada uno tiene su puesto y su fila; los cambios (paso, retirada, vuelta) los hace efectos() */
  for (const c of comps) {
    c.tx = (c.puesto - 3) * SEP; c.tz = c.fila === 1 ? -0.3 : Z_FILA2; acerca(c, dt, 5);
    const k = S.comp[c.puesto]; if (c.fila === 1 && k && S.t - k.t0 < (k.clip === 'golpear' ? 1.4 : 1.1)) { c.clip = k.clip; c.t = k.clip === 'cubrirse' ? Math.min(0.42, (S.t - k.t0) * 2) : S.t - k.t0; }
    else if (Math.hypot(c.tx - c.x, c.tz - c.z) > 0.08) { c.clip = 'andar'; c.t += dt; } else { c.clip = c.fila === 1 ? 'guardia' : 'quieto'; c.t += dt; }
  }
  /* galos */
  for (const [g, f] of vivos) {
    const mio = g.c === y.puesto && linea;
    f.tx = (g.c - 3) * SEP; f.tz = mio ? Math.min(Z_GALO, yz - DIST[y.dist]) : Z_GALO; f.espejo = g.lado === 'izq'; f.giro = 0;
    if (S.fin === 'rompe') { f.giro = Math.PI; f.clip = 'correr'; f.t += dt; f.tz = f.z - 6; acerca(f, dt, 0.8); continue; }
    switch (g.estado) {
      case 'llega': f.clip = 'andar'; f.t += dt; break;
      case 'guardia': f.clip = 'guardia'; f.t += dt; break;
      case 'arma': { const k = g.t / g.dur, sube = g.rapido ? 0.55 : 0.85; f.clip = 'golpear'; f.t = k < sube ? 0.2 * k / sube : 0.2 + 0.3 * (k - sube) / (1 - sube); break; }
      case 'tras': f.clip = 'golpear'; f.t = 0.5 + 0.7 * g.t / g.dur; break;
      case 'abierto': f.clip = 'encajar'; f.t = Math.min(0.36, g.t * 0.5); f.giro = 0.35; break;
      case 'deseq': f.clip = 'encajar'; f.t = Math.min(0.36, g.t * 0.6); f.tz -= 0.45; f.giro = -0.3; break;
      case 'encaja': f.clip = 'encajar'; f.t = g.t; break;
    }
    acerca(f, dt, g.estado === 'deseq' ? 10 : 6);
  }
  for (const m of muertos) { m.t += dt; m.clip = 'morir'; }
  if (S.fin === 'rompe') { huyen += dt; for (const r of ROM.reserva) if (r) { r.giro = Math.PI; r.clip = 'correr'; r.t += dt; r.z -= dt * 4; } }
  for (const r of ROM.reserva) if (r && S.fin !== 'rompe') { r.clip = 'guardia'; r.t += dt; }
}

function pinta() {
  for (const k in T) T[k].fina.limpiar(), T[k].lejos.limpiar();
  const p = S.yo.puesto, cerca = c => Math.abs(c - p) <= 1;
  dibuja({ ...yoF, z: yoF.z + (yoF.adel || 0) }, true, T.yo, Math.PI);
  for (const c of comps) { if (c.fila === 2 && S.yo.fila === 1 && Math.abs(c.puesto - p) <= 1) continue;   /* los tres de detrás (entre la cámara y tú) no se pintan; reaparecen al relevarte */
    dibuja(c, c.fila === 1 && cerca(c.puesto), T.rom, Math.PI); }
  for (const [g, f] of vivos) dibuja(f, cerca(g.c), T.gal, 0);
  for (const m of muertos) dibuja(m, false, T.gal, 0);
  for (let c = 0; c < N; c++) { const r = ROM.reserva[c]; if (r) dibuja(r, false, T.gal, 0); }
}

/* ---------- cámara: sobre tu hombro derecho, mirando al pecho del rival ---------- */
let ancho = 0, alto = 0; const cam = { x: 0, y: 1.7, z: 2, mx: 0, my: 1.3, mz: -2, kd: 0 };
function encaja() { ancho = innerWidth; alto = innerHeight; renderer.setSize(ancho, alto, false); camara.aspect = ancho / alto; camara.fov = ancho < alto ? 62 : 50; camara.updateProjectionMatrix(); }
function camaraPaso(dt) {
  const g = rival(S), f = g && vivos.get(g), inc = dedos.inclina, k = 1 - Math.exp(-dt * 6), vert = ancho < alto;
  /* tres cuartos sobre tu hombro derecho: más a un lado cuanto más cerca estás (kd: 0 lejos, 1 pegado); mira entre su pecho y tu cabeza */
  cam.kd += (S.yo.dist / 2 - cam.kd) * k; const yz = yoF.z + (yoF.adel || 0);
  const tx = yoF.x + 0.80 + 0.35 * cam.kd + inc.x * 0.12, ty = (vert ? 2.25 : 2.1) - inc.y * 0.06,   /* más alta que el diseño (1,95): por encima del escudo del compañero de la derecha */ tz = yz + 1.35 + inc.y * 0.1;
  const rx = f ? f.x : yoF.x, rz = f ? f.z : yz - 1.6, mx = rx + (yoF.x - rx) * 0.15, mz = rz + (yz - rz) * 0.15, my = 1.25 + (1.6 - 1.25) * 0.3;
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.z += (tz - cam.z) * k; cam.mx += (mx - cam.mx) * k; cam.my += (my - cam.my) * k; cam.mz += (mz - cam.mz) * k;
  const s = sacude > 0 ? sacude * 0.12 : 0;
  camara.position.set(cam.x + (azarV() - 0.5) * s, cam.y + (azarV() - 0.5) * s, cam.z); camara.lookAt(cam.mx, cam.my, cam.mz);
}

/* ---------- bucle ---------- */
const tiempos = []; let medT = 0;
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dtR = Math.min(0.1, (ahora - ultimo) / 1000 || 0); ultimo = ahora;
  tiempos.push([ahora, dtR * 1000]); while (tiempos.length && ahora - tiempos[0][0] > 5000) tiempos.shift();
  medT -= dtR; if (medT <= 0 && tiempos.length > 2) { medT = 0.5; const span = (ahora - tiempos[0][0]) / 1000; hud.medidor((tiempos.length - 1) / Math.max(0.001, span), Math.max(...tiempos.map(t => t[1]))); }
  let dt = dtR; if (parada > 0) { parada -= dtR; dt = 0; } sacude = Math.max(0, sacude - dtR); if (chispaT > 0) { chispaT -= dtR; if (chispaT <= 0) chispa.visible = false; }
  const pide = ayudaCerrada ? dedos.toma() : { gestos: [], escudo: false };
  if (dt > 0) efectos(paso(S, dt, pide)); else dedos.toma();
  actualiza(dt); pinta(); camaraPaso(dtR); campo.tick(ahora / 1000);
  hud.pinta(resumen(S));
  renderer.render(escena, camara);
}

const hud = crearHud({ otra: () => reinicia() });
const dedos = crearDedos(lienzo, hud);
let campo = { tick() {} };
$('ayuda').addEventListener('pointerdown', () => { ayudaCerrada = true; try { Son.inicia(); } catch (e) { /* sin sonido */ } });
addEventListener('resize', encaja);
window.__lucha = { gesto: g => { ayudaCerrada = true; $('ayuda').hidden = true; dedos.gesto(g); }, estado: () => ({ ...resumen(S), llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles }), S: () => S };

(async () => {
  const [rom, gal, yo] = await Promise.all([cargarSoldado('hastatus'), cargarSoldado('galo'), cargarSoldado('hastatus')]);
  if (!rom || !gal || !yo) { $('carga').querySelector('p').textContent = 'No se han podido cargar los soldados'; throw new Error('Sin soldados'); }
  ROM = { alto: rom.alto, reserva: [] }; GAL = gal;
  T.rom = { fina: tropa(rom.niveles[0], 4), lejos: tropa(rom.niveles[1], 14) };
  /* tú: un hastatus aparte con las plumas del casco en rojo. Las plumas no van en la máscara de color (son negras en la textura).
     Se tiñe por la pose de REPOSO: lo que va con el hueso de la cabeza y queda por encima de la coronilla del casco es penacho.
     Medido en assets/soldados/hastatus (vértices de la cabeza): el casco llega a 1,79 m con su botón; las plumas, de 1,80 a 2,11 */
  { const m = yo.niveles[0].mat, antes = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { antes(sh, r);
      sh.vertexShader = 'varying float vPen;\n' + sh.vertexShader.replace('vVar = aVar;', 'vVar = aVar; vPen = (abs(aSkinI.x - uCab.w) < 0.5 && position.y > 1.795) ? 1.0 : 0.0;');
      sh.fragmentShader = 'varying float vPen;\n' + sh.fragmentShader.replace('{ float alto = vObj.y;', '{ float lu = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.06, 0.04) * (0.7 + 5.0 * lu), step(0.5, vPen)); }\n  { float alto = vObj.y;'); };
    m.customProgramCacheKey = () => 'lucha-yo-penacho'; const t = tropa(yo.niveles[0], 1); T.yo = { fina: t, lejos: t }; }
  T.gal = { fina: tropa(gal.niveles[0], 8), lejos: tropa(gal.niveles[1], 32) };
  for (const k in T) { escena.add(T[k].fina.malla); escena.add(T[k].lejos.malla); }
  campo = await crearCampo(escena, { H, SOL, cine, sueloCine, BRUMA: escena.fog.color });
  encaja(); reinicia(); actualiza(0); pinta(); camaraPaso(1);
  renderer.compile(escena, camara);
  $('carga').hidden = true;
  requestAnimationFrame(t => { ultimo = t; bucle(t); });
})();
