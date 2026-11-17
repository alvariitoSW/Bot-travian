/* Maqueta GM43c «Testudo a pie»: un manípulo de hastati cruza el campo bajo los venablos, visto a pie y, con los escudos
   arriba, desde dentro del testudo. Idea de cámara tomada de Ryse: Son of Rome (solo la idea; nada de su arte ni de su código).
   Soldados y escudos: arte de 0 A.D. (Wildfire Games, CC BY-SA 3.0). El escudo de cada hombre es el suyo de verdad: se
   separa de la figura y se coloca en el muro o en el techo; el brazo llega hasta el asa (ver esqueleto.js).
   Venablos, pila, suelo y hierba se hacen aquí por código. No toca nada de js/: solo lo importa.
   Licencia de juego ya aprobada: el testudo en campo abierto.
   ?fase=avance|flechas|testudo|cara|mira|roto|pila|carga|final coloca la escena en ese momento y la congela (para las capturas).
   ?marcas=1 pinta puntos donde las cuentas dicen que están cabeza y manos (para comprobar que casan con el dibujo). */
import { THREE } from '../../../js/gfx/models.js';
import { preload, getUnit, loadIndex, unitMaterialReal, instancedGeometry, frameOf, frameOnce, UNIT_SCALE } from '../../../js/gfx/units.js';
import { texturaRuido } from '../../../js/gfx/ground.js';
import { crearCampo } from './campo.js';
import { crearEsqueleto, H as HU } from './esqueleto.js';
import * as Son from './sonido.js';

const Q = new URLSearchParams(location.search), FASE = Q.get('fase'), MARCAS = Q.get('marcas');
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

/* ---------- números de la maqueta ----------
   OJO A LA ESCALA: las figuras de 0 A.D. miden 2,15 «metros» con UNIT_SCALE (se eligió para verlas de lejos en el mapa de
   batalla), no 1,70. Todo lo de aquí (techo, muro, cámara, venablos) va en esa escala y se coloca desde los huesos de cada
   hombre, no a ojo. Ese era el desfase de la versión anterior: techo y cámara estaban puestos para hombres de 1,70. */
const FILES = 6, FILAS = 5, M = FILES * FILAS, E = UNIT_SCALE, GRANDE = 1.26;
const Z_TIRADORES = -100, Z_GALOS = -106, Z_PILA = -75, Z_CHOQUE = -104.2;
const V_CORRE = 5, V_PASO = 1.8, V_TESTUDO = 0.9, V_CARGA = 5.5, VUELO = 2.2, CADA = 8;
const ABIERTO = { dx: 0.95, dz: 2.6 }, CERRADO = { dx: 0.68, dz: 0.7 };
const YO = 2, CMP = 3;   /* tú eres el tercero de la primera fila; tu compañero, el cuarto. La cámara va detrás, entre los dos */
/* el escudo (medidas del modelo, en sus unidades): 1,58 de ancho, 2,98 de alto, curvo con radio 1,05 */
const R_ESC = 1.05, ySup = lx => R_ESC - Math.sqrt(Math.max(0.01, R_ESC * R_ESC - lx * lx));
/* dónde va el centro de cada escudo respecto a su hombre (metros): muro delante, techo sobre la cabeza y algo adelantado,
   con el canto de delante un poco más alto (así el escudo de atrás monta sobre el de delante, como las tejas) */
const MURO_Y = 0.87, MURO_Z = 0.42, TECHO_Y = 2.06, TECHO_Z = 0.2, TECHO_SUBE = 0.05, ALERO = 0.5;
/* el techo va corrido media fila hacia la izquierda, como los ladrillos: la junta de dos escudos del techo cae sobre un
   hombre del muro, y el lomo (lo más alto) sobre el hueco entre dos hombres, que es por donde se mira */
const CORRE = CERRADO.dx / 2;
const VIDA_ESCUDO = 4;

/* el terreno: llano con algo de ondulación y una loma al fondo */
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
Object.assign(luz.shadow.camera, { left: -8, right: 8, top: 4.5, bottom: -4.5, near: 5, far: 90 }); luz.shadow.camera.updateProjectionMatrix();
/* luz de relleno desde detrás de la cámara (el cielo que rebota): sin ella las espaldas, a contraluz, quedarían negras */
const relleno = new THREE.DirectionalLight(0x9fb2cf, 0.55); relleno.position.set(-0.4, 0.6, 1); escena.add(relleno);
/* luz cálida bajo el testudo: el techo y el escudo de delante se ven de madera, no negros */
const dentro = new THREE.PointLight(0xf0c8a0, 0, 5, 1.1); escena.add(dentro);
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
/* luz que entra por la rendija, de frente: perfila la cara y el hombro de los de la primera fila */
const rendija = new THREE.PointLight(0xffd9a8, 0, 4.5, 1.4); escena.add(rendija);
const LUZ = { value: 1 }, DANIO = { value: null };

/* ---------- lienzos pintados por código ---------- */
/* grano de película: ruido pintado una vez, puesto de fondo en una capa fija (el CSS lo mueve a saltos) */
{ const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), im = g.createImageData(128, 128);
  for (let i = 0; i < im.data.length; i += 4) { const v = azarV() < 0.5 ? 0 : 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = azarV() * 255; }
  g.putImageData(im, 0, 0); $('grano').style.backgroundImage = 'url(' + c.toDataURL() + ')'; }
function lienzoTex(w, h, pinta, repetir) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
/* hierba: base clara (el color lo pone el vértice) con trazos */
/* GM43e: el suelo y la hierba son los de campo.js (B) */
const sprite = (pinta) => lienzoTex(64, 64, pinta);
const texLlama = sprite((g) => { const r = g.createRadialGradient(32, 36, 2, 32, 32, 30); r.addColorStop(0, 'rgba(255,250,210,1)'); r.addColorStop(0.3, 'rgba(255,170,40,.9)'); r.addColorStop(1, 'rgba(200,40,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const texChispa = sprite((g) => { g.translate(32, 32); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); const l = i % 2 ? 14 : 28; const r = g.createLinearGradient(0, 0, l, 0); r.addColorStop(0, 'rgba(255,255,220,1)'); r.addColorStop(1, 'rgba(255,190,60,0)'); g.fillStyle = r; g.fillRect(0, -1.5, l, 3); } });
const texPolvo = sprite((g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, 'rgba(178,142,100,.75)'); r.addColorStop(1, 'rgba(155,122,85,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });

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

/* ---------- astiles hechos por código: piezas [radio atrás, radio delante, largo, centro en z, color]; el eje va por +z y la punta delante ---------- */
function geoAsta(piezas) {
  const pos = [], nor = [], col = [];
  for (const [r0, r1, l, zc, c] of piezas) {
    const g = new THREE.CylinderGeometry(r1, r0, l, 6, 1).toNonIndexed(); g.rotateX(Math.PI / 2); g.translate(0, 0, zc);
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array); const cc = new THREE.Color(c);
    for (let i = 0; i < g.attributes.position.count; i++) col.push(cc.r, cc.g, cc.b);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.scale(1.1, 1.1, GRANDE); return g;
}

/* ---------- GM43e · lo de C «Hombres y hierro» dentro de la luz de A ----------
   detalle.png (de C): cuatro mapas de gris en una textura de 512. R trama de lino (Poly Haven «Rough Linen», CC0) ·
   G veta de madera (Poly Haven «Fine Grained Wood», CC0) · B manchas (de Poly Haven «Rusty Metal 02», CC0) · A arañazos (código).
   El color de cada hombre y el detalle van antes de la luz; el brillo del metal sale del sol de A ya sombreado (solVis),
   así bajo el techo solo brilla donde entra el sol. El borde de luz es el de A: aquí no se suma otro. */
const DET = { value: null };
const GL_COMUN = `uniform sampler2D tDet;
#define SL(c) pow(c, vec3(2.2))   /* los colores de aquí van escritos en sRGB, como en un programa de dibujo */
float lumi(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 relieve(vec3 n, float h, float s) {
  vec3 p = -vViewPosition, sx = dFdx(p), sy = dFdy(p); vec2 d = vec2(dFdx(h), dFdy(h)) * s * 0.0025;   /* s en «mm» aprox.: la altura del relieve va en metros */
  vec3 r1 = cross(sy, n), r2 = cross(n, sx); float det = dot(sx, r1);
  vec3 g = sign(det) * (d.x * r1 + d.y * r2); return normalize(abs(det) * n - g);
}
vec3 entorno(vec3 r) {
  vec3 cielo = mix(vec3(1.0, 0.93, 0.78), vec3(0.58, 0.68, 0.82), smoothstep(0.05, 0.8, r.y));
  vec3 suelo = mix(vec3(0.20, 0.19, 0.11), vec3(0.62, 0.58, 0.44), smoothstep(-0.45, 0.0, r.y));
  return r.y > 0.0 ? cielo : suelo;
}
`;
const GL_BRILLO = `{
  vec3 Vv = normalize(vViewPosition); float ndv = clamp(dot(normal, Vv), 0.0, 1.0);
  vec3 rw = inverseTransformDirection(reflect(-Vv, normal), viewMatrix), ent = entorno(rw);
  float nl = clamp(dot(normal, solDir), 0.0, 1.0), nh = clamp(dot(normal, normalize(solDir + Vv)), 0.0, 1.0);
  float esp = pow(nh, mix(10.0, 60.0, brillo)) * nl, fres = pow(1.0 - ndv, 4.0);
  outgoingLight += metal * colMetal * (ent * (0.3 + 0.4 * fres) * uAmb * uLuz * 0.5 + solVis * esp * mix(0.45, 1.5, brillo));
  outgoingLight += (1.0 - metal) * solVis * esp * brillo * 0.08;
}`;
/* engancha lo de C a un sombreador que ya pasó por cine() */
function hierro(sh) {
  sh.uniforms.tDet = DET;
  sh.fragmentShader = sh.fragmentShader.replace('#include <shadowmap_pars_fragment>', GL_COMUN + '\n#include <shadowmap_pars_fragment>')
    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n if (sDet > 0.0) normal = relieve(normal, hDet, sDet);')
    .replace('#include <envmap_fragment>', GL_BRILLO);
}
/* el astil: madera con veta y el hierro con brillo; se distingue por el color del vértice */
function matAstil(propio) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  m.onBeforeCompile = sh => {
    cine(sh, propio ? 0.7 : 0.9, propio ? AMB : undefined); sh.uniforms.uLuz = propio ? LUZ : { value: 1 };
    sh.vertexShader = 'varying vec3 vLoc;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLoc = position;');
    sh.fragmentShader = 'uniform float uLuz;\nvarying vec3 vLoc;\n' + sh.fragmentShader.replace('#include <color_fragment>', `float metal = 0.0, brillo = 0.1, borde = 0.2, hDet = 0.5, sDet = 0.0; vec3 colMetal = vec3(0.0);
  vec3 c = vColor, cs = pow(c, vec3(0.4545)); float sat = max(cs.r, max(cs.g, cs.b)) - min(cs.r, min(cs.g, cs.b));
  float ang = atan(vLoc.y, vLoc.x) * 0.16; vec2 gz = vec2(0.0, dFdx(vLoc.z)), hz = vec2(0.0, dFdy(vLoc.z));
  borde = 0.04; if (sat > 0.1 && cs.r > 0.6) { float v = textureGrad(tDet, vec2(ang, vLoc.z * 0.22), gz * 0.22, hz * 0.22).g; c *= SL(vec3(0.92, 0.86, 0.8)) * (0.55 + 0.5 * v); hDet = v; sDet = 0.4; brillo = 0.2; }
  else if (sat < 0.06) { metal = 1.0; colMetal = c * 1.25 + 0.1; brillo = 0.75; float r = textureGrad(tDet, vec2(ang * 3.0, vLoc.z * 0.9), gz * 0.9, hz * 0.9).b; c = mix(c * 0.5, SL(vec3(0.28, 0.17, 0.1)), r * 0.45); colMetal *= 1.0 - r * 0.5; }
  diffuseColor.rgb *= c * uLuz;`);
    hierro(sh);
  };
  m.customProgramCacheKey = () => 'testudo-astil-c' + (propio ? '-p' : ''); return m;
}
const matAsta = matAstil(false);
/* lo que llevan los tuyos en la mano se oscurece con ellos bajo el techo */
const matAstaMia = matAstil(true);
/* venablo: astil fino de madera clara y punta de hierro pequeña */
/* GM43d-C: con la correa de lanzar (amentum, de cuero oscuro) un poco por delante del centro. Plumas no: el venablo no las llevaba */
const geoVenablo = geoAsta([[0.011, 0.011, 1.48, -0.06, '#c8a678'], [0.0135, 0.0135, 0.07, 0.02, '#4b3322'], [0.0125, 0.0125, 0.012, 0.075, '#4b3322'], [0.007, 0.011, 0.03, -0.815, '#a88a62'], [0.012, 0.012, 0.06, 0.70, '#4a4a48'], [0.014, 0, 0.1, 0.78, '#5c5c5a']]);
/* pilum: astil de madera, hierro largo y fino con su punta */
/* GM43d-C: con dos virolas de hierro que sujetan la lengüeta al astil (Polibio 6.23: el hierro va clavado hasta media asta) y regatón atrás */
const geoPilum = geoAsta([[0.015, 0.015, 1.2, -0.45, '#b48a5a'], [0.0185, 0.0185, 0.022, 0.125, '#58585a'], [0.0175, 0.0175, 0.02, 0.0, '#58585a'], [0.006, 0.0155, 0.09, -1.09, '#505052'], [0.019, 0.013, 0.12, 0.2, '#3d3d3b'], [0.0085, 0.0075, 0.62, 0.56, '#77777a'], [0.017, 0, 0.1, 0.92, '#5e5e60']]);
const PUNTA = 0.83 * GRANDE;
const NFL = 260, flechas = new THREE.InstancedMesh(geoVenablo, matAsta, NFL); flechas.frustumCulled = false; flechas.castShadow = true; escena.add(flechas);
const FL = []; for (let i = 0; i < NFL; i++) FL.push({ est: 0, p: new THREE.Vector3(), q: new THREE.Quaternion(), ql: new THREE.Quaternion(), rel: new THREE.Vector3() });
/* astillas del escudo roto */
const ASTILLAS = Array.from({ length: 9 }, (_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06 + (i % 3) * 0.05, 0.14 + (i % 2) * 0.14, 0.02), new THREE.MeshLambertMaterial({ color: i % 2 ? 0x8a6238 : 0x8e2a20 })); m.visible = false; escena.add(m); return { m, v: new THREE.Vector3(), w: new THREE.Vector3(), t: -9 }; });

function nuevoSprite(tex, aditivo) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending })); s.visible = false; escena.add(s); return s; }
const CHISPAS = Array.from({ length: 40 }, () => ({ s: nuevoSprite(texChispa, true), t: -9 }));
const POLVO = Array.from({ length: 36 }, () => ({ s: nuevoSprite(texPolvo, false), t: -9, v: new THREE.Vector3() }));
function nuevoPilum() { const g = new THREE.Mesh(geoPilum, matAsta); g.visible = false; escena.add(g); return g; }
const PILA = Array.from({ length: FILES * 2 }, () => ({ g: nuevoPilum(), est: 0 }));

