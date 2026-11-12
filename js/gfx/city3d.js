/* AQVILA — vista 3D de la ciudad: cada edificio del juego es un modelo real que aparece al construirlo.
   Q1d: el edificio se asienta en un relieve real (lomas, vaguada, río, cielo y montes de la maqueta aprobada, js/gfx/mundo.js y ground.js),
   con luz de sol con sombras calculadas una vez y bruma. El mundo de la maqueta va desplazado (−OX, −OZ): el recinto del juego conserva sus
   coordenadas locales y alt(x, z) da la altura del terreno en ellas. */
import { THREE } from './models.js';
import { getStatic, staticMesh, staticInstances } from './statics.js';
import { texturaRuido, texturasMundo, crearSuelo, crearRio, crearPuente, crearCielo } from './ground.js';
import { getUnit, unitMaterialReal, instancedGeometry, frameOf } from './units.js';
import { OX, OZ, alt as A, generarCampo, puertoMundo, distRio, NIVEL_RIO } from './mundo.js';

// puntos por los que pasean los ciudadanos (calles y plazas)
const WAY = [[0, 70], [0, 40], [0, 8], [0, -30], [0, -70], [40, 0], [80, 0], [-40, 0], [-80, 0], [-20, -12], [-50, -14], [30, -14], [50, 20], [-40, 22], [0, 100], [0, -100]];

const D = window.DATA;
/* Trazado de colonia romana: recinto rectangular, cuatro puertas, cardo (N-S) y decumano (E-O) que se cruzan en el foro,
   manzanas de ínsulas en cuadrícula. Los edificios de materiales están fuera, junto a su recurso natural:
   aserradero al borde del bosque, cantera y mina en la ladera rocosa, granja entre sus campos, puerto en la orilla del río.
   Parcela: x, z, giro (grados). Norte = -z (el río). */
const WX = 104, WZ = 84;                      // media anchura y medio fondo del recinto amurallado
const PUER = puertoMundo();                    // el puerto va en la orilla sur del río, a ~78 del eje
const SLOTS = {
  foro: [-34, -30, 0], templo: [-76, -34, 90], mercado: [36, -32, 0], almacen: [70, -58, 180], cuartel: [64, 40, 180], establo: [-68, 44, 90], viviendas: [26, 34, 0],
  herreria: [86, -12, -90], termas: [-26, 52, 0], anfiteatro: [-80, 4, 90], acueducto: [-60, -106, 0],
  puerto: [PUER.x - OX, PUER.z - OZ, PUER.giro], aserradero: [-172, 20, 90], cantera: [176, -44, -90], mina: [182, 52, -90], granja: [-120, 150, 30]
};
const PK = 0.58;     // escala de las personas respecto a los edificios (en 0 A.D. los edificios son pequeños)
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const HORIZ = '#cdc3b2', SOL = new THREE.Vector3(-0.84, 0.49, 0.26).normalize(), CENTRO = { x: 0, z: -10 };
/* el punto más bajo bajo la huella de un edificio (centro y cuatro puntos a distancia r): así no flota en cuesta */
const suelo = (x, z, r) => Math.min(A(x, z), A(x + r, z), A(x - r, z), A(x, z + r), A(x, z - r));
/* da y recibe sombra (la sombra del sol se calcula una vez; ver sombraPend) */
function sombrear(o, dar) { o.traverse(m => { if (m.isMesh) { m.castShadow = dar !== false; m.receiveShadow = true; } }); return o; }
/* manzanas de ínsulas posibles: celdas de la cuadrícula del recinto que no estorban a ningún solar ni al foro */
const CELDAS = (() => { const cells = [];
  for (let gx = -4; gx <= 3; gx++) for (let gz = -3; gz <= 2; gz++) { const x = gx * 24 + 12 + (gx >= 0 ? 4 : -4), z = gz * 24 + 12 + (gz >= 0 ? 4 : -4); if (Math.abs(x) > WX - 14 || Math.abs(z) > WZ - 12) continue;
    let ok = true; for (const b in SLOTS) if (b !== 'viviendas' && Math.abs(x - SLOTS[b][0]) < 26 && Math.abs(z - SLOTS[b][1]) < 24) ok = false; if (x > -66 && x < 12 && z > -56 && z < -4) ok = false; if (ok) cells.push([x, z, Math.hypot(x, z) + hash(gx * 7 + gz) * 20]); }
  return cells.sort((a, b) => a[2] - b[2]); })();
