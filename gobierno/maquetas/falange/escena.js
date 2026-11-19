/* Escena a pie, falange (TP7a): eres el oficial de una sintagma de la falange de Pirro (Heraclea o Ásculo, 280–279 a.C.)
   contra un manípulo romano que lanza sus pila y luego intenta meterse entre las picas.
   Hecha de las piezas de la escena a pie (TP1), cada una con su contrato:
     unidad.js (números y palabras) · formacion.js (la falange y sus sarisas) · locomocion.js (paso de cada hombre, sin cambios)
     soldado.js (tabla del falangita: bajar la sarisa, estocada) · esqueleto.js (posturas por cuentas; huesos del falangita)
     acciones.js (lo que pasa: marcha, pila, choque, golpe, empuje, ruptura) · enemigo.js (romanos) · camara.js · hud.js
     sonido.js · campo.js (sin cambios)
   Esta escena.js junta las piezas y dibuja: hombres, sarisas, pila, cresta, luz y campo (los de TP1).
   Soldados: arte de 0 A.D. (Wildfire Games, CC BY-SA 3.0); el arte del campo, de testudo-luz-campo/arte/. No toca js/.
   ?fase=marcha|astas|bajar|pila|choque|golpe|huida|final coloca la escena y la congela (para las capturas).
   ?t=segundos (con fase=bajar): cuánto después de la orden. */
import { THREE } from '../../../js/gfx/models.js';
import { preload, getUnit, loadIndex, frameOf, frameOnce, zancadas, UNIT_SCALE } from '../../../js/gfx/units.js';
import { texturaRuido } from '../../../js/gfx/ground.js';
import { crearCampo } from './campo.js';
import { H_FALANGE as HF } from './esqueleto.js';
import { FILES, M, DX, BAJAN, SARISA, AGARRE, CARRIL, alzada, bajada, YO } from './formacion.js';
import { dispersion } from './locomocion.js';
import { CJF, generaTablaFalange, hueso as huesoT, datosPies, pieEn, faseCero, filasMarcha, filaEnFase, tablaPaso } from './soldado.js';
import { filasRomano, N_R } from './enemigo.js';
import { crearAcciones, NPILA } from './acciones.js';
import { crearCamara } from './camara.js';
import { crearHud } from './hud.js';
import * as Son from './sonido.js';

const Q = new URLSearchParams(location.search), FASE = Q.get('fase'), MARCAS = Q.get('marcas'), ANTES = Q.get('antes') === '1', COSTADO = Q.get('costado');
const $ = id => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t, suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* ---------- luz de cine: dos retoques a los sombreadores de three, solo en esta página ----------
   1) gradación de color dentro del tonemapping (ACES y luego: algo más de contraste y de color, sombras frías y luces cálidas).
      Va en cada material, así que no hace falta ninguna pasada de pantalla completa.
   2) Lambert con borde de contraluz (el sol de frente enciende el canto de cascos, hombros y escudos; como sale de la luz del
      sol ya sombreada, bajo el techo no hay borde salvo donde entra el sol por la rendija) y con la luz del cielo
      multiplicada por uAmb (bajo los escudos el cielo no llega: penumbra de verdad, no un velo por encima). */
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
  .replace('varying vec3 vViewPosition;', 'varying vec3 vViewPosition;\nuniform float uBorde;\nuniform float uAmb;\nuniform float uTrasluz;\nvec3 solVis = vec3(0.0);\nvec3 solDir = vec3(0.0, 1.0, 0.0);')
  .replace('vec3 irradiance = dotNL * directLight.color;', `vec3 irradiance = dotNL * directLight.color;
	/* piezas finas de dos caras (escudos, telas): la cara que se ve solo recibe sol si el sol está de su lado (la normal del modelo a veces miente) */
	vec3 caraV = normalize( cross( dFdx( vViewPosition ), dFdy( vViewPosition ) ) ); caraV *= sign( dot( caraV, geometryViewDir ) );
	float lado = max( smoothstep( -0.08, 0.1, dot( caraV, directLight.direction ) ), uTrasluz ); irradiance *= lado;
#if NUM_DIR_LIGHTS > 0
	if ( dot( directLight.direction, directionalLights[ 0 ].direction ) > 0.999 ) { solVis += directLight.color * lado; solDir = directLight.direction; }
#endif`)
  .replace('reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );\n}', `reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	float fr = pow( 1.0 - saturate( dot( geometryNormal, geometryViewDir ) ), 2.2 ), tras = pow( saturate( dot( - geometryViewDir, directLight.direction ) ), 1.5 ) * smoothstep( -0.3, 0.25, dot( geometryNormal, directLight.direction ) );
	reflectedLight.directDiffuse += directLight.color * lado * fr * tras * uBorde * ( material.diffuseColor * 0.6 + vec3( 0.16, 0.12, 0.08 ) );
}`)
  .replace('reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );', 'reflectedLight.indirectDiffuse += irradiance * uAmb * BRDF_Lambert( material.diffuseColor );');
/* AMB: cuánto cielo llega a los hombres (1 fuera, poco bajo el techo) */
const AMB = { value: 1 }, AMB_FUERA = { value: 1 };
function cine(sh, borde, amb) {
  sh.uniforms.uBorde = { value: borde }; sh.uniforms.uAmb = amb || AMB_FUERA; sh.uniforms.uTrasluz = { value: 0 };
  sh.fragmentShader = sh.fragmentShader.replace('#include <lights_lambert_pars_fragment>', LAMBERT_CINE);
}
let semilla = 43; const azar = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
/* azar aparte para la luz y el polvo: así no cambia lo que pasa en la partida (dónde caen los venablos) */
let semillaV = 7; const azarV = () => { semillaV = (semillaV * 16807) % 2147483647; return (semillaV - 1) / 2147483646; };
/* TP1: azar aparte para el paso de cada hombre (retrasos, prisa, talla): así no cambia lo que pasa en la partida */
let semillaP = 5; const azarP = () => { semillaP = (semillaP * 16807) % 2147483647; return (semillaP - 1) / 2147483646; };
const E = UNIT_SCALE;
const H = (x, z) => 3.4 * suave(-70, -103, z) * (1 + 0.06 * Math.sin(x * 0.07)) + 0.22 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(z * 0.045 + 1.3) + 0.6 * suave(30, 90, Math.abs(x)) * Math.sin(z * 0.03);

