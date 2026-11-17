// EV7 · arte propio en SVG (dibujado a mano en código, sin copiar nada de otros juegos).
// Roma de 264 a.C. a pleno día: los siete montes, el Tíber con la isla, la muralla Serviana de toba,
// el Foro con sus tabernae, el templo toscano de Júpiter (toba, madera y terracota: nada de mármol),
// el Campo de Marte con las legiones, los campos del Lacio que cambian con la estación.
// Aquí solo se dibuja: no se toca el estado del juego.

const r1 = n => Math.round(n * 10) / 10;
function azar(s) { let a = s >>> 0 || 1; return () => (a = (Math.imul(a, 1103515245) + 12345) >>> 0) / 4294967296; }

/* ---------- estaciones: cielo, luz y color de los campos ---------- */
export const ESTACION = [
  { id: 'primavera', cielo: ['#9fcbe0', '#f1ead0'], sol: [332, 24, '#fff3c4', 1], monte: '#9fb3a6', hierba: '#8fae58', hierba2: '#7c9c48', campoA: '#a9c766', campoB: '#86a94c', surco: 'rgba(60,85,25,.35)', copa: '#56783a', hoja: '#8db35a', ciudad: '#cdbb8e', monteC: '#b2ae76', tinte: null },
  { id: 'verano', cielo: ['#86bfdc', '#f6edc9'], sol: [205, 18, '#fff8da', 1.25], monte: '#a9ad96', hierba: '#a6ad5a', hierba2: '#959f4c', campoA: '#e6c55e', campoB: '#cfa443', surco: 'rgba(120,80,20,.35)', copa: '#58733a', hoja: '#9aa845', ciudad: '#d6c08e', monteC: '#bdb072', tinte: ['#ffd890', .07] },
  { id: 'otono', cielo: ['#bfc6c2', '#efd6a6'], sol: [86, 32, '#ffe2a8', .9], monte: '#a89c86', hierba: '#a39a58', hierba2: '#8e8446', campoA: '#c78b46', campoB: '#a8703a', surco: 'rgba(80,45,15,.38)', copa: '#5b6c34', hoja: '#c9782c', ciudad: '#cdb488', monteC: '#b49c66', tinte: ['#f0a050', .09] },
  { id: 'invierno', cielo: ['#aebcc6', '#e3e6e3'], sol: [60, 46, '#f3f1e6', .55], monte: '#bfc6ca', hierba: '#b9bfac', hierba2: '#a7ae9a', campoA: '#eff1ec', campoB: '#dde3de', surco: 'rgba(110,120,125,.35)', copa: '#4d6440', hoja: '#8e806c', ciudad: '#d9d4c4', monteC: '#d4d6cc', nieve: true, tinte: ['#dfe9f2', .18] },
];

/* ---------- piezas ---------- */
const ROJO = '#a3231a', TOBA = '#b89a6c', TOBA2 = '#8a6d48', MADERA = '#7a5228', TEJA = '#b5562f', TERRACOTA = '#cf7a3c', ESTUCO = '#e2d2aa';