/* ---------- los hombres: figura sin su escudo ni su espada, y esas dos piezas sueltas ---------- */
const SK_CAB = `attribute vec4 aSkinI;\nattribute vec4 aSkinW;\nattribute float aMode;\nattribute float aFrame;\nattribute float aFrame2;\nattribute float aMix;\nuniform sampler2D uBones;\nvarying float vMode;
mat4 boneM(float slot, int row) { int x = int(slot + 0.5) * 3; vec4 a = texelFetch(uBones, ivec2(x, row), 0), b = texelFetch(uBones, ivec2(x + 1, row), 0), c = texelFetch(uBones, ivec2(x + 2, row), 0);
  return mat4(vec4(a.x, b.x, c.x, 0.0), vec4(a.y, b.y, c.y, 0.0), vec4(a.z, b.z, c.z, 0.0), vec4(a.w, b.w, c.w, 1.0)); }
mat4 boneD(float slot, int ra, int rb) { mat4 m = boneM(slot, ra); if (aMix > 0.001) m = m * (1.0 - aMix) + boneM(slot, rb) * aMix; return m; }\n`;
const SK_NORMAL = `int ra = int(aFrame + 0.5), rb = int(aFrame2 + 0.5);
  mat4 sk = boneD(aSkinI.x, ra, rb) * aSkinW.x; if (aSkinW.y > 0.0) sk += boneD(aSkinI.y, ra, rb) * aSkinW.y; if (aSkinW.z > 0.0) sk += boneD(aSkinI.z, ra, rb) * aSkinW.z; if (aSkinW.w > 0.0) sk += boneD(aSkinI.w, ra, rb) * aSkinW.w;
  vec3 objectNormal = normalize(mat3(sk) * normal); vMode = aMode;`;
const FRAG = `vec4 tx = texture2D(map, vMapUv);
  if (vMode > 1.5 && tx.a < 0.5) discard;
  if (vMode > 0.5 && vMode < 1.5) tx.rgb = mix(uTeam, tx.rgb, tx.a);
  tx.rgb = mix(vec3(0.15, 0.1, 0.065), tx.rgb, smoothstep(0.015, 0.07, max(tx.r, max(tx.g, tx.b))));   /* el negro liso del modelo (nuca, pelo) pasa a pelo castaño oscuro: así recibe luz */
  diffuseColor.rgb *= tx.rgb * uLuz;`;
const FRAG_HOMBRE = `vec4 tx = texture2D(map, vMapUv); vec2 gx = dFdx(vMapUv), gy = dFdy(vMapUv); vec3 gp = dFdx(vPos), hp = dFdy(vPos);
  float metal = 0.0, brillo = 0.15, borde = 0.32, hDet = 0.5, sDet = 0.0; vec3 colMetal = vec3(0.0);
  if (vMode > 1.5 && tx.a < 0.5) discard;
  vec2 uv = vMapUv; vec3 c = tx.rgb, cs = pow(c, vec3(0.4545)); float L = lumi(cs);
  vec3 piel = mix(vec3(1.04, 1.0, 0.96), vec3(0.80, 0.67, 0.55), vVar.x);
  if (uv.x < 0.5 && uv.y < 0.5) {
    vec2 q = uv * 2.0, gq = gx * 2.0, hq = gy * 2.0; vec4 dA = textureGrad(tDet, q * vec2(9.0, 9.0), gq * vec2(9.0, 9.0), hq * vec2(9.0, 9.0)), dB = textureGrad(tDet, q * 2.3 + vVar.yz, gq * 2.3, hq * 2.3);
    if (vMode > 0.5 && vMode < 1.5 && tx.a < 0.6) {
      /* túnica de lana: rojo de rubia, ladrillo o desvaído según el hombre; trama, manchas de sudor y polvo */
      vec3 t0 = mix(SL(vec3(0.60, 0.17, 0.12)), SL(vec3(0.55, 0.25, 0.14)), smoothstep(0.0, 0.6, vVar.y));
      t0 = mix(t0, SL(vec3(0.60, 0.36, 0.27)), smoothstep(0.55, 1.0, vVar.y));
      vec3 tela = mix(uTeam * 0.55 + t0 * 0.45, c, tx.a) * (0.84 + 0.32 * dA.r) * (1.0 - 0.18 * dB.b);
      c = tela; hDet = dA.r; sDet = 0.9; borde = 0.22;
    } else if (cs.b < cs.r * 0.4 && L > 0.3) {
      /* las placas del pectoral: bronce (suavizado, como el casco) */
      c = textureGrad(map, vMapUv, gx * 2.5, gy * 2.5).rgb;
      metal = 1.0; colMetal = c * vec3(1.15, 0.95, 0.7); c *= 0.42; brillo = 0.5 - 0.3 * vVar.w; hDet = dB.r; sDet = 0.12;
      c = mix(c, SL(vec3(0.17, 0.17, 0.11)), dB.b * 0.5 * vVar.w); colMetal *= 1.0 - 0.55 * dB.b * vVar.w;
    } else if (cs.r > cs.b * 1.2 && L > 0.38) {
      /* piel: tono de cada uno, poros y algo de rojez */
      c *= piel * (0.94 + 0.12 * dB.g); brillo = 0.3; hDet = dB.b; sDet = 0.25; borde = 0.2;
    } else {
      /* cuero de correas y sandalias */
      c *= 0.9 + 0.25 * dA.g; hDet = dA.g; sDet = 0.7; brillo = 0.3;
    }
    /* barro y polvo de las rodillas para abajo, más en unos que en otros */
    float b = (1.0 - smoothstep(0.1, 1.5, vAlto)) * (0.55 + 0.45 * vVar.w);
    float mancha = smoothstep(0.2, 0.65, textureGrad(tDet, q * 3.1 + vVar.xw, gq * 3.1, hq * 3.1).b + b * 0.7);
    c = mix(c, SL(vec3(0.33, 0.26, 0.17)) * (0.8 + 0.3 * dA.r), clamp(b * mancha * 1.2, 0.0, 0.88));
    metal *= 1.0 - b * mancha;
  } else if (uv.y < 0.25 && uv.x < 0.75) {
    /* la cabeza: lo negro del atlas (nuca y pelo) pasa a pelo con mechones y, abajo, a cuello */
    vec2 q = (uv - vec2(0.5, 0.0)) * 4.0, gq = gx * 4.0, hq = gy * 4.0;
    vec3 pelo = mix(SL(vec3(0.17, 0.12, 0.08)), SL(vec3(0.34, 0.23, 0.13)), vVar.z);
    vec2 k = vec2(9.0, 2.2), hp2 = vec2(vPos.x + vPos.y, vPos.z) * k + vVar.zy; float mech = textureGrad(tDet, hp2, vec2(gp.x + gp.y, gp.z) * k, vec2(hp.x + hp.y, hp.z) * k).g, rizo = textureGrad(tDet, q * 3.0, gq * 3.0, hq * 3.0).b;
    float esPelo = 1.0 - smoothstep(0.1, 0.25, L);
    vec3 cp = pelo * (0.68 + 0.65 * mech) * (0.9 + 0.2 * rizo);
    vec3 cuello = SL(vec3(0.62, 0.44, 0.33)) * piel * (0.75 + 0.2 * rizo);
    cp = mix(cuello, cp, smoothstep(0.08, 0.14, vAlto + 0.05 * rizo - 0.03 * mech));
    c = mix(c * piel, cp, esPelo);
    brillo = mix(0.3, 0.45, esPelo); hDet = mix(rizo, mech, esPelo); sDet = mix(0.25, 1.6, esPelo);
  } else if (uv.y < 0.25) {
    /* casco montefortino de bronce: más o menos gastado, pátina en los huecos y rayas brillantes */
    vec2 q = (uv - vec2(0.75, 0.0)) * 4.0, gq = gx * 4.0, hq = gy * 4.0; vec4 d = textureGrad(tDet, q * 2.0 + vVar.wx, gq * 2.0, hq * 2.0); d.b = textureGrad(tDet, q * 0.5 + vVar.xw, gq * 3.0, hq * 3.0).b;   /* la pátina, en manchas grandes y suaves */
    if (L > 0.04) {
      float gasto = vVar.w; vec3 cb = textureGrad(map, vMapUv, gx * 2.0, gy * 2.0).rgb; c = mix(c, cb, step(0.2, lumi(pow(cb, vec3(0.4545)))));   /* el bronce del atlas es de 64 px con grano: más suave, que el brillo no lo pique */
      metal = 1.0; colMetal = mix(c, SL(vec3(0.72, 0.52, 0.26)) * (0.6 + 0.8 * L), 0.55) * vec3(1.2, 1.0, 0.75) * (1.0 + 0.25 * d.a);
      float pat = smoothstep(0.45, 0.95, d.b) * (0.25 + 0.75 * gasto);
      colMetal = mix(colMetal, SL(vec3(0.22, 0.28, 0.2)), pat * 0.7);
      c = mix(c * 0.38, SL(vec3(0.20, 0.24, 0.17)), pat * 0.6);
      brillo = mix(0.85, 0.45, gasto) * (1.0 - pat); hDet = d.b; sDet = 0.8; borde = 0.4;
    }
  } else if (uv.x < 0.75) {
    /* vaina: guarniciones de bronce */
    if (cs.b < cs.r * 0.4 && L > 0.3) { metal = 1.0; colMetal = c * 1.1; c *= 0.45; brillo = 0.55; }
  }
  if (vMode > 0.5 && vMode < 1.5 && !(uv.x < 0.5 && uv.y < 0.5)) c = mix(uTeam, c, tx.a);
  diffuseColor.rgb *= c * uLuz;`;