/* ---------- motor ---------- */
const lienzo = $('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
/* GM43d-A «Luz de cine»: tarde baja con el sol de frente (contraluz), sombras de verdad ceñidas al manípulo, polvo en el aire,
   rayos por la rendija y una gradación de color hecha dentro del propio tonemapping (sin pasadas de pantalla extra) */
renderer.toneMapping = THREE.CustomToneMapping; renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const HORIZ = '#dcb888';
const escena = new THREE.Scene(); escena.background = new THREE.Color(HORIZ); escena.fog = new THREE.FogExp2('#c9a77a', 0.0045);   /* GM43e: bruma del color de A, exponencial para que se vean las lomas del campo de B */
const camara = new THREE.PerspectiveCamera(55, 1, 0.06, 12000); camara.rotation.order = 'YXZ';
/* el sol: bajo (19 grados), delante y algo a la derecha. Se mira siempre hacia él: los hombres salen recortados y con el borde encendido */
const SOL = new THREE.Vector3(0.13, 0.33, -0.94).normalize();
const cieloLuz = new THREE.HemisphereLight(0xa9bcd8, 0x5e4a2e, 0.8); escena.add(cieloLuz);
const luz = new THREE.DirectionalLight(0xffcb90, 4.3); luz.position.copy(SOL).multiplyScalar(40); escena.add(luz); escena.add(luz.target);
/* sombras: un mapa pequeño (1024) que va con la formación y solo la cubre a ella; con el sol bajo, 9 m de alto en el mapa son 40 m de suelo */
luz.castShadow = true; luz.shadow.mapSize.set(1024, 1024); luz.shadow.bias = -0.0006; luz.shadow.normalBias = 0.025; luz.shadow.radius = 2.5;
Object.assign(luz.shadow.camera, { left: -11, right: 11, top: 6, bottom: -6, near: 5, far: 90 }); luz.shadow.camera.updateProjectionMatrix();
/* luz de relleno desde detrás de la cámara (el cielo que rebota): sin ella las espaldas, a contraluz, quedarían negras */
const relleno = new THREE.DirectionalLight(0x9fb2cf, 0.55); relleno.position.set(-0.4, 0.6, 1); escena.add(relleno);
const U = { uRuido: { value: texturaRuido() } };
/* GM43e: los montes son los de campo.js (B), oscurecidos a contraluz allí */
/* el cielo (GM43e): la foto con nubes de B (Kloofendal 48d, Poly Haven, CC0) con el tratamiento de luz de A. El sol de la foto queda a la espalda
   de la cámara: delante solo brilla el nuestro, bajo y de frente */
const texCielo = new THREE.TextureLoader().load('gobierno/maquetas/testudo-luz-campo/arte/cielo.jpg'); texCielo.colorSpace = THREE.SRGBColorSpace; texCielo.wrapS = THREE.RepeatWrapping; texCielo.generateMipmaps = false; texCielo.minFilter = THREE.LinearFilter;
const cielo = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uCielo: { value: texCielo }, uSol: { value: SOL }, uH: { value: new THREE.Color(HORIZ) } },
  vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `varying vec3 vD; uniform sampler2D uCielo; uniform vec3 uSol, uH;
  void main(){ vec3 d = normalize(vD); float e = asin(clamp(d.y, -1.0, 1.0));
    float az = atan(d.x, -d.z), azS = atan(uSol.x, -uSol.z), eS = asin(uSol.y);
    /* el sol de la foto está a 4,7 grados; el nuestro, más alto: se sube un poco la foto (más, y el cielo bajo quedaría liso) */
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
let vertical = false;
function medir() {
  const w = innerWidth, h = innerHeight; vertical = h > w;
  renderer.setSize(w, h, false); camara.aspect = w / h; camara.updateProjectionMatrix();
}
addEventListener('resize', medir); medir();
/* grano de película: ruido pintado una vez, puesto de fondo en una capa fija (el CSS lo mueve a saltos) */
{ const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), im = g.createImageData(128, 128);
  for (let i = 0; i < im.data.length; i += 4) { const v = azarV() < 0.5 ? 0 : 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = azarV() * 255; }
  g.putImageData(im, 0, 0); $('grano').style.backgroundImage = 'url(' + c.toDataURL() + ')'; }

/* ---------- suelo ---------- */
/* penumbra en el suelo bajo la formación: más honda con el testudo cerrado (el cielo no entra) y algo de pisado en marcha */
const FORMA = { value: new THREE.Vector4(-3, -2, 3, 12) }, FORMA_K = { value: 0 };
function sueloCine(sh, instanciado) {
  cine(sh, 0.0); sh.uniforms.uForma = FORMA; sh.uniforms.uFormaK = FORMA_K;
  sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * ' + (instanciado ? 'instanceMatrix * ' : '') + 'vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = 'varying vec3 vWP;\nuniform vec4 uForma;\nuniform float uFormaK;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  vec2 cF = (uForma.xy + uForma.zw) * 0.5, mF = (uForma.zw - uForma.xy) * 0.5;
  float dF = length(max(abs(vWP.xz - cF) - mF, 0.0));
  diffuseColor.rgb *= 1.0 - (0.14 + 0.5 * uFormaK) * (1.0 - smoothstep(0.0, 0.9 + 1.6 * (1.0 - uFormaK), dF));`);
}


/* ---------- figuras con tabla de huesos propia, que mezclan dos filas (como las del testudo) ---------- */
const SKIN = `attribute vec4 aSkinI;\nattribute vec4 aSkinW;\nattribute float aMode;\nattribute float aFrame;\nattribute float aFrame2;\nattribute float aMix;\nuniform sampler2D uBones;\nvarying float vMode;
mat4 boneM(float slot, int row) { int x = int(slot + 0.5) * 3; vec4 a = texelFetch(uBones, ivec2(x, row), 0), b = texelFetch(uBones, ivec2(x + 1, row), 0), c = texelFetch(uBones, ivec2(x + 2, row), 0);
  return mat4(vec4(a.x, b.x, c.x, 0.0), vec4(a.y, b.y, c.y, 0.0), vec4(a.z, b.z, c.z, 0.0), vec4(a.w, b.w, c.w, 1.0)); }
mat4 boneG(float s) { mat4 m = boneM(s, int(aFrame + 0.5)); if (aMix > 0.001) m = m * (1.0 - aMix) + boneM(s, int(aFrame2 + 0.5)) * aMix; return m; }
mat4 piel() { mat4 sk = boneG(aSkinI.x) * aSkinW.x; if (aSkinW.y > 0.0) sk += boneG(aSkinI.y) * aSkinW.y; if (aSkinW.z > 0.0) sk += boneG(aSkinI.z) * aSkinW.z; if (aSkinW.w > 0.0) sk += boneG(aSkinI.w) * aSkinW.w; return sk; }
`;
const FRAG_MAP = `vec4 tx = texture2D(map, vMapUv);
  if (vMode > 1.5 && tx.a < 0.5) discard;
  if (vMode > 0.5 && vMode < 1.5) tx.rgb = mix(uTeam, tx.rgb, tx.a);
  diffuseColor.rgb *= tx.rgb;`;
