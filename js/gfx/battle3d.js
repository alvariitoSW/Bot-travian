/* AQVILA — vista 3D de la batalla: cada soldado es una figura animada sobre un terreno con relieve */
import { THREE, uTime, unitGeometry, unitMaterial, portrait } from './models.js';
import { applyGround } from './ground.js';
import { getStatic, staticInstances, staticMesh, piezaCultura } from './statics.js';
import { getUnit, unitMaterialReal, instancedGeometry, frameOf, frameOnce, realPortrait, UNIT_SCALE, lightGeometry, lightMaterial, LIGHT_TRIS } from './units.js';

const BK = 1.65;                               // edificios y árboles de 0 A.D. agrandados para casar con el tamaño de las figuras
const DEAD = 150;                             // caídos visibles por tipo de unidad
/* Nivel de detalle por soldado: más allá de LOD_LEJOS metros de la cámara se pinta la figura ligera; vuelve a la real
   por debajo de LOD_CERCA (la diferencia evita el parpadeo). REAL_FRAC: parte de soldados que se supone reales al repartir el tope. */
const LOD_MAX = 150, LOD_HIST = 0.87, REAL_FRAC = 0.3;   // el radio real se ajusta solo: 150 m como mucho y menos si hay más figuras reales que el tope (las más cercanas a la cámara son las reales)
const TRI_BUDGET = (navigator.maxTouchPoints > 0 ? 1.0e6 : 1.6e6);

const S = 0.25, FW = 600;                     // escala simulación -> mundo
let renderer = null;                          // un único contexto WebGL para todas las batallas

function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

function formation(cls, key) {
  if (cls === 'ele') return { cols: 4, sx: 4.4, sz: 5.2, max: 99, sh: 2.6 };
  if (cls === 'cav' || cls === 'gen') return { cols: 6, sx: 2.0, sz: 2.7, max: 30, sh: 1.2 };
  if (cls === 'rng') return { cols: 10, sx: 1.45, sz: 1.5, max: 50, sh: 0.5 };
  if (key === 'falange') return { cols: 10, sx: 1.0, sz: 1.05, max: 60, sh: 0.5 };
  return { cols: 10, sx: 1.15, sz: 1.25, max: 60, sh: 0.5 };
}

export class BattleView3D {
  constructor(host, battle, opts) {
    this.b = battle; this.host = host; this.sel = new Set(); this.opts = opts || {};
    this.halfD = battle.H * S / 2; this.t = 0; this.last = performance.now();
    if (!renderer) { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; }
    this.r = renderer; this.cv = renderer.domElement; this.cv.className = 'gl'; host.appendChild(this.cv);
    this.flags = document.createElement('div'); this.flags.className = 'bflags'; host.appendChild(this.flags);
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(52, 1, 0.5, 900);
    this.c = { x: 0, z: this.halfD * 0.3, dist: 100, yaw: 0, pitch: 0.5 }; this.intro = 0;
    if (battle.fase === 'despliegue') { this.c.z = this.halfD * 0.78; this.c.pitch = 0.8; this.c.dist = 95; this.intro = 1; } /* despliegue: la cámara mira tu zona, por encima de las cartas */
    this.buildWorld(); this.buildArmies(); this.buildFlags(); this.buildCards(); this.bind(); this.resize();
  }

