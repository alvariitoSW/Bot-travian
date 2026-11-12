/* AQVILA — mapa de campaña en 3D: relieve del Mediterráneo, ciudades, rutas y ejércitos en marcha */
import { THREE, uTime, unitGeometry, unitMaterial } from './models.js';
import { staticMesh, getStatic } from './statics.js';
import COSTA from '../../assets/mapa/costa.js';
import { mapaMaterial, mapaTexturas, texturaRuido } from './ground.js';
import ALTURAS from '../../assets/mapa/alturas.js';
import { getUnit, unitMaterialReal, instancedGeometry, frameOf, UNIT_SCALE } from './units.js';

const D = window.DATA, G = window.Game;
const MARE_DIST = 130;   // C6: desde esta distancia de cámara el mapa está en el escalón Mare Nostrum
const K = 0.1;                                   // mundo 2D (1600x800) -> unidades 3D
const NX = 420, NZ = 210, CW = D.WORLD.w * K / NX, CH = D.WORLD.h * K / NZ;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* relieve: alturas reales (assets/mapa/alturas.js, misma malla que el mapa) a ESCALA_V unidades por metro; sin árboles sobre ARBOL_MAX m */
const ESCALA_V = 0.0008, ARBOL_MAX = 1800;
/* realce local de dos cumbres que la malla de alturas aplana (Etna 3330 m reales frente a 2630 en los datos; Olimpo 2917 frente a 2305): factor f en el pico, que baja hasta 1 a r grados. Licencia de juego para que se lean con roca y nieve */
const PICOS_REALCE = [{ lo: 15.0, la: 37.75, r: 0.55, f: 1.4 }, { lo: 22.35, la: 40.09, r: 0.55, f: 1.4 }];
const realce = (lo, la) => { let f = 1; for (const p of PICOS_REALCE) { const t = 1 - Math.hypot(lo - p.lo, la - p.la) / p.r; if (t > 0) f = Math.max(f, 1 + (p.f - 1) * t * t * (3 - 2 * t)); } return f; };
/* Mar con orillas: la distancia firmada a la costa (casillas; negativa en tierra) se hornea en una textura de 8 bits a DOBLE resolución
   (el campo se interpola entre nodos y el cruce por cero sigue la costa) y el sombreador del propio plano de mar dibuja con ella
   franjas de espuma que suben y bajan (más ruido y tiempo) y agua clara en el bajío. Sin triángulos nuevos. */
