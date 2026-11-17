// EV7-EV8 · arte propio en SVG (dibujado a mano en código, sin copiar nada de otros juegos).
// EV8: Roma de 264 a.C. vista desde el Janículo, por capas: montes con bruma, el Lacio y sus granjas, el Tíber, el Campo de Marte,
// la muralla Serviana y la ciudad con sus siete edificios (tres aspectos cada uno: madera y adobe, toba y teja, estuco y terracota).
// el Campo de Marte con las legiones, los campos del Lacio que cambian con la estación.
// Aquí solo se dibuja: no se toca el estado del juego.

const r1 = n => Math.round(n * 10) / 10;
function azar(s) { let a = s >>> 0 || 1; return () => (a = (Math.imul(a, 1103515245) + 12345) >>> 0) / 4294967296; }

/* ---------- estaciones: cielo, luz y color del campo ---------- */
export const ESTACION = [
  { id: 'primavera', cielo: ['#8cc2e2', '#f5edd4'], sol: [318, 46, '#fff4c8', 1], lejos: '#a7b9c9', medio: '#8aa58c', hierba: '#93b25a', hierba2: '#7c9e48', campoA: '#b3cd6a', campoB: '#8fb050', surco: 'rgba(60,85,25,.32)', copa: '#4f7434', cipres: '#2f4a28', hoja: '#8db35a', flor: '#f4f0f6', suelo: '#cfbb8e', luz: ['#fff2c0', .1] },
  { id: 'verano', cielo: ['#74b3dc', '#f8ebc4'], sol: [206, 44, '#fffbe0', 1.3], lejos: '#adb7bf', medio: '#98a682', hierba: '#b0ab5c', hierba2: '#999a4c', campoA: '#e8c65a', campoB: '#d2a444', surco: 'rgba(120,80,20,.32)', copa: '#4f6a30', cipres: '#2c4423', hoja: '#93a240', suelo: '#d9c391', luz: ['#ffd27a', .08] },
  { id: 'otono', cielo: ['#b2bcc2', '#f2cd94'], sol: [80, 42, '#ffdca0', 1], lejos: '#a69c9a', medio: '#9a8f70', hierba: '#a39858', hierba2: '#8b8044', campoA: '#c58a46', campoB: '#9f6c38', surco: 'rgba(80,45,15,.36)', copa: '#55663a', cipres: '#2f4226', hoja: '#d07a2a', suelo: '#cdb284', luz: ['#f3a050', .07] },
  { id: 'invierno', cielo: ['#a2b3c2', '#e8eae8'], sol: [60, 50, '#f4f2ea', .6], lejos: '#dde3e9', medio: '#b6c0c3', hierba: '#c6cbbd', hierba2: '#b3baa8', campoA: '#eff1ec', campoB: '#dde2dc', surco: 'rgba(110,120,125,.32)', copa: '#45603c', cipres: '#2a3f2a', hoja: '#8e806c', suelo: '#dbd7c8', luz: ['#d6e4f2', .18], nieve: true },
];

/* ---------- piezas ---------- */
const ROJO = '#a3231a', TOBA = '#b89a6c', TOBA2 = '#8a6d48', MADERA = '#7a5228', TEJA = '#b5562f', TERRACOTA = '#cf7a3c', ESTUCO = '#e2d2aa';
const TINTA = '#3b2a16', OX = .55, OY = -.36;
const P = pts => 'M' + pts.map(([x, y]) => r1(x) + ' ' + r1(y)).join(' L') + 'Z';
const pol = (pts, f, s, w = .35) => `<path d="${P(pts)}" fill="${f}"${s ? ` stroke="${s}" stroke-width="${w}"` : ''}/>`;
const lin = (x1, y1, x2, y2, c, w = .5, ex = '') => `<path d="M${r1(x1)} ${r1(y1)} L${r1(x2)} ${r1(y2)}" stroke="${c}" stroke-width="${w}"${ex}/>`;
const elip = (x, y, rx, ry, f, ex = '') => `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${f}"${ex}/>`;
const rect = (x, y, w, h, f, ex = '') => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="${f}"${ex}/>`;
const MAT = {
  adobe: { f: '#cba878', l: '#9c7e52', t: '#b8994f', tl: '#7a6230' },
  madera: { f: '#9b6c3a', l: '#6e4b25', t: '#b0904c', tl: '#6e5528' },
  toba: { f: '#c9a877', l: '#94764a', t: '#b4552e', tl: '#76331a' },
  estuco: { f: '#f2e4c0', l: '#c9b28a', t: '#c4643a', tl: '#76331a', banda: ROJO, friso: '#2f5e6e' },
};
const hueco = m => Object.assign({}, m, { f: '#5a4229', banda: null });

/* caja en perspectiva caballera: x,y = centro del pie delantero; w ancho, h alto, d fondo.
   techo: 'dos' (a dos aguas, cumbrera paralela al frente), 'frente' (frontón hacia nosotros), 'plano' o nada */
function caja(x, y, w, h, d, m, techo, S) {
  const dx = d * OX, dy = d * OY, a = x - w / 2, b = x + w / 2, t = y - h, nv = S && S.nieve;
  const tf = nv ? '#f2f3ef' : m.t, tl = nv ? '#bfc8cc' : m.tl;
  let g = elip(x + dx / 2 + 2.5, y + dy / 2 + 1.4, w / 2 + d * .45 + 2, d * .32 + 1.8, 'rgba(45,30,12,.2)');
  g += pol([[b, y], [b + dx, y + dy], [b + dx, t + dy], [b, t]], m.l, TINTA) + pol([[a, y], [b, y], [b, t], [a, t]], m.f, TINTA);
  if (m.banda) g += lin(a, y - .9, b, y - .9, m.banda, 1.5) + lin(a, t + .9, b, t + .9, m.friso, 1.1);
  if (techo === 'dos') {
    const rh = d * .3 + 1.6, rx = dx / 2, ry = dy / 2 - rh;
    g += pol([[b, t], [b + dx, t + dy], [b + rx, t + ry]], m.l, TINTA) + pol([[a - 1, t + .5], [b + 1, t + .5], [b + rx + 1, t + ry], [a + rx - 1, t + ry]], tf, tl);
    for (let k = a + 1; k < b; k += 1.7) g += lin(k, t + .5, k + rx, t + ry, tl, .3, ' opacity=".6"');
  } else if (techo === 'frente') {
    const rh = Math.min(w * .22, 8);
    g += pol([[b + .8, t], [x, t - rh], [x + dx, t - rh + dy], [b + .8 + dx, t + dy]], tf, tl) + pol([[a - .8, t], [b + .8, t], [x, t - rh]], m.f, TINTA);
    for (let k = .2; k < 1; k += .2) g += lin(b + .8 - (b - x) * k, t - rh * k, b + .8 - (b - x) * k + dx, t - rh * k + dy, tl, .3);
  } else if (techo === 'plano') g += pol([[a, t], [b, t], [b + dx, t + dy], [a + dx, t + dy]], nv ? '#f2f3ef' : m.f, TINTA);
  return g;
}
const cols = (a, b, y, h, n, c, pie) => { let g = ''; for (let i = 0; i < n; i++) { const x = a + (b - a) * i / (n - 1); g += rect(x - .85, y - h, 1.7, h, c, ` stroke="${TINTA}" stroke-width=".22"`) + rect(x - 1.3, y - h, 2.6, .9, c) + (pie ? rect(x - .85, y - h * .32, 1.7, h * .32, pie) : ''); } return g; };
const antef = (a, b, y) => { let g = ''; for (let x = a; x <= b; x += 2.4) g += `<path d="M${r1(x - .9)} ${r1(y)} a.9 .9 0 0 1 1.8 0Z" fill="${TERRACOTA}"/>`; return g; };
const puerta = (x, y, w = 1.8, h = 3) => rect(x - w / 2, y - h, w, h, '#3c2914');
const ventana = (x, y) => rect(x - .6, y - .7, 1.2, 1.4, '#3c2914');
const persona = (x, y, c) => `<path d="M${r1(x - 1)} ${r1(y)} L${r1(x)} ${r1(y - 2.8)} L${r1(x + 1)} ${r1(y)}Z" fill="${c}"/><circle cx="${r1(x)}" cy="${r1(y - 3.3)}" r=".75" fill="#c98a5a"/>`;
const ROPA = ['#f1e8d2', ROJO, '#6b4a26', '#7d9a45', '#e8dcc0', '#4f6f78', '#c98a3a'];
const humo = (x, y) => `<path class="c8-humo" d="M${r1(x)} ${r1(y)} q-2 -3 0 -5 q2 -2.6 -.6 -5" fill="none" stroke="rgba(236,234,228,.42)" stroke-width="2.2" stroke-linecap="round"/>`;
const vexilo = (x, y, h = 10) => lin(x, y, x, y - h, '#3a2614', .6) + `<path d="M${r1(x)} ${r1(y - h + .6)} h4.4 v3.4 l-2.2 -1 l-2.2 1Z" fill="${ROJO}" stroke="#4a0d08" stroke-width=".2"/>` + `<circle cx="${r1(x)}" cy="${r1(y - h)}" r=".7" fill="#e2b13c"/>`;

/* árboles: pino piñonero (copa en sombrilla), ciprés, árbol de hoja (u olivo) */
const pino = (x, y, s, S) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><ellipse cx="3" cy=".4" rx="6" ry="1.5" fill="rgba(40,30,10,.22)"/><path d="M0 0 C.6 -4 -.8 -7 .8 -10.5 M.2 -7.6 L-3 -10 M.6 -8.6 L3.4 -10.6" stroke="#5a3d22" stroke-width="1" fill="none"/><ellipse cy="-11.4" rx="7.6" ry="2.9" fill="${S.copa}"/><ellipse cy="-10.6" rx="7" ry="1.8" fill="rgba(20,30,10,.3)"/><ellipse cx="-1.6" cy="-12.6" rx="4.4" ry="1.4" fill="#fff" opacity="${S.nieve ? .8 : .18}"/></g>`;
const cipres = (x, y, s, S) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><ellipse cx="2" cy=".3" rx="3" ry=".9" fill="rgba(40,30,10,.22)"/><path d="M0 -16 C2.8 -10 3 -4 0 -1 C-3 -4 -2.8 -10 0 -16Z" fill="${S.cipres}"/><path d="M0 -16 C-2.8 -10 -3 -4 0 -1Z" fill="#fff" opacity="${S.nieve ? .45 : .14}"/></g>`;
const arbol = (x, y, s, S, c) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><ellipse cx="2" cy=".3" rx="4" ry="1" fill="rgba(40,30,10,.22)"/><path d="M0 0 V-4" stroke="#5a3d22" stroke-width=".9"/><circle cy="-6" r="3.4" fill="${c || S.hoja}"/><circle cx="2.4" cy="-4.6" r="2.4" fill="${c || S.hoja}"/><circle cx="-1" cy="-7" r="1.6" fill="#fff" opacity="${S.nieve ? .6 : .15}"/></g>`;
const ARB = [pino, cipres, arbol];