  /* ---------- terreno ---------- */
  h(x, z) {
    let y = 1.3 * Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.038) + 0.6 * Math.sin(x * 0.09 + z * 0.06 + 2);
    const mx = Math.abs(x) - 84; if (mx > 0) y += Math.min(16, mx * mx * 0.02);
    const att = this.b.cfg.defender === 0 ? -1 : 1, mz = z * att - this.halfD - 6; if (mz > 0) y += Math.min(18, mz * mz * 0.02);   // colinas tras el atacante
    const dz = -z * att - this.halfD + 14; if (dz > 0) y *= Math.max(0, 1 - dz / 14);                                                  // explanada ante la ciudad
    return y;
  }
  toW(x, y) { return [(x - FW / 2) * S, (y - this.b.H / 2) * S]; }

  buildWorld() {
    const sc = this.scene, hd = this.halfD;
    // cielo
    const sk = document.createElement('canvas'); sk.width = 4; sk.height = 256; const sg = sk.getContext('2d'), gr = sg.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#3f78b8'); gr.addColorStop(0.55, '#9cc3df'); gr.addColorStop(0.8, '#e6dcc0'); gr.addColorStop(1, '#e6dcc0'); sg.fillStyle = gr; sg.fillRect(0, 0, 4, 256);
    const skt = new THREE.CanvasTexture(sk); skt.colorSpace = THREE.SRGBColorSpace; sc.background = skt;
    sc.fog = new THREE.Fog('#d9d6bf', 220, 620);
    sc.add(new THREE.HemisphereLight('#cfe2ff', '#7a6238', 1.25));
    const sun = new THREE.DirectionalLight('#ffe6b8', 3.1); sun.position.set(-90, 95, 60); sc.add(sun);
    // suelo
    const W = 520, Dp = hd * 2 + 320, g = new THREE.PlaneGeometry(W, Dp, 110, 130); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, wt = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = this.h(x, z); pos.setY(i, y);
      const n = 0.5 + 0.5 * Math.sin(x * 0.07 + Math.sin(z * 0.05) * 2) * Math.cos(z * 0.09 + x * 0.03), road = Math.abs(x - 18 * Math.sin(z * 0.02));
      let gr = 1 - n * 0.4, di = 0; if (road < 6) { di = 1 - road / 6; gr *= 1 - di; } if (y > 7) { const k = Math.min(1, (y - 7) / 6); di = Math.max(di, k * 0.7); gr *= 1 - k * 0.7; }
      wt[i * 3] = gr; wt[i * 3 + 1] = di; wt[i * 3 + 2] = 0;                       // pesos: hierba, tierra, (empedrado); el resto, hierba seca
    }
    this.ground = new THREE.Mesh(g, applyGround(g, wt, 0.09)); sc.add(this.ground);
    // árboles en los márgenes: modelos reales si están cargados; si no, conos sencillos
    const att = this.b.cfg.defender === 0 ? -1 : 1;
    if (getStatic('cipres')) {
      const kinds = ['cipres', 'olivo', 'pino', 'algarrobo', 'cipres', 'olivo'], lists = {}, q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < 300; i++) {
        let x, z; const r = hash(i * 7.3);
        if (r < 0.75) { x = (hash(i * 1.7) < 0.5 ? -1 : 1) * (84 + hash(i * 2.9) * 80); z = (hash(i * 4.1) - 0.5) * (hd * 2 + 140); }
        else { x = (hash(i * 1.7) - 0.5) * 320; z = att * (hd + 16 + hash(i * 2.9) * 100); }
        const k = kinds[Math.floor(hash(i * 5.7) * kinds.length)], sc2 = UNIT_SCALE * BK * (0.8 + hash(i * 9.9) * 0.6);
        (lists[k] = lists[k] || []).push(new THREE.Matrix4().compose(new THREE.Vector3(x, this.h(x, z) - 0.2, z), q.setFromAxisAngle(up, hash(i) * 6.283), new THREE.Vector3(sc2, sc2, sc2)));
      }
      for (const k in lists) { const t = staticInstances(k, lists[k]); if (t) sc.add(t); }
    } else {
    const cy = new THREE.ConeGeometry(1.5, 9, 6); cy.translate(0, 5.2, 0);
    const ol = new THREE.IcosahedronGeometry(3, 0); ol.scale(1, 0.8, 1); ol.translate(0, 4.2, 0);
    const tk = new THREE.CylinderGeometry(0.35, 0.45, 2.4, 5); tk.translate(0, 1.2, 0);
    const mk = (geo, color, n) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: color, flatShading: true }), n); sc.add(m); return m; };
    const N = 170, t1 = mk(cy, '#2f5a2c', N), t2 = mk(ol, '#58793a', N), t3 = mk(tk, '#5a4028', N * 2), M = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
    for (let i = 0; i < N * 2; i++) {
      let x, z; const r = hash(i * 7.3);
      if (r < 0.75) { x = (hash(i * 1.7) < 0.5 ? -1 : 1) * (82 + hash(i * 2.9) * 70); z = (hash(i * 4.1) - 0.5) * (hd * 2 + 120); }
      else { x = (hash(i * 1.7) - 0.5) * 300; z = att * (hd + 14 + hash(i * 2.9) * 90); }
      const s = 0.7 + hash(i * 9.9) * 0.8; pv.set(x, this.h(x, z) - 0.2, z); sv.set(s, s, s); M.compose(pv, q, sv);
      (i < N ? t1 : t2).setMatrixAt(i % N, M); t3.setMatrixAt(i, M);
    }
    }
    // ciudad del defensor
    this.buildCity(-att * (hd + 9), -att);
    // proyectiles, sombras, caídos, selección
    this.proj = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 1.5), new THREE.MeshBasicMaterial({ color: '#2a1c10' }), 240); this.proj.count = 0; this.proj.frustumCulled = false; sc.add(this.proj);
    const cg = new THREE.BoxGeometry(0.5, 0.22, 1.7); cg.translate(0, 0.12, 0);
    this.corp = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial({ flatShading: true }), 2600); this.corp.count = 0; this.corp.frustumCulled = false; this.nCorp = 0; sc.add(this.corp);
    const mg = new THREE.RingGeometry(1.2, 1.7, 20); mg.rotateX(-Math.PI / 2);
    this.marker = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: 0.9, depthWrite: false })); this.marker.visible = false; sc.add(this.marker);
    // borde de la zona de despliegue: línea clara sobre el suelo, visible solo mientras se coloca
    { const z = this.b.zona(0), pts = [[z.x0, z.y0], [z.x1, z.y0], [z.x1, z.y1], [z.x0, z.y1], [z.x0, z.y0]], v = [];
      for (let i = 0; i < 4; i++) { const n = 24; for (let k = 0; k < n; k++) { const a = pts[i], c = pts[i + 1], w = this.toW(a[0] + (c[0] - a[0]) * k / n, a[1] + (c[1] - a[1]) * k / n), w2 = this.toW(a[0] + (c[0] - a[0]) * (k + 1) / n, a[1] + (c[1] - a[1]) * (k + 1) / n); v.push(w[0], this.h(w[0], w[1]) + 0.5, w[1], w2[0], this.h(w2[0], w2[1]) + 0.5, w2[1]); } }
      const gz = new THREE.BufferGeometry(); gz.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      this.zonaLinea = new THREE.LineSegments(gz, new THREE.LineBasicMaterial({ color: this.b.cfg.sides[0].col, transparent: true, opacity: 0.95, depthTest: false })); this.zonaLinea.renderOrder = 5; sc.add(this.zonaLinea); }
    // horizonte de montañas
    const rg = new THREE.CylinderGeometry(560, 560, 1, 90, 1, true), rp = rg.attributes.position;
    for (let i = 0; i < rp.count; i++) { const a = Math.atan2(rp.getZ(i), rp.getX(i)); rp.setY(i, rp.getY(i) > 0 ? 28 + 34 * Math.abs(Math.sin(a * 3.1) * Math.cos(a * 7.3 + 1)) + 16 * Math.sin(a * 17) : -20); }
    sc.add(new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: '#8fa7ba', side: THREE.BackSide, fog: false })));
    // hierba y piedras cerca del campo
    const gg = new THREE.ConeGeometry(0.1, 0.34, 3); gg.translate(0, 0.17, 0);
    const grass = new THREE.InstancedMesh(gg, new THREE.MeshLambertMaterial({ color: '#6b8f3a' }), 5200), gm = new THREE.Matrix4();
    for (let i = 0; i < 5200; i++) { const x = (hash(i * 1.37) - 0.5) * 190, z = (hash(i * 2.11 + 9) - 0.5) * (hd * 2 + 30), s2 = 0.6 + hash(i * 3.3) * 1.3; gm.makeScale(s2, s2 * (0.7 + hash(i * 5.1)), s2); gm.setPosition(x, this.h(x, z) - 0.03, z); grass.setMatrixAt(i, gm); grass.setColorAt(i, new THREE.Color().setHSL(0.19 + hash(i * 7.7) * 0.08, 0.42, 0.36 + hash(i * 9.1) * 0.12)); }
    sc.add(grass);
    const rkg = new THREE.DodecahedronGeometry(0.6, 0), rocks = new THREE.InstancedMesh(rkg, new THREE.MeshLambertMaterial({ color: '#9a9484', flatShading: true }), 160);
    for (let i = 0; i < 160; i++) { const x = (hash(i * 4.7) - 0.5) * 210, z = (hash(i * 8.3 + 2) - 0.5) * (hd * 2 + 60), s2 = 0.4 + hash(i * 2.9) * 1.6; gm.makeScale(s2, s2 * 0.6, s2); gm.setPosition(x, this.h(x, z) + 0.05, z); rocks.setMatrixAt(i, gm); }
    sc.add(rocks);
    // polvo
    const dc = document.createElement('canvas'); dc.width = dc.height = 64; const dg = dc.getContext('2d'), rgd = dg.createRadialGradient(32, 32, 2, 32, 32, 32); rgd.addColorStop(0, 'rgba(255,255,255,0.9)'); rgd.addColorStop(1, 'rgba(255,255,255,0)'); dg.fillStyle = rgd; dg.fillRect(0, 0, 64, 64);
    this.ND = 420; this.dp = new Float32Array(this.ND * 3).fill(-999); this.dl = new Float32Array(this.ND); this.di = 0;
    const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(this.dp, 3));
    this.dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(dc), color: '#d8c7a0', size: 7, transparent: true, opacity: 0.2, depthWrite: false, sizeAttenuation: true })); this.dust.frustumCulled = false; sc.add(this.dust);
    // estandartes 3D
    const pg = new THREE.CylinderGeometry(0.05, 0.05, 4.6, 5); pg.translate(0, 2.3, 0);
    const fg = new THREE.PlaneGeometry(1.0, 0.8, 4, 1); fg.translate(0.53, 4.05, 0);
    const n = this.b.regs.length;
    this.poles = new THREE.InstancedMesh(pg, new THREE.MeshLambertMaterial({ color: '#4a3420' }), n); this.cloth = new THREE.InstancedMesh(fg, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), n);
    const eg = new THREE.OctahedronGeometry(0.28, 0); eg.scale(1.6, 0.9, 0.5); eg.translate(0, 4.75, 0);
    this.eagles = new THREE.InstancedMesh(eg, new THREE.MeshLambertMaterial({ color: '#f0c44a', emissive: '#5a4310' }), n);
    for (const m of [this.poles, this.cloth, this.eagles]) { m.frustumCulled = false; m.count = 0; sc.add(m); }
  }

  buildCity(zc, dir) {
    if (getStatic('muro') && getStatic('casa')) return this.buildRealCity(zc, dir);
    const wall = this.b.cfg.wall || 0, sc = this.scene, y0 = 0, parts = [], cols = [];
    const add = (geo, color) => { const g = geo.index ? geo.toNonIndexed() : geo, n = g.attributes.position.count, c = new THREE.Color(color), ca = new Float32Array(n * 3); for (let i = 0; i < n; i++) { ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); parts.push(g); };
    const box = (w, h, d, x, y, z, color) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); add(g, color); };
    const hW = wall > 0 ? 3 + wall * 0.7 : 0;
    if (wall > 0) {
      box(230, hW, 2.4, 0, y0 + hW / 2, zc, '#b9ad94'); box(230, 0.5, 3, 0, y0 + hW, zc, '#a59a82');
      for (let x = -112; x <= 112; x += 2.4) box(1.2, 0.9, 0.7, x, y0 + hW + 0.7, zc - dir * 1.1, '#b9ad94');
      for (let x = -105; x <= 105; x += 30) { box(6, hW + 3, 6, x, y0 + (hW + 3) / 2, zc, '#a89c84'); box(6.8, 0.6, 6.8, x, y0 + hW + 3, zc, '#8f846e'); for (const dx of [-2.6, 0, 2.6]) box(1.2, 1, 6.8, x + dx, y0 + hW + 3.7, zc, '#a89c84'); }
      box(11, hW + 4.5, 5, 0, y0 + (hW + 4.5) / 2, zc, '#a89c84'); box(5, hW * 0.85, 5.4, 0, y0 + hW * 0.42, zc, '#3a2a1a');
      const rf = new THREE.ConeGeometry(8.5, 3, 4); rf.rotateY(Math.PI / 4); rf.translate(0, y0 + hW + 6, zc); add(rf, '#a8492e');
    }
    for (let i = 0; i < 70; i++) {
      const x = (hash(i * 3.3) - 0.5) * 210, z = zc + dir * (7 + hash(i * 5.1) * 60), w = 5 + hash(i * 1.9) * 6, d = 5 + hash(i * 2.3) * 6, h = 3 + hash(i * 6.7) * 4;
      if (Math.abs(x) < 9 && Math.abs(z - zc) < 40) continue;
      box(w, h, d, x, y0 + h / 2, z, ['#e6d9bd', '#d9c9a6', '#efe6d2', '#cdb992'][i % 4]);
      const rf = new THREE.ConeGeometry(Math.max(w, d) * 0.78, 2.2, 4); rf.rotateY(Math.PI / 4); rf.scale(w / Math.max(w, d), 1, d / Math.max(w, d)); rf.translate(x, y0 + h + 1.1, z); add(rf, i % 3 ? '#b3532f' : '#9c452a');
    }
    // templo
    const tz = zc + dir * 44; box(26, 2, 18, 0, y0 + 1, tz, '#e8e0cf'); box(24, 1.4, 16, 0, y0 + 11.7, tz, '#e8e0cf');
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const cgeo = new THREE.CylinderGeometry(0.8, 0.9, 9, 8); cgeo.translate(-10.5 + i * 4.2, y0 + 6.5, tz + s * 6.6); add(cgeo, '#f3ecdc'); }
    const pd = new THREE.CylinderGeometry(0.01, 13.5, 4, 3); pd.rotateY(Math.PI / 2); pd.scale(1, 1, 0.7); pd.rotateX(0); pd.translate(0, y0 + 14.4, tz); add(pd, '#b3532f');
    box(18, 9, 12, 0, y0 + 6.5, tz, '#d8ccb2');
    // fusionar
    let n = 0; for (const g of parts) n += g.attributes.position.count;
    const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
    for (const g of parts) { P.set(g.attributes.position.array, o * 3); Nn.set(g.attributes.normal.array, o * 3); C.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; g.dispose(); }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); G.setAttribute('color', new THREE.BufferAttribute(C, 3));
    sc.add(new THREE.Mesh(G, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
  }

  /* ciudad del defensor con edificios y murallas reales */
  buildRealCity(zc, dir) {
    const wall = this.b.cfg.wall || 0, sc = this.scene, K = UNIT_SCALE * BK, col = this.b.cfg.sides[this.b.cfg.defender].col, q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
    const rot = q.setFromAxisAngle(up, dir > 0 ? Math.PI : 0).clone(), M = (x, y, z, r, sx, sy) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), r || rot, new THREE.Vector3(K * (sx || 1), K * (sy || 1), K));
    if (wall > 0) {
      const seg = 37.3 * K, hy = 0.8 + wall * 0.07, walls = [], towers = [];
      for (let i = -7; i <= 7; i++) { const x = i * seg; if (i === 0) { const g = staticMesh('puerta', col); if (g) { g.applyMatrix4(M(0, 0, zc, rot, 1, hy)); sc.add(g); } } else walls.push(M(x, 0, zc, rot, 1, hy)); towers.push(M(x + seg / 2, 0, zc - dir * 0.5, rot, 1, hy)); }
      for (const g of [staticInstances('muro', walls, col), staticInstances('torre', towers, col)]) if (g) sc.add(g);
    }
    const houses = [];
    for (let i = 0; i < 50; i++) { const x = (hash(i * 3.3) - 0.5) * 300, z = zc + dir * (18 + hash(i * 5.1) * 110); if (Math.abs(x) < 36 && Math.abs(z - zc) < 100) continue; houses.push(M(x, 0, z, q.setFromAxisAngle(up, Math.round(hash(i * 7.7) * 4) * Math.PI / 2).clone())); }
    const hs = staticInstances('casa', houses, col); if (hs) sc.add(hs);
    const propia = piezaCultura(this.b.cfg.sides[this.b.cfg.defender].name);     // A7: ciudad de otra cultura = sus edificios de 0 A.D.
    const piezas = propia && getStatic(propia) ? [[propia, 0, 70, 2.3], [propia, -90, 48, 1.7], [propia, 85, 44, 1.7], [propia, 140, 72, 1.3], [propia, -145, 80, 1.3]] : [['templo', 0, 70], ['foro', -80, 46], ['cuartel', 72, 40], ['mercado', 130, 66], ['vesta', -140, 76]];
    for (const [k, x, dz, es] of piezas) { const g = staticMesh(k, col); if (g) { const m = M(x, 0, zc + dir * dz); if (es) m.scale(new THREE.Vector3(es, es, es)); g.applyMatrix4(m); sc.add(g); } }
  }

  /* ---------- ejércitos ---------- */
  buildArmies() {
    const b = this.b; this.R = []; this.meshes = new Map(); this.byReg = new Map();
    let total = 0; const want = b.regs.map(r => { const f = formation(r.u.cls, r.k), n = Math.min(r.max, f.max); total += n; return n; });
    let tris = 0, nReal = 0, trisReal = 0; b.regs.forEach((r, i) => { const u = getUnit(r.k); if (u && r.u.cls !== 'ele') { tris += want[i] * (u.tris * REAL_FRAC + LIGHT_TRIS * (1 - REAL_FRAC)); nReal += want[i]; trisReal += want[i] * u.tris; } else tris += want[i] * (u ? u.tris : 550); });
    this.lodL = LOD_MAX; this.realCap = nReal ? Math.floor(TRI_BUDGET / Math.max(1, trisReal / nReal)) : 0;     // tope de figuras reales a la vez
    const k = Math.min(1, TRI_BUDGET / Math.max(1, tris)), capBy = new Map();
    b.regs.forEach((r, i) => {
      const f = formation(r.u.cls, r.k), F = Math.max(1, Math.round(want[i] * (r.u.cls === 'ele' ? 1 : k))), key = r.k + '|' + r.side;
      const R = { r: r, f: f, F: F, n: F, key: key, far: new Uint8Array(F), fx: new Float32Array(F), fz: new Float32Array(F), yaw: 0, el: null, card: null };
      const w = this.toW(r.x, r.y);
      for (let j = 0; j < F; j++) { const s = this.slot(R, j, w[0], w[1], r.ang); R.fx[j] = s[0]; R.fz[j] = s[1]; }
      this.R.push(R); this.byReg.set(r, R); capBy.set(key, (capBy.get(key) || 0) + F);
    });
    let shCap = 0;
    for (const [key, cap] of capBy) {
      const [uk, side] = key.split('|'), real = getUnit(uk), col = b.cfg.sides[+side].col; let m, a;
      if (real) { const geo = instancedGeometry(real, cap + DEAD); m = new THREE.InstancedMesh(geo, unitMaterialReal(real, col), cap + DEAD); a = geo.attributes.aFrame.array; }
      else { const geo = unitGeometry(uk, col).clone(), anim = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3); anim.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('anim', anim); m = new THREE.InstancedMesh(geo, unitMaterial(), cap); a = anim.array; }
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; this.scene.add(m);
      let lt = null;
      if (real) { const lm = new THREE.InstancedMesh(lightGeometry(real, col), lightMaterial(), cap); lm.instanceMatrix.setUsage(THREE.DynamicDrawUsage); lm.frustumCulled = false; this.scene.add(lm); lt = { m: lm, M: lm.instanceMatrix.array, i: 0 }; }
      this.meshes.set(key, { m: m, a: a, M: m.instanceMatrix.array, i: 0, real: real, lt: lt, dead: [] }); shCap += cap;
    }
    const sg = new THREE.CircleGeometry(1, 8); sg.rotateX(-Math.PI / 2);
    this.shadow = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.26, depthWrite: false }), shCap); this.shadow.frustumCulled = false; this.shadow.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.scene.add(this.shadow);
  }

  slot(R, j, cx, cz, ang) {
    const f = R.f, cols = Math.min(f.cols, R.F), c = j % cols, row = Math.floor(j / cols), rows = Math.ceil(R.n / cols);
    const inRow = row === rows - 1 ? R.n - row * cols : cols;                                  // la última fila, incompleta, va centrada
    const lx = (c - (inRow - 1) / 2) * f.sx + (hash(j * 7.3 + R.r.id) - 0.5) * 0.3, lf = ((rows - 1) / 2 - row) * f.sz + (hash(j * 3.9 + R.r.id) - 0.5) * 0.3, ca = Math.cos(ang), sa = Math.sin(ang);
    return [cx + ca * lf - sa * lx, cz + sa * lf + ca * lx, row];
  }

  addCorpse(x, z, side) {
    const i = this.nCorp % 2600, M = this.corp.instanceMatrix.array, o = i * 16, yaw = hash(this.nCorp * 1.31) * 6.28, c = Math.cos(yaw), s = Math.sin(yaw);
    M[o] = c; M[o + 1] = 0; M[o + 2] = -s; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = 1; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = s; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = this.h(x, z); M[o + 14] = z; M[o + 15] = 1;
    this.corp.setColorAt(i, new THREE.Color(this.b.cfg.sides[side].col).multiplyScalar(0.55));
    this.nCorp++; this.corp.count = Math.min(this.nCorp, 2600); this.corp.instanceMatrix.needsUpdate = true; if (this.corp.instanceColor) this.corp.instanceColor.needsUpdate = true;
  }

  updateArmies(dt) {
    const b = this.b, t = this.t, SM = this.shadow.instanceMatrix.array; let si = 0;
    const cp = this.cam.position; let realUsed = 0, quiere = 0; const L2 = this.lodL * this.lodL, C2 = L2 * LOD_HIST * LOD_HIST; this.nReales = 0; this.nLigeras = 0;
    for (const e of this.meshes.values()) { e.i = 0; if (e.lt) e.lt.i = 0; }
    for (const R of this.R) {
      const r = R.r, e = this.meshes.get(R.key), rout = r.st === 'rout' || r.st === 'fled';
      let n = r.st === 'dead' ? 0 : Math.max(r.men > 0 ? 1 : 0, Math.ceil(R.F * r.men / r.max));
      if (r.st === 'fled') n = 0;
      while (R.n > n) {                                       // bajas: cae alguien de las primeras filas
        const last = R.n - 1, v = Math.floor(hash(last * 3.7 + t) * Math.min(R.n, R.f.cols * 2));
        if (r.st !== 'fled') { if (e.real && e.real.clips.death) { e.dead.push({ x: R.fx[v], z: R.fz[v], yaw: Math.PI / 2 - r.ang + (hash(last + t) - 0.5), t0: t }); if (e.dead.length > DEAD) e.dead.shift(); } else this.addCorpse(R.fx[v], R.fz[v], r.side); }
        R.fx[v] = R.fx[last]; R.fz[v] = R.fz[last]; R.n--;
      }
      if (!R.n) continue;
      const w = this.toW(r.x, r.y), fight = r.fight > 0, vmax = this.b.fase === 'despliegue' ? 1e4 : r.u.spd * S * 2.2 * dt, ryaw = Math.PI / 2 - r.ang;
      // hueco hasta la línea enemiga: las primeras filas avanzan hasta chocar frente con frente
      let gap = 0; if (fight && r.tgt) { const E = this.byReg.get(r.tgt); if (E) gap = (Math.hypot(r.tgt.x - r.x, r.tgt.y - r.y) * S - (Math.ceil(R.n / R.f.cols) * R.f.sz + Math.ceil(E.n / E.f.cols) * E.f.sz) / 2 - 1.3) / 2; gap = Math.min(gap, 4); }
      const shooting = r.ammo > 0 && r.tgt && !fight && r.cd < 1.58 && Math.hypot(r.tgt.x - r.x, r.tgt.y - r.y) <= (r.u.range || 0);
      for (let j = 0; j < R.n; j++) {
        let tx, tz, row = 0;
        if (rout) { tx = R.fx[j] + (hash(j * 5.3 + r.id) - 0.5) * 3; tz = R.fz[j] + (r.side === 0 ? 1 : -1) * 30; }
        else {
          const s = this.slot(R, j, w[0], w[1], r.ang); tx = s[0]; tz = s[1]; row = s[2];
          if (fight && row < 3) { const ph = j * 2.3 + r.id, push = Math.max(0, gap) + 0.5 - row * 0.15; tx += Math.sin(t * 1.7 + ph) * 0.3 + Math.cos(r.ang) * push; tz += Math.cos(t * 1.3 + ph) * 0.3 + Math.sin(r.ang) * push; }
        }
        const dx = tx - R.fx[j], dz = tz - R.fz[j], d = Math.hypot(dx, dz), mv = d > 0.12;
        if (mv) { const st = Math.min(d, vmax * (rout ? 0.7 : 1)); R.fx[j] += dx / d * st; R.fz[j] += dz / d * st; }
        const yaw = mv && d > 0.8 ? Math.atan2(dx, dz) : ryaw, x = R.fx[j], z = R.fz[j], y = this.h(x, z), c = Math.cos(yaw), s = Math.sin(yaw);
        let lt = null;
        if (e.lt) {                                           // nivel de detalle con histéresis; si se agota el tope de reales, también ligera
          const ex = x - cp.x, ey = y - cp.y, ez = z - cp.z, d2 = ex * ex + ey * ey + ez * ez, far = R.far[j];
          if (far ? d2 < C2 : d2 > L2) R.far[j] = far ? 0 : 1;
          if (!R.far[j]) quiere++;
          if (R.far[j] || realUsed >= this.realCap) lt = e.lt; else realUsed++;
        }
        const M = lt ? lt.M : e.M, o = (lt ? lt.i : e.i) * 16, k = e.real ? UNIT_SCALE : 1;
        M[o] = c * k; M[o + 1] = 0; M[o + 2] = -s * k; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = k; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = s * k; M[o + 9] = 0; M[o + 10] = c * k; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = y; M[o + 14] = z; M[o + 15] = 1;
        if (lt) lt.i++;
        else if (e.real) {
          const cl = e.real.clips, ph = hash(j * 3.1 + r.id) * 4; let clip;
          if (rout) clip = cl.run || cl.walk; else if (mv && d > 0.3) clip = (r.corre || r.charge > 0) && cl.run ? cl.run : cl.walk;
          else if (fight && row < 2) clip = (j % 2 && cl.attack_melee2) || cl.attack_melee || cl.attack_ranged || cl.idle;
          else if (shooting && row < 3) clip = cl.attack_ranged || cl.idle; else clip = cl.idle;
          e.a[e.i] = frameOf(clip, t + ph);
        } else { const a = e.a, ao = e.i * 3; a[ao] = mv && d > 0.3 ? (rout || r.corre || r.charge > 0 ? 1.3 : 1) : 0; a[ao + 1] = fight && row < 2 ? 1 : shooting && row < 2 ? 0.7 : 0; a[ao + 2] = j * 1.7 + r.id * 0.9; }
        if (!lt) e.i++;
        const so = si * 16, ss = R.f.sh, sl = ss * 2.4; SM[so] = 0.83 * sl; SM[so + 1] = 0; SM[so + 2] = -0.55 * sl; SM[so + 3] = 0; SM[so + 4] = 0; SM[so + 5] = 1; SM[so + 6] = 0; SM[so + 7] = 0; SM[so + 8] = 0.55 * ss; SM[so + 9] = 0; SM[so + 10] = 0.83 * ss; SM[so + 11] = 0; SM[so + 12] = x + 0.83 * sl * 0.75; SM[so + 13] = y + 0.06; SM[so + 14] = z - 0.55 * sl * 0.75; SM[so + 15] = 1; si++;
      }
    }
    for (const e of this.meshes.values()) {
      if (e.real) {                                             // caídos: la animación de muerte se queda en su último fotograma
        const dc = e.real.clips.death, k = UNIT_SCALE;
        for (const dd of e.dead) { const M = e.M, o = e.i * 16, c = Math.cos(dd.yaw) * k, s = Math.sin(dd.yaw) * k;
          M[o] = c; M[o + 1] = 0; M[o + 2] = -s; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = k; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = s; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = dd.x; M[o + 13] = this.h(dd.x, dd.z); M[o + 14] = dd.z; M[o + 15] = 1;
          e.a[e.i] = frameOnce(dc, t - dd.t0); e.i++; }
        e.m.geometry.attributes.aFrame.needsUpdate = true;
      } else e.m.geometry.attributes.anim.needsUpdate = true;
      e.m.count = e.i; e.m.instanceMatrix.needsUpdate = true;
      if (e.lt) { e.lt.m.count = e.lt.i; e.lt.m.instanceMatrix.needsUpdate = true; this.nLigeras += e.lt.i; this.nReales += e.i; }
    }
    const ahora = performance.now(), rdt = Math.min(0.1, (ahora - (this.lodT || ahora)) / 1000); this.lodT = ahora;      // el radio se ajusta con tiempo real, aunque la batalla esté en pausa
    if (quiere > this.realCap) this.lodL = Math.max(30, this.lodL * Math.exp(-rdt * 4)); else if (quiere < this.realCap * 0.85) this.lodL = Math.min(LOD_MAX, this.lodL * Math.exp(rdt * 1.5));
    this.shadow.count = si; this.shadow.instanceMatrix.needsUpdate = true;
    // estandartes y polvo
    const BM = new THREE.Matrix4(), bc = new THREE.Color(); let bi = 0;
    for (const R of this.R) {
      const r = R.r; if (r.st !== 'ok' || !R.n) continue;
      const w = this.toW(r.x, r.y), x = w[0] + Math.cos(r.ang) * 0.8, z = w[1] + Math.sin(r.ang) * 0.8, sc2 = r.u.cls === 'ele' ? 2 : r.u.cls === 'cav' || r.u.cls === 'gen' ? 1.35 : 1;
      BM.makeRotationY(0.5 + Math.sin(t * 2 + r.id) * 0.12); BM.scale(new THREE.Vector3(sc2, sc2, sc2)); BM.setPosition(x, this.h(x, z), z);
      this.poles.setMatrixAt(bi, BM); this.cloth.setMatrixAt(bi, BM); this.cloth.setColorAt(bi, bc.set(this.sel.has(r) ? '#ffe27a' : b.cfg.sides[r.side].col));
      if (r.side === 0) this.eagles.setMatrixAt(bi, BM); else { BM.makeScale(0, 0, 0); this.eagles.setMatrixAt(bi, BM); }
      bi++;
      if ((r.fight > 0 || R.moving) && hash(t * 31 + r.id) < 0.5 * dt * 60 * 0.25) { const j = Math.floor(hash(t * 17 + r.id) * R.n), o = (this.di++ % this.ND) * 3; this.dp[o] = R.fx[j]; this.dp[o + 1] = this.h(R.fx[j], R.fz[j]) + 0.5; this.dp[o + 2] = R.fz[j]; this.dl[o / 3] = 1; }
      R.moving = Math.hypot(r.x - (R.px || r.x), r.y - (R.py || r.y)) > 0.01; R.px = r.x; R.py = r.y;
    }
    for (const m of [this.poles, this.cloth, this.eagles]) { m.count = bi; m.instanceMatrix.needsUpdate = true; } if (this.cloth.instanceColor) this.cloth.instanceColor.needsUpdate = true;
    for (let i = 0; i < this.ND; i++) if (this.dl[i] > 0) { this.dl[i] -= dt * 0.28; this.dp[i * 3 + 1] += dt * 1.6; this.dp[i * 3] += dt * 0.8; if (this.dl[i] <= 0) this.dp[i * 3 + 1] = -999; }
    this.dust.geometry.attributes.position.needsUpdate = true;
    // proyectiles
    const PM = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc1 = new THREE.Vector3(1, 1, 1), dir = new THREE.Vector3(), zax = new THREE.Vector3(0, 0, 1); let pi = 0;
    for (const f of b.fx) {
      const a = this.toW(f.x0, f.y0), c2 = this.toW(f.x1, f.y1), k = Math.min(1, f.t / 0.45), len = Math.hypot(c2[0] - a[0], c2[1] - a[1]);
      for (let i = 0; i < f.n && pi < 240; i++) {
        const ox = (i - f.n / 2) * 1.6, x = a[0] + (c2[0] - a[0]) * k + ox, z = a[1] + (c2[1] - a[1]) * k, arc = Math.sin(k * Math.PI) * len * 0.22;
        p.set(x, this.h(x, z) + 1.6 + arc, z); dir.set(c2[0] - a[0], Math.cos(k * Math.PI) * len * 0.7, c2[1] - a[1]).normalize(); q.setFromUnitVectors(zax, dir);
        PM.compose(p, q, sc1); this.proj.setMatrixAt(pi++, PM);
      }
    }
    this.proj.count = pi; this.proj.instanceMatrix.needsUpdate = true;
  }

  /* ---------- estandartes y tarjetas ---------- */
  buildFlags() {
    for (const R of this.R) {
      const r = R.r, el = document.createElement('button'); el.className = 'bflag s' + r.side; el.style.setProperty('--c', this.b.cfg.sides[r.side].col);
      el.innerHTML = '<i>' + (r.u.cls === 'ele' ? '🐘' : r.u.g) + '</i><b><u></u></b>';
      el.addEventListener('click', ev => { ev.stopPropagation(); if (performance.now() - (this.tArr || 0) < 400) return; this.hitReg(r); });
      // despliegue: mantener el dedo sobre el estandarte y mover arrastra el regimiento (el resto lo sigue el lienzo)
      el.addEventListener('pointerdown', ev => { if (this.b.fase === 'despliegue' && r.side === 0 && r.st === 'ok' && this.onDown) { this.dragReg = r; this.onDown(ev); } });
      this.flags.appendChild(el); R.el = el; R.bar = el.querySelector('u');
    }
  }
  buildCards() {
    const host = this.opts.cards; if (!host) return; host.innerHTML = '';
    const PN = (typeof Battle !== 'undefined' && Battle.PAPEL_NOMBRE) || {}; // (A4) marca corta del papel: «Ligera», «Pesada», «Lanceros»
    for (const R of this.R) {
      const r = R.r; if (r.side !== 0) continue;
      const el = document.createElement('button'); el.className = 'ucard';
      const img = realPortrait(r.k, this.b.cfg.sides[0].col) || portrait(r.k, this.b.cfg.sides[0].col);
      el.innerHTML = (img ? '<img src="' + img + '" alt="">' : '<span class="g">' + r.u.g + '</span>') + '<em></em><b><u></u></b>' + (PN[r.papel] ? '<s style="position:absolute;left:0;right:0;bottom:9px;text-align:center;font-size:8px;font-weight:700;line-height:1;text-decoration:none;color:#fff;text-shadow:0 1px 2px #000,0 0 3px #000">' + PN[r.papel] + '</s>' : '');
      el.title = (r.name || r.u.n) + (PN[r.papel] ? ' · ' + PN[r.papel] : ''); el.addEventListener('click', () => { if (r.st === 'ok') { if (this.sel.has(r)) this.sel.delete(r); else this.sel.add(r); this.focus(r); } });
      host.appendChild(el); R.card = el; R.cbar = el.querySelector('u'); R.cnum = el.querySelector('em');
    }
  }
  focus(r) { const w = this.toW(r.x, r.y); this.c.x = w[0]; this.c.z = w[1]; this.intro = 1; }
  updateOverlay() {
    const v = new THREE.Vector3(), W = this.host.clientWidth, H = this.host.clientHeight;
    if (this.flags.scrollLeft || this.flags.scrollTop) { this.flags.scrollLeft = 0; this.flags.scrollTop = 0; }
    for (const R of this.R) {
      const r = R.r, ok = r.st === 'ok';
      if (R.card) { R.card.classList.toggle('sel', this.sel.has(r)); R.card.classList.toggle('out', !ok); R.card.classList.toggle('cans', ok && r.fat >= 60); R.cbar.style.width = (r.men / r.max * 100) + '%'; R.cbar.style.background = r.mor / r.morMax > 0.5 ? '#7ddc5a' : r.mor / r.morMax > 0.25 ? '#f0c040' : '#e8503a'; R.cnum.textContent = ok ? r.men : r.st === 'dead' ? '☠' : '🏳'; }
      if (!ok && r.st !== 'rout') { R.el.style.display = 'none'; continue; }
      const w = this.toW(r.x, r.y); let x = w[0], z = w[1];
      if (!ok && R.n) { x = R.fx[0]; z = R.fz[0]; }
      v.set(x, this.h(x, z) + (r.u.cls === 'ele' ? 8 : r.u.cls === 'cav' || r.u.cls === 'gen' ? 5 : 4), z).project(this.cam);
      if (v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1) { R.el.style.display = 'none'; continue; }
      R.el.style.display = ''; R.el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)';
      R.el.classList.toggle('sel', this.sel.has(r)); R.el.classList.toggle('rout', !ok);
      R.bar.style.width = (r.men / r.max * 100) + '%'; R.bar.style.background = r.mor / r.morMax > 0.5 ? '#7ddc5a' : r.mor / r.morMax > 0.25 ? '#f0c040' : '#e8503a';
    }
  }

  /* ---------- órdenes ---------- */
  hitReg(r) {
    if (this.b.over || r.st !== 'ok') return;
    if (r.side === 0) { if (this.sel.has(r)) this.sel.delete(r); else this.sel.add(r); return; }
    if (this.b.fase === 'despliegue') return;
    for (const s of this.sel) if (s.st === 'ok') s.order = { k: 'atk', r: r };
  }
  tapField(fx, fy) {
    const b = this.b; let hit = null, hd = 34;
    for (const r of b.regs) { if (r.st !== 'ok') continue; const d = Math.hypot(r.x - fx, r.y - fy); if (d < hd) { hd = d; hit = r; } }
    const desp = b.fase === 'despliegue';
    if (hit) { if (desp && hit.side !== 0) return; return this.hitReg(hit); }
    const sel = [...this.sel].filter(r => r.st === 'ok'); if (!sel.length) return;
    let cx = 0, cy = 0; sel.forEach(r => { cx += r.x; cy += r.y; }); cx /= sel.length; cy /= sel.length;
    if (desp) { sel.forEach(r => b.colocar(r, fx + (r.x - cx), fy + (r.y - cy))); return; } // despliegue: se coloca, no se ordena
    sel.forEach(r => { r.order = { k: 'move', x: Math.max(20, Math.min(FW - 20, fx + (r.x - cx))), y: Math.max(20, Math.min(b.H - 20, fy + (r.y - cy))) }; r.tgt = null; });
    const w = this.toW(fx, fy); this.marker.position.set(w[0], this.h(w[0], w[1]) + 0.15, w[1]); this.marker.visible = true; this.markT = this.t;
  }
  selectAll() { const all = this.b.regs.filter(r => r.side === 0 && r.st === 'ok'); if (this.sel.size >= all.length) this.sel.clear(); else all.forEach(r => this.sel.add(r)); }
  cycleCam() {
    this.camMode = ((this.camMode || 0) + 1) % 3; this.intro = 1; const c = this.c;
    if (this.camMode === 0) { c.dist = 120; c.pitch = 0.5; c.yaw = 0; }
    else if (this.camMode === 1) { c.dist = 230; c.pitch = 1.25; c.yaw = 0; c.x = 0; c.z = 0; }
    else { c.dist = 34; c.pitch = 0.22; let best = null; for (const r of this.b.regs) if (r.st === 'ok' && r.side === 0 && (r.fight > 0 || !best)) best = r; if (best) { const w = this.toW(best.x, best.y); c.x = w[0]; c.z = w[1]; c.yaw = 0.7; } }
  }

  /* ---------- cámara y gestos ---------- */
  bind() {
    const P = new Map(); let st = null; const cv = this.cv;
    this.onDown = e => { cv.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); this.dragging = true; this.vel = null; if (P.size === 1) st = { x: e.clientX, y: e.clientY, mv: 0, t: performance.now(), rot: e.button === 2 || e.shiftKey }; else if (st) { st.mv = 99; st.d = 0; } this.intro = 1;
      // despliegue: si el dedo cae sobre un regimiento propio, se arrastra él y no la cámara
      if (st && P.size === 1) {
        let dr = this.dragReg; this.dragReg = null; const g = this.pick(e.clientX, e.clientY);
        if (this.b.fase === 'despliegue' && g) {
          const fx = g[0] / S + FW / 2, fy = g[1] / S + this.b.H / 2;
          if (!dr) { let hd = 34; for (const r of this.b.regs) { if (r.st !== 'ok' || r.side !== 0) continue; const d = Math.hypot(r.x - fx, r.y - fy); if (d < hd) { hd = d; dr = r; } } }
          if (dr) st.drag = { r: dr, dx: dr.x - fx, dy: dr.y - fy, mv: false };
        }
      }
    };
    this.onMove = e => {
      if (!P.has(e.pointerId)) return; const pr = P.get(e.pointerId), dx = e.clientX - pr[0], dy = e.clientY - pr[1]; P.set(e.pointerId, [e.clientX, e.clientY]); const c = this.c;
      if (P.size === 1 && st) {
        st.mv += Math.abs(dx) + Math.abs(dy);
        if (st.drag) {
          if (st.mv >= 10) st.drag.mv = true;
          const g = st.drag.mv && this.b.fase === 'despliegue' ? this.pick(e.clientX, e.clientY) : null;
          if (g) this.b.colocar(st.drag.r, g[0] / S + FW / 2 + st.drag.dx, g[1] / S + this.b.H / 2 + st.drag.dy);
        } else if (st.rot) { c.yaw -= dx * 0.006; c.pitch += dy * 0.005; }
        else { const k = c.dist * 0.0021, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), mx = -(dx * cy + dy * sy) * k, mz = -(-dx * sy + dy * cy) * k; c.x += mx; c.z += mz; this.vel = [mx * 60, mz * 60]; }
      } else if (P.size === 2 && st) {
        const v = [...P.values()], d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]), a = Math.atan2(v[1][1] - v[0][1], v[1][0] - v[0][0]);
        if (st.d) { c.dist *= st.d / d; c.yaw -= a - st.a; c.pitch += dy * 0.002; }
        st.d = d; st.a = a;
      }
      this.clampCam();
    };
    this.onUp = e => {
      if (!P.has(e.pointerId)) return; P.delete(e.pointerId); if (!P.size) this.dragging = false;
      if (st && st.drag && !P.size) { this.tArr = performance.now(); if (!st.drag.mv && e.type === 'pointerup') this.hitReg(st.drag.r); st = null; return; }
      if (st && st.mv < 10 && performance.now() - st.t < 500 && e.type === 'pointerup' && !P.size) { const g = this.pick(e.clientX, e.clientY); if (g) this.tapField(g[0] / S + FW / 2, g[1] / S + this.b.H / 2); }
      if (!P.size) st = null; else if (st) st.d = 0;
    };
    this.onWheel = e => { this.c.dist *= e.deltaY > 0 ? 1.1 : 0.9; this.intro = 1; this.clampCam(); e.preventDefault(); };
    this.onCtx = e => e.preventDefault();
    cv.addEventListener('pointerdown', this.onDown); cv.addEventListener('pointermove', this.onMove); cv.addEventListener('pointerup', this.onUp); cv.addEventListener('pointercancel', this.onUp);
    cv.addEventListener('wheel', this.onWheel, { passive: false }); cv.addEventListener('contextmenu', this.onCtx);
  }
  clampCam() { const c = this.c; c.x = Math.max(-90, Math.min(90, c.x)); c.z = Math.max(-this.halfD - 10, Math.min(this.halfD + 10, c.z)); c.dist = Math.max(12, Math.min(330, c.dist)); c.pitch = Math.max(0.12, Math.min(1.45, c.pitch)); }
  pick(cx, cy) {
    const rc = this.cv.getBoundingClientRect(), ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((cx - rc.left) / rc.width * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1), this.cam);
    const o = ray.ray.origin, d = ray.ray.direction; if (d.y >= -0.001) return null;
    let y = 0, x = 0, z = 0; for (let i = 0; i < 4; i++) { const k = (y - o.y) / d.y; x = o.x + d.x * k; z = o.z + d.z * k; y = this.h(x, z); }
    return [x, z];
  }
  placeCam(dt) {
    const c = this.c; let dist = c.dist, pitch = c.pitch, yaw = c.yaw;
    if (this.vel && !this.dragging) { c.x += this.vel[0] * dt; c.z += this.vel[1] * dt; const f = Math.exp(-dt * 5); this.vel[0] *= f; this.vel[1] *= f; if (Math.abs(this.vel[0]) + Math.abs(this.vel[1]) < 0.3) this.vel = null; this.clampCam(); }   // inercia al soltar
    if (this.intro < 1) { this.intro = Math.min(1, this.intro + dt / 3.2); const k = 1 - Math.pow(1 - this.intro, 3); dist = 300 + (c.dist - 300) * k; pitch = 1.0 + (c.pitch - 1.0) * k; yaw = c.yaw + (1 - k) * 0.9; }
    const cp = Math.cos(pitch), ty = this.h(c.x, c.z) + 1.5;
    this.cam.position.set(c.x + Math.sin(yaw) * cp * dist, ty + Math.sin(pitch) * dist, c.z + Math.cos(yaw) * cp * dist);
    const gy = this.h(this.cam.position.x, this.cam.position.z) + 2; if (this.cam.position.y < gy) this.cam.position.y = gy;
    this.cam.lookAt(c.x, ty, c.z);
  }

  resize() { const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1; this.r.setSize(w, h, false); this.cam.aspect = w / h; this.cam.fov = w < h ? 58 : 42; this.cam.updateProjectionMatrix(); }
  draw() {
    const now = performance.now(), dt = Math.min(0.1, (now - this.last) / 1000); this.last = now;
    const k = this.opts.speed ? this.opts.speed() : 1; this.t += dt * k; uTime.value = this.t;
    this.updateArmies(dt * Math.max(k, 0.0001)); this.placeCam(dt); this.updateOverlay();
    if (this.marker.visible) { const a = (this.t - this.markT); this.marker.scale.setScalar(1 + a * 1.5); this.marker.material.opacity = Math.max(0, 0.9 - a * 1.2); if (a > 0.8) this.marker.visible = false; }
    if (this.zonaLinea && this.b.fase !== 'despliegue') { this.scene.remove(this.zonaLinea); this.zonaLinea.geometry.dispose(); this.zonaLinea.material.dispose(); this.zonaLinea = null; }
    this.r.render(this.scene, this.cam);
  }
  dispose() {
    const cv = this.cv; cv.removeEventListener('pointerdown', this.onDown); cv.removeEventListener('pointermove', this.onMove); cv.removeEventListener('pointerup', this.onUp); cv.removeEventListener('pointercancel', this.onUp); cv.removeEventListener('wheel', this.onWheel); cv.removeEventListener('contextmenu', this.onCtx);
    const realMeshes = new Set([...this.meshes.values()].filter(e => e.real).map(e => e.m));
    this.scene.traverse(o => { if (realMeshes.has(o)) return; if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== unitMaterial()) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    if (this.scene.background && this.scene.background.dispose) this.scene.background.dispose();
    cv.remove(); this.flags.remove(); if (this.opts.cards) this.opts.cards.innerHTML = '';
  }
}
