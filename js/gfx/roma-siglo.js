/* AQVILA — «Roma de su siglo» (CI1): piezas de la Roma de 280–146 a.C. para la ciudad de cultura 'roma'.
   ARTE PROPIO, por código: la geometría y la textura (un atlas pintado en un lienzo) salen de este archivo; sin licencia ajena.
   Cada pieza tiene el formato de getStatic(): { key, parts: [{ geo, file, mode, maps }], bb }. Todas usan la MISMA textura (ATLAS),
   así que cada lote es UNA llamada de dibujo. Fuentes y dictamen de cada pieza: js/registro.js.
     rs_templo   templo toscano (Vitruvio 4.7): podio alto de toba, escalinata delante, pronaos hondo con 2 filas de 4 columnas,
                 cella cerrada, alero muy ancho y terracotas pintadas. Frente hacia +Z. Huella de EDIF.templo (18 × 34).
     rs_muro     tramo liso de la muralla Servia (sillares de toba, h. 378 a.C.): sin almenas, coronación plana. Largo en X, como 'muro'.
     rs_torre    bastión rectangular bajo y liso (o junta entre tramos, reducido). Sin almenas.
     rs_puerta   puerta: vano con arco entre dos machones lisos, tramos de muro a los lados. Largo en X, como 'puerta'.
     rs_insula   casa de vecinos de dos alturas: bajo de tiendas en arco con zócalo rojo y un piso de enlucido, tejado a cuatro aguas (UR1: antes tres pisos).
     rs_tabernas fila de tiendas del foro con pórtico de postes y tejado de teja. Frente hacia +Z.
   ROMA_SIGLO = false deja la ciudad romana como antes (piezas de 0 A.D.). */
import { THREE } from './models.js';

export const ROMA_SIGLO = true;
export const ATLAS = 'rs_atlas';           // nombre de la textura (city3d la registra con este nombre)
export const PIEZAS = ['rs_templo', 'rs_muro', 'rs_dique', 'rs_fondo', 'rs_fondo3', 'rs_patio', 'rs_huerto', 'rs_torre', 'rs_puerta', 'rs_insula', 'rs_dom', 'rs_tabernas', 'rs_taber'];
export const esPieza = k => typeof k === 'string' && k.startsWith('rs_');

