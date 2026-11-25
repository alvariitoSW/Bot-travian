/* AQVILA · CG4: el entorno de la pantalla de mando (js/ui-mando.js): luz, niebla, cielo, suelo, piedras, árboles y polvo.
   A1 lo puso con la luz de la pantalla vieja de la campaña (ui-guerra, retirada en CG4b); A2 (este archivo) trae la luz y el campo de la maqueta GM43e («testudo-luz-campo»,
   aprobada por el usuario): sol bajo con sombras alargadas, gradación de color dentro del tonemapping, cielo con nubes
   teñido por el sol, bruma cálida, suelo de fotos con senda, calvas, manchas verdes y flores, piedras, árboles de 0 A.D.,
   lomas y montes con bruma, y polvo que levantan los pies. Adaptado a un campo de 1 200 × 700 m visto desde arriba.
   Arte: texturas y cielo de Poly Haven (CC0) y árboles de 0 A.D. (CC BY-SA 3.0); ver gobierno/maquetas/testudo-luz-campo/LICENSE.txt.
   BT1: la luz, la bruma, el cielo, el color del suelo y las matas son los de la escena a pie (MUNDO y lo de abajo, que importan
   gobierno/maquetas/bloque/escena.js y ../falange/campo.js): un solo mundo arriba y abajo.
   Uso: prepararLuz(THREE, renderer) antes de compilar nada; const E = await montarEntorno({ THREE, escena, Gr, St, UNIT_SCALE, campo });
   E.alt(x, z) da la altura; E.sombra dice hacia dónde cae la sombra; E.tick(dt, S, Sim, camara, altoPx) mueve el polvo; E.soltar() lo quita.
   Coordenadas de la escena: X = x del simulador, Z = −y (Roma, en y < 0, queda hacia +Z, cerca de la cámara). */
const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* campo de la escaramuza: solo paisaje (lomas, piedras y árboles alrededor); el simulador aún no tiene terreno */
const CAMPOS = { llano: { h: 0.35, arb: 140, pie: 120 }, colina: { h: 2.6, arb: 300, pie: 260 }, bosque: { h: 0.9, arb: 900, pie: 160 }, mixto: { h: 1, arb: 400, pie: 200 } };
export const LLANO = { x: 640, z: 390 };      /* la zona llana donde se lucha (las figuras van a ras de suelo, y = 0) */
const ARTE = n => 'gobierno/maquetas/testudo-luz-campo/arte/' + n;   /* las fotos de la maqueta GM43e (ya en la caché de sw.js) */
/* ---------- BT1 · un solo mundo: lo que comparten la batalla grande (este archivo, js/ui-mando.js) y la escena a pie
   (gobierno/maquetas/bloque/escena.js con ../falange/campo.js). La luz, la bruma, el cielo, el color del suelo y las matas de hierba
   salen de aquí; cada escena solo pone su escala (dónde va la senda, qué es «lejos»). Lo comprueba test/graficos-bt1.mjs ---------- */
export const MUNDO = Object.freeze({
  id: 'gm43e-bt1',                     /* el mismo en las dos escenas (window.__mundo); si cambia la luz o el suelo, súbelo */
  horiz: '#dcb888',                    /* el cielo junto al horizonte y el fondo */
  bruma: '#c9a77a',                    /* la bruma, cálida */
  /* el sol: bajo (unos 21 grados), delante y a la derecha. Un término medio: a pie da contraluz dorado (GM43e) y desde arriba no deja
     a los hombres negros (lo que pasaba con el sol de frente visto desde lo alto) */
  sol: [0.45, 0.36, -0.82], colSol: 0xffcb90, fuerzaSol: 3.0,
  cielo: [0xb9c8e0, 0x6e5a3e, 1.5],    /* luz del cielo: arriba, suelo, fuerza */
  relleno: [0xfff0dc, 2.4, -0.4, 0.6, 1],   /* el cielo que rebota, desde detrás de la cámara: sin él, las espaldas a contraluz salen negras */
  exposicion: 1.08,
  /* las matas de hierba: secas y verdes */
  seca: ['#c9b46c', '#b3a05a', '#a8a85a'], verde: ['#7e9440', '#6b8436', '#94a050']
});
/* la bruma, con una sola regla para las dos alturas: las tropas a la distancia de juego (D: de la cámara al suelo que mira en el centro
   de la pantalla) quedan nítidas y el horizonte se pierde. FogExp2: bruma = 1 − e^(−(k·d)²); con k = 0,15 / D, a D un 2 %, a 2·D un 9 %,
   a 6·D (el horizonte) más del 50 %. A pie D ≈ 55 m (k ≈ 0,0027; antes 0,0042 fijo); en Ásculo D ≈ 140 m; desde arriba, cientos de metros */
export const brumaPara = D => 0.15 / Math.max(40, D);
export const distanciaVista = camara => { const e = camara.matrixWorld.elements, vy = -e[9]; return vy < -0.05 ? Math.min(3000, camara.position.y / -vy) : 3000; };   /* la cámara mira por −z */
export function ajustaBruma(escena, camara) {
  if (!escena.fog || !escena.fog.isFogExp2) return;
  escena.fog.density = brumaPara(distanciaVista(camara));
}
/* el cielo: la foto con nubes (Kloofendal 48d, Poly Haven, CC0) teñida por el sol; la misma esfera en las dos escenas */
export function crearCielo(THREE, tCielo, SOL) {
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(9000, 40, 20), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uCielo: { value: tCielo }, uSol: { value: SOL }, uH: { value: new THREE.Color(MUNDO.horiz) } },
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
  cielo.renderOrder = -10; cielo.frustumCulled = false; return cielo;
}
/* el color del suelo: hierba seca, manchas verdes, calvas y senda de tierra; dos escalas contra la repetición. Va en el lugar de
   #include <map_fragment> de un MeshLambertMaterial. Cada escena define antes las funciones de su escala:
     float mascaraSenda(vec2 p, float n)  la senda (1 en medio)     float orillaSenda(vec2 p, float n)  la hierba pisada a sus lados
     float lejania(vec2 p)                0 donde se lucha, 1 en las lomas (matorral)
   y los uniformes uRuido, uSeca, uVerde, uTierra; varyings vW (posición en el mundo) y vNy (normal hacia arriba). Con LEJOS, menos lecturas */
