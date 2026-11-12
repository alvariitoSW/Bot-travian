/* AQVILA — vista 3D de la batalla: cada soldado es una figura animada sobre un terreno con relieve */
import { THREE, uTime, unitGeometry, unitMaterial, portrait } from './models.js';
import { applyGround } from './ground.js';
import './sonido.js';             // N8b: define window.Sonido (WebAudio sintetizado)
const SON = () => (typeof window !== 'undefined' && window.Sonido) || null;
import { getStatic, staticInstances, staticMesh, piezaCultura } from './statics.js';
import { getUnit, unitMaterialReal, instancedGeometry, frameOf, frameOnce, realPortrait, UNIT_SCALE, lightGeometry, lightMaterial, LIGHT_TRIS } from './units.js';

const BK = 1.65;                               // edificios y árboles de 0 A.D. agrandados para casar con el tamaño de las figuras
const DEAD = 150;                             // caídos visibles por tipo de unidad
/* Nivel de detalle por soldado: más allá de LOD_LEJOS metros de la cámara se pinta la figura ligera; vuelve a la real
   por debajo de LOD_CERCA (la diferencia evita el parpadeo). REAL_FRAC: parte de soldados que se supone reales al repartir el tope. */
const LOD_MAX = 150, LOD_HIST = 0.87, REAL_FRAC = 0.3;   // el radio real se ajusta solo: 150 m como mucho y menos si hay más figuras reales que el tope (las más cercanas a la cámara son las reales)
const TRI_BUDGET = (navigator.maxTouchPoints > 0 ? 1.0e6 : 1.6e6);

const S = 0.25, HILL_H = 6, MAX_ARBOLES_BOSQUE = 40, ROCA_H = 6, AGUA_Y = -0.55, LECHO_Y = -2.3, VADO_PROF = 0.4;                     // escala simulación -> mundo
let renderer = null;                          // un único contexto WebGL para todas las batallas

function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

function formation(cls, key) {
  if (cls === 'ele') return { cols: 4, sx: 4.4, sz: 5.2, max: 99, sh: 2.6 };
  if (cls === 'cav' || cls === 'gen') return { cols: 6, sx: 2.0, sz: 2.7, max: 30, sh: 1.2 };
  if (cls === 'rng') return { cols: 10, sx: 1.45, sz: 1.5, max: 50, sh: 0.5 };
  if (key === 'falange') return { cols: 10, sx: 1.0, sz: 1.05, max: 60, sh: 0.5 };
  return { cols: 10, sx: 1.15, sz: 1.25, max: 60, sh: 0.5 };
}

/* ---------- L2: alas (grupos de regimientos con corchete dorado) ---------- */
export const ALAS = [['linea', 'Línea'], ['reserva', 'Reserva'], ['ligeros', 'Ligeros'], ['jinetes', 'Jinetes']];
// ala por defecto de un regimiento según su tipo: pesada → Línea, triarios → Reserva, tiradores → Ligeros, caballería → Jinetes
export function alaPorDefecto(r) { return r.k === 'triarii' ? 'reserva' : r.papel === 'tirador' || r.u.cls === 'rng' ? 'ligeros' : r.u.cls === 'cav' || r.u.cls === 'gen' ? 'jinetes' : 'linea'; }

/* ---------- N3: estado dibujado de cada regimiento (derivado de mor, morMax y fat; sin reglas nuevas) ---------- */
// moral: 0 firme, 1 vacilante, 2 desordenado, 3 huye. cansancio: 0 fresco, 1 cansado, 2 agotado
export function estadoReg(r) {
  return { moral: Battle.estadoMoral(r), cans: r.fat >= 70 ? 2 : r.fat >= 40 ? 1 : 0 };
}
export const TIPOS_ORDEN = [['aguantar', 'Aguantar'], ['avanzar', 'Avanzar'], ['cargar', 'Cargar'], ['hostigar', 'Hostigar'], ['relevar', 'Relevar'], ['retirarse', 'Retirarse']];
const COL_ORDEN = { aguantar: '#7fb8ff', avanzar: '#f2cf72', cargar: '#ff5a43', hostigar: '#6fe0a4', relevar: '#4fd3dc', retirarse: '#c8a6ff' };
// tipo de una orden: el que lleva marcado o, si viene de un trazo o un toque, el que se deduce de ella
export function tipoOrden(r) {
  const o = r.order; if (!o) return null; if (o.tipo) return o.tipo;
  if (o.k === 'atk') return 'cargar'; if (o.k === 'quieto') return 'aguantar';
  return o.y > r.y + 40 ? 'retirarse' : 'avanzar';
}

