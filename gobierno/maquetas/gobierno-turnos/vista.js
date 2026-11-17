// EV7 · pantalla de «Gobierno por turnos». El Senado vota, la ciudad obedece. Sin relojes que decidan por ti:
// el recuento se anima unos segundos y se puede saltar; todo lo demás avanza cuando el jugador toca.
import * as R from './reglas.js';
const { BANDOS, BS, EDIFICIOS, SABERES, EDADES, K } = R;
const CLAVE = 'aqvila-maqueta-ev7';
const PARAM = new URLSearchParams(location.search), SEMILLA_FIJA = +PARAM.get('semilla') || 0;
const semillaNueva = () => (Date.now() % 2147483646) + 1;
const $ = i => document.getElementById(i);
let e, ui, anim = null;

/* ---------- guardar y cargar ---------- */
const nuevoUI = () => ({ tab: 'ciudad', visto: {} });
function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify({ e, ui })); } catch (_) { } }
function cargar() {
  if (!SEMILLA_FIJA) try { const s = JSON.parse(localStorage.getItem(CLAVE)); if (s && s.e && s.e.senadores && s.e.fase !== 'fin') { e = s.e; ui = Object.assign(nuevoUI(), s.ui); return; } } catch (_) { }
  e = R.crear(SEMILLA_FIJA || semillaNueva()); ui = nuevoUI();
}

/* ---------- iconos (dibujo propio, trazo sencillo) ---------- */
const IC = {
  oro: '<circle cx="12" cy="12" r="8" fill="#e2b13c" stroke="#7a5212" stroke-width="1.6"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#7a5212" stroke-width="1.2"/>',
  grano: '<path d="M12 21V6" stroke="#7a5a1f" stroke-width="1.6"/><g fill="#e0b54a" stroke="#7a5a1f" stroke-width=".8"><ellipse cx="9.5" cy="8" rx="2" ry="3.2" transform="rotate(-25 9.5 8)"/><ellipse cx="14.5" cy="8" rx="2" ry="3.2" transform="rotate(25 14.5 8)"/><ellipse cx="9.5" cy="13" rx="2" ry="3.2" transform="rotate(-25 9.5 13)"/><ellipse cx="14.5" cy="13" rx="2" ry="3.2" transform="rotate(25 14.5 13)"/><ellipse cx="12" cy="4" rx="1.8" ry="2.8"/></g>',
  plebe: '<g fill="#c98a5a" stroke="#5a3418" stroke-width="1"><circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M3 20c0-5 2.5-7 5-7s5 2 5 7z"/><path d="M11 20c0-5 2.5-7 5-7s5 2 5 7z"/></g>',
  favor: '<g stroke="#5a3418" stroke-width="1.2"><rect x="9" y="3" width="6" height="18" rx="1" fill="#b8862b"/><path d="M12 3v18" stroke="#7a5212"/><path d="M15 5l5-2v6l-5 1z" fill="#cfd3d6"/></g>',
  legion: '<path d="M6 3h12v11c0 4-3 6-6 7-3-1-6-3-6-7z" fill="#a3231a" stroke="#4a0d08" stroke-width="1.4"/><circle cx="12" cy="11" r="2.6" fill="#e2b13c"/><path d="M12 4v4M12 14v6M7 11h2.5M14.5 11H17" stroke="#e2b13c" stroke-width="1.2"/>',
  amenaza: '<path d="M2 15h20l-3 5H5z" fill="#3a3a52" stroke="#1a1a28" stroke-width="1"/><path d="M12 3v12" stroke="#4a3018" stroke-width="1.4"/><path d="M12 4l7 8h-7z" fill="#8d4fa0" stroke="#3a1a48" stroke-width=".8"/><path d="M4 19l-1 3M8 19l-1 3M12 19l-1 3M16 19l-1 3" stroke="#4a3018"/>',
  obra: '<g stroke="#6b4a26" stroke-width="1.6" fill="none"><path d="M5 21V5M12 21V5M19 21V5M3 8h18M3 13h18M3 18h18M5 13l7-5M12 18l7-5"/></g>',
  saber: '<rect x="4" y="5" width="16" height="14" rx="2" fill="#efe1bd" stroke="#6b4a26" stroke-width="1.4"/><circle cx="4" cy="12" r="2.4" fill="#b8862b" stroke="#6b4a26"/><circle cx="20" cy="12" r="2.4" fill="#b8862b" stroke="#6b4a26"/><path d="M8 9h8M8 12h8M8 15h5" stroke="#6b4a26" stroke-width="1.1"/>',
  edad: '<path d="M7 3h10M7 21h10M8 3c0 6 8 6 8 9s-8 3-8 9M16 3c0 6-8 6-8 9s8 3 8 9" fill="none" stroke="#6b4a26" stroke-width="1.6"/><path d="M10 18c1-1.5 3-1.5 4 0v2h-4z" fill="#e0b54a"/>',
  juegos: '<circle cx="12" cy="12" r="8" fill="none" stroke="#6b4a26" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#6b4a26"/><path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7" stroke="#6b4a26" stroke-width="1.3"/>',
  ciudad: '<path d="M3 20V11l4-3 4 3v9zM11 20v-7l5-4 5 4v7z" fill="#a98a66" stroke="#4a3119" stroke-width="1.2"/><path d="M2 11l5-4 5 4M10 13l6-5 6 5" fill="none" stroke="#b5562f" stroke-width="2"/>',
  senado: '<path d="M3 20h18M5 20v-8M9 20v-8M15 20v-8M19 20v-8M3 12h18L12 5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  mando: '<rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8"/>',
  tribuno: '<circle cx="12" cy="6" r="3" fill="#c98a5a" stroke="#5a3418"/><path d="M6 21c0-7 3-10 6-10s6 3 6 10z" fill="#efe1bd" stroke="#5a3418"/><path d="M4 12l16 8" stroke="#a3231a" stroke-width="2.2"/>',
  promesa: '<path d="M4 12c3-3 5-3 8 0s5 3 8 0" fill="none" stroke="#6b4a26" stroke-width="2"/><path d="M6 15l3 3 3-3 3 3 3-3" fill="none" stroke="#6b4a26" stroke-width="1.6"/>',
  retraso: '<circle cx="12" cy="12" r="8" fill="#f6d6c8" stroke="#9b2a1a" stroke-width="1.6"/><path d="M12 7v5l3 3" stroke="#9b2a1a" stroke-width="1.8" fill="none"/>',
};
const ico = (n, cl = '') => `<svg viewBox="0 0 24 24" class="${cl}" aria-hidden="true">${IC[n] || IC.obra}</svg>`;
const icoLey = ley => ico({ reclutar: 'legion', ampliar: 'ciudad', estudiar: 'saber', edad: 'edad', impuestos: 'oro', granoBarato: 'grano', juegos: 'juegos' }[ley.tipo]);
const NOMBRE = { oro: 'Oro', grano: 'Grano', plebe: 'Plebe', favor: 'Favor', legiones: 'Legiones', amenaza: 'Amenaza' };
const signo = n => (n > 0 ? '+' : '−') + Math.abs(Math.round(n));

