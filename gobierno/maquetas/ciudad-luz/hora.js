/* AQVILA — CR4: la hora del día por encima de la luz de la estación (maqueta; no toca js/gfx/city3d.js).
   Decisión del usuario (24/11, «Cambia con el turno»): amanece al empezar el mes y atardece al pasar el turno, con un paso suave
   de unos segundos y SIN noche cerrada (UR1, 20/11: nada de antorchas ni ciudad a oscuras).
   Cómo convive con Q11 (LUZ_ESTACIONAL): city3d.js pone cada vez la luz de la estación (sol, cielo, suelo, bruma). Esta capa lee esos
   valores como «base» y los tiñe: el mediodía es la base tal cual (la ciudad de siempre); el amanecer y el atardecer la mezclan con su
   color. Si city3d cambia la base (otra estación, vista de plano), la capa lo nota y tiñe la base nueva.
   Cielo nuevo por código (sin texturas): degradado de cénit a horizonte, resplandor y disco del sol, nubes en vetas y bruma al pie.
   CR4b: H.tiempo = crearTiempo() (tiempo.js) añade el tiempo encima de la hora, con la misma pista.
   Uso: const h = conectar(renderer); h.ir('amanecer', 4); h.turno(); h.activa = false (luz de hoy).
   Para CR6: lo mismo puede ir dentro de city3d.js (luz() da la base; esta mezcla va justo después, y el cielo sustituye a crearCielo). */
import { THREE } from '../../../js/gfx/models.js';

/* los dos tintes; el mediodía no tiñe. mez = cuánto se acerca a ese color (0..1); k = multiplica la intensidad de la base */
export const TINTES = {
  amanecer: { sol: '#ffb27e', solMez: 0.8, solK: 0.7, cielo: '#b4aed0', cieloMez: 0.55, cieloK: 0.82, suelo: '#7c6458', sueloMez: 0.35,
    horiz: '#e9bea6', horizMez: 0.65, bruma: 1.8, expo: 0.98, cenit: '#5f73ad', brillo: '#ffb689', nube: '#f6c9b6', el: 11, giro: 180 },
  atardecer: { sol: '#ff9446', solMez: 0.85, solK: 0.78, cielo: '#d8a58c', cieloMez: 0.5, cieloK: 0.8, suelo: '#8a5a3c', sueloMez: 0.3,
    horiz: '#f2a674', horizMez: 0.75, bruma: 1.5, expo: 1.0, cenit: '#46588f', brillo: '#ff9a52', nube: '#ffb88a', el: 10, giro: 0 }
};
const MEDIODIA = { cenit: '#2f5d9e', brillo: '#fff1d6', nube: '#f7f4ee', el: 0 };      // el: grados sobre la altura del sol de la estación
for (const t of [TINTES.amanecer, TINTES.atardecer, MEDIODIA]) for (const k of ['sol', 'cielo', 'suelo', 'horiz', 'cenit', 'brillo', 'nube']) if (t[k]) t[k] = new THREE.Color(t[k]);
const ESTADOS = { amanecer: { a: 1, t: 0 }, mediodia: { a: 0, t: 0 }, atardecer: { a: 0, t: 1 } };
export const SUBIDA = 25, QUIETO = 4;      // segundos: de amanecer a mediodía, y cuánto se queda quieto el amanecer antes de subir
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