/* barcas y naves */
const barca = (x, y, s = 1, vela) => `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><ellipse cy="1.4" rx="8" ry="1.3" fill="rgba(20,40,40,.25)"/><path d="M-7 -1 Q0 3 7 -1 L6 -2.4 H-6Z" fill="#6b4520" stroke="#2e1d0c" stroke-width=".35"/>${vela ? `<path d="M0 -2.4 V-13" stroke="#2e1d0c" stroke-width=".5"/><path d="M-4.4 -12 H4.4 L4 -4 H-4Z" fill="#efe3c6" stroke="#7a6444" stroke-width=".3"/>` : `<circle cx="1" cy="-3.6" r=".8" fill="#c98a5a"/><path d="M0 -2.4 L1 -3 2 -2.4Z" fill="#8a5a30"/><path d="M-1 -2.6 L-5 1.4" stroke="#4a3119" stroke-width=".45"/>`}</g>`;
function nave(x, y, s) {
  let g = `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})"><ellipse cy="2.4" rx="22" ry="2" fill="rgba(20,40,40,.28)"/><path d="M-19 -1 Q0 4 19 -1 L16 -4 H-17 L-20 -6Z" fill="#4e3317" stroke="#24160a" stroke-width=".5"/><path d="M19 -.8 l6 1.4 -6 1z" fill="#a8803a"/><circle cx="14" cy="-2" r=".8" fill="#e8d8b0"/>`;
  for (let k = 0; k < 3; k++) for (let c = -14; c <= 10; c += 4) g += lin(c + k, 1 + k * .6, c + k - 1.6, 4 - k * .2, '#24160a', .4);
  for (let c = -13; c <= 11; c += 3.2) g += `<circle cx="${r1(c)}" cy="-4.6" r="1.1" fill="${c % 2 ? ROJO : '#c9a64a'}"/>`;
  return g + `<path d="M1 -4 V-20" stroke="#24160a" stroke-width=".9"/><path d="M-6 -19 H8 L7 -7 H-5Z" fill="#efe6cf" stroke="#7a6444" stroke-width=".35"/><path d="M-5.6 -13 H7.6" stroke="${ROJO}" stroke-width="1.6"/></g>`;
}

/* solar con estacas y cuerda (nivel 0) */
function estacas(x, y, w, d) {
  const dx = d * OX, dy = d * OY, c = [[x - w / 2, y], [x + w / 2, y], [x + w / 2 + dx, y + dy], [x - w / 2 + dx, y + dy]];
  return pol(c, 'rgba(120,90,50,.2)') + `<path d="${P(c)}" fill="none" stroke="#efe4c8" stroke-width=".45" stroke-dasharray="1.4 .8"/>` + c.map(([a, b]) => lin(a, b + .6, a, b - 3.4, MADERA, 1)).join('') + `<g fill="#a89070">${[[0, 0], [1.8, .3], [.9, -1.1]].map(([a, b]) => elip(x + a + 2, y + dy / 2 + b, 1.2, .8, '#a89070')).join('')}</g>`;
}

/* obra: andamio de madera y grúa de dos mástiles con polipasto y rueda de pisar */
function obra(x, y, w, h) {
  const a = x - w / 2, b = x + w / 2, top = y - h - 3, M = '#6e4a22';
  let g = '<g class="c8-obra" pointer-events="none">';
  for (let i = 0; i <= 3; i++) g += lin(a + w * i / 3, y, a + w * i / 3, top, M, .9);
  for (let k = 1; k <= 3; k++) g += lin(a - 1.5, y - (h + 3) * k / 3, b + 1.5, y - (h + 3) * k / 3, '#b0844c', 1.2);
  g += lin(a, y, a + w / 3, top, M, .4) + lin(b - w / 3, y, b, top, M, .4);
  const ax = b - 3, ay = top - 15, sy = top - 3;
  g += `<path d="M${r1(b + 2)} ${r1(y)} L${r1(ax)} ${r1(ay)} L${r1(b + 9)} ${r1(y)}" fill="none" stroke="#5a3a18" stroke-width="1.5" stroke-linejoin="round"/>` + lin(ax, ay, b + 20, y, '#3a2a14', .35);
  g += lin(ax, ay, ax, sy - 2.6, '#2a1d0e', .45) + lin(ax + .8, ay, ax + .8, sy - 2.6, '#2a1d0e', .35) + `<circle cx="${r1(ax)}" cy="${r1(ay)}" r="1.3" fill="#4a3119"/>` + rect(ax - 1, sy - 3.4, 2.4, 1.6, '#4a3119') + rect(ax - 2.6, sy - 1.8, 5.2, 3.4, TOBA, ` stroke="${TINTA}" stroke-width=".3"`);
  g += lin(ax, ay, b + 13, y - 5, '#2a1d0e', .4) + `<circle cx="${r1(b + 13)}" cy="${r1(y - 5)}" r="5" fill="none" stroke="#5a3a18" stroke-width="1.1"/>` + [0, 60, 120].map(k => `<path d="M${r1(b + 8)} ${r1(y - 5)} h10" stroke="#5a3a18" stroke-width=".4" transform="rotate(${k} ${r1(b + 13)} ${r1(y - 5)})"/>`).join('') + persona(b + 13, y - 1.4, '#e8dcc0') + persona(a + w / 3 + 2, y - (h + 3) * 2 / 3, '#8a5a30');
  return g + '</g>';
}

/* ---------- geografía ---------- */
const CX = 272, CY = 200, RX = 120, RY = 86, PUERTA = 1.22;
const pe = (t, k = 1) => [CX + RX * k * Math.cos(t), CY + RY * k * Math.sin(t)];
const RIO = 'M64 78 C44 110 20 140 26 178 C32 214 104 224 100 260 C96 292 52 302 34 330';
// dónde se señala cada sitio (aro y etiqueta) y su área tocable [x, y, rx, ry]
export const SITIO = { foro: [252, 194], templo: [184, 132], mercado: [212, 240], muelle: [122, 254], cuartel: [96, 132], granja: [322, 92], muralla: [310, 274], campo: [98, 190], plebe: [332, 220], tiber: [44, 226] };
const TOQUE = { foro: [254, 200, 42, 20], templo: [184, 140, 28, 24], mercado: [212, 244, 30, 15], muelle: [120, 262, 28, 17], cuartel: [96, 138, 44, 22], granja: [322, 98, 76, 13], muralla: [310, 280, 26, 15] };
const OBRA = { foro: [240, 200, 30, 16], templo: [184, 152, 26, 22], mercado: [212, 251, 26, 10], muelle: [136, 262, 20, 10], cuartel: [96, 140, 20, 12], granja: [330, 98, 16, 8], muralla: [348, 268, 14, 10] };
const MONTES = [[182, 172, 34, 20], [262, 134, 46, 8], [350, 172, 38, 12], [264, 262, 36, 11], [340, 252, 30, 9]];
const LIBRE = [[252, 202, 46, 17], [184, 158, 34, 22], [212, 250, 32, 13], [310, 280, 24, 14], [184, 132, 18, 16]];
const CASAS = (() => {
  const r = azar(264), out = [];
  for (let n = 0; n < 4000 && out.length < 120; n++) {
    const t = r() * Math.PI * 2, q = Math.sqrt(r()) * .9, x = CX + RX * q * Math.cos(t), y = CY + RY * q * Math.sin(t) + 5;
    if (LIBRE.some(([a, b, rx, ry]) => ((x - a) / rx) ** 2 + ((y - b) / ry) ** 2 < 1) || out.some(p => Math.abs(p[0] - x) < 9.5 && Math.abs(p[1] - y) < 6.5)) continue;
    out.push([r1(x), r1(y), r()]);
  }
  return out.sort((a, b) => Math.hypot(a[0] - 252, (a[1] - 205) * 1.4) - Math.hypot(b[0] - 252, (b[1] - 205) * 1.4));
})();
function casa(x, y, h, i, plebe, S) {
  const p = plebe / 100;
  let g;
  if (h < .1 + .2 * p && i > 6) g = caja(x, y, 7, 12, 6, h < .1 ? MAT.estuco : MAT.toba, 'dos', S) + [3.2, 6.6, 10].map(k => ventana(x - 1.8, y - k) + ventana(x + 1.8, y - k)).join('');
  else if (h < .5 - .25 * p) g = caja(x, y, 7, 4.4, 5, MAT.adobe, 'dos', S) + puerta(x, y, 1.6, 2.6);
  else if (h < .82) g = caja(x, y, 8, 5.6, 6, MAT.toba, 'dos', S) + puerta(x - 1, y) + ventana(x + 2, y - 3.6);
  else g = caja(x, y, 11, 5, 8, MAT.estuco, 'dos', S) + puerta(x, y, 2, 3.2) + ventana(x - 3.4, y - 3) + ventana(x + 3.4, y - 3);
  if ((h * 1000 | 0) % (S.nieve ? 5 : 9) === 0) g += humo(x + 2.6, y - 9);
  return g;
}

