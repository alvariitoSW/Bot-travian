/* AQVILA — interfaz: mapa 3D como pantalla principal, paneles, modales y pantalla de batalla */
import { MapView3D } from './gfx/map3d.js';
import { BattleView3D } from './gfx/battle3d.js';
import { portrait } from './gfx/models.js';
import { preload, loadIndex, realPortrait } from './gfx/units.js';
import { preloadStatic, loadStaticIndex } from './gfx/statics.js';
import { CityView3D } from './gfx/city3d.js';
import { loadGroundTextures } from './gfx/ground.js';
import { fijar as fijarFluidez, estaEncendido as fluidezOn } from './gfx/fluidez.js';

const D = window.DATA, G = window.Game, $ = id => document.getElementById(id);
const UI = { codice: null, tab: 'map', city: 'roma', sel: null, modalQ: [], modalOpen: false, battle: null, menu: true, last: 0, saveT: 0, map: null };
const ROMA = D.FACTIONS.roma.col;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => { n = Math.floor(n); return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(n); };
const months = m => m < 1 ? Math.max(1, Math.round(m * 30)) + ' días' : (m >= 12 ? (m / 12).toFixed(1).replace('.', ',') + ' años' : m.toFixed(1).replace('.', ',') + ' meses');
/* Iconos de línea de la guía de arte (E1b), dibujados aquí en SVG: sustituyen en pantalla a los emojis de data.js */
const svgIco = (d, oro) => '<svg class="ico' + (oro ? ' oro' : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
D.RES_ICON = {
  madera: svgIco('<ellipse cx="6" cy="12" rx="2.6" ry="4.5"/><path d="M6 7.5h11.5c1.4 0 2.6 2 2.6 4.5s-1.2 4.5-2.6 4.5H6"/><path d="M6 11v2M11 10.5h4M12.5 13.5h3.5"/>'),
  piedra: svgIco('<path d="M3 13.5h18v6.5H3zM12 13.5V20M6.5 13.5V7h11v6.5"/><path d="M9 10h2M14.5 16.8h2"/>'),
  hierro: svgIco('<path d="M8.5 7.5h7l1.5 4.5h-10z"/><path d="M7 12l-3.5 5.5h17L17 12M8.5 7.5L3.5 17.5M15.5 7.5l5 10"/>'),
  grano: svgIco('<path d="M12 21.5V8"/><path d="M12 8c-1.6-1.7-1.6-3.8 0-5.5 1.6 1.7 1.6 3.8 0 5.5z"/><path d="M12 13c-2.6 0-3.8-1.6-3.8-3.8 2.6 0 3.8 1.6 3.8 3.8zM12 13c2.6 0 3.8-1.6 3.8-3.8-2.6 0-3.8 1.6-3.8 3.8zM12 18c-2.6 0-3.8-1.6-3.8-3.8 2.6 0 3.8 1.6 3.8 3.8zM12 18c2.6 0 3.8-1.6 3.8-3.8-2.6 0-3.8 1.6-3.8 3.8z"/>'),
  oro: svgIco('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6.3" stroke-dasharray="1.2 2.1"/><path d="M10 9.2l4 5.6M14 9.2l-4 5.6"/>', true)
};
D.POP_ICON = svgIco('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.6-6 6-6s6 2.4 6 6"/><circle cx="16.8" cy="9" r="2.5"/><path d="M17.5 14.2c2.2.5 3.6 2.4 3.6 5"/>');
const costHtml = c => '<div class="cost">' + Object.keys(c).map(r => '<span>' + D.RES_ICON[r] + ' ' + fmt(c[r]) + '</span>').join('') + '</div>';
const pt = (k, col) => { const u = realPortrait(k, col || ROMA) || portrait(k, col || ROMA); return u ? '<img src="' + u + '" alt="">' : '<span style="display:grid;place-items:center;height:100%;font-size:22px">' + D.UNITS[k].g + '</span>'; };
const troopsHtml = (u, col) => { const k = Object.keys(u).filter(x => u[x] > 0); return k.length ? '<div class="troops">' + k.map(x => '<div class="troop">' + pt(x, col) + '<em>' + u[x] + '</em><b>' + D.UNITS[x].n + '</b></div>').join('') + '</div>' : '<div class="empty">Sin tropas.</div>'; };
const S = () => G.state;
const licHtml = o => o && o.lic ? '<div class="licl"><span class="lic">licencia de juego</span> ' + esc(o.lic) + '</div>' : '';
const cohort = k => (D.UNITS[k].cls === 'cav' ? 10 : 20);

/* ---------- avisos y modales ---------- */
function toast(txt, kind) {
  const t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = txt; $('toasts').appendChild(t);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
  setTimeout(() => t.remove(), 3200);
}
function modal(html, sticky) { UI.modalQ.push({ html: html, sticky: sticky }); pump(); }
function pump() {
  if (UI.modalOpen || !UI.modalQ.length) return;
  const m = UI.modalQ.shift(); UI.modalOpen = true; UI.sticky = m.sticky;
  $('mbox').innerHTML = m.html; $('modal').hidden = false; $('mbox').scrollTop = 0;
}
function closeModal() { UI.modalOpen = false; $('modal').hidden = true; pump(); }

G.onEvent = function (type, p) {
  if (type === 'event') modal('<div class="yr">' + p.y + ' A.C.</div><h2>' + esc(p.t) + '</h2><p>' + esc(p.x) + '</p><div class="acts"><button class="btn" data-act="close">Continuar</button></div>');
  else if (type === 'alert') toast(p, 'bad');
  else if (type === 'log') { if (p.k === 'good') toast(p.x); else if (p.k === 'bad') toast(p.x, 'bad'); UI.dirty = true; }
  else if (type === 'dirty') UI.dirty = true;
  else if (type === 'over') { if (!UI.battle && !UI.binfo) showOver(); }
};

/* ---------- menú ---------- */
function showMenu() {
  UI.menu = true; $('menu').hidden = false;
  const img = portrait('general', ROMA);
  $('menu').innerHTML = (img ? '<div class="hero"><img src="' + img + '" alt=""></div>' : '') + '<h1>AQVILA</h1><div class="sub">EL ASCENSO DE ROMA</div>' +
    '<p>280 a.C. Gobierna tus ciudades, levanta legiones, dirige las batallas sobre el terreno y lleva las águilas hasta Cartago antes del 146 a.C.</p>' +
    (G.hasSave() ? '<button class="btn gold" data-act="continue">Continuar campaña</button>' : '') +
    '<input id="hname" maxlength="28" placeholder="Nombre de tu general" value="Lucio Cornelio Escipión">' +
    '<button class="btn" data-act="new">Nueva campaña</button><button class="btn" data-act="fluidez">' + (fluidezOn() ? 'Dejar de medir fluidez' : 'Medir fluidez') + '</button><div class="spqr">S·P·Q·R</div>' +
    '<div class="credits">Modelos y animaciones de las unidades: 0 A.D. © Wildfire Games, licencia CC BY-SA 3.0<br>Letra Cinzel © The Cinzel Project Authors, licencia SIL OFL 1.1</div>';
}
function startGame() { UI.menu = false; $('menu').hidden = true; UI.city = 'roma'; UI.sel = null; if (UI.map) UI.map.center('roma'); setTab('map'); }
function showOver() {
  const s = S(), o = s.over; if (!o || UI.overShown) return; UI.overShown = true;
  modal('<div class="yr">' + (o.win ? 'VICTORIA' : 'DERROTA') + '</div><h2>' + (o.win ? 'Roma Victrix' : 'Vae victis') + '</h2><p>' + esc(o.why) + '</p>' +
    '<p>Ciudades: <b>' + G.myCities().length + '</b> de ' + Object.keys(D.CITIES).length + ' · Batallas: <b>' + s.stats.wins + '/' + s.stats.battles + '</b> ganadas\nEnemigos abatidos: <b>' + s.stats.kills + '</b> · Bajas propias: <b>' + s.stats.lost + '</b>\n' + esc(s.hero.name) + ', nivel <b>' + s.hero.lvl + '</b></p>' +
    '<div class="acts"><button class="btn" data-act="tomenu">Volver al menú</button></div>', true);
}

/* ---------- HUD ---------- */
function buildTop() { $('res').innerHTML = D.RES.map(r => '<div class="r" id="rb-' + r + '">' + D.RES_ICON[r] + '<b id="r-' + r + '"></b><small id="p-' + r + '"></small></div>').join(''); }
function tickUI() {
  const s = S(); if (!s) return;
  const p = G.prod(), cap = G.cap();
  for (const r of D.RES) {
    $('r-' + r).textContent = fmt(s.res[r]);
    const e = $('p-' + r), v = Math.round(p[r]); e.textContent = (v >= 0 ? '+' : '') + v; e.className = v < 0 ? 'neg' : '';
    $('rb-' + r).classList.toggle('full', s.res[r] >= cap - 1);
  }
  $('date').textContent = G.dateStr(s.t);
  document.querySelectorAll('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.v === s.speed));
  document.querySelectorAll('[data-t1]').forEach(e => {
    const t0 = +e.dataset.t0, t1 = +e.dataset.t1, f = Math.max(0, Math.min(1, (s.t - t0) / (t1 - t0)));
    const bar = e.querySelector('i'); if (bar) bar.style.width = (f * 100).toFixed(1) + '%';
    const rem = e.parentElement.querySelector('.rem'); if (rem) rem.textContent = s.t < t0 ? 'en cola' : 'faltan ' + months(Math.max(0, t1 - s.t));
  });
  document.querySelectorAll('[data-need]').forEach(b => b.classList.toggle('no', !G.canAfford(JSON.parse(b.dataset.need))));
}

/* ---------- paneles ---------- */
function setTab(t) {
  UI.tab = t;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === t));
  const c3 = t === 'city' && UI.cityV && !UI.cityList;            // ciudad en 3D (o en lista si se prefiere)
  $('view').hidden = t === 'map' || c3; $('zoom').hidden = t !== 'map'; $('citywrap').hidden = !c3; $('ctop').hidden = !c3; $('csheet').hidden = !c3;
  if (c3) UI.cityV.resize();
  if (t === 'map') renderSheet(); else { $('sheet').hidden = true; $('view').scrollTop = 0; render(); }
}
function cityChips() {
  const my = G.myCities(); if (!my.includes(UI.city)) UI.city = my[0] || 'roma';
  return '<div class="chips">' + my.map(id => '<button class="chip ' + (id === UI.city ? 'on' : '') + '" data-act="city" data-v="' + id + '">' + D.CITIES[id].n + (S().hero.city === id ? ' 🦅' : '') + '</button>').join('') + '</div>';
}
function render() {
  UI.dirty = false;
  if (!S()) return; if (UI.tab === 'map') { renderSheet(); return; }
  if (UI.tab === 'city' && UI.cityV && !UI.cityList) { renderCity3D(); tickUI(); return; }
  const v = $('view'), st = v.scrollTop;
  v.innerHTML = UI.tab === 'city' ? viewCity() : UI.tab === 'army' ? viewArmy() : UI.tab === 'hero' ? viewHero() : viewLog();
  v.scrollTop = st; tickUI();
}
function effect(b, L) {
  const B = D.BUILD[b];
  if (B.prod) return '+' + Math.round(G.rate(L) * (b === 'foro' ? 0.5 : 1)) + '/mes';
  if (b === 'almacen') return 'Cap. ' + fmt(600 * Math.pow(1.45, L));
  if (b === 'muralla') return '+' + L * 10 + ' % def.';
  if (b === 'templo') return '+' + L * 10 + ' % exp.';
  if (b === 'acueducto') return '+' + L * 40 + ' población máx.';
  if (b === 'termas') return '+' + L * 4 + ' felicidad · +' + L * 15 + ' pob.';
  if (b === 'anfiteatro') return '+' + L * 6 + ' felicidad';
  return 'Nv ' + L;
}
const dondeEsp = k => G.dondeEspecial(k).slice(0, 3).map(i => D.CITIES[i].n).join(', ');
const faltaBtn = k => '<button class="btn no" disabled>Falta ' + D.ESPECIAL[k].n.toLowerCase() + '<small>' + D.ESPECIAL[k].i + ' en ' + dondeEsp(k) + '</small></button>';
const espLinea = c => { if (c.owner !== 'roma') return ''; const e = D.ESPECIAL[D.CITIES[UI.city].esp]; return e ? '<span class="stat">' + e.i + ' Bien de la ciudad: <b>' + e.n + '</b> — ' + esc(e.d) + '</span>' : ''; };
const espResumen = () => {
  const t = G.especiales(), ks = Object.keys(D.ESPECIAL), tiene = ks.filter(k => t[k]), falta = ks.filter(k => !t[k]);
  return '<span class="stat">Tienes: ' + (tiene.map(k => D.ESPECIAL[k].i + ' ' + D.ESPECIAL[k].n).join(' · ') || 'ninguno') + '.</span>' + (falta.length ? '<span class="stat">Te faltan: ' + falta.map(k => D.ESPECIAL[k].i + ' ' + D.ESPECIAL[k].n + ' (' + dondeEsp(k) + ')').join(' · ') + '</span>' : '');
};
function buildCard(c, b) {
  const B = D.BUILD[b], L = c.b[b] || 0, q = c.queue && c.queue.b === b, max = L >= D.MAX_LVL, cost = G.cost(b, L);
  const fe = c.owner === 'roma' && !max && !q ? G.faltaEspecial('edificio', b, L) : null, sinSol = B.solar && L < 1 && !q && G.solaresUsados(c) >= G.solares(UI.city), derr = B.solar && L >= 1 && !q && b !== 'foro' && c.owner === 'roma', dk = UI.city + ':' + b;
  if (sinSol) return '<div class="card locked"><div class="ic">' + B.i + '</div><div class="bd"><div class="tt">' + B.n + '<span class="lv">Nv 0</span></div><div class="ds">Derriba otro edificio urbano para liberar un solar.</div></div><button class="btn no" disabled>Sin solares</button></div>';
  return '<div class="card"><div class="ic">' + B.i + '</div><div class="bd"><div class="tt">' + B.n + '<span class="lv">Nv ' + L + '</span></div>' +
    '<div class="ds">' + (max ? effect(b, L) + ' · nivel máximo' : effect(b, L) + ' → ' + effect(b, L + 1)) + '</div>' +
    (q ? '<div class="prog" data-t0="' + c.queue.t0 + '" data-t1="' + c.queue.t1 + '"><i></i></div><span class="rem"></span>' : max ? '' : costHtml(cost)) +
    (derr ? '<div><button class="chip" data-act="derr" data-v="' + b + '"' + (UI.derr === dk ? ' style="color:#e05050"' : '') + '>' + (UI.derr === dk ? '¿Seguro? Derribar' : 'Derribar') + '</button></div>' : '') + '</div>' +
    (q || max ? '' : fe ? faltaBtn(fe) : '<button class="btn ' + (c.queue ? 'no' : '') + '" data-act="up" data-v="' + b + '" ' + (c.queue ? '' : "data-need='" + JSON.stringify(cost) + "'") + '>' + (L ? 'Mejorar' : 'Construir') + '<small>' + months(G.buildTime(c, b)) + '</small></button>') + '</div>';
}
const impHtml = c => {
  if (c.owner !== 'roma') return '';
  const f = G.felicidad(c), col = f >= 60 ? 'var(--good,#5c5)' : f >= 40 ? '#e0a030' : '#e05050', cara = f >= 60 ? '😊' : f >= 40 ? '😐' : '😠';
  return '<div class="imp"><span class="stat" style="color:' + col + '">' + cara + ' Felicidad <b>' + f + '</b>' + (f < D.FELICIDAD_MIN_CRECER ? ' · la población no crece' : '') + '</span><div class="impb">' +
    Object.keys(D.IMPUESTOS).map(k => '<button class="chip ' + ((c.imp || 'normal') === k ? 'on' : '') + '" data-act="imp" data-v="' + k + '">' + D.IMPUESTOS[k].n + '</button>').join('') + '</div></div>';
};
const manoHtml = c => { if (c.owner !== 'roma') return ''; const z = Math.round(G.manoObra(c) * 100); return '<span class="stat" style="' + (z < 80 ? 'color:#e0a030' : '') + '">⛏️ Mano de obra: <b>' + Math.min(Math.floor(c.pop), G.puestos(c)) + '</b> de ' + G.puestos(c) + ' puestos (' + z + ' %)</span>'; };
const solHtml = c => {
  if (c.owner !== 'roma') return '';
  const n = G.solares(UI.city), u = G.solaresUsados(c), t = G.tipoDe(c), sug = G.tipoSugerido(UI.city);
  return '<span class="stat" style="' + (u >= n ? 'color:#e0a030' : '') + '">🧱 Solares: <b>' + u + '</b> de ' + n + (u >= n ? ' · no queda ninguno' : '') + '</span>' +
    '<span class="stat">' + t.i + ' <b>' + t.n + '</b> · ' + esc(t.d) + (!c.tipoElegido && sug ? ' Sugerido: ' + D.TIPOS[sug].n + '.' : '') + ' <button class="chip" data-act="tipos">' + (c.tipoElegido ? 'Cambiar tipo' : 'Elegir tipo · gratis') + '</button></span>';
};
function tiposModal() {
  const c = S().cities[UI.city], coste = G.tipoCoste(c), sug = G.tipoSugerido(UI.city);
  let h = '<div class="yr">TIPO DE CIUDAD</div><h2>' + D.CITIES[UI.city].n + '</h2>' + licHtml({ lic: 'Colonia, municipio y emporio eran nombres o estatus reales, pero nadie «elegía» su oficio: el reparto es invención del juego.' }) +
    '<p>' + (coste ? 'Cambiar de tipo cuesta ' + coste + ' ' + D.RES_ICON.oro + '.' : 'La primera elección es gratis.') + '</p>';
  for (const k in D.TIPOS) {
    const t = D.TIPOS[k], act = c.tipo === k && c.tipoElegido, sinMar = !G.tipoOk(UI.city, k), sinOro = S().res.oro < coste, no = act || sinMar || sinOro;
    h += '<div class="card ' + (sinMar ? 'locked' : '') + '"><div class="ic">' + t.i + '</div><div class="bd"><div class="tt">' + t.n + (k === sug ? '<span class="lv">Sugerido</span>' : '') + '</div><div class="ds">' + esc(t.d) + '</div>' + (sinMar ? '<div class="ds" style="color:#e0a030">Esta ciudad no tiene mar.</div>' : '') + '</div>' +
      '<button class="btn ' + (no ? 'no' : '') + '" ' + (no ? 'disabled' : 'data-act="tipo" data-v="' + k + '"') + '>' + (act ? 'Actual' : 'Elegir') + (coste && !act ? '<small>' + coste + ' ' + D.RES_ICON.oro + '</small>' : '') + '</button></div>';
  }
  return h + '<div class="acts"><button class="btn ghost" data-act="close">Cerrar</button></div>';
}
const popHtml = c => '<span class="stat">' + D.POP_ICON + ' Población <b>' + Math.floor(c.pop) + '</b> / ' + G.popCap(c) + '</span><span class="stat">🪖 Reclutas disponibles <b>' + G.recruits(c) + '</b></span>' + manoHtml(c) + solHtml(c) + espLinea(c) + impHtml(c);
function marketHtml() {
  const rate = G.tradeRate(); if (!rate) return '';
  UI.mf = UI.mf || 'madera'; UI.mt = UI.mt || 'hierro';
  const chips = (act, cur) => D.RES.map(r => '<button class="chip ' + (r === cur ? 'on' : '') + '" data-act="' + act + '" data-v="' + r + '">' + D.RES_ICON[r] + '</button>').join('');
  return '<div class="market"><div class="tt">⚖️ Mercado · cambio ' + Math.round(rate * 100) + ' %</div><div class="mrow"><span>Doy</span>' + chips('mfrom', UI.mf) + '</div><div class="mrow"><span>Recibo</span>' + chips('mto', UI.mt) + '</div>' +
    '<div class="btns" style="flex-direction:row">' + [100, 500, 2000].map(n => '<button class="btn" data-act="trade" data-n="' + n + '" data-need=\'' + JSON.stringify({ [UI.mf]: n }) + '\'>' + n + ' ' + D.RES_ICON[UI.mf] + ' → ' + Math.floor(n * rate) + ' ' + D.RES_ICON[UI.mt] + '</button>').join('') + '</div></div>';
}
function forjaHtml(c) {
  if (!(c.b.herreria > 0)) return '';
  const f = S().forja, hl = c.b.herreria;
  return '<div class="sec">Herrería · mejoras del ejército</div>' + Object.keys(D.FORJA).map(k => {
    const F = D.FORJA[k], L = f[k], max = L >= D.FORJA_MAX, topada = !max && L >= hl, en = f.cola && f.cola.k === k, cost = G.forjaCost(k, L, UI.city);
    const ef = (L * D.FORJA_BONO * 100).toFixed(0) + ' % ' + F.ef + (max ? ' · nivel máximo' : ' → +' + ((L + 1) * D.FORJA_BONO * 100).toFixed(0) + ' %');
    return '<div class="card"><div class="ic">' + F.i + '</div><div class="bd"><div class="tt">' + F.n + '<span class="lv">Nv ' + L + '</span></div><div class="ds">+' + ef + '</div>' +
      (en ? '<div class="prog" data-t0="' + f.cola.t0 + '" data-t1="' + f.cola.t1 + '"><i></i></div><span class="rem"></span>' : max ? '' : topada ? '<div class="ds">Mejora la herrería a nivel ' + (L + 1) + '.</div>' : costHtml(cost)) + '</div>' +
      (en || max || topada ? '' : '<button class="btn ' + (f.cola ? 'no' : '') + '" data-act="forja" data-v="' + k + '" ' + (f.cola ? '' : "data-need='" + JSON.stringify(cost) + "'") + '>Mejorar ' + F.n.toLowerCase() + '<small>' + months(G.forjaTime(k, L, UI.city)) + '</small></button>') + '</div>';
  }).join('');
}
const RES_NOM = { madera: 'Madera', piedra: 'Piedra', hierro: 'Hierro', grano: 'Grano' };
function repartoHtml(c) {
  if (c.owner !== 'roma') return '';
  const r = G.repartoDe(c), w = Math.max(0, (c.pop || 0) - G.MIN_POP), base = { madera: 4 + G.rate(c.b.aserradero), piedra: 4 + G.rate(c.b.cantera), hierro: 4 + G.rate(c.b.mina), grano: 6 + G.rate(c.b.granja) };
  const fila = k => {
    const mas = r[k] < 11 && G.REPARTO_RES.some(o => o !== k && r[o] > 1), menos = r[k] > 1 && G.REPARTO_RES.some(o => o !== k && r[o] < 11);
    return '<div class="ald"><span class="aln">' + D.RES_ICON[k] + ' ' + RES_NOM[k] + '</span>' +
      '<button class="albtn" data-act="rep" data-r="' + k + '" data-d="-1" aria-label="Menos aldeanos a ' + (k === 'madera' ? 'la ' : 'el ') + k + '"' + (menos ? '' : ' disabled') + '>−</button>' +
      '<b class="alnum">' + Math.round(r[k] * w / 20) + '</b>' +
      '<button class="albtn" data-act="rep" data-r="' + k + '" data-d="1" aria-label="Más aldeanos a ' + (k === 'madera' ? 'la ' : 'el ') + k + '"' + (mas ? '' : ' disabled') + '>+</button>' +
      '<span class="alp">' + fmt(base[k] * r[k] / 5) + '/mes</span></div>';
  };
  return '<div class="sec">Aldeanos</div><div class="empty">Mueve aldeanos de un recurso a otro. El total no cambia.</div>' + G.REPARTO_RES.map(fila).join('');
}
function viewCity() {
  const s = S(), c = s.cities[UI.city], d = D.CITIES[UI.city];
  let h = cityChips() + '<div class="head"><h2>' + d.n + '</h2><p>' + esc(d.h) + '</p></div>' + (UI.cityV ? '<div class="acts" style="margin:0 0 6px"><button class="btn ghost" data-act="clist">Ver la ciudad en 3D</button></div>' : '') + '<div class="sec">Edificios</div>';
  h = h.replace('<div class="sec">Edificios</div>', '<div class="empty">' + popHtml(c) + '</div>' + repartoHtml(c) + (c.owner === 'roma' ? '<div class="empty">' + espResumen() + '</div>' : '') + '<div class="sec">Edificios</div>');
  for (const b in D.BUILD) { if (D.BUILD[b].sea && !d.sea) continue; h += buildCard(c, b); if (b === 'mercado') h += marketHtml(); if (b === 'herreria') h += forjaHtml(c); }
  return h + '<div class="empty">' + Object.keys(D.BUILD).map(b => D.BUILD[b].i + ' ' + D.BUILD[b].d).join('<br>') + '</div>';
}
function renderCity3D() {
  const s = S(), c = s.cities[UI.city];
  $('ctop').innerHTML = cityChips().replace('</div>', '<button class="chip" data-act="clist">☰ Lista</button></div>') + '<div class="chips views"><button class="chip" data-act="cview" data-v="ciudad">🏛️ Ciudad</button><button class="chip" data-act="cview" data-v="calle">🚶 Calles</button><button class="chip" data-act="cview" data-v="ejercito">⚔️ Ejército</button><button class="chip" data-act="tab" data-v="map">🗺️ Mapa</button></div>';
  $('csheet').innerHTML = '<div class="cpop">' + popHtml(c) + '</div>' + (UI.bsel ? buildCard(c, UI.bsel) + (UI.bsel === 'mercado' ? marketHtml() : '') + (UI.bsel === 'herreria' ? forjaHtml(c) : '') + '<div class="empty" style="background:var(--glass);border-radius:12px;margin-top:6px;padding:8px 12px">' + D.BUILD[UI.bsel].d + '</div>'
    : '<div class="empty" style="background:var(--glass);border-radius:12px;padding:10px 12px;text-align:center">Toca un edificio para construirlo o mejorarlo · arrastra para girar la ciudad</div>');
}
const bar = (label, v, max) => '<span>' + label + '</span><u><s style="width:' + Math.min(100, v / max * 100) + '%"></s></u>';
const avisoMo = (c, n) => { const z = Math.round(G.manoObraDe(c, Math.max(0, (c.pop || 0) - n)) * 100); return z < 100 ? '<div class="ds" style="color:#e0a030">Los campos quedarán al ' + z + ' % (+' + n + ')</div>' : ''; };
function viewArmy() {
  const s = S(), c = s.cities[UI.city], p = G.prod();
  let h = cityChips() + '<div class="sec">Guarnición de ' + D.CITIES[UI.city].n + ' · ' + G.men(c.units) + ' hombres</div>' + troopsHtml(c.units);
  h += '<div class="empty">' + popHtml(c) + '</div>';
  h += '<div class="empty">🌾 Consumo de todas tus tropas: ' + Math.round(p.upkeep) + ' grano/mes · 🪙 Mantenimiento: −' + Math.round(p.mant.total) + ' oro (edificios ' + Math.round(p.mant.edificios) + ', paga ' + Math.round(p.mant.tropas) + ') · 🧱 Guardia urbana al defender: ' + (20 + 20 * (c.b.muralla || 0)) + '<br>Para enviarlas a la guerra, toca una ciudad vecina en el mapa.</div>';
  if (c.train.length) {
    h += '<div class="sec">En instrucción</div>';
    h += c.train.map(q => '<div class="row"><div style="display:flex;justify-content:space-between"><span>' + q.n + ' × ' + D.UNITS[q.u].n + '</span><span class="rem"></span></div><div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div></div>').join('');
  }
  h += '<div class="sec">Reclutar</div>';
  for (const k in D.UNITS) {
    const u = D.UNITS[k]; if (!u.cost) continue;
    const ok = G.unitOk(c, k), rb = Object.keys(u.req)[0], n = cohort(k), fe = (c.b[rb] || 0) >= u.req[rb] ? G.faltaEspecial('tropa', k) : null;
    h += '<div class="card ' + (ok ? '' : 'locked') + '"><div class="pt">' + pt(k) + '</div><div class="bd"><div class="tt">' + u.n + '</div><div class="ds">' + u.d + '</div>' + licHtml(u) +
      '<div class="bars">' + bar('Ataque', u.ratk || u.atk, 16) + bar('Defensa', u.def, 16) + bar('Moral', u.mor, 100) + bar('Velocidad', u.spd, 85) + '</div>' + costHtml(G.unitCost(k, n)) + (ok ? avisoMo(c, n) : '') + '</div>' +
      (ok ? '<div class="btns"><button class="btn" data-act="train" data-v="' + k + '" data-n="' + n + '" data-need=\'' + JSON.stringify(G.unitCost(k, n)) + '\'>+' + n + '</button><button class="btn" data-act="train" data-v="' + k + '" data-n="' + n * 3 + '" data-need=\'' + JSON.stringify(G.unitCost(k, n * 3)) + '\'>+' + n * 3 + '</button></div>'
        : fe ? faltaBtn(fe) : '<button class="btn no">' + D.BUILD[rb].n + '<small>nivel ' + u.req[rb] + '</small></button>') + '</div>';
  }
  return h;
}
function viewHero() {
  const s = S(), h = s.hero, need = G.xpNeed(h.lvl);
  const where = h.wound > s.t ? '🩸 Herido — se recupera en ' + months(h.wound - s.t) : h.march ? '🚩 En marcha con el ejército' : '📍 En ' + D.CITIES[h.city].n;
  const SK = { mando: ['⚔️ Mando', '+4 % de ataque de tu ejército por nivel'], disc: ['🛡️ Disciplina', '+3 % de defensa y +4 de moral por nivel'], log: ['🧭 Logística', '+8 % de velocidad de marcha y +10 % de botín por nivel'] };
  let o = '<div class="head"><div class="pt">' + pt('general') + '</div><h2>' + esc(h.name) + '</h2><p>General de la República · Nivel ' + h.lvl + '</p>' + '<div class="xp"><i style="width:' + Math.min(100, h.xp / need * 100) + '%"></i></div><p>Experiencia ' + h.xp + ' / ' + need + '<br>' + where + '</p></div>';
  o += '<div class="sec">Habilidades · ' + h.pts + ' punto' + (h.pts === 1 ? '' : 's') + '</div>';
  for (const k in SK) o += '<div class="card"><div class="bd"><div class="tt">' + SK[k][0] + '<span class="lv">Nv ' + h.sk[k] + '</span></div><div class="ds">' + SK[k][1] + '</div></div><button class="btn ' + (h.pts > 0 && h.sk[k] < 10 ? 'gold' : 'no') + '" data-act="skill" data-v="' + k + '">＋</button></div>';
  return o + '<div class="empty">Tu general combate con su guardia de caballería cuando acompaña a un ejército o defiende la ciudad en la que está. Gana experiencia en cada batalla; si su guardia es aniquilada, quedará herido dos años.</div>';
}
function viewCodice() {
  const K = window.CODICE, sec = UI.codice, N = { tropas: 'Tropas', ciudades: 'Ciudades', hechos: 'Hechos' };
  let o = '<div class="acts"><button class="btn ghost" data-act="codice" data-v="">← Volver a la Crónica</button></div><div class="cdxs">' + Object.keys(N).map(k => '<button class="btn ' + (k === sec ? 'gold' : 'ghost') + '" data-act="codice" data-v="' + k + '">' + N[k] + '</button>').join('') + '</div>';
  o += '<div class="empty cdxn"><span class="lic lic-h">histórico</span> lo cuentan las fuentes antiguas. <span class="lic lic-p">probable</span> es lo más razonable, sin certeza. <span class="lic">licencia de juego</span> se cambió para poder jugar.</div>';
  return o + (K[sec] || []).map(f => '<div class="card cdx">' + (sec === 'tropas' && D.UNITS[f.id] ? '<div class="pt">' + pt(f.id) + '</div>' : '') + '<div class="bd"><div class="tt">' + (sec === 'hechos' ? esc(f.id) + ' a.C. — ' : '') + esc(f.t) + '</div><div><span class="lic ' + (f.tag === 'histórico' ? 'lic-h' : f.tag === 'probable' ? 'lic-p' : '') + '">' + esc(f.tag) + '</span></div><div class="ds">' + esc(f.x) + '</div><div class="cdxf">Fuente: ' + esc(f.src) + '</div></div></div>').join('');
}
function viewLog() {
  if (UI.codice && window.CODICE) return viewCodice();
  const s = S(), year = G.yearOf(s.t), left = year - D.END_YEAR + 1;
  let o = (window.CODICE ? '<div class="acts"><button class="btn gold" style="width:100%" data-act="codice" data-v="tropas">📖 Abrir el Códice</button></div>' : '') + '<div class="head"><h2>Carthago delenda est</h2><p>Conquista <b>Carthago</b> antes de que termine el año 146 a.C. Si Roma cae, la campaña termina.</p><p>⏳ Quedan <b>' + left + '</b> años · 🏛️ ' + G.myCities().length + '/' + Object.keys(D.CITIES).length + ' ciudades · ⚔️ ' + s.stats.wins + '/' + s.stats.battles + ' batallas</p></div>';
  o += '<div class="sec">Línea del tiempo</div><div class="tl">' + D.EVENTS.map((e, i) => '<div class="' + (s.ev[i] ? 'done' : '') + '"' + (s.ev[i] ? ' data-act="ev" data-v="' + i + '"' : '') + '>' + e.y + ' a.C. — ' + (s.ev[i] ? esc(e.t) : '···') + '</div>').join('') + '</div>';
  o += '<div class="sec">Crónica</div>' + (s.log.length ? s.log.map(l => '<div class="logl ' + l.k + '"><small>' + G.yearOf(l.t) + ' a.C.</small>' + esc(l.x) + '</div>').join('') : '<div class="empty">Aún no ha ocurrido nada.</div>');
  return o + '<div class="acts" style="margin-top:16px"><button class="btn ghost" data-act="tomenu">Guardar y salir al menú</button></div>';
}