function mar(dist, land) {
  const TW = 2 * NX + 1, TH = 2 * NZ + 1, W1 = NX + 1, data = new Uint8Array(TW * TH), sd = k => land[k] ? -dist[k] : dist[k];
  for (let b = 0; b < TH; b++) for (let a = 0; a < TW; a++) {
    const i = Math.min(NX - 1, a >> 1), j = Math.min(NZ - 1, b >> 1), u = (a - 2 * i) / 2, v = (b - 2 * j) / 2, k = j * W1 + i;
    const q = (sd(k) * (1 - u) + sd(k + 1) * u) * (1 - v) + (sd(k + W1) * (1 - u) + sd(k + W1 + 1) * u) * v;
    data[b * TW + a] = Math.round((Math.max(-2, Math.min(6, q)) + 2) / 8 * 255);
  }
  const tD = new THREE.DataTexture(data, TW, TH, THREE.RedFormat, THREE.UnsignedByteType); tD.magFilter = tD.minFilter = THREE.LinearFilter; tD.wrapS = tD.wrapT = THREE.ClampToEdgeWrapping; tD.generateMipmaps = false; tD.needsUpdate = true;
  const m = new THREE.MeshPhongMaterial({ color: '#2f7fa6', transparent: true, opacity: 0.78, shininess: 90, specular: '#bfe6ff' }), tN = texturaRuido();
  m.onBeforeCompile = sh => {
    sh.uniforms.tD = { value: tD }; sh.uniforms.tN = { value: tN }; sh.uniforms.uTiempo = uTime;
    sh.vertexShader = 'varying vec2 vXZ;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vXZ = (modelMatrix * vec4(position, 1.0)).xz;');
    sh.fragmentShader = 'uniform sampler2D tD, tN; uniform float uTiempo; varying vec2 vXZ; float gEsp = 0.0;\n' + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec2 uv = vec2((vXZ.x / ${CW.toFixed(5)} * 2.0 + 0.5) / ${TW}.0, (vXZ.y / ${CH.toFixed(5)} * 2.0 + 0.5) / ${TH}.0);
        float dentro = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
        float sd = mix(9.0, texture2D(tD, clamp(uv, 0.0, 1.0)).r * 8.0 - 2.0, dentro);
        float n = texture2D(tN, vXZ * 0.23 + vec2(uTiempo * 0.012, -uTiempo * 0.008)).r, n2 = texture2D(tN, vXZ * 0.9 - vec2(uTiempo * 0.02, 0.0)).b;
        float baj = 1.0 - smoothstep(0.0, 3.4, sd);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.40, 0.80, 0.82), baj * 0.65);
        diffuseColor.a = mix(diffuseColor.a, 0.5, baj * baj);
        float borde = 0.4 + 0.5 * (0.5 + 0.5 * sin(uTiempo * 0.9 + n * 6.28));
        float f0 = (1.0 - smoothstep(borde - 0.3, borde, sd)) * (0.6 + 0.4 * n2);
        float p1 = 1.5 + 0.7 * sin(uTiempo * 0.6 + n * 5.0 + 1.7), f1 = (1.0 - smoothstep(0.05, 0.2, abs(sd - p1))) * smoothstep(0.3, 0.6, n2 + 0.25 * n);
        float p2 = 2.8 + 0.8 * sin(uTiempo * 0.45 + n * 4.0 + 3.1), f2 = (1.0 - smoothstep(0.04, 0.15, abs(sd - p2))) * smoothstep(0.5, 0.75, n2) * 0.7;
        gEsp = clamp(f0 + f1 + f2, 0.0, 1.0) * step(-0.15, sd) * dentro;
        diffuseColor.a = mix(diffuseColor.a, 0.97, gEsp);
      }`).replace('#include <opaque_fragment>', 'outgoingLight = mix(outgoingLight, vec3(1.0), gEsp * 0.9);\n#include <opaque_fragment>');
  };
  return m;
}
/* Línea sobre el relieve cada ~0,4 unidades (rutas de comercio, caminos y marchas): una sola función para todas */
function trazo(vista, pa, pb, alto) {
  const dx = (pb[0] - pa[0]) * K, dz = (pb[1] - pa[1]) * K, n = Math.max(2, Math.ceil(Math.hypot(dx, dz) / 0.4)), pts = [];
  for (let i = 0; i <= n; i++) { const x = pa[0] * K + dx * i / n, z = pa[1] * K + dz * i / n; pts.push(new THREE.Vector3(x, Math.max(0.03, vista.hAt(x, z)) + alto, z)); }
  return pts;
}

function inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function segDist(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)) : 0; return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t); }

/* Cultura de cada bando -> prefijo de sus piezas de 0 A.D. (los que no figuran conservan las casitas) */
const CULTURA = { cartago: 'cart', epiro: 'grie', macedonia: 'grie', aquea: 'grie', siracusa: 'grie', akragas: 'grie', griegos: 'grie', galos: 'galo', iberos: 'iber' };
const CENTRO = { cart: 'cart_templo', grie: 'grie_templo', galo: 'galo_centro', iber: 'iber_centro', roma: 'vesta' };
const claveCentro = dueno => CENTRO[dueno === 'roma' ? 'roma' : CULTURA[dueno]] || null;
const claveBarco = dueno => (CULTURA[dueno] === 'cart' || CULTURA[dueno] === 'grie') ? CULTURA[dueno] + '_trirreme' : 'trirreme';

export class MapView3D {
  constructor(host, opts) {
    this.host = host; this.opts = opts || {};
    this.r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.1;
    this.cv = this.r.domElement; this.cv.className = 'gl'; host.insertBefore(this.cv, host.firstChild);
    this.labels = document.createElement('div'); this.labels.className = 'mlabels'; host.insertBefore(this.labels, this.cv.nextSibling);
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(40, 1, 0.5, 600);
    const p = G.pos('roma'); this.c = { x: p[0] * K, z: p[1] * K, dist: 46, pitch: 0.95 };
    this.esc = { zona: null, pila: [], anim: null, zEls: {}, clave: '' };   // C6: escalón actual, pila de «volver» y animación de cámara
    this.migas = document.createElement('div'); this.migas.className = 'mmigas'; host.insertBefore(this.migas, this.labels.nextSibling);
    this.migas.addEventListener('click', ev => { if (ev.target.closest('[data-volver]')) { ev.stopPropagation(); this.volver(); } });
    this.build(); this.bind(); this.resize(); this.armies = new Map(); this.t = 0; this.last = performance.now();
  }

  build() {
    const sc = this.scene;
    sc.background = new THREE.Color('#0d1a26'); sc.fog = new THREE.Fog('#27455c', 90, 260);
    sc.add(new THREE.HemisphereLight('#eaf2ff', '#5a4a30', 1.2));
    const sun = new THREE.DirectionalLight('#fff1d6', 2.4); sun.position.set(-60, 90, 40); sc.add(sun);
    // --- máscara de tierra y distancia a la costa ---
    const land = new Uint8Array((NX + 1) * (NZ + 1)), polys = COSTA;          // costa: Natural Earth 50m, recortada y simplificada
    const lonOf = i => i * CW / K / 50 - 7, latOf = j => 47 - j * CH / K / 64;
    // relleno por líneas: para cada fila, cruces con los lados de la costa y tramos de tierra entre pares
    for (let j = 0; j <= NZ; j++) {
      const la = latOf(j), xs = [];
      for (const p of polys) for (let q = 0, n = p.length; q < n; q++) { const a = p[q], b = p[(q + 1) % n]; if ((a[1] > la) !== (b[1] > la)) xs.push((b[0] - a[0]) * (la - a[1]) / (b[1] - a[1]) + a[0]); }
      xs.sort((u, v) => u - v);
      for (let q = 0; q + 1 < xs.length; q += 2) { const i0 = Math.max(0, Math.ceil((xs[q] + 7) * 50 * K / CW)), i1 = Math.min(NX, Math.floor((xs[q + 1] + 7) * 50 * K / CW)); for (let i = i0; i <= i1; i++) land[j * (NX + 1) + i] = 1; }
    }
    const dist = new Float32Array(land.length), W1 = NX + 1;
    for (let k = 0; k < land.length; k++) dist[k] = 99;
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * W1 + i, me = land[k]; if ((i > 0 && land[k - 1] !== me) || (i < NX && land[k + 1] !== me) || (j > 0 && land[k - W1] !== me) || (j < NZ && land[k + W1] !== me)) dist[k] = 0.5; }
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * W1 + i; if (i > 0) dist[k] = Math.min(dist[k], dist[k - 1] + 1); if (j > 0) dist[k] = Math.min(dist[k], dist[k - W1] + 1); if (i > 0 && j > 0) dist[k] = Math.min(dist[k], dist[k - W1 - 1] + 1.4); if (i < NX && j > 0) dist[k] = Math.min(dist[k], dist[k - W1 + 1] + 1.4); }
      for (let j = NZ; j >= 0; j--) for (let i = NX; i >= 0; i--) { const k = j * W1 + i; if (i < NX) dist[k] = Math.min(dist[k], dist[k + 1] + 1); if (j < NZ) dist[k] = Math.min(dist[k], dist[k + W1] + 1); if (i < NX && j < NZ) dist[k] = Math.min(dist[k], dist[k + W1 + 1] + 1.4); if (i > 0 && j < NZ) dist[k] = Math.min(dist[k], dist[k + W1 - 1] + 1.4); }
    }
    // distancia exacta a la costa cerca del litoral (costa suave en vez de escalonada)
    const segs = []; for (const p of polys) for (let q = 0; q < p.length; q++) { const a = p[q], b = p[(q + 1) % p.length]; if ((a[0] === b[0] && (a[0] <= -7 || a[0] >= 25)) || (a[1] === b[1] && (a[1] >= 47 || a[1] <= 34.5))) continue; segs.push([a[0], a[1] * 1.28, b[0], b[1] * 1.28]); }
    const cellDeg = CW / K / 50;
    const BK = 0.5, bucket = new Map(), bkey = (u, v) => u * 1000 + v;                 // segmentos en casillas de 0,5° para no recorrerlos todos
    for (const sg of segs) { const u0 = Math.floor((Math.min(sg[0], sg[2]) - 0.3) / BK), u1 = Math.floor((Math.max(sg[0], sg[2]) + 0.3) / BK), v0 = Math.floor((Math.min(sg[1], sg[3]) - 0.3) / BK), v1 = Math.floor((Math.max(sg[1], sg[3]) + 0.3) / BK); for (let u = u0; u <= u1; u++) for (let v = v0; v <= v1; v++) { const kk = bkey(u, v); (bucket.get(kk) || bucket.set(kk, []).get(kk)).push(sg); } }
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * W1 + i; if (dist[k] > 3.2) continue; const lo = lonOf(i), la = latOf(j) * 1.28, near = bucket.get(bkey(Math.floor(lo / BK), Math.floor(la / BK))); let best = 9; if (near) for (const sgm of near) { const dd = segDist(lo, la, [sgm[0], sgm[1]], [sgm[2], sgm[3]]); if (dd < best) best = dd; } dist[k] = Math.min(dist[k] + 0.5, best / cellDeg); }
    // --- alturas ---
    const H = this.H = new Float32Array(land.length), metros = ALTURAS.metros(), cities = Object.keys(D.CITIES).map(id => [D.CITIES[id].lon, D.CITIES[id].lat]);
    const sua = t => t * t * (3 - 2 * t);
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const k = j * W1 + i, lo = lonOf(i), la = latOf(j), d = dist[k];
      if (!land[k]) { H[k] = -Math.min(d, 10) * 0.085; continue; }                  // mar: fondo suave, nunca bajo -0,85
      const n2 = Math.sin(lo * 9.7 + la * 4.1) * Math.cos(la * 11.3 - lo * 3.3), hm = Math.max(0, metros[k]) * ESCALA_V * realce(lo, la);
      // tierra: suelo mínimo con playa suave (solo a menos de 2,5 casillas de la costa) y altura real por encima, que sube con la distancia a la orilla
      H[k] = 0.05 + Math.min(d, 2.5) * 0.026 + hm * (0.4 + 0.6 * sua(Math.max(0, Math.min(1, (d - 0.5) / 2)))) + n2 * 0.035 * (0.3 + hm) * Math.min(1, d / 3);
    }
    // aplanado bajo cada ciudad a su altura local (media de la tierra en torno a ella), no a una cota fija
    for (const c of cities) {
      const ci = Math.round((c[0] + 7) / (CW / K / 50)), cj = Math.round((47 - c[1]) / (CH / K / 64)); let s0 = 0, n0 = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const i = ci + a, j = cj + b; if (i >= 0 && i <= NX && j >= 0 && j <= NZ && land[j * W1 + i]) { s0 += H[j * W1 + i]; n0++; } }
      const hc = Math.max(0.1, n0 ? s0 / n0 : 0.1);
      for (let j = Math.max(0, cj - 8); j <= Math.min(NZ, cj + 8); j++) for (let i = Math.max(0, ci - 8); i <= Math.min(NX, ci + 8); i++) {
        const k = j * W1 + i; if (!land[k]) continue; const cd = Math.hypot(lonOf(i) - c[0], (latOf(j) - c[1]) * 1.28);
        if (cd < 0.5) { const t = (cd / 0.5) * (cd / 0.5); H[k] = hc + (H[k] - hc) * t; }
      }
    }
    this.metros = metros;
    // --- malla del terreno ---
    const g = new THREE.PlaneGeometry(D.WORLD.w * K, D.WORLD.h * K, NX, NZ); g.rotateX(-Math.PI / 2); g.translate(D.WORLD.w * K / 2, 0, D.WORLD.h * K / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), aT = new Float32Array(pos.count * 2), c = new THREE.Color();
    const cSand = new THREE.Color('#d9c48e'), cGrass = new THREE.Color('#7f9a4a'), cDry = new THREE.Color('#b3a25e'), cForest = new THREE.Color('#4f7438'), cRock = new THREE.Color('#8b7d66'), cSnow = new THREE.Color('#f4f4f0'), cBed = new THREE.Color('#c9b98a'), cDeep = new THREE.Color('#2b4a5e');
    for (let k = 0; k < pos.count; k++) {
      const i = k % W1, j = Math.floor(k / W1), h = H[k], la = latOf(j), lo = lonOf(i); pos.setY(k, h);
      if (!land[k]) c.copy(cSand).lerp(cBed, Math.min(1, -h / 0.12)).lerp(cDeep, Math.min(1, -h / 0.55));
      else {
        const dry = Math.max(0, Math.min(1, (39.5 - la) / 4 + (lo < 0 ? 0.35 : 0))), f = 0.5 + 0.5 * Math.sin(lo * 5.3 + la * 7.1);
        c.copy(cGrass).lerp(cForest, f * (1 - dry) * 0.7).lerp(cDry, dry * 0.85);
        if (dist[k] < 1.6) c.lerp(cSand, 1 - dist[k] / 1.6);
        if (h > 0.9) c.lerp(cRock, Math.min(1, (h - 0.9) / 0.9)); if (h > 2.3) c.lerp(cSnow, Math.min(1, (h - 2.3) / 0.6));
        c.multiplyScalar(0.92 + hash(k) * 0.16);
        aT[k * 2] = dry; aT[k * 2 + 1] = (1 - Math.min(1, Math.max(0, (h - 1.2) / 1.0))) * Math.min(1, dist[k] / 0.9);   // textura: más seca / fuerza (menos en roca, nieve y orilla)
      }
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 2)); g.computeVertexNormals();
    this.terr = mapaMaterial(); sc.add(new THREE.Mesh(g, this.terr));
    // --- mar ---
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), mar(dist, land));
    sea.rotation.x = -Math.PI / 2; sea.position.set(80, 0, 40); sc.add(sea);
    const out = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), new THREE.MeshBasicMaterial({ color: '#1d4a66' })); out.rotation.x = -Math.PI / 2; out.position.set(80, -0.9, 40); sc.add(out);
    // --- bosques ---
    const tg = new THREE.ConeGeometry(0.16, 0.5, 5); tg.translate(0, 0.25, 0);
    const trees = new THREE.InstancedMesh(tg, new THREE.MeshLambertMaterial({ color: '#3f6a30', flatShading: true }), 2600), M = new THREE.Matrix4(); let tn = 0;
    for (let q = 0; q < 14000 && tn < 2600; q++) {
      const i = Math.floor(hash(q * 1.3) * NX), j = Math.floor(hash(q * 2.7 + 5) * NZ), k = j * W1 + i;
      if (!land[k] || dist[k] < 2 || metros[k] > ARBOL_MAX || latOf(j) < 37.5 - hash(q) * 2) continue;
      if (Math.sin(lonOf(i) * 5.3 + latOf(j) * 7.1) < 0.1) continue;
      const s = 0.7 + hash(q * 9.1) * 0.8; M.makeScale(s, s, s); { const tx = i * CW + (hash(q * 4.4) - 0.5) * CW, tz = j * CH + (hash(q * 6.6) - 0.5) * CH; M.setPosition(tx, this.hAt(tx, tz) - 0.02, tz); } trees.setMatrixAt(tn++, M);
    }
    trees.count = tn; sc.add(trees);
    // --- rutas ---
    this.aristas = [];
    for (const e of D.EDGES) {
      const pts = trazo(this, G.pos(e[0]), G.pos(e[1]), 0.08);
      const geo = new THREE.BufferGeometry().setFromPoints(pts), line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: e[2] ? '#e8f6ff' : '#5a3418', dashSize: e[2] ? 0.35 : 0.6, gapSize: e[2] ? 0.5 : 0.3, transparent: true, opacity: e[2] ? 0.55 : 0.85 }));
      line.computeLineDistances(); sc.add(line); this.aristas.push({ a: e[0], b: e[1], line: line });
    }
    // --- ciudades ---
    this.cities = {};
    for (const id in D.CITIES) {
      const d = D.CITIES[id], p = G.pos(id), x = p[0] * K, z = p[1] * K, grp = new THREE.Group(), s = id === 'roma' || id === 'carthago' ? 1.5 : 0.95 + d.w * 0.09;
      const stone = new THREE.MeshLambertMaterial({ color: '#cfc3a6', flatShading: true }), roof = new THREE.MeshLambertMaterial({ color: '#b5522f', flatShading: true }), plaster = new THREE.MeshLambertMaterial({ color: '#efe5cc', flatShading: true });
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.1, 0.32, 14, 1, true), stone); wall.material.side = THREE.DoubleSide; wall.position.y = 0.16; grp.add(wall);
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, t = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.52, 0.24), stone); t.position.set(Math.cos(a) * 1.07, 0.26, Math.sin(a) * 1.07); grp.add(t); }
      const casas = [];
      for (let i = 0; i < 5 + d.w * 2; i++) {
        const a = hash(i * 3.1 + d.lon) * 6.283, rr = hash(i * 7.7 + d.lat) * 0.78, w = 0.22 + hash(i * 1.3) * 0.2, hh = 0.2 + hash(i * 5.9) * 0.28;
        const bx = new THREE.Mesh(new THREE.BoxGeometry(w, hh, w), plaster); bx.position.set(Math.cos(a) * rr, hh / 2, Math.sin(a) * rr); grp.add(bx); casas.push(bx);
        const rf = new THREE.Mesh(new THREE.ConeGeometry(w * 0.8, 0.16, 4), roof); rf.rotation.y = Math.PI / 4; rf.position.set(Math.cos(a) * rr, hh + 0.08, Math.sin(a) * rr); grp.add(rf); casas.push(rf);
      }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.3, 5), new THREE.MeshLambertMaterial({ color: '#3a2a1a' })); pole.position.y = 1.15; grp.add(pole);
      const fm = new THREE.MeshLambertMaterial({ color: '#fff', side: THREE.DoubleSide }), flag = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.6), fm); flag.position.set(0.5, 1.95, 0); grp.add(flag); grp.userData.pole = pole;
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.6, 28), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, opacity: 0.85, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; ring.visible = false; grp.add(ring);
      grp.scale.setScalar(s); grp.position.set(x, Math.max(0.05, this.hAt(x, z)), z); sc.add(grp);
      const el = document.createElement('button'); el.className = 'mlabel'; el.innerHTML = '<i></i><span>' + d.n + '</span><em></em>';
      el.addEventListener('click', ev => { ev.stopPropagation(); if (this.opts.onSelect) this.opts.onSelect(id); });
      this.labels.appendChild(el);
      this.cities[id] = { casas: casas, pole: pole, flag: fm, flagMesh: flag, centro: null, quiere: null, grp: grp, ring: ring, el: el, dot: el.querySelector('i'), em: el.querySelector('em'), owner: null, x: x, z: z, top: 2.6 * s };
    }
  }

  /* Edificio real de la cultura del dueño en el centro de la ciudad; si aún no cargó el modelo, quedan las casitas y se reintenta */
  ponerCentro(c) {
    const clave = c.quiere, st = clave && getStatic(clave);
    if (clave && !st) return;
    if (c.centro) { c.grp.remove(c.centro); c.centro = null; }
    const m = clave && staticMesh(clave, D.FACTIONS[c.owner].col);
    if (m) {
      const b = st.bb, k = 1.5 / Math.max(b[3] - b[0], b[5] - b[2], 1), cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
      m.scale.setScalar(k); m.position.set(-cx * k, Math.max(0, -b[1] * k), -cz * k); c.grp.add(m); c.centro = m;
    }
    for (const q of c.casas) q.visible = !m;
    c.pole.position.set(m ? 0.8 : 0, 1.15, m ? 0.8 : 0); c.flagMesh.position.set(m ? 1.3 : 0.5, 1.95, m ? 0.8 : 0);
    c.puesto = c.quiere;
  }

  /* altura bilineal del relieve en (x, z) del mundo 3D */
  hAt(x, z) {
    const fx = Math.max(0, Math.min(NX, x / CW)), fz = Math.max(0, Math.min(NZ, z / CH)), i = Math.min(NX - 1, Math.floor(fx)), j = Math.min(NZ - 1, Math.floor(fz)), u = fx - i, v = fz - j, W1 = NX + 1, H = this.H, k = j * W1 + i;
    return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + W1] * (1 - u) + H[k + W1 + 1] * u) * v;
  }

  armyModel(m) {
    const grp = new THREE.Group(), mine = m.owner === 'roma', col = D.FACTIONS[m.owner].col, e = m.from && G.edge(m.from, m.to);
    const ship = e && e[2] ? (staticMesh(claveBarco(m.owner), col) || staticMesh('trirreme', col)) : null;                    // por mar, el ejército viaja embarcado
    if (ship) { ship.scale.setScalar(0.07); ship.position.y = -0.06; grp.add(ship); const el2 = document.createElement('div'); el2.className = 'mlabel army ' + (mine ? 'mine' : 'foe'); this.labels.appendChild(el2); this.scene.add(grp); return { grp: grp, el: el2, anims: [] }; }
    let main = mine ? 'hastati' : 'milicia', best = 0; for (const k in m.units) if (m.units[k] > best && D.UNITS[k].cls !== 'ele') { best = m.units[k]; main = k; }
    const anims = [], lead = m.hero || m.gen ? 'general' : (m.units.elefantes ? 'elefantes' : main), add = (key, x, z, s) => {
      const real = getUnit(key);
      if (real) {                                               // figura real, andando
        const g = instancedGeometry(real, 1), im = new THREE.InstancedMesh(g, unitMaterialReal(real, col), 1), k = s * UNIT_SCALE * (key === 'elefantes' ? 1.6 : 1);
        im.setMatrixAt(0, new THREE.Matrix4().makeScale(k, k, k)); im.position.set(x, 0, z); im.frustumCulled = false; im.userData.real = true; grp.add(im);
        anims.push({ a: g.attributes.aFrame, clip: real.clips.walk || real.clips.idle, ph: hash(x * 9 + z) * 3 }); return;
      }
      const g = unitGeometry(key, col).clone(); g.setAttribute('anim', new THREE.InstancedBufferAttribute(new Float32Array([1, 0, hash(x * 9 + z) * 6]), 3));
      const me = new THREE.Mesh(g, unitMaterial()); me.position.set(x, 0, z); me.scale.setScalar(s); me.frustumCulled = false; grp.add(me);
    };
    add(lead, 0, 0.35, lead === 'elefantes' ? 0.3 : 0.62); add(main, -0.5, -0.25, 0.6); add(main, 0.5, -0.25, 0.6); add(main, 0, -0.7, 0.6);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.06, 18), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 })); base.position.y = 0.03; grp.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 5), new THREE.MeshLambertMaterial({ color: '#3a2a1a' })); pole.position.set(0, 1.1, -0.3); grp.add(pole);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide })); fl.position.set(0.36, 1.95, -0.3); grp.add(fl);
    const el = document.createElement('div'); el.className = 'mlabel army ' + (mine ? 'mine' : 'foe'); this.labels.appendChild(el);
    this.scene.add(grp); return { grp: grp, el: el, anims: anims };
  }

  update(state, sel) {
    if (!this.terrOn && mapaTexturas(this.terr)) this.terrOn = true;           // las texturas llegan después de crear el mapa
    const W = this.host.clientWidth, Hh = this.host.clientHeight, v = new THREE.Vector3(), now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now; this.t += dt; uTime.value = this.t;
    const place = (el, x, y, z) => { v.set(x, y, z).project(this.cam); if (v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) { el.style.display = 'none'; return; } el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * Hh).toFixed(1) + 'px) translate(-50%,-100%)'; };
    if (this.labels.scrollLeft || this.labels.scrollTop) { this.labels.scrollLeft = 0; this.labels.scrollTop = 0; }
    this.escalon(state, dt, place);
    const mare = this.esc.mare;
    for (const id in this.cities) {
      const c = this.cities[id], st = state.cities[id];
      if (!st) { c.grp.visible = false; c.el.style.display = 'none'; continue; }   // ciudad que no es de esta región: ni modelo ni etiqueta
      c.grp.visible = true;
      if (c.owner !== st.owner) { c.owner = st.owner; c.quiere = claveCentro(st.owner); const col = D.FACTIONS[st.owner].col; c.flag.color.set(col); c.dot.style.background = col; c.el.classList.toggle('mine', st.owner === 'roma'); }
      if (c.quiere !== c.puesto) this.ponerCentro(c);
      c.ring.visible = sel === id; if (sel === id) c.ring.rotation.z = this.t * 0.8;
      const txt = (state.hero.city === id ? '🦅 ' : '') + G.men(st.units); if (c.txt !== txt) { c.txt = txt; c.em.textContent = txt; }
      c.el.classList.toggle('sel', sel === id); place(c.el, c.x, c.grp.position.y + c.top, c.z);
      if (mare) c.el.style.display = 'none';   // C6: de lejos solo se leen los nombres de zona
    }
    const ar = new Set(G.aristas().map(e => e[0] + '|' + e[1]));
    for (const e of this.aristas) e.line.visible = ar.has(e.a + '|' + e.b) && !!state.cities[e.a] && !!state.cities[e.b];
    // rutas comerciales: trazo dorado y un mercante que va y viene (una malla por ruta)
    if (!this.rutaObj) { this.rutaObj = new Map(); this.rutaMat = { oro: new THREE.LineBasicMaterial({ color: '#f2c14e' }), casco: new THREE.MeshLambertMaterial({ color: '#7a4a22', flatShading: true }), vela: new THREE.MeshLambertMaterial({ color: '#f1e6c8', side: THREE.DoubleSide, flatShading: true }), carro: new THREE.MeshLambertMaterial({ color: '#b98a3c', flatShading: true }) }; }
    const vistas = new Set();
    for (const r of (state.rutas || [])) {
      if (!state.cities[r.a] || !state.cities[r.b]) continue;
      const k = r.a + '|' + r.b; vistas.add(k); let o = this.rutaObj.get(k);
      if (!o) {
        const mar = G.rutaMar(r), pa = G.pos(r.a), pb = G.pos(r.b), pts = trazo(this, pa, pb, 0.11);
        const linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), this.rutaMat.oro), g = new THREE.Group();
        if (mar) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.9), this.rutaMat.casco); c.position.y = 0.1; const v = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), this.rutaMat.vela); v.position.y = 0.55; v.rotation.y = Math.PI / 2; g.add(c, v); }
        else { const c = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.55), this.rutaMat.carro); c.position.y = 0.2; const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.3), this.rutaMat.vela); b.position.y = 0.38; g.add(c, b); }
        this.scene.add(linea, g); o = { linea: linea, g: g, pa: pa, pb: pb, ph: (r.a.length + r.b.length) * 0.37 }; this.rutaObj.set(k, o);
      }
      const u = (this.t * 0.06 + o.ph) % 2, f = u < 1 ? u : 2 - u, x = (o.pa[0] + (o.pb[0] - o.pa[0]) * f) * K, z = (o.pa[1] + (o.pb[1] - o.pa[1]) * f) * K;
      o.g.position.set(x, Math.max(0.04, this.hAt(x, z)) + 0.05, z); o.g.rotation.y = Math.atan2(o.pb[0] - o.pa[0], o.pb[1] - o.pa[1]) + (u < 1 ? 0 : Math.PI);
    }
    for (const [k, o] of this.rutaObj) if (!vistas.has(k)) { this.scene.remove(o.linea, o.g); o.linea.geometry.dispose(); o.g.traverse(m => { if (m.geometry) m.geometry.dispose(); }); this.rutaObj.delete(k); }
    const seen = new Set();
    for (const m of state.marches) {
      if (!state.cities[m.to] || (m.from && !state.cities[m.from])) continue;
      seen.add(m.id); let a = this.armies.get(m.id); if (!a) { a = this.armyModel(m); this.armies.set(m.id, a); }
      const p0 = m.fromXY || G.pos(m.from), p1 = G.pos(m.to), f = Math.max(0, Math.min(1, (state.t - m.t0) / (m.t1 - m.t0))), x = (p0[0] + (p1[0] - p0[0]) * f) * K, z = (p0[1] + (p1[1] - p0[1]) * f) * K, y = Math.max(0.04, this.hAt(x, z));
      a.grp.position.set(x, y, z); a.grp.rotation.y = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]);
      for (const an of a.anims) { an.a.array[0] = frameOf(an.clip, this.t + an.ph); an.a.needsUpdate = true; }
      const txt = (m.owner === 'roma' ? '' : (m.label || D.FACTIONS[m.owner].n) + ' · ') + G.men(m.units); if (a.txt !== txt) { a.txt = txt; a.el.textContent = txt; }
      place(a.el, x, y + 2.7, z);
    }
    for (const [id, a] of this.armies) if (!seen.has(id)) { this.scene.remove(a.grp); a.grp.traverse(o => { if (o.geometry && !o.userData.real) o.geometry.dispose(); }); a.el.remove(); this.armies.delete(id); }
    const c = this.c, cp = Math.cos(c.pitch);
    this.scene.fog.near = Math.max(90, c.dist * 0.6); this.scene.fog.far = Math.max(260, c.dist * 1.75);   // C6: a más distancia, más bruma lejana
    this.cam.position.set(c.x, Math.sin(c.pitch) * c.dist, c.z + cp * c.dist); this.cam.lookAt(c.x, 0, c.z);
    this.r.render(this.scene, this.cam);
  }

  /* C6 · Escalones del mapa. Mare Nostrum (cámara lejos): solo nombres de zona. Zona: la cámara se acerca a sus ciudades y salen
     las etiquetas normales. «volver» restaura el encuadre guardado en la pila. Solo en la campaña del Mediterráneo (I6 no se toca). */
  zonaCiudades(z, state) { return D.ZONAS[z].ciudades.filter(id => state.cities[id] && this.cities[id]); }
  entrarZona(z) {
    const st = this.esc; if (!G.state || !D.ZONAS[z]) return;
    const ids = this.zonaCiudades(z, G.state); if (!ids.length) return;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const id of ids) { const c = this.cities[id]; x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); z0 = Math.min(z0, c.z); z1 = Math.max(z1, c.z); }
    const c = this.c, dist = Math.max(24, Math.min(MARE_DIST - 8, Math.max((x1 - x0) * 3.3 + 12, (z1 - z0) * 2 + 12)));
    st.pila.push({ x: c.x, z: c.z, dist: c.dist, pitch: c.pitch, zona: st.zona }); st.zona = z;
    st.anim = { d: 0.6, de: { x: c.x, z: c.z, dist: c.dist }, a: { x: (x0 + x1) / 2, z: (z0 + z1) / 2, dist: dist } };
  }
  volver() {
    const st = this.esc, g = st.pila.pop(); if (!g) return; const c = this.c;
    st.zona = g.zona; st.anim = { d: 0.6, de: { x: c.x, z: c.z, dist: c.dist }, a: { x: g.x, z: g.z, dist: g.dist } };
  }
  escalon(state, dt, place) {
    const st = this.esc, c = this.c, med = G.regionId() === 'mediterraneo';
    if (st.anim) {
      const a = st.anim; if (a.t0 === undefined) a.t0 = performance.now(); const u = Math.min(1, (performance.now() - a.t0) / 1000 / a.d), e = u * u * (3 - 2 * u);
      c.x = a.de.x + (a.a.x - a.de.x) * e; c.z = a.de.z + (a.a.z - a.de.z) * e; c.dist = a.de.dist + (a.a.dist - a.de.dist) * e; this.clamp();
      if (u >= 1) st.anim = null;
    } else if (st.zona && c.dist >= MARE_DIST) { st.zona = null; st.pila = []; }   // se aleja a mano: vuelve a Mare Nostrum
    st.mare = med && !st.zona && c.dist >= MARE_DIST && !st.anim;
    const clave = med ? (st.zona || '') + '|' + st.pila.length : '-';
    if (clave !== st.clave) {
      st.clave = clave;
      this.migas.style.display = med ? '' : 'none';
      this.migas.innerHTML = '<span class="mm-t">Mare Nostrum</span>' + (st.zona ? '<span class="mm-s">›</span><span class="mm-t">' + D.ZONAS[st.zona].n + '</span><button type="button" data-volver>← volver</button>' : '');
    }
    for (const z in D.ZONAS) {
      let el = st.zEls[z];
      if (!el) { el = st.zEls[z] = document.createElement('button'); el.type = 'button'; el.className = 'mlabel zona'; el.textContent = D.ZONAS[z].n; el.addEventListener('click', ev => { ev.stopPropagation(); this.entrarZona(z); }); this.labels.appendChild(el); }
      const ids = med && st.mare ? this.zonaCiudades(z, state) : [];
      if (!ids.length) { el.style.display = 'none'; continue; }
      let x = 0, zz = 0; for (const id of ids) { x += this.cities[id].x; zz += this.cities[id].z; }
      place(el, x / ids.length, 0.3, zz / ids.length);
      const y = zz / ids.length, ancla = y < 62 ? '-100%' : '0%';   // las del norte cuelgan hacia arriba y las del sur hacia abajo, para no pisarse
      el.style.transform = el.style.transform.replace('translate(-50%,-100%)', 'translate(-50%,' + ancla + ')');
    }
    // los nombres no se pisan: si dos se solapan en pantalla, el de abajo baja lo justo
    const vis = Object.values(st.zEls).filter(e => e.style.display !== 'none').map(e => ({ e: e, r: e.getBoundingClientRect() })).sort((p, q) => p.r.top - q.r.top), hechos = [];
    for (const o of vis) { let dy = 0; for (const q of hechos) if (o.r.left < q.right && o.r.right > q.left && o.r.top + dy < q.bottom && o.r.bottom + dy > q.top) dy = q.bottom - o.r.top + 3; if (dy) o.e.style.transform += ' translateY(' + dy.toFixed(0) + 'px)'; hechos.push({ left: o.r.left, right: o.r.right, top: o.r.top + dy, bottom: o.r.bottom + dy }); }
    // y no se salen por los lados ni quedan bajo los botones de zoom de la derecha
    const caja = this.labels.getBoundingClientRect(), izq = caja.left + 6, der = caja.right - 62;
    for (const o of vis) { const r = o.e.getBoundingClientRect(); let dx = 0; if (r.left < izq) dx = izq - r.left; else if (r.right > der) dx = der - r.right; if (dx) o.e.style.transform += ' translateX(' + dx.toFixed(0) + 'px)'; }
  }

  /* Centra y acerca la cámara según la ficha de la región (lon, lat, zoom) */
  encuadre() { const r = G.region(), cm = r && r.camara; if (!cm) return; const p = D.proj(cm.lon, cm.lat); this.c.x = p[0] * K; this.c.z = p[1] * K; this.c.dist = 46 * (cm.zoom || 1); this.clamp(); }
  center(id) { const p = G.pos(id); this.c.x = p[0] * K; this.c.z = p[1] * K; this.clamp(); }
  zoom(f) { this.c.dist /= f; this.clamp(); }
  clamp() { const c = this.c; c.dist = Math.max(14, Math.min(330, c.dist)); c.pitch = 0.62 + Math.min(1, (c.dist - 14) / 110) * 0.6; c.x = Math.max(4, Math.min(156, c.x)); c.z = Math.max(4, Math.min(80, c.z)); }
  bind() {
    const P = new Map(), cv = this.cv; let st = null;
    cv.addEventListener('pointerdown', e => { this.esc.anim = null; cv.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); if (P.size === 1) st = { mv: 0, d: 0 }; else if (st) { st.mv = 99; st.d = 0; } });
    cv.addEventListener('pointermove', e => {
      if (!P.has(e.pointerId)) return; const pr = P.get(e.pointerId), dx = e.clientX - pr[0], dy = e.clientY - pr[1]; P.set(e.pointerId, [e.clientX, e.clientY]);
      if (P.size === 1 && st) { st.mv += Math.abs(dx) + Math.abs(dy); const k = this.c.dist * 0.0019; this.c.x -= dx * k; this.c.z -= dy * k * 1.25; }
      else if (P.size === 2 && st) { const v = [...P.values()], d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]); if (st.d) this.c.dist *= st.d / d; st.d = d; }
      this.clamp();
    });
    const up = e => {
      if (!P.has(e.pointerId)) return; P.delete(e.pointerId);
      if (st && st.mv < 10 && e.type === 'pointerup' && !P.size) {
        const rc = cv.getBoundingClientRect(), ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1), this.cam);
        const o = ray.ray.origin, d = ray.ray.direction, k = (0.3 - o.y) / d.y, x = o.x + d.x * k, z = o.z + d.z * k; let best = null, bd = 2.6;
        for (const id in this.cities) { const c = this.cities[id], dd = Math.hypot(c.x - x, c.z - z); if (dd < bd) { bd = dd; best = id; } }
        if (this.opts.onSelect) this.opts.onSelect(best);
      }
      if (!P.size) st = null; else if (st) st.d = 0;
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { this.c.dist *= e.deltaY > 0 ? 1.1 : 0.9; this.clamp(); e.preventDefault(); }, { passive: false });
  }
  resize() { const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.fov = w < h ? 50 : 36; this.cam.updateProjectionMatrix(); }
}