/* ---------- atlas: 1024 × 1024, regiones en píxeles [x, y, ancho, alto] ---------- */
const A = 1024;
const R = {
  toba: [0, 0, 256, 256], cal: [256, 0, 256, 256], teja: [512, 0, 256, 256], zocalo: [768, 0, 256, 256],
  ventana: [0, 256, 256, 256], taberna: [256, 256, 256, 256], columna: [512, 256, 256, 256], madera: [768, 256, 256, 256],
  timpano: [0, 512, 512, 256], friso: [512, 512, 512, 128], oscuro: [512, 640, 256, 128], toba2: [768, 640, 256, 128],
  agua: [0, 768, 256, 128], huerto: [256, 768, 256, 128], tierra: [512, 768, 256, 128]
};
function semilla(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rgb = (c, k = 1) => `rgb(${Math.round(Math.min(255, c[0] * k))},${Math.round(Math.min(255, c[1] * k))},${Math.round(Math.min(255, c[2] * k))})`;

function pintarAtlas() {
  const cv = document.createElement('canvas'); cv.width = cv.height = A; const g = cv.getContext('2d'), rnd = semilla(378);
  const ruido = (Rg, a, n = 1) => { for (let i = 0; i < Rg[2] * Rg[3] / 5 * n; i++) { const v = rnd(); g.fillStyle = v < 0.5 ? `rgba(40,30,20,${a * rnd()})` : `rgba(255,250,235,${a * rnd()})`; g.fillRect(Rg[0] + rnd() * Rg[2], Rg[1] + rnd() * Rg[3], 2, 2); } };
  const clip = (Rg, f) => { g.save(); g.beginPath(); g.rect(Rg[0], Rg[1], Rg[2], Rg[3]); g.clip(); f(); g.restore(); };
  /* sillares de toba en hiladas: color ocre-gris de la toba de Grotta Oscura, bloques algo distintos, juntas oscuras */
  const sillares = (Rg, hil, por, base, gris) => clip(Rg, () => { const h = Rg[3] / hil, w = Rg[2] / por;
    for (let r = 0; r < hil; r++) for (let k = -1; k <= por; k++) { const x = Rg[0] + k * w + (r % 2) * w / 2, y = Rg[1] + r * h, v = 0.86 + rnd() * 0.22, m = rnd() * gris;
      g.fillStyle = rgb([base[0] * (1 - m) + 150 * m, base[1] * (1 - m) + 146 * m, base[2] * (1 - m) + 136 * m], v); g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,245,220,0.10)'; g.fillRect(x + 3, y + 3, w - 6, 4); g.fillStyle = 'rgba(40,30,20,0.12)'; g.fillRect(x + 3, y + h - 7, w - 6, 4); }
    ruido(Rg, 0.22, 2); g.strokeStyle = 'rgba(58,48,36,0.75)'; g.lineWidth = 3; g.beginPath();
    for (let r = 0; r <= hil; r++) { g.moveTo(Rg[0], Rg[1] + r * h); g.lineTo(Rg[0] + Rg[2], Rg[1] + r * h); }
    for (let r = 0; r < hil; r++) for (let k = 0; k <= por; k++) { const x = Rg[0] + k * w + (r % 2) * w / 2; g.moveTo(x, Rg[1] + r * h); g.lineTo(x, Rg[1] + (r + 1) * h); } g.stroke(); });
  sillares(R.toba, 5, 3, [182, 164, 124], 0.5);
  sillares(R.toba2, 2, 3, [198, 184, 148], 0.3);
  /* enlucido blanco, con algo de suciedad abajo */
  const enlucido = Rg => { g.fillStyle = rgb([220, 205, 176]); g.fillRect(...Rg); ruido(Rg, 0.16, 3); for (let i = 0; i < 7; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '150,120,84' : '240,226,196'},${0.05 + 0.07 * rnd()})`; g.fillRect(Rg[0] + rnd() * Rg[2] * 0.8, Rg[1], 10 + rnd() * 50, Rg[3]); } /* UR1: cal sucia y cálida, con chorreones; el blanco puro parecía de cartón */ const gr = g.createLinearGradient(0, Rg[1] + Rg[3] * 0.7, 0, Rg[1] + Rg[3]); gr.addColorStop(0, 'rgba(120,100,80,0)'); gr.addColorStop(1, 'rgba(120,100,80,0.18)'); g.fillStyle = gr; g.fillRect(...Rg); };
  enlucido(R.cal);
  /* teja: tégulas en hileras y cobijas (ímbrices) en líneas que bajan por el faldón */
  clip(R.teja, () => { const [x0, y0, w, h] = R.teja; g.fillStyle = rgb([168, 78, 50]); g.fillRect(x0, y0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 21) { g.fillStyle = rgb([168, 80, 52], 0.82 + rnd() * 0.3); g.fillRect(x0 + x, y0 + y, 21, 32); g.fillStyle = 'rgba(50,18,10,0.35)'; g.fillRect(x0 + x, y0 + y + 28, 21, 4); }
    for (let x = 0; x < w; x += 21) { g.fillStyle = 'rgba(205,120,80,0.55)'; g.fillRect(x0 + x + 15, y0, 5, h); g.fillStyle = 'rgba(60,20,10,0.45)'; g.fillRect(x0 + x + 20, y0, 2, h); }
    ruido(R.teja, 0.18); });
  /* zócalo rojo pintado */
  g.fillStyle = rgb([150, 46, 34]); g.fillRect(...R.zocalo); ruido(R.zocalo, 0.16, 2);
  /* ventana pequeña en enlucido (un vano de ínsula: 3,6 de ancho × 3,35 de alto) */
  enlucido(R.ventana); { const [x0, y0, w, h] = R.ventana, ww = w * 0.2, wh = h * 0.3, wx = x0 + (w - ww) / 2, wy = y0 + h * 0.3;      // UR1: vano pequeño y alto, con contraventana de tablas entornada
    g.fillStyle = rgb([104, 74, 46]); g.fillRect(wx - 7, wy - 7, ww + 14, wh + 12); g.fillStyle = rgb([62, 48, 38]); g.fillRect(wx, wy, ww, wh);
    g.fillStyle = rgb([126, 90, 54]); g.fillRect(wx, wy, ww * 0.56, wh); g.fillStyle = 'rgba(40,26,14,0.55)'; for (let k = 1; k < 3; k++) g.fillRect(wx + ww * 0.56 * k / 3, wy, 2, wh); g.fillRect(wx, wy + wh * 0.3, ww * 0.56, 3); g.fillRect(wx, wy + wh * 0.7, ww * 0.56, 3);
    g.fillStyle = rgb([178, 160, 128]); g.fillRect(wx - 10, wy + wh + 4, ww + 20, 6); g.fillStyle = 'rgba(90,66,40,0.22)'; g.fillRect(wx - 4, wy + wh + 10, ww + 8, 40);
    g.fillStyle = 'rgba(70,50,30,0.3)'; g.fillRect(x0, y0 + h - 8, w, 8); }
  /* taberna: vano en arco (tienda abierta a la calle) con zócalo rojo y mostrador; 3,6 × 4,2 */
  enlucido(R.taberna); { const [x0, y0, w, h] = R.taberna, zh = h * 0.2, ax = x0 + w * 0.16, aw = w * 0.68, top = y0 + h * 0.3, r = aw / 2;
    g.fillStyle = rgb([150, 46, 34]); g.fillRect(x0, y0 + h - zh, w, zh);
    g.fillStyle = rgb([196, 182, 150]); g.beginPath(); g.moveTo(ax - 8, y0 + h); g.lineTo(ax - 8, top + r); g.arc(ax + r, top + r, r + 8, Math.PI, 0); g.lineTo(ax + aw + 8, y0 + h); g.closePath(); g.fill();
    g.fillStyle = rgb([44, 34, 26]); g.beginPath(); g.moveTo(ax, y0 + h); g.lineTo(ax, top + r); g.arc(ax + r, top + r, r, Math.PI, 0); g.lineTo(ax + aw, y0 + h); g.closePath(); g.fill();
    g.fillStyle = rgb([122, 84, 52]); g.fillRect(ax, y0 + h - zh * 1.1, aw * 0.62, zh * 1.1); g.fillStyle = rgb([176, 120, 70]); g.fillRect(ax, y0 + h - zh * 1.1, aw * 0.62, 6);
    for (let i = 0; i < 3; i++) { g.fillStyle = rgb([178, 104, 62], 0.85 + rnd() * 0.2); g.beginPath(); g.ellipse(ax + aw * 0.72 + i * 13, y0 + h - zh * 0.7, 6, 15, 0, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(200,180,140,0.6)'; g.fillRect(ax + 10, top + r * 0.9, aw - 20, 5); }
  /* columna: enlucido blanco liso (sin estrías) */
  g.fillStyle = rgb([238, 234, 224]); g.fillRect(...R.columna); ruido(R.columna, 0.08, 1);
  /* madera de puertas: tablas con clavos */
  clip(R.madera, () => { const [x0, y0, w, h] = R.madera; for (let x = 0; x < w; x += 32) { g.fillStyle = rgb([100, 66, 40], 0.85 + rnd() * 0.25); g.fillRect(x0 + x, y0, 32, h); g.fillStyle = 'rgba(30,18,10,0.6)'; g.fillRect(x0 + x, y0, 3, h); }
    g.fillStyle = 'rgba(30,24,20,0.8)'; for (let y = 24; y < h; y += 52) for (let x = 12; x < w; x += 32) g.fillRect(x0 + x, y0 + y, 6, 6); g.fillStyle = rgb([70, 46, 30]); g.fillRect(x0, y0 + h * 0.3, w, 14); g.fillRect(x0, y0 + h * 0.72, w, 14); });
  /* tímpano: terracota pintada (fondo rojo oscuro, figuras ocres, cenefa negra) */
  clip(R.timpano, () => { const [x0, y0, w, h] = R.timpano; g.fillStyle = rgb([128, 42, 30]); g.fillRect(x0, y0, w, h);
    for (let i = 0; i < 9; i++) { const cx = x0 + w * (0.1 + i * 0.1), s = 1 - Math.abs(i - 4) * 0.17, cy = y0 + h * 0.86;
      g.fillStyle = rgb([210, 160, 90]); g.beginPath(); g.ellipse(cx, cy - h * 0.62 * s, 9 * s + 3, 11 * s + 3, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(cx - 16 * s - 4, cy); g.lineTo(cx - 6, cy - h * 0.5 * s); g.lineTo(cx + 6, cy - h * 0.5 * s); g.lineTo(cx + 16 * s + 4, cy); g.fill();
      g.fillStyle = rgb([30, 24, 20]); g.fillRect(cx - 3, cy - h * 0.42 * s, 6, h * 0.12 * s); }
    g.fillStyle = rgb([28, 22, 18]); g.fillRect(x0, y0 + h - 18, w, 18); g.fillStyle = rgb([214, 170, 96]); for (let x = 0; x < w; x += 24) g.fillRect(x0 + x, y0 + h - 13, 12, 8); });
  /* friso de terracotas pintadas: antefijas (palmetas rojas y negras) arriba, cenefa en medio, banda roja abajo. 4 unidades × 1 */
  clip(R.friso, () => { const [x0, y0, w, h] = R.friso; g.fillStyle = rgb([204, 156, 92]); g.fillRect(x0, y0, w, h);
    g.fillStyle = rgb([150, 44, 32]); g.fillRect(x0, y0 + h * 0.74, w, h * 0.26); g.fillStyle = rgb([28, 22, 18]); g.fillRect(x0, y0 + h * 0.7, w, 5);
    for (let i = 0; i < 8; i++) { const cx = x0 + w * (i + 0.5) / 8, cy = y0 + h * 0.52; g.fillStyle = i % 2 ? rgb([30, 24, 20]) : rgb([156, 46, 32]); g.beginPath(); g.moveTo(cx - 24, cy); g.arc(cx, cy, 24, Math.PI, 0); g.closePath(); g.fill();
      g.strokeStyle = rgb([226, 196, 140]); g.lineWidth = 3; g.beginPath(); for (let k = -2; k <= 2; k++) { g.moveTo(cx, cy); g.lineTo(cx + Math.sin(k * 0.55) * 20, cy - Math.cos(k * 0.55) * 20); } g.stroke(); }
    g.strokeStyle = rgb([28, 22, 18]); g.lineWidth = 4; g.beginPath(); for (let x = 0; x < w; x += 32) { g.moveTo(x0 + x, y0 + h * 0.9); g.lineTo(x0 + x + 16, y0 + h * 0.78); g.lineTo(x0 + x + 32, y0 + h * 0.9); } g.stroke();
    g.fillStyle = rgb([28, 22, 18]); g.fillRect(x0, y0 + 4, w, 5); });
  g.fillStyle = rgb([40, 32, 26]); g.fillRect(...R.oscuro); ruido(R.oscuro, 0.1);
  /* CD5b: agua del impluvium, bancales con surcos y tierra del corral (sin rojo: no se confunden con teja) */
  g.fillStyle = rgb([64, 116, 150]); g.fillRect(...R.agua); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(190,225,240,${0.15 + 0.2 * rnd()})`; g.fillRect(R.agua[0] + rnd() * 240, R.agua[1] + rnd() * 120, 14 + rnd() * 30, 3); }
  g.fillStyle = rgb([100, 134, 58]); g.fillRect(...R.huerto); for (let y = 0; y < 128; y += 16) { g.fillStyle = rgb([78, 62, 40]); g.fillRect(R.huerto[0], R.huerto[1] + y, 256, 5); g.fillStyle = rgb([128, 160, 70]); g.fillRect(R.huerto[0], R.huerto[1] + y + 7, 256, 4); }
  g.fillStyle = rgb([140, 122, 90]); g.fillRect(...R.tierra); ruido(R.tierra, 0.3, 3);
  const t = new THREE.CanvasTexture(cv); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t;
}
let atlasT = null;
export function atlas() { return atlasT || (atlasT = pintarAtlas()); }