/* ---------- cabecera ---------- */
function cabecera() {
  const f = R.fuerza(e);
  const c = [['oro', 'Oro', e.oro, e.oro < 0], ['grano', 'Grano', e.grano, e.grano < 0], ['plebe', 'Plebe', e.plebe, e.plebe < 30],
    ['favor', 'Favor', e.favor, e.favor < 25], ['legion', 'Fuerza', f, f < e.amenaza], ['amenaza', 'Cartago', e.amenaza, f < e.amenaza]];
  $('cab').innerHTML = `<div class="fila"><span>${R.nombreEstacion(e.turno)} · ${Math.min(e.turno + 1, K.turnos)}/${K.turnos}</span><span class="edad">Edad ${['I', 'II', 'III'][e.edad - 1]}</span></div>
  <div id="cifras">${c.map(([i, n, v, m]) => `<div class="cifra${m ? ' mal' : ''}" data-cifra="${i}">${ico(i)}<span>${n}</span><b>${Math.round(v)}</b></div>`).join('')}</div>`;
}

/* ---------- dibujo de la ciudad (SVG propio, a pleno día) ---------- */
const HOGARES = (() => { let a = 12345; const r = () => (a = (a * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff, out = [];
  while (out.length < 40) { const x = 165 + r() * 200, y = 122 + r() * 132; const lejos = [[205, 135, 30], [255, 125, 28], [268, 195, 34], [325, 165, 22]].every(([cx, cy, rr]) => Math.hypot(x - cx, y - cy) > rr); if (lejos && out.every(p => Math.hypot(p[0] - x, p[1] - y) > 16)) out.push([x, y]); }
  return out.sort((p, q) => p[1] - q[1]); })();
const casa = (x, y, s = 1) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})"><rect x="-6" y="-5" width="12" height="8" fill="#b39672" stroke="#6e5536" stroke-width=".6"/><path d="M-7.5 -4.5 L0 -10 L7.5 -4.5Z" fill="#b5562f" stroke="#7a3518" stroke-width=".6"/><rect x="-1.5" y="-1" width="3" height="4" fill="#5a4024"/></g>`;
const templo = (x, y) => `<g transform="translate(${x} ${y}) scale(1.35)"><rect x="-17" y="2" width="34" height="5" fill="#9b8160" stroke="#5e4a30" stroke-width=".7"/>${[-13, -6.5, 0, 6.5, 13].map(c => `<rect x="${c - 1.4}" y="-10" width="2.8" height="12" fill="#d8c7a2" stroke="#7a6444" stroke-width=".4"/>`).join('')}<path d="M-19 -10 L0 -20 L19 -10Z" fill="#b5562f" stroke="#7a3518" stroke-width=".7"/><circle cx="0" cy="-20" r="1.6" fill="#c9733e"/></g>`;
const puesto = (x, y) => `<g transform="translate(${x} ${y}) scale(1.25)"><rect x="-9" y="-4" width="18" height="8" fill="#a98a66" stroke="#5e4a30" stroke-width=".6"/><path d="M-11 -4 L11 -4 L9 -9 L-9 -9Z" fill="#c9a54a"/><path d="M-7 -9 L-8 -4 M-2 -9 L-2.5 -4 M3 -9 L3.5 -4 M7.5 -9 L8.5 -4" stroke="#a3231a" stroke-width="1.6"/><circle cx="-4" cy="2" r="1.6" fill="#7d9a45"/><circle cx="3" cy="2" r="1.6" fill="#c9733e"/></g>`;
const tienda = (x, y) => `<path transform="translate(${x} ${y}) scale(1.4)" d="M-6 4 L0 -5 L6 4Z" fill="#e9dcc0" stroke="#7a6444" stroke-width=".7"/>`;
const granja = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-20" y="-7" width="40" height="14" rx="1" fill="#d9b85a"/>${[-14, -8, -2, 4, 10, 16].map(c => `<path d="M${c} -6 L${c - 3} 6" stroke="#b08f35" stroke-width="1"/>`).join('')}${casa(14, -8, .8)}</g>`;
const muelle = (x, y, n) => `<g transform="translate(${x} ${y}) scale(1.4)"><rect x="-16" y="-2" width="20" height="5" fill="#8a6034" stroke="#4a3119" stroke-width=".6"/>${[-14, -8, -2].map(c => `<path d="M${c} 3 v4" stroke="#4a3119" stroke-width="1.2"/>`).join('')}<path d="M-22 10 q6 4 12 0z" fill="#6b4a26"/>${n > 1 ? '<path d="M-6 13 q7 4 14 0z" fill="#6b4a26"/><path d="M1 13 v-8" stroke="#4a3119"/><path d="M1 5 l5 3 -5 1z" fill="#efe1bd"/>' : ''}</g>`;
const legion = (x, y, pilum) => `<g transform="translate(${x} ${y}) scale(1.15)">${[0, 1, 2].map(f => [0, 1, 2, 3].map(c => `<rect x="${c * 4.5 - 9}" y="${f * 4.6 - 6}" width="3.6" height="4.4" rx=".8" fill="#a3231a" stroke="#4a0d08" stroke-width=".4"/>`).join('')).join('')}${pilum ? [0, 1, 2, 3].map(c => `<path d="M${c * 4.5 - 7.5} -7 l1.5 -6" stroke="#5a4024" stroke-width=".7"/>`).join('') : ''}<path d="M11 8 V-12" stroke="#4a3119" stroke-width="1"/><rect x="11" y="-12" width="6" height="5" fill="#a3231a"/></g>`;
const barco = (x, y, corvus) => `<g transform="translate(${x} ${y})"><path d="M-18 0 Q0 7 18 0 L15 -3 H-15Z" fill="#5e3f1f" stroke="#2e1d0c" stroke-width=".6"/>${[-12, -8, -4, 0, 4, 8, 12].map(c => `<path d="M${c} 2 l-2 4" stroke="#2e1d0c" stroke-width=".6"/>`).join('')}<path d="M0 -3 V-18" stroke="#2e1d0c" stroke-width="1"/><path d="M0 -17 L9 -10 L0 -6Z" fill="#efe1bd" stroke="#7a6444" stroke-width=".4"/>${corvus ? '<path d="M-12 -3 V-14 M-12 -13 L-24 -6" stroke="#6b4a26" stroke-width="1.6"/><path d="M-24 -6 l-2 3" stroke="#3a2a14" stroke-width="1.6"/>' : ''}</g>`;
const andamio = (x, y, w = 24, h = 18, p = 0) => `<g transform="translate(${x - w / 2} ${y - h / 2})" class="andamio"><rect width="${w}" height="${h}" fill="rgba(240,225,190,.55)"/><rect y="${h * (1 - p)}" width="${w}" height="${h * p}" fill="#b39672"/>${[0, w / 2, w].map(c => `<path d="M${c} 0 V${h}" stroke="#7a5228" stroke-width="1.2"/>`).join('')}${[0, h / 2, h].map(c => `<path d="M0 ${c} H${w}" stroke="#7a5228" stroke-width="1"/>`).join('')}<path d="M0 ${h} L${w / 2} 0 L${w} ${h}" stroke="#7a5228" stroke-width=".8" fill="none"/></g>`;
const brillo = (x, y, r = 16) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#f3c64a" stroke-width="2.5" stroke-dasharray="4 3" class="nuevo"/>`;
const POS = {
  granja: [[205, 285], [252, 287], [300, 285], [347, 287]], mercado: [[252, 186], [284, 192], [262, 210]],
  templo: [[205, 138], [262, 128]], muelle: [[134, 205], [126, 238]], cuartel: [[0, 0], [0, 0], [0, 0]],
};