function defs(S) {
  const tej = S.nieve ? '#f4f5f1' : TEJA, tejB = S.nieve ? '#b9c0c0' : '#7a3518';
  return `<defs>
  <linearGradient id="c-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.cielo[0]}"/><stop offset="1" stop-color="${S.cielo[1]}"/></linearGradient>
  <linearGradient id="c-rio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fa4a0"/><stop offset="1" stop-color="#4f7a78"/></linearGradient>
  <radialGradient id="c-sol"><stop offset="0" stop-color="${S.sol[2]}"/><stop offset=".45" stop-color="${S.sol[2]}" stop-opacity=".55"/><stop offset="1" stop-color="${S.sol[2]}" stop-opacity="0"/></radialGradient>
  <g id="c-casa"><path d="M-4.5 -2.5h9v6h-9z" fill="${ESTUCO}" stroke="#6e5536" stroke-width=".4"/><path d="M4.5 -2.5l2 -1.5v5.5l-2 1.5z" fill="#b9a47c"/><path d="M-5.5 -2.5 L-3 -6 H5 L6.8 -4 L4.5 -2.5Z" fill="${tej}" stroke="${tejB}" stroke-width=".4"/><rect x="-1" y=".5" width="2" height="3" fill="#5a4024"/></g>
  <g id="c-casa2"><path d="M-4 -2h8v5.5h-8z" fill="${TOBA}" stroke="#5e4a30" stroke-width=".4"/><path d="M4 -2l1.8 -1.3v5.3l-1.8 1.5z" fill="${TOBA2}"/><path d="M-5 -2 L-2.6 -5.4 H4.4 L6 -3.4 L4 -2Z" fill="${tej}" stroke="${tejB}" stroke-width=".4"/><rect x="-2.6" y="-.4" width="1.6" height="1.6" fill="#4a3119"/><rect x="1" y="-.4" width="1.6" height="1.6" fill="#4a3119"/></g>
  <g id="c-domus"><path d="M-8 -3h16v6.5h-16z" fill="${ESTUCO}" stroke="#6e5536" stroke-width=".4"/><path d="M-9 -3 L-6 -8 H6 L9 -3Z" fill="${tej}" stroke="${tejB}" stroke-width=".4"/><path d="M-2.4 -6.6 H2.4 L3 -4.4 H-3Z" fill="#4f6f78"/><rect x="-1.2" y="0" width="2.4" height="3.5" fill="#5a4024"/><path d="M-6 0h2.5M3.5 0H6" stroke="#8a7350" stroke-width=".8"/></g>
  <g id="c-insula"><path d="M-4 -11h8v14.5h-8z" fill="#cdb48a" stroke="#5e4a30" stroke-width=".4"/><path d="M4 -11l2 -1.5v14l-2 2z" fill="#a98e66"/>${[-8.5, -5, -1.5].map(y => `<rect x="-2.8" y="${y}" width="1.6" height="1.8" fill="#4a3119"/><rect x="1.2" y="${y}" width="1.6" height="1.8" fill="#4a3119"/>`).join('')}<path d="M-4.8 -11 L-2.6 -13.6 H5 L6.6 -12.5 L4 -11Z" fill="${tej}" stroke="${tejB}" stroke-width=".4"/><rect x="-1" y=".5" width="2" height="3" fill="#5a4024"/></g>
  <g id="c-pino"><path d="M0 0v-7" stroke="#5a4024" stroke-width="1.1"/><ellipse cy="-8.5" rx="6" ry="2.8" fill="${S.copa}"/><ellipse cy="-9.4" rx="4.2" ry="1.6" fill="#ffffff" opacity="${S.nieve ? .7 : .12}"/></g>
  <g id="c-cipres"><path d="M0 0v-2" stroke="#5a4024" stroke-width="1"/><path d="M0 -12 C2.4 -8 2.4 -4 0 -1.5 C-2.4 -4 -2.4 -8 0 -12Z" fill="${S.copa}"/></g>
  <g id="c-arbol"><path d="M0 0v-5" stroke="#5a4024" stroke-width="1"/><circle cy="-7" r="3.6" fill="${S.hoja}"/><circle cx="2.4" cy="-5.5" r="2.4" fill="${S.hoja}"/>${S.nieve ? '<path d="M-3 -9h6" stroke="#fff" stroke-width="1" opacity=".7"/>' : ''}</g>
  <g id="c-tienda"><path d="M-5 2 L0 -4 L2 2Z" fill="#efe6cf" stroke="#7a6444" stroke-width=".4"/><path d="M0 -4 L6 -4.6 L8 1.6 L2 2Z" fill="#d7c9a8" stroke="#7a6444" stroke-width=".4"/></g>
  <g id="c-legion"><g fill="${ROJO}" stroke="#4a0d08" stroke-width=".35">${[0, 1, 2].map(f => [0, 1, 2, 3].map(c => `<rect x="${r1(c * 3.4 - 6)}" y="${r1(f * 4 - 4)}" width="2.6" height="3.2" rx=".5"/>`).join('')).join('')}</g><g fill="#c9a24a">${[0, 1, 2].map(f => [0, 1, 2, 3].map(c => `<circle cx="${r1(c * 3.4 - 4.7)}" cy="${r1(f * 4 - 4.6)}" r=".75"/>`).join('')).join('')}</g><path d="M8.6 8 V-10" stroke="#4a3119" stroke-width=".9"/><rect x="8.6" y="-10" width="5" height="4" fill="${ROJO}" stroke="#4a0d08" stroke-width=".3"/><path d="M8.6 -6h5" stroke="#e2b13c" stroke-width=".7"/><circle cx="8.6" cy="-10.6" r=".9" fill="#e2b13c"/></g>
  <g id="c-pila">${[0, 1, 2, 3].map(c => `<path d="M${r1(c * 3.4 - 4.6)} -5.2 l1 -4" stroke="#5a4024" stroke-width=".55"/>`).join('')}</g>
  <g id="c-barca"><path d="M-6 0 Q0 3 6 0 L5 -1.2 H-5Z" fill="#5e3f1f" stroke="#2e1d0c" stroke-width=".4"/><circle cx="0" cy="-2.4" r=".9" fill="#c98a5a"/><path d="M-1 -1.4 L-4 1.6" stroke="#4a3119" stroke-width=".5"/></g>
  <g id="c-trirreme"><path d="M-13 0 Q0 4 13 0 L11 -2 H-11Z" fill="#5e3f1f" stroke="#2e1d0c" stroke-width=".4"/><path d="M13 -.4 l3 .8" stroke="#8a6034" stroke-width="1"/>${[-9, -6, -3, 0, 3, 6, 9].map(c => `<path d="M${c} 1.6 l-1.4 2.6" stroke="#2e1d0c" stroke-width=".45"/>`).join('')}<path d="M0 -2 V-12" stroke="#2e1d0c" stroke-width=".7"/><path d="M-4.5 -11 H4.5 L4 -4.5 H-4Z" fill="#efe6cf" stroke="#7a6444" stroke-width=".3"/></g>
  </defs>`;
}

