/* AQVILA — mapa de campaña en 3D: relieve del Mediterráneo, ciudades, rutas y ejércitos en marcha */
import { THREE, uTime, unitGeometry, unitMaterial } from './models.js';
import { staticMesh, getStatic } from './statics.js';
import { getUnit, unitMaterialReal, instancedGeometry, frameOf, UNIT_SCALE } from './units.js';

const D = window.DATA, G = window.Game;
const K = 0.1;                                   // mundo 2D (1600x800) -> unidades 3D
const NX = 420, NZ = 210, CW = D.WORLD.w * K / NX, CH = D.WORLD.h * K / NZ;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// cordilleras: [altura, anchura (grados), puntos lon/lat...]
const RIDGES = [
  [3.4, 0.55, [6.6, 44.1], [7.0, 45.4], [8.0, 46.1], [10, 46.5], [12, 46.6], [13.8, 46.4]],
  [1.7, 0.38, [8.6, 44.5], [10.4, 44.25], [12.0, 43.4], [13.3, 42.5], [14.2, 41.7], [15.4, 40.9], [16.1, 39.7], [16.0, 38.5]],
  [2.6, 0.42, [-1.8, 43.0], [0.5, 42.65], [2.6, 42.45]],
  [1.5, 0.5, [-7, 43.0], [-3, 43.0]], [1.4, 0.5, [-5, 40.4], [-2.2, 41.3], [-1, 40.4]], [1.8, 0.4, [-4.6, 37.0], [-2.9, 37.2], [-1.6, 38.1]],
  [2.0, 0.5, [-5, 35.0], [-1, 34.9], [3, 36.1], [6, 36.2], [8.8, 36.0]],
  [2.2, 0.5, [14.6, 45.1], [16.5, 44.0], [18.6, 42.9], [20.1, 41.9], [20.9, 40.5], [21.4, 39.5], [21.9, 38.6]],
  [1.7, 0.5, [21, 42.3], [23, 42.0], [25, 42.1]], [1.3, 0.5, [2.4, 45.2], [3.4, 44.5]], [1.2, 0.35, [22.2, 37.6], [22.4, 37.0]],
  [2.4, 0.16, [15.0, 37.75], [15.01, 37.76]], [1.7, 0.25, [9.1, 42.4], [9.1, 41.8]], [1.0, 0.25, [9.2, 40.3], [9.3, 39.6]], [0.9, 0.3, [13.6, 37.8], [14.6, 37.75]]
];

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
    this.build(); this.bind(); this.resize(); this.armies = new Map(); this.t = 0; this.last = performance.now();
  }

  build() {
    const sc = this.scene;
    sc.background = new THREE.Color('#0d1a26'); sc.fog = new THREE.Fog('#27455c', 90, 260);
    sc.add(new THREE.HemisphereLight('#eaf2ff', '#5a4a30', 1.2));
    const sun = new THREE.DirectionalLight('#fff1d6', 2.4); sun.position.set(-60, 90, 40); sc.add(sun);
    // --- máscara de tierra y distancia a la costa ---
    const land = new Uint8Array((NX + 1) * (NZ + 1)), polys = D.LAND;
    const lonOf = i => i * CW / K / 50 - 7, latOf = j => 47 - j * CH / K / 64;
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const lo = lonOf(i), la = latOf(j); for (const p of polys) if (inPoly(lo, la, p)) { land[j * (NX + 1) + i] = 1; break; } }
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
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) { const k = j * W1 + i; if (dist[k] > 3.2) continue; const lo = lonOf(i), la = latOf(j) * 1.28; let best = 9; for (const sgm of segs) { const dd = segDist(lo, la, [sgm[0], sgm[1]], [sgm[2], sgm[3]]); if (dd < best) best = dd; } dist[k] = Math.min(dist[k] + 0.5, best / cellDeg); }
    // --- alturas ---
    const H = this.H = new Float32Array(land.length), cities = Object.keys(D.CITIES).map(id => [D.CITIES[id].lon, D.CITIES[id].lat]);
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
      const k = j * W1 + i, lo = lonOf(i), la = latOf(j), d = dist[k];
      if (!land[k]) { H[k] = -Math.min(d, 10) * 0.085; continue; }
      let m = 0;
      for (const r of RIDGES) { let best = 9; for (let q = 2; q < r.length - 1; q++) best = Math.min(best, segDist(lo, la * 1.28, [r[q][0], r[q][1] * 1.28], [r[q + 1][0], r[q + 1][1] * 1.28])); m = Math.max(m, r[0] * Math.exp(-(best * best) / (2 * r[1] * r[1]))); }
      const n = Math.sin(lo * 3.1 + Math.sin(la * 2.3) * 2) * Math.cos(la * 3.7 + lo * 1.1), n2 = Math.sin(lo * 9.7 + la * 4.1) * Math.cos(la * 11.3 - lo * 3.3);
      let h = 0.1 + Math.min(d, 7) * 0.035 + m * (0.8 + 0.3 * n2) + Math.max(0, n) * 0.28 + n2 * 0.06 * Math.min(1, d / 3);
      let cd = 9; for (const c of cities) cd = Math.min(cd, Math.hypot(lo - c[0], (la - c[1]) * 1.28));
      if (cd < 0.5) h = 0.14 + (h - 0.14) * (cd / 0.5) * (cd / 0.5);
      H[k] = Math.min(h, d * 0.16);
    }
    // --- malla del terreno ---
    const g = new THREE.PlaneGeometry(D.WORLD.w * K, D.WORLD.h * K, NX, NZ); g.rotateX(-Math.PI / 2); g.translate(D.WORLD.w * K / 2, 0, D.WORLD.h * K / 2);
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
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
      }
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    sc.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })));
    // --- mar ---
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), new THREE.MeshPhongMaterial({ color: '#2f7fa6', transparent: true, opacity: 0.78, shininess: 90, specular: '#bfe6ff' }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(80, 0, 40); sc.add(sea);
    const out = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), new THREE.MeshBasicMaterial({ color: '#1d4a66' })); out.rotation.x = -Math.PI / 2; out.position.set(80, -0.9, 40); sc.add(out);
    // --- bosques ---
    const tg = new THREE.ConeGeometry(0.16, 0.5, 5); tg.translate(0, 0.25, 0);
    const trees = new THREE.InstancedMesh(tg, new THREE.MeshLambertMaterial({ color: '#3f6a30', flatShading: true }), 2600), M = new THREE.Matrix4(); let tn = 0;
    for (let q = 0; q < 14000 && tn < 2600; q++) {
      const i = Math.floor(hash(q * 1.3) * NX), j = Math.floor(hash(q * 2.7 + 5) * NZ), k = j * W1 + i, h = H[k];
      if (!land[k] || dist[k] < 2 || h > 1.5 || latOf(j) < 37.5 - hash(q) * 2) continue;
      if (Math.sin(lonOf(i) * 5.3 + latOf(j) * 7.1) < 0.1) continue;
      const s = 0.7 + hash(q * 9.1) * 0.8; M.makeScale(s, s, s); M.setPosition(i * CW + (hash(q * 4.4) - 0.5) * CW, h - 0.02, j * CH + (hash(q * 6.6) - 0.5) * CH); trees.setMatrixAt(tn++, M);
    }
    trees.count = tn; sc.add(trees);
    // --- rutas ---
    for (const e of D.EDGES) {
      const a = G.pos(e[0]), b = G.pos(e[1]), pts = [], n = 28;
      for (let i = 0; i <= n; i++) { const x = (a[0] + (b[0] - a[0]) * i / n) * K, z = (a[1] + (b[1] - a[1]) * i / n) * K; pts.push(new THREE.Vector3(x, Math.max(0.03, this.hAt(x, z)) + 0.07, z)); }
      const geo = new THREE.BufferGeometry().setFromPoints(pts), line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: e[2] ? '#e8f6ff' : '#5a3418', dashSize: e[2] ? 0.35 : 0.6, gapSize: e[2] ? 0.5 : 0.3, transparent: true, opacity: e[2] ? 0.55 : 0.85 }));
      line.computeLineDistances(); sc.add(line);
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

  hAt(x, z) { const i = Math.max(0, Math.min(NX, Math.round(x / CW))), j = Math.max(0, Math.min(NZ, Math.round(z / CH))); return this.H[j * (NX + 1) + i]; }

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
    const W = this.host.clientWidth, Hh = this.host.clientHeight, v = new THREE.Vector3(), now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now; this.t += dt; uTime.value = this.t;
    const place = (el, x, y, z) => { v.set(x, y, z).project(this.cam); if (v.z > 1 || v.x < -1.2 || v.x > 1.2 || v.y < -1.2 || v.y > 1.2) { el.style.display = 'none'; return; } el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * Hh).toFixed(1) + 'px) translate(-50%,-100%)'; };
    if (this.labels.scrollLeft || this.labels.scrollTop) { this.labels.scrollLeft = 0; this.labels.scrollTop = 0; }
    for (const id in this.cities) {
      const c = this.cities[id], st = state.cities[id];
      if (c.owner !== st.owner) { c.owner = st.owner; c.quiere = claveCentro(st.owner); const col = D.FACTIONS[st.owner].col; c.flag.color.set(col); c.dot.style.background = col; c.el.classList.toggle('mine', st.owner === 'roma'); }
      if (c.quiere !== c.puesto) this.ponerCentro(c);
      c.ring.visible = sel === id; if (sel === id) c.ring.rotation.z = this.t * 0.8;
      const txt = (state.hero.city === id ? '🦅 ' : '') + G.men(st.units); if (c.txt !== txt) { c.txt = txt; c.em.textContent = txt; }
      c.el.classList.toggle('sel', sel === id); place(c.el, c.x, c.grp.position.y + c.top, c.z);
    }
    const seen = new Set();
    for (const m of state.marches) {
      seen.add(m.id); let a = this.armies.get(m.id); if (!a) { a = this.armyModel(m); this.armies.set(m.id, a); }
      const p0 = m.fromXY || G.pos(m.from), p1 = G.pos(m.to), f = Math.max(0, Math.min(1, (state.t - m.t0) / (m.t1 - m.t0))), x = (p0[0] + (p1[0] - p0[0]) * f) * K, z = (p0[1] + (p1[1] - p0[1]) * f) * K, y = Math.max(0.04, this.hAt(x, z));
      a.grp.position.set(x, y, z); a.grp.rotation.y = Math.atan2(p1[0] - p0[0], p1[1] - p0[1]);
      for (const an of a.anims) { an.a.array[0] = frameOf(an.clip, this.t + an.ph); an.a.needsUpdate = true; }
      const txt = (m.owner === 'roma' ? '' : (m.label || D.FACTIONS[m.owner].n) + ' · ') + G.men(m.units); if (a.txt !== txt) { a.txt = txt; a.el.textContent = txt; }
      place(a.el, x, y + 2.7, z);
    }
    for (const [id, a] of this.armies) if (!seen.has(id)) { this.scene.remove(a.grp); a.grp.traverse(o => { if (o.geometry && !o.userData.real) o.geometry.dispose(); }); a.el.remove(); this.armies.delete(id); }
    const c = this.c, cp = Math.cos(c.pitch);
    this.cam.position.set(c.x, Math.sin(c.pitch) * c.dist, c.z + cp * c.dist); this.cam.lookAt(c.x, 0, c.z);
    this.r.render(this.scene, this.cam);
  }

  center(id) { const p = G.pos(id); this.c.x = p[0] * K; this.c.z = p[1] * K; this.clamp(); }
  zoom(f) { this.c.dist /= f; this.clamp(); }
  clamp() { const c = this.c; c.dist = Math.max(14, Math.min(150, c.dist)); c.pitch = 0.62 + Math.min(1, (c.dist - 14) / 110) * 0.6; c.x = Math.max(4, Math.min(156, c.x)); c.z = Math.max(4, Math.min(80, c.z)); }
  bind() {
    const P = new Map(), cv = this.cv; let st = null;
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); if (P.size === 1) st = { mv: 0, d: 0 }; else if (st) { st.mv = 99; st.d = 0; } });
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