/* ---------- ficha de ciudad sobre el mapa ---------- */
function renderSheet() {
  const s = S(), sh = $('sheet'); if (!s || !UI.sel || UI.tab !== 'map') { sh.hidden = true; UI.sheetKey = ''; return; }
  const id = UI.sel, c = s.cities[id], d = D.CITIES[id], f = D.FACTIONS[c.owner], mine = c.owner === 'roma';
  const src = G.neighbors(id).filter(n => s.cities[n].owner === 'roma'), inc = s.marches.filter(m => m.to === id);
  const key = id + c.owner + JSON.stringify(c.units) + src.join() + inc.map(m => m.id + Math.round((m.t1 - s.t) * 2)).join();
  if (key === UI.sheetKey && !sh.hidden) return; UI.sheetKey = key;
  let h = '<button class="x" data-act="unsel">✕</button><h3>' + d.n + '<span class="tagf" style="background:' + f.col + '">' + f.n + '</span></h3><p>' + esc(d.h) + '</p>';
  h += '<span class="stat">🧱 Muralla ' + (c.b.muralla || 0) + '</span><span class="stat">💰 ' + '★'.repeat(c.w || d.w) + '</span><span class="stat">⚔ Fuerza ' + G.power(c.units) + '</span>' + (D.ESPECIAL[d.esp] ? '<span class="stat">Bien: ' + D.ESPECIAL[d.esp].i + ' ' + D.ESPECIAL[d.esp].n + '</span>' : '');
  h += '<div class="units">' + (Object.keys(c.units).filter(k => c.units[k] > 0).map(k => '<span>' + D.UNITS[k].n + ' <b>' + c.units[k] + '</b></span>').join('') || '<span>Sin guarnición</span>') + '</div>';
  if (inc.length) h += inc.map(m => '<div class="stat" style="color:' + (m.owner === 'roma' ? 'var(--good)' : 'var(--bad)') + '">' + (m.owner === 'roma' ? '🚩 Tus tropas llegan' : '⚠️ ' + D.FACTIONS[m.owner].n + ' (' + G.men(m.units) + ') llega') + ' en ' + months(m.t1 - s.t) + '</div>').join('');
  h += '<div class="acts">';
  if (mine) h += '<button class="btn gold" data-act="goto" data-v="' + id + '">Gestionar</button>';
  if (src.length) h += src.map(n => '<button class="btn" data-act="pick" data-from="' + n + '" data-to="' + id + '">' + (mine ? 'Reforzar' : 'Atacar') + ' desde ' + D.CITIES[n].n + (G.edge(n, id)[2] ? ' ⚓' : '') + '</button>').join('');
  else if (!mine) h += '<div class="empty">Sin ruta: conquista antes una ciudad vecina (' + G.neighbors(id).map(n => D.CITIES[n].n).join(', ') + ').</div>';
  const st = sh.scrollTop; sh.innerHTML = h + '</div>'; sh.hidden = false; sh.scrollTop = st;
}