/* ---------- los siete edificios: (nivel, estación, edad) -> SVG; x,y fijos ---------- */
function foro(n, S, edad) {
  const x = 252, y = 208, w = 70, d = 28, dx = d * OX, dy = d * OY;
  const pl = [[x - w / 2, y], [x + w / 2, y], [x + w / 2 + dx, y + dy], [x - w / 2 + dx, y + dy]];
  if (!n) return estacas(x, y, 44, 20);
  let g = pol(pl, n === 1 ? '#bfa57a' : n === 2 ? '#d3c39c' : '#e0d4b2', '#8a7350', .5);
  if (n > 1) for (let k = 1; k < 6; k++) g += lin(x - w / 2 + w * k / 6, y, x - w / 2 + w * k / 6 + dx, y + dy, 'rgba(110,90,60,.35)', .3) + (k < 4 ? lin(x - w / 2 + dx * k / 4, y + dy * k / 4, x + w / 2 + dx * k / 4, y + dy * k / 4, 'rgba(110,90,60,.35)', .3) : '');
  if (n === 1) {
    g += caja(x - 16, y - 12, 14, 7, 8, MAT.adobe, 'dos', S) + puerta(x - 16, y - 12, 2.4, 3.6) + humo(x - 6, y - 24);
    for (const [a, b, c] of [[x + 8, y - 5, '#c9b07a'], [x + 22, y - 3, '#a3231a']]) g += lin(a - 4, b, a - 4, b - 6, MADERA, .7) + lin(a + 4, b, a + 4, b - 6, MADERA, .7) + pol([[a - 5, b - 6], [a + 5, b - 6], [a + 4, b - 8], [a - 4, b - 8]], c) + elip(a, b - 1, 3, 1, '#7d9a45');
  } else {
    const m = n === 3 ? MAT.estuco : MAT.toba;
    if (n === 3) g += caja(x + 10, y - 14, 46, 10, 6, hueco(m), 'dos', S) + cols(x - 12, x + 32, y - 14, 10, 9, '#f3e8c8', ROJO) + antef(x - 13, x + 33, y - 24.4);
    else g += caja(x + 12, y - 14, 34, 6, 5, MAT.toba, 'dos', S) + [0, 1, 2, 3, 4].map(k => `<path d="M${x + k * 6.4} ${y - 14} v-3.4 a1.3 1.3 0 0 1 2.6 0 v3.4Z" fill="#3c2914"/>`).join('');
    g += caja(x - 20, y - 10, n === 3 ? 20 : 15, n === 3 ? 14 : 10, 10, m, 'frente', S) + puerta(x - 20, y - 10, 3, 5);
    if (n === 3) g += antef(x - 31, x - 9, y - 24) + `<path d="M${x - 24} ${y - 26} L${x - 20} ${y - 28.6} L${x - 16} ${y - 26}Z" fill="#2f5e6e"/>`;
    g += elip(x - 18, y - 3, 9, 3, 'rgba(120,95,60,.35)') + elip(x - 18, y - 3, 6, 2, n === 3 ? '#d7c79f' : '#c7b48a', ` stroke="#8a7350" stroke-width=".4"`);
    g += caja(x + 4, y - 2, 10, 2.4, 4, m, 'plano', S) + [x + 1, x + 7].map(k => `<path d="M${k} ${y - 4.4} l-1.6 -.8 v1.6Z" fill="#5a3a18"/>`).join('');
    g += rect(x + 24, y - 16, 2, 12, n === 3 ? '#f3e8c8' : TOBA, ` stroke="${TINTA}" stroke-width=".25"`) + persona(x + 25, y - 16, n === 3 ? '#cf7a3c' : '#8a6d48');
    if (n === 3 || edad > 1) g += vexilo(x - 30, y - 1, 13) + vexilo(x + 33, y - 1, 13);
  }
  for (let i = 0; i < 4 + n * 4; i++) { const k = (i * 0.618) % 1, j = (i * 0.37) % 1; g += persona(x - 28 + k * 56 + j * dx, y - 1 + j * dy, ROPA[i % 7]); }
  return g;
}
function templo(n, S, edad) {
  const x = 184, y = 156;
  if (!n) return estacas(x, y, 22, 14) + caja(x - 2, y + 6, 4, 2.4, 3, MAT.toba, 'plano', S);
  let g = '';
  if (n === 1) g += caja(x, y, 13, 8, 9, MAT.madera, 'frente', S) + puerta(x, y, 3, 5) + cols(x - 5.6, x + 5.6, y, 8, 2, '#8a5a30');
  else if (n === 2) g += caja(x, y + 1, 26, 3.4, 16, MAT.toba, 'plano', S) + caja(x, y - 2.4, 20, 11, 13, hueco(MAT.toba), 'frente', S) + cols(x - 8.6, x + 8.6, y - 2.4, 11, 4, '#c9a877') + antef(x - 10, x + 10, y - 13.4);
  else {
    g += caja(x, y + 2, 38, 5, 20, MAT.toba, 'plano', S) + [1, 2, 3].map(k => lin(x - 7 + k, y + 2 - k * 1.6, x + 7 - k, y + 2 - k * 1.6, '#8a6d48', .5)).join('');
    g += caja(x, y - 3, 32, 15, 16, hueco(MAT.estuco), 'frente', S) + cols(x - 14.4, x + 14.4, y - 3, 15, 6, '#f3e8c8', ROJO);
    g += `<path d="M${x - 12} ${y - 19.4} L${x + 12} ${y - 19.4} L${x} ${y - 24.6}Z" fill="#2f5e6e"/>` + [-6, 0, 6].map(k => `<circle cx="${x + k}" cy="${y - 20.6}" r="1" fill="${TERRACOTA}"/>`).join('') + antef(x - 16, x + 16, y - 18.2);
    g += `<g fill="${TERRACOTA}" stroke="#7a3518" stroke-width=".25"><path d="M${x - 4} ${y - 25.6} l1 -2.6 h4.6 l1.4 -1.6 .6 1.2 -1 .8 v2.2Z"/><path d="M${x + 1.6} ${y - 25.6} l1.6 -3.6 h1 l-.8 3.6Z"/></g>` + `<circle cx="${x - 17}" cy="${y - 20}" r="1.1" fill="${TERRACOTA}"/><circle cx="${x + 17}" cy="${y - 20}" r="1.1" fill="${TERRACOTA}"/>`;
  }
  g += caja(x - 4, y + 9, 4, 2.6, 3, MAT.toba, 'plano', S) + `<path d="M${x - 4.4} ${y + 6.2} q1 -2 2 0" fill="#f3a03a"/>` + humo(x - 3.4, y + 5) + persona(x + 2, y + 10, '#f1e8d2') + persona(x + 5, y + 10.4, ROJO);
  if (n > 1 && edad > 1) g += vexilo(x - 18, y + 4, 12) + vexilo(x + 20, y + 4, 12);
  return g;
}
function mercado(n, S) {
  const x = 212, y = 252;
  if (!n) return estacas(x, y, 30, 12);
  let g = '';
  const puesto = (a, b, c) => lin(a - 4, b, a - 4, b - 5.5, MADERA, .7) + lin(a + 4, b, a + 4, b - 5.5, MADERA, .7) + pol([[a - 5, b - 5.5], [a + 5, b - 5.5], [a + 4, b - 8], [a - 4, b - 8]], c, '#5a3a18', .25) + lin(a - 3, b - 7, a + 3, b - 7, '#f3ead6', .8, ' stroke-dasharray="1 1"') + rect(a - 4, b - 2.4, 8, 2.4, '#8a6034') + [[-2, '#d9a43a'], [0, '#7d9a45'], [2, ROJO]].map(([k, c2]) => elip(a + k, b - 2.8, 1, .7, c2)).join('');
  if (n === 1) g += puesto(x - 12, y, '#c9a87a') + puesto(x, y - 3, ROJO) + puesto(x + 12, y, '#d9c79a');
  else if (n === 2) { g += caja(x, y - 2, 40, 8, 6, MAT.toba, 'dos', S) + [0, 1, 2, 3, 4, 5].map(k => `<path d="M${r1(x - 17 + k * 6.6)} ${y - 2} v-4 a1.6 1.6 0 0 1 3.2 0 v4Z" fill="#3c2914"/>`).join(''); g += puesto(x - 10, y + 4, '#c9a87a') + puesto(x + 10, y + 4, ROJO); }
  else {
    g += caja(x, y - 6, 48, 15, 7, hueco(MAT.estuco), 'dos', S) + cols(x - 22, x + 22, y - 6, 7.4, 9, '#f3e8c8', ROJO) + lin(x - 24, y - 13.6, x + 24, y - 13.6, '#2f5e6e', 1.2) + [-18, -10, -2, 6, 14].map(k => ventana(x + k + 2, y - 17.6)).join('') + antef(x - 24, x + 24, y - 21.4);
    g += elip(x, y + 4, 7, 2.2, 'rgba(45,30,12,.25)') + rect(x - 6, y - 4, 12, 7, '#f2e4c0', ` stroke="${TINTA}" stroke-width=".3"`) + cols(x - 5, x + 5, y + 3, 7, 5, '#f8efd6', ROJO) + `<path d="M${x - 7} ${y - 4} L${x} ${y - 10} L${x + 7} ${y - 4}Z" fill="${S.nieve ? '#f2f3ef' : MAT.estuco.t}" stroke="#76331a" stroke-width=".3"/>`;
    g += puesto(x - 17, y + 5, '#c9a87a') + puesto(x + 17, y + 5, ROJO);
  }
  for (let i = 0; i < 3 + n * 3; i++) g += persona(x - 20 + (i * 7.3) % 40, y + 3 + (i % 3) * 1.6, ROPA[(i + 2) % 7]);
  return g;
}
function muelle(n, S) {
  const x = 126, y = 264;
  if (!n) return estacas(x + 6, y, 18, 10) + lin(x - 6, y + 2, x - 6, y - 8, MADERA, 1);
  let g = '';
  g += pol([[x - 2, y], [x - 26, y + 5], [x - 27, y + 2], [x - 3, y - 3]], '#8a6034', '#3a2614') + [6, 12, 18, 24].map(k => lin(x - 2 - k, y + k * .2, x - 2 - k, y + k * .2 + 3, '#3a2614', .8)).join('');
  if (n > 1) g += pol([[x - 4, y + 4], [x + 30, y + 2], [x + 30, y - 2], [x - 4, y]], '#a88d64', '#5e4a30') + caja(x + 14, y - 1, 20, 8, 8, MAT.toba, 'dos', S) + [0, 1, 2].map(k => puerta(x + 8 + k * 6, y - 1, 2, 4)).join('');
  if (n > 2) g += caja(x + 20, y - 10, 30, 10, 7, hueco(MAT.estuco), 'dos', S) + cols(x + 7, x + 33, y - 10, 10, 6, '#f3e8c8', ROJO) + antef(x + 5, x + 35, y - 21.2) + `<path d="M${x - 6} ${y} L${x - 2} ${y - 16} L${x + 1} ${y}" fill="none" stroke="#5a3a18" stroke-width="1.2"/>` + lin(x - 2, y - 16, x - 8, y - 6, '#2a1d0e', .4) + rect(x - 9.4, y - 6, 3, 2.4, '#b8693a');
  g += `<g fill="#b8693a" stroke="#5e2c10" stroke-width=".25">${[[2, -2], [4, -2.4], [3, -4.2], [6, -1.6], [8, -2.2]].slice(0, n + 2).map(([a, b]) => elip(x + a, y + b, .9, 1.5, '#b8693a')).join('')}</g>`;
  const B = [[x - 20, y + 9, 0], [x - 34, y + 1, 1], [x - 36, y + 16, 0], [x - 46, y + 8, 1]];
  g += B.slice(0, n + (n > 2 ? 1 : 0)).map(([a, b, v]) => barca(a, b, 1, v)).join('');
  for (let i = 0; i < n * 2; i++) g += persona(x - 8 + i * 4.4, y - 1 + (i % 2), ROPA[(i + 4) % 7]);
  return g;
}
function cuartel(n, S, edad) {
  const x = 96, y = 142;
  if (!n) return estacas(x, y, 40, 20);
  let g = '';
  if (n > 1) { const c = [[x - 40, y + 14], [x + 34, y + 14], [x + 44, y - 6], [x - 30, y - 6]]; g += `<path d="${P(c)}" fill="rgba(160,130,80,.18)" stroke="#6e4a22" stroke-width="1.2" stroke-dasharray=".8 .7"/>`; }
  const T = []; for (let f = 0; f < 3; f++) for (let k = 0; k < 6; k++) T.push([x - 30 + k * 11 + f * 5, y - 2 + f * 6]);
  const tienda = (a, b) => pol([[a - 4, b], [a, b - 5], [a + 1.6, b]], '#f4ecd6', '#6e5838', .3) + pol([[a, b - 5], [a + 6, b - 6.2], [a + 7.4, b - 1.2], [a + 1.6, b]], '#cdbd98', '#6e5838', .3) + pol([[a - 1, b], [a, b - 2.6], [a + .7, b]], '#5a4024');
  g += T.slice(0, n === 1 ? 6 : n === 2 ? 12 : 18).map(([a, b]) => tienda(a, b)).join('');
  if (n > 1) g += caja(x + 40, y + 8, 5, 16, 5, MAT.madera, 'plano', S) + vexilo(x + 41, y - 8, 7) + humo(x - 34, y + 6);
  if (n > 2) g += caja(x - 4, y - 8, 18, 8, 8, MAT.estuco, 'dos', S) + puerta(x - 4, y - 8, 2.4, 4) + caja(x - 34, y + 12, 5, 14, 5, MAT.madera, 'plano', S) + vexilo(x - 33, y - 2, 7) + [0, 1, 2].map(k => lin(x + 20 + k * 4, y + 12, x + 20 + k * 4, y + 8, MADERA, .9)).join('');
  if (edad > 1) g += vexilo(x + 2, y - 18, 10);
  return g;
}
function granja(n, S) {
  let g = '';
  const F = [[332, 99], [268, 95], [384, 104]];
  for (let i = 0; i < Math.max(1, n); i++) {
    const [x, y] = F[i];
    if (!n) { g += estacas(x, y, 16, 8); continue; }
    const t = n - i;
    g += `<path d="M${x - 12} ${y + 1} h22 l3 -5 h-22Z" fill="none" stroke="#7a5a30" stroke-width=".5" stroke-dasharray="1 .6"/>`;
    if (t >= 3) g += caja(x, y, 18, 7, 8, MAT.estuco, 'dos', S) + cols(x - 7.6, x + 7.6, y, 4.4, 5, '#f3e8c8') + caja(x + 13, y - 2, 7, 6, 5, MAT.toba, 'dos', S);
    else if (t === 2) g += caja(x, y, 12, 6, 7, MAT.toba, 'dos', S) + puerta(x - 2, y) + caja(x + 10, y - 1, 7, 4, 4, MAT.adobe, 'dos', S);
    else g += caja(x, y, 8, 4.4, 5, MAT.adobe, 'dos', S) + puerta(x, y, 1.6, 2.6);
    if (!S.nieve && S.id !== 'primavera') g += `<path d="M${x - 11} ${y} q2 -6 4 0z" fill="#d9b04a" stroke="#8a6a20" stroke-width=".3"/>`;
    g += humo(x + 2, y - 8) + elip(x - 16, y + 2, 1.8, .9, '#6b4a26') + persona(x - 20, y + 3, '#e8dcc0');
    if (t >= 3) g += [0, 1, 2, 3].map(k => arbol(x + 20 + k * 4, y + 2 - k * .6, .5, S, '#7d8f5a')).join('');
  }
  return g;
}
function campos(n, S) {
  // parcelas del Lacio en abanico (perspectiva): más cultivadas cuanto mayor la granja
  let g = '', k = 0;
  const filas = [[82, 89], [89, 98], [98, 112]];
  for (let f = 0; f < 3; f++) {
    const [y0, y1] = filas[f]; let x = -16 + f * 9;
    while (x < 404) {
      const w = 20 + ((k * 37) % 19) + f * 6, h = ((k * 0.618 + f * .3) % 1), cult = x > 150 ? h < .3 + n * .22 : h < .55;
      const sk = v => v + (v - 200) * (y1 - y0) / 110, c = !cult ? S.hierba2 : k % 2 ? S.campoA : S.campoB;
      g += pol([[x, y0], [x + w, y0], [sk(x + w), y1], [sk(x), y1]], c, 'rgba(70,60,30,.35)', .35);
      if (cult) for (let s = 3; s < w; s += 3.4) g += lin(x + s, y0, sk(x + s), y1, S.surco, .35);
      else if (n > 1 && x > 220 && (k % 3 === 0)) for (let s = 2; s < w; s += 3) g += lin(x + s, y0 + 1, sk(x + s), y1 - 1, '#5f6e2c', .8, ' stroke-dasharray=".8 .9"');
      x += w; k++;
    }
  }
  for (let x = 6; x < 400; x += 26) g += cipres(x + (x * 7) % 9, 89 + (x % 3) * 1.4, .45, S);
  return g;
}
/* muralla Serviana: tramo de atrás (cara interior) o de delante (cara exterior) */
function muro(n, frente, S, edad) {
  const hw = [1.6, 4.2, 7, 10][n], N = 44, t0 = frente ? 0 : Math.PI, nv = S.nieve;
  let g = '';
  for (let i = 0; i < N; i++) {
    const ta = t0 + Math.PI * i / N, tb = t0 + Math.PI * (i + 1) / N, tm = (ta + tb) / 2;
    if (frente && Math.abs(tm - PUERTA) < .08) continue;
    const [x1, y1] = pe(ta), [x2, y2] = pe(tb);
    if (!n) { g += lin(x1, y1, x2, y2, '#9a7a4a', 3, ' stroke-linecap="round"') + (i % 4 ? '' : lin(x1, y1, x1, y1 - 3, MADERA, .8)); continue; }
    const c = n === 1 ? '#8a6236' : frente ? '#c4a473' : '#a88d64', sh = frente ? Math.max(0, Math.cos(tm)) * .3 : .12;
    g += pol([[x1, y1], [x2, y2], [x2, y2 - hw], [x1, y1 - hw]], c, frente ? TINTA : null, .25) + (sh ? pol([[x1, y1], [x2, y2], [x2, y2 - hw], [x1, y1 - hw]], `rgba(40,25,10,${r1(sh * 10) / 10})`) : '');
    if (n === 1) g += lin(x1, y1, x1, y1 - hw - 1.2, '#5a3a18', .6) + lin((x1 + x2) / 2, (y1 + y2) / 2, (x1 + x2) / 2, (y1 + y2) / 2 - hw - 1.2, '#5a3a18', .6);
    else { g += lin(x1, y1 - hw * .5, x2, y2 - hw * .5, 'rgba(60,40,20,.35)', .3) + lin(x1, y1 - hw, x2, y2 - hw, nv ? '#f4f5f1' : '#d8c08e', 1); if (n === 3 && i % 2) g += rect(x1 - .9, y1 - hw - 1.8, 1.8, 1.8, '#b89a6c', ` stroke="${TINTA}" stroke-width=".2"`); }
  }
  if (n >= 2) {
    const TT = frente ? (n === 3 ? [.25, .7, 1.85, 2.3, 2.75] : [.5, 2.3]) : (n === 3 ? [3.5, 3.95, 4.4, 4.85, 5.3, 5.75] : [3.8, 4.6, 5.5]);
    for (const t of TT) { const [x, y] = pe(t); g += caja(x, y, 7, hw + 6, 6, MAT.toba, n === 3 ? 'dos' : 'plano', S) + ventana(x, y - hw - 2.6) + (edad > 1 && frente ? vexilo(x + 2, y - hw - 9, 7) : ''); }
  }
  if (frente) {
    const [x, y] = pe(PUERTA);
    if (!n) g += lin(x - 5, y, x - 5, y - 5, MADERA, 1.2) + lin(x + 5, y, x + 5, y - 5, MADERA, 1.2);
    else if (n === 1) g += lin(x - 6, y + 1, x - 6, y - 9, '#5a3a18', 1.4) + lin(x + 6, y + 1, x + 6, y - 9, '#5a3a18', 1.4) + lin(x - 7.5, y - 8.5, x + 7.5, y - 8.5, '#5a3a18', 1.6) + rect(x - 5, y - 7, 4.6, 7, '#8a6236', ` stroke="${TINTA}" stroke-width=".3"`);
    else {
      const w = n === 3 ? 26 : 18, h = hw + (n === 3 ? 9 : 6);
      g += caja(x, y + 2, w, h, 8, n === 3 ? MAT.estuco : MAT.toba, n === 3 ? 'dos' : 'plano', S) + `<path d="M${x - 3.4} ${y + 2} v-5.6 a3.4 3.4 0 0 1 6.8 0 v5.6Z" fill="#2c1e0e"/>`;
      if (n === 3) g += `<path d="M${x - 10} ${y + 2} v-4 a2 2 0 0 1 4 0 v4Z M${x + 6} ${y + 2} v-4 a2 2 0 0 1 4 0 v4Z" fill="#2c1e0e"/>` + antef(x - 13, x + 13, y + 1.6 - h);
      if (edad > 1) g += vexilo(x - w / 2 + 1, y + 2 - h, 9) + vexilo(x + w / 2 - 1, y + 2 - h, 9);
    }
    g += persona(x - 1, y + 6, '#8a6d48') + persona(x + 3, y + 7, '#f1e8d2');
  }
  return g;
}
function legion(x, y) {
  let g = elip(x + 3, y + 1.2, 12, 3.2, 'rgba(40,25,10,.22)');
  for (let f = 0; f < 3; f++) for (let c = 0; c < 5; c++) { const px = x - 8 + c * 3.4 + f * 1.3, py = y - 4.4 + f * 2.5; g += rect(px - 1, py - 2.6, 2, 2.6, ROJO, ' stroke="#4a0d08" stroke-width=".2"') + `<circle cx="${r1(px)}" cy="${r1(py - 3.1)}" r=".7" fill="#9aa0a0"/>`; }
  return g + vexilo(x + 10, y + 1, 12);
}

