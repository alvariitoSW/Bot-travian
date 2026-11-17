// EV8 · escenas ilustradas en SVG propio. Roma, 264 a.C.: toba, terracota y madera; toga blanca, con borde púrpura solo
// para magistrados y sacerdotes; nada de mármol ni anfiteatros. Solo dibuja (paleta y trazo de arte.js).

const r1 = n => Math.round(n * 10) / 10;
let N = 0;
const P = '#2b1c0a', TOGA = '#f3ead4', PLIEGUE = '#cbbd9c', PURP = '#6b1f4f', ROJO = '#a3231a', BRONCE = '#b98a3e', ORO = '#e2b13c';
const PIELES = ['#d9a77a', '#c98d5e', '#b97a4c', '#e2b48a'], PELOS = ['#3a2416', '#2a1c12', '#6e5a48', '#d8d2c4', '#5a3418'];
const ROPAS = ['#a88d63', '#8a6a4a', '#b9a27c', '#7a5a3a', '#c9b48a', '#9c7a50', '#6e7a5a', '#a86a4a'];
const BANDO = { ter: '#5d7a2a', mer: '#b8862b', mil: '#a3231a' };
function azar(s) { let a = s >>> 0 || 1; return () => (a = (Math.imul(a, 1103515245) + 12345) >>> 0) / 4294967296; }
const st = (c = P, w = .6) => ` stroke="${c}" stroke-width="${w}"`;
const [S4, S5, S6, S7, S8] = [4,5,6,7,8].map(k => st(P, k / 10)), NF = ' fill="none"', LC = ' stroke-linecap="round"';
const G = (x, y, s = 1, f = 1, b = '') => `<g transform="translate(${r1(x)} ${r1(y)})${s !== 1 || f !== 1 ? ` scale(${+(s * f).toFixed(3)} ${+s.toFixed(3)})` : ''}">${b}</g>`;
const lin = (id, cs, h) => `<linearGradient id="${id}"${h ? '' : ' x2="0" y2="1"'}>${cs.map((c, i) => `<stop offset="${r1(i / (cs.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const rad = (id, c, o = .8) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
const svg = (b, label, w = 360, h = 200, cls = 'escena') => `<svg viewBox="0 0 ${w} ${h}" class="${cls}" role="img" aria-label="${label}">${b}</svg>`;

/* ---------- piezas: miembro afilado, cabeza, figura de pie, sentada y recostada ---------- */
function seg(a, b, w1, w2, f, s = P, sw = .5) {
const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, h1 = w1 / 2, h2 = w2 / 2;
return `<path d="M${r1(a[0] + nx * h1)} ${r1(a[1] + ny * h1)}L${r1(b[0] + nx * h2)} ${r1(b[1] + ny * h2)}A${h2} ${h2} 0 0 0 ${r1(b[0] - nx * h2)} ${r1(b[1] - ny * h2)}L${r1(a[0] - nx * h1)} ${r1(a[1] - ny * h1)}A${h1} ${h1} 0 0 0 ${r1(a[0] + nx * h1)} ${r1(a[1] + ny * h1)}Z" fill="${f}"${s ? st(s, sw) : ''}/>`;
}
const miembro = (pts, ws, f, s, sw) => pts.slice(1).map((p, i) => seg(pts[i], p, ws[i], ws[i + 1], f, s, sw)).join('');

// cabeza de perfil 3/4 mirando a la derecha, centrada en (0,-51)
function cabeza({ piel = PIELES[0], pelo = PELOS[0], gesto = '', barba = 0, velo = 0, borde = 0, laurel = 0, casco = '' } = {}) {
const boca = gesto === 'feliz' ? '<path d="M1.8 -48.4 q1.5 1.3 2.9 -.1" fill="none"' + st('#6e2a12', .6) + '/>'
: gesto === 'grito' ? '<ellipse cx="3.3" cy="-48" rx="1.1" ry="1.3" fill="#4a1408"/>'
: gesto === 'enfado' ? '<path d="M2 -47.8 q1.4 -.9 2.8 0" fill="none"' + st('#6e2a12', .6) + '/><path d="M1 -54.6 l3 1" ' + st(P, .7) + '/>'
: '<path d="M2.1 -48.2 h2.4"' + st('#6e2a12', .5) + '/>';
let h = `<path d="M-1.7 -46.5 h3.4 v3.5 h-3.4z" fill="${piel}"/><ellipse cy="-51" rx="5" ry="5.8" fill="${piel}"${S6}/><path d="M4.6 -52.8 l2 2.7 l-1.9 .5" fill="${piel}"${S5}/><circle cx="2.5" cy="-52.4" r=".75" fill="${P}"/>${boca}`;
if (!velo) h += `<path d="M-5.3 -49.6 C-6.2 -56.6 -2 -58.3 1 -57.7 C3.9 -57.2 5.5 -55.6 5.2 -53.3 C3 -55 .2 -55.1 -1.3 -53.4 C-2.5 -51.6 -3.5 -49 -5.2 -46.4Z" fill="${pelo}"/><ellipse cx="-1.2" cy="-50.6" rx="1.2" ry="1.8" fill="${piel}"${S4}/>`;
if (barba) h += `<path d="M-3.4 -48.6 Q-1.4 -43.6 4 -45.2 L5 -47.6 Q2 -46.4 -.4 -48.6Z" fill="${pelo}"/>`;
if (velo) h += `<path d="M-6.6 -44.6 C-8.6 -53 -6.4 -59.8 0 -59.7 C4.8 -59.6 6.8 -56.8 6.5 -53.4 L4.6 -55 C.2 -57.3 -3 -55 -3.7 -50.6 C-4.1 -48 -4 -46.4 -3.4 -44.4Z" fill="${TOGA}"${S5}/>${borde ? `<path d="M6.5 -53.4 L4.6 -55 C.2 -57.3 -3 -55 -3.7 -50.6 C-4.1 -48 -4 -46.4 -3.4 -44.4"${NF}${st(PURP, 1.2)}/>` : ''}`;
if (laurel) h += [-5,-3.2,-1,1.4,3.6].map((x, i) => `<ellipse cx="${x}" cy="${r1(-56.4 + Math.abs(x) * .2)}" rx="1.9" ry=".8" fill="${i % 2 ? '#7d9a45' : '#4f6e22'}" transform="rotate(${-30 + i * 14} ${x} -56)"/>`).join('');
if (casco) h += `<path d="M-5.8 -50 C-6.4 -58 -2 -60.4 1 -60 C5 -59.6 6.6 -56 6.2 -51.6 L8 -51 L-6.8 -49.4Z" fill="${BRONCE}"${S6}/><path d="M-4 -49.6 L-4.6 -44.6 L-1.6 -45.4 L-1.4 -49.6Z" fill="#8a6428"/><path d="M-3 -59.4 C-7 -67 1 -71.6 7 -65"${NF}${st(casco, 2.6)}/><path d="M-6.4 -54 C-10 -60 -9 -66 -7 -68 M6 -55 C9 -62 8 -66 6.6 -69"${NF}${st('#efe9da', 1.2)}/>`;
return h;
}