/* ---------- constructor de mallas: caras con teselas del atlas ---------- */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], suma = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], esc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], lon = a => Math.hypot(a[0], a[1], a[2]), uni = a => esc(a, 1 / (lon(a) || 1)), punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const uvR = (Rg, s, t) => [(Rg[0] + 2 + s * (Rg[2] - 4)) / A, (Rg[1] + 2 + (1 - t) * (Rg[3] - 4)) / A];
class Malla {
  constructor() { this.P = []; this.N = []; this.U = []; }
  v(p, n, uv) { this.P.push(p[0], p[1], p[2]); this.N.push(n[0], n[1], n[2]); this.U.push(uv[0], uv[1]); }
  /* cara plana o-ax-ay (ax × ay apunta hacia fuera); tw, th: tamaño de una tesela de la región (null = la región entera estirada) */
  cara(o, ax, ay, Rg, tw, th) {
    const W = lon(ax), H = lon(ay), nu = tw ? Math.max(1, Math.ceil(W / tw - 0.01)) : 1, nv = th ? Math.max(1, Math.ceil(H / th - 0.01)) : 1, n = uni(cruz(ax, ay));
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const s0 = tw ? i * tw / W : 0, s1 = tw ? Math.min(1, (i + 1) * tw / W) : 1, t0 = th ? j * th / H : 0, t1 = th ? Math.min(1, (j + 1) * th / H) : 1;
      const su = tw ? (s1 - s0) * W / tw : 1, tv = th ? (t1 - t0) * H / th : 1, p = (s, t) => suma(o, suma(esc(ax, s), esc(ay, t)));
      const a = p(s0, t0), b = p(s1, t0), c = p(s1, t1), d = p(s0, t1), ua = uvR(Rg, 0, 0), ub = uvR(Rg, su, 0), uc = uvR(Rg, su, tv), ud = uvR(Rg, 0, tv);
      this.v(a, n, ua); this.v(b, n, ub); this.v(c, n, uc); this.v(a, n, ua); this.v(c, n, uc); this.v(d, n, ud); }
  }
  /* caja; Rg: región o { f, b, x, X, t } por cara (f = +Z, b = −Z, X = +X, x = −X, t = arriba); caras: letras de las que se dibujan */
  caja(x0, y0, z0, x1, y1, z1, Rg, tw, th, caras = 'fbxXt') {
    const r = k => Rg[k] || (Array.isArray(Rg) ? Rg : Rg.f), h = y1 - y0;
    if (caras.includes('f')) this.cara([x0, y0, z1], [x1 - x0, 0, 0], [0, h, 0], r('f'), tw, th);
    if (caras.includes('b')) this.cara([x1, y0, z0], [x0 - x1, 0, 0], [0, h, 0], r('b'), tw, th);
    if (caras.includes('X')) this.cara([x1, y0, z1], [0, 0, z0 - z1], [0, h, 0], r('X'), tw, th);
    if (caras.includes('x')) this.cara([x0, y0, z0], [0, 0, z1 - z0], [0, h, 0], r('x'), tw, th);
    if (caras.includes('t')) this.cara([x0, y1, z1], [x1 - x0, 0, 0], [0, 0, z0 - z1], r('t'), tw, tw);
  }
  /* polígono convexo plano con la región estirada sobre su caja; arriba = +Y si arriba es true */
  poli(pts, Rg, arriba) {
    let n = [0, 0, 0]; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; n = suma(n, [(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])]); }
    n = uni(n); if (arriba && n[1] < 0) { pts = pts.slice().reverse(); n = esc(n, -1); }
    const e1 = uni(sub(pts[1], pts[0])), e2 = cruz(n, e1), q = pts.map(p => [punto(sub(p, pts[0]), e1), punto(sub(p, pts[0]), e2)]);
    const mn = [Math.min(...q.map(a => a[0])), Math.min(...q.map(a => a[1]))], mx = [Math.max(...q.map(a => a[0])), Math.max(...q.map(a => a[1]))], uv = i => uvR(Rg, (q[i][0] - mn[0]) / (mx[0] - mn[0] || 1), (q[i][1] - mn[1]) / (mx[1] - mn[1] || 1));
    for (let i = 1; i + 1 < pts.length; i++) { this.v(pts[0], n, uv(0)); this.v(pts[i], n, uv(i)); this.v(pts[i + 1], n, uv(i + 1)); }
  }
  /* cilindro abierto (columna, poste) */
  cil(r0, r1, h, seg, x, y, z, Rg) { const g = new THREE.CylinderGeometry(r1, r0, h, seg, 1, true).toNonIndexed(); g.translate(x, y + h / 2, z);
    const P = g.attributes.position, N = g.attributes.normal, UV = g.attributes.uv; for (let i = 0; i < P.count; i++) this.v([P.getX(i), P.getY(i), P.getZ(i)], [N.getX(i), N.getY(i), N.getZ(i)], uvR(Rg, UV.getX(i), UV.getY(i))); g.dispose(); }
  /* tejado a dos aguas a lo largo de Z: aleros en x = ±m a la altura ye, cumbrera en x = 0 a yc, de z0 a z1 */
  dosAguas(m, ye, yc, z0, z1, tw = 5) { const L = z1 - z0;
    this.cara([-m, ye, z0], [0, 0, L], [m, yc - ye, 0], R.teja, tw, tw); this.cara([m, ye, z1], [0, 0, -L], [-m, yc - ye, 0], R.teja, tw, tw); }
  /* tejado a cuatro aguas sobre el rectángulo x ±a, z ±b a la altura y, con cumbrera de altura h */
  cuatroAguas(a, b, y, h) { const d = Math.min(a, b), rx = a - d, rz = b - d, yc = y + h;
    const c = [[-a, y, b], [a, y, b], [a, y, -b], [-a, y, -b]], k = [[-rx, yc, rz], [rx, yc, rz], [rx, yc, -rz], [-rx, yc, -rz]];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4, p = [c[i], c[j], k[j], k[i]].filter((q, n, s) => n === 0 || lon(sub(q, s[n - 1])) > 1e-3); this.poli(p.length > 3 && lon(sub(p[3], p[0])) < 1e-3 ? p.slice(0, 3) : p, R.teja, true); }
  }
  geo() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2)); return g; }
}

