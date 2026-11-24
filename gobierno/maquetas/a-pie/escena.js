/* Escena a pie (TP1): une la maqueta A (testudo-pilum-a: avance bajo venablos, testudo, mantener y soltar el pilum, dos
   salvas, galos que cargan, pila en sus escudos, carga) y la B (testudo-lucha: duelos por parejas, relevo, caídos que se
   quedan, cámara de la lucha). Lo nuevo de TP1: andar y correr de cada hombre (locomocion.js).
   Hecha de piezas, cada una con su contrato (ver la cabecera de cada archivo):
     unidad.js (números) · formacion.js (testudo) · locomocion.js (paso de cada hombre) · soldado.js (figura y tabla de huesos)
     acciones.js (lanzar y luchar) · enemigo.js (galos) · camara.js · hud.js (botones y avisos) · sonido.js · campo.js
   Esta escena.js junta las piezas: fases, bucle, efectos (venablos, pila, polvo, luz) y dibujo.
   Soldados, escudos y galos: arte de 0 A.D. (Wildfire Games, CC BY-SA 3.0); el arte del campo, de testudo-luz-campo/arte/.
   No toca nada de js/: solo lo importa. Idea de cámara tomada de Ryse: Son of Rome (solo la idea).
   ?fase=avance|flechas|testudo|cara|mira|roto|pila|armar|vuelo|impacto|carga|lucha|final coloca la escena y la congela.
   ?costado=r|g pone la cámara de costado (romanos o galos), para mirar los pies. ?antes=1, el andar de la maqueta A (comparar).
   ?marcas=1 pinta puntos donde las cuentas dicen que están cabeza y manos. */
import { THREE } from '../../../js/gfx/models.js';
import { preload, getUnit, loadIndex, unitMaterialReal, instancedGeometry, frameOf, frameOnce, zancadas, UNIT_SCALE } from '../../../js/gfx/units.js';
import { texturaRuido } from '../../../js/gfx/ground.js';
import { crearCampo } from './campo.js';
import { H as HU } from './esqueleto.js';
import { crearUnidad, palabras, veredicto } from './unidad.js';
import { REF_R, FILES, FILAS, M, ABIERTO, CERRADO, YO, CMP, ySup, MURO_Y, MURO_Z, TECHO_Y, TECHO_Z, TECHO_SUBE, ALERO, CORRE, puesto, holgura } from './formacion.js';
import { crearPaso, velocidad, pisa, dispersion, MARCHA } from './locomocion.js';
import { CJ, generaTabla, hueso as huesoT, datosPies, pieEn, faseCero, filasMarcha, filaEnFase, tablaPaso } from './soldado.js';
import { creaGalos, marchaGalos, filasGalo, conMezcla } from './enemigo.js';
import { crearAcciones, RESERVA_G, N_GF } from './acciones.js';
import { crearCamara } from './camara.js';
import { crearHud } from './hud.js';
import * as Son from './sonido.js';
import { crearFisicaEscena } from './fisica.js';   /* FI2 */
import { crearProyectilesEscena } from './proyectiles.js';   /* FI3 */

const Q = new URLSearchParams(location.search), FASE = Q.get('fase'), MARCAS = Q.get('marcas'), ANTES = Q.get('antes') === '1', COSTADO = Q.get('costado'), FUERA = Q.get('vista') === 'fuera';
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

/* ---------- números de la maqueta ----------
   OJO A LA ESCALA: las figuras de 0 A.D. miden 2,15 «metros» con UNIT_SCALE (se eligió para verlas de lejos en el mapa de
   batalla), no 1,70. Todo lo de aquí (techo, muro, cámara, venablos) va en esa escala y se coloca desde los huesos de cada
   hombre, no a ojo. Ese era el desfase de la versión anterior: techo y cámara estaban puestos para hombres de 1,70. */
const E = UNIT_SCALE, GRANDE = 1.26;
const Z_TIRADORES = -100, Z_GALOS = -106, Z_PILA = -75;
/* GM43h: los galos se vienen al paso vivo y, a 9 m, a la carrera; a esa distancia salen también los tuyos con el gladio.
   El medidor del tiro sube en 0,9 s y vuelve a bajar; soltar con él por encima de ZONA es buen tiro. Entre salva y salva, 2 s */
const V_GALO = 2.2, V_GALO_CORRE = 5, D_GLADIO = 9, T_MEDIDOR = 0.9, ZONA = 0.72, RECARGA = 2, VUELO_PILUM = 1.2;
const V_CORRE = 5, V_PASO = 1.8, V_TESTUDO = 0.9, V_CARGA = 5.5, VUELO = 2.2, CADA = 8;
/* el escudo (medidas del modelo, en sus unidades): 1,58 de ancho, 2,98 de alto, curvo con radio 1,05 */
/* dónde va el centro de cada escudo respecto a su hombre (metros): muro delante, techo sobre la cabeza y algo adelantado,
   con el canto de delante un poco más alto (así el escudo de atrás monta sobre el de delante, como las tejas) */
/* el techo va corrido media fila hacia la izquierda, como los ladrillos: la junta de dos escudos del techo cae sobre un
   hombre del muro, y el lomo (lo más alto) sobre el hueco entre dos hombres, que es por donde se mira */
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
/* GM43h: los pila lanzados, todos en una sola malla de instancias (dos salvas de las dos primeras filas). est: 0 nada,
   1 en la mano a punto de salir, 2 en el aire, 3 en tierra (clavado o tumbado), 4 clavado en el escudo de un galo */
const NPILA = FILES * 4, pilaVuelo = new THREE.InstancedMesh(geoPilum, matAsta, NPILA); pilaVuelo.frustumCulled = false; pilaVuelo.castShadow = true; escena.add(pilaVuelo);
const PILA = Array.from({ length: NPILA }, () => ({ est: 0, p: new THREE.Vector3(), q: new THREE.Quaternion(), m: new THREE.Matrix4(), rel: new THREE.Matrix4(), p0: new THREE.Vector3(), p1: new THREE.Vector3() }));

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

let HOM = null, ACC = null;   /* todo lo de los hastati: mallas, tabla y esqueleto */
const m4 = () => new THREE.Matrix4(), _e = new Array(12);
/* la matriz de un hueso, mezclando dos filas igual que el sombreador (soldado.js) */
const hueso = (slot, A, B, mx, out) => huesoT(HOM, slot, A, B, mx, out);
async function creaHombres() {
  const idx = await loadIndex(), meta = idx.hastati, u = getUnit('hastati');
  const buf = await (await fetch('assets/units/hastati.bin')).arrayBuffer(), CELL = new Uint8Array(buf, meta.off[6], meta.verts);
  const tab = generaTabla(u.bones.image.data, meta, u.geo, E);
  const tex = new THREE.DataTexture(tab.T, tab.hues * 3, tab.total, THREE.RGBAFormat, THREE.FloatType); tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const gc = parte(u.geo, CELL, [0, 1, 2, 3], true), ia = () => { const a = new THREE.InstancedBufferAttribute(new Float32Array(M), 1); a.setUsage(THREE.DynamicDrawUsage); return a; };
  const fr = ia(), fr2 = ia(), mx = ia(); gc.setAttribute('aFrame', fr); gc.setAttribute('aFrame2', fr2); gc.setAttribute('aMix', mx);
  /* GM43d-C: cada hombre, el suyo: piel, túnica, pelo y desgaste (y su escudo: pintura, gasto, barro y semilla). Azar fijo. */
  let sv = 7; const az = () => { sv = (sv * 16807) % 2147483647; return (sv - 1) / 2147483646; };
  const vh = new Float32Array(M * 4), ve = new Float32Array(M * 4);
  for (let i = 0; i < M; i++) { vh.set([az(), az(), az(), 0.25 + 0.75 * az()], i * 4); ve.set([az(), 0.25 + 0.75 * az(), 0.3 + 0.7 * az(), az()], i * 4); }
  const vA = new THREE.InstancedBufferAttribute(new Float32Array(vh), 4); vA.setUsage(THREE.DynamicDrawUsage); gc.setAttribute('aVar', vA);
  /* TP8b-E2: el cuerpo sencillo de los lejanos (lo de la falange): mismos huesos, vértices fundidos en rejilla */
  const gL = sencillo(gc, REJILLA), LR = { fr: ia(), fr2: ia(), mx: ia(), vA: new THREE.InstancedBufferAttribute(new Float32Array(M * 4), 4), vh };
  LR.vA.setUsage(THREE.DynamicDrawUsage); gL.setAttribute('aFrame', LR.fr); gL.setAttribute('aFrame2', LR.fr2); gL.setAttribute('aMix', LR.mx); gL.setAttribute('aVar', LR.vA);
  const ROJO = '#c23a2e', inst = (g, mat, n) => { const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false; escena.add(m); return m; };
  const cuerpos = inst(gc, matCuerpo(u.tex, tex, ROJO), M);
  const gEsc = parte(u.geo, CELL, [5, 6], false); gEsc.setAttribute('aVarE', new THREE.InstancedBufferAttribute(ve, 4)); const escudos = inst(gEsc, matPieza(u.tex, ROJO, false), M);
  const mio = new THREE.Mesh(gEsc, matPieza(u.tex, ROJO, true)); mio.matrixAutoUpdate = false; mio.frustumCulled = false; escena.add(mio);
  const gEsp = parte(u.geo, CELL, [4], false); gEsp.setAttribute('aVarE', new THREE.InstancedBufferAttribute(ve, 4)); const espadas = inst(gEsp, matPieza(u.tex, ROJO, false), M), pila = inst(geoPilum, matAstaMia, M);
  /* todos dan sombra y la reciben (la figura, con su esqueleto también en la sombra) */
  cuerpos.customDepthMaterial = matSombra(tex); LR.m = inst(gL, cuerpos.material, M); LR.m.customDepthMaterial = cuerpos.customDepthMaterial; LR.m.castShadow = LR.m.receiveShadow = true;
  console.log(`[E2] triángulos por romano: ${gc.attributes.position.count / 3} detallado / ${gL.attributes.position.count / 3} sencillo`);
  for (const o of [cuerpos, escudos, mio, espadas, pila]) { o.castShadow = true; o.receiveShadow = true; }
  HOM = { ...tab, u, C: u.clips, cuerpos, fr, fr2, mx, escudos, mio, espadas, pila, D: { m: cuerpos, fr, fr2, mx, vA, vh }, LJ: LR };
  /* TP1: la zancada de andar y de correr (medida en el clip), dónde están los pies y en qué punto de cada clip va el pie
     izquierdo delante (la fase 0): así, al pasar de andar a correr, la pierna sigue donde iba */
  zancadas(u); HOM.pies = datosPies(tab.T, tab.hues, u.geo, u.clips.idle.start); HOM.corre0 = tab.LC;
  HOM.f0 = { anda: faseCero(tab.T, tab.hues, HOM.pies, u.clips.walk), corre: faseCero(tab.T, tab.hues, HOM.pies, u.clips.run, tab.LC) };
  HOM.paso = { anda: tablaPaso(tab.T, tab.hues, HOM.pies, u.clips.walk, u.clips.walk.start, HOM.f0.anda, u.clips.idle.start), corre: tablaPaso(tab.T, tab.hues, HOM.pies, u.clips.run, tab.LC, HOM.f0.corre, u.clips.idle.start) };
  /* TP1b: la zancada del paso corto del testudo, medida en sus posturas (las del techo, cerradas del todo) */
  const pT = tablaPaso(tab.T, tab.hues, HOM.pies, u.clips.walk, tab.N0 + (CJ.techo + 3) * 120 + u.clips.walk.start, HOM.f0.anda, u.clips.idle.start);
  HOM.zan = { walk: HOM.paso.anda.total * E, run: HOM.paso.corre.total * E, testudo: pT.total * E };
}
/* TP1: lo mismo para los galos (su tabla es la del modelo; correr no tiene fila inclinada: se inclina la figura entera) */
let FIG_G = null;
function preparaGalos() {
  const u = getUnit('galos'); zancadas(u); const tab = { T: u.bones.image.data, hues: u.bones.image.width / 3 }, C = u.clips, pies = datosPies(tab.T, tab.hues, u.geo, C.idle.start);
  const f0 = { anda: faseCero(tab.T, tab.hues, pies, C.walk), corre: faseCero(tab.T, tab.hues, pies, C.run) }, paso = { anda: tablaPaso(tab.T, tab.hues, pies, C.walk, C.walk.start, f0.anda, C.idle.start), corre: tablaPaso(tab.T, tab.hues, pies, C.run, C.run.start, f0.corre, C.idle.start) };
  FIG_G = { u, C, tab, pies, f0, paso, zan: { walk: paso.anda.total * E, run: paso.corre.total * E } };
}

