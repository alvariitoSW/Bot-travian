/* AQVILA · AM2 — mapa vivo de Grecia: lo que vive sobre el suelo. Polis (de lejos, un caserío grande que se ve a cualquier altura;
   de cerca, sus calles y sus casas una a una), puertos, humo, barcos por sus rutas, rebaños y nubes altas.
   Niveles de detalle: cada cosa se enciende solo a la altura a la que se distingue, y casi todo va por ejemplares (pocas llamadas).
   Arte: templo, casas de lejos, barcos, olivos y cipreses son de 0 A.D. (Wildfire Games, CC BY-SA 3.0) por js/gfx/statics.js.
   Casas de cerca, calles, humo, ovejas, nubes y dibujos a tinta: propios, hechos aquí. */
import { THREE } from './models.js';
import { preloadStatic, staticMesh, staticInstancedVacio } from './statics.js';
import { POLIS, ZONAS, X, Z } from './mapa-grecia-datos.js';
import { KY_CERCA, XI, ZN, ANCHO, FONDO } from './mapa-grecia-suelo.js';
import RUTAS from '../../assets/mapa-grecia/rutas.js';

const clamp = (x, a, b) => x < a ? a : x > b ? b : x, mix = (a, b, t) => a + (b - a) * t;
const paso = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function azar(s) { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const MUROS = ['#efe6d0', '#e4d6b4', '#d9c8a2', '#f3ecdc', '#cdb890'], TEJ = ['#b99a5e', '#a98848', '#c2a868', '#b3855a', '#a06a44', '#978c70'];   // adobe encalado; paja, barro y alguna teja
const E = 0.019;             // escala del caserío de lejos (modelos de 0 A.D.)
const M = 2.6e-4;            // escala de cerca: 1 m de modelo = 2,6 m de mapa (las casas se agrandan para leerse en el móvil)
const A_CASAS = 1.3, A_PLANO = 9;   // por debajo de estos anchos de pantalla (decenas de km) se ven las casas / el plano de calles

/* cada polis, su forma (probable: reconstrucción nuestra a partir de lo que se sabe de cada una; ver gobierno/historia/AM2-mapa-grecia.md):
   nR calles que salen del ágora · est/ang: alargada hacia un lado · acroD/acroR/acroAng/alto: dónde está su peña, cuánto ocupa y cuánto sube
   · muralla: cerca de piedra · reticula: calles en cuadrícula, giradas ese ángulo · aldeas: no es una ciudad apiñada sino varias aldeas (Esparta) */
const FORMA = {
  atenas: { nR: 8, acroD: 0.34, acroR: 0.2, acroAng: 2.2, alto: 3.2 },
  esparta: { aldeas: 4 },
  corinto: { nR: 7, acroD: 0.8, acroR: 0.22, acroAng: 1.75, alto: 4.5, est: 1.3, ang: 0 },
  argos: { nR: 7, acroD: 0.72, acroR: 0.17, acroAng: 3.5, alto: 3 },
  tebas: { nR: 7, muralla: true, est: 1.25, ang: 1.2, acroD: 0.3, acroR: 0.12, alto: 1 },
  megara: { nR: 5, est: 1.5, ang: 0.3, acroD: 0.5, acroR: 0.14, alto: 2 },
  mileto: { reticula: 0.35, est: 1.7, ang: 1.57, acroD: 0.42, acroR: 0.2, acroAng: 0.5, alto: 1.2 },   // trazado en retícula (Hipodamo, tras 479 a.C.)
  calcis: { nR: 6, est: 1.6, ang: 1.4, acroD: 0.4, acroR: 0.12, alto: 1.5 }
};
function mancha(color, borde) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  r.addColorStop(0, color); r.addColorStop(borde || 0.5, color.replace(/[\d.]+\)$/, '0.45)')); r.addColorStop(1, color.replace(/[\d.]+\)$/, '0)')); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

/* ---------- trazado de una polis: ágora, calles que salen de ella, casas a los lados ---------- */
export function trazar(p, alt, casasMax, radio, semilla, F) {
  F = F || {}; const rnd = azar(semilla), cx = p.x !== undefined ? p.x : X(p.lon), cz = p.z !== undefined ? p.z : Z(p.lat), R = radio, calles = [], casas = [], nR = F.nR || 5 + (rnd() * 2 | 0), giro = rnd() * 6.28, est = F.est || 1, eAng = F.ang || 0;
  const seco = (x, z) => alt(x, z) > 1.5, ocup = new Map(), celda = 0.0045, clave = (x, z) => Math.round(x / celda) + ',' + Math.round(z / celda);
  const agora = { x: cx + (rnd() - 0.5) * R * 0.1, z: cz + (rnd() - 0.5) * R * 0.1, r: R * 0.12 };
  const aA = F.acroAng !== undefined ? F.acroAng : giro + 2.4, acro = { x: agora.x + Math.cos(aA) * R * (F.acroD || 0.3), z: agora.z + Math.sin(aA) * R * (F.acroD || 0.3), r: R * (F.acroR || 0.13), alto: F.alto || 1 };
  /* calles radiales, con quiebros */
  const radiales = [];
  for (let i = 0; i < nR; i++) { let a = giro + i / nR * 6.283 + (rnd() - 0.5) * 0.5, x = agora.x + Math.cos(a) * agora.r * 0.8, z = agora.z + Math.sin(a) * agora.r * 0.8; const L = R * (0.6 + rnd() * 0.3) * (1 + (est - 1) * Math.abs(Math.cos(a - eAng))) / Math.sqrt(est), pts = [[x, z]], pasoL = R * 0.11;
    for (let s = 0; s < L; s += pasoL) { a += (rnd() - 0.5) * 0.38; const nx = x + Math.cos(a) * pasoL, nz = z + Math.sin(a) * pasoL; if (!seco(nx, nz)) break; x = nx; z = nz; pts.push([x, z]); }
    if (pts.length > 2) { calles.push({ p: pts, w: 1.3 }); radiales.push(pts); } }
  if (F.reticula !== undefined) { calles.length = 0; radiales.length = 0; const ga = F.reticula, sp = R * 0.2, rG = a => R * 0.84 * (1 + (est - 1) * Math.abs(Math.cos(a - eAng))) / Math.sqrt(est);
    for (const [ux, uz] of [[Math.cos(ga), Math.sin(ga)], [-Math.sin(ga), Math.cos(ga)]]) for (let i = -5; i <= 5; i++) { const ox = agora.x - uz * (i + 0.5) * sp, oz = agora.z + ux * (i + 0.5) * sp, pts = [];
      for (let t = -R * 1.6; t <= R * 1.6; t += R * 0.08) { const x = ox + ux * t, z = oz + uz * t; if (Math.hypot(x - agora.x, z - agora.z) < rG(Math.atan2(z - agora.z, x - agora.x)) && seco(x, z)) pts.push([x, z]); else if (pts.length) break; }
      if (pts.length > 2) calles.push({ p: pts, w: i === 0 || i === -1 ? 1.3 : 0.9 }); } }
  /* dos rondas que las unen */
  for (const f of F.reticula !== undefined ? [] : [0.42, 0.78]) { const pts = []; for (const r of radiales) { const q = r[Math.min(r.length - 1, Math.round((r.length - 1) * f))]; if (q) pts.push([q[0] + (rnd() - 0.5) * R * 0.03, q[1] + (rnd() - 0.5) * R * 0.03]); }
    if (pts.length > 2) { pts.push(pts[0]); calles.push({ p: pts, w: 1 }); } }
  /* muralla: una cerca que rodea el corazón de la ciudad */
  let muralla = null; if (F.muralla) { muralla = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.283, r = R * 0.62 * (1 + (est - 1) * Math.abs(Math.cos(a - eAng))) / Math.sqrt(est) * (0.94 + 0.12 * Math.sin(a * 3 + giro)); muralla.push([agora.x + Math.cos(a) * r, agora.z + Math.sin(a) * r]); } }
  /* casas a los dos lados de cada calle, más apretadas cerca del ágora */
  const pon = (x, z, ang, tam) => { if (!seco(x, z)) return false; const dA = Math.hypot(x - agora.x, z - agora.z), dT = Math.hypot(x - acro.x, z - acro.z); if (dA < agora.r * 1.25 || dT < acro.r * 1.1) return false;
    const k = clave(x, z); if (ocup.has(k)) return false; for (const o of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = ocup.get(Math.round(x / celda + o[0]) + ',' + Math.round(z / celda + o[1])); if (q && Math.hypot(q[0] - x, q[1] - z) < celda * 0.92) return false; }
    ocup.set(k, [x, z]); casas.push({ x, z, ang, w: tam * (0.85 + rnd() * 0.5), d: tam * (0.7 + rnd() * 0.3), h: tam * (0.55 + rnd() * 0.3), t: rnd(), u: rnd() }); return true; };
  const tam = 0.0036;
  const tope = Math.round(casasMax * 1.3), enCalle = Math.round(casasMax * 0.62);
  for (let vuelta = 0; vuelta < 2 && casas.length < enCalle; vuelta++) for (const c of calles) { const P = c.p; for (let i = 0; i < P.length - 1 && casas.length < enCalle; i++) { const a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ang = Math.atan2(ux, uz);
    for (let s = celda * 0.5; s < L; s += celda * (1 + vuelta * 0.15)) for (const lado of [1, -1]) { const dist = Math.hypot(a[0] + ux * s - agora.x, a[1] + uz * s - agora.z) / R; if (rnd() < dist * 0.55 - 0.1 + vuelta * 0.1) continue;
      const off = (0.0012 * c.w + tam * 0.55 + vuelta * celda * 0.95) * lado; pon(a[0] + ux * s - uz * off, a[1] + uz * s + ux * off, ang + (lado > 0 ? 0 : Math.PI) + (rnd() - 0.5) * 0.2, tam); } } }
  /* relleno: el corazón de la ciudad es un tejido apretado de casas entre las calles (no una estrella de calles sueltas) */
  const rB = a => R * 0.84 * (1 + (est - 1) * Math.abs(Math.cos(a - eAng))) / Math.sqrt(est), segs = []; for (const c of calles) for (let i = 0; i < c.p.length - 1; i++) segs.push([c.p[i], c.p[i + 1], c.w]);
  const cand = [], nG = Math.ceil(R * 1.35 / celda);
  for (let j = -nG; j <= nG; j++) for (let i = -nG; i <= nG; i++) { const x = agora.x + (i + (rnd() - 0.5) * 0.5) * celda * 1.06, z = agora.z + (j + (rnd() - 0.5) * 0.5) * celda * 1.06, f = Math.hypot(x - agora.x, z - agora.z) / rB(Math.atan2(z - agora.z, x - agora.x)); if (f < 1 && rnd() > f * f * 0.85) cand.push([f, x, z]); }
  cand.sort((a, b) => a[0] - b[0]);
  for (const q of cand) { if (casas.length >= tope) break; let dm = 1e9, ang = 0;
    for (const s of segs) { const ax = s[0][0], az = s[0][1], dx = s[1][0] - ax, dz = s[1][1] - az, t = clamp(((q[1] - ax) * dx + (q[2] - az) * dz) / (dx * dx + dz * dz || 1), 0, 1), d = Math.hypot(q[1] - ax - dx * t, q[2] - az - dz * t) - 0.0008 * s[2]; if (d < dm) { dm = d; ang = Math.atan2(dx, dz); } }
    if (dm < tam * 0.66) continue; pon(q[1], q[2], ang + (rnd() < 0.5 ? 0 : Math.PI / 2) + (rnd() - 0.5) * 0.25, tam); }
  return { cx, cz, R, agora, acro, calles, casas, muralla, seco, color: p.color || '#8c6a3d' };
}