function matFigura(tex, huesos, color, clave) {
  const m = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }), team = new THREE.Color(color);
  m.onBeforeCompile = sh => {
    cine(sh, 1.2); sh.uniforms.uBones = { value: huesos }; sh.uniforms.uTeam = { value: team };
    sh.vertexShader = SKIN + sh.vertexShader.replace('#include <beginnormal_vertex>', 'mat4 sk = piel(); vec3 objectNormal = normalize(mat3(sk) * normal); vMode = aMode;').replace('#include <begin_vertex>', 'vec3 transformed = (sk * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = 'uniform vec3 uTeam;\nvarying float vMode;\n' + sh.fragmentShader.replace('#include <map_fragment>', FRAG_MAP);
  };
  m.customProgramCacheKey = () => 'falange-fig-' + clave; return m;
}
function matSombra(huesos, clave) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => { sh.uniforms.uBones = { value: huesos }; sh.vertexShader = SKIN + sh.vertexShader.replace('#include <begin_vertex>', 'mat4 sk = piel(); vec3 transformed = (sk * vec4(position, 1.0)).xyz;'); };
  m.customProgramCacheKey = () => 'falange-sombra-' + clave; return m;
}
/* los vértices de unas piezas del modelo (cada vértice sabe de qué pieza es) */
function parte(geo, CELL, celdas) {
  const idx = []; for (let i = 0; i < CELL.length; i++) if (celdas.includes(CELL[i])) idx.push(i);
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv', 'aSkinI', 'aSkinW', 'aMode']) {
    const a = geo.attributes[k], t = a.itemSize, arr = new a.array.constructor(idx.length * t);
    for (let j = 0; j < idx.length; j++) for (let c = 0; c < t; c++) arr[j * t + c] = a.array[idx[j] * t + c];
    g.setAttribute(k, new THREE.BufferAttribute(arr, t, a.normalized));
  }
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 8); return { g, idx };
}
function figura(geo, n, mat, sombra) {
  const ia = () => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n), 1); a.setUsage(THREE.DynamicDrawUsage); return a; };
  const fr = ia(), fr2 = ia(), mx = ia(); geo.setAttribute('aFrame', fr); geo.setAttribute('aFrame2', fr2); geo.setAttribute('aMix', mx);
  const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.castShadow = m.receiveShadow = true; m.customDepthMaterial = sombra; escena.add(m);
  return { m, fr, fr2, mx };
}
/* ---------- palos hechos por código: piezas [radio atrás, radio delante, desde z, hasta z, color]; el eje va por +z ---------- */
function geoPalo(piezas, lados = 5) {
  const pos = [], nor = [], col = [], c = new THREE.Color();
  for (const [r0, r1, z0, z1, color] of piezas) {
    const g = new THREE.CylinderGeometry(r1, r0, z1 - z0, lados, 1, false).toNonIndexed(); g.rotateX(Math.PI / 2); g.translate(0, 0, (z0 + z1) / 2);
    c.set(color); pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); for (let i = 0; i < g.attributes.position.count; i++) col.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
function matPalo() { const m = new THREE.MeshLambertMaterial({ vertexColors: true }); m.onBeforeCompile = sh => cine(sh, 0.9); m.customProgramCacheKey = () => 'falange-palo'; return m; }
/* la sarisa: contera de hierro, asta de fresno (dos tramos con el manguito del medio) y la punta de hoja */
/* TP8b: asta de 6 cm (a 390 px se lee como madera, no como línea), de fresno claro en doce tramos de tono algo distinto
   (la veta), con el manguito de bronce del medio, regatón en punta atrás y la hoja de hierro plana delante */
const geoSarisa = (() => {
  const MAD = ['#a7a092', '#9f988a', '#aea799', '#a29b8d', '#999284', '#aaa395'], pz = [[0.005, 0.023, 0, 0.3, '#4c4945'], [0.034, 0.034, 0.3, 0.38, '#8c6a3a']];
  for (let i = 0; i < 12; i++) { const z0 = 0.38 + i * 5.57 / 12, r = 0.031 - 0.005 * i / 12; pz.push([r, r - 0.0004, z0, z0 + 5.57 / 12, MAD[(i * 5) % 6]]); }
  pz.push([0.035, 0.035, 3.06, 3.2, '#8c6a3a'], [0.021, 0.015, 5.95, 6.03, '#3d3b39'], [0.015, 0.052, 6.03, 6.15, '#b9b5ad'], [0.052, 0.002, 6.15, SARISA, '#d0cdc6']);
  const g = geoPalo(pz, 6), p = g.attributes.position.array;
  for (let i = 0; i < p.length; i += 3) if (p[i + 2] > 6.02) p[i + 1] *= 0.28;   /* la hoja, plana */
  return g;
})();
const geoPilum = geoPalo([[0.016, 0.016, 0, 1.2, '#b48a5a'], [0.019, 0.019, 1.2, 1.26, '#58585a'], [0.006, 0.006, 1.26, 1.95, '#505052'], [0.013, 0.001, 1.95, 2.06, '#6a6a6c']], 4);
const sarisas = new THREE.InstancedMesh(geoSarisa, matPalo(), M); sarisas.frustumCulled = false; sarisas.castShadow = false; escena.add(sarisas);
/* TP8b: la sombra larga de cada asta en el suelo, una tira oscura proyectada según el sol (todas en una llamada) */
const sombrasAsta = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#2b1d10', transparent: true, opacity: 0.36, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), M);
sombrasAsta.frustumCulled = false; sombrasAsta.renderOrder = 1; escena.add(sombrasAsta);
const SA = new THREE.Vector3(), SB = new THREE.Vector3(), O2 = new THREE.Object3D();
const alSuelo = v => { const g = H(v.x, v.z), k = Math.max(0, v.y - g) / SOL.y; v.x -= SOL.x * k; v.z -= SOL.z * k; v.y = g; return v; };
function sombraAsta(i, P, D) {
  SA.copy(P); SB.copy(P).addScaledVector(D, SARISA - 0.3); alSuelo(SA); alSuelo(SB);
  const dx = SB.x - SA.x, dz = SB.z - SA.z, l = Math.hypot(dx, dz), mx = (SA.x + SB.x) / 2, mz = (SA.z + SB.z) / 2;
  O2.position.set(mx, Math.max(SA.y, SB.y, H(mx, mz)) + 0.06, mz); O2.rotation.set(0, Math.atan2(dx, dz), 0); O2.scale.set(0.075, 1, Math.max(0.01, l)); O2.updateMatrix(); sombrasAsta.setMatrixAt(i, O2.matrix);
}
const pila = new THREE.InstancedMesh(geoPilum, matPalo(), NPILA); pila.frustumCulled = false; pila.castShadow = true; escena.add(pila);
/* tu cresta de oficial: crin roja sobre el casco, anclada al hueso del casco */
const geoCresta = (() => { const g = new THREE.CylinderGeometry(0.13, 0.13, 0.03, 12, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); return g; })();
const cresta = new THREE.Mesh(geoCresta, (() => { const m = new THREE.MeshLambertMaterial({ color: '#b8261c', side: THREE.DoubleSide }); m.onBeforeCompile = sh => cine(sh, 1.4); m.customProgramCacheKey = () => 'falange-cresta'; return m; })());
cresta.castShadow = true; cresta.matrixAutoUpdate = false; cresta.frustumCulled = false; escena.add(cresta);
/* el enemigo marcado para tu golpe: un aro en el suelo */
const aro = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.56, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ff5a3c', transparent: true, opacity: 0.75, depthWrite: false, fog: false }));
aro.visible = false; escena.add(aro);
/* TP8b: polvo a los pies del frente (la idea de a-pie): motas que nacen en el choque, en cada empujón y en cada caída; una llamada */
const NPOLVO = 160, polvoPos = new Float32Array(NPOLVO * 3), polvoVida = new Float32Array(NPOLVO), POLVO = [], ESC_P = { value: 400 };
for (let i = 0; i < NPOLVO; i++) POLVO.push({ t0: -99, dur: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
const geoPolvo = new THREE.BufferGeometry(); geoPolvo.setAttribute('position', new THREE.BufferAttribute(polvoPos, 3)); geoPolvo.setAttribute('aVida', new THREE.BufferAttribute(polvoVida, 1));
const polvo = new THREE.Points(geoPolvo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uEsc: ESC_P },
  vertexShader: 'attribute float aVida; varying float vV; uniform float uEsc; void main(){ vV = aVida; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aVida > 0.0 ? uEsc * (0.6 + 1.8 * (1.0 - aVida)) / max(0.3, -mv.z) : 0.0; }',
  fragmentShader: 'varying float vV; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; if (vV <= 0.0 || d > 1.0) discard; float a = (1.0 - d) * (1.0 - d) * min(1.0, (1.0 - vV) * 6.0) * vV * 0.55; gl_FragColor = vec4(0.80, 0.66, 0.48, a); }' }));