const BRAZO = { abajo: [[8,-33],[9,-24]], frente: [[12,-35],[19,-37]], alto: [[11,-51],[13,-61]], senala: [[13,-43],[22,-49]], cadera: [[12,-34],[7,-29]], pecho: [[10,-33],[3,-36]], jarra: [[9,-33],[14,-27]], boca: [[11,-36],[7,-47]] };
const mano = (lado, pose) => { const h = BRAZO[pose][1]; return [h[0] * lado, h[1]]; };
// figura de pie mirando a la derecha; pies en (0,0), cabeza en (0,-51). toga: blanca; borde: praetexta; capa: color de paludamento
function fig(o) {
const { x = 0, y = 0, s = 1, dir = 1, ropa = ROPAS[0], toga = 0, borde = 0, velo = 0, piel = PIELES[0], br = 'abajo', bi = 'abajo', capa = '', coraza = 0, objD = '', objI = '', togaColor = TOGA, orla = PURP } = o;
const largo = toga ? -4 : -14;
const arm = (lado, pose, cl) => { const [e, h] = BRAZO[pose], sh = [6 * lado, -42], E = [e[0] * lado, e[1]], H = [h[0] * lado, h[1]]; return seg(sh, E, 4.6,3.8, cl) + seg(E, H, 3.6,3, piel) + `<circle cx="${H[0]}" cy="${H[1]}" r="1.9" fill="${piel}"${S5}/>`; };
let b = `<ellipse cy=".4" rx="10" ry="2" fill="rgba(40,25,10,.22)"/>`;
if (capa) b += `<path d="M-7 -44 C-12 -30 -13 -16 -11 -6 L-2 -9 L4 -44Z" fill="${capa}"${S5}/>`;
b += seg([-3,-16],[-4,-1.5],4.4,3.3, piel) + seg([3,-16],[4,-1.5],4.4,3.3, piel) + `<path d="M-6 -.4 h5 M2 -.4 h5.2" ${st('#4a2e14', 1.6)}/>`;
if (coraza) b += `<path d="M-8 -16 L-7 -9 L8 -9 L9 -16Z" fill="${ROJO}"${S4}/><path d="M-6 -16 v6 M-3 -16 v7 M0 -16 v7 M3 -16 v7 M6 -16 v6" ${st('#7a5212', 1.4)}/>`;
b += `<path d="M-7 -44 C-9 -36 -10 -24 -9 ${largo} L9 ${largo} C10 -24 9 -36 7 -44 Q0 -46 -7 -44Z" fill="${coraza ? BRONCE : ropa}"${S6}/>`;
if (coraza) b += `<path d="M-5 -37 Q-2.5 -34 0 -37 Q2.5 -34 5 -37 M-4 -28 Q0 -26 4 -28 M0 -36 V-19"${NF}${st('#7a5212', .7)}/><path d="M-6 -42 L-4 -38 M6 -42 L4 -38" ${st('#f2d38a', 1)}/>`;
else if (!toga) b += `<path d="M-9 -30 H9" ${st('#5a3a18', 1.2)}/>`;
b += arm(-1, bi, toga ? togaColor : coraza ? ROJO : ropa);
if (toga) b += `<path d="M-8 -45 L-2 -46.5 C4 -38 9 -30 10 -20 C10.5 -13 9 -8 8 -4 L-9 -4 C-11 -18 -11 -34 -8 -45Z" fill="${togaColor}"${S6}/><path d="M-6 -40 C-1 -33 4 -27 8 -18 M-8 -30 C-5 -24 -2 -16 0 -5 M-9.5 -20 C-8 -14 -7 -9 -6 -5 M3 -12 C4 -9 4 -6 4 -4"${NF}${st(PLIEGUE, .7)}/>${borde ? `<path d="M-2 -46.5 C4 -38 9 -30 10 -20"${NF}${st(orla, 1.6)}/>` : ''}`;
b += arm(1, br, coraza ? ROJO : ropa) + cabeza(o);
if (objD) { const [hx, hy] = mano(1, br); b += G(hx, hy, 1,1, objD); }
if (objI) { const [hx, hy] = mano(-1, bi); b += G(hx, hy, 1,1, objI); }
return G(x, y, s, dir, b);
}
// objetos de mano (origen en la mano)
const OBJ = {
tablilla: `<g transform="rotate(-20)"><rect x="-1" y="-9" width="8" height="10" rx=".8" fill="#9a6a34"${S5}/><rect x=".2" y="-7.8" width="5.6" height="7.6" fill="#3a2a1a"/><path d="M1 -6 h4 M1 -4 h3.4 M1 -2 h4" ${st('#c9b48a', .4)}/></g>`,
patera: `<ellipse cx="2" cy="-1" rx="4.6" ry="1.5" fill="${ORO}"${st('#7a5212', .5)}/><circle cx="2" cy="-1.4" r=".9" fill="#a87a22"/>`,
lituus: `<path d="M0 6 L1 -12 C1.4 -16 5 -17 5.4 -14 C5.6 -12 3.6 -11.6 3.4 -13"${NF}${st('#7a5228', 1.2)}/>`,
casco: `<path d="M-4 3 C-4 -4 4 -4 4 3 L6 3.6 L-6 3.6Z" fill="${BRONCE}"${S5}/><path d="M0 -2 C-2 -8 4 -10 7 -6"${NF}${st(ROJO, 2)}/>`,
jarra: `<path d="M-2 -1 C-4 2 -4 7 -1 9 H3 C6 7 6 2 4 -1 L4.6 -3.4 L-2.6 -3.4Z" fill="#b86a3a"${S5}/><path d="M-2.6 -3.4 l-1.4 -1.2" ${S8}/><path d="M-3.4 3 h7.6" ${st('#2e1a0e', 1)}/>`,
copa: `<path d="M-3 -3 Q0 1 3 -3Z M0 -1 V1.6 M-1.4 1.8 H1.4" fill="#2e1a0e"${st('#2e1a0e', .6)}/>`,
antorcha: `<path d="M0 6 L0 -10" ${st('#5a3a18', 1.6)}/><path d="M0 -10 C-4 -14 -2 -18 0 -22 C1 -18 4 -16 2 -12 C4 -14 4 -10 0 -10Z" fill="#f08a24"/><path d="M0 -11 C-1.6 -13 -1 -15 0 -17 C1 -15 1.6 -13 0 -11Z" fill="#fbd24a"/>`,
laurel: `<path d="M0 0 L3 -14" ${st('#5a4024', 1)}/>${[0,1,2,3].map(i => `<ellipse cx="${r1(1 + i * .7 + (i % 2 ? 1.8 : -1.8))}" cy="${-4 - i * 3}" rx="2" ry=".9" fill="#5d7a2a" transform="rotate(${i % 2 ? -40 : 40} ${r1(1 + i * .7)} ${-4 - i * 3})"/>`).join('')}`,
cetro: `<path d="M0 8 L0 -18" ${st('#e8dcc0', 1.2)}/><path d="M-3 -19 Q0 -24 3 -19 L1.4 -18 H-1.4Z" fill="${ORO}"${st('#7a5212', .4)}/>`,
corona: `<ellipse cx="2" cy="-4" rx="5" ry="2"${NF}${st(ORO, 1.6)}/>${[-2,0,2,4,6].map(x => `<circle cx="${x}" cy="-5.4" r=".9" fill="#f2d38a"/>`).join('')}`,
tibias: `<path d="M-1 -4 L-14 7 M-1 -4 L-10 9" ${st('#c9a46a', 1)}/>`,
fasces: `<rect x="-1.6" y="-14" width="3.2" height="18" rx=".8" fill="#9a6a34"${S4}/><path d="M-1.6 -10 h3.2 M-1.6 -4 h3.2 M-1.6 2 h3.2" ${st(ROJO, .9)}/>`,
mazo: `<path d="M0 4 L2 -12" ${st('#5a3a18', 1.4)}/><rect x="-1.5" y="-16" width="7" height="4" rx="1" fill="#6a6660" transform="rotate(10 2 -14)"/>`
};

// senador sentado mirando a la derecha; asiento en (0,0)
const POSE_S = { mano: [[5,-16],[9,-9]], alto: [[8,-28],[9,-37]], aplaude: [[7,-16],[5,-23]], senala: [[9,-24],[17,-27]], cruza: [[7,-16],[-3,-15]], cara: [[7,-17],[4,-26]] };
function senador({ x, y, s = 1, dir = 1, pose = 'mano', piel = PIELES[0], pelo = PELOS[0], gesto = '', borde = 0 }) {
const [e, h] = POSE_S[pose];
let b = `<path d="M-8 0 C-9 -10 -7 -21 0 -22 C6 -22 8 -16 8 -10 L14 -9 C16 -6 16 -1 14 0Z" fill="${TOGA}"${S6}/><path d="M12 0 L13 6 M8 0 L9 6" ${st('#5a3a18', 1.4)}/><path d="M-5 -19 C0 -14 5 -10 10 -8 M-6 -10 C-3 -6 0 -3 2 0"${NF}${st(PLIEGUE, .7)}/><path d="M1 -21 v5" ${st(borde ? PURP : '#9a5a6a', borde ? 1.6 : .9)}/>`;
b += seg([4,-19], e, 4.4,3.6, TOGA) + seg(e, h, 3.4,3, piel) + `<circle cx="${h[0]}" cy="${h[1]}" r="1.8" fill="${piel}"${S5}/>`;
b += G(0,25,1,1, cabeza({ piel, pelo, gesto }));
if (pose === 'aplaude') b += seg([-4,-18],[3,-16],4,3.4, TOGA) + seg([3,-16],[6,-23],3.2,2.8, piel);
return G(x, y, s, dir, b);
}

// comensal recostado sobre el codo izquierdo, cabeza a la izquierda; base del lecho en (0,0)
function comensal({ x, y, s = 1, dir = 1, cojin = ROJO, ropa = ROPAS[2], piel = PIELES[0], pelo = PELOS[0], gesto = 'feliz', pose = 'copa' }) {
let b = `<ellipse cx="-6" cy="-6" rx="9" ry="5" fill="${cojin}"${S5}/><path d="M-14 -6 h16" ${st('rgba(255,240,200,.6)', 1)}/>`;
b += `<path d="M0 -11 C10 -14 24 -12 34 -8 C36 -6 35 -2 32 -2 L0 -2Z" fill="${ropa}"${S6}/><ellipse cx="34.5" cy="-3.6" rx="2.6" ry="1.5" fill="${piel}"${S4}/>`;
b += seg([-3,-19],[-9,-9],4.6,3.8, ropa) + seg([-9,-9],[-1,-8],3.4,3, piel);
b += `<path d="M-6 -6 C-8 -14 -6 -22 -1 -25 C4 -26 8 -22 8 -16 C9 -10 8 -6 6 -4Z" fill="${ropa}"${S6}/><path d="M-4 -23 C0 -18 4 -12 7 -7"${NF}${st('rgba(255,255,255,.4)', 1.4)}/>`;
const h = pose === 'copa' ? [15,-27] : pose === 'come' ? [5,-27] : [16,-19];
b += seg([4,-22],[11,-16],4.4,3.6, ropa) + seg([11,-16], h, 3.4,3, piel) + `<circle cx="${h[0]}" cy="${h[1]}" r="1.8" fill="${piel}"${S5}/>`;
if (pose === 'copa') b += G(h[0], h[1] - 1,1,1, OBJ.copa);
b += G(1,22,1,1, cabeza({ piel, pelo, gesto }));
return G(x, y, s, dir, b);
}

