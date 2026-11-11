/* AQVILA — vista 3D de la ciudad: cada edificio del juego es un modelo real que aparece al construirlo */
import { THREE } from './models.js';
import { getStatic, staticMesh, staticInstances } from './statics.js';
import { applyGround, waterMesh } from './ground.js';
import { getUnit, unitMaterialReal, instancedGeometry, frameOf } from './units.js';

// puntos por los que pasean los ciudadanos (calles y plazas)
const WAY = [[0, 70], [0, 40], [0, 8], [0, -30], [0, -70], [40, 0], [80, 0], [-40, 0], [-80, 0], [-20, -12], [-50, -14], [30, -14], [50, 20], [-40, 22], [0, 100], [0, -100]];

const D = window.DATA;
/* Trazado de colonia romana: recinto rectangular, cuatro puertas, cardo (N-S) y decumano (E-O) que se cruzan en el foro,
   manzanas de ínsulas en cuadrícula. Los edificios de materiales están fuera, junto a su recurso natural:
   aserradero al borde del bosque, cantera y mina en la ladera rocosa, granja entre sus campos, puerto en la costa.
   Parcela: x, z, giro (grados). Norte = -z (el mar). */
const WX = 104, WZ = 84;                      // media anchura y medio fondo del recinto amurallado
const SLOTS = {
  foro: [-34, -30, 0], templo: [-76, -34, 90], mercado: [36, -32, 0], almacen: [70, -58, 180], cuartel: [64, 40, 180], establo: [-68, 44, 90], viviendas: [26, 34, 0],
  herreria: [86, -12, -90], termas: [-26, 52, 0], anfiteatro: [-80, 4, 90], acueducto: [-60, -106, 0],
  puerto: [0, -152, 180], aserradero: [-172, 20, 90], cantera: [176, -44, -90], mina: [182, 52, -90], granja: [-120, 150, 30]
};
const PK = 0.58;     // escala de las personas respecto a los edificios (en 0 A.D. los edificios son pequeños)
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// altura del terreno: mar al norte, ladera rocosa al este, colinas lejanas
function ht(x, z) {
  if (z < -128) return Math.max(-6, (-128 - z) * -0.12);
  let h = 0; const e = x - 196; if (e > 0) h = Math.min(46, e * e * 0.02) * Math.min(1, (z + 128) / 50);
  const d = Math.hypot(x, z); if (d > 300) h = Math.max(h, Math.min(40, (d - 300) * (d - 300) * 0.0012) * (0.6 + 0.4 * Math.sin(Math.atan2(z, x) * 5)) * Math.min(1, (z + 128) / 60));
  return h;
}

/* ROMA: el Tíber rodea la ciudad por el oeste y el norte (junto al puerto) y siete colinas (las más notables, Capitolio y Palatino, junto al río).
   Dentro del recinto el suelo sigue llano. Solo se usa si el id de la ciudad es 'roma'. */
const TIBER = (() => { const P = [[-300, 260], [-280, 220], [-235, 80], [-215, -40], [-190, -140], [-120, -198], [0, -202], [150, -216], [300, -240], [420, -262]], pts = [];
  for (let i = 0; i < P.length - 1; i++) { const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 10; k++) { const t = k / 10, t2 = t * t, t3 = t2 * t, f = (u, v, w, y) => 0.5 * (2 * v + (w - u) * t + (2 * u - 5 * v + 4 * w - y) * t2 + (3 * v - u - 3 * w + y) * t3); pts.push([f(a[0], b[0], c[0], d[0]), f(a[1], b[1], c[1], d[1])]); } }
  pts.push(P[P.length - 1]); return pts; })();