/* el plano de la polis pintado en una textura que se tiende sobre el relieve.
   A (relieve natural): tierra pisada, calles, ágora y los tejados vistos desde arriba (de cerca los tapan las casas de bulto).
   B (carta antigua): la ciudad DIBUJADA a pluma como en las cartas viejas: cada casa en alzado con su tejado, el templo sobre
   su peña rayada, arbolitos y la cerca; nada de plano de calles moderno. */
const TINTA = '#3a2416';
function casitaTinta(g, x, y, w, h, de, cT, cM) {   // una casa en alzado: (x, y) centro de la base; de: se ve de frente (hastial) o de lado
  const al = w * (0.5 + h * 0.2), tj = w * 0.5; g.fillStyle = 'rgba(58,36,22,.16)'; g.beginPath(); g.ellipse(x + w * 0.22, y, w * 0.66, w * 0.15, 0, 0, 7); g.fill();
  g.lineWidth = Math.max(1.1, w * 0.055); g.strokeStyle = TINTA;
  if (de) { const ww = w * 0.74, x0 = x - ww / 2; g.fillStyle = cM; g.fillRect(x0, y - al, ww, al); g.fillStyle = 'rgba(58,36,22,.2)'; g.fillRect(x0 + ww * 0.68, y - al, ww * 0.32, al); g.strokeRect(x0, y - al, ww, al);
    g.beginPath(); g.moveTo(x0 - ww * 0.1, y - al); g.lineTo(x, y - al - tj); g.lineTo(x0 + ww * 1.1, y - al); g.closePath(); g.fillStyle = cT; g.fill(); g.stroke();
    g.fillStyle = TINTA; g.fillRect(x - ww * 0.1, y - al * 0.55, ww * 0.2, al * 0.55); }
  else { const x0 = x - w / 2, a2 = al * 0.82; g.fillStyle = cM; g.fillRect(x0, y - a2, w, a2); g.fillStyle = 'rgba(58,36,22,.2)'; g.fillRect(x0 + w * 0.72, y - a2, w * 0.28, a2); g.strokeRect(x0, y - a2, w, a2);
    g.beginPath(); g.moveTo(x0 - w * 0.07, y - a2); g.lineTo(x0 + w * 0.14, y - a2 - tj * 0.78); g.lineTo(x0 + w * 0.86, y - a2 - tj * 0.78); g.lineTo(x0 + w * 1.07, y - a2); g.closePath(); g.fillStyle = cT; g.fill(); g.stroke();
    g.lineWidth *= 0.6; g.beginPath(); for (const u of [0.36, 0.64]) { g.moveTo(x0 + w * u, y - a2 - tj * 0.74); g.lineTo(x0 + w * (u + (u - 0.5) * 0.3), y - a2 - 1); } g.stroke();
    g.fillStyle = TINTA; g.fillRect(x0 + w * 0.2, y - a2 * 0.5, w * 0.13, a2 * 0.5); g.fillRect(x0 + w * 0.52, y - a2 * 0.72, w * 0.1, a2 * 0.24); }
}
function arbolTinta(g, x, y, e, cipres) {   // arbolito a pluma con aguada verde
  g.strokeStyle = TINTA; g.lineWidth = Math.max(1, e * 0.09); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - e * 0.5); g.stroke();
  g.beginPath(); if (cipres) g.ellipse(x, y - e * 1.05, e * 0.22, e * 0.75, 0, 0, 7); else g.ellipse(x, y - e * 0.78, e * 0.48, e * 0.42, 0, 0, 7);
  g.fillStyle = cipres ? '#5e7a4a' : '#8ea36a'; g.fill(); g.stroke();
  g.lineWidth *= 0.7; g.beginPath(); g.arc(x + e * 0.08, y - e * (cipres ? 1.0 : 0.72), e * (cipres ? 0.12 : 0.2), 0.4, 2.2); g.stroke();
}
function temploTinta(g, x, y, w, color) {   // templo en alzado: gradas, columnas, frontón del color de la polis
  const h = w * 0.5, n = 6; g.strokeStyle = TINTA; g.lineWidth = Math.max(1.4, w * 0.022);
  g.fillStyle = '#f7efd8'; for (let i = 0; i < 2; i++) { g.fillRect(x - w * (0.56 - i * 0.04), y - w * 0.05 * (i + 1), w * (1.12 - i * 0.08), w * 0.05); g.strokeRect(x - w * (0.56 - i * 0.04), y - w * 0.05 * (i + 1), w * (1.12 - i * 0.08), w * 0.05); }
  const yb = y - w * 0.1; g.fillStyle = '#d9c49a'; g.fillRect(x - w * 0.46, yb - h, w * 0.92, h); g.fillStyle = '#f7efd8';
  for (let i = 0; i < n; i++) { const cx = x - w * 0.44 + i * w * 0.88 / (n - 1); g.fillRect(cx - w * 0.035, yb - h, w * 0.07, h); g.strokeRect(cx - w * 0.035, yb - h, w * 0.07, h); }
  g.fillRect(x - w * 0.5, yb - h - w * 0.07, w, w * 0.07); g.strokeRect(x - w * 0.5, yb - h - w * 0.07, w, w * 0.07);
  g.beginPath(); g.moveTo(x - w * 0.54, yb - h - w * 0.07); g.lineTo(x, yb - h - w * 0.34); g.lineTo(x + w * 0.54, yb - h - w * 0.07); g.closePath(); g.fillStyle = color; g.fill(); g.stroke();
}
function penaTinta(g, x, y, rx, alto, rr) {   // peña rayada a pluma: (x, y) centro de la cima; devuelve la y de la cima
  const ry = rx * 0.5, cae = rx * (0.35 + 0.22 * alto); g.strokeStyle = TINTA;
  g.beginPath(); g.moveTo(x - rx, y); for (let i = 0; i <= 20; i++) { const a = Math.PI - i / 20 * Math.PI, q = 1 + (rr() - 0.5) * 0.12; g.lineTo(x + Math.cos(a) * rx * 1.18 * q, y + cae * (0.25 + 0.75 * Math.sin(a)) * q + ry * 0.2); }
  g.lineTo(x + rx, y); g.ellipse(x, y, rx, ry, 0, 0, Math.PI, true); g.closePath(); g.fillStyle = '#bfa878'; g.fill(); g.lineWidth = 2; g.stroke();
  g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i < 60; i++) { const a = Math.PI * (0.04 + 0.92 * rr()), u = 0.15 + rr() * 0.7, x0 = x + Math.cos(a) * rx * (1 + 0.16 * u), y0 = y + Math.sin(a) * ry + cae * u * (0.3 + 0.7 * Math.sin(a)); g.moveTo(x0, y0); g.lineTo(x0 + Math.cos(a) * rx * 0.05, y0 + cae * 0.2); } g.stroke();
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fillStyle = '#e6d6aa'; g.fill(); g.lineWidth = 2; g.stroke();
}
function pintarPlano(T, estilo, lado) {
  const B = estilo === 'b', N = B ? 1536 : 1024, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), k = N / lado, px = (x, z) => [(x - T.cx + lado / 2) * k, (z - T.cz + lado / 2) * k], rr = azar(T.casas.length * 7 + 3);
  g.lineCap = g.lineJoin = 'round';
  /* suelo del caserío: tierra clara pisada, difuminada (una aguada por casa: sigue la forma real del pueblo, sin cercos) */
  const cs = B ? 'rgba(240,228,194,' : 'rgba(208,188,146,', aguada = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, cs + a + ')'); gr.addColorStop(1, cs + '0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
  for (const h of T.casas) { const q = px(h.x, h.z); aguada(q[0], q[1], 0.0115 * k, B ? 0.3 : 0.27); }
  { const q = px(T.agora.x, T.agora.z); aguada(q[0], q[1], T.agora.r * 2.4 * k, 0.7); }
  const traza = (P) => { g.beginPath(); P.forEach((q, i) => { const a = px(q[0], q[1]); i ? g.lineTo(a[0], a[1]) : g.moveTo(a[0], a[1]); }); g.stroke(); };
  /* muelle: tablas sobre pilotes, del caserío al fondeadero */
  if (T.muelle) { const a = px(T.muelle.a[0], T.muelle.a[1]), b = px(T.muelle.b[0], T.muelle.b[1]), w = 0.0019 * k, L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L; g.lineCap = 'butt';
    g.strokeStyle = B ? TINTA : 'rgba(50,36,22,.75)'; g.lineWidth = w + (B ? 3 : 4); g.beginPath(); g.moveTo(a[0] - ux * w, a[1] - uy * w); g.lineTo(b[0], b[1]); g.stroke();
    g.strokeStyle = B ? '#dcc592' : '#a8875a'; g.lineWidth = w; g.beginPath(); g.moveTo(a[0] - ux * w, a[1] - uy * w); g.lineTo(b[0], b[1]); g.stroke();
    g.strokeStyle = B ? 'rgba(58,36,22,.7)' : 'rgba(60,42,24,.5)'; g.lineWidth = 1; g.beginPath(); for (let s = 0; s < L; s += w * 0.55) { g.moveTo(a[0] + ux * s - uy * w / 2, a[1] + uy * s + ux * w / 2); g.lineTo(a[0] + ux * s + uy * w / 2, a[1] + uy * s - ux * w / 2); } g.stroke(); g.lineCap = 'round'; }
  /* la carta: huertas cercadas y olivares en torno al caserío, y las sendas que salen de él (rompen el llano vacío) */
  if (B && T.conTemplo) { const nH = 20; for (let i = 0, n = 0; i < nH * 5 && n < nH; i++) { const a = rr() * 6.283, d = T.R * (0.95 + rr() * 0.42), x = T.agora.x + Math.cos(a) * d, z = T.agora.z + Math.sin(a) * d, w = (0.011 + rr() * 0.01) * k, h = (0.008 + rr() * 0.007) * k; if (!T.seco(x, z)) continue;
      let libre = Math.hypot(x - T.acro.x, z - T.acro.z) > T.acro.r * 2.2; for (const c of T.casas) if (Math.abs(c.x - x) < 0.011 && Math.abs(c.z - z) < 0.011) { libre = false; break; } if (!libre) continue; n++;
      const q = px(x, z), tipo = rr(); g.save(); g.translate(q[0], q[1]); g.rotate(a + 1.57 + (rr() - 0.5) * 0.4); g.fillStyle = tipo < 0.4 ? 'rgba(150,172,104,.5)' : tipo < 0.7 ? 'rgba(214,188,110,.5)' : 'rgba(176,150,104,.4)'; g.fillRect(-w / 2, -h / 2, w, h);
      g.strokeStyle = 'rgba(58,36,22,.6)'; g.lineWidth = 1.3; g.setLineDash(tipo < 0.4 ? [] : [5, 3]); g.strokeRect(-w / 2, -h / 2, w, h); g.setLineDash([]); g.lineWidth = 1;
      if (tipo < 0.4) { g.fillStyle = '#6f8a52'; for (let u = -w / 2 + 6; u < w / 2 - 3; u += 9) for (let v = -h / 2 + 6; v < h / 2 - 3; v += 9) { g.beginPath(); g.arc(u, v, 2.8, 0, 7); g.fill(); g.stroke(); } }
      else { g.strokeStyle = 'rgba(58,36,22,.3)'; g.beginPath(); for (let v = -h / 2 + 4; v < h / 2 - 2; v += 5) { g.moveTo(-w / 2 + 3, v); g.lineTo(w / 2 - 3, v); } g.stroke(); }
      g.restore(); }
    g.strokeStyle = 'rgba(122,43,32,.55)'; g.lineWidth = 2; g.setLineDash([7, 6]); for (const cl of T.calles) { if (cl.w < 1.2) continue; const P = cl.p, u = P[P.length - 1], v = P[P.length - 2], dx = u[0] - v[0], dz = u[1] - v[1], L = Math.hypot(dx, dz) || 1, a0 = px(u[0], u[1]), a1 = px(u[0] + dx / L * T.R * 0.5 + dz / L * T.R * 0.08, u[1] + dz / L * T.R * 0.5 - dx / L * T.R * 0.08), a2 = px(u[0] + dx / L * T.R, u[1] + dz / L * T.R); g.beginPath(); g.moveTo(a0[0], a0[1]); g.quadraticCurveTo(a1[0], a1[1], a2[0], a2[1]); g.stroke(); } g.setLineDash([]); }
  for (const cl of T.calles) { g.strokeStyle = B ? 'rgba(74,47,28,.38)' : 'rgba(110,88,58,.5)'; g.lineWidth = (B ? 0.002 : 0.0023) * cl.w * k; traza(cl.p); }
  for (const cl of T.calles) { g.strokeStyle = B ? '#f3e7c6' : '#dcc898'; g.lineWidth = 0.0015 * cl.w * k; traza(cl.p); }
  if (T.muralla) { g.strokeStyle = B ? TINTA : 'rgba(50,40,28,.5)'; g.lineWidth = 0.0028 * k; traza(T.muralla); g.strokeStyle = B ? '#e9dcb8' : '#b9ad92'; g.lineWidth = 0.0017 * k; traza(T.muralla);
    if (B) { g.lineWidth = 1.4; g.strokeStyle = TINTA; g.fillStyle = '#e9dcb8'; T.muralla.forEach((q, i) => { if (i % 4) return; const a = px(q[0], q[1]), w = 0.0042 * k; g.fillRect(a[0] - w / 2, a[1] - w * 0.8, w, w); g.strokeRect(a[0] - w / 2, a[1] - w * 0.8, w, w); }); } }
  /* ágora: explanada clara de borde irregular, con sus puestos */
  { const q = px(T.agora.x, T.agora.z), r = T.agora.r * k; g.fillStyle = B ? '#f4e8c8' : '#e2d2a6'; g.strokeStyle = B ? 'rgba(58,36,22,.75)' : 'rgba(110,88,58,.7)'; g.lineWidth = B ? 1.6 : 3;
    g.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * 6.283, d = r * (0.92 + 0.16 * ((i * 7) % 5) / 4); i ? g.lineTo(q[0] + Math.cos(a) * d, q[1] + Math.sin(a) * d) : g.moveTo(q[0] + Math.cos(a) * d, q[1] + Math.sin(a) * d); } g.closePath(); g.fill(); g.stroke();
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + rr() * 0.4, d = r * (0.45 + rr() * 0.3), x = q[0] + Math.cos(a) * d, y = q[1] + Math.sin(a) * d, w = r * 0.2;
      if (B) { g.lineWidth = 1.1; g.strokeStyle = TINTA; g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - w / 2, y - w * 0.5); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y - w * 0.5); g.stroke(); g.fillStyle = ['#b9553f', '#f2e6c8', '#b7791f', T.color][i % 4]; g.beginPath(); g.moveTo(x - w * 0.65, y - w * 0.5); g.lineTo(x, y - w * 0.95); g.lineTo(x + w * 0.65, y - w * 0.5); g.closePath(); g.fill(); g.stroke(); }
      else { g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = 'rgba(40,30,20,.3)'; g.fillRect(-w / 2 + 2, -w / 3 + 2, w, w * 0.66); g.fillStyle = ['#c9553f', '#e9dcb8', '#b7791f', '#f2e6c8'][i % 4]; g.fillRect(-w / 2, -w / 3, w, w * 0.66); g.restore(); } }
    if (!B) { g.fillStyle = '#bfb49a'; g.beginPath(); g.arc(q[0], q[1], r * 0.12, 0, 7); g.fill(); } }
  /* peña de la acrópolis: en A, la sombra de la roca de bulto; en B, la peña rayada (el templo se dibuja luego, en su orden) */
  const qA = px(T.acro.x, T.acro.z), rA = T.acro.r * k;
  if (!B && T.conTemplo) { const gr = g.createRadialGradient(qA[0] + rA * 0.25, qA[1] + rA * 0.2, rA * 0.3, qA[0] + rA * 0.25, qA[1] + rA * 0.2, rA * 1.7); gr.addColorStop(0, 'rgba(50,42,30,.5)'); gr.addColorStop(1, 'rgba(50,42,30,0)'); g.fillStyle = gr; g.beginPath(); g.arc(qA[0] + rA * 0.25, qA[1] + rA * 0.2, rA * 1.7, 0, 7); g.fill(); }
  if (!B) { /* casas: su sombra en el suelo y el tejado visto desde arriba (la polis se lee ya a media altura) */
    for (const h of T.casas) { const q = px(h.x, h.z); g.save(); g.translate(q[0], q[1]); g.rotate(-h.ang); const w = h.w * k, d = h.d * k;
      g.save(); g.rotate(h.ang); g.fillStyle = 'rgba(40,30,20,.34)'; g.translate(h.h * k * 0.75, h.h * k * 0.6); g.rotate(-h.ang); g.fillRect(-w / 2, -d / 2, w, d); g.restore();
      g.fillStyle = TEJ[(h.u * 6) | 0]; g.fillRect(-w / 2, -d / 2, w, d); g.fillStyle = 'rgba(255,240,200,.22)'; g.fillRect(-w / 2, -d / 2, w, d / 2); g.strokeStyle = 'rgba(60,40,20,.45)'; g.lineWidth = 1; g.strokeRect(-w / 2, -d / 2, w, d); g.restore(); }
  } else { /* la ciudad a pluma: todo en alzado y pintado de norte a sur, para que lo de delante tape lo de detrás */
    const cosas = []; for (const h of T.casas) cosas.push({ z: h.z, h });
    const nA = Math.round(14 + T.casas.length * 0.16); for (let i = 0, n = 0; i < nA * 6 && n < nA; i++) { const a = rr() * 6.283, d = T.R * (0.25 + rr() * 1.05), x = T.agora.x + Math.cos(a) * d, z = T.agora.z + Math.sin(a) * d; if (!T.seco(x, z) || Math.hypot(x - T.acro.x, z - T.acro.z) < T.acro.r * 1.5 || Math.hypot(x - T.agora.x, z - T.agora.z) < T.agora.r * 1.3) continue;
      let libre = true; for (const h of T.casas) if (Math.abs(h.x - x) < 0.004 && Math.abs(h.z - z) < 0.005) { libre = false; break; } if (!libre) continue; cosas.push({ z, x, arbol: true, cip: rr() < 0.35, e: 0.0042 + rr() * 0.002 }); n++; }
    if (T.conTemplo) cosas.push({ z: T.acro.z + T.acro.r * 0.2, templo: true });
    cosas.sort((a, b) => a.z - b.z); const EST = 1.28;   // la cámara mira inclinada y aplasta lo vertical: se estira para que el alzado se vea derecho
    for (const o of cosas) {
      if (o.templo) { const rx = Math.max(rA * 1.05, 0.0085 * k); g.save(); g.translate(qA[0], qA[1]); g.scale(1, EST); penaTinta(g, 0, 0, rx, T.acro.alto, rr); temploTinta(g, 0, rx * 0.14, rx * 1.5, T.color); g.restore(); }
      else if (o.arbol) { const q = px(o.x, o.z); g.save(); g.translate(q[0], q[1]); g.scale(1, EST); arbolTinta(g, 0, 0, o.e * k, o.cip); g.restore(); }
      else { const h = o.h, q = px(h.x, h.z); if (T.conTemplo) { const rx = Math.max(rA * 1.05, 0.0085 * k), dy = q[1] - qA[1]; if (Math.abs(q[0] - qA[0]) < rx * 1.3 && dy > -rx * 0.3 && dy < rx * (1.0 + 0.3 * T.acro.alto) * EST) continue; } g.save(); g.translate(q[0], q[1] + h.d * k * 0.3); g.scale(1, EST); casitaTinta(g, 0, 0, h.w * k * 1.12, h.t, Math.abs(Math.sin(h.ang)) > 0.7, h.t < 0.15 ? T.color : h.u < 0.45 ? '#b9764a' : h.u < 0.78 ? '#c9a070' : '#a99060', h.u > 0.5 ? '#f3e8cb' : '#e8d8b0'); g.restore(); } }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t;
}

