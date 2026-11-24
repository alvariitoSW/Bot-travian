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
   Gancho para pruebas: window.__bloque = { listo, C, S, dibuja(p0, p1), orden(n), estado() }. */
import { THREE } from '../../../js/gfx/models.js';
import { cargarSoldado, tropa } from '../../../js/gfx/soldado.js';
import { crearCampo } from '../falange/campo.js';
import * as Son from '../a-pie/sonido.js';
import * as BL from '../../../js/bloque.js';
import { crearCombate, centro, NIVELES, SALVA_VUELO } from '../../../js/bloque-ia.js';
import { crearTropas } from './tropas.js';
import { crearFisicaBloque } from './fisica.js';   /* LP5a: los cuerpos no se atraviesan; pilum y jabalinas con física (?fisica=0, el antes) */
import { crearHud } from './hud.js';
import { crearDedos } from './dedos.js';
import { crearCamara } from './camara.js';
import { separaEstandartes } from './rotulos.js';
import { modelos, prestan, ARMAS, FONDO, paleta, modeloDe, eligeOficial, soloArmas } from './soldados.js';

const Q = new URLSearchParams(location.search), FASE = Q.get('fase'), $ = id => document.getElementById(id);
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const angDif = (a, b) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
const fr = a => ({ x: Math.sin(a), z: -Math.cos(a) });
let semillaV = 7; const azarV = () => { semillaV = (semillaV * 16807) % 2147483647; return (semillaV - 1) / 2147483646; };
/* el suelo: el de la falange (llano donde se lucha, loma detrás de los galos) */
const H = (x, z) => 3.4 * suave(-70, -103, z) * (1 + 0.06 * Math.sin(x * 0.07)) + 0.22 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(z * 0.045 + 1.3) + 0.6 * suave(30, 90, Math.abs(x)) * Math.sin(z * 0.03);