function riverD(x, z) { let m = 1e9; for (let i = 0; i < TIBER.length - 1; i++) { const a = TIBER[i], b = TIBER[i + 1], vx = b[0] - a[0], vz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz))), d = Math.hypot(x - a[0] - vx * t, z - a[1] - vz * t); if (d < m) m = d; } return m; }
const HILLS = [[-150, -95, 46, 40], [-70, -135, 38, 32], [-165, 60, 38, 34], [112, -135, 34, 32], [132, 125, 42, 42], [-20, 195, 38, 48], [200, 150, 40, 42]];
const sstep = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function htR(x, z) {
  let h = 0; const e = x - 196; if (e > 0) h = Math.min(46, e * e * 0.02) * Math.max(0, Math.min(1, (z + 128) / 50));
  const d = Math.hypot(x, z); if (d > 300) h = Math.max(h, Math.min(40, (d - 300) * (d - 300) * 0.0012) * (0.6 + 0.4 * Math.sin(Math.atan2(z, x) * 5)) * Math.max(0, Math.min(1, (z + 128) / 60)));
  const out = sstep(0, 26, Math.hypot(Math.max(0, Math.abs(x) - WX - 12), Math.max(0, Math.abs(z) - WZ - 12)));   // el interior del recinto queda llano
  for (const H of HILLS) h += H[2] * Math.exp(-((x - H[0]) * (x - H[0]) + (z - H[1]) * (z - H[1])) / (H[3] * H[3])) * out;
  const s = sstep(30, 48, riverD(x, z)); return -3 * (1 - s) + h * s;     // cauce: más hondo que el nivel del agua (-1,2)
}

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
    this.r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.1;
    this.cv = this.r.domElement; this.cv.className = 'gl'; host.appendChild(this.cv);
    this.labels = document.createElement('div'); this.labels.className = 'mlabels'; host.appendChild(this.labels);
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(42, 1, 1, 1500);
    this.c = { yaw: 0.5, dist: 250, pitch: 0.72 }; this.key = ''; this.dyn = new THREE.Group(); this.els = {};
    this.tg = { x: 0, z: 10 }; this.goal = { x: 0, z: 10 }; this.figs = new Map(); this.cit = []; this.lastT = 0;
    this.build(); this.bind(); this.resize();
  }
  build() {
    const sc = this.scene;
    const sk = document.createElement('canvas'); sk.width = 4; sk.height = 256; const sg = sk.getContext('2d'), gr = sg.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#4a86c4'); gr.addColorStop(0.6, '#a9cbe2'); gr.addColorStop(1, '#e8dfc4'); sg.fillStyle = gr; sg.fillRect(0, 0, 4, 256);
    const skt = new THREE.CanvasTexture(sk); skt.colorSpace = THREE.SRGBColorSpace; sc.background = skt; sc.fog = new THREE.Fog('#d9d6bf', 420, 1100);
    sc.add(new THREE.HemisphereLight('#d6e6ff', '#7a6238', 1.25)); const sun = new THREE.DirectionalLight('#ffe9c0', 3); sun.position.set(-120, 160, 90); sc.add(sun);
    // suelo: hierba, plaza y caminos
    const g = new THREE.PlaneGeometry(1400, 1400, 120, 120); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, wt = new Float32Array(pos.count * 3), mix = (i, k, f) => { for (let q = 0; q < 3; q++) wt[i * 3 + q] = wt[i * 3 + q] * (1 - f) + (q === k ? f : 0); };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), n = 0.5 + 0.5 * Math.sin(x * 0.03 + Math.sin(z * 0.02) * 2) * Math.cos(z * 0.035), inside = Math.abs(x) < WX - 3 && Math.abs(z) < WZ - 3;
      pos.setY(i, ht(x, z));
      wt[i * 3] = 1 - n * 0.35;                                                                    // hierba; el resto, hierba seca
      if (inside) mix(i, 1, 0.85);                                                                  // tierra batida dentro del recinto
      if (x > 150 && z > -120) mix(i, 1, Math.min(1, (x - 150) / 30));                              // ladera rocosa
      if (Math.abs(x) < 6 && z > -140 && z < 200) mix(i, 2, 0.95); if (Math.abs(z) < 6 && Math.abs(x) < 200) mix(i, 2, 0.95);   // cardo y decumano (y sus calzadas fuera)
      if (x > -62 && x < 8 && z > -52 && z < -6) mix(i, 2, 0.95);                                   // plaza del foro
      if (z < -116) mix(i, 2, Math.min(1, (-116 - z) / 12) * 0.9);                                  // muelle
    }
    this.groundD = new THREE.Mesh(g, applyGround(g, wt, 0.045)); sc.add(this.groundD);
    // suelo de Roma (solo se muestra en Roma): Tíber, colinas y muelle junto al río
    { const gr = new THREE.PlaneGeometry(1400, 1400, 240, 240); gr.rotateX(-Math.PI / 2);
      const ps = gr.attributes.position, w2 = new Float32Array(ps.count * 3), mx = (i, k, f) => { for (let q2 = 0; q2 < 3; q2++) w2[i * 3 + q2] = w2[i * 3 + q2] * (1 - f) + (q2 === k ? f : 0); };
      for (let i = 0; i < ps.count; i++) {
        const x = ps.getX(i), z = ps.getZ(i), n = 0.5 + 0.5 * Math.sin(x * 0.03 + Math.sin(z * 0.02) * 2) * Math.cos(z * 0.035), inside = Math.abs(x) < WX - 3 && Math.abs(z) < WZ - 3, h = htR(x, z), rd = riverD(x, z);
        ps.setY(i, h); w2[i * 3] = 1 - n * 0.35 - Math.min(0.5, Math.max(0, h - 6) / 40);
        if (inside) mx(i, 1, 0.85);
        if (x > 150 && z > -120) mx(i, 1, Math.min(1, (x - 150) / 30));
        if (Math.abs(x) < 6 && z > -176 && z < 200) mx(i, 2, 0.95); if (Math.abs(z) < 6 && Math.abs(x) < 200) mx(i, 2, 0.95);
        if (x > -62 && x < 8 && z > -52 && z < -6) mx(i, 2, 0.95);
        if (Math.abs(x) < 38 && z > -178 && z < -126) mx(i, 2, 0.9 * Math.min(1, (38 - Math.abs(x)) / 8));            // muelle del puerto
        if (rd < 56) mx(i, 1, 0.75 * (1 - sstep(30, 56, rd)));                                                           // orilla de barro
      }
      this.groundR = new THREE.Mesh(gr, applyGround(gr, w2, 0.045)); this.groundR.visible = false; sc.add(this.groundR);
      this.river = waterMesh(1400, 1400, 50); this.river.position.set(0, -1.2, 0); this.river.visible = false; sc.add(this.river); }
    // bosque al oeste (junto al aserradero) y arbolado disperso
    const q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const plant = (hf, skip) => { const grp = new THREE.Group(), list = { cipres: [], olivo: [], pino: [], algarrobo: [] }, kinds = Object.keys(list);
    const tree = (x, z, k, s) => skip && skip(x, z) ? 0 : list[k].push(new THREE.Matrix4().compose(new THREE.Vector3(x, hf(x, z) - 0.2, z), q.setFromAxisAngle(up, hash(x + z) * 6.283), new THREE.Vector3(s, s, s)));
    for (let i = 0; i < 110; i++) { const x = -190 - hash(i * 1.7) * 170, z = -100 + hash(i * 3.3) * 250; tree(x, z, i % 6 === 0 ? 'pino' : i % 2 ? 'algarrobo' : 'cipres', 1.2 + hash(i * 7.1) * 0.9); }   // pocos pinos: son el modelo más pesado
    for (let i = 0; i < 90; i++) { const a = hash(i * 1.9) * 6.283, d = 150 + hash(i * 4.3) * 330, x = Math.cos(a) * d, z = Math.sin(a) * d; if (z < -112 || x < -170 || (x > 140 && x < 240) || (Math.abs(x) < 14) || (Math.abs(z) < 14) || (x < -70 && z > 110)) continue; tree(x, z, kinds[Math.floor(hash(i * 9.9) * 3)], 1.1 + hash(i * 7.1) * 0.8); }
    for (const k of kinds) { const t = staticInstances(k, list[k]); if (t) grp.add(t); } sc.add(grp); return grp; };
    this.treesD = plant(ht, null); this.treesR = plant(htR, (x, z) => riverD(x, z) < 70); this.treesR.visible = false;
    // peñas de la cantera y bocamina
    const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: '#a39c8f', flatShading: true }), 70), M = new THREE.Matrix4();
    for (let i = 0; i < 70; i++) { const x = 190 + hash(i * 2.3) * 60, z = -100 + hash(i * 5.9) * 190, s2 = 2 + hash(i * 3.7) * 7; M.compose(new THREE.Vector3(x, ht(x, z) + s2 * 0.2, z), q.setFromAxisAngle(up, hash(i) * 6), new THREE.Vector3(s2, s2 * 0.7, s2)); rk.setMatrixAt(i, M); }
    sc.add(rk);
    const wood = new THREE.MeshLambertMaterial({ color: '#5a4028' }), dark = new THREE.MeshBasicMaterial({ color: '#0c0906' });
    const adit = new THREE.Group(); for (const [w, h, d, x, y, z, m] of [[7, 8, 3, 0, 4, 0, dark], [1.2, 9, 1.2, -4, 4.5, 1.6, wood], [1.2, 9, 1.2, 4, 4.5, 1.6, wood], [10, 1.2, 1.4, 0, 9, 1.6, wood]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); adit.add(b); }
    adit.position.set(205, ht(205, 52) - 0.5, 52); adit.rotation.y = -Math.PI / 2; adit.userData.adit = true; adit.visible = false; sc.add(adit);
    // campos de la granja
    const fm = new THREE.MeshLambertMaterial({ color: '#c9a94e' }); for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(34, 26), fm); f.rotation.x = -Math.PI / 2; f.rotation.z = 0.5; f.position.set(-175 + (i % 3) * 40, 0.15, 150 + Math.floor(i / 3) * 34 - (i % 3) * 18); f.userData.field = true; f.visible = false; sc.add(f); }
    // mar (solo en las ciudades con costa); sin costa, pradera
    this.sea = waterMesh(1500, 700, 30); this.sea.position.set(0, -1.2, -492); sc.add(this.sea);
    this.meadow = new THREE.Mesh(new THREE.PlaneGeometry(1500, 700), new THREE.MeshLambertMaterial({ color: '#86a04c' })); this.meadow.rotation.x = -Math.PI / 2; this.meadow.position.set(0, 0.1, -492); sc.add(this.meadow);
    sc.add(this.dyn);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(18, 20.5, 40), new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: 0.9, depthWrite: false })); this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.4; this.ring.visible = false; sc.add(this.ring);
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
    M[o] = c; M[o + 1] = 0; M[o + 2] = -s; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = PK; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = s; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = 0.1; M[o + 14] = z; M[o + 15] = 1;
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
    const key = id + JSON.stringify(city.b) + (city.queue ? city.queue.b : ''), coast = !!D.CITIES[id].sea, roma = id === 'roma'; this.coast = coast; this.roma = roma; this.sea.visible = coast && !roma; this.meadow.visible = !coast;
    this.groundD.visible = !roma; this.groundR.visible = roma; this.treesD.visible = !roma; this.treesR.visible = roma; this.river.visible = roma; if (roma) this.meadow.visible = false;
    const hf = roma ? htR : ht;
    if (key === this.key) return; this.key = key;
    while (this.dyn.children.length) this.dyn.remove(this.dyn.children[0]);
    const col = D.FACTIONS.roma.col, deg = Math.PI / 180;
    for (const b in SLOTS) {
      const [x, z, ry] = SLOTS[b], L = city.b[b] || 0; if (b === 'viviendas' || (b === 'puerto' && !coast)) continue;
      if (L > 0) { const m = staticMesh(D.BUILD[b].modelo || b, col); if (m) { const s = 0.82 + Math.min(L, 10) * 0.035; m.position.set(x, hf(x, z), z); m.rotation.y = ry * deg; m.scale.setScalar(s); this.dyn.add(m); } }
      else { const p = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshLambertMaterial({ color: '#a88f62' })); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.2, z); this.dyn.add(p);
        for (const [dx, dz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 5), new THREE.MeshLambertMaterial({ color: '#5a4028' })); st.position.set(x + dx, 3, z + dz); this.dyn.add(st); } }
      if (city.queue && city.queue.b === b) { const sc = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 30), new THREE.MeshBasicMaterial({ color: '#e9c063', wireframe: true, transparent: true, opacity: 0.55 })); sc.position.set(x, 8, z); this.dyn.add(sc); }
    }
    this.scene.traverse(o => { if (o.userData.field) o.visible = (city.b.granja || 0) > 0; if (o.userData.adit) o.visible = (city.b.mina || 0) > 0; });
    // ínsulas: manzanas en cuadrícula alineadas con las calles; cuantas más viviendas, más manzanas ocupadas
    let total = 0; for (const b in city.b) total += city.b[b];
    const cells = [], q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    for (let gx = -4; gx <= 3; gx++) for (let gz = -3; gz <= 2; gz++) { const x = gx * 24 + 12 + (gx >= 0 ? 4 : -4), z = gz * 24 + 12 + (gz >= 0 ? 4 : -4); if (Math.abs(x) > WX - 14 || Math.abs(z) > WZ - 12) continue;
      let ok = true; for (const b in SLOTS) if (b !== 'viviendas' && Math.abs(x - SLOTS[b][0]) < 26 && Math.abs(z - SLOTS[b][1]) < 24) ok = false; if (x > -66 && x < 12 && z > -56 && z < -4) ok = false; if (ok) cells.push([x, z, Math.hypot(x, z) + hash(gx * 7 + gz) * 20]); }
    cells.sort((a, b) => a[2] - b[2]);
    const n = Math.min(cells.length, 2 + (city.b.viviendas || 0) * 3), hs = cells.slice(0, n).map((c, i) => new THREE.Matrix4().compose(new THREE.Vector3(c[0], 0, c[1]), q.setFromAxisAngle(up, Math.round(hash(i * 8.8) * 4) * Math.PI / 2), new THREE.Vector3(0.78, 0.78, 0.78)));
    const houses = staticInstances('casa', hs, col); if (houses) this.dyn.add(houses);
    if (total > 34) { const t = staticMesh('vesta', col); if (t) { t.position.set(-16, 0, -64); t.scale.setScalar(0.7); this.dyn.add(t); } }
    if ((city.b.foro || 0) >= 4) { const t = staticMesh('arco', col); if (t) { t.position.set(0, 0, WZ + 30); this.dyn.add(t); } }
    // barcos amarrados según el nivel del puerto
    if (coast && (city.b.puerto || 0) > 0) { const ships = [], war = []; for (let i = 0; i < Math.min(5, city.b.puerto); i++) (i % 3 === 2 ? war : ships).push(new THREE.Matrix4().compose(new THREE.Vector3(-58 + i * 30 + (i > 1 ? 26 : 0), -1.2, -196 - (i % 2) * 22), q.setFromAxisAngle(up, 0.4 + i * 1.3), new THREE.Vector3(1, 1, 1)));
      for (const g of [staticInstances('barco', ships, col), staticInstances('trirreme', war, col)]) if (g) this.dyn.add(g); }
    // muralla: recinto rectangular con torres y cuatro puertas en los extremos del cardo y el decumano
    if ((city.b.muralla || 0) > 0) {
      const walls = [], towers = [], hy = 0.75 + city.b.muralla * 0.05, side = (ax, len, fixed, rotY, nseg) => { const seg = len * 2 / nseg, sx = seg / 37.3, r = q.setFromAxisAngle(up, rotY).clone();
        for (let i = 0; i < nseg; i++) { const t = -len + seg * (i + 0.5), x = ax ? fixed : t, z = ax ? t : fixed;
          if (i === (nseg - 1) / 2) { const gte = staticMesh('puerta', col); if (gte) { gte.position.set(x, 0, z); gte.quaternion.copy(r); gte.scale.set(sx, hy, 1); this.dyn.add(gte); } }
          else walls.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), r, new THREE.Vector3(sx, hy, 1)));
          const tt = -len + seg * i; towers.push(new THREE.Matrix4().compose(new THREE.Vector3(ax ? fixed : tt, 0, ax ? tt : fixed), r, new THREE.Vector3(1, hy, 1))); } };
      side(false, WX, -WZ, 0, 5); side(false, WX, WZ, Math.PI, 5); side(true, WZ, -WX, Math.PI / 2, 5); side(true, WZ, WX, -Math.PI / 2, 5);
      towers.push(new THREE.Matrix4().compose(new THREE.Vector3(WX, 0, WZ), q.identity(), new THREE.Vector3(1, hy, 1)));
      for (const g of [staticInstances('muro', walls, col), staticInstances('torre', towers, col)]) if (g) this.dyn.add(g);
    }
  }
  update(city, id, sel, t) {
    this.sync(city, id); this.people(city, t); if (this.sea.userData.tick) this.sea.userData.tick(t); if (this.roma && this.river.userData.tick) this.river.userData.tick(t);
    const c = this.c, cp = Math.cos(c.pitch), g = this.tg; g.x += (this.goal.x - g.x) * 0.12; g.z += (this.goal.z - g.z) * 0.12;
    this.cam.position.set(g.x + Math.sin(c.yaw) * cp * c.dist, Math.max(1.7, Math.sin(c.pitch) * c.dist), g.z + Math.cos(c.yaw) * cp * c.dist); this.cam.lookAt(g.x, 2.4, g.z); this.cam.updateMatrixWorld();
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
      if (isWall) v.set(-WX, 26, WZ); else v.set(s[0], b === 'templo' ? 34 : b === 'foro' ? 24 : 18, s[1]);
      v.project(this.cam);
      const sy = (1 - v.y) / 2 * H; if (sel === b && this.fichaTop) this.shiftT = Math.max(-60, Math.min(420, this.shift + sy - (this.fichaTop / 2 + 24)));
      if (v.z > 1 || sy < 104 || sy > H - (sel ? 40 : 150)) { el.style.display = 'none'; continue; } el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)';
    }
    { const el = this.armyEl, txt = '⚔️ Guarnición · ' + (this.men || 0); if (el._t !== txt) { el._t = txt; el.textContent = txt; } v.set(60, 12, WZ + 30).project(this.cam);
      if (v.z > 1 || !this.men || (1 - v.y) / 2 * H < 104 || (1 - v.y) / 2 * H > H - 150) el.style.display = 'none'; else { el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)'; } }
    const ss = sel && SLOTS[sel]; this.ring.visible = !!ss; if (ss) { this.ring.position.set(ss[0], 0.4, ss[1]); this.ring.rotation.z = t * 0.8; }
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
        const o = ray.ray.origin, d = ray.ray.direction, k = (4 - o.y) / d.y, x = o.x + d.x * k, z = o.z + d.z * k; let best = null, bd = 24; for (const b in SLOTS) { if (b === 'puerto' && !this.coast) continue; const dd = Math.hypot(SLOTS[b][0] - x, SLOTS[b][1] - z); if (dd < bd) { bd = dd; best = b; } }
        this.goal = best ? { x: SLOTS[best][0], z: SLOTS[best][1] } : (this.c.dist > 160 ? { x: 0, z: 10 } : { x: Math.max(-200, Math.min(200, x)), z: Math.max(-170, Math.min(200, z)) });   // tocar el suelo de cerca = ir allí
        if (this.opts.onPick) this.opts.onPick(best); }
      if (!P.size) st = null; else if (st) st.d = 0; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { this.c.dist *= e.deltaY > 0 ? 1.1 : 0.9; this.clamp(); e.preventDefault(); }, { passive: false });
  }
  zoom(f) { this.c.dist /= f; this.clamp(); }
  /* vistas rápidas: ciudad entera, calles o ejército */
  view(name) { const c = this.c; if (name === 'calle') { c.dist = 17; c.pitch = 0.14; c.yaw = 0.25; this.goal = { x: 0, z: 14 }; } else if (name === 'ejercito') { c.dist = 70; c.pitch = 0.3; c.yaw = 0.35; this.goal = { x: 60, z: WZ + 40 }; } else { c.dist = this.host.clientWidth < this.host.clientHeight ? 440 : 300; c.pitch = 0.72; this.goal = { x: 0, z: 10 }; } }
  clamp() { const c = this.c; c.dist = Math.max(10, Math.min(720, c.dist)); c.pitch = Math.max(0.08, Math.min(1.3, c.pitch)); if (c.dist > 380) this.goal = { x: 0, z: 10 }; }
  resize() { const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1; this.r.setSize(w, h, false); this.cam.clearViewOffset(); this._sa = 0; this.cam.aspect = w / h; this.cam.fov = w < h ? 54 : 38; this.cam.updateProjectionMatrix(); if (!this.framed && w > 10) { this.framed = true; this.c.dist = w < h ? 440 : 300; } }
}