const FRAG_PIEZA = `vec4 tx = texture2D(map, vMapUv); vec2 gx = dFdx(vMapUv), gy = dFdy(vMapUv);
  float metal = 0.0, brillo = 0.12, borde = 0.25, hDet = 0.5, sDet = 0.0; vec3 colMetal = vec3(0.0);
  if (vMode > 1.5 && tx.a < 0.5) discard;
  vec2 uv = vMapUv; vec3 c = tx.rgb, cs = pow(c, vec3(0.4545)); float L = lumi(cs);
  if (uv.y > 0.5 && uv.x < 0.75) {
    vec2 q = (uv - vec2(0.5, 0.5)) * 4.0, gq = gx * 4.0, hq = gy * 4.0; vec2 o = vVarE.ww * vec2(3.7, 5.3);
    vec4 d1 = textureGrad(tDet, q * 1.6 + o, gq * 1.6, hq * 1.6), d2 = textureGrad(tDet, q * 6.0 + o, gq * 6.0, hq * 6.0);
    float filo = 1.0 - smoothstep(0.0, 0.16, min(min(q.x, 1.0 - q.x), min(q.y, 1.0 - q.y) * 1.6));
    if (tx.a < 0.6) {
      /* la piel pintada: rojo de cada escudo, trama del lienzo, rayas que dejan ver el cuero y desconchones en el canto */
      vec3 pin = mix(uTeam * vec3(0.92, 0.85, 0.85), SL(vec3(0.58, 0.2, 0.13)), vVarE.x) * mix(1.0, 0.82, vVarE.y);
      pin = mix(c * pin, pin, 0.35) * (0.9 + 0.2 * d2.r);
      float raya = smoothstep(0.55, 0.9, d1.a) * (0.2 + 0.5 * vVarE.y);
      float desc = smoothstep(0.72, 0.95, d1.b + filo * 0.45 * vVarE.y);
      c = mix(pin, SL(vec3(0.30, 0.21, 0.14)), max(raya * 0.45, desc * 0.6));
      hDet = d2.r * 0.5 + raya * 0.6 - desc * 0.4; sDet = 0.9; brillo = 0.22;
    } else if (cs.b < cs.r * 0.45 && L > 0.25) {
      /* canto y refuerzos de metal */
      metal = 1.0; colMetal = c * vec3(1.15, 1.0, 0.75); c *= 0.45; brillo = 0.55 - 0.3 * vVarE.y; hDet = d1.a; sDet = 1.2;
      c = mix(c, SL(vec3(0.18, 0.2, 0.14)), d1.b * 0.5 * vVarE.y);
    }
    /* barro salpicado desde abajo (el canto que va al suelo) */
    float bajo = 1.0 - smoothstep(0.0, 0.45, q.y), sal = smoothstep(0.55, 0.8, textureGrad(tDet, q * vec2(2.2, 3.4) + o.yx, gq * vec2(2.2, 3.4), hq * vec2(2.2, 3.4)).b + bajo * 0.45 * vVarE.z - 0.15);
    c = mix(c, SL(vec3(0.34, 0.27, 0.18)), sal * bajo * 0.9); metal *= 1.0 - sal * bajo;
  } else if (uv.y > 0.5) {
    /* dorso: tablas con veta, más oscuras de manos y de sudor hacia el centro, cada escudo de un tono */
    vec2 q = (uv - vec2(0.75, 0.5)) * 4.0, gq = gx * 4.0, hq = gy * 4.0; vec2 o = vVarE.ww * vec2(2.1, 4.3);
    float veta = textureGrad(tDet, q * vec2(2.4, 0.7) + o, gq * vec2(2.4, 0.7), hq * vec2(2.4, 0.7)).g, man = textureGrad(tDet, q * 1.3 + o, gq * 1.3, hq * 1.3).b;
    float centro = 1.0 - smoothstep(0.05, 0.42, length(q - 0.5));
    c *= mix(vec3(1.06, 1.0, 0.92), vec3(0.8, 0.72, 0.64), vVarE.x) * (0.78 + 0.42 * veta) * (1.0 - 0.25 * centro * man);
    if (cs.b < cs.r * 0.4 && L > 0.35) { metal = 0.6; colMetal = c; brillo = 0.4; }
    hDet = veta; sDet = 1.3; brillo = max(brillo, 0.18);
  } else if (L > 0.3 && abs(cs.r - cs.b) < 0.1) {
    /* hoja de hierro */
    metal = 1.0; colMetal = c * 0.9; c *= 0.4; brillo = 0.7;
  }
  if (vMode > 0.5 && vMode < 1.5 && !(uv.y > 0.5 && uv.x < 0.75)) c = mix(uTeam, c, tx.a);
  diffuseColor.rgb *= c * uLuz;`;
/* su sombra: la pasada de profundidad del sol con el mismo esqueleto, si no la sombra sería la de la figura quieta */
function matSombra(huesosTex) {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => { sh.uniforms.uBones = { value: huesosTex }; sh.vertexShader = SK_CAB + sh.vertexShader.replace('#include <begin_vertex>', SK_NORMAL.split('\n').slice(0, 2).join('\n') + '\n vec3 transformed = (sk * vec4(position, 1.0)).xyz;'); };
  m.customProgramCacheKey = () => 'testudo-cuerpo-sombra'; return m;
}
/* la figura: cada hombre mezcla dos filas de la tabla de huesos (así los gestos no dan saltos) */
function matCuerpo(tex, huesosTex, color) {
  const m = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }), team = new THREE.Color(color);
  m.onBeforeCompile = sh => {
    cine(sh, 1.0, AMB); sh.uniforms.uBones = { value: huesosTex }; sh.uniforms.uTeam = { value: team }; sh.uniforms.uLuz = LUZ;
    sh.vertexShader = SK_CAB + sh.vertexShader.replace('#include <beginnormal_vertex>', SK_NORMAL).replace('#include <begin_vertex>', 'vec3 transformed = (sk * vec4(position, 1.0)).xyz;\n vVar = aVar; vAlto = position.z; vPos = position;');
    sh.vertexShader = 'attribute vec4 aVar;\nvarying vec4 vVar;\nvarying float vAlto;\nvarying vec3 vPos;\n' + sh.vertexShader;
    sh.fragmentShader = 'uniform vec3 uTeam;\nuniform float uLuz;\nvarying float vMode;\nvarying vec4 vVar;\nvarying float vAlto;\nvarying vec3 vPos;\n' + sh.fragmentShader.replace('#include <map_fragment>', FRAG_HOMBRE);
    hierro(sh);
  };
  m.customProgramCacheKey = () => 'testudo-cuerpo-c'; return m;
}
/* una pieza suelta (escudo, espada); con «danio», lleva encima las grietas y el trozo que falta */
function matPieza(tex, color, danio) {
  const m = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide }), team = new THREE.Color(color);
  m.onBeforeCompile = sh => {
    cine(sh, 0.85, AMB); sh.uniforms.uTeam = { value: team }; sh.uniforms.uLuz = LUZ; sh.uniforms.tDanio = DANIO;
    sh.vertexShader = '#ifdef USE_INSTANCING\nattribute vec4 aVarE;\n#endif\nvarying vec4 vVarE;\nattribute float aMode;\nvarying float vMode;\nvarying vec2 vDan;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vMode = aMode; vDan = vec2(position.x / 1.62 + 0.5, position.z / 3.1 + 0.5);\n#ifdef USE_INSTANCING\n vVarE = aVarE;\n#else\n vVarE = vec4(0.35, 0.3, 0.55, 0.5);\n#endif');
    sh.fragmentShader = 'uniform vec3 uTeam;\nuniform float uLuz;\nuniform sampler2D tDanio;\nvarying float vMode;\nvarying vec2 vDan;\nvarying vec4 vVarE;\n' + sh.fragmentShader.replace('#include <map_fragment>', FRAG_PIEZA + (danio ? '\n vec4 dn = texture2D(tDanio, vDan); if (dn.a < 0.5) discard; diffuseColor.rgb *= dn.rgb;' : ''));
    hierro(sh);
  };
  m.customProgramCacheKey = () => 'testudo-pieza-c' + (danio ? '-d' : ''); return m;
}
/* los vértices de unas piezas del modelo (cada vértice sabe de qué pieza es: cuerpo, cabeza, casco, vaina, espada, escudo) */
function parte(geo, CELL, celdas, conHuesos) {
  const idx = []; for (let i = 0; i < CELL.length; i++) if (celdas.includes(CELL[i])) idx.push(i);
  const g = new THREE.BufferGeometry();
  for (const k of conHuesos ? ['position', 'normal', 'uv', 'aSkinI', 'aSkinW', 'aMode'] : ['position', 'normal', 'uv', 'aMode']) {
    const a = geo.attributes[k], t = a.itemSize, arr = new a.array.constructor(idx.length * t);
    for (let j = 0; j < idx.length; j++) for (let c = 0; c < t; c++) arr[j * t + c] = a.array[idx[j] * t + c];
    g.setAttribute(k, new THREE.BufferAttribute(arr, t, a.normalized));
  }
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 8); return g;
}
/* el daño de tu escudo: 0 entero, 1 astillas y grieta, 2 grieta grande y un trozo fuera */
function texDanio(estado) {
  return lienzoTex(128, 256, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); if (!estado) return;
    const grieta = (pts, ancho) => { g.strokeStyle = 'rgba(14,8,3,.95)'; g.lineWidth = ancho; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    grieta([[52, 4], [57, 34], [49, 62], [60, 98]], 3);
    for (let i = 0; i < 9; i++) { const x = 38 + i * 6, y = 14 + (i % 3) * 18; g.strokeStyle = 'rgba(60,40,20,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + 9); g.stroke(); }
    if (estado >= 2) {
      grieta([[60, 98], [68, 140], [61, 176], [74, 220], [70, 254]], 5); grieta([[68, 140], [96, 152], [124, 146]], 4);
      g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.moveTo(78, 0); g.lineTo(128, 0); g.lineTo(128, 86); g.lineTo(102, 70); g.lineTo(94, 40); g.lineTo(82, 26); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over';
    }
  });
}
const TEX_DANIO = [texDanio(0), texDanio(1), texDanio(2)]; DANIO.value = TEX_DANIO[0];

/* la tabla de huesos, con las posturas nuevas detrás de las del modelo. Cada «conjunto» tiene 120 filas: una por cada
   fotograma de «idle» (70) y de «walk» (50), para que el hombre siga respirando o andando mientras hace el gesto.
   0-3 muro (subiendo el escudo: 1/4, 2/4, 3/4 y arriba) · 4 muro encogido · 5-8 techo · 9 techo encogido
   10-11 muro mirando a su derecha (a medias y del todo) · 12-13 muro mirando a su izquierda · después, 4 filas de lanzar */