function dibujoCiudad(nuevo) {
  const d = e.edif, en = (t, o) => e.ordenes.find(x => x.ley.tipo === t && (o == null || x.ley.obj === o)), s = id => e.saberes.includes(id);
  const nv = (q, o) => nuevo.some(c => c.que === q && (o == null || c.obj === o));
  let g = `<defs><linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d6df"/><stop offset="1" stop-color="#f3e7c6"/></linearGradient>
    <linearGradient id="rio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7f9c86"/><stop offset="1" stop-color="#5f8070"/></linearGradient></defs>
  <rect width="390" height="300" fill="url(#cielo)"/><circle cx="345" cy="28" r="14" fill="#fff4c8"/><circle cx="345" cy="28" r="22" fill="#fff4c8" opacity=".35"/>
  <ellipse cx="90" cy="30" rx="34" ry="8" fill="#fff" opacity=".75"/><ellipse cx="200" cy="18" rx="26" ry="6" fill="#fff" opacity=".6"/>
  <path d="M0 80 Q60 52 120 72 T250 62 T390 70 V100 H0Z" fill="#9fae8c"/><path d="M0 92 Q90 78 180 88 T390 84 V300 H0Z" fill="#8fa857"/>
  <path d="M0 160 Q40 150 70 170 L60 300 H0Z" fill="#83a04c" opacity=".7"/><path d="M150 270 Q260 262 390 272 V300 H150Z" fill="#9cb060" opacity=".6"/>`;
  // la ciudad: suelo de los montes, casas, Capitolio
  g += `<path d="M152 128 Q160 104 205 106 Q262 90 318 104 Q372 106 378 146 L383 214 Q384 262 330 266 Q262 280 196 270 Q148 266 147 222 Z" fill="#b8b072"/><ellipse cx="208" cy="140" rx="32" ry="16" fill="#a9a466"/><ellipse cx="258" cy="130" rx="30" ry="14" fill="#a9a466"/>`;
  // el Tíber y el Campo de Marte en su curva
  g += `<path d="M92 86 C100 120 150 150 130 190 S96 250 104 300 L134 300 C126 252 166 214 150 180 S108 118 106 86 Z" fill="url(#rio)" stroke="#a9c0ae" stroke-width="1.2"/>`;
  g += `<path d="M10 102 H92 Q105 130 118 160 L10 166Z" fill="#a3b864" opacity=".55"/>`;
  // Vía Apia (saber «apio»)
  if (s('apio')) g += `<path d="M330 262 L390 296" stroke="#c9c0a8" stroke-width="6"/><path d="M330 262 L390 296" stroke="#8a826c" stroke-width="1" stroke-dasharray="3 4"/>${[[350, 276], [372, 288]].map(([x, y]) => `<rect x="${x}" y="${y - 6}" width="3" height="6" fill="#d8cfb4"/>`).join('')}${nv('saber', 'apio') ? brillo(360, 280, 18) : ''}`;
  else if (en('estudiar', 'apio')) g += andamio(355, 280, 26, 12, 0.5);
  // granjas
  for (let i = 0; i < 4; i++) { const [x, y] = POS.granja[i]; if (i < d.granja) g += granja(x, y) + (nv('edif', 'granja') && i === d.granja - 1 ? brillo(x, y, 22) : ''); else if (i === d.granja && en('ampliar', 'granja')) g += andamio(x, y, 34, 14, prog(en('ampliar', 'granja'))); }
  // casas (crecen con la población y la edad)
  const nCasas = Math.max(12, Math.min(HOGARES.length, Math.round((e.pob - 80) * 1.2) + 10 + (e.edad - 1) * 5 + R.ORDEN_EDIF.reduce((a, k) => a + e.edif[k], 0)));
  HOGARES.slice(0, nCasas).forEach(([x, y]) => { g += casa(x, y, 1.3); });
  // muralla serviana: anillo de toba; torres desde el nivel 2; puerta doble en el 3
  const mu = d.muralla, ancho = 3 + mu * 1.6;
  g += `<path d="M152 128 Q160 104 205 106 Q262 90 318 104 Q372 106 378 146 L383 214 Q384 262 330 266 Q262 280 196 270 Q148 266 147 222 Z" fill="none" stroke="#6e5536" stroke-width="${ancho + 2}"/><path d="M152 128 Q160 104 205 106 Q262 90 318 104 Q372 106 378 146 L383 214 Q384 262 330 266 Q262 280 196 270 Q148 266 147 222 Z" fill="none" stroke="#a98a66" stroke-width="${ancho}"/>`;
  if (mu >= 2) [[156, 112], [262, 96], [366, 112], [382, 190], [372, 255], [262, 274], [160, 262], [148, 180]].forEach(([x, y]) => { g += `<rect x="${x - 5}" y="${y - 7}" width="10" height="11" fill="#a98a66" stroke="#6e5536" stroke-width=".8"/><path d="M${x - 6} ${y - 7} h12" stroke="#b5562f" stroke-width="2"/>`; });
  if (mu >= 3) g += `<rect x="250" y="262" width="24" height="14" fill="#9b7f58" stroke="#6e5536"/><path d="M256 276 v-8 a6 6 0 0 1 12 0 v8" fill="#4a3119"/>`;
  if (nv('edif', 'muralla')) g += brillo(262, 268, 22);
  if (en('ampliar', 'muralla')) g += andamio(381, 225, 16, 26, prog(en('ampliar', 'muralla')));
  // templos en el Capitolio
  for (let i = 0; i < 2; i++) { const [x, y] = POS.templo[i]; if (i < d.templo) g += templo(x, y) + (nv('edif', 'templo') && i === d.templo - 1 ? brillo(x, y - 6, 24) : ''); else if (i === d.templo && en('ampliar', 'templo')) g += andamio(x, y - 6, 36, 26, prog(en('ampliar', 'templo'))); }
  // el Foro y sus puestos (mercado)
  g += `<rect x="236" y="178" width="62" height="36" rx="3" fill="#cbb98a" opacity=".8"/>`;
  for (let i = 0; i < 3; i++) { const [x, y] = POS.mercado[i]; if (i < d.mercado) g += puesto(x, y) + (nv('edif', 'mercado') && i === d.mercado - 1 ? brillo(x, y, 15) : ''); else if (i === d.mercado && en('ampliar', 'mercado')) g += andamio(x, y, 20, 12, prog(en('ampliar', 'mercado'))); }
  // escuela de preceptores griegos (saber «griego»): pórtico de madera junto al Foro
  if (s('griego')) g += `<g transform="translate(326 168)"><rect x="-16" y="-2" width="32" height="10" fill="#c7b38c" stroke="#6e5536" stroke-width=".6"/>${[-12, -6, 0, 6, 12].map(c => `<path d="M${c} -2 V-10" stroke="#7a5a3a" stroke-width="1.6"/>`).join('')}<path d="M-18 -10 H18 L14 -14 H-14Z" fill="#b5562f"/></g>${nv('saber', 'griego') ? brillo(326, 164, 20) : ''}`;
  else if (en('estudiar', 'griego')) g += andamio(326, 164, 30, 20, prog(en('estudiar', 'griego')));
  // muelles del Tíber
  for (let i = 0; i < 2; i++) { const [x, y] = POS.muelle[i]; if (i < d.muelle) g += muelle(x + 16, y, e.edad >= 2 ? 2 : 1) + (nv('edif', 'muelle') && i === d.muelle - 1 ? brillo(x + 10, y + 4, 18) : ''); else if (i === d.muelle && en('ampliar', 'muelle')) g += andamio(x + 8, y, 22, 12, prog(en('ampliar', 'muelle'))); }
  // Campo de Marte: barracones de lona por nivel
  for (let n = 0; n < d.cuartel; n++) for (let k = 0; k < 4; k++) g += tienda(22 + k * 18 + n * 4, 112 + n * 14);
  if (nv('edif', 'cuartel')) g += brillo(50, 112 + (d.cuartel - 1) * 14, 22);
  if (en('ampliar', 'cuartel')) g += andamio(50, 112 + d.cuartel * 14, 40, 10, prog(en('ampliar', 'cuartel')));
  // legiones (y el campamento si hay «castra»; pilum alzados si hay «pilum»)
  const L = Math.min(e.legiones, 12), lx = i => 18 + (i % 4) * 22, ly = i => 186 + Math.floor(i / 4) * 24;
  if (s('castra') && L) { const filas = Math.ceil(L / 4); g += `<rect x="4" y="170" width="94" height="${filas * 24 + 8}" fill="none" stroke="#7a5228" stroke-width="2" stroke-dasharray="2 1.5"/>`; }
  for (let i = 0; i < L; i++) g += legion(lx(i), ly(i), s('pilum'));
  const nuevasL = nuevo.filter(c => c.que === 'legiones' && c.n > 0).reduce((a, c) => a + c.n, 0);
  for (let i = Math.max(0, L - nuevasL); i < L; i++) g += brillo(lx(i) + 2, ly(i) - 1, 13);
  if (en('reclutar')) g += `<g opacity=".55">${andamio(lx(L) + 2, ly(L) - 1, 22, 16, prog(en('reclutar')))}</g>`;
  // flota: quinquerreme y corvus en el río
  if (s('quinque')) g += barco(118, 272, false) + (nv('saber', 'quinque') ? brillo(118, 268, 22) : ''); else if (en('estudiar', 'quinque')) g += andamio(118, 268, 30, 12, prog(en('estudiar', 'quinque')));
  if (s('corvus')) g += barco(120, 292 - 30, true).replace('translate(120 262)', 'translate(122 252)') + (nv('saber', 'corvus') ? brillo(120, 248, 22) : ''); else if (en('estudiar', 'corvus')) g += andamio(120, 250, 30, 12, prog(en('estudiar', 'corvus')));
  // Edad II: banderas en el puerto
  if (e.edad >= 2) g += `<path d="M140 196 V180" stroke="#4a3119" stroke-width="1.2"/><path d="M140 180 l10 3 -10 3z" fill="#a3231a"/>${nv('edad') ? brillo(140, 186, 18) : ''}`;
  return `<svg viewBox="0 0 390 300" role="img" aria-label="Roma vista desde el Janículo">${g}</svg>`;
}
const prog = o => o ? Math.min(1, o.hecho / o.dura) : 0;