/* material que tiende un plano pintado sobre el relieve (lee la textura de alturas, como el suelo) */
function materialTendido(com, tex) {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: Object.assign({ tPlano: { value: tex }, uOp: { value: 1 } }, com),
    vertexShader: 'uniform sampler2D tAlt; uniform vec4 uMarco; uniform float uKy, uPx; varying vec2 vUv; varying vec2 vP; void main(){ vUv = uv; vec2 p = (modelMatrix * vec4(position, 1.0)).xz; vP = p; float a = texture2D(tAlt, clamp((p - uMarco.xy) * uMarco.zw, 0.0003, 0.9997)).r; gl_Position = projectionMatrix * viewMatrix * vec4(p.x, max(a, 0.0) * uKy + uPx * 0.8, p.y, 1.0); }',
    fragmentShader: 'uniform sampler2D tPlano, tRuido; uniform float uOp, uNubes, t; varying vec2 vUv; varying vec2 vP; void main(){ vec4 c = texture2D(tPlano, vUv); float n = texture2D(tRuido, vP * 0.011 + vec2(t * 0.0042, t * 0.0017)).b, m = texture2D(tRuido, vP * 0.031 - vec2(t * 0.003, -t * 0.002)).b; c.rgb *= 1.0 - uNubes * smoothstep(0.50, 0.66, n * 0.7 + m * 0.3); gl_FragColor = vec4(c.rgb, c.a * uOp); }' });
}