/* ---------- estado de la partida ---------- */
const S = {};
function reinicia() {
  semilla = 43; semillaP = 5; if (ACC) ACC.reinicia();
  Object.assign(S, { unidad: crearUnidad({ hombres: M, ref: Math.min(M, REF_R) }), velObj: 0, sueltas: [], duelos: [], tChoque: -9, T: 0, zF: 0, k: 0, escudos: false, andando: false, fase: 'avance', proxima: 4, aviso: false, impacto: -1, paso: 0, tCinta: 0, tFin: -1, choque: false, llegaron: 0, sacude: 0, vel: 0, golpes: 0, roto: false, encoge: -9, destello: 0, corre: false, corriendo: false, aliento: 1, tGrito: -9, armas: 'pilum', nPaso: 0, kSon: -1, agotado: false,
    /* GM43h: salvas lanzadas, cuándo está listo el segundo pilum, el dedo en el botón, el medidor, los galos y tu pilum (la cámara lo sigue) */
    salvas: 0, listo: 0, dedo: false, armando: false, tArma: -9, medidor: 0, tGalos: -1, corrida: false, caidos: 0, caidosSalva: [0, 0], buenoSalva: [false, false], buenos: 0, ojo: null, tOjo: -9, kP: 0, zChoque: 0, aviso2: false,
    /* TP1b: los galos como unidad (sus palabras), tú (el centurión, o quien te releve), tus gestos en el duelo, las órdenes
       pendientes (sin centurión tardan), «Escudos» y «Cargad» en la lucha, y quién rompe */
    unidadG: crearUnidad({ hombres: N_GF, porBaja: 0.05, ref: Math.min(N_GF, 16) }), yo: null, miraCam: null, tParar: -9, tEmpR: -9, tEmpuja: 0, pide: null, eco: null, ordenes: [], muro: false, cargaHasta: -9, tCargad: -9, tRelevo: -9, nRelevos: 0, huida: 0, derrota: 0, ruptura: null, resAvanza: false, bajasR0: 0 });
  S.romanos = []; for (let i = 0; i < M; i++) { const r = Math.floor(i / FILES); S.romanos.push({ i, f: i % FILES, r, vivo: true, muere: 0, lanza: -9, tiro: false, x: 0, z: 0, jx: (azar() - 0.5) * 0.14, jz: (azar() - 0.5) * 0.22, fase: azar() * 2, k: 0, pilos: 2, sujeta: false, suelta: -9, ret: Math.min(0.4, r * 0.07 + azar() * 0.12), retEnc: i === YO ? 0 : 0.04 + azar() * 0.16, ampEnc: i === YO ? 1 : 0.55 + azar() * 0.45, golpe: -9, enc: 0, mira: 0, A: 0, B: 0, mx: 0, oculto: false, inst: m4(), mEsc: m4(), qEsc: new THREE.Quaternion(), golpes: 0, camino: 0, off: 0, jy: 0 }); }
  /* TP1: el paso de cada uno: su fase, su prisa, su talla (±1,5 %: más no, que el escudo del testudo va a su sitio) y su
     retraso al arrancar (la fila de delante antes; dentro de la fila, cada uno a su tiempo) */
  for (const h of S.romanos) { const t = 0.985 + azarP() * 0.03; h.sv = new THREE.Vector3(E * t, E * t, E * t); h.dz = 0; h.ritmo = 0.97 + azarP() * 0.06; h.retMarcha = h.r * 0.17 + azarP() * 0.14; h.arranque = 0; h.paso = crearPaso({ zW: HOM.zan.walk * t, zR: HOM.zan.run * t, zT: HOM.zan.testudo * t, fase: azarP(), prisa: 0.85 + azarP() * 0.3 }); }
  S.yo = S.romanos[YO];
  S.tiradores = []; for (let i = 0; i < 10; i++) S.tiradores.push({ x: (i - 4.5) * 1.7 + (azar() - 0.5) * 0.5, z: Z_TIRADORES + (azar() - 0.5) * 1.2, vivo: true, muere: 0, huye: false, yaw: 0, fase: azar() * 4 });
  S.galos = creaGalos(azar, azarP, Z_GALOS, FIG_G.zan, RESERVA_G, FILES + 2);   /* TP8b-L3: más los de refuerzo */ for (const g of S.galos) { g.inst = m4(); g.sv = new THREE.Vector3(E * g.esc, E * g.esc, E * g.esc); }
  for (const f of FL) f.est = 0; for (const a of ASTILLAS) { a.t = -9; a.m.visible = false; } for (const p of PILA) p.est = 0;
  for (const c of CHISPAS) c.t = -9; for (const p of POLVO) p.t = -9; for (const p of PIES) p.t = -9; S.restoPolvo = 0; S.congela = 0; S.tiron = null; S.lento = 0; S.tuyo = null; S.tGotas = -9;
  $('fin').hidden = true; cinta('', false); DANIO.value = TEX_DANIO[0];
  for (const h of S.romanos) sitio(h); actualiza();
}
const vivos = () => S.romanos.filter(h => h.vivo).length;

/* sitio de un hombre: depende de dónde va el frente y de lo cerrado del testudo */
function sitio(h) {
  if (!h.vivo || S.choque) return;   /* en la lucha cada uno va a su puesto (acciones.js) */
  const p = puesto(h.f, h.r, S.k, S.zF, h.jx, h.jz); h.x = p.x; h.z = p.z + h.dz;
}

/* ---------- avisos ---------- */
function cinta(texto, buena) { const c = $('cinta'); c.textContent = texto; c.classList.toggle('ve', !!texto); c.classList.toggle('buena', !!buena); S.tCinta = texto ? S.T : 0; }
const GRITOS = { aguante: ['¡Aguantad!', '¡Firmes!', '¡Juntos!', '¡No os mováis!'], aviso: ['¡Escudos!', '¡Arriba los escudos!', '¡Ahí vienen!'], paso: ['¡Ya casi!', '¡Paso a paso!', '¡Adelante, juntos!'] };
function grita(t) { if (Array.isArray(t)) t = t[Math.floor(azar() * t.length)]; Son.voz(t); const g = $('grito'); g.textContent = t; g.classList.add('ve'); S.tGrito = S.T; }

/* ---------- la cámara ----------
   En marcha: detrás de la primera fila, a la altura de los hombros (en vertical, más atrás y más alta, por encima de la segunda).
   Bajo los escudos (idea de Ryse): dentro y entre dos hombres. Tú a la izquierda, tu compañero a la derecha, y en medio,
   por encima del muro y por debajo del techo, la rendija con el enemigo. Cada juego de cifras: x a la derecha del punto
   medio entre los dos, d metros detrás de la primera fila, y de altura, cabeceo, giro y apertura. */
const CAMARA = crearCamara({ Q, S, H, suave, lerp, YO, CMP, Z_TIRADORES, COSTADO, FUERA, get vertical() { return vertical; } });
const { CAM, camBase, lejos } = CAMARA;
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
    const tl = T - h.lanza, bI = frameOf(C.idle, T + h.fase);
    if (!h.vivo) A = B = frameOnce(C.death, Math.max(0, T - h.muere));
    else if (tl >= 0 && tl < 1.1) [A, B, mx] = ACC.poseLanza(h, tl, bI, h === yo);
    else if (S.choque) [A, B, mx] = ACC.poseLucha(h, bI);
    else if (ANTES && S.corriendo || ANTES && S.fase === 'carga') A = B = frameOf(C.run, T + h.fase);
    else {
      /* TP1: las dos filas del paso (quieto, andar o correr, fundidos) con la fase de la pierna de este hombre.
         Las posturas del testudo existen para quieto y andar: si corre, se toma la de andar en la misma fase */
      let ga, gb, gm;
      if (ANTES) { ga = gb = S.vel > 0 ? frameOf(C.walk, S.paso / lerp(V_PASO, 1.26, S.k) + h.fase) : bI; gm = 0; }
      else [ga, gb, gm] = filasMarcha(HOM, h.paso, T + h.fase, frameOf);
      const c0 = h.r === 0 ? CJ.muro : CJ.techo, aSet = r => r < 120 ? r : filaEnFase(HOM.paso.anda, h.paso.fase), b = aSet(gm < 0.5 ? ga : gb);
      /* TP1b: andando sin testudo, el escudo va quieto al costado (filas «quieto»: el brazo del escudo no se mece) */
      const qu = r => !ANTES && r >= C.walk.start && r < C.walk.start + C.walk.frames ? fila(CJ.quieto, r) : r;
      if (h.k <= 0.001) { A = qu(ga); B = qu(gb); mx = gm; }
      else if (h.k < 0.999) { const s = h.k * 4, i = Math.min(3, Math.floor(s)); A = i === 0 ? qu(b) : fila(c0 + i - 1, b); B = fila(c0 + i, b); mx = s - i; }
      else {
        const arriba = fila(c0 + 3, b);
        if (h.enc > 0.02) { A = arriba; B = fila(c0 + 4, b); mx = h.enc; }
        else if (h.mira > 0.01 && h.r === 0) { const cm = h === co ? CJ.miraI : CJ.miraD, s = h.mira * 2; if (s < 1) { A = arriba; B = fila(cm, b); mx = s; } else { A = fila(cm, b); B = fila(cm + 1, b); mx = s - 1; } }
        else { A = fila(c0 + 3, aSet(ga)); B = fila(c0 + 3, aSet(gb)); mx = gm; }
      }
    }
    h.A = A; h.B = B; h.mx = mx;
    const xd = (S.choque && h.xd !== undefined ? h.xd : h.x) + (h.fx || 0), zd = (S.choque && h.zd !== undefined ? h.zd : h.z) + (h.fz || 0);   /* FI2 */
    h.inst.compose(PA.set(xd, H(xd, zd), zd), S.choque && h.tipoGolpe && h.vivo ? QY.setFromEuler(EUL.set(dobla(h), h.yaw + h.jy * (1 - h.k), 0)) : S.choque || h.jy ? QY.setFromAxisAngle(EJE_Y, (S.choque ? (!h.vivo && h.fCae !== undefined ? h.fCae + Math.PI /* FI2: cae de espaldas hacia donde le empujan */ : h.yaw) : Math.PI) + h.jy * (1 - h.k)) : Q_PI, ANTES ? SB : h.sv);
    /* los que quedan entre la cámara y vosotros dos, o pegados a ella, no se dibujan (su escudo sí) */
    h.oculto = h.vivo && S.k > 0.5 && h.r > 0 && (h.f === YO || h.f === CMP) && h.z < CAM.z + 0.5;
    /* escudo: en la mano (como lo trae el modelo) y, al cerrar, en su sitio del muro o del techo */
    MA.multiplyMatrices(h.inst, hueso(HU.escudo, A, B, mx, MB));
    const w = suave(0.4, 1, h.k);
    if (w > 0) {
      MA.decompose(PA, QA, SA);
      const hunde = tg > 0 && tg < 1 ? 0.07 * Math.exp(-tg * 9) * Math.cos(tg * 30) : 0, hs = te > 0 && te < 1 ? 0.03 * Math.exp(-te * 7) * Math.cos(te * 25) : 0;
      escudoEn(h, h.x + (h.fx || 0), h.z + (h.fz || 0) /* FI2 */, hunde + hs, PB, QB); PA.lerp(PB, w); QA.slerp(QB, w); SA.lerp(SB, w); MA.compose(PA, QA, SA); h.qEsc.copy(QA);
    } else h.qEsc.setFromRotationMatrix(MA);
    h.mEsc.copy(MA);
  }
}
const QY = new THREE.Quaternion(), EJE_Y = new THREE.Vector3(0, 1, 0), QG = new THREE.Quaternion(), EUL = new THREE.Euler(0, 0, 0, 'YXZ');
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
/* GM43h: el pilum en la mano de un hombre (sitio y giro), el mismo que se dibuja: de ahí sale cuando lo lanza */
function pilumEnMano(h, P, Qo) {
  const tl = S.T - h.lanza, lz = tl > 0 ? suave(0, 0.3, tl) : 0;
  ancla(h, HU.espada, [0, 0, 0], P); Qo.copy(Q_PIE).slerp(Q_TENDIDO, h.k); if (lz) Qo.slerp(Q_LANZA, lz);
  V3.set(0, 0, 1).applyQuaternion(Qo); P.addScaledVector(V3, lerp(lerp(0.75, 0.25, h.k), 0.1, lz)); if (!lz) P.y += 0.04 * h.k;
  return P;
}
/* el medidor del tiro: sube de 0 a 1 en T_MEDIDOR segundos y, si sigues, vuelve a bajar (y otra vez arriba) */
const medidor = t => { const x = (Math.max(0, t) / T_MEDIDOR) % 2; return x < 1 ? x : 2 - x; };
const puedeArmar = () => S.fase === 'pila' && S.salvas < 2 && S.T >= S.listo && !S.armando;
/* los que lanzan: las dos primeras filas, vivos y con pilum */
const lanzadores = () => S.romanos.filter(h => h.vivo && h.r <= 1 && h.pilos > 0);
/* lo de delante de los galos: el más adelantado de los que siguen en pie, y cuánto le falta para llegar a tu primera fila */
const frenteGalo = () => S.galos.reduce((z, g) => g.vivo ? Math.max(z, g.z) : z, -1e9);
const hueco = () => S.zF - frenteGalo();