/* ---------- pantallas ---------- */
const GUIA = {
  ciudad: 'Esta es Roma. No la construyes tú: el Senado vota y la ciudad cumple sola lo que se apruebe.',
  senado: 'Elige una ley, ofrece tratos a quien dude y vota con el sello rojo.',
  mando: 'Aquí ves lo ordenado, lo que se está cumpliendo y lo que ha cambiado en Roma.',
};
const guia = t => e.turno === 0 ? `<p class="guia">${GUIA[t]}</p>` : '';
function bandaSuceso() {
  const s = e.suceso; if (!s) return '';
  const ef = Object.entries(s.ef).filter(([, v]) => v).map(([k, v]) => `${NOMBRE[k] || k} ${signo(v)}`).join(' · ');
  const ic = s.ef.amenaza ? 'amenaza' : s.ef.legiones ? 'legion' : s.ef.grano ? 'grano' : s.ef.oro ? 'oro' : s.ef.plebe ? 'plebe' : 'favor';
  return `<div class="banda">${ico(ic)}<div><b>${s.titulo}</b>${s.texto} <i>${ef}</i></div></div>`;
}
function ficha(icon, texto, cl = '') { return `<span class="ficha ${cl}">${ico(icon)}${texto}</span>`; }

function pantallaCiudad() {
  const nuevo = (e.ultimo && e.ultimo.turno === e.turno - 1) ? e.ultimo.cambios : [];
  const obras = R.ORDEN_EDIF.filter(k => e.edif[k] > 0).map(k => ficha('ciudad', `${EDIFICIOS[k].nombre} ${e.edif[k]}`, nuevo.some(c => c.que === 'edif' && c.obj === k) ? 'nueva' : ''));
  const sabs = e.saberes.map(id => ficha('saber', SABERES[id].nombre, nuevo.some(c => c.que === 'saber' && c.obj === id) ? 'nueva' : ''));
  const cola = e.ordenes.map(o => ficha('obra', `${R.leyTexto(o.ley).titulo.replace(/^Ampliar: |^Estudiar: /, '')} ${o.hecho}/${o.dura}`, 'obra'));
  return guia('ciudad') + bandaSuceso() + `<div class="lienzo">${dibujoCiudad(nuevo)}</div>
  <div class="ro-rubrica sub">Lo que tiene Roma</div><div class="fichas">${ficha('legion', `${e.legiones} legiones`, nuevo.some(c => c.que === 'legiones' && c.n > 0) ? 'nueva' : '')}${ficha('plebe', `${Math.round(e.pob)} 000 vecinos`)}${obras.join('')}</div>
  <div class="ro-rubrica sub">Saberes</div><div class="fichas">${sabs.join('') || '<span class="vacio">Ninguno todavía. El Senado puede votar estudiar uno.</span>'}</div>
  ${cola.length ? `<div class="ro-rubrica sub">Andamios: se está cumpliendo</div><div class="fichas">${cola.join('')}</div>` : ''}`;
}