const CJ = { muro: 0, techo: 5, miraD: 10, miraI: 12, lanza: 14 };
function generaTabla(base, meta, geo) {
  const hues = meta.slots, N0 = meta.frames, total = N0 + CJ.lanza * 120 + 4, T = new Float32Array(total * hues * 12); T.set(base.subarray(0, N0 * hues * 12));
  const esq = crearEsqueleto(base, hues, N0, geo.attributes.position.array, geo.attributes.aSkinI.array, geo.attributes.aSkinW.array);
  const u = v => v.map(x => x / E), pon = (fila, q, b) => T.set(esq.postura(b, q), fila * hues * 12);
  const ROL = [
    { c: CJ.muro, baja: 0.22, dobla: 0.2, cab: -0.12, mano: [-0.01, MURO_Y, MURO_Z - 0.03], enc: [0, 0, -0.03] },
    { c: CJ.techo, baja: 0.14, dobla: 0.1, cab: 0.02, mano: [CORRE + 0.02, TECHO_Y - 0.1, TECHO_Z - 0.03], enc: [0, -0.05, 0] },
  ];
  for (let b = 0; b < 120; b++) {
    const m0 = esq.en(b, HU.anteI, 'munecaI').map(x => x * E);
    for (const R of ROL) {
      for (let j = 1; j <= 4; j++) {
        const p = j / 4, s = Math.sin(Math.PI * p), mano = [lerp(m0[0], R.mano[0], p) + 0.2 * s, lerp(m0[1], R.mano[1], p), lerp(m0[2], R.mano[2], p) + 0.18 * s];
        pon(N0 + (R.c + j - 1) * 120 + b, { baja: R.baja * p / E, dobla: R.dobla * p, cabeza: [R.cab * p, 0], manoI: u(mano) }, b);
      }
      pon(N0 + (R.c + 4) * 120 + b, { baja: (R.baja + 0.06) / E, dobla: R.dobla + 0.12, cabeza: [0.45, 0.22], manoI: u([R.mano[0] + R.enc[0], R.mano[1] + R.enc[1], R.mano[2] + R.enc[2]]) }, b);
    }
    const W = ROL[0];
    for (const [c, giro, tu] of [[CJ.miraD, -0.62, -0.12], [CJ.miraD + 1, -1.24, -0.24], [CJ.miraI, 0.55, 0.1], [CJ.miraI + 1, 1.1, 0.2]]) pon(N0 + c * 120 + b, { baja: W.baja / E, dobla: W.dobla, tuerce: tu, cabeza: [-0.05, giro], manoI: u(W.mano) }, b);
  }
  const L = N0 + CJ.lanza * 120;
  pon(L, { tuerce: -0.45, dobla: -0.1, manoD: u([-0.36, 1.78, -0.3]), poloD: [-0.6, -0.6, -0.5] }, 0);
  pon(L + 1, { tuerce: -0.1, dobla: 0.05, manoD: u([-0.3, 2.02, 0.05]), poloD: [-0.8, -0.4, -0.3] }, 0);
  pon(L + 2, { tuerce: 0.3, dobla: 0.22, manoD: u([-0.2, 1.85, 0.5]), poloD: [-0.8, -0.5, 0] }, 0);
  pon(L + 3, { tuerce: 0.45, dobla: 0.35, manoD: u([-0.02, 1.2, 0.5]) }, 0);
  return { T, esq, N0, hues, total, L };
}
let HOM = null;   /* todo lo de los hastati: mallas, tabla y esqueleto */
const m4 = () => new THREE.Matrix4(), _e = new Array(12);
/* la matriz de un hueso, mezclando dos filas igual que el sombreador */
function hueso(slot, A, B, mx, out) {
  const t = HOM.T, oa = (A * HOM.hues + slot) * 12, ob = (B * HOM.hues + slot) * 12;
  if (mx < 0.001 || A === B) for (let i = 0; i < 12; i++) _e[i] = t[oa + i]; else for (let i = 0; i < 12; i++) _e[i] = t[oa + i] * (1 - mx) + t[ob + i] * mx;
  return out.set(_e[0], _e[1], _e[2], _e[3], _e[4], _e[5], _e[6], _e[7], _e[8], _e[9], _e[10], _e[11], 0, 0, 0, 1);
}
async function creaHombres() {
  const idx = await loadIndex(), meta = idx.hastati, u = getUnit('hastati');
  const buf = await (await fetch('assets/units/hastati.bin')).arrayBuffer(), CELL = new Uint8Array(buf, meta.off[6], meta.verts);
  const tab = generaTabla(u.bones.image.data, meta, u.geo);
  const tex = new THREE.DataTexture(tab.T, tab.hues * 3, tab.total, THREE.RGBAFormat, THREE.FloatType); tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const gc = parte(u.geo, CELL, [0, 1, 2, 3], true), ia = () => { const a = new THREE.InstancedBufferAttribute(new Float32Array(M), 1); a.setUsage(THREE.DynamicDrawUsage); return a; };
  const fr = ia(), fr2 = ia(), mx = ia(); gc.setAttribute('aFrame', fr); gc.setAttribute('aFrame2', fr2); gc.setAttribute('aMix', mx);
  /* GM43d-C: cada hombre, el suyo: piel, túnica, pelo y desgaste (y su escudo: pintura, gasto, barro y semilla). Azar fijo. */
  let sv = 7; const az = () => { sv = (sv * 16807) % 2147483647; return (sv - 1) / 2147483646; };
  const vh = new Float32Array(M * 4), ve = new Float32Array(M * 4);
  for (let i = 0; i < M; i++) { vh.set([az(), az(), az(), 0.25 + 0.75 * az()], i * 4); ve.set([az(), 0.25 + 0.75 * az(), 0.3 + 0.7 * az(), az()], i * 4); }
  gc.setAttribute('aVar', new THREE.InstancedBufferAttribute(vh, 4));
  const ROJO = '#c23a2e', inst = (g, mat, n) => { const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false; escena.add(m); return m; };
  const cuerpos = inst(gc, matCuerpo(u.tex, tex, ROJO), M);
  const gEsc = parte(u.geo, CELL, [5, 6], false); gEsc.setAttribute('aVarE', new THREE.InstancedBufferAttribute(ve, 4)); const escudos = inst(gEsc, matPieza(u.tex, ROJO, false), M);
  const mio = new THREE.Mesh(gEsc, matPieza(u.tex, ROJO, true)); mio.matrixAutoUpdate = false; mio.frustumCulled = false; escena.add(mio);
  const gEsp = parte(u.geo, CELL, [4], false); gEsp.setAttribute('aVarE', new THREE.InstancedBufferAttribute(ve, 4)); const espadas = inst(gEsp, matPieza(u.tex, ROJO, false), M), pila = inst(geoPilum, matAstaMia, M);
  /* todos dan sombra y la reciben (la figura, con su esqueleto también en la sombra) */
  cuerpos.customDepthMaterial = matSombra(tex);
  for (const o of [cuerpos, escudos, mio, espadas, pila]) { o.castShadow = true; o.receiveShadow = true; }
  HOM = { ...tab, u, C: u.clips, cuerpos, fr, fr2, mx, escudos, mio, espadas, pila };
}

/* ---------- estado de la partida ---------- */
const S = {};
function reinicia() {
  semilla = 43;
  Object.assign(S, { T: 0, zF: 0, k: 0, escudos: false, andando: false, fase: 'avance', proxima: 4, aviso: false, impacto: -1, paso: 0, tCinta: 0, tFin: -1, choque: false, llegaron: 0, sacude: 0, vel: 0, golpes: 0, roto: false, encoge: -9, destello: 0, corre: false, corriendo: false, aliento: 1, tGrito: -9, armas: 'pilum', nPaso: 0, kSon: -1, agotado: false });
  S.romanos = []; for (let i = 0; i < M; i++) { const r = Math.floor(i / FILES); S.romanos.push({ i, f: i % FILES, r, vivo: true, muere: 0, lanza: -9, tiro: false, x: 0, z: 0, jx: (azar() - 0.5) * 0.14, jz: (azar() - 0.5) * 0.22, fase: azar() * 2, k: 0, ret: Math.min(0.4, r * 0.07 + azar() * 0.12), retEnc: i === YO ? 0 : 0.04 + azar() * 0.16, ampEnc: i === YO ? 1 : 0.55 + azar() * 0.45, golpe: -9, enc: 0, mira: 0, A: 0, B: 0, mx: 0, oculto: false, inst: m4(), mEsc: m4(), qEsc: new THREE.Quaternion() }); }
  S.tiradores = []; for (let i = 0; i < 10; i++) S.tiradores.push({ x: (i - 4.5) * 1.7 + (azar() - 0.5) * 0.5, z: Z_TIRADORES + (azar() - 0.5) * 1.2, vivo: true, muere: 0, huye: false, yaw: 0, fase: azar() * 4 });
  S.galos = []; for (let i = 0; i < 16; i++) S.galos.push({ x: ((i % 8) - 3.5) * 1.25 + (azar() - 0.5) * 0.3, z: Z_GALOS - Math.floor(i / 8) * 1.6 + (azar() - 0.5) * 0.4, vivo: true, muere: 0, fila: Math.floor(i / 8), fase: azar() * 3 });
  for (const f of FL) f.est = 0; for (const a of ASTILLAS) { a.t = -9; a.m.visible = false; } for (const p of PILA) { p.est = 0; p.g.visible = false; }
  for (const c of CHISPAS) c.t = -9; for (const p of POLVO) p.t = -9; for (const p of PIES) p.t = -9; S.restoPolvo = 0;
  $('fin').hidden = true; $('accion').hidden = true; cinta('', false); DANIO.value = TEX_DANIO[0];
  for (const h of S.romanos) sitio(h); actualiza();
}
const vivos = () => S.romanos.filter(h => h.vivo).length;

/* sitio de un hombre: depende de dónde va el frente y de lo cerrado del testudo */
function sitio(h) {
  if (!h.vivo) return;
  const k = S.k, dx = lerp(ABIERTO.dx, CERRADO.dx, k), dz = lerp(ABIERTO.dz, CERRADO.dz, k);
  h.x = (h.f - (FILES - 1) / 2) * dx + h.jx * (1 - k); h.z = S.zF + h.r * dz + h.jz * (1 - k);
}

/* ---------- avisos ---------- */
function cinta(texto, buena) { const c = $('cinta'); c.textContent = texto; c.classList.toggle('ve', !!texto); c.classList.toggle('buena', !!buena); S.tCinta = texto ? S.T : 0; }
const GRITOS = { aguante: ['¡Aguantad!', '¡Firmes!', '¡Juntos!', '¡No os mováis!'], aviso: ['¡Escudos!', '¡Arriba los escudos!', '¡Ahí vienen!'], paso: ['¡Ya casi!', '¡Paso a paso!', '¡Adelante, juntos!'] };
function grita(t) { if (Array.isArray(t)) t = t[Math.floor(azar() * t.length)]; const g = $('grito'); g.textContent = t; g.classList.add('ve'); S.tGrito = S.T; }

/* ---------- la cámara ----------
   En marcha: detrás de la primera fila, a la altura de los hombros (en vertical, más atrás y más alta, por encima de la segunda).
   Bajo los escudos (idea de Ryse): dentro y entre dos hombres. Tú a la izquierda, tu compañero a la derecha, y en medio,
   por encima del muro y por debajo del techo, la rendija con el enemigo. Cada juego de cifras: x a la derecha del punto
   medio entre los dos, d metros detrás de la primera fila, y de altura, cabeceo, giro y apertura. */