/* ---------- el escudo de los galos: su hueso y el centro del escudo, para dejar clavados los pila ---------- */
let GESC = null;
const _gi = new THREE.Matrix4(), _gb = new THREE.Matrix4(), _gm = new THREE.Matrix4(), _gp = new THREE.Vector3(), Q_ID = new THREE.Quaternion(), UNO = new THREE.Vector3(1, 1, 1);
async function escudoGalo() {
  const meta = (await loadIndex()).galos, buf = await (await fetch('assets/units/galos.bin')).arrayBuffer(), n = meta.verts;
  const P = new Float32Array(buf, meta.off[0], n * 3), SI = new Uint8Array(buf, meta.off[3], n * 4), SW = new Uint8Array(buf, meta.off[4], n * 4), CELL = new Uint8Array(buf, meta.off[6], n);
  /* las piezas 3 y 4 del atlas de los galos son la cara y el canto del escudo; el hueso que más las mueve es el del escudo */
  const esEscudo = i => CELL[i] === 3 || CELL[i] === 4, fuerte = i => { let b = 0; for (let k = 1; k < 4; k++) if (SW[i * 4 + k] > SW[i * 4 + b]) b = k; return SI[i * 4 + b]; };
  const cuenta = new Map(); for (let i = 0; i < n; i++) if (esEscudo(i)) cuenta.set(fuerte(i), (cuenta.get(fuerte(i)) || 0) + 1);
  if (!cuenta.size) return;
  const slot = [...cuenta].sort((a, b) => b[1] - a[1])[0][0], c = new THREE.Vector3(); let k = 0;
  for (let i = 0; i < n; i++) if (esEscudo(i) && fuerte(i) === slot) { c.x += P[i * 3]; c.y += P[i * 3 + 1]; c.z += P[i * 3 + 2]; k++; }
  GESC = { slot, slots: meta.slots, c: c.divideScalar(k) };
  /* TP8 1a: unos puntos de la espada del galo (pieza 2 del atlas, la de las armas), con su hueso: para medir si atraviesa */
  const arma = []; for (let i = 0; i < n; i++) if (CELL[i] === 2) arma.push(i);
  GESC.arma = arma.filter((_, j) => j % Math.max(1, Math.floor(arma.length / 40)) === 0).map(i => ({ p: new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]), slot: fuerte(i) }));
}
/* la matriz del escudo de un galo en el mundo, en su fotograma de ahora */
function huesoEscudoGalo(g, out) {
  return out.multiplyMatrices(g.inst, huesoT(FIG_G.tab, GESC.slot, g.A, g.B, g.mx, _gb));
}
/* el fotograma de cada galo: espera, se viene al paso, a la carrera, cae o pelea */
function frameGalo(g) {
  /* la maqueta A, para comparar (?antes=1): un solo fotograma, salto seco entre andar y correr */
  const CG = figuras.galos.u.clips, T = S.T;
  if (!g.vivo) return frameOnce(CG.death, Math.max(0, T - g.muere));
  if (g.v > 3.2 && CG.run) return frameOf(CG.run, g.dist / ((CG.run.zancada || 2) * E) * CG.run.dur);
  if (g.v > 0.25 && CG.walk) return frameOf(CG.walk, g.dist / ((CG.walk.zancada || 1.6) * E) * CG.walk.dur);
  return frameOf(CG.idle, T + g.fase);
}
/* TP1: las filas de cada galo (marcha, o la lucha de acciones.js) y su matriz en el mundo */
function galoAhora(g) {
  if (g.reserva) {   /* TP8b-E2: la reserva se ve: anda detrás de los suyos y espera en masa (con ?antes=1, oculta como antes) */
    if (ANTES || S.huida) { g.inst.makeScale(0, 0, 0); return; }
    if (S.choque) { g.A = g.B = frameOf(FIG_G.C.idle, S.T + g.fase); g.mx = 0; g.pitch = 0; } else { g.vivo = true; filasGalo(g, FIG_G, S.T, frameOf, frameOnce); g.vivo = false; }
    { const x = g.x + (g.fx || 0), z = g.z + (g.fz || 0); g.inst.compose(PA.set(x, H(x, z), z), QG.setFromEuler(EUL.set(g.pitch, 0, 0)), g.sv); } return;   /* FI2 */
  }
  const T = S.T, CG = FIG_G.C, e = g.est || { modo: 'guardia' }; let tw = 0;
  if (ANTES) { g.A = g.B = frameGalo(g); g.mx = 0; g.pitch = 0; }
  else filasGalo(g, FIG_G, T, frameOf, frameOnce);
  if (S.choque && g.vivo && !g.huye) {
    g.mx = 0; g.pitch = 0; const sa = ACC.sAtaque(e);
    if (sa !== null) g.A = g.B = Math.round(ACC.clipPos(e.d.clip, sa));
    else if (g.anda && g.corre && CG.run) g.A = g.B = frameOf(CG.run, g.camino / FIG_G.zan.run * CG.run.dur);   /* TP8b-L3: el refuerzo llega corriendo */
    else if (g.anda) g.A = g.B = frameOf(CG.walk, g.camino / FIG_G.zan.walk * CG.walk.dur);
    else g.A = g.B = frameOf(CG.idle, T + g.fase);
    if (e.modo === 'cubre') g.pitch = -0.1 * (suave(0, 0.3, e.t) - suave(0.45, 0.75, e.t));
    if (e.modo === 'recibe') g.pitch = (e.d.lado > 0 ? 0.24 : -0.16) * (suave(0, 0.12, e.t) - suave(0.35, 0.8, e.t));   /* se dobla o se echa atrás */
    if (e.modo === 'ataca' && e.d.aviso) {   /* TP8b-L1: arma con todo el cuerpo (se echa atrás y gira los hombros) y lo suelta de golpe hacia delante */
      const d = e.d, ar = suave(0, d.tA || d.tb, e.t), su = suave(d.tb, d.tb + 0.12, e.t), va = 1 - suave(d.tb + 0.25, d.tb + 0.7, e.t);
      g.pitch = -0.2 * ar * (1 - su) + 0.15 * su * va; tw = (d.lado || 1) * (-0.5 * ar * (1 - su) + 0.22 * su * va);
      if (d.tipo === 'finta' && e.t > (d.tA || 0) && e.t < d.tb) tw += 0.03 * Math.sin(S.T * 40);   /* aguanta armado, temblando */
    }
    if (g.tipoGolpe && S.T - g.tGolpe < 1) g.pitch = dobla(g);   /* TP8 1a: se encoge si le dan; si es en el escudo, se echa atrás */
  }
  if (S.choque && !g.vivo && g.atras && !ANTES) g.pitch = -0.32 * suave(0, 0.5, T - g.muere);   /* TP8b-L1: tu estocada lo tumba hacia atrás */
  const x = (S.choque && g.xd !== undefined ? g.xd : g.x) + (g.fx || 0), z = (S.choque && g.zd !== undefined ? g.zd : g.z) + (g.fz || 0), yaw = S.choque && !g.vivo && g.fCae !== undefined ? g.fCae + Math.PI : S.choque && g.yaw !== undefined ? g.yaw + (g.jy || 0) + tw : 0;   /* FI2: con su desplazamiento; el caído, hacia donde le empujan */
  g.inst.compose(PA.set(x, H(x, z), z), QG.setFromEuler(EUL.set(g.pitch, yaw, 0)), ANTES ? SB : g.sv);
}

/* ---------- órdenes ---------- */
/* a tiro: los tiradores que quedan huyen entre los galos y los galos se vienen cuesta abajo */
function aTiro() {
  S.zF = Z_PILA; S.fase = 'pila'; S.andando = false; S.corre = false; S.escudos = false; S.tGalos = S.T + 0.8; S.listo = S.T + 0.3;
  for (const t of S.tiradores) if (t.vivo) t.huye = true;
  cinta('¡A tiro! Mantén pulsado y suelta', true); grita('¡Ahí vienen!'); Son.trueno(0.35);
}
/* el dedo baja: tu soldado echa el brazo atrás y las dos primeras filas arman contigo */
function armar() {
  if (!puedeArmar()) return false;
  S.armando = true; S.tArma = S.T; S.medidor = 0; S.escudos = false;
  for (const h of lanzadores()) { h.sujeta = true; h.suelta = -9; h.tiro = false; h.lanza = S.T + (h.i === YO ? 0 : 0.04 + azar() * 0.18); }
  return true;
}
/* el dedo sube: lanzas tú y, escalonados (0 a 0,35 s), los demás. Bueno si el medidor estaba en la zona */
function soltar() {
  if (!S.armando) return false;
  S.armando = false; const m = medidor(S.T - S.tArma), bueno = m >= ZONA; S.medidor = m;
  const quien = S.romanos.filter(h => h.sujeta && h.vivo);
  for (const h of quien) h.suelta = h.i === YO ? S.T : S.T + azar() * 0.35;
  planSalva(quien, bueno);
  if (bueno) S.buenos++;
  S.buenoSalva[S.salvas] = bueno; S.salvas++; S.listo = S.T + RECARGA; Son.lanza();
  cinta(bueno ? (S.salvas === 1 ? '¡Pila! Buen brazo' : '¡Segundo pilum! Buen brazo') : (S.salvas === 1 ? '¡Pila!' : '¡Segundo pilum!'), bueno);
  return bueno;
}
/* adónde va cada pilum de la salva y qué hace al llegar: mata (cae el galo y el pilum queda a su lado), escudo (se queda
   clavado en su escudo) o falla (clavado en tierra). Buen tiro: 4 o 5 galos y el tuyo mata siempre al que tienes delante. Flojo: 2 */
