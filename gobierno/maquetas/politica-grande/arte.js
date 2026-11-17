// Dibujo de línea de la maqueta «política grande»: caras y lugares. SVG hecho a mano, sin imágenes.
// Todas las funciones devuelven CADENAS de SVG. Estilo: grabado en bronce, trazo redondeado fijo, planos.

const C = {
  noche: '#0b1016', rojo: '#c0281f', oro: '#e9c063', bronce: '#b8862b', marmol: '#f1ead9',
  piedra: '#9aa6b4', oliva: '#8fae5a', terracota: '#d9764a',
  ter: '#8FAE5A', mer: '#5AA6C4', mil: '#D0443A',
};
const BANDO = { ter: C.ter, mer: C.mer, mil: C.mil };
const colorBando = (b) => (b ? (BANDO[b] || b) : null);
let _n = 0;
const f1 = (n) => Math.round(n * 10) / 10;

// ---- curvas: Catmull-Rom convertido a Bézier cúbico (perfiles suaves) ----
function suave(pts, cerrado) {
  const n = pts.length;
  const g = (i) => (cerrado ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  const m = cerrado ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + (cerrado ? 'Z' : '');
}
const esc = (pts, k, cx = 46, cy = 44) => pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);

// ============================================================ 1. CARAS
// n: nariz r=recta a=aguileña o=rota c=chata. p: pelo c=corto r=ralo k=calvo con corona z=rizado.
// pc: color del pelo 0 oscuro 1 castaño 2 gris 3 blanco.
const CARAS = {
  apio:      { e: 40, cr: 2, al: 0, fr: 1, ce: 3, n: 'r', nl: 6, me: 3, ma: 3, pa: 0, lb: 0.4, cu: 5, p: 'c', pc: 0, ba: 0, so: 0, hu: 0 },
  fulvio:    { e: 55, cr: 3, al: -1, fr: 0, ce: 1, n: 'c', nl: 5, me: 0, ma: 1, pa: 1, lb: 2, cu: 8, p: 'r', pc: 2, ba: 0, so: 0, hu: 0 },
  valerio:   { e: 45, cr: 0, al: 1, fr: 1, ce: 1, n: 'r', nl: 7, me: 2, ma: 1, pa: 0, lb: 0.8, cu: 1, p: 'z', pc: 1, ba: 0, so: 0.3, hu: 0 },
  postumio:  { e: 60, cr: -1, al: 0, fr: 0, ce: 2, n: 'a', nl: 8, me: 2, ma: 2, pa: 0, lb: 0, cu: 0, p: 'r', pc: 2, ba: 0, so: 0, hu: 1 },
  atilio:    { e: 50, cr: 5, al: -1, fr: 1, ce: 1, n: 'r', nl: 5, me: 0, ma: 0.5, pa: 0.3, lb: 1.4, cu: 6, p: 'c', pc: 2, ba: 0, so: 0.7, hu: 0 },
  otacilio:  { e: 38, cr: 2, al: -2, fr: -1, ce: 2, n: 'r', nl: 5, me: 1, ma: 1, pa: 0, lb: 1, cu: 4, p: 'c', pc: 1, ba: 0, so: 0, hu: 0 },
  marcio:    { e: 70, cr: 0, al: 1, fr: 1, ce: 2, n: 'a', nl: 7, me: 0, ma: 0, pa: 0.4, lb: 0, cu: 2, p: 'k', pc: 3, ba: 0, so: 0, hu: 1 },
  blasion:   { e: 58, cr: 3, al: -1, fr: -1, ce: 2, n: 'o', nl: 5, me: 3, ma: 3, pa: 0, lb: 0.8, cu: 7, p: 'c', pc: 2, ba: 0, so: 0, hu: 0 },
  coruncanio:{ e: 68, cr: 1, al: 1, fr: 1, ce: 1, n: 'r', nl: 6, me: 1, ma: 1, pa: 0, lb: 0, cu: 2, p: 'r', pc: 3, ba: 1, so: 0.2, hu: 1 },
  fabio:     { e: 52, cr: -2, al: 2, fr: 2, ce: 1, n: 'r', nl: 9, me: 0, ma: 1, pa: 0, lb: 0, cu: 0, p: 'r', pc: 2, ba: 0, so: 0, hu: 1 },
  junio:     { e: 42, cr: 3, al: -1, fr: 0, ce: 1, n: 'c', nl: 4, me: 1, ma: 0, pa: 0.8, lb: 2, cu: 7, p: 'c', pc: 1, ba: 0, so: 1, hu: 0 },
  duilio:    { e: 36, cr: 0, al: 0, fr: 1, ce: 3, n: 'o', nl: 6, me: 2, ma: 2, pa: 0, lb: 0.6, cu: 3, p: 'c', pc: 0, ba: 0, so: 0.3, hu: 0 },
  aquilio:   { e: 34, cr: -1, al: 1, fr: 1, ce: 2, n: 'r', nl: 6, me: 2, ma: 2, pa: 0, lb: 0, cu: 1, p: 'c', pc: 0, ba: 0, so: 0, hu: 1 },
  escipion:  { e: 30, cr: 1, al: 0, fr: 2, ce: 1, n: 'a', nl: 8, me: 1, ma: 1, pa: 0, lb: 0.6, cu: 3, p: 'z', pc: 1, ba: 0, so: 0, hu: 0 },
  sulpicio:  { e: 33, cr: 4, al: -1, fr: 0, ce: 0.5, n: 'c', nl: 3, me: -1, ma: 0, pa: 0.5, lb: 1.5, cu: 6, p: 'c', pc: 1, ba: 0, so: 1, hu: 0 },
};