const ESTILO = '<style>.c8-aro{transform-box:fill-box;transform-origin:center;animation:c8a 1.8s ease-out infinite}@keyframes c8a{0%{transform:scale(.7);opacity:1}100%{transform:scale(2.1);opacity:0}}.c8-humo{animation:c8h 4s ease-in-out infinite alternate}@keyframes c8h{to{transform:translate(1.5px,-2px);opacity:.3}}.c8-brillo{transform-box:fill-box;transform-origin:center;animation:c8b 1.2s ease-in-out infinite alternate}@keyframes c8b{from{opacity:.35;transform:scale(.85)}to{opacity:1;transform:scale(1.1)}}.edif{cursor:pointer}@media (prefers-reduced-motion:reduce){.c8-aro,.c8-humo,.c8-brillo{animation:none}}</style>';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sierra = (y0, amp, f, ph) => { let d = `M-4 ${y0 + 20}`; for (let x = -4; x <= 404; x += 8) d += ` L${x} ${r1(y0 - amp * (.55 + .45 * Math.sin(x * f + ph)) * (.65 + .35 * Math.sin(x * f * 2.7 + ph * 1.9)))}`; return d + ` L404 ${y0 + 20}Z`; };

/* ---------- la ciudad ----------
   v = {edif:{foro,granja,mercado,muelle,cuartel,templo,muralla} (0–3), legiones, edad, estacion, obras:[ids], plebe 0–100}
   opciones = {marcas:[{sitio, texto}], nuevo:[ids con destello], sel: id}. Devuelve el SVG (texto). */