polvo.frustumCulled = false; polvo.renderOrder = 5; escena.add(polvo);
let iPolvo = 0;
function levantaPolvo(x, z, n = 4) { for (let k = 0; k < n; k++) { const p = POLVO[iPolvo++ % NPOLVO]; p.t0 = S.T || 0; p.dur = 1.8 + azarV() * 1.8; p.x = x + (azarV() - 0.5) * 0.9; p.z = z + (azarV() - 0.5) * 0.9; p.y = H(p.x, p.z) + 0.2 + azarV() * 0.3; p.vx = (azarV() - 0.5) * 0.8; p.vz = (azarV() - 0.5) * 0.8; p.vy = 0.25 + azarV() * 0.4; } }
function muevePolvo() {
  for (let i = 0; i < NPOLVO; i++) { const p = POLVO[i], a = S.T - p.t0, k = a / p.dur; if (a < 0 || k >= 1) { polvoVida[i] = 0; continue; } const e = 1 - Math.exp(-a * 1.1); polvoPos[i * 3] = p.x + p.vx * e; polvoPos[i * 3 + 1] = p.y + p.vy * e; polvoPos[i * 3 + 2] = p.z + p.vz * e; polvoVida[i] = 1 - k; }
  geoPolvo.attributes.position.needsUpdate = geoPolvo.attributes.aVida.needsUpdate = true;
}

/* ---------- las figuras ---------- */
let FIG_F = null, FIG_R = null, ACC = null;
const m4 = () => new THREE.Matrix4();
async function creaFigs() {
  await loadIndex();
  /* el falangita: su tabla con las posturas de la sarisa (soldado.js); sin la pica del modelo (pieza 4), que va aparte */
  const uF = getUnit('falange'), meta = (await (await fetch('assets/units/units.json')).json()).falange;
  const buf = await (await fetch('assets/units/falange.bin')).arrayBuffer(), CELL = new Uint8Array(buf, meta.off[6], meta.verts);
  const tab = generaTablaFalange(uF.bones.image.data, meta, uF.geo, E, HF);
  const tex = new THREE.DataTexture(tab.T, tab.hues * 3, tab.total, THREE.RGBAFormat, THREE.FloatType); tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const { g } = parte(uF.geo, CELL, [0, 1, 2, 3, 5, 6]);
  /* la punta del casco, para la cresta: el vértice más alto del casco en reposo */
  let cima = [0, 0, -9]; const P = uF.geo.attributes.position.array; for (let i = 0; i < CELL.length; i++) if ((CELL[i] === 5 || CELL[i] === 6) && P[i * 3 + 2] > cima[2]) cima = [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]];
  const C = uF.clips; zancadas(uF);
  const pies = datosPies(tab.T, tab.hues, uF.geo, C.idle.start), f0 = { anda: faseCero(tab.T, tab.hues, pies, C.walk), corre: faseCero(tab.T, tab.hues, pies, C.run) };
  const paso = { anda: tablaPaso(tab.T, tab.hues, pies, C.walk, C.walk.start, f0.anda, C.idle.start), corre: tablaPaso(tab.T, tab.hues, pies, C.run, C.run.start, f0.corre, C.idle.start) };
  FIG_F = { ...figura(g, M, matFigura(uF.tex, tex, '#2f5fa8', 'f'), matSombra(tex, 'f')), u: uF, C, tab, T: tab.T, hues: tab.hues, pies, paso, cima, zan: { walk: paso.anda.total * E, run: paso.corre.total * E } };
  /* los romanos: su tabla es la del modelo */
  const uR = getUnit('hastati'); zancadas(uR); const tR = { T: uR.bones.image.data, hues: uR.bones.image.width / 3 }, CR = uR.clips, piesR = datosPies(tR.T, tR.hues, uR.geo, CR.idle.start);
  const f0R = { anda: faseCero(tR.T, tR.hues, piesR, CR.walk), corre: faseCero(tR.T, tR.hues, piesR, CR.run) }, pasoR = { anda: tablaPaso(tR.T, tR.hues, piesR, CR.walk, CR.walk.start, f0R.anda, CR.idle.start), corre: tablaPaso(tR.T, tR.hues, piesR, CR.run, CR.run.start, f0R.corre, CR.idle.start) };
  const gR = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'uv', 'aSkinI', 'aSkinW', 'aMode']) gR.setAttribute(k, uR.geo.attributes[k]); gR.boundingSphere = uR.geo.boundingSphere;
  FIG_R = { ...figura(gR, N_R, matFigura(uR.tex, uR.bones, '#c23a2e', 'r'), matSombra(uR.bones, 'r')), u: uR, C: CR, tab: tR, T: tR.T, hues: tR.hues, pies: piesR, paso: pasoR, zan: { walk: pasoR.anda.total * E, run: pasoR.corre.total * E } };
  lejos(FIG_F, g, M); lejos(FIG_R, gR, N_R); console.log(`[E1] triángulos por hombre: falangita ${FIG_F.triCerca} / ${FIG_F.triLejos} sencillo; romano ${FIG_R.triCerca} / ${FIG_R.triLejos}`);
}
const hueso = (fig, slot, A, B, mx, out) => huesoT(fig.tab, slot, A, B, mx, out);
/* TP8b-E1: el mismo soldado, sencillo, para los lejanos. Se juntan los vértices que caen en la misma celda de una rejilla
   de n celdas a lo alto (en la postura de reposo) y se quitan los triángulos que se quedan sin área: la misma silueta
   (casco, escudo, pica), los mismos colores y huesos, pero sin las piezas pequeñas. Respira, anda y cae como el detallado */