/* cielo por código: una esfera, un sombreador, cero texturas */
function crearCielo() {
  const u = { uSol: { value: new THREE.Vector3(0, 0.5, -1).normalize() }, uCenit: { value: new THREE.Color() }, uHoriz: { value: new THREE.Color() }, uBrillo: { value: new THREE.Color() },
    uNube: { value: new THREE.Color() }, uBajo: { value: 0 },
    /* CR4b (el tiempo): cuánto tapan las nubes, su color con luz y en sombra, y el reloj para que se muevan */
    uCubierto: { value: 0 }, uNubeLuz: { value: new THREE.Color('#ffffff') }, uNubeOsc: { value: new THREE.Color('#8a919b') }, uT: { value: 0 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(9000, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: u,
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vD; uniform vec3 uSol, uCenit, uHoriz, uBrillo, uNube, uNubeLuz, uNubeOsc; uniform float uBajo, uCubierto, uT;
      float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vr(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1, 0)), f.x), mix(hs(i + vec2(0, 1)), hs(i + vec2(1, 1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vr(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
      float ruido(vec2 p){ return sin(p.x * 1.7 + sin(p.y * 0.8) * 1.6) * sin(p.y * 2.9 + p.x * 0.35) * 0.6 + sin(p.x * 4.1 - p.y * 1.3) * 0.4; }
      void main(){ vec3 d = normalize(vD); float h = clamp(d.y, 0.0, 1.0), s = max(dot(d, uSol), 0.0);
        float az = max(dot(normalize(vec2(d.x, d.z) + 1e-5), normalize(vec2(uSol.x, uSol.z) + 1e-5)), 0.0);      // lado del cielo donde está el sol
        vec3 c = mix(uHoriz, uCenit, pow(smoothstep(0.0, 0.6, h), 0.65));
        c = mix(c, uBrillo, (1.0 - smoothstep(0.0, 0.28 + 0.1 * uBajo, h)) * pow(az, 3.0) * (0.25 + 0.5 * uBajo));     // la franja encendida del lado del sol
        c += uBrillo * (pow(s, 8.0) * (0.18 + 0.3 * uBajo) + pow(s, 90.0) * 0.6);                                     // halo
        c = mix(c, vec3(1.0, 0.95, 0.82) * 1.8, smoothstep(0.9990, 0.9995, s) * (1.0 - smoothstep(0.55, 0.9, uCubierto)));   // disco (lo tapan las nubes)
        vec2 p = d.xz / (d.y + 0.12) * 0.9; float n = ruido(p) + 0.5 * ruido(p * 2.3 + 4.0);
        float nb = smoothstep(0.35, 1.1, n) * smoothstep(0.02, 0.18, h) * (1.0 - smoothstep(0.45, 0.85, h));
        c = mix(c, uNube * (0.75 + 0.5 * pow(s, 2.0)), nb * 0.5 * (1.0 - uCubierto));                                    // vetas de nube teñidas por el sol
        if (uCubierto > 0.001) {      /* CR4b: nubes de verdad (ruido por capas que se mueve despacio); con el cielo cubierto llenan todo */
          vec2 q = d.xz / (d.y + 0.08) * 0.32 + vec2(uT * 0.006, uT * 0.002);
          float f = fbm(q), f2 = fbm(q + vec2(0.35, 0.2));
          float cob = smoothstep(0.74 - 0.4 * uCubierto, 0.9 - 0.3 * uCubierto, f) * smoothstep(0.0, 0.06, d.y);
          float lomo = clamp((f - f2) * 4.0 + 0.5, 0.0, 1.0);                                   // lado alto de la nube, más claro
          vec3 nc = mix(uNubeOsc, uNubeLuz, clamp(lomo * 0.85 + 0.25 * pow(s, 3.0) + (f - 0.5) * 0.6, 0.0, 1.0));
          c = mix(c, nc, cob * (0.55 + 0.45 * uCubierto));
          c = mix(c, uNubeOsc * 0.95 + uNubeLuz * 0.05, 0.4 * smoothstep(0.6, 1.0, uCubierto) * (1.0 - cob));   // entre nube y nube, gris
        }
        c = mix(c, uHoriz, 1.0 - smoothstep(0.0, 0.05, d.y));                                                           // bruma al pie
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` }));
  m.renderOrder = -10; m.frustumCulled = false; m.userData.u = u; return m;
}

/* «pista»: recuerda el valor que puso city3d (base) y el que puso esta capa; si al volver no está el nuestro, city3d lo cambió: nueva base */
const pista = () => ({ base: null, puesto: null });
function colorDe(p, c) { if (!p.base) p.base = c.clone(); else if (!p.puesto || !c.equals(p.puesto)) p.base.copy(c); return p.base; }
function numDe(p, v) { if (p.base === null || p.puesto === null || v !== p.puesto) p.base = v; return p.base; }

export function conectar(renderer) {
  const H = { tiempo: null, activa: true, estado: { ...ESTADOS.mediodia, dip: 0 }, de: null, a: null, t0: 0, dur: 0, dipT: 0, cola: [], ultimaHora: 'mediodia', medidas: { cuadros: 0, ms: 0 } };
  let esc = null, sol = null, hemi = null, viejo = null, cielo = null, montes = [], dirPuesta = null;
  const P = { solC: pista(), solI: pista(), hC: pista(), hG: pista(), hI: pista(), fogC: pista(), fogD: pista(), fondo: pista(), expo: pista(), pos: pista(), montH: pista(), sI: pista() };
  const _c = new THREE.Color(), _d = new THREE.Vector3(), _b = new THREE.Vector3(), _e = new THREE.Euler();
  function buscar(scene) {
    esc = scene; scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) sol = o; if (o.isHemisphereLight) hemi = o; if (o.userData && o.userData.luz && o.isGroup) viejo = o; });
    if (viejo) viejo.children.slice(1).forEach(m => { if (m.material && m.material.uniforms && m.material.uniforms.uH) montes.push(m.material.uniforms); });
    cielo = crearCielo(); scene.add(cielo);
  }
  /* mueve el estado hacia otra hora en «seg» segundos; dip = baja un poco la luz a mitad de camino (paso del atardecer al amanecer, sin noche) */
  H.ir = (hora, seg = 4, dip = 0) => { H.de = { ...H.estado }; H.a = { ...ESTADOS[hora] }; H.t0 = performance.now(); H.dur = Math.max(0.001, seg) * 1000; H.dipT = dip; H.ultimaHora = hora; H.cola.length = 0; };
  H.ya = hora => { H.estado = { ...ESTADOS[hora], dip: 0 }; H.de = H.a = null; H.ultimaHora = hora; H.cola.length = 0; };
  /* el turno entero: atardece (3 s), pausa, amanece (2,5 s, con la luz algo más baja en medio), se queda en la mañana y sube despacio al mediodía.
     Usuario, 24/11 («1-A pero que sean más de 8 segundos»): la subida dura SUBIDA segundos (antes 8). */
  H.turno = (alPasar) => { H.ir('atardecer', 3); H.cola.push([3600, () => { if (alPasar) alPasar(); H.ir('amanecer', 2.5, 0.35); }], [3600 + 2500 + QUIETO * 1000, () => H.ir('mediodia', SUBIDA)]); H.colaT0 = performance.now(); };
  H.enMarcha = () => !!H.a || H.cola.length > 0;
  function avanzar() {
    const now = performance.now();
    while (H.cola.length && now - H.colaT0 >= H.cola[0][0]) { const f = H.cola.shift()[1], resto = H.cola.slice(); f(); H.cola = resto; }
    if (!H.a) return; const u = Math.min(1, (now - H.t0) / H.dur), w = sm(u);
    H.estado = { a: H.de.a + (H.a.a - H.de.a) * w, t: H.de.t + (H.a.t - H.de.t) * w, dip: H.dipT * Math.sin(Math.PI * u) };
    if (u >= 1) { H.de = H.a = null; H.estado.dip = 0; }
  }
  function aplicar(camera) {
    avanzar(); const { a, t, dip } = H.estado, A = TINTES.amanecer, T = TINTES.atardecer, bajo = Math.max(a, t);
    /* CR4b: la capa del tiempo (tiempo.js), si está puesta, tiñe lo que deja la hora: estación → hora → tiempo */
    const W = H.tiempo ? H.tiempo.mezcla(a) : null;
    const mezcla = (base, k) => { _c.copy(base).lerp(A[k], A[k + 'Mez'] * a).lerp(T[k], T[k + 'Mez'] * t); if (W && W[k + 'Mez']) _c.lerp(W[k], W[k + 'Mez']); return _c; };
    const kI = (1 + (A.solK - 1) * a + (T.solK - 1) * t) * (1 - 0.35 * dip) * (W ? W.solK : 1), kH = (1 + (A.cieloK - 1) * a + (T.cieloK - 1) * t) * (1 - 0.25 * dip) * (W ? W.cieloK : 1);
    if (sol) { sol.color.copy(mezcla(colorDe(P.solC, sol.color), 'sol')); P.solC.puesto = (P.solC.puesto || new THREE.Color()).copy(sol.color);
      sol.intensity = P.solI.puesto = numDe(P.solI, sol.intensity) * kI; }
    if (hemi) { hemi.color.copy(mezcla(colorDe(P.hC, hemi.color), 'cielo')); P.hC.puesto = (P.hC.puesto || new THREE.Color()).copy(hemi.color);
      hemi.groundColor.copy(mezcla(colorDe(P.hG, hemi.groundColor), 'suelo')); P.hG.puesto = (P.hG.puesto || new THREE.Color()).copy(hemi.groundColor);
      hemi.intensity = P.hI.puesto = numDe(P.hI, hemi.intensity) * kH; }
    /* horizonte = bruma = fondo = pie de los montes: un solo color, para que no se vea la costura */
    const hz = mezcla(colorDe(P.fogC, esc.fog.color), 'horiz').clone(); if (dip) hz.multiplyScalar(1 - 0.2 * dip);
    esc.fog.color.copy(hz); P.fogC.puesto = (P.fogC.puesto || new THREE.Color()).copy(hz);
    colorDe(P.fondo, esc.background); esc.background.copy(hz); P.fondo.puesto = (P.fondo.puesto || new THREE.Color()).copy(hz);
    esc.fog.density = P.fogD.puesto = numDe(P.fogD, esc.fog.density) * (1 + (A.bruma - 1) * a + (T.bruma - 1) * t) * (W ? W.bruma : 1);
    renderer.toneMappingExposure = P.expo.puesto = numDe(P.expo, renderer.toneMappingExposure) * (1 + (A.expo - 1) * a + (T.expo - 1) * t) * (W ? W.expo : 1);
    if (sol && sol.shadow) sol.shadow.intensity = P.sI.puesto = numDe(P.sI, sol.shadow.intensity) * (1 - 0.8 * (W ? W.sombra : 0));      // CR4b: con nubes, sombras suaves (en plano city3d ya las suaviza: es la base)
    for (const m of montes) { colorDe(P.montH, m.uH.value); m.uH.value.copy(hz); P.montH.puesto = (P.montH.puesto || new THREE.Color()).copy(hz); }
    /* el sol: la dirección de la estación a mediodía; al amanecer gira al otro lado del cielo y baja; al atardecer baja por el mismo lado */
    if (sol) {
      const tg = sol.target.position; _b.copy(sol.position).sub(tg); if (!P.pos.puesto || !sol.position.equals(P.pos.puesto)) P.pos.base = _b.clone().normalize();
      const b = P.pos.base, el0 = Math.asin(Math.max(-1, Math.min(1, b.y))), az0 = Math.atan2(b.z, b.x);
      const elA = A.el * Math.PI / 180, elT = T.el * Math.PI / 180, giro = a / Math.max(1e-6, a + t) * Math.PI * (a + t > 1e-6 ? 1 : 0);
      const el = el0 + (elA - el0) * a + (elT - el0) * t, az = az0 + (a + t > 1e-6 ? giro * Math.min(1, (a + t) * 1.6) : 0);
      _d.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
      sol.position.copy(tg).addScaledVector(_d, _b.length()); P.pos.puesto = sol.position.clone();
      if (!dirPuesta || dirPuesta.angleTo(_d) > 0.004) { dirPuesta = _d.clone(); renderer.shadowMap.needsUpdate = true; }      // la sombra se rehace solo si el sol se ha movido
      cielo.material.uniforms.uSol.value.copy(_d);
    }
    const u = cielo.material.uniforms; u.uHoriz.value.copy(hz); u.uBajo.value = bajo;
    u.uCenit.value.copy(MEDIODIA.cenit).lerp(A.cenit, a).lerp(T.cenit, t); if (dip) u.uCenit.value.multiplyScalar(1 - 0.25 * dip);
    u.uBrillo.value.copy(MEDIODIA.brillo).lerp(A.brillo, a).lerp(T.brillo, t); u.uNube.value.copy(MEDIODIA.nube).lerp(A.nube, a).lerp(T.nube, t);
    u.uT.value = (performance.now() / 1000) % 10000;
    if (W) {      /* CR4b: cielo cubierto: el cénit se vuelve gris, el resplandor se apaga y las nubes toman algo del color de la hora por debajo */
      u.uCubierto.value = W.cubierto; if (W.cenitMez) u.uCenit.value.lerp(W.cenit, W.cenitMez);
      u.uBrillo.value.multiplyScalar(1 - 0.8 * W.cubierto);
      u.uNubeLuz.value.copy(W.nubeMez ? W.nube : MEDIODIA.nube).lerp(u.uNube.value, 0.35 * bajo);
      u.uNubeOsc.value.copy(W.nubeOscMez ? W.nubeOsc : MEDIODIA.nube).lerp(u.uNube.value, 0.18 * bajo); if (dip) { u.uNubeLuz.value.multiplyScalar(1 - 0.25 * dip); u.uNubeOsc.value.multiplyScalar(1 - 0.25 * dip); }
      H.tiempo.cuadro(esc, camera, hz);
    } else u.uCubierto.value = 0;
  }
  /* luz de hoy: devuelve a city3d lo suyo y quita el cielo nuevo */
  function restaurar() {
    const vuelve = (p, c) => { if (p.base && p.puesto && c.equals(p.puesto)) c.copy(p.base); p.puesto = null; };
    if (sol) { vuelve(P.solC, sol.color); if (P.solI.puesto === sol.intensity) sol.intensity = P.solI.base; if (P.pos.puesto && sol.position.equals(P.pos.puesto)) { const lg = _b.copy(sol.position).sub(sol.target.position).length(); sol.position.copy(sol.target.position).addScaledVector(P.pos.base, lg); renderer.shadowMap.needsUpdate = true; } }
    if (hemi) { vuelve(P.hC, hemi.color); vuelve(P.hG, hemi.groundColor); if (P.hI.puesto === hemi.intensity) hemi.intensity = P.hI.base; }
    vuelve(P.fogC, esc.fog.color); vuelve(P.fondo, esc.background); for (const m of montes) vuelve(P.montH, m.uH.value);
    if (sol && sol.shadow && P.sI.puesto === sol.shadow.intensity) sol.shadow.intensity = P.sI.base;
    if (P.fogD.puesto === esc.fog.density) esc.fog.density = P.fogD.base; if (P.expo.puesto === renderer.toneMappingExposure) renderer.toneMappingExposure = P.expo.base;
    for (const k in P) { P[k].puesto = null; } dirPuesta = null;
    if (H.tiempo) H.tiempo.quitar();
  }
  let estabaActiva = true;
  const orig = renderer.render.bind(renderer);
  renderer.render = (scene, camera) => {
    if (scene && scene.isScene && scene.fog && (esc === scene || (!esc && scene.children.length > 20))) {
      if (!esc) buscar(scene);
      if (H.activa) { const t0 = performance.now(); aplicar(camera); cielo.visible = true; if (viejo) viejo.children[0].visible = false; H.medidas.ms += performance.now() - t0; H.medidas.cuadros++; }
      else if (estabaActiva) { restaurar(); cielo.visible = false; if (viejo) viejo.children[0].visible = true; }
      estabaActiva = H.activa;
    }
    return orig(scene, camera);
  };
  return H;
}