/* ---------- las piezas ---------- */
function templo() {
  const m = new Malla(), H0 = 4.8, Y1 = H0 + 8.4, Y2 = Y1 + 1.4, PEN = 0.6, MX = 11.2, YR = Y2 + PEN * 8, ZF = 12.6, ZB = -17, YE = Y2 - PEN * (MX - 8);
  /* podio de toba con su moldura, brazos a los lados de la escalinata */
  m.caja(-8.9, -2, -16.9, 8.9, 0.9, 10.4, R.toba2, 4, 1, 'fbxXt'); m.caja(-8.5, 0.9, -16.5, 8.5, 4.1, 10, R.toba, 5, 3.2, 'fbxX'); m.caja(-8.9, 4.1, -16.9, 8.9, H0, 10.4, R.toba2, 4, 0.7, 'fbxXt');
  for (const s of [-1, 1]) { const a = s < 0 ? -8.5 : 5.6, b = s < 0 ? -5.6 : 8.5; m.caja(a, -2, 10, b, 4.1, 16.4, R.toba, 5, 3.2, 'fxX'); m.caja(s < 0 ? -8.9 : 5.3, 4.1, 10, s < 0 ? -5.3 : 8.9, H0, 16.8, R.toba2, 4, 0.7, 'fxXt'); }
  for (let k = 0; k < 8; k++) m.caja(-5.6, -1, 10, 5.6, H0 * (k + 1) / 8, 16.4 - k * 0.8, R.toba2, 4, 0.6, 'ft');
  /* cella cerrada (toba enlucida) con su puerta */
  m.caja(-7.6, H0, -15.6, 7.6, Y1, 1.8, R.cal, 4, 4.2, 'fbxX'); m.cara([-1.7, H0, 1.84], [3.4, 0, 0], [0, 6.2, 0], R.madera, null, null); m.cara([-2.2, H0 + 6.2, 1.83], [4.4, 0, 0], [0, 0.7, 0], R.toba2, null, null);
  /* pronaos: dos filas de cuatro columnas toscanas (fuste liso enlucido, basa y capitel sencillos) */
  for (const z of [8.4, 3.8]) for (const x of [-6.3, -2.1, 2.1, 6.3]) { m.caja(x - 0.8, H0, z - 0.8, x + 0.8, H0 + 0.4, z + 0.8, R.columna, null, null, 'fbxXt'); m.cil(0.62, 0.5, 7.5, 10, x, H0 + 0.4, z, R.columna); m.cil(0.5, 0.74, 0.3, 10, x, Y1 - 0.5, z, R.columna); m.caja(x - 0.8, Y1 - 0.25, z - 0.8, x + 0.8, Y1, z + 0.8, R.columna, null, null, 'fbxX'); }
  /* arquitrabe de madera forrado de terracotas pintadas */
  m.caja(-8.0, Y1, -15.9, 8.0, Y2, 9.2, R.friso, 4, null, 'fbxX'); m.cara([-8, Y1, 9.2], [16, 0, 0], [0, 0, -25.1], R.oscuro, null, null);
  /* tejado de teja con alero muy ancho a los lados y delante; frisos de antefijas en los aleros y en las cornisas inclinadas */
  m.dosAguas(MX, YE, YR, ZB, ZF, 5); m.caja(-0.35, YR - 0.25, ZB, 0.35, YR + 0.35, ZF, R.teja, 4, null, 'xXt');
  m.cara([-MX, YE - 0.9, ZB], [0, 0, ZF - ZB], [0, 0.9, 0], R.friso, 4, null); m.cara([MX, YE - 0.9, ZF], [0, 0, ZB - ZF], [0, 0.9, 0], R.friso, 4, null);
  for (const [z, s] of [[ZF, 1], [ZB, -1]]) { m.cara(s > 0 ? [-MX, YE - 0.9, z] : [MX, YE - 0.9, z], [s * MX, YR - YE, 0], [0, 0.9, 0], R.friso, 4, null); m.cara(s > 0 ? [0, YR - 0.9, z] : [0, YR - 0.9, z], [s * MX, YE - YR, 0], [0, 0.9, 0], R.friso, 4, null); }
  /* frontón: tímpano de terracota pintada (hundido bajo el alero) y el de detrás enlucido */
  m.poli([[-8, Y2, 9.2], [8, Y2, 9.2], [0, YR - 0.02, 9.2]], R.timpano); m.poli([[8, Y2, -15.9], [-8, Y2, -15.9], [0, YR - 0.02, -15.9]], R.cal);
  /* acroteras de terracota en la cumbrera y en las esquinas del frontón */
  m.caja(-0.5, YR, ZF - 0.7, 0.5, YR + 2.6, ZF - 0.1, R.friso, null, null, 'fbxX'); m.caja(-0.4, YR, ZB + 0.1, 0.4, YR + 1.8, ZB + 0.7, R.friso, null, null, 'fbxX');
  for (const x of [-MX + 0.4, MX - 0.4]) m.caja(x - 0.35, YE, ZF - 0.6, x + 0.35, YE + 1.4, ZF - 0.05, R.friso, null, null, 'fbxX');
  return m.geo();
}
function muro() {
  const m = new Malla(); m.caja(-19, -7, -3, 19, 10.7, 3, R.toba, 6, 4, 'fbxX'); m.caja(-19, 10.7, -3.35, 19, 11.6, 3.35, R.toba2, 6, 0.9, 'fbxXt'); return m.geo();
}
function torre() {
  const m = new Malla(); m.caja(-5, -9, -5, 5, 14.2, 5, R.toba, 5, 4, 'fbxX'); m.caja(-5.35, 14.2, -5.35, 5.35, 15.1, 5.35, R.toba2, 5, 0.9, 'fbxXt'); return m.geo();
}
function puerta() {
  const m = new Malla(), YS = 6.5, RA = 6, YT = 15, D = 5.5, N = 10;
  for (const s of [-1, 1]) { const a = s < 0 ? -19 : 10.5, b = s < 0 ? -10.5 : 19; m.caja(a, -7, -3, b, 10.7, 3, R.toba, 6, 4, s < 0 ? 'fbx' : 'fbX'); m.caja(a, 10.7, -3.35, b, 11.6, 3.35, R.toba2, 6, 0.9, s < 0 ? 'fbxt' : 'fbXt'); }
  /* machones lisos */
  m.caja(-10.5, -7, -D, -RA, YT, D, R.toba, 5, 4, 'fbxX'); m.caja(RA, -7, -D, 10.5, YT, D, R.toba, 5, 4, 'fbxX');
  /* cuerpo sobre el vano, con el arco recortado delante y detrás, y el intradós */
  for (let i = 0; i < N; i++) { const a0 = Math.PI * (1 - i / N), a1 = Math.PI * (1 - (i + 1) / N), p0 = [RA * Math.cos(a0), YS + RA * Math.sin(a0)], p1 = [RA * Math.cos(a1), YS + RA * Math.sin(a1)];
    for (const z of [D, -D]) m.poli(z > 0 ? [[p0[0], p0[1], z], [p1[0], p1[1], z], [p1[0], YT, z], [p0[0], YT, z]] : [[p1[0], p1[1], z], [p0[0], p0[1], z], [p0[0], YT, z], [p1[0], YT, z]], R.toba2);
    m.poli([[p0[0], p0[1], -D], [p1[0], p1[1], -D], [p1[0], p1[1], D], [p0[0], p0[1], D]], R.toba2); }
  m.caja(-11, YT, -D - 0.4, 11, YT + 1, D + 0.4, R.toba2, 6, 1, 'fbxXt');
  /* hojas de madera abiertas contra los lados del paso */
  for (const s of [-1, 1]) m.caja(s * RA - (s > 0 ? 0.35 : -0.05), -0.5, -D + 0.3, s * RA + (s > 0 ? -0.05 : 0.35), YS + 2.5, 0.2, R.madera, null, null, s > 0 ? 'x' : 'X');
  return m.geo();
}
function insula() {
  const m = new Malla(), X = 7.2, Z = 6.8;
  m.caja(-X, -3, -Z, X, 0.05, Z, R.toba, 5, 3, 'fbxX');
  m.caja(-X, 0, -Z, X, 4.2, Z, R.taberna, 3.6, 4.2, 'fbxX');
  m.caja(-X - 0.25, 4.05, -Z - 0.25, X + 0.25, 4.45, Z + 0.25, R.toba2, 5, 0.4, 'fbxXt');
  m.caja(-X, 4.45, -Z, X, 7.8, Z, R.ventana, 3.6, 3.35, 'fbxX');      // UR1: un piso sobre las tiendas (el tercer piso de Livio 21.62 es de 218 a.C. y fue noticia)
  m.cuatroAguas(X + 1.3, Z + 1.3, 7.8, 2.6);
  return m.geo();
}
function tabernas() {
  const m = new Malla(), X = 13.5, Z = 3;
  m.caja(-X, -2, -Z, X, 0.05, Z, R.toba, 5, 2, 'fbxX');
  m.caja(-X, 0, -Z, X, 4.6, Z, { f: R.taberna, b: R.cal, x: R.cal, X: R.cal }, 3.375, 4.6, 'fbxX');
  /* pórtico: postes enlucidos y faldón delantero largo; faldón trasero corto */
  for (let i = 0; i <= 8; i++) m.cil(0.32, 0.28, 3.9, 6, -X + 0.5 + i * (2 * X - 1) / 8, 0, 5.0, R.columna);
  const yc = 6.9, yeF = 3.9, yeB = 4.4, zf = 5.6, zb = -3.8;
  m.cara([X + 0.4, yeF, zf], [-(2 * X + 0.8), 0, 0], [0, yc - yeF, -zf], R.teja, 5, 5); m.cara([-X - 0.4, yeB, zb], [2 * X + 0.8, 0, 0], [0, yc - yeB, -zb], R.teja, 5, 5);
  m.cara([-X - 0.4, yeF - 0.5, zf], [2 * X + 0.8, 0, 0], [0, 0.5, 0], R.friso, 4, null);
  for (const s of [-1, 1]) m.poli(s > 0 ? [[X, 4.6, Z], [X, 4.6, -Z], [X, yc - 0.05, 0]] : [[-X, 4.6, -Z], [-X, 4.6, Z], [-X, yc - 0.05, 0]], R.cal);
  m.cara([-X, 4.55, 5.0], [2 * X, 0, 0], [0, 0, -2.0], R.oscuro, null, null);
  return m.geo();
}
/* relleno de las manzanas (CI1-7): casas de fondo, de uno y de tres pisos, patios con tapia y huertos del arrabal; 8 × 8 (el huerto, 10 × 10) */
function fondoViejo() { const m = new Malla(); m.caja(-3.9, -2, -3.9, 3.9, 0.05, 3.9, R.toba, 5, 2, 'fbxX'); m.caja(-3.9, 0, -3.9, 3.9, 4.6, 3.9, { f: R.ventana, b: R.cal, x: R.ventana, X: R.cal }, 3.9, 4.6, 'fbxX'); m.cuatroAguas(4.5, 4.5, 4.6, 2.2); return m.geo(); }
function fondo3Viejo() { const m = new Malla(); m.caja(-3.9, -2, -3.9, 3.9, 0.05, 3.9, R.toba, 5, 2, 'fbxX'); m.caja(-3.9, 0, -3.9, 3.9, 1.0, 3.9, R.zocalo, 4, 1, 'fbxX'); m.caja(-3.9, 1.0, -3.9, 3.9, 7.4, 3.9, R.ventana, 3.9, 3.2, 'fbxX'); m.cuatroAguas(4.9, 4.9, 7.4, 2.2); return m.geo(); }
function patioViejo() { const m = new Malla(), h = 3.2, e = 0.5; m.caja(-3.9, -1.5, -3.9, 3.9, h, -3.9 + e, R.cal, 4, h + 1.5, 'fbxXt'); m.caja(-3.9, -1.5, 3.9 - e, 3.9, h, 3.9, R.cal, 4, h + 1.5, 'fbxXt'); m.caja(-3.9, -1.5, -3.4, -3.9 + e, h, 3.4, R.cal, 4, h + 1.5, 'xXt'); m.caja(3.9 - e, -1.5, -3.4, 3.9, h, 3.4, R.cal, 4, h + 1.5, 'xXt');
  m.cara([3.9, h + 0.9, -3.4], [0, 0, 6.8], [-2.6, -0.7, 0], R.teja, 4, 4); m.caja(-3.9, -1.5, -3.4, -2.2, 3.6, 3.4, R.ventana, 3.4, 3.6, 'X'); return m.geo(); }