function sencillo(geo, n) {
  const P = geo.attributes.position.array, V = P.length / 3, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < V; i++) for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], P[i * 3 + c]); hi[c] = Math.max(hi[c], P[i * 3 + c]); }
  const lado = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / n, W = n + 2, clave = new Int32Array(V), suma = new Map();
  for (let i = 0; i < V; i++) {
    const q = [0, 1, 2].map(c => Math.floor((P[i * 3 + c] - lo[c]) / lado)), k = q[0] + W * (q[1] + W * q[2]); clave[i] = k;
    const a = suma.get(k) || [0, 0, 0, 0]; a[0] += P[i * 3]; a[1] += P[i * 3 + 1]; a[2] += P[i * 3 + 2]; a[3]++; suma.set(k, a);
  }
  const quedan = []; for (let t = 0; t < V; t += 3) { const a = clave[t], b = clave[t + 1], c = clave[t + 2]; if (a !== b && b !== c && a !== c) quedan.push(t, t + 1, t + 2); }
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv', 'aSkinI', 'aSkinW', 'aMode']) {
    const at = geo.attributes[k], t = at.itemSize, arr = new at.array.constructor(quedan.length * t);
    quedan.forEach((v, j) => { if (k === 'position') { const a = suma.get(clave[v]); arr[j * 3] = a[0] / a[3]; arr[j * 3 + 1] = a[1] / a[3]; arr[j * 3 + 2] = a[2] / a[3]; } else for (let c = 0; c < t; c++) arr[j * t + c] = at.array[v * t + c]; });
    g.setAttribute(k, new THREE.BufferAttribute(arr, t, at.normalized));
  }
  g.boundingSphere = geo.boundingSphere ? geo.boundingSphere.clone() : new THREE.Sphere(new THREE.Vector3(0, 2, 0), 8); return g;
}
/* cuántas filas por bando van con el soldado detallado (las más cercanas a la cámara) y la rejilla del sencillo */
const CERCA = 4, REJILLA = +(Q.get('rejilla') || 14);
const lejos = (fig, geo, n) => { const L = figura(sencillo(geo, REJILLA), n, fig.m.material, fig.m.customDepthMaterial); fig.L = L; fig.triCerca = geo.attributes.position.count / 3; fig.triLejos = L.m.geometry.attributes.position.count / 3; };
/* cada hombre, al hueco libre de su malla (la detallada o la sencilla); los K más cercanos a la cámara van detallados */
function reparte(fig, L, K) {
  const cp = camara.position; L.forEach(h => { h.dCam = (h.x - cp.x) ** 2 + (h.z - cp.z) ** 2; }); const orden = L.slice().sort((a, b) => a.dCam - b.dCam);
  fig.n = 0; fig.L.n = 0;
  orden.forEach((h, j) => { const o = j < K ? fig : fig.L, i = o.n++; o.m.setMatrixAt(i, h.inst); o.fr.array[i] = h.A; o.fr2.array[i] = h.B; o.mx.array[i] = h.mx; });
  for (const o of [fig, fig.L]) { o.m.count = o.n; o.m.instanceMatrix.needsUpdate = true; o.fr.needsUpdate = o.fr2.needsUpdate = o.mx.needsUpdate = true; }
}

/* ---------- estado ---------- */
const S = {};
function cinta(texto, buena) { const c = $('cinta'); c.textContent = texto; c.classList.add('ve'); c.classList.toggle('buena', !!buena); S.tCinta = S.T || 0.001; }
function grita(t) { const g = $('grito'); g.textContent = t; g.classList.add('ve'); S.tGrito = S.T || 0.001; }
let HUD = null;
function avisa(tipo, d) {
  if (tipo === 'cinta') cinta(d.texto, d.buena);
  if (tipo === 'grito') grita(d.texto);
  if (tipo === 'salva') { Son.salva(1.4); }
  if (tipo === 'carga') { grita('¡Cargan!'); Son.cuerno([[98, 0.6], [130.8, 1.0]]); }
  if (tipo === 'choque') { S.temblor = 1; Son.choque(); grita('¡Choque!'); }
  if (tipo === 'clava' || tipo === 'escudo') Son.madera(0.6, 0, 0);
  if (tipo === 'tierra') Son.tierra(0);
  if (tipo === 'hierro') Son.hierro(0, 0, 1);
  if (tipo === 'madera') Son.madera(0.4, 0, 0);
  if (tipo === 'cae' && d.quien === 'f' && d.h.r <= 1) S.temblor = Math.max(S.temblor, 0.35);
  if (tipo === 'rompe') { cinta(d.ganador === 'falange' ? '¡El manípulo rompe! Huyen' : '¡Tu falange rompe!', d.ganador === 'falange'); Son.cuerno(); }
  if (tipo === 'fin' && HUD) HUD.muestraFin();
  /* TP8b-P2: el tambor del compás, la estocada a una, el golpe a destiempo, el coro del empuje y el flanco */
  if (tipo === 'pulso' && !parado) Son.paso(1.1);
  if (tipo === 'estocada') { Son.clac(8); Son.hierro(0, 0, 1.3); S.temblor = Math.max(S.temblor, 0.5); grita('—¡Ha!'); for (const h of S.rom) if (h.vivo && h.r === 0) levantaPolvo(h.x, h.z + 0.2, 3); }
  if (tipo === 'destiempo') Son.clac(4);
  if (tipo === 'coro') { grita('—¡Ea! ¡A una!'); Son.paso(1.5); Son.trueno(0.25); }
  if (tipo === 'flanco') { grita(d.texto); Son.cuerno([[123, 0.35], [123, 0.35], [164.8, 0.8]]); }
  if (tipo === 'flancoEntra') { S.temblor = 1; Son.choque(); }
  if (tipo === 'dentro') Son.crac();
  /* TP8b: la ola de sarisas (golpes de madera fila a fila) y la respuesta de la tropa un momento después */
  if (tipo === 'ola') { Son.clac(12); S.resp = { t: S.T + 0.8, texto: d.abajo ? '—¡Abajo! ¡Ha!' : '—¡Arriba!' }; }
  if (tipo === 'choque') for (const h of S.rom) if (h.vivo && h.r === 0) levantaPolvo(h.x, h.z + 0.3, 4);
  if (tipo === 'madera' && d.h) levantaPolvo(d.h.x, d.h.z, 3);
  /* el romano que cae se queda delante del muro, bajo las puntas, amontonado con los de su columna */
  if (tipo === 'cae' && d.quien === 'r') { const k = S.rom.filter(o => !o.vivo && o.c === d.h.c && o !== d.h).length; d.h.cz = 0.45 + 0.62 * k; d.h.cx = (azarV() - 0.5) * 0.5; d.h.cy = (azarV() - 0.5) * 1.4; levantaPolvo(d.h.x, d.h.z + 0.5, 5); }
}
function reinicia() { semilla = 43; semillaP = 5; ACC.reinicia(); $('fin').hidden = true; }

/* ---------- cámara ---------- */
let CAMARA = null;

/* ---------- dibujo ---------- */
const O = new THREE.Object3D(), MA = m4(), MB = m4(), V3 = new THREE.Vector3(), V4 = new THREE.Vector3(), Q1 = new THREE.Quaternion(), Z1 = new THREE.Vector3(0, 0, 1), UNO = new THREE.Vector3(1, 1, 1);
/* las filas de la tabla de un falangita: su paso (quieto o andando) y, encima, cuánto ha bajado la sarisa (tres conjuntos
   seguidos: se mezclan dos de ellos) o la estocada */