function hashParams(id) {
  let h = 2166136261;
  for (const ch of String(id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const r = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const el = (a) => a[Math.floor(r() * a.length)];
  const e = 30 + Math.floor(r() * 41);
  const p = e > 62 ? el(['k', 'r', 'r', 'c']) : el(['c', 'c', 'z', 'r']);
  return {
    e, cr: f1(r() * 6 - 1.5), al: f1(r() * 4 - 2), fr: f1(r() * 4 - 1.5), ce: f1(r() * 3), n: el(['r', 'a', 'o', 'c', 'r']),
    nl: 3 + Math.floor(r() * 7), me: f1(r() * 5 - 1.5), ma: f1(r() * 3), pa: f1(r() * (e > 50 ? 1 : 0.5)),
    lb: f1(r() * 2), cu: f1(r() * 8), p, pc: e > 62 ? el([2, 3]) : e > 48 ? el([1, 2, 2]) : el([0, 1]),
    ba: r() < 0.15 ? 1 : 0, so: r() < 0.25 ? 0.8 : 0, hu: r() < 0.35 ? 1 : 0,
  };
}

function cabeza(P) {
  const { cr, al, fr, ce, n, e } = P;
  const me = P.me * 1.5, ma = P.ma * 1.4, pa = P.pa * 1.5, cu = P.cu * 1.3, lb = P.lb, L = P.nl * 1.15;
  let nariz;
  if (n === 'a') nariz = [[66 + L * 0.45, 49.5], [66 + L * 0.75, 52.5], [66 + L * 0.95, 56.3], [66 + L * 0.8, 59], [65.6, 60]];
  else if (n === 'o') nariz = [[66.6 + L * 0.2, 49.5], [67.4 + L * 0.35, 52], [66.4 + L * 0.3, 54.2], [66 + L, 57.2], [65.8 + L * 0.7, 59.6], [65.4, 60]];
  else if (n === 'c') nariz = [[66 + L * 0.3, 50.5], [66 + L * 0.65, 54.5], [66 + L * 0.8, 57], [66 + L * 0.45, 59.2], [65.4, 60]];
  else nariz = [[66 + L * 0.35, 50.2], [66 + L * 0.8, 54.4], [66 + L, 57.4], [65.8 + L * 0.7, 59.6], [65.4, 60]];
  const pts = [
    [34 - cu, 103], [34 - cu * 0.7, 86], [36, 72], [32 - cr * 0.6, 62], [27 - cr, 50], [28 - cr, 37],
    [35 - cr * 0.4, 25 - al], [47, 18 - al], [58, 20 - al * 0.7], [64, 27 - al * 0.3], [66 + fr, 35],
    [67 + fr + ce * 0.2, 41.5], [65.6, 46.5], ...nariz,
    [66 + lb * 0.15, 62.8 + lb * 0.1], [65.2, 65.2], [66 + lb * 0.35, 67.3 + lb * 0.1], [64.4, 70.6],
    [65 + me, 75], [63 + me * 0.6, 79 + ma * 0.4], [58, 81.5 + ma * 0.5 + pa * 2],
    [54, 82.5 + pa * 5], [56 + cu * 0.3, 92 + pa * 2], [57 + cu * 0.5, 103],
  ];
  return pts;
}

function caraInterna(P, uid) {
  const pts = cabeza(P);
  const { cr, fr, ce, me, ma, pa, e, so, hu, ba, p, pc } = P;
  const pelo = ['#3b2f22', '#5d4932', '#8e8a82', '#e6e1d2'][pc];
  const piel = '#d9b78f', tinta = '#5b3f12';
  const edad = Math.max(0, Math.min(1, (e - 30) / 40));
  const i = pts.length;
  // silueta: sube por detrás, baja por la cara y cierra por abajo
  const sil = suave(pts, false) + 'L' + (pts[0][0]) + ' 104Z';
  let s = `<path d="${sil}" fill="${piel}" stroke="${tinta}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>`;
  // barba corta
  if (ba) {
    const b = [[43, 50], [47, 63], [55, 65.5], [62, 66.5], [64.4, 70.6], [65 + me + 0.6, 75], [63 + me * 0.6 + 0.4, 79.5 + ma * 0.4], [58, 82 + ma * 0.5], [49, 79], [43, 68]];
    s += `<path d="${suave(b, true)}" fill="${pelo}" fill-opacity=".62" stroke="none"/>`;
    for (let k = 0; k < 16; k++) s += `<path d="M${f1(46 + (k % 8) * 2.5)} ${f1(66 + Math.floor(k / 8) * 6)}l1.2 1.4" stroke="${tinta}" stroke-width=".8" stroke-linecap="round"/>`;
  }
  // pelo
  const back = pts.slice(3, 10);
  if (p === 'k') {
    const ext = esc(pts.slice(3, 6), 1.05);
    const band = [...ext, [33 - cr * 0.3, 32], [37, 30], [40, 38], [39, 48], [40, 58], [42, 67]];
    s += `<path d="${suave([...ext, [32 - cr * .3, 33], [38, 31], [41, 38], [40, 48], [41, 54], [43, 59]], true)}" fill="${pelo}" stroke="${tinta}" stroke-width="1.3" stroke-linejoin="round"/>`;
  } else {
    const k = p === 'z' ? 1.09 : 1.05;
    const fh = p === 'r' ? [[58, 27], [50, 30.5], [45, 38], [44, 46]] : [[63.5, 31 + (fr < 0 ? -3 : 0)], [59, 31.5], [52, 33], [46, 38], [44, 46]];
    const cap = [...esc(back, k), ...fh, [42, 52], [41.5, 56.5], [43, 60]];
    s += `<path d="${suave(cap, true)}" fill="${pelo}" fill-opacity="${p === 'r' ? 0.72 : 1}" stroke="${tinta}" stroke-width="1.3" stroke-linejoin="round"/>`;
    if (p === 'z') for (const [x, y] of [...esc(back, 1.06), [62, 31], [57, 31.5], [52, 34], [47, 38]]) s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.1" fill="${pelo}" stroke="${tinta}" stroke-width="1.1"/>`;
    if (p === 'c') for (let k2 = 0; k2 < 5; k2++) s += `<path d="M${40 + k2 * 4.5} ${27 + k2 * 0.8}q3 4 ${3.5} 9" stroke="${tinta}" stroke-width=".8" stroke-linecap="round" fill="none" opacity=".6"/>`;
  }
  // oreja
  s += `<path d="M43.5 46.5c-5-2-6.5 6-3.2 10c1 1.2 2.6 1 3.4-.2" fill="${piel}" stroke="${tinta}" stroke-width="1.3" stroke-linecap="round"/><path d="M42 49.5c-1.6.4-1.6 3 0 4" stroke="${tinta}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
  // ceja, ojo
  const gc = 1 + ce * 0.45;
  s += `<path d="M53.5 ${f1(41.8)}Q60 ${f1(39.4 - ce * 0.2)} ${f1(66 + fr + 0.6)} ${f1(41 + ce * 0.1)}" stroke="${p === 'k' ? tinta : pelo}" stroke-width="${f1(gc)}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M55.4 46c2.2-1.9 5-1.9 7 .2M55.8 46.4c2 1 4.4 1 6.6.1" stroke="${tinta}" stroke-width="1.15" fill="none" stroke-linecap="round"/><circle cx="59.4" cy="46.1" r="1.05" fill="${tinta}"/>`;
  // boca
  const sm = so * 2.4;
  s += `<path d="M65.3 65.3Q60.5 ${f1(65.6 - sm * 0.3)} ${f1(57.5 - sm * 0.2)} ${f1(64.4 - sm)}" stroke="${tinta}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  if (so > 0.5) s += `<path d="M58.5 ${f1(64.6 - sm)}q-2 -2.5 -3.4 -2.6" stroke="${tinta}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
  // arrugas
  const lin = (d, w = 0.9, op = 0.8) => `<path d="${d}" stroke="${tinta}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
  const nf = Math.round(edad * 4);
  if (p !== 'k' || true) for (let k3 = 0; k3 < nf; k3++) s += lin(`M${54 - k3 * 0.5} ${f1(31.5 + k3 * 3.1)}q${6} ${-1.3 + k3 * 0.1} ${f1(11.5 - k3 * 1.2)} ${f1(-0.4)}`, 0.85, 0.7);
  if (e > 36) s += lin('M62 62.2c-3 1.4-4.6 4-4.2 7', 1, 0.85);
  if (e > 44 || hu) s += lin('M52.5 53c3 5.5 2 10-1 13', 0.9, 0.7);
  if (hu) s += lin('M48 56c1.5 7 3 12 7 16', 0.9, 0.6);
  if (e > 40) s += lin('M54 47.6c1.7 1.6 4.4 1.8 6.2.6', 0.9, 0.7);
  if (e > 36) s += lin('M54.5 44.2l-3.4-1.3M54.8 46l-3.8 .3', 0.85, 0.75);
  if (e > 50) s += lin('M44 83c3 .8 6 .6 9-.6M43 87.4c4 .8 8 .5 11.5-.8', 0.9, 0.55);
  if (pa > 0.3) s += lin(`M57 ${f1(83 + pa * 3)}q-4 ${f1(3 + pa * 2)} -11 ${f1(3 + pa * 2)}`, 1, 0.7);
  // nuez / tendón del cuello
  s += lin(`M50 ${f1(86 + pa * 4)}c-1.5 5-1 11 .5 17`, 0.9, 0.5);
  // toga: arranque del hombro
  s += `<path d="M-4 106C2 92 20 86 33 88c8 1 14 3.5 20 3C64 90 84 94 104 106Z" fill="${C.marmol}" stroke="${tinta}" stroke-width="1.5" stroke-linejoin="round"/>`;
  s += `<path d="M16 104c3-7 9-12 17-13M44 93c-2 4-3 8-3 11M55 93c6 3 8 7 8 11M74 98c4 1 8 3 11 7" stroke="${tinta}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".75"/>`;
  return s;
}

export function cara(id, { tam = 96, marco = true, bando = null } = {}) {
  const P = Object.assign({}, CARAS[id] || hashParams(id));
  const uid = 'cl' + (++_n);
  const cb = colorBando(bando) || C.bronce;
  const fondo = marco
    ? `<circle cx="50" cy="50" r="46" fill="#16202b"/><circle cx="50" cy="50" r="46" fill="none" stroke="${C.bronce}" stroke-opacity=".0"/>`
    : '';
  const aro = marco
    ? `<circle cx="50" cy="50" r="46.5" fill="none" stroke="${cb}" stroke-width="${bando ? 4.2 : 3}"/><circle cx="50" cy="50" r="42.6" fill="none" stroke="${C.bronce}" stroke-width="1" opacity=".8"/>`
    : '';
  const cuerpo = caraInterna(P, uid);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${tam}" height="${tam}" role="img" aria-label="Retrato ${id}"><defs><clipPath id="${uid}"><circle cx="50" cy="50" r="${marco ? 44 : 60}"/></clipPath></defs>${fondo}<g clip-path="url(#${uid})"><g transform="translate(5 1) scale(.96)">${cuerpo}</g></g>${aro}</svg>`;
}

// ============================================================ 2. SENADOR
export function senador({ bando = null, voto = null, tam = 28, banco = true } = {}) {
  const cb = colorBando(bando) || C.piedra;
  const tinta = '#5b3f12';
  const vc = { si: C.oliva, no: C.terracota, duda: C.piedra }[voto] || null;
  const H = banco ? 44 : 40;
  const brazo = (d, w = 3.6) => `<path d="${d}" stroke="${tinta}" stroke-width="${w + 1.6}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${C.marmol}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  let s = '';
  if (vc) s += `<rect x="1" y="1" width="38" height="${H - 2}" rx="7" fill="${vc}" fill-opacity=".13" stroke="${vc}" stroke-width="1.8"/>`;
  if (banco) s += `<rect x="3" y="38" width="34" height="4.2" rx="1.2" fill="#2a2116" stroke="${C.bronce}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const toga = 'M6 38C6 30 10 24.5 20 23.5C30 24.5 34 30 34 38Z';
  s += `<path d="${toga}" fill="${C.marmol}" stroke="${tinta}" stroke-width="1.4" stroke-linejoin="round"/><path d="${toga}" fill="${cb}" fill-opacity=".34"/>`;
  s += `<path d="M12 38C13 31 17 27.5 24 25.5M22 24.5C27 28 30 32 30.5 38M16 38c0-4 2-7 4.5-9" stroke="${tinta}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/>`;
  s += `<rect x="18" y="19.5" width="4" height="5" fill="#d9b78f" stroke="${tinta}" stroke-width="1"/>`;
  if (voto === 'si') s += brazo('M29 30C34 26 35 19 33 12.5') + `<circle cx="33" cy="10.6" r="2.3" fill="#d9b78f" stroke="${tinta}" stroke-width="1"/>`;
  if (voto === 'no') s += brazo('M11 33L29 28.5') + brazo('M29 33L11 28.5');
  if (voto === 'duda') s += brazo('M13 36C14 31 17 29.5 19 28.5', 3) + `<circle cx="19.6" cy="27.6" r="1.8" fill="#d9b78f" stroke="${tinta}" stroke-width=".9"/>`;
  s += `<circle cx="20" cy="14.5" r="5.6" fill="#d9b78f" stroke="${tinta}" stroke-width="1.3"/>`;
  s += `<path d="M14.4 14c-.6-5 3-8.6 7.4-8.2c3.6.4 5.2 3.4 4.4 7c-1.6-2.6-4-3.6-6.6-3.4c-2 .2-3.6 1.4-5.2 4.6Z" fill="#4c3b28" stroke="${tinta}" stroke-width="1"/>`;
  s += `<circle cx="18.2" cy="15" r=".8" fill="${tinta}"/><circle cx="22.2" cy="15" r=".8" fill="${tinta}"/><path d="M18.4 18.2q1.6.8 3.2 0" stroke="${tinta}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 ${H}" width="${tam}" height="${f1(tam * H / 40)}" role="img" aria-label="Senador">${s}</svg>`;
}

// ============================================================ helpers de edificios
const poly = (pts) => pts.map((p) => p.join(',')).join(' ');
function estilo(tipo) {
  if (tipo === 'nuevo') return { s: C.oro, f: '#2a2414', r: '#8a6422', ro: 0.75, w: 1.6 };
  if (tipo === 'obra') return { s: C.bronce, f: '#1d2128', r: '#7a3f22', ro: 0.6, w: 1.5 };
  return { s: '#6f7d8e', f: '#161f2a', r: '#5a3326', ro: 0.5, w: 1.4 };
}
function gr(k, inner) { return `<g fill="${k.f}" stroke="${k.s}" stroke-width="${k.w}" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`; }
function casaBaja(x, y, w, h, k) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}"/><polygon points="${poly([[x - 2, y], [x + w / 2, y - h * 0.62], [x + w + 2, y]])}" fill="${k.r}" fill-opacity="${k.ro}"/><path d="M${x + w * 0.42} ${y + h}v-${h * 0.55}h${w * 0.2}v${h * 0.55}" stroke-width="1"/>`;
}
function templo(x, y, w, ph, ch, n, pd, k, steps = true) {
  let s = `<rect x="${x}" y="${y - ph}" width="${w}" height="${ph}"/>`;
  if (steps) s += `<rect x="${x + w * 0.3}" y="${y - ph * 0.5}" width="${w * 0.4}" height="${ph * 0.5}" fill="${k.s}" fill-opacity=".18"/>`;
  const top = y - ph - ch;
  s += `<rect x="${x + 1}" y="${top}" width="${w - 2}" height="${ch}" fill="${k.s}" fill-opacity=".08" stroke="none"/>`;
  for (let i = 0; i < n; i++) { const cx = f1(x + (i + 0.5) * w / n); s += `<path d="M${cx} ${y - ph}V${top}" stroke-width="${f1(k.w + 0.9)}" fill="none"/>`; }
  s += `<rect x="${x - 3}" y="${top - 4}" width="${w + 6}" height="4"/>`;
  s += `<polygon points="${poly([[x - 6, top - 4], [x + w / 2, top - 4 - pd], [x + w + 6, top - 4]])}" fill="${k.r}" fill-opacity="${k.ro}"/>`;
  s += `<path d="M${x + w / 2} ${top - 4 - pd}v-3M${x - 6} ${top - 4}v-1.5M${x + w + 6} ${top - 4}v-1.5" fill="none" stroke-width="2.2"/>`;
  return s;
}
const chispa = (x, y) => `<path d="M${x} ${y - 6}l1.3 4.7l4.7 1.3l-4.7 1.3l-1.3 4.7l-1.3-4.7l-4.7-1.3l4.7-1.3Z" fill="${C.oro}" stroke="${C.marmol}" stroke-width=".6"/>`;
const arbol = (x, y, r, k) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k.s}" fill-opacity=".14" stroke="none"/><path d="M${x} ${y + r}v3" stroke-width="1.2"/>`;