/* CD5b: casas romanas desde arriba (arte propio por código; huella de 6,6 m con aleros: el relleno las separa 8,4 m). Orientación: -Z mira a la calle.
   fondo = domus con atrio (compluvium e impluvium), fondo3 = ínsula con patio central y tejado en anillo, taber = taberna a la calle (un agua),
   patio = corral (cerca baja y tierra), huerto = bancales con surcos. */
Malla.prototype.anillo = function (ax, bz, yo, ix, iz, yi) {      // anillo de cuatro faldones: borde exterior (ax, bz, yo) e interior (ix, iz, yi); sube o baja según yi
  const co = [[-ax, yo, bz], [ax, yo, bz], [ax, yo, -bz], [-ax, yo, -bz]], ci = [[-ix, yi, iz], [ix, yi, iz], [ix, yi, -iz], [-ix, yi, -iz]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.poli([co[i], co[j], ci[j], ci[i]], R.teja, true); } };
function domus() { const m = new Malla(), a = 2.9;
  m.caja(-a, -2, -a, a, 0.05, a, R.toba, 5, 2, 'fbxX'); m.caja(-a, 0, -a, a, 3.3, a, { f: R.ventana, b: R.cal, x: R.ventana, X: R.cal }, 2.9, 3.3, 'fbxX');
  m.anillo(3.3, 3.3, 3.3, 1.9, 1.9, 4.5); m.anillo(1.9, 1.9, 4.5, 0.85, 0.85, 3.9);            // aleros hacia fuera, compluvium hacia dentro
  m.caja(-0.85, 1.4, -0.85, 0.85, 3.9, 0.85, R.cal, 1.7, 2.5, 'fbxX'); m.poli([[-0.85, 1.4, -0.85], [0.85, 1.4, -0.85], [0.85, 1.4, 0.85], [-0.85, 1.4, 0.85]], R.agua);     // el impluvium azul al fondo del hueco
  return m.geo(); }
function insulaPatio() { const m = new Malla(), a = 2.9, h = 6.6;
  m.caja(-a, -2, -a, a, 0.05, a, R.toba, 5, 2, 'fbxX'); m.caja(-a, 0, -a, a, 1, a, R.zocalo, 3, 1, 'fbxX'); m.caja(-a, 1, -a, a, h, a, R.ventana, 2.9, 3.2, 'fbxX');
  m.caja(-a - 0.2, h - 0.4, -a - 0.2, a + 0.2, h, a + 0.2, R.toba2, 5, 0.4, 'fbxXt');
  m.anillo(3.3, 3.3, h, 1.5, 1.5, h + 1.0);                                                  // tejado en anillo alrededor del patio
  m.caja(-1.5, 0.1, -1.5, 1.5, h + 1.0, 1.5, R.cal, 3, 4, 'fbxX'); m.poli([[-1.5, 0.15, -1.5], [1.5, 0.15, -1.5], [1.5, 0.15, 1.5], [-1.5, 0.15, 1.5]], R.tierra);
  return m.geo(); }
function taber() { const m = new Malla(), X = 3.3, z0 = -2.4, z1 = 2.0;
  m.caja(-X, -1.5, z0, X, 0.05, z1, R.toba, 5, 2, 'fbxX'); m.caja(-X, 0, z0, X, 3.2, z0 + 0.15, { b: R.taberna }, 3.3, 3.2, 'b'); m.caja(-X, 0, z1 - 0.15, X, 4.4, z1, { f: R.cal }, 3.3, 4.4, 'f');
  for (const s of [-1, 1]) m.poli([[s * X, 0, z0], [s * X, 0, z1], [s * X, 4.4, z1], [s * X, 3.2, z0]], R.cal);
  m.poli([[-X - 0.3, 3.1, z0 - 0.7], [X + 0.3, 3.1, z0 - 0.7], [X + 0.3, 4.6, z1 + 0.2], [-X - 0.3, 4.6, z1 + 0.2]], R.teja, true);      // un agua, baja hacia la calle
  m.cara([-X, 3.2, z0 - 0.02], [2 * X, 0, 0], [0, 0.5, 0], R.friso, 4, null);
  return m.geo(); }
function corral() { const m = new Malla(), a = 3.3, e = 0.18, h = 0.95;
  m.poli([[-a, 0.5, -a], [a, 0.5, -a], [a, 0.5, a], [-a, 0.5, a]], R.tierra);
  m.caja(-a, 0, -a, a, h, -a + e, R.madera, 3, 1, 'fbxXt'); m.caja(-a, 0, a - e, a, h, a, R.madera, 3, 1, 'fbxXt'); m.caja(-a, 0, -a, -a + e, h, a, R.madera, 3, 1, 'fbxXt'); m.caja(a - e, 0, -a, a, h, a, R.madera, 3, 1, 'fbxXt');
  m.caja(-a + 0.3, 0, 0.9, -a + 2.3, 2.1, a - 0.3, R.madera, 2, 2, 'fbxX'); m.poli([[-a + 0.1, 2.0, 0.7], [-a + 2.5, 2.0, 0.7], [-a + 2.5, 2.6, a - 0.1], [-a + 0.1, 2.6, a - 0.1]], R.teja, true);      // cobertizo
  m.caja(1.0, 0, -1.2, 2.2, 0.7, 0.0, R.toba2, 1.2, 0.7, 'fbxXt');                                 // un montón de heno / un pesebre
  return m.geo(); }
function huerto() { const m = new Malla(), a = 3.3, h = 0.5, e = 0.28;
  m.caja(-a, 0, -a, a, h, -a + e, R.toba2, 4, 0.5, 'fbxXt'); m.caja(-a, 0, a - e, a, h, a, R.toba2, 4, 0.5, 'fbxXt'); m.caja(-a, 0, -a + e, -a + e, h, a - e, R.toba2, 4, 0.5, 'xXt'); m.caja(a - e, 0, -a + e, a, h, a - e, R.toba2, 4, 0.5, 'xXt');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x0 = sx > 0 ? 0.25 : -2.75, z0 = sz > 0 ? 0.25 : -2.75; m.caja(x0, 0, z0, x0 + 2.5, 0.4, z0 + 2.5, { t: R.huerto, f: R.huerto, b: R.huerto, x: R.huerto, X: R.huerto }, 2.5, 2.5, 'fbxXt'); }
  return m.geo(); }
const HACER = { rs_templo: templo, rs_muro: muro, rs_dique: muro, rs_fondo: domus, rs_fondo3: insulaPatio, rs_patio: corral, rs_huerto: huerto, rs_taber: taber, rs_torre: torre, rs_puerta: puerta, rs_insula: insulaPatio, rs_dom: domus, rs_tabernas: tabernas };
const hechas = new Map();
export function pieza(k) {
  if (hechas.has(k)) return hechas.get(k); const f = HACER[k]; if (!f) return null;
  const geo = f(); geo.computeBoundingBox(); const b = geo.boundingBox, st = { key: k, parts: [{ geo, file: ATLAS, mode: 0, maps: {} }], bb: [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z] };
  hechas.set(k, st); return st;
}