/* ---------- envío de tropas ---------- */
function showPicker(from, to) {
  const s = S(), c = s.cities[from], own = s.cities[to].owner === 'roma', hero = G.heroAvailable(from);
  if (G.edge(from, to)[2] && !(c.b.puerto > 0)) { modal('<div class="yr">RUTA MARÍTIMA</div><h2>Hace falta un puerto</h2><p>Para embarcar un ejército desde ' + D.CITIES[from].n + ' hacia ' + D.CITIES[to].n + ' necesitas construir antes un <b>Puerto</b> en ' + D.CITIES[from].n + '.</p><div class="acts"><button class="btn ghost" data-act="close">Cerrar</button><button class="btn gold" data-act="goport" data-v="' + from + '">Ir a la ciudad</button></div>'); return; }
  const ks = Object.keys(c.units).filter(k => c.units[k] > 0);
  let h = '<div class="yr">DESDE ' + D.CITIES[from].n.toUpperCase() + ' · ' + months(G.travel(from, to, false)).toUpperCase() + '</div><h2>' + (own ? 'Reforzar ' : 'Atacar ') + D.CITIES[to].n + '</h2>';
  if (!ks.length && !hero) h += '<p>No hay tropas en ' + D.CITIES[from].n + '. Recluta en la pestaña Ejército.</p>';
  h += ks.map(k => '<div class="pick"><div class="pt">' + pt(k) + '</div><div><label><span>' + D.UNITS[k].n + '</span><span><b id="pv-' + k + '">' + c.units[k] + '</b> / ' + c.units[k] + '</span></label><input type="range" min="0" max="' + c.units[k] + '" value="' + c.units[k] + '" data-k="' + k + '"></div></div>').join('');
  if (hero) h += '<label class="chk"><input type="checkbox" id="pk-hero" checked> 🦅 El general acompaña al ejército</label>';
  if (!own) h += '<div class="pw">Fuerza enemiga: ' + G.power(s.cities[to].units) + ' · muralla nivel ' + (s.cities[to].b.muralla || 0) + '<br>Tu fuerza: <b id="pk-pw"></b></div>';
  h += '<div class="acts"><button class="btn ghost" data-act="close">Cancelar</button>' + (ks.length || hero ? '<button class="btn" data-act="send" data-from="' + from + '" data-to="' + to + '">' + (own ? 'Enviar' : '¡A las armas!') + '</button>' : '') + '</div>';
  modal(h); pickUpdate();
}
function pickUnits() { const u = {}; document.querySelectorAll('#mbox input[type=range]').forEach(i => { u[i.dataset.k] = +i.value; }); return u; }
function pickUpdate() { const u = pickUnits(); for (const k in u) { const e = $('pv-' + k); if (e) e.textContent = u[k]; } const p = $('pk-pw'); if (p) p.textContent = G.power(u); }
$('mbox').addEventListener('input', pickUpdate);