// ============================================================ 3. VISTA DE CIUDAD
const CIELO = ['#2a4258', '#3b4f66', '#4a3a3c', '#2a3441'];

export function vistaCiudad({ obras = [], nuevas = [], estacion = 0 } = {}) {
  const tiene = (id) => obras.includes(id) || nuevas.includes(id);
  const tipo = (id) => (nuevas.includes(id) ? 'nuevo' : obras.includes(id) ? 'obra' : null);
  const B = estilo('base');
  const est = ((estacion % 4) + 4) % 4;
  let o = '';
  const chis = [];
  // cielo y detalle de estación
  o += `<rect width="390" height="300" fill="${CIELO[est]}"/>`;
  o += `<path d="M0 70H390M0 40H390" stroke="${C.piedra}" stroke-opacity=".06" stroke-width="14"/>`;
  if (est === 0) o += `<g fill="none" stroke="${C.marmol}" stroke-width="1.4" stroke-linecap="round" opacity=".8"><path d="M200 34q4-5 8 0q4-5 8 0M236 50q3-4 6 0q3-4 6 0M178 56q3-4 6 0q3-4 6 0"/></g>`;
  if (est === 1) o += `<circle cx="250" cy="48" r="13" fill="${C.oro}" fill-opacity=".85" stroke="${C.oro}" stroke-width="1.6"/><path d="M250 24v6M250 66v6M226 48h6M268 48h6M233 31l4 4M263 61l4 4M233 65l4-4M263 35l4-4" stroke="${C.oro}" stroke-width="1.6" stroke-linecap="round"/>`;
  if (est === 2) o += `<g fill="${C.terracota}" opacity=".85"><path d="M210 40q4-3 6 1q-3 3-6-1ZM250 62q4-3 6 1q-3 3-6-1ZM190 78q4-3 6 1q-3 3-6-1ZM300 52q4-3 6 1q-3 3-6-1Z"/></g>`;
  if (est === 3) o += `<circle cx="262" cy="46" r="10" fill="${C.marmol}" fill-opacity=".8"/><circle cx="266" cy="43" r="9" fill="${CIELO[3]}"/>`;
  // colinas lejanas y orilla de enfrente
  o += `<path d="M0 100C40 84 90 94 140 88C200 80 250 98 300 90C340 84 370 92 390 88V112H0Z" fill="#1a2733" stroke="${B.s}" stroke-opacity=".5" stroke-width="1.2"/>`;
  for (const [x, y] of [[190, 100], [210, 98], [236, 96], [300, 100], [322, 98], [350, 98]]) o += arbol(x, y, 4, B);
  // río
  o += `<path d="M120 112C170 104 240 108 390 104V134C300 130 200 134 120 132Z" fill="#1f3a52" stroke="${B.s}" stroke-opacity=".6" stroke-width="1.2"/>`;
  o += `<path d="M150 122q10-3 20 0M205 126q10-3 20 0M280 124q10-3 20 0M330 120q10-3 20 0M240 114q8-2 16 0" stroke="${C.marmol}" stroke-opacity=".3" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  // isla Tiberina con arboleda y cabaña
  o += gr(B, `<path d="M276 122C280 112 304 110 326 114C334 118 326 124 312 124Z"/>`);
  o += arbol(290, 112, 5, B) + arbol(304, 110, 5, B) + arbol(318, 113, 4, B);
  o += gr(B, casaBaja(298, 118, 10, 5, B));
  // puente de madera (sublicio)
  o += gr(B, `<polygon points="${poly([[226, 133], [238, 133], [262, 108], [250, 108]])}"/><path d="M229 134v5M236 134v5M244 124v5M254 114v5M249 120l-14 14" fill="none"/>`);
  // Capitolio
  o += gr(B, `<path d="M0 156C0 110 16 75 46 75H140C165 92 178 135 190 160Z" fill="#141d27"/>`);
  o += `<path d="M20 120c18 4 34 2 50 8M96 100c18 6 36 14 52 24M40 98c6 3 12 3 18 2" stroke="${B.s}" stroke-opacity=".45" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  o += gr(B, templo(46, 74, 94, 10, 22, 6, 14, B));
  o += `<path d="M60 52h66" stroke="${B.s}" stroke-opacity=".5" stroke-width="1" fill="none"/>`;
  // colina derecha + templo nuevo
  const kt = estilo(tipo('templo') || 'base');
  o += gr(B, `<path d="M296 134C304 96 330 80 356 80C376 82 388 96 390 112V136Z" fill="#141d27"/>`);
  if (tiene('templo')) { o += gr(kt, templo(332, 98, 36, 5, 11, 4, 8, kt, false)); if (tipo('templo') === 'nuevo') chis.push([350, 66]); }
  else o += `<path d="M334 92q16-5 32 0" stroke="${B.s}" stroke-opacity=".4" stroke-width="1.2" stroke-dasharray="3 4" fill="none"/>`;
  // orilla cercana: terreno de la ciudad
  o += `<path d="M0 150C60 140 130 148 190 140C250 134 330 142 390 136V256H0Z" fill="#101922"/>`;
  // graneros
  if (tiene('graneros')) { const k = estilo(tipo('graneros')); o += gr(k, casaBaja(196, 143, 52, 9, k) + casaBaja(254, 144, 48, 8, k) + `<path d="M206 143v9M218 143v9M230 143v9M242 143v9" fill="none" stroke-width="1"/>`); if (tipo('graneros') === 'nuevo') chis.push([250, 126]); }
  else o += `<path d="M198 150h104" stroke="${B.s}" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="3 4"/>`;
  // muelle y barcas
  if (tiene('muelle')) {
    const k = estilo(tipo('muelle'));
    o += gr(k, `<path d="M360 134V114" stroke-width="5" fill="none" stroke-opacity=".5"/><path d="M356 134v-20h8v20M352 118h16" fill="none"/>` + `<path d="M334 122c4 4 16 4 20 0l3-5h-26Z" fill="${k.r}" fill-opacity="${k.ro}"/><path d="M372 118c3 3 12 3 15 0l2-4h-19Z" fill="${k.r}" fill-opacity="${k.ro}"/><path d="M345 117v-9l6 5M380 114v-8l5 4" fill="none"/>`);
    if (tipo('muelle') === 'nuevo') chis.push([348, 100]);
  }
  // muralla con torre
  if (tiene('muralla')) {
    const k = estilo(tipo('muralla'));
    let m = `<path d="M298 176V152H390V176Z"/>`;
    for (let x = 300; x < 388; x += 8) m += `<rect x="${x}" y="147" width="5" height="5"/>`;
    m += `<rect x="326" y="132" width="26" height="44"/><path d="M324 132h30M326 124v8M352 124v8M335 124v8M343 124v8" fill="none"/><path d="M335 150v8M343 150v8" stroke-width="2.4" fill="none"/><path d="M334 176v-12q4-5 8 0v12" fill="none"/>`;
    o += gr(k, m);
    if (tipo('muralla') === 'nuevo') chis.push([339, 114]);
  }
  // casas base (hileras)
  let cs = '';
  for (const [x, y, w] of [[198, 172, 14], [216, 174, 16], [236, 171, 14], [254, 173, 18], [276, 172, 14]]) cs += casaBaja(x, y, w, 10, B);
  for (const [x, y, w] of [[106, 170, 16], [128, 172, 14], [148, 169, 18]]) cs += casaBaja(x, y, w, 10, B);
  for (const [x, y, w] of [[60, 168, 12]]) cs += casaBaja(x, y, w, 9, B);
  o += gr(B, cs);
  // barrio nuevo en la ladera
  if (tiene('casas')) {
    const k = estilo(tipo('casas')); let c = '';
    for (const [x, y, w] of [[6, 178, 15], [26, 172, 14], [44, 183, 16], [66, 176, 14], [84, 186, 14], [14, 194, 14], [34, 196, 15], [54, 197, 14]]) c += casaBaja(x, y, w, 9, k);
    o += gr(k, c);
    if (tipo('casas') === 'nuevo') chis.push([48, 158]);
  } else o += `<path d="M6 190C40 182 80 184 100 176" stroke="${B.s}" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="3 4" fill="none"/>`;
  // Foro: plaza y los dos templos
  o += `<path d="M96 258V196C120 188 280 186 296 196V258Z" fill="#18222d" stroke="${B.s}" stroke-opacity=".5" stroke-width="1.2"/>`;
  o += `<path d="M110 212H284M104 228H290M180 192L160 258M220 192L240 258M140 192L100 258M260 192L300 258" stroke="${B.s}" stroke-opacity=".28" stroke-width="1" fill="none"/>`;
  o += gr(B, templo(112, 206, 66, 8, 20, 4, 12, B) + templo(212, 205, 66, 8, 20, 4, 12, B));
  o += `<path d="M184 206h22" stroke="${B.s}" stroke-width="1.4" fill="none"/>`;
  // fuente
  if (tiene('fuente')) { const k = estilo(tipo('fuente')); o += gr(k, `<ellipse cx="150" cy="226" rx="17" ry="5"/><path d="M150 226v-12M150 214q-8 0-10 6M150 214q8 0 10 6" fill="none"/><ellipse cx="150" cy="214" rx="5" ry="1.6"/>`); if (tipo('fuente') === 'nuevo') chis.push([166, 206]); }
  else o += `<ellipse cx="150" cy="226" rx="14" ry="4" fill="none" stroke="${B.s}" stroke-opacity=".35" stroke-dasharray="3 4"/>`;
  // mercado
  if (tiene('mercado')) {
    const k = estilo(tipo('mercado')); let m = `<polygon points="${poly([[290, 192], [388, 186], [388, 196], [290, 202]])}" fill="${k.r}" fill-opacity="${k.ro}"/>`;
    for (let i = 0; i < 5; i++) m += `<path d="M${296 + i * 22} 200V${226 - i * 1.2}" stroke-width="2.4" fill="none"/>`;
    for (let i = 0; i < 4; i++) { const x = 300 + i * 22; m += `<path d="M${x} 214h16l-2 5h-12Z" fill="${k.r}" fill-opacity="${k.ro}"/><path d="M${x + 2} 226h12" fill="none"/>`; }
    m += `<path d="M290 228H388" fill="none"/>`;
    o += gr(k, m); if (tipo('mercado') === 'nuevo') chis.push([340, 176]);
  } else o += `<path d="M298 220h86" stroke="${B.s}" stroke-opacity=".35" stroke-width="1.2" stroke-dasharray="3 4"/>`;
  // calzada
  if (tiene('calzada')) {
    const k = estilo(tipo('calzada'));
    let c = `<path d="M0 238C80 232 300 228 390 232V246C300 242 80 246 0 252Z"/>`;
    for (let x = 6; x < 390; x += 13) c += `<path d="M${x} ${f1(240 - x * 0.012 + (x % 2))}l2 6" fill="none" stroke-width="1"/>`;
    o += gr(k, c); if (tipo('calzada') === 'nuevo') chis.push([196, 220]);
  } else o += `<path d="M0 244C100 240 300 238 390 240" stroke="${B.s}" stroke-opacity=".3" stroke-width="1.2" stroke-dasharray="4 5" fill="none"/>`;
  // humo de hogares en invierno
  if (est === 3) for (const [x, y] of [[205, 168], [262, 169], [114, 166], [292, 168], [70, 164]]) o += `<path d="M${x} ${y}q-4-5 0-9q4-5 0-10q-3-4 1-8" stroke="${C.marmol}" stroke-opacity=".5" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  // terraza en primer plano: suelo, barandilla, columnas toscanas
  const T = { s: C.bronce, f: '#0e151d', w: 1.6 };
  o += `<g transform="translate(0 18)"><path d="M0 262H390V330H0Z" fill="#0e151d" stroke="${C.bronce}" stroke-width="1.6"/>`;
  o += `<path d="M0 280H390M60 262L30 300M130 262L120 300M200 262V300M270 262L280 300M340 262L370 300" stroke="${C.bronce}" stroke-opacity=".35" stroke-width="1" fill="none"/>`;
  let bal = `<rect x="0" y="244" width="390" height="7" rx="2"/><rect x="0" y="258" width="390" height="5" rx="2"/>`;
  for (let x = 56; x < 340; x += 15) bal += `<path d="M${x} 251c-4 3-4 4 -1 6c-3 2-3 3 0 1h2c3 1 3 0 0-1c3-2 3-3-1-6Z" fill="${C.bronce}" fill-opacity=".25"/>`;
  o += gr(T, bal);
  const col = (x) => gr(T, `<rect x="${x - 17}" y="274" width="34" height="9"/><rect x="${x - 14}" y="266" width="28" height="9"/><path d="M${x - 11} 266L${x - 12} 30M${x + 11} 266L${x + 12} 30" fill="none"/><rect x="${x - 12}" y="30" width="24" height="266" fill="#101820" stroke="none" opacity="0"/><path d="M${x - 11} 266L${x - 12} 34H${x + 12}L${x + 11} 266Z" fill="#101820" stroke="${C.bronce}"/><path d="M${x - 3} 40L${x - 3} 260M${x + 5} 40L${x + 5} 260" stroke-opacity=".4" fill="none" stroke-width="1"/><path d="M${x - 12} 34c0-4 4-6 12-6s12 2 12 6Z"/><rect x="${x - 17}" y="20" width="34" height="8"/>`);
  o += col(26) + col(364);
  o += '</g>';
  for (const [x, y] of chis) o += chispa(x, y);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 300" role="img" aria-label="Vista de la ciudad desde la terraza del Palatino">${o}</svg>`;
}