/* una casa sencilla: muros y tejado a dos aguas (o azotea), en dos piezas para darles color aparte */
function geoCasa() {
  const muro = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  const t = new THREE.BufferGeometry(), v = [-0.56, 1, -0.56, 0.56, 1, -0.56, 0.56, 1, 0.56, -0.56, 1, 0.56, -0.56, 1.5, 0, 0.56, 1.5, 0];
  t.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); t.setIndex([0, 4, 5, 0, 5, 1, 3, 2, 5, 3, 5, 4, 0, 3, 4, 1, 5, 2]); t.computeVertexNormals();
  return { muro, tejado: t.toNonIndexed() };
}

/* peña de la acrópolis, de bulto: roca en escalones irregulares, clara arriba y parda abajo, con la cima llana para el templo */
function geoPena(r, h, sem) {
  const rnd = azar(sem * 31 + 5), seg = 22, an = [[1.42, 0, 0.0], [1.2, 0.3, 0.35], [1.02, 0.66, 0.7], [0.88, 0.93, 0.95], [0.78, 1, 1]], pos = [], col = [], idx = [], c0 = new THREE.Color('#98a064'), c1 = new THREE.Color('#e2d4b0'), cc = new THREE.Color(), lob = [rnd() * 6, rnd() * 6, rnd() * 6];
  an.forEach((A, i) => { for (let s = 0; s < seg; s++) { const a = s / seg * 6.283, q = 1 + (0.1 * Math.sin(a * 2 + lob[0]) + 0.07 * Math.sin(a * 3 + lob[1]) + 0.05 * Math.sin(a * 5 + lob[2])) * (i === 4 ? 0.5 : 1) + (rnd() - 0.5) * 0.06; pos.push(Math.cos(a) * r * A[0] * q, h * A[1] * (i > 0 && i < 3 ? 0.9 + 0.2 * rnd() : 1), Math.sin(a) * r * A[0] * q); cc.copy(c0).lerp(c1, A[2] * (0.9 + 0.2 * rnd())); col.push(cc.r, cc.g, cc.b); } });
  pos.push(0, h, 0); col.push(c1.r, c1.g, c1.b);
  for (let i = 0; i < 4; i++) for (let s = 0; s < seg; s++) { const a = i * seg + s, b = i * seg + (s + 1) % seg, c = a + seg, d = b + seg; idx.push(a, c, b, b, c, d); }
  for (let s = 0; s < seg; s++) idx.push(4 * seg + s, 5 * seg, 4 * seg + (s + 1) % seg);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

export class Vida {
  constructor(mapa) { this.m = mapa; this.g = new THREE.Group(); mapa.escena.add(this.g); this.vivos = []; this.polis = []; this.est = 'a'; this.rnd = azar(7); this._esc = 1; }
  async iniciar() {
    await preloadStatic(['grie_templo', 'grie_casa', 'grie_casa_b', 'grie_casa_c', 'grie_trirreme', 'barco', 'olivo', 'cipres']); this.amarrados = []; this.tBase = mancha('rgba(226,206,160,1)', 0.7);
    this.tHumoA = mancha('rgba(235,228,214,1)'); this.tHumoB = mancha('rgba(90,70,54,1)'); this.tEstela = mancha('rgba(255,255,255,1)', 0.3);
    this.geo = geoCasa(); this.matMuro = new THREE.MeshLambertMaterial({ color: '#ffffff' }); this.matTejado = new THREE.MeshLambertMaterial({ color: '#ffffff' }); const alt = this.m.rel.altura;
    for (const p of POLIS) this.polis.push(this._polis(p, alt));
    this._barcos(); this._rebanos(); this._nubes(); this._arboles();
    /* márgenes de la carta (solo estilo B, de lejos): título arriba y rosa de los vientos abajo, para que el pergamino no quede vacío */
    this.margenes = []; let T = '#4a2f1c'; const lam = (dib, z, est) => { const c = document.createElement('canvas'); c.width = 1024; c.height = 256; const g = c.getContext('2d'); g.textAlign = 'center'; g.fillStyle = T; g.strokeStyle = T; g.lineJoin = 'round'; dib(g);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const me = new THREE.Mesh(new THREE.PlaneGeometry(56, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false, opacity: 0 })); me.position.set(XI + ANCHO / 2, 0.05, z); me.renderOrder = 8; me.frustumCulled = false; me.visible = false; me.userData.est = est; this.g.add(me); this.margenes.push(me); };
    for (const EST of ['b', 'a']) { T = EST === 'b' ? '#4a2f1c' : '#f6efdc';
      lam(g => { if (EST === 'a') { g.fillStyle = g.strokeStyle = '#27405a'; } g.font = 'italic 96px Georgia, serif'; try { g.letterSpacing = '30px'; } catch (e) {} g.fillText('ΕΛΛΑΣ', 512, 120); try { g.letterSpacing = '6px'; } catch (e) {} g.font = 'italic 34px Georgia, serif'; g.fillText('Carta de las polis de Grecia y de sus riquezas', 512, 180);
      g.lineWidth = 3; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(512 + s * 130, 214); g.lineTo(512 + s * 430, 214); g.stroke(); g.beginPath(); g.arc(512 + s * 110, 214, 6, 0, 7); g.fill(); } }, ZN - 9.5, EST);
      lam(g => { g.translate(512, 128); g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 84, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 74, 0, 7); g.stroke();
      for (let i = 0; i < 16; i++) { const L = i % 4 === 0 ? 116 : i % 2 === 0 ? 82 : 50; g.save(); g.rotate(i * Math.PI / 8); g.beginPath(); g.moveTo(0, -L); g.lineTo(9, 0); g.lineTo(-9, 0); g.closePath(); g.fillStyle = i % 2 ? (EST === 'a' ? '#5f8fae' : '#c9b98c') : (i % 4 === 0 ? (EST === 'a' ? '#e9c46a' : '#7a2b20') : T); g.fill(); g.stroke(); g.restore(); }
      g.fillStyle = T; g.font = 'italic 30px Georgia, serif'; g.fillText('Céfiro', -300, 10); g.fillText('Euro', 300, 10); g.font = 'bold 26px Georgia, serif'; g.fillText('N', 0, -92); }, ZN + FONDO + 9.5, EST);
    }
    /* canteras y minas: dos o tres labores por comarca de piedra o de hierro, donde hay roca o monte */
    this.labores = []; this.tLabor = {}; const rl = azar(53), masc = this.m.masc, geoL = new THREE.PlaneGeometry(1, 1, 6, 6).rotateX(-Math.PI / 2);
    for (const z of ZONAS) { if (z.t !== 'piedra' && z.t !== 'hierro') continue; const zx = X(z.lon), zz = Z(z.lat), R = z.r / 10, pts = [];
      for (let i = 0; i < 260 && pts.length < 3; i++) { const an = rl() * 6.283, d = R * (0.25 + 0.6 * rl()), x = zx + Math.cos(an) * d, y = zz + Math.sin(an) * d; if (alt(x, y) < 25 || this.m.rel.costaKm(x, y) < 0.5 || masc(x, y, 0) > 0.35 + i * 0.002) continue; if (pts.some(q => Math.hypot(q[0] - x, q[1] - y) < R * 0.45)) continue; pts.push([x, y]); }
      for (const q of pts) { const me = new THREE.Mesh(geoL, materialTendido(this.m.com, null)); me.position.set(q[0], 0, q[1]); me.renderOrder = 2; me.frustumCulled = false; me.visible = false; this.g.add(me); this.labores.push({ me, t: z.t, x: q[0], z: q[1] }); } }
    { const me = new THREE.Mesh(geoL, materialTendido(this.m.com, null)), x = X(24.04), z = Z(37.735); me.position.set(x, 0, z); me.renderOrder = 2; me.frustumCulled = false; me.visible = false; this.g.add(me); this.labores.push({ me, t: 'hierro', x, z }); }   // las minas de plata del Laurion (el lujo de Atenas)
    /* ejemplares compartidos del caserío de lejos */
    this.lejosInst = {}; for (const k of ['grie_templo', 'grie_casa', 'grie_casa_b', 'grie_casa_c', 'olivo', 'cipres']) { const g = staticInstancedVacio(k, 40, '#b0623c'); if (g) { this.g.add(g); this.lejosInst[k] = { g, n: 0 }; } }
  }

  /* ---------- una polis ---------- */
  _polis(p, alt) {
    const rnd = this.rnd, P = { p, x: X(p.lon), z: Z(p.lat) }, com = this.m.com;
    /* de lejos (A): templo y casas de 0 A.D. (ejemplares compartidos por las ocho polis: pocas llamadas) sobre una mancha de tierra pisada */
    const lejos = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: this.tBase, transparent: true, depthWrite: false, opacity: 0.85 })); lejos.renderOrder = 2;
    lejos.position.set(P.x, 0, P.z); this.g.add(lejos); P.lejos = lejos; P.piezas = [{ k: 'grie_templo', x: 0, z: 0, r: 0.5, e: 1.15 }];
    const nc = p.pri === 1 ? 6 : 4; for (let i = 0; i < nc; i++) { const a = i / nc * Math.PI * 2 + rnd() * 0.5, r = 25 + (i % 3) * 8 + rnd() * 4; P.piezas.push({ k: ['grie_casa', 'grie_casa_b', 'grie_casa_c'][i % 3], x: Math.cos(a) * r, z: Math.sin(a) * r, r: -a + Math.PI / 2 + (rnd() - 0.5) * 0.6, e: 0.95 }); }
    for (let i = 0; i < 4; i++) { const a = rnd() * 6.28, r = 40 + rnd() * 8; P.piezas.push({ k: i % 2 ? 'olivo' : 'cipres', x: Math.cos(a) * r, z: Math.sin(a) * r, r: rnd() * 6, e: i % 2 ? 0.9 : 1.4 }); }
    /* de lejos (B): la ciudad dibujada a tinta */
    const sello = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconoCiudad(p), transparent: true, depthWrite: false, depthTest: false })); sello.center.set(0.5, 0.42); sello.renderOrder = 5; sello.position.set(P.x, 0, P.z); this.g.add(sello); P.sello = sello;
    /* de cerca: plano de calles tendido sobre el relieve y casas una a una (la polis y, si tiene, su puerto) */
    const R = 0.05 + p.casas / 300 * 0.032, F = FORMA[p.id] || {}, sem = POLIS.indexOf(p) * 97 + 11; P.R = R;
    if (F.aldeas) { P.barrios = []; for (let i = 0; i < F.aldeas; i++) { const a = 0.6 + i / (F.aldeas - 1) * 6.283, d = i ? R * 1.05 : 0; P.barrios.push(this._barrio({ x: P.x + Math.cos(a) * d, z: P.z + Math.sin(a) * d, color: p.color }, alt, Math.round(p.casas / F.aldeas), R * 0.4, sem + i * 13, i === 0, { nR: 5, acroD: 0.5, acroR: 0.2, alto: 1 })); } }
    else P.barrios = [this._barrio(p, alt, p.casas, R, sem, true, F)];
    if (p.puerto) { /* el puerto: un caserío en la tierra firme más cercana al fondeadero */
      let px = X(p.puerto[0]), pz = Z(p.puerto[1]), mejor = null; for (let r = 0; r < 0.2 && !mejor; r += 0.012) for (let k = 0; k < 16; k++) { const an = k / 16 * 6.283, x = px + Math.cos(an) * r, z = pz + Math.sin(an) * r; if (alt(x, z) > 4 && this.m.rel.costaKm(x, z) > 0.2) { mejor = [x, z]; break; } }
      if (mejor) { /* el muelle sale de la orilla más cercana, mar adentro; las barcas se amarran a sus dos lados */
        let agua = null; for (let r = 0.006; r < 0.09 && !agua; r += 0.004) for (let k = 0; k < 24; k++) { const an = k / 24 * 6.283 + r * 40, x = mejor[0] + Math.cos(an) * r, z = mejor[1] + Math.sin(an) * r; if (alt(x, z) < -3) { agua = [x, z]; break; } }
        let muelle = null; if (agua) { const d = Math.hypot(agua[0] - mejor[0], agua[1] - mejor[1]), ux = (agua[0] - mejor[0]) / d, uz = (agua[1] - mejor[1]) / d; let s0 = 0; while (s0 < d && alt(mejor[0] + ux * s0, mejor[1] + uz * s0) > 1) s0 += 0.001;
          const a0 = [mejor[0] + ux * (s0 - 0.003), mejor[1] + uz * (s0 - 0.003)], L = 0.024; muelle = { a: a0, b: [a0[0] + ux * (L + 0.003), a0[1] + uz * (L + 0.003)] };
          [[0.5, 1], [0.5, -1], [0.92, 1], [0.92, -1]].forEach((q, n) => { const s1 = 0.003 + L * q[0]; this.amarrados.push({ fijo: true, x: a0[0] + ux * s1 - uz * 0.0036 * q[1], z: a0[1] + uz * s1 + ux * 0.0036 * q[1], rumbo: Math.atan2(ux, uz) + (n % 2 ? Math.PI : 0), ri: n, guerra: n === 0 }); }); }
        const b = this._barrio({ x: mejor[0], z: mejor[1], color: p.color }, alt, 34, 0.026, POLIS.indexOf(p) * 131 + 5, false, muelle ? { muelle } : undefined); if (b.T.casas.length > 3) { P.barrios.push(b); P.puertoXZ = [b.T.cx, b.T.cz]; P.puertoR = b.T.R; } } }
    /* humo de los hogares */
    P.humo = new THREE.Group(); P.humo.position.set(P.x, 0, P.z); this.g.add(P.humo); P.humos = [];
    for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tHumoA, transparent: true, depthWrite: false, opacity: 0 })); s.renderOrder = 6; P.humo.add(s); P.humos.push({ s, f: i / 6, vx: 0.5 + rnd() * 0.3, o: i < 4 ? [8, 16, -6] : [-22, 10, 14], tam: i < 4 ? 1 : 0.7 }); }
    return P;
  }
  _barrio(p, alt, casas, R, semilla, conTemplo, F) {
    const T = trazar(p, alt, casas, R, semilla, F); T.conTemplo = !!conTemplo; if (F && F.muelle) T.muelle = F.muelle; const lado = Math.max(R * 2.9, F && F.muelle ? 2 * (Math.hypot(F.muelle.b[0] - T.cx, F.muelle.b[1] - T.cz) + 0.008) : 0), B = { T, lado, tex: {} };
    B.plano = new THREE.Mesh(new THREE.PlaneGeometry(lado, lado, 24, 24).rotateX(-Math.PI / 2), materialTendido(this.m.com, null)); B.plano.position.set(T.cx, 0, T.cz); B.plano.renderOrder = 2; B.plano.frustumCulled = false; B.plano.visible = false; this.g.add(B.plano);
    const n = T.casas.length, m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), eje = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    const muros = new THREE.InstancedMesh(this.geo.muro, this.matMuro, n), tej = new THREE.InstancedMesh(this.geo.tejado, this.matTejado, n);
    T.casas.forEach((h, i) => { v.set(h.x, Math.max(0, alt(h.x, h.z)) * KY_CERCA, h.z); q.setFromAxisAngle(eje, h.ang); s.set(h.w, h.h, h.d); m4.compose(v, q, s); muros.setMatrixAt(i, m4); tej.setMatrixAt(i, m4);
      muros.setColorAt(i, col.set(MUROS[(h.t * 5) | 0])); tej.setColorAt(i, col.set(TEJ[(h.u * 6) | 0])); });
    for (const im of [muros, tej]) { im.frustumCulled = false; im.visible = false; this.g.add(im); } B.muros = muros; B.tejados = tej;
    if (conTemplo) { const g = new THREE.Group(), y = Math.max(0, alt(T.acro.x, T.acro.z)) * KY_CERCA; g.position.set(T.acro.x, y, T.acro.z);
      const hr = 0.0034 * T.acro.alto, roca = new THREE.Mesh(geoPena(T.acro.r, hr, semilla), new THREE.MeshLambertMaterial({ vertexColors: true })); roca.position.y = -hr * 0.04; g.add(roca);
      const tp = staticMesh('grie_templo', p.color); if (tp) { const et = Math.min(M * 3.4, T.acro.r * 1.5 / 22); tp.scale.setScalar(et); tp.position.y = hr * 0.96 + 5 * et; tp.rotation.y = 0.5; g.add(tp); }
      for (let i = 0; i < 5; i++) { const a = i * 1.3 + 0.4, c = staticMesh(i % 2 ? 'olivo' : 'cipres'); if (c) { c.scale.setScalar(M * (i % 2 ? 1.5 : 2)); c.position.set(Math.cos(a) * T.acro.r * 1.55, -0.0002, Math.sin(a) * T.acro.r * 1.55); g.add(c); } }
      g.visible = false; this.g.add(g); B.acro = g; }
    return B;
  }

  /* ---------- barcos por las rutas del mar ---------- */
  _barcos() {
    this.barcos = []; const lista = [];
    RUTAS.forEach((r, ri) => { const pts = r.l.map(q => new THREE.Vector3(X(q[0]), 0, Z(q[1]))), lon = [0]; for (let i = 1; i < pts.length; i++) lon.push(lon[i - 1] + pts[i].distanceTo(pts[i - 1]));
      const total = lon[lon.length - 1], cuantos = total > 30 ? 2 : 1; for (let b = 0; b < cuantos; b++) lista.push({ pts, lon, total, s: ((b / cuantos + ri * 0.137) % 1) * total, sentido: b % 2 ? -1 : 1, ri, guerra: ri % 3 === 0 }); });
    for (const am of this.amarrados) lista.push(am);
    const n = lista.length, casco = new THREE.BufferGeometry();
    casco.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.07, 0.5, 0, 0.1, -0.5, -0.13, 0.07, -0.05, 0.13, 0.07, -0.05, 0, -0.03, 0, -0.1, 0.07, -0.42, 0.1, 0.07, -0.42], 3)); casco.setIndex([0, 2, 4, 0, 4, 3, 2, 5, 4, 3, 4, 6, 5, 1, 4, 1, 6, 4, 0, 3, 2, 2, 3, 6, 2, 6, 5, 5, 6, 1]); casco.computeVertexNormals();
    const vela = new THREE.PlaneGeometry(0.42, 0.34).translate(0, 0.32, 0.06), palo = new THREE.PlaneGeometry(0.02, 0.5).translate(0, 0.3, 0.05).rotateY(Math.PI / 2), estela = new THREE.PlaneGeometry(0.34, 1.3).rotateX(-Math.PI / 2).translate(0, 0.004, -0.95);
    const I = (g, mat) => { const im = new THREE.InstancedMesh(g, mat, n); im.frustumCulled = false; this.g.add(im); return im; };
    this.bCascos = I(casco, new THREE.MeshLambertMaterial({ color: '#7a5230' })); this.bVelas = I(vela, new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide })); this.bEstelas = I(estela, new THREE.MeshBasicMaterial({ map: this.tEstela, transparent: true, opacity: 0.5, depthWrite: false })); this.bEstelas.renderOrder = 2;
    this.bDib = I(new THREE.PlaneGeometry(1.15, 1.15).translate(0, 0.35, 0), new THREE.MeshBasicMaterial({ map: iconoBarco(1), transparent: true, depthWrite: false })); this.bDib.renderOrder = 5;
    const col = new THREE.Color(); lista.forEach((b, i) => { this.bVelas.setColorAt(i, col.set(b.guerra ? '#c9553f' : i % 2 ? '#f2e6c8' : '#e2d2a8')); b.modelo = null; this.barcos.push(b); });
    this._m4 = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._q2 = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._v = new THREE.Vector3(); this._eje = new THREE.Vector3(0, 1, 0); this._cero = new THREE.Matrix4().makeScale(0, 0, 0);
  }
  /* ---------- árboles de cerca: pinos y encinas con volumen, solo alrededor de la cámara (se recolocan al moverse) ---------- */
  _arboles() {
    const N = 2200, pino = new THREE.ConeGeometry(0.5, 1.7, 7, 1, true).translate(0, 0.95, 0), copa = new THREE.IcosahedronGeometry(0.7, 0), mat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    copa.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from(copa.attributes.position.array, v => v / 0.7), 3)); copa.scale(1, 0.72, 1).translate(0, 0.55, 0);   // luz redonda: la copa no enseña sus caras
    const I = g => { const im = new THREE.InstancedMesh(g, mat, N); im.count = 0; im.frustumCulled = false; im.visible = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.g.add(im); return im; };
    const som = new THREE.InstancedMesh(new THREE.CircleGeometry(0.7, 8).rotateX(-Math.PI / 2).scale(1.25, 1, 0.9).translate(0.6, 0.03, 0.46), new THREE.MeshBasicMaterial({ color: '#141c0c', transparent: true, opacity: 0.4, depthWrite: false }), N * 2); som.count = 0; som.frustumCulled = false; som.visible = false; som.renderOrder = 3; som.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.g.add(som);
    this.arb = { pinos: I(pino), copas: I(copa), som, N, clave: '', col: new THREE.Color() };
  }
  _plantar(w, h) {
    const m = this.m, A = this.arb, upx = m.V.upx, ver = this.est === 'a' && m.ancho < 0.75; A.pinos.visible = A.copas.visible = A.som.visible = ver; if (!ver) return;
    const paso = Math.max(0.0034, upx * 9), rx = w * upx * 0.62, rz = h * upx * 0.95, cx = Math.round(m.V.x / (rx * 0.25)), cz = Math.round(m.V.z / (rz * 0.25)), clave = cx + ',' + cz + ',' + Math.round(Math.log2(upx) * 3); if (clave === A.clave) return; A.clave = clave;
    const alt = m.rel.altura, masc = m.masc, m4 = this._m4, q = this._q, s = this._s, v = new THREE.Vector3(), x0 = Math.floor((m.V.x - rx) / paso), x1 = Math.ceil((m.V.x + rx) / paso), z0 = Math.floor((m.V.z - rz * 1.25) / paso), z1 = Math.ceil((m.V.z + rz * 0.75) / paso); let np = 0, nc = 0;
    const dado = (i, j, k) => { let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + k * 974711; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const PINO = ['#5f8450', '#6c9458', '#567a48'], COPA = ['#7f9a52', '#8ea65c', '#72904a', '#9aa866'];
    for (let j = z1; j >= z0; j--) for (let i = x0; i <= x1; i++) { const x = (i + dado(i, j, 1)) * paso, z = (j + dado(i, j, 2)) * paso, bos = masc(x, z, 1), cam = masc(x, z, 0), r = dado(i, j, 3);
      const soto = dado(Math.floor(i / 5), Math.floor(j / 5), 9), dens = bos > 0.25 ? 0.5 + 0.4 * bos : (cam > 0.4 ? 0.03 : 0.08) * (soto > 0.6 ? 3.2 : soto < 0.3 ? 0.25 : 1); if (r > dens) continue; const a = alt(x, z); if (a < 3) continue;
      let enPueblo = false; for (const P of this.polis) for (const b of P.barrios) if (Math.hypot(x - b.T.cx, z - b.T.cz) < b.T.R * 1.05 && Math.hypot(x - b.T.agora.x, z - b.T.agora.z) < b.T.R) { enPueblo = dado(i, j, 5) > 0.12; break; } if (enPueblo) continue;
      const e = 0.0017 + 0.003 * dado(i, j, 4) * dado(i, j, 4), esPino = bos > 0.25 ? dado(i, j, 6) < 0.7 : dado(i, j, 6) < 0.15; v.set(x, a * KY_CERCA, z); q.setFromAxisAngle(this._eje, r * 40); s.set(e, e * (esPino ? 1.25 : 1), e); m4.compose(v, q.identity(), s); if (np + nc < A.N * 2) A.som.setMatrixAt(np + nc, m4); m4.compose(v, q.setFromAxisAngle(this._eje, r * 40), s);
      if (esPino) { if (np < A.N) { A.pinos.setMatrixAt(np, m4); A.pinos.setColorAt(np++, A.col.set(PINO[(r * 300 | 0) % 3])); } } else if (nc < A.N) { A.copas.setMatrixAt(nc, m4); A.copas.setColorAt(nc++, A.col.set(COPA[(r * 400 | 0) % 4])); } }
    A.pinos.count = np; A.copas.count = nc; A.som.count = np + nc; A.som.instanceMatrix.needsUpdate = true; A.pinos.instanceMatrix.needsUpdate = A.copas.instanceMatrix.needsUpdate = true; if (A.pinos.instanceColor) A.pinos.instanceColor.needsUpdate = true; if (A.copas.instanceColor) A.copas.instanceColor.needsUpdate = true;
  }
  /* ---------- rebaños ---------- */
  _rebanos() {
    const pastos = [[22.25, 37.55], [22.5, 39.45], [23.2, 38.38], [23.85, 38.0], [22.5, 37.15], [27.45, 37.6], [23.3, 38.05], [22.65, 37.68], [21.5, 37.8], [23.5, 38.5], [22.76, 37.61], [23.7, 38.02], [22.46, 37.09], [22.9, 37.89]], n = 14;
    const geo = new THREE.SphereGeometry(1, 6, 4).scale(1.5, 1, 1), im = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: '#f4f0e6' }), pastos.length * n); im.frustumCulled = false; this.g.add(im);
    const sem = []; for (let i = 0; i < pastos.length * n; i++) sem.push([this.rnd() * 6.28, 0.25 + this.rnd() * 0.75, this.rnd() * 6.28]);
    this.reb = { im, pastos, n, sem, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), v: new THREE.Vector3(), s: new THREE.Vector3(), eje: new THREE.Vector3(0, 1, 0) };
  }
  /* ---------- nubes altas (solo de lejos) ---------- */
  _nubes() { this.nubes = []; const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'), rr = azar(41);
    for (let i = 0; i < 26; i++) { const x = 40 + rr() * 176, y = 44 + rr() * 44, r = 16 + rr() * 26, gr = g.createRadialGradient(x, y, 1, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    const tN = new THREE.CanvasTexture(c); tN.colorSpace = THREE.SRGBColorSpace;
    for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tN, transparent: true, depthWrite: false, opacity: 0 }));
      const sx = 12 + this.rnd() * 12; m.scale.set(sx, 1, sx * 0.5); m.rotation.y = (this.rnd() - 0.5) * 0.5; m.renderOrder = 7; m.frustumCulled = false; this.g.add(m); this.nubes.push({ m, x0: this.rnd(), z0: (this.rnd() - 0.5) * FONDO, y: 5.5 + this.rnd() * 2 }); } }

  estilo(k) {
    this.est = k; const B = k === 'b';
    for (const P of this.polis) { for (const h of P.humos) { h.s.material.map = B ? this.tHumoB : this.tHumoA; h.s.material.needsUpdate = true; }
      for (const b of P.barrios) { b.plano.material.uniforms.tPlano.value = null; } }
    this.bCascos.visible = this.bVelas.visible = !B; this.bDib.visible = B; this.bEstelas.material.opacity = B ? 0.3 : 0.4; for (const b of this.barcos) if (b.modelo) b.modelo.visible = false;
    this.reb.im.material.color.set(B ? '#fbf4e2' : '#f4f0e6'); if (this.arb) this.arb.clave = '';
  }
  texturas(tx) { for (const t of [this.tHumoA, this.tHumoB, this.tEstela]) if (t) tx.add(t); for (const k in this.tLabor) tx.add(this.tLabor[k]); for (const P of this.polis) for (const b of P.barrios) for (const k in b.tex) tx.add(b.tex[k]); }
  alzaRotulo() { return 0; }
  radioPolisPx() { return this._radioPx || 16; }

  cuadro(t, dt, w, h) {
    const m = this.m, upx = m.V.upx, a = m.ancho, ky = m.com.uKy.value, alt = m.rel.altura, B = this.est === 'b';
    /* el caserío de lejos mide siempre unos 21 px de radio (nunca menos que la polis real); por debajo de ~16 km de ancho deja paso al plano y a las casas */
    const fuera = paso(0.9, 1.3, a), cerca = a < 1.3, plano = a < A_PLANO, I = this.lejosInst; for (const k in I) I[k].n = 0;
    const rLejos = mix(mix(52, 21, paso(3, 12, a)), 16, paso(30, 50, a)), pxSello = mix(66, mix(50, 42, paso(25, 45, a)), paso(3, 14, a));
    this._radioPx = cerca ? clamp(0.06 / upx, 12, 46) : B ? pxSello * 0.42 : rLejos;
    for (const P of this.polis) { const y = Math.max(0, alt(P.x, P.z)) * ky, esc = clamp(Math.max(rLejos * upx, P.R * 0.9) / 0.95, 0.02, 2.6) * (0.6 + 0.4 * fuera) * (P.p.pri === 3 ? mix(1, 0.7, paso(25, 45, a)) : 1), ee = E * esc;
      const enVista = Math.abs(P.x - m.V.x) < w * upx * 0.75 + 3 * esc && Math.abs(P.z - m.V.z) < h * upx * 1.3 + 3 * esc;
      P.lejos.visible = !B && fuera > 0.02 && enVista; if (P.lejos.visible) { P.lejos.position.y = y + upx * 0.6; P.lejos.scale.setScalar(esc); P.lejos.material.opacity = 0.85 * fuera;
        for (const z of P.piezas) { const L = I[z.k]; if (!L || L.n >= 40) continue; this._m4.compose(this._v.set(P.x + z.x * ee, y + (z.k === 'grie_templo' ? 5 : 4.6) * ee * z.e, P.z + z.z * ee), this._q.setFromAxisAngle(this._eje, z.r), this._s.setScalar(ee * z.e)); for (const im of L.g.children) im.setMatrixAt(L.n, this._m4); L.n++; } }
      P.sello.visible = B && a > 0.9; if (P.sello.visible) { P.sello.position.y = y; const sz = Math.max(pxSello * (a > 25 && P.p.pri === 3 ? 0.85 : 1) * upx, P.R * 1.6); P.sello.scale.set(sz, sz, 1); P.sello.material.opacity = fuera; }
      for (const b of P.barrios) { const ver = plano && Math.abs(b.T.cx - m.V.x) < w * upx + b.lado && Math.abs(b.T.cz - m.V.z) < h * upx * 1.6 + b.lado; b.plano.visible = ver;
        if (ver) { const u = b.plano.material.uniforms; if (!b.tex[this.est]) b.tex[this.est] = pintarPlano(b.T, this.est, b.lado); u.tPlano.value = b.tex[this.est]; u.uOp.value = paso(A_PLANO, A_PLANO * 0.6, a); }
        else if (!plano) for (const k in b.tex) { b.tex[k].dispose(); delete b.tex[k]; }   // al alejarse se suelta la memoria del plano
        const casas = ver && !B && a < A_CASAS; b.muros.visible = b.tejados.visible = casas; if (b.acro) b.acro.visible = casas;
      }
      /* humo: sube y se deshace; su tamaño sigue al de la polis */
      const eh = Math.max(ee * 1.5, cerca ? 0.00042 : 0), hx = cerca ? P.barrios[0].T.agora.x - P.x : 0, hz = cerca ? P.barrios[0].T.agora.z - P.z : 0; P.humo.position.y = y;
      for (const H of P.humos) { const q = (t * 0.11 + H.f) % 1, e = (5 + q * 15) * H.tam * eh; H.s.position.set(hx + (H.o[0] + q * q * 26 * H.vx * H.tam) * eh, (H.o[1] + q * 34 * H.tam) * eh, hz + (H.o[2] + Math.sin(H.f * 9) * 2 * H.tam) * eh); H.s.scale.set(e, e, 1); H.s.material.opacity = (B ? 0.5 : 0.8) * Math.sin(Math.PI * Math.min(1, q * 1.15)) * (1 - q * 0.5); }
    }
    for (const k in I) for (const im of I[k].g.children) { im.count = I[k].n; im.instanceMatrix.needsUpdate = true; }
    /* barcos: de lejos miden unos 20 px (barquito propio); de cerca, su tamaño agrandado y, en A, el modelo de 0 A.D. */
    const tb = clamp(16 * upx, 46 * M, 1.5), vb = clamp(10 * upx, 0.0003, 0.09) * dt / 1000, real = !B && a < 2.2, cam = m.cam, q = this._q, cx = m.V.x, cz = m.V.z, rx = w * upx * 0.8 + tb, rz = h * upx * 1.4 + tb;
    this.bCascos.visible = this.bVelas.visible = !B;
    for (let i = 0; i < this.barcos.length; i++) { const b = this.barcos[i];
      if (b.fijo) { /* barca amarrada: solo de cerca, sin estela, meciéndose */ this.bEstelas.setMatrixAt(i, this._cero); const ta = clamp(8 * upx, 30 * M, 0.2), M0 = a < 5 ? this._m4.compose(this._v.set(b.x, ta * 0.02, b.z), q.setFromAxisAngle(this._eje, b.rumbo + Math.sin(t * 0.4 + b.ri) * 0.1), this._s.setScalar(ta)) : this._cero;
        if (!B) { this.bCascos.setMatrixAt(i, M0); this.bVelas.setMatrixAt(i, this._cero); } else this.bDib.setMatrixAt(i, a < 5 ? this._m4.compose(this._v.set(b.x, ta * 0.02, b.z), this._q2.copy(cam.quaternion), this._s.setScalar(ta * 0.8)) : this._cero); continue; }
      b.s = (b.s + b.sentido * vb + b.total) % b.total; let k = 1; while (k < b.lon.length - 1 && b.lon[k] < b.s) k++;
      const u = (b.s - b.lon[k - 1]) / (b.lon[k] - b.lon[k - 1] || 1), p0 = b.pts[k - 1], p1 = b.pts[k], v = this._v; v.lerpVectors(p0, p1, u); const x = v.x, z = v.z, y = tb * (0.02 + Math.sin(t * 1.7 + b.ri) * 0.006), rumbo = Math.atan2((p1.x - p0.x) * b.sentido, (p1.z - p0.z) * b.sentido);
      const cercaYo = real && Math.abs(x - cx) < rx && Math.abs(z - cz) < rz;
      if (cercaYo && !b.modelo) { const tipo = b.guerra ? 'grie_trirreme' : 'barco', c = staticMesh(tipo, POLIS[b.ri % POLIS.length].color); if (c) { c.scale.setScalar(1 / (b.guerra ? 46 : 28)); b.modelo = new THREE.Group(); b.modelo.add(c); this.g.add(b.modelo); } }
      if (b.modelo) { b.modelo.visible = !!cercaYo; if (cercaYo) { b.modelo.position.set(x, y, z); b.modelo.rotation.set(0, rumbo, Math.sin(t * 1.3 + b.ri * 2) * 0.05); b.modelo.scale.setScalar(tb); } }
      q.setFromAxisAngle(this._eje, rumbo); this._m4.compose(v.set(x, y, z), q, this._s.setScalar(tb)); const M4 = this._m4;
      this.bEstelas.setMatrixAt(i, M4); if (!B) { const z0 = cercaYo ? this._cero : M4; this.bCascos.setMatrixAt(i, z0); this.bVelas.setMatrixAt(i, z0); }
      else { this._q2.copy(cam.quaternion); this._m4.compose(v.set(x, y, z), this._q2, this._s.setScalar(tb)); this.bDib.setMatrixAt(i, this._m4); } }
    this.bEstelas.instanceMatrix.needsUpdate = true; if (!B) { this.bCascos.instanceMatrix.needsUpdate = this.bVelas.instanceMatrix.needsUpdate = true; } else this.bDib.instanceMatrix.needsUpdate = true;
    this._plantar(w, h);
    /* rebaños: ovejas que pacen despacio (no se pintan desde muy lejos) */
    const R = this.reb; R.im.visible = a < 60; if (R.im.visible) { const e = clamp(2.1 * upx, 0.0009, 0.05), disp = clamp(14 * upx, 0.012, 0.9);
      for (let i = 0; i < R.pastos.length; i++) { const Pp = R.pastos[i], cx = X(Pp[0]) + Math.sin(t * 0.02 + i) * disp * 0.4, cz = Z(Pp[1]) + Math.cos(t * 0.017 + i * 2) * disp * 0.4;
        for (let j = 0; j < R.n; j++) { const S = R.sem[i * R.n + j], an = S[0] + Math.sin(t * 0.05 + S[2]) * 0.8, r = S[1] * disp, x = cx + Math.cos(an) * r, z = cz + Math.sin(an) * r, hh = alt(x, z);
          R.v.set(x, Math.max(0, hh) * ky + e * 0.8, z); R.q.setFromAxisAngle(R.eje, -an + Math.cos(t * 0.05 + S[2])); R.s.setScalar(hh > 1 ? e : 0); R.m4.compose(R.v, R.q, R.s); R.im.setMatrixAt(i * R.n + j, R.m4); } }
      R.im.instanceMatrix.needsUpdate = true; }
    /* canteras y minas: se ven desde media altura; nunca miden menos de unos 44 px */
    const vl = paso(16, 9, a); for (const L of this.labores) { const ver = vl > 0.02 && Math.abs(L.x - m.V.x) < w * upx * 0.8 && Math.abs(L.z - m.V.z) < h * upx * 1.3; L.me.visible = ver; if (!ver) continue;
      const kk = L.t + this.est; if (!this.tLabor[kk]) this.tLabor[kk] = pintaLabor(L.t, B); const u = L.me.material.uniforms; u.tPlano.value = this.tLabor[kk]; u.uOp.value = vl; L.me.scale.setScalar(clamp(78 * upx, 0.06, 0.8)); }
    for (const me of this.margenes) { const o = me.userData.est === this.est ? paso(34, 46, a) : 0; me.visible = o > 0.01; me.material.opacity = o * (B ? 0.9 : 0.8); }
    /* nubes altas: pasan de oeste a este y se apartan al acercarse */
    const fn = (B ? 0 : 0.55) * paso(9, 26, a); for (const N of this.nubes) { N.m.visible = fn > 0.01; if (!N.m.visible) continue; const f = (N.x0 + t * 0.0035) % 1; N.m.position.set(XI - 10 + f * (ANCHO + 20), N.y, N.z0); N.m.material.opacity = fn * Math.sin(Math.PI * f); }
  }
}