const CAMS = {
  hm: { x: 0, d: 2.2, y: 2.0, pitch: -0.07, yaw: 0, fov: 58 }, ht: { x: 0, d: 0.85, y: 1.74, pitch: 0, yaw: 0, fov: 55 },
  vm: { x: 0, d: 4.4, y: 2.85, pitch: -0.27, yaw: 0, fov: 74 }, vt: { x: 0, d: 1.45, y: 1.76, pitch: -0.2, yaw: 0, fov: 72 },
};
if (Q.get('cam')) { const c = Q.get('cam').split(',').map(Number), t = innerHeight > innerWidth ? CAMS.vt : CAMS.ht; ['d', 'y', 'pitch', 'yaw', 'fov', 'x'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
if (Q.get('camm')) { const c = Q.get('camm').split(',').map(Number), t = innerHeight > innerWidth ? CAMS.vm : CAMS.hm; ['d', 'y', 'pitch', 'yaw', 'fov', 'x'].forEach((n, i) => { if (isFinite(c[i])) t[n] = c[i]; }); }
const CAM = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, fov: 60 };
function camBase() {
  const k = suave(0, 1, S.k), yo = S.romanos[YO], co = S.romanos[CMP], mx = (yo.x + co.x) / 2, a = vertical ? CAMS.vm : CAMS.hm, b = vertical ? CAMS.vt : CAMS.ht;
  CAM.x = mx + lerp(a.x, b.x, k); CAM.z = S.zF + lerp(a.d, b.d, k); CAM.y = H(mx, S.zF) + lerp(a.y, b.y, k);
  const dist = Math.max(8, CAM.z - Z_TIRADORES), sube = Math.atan2(H(0, Z_TIRADORES) + 1.2 - CAM.y, dist);
  CAM.pitch = lerp(a.pitch, b.pitch, k) + sube * 0.6 * (1 - k); CAM.yaw = lerp(a.yaw, b.yaw, k); CAM.fov = lerp(a.fov, b.fov, k);
  /* cuando tu soldado se vuelve a gritar a los suyos, la cámara se le arrima y le mira: se le ve la cara de perfil */
  const g = suave(0, 1, yo.mira) * k; if (g > 0) { CAM.x -= 0.06 * g; CAM.z -= (vertical ? 0.35 : 0.15) * g; CAM.yaw += (vertical ? 0.12 : 0.1) * g; CAM.y -= 0.02 * g; }
  return CAM;
}
const lejos = (pt, d) => Math.hypot(pt.x - CAM.x, pt.y - CAM.y, pt.z - CAM.z) >= d;

/* ---------- escudos: dónde va el de cada hombre con el testudo cerrado ---------- */
const giro = (x, y, z, a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(x, y, z), a);
const base3 = (x, y, z) => new THREE.Quaternion().setFromRotationMatrix(m4().makeBasis(new THREE.Vector3(...x), new THREE.Vector3(...y), new THREE.Vector3(...z)));
const Q_PI = giro(0, 1, 0, Math.PI);
/* muro: cara pintada al enemigo, de pie y un poco echado hacia los hombres. Techo: cara pintada al cielo, algo levantado por delante */
const Q_MURO = giro(1, 0, 0, 0.08).multiply(base3([-1, 0, 0], [0, 0, 1], [0, 1, 0]));
const Q_TECHO = giro(1, 0, 0, TECHO_SUBE).multiply(base3([1, 0, 0], [0, -1, 0], [0, 0, -1]));
const Q_ALERO_I = giro(0, 0, 1, ALERO).multiply(Q_TECHO);
const V3 = new THREE.Vector3(), PA = new THREE.Vector3(), PB = new THREE.Vector3(), QA = new THREE.Quaternion(), QB = new THREE.Quaternion(), SA = new THREE.Vector3(), SB = new THREE.Vector3(E, E, E), MA = m4(), MB = m4();
const Z1 = new THREE.Vector3(0, 0, 1);
/* el escudo del hombre h si estuviera en (x, z): posición y giro. «hunde» lo baja un poco cuando recibe un golpe */
function escudoEn(h, x, z, hunde, p, q) {
  const y0 = H(x, z);
  if (h.r === 0) { p.set(x, y0 + MURO_Y - hunde * 0.3, z - MURO_Z + hunde); q.copy(Q_MURO); }
  else if (h.f === 0) { p.set(x - 0.03, y0 + TECHO_Y - 0.1 - hunde, z - TECHO_Z); q.copy(Q_ALERO_I); }
  else { p.set(x - CORRE, y0 + TECHO_Y - hunde, z - TECHO_Z); q.copy(Q_TECHO); }
}
const enCierre = (h, z0) => ({ x: (h.f - (FILES - 1) / 2) * CERRADO.dx, z: z0 + h.r * CERRADO.dz });

/* ---------- cada hombre: sitio, postura (dos filas de la tabla y su mezcla) y escudo. Se llama en cada paso ---------- */
function actualiza() {
  if (!HOM) return;
  const T = S.T, C = HOM.C, N0 = HOM.N0, fila = (c, b) => N0 + c * 120 + b, yo = S.romanos[YO], co = S.romanos[CMP];
  camBase();
  for (const h of S.romanos) {
    sitio(h);
    h.k = h.vivo ? suave(h.ret, h.ret + 0.6, S.k) : 0;
    /* se encogen cuando cae la salva (cada uno con su retraso) y cuando un venablo da en su escudo */
    const te = T - S.encoge - h.retEnc, tg = T - h.golpe;
    h.enc = h.vivo ? Math.max(te > 0 && te < 0.6 ? Math.sin(Math.PI * te / 0.6) * h.ampEnc : 0, tg > 0 && tg < 0.35 ? 0.6 * Math.sin(Math.PI * tg / 0.35) : 0) : 0;
    let A, B, mx = 0;
    const tl = T - h.lanza;
    if (!h.vivo) A = B = frameOnce(C.death, Math.max(0, T - h.muere));
    else if (tl >= 0 && tl < 1.1) {
      const b = frameOf(C.idle, T + h.fase), L = HOM.L;
      if (tl < 0.3) { A = b; B = L; mx = suave(0, 0.3, tl); } else if (tl < 0.42) { A = L; B = L + 1; mx = (tl - 0.3) / 0.12; } else if (tl < 0.52) { A = L + 1; B = L + 2; mx = (tl - 0.42) / 0.1; }
      else if (tl < 0.7) { A = L + 2; B = L + 3; mx = (tl - 0.52) / 0.18; } else { A = L + 3; B = b; mx = suave(0.7, 1.1, tl); }
      if (tl > 0.47) h.tiro = true;
    }
    else if (S.fase === 'carga' && !S.choque) A = B = frameOf(C.run, T + h.fase);
    else if (S.choque && h.r === 0) A = B = frameOf(C.attack_melee, T + h.fase);
    else if (S.corriendo) A = B = frameOf(C.run, T + h.fase);
    else {
      const b = S.vel > 0 ? frameOf(C.walk, S.paso / lerp(V_PASO, 1.26, S.k) + h.fase) : frameOf(C.idle, T + h.fase), c0 = h.r === 0 ? CJ.muro : CJ.techo;
      if (h.k <= 0.001) A = B = b;
      else if (h.k < 0.999) { const s = h.k * 4, i = Math.min(3, Math.floor(s)); A = i === 0 ? b : fila(c0 + i - 1, b); B = fila(c0 + i, b); mx = s - i; }
      else {
        const arriba = fila(c0 + 3, b);
        if (h.enc > 0.02) { A = arriba; B = fila(c0 + 4, b); mx = h.enc; }
        else if (h.mira > 0.01 && h.r === 0) { const cm = h === co ? CJ.miraI : CJ.miraD, s = h.mira * 2; if (s < 1) { A = arriba; B = fila(cm, b); mx = s; } else { A = fila(cm, b); B = fila(cm + 1, b); mx = s - 1; } }
        else A = B = arriba;
      }
    }
    h.A = A; h.B = B; h.mx = mx;
    h.inst.compose(PA.set(h.x, H(h.x, h.z), h.z), Q_PI, SB);
    /* los que quedan entre la cámara y vosotros dos, o pegados a ella, no se dibujan (su escudo sí) */
    h.oculto = h.vivo && S.k > 0.5 && h.r > 0 && (h.f === YO || h.f === CMP) && h.z < CAM.z + 0.5;
    /* escudo: en la mano (como lo trae el modelo) y, al cerrar, en su sitio del muro o del techo */
    MA.multiplyMatrices(h.inst, hueso(HU.escudo, A, B, mx, MB));
    const w = suave(0.4, 1, h.k);
    if (w > 0) {
      MA.decompose(PA, QA, SA);
      const hunde = tg > 0 && tg < 1 ? 0.07 * Math.exp(-tg * 9) * Math.cos(tg * 30) : 0, hs = te > 0 && te < 1 ? 0.03 * Math.exp(-te * 7) * Math.cos(te * 25) : 0;
      escudoEn(h, h.x, h.z, hunde + hs, PB, QB); PA.lerp(PB, w); QA.slerp(QB, w); SA.lerp(SB, w); MA.compose(PA, QA, SA); h.qEsc.copy(QA);
    } else h.qEsc.setFromRotationMatrix(MA);
    h.mEsc.copy(MA);
  }
}
/* un punto de un hueso de un hombre, en el mundo (p en unidades del modelo) */
function ancla(h, slot, p, out) { return out.set(p[0], p[1], p[2]).applyMatrix4(MA.multiplyMatrices(h.inst, hueso(slot, h.A, h.B, h.mx, MB))); }

/* ---------- descargas enemigas: venablos de los peltastas ---------- */
function descarga() {
  const tir = S.tiradores.filter(t => t.vivo && !t.huye); if (!tir.length) return;
  const v = S.corriendo ? V_CORRE : S.andando || S.corre ? (S.escudos ? V_TESTUDO : V_PASO) : 0, zPrev = Math.max(Z_PILA, S.zF - v * VUELO), vivosR = S.romanos.filter(h => h.vivo);
  const fondo = FILAS * lerp(ABIERTO.dz, CERRADO.dz, S.k), R = S.romanos;
  let n = 0;
  for (const f of FL) {
    if (f.est !== 0 || n >= 30) continue; n++;
    const t = tir[n % tir.length]; f.t0 = S.T + azar() * 0.35;
    f.p0 = new THREE.Vector3(t.x + (azar() - 0.5) * 0.6, H(t.x, t.z) + 1.9, t.z);
    let x, z; f.h = null; f.tipo = 'fallo';
    /* tres van siempre a lo que se ve desde dentro: tu escudo y los dos del techo que os cubren */
    const fijo = n === 1 ? R[YO] : n === 2 ? R[FILES + YO] : n === 3 ? R[FILES + CMP] : null;
    if ((fijo && fijo.vivo) || (azar() < 0.6 && vivosR.length)) {
      const h = fijo && fijo.vivo ? fijo : vivosR[Math.floor(azar() * vivosR.length)], c = enCierre(h, zPrev); f.h = h; f.tipo = h.r === 0 ? 'muro' : 'techo';
      /* punto del escudo donde da, en las medidas del propio escudo: a lo ancho y a lo largo */
      f.rel.set((azar() - 0.5) * 1.1, 0, h.r === 0 ? 0.1 + azar() * 1.0 : (azar() - 0.5) * 2.0); f.rel.y = ySup(f.rel.x) + 0.1;
      escudoEn(h, c.x, c.z, 0, PA, QA); f.p1 = f.rel.clone().multiplyScalar(E).applyQuaternion(QA).add(PA);
    } else {
      /* falla: corta, larga o a un lado */
      const lado = azar(); if (lado < 0.4) { x = (azar() - 0.5) * 10; z = zPrev - 3 - azar() * 12; } else if (lado < 0.7) { x = (azar() - 0.5) * 8; z = zPrev + fondo + 1 + azar() * 8; } else { x = (azar() < 0.5 ? -1 : 1) * (3 + azar() * 5); z = zPrev + azar() * fondo; }
      f.p1 = new THREE.Vector3(x, H(x, z), z);
    }
    f.dur = VUELO + (azar() - 0.5) * 0.3; f.alto = 0.12 * f.p0.distanceTo(f.p1) + 4; f.est = 1; f.p.copy(f.p0);
  }
  S.impacto = S.T + VUELO; for (const t of tir) t.tira = S.T; Son.salva(VUELO);
}
/* el venablo en tierra: clavado inclinado o rebotado y tumbado; nunca pegado a la cámara */
function alSuelo(f, x, z, tumbado) {
  camBase();
  if (tumbado) { f.q.setFromEuler(new THREE.Euler(0, azar() * 6.28, 0)); f.p.set(x, H(x, z) + 0.03, z); }
  else { V3.set(0, 0, 1).applyQuaternion(f.q); f.p.set(x, H(x, z), z).addScaledVector(V3, -(PUNTA - 0.2)); }
  f.est = lejos(f.p, 1.5) ? 3 : 0;
}
const panDe = x => Math.max(-1, Math.min(1, (x - CAM.x) / 2.5));
/* llega un venablo */
function aterriza(f) {
  const h = f.h, yo = S.romanos[YO];
  if (f.tipo === 'fallo') { alSuelo(f, f.p1.x, f.p1.z, azar() < 0.3); if (f.est === 3 && azar() < 0.3) chispa(f.p1, 0.5); if (azar() < 0.5) Son.tierra(panDe(f.p1.x)); return; }
  if (h && h.vivo && h.k > 0.7 && !(h === yo && S.roto)) {
    /* se clava en el escudo y se queda con él: por dentro solo asoma la punta */
    f.est = 2; f.t1 = S.T; f.ql.copy(h.qEsc).invert().multiply(f.q); h.golpe = S.T;
    const cerca = Math.hypot(h.x - CAM.x, h.z - CAM.z) < 1.6;
    Son.madera(cerca ? 1 : 0.45, panDe(h.x)); if (cerca) { S.sacude = Math.max(S.sacude, 0.3); S.destello = Math.max(S.destello, 0.06); }
    if (h === yo) golpeEscudo();
    return;
  }
  /* sin escudo: el hombre cae (lo decide la salva) y el venablo queda tirado */
  alSuelo(f, f.p1.x + (azar() - 0.5) * 0.6, f.p1.z + (azar() - 0.5) * 0.6, true);
}
function golpeEscudo() {
  if (S.roto) return; S.golpes++; DANIO.value = TEX_DANIO[S.golpes <= 0 ? 0 : S.golpes <= 2 ? 1 : 2];
  if (S.golpes >= VIDA_ESCUDO) {
    S.roto = true; Son.crac(); grita('¡Mi escudo!'); S.sacude = Math.max(S.sacude, 0.5);
    const yo = S.romanos[YO]; PA.setFromMatrixPosition(yo.mEsc);
    ASTILLAS.forEach(a => { a.t = S.T; a.m.visible = true; a.m.position.set(PA.x + (azar() - 0.5) * 0.5, PA.y + (azar() - 0.5) * 1.1, PA.z); a.v.set((azar() - 0.5) * 2.4, 1 + azar() * 1.5, 0.4 + azar() * 1.6); a.w.set(azar() * 9, azar() * 9, azar() * 9); });
    for (const f of FL) if (f.est === 2 && f.h === yo) alSuelo(f, yo.x + (azar() - 0.5) * 0.5, yo.z - 0.7 - azar() * 0.5, true);
  }
}
/* los hombres que caen cuando llegan los venablos sin escudos (nunca tú, ni tu compañero, ni los dos de detrás) */
function bajas(n) {
  const no = [YO, CMP, FILES + YO, FILES + CMP], cand = S.romanos.filter(h => h.vivo && !no.includes(h.i)).sort((a, b) => (a.r + azar() * 2.5) - (b.r + azar() * 2.5));
  for (let i = 0; i < n && i < cand.length; i++) { const h = cand[i]; h.vivo = false; h.muere = S.T + azar() * 0.25; }
}
function llegaDescarga() {
  S.impacto = -1;
  if (S.k > 0.7) {
    S.encoge = S.T; S.sacude = 0.6; S.destello = 0.14; Son.trueno(1); grita(GRITOS.aguante);
    camBase(); for (let i = 0; i < 9; i++) { const q = POLVO.find(q => S.T - q.t > 3); if (!q) break; q.t = S.T + azar() * 0.2; q.e = 0.1 + azar() * 0.08; q.s.position.set(CAM.x + (azar() - 0.5) * 1.2, CAM.y + 0.2, CAM.z - 0.5 - azar() * 0.9); q.v.set(0, -0.45 - azar() * 0.3, 0); }
    if (S.roto) { bajas(1); cinta('Sin tu escudo, cae un hombre', false); } else cinta('¡Aguantan! Los venablos no pasan', true);
  }
  else { const n = S.k > 0.3 ? 1 : 2 + Math.floor(azar() * 3); bajas(n); S.sacude = 0.25; cinta(`¡Sin escudos! Caen ${n} hombres`, false); Son.trueno(0.5); }
}
function chispa(p, e) { const c = CHISPAS.find(c => S.T - c.t > 0.3); if (!c) return; c.t = S.T; c.s.position.copy(p); c.s.visible = true; c.e = e; const q = POLVO.find(q => S.T - q.t > 3); if (q) { q.t = S.T; q.e = 0.3 * e; q.s.position.copy(p); q.v.set(0, 0.25, 0); } }

/* ---------- órdenes ---------- */
function lanzarPila() {
  if (S.fase !== 'pila') return; S.fase = 'lanzando'; S.escudos = false; cinta('¡Pila!', true); Son.lanza();
  const blancos = S.tiradores.filter(t => t.vivo); let k = 0;
  for (const h of S.romanos) {
    if (!h.vivo || h.r > 1) continue; h.lanza = S.T + 0.45 + h.r * 0.25 + azar() * 0.1;
    const p = PILA[k++]; if (!p) break; const b = blancos[(k * 3) % Math.max(1, blancos.length)];
    p.est = 1; p.t0 = h.lanza + 0.47; p.dur = 1.3 + azar() * 0.2; p.p0 = new THREE.Vector3(h.x + 0.25, H(h.x, h.z) + 1.95, h.z - 0.45);
    const bx = b ? b.x + (azar() - 0.5) * 0.6 : (azar() - 0.5) * 8, bz = b ? b.z + (azar() - 0.5) * 0.6 : Z_TIRADORES;
    p.p1 = new THREE.Vector3(bx, H(bx, bz) + 0.5, bz); p.blanco = b; p.alto = 2.6 + azar() * 1.2;
  }
  S.tFin = S.T + 3;
}
function cargar() {
  if (S.fase !== 'cargar') return; S.fase = 'carga'; S.escudos = false; S.armas = 'espada'; cinta('¡Cargad!', true); Son.cuerno([[146.83, 0.35], [146.83, 0.35], [196, 1.1]]);
}

/* ---------- el paso de la simulación ---------- */
function paso(dt) {
  S.T += dt; const T = S.T, yo = S.romanos[YO], co = S.romanos[CMP];
  S.k += Math.sign((S.escudos ? 1 : 0) - S.k) * Math.min(Math.abs((S.escudos ? 1 : 0) - S.k), dt * 1.6);
  /* marcha */
  let v = 0;
  /* correr gasta el aliento en 5 s; al acabarse siguen al paso (no se paran) y no vuelven a correr hasta recobrar la mitad.
     Sin ese margen, con el botón pulsado, corrían y se paraban a cada instante: parecía que se quedaba pillado */
  if (S.aliento <= 0.02) S.agotado = true; else if (S.aliento >= 0.5) S.agotado = false;
  S.corriendo = S.fase === 'avance' && S.corre && !S.agotado && !S.escudos;
  if (S.corriendo) { S.aliento = Math.max(0, S.aliento - dt / 5); v = V_CORRE * (1 - S.k); } else S.aliento = Math.min(1, S.aliento + dt * 0.2);
  if (S.fase === 'avance' && (S.andando || S.corre) && !S.corriendo) v = lerp(V_PASO, V_TESTUDO, S.k);
  if (S.fase === 'carga' && !S.choque) v = V_CARGA;
  S.vel = v; S.zF -= v * dt; S.paso += v * dt;
  const np = Math.floor(S.paso / (v > 3 ? 1.9 : lerp(1.5, 1.05, S.k))); if (np !== S.nPaso) { S.nPaso = np; Son.paso(v > 3 ? 1.3 : 0.8, S.k); }
  if (Math.abs(S.k - S.kSon) > 0.03 || (S.k === 0 || S.k === 1) && S.kSon !== S.k) { S.kSon = S.k; Son.bajoTecho(S.k); }
  if (S.fase === 'avance' && S.zF <= Z_PILA) { S.zF = Z_PILA; S.fase = 'pila'; S.andando = false; cinta('¡A tiro de pilum! Lanza', true); }
  if (S.fase === 'carga' && S.zF <= Z_CHOQUE && !S.choque) {
    S.zF = Z_CHOQUE; S.choque = true; S.llegaron = vivos(); S.sacude = 0.9; Son.choque();
    for (const p of POLVO) { p.e = 1; p.t = T + azar() * 0.4; const x = (azar() - 0.5) * 8; p.s.position.set(x, H(x, Z_CHOQUE) + 0.4 + azar() * 0.6, Z_CHOQUE - 1 - azar() * 2.5); p.v.set((azar() - 0.5) * 1.5, 0.6 + azar() * 0.6, (azar() - 0.5) * 1.5); }
    S.galos.filter(g => g.fila === 0).slice(0, 8).forEach((g, i) => { if (i % 3 === 1) { g.vivo = false; g.muere = T + 0.2 + azar() * 0.6; } });
    S.tFin = T + 1.8;
  }
  if (S.fase === 'carga' && S.choque && T >= S.tFin) { S.fase = 'fin'; muestraFin(); }
  if (S.fase === 'lanzando' && T >= S.tFin) { S.fase = 'cargar'; cinta('Los tiradores huyen. ¡Carga!', true); }
  /* descargas: aviso 1,2 s antes de soltar */
  if (S.fase === 'avance') {
    if (!S.aviso && T >= S.proxima - 1.2) { S.aviso = true; cinta('¡Venablos! Escudos arriba', false); if (S.k > 0.3) grita(GRITOS.aviso); }
    if (T >= S.proxima) { S.aviso = false; S.proxima = T + CADA; descarga(); }
  }
  if (S.impacto > 0 && T >= S.impacto) llegaDescarga();
  if (S.tCinta && T - S.tCinta > 2.6 && !(S.aviso || S.impacto > 0)) cinta('', false);
  /* tu cabeza: avisa a los suyos, mira venir la salva, se encoge y luego se vuelve a animarlos; tu compañero te mira a ratos */
  const cerrado = S.k > 0.95, tras = T - S.encoge;
  const mio = !cerrado ? 0 : S.forzarMira ? 1 : S.aviso ? 1 : S.impacto > 0 ? 0 : tras > 0.55 && tras < 2.5 ? 1 : Math.sin(T * 0.9) > 0.9 ? 1 : 0;
  const suyo = cerrado && !S.aviso && S.impacto < 0 && tras > 2.6 && Math.sin(T * 0.7 + 2) > 0.88 ? 1 : 0;
  yo.mira += Math.max(-dt * 3.2, Math.min(dt * 3.2, mio - yo.mira)); co.mira += Math.max(-dt * 2.6, Math.min(dt * 2.6, suyo - co.mira));
  actualiza();
  /* venablos en el aire */
  for (const f of FL) {
    if (f.est !== 1 || T < f.t0) continue;
    const s = (T - f.t0) / f.dur;
    if (s >= 1) { f.p.copy(f.p1); aterriza(f); continue; }
    f.p.lerpVectors(f.p0, f.p1, s); f.p.y += f.alto * 4 * s * (1 - s);
    V3.subVectors(f.p1, f.p0); V3.y += f.alto * 4 * (1 - 2 * s); f.q.setFromUnitVectors(Z1, V3.normalize());
  }
  /* los clavados en escudos caen al bajar los escudos, si cae su hombre o si llevan ya mucho rato */
  for (const f of FL) if (f.est === 2 && (f.h.k < 0.7 || !f.h.vivo || T - f.t1 > 26)) { if (azar() < 0.4) alSuelo(f, f.h.x + (azar() - 0.5) * 0.8, f.h.z - 0.6 - azar() * 0.8, true); else f.est = 0; }
  /* polvo que cae o sube, astillas que saltan */
  for (const q of POLVO) if (T - q.t >= 0 && T - q.t < 3) q.s.position.addScaledVector(q.v, dt);
  for (const a of ASTILLAS) { if (T - a.t > 1.4 || a.t < 0) continue; a.v.y -= 9.8 * dt; a.m.position.addScaledVector(a.v, dt); a.m.rotation.x += a.w.x * dt; a.m.rotation.y += a.w.y * dt; const yg = H(a.m.position.x, a.m.position.z) + 0.02; if (a.m.position.y < yg) { a.m.position.y = yg; a.v.set(0, 0, 0); a.w.set(0, 0, 0); } }
  if (S.tGrito > 0 && T - S.tGrito > 1.7) { $('grito').classList.remove('ve'); S.tGrito = -9; }
  S.destello = Math.max(0, S.destello - dt);
  /* pila propios en el aire */
  for (const p of PILA) {
    if (p.est !== 1 || T < p.t0) continue;
    const s = (T - p.t0) / p.dur;
    if (s >= 1) {
      p.est = 2; const x = p.p1.x, z = p.p1.z;
      if (p.blanco && p.blanco.vivo) { p.blanco.vivo = false; p.blanco.muere = T; p.g.quaternion.setFromEuler(new THREE.Euler(0, azar() * 6.28, 0)); p.g.position.set(x + 0.5, H(x, z) + 0.03, z + 0.4); }
      else { V3.set(0, 0, 1).applyQuaternion(p.g.quaternion); p.g.position.set(x, H(x, z), z).addScaledVector(V3, -0.9); }
      if (azar() < 0.4) Son.tierra(panDe(x), 0);
      continue;
    }
    p.g.position.lerpVectors(p.p0, p.p1, s); p.g.position.y += p.alto * 4 * s * (1 - s);
    V3.subVectors(p.p1, p.p0); V3.y += p.alto * 4 * (1 - 2 * s); p.g.quaternion.setFromUnitVectors(Z1, V3.normalize());
  }
  /* los tiradores que quedan huyen tras los pila */
  if (S.fase === 'cargar' || S.fase === 'carga' || S.fase === 'fin') for (const t of S.tiradores) if (t.vivo) { t.huye = true; if (t.z > -122) t.z -= 4 * dt; }
  S.sacude = Math.max(0, S.sacude - dt);
  polvoPies(dt);
}

/* ---------- luz de cine: rayos por la rendija, motas en el aire y polvo de los pies (una llamada de dibujo cada uno) ---------- */
const DIR_LUZ = SOL.clone().negate();   /* hacia dónde va la luz del sol: hacia la cámara y algo abajo */
const TONO = '\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n';
/* rayos: cintas que miran siempre a la cámara, desde la rendija hacia atrás, a lo largo del sol */
const NRAYOS = 11, RAYOS_U = { uBase: { value: new THREE.Vector3() }, uDir: { value: DIR_LUZ }, uCam: { value: new THREE.Vector3() }, uT: { value: 0 }, uI: { value: 0 } };
const rayos = (() => {
  const g = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1, 1, 6)); g.instanceCount = NRAYOS;
  const a = [], f = []; for (let i = 0; i < NRAYOS; i++) { a.push(-2.1 + 4.2 * (i + azarV() * 0.6) / NRAYOS, 1.6 + azarV() * 0.32, 2.6 + azarV() * 1.6, 0.05 + azarV() * 0.14); f.push(azarV()); }
  g.setAttribute('aRayo', new THREE.InstancedBufferAttribute(new Float32Array(a), 4)); g.setAttribute('aFase', new THREE.InstancedBufferAttribute(new Float32Array(f), 1));
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: RAYOS_U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: `attribute vec4 aRayo; attribute float aFase; uniform vec3 uBase, uDir, uCam; uniform float uT, uI; varying vec2 vUv; varying float vA;
      void main(){ float t = position.y + 0.5; vec3 o = uBase + vec3(aRayo.x, aRayo.y, 0.0), p0 = o + uDir * t * aRayo.z;
        vec3 lado = normalize(cross(uDir, uCam - p0)); vec3 p = p0 + lado * position.x * aRayo.w * (1.0 + t * 0.6);
        vUv = vec2(position.x * 2.0, t); vA = uI * (0.7 + 0.3 * sin(uT * 1.3 + aFase * 6.28)) * smoothstep(0.7, 1.8, distance(p, uCam));
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `varying vec2 vUv; varying float vA; void main(){ float a = 1.0 - vUv.x * vUv.x; a *= a * smoothstep(0.0, 0.12, vUv.y) * pow(1.0 - vUv.y, 1.4);
      gl_FragColor = vec4(vec3(1.0, 0.78, 0.5) * a * vA, 1.0);` + TONO + `}` }));
  m.frustumCulled = false; m.renderOrder = 5; m.visible = false; escena.add(m); return m;
})();
/* motas de polvo en el aire alrededor de la cámara: brillan mirando al sol; bajo el techo, solo dentro del haz de la rendija */
const MOTAS_U = { uCam: { value: new THREE.Vector3() }, uSol: { value: SOL }, uT: { value: 0 }, uK: { value: 0 }, uEsc: { value: 400 }, uRay: { value: new THREE.Vector2() } };
const motas = (() => {
  const n = 520, pos = new Float32Array(n * 3), tam = new Float32Array(n); for (let i = 0; i < n; i++) { pos[i * 3] = azarV(); pos[i * 3 + 1] = azarV(); pos[i * 3 + 2] = azarV(); tam[i] = 0.006 + azarV() * azarV() * 0.022; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: MOTAS_U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute float aTam; uniform vec3 uCam, uSol; uniform float uT, uK, uEsc; uniform vec2 uRay; varying float vB;
      void main(){ vec3 caja = vec3(8.0, 3.6, 11.0), c = uCam + vec3(0.0, 0.2, -4.5);
        vec3 q = position * caja + vec3(sin(uT * 0.35 + aTam * 300.0) * 0.25, uT * 0.04 + sin(uT * 0.5 + position.x * 20.0) * 0.08, uT * 0.18);
        vec3 p = c + (fract((q - c) / caja + 0.5) - 0.5) * caja; float d = distance(p, uCam);
        float b = pow(max(dot(normalize(p - uCam), uSol), 0.0), 5.0) * 1.7 + 0.1;
        float haz = (1.0 - smoothstep(0.1, 0.32, abs(p.y - (uRay.x + (p.z - uRay.y) * -0.35)))) * step(uRay.y, p.z);
        vB = b * mix(1.0, haz * 1.4, uK) * smoothstep(0.12, 0.5, d) * (1.0 - smoothstep(6.0, 9.0, d));
        vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(aTam * uEsc / -mv.z, 1.0, 14.0); }`,
    fragmentShader: `varying float vB; void main(){ vec2 c = gl_PointCoord - 0.5; float a = 1.0 - smoothstep(0.15, 0.5, length(c));
      gl_FragColor = vec4(vec3(1.0, 0.86, 0.62) * a * vB * 0.35, 1.0);` + TONO + `}` }));
  m.frustumCulled = false; m.renderOrder = 6; escena.add(m); return m;
})();
/* polvo que levantan los pies: nubecillas que nacen a ras de suelo, suben, se abren y se van; a contraluz se doran */
const NPIES = 200, PIES_U = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSol: { value: SOL }, uCam: { value: new THREE.Vector3() }, uEsc: { value: 400 } };
const PIES = Array.from({ length: NPIES }, () => ({ t: -9, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 1 }));
const pies = (() => {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NPIES * 3), 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aVida', new THREE.BufferAttribute(new Float32Array(NPIES * 2), 2).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: PIES_U, transparent: true, depthWrite: false, fog: true,
    vertexShader: `attribute vec2 aVida; uniform vec3 uSol, uCam; uniform float uEsc; varying float vA, vB;
      #include <fog_pars_vertex>
      void main(){ float e = aVida.x; vec4 mv = viewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = e > 0.999 ? 0.0 : clamp((0.8 + e * 1.6) * aVida.y * uEsc / -mv.z, 1.0, 300.0);
        vA = smoothstep(0.0, 0.12, e) * (1.0 - e) * (1.0 - e) * smoothstep(1.0, 3.5, -mv.z); vB = pow(max(dot(normalize(position - uCam), uSol), 0.0), 2.0);
        vec4 mvPosition = mv;
        #include <fog_vertex>
      }`,
    fragmentShader: `varying float vA, vB;
      #include <fog_pars_fragment>
      void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c); float a = (1.0 - smoothstep(0.0, 0.5, r)) * (1.0 - smoothstep(0.0, 0.5, r)) * vA * 0.6;
        gl_FragColor = vec4(mix(vec3(0.38, 0.27, 0.17), vec3(0.95, 0.66, 0.4), vB), a);   /* GM43e: del color de la senda de tierra */
        #include <fog_fragment>
      ` + TONO + `}` }));
  m.frustumCulled = false; m.renderOrder = 4; escena.add(m); return m;
})();
function polvoPies(dt) {
  const v = S.vel;
  const tasa = v <= 0 ? 0 : (v > 3 ? 75 : 36) * (1 - S.k * 0.5);
  let nace = tasa * dt + (S.restoPolvo || 0); const vivosR = S.romanos.filter(h => h.vivo && h.z < CAM.z - 1.2);   /* solo los que tiene delante la cámara */
  while (nace >= 1 && vivosR.length) {
    nace--; const p = PIES.find(p => S.T - p.t > 1.8); if (!p) break; const h = vivosR[Math.floor(azarV() * vivosR.length)];
    p.t = S.T - azarV() * 0.3; p.x = h.x + (azarV() - 0.5) * 0.9; p.z = h.z - 0.2 + azarV() * 0.8; p.y = H(p.x, p.z) + 0.3 + azarV() * 0.15; p.vx = (azarV() - 0.5) * 0.3; p.vy = 0.15 + azarV() * 0.25; p.vz = 0.3 + azarV() * 0.5 + v * 0.15; p.s = 0.6 + azarV() * 0.8;
  }
  S.restoPolvo = nace;
  for (const p of PIES) { const a = S.T - p.t; if (a < 0 || a > 1.8) continue; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy *= 1 - dt * 0.8; p.vz *= 1 - dt * 0.6; }
}
function dibujaPolvo() {
  const pa = pies.geometry.attributes.position, va = pies.geometry.attributes.aVida;
  PIES.forEach((p, i) => { const a = (S.T - p.t) / 1.8; pa.setXYZ(i, p.x, p.y, p.z); va.setXY(i, a >= 0 && a < 1 ? a : 1, p.s); });
  pa.needsUpdate = va.needsUpdate = true;
}