/* andamio con grúa de madera (rueda de pisar): x,y = pie de la obra; p = cuánto lleva (0 a 1) */
function andamio(x, y, w, h, p) {
  const bx = x - w / 2, by = y - h, hp = Math.max(1.5, h * p);
  let g = `<g class="andamio"><ellipse cx="${x}" cy="${y + 1}" rx="${w / 2 + 3}" ry="2" fill="rgba(60,40,15,.25)"/><rect x="${bx}" y="${r1(y - hp)}" width="${w}" height="${r1(hp)}" fill="${TOBA}" stroke="#5e4a30" stroke-width=".5"/>`;
  g += [0, .5, 1].map(k => `<path d="M${r1(bx + w * k)} ${y} V${by - 2}" stroke="${MADERA}" stroke-width="1"/>`).join('');
  g += [1 / 3, 2 / 3].map(k => `<path d="M${bx - 1} ${r1(y - h * k)} H${bx + w + 1}" stroke="${MADERA}" stroke-width=".9"/>`).join('');
  g += `<path d="M${bx} ${y} L${r1(bx + w / 2)} ${by - 2} M${r1(bx + w / 2)} ${y} L${bx + w} ${by - 2}" stroke="${MADERA}" stroke-width=".5"/>`;
  const ax = bx + w + 3, ay = by - 9;
  g += `<path d="M${ax + 3} ${y} L${ax - 2} ${ay} L${ax + 8} ${y}" fill="none" stroke="#5a3a18" stroke-width="1.2"/><path d="M${ax - 2} ${ay} V${r1(y - hp - 3)}" stroke="#3a2a14" stroke-width=".5"/><rect x="${ax - 3.5}" y="${r1(y - hp - 3.4)}" width="3" height="2.4" fill="${TOBA2}"/>`;
  g += `<circle cx="${ax + 6}" cy="${y - 4}" r="4" fill="none" stroke="#5a3a18" stroke-width="1"/><path d="M${ax + 2} ${y - 4}h8M${ax + 6} ${y - 8}v8" stroke="#5a3a18" stroke-width=".5"/></g>`;
  return g;
}
const destello = (x, y, r = 16) => `<g transform="translate(${r1(x)} ${r1(y)})"><g class="destello"><circle r="${r}" fill="rgba(255,236,150,.35)" stroke="#f3c64a" stroke-width="2"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 ${-r - 2} V${-r - 7}" stroke="#f7d35c" stroke-width="2" stroke-linecap="round" transform="rotate(${a})"/>`).join('')}</g></g>`;

/* templo toscano de Júpiter Óptimo Máximo: podio de toba, columnas de madera estucada, frontón bajo de terracota y la cuadriga de Vulca */
function tJupiter(x, y) {
  return `<g transform="translate(${x} ${y})"><path d="M-17 0 H17 L19 -1.5 V-5 H-15 L-17 -4Z" fill="${TOBA}" stroke="#5e4a30" stroke-width=".5"/><path d="M-6 0 h12 l1 -4 h-14z" fill="#9c8058"/>${[-13, -7.8, -2.6, 2.6, 7.8, 13].map(c => `<rect x="${c - 1.1}" y="-14" width="2.2" height="9" fill="${ESTUCO}" stroke="#7a6444" stroke-width=".35"/>`).join('')}<rect x="-15" y="-15.6" width="31" height="2" fill="#c79a5a" stroke="#6e5536" stroke-width=".35"/><path d="M-17 -15.6 L0 -22 L17 -15.6Z" fill="${TEJA}" stroke="#6e2a12" stroke-width=".5"/><path d="M17 -15.6 L19 -16.8 L2 -23 L0 -22Z" fill="#8f3f20"/><path d="M-10 -16.6 L0 -20.4 L10 -16.6" fill="none" stroke="${TERRACOTA}" stroke-width=".8"/>${[-15, -11, -7, 7, 11, 15].map(c => `<circle cx="${c}" cy="-15.4" r=".7" fill="${TERRACOTA}"/>`).join('')}<path d="M-2.6 -22.4 h4 l.8 -1.6 h-2 l-.8 -1.4 h-1.4z M-1.2 -22.3 a.9 .9 0 1 0 .1 0" fill="${TERRACOTA}" stroke="#6e2a12" stroke-width=".3"/></g>`;
}
function templo(x, y, s = .72) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-13 0 H13 V-4 H-13Z" fill="${TOBA}" stroke="#5e4a30" stroke-width=".6"/>${[-9.5, -3.2, 3.2, 9.5].map(c => `<rect x="${c - 1.2}" y="-13" width="2.4" height="9" fill="${ESTUCO}" stroke="#7a6444" stroke-width=".4"/>`).join('')}<rect x="-12" y="-14.6" width="24" height="2" fill="#c79a5a"/><path d="M-14 -14.6 L0 -20 L14 -14.6Z" fill="${TEJA}" stroke="#6e2a12" stroke-width=".6"/><circle cx="0" cy="-16.4" r="1.2" fill="${TERRACOTA}"/></g>`;
}
const curia = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-6 0 V-7 H6 V0Z" fill="${TOBA}" stroke="#5e4a30" stroke-width=".5"/><path d="M-7 -7 L0 -11 L7 -7Z" fill="${TEJA}" stroke="#6e2a12" stroke-width=".4"/><rect x="-1.4" y="-4.4" width="2.8" height="4.4" fill="#4a3119"/><path d="M-8 1.5 H8" stroke="#9c8058" stroke-width="1.4"/></g>`;
/* tabernae: fila de tiendas con toldos a rayas y mercancía */
function tabernae(x, y, n = 4) {
  let g = `<g transform="translate(${x} ${y})">`;
  for (let i = 0; i < n; i++) { const tx = (i - (n - 1) / 2) * 6.4; g += `<rect x="${r1(tx - 3)}" y="-6" width="6" height="6" fill="${TOBA}" stroke="#5e4a30" stroke-width=".35"/><rect x="${r1(tx - 2)}" y="-4" width="4" height="4" fill="#3a2a18"/><path d="M${r1(tx - 3.4)} -6 h6.8 l-1 -2.6 h-4.8z" fill="${i % 2 ? '#e9dcc0' : '#c4402a'}" stroke="#6e2a12" stroke-width=".25"/><circle cx="${r1(tx - 1)}" cy="1.4" r=".9" fill="${['#7d9a45', '#c9733e', '#e0b54a', '#8a5a9a'][i % 4]}"/><circle cx="${r1(tx + 1.2)}" cy="1.6" r=".8" fill="#c9733e"/>`; }
  return g + '</g>';
}
/* escuela de preceptores griegos: pórtico con un maestro y su tablilla ΑΒΓ */
const escuela = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-11" y="-2" width="22" height="3" fill="#c7b38c" stroke="#6e5536" stroke-width=".4"/>${[-8, -2.6, 2.6, 8].map(c => `<rect x="${c - .8}" y="-10" width="1.6" height="8" fill="${ESTUCO}" stroke="#7a6444" stroke-width=".3"/>`).join('')}<path d="M-12 -10 H12 L10 -13 H-10Z" fill="${TEJA}" stroke="#6e2a12" stroke-width=".4"/><rect x="-6" y="-8.2" width="7" height="4.6" fill="#2e3a2a" stroke="#6e5536" stroke-width=".3"/><text x="-2.5" y="-4.6" font-size="3.4" text-anchor="middle" fill="#f3ecd6" font-family="serif">ΑΒΓ</text><circle cx="4.4" cy="-6.6" r="1.1" fill="#c98a5a"/><path d="M2.6 -2 C2.6 -5 6.2 -5 6.2 -2Z" fill="#f3ecd6"/></g>`;
/* muelle del Tíber: pasarela de tablas, ánforas y, en el nivel 2, un almacén (horreum) */
function muelle(x, y, n) {
  let g = `<g transform="translate(${x} ${y}) scale(1.45)"><path d="M0 0 L-14 -6 L-12 -9 L2 -3Z" fill="#8a6034" stroke="#4a3119" stroke-width=".4"/>${[-12, -8, -4].map(c => `<path d="M${c} ${r1(c * .43 - 1)} v3" stroke="#4a3119" stroke-width=".8"/>`).join('')}`;
  g += `<g fill="#b8693a" stroke="#5e2c10" stroke-width=".25">${[[3, -3], [5, -3], [4, -5.2], [7, -2.6]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx=".9" ry="1.4"/>`).join('')}</g>`;
  if (n > 1) g += `<path d="M6 -6 h14 v6 h-14z" fill="${TOBA}" stroke="#5e4a30" stroke-width=".4"/><path d="M5 -6 L8 -9.4 H21 L20 -6Z" fill="${TEJA}" stroke="#6e2a12" stroke-width=".4"/>${[9, 13, 17].map(c => `<rect x="${c}" y="-4" width="2" height="4" fill="#4a3119"/>`).join('')}`;
  return g + '</g>';
}
/* granja del Lacio: casa de campo con patio, era y almiar según la estación */
function granja(x, y, S) {
  return `<g transform="translate(${x} ${y})"><path d="M-14 -2 L14 -2 L16 4 L-12 4Z" fill="${S.campoA}" stroke="${S.surco}" stroke-width=".6"/>${[-9, -4, 1, 6, 11].map(c => `<path d="M${c} -2 l1.4 6" stroke="${S.surco}" stroke-width=".6"/>`).join('')}<path d="M-4 -9 h14 v6 h-14z" fill="none" stroke="#9c8058" stroke-width=".8"/><use href="#c-casa2" x="0" y="-5"/><use href="#c-casa" x="7" y="-6"/>${S.id === 'verano' || S.id === 'otono' ? '<path d="M-10 -3 q2 -6 4 0z" fill="#d9b04a" stroke="#8a6a20" stroke-width=".3"/>' : ''}${S.id === 'primavera' ? '<circle cx="-9" cy="-4" r="1.2" fill="#fff"/><circle cx="-6.5" cy="-3.6" r="1.2" fill="#fff"/>' : ''}</g>`;
}
/* quinquerreme copiada de la nave púnica (tres hileras de remos), con corvus si se sabe */
function quinquerreme(x, y, corvus) {
  let g = `<g transform="translate(${x} ${y})"><path d="M-19 0 Q0 5 19 0 L16 -3 H-16Z" fill="#4e3317" stroke="#24160a" stroke-width=".5"/><path d="M19 -.6 l5 1.2 -5 1z" fill="#a8803a"/><circle cx="14" cy="-1.2" r=".8" fill="#e8d8b0"/>`;
  for (let k = 0; k < 3; k++) g += [-14, -10, -6, -2, 2, 6, 10].map(c => `<path d="M${c + k} ${1.8 + k * .6} l-1.6 ${3 - k * .4}" stroke="#24160a" stroke-width=".4"/>`).join('');
  g += `<path d="M2 -3 V-18" stroke="#24160a" stroke-width=".9"/><path d="M-5 -17 H9 L8 -6 H-4Z" fill="#efe6cf" stroke="#7a6444" stroke-width=".35"/><path d="M-4 -12 H8" stroke="${ROJO}" stroke-width="1.2"/>`;
  if (corvus) g += `<path d="M13 -3 V-13" stroke="#5a3a18" stroke-width="1"/><path d="M13 -12 L23 -16" stroke="#7a5228" stroke-width="2"/><path d="M23 -16 l1.2 3" stroke="#3a2a14" stroke-width="1"/>`;
  return g + '</g>';
}

/* ---------- geografía fija ---------- */
const MURO = [[160, 108], [230, 92], [300, 86], [352, 96], [388, 126], [391, 192], [372, 252], [300, 276], [220, 278], [160, 258], [141, 206], [146, 150]];
const MURO_D = 'M160 108 Q190 92 230 92 Q270 82 300 86 Q332 86 352 96 Q384 106 388 126 Q394 160 391 192 Q392 236 372 252 Q340 274 300 276 Q258 282 220 278 Q180 274 160 258 Q140 240 141 206 Q138 170 146 150 Q150 122 160 108Z';
const MONTES = [['Capitolio', 172, 136, 19, 10], ['Quirinal', 234, 112, 30, 10], ['Viminal', 292, 110, 22, 8], ['Esquilino', 350, 136, 30, 13], ['Palatino', 240, 200, 28, 12], ['Celio', 336, 222, 32, 12], ['Aventino', 178, 244, 22, 11]];
const RIO = 'M78 54 C50 78 14 104 20 146 C26 186 92 182 112 212 C126 234 112 256 80 270 C50 282 20 286 -6 292';
export const SITIO = {
  granja: [[208, 74], [266, 68], [324, 72], [376, 78]],
  mercado: [[210, 192], [204, 160], [156, 218]],
  templo: [[178, 240], [238, 106]],
  muelle: [[124, 252], [100, 278]],
  muralla: [300, 90], cuartel: [96, 106], escuela: [268, 172], apio: [300, 288],
  quinque: [46, 282], corvus: [46, 282], legiones: [100, 146], castra: [100, 146], pilum: [100, 146], griego: [268, 168], edad: [70, 276],
};
const EVITA = [[176, 128, 20], [210, 172, 26], [225, 228, 24], [178, 238, 14], [238, 104, 14], [268, 168, 15], [156, 216, 12], [300, 92, 10], [262, 276, 10], [390, 160, 8], [144, 232, 8], [334, 222, 10]];
function dentro(x, y) {
  let c = false; const cx = 268, cy = 184;
  const P = MURO.map(([a, b]) => [cx + (a - cx) * .9, cy + (b - cy) * .88]);
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; }
  return c;
}
const HOGARES = (() => {
  const r = azar(2640), out = [];
  for (let n = 0; n < 4000 && out.length < 90; n++) {
    const x = 146 + r() * 246, y = 96 + r() * 182;
    if (!dentro(x, y) || EVITA.some(([a, b, rr]) => Math.hypot(x - a, y - b) < rr) || out.some(p => Math.abs(p[0] - x) < 11 && Math.abs(p[1] - y) < 8)) continue;
    const enMonte = MONTES.some(([, a, b, rx, ry]) => ((x - a) / rx) ** 2 + ((y - b) / ry) ** 2 < 1);
    const k = r(); out.push([r1(x), r1(y), enMonte ? (k < .5 ? 'c-domus' : 'c-casa') : k < .3 ? 'c-insula' : k < .65 ? 'c-casa2' : k < .85 ? 'c-casa' : 'c-domus']);
  }
  return out;
})();

/* ---------- la ciudad ----------
   nuevo: cambios del último cierre ({que:'edif'|'saber'|'legiones'|'edad', obj, n}); nombres: {edif:{id:nombre}, saber:{id:nombre}}.
   Devuelve {svg, focos:[{x, y, nombre}]} para el zoom sobre lo recién cumplido. */
export function ciudad(e, nuevo = [], nombres = {}) {
  const S = ESTACION.find(x => x.id === nombres.estacion) || ESTACION[e.turno % 4], d = e.edif, focos = [];
  const sab = id => e.saberes.includes(id);
  const enCola = (t, o) => e.ordenes.find(x => x.ley.tipo === t && (o == null || x.ley.obj === o));
  const prog = o => o ? Math.min(1, (o.hecho + .5) / o.dura) : 0;
  const nv = (q, o) => nuevo.some(c => c.que === q && (o == null || c.obj === o) && (q !== 'legiones' || c.n > 0));
  const marca = (x, y, nombre, r) => { focos.push({ x, y, nombre }); return destello(x, y, r); };
  const [sx, sy, , sr] = S.sol;
  let g = defs(S) + `<rect width="400" height="300" fill="url(#c-cielo)"/><circle cx="${sx}" cy="${sy}" r="${r1(26 * sr)}" fill="url(#c-sol)"/><circle cx="${sx}" cy="${sy}" r="${r1(8 * sr + 3)}" fill="${S.sol[2]}"/>`;
  g += S.id === 'invierno' ? '<g fill="#eef0f0" opacity=".85"><ellipse cx="150" cy="24" rx="60" ry="9"/><ellipse cx="300" cy="18" rx="70" ry="10"/><ellipse cx="230" cy="34" rx="50" ry="7"/></g>'
    : `<g fill="#fff" opacity=".8"><ellipse cx="96" cy="22" rx="30" ry="6"/><ellipse cx="112" cy="18" rx="16" ry="6"/><ellipse cx="262" cy="30" rx="24" ry="5"/>${S.id === 'otono' ? '<ellipse cx="200" cy="14" rx="40" ry="6" fill="#e6e2da"/>' : ''}</g>`;
  // montes del fondo: Sabinos y Albanos
  g += `<path d="M0 60 L30 44 L56 52 L92 34 L128 48 L170 38 L214 50 L250 36 L290 46 L330 30 L366 44 L400 38 V70 H0Z" fill="${S.monte}"/>`;
  if (S.nieve) g += '<path d="M86 37 L92 34 L98 37 L94 38Z M164 40 L170 38 L176 40Z M244 39 L250 36 L257 39 L251 40Z M322 33 L330 30 L338 34 L330 35Z" fill="#fff"/>';
  g += `<path d="M0 66 Q100 56 200 62 T400 60 V300 H0Z" fill="${S.hierba}"/>`;
  // el Lacio: parcelas en perspectiva
  for (let i = 0; i < 10; i++) { const x0 = i * 44 - 12; g += `<path d="M${x0} 62 L${x0 + 42} 61 L${x0 + 46} ${i % 2 ? 84 : 80} L${x0 - 2} ${i % 2 ? 80 : 86}Z" fill="${i % 3 === 1 ? S.hierba2 : i % 2 ? S.campoA : S.campoB}" stroke="${S.surco}" stroke-width=".5"/>${i % 3 !== 1 ? [8, 16, 24, 32].map(k => `<path d="M${x0 + k} 62 l2 20" stroke="${S.surco}" stroke-width=".5"/>`).join('') : ''}`; }
  g += [[20, 66], [60, 70], [140, 64], [186, 68], [292, 64], [396, 66]].map(([x, y]) => `<use href="#c-cipres" x="${x}" y="${y}"/>`).join('');
  // Janículo y Trastévere, al otro lado del río
  g += `<path d="M0 150 Q20 160 40 196 Q60 236 50 262 Q30 280 0 284Z" fill="${S.hierba2}"/>` + [[8, 176], [18, 196], [10, 214], [30, 222], [22, 244], [40, 240], [6, 252]].map(([x, y], i) => `<use href="#${i % 3 ? 'c-pino' : 'c-cipres'}" x="${x}" y="${y}"/>`).join('');
  // Campo de Marte en la curva del río
  g += `<path d="M30 96 Q70 86 150 104 L146 150 Q140 176 124 200 Q90 178 46 176 Q20 150 30 96Z" fill="${S.nieve ? '#c8ccbc' : '#a9bd6c'}" opacity=".75"/>`;
  // el Tíber, la isla Tiberina con el templo de Esculapio (291 a.C.) y las barcas
  g += `<path d="${RIO}" fill="none" stroke="${S.nieve ? '#9aa7a2' : '#9b8a5e'}" stroke-width="27" stroke-linecap="round"/><path d="${RIO}" fill="none" stroke="url(#c-rio)" stroke-width="22" stroke-linecap="round"/><path d="${RIO}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1" stroke-dasharray="7 11" transform="translate(-3 1)"/>`;
  g += `<g transform="translate(114 214) rotate(28)"><ellipse rx="5" ry="12" fill="${S.hierba2}" stroke="#7d6a44" stroke-width=".7"/><path d="M0 -12 l1.8 -3" stroke="#7d6a44" stroke-width="1.2"/></g>${templo(114, 214, .32)}`;
  g += `<use href="#c-barca" x="28" y="118"/><use href="#c-barca" x="92" y="190"/><use href="#c-barca" x="24" y="286"/>`;
  // dentro de la muralla: tierra, montes, Foro, Circo Máximo
  g += `<path d="${MURO_D}" fill="${S.ciudad}"/>`;
  for (const [, x, y, rx, ry] of MONTES) g += `<ellipse cx="${x}" cy="${y + 3}" rx="${rx + 1}" ry="${ry}" fill="rgba(80,60,30,.22)"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${S.monteC}"/><ellipse cx="${x - rx * .2}" cy="${y - ry * .3}" rx="${rx * .6}" ry="${ry * .45}" fill="rgba(255,255,230,.18)"/>`;
  g += `<path d="M186 158 L234 160 L232 188 L188 186Z" fill="#dfd2ae" stroke="#8a7350" stroke-width=".6"/><path d="M188 172 L232 174" stroke="#b8a47a" stroke-width="1.6"/><rect x="200" y="165" width="9" height="3" fill="#a88d64"/><g>${[[194,178,'#f1e8d2'],[199,181,'#a3231a'],[214,179,'#f1e8d2'],[221,182,'#6b4a26'],[226,177,'#f1e8d2'],[206,183,'#7d9a45']].map(([x,y,c])=>`<circle cx="${x}" cy="${y - 2}" r=".9" fill="#c98a5a"/><path d="M${x - 1.2} ${y + 1} L${x} ${y - 1.4} L${x + 1.2} ${y + 1}Z" fill="${c}"/>`).join('')}</g><g transform="translate(225 229) rotate(-6)"><rect x="-24" y="-5" width="48" height="10" rx="5" fill="#d8c7a0" stroke="#8a7350" stroke-width=".6"/><path d="M-15 0 H15" stroke="#8a7350" stroke-width="1.4"/></g>`;
  g += `<path d="M232 174 Q280 176 330 166 L388 160" fill="none" stroke="#c9b791" stroke-width="2"/><path d="M234 186 Q250 240 262 276" fill="none" stroke="#c9b791" stroke-width="2"/>`;
  // Vía Apia (saber «apio»): calzada de losas que sale por la Puerta Capena, con miliarios
  if (sab('apio')) { g += '<path d="M262 280 L330 300" stroke="#8a826c" stroke-width="7"/><path d="M262 280 L330 300" stroke="#cfc6ac" stroke-width="5" stroke-dasharray="3 1"/><rect x="290" y="282" width="2" height="5" fill="#e6dfc8"/><rect x="314" y="289" width="2" height="5" fill="#e6dfc8"/><g transform="translate(270 256)"><rect x="-5" y="-2" width="10" height="4" rx="1" fill="#7fa4a0" stroke="#5e4a30" stroke-width=".5"/></g>'; if (nv('saber', 'apio')) g += marca(300, 288, nombres.saber?.apio || 'Vía Apia', 16); }
  else if (enCola('estudiar', 'apio')) g += andamio(300, 292, 16, 6, prog(enCola('estudiar', 'apio')));
  // muralla Serviana de toba: más gruesa por nivel; torres desde el 2; puertas dobles y terraplén (agger) en el 3
  const mu = d.muralla, an = 2.6 + mu * 1.4;
  if (mu >= 3) g += '<path d="M352 98 Q384 106 388 126 Q394 160 391 192" fill="none" stroke="#8e9a58" stroke-width="7" transform="translate(-5 0)"/>';
  g += `<path d="${MURO_D}" fill="none" stroke="#5e4a30" stroke-width="${an + 1.6}"/><path d="${MURO_D}" fill="none" stroke="${TOBA}" stroke-width="${an}"/><path d="${MURO_D}" fill="none" stroke="#7a6040" stroke-width="${r1(an * .5)}" stroke-dasharray="1 2.6" opacity=".6"/>`;
  if (mu >= 2) for (const [x, y] of MURO) g += `<rect x="${x - 3.5}" y="${y - 7}" width="7" height="9" fill="${TOBA}" stroke="#5e4a30" stroke-width=".5"/><path d="M${x - 4} ${y - 7} h8" stroke="${S.nieve ? '#f4f5f1' : TEJA}" stroke-width="1.6"/>`;
  for (const [x, y] of [[300, 88], [390, 160], [262, 278], [144, 232]]) { const w = mu >= 3 ? 14 : 10; g += `<rect x="${x - w / 2}" y="${y - 6}" width="${w}" height="9" fill="#a88d64" stroke="#5e4a30" stroke-width=".6"/><path d="M${x - 2.4} ${y + 3} v-4 a2.4 2.4 0 0 1 4.8 0 v4" fill="#3a2a18"/>${mu >= 3 ? `<path d="M${x - 6} ${y + 3} v-3 a1.4 1.4 0 0 1 2.8 0 v3 M${x + 3.2} ${y + 3} v-3 a1.4 1.4 0 0 1 2.8 0 v3" fill="#3a2a18"/>` : ''}`; }
  if (nv('edif', 'muralla')) g += marca(300, 90, nombres.edif?.muralla || 'Muralla', 18);
  if (enCola('ampliar', 'muralla')) g += andamio(372, 250, 12, 12, prog(enCola('ampliar', 'muralla')));
  // casas: insulae, domus y casas de toba; crecen con la población, las obras y la edad
  const total = Object.values(d).reduce((a, b) => a + b, 0);
  const nCasas = Math.max(26, Math.min(HOGARES.length, Math.round(26 + (e.pob - 90) * .9 + (e.edad - 1) * 16 + total * 1.4)));
  const casas = HOGARES.slice(0, nCasas);
  // monumentos que se ordenan con las casas por altura (lo de atrás primero)
  const piezas = casas.map(([x, y, t]) => [y, `<use href="#${t}" x="${x}" y="${y}"/>`]);
  piezas.push([128, tJupiter(176, 128)], [160, curia(222, 160)]);
  for (let i = 0; i < 2; i++) { const [x, y] = SITIO.templo[i]; if (i < d.templo) piezas.push([y, templo(x, y) + (nv('edif', 'templo') && i === d.templo - 1 ? marca(x, y - 8, nombres.edif?.templo || 'Templo', 15) : '')]); else if (i === d.templo && enCola('ampliar', 'templo')) piezas.push([y, andamio(x, y, 16, 12, prog(enCola('ampliar', 'templo')))]); }
  for (let i = 0; i < 3; i++) { const [x, y] = SITIO.mercado[i]; if (i < d.mercado) piezas.push([y, tabernae(x, y, i === 2 ? 3 : 5) + (nv('edif', 'mercado') && i === d.mercado - 1 ? marca(x, y - 3, nombres.edif?.mercado || 'Mercado', 15) : '')]); else if (i === d.mercado && enCola('ampliar', 'mercado')) piezas.push([y, andamio(x, y, 20, 8, prog(enCola('ampliar', 'mercado')))]); }
  { const [x, y] = SITIO.escuela; if (sab('griego')) piezas.push([y, escuela(x, y) + (nv('saber', 'griego') ? marca(x, y - 5, nombres.saber?.griego || 'Escuela griega', 15) : '')]); else if (enCola('estudiar', 'griego')) piezas.push([y, andamio(x, y, 18, 10, prog(enCola('estudiar', 'griego')))]); }
  piezas.sort((a, b) => a[0] - b[0]); g += piezas.map(p => p[1]).join('');
  // arrabales: en la Edad II Roma desborda la muralla (Puerta Capena, Puerta Colina y junto al Emporio)
  if (e.edad >= 2) { const A2 = [[284, 290, 'c-casa'], [246, 292, 'c-casa2'], [318, 292, 'c-casa'], [272, 82, 'c-casa2'], [330, 86, 'c-casa'], [150, 276, 'c-insula'], [166, 286, 'c-casa2'], [138, 290, 'c-casa'], [394, 214, 'c-casa2'], [226, 294, 'c-casa']]; g += A2.slice(0, e.edad >= 3 ? 10 : 7).map(([x, y, t]) => `<use href="#${t}" x="${x}" y="${y}"/>`).join(''); }
  // granjas del Lacio (fuera de la muralla)
  for (let i = 0; i < 4; i++) { const [x, y] = SITIO.granja[i]; if (i < d.granja) g += granja(x, y, S) + (nv('edif', 'granja') && i === d.granja - 1 ? marca(x, y - 3, nombres.edif?.granja || 'Granja', 15) : ''); else if (i === d.granja && enCola('ampliar', 'granja')) g += andamio(x, y + 2, 18, 8, prog(enCola('ampliar', 'granja'))); }
  // muelles del Tíber
  for (let i = 0; i < 2; i++) { const [x, y] = SITIO.muelle[i]; if (i < d.muelle) g += muelle(x, y, i + 1 + (e.edad >= 2 ? 1 : 0)) + (nv('edif', 'muelle') && i === d.muelle - 1 ? marca(x, y - 3, nombres.edif?.muelle || 'Muelle', 14) : ''); else if (i === d.muelle && enCola('ampliar', 'muelle')) g += andamio(x + 4, y, 14, 8, prog(enCola('ampliar', 'muelle'))); }
  // flota: quinquerreme (y corvus); en la Edad II, más naves en el puerto
  if (sab('quinque')) g += quinquerreme(46, 282, sab('corvus')) + (nv('saber', 'quinque') ? marca(46, 276, nombres.saber?.quinque || 'Quinquerreme', 18) : '') + (nv('saber', 'corvus') ? marca(60, 270, nombres.saber?.corvus || 'Corvus', 14) : '');
  else if (enCola('estudiar', 'quinque')) g += andamio(112, 268, 18, 6, prog(enCola('estudiar', 'quinque')));
  if (!sab('corvus') && sab('quinque') && enCola('estudiar', 'corvus')) g += andamio(62, 276, 8, 10, prog(enCola('estudiar', 'corvus')));
  if (e.edad >= 2) { g += '<use href="#c-trirreme" x="86" y="266"/><use href="#c-trirreme" x="10" y="290"/>' + (e.edad >= 3 ? '<use href="#c-trirreme" x="60" y="250"/>' : ''); if (nv('edad')) g += marca(70, 268, 'Edad II: Roma sale al mar', 20); }
  // Campo de Marte: barracones (tiendas) por nivel, campamento si «castra», legiones en manípulos
  for (let n = 0; n < d.cuartel; n++) for (let k = 0; k < 5; k++) g += `<use href="#c-tienda" x="${58 + k * 15 + (n % 2) * 6}" y="${100 + n * 9}"/>`;
  if (nv('edif', 'cuartel')) g += marca(90, 100 + (d.cuartel - 1) * 9, nombres.edif?.cuartel || 'Campo de Marte', 16);
  if (enCola('ampliar', 'cuartel')) g += andamio(96, 104 + d.cuartel * 9, 16, 6, prog(enCola('ampliar', 'cuartel')));
  const L = Math.min(e.legiones, 10), lx = i => 60 + (i % 5) * 19, ly = i => 134 + Math.floor(i / 5) * 21;
  if (sab('castra')) { const f = Math.max(1, Math.ceil(L / 5)); g += `<rect x="47" y="119" width="104" height="${f * 21 + 6}" fill="rgba(122,82,40,.08)" stroke="#7a5228" stroke-width="1.6" stroke-dasharray="1.6 1"/><path d="M96 ${119 + f * 21 + 6} h8" stroke="${S.ciudad}" stroke-width="2.4"/>`; if (nv('saber', 'castra')) g += marca(100, 140, nombres.saber?.castra || 'Campamento', 18); }
  const nuevasL = nuevo.filter(c => c.que === 'legiones' && c.n > 0).reduce((a, c) => a + c.n, 0);
  for (let i = 0; i < L; i++) { const leg = `<use href="#c-legion" x="${lx(i)}" y="${ly(i)}"/>` + (sab('pilum') ? `<use href="#c-pila" x="${lx(i)}" y="${ly(i)}"/>` : ''); g += i >= L - nuevasL ? `<g class="marcha">${leg}</g>` : leg; }
  if (e.legiones > 10) g += `<text x="150" y="176" font-size="8" font-weight="700" fill="#4a0d08" text-anchor="end">+${e.legiones - 10}</text>`;
  if (nuevasL > 0 && L) g += marca(lx(L - 1) + 2, ly(L - 1) - 1, nuevasL > 1 ? nuevasL + ' legiones nuevas' : 'Legión nueva', 13);
  if (nv('saber', 'pilum')) g += marca(lx(0) + 2, ly(0) - 4, nombres.saber?.pilum || 'Pilum', 13);
  { const o = (!sab('castra') && enCola('estudiar', 'castra')) || (!sab('pilum') && enCola('estudiar', 'pilum')); if (o) g += andamio(132, 124, 12, 9, prog(o)); }
  { const o = enCola('reclutar') || enCola('leva'); if (o && L < 10) g += `<g opacity=".8">${andamio(lx(L) + 2, ly(L) + 7, 12, 10, prog(o))}</g>`; }
  if (S.tinte) g += `<rect width="400" height="300" fill="${S.tinte[0]}" opacity="${S.tinte[1]}" pointer-events="none"/>`;
  return { svg: `<svg viewBox="0 0 400 300" role="img" aria-label="Roma en ${S.id}, vista desde el Janículo">${g}</svg>`, focos };
}