/* ciudad dibujada a tinta para la carta (de lejos y a media altura): un caserío con su templo en alto, propio de cada polis
   (Esparta, cuatro aldeas sin peña; Tebas, con su cerca; Atenas y Corinto, la peña alta) */
function iconoCiudad(p) {
  const F = FORMA[p.id] || {}, c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), rr = azar(p.n.length * 13 + 7); g.lineJoin = g.lineCap = 'round';
  g.fillStyle = 'rgba(58,36,22,.2)'; g.beginPath(); g.ellipse(128, 226, 112, 20, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(240,228,194,.8)'; g.beginPath(); g.ellipse(128, 214, 104, 26, 0, 0, 7); g.fill();
  const casa = (x, y, w) => casitaTinta(g, x, y, w, rr(), rr() < 0.45, rr() < 0.3 ? p.color : rr() < 0.5 ? '#b9764a' : '#c9a070', '#f3e8cb');
  if (F.aldeas) { /* aldeas sueltas entre árboles, con un santuario pequeño */
    for (const q of [[50, 172], [204, 176], [74, 232], [184, 236]]) { casa(q[0] - 24, q[1] - 10, 50); casa(q[0] + 22, q[1], 54); }
    temploTinta(g, 128, 200, 78, p.color); arbolTinta(g, 128, 150, 44, true); arbolTinta(g, 16, 214, 40, false); arbolTinta(g, 240, 216, 40, false);
  } else {
    for (let i = 0; i < 5; i++) casa(30 + i * 49 + (rr() - 0.5) * 8, 188 + (rr() - 0.5) * 6, 40);            // fila del fondo
    const alto = F.alto || 1, yc = 166 - alto * 12; g.save(); g.translate(128, yc); penaTinta(g, 0, 0, 56, alto * 0.9, rr); temploTinta(g, 0, 9, 92, p.color); g.restore();
    for (const x of alto > 2 ? [24, 66, 190, 232] : [24, 66, 128, 190, 232]) casa(x + (rr() - 0.5) * 8, 220 + (rr() - 0.5) * 5, 42);
    for (const x of [46, 100, 156, 210]) casa(x + (rr() - 0.5) * 8, 244, 44);
    arbolTinta(g, 10, 240, 30, true); arbolTinta(g, 246, 242, 28, false);
    if (F.muralla) { g.strokeStyle = TINTA; g.lineWidth = 4; g.fillStyle = '#e4d4aa'; g.beginPath(); g.rect(8, 234, 240, 16); g.fill(); g.stroke(); for (let i = 0; i < 4; i++) { g.beginPath(); g.rect(4 + i * 76, 220, 20, 32); g.fill(); g.stroke(); } }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
/* canteras y minas, pintadas sobre el paisaje (el recurso se nota aunque no esté encendido «Recursos») */
function pintaLabor(tipo, B) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), rr = azar(tipo === 'piedra' ? 77 : 99); g.lineJoin = g.lineCap = 'round';
  const piedra = tipo === 'piedra', gr = g.createRadialGradient(128, 128, 30, 128, 128, 124); gr.addColorStop(0, B ? 'rgba(236,224,190,.85)' : piedra ? 'rgba(214,204,178,.9)' : 'rgba(150,118,92,.9)'); gr.addColorStop(1, B ? 'rgba(236,224,190,0)' : piedra ? 'rgba(214,204,178,0)' : 'rgba(150,118,92,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = B ? TINTA : 'rgba(60,48,34,.8)';
  if (piedra) { /* frente de cantera en bancales: tajos claros con su sombra, y sillares sueltos al pie */
    for (let i = 0; i < 4; i++) { const y = 70 + i * 30, x0 = 44 + i * 10 + rr() * 8, x1 = 214 - i * 8 - rr() * 10; g.beginPath(); g.moveTo(x0, y); for (let x = x0; x <= x1; x += 22) g.lineTo(x + rr() * 6, y + (rr() - 0.5) * 8); g.lineTo(x1, y + 24); g.lineTo(x0 + 6, y + 24); g.closePath();
      g.fillStyle = B ? '#f7efd8' : ['#f4efe2', '#e6dfcd', '#f8f4ea', '#ddd5c0'][i]; g.fill(); g.lineWidth = B ? 2.4 : 1.6; g.stroke(); g.fillStyle = B ? 'rgba(58,36,22,.35)' : 'rgba(70,60,48,.45)'; g.fillRect(x0 + 6, y + 18, x1 - x0 - 6, 6);
      if (B) { g.lineWidth = 1.3; g.beginPath(); for (let x = x0 + 10; x < x1; x += 9) { g.moveTo(x, y + 6); g.lineTo(x - 3, y + 17); } g.stroke(); } }
    for (let i = 0; i < 7; i++) { const x = 50 + rr() * 150, y = 196 + rr() * 30, w = 14 + rr() * 10; g.fillStyle = 'rgba(40,30,20,.3)'; g.fillRect(x + 3, y + 3, w, w * 0.6); g.fillStyle = B ? '#f7efd8' : '#f6f2e8'; g.fillRect(x, y, w, w * 0.6); g.lineWidth = B ? 2 : 1.2; g.strokeRect(x, y, w, w * 0.6); }
  } else { /* bocas de mina en la ladera, con su entibado claro, sendas y escombreras rojizas */
    g.lineWidth = B ? 3 : 5; g.strokeStyle = B ? TINTA : '#e8d6a8'; g.beginPath(); g.moveTo(86, 130); g.quadraticCurveTo(110, 190, 60, 236); g.moveTo(150, 112); g.quadraticCurveTo(140, 180, 128, 244); g.moveTo(186, 152); g.quadraticCurveTo(200, 200, 176, 240); g.stroke();
    for (let i = 0; i < 6; i++) { const x = 52 + rr() * 152, y = 168 + rr() * 60, r = 18 + rr() * 16; g.fillStyle = B ? 'rgba(170,84,54,.6)' : ['#b0603c', '#8c5a48', '#c27a4a'][i % 3]; g.beginPath(); g.ellipse(x, y, r * 1.3, r * 0.7, 0, 0, 7); g.fill(); g.strokeStyle = B ? TINTA : 'rgba(60,36,22,.6)'; g.lineWidth = B ? 1.8 : 1.4; g.stroke();
      g.fillStyle = 'rgba(255,230,190,.35)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.2, r * 0.6, r * 0.25, 0, 0, 7); g.fill(); }
    for (const q of [[86, 110], [150, 92], [186, 132]]) { g.fillStyle = B ? '#f1e3bd' : '#d9c7a0'; g.beginPath(); g.ellipse(q[0], q[1] + 4, 34, 30, 0, 0, 7); g.fill(); g.fillStyle = B ? TINTA : '#140f0c'; g.beginPath(); g.moveTo(q[0] - 18, q[1] + 22); g.lineTo(q[0] - 18, q[1] - 4); g.arc(q[0], q[1] - 4, 18, Math.PI, 0); g.lineTo(q[0] + 18, q[1] + 22); g.closePath(); g.fill();
      g.strokeStyle = B ? TINTA : '#8a5a30'; g.lineWidth = B ? 3.5 : 6; g.beginPath(); g.moveTo(q[0] - 22, q[1] + 24); g.lineTo(q[0] - 20, q[1] - 16); g.moveTo(q[0] + 22, q[1] + 24); g.lineTo(q[0] + 20, q[1] - 16); g.moveTo(q[0] - 27, q[1] - 18); g.lineTo(q[0] + 27, q[1] - 18); g.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
function iconoBarco(i) {
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'); g.lineJoin = g.lineCap = 'round'; g.strokeStyle = '#3a2416'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(10, 62); g.quadraticCurveTo(48, 92, 88, 58); g.lineTo(80, 72); g.quadraticCurveTo(48, 86, 20, 74); g.closePath(); g.fillStyle = '#8a5a33'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(48, 72); g.lineTo(48, 14); g.stroke(); g.beginPath(); g.moveTo(24, 22); g.quadraticCurveTo(52, 30, 74, 20); g.lineTo(72, 56); g.quadraticCurveTo(50, 64, 26, 56); g.closePath(); g.fillStyle = i % 2 ? '#f2e6c8' : '#c9553f'; g.fill(); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
