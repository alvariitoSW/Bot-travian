/* AQVILA — vista 3D de la ciudad nueva (CN3-C1). El DIBUJO viene de la maqueta gobierno/maquetas/ciudad3/vista.js; las REGLAS, de js/ciudad.js
   (estado E = Game.ciudadE(id)). La interfaz hacia ui.js no cambia: new CityView3D(host, {onPick}), update(city, id, sel, t), view, zoom, resize, meta, fichaTop.
   REAL (arte de 0 A.D., Wildfire Games, CC BY-SA 3.0): casas de nivel II a IV (casa, casa_b, casa_c, casa_d), foro, templo, mercado, almacén,
   aserradero, granja, cantera, mina, cuartel, establo, muelle, capilla de cruce (templo de Vesta reducido), muralla de piedra con torres y puertas,
   árboles, texturas del suelo y del agua, ciudadanos y tropas.
   INVENTADO por código: relieve y río (js/gfx/mundo.js), máscaras del suelo (calles, plaza, campos), mapa de calor, luz, chozas y tiendas de nivel I,
   andamios, empalizada, surco y arado, mojones de las puertas, puente y cañas. Los tintes (toba, encalado, teja vieja) retiñen piezas reales.
   Una sola vista a la vez: el estado vive en este módulo (como en la maqueta). El humo, la gente y el atrezo grandes son de CN11 (people() es provisional).
   Sin SLOTS ni recinto rectangular ni medallas: los edificios están donde los puso la ciudad (E.edificios) y las casas en sus parcelas. */
import { THREE } from './models.js';
import { preloadStatic, getStatic, CULTURA } from './statics.js';
import * as UN from './units.js';
import * as vida from './vida.js';
import * as Civicas from './civicas.js';          // CN15d: dique, arca del foro y (con tinteC) tejado por barrio
import * as trajin from './trajin.js';              // CN15b: cuadrilla de obra y recuas (lo escribe otro encargo)
import * as Fachadas from './fachadas.js';           // CN15a: puestos, toldos y ropa de la plaza y los barrios (lo escribe otro encargo)
import { crearRio, crearCielo, texturaRuido, texturasMundo, loadGroundTextures, crearSuelo3, GLSL_NUBES, tintesEstacion } from './ground.js';
import { altura, RIO, NIVEL_RIO, azar, distRio } from './mundo.js';
import * as CI from '../ciudad.js';
const { PUENTE } = CI;
const D = window.DATA;

const ASSETS = 'assets/static/', HORIZ = '#cdc3b2';
let renderer = null, host = null;                  // el renderer y el contenedor los crea CityView3D
const scene = new THREE.Scene(); scene.background = new THREE.Color(HORIZ); scene.fog = new THREE.FogExp2(HORIZ, 0.00029);
const U = { uRuido: { value: null }, uTiempo: { value: 0 } };

/* ---------- carga (copiado de ciudad2) ---------- */
const esperas = [], texs = new Map();
function textura(file, datos) {
  if (texs.has(file)) return texs.get(file);
  const t = new THREE.Texture(); t.flipY = false; if (!datos) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; texs.set(file, t);
  esperas.push(new Promise(ok => { const im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; ok(); }; im.onerror = () => { console.warn('Falta la textura ' + file); ok(); }; im.src = ASSETS + file; }));
  return t;
}
const pieza = k => getStatic(k);