// ============================================================ 4. FORO
export function foro() {
  const B = { s: '#8795a8', f: '#16202b', r: '#5a3326', ro: 0.55, w: 1.5 };
  const G = { s: C.bronce, f: '#1d2128', r: '#7a3f22', ro: 0.6, w: 1.5 };
  let o = `<rect width="390" height="260" fill="#16202b"/><rect width="390" height="92" fill="#263a4d"/>`;
  o += `<path d="M0 96C60 80 100 90 150 84C220 76 300 92 390 82V120H0Z" fill="#1a2733" stroke="${B.s}" stroke-opacity=".4" stroke-width="1.2"/>`;
  o += `<rect y="120" width="390" height="140" fill="#131c26"/>`;
  // pórtico izquierdo
  o += gr(B, `<rect x="0" y="108" width="118" height="12"/>` + [10, 36, 62, 88].map((x) => `<path d="M${x} 108V72" stroke-width="3" fill="none"/>`).join('') + `<rect x="0" y="66" width="118" height="6"/><polygon points="${poly([[0, 66], [60, 48], [120, 66]])}" fill="${B.r}" fill-opacity="${B.ro}"/>`);
  // templo del fondo
  o += gr(B, templo(138, 118, 104, 12, 30, 6, 16, B));
  // edificio derecho con puerta
  o += gr(B, `<rect x="320" y="76" width="70" height="44"/><polygon points="${poly([[316, 76], [360, 58], [390, 66], [390, 76]])}" fill="${B.r}" fill-opacity="${B.ro}"/><path d="M348 120V96q9-9 18 0v24" fill="#0e151d"/><path d="M334 90h8M372 90h8" fill="none"/>`);
  // rostra (tribuna) con espolones
  let rs = `<rect x="246" y="108" width="82" height="14" fill="#1d2128"/><rect x="242" y="102" width="90" height="6"/>`;
  for (let i = 0; i < 3; i++) { const x = 254 + i * 26; rs += `<path d="M${x} 118h-16l2.4-2.4l-2.4-2.4h16Z" fill="${C.bronce}" fill-opacity=".3"/>`; }
  rs += `<path d="M252 122v-14M278 122v-14M304 122v-14M330 122v-14" stroke-width="1" fill="none"/>`;
  o += gr(G, rs);
  // orador
  o += `<path d="M290 102V90c0-4 6-4 6 0v12Z" fill="${C.marmol}" stroke="#5b3f12" stroke-width="1.2" stroke-linejoin="round"/><circle cx="293" cy="85.5" r="3.4" fill="#d9b78f" stroke="#5b3f12" stroke-width="1.1"/><path d="M296 92l7-6" stroke="#5b3f12" stroke-width="2" stroke-linecap="round"/>`;
  // multitud menuda en línea
  let gente = '';
  for (let i = 0; i < 25; i++) {
    const x = 10 + i * 15.2, h = 10 + (i * 7 % 5), y = 128 + (i * 3 % 4), col = i % 3 === 0 ? C.marmol : i % 3 === 1 ? C.piedra : '#c9b690';
    gente += `<path d="M${f1(x - 3)} ${y}c0-${h - 5} 1-${h - 4} 3-${h - 4}s3 1 3 ${h - 4}Z" fill="${col}" stroke="#5b3f12" stroke-width="1"/><circle cx="${f1(x)}" cy="${y - h + 2.2}" r="2.3" fill="#d9b78f" stroke="#5b3f12" stroke-width=".9"/>`;
  }
  o += gente;
  // pavimento muy tenue (mitad inferior limpia)
  o += `<path d="M0 150H390M0 190H390M195 138L120 260M195 138L270 260M195 138L30 260M195 138L360 260" stroke="${B.s}" stroke-opacity=".14" stroke-width="1" fill="none"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 260" role="img" aria-label="El Foro">${o}</svg>`;
}