export function ciudad(v = {}, opciones = {}) {
  const S = ESTACION.find(s => s.id === v.estacion) || ESTACION[0], edad = v.edad || 1, plebe = Math.max(0, Math.min(100, v.plebe ?? 50));
  const E = {}; for (const k of Object.keys(TOQUE)) E[k] = Math.max(0, Math.min(3, (v.edif || {})[k] | 0));
  const obras = v.obras || [], { marcas = [], nuevo = [], sel = null } = opciones;
  const [sx, sy, sc, sr] = S.sol;
  let g = `${ESTILO}<defs><linearGradient id="c8-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.cielo[0]}"/><stop offset="1" stop-color="${S.cielo[1]}"/></linearGradient>
<radialGradient id="c8-sol"><stop offset="0" stop-color="${sc}"/><stop offset=".4" stop-color="${sc}" stop-opacity=".5"/><stop offset="1" stop-color="${sc}" stop-opacity="0"/></radialGradient>
<linearGradient id="c8-rio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${S.nieve ? '#9fb4b6' : '#86aaa4'}"/><stop offset="1" stop-color="#4c7472"/></linearGradient>
<linearGradient id="c8-bruma" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.cielo[1]}" stop-opacity="0"/><stop offset="1" stop-color="${S.cielo[1]}" stop-opacity=".75"/></linearGradient>
<linearGradient id="c8-llano" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.hierba2}"/><stop offset="1" stop-color="${S.hierba}"/></linearGradient>
<radialGradient id="c8-monte" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fffbe0" stop-opacity=".45"/><stop offset=".6" stop-color="#fffbe0" stop-opacity="0"/><stop offset="1" stop-color="#3a2810" stop-opacity=".28"/></radialGradient>
<linearGradient id="c8-luz" x1="${sx < 200 ? 0 : 1}" y1="0" x2="${sx < 200 ? 1 : 0}" y2=".6"><stop offset="0" stop-color="${S.luz[0]}" stop-opacity="${S.luz[1] * 2}"/><stop offset="1" stop-color="${S.luz[0]}" stop-opacity="0"/></linearGradient>
<radialGradient id="c8-vin" cx=".5" cy=".55" r=".75"><stop offset=".6" stop-color="#2a1a08" stop-opacity="0"/><stop offset="1" stop-color="#2a1a08" stop-opacity=".22"/></radialGradient></defs>`;
  // cielo, sol, nubes y aves
  g += `<rect width="400" height="320" fill="url(#c8-cielo)"/><circle cx="${sx}" cy="${sy}" r="${r1(34 * sr)}" fill="url(#c8-sol)"/><circle cx="${sx}" cy="${sy}" r="${r1(7 * sr + 3)}" fill="${sc}"/>`;
  for (const [cx, cy, s] of [[96, 42, 1], [250, 36, 1.2], [360, 50, .8], [170, 54, .6]]) g += `<g transform="translate(${cx} ${cy}) scale(${s})" opacity="${S.nieve ? .95 : .85}"><ellipse cx="0" cy="2" rx="26" ry="4" fill="${S.nieve ? '#d8dcdf' : '#e9e6e0'}"/><ellipse cx="-8" cy="-1" rx="10" ry="5" fill="#fff"/><ellipse cx="5" cy="-3" rx="12" ry="7" fill="#fff"/><ellipse cx="16" cy="0" rx="8" ry="4" fill="#fff"/></g>`;
  if (!S.nieve) g += [[130, 50], [138, 46], [146, 52]].map(([a, b]) => `<path d="M${a - 2.4} ${b - 1} q1.2 -1 2.4 0 q1.2 -1 2.4 0" fill="none" stroke="#4a4038" stroke-width=".6"/>`).join('');
  // tres capas de montes (Sabinos y Albanos) con bruma; nieve en lo alto en invierno
  g += S.nieve ? `<path d="${sierra(58, 18, .021, 1)}" fill="#fbfbf8"/><path d="${sierra(58, 18, .021, 1)}" fill="${S.lejos}" transform="translate(0 5)"/>` : `<path d="${sierra(58, 18, .021, 1)}" fill="${S.lejos}"/>`;
  g += `<rect y="40" width="400" height="40" fill="url(#c8-bruma)"/><path d="${sierra(72, 11, .034, 4)}" fill="${S.medio}"/><rect y="62" width="400" height="22" fill="url(#c8-bruma)" opacity=".6"/>`;
  g += `<rect y="80" width="400" height="240" fill="url(#c8-llano)"/>`;
  // el Lacio con sus granjas
  g += campos(E.granja, S) + grupo('granja', granja(E.granja, S));
  // Janículo (orilla de enfrente), Tíber, isla y Campo de Marte
  { const r = azar(31); let c = ''; for (let i = 0; i < 160; i++) { const x = 40 + r() * 360, y = 116 + r() * 204, q = ((x - CX) / RX) ** 2 + ((y - CY) / RY) ** 2; if (q < 1.08) continue; c += i % 9 ? `<path d="M${r1(x - 1.4)} ${r1(y)} l1.4 -1.8 l1.4 1.8" fill="none" stroke="rgba(50,70,20,.35)" stroke-width=".5"/>` : (i % 2 ? arbol : pino)(x, y, .6 + r() * .3, S); } g += c; }
  g += `<path d="M0 132 Q22 142 30 190 Q44 250 24 320 H0Z" fill="${S.cipres}" opacity=".55"/><path d="M0 132 Q22 142 30 190 Q44 250 24 320 H0Z" fill="url(#c8-monte)"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => (i % 3 ? pino : cipres)(4 + (i * 7) % 18, 150 + i * 21, .8 + i * .07, S)).join('');
  g += `<path d="M44 120 Q90 108 148 126 Q150 170 140 214 Q100 214 70 204 Q50 170 44 120Z" fill="${S.nieve ? '#d0d4c6' : '#a9bd6c'}" opacity=".55"/>`;
  g += `<path d="${RIO}" fill="none" stroke="${S.nieve ? '#9aa7a2' : '#9b8a5e'}" stroke-width="27" stroke-linecap="round"/><path d="${RIO}" fill="none" stroke="url(#c8-rio)" stroke-width="22" stroke-linecap="round"/><path d="${RIO}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width=".8" stroke-dasharray="6 9" transform="translate(-4 1)"/><path d="${RIO}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".7" stroke-dasharray="3 14" transform="translate(4 -1)"/>`;
  g += barca(34, 150, .9) + (edad > 1 ? nave(56, 300, .8) + nave(30, 196, .6) : barca(62, 300, 1, 1));
  // tierra de dentro de la muralla y tramo de atrás
  g += `<ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="${S.suelo}"/><ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="url(#c8-monte)" opacity=".5"/>`;
  g += grupo('muralla', muro(E.muralla, false, S, edad), true);
  // montes de la ciudad: Capitolio, Quirinal, Esquilino, Palatino, Celio
  for (const [x, y, rx, h] of MONTES) g += `<path d="M${x - rx} ${y} Q${x - rx * .4} ${y - h * 1.6} ${x} ${y - h * 1.5} Q${x + rx * .5} ${y - h * 1.5} ${x + rx} ${y}Z" fill="${S.hierba2}" opacity=".7"/><path d="M${x - rx} ${y} Q${x - rx * .4} ${y - h * 1.6} ${x} ${y - h * 1.5} Q${x + rx * .5} ${y - h * 1.5} ${x + rx} ${y}Z" fill="url(#c8-monte)"/>`;
  g += `<path d="M[310 284] Q290 240 262 214 M240 204 Q214 186 190 166 M300 210 Q340 200 388 196" fill="none" stroke="#e6d8b2" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`.replace('[310 284]', `${r1(pe(PUERTA)[0])} ${r1(pe(PUERTA)[1])}`);
  // barrio de la plebe, árboles y edificios, de atrás adelante
  const total = Object.values(E).reduce((a, b) => a + b, 0), nc = Math.min(CASAS.length, Math.round(16 + plebe * .62 + (edad - 1) * 14 + total * 1.2));
  const piezas = CASAS.slice(0, nc).map(([x, y, h], i) => [y, casa(x, y, h, i, plebe, S)]);
  for (const [x, y, t, s] of [[160, 172, 1, .8], [204, 172, 0, .8], [298, 128, 0, .8], [362, 170, 1, .8], [346, 254, 0, .7], [274, 266, 1, .7], [228, 128, 1, .7], [380, 210, 2, .8], [158, 150, 1, .7]]) piezas.push([y, ARB[t](x, y, s, S)]);
  piezas.push([208, grupo('foro', foro(E.foro, S, edad))], [158, grupo('templo', templo(E.templo, S, edad))], [252, grupo('mercado', mercado(E.mercado, S))]);
  piezas.sort((a, b) => a[0] - b[0]); g += piezas.map(p => p[1]).join('');
  // Campo de Marte: campamento y una formación por legión
  g += grupo('cuartel', cuartel(E.cuartel, S, edad));
  const L = Math.max(0, v.legiones | 0), Lv = Math.min(L, 8);
  for (let i = 0; i < Lv; i++) g += legion(70 + (i % 4) * 20 - Math.floor(i / 4) * 6, 180 + Math.floor(i / 4) * 18);
  if (L > 8) g += `<text x="140" y="214" font-size="12" font-weight="700" fill="#4a0d08" text-anchor="end" font-family="system-ui,sans-serif">+${L - 8}</text>`;
  g += grupo('muelle', muelle(E.muelle, S));
  { const [x, y] = pe(PUERTA); g += `<path d="M${r1(x)} ${r1(y)} Q330 300 350 330" fill="none" stroke="#d9c9a0" stroke-width="4" opacity=".8"/>`; }
  // tramo de delante de la muralla y arrabales de la Edad II
  g += grupo('muralla', muro(E.muralla, true, S, edad));
  if (edad > 1) g += [[350, 300], [366, 307], [384, 298], [334, 312], [156, 290], [170, 298], [396, 312]].map(([x, y], i) => casa(x, y, (i * .29) % 1, i, plebe, S)).join('');
  // primer plano: pinos que enmarcan
  g += pino(22, 324, 2.6, S) + pino(392, 326, 2.4, S) + cipres(44, 322, 1.9, S) + cipres(368, 324, 1.6, S);
  // luz de la estación y viñeta
  g += `<rect width="400" height="320" fill="url(#c8-luz)" pointer-events="none"/><rect width="400" height="320" fill="${S.luz[0]}" opacity="${S.luz[1]}" pointer-events="none"/><rect width="400" height="320" fill="url(#c8-vin)" pointer-events="none"/>`;
  if (S.nieve) { const r = azar(9); let c = ''; for (let i = 0; i < 70; i++) c += `<circle cx="${r1(r() * 400)}" cy="${r1(r() * 320)}" r="${r1(.5 + r() * .8)}"/>`; g += `<g fill="#fff" opacity=".8" pointer-events="none">${c}</g>`; }
  // destellos de lo nuevo y marcas con etiqueta
  for (const id of nuevo) { const p = SITIO[id]; if (p) g += `<g transform="translate(${p[0]} ${p[1]})" pointer-events="none"><g class="c8-brillo"><circle r="14" fill="rgba(255,236,150,.3)" stroke="#f3c64a" stroke-width="1.6"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 -16 V-21" stroke="#f7d35c" stroke-width="1.8" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}</g></g>`; }
  const cajas = [];
  for (const { sitio, texto } of marcas) {
    const p = SITIO[sitio]; if (!p) continue;
    const t = esc(String(texto || '').slice(0, 30)), w = String(texto || '').slice(0, 30).length * 7 + 14, lx = Math.max(w / 2 + 17, Math.min(397 - w / 2, p[0]));
    let ly = p[1] - 30;
    for (let k = 0; k < 6 && cajas.some(([a, b, c]) => Math.abs(a - lx) < (c + w) / 2 + 2 && Math.abs(b - ly) < 20); k++) ly -= 21;
    if (ly < 40) ly = p[1] + 30;
    cajas.push([lx, ly, w]);
    g += `<g class="c8-marca" pointer-events="none"><circle cx="${p[0]}" cy="${p[1]}" r="10" fill="none" stroke="#fff3b0" stroke-width="2.4" class="c8-aro"/><circle cx="${p[0]}" cy="${p[1]}" r="9" fill="rgba(255,225,120,.28)" stroke="#d9a520" stroke-width="1.8"/>${lin(p[0], p[1] + (ly > p[1] ? 9 : -9), lx, ly + (ly > p[1] ? -9 : 9), '#7a1f14', 1.2)}<rect x="${r1(lx - w / 2)}" y="${ly - 10}" width="${w}" height="19" rx="5" fill="#fffaf0" stroke="#7a1f14" stroke-width="1.3"/><text x="${r1(lx)}" y="${r1(ly + 4.2)}" font-size="12.6" font-weight="700" text-anchor="middle" fill="#3a1a0c" font-family="system-ui,sans-serif">${t}</text></g>`;
  }
  return `<svg viewBox="14 28 386 292" role="img" aria-label="Roma en ${S.id}, vista desde el Janículo">${g}</svg>`;

  // cada edificio, en su grupo tocable; con halo si está elegido y andamio si está en obra
  function grupo(id, cuerpo, sinToque) {
    const [hx, hy, rx, ry] = TOQUE[id], o = OBRA[id];
    const halo = sel === id && !sinToque ? elip(hx, hy + 4, rx, ry, 'rgba(255,214,90,.3)', ' stroke="#f3c64a" stroke-width="2" stroke-dasharray="4 2"') : '';
    const andamio = obras.includes(id) && !sinToque ? obra(o[0], o[1], o[2], o[3]) : '';
    return `<g data-edif="${id}" class="edif${sel === id ? ' sel' : ''}">${halo}${cuerpo}${andamio}${sinToque ? '' : elip(hx, hy, rx, ry, '#000', ' fill-opacity="0"')}</g>`;
  }
}

