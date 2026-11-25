/* LP3 · Maqueta «Manípulo a pie» en vertical (diseño: gobierno/estudios/LP0-como-se-pelea-a-pie.md §2–§4, §6).
   Mandas tu manípulo, no a un hombre: dibujas el frente con el dedo y el bloque gira como una puerta y marcha hasta él;
   cuatro órdenes (Testudo · Cargar · Relevo · Alto) y la que conviene se ilumina. Enfrente, galos que piensan en tres niveles.
   Las reglas no son de aquí: el bloque es js/bloque.js (LP1) y las órdenes y el enemigo, js/bloque-ia.js (LP2).
   Esta escena solo pinta y suena. Reutiliza el campo, el cielo y la luz de la falange (../falange/campo.js y su sombreado
   de cine, copiado), los soldados de js/gfx/soldado.js y el sonido de ../a-pie/sonido.js. Cámara detrás y arriba de tu
   bloque; con un pellizco baja al hombro del centurión (camara.js, LP4). Qué soldado pinta cada bando: soldados.js (punto único).
   LP5a: física de js/fisica-batalla.js por fisica.js (cuerpos que no se atraviesan, caídos en el suelo, pilum y jabalinas que
   se clavan o rebotan); ?fisica=0 la apaga. ?nivel=facil|normal|dificil empieza sin la tarjeta · ?semilla=N · ?fase=dibuja|gira|salva|testudo|carga|choque|lucha|flanco|relevo|datos|fin
   salta a ese momento con un jugador automático y congela (capturas) · ?cam=d,alto,adelante,abertura retoca la cámara.
   LP7: ?lp7=<JSON> la abre la batalla grande («Bajar a pie», js/ui-mando.js) en una capa: { semilla, nivel, fuerzas, lejos,
   r, g (soldado de cada bando, ver soldados.js ponBandos), rival { los, Los }, objetivo }. Lucha hasta el 15 % (FIN_LUCHA) y, al
   salir, manda al padre postMessage({ aqvila: 'lp7', r: __bloque.lp7() }): hombres y en pie de cada bloque y dónde acabó el tuyo.
   FU1: ?formacion=testudo (por defecto, manípulo: lo de siempre) abre el testudo con el control del manípulo: formaciones/testudo.js
   (escenario «cruzar bajo las salvas», techo de escudos) y ?fase=salva|testudo|lucha… también lo salta. a-pie/ lleva aquí (?antiguo=1 = la escena vieja).
   FU2: tú eres un hombre de la primera fila (oficial.js). En la vista del oficial se pelea con un dedo (dedos.js, modo pelea):
   la cámara baja a tu hombro y mira al rival (camara.js), el HUD del duelo es duelo-hud.js. Arriba no hay duelo de dedos, pero
   el duelo sigue (el galo te golpea igual: es lo más simple y las cifras de oficial.js están medidas así). ?fase=duelo salta al
   choque sin congelar. Gancho: __bloque.oficial y __bloque.pide(gesto, datos).
   Gancho para pruebas: window.__bloque = { listo, C, S, dibuja(p0, p1), orden(n), estado() }. */
import { THREE } from '../../../js/gfx/models.js';
import { cargarSoldado, tropa, PUEBLOS, gama } from '../../../js/gfx/soldado.js';
import { crearCampo } from '../falange/campo.js';
import { MUNDO, SUELO_GLSL, prepararLuz, crearCielo, brumaPara, distanciaVista } from '../../../js/gfx/campo-mando.js';   /* BT1: la luz, la bruma y el cielo de la batalla grande: un solo mundo */
import * as Son from '../a-pie/sonido.js';
import * as BL from '../../../js/bloque.js';
import { crearCombate, centro, NIVELES, SALVA_VUELO } from '../../../js/bloque-ia.js';
import { crearTropas } from './tropas.js';
import { crearLucha } from '../../../js/combate-tropas.js';   /* CB3: el motor de lucha decide los golpes y los caídos */
import { crearFisica } from '../../../js/fisica-batalla.js';   /* FU4: con la falange, los cuerpos de verdad (hombres, jinetes, elefantes) no se atraviesan */
import { crearFisicaBloque, PROY_MAX, medirChoques } from './fisica.js';   /* LP5a: los cuerpos no se atraviesan; pilum y jabalinas con física (?fisica=0, el antes) */
import { crearHud } from './hud.js';
import { crearAbanico } from './abanico.js';   /* FU5 */
import { crearMuro } from './formaciones/muro.js';   /* FU5 */
import { crearAbierto } from './formaciones/abierto.js';   /* FU5 */
import { crearDedos } from './dedos.js';
import { crearCamara } from './camara.js';
import { separaEstandartes } from './rotulos.js';
import { modelos, prestan, ARMAS, FONDO, paleta, modeloDe, eligeOficial, soloArmas, paraFalange, ponBandos, gestoEspada } from './soldados.js';   /* BT1: gestoEspada, la espada delante del cuerpo */
import { FIN_LUCHA } from '../../../js/falange.js';
import { crear as formacionManipulo } from './formaciones/manipulo.js';
import { crear as formacionTestudo } from './formaciones/testudo.js';
import { crearOficial, GOLPE } from './oficial.js';   /* FU2: tú en la fila: el duelo del oficial (solo reglas) */
import { crearDueloHud, crearFalangitaHud } from './duelo-hud.js';
import { crearFalangita } from './falangita.js';   /* FU3b: el gesto de la falange (bajar sarisas, cerrar el hueco) */
import { crear as formacionCombinada, escenarioAsculo } from './formaciones/combinada.js';   /* ES2: falange + dos manípulos con mando de varios cuerpos */
import { crear as formacionFalange } from './formaciones/falange.js';   /* FU3: la falange del motor (sus reglas, con el control del bloque) */
import { acercaRival, resultadoLP7 as resultadoLP7F } from '../falange/acciones.js';

const Q = new URLSearchParams(location.search), FASE = Q.get('fase'), $ = id => document.getElementById(id);
const TESTUDO = (Q.get('formacion') === 'testudo' || !Q.get('formacion')) && !Q.get('lp7');   /* FU1: la formación de la escena (cada una, su archivo en formaciones/). BT1: sin ?formacion= también (manípulo y testudo, una sola prueba: cruzas bajo las salvas y luego peleas con relevos); ?formacion=manipulo, el manípulo solo */
const FALANGE = Q.get('formacion') === 'falange';   /* FU3: también con ?lp7= (bajar a pie con una falange) */
const MU = crearMuro(), ABI = crearAbierto(); let AB = null;   /* FU5: muro de escudos, orden abierto y su abanico */
const COMBINADA = Q.get('formacion') === 'combinada' && !Q.get('lp7');   /* ES2 */
const FORM = COMBINADA ? formacionCombinada() : FALANGE ? formacionFalange() : TESTUDO ? formacionTestudo() : formacionManipulo();
if (TESTUDO) document.title = 'AQVILA · Manípulo y Testudo a pie';
if (FALANGE) {   /* tus falangitas de FA2 (azules, su oficial con penacho) contra los hastati de siempre (rojos) */
  document.title = 'AQVILA · Falange a pie'; const pal = gama('#3a64a8', PUEBLOS.falangita);
  ponBandos({ modelo: 'falangita', oficial: 'oficial-falange', paleta: pal, palOficial: Object.assign({}, pal, { escudos: PUEBLOS.falangita.escudos }) }, { modelo: 'hastatus' });
}
/* ES4: ?formacion=combinada&escenario=asculo&bando=pirro|roma. Sin bando, la pantalla de entrada (dos botones que recargan con &bando=) */
const ASC = escenarioAsculo(Q), ASC_ENTRADA = COMBINADA && Q.get('escenario') === 'asculo' && !ASC;
if (ASC) {   /* el bando azul (la falange de Pirro) lleva falangitas con sarisas; el otro, hastati rojos */
  const pal = gama('#3a64a8', PUEBLOS.falangita), az = { modelo: 'falangita', oficial: 'oficial-falange', paleta: pal, palOficial: Object.assign({}, pal, { escudos: PUEBLOS.falangita.escudos }) };
  document.title = 'AQVILA · Ásculo, 279 a.C.'; ASC.bando === 'pirro' ? ponBandos(az, { modelo: 'hastatus' }) : ponBandos(null, { modelo: 'falangita', paleta: pal });
}
if (ASC_ENTRADA) {
  const d = document.createElement('div'); d.id = 'entrada-asculo'; d.style.cssText = 'position:fixed;inset:0;z-index:99;background:#14100c;color:#f1e6c8;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:16px;font:16px/1.35 Georgia,serif;overflow:auto';
  const b = (id, tit, txt) => '<button data-b="' + id + '" style="min-height:96px;border:2px solid #e9c063;background:#2a2018;color:#f1e6c8;border-radius:10px;padding:10px 14px;text-align:left;font:inherit"><b style="font-size:22px;display:block">' + tit + '</b><span style="font-size:14px">' + txt + '</span></button>';
  d.innerHTML = '<h1 style="margin:0;font-size:24px;text-align:center">Ásculo, 279 a.C.</h1>' +
    b('pirro', 'Ser Pirro', 'Intercaló manípulos itálicos entre los bloques de su falange (Polibio 18.28). Rompe la línea romana.') +
    b('roma', 'Ser Roma', 'Los vélites abrían la batalla y se retiraban entre los manípulos (Polibio 6.21 y 15.9). Aguanta y rompe la falange.') +
    '<a href="../../../" style="align-self:center;color:#e9c063;font-size:15px;padding:12px 18px">Volver al menú</a>';   /* UN3: salida a Escaramuzas sin el botón «atrás» */
  document.body.appendChild(d);
  d.querySelectorAll('button').forEach(x => x.addEventListener('click', () => { const u = new URL(location.href); u.searchParams.set('bando', x.dataset.b); location.href = u.toString(); }));
}
/* CB3: ?lucha=reglas vuelve a las bajas por reglas de bloque; por defecto deciden el motor de lucha (js/combate.js) */
const LUCHA = Q.get('lucha') === 'reglas' ? 'reglas' : 'motor'; let LU = null, acumL = 0;
let LP7 = null; try { LP7 = Q.get('lp7') ? JSON.parse(Q.get('lp7')) : null; } catch (e) { console.warn('lp7 mal escrito', e); }
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const angDif = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
const fr = a => ({ x: Math.sin(a), z: -Math.cos(a) });
let semillaV = 7; const azarV = () => { semillaV = (semillaV * 16807) % 2147483647; return (semillaV - 1) / 2147483646; };
/* el suelo: el de la falange (llano donde se lucha, loma detrás de los galos) */
const H = (x, z) => 3.4 * suave(-70, -103, z) * (1 + 0.06 * Math.sin(x * 0.07)) + 0.22 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(z * 0.045 + 1.3) + 0.6 * suave(30, 90, Math.abs(x)) * Math.sin(z * 0.03);

