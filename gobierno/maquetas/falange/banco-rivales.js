/* AQVILA — FA7: banco de pruebas de los rivales de la falange a pie. No es la escena del juego (esa es escena.js, de FA4).
   Monta un suelo sencillo, el motor real (js/falange.js) con un rival (js/falange-rivales.js), mi muro de relleno y el dibujo del rival (rival.js).
   URL: rival=caballeria|elefantes|falange|hoplitas · semilla=N · bot=gana|pierde|nada · vista=muro|hombro|choque|alto|lado · salta=SEG · parar=1
   window.__fa7 = { lista, S, F, RIV, salta(seg), hasta(tipo, max, extra), parar(v), vista(n), peso(), avisos, errores }.
   Soldados: arte de 0 A.D. (Wildfire Games, CC BY-SA 3.0). */
import { THREE } from '../../../js/gfx/models.js';
import { crearFalange, GIRO_MAX, V_GIRO } from '../../../js/falange.js';
import { rivalDe, GRADO } from '../../../js/falange-rivales.js';
import { montaRivalDe, crearTropa, crearSombras, crearSarisas, cargaArte, figura, sigue, muerte, clipMarcha, dado, V_PIE, G_RAPIDO } from './rival.js';

const Q = new URLSearchParams(location.search), NOMBRE = Q.get('rival') || 'falange', SEMILLA = +(Q.get('semilla') || 1), BOT = Q.get('bot') || 'gana';
const DT = 1 / 30, errores = [], avisos = [];
addEventListener('error', e => errores.push(String(e.message || e)));
addEventListener('unhandledrejection', e => errores.push(String(e.reason)));
const __fa7 = window.__fa7 = { lista: false, S: null, F: null, RIV: null, avisos, errores, salta, parar, vista, peso, hasta };

/* ---------- los bots de test/falange-rivales.test.mjs (solo avisos y S.riv.fase) ---------- */
const baja = F => { for (let i = 0; i < 5; i++) F.fila(i, true); };
const pon = (F, n) => { const k = n === 'empujad' ? 'empujar' : n; if (F.S.orden !== k) F.orden(n); };
const difAng = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
function botCaballeria() {   /* gira al aviso; a la espalda, «Cerrar filas» */
  let meta = 0;
  const decide = (F, ang) => { if (Math.abs(ang) <= 110 * GRADO) { meta = Math.max(-GIRO_MAX, Math.min(GIRO_MAX, ang)); pon(F, 'aguantar'); } else pon(F, 'cerrar'); };
  return {
    inicio(F) { baja(F); },
    aviso(F, tipo, d) {
      if (tipo === 'rumbo') decide(F, difAng(d.angulo, 0));
      else if (tipo === 'finta') { const ang = difAng(d.angulo, 0), alcanza = Math.abs(ang) <= 110 * GRADO && Math.abs(difAng(Math.max(-GIRO_MAX, Math.min(GIRO_MAX, ang)), F.S.giro)) - 20 * GRADO <= V_GIRO * d.t; if (alcanza) decide(F, ang); else pon(F, 'cerrar'); }
    },
    paso(F) { if (F.S.riv.fase === 'vuelve') { meta = 0; pon(F, 'aguantar'); } const d = difAng(meta, F.S.giro); F.gira(Math.abs(d) < 1 * GRADO ? 0 : d); },
  };
}
const quieto = { inicio(F) { baja(F); }, aviso() {}, paso() {} };
function botElefantes() {    /* alza en la salva y baja al barrito; con hueco, «Cerrar filas» */
  return {
    inicio(F) { baja(F); pon(F, 'aguantar'); },
    aviso(F, tipo) {
      if (tipo === 'salva') for (let i = 0; i < 5; i++) F.fila(i, false);
      if (tipo === 'barrito') for (let i = 0; i < 5; i++) F.fila(i, true);
      if (tipo === 'hueco') F.cuelan = true;
      if (tipo === 'cerrado') { F.cuelan = false; pon(F, 'aguantar'); }
    },
    paso(F, dt) { if (F.cuelan && (F.tDec = (F.tDec || 0) + dt) >= 1) { F.tDec = 0; pon(F, 'cerrar'); } },
  };
}
const nuncaBaja = { inicio(F) { for (let i = 0; i < 5; i++) F.fila(i, false); }, aviso() {}, paso() {} };
function botEmpuje() {       /* a compás; en la oleada aguanta y en el cansancio empuja */
  let prev = 0;
  return {
    inicio(F) { baja(F); pon(F, 'empujar'); },
    aviso(F, tipo) { if (tipo === 'oleada') pon(F, 'aguantar'); if (tipo === 'gastado') pon(F, 'empujar'); },
    paso(F) { const p = F.S.pulso; if (p < prev && F.S.orden === null && F.S.riv.fase !== 'prepara' && F.S.riv.fase !== 'oleada') pon(F, 'empujar'); if (p < prev) F.toque(); prev = p; },
  };
}
const aDestiempo = () => ({ prev: 0, inicio(F) { baja(F); pon(F, 'empujar'); }, aviso() {}, paso(F) { const p = F.S.pulso; if (this.prev < 0.5 && p >= 0.5) F.toque(); this.prev = p; } });
const BOTS = {
  caballeria: { gana: botCaballeria, pierde: () => quieto },
  elefantes: { gana: botElefantes, pierde: () => nuncaBaja },
  falange: { gana: botEmpuje, pierde: aDestiempo },
  hoplitas: { gana: botEmpuje, pierde: aDestiempo },
};
const nada = { inicio() {}, aviso() {}, paso() {} };