/* ---------- dibujo ---------- */
const figuras = {};
function malla(tipo, n, color) {
  const u = getUnit(tipo), g = instancedGeometry(u, n), mat = unitMaterialReal(u, color), antes = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => { antes(sh, r); cine(sh, 1.3); }; mat.customProgramCacheKey = () => 'aqvila-real-cine';
  const m = new THREE.InstancedMesh(g, mat, n);
  m.frustumCulled = false; escena.add(m); figuras[tipo] = { m, u, fr: g.attributes.aFrame }; return figuras[tipo];
}
const O = new THREE.Object3D(), CERO = m4().makeScale(0, 0, 0);
function pon(fig, i, x, y, z, yaw, frame) { O.position.set(x, y, z); O.rotation.set(0, yaw, 0); O.scale.setScalar(E); O.updateMatrix(); fig.m.setMatrixAt(i, O.matrix); fig.fr.array[i] = frame; }
/* el pilum en la mano: de pie en la marcha, tendido hacia delante bajo los escudos, y al hombro para lanzar */
const Q_PIE = giro(1, 0, 0, -Math.PI / 2 - 0.1), Q_TENDIDO = giro(1, 0, 0, 0.1).multiply(Q_PI), Q_LANZA = giro(1, 0, 0, 0.3).multiply(Q_PI);
const MARCA = MARCAS ? Array.from({ length: 6 }, () => { const d = document.createElement('i'); d.style.cssText = 'position:absolute;width:8px;height:8px;margin:-4px;border-radius:50%;background:#0ff;border:1px solid #000;z-index:9'; $('hud').appendChild(d); return d; }) : null;
function dibuja() {
  const T = S.T, k = S.k, R = S.romanos, yo = R[YO], co = R[CMP];
  /* romanos: figura, escudo y lo que llevan en la mano derecha */
  for (const h of R) {
    const i = h.i;
    HOM.cuerpos.setMatrixAt(i, h.oculto ? CERO : h.inst); HOM.fr.array[i] = h.A; HOM.fr2.array[i] = h.B; HOM.mx.array[i] = h.mx;
    HOM.escudos.setMatrixAt(i, h === yo ? CERO : h.mEsc);
    const mano = S.armas === 'espada' || !h.vivo || h.tiro;
    HOM.espadas.setMatrixAt(i, mano && !h.oculto ? MA.multiplyMatrices(h.inst, hueso(HU.espada, h.A, h.B, h.mx, MB)) : CERO);
    if (S.armas === 'pilum' && h.vivo && !h.tiro && !h.oculto) {
      const tl = T - h.lanza, lz = tl > 0 ? suave(0, 0.3, tl) : 0;
      ancla(h, HU.espada, [0, 0, 0], PA); QA.copy(Q_PIE).slerp(Q_TENDIDO, h.k); if (lz) QA.slerp(Q_LANZA, lz);
      V3.set(0, 0, 1).applyQuaternion(QA); PA.addScaledVector(V3, lerp(lerp(0.75, 0.25, h.k), 0.1, lz)); if (!lz) PA.y += 0.04 * h.k;
      HOM.pila.setMatrixAt(i, MA.compose(PA, QA, SA.set(1, 1, 1)));
    } else HOM.pila.setMatrixAt(i, CERO);
  }
  for (const m of [HOM.cuerpos, HOM.escudos, HOM.espadas, HOM.pila]) m.instanceMatrix.needsUpdate = true;
  HOM.fr.needsUpdate = HOM.fr2.needsUpdate = HOM.mx.needsUpdate = true;
  HOM.mio.visible = !S.roto; HOM.mio.matrix.copy(yo.mEsc); HOM.mio.matrixWorld.copy(yo.mEsc);
  /* enemigos */
  const P = figuras.peltastas, CP = P.u.clips;
  S.tiradores.forEach((t, i) => {
    let fr, yaw = 0;
    if (!t.vivo) fr = frameOnce(CP.death, Math.max(0, T - t.muere));
    else if (t.huye) { fr = frameOf(CP.run, T + t.fase); yaw = Math.PI; }
    else if (t.tira !== undefined && T - t.tira < 2.4 && T - t.tira > -1.5) fr = frameOnce(CP.attack_ranged, (T - t.tira + 1.5) * 1.3);
    else fr = frameOf(CP.idle, T + t.fase);
    pon(P, i, t.x, H(t.x, t.z), t.z, yaw, fr);
  });
  P.m.instanceMatrix.needsUpdate = true; P.fr.needsUpdate = true;
  const G = figuras.galos, CG = G.u.clips;
  S.galos.forEach((g, i) => {
    const fr = !g.vivo ? frameOnce(CG.death, Math.max(0, T - g.muere)) : S.choque && g.fila === 0 ? frameOf(CG.attack_melee, T + g.fase) : frameOf(CG.idle, T + g.fase);
    pon(G, i, g.x, H(g.x, g.z), g.z, 0, fr);
  });
  G.m.instanceMatrix.needsUpdate = true; G.fr.needsUpdate = true;
  /* venablos: en vuelo, clavados en un escudo (van con él) o en tierra */
  FL.forEach((f, i) => {
    if (f.est === 0 || (f.est === 1 && T < f.t0)) { flechas.setMatrixAt(i, CERO); return; }
    if (f.est === 2) { f.q.copy(f.h.qEsc).multiply(f.ql); V3.set(0, 0, 1).applyQuaternion(f.q); f.p.copy(f.rel).applyMatrix4(f.h.mEsc).addScaledVector(V3, -PUNTA); }
    O.position.copy(f.p); O.quaternion.copy(f.q); O.scale.setScalar(1); O.updateMatrix(); flechas.setMatrixAt(i, O.matrix);
  });
  flechas.instanceMatrix.needsUpdate = true;
  for (const c of CHISPAS) { const a = T - c.t; c.s.visible = a >= 0 && a < 0.25; if (c.s.visible) { c.s.scale.setScalar((c.e || 1) * (0.6 + a * 5)); c.s.material.opacity = 1 - a / 0.25; } }
  for (const p of POLVO) { const a = T - p.t; p.s.visible = a >= 0 && a < 3; if (p.s.visible) { const e = p.e || 1; p.s.scale.setScalar(e * (1.2 + a * 1.6)); p.s.material.opacity = 0.85 * (1 - a / 3) * (e < 1 ? Math.max(0, 1 - a) : 1); } }
  for (const p of PILA) p.g.visible = p.est === 1 ? T >= p.t0 : p.est === 2;
  /* la cámara (ver camBase), con cabeceo al paso, temblor al correr y sacudida con giro cuando cae cada salva */
  camBase(); const andar = S.vel > 0 ? (S.corriendo ? 2.5 : 1) : 0, ph = S.paso / lerp(1.5, 1.05, k) * Math.PI, sc = S.sacude;
  let cx = CAM.x + Math.sin(ph) * 0.025 * andar, cy = CAM.y + Math.abs(Math.sin(ph)) * 0.04 * andar;
  const sac = (S.fase === 'carga' && !S.choque ? 0.06 : 0) + (S.corriendo ? 0.02 : 0) + sc * 0.09;
  cx += (Math.random() - 0.5) * sac; cy += (Math.random() - 0.5) * sac - sc * sc * 0.12;
  camara.position.set(cx, cy, CAM.z);
  /* luz: dentro, penumbra cálida; por la rendija entra el sol de frente */
  LUZ.value = lerp(1, 0.82, k); AMB.value = lerp(1, 0.3, k); relleno.intensity = lerp(0.55, 0.12, k);
  {
    const dx = lerp(ABIERTO.dx, CERRADO.dx, k), dz = lerp(ABIERTO.dz, CERRADO.dz, k), cz = S.zF + FILAS * dz * 0.4;
    luz.target.position.set(0, H(0, cz), cz); luz.position.copy(luz.target.position).addScaledVector(SOL, 45);
    FORMA.value.set(-FILES / 2 * dx - 0.25, S.zF - 0.55, FILES / 2 * dx + 0.25, S.zF + (FILAS - 0.5) * dz); FORMA_K.value = k;
    const esc = renderer.domElement.height * camara.projectionMatrix.elements[5] / 2, yR = H(0, S.zF) + 1.62;
    RAYOS_U.uBase.value.set((yo.x + co.x) / 2 - 0.1, H(0, S.zF), S.zF - MURO_Z - 0.15); RAYOS_U.uCam.value.copy(camara.position); RAYOS_U.uT.value = T; RAYOS_U.uI.value = 0.5 * suave(0.6, 1, k);
    rayos.visible = k > 0.6;
    MOTAS_U.uCam.value.copy(camara.position); MOTAS_U.uT.value = T; MOTAS_U.uK.value = suave(0.4, 1, k); MOTAS_U.uEsc.value = esc; MOTAS_U.uRay.value.set(yR + 0.15, S.zF - MURO_Z);
    PIES_U.uCam.value.copy(camara.position); PIES_U.uEsc.value = esc; dibujaPolvo();
  }
  const yF = H(CAM.x, S.zF);
  dentro.position.set(cx, cy + 0.05, CAM.z + 0.2); dentro.intensity = 0.5 * k + S.destello * 22;
  rendija.position.set((yo.x + co.x) / 2, yF + 1.6, S.zF - 0.75); rendija.intensity = (0.8 + 1.6 * suave(0, 1, yo.mira)) * k;   /* cuando se vuelve, la rendija le da en la cara */
  const cerca = lerp(0.08, 0.05, k);
  if (camara.fov !== CAM.fov || camara.near !== cerca) { camara.fov = CAM.fov; camara.near = cerca; camara.updateProjectionMatrix(); }
  camara.rotation.set(CAM.pitch + Math.sin(ph * 2) * 0.005 * andar + Math.sin(T * 47) * sc * 0.06 - sc * sc * 0.1, CAM.yaw + Math.sin(ph) * 0.004 * andar + Math.sin(T * 39) * sc * 0.03, Math.sin(T * 31) * sc * 0.1);
  camara.updateMatrixWorld();
  /* penumbra por encima del canto del techo y por debajo del canto del muro */
  $('sombra').classList.toggle('ve', k > 0.5);
  if (k > 0.02) {
    const a = PA.set(CAM.x, yF + MURO_Y + 0.6, S.zF - MURO_Z).project(camara).y, b = PB.set(CAM.x, yF + TECHO_Y, S.zF - 0.2).project(camara).y;
    const ri = Math.max(2, Math.min(95, (a + 1) * 50)), rs = Math.max(ri + 4, Math.min(98, (b + 1) * 50));
    document.documentElement.style.setProperty('--ri', ri.toFixed(1) + '%'); document.documentElement.style.setProperty('--rs', rs.toFixed(1) + '%');
  }
  if (MARCA) [[yo, HU.cara, [0, 0, 0.25]], [yo, HU.escudo, [0, 0, 0]], [yo, HU.espada, [0, 0, 0]], [co, HU.cara, [0, 0, 0.25]], [co, HU.escudo, [0, 0, 0]], [R[FILES + YO], HU.escudo, [0, 0, 0]]].forEach(([h, s, p], i) => { ancla(h, s, p, PA).project(camara); MARCA[i].style.left = ((PA.x + 1) * 50) + '%'; MARCA[i].style.top = ((1 - PA.y) * 50) + '%'; MARCA[i].style.display = PA.z < 1 ? '' : 'none'; });
  renderer.render(escena, camara);
}