/* ---------- luz de cine (copiada de ../falange/escena.js): gradación dentro del tonemapping y Lambert con borde de contraluz ---------- */
/* BT1: la gradación dentro del tonemapping la pone prepararLuz (js/gfx/campo-mando.js), la misma que en la batalla grande */
const LAMBERT_CINE = THREE.ShaderChunk.lights_lambert_pars_fragment
  .replace('varying vec3 vViewPosition;', 'varying vec3 vViewPosition;\nuniform float uBorde;\nuniform float uAmb;\nuniform float uTrasluz;')
  .replace('reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}', `reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	float fr = pow( 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ), 2.2 ), tras = pow( saturate( dot( - geometryViewDir, directLight.direction ) ), 1.5 ) * smoothstep( -0.3, 0.25, dot( geometryNormal, directLight.direction ) );
	reflectedLight.directDiffuse += directLight.color * fr * tras * uBorde * ( material.diffuseColor * 0.6 + vec3( 0.16, 0.12, 0.08 ) );
}`)
  .replace('reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );', 'reflectedLight.indirectDiffuse += irradiance * uAmb * BRDF_Lambert( material.diffuseColor );');
function cine(sh, borde) {
  sh.uniforms.uBorde = { value: borde }; sh.uniforms.uAmb = { value: 1 }; sh.uniforms.uTrasluz = { value: 0 };
  sh.fragmentShader = sh.fragmentShader.replace('#include <lights_lambert_pars_fragment>', LAMBERT_CINE);
}
const sueloCine = sh => cine(sh, 0);

/* ---------- motor ---------- */
const lienzo = $('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
prepararLuz(THREE, renderer);
const HORIZ = MUNDO.horiz;
const escena = new THREE.Scene(); escena.background = new THREE.Color(HORIZ); escena.fog = new THREE.FogExp2(MUNDO.bruma, brumaPara(55));   /* BT1: la densidad la ajusta el bucle (antes 0,0042 fija: en Ásculo, con la cámara abierta, tapaba las tropas) */
const camara = new THREE.PerspectiveCamera(58, 1, 0.3, 12000);
/* el sol: bajo, delante (detrás de los galos) y a la derecha: contraluz dorado. BT1: el mismo que en la batalla grande (MUNDO; antes 0.13, 0.33, −0.94) */
const SOL = new THREE.Vector3(...MUNDO.sol).normalize();
escena.add(new THREE.HemisphereLight(...MUNDO.cielo));
const luz = new THREE.DirectionalLight(MUNDO.colSol, MUNDO.fuerzaSol); luz.position.copy(SOL).multiplyScalar(40); escena.add(luz);
/* relleno fuerte desde la cámara: a contraluz los hombres saldrían negros y no se distinguirían los bandos */
const relleno = new THREE.DirectionalLight(MUNDO.relleno[0], MUNDO.relleno[1]); relleno.position.set(MUNDO.relleno[2], MUNDO.relleno[3], MUNDO.relleno[4]); escena.add(relleno);
const texCielo = new THREE.TextureLoader().load('gobierno/maquetas/testudo-luz-campo/arte/cielo.jpg'); texCielo.colorSpace = THREE.SRGBColorSpace; texCielo.wrapS = THREE.RepeatWrapping; texCielo.generateMipmaps = false; texCielo.minFilter = THREE.LinearFilter;
const cielo = crearCielo(THREE, texCielo, SOL); escena.add(cielo);   /* BT1: el mismo cielo que en la batalla grande */
let vertical = true;
/* BT1: para las pruebas (test/graficos-bt1.mjs): el mismo mundo que la batalla grande */
window.__mundo = { id: MUNDO.id, sol: luz.color.getHexString(), bruma: escena.fog.color.getHexString(), horiz: escena.background.getHexString(), suelo: SUELO_GLSL.length, exposicion: renderer.toneMappingExposure, densidad: () => escena.fog.density, vista: () => distanciaVista(camara) };
function medir() { const w = innerWidth, h = innerHeight; vertical = h >= w; renderer.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix(); }
addEventListener('resize', medir); medir();

/* ---------- cámara: detrás y arriba de tu bloque; gira con él, despacio (el mundo no se mueve contigo) ---------- */
const CAMS = { v: { d: 30, alto: 27, ad: 18, fov: 56 }, h: { d: 26, alto: 16, ad: 18, fov: 44 } };
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); for (const t of [CAMS.v, CAMS.h]) ['d', 'alto', 'ad', 'fov'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
const CAM = { x: 0, z: 0, yaw: 0, obj: 0, listo: false };
function camaraSigue(dt) {
  const S = C.S, tu = S.tuyo, c = centro(tu), K = vertical ? (FORM.camaras || CAMS).v : (FORM.camaras || CAMS).h;
  /* la cámara no gira con cada giro del bloque (así se ve girar la puerta y el enemigo no se mueve en pantalla);
     solo si tu bloque mira ya a más de 70° de ella, se pone detrás despacio */
  if (!CAM.listo) { CAM.x = c.x; CAM.z = c.z; CAM.yaw = CAM.obj = tu.ang; CAM.listo = true; }
  if (tu.estado !== 'huye' && Math.abs(angDif(tu.ang, CAM.obj)) > 70 * Math.PI / 180) CAM.obj = tu.ang;
  const k = 1 - Math.exp(-dt / 0.9), ky = 1 - Math.exp(-dt / 2.5);
  CAM.x += (c.x - CAM.x) * k; CAM.z += (c.z - CAM.z) * k; CAM.yaw += angDif(CAM.obj, CAM.yaw) * ky;
  const F = fr(CAM.yaw), tx = CAM.x + F.x * K.ad, tz = CAM.z + F.z * K.ad;
  camara.position.set(tx - F.x * (K.d + K.ad), H(CAM.x, CAM.z) + K.alto, tz - F.z * (K.d + K.ad));
  camara.lookAt(tx, H(tx, tz) + 1, tz);
  if (camara.fov !== K.fov) { camara.fov = K.fov; camara.updateProjectionMatrix(); }
}
const V3 = new THREE.Vector3();
function proyecta(x, y, z) { V3.set(x, H(x, z) + y, z).project(camara); const vis = V3.z < 1 && Math.abs(V3.x) < 1.1 && Math.abs(V3.y) < 1.1; return [(V3.x + 1) / 2 * innerWidth, (1 - V3.y) / 2 * innerHeight, vis]; }
function ladoEnPantalla(x, z) { V3.set(x, H(x, z), z).applyMatrix4(camara.matrixWorldInverse); return V3.x < 0 ? -1 : 1; }
const rayo = new THREE.Raycaster(), PLANO = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.2), V2 = new THREE.Vector2();
function suelo(px, py) { V2.set(px / innerWidth * 2 - 1, -(py / innerHeight) * 2 + 1); rayo.setFromCamera(V2, camara); const p = rayo.ray.intersectPlane(PLANO, V3); if (!p) return null; if (Math.hypot(p.x - camara.position.x, p.z - camara.position.z) > 260) return null; return { x: p.x, z: p.z }; }

/* ---------- soldados: tres niveles de detalle por bando, elegidos por distancia (y fuera de cámara no se pintan) ---------- */
/* AL11: los galos no usan el nivel cercano (con siete modelos serían siete llamadas más por una docena de hombres) */
const NIV = [1, 2, 3], TOPE = { r: [30, 150, 900], g: [0, 142, 1300] }, DMAX = [26, 70];   /* FU3c: hasta 30 hombres con manos y dedos (antes 22): las llamadas de dibujo no cambian, son instancias */
const T = { r: {}, g: {} }, A = { r: {}, g: {} };   /* AL11: T[bando][modelo] = 3 tropas (una por nivel); A[bando][quien presta] = sus armas */
let oficial = null;
const M4 = new THREE.Matrix4(), QT = new THREE.Quaternion(), P3 = new THREE.Vector3(), E3 = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
const frustum = new THREE.Frustum(), PM = new THREE.Matrix4(), ESF = new THREE.Sphere(new THREE.Vector3(), 1.6);
const var4 = s => [0, 1, 2, 3].map(k => { const v = Math.sin(s * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); });
/* sombra de contacto bajo cada hombre: un disco oscuro (una llamada) */
let sombras = null;
function creaSombras() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(0,0,0,.85)'); r.addColorStop(0.5, 'rgba(0,0,0,.45)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const geo = new THREE.PlaneGeometry(1.2, 1.2); geo.rotateX(-Math.PI / 2);
  sombras = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, color: 0x1a1208, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2 }), 2400);
  sombras.frustumCulled = false; sombras.count = 0; sombras.renderOrder = 1; escena.add(sombras);
}
/* FU3b: la túnica del falangita es de lino blanco en la textura y la máscara de equipo solo cubre el escudo: no se tiñe con la paleta.
   Aquí se tiñe de azul lo claro y poco saturado (lino) del soldado; la piel, el bronce y el cuero (saturados) y lo oscuro se quedan */