/* ---------- escena: suelo, luz y niebla ---------- */
const lienzo = document.getElementById('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; renderer.info.autoReset = true;
const escena = new THREE.Scene(); escena.background = new THREE.Color('#b9c6cf'); escena.fog = new THREE.Fog('#b9c6cf', 60, 220);
escena.add(new THREE.HemisphereLight('#fff4dc', '#5a4a34', 1.6));
const sol = new THREE.DirectionalLight('#fff1d6', 2.4); sol.position.set(-30, 50, 20); escena.add(sol);
const suelo = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#8a7f52' })); escena.add(suelo);
const camara = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.2, 600);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); });

/* ---------- motor real y bot ---------- */
const cola = [];
let RIV = null;
const avisa = (tipo, datos) => { avisos.push(tipo); cola.push([tipo, datos]); if (RIV) RIV.aviso(tipo, datos); };
const F = crearFalange({ semilla: SEMILLA, rival: rivalDe(NOMBRE), avisa });
const bot = BOT === 'nada' ? nada : ((BOTS[NOMBRE] || BOTS.falange)[BOT] || BOTS.falange.gana)();
__fa7.F = F; __fa7.S = F.S;
if (bot.inicio) bot.inicio(F);

/* ---------- mi muro de relleno: falangitas azules y sus sarisas según kB ---------- */
let mio = null; const DM = new Map(), azM = dado(11); let Tm = 0;
async function montaMio() {
  if (!(await cargaArte(['falange']))) return;
  const n = F.S.fal.length;
  mio = { tropa: crearTropa('falange', n, { escena, color: '#2a56b8' }), sombras: crearSombras(escena, n), sar: crearSarisas(escena, n) };
}
function pasoMio(dt) {
  if (!mio) return; Tm += dt; const C = mio.tropa.C;
  F.S.fal.forEach((h, i) => {
    let d = DM.get(h); if (!d) { d = figura(azM); DM.set(h, d); }
    if (h.vivo) sigue(d, h, dt, V_PIE, G_RAPIDO, { rumbo: !!h.huye, umbral: 1.5 });
    const fr = !h.vivo ? muerte(d, C, Tm) : clipMarcha(C, d.v, V_PIE, Tm + d.fase);
    mio.tropa.pon(i, d.x, 0, d.z, d.yaw, fr, { esc: d.esc }); mio.sombras.pon(i, d.x, 0, d.z, d.yaw, h.vivo ? 0.9 : 1.1, h.vivo ? 0.9 : 1.9);
    if (!h.vivo || h.huye || (h.kB || 0) < 0.4) { mio.sar.oculta(i); return; }   /* alzada, basta la lanza del propio modelo: la caja tapaba la cámara */
    const k = h.kB || 0, sx = Math.sin(d.yaw), sz = Math.cos(d.yaw), cx = Math.cos(d.yaw) * 0.2, cz = -Math.sin(d.yaw) * 0.2;
    /* alzada: casi vertical desde el pie; bajada: horizontal agarrada a 1,7 m de la contera */
    mio.sar.pon(i, d.x + cx - sx * 1.7 * k, 0.3 + 0.75 * k + (h.r || 0) * 0.05 * k, d.z + cz - sz * 1.7 * k, d.yaw, (1 - k) * 80 * GRADO + k * (-0.03 + (h.r || 0) * 0.035));
  });
  mio.tropa.fin(); mio.sombras.fin(); mio.sar.fin();
}

