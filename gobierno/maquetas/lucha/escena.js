/* Maqueta TP9-0 «Lucha a pie» (segunda versión): tú en la primera fila, peleando con los dedos. Esta escena solo pinta y suena;
   lo que pasa lo deciden las reglas (reglas.js, que corren también en Node). Gestos: dedos.js. Interfaz: hud.js.
   Lo nuevo: luz de tarde con gradación de color y una sombra del sol ceñida a los 28 hombres, bruma y motas en el aire;
   un aro en el suelo bajo tu rival (claro; dorado y con pulso si está abierto; rojo que se cierra si arma el golpe) y una flecha
   al lado sin escudo; golpes que se notan (retrocede, destello, gotas, pausa) y mezcla de 0,12 s entre movimientos.
   Campo y sonido, los de la maqueta «Testudo a pie» (../a-pie/). Soldados: el soldado nuevo (js/gfx/soldado.js; MakeHuman y Quaternius, CC0).
   ?semilla=N cambia el azar de la lucha. Gancho para pruebas: window.__lucha = { gesto(nombre), estado(), S() }. */
import { THREE } from '../../../js/gfx/models.js';
import { cargarSoldado, tropa } from '../../../js/gfx/soldado.js';
import { crearCampo } from '../a-pie/campo.js';
import * as Son from '../a-pie/sonido.js';
import { crear, paso, resumen, rival, enLinea, abierto, DIST, N, NUM } from './reglas.js';
import { crearDedos } from './dedos.js';
import { crearHud } from './hud.js';

const Q = new URLSearchParams(location.search), $ = id => document.getElementById(id);
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const SEP = 0.95, Z_GALO = -1.6, Z_FILA2 = 1.0, Z_GALO2 = -2.7, MEZ = 0.12;
/* el suelo del testudo, llano donde se lucha */
const H = (x, z) => 3.4 * suave(-70, -103, z) * (1 + 0.06 * Math.sin(x * 0.07)) + suave(5, 14, Math.hypot(x, z)) * 0.22 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(z * 0.045 + 1.3) + 0.6 * suave(30, 90, Math.abs(x)) * Math.sin(z * 0.03);