function azulea(mat) {
  const antes = mat.onBeforeCompile, azul = { value: new THREE.Color('#2456c8') };
  mat.onBeforeCompile = sh => {
    antes(sh); sh.uniforms.uAzul = azul;
    sh.fragmentShader = 'uniform vec3 uAzul;\n' + sh.fragmentShader.replace('{ float alto = vObj.y;', '{ float lm = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)), sa = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)) - min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b)); float piel = smoothstep(0.14, 0.24, diffuseColor.r - diffuseColor.b) * step(diffuseColor.b, diffuseColor.g + 0.01); float kl = smoothstep(0.12, 0.35, lm) * (1.0 - smoothstep(0.16, 0.4, sa)) * (1.0 - piel) * (1.0 - smoothstep(1.4, 1.48, vObj.y)); diffuseColor.rgb = mix(diffuseColor.rgb, uAzul * (0.5 + 1.2 * lm), kl);\n float alto = vObj.y;');
  };
  mat.customProgramCacheKey = () => 'fu4-soldado-azul'; mat.needsUpdate = true;
}
function pintaSoldados() {
  PM.multiplyMatrices(camara.projectionMatrix, camara.matrixWorldInverse); frustum.setFromProjectionMatrix(PM);
  const cx = camara.position.x, cz = camara.position.z, L = { r: [], g: [] };
  for (const lista of [TR.figs, TR.caidos]) for (const f of lista) {
    ESF.center.set(f.x, H(f.x, f.z) + 0.9, f.z); if (!frustum.intersectsSphere(ESF)) continue;
    f.d2 = (f.x - cx) ** 2 + (f.z - cz) ** 2; L[f.bando].push(f);
  }
  let ns = 0;
  for (const b of ['r', 'g']) {
    const tr = T[b], ar = A[b], hay = Object.keys(tr); for (const g of [tr, ar]) for (const k in g) for (const t of g[k]) t.limpiar(); if (!hay.length) continue;
    L[b].sort((a, c) => a.d2 - c.d2); let usados = [0, 0, 0];
    for (const f of L[b]) {
      const d = Math.sqrt(f.d2); let n = d < DMAX[0] && usados[0] < TOPE[b][0] ? 0 : d < DMAX[1] && usados[1] < TOPE[b][1] ? 1 : 2;
      if (usados[n] >= TOPE[b][n]) continue; let mo = tr[modeloDe(f, oficial)] ? f.modelo : hay[0]; if (n >= 1 && tr[FONDO[mo]]) mo = FONDO[mo];   /* LP7: también a media distancia (≤ 30 llamadas con el campo lleno) */ const t = tr[mo][n], i = t.sig(); if (i < 0) continue; usados[n]++;
      const y = H(f.x, f.z); P3.set(f.x, y, f.z); QT.setFromAxisAngle(Y, f.yaw); E3.set(f.talla, f.talla, f.talla); M4.compose(P3, QT, E3);
      const v4 = var4(f.semilla), mu = t.muestra(f.clip, f.t); t.matriz(i, M4.elements); t.vars(i, v4); t.pose(i, f.clip, f.t, mu); if (f.gesto) f.gesto(t, i, n); else gestoEspada(f, t, i, !!ar[ARMAS[mo]]);   /* FU3c: la formación (falange) cambia las filas de huesos de los hombres de cerca: sarisa bajada con las manos en el asta */
      const pa = ar[ARMAS[mo]]; if (pa) { const ta = pa[n], ia = ta.sig(); if (ia >= 0) { ta.matriz(ia, M4.elements); ta.vars(ia, v4); ta.pose(ia, f.clip, f.t, ta.muestra(f.clip, f.t)); if (!f.gesto) gestoEspada(f, ta, ia); } }
      if (sombras && ns < 2400 && f.clip !== 'morir') { P3.y = y + 0.04; E3.set(1, 1, 1); QT.identity(); M4.compose(P3, QT, E3); sombras.setMatrixAt(ns++, M4); }
    }
  }
  for (const b of ['r', 'g']) for (const g of [T[b], A[b]]) for (const k in g) for (const t of g[k]) t.malla.visible = t.malla.count > 0;
  if (sombras) { sombras.count = ns; sombras.instanceMatrix.needsUpdate = true; }
}

/* ---------- polvo y chispas en la línea de choque; jabalinas y pila en el aire ---------- */
const POLVO_N = 260, polvo = { pos: new Float32Array(POLVO_N * 3), col: new Float32Array(POLVO_N * 3), vida: new Float32Array(POLVO_N), vel: new Float32Array(POLVO_N * 3), k: 0 };
const CHISPA_N = 120, chispa = { pos: new Float32Array(CHISPA_N * 3), col: new Float32Array(CHISPA_N * 3), vida: new Float32Array(CHISPA_N), vel: new Float32Array(CHISPA_N * 3), k: 0 };
let mPolvo, mChispa, mJab;
function creaEfectos() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(0.4, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const pts = (P, size, add) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P.pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(P.col, 3));
    const m = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true, fog: !add }));
    m.frustumCulled = false; m.renderOrder = 5; escena.add(m); return m; };
  for (let i = 0; i < POLVO_N; i++) polvo.pos[i * 3 + 1] = -99; for (let i = 0; i < CHISPA_N; i++) chispa.pos[i * 3 + 1] = -99;
  mPolvo = pts(polvo, 3.2, false); mChispa = pts(chispa, 0.35, true);
  const gj = new THREE.CylinderGeometry(0.018, 0.018, 1.7, 4); gj.rotateX(Math.PI / 2);
  mJab = new THREE.InstancedMesh(gj, new THREE.MeshLambertMaterial({ color: 0xffffff }), PROY_MAX); mJab.frustumCulled = false; mJab.count = 0; escena.add(mJab);
}
function suelta(P, N, x, y, z, vx, vy, vz, r, g, b, vida) { const i = P.k; P.k = (P.k + 1) % N; P.pos.set([x, y, z], i * 3); P.vel.set([vx, vy, vz], i * 3); P.col.set([r, g, b], i * 3); P.vida[i] = vida; P.col0 = P.col0 || new Float32Array(N * 3); P.col0.set([r, g, b], i * 3); }
function avanza(P, N, m, dt, cae) {
  let vivas = 0;   /* FU2: sin partículas vivas, no se dibuja (una llamada menos bajo el techo) */
  for (let i = 0; i < N; i++) { if (P.vida[i] <= 0) continue; vivas++; P.vida[i] -= dt; const k = Math.max(0, Math.min(1, P.vida[i]));
    for (let c = 0; c < 3; c++) { P.pos[i * 3 + c] += P.vel[i * 3 + c] * dt; P.col[i * 3 + c] = P.col0[i * 3 + c] * k; }
    P.vel[i * 3 + 1] -= cae * dt; if (P.vida[i] <= 0) P.pos[i * 3 + 1] = -99; }
  m.visible = vivas > 0; m.geometry.attributes.position.needsUpdate = true; m.geometry.attributes.color.needsUpdate = true;
}
let tPolvo = 0;
function lineaDeChoque(dt) {
  tPolvo -= dt; if (tPolvo > 0) return; tPolvo = 0.08;
  for (const b of C.S.bloques) for (const c of b.contactos || []) {
    if (b.id > c.b.id) continue; const o = c.b, ca = centro(b), co = centro(o), mx = (ca.x + co.x) / 2, mz = (ca.z + co.z) / 2;
    const dx = co.x - ca.x, dz = co.z - ca.z, L = Math.hypot(dx, dz) || 1, sx = -dz / L, sz = dx / L, w = Math.min(b.ancho, o.ancho) / 2;
    for (let k = 0; k < 2; k++) { const s = (azarV() * 2 - 1) * w, x = mx + sx * s, z = mz + sz * s, y = H(x, z);
      const t = 0.55 + azarV() * 0.2; suelta(polvo, POLVO_N, x, y + 0.3, z, (azarV() - 0.5) * 0.6, 0.5 + azarV() * 0.5, (azarV() - 0.5) * 0.6, t * 0.86, t * 0.74, t * 0.56, 1.6);
      for (let j = 0; j < 3; j++) suelta(chispa, CHISPA_N, x, y + 1.2, z, (azarV() - 0.5) * 3, 1 + azarV() * 2, (azarV() - 0.5) * 3, 1, 0.75, 0.35, 0.35); }
  }
}
const vuelos = [], Z1 = new THREE.Vector3(0, 0, 1);
function lanza(de, a, n, dur) {
  const ca = centro(a);
  for (let k = 0; k < n; k++) { const s = (azarV() - 0.5) * de.ancho, D = { x: Math.cos(de.ang), z: Math.sin(de.ang) };
    const x0 = de.x + D.x * s, z0 = de.z + D.z * s, x1 = ca.x + (azarV() - 0.5) * a.ancho, z1 = ca.z + (azarV() - 0.5) * a.fondo;
    vuelos.push({ x0, z0, y0: H(x0, z0) + 1.8, x1, z1, y1: H(x1, z1) + 0.2, t: -azarV() * 0.4, dur: dur * (0.9 + azarV() * 0.2), alto: 4 + Math.hypot(x1 - x0, z1 - z0) * 0.18 }); }
}
const LARGO = { pilum: 2.0, jabalina: 1.5, flecha: 0.75, piedra: 0.3 };
/* ES3b: grosor (× el del cilindro) y color de cada proyectil: la piedra, un guijarro gris; la flecha, algo más gruesa y clara. Sin entrada: como siempre */
const GRUESO_P = { piedra: 8, flecha: 2.2 }, COLOR_P = { piedra: new THREE.Color(0xb9b3a6), flecha: new THREE.Color(0xd9c9a0) }, COLOR_0 = new THREE.Color(0x5a4630);
/* un punto al azar entre los hombres del bloque a (donde caen pilum y jabalinas) */
const puntoEn = a => { const men = TR.figs.filter(f => f.b === a); return () => { if (!men.length) { const c = centro(a); return { x: c.x, z: c.z }; } const f = men[Math.floor(azarV() * men.length)]; return { x: f.x + (azarV() - 0.5) * 1.6, z: f.z + (azarV() - 0.5) * 1.6 }; }; };
function lanzaFisica(de, a, n, dur, tipo) { if (!FS || !FS.activa) return lanza(de, a, n, dur); FS.salva(de, a, n, dur, tipo, puntoEn(a)); }
function pintaVuelos(dt) {
  let n = 0;
  /* LP5a: los de la física (en vuelo, clavados en escudos y cuerpos, en el suelo): la punta y la dirección las da el motor */
  if (FS && FS.activa) for (const p of FS.proyectiles) {   /* FI3u */
    if (n >= PROY_MAX) break; const d = FS.dondeP(p), L = LARGO[p.tipo] || 1.5;   /* FI3u */
    E3.set(d.dx, d.dy, d.dz); if (E3.lengthSq() < 1e-8) continue; E3.normalize(); P3.set(d.x - E3.x * L / 2, d.y - E3.y * L / 2, d.z - E3.z * L / 2);
    QT.setFromUnitVectors(Z1, E3); const gr = GRUESO_P[p.tipo] || 1; E3.set(gr, gr, L / 1.7); M4.compose(P3, QT, E3); mJab.setColorAt(n, COLOR_P[p.tipo] || COLOR_0); mJab.setMatrixAt(n++, M4);
  }
  for (let i = vuelos.length - 1; i >= 0; i--) { const v = vuelos[i]; v.t += dt; if (v.t > v.dur + 2.5) { vuelos.splice(i, 1); continue; } if (v.t < 0 || n >= PROY_MAX) continue;
    const u = Math.min(1, v.t / v.dur), u2 = Math.min(1, (v.t + 0.05) / v.dur), at = w => [v.x0 + (v.x1 - v.x0) * w, v.y0 + (v.y1 - v.y0) * w + v.alto * 4 * w * (1 - w), v.z0 + (v.z1 - v.z0) * w];
    const p = at(u), q = u < 1 ? at(u2) : at(1), dir = u < 1 ? [q[0] - p[0], q[1] - p[1], q[2] - p[2]] : [v.x1 - v.x0, -2, v.z1 - v.z0];
    P3.set(...p); E3.set(...dir).normalize(); QT.setFromUnitVectors(new THREE.Vector3(0, 0, 1), E3); M4.compose(P3, QT, new THREE.Vector3(1, 1, 1)); mJab.setColorAt(n, COLOR_0); mJab.setMatrixAt(n++, M4); }
  mJab.count = n; mJab.instanceMatrix.needsUpdate = true; if (mJab.instanceColor) mJab.instanceColor.needsUpdate = true;
}