/* ---------- avance de la simulación ---------- */
function un(dt) {
  while (cola.length) { const [t, d] = cola.shift(); bot.aviso(F, t, d); }
  bot.paso(F, dt); F.paso(dt);
  if (RIV) RIV.paso(dt); pasoMio(dt);
}
/* avanza sin pintar hasta un aviso nuevo de ese tipo (o max segundos), sigue extra segundos y pinta */
function hasta(tipo, max = 120, extra = 0) {
  const i0 = avisos.length, n = Math.round(max / DT); let llego = false;
  for (let i = 0; i < n && !llego; i++) { un(DT); llego = avisos.indexOf(tipo, i0) >= 0; }
  const m = Math.round(extra / DT); for (let i = 0; i < m; i++) un(DT);
  pinta(); return { T: F.S.T, llego };
}
function salta(seg) { const n = Math.round(seg / DT); for (let i = 0; i < n; i++) un(DT); pinta(); return F.S.T; }
let parado = Q.get('parar') === '1';
function parar(v = true) { parado = !!v; }

/* ---------- cámaras ---------- */
let VISTA = Q.get('vista') || 'muro';
function vista(n) { if (n) VISTA = n; colocaCamara(); pinta(); return VISTA; }
const MEDIO = 12 * 0.78 / 2, PUNTAS = 3.5;   /* medio frente de mi muro (12 hileras a 0,78 m) y centro de la zona de puntas por delante del pivote */
function colocaCamara() {
  const S = F.S, g = S.giro || 0, fx = Math.sin(g), fz = -Math.cos(g), rx = Math.cos(g), rz = Math.sin(g), px = S.xF || 0, pz = S.zF || 0;
  const en = (del, lado) => [px + fx * del + rx * lado, pz + fz * del + rz * lado];
  let p, m, yp, ym;
  if (VISTA === 'alto') { p = en(-6, 6); yp = 8; m = en(2, 0); ym = 0; }
  else if (VISTA === 'lado') { p = en(6, 34); yp = 4; m = en(6, 0); ym = 1; }
  else if (VISTA === 'hombro') { p = en(-6, 1.5); yp = 4; m = en(7, 0); ym = 1.2; }
  else if (VISTA === 'choque') { p = en(2, MEDIO + 9); yp = 2.2; m = en(PUNTAS, 0); ym = 1; }
  else { p = en(-0.6, 0); yp = 3.3; m = en(20, 0); ym = 0.8; }
  camara.position.set(p[0], yp, p[1]); camara.lookAt(m[0], ym, m[1]);
  /* en vertical se abre el campo de visión para que quepa casi lo mismo de ancho */
  const asp = innerWidth / innerHeight, fov = asp < 1 ? Math.min(100, 50 / Math.pow(asp, 0.75)) : 50;
  if (camara.fov !== fov || camara.aspect !== asp) { camara.fov = fov; camara.aspect = asp; camara.updateProjectionMatrix(); }
}
function pinta() { colocaCamara(); renderer.render(escena, camara); }
function peso() { return { llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles }; }

/* ---------- arranque ---------- */
(async () => {
  try {
    await montaMio();
    RIV = await montaRivalDe(NOMBRE, { escena, estado: () => F.S, H: () => 0 });
    __fa7.RIV = RIV;
    RIV.paso(0); pasoMio(0);
    const s = +(Q.get('salta') || 0); if (s > 0) salta(s); else pinta();
    __fa7.lista = true;
    let t0 = performance.now();
    const bucle = ahora => { const dt = Math.min(DT, (ahora - t0) / 1000); t0 = ahora; if (!parado) { un(dt); pinta(); } requestAnimationFrame(bucle);   /* parado no repinta: el render por software es lento */ };
    requestAnimationFrame(bucle);
  } catch (e) { errores.push(String(e && e.stack || e)); console.error(e); }
})();