/* hemiciclo de 30 escaños: los bandos de izquierda a derecha (terratenientes, mercaderes, militares) */
const ASIENTOS = (() => { const out = []; [[7, 58], [10, 84], [13, 110]].forEach(([n, r]) => { for (let k = 0; k < n; k++) { const a = Math.PI - (k + 0.5) * Math.PI / n; out.push({ x: 195 + r * Math.cos(a), y: 124 - r * Math.sin(a), a }); } }); return out.sort((p, q) => q.a - p.a || p.y - q.y); })();
function hemiciclo(estado) { // estado(i) → {color, clase}
  let g = `<path d="M70 126 A125 125 0 0 1 320 126" fill="none" stroke="rgba(110,70,25,.25)" stroke-width="40"/><rect x="60" y="126" width="270" height="6" fill="#8a6034"/>`;
  g += `<g transform="translate(195 104)"><rect x="-12" y="8" width="24" height="5" fill="#8a6034"/><circle cx="0" cy="-4" r="5" fill="#c98a5a" stroke="#5a3418"/><path d="M-8 10 c0-8 4-10 8-10s8 2 8 10z" fill="#efe1bd" stroke="#a3231a" stroke-width="1.4"/></g>`;
  if (e.plebe < R.TRIBUNO.umbral) g += `<g transform="translate(240 100) scale(1.1)">${IC.tribuno}</g>`;
  e.senadores.forEach((s, i) => { const p = ASIENTOS[i], st = estado(s); g += `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" data-asiento="${i}">${st}</g>`; });
  return `<svg viewBox="0 0 390 134" aria-label="Hemiciclo del Senado">${g}</svg>`;
}
const asiento = (b, clase) => {
  const c = BANDOS[b].color;
  if (clase === 'seguro') return `<circle r="9" fill="${c}" stroke="#2b1c0a" stroke-width="1"/><circle r="3" cy="-2" fill="rgba(255,240,200,.6)"/>`;
  if (clase === 'dudoso') return `<circle r="9" fill="#f6ead0" stroke="${c}" stroke-width="2.6"/><text y="4.5" text-anchor="middle" font-size="12" font-weight="700" fill="${c}">?</text>`;
  if (clase === 'contra') return `<circle r="9" fill="#8f826d" stroke="#4a3e2e" stroke-width="1"/><path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#3a2e20" stroke-width="1.6"/>`;
  if (clase === 'si') return `<circle r="9" fill="${c}" stroke="#2b1c0a" stroke-width="1"/><path d="M-4 0 L-1 3.5 L4.5 -3.5" stroke="#fff4d0" stroke-width="2" fill="none"/>`;
  if (clase === 'no') return `<circle r="9" fill="#6e6252" stroke="#2b2010" stroke-width="1"/><path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#f0e2c0" stroke-width="1.8"/>`;
  if (clase === 'espera') return `<circle r="9" fill="#e5d6b4" stroke="#8a7a5a" stroke-width="1"/>`;
  return `<circle r="9" fill="${c}" opacity=".55" stroke="#2b1c0a" stroke-width=".8"/>`;
};

