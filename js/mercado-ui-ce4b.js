/* Arte: dibujos propios por código, Proyecto AQVILA, CC BY-SA 3.0; iconos de assets/iconos (mismo autor y licencia).
   AQVILA — CE4b: pantalla del mercado. Solo pantalla: las reglas están en mercado.js (window.MERCADO).
   Hoja con 4 pestañas: Precios, Rutas, Senado, Aduanas. Estilos propios con prefijo mu-, inyectados una sola vez.
   Uso: MERCADO_UI.abrir(caja, s, { ay, ciudad, aplicar(delta, avisos), cerrar() }) */
(function (root) {
  'use strict';
  const M = () => root.MERCADO;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CSS = '' +
    '.mu-hoja{box-sizing:border-box;display:flex;flex-direction:column;gap:10px;max-width:100%;color:var(--tinta,#2b1c0a);font-family:var(--libro,Georgia,serif);font-size:15px;line-height:1.3;overflow:clip}' +
    '.mu-hoja *{box-sizing:border-box}' +
    '.mu-cab{display:flex;align-items:center;gap:8px;min-width:0}' +
    '.mu-cab h2{flex:1;min-width:0;margin:0;font:700 20px/1.2 var(--serif,Georgia,serif);letter-spacing:.05em;overflow:clip;text-overflow:ellipsis;white-space:nowrap}' +
    '.mu-den{flex:none;font:700 16px/1 var(--serif,Georgia,serif);padding:6px 10px;border-radius:14px;background:rgba(60,35,10,.12)}' +
    '.mu-x{flex:none;min-width:44px;min-height:44px}' +
    '.mu-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}' +
    '.mu-btn,.mu-tab,.mu-x,.mu-sel{min-height:44px;padding:6px 10px;border-radius:8px;border:1px solid rgba(60,35,10,.7);background:var(--fibras,none),linear-gradient(#f5e6bd,#e3cc94);color:inherit;font:700 15px/1.15 var(--serif,Georgia,serif);cursor:pointer;overflow:clip}' +
    '.mu-tab{padding:6px 2px;font-size:14px}.mu-fila .mu-btn{padding:6px 2px;font-size:14px;white-space:nowrap}' +
    '.mu-tab[aria-selected=true]{background:linear-gradient(#f3e2b4,#d8bb80);border-color:var(--oliva,#46661f);box-shadow:inset 0 0 0 2px var(--oliva,#46661f)}' +
    '.mu-btn[disabled]{opacity:.45;cursor:default}' +
    '.mu-btn.mu-ok{border-color:var(--oliva,#46661f);color:#2f4713}' +
    '.mu-btn.mu-mal{border-color:var(--minio,#9b2a1a);color:#6e1d11}' +
    '.mu-sel{width:100%;font-weight:400;font-size:16px;padding-right:4px}' +
    '.mu-av{position:sticky;top:0;z-index:5;margin:0;box-shadow:0 2px 6px rgba(0,0,0,.25);background-color:#efd9d0;min-height:22px;padding:4px 8px;border-radius:5px;font-size:15px;color:#6e1d11;border-left:3px solid var(--minio,#9b2a1a)}' +
    '.mu-av:empty{display:none}' +
    '.mu-av.bien{background-color:#dfe5c0;color:#2f4713;border-left-color:var(--oliva,#46661f)}' +
    '.mu-sec{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:6px;border:1px solid rgba(60,35,10,.4);background:rgba(255,246,214,.45);overflow:clip}' +
    '.mu-sec h3{margin:0;font:700 16px/1.2 var(--serif,Georgia,serif);letter-spacing:.04em}' +
    '.mu-p{margin:0;overflow-wrap:anywhere}' +
    '.mu-nota{margin:0;font-size:12px;line-height:1.3;color:var(--tinta2,#5a4220);opacity:.9;overflow-wrap:anywhere}' +
    '.mu-sub{color:var(--tinta2,#5a4220);font-size:14px}' +
    '.mu-rej{display:grid;grid-template-columns:1fr 1fr;gap:6px}' +
    '.mu-prod{display:grid;grid-template-columns:44px 1fr;grid-template-rows:auto auto;column-gap:8px;align-items:center;text-align:left;min-height:64px;padding:6px 8px}' +
    '.mu-prod[aria-pressed=true]{border-color:var(--oliva,#46661f);box-shadow:inset 0 0 0 2px var(--oliva,#46661f)}' +
    '.mu-prod .ic{grid-row:1/3;font-size:22px;text-align:center}' +
    '.mu-prod .nm{min-width:0;overflow:clip;font-size:14px;line-height:1.1}' +
    '.mu-prod .pr{font-weight:400;font-size:14px;white-space:nowrap}' +
    '.mu-up{color:var(--minio,#9b2a1a)}.mu-dn{color:var(--oliva,#46661f)}' +
    '.mu-mot{display:block;font-weight:400;font-size:12px;color:var(--tinta2,#5a4220);overflow:clip;text-overflow:ellipsis;white-space:nowrap}' +
    '.mu-fila{display:flex;gap:6px;align-items:stretch}.mu-fila>*{flex:1;min-width:0}' +
    '.mu-lis{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}' +
    '.mu-lis li{padding:6px 8px;border-radius:5px;background:rgba(255,250,230,.55);border-left:3px solid var(--oliva,#46661f);display:flex;flex-direction:column;gap:6px;overflow:clip}' +
    '.mu-lis li.mal{border-left-color:var(--minio,#9b2a1a)}' +
    '.mu-cuenta{display:grid;grid-template-columns:1fr auto;gap:2px 8px;font-size:14px}' +
    '.mu-cuenta b{text-align:right;font-weight:700}' +
    '.mu-cuenta .tot{border-top:1px solid rgba(60,35,10,.4);padding-top:2px;font-weight:700}' +
    '.mu-barra{height:12px;border-radius:6px;background:rgba(60,35,10,.2);overflow:clip}' +
    '.mu-barra i{display:block;height:100%;background:var(--oliva,#46661f)}' +
    '.mu-tasa{display:grid;grid-template-columns:44px 1fr 44px;gap:6px;align-items:center}' +
    '.mu-tasa output{text-align:center;font:700 18px var(--serif,Georgia,serif)}' +
    '.mu-btn.mu-mini{padding:0;font-size:22px}' +
    '.mu-med{flex:none;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fbf0cf,#d9bf85);box-shadow:0 0 0 2.5px #b8862b,inset 0 0 0 1.5px rgba(60,35,10,.5);overflow:clip}' +
    '.mu-med img,.mu-med svg{display:block}' +
    '.mu-sello{display:inline-grid;place-items:center;width:17px;height:17px;border-radius:50%;font:700 9px/1 var(--serif,Georgia,serif);color:#fbf0cf;vertical-align:1px;box-shadow:0 0 0 1.5px #b8862b,inset 0 -2px 3px rgba(0,0,0,.3)}' +
    '.mu-sello.up{background:radial-gradient(circle at 35% 30%,#c4452f,#7a1c10)}.mu-sello.dn{background:radial-gradient(circle at 35% 30%,#6f9a3a,#35511a)}.mu-sello.eq{background:radial-gradient(circle at 35% 30%,#d9a94a,#8a6a20)}' +
    '.mu-den img,.mu-hoja img{vertical-align:-3px}.mu-den{display:inline-flex;align-items:center;gap:4px}' +
    '.mu-greca{display:block;margin:-4px 0 0;max-width:100%}' +
    '.mu-cabimg{border-radius:6px;overflow:clip;border:1px solid rgba(60,35,10,.5);background:radial-gradient(ellipse at 50% 0%,#fff3d0,#e5cd96);box-shadow:inset 0 0 0 2px rgba(184,134,43,.35)}' +
    '.mu-cabimg svg,.mu-mapa{display:block;width:100%;height:auto}' +
    '.mu-ley{display:flex;align-items:flex-start;gap:10px}.mu-ley>span:not(.mu-med){flex:1;min-width:0}.mu-ley .mu-esc{flex:none}' +
    '.mu-h3i{display:flex;align-items:center;gap:8px}' +
    '.mu-fic{display:flex;align-items:center;gap:12px}.mu-fict{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.mu-fict b{font:700 20px/1.15 var(--serif,Georgia,serif);letter-spacing:.04em}.mu-fict span{font-size:17px}.mu-fict em{font-size:14px;color:var(--tinta2,#5a4220)}' +
    '.mu-leyenda{margin-top:-4px}' +
    '.mu-barra{height:14px;border-radius:7px;background:#8f7a52;border:1px solid #5a4220;box-shadow:inset 0 2px 3px rgba(0,0,0,.35)}' +
    '.mu-barra i{background:repeating-linear-gradient(115deg,#c9964a 0 5px,#8a5a1e 5px 8px);border-right:2px solid #5a3a0e}' +
    /* MN4b: mármol veteado en la cabecera, filete y esquinas de bronce en las tarjetas, rótulos romanos */
    '.mu-cab{padding:4px 6px 4px 12px;border-radius:8px;border:1.5px solid #b8862b;box-shadow:inset 0 0 0 2px #f6ead0,inset 0 0 0 3px rgba(139,98,30,.55),0 1px 3px rgba(60,35,10,.35);background:linear-gradient(112deg,transparent 0 22%,rgba(120,100,80,.22) 22.4%,transparent 23.2% 47%,rgba(120,100,80,.18) 47.3%,transparent 48.2% 71%,rgba(150,120,80,.2) 71.3%,transparent 72.4%),linear-gradient(68deg,transparent 0 33%,rgba(130,110,90,.16) 33.4%,transparent 34.2% 85%,rgba(130,110,90,.18) 85.3%,transparent 86.2%),radial-gradient(ellipse at 30% 20%,#fffaf0,#efe6d2 60%,#ddd0b4)}' +
    '.mu-cab h2{text-shadow:0 1px 0 #fffaf0;color:#3a2410}' +
    '.mu-prod{position:relative;box-shadow:inset 0 0 0 3px #f2e2b6,inset 0 0 0 4px rgba(184,134,43,.65)}' +
    '.mu-prod::before,.mu-prod::after{content:"";position:absolute;width:10px;height:10px;pointer-events:none;border:0 solid #a8741f}' +
    '.mu-prod::before{left:2px;top:2px;border-width:2.5px 0 0 2.5px;border-radius:3px 0 0 0}.mu-prod::after{right:2px;bottom:2px;border-width:0 2.5px 2.5px 0;border-radius:0 0 3px 0}' +
    '.mu-prod .nm{letter-spacing:.04em;text-transform:uppercase;font-size:13.5px;color:#2b1c0a}' +
    '.mu-prod .mu-mot{margin-top:1px;font:700 11px/1.2 var(--serif,Georgia,serif);letter-spacing:.09em;text-transform:uppercase;color:#4a3210;text-shadow:0 1px 0 rgba(255,250,235,.7)}' +
    '.mu-sec{border:1.5px solid rgba(139,98,30,.7);box-shadow:inset 0 0 0 2px rgba(255,246,214,.7),inset 0 0 0 3px rgba(139,98,30,.35)}' +
    '.mu-sec>h3{text-transform:uppercase;letter-spacing:.1em;font-size:15px;padding-bottom:5px;border-bottom:2px solid #b8862b;background:linear-gradient(90deg,#b8862b,transparent) left bottom/100% 1px no-repeat}' +
    '.mu-nota{color:#4a3210;opacity:1}' +
    '.mu-tab{letter-spacing:.06em;text-transform:uppercase;font-size:13px;box-shadow:inset 0 0 0 2px #f6ead0,inset 0 0 0 3px rgba(139,98,30,.4)}' +
    '.mu-tab[aria-selected=true]{box-shadow:inset 0 0 0 2px #f6ead0,inset 0 0 0 4px var(--oliva,#46661f)}';
  function css() {
    if (typeof document === 'undefined' || document.getElementById('mu-css')) return;
    const e = document.createElement('style'); e.id = 'mu-css'; e.textContent = CSS; (document.head || document.documentElement).appendChild(e);
  }
  const num = (x, d) => (Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toString().replace('.', ',');
  const pct = t => num(t * 100, 1) + ' %';
  const CIU = () => (root.DATA && root.DATA.CITIES) || {};
  const nomC = id => (CIU()[id] && CIU()[id].n) || id || '—';
  const nomF = id => (root.DATA && root.DATA.FACTIONS && root.DATA.FACTIONS[id] && root.DATA.FACTIONS[id].n) || id || '—';
  const PRODS = () => (M() && M().PRODUCTOS) || {};
  const nomP = id => (PRODS()[id] && PRODS()[id].n) || id;
  const icoP = id => (PRODS()[id] && PRODS()[id].i) || '📦';
  const flechaH = f => f > 0 ? '<span class="mu-up" aria-label="sube">▲</span>' : f < 0 ? '<span class="mu-dn" aria-label="baja">▼</span>' : '<span class="mu-sub" aria-label="estable">●</span>';
  // ---------- Arte propio, dibujado por código (viewBox 32, trazo 1,5 tinta, rellenos de papiro y un acento) ----------
  const INK = '#2b1c0a', PAP = '#f1e0b2', SEP = '#d9bf85', MIN = '#9b2a1a', OLI = '#46661f', ORO = '#b8862b';
  const svg = (vb, inner, cls, extra) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" fill="none" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"' + (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true" focusable="false"' + (extra || '') + '>' + inner + '</svg>';
  const IC = {
    sal: '<path d="M4 27 10 15l5 4 5-10 8 18z" fill="#f4efe0"/><path d="M10 15l2 12M20 9l-2 18M15 19l1 8" stroke-width="1"/><path d="M3 27h26"/>',
    caballos: '<path d="M9 28l2-11c0-6 4-12 11-13l1 4 4 3-1 3-5-1c-2 2-2 5-1 8v7z" fill="#b07a3a"/><path d="M22 4c-4 1-8 5-9 9" /><circle cx="23.5" cy="9" r=".9" fill="' + INK + '"/><path d="M9 28h12"/>',
    pieles: '<path d="M9 5l3 3h8l3-3 5 5-3 4 2 5-4 2-1 6h-4l-1-5h-4l-1 5H9l-1-6-4-2 2-5-3-4z" fill="#c28a4a"/><path d="M13 12c2 2 4 2 6 0" stroke-width="1"/>',
    plata: '<path d="M3 27l2-7h10l2 7z" fill="#d8dde0"/><path d="M16 27l2-7h10l2 7z" fill="#e6e9ea"/><path d="M9.5 20l2-7h10l2 7z" fill="#cfd5d8"/><path d="M6 23h6M19 23h6M13 16h6" stroke-width="1"/>',
    marmol: '<path d="M4 12l6-5h18v14l-6 5H4z" fill="#f4f1ea"/><path d="M4 12h18v14M22 12l6-5"/><path d="M7 20l5-3 3 4M14 25l3-4" stroke="#8a8f99" stroke-width="1"/>',
    purpura: '<path d="M5 21c0-8 5-13 12-13 5 0 8 3 8 7 0 5-4 8-9 8-3 0-5-2-5-4s2-3 4-3" fill="#8a3a7e"/><path d="M25 17l4-3M25 20l5 1M23 24l4 3" /><path d="M14 11c3-1 6 0 7 3" stroke="#f1e0b2" stroke-width="1"/>',
    maderanaval: '<path d="M3 21h26l-4 7H8z" fill="#a8733a"/><path d="M16 21V3"/><path d="M16 4l9 5-9 5z" fill="#f1e0b2"/><path d="M8 24h16" stroke-width="1"/>',
    tablilla: '<rect x="5" y="4" width="22" height="24" rx="2" fill="#8a5a2a"/><rect x="8" y="7" width="16" height="18" rx="1" fill="#e8d09a"/><path d="M11 12h10M11 16h10M11 20h6" stroke-width="1.2"/>',
    tratado: '<path d="M6 5h20v19l-4 4H6z" fill="#f1e0b2"/><path d="M10 11h12M10 15h12M10 19h7"/><circle cx="23" cy="23" r="4.5" fill="' + MIN + '"/>',
    flota: '<path d="M3 21h26l-5 7H8z" fill="#a8733a"/><path d="M16 21V4"/><path d="M16 5l10 5-10 7z" fill="#f1e0b2"/><path d="M16 4l6-2v4z" fill="' + MIN + '"/>',
    barco: '<path d="M2 18h28l-6 8H8z" fill="#a8733a"/><path d="M16 18V3"/><path d="M16 4l9 4-9 7z" fill="#f1e0b2"/>',
    carro: '<circle cx="9" cy="24" r="4" fill="#d9bf85"/><circle cx="24" cy="24" r="4" fill="#d9bf85"/><path d="M3 10h26l-3 11H6z" fill="#c28a4a"/>'
  };
  const PINTADOS = { grano: 1, aceite: 1, vino: 1, verdura: 1, lana: 1, materiales: 1, hierro: 1, denarios: 1, 'min-comercio': 1, 'nav-senado': 1 };
  const LEYES = { annona: 'grano', monopolio_sal: 'sal', tratado: 'tratado', flota: 'flota' };
  // Dibujo de un producto o de una pieza: icono pintado del juego si existe, si no un SVG propio, y el emoji solo de reserva
  function ico(id, tam) {
    const R = (ico.raiz || '');
    tam = tam || 26;
    if (PINTADOS[id]) return '<img src="' + esc(R) + 'assets/iconos/' + id + '.svg" alt="" width="' + tam + '" height="' + tam + '">';
    if (IC[id]) return svg('0 0 32 32', IC[id], '', ' width="' + tam + '" height="' + tam + '"');
    const f = (PRODS()[id] && PRODS()[id].i) || '📦';
    return '<span style="font-size:' + Math.round(tam * .8) + 'px;line-height:1">' + esc(f) + '</span>';
  }
  const med = (id, tam) => '<span class="mu-med" style="width:' + tam + 'px;height:' + tam + 'px">' + ico(id, Math.round(tam * .66)) + '</span>';
  const denH = x => num(x, 2) + ' ' + ico('denarios', 15);
  const estM = m => { const n = Math.max(1, Math.ceil((+m || 0) / 3 - 1e-9)); return n + (n === 1 ? ' estación' : ' estaciones'); };   // ES20: meses internos dichos en estaciones
  const sello = f => f > 0 ? '<span class="mu-sello up" role="img" aria-label="sube">▲</span>' : f < 0 ? '<span class="mu-sello dn" role="img" aria-label="baja">▼</span>' : '<span class="mu-sello eq" role="img" aria-label="estable">=</span>';
  const ESCUDO = 'M4 3h24v14c0 7-6 11-12 13C10 28 4 24 4 17z';
  const EMBLEMA = {
    punicos: '<path d="' + ESCUDO + '" fill="#5a2a6e"/><path d="M16 10l-6 10h12z" fill="#e8c860" stroke="none"/><path d="M8.5 15h15" stroke="#e8c860"/><circle cx="16" cy="7.5" r="2" stroke="#e8c860"/>',
    griegos: '<path d="' + ESCUDO + '" fill="#1f4f8a"/><circle cx="12" cy="14" r="3.6" fill="' + PAP + '"/><circle cx="20" cy="14" r="3.6" fill="' + PAP + '"/><circle cx="12" cy="14" r="1.3" fill="' + INK + '" stroke="none"/><circle cx="20" cy="14" r="1.3" fill="' + INK + '" stroke="none"/><path d="M16 16l-1.8 3.5h3.6z" fill="#e8c860"/><path d="M9.5 9l2.5 2M22.5 9L20 11" stroke="#e8c860"/>',
    italicos: '<path d="' + ESCUDO + '" fill="#3a6a2a"/><path d="M16 9v16M10 8v5c0 2 2 3 6 3s6-1 6-3V8" stroke="#e8c860"/><path d="M10 8L9 5.5M16 9V5.5M22 8l1-2.5" stroke="#e8c860"/>'
  };
  const emblema = (id, tam) => EMBLEMA[id] ? svg('0 0 32 32', EMBLEMA[id], 'mu-esc', ' width="' + tam + '" height="' + tam + '"') : '';

  // ---------- Cabeceras ilustradas (viewBox 360 × 120) ----------
  const amf = (x, y, c, k) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (k || 1) + ')"><path d="M-3-16h6l1 5c7 3 8 14 1 19l-2 3h-6l-2-3c-7-5-6-16 1-19z" fill="' + c + '"/><path d="M-3-14c-5 0-5 5-3 6M3-14c5 0 5 5 3 6" stroke-width="1.2"/></g>';
  function toldo(x, c) {
    let s = '';
    for (let i = 0; i < 5; i++) s += '<path d="M' + (x + i * 20) + ' 30h20v16a10 8 0 0 1-20 0z" fill="' + (i % 2 ? PAP : c) + '"/>';
    return s + '<path d="M' + (x + 4) + ' 50V104M' + (x + 96) + ' 50V104"/><rect x="' + (x + 4) + '" y="80" width="92" height="24" fill="' + SEP + '"/>';
  }
  const cabPrecios = () => '<path d="M0 104h360" stroke-width="2"/>' + toldo(10, MIN) + toldo(120, OLI) +
    '<g fill="' + MIN + '"><circle cx="30" cy="76" r="5"/><circle cx="42" cy="77" r="5"/><circle cx="54" cy="76" r="5"/><circle cx="66" cy="77" r="5"/></g>' + amf(150, 80, '#c0834a', .9) + amf(170, 80, '#a8733a', .9) + '<ellipse cx="200" cy="76" rx="14" ry="5" fill="#d9a85a"/><ellipse cx="200" cy="72" rx="9" ry="4" fill="#e8c27a"/>' +
    amf(250, 104, '#c0834a', 1.1) + '<path d="M300 104V36M290 104h20M286 44h28"/><path d="M262 44h76" stroke-width="2"/><path d="M262 44l-7 24M262 44l7 24M338 44l-7 24M338 44l7 24" stroke-width="1"/><path d="M253 68q9 10 18 0z M329 68q9 10 18 0z" fill="' + ORO + '"/><circle cx="300" cy="34" r="3.5" fill="' + ORO + '"/>';
  const cabSenado = () => '<path d="M0 104h360" stroke-width="2"/><path d="M40 48L145 20l105 28z" fill="' + SEP + '"/><path d="M62 46l83-22 83 22" stroke-width="1"/><circle cx="145" cy="38" r="5" fill="' + MIN + '"/><rect x="44" y="48" width="202" height="8" fill="' + PAP + '"/>' +
    [0, 1, 2, 3, 4, 5].map(i => '<rect x="' + (52 + i * 36) + '" y="56" width="14" height="36" fill="' + PAP + '"/><rect x="' + (49 + i * 36) + '" y="56" width="20" height="4" fill="' + SEP + '"/><path d="M' + (57 + i * 36) + ' 62v28M' + (61 + i * 36) + ' 62v28" stroke-width=".8"/>').join('') +
    '<rect x="42" y="92" width="206" height="4" fill="' + SEP + '"/><rect x="36" y="96" width="218" height="4" fill="' + PAP + '"/><rect x="30" y="100" width="230" height="4" fill="' + SEP + '"/>' +
    '<g transform="translate(274 18) scale(2.5)">' + IC.tablilla + '</g>';
  const cabAduanas = () => '<path d="M0 92c15-6 30 6 45 0s30 6 45 0 30 6 45 0 30 6 45 0 30 6 45 0 30 6 45 0 30 6 45 0 30 6 45 0V120H0z" fill="#cdd5c3" stroke-width="1"/><path d="M180 90h180v8H180z" fill="#a8733a"/><path d="M190 98v16M240 98v16M290 98v16M340 98v16"/>' +
    '<path d="M18 76h122c-4 16-20 24-61 24s-57-8-61-24z" fill="#a8733a"/><path d="M26 84h106" stroke-width="1"/><path d="M79 76V14"/><path d="M50 22h58" stroke-width="2"/><path d="M52 23h54v38H52z" fill="' + PAP + '"/><path d="M79 23v38" stroke="' + MIN + '" stroke-width="7"/><path d="M79 14l14 4-14 4z" fill="' + MIN + '"/><path d="M79 14l-48 62M79 14l58 62" stroke-width=".8"/>' +
    amf(200, 90, '#c0834a', .9) + amf(220, 90, '#a8733a', .9) + amf(240, 90, '#c0834a', .9) + amf(210, 66, '#a8733a', .9) + amf(230, 66, '#c0834a', .9) +
    '<rect x="276" y="56" width="56" height="34" fill="' + SEP + '"/><path d="M268 58l36-26 36 26z" fill="' + MIN + '"/><rect x="296" y="66" width="16" height="24" fill="#6b4a22"/><circle cx="322" cy="72" r="4" fill="' + ORO + '"/>';
  const cab = (cuerpo, h) => '<div class="mu-cabimg">' + svg('0 0 360 120', cuerpo, '', ' role="img"') + '</div>';
  const GRECA = '<svg class="mu-greca" xmlns="http://www.w3.org/2000/svg" width="100%" height="10" aria-hidden="true"><defs><pattern id="mu-gr" width="20" height="10" patternUnits="userSpaceOnUse"><path d="M0 9V1h8v6H3V4h2" fill="none" stroke="' + ORO + '" stroke-width="1.4"/><path d="M10 9V1h8v6h-5V4h2" fill="none" stroke="' + INK + '" stroke-width="1" opacity=".55"/></pattern></defs><rect width="100%" height="10" fill="url(#mu-gr)"/></svg>';

  // ---------- Mapa de rutas: las ciudades salen de DATA.CITIES (lon/lat), proyección lineal recortada a lo que se ve ----------
  function mapaSvg(ids, rutas, viajes, fantasma, via) {
    const C = CIU(), W = 360, H = 200, pts = ids.filter(id => C[id] && typeof C[id].lon === 'number');
    if (!pts.length) return '';
    const kx = .78;
    let lo0 = 1e9, lo1 = -1e9, la0 = 1e9, la1 = -1e9;
    pts.forEach(id => { lo0 = Math.min(lo0, C[id].lon); lo1 = Math.max(lo1, C[id].lon); la0 = Math.min(la0, C[id].lat); la1 = Math.max(la1, C[id].lat); });
    const dlo = Math.max(3, lo1 - lo0), dla = Math.max(2.2, la1 - la0), cx = (lo0 + lo1) / 2, cy = (la0 + la1) / 2;
    const k = Math.min((W - 90) / (dlo * kx), (H - 56) / dla);
    const P = id => ({ x: W / 2 + (C[id].lon - cx) * kx * k, y: H / 2 - (C[id].lat - cy) * k });
    let s = '<rect x="1" y="1" width="358" height="198" rx="4" fill="#d6dcc4"/><rect x="5" y="5" width="350" height="190" rx="2" fill="none" stroke="' + ORO + '" stroke-width="1"/>';
    for (let i = 1; i < 6; i++) s += '<path d="M' + (i * 60) + ' 5V195" stroke="' + INK + '" stroke-width=".4" opacity=".25"/>';
    for (let i = 1; i < 4; i++) s += '<path d="M5 ' + (i * 50) + 'H355" stroke="' + INK + '" stroke-width=".4" opacity=".25"/>';
    s += '<g transform="translate(332 30)"><circle r="14" fill="' + PAP + '" stroke-width="1"/><path d="M0-13V13M-13 0H13" stroke-width="1"/><path d="M0-13l3.5 10h-7z" fill="' + MIN + '"/><text y="-17" text-anchor="middle" font-size="9" font-weight="700" fill="' + INK + '" stroke="none">N</text></g>';
    const colocadas = [];
    const lin = (a, b, o) => {
      const A = P(a), B = P(b), mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      let r = '<path d="M' + A.x.toFixed(1) + ' ' + A.y.toFixed(1) + 'L' + B.x.toFixed(1) + ' ' + B.y.toFixed(1) + '" stroke="' + o.c + '" stroke-width="' + (o.w || 1.8) + '" stroke-dasharray="' + (o.d || '6 4') + '"' + (o.op ? ' opacity="' + o.op + '"' : '') + '/>';
      if (o.mar != null) colocadas.push({ x0: mx - 12, x1: mx + 12, y0: my - 12, y1: my + 12 });
      if (o.mar != null) r += '<g transform="translate(' + (mx - 11).toFixed(1) + ' ' + (my - 11).toFixed(1) + ')"><circle cx="11" cy="11" r="11" fill="' + PAP + '" stroke="' + o.c + '" stroke-width="1.2"/><g transform="translate(3 3) scale(.5)">' + (o.mar ? IC.barco : IC.carro) + '</g></g>';
      return r;
    };
    rutas.forEach(r => { s += lin(r.a, r.b, { c: INK, mar: via(r.a, r.b) === 'mar' }); });
    viajes.forEach(v => { s += lin(v.a, v.b, { c: MIN, d: '2 4', mar: v.via === 'mar' }); });
    if (fantasma) s += lin(fantasma.a, fantasma.b, { c: OLI, d: '3 5', w: 1.6, op: .8 });
    const mios = {}; rutas.forEach(r => { mios[r.a] = 1; }); if (fantasma) mios[fantasma.a] = 1;
    pts.forEach(id => { const p = P(id); colocadas.push({ x0: p.x - 6, x1: p.x + 6, y0: p.y - 6, y1: p.y + 6 }); });
    pts.forEach(id => {
      const p = P(id), n = nomC(id), w = n.length * 5.8 + 4;
      const cand = [[8, -7, 'start'], [0, -11, 'middle'], [8, 14, 'start'], [0, 21, 'middle'], [-8, -7, 'end'], [-8, 14, 'end']];
      let pick = cand[0], libre = false;
      for (const c of cand) {
        const x0 = c[2] === 'start' ? p.x + c[0] : c[2] === 'end' ? p.x + c[0] - w : p.x - w / 2, y0 = p.y + c[1] - 10, b = { x0, x1: x0 + w, y0, y1: y0 + 12 };
        const ok = b.x0 > 6 && b.x1 < 354 && b.y0 > 6 && b.y1 < 194 && !colocadas.some(o => b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
        if (ok) { pick = c; libre = true; colocadas.push(b); break; }
      }
      if (!libre) { const x0 = pick[2] === 'start' ? p.x + pick[0] : p.x + pick[0] - w; colocadas.push({ x0, x1: x0 + w, y0: p.y + pick[1] - 10, y1: p.y + pick[1] + 2 }); }
      s += '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="4.5" fill="' + (mios[id] ? MIN : PAP) + '" stroke-width="1.4"/>' +
        '<text x="' + (p.x + pick[0]).toFixed(1) + '" y="' + (p.y + pick[1]).toFixed(1) + '" text-anchor="' + pick[2] + '" font-size="11" font-family="Georgia,serif" font-weight="700" fill="' + INK + '" stroke="#e9eed8" stroke-width="3" stroke-linejoin="round" paint-order="stroke">' + esc(n) + '</text>';
    });
    return svg('0 0 360 200', s, 'mu-mapa', ' role="img" aria-label="Mapa de tus rutas"');
  }
  const TABS = [['precios', 'Precios'], ['rutas', 'Rutas'], ['senado', 'Senado'], ['aduanas', 'Aduanas']];

  function abrir(caja, s, opts) {
    opts = opts || {}; css(); ico.raiz = opts.raiz || '';
    const mesAbs = () => Math.floor((s.t || 0) + 1e-9);
    const ay = opts.ay || null;
    const dueno = c => (ay && ay.dueño ? ay.dueño(c) : null) || (s.cities && s.cities[c] && s.cities[c].owner) || (CIU()[c] && CIU()[c].f);
    const misCiudades = () => Object.keys(s.cities || CIU()).filter(c => CIU()[c] && dueno(c) === 'roma');
    const todas = () => Object.keys(s.cities || CIU()).filter(c => CIU()[c]);
    const tengo = p => (ay && ay.tiene ? +ay.tiene(p) || 0 : null);
    const E = { tab: 'precios', ciudad: opts.ciudad || misCiudades()[0] || 'roma', prod: null, aviso: '', bien: false, dest: '', rprod: '', cargas: 1, op: {} };
    const q = opts.pestana;
    if (q && TABS.some(t => t[0] === q)) E.tab = q;
    const origen = () => misCiudades().indexOf(E.ciudad) >= 0 ? E.ciudad : misCiudades()[0];
    const aviso = (t, bien) => { E.aviso = t || ''; E.bien = !!bien; };
    const aplicar = (d, av) => { if (opts.aplicar) opts.aplicar(d || {}, av || []); };
    const falta = n => '<p class="mu-nota">' + esc(n) + '</p>';
    const hay = f => typeof (M() || {})[f] === 'function';

    // ---------- Pestaña Precios ----------
    function pPrecios() {
      const m = M(), c = E.ciudad;
      let h = '';
      const mias = misCiudades();
      if (mias.length > 1) h += '<select class="mu-sel" data-mu="ciudad" aria-label="Ciudad">' + mias.map(x => '<option value="' + esc(x) + '"' + (x === c ? ' selected' : '') + '>' + esc(nomC(x)) + '</option>').join('') + '</select>';
      const por = m.puedeComerciar ? m.puedeComerciar(s, c, ay) : '';
      if (por) h += '<p class="mu-av">' + esc(nomC(c) + ': ' + por + '. Mirar sí puedes; comprar y vender, no.') + '</p>';
      const tab = m.tabla(s, c, ay);
      if (E.prod && !PRODS()[E.prod]) E.prod = null;
      if (E.prod) h += ficha(tab.find(x => x.prod === E.prod), !por); else h += cab(cabPrecios());
      h += '<div class="mu-sec"><h3>Precios en ' + esc(nomC(c)) + '</h3><div class="mu-rej">' + tab.map(x =>
        '<button type="button" class="mu-btn mu-prod" data-mu="prod" data-p="' + esc(x.prod) + '" aria-pressed="' + (x.prod === E.prod) + '"><span class="ic">' + med(x.prod, 44) + '</span>' +
        '<span class="nm">' + esc(x.n) + '</span><span class="pr">' + num(x.precio, 2) + ' ' + sello(x.flecha) + (x.motivo ? '<span class="mu-mot">' + esc(x.motivo) + '</span>' : '') + '</span></button>').join('') + '</div>' +
        '<p class="mu-nota">Precio de una carga, en denarios. Sello rojo ▲: sube. Sello verde ▼: baja, respecto a la estación pasada.</p></div>';
      if (!E.prod) h += consejo();
      return h;
    }
    function consejo() {
      const m = M(); if (!hay('consejo')) return '';
      let t = ''; try { t = m.consejo(s, ay).texto; } catch (e) { t = ''; }
      return t ? '<div class="mu-sec"><h3 class="mu-h3i">' + ico('min-comercio', 28) + ' Consejo del Edil</h3><p class="mu-p">' + esc(t) + '</p></div>' : '';
    }
    function ficha(x, puede) {
      if (!x) return '';
      const m = M(), c = E.ciudad, p = x.prod, mj = m.mejores(s, p, 3, ay);
      const lis = l => l.map(o => esc(nomC(o.ciudad)) + ' ' + num(o.precio, 2)).join(' · ');
      const t = tengo(p), bt = (n, dir) => '<button type="button" class="mu-btn ' + (dir ? 'mu-ok' : 'mu-mal') + '" data-mu="' + (dir ? 'vender' : 'comprar') + '" data-n="' + n + '"' + (puede ? '' : ' disabled') + '>' + (dir ? 'Vender ' : 'Comprar ') + n + '</button>';
      return '<div class="mu-sec"><div class="mu-fic">' + med(p, 64) + '<div class="mu-fict"><b>' + esc(x.n) + '</b><span>' + denH(x.precio) + ' ' + sello(x.flecha) + '</span>' + (x.motivo ? '<em>' + esc(x.motivo) + '</em>' : '') + '</div></div>' +
        (t != null ? '<p class="mu-p mu-sub">Tienes ' + num(t, 0) + ' cargas.</p>' : '') +
        '<div class="mu-fila">' + bt(1, 0) + bt(5, 0) + bt(10, 0) + '</div><div class="mu-fila">' + bt(1, 1) + bt(5, 1) + bt(10, 1) + '</div>' +
        '<p class="mu-p"><b>Más barato:</b> ' + lis(mj.barato) + '</p><p class="mu-p"><b>Más caro:</b> ' + lis(mj.caro) + '</p>' +
        '<button type="button" class="mu-btn" data-mu="cerrarficha">Cerrar ficha</button></div>' + consejo();
    }

    // ---------- Pestaña Rutas ----------
    function cuentaH(r) {
      const m = M(); let cu, fl;
      try { cu = m.rutaCuenta(s, r, ay); fl = m.flete(s, r.a, r.b, r.prod, r.cargas, ay); } catch (e) { return ''; }
      const fila = (k, v, cl) => '<span>' + k + '</span><b class="' + (cl || '') + '">' + v + '</b>';   // ES20: por estación (3 envíos)
      return '<div class="mu-cuenta">' + fila('Compra', denH(cu.compra * 3)) + fila('Venta', denH(cu.venta * 3)) + fila('Flete', denH(cu.flete * 3)) + fila('Aduana', denH((cu.portoria || 0) * 3)) +
        '<span class="tot">Neto por estación</span><b class="tot ' + (cu.neto >= 0 ? 'mu-dn' : 'mu-up') + '">' + denH(cu.neto * 3) + '</b></div>' +
        '<p class="mu-nota">' + ico(fl.via === 'mar' ? 'barco' : 'carro', 16) + (fl.via === 'mar' ? ' Por mar' : ' Por tierra') + ' · ' + estM(fl.meses) + ' · riesgo de perder la carga ' + Math.round((fl.riesgo || 0) * 100) + ' %' + (fl.bloqueado ? ' · PUERTO BLOQUEADO' : '') + '</p>';
    }
    function pRutas() {
      const m = M(), ms = s.mercado || {}, h0 = [];
      const rutas = ms.rutas || [], viajes = ms.viajes || [];
      let h = '<div class="mu-sec"><h3>Tus rutas</h3>';
      if (!rutas.length) h += '<p class="mu-p mu-sub">Aún no tienes rutas. Una ruta lleva carga sola cada mes.</p>';
      else h += '<ul class="mu-lis">' + rutas.map(r => '<li><span class="mu-p"><b>' + esc(nomC(r.a)) + ' → ' + esc(nomC(r.b)) + '</b><br>' + ico(r.prod, 20) + ' ' + esc(nomP(r.prod)) + ' · ' + r.cargas * 3 + ' cargas por estación</span>' + cuentaH(r) +
        '<button type="button" class="mu-btn mu-mal" data-mu="rquitar" data-id="' + esc(r.id) + '">Quitar ruta</button></li>').join('') + '</ul>';
      h += '</div>';
      if (viajes.length) h += '<div class="mu-sec"><h3>Viajes en curso</h3><ul class="mu-lis">' + viajes.map(v => '<li><span class="mu-p"><b>' + esc(nomC(v.a)) + ' → ' + esc(nomC(v.b)) + '</b><br>' + ico(v.prod, 20) + ' ' + v.cargas + ' cargas de ' + esc(nomP(v.prod)) + ' · faltan ' + estM(v.resta) + '</span></li>').join('') + '</ul></div>';
      // formulario
      const o = misCiudades().indexOf(E.ciudad) >= 0 ? E.ciudad : misCiudades()[0];
      const dests = todas().filter(x => x !== o);
      if (!E.dest || E.dest === o || dests.indexOf(E.dest) < 0) E.dest = dests[0] || '';
      if (!E.rprod || !PRODS()[E.rprod]) E.rprod = m.ORDEN[0];
      const tope = m.rutaTope(s, o, E.dest, ay);
      if (tope && E.cargas > tope) E.cargas = tope; if (E.cargas < 1) E.cargas = 1;
      const r = { a: o, b: E.dest, prod: E.rprod, cargas: E.cargas };
      h += '<div class="mu-sec"><h3>Nueva ruta o viaje</h3><p class="mu-p">Sales de <b>' + esc(nomC(o)) + '</b>. Tope: ' + tope + ' cargas.</p>' +
        '<select class="mu-sel" data-mu="dest" aria-label="Destino">' + dests.map(x => '<option value="' + esc(x) + '"' + (x === E.dest ? ' selected' : '') + '>Destino: ' + esc(nomC(x)) + '</option>').join('') + '</select>' +
        '<select class="mu-sel" data-mu="rprod" aria-label="Producto">' + m.ORDEN.map(x => '<option value="' + esc(x) + '"' + (x === E.rprod ? ' selected' : '') + '>' + esc(nomP(x)) + '</option>').join('') + '</select>' +
        '<div class="mu-tasa"><button type="button" class="mu-btn mu-mini" data-mu="cargas" data-d="-1" aria-label="Menos cargas">−</button><output>' + E.cargas + (E.cargas === 1 ? ' carga' : ' cargas') + '</output><button type="button" class="mu-btn mu-mini" data-mu="cargas" data-d="1" aria-label="Más cargas">+</button></div>' +
        cuentaH(r) +
        '<div class="mu-fila"><button type="button" class="mu-btn mu-ok" data-mu="rcrear">Crear ruta</button><button type="button" class="mu-btn" data-mu="viaje">Lanzar viaje ahora</button></div></div>';
      const ids = [o, E.dest]; rutas.concat(viajes).forEach(x => { ids.push(x.a, x.b); });
      const nueva = !rutas.some(x => x.a === o && x.b === E.dest);
      const mapa = mapaSvg(ids.filter((x, i) => x && ids.indexOf(x) === i), rutas, viajes, nueva ? { a: o, b: E.dest } : null, (a, b) => { try { return m.flete(s, a, b, 'grano', 1, ay).via; } catch (e) { return 'tierra'; } });
      return '<div class="mu-cabimg mu-mapaw">' + mapa + '</div><p class="mu-nota mu-leyenda"><b>Trazo negro:</b> tus rutas. <b class="mu-up">Rojo:</b> viajes en curso. <b class="mu-dn">Verde:</b> la que vas a crear.</p>' + h;
    }

    // ---------- Pestaña Senado ----------
    function pSenado() {
      const m = M(), ms = s.mercado || {}, mes = mesAbs();
      let h = cab(cabSenado()) + '<div class="mu-sec"><h3>Leyes del mercado</h3>';
      let pos = []; try { pos = m.contratosPosibles(s, ay); } catch (e) { pos = []; }
      h += '<ul class="mu-lis">' + pos.map(k => {
        const vig = (ms.contratos || []).filter(x => x.id === k.id && x.hasta > mes).map(x => estM(x.hasta - mes) + (x.f ? ' con ' + nomF(x.f) : ''));
        let acc = '';
        if (k.id === 'tratado') {
          const op = k.opciones || [];
          acc = op.length ? '<select class="mu-sel" data-mu="trat" aria-label="Facción">' + op.map(f => '<option value="' + esc(f) + '">' + esc(nomF(f)) + '</option>').join('') + '</select><button type="button" class="mu-btn" data-mu="ley" data-id="tratado">Proponer al Senado</button>' : '<p class="mu-nota">No hay facción en paz con la que pactar.</p>';
        } else if (!k.vigente) acc = '<button type="button" class="mu-btn" data-mu="ley" data-id="' + esc(k.id) + '">Proponer al Senado</button>';
        return '<li><span class="mu-p mu-ley">' + med(LEYES[k.id] || 'tablilla', 44) + '<span><b>' + esc(k.n) + '</b><br><span class="mu-sub">' + esc(k.texto) + '</span></span></span>' +
          (vig.length ? '<span class="mu-p"><b class="mu-dn">Vigente:</b> quedan ' + esc(vig.join('; ')) + '.</span>' : '') + acc + '</li>';
      }).join('') + '</ul></div>';
      h += '<div class="mu-sec"><h3>Contratos públicos (publicanos)</h3>';
      if (!hay('publicanosVer')) return h + falta('Contratos públicos: —') + '</div>';
      let pv = { ofertas: [], aceptados: [] }; try { pv = m.publicanosVer(s, ay) || pv; } catch (e) { /* nada */ }
      const PB = m.PUBLICANOS || {};
      const quien = k => k.n || (PB[k.tipo] && PB[k.tipo].n) || k.tipo;
      h += '<p class="mu-p"><b>Ofertas</b></p>';
      h += pv.ofertas.length ? '<ul class="mu-lis">' + pv.ofertas.map(k => '<li><span class="mu-p mu-ley">' + med('tablilla', 44) + '<span><b>' + esc(quien(k)) + '</b><br>Piden ' + esc(k.cargas + ' cargas de ' + nomP(k.prod)) + (k.destino ? ' para ' + esc(nomC(k.destino)) : '') + '.<br>Pagan ' + denH(k.paga) + ' · plazo ' + estM(k.plazo) + ' · la oferta caduca en ' + estM(Math.max(0, k.caduca - mes)) + '.</span></span>' +
        '<button type="button" class="mu-btn" data-mu="pujar" data-id="' + esc(k.id) + '">Pujar (fianza ' + num(k.fianza, 0) + ')</button></li>').join('') + '</ul>' : '<p class="mu-p mu-sub">Hoy los publicanos no ofrecen nada.</p>';
      h += '<p class="mu-p"><b>Aceptados</b></p>';
      h += pv.aceptados.length ? '<ul class="mu-lis">' + pv.aceptados.map(k => {
        const t = tengo(k.prod), n = Math.max(0, Math.min(k.falta != null ? k.falta : k.cargas - k.entregado, t == null ? 1e9 : Math.floor(t)));
        const pc = Math.min(100, Math.round(100 * (k.entregado || 0) / Math.max(1, k.cargas)));
        return '<li><span class="mu-p mu-ley">' + med(k.prod, 44) + '<span><b>' + esc(quien(k)) + '</b><br>' + esc(nomP(k.prod)) + (k.destino ? ' para ' + esc(nomC(k.destino)) : '') + ' · pagan ' + denH(k.paga) + ' · quedan ' + estM(Math.max(0, (k.hasta || 0) - mes)) + '.</span></span>' +
          '<div class="mu-barra" role="progressbar" aria-valuemin="0" aria-valuemax="' + k.cargas + '" aria-valuenow="' + (k.entregado || 0) + '"><i style="width:' + pc + '%"></i></div><span class="mu-p">Entregado ' + (k.entregado || 0) + ' de ' + k.cargas + '</span>' +
          '<button type="button" class="mu-btn mu-ok" data-mu="entregar" data-id="' + esc(k.id) + '" data-n="' + n + '"' + (n < 1 ? ' disabled' : '') + '>Entregar ' + n + '</button></li>';
      }).join('') + '</ul>' : '<p class="mu-p mu-sub">No has aceptado ningún contrato.</p>';
      const fu = []; pv.ofertas.concat(pv.aceptados).forEach(k => { const f = k.fuente || (PB[k.tipo] && PB[k.tipo].fuente); if (f && fu.indexOf(f) < 0) fu.push(f); });
      h += '<p class="mu-nota">' + esc(fu.length ? fu.join(' ') : 'Los publicanos arrendaban al Estado obras y suministros (Polibio 6.17).') + ' Cifras y plazos: licencia de juego.</p></div>';
      return h;
    }

    // ---------- Pestaña Aduanas ----------
    function pAduanas() {
      const m = M(), TM = m.TASA_MAX != null ? m.TASA_MAX : 0.05;
      let h = cab(cabAduanas()) + '<div class="mu-sec"><h3>Aduanas (portorium)</h3><p class="mu-p">Subir la aduana da dinero, pero espanta a los mercaderes rivales.</p>';
      if (!hay('aduanasVer')) h += falta('Aduanas: —');
      else {
        let l = []; try { l = m.aduanasVer(s, ay) || []; } catch (e) { l = []; }
        h += '<ul class="mu-lis">' + l.map(a => '<li><b>' + esc(a.n || nomC(a.ciudad)) + '</b><div class="mu-tasa"><button type="button" class="mu-btn mu-mini" data-mu="tasa" data-c="' + esc(a.ciudad) + '" data-d="-1" aria-label="Bajar la aduana de ' + esc(a.n || nomC(a.ciudad)) + '"' + (a.tasa <= 1e-9 ? ' disabled' : '') + '>−</button><output>' + pct(a.tasa) + '</output><button type="button" class="mu-btn mu-mini" data-mu="tasa" data-c="' + esc(a.ciudad) + '" data-d="1" aria-label="Subir la aduana de ' + esc(a.n || nomC(a.ciudad)) + '"' + (a.tasa >= TM - 1e-9 ? ' disabled' : '') + '>+</button></div>' +
          '<span class="mu-sub">Recaudado el último mes: ' + denH(a.recaudado || 0) + '</span></li>').join('') + '</ul>';
        if (!l.length) h += '<p class="mu-p mu-sub">No tienes ciudades con aduana.</p>';
      }
      h += '</div><div class="mu-sec"><h3>Mercaderes rivales</h3>';
      if (!hay('rivalesVer')) return h + falta('Rivales: —') + '</div>';
      let rv = []; try { rv = m.rivalesVer(s, ay) || []; } catch (e) { rv = []; }
      h += '<ul class="mu-lis">' + rv.map(r => {
        let t;
        if (r.enGuerra) t = 'En guerra contigo.';
        else if (r.que) t = 'Lleva ' + nomP(r.que.prod).toLowerCase() + ' de ' + (r.que.na || nomC(r.que.a)) + ' a ' + (r.que.nb || nomC(r.que.b)) + '.';
        else t = 'Sin negocio ahora.';
        return '<li class="' + (r.enGuerra ? 'mal' : '') + '"><span class="mu-p mu-ley">' + emblema(r.id, 48) + '<span><b>' + esc(r.n) + '</b><br>' + esc(t) + '</span></span></li>';
      }).join('') + '</ul></div>';
      return h;
    }

    function pinta() {
      const m = M();
      if (!m) { caja.innerHTML = '<p class="mu-av">No se cargó el mercado.</p>'; return; }
      const d = tengo('denarios');
      const body = E.tab === 'precios' ? pPrecios() : E.tab === 'rutas' ? pRutas() : E.tab === 'senado' ? pSenado() : pAduanas();
      caja.innerHTML = '<div class="mu-hoja"><div class="mu-cab"><h2>Mercado</h2>' + (d != null ? '<span class="mu-den" data-mu-den>' + num(d, 1) + ' ' + ico('denarios', 20) + '</span>' : '') + (opts.cerrar ? '<button type="button" class="mu-btn mu-x" data-mu="cerrar" aria-label="Cerrar el mercado">✕</button>' : '') + '</div>' + GRECA +
        '<div class="mu-tabs" role="tablist">' + TABS.map(t => '<button type="button" role="tab" class="mu-tab" data-mu="tab" data-t="' + t[0] + '" aria-selected="' + (E.tab === t[0]) + '">' + t[1] + '</button>').join('') + '</div>' +
        '<p class="mu-av' + (E.bien ? ' bien' : '') + '" role="status" aria-live="polite">' + esc(E.aviso) + '</p>' + body + '</div>';
    }
    // Resultado de una operación: suma el delta, muestra el motivo si falla
    function res(r, ok) {
      if (!r) { aviso('No se pudo.'); return; }
      if (r.ok === false) { aviso(r.motivo || 'No se pudo.'); return; }
      aplicar(r.delta, r.avisos);
      const av = (r.avisos || []).map(a => typeof a === 'string' ? a : (a && (a.texto || a.t)) || '').filter(Boolean);
      aviso(av.length ? av.join(' ') : ok || 'Hecho.', true);
    }
    const clic = ev => {
      const b = ev.target.closest && ev.target.closest('[data-mu]'); if (!b || !caja.contains(b) || b.disabled) return;
      const a = b.getAttribute('data-mu'), m = M(), D = b.dataset;
      if (a === 'tab') { E.tab = D.t; aviso(''); }
      else if (a === 'cerrar') { if (opts.cerrar) opts.cerrar(); return; }
      else if (a === 'prod') { E.prod = E.prod === D.p ? null : D.p; aviso(''); }
      else if (a === 'cerrarficha') { E.prod = null; aviso(''); }
      else if (a === 'comprar' || a === 'vender') {
        const r = m[a](s, E.ciudad, E.prod, +D.n, ay);
        res(r, (a === 'comprar' ? 'Compraste ' : 'Vendiste ') + D.n + ' de ' + nomP(E.prod) + (r && r.precioMedio ? ' a ' + num(r.precioMedio, 2) + ' de media' : '') + '.');
      }
      else if (a === 'cargas') { E.cargas = Math.max(1, E.cargas + (+D.d)); aviso(''); }
      else if (a === 'rquitar') { m.rutaQuitar(s, D.id); aviso('Ruta quitada.', true); }
      else if (a === 'rcrear') { const r = m.rutaCrear(s, { a: origen(), b: E.dest, prod: E.rprod, cargas: E.cargas }, ay); res(r, 'Ruta creada.'); }
      else if (a === 'viaje') { const r = m.viajeLanzar(s, { a: origen(), b: E.dest, prod: E.rprod, cargas: E.cargas }, ay); res(r, 'Viaje en marcha.'); }
      else if (a === 'ley') {
        const op = D.id === 'tratado' ? { f: (caja.querySelector('[data-mu=trat]') || {}).value } : {};
        const r = m.contratoProponer(s, D.id, op, ay);
        if (r && r.ok && r.aprobado) { aplicar(r.delta, r.avisos); aviso('El Senado lo aprueba.', true); } else aviso((r && r.motivo) || 'El Senado lo rechaza.');
      }
      else if (a === 'pujar') res(m.publicanoAceptar(s, D.id, ay), 'Contrato aceptado. Corre el plazo.');
      else if (a === 'entregar') res(m.publicanoEntregar(s, D.id, +D.n, ay), 'Entregadas ' + D.n + ' cargas.');
      else if (a === 'tasa') {
        const TM = m.TASA_MAX != null ? m.TASA_MAX : 0.05;
        const cur = (m.aduanasVer(s, ay).find(x => x.ciudad === D.c) || {}).tasa || 0;
        const nueva = Math.max(0, Math.min(TM, Math.round((cur + 0.005 * (+D.d)) * 1000) / 1000));
        m.portoriumFijar(s, D.c, nueva); aviso('Aduana de ' + nomC(D.c) + ': ' + pct(nueva) + '.', true);
      }
      pinta();
    };
    const cambia = ev => {
      const b = ev.target.closest && ev.target.closest('select[data-mu]'); if (!b) return;
      const a = b.getAttribute('data-mu');
      if (a === 'ciudad') { E.ciudad = b.value; E.prod = null; aviso(''); pinta(); }
      else if (a === 'dest') { E.dest = b.value; pinta(); }
      else if (a === 'rprod') { E.rprod = b.value; pinta(); }
    };
    caja.addEventListener('click', clic); caja.addEventListener('change', cambia); pinta();
    return () => { caja.removeEventListener('click', clic); caja.removeEventListener('change', cambia); caja.innerHTML = ''; };
  }
  root.MERCADO_UI = { abrir };
})(typeof window !== 'undefined' ? window : globalThis);