function filasFal(h, T) {
  const F = FIG_F, C = F.C;
  if (!h.vivo) { h.A = h.B = frameOnce(C.death, Math.max(0, T - h.muere)); h.mx = 0; return; }
  let [A, B, mx] = filasMarcha(F, h.paso, T + h.fase, frameOf);
  const c0 = h.r === 0 ? CJF.baja : CJF.alta, k = h.huye ? 0 : h.kB, fila = F.tab.fila;
  if (k <= 0.002) { h.A = A; h.B = B; h.mx = mx; return; }
  if (k >= 0.998 && h.kG <= 0.002) { h.A = fila(c0 + 2, A); h.B = fila(c0 + 2, B); h.mx = mx; return; }
  const b = mx < 0.5 ? A : B;
  if (k >= 0.998) { h.A = fila(c0 + 2, b); h.B = fila(CJF.golpe, b); h.mx = h.kG; return; }
  const q = k * 3, i = Math.min(2, Math.floor(q)), f = q - i;
  h.A = i === 0 ? b : fila(c0 + i - 1, b); h.B = fila(c0 + i, b); h.mx = f;
}
const instDe = (h, fig, pitch = 0, dx = 0, dz = 0, dyaw = 0) => { O.position.set(h.x + dx, H(h.x + dx, h.z + dz), h.z + dz); O.rotation.set(pitch, h.yaw + dyaw, 0, 'YXZ'); O.scale.setScalar(E * (h.esc || 1)); O.updateMatrix(); return O.matrix; };
/* dónde está un punto de un hueso en el mundo (p en coordenadas del modelo en reposo) */
const ancla = (h, fig, slot, p, out) => out.set(p[0], p[1], p[2]).applyMatrix4(MA.multiplyMatrices(h.inst, hueso(fig, slot, h.A, h.B, h.mx, MB)));
/* la dirección de una sarisa: alzada (casi derecha, inclinada hacia delante y en abanico) o bajada (al frente), con su vaivén */
const DIR = new THREE.Vector3(), DA = new THREE.Vector3(), DB = new THREE.Vector3();
function dirSarisa(h, T, out) {
  const va = h.va, al = alzada(h.f, h.r, h.kA), anda = h.paso.g > 0.3 ? 0.025 * Math.sin(h.paso.ciclos * 4 * Math.PI) : 0;
  const del = al.delante + 0.05 * Math.sin(va.w * T + va.fi) + anda, lado = al.lado + 0.035 * Math.sin(va.w2 * T + va.fi2);
  DA.set(Math.sin(lado), Math.cos(del), -Math.sin(del)).normalize();
  const pb = bajada(h.r) + 0.005 * Math.sin(va.w * T * 1.3 + va.fi), yb = 0.006 * Math.sin(va.w2 * T + va.fi2);
  DB.set(Math.sin(yb), Math.sin(pb), -Math.cos(pb)).normalize();
  return out.copy(DA).lerp(DB, suave(0, 1, h.kB)).normalize();
}
const PS = new THREE.Vector3();
function poseSarisa(h, T, P, D) {
  if (!h.vivo || h.huye) {
    /* el caído (o el que huye) suelta la sarisa: queda en el suelo */
    const a = h.i * 2.3; D.set(Math.sin(a) * 0.4, 0, -1).normalize(); P.set(h.x + 0.3, H(h.x, h.z) + 0.03, h.z + (h.huye ? -0.5 : 0.8)); return;
  }
  ancla(h, FIG_F, HF.manoD, FIG_F.tab.esq.J.munecaD, PS); dirSarisa(h, T, D);
  P.copy(PS).addScaledVector(D, -AGARRE + 0.35 * h.kG);
  /* TP8b: bajada, cada sarisa va por su carril (CARRIL de formacion.js): así no se cruzan */
  const s = h.r < BAJAN ? suave(0, 1, h.kB) : 0;
  /* las alzadas de detrás van algo a la izquierda de su mano: así no tocan la contera de las bajadas */
  if (h.r >= BAJAN) P.x -= 0.16 * suave(0, 1, h.kA);
  /* TP8b-P2: a media ola las filas 4.ª y 5.ª bajan por fuera (a la derecha) para no rozar las alzadas de detrás */
  if (h.r >= 3 && h.r < BAJAN) P.x += 0.16 * Math.sin(Math.PI * Math.min(1, Math.max(0, h.kB)));
  if (s > 0) { const c = CARRIL(h.r); PL.set(h.x + c.x, H(h.x, h.z) + c.y, PS.z).addScaledVector(D, -AGARRE + 0.35 * h.kG); P.lerp(PL, s); }
}
const PL = new THREE.Vector3();
/* medida para captura.mjs: la distancia mínima entre los ejes de dos sarisas cualesquiera (m); debe pasar del grosor */
function distSeg(p1, q1, p2, q2) {
  const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2), a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b, cl = v => Math.min(1, Math.max(0, v));
  let s = den > 1e-9 ? cl((b * f - c * e) / den) : 0, t = (b * s + f) / e;
  if (t < 0) { t = 0; s = cl(-c / a); } else if (t > 1) { t = 1; s = cl((b - c) / a); }
  return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, t));
}
function astasMin() {
  const L = S.fal.filter(h => h.vivo && !h.huye).map(h => { const P = new THREE.Vector3(), D = new THREE.Vector3(); poseSarisa(h, S.T, P, D); return [P, P.clone().addScaledVector(D, SARISA), h]; });
  let min = 99, par = '';
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const d = distSeg(L[i][0], L[i][1], L[j][0], L[j][1]); if (d < min) { min = d; par = `col ${L[i][2].f} fila ${L[i][2].r} y col ${L[j][2].f} fila ${L[j][2].r}`; } }
  return { min: +min.toFixed(3), par, grosor: 0.062 };
}
const MS = m4(), PP = new THREE.Vector3(), DD = new THREE.Vector3(), VF = new THREE.Vector3(), VG = new THREE.Vector3();
/* TP8b-E1: un asta que pasa a menos de 1,5 m de la cámara se adelgaza hasta desaparecer (antes cruzaba la vista como un poste) */
function finaCerca(P, D) {
  const t = Math.min(SARISA, Math.max(0, VF.copy(camara.position).sub(P).dot(D))), d = VG.copy(P).addScaledVector(D, t).distanceTo(camara.position);
  const k = suave(0.9, 1.5, d); return VF.set(k, k, k > 0 ? 1 : 0);
}
function dibuja(dt) {
  const T = S.T, F = FIG_F, R = FIG_R;
  for (const h of S.fal) {
    filasFal(h, T); const sB = h.vivo && !h.huye ? suave(0, 1, h.kB) : 0, ola = h.vivo && !h.huye ? Math.sin(Math.PI * Math.min(1, Math.max(0, h.kB))) : 0; h.inst = (h.inst || m4()).copy(instDe(h, F, 0.05 * sB + 0.07 * ola, 0, -0.12 * sB, 0.1 * sB + 0.08 * ola));
    poseSarisa(h, T, PP, DD); Q1.setFromUnitVectors(Z1, DD); sarisas.setMatrixAt(h.i, MS.compose(PP, Q1, finaCerca(PP, DD))); sombraAsta(h.i, PP, DD);
    /* el golpe sordo de cada asta al llegar abajo (o arriba): la ola se oye fila a fila */
    if (h.vivo && !h.huye && h.r < BAJAN) { if (h.sonB === undefined) h.sonB = h.kB > 0.5 ? 1 : 0; if (h.kB > 0.93 && !h.sonB) { h.sonB = 1; if (!parado) Son.madera(0.16, (h.f - (FILES - 1) / 2) / (FILES / 2), 0); } if (h.kB < 0.07 && h.sonB) { h.sonB = 0; if (!parado) Son.madera(0.1, (h.f - (FILES - 1) / 2) / (FILES / 2), 0); } }
  }
  for (const h of S.rom) {
    filasRomano(h, R, T, frameOf, frameOnce); const mu = !h.vivo && h.cz !== undefined; h.inst = (h.inst || m4()).copy(mu ? instDe(h, R, 0, h.cx, Math.min(h.cz, S.zF - 1.1 - h.z), h.cy) : instDe(h, R, h.pitch));
  }
  reparte(F, S.fal, CERCA * FILES); reparte(R, S.rom, CERCA * FILES);
  sarisas.instanceMatrix.needsUpdate = true; sombrasAsta.instanceMatrix.needsUpdate = true;
  if (S.resp && S.T >= S.resp.t) { grita(S.resp.texto); Son.trueno(0.35); S.resp = null; }
  muevePolvo(); ESC_P.value = renderer.domElement.height / 2 / Math.tan(camara.fov * Math.PI / 360);
  /* los pila: en el aire, clavados en un asta (la siguen), en un escudo, en un hombre o en el suelo */
  S.PILA.forEach((P, i) => {
    if (!P.est || (P.est === 1 && T < P.t0)) { pila.setMatrixAt(i, MS.makeScale(0, 0, 0)); return; }
    DD.fromArray(P.dir).normalize();
    if (P.est === 1 || P.est === 5) PP.fromArray(P.p).addScaledVector(DD, -1.6);
    if (P.est === 2) { poseSarisa(P.h, T, PP, V4); PP.addScaledVector(V4, P.s); DD.applyAxisAngle(V4, P.giro); PP.addScaledVector(DD, -1.75); }
    if (P.est === 3 || P.est === 4) { ancla(P.h, F, P.est === 3 ? HF.escudo : HF.pecho, P.est === 3 ? [0.75, 0.3, 2.6] : [0, 0.3, 3.0], PP); PP.addScaledVector(DD, -1.75); }
    Q1.setFromUnitVectors(Z1, DD); pila.setMatrixAt(i, MS.compose(PP, Q1, UNO));
  });
  pila.instanceMatrix.needsUpdate = true;
  /* tu cresta: en el casco del oficial (si cae, se queda con él) */
  const of = S.fal[YO]; ancla(of, F, HF.casco, F.cima, PP); Q1.setFromRotationMatrix(MA.extractRotation(MA.multiplyMatrices(of.inst, hueso(F, HF.casco, of.A, of.B, of.mx, MB))));
  cresta.matrix.compose(PP, Q1.multiply(QC), UNO); cresta.matrixWorldNeedsUpdate = true;
  const r = ACC.marcado(); aro.visible = !!r; if (r) aro.position.set(r.x, H(r.x, r.z) + 0.04, r.z);
  /* la cámara, con su temblor en el choque */
  const C = CAMARA.camBase(dt), tb = S.temblor * 0.03;
  camara.position.set(C.x + Math.sin(T * 41) * tb, C.y + Math.sin(T * 37 + 1) * tb, C.z); camara.rotation.set(C.pitch, C.yaw, 0); if (camara.fov !== C.fov) { camara.fov = C.fov; camara.updateProjectionMatrix(); }
  /* la sombra va con la formación: el sol bajo de frente las estira hacia la cámara */
  const yo = S.fal[S.yo]; luz.target.position.set(0, H(0, S.zF), S.zF - 2); luz.position.copy(luz.target.position).addScaledVector(SOL, 40); luz.target.updateMatrixWorld();
  renderer.render(escena, camara);
}
/* la cresta va de canto, a lo largo del casco (en coordenadas del modelo, z arriba) */
const QC = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);