/* ---------- casas pared con pared (solo vista): cuánto estirar cada casa a lo largo de su calle para tocar a su vecina ---------- */
let firmaV = '', vecinas = new Map();
export function estirones(parcelas) {
  const f = parcelas.length + '|' + parcelas.filter(l => l.casa && !l.fuera).length; if (f === firmaV) return vecinas; firmaV = f; vecinas = new Map();
  const cs = parcelas.filter(l => l.casa && !l.fuera), por = new Map(); for (const l of cs) { const k = l.via + '|' + l.lado; if (!por.has(k)) por.set(k, []); por.get(k).push(l); }
  for (const lista of por.values()) for (const l of lista) { let iz = 0, de = 0; const cx = Math.cos(l.ang), sz = Math.sin(l.ang);
    for (const o of lista) { if (o === l) continue; const dx = o.x - l.x, dz = o.z - l.z, a = dx * cx + dz * sz, t = Math.abs(-dx * sz + dz * cx); if (t > 4 || Math.abs(a) < 10 || Math.abs(a) > 19) continue; if (a > 0) de = Math.max(de, a); else iz = Math.max(iz, -a); }
    if (iz || de) vecinas.set(l.id, { iz, de }); }
  return vecinas;
}
/* ¿esta casa es ínsula? Barrios de nivel IV: buena parte de las casas de III y IV; barrios de III: alguna de IV */
export function esInsula(l, nb) { const c = l.casa; if (!c || c.ruina || c.nivel < 3) return false; const b = nb === undefined ? (c.nivel === 4 ? 3 : 2) : nb; return (b >= 4 && (c.nivel === 4 ? l.tipo < 0.6 : l.tipo < 0.3)) || (b === 3 && c.nivel === 4 && l.tipo < 0.25); }
/* ---------- CD5b: huellas de las casas de parcela: ninguna pisa a otra, ni a una choza ni (con el relleno, que las respeta) a una vecina de fondo ---------- */
const rect = (x, z, g, hx, hz) => ({ x, z, hx, hz, c: Math.cos(g), s: Math.sin(g) });      // eje X local = (c, -s), eje Z local = (s, c)
export function chocan(a, b, m = 0) {
  const dx = b.x - a.x, dz = b.z - a.z;
  for (const [nx, nz] of [[a.c, -a.s], [a.s, a.c], [b.c, -b.s], [b.s, b.c]]) {
    const ra = a.hx * Math.abs(nx * a.c - nz * a.s) + a.hz * Math.abs(nx * a.s + nz * a.c), rb = b.hx * Math.abs(nx * b.c - nz * b.s) + b.hz * Math.abs(nx * b.s + nz * b.c);
    if (Math.abs(dx * nx + dz * nz) > ra + rb + m) return false; }
  return true;
}
export const MEDIA = 3.3;       // media huella de las piezas de casa (aleros incluidos) a escala 1
/* puntos de la línea de cada calle (cada 1,2 m) en casillas de 8 m: [x, z, medio ancho] */
const callesDe = E => [...(E.vias || []).filter(v => v.p && v.w >= 2), ...(E.urbe && E.urbe.calles || [])];
function puntosCalle(E) { const pts = new Map(), P = (x, z) => Math.floor(x / 8) + ',' + Math.floor(z / 8);
  for (const v of callesDe(E)) { const m = Math.max(0.4, v.w / 2 - 0.3);
    for (let i = 1; i < v.p.length; i++) { const a = v.p[i - 1], b = v.p[i], ax = a[0] !== undefined ? a[0] : a.x, az = a[1] !== undefined ? a[1] : a.z, bx = b[0] !== undefined ? b[0] : b.x, bz = b[1] !== undefined ? b[1] : b.z, L = Math.hypot(bx - ax, bz - az); if (!L) continue;
      for (let t = 0; t <= L; t += 1.2) { const x = ax + (bx - ax) * t / L, z = az + (bz - az) * t / L, k = P(x, z); if (!pts.has(k)) pts.set(k, []); pts.get(k).push([x, z, m, Math.atan2(bz - az, bx - ax)]); } } }
  return pts; }