/* ---------- luz de cine (copiada de ../a-pie/escena.js): gradación de color dentro del tonemapping, sin pasadas extra ---------- */
THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }', `vec3 CustomToneMapping( vec3 color ) {
  vec3 p = sqrt( ACESFilmicToneMapping( color ) );
  float l = dot( p, vec3( 0.299, 0.587, 0.114 ) );
  p = mix( vec3( l ), p, 1.18 );
  p = mix( p, p * p * ( 3.0 - 2.0 * p ), 0.45 );
  p += vec3( -0.012, 0.004, 0.022 ) * ( 1.0 - l ) * ( 1.0 - l ) + vec3( 0.03, 0.012, -0.03 ) * l * l;
  p = clamp( p, 0.0, 1.0 );
  return p * p;
}`);
const lienzo = $('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.CustomToneMapping; renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const HORIZ = '#dcb888';
const escena = new THREE.Scene(); escena.background = new THREE.Color(HORIZ); escena.fog = new THREE.FogExp2('#c9a77a', 0.006);
const camara = new THREE.PerspectiveCamera(55, 1, 0.08, 12000);
/* el sol: bajo (19 grados), delante y algo a la derecha; a contraluz, con el relleno del cielo desde la cámara */
const SOL = new THREE.Vector3(0.13, 0.33, -0.94).normalize();
escena.add(new THREE.HemisphereLight(0xa9bcd8, 0x5e4a2e, 1.0));
const luz = new THREE.DirectionalLight(0xffcb90, 4.2); luz.target.position.set(0, 0, -0.8); luz.position.copy(SOL).multiplyScalar(40).add(luz.target.position); escena.add(luz); escena.add(luz.target);
/* una sola sombra: mapa de 1024 ceñido a las dos filas romanas y a los galos (unos 9 × 5 m) */
luz.castShadow = true; luz.shadow.mapSize.set(1024, 1024); luz.shadow.bias = -0.0006; luz.shadow.normalBias = 0.025; luz.shadow.radius = 2.5;
Object.assign(luz.shadow.camera, { left: -4.6, right: 4.6, top: 2.8, bottom: -2.4, near: 30, far: 50 }); luz.shadow.camera.updateProjectionMatrix();
const relleno = new THREE.DirectionalLight(0xbfc8d8, 1.25); relleno.position.set(0.15, 0.5, 1); escena.add(relleno);
/* el campo pide los retoques de luz del testudo; aquí basta con darle sus valores (sin el borde de contraluz) */
const cine = (sh, borde) => { sh.uniforms.uBorde = { value: borde || 0 }; sh.uniforms.uAmb = { value: 1 }; sh.uniforms.uTrasluz = { value: 0 }; };
const sueloCine = sh => cine(sh, 0);
{ const t = new THREE.TextureLoader().load('gobierno/maquetas/testudo-luz-campo/arte/cielo.jpg'); t.colorSpace = THREE.SRGBColorSpace;
  const c = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false, color: '#f0dcc0' }));
  c.renderOrder = -10; c.frustumCulled = false; escena.add(c); }
const azarV = (k => () => { k = (k * 16807) % 2147483647; return (k - 1) / 2147483646; })(91);

/* motas de polvo en el aire alrededor de la cámara (de ../a-pie): brillan mirando al sol. Una llamada */
const MOTAS_U = { uCam: { value: new THREE.Vector3() }, uSol: { value: SOL }, uT: { value: 0 }, uEsc: { value: 400 } };
{ const n = 420, pos = new Float32Array(n * 3), tam = new Float32Array(n); for (let i = 0; i < n; i++) { pos[i * 3] = azarV(); pos[i * 3 + 1] = azarV(); pos[i * 3 + 2] = azarV(); tam[i] = 0.006 + azarV() * azarV() * 0.022; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: MOTAS_U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute float aTam; uniform vec3 uCam, uSol; uniform float uT, uEsc; varying float vB;
      void main(){ vec3 caja = vec3(8.0, 3.6, 11.0), c = uCam + vec3(0.0, 0.2, -4.5);
        vec3 q = position * caja + vec3(sin(uT * 0.35 + aTam * 300.0) * 0.25, uT * 0.04 + sin(uT * 0.5 + position.x * 20.0) * 0.08, uT * 0.18);
        vec3 p = c + (fract((q - c) / caja + 0.5) - 0.5) * caja; float d = distance(p, uCam);
        float b = pow(max(dot(normalize(p - uCam), uSol), 0.0), 5.0) * 1.7 + 0.12;
        vB = b * smoothstep(0.12, 0.5, d) * (1.0 - smoothstep(6.0, 9.0, d));
        vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(aTam * uEsc / -mv.z, 1.0, 14.0); }`,
    fragmentShader: `varying float vB; void main(){ vec2 c = gl_PointCoord - 0.5; float a = 1.0 - smoothstep(0.15, 0.5, length(c)); gl_FragColor = vec4(vec3(1.0, 0.86, 0.62) * a * vB * 0.4, 1.0); }` }));
  m.frustumCulled = false; m.renderOrder = 6; escena.add(m); }

/* ---------- señales en el suelo (se ven a través de tu cuerpo: con esta cámara, tú tapas los pies del rival): el aro del rival (y otro para el galo de al lado que te arma un golpe). Una llamada cada uno ----------
   uK > 0: arma (el relleno rojo crece de 0 a 1 con el tiempo de armado). uPulso: dorado que late. uFlecha: -1/1 lado abierto, 0 sin flecha */