function planSalva(quien, bueno) {
  const n = S.salvas, yo = S.romanos[YO], vivosG = () => S.galos.filter(g => g.vivo && !g.marcado);
  let mata = bueno ? 4 + (azar() < 0.5 ? 1 : 0) : 2;
  const otros = quien.filter(h => h !== yo); for (let i = otros.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [otros[i], otros[j]] = [otros[j], otros[i]]; }
  const orden = quien.includes(yo) ? [yo, ...otros] : otros;
  for (const h of orden) {
    const p = PILA.find(p => p.est === 0); if (!p) break;
    h.pilos--; const mio = h === yo, libres = vivosG(); let g = null, tipo = 'falla';
    if (libres.length && mata > 0 && (!mio || bueno)) {
      /* el tuyo, al que tienes delante (el más cerca de tu línea de tiro); los demás, uno cualquiera */
      g = mio ? libres.reduce((a, b) => Math.abs(b.x - yo.x) + b.fila * 1.5 < Math.abs(a.x - yo.x) + a.fila * 1.5 ? b : a) : libres[Math.floor(azar() * libres.length)];
      tipo = 'mata'; g.marcado = true; mata--;
    } else {
      const todos = S.galos.filter(g => g.vivo); g = todos.length ? todos[Math.floor(azar() * todos.length)] : null;
      tipo = g && azar() < (mio ? 0.6 : 0.5) ? 'escudo' : 'falla';
    }
    Object.assign(p, { est: 1, h, g, tipo, mio, salva: n, dur: mio ? VUELO_PILUM : VUELO_PILUM - 0.05 + azar() * 0.3, t0: -9, tFin: -9, dx: (azar() - 0.5) * 2.4, dz: (azar() < 0.5 ? -1 : 1) * (1.8 + azar() * 2.5) });
    if (mio) S.ojo = p;
  }
}
/* dónde estará el blanco de un pilum dentro de «quedan» segundos */
function destino(p, quedan, out) {
  const g = p.g; if (!g) return out.set(p.p0.x, H(p.p0.x, p.p0.z - 20), p.p0.z - 20);
  const dz = g.vivo ? g.v * quedan : 0;
  if (p.tipo === 'escudo' && GESC && g.vivo) { out.copy(GESC.c).applyMatrix4(huesoEscudoGalo(g, _gm)); out.z += dz; return out; }
  if (p.tipo === 'mata' || p.tipo === 'escudo') return out.set(g.x, H(g.x, g.z + dz) + 1.25, g.z + dz);
  const x = g.x + p.dx, z = g.z + dz + p.dz; return out.set(x, H(x, z), z);
}
/* una nube de polvo suelta (de las de POLVO) */
function polvazo(x, y, z, e) { const q = POLVO.find(q => S.T - q.t > 3); if (!q) return; q.t = S.T; q.e = e; q.s.position.set(x, y, z); q.v.set((azarV() - 0.5) * 0.3, 0.3 + azarV() * 0.2, (azarV() - 0.5) * 0.3); }
/* llega un pilum: tres finales que se distinguen a simple vista */
function impactoPilum(p) {
  const g = p.g, T = S.T, pan = panDe(p.p1.x); p.tFin = T; V3.set(0, 0, 1).applyQuaternion(p.q);
  if (p.tipo === 'mata' && g && g.vivo) {
    /* cae el galo en plena carrera; el pilum no atraviesa figuras: queda en tierra a su lado */
    g.vivo = false; g.muere = T; g.porPila = true; S.caidos++; S.caidosSalva[p.salva]++;
    const lado = azar() < 0.5 ? -1 : 1, x = g.x + lado * (0.45 + azar() * 0.3), z = g.z + 0.2 + azar() * 0.6;
    p.q.setFromEuler(new THREE.Euler(0, azar() * 6.28, 0)); p.p.set(x, H(x, z) + 0.03, z); p.est = 3;
    polvazo(g.x, H(g.x, g.z) + 0.3, g.z + 0.3, 0.55); Son.tierra(pan); Son.madera(0.3, pan, 0.05);
  } else if (p.tipo === 'escudo' && g && g.vivo && GESC) {
    /* se queda clavado en su escudo y va con él; el galo acusa el golpe (frena un instante) */
    /* el hierro blando se dobla y el astil cuelga del escudo hacia un lado (César, Guerra de las Galias 1.25: los galos no
       podían arrancarlos y soltaban el escudo). Así, además, se ve desde atrás: clavado de frente sería un punto */
    const hz = Math.hypot(V3.x, V3.z), lado = azar() < 0.5 ? -1 : 1; V3.set(V3.x + lado * 0.65 * hz, 0.4 * hz, V3.z).normalize(); p.q.setFromUnitVectors(Z1, V3);
    huesoEscudoGalo(g, _gm); PB.copy(GESC.c).applyMatrix4(_gm);
    p.p.copy(PB).addScaledVector(V3, -(PUNTA - 0.14)); p.m.compose(p.p, p.q, UNO); p.rel.copy(_gm).invert().multiply(p.m); p.est = 4; g.frena = T;
    chispa(PB, 0.7); Son.madera(0.7, pan); Son.hierro(pan, 0, 0.35);
  } else {
    /* falla (o su galo ya había caído): clavado en tierra, inclinado, con polvo */
    const x = p.p1.x, z = p.p1.z; p.p.set(x, H(x, z), z).addScaledVector(V3, -0.9); p.est = 3;
    polvazo(x, H(x, z) + 0.15, z, 0.4); Son.tierra(pan);
  }
  if (p.mio) S.sacude = Math.max(S.sacude, 0.22);
  /* cuando ha llegado toda la salva, la cinta con lo que hizo */
  if (!PILA.some(q => q.salva === p.salva && (q.est === 1 || q.est === 2))) {
    const n = S.caidosSalva[p.salva], bueno = S.buenoSalva[p.salva], cae = n === 1 ? 'Cae 1' : `Caen ${n}`;
    cinta(bueno ? `¡Buen tiro! ${cae} galo${n === 1 ? '' : 's'}` : `Tiro flojo. ${cae}`, bueno);
  }
}
/* los galos a 9 m: gladios fuera y carrera corta. Si no dio tiempo a la segunda salva, se pierde */
function alGladio() {
  const tarde = S.salvas < 2;
  S.armando = false; S.dedo = false;
  for (const h of S.romanos) if (h.sujeta) { h.sujeta = false; h.lanza = -9; }
  for (const p of PILA) if (p.est === 1) p.est = 0;
  S.fase = 'carga'; S.armas = 'espada'; S.corrida = true; S.escudos = false;
  cinta(tarde ? '¡Tarde! A las espadas' : '¡Gladios! ¡Cargad!', !tarde); grita('¡Cargad!'); Son.cuerno([[146.83, 0.35], [146.83, 0.35], [196, 1.1]]);
}
/* el choque, donde se encuentran las dos líneas (provisional: aquí enganchará la pieza 2, la lucha cuerpo a cuerpo) */
function alChocar() {
  const T = S.T, zc = S.zF - 1; S.zChoque = zc; S.choque = true; S.vel = 0; for (const g of S.galos) g.v = 0;   /* TP1: en el choque se paran en seco: los mueve la lucha */
  S.llegaron = vivos(); S.sacude = 0.9; Son.choque();
  for (const p of POLVO) { p.e = 1; p.t = T + azar() * 0.4; const x = (azar() - 0.5) * 8; p.s.position.set(x, H(x, zc) + 0.4 + azar() * 0.6, zc - azar() * 2.5); p.v.set((azar() - 0.5) * 1.5, 0.6 + azar() * 0.6, (azar() - 0.5) * 1.5); }
  ACC.empiezaLucha(); S.tFin = 1e9; S.muro = false;   /* TP1b: la lucha (acciones.js) dura hasta que un bando rompe */
}

/* ---------- el paso de la simulación ---------- */
const FIS = crearFisicaEscena({ H });   /* FI2: la física del dibujo (?fisica=0 la apaga) */
const MF3 = new THREE.Matrix4(), FP = crearProyectilesEscena({ H, ySup, geoV: geoVenablo, geoP: geoPilum }), PF3 = new THREE.Vector3(), DF3 = new THREE.Vector3(), QF3 = new THREE.Quaternion();   /* FI3: venablos y pila con física */
FP.conecta({ S, FL, PILA, M4: THREE.Matrix4, galoEsc: (g, o) => huesoEscudoGalo(g, o), gesc: () => GESC, galoHueso: (g, k, o) => o.multiplyMatrices(g.inst, huesoT(FIG_G.tab, k, g.A, g.B, g.mx, _gb)), figG: () => FIG_G, yo: () => S.romanos[YO], roto: () => S.roto });   /* FI3 */
function paso(dt) {
  S.T += dt; const T = S.T, yo = S.romanos[YO], co = S.romanos[CMP];
  S.k += Math.sign((S.escudos ? 1 : 0) - S.k) * Math.min(Math.abs((S.escudos ? 1 : 0) - S.k), dt * 1.6);
  /* marcha: lo que pide la orden (avanzar, correr, cargar); el cuerpo entero acelera y frena (no de golpe) y cada hombre
     lleva su paso (locomocion.js): arranca con su retraso, se adelanta o se queda atrás un poco y la pierna avanza por lo
     que él recorre. El aliento (correr 5 s) lo lleva la unidad */
  let v = 0; const U = S.unidad;
  S.corriendo = S.fase === 'avance' && S.corre && !U.agotado && !S.escudos;
  U.esfuerzo(dt, S.corriendo); S.aliento = U.aliento; S.agotado = U.agotado;
  if (S.corriendo) v = V_CORRE * (1 - S.k);
  if (S.fase === 'avance' && (S.andando || S.corre) && !S.corriendo) v = lerp(V_PASO, V_TESTUDO, S.k);
  if (S.fase === 'carga' && !S.choque) v = V_CARGA;
  if (S.choque) v = 0;
  if (v > 0 && S.velObj === 0) for (const h of S.romanos) h.arranque = T + h.retMarcha;   /* arrancan: la fila de delante antes */
  S.velObj = v;
  const a = v > S.vel ? (v > MARCHA.V_ANDA ? MARCHA.ACEL_CORRE : MARCHA.ACEL) : MARCHA.FRENA;
  S.vel = ANTES ? v : S.vel + Math.max(-a * dt, Math.min(a * dt, v - S.vel)); if (S.vel < 1e-3 && v === 0) S.vel = 0;
  S.zF -= S.vel * dt; S.paso += S.vel * dt;
  if (!ANTES && !S.choque) {
    const hol = holgura(S.k);
    for (const h of S.romanos) {
      if (!h.vivo) continue;
      h.paso.corto = ANTES ? 0 : suave(h.ret, h.ret + 0.6, S.k);   /* el testudo cerrado acorta el paso (como h.k) */
      const vObj = Math.max(0, (T >= h.arranque ? S.vel * h.ritmo : 0) + 1.2 * h.dz);
      velocidad(h.paso, vObj, dt);
      const dz0 = h.dz; h.dz = Math.min(hol.atras, Math.max(-hol.delante, h.dz + (S.vel - h.paso.v) * dt));
      pisa(h.paso, Math.max(0, S.vel * dt - (h.dz - dz0)), dt);   /* lo que avanza de verdad (con lo que deja la holgura) */
    }
  }
  const yoP = yo.paso, np = ANTES ? Math.floor(S.paso / (S.vel > 3 ? 1.9 : lerp(1.5, 1.05, S.k))) : Math.floor(yoP.ciclos * 2);
  if (np !== S.nPaso) { S.nPaso = np; if (S.vel > 0.2) Son.paso(S.vel > 3 ? 1.3 : 0.8, S.k); }
  if (Math.abs(S.k - S.kSon) > 0.03 || (S.k === 0 || S.k === 1) && S.kSon !== S.k) { S.kSon = S.k; Son.bajoTecho(S.k); }
  /* GM43i: el fragor grabado de la lucha mientras dura el choque */
  { const kL = S.choque && S.fase !== 'fin' ? (S.muro ? 0.6 : 1) : 0; if (kL !== S.kLucha) { S.kLucha = kL; Son.lucha(kL); } }
  if (S.fase === 'avance' && S.zF <= Z_PILA) aTiro();
  S.kP = Math.min(1, S.kP + (S.fase === 'avance' || S.choque ? -1 : 1) * dt * (S.choque ? 2 : 0.7)); if (S.kP < 0) S.kP = 0;
  /* GM43h: el dedo en el botón. Si se pulsó mientras pasaban el segundo pilum, arma en cuanto está listo */
  if (S.dedo && puedeArmar()) armar();
  if (S.armando) S.medidor = medidor(T - S.tArma);
  for (const h of S.romanos) if (h.sujeta) { if (h.suelta > 0 && T >= h.suelta) h.sujeta = false; else if (T - h.lanza > 0.3) h.lanza = T - 0.3; }
  /* el segundo pilum pasa a la mano derecha poco antes de estar listo */
  if (S.fase === 'pila' && S.salvas === 1 && T >= S.listo - 0.8) for (const h of S.romanos) if (h.vivo && h.tiro && h.pilos > 0 && T - h.lanza > 1.1) h.tiro = false;
  /* los galos: esperan, gritan y se vienen; a 9 m, a la carrera. El que cae sigue un poco con el impulso */
  const vf = S.corrida ? V_GALO_CORRE : V_GALO;
  if (ANTES) { if (S.tGalos > 0) for (const g of S.galos) { if (!g.vivo) g.v *= Math.max(0, 1 - dt * 5); else { const meta = S.choque || T < S.tGalos + g.sale ? 0 : T - g.frena < 0.5 ? vf * 0.15 : vf; g.v += (meta - g.v) * Math.min(1, dt * (meta < g.v ? 9 : 3)); } g.z += g.v * dt; g.dist += g.v * dt; } }
  else marchaGalos(S, dt, T, vf);
  if (S.choque) ACC.lucha(dt);
  /* TP1b: las bajas pasan a las dos unidades (ánimo y cómo va la lucha); en la lucha, el cansancio y el ánimo de cada bando,
     y el que rompe. Las órdenes se cumplen a su tiempo (sin centurión, tarde) */
  { const UR = S.unidad, UG = S.unidadG, nr = vivos(), ng = S.galos.filter(g => g.vivo).length;
    if (nr < UR.enPie) { const n = UR.enPie - nr; UR.baja(n); UG.mata(n); }
    if (ng < UG.enPie) { const n = UG.enPie - ng; UG.baja(n); UR.mata(n); }
    if (S.choque && !S.huida && !S.derrota) {
      const rR = UR.lucha(dt, { muro: S.muro, carga: T < S.cargaHasta }), rG = UG.lucha(dt, { contraMuro: S.muro });
      if (rG) { S.ruptura = 'galos'; ACC.huida(); S.tFin = T + 3.6; cinta('¡Rompen! Los galos huyen', true); grita('¡Victoria!'); Son.cuerno([[196, 0.4], [246.94, 0.4], [293.66, 1.2]]); }
      else if (rR) { S.ruptura = 'romanos'; S.derrota = T; for (const d of S.duelos) d.activo = false; S.tFin = T + 2.4; cinta('¡Los tuyos rompen!', false); grita('¡Los galos se vienen gritando!'); }
    }
    for (const o of S.ordenes) if (!o.hecha && T >= o.t) { o.hecha = true; cumple(o.n); }
  }
  FIS.paso(S, dt, sitio);   /* FI2: tras las reglas, antes de colocar a nadie */
  for (const g of S.galos) galoAhora(g);
  if (S.fase === 'pila' && S.tGalos > 0 && hueco() <= D_GLADIO) alGladio();
  if (S.fase === 'carga' && !S.choque && hueco() <= 1.3) alChocar();
  if (S.fase === 'carga' && S.choque && T >= S.tFin) { S.fase = 'fin'; muestraFin(); }
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
  /* pila propios: salen de la mano de cada hombre cuando suelta el brazo, vuelan en parábola tensa con el astil a lo largo
     de la trayectoria (los que van a un galo siguen su carrera) y caen */
  for (const p of PILA) {
    if (p.est === 1 && p.h.tiro) {
      pilumEnMano(p.h, p.p0, p.q); p.p.copy(p.p0); p.t0 = T; p.est = 2;
      destino(p, p.dur, p.p1); p.alto = 0.9 + 0.05 * p.p0.distanceTo(p.p1);
    }
    if (p.est !== 2) continue;
    const s = (T - p.t0) / p.dur;
    if (p.tipo !== 'falla') destino(p, Math.max(0, p.t0 + p.dur - T), p.p1);
    if (s >= 1) { p.p.copy(p.p1); impactoPilum(p); continue; }
    p.p.lerpVectors(p.p0, p.p1, s); p.p.y += p.alto * 4 * s * (1 - s);
    V3.subVectors(p.p1, p.p0); V3.y += p.alto * 4 * (1 - 2 * s); p.q.setFromUnitVectors(Z1, V3.normalize());
  }
  /* los tiradores que quedan huyen loma arriba, entre los galos */
  if (S.fase !== 'avance') for (const t of S.tiradores) if (t.vivo && t.huye && t.z > -150) t.z -= 4.5 * dt;
  S.sacude = Math.max(0, S.sacude - dt);
  polvoPies(dt);
  FP.paso(S, dt);   /* FI3: tras todas las reglas del paso */
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
  /* TP1: los galos mezclan dos filas, como los romanos (sombreador de units.js retocado en enemigo.js) */
  let fr2 = null, mx = null;
  if (tipo === 'galos') {
    const ia = () => { const x = new THREE.InstancedBufferAttribute(new Float32Array(n), 1); x.setUsage(THREE.DynamicDrawUsage); return x; }; fr2 = ia(); mx = ia(); g.setAttribute('aFrame2', fr2); g.setAttribute('aMix', mx);
    mat.onBeforeCompile = (sh, r) => { antes(sh, r); sh.vertexShader = conMezcla(sh.vertexShader); cine(sh, 1.3); }; mat.customProgramCacheKey = () => 'apie-galos-mezcla';
  }
  m.frustumCulled = false; escena.add(m); figuras[tipo] = { m, u, fr: g.attributes.aFrame, fr2, mx };
  /* TP8b-E2: los galos lejanos, con el sencillo (mismo material y huesos) */
  if (tipo === 'galos') { const gL = sencillo(g, REJILLA), ia = () => { const x = new THREE.InstancedBufferAttribute(new Float32Array(n), 1); x.setUsage(THREE.DynamicDrawUsage); return x; }, L = { fr: ia(), fr2: ia(), mx: ia() };
    gL.setAttribute('aFrame', L.fr); gL.setAttribute('aFrame2', L.fr2); gL.setAttribute('aMix', L.mx); L.m = new THREE.InstancedMesh(gL, mat, n); L.m.frustumCulled = false; escena.add(L.m); figuras[tipo].L = L;
    console.log(`[E2] triángulos por galo: ${g.attributes.position.count / 3} detallado / ${gL.attributes.position.count / 3} sencillo`); }
  return figuras[tipo];
}
const O = new THREE.Object3D(), CERO = m4().makeScale(0, 0, 0);
/* TP8b-E2 (la solución de la falange): el mismo soldado, sencillo, para los lejanos. Se juntan los vértices que caen en la
   misma celda de una rejilla de n celdas a lo alto y se quitan los triángulos sin área: misma silueta, colores y huesos */