/* ---------- L1: órdenes dibujadas y orden recomendada (funciones puras, sin pantalla) ---------- */
const ordenAtk = (r, e) => ({ k: 'atk', r: e });
function enemigoCerca(b, side, x, y, rad) { let best = null, bd = rad; for (const e of b.regs) { if (e.side === side || e.st !== 'ok') continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } } return best; }
// Orden recomendada para un regimiento propio: { txt, ic, order } (order null = mantener). Retirar si apenas le queda moral o gente.
export function recomendada(r, b) {
  if (!r || r.st !== 'ok') return null;
  const lim = (v, a, z) => Math.max(a, Math.min(z, v));
  if (r.mor / r.morMax < 0.22 || r.men / r.max < 0.28) return { txt: 'Retirar', ic: '↓', order: { k: 'move', x: lim(r.x, 20, b.W - 20), y: Math.min(b.H - 20, r.y + 90) } };
  const en = b.regs.filter(e => e.side !== r.side && e.st === 'ok'); if (!en.length) return { txt: 'Mantener', ic: '■', order: null };
  const cerca = lista => { let best = null, bd = 1e9; for (const e of lista) { const d = Math.hypot(e.x - r.x, e.y - r.y); if (d < bd) { bd = d; best = e; } } return best; };
  const cls = r.u.cls, ne = cerca(en);
  if (cls === 'rng') return { txt: 'Disparar', ic: '➶', order: ordenAtk(r, ne) };
  if (cls === 'cav' || cls === 'gen') {
    const blando = cerca(en.filter(e => e.u.cls === 'rng' || (e.u.cls === 'inf' && e.papel === 'ligera')));
    if (blando) return { txt: 'Cargar', ic: '⚔', order: ordenAtk(r, blando) };
    return { txt: 'Flanquear', ic: '↷', order: { k: 'move', x: lim(ne.x + (ne.x < b.W / 2 ? 70 : -70), 20, b.W - 20), y: lim(ne.y + 14, 20, b.H - 20) } };
  }
  return { txt: 'Cargar', ic: '⚔', order: ordenAtk(r, ne) };
}
// Clasifica un trazo (puntos en coordenadas de simulación, el primero es el inicio). Devuelve { tipo, x, y, enemigo } o null.
export function clasificarTrazo(pts, b) {
  if (!pts || pts.length < 2) return null;
  const a = pts[0], z = pts[pts.length - 1], len = Math.hypot(z[0] - a[0], z[1] - a[1]);
  let ruta = 0; for (let i = 1; i < pts.length; i++) ruta += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  if (ruta < 24) return null;
  if (len < ruta * 0.25 && ruta > 40) return { tipo: 'mantener', x: a[0], y: a[1], enemigo: null };   // círculo = testudo: no existe, se trata como mantener
  let dev = 0; for (const p of pts) { dev = Math.max(dev, Math.abs((z[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (z[1] - a[1])) / Math.max(1, len)); }
  const en = enemigoCerca(b, 0, z[0], z[1], 46);
  let tipo = 'avanzar';
  if ((z[1] - a[1]) > len * 0.6) tipo = 'retirar';
  else if (dev > len * 0.22) tipo = 'flanquear';
  else if (en) tipo = 'cargar';
  if (tipo === 'retirar') return { tipo, x: z[0], y: z[1], enemigo: null };
  return { tipo, x: z[0], y: z[1], enemigo: en };
}

export class BattleView3D {
  constructor(host, battle, opts) {
    this.b = battle; this.host = host; this.sel = new Set(); this.opts = opts || {};
    this.halfD = battle.H * S / 2; this.hw = battle.W * S / 2; this.t = 0; this.last = performance.now();
    if (!renderer) { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12; }
    this.r = renderer; this.cv = renderer.domElement; this.cv.className = 'gl'; host.appendChild(this.cv);
    this.flags = document.createElement('div'); this.flags.className = 'bflags'; host.appendChild(this.flags);
    this.cinta = document.createElement('div'); this.cinta.className = 'bseguir'; this.cinta.hidden = true; host.appendChild(this.cinta); this.seg = { t: 0, ch: null, tCambio: -9, texto: '' }; this.fxSon = new WeakSet(); this.faseAnt = battle.fase; this.sonCh = new WeakMap();
    this.scene = new THREE.Scene(); this.cam = new THREE.PerspectiveCamera(52, 1, 0.5, 900);
    this.c = { x: 0, z: this.halfD * 0.3, dist: 100, yaw: 0, pitch: 0.5 }; this.intro = 0;
    if (battle.fase === 'despliegue') { this.c.z = this.halfD * 0.78; this.c.pitch = 0.8; this.c.dist = 95; this.intro = 1; } /* despliegue: la cámara mira tu zona, por encima de las cartas */
    this.buildWorld(); this.buildArmies(); this.buildFlags(); this.buildCards(); this.bind(); this.buildTrazo(); this.buildAlas(); this.resize();
  }

  /* ---------- terreno ---------- */
  h(x, z) {
    let y = 1.3 * Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.038) + 0.6 * Math.sin(x * 0.09 + z * 0.06 + 2);
    const mx = Math.abs(x) - (this.hw + 9); if (mx > 0) y += Math.min(16, mx * mx * 0.02);
    const att = this.b.cfg.defender === 0 ? -1 : 1, mz = z * att - this.halfD - 6; if (mz > 0) y += Math.min(18, mz * mz * 0.02);   // colinas tras el atacante
    y += this.colina(x, z); y = this.cauce(x, z, y);                                                                                                         // colinas del campo (misma cuadrícula que el motor)
    const dz = -z * att - this.halfD + 14; if (dz > 0) y *= Math.max(0, 1 - dz / 14);                                                  // explanada ante la ciudad
    return y;
  }
  // altura de la colina en el punto del mundo (x,z): interpolación suave de las celdas de altura del motor
  colina(x, z) {
    const T = this.b.tr; if (!T || T.plano) return 0;
    return HILL_H * this.celdasEn(x, z, i => T.alt[i]) + ROCA_H * this.celdasEn(x, z, i => T.ter[i] === 4 ? 1 : 0);   // la roca del paso estrecho se alza aún más
  }
  // interpolación suave de un valor por celda del motor en el punto del mundo (x,z)
  celdasEn(x, z, f) {
    const T = this.b.tr, fx = x / S + this.b.W / 2, fy = z / S + this.b.H / 2, C = this.b.constructor.CELDA || 40;
    const u = Math.max(0, Math.min(T.cols - 1, fx / C - 0.5)), v = Math.max(0, Math.min(T.rows - 1, fy / C - 0.5)), c0 = Math.floor(u), r0 = Math.floor(v), c1 = Math.min(T.cols - 1, c0 + 1), r1 = Math.min(T.rows - 1, r0 + 1), a = u - c0, b = v - r0;
    const g = (c, r) => f(r * T.cols + c);
    return (g(c0, r0) * (1 - a) + g(c1, r0) * a) * (1 - b) + (g(c0, r1) * (1 - a) + g(c1, r1) * a) * b;
  }
  // el lecho del río (y del pantano, algo hundido) baja el suelo; el vado es poco profundo
  cauce(x, z, y) {
    const T = this.b.tr; if (!T || T.plano || !T.banda && !this.hayPantano) return y;
    const d = Math.min(1, this.celdasEn(x, z, i => { const t = T.ter[i]; return t === 1 ? 1 : t === 2 ? VADO_PROF : t === 3 ? 0.12 : 0; }));
    return d > 0 ? y * (1 - Math.min(1, d * 2.5)) + LECHO_Y * d : y;   // el suelo se allana junto al agua para que ningún bulto asome en el vado
  }
  toW(x, y) { return [(x - this.b.W / 2) * S, (y - this.b.H / 2) * S]; }

  buildWorld() {
    const sc = this.scene, hd = this.halfD;
    // N8a: tiempo meteorológico solo visual, fijo por la semilla de la batalla: 0 despejado (60 %), 1 bruma (25 %), 2 lluvia ligera (15 %)
    { const q = hash((this.b.cfg.seed || 1) * 1.7 + 3.3); this.tiempo = q < 0.6 ? 0 : q < 0.85 ? 1 : 2; }
    // cielo
    const sk = document.createElement('canvas'); sk.width = 4; sk.height = 256; const sg = sk.getContext('2d'), gr = sg.createLinearGradient(0, 0, 0, 256);
    const cs = [['#3f78b8', '#9cc3df', '#e6dcc0'], ['#7f9fbb', '#c3d3de', '#e8e4d6'], ['#6c7580', '#98a2aa', '#c4c6c2']][this.tiempo]; gr.addColorStop(0, cs[0]); gr.addColorStop(0.55, cs[1]); gr.addColorStop(0.8, cs[2]); gr.addColorStop(1, cs[2]); sg.fillStyle = gr; sg.fillRect(0, 0, 4, 256);
    const skt = new THREE.CanvasTexture(sk); skt.colorSpace = THREE.SRGBColorSpace; sc.background = skt;
    this.fogBase = [['#d9d6bf', 220, 620], ['#e4e2d4', 90, 420], ['#b4b8b6', 140, 480]][this.tiempo]; sc.fog = new THREE.Fog(this.fogBase[0], this.fogBase[1], this.fogBase[2]); this.fog = sc.fog;
    this.hemi = new THREE.HemisphereLight('#cfe2ff', '#7a6238', 1.25); sc.add(this.hemi);
    const sun = new THREE.DirectionalLight('#ffe6b8', 3.1); sun.position.set(-90, 95, 60); sc.add(sun); this.sun = sun;
    // suelo
    this.hayPantano = !!(this.b.tr && this.b.tr.ter.includes(3));
    const W = this.hw * 2 + 370, Dp = hd * 2 + 320, g = new THREE.PlaneGeometry(W, Dp, Math.round(W / 4.7), 130); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, wt = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), y = this.h(x, z); pos.setY(i, y);
      const n = 0.5 + 0.5 * Math.sin(x * 0.07 + Math.sin(z * 0.05) * 2) * Math.cos(z * 0.09 + x * 0.03), road = Math.abs(x - 18 * Math.sin(z * 0.02));
      let gr = 1 - n * 0.4, di = 0; if (road < 6) { di = 1 - road / 6; gr *= 1 - di; } if (y > 7) { const k = Math.min(1, (y - 7) / 6); di = Math.max(di, k * 0.7); gr *= 1 - k * 0.7; }
      wt[i * 3] = gr; wt[i * 3 + 1] = di; wt[i * 3 + 2] = 0;                       // pesos: hierba, tierra, (empedrado); el resto, hierba seca
    }
    this.ground = new THREE.Mesh(g, applyGround(g, wt, 0.09)); sc.add(this.ground);
    this.buildAgua();
    // árboles en los márgenes: modelos reales si están cargados; si no, conos sencillos
    const att = this.b.cfg.defender === 0 ? -1 : 1;
    if (getStatic('cipres')) {
      const kinds = ['cipres', 'olivo', 'pino', 'algarrobo', 'cipres', 'olivo'], lists = {}, q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < 300; i++) {
        let x, z; const r = hash(i * 7.3);
        if (r < 0.75) { x = (hash(i * 1.7) < 0.5 ? -1 : 1) * (this.hw + 9 + hash(i * 2.9) * 80); z = (hash(i * 4.1) - 0.5) * (hd * 2 + 140); }
        else { x = (hash(i * 1.7) - 0.5) * (this.hw * 2 + 170); z = att * (hd + 16 + hash(i * 2.9) * 100); }
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
      if (r < 0.75) { x = (hash(i * 1.7) < 0.5 ? -1 : 1) * (this.hw + 7 + hash(i * 2.9) * 70); z = (hash(i * 4.1) - 0.5) * (hd * 2 + 120); }
      else { x = (hash(i * 1.7) - 0.5) * (this.hw * 2 + 150); z = att * (hd + 14 + hash(i * 2.9) * 90); }
      const s = 0.7 + hash(i * 9.9) * 0.8; pv.set(x, this.h(x, z) - 0.2, z); sv.set(s, s, s); M.compose(pv, q, sv);
      (i < N ? t1 : t2).setMatrixAt(i % N, M); t3.setMatrixAt(i, M);
    }
    }
    // bosque del campo: pocos árboles de los ya cargados (máx. MAX_ARBOLES_BOSQUE), repartidos por las celdas de bosque
    if (this.b.tr && getStatic('cipres')) {
      const T = this.b.tr, cel = []; for (let i = 0; i < T.bos.length; i++) if (T.bos[i]) cel.push(i);
      const paso = Math.max(1, Math.ceil(cel.length / MAX_ARBOLES_BOSQUE)), lists = {}, kinds = ['pino', 'cipres', 'algarrobo', 'olivo'], qq = new THREE.Quaternion(), upv = new THREE.Vector3(0, 1, 0);
      for (let j = 0, n = 0; j < cel.length && n < MAX_ARBOLES_BOSQUE; j += paso, n++) {
        const i = cel[j], c = i % T.cols, r = Math.floor(i / T.cols), w = this.toW((c + 0.2 + hash(i * 1.3) * 0.6) * 40, (r + 0.2 + hash(i * 2.3) * 0.6) * 40), k = kinds[Math.floor(hash(i * 3.7) * kinds.length)], s2 = UNIT_SCALE * BK * (1.1 + hash(i * 9.1) * 0.5);
        (lists[k] = lists[k] || []).push(new THREE.Matrix4().compose(new THREE.Vector3(w[0], this.h(w[0], w[1]) - 0.2, w[1]), qq.setFromAxisAngle(upv, hash(i) * 6.283), new THREE.Vector3(s2, s2, s2)));
      }
      for (const k in lists) { const t = staticInstances(k, lists[k]); if (t) sc.add(t); }
    }
    // ciudad del defensor
    this.buildCity(-att * (hd + 9), -att);
    // proyectiles, sombras, caídos, selección
    // N8a: proyectiles en vuelo (240) y clavados (200) comparten forma de asta; el color y el largo van por instancia
    const astaG = new THREE.BoxGeometry(0.07, 0.07, 1.5), astaM = () => new THREE.MeshBasicMaterial({ color: '#ffffff' });
    this.proj = new THREE.InstancedMesh(astaG, astaM(), 240); this.proj.count = 0; this.proj.frustumCulled = false; this.proj.setColorAt(0, new THREE.Color('#fff')); sc.add(this.proj);
    this.clav = new THREE.InstancedMesh(astaG, astaM(), 200); this.clav.count = 0; this.clav.frustumCulled = false; this.clav.setColorAt(0, new THREE.Color('#fff')); sc.add(this.clav);
    this.cl = new Float32Array(200 * 8); this.nCl = 0; this.fxHecho = new WeakSet();
    // N8a: mancha oscura bajo cada caído (400, una llamada)
    const mcg = new THREE.CircleGeometry(0.85, 10); mcg.rotateX(-Math.PI / 2);
    this.manchas = new THREE.InstancedMesh(mcg, new THREE.MeshBasicMaterial({ color: '#1c1109', transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 400); this.manchas.count = 0; this.manchas.frustumCulled = false; this.nMan = 0; sc.add(this.manchas);
    // N8a: lluvia ligera: un solo LineSegments de 300 trazos que sigue a la cámara
    if (this.tiempo === 2) {
      this.NR = 300; this.rl = new Float32Array(this.NR * 3); for (let i = 0; i < this.NR; i++) { this.rl[i * 3] = (Math.random() - 0.5) * 90; this.rl[i * 3 + 1] = Math.random() * 40 - 22; this.rl[i * 3 + 2] = (Math.random() - 0.5) * 90; }
      this.rp = new Float32Array(this.NR * 6); const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.BufferAttribute(this.rp, 3)); rgeo.attributes.position.setUsage(THREE.DynamicDrawUsage);
      this.lluvia = new THREE.LineSegments(rgeo, new THREE.LineBasicMaterial({ color: '#b9c5d1', transparent: true, opacity: 0.42, depthWrite: false, fog: false })); this.lluvia.frustumCulled = false; sc.add(this.lluvia);
    }
    const cg = new THREE.BoxGeometry(0.5, 0.22, 1.7); cg.translate(0, 0.12, 0);
    this.corp = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial({ flatShading: true }), 2600); this.corp.count = 0; this.corp.frustumCulled = false; this.nCorp = 0; sc.add(this.corp);
    const mg = new THREE.RingGeometry(1.2, 1.7, 20); mg.rotateX(-Math.PI / 2);
    this.marker = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: '#ffe27a', transparent: true, opacity: 0.9, depthWrite: false })); this.marker.visible = false; sc.add(this.marker);
    // borde de la zona de despliegue: línea clara sobre el suelo, visible solo mientras se coloca
    { const z = this.b.zona(0), pts = [[z.x0, z.y0], [z.x1, z.y0], [z.x1, z.y1], [z.x0, z.y1], [z.x0, z.y0]], v = [];
      for (let i = 0; i < 4; i++) { const n = 24; for (let k = 0; k < n; k++) { const a = pts[i], c = pts[i + 1], w = this.toW(a[0] + (c[0] - a[0]) * k / n, a[1] + (c[1] - a[1]) * k / n), w2 = this.toW(a[0] + (c[0] - a[0]) * (k + 1) / n, a[1] + (c[1] - a[1]) * (k + 1) / n); v.push(w[0], this.h(w[0], w[1]) + 0.5, w[1], w2[0], this.h(w2[0], w2[1]) + 0.5, w2[1]); } }
      const gz = new THREE.BufferGeometry(); gz.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      // marca discreta del terreno en tu zona: contorno de cada celda de colina (ocre) o bosque (verde oscuro)
      const T = this.b.tr, C = 40, vh = [], vb = [];
      if (T && !T.plano) for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) {
        const i = r * T.cols + c, x0 = c * C, y0 = r * C, cx = x0 + C / 2, cy = y0 + C / 2; if (cx < z.x0 || cx > z.x1 || cy < z.y0 || cy > z.y1 || (T.alt[i] < 0.5 && !T.bos[i])) continue;
        const dst = T.bos[i] ? vb : vh, q = [[x0, y0], [x0 + C, y0], [x0 + C, y0 + C], [x0, y0 + C]];
        for (let e = 0; e < 4; e++) { const a = q[e], d = q[(e + 1) % 4], w1 = this.toW(a[0], a[1]), w2 = this.toW(d[0], d[1]); dst.push(w1[0], this.h(w1[0], w1[1]) + 0.4, w1[1], w2[0], this.h(w2[0], w2[1]) + 0.4, w2[1]); }
      }
      this.terrenoLineas = [[vh, '#e0b060'], [vb, '#2f7a3a']].filter(a => a[0].length).map(a => { const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(a[0], 3)); const l = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: a[1], transparent: true, opacity: 0.8, depthTest: false })); l.renderOrder = 4; sc.add(l); return l; });
      this.zonaLinea = new THREE.LineSegments(gz, new THREE.LineBasicMaterial({ color: this.b.cfg.sides[0].col, transparent: true, opacity: 0.95, depthTest: false })); this.zonaLinea.renderOrder = 5; sc.add(this.zonaLinea); }
    // horizonte de montañas
    const rg = new THREE.CylinderGeometry(560, 560, 1, 90, 1, true), rp = rg.attributes.position;
    for (let i = 0; i < rp.count; i++) { const a = Math.atan2(rp.getZ(i), rp.getX(i)); rp.setY(i, rp.getY(i) > 0 ? 28 + 34 * Math.abs(Math.sin(a * 3.1) * Math.cos(a * 7.3 + 1)) + 16 * Math.sin(a * 17) : -20); }
    sc.add(new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: '#8fa7ba', side: THREE.BackSide, fog: false })));
    // hierba y piedras cerca del campo
    const gg = new THREE.ConeGeometry(0.1, 0.34, 3); gg.translate(0, 0.17, 0);
    const grass = new THREE.InstancedMesh(gg, new THREE.MeshLambertMaterial({ color: '#6b8f3a' }), 5200), gm = new THREE.Matrix4();
    for (let i = 0; i < 5200; i++) { const x = (hash(i * 1.37) - 0.5) * (this.hw * 2 + 40), z = (hash(i * 2.11 + 9) - 0.5) * (hd * 2 + 30), s2 = 0.6 + hash(i * 3.3) * 1.3; gm.makeScale(s2, s2 * (0.7 + hash(i * 5.1)), s2); gm.setPosition(x, this.h(x, z) - 0.03, z); grass.setMatrixAt(i, gm); grass.setColorAt(i, new THREE.Color().setHSL(0.19 + hash(i * 7.7) * 0.08, 0.42, 0.36 + hash(i * 9.1) * 0.12)); }
    sc.add(grass);
    const rkg = new THREE.DodecahedronGeometry(0.6, 0), rocks = new THREE.InstancedMesh(rkg, new THREE.MeshLambertMaterial({ color: '#9a9484', flatShading: true }), 160);
    for (let i = 0; i < 160; i++) { const x = (hash(i * 4.7) - 0.5) * (this.hw * 2 + 60), z = (hash(i * 8.3 + 2) - 0.5) * (hd * 2 + 60), s2 = 0.4 + hash(i * 2.9) * 1.6; gm.makeScale(s2, s2 * 0.6, s2); gm.setPosition(x, this.h(x, z) + 0.05, z); rocks.setMatrixAt(i, gm); }
    sc.add(rocks);
    // polvo
    const dc = document.createElement('canvas'); dc.width = dc.height = 64; const dg = dc.getContext('2d'), rgd = dg.createRadialGradient(32, 32, 2, 32, 32, 32); rgd.addColorStop(0, 'rgba(255,255,255,0.9)'); rgd.addColorStop(1, 'rgba(255,255,255,0)'); dg.fillStyle = rgd; dg.fillRect(0, 0, 64, 64);
    this.ND = 700; this.dp = new Float32Array(this.ND * 3).fill(-999); this.dv = new Float32Array(this.ND * 3); this.dl = new Float32Array(this.ND); this.di = 0;
    this.dS = new Float32Array(this.ND); this.dA = new Float32Array(this.ND); this.dS0 = new Float32Array(this.ND); this.dA0 = new Float32Array(this.ND); this.dDec = new Float32Array(this.ND);
    const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(this.dp, 3)); dgeo.setAttribute('aS', new THREE.BufferAttribute(this.dS, 1)); dgeo.setAttribute('aA', new THREE.BufferAttribute(this.dA, 1));
    for (const n of ['position', 'aS', 'aA']) dgeo.attributes[n].setUsage(THREE.DynamicDrawUsage);
    this.dustU = { map: { value: new THREE.CanvasTexture(dc) }, uCol: { value: new THREE.Color('#c9b48a') }, uScale: { value: 300 } };   // color de la tierra del campo
    this.dust = new THREE.Points(dgeo, new THREE.ShaderMaterial({ uniforms: this.dustU, transparent: true, depthWrite: false,
      vertexShader: 'attribute float aS; attribute float aA; varying float vA; uniform float uScale; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(90.0, aS * uScale / max(0.1, -mv.z)); vA = aA; }',
      fragmentShader: 'uniform sampler2D map; uniform vec3 uCol; varying float vA; void main(){ float a = texture2D(map, gl_PointCoord).a * vA; gl_FragColor = vec4(uCol, a); }' })); this.dust.frustumCulled = false; sc.add(this.dust);
    // estandartes 3D
    const pg = new THREE.CylinderGeometry(0.05, 0.05, 4.6, 5); pg.translate(0, 2.3, 0);
    const fg = new THREE.PlaneGeometry(1.0, 0.8, 4, 1); fg.translate(0.53, 4.05, 0);
    const n = this.b.regs.length;
    this.poles = new THREE.InstancedMesh(pg, new THREE.MeshLambertMaterial({ color: '#4a3420' }), n); this.cloth = new THREE.InstancedMesh(fg, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), n);
    // L2: tela rota (jirones), águila, signo (disco) y vexillum (travesaño); la insignia depende del tipo
    const sh = new THREE.Shape(); [[0, .8], [1, .8], [.92, .56], [1, .4], [.78, .3], [.9, 0], [.52, .2], [.28, 0], [0, .12]].forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
    const rgj = new THREE.ShapeGeometry(sh); rgj.translate(0.03, 3.65, 0);
    this.clothR = new THREE.InstancedMesh(rgj, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), n);
    const eg = new THREE.OctahedronGeometry(0.28, 0); eg.scale(1.6, 0.9, 0.5); eg.translate(0, 4.75, 0);
    const dg2 = new THREE.CylinderGeometry(0.22, 0.22, 0.07, 10); dg2.rotateX(Math.PI / 2); dg2.translate(0, 4.78, 0);
    const bg = new THREE.BoxGeometry(1.1, 0.07, 0.07); bg.translate(0.55, 4.48, 0);
    const mi = g => new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#2a2008' }), n);
    this.eagles = mi(eg); this.discos = mi(dg2); this.barras = mi(bg);
    this.meshB = [this.poles, this.cloth, this.clothR, this.eagles, this.discos, this.barras];
    for (const m of this.meshB) { m.frustumCulled = false; m.count = 0; sc.add(m); }
  }

  // agua (río y vados) y pantano: planos sobre las celdas del motor, sin arte nuevo
  buildAgua() {
    const T = this.b.tr, sc = this.scene; if (!T || T.plano) return;
    const C = this.b.constructor.CELDA || 40, vA = [], vV = [], vP = [];
    const quad = (arr, c, r, fy) => {
      const x0 = c * C, y0 = r * C, P = [this.toW(x0, y0), this.toW(x0 + C, y0), this.toW(x0 + C, y0 + C), this.toW(x0, y0 + C)], Y = P.map(w => fy(w[0], w[1]));
      for (const k of [0, 3, 1, 1, 3, 2]) arr.push(P[k][0], Y[k], P[k][1]);
    };
    for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) {
      const t = T.ter[r * T.cols + c];
      if (t === 1 || t === 2) quad(vA, c, r, () => AGUA_Y); if (t === 2) quad(vV, c, r, () => AGUA_Y + 0.07);
    }
    const mk = (v, color, op, ro) => { if (!v.length) return; const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); gg.computeVertexNormals(); const m = new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = ro; sc.add(m); return m; };
    this.agua = mk(vA, '#3b7fa8', 0.84, 1); mk(vV, '#9ccdd0', 0.5, 2);
    if (this.hayPantano) {   // pantano: una capa de textura suave (barro verdoso con charcas) pegada al suelo
      const cw = 512, ch = Math.round(512 * this.b.H / this.b.W), cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const g = cv.getContext('2d'), kx = cw / this.b.W, ky = ch / this.b.H;
      for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) if (T.ter[r * T.cols + c] === 3) {
        const x = (c + 0.5) * C * kx, y = (r + 0.5) * C * ky, R = C * 1.05 * kx, gr = g.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, 'rgba(66,86,40,0.92)'); gr.addColorStop(0.6, 'rgba(74,92,44,0.8)'); gr.addColorStop(1, 'rgba(80,98,48,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill();
      }
      for (let i = 0; i < 70; i++) { const c = Math.floor(hash(i * 3.1) * T.cols), r = Math.floor(hash(i * 5.3) * T.rows); if (T.ter[r * T.cols + c] !== 3) continue; g.fillStyle = 'rgba(52,86,92,0.75)'; g.beginPath(); g.ellipse((c + hash(i)) * C * kx, (r + hash(i * 2)) * C * ky, 5 + hash(i * 7) * 6, 2.5 + hash(i * 9) * 3, 0, 0, 7); g.fill(); }
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const pg = new THREE.PlaneGeometry(this.hw * 2, this.halfD * 2, 100, 80); pg.rotateX(-Math.PI / 2);
      const pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) pp.setY(i, this.h(pp.getX(i), pp.getZ(i)) + 0.12);
      const pm = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false })); pm.renderOrder = 1; sc.add(pm);
    }
    const roca = []; for (let i = 0; i < T.ter.length; i++) if (T.ter[i] === 4) roca.push(i);
    if (roca.length) {   // peñas sobre la muralla de roca del paso estrecho
      const rk = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.7, 0), new THREE.MeshLambertMaterial({ color: '#8f897b', flatShading: true }), roca.length * 2), gm = new THREE.Matrix4();
      roca.forEach((i, j) => { for (let k = 0; k < 2; k++) { const c = i % T.cols, r = Math.floor(i / T.cols), w = this.toW((c + 0.15 + hash(i * 1.7 + k) * 0.7) * C, (r + 0.15 + hash(i * 2.9 + k) * 0.7) * C), s2 = 0.7 + hash(i * 4.1 + k) * 1.2; gm.makeScale(s2, s2 * 0.8, s2); gm.setPosition(w[0], this.h(w[0], w[1]) + 0.4, w[1]); rk.setMatrixAt(j * 2 + k, gm); } });
      sc.add(rk);
    }
  }

  buildCity(zc, dir) {
    if (getStatic('muro') && getStatic('casa')) return this.buildRealCity(zc, dir);
    const wall = this.b.cfg.wall || 0, sc = this.scene, y0 = 0, parts = [], cols = [];
    const add = (geo, color) => { const g = geo.index ? geo.toNonIndexed() : geo, n = g.attributes.position.count, c = new THREE.Color(color), ca = new Float32Array(n * 3); for (let i = 0; i < n; i++) { ca[i * 3] = c.r; ca[i * 3 + 1] = c.g; ca[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); parts.push(g); };
    const box = (w, h, d, x, y, z, color) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); add(g, color); };
    const hW = wall > 0 ? 3 + wall * 0.7 : 0;
    if (wall > 0) {
      box(this.hw * 2 + 80, hW, 2.4, 0, y0 + hW / 2, zc, '#b9ad94'); box(this.hw * 2 + 80, 0.5, 3, 0, y0 + hW, zc, '#a59a82');
      for (let x = -(this.hw + 37); x <= this.hw + 37; x += 2.4) box(1.2, 0.9, 0.7, x, y0 + hW + 0.7, zc - dir * 1.1, '#b9ad94');
      for (let x = -(this.hw + 30); x <= this.hw + 30; x += 30) { box(6, hW + 3, 6, x, y0 + (hW + 3) / 2, zc, '#a89c84'); box(6.8, 0.6, 6.8, x, y0 + hW + 3, zc, '#8f846e'); for (const dx of [-2.6, 0, 2.6]) box(1.2, 1, 6.8, x + dx, y0 + hW + 3.7, zc, '#a89c84'); }
      box(11, hW + 4.5, 5, 0, y0 + (hW + 4.5) / 2, zc, '#a89c84'); box(5, hW * 0.85, 5.4, 0, y0 + hW * 0.42, zc, '#3a2a1a');
      const rf = new THREE.ConeGeometry(8.5, 3, 4); rf.rotateY(Math.PI / 4); rf.translate(0, y0 + hW + 6, zc); add(rf, '#a8492e');
    }
    for (let i = 0; i < Math.round(70 * this.hw / 75); i++) {
      const x = (hash(i * 3.3) - 0.5) * (this.hw * 2 + 60), z = zc + dir * (7 + hash(i * 5.1) * 60), w = 5 + hash(i * 1.9) * 6, d = 5 + hash(i * 2.3) * 6, h = 3 + hash(i * 6.7) * 4;
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
      const nw = Math.ceil((this.hw + 8) / seg); for (let i = -nw; i <= nw; i++) { const x = i * seg; if (i === 0) { const g = staticMesh('puerta', col); if (g) { g.applyMatrix4(M(0, 0, zc, rot, 1, hy)); sc.add(g); } } else walls.push(M(x, 0, zc, rot, 1, hy)); towers.push(M(x + seg / 2, 0, zc - dir * 0.5, rot, 1, hy)); }
      for (const g of [staticInstances('muro', walls, col), staticInstances('torre', towers, col)]) if (g) sc.add(g);
    }
    const houses = [];
    for (let i = 0; i < Math.round(50 * this.hw / 75); i++) { const x = (hash(i * 3.3) - 0.5) * (this.hw * 2 + 150), z = zc + dir * (18 + hash(i * 5.1) * 110); if (Math.abs(x) < 36 && Math.abs(z - zc) < 100) continue; houses.push(M(x, 0, z, q.setFromAxisAngle(up, Math.round(hash(i * 7.7) * 4) * Math.PI / 2).clone())); }
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
    let f = R.f;
    const B = typeof Battle !== 'undefined' ? Battle : null, r0 = R.r;   // N7: forma del motor (metros de simulación, hombres reales) pasada a las pocas figuras dibujadas
    if (B && B.forma) { try { const n = Math.max(R.F, r0.men || R.F), m = B.forma(r0, n); if (m && m.sep > 0 && m.files > 0) { const k = Math.sqrt(n / R.F), cl = Math.max(1, Math.round(m.files / k)), sp = m.sep * S * k; f = { cols: cl, sx: Math.max(sp, f.sx * 0.85), sz: Math.max(sp, f.sz * 0.85) }; } } catch (e) { /* sin forma: se queda lo de hoy */ } }
    const cols = Math.min(f.cols, R.F), c = j % cols, row = Math.floor(j / cols), rows = Math.ceil(R.n / cols);
    const inRow = row === rows - 1 ? R.n - row * cols : cols;                                  // la última fila, incompleta, va centrada
    const lx = (c - (inRow - 1) / 2) * f.sx + (hash(j * 7.3 + R.r.id) - 0.5) * 0.3, lf = ((rows - 1) / 2 - row) * f.sz + (hash(j * 3.9 + R.r.id) - 0.5) * 0.3, ca = Math.cos(ang), sa = Math.sin(ang);
    return [cx + ca * lf - sa * lx, cz + sa * lf + ca * lx, row];
  }

  addCorpse(x, z, side) {
    const i = this.nCorp % 2600, M = this.corp.instanceMatrix.array, o = i * 16, yaw = hash(this.nCorp * 1.31) * 6.28, c = Math.cos(yaw), s = Math.sin(yaw);
    M[o] = c; M[o + 1] = 0; M[o + 2] = -s; M[o + 3] = 0; M[o + 4] = 0; M[o + 5] = 1; M[o + 6] = 0; M[o + 7] = 0; M[o + 8] = s; M[o + 9] = 0; M[o + 10] = c; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = this.h(x, z); M[o + 14] = z; M[o + 15] = 1;
    this.corp.setColorAt(i, new THREE.Color(this.b.cfg.sides[side].col).multiplyScalar(0.55));
    this.addMancha(x, z); this.nCorp++; this.corp.count = Math.min(this.nCorp, 2600); this.corp.instanceMatrix.needsUpdate = true; if (this.corp.instanceColor) this.corp.instanceColor.needsUpdate = true;
  }

  /* ---------- N8a: espectáculo (polvo, proyectiles, caídos, luz y postura), todo visual ---------- */
  // un punto de polvo: posición, velocidad, tamaño (m), opacidad y rapidez con que se apaga
  emite(x, y, z, vx, vy, vz, size, alpha, decay) {
    const i = this.di++ % this.ND, o = i * 3; this.dp[o] = x; this.dp[o + 1] = y; this.dp[o + 2] = z; this.dv[o] = vx; this.dv[o + 1] = vy; this.dv[o + 2] = vz;
    this.dl[i] = 1; this.dS0[i] = size; this.dA0[i] = alpha; this.dDec[i] = decay;
  }
  animaTierra(dt) {
    if (this.cv.height) this.dustU.uScale.value = this.cv.height / 2;
    const dp = this.dp, dv = this.dv, amort = Math.max(0, 1 - 1.3 * dt);
    for (let i = 0; i < this.ND; i++) {
      if (this.dl[i] <= 0) continue;
      this.dl[i] -= this.dDec[i] * dt; const o = i * 3;
      if (this.dl[i] <= 0) { dp[o + 1] = -999; this.dA[i] = 0; continue; }
      dp[o] += dv[o] * dt; dp[o + 1] += dv[o + 1] * dt; dp[o + 2] += dv[o + 2] * dt; dv[o] *= amort; dv[o + 1] *= amort; dv[o + 2] *= amort;
      const e = 1 - this.dl[i]; this.dS[i] = this.dS0[i] * (1 + e * 1.8); this.dA[i] = this.dA0[i] * this.dl[i] * Math.min(1, e * 10);
    }
    const at = this.dust.geometry.attributes; at.position.needsUpdate = true; at.aS.needsUpdate = true; at.aA.needsUpdate = true;
  }
  // emisores de polvo por regimiento: carga, choque, marcha rápida, cambio de formación, huida y combate; más con el cansancio
  emiteTierra(dt) {
    if (!(dt > 0)) return; const dd = Math.min(dt, 0.25), R_ = Math.random, B = this.b;
    const num = x => { const n = Math.floor(x + R_()); return Math.min(n, 8); };
    for (const R of this.R) {
      const r = R.r; if (!R.n || r.st === 'dead' || r.st === 'fled') continue;
      const ca = Math.cos(r.ang), sa = Math.sin(r.ang), fat = 1 + Math.min(100, r.fat || 0) / 100, filas = Math.ceil(R.n / R.f.cols);
      const fig = () => { const j = Math.floor(R_() * R.n); return [R.fx[j], R.fz[j]]; };
      const pie = (n, tam, al, dec, atras, alto) => { for (let i = 0; i < n; i++) { const p = fig(), d = atras * (0.4 + R_()), y = this.h(p[0], p[1]) + 0.3; this.emite(p[0] - ca * d + (R_() - 0.5) * 2, y, p[1] - sa * d + (R_() - 0.5) * 2, -ca * atras * 0.4 + (R_() - 0.5) * 0.8, alto * (0.5 + R_()), -sa * atras * 0.4 + (R_() - 0.5) * 0.8, tam * (0.8 + R_() * 0.5), al, dec); } };
      if (r.st === 'rout') { pie(num(30 * fat * dd), 3.4, 0.24, 0.8, 1.5, 1.0); continue; }
      if (r.st !== 'ok') continue;
      if (r.charge > 0) pie(num(48 * fat * dd), 4.6, 0.36, 0.45, 3.5, 1.1);                       // nube densa y ancha tras la línea
      if (r.choque > 0) {                                                                         // estallido en el frente al entrar el choque, y polvo continuo mientras dura
        if (!R.pch) { const w = this.toW(r.x, r.y), an = R.f.cols * R.f.sx; for (let i = 0; i < 16; i++) { const l = (R_() - 0.5) * an, fx = w[0] + ca * (filas * R.f.sz / 2 + 1) - sa * l, fz = w[1] + sa * (filas * R.f.sz / 2 + 1) + ca * l; this.emite(fx, this.h(fx, fz) + 0.5, fz, (R_() - 0.5) * 4 + ca * 1.5, 1.4 + R_() * 1.6, (R_() - 0.5) * 4 + sa * 1.5, 5, 0.42, 0.7); } }
        pie(num(18 * fat * dd), 4.2, 0.3, 0.6, 0.6, 1.4);
      }
      R.pch = r.choque > 0;
      if (r.corre && R.moving && !(r.charge > 0)) pie(num(11 * fat * dd), 2.6, 0.2, 0.9, 2.0, 0.6);   // marcha rápida: polvo bajo los pies
      if (r.trans > 0) pie(num(9 * dd), 3.2, 0.14, 0.6, 0.5, 0.5);                                // formación en cambio: polvo suave
      if (r.fight > 0) pie(num(6 * fat * dd), 3, 0.2, 0.7, 0.4, 0.8);
    }
  }
  addMancha(x, z) {
    const i = this.nMan % 400, M = this.manchas.instanceMatrix.array, o = i * 16, k = 0.8 + hash(this.nMan * 2.3) * 0.7, y = this.h(x, z) + 0.05;
    M.fill(0, o, o + 16); M[o] = k; M[o + 5] = 1; M[o + 10] = k * (0.8 + hash(this.nMan * 5.1) * 0.4); M[o + 12] = x; M[o + 13] = y; M[o + 14] = z; M[o + 15] = 1;
    this.nMan++; this.manchas.count = Math.min(this.nMan, 400); this.manchas.instanceMatrix.needsUpdate = true;
  }
  // tipo de proyectil por clave de unidad: 0 jabalina, 1 flecha, 2 piedra de honda
  tipoProy(k) { k = String(k || ''); return /hond|bale|sling/.test(k) ? 2 : /arque|sagit|cret|toxo/.test(k) ? 1 : 0; }
  dibujaProyectiles(dt) {
    const KP = [{ arc: 0.10, add: 0.8, sc: [1, 1, 1.05], col: '#6b4a28' }, { arc: 0.28, add: 1.5, sc: [0.8, 0.8, 0.8], col: '#2a1c10' }, { arc: 0.04, add: 0.3, sc: [1.9, 1.9, 0.12], col: '#8a8478' }];
    const PM = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), dir = new THREE.Vector3(), zax = new THREE.Vector3(0, 0, 1), cc = new THREE.Color(); let pi = 0;
    for (const f of this.b.fx) {
      const ty = this.tipoProy(f.k), K = KP[ty], a = this.toW(f.x0, f.y0), c2 = this.toW(f.x1, f.y1), k = Math.min(1, f.t / 0.45), len = Math.hypot(c2[0] - a[0], c2[1] - a[1]), apex = len * K.arc + K.add;
      for (let i = 0; i < f.n && pi < 240; i++) {
        const ox = (hash(i * 3.7 + f.x0) - 0.5) * 3.2, oz = (hash(i * 5.9 + f.y0) - 0.5) * 3.2, sx = a[0] + ox * 0.4, sz = a[1] + oz * 0.4, ex = c2[0] + ox, ez = c2[1] + oz;
        const ys = this.h(sx, sz) + 1.6, ye = this.h(ex, ez) + 0.9;
        if (k >= 1) {                                                                          // llegada: queda clavado (jabalina, flecha) o solo levanta polvo (piedra)
          if (!this.fxHecho.has(f)) {
            dir.set(ex - sx, (ye - ys) - 4 * apex, ez - sz).normalize();
            this.emite(ex, ye - 0.6, ez, (R_ => (R_() - 0.5) * 0.8)(Math.random), 0.9, (Math.random() - 0.5) * 0.8, 1.6, 0.3, 1.6);
            if (ty < 2) { const o = (this.nCl++ % 200) * 8, c = this.cl; c[o] = ex; c[o + 1] = ye - 0.6; c[o + 2] = ez; c[o + 3] = dir.x; c[o + 4] = dir.y; c[o + 5] = dir.z; c[o + 6] = this.t; c[o + 7] = ty; }
          }
          continue;
        }
        const x = sx + (ex - sx) * k, z = sz + (ez - sz) * k, y = ys + (ye - ys) * k + 4 * apex * k * (1 - k);
        p.set(x, y, z); dir.set(ex - sx, (ye - ys) + 4 * apex * (1 - 2 * k), ez - sz).normalize(); q.setFromUnitVectors(zax, dir); sv.set(K.sc[0], K.sc[1], K.sc[2]);
        PM.compose(p, q, sv); this.proj.setMatrixAt(pi, PM); this.proj.setColorAt(pi++, cc.set(K.col));
      }
      if (k >= 1) this.fxHecho.add(f);
    }
    this.proj.count = pi; this.proj.instanceMatrix.needsUpdate = true; if (this.proj.instanceColor) this.proj.instanceColor.needsUpdate = true;
    // clavados: 3,6 s en el suelo; el último medio segundo se hunden
    let ci = 0; const c = this.cl, n = Math.min(this.nCl, 200);
    for (let j = 0; j < n; j++) {
      const o = j * 8, age = this.t - c[o + 6]; if (age < 0 || age > 3.6) continue; const K = KP[c[o + 7]], hund = age > 3 ? 1 - (age - 3) / 0.6 : 1, h2 = 0.75 * K.sc[2] * hund;
      dir.set(c[o + 3], c[o + 4], c[o + 5]); q.setFromUnitVectors(zax, dir); p.set(c[o] - dir.x * h2, c[o + 1] - dir.y * h2, c[o + 2] - dir.z * h2); sv.set(K.sc[0], K.sc[1], K.sc[2] * hund);
      PM.compose(p, q, sv); this.clav.setMatrixAt(ci, PM); this.clav.setColorAt(ci++, cc.set(K.col));
    }
    this.clav.count = ci; this.clav.instanceMatrix.needsUpdate = true; if (this.clav.instanceColor) this.clav.instanceColor.needsUpdate = true;
  }
  // luz según el tiempo de la batalla (mañana clara -> ámbar bajo) y tiempo meteorológico; la lluvia cae pegada a la cámara
  luzTiempo(dtR) {
    const u0 = Math.min(1, (this.b.t || 0) / 420), u = u0 * u0 * (3 - 2 * u0), w = this.tiempo, C = this._lc = this._lc || { a: new THREE.Color(), b: new THREE.Color() };
    const mul = w === 2 ? 0.55 : w === 1 ? 0.8 : 1;
    this.sun.color.set('#fff4e2').lerp(C.a.set('#ffa04a'), u); this.sun.intensity = (3.1 - 1.0 * u) * mul; this.sun.position.set(-90, 95 - 50 * u, 60 + 35 * u);
    this.hemi.color.set('#cfe2ff').lerp(C.a.set('#ffd8b0'), u * 0.8); this.hemi.intensity = (1.25 - 0.3 * u) * (w === 2 ? 0.85 : 1);
    this.fog.color.set(this.fogBase[0]).lerp(C.a.set(w === 2 ? '#a9a8a2' : '#e2c79c'), u * (w === 2 ? 0.4 : 0.6));
    if (this.lluvia) {
      const rl = this.rl, rp = this.rp, cp = this.cam.position, v = 26 * dtR;
      for (let i = 0; i < this.NR; i++) { const o = i * 3; rl[o + 1] -= v * (0.8 + (i % 5) * 0.1); if (rl[o + 1] < -22) rl[o + 1] += 40; const q = i * 6; rp[q] = rl[o]; rp[q + 1] = rl[o + 1]; rp[q + 2] = rl[o + 2]; rp[q + 3] = rl[o] + 0.35; rp[q + 4] = rl[o + 1] - 2.4; rp[q + 5] = rl[o + 2] + 0.12; }
      this.lluvia.position.set(cp.x, cp.y, cp.z); this.lluvia.geometry.attributes.position.needsUpdate = true;
    }
  }
  // postura: «listo» (en combate, enemigo cerca o forma cerrada) frente a «relajado»; cambio suave
  postura(R, dt, rout) {
    const r = R.r, k = r.k, cls = r.u.cls; if (R.lean === undefined) { R.lean = 0; R.hs = 1; R.listo = 0; }
    R.lin = cls === 'inf' || cls === 'spear' || cls === 'rng';
    let cerca = r.fight > 0; if (!cerca) for (const e of this.b.regs) if (e.side !== r.side && e.st === 'ok' && (e.x - r.x) * (e.x - r.x) + (e.y - r.y) * (e.y - r.y) < 3600) { cerca = true; break; }
    const falg = k === 'falange' || k === 'hoplitas' || r.form === 'falange', test = r.form === 'testudo', listo = !rout && (cerca || falg || test || r.form === 'orbe');
    let lean = 0, hs = 1; if (listo) { hs = 0.95; lean = R.lin ? 0.125 : 0; if (falg && R.lin) lean = 0.245; } if (test && !rout) { lean = 0; hs = 0.92; }
    const a = Math.min(1, dt * 3); R.lean += (lean - R.lean) * a; R.hs += (hs - R.hs) * a; R.listo += ((listo ? 1 : 0) - R.listo) * a;
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
        if (r.st !== 'fled') { if (e.real && e.real.clips.death) { e.dead.push({ x: R.fx[v], z: R.fz[v], yaw: Math.PI / 2 - r.ang + (hash(last + t) - 0.5), t0: t }); this.addMancha(R.fx[v], R.fz[v]); if (e.dead.length > DEAD) e.dead.shift(); } else this.addCorpse(R.fx[v], R.fz[v], r.side); }
        R.fx[v] = R.fx[last]; R.fz[v] = R.fz[last]; R.n--;
      }
      if (!R.n) continue;
      const w = this.toW(r.x, r.y), fight = r.fight > 0, vmax = this.b.fase === 'despliegue' ? 1e4 : r.u.spd * S * 2.2 * dt, ryaw = Math.PI / 2 - r.ang;
      // hueco hasta la línea enemiga: las primeras filas avanzan hasta chocar frente con frente
      let gap = 0; if (fight && r.tgt) { const E = this.byReg.get(r.tgt); if (E) gap = (Math.hypot(r.tgt.x - r.x, r.tgt.y - r.y) * S - (Math.ceil(R.n / R.f.cols) * R.f.sz + Math.ceil(E.n / E.f.cols) * E.f.sz) / 2 - 1.3) / 2; gap = Math.min(gap, 4); }
      this.postura(R, dt, rout);
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
        const ln = R.lin ? R.lean + (1 - R.listo) * 0.03 * Math.sin(t * 0.8 + j * 1.3) : 0, sl_ = Math.sin(ln), cl_ = Math.cos(ln), kh = k * R.hs;   // N8a: inclinación hacia delante y altura según la postura
        M[o] = c * k; M[o + 1] = 0; M[o + 2] = -s * k; M[o + 3] = 0; M[o + 4] = kh * sl_ * s; M[o + 5] = kh * cl_; M[o + 6] = kh * sl_ * c; M[o + 7] = 0; M[o + 8] = s * k * cl_; M[o + 9] = -k * sl_; M[o + 10] = c * k * cl_; M[o + 11] = 0; M[o + 12] = x; M[o + 13] = y; M[o + 14] = z; M[o + 15] = 1;
        if (lt) lt.i++;
        else if (e.real) {
          const cl = e.real.clips, ph = hash(j * 3.1 + r.id) * 4 * (1 - R.listo) + (r.id * 0.7 % 4) * R.listo; let clip;
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
    const BM = new THREE.Matrix4(), RZ = new THREE.Matrix4(), SV = new THREE.Vector3(), bc = new THREE.Color(), gris = new THREE.Color('#8c8a84'); const cnt = { cl: 0, cr: 0, aq: 0, sg: 0, vx: 0 }; let bi = 0;
    for (const R of this.R) {
      const r = R.r; if (r.st !== 'ok' || !R.n) continue;
      const w = this.toW(r.x, r.y), x = w[0] + Math.cos(r.ang) * 0.8, z = w[1] + Math.sin(r.ang) * 0.8, sc2 = r.u.cls === 'ele' ? 2 : r.u.cls === 'cav' || r.u.cls === 'gen' ? 1.35 : 1;
      // L2: la tela dice la moral (entera, rota, caída) y el cansancio (más pálida y de ondeo lento)
      const mo = r.mor / r.morMax, nivel = mo > 0.55 ? 0 : mo > 0.28 ? 1 : 2, can = Math.min(1, Math.max(0, (r.fat || 0) / 100));
      BM.makeRotationY(0.5 + Math.sin(t * (2.2 - 1.5 * can) + r.id) * (0.12 - 0.05 * can));
      if (nivel === 2) { RZ.makeRotationZ(-0.75 - 0.15 * Math.sin(t * 1.3 + r.id)); BM.multiply(RZ); }
      SV.set(sc2, sc2 * (nivel === 2 ? 0.7 : 1), sc2); BM.scale(SV); BM.setPosition(x, this.h(x, z), z);
      const sel = this.sel.has(r); bc.set(this.b.cfg.sides[r.side].col); bc.lerp(gris, Math.min(0.85, can * 0.55 + nivel * 0.2)); if (nivel) bc.multiplyScalar(1 - 0.25 * nivel); if (sel) bc.set('#ffe27a');
      this.poles.setMatrixAt(bi, BM);
      const tc = nivel === 1 ? this.clothR : this.cloth, ic = nivel === 1 ? cnt.cr++ : cnt.cl++; tc.setMatrixAt(ic, BM); tc.setColorAt(ic, bc);
      const ins = r.u.cls === 'gen' ? 'aq' : r.u.cls === 'cav' ? 'vx' : 'sg', mI = ins === 'aq' ? this.eagles : ins === 'vx' ? this.barras : this.discos;
      mI.setMatrixAt(cnt[ins], BM); mI.setColorAt(cnt[ins]++, r.side === 0 ? bc.set(sel ? '#ffe27a' : '#f0c44a') : bc.set(this.b.cfg.sides[1].col).lerp(new THREE.Color('#ffffff'), 0.3));
      bi++;
      R.moving = Math.hypot(r.x - (R.px || r.x), r.y - (R.py || r.y)) > 0.01; R.px = r.x; R.py = r.y;
    }
    this.poles.count = bi; this.cloth.count = cnt.cl; this.clothR.count = cnt.cr; this.eagles.count = cnt.aq; this.discos.count = cnt.sg; this.barras.count = cnt.vx;
    for (const m of this.meshB) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    this.emiteTierra(dt); this.animaTierra(dt);
    this.dibujaProyectiles(dt);
  }

  /* ---------- estandartes y tarjetas ---------- */
  buildFlags() {
    for (const R of this.R) {
      const r = R.r, el = document.createElement('button'); el.className = 'bflag s' + r.side; el.style.setProperty('--c', this.b.cfg.sides[r.side].col);
      el.innerHTML = '<i>' + (r.u.cls === 'ele' ? '🐘' : r.u.g) + '</i><b><u></u></b><s><em></em><em></em><em></em></s>';
      el.addEventListener('click', ev => { ev.stopPropagation(); if (performance.now() - (this.tArr || 0) < 400) return; this.hitReg(r); });
      // despliegue: mantener el dedo sobre el estandarte y mover arrastra el regimiento (el resto lo sigue el lienzo)
      el.addEventListener('pointerdown', ev => { if (this.b.fase === 'despliegue' && r.side === 0 && r.st === 'ok' && this.onDown) { this.dragReg = r; this.onDown(ev); } else if (this.b.fase !== 'despliegue' && r.side === 0 && r.st === 'ok' && this.sel.has(r) && this.onDown) { this.trazoIni = true; this.onDown(ev); } });
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
      el.innerHTML = (img ? '<img src="' + img + '" alt="">' : '<span class="g">' + r.u.g + '</span>') + '<em></em><b><u></u></b>' + (r.bis ? '<s style="position:absolute;left:0;right:0;bottom:9px;text-align:center;font-size:8px;font-weight:700;line-height:1;text-decoration:none;color:#ffd27a;text-shadow:0 1px 2px #000,0 0 3px #000">Bisoño</s>' : PN[r.papel] ? '<s style="position:absolute;left:0;right:0;bottom:9px;text-align:center;font-size:8px;font-weight:700;line-height:1;text-decoration:none;color:#fff;text-shadow:0 1px 2px #000,0 0 3px #000">' + PN[r.papel] + '</s>' : '');
      el.title = (r.name || r.u.n) + (PN[r.papel] ? ' · ' + PN[r.papel] : '') + (r.bis ? ' · Bisoño' : ''); el.addEventListener('click', () => { if (r.st === 'ok') { if (this.sel.has(r)) this.sel.delete(r); else this.sel.add(r); this.focus(r); } });
      host.appendChild(el); R.card = el; R.cbar = el.querySelector('u'); R.cnum = el.querySelector('em');
    }
  }
  // lo que ve la cámara en el campo (para el minimapa): 4 puntos en coordenadas de simulación
  vista() {
    const out = [], W = this.b.W, H = this.b.H, ray = new THREE.Raycaster(), cam = this.cam; cam.updateMatrixWorld();
    for (const [nx, ny] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
      ray.setFromCamera(new THREE.Vector2(nx, ny), cam); const o = ray.ray.origin, d = ray.ray.direction;
      const k = d.y < -0.02 ? Math.min(-o.y / d.y, 600) : 600, x = o.x + d.x * k, z = o.z + d.z * k;
      out.push([Math.max(0, Math.min(W, x / S + W / 2)), Math.max(0, Math.min(H, z / S + H / 2))]);
    }
    return out;
  }
  focus(r) { this.suelta(); const w = this.toW(r.x, r.y); this.c.x = w[0]; this.c.z = w[1]; this.intro = 1; }
  updateOverlay() {
    const v = new THREE.Vector3(), W = this.host.clientWidth, H = this.host.clientHeight;
    if (this.flags.scrollLeft || this.flags.scrollTop) { this.flags.scrollLeft = 0; this.flags.scrollTop = 0; }
    for (const R of this.R) {
      const r = R.r, ok = r.st === 'ok';
      if (r.linea && r.side === 0) { const ln = ['', 'I', 'II', 'III'][r.linea] || ''; if (R.lnTxt !== ln) { R.lnTxt = ln; R.el.dataset.l = ln; if (R.card) R.card.dataset.l = ln; } }
      if (R.card) { R.card.classList.toggle('sel', this.sel.has(r)); R.card.classList.toggle('out', !ok); R.card.classList.toggle('cans', ok && r.fat >= 60); R.cbar.style.width = (r.men / r.max * 100) + '%'; R.cbar.style.background = r.mor / r.morMax > 0.5 ? '#7ddc5a' : r.mor / r.morMax > 0.25 ? '#f0c040' : '#e8503a'; R.cnum.textContent = ok ? r.men : r.st === 'dead' ? '☠' : '🏳'; }
      if (!ok && r.st !== 'rout') { R.el.style.display = 'none'; continue; }
      const w = this.toW(r.x, r.y); let x = w[0], z = w[1];
      if (!ok && R.n) { x = R.fx[0]; z = R.fz[0]; }
      v.set(x, this.h(x, z) + (r.u.cls === 'ele' ? 8 : r.u.cls === 'cav' || r.u.cls === 'gen' ? 5 : 4), z).project(this.cam);
      if (v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1) { R.el.style.display = 'none'; continue; }
      R.el.style.display = ''; R.el.style.transform = 'translate(' + ((v.x + 1) / 2 * W).toFixed(1) + 'px,' + ((1 - v.y) / 2 * H).toFixed(1) + 'px) translate(-50%,-100%)';
      R.el.classList.toggle('sel', this.sel.has(r)); R.el.classList.toggle('rout', !ok);
      { const e = estadoReg(r), cl = R.el.classList; cl.toggle('m1', e.moral === 1); cl.toggle('m2', e.moral === 2); cl.toggle('m3', e.moral === 3); cl.toggle('f1', ok && e.cans === 1); cl.toggle('f2', ok && e.cans === 2); }
      R.bar.style.width = (r.men / r.max * 100) + '%'; R.bar.style.background = r.mor / r.morMax > 0.5 ? '#7ddc5a' : r.mor / r.morMax > 0.25 ? '#f0c040' : '#e8503a';
    }
  }

  /* ---------- órdenes ---------- */
  hitReg(r) {
    if (this.b.over || r.st !== 'ok') return;
    if (r.side === 0) { if (this.b.fase === 'despliegue') { if (this.sel.has(r)) this.sel.delete(r); else this.sel.add(r); } else if (this.sel.has(r) && this.sel.size === 1) this.sel.delete(r); else { this.sel.clear(); this.sel.add(r); } return; }
    if (this.b.fase === 'despliegue' || this.b.fase === 'ejecucion') return;   // en la ejecución de una ronda no se dan órdenes
    for (const s of this.sel) if (s.st === 'ok') s.order = { k: 'atk', r: r };
  }
  tapField(fx, fy) {
    const b = this.b; let hit = null, hd = 40;
    for (const r of b.regs) { if (r.st !== 'ok') continue; const d = Math.hypot(r.x - fx, r.y - fy); if (d < hd) { hd = d; hit = r; } }
    const desp = b.fase === 'despliegue';
    if (hit) { if (desp && hit.side !== 0) return; return this.hitReg(hit); }
    const sel = [...this.sel].filter(r => r.st === 'ok'); if (!sel.length) return;
    let cx = 0, cy = 0; sel.forEach(r => { cx += r.x; cy += r.y; }); cx /= sel.length; cy /= sel.length;
    if (desp) { sel.forEach(r => b.colocar(r, fx + (r.x - cx), fy + (r.y - cy))); return; } // despliegue: se coloca, no se ordena
    if (b.fase === 'ejecucion') return;
    sel.forEach(r => { r.order = { k: 'move', x: Math.max(20, Math.min(b.W - 20, fx + (r.x - cx))), y: Math.max(20, Math.min(b.H - 20, fy + (r.y - cy))) }; r.tgt = null; });
    const w = this.toW(fx, fy); this.marker.position.set(w[0], this.h(w[0], w[1]) + 0.15, w[1]); this.marker.visible = true; this.markT = this.t;
  }
  selectAll() { const all = this.b.regs.filter(r => r.side === 0 && r.st === 'ok'); if (this.sel.size >= all.length) this.sel.clear(); else all.forEach(r => this.sel.add(r)); }
  cycleCam() {
    this.camMode = ((this.camMode || 0) + 1) % 4; this.intro = 1; const c = this.c; this.seg.ch = null; this.seg.t = 0; this.seg.tCambio = -9;
    if (this.camMode === 0) { c.dist = 120; c.pitch = 0.5; c.yaw = 0; }
    else if (this.camMode === 1) { c.dist = Math.min(330, 230 + Math.max(0, this.hw - 75) * 0.5); c.pitch = 1.25; c.yaw = 0; c.x = 0; c.z = 0; }
    else if (this.camMode === 3) { c.dist = 140; c.pitch = 0.7; c.yaw = 0; }   // N8b «Seguir»: placeCam la mueve sola en la ejecución
    else { c.dist = 34; c.pitch = 0.22; let best = null; for (const r of this.b.regs) if (r.st === 'ok' && r.side === 0 && (r.fight > 0 || !best)) best = r; if (best) { const w = this.toW(best.x, best.y); c.x = w[0]; c.z = w[1]; c.yaw = 0.7; } }
  }

  /* ---------- L2: alas ---------- */
  buildAlas() {
    this.ala = new Map(); for (const r of this.b.regs) if (r.side === 0) this.ala.set(r, alaPorDefecto(r));
    const cv = document.createElement('canvas'); cv.className = 'balas'; this.host.appendChild(cv); this.acv = cv;
    this.alaEt = {}; ALAS.forEach(a => { const e = document.createElement('button'); e.className = 'balaet'; e.textContent = a[1]; e.style.display = 'none'; e.addEventListener('click', ev => { ev.stopPropagation(); this.selAla(a[0]); }); this.flags.appendChild(e); this.alaEt[a[0]] = e; });
  }
  miembros(id) { return this.b.regs.filter(r => r.side === 0 && r.st === 'ok' && this.ala.get(r) === id); }
  selAla(id) { const m = this.miembros(id); if (!m.length) return 0; this.sel.clear(); m.forEach(r => this.sel.add(r)); return m.length; }
  // mueve a un ala los regimientos seleccionados (propios); devuelve cuántos
  moverAAla(id) { let n = 0; for (const r of this.sel) if (r.side === 0 && r.st === 'ok') { this.ala.set(r, id); n++; } return n; }
  // ala elegida entera ahora mismo (todos sus regimientos en pie están seleccionados), o null
  alaActiva() { for (const a of ALAS) { const m = this.miembros(a[0]); if (m.length && m.length === [...this.sel].filter(r => r.st === 'ok').length && m.every(r => this.sel.has(r))) return a[0]; } return null; }
  // casco convexo de puntos de pantalla (cadena monótona); con 1 o 2 puntos devuelve los mismos
  casco(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  dibujaAlas() {
    const cv = this.acv, W = this.host.clientWidth, H = this.host.clientHeight; if (!cv) return;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const x = cv.getContext('2d'); x.clearRect(0, 0, W, H); const v = new THREE.Vector3(), act = this.alaActiva(), usados = [];
    ALAS.forEach((a, ia) => {
      const et = this.alaEt[a[0]], pts = [];
      for (const r of this.miembros(a[0])) { const w = this.toW(r.x, r.y); v.set(w[0], this.h(w[0], w[1]) + (r.u.cls === 'ele' ? 8.6 : 5.6), w[1]).project(this.cam); if (v.z < 1) pts.push([(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]); }
      if (pts.length < 2) { et.style.display = 'none'; return; }
      const hull = this.casco(pts), on = act === a[0], dy = -5;
      const trazo = (w, c) => { x.beginPath(); hull.forEach((p, i) => i ? x.lineTo(p[0], p[1] + dy) : x.moveTo(p[0], p[1] + dy)); if (hull.length > 2) x.closePath(); x.lineWidth = w; x.strokeStyle = c; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); };
      trazo(on ? 5 : 3, 'rgba(60,30,4,.7)'); trazo(on ? 2.5 : 1.4, on ? '#ffe27a' : '#d9ac3c');
      for (const p of pts) { x.beginPath(); x.arc(p[0], p[1] + dy, on ? 3.2 : 2.4, 0, 7); x.fillStyle = on ? '#ffe27a' : '#d9ac3c'; x.fill(); }
      let mx = (pts[0][0] + pts[pts.length - 1][0]) / 2, my = Math.min(...pts.map(p => p[1])) + dy - 12;
      for (const u of usados) if (Math.abs(u[0] - mx) < 62 && Math.abs(u[1] - my) < 17) my = u[1] - 18; usados.push([mx, my]);
      et.style.display = ''; et.classList.toggle('on', on); et.textContent = a[1] + ' ' + this.miembros(a[0]).length; et.style.transform = 'translate(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px) translate(-50%,-100%)';
    });
  }

  /* ---------- L1: trazo dibujado ---------- */
  buildTrazo() {
    const cv = document.createElement('canvas'); cv.className = 'btrazo'; this.host.appendChild(cv); this.tcv = cv;
    const et = document.createElement('div'); et.className = 'btrazoet'; this.host.appendChild(et); this.tet = et;
    const pv = document.createElement('canvas'); pv.className = 'bplan'; this.host.appendChild(pv); this.pcv = pv; this.sombras = null; this.sombraSig = ''; this.sombraT = 0;
  }
  /* ---------- N2: vista previa («sombra») de la ronda ---------- */
  // firma de lo que decide la sombra: posición y orden de cada regimiento propio
  firmaPlan() { let f = ''; for (const r of this.b.regs) if (r.side === 0 && r.st === 'ok') { const o = r.order; f += r.id + ':' + (r.x | 0) + ',' + (r.y | 0) + (o ? o.k + (o.k === 'atk' ? o.r.id : (o.x | 0) + ',' + (o.y | 0)) + (o.cond || '') + (o.form || '') : '-') + (r.form || '') + ';'; } return f + (this.b.cartaPlan || ''); }
  dibujaPlan() {
    const cv = this.pcv, b = this.b; if (!cv) return; const W = this.host.clientWidth || 1, H = this.host.clientHeight || 1;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const x = cv.getContext('2d'); x.clearRect(0, 0, W, H);
    const ver = b.rondas && b.fase === 'plan' && !b.over; if (cv.style.display !== (ver ? '' : 'none')) cv.style.display = ver ? '' : 'none';   // fuera del plan el lienzo se oculta: no queda ninguna flecha vieja
    if (!ver) { this.haySombras = false; if (this.pSucio) { cv.width = W; this.pSucio = false; } return; }   // al vaciar el lienzo se reinicia: así el navegador no deja flechas viejas
    const now = performance.now(), sig = this.firmaPlan(), tp = this.tPrev || 0;
    if ((sig !== this.sombraSig || tp !== this.sombraTp) && now - this.sombraT > 220) {
      this.sombraSig = sig; this.sombraTp = tp; this.sombraT = now;
      if (tp && this.prevFirma !== sig) { this.prevFirma = sig; try { this.prevRes = b.prevision([10, 20, 30]); } catch (e) { this.prevRes = null; } }   // una sola previsión por plan; el deslizador la reutiliza
      const rs = tp ? this.prevRes : null;
      this.sombras = rs && rs[0] && rs[0].sombras ? (rs.find(q => q.t === tp) || rs[0]).sombras : b.prevision();
    }
    const v = new THREE.Vector3(), pr = (px, py) => { const w = this.toW(px, py); v.set(w[0], this.h(w[0], w[1]) + 0.6, w[1]).project(this.cam); return v.z < 1 ? [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H] : null; };
    const col = b.cfg.sides[0].col, usados = []; let hay = 0;
    // N5: círculo dorado tenue del radio de mando alrededor del general propio
    const gen = b.generalVivo(0), MR = window.Battle.MANDO_RADIO, MD = window.Battle.MANDO_RETRASO;
    if (gen) { const pts = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, q = pr(gen.x + Math.cos(a) * MR, gen.y + Math.sin(a) * MR); if (q) pts.push(q); }
      if (pts.length > 8) { x.save(); x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fillStyle = 'rgba(233,192,99,.07)'; x.fill(); x.lineWidth = 4; x.strokeStyle = 'rgba(40,24,4,.35)'; x.stroke(); x.lineWidth = 1.8; x.strokeStyle = 'rgba(244,208,110,.6)'; x.stroke(); x.restore(); } }
    // anillo en el suelo bajo el regimiento elegido
    for (const r of this.sel) { if (r.st !== 'ok') continue; const p = pr(r.x, r.y); if (!p) continue; x.save(); x.translate(p[0], p[1]); x.scale(1, 0.5); x.lineWidth = 5; x.strokeStyle = 'rgba(40,24,4,.8)'; x.beginPath(); x.arc(0, 0, 30, 0, 7); x.stroke(); x.lineWidth = 2.4; x.strokeStyle = '#ffe27a'; x.stroke(); x.restore(); }
    // siluetas del final (sombra honesta: el enemigo quieto)
    for (const sh of this.sombras || []) {
      const r = b.regs.find(q => q.id === sh.id); if (!r || r.st !== 'ok' || sh.st === 'dead' || !r.order) continue;
      if (Math.hypot(sh.x - r.x, sh.y - r.y) <= 14) continue; const p1 = pr(sh.x, sh.y); if (!p1) continue;
      const w = Math.max(12, Math.min(28, 7 + Math.sqrt(sh.men) * 1.3)), h = w * 0.5, sel = this.sel.has(r);
      x.save(); x.translate(p1[0], p1[1]); x.globalAlpha = sel ? 0.6 : 0.35; x.fillStyle = col; x.strokeStyle = COL_ORDEN[tipoOrden(r)] || '#ffe27a'; x.lineWidth = 1.4; x.setLineDash([4, 3]); x.beginPath(); x.rect(-w / 2, -h / 2, w, h); x.fill(); x.stroke(); x.restore(); hay++;
    }
    // flechas de orden pintadas en el suelo, una por regimiento propio con orden
    for (const r of b.regs) {
      if (r.side !== 0 || r.st !== 'ok' || !r.order) continue;
      const tipo = tipoOrden(r), c = COL_ORDEN[tipo] || '#f2cf72', sel = this.sel.has(r), p0 = pr(r.x, r.y); if (!p0) continue;
      let ex, ey, mandoFuera = false; const o = r.order;
      if (o.k === 'atk') { const dx = o.r.x - r.x, dy = o.r.y - r.y, d = Math.hypot(dx, dy) || 1, k = Math.max(0, d - 16) / d; ex = r.x + dx * k; ey = r.y + dy * k; } else if (o.k === 'move') { ex = o.x; ey = o.y; } else { ex = r.x; ey = r.y; }
      const dist = Math.hypot(ex - r.x, ey - r.y); let mid = p0;
      if (tipo === 'aguantar' || dist < 8) {
        // aguantar: un escudo (arco) delante del regimiento, mirando al frente
        x.save(); x.translate(p0[0], p0[1] - 2); x.lineCap = 'round'; for (const [lw, st] of [[7, 'rgba(20,14,6,.85)'], [3.6, c]]) { x.lineWidth = lw; x.strokeStyle = st; x.beginPath(); x.arc(0, 4, 19, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
        x.restore(); mid = [p0[0], p0[1] - 24];
      } else {
        const lx = -(ey - r.y) / dist, ly = (ex - r.x) / dist, bow = tipo === 'hostigar' ? 0.3 : tipo === 'retirarse' ? -0.16 : tipo === 'relevar' ? 0.22 : 0.07, cx = (r.x + ex) / 2 + lx * dist * bow, cy = (r.y + ey) / 2 + ly * dist * bow;
        const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16, a = (1 - t) * (1 - t), bb = 2 * t * (1 - t), cc = t * t; const q = pr(a * r.x + bb * cx + cc * ex, a * r.y + bb * cy + cc * ey); if (q) pts.push(q); }
        if (pts.length < 3) continue; const n = pts.length, pe = pts[n - 1], pa = pts[Math.max(0, n - 4)], ang = Math.atan2(pe[1] - pa[1], pe[0] - pa[0]);
        const wl = (tipo === 'cargar' ? 7 : tipo === 'avanzar' ? 5.5 : 4.4) + (sel ? 1.5 : 0), fin = pts.slice(0, n - 1);
        x.lineCap = 'round'; x.lineJoin = 'round';
        const traza = (lw, st, dash) => { x.setLineDash(dash || []); x.lineWidth = lw; x.strokeStyle = st; x.beginPath(); fin.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.lineTo(pe[0] - Math.cos(ang) * 6, pe[1] - Math.sin(ang) * 6); x.stroke(); x.setLineDash([]); };
        const fuera = !!gen && r !== gen && b.fueraDeMando(r, gen) && o.k !== 'quieto', dash = fuera ? [3, 9] : tipo === 'hostigar' ? [9, 6] : tipo === 'retirarse' ? [1, 9] : null;
        if (fuera) mandoFuera = true;
        traza(wl + 3.4, 'rgba(20,14,6,.82)', dash); traza(wl, c, dash);
        if (tipo === 'relevar') traza(1.6, '#0c2a2d', null);
        const hs = tipo === 'cargar' ? 14 : 11, cabeza = (off, fill) => { const bx = pe[0] - Math.cos(ang) * off, by = pe[1] - Math.sin(ang) * off; x.beginPath(); x.moveTo(bx + Math.cos(ang) * hs, by + Math.sin(ang) * hs); x.lineTo(bx + Math.cos(ang + 2.45) * hs * 0.95, by + Math.sin(ang + 2.45) * hs * 0.95); x.lineTo(bx + Math.cos(ang - 2.45) * hs * 0.95, by + Math.sin(ang - 2.45) * hs * 0.95); x.closePath(); x.lineWidth = 2.6; x.strokeStyle = 'rgba(20,14,6,.85)'; x.stroke(); x.fillStyle = fill; x.fill(); };
        cabeza(0, tipo === 'retirarse' ? '#2a1a40' : c); if (tipo === 'retirarse') { x.lineWidth = 2; x.strokeStyle = c; x.stroke(); } if (tipo === 'cargar') cabeza(11, c);
        mid = pts[Math.floor(n / 2)];
      }
      // etiqueta pequeña con el nombre de la orden (sin solaparse con otra)
      let ly2 = mid[1] - 11; let txt = (TIPOS_ORDEN.find(q => q[0] === tipo) || [0, ''])[1]; if (!txt) continue; if (mandoFuera) txt += ' +' + MD + ' s';
      let colision = false; for (const u of usados) if (Math.abs(u[0] - mid[0]) < 56 && Math.abs(u[1] - ly2) < 13) colision = true; if (colision && !sel) { hay++; continue; } usados.push([mid[0], ly2]);
      x.font = '700 10px Cinzel, Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; const tw = x.measureText(txt).width + 10;
      x.fillStyle = 'rgba(12,16,22,.88)'; x.strokeStyle = c; x.lineWidth = 1; x.beginPath(); x.roundRect ? x.roundRect(mid[0] - tw / 2, ly2 - 7, tw, 14, 5) : x.rect(mid[0] - tw / 2, ly2 - 7, tw, 14); x.fill(); x.stroke(); x.fillStyle = c; x.fillText(txt, mid[0], ly2 + 0.5); hay++;
    }
    this.haySombras = hay > 0;
    if (hay > 0 || this.sel.size) this.pSucio = true; else if (this.pSucio) { cv.width = W; this.pSucio = false; }
  }
  /* ---------- N3: órdenes por tipo (solo escriben r.order, que ya conoce el motor; N4 dará reglas propias a hostigar y relevar) ---------- */
  propios() { return [...this.sel].filter(r => r.st === 'ok' && r.side === 0); }
  enemigosVivos() { return this.b.regs.filter(e => e.side === 1 && e.st === 'ok'); }
  // da la orden del tipo dado a los regimientos elegidos; devuelve un texto breve para avisar, o null si no hay a quién dársela
  darOrden(tipo) {
    const b = this.b, sel = this.propios(); if (b.over || b.fase === 'ejecucion' || b.fase === 'despliegue' || !sel.length) return null;
    const lim = (v, a, z) => Math.max(a, Math.min(z, v)), en = this.enemigosVivos(), cerca = (r, l) => { let m = null, bd = 1e9; for (const e of l) { const d = Math.hypot(e.x - r.x, e.y - r.y); if (d < bd) { bd = d; m = e; } } return m; };
    const aHacia = (r, e, d) => { const dx = e.x - r.x, dy = e.y - r.y, L = Math.hypot(dx, dy) || 1, k = Math.min(d, Math.max(0, L - 40)) / L; return { x: lim(r.x + dx * k, 20, b.W - 20), y: lim(r.y + dy * k, 20, b.H - 20) }; };
    let n = 0;
    for (const r of sel) {
      const ne = cerca(r, en); r.tgt = null;
      if (tipo === 'aguantar') r.order = { k: 'quieto', tipo };
      else if (tipo === 'retirarse') r.order = { k: 'move', x: lim(r.x, 20, b.W - 20), y: Math.min(b.H - 20, r.y + 90), tipo };
      else if (!ne) continue;
      else if (tipo === 'avanzar') r.order = Object.assign({ k: 'move', tipo }, aHacia(r, ne, 70));
      else if (tipo === 'cargar') { const blando = r.u.cls === 'cav' || r.u.cls === 'gen' ? cerca(r, en.filter(e => e.u.cls === 'rng' || (e.u.cls === 'inf' && e.papel === 'ligera'))) : null; r.order = { k: 'atk', r: blando || ne, tipo }; }
      else if (tipo === 'hostigar') {
        if (r.u.cls === 'rng') { const dx = r.x - ne.x, dy = r.y - ne.y, L = Math.hypot(dx, dy) || 1, d = 105; r.order = { k: 'move', x: lim(ne.x + dx / L * d, 20, b.W - 20), y: lim(ne.y + dy / L * d, 20, b.H - 20), tipo }; }
        else r.order = { k: 'move', x: lim(ne.x + (ne.x < b.W / 2 ? 70 : -70), 20, b.W - 20), y: lim(ne.y + 16, 20, b.H - 20), tipo };
      } else if (tipo === 'relevar') {
        // la reserva (regimiento propio sin elegir, el más cercano por detrás) ocupa su sitio y él pasa atrás
        let res = null, bd = 1e9; for (const q of b.regs) { if (q.side !== 0 || q.st !== 'ok' || q === r || this.sel.has(q) || q.y < r.y + 15) continue; const d = Math.hypot(q.x - r.x, q.y - r.y); if (d < bd) { bd = d; res = q; } }
        if (res) { r.order = { k: 'move', x: res.x, y: res.y, tipo }; res.order = { k: 'move', x: r.x, y: r.y, tipo }; res.tgt = null; } else r.order = { k: 'move', x: r.x, y: Math.min(b.H - 20, r.y + 45), tipo };
      }
      n++;
    }
    if (!n) return null; const nom = (TIPOS_ORDEN.find(q => q[0] === tipo) || [0, tipo])[1]; this.ultimaOrden = { txt: nom, t: performance.now() }; return nom;
  }
  // elige el siguiente regimiento propio (de izquierda a derecha); devuelve el elegido
  siguienteReg(paso) {
    const l = this.b.regs.filter(r => r.side === 0 && r.st === 'ok').sort((p, q) => p.x - q.x || p.y - q.y); if (!l.length) return null;
    const cur = this.propios()[0], i = cur ? l.indexOf(cur) : -1, nx = l[(i + (paso || 1) + l.length) % l.length]; this.sel.clear(); this.sel.add(nx); return nx;
  }
  // salto de cámara a un ala (-1 izquierda, 0 centro, 1 derecha) de tu ejército, sin cambiar la altura de la cámara
  saltoAla(lado) {
    this.suelta();
    const own = this.b.regs.filter(r => r.side === 0 && r.st === 'ok'); if (!own.length) return;
    let xs = own.map(r => r.x).sort((a, b2) => a - b2), cut = lado < 0 ? xs.slice(0, Math.ceil(xs.length / 3)) : lado > 0 ? xs.slice(-Math.ceil(xs.length / 3)) : xs.slice(Math.floor(xs.length / 3), Math.ceil(xs.length * 2 / 3));
    const gx = cut.reduce((s, v) => s + v, 0) / (cut.length || 1), sub = own.filter(r => cut.includes(r.x)), gy = sub.reduce((s, r) => s + r.y, 0) / (sub.length || 1) - 40;
    const w = this.toW(gx, gy); this.c.x = w[0]; this.c.z = w[1]; this.clampCam();
  }
  // «Ver otra vez»: devuelve todas las figuras a sus puestos y borra los caídos para repetir la ronda desde el principio
  reiniciaFiguras() {
    for (const R of this.R) { const w = this.toW(R.r.x, R.r.y); R.n = R.F; for (let j = 0; j < R.F; j++) { const q = this.slot(R, j, w[0], w[1], R.r.ang); R.fx[j] = q[0]; R.fz[j] = q[1]; } }
    for (const e of this.meshes.values()) if (e.dead) e.dead.length = 0;
    this.nMan = 0; if (this.manchas) { this.manchas.count = 0; this.manchas.instanceMatrix.needsUpdate = true; } this.nCl = 0; this.nCorp = 0; if (this.corp) { this.corp.count = 0; this.corp.instanceMatrix.needsUpdate = true; }
  }
  dibujaTrazo(T) {
    const cv = this.tcv, W = this.host.clientWidth || 1, H = this.host.clientHeight || 1; if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const rc = this.cv.getBoundingClientRect(), x = cv.getContext('2d'); x.clearRect(0, 0, W, H); if (T.s.length < 2) return;
    x.lineCap = 'round'; x.lineJoin = 'round';
    const trazo = (w, c) => { x.beginPath(); (T.frente ? [T.s[0], T.s[T.s.length - 1]] : T.s).forEach((p, i) => { const px = p[0] - rc.left, py = p[1] - rc.top; i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.lineWidth = w; x.strokeStyle = c; x.stroke(); };
    trazo(9, 'rgba(120,16,12,.85)'); trazo(4, '#f2cf72');
    const q = T.s[T.s.length - 1], px = q[0] - rc.left, py = q[1] - rc.top; x.beginPath(); x.arc(px, py, 7, 0, 7); x.fillStyle = '#f2cf72'; x.fill();
    if (T.frente) { this.etiqueta('Frente', px, py); return; }
    const c = clasificarTrazo(T.w, this.b); this.etiqueta(c ? this.nombreOrden(c.tipo) : '', px, py);
  }
  /* ---------- N7: frente con ancho y ángulo (arrastrar de un extremo a otro) ---------- */
  activaFrente(on) { this.modoFrente = on == null ? !this.modoFrente : !!on; if (!this.modoFrente) this.limpiaTrazo(); return this.modoFrente; }
  // reparte la línea trazada entre los regimientos elegidos (de izquierda a derecha del trazo); cada uno mira hacia el enemigo
  ejecutarFrente(T) {
    const b = this.b; if (!T.w || T.w.length < 2 || !b.fijarFrente) { if (this.opts.aviso) this.opts.aviso('Trazo muy corto: arrastra más largo.'); return 0; }
    const A = T.w[0], Z = T.w[T.w.length - 1], L = Math.hypot(Z[0] - A[0], Z[1] - A[1]); if (L < 14) { if (this.opts.aviso) this.opts.aviso('Trazo muy corto: arrastra más largo.'); return 0; }
    const dx = (Z[0] - A[0]) / L, dy = (Z[1] - A[1]) / L, sel = this.propios().filter(r => r.st === 'ok').sort((p, q) => ((p.x - A[0]) * dx + (p.y - A[1]) * dy) - ((q.x - A[0]) * dx + (q.y - A[1]) * dy));
    if (!sel.length) return 0; const en = b.regs.filter(r => r.side === 1 && r.st === 'ok'); let ex = b.W / 2, ey = b.H / 2; if (en.length) { ex = en.reduce((s, r) => s + r.x, 0) / en.length; ey = en.reduce((s, r) => s + r.y, 0) / en.length; }
    let nx = -dy, ny = dx; if ((ex - (A[0] + Z[0]) / 2) * nx + (ey - (A[1] + Z[1]) / 2) * ny < 0) { nx = -nx; ny = -ny; }
    const ang = Math.atan2(ny, nx), seg = L / sel.length, lim = (v, a, z) => Math.max(a, Math.min(z, v)); let n = 0;
    sel.forEach((r, i) => { const t = seg * (i + 0.5); if (b.fijarFrente(r, { x: lim(A[0] + dx * t, 20, b.W - 20), y: lim(A[1] + dy * t, 20, b.H - 20), ang, ancho: seg })) n++; r.tgt = null; });
    if (n < sel.length && this.opts.aviso) this.opts.aviso(b.motivo || 'Ese frente no se puede formar ahora.', 'bad'); else if (this.opts.aviso) this.opts.aviso('Frente fijado.');
    this.avisoFrente = null; this.ultimaOrden = { txt: 'Frente', t: performance.now() }; return n;
  }
  // N7: instante de la sombra en pausa (null = la final de hoy)
  ponTPrev(t) { this.tPrev = t || null; this.sombraT = 0; }
  nombreOrden(t) { return { cargar: 'Cargar', avanzar: 'Avanzar', flanquear: 'Flanquear', retirar: 'Retirar', mantener: 'Mantener' }[t] || ''; }
  etiqueta(txt, px, py) { const e = this.tet; e.textContent = txt; e.style.opacity = txt ? 1 : 0; if (txt) e.style.transform = 'translate(' + Math.round(Math.min(this.host.clientWidth - 70, Math.max(6, px + 12))) + 'px,' + Math.round(Math.max(6, py - 34)) + 'px)'; }
  limpiaTrazo() { const cv = this.tcv; if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); if (this.tet) this.tet.style.opacity = 0; }
  // da la orden reconocida a todos los seleccionados (conservando su disposición relativa)
  ejecutarTrazo(T) {
    if (T.frente) { this.limpiaTrazo(); this.modoFrente = false; return this.ejecutarFrente(T); }
    const c = clasificarTrazo(T.w, this.b), last = T.s[T.s.length - 1], rc = this.cv.getBoundingClientRect();
    this.limpiaTrazo(); if (!c || this.b.over || this.b.fase === 'ejecucion') return;
    const sel = [...this.sel].filter(r => r.st === 'ok'); if (!sel.length) return;
    const b = this.b, lim = (v, a, z) => Math.max(a, Math.min(z, v)); let cx = 0, cy = 0; sel.forEach(r => { cx += r.x; cy += r.y; }); cx /= sel.length; cy /= sel.length;
    for (const r of sel) {
      if (c.tipo === 'mantener') { r.order = null; r.tgt = null; }
      else if (c.enemigo && c.tipo !== 'retirar' && c.tipo !== 'flanquear') { r.order = { k: 'atk', r: c.enemigo }; }
      else { r.order = { k: 'move', x: lim(c.x + (r.x - cx), 20, b.W - 20), y: lim(c.y + (r.y - cy), 20, b.H - 20) }; r.tgt = null; }
    }
    this.ultimaOrden = { txt: this.nombreOrden(c.tipo), t: performance.now() };
    this.etiqueta(this.nombreOrden(c.tipo), last[0] - rc.left, last[1] - rc.top); clearTimeout(this.tetT); this.tetT = setTimeout(() => { this.tet.style.opacity = 0; }, 1100);
    if (c.tipo !== 'mantener') { const w = this.toW(c.x, c.y); this.marker.position.set(w[0], this.h(w[0], w[1]) + 0.15, w[1]); this.marker.visible = true; this.markT = this.t; }
  }
  // botón dorado: ejecuta la orden recomendada de cada regimiento seleccionado. Devuelve la de texto del primero.
  ordenRecomendada() {
    let primera = null; if (this.b.fase === 'ejecucion') return null;
    for (const r of this.sel) { if (r.st !== 'ok') continue; const o = recomendada(r, this.b); if (!o) continue; if (!primera) primera = o; r.order = o.order ? Object.assign({}, o.order) : null; r.tgt = null; }
    return primera;
  }
  selPorClase(clases) { this.sel.clear(); for (const r of this.b.regs) if (r.side === 0 && r.st === 'ok' && clases.includes(r.u.cls)) this.sel.add(r); }
  // orden de mover a un punto de simulación (minimapa)
  moverSel(x, y) {
    if (this.b.fase === 'ejecucion') return false;
    const sel = [...this.sel].filter(r => r.st === 'ok'); if (!sel.length) return false; let cx = 0, cy = 0; sel.forEach(r => { cx += r.x; cy += r.y; }); cx /= sel.length; cy /= sel.length;
    sel.forEach(r => { r.order = { k: 'move', x: Math.max(20, Math.min(this.b.W - 20, x + (r.x - cx))), y: Math.max(20, Math.min(this.b.H - 20, y + (r.y - cy))) }; r.tgt = null; });
    const w = this.toW(x, y); this.marker.position.set(w[0], this.h(w[0], w[1]) + 0.15, w[1]); this.marker.visible = true; this.markT = this.t; return true;
  }
  centrarEn(x, y) { this.suelta(); const w = this.toW(x, y); this.c.x = w[0]; this.c.z = w[1]; this.intro = 1; this.clampCam(); }

  /* ---------- cámara y gestos ---------- */
  bind() {
    const P = new Map(); let st = null; const cv = this.cv;
    this.onDown = e => { cv.setPointerCapture(e.pointerId); P.set(e.pointerId, [e.clientX, e.clientY]); this.dragging = true; this.vel = null; this.suelta(); if (P.size === 1) st = { x: e.clientX, y: e.clientY, mv: 0, t: performance.now(), rot: e.button === 2 || e.shiftKey }; else if (st) { st.mv = 99; st.d = 0; } this.intro = 1;
      // despliegue: si el dedo cae sobre un regimiento propio, se arrastra él y no la cámara
      if (st && P.size === 1) {
        let dr = this.dragReg; this.dragReg = null; const g = this.pick(e.clientX, e.clientY);
        if (this.b.fase === 'despliegue' && g) {
          const fx = g[0] / S + this.b.W / 2, fy = g[1] / S + this.b.H / 2;
          if (!dr) { let hd = 34; for (const r of this.b.regs) { if (r.st !== 'ok' || r.side !== 0) continue; const d = Math.hypot(r.x - fx, r.y - fy); if (d < hd) { hd = d; dr = r; } } }
          if (dr) st.drag = { r: dr, dx: dr.x - fx, dy: dr.y - fy, mv: false };
        }
        // L1: con un regimiento propio seleccionado, el arrastre que empieza sobre él (o cerca) dibuja una orden
        const ini = this.trazoIni; this.trazoIni = false;
        if (this.modoFrente && this.b.fase === 'plan' && !this.b.over && this.sel.size && !st.drag) st.trazo = { s: [[e.clientX, e.clientY]], w: [], frente: true }; else
        if (this.b.fase !== 'despliegue' && this.b.fase !== 'ejecucion' && !this.b.over && !st.drag && this.sel.size) {
          let ok = ini; if (!ok && g) { const fx = g[0] / S + this.b.W / 2, fy = g[1] / S + this.b.H / 2; for (const r of this.sel) if (r.st === 'ok' && Math.hypot(r.x - fx, r.y - fy) < 46) ok = true; }
          if (ok) st.trazo = { s: [[e.clientX, e.clientY]], w: [] };
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
          if (g) this.b.colocar(st.drag.r, g[0] / S + this.b.W / 2 + st.drag.dx, g[1] / S + this.b.H / 2 + st.drag.dy);
        } else if (st.trazo) {
          const T = st.trazo; if (st.mv >= 10) { if (!T.w.length) { const g0 = this.pick(T.s[0][0], T.s[0][1]); if (g0) T.w.push([g0[0] / S + this.b.W / 2, g0[1] / S + this.b.H / 2]); } T.s.push([e.clientX, e.clientY]); const g1 = this.pick(e.clientX, e.clientY); if (g1) T.w.push([g1[0] / S + this.b.W / 2, g1[1] / S + this.b.H / 2]); this.dibujaTrazo(T); }
        } else if (st.rot) { c.yaw -= dx * 0.006; c.pitch += dy * 0.005; }
        else { const k = c.dist * 0.0021, cy = Math.cos(c.yaw), sy = Math.sin(c.yaw), mx = -(dx * cy + dy * sy) * k, mz = -(-dx * sy + dy * cy) * k; c.x += mx; c.z += mz; this.vel = [mx * 60, mz * 60]; }
      } else if (P.size === 2 && st) {
        if (st.trazo) { st.trazo = null; this.limpiaTrazo(); }
        const v = [...P.values()], d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]), a = Math.atan2(v[1][1] - v[0][1], v[1][0] - v[0][0]);
        if (st.d) { c.dist *= st.d / d; c.yaw -= a - st.a; c.pitch += dy * 0.002; }
        st.d = d; st.a = a;
      }
      this.clampCam();
    };
    this.onUp = e => {
      if (!P.has(e.pointerId)) return; P.delete(e.pointerId); if (!P.size) this.dragging = false;
      if (st && st.trazo && !P.size && st.mv < 10) this.tArr = performance.now();
      if (st && st.trazo && !P.size && st.mv >= 10) { this.tArr = performance.now(); if (e.type === 'pointerup') this.ejecutarTrazo(st.trazo); else this.limpiaTrazo(); st = null; return; }
      if (st && st.drag && !P.size) { this.tArr = performance.now(); if (!st.drag.mv && e.type === 'pointerup') this.hitReg(st.drag.r); st = null; return; }
      if (st && st.mv < 10 && performance.now() - st.t < 500 && e.type === 'pointerup' && !P.size) { const g = this.pick(e.clientX, e.clientY); if (g) this.tapField(g[0] / S + this.b.W / 2, g[1] / S + this.b.H / 2); }
      if (!P.size) st = null; else if (st) st.d = 0;
    };
    this.onWheel = e => { this.suelta(); this.c.dist *= e.deltaY > 0 ? 1.1 : 0.9; this.intro = 1; this.clampCam(); e.preventDefault(); };
    this.onCtx = e => e.preventDefault();
    cv.addEventListener('pointerdown', this.onDown); cv.addEventListener('pointermove', this.onMove); cv.addEventListener('pointerup', this.onUp); cv.addEventListener('pointercancel', this.onUp);
    cv.addEventListener('wheel', this.onWheel, { passive: false }); cv.addEventListener('contextmenu', this.onCtx);
  }
  clampCam() { const c = this.c; c.x = Math.max(-this.hw - 15, Math.min(this.hw + 15, c.x)); c.z = Math.max(-this.halfD - 10, Math.min(this.halfD + 10, c.z)); c.dist = Math.max(12, Math.min(330, c.dist)); c.pitch = Math.max(0.12, Math.min(1.45, c.pitch)); }
  pick(cx, cy) {
    const rc = this.cv.getBoundingClientRect(), ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((cx - rc.left) / rc.width * 2 - 1, -((cy - rc.top) / rc.height) * 2 + 1), this.cam);
    const o = ray.ray.origin, d = ray.ray.direction; if (d.y >= -0.001) return null;
    let y = 0, x = 0, z = 0; for (let i = 0; i < 4; i++) { const k = (y - o.y) / d.y; x = o.x + d.x * k; z = o.z + d.z * k; y = this.h(x, z); }
    return [x, z];
  }
  suelta() { if (this.camMode === 3) { this.camMode = 0; this.cinta.hidden = true; } }   // N8b: cualquier toque del jugador suelta la cámara «Seguir»
  // N8b: cámara «Seguir»: cada ~2 s elige el choque principal y se desliza hacia él (exponencial); solo en la ejecución
  sigueChoque(dt) {
    const c = this.c, sg = this.seg, b = this.b, ej = b.fase === 'ejecucion' || b.fase === 'lucha';
    if (this.camMode !== 3 || this.dragging || !ej || b.over) { this.cinta.hidden = true; return; }
    sg.t += dt; this.intro = 1;
    if (sg.t >= 2 || sg.primero === undefined) {
      sg.t = 0; sg.primero = 1; const ch = SON().elegirChoque(b.regs, 90, sg.ch);
      if (!sg.ch || !ch || this.t - sg.tCambio >= 3 || Math.hypot(ch.x - sg.ch.x, ch.y - sg.ch.y) < 60) { if (!sg.ch || !ch || Math.hypot(ch.x - sg.ch.x, ch.y - sg.ch.y) > 30) sg.tCambio = this.t; sg.ch = ch; }
      sg.texto = sg.ch ? 'Mirando: ' + SON().etiqueta(sg.ch, b.W) : '';
    }
    const k = 1 - Math.exp(-dt * 1.4); let tx, tz, td, tp, ty;
    if (sg.ch) { const w = this.toW(sg.ch.x, sg.ch.y); tx = w[0]; tz = w[1]; td = 50; tp = 0.3; ty = 0.35 * Math.sin(this.t * 0.18); }
    else { let n = 0, sx = 0, sy = 0; for (const r of b.regs) if (r.st === 'ok') { sx += r.x; sy += r.y; n++; } const w = n ? this.toW(sx / n, sy / n) : [0, 0]; tx = w[0]; tz = w[1]; td = 140; tp = 0.7; ty = 0; }
    c.x += (tx - c.x) * k; c.z += (tz - c.z) * k; c.dist += (td - c.dist) * k; c.pitch += (tp - c.pitch) * k; c.yaw += (ty - c.yaw) * k * 0.6; this.clampCam();
    if (this.cinta.hidden !== !sg.texto) this.cinta.hidden = !sg.texto; if (this.cinta.textContent !== sg.texto) this.cinta.textContent = sg.texto;
  }
  // N8b: sonidos según lo que pasa en pantalla (cercanía = distancia de la cámara al suceso)
  sonidos() {
    const So = SON(); if (!So || !So.activo) return; const cp = this.cam.position, b = this.b;
    if (b.fase !== this.faseAnt) { if (b.fase === 'ejecucion' || (b.fase === 'lucha' && this.faseAnt !== 'lucha')) So.cuerno(); this.faseAnt = b.fase; }
    const vc = (x, y) => { const w = this.toW(x, y); return So.cerca(Math.hypot(w[0] - cp.x, this.h(w[0], w[1]) - cp.y, w[1] - cp.z)); };
    for (const R of this.R) {
      const r = R.r; if (r.st !== 'ok') continue;
      const ch = r.choque > 0, cg = r.charge > 0, e = this.sonCh.get(r) || {};
      if (ch && !e.ch) So.choque(Math.min(1, 0.4 + (r.men || 0) / 120), vc(r.x, r.y));
      if (cg && !e.cg) So.carga(vc(r.x, r.y));
      if (ch || cg) this.sonCh.set(r, { ch, cg }); else if (e.ch || e.cg) this.sonCh.set(r, { ch: false, cg: false });
    }
    for (const f of b.fx) if (!this.fxSon.has(f)) { this.fxSon.add(f); So.jabalina(vc(f.x0, f.y0)); }
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
    const dtR = dt, k = this.opts.speed ? this.opts.speed() : 1; this.t += dt * k; uTime.value = this.t;
    this.updateArmies(dt * Math.max(k, 0.0001)); this.sigueChoque(dt * k); this.sonidos(); this.placeCam(dt); this.updateOverlay(); this.dibujaAlas(); this.dibujaPlan();
    if (this.marker.visible) { const a = (this.t - this.markT); this.marker.scale.setScalar(1 + a * 1.5); this.marker.material.opacity = Math.max(0, 0.9 - a * 1.2); if (a > 0.8) this.marker.visible = false; }
    if (this.zonaLinea && this.b.fase !== 'despliegue') { this.scene.remove(this.zonaLinea); this.zonaLinea.geometry.dispose(); this.zonaLinea.material.dispose(); this.zonaLinea = null; for (const l of this.terrenoLineas || []) { this.scene.remove(l); l.geometry.dispose(); l.material.dispose(); } this.terrenoLineas = null; }
    this.luzTiempo(dtR); this.r.render(this.scene, this.cam);
  }
  dispose() {
    if (this.dustU && this.dustU.map.value) this.dustU.map.value.dispose();
    const cv = this.cv; cv.removeEventListener('pointerdown', this.onDown); cv.removeEventListener('pointermove', this.onMove); cv.removeEventListener('pointerup', this.onUp); cv.removeEventListener('pointercancel', this.onUp); cv.removeEventListener('wheel', this.onWheel); cv.removeEventListener('contextmenu', this.onCtx);
    const realMeshes = new Set([...this.meshes.values()].filter(e => e.real).map(e => e.m));
    this.scene.traverse(o => { if (realMeshes.has(o)) return; if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== unitMaterial()) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    if (this.scene.background && this.scene.background.dispose) this.scene.background.dispose();
    cv.remove(); if (this.tcv) this.tcv.remove(); if (this.pcv) this.pcv.remove(); if (this.acv) this.acv.remove(); if (this.tet) this.tet.remove(); if (this.cinta) this.cinta.remove(); this.flags.remove(); if (this.opts.cards) this.opts.cards.innerHTML = '';
  }
}