// ============================================================ 5. CURIA
const SEATS_X = [24, 50, 76, 102, 128];
const SEATS_Y = [146, 174, 202];
export function asientosCuria() {
  const r = [];
  for (const lado of [0, 1]) for (const y of SEATS_Y) for (const x of SEATS_X) r.push({ x: lado ? 390 - x : x, y });
  return r;
}
export function curia() {
  const B = { s: C.bronce, f: '#1a222c', w: 1.5 };
  let o = `<rect width="390" height="220" fill="#101820"/>`;
  // muro del fondo, techumbre de vigas
  o += `<rect x="0" y="0" width="390" height="116" fill="#1a232e"/>`;
  o += `<path d="M0 22H390M0 46H390" stroke="${C.bronce}" stroke-opacity=".3" stroke-width="1" fill="none"/>`;
  for (let x = 0; x <= 390; x += 39) o += `<path d="M${x} 0V22" stroke="${C.bronce}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  o += `<path d="M0 22L195 0L390 22" fill="none" stroke="${C.bronce}" stroke-opacity=".5" stroke-width="1.5"/>`;
  // puerta abierta con luz
  o += `<path d="M160 116V52H230V116Z" fill="#2c4258" stroke="${C.bronce}" stroke-width="2" stroke-linejoin="round"/>`;
  o += `<path d="M168 116V70h54v46" fill="none" stroke="${C.piedra}" stroke-opacity=".4" stroke-width="1.2"/><path d="M160 116L146 120V56L160 52M230 116l14 4V56l-14-4" fill="#141c26" stroke="${C.bronce}" stroke-width="1.5" stroke-linejoin="round"/>`;
  o += `<path d="M190 70v46M200 70v46" stroke="${C.piedra}" stroke-opacity=".3" stroke-width="1"/>`;
  // estrado y dos sillas curules
  o += `<path d="M120 116H270V128H120Z" fill="#241c12" stroke="${C.bronce}" stroke-width="1.6" stroke-linejoin="round"/><path d="M130 128v6M260 128v6" stroke="${C.bronce}" stroke-width="1.4"/>`;
  const curul = (x) => `<path d="M${x - 11} 100L${x + 11} 116M${x + 11} 100L${x - 11} 116" stroke="${C.oro}" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M${x - 12} 99H${x + 12}" stroke="${C.oro}" stroke-width="3" stroke-linecap="round"/><path d="M${x - 11} 99V88h22v11" fill="${C.rojo}" fill-opacity=".35" stroke="${C.oro}" stroke-width="1.4" stroke-linejoin="round"/>`;
  o += curul(172) + curul(218);
  // gradas de madera a ambos lados: asientos en SEATS_X / SEATS_Y
  const grada = (lado) => {
    let g = '';
    SEATS_Y.forEach((y, i) => {
      const x0 = 8, x1 = 148, xa = lado ? 390 - x1 : x0, w = x1 - x0;
      g += `<rect x="${xa}" y="${y}" width="${w}" height="5" rx="1.5" fill="#3a2b18" stroke="${C.bronce}" stroke-width="1.4" stroke-linejoin="round"/>`;
      g += `<path d="M${xa + 4} ${y + 5}V${y + 24}M${xa + w - 4} ${y + 5}V${y + 24}" stroke="${C.bronce}" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round"/>`;
      g += `<rect x="${xa}" y="${y + 5}" width="${w}" height="${i < 2 ? 4 : 10}" fill="#1c1812" stroke="none" opacity=".8"/>`;
    });
    return g;
  };
  o += grada(0) + grada(1);
  // suelo
  o += `<path d="M150 134H240M150 154L240 154M150 182H240M150 212H240M170 134L150 220M220 134L240 220" stroke="${C.piedra}" stroke-opacity=".18" stroke-width="1" fill="none"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 220" role="img" aria-label="La Curia Hostilia">${o}</svg>`;
}