/* ---------- partida ---------- */
const PAR_FAL = 0.7;   /* BT1: m entre dos falangitas dibujados (en la regla, 0,78 de lado y 0,95 de fondo) */
let C = null, TR = null, FS = null, hud = null, dedos = null, cam1 = null, congelado = false, nivel = NIVELES.includes(Q.get('nivel')) ? Q.get('nivel') : LP7 ? (NIVELES.includes(LP7.nivel) ? LP7.nivel : 'normal') : null;
const semilla = +(Q.get('semilla') || (LP7 && LP7.semilla) || (1 + Math.floor(Math.random() * 999)));
let oyente = null;
function avisa(tipo, d) {
  if (oyente) oyente(tipo, d);
  try { if (BANDA && window.Voces) { const sit = tipo === 'pilum' ? 'pila' : tipo === 'rompe' ? (d && d.de && d.de.bando === 'r' ? 'roto-propio' : 'roto-enemigo') : window.Voces.deAviso(tipo, d); if (sit) BANDA.dice(sit); if (tipo === 'fin') BANDA.fin(d.ganador === 'tuyo' ? 'victoria' : d.ganador === 'enemigo' ? 'derrota' : null); } } catch (e) { /* sin banda */ }   /* SON7: las voces y la música, como en Testudo y Falange */
  if (hud) try { hud.aviso(tipo, d); } catch (e) { if (!FORM.combate) throw e; }   /* FU3: los avisos de la falange no son todos los del bloque */
  try { FORM.alAviso(tipo, d); } catch (e) { console.warn('formación', e); }
  if (tipo === 'forma') try { ABI.alAviso(tipo, d); } catch (e) { /* FU5 */ }
  if (RIVD) try { RIVD.aviso(tipo, d); } catch (e) { console.warn('FU4: rival', e); }   /* FU4: el dibujo del rival se entera de los choques y las muertes */
  try {
    switch (tipo) {
      case 'forma': Son.voz && Son.voz(d.texto); if (d.f === 'muro') Son.clac && Son.clac(10); break;   /* FU5 */
      case 'orden': Son.voz && Son.voz(d.texto); if (d.n === 'testudo') Son.clac && Son.clac(6); break;
      case 'salva': if (C) { const t = C.S.ene.tiradores; if (t && d.blanco) { lanzaFisica(t, d.blanco, 34, SALVA_VUELO, 'jabalina'); TR && TR.lanzan(t, C.S.T); } } Son.salva && Son.salva(SALVA_VUELO); break;
      case 'jabalinas': Son.clac && Son.clac(d.testudo ? 12 : 5); break;
      case 'pilum': if (C && d.blanco) { lanzaFisica(C.S.tuyo, d.blanco, 26, 1.1, 'pilum'); TR && TR.lanzan(C.S.tuyo, C.S.T); } Son.lanza && Son.lanza(); break;
      case 'choque': Son.choque && Son.choque(); break;
      case 'rompe': Son.cuerno && Son.cuerno(2); break;
      /* FU3: los de la falange (mismos sonidos que ya hay) */
      case 'estocada': Son.hierro && Son.hierro(0, 0, 1.3); break;
      case 'ha': Son.esfuerzo && Son.esfuerzo(0, 1); break;
      case 'cae': Son.herido && Son.herido(0); break;
      case 'clava': case 'picaRota': Son.madera && Son.madera(tipo === 'clava' ? 0.8 : 1, 0); break;
      case 'flanco': Son.cuerno && Son.cuerno(1); break;
    }
  } catch (e) { /* sin sonido */ }
}
function nueva(n) {
  nivel = n; if (FORM.combate) { LU = null; return nuevaFormacion(); }
  C = crearCombate(Object.assign({ semilla, nivel, motor: BL, avisa, lucha: LUCHA }, LP7 ? { fuerzas: LP7.fuerzas, lejos: LP7.lejos, fin: FIN_LUCHA } : {}, FORM.escenario ? { escenario: FORM.escenario, fin: FIN_LUCHA } : {}, FORM.opcCombate ? FORM.opcCombate(BL) : {}));
  if (LP7 && LP7.rival) C.S.rival = LP7.rival; else if (ASC) C.S.rival = ASC.bando === 'pirro' ? { los: 'los romanos', Los: 'Romanos' } : { los: 'la falange', Los: 'Falange' };   /* ES4: el nombre del rival en Ásculo */ TR = crearTropas({ S: C.S, muroDelante: FORM.muroDelante }); FS = crearFisicaBloque({ S: C.S, TR, H, activa: Q.get('fisica') !== '0', semilla, guardia: FORM.guardia }); oficial = eligeOficial(TR.figs); hud.pon(C);
  LU = LUCHA === 'motor' ? crearLucha({ C, TR, semilla }) : null;
  FORM.monta({ THREE, escena, H, C, S: C.S, TR, Son, BL, hud, $, dedos, FS, camara, proyecta, suelo, lienzo, semilla, texto: t => { $('objetivo').textContent = t; } }); dedos.oculta(); vuelos.length = 0; CAM.listo = false; camaraSigue(1e-4);
  { const cx = { THREE, escena, H, C, S: C.S, TR, Son }; MU.monta(cx); ABI.monta(cx); AB.pon(C); }   /* FU5 */
  OF = crearOficial({ S: C.S, alAviso: alOficial }); rivF = null; sacude = 0;
  window.__bloque.C = C; window.__bloque.LU = LU; window.__bloque.S = C.S; window.__bloque.oficial = OF;
}
/* FU3b: los avisos del gesto de la falange: solo suenan (sonidos que ya hay); el eco lo pinta su HUD */
function alFalangita(tipo, d) {
  try {
    if (tipo === 'golpe') { if (d.res === 'ensarta') { Son.hierro && Son.hierro(0, 0, 1.3); Son.herido && Son.herido(0); } else { Son.herido && Son.herido(0); Son.cuerno && Son.cuerno(1); sacude = Math.max(sacude, 0.3); } }
    else if (tipo === 'cierra') Son.madera && Son.madera(0.9, 0);
    else if (tipo === 'brecha') { Son.cuerno && Son.cuerno(2); sacude = Math.max(sacude, 0.4); }
    else if (tipo === 'empuja') Son.esfuerzo && Son.esfuerzo(0, 1);   /* FU3c: empuje y othismos con los sonidos que hay */
    else if (tipo === 'compas') Son.madera && Son.madera(0.8, 0);
    else if (tipo === 'golpe-oth') { if (d && d.bien) { Son.esfuerzo && Son.esfuerzo(0, 1); Son.toque && Son.toque(); } }
    else if (tipo === 'othismos-fin') { if (d && d.res === 'gana') { Son.choque ? Son.choque() : Son.cuerno && Son.cuerno(1); } else if (d && d.res === 'pierde') { Son.cuerno && Son.cuerno(2); sacude = Math.max(sacude, 0.4); } }
  } catch (e) { /* sin sonido */ }
}
/* FU3: la partida de una formación con su propio combate (la falange): sus reglas, sus hombres de verdad, sin física del bloque
   (el motor de la falange ya los separa y sus pila son suyos) y sin el duelo de dedos del oficial (el pellizco a su vista sí) */