/* ---------- luz de cine (copiada de ../falange/escena.js): gradación dentro del tonemapping y Lambert con borde de contraluz ---------- */
THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }', `vec3 CustomToneMapping( vec3 color ) {
  vec3 p = sqrt( ACESFilmicToneMapping( color ) );
  float l = dot( p, vec3( 0.299, 0.587, 0.114 ) );
  p = mix( vec3( l ), p, 1.18 );
  p = mix( p, p * p * ( 3.0 - 2.0 * p ), 0.45 );
  p += vec3( -0.012, 0.004, 0.022 ) * ( 1.0 - l ) * ( 1.0 - l ) + vec3( 0.03, 0.012, -0.03 ) * l * l;
  p = clamp( p, 0.0, 1.0 );
  return p * p;
}`);
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
renderer.toneMapping = THREE.CustomToneMapping; renderer.toneMappingExposure = 1.08;
const HORIZ = '#dcb888';
const escena = new THREE.Scene(); escena.background = new THREE.Color(HORIZ); escena.fog = new THREE.FogExp2('#c9a77a', 0.0042);
const camara = new THREE.PerspectiveCamera(58, 1, 0.3, 12000);
/* el sol: bajo, delante (detrás de los galos) y algo a la derecha: contraluz, como en la falange */
const SOL = new THREE.Vector3(0.13, 0.33, -0.94).normalize();
escena.add(new THREE.HemisphereLight(0xb9c8e0, 0x6e5a3e, 1.5));
const luz = new THREE.DirectionalLight(0xffcb90, 3.0); luz.position.copy(SOL).multiplyScalar(40); escena.add(luz);
/* relleno fuerte desde la cámara: a contraluz los hombres saldrían negros y no se distinguirían los bandos */
const relleno = new THREE.DirectionalLight(0xfff0dc, 2.4); relleno.position.set(-0.4, 0.6, 1); escena.add(relleno);
const texCielo = new THREE.TextureLoader().load('gobierno/maquetas/testudo-luz-campo/arte/cielo.jpg'); texCielo.colorSpace = THREE.SRGBColorSpace; texCielo.wrapS = THREE.RepeatWrapping; texCielo.generateMipmaps = false; texCielo.minFilter = THREE.LinearFilter;
const cielo = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uCielo: { value: texCielo }, uSol: { value: SOL }, uH: { value: new THREE.Color(HORIZ) } },
  vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `varying vec3 vD; uniform sampler2D uCielo; uniform vec3 uSol, uH;
  void main(){ vec3 d = normalize(vD); float e = asin(clamp(d.y, -1.0, 1.0));
    vec3 c = texture2D(uCielo, vec2(fract((atan(d.z, d.x) - atan(uSol.z, uSol.x)) / 6.2831853 + 0.1), clamp((e + 0.0733) / 1.6441, 0.002, 0.998))).rgb; c = pow(c, vec3(1.25)) * 1.05;
    float s = max(dot(d, uSol), 0.0);
    c *= mix(vec3(0.82, 0.9, 1.04), vec3(1.22, 0.98, 0.72), pow(s, 2.0)) * mix(vec3(1.12, 0.95, 0.76), vec3(1.0), smoothstep(0.02, 0.4, e));
    c = mix(c, c * vec3(0.6, 0.76, 1.0), smoothstep(0.06, 0.5, e) * (1.0 - pow(s, 2.0)));
    c = mix(uH, c, smoothstep(-0.01, 0.1, e));
    c += vec3(1.0, 0.72, 0.42) * (pow(s, 8.0) * 0.55 + pow(s, 90.0) * 1.2) + vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9997, s) * 6.0;
    gl_FragColor = vec4(c, 1.0);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
  }` }));
cielo.renderOrder = -10; escena.add(cielo);
let vertical = true;
function medir() { const w = innerWidth, h = innerHeight; vertical = h >= w; renderer.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix(); }
addEventListener('resize', medir); medir();

/* ---------- cámara: detrás y arriba de tu bloque; gira con él, despacio (el mundo no se mueve contigo) ---------- */
const CAMS = { v: { d: 30, alto: 27, ad: 18, fov: 56 }, h: { d: 26, alto: 16, ad: 18, fov: 44 } };
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number); for (const t of [CAMS.v, CAMS.h]) ['d', 'alto', 'ad', 'fov'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
const CAM = { x: 0, z: 0, yaw: 0, obj: 0, listo: false };
function camaraSigue(dt) {
  const S = C.S, tu = S.tuyo, c = centro(tu), K = vertical ? CAMS.v : CAMS.h;
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
const NIV = [1, 2, 3], TOPE = { r: [22, 150, 900], g: [0, 142, 1300] }, DMAX = [26, 70];
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
      if (usados[n] >= TOPE[b][n]) continue; let mo = tr[modeloDe(f, oficial)] ? f.modelo : hay[0]; if (n === 2 && tr[FONDO[mo]]) mo = FONDO[mo]; const t = tr[mo][n], i = t.sig(); if (i < 0) continue; usados[n]++;
      const y = H(f.x, f.z); P3.set(f.x, y, f.z); QT.setFromAxisAngle(Y, f.yaw); E3.set(f.talla, f.talla, f.talla); M4.compose(P3, QT, E3);
      const v4 = var4(f.semilla), mu = t.muestra(f.clip, f.t); t.matriz(i, M4.elements); t.vars(i, v4); t.pose(i, f.clip, f.t, mu);
      const pa = ar[ARMAS[mo]]; if (pa) { const ta = pa[n], ia = ta.sig(); if (ia >= 0) { ta.matriz(ia, M4.elements); ta.vars(ia, v4); ta.pose(ia, f.clip, f.t, ta.muestra(f.clip, f.t)); } }
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
  mJab = new THREE.InstancedMesh(gj, new THREE.MeshLambertMaterial({ color: 0x5a4630 }), 160); mJab.frustumCulled = false; mJab.count = 0; escena.add(mJab);
}
function suelta(P, N, x, y, z, vx, vy, vz, r, g, b, vida) { const i = P.k; P.k = (P.k + 1) % N; P.pos.set([x, y, z], i * 3); P.vel.set([vx, vy, vz], i * 3); P.col.set([r, g, b], i * 3); P.vida[i] = vida; P.col0 = P.col0 || new Float32Array(N * 3); P.col0.set([r, g, b], i * 3); }
function avanza(P, N, m, dt, cae) {
  for (let i = 0; i < N; i++) { if (P.vida[i] <= 0) continue; P.vida[i] -= dt; const k = Math.max(0, Math.min(1, P.vida[i]));
    for (let c = 0; c < 3; c++) { P.pos[i * 3 + c] += P.vel[i * 3 + c] * dt; P.col[i * 3 + c] = P.col0[i * 3 + c] * k; }
    P.vel[i * 3 + 1] -= cae * dt; if (P.vida[i] <= 0) P.pos[i * 3 + 1] = -99; }
  m.geometry.attributes.position.needsUpdate = true; m.geometry.attributes.color.needsUpdate = true;
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
const LARGO = { pilum: 2.0, jabalina: 1.5, flecha: 0.75 };
/* un punto al azar entre los hombres del bloque a (donde caen pilum y jabalinas) */
const puntoEn = a => { const men = TR.figs.filter(f => f.b === a); return () => { if (!men.length) { const c = centro(a); return { x: c.x, z: c.z }; } const f = men[Math.floor(azarV() * men.length)]; return { x: f.x + (azarV() - 0.5) * 1.6, z: f.z + (azarV() - 0.5) * 1.6 }; }; };
function lanzaFisica(de, a, n, dur, tipo) { if (!FS || !FS.activa) return lanza(de, a, n, dur); FS.salva(de, a, n, dur, tipo, puntoEn(a)); }
function pintaVuelos(dt) {
  let n = 0;
  /* LP5a: los de la física (en vuelo, clavados en escudos y cuerpos, en el suelo): la punta y la dirección las da el motor */
  if (FS && FS.activa) for (const p of FS.Fi.proyectiles) {
    if (n >= 160) break; const d = FS.Fi.dondeP(p), L = LARGO[p.tipo] || 1.5;
    E3.set(d.dx, d.dy, d.dz); if (E3.lengthSq() < 1e-8) continue; E3.normalize(); P3.set(d.x - E3.x * L / 2, d.y - E3.y * L / 2, d.z - E3.z * L / 2);
    QT.setFromUnitVectors(Z1, E3); E3.set(1, 1, L / 1.7); M4.compose(P3, QT, E3); mJab.setMatrixAt(n++, M4);
  }
  for (let i = vuelos.length - 1; i >= 0; i--) { const v = vuelos[i]; v.t += dt; if (v.t > v.dur + 2.5) { vuelos.splice(i, 1); continue; } if (v.t < 0 || n >= 160) continue;
    const u = Math.min(1, v.t / v.dur), u2 = Math.min(1, (v.t + 0.05) / v.dur), at = w => [v.x0 + (v.x1 - v.x0) * w, v.y0 + (v.y1 - v.y0) * w + v.alto * 4 * w * (1 - w), v.z0 + (v.z1 - v.z0) * w];
    const p = at(u), q = u < 1 ? at(u2) : at(1), dir = u < 1 ? [q[0] - p[0], q[1] - p[1], q[2] - p[2]] : [v.x1 - v.x0, -2, v.z1 - v.z0];
    P3.set(...p); E3.set(...dir).normalize(); QT.setFromUnitVectors(new THREE.Vector3(0, 0, 1), E3); M4.compose(P3, QT, new THREE.Vector3(1, 1, 1)); mJab.setMatrixAt(n++, M4); }
  mJab.count = n; mJab.instanceMatrix.needsUpdate = true;
}

/* ---------- partida ---------- */
let C = null, TR = null, FS = null, hud = null, dedos = null, cam1 = null, congelado = false, nivel = NIVELES.includes(Q.get('nivel')) ? Q.get('nivel') : null;
const semilla = +(Q.get('semilla') || (1 + Math.floor(Math.random() * 999)));
let oyente = null;
function avisa(tipo, d) {
  if (oyente) oyente(tipo, d);
  if (hud) hud.aviso(tipo, d);
  try {
    switch (tipo) {
      case 'orden': Son.voz && Son.voz(d.texto); if (d.n === 'testudo') Son.clac && Son.clac(6); break;
      case 'salva': if (C) { const t = C.S.ene.tiradores; if (t && d.blanco) { lanzaFisica(t, d.blanco, 34, SALVA_VUELO, 'jabalina'); TR && TR.lanzan(t, C.S.T); } } Son.salva && Son.salva(SALVA_VUELO); break;
      case 'jabalinas': Son.clac && Son.clac(d.testudo ? 12 : 5); break;
      case 'pilum': if (C && d.blanco) { lanzaFisica(C.S.tuyo, d.blanco, 26, 1.1, 'pilum'); TR && TR.lanzan(C.S.tuyo, C.S.T); } Son.lanza && Son.lanza(); break;
      case 'choque': Son.choque && Son.choque(); break;
      case 'rompe': Son.cuerno && Son.cuerno(2); break;
    }
  } catch (e) { /* sin sonido */ }
}
function nueva(n) {
  nivel = n; C = crearCombate({ semilla, nivel, motor: BL, avisa }); TR = crearTropas({ S: C.S }); FS = crearFisicaBloque({ S: C.S, TR, H, activa: Q.get('fisica') !== '0', semilla }); oficial = eligeOficial(TR.figs); hud.pon(C); dedos.oculta(); vuelos.length = 0; CAM.listo = false; camaraSigue(1e-4);
  window.__bloque.C = C; window.__bloque.S = C.S;
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
function frenteDesdeRaya(p0, p1) { C.frente({ x: (p0.x + p1.x) / 2, z: (p0.z + p1.z) / 2, ang: haciaDonde(p0, p1) }); }

/* saltar a un momento (capturas), con el jugador automático de LP2 */
function salta(fase) {
  const S = C.S, tu = S.tuyo; let salva = false, choqueT = -1, n = 0;
  oyente = (t, d) => { if (t === 'salva' && d.blanco === tu) salva = true; };
  const paso = () => { C.paso(0.1); TR.paso(0.1, S.T); FS.paso(0.1); n++; };
  const hasta = (cond, conBot = true) => { while (!cond() && !S.ganador && S.T < 280) { if (conBot) C.bot('bueno'); paso(); } };
  if (fase === 'dibuja') { for (let i = 0; i < 20; i++) paso(); frenteDesdeRaya({ x: -4, z: -14 }, { x: 16, z: -24 }); for (let i = 0; i < 40; i++) paso(); }
  else if (fase === 'gira') { for (let i = 0; i < 20; i++) paso(); frenteDesdeRaya({ x: -16, z: 4 }, { x: -16, z: -14 }); for (let i = 0; i < 80; i++) paso(); }
  else if (fase === 'salva' || fase === 'testudo') { hasta(() => salva); if (fase === 'testudo') { C.orden('testudo'); for (let i = 0; i < 14; i++) paso(); } }
  else if (fase === 'carga') hasta(() => C.ordenUtil() === 'cargar');
  else if (fase === 'choque' || fase === 'datos' || fase === 'lucha') { const dura = fase === 'lucha' ? 30 : 4; hasta(() => { if (tu.contactos.length && choqueT < 0) choqueT = S.T; return choqueT > 0 && S.T - choqueT > dura; }); }   /* lucha (LP5a): 30 s de choque, con caídos */
  else if (fase === 'flanco') hasta(() => !!S.flanco && !!S.flanco.de && Math.hypot(S.flanco.de.x - tu.x, S.flanco.de.z - tu.z) < 45);
  else if (fase === 'relevo') hasta(() => C.ordenUtil() === 'relevo');
  else if (fase === 'trabado' || fase === 'retirada') {   /* LP4b: trabado y perdiendo (fila agotada, sin relevos); luego «Retirada» */
    hasta(() => tu.contactos.length > 0 && S.T > 40); tu.relevos = 0; tu.fila = 0.8; tu.U.animo = 0.5; hasta(() => C.ordenUtil() === 'retirada');
    if (fase === 'retirada') { C.orden('retirada'); for (let i = 0; i < 110; i++) paso(); }
  }
  else if (fase === 'fin') hasta(() => false);
  oyente = null; TR.asienta(); for (let i = 0; i < 60; i++) { TR.paso(0.05, S.T); FS.paso(0.05); }
  if (fase !== 'testudo') $('grito').classList.remove('ve');
  if (fase === 'datos') $('datosB').click();
  if ((fase === 'dibuja' || fase === 'gira') && S.B && S.B.meta) dedos.muestra(S.B.meta.p0, S.B.meta.p1, S.B.meta.rumbo, false);
  return n;
}

/* ---------- bucle ---------- */
let tPrev = performance.now(), acum = 0;
function bucle(ahora) {
  const dt = Math.min(0.1, (ahora - tPrev) / 1000); tPrev = ahora;
  if (C) {
    if (!congelado && nivel) {
      acum += dt; let k = 0; while (acum >= 0.05 && k < 4) { C.paso(0.05); acum -= 0.05; k++; } if (k === 4) acum = 0;
      TR.paso(dt, C.S.T); FS.paso(dt); lineaDeChoque(dt);
      /* la raya del frente se queda mientras el bloque va hacia ella */
      const B = C.S.B; if (!dedos.activo()) { if (B && B.meta) dedos.muestra(B.meta.p0, B.meta.p1, B.meta.rumbo, false); else dedos.oculta(); }
      try { Son.lucha && Son.lucha(C.S.tuyo.contactos.length ? 1 : 0); } catch (e) { /* sin sonido */ }
    }
    camaraSigue(congelado ? 5 : dt); cam1 && cam1.aplica(congelado ? 5 : dt); camara.updateMatrixWorld();
    avanza(polvo, POLVO_N, mPolvo, congelado ? 0 : dt, -0.1); avanza(chispa, CHISPA_N, mChispa, congelado ? 0 : dt, 6); pintaVuelos(congelado ? 0 : dt);
    pintaSoldados(); hud.tick(dt); separaEstandartes($('ests')); campo && campo.tick(ahora / 1000);
  }
  renderer.render(escena, camara);
  requestAnimationFrame(bucle);
}

let campo = null;
window.__bloque = { listo: false, dibuja: (a, b) => C && frenteDesdeRaya(a, b), orden: n => C && C.orden(n), muestraFin: () => hud && hud.muestraFin(),
  estado: () => ({ T: C && C.S.T, nivel, ganador: C && C.S.ganador, util: C && C.ordenUtil(), orden: C && C.S.tuyo.orden, llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles, figs: TR && TR.figs.length, caidos: TR && TR.caidos.length }), fisica: () => FS && FS.medir() };

async function arranca() {
  hud = crearHud({ $, proyecta, ladoEnPantalla, Son });
  dedos = crearDedos({ lienzo, suelo, haciaDonde: (a, b) => haciaDonde(a, b), alSoltar: (a, b) => { if (C && nivel && !congelado) frenteDesdeRaya(a, b); }, H, libre: () => !cam1 || cam1.libre(), escala: () => cam1 ? 1 - 0.6 * cam1.t() : 1 });
  cam1 = crearCamara({ camara, lienzo, H, estado: () => C && C.S, hud: $('hud'), inicial: Q.get('vista') === 'oficial' ? 'oficial' : 'arriba' }); window.__bloque.vista = cam1;
  escena.add(dedos.raya);
  creaSombras(); creaEfectos();
  $('carga-t').textContent = 'Formando el manípulo…';
  /* AL11: cada bando carga sus modelos y los que les prestan armas (soldados.js); una tropa por modelo y nivel */
  const pide = [], nombres = new Set(); for (const b of ['r', 'g']) for (const n of [...modelos(b), ...prestan(b)]) nombres.add(n);
  const cargados = {}; for (const n of nombres) pide.push(cargarSoldado(n, paleta(n)).then(s => { cargados[n] = s; }));
  const [cs] = await Promise.all([crearCampo(escena, { H, SOL, cine, sueloCine, BRUMA: escena.fog.color }).catch(e => { console.warn('Sin campo', e); return null; }), ...pide]);
  campo = cs;
  for (const b of ['r', 'g']) {
    for (const n of modelos(b)) { const s = cargados[n]; if (s) T[b][n] = NIV.map((nv, k) => { const t = tropa(s.niveles[nv], TOPE[b][k]); escena.add(t.malla); return t; }); else console.warn('Falta soldado', n); }
    for (const n of prestan(b)) { const s = cargados[n]; if (s) A[b][n] = NIV.map((nv, k) => { const t = tropa(soloArmas(s.niveles[nv]), TOPE[b][k]); escena.add(t.malla); return t; }); else console.warn('Faltan armas de', n); }
  }
  nueva(nivel || 'normal');
  $('salir').addEventListener('click', salir); $('salir2').addEventListener('click', salir);
  $('otra').addEventListener('click', () => { $('fin').hidden = true; $('inicio').hidden = false; });
  for (const b of document.querySelectorAll('[data-nivel]')) b.addEventListener('click', () => { $('inicio').hidden = true; nueva(b.dataset.nivel); });
  addEventListener('pointerdown', () => { try { Son.inicia(); } catch (e) { /* sin sonido */ } }, { once: true });
  if (FASE) { nivel = nivel || 'normal'; nueva(nivel); salta(FASE); congelado = true; if (FASE === 'fin') hud.muestraFin(); }
  else if (!Q.get('nivel')) { nivel = null; $('inicio').hidden = false; }
  $('carga').hidden = true;
  requestAnimationFrame(t => { tPrev = t; bucle(t); });
  window.__bloque.listo = true;
}
function salir() { if (history.length > 1) history.back(); else location.href = './'; }
arranca().catch(e => { console.error(e); $('carga-t').textContent = 'No se pudo cargar: ' + e.message; });