function pantallaSenado() {
  if (e.fase !== 'senado') {
    const r = e.recuento;
    return guia('senado') + `<div class="hemi">${hemiciclo(s => r ? asiento(s.bando, r.votos.find(v => v.i === s.i).si ? 'si' : 'no') : asiento(s.bando, ''))}</div>
      <p class="resultado ${r && r.aprobada ? 'bien' : 'mal'}">${r ? (r.aprobada ? 'Aprobada' : r.veto ? 'Vetada por el tribuno' : 'Rechazada') + ` · ${r.si} a ${r.no}` : 'Esta estación no se votó'}</p>
      ${r ? `<p class="guia">${R.leyTexto(r.ley).titulo}. ${r.aprobada ? 'Ya está en la cola de mando.' : 'No se cumplirá.'}</p>` : ''}
      <p class="vacio" style="text-align:center">El Senado vuelve a reunirse la próxima estación.</p>`;
  }
  const pv = R.prevision(e);
  const est = s => pv ? asiento(s.bando, pv.por.find(p => p.i === s.i).clase) : asiento(s.bando, '');
  const cuenta = pv ? `<div class="cuenta"><span><b>${pv.seguros}</b> seguros</span><span><b>${pv.dudosos}</b> dudosos</span><span><b>${pv.contra}</b> en contra</span><span>· mayoría <b>${K.mayoria}</b></span></div>`
    : `<div class="cuenta">${BS.map(b => `<span><span class="ro-punto" style="background:${BANDOS[b].color}"></span>${BANDOS[b].nombre} <b>${e.escanos[b]}</b></span>`).join('')}</div>`;
  const cartas = e.cartas.map((ley, i) => {
    const t = R.leyTexto(ley), g = R.gustoLey(ley), pl = R.plantillaOrden(e, ley);
    const gus = BS.filter(b => Math.abs(g[b]) >= 0.1).map(b => `<i class="${g[b] > 0 ? 'si' : 'no'}">${g[b] > 0 ? '▲' : '▼'} ${BANDOS[b].corto}</i>`).join('') + (R.perjudicaPlebe(ley) ? '<i class="no">▼ Plebe</i>' : '');
    const coste = `${pl.dura} est.${pl.oro ? ` · ${pl.oro} oro` : ''}${pl.grano ? ` · ${pl.grano} grano` : ''}${pl.dura > 1 ? ' cada una' : ''}`;
    return `<button class="carta${e.sel === i ? ' on' : ''}" data-a="ley" data-x="${i}">${icoLey(ley).replace('<svg', '<svg class="ic"')}<span class="t">${t.titulo}</span><span class="x">${t.efecto}</span><span class="g">${gus}<i>⧗ ${coste}</i></span><span class="f">${t.fuente} · ${t.dictamen}</span></button>`;
  }).join('');
  const tratos = BS.map(b => {
    const t = e.tratos[b], c = R.costeTrato(e, b), bb = pv && pv.bandos[b];
    const lab = t === 'oro' ? `Pagar ${c} de oro` : t === 'promesa' ? 'Promesa' : 'Sin trato';
    return `<button class="${t ? 'on' : ''}" data-a="trato" data-x="${b}"><span><span class="pt" style="background:${BANDOS[b].color}"></span>${BANDOS[b].corto} ${e.escanos[b]}</span><small>${lab}</small>${bb ? `<small>${bb.seguros} sí · ${bb.dudosos} dudan</small>` : ''}</button>`;
  }).join('');
  const veto = pv && pv.veto ? `<div class="veto">${'El tribuno de la plebe vetará esta ley: la plebe está por debajo de ' + R.TRIBUNO.umbral + ' y la perjudica.'}</div>` : '';
  return guia('senado') + `<div class="hemi">${hemiciclo(est)}</div>${cuenta}${veto}
    <div class="ro-tablilla cartas">${cartas}</div>
    <div class="ro-tablilla tratos">${tratos}</div>
    <p class="nota-trato">Toca un bando: oro, promesa o nada. Promesa: en ${K.promesaPlazo} estaciones apruebas una ley que les guste, o −${K.promesaRota.favor} de favor.</p>
    <button class="pasar" data-a="pasar">Dejar pasar la votación (−${K.favorPasa} de favor)</button>`;
}