// ============================================================ 6. CASA (despacho)
export function casa() {
  const K = { s: C.bronce, f: '#1a222c', w: 1.5 };
  let o = `<rect width="390" height="200" fill="#101820"/>`;
  // pared y atrio al fondo
  o += `<rect x="0" y="0" width="390" height="120" fill="#17212c"/><path d="M0 120H390" stroke="${C.bronce}" stroke-width="1.6"/>`;
  o += `<path d="M100 120V50h190v70" fill="#0d141b" stroke="${C.bronce}" stroke-width="1.8" stroke-linejoin="round"/>`;
  o += `<rect x="150" y="56" width="90" height="12" fill="#2a4158" stroke="${C.bronce}" stroke-width="1.4"/>`;
  for (const x of [112, 136, 254, 278]) o += `<path d="M${x} 120V74" stroke="${C.piedra}" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/>`;
  o += `<path d="M110 74H290" stroke="${C.bronce}" stroke-width="2" stroke-linecap="round"/>`;
  o += `<path d="M140 120H250L262 138H128Z" fill="#1f3a52" stroke="${C.bronce}" stroke-width="1.6" stroke-linejoin="round"/><path d="M152 128q8-2 16 0M200 130q10-2 18 0" stroke="${C.marmol}" stroke-opacity=".35" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  o += `<path d="M0 150H390M0 176H390M60 120L20 200M330 120L370 200" stroke="${C.piedra}" stroke-opacity=".14" stroke-width="1" fill="none"/>`;
  // máscaras de antepasados en la pared (imagines)
  for (const x of [26, 56, 334, 364]) o += `<rect x="${x - 10}" y="40" width="20" height="26" rx="2" fill="#241c12" stroke="${C.bronce}" stroke-width="1.3"/><ellipse cx="${x}" cy="53" rx="5" ry="7" fill="none" stroke="${C.marmol}" stroke-opacity=".8" stroke-width="1.2"/>`;
  // mesa del despacho con tablillas, rollos
  o += gr(K, `<rect x="14" y="152" width="140" height="8" rx="2"/><path d="M26 160V194M142 160V194M26 176h116" fill="none"/>`);
  for (let i = 0; i < 3; i++) o += gr({ ...K, f: '#3a2b18' }, `<rect x="${30 + i * 2}" y="${148 - i * 4}" width="34" height="${4}"/>`) + `<path d="M${34 + i * 2} ${150 - i * 4}h22" stroke="${C.bronce}" stroke-opacity=".6" stroke-width="1"/>`;
  for (const [x, y] of [[84, 146], [102, 146], [120, 146]]) o += gr({ ...K, f: '#d8c8a0' }, `<path d="M${x} ${y}h14v6h-14Z"/><ellipse cx="${x}" cy="${y + 3}" rx="1.8" ry="3" fill="#8a6a2c"/>`);
  o += `<path d="M92 150l32-5" stroke="${C.piedra}" stroke-width="2.2" stroke-linecap="round"/>`;
  // brasero
  o += gr(K, `<path d="M334 190L342 172M366 190L358 172M350 190V172M332 172H368L362 164H338Z" fill="#241c12"/>`);
  o += `<path d="M350 164c-7-6-3-12 0-17c1 4 8 8 5 14c-1 3-3 3-5 3Z" fill="${C.oro}" fill-opacity=".85" stroke="${C.oro}" stroke-width="1.2" stroke-linejoin="round"/><path d="M350 162c-3-3-1-6 0-8c1 2 3 4 1 6Z" fill="${C.terracota}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 200" role="img" aria-label="Tu despacho">${o}</svg>`;
}

// ============================================================ 7. ICONOS
const ICO = {
  oro: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6.4" stroke-dasharray="1.6 2"/><path d="M9.6 14.6c-.2-2 .2-4.4 2.2-5.2c1.6-.5 2.8.4 2.8 1.8c0 1-.8 1.4-1.4 1.6l.3 2.2"/>',
  pueblo: '<circle cx="12" cy="7.6" r="2.8"/><path d="M6.6 19c0-4 2.4-6.4 5.4-6.4s5.4 2.4 5.4 6.4Z"/><circle cx="5" cy="9.4" r="2"/><circle cx="19" cy="9.4" r="2"/><path d="M1.8 17c.2-2.4 1.4-4 3.2-4M22.2 17c-.2-2.4-1.4-4-3.2-4"/>',
  casa: '<path d="M3 11L12 4l9 7"/><path d="M5.5 9.6V20h13V9.6"/><path d="M10 20v-6h4v6"/>',
  foro: '<path d="M3 8L12 3.5L21 8Z"/><path d="M6 9.5V18M10 9.5V18M14 9.5V18M18 9.5V18"/><path d="M3.5 20.5h17M4.5 18h15"/>',
  curia: '<path d="M3 9L12 3.5L21 9Z"/><path d="M5 9.5V20.5H19V9.5"/><path d="M9.5 20.5V13h5v7.5"/><path d="M3 20.5h18"/>',
  ciudad: '<path d="M2.5 20.5H21.5"/><path d="M4 20.5V9h3V7h2v2h2V7h2v2h3v11.5"/><path d="M15 20.5V13h5v7.5"/><path d="M9 20.5v-4h2.4v4"/>',
  cuestor: '<path d="M3.5 10.5C3.5 6 7 4 12 4s8.5 2 8.5 6.5Z"/><rect x="3.5" y="10.5" width="17" height="9" rx="1"/><path d="M3.5 14.5h17M10.4 12.4h3.2v4h-3.2Z"/>',
  edil: '<path d="M7 20.5V8M7 8c-2.2-.6-3-2-3-3.6c2 0 3.2 1 3 3.6ZM7 8c2.2-.6 3-2 3-3.6c-2 0-3.2 1-3 3.6ZM7 13c-2.2-.6-3-2-3-3.6c2 0 3.2 1 3 3.6ZM7 13c2.2-.6 3-2 3-3.6c-2 0-3.2 1-3 3.6Z"/><path d="M12 20.5h9V13h-9ZM12 16.7h9M16.5 13v3.7M14.2 16.7v3.8M18.8 16.7v3.8"/>',
  pretor: '<path d="M12 3.5V20.5M8 20.5H16M4 7.5H20"/><path d="M4 7.5L1.8 13.5h4.4ZM20 7.5l-2.2 6h4.4Z"/><path d="M1.8 13.5c.3 2 4 2 4.4 0M17.8 13.5c.4 2 4.1 2 4.4 0"/>',
  censor: '<rect x="5" y="3.5" width="12.5" height="17" rx="1.5"/><path d="M8 8h7M8 11.4h7M8 14.8h4"/><path d="M21 9L16.6 17.6l-1.3.4l.3-1.4L19.5 8Z"/>',
  consul: '<path d="M9 3.5V20.5M12 3.5V20.5M15 3.5V20.5"/><path d="M7.5 8.5h9M7.5 15h9"/><path d="M8.2 8.5v6.5M15.8 8.5v6.5" stroke-dasharray="1 1.6"/>',
  promesa: '<path d="M2 11l4.5-3.2L10 9.2l3-1l3 2.2L22 12M2 11v5l5 3l2.4-1.4M22 12v4l-5 3l-2.6-1.6"/><path d="M7 17.5l2.4 1.6l2.8-2l-2.4-2M10 12.5l3.8 3.6l2.4-2.2l-3.2-3"/>',
  si: '<path d="M4.5 12.8L9.8 18L19.5 6.5"/>',
  no: '<path d="M5.5 5.5L18.5 18.5M18.5 5.5L5.5 18.5"/>',
  ajuste: '<path d="M6 17.5V11a6 6 0 0 1 12 0v6.5l1.8 2H4.2Z"/><path d="M10 21.5c.6 1 3.4 1 4 0"/><path d="M12 3.5V5"/>',
};
export function icono(nombre, tam = 20) {
  const d = ICO[nombre];
  if (!d) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${tam}" height="${tam}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="${nombre}">${d}</svg>`;
}
export const NOMBRES_ICONO = Object.keys(ICO);
export const IDS_CARA = Object.keys(CARAS);