/* ---------- arquitectura y muebles ---------- */
function columna(x, yb, h, w, gid) {
const a = r1(w / 2), c = r1(w * .42), e = r1(w * .64), t = r1(6 - h);
return G(x, yb, 1,1, `<rect x="${-r1(w * .78)}" y="-3" width="${r1(w * 1.56)}" height="3" fill="#9c8660"${S4}/><rect x="${-e}" y="-5.6" width="${2 * e}" height="2.8" rx="1.4" fill="#b9a47c"${S4}/><path d="M${-a} -5.6 L${-c} ${t} H${c} L${a} -5.6Z" fill="url(#${gid})"${S4}/><path d="M${-c} ${t} Q0 ${r1(t + 2.4)} ${c} ${t} L${e} ${t - 3} H${-e}Z" fill="#c4ae84"${S4}/><rect x="${-r1(w * .72)}" y="${-h}" width="${r1(w * 1.44)}" height="3" fill="#ad9670"${S4}/>`);
}
function lecho(x, y, w, cubre, uid) {
let b = `<rect x="${x}" y="${y - 10}" width="${w}" height="10" rx="3" fill="url(#${uid}c)"${S6}/><path d="M${x + 2} ${y - 1} h${w - 4}" ${st(cubre, 1.4)} stroke-dasharray="2 1.4"/>`;
b += `<rect x="${x - 2}" y="${y}" width="${w + 4}" height="3" fill="#7a4a24"${S5}/>`;
for (const lx of [x + 3, x + w / 2, x + w - 3]) b += `<path d="M${lx - 2} ${y + 3} h4 l-.8 3 l1.2 2 l-1.2 2 l.6 6 h-3.6 l.6 -6 l-1.2 -2 l1.2 -2Z" fill="#8a5a2e"${S4}/>`;
return b + `<path d="M${x + 1} ${y - 8} C${x - 6} ${y - 14} ${x - 6} ${y - 22} ${x + 1} ${y - 22} C${x + 4} ${y - 22} ${x + 4} ${y - 18} ${x + 1} ${y - 18}"${NF}${st('#7a5212', 2.4)}/><circle cx="${x + 1}" cy="${y - 19.6}" r="1.8" fill="${ORO}"/>`;
}
const llama = (x, y, k = 1, uid) => `<circle cx="${x}" cy="${y - 3 * k}" r="${18 * k}" fill="url(#${uid}l)"/><path d="M${x} ${y} C${x - 3 * k} ${y - 3 * k} ${x - 1 * k} ${y - 6 * k} ${x} ${y - 9 * k} C${x + 1.6 * k} ${y - 6 * k} ${x + 3 * k} ${y - 3 * k} ${x} ${y}Z" fill="#f6b13c"/><path d="M${x} ${y} C${x - 1.2 * k} ${y - 2 * k} ${x} ${y - 4 * k} ${x} ${y - 5 * k} C${x + .8 * k} ${y - 3 * k} ${x + 1.2 * k} ${y - 2 * k} ${x} ${y}Z" fill="#fff2b0"/>`;
const candelabro = (x, y, h, uid) => `<path d="M${x - 6} ${y} L${x} ${y - 5} L${x + 6} ${y}"${NF}${st('#6a4a1c', 1.4)}/><path d="M${x} ${y - 4} V${y - h}" ${st('#8a6428', 1.6)}/><path d="M${x - 5} ${y - h} h10 l-2 2 h-6z" fill="${BRONCE}"/><path d="M${x - 3} ${y - h - 3} q4 -2 8 0 l-3 2 h-5z" fill="#7a5212"/>${llama(x + 3, y - h - 4,1, uid)}`;

// templo toscano lejano (Júpiter en el Capitolio): w de ancho, base en (x,y)
const templo = (x, y, w) => G(x, y, w / 50,1, `<path d="M-23 0 V-9 H23 V0Z" fill="#c9b48a"${st('#6e5536', .5)}/><path d="M-26 -9 L0 -21 L26 -9Z" fill="#a8453a"${st('#6e5536', .5)}/><path d="M-17 0 V-9 M-7 0 V-9 M7 0 V-9 M17 0 V-9" ${st('#8a7350', 1.6)}/>`);

