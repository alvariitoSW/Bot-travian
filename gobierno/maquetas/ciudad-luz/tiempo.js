/* AQVILA — CR4b: «El tiempo» por encima de la hora (maqueta; no toca la lógica ni js/gfx/city3d.js).
   Usuario, 24/11 («que haya días que llueva, que esté nublado, etc.»; aprobado: «2 si a ambos»). Solo lo que se ve.
   Cuatro tiempos: despejado (lo de CR4), nublado, lluvia y niebla de río.
   Capas: estación (city3d, Q11) → hora (hora.js) → tiempo (este archivo). Cada capa tiñe la anterior: hora.js mezcla su tinte y luego
   llama a mezcla() de aquí, antes de apuntar lo «puesto» en su pista. Así la pista base/puesto sigue sirviendo para las tres capas.
   Lo que añade a la escena, todo por código y sin texturas:
   - nubes de verdad en el cielo (ruido por capas que se mueve despacio) y el cielo cubierto, sin disco de sol;
   - gotas de lluvia (una sola malla; el movimiento lo hace la tarjeta gráfica, la CPU no toca nada por cuadro);
   - suelo y tejados mojados: más oscuros y con un brillo del cielo en lo que mira hacia arriba (un parche en los materiales Lambert);
   - niebla de río: velos bajos que siguen el Tíber, más densos por la mañana; se levantan hacia mediodía.
   El sorteo: sortear(semilla, turno, estacion, previo) da el tiempo de un turno, con semilla (siempre el mismo para la misma partida).
   Más adelante lo dará la lógica del juego (tarea de Cerebro, después de CDe3): T.fuente = () => Game.state.tiempo, y ya no se sortea aquí. */
import { THREE } from '../../../js/gfx/models.js';
import { RIO, NIVEL_RIO, altura } from '../../../js/gfx/mundo.js';

export const TIEMPOS = ['despejado', 'nublado', 'lluvia', 'niebla'];
export const NOMBRE = { despejado: 'Despejado', nublado: 'Nublado', lluvia: 'Lluvia', niebla: 'Niebla de río' };

/* Reparto por estación (de cada 100 turnos). Clima mediterráneo: lluvias de otoño e invierno, verano seco; nieblas del valle del Tíber
   en los meses fríos. Las cifras exactas son licencia de juego (las afinará Cerebro cuando el tiempo cambie el juego). */
export const REPARTO = [
  { despejado: 45, nublado: 25, lluvia: 18, niebla: 12 },     // primavera
  { despejado: 72, nublado: 16, lluvia: 7, niebla: 5 },       // verano
  { despejado: 30, nublado: 27, lluvia: 26, niebla: 17 },     // otoño
  { despejado: 26, nublado: 31, lluvia: 29, niebla: 14 }];    // invierno
export const SIGUE = 0.3;      // probabilidad de que el tiempo de ayer siga hoy (las rachas: una semana de lluvia, otra de sol)

/* azar con semilla: el mismo número siempre da el mismo tiempo (para que la partida sea repetible y se pueda probar) */
function azar(n) { let t = (n >>> 0) + 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
export function sortear(semilla, turno, estacion, previo) {
  const r1 = azar(semilla * 7919 + turno * 104729 + 13), r2 = azar(semilla * 15485863 + turno * 32452843 + 7);
  if (previo && TIEMPOS.includes(previo) && r1 < SIGUE) return previo;
  const rep = REPARTO[((estacion % 4) + 4) % 4], tot = TIEMPOS.reduce((s, k) => s + rep[k], 0);
  let x = r2 * tot; for (const k of TIEMPOS) { x -= rep[k]; if (x < 0) return k; } return 'despejado';
}

/* Tintes de cada tiempo sobre lo que deja la hora. mez = cuánto se acerca a ese color; K = multiplica la intensidad.
   cubierto = cuánto cielo tapan las nubes; sombra = cuánto se borran las sombras; mojado = suelo y tejados; lluvia y niebla = las capas propias. */
const T = {
  nublado: { sol: '#c9ccd2', solMez: 0.7, solK: 0.42, cielo: '#aeb4bc', cieloMez: 0.6, cieloK: 1.2, suelo: '#77746c', sueloMez: 0.3, horiz: '#b6babd', horizMez: 0.7,
    bruma: 1.5, expo: 0.98, cenit: '#8a93a0', cenitMez: 0.85, nube: '#d3d6da', nubeOsc: '#7f8792', cubierto: 0.85, sombra: 0.7, mojado: 0, lluvia: 0, niebla: 0 },
  lluvia: { sol: '#a9b1bb', solMez: 0.8, solK: 0.26, cielo: '#9ba4ae', cieloMez: 0.65, cieloK: 1.12, suelo: '#5a5c5e', sueloMez: 0.4, horiz: '#939aa1', horizMez: 0.85,
    bruma: 2.6, expo: 0.94, cenit: '#69727e', cenitMez: 0.95, nube: '#9ea5ae', nubeOsc: '#535b64', cubierto: 1, sombra: 0.88, mojado: 1, lluvia: 1, niebla: 0 },
  niebla: { sol: '#f0e6d8', solMez: 0.45, solK: 0.62, cielo: '#cacbc8', cieloMez: 0.5, cieloK: 1.12, suelo: '#8a8478', sueloMez: 0.25, horiz: '#d6d6d0', horizMez: 0.85,
    bruma: 1.6, expo: 1.0, cenit: '#b4bcc6', cenitMez: 0.7, nube: '#e9e7e2', nubeOsc: '#b3b4b1', cubierto: 0.45, sombra: 0.55, mojado: 0.25, lluvia: 0, niebla: 1 }
};
const COLORES = ['sol', 'cielo', 'suelo', 'horiz', 'cenit', 'nube', 'nubeOsc'];
for (const t of Object.values(T)) for (const k of COLORES) t[k] = new THREE.Color(t[k]);
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };

/* ---------- lluvia: gotas como finas cintas que caen; el vértice calcula dónde está cada gota con el reloj ---------- */
function crearLluvia(n = 6000) {
  const pos = new Float32Array(n * 4 * 3), base = new Float32Array(n * 4 * 4), esq = new Float32Array(n * 4 * 2), idx = new Uint32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const b = [Math.random(), Math.random(), Math.random(), 0.6 + 0.8 * Math.random()];      // sitio en la caja y largo de la gota
    for (let j = 0; j < 4; j++) { base.set(b, (i * 4 + j) * 4); esq.set([j >> 1, (j & 1) * 2 - 1], (i * 4 + j) * 2); }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3], i * 6);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aBase', new THREE.BufferAttribute(base, 4));
  g.setAttribute('aEsq', new THREE.BufferAttribute(esq, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  const u = { uT: { value: 0 }, uCentro: { value: new THREE.Vector3() }, uTam: { value: new THREE.Vector3(420, 300, 420) }, uCam: { value: new THREE.Vector3() },
    uCaida: { value: new THREE.Vector3(18, -260, 6) }, uColor: { value: new THREE.Color('#c9d2dc') }, uAlfa: { value: 0 } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: u,
    vertexShader: `attribute vec4 aBase; attribute vec2 aEsq; uniform float uT; uniform vec3 uCentro, uTam, uCam, uCaida; varying float vA;
      void main(){
        vec3 p = aBase.xyz * uTam + uCaida * uT * (0.85 + 0.3 * aBase.w);
        p = uCentro + mod(p - uCentro + uTam * 0.5, uTam) - uTam * 0.5;                // las gotas están quietas en el mundo y dan la vuelta a la caja
        vec3 dir = normalize(uCaida); float largo = 4.5 * aBase.w;
        p += dir * largo * aEsq.x;
        vec3 aCam = normalize(uCam - p); vec3 lado = normalize(cross(dir, aCam));
        float d = length(uCam - p); p += lado * aEsq.y * (0.025 + d * 0.0006);         // finas; algo más anchas lejos, para que no desaparezcan
        vec3 r = abs(p - uCentro) / (uTam * 0.5);
        vA = (1.0 - smoothstep(0.7, 1.0, max(r.x, max(r.y, r.z)))) * smoothstep(25.0, 90.0, d) * (0.55 + 0.45 * aEsq.x);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform vec3 uColor; uniform float uAlfa; varying float vA; void main(){ gl_FragColor = vec4(uColor, uAlfa * vA);
      #include <colorspace_fragment>
    }` }));
  m.frustumCulled = false; m.renderOrder = 6; m.visible = false; m.userData.u = u; return m;
}