const CERCA = 48, REJILLA = +(new URLSearchParams(location.search).get('rejilla') || 14);
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
  for (const k of Object.keys(geo.attributes)) {
    const at = geo.attributes[k]; if (at.isInstancedBufferAttribute) continue;
    const t = at.itemSize, arr = new at.array.constructor(quedan.length * t);
    quedan.forEach((v, j) => { if (k === 'position') { const a = suma.get(clave[v]); arr[j * 3] = a[0] / a[3]; arr[j * 3 + 1] = a[1] / a[3]; arr[j * 3 + 2] = a[2] / a[3]; } else for (let c = 0; c < t; c++) arr[j * t + c] = at.array[v * t + c]; });
    g.setAttribute(k, new THREE.BufferAttribute(arr, t, at.normalized));
  }
  g.boundingSphere = geo.boundingSphere ? geo.boundingSphere.clone() : new THREE.Sphere(new THREE.Vector3(0, 2, 0), 8); return g;
}
/* cada hombre, al hueco libre de su malla (la detallada D o la sencilla L): los K más cercanos a la cámara, detallados */
function reparte(D, L, lista, K) {
  const cp = camara.position; for (const h of lista) { const x = S.choque && h.xd !== undefined ? h.xd : h.x, z = S.choque && h.zd !== undefined ? h.zd : h.z; h.dCam = (x - cp.x) ** 2 + (z - cp.z) ** 2; }
  const orden = lista.slice().sort((a, b) => a.dCam - b.dCam); D.n = 0; L.n = 0;
  orden.forEach((h, j) => { const o = j < K ? D : L, s = o.n++; o.m.setMatrixAt(s, h.oculto ? CERO : h.inst); o.fr.array[s] = h.A; o.fr2.array[s] = h.B; o.mx.array[s] = h.mx; if (o.vA) o.vA.array.set(o.vh.subarray(h.i * 4, h.i * 4 + 4), s * 4); });
  for (const o of [D, L]) { o.m.count = o.n; o.m.instanceMatrix.needsUpdate = true; o.fr.needsUpdate = o.fr2.needsUpdate = o.mx.needsUpdate = true; if (o.vA) o.vA.needsUpdate = true; }
}
/* TP1b · la cresta del centurión: medio disco rojo, de oreja a oreja (transversal), sobre el casco. Pieza hecha por código,
   anclada al punto del casco del modelo: va con la cabeza (también si cae). Y la marca del rival de delante: un aro en el suelo,
   claro cuando solo te mira, ámbar cuando arma el golpe y verde cuando queda abierto */