/* ---------- batalla ---------- */
function sideHtml(sd) {
  return '<div class="side"><h4 style="color:' + sd.col + ';filter:brightness(1.6)">' + esc(sd.name) + '</h4>' + (sd.gen ? '<div><span>★ ' + esc(sd.gen.n) + '</span></div>' : '') +
    Object.keys(sd.units).filter(k => sd.units[k] > 0).map(k => '<div><span>' + D.UNITS[k].n + '</span><b>' + sd.units[k] + '</b></div>').join('') + '</div>';
}
function battlePrompt() {
  const pb = S().pending[0], info = G.battleInfo(pb), d = D.CITIES[info.city];
  UI.binfo = info;
  modal('<div class="yr">' + G.yearOf(S().t) + ' A.C.</div><h2>' + (info.kind === 'attack' ? 'Asalto a ' : 'Defensa de ') + d.n + '</h2>' +
    '<div class="vs">' + sideHtml(info.cfg.sides[0]) + sideHtml(info.cfg.sides[1]) + '</div>' +
    '<div class="pw">Fuerza: ' + G.power(info.cfg.sides[0].units) + ' contra ' + G.power(info.cfg.sides[1].units) + ' · Muralla del defensor: nivel ' + info.cfg.wall + '</div>' +
    '<div class="acts"><button class="btn" data-act="bview">⚔️ Dirigir la batalla</button><button class="btn ghost" data-act="bquick">Resolver</button></div>', true);
}
function startBattle() {
  closeModal();
  $('battle').hidden = false;
  const cfg = Object.assign({}, UI.binfo.cfg, { fh: 1000 }), b = new window.Battle(cfg), B = { b: b, speed: 1, paused: false, acc: 0, endT: 0 };
  try { B.view = new BattleView3D($('bfield'), b, { cards: $('bcards'), speed: () => (B.paused || b.over ? 0 : B.speed) }); }
  catch (e) { // sin WebGL: vista 2D de reserva
    console.warn('WebGL no disponible, usando vista 2D', e);
    const cv = document.createElement('canvas'); cv.className = 'c2d'; $('bfield').appendChild(cv); B.view = new window.BattleView(cv, b); B.flat = cv;
    cv.addEventListener('pointerdown', ev => { if (!b.over) B.view.tap(ev.clientX, ev.clientY); });
  }
  UI.battle = B;
  $('bauto').classList.add('on'); $('bspeed').textContent = 'x1'; $('bpause').textContent = 'II';
  $('bhint').style.opacity = 1; setTimeout(() => { $('bhint').style.opacity = 0; }, 7000);
}
function stopBattle() { const B = UI.battle; if (B) { if (B.view.dispose) B.view.dispose(); if (B.flat) B.flat.remove(); } $('battle').hidden = true; UI.battle = null; UI.binfo = null; if (UI.map) UI.map.resize(); }
function battleHud() {
  const b = UI.battle.b, s0 = b.cfg.sides[0], s1 = b.cfg.sides[1], n0 = b.men(0), n1 = b.men(1), key = n0 + '|' + n1; if (key === UI.hudKey) return; UI.hudKey = key;
  $('bhud').innerHTML = '<div class="nm"><span style="color:#ff9c8c">' + esc(s0.name) + ' · ' + n0 + '</span><span>' + n1 + ' · ' + esc(s1.name) + '</span></div><div class="bar"><i style="width:' + n0 / Math.max(1, n0 + n1) * 100 + '%;background:' + s0.col + '"></i><i style="flex:1;background:' + s1.col + '"></i></div>';
}
function endBattle(res) {
  const info = UI.binfo, out = G.applyBattle(res), d = D.CITIES[info.city];
  const loss = side => Object.keys(res.lost[side]).filter(k => res.lost[side][k] > 0).map(k => '<div><span>' + D.UNITS[k].n + '</span><b>−' + res.lost[side][k] + '</b></div>').join('') || '<div><span>Sin bajas</span></div>';
  modal('<div class="yr">' + (out.kind === 'attack' ? 'ASALTO A ' : 'DEFENSA DE ') + d.n.toUpperCase() + '</div><h2>' + (out.win ? '¡Victoria!' : 'Derrota') + '</h2>' +
    '<div class="vs"><div class="side"><h4 style="color:#ff9c8c">Bajas romanas</h4>' + loss(0) + '</div><div class="side"><h4>Bajas enemigas</h4>' + loss(1) + '</div></div>' +
    '<p>' + out.lines.map(esc).join('\n') + '</p><div class="acts"><button class="btn" data-act="bdone">Continuar</button></div>', true);
}