export const SUELO_GLSL = `
      vec2 p = vW.xz; const mat2 GIRO = mat2(0.8, -0.6, 0.6, 0.8);
      float n1 = texture2D(uRuido, p * 0.0031).r;
      #ifdef LEJOS
      vec3 seca = texture2D(uSeca, GIRO * p * 0.073 + 0.37).rgb * vec3(1.06, 1.1, 0.82), verde = texture2D(uVerde, p * 0.061 + 0.6).rgb * vec3(1.12, 1.18, 0.92);
      float mV = smoothstep(0.32, 0.62, n1), calva = 0.0, senda = 0.0;
      vec3 c = mix(seca, verde, mV * 0.85);
      #else
      vec2 nn = texture2D(uRuido, p * 0.013 + 0.3).gb; float n2 = nn.x, n3 = nn.y;
      vec3 seca = mix(texture2D(uSeca, p * 0.21).rgb, texture2D(uSeca, GIRO * p * 0.073 + 0.37).rgb, 0.45) * vec3(1.06, 1.1, 0.82);
      vec3 verde = texture2D(uVerde, GIRO * p * 0.12).rgb * vec3(1.12, 1.18, 0.92);
      vec3 tierra = texture2D(uTierra, p * 0.26).rgb;
      float mV = smoothstep(0.32, 0.62, n1 + (n2 - 0.5) * 0.5);
      mV = mix(mV, 0.4, 0.35 * smoothstep(150.0, 600.0, distance(vW, cameraPosition)));   /* BT1: de lejos, manchas verdes más suaves */
      vec3 c = mix(seca, verde, mV * 0.85);
      float calva = smoothstep(0.72, 0.82, n2 + (n3 - 0.5) * 0.3) * (1.0 - 0.6 * smoothstep(90.0, 420.0, distance(vW, cameraPosition))), senda = mascaraSenda(p, n3), orilla = orillaSenda(p, n2);   /* BT1: de lejos las calvas se apagan (si no, el campo se ve a manchas de camuflaje) */
      c = mix(c, tierra, max(max(senda * 0.85, calva * 0.6), orilla * 0.3));
      #endif
      /* lejos, las matas ya no se dibujan una a una (o no se distinguirían): su color medio cubre el suelo donde crecerían, fuera de
         calvas y senda. Así el campo visto desde arriba es el mismo que a pie, con su hierba amarilla y verde */
      { float lm = smoothstep(30.0, 140.0, distance(vW, cameraPosition)) * (1.0 - calva * 0.85) * (1.0 - senda * 0.9);
        c = mix(c, mix(vec3(0.25, 0.2, 0.08), vec3(0.14, 0.18, 0.05), mV * 0.7), lm * 0.45); }
      c = mix(c, seca * vec3(1.08, 1.0, 0.86), smoothstep(0.97, 0.85, vNy) * 0.5);   /* laderas, más secas */
      { float mq = texture2D(uRuido, p * 0.0093 + 0.71).g; c = mix(c, vec3(0.2, 0.25, 0.12), smoothstep(0.52, 0.68, mq) * 0.65 * lejania(p)); }   /* lejos, matorral mediterráneo */
      c *= mix(0.84, 1.1, n1);
      diffuseColor.rgb *= c * 1.08;`;