/* ---------- interfaz ---------- */
function hud() {
  const n = vivos(), f = n / M, b = $('barra').firstElementChild;
  $('cuenta').textContent = n + '/' + M; b.style.width = (f * 100).toFixed(0) + '%'; b.style.background = f > 0.7 ? 'var(--verde)' : f > 0.45 ? '#e6ac3c' : 'var(--rojo)';
  const av = $('avanzar'), es = $('escudos'), ac = $('accion'), co = $('correr');
  co.hidden = S.fase !== 'avance'; co.classList.toggle('activa', S.corriendo); co.classList.toggle('cansado', S.agotado); $('aliento').style.width = (S.aliento * 100).toFixed(0) + '%'; $('correr-t').textContent = S.agotado ? 'Sin aliento' : 'Correr';
  const me = $('miescudo'); me.setAttribute('class', S.roto ? 'roto' : 'e' + (S.golpes <= 0 ? 0 : S.golpes <= 2 ? 1 : 2)); me.title = S.roto ? 'Tu escudo está roto' : 'Tu escudo';
  av.hidden = S.fase !== 'avance'; av.classList.toggle('activa', S.andando);
  es.hidden = !(S.fase === 'avance' || S.fase === 'pila'); es.classList.toggle('activa', S.escudos); es.classList.toggle('pide', S.aviso && !S.escudos);
  $('escudos-t').textContent = S.escudos ? 'Bajar escudos' : 'Escudos';
  ac.hidden = !(S.fase === 'pila' || S.fase === 'cargar'); $('accion-t').textContent = S.fase === 'cargar' ? '¡Cargar!' : 'Lanzar pila';
  ac.classList.toggle('pide', !ac.hidden);
  $('objetivo').textContent = S.fase === 'avance' ? 'Lleva el cuerpo hasta la loma' : S.fase === 'pila' || S.fase === 'lanzando' ? 'Lanza los pila' : 'Carga contra su línea';
}
function muestraFin() {
  const n = S.llegaron; $('fin-t').textContent = n >= M * 0.8 ? '¡Choque!' : n >= M * 0.5 ? 'Llegasteis' : 'Llegasteis a duras penas';
  $('fin-p').textContent = `Llegaron ${n} de ${M} hombres. ` + (n >= M * 0.8 ? 'El testudo aguantó los venablos.' : 'Sube los escudos a tiempo cuando suene el aviso.');
  $('fin').hidden = false;
}
/* el sonido arranca con el primer toque (el navegador no deja antes) y lo abre el cuerno */
addEventListener('pointerdown', () => { if (!Son.listo() && Son.inicia()) { Son.bajoTecho(S.k); Son.cuerno(); } }, { once: true });
const avanzar = $('avanzar');
avanzar.addEventListener('pointerdown', e => { e.preventDefault(); try { avanzar.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } S.andando = true; });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) avanzar.addEventListener(ev, () => { S.andando = false; });
const correr = $('correr');
correr.addEventListener('pointerdown', e => { e.preventDefault(); try { correr.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } S.corre = true; if (S.escudos) Son.clac(6); S.escudos = false; });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) correr.addEventListener(ev, () => { S.corre = false; });
$('escudos').addEventListener('pointerdown', e => { e.preventDefault(); S.escudos = !S.escudos; if (S.escudos) S.corre = false; Son.clac(S.escudos ? 10 : 6); });
$('accion').addEventListener('pointerdown', e => { e.preventDefault(); if (S.fase === 'pila') lanzarPila(); else cargar(); });
$('otra').addEventListener('click', () => { location.href = location.pathname; });
$('salir').addEventListener('click', () => { location.href = document.baseURI; });