/* ---------- fases para las capturas: colocan la escena y la congelan ---------- */
let parado = false;
const salta = (s, bot = true) => { for (let t = 0; t < s; t += 1 / 30) { if (bot) ACC.bot(); ACC.paso(1 / 30); } };
const hasta = (cond, max = 200) => { for (let i = 0; i < max * 10 && !cond(); i++) salta(0.1); };
function prepara(f) {
  if (f === 'marcha' || f === 'astas') { ACC.orden('avanzar'); salta(4, false); if (f === 'astas') S.mirarArriba = true; }
  if (f === 'bajar') { ACC.orden('avanzar'); salta(3, false); ACC.orden('picas'); salta(+(Q.get('t') || 0.6), false); }
  if (f === 'pila') { hasta(() => S.salva && S.T - S.tSalva > 1.0); }
  if (f === 'choque') { hasta(() => S.choque); salta(0.9); }
  if (f === 'golpe') { hasta(() => S.choque && S.T - S.tChoque > 3 && !!ACC.marcado()); S.tGolpe = -9; ACC.golpe(); salta(0.2, false); }
  if (f === 'huida') { hasta(() => !!S.ganador); salta(1.6); }
  if (f === 'final') { hasta(() => S.fase === 'fin'); salta(0.3); }
  if (f === 'muro') { hasta(() => S.fase === 'carga' && S.T - S.tCarga > 1.4); }
  if (f === 'caidos') { hasta(() => S.choque); salta(9); }
  /* TP8b-P2: el compás, a destiempo, el colado, el flanco y el empuje */
  const libre = () => S.choque && S.T - S.tChoque > 6 && !S.colado && !S.flanco && S.orden !== 'aguantar';
  if (f === 'compas') { hasta(() => libre() && ACC.fasePulso() > 1.5); S.pulsoUsado = -99; salta(1.6 - ACC.fasePulso() - 0.03, false); S.tGolpe = -9; ACC.golpe(); salta(0.12, false); }
  if (f === 'destiempo') { hasta(() => libre() && ACC.fasePulso() > 0.6 && ACC.fasePulso() < 0.7); S.orden = null; S.tGolpe = -9; ACC.golpe(); salta(0.3, false); }
  if (f === 'colado') { hasta(libre); ACC.abreHueco(); salta(1.4, false); }
  if (f === 'flanco') { hasta(() => S.flanco && S.T - S.flanco.t0 > 2.2); }
  if (f === 'empuje') { hasta(() => S.orden === 'empujar' && S.ganado > 2.5); }
  parado = true;
}