const pisaCalle = (q, pts) => { const Rr = Math.hypot(q.hx, q.hz) + 1; for (let a = Math.floor((q.x - Rr) / 8); a <= Math.floor((q.x + Rr) / 8); a++) for (let b = Math.floor((q.z - Rr) / 8); b <= Math.floor((q.z + Rr) / 8); b++) for (const [x, z, m] of pts.get(a + ',' + b) || []) { const dx = x - q.x, dz = z - q.z; if (Math.abs(dx * q.c - dz * q.s) < q.hx + m && Math.abs(dx * q.s + dz * q.c) < q.hz + m) return true; } return false; };
let firmaH = '', huellasP = new Map(), listaH = [];
export function huellasParcelas(E) {
  const f = E.parcelas.map(l => l.casa && !l.fuera ? l.id + (l.casa.ruina ? 'r' : l.casa.nivel) : '').join('|') + '#' + (E.barrios || []).map(b => b.nivel).join(''); if (f === firmaH) return huellasP; firmaH = f; huellasP = new Map(); listaH = [];
  const cs = E.parcelas.filter(l => l.casa && !l.fuera).sort((a, b) => a.id - b.id);
  const giroDe = l => -l.ang + (l.lado > 0 ? Math.PI : 0), fijas = [];
  for (const l of cs) { if (l.casa.ruina) { fijas.push(rect(l.x, l.z, giroDe(l), 5, 5)); continue; } if (l.casa.nivel === 1 && !E.urbe) fijas.push(rect(l.x, l.z, giroDe(l), 3.5, 3.5)); }
  const puestas = fijas.slice(), calP = puntosCalle(E);
  for (const l of cs) { const c = l.casa; if (c.ruina || (c.nivel === 1 && !E.urbe)) continue;
    const nb = E.barrios && E.barrios[l.barrio] ? E.barrios[l.barrio].nivel : undefined, ins = esInsula(l, nb), g = giroDe(l);
    let s = ins ? 1.75 : c.nivel >= 4 ? 1.6 : c.nivel === 3 ? 1.5 : c.nivel === 2 ? 1.3 : 1.1, r = rect(l.x, l.z, g, MEDIA * s, MEDIA * s);
    const ch = q => pisaCalle(q, calP) || puestas.some(o => (Math.abs(o.x - q.x) + Math.abs(o.z - q.z) < 40) && chocan(q, o, 0.5));
    while (ch(r) && s > 0.62) { s *= 0.93; r = rect(l.x, l.z, g, MEDIA * s, MEDIA * s); }
    if (ch(r)) { huellasP.set(l.id, { s: 0, k: null }); continue; }
    puestas.push(r); huellasP.set(l.id, { s, k: ins || c.nivel >= 4 && l.tipo < 0.5 ? 'rs_insula' : 'rs_dom' }); }
  listaH = puestas; return huellasP;
}
export const huellasListas = () => listaH;
/* CD5b: del relleno se quita lo que pisaría a otra casa (de parcela o de relleno) o una calle. Prioridad: ínsulas, domus, tabernas, corrales y huertos */
let depKey = null, depR = null;
function depurar(r, E, K) {
  const ge = 24, grid = new Map(), KC = (x, z) => Math.floor(x / ge) + ',' + Math.floor(z / ge), pts = puntosCalle(E);
  const add = q => { const k = KC(q.x, q.z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(q); };
  for (const o of listaH) add(o);
  const libre = q => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const o of grid.get(KC(q.x + i * ge, q.z + j * ge)) || []) if (chocan(q, o, 0.15)) return false;
    return !pisaCalle(q, pts); };
  const out = { celdas: r.celdas };
  for (const n of ['fondo3', 'fondo', 'taber', 'patio', 'huerto']) out[n] = r[n].filter(q => { const a = rect(q.x, q.z, q.giro, MEDIA * (q.sx || 1) + 0.05, MEDIA + 0.05); if (!libre(a)) return false; add(a); return true; });
  /* segunda pasada: huecos a pie de calle, casa con casa (7,4 m), hasta tres filas; solo donde no hay edificio, río ni cuesta fuerte */
  if (E.urbe && K && K.cercado) { const { X0, Z0, C, N } = K, O = E.ocup, f = E.foro, rmax = Math.max(...E.urbe.RU), hh = (i, j) => { const v = Math.sin(i * 12.9898 + j * 78.233 + (E.semilla | 0)) * 43758.5453; return v - Math.floor(v); };
    const cel = (x, z) => { const i = Math.floor((x - X0) / C), j = Math.floor((z - Z0) / C); return i < 1 || j < 1 || i >= N - 1 || j >= N - 1 ? -1 : j * N + i; };
    let n = 0; for (const c of E.urbe.calles) { const P = c.p;
      for (let q = 1; q < P.length; q++) { const a = P[q - 1], b = P[q], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (!L) continue; const ux = dx / L, uz = dz / L, ang = Math.atan2(dz, dx);
        for (let s = 3.7; s < L; s += 7.4) { n++; for (const lado of [1, -1]) for (let fila = 0; fila < 3; fila++) { const o = c.w / 2 + 3.9 + fila * 7.4, x = a[0] + ux * s - uz * o * lado, z = a[1] + uz * s + ux * o * lado, rr = hh(n * 7 + fila, lado + 5);
          if (rr > 0.94 || !K.cercado(E, x, z)) continue; let ok = true; for (const [p1, p2] of [[0, 0], [-3, -3], [3, -3], [-3, 3], [3, 3]]) { const k = cel(x + ux * p1 - uz * p2, z + uz * p1 + ux * p2); if (k < 0 || O[k]) { ok = false; break; } } if (!ok) continue;
          if (K.distRio(x, z) < 30 || K.altura(x, z) < K.NIVEL_RIO + 0.9) continue; const y = [K.altura(x - 4, z - 4), K.altura(x + 4, z - 4), K.altura(x - 4, z + 4), K.altura(x + 4, z + 4)]; if (Math.max(...y) - Math.min(...y) > 4.4) continue;
          const giro = -ang + (lado > 0 ? 0 : Math.PI), d = Math.hypot(x - f.x, z - f.z) / rmax, t = hh(lado + 9, n + fila * 131), rc = rect(x, z, giro, MEDIA + 0.05, MEDIA + 0.05); if (!libre(rc)) continue;
          const kind = fila === 0 && t > 0.6 ? 'taber' : rr < 0.3 - 0.26 * d ? 'fondo3' : d > 0.86 && rr < 0.6 ? 'huerto' : rr < 0.86 ? 'fondo' : 'patio';
          add(rc); out[kind].push({ x, z, giro, sx: 1, sy: kind === 'fondo3' ? 0.85 + 0.3 * t : kind === 'fondo' ? 0.8 + 0.4 * t : 1, tono: t }); } } } } }
  /* tercera pasada: el interior de las manzanas, en rejilla de 7,6 m y orientado como la calle más cercana (a menos de 26 m) */
  if (E.urbe && K && K.cercado) { const { X0, Z0, C, N } = K, O = E.ocup, f = E.foro, rmax = Math.max(...E.urbe.RU), hh = (i, j) => { const v = Math.sin(i * 12.9898 + j * 78.233 + (E.semilla | 0) + 7) * 43758.5453; return v - Math.floor(v); };
    const cel = (x, z) => { const i = Math.floor((x - X0) / C), j = Math.floor((z - Z0) / C); return i < 1 || j < 1 || i >= N - 1 || j >= N - 1 ? -1 : j * N + i; };
    for (let gz = Math.floor((f.z - rmax * 1.3) / 7.6); gz <= Math.floor((f.z + rmax * 1.3) / 7.6); gz++) for (let gx = Math.floor((f.x - rmax * 1.3) / 7.6); gx <= Math.floor((f.x + rmax * 1.3) / 7.6); gx++) {
      const rr = hh(gx, gz); if (rr > 0.72) continue; const x = gx * 7.6 + (rr - 0.36) * 1.2, z = gz * 7.6 + (hh(gz, gx) - 0.5) * 1.2; if (!K.cercado(E, x, z)) continue;
      let ang = null, mejor = 26; for (let a = Math.floor((x - 26) / 8); a <= Math.floor((x + 26) / 8); a++) for (let b = Math.floor((z - 26) / 8); b <= Math.floor((z + 26) / 8); b++) for (const [px, pz, , an] of pts.get(a + ',' + b) || []) { const d = Math.hypot(px - x, pz - z); if (d < mejor) { mejor = d; ang = an; } }
      if (ang === null) continue; let ok = true; for (const [p1, p2] of [[0, 0], [-3, -3], [3, -3], [-3, 3], [3, 3]]) { const k = cel(x + p1, z + p2); if (k < 0 || O[k]) { ok = false; break; } } if (!ok) continue;
      if (K.distRio(x, z) < 30 || K.altura(x, z) < K.NIVEL_RIO + 0.9) continue; const y = [K.altura(x - 4, z - 4), K.altura(x + 4, z - 4), K.altura(x - 4, z + 4), K.altura(x + 4, z + 4)]; if (Math.max(...y) - Math.min(...y) > 4.4) continue;
      const giro = -ang + (rr < 0.36 ? 0 : Math.PI), d = Math.hypot(x - f.x, z - f.z) / rmax, t = hh(gz + 5, gx + 3), rc = rect(x, z, giro, MEDIA + 0.05, MEDIA + 0.05); if (!libre(rc)) continue;
      const kind = d > 0.8 && rr < 0.2 ? 'huerto' : rr > 0.66 ? 'patio' : rr < 0.12 * (1 - d) ? 'fondo3' : 'fondo'; add(rc); out[kind].push({ x, z, giro, sx: 1, sy: kind === 'fondo3' ? 0.85 + 0.3 * t : kind === 'fondo' ? 0.8 + 0.4 * t : 1, tono: t }); } }
  for (const n of ['fondo', 'fondo3', 'patio', 'huerto', 'taber']) if (out[n].length > CUPO[n]) out[n].length = CUPO[n];
  return out;
}
/* tabernas del foro: dos filas en los lados largos de la plaza, dentro de su huella y lejos del edificio del foro */
export function tabernasForo(f) { const c = Math.cos(f.ang), s = Math.sin(f.ang), u = 7.2, v = f.d / 2 - 3.4;
  return [1, -1].map(k => ({ x: f.x + c * u - s * v * k, z: f.z + s * u + c * v * k, giro: -f.ang + (k > 0 ? Math.PI : 0) })); }

/* ---------- relleno de la vista (CI1-7): más ciudad a la vista, sin contar en la población ----------
   Va en las celdas LIBRES de la rejilla de ocupación (E.ocup === 0) y cede: se recalcula en cuanto cambia la ciudad (E.rev) y no se
   pone bajo el fantasma. Dentro del recinto, solo dentro de las manzanas (entre calles y cerca de casas); fuera, a lo largo de las vías de salida.
   C = { X0, Z0, C, N, barrioDe, cercado, altura, distRio, NIVEL_RIO }. Devuelve { fondo: [...], fondo3, patio, huerto, celdas: Set } */