let P0F = null;
/* FU4: con la falange, la física de cuerpos (?fisica=0 la apaga) y el dibujo del rival que no es manípulo (rivales/index.js) */
let FI = null, RIVD = null, nRiv = 0; const FISICA = Q.get('fisica') !== '0';
const RIV_TXT = { elefantes: { los: 'los elefantes', Los: 'Elefantes', obj: 'Aguanta la carga de los elefantes' }, caballeria: { los: 'los jinetes', Los: 'Jinetes', obj: 'Aguanta la carga de los jinetes' },
  falange: { los: 'la falange rival', Los: 'Falange rival', obj: 'Empuja y rompe la falange rival' }, hoplitas: { los: 'los hoplitas', Los: 'Hoplitas', obj: 'Rompe el muro de los hoplitas' } };
function montaRivalBloque(nom) {   /* FU4: carga su arte aparte; si la partida se rehízo entretanto, se quita */
  const yo = ++nRiv; if (!RIV_TXT[nom]) return;
  import('./rivales/index.js').then(m => m.montaRivalDe(nom, { escena, estado: () => C.S.fal, H })).then(r => {
    if (!r) return; if (yo !== nRiv) { r.quita(); return; } RIVD = r; window.__bloque.rival = r; for (let i = 0; i < 60; i++) r.paso(0.05);   /* llega a su sitio (tras saltar de fase) */
  }).catch(e => console.warn('FU4: sin dibujo del rival', e));
}
function nuevaFormacion() {
  const nomR = Q.get('rival') || 'manipulos', txtR = RIV_TXT[nomR];   /* FU4 */
  /* FU3b: el rival de las reglas es el de ?rival= (manípulos si no); el nombre que se lee es el de LP7.rival si viene (no lo pisan «los manípulos») */
  const rotulo = LP7 && LP7.rival ? Object.assign({}, LP7.rival, { los: LP7.rival.los || (LP7.rival.Los || '').toLowerCase(), Los: LP7.rival.Los || (LP7.rival.los || '').replace(/^./, c => c.toUpperCase()) }) : txtR ? { los: txtR.los, Los: txtR.Los } : null;
  C = FORM.combate({ semilla, rival: nomR, rotulo, avisa, H, vestir: true, vivo: true });   /* FU4: vivo, los rivales con IA propia (si combate() no la tiene aún, se ignora) */
  FL = crearFalangita({ S: C.S, motor: C.motor, alAviso: alFalangita }); window.__bloque.falangita = FL; FUI = { bajar: false, anillo: null, sostener: false, empuje: false, othismos: false };
  const F = C.S.fal; if (LP7 && LP7.lejos) { acercaRival(F, LP7.lejos); C.paso(0); } P0F = { x: F.xF, z: F.zF, giro: F.giro };
  TR = crearTropas({ S: C.S, muroDelante: false, reales: [{ b: C.S.ene.centro, hombres: txtR ? [] : F.ene }] });   /* FU4: a los demás rivales los pinta entero rival.js */
  FS = crearFisicaBloque({ S: C.S, TR, H, activa: false, semilla, guardia: FORM.guardia });
  { const mios = new WeakSet(F.fal); FI = FISICA ? crearFisica({ H, parMax: PAR_FAL, parMin: (a, b) => mios.has(a) && mios.has(b) ? PAR_FAL : undefined }) : null; }   /* BT1: dos falangitas, nunca a menos de PAR_FAL (si no, las sarisas no caben entre ellos) */
  if (RIVD) { try { RIVD.quita(); } catch (e) { /* ya no estaba */ } RIVD = null; window.__bloque.rival = null; } montaRivalBloque(nomR);   /* FU4 */
  OF = { yo: () => { const h = F.fal[F.yo.i]; return h && h.vivo ? h : null; }, pide() {}, paso() {}, rival: null,
    estado: () => ({ duelo: false, yo: null, rival: null, heridas: 0, aliento: 1, parando: false, pilum: 0, carga: 0, eco: {}, caidas: 0, muertes: 0 }) };
  oficial = TR.figs.find(f => f.h === OF.yo()) || null; hud.pon(C); if (FORM.hud) hud.ordenes(FORM.ordenes, FORM.hud);
  FORM.monta({ THREE, escena, H, C, S: C.S, TR, Son, texto: t => { $('objetivo').textContent = t; },
    FI, ocultaYo: () => (cam1 && cam1.t() > 0.3 ? F.fal[F.yo.i] : null) }); dedos.oculta(); vuelos.length = 0; CAM.listo = false; camaraSigue(1e-4);   /* FU4: la física para las sarisas; en la vista del oficial su propia sarisa no se dibuja */
  rivF = null; sacude = 0; if (FORM.objetivo && !(LP7 && LP7.objetivo)) $('objetivo').textContent = txtR ? txtR.obj : FORM.objetivo;
  window.__bloque.C = C; window.__bloque.S = C.S; window.__bloque.oficial = OF;
}
/* lo que prevé LP1 al dibujar: mira hacia el lado de la raya más cerca de donde mira ahora */
function haciaDonde(p0, p1) {
  /* rumbo cuyo frente (sen a, −cos a) es perpendicular a la raya. De los dos: el más cerca del de ahora (dibujar al revés
     no da media vuelta); pero si eso es girar más de 50°, la raya está de lado: mira hacia fuera de donde está tu bloque */
  const c1 = Math.atan2(p1.z - p0.z, p1.x - p0.x), c2 = c1 + Math.PI, r = C.S.B ? C.S.B.rumbo : C.S.tuyo.ang;
  let a = Math.abs(angDif(c1, r)) <= Math.abs(angDif(c2, r)) ? c1 : c2;
  if (Math.abs(angDif(a, r)) > 50 * Math.PI / 180) {
    const c = centro(C.S.tuyo), F = fr(c1), s = (c.x - (p0.x + p1.x) / 2) * F.x + (c.z - (p0.z + p1.z) / 2) * F.z;
    if (Math.abs(s) > 2) a = s < 0 ? c1 : c2;
  }
  return Math.atan2(Math.sin(a), Math.cos(a));
}
/* soltar la raya: la primera fila irá sobre ella, mirando a haciaDonde. El ancho del bloque no cambia (más fácil de leer) */
function frenteDesdeRaya(p0, p1) { if (C.mando) return C.mando.dibujaFrente(p0, p1);   /* ES2: al cuerpo elegido, o a la línea entera */
  if (FORM.combate) return C.dibujaFrente(p0, p1);   /* FU3: la raya va tal cual al mando de la falange */
  C.frente({ x: (p0.x + p1.x) / 2, z: (p0.z + p1.z) / 2, ang: haciaDonde(p0, p1) }); }