const geoAro = new THREE.PlaneGeometry(1.8, 1.2).rotateX(-Math.PI / 2);
function aro() {
  const m = new THREE.Mesh(geoAro, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, fog: false,
    uniforms: { uCol: { value: new THREE.Color('#f3e6c4') }, uK: { value: 0 }, uPulso: { value: 0 }, uFlecha: { value: 0 }, uA: { value: 0.6 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = (uv - 0.5) * vec2(1.8, 1.2); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 uCol; uniform float uK, uPulso, uFlecha, uA; varying vec2 vP;
      void main(){ float d = length(vP);
        float a = smoothstep(0.035, 0.0, abs(d - 0.46)) * (0.6 + 0.4 * uPulso) + smoothstep(0.16, 0.0, abs(d - 0.46)) * 0.35 * uPulso;
        if (uK > 0.0) a = max(a, step(d, 0.46 * uK) * 0.32 + smoothstep(0.025, 0.0, abs(d - 0.46 * uK)) * 0.9);
        if (abs(uFlecha) > 0.5) { vec2 q = vec2((vP.x - uFlecha * 0.7) * uFlecha, vP.y); a = max(a, step(-0.08, q.x) * step(q.x, 0.12) * step(abs(q.y), (0.12 - q.x) * 0.9) * 0.9); }
        if (a < 0.01) discard; gl_FragColor = vec4(uCol, a * uA); }` }));
  m.renderOrder = 8; m.visible = false; escena.add(m); return m;
}
const ARO = aro(), ARO2 = aro();
const COL = { claro: new THREE.Color('#f3e6c4'), oro: new THREE.Color('#ffc93a'), rojo: new THREE.Color('#ff3a1e') };

/* chispa (escudo), destello (cuerpo herido) y gotas: precreados */
function spriteDe(dibujo, escala) { const c = document.createElement('canvas'); c.width = c.height = 64; dibujo(c.getContext('2d'));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, depthTest: false })); s.scale.set(escala, escala, 1); s.visible = false; s.renderOrder = 9; escena.add(s); return s; }
const chispa = spriteDe(g => { g.translate(32, 32); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); const l = i % 2 ? 14 : 28, r = g.createLinearGradient(0, 0, l, 0); r.addColorStop(0, 'rgba(255,255,220,1)'); r.addColorStop(1, 'rgba(255,190,60,0)'); g.fillStyle = r; g.fillRect(0, -1.5, l, 3); } }, 0.45);
const destello = spriteDe(g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,245,235,0.95)'); r.addColorStop(0.35, 'rgba(255,70,50,0.7)'); r.addColorStop(1, 'rgba(160,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }, 1.3);
const NG = 8, gotas = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NG * 3), 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#8a0c08', size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false }));
  p.renderOrder = 9;
  p.frustumCulled = false; p.visible = false; p.userData = { v: Array.from({ length: NG }, () => new THREE.Vector3()), t: 0 }; escena.add(p); return p; })();
let chispaT = 0, destT = 0;
function salpica(x, y, z) { const a = gotas.geometry.attributes.position; for (let i = 0; i < NG; i++) { a.setXYZ(i, x + (azarV() - 0.5) * 0.2, y + (azarV() - 0.5) * 0.2, z); gotas.userData.v[i].set((azarV() - 0.5) * 2.2, 1 + azarV() * 1.8, -0.6 - azarV() * 1.4); }
  a.needsUpdate = true; gotas.visible = true; gotas.userData.t = 0.7; }
function efectosVivos(dt) {
  if (chispaT > 0) { chispaT -= dt; if (chispaT <= 0) chispa.visible = false; }
  if (destT > 0) { destT -= dt; destello.material.opacity = Math.max(0, destT / 0.12); if (destT <= 0) destello.visible = false; }
  if (gotas.visible) { const u = gotas.userData, a = gotas.geometry.attributes.position; u.t -= dt; if (u.t <= 0) { gotas.visible = false; return; }
    for (let i = 0; i < NG; i++) { const v = u.v[i]; v.y -= 9.8 * dt; let y = a.getY(i) + v.y * dt; const x = a.getX(i) + v.x * dt, z = a.getZ(i) + v.z * dt, s = H(x, z) + 0.01; if (y < s) { y = s; v.set(0, 0, 0); } a.setXYZ(i, x, y, z); }
    a.needsUpdate = true; gotas.material.opacity = Math.min(0.95, u.t * 3); }
}

/* ---------- sombras de los soldados: material de profundidad que mueve los huesos como el del soldado ---------- */
const V_SOMBRA = `attribute vec4 aSkinI; attribute vec4 aSkinW; attribute vec3 aCuadro; uniform sampler2D uHuesos;
mat4 hueso(float h, int f) { int x = int(h + 0.5) * 3; vec4 a = texelFetch(uHuesos, ivec2(x, f), 0), b = texelFetch(uHuesos, ivec2(x + 1, f), 0), c = texelFetch(uHuesos, ivec2(x + 2, f), 0);
  return mat4(vec4(a.x, b.x, c.x, 0.0), vec4(a.y, b.y, c.y, 0.0), vec4(a.z, b.z, c.z, 0.0), vec4(a.w, b.w, c.w, 1.0)); }
mat4 piel(int f) { mat4 m = hueso(aSkinI.x, f) * aSkinW.x; if (aSkinW.y > 0.0) m += hueso(aSkinI.y, f) * aSkinW.y; if (aSkinW.z > 0.0) m += hueso(aSkinI.z, f) * aSkinW.z; if (aSkinW.w > 0.0) m += hueso(aSkinI.w, f) * aSkinW.w; return m; }
`;
function conSombra(tr) {
  const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  d.onBeforeCompile = sh => { sh.uniforms.uHuesos = { value: tr.s.anim };
    sh.vertexShader = V_SOMBRA + sh.vertexShader.replace('#include <begin_vertex>', 'mat4 sk = piel(int(aCuadro.x + 0.5)); if (aCuadro.z > 0.001) { mat4 s2 = piel(int(aCuadro.y + 0.5)); sk = sk * (1.0 - aCuadro.z) + s2 * aCuadro.z; }\n vec3 transformed = (sk * vec4(position, 1.0)).xyz;'); };
  d.customProgramCacheKey = () => 'lucha-sombra';
  tr.malla.customDepthMaterial = d; tr.malla.castShadow = true; tr.malla.receiveShadow = true; return tr;
}

/* ---------- figuras ---------- */
let S, T = {}, ROM = null, comps = [], vivos = new Map(), yoF, ultimo = 0, parada = 0, sacude = 0, dano = 0, ayudaCerrada = false, dtF = 0;
const M4 = new THREE.Matrix4(), Qt = new THREE.Quaternion(), P = new THREE.Vector3(), E3 = new THREE.Vector3(), EJE = new THREE.Vector3(0, 1, 0), V = new THREE.Vector3();
function figura(x, z, semilla) { return { x, z, tx: x, tz: z, giro: 0, gl: 0, emp: 0, semilla, talla: 0.96 + 0.08 * azarV(), clip: 'guardia', t: azarV() * 3, tg: azarV() * 3 }; }
function var4(s) { const r = k => { const v = Math.sin(s * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); }; return [r(1), r(2), r(3), r(4)]; }
/* fila de la textura de huesos más cercana a (clip, t): para fundir dos clips distintos */
function filaDe(tr, clip, t) { const c = tr.s.j.clips[clip] || tr.s.j.clips.quieto; let f = t * c.fps; f = c.bucle ? f % (c.n - 1) : Math.min(f, c.n - 1); if (f < 0) f += c.n - 1; return c.ini + Math.round(f); }
/* cambio de clip: se recuerda el anterior y se funde 0,12 s */
function sigue(f, dt) { if (f.cv !== undefined && f.clip !== f.cv) { f.ant = { clip: f.cv, t: f.tv }; f.mez = 0; } else f.mez = (f.mez === undefined ? 9 : f.mez + dt); f.cv = f.clip; f.tv = f.t; }
/* pone una figura en la tropa que le toca (fina si está cerca de ti) */
function dibuja(f, fina, R, giroBase) {
  const tr = fina ? R.fina : R.lejos, i = tr.sig(); if (i < 0) return;
  P.set(f.x, H(f.x, f.z), f.z); Qt.setFromAxisAngle(EJE, giroBase + f.giro + (f.gl || 0)); const an = 0.95 + 0.12 * (Math.abs(Math.sin(f.semilla * 91.7)) % 1);
  E3.set(f.talla * an, f.talla, f.talla * an); M4.compose(P, Qt, E3); tr.matriz(i, M4.elements); tr.vars(i, var4(f.semilla));
  tr.pose(i, f.clip, f.t, tr.muestra(f.clip, f.t));
  if (f.ant && f.mez < MEZ && f.ant.clip) tr.malla.geometry.attributes.aCuadro.setXYZ(i, filaDe(tr, f.ant.clip, f.ant.t), filaDe(tr, f.clip, f.t), f.mez / MEZ);
}
const acerca = (f, dt, k = 8) => { const a = 1 - Math.exp(-dt * k); f.x += (f.tx - f.x) * a; f.z += (f.tz - f.z) * a; };

/* golpear: 0,2 s el brazo arriba, 0,5 s el golpe, 1,2 s de vuelta (medidas del clip). Mapa del tiempo de la acción al del clip */
function tiempoGolpe(t, ant, gol, rec) { return t < ant ? 0.2 * t / ant : t < ant + gol ? 0.2 + 0.3 * (t - ant) / gol : Math.min(1.2, 0.5 + 0.7 * (t - ant - gol) / Math.max(0.05, rec)); }

function reinicia() {
  S = crear(+(Q.get('semilla') || 0) || Math.floor(Math.random() * 1e6));
  comps = []; for (let c = 0; c < N; c++) if (c !== S.yo.puesto) comps.push({ ...figura((c - 3) * SEP, -0.3, 10 + c), puesto: c, fila: 1 });
  for (let c = 0; c < N; c++) comps.push({ ...figura((c - 3) * SEP, Z_FILA2, 30 + c), puesto: c, fila: 2 });
  yoF = figura(0, Z_GALO + DIST[1], 3.3); yoF.talla = 1.0;
  vivos = new Map(); for (const col of S.cols) { const g = col.frente; vivos.set(g, { ...figura((g.c - 3) * SEP, Z_GALO, g.semilla), talla: g.talla, gl: g.lado === 'izq' ? 0.5 : -0.5 }); }
  ROM.reserva = []; for (let c = 0; c < N; c++) ROM.reserva.push(figura((c - 3) * SEP + 0.1, Z_GALO2, 60 + c));
  muertos = []; $('fin').hidden = true; hud.racha(0, false);
}
let muertos = [];

/* ---------- lo que pasa: efectos de los hechos ---------- */
function rivalPantalla(alto = 1.75) { const g = rival(S), f = g && vivos.get(g); V.set(f ? f.x : yoF.x, alto, f ? f.z : yoF.z - 1.5).project(camara); return [(V.x + 1) / 2 * innerWidth, (1 - V.y) / 2 * innerHeight]; }
function galoDe(c) { const g = S.cols[c] && S.cols[c].frente; return g && vivos.get(g); }
function efectos(Hs) {
  for (const h of Hs) {
    const [ex, ey] = rivalPantalla(), eco = (t, c) => hud.eco(t, c, ex, ey), fr = galoDe(S.yo.puesto);
    switch (h.tipo) {
      case 'sale': Son.esfuerzo(0, h.flojo ? 0.4 : 0.7); if (h.acerca) Son.tierra(0); break;
      case 'golpe':
        parada = h.fuerte ? 0.14 : 0.08; sacude = h.fuerte ? 0.45 : 0.2; Son.hierro(0, 0, 1); Son.herido(0, 0.05);
        if (fr) { fr.emp = 0.3; destello.position.set(fr.x, 1.25, fr.z + 0.2); destello.visible = true; destello.material.opacity = 1; destT = 0.12; salpica(fr.x, 1.3, fr.z + 0.1); }
        eco(h.fuerte ? '¡Golpe fuerte!' : h.mata ? '¡Cae!' : '¡Buen golpe!', 'bien'); break;
      case 'rebote': { eco('Parado', 'mal'); Son.madera(0.9); const g = rival(S), f = g && vivos.get(g); if (f) { chispa.position.set(f.x + (g.lado === 'izq' ? -0.28 : 0.28), 1.2, f.z + 0.35); chispa.visible = true; chispaT = 0.14; } hud.flechaAviso(); break; }
      case 'flojo': if (fr) fr.emp = 0.1; Son.madera(0.4); break;
      case 'parada': { eco('¡Parado!', 'bien'); Son.madera(1.2); Son.hierro(0, 0.02, 0.7); chispa.position.set(yoF.x - 0.25, 1.25, yoF.z - 0.3); chispa.visible = true; chispaT = 0.14; parada = 0.06; break; }
      case 'bloqueo': eco('Bloqueado'); Son.madera(1); break;
      case 'rajado': eco('Tu escudo se raja', 'mal'); break;
      case 'roto': eco('Tu escudo se rompe', 'mal'); Son.crac(); break;
      case 'herido': sacude = 0.32; dano = 0.4; hud.dano(); eco(h.como === 'flanco' ? 'Te hieren por el flanco' : h.como === 'lado' ? 'Te hieren desde el lado' : h.como === 'contra' ? '¡Contraataque!' : 'Herido', 'mal'); Son.herido(0); Son.hierro(0, 0, 0.9); break;
      case 'remate': eco('¡Bien, ' + h.nombre + '!', 'bien'); Son.hierro(0.4, 0, 1); Son.voz('Ea'); break;
      case 'empujon': Son.esfuerzo(0, 1); Son.madera(1.1); if (fr) fr.emp = 0.2; eco('¡Desequilibrado!', 'bien'); break;
      case 'hueco': eco('Nadie delante: muévete a un lado'); break;
      case 'borde': eco(h.ge === 'adelante' ? 'Ya estás pegado' : h.ge === 'atras' ? 'Otra vez atrás: a la segunda fila' : 'No hay más fila'); break;
      case 'arma': if (h.lado) { eco('¡Cuidado, el de al lado!', 'mal'); Son.voz('grito'); } else Son.esfuerzo((h.c - S.yo.puesto) * 0.4, 0.5); break;
      case 'contra': eco('¡Cuidado, contraataque!', 'mal'); break;
      case 'sinAliento': eco('Sin aliento', 'mal'); break;
      case 'rodeado': eco('Te rodean: cede un paso', 'mal'); Son.voz('grito'); break;
      case 'paso': { const c = comps.find(k => k.fila === 1 && k.puesto === h.puesto); if (c) c.puesto = h.puesto + (h.lado === 'izq' ? 1 : -1); break; }
      case 'retirada': { const c = comps.find(k => k.fila === 2 && k.puesto === S.yo.puesto); if (c) c.fila = 1; } eco('A la segunda fila: recobra el aliento'); break;
      case 'vuelve': { const c = comps.find(k => k.fila === 1 && k.puesto === S.yo.puesto); if (c) c.fila = 2; } eco('A la primera fila'); break;
      case 'ajeno': if (h.c !== undefined && Math.abs(h.c - S.yo.puesto) <= 2) Son.madera(0.35, (h.c - S.yo.puesto) * 0.4); break;
      case 'cae': if (h.yo) { setTimeout(() => hud.fin('caido'), 1400); } else { const g = [...vivos.keys()].find(k => k.c === h.c && k.vida <= 0); if (g) { const f = vivos.get(g); muertos.push({ ...f, clip: 'morir', t: 0 }); vivos.delete(g); } } break;
      case 'llega': if (h.viene) { const g = S.cols[h.c].frente, r = ROM.reserva[h.c]; vivos.set(g, { ...(r || figura((h.c - 3) * SEP, Z_GALO2, g.semilla)), talla: g.talla, semilla: g.semilla, gl: g.lado === 'izq' ? 0.5 : -0.5 }); ROM.reserva[h.c] = null; } break;
      case 'rompe': Son.voz('Victoria'); setTimeout(() => hud.fin('rompe'), 2200); break;
    }
  }
}

/* ---------- cada fotograma: posiciones y movimientos ---------- */
function actualiza(dt) {
  const y = S.yo, linea = enLinea(S);
  /* tú */
  const xY = (y.puesto - 3) * SEP; yoF.tx = xY; yoF.tz = y.fila === 2 ? Z_FILA2 : Z_GALO + DIST[y.dist];
  const a = y.acc; let adel = 0; yoF.giro = 0; yoF.tg += dt;
  if (S.fin === 'caido') { yoF.clip = 'morir'; yoF.t += dt; }
  else if (S.t - y.enc < 0.37) { yoF.clip = 'encajar'; yoF.t = S.t - y.enc; }
  else if (a && a.tipo === 'estocada') { yoF.clip = 'golpear'; yoF.t = tiempoGolpe(a.t, a.imp - 0.06, 0.09, a.dur - a.imp - 0.03); adel = -0.22 * Math.sin(Math.min(1, a.t / (a.imp + 0.1)) * Math.PI); }
  else if (a && a.tipo === 'tajo') { yoF.clip = 'golpear'; yoF.t = tiempoGolpe(a.t, a.imp - 0.08, 0.1, a.dur - a.imp - 0.02); yoF.giro = (a.lado === 'izq' ? 0.5 : -0.5) * Math.sin(Math.min(1, a.t / a.dur) * Math.PI); adel = -0.1 * Math.sin(Math.min(1, a.t / (a.imp + 0.1)) * Math.PI); }
  else if (a && a.tipo === 'empujon') { yoF.clip = 'cubrirse'; yoF.t = Math.min(0.42, a.t * 2); adel = -0.38 * Math.sin(Math.min(1, a.t / a.dur) * Math.PI); }
  else if (y.alzado) { yoF.clip = 'cubrirse'; yoF.t = Math.min(0.42, (S.t - y.tAlzo) * 3.5); }
  else if (y.mov) { yoF.clip = 'andar'; yoF.t += dt; }
  else { yoF.clip = 'guardia'; yoF.t = yoF.tg; }
  acerca(yoF, dt, y.mov && y.mov.tipo === 'paso' ? 14 : 9); yoF.adel = adel; const yz = yoF.z + adel; sigue(yoF, dt);
  /* compañeros: cada uno tiene su puesto y su fila; los cambios (paso, retirada, vuelta) los hace efectos() */
  for (const c of comps) {
    c.tx = (c.puesto - 3) * SEP; c.tz = c.fila === 1 ? -0.3 : Z_FILA2; acerca(c, dt, 5); c.tg += dt;
    const k = S.comp[c.puesto]; if (c.fila === 1 && k && S.t - k.t0 < (k.clip === 'golpear' ? 1.4 : 1.1)) { c.clip = k.clip; c.t = k.clip === 'cubrirse' ? Math.min(0.42, (S.t - k.t0) * 2) : S.t - k.t0; }
    else if (Math.hypot(c.tx - c.x, c.tz - c.z) > 0.08) { c.clip = 'andar'; c.t += dt; } else { c.clip = c.fila === 1 ? 'guardia' : 'quieto'; c.t = c.tg; }
    sigue(c, dt);
  }
  /* galos: el lado del escudo se ve girando el cuerpo (±0,5 rad en unos 0,25 s), sin espejo */
  const kg = 1 - Math.exp(-dt * 12);
  for (const [g, f] of vivos) {
    const mio = g.c === y.puesto && linea; f.tg += dt;
    f.emp *= Math.exp(-dt * 2.5);
    f.tx = (g.c - 3) * SEP; f.tz = (mio ? Math.min(Z_GALO, yz - DIST[y.dist]) : Z_GALO) - f.emp; f.giro = 0;
    f.gl += ((g.lado === 'izq' ? 0.5 : -0.5) - f.gl) * kg;
    if (S.fin === 'rompe') { f.giro = Math.PI; f.clip = 'correr'; f.t += dt; f.tz = f.z - 6; acerca(f, dt, 0.8); sigue(f, dt); continue; }
    switch (g.estado) {
      case 'llega': f.clip = 'andar'; f.t += dt; break;
      case 'guardia': f.clip = 'guardia'; f.t = f.tg; break;
      case 'arma': { const k = g.t / g.dur, sube = g.rapido ? 0.55 : 0.85; f.clip = 'golpear'; f.t = k < sube ? 0.2 * k / sube : 0.2 + 0.3 * (k - sube) / (1 - sube); break; }
      case 'tras': f.clip = 'golpear'; f.t = 0.5 + 0.7 * g.t / g.dur; break;
      case 'abierto': f.clip = 'encajar'; f.t = Math.min(0.36, g.t * 0.5); f.giro = 0.35; break;
      case 'deseq': f.clip = 'encajar'; f.t = Math.min(0.36, g.t * 0.6); f.tz -= 0.45; f.giro = -0.3; break;
      case 'encaja': f.clip = 'encajar'; f.t = g.t; break;
    }
    acerca(f, dt, g.estado === 'deseq' || f.emp > 0.05 ? 14 : 6); sigue(f, dt);
  }
  for (const m of muertos) { m.t += dt; m.clip = 'morir'; sigue(m, dt); }
  if (S.fin === 'rompe') { for (const r of ROM.reserva) if (r) { r.giro = Math.PI; r.clip = 'correr'; r.t += dt; r.z -= dt * 4; } }
  else for (const r of ROM.reserva) if (r) { r.clip = 'guardia'; r.t += dt; }
  senales();
}

/* el aro del rival y el del galo de al lado que te arma un golpe; la palabra pequeña junto al aro */
let pulso = 0;
function ponAro(m, g, f) {
  const u = m.material.uniforms; m.visible = true; m.position.set(f.x, H(f.x, f.z) + 0.03, f.z);
  if (g.estado === 'arma') { u.uCol.value.copy(COL.rojo); u.uK.value = Math.max(0.02, Math.min(1, g.t / g.dur)); u.uPulso.value = 0; u.uA.value = 0.9; return 'arma'; }
  u.uK.value = 0;
  if (abierto(g)) { u.uCol.value.copy(COL.oro); u.uPulso.value = 0.5 + 0.5 * Math.sin(pulso * 14); u.uA.value = 0.95; return 'abierto'; }
  u.uCol.value.copy(COL.claro); u.uPulso.value = 0; u.uA.value = 0.55; return 'guardia';
}
function senales() {
  pulso += dtF; ARO.visible = ARO2.visible = false;
  if (S.fin) { hud.marca(null); return; }
  const g = rival(S), f = g && vivos.get(g); let est = null;
  if (f && g.estado !== 'cae' && g.estado !== 'llega' && enLinea(S)) { est = ponAro(ARO, g, f); ARO.material.uniforms.uFlecha.value = est === 'guardia' ? (g.lado === 'izq' ? 1 : -1) : 0; }
  const lado = S.cols.map(c => c.frente).find(k => k && k.contraYo && k.estado === 'arma'), fl = lado && vivos.get(lado);
  if (fl) { ponAro(ARO2, lado, fl); ARO2.material.uniforms.uFlecha.value = 0; }
  if (est === 'abierto' || est === 'arma' || fl) {
    const k = fl && est !== 'arma' ? fl : f; V.set(k.x, 0.1, k.z + 0.5).project(camara);
    hud.marca(est === 'abierto' && !fl ? '¡Ahora!' : '¡Escudo!', est === 'abierto' && !fl ? 'oro' : 'rojo', (V.x + 1) / 2 * innerWidth, (1 - V.y) / 2 * innerHeight);
  } else hud.marca(null);
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

/* ---------- cámara: sobre tu hombro derecho, mirando al pecho del rival (sin cambios) ---------- */
let ancho = 0, alto = 0; const cam = { x: 0, y: 1.7, z: 2, mx: 0, my: 1.3, mz: -2, kd: 0 };
function encaja() { ancho = innerWidth; alto = innerHeight; renderer.setSize(ancho, alto, false); camara.aspect = ancho / alto; camara.fov = ancho < alto ? 62 : 50; camara.updateProjectionMatrix(); }
function camaraPaso(dt) {
  const g = rival(S), f = g && vivos.get(g), inc = dedos.inclina, k = 1 - Math.exp(-dt * 6), vert = ancho < alto;
  cam.kd += (S.yo.dist / 2 - cam.kd) * k; const yz = yoF.z + (yoF.adel || 0);
  const tx = yoF.x + 0.80 + 0.35 * cam.kd + inc.x * 0.12, ty = (vert ? 2.25 : 2.1) - inc.y * 0.06, tz = yz + 1.35 + inc.y * 0.1;
  const rx = f ? f.x : yoF.x, rz = f ? f.z : yz - 1.6, mx = rx + (yoF.x - rx) * 0.15, mz = rz + (yz - rz) * 0.15, my = 1.25 + (1.6 - 1.25) * 0.3;
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.z += (tz - cam.z) * k; cam.mx += (mx - cam.mx) * k; cam.my += (my - cam.my) * k; cam.mz += (mz - cam.mz) * k;
  const s = sacude > 0 ? sacude * 0.12 : 0;
  camara.position.set(cam.x + (azarV() - 0.5) * s, cam.y + (azarV() - 0.5) * s, cam.z); camara.lookAt(cam.mx, cam.my, cam.mz);
  MOTAS_U.uCam.value.copy(camara.position);
}

/* ---------- bucle ---------- */
const tiempos = []; let medT = 0;
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dtR = Math.min(0.1, (ahora - ultimo) / 1000 || 0); ultimo = ahora;
  tiempos.push([ahora, dtR * 1000]); while (tiempos.length && ahora - tiempos[0][0] > 5000) tiempos.shift();
  medT -= dtR; if (medT <= 0 && tiempos.length > 2) { medT = 0.5; const span = (ahora - tiempos[0][0]) / 1000; hud.medidor((tiempos.length - 1) / Math.max(0.001, span), Math.max(...tiempos.map(t => t[1]))); }
  let dt = dtR; if (parada > 0) { parada -= dtR; dt = 0; } sacude = Math.max(0, sacude - dtR); dano = Math.max(0, dano - dtR); dtF = dt;
  /* los gestos se recogen siempre (aunque haya pausa de golpe): las reglas los guardan si llegan a mitad de algo */
  const pide = ayudaCerrada ? dedos.toma() : (dedos.toma(), { gestos: [], escudo: false });
  efectos(paso(S, dt, pide));
  actualiza(dt); efectosVivos(dtR); pinta(); camaraPaso(dtR); campo.tick(ahora / 1000); MOTAS_U.uT.value = ahora / 1000;
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
  ROM = { alto: rom.alto, reserva: [] };
  T.rom = { fina: conSombra(tropa(rom.niveles[0], 4)), lejos: conSombra(tropa(rom.niveles[1], 14)) };
  /* tú: un hastatus aparte con las plumas del casco en rojo (ver la versión anterior: se tiñe por la pose de reposo, por encima de 1,795 m) */
  { const m = yo.niveles[0].mat, antes = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { antes(sh, r);
      sh.vertexShader = 'varying float vPen;\n' + sh.vertexShader.replace('vVar = aVar;', 'vVar = aVar; vPen = (abs(aSkinI.x - uCab.w) < 0.5 && position.y > 1.795) ? 1.0 : 0.0;');
      sh.fragmentShader = 'varying float vPen;\n' + sh.fragmentShader.replace('{ float alto = vObj.y;', '{ float lu = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.72, 0.06, 0.04) * (0.7 + 5.0 * lu), step(0.5, vPen)); }\n  { float alto = vObj.y;'); };
    m.customProgramCacheKey = () => 'lucha-yo-penacho'; const t = conSombra(tropa(yo.niveles[0], 1)); T.yo = { fina: t, lejos: t }; }
  T.gal = { fina: conSombra(tropa(gal.niveles[0], 8)), lejos: conSombra(tropa(gal.niveles[1], 32)) };
  for (const k in T) { escena.add(T[k].fina.malla); if (T[k].lejos !== T[k].fina) escena.add(T[k].lejos.malla); }
  campo = await crearCampo(escena, { H, SOL, cine, sueloCine, BRUMA: escena.fog.color });
  encaja(); reinicia(); actualiza(0); pinta(); camaraPaso(1);
  renderer.compile(escena, camara);
  $('carga').hidden = true;
  requestAnimationFrame(t => { ultimo = t; bucle(t); });
})();