export const RELLENO = true;
let rellenoF = -1, rellenoE = null, rellenoR = null;
export function relleno(E, C, fantasma, EDIF) {
  if (!RELLENO || !E || !E.fundada || !E.ocup) return null;
  if (rellenoE !== E || rellenoF !== E.rev) { rellenoE = E; rellenoF = E.rev; rellenoR = calcularRelleno(E, C); depKey = null; }
  huellasParcelas(E); const kd = firmaH + '#' + rellenoF; if (depKey !== kd) { depKey = kd; depR = depurar(rellenoR, E, C); }
  const base = depR; if (!fantasma) return base;
  const d = EDIF && EDIF[fantasma.id], r = (d ? Math.max(d.w || 16, d.d || 16) / 2 : 12) + 9, fx = fantasma.x, fz = fantasma.z, fuera = q => Math.hypot(q.x - fx, q.z - fz) > r;
  return { fondo: base.fondo.filter(fuera), fondo3: base.fondo3.filter(fuera), patio: base.patio.filter(fuera), huerto: base.huerto.filter(fuera), taber: base.taber.filter(fuera), celdas: base.celdas };
}
function calcularRelleno(E, K) {
  const { X0, Z0, C, N } = K, O = E.ocup, out = { fondo: [], fondo3: [], patio: [], huerto: [], taber: [], celdas: new Set() };
  const casa = new Uint8Array(N * N); for (const l of E.parcelas) { if (!l.casa || l.fuera) continue; const i0 = Math.floor((l.x - X0) / C), j0 = Math.floor((l.z - Z0) / C), m = 7;
    for (let j = j0 - m; j <= j0 + m; j++) for (let i = i0 - m; i <= i0 + m; i++) if (i >= 0 && j >= 0 && i < N && j < N && (i - i0) ** 2 + (j - j0) ** 2 <= m * m) casa[j * N + i] = Math.max(casa[j * N + i], l.casa.nivel); }
  const f = E.foro, h = (i, j) => { let x = Math.imul(i * 374761393 + j * 668265263, 1274126177) ^ (E.semilla | 0); x = Math.imul(x ^ (x >>> 13), 1103515245); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
  for (let j = 2; j < N - 3; j += 2) for (let i = 2; i < N - 3; i += 2) {
    let libre = true; for (let b = j - 1; b <= j + 2 && libre; b++) for (let a = i - 1; a <= i + 2; a++) { const o = O[b * N + a]; if (o && !(o === 5 && false)) { libre = false; break; } }
    if (!libre) continue;
    const k = j * N + i, x = X0 + (i + 1) * C, z = Z0 + (j + 1) * C, dv = E.dVia[k]; if (dv > 60) continue;
    if (K.distRio(x, z) < 32 || K.altura(x, z) < K.NIVEL_RIO + 1.5) continue;
    const y = [K.altura(x - 4, z - 4), K.altura(x + 4, z - 4), K.altura(x - 4, z + 4), K.altura(x + 4, z + 4)]; if (Math.max(...y) - Math.min(...y) > 2.6) continue;
    const dentro = K.cercado(E, x, z), r = h(i, j), giro = -(E.aVia[k] || 0) + (r < 0.5 ? 0 : Math.PI / 2), t = h(j, i);
    if (dentro) { const nv = casa[k] || 2; if (dv < 10 || dv > 56) continue; const bi = K.barrioDe(E, x, z); if (bi < 0) continue; const nb = E.barrios[bi] ? E.barrios[bi].nivel || 1 : 1;
      const q = { x, z, giro, sy: 0.85 + 0.4 * t, tono: t, k };
      if ((nb >= 3 || nv >= 4) && r < 0.45) out.fondo3.push(Object.assign(q, { sy: 0.9 + 0.2 * t })); else if (r < 0.8 || nb >= 3) out.fondo.push(q); else out.patio.push(Object.assign(q, { sy: 1 })); }
    else { if (dv < 10 || dv > 24 || !(E.tVia[k] === 1 || E.tVia[k] === 2)) continue; const dx = x - f.x, dz = z - f.z, dd = Math.hypot(dx, dz); if (!K.cercado(E, x - dx / dd * 160, z - dz / dd * 160) || r > 0.7) continue;
      const q = { x, z, giro, sy: 0.75 + 0.2 * t, tono: t, k }; if (t < 0.45) out.fondo.push(q); else out.huerto.push(Object.assign(q, { sy: 1 })); }
    for (let b = j - 1; b <= j + 2; b++) for (let a = i - 1; a <= i + 2; a++) out.celdas.add(b * N + a);
  }
  if (E.urbe) rellenoUrbe(E, K, out, h);
  for (const n of ['fondo', 'fondo3', 'patio', 'huerto', 'taber']) if (out[n].length > CUPO[n]) out[n].length = CUPO[n];
  return out;
}
/* CI3a: cupo de cada pieza de relleno (lo usa también city3d.js para sus lotes) */
export const CUPO = { fondo: 2600, fondo3: 1500, patio: 1100, huerto: 900, taber: 900 };
/* CI3a (plano 3): casas de relleno a los dos lados de las calles de adorno de la urbe (E.urbe.calles), en hilera, pared con pared y con
   huecos sueltos; más ínsulas cerca del foro, patios y huertos hacia el borde. Nada pisa calles, parcelas, edificios ni campos (E.ocup), ni otra casa */
function rellenoUrbe(E, K, out, h) {
  const { X0, Z0, C, N } = K, O = E.ocup, f = E.foro, rmax = Math.max(...E.urbe.RU), usada = new Uint8Array(N * N);
  const cel = (x, z) => { const i = Math.floor((x - X0) / C), j = Math.floor((z - Z0) / C); return i < 1 || j < 1 || i >= N - 1 || j >= N - 1 ? -1 : j * N + i; };
  for (const k of out.celdas) usada[k] = 1;
  /* CV4a: calles y casas de relleno se apuntan en una rejilla fina de 1 m (la de 4 m del juego dejaba media calle sin casas: la esquina de la casa caía
     en la misma celda que la calle). 2 = calle, 1 = casa. Solo vista: no toca E.ocup.
     Se apunta algo menos que el tamaño real (una celda de 1 m ya añade su ancho) y se prueba la huella entera de la casa nueva */
  const NF = N * C, fina = new Uint8Array(NF * NF), cf = (x, z) => { const i = Math.floor(x - X0), j = Math.floor(z - Z0); return i < 0 || j < 0 || i >= NF || j >= NF ? -1 : j * NF + i; };
  for (const c of E.urbe.calles) { const m = c.w / 2; for (let q = 1; q < c.p.length; q++) { const a = c.p[q - 1], b = c.p[q], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!L) continue; const u = (b[1] - a[1]) / L, v = -(b[0] - a[0]) / L;
    for (let s = 0; s <= L; s += 0.7) for (let o = -m; o <= m + 0.01; o += 0.7) { const k = cf(a[0] + (b[0] - a[0]) * s / L + u * o, a[1] + (b[1] - a[1]) * s / L + v * o); if (k >= 0) fina[k] = 2; } } }
  const MUE = [-3.5, -1.75, 0, 1.75, 3.5];
  let n = 0;
  for (const c of E.urbe.calles) { const P = c.p; let paso = 4;
    for (let q = 1; q < P.length; q++) { const a = P[q - 1], b = P[q], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); if (!L) continue; const ux = dx / L, uz = dz / L, ang = Math.atan2(dz, dx);
      let s = paso; for (; s < L; s += 8.4) { n++;
        for (const lado of [1, -1]) for (let fila = 0; fila < 3; fila++) { const r = h(n + fila * 7919, lado + 5), t = h(lado + 9, n + fila * 104729); if (r > (fila ? 0.9 : 0.95)) break;            // algún solar vacío suelto
          /* CV4a: con calles torcidas las manzanas son hondas; detrás de la casa que da a la calle van hasta dos filas más, espalda con espalda, y la manzana se llena.
             La primera fila va pegada a la calle (a un paso del borde), como en un casco viejo */
          const o = c.w / 2 + 5.1 + (r * 13 % 1) * 0.6 + fila * 8.3, x = a[0] + ux * s - uz * o * lado, z = a[1] + uz * s + ux * o * lado; let ok = true; const ks = [];
          for (const [p1, p2] of [[0, 0], [-3, -3], [3, -3], [-3, 3], [3, 3]]) { const k = cel(x + ux * p1 - uz * p2, z + uz * p1 + ux * p2); if (k < 0 || O[k] || usada[k] || E.dVia[k] < 6) { ok = false; break; } ks.push(k); }
          if (ok) for (const p1 of MUE) { for (const p2 of MUE) { const k = cf(x + ux * p1 - uz * p2, z + uz * p1 + ux * p2); if (k < 0 || fina[k]) { ok = false; break; } } if (!ok) break; }
          if (!ok) { if (fila) break; continue; }                                    /* en primera fila un hueco (otra calle, otra casa) no corta el lado: se prueba el otro */
          if (K.distRio(x, z) < 30 || K.altura(x, z) < K.NIVEL_RIO + 0.9) break;      /* CV4a: 0,9 (antes 1,5): la vega baja del noreste tenía calles y ninguna casa */
          const y = [K.altura(x - 4, z - 4), K.altura(x + 4, z - 4), K.altura(x - 4, z + 4), K.altura(x + 4, z + 4)]; if (Math.max(...y) - Math.min(...y) > 4.4) break;      /* CV4a: 4,4 (antes 2,8): las laderas también se edifican; el zócalo de la casa tapa el desnivel */
          for (const k of ks) out.celdas.add(k);
          for (let p1 = -3.3; p1 <= 3.31; p1 += 0.825) for (let p2 = -3.3; p2 <= 3.31; p2 += 0.825) { const k = cf(x + ux * p1 - uz * p2, z + uz * p1 + ux * p2); if (k >= 0 && !fina[k]) fina[k] = 1; }
          const d = Math.hypot(x - f.x, z - f.z) / rmax, giro = -ang + (lado > 0 ? 0 : Math.PI), q0 = { x, z, giro, sx: 0.92 + 0.12 * t, sy: 0.8 + 0.45 * t, tono: t, k: ks[0] };
          if (r < 0.3 - 0.26 * d) out.fondo3.push(Object.assign(q0, { sy: 0.85 + 0.3 * t })); else if (d > 0.86 && r < 0.6) out.huerto.push(Object.assign(q0, { sy: 1, sx: 0.85 })); else if (r < 0.86) { if (fila === 0 && t > 0.62) out.taber.push(Object.assign(q0, { sy: 1 })); else out.fondo.push(q0); } else out.patio.push(Object.assign(q0, { sy: 1 })); } }
      paso = s - L; } }
}