/* saltar a un momento (capturas), con el jugador automático de LP2 */
function salta(fase) {
  const S = C.S, tu = S.tuyo; let salva = false, choqueT = -1, n = 0;
  oyente = (t, d) => { if (t === 'salva' && d.blanco === tu) salva = true; };
  const paso = () => { C.paso(0.1); FI && FI.paso(C.S.fal, 0.1); RIVD && RIVD.paso(0.1); TR.paso(0.1, S.T); FS.paso(0.1); LU && LU.paso(0.1); OF && OF.paso(0.1); n++; };
  if (S.escenario && fase !== 'dibuja' && fase !== 'gira') { const m = S.escenario.meta; C.frente({ x: m.x, z: m.z, ang: 0 }); }   /* FU1: cruzas hacia la colina */
  const hasta = (cond, conBot = true) => { while (!cond() && !S.ganador && S.T < 280) { if (conBot) C.bot('bueno'); paso(); } };
  if (fase === 'dibuja') { for (let i = 0; i < 20; i++) paso(); frenteDesdeRaya({ x: -4, z: -14 }, { x: 16, z: -24 }); for (let i = 0; i < 40; i++) paso(); }
  else if (fase === 'gira') { for (let i = 0; i < 20; i++) paso(); frenteDesdeRaya({ x: -16, z: 4 }, { x: -16, z: -14 }); for (let i = 0; i < 80; i++) paso(); }
  else if (fase === 'salva' || fase === 'testudo') { hasta(() => salva); if (fase === 'testudo') { C.orden('testudo'); for (let i = 0; i < 14; i++) paso(); } }
  else if (fase === 'carga') hasta(() => C.ordenUtil() === 'cargar');
  else if (fase === 'muro') {   /* FU5: avanza (el bot sin cargar) hasta que te vienen cargando; muro; sigue con el bot hasta 3 s tras el choque */
    while (!S.ganador && S.T < 280 && C.formaUtil() !== 'muro') { C.bot('sinOrdenes'); paso(); }
    C.forma('muro'); while (!S.ganador && S.T < 280 && !(choqueT > 0 && S.T - choqueT > 3)) { C.bot('sinOrdenes'); paso(); if (tu.contactos.length && choqueT < 0) choqueT = S.T; }
  }
  else if (fase === 'abierto') { hasta(() => salva); C.forma('abierto'); for (let i = 0; i < 14; i++) paso(); }   /* FU5: salva hacia ti, abres filas */
  else if (FORM.combate && RIV_TXT[Q.get('rival')] && (fase === 'choque' || fase === 'lucha')) {   /* FU4: elefantes, jinetes… no dan contactos de bloque: hasta que el primero llega a 4 m de la 1.ª fila */
    const F = S.fal, llega = () => F.ene.some(e => e.vivo && F.fal.some(h => h.vivo && h.r === 0 && Math.hypot(e.x - h.x, e.z - h.z) < 4)); let t0 = -1;
    hasta(() => { if (t0 < 0 && llega()) t0 = S.T; return t0 >= 0 && S.T - t0 > (fase === 'lucha' ? 1.5 : 0.3); });
  }
  else if (fase === 'choque' || fase === 'datos' || fase === 'lucha' || fase === 'duelo') { const dura = fase === 'lucha' ? 30 : fase === 'duelo' ? 1 : 4; hasta(() => { if (tu.contactos.length && choqueT < 0) choqueT = S.T; return choqueT > 0 && S.T - choqueT > dura; }); }   /* lucha (LP5a): 30 s de choque, con caídos */
  else if (fase === 'picas') hasta(() => !!S.fal && S.fal.fal.some(h => h.r === 0 && h.vivo && h.kB > 0.95));   /* FU3: la falange con las picas bajadas, antes del choque */
  else if (fase === 'flanco') hasta(() => !!S.flanco && !!S.flanco.de && Math.hypot(S.flanco.de.x - tu.x, S.flanco.de.z - tu.z) < 45);
  else if (fase === 'relevo') hasta(() => C.ordenUtil() === 'relevo');
  else if (fase === 'trabado' || fase === 'retirada') {   /* LP4b: trabado y perdiendo (fila agotada, sin relevos); luego «Retirada» */
    hasta(() => tu.contactos.length > 0 && S.T > 40); tu.relevos = 0; tu.fila = 0.8; tu.U.animo = 0.5; hasta(() => C.ordenUtil() === 'retirada');
    if (fase === 'retirada') { C.orden('retirada'); for (let i = 0; i < 110; i++) paso(); }
  }
  else if (fase === 'jefe') {   /* LP4b (4B): se retira, se rehace y su jefe vuelve por un lado: la raya dorada */
    hasta(() => tu.contactos.length > 0 && S.T > 40); tu.relevos = 0; tu.fila = 0.8; tu.U.animo = 0.5;
    while (!S.ganador && !(tu.vueltas && C.giroUtil()) && S.T < 280) { C.bot('retira'); paso(); }
  }
  else if (fase === 'fin') hasta(() => false);
  oyente = null; TR.asienta(); for (let i = 0; i < 60; i++) { TR.paso(0.05, S.T); FS.paso(0.05); RIVD && RIVD.paso(0.05); }
  if (fase !== 'testudo') $('grito').classList.remove('ve');
  if (fase === 'datos') $('datosB').click();
  if ((fase === 'dibuja' || fase === 'gira') && S.B && S.B.meta) dedos.muestra(S.B.meta.p0, S.B.meta.p1, S.B.meta.rumbo, false);
  return n;
}

/* ---------- FU2: el oficial (tú en la fila) ---------- */
let OF = null, DH = null, rivF = null, sacude = 0, FL = null, FH = null, FUI = null;   /* FU3b: FL las reglas del gesto, FH su HUD, FUI lo que lee dedos.js (bajar, anillo) */
const figDe = h => h ? TR.figs.find(f => f.h === h) || null : null;
/* el rival que se ve: la figura enemiga viva más cerca delante de tu hombre, a menos de 3,5 m; se guarda mientras viva */
function buscaRival(fy) {
  const F = fr(C.S.tuyo.ang), rb = OF.rival && OF.rival.b; let m = null, dm = 3.5 * 3.5, mb = null, dmb = dm;
  for (const f of TR.figs) {
    if (f.bando === fy.bando || f.vivo === false || f.h) continue;
    const dx = f.x - fy.x, dz = f.z - fy.z, d2 = dx * dx + dz * dz; if (dx * F.x + dz * F.z <= 0) continue;
    if (d2 < dm) { dm = d2; m = f; } if (f.b === rb && d2 < dmb) { dmb = d2; mb = f; }
  }
  return mb || m;   /* mejor uno del bloque con el que peleas: así la marca tumba a uno de ese bloque */
}
const pelea = () => { if (!C || !OF || !cam1 || !cam1.cerca() || !nivel) return 'nada'; const e = OF.estado(); return e.duelo ? 'duelo' : e.pilum > 0 ? 'pilum' : 'nada'; };
function oficialPinta() {
  if (!OF) return; const e = OF.estado(), fy = figDe(OF.yo()), T = C.S.T;
  if (OF.rival && OF.rival.marcado) { if (rivF) rivF.marcado = true; OF.rival.marcado = false; rivF = null; }
  if (rivF && rivF.vivo === false) rivF = null;
  if (!e.duelo || !fy) rivF = null; else if (!rivF) rivF = buscaRival(fy);
  if (rivF && fy) rivF.yaw = Math.atan2(fy.x - rivF.x, fy.z - rivF.z);   /* el galo te mira a ti */
  /* mantener el escudo: la pose de cubrirse se queda a medio gesto mientras mantienes */
  if (fy) {
    if (e.parando) { if (!fy.esp || fy.esp.clip !== 'cubrirse') fy.esp = { clip: 'cubrirse', t0: T, vel: 1.4 }; else if (fy.clip === 'cubrirse' && fy.t > TR.DUR.cubrirse * 0.5) fy.esp.vel = 1e-4; }
    else if (fy.esp && fy.esp.clip === 'cubrirse') fy.esp = null;
  }
}
const gestoDe = (f, clip, vel = 1) => { if (f) f.esp = { clip, t0: C.S.T, vel }; };
function chispas(n) {
  const a = figDe(OF.yo()), b = rivF; if (!a) return; const x = b ? (a.x + b.x) / 2 : a.x, z = b ? (a.z + b.z) / 2 : a.z, y = H(x, z) + 1.3;
  for (let j = 0; j < n; j++) suelta(chispa, CHISPA_N, x, y, z, (azarV() - 0.5) * 3, 1 + azarV() * 2, (azarV() - 0.5) * 3, 1, 0.8, 0.4, 0.4);
}
/* lo que cuenta oficial.js: gestos de las figuras, sonido, chispas y la sacudida (sonido y sacudida, solo si estás abajo) */
function alOficial(tipo, d) {
  const cerca = !!(cam1 && cam1.cerca()), son = f => { if (cerca) try { f(); } catch (err) { /* sin sonido */ } }, yo = figDe(OF && OF.yo());
  switch (tipo) {
    case 'arma': if (rivF && OF.rival) gestoDe(rivF, 'golpear', TR.DUR.golpear / ((OF.rival.tb || 0.9) + GOLPE)); break;
    case 'golpe':
      if (d.res === 'parado') { son(() => { Son.hierro(0, 0, 1); Son.madera(1, 0); }); chispas(10); gestoDe(rivF, 'encajar'); }
      else if (d.res === 'aguanta') son(() => Son.madera(0.7, 0));
      else { son(() => { Son.madera(0.8, 0); Son.esfuerzo(0, 1); Son.trueno(0.3); }); if (cerca) sacude = 0.35; }
      break;
    case 'estocada':
      gestoDe(yo, 'golpear', 1.6);
      if (d.res === 'mata') son(() => { Son.tierra(0); Son.herido(0); });
      else if (d.res === 'entra') son(() => Son.herido(0));
      else son(() => Son.hierro(0, 0, 0.6));
      break;
    case 'empuja': gestoDe(yo, 'encajar', 1.3); if (d.ok) { gestoDe(rivF, 'encajar'); son(() => Son.madera(0.8, 0)); } break;
    case 'cae': if (cerca) sacude = 0.5; break;
    case 'pilum': {
      gestoDe(yo, 'lanzar'); son(() => Son.lanza());
      if (FS && FS.activa) FS.salva(C.S.tuyo, null, 1, d.dur, 'pilum', () => d.a);
      else { const y0 = H(d.de.x, d.de.z) + 1.8; vuelos.push({ x0: d.de.x, z0: d.de.z, y0, x1: d.a.x, z1: d.a.z, y1: H(d.a.x, d.a.z) + 0.2, t: 0, dur: d.dur, alto: 4 + Math.hypot(d.a.x - d.de.x, d.a.z - d.de.z) * 0.18 }); }
      break;
    }
    case 'pilum-cae': if (d.mata) son(() => Son.herido(0)); break;
  }
}