function filaOrden(o) {
  const t = R.leyTexto(o.ley), falta = o.dura - o.hecho;
  return `<div class="orden">${icoLey(o.ley)}<span>${t.titulo}</span><small><span class="barra"><i style="width:${Math.round(100 * o.hecho / o.dura)}%"></i></span>
    ${o.retraso ? `<span class="tarde">Retrasada: ${o.retraso}.</span> ` : ''}Falta${falta > 1 ? 'n' : ''} ${falta} estaci${falta > 1 ? 'ones' : 'ón'} · ${o.oro ? o.oro + ' de oro' : ''}${o.oro && o.grano ? ' y ' : ''}${o.grano ? o.grano + ' de grano' : ''}${o.oro || o.grano ? ' por estación' : 'sin coste'}</small></div>`;
}
function resumenCambios(cambios) {
  const tot = {}, cosas = [];
  for (const c of cambios) {
    if (NOMBRE[c.que] && c.que !== 'legiones') tot[c.que] = (tot[c.que] || 0) + c.n;
    else if (c.que === 'legiones') cosas.push(['legion', c.n > 0 ? `${c.n > 1 ? c.n + ' legiones nuevas' : 'Una legión nueva'}` : 'Pierdes una legión', c.n]);
    else if (c.que === 'edif') cosas.push(['ciudad', `Nuevo: ${EDIFICIOS[c.obj].una}`, 1]);
    else if (c.que === 'saber') cosas.push(['saber', `Saber: ${SABERES[c.obj].nombre}`, 1]);
    else if (c.que === 'edad') cosas.push(['edad', `Edad ${['I', 'II', 'III'][c.obj - 1]}: «${EDADES[c.obj].nombre}»`, 1]);
    else if (c.que === 'retraso') cosas.push(['retraso', c.motivo, -1]);
    else if (c.que === 'promesa') cosas.push(['promesa', c.motivo, 1]);
  }
  const icoR = { oro: 'oro', grano: 'grano', plebe: 'plebe', favor: 'favor', amenaza: 'amenaza' };
  const filas = cosas.map(([i, t, n]) => `<div class="cambio">${ico(i)}<span>${t}</span>${n < 0 ? '<span class="n m">!</span>' : '<span class="n b">✓</span>'}</div>`)
    .concat(Object.entries(tot).filter(([, v]) => Math.round(v)).map(([k, v]) => { const bueno = k === 'amenaza' ? v < 0 : v > 0; return `<div class="cambio">${ico(icoR[k])}<span>${NOMBRE[k]}</span><span class="n ${bueno ? 'b' : 'm'}">${signo(v)}</span></div>`; }));
  return filas.join('') || '<p class="vacio">Nada todavía.</p>';
}
function pantallaMando() {
  const f = R.fuerza(e), prev = R.amenazaFinal(e), tope = Math.max(prev, f, 1) * 1.1, req = R.requisitosEdad(e, e.edad + 1), E = EDADES[e.edad + 1];
  const ordenado = e.aprobadas.length ? e.aprobadas.map(l => `<div class="orden">${icoLey(l)}<span>${R.leyTexto(l).titulo}</span><small>Aprobada en el Senado esta estación</small></div>`).join('')
    : `<p class="vacio">${e.fase === 'senado' ? 'Todavía no se ha votado esta estación.' : 'Nada aprobado esta estación.'}</p>`;
  const prom = e.promesas.map(p => `<div class="orden">${ico('promesa')}<span>Promesa a los ${BANDOS[p.bando].nombre.toLowerCase()}</span><small>Aprueba una ley que les guste antes de la estación ${p.vence + 1}</small></div>`).join('');
  return guia('mando') + `<div class="amenaza"><b>Golpe de Cartago en la estación ${K.turnos}.</b> Ahora ${e.amenaza}; si nada cambia, llegará a <b>${prev}</b>.
    <div class="barra roja"><i style="width:${(100 * prev / tope).toFixed(0)}%"></i></div>Tus fuerzas: <b>${f}</b> (${e.legiones} legiones de ${R.fuerzaLegion(e)}, muralla ${e.edif.muralla * K.muralla}${e.saberes.includes('corvus') ? ', corvus ' + K.corvus : ''})
    <div class="barra"><i style="width:${(100 * f / tope).toFixed(0)}%"></i></div></div>
    ${E ? `<div class="bloque"><h3 class="ro-rubrica">${ico('edad')}Para la Edad ${['I', 'II', 'III'][E.n - 1]} «${E.nombre}»</h3><ul class="req">${reqLista(E)}</ul>${e.edad < 2 ? '<small class="vacio">Sin la Edad II no hay triunfo.</small>' : ''}</div>` : ''}
    <div class="bloque"><h3 class="ro-rubrica">${ico('favor')}Ordenado</h3>${ordenado}${prom}</div>
    <div class="bloque"><h3 class="ro-rubrica">${ico('obra')}Cumpliéndose</h3>${e.ordenes.length ? e.ordenes.map(filaOrden).join('') : '<p class="vacio">La cola de mando está vacía.</p>'}</div>
    <div class="bloque"><h3 class="ro-rubrica">${ico('ciudad')}Ha cambiado ${e.ultimo ? '(al cerrar la estación anterior)' : ''}</h3>${e.ultimo ? resumenCambios(e.ultimo.cambios) : '<p class="vacio">Al terminar la estación verás aquí lo que ganó Roma.</p>'}</div>`;
}
function reqLista(E) {
  const li = (ok, t) => `<li class="${ok ? 'ok' : 'no'}">${t}</li>`, out = [];
  out.push(li(e.saberes.length >= E.saberes, `${E.saberes} saberes (tienes ${e.saberes.length})`));
  for (const k in E.edif) out.push(li(e.edif[k] >= E.edif[k], `${EDIFICIOS[k].nombre} ${E.edif[k]} (tienes ${e.edif[k]})`));
  out.push(li(false, 'Y que el Senado vote «Pasar de edad»'));
  return out.join('');
}

/* ---------- capas ---------- */
function capa(html) { const c = $('capa'); c.innerHTML = `<div class="hoja">${html}</div>`; c.hidden = false; }
function cierraCapa() { $('capa').hidden = true; $('capa').innerHTML = ''; }

function recuento() {
  const r = e.recuento; let k = 0, si = 0, no = 0;
  const pinta = () => {
    const vistos = new Set(r.votos.slice(0, k).map(v => v.i));
    capa(`<h2 class="ro-ansata">Recuento</h2><p style="text-align:center;margin:0 0 4px">${R.leyTexto(r.ley).titulo}</p>
      <div class="hemi">${hemiciclo(s => { const v = r.votos.find(x => x.i === s.i); return vistos.has(s.i) ? asiento(s.bando, v.si ? 'si' : 'no') : (v.clase === 'dudoso' ? asiento(s.bando, 'dudoso') : asiento(s.bando, 'espera')); })}</div>
      <div class="marcador"><span class="si">Sí ${si}</span><span class="no">No ${no}</span></div>
      <p class="resultado" id="resultado">${k < r.votos.length ? `Votan: ${BANDOS[r.votos[Math.min(k, r.votos.length - 1)].bando].nombre}…` : ''}</p>
      <button class="boton2" data-a="saltar" ${k >= r.votos.length ? 'hidden' : ''}>Saltar el recuento</button>
      <button class="boton ro-sello" data-a="al-mando" ${k >= r.votos.length ? '' : 'hidden'}>Ver la cola de mando</button>`);
    if (k >= r.votos.length) { const el = $('resultado'); el.className = 'resultado ' + (r.aprobada ? 'bien' : 'mal'); el.textContent = r.aprobada ? `Aprobada ${r.si} a ${r.no}: pasa a la cola de mando` : r.veto ? `Tenía ${r.si} votos, pero el tribuno de la plebe la veta` : `Rechazada ${r.si} a ${r.no}: hacían falta ${K.mayoria}`; }
  };
  const paso = () => { if (k >= r.votos.length) return; const v = r.votos[k++]; v.si ? si++ : no++; pinta(); anim = k < r.votos.length ? setTimeout(paso, 95) : null; };
  anim = 'saltar'; pinta(); anim = setTimeout(paso, 300);
  window.__ev7.saltar = () => { clearTimeout(anim); anim = null; k = r.votos.length; si = r.si; no = r.no; pinta(); };
}