/* ---------- material de edificio (copiado de ciudad2, piel romana): Lambert + AO + tinte de muro y teja por ejemplar ---------- */
const PIEL = { equipo: '#6d4a38', desat: 0.28, tejaSat: 0.56, base: 0.62 };
const mats = new Map();
function material(p, o = {}) {
  const id = [p.file, p.mode, p.maps.ao || '', o.arbol ? 'a' : '', o.sinTeja ? 's' : '', p.alfa || ''].join('|'); if (mats.has(id)) return mats.get(id);
  const m = new THREE.MeshLambertMaterial({ map: p.tex || textura(p.file), side: p.lado !== undefined ? p.lado : THREE.DoubleSide, alphaTest: p.mode === 2 ? (p.alfa || 0.45) : 0 });
  if (p.maps.ao) { m.aoMap = textura(p.maps.ao, true); m.aoMap.channel = 1; m.aoMapIntensity = 1.0; }
  const equipo = new THREE.Color(PIEL.equipo);
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uEquipo: { value: equipo }, uRuido: U.uRuido, uTiempo: U.uTiempo });
    sh.vertexShader = 'attribute vec3 aMuro; attribute vec4 aTeja; varying vec3 vMuro; varying vec4 vTeja; varying float vAlt, vUp; varying vec3 vWP;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vMuro = aMuro; vTeja = aTeja; vAlt = position.y; vUp = abs(normalize(mat3(instanceMatrix) * normal).y);')
      .replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform vec3 uEquipo; varying vec3 vMuro; varying vec4 vTeja; varying float vAlt, vUp; varying vec3 vWP;\n${GLSL_NUBES}\n` + sh.fragmentShader.replace('#include <map_fragment>', `
      vec4 tx = texture2D(map, vMapUv);
      ${p.mode === 1 ? 'tx.rgb = mix(uEquipo, tx.rgb, tx.a);' : p.mode === 2 ? 'diffuseColor.a *= tx.a;' : ''}
      float lum = dot(tx.rgb, vec3(0.3, 0.59, 0.11));
      ${o.arbol ? 'vec3 c = mix(vec3(lum), tx.rgb, 0.62) * vMuro;' : `
      float rojo = smoothstep(0.05, 0.16, tx.r - tx.g * 1.12);
      float teja = ${o.sinTeja ? '0.0' : 'rojo * smoothstep(0.12, 0.3, vUp)'};
      vec3 muro = mix(tx.rgb, vec3(lum), ${PIEL.desat.toFixed(2)});
      muro = mix(muro, vec3(0.30 + 0.62 * pow(lum, 0.7)), vTeja.a * (1.0 - rojo)) * vMuro;
      vec3 tj = mix(vec3(lum), tx.rgb, ${PIEL.tejaSat.toFixed(2)}) * vTeja.rgb;
      vec3 c = mix(muro, tj, teja);
      c *= mix(${PIEL.base.toFixed(2)}, 1.0, max(teja, smoothstep(-0.5, 5.5, vAlt + (lum - 0.5) * 2.0)));`}
      diffuseColor.rgb *= c * nubes(vWP);`)
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n #ifdef USE_AOMAP\n reflectedLight.directDiffuse *= mix(1.0, ambientOcclusion, 0.55);\n #endif');
  };
  m.customProgramCacheKey = () => 'q1k|' + id;
  if (p.mode === 2) { m.userData.prof = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: m.map, alphaTest: 0.45, side: THREE.DoubleSide }); }
  mats.set(id, m); return m;
}
/* versión ligera de una pieza (copiado de ciudad2): quita los trozos sueltos pequeños y, si se pide, los triángulos diminutos */
const ligeras = new Map();
function ligera(clave, diagMin, areaFrac = 0) {
  const id = clave + '|' + diagMin + '|' + areaFrac; if (ligeras.has(id)) return ligeras.get(id);
  const st = pieza(clave), par = [], idv = new Map(), tri = [], f = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  st.parts.forEach((p, pi) => { const A = p.geo.attributes.position.array; for (let i = 0; i + 8 < A.length; i += 9) { const v = [0, 3, 6].map(k => { const key = Math.round(A[i + k] * 50) + ',' + Math.round(A[i + k + 1] * 50) + ',' + Math.round(A[i + k + 2] * 50); let n = idv.get(key); if (n === undefined) { n = par.length; par.push(n); idv.set(key, n); } return n; }); par[f(v[1])] = f(v[0]); par[f(v[2])] = f(v[0]);
    const ax = A[i + 3] - A[i], ay = A[i + 4] - A[i + 1], az = A[i + 5] - A[i + 2], bx = A[i + 6] - A[i], by = A[i + 7] - A[i + 1], bz = A[i + 8] - A[i + 2]; tri.push({ pi, i: i / 3, v: v[0], area: Math.hypot(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx) }); } });
  const caja = new Map(); for (const t of tri) { const c = f(t.v), A = st.parts[t.pi].geo.attributes.position.array; let b = caja.get(c); if (!b) caja.set(c, b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]); for (let k = t.i * 3; k < t.i * 3 + 9; k += 3) for (let d = 0; d < 3; d++) { b[d] = Math.min(b[d], A[k + d]); b[d + 3] = Math.max(b[d + 3], A[k + d]); } }
  let vivos = tri.filter(t => { const b = caja.get(f(t.v)); return Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]) >= diagMin; });
  if (areaFrac) { const tot = vivos.reduce((s, t) => s + t.area, 0), ord = vivos.slice().sort((a, b) => a.area - b.area), fuera = new Set(); let s = 0; for (const t of ord) { s += t.area; if (s > tot * areaFrac) break; fuera.add(t); } vivos = vivos.filter(t => !fuera.has(t)); }
  const parts = st.parts.map((p, pi) => { const keep = vivos.filter(t => t.pi === pi); if (!keep.length) return null; const geo = new THREE.BufferGeometry(); for (const nombre in p.geo.attributes) { const a = p.geo.attributes[nombre], is = a.itemSize, arr = new a.array.constructor(keep.length * 3 * is); keep.forEach((t, k) => arr.set(a.array.subarray(t.i * is, (t.i + 3) * is), k * 3 * is)); geo.setAttribute(nombre, new THREE.BufferAttribute(arr, is, a.normalized)); } return { ...p, geo }; }).filter(Boolean);
  const r = { key: clave, parts, bb: st.bb }; ligeras.set(id, r); return r;
}
/* cartel de un árbol (copiado de ciudad2): su perfil horneado en una textura pequeña, sobre dos planos cruzados */
const hornos = [];
function cartel(clave) {
  const st = pieza(clave), b = st.bb, w = Math.max(b[3] - b[0], b[5] - b[2]), cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2, h = b[4] - b[1], AN = 128, AL = Math.min(512, Math.max(64, Math.round(AN * h / w / 16) * 16));
  const rt = new THREE.WebGLRenderTarget(AN, AL, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  hornos.push(() => { const esc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 300); cam.position.set(cx, (b[1] + b[4]) / 2, cz + 100); cam.lookAt(cx, (b[1] + b[4]) / 2, cz);
    for (const p of st.parts) esc.add(new THREE.Mesh(p.geo, new THREE.MeshBasicMaterial({ map: textura(p.file), alphaTest: p.mode === 2 ? 0.45 : 0, side: THREE.DoubleSide })));
    const ca = new THREE.Color(), al = renderer.getClearAlpha(); renderer.getClearColor(ca); renderer.setRenderTarget(rt); renderer.setClearColor('#1c2410', 0); renderer.clear(); renderer.render(esc, cam);
    const px = new Uint8Array(AN * AL * 4), med = [0, 0, 0]; let np = 0; renderer.readRenderTargetPixels(rt, 0, 0, AN, AL, px); for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 128) { med[0] += px[i]; med[1] += px[i + 1]; med[2] += px[i + 2]; np++; }
    if (np) { renderer.setClearColor(new THREE.Color(med[0] / np / 255, med[1] / np / 255, med[2] / np / 255), 0); renderer.clear(); renderer.render(esc, cam); }
    renderer.setRenderTarget(null); renderer.setClearColor(ca, al); });
  const geo = new THREE.BufferGeometry(), P = [], UV = [], N = [];
  for (const [dx, dz] of [[1, 0], [0, 1]]) for (const [u, v] of [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1], [1, 0], [-1, 0], [1, 1], [1, 1], [-1, 0], [-1, 1]]) { P.push(cx + dx * u * w / 2, b[1] + v * h, cz + dz * u * w / 2); UV.push(u * 0.5 + 0.5, v); N.push(0, 1, 0); }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  return { key: clave, parts: [{ geo, tex: rt.texture, file: 'cartel_' + clave, mode: 2, maps: {}, alfa: 0.3, lado: THREE.FrontSide }], bb: st.bb };
}
/* lote (adaptado de ciudad2): cupo fijo de ejemplares de una pieza; poner() cambia el contenido; repartir() deja en cada nivel de
   detalle solo los que se ven con la cámara del momento */
const lotes = [];
class Lote {
  constructor(clave, niveles, cupo, o) {
    const b = niveles[0].bb; this.rb = 0.5 * Math.hypot(b[3] - b[0], b[4] - b[1], b[5] - b[2]); this.cy = (b[1] + b[4]) / 2; this.clave = clave; this.cortes = o.cortes || []; this.cupo = cupo; this.n = 0;
    this.M = new Float32Array(cupo * 16); this.aM = new Float32Array(cupo * 3); this.aT = new Float32Array(cupo * 4); this.E = new Float32Array(cupo * 4);
    this.niv = niveles.map(st => { const iM = new THREE.InstancedBufferAttribute(new Float32Array(cupo * 16), 16), iA = new THREE.InstancedBufferAttribute(new Float32Array(cupo * 3), 3), iT = new THREE.InstancedBufferAttribute(new Float32Array(cupo * 4), 4); for (const a of [iM, iA, iT]) a.setUsage(THREE.DynamicDrawUsage);
      const mallas = st.parts.map(p => { const geo = p.geo.clone(); geo.setAttribute('aMuro', iA); geo.setAttribute('aTeja', iT); const mat = material(p, o), im = new THREE.InstancedMesh(geo, mat, cupo); im.count = 0; im.instanceMatrix = iM; im.frustumCulled = false; im.castShadow = o.sombra !== false && !p.tex; im.receiveShadow = true; if (mat.userData.prof) im.customDepthMaterial = mat.userData.prof; (o.escena || scene).add(im); return im; });
      return { iM, iA, iT, mallas, n: 0 }; });
    if (!o.escena) lotes.push(this);
  }
  poner(lista) { const n = this.n = Math.min(lista.length, this.cupo); for (let i = 0; i < n; i++) { const e = lista[i]; e.m.toArray(this.M, i * 16); this.aM.set(e.muro || [1, 1, 1], i * 3); this.aT.set(e.teja || [1, 1, 1, 0], i * 4); const s = e.m.getMaxScaleOnAxis(), el = e.m.elements; this.E.set([el[12], el[13] + this.cy * s, el[14], this.rb * s], i * 4); } }
  repartir(fr, cam, kf, todo) {
    const E = this.E, P = fr.planes, nv = this.niv, c0 = this.cortes[0] || 0, c1 = this.cortes[1] || 0, ult = nv.length - 1, M = this.M, aM = this.aM, aT = this.aT; for (const v of nv) v.n = 0;
    for (let i = 0; i < this.n; i++) { const x = E[i * 4], y = E[i * 4 + 1], z = E[i * 4 + 2], r = E[i * 4 + 3]; let k = 0;
      if (todo) { if (Math.abs(x) > 640 || Math.abs(z + 70) > 640) continue; if (this.cortes.length > 1) k = 1; /* pase de sombra: solo lo que cae en el mapa, y casas y muralla en su versión ligera */ } else { let fuera = false; for (let j = 0; j < 6; j++) { const pl = P[j]; if (pl.normal.x * x + pl.normal.y * y + pl.normal.z * z + pl.constant < -r) { fuera = true; break; } } if (fuera) continue;
        const s = r * kf / Math.max(1, Math.hypot(x - cam.x, y - cam.y, z - cam.z)); k = s >= c0 ? 0 : s >= c1 ? Math.min(1, ult) : ult; }
      const v = nv[k], j = v.n++, dM = v.iM.array, dA = v.iA.array, dT = v.iT.array; for (let q = 0; q < 16; q++) dM[j * 16 + q] = M[i * 16 + q]; for (let q = 0; q < 3; q++) dA[j * 3 + q] = aM[i * 3 + q]; for (let q = 0; q < 4; q++) dT[j * 4 + q] = aT[i * 4 + q]; }
    for (const v of nv) { for (const m of v.mallas) m.count = v.n; if (v.n) for (const a of [v.iM, v.iA, v.iT]) { a.clearUpdateRanges(); a.addUpdateRange(0, v.n * a.itemSize); a.needsUpdate = true; } }
  }
}
const tris1 = k => { const st = pieza(k); return st ? st.parts.reduce((s, p) => s + p.geo.attributes.position.count / 3, 0) : 0; };
function lote(clave, cupo, o = {}) { const st = pieza(clave); if (!st) { console.warn('Falta la pieza ' + clave); return { poner() {}, n: 0 }; }
  const niveles = [st, ...(o.ligeras || []).map(a => ligera(clave, a[0], a[1]))]; if (o.cartel) niveles.push(cartel(clave)); return new Lote(clave, niveles, cupo, o); }
const _q = new THREE.Quaternion(), _e = new THREE.Euler();
const matriz = (x, y, z, giro, sx, sy, sz) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(0, giro, 0)), new THREE.Vector3(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz));
const suelo = (x, z, r = 6) => Math.min(altura(x, z), altura(x + r, z), altura(x - r, z), altura(x, z + r), altura(x, z - r));
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function tinte(a, b) {                                   // muro y teja de cada casa (el romano de ciudad2). a: 0 toba … 1 encalado
  const v = 0.9 + 0.2 * ((a * 7.13) % 1), muro = a < 0.45 ? lerp3([0.80, 0.70, 0.58], [0.92, 0.80, 0.64], a / 0.45) : a < 0.75 ? [0.96, 0.84, 0.62] : [0.98, 0.95, 0.88], cal = a < 0.45 ? 0.1 : a < 0.75 ? 0.35 : 0.8;
  const teja = b < 0.4 ? [1.12, 0.98, 0.9] : b < 0.78 ? [0.98, 0.9, 0.84] : [0.76, 0.7, 0.66]; return { muro: muro.map(x => x * v), teja: [...teja, cal] };
}

/* cultura de la ciudad: E.cultura 'roma'|'grie'|'cart' (si falta, 'roma' y todo queda como siempre); E.tinte = cultura de origen en ciudades romanas */
const CASAS_C = { roma: ['casa', 'casa_b', 'casa_c', 'casa_d'], grie: ['grie_casa', 'grie_casa_b', 'grie_casa_c', 'grie_casa_d', 'grie_casa_e'], cart: ['cart_casa', 'cart_casa_b', 'cart_casa_c'] };
const ESC_C = { roma: 1, grie: 1.06, cart: 1.17 };            // las casas griegas y púnicas de 0 A.D. son algo menores
const TEMPLO_C = { grie: ['grie_templo', 1.09], cart: ['cart_templo', 1.02] };
const TEMPLO_PZ = ['grie_templo', 'cart_templo'];
const TINTE_O = { galos: { m: [0.97, 1.03, 0.94], t: [0.96, 1.02, 0.95] }, iberos: { m: [1.04, 0.97, 0.86], t: [1.03, 0.96, 0.88] }, etruscos: { m: [1.03, 0.96, 0.92], t: [1.04, 0.95, 0.9] }, campanos: { m: [1.02, 1.0, 0.94], t: [1.0, 0.98, 0.94] }, mamertinos: { m: [1.0, 0.97, 0.93], t: [1.0, 0.97, 0.94] } };
let cul = 'roma', tinteO = null;
function tinteBase(a, b) {                               // muro y teja por cultura (grie y cart: la función tinte() de gobierno/maquetas/ciudad2)
  const v = 0.9 + 0.2 * ((a * 7.13) % 1), cx = familia() === CASAS_C.roma ? 'roma' : cul;
  if (cx === 'grie') { const muro = a < 0.7 ? lerp3([1.12, 1.06, 0.94], [1.04, 0.95, 0.80], a / 0.7) : [0.98, 0.84, 0.64], teja = b < 0.5 ? [1.12, 1.02, 0.92] : b < 0.85 ? [0.98, 0.94, 0.88] : [0.8, 0.76, 0.72]; return { muro: muro.map(x => x * v), teja: [...teja, a < 0.7 ? 0.85 : 0.4] }; }
  if (cx === 'cart') { const muro = a < 0.3 ? [0.98, 0.92, 0.80] : a < 0.8 ? lerp3([0.98, 0.84, 0.60], [0.88, 0.72, 0.52], (a - 0.3) / 0.5) : [0.82, 0.66, 0.50]; return { muro: muro.map(x => x * v), teja: [0.9, 0.86, 0.8, a < 0.3 ? 0.7 : 0.25] }; }
  const r = tinte(a, b); if (!tinteO) return r; return { muro: r.muro.map((x, i) => x * tinteO.m[i]), teja: [r.teja[0] * tinteO.t[0], r.teja[1] * tinteO.t[1], r.teja[2] * tinteO.t[2], r.teja[3]] };
}
/* CN15a: tono por barrio. nb = nivel del barrio (1..4), arr = parcela de arrabal. Solo cambia el color (cero triángulos); sin nb o con el interruptor apagado, igual que antes.
   Rico: más encalado y teja roja. Pobre y arrabal: más toba y teja vieja. Se aplica sobre el tinte de cultura, sin romperlo. */
const MURO_RICO = [0.98, 0.95, 0.88], TEJA_RICA = [1.12, 0.92, 0.84], MURO_POBRE = [0.84, 0.76, 0.62], TEJA_VIEJA = [0.8, 0.76, 0.72];
/* CN15d: barrio con tejas (E.barrios[i].tejas): el tejado se pasa a teja roja y nueva. Sin ese dato no cambia nada. */
const TEJA_NUEVA = [1.2, 0.74, 0.58, 0.95];
function tinteC(a, b, nb, arr, tej) { const r = tinteC0(a, b, nb, arr); return tej && Civicas.CIVICAS_TEJADO ? { muro: r.muro, teja: r.teja.map((x, i) => x + (TEJA_NUEVA[i] - x) * 0.85) } : r; }
function tinteC0(a, b, nb, arr) {
  const r = tinteBase(a, b); if (!Fachadas.FACHADAS_BARRIO || (nb === undefined && !arr)) return r;
  const k = arr ? -0.22 : nb >= 3 ? (nb - 2) * 0.14 : nb <= 1 ? -0.14 : 0; if (!k) return r;
  const mc = k > 0 ? MURO_RICO : MURO_POBRE, tc = k > 0 ? TEJA_RICA : TEJA_VIEJA, w = Math.abs(k);
  return { muro: r.muro.map((x, i) => x + (mc[i] - x) * w), teja: [r.teja[0] + (tc[0] - r.teja[0]) * w, r.teja[1] + (tc[1] - r.teja[1]) * w, r.teja[2] + (tc[2] - r.teja[2]) * w, Math.max(0, Math.min(1, r.teja[3] + k * 0.5))] };
}
/* familia de casas de la cultura; si falta alguna pieza, vuelve a las romanas */
const familia = () => { const f = CASAS_C[cul].filter(k => pieza(k)); return f.length === CASAS_C[cul].length ? f : CASAS_C.roma; };

/* ---------- bultos por código: cajas y conos de un color, en una malla (copiado de ciudad2) ---------- */
class Bulto { constructor() { this.p = []; this.n = []; this.c = []; }
  add(geo, col, m) { const g = geo.index ? geo.toNonIndexed() : geo; if (m) g.applyMatrix4(m); const P = g.attributes.position, N = g.attributes.normal, c = new THREE.Color(col); for (let i = 0; i < P.count; i++) { this.p.push(P.getX(i), P.getY(i), P.getZ(i)); this.n.push(N.getX(i), N.getY(i), N.getZ(i)); this.c.push(c.r, c.g, c.b); } }
  caja(w, h, d, x, y, z, col, giro = 0, rx = 0, rz = 0) { this.add(new THREE.BoxGeometry(w, h, d), col, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(rx, giro, rz, 'YXZ')), new THREE.Vector3(1, 1, 1))); }
  cono(r, h, seg, x, y, z, col, sy = 1, giro = 0, sx = 1, sz = 1) { this.add(new THREE.ConeGeometry(r, h, seg), col, new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(0, giro, 0)), new THREE.Vector3(sx, sy, sz))); }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); return g; } }
const matBulto = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });

/* ---------- cámara: gira alrededor de un punto del suelo (de la maqueta; el tamaño es el del contenedor, no el de la ventana) ---------- */
export const cam = { tx: 0, tz: -20, d: 640, az: 0, el: 0 };
const camara = new THREE.PerspectiveCamera(38, 1, 2, 20000);
const vista = { w: 1, h: 1 };                      // tamaño del lienzo
let desvio = 0;                                    // desplazamiento vertical de la imagen (para dejar sitio a la ficha)
export function ponerCamara() {
  cam.d = Math.max(30, Math.min(1050, cam.d)); cam.tx = Math.max(-430, Math.min(430, cam.tx)); cam.tz = Math.max(-440, Math.min(400, cam.tz));
  const k = Math.min(1, Math.max(0, (cam.d - 120) / 700)); cam.el = cam.elF || (21 + 13 * k * (2 - k)) * Math.PI / 180;
  const ty = altura(cam.tx, cam.tz); camara.position.set(cam.tx + Math.sin(cam.az) * Math.cos(cam.el) * cam.d, ty + Math.sin(cam.el) * cam.d, cam.tz + Math.cos(cam.az) * Math.cos(cam.el) * cam.d);
  camara.position.y = Math.max(camara.position.y, altura(camara.position.x, camara.position.z) + 2);
  camara.lookAt(cam.tx, ty, cam.tz);
  camara.aspect = vista.w / vista.h; camara.fov = vista.w < vista.h ? 50 : 38;
  if (desvio) camara.setViewOffset(vista.w, vista.h, 0, desvio, vista.w, vista.h); else camara.clearViewOffset();
  camara.updateProjectionMatrix(); camara.updateMatrixWorld();
}
const _ray = new THREE.Raycaster(), _v2 = new THREE.Vector2(), _v3 = new THREE.Vector3();
/* punto del suelo bajo un punto de la pantalla (px, py en coordenadas de la ventana, como clientX/clientY); marcha por el rayo hasta cruzar el relieve */
export function sueloEn(px, py) { const r = host.getBoundingClientRect(); _v2.set((px - r.left) / vista.w * 2 - 1, -((py - r.top) / vista.h) * 2 + 1); _ray.setFromCamera(_v2, camara); const o = _ray.ray.origin, d = _ray.ray.direction; if (d.y > -0.02) return null;
  let t0 = 0, t1 = 0; for (let t = 5; t < 6000; t += 8) { const y = o.y + d.y * t; if (y < altura(o.x + d.x * t, o.z + d.z * t)) { t1 = t; t0 = t - 8; break; } if (y < -20) return null; } if (!t1) return null;
  for (let i = 0; i < 8; i++) { const t = (t0 + t1) / 2; if (o.y + d.y * t < altura(o.x + d.x * t, o.z + d.z * t)) t1 = t; else t0 = t; } return [o.x + d.x * t1, o.z + d.z * t1]; }
/* un punto del suelo en la pantalla (coordenadas de la ventana) */
export function aPantalla(x, z, dy = 0) { const r = host.getBoundingClientRect(); _v3.set(x, altura(x, z) + dy, z).project(camara); return { x: r.left + (_v3.x + 1) / 2 * vista.w, y: r.top + (1 - _v3.y) / 2 * vista.h, ok: _v3.z < 1 && Math.abs(_v3.x) < 1.1 && Math.abs(_v3.y) < 1.1 }; }

/* ---------- luz: el sol bajo de ciudad2, con un solo mapa de sombras para todo el terreno jugable ---------- */
const SOL = new THREE.Vector3(-0.84, 0.49, 0.26).normalize();
/* Q11: luz por estación. Cuatro anclas (primavera, verano, otoño, invierno) que se mezclan sin saltos según Game.state.t; el verano es el aspecto de siempre.
   La dirección del sol (y con ella las sombras) cambia solo al cambiar de estación; la tarde dorada solo tiñe y baja intensidad. */
export const LUZ_ESTACIONAL = true;
const ANCLAS = [
  { dir: [-0.82, 0.45, 0.30], sol: '#ffe6b8', si: 3.2, hc: '#b2cade', hg: '#80904c', hi: 1.5, h: '#c3cdb0', fog: 0.00029 },     // primavera: verde y limpia
  { dir: [-0.84, 0.52, 0.26], sol: '#ffdfb4', si: 3.3, hc: '#b6c6de', hg: '#927252', hi: 1.45, h: '#cdc3b2', fog: 0.00029 },     // verano: dorado (como siempre)
  { dir: [-0.86, 0.36, 0.22], sol: '#ffbe80', si: 3.0, hc: '#c4b4b4', hg: '#8a5a38', hi: 1.3, h: '#cba98c', fog: 0.00034 },      // otoño: ocre
  { dir: [-0.90, 0.24, 0.20], sol: '#d4e0f6', si: 2.5, hc: '#a4b6d6', hg: '#6a6866', hi: 1.4, h: '#b4bec8', fog: 0.00042 }];     // invierno: frío, sol bajo
for (const a of ANCLAS) { a.dir = new THREE.Vector3(...a.dir).normalize(); for (const k of ['sol', 'hc', 'hg', 'h']) a[k] = new THREE.Color(a[k]); }
const ORO = { sol: new THREE.Color('#ff8f3c'), h: new THREE.Color('#e2a574'), hc: new THREE.Color('#d8a888') };
const _c1 = new THREE.Color(), _sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
let estSol = -1, luzT = NaN, cieloU = null, noche = 0, estK = 1, estF = 0;
/* CN15a: estación actual para quien la necesite. k = ancla de la que se parte (0 primavera, 1 verano, 2 otoño, 3 invierno; el índice A de luz()), f = mezcla suave hacia la siguiente (0..1), ks = estación del calendario */
export function estacionActual() { return { k: estK, f: estF, ks: estSol < 0 ? estK : estSol }; }
function luz() {
  const Gm = window.Game, t = Gm && Gm.state && typeof Gm.state.t === 'number' ? Gm.state.t : 7.5; if (t === luzT) return; luzT = t;
  const u = t / 3, a = u - 0.5, i0 = Math.floor(a), f = _sm(a - i0), A = ANCLAS[((i0 + 3) % 4 + 4) % 4], B = ANCLAS[((i0 + 4) % 4 + 4) % 4], ks = ((Math.floor(u) + 3) % 4 + 4) % 4; estK = ((i0 + 3) % 4 + 4) % 4; estF = f;
  const fm = t - Math.floor(t), oro = Math.min(1, _sm((fm - 0.7) / 0.25) + 1 - _sm(fm / 0.12));          // tarde dorada: sube al final del mes y baja al empezar el siguiente
  noche = Math.min(1, _sm((fm - 0.85) / 0.12) + 1 - _sm(fm / 0.08));
  if (ks !== estSol) { estSol = ks; SOL.copy(ANCLAS[ks].dir); sol.position.set(0, 0, -70).addScaledVector(SOL, 1500); if (cieloU) cieloU.uSol.value.copy(SOL); sombraPend = true; }
  sol.color.copy(A.sol).lerp(B.sol, f).lerp(ORO.sol, oro * 0.75); sol.intensity = (A.si + (B.si - A.si) * f) * (1 - 0.3 * oro);
  hemi.color.copy(A.hc).lerp(B.hc, f).lerp(ORO.hc, oro * 0.45); hemi.groundColor.copy(A.hg).lerp(B.hg, f); hemi.intensity = (A.hi + (B.hi - A.hi) * f) * (1 - 0.18 * oro);
  _c1.copy(A.h).lerp(B.h, f).lerp(ORO.h, oro * 0.5); scene.background.copy(_c1); scene.fog.color.copy(_c1); scene.fog.density = A.fog + (B.fog - A.fog) * f;
  if (cieloU) for (const c of cieloU.uH) c.copy(_c1);
}
const sol = new THREE.DirectionalLight('#ffdfb4', 3.3), hemi = new THREE.HemisphereLight('#b6c6de', '#927252', 1.45);
function ponerLuz() { const RS = 600; sol.position.set(0, 0, -70).addScaledVector(SOL, 1500); sol.target.position.set(0, 0, -70); sol.castShadow = true; const s = sol.shadow; s.mapSize.set(2048, 2048); s.camera.left = -RS; s.camera.right = RS; s.camera.top = RS; s.camera.bottom = -RS; s.camera.near = 500; s.camera.far = 2600; s.bias = -0.0006; s.normalBias = 0.5; s.radius = 2.2; s.camera.updateProjectionMatrix(); scene.add(sol, sol.target, hemi); }

/* ---------- piezas del juego ---------- */
/* tipo -> [pieza, escala, giro de fachada, hundido] */
const PZ = { foro: ['foro', 0.78, 0, 0.2], fuente: ['prop_pozo', 2.2, 0, 0.1], granero: ['almacen', 1.35, 0, 0.3], almacen: ['almacen', 1.1, 0, 0.3], granja: ['granja', 1.0, 0, 0.3], aserradero: ['aserradero', 1.25, 0, 0.2], taller: ['aserradero', 1.25, 0, 0.2],
  cantera: ['cantera', 0.8, 0, 0.3], mina: ['mina', 1.0, 0, 0.3], templo: ['templo', 0.86, 0, 1.2], mercado: ['mercado', 0.82, 0, 0.2], herreria: ['aserradero', 0.95, 0, 0.2], escuela: ['mercado', 0.7, 0, 0.2], cuartel: ['cuartel', 1.1, 0, 0.3], establo: ['establo', 1.1, 0, 0.3],
  muelle: ['puerto', 0.85, 0, 0], compitum: ['vesta', 0.5, 0, 0.6] };       // herrería usa el taller reducido (aún no hay pieza propia); la fuente espera a prop_pozo
const PIEL_U = { muro: [0.93, 0.86, 0.76], teja: [0.86, 0.8, 0.76, 0.15] };
const L = {}, G = {};                 // lotes y mallas sueltas
let pinM, sueloJ, rio, crecida, dinM, andM, andL, estM, anilloM, surcoM, gromaM, aradoM, chozaM, tiendaM;
let estQ = 0, estClave = -1;       // CN15a: paso discreto de la mezcla de estación (0..8) y clave k*9+paso para repintar solo al cambiar
const ANDAMIO_NUEVO = true;       // CN15b-B: andamio con lona, cuerdas y escalera; obra en pausa apagada; sin árboles dentro de la obra activa. false = como antes
let firmaArb = '';
let E = null, revVista = -1, fantasma = null, sombraPend = true, animHasta = 0, surcoT0 = -1, esperaSurco = 0, nTalados = -1;
const tNace = new Map(), firma = new Map();
const ahora = () => performance.now() / 1000;

export async function montar() {
  const claves = ['casa', 'almacen', 'aserradero', 'mercado', 'foro', 'vesta', 'templo', 'granja', 'puerto', 'cantera', 'mina', 'cuartel', 'establo', 'muro', 'torre', 'puerta', 'cipres', 'olivo', 'pino', 'algarrobo', 'casa_b', 'casa_c', 'casa_d', 'prop_paja', 'prop_pozo', 'prop_carreta', 'prop_mesa', 'prop_cesto', 'prop_sacos', 'prop_vaso', 'prop_caja', 'prop_cajas', 'prop_paja_grande', 'prop_puesto_cart', ...CASAS_C.grie, ...CASAS_C.cart, 'grie_templo', 'cart_templo'];
  await Promise.all([preloadStatic(claves), loadGroundTextures(), UN.preload(['ciudadana', 'sacerdote'])]);
  const T = texturasMundo();
  U.uRuido.value = texturaRuido(); ponerCamara(); ponerLuz(); { const cl = crearCielo(SOL, HORIZ, U); cieloU = cl.userData.luz; scene.add(cl); }
  G.T = T;
  /* casas: cuatro piezas reales, con versiones ligeras de lejos */
  for (const k of ['casa', 'casa_b', 'casa_c', 'casa_d']) L[k] = lote(k, 220, { ligeras: [[3, 0], [6, 0]], cortes: [0.09, 0.05] });
  for (const k of [...CASAS_C.grie, ...CASAS_C.cart]) if (pieza(k)) L[k] = lote(k, k === 'cart_casa' ? 440 : 220, { ligeras: [[3, 0], [6, 0]], cortes: [0.09, 0.05] });
  for (const k of ['grie_templo', 'cart_templo']) if (pieza(k)) L[k] = lote(k, 4, tris1(k) > 4000 ? { ligeras: [[0, 0.012]], cortes: [0.12] } : {});
  for (const t in PZ) { const k = PZ[t][0]; if (!L[k]) L[k] = lote(k, t === 'fuente' ? 24 : 12, tris1(k) > 4000 ? { ligeras: [[0, 0.012]], cortes: [0.12], sinTeja: t === 'fuente' } : { sinTeja: t === 'fuente' }); }
  L.muro = lote('muro', 48, { sinTeja: true, ligeras: [[3, 0], [4, 0]], cortes: [0.11, 0.06] }); L.torre = lote('torre', 40, { sinTeja: true, ligeras: [[3, 0], [4, 0]], cortes: [0.11, 0.06] }); L.puerta = lote('puerta', 10, { sinTeja: true, ligeras: [[3, 0], [4, 0]], cortes: [0.11, 0.06] });
  L.arbol = {}; for (const k of ['cipres', 'olivo', 'pino', 'algarrobo']) L.arbol[k] = lote(k, 3200, { arbol: true, cartel: true, cortes: [0.05] });
  /* chozas y tiendas de nivel I (por código) */
  { /* choza: cabaña oval de adobe con techo de paja (texturas reales de 0 A.D.: paja y tierra); tienda: lona por código */
    const une = (gs) => { const g = new THREE.BufferGeometry(); for (const n of ['position', 'normal', 'uv', 'color']) { const is = n === 'uv' ? 2 : 3, a = new Float32Array(gs.reduce((t, x) => t + x.attributes[n].count * is, 0)); let o = 0; for (const x of gs) { a.set(x.attributes[n].array, o); o += x.attributes[n].count * is; } g.setAttribute(n, new THREE.BufferAttribute(a, is)); } return g; };
    const col = (g, v, ku = 1, kv = 1) => { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, c = new Float32Array(n * 3).fill(v); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); const uv = g.attributes.uv; for (let i = 0; i < n; i++) uv.setXY(i, uv.getX(i) * ku, uv.getY(i) * kv); return g; };
    const muro = une([col(new THREE.CylinderGeometry(3.5, 3.75, 4.6, 12, 1, true).translate(0, 1.1, 0).scale(1.25, 1, 1), 1, 3, 1), col(new THREE.BoxGeometry(1.5, 2.7, 0.5).translate(0.4, 1.35, 3.62), 0.22)]);
    const techo = col(new THREE.ConeGeometry(5.2, 4.9, 12, 1, true).translate(0, 5.45, 0).scale(1.25, 1, 1), 1, 5, 2.2);
    const mMuro = new THREE.MeshLambertMaterial({ map: textura('terr_dirt.webp'), color: '#e2c8a0', vertexColors: true, side: THREE.DoubleSide }), mTecho = new THREE.MeshLambertMaterial({ map: textura('props_celt_prop_1.webp'), color: '#c2aa76', vertexColors: true, side: THREE.DoubleSide });
    chozaM = [new THREE.InstancedMesh(muro, mMuro, 220), new THREE.InstancedMesh(techo, mTecho, 220)];
    const t = new Bulto(); t.cono(5.2, 4.6, 4, 0, 2.3, 0, '#d8ccb0', 1, Math.PI / 4, 1.15, 0.8); t.caja(0.25, 5.6, 0.25, 0, 2.8, 0, '#5a4632'); t.caja(1.6, 0.7, 1.2, 4.6, 0.35, 1.5, '#8a6a48');
    tiendaM = new THREE.InstancedMesh(t.geo(), matBulto, 40); for (const m of [...chozaM, tiendaM]) { m.count = 0; m.castShadow = m.receiveShadow = true; m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); } }
  L.paja = lote('prop_paja', 90, { sinTeja: true }); L.carreta = lote('prop_carreta', 8, { sinTeja: true });
  vida.iniciar({ scene, colorGuarn: D.FACTIONS.roma.col, U, HORIZ, altura, azar, carros: L.carreta, pedirReparto: () => { pedirReparto = true; } });
  trajin.iniciar({ scene, colorGuarn: D.FACTIONS.roma.col, U, HORIZ, altura, azar, pieza, lote, matriz, Bulto, matBulto, pedirReparto: () => { pedirReparto = true; } });
  Civicas.iniciar({ scene, altura, azar, pieza, lote, matriz, Bulto, matBulto, pedirReparto: () => { pedirReparto = true; } });
  Fachadas.iniciar({ scene, altura, azar, pieza, lote, matriz, Bulto, matBulto, pedirReparto: () => { pedirReparto = true; } });
}
/* el terreno de una partida: suelo, río, bosque, puente */
export function mundo(estado) {
  vida.reiniciar(); E = estado; cul = CASAS_C[estado.cultura] ? estado.cultura : 'roma'; tinteO = cul === 'roma' && estado.tinte ? TINTE_O[estado.tinte] || null : null; revVista = -1; tNace.clear(); firma.clear(); fantasma = null; surcoT0 = -1; esperaSurco = 0; nTalados = -1; estClave = -1; firmaArb = ''; Fachadas.reiniciar(); Civicas.reiniciar(); trajin.reiniciar();
  for (const m of [sueloJ && sueloJ.malla, rio, crecida, estM, dinM, andM, andL, surcoM, aradoM]) if (m) { scene.remove(m); if (m.geometry) m.geometry.dispose(); }
  dinM = andM = andL = surcoM = aradoM = null; if (antM) { scene.remove(antM); antM.geometry.dispose(); antM = null; } antFirma = ''; obrasF = []; firmaObras = '';
  sueloJ = crearSuelo3(G.T, U, E ? E.bosquetes : []); scene.add(sueloJ.malla); rio = crearRio(G.T, U); scene.add(rio);
  /* lámina de la crecida: una cinta más ancha que el río, escondida bajo el cauce hasta que toca */
  { const n = RIO.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = []; let sl = 0; for (let i = 0; i < n; i++) { const a = RIO[Math.max(0, i - 1)], b = RIO[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l, w = 124; if (i) sl += Math.hypot(RIO[i][0] - RIO[i - 1][0], RIO[i][1] - RIO[i - 1][1]); pos.set([RIO[i][0] + nx * w, 0, RIO[i][1] + nz * w, RIO[i][0] - nx * w, 0, RIO[i][1] - nz * w], i * 6); uv.set([0, sl / 60, 2.5, sl / 60], i * 4); if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const mc = rio.material.clone(); mc.color.set('#78847e'); mc.opacity = 0.92; mc.onBeforeCompile = rio.material.onBeforeCompile; crecida = new THREE.Mesh(g, mc); crecida.receiveShadow = true; crecida.visible = false; crecida.position.y = NIVEL_RIO; scene.add(crecida); }
  /* fijo: puente de madera y cañas (de ciudad2) */
  { const B = new Bulto(), rnd = azar(99), Rr = (a, b) => a + (b - a) * rnd(), P = PUENTE, c = Math.cos(P.ang), s = Math.sin(P.ang), Lp = 84, y = NIVEL_RIO + 4.2; B.caja(Lp, 0.5, 8.4, P.x, y, P.z, '#6e5a44', -P.ang);
    for (const l of [-4, 4]) B.caja(Lp, 0.22, 0.22, P.x - s * l, y + 1.5, P.z + c * l, '#5c4a38', -P.ang);
    for (let u = -Lp / 2 + 3; u <= Lp / 2 - 3; u += 7) for (const l of [-3.6, 3.6]) { const x = P.x + c * u - s * l, z = P.z + s * u + c * l; B.caja(0.5, 8.5, 0.5, x, y - 3.4, z, '#4e4032', -P.ang); B.caja(0.22, 1.6, 0.22, x - s * Math.sign(l) * 0.4, y + 0.8, z + c * Math.sign(l) * 0.4, '#5c4a38', -P.ang); }
    for (let i = 0; i < RIO.length - 1; i++) { const p = RIO[i], q = RIO[i + 1]; if (Math.abs(p[0]) > 900) continue; const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      for (const l of [1, -1]) for (let k = 0; k < 3; k++) { if (rnd() < 0.45) continue; const r = Rr(17, 27), x = p[0] - Math.sin(ang) * r * l + Rr(-5, 5), z = p[1] + Math.cos(ang) * r * l + Rr(-5, 5), yy = altura(x, z); if (yy > NIVEL_RIO + 2.5 || yy < NIVEL_RIO - 1.2) continue; for (let j = 0; j < 4; j++) B.cono(Rr(0.5, 0.9), Rr(3, 5), 4, x + Rr(-1.6, 1.6), Math.max(yy, NIVEL_RIO) + 1.8, z + Rr(-1.6, 1.6), rnd() < 0.5 ? '#7c8448' : '#9a9050', 1, Rr(0, 3)); } }
    estM = new THREE.Mesh(B.geo(), matBulto); estM.castShadow = estM.receiveShadow = true; scene.add(estM); }
  /* anillo de alcance y groma */
  if (!anilloM) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(97 * 6), 3)); const ix = []; for (let i = 0; i < 96; i++) ix.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); g.setIndex(ix);
    anilloM = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#fff4d0', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, fog: false })); anilloM.frustumCulled = false; anilloM.visible = false; anilloM.renderOrder = 3; scene.add(anilloM);
    const b = new Bulto(); b.caja(0.5, 13, 0.5, 0, 6.5, 0, '#6a4a2c'); b.caja(9, 0.45, 0.45, 0, 12.6, 0, '#8a6a3c'); b.caja(0.45, 0.45, 9, 0, 12.6, 0, '#8a6a3c'); for (const [u, v] of [[4.3, 0], [-4.3, 0], [0, 4.3], [0, -4.3]]) b.caja(0.12, 3.4, 0.12, u, 10.9, v, '#d8c890'); b.cono(1, 2, 6, 0, 14, 0, '#c9a13c');
    gromaM = new THREE.Mesh(b.geo(), matBulto); gromaM.visible = false; scene.add(gromaM);
    const pg = new THREE.ConeGeometry(2.6, 6, 4).rotateX(Math.PI).translate(0, 3, 0); pinM = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: '#ffffff', fog: false })); pinM.visible = false; pinM.renderOrder = 4; scene.add(pinM); }
  if (!E) vaciar();
  sombraPend = true; sincronizar(true);
}
/* ciudad sin estado (no es nuestra o no hay módulo): solo queda el terreno vacío */
function vaciar() { for (const l of lotes) l.poner([]); for (const m of [...chozaM, tiendaM]) { m.count = 0; m.instanceMatrix.needsUpdate = true; } nTalados = -1; if (surcoM) surcoM.visible = false; }

/* ---------- anillo en el suelo (alcance de un edificio, o tamaño de la ciudad al fundar) ---------- */
function anillo(x, z, r, color, ancho = 1.6) { if (!r) { anilloM.visible = false; return; } const P = anilloM.geometry.attributes.position;
  for (let i = 0; i <= 96; i++) { const t = i / 96 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), a = [x + c * (r - ancho), z + s * (r - ancho)], b = [x + c * (r + ancho), z + s * (r + ancho)]; P.setXYZ(i * 2, a[0], Math.max(altura(a[0], a[1]), NIVEL_RIO) + 0.9, a[1]); P.setXYZ(i * 2 + 1, b[0], Math.max(altura(b[0], b[1]), NIVEL_RIO) + 0.9, b[1]); }
  P.needsUpdate = true; anilloM.material.color.set(color); anilloM.visible = true; }
const COLOR = { verde: '#9be07a', ocre: '#f2c45a', rojo: '#f07a5a', nada: '#f07a5a' }, TINTE_F = { verde: [0.75, 1.35, 0.7], ocre: [1.4, 1.15, 0.6], rojo: [1.6, 0.55, 0.45], nada: [1.6, 0.55, 0.45] };
export function calor(notas) { sueloJ.calor(notas); }
export function ponerGroma(g) { if (!g) { gromaM.visible = false; if (!fantasma) anillo(0, 0, 0); return; } gromaM.visible = true; gromaM.position.set(g.x, altura(g.x, g.z), g.z); gromaM.scale.setScalar(Math.max(1, cam.d / 260)); anillo(g.x, g.z, 150, COLOR[g.color], 1.4); }
export function ponerFantasma(f) { fantasma = f; pinM.visible = !!f; if (f) { const d = PZ[f.id] || ['', 1], st = d[0] ? pieza(d[0]) : null; pinM.position.set(f.x, altura(f.x, f.z) + (st ? st.bb[4] * d[1] : 8) + 3, f.z); pinM.material.color.set(COLOR[f.color]); pinM.scale.setScalar(Math.max(1, cam.d / 330)); }
  if (!f) anillo(0, 0, 0); else anillo(f.x, f.z, f.radio || Math.max(CI.EDIF[f.id].w, CI.EDIF[f.id].d) * 0.75, COLOR[f.color], f.radio ? 1.6 : 0.9); edificios(); pedirReparto = true; }

/* ---------- lo que cambia: casas, edificios, muralla, obras, humo ---------- */
const _c = new THREE.Color();
const facil = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);
function casas(t) {
  const fam = familia(), por = {}; for (const k in L) if (k.startsWith('casa') || k.startsWith('grie_casa') || k.startsWith('cart_casa')) por[k] = []; const EC = fam === CASAS_C.roma ? 1 : ESC_C[cul]; let nc = 0, nt = 0, anim = false;
  for (const l of E.parcelas) { const c = l.casa; if (!c || l.fuera) continue;
    const fm = c.nivel + '|' + (c.ruina ? 1 : 0); if (firma.get(l.id) !== fm) { firma.set(l.id, fm); tNace.set(l.id, Math.max(t, esperaSurco) + (E.mesN === 0 ? 0.3 + (l.id % 20) * 0.09 : (l.id % 7) * 0.06)); }
    const u = (t - tNace.get(l.id)) / 0.9, f = facil(u); if (u < 1) anim = true; const giro = -l.ang + (l.lado > 0 ? Math.PI : 0), sy = 0.12 + 0.88 * f, sx = u < 0 ? 0.001 : 0.8 + 0.2 * f;
    if (c.ruina) { const k = fam[fam.length - 1 - l.id % 2]; por[k].push({ m: matriz(l.x, suelo(l.x, l.z, 5) - 0.3, l.z, giro, 0.8 * EC, 0.22 * EC, 0.8 * EC), muro: c.arde ? [0.2, 0.17, 0.15] : [0.3, 0.27, 0.23], teja: [0.2, 0.18, 0.17, 0] }); continue; }
    if (c.nivel === 1) { const tienda = c.desde === 0 && E.mesN < 8, i = tienda ? nt++ : nc++, e = tienda ? 0.82 + 0.3 * l.tono : 0.8 + 0.2 * l.tono; if (i < (tienda ? 40 : 220)) { const mm = matriz(l.x, suelo(l.x, l.z, 4) - 0.05, l.z, giro + (tienda ? l.tipo * 3 : Math.PI / 2 + (l.tipo - 0.5) * 0.5), e * sx, e * sy, e * sx), cc = _c.setScalar(0.8 + 0.34 * l.teja); for (const m of tienda ? [tiendaM] : chozaM) { m.setMatrixAt(i, mm); m.setColorAt(i, cc); } } continue; }
    let k; if (fam === CASAS_C.roma) k = c.nivel === 2 ? (l.tipo < 0.5 ? 'casa_c' : 'casa_d') : c.nivel === 3 ? ['casa_b', 'casa_c', 'casa_d'][Math.floor(l.tipo * 3) % 3] : (l.tipo < 0.55 ? 'casa' : 'casa_b');
    else { const n = fam.length, lo = Math.max(1, Math.round(n * 0.4)), a = c.nivel === 2 ? 0 : c.nivel === 3 ? Math.floor(n * 0.25) : n - Math.max(2, Math.round(n * 0.5)), b = c.nivel === 2 ? lo : c.nivel === 3 ? Math.min(n, a + Math.max(2, Math.round(n * 0.6))) : n; k = fam[a + Math.floor(l.tipo * (b - a)) % (b - a)]; }
    const e = c.nivel === 2 ? 0.64 : c.nivel === 3 ? 0.84 : 0.97, alto = c.nivel === 4 ? 1.3 : c.nivel === 3 ? 1 : 0.9, tn = c.nivel === 2 ? l.tono * 0.42 : c.nivel === 3 ? 0.3 + l.tono * 0.45 : 0.62 + l.tono * 0.38, tj = c.nivel === 2 ? 0.6 + l.teja * 0.4 : c.nivel === 4 ? l.teja * 0.6 : l.teja;
    por[k].push({ m: matriz(l.x, suelo(l.x, l.z, 6 * e) - 0.25, l.z, giro, e * EC * sx, e * EC * alto * sy, e * EC * sx), ...tinteC(tn, tj, E.barrios && E.barrios[l.barrio] ? E.barrios[l.barrio].nivel : undefined, l.arrabal, E.barrios && E.barrios[l.barrio] && E.barrios[l.barrio].tejas) }); }
  for (const k in por) L[k].poner(por[k]);
  tiendaM.count = nt; for (const m of [...chozaM, tiendaM]) { if (m !== tiendaM) m.count = nc; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  return anim;
}
function edificios() {
  const por = {}; for (const t in PZ) por[PZ[t][0]] = []; for (const k of TEMPLO_PZ) por[k] = [];
  const pon = (tipo, x, z, ang, sy, piel, dy = 0) => { let d = PZ[tipo]; if (!d) return; if (tipo === 'templo' && TEMPLO_C[cul] && L[TEMPLO_C[cul][0]]) d = [TEMPLO_C[cul][0], TEMPLO_C[cul][1], d[2], d[3]]; const y = tipo === 'muelle' ? NIVEL_RIO + 1.4 : suelo(x, z, tipo === 'fuente' || tipo === 'compitum' ? 2 : 7) - d[3]; por[d[0]].push({ m: matriz(x, y + dy, z, Math.PI / 2 - ang + d[2], d[1], d[1] * sy, d[1]), ...piel }); };
  if (E.foro && ahora() >= esperaSurco) { const f = E.foro; pon('foro', f.x - Math.cos(f.ang) * 8, f.z - Math.sin(f.ang) * 8, f.ang, 1, PIEL_U); }
  for (const e of E.edificios) { const pr = e.obra ? 1 - e.obra / (e.total + 0.6) : 1; pon(e.tipo, e.x, e.z, e.ang, e.ruina ? 0.55 : 0.3 + 0.7 * pr, e.ruina ? { muro: [0.3, 0.27, 0.24], teja: [0.22, 0.2, 0.19, 0] } : e.obra ? { muro: [0.86, 0.82, 0.76], teja: [0.8, 0.76, 0.72, 0.3] } : PIEL_U); }
  for (const o of obrasF) if (o.nuevo) pon(o.pieza, o.x, o.z, o.ang, 0.12 + 0.88 * o.av, { muro: [0.86, 0.82, 0.76], teja: [0.8, 0.76, 0.72, 0.3] });      // obra nueva: crece con el avance
  if (fantasma) pon(fantasma.id, fantasma.x, fantasma.z, fantasma.ang, 1, { muro: TINTE_F[fantasma.color], teja: [...TINTE_F[fantasma.color], 0.5] }, 0.4);
  for (const k in por) if (L[k]) L[k].poner(por[k]);
}
function arboles() { const n = E.arboles.reduce((s, a) => s + (a.talado ? 1 : 0), 0), fa = ANDAMIO_NUEVO ? obrasF.filter(o => !o.pausa).map(o => o.x + ',' + o.z).join('|') : ''; if (n === nTalados && fa === firmaArb) return; nTalados = n; firmaArb = fa; const act = ANDAMIO_NUEVO ? obrasF.filter(o => !o.pausa) : []; const arb = {}, te = LUZ_ESTACIONAL ? tintesEstacion(estK, estQ / 8).arbol : [1, 1, 1];      // te: tinte de la estación (multiplica el color de cada árbol)
  for (const a of E.arboles) { if (a.talado) continue; if (act.length && act.some(o => Math.hypot(a.x - o.x, a.z - o.z) < 3.5)) continue; const y = altura(a.x, a.z), v = 0.62 + 0.3 * a.tono, col = a.pieza === 'olivo' ? [v * 1.7, v * 1.7, v * 1.5] : a.pieza === 'cipres' ? [v * 1.5, v * 1.5, v * 1.2] : [v * 1.9, v * 1.75, v * 1.25]; (arb[a.pieza] = arb[a.pieza] || []).push({ m: matriz(a.x, y - 0.3, a.z, a.ang, a.esc, a.esc * (0.9 + 0.3 * a.tono), a.esc), muro: [col[0] * te[0], col[1] * te[1], col[2] * te[2]] }); }
  for (const k in L.arbol) L.arbol[k].poner(arb[k] || []); }
/* muralla: por el surco; primero empalizada (por código), luego tramos de piedra reales con torres; puertas donde cruzan las calles */
function muralla(B) {
  const m = E.muralla; L.muro.poner([]); L.torre.poner([]); L.puerta.poner([]); if (!E.surco) return;
  const S = (E.muralla.rec && E.muro) || E.surco, n = S.length, cerca = (x, z, r) => E.puertas.find(p => Math.hypot(p.x - x, p.z - z) < r);
  /* mojones en las puertas mientras no hay muralla de piedra */
  if (m.fase < 2) for (const p of E.puertas) for (const sg of [1, -1]) { const x = p.x + Math.cos(p.ang) * 7 * sg, z = p.z + Math.sin(p.ang) * 7 * sg, y = altura(x, z); if (m.fase === 1 || m.obra) { B.caja(1.1, 9, 1.1, x, y + 4.5, z, '#5c4630', -p.ang); if (sg > 0) B.caja(15.5, 1, 1, p.x, altura(p.x, p.z) + 8.6, p.z, '#5c4630', -p.ang); } else { B.caja(1.6, 3.4, 1.6, x, y + 1.7, z, '#b0a690', -p.ang); B.cono(1.2, 1.2, 4, x, y + 4, z, '#b0a690', 1, -p.ang + 0.785); } }
  if (!m.fase && !m.obra) return;
  const per = []; let largo = 0; for (let i = 0; i < n; i++) { const a = S[i], b = S[(i + 1) % n]; per.push(largo); largo += Math.hypot(b[0] - a[0], b[1] - a[1]); }
  const en = s => { s = ((s % largo) + largo) % largo; let i = 0; while (i < n - 1 && per[i + 1] <= s) i++; const a = S[i], b = S[(i + 1) % n], u = (s - per[i]) / Math.hypot(b[0] - a[0], b[1] - a[1]); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.atan2(b[1] - a[1], b[0] - a[0])]; };
  const hechoEmp = m.fase >= 1 ? 1 : (3 - m.obra) / 3, hechoPie = m.fase >= 2 ? 1 : m.fase === 1 && m.obra ? (3 - m.obra) / 3 : 0, rr = azar(5);
  /* piedra: tramos de 30,5 entre puertas */
  const tm = () => { const v = 0.62 + 0.18 * rr(); return { muro: [v, v * 0.94, v * 0.84], teja: [0.8, 0.76, 0.72, 0] }; }, muros = [], torres = [], puertasL = [];
  const nT = Math.round(largo / 30.5), paso = largo / nT;
  for (let i = 0; i < nT; i++) { const q = en((i + 0.5) * paso), ini = en(i * paso); if (i / nT >= hechoPie) {            // empalizada: estacas
      if (i / nT < hechoEmp) for (let s = i * paso; s < (i + 1) * paso; s += 1.7) { const e = en(s); if (cerca(e[0], e[1], 7)) continue; const h = (6.2 + rr() * 1.4) * (m.fase >= 1 ? 1 : 0.3 + 0.7 * hechoEmp); B.caja(1.5, h + 2, 1.2, e[0], altura(e[0], e[1]) + h / 2 - 1, e[1], rr() < 0.5 ? '#6b5338' : '#7a6042', -e[2]); }
      continue; }
    const pu = cerca(q[0], q[1], paso * 0.55);
    if (pu && !pu._hecha) { pu._hecha = true; puertasL.push({ m: matriz(pu.x, suelo(pu.x, pu.z, 8) - 1.2, pu.z, -pu.ang, 0.83, 0.86, 0.8), ...tm() }); torres.push({ m: matriz(ini[0], suelo(ini[0], ini[1], 4) - 1.5, ini[1], 0, 0.8, 0.72, 0.8), ...tm() }); }
    else if (!pu) { muros.push({ m: matriz(q[0], suelo(q[0], q[1], 10) - 1.5, q[1], -q[2], paso / 30.5 * 0.83, 0.86, 0.8), ...tm() }); if (i % 3 === 0) torres.push({ m: matriz(ini[0], suelo(ini[0], ini[1], 4) - 1.5, ini[1], rr() * 0.2, 0.8, 0.72, 0.8), ...tm() }); } }
  for (const p of E.puertas) delete p._hecha;
  L.muro.poner(muros); L.torre.poner(torres); L.puerta.poner(puertasL);
}
/* andamio de obra (CN3): uno por cada entrada de Game.state.cities[id].obras. obrasAlDia() corre cada cuadro y solo reconstruye cuando el avance cambia un 5 % */
let obrasF = [], firmaObras = '', obrasLista = null; const angObra = new WeakMap();
const _gris = new THREE.Color();
const apaga = (col, pausa) => { if (!pausa) return col; _gris.set(col); const l = (_gris.r + _gris.g + _gris.b) / 3 * 0.8; _gris.r = _gris.r * 0.3 + l * 0.7; _gris.g = _gris.g * 0.3 + l * 0.7; _gris.b = _gris.b * 0.3 + l * 0.7; return '#' + _gris.getHexString(); };
/* paño de lona (8 triángulos, doble cara): de (xa,za) a (xb,zb), de y0 a y1; hinchado si hay obra, caído y gris si está en pausa */
function lonaPaño(B, xa, za, xb, zb, y0, y1, col, pausa, fase) {
  const L = Math.hypot(xb - xa, zb - za), g = new THREE.PlaneGeometry(L, y1 - y0, 4, 1), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) P.setZ(i, pausa ? 0.05 : Math.sin(P.getX(i) / L * 6.28 + fase) * 0.35);
  g.computeVertexNormals(); B.add(g, col, new THREE.Matrix4().compose(new THREE.Vector3((xa + xb) / 2, (y0 + y1) / 2, (za + zb) / 2), _q.setFromEuler(_e.set(0, -Math.atan2(zb - za, xb - xa), 0, 'YXZ')), new THREE.Vector3(1, 1, 1))); }
/* lona, cuerdas y escalera de un andamio (≈112 triángulos); mallas sin sombra aparte del armazón */
function andamioExtra(B, o, rr, en, h, y) {
  const { w, d, ang, pausa } = o, hl = pausa ? 0.38 : 0.62, col = apaga(pausa ? '#c2b698' : '#e0cfa0', pausa), cu = apaga('#6a5636', pausa), mad = apaga('#8a6c48', pausa), fase = rr() * 6;
  const a = en(-(w / 2 + 1), -(d / 2 + 1.1)), b = en(w / 2 + 1, -(d / 2 + 1.1)), c = en(w / 2 + 1.1, -(d / 2 + 1)), e = en(w / 2 + 1.1, d / 2 + 1);       // lona de frente y de un costado
  const ytop = y + h * 0.9; lonaPaño(B, a[0], a[1], b[0], b[1], ytop - h * hl, ytop, col, pausa, fase); lonaPaño(B, c[0], c[1], e[0], e[1], ytop - h * hl, ytop, col, pausa, fase + 2);
  for (const [p, q] of [[a, b], [c, e]]) { const mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, L = Math.hypot(q[0] - p[0], q[1] - p[1]); B.caja(L, 0.07, 0.07, mx, ytop + 0.1, mz, cu, -Math.atan2(q[1] - p[1], q[0] - p[0])); }      // cuerda de la que cuelga cada paño
  const hE = Math.min(h * 0.72, 7), ia = pausa ? 0.4 : 0.25, gir = -(ang + Math.PI / 2), v0 = -(d / 2 + 1) - 1.3, y0 = altura(en(0, v0)[0], en(0, v0)[1]);       // escalera apoyada en el frente, inclinada hacia la obra
  for (const k of [-0.4, 0.4]) { const p = en(w * 0.25 + k, v0 + hE / 2 * Math.sin(ia)); B.caja(0.12, hE, 0.12, p[0], y0 + hE / 2 * Math.cos(ia), p[1], mad, gir, ia); }
  for (let i = 0; i < 4; i++) { const u = (i + 0.8) / 4.6, p = en(w * 0.25, v0 + hE * u * Math.sin(ia)); B.caja(0.8, 0.1, 0.1, p[0], y0 + hE * u * Math.cos(ia), p[1], mad, gir); }
}
function andamio(B, o, rr, B2) {
  const { x, z, ang, w, d, av } = o, ap = ANDAMIO_NUEVO && o.pausa ? c => apaga(c, true) : c => c, c = Math.cos(ang + Math.PI / 2), s = Math.sin(ang + Math.PI / 2), en = (u, v) => [x + u * c - v * s, z + u * s + v * c], h = Math.min(16, Math.max(w, d) * 0.6) + 2;
  for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, -1], [0, 1]]) { const p = en(u * (w / 2 + 1), v * (d / 2 + 1)); B.caja(0.4, h + 2, 0.4, p[0], altura(p[0], p[1]) + h / 2 - 1, p[1], ap('#8a6c48')); }
  const niv = av > 0.66 ? [0.38, 0.72, 1] : av > 0.33 ? [0.38, 0.72] : [0.38];            // los tablones suben con la obra
  for (const hh of niv) for (const v of [-1, 1]) { const p = en(0, v * (d / 2 + 1)); B.caja(w + 2.4, 0.3, 0.9, p[0], altura(x, z) + h * hh, p[1], ap('#a08458'), -(ang + Math.PI / 2)); }
  for (const hh of niv.slice(0, 2)) for (const u of [-1, 1]) { const p = en(u * (w / 2 + 1), 0); B.caja(0.3, 0.3, d + 2.4, p[0], altura(x, z) + h * hh, p[1], ap('#a08458'), -(ang + Math.PI / 2)); }
  for (let i = 0, n = Math.ceil(3 * (1 - av)); i < n; i++) { const p = en((rr() - 0.5) * (w + 10), (d / 2 + 3 + rr() * 3) * -1); B.caja(2.2, 1.2, 1.4, p[0], altura(p[0], p[1]) + 0.6, p[1], ['#b0a48c', '#9a8e78', '#8a6c48'][i % 3], rr() * 3); }
  if (ANDAMIO_NUEVO && B2) andamioExtra(B2, o, rr, en, h, altura(x, z));
}
function obrasAlDia() {
  const G = window.Game, lista = obrasLista, t = G && G.state ? G.state.t : 0, nuevas = [];
  for (const o of lista || []) { if (!o.pieza || !CI.EDIF[o.pieza]) continue; const D0 = CI.EDIF[o.pieza]; let ang = angObra.get(o);
    if (ang === undefined) { const e = o.eid != null ? E.edificios.find(q => q.id === o.eid) : null; ang = e ? e.ang : 0; if (!e) { try { const n = CI.notaSitio(E, o.pieza, o.x, o.z); if (n && isFinite(n.ang)) ang = n.ang; } catch (_) {} } angObra.set(o, ang); }
    const av = Math.max(0, Math.min(1, (t - o.t0) / Math.max(1e-6, o.t1 - o.t0)));
    nuevas.push({ pieza: o.pieza, x: o.x, z: o.z, ang, w: D0.w, d: D0.d, nuevo: !!o.nuevo, av: Math.floor(av * 20) / 20, pausa: ANDAMIO_NUEVO && !!o.pausa }); }
  const f = nuevas.map(o => o.pieza + o.x + o.z + o.av + o.nuevo + (o.pausa ? 'p' : '')).join('|'); if (f === firmaObras) return; firmaObras = f; obrasF = nuevas;
  if (andL) { scene.remove(andL); andL.geometry.dispose(); andL = null; }
  if (andM) { scene.remove(andM); andM.geometry.dispose(); andM = null; }
  if (nuevas.length) { const B = new Bulto(), B2 = ANDAMIO_NUEVO ? new Bulto() : null, rr = azar(11); for (const o of nuevas) andamio(B, o, rr, B2); andM = new THREE.Mesh(B.geo(), matBulto); andM.castShadow = andM.receiveShadow = true; scene.add(andM);
    if (B2 && B2.p.length) { andL = new THREE.Mesh(B2.geo(), matBulto); andL.castShadow = false; andL.receiveShadow = true; scene.add(andL); } }
  if (ANDAMIO_NUEVO && E) arboles();
  edificios(); sombraPend = true; pedirReparto = true;
}
function dinamico() {
  const B = new Bulto(), rr = azar(7), pajas = [];
  muralla(B);
  /* escombros de las casas en ruina: piedras caídas y vigas quemadas */
  for (const l of E.parcelas) { const c = l.casa; if (!c || !c.ruina || l.fuera) continue; for (let i = 0; i < 5; i++) { const x = l.x + (rr() - 0.5) * 9, z = l.z + (rr() - 0.5) * 9, y = altura(x, z); if (i < 3) B.caja(0.9 + rr() * 1.1, 0.5 + rr() * 0.5, 0.9 + rr(), x, y + 0.3, z, ['#6a6054', '#5a5046', '#4a4238'][i], rr() * 3); else B.caja(0.4, 3.2, 0.4, x, y + 1.3, z, '#241e1a', 0, (rr() - 0.5) * 0.5, (rr() - 0.5) * 0.5); } }
  for (const e of E.edificios) { const c = Math.cos(e.ang + Math.PI / 2), s = Math.sin(e.ang + Math.PI / 2), en = (u, v) => [e.x + u * c - v * s, e.z + u * s + v * c];
    if (e.tipo === 'granja' && !e.obra && e.campo) { for (let i = 0; i < 4; i++) { const a = e.campo[i], b = e.campo[(i + 1) % 4], Lg = Math.hypot(b[0] - a[0], b[1] - a[1]), nn = Math.round(Lg / 6); for (let k = 0; k <= nn; k++) { const x = a[0] + (b[0] - a[0]) * k / nn, z = a[1] + (b[1] - a[1]) * k / nn; B.caja(0.3, 1.5, 0.3, x, altura(x, z) + 0.75, z, '#6a5540'); } }
      if (!e.ruina) for (let i = 0; i < 5; i++) { const p = en(-28 + i * 14 + rr() * 4, 20 + rr() * 34); pajas.push({ m: matriz(p[0], altura(p[0], p[1]), p[1], rr() * 6, 1.1 + rr() * 0.6) }); } }
    if (e.tipo === 'fuente' && !e.obra) { const y = altura(e.x, e.z); B.add(new THREE.CylinderGeometry(6.6, 6.9, 0.5, 14), '#a89e8a', new THREE.Matrix4().makeTranslation(e.x, y + 0.2, e.z)); } }
  L.paja.poner(pajas);
  if (dinM) { scene.remove(dinM); dinM.geometry.dispose(); } dinM = new THREE.Mesh(B.geo(), matBulto); dinM.castShadow = dinM.receiveShadow = true; scene.add(dinM);
}
/* el surco: una cinta oscura pegada al relieve que el arado va abriendo */
export function surcar() {
  const S = E.surco, n = S.length, pos = [], idx = []; for (let i = 0; i <= n; i++) { const p = S[i % n], t = Math.atan2(p[1] - E.foro.z, p[0] - E.foro.x); for (const o of [-1.5, 1.5]) { const x = p[0] + Math.cos(t) * o, z = p[1] + Math.sin(t) * o; pos.push(x, altura(x, z) + 0.35, z); } if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  surcoM = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: '#4a3524', side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); surcoM.receiveShadow = true; surcoM.frustumCulled = false; g.setDrawRange(0, 0); scene.add(surcoM);
  const b = new Bulto(); for (const v of [-1.6, 1.6]) { b.caja(5, 2.8, 2, 3, 2.6, v, v < 0 ? '#e8e2d2' : '#d8d0bc'); b.caja(1.6, 1.5, 1.4, 6, 3.4, v, '#e8e2d2'); for (const u of [1.2, 4.8]) b.caja(0.6, 1.4, 0.6, u, 0.7, v, '#cfc6b2'); } b.caja(6, 0.3, 0.3, -1.5, 2.2, 0, '#6a4a2c', 0, 0, 0.3); b.caja(0.4, 2.6, 0.4, -4.4, 2.2, 0, '#6a4a2c'); b.caja(0.9, 3.4, 0.9, -5.6, 2.2, 0, '#b8a888');
  aradoM = new THREE.Mesh(b.geo(), matBulto); aradoM.castShadow = true; scene.add(aradoM);
  surcoT0 = ahora(); esperaSurco = surcoT0 + 2.7; animHasta = esperaSurco + 3;
}
let pedirReparto = false;
/* pone la escena al día con el estado. Las sombras se piden aquí (como mucho una vez por cambio) */
export function sincronizar(forzar) {
  if (!E || (!forzar && E.rev === revVista) || ahora() < esperaSurco) return; revVista = E.rev;
  sueloJ.pintar(E); arboles(); edificios(); dinamico();
  if (surcoM) surcoM.visible = E.muralla.fase < 2;
  if (casas(ahora())) animHasta = Math.max(animHasta, ahora() + 2.6);
  sombraPend = true; pedirReparto = true;
}

/* ---------- miniaturas de las fichas: cada pieza real, dibujada una vez en un lienzo pequeño ---------- */
export function miniaturas() {
  const out = {}, T = 144, rt = new THREE.WebGLRenderTarget(T, T), esc = new THREE.Scene(); esc.add(new THREE.DirectionalLight('#ffe8c8', 3.2).translateX(-3).translateY(4).translateZ(3), new THREE.HemisphereLight('#c8d4e8', '#8a7458', 1.6));
  const c2 = document.createElement('canvas'); c2.width = c2.height = T; const g = c2.getContext('2d'), px = new Uint8Array(T * T * 4), ca = new THREE.Color(); renderer.getClearColor(ca);
  for (const [id, k] of [...Object.entries(PZ).map(([t, d]) => [t, d[0]]), ['muralla', 'torre']]) { const st = pieza(k); if (!st) continue; const lt = new Lote(k, [st], 1, { escena: esc, sinTeja: id === 'fuente' || id === 'muralla' }); lt.poner([{ m: new THREE.Matrix4(), ...(id === 'muralla' ? { muro: [0.7, 0.66, 0.6] } : PIEL_U) }]); for (const m of lt.niv[0].mallas) { m.count = 1; lt.niv[0].iM.array.set(lt.M.subarray(0, 16)); lt.niv[0].iA.array.set(lt.aM.subarray(0, 3)); lt.niv[0].iT.array.set(lt.aT.subarray(0, 4)); }
    const b = st.bb, y0 = Math.max(b[1], -1), cx = (b[0] + b[3]) / 2, cy = (y0 + b[4]) / 2, cz = (b[2] + b[5]) / 2, r = 0.5 * Math.hypot(b[3] - b[0], b[4] - y0, b[5] - b[2]), cm = new THREE.PerspectiveCamera(30, 1, 1, 500); cm.position.set(cx + r * 2.1, cy + r * 1.7, cz + r * 2.4); cm.lookAt(cx, cy, cz);
    renderer.setRenderTarget(rt); renderer.setClearColor('#000000', 0); renderer.clear(); renderer.render(esc, cm); renderer.readRenderTargetPixels(rt, 0, 0, T, T, px); renderer.setRenderTarget(null);
    const im = g.createImageData(T, T); for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const o = ((T - 1 - y) * T + x) * 4, d = (y * T + x) * 4; for (let q = 0; q < 3; q++) im.data[d + q] = 255 * Math.pow(Math.min(1, px[o + q] / 255 * 1.15), 1 / 2.2); im.data[d + 3] = px[o + 3]; }
    g.putImageData(im, 0, 0); out[id] = c2.toDataURL('image/png'); for (const m of lt.niv[0].mallas) { esc.remove(m); m.geometry.dispose(); } }
  renderer.setClearColor(ca, 1); rt.dispose(); return out;
}

/* ---------- antorchas (Q11): una sola malla instanciada junto a las puertas y el foro; llama = sprite que mira a la cámara, sin luces reales ---------- */
let antM = null, antFirma = '';
function antorchas() {
  if (!E || !E.fundada || !E.foro) { if (antM) antM.visible = false; return; }
  const f = E.puertas.length + '|' + Math.round(E.foro.x) + '|' + Math.round(E.foro.z);
  if (f !== antFirma) { antFirma = f; if (antM) { scene.remove(antM); antM.geometry.dispose(); antM = null; }
    const P = []; for (const p of E.puertas) for (const sg of [1, -1]) { const x = p.x + Math.cos(p.ang) * 9.5 * sg, z = p.z + Math.sin(p.ang) * 9.5 * sg; P.push(x, altura(x, z), z, (x * 0.37 + z * 0.11) % 6.28); }
    for (let i = 0; i < 6; i++) { const k = i / 6 * Math.PI * 2 + 0.4, x = E.foro.x + Math.cos(k) * 30, z = E.foro.z + Math.sin(k) * 30; P.push(x, altura(x, z), z, i * 1.9); }
    const n = P.length / 4, g = new THREE.InstancedBufferGeometry(), pos = [], fl = [], idx = [];
    /* poste: caja fina de 12 triángulos; llama: un cuadrado */
    const bx = [[-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]; for (const [x, y, z] of bx) { pos.push(x * 0.22, y * 3.5, z * 0.22); fl.push(0); }
    idx.push(0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7);
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(x, y, 0); fl.push(1); } idx.push(8, 9, 10, 8, 10, 11);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aFl', new THREE.Float32BufferAttribute(fl, 1)); g.setIndex(idx); g.setAttribute('aP', new THREE.InstancedBufferAttribute(new Float32Array(P), 4)); g.instanceCount = n;
    const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { uTiempo: U.uTiempo, uNoche: { value: 0 } },
      vertexShader: 'attribute vec4 aP; attribute float aFl; uniform float uTiempo, uNoche; varying vec2 vQ; varying float vF, vPh; void main(){ vF = aFl; vPh = aP.w; vQ = position.xy; vec4 mv;' +
        ' if (aFl > 0.5) { float fl = 1.0 + 0.2 * sin(uTiempo * 13.0 + aP.w * 7.0) + 0.12 * sin(uTiempo * 29.0 + aP.w * 3.0); mv = modelViewMatrix * vec4(aP.xyz + vec3(0.0, 4.1, 0.0), 1.0); mv.xy += position.xy * 2.3 * fl * uNoche; }' +
        ' else mv = modelViewMatrix * vec4(aP.xyz + position, 1.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying vec2 vQ; varying float vF, vPh; uniform float uTiempo, uNoche; void main(){ if (vF < 0.5) { gl_FragColor = vec4(0.22, 0.15, 0.09, 1.0); } else { float r = length(vQ); float a = exp(-r * r * 3.2) * uNoche; if (a < 0.01) discard; vec3 c = mix(vec3(1.0, 0.45, 0.1), vec3(1.0, 0.9, 0.5), exp(-r * r * 9.0)); gl_FragColor = vec4(c, min(1.0, a * 1.25)); }\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n }' });
    antM = new THREE.Mesh(g, m); antM.frustumCulled = false; antM.renderOrder = 5; scene.add(antM); }
  antM.material.uniforms.uNoche.value = noche; antM.visible = LUZ_ESTACIONAL && E.fundada;
}

/* ---------- cuadro ---------- */
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4(), _ult = new Float32Array(16);
function repartir(todo) { camara.updateMatrixWorld(); _pm.multiplyMatrices(camara.projectionMatrix, camara.matrixWorldInverse); _fr.setFromProjectionMatrix(_pm); const kf = 1 / Math.tan(camara.fov * Math.PI / 360); for (const l of lotes) l.repartir(_fr, camara.position, kf, todo); }
export const medidas = { triangulos: 0, llamadas: 0, sombras: 0, conSombra: 0 };
function dibujar() {
  if (LUZ_ESTACIONAL) luz(); antorchas();
  /* CN15a: tinte por estación (suelo, árboles, humo). Solo al cambiar de estación o de paso (8 pasos): sin repintar sombras */
  if (LUZ_ESTACIONAL && sueloJ && estClave !== estK * 9 + Math.round(estF * 8)) { estQ = Math.round(estF * 8); estClave = estK * 9 + estQ; sueloJ.estacion(estK, estQ / 8); vida.tinteHumo(scene.fog.color); if (E) { nTalados = -1; arboles(); pedirReparto = true; } }
  const t = ahora(), dtC = Math.min(0.25, t - (U.uTiempo.value || t)); U.uTiempo.value = t; if (pinM && pinM.visible) pinM.rotation.y = t * 2;
  if (E) { sincronizar(false); if (ahora() >= esperaSurco) obrasAlDia(); }
  /* arado y surco */
  if (surcoM && surcoT0 >= 0) { const u = Math.min(1, (t - surcoT0) / 2.6), n = E.surco.length, k = Math.floor(u * n); surcoM.geometry.setDrawRange(0, k * 6); if (aradoM) { if (u >= 1) { scene.remove(aradoM); aradoM.geometry.dispose(); aradoM = null; surcoT0 = -1; revVista = -1; } else { const p = E.surco[k % n], q = E.surco[(k + 1) % n]; aradoM.position.set(p[0], altura(p[0], p[1]), p[1]); aradoM.rotation.y = -Math.atan2(q[1] - p[1], q[0] - p[0]); } } }
  /* crecida: el agua sube el mes de la crecida y baja después */
  if (crecida && E) { const sube = E.crecida === E.mesN && E.fundada, obj = NIVEL_RIO + (sube ? 3.9 : -0.6), y = crecida.position.y + (obj - crecida.position.y) * Math.min(1, dtC * 1.6); crecida.position.y = y; crecida.visible = y > NIVEL_RIO + 0.05; }
  const anim = t < animHasta; if (anim && E && t >= esperaSurco) { if (!casas(t) && t > esperaSurco + 1) animHasta = 0; pedirReparto = true; if (animHasta === 0) sombraPend = true; }
  if (sombraPend && !anim) { repartir(true); renderer.shadowMap.needsUpdate = true; renderer.render(scene, camara); sombraPend = false; _ult[0] = NaN; medidas.sombras++; medidas.conSombra = renderer.info.render.triangles; }
  camara.updateMatrixWorld(); _pm.multiplyMatrices(camara.projectionMatrix, camara.matrixWorldInverse); let igual = !pedirReparto; for (let i = 0; i < 16; i++) if (_pm.elements[i] !== _ult[i]) { igual = false; _ult[i] = _pm.elements[i]; }
  if (!igual) { repartir(false); pedirReparto = false; }
  renderer.render(scene, camara); medidas.triangulos = renderer.info.render.triangles; medidas.llamadas = renderer.info.render.calls;
}
async function texturasListas() { await Promise.all(esperas); hornos.forEach(f => f()); hornos.length = 0; }

/* ---------- los ganchos que usará la pantalla (CN4, CN5) ---------- */
export const ganchos = { calor, ponerFantasma, ponerGroma, sueloEn, aPantalla, miniaturas, surcar, sincronizar };

/* ---------- la vista del juego ---------- */
const PK = 0.7;                                    // escala de las personas respecto a las piezas
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export class CityView3D {
  constructor(hostEl, opts) {
    host = this.host = hostEl; this.opts = opts || {};
    renderer = this.r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92; renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;      // la sombra se calcula a petición
    this.cv = renderer.domElement; this.cv.className = 'gl'; this.cv.style.touchAction = 'none'; host.appendChild(this.cv);
    this.labels = document.createElement('div'); this.labels.className = 'mlabels'; host.appendChild(this.labels);      // vacío: las medallas las quitó CN3 (CN4 pone la ficha)
    this.els = {}; this.figs = new Map(); this.cit = []; this.shift = 0; this.shiftT = 0; this.men = 0; this.coast = false; this.listo = false; this.camA = null; this.guarn = null; this._sel = null; this._rev = -1;
    this.armyEl = document.createElement('button'); this.armyEl.className = 'mlabel cityb army2'; this.armyEl.style.display = 'none';
    this.armyEl.addEventListener('click', ev => { ev.stopPropagation(); this.view('ejercito'); if (this.opts.onArmy) this.opts.onArmy(); }); this.labels.appendChild(this.armyEl);
    const self = this; this.c = { get dist() { return cam.d; }, set dist(v) { cam.d = v; ponerCamara(); }, get yaw() { return cam.az; }, set yaw(v) { cam.az = v; ponerCamara(); } };      // compatibilidad con captura-ciudad.mjs
    this.resize(); this.bind();
    montar().then(texturasListas).then(() => { this.listo = true; }).catch(e => console.error('Ciudad 3D: no se pudo montar', e));
  }
  /* ganchos de CN3 (los conectan CN4 y CN5) */
  calor(notas) { if (sueloJ) sueloJ.calor(notas); }
  ponerFantasma(f) { if (this.listo) ponerFantasma(f); }
  ponerGroma(g) { if (this.listo) ponerGroma(g); }
  sueloEn(px, py) { return sueloEn(px, py); }
  aPantalla(x, z, dy) { return aPantalla(x, z, dy); }
  miniaturas() { return miniaturas(); }
  surcar() { surcar(); }
  /* pone la cámara mirando al punto (x, z) del mundo (d = distancia, az = giro; opcionales). Para fichas, avisos y capturas */
  mirar(x, z, d, az) { this.camA = null; cam.tx = x; cam.tz = z; if (d) cam.d = d; if (az !== undefined) cam.az = az; cam.elF = 0; ponerCamara(); }
  sincronizar(forzar) { sincronizar(forzar); }

  /* figuras reales (ciudadanos y guarnición): una malla instanciada por tipo */
  fig(key, cap) {
    let e = this.figs.get(key); if (e) return e; const u = UN.getUnit(key); if (!u) return null;
    const g = UN.instancedGeometry(u, cap), m = new THREE.InstancedMesh(g, UN.unitMaterialReal(u, D.FACTIONS.roma.col), cap); m.frustumCulled = false; m.count = 0; scene.add(m);
    e = { m: m, M: m.instanceMatrix.array, a: g.attributes.aFrame.array, cap: cap, i: 0, u: u }; this.figs.set(key, e); return e;
  }
  put(e, x, z, yaw, clip, t, esc) {
    if (!e || e.i >= e.cap) return; const M = e.M, o = e.i * 16, k = esc || PK, c = Math.cos(yaw) * k, s = Math.sin(yaw) * k;
    M[o] = c; M[o + 1] = 0; M[o + 2] = -s; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = k; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = s; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = altura(x, z) + 0.1; M[o + 14] = z; M[o + 15] = 1;
    e.a[e.i] = UN.frameOf(clip, t); e.i++;
  }
  /* CN15c: sonido ambiente (sonido-ciudad.js); solo lee lo que ya existe y nunca rompe el cuadro */
  sonar(city, id) {
    try {
      const S = window.SonidoCiudad; if (!S || !E || (window.Sonido && window.Sonido.activo === false)) return; const Gm = window.Game, st = Gm && Gm.state, ed = E.edificios || [], n = tp => ed.filter(q => q.tipo === tp && !q.obra && !q.ruina).length, ob = city && city.obras || [];
      const fm = st && typeof st.t === 'number' ? st.t - Math.floor(st.t) : 0.45;      // el mes hace de día: 0,45 = mediodía, el final del mes es la noche (misma curva que la luz)
      S.actualizar({ camD: cam.d, camX: camara.position.x, camZ: camara.position.z, estacion: estacionActual().ks, hora: ((fm - 0.45) * 24 + 36) % 24,
        nObrasActivas: ob.filter(o => !o.pausa).length, forja: n('taller') + n('herreria'), mercado: n('mercado'), granjas: n('granja'),
        fuego: E.fuego && E.fuego.mes === E.mesN ? 1 : 0, hambre: E.hambre ? 1 : 0, crecida: E.crecida === E.mesN ? 1 : 0, dRio: distRio(cam.tx, cam.tz),
        pending: !!(st && st.pending && st.pending.length), vivo: !!(st && st.vivo), obreros: trajin.obreros(), recuas: trajin.recuas() });
    } catch (e) { /* el sonido nunca rompe la vista */ }
  }
  /* ciudadanos, humo y carros: vida.js (CN11-A). La guarnición formada ante la puerta principal es provisional (CN11-B) */
  people(city, t, dt) {
    for (const e of this.figs.values()) e.i = 0;
    vida.actualizar(E, cam.d, t, dt, ahora() >= esperaSurco); Fachadas.actualizar(E, cam.d); Civicas.actualizar(E, cam.d); trajin.actualizar(E, city, cam.d, t, dt, ahora() >= esperaSurco);
    /* guarnición: vida.js (CN11-B), real de cerca y cajas de lejos */
    const g = vida.guarnicion(E, city.units, camara.position, t, { PK, D }); this.men = g.men; this.guarn = g.hay ? { x: g.x, z: g.z } : null;
    for (const e of this.figs.values()) { e.m.count = e.i; e.m.instanceMatrix.needsUpdate = true; e.m.geometry.attributes.aFrame.needsUpdate = true; }
  }

  /* pone la escena al día y dibuja un cuadro. city = c de Game.state.cities; sel = id D.BUILD elegido o null */
  update(city, id, sel, t) {
    const dt = Math.min(0.1, Math.max(0, t - (this.lastT || t))); this.lastT = t;
    this.coast = !!(D.CITIES[id] && D.CITIES[id].sea);
    if (!this.listo) { renderer.render(scene, camara); return; }
    const Gm = window.Game, e = Gm && Gm.ciudadE ? Gm.ciudadE(id) : null;
    if (e !== E || !sueloJ) { mundo(e); this.view('ciudad'); this._sel = null; }
    if (sel !== this._sel) { this._sel = sel || null; const p = sel && this.posDe(sel); if (p) this.camA = { t0: performance.now(), de: { tx: cam.tx, tz: cam.tz, d: cam.d }, tx: p.x, tz: p.z, d: Math.min(cam.d, 300) }; }
    if (this.camA) { const u = Math.min(1, (performance.now() - this.camA.t0) / 900), f = 1 - Math.pow(1 - u, 3), A = this.camA; cam.tx = A.de.tx + (A.tx - A.de.tx) * f; cam.tz = A.de.tz + (A.tz - A.de.tz) * f; cam.d = A.de.d + (A.d - A.de.d) * f; if (u >= 1) this.camA = null; }
    /* la ficha tapa la parte de abajo: la imagen sube para que el punto mirado quede en el centro de lo que se ve */
    const H = vista.h, top = this.fichaTop ? this.fichaTop - host.getBoundingClientRect().top : 0;
    this.shiftT = sel && top > 0 ? Math.max(-60, Math.min(420, H / 2 - (top / 2 + 24))) : 0;
    this.shift += (this.shiftT - this.shift) * 0.15; if (Math.abs(this.shift - desvio) > 0.4) desvio = this.shift; else if (!this.shiftT && Math.abs(this.shift) < 0.4) desvio = 0;
    obrasLista = city && city.obras || null;
    ponerCamara();
    this.people(city, t, dt);
    this.sonar(city, id);
    dibujar();
    this.etiquetasBarrio(H);
    const el = this.armyEl, txt = '⚔️ Guarnición · ' + this.men; if (el._t !== txt) { el._t = txt; el.textContent = txt; }
    if (this.guarn && this.men && cam.d < 700) { const p = aPantalla(this.guarn.x, this.guarn.z, 14), r = host.getBoundingClientRect(), y = p.y - r.top; if (p.ok && y > 104 && y < H - 150) { el.style.display = ''; el.style.transform = 'translate(' + (p.x - r.left).toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)'; } else el.style.display = 'none'; } else el.style.display = 'none';
  }
  /* CN6: una etiqueta pequeña por barrio («Foro · II»), solo con la cámara lejos y lejos de la línea de arriba y de la bandeja de abajo */
  etiquetasBarrio(H) {
    const bs = E && E.barrios || [], lejos = cam.d >= 380 && bs.length > 0 && !['popsheet', 'hoja', 'cuentas', 'csheet', 'modal'].some(i => { const q = document.getElementById(i); return q && !q.hidden; }); this.bel = this.bel || [];
    while (this.bel.length < bs.length) { const el = document.createElement('div'); el.className = 'mlabel barrio'; el.style.display = 'none'; this.labels.appendChild(el); this.bel.push(el); }
    const r = host.getBoundingClientRect();
    this.bel.forEach((el, i) => {
      const b = bs[i]; if (!b || !lejos) { el.style.display = 'none'; return; }
      const txt = (b.corto || b.nombre) + ' · ' + (CI.ROMANOS[b.nivel || 1] || 'I'); if (el._t !== txt) { el._t = txt; el.textContent = txt; }
      const p = aPantalla(b.x, b.z, 6), y = p.y - r.top;
      if (p.ok && y > 200 && y < H - 240) { el.style.display = ''; el.style.transform = 'translate(' + Math.max((el.offsetWidth || 96) / 2 + 6, Math.min(r.width - (el.offsetWidth || 96) / 2 - 6, p.x - r.left)).toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%)'; } else el.style.display = 'none';
    });
  }
  /* dónde está el edificio de D.BUILD b en la ciudad */
  posDe(b) { if (!E) return null; if (b && typeof b === 'object') return { x: b.x, z: b.z }; if (b === 'foro') return E.foro ? { x: E.foro.x, z: E.foro.z } : null; const pz = CI.PIEZA_DE[b], e = pz && E.edificios.find(q => q.tipo === pz); return e ? { x: e.x, z: e.z } : null; }
  /* qué se ha tocado: id D.BUILD o null */
  tocar(x, y) {
    if (this.opts.onSuelo && this.opts.onSuelo(x, y)) return;      // CN4: en modo colocar el toque mueve el fantasma
    const g = sueloEn(x, y); let b = null, ed = null;
    if (g && E) { if (E.foro && Math.hypot(g[0] - E.foro.x, g[1] - E.foro.z) < 26) b = 'foro';
      else { ed = E.edificios.find(q => Math.hypot(q.x - g[0], q.z - g[1]) < Math.max(q.w, q.d) * 0.6) || null; const bid = ed && CI.EDIF[ed.tipo] && CI.EDIF[ed.tipo].bid; if (bid && D.BUILD[bid]) b = bid; } }
    if (this.opts.onPick) this.opts.onPick(b, ed, g);      // CN4: id D.BUILD (o null), la pieza tocada de E.edificios (o null) y el punto del suelo
  }
  /* dedos y ratón: un dedo arrastra el suelo; dos dedos acercan, giran y arrastran; la rueda acerca; el botón derecho o Mayús gira */
  bind() {
    const cv = this.cv, dedos = new Map(); let gesto = null;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); dedos.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.camA = null;
      if (dedos.size === 1) gesto = { tipo: e.button === 2 || e.shiftKey ? 'giro' : 'mover', x0: e.clientX, y0: e.clientY, t0: performance.now(), movido: 0, g: sueloEn(e.clientX, e.clientY) };
      if (dedos.size === 1 && this.opts.agarra) { const o = this.opts.agarra(e.clientX, e.clientY); if (o) Object.assign(gesto, { tipo: 'ficha', dx: o.dx, dy: o.dy }); }      // CN4: un dedo cerca del fantasma lo arrastra
      if (dedos.size === 2) { const [a, b] = [...dedos.values()]; gesto = { tipo: 'dos', d: Math.hypot(a.x - b.x, a.y - b.y), ang: Math.atan2(b.y - a.y, b.x - a.x), cd: cam.d, az: cam.az, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, movido: 99 }; } });
    cv.addEventListener('pointermove', e => { const p = dedos.get(e.pointerId); if (!p || !gesto) return; const ax = p.x; p.x = e.clientX; p.y = e.clientY;
      if (gesto.tipo === 'dos' && dedos.size >= 2) { const [a, b] = [...dedos.values()], d = Math.hypot(a.x - b.x, a.y - b.y), ang = Math.atan2(b.y - a.y, b.x - a.x), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; let da = ang - gesto.ang; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        cam.d = gesto.cd * gesto.d / Math.max(20, d); if (Math.abs(da) > 0.12 || gesto.gira) { gesto.gira = true; cam.az = gesto.az - da; } const k = cam.d / vista.h * 0.9, c = Math.cos(cam.az), s = Math.sin(cam.az), ux = -(mx - gesto.mx) * k, uy = -(my - gesto.my) * k * 1.6; cam.tx += ux * c + uy * s; cam.tz += -ux * s + uy * c; gesto.mx = mx; gesto.my = my; ponerCamara(); return; }
      if (dedos.size !== 1) return; gesto.movido = Math.max(gesto.movido, Math.hypot(e.clientX - gesto.x0, e.clientY - gesto.y0));
      if (gesto.tipo === 'ficha') { if (this.opts.onFicha) this.opts.onFicha(e.clientX + gesto.dx, e.clientY + gesto.dy); }
      else if (gesto.tipo === 'giro') { cam.az -= (e.clientX - ax) * 0.008; ponerCamara(); }
      else if (gesto.movido > 6 && gesto.g) { const g = sueloEn(e.clientX, e.clientY); if (g) { cam.tx += gesto.g[0] - g[0]; cam.tz += gesto.g[1] - g[1]; ponerCamara(); } } });
    const soltar = e => { if (!dedos.has(e.pointerId)) return; dedos.delete(e.pointerId);
      if (gesto && gesto.tipo !== 'dos' && dedos.size === 0 && gesto.movido < 9 && performance.now() - gesto.t0 < 600 && e.type === 'pointerup') this.tocar(e.clientX, e.clientY);
      if (dedos.size === 1) { const p = [...dedos.values()][0]; gesto = { tipo: 'mover', x0: p.x, y0: p.y, t0: 0, movido: 99, g: sueloEn(p.x, p.y) }; } else if (dedos.size === 0) gesto = null; };
    cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', soltar);
    cv.addEventListener('wheel', e => { e.preventDefault(); this.camA = null; cam.d *= Math.exp(e.deltaY * 0.0012); ponerCamara(); }, { passive: false });
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }
  zoom(f) { cam.d /= f; ponerCamara(); }
  /* vistas rápidas: ciudad entera, calle o ejército */
  view(name) {
    this.camA = null; cam.elF = 0; const f = E && E.foro, vert = vista.w < vista.h;
    if (name === 'calle') { let v = null, mejor = 0; if (E && E.vias && E.parcelas) { const nc = {}; for (const l of E.parcelas) if (l.casa && !l.fuera) nc[l.via] = (nc[l.via] || 0) + 1; for (const q of E.vias) if (q.p && q.p.length > 1 && q.largo >= 40 && (nc[q.id] || 0) > mejor) { mejor = nc[q.id]; v = q; } }      // la vía con más casas, vista a lo largo
      if (v) { const p = v.p; let sx = 0, sz = 0, n = 0; for (const l of E.parcelas) if (l.casa && !l.fuera && l.via === v.id) { sx += l.x; sz += l.z; n++; } sx /= n || 1; sz /= n || 1;      // el centro de las casas de esa vía
        let k = 0, dm = 1e9; p.forEach((q, i) => { const dd = Math.hypot(q[0] - sx, q[1] - sz); if (dd < dm) { dm = dd; k = i; } }); const i0 = Math.max(0, k - 2), i1 = Math.min(p.length - 1, k + 2), a = p[i0], b = p[k]; cam.tx = b[0]; cam.tz = b[1]; cam.az = Math.atan2(-(p[i1][0] - a[0]), -(p[i1][1] - a[1])); } else { cam.tx = f ? f.x : 0; cam.tz = f ? f.z + 20 : 0; cam.az = 0.25; }
      cam.d = 70; cam.elF = 0.3; }
    else if (name === 'ejercito') { const g = this.guarn || (f ? { x: f.x, z: f.z + 46 } : { x: 0, z: 0 }); cam.tx = g.x; cam.tz = g.z; cam.d = 90; cam.az = 0.35; cam.elF = 0.3; }
    else { let cx = f ? f.x : 0, cz = f ? f.z - 10 : -20, r = 120; if (E && E.surco && E.surco.length) { cx = cz = 0; for (const p of E.surco) { cx += p[0]; cz += p[1]; } cx /= E.surco.length; cz /= E.surco.length; r = 0; for (const p of E.surco) r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cz)); r = Math.max(r, 120); } cam.tx = cx; cam.tz = cz; cam.az = 0; cam.d = Math.max(260, r * (vert ? 3.6 : 2.8)); }
    ponerCamara();
  }
  resize() { const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); vista.w = w; vista.h = h; ponerCamara(); }
}