/* ---------- bucle ---------- */
let tPrev = performance.now(), acum = 0;
function bucle(ahora) {
  const dt = Math.min(0.1, (ahora - tPrev) / 1000); tPrev = ahora;
  if (C) {
    if (!congelado && nivel && !(FORM.pausada && FORM.pausada())) {
      acum += dt; let k = 0; while (acum >= 0.05 && k < 4) { C.paso(0.05); FI && FI.paso(C.S.fal, 0.05); FL && FL.paso(0.05); acum -= 0.05; k++; } if (k === 4) acum = 0;
      OF.paso(dt); TR.paso(dt, C.S.T); FS.paso(dt);
      if (LU) { acumL += dt; while (acumL >= 0.05) { LU.paso(0.05); acumL -= 0.05; } }   /* CB3: el motor de lucha a paso fijo */
      lineaDeChoque(dt);
      /* la raya del frente se queda mientras el bloque va hacia ella */
      const B = C.S.B; if (!dedos.activo() && !C.mando) { if (B && B.meta) dedos.muestra(B.meta.p0, B.meta.p1, B.meta.rumbo, false); else dedos.oculta(); }
      try { sonBloque(dt); } catch (e) { /* sin sonido */ }
    }
    if (RIVD) RIVD.paso(dt);   /* FU4: también congelado: las reglas no avanzan y el dibujo del rival llega a su sitio */
    FORM.paso(congelado ? 5 : dt);   /* FU1: el techo, tras mover a los hombres */
    if (!FORM.combate) { MU.paso(congelado ? 5 : dt); ABI.paso(congelado ? 0 : dt); }   /* FU5 */
    oficialPinta();
    camaraSigue(congelado ? 5 : dt); cam1 && cam1.aplica(congelado ? 5 : dt);
    if (sacude > 0) { sacude = Math.max(0, sacude - dt); const a = 0.25 * sacude; camara.position.x += (azarV() - 0.5) * a; camara.position.y += (azarV() - 0.5) * a; }
    camara.updateMatrixWorld(); escena.fog.density = brumaPara(distanciaVista(camara));   /* BT1: nítido donde miras, bruma en el horizonte */
    if (FL) {   /* FU3b */
      const e = FL.estado(); FORM.vis && (FORM.vis.bajadas = e.bajadas);
      const fr0 = C.S.tuyo, pf = proyecta(fr0.x, 3.2, fr0.z), hh = e.hueco && FL.hueco ? (FL.hueco.h || null) : null, ph = e.hueco ? proyecta(hh ? hh.x : fr0.x, 0.1, hh ? hh.z : fr0.z) : null;
      FH.pinta({ ve: !!nivel, est: e, frente: pf, hueco: ph, dt: congelado ? 0 : dt }); FUI.bajar = !!(e.rival && e.rival.fase === 'acomete'); FUI.anillo = FH.anillo();
      FUI.empuje = !!(e.empuje && e.empuje.fase === 'empuja'); FUI.othismos = !!(e.othismos && e.othismos.fase === 'empuja'); FUI.sostener = !!(FUI.empuje || FUI.othismos || e.lucha);   /* FU3c */
    }
    DH.pinta({ ve: !!(FORM.duelo !== false && nivel && cam1 && cam1.t() > 0.5), est: OF.estado(), aro: rivF ? proyecta(rivF.x, 1.45, rivF.z) : null, dedo: dedos.dedoEn(), modo: pelea(), dt: congelado ? 0 : dt });
    mPolvo.material.opacity = cam1 ? 1 - 0.75 * cam1.t() : 1;   /* LP7: abajo, el polvo no tapa media pantalla */
    avanza(polvo, POLVO_N, mPolvo, congelado ? 0 : dt, -0.1); avanza(chispa, CHISPA_N, mChispa, congelado ? 0 : dt, 6); pintaVuelos(congelado ? 0 : dt);
    pintaSoldados(); hud.tick(dt); AB && AB.paso(dt); FORM.despues && FORM.despues(dt); separaEstandartes($('ests'));   /* FU5, ES2 */
     campo && campo.tick(ahora / 1000);
  }
  renderer.render(escena, camara);
  requestAnimationFrame(bucle);
}

let campo = null;
/* SON7: el sonido del manípulo cada fotograma: el fragor (golpes según cuántos frentes se tocan, cada caído se oye), los pasos de
   la formación al marchar y la música y las voces (js/gfx/banda.js), que suben con la tensión */
let BANDA = null, tPasoB = 0;
function sonBloque(dt) {
  const S = C.S, tu = S.tuyo, ene = S.bloques.filter(b => b.bando === 'g'), n = tu.contactos.length;
  const fe = FL ? FL.estado() : null, emp = fe && ((fe.empuje && fe.empuje.fase === 'empuja') || (fe.othismos && fe.othismos.fase === 'empuja')), cede = emp && ((fe.empuje && !fe.empuje.sujeta) || (fe.othismos && fe.othismos.fuerza < 0));   /* FU3c: el fragor del empuje */
  Son.pulso && Son.pulso(dt, { lucha: emp ? 1 : n ? Math.min(1, 0.55 + 0.25 * n) : 0, moral: cede ? Math.min(0.3, tu.U.animo) : tu.U.animo, caen: tu.U.sufrio, caenR: ene.reduce((a, b) => a + (b.U.sufrio || 0), 0), marcha: Math.min(1, Math.abs(tu.v || 0) / 3) /* FU5 */ });
  const v = Math.abs(tu.v || 0); tPasoB -= dt;
  if (v > 0.3 && !n && tPasoB <= 0) { tPasoB = v > 2.5 ? 0.38 : 0.55; Son.paso && Son.paso(v > 2.5 ? 1.2 : 0.8, tu.orden === 'testudo' ? 1 : 0); }
  if (BANDA) BANDA.tic(dt, () => ({ fase: S.ganador ? 'fin' : n ? 'lucha' : 'lejos', moral: [tu.U.animo, ene.length ? Math.min(...ene.filter(b => b.estado !== 'fuera').map(b => b.U.animo)) : 1],
    rotos: [tu.U.roto ? 1 : 0, Math.min(3, ene.filter(b => b.U.roto).length)], cansancio: tu.U.cansancio || 0, resultado: S.ganador === 'tuyo' ? 'victoria' : 'derrota' }), () => !tu.U.roto && tu.U.animo < 0.3);
}
/* LP7: lo que vuelve a la batalla grande. k: tuyo, centro, amigas0/1, alas0/1, reserva, tiradores */
function resultadoLP7() {
  if (C && FORM.combate) return resultadoLP7F(C.S.fal, P0F || undefined);   /* FU3: el contrato de la falange (acciones.js) */
  if (!C) return null; const S = C.S, E = S.ene, todos = { tuyo: S.tuyo, amigas0: S.amigas[0], amigas1: S.amigas[1], centro: E.centro, alas0: E.alas[0], alas1: E.alas[1], reserva: E.reserva, tiradores: E.tiradores }, bl = {};
  for (const k in todos) { const b = todos[k]; if (b.estado === 'fuera' && !S.bloques.includes(b)) continue; bl[k] = { hombres: b.U.hombres, enPie: b.U.enPie, roto: b.U.roto }; }
  const tu = S.tuyo; return { ganador: S.ganador, causa: S.causa, T: +S.T.toFixed(1), bloques: bl, pose: { x: tu.x, z: tu.z, ang: tu.ang } };
}
let enviado = false;
function vuelveLP7() { if (enviado) return; enviado = true; try { parent.postMessage({ aqvila: 'lp7', r: resultadoLP7() }, location.origin); } catch (e) { console.warn(e); } }
window.__bloque = { listo: false, congela: b => { congelado = !!b; }, lp7: () => resultadoLP7(), vuelve: () => vuelveLP7(), salta: f => salta(f), dibuja: (a, b) => C && frenteDesdeRaya(a, b), orden: n => C && C.orden(n), muestraFin: () => hud && hud.muestraFin(),
  estado: () => ({ T: C && C.S.T, nivel, ganador: C && C.S.ganador, util: C && C.ordenUtil(), orden: C && C.S.tuyo.orden, llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles, figs: TR && TR.figs.length, caidos: TR && TR.caidos.length }), fisica: () => FS && FS.medir() };