function pasoEstacion(inf) {
  capa(`<h2 class="ro-ansata">Cierre: ${R.nombreEstacion(inf.turno).split(' de ')[0]}</h2>
    <p class="ro-rubrica">Así ha cambiado Roma</p>${resumenCambios(inf.cambios)}
    ${e.fase !== 'fin' ? `<div class="ro-hiedra"><svg viewBox="0 0 22 14"><path d="M11 1c3 4 9 3 10 6-4 0-6 3-10 6-4-3-6-6-10-6 1-3 7-2 10-6z"/></svg></div><p class="ro-rubrica">Llega ${R.nombreEstacion(e.turno)}</p>${bandaSuceso()}` : ''}
    <button class="boton ro-sello" data-a="${e.fase === 'fin' ? 'veredicto' : 'a-ciudad'}">${e.fase === 'fin' ? 'Ver el veredicto' : 'Ver cómo ha crecido Roma'}</button>`);
}

function veredicto() {
  const f = e.fin, gana = f.gana;
  capa(`<div class="veredicto"><h2 class="ro-ansata">Veredicto</h2>
    <svg viewBox="0 0 120 70" width="150" height="88" aria-hidden="true">${gana ? '<path d="M60 64 C30 60 14 40 16 12 M60 64 C90 60 106 40 104 12" fill="none" stroke="#5d7a2a" stroke-width="3"/>' + [0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${20 + i * 3}" cy="${18 + i * 8}" rx="7" ry="3" fill="#7d9a45" transform="rotate(-50 ${20 + i * 3} ${18 + i * 8})"/><ellipse cx="${100 - i * 3}" cy="${18 + i * 8}" rx="7" ry="3" fill="#7d9a45" transform="rotate(50 ${100 - i * 3} ${18 + i * 8})"/>`).join('') : '<path d="M20 60 L40 22 L52 40 L64 14 L78 40 L100 60Z" fill="#8f826d"/><path d="M40 22 q4 -14 10 -6 q2 -10 10 -4" stroke="#6e6252" stroke-width="4" fill="none" opacity=".7"/>'}</svg>
    <div class="titulo ${gana ? 'gana' : 'pierde'}">${f.titulo}</div>
    <div class="nota">Nota: ${String(f.nota).replace('.', ',')} de 10</div>
    <ul>${f.causas.map(c => `<li>${c}</li>`).join('')}</ul>
    <p>${e.turno + 1} estaciones · ${e.legiones} legiones · ${e.saberes.length} saberes · Edad ${['I', 'II', 'III'][e.edad - 1]} · plebe ${e.plebe}</p>
    <button class="boton ro-sello" data-a="otra">Jugar otra vez</button>
    <button class="boton2" data-a="cerrar">Mirar la ciudad</button></div>`);
}

/* ---------- pintar todo ---------- */
function principal() {
  const b = $('principal'); b.classList.remove('apagado');
  if (e.fase === 'fin') b.textContent = 'Ver el veredicto';
  else if (e.fase === 'mando') b.textContent = 'Terminar la estación';
  else if (ui.tab !== 'senado') b.textContent = 'Ir al Senado a votar';
  else if (e.sel < 0) { b.textContent = 'Elige una ley para votar'; b.classList.add('apagado'); }
  else b.textContent = 'Llamar a votar';
}
function pintar() {
  cabecera();
  const c = $('cuerpo'), y = ui.tab === ui._ultimo ? c.scrollTop : 0;
  c.innerHTML = ui.tab === 'ciudad' ? pantallaCiudad() : ui.tab === 'senado' ? pantallaSenado() : pantallaMando();
  c.scrollTop = y; ui._ultimo = ui.tab;
  $('nav').innerHTML = [['ciudad', 'Ciudad', 'ciudad'], ['senado', 'Senado', 'senado'], ['mando', 'Mando', 'mando']].map(([t, n, i]) => `<button class="${ui.tab === t ? 'on' : ''}" data-a="tab" data-x="${t}">${ico(i)}${n}</button>`).join('');
  principal(); guardar();
}

/* ---------- toques ---------- */
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-a], #principal'); if (!t) return;
  if (t.id === 'principal') {
    if (e.fase === 'fin') return veredicto();
    if (e.fase === 'mando') { const inf = R.terminar(e); pintar(); return pasoEstacion(inf); }
    if (ui.tab !== 'senado') { ui.tab = 'senado'; return pintar(); }
    if (e.sel < 0) { const c = $('cuerpo').querySelector('.cartas'); if (c) { c.scrollIntoView({ block: 'center' }); c.animate([{ outline: '3px solid #9b2a1a' }, { outline: '3px solid transparent' }], 900); } return; }
    R.votar(e); pintar(); return recuento();
  }
  const a = t.dataset.a, x = t.dataset.x;
  if (a === 'tab') { ui.tab = x; pintar(); }
  else if (a === 'ley') { R.elegir(e, e.sel === +x ? -1 : +x); pintar(); }
  else if (a === 'trato') { const ciclo = [undefined, 'oro', 'promesa']; let i = ciclo.indexOf(e.tratos[x]); for (let n = 0; n < 3; n++) { i = (i + 1) % 3; if (!ciclo[i] || R.trato(e, x, ciclo[i])) { if (!ciclo[i]) R.trato(e, x, null); break; } } pintar(); }
  else if (a === 'pasar') { R.dejarPasar(e); ui.tab = 'mando'; pintar(); }
  else if (a === 'saltar') window.__ev7.saltar();
  else if (a === 'al-mando') { cierraCapa(); ui.tab = 'mando'; pintar(); }
  else if (a === 'a-ciudad') { cierraCapa(); ui.tab = 'ciudad'; pintar(); }
  else if (a === 'veredicto') veredicto();
  else if (a === 'otra') { cierraCapa(); e = R.crear(semillaNueva()); ui = nuevoUI(); pintar(); }
  else if (a === 'cerrar') { cierraCapa(); ui.tab = 'ciudad'; pintar(); }
});

/* ---------- arranque y gancho para las pruebas ---------- */
cargar();
window.__ev7 = { lista: false, estado: () => JSON.parse(JSON.stringify(e)), lugar: () => ui.tab, R, saltar: () => { } };
pintar();
if (e.fase === 'fin') veredicto();
window.__ev7.lista = true;