/* ---------- medidas para captura.mjs ---------- */
const _pv = new THREE.Vector3();
function piesMundo(h, fig) { const w = pie => _pv.fromArray(pieEn(fig.T, fig.hues, pie, h.A, h.B, h.mx)).applyMatrix4(h.inst).toArray(); return [w(fig.pies.I), w(fig.pies.D)]; }
/* patinaje: mientras un pie es el más bajo (apoyado), cuánto se desliza; media por apoyo (cm). Como en TP1 */
function patinaje(quien, modo, seg = 4, calen0 = 45) {
  reinicia(); parado = true; const rom = quien === 'r', L = rom ? S.rom : S.fal, fig = rom ? FIG_R : FIG_F;
  if (!rom) { if (modo === 'bajas') { S.picas = true; salta(2.5, false); } ACC.orden('avanzar'); }
  const ri = fig.C.idle.start, h0 = pieEn(fig.T, fig.hues, fig.pies.I, ri, ri, 0)[1] * E;
  const est = L.map(() => ({ lado: null, prev: null, acc: 0, n: 0, veces: 0, x0: 0, z0: 0 })), apoyos = [], disp = [], calen = calen0, N = Math.round(seg * 30) + calen;
  for (let k = 0; k < N; k++) {
    ACC.paso(1 / 30); for (const h of L) { if (rom) filasRomano(h, fig, S.T, frameOf, frameOnce); else filasFal(h, S.T); h.inst = (h.inst || m4()).copy(instDe(h, fig, rom ? h.pitch : 0)); }
    if (k < calen) continue;
    L.forEach((m, j) => {
      if (!m.vivo) return; const [pI, pD] = piesMundo(m, fig), yI = pI[1] - H(pI[0], pI[2]), yD = pD[1] - H(pD[0], pD[2]), lado = Math.min(yI, yD) < h0 + 0.05 ? (yI < yD ? 'I' : 'D') : null, p = lado === 'I' ? pI : pD, e = est[j];
      if (lado && e.lado === lado && e.prev) { e.acc += Math.hypot(p[0] - e.prev[0], p[2] - e.prev[2]); e.n++; }
      else { if (e.lado && e.n >= 3 && e.veces > 1 && Math.hypot(m.x - e.x0, m.z - e.z0) >= 0.1) apoyos.push(e.acc); e.veces++; e.acc = 0; e.n = 0; e.x0 = m.x; e.z0 = m.z; }
      e.lado = lado; e.prev = p;
    });
    if (k % 15 === 0) disp.push(dispersion(L.filter(m => m.vivo).map(m => m.paso.fase)));
  }
  apoyos.sort((a, b) => a - b); const media = apoyos.reduce((a, b) => a + b, 0) / Math.max(1, apoyos.length);
  return { apoyos: apoyos.length, media: +(media * 100).toFixed(1), peor: +((apoyos[apoyos.length - 1] || 0) * 100).toFixed(1), dispersion: disp.length ? +(disp.reduce((a, b) => a + b, 0) / disp.length).toFixed(2) : 0 };
}
/* las astas no van a la vez: dispersión de la fase del vaivén de cada una (0 todas a la vez, 1 repartidas) y cuánto se
   separan de verdad sus direcciones en un instante (grados, desviación media respecto a la media de su fila) */
function astas() {
  const T = S.T, fases = S.fal.filter(h => h.vivo).map(h => ((h.va.w * T + h.va.fi) / (2 * Math.PI)) % 1), d = new THREE.Vector3(), porFila = new Map();
  for (const h of S.fal) if (h.vivo) { dirSarisa(h, T, d); if (!porFila.has(h.r)) porFila.set(h.r, []); porFila.get(h.r).push(d.clone()); }
  let suma = 0, n = 0; for (const l of porFila.values()) { const m = l.reduce((a, v) => a.add(v), new THREE.Vector3()).normalize(); for (const v of l) { suma += v.angleTo(m); n++; } }
  return { dispersion: dispersion(fases), separacion: +(suma / Math.max(1, n) * 180 / Math.PI).toFixed(2) };
}
/* la partida entera con el «bot» (y sin hacer nada), sin dibujar */
function partida(conBot) { reinicia(); parado = true; let k = 0; for (; k < 30 * 240 && S.fase !== 'fin'; k++) { if (conBot) ACC.bot(conBot === true ? 'bien' : conBot); ACC.paso(1 / 30); } return { fin: S.fase === 'fin', ganador: S.ganador, tRoto: +S.tRoto.toFixed(1), ganado: +S.ganado.toFixed(1), coh: Math.round(S.coh), porRuptura: S.ganador === 'falange' ? S.R.roto : S.U.roto, segundos: +S.T.toFixed(1), bajasF: M - S.U.enPie, bajasR: N_R - S.R.enPie, golpes: S.golpes, pila: S.PILA.map(p => p.est) }; }

/* ---------- arranque ---------- */
let ultimo = 0, CAMPO = null;
function bucle(t) {
  if (CAMPO) CAMPO.tick(t / 1000);
  const dt = Math.min(0.05, (t - ultimo) / 1000 || 0); ultimo = t;
  if (!parado) ACC.paso(dt);
  dibuja(parado ? 0 : dt); HUD.hud(); requestAnimationFrame(bucle);
}
const enPantalla = v => { v.project(camara); return { x: +((v.x + 1) / 2).toFixed(3), y: +((1 - v.y) / 2).toFixed(3), delante: v.z < 1 }; };
lienzo.addEventListener('pointerdown', e => {
  /* tocar al enemigo marcado es dar el golpe */
  const r = ACC && ACC.marcado(); if (!r) return; const p = enPantalla(new THREE.Vector3(r.x, H(r.x, r.z) + 1.1, r.z));
  if (Math.hypot((p.x - e.clientX / innerWidth) * innerWidth, (p.y - e.clientY / innerHeight) * innerHeight) < 90) ACC.golpe();
});
window.__tp = {
  lista: false, S, renderer, escena, camara, salta: (s, b) => salta(s, b), parar: v => { parado = v; }, orden: n => ACC.orden(n), golpe: () => ACC.golpe(),
  patinaje: (q, m, s, c) => patinaje(q, m, s, c), astas: () => astas(), astasMin: () => astasMin(), partida: b => partida(b),
  estado: () => ({ T: +S.T.toFixed(2), fase: S.fase, choque: S.choque, picas: S.picas, kFrente: +S.kFrente.toFixed(2), orden: S.orden, ganador: S.ganador, yo: S.yo, coh: Math.round(S.coh), ganado: +S.ganado.toFixed(1), objetivo: $('objetivo').textContent, nos: S.U.palabras(), ellos: S.R.palabras(), pila: S.PILA.map(p => p.est), cinta: $('cinta').textContent, kB: S.fal.map(h => +h.kB.toFixed(2)) }),
  enPantalla: () => { const yo = S.fal[S.yo], r = ACC.marcado(); return { yo: enPantalla(new THREE.Vector3(yo.x, H(yo.x, yo.z) + 1.6, yo.z)), enemigo: r ? enPantalla(new THREE.Vector3(r.x, H(r.x, r.z) + 1.1, r.z)) : null }; },
};
(async () => {
  await preload(['falange', 'hastati']);
  if (!getUnit('falange') || !getUnit('hastati')) { $('carga').querySelector('p').textContent = 'No se han podido cargar los soldados'; throw new Error('No se han podido cargar los soldados'); }
  CAMPO = await crearCampo(escena, { H, SOL, cine, sueloCine, BRUMA: escena.fog.color });
  await creaFigs();
  ACC = crearAcciones({ S, H, azar, azarP, zanF: FIG_F.zan, zanR: FIG_R.zan, avisa });
  CAMARA = crearCamara({ Q, S, H, suave, lerp, DX, marcado: () => ACC.marcado(), get vertical() { return vertical; } });
  HUD = crearHud({ S, Son, $, orden: n => ACC.orden(n), golpe: () => ACC.golpe(), acc: ACC });
  reinicia();
  if (FASE) prepara(FASE);
  $('carga').hidden = true;
  requestAnimationFrame(t => { ultimo = t; bucle(t); });
  setTimeout(() => { window.__tp.lista = true; }, 400);
})();