async function arranca() {
  hud = crearHud({ $, proyecta, ladoEnPantalla, Son });
  AB = crearAbanico({ $, padre: $('hud'), Son }); window.__bloque.abanico = AB; window.__bloque.forma = f => C && C.forma && C.forma(f);   /* FU5 */
  dedos = crearDedos({ lienzo, suelo, haciaDonde: (a, b) => haciaDonde(a, b), alSoltar: (a, b) => { if (C && nivel && !congelado) frenteDesdeRaya(a, b); }, H, libre: () => !cam1 || cam1.libre(), escala: () => cam1 ? 1 - 0.6 * cam1.t() : 1,
    pelea, fal: () => (FUI && C && nivel && !congelado ? FUI : null), alGesto: (g, d) => { if (g === 'bajar' || g === 'cerrar' || g === 'sostener' || g === 'golpe') { if (FL && C && nivel && !congelado) FL.pide(g, g === 'cerrar' ? (FL.hueco ? { col: FL.hueco.col } : {}) : g === 'sostener' ? { on: !!(d && d.on) } : undefined); return; } if (C && nivel && !congelado && OF && cam1 && cam1.cerca()) OF.pide(g, d); } });
  cam1 = crearCamara({ camara, lienzo, H, estado: () => C && C.S, hud: $('hud'), inicial: Q.get('vista') === 'oficial' ? 'oficial' : 'arriba',
    yo: () => OF && OF.yo(), modo: () => { const e = OF && OF.estado(); return { duelo: !!(e && e.duelo && rivF), techo: !!(FORM.cerrado && FORM.cerrado()), rival: rivF ? { x: rivF.x, z: rivF.z } : null }; } }); window.__bloque.vista = cam1;
  /* FU4: medida de la física con la falange: picas dibujadas (ya retiradas) y cuerpos (Fi.medir); y el peso del dibujo del rival */
  window.__bloque.fisica = () => { if (!C || !C.S.fal) return null; const v = FORM.vis || {}; v.mide = true; const pz = v.picas || [], m = FI ? FI.medir(C.S.fal, pz) : {}; return { activa: !!FI, picas: pz.length, distMin: m.distMin, puntasDentro: m.puntasDentro, pisados: m.pisados, rival: RIVD ? RIVD.peso() : null }; };
  window.__bloque.choques = o => medirChoques(escena, Object.assign({ figs: TR ? TR.figs.concat(TR.caidos) : [] }, o));   /* BT1: nada atraviesa nada (lo que se pinta: astas, brazos, escudos y caídos) */
  DH = crearDueloHud({ padre: $('hud') }); if (FALANGE) FH = crearFalangitaHud({ padre: $('hud') }); window.__bloque.pide = (g, d) => OF && OF.pide(g, d);
  escena.add(dedos.raya);
  creaSombras(); creaEfectos();
  $('carga-t').textContent = FALANGE ? 'Formando la falange…' : 'Formando el manípulo…';
  /* AL11: cada bando carga sus modelos y los que les prestan armas (soldados.js); una tropa por modelo y nivel */
  const pide = [], nombres = new Set(); for (const b of ['r', 'g']) for (const n of [...modelos(b), ...prestan(b)]) nombres.add(b + ':' + n);   /* LP7: por bando (mismo modelo, otros colores) */
  const cargados = {}; for (const k of nombres) { const [b, n] = k.split(':'); pide.push(cargarSoldado(n, paleta(n, b)).then(s => { cargados[k] = s; })); }
  const [cs] = await Promise.all([crearCampo(escena, { H, SOL, cine, sueloCine, BRUMA: escena.fog.color }).catch(e => { console.warn('Sin campo', e); return null; }), ...pide]);
  campo = cs;
  if (ASC) for (const k of ASC.bando === 'pirro' ? ['r:falangita', 'r:oficial-falange'] : ['g:falangita']) if (cargados[k]) for (const nv of cargados[k].niveles) if (nv && nv.mat) azulea(nv.mat);
  if (ASC) for (const k of ['r:falangita', 'r:oficial-falange', 'g:falangita']) if (cargados[k]) cargados[k].niveles = cargados[k].niveles.map(nv => nv ? paraFalange(nv) : nv);   /* BT1: en Ásculo, como en la falange: sin la lanza del modelo (la sarisa la pinta formaciones/falange.js) y el escudo al pecho */
  if (FALANGE) for (const k of ['r:falangita', 'r:oficial-falange']) if (cargados[k]) for (const nv of cargados[k].niveles) if (nv && nv.mat) azulea(nv.mat);   /* FU3b */
  if (FALANGE) for (const k of ['r:falangita', 'r:oficial-falange']) if (cargados[k]) cargados[k].niveles = cargados[k].niveles.map(nv => nv ? paraFalange(nv) : nv);   /* FU3c: una sola arma por hombre (sin la lanza del modelo, queda la sarisa de formaciones/falange.js) y el escudo al pecho (soldados.js) */
  for (const b of ['r', 'g']) {
    for (const n of modelos(b)) { const s = cargados[b + ':' + n]; if (s) T[b][n] = NIV.map((nv, k) => { const t = tropa(s.niveles[nv], TOPE[b][k]); escena.add(t.malla); return t; }); else console.warn('Falta soldado', n); }
    for (const n of prestan(b)) { const s = cargados[b + ':' + n]; if (s) A[b][n] = NIV.map((nv, k) => { const t = tropa(soloArmas(s.niveles[nv]), TOPE[b][k]); escena.add(t.malla); return t; }); else console.warn('Faltan armas de', n); }
  }
  if (TESTUDO) {   /* FU1: la tarjeta de entrada del testudo */
    const ps = document.querySelectorAll('#inicio p'); $('inicio').querySelector('h1').textContent = 'Manípulo y Testudo a pie';
    ps[0].innerHTML = 'Cruza el campo hasta la <b>colina</b>. <b>Arrastra el dedo por el suelo</b>: ahí formará tu primera fila.';
    ps[1].innerHTML = 'Los tiradores galos lanzarán <b>dos salvas</b> mientras cruzas. Cuando se ilumine <b>«Testudo»</b>, tócalo: los escudos cierran un techo. Luego, tócalo otra vez para abrirlo.';
    ps[2].innerHTML = 'Después, los galos cargan: pelea y, cuando tu primera fila se canse, toca <b>«Relevo»</b> para que entre una fresca. Se lucha hasta que queda el 15 %.';
  }
  if (FALANGE && !Q.get('lp7')) {   /* CG4b (pase de UN2): la tarjeta de entrada de la falange; antes salía la del manípulo */
    const ps = document.querySelectorAll('#inicio p'), nomR = Q.get('rival') || 'manipulos', txtR = RIV_TXT[nomR];
    const enfrente = txtR ? 'Enfrente, ' + txtR.los + '. ' + txtR.obj + '.' : 'Enfrente, los manípulos romanos. Baja las picas y rómpelos.';
    $('inicio').querySelector('h1').textContent = 'Falange a pie';
    ps[0].innerHTML = 'Mandas tu falange, no a un hombre. <b>Arrastra el dedo por el suelo</b>: ahí formará tu primera fila. Un muro de sarisas gira despacio: piensa antes de mover.';
    ps[1].innerHTML = 'Abajo, la barra de órdenes de todas las batallas. La primera es la de la falange: <b>«Bajar picas»</b> (las cinco primeras filas apuntan al frente). «Relevo» cierra filas; «Cargar» empuja en el choque. La que conviene <b>se ilumina</b>. Alzadas, las picas paran los proyectiles.';
    ps[2].textContent = enfrente;
  }
  if (ASC) {   /* UN3: la tarjeta de entrada de Ásculo (antes salía la del manípulo contra los galos) */
    const ps = document.querySelectorAll('#inicio p'), P = ASC.bando === 'pirro';
    $('inicio').querySelector('h1').textContent = 'Ásculo, 279 a.C.';
    ps[0].innerHTML = P ? 'Eres <b>Pirro</b>: tu falange al centro, dos manípulos itálicos a sus lados y honderos detrás.' : 'Eres <b>Roma</b>: tres manípulos y tus vélites detrás. Los manípulos pueden cerrar el <b>testudo</b>.';
    ps[1].innerHTML = 'Abajo, una ficha por cuerpo: <b>toca la ficha</b> y arrastra el dedo por el suelo para darle su frente, o elige «Todos». El <b>botón de pausa</b>, arriba, para el tiempo y deja dar órdenes. Toca un rival para que tus tiradores lo marquen.';
    ps[2].textContent = P ? 'Enfrente, la legión romana con sus vélites. Rompe su línea.' : 'Enfrente, la falange de Pirro y sus honderos. Aguanta y rómpela.';
  }
  nueva(nivel || 'normal');
  $('salir').addEventListener('click', salir); $('salir2').addEventListener('click', salir);
  $('otra').addEventListener('click', () => { $('fin').hidden = true; $('inicio').hidden = false; });
  for (const b of document.querySelectorAll('[data-nivel]')) b.addEventListener('click', () => { $('inicio').hidden = true; nueva(b.dataset.nivel); });
  addEventListener('pointerdown', () => { try { Son.inicia(); } catch (e) { /* sin sonido */ } }, { once: true });
  try { BANDA = window.Banda.crea({ padre: $('hud'), propio: 'romano', rival: { esGriego: false, galos: true }, semilla: 43, abajo: '120px' }); Son.alSonar(() => BANDA.inicia()); window.__bloque.banda = BANDA; } catch (e) { console.log('[SON7] sin banda: ' + e.message); }   /* SON7 */
  if (FASE) { nivel = nivel || 'normal'; nueva(nivel); salta(FASE); congelado = FASE !== 'duelo';   /* FU2: ?fase=duelo deja la partida viva en el choque */ if (FASE === 'fin') hud.muestraFin(); }
  else if (!Q.get('nivel') && !LP7) { nivel = null; $('inicio').hidden = false; }
  if (FALANGE) { const cr = document.querySelector('#fin .creditos'); if (cr) cr.textContent = 'FU4 · Falange a pie (Polibio 18.29–32; elefantes: Polibio 11.1, Plutarco, Pirro 25). Falangitas: Meshy (CC BY 4.0) adaptado en AQVILA · Elefantes, jinetes y rivales: 0 A.D. (Wildfire Games, CC BY-SA 3.0) · Movimientos: Quaternius (CC0) · Cielo y suelos de Poly Haven (CC0) · Sonido CC0'; }   /* FU4: los créditos de la falange, no los del manípulo */
  if (LP7) { $('otra').hidden = true; $('salir2').textContent = 'Volver a la batalla'; if (LP7.objetivo) $('objetivo').textContent = LP7.objetivo;
    const cr = document.querySelector('#fin .creditos'); if (cr) cr.textContent = cr.textContent.replace(/^LP3 · [^)]*\)\. /, ''); }   /* el crédito, sin «contra galos» */
  $('carga').hidden = true;
  requestAnimationFrame(t => { tPrev = t; bucle(t); });
  window.__bloque.listo = true;
}
function salir() { if (LP7) return vuelveLP7(); if (history.length > 1) history.back(); else location.href = './'; }
arranca().catch(e => { console.error(e); $('carga-t').textContent = 'No se pudo cargar: ' + e.message; });