const OFS_CRESTA = (Q.get('cresta') || '0,0,0.21').split(',').map(Number), ROT_CRESTA = (Q.get('crestaR') || '1.5708,0,0').split(',').map(Number);
let CRESTA = null, ARO = null, PICO = null, ANILLO = null, DIANA = null, GOTAS = null;
function creaCresta() {
  const g = new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, Math.PI / 2, Math.PI); g.rotateX(Math.PI / 2); g.scale(0.185, 0.16, 0.045);
  const pelo = new THREE.MeshStandardMaterial({ color: '#b0201a', roughness: 0.92, metalness: 0 });
  CRESTA = new THREE.Mesh(g, pelo); CRESTA.matrixAutoUpdate = false; CRESTA.frustumCulled = false; CRESTA.castShadow = true; escena.add(CRESTA);
  CRESTA.userData.local = new THREE.Matrix4().compose(new THREE.Vector3(OFS_CRESTA[0] / E, OFS_CRESTA[1] / E, OFS_CRESTA[2] / E), new THREE.Quaternion().setFromEuler(new THREE.Euler(...ROT_CRESTA)), new THREE.Vector3(1 / E, 1 / E, 1 / E));
  const ga = new THREE.RingGeometry(0.5, 0.64, 40); ga.rotateX(-Math.PI / 2);
  ARO = new THREE.Mesh(ga, new THREE.MeshBasicMaterial({ color: '#f1ead9', transparent: true, opacity: 0.5, depthWrite: false })); ARO.visible = false; ARO.renderOrder = 2; escena.add(ARO);
  /* y un pico sobre su cabeza, del mismo color (el aro solo se ve a ratos entre las piernas) */
  const gp = new THREE.ConeGeometry(0.11, 0.24, 4); gp.rotateX(Math.PI);
  PICO = new THREE.Mesh(gp, ARO.material); PICO.visible = false; PICO.renderOrder = 2; escena.add(PICO);
  /* TP8b-L1: el anillo que se cierra sobre el galo hasta el instante de parar (de cara a la cámara, por encima de todo) y la
     diana fija donde acaba; y la salpicadura oscura de tu estocada (seis gotas que caen) */
  const anillo = (r0, r1, c, o) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 56), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, depthTest: false })); m.visible = false; m.renderOrder = 4; m.frustumCulled = false; escena.add(m); return m; };
  ANILLO = anillo(0.4, 0.5, '#ffb020', 0.95); DIANA = anillo(0.45, 0.5, '#fff3dc', 0.7);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  GOTAS = new THREE.Points(gg, new THREE.PointsMaterial({ color: '#3a0906', size: 0.12, sizeAttenuation: true, transparent: true, opacity: 0.92, depthWrite: false })); GOTAS.visible = false; GOTAS.frustumCulled = false; GOTAS.userData.v = Array.from({ length: 6 }, () => new THREE.Vector3()); GOTAS.userData.p0 = new THREE.Vector3(); escena.add(GOTAS);
}
function dibujaMarcas() {
  const c = S.romanos[YO];
  CRESTA.matrix.multiplyMatrices(c.inst, hueso(HU.casco, c.A, c.B, c.mx, MB)).multiply(CRESTA.userData.local); CRESTA.matrixWorld.copy(CRESTA.matrix);
  const d = S.yo && S.yo.vivo && S.yo.duelo, g = d && d.activo && !S.huida && !S.derrota ? d.g : null;
  ARO.visible = !!(g && g.vivo && S.choque);
  if (ARO.visible) {
    const x = (g.xd ?? g.x) + (g.fx || 0), z = (g.zd ?? g.z) + (g.fz || 0) /* FI2 */, arma = d.aviso && d.t0 > 0 && S.T < d.ts + 0.15, abierto = S.T < (d.abierto || 0) || S.T < (d.deseq || 0);
    ARO.position.set(x, H(x, z) + 0.05, z);
    ARO.material.color.set(arma ? '#ffc93a' : abierto ? '#8ef07a' : '#f1ead9'); ARO.material.opacity = arma ? 0.75 + 0.25 * Math.sin(S.T * 18) : abierto ? 0.85 : 0.35;
    ARO.scale.setScalar(arma ? 1 + 0.12 * (S.T - d.t0) : 1);
    PICO.position.set(x, H(x, z) + 2.55 + (arma ? 0.06 * Math.sin(S.T * 18) : 0), z); PICO.rotation.y = S.T * 1.5;
  }
  PICO.visible = ARO.visible;
  /* TP8b-L1: el anillo se cierra hasta el golpe (ámbar; rojo en la ventana de parada). En la finta se queda a medias y aguanta.
     Con el galo abierto o desequilibrado, la diana se pone verde: es tu momento */
  const ve = ARO.visible && !ANTES, arma = ve && d.aviso && d.t0 > 0 && S.T < d.ts + 0.08, abierto = ve && (S.T < (d.abierto || 0) || S.T < (d.deseq || 0));
  ANILLO.visible = arma; DIANA.visible = arma || abierto;
  if (DIANA.visible) {
    const x = (g.xd ?? g.x) + (g.fx || 0), z = (g.zd ?? g.z) + (g.fz || 0) /* FI2 */, y = H(x, z) + 1.25;
    for (const a of [ANILLO, DIANA]) { a.position.set(x, y, z); a.quaternion.copy(camara.quaternion); }
    if (arma) {
      const t = S.T - d.t0, tot = d.ts - d.t0, tA = d.tA || d.tb, fin = d.tipo === 'finta' ? Math.min(0.8, t / (tot - (d.tb - tA))) : 0;
      const p = d.tipo === 'finta' ? (t < tA ? fin : 0.8 + 0.2 * Math.min(1, (t - tA) / (tot - tA))) : Math.min(1, t / tot), ven = S.T > d.ts - ACC.VENTANA;
      ANILLO.scale.setScalar(1 + 2.4 * (1 - p)); ANILLO.material.color.set(ven ? '#ff3020' : '#ffb020'); ANILLO.material.opacity = ven ? 1 : 0.9;
      DIANA.scale.setScalar(1); DIANA.material.color.set(ven ? '#ff3020' : '#fff3dc'); DIANA.material.opacity = ven ? 0.9 : 0.55;
    } else { DIANA.scale.setScalar(1.05 + 0.08 * Math.sin(S.T * 12)); DIANA.material.color.set('#8ef07a'); DIANA.material.opacity = 0.85; }
  }
  /* las gotas: salen del sitio del golpe hacia delante y caen (cuentas cerradas, sin dt) */
  const tg = S.T - S.tGotas; GOTAS.visible = tg >= 0 && tg < 0.7;
  if (GOTAS.visible) { const pa = GOTAS.geometry.attributes.position, p0 = GOTAS.userData.p0; GOTAS.userData.v.forEach((v, i) => { const px = p0.x + v.x * tg, pz = p0.z + v.z * tg; pa.setXYZ(i, px, Math.max(H(px, pz) + 0.02, p0.y + v.y * tg - 4.9 * tg * tg), pz); }); pa.needsUpdate = true; }
}
function pon(fig, i, x, y, z, yaw, frame) { O.position.set(x, y, z); O.rotation.set(0, yaw, 0); O.scale.setScalar(E); O.updateMatrix(); fig.m.setMatrixAt(i, O.matrix); fig.fr.array[i] = frame; }
/* el pilum en la mano: de pie en la marcha, tendido hacia delante bajo los escudos, y al hombro para lanzar */
const Q_PIE = giro(1, 0, 0, -Math.PI / 2 - 0.1), Q_TENDIDO = giro(1, 0, 0, 0.1).multiply(Q_PI), Q_LANZA = giro(1, 0, 0, 0.3).multiply(Q_PI);
const MARCA = MARCAS ? Array.from({ length: 6 }, () => { const d = document.createElement('i'); d.style.cssText = 'position:absolute;width:8px;height:8px;margin:-4px;border-radius:50%;background:#0ff;border:1px solid #000;z-index:9'; $('hud').appendChild(d); return d; }) : null;
function dibuja() {
  const T = S.T, k = S.k, R = S.romanos, yo = R[YO], co = R[CMP];
  /* romanos: figura, escudo y lo que llevan en la mano derecha */
  for (const h of R) {
    const i = h.i;
    HOM.escudos.setMatrixAt(i, h === yo ? CERO : h.mEsc);
    const mano = S.armas === 'espada' || !h.vivo || (h.tiro && h.pilos <= 0);   /* GM43h: entre salva y salva la mano queda libre */
    HOM.espadas.setMatrixAt(i, mano && !h.oculto ? MA.multiplyMatrices(h.inst, hueso(HU.espada, h.A, h.B, h.mx, MB)) : CERO);
    /* (el de detrás de ti, a tiro, queda a la altura de la cámara: su pilum en la mano no se pinta, que se cruzaría delante) */
    const pegado = h.z > CAM.z - 0.6 && Math.abs(h.x - CAM.x) < 0.8;
    if (S.armas === 'pilum' && h.vivo && !h.tiro && !h.oculto && !pegado) { pilumEnMano(h, PA, QA); HOM.pila.setMatrixAt(i, MA.compose(PA, QA, SA.set(1, 1, 1))); }
    else HOM.pila.setMatrixAt(i, CERO);
  }
  for (const m of [HOM.escudos, HOM.espadas, HOM.pila]) m.instanceMatrix.needsUpdate = true;
  reparte(HOM.D, HOM.LJ, R, CERCA);
  HOM.mio.visible = !S.roto; HOM.mio.matrix.copy(yo.mEsc); HOM.mio.matrixWorld.copy(yo.mEsc); dibujaMarcas();
  /* enemigos */
  const P = figuras.peltastas, CP = P.u.clips;
  S.tiradores.forEach((t, i) => {
    let fr, yaw = 0;
    if (!t.vivo) fr = frameOnce(CP.death, Math.max(0, T - t.muere));
    else if (t.huye) { fr = frameOf(CP.run, T + t.fase); yaw = Math.PI; }
    else if (t.tira !== undefined && T - t.tira < 2.4 && T - t.tira > -1.5) fr = frameOnce(CP.attack_ranged, (T - t.tira + 1.5) * 1.3);
    else fr = frameOf(CP.idle, T + t.fase);
    pon(P, i, t.x, H(t.x, t.z), t.z, yaw, fr); if (t.z <= -150) P.m.setMatrixAt(i, CERO);   /* GM43h: los que huyen se pierden loma arriba */
  });
  P.m.instanceMatrix.needsUpdate = true; P.fr.needsUpdate = true;
  const G = figuras.galos;
  reparte(G, G.L, S.galos, CERCA);
  /* venablos: en vuelo, clavados en un escudo (van con él) o en tierra */
  FL.forEach((f, i) => {
    if (f.est === 0 || (f.est === 1 && T < f.t0)) { flechas.setMatrixAt(i, CERO); return; }
    { const q = FP.pose(f, 'v'); if (q) { O.position.fromArray(q.o); O.quaternion.setFromUnitVectors(Z1, DF3.fromArray(q.dir)); O.scale.setScalar(1); O.updateMatrix(); flechas.setMatrixAt(i, O.matrix); return; } }   /* FI3 */
    if (f.est === 2) { f.q.copy(f.h.qEsc).multiply(f.ql); V3.set(0, 0, 1).applyQuaternion(f.q); f.p.copy(f.rel).applyMatrix4(f.h.mEsc).addScaledVector(V3, -PUNTA); }
    O.position.copy(f.p); O.quaternion.copy(f.q); O.scale.setScalar(1); O.updateMatrix(); flechas.setMatrixAt(i, O.matrix);
  });
  flechas.instanceMatrix.needsUpdate = true;
  for (const c of CHISPAS) { const a = T - c.t; c.s.visible = a >= 0 && a < 0.25; if (c.s.visible) { c.s.scale.setScalar((c.e || 1) * (0.6 + a * 5)); c.s.material.opacity = 1 - a / 0.25; } }
  for (const p of POLVO) { const a = T - p.t; p.s.visible = a >= 0 && a < 3; if (p.s.visible) { const e = p.e || 1; p.s.scale.setScalar(e * (1.2 + a * 1.6)); p.s.material.opacity = 0.85 * (1 - a / 3) * (e < 1 ? Math.max(0, 1 - a) : 1); } }
  /* pila lanzados: en el aire, en tierra o clavados en el escudo de un galo (van con él aunque caiga) */
  PILA.forEach((p, i) => {
    if (p.est < 2) { pilaVuelo.setMatrixAt(i, CERO); return; }
    { const q = FP.pose(p, 'p'); if (q) { pilaVuelo.setMatrixAt(i, MF3.compose(PF3.fromArray(q.o), QF3.setFromUnitVectors(Z1, DF3.fromArray(q.dir)), UNO)); return; } }   /* FI3 */
    if (p.est === 4) p.m.multiplyMatrices(huesoEscudoGalo(p.g, _gm), p.rel); else p.m.compose(p.p, p.q, UNO);
    pilaVuelo.setMatrixAt(i, p.m);
  });
  pilaVuelo.instanceMatrix.needsUpdate = true;
  /* la cámara (ver camBase), con cabeceo al paso, temblor al correr y sacudida con giro cuando cae cada salva */
  camBase(); const yp = R[YO].paso, andar = ANTES ? (S.vel > 0 ? (S.corriendo ? 2.5 : 1) : 0) : Math.min(1, yp.v / V_PASO) * lerp(1, 2.5, Math.max(0, Math.min(1, yp.g - 1))), ph = ANTES ? S.paso / lerp(1.5, 1.05, k) * Math.PI : yp.ciclos * 2 * Math.PI, sc = S.sacude;
  let cx = CAM.x + Math.sin(ph) * 0.025 * andar, cy = CAM.y + Math.abs(Math.sin(ph)) * 0.04 * andar;
  const sac = (S.fase === 'carga' && !S.choque ? 0.06 : 0) + (S.corriendo ? 0.02 : 0) + sc * 0.09;
  cx += (Math.random() - 0.5) * sac; cy += (Math.random() - 0.5) * sac - sc * sc * 0.12;
  /* TP8 1a: tirón corto de la cámara hacia donde va el golpe de tu duelo */
  let cz = CAM.z; const tr = S.tiron, ta = tr ? S.T - tr.t : 9; if (ta >= 0 && ta < 0.3) { const a = 0.07 * tr.e * (1 - ta / 0.3) ** 2; cx += tr.x * a; cz += tr.z * a; cy -= 0.4 * a; }
  camara.position.set(cx, cy, cz);
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
/* TP1b · las órdenes (Escudos, Cargad, Relevo; «Pila» es el botón de lanzar). Sin centurión tardan en cumplirse */
function puedeOrden(n) {
  if (S.fase === 'fin' || S.huida || S.derrota) return false;
  if (n === 'escudos') return S.fase === 'avance' || S.choque;
  if (n === 'cargad') return S.fase === 'pila' || (S.choque && S.T >= S.tCargad);
  if (n === 'relevo') return S.choque && S.T >= S.tRelevo;
  return false;
}
function ordena(n) {
  if (!puedeOrden(n)) return false;
  const r = S.unidad.retraso(); S.ordenes.push({ n, t: S.T + r });
  if (n === 'relevo') S.tRelevo = S.T + 7; if (n === 'cargad' && S.choque) S.tCargad = S.T + 7;
  if (r) cinta('Sin centurión: tardan en obedecer', false);
  return true;
}
function cumple(n) {
  if (n === 'escudos') {
    if (S.choque) { S.muro = !S.muro; Son.clac(S.muro ? 10 : 6); grita(S.muro ? '¡Escudos! ¡Aguantad!' : '¡A ellos!'); }
    else if (S.fase === 'avance') { S.escudos = !S.escudos; if (S.escudos) S.corre = false; Son.clac(S.escudos ? 10 : 6); }
  }
  if (n === 'cargad') { if (S.fase === 'pila') alGladio(); else if (S.choque) { ACC.cargad(); S.muro = false; grita('¡Cargad!'); Son.choque(); } }
  if (n === 'relevo' && S.choque) { ACC.relevoOrden(); grita('¡Relevo! ¡La segunda, adelante!'); Son.cuerno([[220, 0.25], [220, 0.5]]); }
}
/* el nombre de cada hombre, para decirte quién eres cuando caes */
const NOMBRES = ['Marco', 'Tito', 'Lucio', 'Cayo', 'Quinto', 'Publio', 'Aulo', 'Sexto', 'Décimo', 'Gneo', 'Servio', 'Espurio', 'Numerio', 'Opiter', 'Vibio'];
function nombre(h) { return NOMBRES[(h.i * 7) % NOMBRES.length] + ', de la ' + (h.r + 1) + '.ª fila'; }
const HUD = crearHud({ S, Son, $, M, RECARGA, ZONA, vivos, armar: () => armar(), soltar: () => soltar(), ordena, puedeOrden });
const { hud, muestraFin } = HUD;

/* ---------- fases para las capturas: colocan la escena y la congelan ---------- */
let parado = false;
const salta = s => { for (let t = 0; t < s; t += 1 / 30) paso(1 / 30); };
function prepara(f) {
  if (f === 'avance') { S.zF = -14; S.proxima = 99; S.andando = true; salta(1.3); }
  if (f === 'flechas') { S.zF = -28; S.andando = true; S.proxima = S.T + 1.25; salta(1.25 + 0.8); }
  const LUCHA2 = ['aviso', 'parada', 'estocada', 'relevo', 'caido', 'huida'];
  if (['testudo', 'cara', 'mira', 'roto', 'pila', 'armar', 'vuelo', 'impacto', 'final', 'carga', 'lucha', ...LUCHA2].includes(f)) {
    S.zF = -30; S.andando = true; S.proxima = S.T + 0.5; salta(3.2);
    S.escudos = true; S.proxima = S.T + 0.6; salta(3.4);
    if (f === 'roto') for (let i = 0; i < 3; i++) { S.proxima = S.T + 0.3; salta(2.9); }
    if (f === 'testudo' || f === 'cara' || f === 'mira' || f === 'roto') S.zF = -50;
    S.proxima = S.T + 0.5; salta(f === 'testudo' ? 0.5 + 1.9 : f === 'mira' ? 0.5 + 2.2 + 1.5 : f === 'cara' || f === 'roto' ? 0.5 + 2.2 + 0.3 : 3);
  }
  /* GM43h: a tiro, armar (medidor a medias), tu pilum en el aire, la segunda salva recién llegada, la carga y el final */
  const tiro = (s) => { armar(); salta(s); soltar(); };
  if (['pila', 'armar', 'vuelo', 'impacto', 'final', 'carga', 'lucha', ...LUCHA2].includes(f)) { S.zF = Z_PILA + 0.5; S.andando = true; salta(0.9); S.escudos = false; salta(f === 'pila' ? 2.5 : 1.2); }
  if (f === 'armar') { armar(); salta(T_MEDIDOR / 2); }
  if (f === 'vuelo') { tiro(T_MEDIDOR - 0.06); salta(0.17 + 0.55); }
  if (f === 'impacto' || f === 'carga' || f === 'final') { tiro(T_MEDIDOR - 0.06); salta(RECARGA + 0.05 + (f === 'impacto' ? 1.8 : 0)); tiro(T_MEDIDOR - 0.06); salta(f === 'impacto' ? 0.17 + 1.3 + 0.9 : 0.5); }
  if (f === 'carga') { for (let i = 0; i < 300 && S.fase !== 'carga'; i++) salta(0.1); salta(0.45); }
  if (f === 'final') { for (let i = 0; i < 1200 && S.fase !== 'fin'; i++) salta(0.1); salta(0.5); }
  /* TP1: la lucha de B (duelos a la vez, caídos, relevo), unos segundos después del choque */
  if (f === 'lucha') { tiro(T_MEDIDOR - 0.06); salta(RECARGA + 0.05); tiro(T_MEDIDOR - 0.06); for (let i = 0; i < 300 && !S.choque; i++) salta(0.1); salta(3.6); }
  /* TP1b: tu duelo y el final de la lucha. aviso: tu rival arma el golpe (marcado); parada: lo paras; estocada: tras parar,
     tu golpe entra; relevo: la segunda fila pasa delante; caido: el centurión cae y eres otro; huida: los galos rompen */
  if (LUCHA2.includes(f)) {
    const hasta = (c, seg = 40) => { for (let i = 0; i < seg * 30 && !c(); i++) paso(1 / 30); }, tu = () => S.yo && S.yo.duelo, arma = (a = 0.55) => { const d = tu(); return d && d.aviso && d.t0 > 0 && S.T > d.t0 + a; };
    S.forzarGolpe = 'tajo'; tiro(T_MEDIDOR - 0.06); salta(RECARGA + 0.05); tiro(T_MEDIDOR - 0.06); hasta(() => S.choque, 30); salta(1.2);
    if (f === 'aviso') hasta(() => arma(0.62));
    if (f === 'parada' || f === 'estocada') { hasta(() => arma(0.1)); hasta(() => S.T > tu().ts - 0.3); const d = tu(), ts = d.ts; S.pide = 'parar'; hasta(() => S.T > ts + 0.1); }
    if (f === 'estocada') { salta(0.15); S.pide = 'estocada'; paso(1 / 30); const ts = tu().ts; hasta(() => S.T > ts + 0.12); }
    if (f === 'relevo') { salta(1.5); ordena('relevo'); salta(1.0); }
    if (f === 'caido') { S.yo.golpes = 2; hasta(() => !S.romanos[YO].vivo); hasta(() => S.yo && S.yo !== S.romanos[YO] && S.yo.duelo && S.yo.duelo.r === S.yo); salta(0.5); }
    if (f === 'huida') { S.unidadG.animo = Math.min(S.unidadG.animo, 0.215); hasta(() => S.huida); salta(1.4); }
  }
  /* TP1: andar y correr, para mirar los pies (con ?costado=r) */
  if (f === 'andar') { S.zF = -14; S.proxima = 99; S.andando = true; salta(3); }
  if (f === 'correr') { S.zF = -14; S.proxima = 99; S.corre = true; salta(2.5); }
  if (['testudo', 'cara', 'mira', 'roto'].includes(f)) S.andando = true;
  parado = true;
}

/* ---------- TP1 · medidas del paso (para captura.mjs) ----------
   patinaje: mientras un pie es el más bajo (apoyado), cuánto se desliza por el suelo; se suma por apoyo y se da la media y
   el peor, en cm. Solo cuentan los apoyos en que el hombre avanza de verdad (10 cm o más) y no el primero de cada uno.
   «a la vez»: la dispersión de las fases de paso (0, todos a la vez; 1, repartidas del todo) */
const _pv = new THREE.Vector3();
function piesMundo(m, galo) {
  const tab = galo ? FIG_G.tab : HOM, P = galo ? FIG_G.pies : HOM.pies, w = pie => _pv.fromArray(pieEn(tab.T, tab.hues, pie, m.A, m.B, m.mx)).applyMatrix4(m.inst).toArray();
  return [w(P.I), w(P.D)];
}
function faseDe(m, galo) {
  if (!ANTES) return m.paso.fase;
  if (galo) return (m.dist / (FIG_G.C.walk.zancada * E)) % 1;
  return ((S.paso / lerp(V_PASO, 1.26, S.k) + m.fase) / HOM.C.walk.dur) % 1;
}
function patinaje(quien, modo, seg = 4) {
  reinicia(); parado = true; S.proxima = 999; const galo = quien === 'g', L = galo ? S.galos : S.romanos;
  S.zF = -14; if (galo) { S.tGalos = S.T + 0.2; S.corrida = modo === 'corre'; }
  else if (modo === 'anda') S.andando = true; else if (modo === 'corre') S.corre = true; else if (modo === 'testudo') { S.andando = true; S.escudos = true; }
  const tab = galo ? FIG_G.tab : HOM, P = galo ? FIG_G.pies : HOM.pies, ri = (galo ? FIG_G.C : HOM.C).idle.start, h0 = pieEn(tab.T, tab.hues, P.I, ri, ri, 0)[1] * E;
  const est = L.map(() => ({ lado: null, prev: null, acc: 0, n: 0, veces: 0, x0: 0, z0: 0 })), apoyos = [], disp = [], calen = modo === 'paso' ? 0 : 45, N = Math.round(seg * 30) + calen;
  for (let k = 0; k < N; k++) {
    if (modo === 'paso') { const t = k / 30; S.andando = t > 1 && t < 4; S.corre = t >= 4 && t < 6.5; }
    paso(1 / 30); if (k < calen) continue;
    L.forEach((m, j) => {
      if (!m.vivo) return; const [pI, pD] = piesMundo(m, galo), yI = pI[1] - H(pI[0], pI[2]), yD = pD[1] - H(pD[0], pD[2]), lado = Math.min(yI, yD) < h0 + 0.05 ? (yI < yD ? 'I' : 'D') : null, p = lado === 'I' ? pI : pD, e = est[j];   /* en el aire (al correr), ningún pie apoya */
      if (lado && e.lado === lado && e.prev) { e.acc += Math.hypot(p[0] - e.prev[0], p[2] - e.prev[2]); e.n++; }
      else { if (e.lado && e.n >= 3 && e.veces > 1 && Math.hypot(m.x - e.x0, m.z - e.z0) >= 0.1) apoyos.push(e.acc); e.veces++; e.acc = 0; e.n = 0; e.x0 = m.x; e.z0 = m.z; }
      e.lado = lado; e.prev = p;
    });
    if (k % 15 === 0 && (galo || S.vel > 0.3)) disp.push(dispersion(L.filter(m => m.vivo).map(m => faseDe(m, galo))));
  }
  apoyos.sort((a, b) => a - b);
  const media = apoyos.reduce((a, b) => a + b, 0) / Math.max(1, apoyos.length);
  return { apoyos: apoyos.length, media: +(media * 100).toFixed(1), p90: +((apoyos[Math.floor(apoyos.length * 0.9)] || 0) * 100).toFixed(1), peor: +((apoyos[apoyos.length - 1] || 0) * 100).toFixed(1), dispersion: disp.length ? +(disp.reduce((a, b) => a + b, 0) / disp.length).toFixed(2) : 0, v: +(galo ? S.galos[0].v : S.vel).toFixed(2) };
}
/* ordena la marcha para la tira de costado: se coloca y se adelanta el reloj hasta el instante t (desde el principio) */
function tira(quien, modo, t) {
  reinicia(); parado = true; S.proxima = 999; S.zF = -14; const galo = quien === 'g';
  if (galo) { S.tGalos = 0.2; S.corrida = modo === 'corre'; }
  for (let k = 0; k < Math.round(t * 30); k++) {
    const s = k / 30;
    if (!galo) { if (modo === 'paso') { S.andando = s > 1 && s < 4; S.corre = s >= 4 && s < 6.5; } else if (modo === 'anda') S.andando = true; else S.corre = true; }
    paso(1 / 30);
  }
  const L = galo ? S.galos : S.romanos.filter(h => h.r <= 1), h = L[0];
  return { v: +(galo ? h.v : S.vel).toFixed(2), g: +h.paso.g.toFixed(2), fase: +h.paso.fase.toFixed(2), inclina: +h.paso.inclina.toFixed(2) };
}

/* ---------- arranque ---------- */
let ultimo = 0, CAMPO = null;
/* TP9a: medidor de fluidez (idea de la maqueta «lucha»): cuadros de los últimos 5 s; cada 0,5 s, la media y el peor */
const tiempos = []; let medT = 0;
function bucle(t) {
  if (CAMPO) CAMPO.tick(t / 1000);
  const dtR = (t - ultimo) / 1000 || 0, dt = Math.min(0.05, dtR); ultimo = t;
  if (dtR > 0 && dtR < 10) { tiempos.push([t, dtR * 1000]); while (tiempos.length && t - tiempos[0][0] > 5000) tiempos.shift(); medT -= dtR; if (medT <= 0 && tiempos.length > 2) { medT = 0.5; HUD.medidor((tiempos.length - 1) / Math.max(0.001, (t - tiempos[0][0]) / 1000), Math.max(...tiempos.map(x => x[1]))); } }
  if (!parado) { if (S.congela > 0) S.congela -= dt; else { const k = S.lento > 0 ? 0.4 : 1; if (S.lento > 0) S.lento -= dt; paso(dt * k); } }   /* TP8b-L1: y la cámara lenta al matarlo */   /* TP8 1a: la pausa mínima al acertar en tu duelo */
  dibuja(); hud(); requestAnimationFrame(bucle);
}
/* TP8 1a: el sitio donde para la hoja: el centro del escudo del que recibe o, si le dan, la cara de su pecho */
let ESC_C = null;
function blanco(def, at, escudo, out) {
  if (escudo && def.lado === 'r') {
    if (!ESC_C) { const g = HOM.escudos.geometry.attributes.position; ESC_C = new THREE.Vector3(); for (let i = 0; i < g.count; i++) ESC_C.add(_cP.fromBufferAttribute(g, i)); ESC_C.divideScalar(g.count); }
    return out.copy(ESC_C).applyMatrix4(def.mEsc);
  }
  if (escudo && GESC) return out.copy(GESC.c).applyMatrix4(huesoEscudoGalo(def, _gm));
  const x = def.xd ?? def.x, z = def.zd ?? def.z, dx = at.x - x, dz = at.z - z, l = Math.hypot(dx, dz) || 1;
  return out.set(x + dx / l * 0.14, H(x, z) + 1.15, z + dz / l * 0.14);
}
/* lo que llega la hoja hacia delante (metros, sin escala) en cada fracción del clip: una vez por clip */
const ALC = new Map();
function llegaClip(lado, cl) {
  const k = lado + cl.c.start + ':' + cl.s0 + ':' + cl.s1; if (ALC.has(k)) return ALC.get(k);
  const R = [];
  for (let j = 0; j <= 16; j++) {
    const fr = Math.round(ACC.clipPos(cl, j / 16)); let mx = -9;
    if (lado === 'r') { const g = HOM.espadas.geometry.attributes.position; hueso(HU.espada, fr, fr, 0, MB); for (let i = 0; i < g.count; i += 3) mx = Math.max(mx, _cP.fromBufferAttribute(g, i).applyMatrix4(MB).z); }
    else if (GESC && GESC.arma) for (const a of GESC.arma) mx = Math.max(mx, _cP.copy(a.p).applyMatrix4(huesoT(FIG_G.tab, a.slot, fr, fr, 0, _gb)).z);
    R.push(mx);
  }
  ALC.set(k, R); return R;
}
/* acciones.js pregunta, al empezar cada golpe, cuánto apartar al que golpea para que la hoja pare en el blanco (3 cm antes) */
function alcance(at, def, d) {
  if (lado0(at) && !GESC) return null;
  const R = llegaClip(at.lado, d.clip), esc = at.sv.z, dx = at.x - def.x, dz = at.z - def.z, l = Math.hypot(dx, dz) || 1;
  const escudo = d.res === 'cubre' || !d.res; blanco(def, at, escudo, _cC);
  /* del que golpea al plano del blanco (el romano, al cubrirse, adelanta el escudo: un palmo más de margen) */
  const hasta = ((_cC.x - at.x) * -dx + (_cC.z - at.z) * -dz) / l - (escudo && def.lado === 'r' ? 0.15 : 0.03);
  return R.map(r => Math.max(0, r * esc - hasta));
}
const lado0 = h => h.lado === 'g';
/* el golpe llega: chispa (escudo) o polvo (cuerpo) donde da; en tu duelo, además, pausa mínima y tirón de cámara */
function golpe(d, def, at, tipo, tuyo) {
  blanco(def, at, tipo === 'escudo', PB); const dx = def.x - at.x, dz = def.z - at.z, l = Math.hypot(dx, dz) || 1;
  if (tipo === 'escudo') { PB.x -= dx / l * 0.12; PB.z -= dz / l * 0.12; chispa(PB, tuyo ? 0.9 : 0.5); }
  else { chispa(PB, tuyo ? 0.45 : 0.25); polvazo(PB.x, PB.y - 0.3, PB.z, tuyo ? 0.35 : 0.2); }
  def.fuerte = tuyo && at.lado === 'r' && tipo === 'cuerpo';
  if (tuyo) { S.congela = def.fuerte ? 0.11 : tipo === 'cuerpo' ? 0.09 : 0.065; S.tiron = { t: S.T, x: dx / l, z: dz / l, e: def.fuerte ? 1.8 : tipo === 'cuerpo' ? 1 : 0.7 }; }
  /* TP8b-L1: tu estocada entra: salpicadura oscura corta, polvo en sus pies y, si lo mata, un instante a cámara lenta */
  if (def.fuerte) {
    S.tGotas = S.T; GOTAS.userData.p0.copy(PB); GOTAS.userData.v.forEach(v => v.set(dx / l * (0.6 + azarV() * 0.8) + (azarV() - 0.5) * 0.7, 0.6 + azarV() * 1.1, dz / l * (0.6 + azarV() * 0.8) + (azarV() - 0.5) * 0.7));
    const fx = def.xd ?? def.x, fz = def.zd ?? def.z; polvazo(fx, H(fx, fz) + 0.2, fz, 0.6); polvazo(fx + 0.2, H(fx, fz) + 0.15, fz - 0.15, 0.45); S.sacude = Math.max(S.sacude, 0.2);
    if (d.res === 'muere') S.lento = 0.35;
  }
}
/* cuánto se dobla un hombre por el golpe: hacia delante si le dan en el cuerpo, atrás si es en el escudo */
function dobla(m) {
  if (!m.tipoGolpe) return 0; const t = S.T - m.tGolpe; if (t < 0 || t > 1) return 0;
  if (m.fuerte && m.tipoGolpe === 'cuerpo') return 0.5 * (suave(0, 0.07, t) - suave(0.4, 1, t));   /* tu estocada: se dobla sobre la hoja */
  return m.tipoGolpe === 'cuerpo' ? 0.26 * (suave(0, 0.08, t) - suave(0.35, 0.9, t)) : -0.1 * (suave(0, 0.06, t) - suave(0.12, 0.45, t));
}
/* TP8 1a: medida de «atraviesan» (ver window.__tp.contacto) */
const _cP = new THREE.Vector3(), _cC = new THREE.Vector3(), _cM = new THREE.Matrix4();
function puntaPasa(at, def, C) {
  const nx = at.xd - def.xd, nz = at.zd - def.zd, nl = Math.hypot(nx, nz) || 1; let mx = -9;
  const pasa = p => { const s = -((p.x - C.x) * nx + (p.z - C.z) * nz) / nl; if (s > mx) mx = s; };
  if (at.lado === 'r') {
    const g = HOM.espadas.geometry.attributes.position; MA.multiplyMatrices(at.inst, hueso(HU.espada, at.A, at.B, at.mx, MB));
    for (let i = 0; i < g.count; i += 3) pasa(_cP.fromBufferAttribute(g, i).applyMatrix4(MA));
  } else if (GESC && GESC.arma) for (const a of GESC.arma) pasa(_cP.copy(a.p).applyMatrix4(_cM.multiplyMatrices(at.inst, huesoT(FIG_G.tab, a.slot, at.A, at.B, at.mx, _gb))));
  return mx;
}
function contacto() {
  const out = [];
  for (const d of S.duelos || []) {
    if (!d.activo || d.sec || !d.r.vivo || !d.g.vivo || d.r.xd === undefined || d.g.xd === undefined) continue;
    const cad = Math.hypot(d.r.xd - d.g.xd, d.r.zd - d.g.zd), ataca = d.t0 > 0 && S.T - d.t0 < d.tb + d.clip.dur + 0.3;
    let pasa = null;
    if (ataca) {
      const at = d.ataR ? d.r : d.g, def = d.ataR ? d.g : d.r;
      blanco(def, at, d.res === 'cubre' || !d.res, _cC); pasa = +puntaPasa(at, def, _cC).toFixed(3);
    }
    out.push({ yo: d.r === S.yo, cad: +cad.toFixed(3), pasa, ataR: d.ataR, res: d.res });
  }
  return out;
}
/* para las pruebas: el estado y dónde caen en pantalla (0 a 1) tu cabeza, la de tu compañero, la rendija y el enemigo */
const enPantalla = v => { v.project(camara); return { x: +((v.x + 1) / 2).toFixed(3), y: +((1 - v.y) / 2).toFixed(3), delante: v.z < 1 }; };
window.__tp = {
  lista: false, S, CAM, camara, Son, luz, renderer, escena, reinicia: () => reinicia(), Z_PILA, cine: { rayos, motas, pies, cielo, PIES }, salta: s => salta(s), parar: v => { parado = v; },
  /* GM43h: el dedo en «Lanzar» (sin tocar la pantalla) y dónde caen en pantalla tu mano y la punta de tu pilum */
  armar: () => armar(), soltar: () => soltar(), medidor: () => S.medidor,
  /* TP1b: tus gestos y órdenes (como los botones) y lo que se sabe de tu duelo y de los dos bandos */
  pide: x => { S.pide = x; }, ordena: n => ordena(n), primera: () => ACC.primera(),
  duelo: () => { const y = S.yo, d = y && y.duelo; return { yo: y ? y.i : -1, vivo: !!(y && y.vivo), centurion: S.unidad.centurion, heridas: y ? y.golpes : 0, eco: S.eco ? S.eco.texto : '', arma: !!(d && d.aviso && d.t0 > 0 && S.T < d.ts), tAviso: d && d.aviso ? +(d.ts - S.T).toFixed(2) : null, abierto: !!(d && (S.T < (d.abierto || 0) || S.T < (d.deseq || 0))), ocupado: !!(d && ACC.ocupado(d)), aro: ARO.visible, cresta: enPantalla(PA.setFromMatrixPosition(CRESTA.matrix)) }; },
  bandos: () => ({ r: palabras(S.unidad), g: palabras(S.unidadG), animoR: +S.unidad.animo.toFixed(2), animoG: +S.unidadG.animo.toFixed(2), fatigaR: +S.unidad.fatiga.toFixed(2), fatigaG: +S.unidadG.fatiga.toFixed(2), ruptura: S.ruptura, huyen: S.galos.filter(g => g.vivo && g.huye && g.paso.v > 2.5).length, veredicto: veredicto(S.unidad, S.unidadG), T: +S.T.toFixed(1), tChoque: +S.tChoque.toFixed(1) }),
  /* TP1: el paso, la lucha y la tira de costado */
  interno: () => ({ HOM, FIG_G, piesMundo }), patinaje: (q, m, seg) => patinaje(q, m, seg), tira: (q, m, t) => tira(q, m, t), antes: ANTES,
  /* TP8 1a: en cada duelo de la primera fila, la distancia entre caderas y cuánto pasa la punta del arma del que golpea al
     otro lado del plano de su escudo (metros; negativo: no llega). El plano pasa por el centro del escudo y mira al rival */
  contacto: () => contacto(),
  fisica: () => FIS.medida(), fisicaEmpieza: () => FIS.empieza(), fisicaActiva: FIS.activa,   /* FI2 */
  proyectiles: () => FP.medida(), proyectilesMide: () => FP.mide(S), proyectilesActiva: FP.activa,   /* FI3: medida de venablos y pila */
  lucha: () => ({ ...ACC.medLucha(), relevos: S.duelos.filter(d => d.activo && !d.sec && d.r.j === 0 && d.r.r > 0).length, dibujadosCaidos: S.romanos.filter(h => !h.vivo).length }),
  gesto: () => { const yo = S.romanos[YO], P = new THREE.Vector3(), Qm = new THREE.Quaternion(); pilumEnMano(yo, P, Qm); const punta = P.clone().addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(Qm), PUNTA); return { mano: enPantalla(ancla(yo, HU.espada, [0, 0, 0], new THREE.Vector3())), punta: enPantalla(punta), conPilum: !yo.tiro, galo: enPantalla(new THREE.Vector3(0, H(0, frenteGalo()) + 1.2, frenteGalo())) }; },
  galos: () => ({ vivos: S.galos.filter(g => g.vivo).length, porPila: S.caidos, hueco: +hueco().toFixed(2), clavados: PILA.filter(p => p.est === 4).length, enTierra: PILA.filter(p => p.est === 3).length, enAire: PILA.filter(p => p.est === 2).length, corren: S.galos.filter(g => g.vivo && g.v > 3).length, andan: S.galos.filter(g => g.vivo && g.v > 0.25 && g.v <= 3).length }),
  estado: () => ({ salvas: S.salvas, buenos: S.buenos, caidos: S.caidos, choque: S.choque, armando: S.armando, dedo: S.dedo, golpes: S.golpes, roto: S.roto, clavados: FL.filter(f => f.est === 2).length, enHombre: FL.filter(f => f.est === 2 && f.h.k < 0.7).length, andando: S.andando, corriendo: S.corriendo, vel: S.vel, fase: S.fase, zF: S.zF, k: S.k, vivos: vivos(), flechas: FL.filter(f => f.est).length, mira: S.romanos[YO].mira, enc: S.romanos[YO].enc }),
  encuadre: () => { const R = S.romanos, yF = H(CAM.x, S.zF); return { yo: enPantalla(ancla(R[YO], HU.cara, [0, 0, 0.25], new THREE.Vector3())), comp: enPantalla(ancla(R[CMP], HU.cara, [0, 0, 0.25], new THREE.Vector3())), rendija: enPantalla(new THREE.Vector3((R[YO].x + R[CMP].x) / 2, yF + 1.8, S.zF - MURO_Z)), enemigo: enPantalla(new THREE.Vector3(0, H(0, Z_TIRADORES) + 1, Z_TIRADORES)), muro: enPantalla(new THREE.Vector3(CAM.x, yF + MURO_Y + 0.72, S.zF - MURO_Z)), techo: enPantalla(new THREE.Vector3(CAM.x, yF + TECHO_Y + 0.03, S.zF + CERRADO.dz - TECHO_Z - 0.72)) }; },
  /* para comprobar las cuentas: dónde están de verdad cabeza y manos de un hombre */
  medidas: i => { const h = S.romanos[i], y0 = H(h.x, h.z), r = p => [+(p.x - h.x).toFixed(3), +(p.y - y0).toFixed(3), +(p.z - h.z).toFixed(3)]; return { cabeza: r(ancla(h, HU.cara, [0, 0, 0.25], new THREE.Vector3())), manoI: r(ancla(h, HU.escudo, [0, 0, 0], new THREE.Vector3())), escudo: r(new THREE.Vector3().setFromMatrixPosition(h.mEsc)), manoD: r(ancla(h, HU.espada, [0, 0, 0], new THREE.Vector3())) }; },
};
(async () => {
  await preload(['hastati', 'peltastas', 'galos']);
  { const td = await new THREE.TextureLoader().loadAsync('gobierno/maquetas/testudo-luz-campo/arte/detalle.png'); td.wrapS = td.wrapT = THREE.RepeatWrapping; td.anisotropy = 4; DET.value = td; }
  if (!getUnit('hastati') || !getUnit('peltastas') || !getUnit('galos')) { $('carga').querySelector('p').textContent = 'No se han podido cargar los soldados'; throw new Error('No se han podido cargar los soldados'); }
  CAMPO = await crearCampo(escena, { H, SOL, cine, sueloCine, BRUMA: escena.fog.color });
  await creaHombres(); creaCresta(); malla('peltastas', 10, '#3456a8'); malla('galos', N_GF + RESERVA_G, '#3456a8'); preparaGalos();
  try { await escudoGalo(); } catch (e) { console.warn('Sin escudo galo para clavar pila', e); }
  ACC = crearAcciones({ S, Son, panDe, chispa, V3, H, PIES, azarV, CJ, suave, E, figuras, cinta, nombre, get HOM() { return HOM; }, alcance: ANTES ? undefined : alcance, golpe: ANTES ? undefined : golpe, aliento: !ANTES });
  reinicia();
  if (FASE) prepara(FASE);
  $('carga').hidden = true;
  requestAnimationFrame(t => { ultimo = t; bucle(t); });
  setTimeout(() => { window.__tp.lista = true; }, 400);
})();