/* una mata de hierba: hojas curvas, cada una distinta (azar: el generador de la escena, para que cada una siga siendo la misma) */
export function geoMata(THREE, HOJAS, azar) {
  const pos = [], col = [], nor = [], idx = []; let v = 0;
  for (let b = 0; b < HOJAS; b++) {
    const a = azar() * Math.PI * 2, r = Math.sqrt(azar()) * 0.17, bx = Math.cos(a) * r, bz = Math.sin(a) * r;
    const h = 0.5 + azar() * 0.5, w = 0.018 + azar() * 0.014, cara = azar() * Math.PI, px = Math.cos(cara) * w, pz = Math.sin(cara) * w;
    const dl = a + (azar() - 0.5) * 1.2, l = (0.12 + azar() * 0.4) * h, lx = Math.cos(dl) * l, lz = Math.sin(dl) * l;
    const pt = t => [bx + lx * t * t, h * t * (1 - 0.15 * t * t * (l / h)), bz + lz * t * t];
    const m = pt(0.5), tp = pt(1);
    pos.push(bx - px, 0, bz - pz, bx + px, 0, bz + pz, m[0] - px * 0.7, m[1], m[2] - pz * 0.7, m[0] + px * 0.7, m[1], m[2] + pz * 0.7, tp[0], tp[1], tp[2]);
    const g0 = 0.55, g1 = 0.85; col.push(g0, g0, g0, g0, g0, g0, g1, g1, g1, g1, g1, g1, 1, 1, 1);
    for (let i = 0; i < 5; i++) nor.push(0, 1, 0);
    idx.push(v, v + 1, v + 3, v, v + 3, v + 2, v + 2, v + 3, v + 4); v += 5;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
}


/* ---------- la gradación de color de la maqueta (luz de A; BT1: la misma que a pie, gobierno/maquetas/bloque/escena.js la toma de aquí): ACES y luego algo más de contraste y color, sombras frías y luces cálidas.
   Va dentro del tonemapping de cada material: ninguna pasada de pantalla completa. Solo la usa el renderer que la pide (CustomToneMapping) ---------- */
export function prepararLuz(THREE, renderer) {
  const C = THREE.ShaderChunk, viejo = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
  if (C.tonemapping_pars_fragment.includes(viejo)) C.tonemapping_pars_fragment = C.tonemapping_pars_fragment.replace(viejo, `vec3 CustomToneMapping( vec3 color ) {
  vec3 p = sqrt( ACESFilmicToneMapping( color ) );
  float l = dot( p, vec3( 0.299, 0.587, 0.114 ) );
  p = mix( vec3( l ), p, 1.18 );
  p = mix( p, p * p * ( 3.0 - 2.0 * p ), 0.45 );
  p += vec3( -0.012, 0.004, 0.022 ) * ( 1.0 - l ) * ( 1.0 - l ) + vec3( 0.03, 0.012, -0.03 ) * l * l;
  p = clamp( p, 0.0, 1.0 );
  return p * p;
}`);
  renderer.toneMapping = THREE.CustomToneMapping; renderer.toneMappingExposure = MUNDO.exposicion;   /* BT1: la de la escena a pie (antes 1,22) */
}

/* ---------- ruido propio (el de la maqueta): 256×256, se repite sin costura. r: manchas grandes; g: medianas; b: finas ---------- */
let RUIDO = null; const NR = 256;
function hazRuido() {
  if (RUIDO) return RUIDO; RUIDO = new Float32Array(NR * NR * 3);
  const red = (f, s) => { const g = new Float32Array(f * f); let k = s; for (let i = 0; i < f * f; i++) { k = (k * 16807) % 2147483647; g[i] = k / 2147483647; } return g; };
  const octava = (f, s) => { const g = red(f, s), o = new Float32Array(NR * NR);
    for (let j = 0; j < NR; j++) for (let i = 0; i < NR; i++) { const x = i / NR * f, y = j / NR * f, x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const v = (a, b) => g[((b % f) * f) + (a % f)]; o[j * NR + i] = (v(x0, y0) * (1 - sx) + v(x0 + 1, y0) * sx) * (1 - sy) + (v(x0, y0 + 1) * (1 - sx) + v(x0 + 1, y0 + 1) * sx) * sy; }
    return o; };
  [[4, 8, 16, 32], [8, 16, 32, 64], [16, 32, 64, 128]].forEach((fs, c) => {
    const os = fs.map((f, k) => octava(f, 11 + c * 97 + k * 13)), pesos = [0.5, 0.27, 0.15, 0.08];
    for (let i = 0; i < NR * NR; i++) { let s = 0; for (let k = 0; k < 4; k++) s += os[k][i] * pesos[k]; RUIDO[i * 3 + c] = s; }
  });
  for (let c = 0; c < 3; c++) { let lo = 1, hi = 0; for (let i = 0; i < NR * NR; i++) { const v = RUIDO[i * 3 + c]; lo = Math.min(lo, v); hi = Math.max(hi, v); } for (let i = 0; i < NR * NR; i++) RUIDO[i * 3 + c] = (RUIDO[i * 3 + c] - lo) / (hi - lo); }
  return RUIDO;
}
function ruido(u, v, c) {
  const R = hazRuido(), x = ((u % 1) + 1) % 1 * NR - 0.5, y = ((v % 1) + 1) % 1 * NR - 0.5, x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0;
  const m = (a, b) => R[((((b % NR) + NR) % NR) * NR + (((a % NR) + NR) % NR)) * 3 + c];
  return (m(x0, y0) * (1 - tx) + m(x0 + 1, y0) * tx) * (1 - ty) + (m(x0, y0 + 1) * (1 - tx) + m(x0 + 1, y0 + 1) * tx) * ty;
}
function texRuido(THREE) {
  const R = hazRuido(), d = new Uint8Array(NR * NR * 4); for (let i = 0; i < NR * NR; i++) { d[i * 4] = R[i * 3] * 255; d[i * 4 + 1] = R[i * 3 + 1] * 255; d[i * 4 + 2] = R[i * 3 + 2] * 255; d[i * 4 + 3] = 255; }
  const t = new THREE.DataTexture(d, NR, NR); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
}
/* la senda: un camino de tierra que cruza el campo por detrás de las líneas romanas y se tuerce (misma fórmula aquí y en el sombreador) */
const sendaZ = x => 300 + 38 * Math.sin(x * 0.0042 + 0.6) + 12 * Math.sin(x * 0.013) - 0.00009 * x * x;
const GLSL_SENDA = 'float sendaZ(float x){ return 300.0 + 38.0 * sin(x * 0.0042 + 0.6) + 12.0 * sin(x * 0.013) - 0.00009 * x * x; }\n'
  + 'float sendaX(float z){ return 150.0 + 42.0 * sin(z * 0.005 + 1.0) + 14.0 * sin(z * 0.017); }\n';
/* BT1 (2.ª vuelta): una segunda senda de frente, que cruza el campo entre los dos ejércitos, como la de a pie */
const sendaX = z => 150 + 42 * Math.sin(z * 0.005 + 1) + 14 * Math.sin(z * 0.017);
/* BT1: la escala de este campo para SUELO_GLSL: la senda va de lado a lado (a pie, de frente), algo más ancha que a pie para que se lea
   desde arriba; el matorral, en las lomas de fuera del llano */
const GLSL_ESCALA = `float dSenda(vec2 p){ return min(abs(p.y - sendaZ(p.x)), abs(p.x - sendaX(p.y))); }
float anchoSenda(){ return 1.0 + 0.003 * distance(vW, cameraPosition); }   /* la anchura que se ve: 2 m de cerca; de lejos, algo más, para que se lea */
float mascaraSenda(vec2 p, float n){ float w = anchoSenda(); return 1.0 - smoothstep(w, w * 2.6, dSenda(p) + (n - 0.5) * 2.2); }
float orillaSenda(vec2 p, float n){ float w = anchoSenda(); return 1.0 - smoothstep(w * 2.4, w * 5.5, dSenda(p) + (n - 0.5) * 2.2); }
float lejania(vec2 p){ return smoothstep(700.0, 950.0, max(abs(p.x), abs(p.y) * 1.6)); }
`;
const masSenda = (x, z) => 1 - suave(1.0, 2.6, Math.min(Math.abs(z - sendaZ(x)), Math.abs(x - sendaX(z))) + (ruido(x * 0.013 + 0.3, z * 0.013 + 0.3, 2) - 0.5) * 2.2);
const masCalva = (x, z) => suave(0.72, 0.82, ruido(x * 0.013 + 0.3, z * 0.013 + 0.3, 1) + (ruido(x * 0.013 + 0.3, z * 0.013 + 0.3, 2) - 0.5) * 0.3);
const masVerde = (x, z) => suave(0.32, 0.62, ruido(x * 0.0031, z * 0.0031, 0) + (ruido(x * 0.013 + 0.3, z * 0.013 + 0.3, 1) - 0.5) * 0.5);

export async function montarEntorno({ THREE, escena, Gr, St, UNIT_SCALE, campo, renderer }) {
  const CV = CAMPOS[campo] || CAMPOS.mixto, HORIZ = MUNDO.horiz, puestos = [], texs = [];
  const pon = o => { escena.add(o); puestos.push(o); return o; };
  let semilla = 99; const rnd = () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 4294967296; };
  const SOL = new THREE.Vector3(...MUNDO.sol).normalize();
  /* BT1: la luz y la bruma de la escena a pie (MUNDO), la misma regla de bruma (ajustaBruma en tick: nítido donde miras, bruma en el horizonte).
     Antes aquí: sol de lado 0xffdcb0 3,5, cielo 0xb4c4dc/0x5c5e34, relleno 0xc0cce0 1,7 y bruma verdosa #c3c0a4 fija */
  escena.background = new THREE.Color(HORIZ);
  escena.fog = new THREE.FogExp2(MUNDO.bruma, brumaPara(400));
  pon(new THREE.HemisphereLight(...MUNDO.cielo));
  const sol = pon(new THREE.DirectionalLight(MUNDO.colSol, MUNDO.fuerzaSol)); sol.position.copy(SOL).multiplyScalar(200);
  /* relleno desde detrás de la cámara (el cielo que rebota): sin él las espaldas, lejos del sol, quedarían negras */
  pon(new THREE.DirectionalLight(MUNDO.relleno[0], MUNDO.relleno[1])).position.set(MUNDO.relleno[2], MUNDO.relleno[3], MUNDO.relleno[4]);

  const cargar = n => new THREE.TextureLoader().loadAsync(ARTE(n)).then(t => { t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texs.push(t); return t; }).catch(() => null);
  const [tSeca, tVerde, tTierra, tRoca, tCielo] = await Promise.all(['hierba_seca.jpg', 'hierba_verde.jpg', 'tierra.jpg', 'roca.jpg', 'cielo.jpg'].map(cargar));
  const uRuido = { value: texRuido(THREE) }; texs.push(uRuido.value);
  const BRUMA = escena.fog.color.clone();

  /* relieve: llano donde se lucha; fuera, lomas suaves y, lejos, un horizonte de colinas */
  function alt(x, z) {
    const dx = Math.max(0, Math.abs(x) - LLANO.x), dz = Math.max(0, Math.abs(z) - LLANO.z), d = Math.hypot(dx, dz), f = suave(0, 220, d);
    let h = CV.h * 3 * f * (1.4 + 1.8 * Math.sin(x * 0.009 + 1.7) * Math.cos(z * 0.008 - 0.6) + 0.9 * Math.sin(x * 0.02 + z * 0.013)) * (1 + d / 400);
    h += f * 30 * ruido(x * 0.0011 + 0.2, z * 0.0011 + 0.6, 0) ** 2;
    const r = Math.hypot(x * 0.8, z); h += 160 * suave(1150, 1700, r) * (0.65 + 0.35 * Math.sin(Math.atan2(x, z) * 4 + 1));
    return Math.max(0, h);
  }

  /* ---------- cielo: la foto con nubes teñida por el sol (crearCielo, el mismo que a pie) ---------- */
  if (tCielo) {
    tCielo.generateMipmaps = false; tCielo.minFilter = THREE.LinearFilter;
    pon(crearCielo(THREE, tCielo, SOL));   /* BT1: el mismo cielo que a pie */
    /* el mismo cielo, como reflejo para el bronce y el hierro de los soldados (sin él, el metal sale negro); se calcula una vez */
    if (renderer) try { const pm = new THREE.PMREMGenerator(renderer), tc = tCielo.clone(); tc.mapping = THREE.EquirectangularReflectionMapping; tc.needsUpdate = true;
      const rt = pm.fromEquirectangular(tc); pm.dispose(); tc.dispose(); escena.environment = rt.texture; escena.environmentIntensity = 0.42; texs.push({ dispose: () => rt.dispose() });
    } catch (e) { console.warn('sin reflejo del cielo', e); }
  }

  /* ---------- montes: dos cordilleras con silueta, pliegues y bruma al pie (de la maqueta, a esta escala) ---------- */
  [[2700, 260, '#3c443e', 0.3, 7.0], [5600, 820, '#59606f', 0.45, 3.0]]   /* BT1: los colores de a pie */.forEach(([r, altM, col, bruma, fq], k) => {
    const n = 300, pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = t * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const h = altM * (0.18 + 0.75 * ruido(t * fq, 0.13 + k * 0.4, 0) ** 1.5 + 0.22 * ruido(t * fq * 4, 0.7 + k * 0.2, 1) + 0.06 * ruido(t * fq * 16, 0.4, 2));
      pos.push(x, -60, z, x, h, z); uv.push(t, 0, t, 1);
      if (i < n) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ side: THREE.DoubleSide, fog: false, depthWrite: false, uniforms: { uRuido, uC: { value: new THREE.Color(col) }, uB: { value: BRUMA }, uBruma: { value: bruma }, uFq: { value: fq } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec2 vUv; uniform sampler2D uRuido; uniform vec3 uC, uB; uniform float uBruma, uFq;
        void main(){ float x = vUv.x * uFq;
          float pl = texture2D(uRuido, vec2(x * 2.3 + vUv.y * 0.18, vUv.y * 0.12)).g, n = texture2D(uRuido, vec2(x * 6.0, vUv.y * 0.9)).b, b = texture2D(uRuido, vec2(x * 3.0, vUv.y * 0.6 + 0.4)).r;
          vec3 c = uC * mix(0.72, 1.18, smoothstep(0.3, 0.75, pl + (n - 0.5) * 0.3));
          c = mix(c, uC * vec3(0.62, 0.74, 0.6), smoothstep(0.45, 0.65, b + (0.5 - vUv.y) * 0.4) * 0.7);
          c = mix(c, uB, uBruma); c = mix(c, uB, (1.0 - smoothstep(0.08, 0.6, vUv.y)) * 0.85);
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }` }));
    m.renderOrder = -9 + (1 - k); m.frustumCulled = false; pon(m);
  });

  /* ---------- suelo: hierba seca, manchas verdes, calvas, flores, tierra pisada donde se lucha y la senda; dos escalas contra la repetición ---------- */
  const g = new THREE.PlaneGeometry(4200, 4200, 160, 160).rotateX(-Math.PI / 2), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) P.setY(i, alt(P.getX(i), P.getZ(i)));
  g.computeVertexNormals(); g.deleteAttribute('uv');
  const matSuelo = new THREE.MeshLambertMaterial({ color: 0xffffff });
  if (tSeca && tVerde && tTierra) matSuelo.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uRuido, uSeca: { value: tSeca }, uVerde: { value: tVerde }, uTierra: { value: tTierra } });
    sh.vertexShader = 'varying vec3 vW; varying float vNy;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vW = (modelMatrix * vec4(transformed, 1.0)).xyz; vNy = objectNormal.y;');
    /* BT1: el color del suelo de a pie (SUELO_GLSL) con la senda, la orilla y la lejanía de este campo */
    sh.fragmentShader = 'varying vec3 vW; varying float vNy; uniform sampler2D uRuido, uSeca, uVerde, uTierra;\n' + GLSL_SENDA + GLSL_ESCALA + sh.fragmentShader.replace('#include <map_fragment>', SUELO_GLSL);
  };
  matSuelo.customProgramCacheKey = () => 'bt1-campo-suelo';
  pon(new THREE.Mesh(g, matSuelo));

  /* ---------- piedras: sueltas por el campo y algún peñasco fuera de donde se lucha (una llamada; 80 triángulos cada una) ---------- */
  const FIJAS = [];   /* [x, z, ancho, largo] de lo que echa sombra fija */
  let gPiedra = null, matPiedra = null;   /* BT1: las mismas piedras, también dentro del llano (ponDentro) */
  {
    const gp = new THREE.IcosahedronGeometry(1, 1), pp = gp.attributes.position, uv = [], col = [], V = new THREE.Vector3();
    for (let i = 0; i < pp.count; i++) {
      V.fromBufferAttribute(pp, i); const n = ruido(V.x * 0.21 + 0.5, V.z * 0.21 + V.y * 0.13, 1), f = 0.78 + 0.42 * n;
      V.multiplyScalar(f); V.y *= 0.62; if (V.y < -0.15) V.y = -0.15 + (V.y + 0.15) * 0.3; pp.setXYZ(i, V.x, V.y, V.z);
      uv.push((V.x + V.z * 0.6) * 0.45, (V.y + V.z * 0.4) * 0.45);
      const ao = 0.55 + 0.45 * suave(-0.2, 0.5, V.y); col.push(ao, ao, ao * 0.97);
    }
    gp.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gp.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); gp.computeVertexNormals();
    const lista = [], o = new THREE.Object3D(), c = new THREE.Color();
    const piedra = (x, z, s) => { o.position.set(x, alt(x, z) - s * 0.12, z); o.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5); o.scale.set(s * (0.8 + rnd() * 0.5), s * (0.7 + rnd() * 0.6), s * (0.8 + rnd() * 0.5)); o.updateMatrix(); c.setHSL(0.09 + rnd() * 0.04, 0.12 + rnd() * 0.1, 0.62 + rnd() * 0.2); lista.push([o.matrix.clone(), c.clone()]); };
    for (let i = 0; i < CV.pie; i++) { const x = (rnd() - 0.5) * 1500, z = (rnd() - 0.5) * 900; piedra(x, z, 0.35 + rnd() * rnd() * 1.4); }
    for (let i = 0; i < 40; i++) { const x = (rnd() - 0.5) * 2 * (LLANO.x + 500), z = (rnd() - 0.5) * 2 * (LLANO.z + 450); if (Math.abs(x) < LLANO.x + 20 && Math.abs(z) < LLANO.z + 20) continue; piedra(x, z, 2.5 + rnd() * 4); }
    for (let i = 0; i < 70; i++) { const x = (rnd() - 0.5) * 1400; piedra(x, sendaZ(x) + (rnd() - 0.5) * 12, 0.3 + rnd() * 0.5); }   /* guijarros junto a la senda */
    const mat = matPiedra = new THREE.MeshLambertMaterial({ map: tRoca, vertexColors: true }); gPiedra = gp;
    const im = new THREE.InstancedMesh(gp, mat, lista.length); lista.forEach(([m, cc], i) => { im.setMatrixAt(i, m); im.setColorAt(i, cc); });
    im.frustumCulled = false; pon(im);
    for (const [m] of lista) { const e = m.elements, s = Math.hypot(e[0], e[1], e[2]); if (s > 1.2) FIJAS.push([e[12], e[14], s * 1.6, s * 3.2]); }
  }

  /* ---------- árboles de 0 A.D. alrededor del llano, nunca dentro (taparían a los soldados); una hilera de cipreses junto a la senda ---------- */
  {
    const arboles = { cipres: [], olivo: [], pino: [] }, E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
    const arbol = (tipo, x, z, k) => { const e = UNIT_SCALE * k * (0.75 + rnd() * 0.6) * (tipo === 'pino' ? 0.8 : 1); arboles[tipo].push(new THREE.Matrix4().compose(V.set(x, alt(x, z) - 0.2, z), Q.setFromEuler(E.set(0, rnd() * 6.28, 0)), SC.set(e, e * (0.9 + rnd() * 0.25), e))); FIJAS.push([x, z, (tipo === 'cipres' ? 1.3 : 2.6) * e, (tipo === 'cipres' ? 6 : 7) * e]); };
    for (let k = 0, intentos = 0; k < CV.arb && intentos < CV.arb * 6; intentos++) {
      const x = (rnd() - 0.5) * 2 * (LLANO.x + 420), z = (rnd() - 0.5) * 2 * (LLANO.z + 380);
      if (Math.abs(x) < LLANO.x + 30 && Math.abs(z) < LLANO.z + 30) continue;
      if (CV.arb > 200 && ruido(x * 0.0016, z * 0.0016, 1) < 0.42) continue;   /* en bosquetes, no salpicados */
      k++; arbol(rnd() < 0.45 ? 'olivo' : rnd() < 0.6 ? 'cipres' : 'pino', x, z, 1);
    }
    for (let x = -LLANO.x - 300; x < LLANO.x + 300; x += 9 + rnd() * 7) { if (Math.abs(x) < LLANO.x + 30 || rnd() < 0.2) continue; arbol('cipres', x, sendaZ(x) - 9, 1.15); }
    for (const t in arboles) { const m = St.staticInstances(t, arboles[t]); if (m) pon(m); }
  }

  /* ---------- BT1: las matas de hierba de a pie (geoMata, mismas hojas y colores), solo alrededor de donde mira la cámara y solo
     cuando está cerca (desde la altura de general no se verían: serían menos de un píxel). Una llamada; se recolocan al mover la vista.
     Cada mata sale de su casilla del mundo con su propio azar: al volver a un sitio, las mismas matas en el mismo lugar ---------- */
  const uT = { value: 0 }, matas = (() => {
    const N = 5200, R = 58, CEL = 1.45, ESC = 0.62 * 1.25, CERCA = 150;   /* metros; ESC: la mata de a pie a la talla de las figuras de aquí (TALLA 1,25) */
    let sm = 7; const azarM = () => { sm = (sm * 16807) % 2147483647; return (sm - 1) / 2147483646; };
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    mat.onBeforeCompile = sh => {
      sh.uniforms.uT = uT; sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0'));   /* la cara de atrás, tan clara */
      sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        { vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]); float h = transformed.y * transformed.y;
          float w = sin(uT * 1.6 + ip.x * 0.31 + ip.y * 0.17) * 0.7 + sin(uT * 2.7 + ip.x * 0.8 - ip.y * 0.5) * 0.3;
          transformed.x += w * h * 0.16; transformed.z += w * h * 0.07; }`);
    };
    mat.customProgramCacheKey = () => 'bt1-matas';
    const im = new THREE.InstancedMesh(geoMata(THREE, 4, azarM), mat, N); im.count = 0; im.visible = false; im.frustumCulled = false; pon(im);
    const SECA = MUNDO.seca.map(h => new THREE.Color(h)), VERDE = MUNDO.verde.map(h => new THREE.Color(h)), o = new THREE.Object3D(), c = new THREE.Color();
    const hash = (i, j, k) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    let cx = 1e9, cz = 1e9;
    function rellena(x0, z0) {
      cx = x0; cz = z0; let n = 0;
      for (let i = Math.floor((x0 - R) / CEL); i <= Math.ceil((x0 + R) / CEL) && n < N; i++) for (let j = Math.floor((z0 - R) / CEL); j <= Math.ceil((z0 + R) / CEL) && n < N; j++) {
        const x = (i + hash(i, j, 1)) * CEL, z = (j + hash(i, j, 2)) * CEL; if ((x - x0) ** 2 + (z - z0) ** 2 > R * R) continue;
        const d = (1 - masSenda(x, z) * 0.9) * (1 - masCalva(x, z) * 0.85) * (0.45 + 0.55 * ruido(x * 0.03, z * 0.03, 2) ** 0.7); if (hash(i, j, 3) > d) continue;
        const pal = hash(i, j, 4) < masVerde(x, z) ? VERDE : SECA; c.copy(pal[Math.floor(hash(i, j, 5) * 3)]).multiplyScalar(0.85 + hash(i, j, 6) * 0.3);
        const e = ESC * (0.6 + hash(i, j, 7) * hash(i, j, 8));
        o.position.set(x, alt(x, z) - 0.02, z); o.rotation.set((hash(i, j, 9) - 0.5) * 0.25, hash(i, j, 10) * 6.28, (hash(i, j, 11) - 0.5) * 0.25); o.scale.set(e * (0.8 + hash(i, j, 12) * 0.5), e * (0.7 + hash(i, j, 13) * 0.6), e * (0.8 + hash(i, j, 14) * 0.5)); o.updateMatrix();
        im.setMatrixAt(n, o.matrix); im.setColorAt(n, c); n++;
      }
      im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    return { im, mira(camara, D) {
      im.visible = D < CERCA; if (!im.visible) return;
      const e = camara.matrixWorld.elements, vy = -e[9], x = camara.position.x - e[8] * D, z = camara.position.z - e[10] * D;   /* el suelo que mira el centro de la pantalla */
      if (vy < -0.05 && Math.hypot(x - cx, z - cz) > R * 0.3) rellena(x, z);
    } };
  })();

  /* ---------- sombra fija de árboles y peñascos, echada hacia donde cae la sombra del sol (una llamada) ---------- */
  const L2 = Math.hypot(SOL.x, SOL.z), DX = -SOL.x / L2, DZ = -SOL.z / L2, largoSol = L2 / SOL.y;   /* metros de sombra por metro de alto */
  const cS = document.createElement('canvas'); cS.width = cS.height = 64;
  { const gc = cS.getContext('2d'), r = gc.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(0.45, 'rgba(0,0,0,.7)'); r.addColorStop(1, 'rgba(0,0,0,0)'); gc.fillStyle = r; gc.fillRect(0, 0, 64, 64); }
  const tS = new THREE.CanvasTexture(cS), gS = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2); texs.push(tS);
  const matS = new THREE.MeshBasicMaterial({ map: tS, transparent: true, opacity: 0.42, depthWrite: false, color: 0x1a1408, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  function sombras(lista) {
    if (!lista.length) return;
    const som = new THREE.InstancedMesh(gS, matS, lista.length);
    const Qs = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(DX, DZ)), M = new THREE.Matrix4(), Ps = new THREE.Vector3(), Es = new THREE.Vector3();
    lista.forEach(([x, z, an, la], i) => { const px = x + DX * la * 0.35, pz = z + DZ * la * 0.35; Ps.set(px, alt(px, pz) + 0.08, pz); Es.set(an, 1, la); M.compose(Ps, Qs, Es); som.setMatrixAt(i, M); });
    som.frustumCulled = false; som.renderOrder = 1; pon(som);
  }
  sombras(FIJAS);

  /* ---------- BT1 (2.ª vuelta): dentro del llano también hay árboles, piedras y cipreses junto a las sendas, como a pie; solo donde no
     estorban: fuera del rectángulo que ocupan los dos ejércitos al empezar, con holgura para que avancen. Se ponen en el primer tick,
     cuando se sabe dónde están (el simulador no tiene terreno: los árboles no cambian nada de lo que se juega) ---------- */
  let dentroPuesto = false;
  function ponDentro(S) {
    dentroPuesto = true; if (!S || !S.man || !S.man.length) return;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const u of S.man) { x0 = Math.min(x0, u.x); x1 = Math.max(x1, u.x); z0 = Math.min(z0, -u.y); z1 = Math.max(z1, -u.y); }
    x0 -= 45; x1 += 45; z0 -= 70; z1 += 70;   /* holgura: el frente que pueden desplegar y la retaguardia; entre los dos ejércitos queda libre */
    const libre = (x, z, r) => (x < x0 - r || x > x1 + r || z < z0 - r || z > z1 + r) && Math.abs(x) < LLANO.x + 320 && Math.abs(z) < LLANO.z + 300;   /* y una orla de 300 m alrededor del llano */
    const arb = { cipres: [], olivo: [], pino: [] }, nuevas = [], o = new THREE.Object3D(), E = new THREE.Euler(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
    const arbol = (tipo, x, z, k) => { const e = UNIT_SCALE * k * (0.75 + rnd() * 0.6) * (tipo === 'pino' ? 0.8 : 1); arb[tipo].push(new THREE.Matrix4().compose(V.set(x, alt(x, z) - 0.2, z), Q.setFromEuler(E.set(0, rnd() * 6.28, 0)), SC.set(e, e * (0.9 + rnd() * 0.25), e))); nuevas.push([x, z, (tipo === 'cipres' ? 1.3 : 2.6) * e, (tipo === 'cipres' ? 6 : 7) * e]); };
    /* bosquetes de olivos y pinos (las encinas del campo de a pie) */
    const nB = Math.round(CV.arb / 3);
    for (let k = 0, intentos = 0; k < nB && intentos < nB * 20; intentos++) {
      const cx = (rnd() - 0.5) * 2 * (LLANO.x + 300), cz = (rnd() - 0.5) * 2 * (LLANO.z + 280); if (!libre(cx, cz, 12) || masSenda(cx, cz) > 0.1) continue;
      k++; const n = 4 + Math.floor(rnd() * 10), pino = rnd() < 0.15;   /* el pino tiene 1 000 triángulos: pocos */
      for (let i = 0; i < n; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * 22, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (libre(x, z, 0)) arbol(pino && rnd() < 0.7 ? 'pino' : 'olivo', x, z, 1.9); }   /* algo mayores, como las figuras de lejos (licencia de vista) */
    }
    /* hileras de cipreses junto a las sendas, como el lindero de a pie */
    for (let x = -LLANO.x; x < LLANO.x; x += 9 + rnd() * 7) { const z = sendaZ(x) - 9; if (rnd() > 0.2 && libre(x, z, 0)) arbol('cipres', x, z, 1.15); }
    for (let z = -LLANO.z; z < LLANO.z; z += 9 + rnd() * 7) { const x = sendaX(z) + 10; if (rnd() > 0.25 && libre(x, z, 0)) arbol('cipres', x, z, 1.15); }
    for (const t in arb) { const m = St.staticInstances(t, arb[t]); if (m) pon(m); }
    /* peñascos y piedras sueltas en las mismas zonas (una llamada) */
    const lista = []; for (let i = 0; i < 160; i++) { const x = (rnd() - 0.5) * 2 * LLANO.x, z = (rnd() - 0.5) * 2 * LLANO.z; if (libre(x, z, 5)) { const s = rnd() < 0.2 ? 2 + rnd() * 3 : 0.5 + rnd() * 1.2; o.position.set(x, alt(x, z) - s * 0.12, z); o.rotation.set((rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5); o.scale.set(s * (0.8 + rnd() * 0.5), s * (0.7 + rnd() * 0.6), s * (0.8 + rnd() * 0.5)); o.updateMatrix(); lista.push(o.matrix.clone()); if (s > 1.2) nuevas.push([x, z, s * 1.6, s * 3.2]); } }
    if (lista.length && gPiedra) { const im = new THREE.InstancedMesh(gPiedra, matPiedra, lista.length); const c = new THREE.Color(); lista.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, c.setHSL(0.09 + rnd() * 0.04, 0.12 + rnd() * 0.1, 0.62 + rnd() * 0.2)); }); im.frustumCulled = false; pon(im); }
    sombras(nuevas);
  }

  /* ---------- polvo que levantan los pies: nubecillas donde se marcha o se lucha; a contraluz se doran (una llamada, 420 puntos). CG8a: y una nube grande donde chocan (golpe) ---------- */
  const NP = 420, pPos = new Float32Array(NP * 3), pVida = new Float32Array(NP).fill(1), pTam = new Float32Array(NP), pVel = new Float32Array(NP * 2);
  const gPol = new THREE.BufferGeometry(); gPol.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); gPol.setAttribute('aVida', new THREE.BufferAttribute(pVida, 1)); gPol.setAttribute('aTam', new THREE.BufferAttribute(pTam, 1));
  const POL_U = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSol: { value: SOL }, uEsc: { value: 400 } };
  const polvo = new THREE.Points(gPol, new THREE.ShaderMaterial({ uniforms: POL_U, transparent: true, depthWrite: false, fog: true,
    vertexShader: `attribute float aVida, aTam; uniform float uEsc; uniform vec3 uSol; varying float vA; varying float vLuz;
      #include <fog_pars_vertex>
      void main(){ vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        float t = clamp(aVida, 0.0, 1.0); vA = t < 1.0 ? smoothstep(0.0, 0.15, t) * (1.0 - t) : 0.0;
        gl_PointSize = t < 1.0 ? aTam * (0.6 + 1.4 * t) * uEsc / max(1.0, -mvPosition.z) : 0.0;
        vec3 vista = normalize(position - cameraPosition); vLuz = pow(max(dot(vista, normalize(vec3(uSol.x, 0.3, uSol.z))), 0.0), 3.0);
        #include <fog_vertex>
      }`,
    fragmentShader: `varying float vA; varying float vLuz;
      #include <fog_pars_fragment>
      void main(){ vec2 q = gl_PointCoord - 0.5; float r = dot(q, q) * 4.0; if (r > 1.0) discard;
        vec3 c = mix(vec3(0.66, 0.56, 0.42), vec3(1.0, 0.82, 0.55), vLuz);
        gl_FragColor = vec4(c, vA * 0.34 * (1.0 - r) * (1.0 - r));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` }));
  polvo.frustumCulled = false; polvo.renderOrder = 4; pon(polvo);
  let sigP = 0; const antes = new Map();
  function soltarPolvo(x, z, tam) { const i = sigP; sigP = (sigP + 1) % NP; pPos[i * 3] = x; pPos[i * 3 + 1] = 0.6 + rnd() * 0.8; pPos[i * 3 + 2] = z; pVida[i] = 0; pTam[i] = tam; pVel[i * 2] = (rnd() - 0.5) * 1.2; pVel[i * 2 + 1] = (rnd() - 0.5) * 1.2; }
  /* CG8a: el golpe de un choque o una carga: una cortina de polvo a lo largo del frente (x, z del centro, ancho en m, a = dirección del frente) */
  function golpe(x, z, ancho, a, fuerza) {
    const n = Math.round(14 + 10 * fuerza), ca = Math.cos(a), sa = Math.sin(a);
    for (let k = 0; k < n; k++) { const l = (rnd() - 0.5) * ancho; soltarPolvo(x + ca * l + (rnd() - 0.5) * 4, z - sa * l + (rnd() - 0.5) * 4, (10 + rnd() * 9) * fuerza); const i = (sigP + NP - 1) % NP; pVel[i * 2] *= 3; pVel[i * 2 + 1] *= 3; pPos[i * 3 + 1] = 0.5 + rnd() * 2.5; }
  }
  let reloj = 0, ultimaD = 400;
  function tick(dt, S, Sim, camara, altoPx) {
    if (!dentroPuesto && S) ponDentro(S);
    if (camara) { camara.updateMatrixWorld(); const D = ultimaD = distanciaVista(camara); escena.fog.density = brumaPara(D); matas.mira(camara, D); }   /* BT1: la bruma y la hierba, según lo cerca que mires */
    if (dt > 0) { reloj += dt; uT.value = reloj; }
    if (camara && altoPx) POL_U.uEsc.value = altoPx / (2 * Math.tan(camara.fov * Math.PI / 360));
    if (!(dt > 0) || !S) return;
    for (let i = 0; i < NP; i++) if (pVida[i] < 1) { pVida[i] = Math.min(1, pVida[i] + dt / 3.2); pPos[i * 3] += pVel[i * 2] * dt; pPos[i * 3 + 2] += pVel[i * 2 + 1] * dt; pPos[i * 3 + 1] += dt * 0.9; }
    for (const u of S.man) {
      if (u.estado !== 'firme' && u.estado !== 'duda' && u.estado !== 'huye') { antes.delete(u.id); continue; }
      const a = antes.get(u.id), v = a ? Math.hypot(u.x - a.x, u.y - a.y) / dt : 0; antes.set(u.id, { x: u.x, y: u.y });
      const lucha = S.cont && S.cont[u.id] && S.cont[u.id].length > 0, ritmo = (lucha ? 2.2 : 0) + (v > 0.6 ? Math.min(2.6, v * 0.55) : 0);
      if (ritmo <= 0 || rnd() > ritmo * dt * 3) continue;
      const fr = Sim && Sim.frente ? Sim.frente(u) : 30, l = (rnd() - 0.5) * fr, lx = -Math.sin(u.a), ly = Math.cos(u.a), atras = lucha ? 0 : -6 * rnd();
      soltarPolvo(u.x + lx * l + Math.cos(u.a) * atras, -(u.y + ly * l + Math.sin(u.a) * atras), lucha ? 7 + rnd() * 6 : 5 + rnd() * 4);
    }
    gPol.attributes.position.needsUpdate = true; gPol.attributes.aVida.needsUpdate = true; gPol.attributes.aTam.needsUpdate = true;
  }

  /* BT1: para las pruebas (test/graficos-bt1.mjs): el mismo mundo que a pie */
  if (typeof window !== 'undefined') window.__mundo = { id: MUNDO.id, sol: sol.color.getHexString(), bruma: escena.fog.color.getHexString(), horiz: escena.background.getHexString(), suelo: SUELO_GLSL.length, exposicion: renderer ? renderer.toneMappingExposure : null, densidad: () => escena.fog.density, vista: () => ultimaD, matas: () => matas.im.visible ? matas.im.count : 0 };
  return { alt, sol, SOL, HORIZ, sombra: { dx: DX, dz: DZ, largo: largoSol }, tick, golpe,
    soltar() {
      for (const o of puestos) { escena.remove(o); if (o.geometry) o.geometry.dispose(); }   /* los árboles (grupos) comparten geometría con el resto del juego: no se sueltan */
      for (const t of texs) t.dispose(); puestos.length = 0; texs.length = 0; escena.fog = null; escena.environment = null; if (typeof window !== 'undefined') delete window.__mundo;
    } };
}