/* templo toscano de Júpiter Óptimo Máximo: podio de toba, columnas de madera estucada, frontón bajo de terracota y la cuadriga de Vulca */
function tJupiter(x, y) {
  return `<g transform="translate(${x} ${y})"><path d="M-17 0 H17 L19 -1.5 V-5 H-15 L-17 -4Z" fill="${TOBA}" stroke="#5e4a30" stroke-width=".5"/><path d="M-6 0 h12 l1 -4 h-14z" fill="#9c8058"/>${[-13, -7.8, -2.6, 2.6, 7.8, 13].map(c => `<rect x="${c - 1.1}" y="-14" width="2.2" height="9" fill="${ESTUCO}" stroke="#7a6444" stroke-width=".35"/>`).join('')}<rect x="-15" y="-15.6" width="31" height="2" fill="#c79a5a" stroke="#6e5536" stroke-width=".35"/><path d="M-17 -15.6 L0 -22 L17 -15.6Z" fill="${TEJA}" stroke="#6e2a12" stroke-width=".5"/><path d="M17 -15.6 L19 -16.8 L2 -23 L0 -22Z" fill="#8f3f20"/><path d="M-10 -16.6 L0 -20.4 L10 -16.6" fill="none" stroke="${TERRACOTA}" stroke-width=".8"/>${[-15, -11, -7, 7, 11, 15].map(c => `<circle cx="${c}" cy="-15.4" r=".7" fill="${TERRACOTA}"/>`).join('')}<path d="M-2.6 -22.4 h4 l.8 -1.6 h-2 l-.8 -1.4 h-1.4z M-1.2 -22.3 a.9 .9 0 1 0 .1 0" fill="${TERRACOTA}" stroke="#6e2a12" stroke-width=".3"/></g>`;
}
/* ---------- escaño: silla curul con un senador togado del color del bando ---------- */
export function asiento(color, clase) {
  const silla = '<path d="M-5 4.5 L5 9.5 M5 4.5 L-5 9.5" stroke="#5a3a18" stroke-width="1.3"/><path d="M-6 4.5 H6" stroke="#7a5228" stroke-width="1.6"/>';
  const toga = { seguro: color, si: color, dudoso: '#f6ead0', contra: '#9a8e7a', no: '#6e6252', espera: '#e8dcbf', '': color }[clase] ?? color;
  const borde = clase === 'dudoso' ? color : '#2b1c0a', ancho = clase === 'dudoso' ? 1.6 : .7, op = clase === '' ? .6 : clase === 'espera' ? .7 : 1;
  let g = `<g opacity="${op}">${silla}<path d="M-6.5 5 C-6.5 -1 -3.5 -2.5 0 -2.5 C3.5 -2.5 6.5 -1 6.5 5Z" fill="${toga}" stroke="${borde}" stroke-width="${ancho}"${clase === 'dudoso' ? ' stroke-dasharray="1.8 1.3"' : ''}/>${clase === 'dudoso' ? `<path d="M-6.5 5 C-6.5 -1 -3.5 -2.5 0 -2.5 C3.5 -2.5 6.5 -1 6.5 5Z" fill="${color}" fill-opacity=".3"/>` : ''}<path d="M-4.5 -1.4 L3 4.6" stroke="rgba(255,255,255,.45)" stroke-width="1.2"/><circle cy="-5.6" r="3.4" fill="${clase === 'dudoso' ? '#ead2b8' : '#d6a274'}" stroke="${clase === 'dudoso' ? color : '#5a3418'}" stroke-width="${clase === 'dudoso' ? 1 : .6}"${clase === 'dudoso' ? ' stroke-dasharray="1.4 1"' : ''}/></g>`;
  if (clase === 'si') g += '<circle cx="6" cy="-7" r="4" fill="#46661f"/><path d="M4 -7 l1.6 1.6 l2.6 -3" stroke="#fff" stroke-width="1.3" fill="none"/>';
  if (clase === 'no' || clase === 'contra') g += `<circle cx="6" cy="-7" r="4" fill="${clase === 'no' ? '#9b2a1a' : '#6e6252'}"/><path d="M4.4 -8.6 l3.2 3.2 m0 -3.2 l-3.2 3.2" stroke="#fff" stroke-width="1.2"/>`;
  return g;
}

