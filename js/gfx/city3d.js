/* AQVILA — vista 3D de la ciudad: cada edificio del juego es un modelo real que aparece al construirlo */
import { THREE } from './models.js';
import { getStatic, staticMesh, staticInstances } from './statics.js';

const D = window.DATA;
// parcela de cada edificio: x, z, giro (grados). Los de recursos quedan fuera de la muralla
const SLOTS = {
  foro: [0, -6, 0], templo: [-52, -34, 20], almacen: [50, -34, -20], cuartel: [-54, 30, 90], establo: [54, 32, -90], mina: [0, 50, 180],
  aserradero: [-118, -52, 40], cantera: [118, -58, -40], granja: [112, 66, -120]
};
const WALL_R = 92, hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export class CityView3D {
  constructor(host, opts) {
    this.host = host; this.opts = opts || {};
    this.r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); this.r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.1;
    this.cv = this.r.domElement; this.cv.className = 'gl'; host.appendChild(this.cv);
    this.labels = document.createElement('div'); this.labels.className = 'mlabels'; host.appendChild(this.labels);
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(42, 1, 1, 1500);
    this.c = { yaw: 0.5, dist: 250, pitch: 0.72 }; this.key = ''; this.dyn = new THREE.Group(); this.els = {};
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
    const pos = g.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color(), grass = new THREE.Color('#7c9a48'), dry = new THREE.Color('#a7a45c'), dirt = new THREE.Color('#b9a274'), pave = new THREE.Color('#c9bea4');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), d = Math.hypot(x, z), n = 0.5 + 0.5 * Math.sin(x * 0.03 + Math.sin(z * 0.02) * 2) * Math.cos(z * 0.035);
      pos.setY(i, d > 190 ? Math.min(40, (d - 190) * (d - 190) * 0.0012) * (0.6 + 0.4 * Math.sin(Math.atan2(z, x) * 5)) : 0);
      c.copy(grass).lerp(dry, n);
      if (d < WALL_R - 4) c.lerp(dirt, 0.75); if (d < 30) c.lerp(pave, 0.8);
      if (Math.abs(x) < 7 && z > 0 && z < 230) c.lerp(dirt, 0.9); if (Math.abs(z + 6) < 6 && Math.abs(x) < 130) c.lerp(dirt, 0.7);
      c.multiplyScalar(0.9 + hash(i) * 0.2); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    sc.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })));
    // arboleda alrededor
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), list = { cipres: [], olivo: [], pino: [], algarrobo: [] }, kinds = Object.keys(list);
    for (let i = 0; i < 150; i++) { const a = hash(i * 1.7) * 6.283, d = 135 + hash(i * 3.3) * 330, x = Math.cos(a) * d, z = Math.sin(a) * d; if (Math.abs(x) < 16 && z > 0) continue;
      let ok = true; for (const k in SLOTS) if (Math.hypot(x - SLOTS[k][0], z - SLOTS[k][1]) < 34) ok = false; if (!ok) continue;
      const s = 0.8 + hash(i * 7.1) * 0.7, y = d > 190 ? Math.min(40, (d - 190) * (d - 190) * 0.0012) * (0.6 + 0.4 * Math.sin(a * 5)) : 0;
      list[kinds[Math.floor(hash(i * 9.9) * kinds.length)]].push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, hash(i) * 6.283), new THREE.Vector3(s, s, s))); }
    for (const k of kinds) { const t = staticInstances(k, list[k]); if (t) sc.add(t); }
    // campos de la granja
    const fm = new THREE.MeshLambertMaterial({ color: '#c9a94e' }); for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.PlaneGeometry(26, 34), fm); f.rotation.x = -Math.PI / 2; f.position.set(150 + i * 30, 0.15, 30 + i * 8); f.userData.field = true; f.visible = false; sc.add(f); }
    sc.add(this.dyn);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(20, 23, 40), new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: 0.9, depthWrite: false })); this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.4; this.ring.visible = false; sc.add(this.ring);
    for (const b in D.BUILD) { const el = document.createElement('button'); el.className = 'mlabel cityb'; el.addEventListener('click', ev => { ev.stopPropagation(); if (this.opts.onPick) this.opts.onPick(b); }); this.labels.appendChild(el); this.els[b] = el; }
  }
  /* reconstruye los edificios cuando cambia la ciudad o sus niveles */
  sync(city, id) {
    const key = id + JSON.stringify(city.b) + (city.queue ? city.queue.b : '');
    if (key === this.key) return; this.key = key;
    while (this.dyn.children.length) this.dyn.remove(this.dyn.children[0]);
    const col = D.FACTIONS.roma.col, deg = Math.PI / 180;
    for (const b in SLOTS) {
      const [x, z, ry] = SLOTS[b], L = city.b[b] || 0;
      if (L > 0) { const m = staticMesh(b, col); if (m) { const s = 0.82 + Math.min(L, 10) * 0.035; m.position.set(x, 0, z); m.rotation.y = ry * deg; m.scale.setScalar(s); this.dyn.add(m); } }
      else { const p = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshLambertMaterial({ color: '#a88f62' })); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.2, z); this.dyn.add(p);
        for (const [dx, dz] of [[-12, -12], [12, -12], [-12, 12], [12, 12]]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 5), new THREE.MeshLambertMaterial({ color: '#5a4028' })); st.position.set(x + dx, 3, z + dz); this.dyn.add(st); } }
      if (city.queue && city.queue.b === b) { const sc = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 30), new THREE.MeshBasicMaterial({ color: '#e9c063', wireframe: true, transparent: true, opacity: 0.55 })); sc.position.set(x, 8, z); this.dyn.add(sc); }
    }
    this.scene.traverse(o => { if (o.userData.field) o.visible = (city.b.granja || 0) > 0; });
    // casas: la ciudad crece con la suma de niveles
    let total = 0; for (const b in city.b) total += city.b[b];
    const n = Math.min(26, 3 + Math.floor(total / 2)), hs = [], q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    for (let i = 0, k = 0; k < n && i < 200; i++) { const a = hash(i * 2.39) * 6.283, d = 26 + hash(i * 5.1) * 56, x = Math.cos(a) * d, z = Math.sin(a) * d; let ok = Math.abs(x) > 12 || z < 0;
      for (const b in SLOTS) if (Math.hypot(x - SLOTS[b][0], z - SLOTS[b][1]) < 27) ok = false; for (const h of hs) if (Math.hypot(x - h.x, z - h.z) < 17) ok = false; if (!ok) continue;
      hs.push({ x: x, z: z, m: new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), q.setFromAxisAngle(up, Math.round(hash(i * 8.8) * 4) * Math.PI / 2 + a), new THREE.Vector3(0.8, 0.8, 0.8)) }); k++; }
    const houses = staticInstances('casa', hs.map(h => h.m), col); if (houses) this.dyn.add(houses);
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
    this.sync(city, id);
    const c = this.c, cp = Math.cos(c.pitch); this.cam.position.set(Math.sin(c.yaw) * cp * c.dist, Math.sin(c.pitch) * c.dist, Math.cos(c.yaw) * cp * c.dist + 10); this.cam.lookAt(0, 6, 10); this.cam.updateMatrixWorld();
    const W = this.host.clientWidth, H = this.host.clientHeight, v = new THREE.Vector3();
    if (this.labels.scrollLeft || this.labels.scrollTop) { this.labels.scrollLeft = 0; this.labels.scrollTop = 0; }
    for (const b in this.els) {
      const el = this.els[b], B = D.BUILD[b], L = city.b[b] || 0, s = SLOTS[b] || [0, 0], isWall = b === 'muralla', q = city.queue && city.queue.b === b;
      const txt = B.i + ' ' + B.n + (L ? ' · ' + L : '') + (q ? ' 🏗' : ''); if (el._t !== txt) { el._t = txt; el.textContent = txt; }
      el.classList.toggle('sel', sel === b); el.classList.toggle('off', L === 0);
      if (isWall) v.set(-WALL_R * 0.7, 26, WALL_R * 0.7); else v.set(s[0], b === 'templo' ? 34 : b === 'foro' ? 24 : 18, s[1]);
      v.project(this.cam);
      if (v.z > 1) { el.style.display = 'none'; continue; } el.style.display = ''; el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)';
    }
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
        const o = ray.ray.origin, d = ray.ray.direction, k = (4 - o.y) / d.y, x = o.x + d.x * k, z = o.z + d.z * k; let best = null, bd = 24; for (const b in SLOTS) { const dd = Math.hypot(SLOTS[b][0] - x, SLOTS[b][1] - z); if (dd < bd) { bd = dd; best = b; } }
        if (this.opts.onPick) this.opts.onPick(best); }
      if (!P.size) st = null; else if (st) st.d = 0; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', e => { this.c.dist *= e.deltaY > 0 ? 1.1 : 0.9; this.clamp(); e.preventDefault(); }, { passive: false });
  }
  zoom(f) { this.c.dist /= f; this.clamp(); }
  clamp() { const c = this.c; c.dist = Math.max(70, Math.min(600, c.dist)); c.pitch = Math.max(0.3, Math.min(1.3, c.pitch)); }
  resize() { const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.fov = w < h ? 54 : 38; this.cam.updateProjectionMatrix(); if (!this.framed && w > 10) { this.framed = true; this.c.dist = w < h ? 400 : 250; } }
}
