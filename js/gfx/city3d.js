/* AQVILA — vista 3D de la ciudad: cada edificio del juego es un modelo real que aparece al construirlo */
import { THREE } from './models.js';
import { getStatic, staticMesh, staticInstances } from './statics.js';
import { applyGround, waterMesh } from './ground.js';
import { getUnit, unitMaterialReal, instancedGeometry, frameOf } from './units.js';

// puntos por los que pasean los ciudadanos (calles y plazas)
const WAY = [[0, 62], [0, 26], [26, 6], [-26, 6], [42, -14], [-40, -14], [0, -42], [-30, 40], [32, 40], [62, 8], [-62, 8], [0, 84], [-20, -30], [22, -30], [0, 110]];

const D = window.DATA;
// parcela de cada edificio: x, z, giro (grados). Los de recursos quedan fuera de la muralla
const SLOTS = {
  foro: [0, -6, 0], templo: [-52, -34, 20], mercado: [50, -34, -20], cuartel: [-54, 30, 90], establo: [54, 32, -90], mina: [-22, 52, 180], almacen: [24, 56, 180],
  aserradero: [-124, -40, 40], cantera: [124, -46, -40], granja: [112, 66, -120], puerto: [0, -152, 180], viviendas: [-16, -56, 0]
};
const PK = 0.58;     // escala de las personas respecto a los edificios (en 0 A.D. los edificios son pequeños)
const WALL_R = 92, hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

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
      const x = pos.getX(i), z = pos.getZ(i), d = Math.hypot(x, z), n = 0.5 + 0.5 * Math.sin(x * 0.03 + Math.sin(z * 0.02) * 2) * Math.cos(z * 0.035);
      pos.setY(i, z < -130 ? Math.max(-6, (-130 - z) * -0.12) : d > 190 ? Math.min(40, (d - 190) * (d - 190) * 0.0012) * (0.6 + 0.4 * Math.sin(Math.atan2(z, x) * 5)) * Math.min(1, (z + 130) / 60) : 0);
      wt[i * 3] = 1 - n * 0.35;                                                    // hierba; el resto, hierba seca
      if (d < WALL_R - 4) mix(i, 1, 0.8); if (d < 34) mix(i, 2, 0.95);              // tierra dentro de la muralla, plaza empedrada
      if (Math.abs(x) < 7 && z > -90 && z < 230) mix(i, 2, 0.9); if (Math.abs(z + 6) < 6 && Math.abs(x) < 130) mix(i, 2, 0.8);   // calzadas
      if (Math.abs(x) < 6 && z < -90 && z > -140) mix(i, 1, 0.9); if (z < -118) mix(i, 2, Math.min(1, (-118 - z) / 14) * 0.9);   // camino y muelle
    }
    sc.add(new THREE.Mesh(g, applyGround(g, wt, 0.045)));
    // arboleda alrededor
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), list = { cipres: [], olivo: [], pino: [], algarrobo: [] }, kinds = Object.keys(list);
    for (let i = 0; i < 170; i++) { const a = hash(i * 1.7) * 6.283, d = 135 + hash(i * 3.3) * 330, x = Math.cos(a) * d, z = Math.sin(a) * d; if ((Math.abs(x) < 16 && z > 0) || z < -112) continue;
      let ok = true; for (const k in SLOTS) if (Math.hypot(x - SLOTS[k][0], z - SLOTS[k][1]) < 34) ok = false; if (!ok) continue;
      const s = 0.8 + hash(i * 7.1) * 0.7, y = d > 190 ? Math.min(40, (d - 190) * (d - 190) * 0.0012) * (0.6 + 0.4 * Math.sin(a * 5)) * Math.min(1, (z + 130) / 60) : 0;
      list[kinds[Math.floor(hash(i * 9.9) * kinds.length)]].push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, hash(i) * 6.283), new THREE.Vector3(s, s, s))); }
    for (const k of kinds) { const t = staticInstances(k, list[k]); if (t) sc.add(t); }
    // campos de la granja
    const fm = new THREE.MeshLambertMaterial({ color: '#c9a94e' }); for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(26, 34), fm); f.rotation.x = -Math.PI / 2; f.position.set(150 + i * 30, 0.15, 30 + i * 8); f.userData.field = true; f.visible = false; sc.add(f); }
    // mar (solo en las ciudades con costa); sin costa, pradera
    this.sea = waterMesh(1500, 700, 30); this.sea.position.set(0, -1.2, -492); sc.add(this.sea);
    this.meadow = new THREE.Mesh(new THREE.PlaneGeometry(1500, 700), new THREE.MeshLambertMaterial({ color: '#86a04c' })); this.meadow.rotation.x = -Math.PI / 2; this.meadow.position.set(0, 0.1, -492); sc.add(this.meadow);
    sc.add(this.dyn);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(20, 23, 40), new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: 0.9, depthWrite: false })); this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.4; this.ring.visible = false; sc.add(this.ring);
    this.armyEl = document.createElement('button'); this.armyEl.className = 'mlabel cityb army2'; this.armyEl.addEventListener('click', ev => { ev.stopPropagation(); this.goal = { x: 0, z: 165 }; if (this.c.dist > 150) this.c.dist = 120; if (this.opts.onArmy) this.opts.onArmy(); }); this.labels.appendChild(this.armyEl);
    for (const b in D.BUILD) { const el = document.createElement('button'); el.className = 'mlabel cityb'; el.addEventListener('click', ev => { ev.stopPropagation(); if (this.opts.onPick) this.opts.onPick(b); }); this.labels.appendChild(el); this.els[b] = el; }
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
      for (let j = 0; j < B.f; j++) { const cx = j % B.cols, cy = Math.floor(j / B.cols); this.put(e, x0 + cx * B.sp + (hash(j * 3.1) - 0.5) * 0.5, 136 + cy * B.sp * 1.1 + (hash(j * 7.7) - 0.5) * 0.5, 0, e && e.u.clips.idle, t + hash(j * 1.9 + B.cols) * 6); }
      x0 += B.w + 8; }
    for (const e of this.figs.values()) { e.m.count = e.i; e.m.instanceMatrix.needsUpdate = true; e.m.geometry.attributes.aFrame.needsUpdate = true; }
  }

  /* reconstruye los edificios cuando cambia la ciudad o sus niveles */
  sync(city, id) {
    const key = id + JSON.stringify(city.b) + (city.queue ? city.queue.b : ''), coast = !!D.CITIES[id].sea; this.coast = coast; this.sea.visible = coast; this.meadow.visible = !coast;
    if (key === this.key) return; this.key = key;
    while (this.dyn.children.length) this.dyn.remove(this.dyn.children[0]);
    const col = D.FACTIONS.roma.col, deg = Math.PI / 180;
    for (const b in SLOTS) {
      const [x, z, ry] = SLOTS[b], L = city.b[b] || 0; if (b === 'viviendas' || (b === 'puerto' && !coast)) continue;
      if (L > 0) { const m = staticMesh(b, col); if (m) { const s = 0.82 + Math.min(L, 10) * 0.035; m.position.set(x, 0, z); m.rotation.y = ry * deg; m.scale.setScalar(s); this.dyn.add(m); } }
      else { const p = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshLambertMaterial({ color: '#a88f62' })); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.2, z); this.dyn.add(p);
        for (const [dx, dz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 5), new THREE.MeshLambertMaterial({ color: '#5a4028' })); st.position.set(x + dx, 3, z + dz); this.dyn.add(st); } }
      if (city.queue && city.queue.b === b) { const sc = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 30), new THREE.MeshBasicMaterial({ color: '#e9c063', wireframe: true, transparent: true, opacity: 0.55 })); sc.position.set(x, 8, z); this.dyn.add(sc); }
    }
    this.scene.traverse(o => { if (o.userData.field) o.visible = (city.b.granja || 0) > 0; });
    // casas: la ciudad crece con la suma de niveles
    let total = 0; for (const b in city.b) total += city.b[b];
    const n = Math.min(30, 2 + (city.b.viviendas || 0) * 3), hs = [], q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    for (let i = 0, k = 0; k < n && i < 200; i++) { const a = hash(i * 2.39) * 6.283, d = 26 + hash(i * 5.1) * 56, x = Math.cos(a) * d, z = Math.sin(a) * d; let ok = Math.abs(x) > 12 || z < 0;
      for (const b in SLOTS) if (Math.hypot(x - SLOTS[b][0], z - SLOTS[b][1]) < 27) ok = false; for (const h of hs) if (Math.hypot(x - h.x, z - h.z) < 17) ok = false; if (!ok) continue;
      hs.push({ x: x, z: z, m: new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), q.setFromAxisAngle(up, Math.round(hash(i * 8.8) * 4) * Math.PI / 2 + a), new THREE.Vector3(0.8, 0.8, 0.8)) }); k++; }
    const houses = staticInstances('casa', hs.map(h => h.m), col); if (houses) this.dyn.add(houses);
    // barcos amarrados según el nivel del puerto
    if (coast && (city.b.puerto || 0) > 0) { const ships = [], war = []; for (let i = 0; i < Math.min(5, city.b.puerto); i++) (i % 3 === 2 ? war : ships).push(new THREE.Matrix4().compose(new THREE.Vector3(-58 + i * 30 + (i > 1 ? 26 : 0), -1.2, -196 - (i % 2) * 22), q.setFromAxisAngle(up, 0.4 + i * 1.3), new THREE.Vector3(1, 1, 1)));
      for (const g of [staticInstances('barco', ships, col), staticInstances('trirreme', war, col)]) if (g) this.dyn.add(g); }
    if (total > 28) { const t = staticMesh('vesta', col); if (t) { t.position.set(-22, 0, -62); t.scale.setScalar(0.8); this.dyn.add(t); } }
    if ((city.b.foro || 0) >= 4) { const t = staticMesh('arco', col); if (t) { t.position.set(0, 0, 118); this.dyn.add(t); } }
    // muralla: anillo de tramos y torres, con la puerta hacia el camino
    if ((city.b.muralla || 0) > 0) {
      const N = 14, walls = [], towers = [], seg = 2 * WALL_R * Math.tan(Math.PI / N), sx = seg / 37.3, hy = 0.75 + city.b.muralla * 0.05;
      for (let i = 0; i < N; i++) { const a = Math.PI / 2 + i / N * 6.283, x = Math.cos(a) * WALL_R, z = Math.sin(a) * WALL_R, rot = q.setFromAxisAngle(up, -a + Math.PI / 2).clone();
        if (i === 0) { const gte = staticMesh('puerta', col); if (gte) { gte.position.set(x, 0, z); gte.quaternion.copy(rot); gte.scale.set(sx, hy, 1); this.dyn.add(gte); } }
        else walls.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), rot, new THREE.Vector3(sx, hy, 1)));
        const a2 = a + Math.PI / N, r2 = WALL_R / Math.cos(Math.PI / N); towers.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a2) * r2, 0, Math.sin(a2) * r2), q.setFromAxisAngle(up, -a2), new THREE.Vector3(1, hy, 1))); }
      for (const g of [staticInstances('muro', walls, col), staticInstances('torre', towers, col)]) if (g) this.dyn.add(g);
    }
  }
  update(city, id, sel, t) {
    this.sync(city, id); this.people(city, t); if (this.sea.userData.tick) this.sea.userData.tick(t);
    const c = this.c, cp = Math.cos(c.pitch), g = this.tg; g.x += (this.goal.x - g.x) * 0.12; g.z += (this.goal.z - g.z) * 0.12;
    this.cam.position.set(g.x + Math.sin(c.yaw) * cp * c.dist, Math.max(1.7, Math.sin(c.pitch) * c.dist), g.z + Math.cos(c.yaw) * cp * c.dist); this.cam.lookAt(g.x, 2.4, g.z); this.cam.updateMatrixWorld();
    const W = this.host.clientWidth, H = this.host.clientHeight, v = new THREE.Vector3();
    if (this.labels.scrollLeft || this.labels.scrollTop) { this.labels.scrollLeft = 0; this.labels.scrollTop = 0; }
    for (const b in this.els) {
      const el = this.els[b], B = D.BUILD[b], L = city.b[b] || 0, s = SLOTS[b] || [0, 0], isWall = b === 'muralla', q = city.queue && city.queue.b === b;
      if (b === 'puerto' && !this.coast) { el.style.display = 'none'; continue; }
      const txt = B.i + ' ' + B.n + (L ? ' · ' + L : '') + (q ? ' 🏗' : ''); if (el._t !== txt) { el._t = txt; el.textContent = txt; }
      el.classList.toggle('sel', sel === b); el.classList.toggle('off', L === 0);
      if (isWall) v.set(-WALL_R * 0.7, 26, WALL_R * 0.7); else v.set(s[0], b === 'templo' ? 34 : b === 'foro' ? 24 : 18, s[1]);
      v.project(this.cam);
      if (v.z > 1 || (1 - v.y) / 2 * H < 205) { el.style.display = 'none'; continue; } el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)';
    }
    { const el = this.armyEl, txt = '⚔️ Guarnición · ' + (this.men || 0); if (el._t !== txt) { el._t = txt; el.textContent = txt; } v.set(0, 14, 150).project(this.cam);
      if (v.z > 1 || !this.men || (1 - v.y) / 2 * H < 205) el.style.display = 'none'; else { el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)'; } }
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
        this.goal = best ? { x: SLOTS[best][0], z: SLOTS[best][1] } : (this.c.dist > 160 ? { x: 0, z: 10 } : { x: Math.max(-140, Math.min(140, x)), z: Math.max(-170, Math.min(190, z)) });   // tocar el suelo de cerca = ir allí
        if (this.opts.onPick) this.opts.onPick(best); }
      if (!P.size) st = null; else if (st) st.d = 0; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { this.c.dist *= e.deltaY > 0 ? 1.1 : 0.9; this.clamp(); e.preventDefault(); }, { passive: false });
  }
  zoom(f) { this.c.dist /= f; this.clamp(); }
  /* vistas rápidas: ciudad entera, calles o ejército */
  view(name) { const c = this.c; if (name === 'calle') { c.dist = 17; c.pitch = 0.14; this.goal = { x: 0, z: 40 }; } else if (name === 'ejercito') { c.dist = 70; c.pitch = 0.3; c.yaw = 0.35; this.goal = { x: 0, z: 150 }; } else { c.dist = this.host.clientWidth < this.host.clientHeight ? 400 : 250; c.pitch = 0.72; this.goal = { x: 0, z: 10 }; } }
  clamp() { const c = this.c; c.dist = Math.max(10, Math.min(600, c.dist)); c.pitch = Math.max(0.08, Math.min(1.3, c.pitch)); if (c.dist > 260) this.goal = { x: 0, z: 10 }; }
  resize() { const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.fov = w < h ? 54 : 38; this.cam.updateProjectionMatrix(); if (!this.framed && w > 10) { this.framed = true; this.c.dist = w < h ? 400 : 250; } }
}