/* ---------- retratos de los tres jefes de bando (cabeza y toga, sin realismo) ---------- */
// gesto: 'si' asiente, 'no' niega, 'duda' duda, '' neutro
export function retrato(bando, color, gesto = '') {
  const piel = '#d9a77a', pelo = { ter: '#e6e2d8', mer: '#3a2416', mil: '#2a1c12' }[bando];
  const boca = gesto === 'si' ? '<path d="M28 36 Q32 39.5 36 36" stroke="#6e2a12" stroke-width="1.3" fill="none"/>' : gesto === 'no' ? '<path d="M28 38 Q32 34.6 36 38" stroke="#6e2a12" stroke-width="1.3" fill="none"/>' : gesto === 'duda' ? '<path d="M28.5 37 L35.5 36" stroke="#6e2a12" stroke-width="1.2"/>' : '<path d="M28.5 36.8 Q32 37.8 35.5 36.8" stroke="#6e2a12" stroke-width="1.1" fill="none"/>';
  const cejas = gesto === 'no' ? '<path d="M25 25 l4.5 1.6 M39 25 l-4.5 1.6" stroke="#3a2416" stroke-width="1.2"/>' : gesto === 'duda' ? '<path d="M25 25.6 l4.5 0 M34.5 24 q2.5 -2 4.5 0" stroke="#3a2416" stroke-width="1.2" fill="none"/>' : '<path d="M25 25 q2.2 -1.2 4.5 0 M34.5 25 q2.3 -1.2 4.5 0" stroke="#3a2416" stroke-width="1.1" fill="none"/>';
  const ojos = gesto === 'si' ? '<path d="M26 29 q1.6 -1.4 3 0 M35 29 q1.6 -1.4 3 0" stroke="#2b1c0a" stroke-width="1.1" fill="none"/>' : '<circle cx="27.6" cy="29" r="1.2" fill="#2b1c0a"/><circle cx="36.4" cy="29" r="1.2" fill="#2b1c0a"/>';
  const cabello = bando === 'ter' ? `<path d="M20.6 26 q-.6 -7 2.6 -9 M43.4 26 q.6 -7 -2.6 -9" stroke="${pelo}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M26 21 q6 -2 12 0" stroke="#b07a52" stroke-width=".7" fill="none"/><path d="M27 23 q5 -1.4 10 0" stroke="#b07a52" stroke-width=".6" fill="none"/>`
    : bando === 'mer' ? `<g fill="${pelo}">${[22, 25.5, 29, 32.5, 36, 39.5, 42].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 16.6 : 18}" r="3"/>`).join('')}<circle cx="20.6" cy="22" r="2.6"/><circle cx="43.4" cy="22" r="2.6"/></g>`
      : `<path d="M20.6 24 Q21 14 32 14 Q43 14 43.4 24 Q40 19.6 32 19.4 Q24 19.6 20.6 24Z" fill="${pelo}"/>`;
  const extra = bando === 'mil' ? '<path d="M38.5 31 l2.4 4" stroke="#a0603a" stroke-width=".9"/>' : bando === 'mer' ? '<path d="M24 40 q8 4 16 0" stroke="#c28860" stroke-width=".8" fill="none"/>' : '<path d="M24.6 33 q1.6 1.4 1.2 3 M39.4 33 q-1.6 1.4 -1.2 3" stroke="#b07a52" stroke-width=".6" fill="none"/>';
  const manto = bando === 'mil' ? `<path d="M10 72 C12 56 18 50 26 48 L18 72Z" fill="${color}"/><circle cx="25" cy="50" r="2" fill="#e2b13c"/>` : '';
  const sello = gesto === 'si' ? '<circle cx="54" cy="58" r="8" fill="#46661f" stroke="#fff" stroke-width="1.4"/><path d="M50.6 58 l2.6 2.6 l4.4 -5" stroke="#fff" stroke-width="2" fill="none"/>'
    : gesto === 'no' ? '<circle cx="54" cy="58" r="8" fill="#9b2a1a" stroke="#fff" stroke-width="1.4"/><path d="M50.6 54.6 l6.8 6.8 m0 -6.8 l-6.8 6.8" stroke="#fff" stroke-width="2"/>'
      : gesto === 'duda' ? `<circle cx="54" cy="58" r="8" fill="#fffaf0" stroke="${color}" stroke-width="1.6"/><text x="54" y="62" font-size="12" font-weight="700" text-anchor="middle" fill="${color}">?</text>` : '';
  return `<svg viewBox="0 0 64 72" class="retrato" aria-hidden="true"><defs><clipPath id="rc-${bando}"><circle cx="32" cy="34" r="30"/></clipPath></defs><circle cx="32" cy="34" r="31" fill="#c2913a" stroke="#5a3c10" stroke-width="1.4"/><circle cx="32" cy="34" r="28.4" fill="${color}" opacity=".28"/>
  <g clip-path="url(#rc-${bando})"><path d="M8 74 C9 56 20 48 32 48 C44 48 55 56 56 74Z" fill="#f1e8d2" stroke="#8a7a5a" stroke-width=".8"/><path d="M20 52 L44 74" stroke="#d8ccb0" stroke-width="3"/><path d="M36 49 L36 74" stroke="${color}" stroke-width="3.2"/>${manto}<rect x="28" y="40" width="8" height="9" fill="${piel}"/>
  <g class="cabeza ${gesto}"><ellipse cx="32" cy="29" rx="11.4" ry="13" fill="${piel}" stroke="#7a4a28" stroke-width=".8"/><ellipse cx="20.8" cy="30" rx="1.8" ry="3" fill="${piel}" stroke="#7a4a28" stroke-width=".6"/><ellipse cx="43.2" cy="30" rx="1.8" ry="3" fill="${piel}" stroke="#7a4a28" stroke-width=".6"/>${cabello}${cejas}${ojos}<path d="M32 29.6 l-1.6 4.4 h2.6" stroke="#9a6a44" stroke-width=".9" fill="none"/>${boca}${extra}</g></g>${sello}</svg>`;
}

/* ---------- ilustraciones del veredicto (una por final) ---------- */
/* corona de laurel: anillo de hojas abierto abajo, con cinta roja */
const CORONA = (cx, cy, r) => {
  let g = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#46661f" stroke-width="2" stroke-dasharray="${r1(r * 5.4)} ${r1(r * .9)}" transform="rotate(${r1(90 + 360 * .9 / 6.3 / 2)} ${cx} ${cy})"/>`;
  for (let k = 0; k < 22; k++) { const a = Math.PI / 2 + .35 + k * (2 * Math.PI - .7) / 21, x = r1(cx + r * Math.cos(a)), y = r1(cy + r * Math.sin(a)); g += `<ellipse cx="${x}" cy="${y}" rx="${r1(r * .2)}" ry="${r1(r * .085)}" fill="${k % 2 ? '#7d9a45' : '#5d7a2a'}" transform="rotate(${r1(a * 180 / Math.PI + (k % 2 ? 60 : 120))} ${x} ${y})"/>`; }
  return g + `<path d="M${cx - 4} ${cy + r - 2} l-6 12 M${cx + 4} ${cy + r - 2} l6 12" stroke="${ROJO}" stroke-width="3"/>`;
};
const SILUETA = (c = '#6e5a40') => `<path d="M0 110 V92 L20 92 L22 84 H40 V92 H60 L62 80 L78 70 L94 80 V92 H120 L122 76 H146 V92 H170 L172 84 H200 V92 H240 V130 H0Z" fill="${c}"/><path d="M62 80 L78 70 L94 80Z" fill="#8f3f20"/>`;
export function ilustracionFin(fin) {
  const t = (fin && fin.titulo) || '';
  let g = '';
  if (fin && fin.gana) {
    g = `<rect width="240" height="130" fill="#f6e6b8"/>${[...Array(12)].map((_, i) => `<path d="M120 70 L${r1(120 + Math.cos(i * Math.PI / 6) * 200)} ${r1(70 + Math.sin(i * Math.PI / 6) * 200)}" stroke="#f1cf6a" stroke-width="10" opacity=".35"/>`).join('')}${SILUETA('#c9a26a')}${CORONA(120, 46, 32)}`;
    g += `<g transform="translate(128 100) scale(1.3)"><ellipse cx="-10" cy="14" rx="44" ry="4" fill="rgba(60,40,10,.25)"/>${[-40, -28].map(x => `<g transform="translate(${x} 0)"><ellipse cx="0" cy="0" rx="10" ry="4.6" fill="#f6f0de" stroke="#5a4024" stroke-width="1"/><path d="M-7 -2 L-12 -12 L-17 -10 L-18 -7.6 L-12.6 -8 L-8 1Z" fill="#f6f0de" stroke="#5a4024" stroke-width="1" stroke-linejoin="round"/><path d="M-11 -12.4 q2 4 5 9" stroke="#b8a47a" stroke-width="1.6" fill="none"/><path d="M-7 3 L-9 13 M-4 4 L-2 13 M5 4 L4 13 M8 3 L11 12" stroke="#5a4024" stroke-width="1.6"/><path d="M10 -1 q5 2 3 9" stroke="#d8ccb0" stroke-width="2" fill="none"/><path d="M-12 -12 l-1 -3" stroke="#a3231a" stroke-width="1.4"/></g>`).join('')}<path d="M-30 -1 H-14" stroke="#5a4024" stroke-width="1"/><path d="M-14 -2 H16 Q20 8 12 10 H-12Z" fill="#c2913a" stroke="#5a3c10" stroke-width="1.2"/><circle cx="4" cy="10" r="6" fill="none" stroke="#5a3c10" stroke-width="2"/><path d="M4 4 V16 M-2 10 H10" stroke="#5a3c10"/><circle cx="2" cy="-16" r="4.4" fill="#d9a77a" stroke="#5a3418"/><path d="M-2.6 -18 q4.6 -4 9.2 0" stroke="#5d7a2a" stroke-width="2" fill="none"/><path d="M-4 -2 C-4 -10 0 -12 2 -12 C6 -12 8 -8 8 -2Z" fill="#7a2a5a" stroke="#3a0d28"/><path d="M8 -8 L16 -24" stroke="#5a4024" stroke-width="1.4"/><path d="M16 -24 q4 -2 3 -6 q-4 1 -3 6" fill="#7d9a45"/></g>`;
  } else if (/saquead/i.test(t)) {
    g = `<rect width="240" height="130" fill="#e9a77a"/><rect width="240" height="70" fill="#c7604a" opacity=".6"/>${SILUETA('#4a3426')}`;
    g += [[30, 84, 1], [78, 64, 1.4], [134, 72, 1.1], [186, 80, 1.3], [222, 88, .9]].map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -40 q14 -10 22 -26 q-2 18 -12 30 q12 -6 18 -16 q0 22 -28 30Z" fill="#8a8580" opacity=".5"/><path d="M-12 8 C-14 -6 -6 -10 -4 -22 C2 -12 4 -16 6 -26 C12 -14 16 -6 12 8Z" fill="#e2482a"/><path d="M-7 8 C-8 0 -2 -4 -1 -12 C3 -6 6 -4 7 8Z" fill="#f6b13c"/></g>`).join('');
  } else if (/depone/i.test(t)) {
    g = '<rect width="240" height="130" fill="#e9dcc0"/><path d="M40 120 H200 L190 108 H50Z M58 108 H182 L174 98 H66Z" fill="#c2ab84" stroke="#8a7350"/>';
    g += `<g transform="translate(92 82) rotate(-28)"><g fill="#b8862b" stroke="#5a3c10" stroke-width=".8">${[-8, -4, 0, 4, 8].map(x => `<rect x="${x - 2}" y="-34" width="4" height="40" rx="1"/>`).join('')}</g><path d="M-11 -24 H11 M-11 -10 H11 M-11 2 H11" stroke="${ROJO}" stroke-width="2.4"/><path d="M-12 6 l4 4 l4 -4 l4 4 l4 -4 l4 4 l4 -4" stroke="#5a3c10" fill="#b8862b"/></g>`;
    g += `<g transform="translate(150 74) rotate(32)"><g fill="#b8862b" stroke="#5a3c10" stroke-width=".8">${[-8, -4, 0, 4, 8].map(x => `<rect x="${x - 2}" y="-6" width="4" height="36" rx="1"/>`).join('')}</g><path d="M-11 6 H11 M-11 20 H11" stroke="${ROJO}" stroke-width="2.4"/><path d="M-12 -6 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" stroke="#5a3c10" fill="#b8862b"/><path d="M0 -6 V-22" stroke="#5a4024" stroke-width="2"/><path d="M0 -22 h14 q4 6 0 12 h-14z" fill="#b9bfc4" stroke="#4a4a4a"/></g><path d="M116 70 l6 -4 l-2 7 l7 -2" stroke="#7a5228" stroke-width="1.4" fill="none"/>`;
  } else if (/mot/i.test(t)) {
    g = `<rect width="240" height="130" fill="#e7b483"/>${SILUETA('#9c7a58')}`;
    for (let i = 0; i < 12; i++) { const x = 12 + i * 19 + (i % 2) * 4, y = 102 + (i % 3) * 6; g += `<g transform="translate(${x} ${y})"><circle cy="-10" r="5" fill="#6e4a30"/><path d="M-9 20 C-9 4 -5 -4 0 -4 C5 -4 9 4 9 20Z" fill="${['#8a6a4a', '#7a5a3a', '#9c7a50'][i % 3]}"/>${i % 3 === 0 ? '<path d="M6 -2 L12 -22" stroke="#5a3a18" stroke-width="2"/><path d="M12 -22 q-4 -6 0 -12 q4 6 0 12" fill="#f39a2a"/>' : i % 3 === 1 ? '<path d="M5 -2 L10 -16" stroke="#6e4a30" stroke-width="3"/><circle cx="10" cy="-18" r="3" fill="#6e4a30"/>' : ''}</g>`; }
  } else if (/hambre/i.test(t)) {
    g = '<rect width="240" height="130" fill="#ead7a8"/><path d="M0 96 H240 V130 H0Z" fill="#c9ad74"/>' + [20, 40, 60, 180, 200, 220].map(x => `<path d="M${x} 96 l-2 -12 M${x + 4} 96 l2 -10" stroke="#8a6a3a" stroke-width="1.2"/>`).join('');
    g += '<g transform="translate(100 92) rotate(-70)"><path d="M-14 -30 Q-26 -6 -16 22 Q0 30 16 22 Q26 -6 14 -30Z" fill="#b8693a" stroke="#5e2c10" stroke-width="1.4"/><path d="M-10 -30 h20 v-6 h-20z" fill="#9c5a30" stroke="#5e2c10"/><path d="M4 -10 l-4 8 l5 6 l-3 8" stroke="#5e2c10" stroke-width="1.2" fill="none"/></g>';
    g += '<path d="M150 104 L156 84 H186 L192 104Z" fill="#c7a56a" stroke="#6e5536" stroke-width="1.2"/><path d="M153 94 H189" stroke="#6e5536"/>' + [[160, 108], [168, 112], [176, 109]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="1.2" fill="#e0b54a"/>`).join('');
  } else if (/arca/i.test(t)) {
    g = '<rect width="240" height="130" fill="#e9dcc0"/><path d="M0 104 H240 V130 H0Z" fill="#c2ab84"/><path d="M76 66 H164 V108 H76Z" fill="#7a5228" stroke="#3a2a14" stroke-width="1.6"/><path d="M76 66 L84 30 H172 L164 66" fill="#8a6034" stroke="#3a2a14" stroke-width="1.6"/><path d="M82 72 H158 V102 H82Z" fill="#2e2214"/><path d="M76 80 H164 M76 96 H164" stroke="#b8862b" stroke-width="2.4"/><path d="M86 74 L100 88 M100 74 L86 88 M93 74 V88" stroke="#d8d0c0" stroke-width=".5"/><circle cx="130" cy="98" r="4" fill="#e2b13c" stroke="#7a5212"/>';
  } else if (/sin triunfo/i.test(t)) {
    // la Puerta Triunfal cerrada, la corona de laurel a medio trenzar y el general que vuelve a pie
    g = `<rect width="240" height="130" fill="#d9d6cc"/><ellipse cx="60" cy="26" rx="44" ry="8" fill="#eceae4"/><path d="M0 112 H240 V130 H0Z" fill="#b9a982"/>`;
    g += `<g stroke="#6e5536" stroke-width="1.2"><path d="M70 112 V40 H170 V112 H142 V76 A22 22 0 0 0 98 76 V112Z" fill="#d8c7a0"/><path d="M64 40 H176 V30 H64Z" fill="#c7b38c"/><path d="M98 112 V76 A22 22 0 0 1 142 76 V112Z" fill="#5a4024"/><path d="M120 54 V112" stroke="#2e1d0c" stroke-width="1.6"/></g><path d="M100 82 H140 M100 96 H140" stroke="#3a2a14" stroke-width="2"/><circle cx="114" cy="90" r="1.6" fill="#c9a24a"/><circle cx="126" cy="90" r="1.6" fill="#c9a24a"/>`;
    g += `<g transform="translate(194 110) scale(1.8)"><path d="M-16 0 A16 7 0 0 1 16 0" fill="none" stroke="#5e7a2e" stroke-width="2"/>${[-14, -10, -6, -2].map((x, i) => `<ellipse cx="${x}" cy="${r1(-4 - i * .9)}" rx="3.4" ry="1.5" fill="#6f8f3a" transform="rotate(${-30 + i * 10} ${x} ${r1(-4 - i * .9)})"/>`).join('')}${[8, 12].map(x => `<ellipse cx="${x}" cy="2" rx="3.2" ry="1.3" fill="#7d9a45" opacity=".8"/>`).join('')}</g>`;
    g += `<g transform="translate(38 112)"><circle cy="-30" r="5" fill="#d9a77a" stroke="#5a3418"/><path d="M-8 0 L-5 -24 H5 L8 0Z" fill="${ROJO}" stroke="#4a0d08"/><path d="M-5 -24 L-9 -4 M5 -24 L6 -10" stroke="#4a0d08" stroke-width="1.6"/><path d="M-4 -36 Q0 -42 4 -36" fill="#9aa0a0" stroke="#4a4a4a"/><path d="M6 -14 L14 -40" stroke="#5a4024" stroke-width="1.4"/></g>`;
  } else {
    g = `<rect width="240" height="130" fill="#d3d8d2"/><ellipse cx="190" cy="30" rx="40" ry="9" fill="#eef0ee"/>${SILUETA('#a08868')}<path d="M0 118 H240" stroke="#7d6a44" stroke-width="2"/><g transform="translate(120 100)"><circle cy="-30" r="6" fill="#d9a77a" stroke="#5a3418"/><path d="M-6 -33 q6 -9 12 0z" fill="#9aa0a6" stroke="#4a4a4a"/><path d="M-8 -22 H8 L7 0 H-7Z" fill="${ROJO}" stroke="#4a0d08"/><path d="M-6 0 V16 M6 0 V16" stroke="#5a3418" stroke-width="3"/><rect x="-20" y="-24" width="13" height="26" rx="3" fill="${ROJO}" stroke="#4a0d08" stroke-width="1.2"/><circle cx="-13.5" cy="-11" r="2.4" fill="#e2b13c"/><path d="M12 -26 V18" stroke="#5a4024" stroke-width="2"/><path d="M12 -26 l-2 -8 h4z" fill="#9aa0a6"/></g>`;
  }
  return `<svg viewBox="0 0 240 130" class="ilus-fin" role="img" aria-label="${t}">${g}</svg>`;
}

/* ala del águila: plumas escalonadas (remeras largas, secundarias y coberteras) que nacen del hombro */
const pluma = (bx, by, ang, L, w) => { const a = ang * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), tx = bx + ux * L, ty = by + uy * L, mx = bx + ux * L * .55, my = by + uy * L * .55;
  return `<path d="M${r1(bx)} ${r1(by)} Q${r1(mx - uy * w)} ${r1(my + ux * w)} ${r1(tx)} ${r1(ty)} Q${r1(mx + uy * w * .7)} ${r1(my - ux * w * .7)} ${r1(bx)} ${r1(by)}Z"/>`; };
const ALA = [0, 1, 2, 3, 4, 5].map(i => pluma(-12 - i * .8, 28 + i * 3.4, 238 - i * 8.5, 52 - i * 2.6, 7)).join('')
  + [0, 1, 2, 3, 4].map(i => pluma(-8 - i * .5, 32 + i * 3.6, 226 - i * 8, 32 - i * 1.4, 6.5)).join('')
  + '<path d="M-4 34 C-8 22 -18 10 -30 2 C-29 14 -26 26 -20 36 C-15 44 -9 49 -5 50Z"/><path d="M-9 26 C-14 22 -20 16 -25 10 M-8 34 C-14 32 -19 28 -23 22" fill="none" stroke-width=".8"/>';
/* ---------- portada: el Capitolio y el águila de la legión al atardecer; W×H según el móvil esté de pie o tumbado ---------- */
export function portada(W = 390, H = 844) {
  const tumbada = W > H, suelo = H * (tumbada ? .74 : .76), ax = tumbada ? W * .13 : W / 2, ay = tumbada ? H * .16 : H * .3, as = tumbada ? H / 300 : H / 380;
  const casas = [...Array(14)].map((_, i) => { const x = (i + .5) * W / 14 + (i % 3) * 6, y = suelo + 6 + (i % 4) * 7; return `<rect x="${(x - 9).toFixed(1)}" y="${(y - 11).toFixed(1)}" width="18" height="13" fill="#6e5536"/><path d="M${(x - 11).toFixed(1)} ${(y - 11).toFixed(1)} L${x.toFixed(1)} ${(y - 18).toFixed(1)} L${(x + 11).toFixed(1)} ${(y - 11).toFixed(1)}Z" fill="#8f3f20"/>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="portada-svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="p-cielo${W}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e49c50"/><stop offset=".55" stop-color="#f6d9a0"/><stop offset="1" stop-color="#f3e3bc"/></linearGradient><linearGradient id="p-bronce${W}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6db8a"/><stop offset=".5" stop-color="#c2913a"/><stop offset="1" stop-color="#7a5212"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#p-cielo${W})"/><circle cx="${W / 2}" cy="${suelo}" r="${Math.min(W, H) * .42}" fill="#fff2c8" opacity=".55"/>
  <path d="M0 ${suelo} Q${W * .2} ${suelo - 40} ${W * .4} ${suelo - 18} Q${W * .62} ${suelo - 46} ${W * .8} ${suelo - 20} Q${W * .92} ${suelo - 30} ${W} ${suelo - 12} V${H} H0Z" fill="#b39463"/>
  ${tJupiter(0, 0).replace('translate(0 0)', `translate(${(W * (tumbada ? .8 : .72)).toFixed(1)} ${(suelo - 22).toFixed(1)}) scale(${(H / (tumbada ? 140 : 330)).toFixed(2)})`)}
  <g>${casas}</g><path d="M0 ${suelo + 30} Q${W * .3} ${suelo + 14} ${W * .55} ${suelo + 26} T${W} ${suelo + 22} V${H} H0Z" fill="#7d6440"/>
  <g transform="translate(${ax.toFixed(1)} ${ay.toFixed(1)}) scale(${as.toFixed(2)})"><path d="M0 40 V${(H / as).toFixed(0)}" stroke="#4a3010" stroke-width="5"/><path d="M0 40 V${(H / as).toFixed(0)}" stroke="url(#p-bronce${W})" stroke-width="3"/>
  <circle cx="0" cy="96" r="17" fill="none" stroke="#46661f" stroke-width="5"/>${[...Array(16)].map((_, k) => { const a = k * Math.PI / 8; return `<ellipse cx="${(Math.cos(a) * 17).toFixed(1)}" cy="${(96 + Math.sin(a) * 17).toFixed(1)}" rx="4" ry="1.8" fill="#7d9a45" transform="rotate(${(k * 22.5 + 60).toFixed(0)} ${(Math.cos(a) * 17).toFixed(1)} ${(96 + Math.sin(a) * 17).toFixed(1)})"/>`; }).join('')}
  <rect x="-22" y="128" width="44" height="16" rx="2" fill="url(#p-bronce${W})" stroke="#5a3c10"/><text x="0" y="140.5" font-size="11" font-weight="700" text-anchor="middle" fill="#3a2405" font-family="serif" letter-spacing="1">SPQR</text>
  <g fill="url(#p-bronce${W})" stroke="#4a3010" stroke-width="1.1" stroke-linejoin="round"><g id="p-ala${W}">${ALA}</g><use href="#p-ala${W}" transform="scale(-1 1)"/><path d="M-7 52 C-9 40 -5 30 0 26 C5 30 9 40 7 52 L4 62 H-4Z"/><path d="M0 27 C-3 18 2 10 8 12 L15 15 L9 18 C7 21 5 24 3 28Z"/><path d="M-12 66 H12 M-4 62 L-6 66 M4 62 L6 66" fill="none" stroke-width="2"/></g><circle cx="9" cy="14.6" r=".9" fill="#2b1c0a"/></g></svg>`;
}

/* ---------- iconos de edificios y saberes (24×24) ---------- */
export const ICONOS = {
  granja: '<path d="M2 20 L22 20 L20 14 L4 14Z" fill="#d9b04a" stroke="#7a5a1f" stroke-width="1"/><path d="M6 14v-5l4-3 4 3v5z" fill="#d8c49c" stroke="#5e4a30" stroke-width="1.1"/><path d="M5 9.5 L10 5.5 L15 9.5" fill="none" stroke="#b5562f" stroke-width="1.8"/><path d="M17 14 q1.5 -6 3 0z" fill="#e0b54a" stroke="#7a5a1f" stroke-width=".8"/>',
  mercado: '<rect x="4" y="11" width="16" height="9" fill="#b89a6c" stroke="#5e4a30" stroke-width="1.1"/><path d="M3 11 L5 5 H19 L21 11Z" fill="#c4402a" stroke="#6e2a12" stroke-width="1"/><path d="M8 5 L7 11 M12 5 V11 M16 5 L17 11" stroke="#efe1bd" stroke-width="1.6"/><circle cx="9" cy="16" r="1.6" fill="#7d9a45"/><circle cx="15" cy="16" r="1.6" fill="#c9733e"/>',
  muelle: '<path d="M2 17 Q12 22 22 17" fill="#6f8f8a"/><path d="M3 12 H15 V14 H3Z" fill="#8a6034" stroke="#4a3119" stroke-width="1"/><path d="M5 14 v5 M9 14 v5 M13 14 v5" stroke="#4a3119" stroke-width="1.4"/><ellipse cx="18" cy="11" rx="1.6" ry="2.6" fill="#b8693a" stroke="#5e2c10" stroke-width=".8"/>',
  cuartel: '<path d="M2 19 L9 7 L13 19Z" fill="#efe6cf" stroke="#7a6444" stroke-width="1.1"/><path d="M9 7 L19 6 L22 18 L13 19Z" fill="#d7c9a8" stroke="#7a6444" stroke-width="1.1"/><path d="M19 6 V2 l3 1.5 -3 1.5" fill="#a3231a" stroke="#4a0d08" stroke-width=".6"/>',
  templo: '<path d="M3 20 H21 V18 H3Z" fill="#b89a6c" stroke="#5e4a30"/><path d="M5 17 V10 M9 17 V10 M15 17 V10 M19 17 V10" stroke="#c9b48a" stroke-width="2.2"/><path d="M5 17 V10 M9 17 V10 M15 17 V10 M19 17 V10" stroke="#5e4a30" stroke-width=".5"/><path d="M2 10 L12 4 L22 10Z" fill="#b5562f" stroke="#6e2a12" stroke-width="1"/>',
  muralla: '<path d="M2 21 V9 H5 V7 H8 V9 H11 V7 H14 V9 H17 V7 H20 V9 H22 V21Z" fill="#b89a6c" stroke="#5e4a30" stroke-width="1.1"/><path d="M9 21 v-6 a3 3 0 0 1 6 0 v6" fill="#3a2a18"/><path d="M2 13 H8 M16 13 H22 M2 17 H7 M17 17 H22" stroke="#8a6d48" stroke-width=".8"/>',
  castra: '<rect x="3" y="5" width="18" height="15" fill="#e9dcc0" stroke="#7a5228" stroke-width="1.6" stroke-dasharray="2 1"/><path d="M12 5 V20 M3 12 H21" stroke="#c9b791" stroke-width="1.4"/><path d="M8 9 l2 -3 l2 3z M14 16 l2 -3 l2 3z" fill="#efe6cf" stroke="#7a6444" stroke-width=".6"/>',
  pilum: '<path d="M4 21 L18 4" stroke="#7a5228" stroke-width="2"/><path d="M14 9 L18 4" stroke="#6b6f74" stroke-width="1.6"/><path d="M17 3 L21 2 L19 6Z" fill="#9aa0a6" stroke="#4a4a4a" stroke-width=".6"/><rect x="5" y="9" width="7" height="11" rx="1.5" fill="#a3231a" stroke="#4a0d08"/><circle cx="8.5" cy="14.5" r="1.4" fill="#e2b13c"/>',
  quinque: '<path d="M2 15 Q12 21 22 15 L20 12 H4Z" fill="#5e3f1f" stroke="#24160a" stroke-width="1"/><path d="M12 12 V3" stroke="#24160a" stroke-width="1.2"/><path d="M7 4 H17 L16 10 H8Z" fill="#efe6cf" stroke="#7a6444" stroke-width=".8"/><path d="M6 17 l-1 4 M10 18 l-1 4 M14 18 l-1 4 M18 17 l-1 4" stroke="#24160a" stroke-width=".9"/>',
  corvus: '<path d="M2 17 Q10 21 16 17 L15 14 H3Z" fill="#5e3f1f" stroke="#24160a" stroke-width="1"/><path d="M12 14 V4" stroke="#5a3a18" stroke-width="1.6"/><path d="M12 5 L22 11" stroke="#7a5228" stroke-width="3"/><path d="M22 11 l1 3.5" stroke="#3a2a14" stroke-width="1.4"/>',
  griego: '<rect x="3" y="4" width="18" height="12" rx="1" fill="#2e3a2a" stroke="#6b4a26" stroke-width="1.4"/><text x="12" y="13.4" font-size="7.4" text-anchor="middle" fill="#f3ecd6" font-family="serif">ΑΒΓ</text><path d="M7 16 L5 21 M17 16 L19 21" stroke="#6b4a26" stroke-width="1.4"/>',
  apio: '<path d="M8 22 L11 2 H13 L16 22Z" fill="#cfc6ac" stroke="#6e5536" stroke-width="1"/><path d="M12 4 V8 M12 11 V15 M12 18 V21" stroke="#8a826c" stroke-width="1.2"/><rect x="18" y="12" width="3" height="8" rx="1" fill="#e6dfc8" stroke="#6e5536" stroke-width=".8"/>',
};