const ESTACA = new THREE.CylinderGeometry(0.5, 0.5, 6, 5), MAT_ESTACA = new THREE.MeshLambertMaterial({ color: '#5a4028' });

/* Medalla de bronce sobre cada edificio: icono, nivel y, si toca, aviso de línea (obra o alerta). */
const ICO_FL = {
  obra: '<path d="M13.5 4.5l6 6-2.5 2.5-6-6zM12 8l-8 8.5 3 3L15.5 11"/>',
  alerta: '<path d="M12 4l9.5 16h-19zM12 10v4.5M12 17.2v.3"/>',
  mas: '<path d="M12 6v12M6 12h12"/>'
};
const svgM = d => '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
function medallaHtml(b, L, fl, sel) {
  const ico = (D.BUILD_ICON && D.BUILD_ICON[b]) || '';
  const nom = sel ? '<u class="mt">' + D.BUILD[b].n + '</u>' : '';
  if (L === 0) return nom + '<span class="mc">' + svgM(ICO_FL.mas) + '</span>';
  return nom + '<span class="mc">' + ico + '</span><b class="mn">' + L + '</b>' + (fl ? '<i class="mf ' + fl + '">' + svgM(ICO_FL[fl]) + '</i>' : '');
}

export class CityView3D {
  constructor(host, opts) {
    this.host = host; this.opts = opts || {};
    this.r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 0.92;
    this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap; this.r.shadowMap.autoUpdate = false;      // la sombra se calcula una vez y se pide de nuevo al reconstruir
    this.cv = this.r.domElement; this.cv.className = 'gl'; host.appendChild(this.cv);
    this.labels = document.createElement('div'); this.labels.className = 'mlabels'; host.appendChild(this.labels);
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(50, 1, 2, 20000);
    this.c = { yaw: 0.12, dist: 560, pitch: 0.46 }; this.key = ''; this.dyn = new THREE.Group(); this.els = {};
    this.tg = { x: CENTRO.x, z: CENTRO.z }; this.goal = { x: CENTRO.x, z: CENTRO.z }; this.figs = new Map(); this.cit = []; this.lastT = 0; this.sombraRep = [];
    this.build(); this.bind(); this.resize();
  }
  build() {
    const sc = this.scene, q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    sc.background = new THREE.Color(HORIZ); sc.fog = new THREE.FogExp2(HORIZ, 0.00029);
    /* luz: sol rasante desde el suroeste con sombras largas hacia la derecha, y cielo/tierra de relleno */
    const sol = this.sol = new THREE.DirectionalLight('#ffdfb4', 3.3); sol.position.set(0, 0, -60).addScaledVector(SOL, 1500); sol.target.position.set(0, 0, -60); sol.castShadow = true;
    const s = sol.shadow; s.mapSize.set(2048, 2048); s.camera.left = -430; s.camera.right = 430; s.camera.top = 430; s.camera.bottom = -430; s.camera.near = 600; s.camera.far = 2400; s.bias = -0.0006; s.normalBias = 0.5; s.radius = 2.2; s.camera.updateProjectionMatrix();
    sc.add(sol, sol.target, new THREE.HemisphereLight('#b6c6de', '#927252', 1.45));
    /* el mundo de la maqueta (suelo, río, puente, cielo y montes), desplazado para que el recinto del juego quede sobre el foro llano */
    const U = this.U = { uRuido: { value: texturaRuido() }, uTiempo: { value: 0 } }, mundo = this.mundo = new THREE.Group(); mundo.position.set(-OX, 0, -OZ);
    const campo = generarCampo(WX, WZ), deg = Math.PI / 180, ex = (x, z) => [x + OX, z + OZ];
    campo.foro = [[-62, -52], [8, -52], [8, -6], [-62, -6]].map(p => ex(p[0], p[1]));
    campo.solares = Object.entries(SLOTS).filter(e => e[0] !== 'viviendas').map(([, v]) => { const p = ex(v[0], v[1]); return { x: p[0], z: p[1], ang: v[2] * deg }; });
    campo.manzanas = CELDAS.map(c => { const p = ex(c[0], c[1]); return { x: p[0], z: p[1] }; });
    campo.canteras = [SLOTS.cantera, SLOTS.mina].map(v => { const p = ex(v[0] + 14, v[1]); return { x: p[0], z: p[1], r: 36 }; });
    campo.muelle = { x: PUER.x, z: PUER.z, rx: PUER.rx, rz: PUER.rz, nx: PUER.nx, nz: PUER.nz };
    for (let i = 0; i < 6; i++) { const cx = -175 + (i % 3) * 40, cz = 150 + Math.floor(i / 3) * 34 - (i % 3) * 18, co = Math.cos(0.5), si = Math.sin(0.5);     // campos de la granja, pintados en el suelo
      const pol = [[-17, -13], [17, -13], [17, 13], [-17, 13]].map(([u, v]) => ex(cx + u * co - v * si, cz + u * si + v * co));
      campo.parcelas.push({ pol, clase: ['rastrojo', 'huerta', 'barbecho'][i % 3], ang: 0.5, v: hash(i * 3.1), linde: 0.9 }); }
    const tx = texturasMundo();
    mundo.add(crearCielo(SOL, HORIZ, U), crearSuelo(campo, tx, U), crearRio(tx, U), crearPuente(campo.PUENTE)); sc.add(mundo);
    // bosque al oeste (junto al aserradero) y arbolado disperso, asentados en el relieve y lejos del río y del recinto
    const skip = (x, z) => distRio(x + OX, z + OZ) < 70 || (Math.abs(x) < WX + 12 && Math.abs(z) < WZ + 12);
    { const grp = new THREE.Group(), list = { cipres: [], olivo: [], pino: [], algarrobo: [] }, kinds = Object.keys(list);
      const tree = (x, z, k, sc2) => skip(x, z) ? 0 : list[k].push(new THREE.Matrix4().compose(new THREE.Vector3(x, A(x, z) - 0.2, z), q.setFromAxisAngle(up, hash(x + z) * 6.283), new THREE.Vector3(sc2, sc2, sc2)));
      for (let i = 0; i < 110; i++) { const x = -190 - hash(i * 1.7) * 170, z = -100 + hash(i * 3.3) * 250; tree(x, z, i % 6 === 0 ? 'pino' : i % 2 ? 'algarrobo' : 'cipres', 1.2 + hash(i * 7.1) * 0.9); }   // pocos pinos: son el modelo más pesado
      for (let i = 0; i < 90; i++) { const a = hash(i * 1.9) * 6.283, d = 150 + hash(i * 4.3) * 330, x = Math.cos(a) * d, z = Math.sin(a) * d; if (z < -112 || x < -170 || (x > 140 && x < 240) || (Math.abs(x) < 14) || (Math.abs(z) < 14) || (x < -70 && z > 110)) continue; tree(x, z, kinds[Math.floor(hash(i * 9.9) * 3)], 1.1 + hash(i * 7.1) * 0.8); }
      for (const k of kinds) { const t = staticInstances(k, list[k]); if (t) grp.add(t); } sombrear(grp); sc.add(grp); this.trees = grp; }
    // peñas de la cantera y bocamina
    const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: '#a39c8f', flatShading: true }), 70), M = new THREE.Matrix4();
    for (let i = 0; i < 70; i++) { const x = 190 + hash(i * 2.3) * 60, z = -100 + hash(i * 5.9) * 190, s2 = 2 + hash(i * 3.7) * 7; M.compose(new THREE.Vector3(x, A(x, z) + s2 * 0.2, z), q.setFromAxisAngle(up, hash(i) * 6), new THREE.Vector3(s2, s2 * 0.7, s2)); rk.setMatrixAt(i, M); }
    rk.frustumCulled = false; sombrear(rk); sc.add(rk);
    const wood = new THREE.MeshLambertMaterial({ color: '#5a4028' }), dark = new THREE.MeshBasicMaterial({ color: '#0c0906' });
    const adit = new THREE.Group(); for (const [w, h, d, x, y, z, m] of [[7, 8, 3, 0, 4, 0, dark], [1.2, 9, 1.2, -4, 4.5, 1.6, wood], [1.2, 9, 1.2, 4, 4.5, 1.6, wood], [10, 1.2, 1.4, 0, 9, 1.6, wood]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); adit.add(b); }
    adit.position.set(205, A(205, 52) - 0.5, 52); adit.rotation.y = -Math.PI / 2; adit.userData.adit = true; adit.visible = false; sc.add(adit);
    sc.add(this.dyn);
    // anillo de selección: va en un grupo que se inclina según la pendiente
    this.ringG = new THREE.Group(); this.ring = new THREE.Mesh(new THREE.RingGeometry(18, 20.5, 40), new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: 0.9, depthWrite: false })); this.ring.rotation.x = -Math.PI / 2; this.ringG.add(this.ring); this.ringG.visible = false; sc.add(this.ringG);
    this.armyEl = document.createElement('button'); this.armyEl.className = 'mlabel cityb army2'; this.armyEl.addEventListener('click', ev => { ev.stopPropagation(); this.goal = { x: 60, z: WZ + 40 }; if (this.c.dist > 150) this.c.dist = 110; if (this.opts.onArmy) this.opts.onArmy(); }); this.labels.appendChild(this.armyEl);
    for (const b in D.BUILD) { const el = document.createElement('button'); el.className = 'mlabel cityb medalla'; el.addEventListener('click', ev => { ev.stopPropagation(); if (this.opts.onPick) this.opts.onPick(b); }); this.labels.appendChild(el); this.els[b] = el; }
  }

  /* figuras reales (ciudadanos y guarnición): una malla instanciada por tipo */
  fig(key, cap) {
    let e = this.figs.get(key); if (e) return e; const u = getUnit(key); if (!u) return null;
    const g = instancedGeometry(u, cap), m = new THREE.InstancedMesh(g, unitMaterialReal(u, D.FACTIONS.roma.col), cap); m.frustumCulled = false; m.count = 0; this.scene.add(m);
    e = { m: m, M: m.instanceMatrix.array, a: g.attributes.aFrame.array, cap: cap, i: 0, u: u }; this.figs.set(key, e); return e;
  }
  put(e, x, z, yaw, clip, t) {
    if (!e || e.i >= e.cap) return; const M = e.M, o = e.i * 16, c = Math.cos(yaw) * PK, s = Math.sin(yaw) * PK;
    M[o] = c; M[o + 1] = 0; M[o + 2] = -s; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = PK; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = s; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = A(x, z) + 0.1; M[o + 14] = z; M[o + 15] = 1;
    e.a[e.i] = frameOf(clip, t); e.i++;
  }
  people(city, t) {
    const dt = Math.min(0.1, Math.max(0, t - this.lastT)); this.lastT = t;
    for (const e of this.figs.values()) e.i = 0;
    // ciudadanos por las calles, según la población
    const n = Math.max(6, Math.min(70, Math.floor((city.pop || 0) / 12)));
    while (this.cit.length < n) { const w = WAY[Math.floor(Math.random() * WAY.length)]; this.cit.push({ x: w[0] + (Math.random() - 0.5) * 10, z: w[1] + (Math.random() - 0.5) * 10, tx: w[0], tz: w[1], wait: Math.random() * 4, yaw: 0, k: this.cit.length % 6 === 5 ? 'sacerdote' : 'ciudadana', ph: Math.random() * 5 }); }
    this.cit.length = n;
    for (const p of this.cit) {
      const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz), e = this.fig(p.k, 80); if (!e) continue;
      if (p.wait > 0) { p.wait -= dt; this.put(e, p.x, p.z, p.yaw, e.u.clips.idle, t + p.ph); continue; }
      if (d < 1.5) { const w = WAY[Math.floor(Math.random() * WAY.length)]; p.tx = w[0] + (Math.random() - 0.5) * 12; p.tz = w[1] + (Math.random() - 0.5) * 12; p.wait = Math.random() < 0.4 ? 1 + Math.random() * 5 : 0; continue; }
      const st = Math.min(d, 2.6 * dt); p.x += dx / d * st; p.z += dz / d * st; p.yaw = Math.atan2(dx, dz); this.put(e, p.x, p.z, p.yaw, e.u.clips.walk, t + p.ph);
    }
    // guarnición formada ante la puerta: se ve de un vistazo el tamaño del ejército
    let men = 0; for (const k in city.units) men += city.units[k]; this.men = men;
    const ratio = Math.max(1, men / 420), blocks = []; let width = 0;
    for (const k in city.units) { const cls = D.UNITS[k].cls, cnt = city.units[k]; if (cnt <= 0 || !getUnit(k)) continue; const f = cls === 'ele' ? Math.min(cnt, 20) : Math.max(1, Math.round(cnt / ratio)), sp = (cls === 'ele' ? 11 : cls === 'cav' ? 5.6 : 2.9) * PK, cols = cls === 'ele' ? 5 : cls === 'cav' ? 8 : 10; blocks.push({ k: k, f: f, sp: sp, cols: cols, w: Math.min(cols, f) * sp }); width += Math.min(cols, f) * sp + 8; }
    let x0 = -width / 2 + 4;
    for (const B of blocks) { const e = this.fig(B.k, B.cols === 10 ? 430 : 120);
      for (let j = 0; j < B.f; j++) { const cx = j % B.cols, cy = Math.floor(j / B.cols); this.put(e, 60 + x0 + cx * B.sp + (hash(j * 3.1) - 0.5) * 0.5, WZ + 26 + cy * B.sp * 1.1 + (hash(j * 7.7) - 0.5) * 0.5, 0, e && e.u.clips.idle, t + hash(j * 1.9 + B.cols) * 6); }
      x0 += B.w + 8; }
    for (const e of this.figs.values()) { e.m.count = e.i; e.m.instanceMatrix.needsUpdate = true; e.m.geometry.attributes.aFrame.needsUpdate = true; }
  }

  /* reconstruye los edificios cuando cambia la ciudad o sus niveles */
  sync(city, id) {
    const key = id + JSON.stringify(city.b) + (city.queue ? city.queue.b : ''), coast = !!D.CITIES[id].sea; this.coast = coast;
    if (key === this.key) return; this.key = key; this.pedirSombra = true;
    while (this.dyn.children.length) this.dyn.remove(this.dyn.children[0]);
    const col = D.FACTIONS.roma.col, deg = Math.PI / 180;
    for (const b in SLOTS) {
      const [x, z, ry] = SLOTS[b], L = city.b[b] || 0; if (b === 'viviendas' || (b === 'puerto' && !coast)) continue;
      const base = suelo(x, z, 10);
      if (L > 0) { const m = staticMesh(D.BUILD[b].modelo || b, col); if (m) { const s = 0.82 + Math.min(L, 10) * 0.035; m.position.set(x, base - 0.2, z); m.rotation.y = ry * deg; m.scale.setScalar(s); this.dyn.add(sombrear(m)); } }
      else for (const [dx, dz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) { const st = new THREE.Mesh(ESTACA, MAT_ESTACA); st.position.set(x + dx, A(x + dx, z + dz) + 3, z + dz); this.dyn.add(st); }       // el solar vacío va pintado en el suelo; solo las cuatro estacas
      if (city.queue && city.queue.b === b) { const sc = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 30), new THREE.MeshBasicMaterial({ color: '#e9c063', wireframe: true, transparent: true, opacity: 0.55 })); sc.position.set(x, base + 8, z); this.dyn.add(sc); }
    }
    this.scene.traverse(o => { if (o.userData.adit) o.visible = (city.b.mina || 0) > 0; });
    // ínsulas: manzanas en cuadrícula alineadas con las calles; cuantas más viviendas, más manzanas ocupadas
    let total = 0; for (const b in city.b) total += city.b[b];
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const n = Math.min(CELDAS.length, 2 + (city.b.viviendas || 0) * 3), hs = CELDAS.slice(0, n).map((c, i) => new THREE.Matrix4().compose(new THREE.Vector3(c[0], suelo(c[0], c[1], 6) - 0.1, c[1]), q.setFromAxisAngle(up, Math.round(hash(i * 8.8) * 4) * Math.PI / 2), new THREE.Vector3(0.78, 0.78, 0.78)));
    const houses = staticInstances('casa', hs, col); if (houses) this.dyn.add(sombrear(houses));
    if (total > 34) { const t = staticMesh('vesta', col); if (t) { t.position.set(-16, suelo(-16, -64, 8), -64); t.scale.setScalar(0.7); this.dyn.add(sombrear(t)); } }
    if ((city.b.foro || 0) >= 4) { const t = staticMesh('arco', col); if (t) { t.position.set(0, suelo(0, WZ + 30, 8), WZ + 30); this.dyn.add(sombrear(t)); } }
    // barcos amarrados en el agua del río, a 30–50 del eje, junto al puerto
    if (coast && (city.b.puerto || 0) > 0) { const ships = [], war = [], P = PUER;
      for (let i = 0; i < Math.min(5, city.b.puerto); i++) { const s = -60 + i * 30, lat = 30 + (i % 2) * 18, x = P.rx + P.tx * s + P.nx * lat - OX, z = P.rz + P.tz * s + P.nz * lat - OZ;
        (i % 3 === 2 ? war : ships).push(new THREE.Matrix4().compose(new THREE.Vector3(x, NIVEL_RIO, z), q.setFromAxisAngle(up, -Math.atan2(P.tz, P.tx) + (i % 2 ? 0.25 : -0.2)), new THREE.Vector3(1, 1, 1))); }
      for (const g of [staticInstances('barco', ships, col), staticInstances('trirreme', war, col)]) if (g) this.dyn.add(sombrear(g)); }
    // muralla: recinto rectangular con torres y cuatro puertas. Cada tramo se asienta a la altura del más bajo de sus extremos (hundido ~1);
    // cada torre y puerta, a la altura de su punto; las torres de las juntas tapan los escalones.
    if ((city.b.muralla || 0) > 0) {
      const walls = [], towers = [], hy = 0.75 + city.b.muralla * 0.05, side = (ax, len, fixed, rotY, nseg) => { const seg = len * 2 / nseg, sx = seg / 37.3, r = q.setFromAxisAngle(up, rotY).clone();
        const P = t => ax ? [fixed, t] : [t, fixed];
        for (let i = 0; i < nseg; i++) { const t = -len + seg * (i + 0.5), [x, z] = P(t), a = P(t - seg / 2), b = P(t + seg / 2);
          if (i === (nseg - 1) / 2) { const gte = staticMesh('puerta', col); if (gte) { gte.position.set(x, A(x, z) - 0.3, z); gte.quaternion.copy(r); gte.scale.set(sx, hy, 1); this.dyn.add(sombrear(gte)); } }
          else walls.push(new THREE.Matrix4().compose(new THREE.Vector3(x, Math.min(A(a[0], a[1]), A(b[0], b[1])) - 1, z), r, new THREE.Vector3(sx, hy, 1)));
          const tt = -len + seg * i, [tx, tz] = P(tt); towers.push(new THREE.Matrix4().compose(new THREE.Vector3(tx, A(tx, tz) - 0.3, tz), r, new THREE.Vector3(1, hy, 1))); } };
      side(false, WX, -WZ, 0, 5); side(false, WX, WZ, Math.PI, 5); side(true, WZ, -WX, Math.PI / 2, 5); side(true, WZ, WX, -Math.PI / 2, 5);
      towers.push(new THREE.Matrix4().compose(new THREE.Vector3(WX, A(WX, WZ) - 0.3, WZ), q.identity(), new THREE.Vector3(1, hy, 1)));
      for (const g of [staticInstances('muro', walls, col), staticInstances('torre', towers, col)]) if (g) this.dyn.add(sombrear(g));
    }
  }
  update(city, id, sel, t) {
    this.sync(city, id); this.people(city, t); this.U.uTiempo.value = t;
    if (this.pedirSombra) { this.pedirSombra = false; this.r.shadowMap.needsUpdate = true; this.sombraRep = [t + 1.5, t + 4, t + 9]; }       // las texturas de las hojas llegan después: se repite un par de veces
    else if (this.sombraRep.length && t >= this.sombraRep[0]) { this.sombraRep.shift(); this.r.shadowMap.needsUpdate = true; }
    const sk = sel || null;
    if (sk !== this._sel) { this._sel = sk; const s = sk && SLOTS[sk]; if (s) { this.goal = { x: s[0], z: s[1] }; if (this.c.dist > 380 && Math.hypot(s[0], s[1] + 10) > 150) this.c.dist = 330; } }      // al elegir un edificio nuevo (también desde las fichas), la cámara va a él
    const c = this.c, cp = Math.cos(c.pitch), g = this.tg; g.x += (this.goal.x - g.x) * 0.12; g.z += (this.goal.z - g.z) * 0.12;
    const ag = A(g.x, g.z), cx = g.x + Math.sin(c.yaw) * cp * c.dist, cz = g.z + Math.cos(c.yaw) * cp * c.dist;
    this.cam.position.set(cx, Math.max(ag + Math.sin(c.pitch) * c.dist, A(cx, cz) + 1.7), cz); this.cam.lookAt(g.x, ag + 2.4, g.z); this.cam.updateMatrixWorld();
    const W = this.host.clientWidth, H = this.host.clientHeight, v = new THREE.Vector3();
    if (!sel || !this.fichaTop) this.shiftT = 0;
    this.shift = (this.shift || 0) + ((this.shiftT || 0) - (this.shift || 0)) * 0.15;
    if (Math.abs(this.shift - (this._sa || 0)) > 0.4) { this._sa = this.shift; this.cam.setViewOffset(W, H, 0, this.shift, W, H); this.cam.updateProjectionMatrix(); }
    if (this.labels.scrollLeft || this.labels.scrollTop) { this.labels.scrollLeft = 0; this.labels.scrollTop = 0; }
    for (const b in this.els) {
      const el = this.els[b], B = D.BUILD[b], L = city.b[b] || 0, s = SLOTS[b] || [0, 0], isWall = b === 'muralla', q = city.queue && city.queue.b === b;
      if (b === 'puerto' && !this.coast) { el.style.display = 'none'; continue; }
      const m = this.meta || {}, fl = (m.flags || {})[b] || (q ? 'obra' : ''), rec = m.rec === b, oc = L === 0 && (m.oculta || {})[b];
      if (oc) { el.style.display = 'none'; continue; }
      const key = L + '|' + fl + '|' + rec + '|' + (sel === b);
      if (el._t !== key) { el._t = key; el.innerHTML = medallaHtml(b, L, fl, sel === b); }
      el.classList.toggle('sel', sel === b); el.classList.toggle('off', L === 0); el.classList.toggle('rec', rec);
      if (isWall) v.set(-WX, A(-WX, WZ) + 26, WZ); else v.set(s[0], A(s[0], s[1]) + (b === 'templo' ? 34 : b === 'foro' ? 24 : 18), s[1]);
      v.project(this.cam);
      const sy = (1 - v.y) / 2 * H; if (sel === b && this.fichaTop) this.shiftT = Math.max(-60, Math.min(420, this.shift + sy - (this.fichaTop / 2 + 24)));
      if (v.z > 1 || sy < 104 || sy > H - (sel ? 40 : 150)) { el.style.display = 'none'; continue; } el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)';
    }
    { const el = this.armyEl, txt = '⚔️ Guarnición · ' + (this.men || 0); if (el._t !== txt) { el._t = txt; el.textContent = txt; } v.set(60, A(60, WZ + 30) + 12, WZ + 30).project(this.cam);
      if (v.z > 1 || !this.men || (1 - v.y) / 2 * H < 104 || (1 - v.y) / 2 * H > H - 150) el.style.display = 'none'; else { el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)'; } }
    const ss = sel && SLOTS[sel]; this.ringG.visible = !!ss;
    if (ss) { // el anillo se inclina según la pendiente y se sube lo justo para no enterrarse
      const x = ss[0], z = ss[1], y = A(x, z), gx = (A(x + 10, z) - A(x - 10, z)) / 20, gz = (A(x, z + 10) - A(x, z - 10)) / 20;
      this.ringG.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-gx, 1, -gz).normalize());
      let lift = 0.4; for (let k = 0; k < 8; k++) { const dx = Math.cos(k * 0.785) * 20.5, dz = Math.sin(k * 0.785) * 20.5; lift = Math.max(lift, A(x + dx, z + dz) - (y + gx * dx + gz * dz) + 0.4); }
      this.ringG.position.set(x, y + lift, z); this.ring.rotation.z = t * 0.8; }
    this.r.render(this.scene, this.cam);
  }
  bind() {
    const P = new Map(), cv = this.cv; let st = null;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); if (P.size === 1) st = { mv: 0, d: 0 }; else if (st) { st.mv = 99; st.d = 0; } });
    cv.addEventListener('pointermove', e => { if (!P.has(e.pointerId)) return; const pr = P.get(e.pointerId), dx = e.clientX - pr[0], dy = e.clientY - pr[1]; P.set(e.pointerId, [e.clientX, e.clientY]); const c = this.c;
      if (P.size === 1 && st) { st.mv += Math.abs(dx) + Math.abs(dy); c.yaw -= dx * 0.006; c.pitch += dy * 0.004; }
      else if (P.size === 2 && st) { const v = [...P.values()], d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]); if (st.d) c.dist *= st.d / d; st.d = d; }
      this.clamp(); });
    const up = e => { if (!P.has(e.pointerId)) return; P.delete(e.pointerId);
      if (st && st.mv < 10 && e.type === 'pointerup' && !P.size) { const rc = cv.getBoundingClientRect(), ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((e.clientX - rc.left) / rc.width * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1), this.cam);
        const o = ray.ray.origin, d = ray.ray.direction; let best = null, bd = 24;
        for (const b in SLOTS) { if (b === 'puerto' && !this.coast) continue; const k = (A(SLOTS[b][0], SLOTS[b][1]) + 4 - o.y) / d.y; if (!(k > 0)) continue; const dd = Math.hypot(SLOTS[b][0] - (o.x + d.x * k), SLOTS[b][1] - (o.z + d.z * k)); if (dd < bd) { bd = dd; best = b; } }      // corte del rayo a la altura de cada solar
        let x = o.x, z = o.z; if (!best && this.c.dist <= 160) { let k = 0; for (; k < 3000; k += 2) { x = o.x + d.x * k; z = o.z + d.z * k; if (o.y + d.y * k < A(x, z)) break; } }      // avanza el rayo contra el terreno
        this.goal = best ? { x: SLOTS[best][0], z: SLOTS[best][1] } : (this.c.dist > 160 ? { x: CENTRO.x, z: CENTRO.z } : { x: Math.max(-260, Math.min(300, x)), z: Math.max(-500, Math.min(260, z)) });   // tocar el suelo de cerca = ir allí
        if (this.opts.onPick) this.opts.onPick(best); }
      if (!P.size) st = null; else if (st) st.d = 0; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { this.c.dist *= e.deltaY > 0 ? 1.1 : 0.9; this.clamp(); e.preventDefault(); }, { passive: false });
  }
  zoom(f) { this.c.dist /= f; this.clamp(); }
  /* vistas rápidas: ciudad entera, calles o ejército */
  view(name) { const c = this.c; if (name === 'calle') { c.dist = 17; c.pitch = 0.14; c.yaw = 0.25; this.goal = { x: 0, z: 14 }; } else if (name === 'ejercito') { c.dist = 70; c.pitch = 0.3; c.yaw = 0.35; this.goal = { x: 60, z: WZ + 40 }; } else { c.dist = this.host.clientWidth < this.host.clientHeight ? 560 : 300; c.pitch = 0.46; c.yaw = 0.12; this.goal = { x: CENTRO.x, z: CENTRO.z }; } }
  clamp() { const c = this.c; c.dist = Math.max(10, Math.min(720, c.dist)); c.pitch = Math.max(0.08, Math.min(1.3, c.pitch)); if (c.dist > 380) this.goal = { x: CENTRO.x, z: CENTRO.z }; }
  resize() { const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1; this.r.setSize(w, h, false); this.cam.clearViewOffset(); this._sa = 0; this.cam.aspect = w / h; this.cam.fov = w < h ? 50 : 38; this.cam.updateProjectionMatrix(); if (!this.framed && w > 10) { this.framed = true; this.c.dist = w < h ? 560 : 300; this.c.pitch = 0.46; this.c.yaw = 0.12; } }
}