/* ---------- caballo de perfil, mirando a la derecha; cascos en y=0 ---------- */
const PATAS = {
paso: { fn: [[24,-40],[32,-23],[28,-11],[30.5,-7]], ff: [[21,-40],[23,-19],[23,-6],[25,-1.5]], hn: [[-24,-44],[-32,-22],[-30,-6],[-28.5,-1.5]], hf: [[-21,-44],[-26,-23],[-19,-10],[-16.5,-6]] },
galope: { fn: [[24,-40],[37,-31],[48,-28],[52.5,-26]], ff: [[21,-40],[32,-27],[27,-17],[29.5,-13]], hn: [[-24,-44],[-38,-31],[-52,-26],[-56,-24.5]], hf: [[-21,-44],[-23,-27],[-13,-18],[-10,-15]] }
};
const CAPAS = { blanco: ['#f6f2e8', '#c9bea6', '#e8e0cc', '#8a7e66'], bayo: ['#a8653a', '#6a3a1c', '#2a1a10', '#3a2010'], negro: ['#4a3a2e', '#241a12', '#1a120c', '#120c08'], tordo: ['#c4beb2', '#8a8478', '#e8e4dc', '#4a463e'] };
function caballo({ x, y, s = 1, dir = 1, capa = 'blanco', pose = 'paso', penacho = '', arnes = ROJO }) {
const id = 'cb' + (++N), [c, sh, crin, casco] = CAPAS[capa], p = PATAS[pose], gal = pose === 'galope';
const pata = (pts, ws, f) => { const e = pts[pts.length - 1], q = pts[pts.length - 2], a = Math.atan2(e[1] - q[1], e[0] - q[0]) * 180 / Math.PI - 90;
return miembro(pts, ws, f, P, .5) + `<path d="M-2.4 -1.6 L2.4 -1.6 L3.2 1.6 L-2.8 1.6Z" fill="${casco}" transform="translate(${r1(e[0])} ${r1(e[1])}) rotate(${r1(a)})"/>`; };
const WF = [9,5,3.8,3.4], WH = [13,5.6,4,3.4];
let b = `<defs>${lin(id, [c, c, sh])}</defs><ellipse cx="-2" cy="1" rx="40" ry="3" fill="rgba(40,25,10,.22)"/>`;
b += pata(p.ff, WF, sh) + pata(p.hf, WH, sh);
b += `<path d="M-39 -58 C${gal ? '-52 -60 -64 -54 -72 -50' : '-50 -54 -52 -38 -48 -18'}"${NF}${st(crin, 6)}${LC}/><path d="M-40 -56 C${gal ? '-52 -56 -60 -50 -70 -45' : '-47 -50 -50 -36 -45 -20'} M-40 -58 C${gal ? '-54 -62 -62 -58 -74 -54' : '-50 -56 -54 -40 -51 -22'}"${NF}${st(sh, 1)}/>`;
b += `<path d="M-38 -57 C-34 -63 -28 -65 -21 -63 C-13 -60 -2 -59 8 -61 C12 -63 15 -64 18 -64 C23 -70 26 -78 31 -87 C33 -90 37 -91 39.5 -88.5 C44 -82 49 -75 53.5 -68.5 C55 -65.5 53 -63 50 -63.4 C46 -63.6 42.5 -65 39.5 -68.6 C37 -71 34 -71.4 32.5 -69 C30.6 -63 31.6 -56 32 -49 C32 -43 29 -38 25 -35 C14 -32 -4 -31.5 -16 -33 C-23 -34 -29 -36.5 -34 -40.5 C-40 -45 -42 -51 -38 -57Z" fill="url(#${id})"${S7}/>`;
b += `<path d="M18 -60 C27 -55 28 -45 24 -37 M-28 -60 C-19 -52 -20 -42 -25 -36 M-10 -58 C2 -57 10 -59 16 -62 M34 -80 C37 -76 40 -72 46 -70 M-6 -34 C2 -33 10 -34 16 -35"${NF}${st(sh, .8)}/><path d="M-30 -61 C-20 -59 -6 -57.6 8 -60"${NF}${st('rgba(255,255,255,.55)', 1.4)}/>`;
b += `<path d="M31 -86 L30.6 -95 L35.4 -88.6Z" fill="${c}"${S6}/><path d="M33.6 -88 L36 -96 L38.6 -88.6Z" fill="${sh}"${S5}/>`;
for (let i = 0; i < 9; i++) { const t = i / 8, mx = 32 - t * 17, my = -88 + t * 25; b += `<path d="M${r1(mx)} ${r1(my)} q${r1(-4 - t * 2)} ${r1(3 + t)} ${r1(-3 - t * 3)} ${r1(8 + t * 2)}"${NF}${st(crin, 2.6)}${LC}/>`; }
b += `<path d="M34 -89 q4 1 6 4"${NF}${st(crin, 2)}/>`;
b += `<ellipse cx="41.4" cy="-81.6" rx="1.7" ry="1.3" fill="#1a120a"/><circle cx="42" cy="-82" r=".45" fill="#fff"/><path d="M39.6 -83.6 q2 -1.2 3.6 0" fill="none"${S5}/><path d="M51.6 -68.6 q-1.2 -.6 -1.4 .8" fill="none"${S8}/><path d="M53 -64.6 q-2 .6 -4 -.2" fill="none"${S5}/>`;
b += `<path d="M37.6 -84 L46.6 -66.4 M44 -71.6 C47.6 -73 51 -72 53.2 -70 M34 -86 C33 -80 33.6 -74 35.6 -71"${NF}${st(arnes, 1.1)}/><path d="M46 -67 C30 -60 6 -52 -14 -54"${NF}${st('#4a2e14', .8)}/>`;
b += `<path d="M16 -62 C22 -56 28 -50 32 -46"${NF}${st(arnes, 2.4)}/><circle cx="25" cy="-54.6" r="1.6" fill="${ORO}"${st('#7a5212', .4)}/>`;
if (penacho) b += `<path d="M33 -90 C31 -100 36 -104 40 -103 C37 -100 37 -96 36 -90Z" fill="${penacho}"${S4}/>`;
b += pata(p.fn, WF, c) + pata(p.hn, WH, c);
return G(x, y, s, dir, b);
}
// carro con rueda de 8 radios, mirando a la derecha; suelo en y=0
const carro = (color = ORO, uid = '') => { let b = `<path d="M-14 -14 L-14 -36 Q-12 -46 6 -48 Q14 -48 17 -40 L19 -16Z" fill="${uid ? `url(#${uid}o)` : color}"${S7}/>${uid ? `<path d="M-8 -36 C-2 -30 6 -30 12 -36 M-6 -26 C0 -20 8 -20 14 -26"${NF}${st('#5d7a2a', 1.4)}/><circle cx="3" cy="-34" r="2" fill="#f6eac0"/>` : ''}<path d="M-10 -38 Q2 -42 13 -38 M-10 -28 Q2 -32 15 -28"${NF}${st('#7a5212', .8)}/><path d="M17 -18 L52 -30" ${st('#5a3a18', 1.8)}/>`;
b += `<circle cx="2" cy="-12" r="12"${NF}${st('#5a3a18', 2.6)}/>${[0,1,2,3].map(i => `<path d="M${r1(2 + 11 * Math.cos(i * .785))} ${r1(-12 + 11 * Math.sin(i * .785))} L${r1(2 - 11 * Math.cos(i * .785))} ${r1(-12 - 11 * Math.sin(i * .785))}" ${st('#7a5228', 1.1)}/>`).join('')}<circle cx="2" cy="-12" r="2.4" fill="${BRONCE}"${S5}/>`;
return b; };
// cuadriga: cuatro caballos escalonados en profundidad (de atrás adelante)
const cuadriga = (pose, capas, arnes, penacho) => [[-10,-7,.96],[-6,-4.5,.98],[-3,-2,.99],[0,0,1]].map(([dx, dy, k], i) => `<g opacity="${i < 2 ? .92 : 1}">${caballo({ x: dx, y: dy, s: k, capa: capas[i % capas.length], pose: i % 2 ? pose : (pose === 'paso' ? 'paso' : 'galope'), arnes, penacho })}</g>`).join('');

/* ---------- toro de sacrificio, mirando a la derecha ---------- */
function toro({ x, y, s = 1, dir = 1 }) {
const id = 'to' + (++N), c = '#f2ece0', sh = '#c4b89e';
const pata = (pts, ws, f) => miembro(pts, ws, f, P, .5) + `<path d="M${pts[3][0] - 2.6} ${pts[3][1] - 1} h5.4 l.6 2.4 h-6.4z" fill="#3a2e22"/>`;
let b = `<defs>${lin(id, [c, c, sh])}</defs><ellipse cy="1" rx="40" ry="3" fill="rgba(40,25,10,.25)"/>`;
b += pata([[26,-28],[27,-14],[27,-4],[28,-1]],[9,5.4,4.6,4.4], sh) + pata([[-26,-32],[-31,-16],[-27,-4],[-26,-1]],[12,5.6,4.6,4.4], sh);
b += `<path d="M-40 -48 C-46 -40 -46 -28 -45 -14"${NF}${st('#8a7e66', 1.6)}/><path d="M-45 -16 c-2 2 -1 6 1 7 c1 -3 1 -5 -1 -7z" fill="#5a4a38"/>`;
b += `<path d="M-40 -50 C-38 -56 -30 -58 -18 -58 C-4 -58 6 -62 14 -66 C20 -68 26 -64 30 -58 C34 -56 40 -54 44 -51 C48 -48 52 -40 54 -34 C55 -31 52 -29 49 -30 C45 -31 42 -33 40 -36 C36 -36 34 -32 32 -27 C30 -21 26 -21 24 -25 C20 -25 14 -23 6 -23 C-10 -22 -24 -24 -32 -28 C-40 -32 -44 -42 -40 -50Z" fill="url(#${id})"${S7}/>`;
b += `<path d="M-10 -60 L4 -61.4 L6 -40 C2 -38 -6 -38 -10 -39Z" fill="${ROJO}"${S5}/><path d="M-10 -40 C-6 -38 2 -38 6 -40"${NF}${st('#f6f0de', 1.6)} stroke-dasharray="1.2 1"/>`;
b += `<path d="M41 -52 C43 -60 49 -63 52 -58"${NF}${st('#efe6cc', 2.6)}${LC}/><path d="M41 -52 C43 -60 49 -63 52 -58" fill="none"${S4}/><path d="M38 -52 l-4 -3 l3 4z" fill="${c}"${S5}/>`;
b += `<path d="M45 -57 C44 -50 46 -44 44 -36 M47 -58 C48 -50 50 -46 49 -38"${NF}${st('#fff', 1.8)} stroke-dasharray="2.4 1"/><path d="M44 -36 l-1 6 M49 -38 l1 6" ${st(ROJO, 1.2)}/>`;
b += `<ellipse cx="45.6" cy="-46" rx="1.3" ry="1" fill="#1a120a"/><path d="M51.6 -33.6 q-1.4 -.4 -1.6 .9" fill="none"${S7}/>`;
b += pata([[22,-28],[24,-14],[23,-4],[24,-1]],[9,5.4,4.6,4.4], c) + pata([[-28,-32],[-35,-16],[-33,-4],[-32,-1]],[12,5.6,4.6,4.4], c);
return G(x, y, s, dir, b);
}

/* ---------- gladiador (samnita: escudo largo, casco con penacho, greba, gladius) ---------- */
function gladiador({ x, y, s = 1, dir = 1, color = ROJO, pluma = '#e8dcc0', ataca = 1, piel = PIELES[1] }) {
let b = `<ellipse cy=".4" rx="11" ry="2" fill="rgba(40,25,10,.25)"/>`;
b += miembro([[-3,-17],[-6,-9],[-10,-1]],[5,4,3.4], piel) + miembro([[3,-17],[9,-10],[11,-1]],[5,4,3.4], piel) + `<path d="M7.6 -9 L10.6 -9.6 L12 -2 L9.4 -2Z" fill="${BRONCE}"${S4}/><path d="M-13 -.4 h5 M9 -.4 h5.4" ${st('#4a2e14', 1.6)}/>`;
b += `<path d="M-6 -43 C-8 -34 -8 -24 -6 -18 L6 -18 C8 -24 8 -34 6 -43 Q0 -45 -6 -43Z" fill="${piel}"${S6}/><path d="M-3 -38 Q0 -36 3 -38 M0 -36 V-24"${NF}${st('rgba(90,50,20,.5)', .6)}/>`;
b += `<path d="M-7 -21 L7 -21 L6 -14 Q0 -11 -6 -14Z" fill="#efe6cc"${S5}/><rect x="-7.4" y="-23" width="14.8" height="3" fill="${BRONCE}"${S4}/>`;
const H = ataca ? [[-9,-50],[-4,-60]] : [[-10,-34],[-4,-30]];
b += seg([-5,-41], H[0],4.4,3.6, piel) + seg(H[0], H[1],3.6,3, piel) + G(H[1][0], H[1][1],1,1, `<path d="M0 0 L${ataca ? '14 -4' : '15 -3'}" ${st('#cfd4d6', 1.8)}/><path d="M-1 -1.6 L1 1.6" ${st('#5a3a18', 1.6)}/>`);
b += G(0,0,1,1, cabeza({ piel, casco: pluma }));
b += `<g transform="rotate(-6 10 -28)"><rect x="5" y="-46" width="11" height="34" rx="4" fill="${color}"${S8}/><circle cx="10.5" cy="-29" r="2.6" fill="${BRONCE}"${S5}/><path d="M10.5 -44 V-32 M10.5 -26 V-14" ${st('rgba(0,0,0,.25)', .8)}/></g>`;
return G(x, y, s, dir, b);
}

/* ---------- retrato de busto de un consejero (120×140) ---------- */
// edil: mercader, toga sencilla, tablilla de cera · cónsul: coraza musculada, paludamento rojo, casco itálico al brazo ·
// pontífice: toga praetexta sobre la cabeza (capite velato) y pátera
export function consejero(cargo = 'edil', gesto = '') {
const u = 'cj' + (++N), piel = cargo === 'consul' ? '#c98d5e' : cargo === 'pontifice' ? '#dcae86' : '#d9a77a';
const fondo = { edil: ['#f0dba6', '#d6b06a'], consul: ['#e2a07a', '#a8543a'], pontifice: ['#d8dcc8', '#9aa888'] }[cargo] || ['#eee', '#ccc'];
let b = `<defs>${lin(u + 'f', fondo)}${lin(u + 'b', ['#f2d38a', '#b98a3e', '#7a5212'],1)}<radialGradient id="${u}p" cx=".4" cy=".4"><stop offset="0" stop-color="#f0c79e"/><stop offset=".6" stop-color="${piel}"/><stop offset="1" stop-color="#a8704a"/></radialGradient><clipPath id="${u}c"><path d="M8 140 V40 A52 34 0 0 1 112 40 V140Z"/></clipPath></defs>`;
b += `<rect x="1" y="1" width="118" height="138" rx="10" fill="#c2913a"${st('#5a3c10', 1.4)}/><path d="M8 140 V40 A52 34 0 0 1 112 40 V140Z" fill="url(#${u}f)"/><g clip-path="url(#${u}c)">`;
// cuerpo
if (cargo === 'consul') {
b += `<path d="M6 140 C8 112 20 100 38 96 L82 96 C100 100 112 112 114 140Z" fill="${ROJO}"${S8}/><path d="M28 140 C26 120 32 106 42 100 L78 100 C88 106 94 120 92 140Z" fill="url(#${u}b)"${S8}/>`;
b += `<path d="M48 108 Q52 116 60 112 Q68 116 72 108 M60 104 V140 M46 126 Q60 132 74 126"${NF}${st('#6a4410', 1)}/><circle cx="51" cy="113" r="1.2" fill="#6a4410"/><circle cx="69" cy="113" r="1.2" fill="#6a4410"/><path d="M42 100 L46 112 M78 100 L74 112" ${st('#f6dc9a', 2)}/>`;
b += `<path d="M78 98 C92 104 104 118 110 140 L98 140 C94 124 86 110 76 104Z" fill="#8a1a12"/><circle cx="80" cy="100" r="4.4" fill="${ORO}"${st('#7a5212', .8)}/><circle cx="80" cy="100" r="1.6" fill="#a87a22"/>`;
b += `<g transform="translate(24 124)"><path d="M-14 6 C-14 -10 14 -10 14 6 L18 8 L-18 8Z" fill="url(#${u}b)"${S8}/><circle cy="-8" r="2.6" fill="${BRONCE}"${S5}/><path d="M0 -10 C-4 -22 10 -28 20 -18"${NF}${st(ROJO, 4)}${LC}/><path d="M-12 6 L-14 14 L-6 12Z M12 6 L14 14 L6 12Z" fill="#9a7030"${S5}/></g><path d="M8 132 Q20 120 34 124"${NF}${st(piel, 6)}/>`;
} else {
const borde = cargo === 'pontifice';
b += `<path d="M6 140 C8 112 22 98 40 95 L80 95 C98 98 112 112 114 140Z" fill="${cargo === 'edil' ? '#b9a27c' : '#e9dfc6'}"${S8}/>`;
b += `<path d="M10 140 C14 116 28 100 46 96 L56 98 C70 112 86 126 94 140Z" fill="${TOGA}"${S8}/><path d="M24 128 C40 120 58 122 76 134 M18 116 C34 110 50 112 64 120 M36 102 C46 106 54 112 60 120"${NF}${st(PLIEGUE, 1.2)}/>`;
if (borde) b += `<path d="M46 96 L56 98 C70 112 86 126 94 140"${NF}${st(PURP, 3.6)}/>`;
if (cargo === 'edil') b += `<g transform="translate(84 116) rotate(-12)"><rect x="-12" y="-14" width="24" height="30" rx="2" fill="#9a6a34"${S8}/><rect x="-9" y="-11" width="18" height="24" fill="#3a2a1a"/><path d="M-6 -6 h12 M-6 -1 h9 M-6 4 h12 M-6 9 h7" ${st('#c9b48a', .8)}/></g><path d="M100 140 C96 130 92 124 84 124"${NF}${st(piel, 7)}${LC}/>`;
else b += `<path d="M98 140 C96 128 90 120 82 118"${NF}${st('#e9dfc6', 9)}/><circle cx="82" cy="117" r="4.6" fill="${piel}"${S6}/><ellipse cx="80" cy="112" rx="13" ry="4" fill="url(#${u}b)"${st('#7a5212', .8)}/><ellipse cx="80" cy="111" rx="4" ry="1.4" fill="#a87a22"/>`;
}
// cabeza
b += `<path d="M52 84 h16 v16 q-8 4 -16 0z" fill="${piel}"${S6}/>`;
if (cargo === 'pontifice') b += `<path d="M30 104 C24 80 28 40 60 36 C92 40 96 80 90 104 C84 98 80 92 78 84 C80 64 74 52 60 52 C46 52 40 64 42 84 C40 92 36 98 30 104Z" fill="${TOGA}"${S8}/><path d="M36 92 C32 70 38 46 60 42 M84 92 C88 70 82 46 60 42"${NF}${st(PLIEGUE, 1.2)}/>`;
b += `<ellipse cx="41" cy="68" rx="3" ry="5.6" fill="${piel}"${S6}/><ellipse cx="79" cy="68" rx="3" ry="5.6" fill="${piel}"${S6}/><ellipse cx="60" cy="64" rx="18" ry="22" fill="url(#${u}p)"${S8}/>`;
const pelo = cargo === 'consul' ? '#4a3a2e' : cargo === 'edil' ? '#3a2416' : '#bdb6a8';
if (cargo === 'edil') b += `<g fill="${pelo}">${[44,49,54,60,66,71,76].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 44 : 46.4}" r="4.6"/>`).join('')}<circle cx="42" cy="52" r="3.6"/><circle cx="78" cy="52" r="3.6"/></g>`;
else if (cargo === 'consul') b += `<path d="M42 62 C40 44 50 40 60 40.4 C70 40 80 44 78 62 C76 54 72 50 60 49.6 C48 50 44 54 42 62Z" fill="${pelo}"/><path d="M71 56 l4 6" ${st('#a0603a', .9)}/>`;
else b += `<path d="M44 52 C50 47 70 47 76 52 C70 50 50 50 44 52Z" fill="${pelo}"/><path d="M47 76 q2 2 1 5 M73 76 q-2 2 -1 5 M52 51 q8 -2 16 0"${NF}${st('#a8704a', .7)}/>`;
const cej = gesto === 'serio' ? 'M48 56 l8 2.6 M72 56 l-8 2.6' : gesto === 'contento' ? 'M48 57 q4 -3 8 -.6 M64 56.4 q4 -2.4 8 .6' : 'M48 57.4 q4 -1.6 8 0 M64 57.4 q4 -1.6 8 0';
b += `<path d="${cej}"${NF}${st('#3a2416', 1.6)}${LC}/>`;
b += gesto === 'contento' ? `<path d="M49 63.4 q3 -2.4 6 0 M65 63.4 q3 -2.4 6 0"${NF}${st(P, 1.3)}/>` : `<ellipse cx="52" cy="63" rx="3.2" ry="2" fill="#fbf6ea"${S5}/><ellipse cx="68" cy="63" rx="3.2" ry="2" fill="#fbf6ea"${S5}/><circle cx="52.6" cy="63" r="1.5" fill="#3a2416"/><circle cx="68.6" cy="63" r="1.5" fill="#3a2416"/><path d="M48.6 61.6 q3.4 -1.8 6.8 0 M64.6 61.6 q3.4 -1.8 6.8 0" fill="none"${S7}/>`;
b += `<path d="M60 63 C59 68 57 71 57 73 Q60 75 63 73"${NF}${st('#8a5a3a', 1.1)}/>`;
b += gesto === 'contento' ? `<path d="M52 77 Q60 84 68 77" fill="#8a2a1a"${st('#6e2a12', 1)}/><path d="M54 77.6 Q60 80 66 77.6" fill="#fff"/>`
: gesto === 'serio' ? `<path d="M53 79 Q60 76.6 67 79"${NF}${st('#6e2a12', 1.3)}/><path d="M55 54 v3 M65 54 v3" ${st('rgba(110,60,30,.45)', .8)}/>`
: `<path d="M54 78 Q60 79.6 66 78"${NF}${st('#6e2a12', 1.2)}/>`;
if (cargo === 'pontifice') b += `<path d="M30 104 C24 80 28 40 60 36 C92 40 96 80 90 104"${NF}${st(PURP, 3)}/>`;
b += `</g><path d="M8 140 V40 A52 34 0 0 1 112 40 V140"${NF}${st('#5a3c10', 1.4)}/>`;
return svg(b, { edil: 'Edil', consul: 'Cónsul', pontifice: 'Pontífice' }[cargo] || cargo, 120,140, 'consejero');
}

/* ---------- consejo del año: los tres consejeros ante el plano de la ciudad ---------- */
// Fuente: Livio (los magistrados reunidos con sus consejeros, «consilium»); sala de casa con columnas toscanas (Vitrubio 4.7).
export function escenaConsejo() {
const u = 'co' + (++N);
let b = `<defs>${lin(u + 'w', ['#ecd8a8', '#cfae74'])}${lin(u + 's', ['#9cc4e0', '#e8eef0'])}${lin(u + 'm', ['#8a5a32', '#5e3a1c'])}${lin(u + 'k', ['#b8a07a', '#e8d6aa', '#a8916a'],1)}${rad(u + 'l', '#ffd27a', .5)}</defs>`;
b += `<rect width="360" height="200" fill="url(#${u}w)"/><rect y="112" width="360" height="30" fill="#9c3b24"/><path d="M0 112 H360 M0 142 H360" ${st('#3a1a0e', 1.4)}/>`;
b += `<rect x="128" y="22" width="104" height="80" fill="url(#${u}s)"${st('#5a3a18', 2)}/><path d="M128 92 Q150 74 176 82 Q200 70 232 84 V102 H128Z" fill="#9aa86a"/>${templo(176,82,46)}`;
b += `<path d="M128 102 L60 200 H300 L232 102Z" fill="#fff4d0" opacity=".18"/><rect y="142" width="360" height="58" fill="url(#${u}m)"/><path d="M0 0 H360 V14 H0Z" fill="#6a4424"/><path d="M0 14 H360 V20 H0Z" fill="#b8562a"/>`;
b += columna(40,160,140,14, u + 'k') + columna(320,160,140,14, u + 'k') + candelabro(18,190,70, u) + candelabro(342,190,70, u);
b += fig({ x: 96, y: 186, s: 1.75, ropa: '#b9a27c', toga: 1, br: 'senala', bi: 'pecho', objI: OBJ.tablilla, pelo: PELOS[0], gesto: 'feliz' });
b += fig({ x: 180, y: 182, s: 1.8, coraza: 1, capa: ROJO, br: 'cadera', bi: 'frente', objI: OBJ.casco, piel: PIELES[1], pelo: PELOS[1], barba: 1 });
b += fig({ x: 264, y: 186, s: 1.75, dir: -1, toga: 1, borde: 1, velo: 1, br: 'frente', bi: 'abajo', objD: OBJ.lituus, piel: PIELES[3] });
b += `<path d="M48 160 Q180 140 312 160 L318 172 Q180 152 42 172Z" fill="#7a4a24"${S8}/><ellipse cx="180" cy="158" rx="134" ry="13" fill="#a8703a"${S8}/><path d="M46 160 Q180 184 314 160 V200 H46Z" fill="#6a3e1e"${S8}/><path d="M70 170 V200 M290 170 V200 M180 176 V200" ${st('#4a2e14', 1)}/>`;
b += `<path d="M126 150 L232 150 L240 166 L118 166Z" fill="#efe0b8"${st('#8a7350', .8)}/><path d="M140 160 C148 152 172 150 186 154 C200 150 216 154 222 162 C206 166 160 166 140 160Z"${NF}${st('#8a4a24', 1.4)}/><path d="M150 166 C156 160 152 154 160 150"${NF}${st('#5a8aa8', 2)}/>${[[176,156],[192,159],[206,157],[168,161]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#9aa86a"/>`).join('')}<path d="M183 154 l3 -3 l3 3z" fill="${ROJO}"/>`;
return svg(b, 'El consejo del año');
}

/* ---------- banquete en el triclinio ---------- */
// Fuente: Varrón (en Gelio 13.11) y Vitrubio 6.7: tres lechos en U, tres comensales por lecho, recostados sobre el codo izquierdo.
export function escenaBanquete(bando = 'mer') {
const u = 'bq' + (++N), c = BANDO[bando] || BANDO.mer;
let b = `<defs>${lin(u + 'w', ['#8e2f1e', '#6a1f14'])}${lin(u + 'c', ['#efe6cc', '#c9b48a'])}${lin(u + 'f', ['#c9b48a', '#8a7350'])}${rad(u + 'l', '#ffd27a', .55)}</defs>`;
b += `<rect width="360" height="200" fill="url(#${u}w)"/><rect y="0" width="360" height="14" fill="#2a120c"/>${[0,1,2,3].map(i => `<rect x="${12 + i * 88}" y="22" width="72" height="60"${NF}${st('#e2b13c', .9)}/>`).join('')}<rect y="86" width="360" height="22" fill="#1e1410"/><path d="M0 86 H360" ${st(ORO, 1)}/>`;
b += `<rect y="108" width="360" height="92" fill="url(#${u}f)"/>`;
b += candelabro(26,178,80, u) + candelabro(334,178,80, u);
b += lecho(92,112,176, c, u);
[[110, 'copa'],[168, 'habla'],[226, 'come']].forEach(([x, pose], i) => { b += comensal({ x, y: 102, s: 1.05, cojin: c, ropa: ROPAS[2 + i], piel: PIELES[i], pelo: PELOS[i + 1], pose }); });
b += fig({ x: 300, y: 150, s: 1.3, dir: -1, ropa: '#c9b48a', br: 'jarra', bi: 'abajo', objD: OBJ.jarra, piel: PIELES[2], pelo: PELOS[1], gesto: 'feliz' });
b += `<ellipse cx="180" cy="150" rx="40" ry="9" fill="#7a4a24"${S8}/><path d="M150 152 L146 172 M180 158 V176 M210 152 L214 172" ${st('#5a3a18', 3)}/>`;
b += `<ellipse cx="168" cy="146" rx="9" ry="3" fill="#d8ccb0"${S5}/><path d="M161 145 q7 -4 14 0 q-7 3 -14 0z" fill="#8aa0a8"${S4}/>${[0,1,2,3,4,5].map(i => `<circle cx="${194 + (i % 3) * 2.4}" cy="${143 + Math.floor(i / 3) * 2.4}" r="1.6" fill="#5a2a5a"/>`).join('')}<ellipse cx="184" cy="148" rx="5" ry="3" fill="#c8964a"${S4}/><path d="M204 140 h6 l-1 6 h-4z" fill="#b86a3a"${S4}/>`;
b += lecho(-30,186,120, c, u) + lecho(270,186,120, c, u);
b += comensal({ x: 20, y: 176, s: 1.3, cojin: c, ropa: ROPAS[4], piel: PIELES[1], pelo: PELOS[3], pose: 'copa' }) + comensal({ x: 340, y: 176, s: 1.3, dir: -1, cojin: c, ropa: ROPAS[5], piel: PIELES[3], pelo: PELOS[0], pose: 'habla' });
return svg(b, 'Banquete en el triclinio');
}

/* ---------- juegos: munus en el Foro Boario o carreras en el Circo ---------- */
// Gladiadores: Valerio Máximo 2.4.7 y Livio, Periocha 16 (264 a.C., tres parejas en el Foro Boario por las exequias
// de Junio Bruto Pera; público de pie, sin anfiteatro). Carreras: Livio 1.35 y 8.20 (Circo Máximo con gradas y cárceres de madera).
export function escenaJuegos(tipo = 'gladiadores') {
const u = 'ju' + (++N), R = azar(tipo === 'carreras' ? 11 : 5);
let b = `<defs>${lin(u + 's', ['#a8cce4', '#f2e6c8'])}${lin(u + 't', ['#d8c08a', '#b89a62'])}${lin(u + 'o', ['#f2d38a', '#b98a3e'])}</defs><rect width="360" height="200" fill="url(#${u}s)"/>`;
if (tipo === 'carreras') {
b += `<path d="M0 70 Q40 40 100 50 Q140 56 160 70 Z" fill="#8a9a5a"/><path d="M200 72 Q260 44 360 56 V72Z" fill="#7d8c50"/>`;
b += `<path d="M0 70 H360 V96 H0Z" fill="#7a5228"/>${[0,1,2,3].map(i => `<path d="M0 ${74 + i * 6} H360" ${st('#4a2e14', .8)}/>`).join('')}`;
for (let i = 0; i < 120; i++) { const x = (i * 3.1) % 360, row = Math.floor(i / 30); b += `<circle cx="${r1(x + row * 1.4)}" cy="${73 + row * 6}" r="1.6" fill="${['#f3ead4', '#a88d63', ROJO, '#c9b48a', '#6e7a5a'][Math.floor(R() * 5)]}"/>`; }
b += `<path d="M0 96 H360 V200 H0Z" fill="url(#${u}t)"/><path d="M40 128 H330" ${st('#8a6a3a', 5)}/><path d="M40 126 H330" ${st('#c9a46a', 2)}/>`;
b += [330,336,342].map(x => `<path d="M${x - 3} 126 L${x} 104 L${x + 3} 126Z" fill="url(#${u}o)"${S5}/>`).join('') + `<rect x="324" y="124" width="22" height="5" fill="#8a6034"${S5}/>`;
[[190,144,.55, ROJO, ['bayo', 'negro']],[30,166,.7, '#f3ead4', ['blanco', 'tordo']],[200,198,.86, ROJO, ['negro', 'bayo']]].forEach(([x, y, k, col, capas], i) => {
b += `<ellipse cx="${x - 60 * k}" cy="${y - 4}" rx="${40 * k}" ry="${8 * k}" fill="#efe0b8" opacity=".55"/>`;
b += G(x, y, k, 1, carro('#8a5a2e') + fig({ x: -2, y: -16, s: .9, ropa: col, br: 'frente', bi: 'frente', piel: PIELES[i + 1], pelo: PELOS[i] }) + G(64,0,1,1, cuadriga('galope', capas, col)));
});
} else {
b += `<path d="M0 84 Q40 30 120 46 Q150 52 170 84Z" fill="#7d8c50"/><path d="M190 84 Q230 40 300 44 Q340 48 360 70 V84Z" fill="#8a9a5a"/>${templo(281,58,44)}`;
b += `<path d="M300 84 Q320 80 360 82 V100 H290Z" fill="#6a9ab8"/><path d="M292 86 H360" ${st('#6a4424', 3)}/>${[300,316,332,348].map(x => `<path d="M${x} 86 v12" ${st('#5a3a18', 2)}/>`).join('')}`;
b += `<rect y="84" width="300" height="20" fill="#c9b48a"/>${[0,1,2,3,4,5,6].map(i => `<rect x="${8 + i * 42}" y="88" width="30" height="16" fill="#2e2214"/><path d="M${4 + i * 42} 86 h38" ${st('#a8453a', 3)}/>`).join('')}`;
b += `<rect y="104" width="360" height="96" fill="url(#${u}t)"/>`;
for (let i = 0; i < 26; i++) { const x = 6 + i * 13.6 + R() * 4; b += fig({ x, y: 124 + R() * 4, s: .62, dir: x < 180 ? 1 : -1, ropa: R() < .3 ? '#4a4038' : ROPAS[Math.floor(R() * 8)], toga: R() < .4, togaColor: '#5a5048', br: R() < .3 ? 'alto' : 'abajo', piel: PIELES[i % 4], pelo: PELOS[i % 5], gesto: R() < .5 ? 'grito' : '' }); }
const cs = [[ROJO, '#3a5a8a'],[BANDO.mer, '#5d7a2a'],['#3a5a8a', ROJO]];
[70,180,290].forEach((x, i) => { b += gladiador({ x: x - 16, y: 168 - (i % 2) * 8, s: 1.05, color: cs[i][0], ataca: i !== 1 }) + gladiador({ x: x + 16, y: 168 - (i % 2) * 8, s: 1.05, dir: -1, color: cs[i][1], ataca: i === 1, piel: PIELES[i % 2 ? 0 : 2], pluma: '#a3231a' }); });
for (let i = 0; i < 7; i++) { const x = i < 3 ? 6 + i * 16 : 300 + (i - 3) * 16; b += fig({ x, y: 204, s: 1.15, dir: x < 180 ? 1 : -1, ropa: i % 3 ? ROPAS[i] : '#4a4038', toga: i % 3 === 0, togaColor: '#4a4038', br: i % 2 ? 'alto' : 'abajo', piel: PIELES[i % 4], pelo: PELOS[i % 5] }); }
}
return svg(b, tipo === 'carreras' ? 'Carreras en el Circo Máximo' : 'Combate de gladiadores en el Foro Boario');
}

/* ---------- rito: sacrificio ante un templo toscano ---------- */
// Fuente: relieve del «Ara de Domicio Ahenobarbo» (Louvre: toro con ínfulas, tibicen, oficiante velado) y Vitrubio 4.7 (templo toscano).
export function escenaRito() {
const u = 'ri' + (++N);
let b = `<defs>${lin(u + 's', ['#9cc4e0', '#f4ead0'])}${lin(u + 'k', ['#b8a07a', '#e2cea0', '#a8916a'],1)}${lin(u + 't', ['#cbb488', '#a8916a'])}${rad(u + 'l', '#ffb43c', .6)}</defs><rect width="360" height="200" fill="url(#${u}s)"/>`;
b += `<path d="M0 120 Q60 96 140 104 V130 H0Z" fill="#8a9a5a"/><rect y="150" width="360" height="50" fill="#bda77a"/><path d="M0 150 H360" ${st('#8a7350', 1)}/>`;
b += `<rect x="168" y="104" width="186" height="46" fill="url(#${u}t)"${S7}/><path d="M164 104 H358 M166 110 H356 M166 144 H356" ${st('#7a6648', 1.2)}/>${[0,1,2,3,4,5].map(i => `<rect x="212" y="${r1(110 + i * 6.6)}" width="100" height="6.6" fill="#c4ae84"${st('#7a6648', .5)}/>`).join('')}`;
b += `<rect x="178" y="50" width="168" height="54" fill="#4a3424"/><rect x="246" y="62" width="30" height="42" fill="#2a1a10"${st('#7a5212', 1)}/>`;
b += [186,228,296,338].map(x => columna(x, 104,58,10, u + 'k')).join('');
b += `<rect x="170" y="38" width="184" height="9" fill="#7a4a24"${S6}/>${[...Array(23)].map((_, i) => `<rect x="${171 + i * 8}" y="39.5" width="4" height="6" fill="${i % 2 ? '#1e1410' : '#e8d6aa'}"/>`).join('')}<rect x="170" y="42" width="184" height="1.6" fill="${ROJO}"/>`;
b += `<path d="M160 38 L262 6 L364 38Z" fill="#b8562a"${S8}/><path d="M178 34 L262 12 L346 34Z" fill="#6a2a14"/><path d="M234 30 C244 18 256 22 262 14 C268 22 280 18 290 30Z" fill="#d8a060" opacity=".7"/>${[...Array(13)].map((_, i) => `<path d="M${162 + i * 16} 38 q3 -6 6 0z" fill="#d88a4a"${S4}/>`).join('')}`;
b += `<g transform="translate(262 6)"><path d="M-3 0 L-2 -12 L2 -12 L3 0Z" fill="#c8703a"${S5}/><circle cy="-15" r="3" fill="#c8703a"${S5}/><path d="M2 -10 L8 -14" ${st('#c8703a', 1.6)}/></g>`;
b += `<path d="M126 40 C112 60 138 80 124 104 C118 116 126 124 122 136"${NF}${st('rgba(120,110,100,.35)', 10)}${LC}/>`;
b += `<rect x="106" y="144" width="36" height="28" fill="#c4ae84"${S7}/><rect x="102" y="138" width="44" height="7" fill="#b39c72"${S7}/><path d="M104 138 c-4 0 -4 -6 0 -6 h40 c4 0 4 6 0 6" fill="#d2bc90"${S6}/>${llama(124,132,2, u)}`;
b += fig({ x: 36, y: 188, s: 1.7, ropa: '#e9dfc6', br: 'boca', bi: 'boca', objD: OBJ.tibias, piel: PIELES[2], pelo: PELOS[1] });
b += fig({ x: 84, y: 190, s: 1.8, toga: 1, borde: 1, velo: 1, br: 'frente', bi: 'abajo', objD: OBJ.patera, piel: PIELES[3] });
b += toro({ x: 210, y: 188, s: 1.15, dir: -1 });
b += fig({ x: 286, y: 190, s: 1.65, dir: -1, ropa: '#efe6cc', br: 'frente', bi: 'alto', objI: OBJ.mazo, piel: PIELES[1], pelo: PELOS[0] }) + `<path d="M257 159 C246 158 238 156 234 152"${NF}${st('#efe6cc', 1.2)}/>`;
b += fig({ x: 334, y: 190, s: 1.5, dir: -1, toga: 1, br: 'pecho', piel: PIELES[0], pelo: PELOS[3] });
return svg(b, 'Sacrificio ante el templo');
}

/* ---------- el Senado en la Curia Hostilia ---------- */
// Fuente: Livio 1.30 y Varrón, De lingua latina 5.155 (Curia Hostilia en el Comicio); Polibio 6 (el Senado); bancos de madera.
export function escenaSenado(humor = 'bien') {
const u = 'se' + (++N), R = azar(humor.length * 7 + 3), rev = humor === 'revuelta', mal = humor === 'mal';
let b = `<defs>${lin(u + 'w', ['#d8c49a', '#b39c72'])}${lin(u + 'f', ['#a8603a', '#7a4024'])}${rad(u + 'l', '#ff9a3c', .7)}</defs>`;
b += `<rect width="360" height="200" fill="#8a7458"/><path d="M90 30 H270 V120 H90Z" fill="url(#${u}w)"/>${[0,1,2,3,4,5].map(i => `<path d="M90 ${42 + i * 14} H270" ${st('#9c8662', .6)}/>`).join('')}`;
b += `<path d="M0 0 L90 30 V120 L0 170Z" fill="#a8916a"/><path d="M360 0 L270 30 V120 L360 170Z" fill="#a08a64"/><path d="M0 0 H360 L270 30 H90Z" fill="#5a3a1e"/>${[0,1,2,3,4].map(i => `<path d="M${r1(i * 90)} 0 L${r1(90 + i * 45)} 30" ${st('#3a2412', 3)}/>`).join('')}`;
b += [130,180,230].map(x => `<rect x="${x - 8}" y="36" width="16" height="12" fill="#f4e6b8"/>`).join('');
b += `<path d="M0 170 L90 120 H270 L360 170 V200 H0Z" fill="url(#${u}f)"/>`;
b += `<path d="M150 112 H210 V122 H150Z" fill="#7a5228"${S6}/>`;
b += `<g transform="translate(180 112)"><path d="M-6 0 L6 -8 M6 0 L-6 -8" ${st('#e8dcc0', 1.4)}/><path d="M-7 -8 H7" ${st('#e8dcc0', 2)}/></g>` + senador({ x: 178, y: 104, s: .95, borde: 1, pose: rev ? 'senala' : mal ? 'cara' : 'alto', pelo: PELOS[3], gesto: mal || rev ? 'enfado' : 'feliz' });
b += fig({ x: 146, y: 120, s: .9, ropa: ROJO, br: 'pecho', objD: OBJ.fasces, piel: PIELES[1] }) + fig({ x: 214, y: 120, s: .9, dir: -1, ropa: ROJO, br: 'pecho', objD: OBJ.fasces, piel: PIELES[2] });
const poses = humor === 'bien' ? ['aplaude', 'alto', 'mano', 'aplaude'] : mal ? ['cruza', 'cara', 'cruza', 'mano'] : ['senala', 'alto', 'cruza', 'senala'];
const gest = humor === 'bien' ? ['feliz', 'feliz', ''] : mal ? ['enfado', '', 'enfado'] : ['grito', 'enfado', 'grito'];
const GR = [[[88,124],[-6,168]],[[96,130],[24,186]],[[104,136],[58,204]]];
GR.forEach(([a, z], fila) => [-1,1].forEach(lado => {
const X = v => lado < 0 ? v : 360 - v;
b += `<path d="M${X(a[0])} ${a[1] + 2} L${X(z[0])} ${z[1] + 2} L${X(z[0])} ${z[1] + 9} L${X(a[0])} ${a[1] + 5}Z" fill="#6a4424"${S5}/>`;
for (let i = 0; i < 5; i++) {
const t = (i + .5) / 5, x = X(a[0] + (z[0] - a[0]) * t), y = a[1] + (z[1] - a[1]) * t, k = .7 + t * .8;
b += rev && R() < .35 ? fig({ x, y: y + 4, s: k * .9, dir: 1, toga: 1, br: 'senala', piel: PIELES[i % 4], pelo: PELOS[(i + fila) % 5], gesto: 'grito' })
: senador({ x, y, s: k, dir: -lado, pose: poses[Math.floor(R() * 4)], piel: PIELES[(i + fila) % 4], pelo: PELOS[(i + fila * 2) % 5], gesto: gest[Math.floor(R() * 3)] });
}
}));
if (rev) {
b += `<path d="M322 64 L360 52 V160 L322 150Z" fill="#2a1408"${st(P, 1)}/><circle cx="342" cy="110" r="60" fill="url(#${u}l)"/>`;
for (let i = 0; i < 4; i++) b += fig({ x: 330 + i * 9, y: 150 - i * 2, s: .8 + i * .04, dir: -1, ropa: ['#6a4a30', '#5a4a3a', '#7a5a3a', '#4a3a2a'][i], br: i % 2 ? 'alto' : 'senala', objD: i % 2 ? OBJ.antorcha : '', piel: PIELES[2], pelo: PELOS[1], gesto: 'grito' });
b += `<path d="M300 0 C320 20 300 40 330 60"${NF}${st('rgba(60,40,30,.3)', 14)}/><rect width="360" height="200" fill="#ff6a20" opacity=".08"/>`;
}
if (mal) b += `<rect width="360" height="200" fill="#2a2a40" opacity=".12"/>`;
return svg(b, humor === 'revuelta' ? 'Revuelta ante la Curia' : humor === 'mal' ? 'El Senado, descontento' : 'El Senado, satisfecho');
}

/* ---------- el triunfo: cuadriga de caballos blancos con el general ---------- */
// Fuente: Livio 5.23 y 10.7 (caballos blancos, toga picta, cetro de marfil), Plinio, Historia natural 33.111 (rostro pintado
// de minio) y Tertuliano, Apologético 33 (el esclavo que sostiene la corona y le recuerda que es mortal).
export function caballoTriunfo() {
const u = 'tr' + (++N), R = azar(17);
let b = `<defs>${lin(u + 's', ['#8cc0e2', '#f6ead0'])}${lin(u + 'o', ['#f6dc8a', '#c2913a', '#8a6420'])}${lin(u + 'k', ['#b8a07a', '#e2cea0', '#a8916a'],1)}</defs><rect width="360" height="200" fill="url(#${u}s)"/>`;
b += `<path d="M0 90 Q50 40 120 52 Q150 60 170 90Z" fill="#8a9a5a"/>${templo(70,64,66)}`;
b += `<path d="M160 90 Q240 60 360 70 V90Z" fill="#7d8c50"/>`;
for (let i = 0; i < 46; i++) { const x = i * 8 + R() * 4, y = 108 + (i % 3) * 5; b += `<g transform="translate(${r1(x)} ${r1(y)})"><path d="M-4 14 C-4 4 -2 1 0 1 C2 1 4 4 4 14Z" fill="${ROPAS[Math.floor(R() * 8)]}"/><circle cy="-2" r="3" fill="${PIELES[i % 4]}"/>${R() < .4 ? `<path d="M2 2 L6 -8" ${st(PIELES[i % 4],1.6)}/>` : ''}</g>`; }
b += `<path d="M0 104 Q90 116 180 104 Q270 116 360 104"${NF}${st('#5d7a2a', 4)} stroke-dasharray="6 3"/>`;
b += `<rect y="134" width="360" height="66" fill="#bda77a"/><path d="M0 160 H360 M0 182 H360" ${st('#9c8660', .6)}/>`;
b += fig({ x: 108, y: 160, s: 1.35, ropa: '#e9dfc6', br: 'alto', bi: 'abajo', objD: OBJ.corona, piel: PIELES[2], pelo: PELOS[1] });
b += fig({ x: 124, y: 158, s: 1.45, toga: 1, borde: 1, togaColor: '#6b1f4f', orla: ORO, br: 'alto', bi: 'frente', objD: OBJ.laurel, objI: OBJ.cetro, piel: '#c0563a', pelo: PELOS[1], laurel: 1, gesto: 'feliz' });
b += `<path d="M110 120 l2 2 M118 140 l2 2 M126 128 l2 2 M132 146 l2 2" ${st(ORO, 1.2)}/>`;
b += G(116,186,1.3,1, carro(ORO, u));
b += G(236,186,1.18,1, cuadriga('paso', ['blanco'], ROJO, '#f6dc8a'));
b += fig({ x: 338, y: 190, s: 1.4, ropa: ROJO, br: 'pecho', bi: 'abajo', objD: OBJ.fasces + OBJ.laurel, piel: PIELES[1], pelo: PELOS[0], laurel: 1 });
return svg(b, 'El triunfo');
}