/* ---------- escaño: silla curul con un senador togado del color del bando ---------- */
export function asiento(color, clase) {
  const silla = '<path d="M-5 4.5 L5 9.5 M5 4.5 L-5 9.5" stroke="#5a3a18" stroke-width="1.3"/><path d="M-6 4.5 H6" stroke="#7a5228" stroke-width="1.6"/>';
  const toga = { seguro: color, si: color, dudoso: '#f6ead0', contra: '#9a8e7a', no: '#6e6252', espera: '#e8dcbf', '': color }[clase] ?? color;
  const borde = clase === 'dudoso' ? color : '#2b1c0a', ancho = clase === 'dudoso' ? 1.6 : .7, op = clase === '' ? .6 : clase === 'espera' ? .7 : 1;
  let g = `<g opacity="${op}">${silla}<path d="M-6.5 5 C-6.5 -1 -3.5 -2.5 0 -2.5 C3.5 -2.5 6.5 -1 6.5 5Z" fill="${toga}" stroke="${borde}" stroke-width="${ancho}"/><path d="M-4.5 -1.4 L3 4.6" stroke="rgba(255,255,255,.45)" stroke-width="1.2"/><circle cy="-5.6" r="3.4" fill="#d6a274" stroke="#5a3418" stroke-width=".6"/></g>`;
  if (clase === 'dudoso') g += `<circle cx="6" cy="-8" r="4.4" fill="#fffaf0" stroke="${color}" stroke-width="1"/><text x="6" y="-5.6" font-size="7" font-weight="700" text-anchor="middle" fill="${color}">?</text>`;
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
  } else {
    g = `<rect width="240" height="130" fill="#d3d8d2"/><ellipse cx="190" cy="30" rx="40" ry="9" fill="#eef0ee"/>${SILUETA('#a08868')}<path d="M0 118 H240" stroke="#7d6a44" stroke-width="2"/><g transform="translate(120 100)"><circle cy="-30" r="6" fill="#d9a77a" stroke="#5a3418"/><path d="M-6 -33 q6 -9 12 0z" fill="#9aa0a6" stroke="#4a4a4a"/><path d="M-8 -22 H8 L7 0 H-7Z" fill="${ROJO}" stroke="#4a0d08"/><path d="M-6 0 V16 M6 0 V16" stroke="#5a3418" stroke-width="3"/><rect x="-20" y="-24" width="13" height="26" rx="3" fill="${ROJO}" stroke="#4a0d08" stroke-width="1.2"/><circle cx="-13.5" cy="-11" r="2.4" fill="#e2b13c"/><path d="M12 -26 V18" stroke="#5a4024" stroke-width="2"/><path d="M12 -26 l-2 -8 h4z" fill="#9aa0a6"/></g>`;
  }
  return `<svg viewBox="0 0 240 130" class="ilus-fin" role="img" aria-label="${t}">${g}</svg>`;
}

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
  <g fill="url(#p-bronce${W})" stroke="#4a3010" stroke-width="1.1" stroke-linejoin="round"><path id="p-ala${W}" d="M-5 38 C-14 26 -26 8 -44 -12 C-42 -2 -48 2 -54 4 C-46 12 -48 16 -54 20 C-45 25 -44 30 -47 35 C-34 38 -20 44 -7 50Z"/><use href="#p-ala${W}" transform="scale(-1 1)"/><path d="M-7 52 C-9 40 -5 30 0 26 C5 30 9 40 7 52 L4 62 H-4Z"/><path d="M0 27 C-3 18 2 10 8 12 L15 15 L9 18 C7 21 5 24 3 28Z"/><path d="M-12 66 H12 M-4 62 L-6 66 M4 62 L6 66" fill="none" stroke-width="2"/></g><circle cx="9" cy="14.6" r=".9" fill="#2b1c0a"/></g></svg>`;
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