/* ---------- acciones ---------- */
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-act]');
  if (!el) { if (e.target.id === 'modal' && !UI.sticky) closeModal(); return; }
  const a = el.dataset.act, v = el.dataset.v, s = S(), B = UI.battle;
  if (a !== 'derr') UI.derr = null;
  switch (a) {
    case 'fluidez': fijarFluidez(!fluidezOn()); showMenu(); break;
    case 'new': G.newGame(($('hname').value || '').trim() || 'Lucio Cornelio Escipión'); UI.overShown = false; G.save(); startGame(); break;
    case 'continue': if (G.load()) { UI.overShown = false; startGame(); if (S().over) showOver(); } break;
    case 'tomenu': G.save(); UI.modalQ = []; closeModal(); stopBattle(); showMenu(); break;
    case 'tab': UI.codice = null; setTab(v); break;
    case 'codice': UI.codice = v || null; render(); { const vw = $('view'); if (vw) vw.scrollTop = 0; } break;
    case 'speed': s.speed = +v; tickUI(); break;
    case 'city': UI.city = v; UI.bsel = null; $('view').scrollTop = 0; render(); break;
    case 'rep': if (G.reparto(UI.city, el.dataset.r, +el.dataset.d)) render(); break;
    case 'imp': if (G.setImp(UI.city, el.dataset.v)) render(); break;
    case 'tipos': modal(tiposModal()); break;
    case 'tipo': if (G.setTipo(UI.city, v)) { closeModal(); toast(D.TIPOS[v].i + ' ' + D.CITIES[UI.city].n + ': ' + D.TIPOS[v].n + '.'); render(); } else toast('No se puede elegir ese tipo.', 'bad'); break;
    case 'derr': { const k = UI.city + ':' + v; if (UI.derr !== k) { UI.derr = k; render(); } else { UI.derr = null; if (G.derribar(UI.city, v)) { toast('🧱 ' + D.BUILD[v].n + ' derribado: un solar libre.'); } else toast('No se puede derribar ahora.', 'bad'); render(); } break; }
    case 'clist': UI.cityList = !UI.cityList; setTab('city'); break;
    case 'cview': if (UI.cityV) { UI.bsel = null; UI.cityV.view(v); renderCity3D(); } break;
    case 'forja': if (G.forjaUp(UI.city, v)) render(); else toast(S().forja.cola ? 'Ya hay una mejora en curso.' : 'Faltan recursos.', 'bad'); break;
    case 'up': if (G.upgrade(UI.city, v)) render(); else toast(s.cities[UI.city].queue ? 'Ya hay una obra en curso en esta ciudad.' : 'Faltan recursos.', 'bad'); break;
    case 'train': if (G.train(UI.city, v, +el.dataset.n)) render(); else toast(s.cities[UI.city].train.length >= 5 ? 'La cola de instrucción está llena.' : G.recruits(s.cities[UI.city]) < +el.dataset.n ? 'No hay población suficiente: construye Ínsulas o espera a que crezca.' : 'Faltan recursos.', 'bad'); break;
    case 'mfrom': UI.mf = v; if (UI.mt === v) UI.mt = v === 'oro' ? 'madera' : 'oro'; render(); break;
    case 'mto': UI.mt = v; if (UI.mf === v) UI.mf = v === 'oro' ? 'madera' : 'oro'; render(); break;
    case 'trade': { const got = G.trade(UI.mf, UI.mt, +el.dataset.n); if (got) { toast('⚖️ Recibes ' + got + ' de ' + (RES_NOM[UI.mt] || 'Denarios').toLowerCase()); render(); } else toast('No se puede hacer ese cambio (faltan recursos o el almacén está lleno).', 'bad'); break; }
    case 'skill': if (G.skill(v)) render(); break;
    case 'ev': { const ev = D.EVENTS[+v]; modal('<div class="yr">' + ev.y + ' A.C.</div><h2>' + esc(ev.t) + '</h2><p>' + esc(ev.x) + '</p>' + licHtml(ev) + '<div class="acts"><button class="btn" data-act="close">Cerrar</button></div>'); break; }
    case 'zoom': if (UI.map) UI.map.zoom(+v); break;
    case 'home': if (UI.map) UI.map.center(s.hero.city || 'roma'); break;
    case 'unsel': UI.sel = null; renderSheet(); break;
    case 'goto': UI.city = v; setTab('city'); break;
    case 'goport': closeModal(); UI.city = v; UI.bsel = 'puerto'; setTab('city'); break;
    case 'pick': showPicker(el.dataset.from, el.dataset.to); break;
    case 'send': {
      const hero = $('pk-hero') && $('pk-hero').checked;
      if (G.send(el.dataset.from, el.dataset.to, pickUnits(), hero)) { closeModal(); toast('🚩 El ejército parte hacia ' + D.CITIES[el.dataset.to].n + '.'); UI.sheetKey = ''; renderSheet(); }
      else toast('Selecciona al menos una unidad.', 'bad');
      break;
    }
    case 'close': closeModal(); break;
    case 'bview': startBattle(); break;
    case 'bquick': { closeModal(); const b = new window.Battle(UI.binfo.cfg); b.finish(); endBattle(b.result()); break; }
    case 'bdone': closeModal(); stopBattle(); UI.sheetKey = ''; render(); if (S().over) showOver(); break;
    case 'bpause': B.paused = !B.paused; el.textContent = B.paused ? '▶' : 'II'; break;
    case 'bspeed': B.speed = B.speed === 1 ? 2 : B.speed === 2 ? 4 : 1; el.textContent = 'x' + B.speed; break;
    case 'bauto': B.b.auto = !B.b.auto; el.classList.toggle('on', B.b.auto); toast(B.b.auto ? 'Tus tropas atacan por iniciativa propia.' : 'Tus tropas mantienen la posición hasta recibir órdenes.'); break;
    case 'ball': B.view.selectAll(); break;
    case 'bcam': if (B.view.cycleCam) B.view.cycleCam(); break;
    case 'bskip': B.b.finish(); break;
  }
});