/* ---------- fases para las capturas: colocan la escena y la congelan ---------- */
let parado = false;
const salta = s => { for (let t = 0; t < s; t += 1 / 30) paso(1 / 30); };
function prepara(f) {
  if (f === 'avance') { S.zF = -14; S.proxima = 99; S.andando = true; salta(1.3); }
  if (f === 'flechas') { S.zF = -28; S.andando = true; S.proxima = S.T + 1.25; salta(1.25 + 0.8); }
  if (['testudo', 'cara', 'mira', 'roto', 'pila', 'final', 'carga'].includes(f)) {
    S.zF = -30; S.andando = true; S.proxima = S.T + 0.5; salta(3.2);
    S.escudos = true; S.proxima = S.T + 0.6; salta(3.4);
    if (f === 'roto') for (let i = 0; i < 3; i++) { S.proxima = S.T + 0.3; salta(2.9); }
    if (f === 'testudo' || f === 'cara' || f === 'mira' || f === 'roto') S.zF = -50;
    S.proxima = S.T + 0.5; salta(f === 'testudo' ? 0.5 + 1.9 : f === 'mira' ? 0.5 + 2.2 + 1.5 : f === 'cara' || f === 'roto' ? 0.5 + 2.2 + 0.3 : 3);
  }
  if (f === 'pila' || f === 'final' || f === 'carga') { S.zF = Z_PILA + 0.5; salta(1); S.escudos = false; salta(0.9); lanzarPila(); salta(f === 'pila' ? 1.45 : 3.2); }
  if (f === 'final') { cargar(); salta(8); }
  if (f === 'carga') { cargar(); salta(2.6); }
  if (['testudo', 'cara', 'mira', 'roto'].includes(f)) S.andando = true;
  parado = true;
}

/* ---------- arranque ---------- */
let ultimo = 0, CAMPO = null;
function bucle(t) {
  if (CAMPO) CAMPO.tick(t / 1000);
  const dt = Math.min(0.05, (t - ultimo) / 1000 || 0); ultimo = t;
  if (!parado) paso(dt);
  dibuja(); hud(); requestAnimationFrame(bucle);
}
/* para las pruebas: el estado y dónde caen en pantalla (0 a 1) tu cabeza, la de tu compañero, la rendija y el enemigo */
const enPantalla = v => { v.project(camara); return { x: +((v.x + 1) / 2).toFixed(3), y: +((1 - v.y) / 2).toFixed(3), delante: v.z < 1 }; };
window.__tp = {
  lista: false, S, CAM, camara, Son, luz, renderer, escena, cine: { rayos, motas, pies, cielo, PIES }, salta: s => salta(s), parar: v => { parado = v; },
  estado: () => ({ golpes: S.golpes, roto: S.roto, clavados: FL.filter(f => f.est === 2).length, enHombre: FL.filter(f => f.est === 2 && f.h.k < 0.7).length, andando: S.andando, corriendo: S.corriendo, vel: S.vel, fase: S.fase, zF: S.zF, k: S.k, vivos: vivos(), flechas: FL.filter(f => f.est).length, mira: S.romanos[YO].mira, enc: S.romanos[YO].enc }),
  encuadre: () => { const R = S.romanos, yF = H(CAM.x, S.zF); return { yo: enPantalla(ancla(R[YO], HU.cara, [0, 0, 0.25], new THREE.Vector3())), comp: enPantalla(ancla(R[CMP], HU.cara, [0, 0, 0.25], new THREE.Vector3())), rendija: enPantalla(new THREE.Vector3((R[YO].x + R[CMP].x) / 2, yF + 1.8, S.zF - MURO_Z)), enemigo: enPantalla(new THREE.Vector3(0, H(0, Z_TIRADORES) + 1, Z_TIRADORES)), muro: enPantalla(new THREE.Vector3(CAM.x, yF + MURO_Y + 0.72, S.zF - MURO_Z)), techo: enPantalla(new THREE.Vector3(CAM.x, yF + TECHO_Y + 0.03, S.zF + CERRADO.dz - TECHO_Z - 0.72)) }; },
  /* para comprobar las cuentas: dónde están de verdad cabeza y manos de un hombre */
  medidas: i => { const h = S.romanos[i], y0 = H(h.x, h.z), r = p => [+(p.x - h.x).toFixed(3), +(p.y - y0).toFixed(3), +(p.z - h.z).toFixed(3)]; return { cabeza: r(ancla(h, HU.cara, [0, 0, 0.25], new THREE.Vector3())), manoI: r(ancla(h, HU.escudo, [0, 0, 0], new THREE.Vector3())), escudo: r(new THREE.Vector3().setFromMatrixPosition(h.mEsc)), manoD: r(ancla(h, HU.espada, [0, 0, 0], new THREE.Vector3())) }; },
};
(async () => {
  await preload(['hastati', 'peltastas', 'galos']);
  { const td = await new THREE.TextureLoader().loadAsync('gobierno/maquetas/testudo-luz-campo/arte/detalle.png'); td.wrapS = td.wrapT = THREE.RepeatWrapping; td.anisotropy = 4; DET.value = td; }
  if (!getUnit('hastati') || !getUnit('peltastas') || !getUnit('galos')) { $('carga').querySelector('p').textContent = 'No se han podido cargar los soldados'; throw new Error('No se han podido cargar los soldados'); }
  CAMPO = await crearCampo(escena, { H, SOL, cine, sueloCine, BRUMA: escena.fog.color });
  await creaHombres(); malla('peltastas', 10, '#3456a8'); malla('galos', 16, '#3456a8');
  reinicia();
  if (FASE) prepara(FASE);
  $('carga').hidden = true;
  requestAnimationFrame(t => { ultimo = t; bucle(t); });
  setTimeout(() => { window.__tp.lista = true; }, 400);
})();