/* ---------- niebla de río: velos bajos a lo largo del Tíber, que siguen la orilla y se mueven despacio ---------- */
function crearNiebla() {
  const pts = RIO.map(p => Array.isArray(p) ? p : [p.x, p.z]).filter((p, i, a) => i % 3 === 0 || i === a.length - 1);
  const ANCHO = 360, COLS = 12, CAPAS = [2, 7, 14], ALFA = [0.8, 0.55, 0.35];
  const pos = [], uvs = [], idx = []; let v = 0;
  CAPAS.forEach((h, c) => {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L;
      for (let j = 0; j <= COLS; j++) {
        const s = j / COLS * 2 - 1, x = pts[i][0] + nx * s * ANCHO, z = pts[i][1] + nz * s * ANCHO;
        pos.push(x, Math.max(altura(x, z), NIVEL_RIO) + h, z); uvs.push(s, ALFA[c]);
        if (i > 0 && j > 0) { const q = v - COLS - 1; idx.push(q - 1, v - 1, q, q, v - 1, v); }
        v++;
      }
    }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
  const u = { uT: { value: 0 }, uColor: { value: new THREE.Color() }, uAlfa: { value: 0 }, uCam: { value: new THREE.Vector3() } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, uniforms: u,
    vertexShader: 'varying vec2 vU; varying vec3 vP; void main(){ vU = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uAlfa; uniform vec3 uColor, uCam; varying vec2 vU; varying vec3 vP;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vr(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
      void main(){ vec2 p = vP.xz * 0.006 + vec2(uT * 0.012, uT * 0.004);
        float n = vr(p) * 0.55 + vr(p * 2.3 + 3.1) * 0.3 + vr(p * 5.1 - 1.7) * 0.15;
        float borde = pow(1.0 - abs(vU.x), 1.4);
        float cerca = smoothstep(25.0, 140.0, length(uCam - vP));                         // si la cámara está dentro, que no tape
        float a = uAlfa * vU.y * borde * cerca * smoothstep(0.3, 0.75, n) * 0.6;
        gl_FragColor = vec4(uColor, a);
        #include <colorspace_fragment>
      }` }));
  m.frustumCulled = false; m.renderOrder = 5; m.visible = false; m.userData.u = u; return m;
}

/* ---------- mojado: parche en los materiales Lambert de la ciudad (edificios, suelo, árboles). Con uMojado = 0 no cambia nada. ---------- */
const MOJ = { uMojado: { value: 0 }, uCieloM: { value: new THREE.Color('#9aa3ad') } };
const CODIGO_MOJADO = `{
  vec3 arr = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); float up = max(dot(normal, arr), 0.0);
  float fr = pow(1.0 - clamp(abs(dot(normal, normalize(vViewPosition))), 0.0, 1.0), 4.0);
  outgoingLight *= 1.0 - uMojado * (0.12 + 0.18 * up);                                    // lo mojado se ve más oscuro
  outgoingLight += uCieloM * uMojado * up * (0.1 + 0.6 * fr);                           // y lo que mira al cielo lo refleja un poco
}
#include <opaque_fragment>`;
function mojar(m) {
  if (!m || !m.isMeshLambertMaterial || m.userData.mojado) return false;
  const antes = m.onBeforeCompile, clave = Object.prototype.hasOwnProperty.call(m, 'customProgramCacheKey') ? m.customProgramCacheKey.bind(m) : () => antes.toString();
  m.onBeforeCompile = (sh, r) => {
    antes.call(m, sh, r);
    Object.assign(sh.uniforms, MOJ);
    sh.fragmentShader = 'uniform float uMojado; uniform vec3 uCieloM;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', CODIGO_MOJADO);
  };
  m.customProgramCacheKey = () => clave() + '|cr4b-mojado';
  m.userData.mojado = true; m.needsUpdate = true; return true;
}

/* ---------- el tiempo ---------- */
export function crearTiempo(opc = {}) {
  const W = { despejado: 1, nublado: 0, lluvia: 0, niebla: 0 };
  const X = {
    semilla: opc.semilla ?? 280, turno: 0, actual: 'despejado', fuente: null, historia: [],
    de: null, a: null, t0: 0, dur: 0, medidas: { cuadros: 0, ms: 0 }, objetos: null, parcheados: 0
  };
  const objetivo = k => Object.fromEntries(TIEMPOS.map(t => [t, t === k ? 1 : 0]));
  /* ir a un tiempo en «seg» segundos (con suavidad), o ya */
  X.ir = (k, seg = 5) => { if (!TIEMPOS.includes(k)) return; X.de = { ...W }; X.a = objetivo(k); X.t0 = performance.now(); X.dur = Math.max(0.001, seg) * 1000; X.actual = k; };
  X.ya = k => { if (!TIEMPOS.includes(k)) return; Object.assign(W, objetivo(k)); X.de = X.a = null; X.actual = k; };
  /* el tiempo del turno siguiente: de la lógica si ya lo da (T.fuente), si no, sorteado con semilla */
  X.siguiente = (estacion, seg = 6) => {
    X.turno++;
    let k = X.fuente ? X.fuente() : null;
    if (!TIEMPOS.includes(k)) k = sortear(X.semilla, X.turno, estacion, X.actual);
    X.historia.push(k); X.ir(k, seg); return k;
  };
  X.pesos = () => ({ ...W });
  X.enMarcha = () => !!X.a;
  function avanzar() {
    if (!X.a) return; const u = Math.min(1, (performance.now() - X.t0) / X.dur), w = sm(u);
    for (const k of TIEMPOS) W[k] = X.de[k] + (X.a[k] - X.de[k]) * w;
    if (u >= 1) X.de = X.a = null;
  }
  /* mezcla: lo que hora.js aplica encima de su tinte. a = cuánto es de mañana (0..1): la niebla de río es de mañana y se levanta hacia mediodía */
  const S = { cubierto: 0, sombra: 0, mojado: 0, lluvia: 0, niebla: 0, solK: 1, cieloK: 1, bruma: 1, expo: 1 };
  for (const k of COLORES) { S[k] = new THREE.Color(); S[k + 'Mez'] = 0; }
  X.mezcla = (a = 0) => {
    avanzar();
    const w = { nublado: W.nublado, lluvia: W.lluvia, niebla: W.niebla * (0.55 + 0.45 * a) };
    for (const k of ['cubierto', 'sombra', 'mojado', 'lluvia', 'niebla']) S[k] = 0;
    S.solK = S.cieloK = S.bruma = S.expo = 1;
    for (const k of COLORES) { S[k].setRGB(0, 0, 0); S[k + 'Mez'] = 0; }
    for (const [n, p] of Object.entries(w)) {
      if (p <= 0) continue; const t = T[n];
      for (const k of ['cubierto', 'sombra', 'mojado', 'lluvia', 'niebla']) S[k] += p * t[k];
      S.solK += p * (t.solK - 1); S.cieloK += p * (t.cieloK - 1); S.bruma += p * (t.bruma - 1); S.expo += p * (t.expo - 1);
      for (const k of COLORES) { const m = t[k + 'Mez'] ?? 1; S[k].r += p * m * t[k].r; S[k].g += p * m * t[k].g; S[k].b += p * m * t[k].b; S[k + 'Mez'] += p * m; }
    }
    for (const k of COLORES) if (S[k + 'Mez'] > 1e-6) S[k].multiplyScalar(1 / S[k + 'Mez']);
    return S;
  };
  /* cada cuadro: coloca lluvia y niebla, y moja los materiales. hz = color del horizonte ya mezclado (la niebla y las gotas lo toman) */
  let ultimoBarrido = 0;
  X.cuadro = (scene, camera, hz) => {
    const t0 = performance.now();
    if (!X.objetos) { X.objetos = { lluvia: crearLluvia(), niebla: crearNiebla() }; scene.add(X.objetos.lluvia, X.objetos.niebla); }
    if (t0 - ultimoBarrido > 2000) {      // materiales nuevos (un edificio recién hecho): se mojan también
      ultimoBarrido = t0; scene.traverse(o => { if (o.isMesh && o.material) for (const m of [].concat(o.material)) if (mojar(m)) X.parcheados++; });
    }
    const seg = t0 / 1000, { lluvia, niebla } = X.objetos;
    MOJ.uMojado.value = S.mojado; MOJ.uCieloM.value.copy(hz).multiplyScalar(0.9);
    const ul = lluvia.userData.u; lluvia.visible = S.lluvia > 0.02; ul.uAlfa.value = 0.34 * S.lluvia; ul.uT.value = seg % 1000;
    if (lluvia.visible && camera) {
      camera.getWorldPosition(ul.uCam.value); const f = new THREE.Vector3(); camera.getWorldDirection(f);
      ul.uCentro.value.copy(ul.uCam.value).addScaledVector(f, 150); ul.uColor.value.copy(hz).lerp(new THREE.Color('#e4eaf0'), 0.5);
    }
    const un = niebla.userData.u; niebla.visible = S.niebla > 0.02; un.uAlfa.value = Math.min(1, S.niebla); un.uT.value = seg % 10000;
    if (niebla.visible) { un.uColor.value.copy(hz).lerp(new THREE.Color('#f2f0ea'), 0.35); if (camera) camera.getWorldPosition(un.uCam.value); }
    X.medidas.ms += performance.now() - t0; X.medidas.cuadros++;
  };
  /* sin la capa: quita lo suyo */
  X.quitar = () => { MOJ.uMojado.value = 0; if (X.objetos) { X.objetos.lluvia.visible = false; X.objetos.niebla.visible = false; } };
  return X;
}

/* Para cuando el juego lo dé (tarea de Cerebro): el tiempo de este turno, si la partida lo guarda y es uno de los cuatro. */
export function leerDelJuego(Game) { const k = Game && Game.state && Game.state.tiempo; return TIEMPOS.includes(k) ? k : null; }