/* ---------- bucle principal ---------- */
function frame(now) {
  const dt = Math.min(0.25, (now - UI.last) / 1000 || 0); UI.last = now;
  const s = S();
  if (UI.battle) {
    const B = UI.battle, b = B.b;
    if (!B.paused && !b.over) { B.acc += dt * B.speed; let n = 0; while (B.acc >= 0.05 && n++ < 12) { b.step(0.05); B.acc -= 0.05; } }
    battleHud(); B.view.draw();
    if (b.over && !B.done) { B.endT += dt; if (B.endT > 2.2) { B.done = true; endBattle(b.result()); } }
  } else if (s && !UI.menu) {
    if (!UI.modalOpen && !s.over) {
      if (s.pending.length) battlePrompt();
      else if (s.speed > 0) G.tick(dt * s.speed / 4);
    }
    if (UI.map && UI.tab === 'map') UI.map.update(s, UI.sel);
    if (UI.cityV && UI.tab === 'city' && !UI.cityList) { if (s.cities[UI.city].owner !== 'roma') UI.city = G.myCities()[0] || 'roma'; UI.cityV.update(s.cities[UI.city], UI.city, UI.bsel, now / 1000); }
    if (UI.dirty) render();
    UI.acc = (UI.acc || 0) + dt; if (UI.acc > 0.25) { UI.acc = 0; tickUI(); if (UI.tab === 'map' && UI.sel && !UI.modalOpen) renderSheet(); }
    UI.saveT += dt; if (UI.saveT > 8) { UI.saveT = 0; G.save(); }
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { if (UI.map) UI.map.resize(); if (UI.cityV && !$('citywrap').hidden) UI.cityV.resize(); if (UI.battle && UI.battle.view.resize) UI.battle.view.resize(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S() && !UI.menu) G.save(); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });

buildTop();
try { UI.map = new MapView3D($('mapwrap'), { onSelect: id => { UI.sel = id; UI.sheetKey = ''; renderSheet(); } }); }
catch (e) { console.warn('WebGL no disponible para el mapa', e); $('mapwrap').innerHTML = '<div class="empty" style="padding:160px 24px;text-align:center">Tu dispositivo no puede mostrar el mapa 3D. Puedes jugar desde las pestañas Ciudad y Ejército.</div>'; }
showMenu(); requestAnimationFrame(frame);
// modelos reales (0 A.D.): se cargan en segundo plano; hasta entonces se usan los generados por código
loadIndex().then(idx => preload(Object.keys(idx))).then(() => { UI.dirty = true; });
loadStaticIndex().then(idx => Promise.all([preloadStatic(Object.keys(idx)), loadGroundTextures()])).then(() => {
  try { $('citywrap').hidden = false; UI.cityV = new CityView3D($('citywrap'), { onPick: b => { UI.bsel = b; renderCity3D(); tickUI(); } }); $('citywrap').hidden = true; if (UI.tab === 'city' && !UI.menu) setTab('city'); }
  catch (e) { console.warn('Sin vista 3D de ciudad', e); $('citywrap').hidden = true; }
});
window.UI = UI;
