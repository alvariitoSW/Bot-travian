/* AQVILA — interfaz: mapa 3D como pantalla principal, paneles, modales y pantalla de batalla */
import { MapView3D } from './gfx/map3d.js';
import { BattleView3D, recomendada, ALAS, TIPOS_ORDEN, tipoOrden } from './gfx/battle3d.js';
import { portrait } from './gfx/models.js';
import { preload, loadIndex, realPortrait } from './gfx/units.js';
import { preloadStatic, loadStaticIndex } from './gfx/statics.js';
import { CityView3D } from './gfx/city3d.js';
import { loadGroundTextures } from './gfx/ground.js';
import { fijar as fijarFluidez, estaEncendido as fluidezOn } from './gfx/fluidez.js';
import * as Ciudad from './ciudad.js';

const D = window.DATA, G = window.Game, $ = id => document.getElementById(id);
G.usarCiudad(Ciudad);   // CN2b: game.js (script clásico) recibe la ciudad nueva antes de cargar o crear partida
const UI = { codice: null, modo: 'gobierno', tab: 'map', city: 'roma', sel: null, modalQ: [], modalOpen: false, battle: null, menu: true, last: 0, saveT: 0, map: null };
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
/* Iconos de guerra y de edificios (E1c): dibujos de línea propios, como los de recursos */
D.GUERRA_ICON = { espadas: svgIco('<path d="M5 19L17 7M14.5 5.5L18.5 9.5M3.5 17.5l3 3M7 17l-2.5 2.5"/><path d="M19 19L7 7M9.5 5.5L5.5 9.5M20.5 17.5l-3 3M17 17l2.5 2.5"/>'), escudo: svgIco('<path d="M12 3l7 2.5v6c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5v-6z"/><path d="M12 3v18M5 11h14"/>'), aguila: svgIco('<circle cx="12" cy="5.5" r="2"/><path d="M12 7.5V17M12 10C9 9 5 9.5 2.5 12c2 .3 3.5.2 5 0-1.5 1.5-2.5 2.500-3 4 3-.5 5.500-2.500 7.500-6M12 10c3-1 7-.5 9.500 2-2 .3-3.500.2-5 0 1.500 1.500 2.500 2.500 3 4-3-.5-5.500-2.500-7.500-6"/><path d="M10 20.500l2-3.500 2 3.500"/>'), casco: svgIco('<path d="M4 15a8 8 0 0116 0v2H4z"/><path d="M12 7V4M8 17v3M16 17v3M4 17h16"/>') };
D.BUILD_ICON = {
  aserradero: D.RES_ICON.madera, cantera: D.RES_ICON.piedra, mina: D.RES_ICON.hierro, granja: D.RES_ICON.grano, cuartel: D.GUERRA_ICON.espadas,
  viviendas: svgIco('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-5h4v5"/>'),
  foro: svgIco('<path d="M3 20h18M5 20V9h14v11M3 9h18M9 20v-6h6v6M12 4v5"/>'),
  almacen: svgIco('<path d="M9 3h6M10 3v3c-3 1-4 4-4 7 0 4 2 7 6 7s6-3 6-7c0-3-1-6-4-7V3"/><path d="M6.5 11h-2M17.5 11h2"/>'),
  mercado: svgIco('<path d="M12 4v16M6 20h12M4 8h16"/><path d="M4 8l-3 6h6zM20 8l-3 6h6z"/>'),
  puerto: svgIco('<circle cx="12" cy="5" r="2"/><path d="M12 7v14M7 11h10M4 15c0 3.5 3.5 6 8 6s8-2.5 8-6"/>'),
  establo: svgIco('<path d="M7 20c0-5 1-8 4-10l-1-4 3 1 4 3c2 2 3 4 3 6M11 10c-2 0-3-1-4-2"/>'),
  muralla: svgIco('<path d="M3 20V8h3v2h3V8h3v2h3V8h3v12zM3 20h18M8 20v-5h8v5"/>'),
  herreria: svgIco('<path d="M4 9h13c0 2.5-1.5 3.5-4 3.5v3H8v-3C5.5 12.5 4 11.5 4 9zM17 9l3-1.5M7 15.5h6M6 19h8"/>'),
  escuela: svgIco('<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11M9 8h6M9 11h4"/>'),
  acueducto: svgIco('<path d="M3 7h18M3 7v13M21 7v13M3 20h18"/><path d="M3 20v-5a3.5 3.5 0 017 0v5M10 20v-5a3.5 3.5 0 017 0v5"/>'),
  termas: svgIco('<path d="M4 13h16c0 4-3 7-8 7s-8-3-8-7zM8 9c-1-1.5 1-2.5 0-4M12 9c-1-1.5 1-2.5 0-4M16 9c-1-1.5 1-2.5 0-4"/>'),
  anfiteatro: svgIco('<ellipse cx="12" cy="12" rx="9.5" ry="6"/><ellipse cx="12" cy="12" rx="5" ry="2.8"/><path d="M12 6v3M12 15v3M2.5 12h4.5M17 12h4.5"/>'),
  templo: svgIco('<path d="M3 10l9-6 9 6zM6 12v6M10 12v6M14 12v6M18 12v6M3 20h18"/>')
};
const bIco = b => D.BUILD_ICON[b] || D.BUILD[b].i;
// coste con plan de pago: «🪵 40/120» (cuota/total) si hay más de una cuota
const costPlanHtml = (pp) => pp.nc < 2 ? costHtml(pp.total) : '<div class="cost plazo">' + Object.keys(pp.total).map(r => '<span>' + D.RES_ICON[r] + ' ' + fmt(pp.primera[r]) + '<small>/' + fmt(pp.total[r]) + '</small></span>').join('') + '</div>';
const sinHuecoTxt = c => G.huecosObra(c) === 1 ? 'Ya hay una obra en curso en esta ciudad' : 'Sube el foro para otra obra';
const obrasTxt = c => 'Obras ' + c.obras.length + '/' + G.huecosObra(c);
const obraBarra = q => '<div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div><span class="rem"></span>';
const plazoTxt = q => q && q.nc > 1 ? (q.pausa ? 'En pausa · ' : '') + q.pag + '/' + q.nc + ' cuotas · ' + Object.keys(q.cuota).filter(r => q.cuota[r] > 0).map(r => D.RES_ICON[r] + fmt(q.cuota[r])).join(' ') + ' al mes' : q && q.pausa ? 'En pausa' : '';
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
  else if (type === 'colonos') { const d = D.COLONIAS[p.sitio]; if (d) modal('<div class="yr">COLONOS</div><h2>Han llegado a ' + esc(d.n) + '</h2><p>Los colonos esperan tu orden. Elige el lugar del foro y el arado trazará el surco sagrado.</p><div class="acts"><button class="btn ghost" data-act="close">Más tarde</button><button class="btn gold" data-act="fundar" data-v="' + p.sitio + '">Fundar ' + esc(d.n) + '</button></div>'); }
  else if (type === 'turno') { const s = S(); if (s) s.speed = 0; if (s && !s.pending.length && !s.over) consejoModal(); UI.dirty = true; }
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
    '<button class="btn" data-act="new">Nueva campaña</button><button class="btn" data-act="newregion" data-v="italia">Región de Italia</button><button class="btn" data-act="fluidez">' + (fluidezOn() ? 'Dejar de medir fluidez' : 'Medir fluidez') + '</button><div class="spqr">S·P·Q·R</div>' +
    '<div class="credits">Modelos y animaciones de las unidades: 0 A.D. © Wildfire Games, licencia CC BY-SA 3.0<br>Letra Cinzel © The Cinzel Project Authors, licencia SIL OFL 1.1<br>Termas y acueducto: dibujo propio del proyecto, CC BY-SA 3.0</div>';
}
{ let tv = 0; const sf = () => { clearTimeout(tv); tv = setTimeout(() => { UI.svDown = false; }, 150); };   // Saber: no repintar entre pulsar y soltar
  document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('.sv')) { UI.svDown = true; clearTimeout(tv); tv = setTimeout(() => { UI.svDown = false; }, 1500); } }, true);
  document.addEventListener('pointerup', sf, true); document.addEventListener('pointercancel', sf, true); }
{ const cu = () => $('cuentas'); let tm = 0;   // no repintar la hoja entre pulsar y soltar: se perderían los toques
  const fin = () => { clearTimeout(tm); tm = setTimeout(() => { UI.cuDown = false; }, 120); };
  document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('#cuentas')) { UI.cuDown = true; clearTimeout(tm); tm = setTimeout(() => { UI.cuDown = false; }, 1500); } }, true);
  document.addEventListener('pointerup', fin, true); document.addEventListener('pointercancel', fin, true); }
function startGame() { if (G.turnos && S()) S().speed = 0; UI.menu = false; $('menu').hidden = true; UI.city = 'roma'; UI.sel = null; if (UI.map) UI.map.encuadre(); UI.cityList = false; setModo('gobierno'); }
function showOver() {
  const s = S(), o = s.over; if (!o || UI.overShown) return; UI.overShown = true;
  modal('<div class="yr">' + (o.win ? 'VICTORIA' : 'DERROTA') + '</div><h2>' + (o.win ? 'Roma Victrix' : 'Vae victis') + '</h2><p>' + esc(o.why) + '</p>' +
    '<p>Ciudades: <b>' + G.myCities().length + '</b> de ' + G.ciudadesRegion().length + ' · Batallas: <b>' + s.stats.wins + '/' + s.stats.battles + '</b> ganadas\nEnemigos abatidos: <b>' + s.stats.kills + '</b> · Bajas propias: <b>' + s.stats.lost + '</b>\n' + esc(s.hero.name) + ', nivel <b>' + s.hero.lvl + '</b></p>' +
    '<div class="acts"><button class="btn" data-act="tomenu">Volver al menú</button></div>', true);
}

/* ---------- HUD ---------- */
function buildTop() {
  $('res').innerHTML = D.RES.map(r => '<span class="r' + (r === 'oro' || r === 'grano' ? '' : ' g-only') + '" id="rb-' + r + '">' + D.RES_ICON[r] + '<b id="r-' + r + '"></b><small class="alm" id="ra-' + r + '"></small></span>').join('') +
    '<span class="r w-only" id="rb-recl" title="Reclutas disponibles en la ciudad">' + D.GUERRA_ICON.casco + '<b id="r-recl"></b></span><span class="r w-only" id="rb-march" title="Marchas de tus ejércitos">' + D.GUERRA_ICON.espadas + '<b id="r-march"></b></span>';
  $('res').dataset.act = 'cuentas'; $('res').title = 'Cuentas del mes';
}
const turnosTxt = n => 'en ' + n + (n === 1 ? ' turno' : ' turnos');
function consejoModal() {
  const l = G.consejo(), inf = G.informeEstacion();
  const fila = r => { const a = inf.r[r]; return '<tr><td>' + D.RES_ICON[r] + '</td><td>+' + fmt(a.gan) + '</td><td>' + fmt(a.gua) + '</td><td style="' + (a.per > 0 ? 'color:var(--bad)' : 'opacity:.5') + '">' + (a.per > 0 ? '-' : '') + fmt(a.per) + '</td></tr>'; };
  const informe = inf.meses ? '<p style="margin:6px 0 2px"><b>Informe de la estación</b> (' + inf.meses + (inf.meses === 1 ? ' mes' : ' meses') + ')</p><table style="width:100%;text-align:center;font-size:13px"><tr style="opacity:.6;font-size:11px"><td></td><td>ganado</td><td>guardado</td><td>perdido</td></tr>' + D.RES.map(fila).join('') + '</table><p style="margin:2px 0 8px;color:' + (inf.r.oro.gua >= 0 ? 'var(--good)' : 'var(--bad)') + '">Saldo de oro: ' + (inf.r.oro.gua - 0) + ' al almacén.</p>' : '';
  modal('<div class="yr">INFORME Y CONSEJO DE ESTACIÓN</div><h2>' + esc(l[0].x) + '</h2>' + informe + l.slice(1).map(q => '<p style="' + (q.k === 'bad' ? 'color:var(--bad)' : q.k === 'good' ? 'color:var(--good)' : '') + '">' + (q.k === 'bad' ? '⚠️ ' : '• ') + esc(q.x) + '</p>').join('') + '<div class="acts"><button class="btn gold" data-act="close">Seguir</button></div>');
}
const VEL = { 0: 'II', 1: '▶', 2: '▶▶', 4: '▶▶▶' };
const ICO_GOB = svgIco('<path d="M3 20h18M5 20V9h14v11M3 9h18M9 20v-6h6v6M12 4v5"/>');
function cityOk() { const my = G.myCities(); if (!my.includes(UI.city)) UI.city = my[0] || 'roma'; return UI.city; }
function setTxt(id, v) { const e = $(id); if (e && e.dataset.k !== v) { e.dataset.k = v; e.innerHTML = v; } }
function hudDock() {
  const s = S(); if (!s) return; const g = UI.modo !== 'guerra', c = s.cities[cityOk()], open = !$('hoja').hidden;
  const f = Math.round(G.felicidad(c)), cara = f >= 60 ? '😊' : f >= 40 ? '😐' : '😠', nm = s.marches.filter(m => m.owner === 'roma').length;
  $('app').dataset.modo = g ? 'gobierno' : 'guerra';
  $('bact').className = 'rd ' + (g ? 'oro' : 'rojo'); $('bmodo').className = 'rd ' + (open ? 'cierra' : g ? 'oro' : 'rojo'); $('bpill').className = g ? '' : 'w';
  setTxt('bact', g ? '<span class="em">🔨</span><small>Obras</small>' : D.GUERRA_ICON.casco + '<small>Tropas</small>');
  setTxt('bmodo', open ? '<span class="em">✕</span><small>Cerrar</small>' : (g ? ICO_GOB : D.GUERRA_ICON.espadas) + '<small>' + (g ? 'Gobierno' : 'Guerra') + '</small>');
  setTxt('bpill', g ? D.POP_ICON + ' ' + Math.floor(c.pop) + '/' + G.popCap(c) + ' · ' + cara + ' ' + f : '🚩 ' + (nm === 1 ? '1 marcha en curso' : nm + ' marchas en curso'));
  const t3 = UI.tab === 'imperio' || UI.tab === 'senado' || UI.tab === 'saber' ? 'imperio' : UI.tab === 'city' ? (UI.cityList || !UI.cityV ? 'gobierno' : 'ciudad') : '';
  document.querySelectorAll('#tabs3 button').forEach(b => b.classList.toggle('on', b.dataset.v === t3));
  setTxt('citybtn', '<b>' + D.CITIES[UI.city].n.toUpperCase() + '</b> ▾');
}
function tickUI() {
  const s = S(); if (!s) return;
  if (UI.map && UI.map.cities) for (const id in UI.map.cities) { if (!D.CITIES[id] || !D.CITIES[id].antes) continue; const sp = UI.map.cities[id].el.querySelector('span'); if (sp && sp.textContent !== D.CITIES[id].n) sp.textContent = D.CITIES[id].n; }   // H14: el nombre del mapa cambia con la fecha (Poblado íbero → Carthago Nova)
  const p = G.prod(), cap = G.cap(), pr = G.previsionCierre(), aviso = G.fraccionMes() >= D.AVISO_CIERRE;
  for (const r of D.RES) {
    $('r-' + r).textContent = fmt(s.res[r]);
    const v = Math.round(p[r]), pierde = pr[r].perdera >= 1 && aviso, lleno = s.alm[r] >= cap - 1;
    $('ra-' + r).textContent = 'alm ' + fmt(s.alm[r]); $('ra-' + r).style.color = pierde ? '#ff7060' : lleno ? 'var(--gold)' : '';
    $('r-' + r).style.color = pierde ? '#ff7060' : '';
    $('rb-' + r).title = (RES_NOM[r] || r) + ': caja del mes ' + fmt(s.res[r]) + ', almacén ' + fmt(s.alm[r]) + ' de ' + fmt(cap) + ', ' + (v >= 0 ? '+' : '') + v + ' al mes' + (pierde ? ' · se perderán ' + pr[r].perdera : lleno ? ' (almacén lleno)' : '');
    $('rb-' + r).classList.toggle('full', lleno);
  }
  if (aviso && UI.avisoMes !== Math.floor(s.t)) { UI.avisoMes = Math.floor(s.t); const av = G.avisoCierre(); if (av.length) toast('Fin de mes: ' + av[0] + (av.length > 1 ? ' (y ' + (av.length - 1) + ' más)' : ''), 'bad'); }
  renderCuentas();
  const c = s.cities[cityOk()]; $('r-recl').textContent = fmt(G.recruits(c));
  const nm = s.marches.filter(m => m.owner === 'roma').length; $('r-march').textContent = nm + (nm === 1 ? ' marcha' : ' marchas');
  hudDock();
  $('date').textContent = G.dateStr(s.t);
  if (G.turnos) {
    $('speed').textContent = s.speed > 0 ? 'II' : '▶'; $('speed').title = s.speed > 0 ? 'Pausar el tiempo de la ciudad' : 'Dejar correr el tiempo de la ciudad'; $('speed').classList.remove('on');
    $('turno').hidden = false; setTxt('turno', '<b>Pasar turno</b> · ' + G.estacion(s.t));
  } else { $('turno').hidden = true; $('speed').textContent = VEL[s.speed] || '▶'; $('speed').classList.toggle('on', s.speed === 0); }
  document.querySelectorAll('[data-t1]').forEach(e => {
    const t0 = +e.dataset.t0, t1 = +e.dataset.t1, f = Math.max(0, Math.min(1, (s.t - t0) / (t1 - t0)));
    const bar = e.querySelector('i'); if (bar) bar.style.width = (f * 100).toFixed(1) + '%';
    const rem = e.parentElement.querySelector('.rem'); if (rem) rem.textContent = s.t < t0 ? 'en cola' : 'faltan ' + months(Math.max(0, t1 - s.t));
  });
  document.querySelectorAll('[data-need]').forEach(b => b.classList.toggle('no', !G.canAfford(JSON.parse(b.dataset.need))));
  document.querySelectorAll('[data-have]').forEach(e => { e.textContent = 'de ' + fmt(G.disponible(e.dataset.have)); });
  if (UI.tab === 'city' && UI.cityV && !UI.cityList && !UI.fundar && !$('citywrap').hidden) { const m = cityMeta(c), k = metaKey(m); if (k !== UI.metaK) renderCity3D(); else { UI.cityV.meta = m; cityPantalla(); pintaLinea(); } }
}

/* ---------- paneles ---------- */
function setTab(t) {
  if (UI.fundar) cerrarFundar(true);
  UI.tab = t; if (t === 'map' || t === 'army') UI.modo = 'guerra'; else if (t === 'city' || t === 'imperio' || t === 'senado' || t === 'saber') UI.modo = 'gobierno'; $('hoja').hidden = true; $('popsheet').hidden = true; $('cuentas').hidden = true; $('citymenu').hidden = true;
  const c3 = t === 'city' && UI.cityV && !UI.cityList;            // ciudad en 3D (o en lista si se prefiere)
  $('view').hidden = t === 'map' || c3; $('zoom').hidden = t !== 'map'; $('citywrap').hidden = !c3; $('ctop').hidden = !c3; $('csheet').hidden = !c3; UI.linK = null; if (!c3) $('linea').hidden = true;
  if (c3) { UI.cityV.resize(); renderCity3D(); }
  if (t === 'map') renderSheet(); else { $('sheet').hidden = true; $('view').scrollTop = 0; render(); }
  hudDock();
}
function setModo(m) { UI.modo = m; UI.codice = null; setTab(m === 'guerra' ? 'map' : 'city'); }
function cityChips() { cityOk(); return ''; }      // el selector de ciudad ya no son fichas fijas: es el desplegable de arriba
/* Cuentas del mes (Q3) */
const sg = (n, d) => (n >= 0 ? '+' : '−') + (Math.abs(n) >= 100 ? Math.round(Math.abs(n)) : Math.abs(n).toFixed(d === undefined ? 1 : d));
function cuentasHtml() {
  const s = S(), c = s.cities[cityOk()], cu = G.cuentas(), o = cu.oro, mercado = G.tradeRate() > 0, avisos = [], om = G.obraMayor(), ob = om ? om.id : null, puedeAd = !!om && G.canAfford(G.cuotasRestantes(om.q));
  const fila = r => { const m = cu.mat[r], tope = Math.max(1, m.entra, m.comprometido + Math.max(0, m.queda)), pc = Math.min(100, Math.round(m.comprometido / tope * 100)), pq = Math.max(0, Math.min(100 - pc, Math.round(Math.max(0, m.queda) / tope * 100)));
    if (m.perdera >= 1) avisos.push('<div class="cu-aviso" data-r="' + r + '">⚠ <span>' + RES_NOM[r] + ': sobran ' + Math.floor(m.queda) + ', caben ' + Math.floor(m.caben) + ', <b>se pierden ' + Math.floor(m.perdera) + '</b></span></div><div class="cu-btns"><button class="btn" data-act="cuvender" data-v="' + r + '"' + (mercado ? '' : ' disabled') + '>Vender en el mercado</button><button class="btn" data-act="cuobra"' + (ob ? ' data-v="' + ob + '"' : '') + '>' + (ob ? 'Ir a la obra de ' + esc(D.CITIES[ob].n) : 'Adelantar obra') + '</button>' + (ob && puedeAd ? '<button class="btn" data-act="cuadelantar" data-v="' + ob + '" data-i="' + om.i + '">Adelantar cuotas</button>' : '') + (mercado ? '' : '<small>Sin mercado: construye uno para vender.</small>') + '</div>');
    return '<div class="cu-fila"><span class="cu-ic">' + D.RES_ICON[r] + '</span><div class="cu-cen"><div class="cu-l1"><b>' + RES_NOM[r] + '</b> <span>entra ' + Math.round(m.entra) + '</span><em>compr. ' + Math.round(m.comprometido) + '</em></div><div class="cu-bar"><i class="c" style="width:' + pc + '%"></i><i class="q" style="width:' + pq + '%"></i></div></div>' +
      '<div class="cu-der"><b class="' + (m.queda >= 0 ? 'ok' : 'mal') + '">' + sg(m.queda, 0) + '</b><span>al almacén ' + Math.floor(m.alAlmacen) + '</span></div></div>' + (m.perdera >= 1 ? avisos.pop() : ''); };
  const impu = Object.keys(D.IMPUESTOS).map(k => '<button class="chip ' + ((c.imp || 'normal') === k ? 'on' : '') + '" data-act="imp" data-v="' + k + '">' + D.IMPUESTOS[k].n + '</button>').join('');
  const l = (n, v, mal) => { const z = Math.abs(v) < 0.05; return '<div><span>' + n + '</span><b class="' + (z ? '' : mal ? 'mal' : 'ok') + '">' + (z ? '0' : sg(mal ? -v : v)) + '</b></div>'; };
  return '<div class="cu-top"><div class="tt">Cuentas de ' + G.estacion(s.t).toLowerCase() + '</div><button class="cu-x" data-act="cux" aria-label="Cerrar">✕</button></div>' +
    '<div class="cu-sec"><span>MATERIALES</span><div class="cu-imp"><small>Impuestos de ' + esc(D.CITIES[c.id || UI.city].n) + '</small>' + impu + '</div></div>' + ['madera', 'piedra', 'hierro', 'grano'].map(fila).join('') +
    '<div class="cu-sec"><span>ORO</span><i>' + D.RES_ICON.oro + '</i></div><div class="cu-oro"><div class="cu-col">' + l('Impuestos', o.impuestos) + l('Foro y comercio', o.foro) + l('Rutas · puerto', o.rutas) + '</div><div class="cu-col">' + l('Edificios', o.edificios, 1) + (o.sabios >= 0.05 ? l('Sabios', o.sabios, 1) : '') + l('Legiones', o.legiones, 1) + l('Obras y tropas', o.obras, 1) + (o.otros >= 0.05 ? l('Otros', o.otros, 1) : '') + '</div></div>' +
    '<div class="cu-saldo ' + (o.saldo >= 0 ? 'ok' : 'mal') + '"><span>Saldo del mes</span><b>' + (o.saldo >= 0 ? '+ ' : '− ') + Math.round(Math.abs(o.saldo)) + '</b></div>';
}
function renderCuentas(forzar) { const e = $('cuentas'); if (!e || e.hidden || !S() || (UI.cuDown && !forzar)) return; const h = cuentasHtml(); if (forzar || e.dataset.k !== h) { e.dataset.k = h; e.innerHTML = h; } }
function hojaHtml() {
  const g = UI.modo !== 'guerra', on = (m, c) => (UI.tab === 'city' || UI.tab === 'map' || UI.tab === 'army') && (m === 'g' ? g : !g) ? ' ' + c : '';
  return '<button class="oro' + on('g', 'on') + '" data-act="modo" data-v="gobierno">' + ICO_GOB + ' Gobierno</button><button class="rojo' + on('w', 'on') + '" data-act="modo" data-v="guerra">' + D.GUERRA_ICON.espadas + ' Guerra</button>' +
    '<button data-act="tab" data-v="hero">' + D.GUERRA_ICON.aguila + ' General</button><button data-act="tab" data-v="log">📜 Crónica</button><div class="dos"><button data-act="ayuda">❓ Ayuda</button><button data-act="menu">⚙️ Menú</button></div>';
}
function cityMenuHtml() {
  const s = S(); cityOk();
  return G.myCities().map(id => '<button class="' + (id === UI.city ? 'on' : '') + '" data-act="city" data-v="' + id + '">' + D.CITIES[id].n + (s.hero.city === id ? ' ' + D.GUERRA_ICON.aguila : '') + '<small>' + Math.floor(s.cities[id].pop) + ' hab.</small></button>').join('');
}
function renderPop() { renderCuentas(); const ps = $('popsheet'); if (ps.hidden) return; ps.innerHTML = '<div class="tt">' + D.CITIES[cityOk()].n + '</div>' + popHtml(S().cities[UI.city]) + '<div class="acts"><button class="btn" data-act="popx">Cerrar</button></div>'; }
function render() {
  UI.dirty = false;
  if (!S()) return; renderPop(); if (UI.tab === 'map') { renderSheet(); return; }
  if (UI.tab === 'city' && UI.cityV && !UI.cityList) { renderCity3D(); tickUI(); return; }
  if (UI.tab === 'saber' && UI.svDown) { UI.dirty = true; return; }   // no repintar entre pulsar y soltar: se perderían los toques
  const v = $('view'), st = v.scrollTop;
  v.innerHTML = UI.tab === 'imperio' ? viewImperio() : UI.tab === 'city' ? viewCity() : UI.tab === 'army' ? viewArmy() : UI.tab === 'hero' ? viewHero() : UI.tab === 'senado' ? viewSenado() : UI.tab === 'saber' ? viewSaber() : viewLog();
  v.scrollTop = st; tickUI();
}
const dondeEsp = k => G.dondeEspecial(k).slice(0, 3).map(i => D.CITIES[i].n).join(', ');
const faltaBtn = k => '<button class="btn no" disabled style="max-width:118px;white-space:normal;line-height:1.15">Falta ' + D.ESPECIAL[k].n.toLowerCase() + '<small style="white-space:normal">' + D.ESPECIAL[k].i + ' en ' + dondeEsp(k) + '</small></button>';
const espLinea = c => { if (c.owner !== 'roma') return ''; const e = D.ESPECIAL[D.CITIES[UI.city].esp]; return e ? '<span class="stat">' + e.i + ' Bien de la ciudad: <b>' + e.n + '</b> — ' + esc(e.d) + '</span>' : ''; };
const espResumen = () => {
  const t = G.especiales(), ks = Object.keys(D.ESPECIAL), tiene = ks.filter(k => t[k]), falta = ks.filter(k => !t[k]);
  return '<span class="stat">Tienes: ' + (tiene.map(k => D.ESPECIAL[k].i + ' ' + D.ESPECIAL[k].n).join(' · ') || 'ninguno') + '.</span>' + (falta.length ? '<span class="stat">Te faltan: ' + falta.map(k => D.ESPECIAL[k].i + ' ' + D.ESPECIAL[k].n + ' (' + dondeEsp(k) + ')').join(' · ') + '</span>' : '');
};
function diosBloque(c, b) {
  const dg = b === 'templo' ? G.diosDe(c) : null;
  return b !== 'templo' || c.owner !== 'roma' ? '' : dg ? '<div class="ds">' + dg.i + ' <b>Templo de ' + dg.n + '</b> · ' + esc(dg.d) + '</div>' :
    '<div class="ds">Elige el dios:</div><div class="chips" style="flex-wrap:wrap">' + Object.keys(D.DIOSES).map(k => { const d = D.DIOSES[k], no = d.sea && !D.CITIES[UI.city].sea; return '<button class="chip ' + ((c.dios || 'marte') === k && !no ? 'on' : '') + '" ' + (no ? 'disabled' : 'data-act="dios" data-v="' + k + '"') + ' title="' + esc(d.d) + '">' + d.i + ' ' + d.n + '</button>'; }).join('') + '</div><div class="ds">' + esc(D.DIOSES[c.dios && !(D.DIOSES[c.dios].sea && !D.CITIES[UI.city].sea) ? c.dios : 'marte'].d) + '</div>';
}
/* Barrios (CN6): la ciudad (Aldea, Villa, Ciudad, Urbs) con lo que le falta, y una fila por barrio con su nivel y su «para subir falta…» */
const BARRIO_ICO = { grano: () => D.RES_ICON.grano, lujo: () => svgIco('<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l-2 5 5 11 5-11-2-5"/>') };
const ROMS = ['', 'I', 'II', 'III', 'IV'];
const barrioFrase = bi => {
  const nom = k => (D.BARRIO_SERV[k] || k).toLowerCase(), lst = a => a.map(nom).join(' y ');
  if (bi.objetivo < bi.nivel) { const f = (D.BARRIO[bi.nivel].pide || []).filter(k => !bi.serv[k]); if (!f.length) return 'Algún barrio se queda sin servicios y la ciudad puede bajar de nivel: mira la lista.'; return 'Baja a ' + D.BARRIO[bi.nivel - 1].n + ' en ' + bi.meses + (bi.meses === 1 ? ' mes' : ' meses') + ' si no recuperas ' + (f.length > 1 ? 'estos servicios: ' : 'el ') + lst(f) + '.'; }
  if (bi.nivel >= D.BARRIO.length - 1) return 'La ciudad está al máximo.';
  return 'Para ser ' + D.BARRIO[bi.nivel + 1].n + ' falta ' + (bi.falta.length ? lst(bi.falta) : 'esperar unos meses') + '.';
};
const barrioHtml = c => {
  if (c.owner !== 'roma') return '';
  const bi = G.barrioInfo(c), bs = bi.barrios || [], ver = k => BARRIO_ICO[k] && !bi.serv[k] ? '<span class="bs" title="Falta ' + D.BARRIO_SERV[k].toLowerCase() + '">' + BARRIO_ICO[k]() + '</span>' : '';
  return '<div class="barrio"><div class="bn"><b>' + D.BARRIO[bi.nivel].n + '</b> · nivel ' + bi.nivel + ' de ' + (D.BARRIO.length - 1) + '<span class="bsv">' + ver('grano') + ver('lujo') + '</span></div>' +
    '<div class="bf' + (bi.objetivo < bi.nivel ? ' mal' : '') + '">' + barrioFrase(bi) + '</div>' +
    (bs.length ? '<div class="blis">' + bs.map(b => '<div class="bfila' + (b.objetivo < b.nivel ? ' mal' : '') + '"><span class="bniv">' + ROMS[b.nivel] + '</span><span class="bnom">' + esc(b.corto || b.nombre) + '</span><span class="bfalta">' + (b.falta ? 'para subir falta ' + esc(b.falta.replace(/^para subir falta /, '')) : 'lo tiene todo') + '</span></div>').join('') + '</div>' : '') + '</div>';
};
/* Clases (Q6): ciudadanos, plebeyos, esclavos; cifra, barra de parte y cara de ánimo, y lo que piden */
const clasesFrase = (c, cl, an) => {
  const sv = G.servicios(c, G.prod().grano >= 0), K = G.K(), pide = [];
  if (an.ciu < K.caraBuena && cl.ciu > 0) { const f = []; if (!sv.lujo) f.push('vino o lujo'); if (sv.mercado === false) f.push('mercado'); if (f.length) pide.push('Los ciudadanos piden ' + f.join(', ') + '.'); }
  if (an.ple < K.caraBuena) { const f = []; if (!sv.grano) f.push('grano'); if (!sv.templo) f.push('un templo'); if (f.length) pide.push('Los plebeyos piden ' + f.join(' y ') + '.'); else if (cl.esc > 0) pide.push('Los esclavos pesan en el ánimo de los plebeyos.'); }
  if (cl.esc > 0 && an.esc < K.inquietud) pide.push('Los esclavos están inquietos: -' + K.inquietudFel + ' de felicidad.');
  else if (cl.esc > 0 && an.esc >= K.manumision) pide.push('Los esclavos contentos se liberan poco a poco.');
  return pide.length ? pide.slice(0, 2).join(' ') : 'Las clases están conformes.';
};
const clasesHtml = c => {
  if (c.owner !== 'roma') return '';
  const cl = G.clases(c), an = G.animoClases(c), mot = G.motivoCiudadania(c), K = G.K();
  const fila = (n, k, v) => { const pc = cl.pop > 0 ? Math.round(v / cl.pop * 100) : 0; return '<div class="cl"><span class="cn">' + n + '</span><b class="cv">' + Math.floor(v) + '</b><span class="cb"><i style="width:' + pc + '%"></i></span><span class="ca' + (an[k] < K.bajo ? ' mal' : '') + '" title="Ánimo ' + an[k] + '">' + G.cara(an[k]) + ' ' + an[k] + '</span></div>'; };
  return '<div class="clases"><div class="bn"><b>Clases</b></div>' + fila('Ciudadanos', 'ciu', cl.ciu) + fila('Plebeyos', 'ple', cl.ple) + fila('Esclavos', 'esc', cl.esc) +
    '<div class="bf' + (an.esc < K.inquietud && cl.esc > 0 ? ' mal' : '') + '">' + clasesFrase(c, cl, an) + '</div>' +
    '<button class="btn ' + (mot ? 'no' : '') + '" data-act="ciud"' + (mot ? ' disabled' : '') + '>Dar ciudadanía (' + K.ciudadaniaCoste + ' 🪙)<small>' + (mot || '+' + K.ciudadaniaLote + ' ciudadanos') + '</small></button></div>';
};
const impHtml = c => {
  if (c.owner !== 'roma') return '';
  const f = G.felicidad(c), col = f >= 60 ? 'var(--good,#5c5)' : f >= 40 ? '#e0a030' : '#e05050', cara = f >= 60 ? '😊' : f >= 40 ? '😐' : '😠';
  return '<div class="imp"><span class="stat" style="color:' + col + '">' + cara + ' Felicidad <b>' + f + '</b>' + (f < D.FELICIDAD_MIN_CRECER ? ' · la población no crece' : '') + '</span><div class="impb">' +
    Object.keys(D.IMPUESTOS).map(k => '<button class="chip ' + ((c.imp || 'normal') === k ? 'on' : '') + '" data-act="imp" data-v="' + k + '">' + D.IMPUESTOS[k].n + '</button>').join('') + '</div></div>';
};
const manoHtml = c => { if (c.owner !== 'roma') return ''; const z = Math.round(G.manoObra(c) * 100); return '<span class="stat" style="' + (z < 80 ? 'color:#e0a030' : '') + '">⛏️ Mano de obra: <b>' + Math.min(Math.floor(c.pop), G.puestos(c)) + '</b> de ' + G.puestos(c) + ' puestos (' + z + ' %)</span>'; };
const tipoHtml = c => {            // el tipo de ciudad: una línea propia en Gobierno (la primera elección es gratis)
  if (c.owner !== 'roma') return '';
  const t = G.tipoDe(c), sug = G.tipoSugerido(UI.city);
  return '<span class="stat">' + t.i + ' <b>' + t.n + '</b> · ' + esc(t.d) + (!c.tipoElegido && sug ? ' Sugerido: ' + D.TIPOS[sug].n + '.' : '') + ' <button class="chip" data-act="tipos">' + (c.tipoElegido ? 'Cambiar tipo' : 'Elegir tipo · gratis') + '</button></span>';
};
function tiposModal() {
  const c = S().cities[UI.city], coste = G.tipoCoste(c), sug = G.tipoSugerido(UI.city);
  let h = '<div class="yr">TIPO DE CIUDAD</div><h2>' + D.CITIES[UI.city].n + '</h2>' + licHtml({ lic: 'Colonia, municipio y emporio eran nombres o estatus reales, pero nadie «elegía» su oficio: el reparto es invención del juego.' }) +
    '<p>' + (coste ? 'Cambiar de tipo cuesta ' + coste + ' ' + D.RES_ICON.oro + '.' : 'La primera elección es gratis.') + '</p>';
  for (const k in D.TIPOS) {
    const t = D.TIPOS[k], act = c.tipo === k && c.tipoElegido, sinMar = !G.tipoOk(UI.city, k), sinOro = G.disponible('oro') < coste, no = act || sinMar || sinOro;
    h += '<div class="card ' + (sinMar ? 'locked' : '') + '"><div class="ic">' + t.i + '</div><div class="bd"><div class="tt">' + t.n + (k === sug ? '<span class="lv">Sugerido</span>' : '') + '</div><div class="ds">' + esc(t.d) + '</div>' + (sinMar ? '<div class="ds" style="color:#e0a030">Esta ciudad no tiene mar.</div>' : '') + '</div>' +
      '<button class="btn ' + (no ? 'no' : '') + '" ' + (no ? 'disabled' : 'data-act="tipo" data-v="' + k + '"') + '>' + (act ? 'Actual' : 'Elegir') + (coste && !act ? '<small>' + coste + ' ' + D.RES_ICON.oro + '</small>' : '') + '</button></div>';
  }
  return h + '<div class="acts"><button class="btn ghost" data-act="close">Cerrar</button></div>';
}
const inqHtml = c => c.owner === 'roma' && c.inq > 0 ? '<span class="stat" style="color:#e0a030">🔥 Ciudad conquistada: inquieta unos ' + Math.ceil(c.inq / (1 + D.INQ_TEMPLO * G.diosNivel(c))) + ' meses · produce un ' + Math.round((1 - G.inqMul(c)) * 100) + ' % menos' + (G.felicidad(c) < D.INQ_REBELION ? ' · <b>con esta felicidad se rebelará</b>' : '') + '. Un templo la calma antes.</span>' : '';
const popHtml = c => '<span class="stat">' + D.POP_ICON + ' Población <b>' + Math.floor(c.pop) + '</b> / ' + G.popCap(c) + '</span><span class="stat">' + D.GUERRA_ICON.casco + ' Reclutas disponibles <b>' + G.recruits(c) + '</b></span>' + manoHtml(c) + inqHtml(c) + espLinea(c) + barrioHtml(c) + clasesHtml(c) + impHtml(c);
function marketHtml() {
  const rate = G.tradeRate(); if (!rate) return '';
  UI.mf = UI.mf || 'madera'; UI.mt = UI.mt || 'hierro';
  const chips = (act, cur) => D.RES.map(r => '<button class="chip ' + (r === cur ? 'on' : '') + '" data-act="' + act + '" data-v="' + r + '">' + D.RES_ICON[r] + '</button>').join('');
  return '<div class="market"><div class="tt">⚖️ Mercado · cambio ' + Math.round(rate * 100) + ' %</div><div class="mrow"><span>Doy</span>' + chips('mfrom', UI.mf) + '</div><div class="mrow"><span>Recibo</span>' + chips('mto', UI.mt) + '</div>' +
    '<div class="btns" style="flex-direction:row">' + [100, 500, 2000].map(n => '<button class="btn" data-act="trade" data-n="' + n + '" data-need=\'' + JSON.stringify({ [UI.mf]: n }) + '\'>' + n + ' ' + D.RES_ICON[UI.mf] + ' → ' + Math.floor(n * rate) + ' ' + D.RES_ICON[UI.mt] + '</button>').join('') + '</div></div>';
}
/* hueco del encargo C: tarjeta de los sabios en la ficha de la Escuela */
const DOT_NOM = ['Cerrada', 'Un tercio', 'Dos tercios', 'Plena'], CLASE_SAB = { ple: 'Plebeyos', ciu: 'Ciudadanos', esc: 'Maestros esclavos' };
const dec1 = x => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const sgn = (x, d) => (x >= 0 ? '+' : '−') + dec1(Math.abs(x)).replace(/,0$/, d ? ',0' : '');
/* tarjeta de la Escuela (I5b): dotación y clase de los sabios. Pulsar → G.setSabios; la ficha se repinta entera, sin hoja flotante. */
function escuelaHtml(c) {
  if (!(c.b.escuela > 0) || c.owner !== 'roma') return '';
  const SD = D.SABER, x = G.sabiosDe(c), cid = UI.city, hayEsc = (c.esc || 0) >= 1, ed = SD.pagaEdad[Math.max(0, Math.min(SD.pagaEdad.length, S().inv.edad || 1) - 1)];
  const cab = (t, ctx) => '<div class="esc-h">' + t + (ctx ? '<small>' + ctx + '</small>' : '') + '</div>';
  const dots = [0, 1, 2, 3].map(d => {
    const v = G.sabiosVista(cid, d, x.clase), dn = v.n - x.n, act = d === x.dot;
    const ef = d === 0 && !c.sabios ? 'nadie estudia' : act ? 'puesta ahora' : (d === 0 ? 'quita ' + x.n + ' sabios' : (dn >= 0 ? '+' : '−') + Math.abs(dn) + ' sabios · ' + sgn(v.dVel) + ' ritmo · ' + sgn(v.dPaga) + ' oro/mes' + (v.alta > 0 ? ' · alta ' + Math.round(v.alta) + ' oro' : ''));
    return '<button class="esc-b' + (act ? ' on' : '') + '" data-act="dotsab" data-v="' + d + '" aria-pressed="' + act + '"><b>' + DOT_NOM[d] + '</b><small>' + ef + '</small></button>';
  }).join('');
  const clases = ['ple', 'ciu', 'esc'].map(k => {
    const off = k === 'esc' && !hayEsc, act = k === x.clase;
    return '<button class="esc-b esc-c' + (act ? ' on' : '') + (off ? ' off' : '') + '" data-act="clasab" data-v="' + k + '"' + (off ? ' disabled' : '') + ' aria-pressed="' + act + '"><b>' + CLASE_SAB[k] + '</b><small>' + (off ? 'no tienes esclavos' : 'rinde ×' + SD.rinde[k].toString().replace('.', ',') + ' · ' + (Math.round(SD.pagaBase[k] * 100) / 100).toFixed(2).replace('.', ',') + ' oro') + '</small></button>';
  }).join('');
  const S_ = Math.max(G.sabiosTotal(), x.n), cab1 = SD.pagaBase[x.clase] * ed * (1 + S_ / SD.pagaDiv);
  let viva;
  if (!x.dot) viva = 'Nadie estudia. Plazas: ' + x.aforo + '.';
  else if (!x.n) viva = 'Nadie estudia: ' + (x.clase === 'esc' ? 'los esclavos están muy descontentos' : x.disp[x.clase] < 1 ? 'no hay ' + CLASE_SAB[x.clase].toLowerCase() + ' libres' : 'la ciudad está muy descontenta') + '.';
  else viva = x.n + ' estudian de ' + x.aforo + ' plazas · rinde ' + dec1(x.R).replace(/,0$/, '') + ' · cuestan ' + dec1(x.n * cab1) + ' oro/mes (' + (Math.round(cab1 * 100) / 100).toFixed(2).replace('.', ',') + ' por cabeza) · quitan ' + x.n + ' reclutas';
  return '<div class="sec">Escuela · sabios</div><div class="esc">' + cab('Dotación', 'cuánta gente estudia') + '<div class="esc-g2">' + dots + '</div>' + cab('Quién estudia') + '<div class="esc-g3">' + clases + '</div>' +
    '<div class="esc-v">' + viva + '</div>' + (x.dot && x.ociosos > 0 ? '<div class="esc-av">Sacar gente del campo casi no baja la producción: sobran ' + x.ociosos + '.</div>' : '') + '</div>';
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
const RES_NOM = { madera: 'Madera', piedra: 'Piedra', hierro: 'Hierro', grano: 'Grano', oro: 'Oro' };
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
function rutasHtml(c, id) {
  if (c.owner !== 'roma') return '';
  const s = S(), cn = x => D.CITIES[x].n, abiertas = G.rutasAbiertas().filter(r => r.a === id || r.b === id);
  let h = '<div class="sec">Rutas comerciales</div><div class="empty">Huecos: ' + G.rutasDeCiudad(id) + ' / ' + G.rutaMax(c) + '. Los tratados de Roma y Cartago ya repartían dónde comerciar (Polibio 3.22-25).</div>';
  for (const r of abiertas) {
    const o = r.a === id ? r.b : r.a;
    h += '<div class="empty">⚖️ <b>' + cn(r.a) + ' ↔ ' + cn(r.b) + '</b> · +' + Math.round(G.rutaRenta(r)) + ' oro/mes · ' + (G.rutaMar(r) ? 'por mar' : 'por tierra') + (r.f !== 'roma' && D.ESPECIAL[D.CITIES[r.b].esp] ? ' · bien: ' + D.ESPECIAL[D.CITIES[r.b].esp].i + ' ' + D.ESPECIAL[D.CITIES[r.b].esp].n : '') +
      (r.a === id ? '<div class="btns"><button class="btn ghost" data-act="rutacerrar" data-v="' + r.a + '>' + r.b + '">Cerrar ruta</button></div>' : '') + '</div>';
  }
  for (const o of G.neighbors(id)) {
    if (G.rutaDe(id, o)) continue;
    const mot = G.rutaPuede(id, o), ajena = s.cities[o].owner !== 'roma', e = D.ESPECIAL[D.CITIES[o].esp];
    const verbo = ajena ? 'Firmar tratado con ' + cn(o) : 'Abrir ruta con ' + cn(o);
    if (mot && !/^Faltan/.test(mot)) h += '<div class="empty" style="opacity:.6">' + verbo + ' · ' + esc(mot) + '</div>';
    else h += '<div class="empty"><div class="btns"><button class="btn ' + (mot ? 'no' : '') + '" data-act="ruta" data-v="' + id + '>' + o + '" data-need=\'' + JSON.stringify({ oro: D.RUTA_COSTE }) + '\'>' + verbo + ' · ' + D.RUTA_COSTE + ' ' + D.RES_ICON.oro + '</button></div>' + (ajena && e ? '<div class="ds">Aporta el bien: ' + e.i + ' ' + e.n + '</div>' : '') + '</div>';
  }
  return h;
}
function viewCity() {
  const s = S(), c = s.cities[UI.city], d = D.CITIES[UI.city], roma = c.owner === 'roma';
  let h = cityChips() + '<div class="head"><h2>' + d.n + '</h2><p>' + esc(d.h) + '</p></div>' + (UI.cityV ? '<div class="acts" style="margin:0 0 6px"><button class="btn ghost" data-act="clist">Ver la ciudad en 3D</button></div>' : '');
  h += '<div class="empty">' + popHtml(c) + '</div>' + repartoHtml(c) + (roma ? '<div class="empty">' + espResumen() + '</div><div class="empty">' + tipoHtml(c) + '</div>' : '');
  if (roma && c.b.templo > 0) h += '<div class="empty">' + diosBloque(c, 'templo') + '</div>';
  if (G.tradeRate() > 0) h += marketHtml();
  if (c.b.herreria > 0) h += forjaHtml(c);
  return h + rutasHtml(c, UI.city);
}
/* ---------- J6 · Ciudad como pantalla principal ---------- */
const ICO_X = svgIco('<path d="M6 6l12 12M18 6L6 18"/>');
const ICO_OBRA = svgIco('<path d="M13.5 4.5l6 6-2.5 2.5-6-6zM12 8l-8 8.5 3 3L15.5 11"/>');
const ICO_ALERTA = svgIco('<path d="M12 4l9.5 16h-19zM12 10v4.5M12 17.2v.3"/>');
const ICO_VER = svgIco('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
const ICO_MUNDO = svgIco('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>');
const ICO_MAS = svgIco('<path d="M4 7h16M4 12h16M4 17h16"/>');
/* ---------- Imperio: libro de cuentas de todas tus ciudades ---------- */
const IMP_FILTROS = [['todas', 'Todas'], ['urgentes', 'Urgentes'], ['sinobra', 'Sin obra'], ['obras', 'En obras'], ['animo', 'Ánimo bajo']];
const nomObra = q => q.b ? D.BUILD[q.b].n : (q.pieza || 'Obra');
function impFila(id) {
  const s = S(), c = s.cities[id], f = Math.round(G.felicidad(c)), pc = G.popCap(c), ob = c.obras || [];
  const con = consejo(c, id);
  let pts = 0, causa = '', tono = '';
  const pon = (p, t, k) => { if (p > pts) { pts = p; causa = t; tono = k; } };
  if (c.inq > 0) pon(60 + c.inq, 'Inquietud', 'mal');
  if (f < 40) pon(50 + (40 - f), 'Ánimo bajo', 'mal');
  if (con.flags.almacen) pon(40, 'Almacén lleno', 'av');
  if (con.flags.viviendas) pon(35, 'Población al tope', 'av');
  if (!ob.length && con.rec) pon(20, 'Sin obra · hay recursos', 'av');
  else if (!ob.length) pon(5, 'Sin obra', 'ok');
  return { id, c, f, pc, pts, causa, tono, con, ob, urg: pts >= 30 };
}
const impObraHtml = (q, cls) => '<div class="' + cls + '"><span class="imp-nb">' + esc(obraNom(q)) + '</span><div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div><span class="rem"></span></div>';
function viewImperio() {
  const s = S(), filas = G.myCities().map(impFila), n = filas.length;
  const pop = filas.reduce((a, r) => a + Math.floor(r.c.pop), 0), cap = filas.reduce((a, r) => a + r.pc, 0);
  const fm = n ? Math.round(filas.reduce((a, r) => a + r.f, 0) / n) : 0, peor = filas.slice().sort((a, b) => a.f - b.f)[0];
  const obras = filas.filter(r => r.ob.length).length, sin = n - obras;
  const F = UI.impF || 'todas', cuenta = { todas: n, urgentes: filas.filter(r => r.urg).length, sinobra: sin, obras, animo: filas.filter(r => r.f < 40).length };
  const ok = { todas: () => true, urgentes: r => r.urg, sinobra: r => !r.ob.length, obras: r => !!r.ob.length, animo: r => r.f < 40 }[F] || (() => true);
  const lista = filas.filter(ok).sort((a, b) => b.pts - a.pts || b.c.pop - a.c.pop);
  const cara = f => f >= 60 ? '😊' : f >= 40 ? '😐' : '😠';
  let h = '<div class="imp"><div class="imp-res"><div><b>' + pop + '<small>/' + cap + '</small></b><span>población</span></div><div><b>' + cara(fm) + ' ' + fm + '</b><span>ánimo medio</span></div><div><b>' + obras + '</b><span>en obras</span></div><div><b>' + sin + '</b><span>sin obra</span></div></div><button class="btn cu-go" data-act="cuentas">📊 Cuentas del mes<small>materiales y oro</small></button><button class="btn cu-go" data-act="tab" data-v="senado">🏛️ Senado<small>favor y misión</small></button><button class="btn cu-go" data-act="tab" data-v="saber">📚 Saber<small>edades e investigación</small></button>' +
    (peor && n > 1 ? '<div class="imp-peor">Peor ánimo: <b>' + D.CITIES[peor.id].n + '</b> ' + cara(peor.f) + ' ' + peor.f + '</div>' : '') +
    '<div class="imp-chips">' + IMP_FILTROS.map(x => '<button class="' + (F === x[0] ? 'on' : '') + '" data-act="impf" data-v="' + x[0] + '">' + x[1] + ' <i>' + cuenta[x[0]] + '</i></button>').join('') + '</div><div class="imp-lista">';
  if (!lista.length) h += '<div class="imp-vacio">Ninguna ciudad cumple este filtro.</div>';
  for (const r of lista) {
    const c = r.c;
    h += '<div class="imp-sw"><div class="imp-izq"><button data-act="impmismo" data-v="' + r.id + '">Hacer lo mismo en…</button></div><div class="imp-fila' + (r.urg ? ' urg' : '') + '" role="button" tabindex="0" data-act="impc" data-v="' + r.id + '"><div class="imp-l1"><b>' + D.CITIES[r.id].n + '</b><span class="imp-pop">' + D.POP_ICON + ' ' + Math.floor(c.pop) + '/' + r.pc + '</span><span class="imp-an">' + cara(r.f) + ' ' + r.f + '</span><span class="imp-fl" aria-hidden="true">‹ ›</span></div>' +
      '<div class="imp-l2">' + (r.ob.length ? '<div class="imp-obs">' + r.ob.map(q => impObraHtml(q, 'imp-obra')).join('') + '</div>' : '<span class="imp-sin">sin obra</span>') +
      (r.causa ? '<em class="imp-tag ' + r.tono + '">' + r.causa + '</em>' : '') + '</div></div></div>';
  }
  h += '</div><div class="sec">Obras</div><div class="imp-obras">';
  const en = filas.filter(r => r.ob.length).sort((a, b) => Math.min(...a.ob.map(q => q.t1)) - Math.min(...b.ob.map(q => q.t1)));
  if (!en.length) h += '<div class="imp-vacio">Ninguna ciudad tiene obras en curso.</div>';
  for (const r of en) h += '<div class="imp-ob imp-ob-c"><b>' + D.CITIES[r.id].n + ' <small>' + obrasTxt(r.c) + '</small></b>' + r.ob.map(q => '<div class="imp-ob1"><span class="imp-nb">' + esc(obraNom(q)) + '</span><div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div><span class="rem"></span>' + (plazoTxt(q) ? '<div class="plz' + (q.pausa ? ' pausa' : '') + '">' + plazoTxt(q) + '</div>' : '') + '</div>').join('') + '</div>';
  h += '</div>';
  return h + '</div>';
}
/* pone una pieza en una ciudad: la mejora (op.mej = id de la pieza) o una nueva en su mejor sitio. Devuelve {ok, motivo, obra} */
function ponPieza(cid, op) {
  if (op.mej) return G.mejorarPieza(cid, op.mej);
  const E = G.ciudadE(cid); let sitio = null;
  try { sitio = op.pieza === 'muelle' ? null : Ciudad.mejorSitio(E, op.pieza); } catch (err) { sitio = null; }
  return sitio ? G.colocar(cid, op.pieza, sitio[0], sitio[1]) : { ok: false, motivo: 'No hay un buen sitio para ' + op.nombre.toLowerCase() };
}
/* Deslizar una fila: derecha = hacer la obra aconsejada; izquierda = «Hacer lo mismo en…» */
function impHacer(id) {
  const c = S().cities[id];
  if (c.obras.length >= G.huecos(c)) return toast(D.CITIES[id].n + ': ' + sinHuecoTxt(c) + '.', 'bad');
  const con = consejo(c, id);
  if (!con.pieza) return toast(D.CITIES[id].n + ': ' + con.t, 'bad');
  const op = opcionPieza(id, con.pieza, !con.mej);
  if (!op) return toast(D.CITIES[id].n + ': esa obra no se puede hacer ahora.', 'bad');
  const r = ponPieza(id, op);
  if (r.ok) { toast('🔨 ' + D.CITIES[id].n + ': ' + op.nombre + '.'); render(); mismoModal(id, con.pieza, !con.mej); }
  else toast(D.CITIES[id].n + ': ' + r.motivo + '.', 'bad');
}
function mismoModal(id, pz, nueva) {
  const P = Ciudad.EDIF[pz];
  const otras = G.myCities().filter(x => x !== id).map(x => ({ x, op: opcionPieza(x, pz, nueva) })).filter(o => o.op && G.canAfford(o.op.ini));
  let h = '<div class="yr">HACER LO MISMO</div><h2>' + (P.bid ? bIco(P.bid) + ' ' : '') + P.nombre + '</h2>';
  if (!otras.length) h += '<p>Ninguna otra ciudad puede hacer esta obra ahora: tienen obra en curso, no tienen sitio o faltan recursos.</p>';
  for (const o of otras) h += '<div class="card"><div class="bd"><div class="tt">' + D.CITIES[o.x].n + '<span class="lv">' + esc(o.op.nombre) + '</span></div>' + costHtml(o.op.coste) + '</div><button class="btn" data-act="impmas" data-v="' + o.x + '>' + pz + '>' + (nueva ? 1 : 0) + '">' + (o.op.mej ? 'Mejorar' : 'Colocar') + '</button></div>';
  modal(h + '<div class="acts"><button class="btn ghost" data-act="close">Cerrar</button></div>');
}
(function () {
  let sw = null;
  document.addEventListener('pointerdown', e => {
    const f = e.target.closest('.imp-fila'); if (!f || (e.pointerType === 'mouse' && e.button)) return;
    const abierta = document.querySelector('.imp-fila.abre'); if (abierta && abierta !== f) { abierta.classList.remove('abre'); abierta.style.transform = ''; }
    sw = { f, x: e.clientX, y: e.clientY, dx: 0, on: false, base: f.classList.contains('abre') ? -110 : 0 };
  });
  document.addEventListener('pointermove', e => {
    if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
    if (!sw.on) { if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { sw = null; return; } if (Math.abs(dx) < 10) return; sw.on = true; sw.f.classList.add('arr'); try { sw.f.setPointerCapture(e.pointerId); } catch (x) {} }
    sw.dx = dx; sw.f.style.transform = 'translateX(' + Math.max(-120, Math.min(90, sw.base + dx)) + 'px)';
  });
  const fin = () => {
    if (!sw) return; const f = sw.f, d = sw.dx, on = sw.on, base = sw.base; sw = null; f.classList.remove('arr');
    if (!on) return; UI.swipeT = Date.now();
    if (base < 0 && d > 40) { f.classList.remove('abre'); f.style.transform = ''; return; }
    if (d > 60 && base === 0) { f.classList.remove('abre'); f.style.transform = ''; impHacer(f.dataset.v); }
    else if (d < -60 && base === 0) { f.classList.add('abre'); f.style.transform = 'translateX(-110px)'; }
    else { f.style.transform = base < 0 ? 'translateX(-110px)' : ''; }
  };
  document.addEventListener('pointerup', fin); document.addEventListener('pointercancel', fin);
  document.addEventListener('click', e => { if (UI.swipeT && Date.now() - UI.swipeT < 400 && e.target.closest('.imp-fila')) { e.stopPropagation(); e.preventDefault(); UI.swipeT = 0; } }, true);
})();
function buildTabs() {
  $('tabs3').innerHTML = [['ciudad', D.BUILD_ICON.viviendas, 'Ciudad'], ['gobierno', ICO_GOB, 'Gobierno'], ['imperio', ICO_MUNDO, 'Imperio']].map(t => '<button data-act="tab3" data-v="' + t[0] + '">' + t[1] + '<span>' + t[2] + '</span></button>').join('');
  $('bmas').innerHTML = ICO_MAS;
}
/* ---------- consejo y piezas (CN4): el consejo habla de piezas, no de niveles de edificio ---------- */
const ROM = Ciudad.ROMANOS;
const sin0 = k => { const o = {}; for (const r in k) if (k[r] > 0) o[r] = k[r]; return o; };
const obraNom = o => o.b && D.BUILD[o.b] ? D.BUILD[o.b].n : o.pieza && Ciudad.EDIF[o.pieza] ? Ciudad.EDIF[o.pieza].nombre : 'una obra';
const durPieza = (c, P, k) => P.bid ? G.buildTime(c, P.bid) : P.obra * (k || 1) * (1 - 0.04 * (c.b.foro || 0)) * G.bonoMul('obra');
/* qué se puede hacer con una pieza en una ciudad propia: mejorar la de menor nivel, o colocar una nueva (si nueva, o si no hay nada que mejorar) */
function opcionPieza(cid, pz, nueva) {
  const c = S().cities[cid], E = c && c.owner === 'roma' ? G.ciudadE(cid) : null, P = Ciudad.EDIF[pz];
  if (!E || !P || P.accion || !E.abiertas.includes(pz) || c.obras.length >= G.huecos(c)) return null;
  if (P.bid && ((D.BUILD[P.bid].sea && !D.CITIES[cid].sea) || G.faltaEspecial('edificio', P.bid, c.b[P.bid] || 0))) return null;
  let e = null;
  if (!nueva) for (const q of E.edificios) if (q.tipo === pz && !q.ruina && !q.obra && !c.obras.some(o => o.eid === q.id) && Ciudad.mejoraSiguiente(E, q.id) && (!e || (q.mejora || 0) < (e.mejora || 0))) e = q;
  if (e) { const m = Ciudad.mejoraSiguiente(E, e.id), k = (e.mejora || 0) + 1; return { pieza: pz, mej: e.id, nombre: m.nombre, coste: sin0(m.coste), lvl: k - 1, ini: G.planPago(m.coste, durPieza(c, P, k)).primera }; }
  return { pieza: pz, mej: null, nombre: P.nombre, coste: sin0(P.coste), lvl: -1, ini: G.planPago(P.coste, durPieza(c, P, 1)).primera };
}
/* La acción aconsejada: almacén lleno, granero, población al tope, servicio del barrio, o la obra más barata que se puede pagar.
   Devuelve {t, rec, b (id D.BUILD o null), pieza (id de pieza o null), mej (id de la pieza a mejorar o null), flags} */
function consejo(c, id) {
  id = id || UI.city; const s = S(), cap = G.cap(), E = c.owner === 'roma' ? G.ciudadE(id) : null, flags = {};
  const lleno = D.RES.filter(r => r !== 'oro').map(r => [r, s.res[r] / cap]).filter(x => x[1] >= 0.9).sort((x, y) => y[1] - x[1])[0];
  const tope = c.pop >= G.popCap(c) - 1;
  if (E && lleno && E.abiertas.includes('almacen')) flags.almacen = 'alerta';
  if (E && tope) flags.viviendas = 'alerta';
  const mk = (t, op) => ({ t, rec: !!op && G.canAfford(op.ini), b: op ? Ciudad.EDIF[op.pieza].bid || null : null, pieza: op ? op.pieza : null, mej: op ? op.mej : null, flags });
  if (c.obras.length >= G.huecos(c)) { const o = c.obras[0]; return { t: 'En obras: ' + obraNom(o) + (c.obras.length > 1 ? ' y ' + (c.obras.length - 1) + ' más' : '') + '. Faltan ' + months(Math.max(0, o.t1 - s.t)) + '.', rec: false, b: o.b || null, pieza: o.pieza || null, mej: null, flags }; }
  if (!E) return mk('Faltan recursos para nuevas obras. Espera a que lleguen.', null);
  if (flags.almacen) return mk('Tu ' + RES_NOM[lleno[0]].toLowerCase() + ' llega al ' + Math.min(100, Math.round(lleno[1] * 100)) + ' %: ' + (E.edificios.some(q => q.tipo === 'almacen') ? 'coloca otro almacén.' : 'coloca un almacén.'), opcionPieza(id, 'almacen', true));
  if (E.abiertas.includes('granero') && !E.edificios.some(q => q.tipo === 'granero')) return mk('Falta un granero: sin él hay hambre en invierno.', opcionPieza(id, 'granero', true));
  if (tope) return mk('La población está al tope: faltan casas. Las casas nacen solas junto a las calles; coloca una obra que traiga una calle.', null);
  const bi = G.barrioInfo(c), baja = bi.objetivo < bi.nivel, fl = baja ? (D.BARRIO[bi.nivel].pide || []).filter(k => !bi.serv[k]) : bi.falta;
  const sv = fl.map(k => ({ templo: 'templo', agua: 'fuente', mercado: 'mercado', grano: 'granja' })[k]).filter(Boolean).map(p => opcionPieza(id, p, true)).find(o => o && G.canAfford(o.ini));
  if (sv) return mk((baja ? 'Para seguir siendo ' + D.BARRIO[bi.nivel].n : 'Para ser ' + D.BARRIO[bi.nivel + 1].n) + ' falta ' + ({ templo: 'un templo', fuente: 'una fuente', mercado: 'un mercado', granja: 'más grano: una granja' })[sv.pieza] + '.', sv);
  const cand = ['granja', 'aserradero', 'cantera', 'mina', 'almacen'].map(p => opcionPieza(id, p, false)).filter(o => o && G.canAfford(o.ini)).sort((x, y) => x.lvl - y.lvl)[0];
  if (cand) return mk((cand.mej ? 'Mejora a ' : 'Coloca: ') + cand.nombre + '. Ya tienes los recursos.', cand);
  return mk('Faltan recursos para nuevas obras. Espera a que lleguen.', null);
}
/* la pieza (o el foro, o la obra) que enseña la ficha, a partir de UI.bsel = {k:'pieza'|'foro'|'obra', id, pieza, x, z} */
function selDe(c) {
  const sel = UI.bsel, E = G.ciudadE(UI.city); if (!sel || !E) return null;
  if (sel.k === 'foro') return E.foro ? { k: 'foro' } : null;
  if (sel.k === 'pieza') { const e = E.edificios.find(q => q.id === sel.id); return e ? { k: 'pieza', e } : null; }
  const o = c.obras.find(q => q.nuevo && q.pieza === sel.pieza && q.x === sel.x && q.z === sel.z); if (o) return { k: 'obra', o };
  const e = E.edificios.find(q => q.tipo === sel.pieza && Math.hypot(q.x - sel.x, q.z - sel.z) < 4);       // la obra acabó: ahora es una pieza
  if (e) { UI.bsel = { k: 'pieza', id: e.id, x: e.x, z: e.z }; return { k: 'pieza', e }; } return null;
}
function cityMeta(c) {
  const cons = consejo(c), sd = selDe(c);
  const fk = c.obras.map(o => (o.eid || o.pieza || '') + (o.pausa ? 'p' : '')).join() + '|' + (sd ? sd.k + (sd.e ? sd.e.id + (sd.e.mejora || 0) + (sd.e.ruina ? 'r' : '') : '') + (sd.k === 'foro' ? c.b.foro : '') : '');
  return { cons, rec: cons.rec ? cons.b : null, flags: cons.flags, oculta: {}, fk };
}
const metaKey = m => JSON.stringify([m.cons.pieza, m.cons.mej, m.cons.rec, m.cons.t.replace(/Faltan .*$/, ''), m.flags, m.fk]);
/* ficha de lo tocado en modo mirar: nombre y nivel, qué hace, la obra en marcha, mejorar / derribar (mover: pendiente, falta G.mover en game.js) y lo propio de cada edificio */
function fichaHtml(c, sd) {
  const E = G.ciudadE(UI.city), cn = D.CITIES[UI.city].n, lleno = c.obras.length >= G.huecos(c);
  let ico, nom, sub, que, nv, cuerpo = '', e = null, P = null, ob = null;
  if (sd.k === 'foro') {
    ico = bIco('foro'); nom = 'Foro'; sub = cn + ' · nivel ' + (c.b.foro || 1); que = D.BUILD.foro.d; nv = 'NIVEL ' + (c.b.foro || 1);
    cuerpo = '<div class="nota">Obras a la vez: <b>' + c.obras.length + ' de ' + G.huecos(c) + '</b>. El foro sube solo con las casas y los barrios: no se mejora ni se derriba.</div>';
  } else {
    e = sd.e || null; ob = sd.o || c.obras.find(q => q.eid === e.id) || null; P = Ciudad.EDIF[e ? e.tipo : sd.o.pieza];
    const bid = P.bid, dg = bid === 'templo' ? G.diosDe(c) : null, k = e ? (e.mejora || 0) : 0;
    ico = bid ? bIco(bid) : ICO_OBRA; nom = dg ? 'Templo de ' + dg.n : P.nombre; que = P.que || '';
    nv = e ? 'NIVEL ' + ROM[k + 1] : 'EN OBRA'; sub = cn + (e ? ' · nivel ' + ROM[k + 1] + (e.ruina ? ' · en ruinas' : '') : ' · se está levantando');
    if (ob) cuerpo += '<div class="obra"><div class="prog" data-t0="' + ob.t0 + '" data-t1="' + ob.t1 + '"><i></i></div><span class="rem"></span></div>' + (plazoTxt(ob) ? '<div class="plz' + (ob.pausa ? ' pausa' : '') + '">' + plazoTxt(ob) + '</div>' : '') + (e ? '<div class="nota">Sube a nivel ' + ROM[ob.mejora + 1] + '. Mientras dura la obra no se puede mejorar ni derribar.</div>' : '');
    else if (e) {
      const m = e.ruina ? null : Ciudad.mejoraSiguiente(E, e.id), fe = bid && !e.ruina ? G.faltaEspecial('edificio', bid, c.b[bid] || 0) : null;
      if (m) {
        const co = sin0(m.coste), pp = G.planPago(co, durPieza(c, P, k + 1)), need1 = pp.primera;
        cuerpo += '<div class="costes" style="--n:' + Object.keys(co).length + '">' + Object.keys(co).map(r => '<span class="cos" data-need=\'' + JSON.stringify({ [r]: need1[r] || 0 }) + '\'>' + D.RES_ICON[r] + '<b>' + fmt(need1[r] || 0) + '</b><small data-have="' + r + '"></small></span>').join('') + '</div>' + (pp.nc > 1 ? '<div class="plz">cuota inicial · total ' + Object.keys(co).map(r => D.RES_ICON[r] + ' ' + fmt(co[r])).join(' ') + ' en ' + pp.nc + ' cuotas</div>' : '');
        cuerpo += fe ? faltaBtn(fe) : '<div class="fila"><button class="bmain' + (lleno ? ' no' : '') + '" data-act="mejpz" data-v="' + e.id + '"' + (lleno ? '' : " data-need='" + JSON.stringify(need1) + "'") + '>' + ICO_OBRA + 'Mejorar a ' + ROM[k + 2] + '</button></div>' + '<div class="nota">' + (lleno ? sinHuecoTxt(c) + '. ' : '') + obrasTxt(c) + (lleno ? '.' : '') + '</div>';
      } else if (!e.ruina && P.mejoras) cuerpo += '<div class="nota">Nivel máximo alcanzado.</div>';
      if (e.tipo !== 'compitum') {
        const dk = UI.city + ':' + e.id;
        cuerpo += '<div class="fila fila2">' + '<button class="bsec' + (UI.derr === dk ? ' sure' : '') + '" data-act="derr" data-v="' + e.id + '">' + (UI.derr === dk ? '¿Seguro? Derribar' : 'Derribar') + '</button></div>';
      } else cuerpo += '<div class="nota">Una capilla de cruce no se derriba.</div>';
    }
  }
  const bid = P && P.bid, extra = (bid === 'templo' ? diosBloque(c, 'templo') : '') + (bid === 'mercado' ? marketHtml() : '') + (bid === 'herreria' ? forjaHtml(c) : '') + (bid === 'escuela' ? escuelaHtml(c) : '');
  return '<div class="ficha"><div class="greca"></div><div class="cab"><span class="ic">' + ico + '</span><div class="cn"><h2>' + esc(nom) + '</h2><p>' + esc(sub) + '</p></div><button class="x" data-act="cclose" aria-label="Cerrar la ficha">' + ICO_X + '</button></div>' +
    '<div class="cuerpo">' + (que ? '<div class="efecto"><span class="nv">' + nv + '</span><span>' + esc(que) + '</span></div>' : '') + cuerpo + (extra ? '<div class="fxd">' + extra + '</div>' : '') + '</div></div>';
}
/* ---------- CN4: una línea de contexto arriba y una bandeja de fichas abajo (nunca dos paneles) ----------
   UI.modo3: 'mirar' (bandeja) · 'colocar' (fantasma bajo el dedo) · 'muralla' (un solo botón) · 'ficha' (UI.bsel: la ficha del edificio, pieza B). */
const NOTA3 = { verde: 'Buen sitio', ocre: 'Sitio regular', rojo: 'Mal sitio', nada: 'Aquí no' };
const coste5 = k => Object.keys(k).filter(r => k[r] > 0).map(r => D.RES_ICON[r] + fmt(k[r])).join(' ');
const suma5 = k => Object.keys(k).reduce((a, r) => a + k[r], 0);
function lineaPon(t, clase, nota, seg) { UI.lin = t ? { t, c: clase || '', n: nota || '', hasta: seg ? performance.now() + seg * 1000 : 0 } : null; pintaLinea(); }
function pintaLinea() {
  const l = $('linea'), m3 = UI.modo3 || 'mirar'; let x = UI.lin;
  if (x && x.hasta && performance.now() > x.hasta) x = UI.lin = null;
  if (!x && m3 === 'mirar' && UI.cityV && UI.cityV.meta) x = { t: UI.cityV.meta.cons.t, c: 'aviso consejo', n: '' };
  const k = UI.bsel || !x || !x.t ? '' : x.c + '|' + x.n + '|' + x.t;
  if (k === UI.linK) return; UI.linK = k;
  if (!k) { l.hidden = true; return; }
  l.hidden = false; l.className = x.c; $('l-nota').textContent = x.n; $('l-nota').hidden = !x.n; $('l-texto').textContent = x.t;
}
/* datos de una ficha de la bandeja: nombre, coste total, lo que se paga al empezar y si ya hay obra */
function piezaInfo(id) {
  const c = S().cities[UI.city], E = G.ciudadE(UI.city);
  if (id === 'muralla') { const m = Ciudad.murallaSiguiente(E); return { nombre: E.muralla.fase ? 'Muralla de piedra' : 'Empalizada', coste: m && m.coste, ini: m && m.coste, enObra: !!E.muralla.obra, boton: m && m.nombre }; }
  const P = Ciudad.EDIF[id], dur = P.bid ? G.buildTime(c, P.bid) : P.obra * (1 - 0.04 * (c.b.foro || 0)) * G.bonoMul('obra');
  return { nombre: P.nombre, coste: P.coste, ini: G.planPago(P.coste, dur).primera, cerrada: P.bid ? G.faltaInv(P.bid) : null };
}
function bandejaIds() {
  const E = G.ciudadE(UI.city); if (!E) return [];
  const ids = E.abiertas.filter(id => id !== 'muralla' && Ciudad.EDIF[id] && !Ciudad.EDIF[id].accion);
  if (Ciudad.murallaSiguiente(E) || E.muralla.obra) ids.push('muralla'); return ids;
}
function bandejaPinta() {
  const b = $('bandeja'), E = G.ciudadE(UI.city); if (!E || !E.fundada) { b.innerHTML = ''; UI.bandK = ''; return; }
  const ids = bandejaIds(), k = UI.city + '|' + ids.join() + '|' + ids.map(q => Ciudad.EDIF[q] && Ciudad.EDIF[q].bid && G.faltaInv(Ciudad.EDIF[q].bid) ? 1 : 0).join('') + '|' + E.muralla.fase + E.muralla.obra + '|' + (UI.minis ? 1 : 0);
  if (k !== UI.bandK) {
    const antes = (UI.bandK || '').split('|')[1], viejas = antes ? antes.split(',') : []; UI.bandK = k;
    b.innerHTML = ids.map(id => { const i = piezaInfo(id);
      return '<button class="pza' + (viejas.length > 1 && !viejas.includes(id) ? ' nueva' : '') + (i.cerrada ? ' cerrada' : '') + '" data-id="' + id + '"' + (i.cerrada ? ' style="opacity:.55" title="' + esc(i.cerrada) + '"' : '') + '>' + (UI.minis && UI.minis[id] ? '<img src="' + UI.minis[id] + '" alt="" draggable="false">' : '<i></i>') + '<b>' + esc(i.nombre) + '</b><span>' + (i.cerrada ? 'cerrada' : i.enObra ? 'en obra' : i.coste ? fmt(suma5(i.coste)) : '') + '</span></button>'; }).join('');
  }
  for (const f of b.children) { const i = piezaInfo(f.dataset.id); f.classList.toggle('cara', !i.enObra && !!i.ini && !G.canAfford(i.ini)); }
}
function cityPantalla() {
  const m3 = UI.bsel ? 'ficha' : (UI.modo3 || 'mirar'), cs = $('csheet'); if (cs.dataset.m !== m3) cs.dataset.m = m3;
  if (m3 === 'mirar') bandejaPinta();
  const si = $('b-si'); if (!si || (m3 !== 'colocar' && m3 !== 'muralla')) return;
  const c = S().cities[UI.city], lleno = c.obras.length >= G.huecos(c); let t, off;
  if (m3 === 'colocar') { const i = piezaInfo(UI.sel3.id), x = UI.sel3; off = !x.vale || lleno || !G.canAfford(i.ini); t = !x.vale ? 'Aquí no se puede' : lleno ? (G.huecos(c) === 1 ? 'Ya hay una obra en curso' : 'Sube el foro para otra obra') : !G.canAfford(i.ini) ? 'Faltan recursos<small>' + coste5(i.ini) + '</small>' : 'Construir aquí' + '<small>' + coste5(i.ini) + '</small>'; }
  else { const i = piezaInfo('muralla'); off = !i.ini || lleno || !G.canAfford(i.ini); t = !i.ini ? 'Obra en marcha' : lleno ? (G.huecos(c) === 1 ? 'Ya hay una obra en curso' : 'Sube el foro para otra obra') : !G.canAfford(i.ini) ? 'Faltan recursos<small>' + coste5(i.ini) + '</small>' : i.boton + '<small>' + coste5(i.ini) + '</small>'; }
  if (si._t !== t) { si._t = t; si.innerHTML = t; } si.disabled = off;
}
function salir3(avisar) {
  if (UI.modo3 === 'fundar') { cerrarFundar(); return; }
  UI.modo3 = 'mirar'; UI.sel3 = null;
  if (UI.cityV) { UI.cityV.ponerFantasma(null); UI.cityV.calor(null); }
  if (!avisar) lineaPon(''); cityPantalla(); pintaLinea();
}
function elegir3(id, p) {
  if (!UI.cityV || !G.ciudadE(UI.city)) return; UI.bsel = null; UI.vistas = false; UI.col3City = UI.city; $('csheet').dataset.m = '';
  if (id === 'muralla') { UI.modo3 = 'muralla'; UI.modoT = performance.now(); UI.sel3 = null; UI.cityV.ponerFantasma(null); UI.cityV.calor(null); const E = G.ciudadE(UI.city);
    lineaPon(Ciudad.murallaSiguiente(E) ? (E.muralla.fase ? 'La empalizada se rehace en piedra, con torres y puertas donde cruzan las calles.' : 'La empalizada sigue el surco, con puertas donde cruzan las calles. Las casas de fuera quedan de arrabal.') : 'La obra de la muralla ya está en marcha.', 'aviso'); renderCity3D(); return; }
  UI.modo3 = 'colocar'; UI.modoT = performance.now(); UI.sel3 = { id }; UI.cityV.calor(G.mapaCalor(UI.city, id));
  if (!p) p = UI.cityV.sueloEn(innerWidth / 2, innerHeight * 0.45); if (!p) { const E = G.ciudadE(UI.city); p = [E.foro.x, E.foro.z]; }
  renderCity3D(); mover3(p[0], p[1]);
}
function mover3(x, z) {
  const sel = UI.sel3; if (UI.modo3 !== 'colocar' || !sel) return; const n = G.notaSitio(UI.city, sel.id, x, z); if (!n) return;
  const col = n.vale ? Ciudad.color(n.nota) : 'rojo'; Object.assign(sel, { x, z, vale: n.vale, nota: n.nota });
  UI.cityV.ponerFantasma({ id: sel.id, x, z, ang: n.ang || 0, color: col, radio: n.vale ? n.radio : 0 });
  lineaPon(n.razones.join(' · '), 'sitio ' + col, NOTA3[col]); cityPantalla();
}
function construir3() {
  if (performance.now() - (UI.modoT || 0) < 450) return;      // el «clic fantasma» del toque en la ficha cae sobre el botón recién aparecido
  if (UI.modo3 === 'fundar') { fundarAqui(); return; }
  if (UI.modo3 === 'muralla') {
    // CN7: tabla de guerra, saqueo y consejo cuelgan de G.levantarMuralla
    const nom = piezaInfo('muralla').nombre, r = G.levantarMuralla(UI.city); if (!r.ok) { lineaPon(r.motivo, 'aviso malo', '', 4); toast(r.motivo, 'bad'); return; }
    salir3(); toast('🔨 ' + nom + ': en obra', 'good'); renderCity3D(); tickUI(); return; }
  const sel = UI.sel3; if (UI.modo3 !== 'colocar' || !sel) return;
  const r = G.colocar(UI.city, sel.id, sel.x, sel.z);
  if (!r.ok) { lineaPon(r.motivo, 'aviso malo', '', 4); toast(r.motivo, 'bad'); cityPantalla(); return; }
  const P = Ciudad.EDIF[sel.id]; salir3(); toast('🔨 ' + P.nombre + ': obra en marcha (' + (P.obra === 1 ? 'un mes' : P.obra + ' meses') + ')', 'good'); renderCity3D(); tickUI();
}
/* punto único al tocar en modo 'mirar': b = id D.BUILD o 'foro' o null, ed = la pieza tocada de E.edificios, g = punto del suelo.
   Pieza, foro u obra en marcha abren su ficha en el hueco de abajo; casa o suelo dan la línea del barrio. */
function tocarCiudad(b, ed, g) {
  if ((UI.modo3 || 'mirar') !== 'mirar') return;
  const c = S().cities[UI.city], E = G.ciudadE(UI.city); let sel = null;
  if (b === 'foro' && E && E.foro) sel = { k: 'foro' };
  else if (ed) sel = { k: 'pieza', id: ed.id, x: ed.x, z: ed.z };
  else if (g) { const o = c.obras.find(q => q.nuevo && q.pieza && Math.hypot(q.x - g[0], q.z - g[1]) < 14); if (o) sel = { k: 'obra', pieza: o.pieza, x: o.x, z: o.z }; }
  UI.bsel = sel; UI.vistas = false; UI.derr = null;
  if (sel || !E || !g) lineaPon('');
  else { const i = Ciudad.barrioDe(E, g[0], g[1]); if (i >= 0 && E.barrios[i]) lineaPon(Ciudad.textoBarrio(E, i), 'aviso barrio', '', 7); else lineaPon(''); }
  renderCity3D(); tickUI();
}
function renderCity3D() {
  const s = S(), c = s.cities[UI.city], m = cityMeta(c); UI.metaK = metaKey(m);
  if (UI.cityV) UI.cityV.meta = m;
  $('ctop').innerHTML = '<button class="vb" data-act="cvistas" aria-label="Cambiar la vista de la ciudad" title="Cambiar la vista">' + ICO_VER + '</button>' +
    (UI.vistas ? '<button class="vo" data-act="cview" data-v="ciudad">Ciudad entera</button><button class="vo" data-act="cview" data-v="calle">Calle</button><button class="vo" data-act="cview" data-v="ejercito">Tropas</button>' : '');
  const fb = $('fichab'), sd = UI.bsel ? selDe(c) : null; if (UI.bsel && !sd) UI.bsel = null; if (sd) { fb.hidden = false; fb.innerHTML = fichaHtml(c, sd); } else { fb.hidden = true; fb.innerHTML = ''; }
  cityPantalla(); pintaLinea();
  if (UI.cityV) UI.cityV.fichaTop = UI.bsel ? fb.getBoundingClientRect().top : 0;
}
/* gestos de la bandeja: tocar una ficha, o arrastrarla hacia arriba (≥16 px) para llevar el edificio 70 px sobre el dedo */
function initBandeja() {
  let arr = null; const b = $('bandeja');
  b.addEventListener('pointerdown', e => { const f = e.target.closest('.pza'); if (!f) return; arr = { id: f.dataset.id, x0: e.clientX, y0: e.clientY, activo: false, pid: e.pointerId, f }; });
  addEventListener('pointermove', e => { if (!arr || e.pointerId !== arr.pid) return; const dx = e.clientX - arr.x0, dy = e.clientY - arr.y0;
    if (!arr.activo) { if (dy < -16 && Math.abs(dy) > Math.abs(dx) && arr.id !== 'muralla') { arr.activo = true; try { arr.f.setPointerCapture(arr.pid); } catch (err) { /* sin captura */ } elegir3(arr.id, UI.cityV.sueloEn(e.clientX, e.clientY - 70)); } else if (Math.abs(dx) > 16) arr = null; return; }
    const g = UI.cityV.sueloEn(e.clientX, e.clientY - 70); if (g) mover3(g[0], g[1]); });
  addEventListener('pointerup', e => { if (!arr || e.pointerId !== arr.pid) return; const a = arr; arr = null; if (!a.activo && Math.hypot(e.clientX - a.x0, e.clientY - a.y0) < 12) { const pi = piezaInfo(a.id); if (pi.cerrada) lineaPon(pi.cerrada + '.', 'aviso malo', '', 5); else if (pi.enObra) lineaPon('La obra de la muralla ya está en marcha.', 'aviso', '', 5); else elegir3(a.id); } });
  addEventListener('pointercancel', e => { if (arr && e.pointerId === arr.pid && !arr.activo) arr = null; });
}
/* ganchos de CityView3D.bind: toque en el suelo, agarrar el fantasma y arrastrarlo */
const gestosCiudad = {
  onSuelo: (x, y) => { if (UI.modo3 === 'fundar') { if (UI.fundar && UI.fundar.fase === 'elegir') { const g = UI.cityV.sueloEn(x, y); if (g) moverFundar(g[0], g[1]); } return true; } if (UI.modo3 !== 'colocar') return false; const g = UI.cityV.sueloEn(x, y); if (g) mover3(g[0], g[1]); return true; },
  agarra: (x, y) => { if (UI.modo3 === 'fundar') { const F = UI.fundar; if (!F || F.fase !== 'elegir' || F.x === undefined) return null; const p = UI.cityV.aPantalla(F.x, F.z, 6); return Math.hypot(p.x - x, p.y - y) < 64 ? { dx: p.x - x, dy: p.y - y } : null; } const q = UI.sel3; if (UI.modo3 !== 'colocar' || !q || q.x === undefined) return null; const p = UI.cityV.aPantalla(q.x, q.z, 4); return Math.hypot(p.x - x, p.y - y) < 64 ? { dx: p.x - x, dy: p.y - y } : null; },
  onFicha: (x, y) => { const g = UI.cityV.sueloEn(x, y); if (g) { if (UI.modo3 === 'fundar') moverFundar(g[0], g[1]); else mover3(g[0], g[1]); } }
};
const bar = (label, v, max) => '<span>' + label + '</span><u><s style="width:' + Math.min(100, v / max * 100) + '%"></s></u>';
const avisoMo = (c, n) => { const z = Math.round(G.manoObraDe(c, Math.max(0, (c.pop || 0) - n)) * 100); return z < 100 ? '<div class="ds" style="color:#e0a030">Los campos quedarán al ' + z + ' % (+' + n + ')</div>' : ''; };
function viewArmy() {
  const s = S(), c = s.cities[UI.city], p = G.prod();
  let h = cityChips() + '<div class="sec">Guarnición de ' + D.CITIES[UI.city].n + ' · ' + G.men(c.units) + ' hombres</div>' + troopsHtml(c.units);
  h += '<div class="empty">' + popHtml(c) + '</div>';
  h += '<div class="empty">🌾 Consumo de todas tus tropas: ' + Math.round(p.upkeep) + ' grano/mes · 🪙 Mantenimiento: −' + Math.round(p.mant.total) + ' oro (edificios ' + Math.round(p.mant.edificios) + ', paga ' + Math.round(p.mant.tropas) + ') · ⚖️ Rutas: +' + Math.round(p.rutas) + ' oro · 🧱 Guardia urbana al defender: ' + (20 + 20 * (c.b.muralla || 0)) + '<br>Para enviarlas a la guerra, toca una ciudad vecina en el mapa.</div>';
  if (c.train.length) {
    h += '<div class="sec">En instrucción</div>';
    h += c.train.map(q => '<div class="row"><div style="display:flex;justify-content:space-between"><span>' + q.n + ' × ' + D.UNITS[q.u].n + '</span><span class="rem"></span></div><div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div>' + (plazoTxt(q) ? '<div class="plz' + (q.pausa ? ' pausa' : '') + '">' + plazoTxt(q) + '</div>' : '') + '</div>').join('');
  }
  h += '<div class="sec">Reclutar</div>';
  for (const k in D.UNITS) {
    const u = D.UNITS[k]; if (!u.cost) continue;
    const ok = G.unitOk(c, k), rb = Object.keys(u.req)[0], n = cohort(k), fe = (c.b[rb] || 0) >= u.req[rb] ? G.faltaEspecial('tropa', k) : null;
    h += '<div class="card ' + (ok ? '' : 'locked') + '"><div class="pt">' + pt(k) + '</div><div class="bd"><div class="tt">' + u.n + '</div><div class="ds">' + u.d + '</div>' + licHtml(u) +
      '<div class="bars">' + bar('Ataque', u.ratk || u.atk, 16) + bar('Defensa', u.def, 16) + bar('Moral', u.mor, 100) + bar('Velocidad', u.spd, 85) + '</div>' + costPlanHtml(G.planPago(G.unitCost(k, n), G.trainDur(c, k, n))) + (ok ? avisoMo(c, n) : '') + '</div>' +
      (ok ? '<div class="btns"><button class="btn" data-act="train" data-v="' + k + '" data-n="' + n + '" data-need=\'' + JSON.stringify(G.planPago(G.unitCost(k, n), G.trainDur(c, k, n)).primera) + '\'>+' + n + '</button><button class="btn" data-act="train" data-v="' + k + '" data-n="' + n * 3 + '" data-need=\'' + JSON.stringify(G.planPago(G.unitCost(k, n * 3), G.trainDur(c, k, n * 3)).primera) + '\'>+' + n * 3 + '</button></div>'
        : fe ? faltaBtn(fe) : '<button class="btn no">' + D.BUILD[rb].n + '<small>nivel ' + u.req[rb] + '</small></button>') + '</div>';
  }
  return h;
}
/* Senado (Q7) */
/* Saber (I5-C): edades e investigación. Solo pinta; las reglas están en G.inv* */
const SV_RAMAS = { ca: ['🌾', 'Campo'], of: ['⚒️', 'Oficios'], gu: ['⚔️', 'Guerra'], ma: ['⚓', 'Mar'] };
const pct = x => (x >= 1 ? '+' : '−') + Math.round(Math.abs(x - 1) * 100) + ' %';
function efTxt(ef) {
  const a = [], k = n => ef[n] !== undefined, r = n => Math.round(Math.abs(1 - ef[n]) * 100);
  if (k('abre')) a.push('abre la Escuela');
  if (k('obra')) a.push('obras ' + r('obra') + ' % más cortas');
  if (k('grano')) a.push('grano ' + r('grano') + ' % más');
  if (k('crece')) a.push(ef.crece >= 1 ? 'población crece ' + r('crece') + ' % más rápido' : 'población crece ' + r('crece') + ' % más despacio');
  if (k('impuestos')) a.push('impuestos ' + r('impuestos') + ' % más');
  if (k('oroCom')) a.push('comercio ' + r('oroCom') + ' % más oro');
  if (k('rutaRenta')) a.push('rutas ' + r('rutaRenta') + ' % más rentables');
  if (k('rutas')) a.push('+' + ef.rutas + ' ruta comercial');
  if (k('paga')) a.push('paga de tropas ' + r('paga') + ' % menor');
  if (k('instr')) a.push('instrucción ' + r('instr') + ' % más corta');
  if (k('popCap')) a.push('cabe ' + r('popCap') + ' % más gente');
  if (k('viajeTierra')) a.push('marchas por tierra ' + ef.viajeTierra.resta + ' meses menos en trayectos largos');
  if (k('viajeMar')) a.push('viajes por mar ' + ef.viajeMar.resta + ' meses menos en trayectos largos');
  if (k('inqMeses')) a.push('tierras conquistadas se calman ' + r('inqMeses') + ' % antes');
  if (k('hambre')) a.push('el hambre cuesta ' + r('hambre') + ' % menos');
  if (k('fel')) a.push('ánimo ' + (ef.fel > 0 ? '+' : '−') + Math.abs(ef.fel));
  if (k('pts')) a.push('+' + ef.pts + ' puntos de gloria');
  if (k('sinBien')) a.push('el puerto ya no pide su bien especial');
  if (k('cl')) a.push(ef.cl.escRenta ? 'esclavos rinden más, pero inquietan' : 'más ciudadanos, menos esclavos');
  if (k('favor')) a.push((ef.favor.senado > 0 ? '+' : '') + ef.favor.senado + ' Senado, ' + (ef.favor.pueblo > 0 ? '+' : '') + ef.favor.pueblo + ' pueblo');
  if (k('mor') || k('atk') || k('atkMar') || k('defMuro') || k('brecha') || k('herida')) {
    const g = []; if (k('atk')) g.push('ataque ' + pct(ef.atk)); if (k('atkMar')) g.push('ataque naval ' + pct(ef.atkMar)); if (k('mor')) g.push('moral +' + ef.mor);
    if (k('defMuro')) g.push('muros ' + Math.round(ef.defMuro * 100) + ' % más fuertes'); if (k('brecha')) g.push('abren brecha en muros'); if (k('herida')) g.push('menos heridos');
    a.push(g.join(', ') + ' (se aplica en la guerra más adelante)');
  }
  return a.join(' · ') || 'sin efecto directo';
}
function svChips(lista) { return '<div class="sv-chips">' + lista.map(q => '<span class="sv-ch ' + (q.ok ? 'ok' : 'no') + '">' + (q.ok ? '✔ ' : '✖ ') + esc(q.txt) + '</span>').join('') + '</div>'; }
function svCoste(id) { const c = G.invCoste(id); return '<div class="sv-chips">' + Object.keys(c).filter(r => c[r] > 0).map(r => '<span class="sv-ch ' + (G.disponible(r) >= c[r] ? 'ok' : 'no') + '">' + D.RES_ICON[r] + ' ' + fmt(c[r]) + '</span>').join('') + '</div>'; }
function svEureka(id) { const d = D.INVEST[id]; if (!d || !d.eureka || G.eurekaMul(id) <= 1) return ''; const ids = [].concat(d.eureka), mia = ids.find(c => G.myCities().includes(c)); return '<div class="sv-eu">💡 Eureka: posees ' + esc(D.CITIES[mia || ids[0]].n) + ', ritmo ×1,33</div>'; }
function svDetalle(id) {
  const d = D.INVEST[id], st = G.invEstado(id); let h = '<div class="sv-det"><p>' + esc(efTxt(d.ef)) + '</p>';
  if (st.e === 'hecha') return h + '<div class="sv-ok">✔ Ya lo sabes.</div></div>';
  h += svCoste(id) + '<div class="sv-m">' + months(G.invTiempo(id)) + ' de estudio</div>' + svEureka(id);
  if (st.e === 'ok') h += '<button class="btn" data-act="saber" data-v="' + id + '">Estudiar</button>';
  else h += '<div class="sv-no">' + esc(st.motivo) + '</div>';
  return h + '</div>';
}
function svTarjeta(id) {
  const d = D.INVEST[id], st = G.invEstado(id), ex = st.e === 'excl', hecha = st.e === 'hecha';
  const sub = hecha ? '✔ hecho' : st.e === 'curso' ? 'estudiando…' : st.e === 'ok' ? 'disponible' : ex ? '🔒 Excluida por ' + esc(D.INVEST[st.excl].n) : esc(st.motivo);
  return '<button class="sv-t ' + st.e + (UI.svSel === id ? ' sel' : '') + '" data-act="sabersel" data-v="' + id + '"><span class="sv-i">' + d.i + '</span><b>' + esc(d.n) + '</b><small>' + sub + '</small></button>';
}
function viewSaber() {
  const s = S(), V = G.invVista();
  let h = '<div class="acts"><button class="btn ghost" data-act="tab" data-v="imperio">← Volver al Imperio</button></div><div class="sv"><h2>📚 Saber</h2>';
  if (!V.nHechas && !V.cola) h += '<div class="sv-guia"><b>Primera vez</b><ol><li>Investiga Preceptores griegos.</li><li>Construye la Escuela y pon gente a estudiar desde su ficha.</li><li>En cada par elige uno: el otro se cierra.</li></ol></div>';
  h += '<div class="sv-ed"><b>Edad ' + ['I', 'II', 'III', 'IV'][V.edad - 1] + ' · ' + esc(V.edadNombre) + '</b>';
  if (V.sig) { h += '<small>Para la edad ' + ['II', 'III', 'IV'][V.edad - 1] + ' (' + esc(V.sig.n) + '):</small>' + svChips(V.sig.req) + svCoste(V.sig.id) + '<div class="sv-m">' + months(V.sig.tiempo) + '</div>';
    h += V.sig.estado.e === 'ok' ? '<button class="btn" data-act="saberedad">Subir de edad</button>' : V.sig.estado.e === 'curso' || V.sig.estado.e === 'cola' || V.sig.estado.e === 'req' ? '' : '<div class="sv-no">' + esc(V.sig.estado.motivo) + '</div>'; }
  else h += '<small>Has llegado a la última edad.</small>';
  h += '</div>';
  if (V.cola) { const vel = V.cola.vel || 1, t0 = s.t - V.cola.p / vel, t1 = s.t + (V.cola.P - V.cola.p) / vel;
    h += '<div class="sv-cola"><b>Estudiando: ' + esc(V.cola.n) + '</b><div class="prog" data-t0="' + t0 + '" data-t1="' + t1 + '"><i></i></div><span class="rem"></span>' + (V.cola.eureka ? '<div class="sv-eu">💡 Eureka: ritmo ×1,33</div>' : '') + (V.cola.sabios && V.cola.sabios.n > 0 ? '<div class="sv-eu">📜 Ritmo ×' + dec1(V.cola.sabios.vel).replace(/,0$/, '') + ' con tus ' + V.cola.sabios.n + ' sabios' + (V.cola.sabios.vel >= 0.9 * D.SABER.velMax ? ' · Tope útil alcanzado' : '') + '</div>' : '') + '</div>'; }
  h += '<div class="sv-ramas">' + Object.keys(SV_RAMAS).map(k => '<span class="sv-r">' + SV_RAMAS[k][0] + ' ' + SV_RAMAS[k][1] + '<b>' + V.ramas[k] + '</b></span>').join('') + '</div>';
  h += '<div class="sv-forja">⚔️ Guerra: forja, armas nivel ' + s.forja.armas + ', armaduras nivel ' + s.forja.armaduras + ' (se dirige desde la herrería de la ciudad).</div>';
  for (let e = 1; e <= 4; e++) {
    const ids = Object.keys(D.INVEST).filter(k => D.INVEST[k].edad === e); if (!ids.length) continue;
    h += '<div class="sv-fila' + (e > V.edad ? ' lejos' : '') + '"><div class="sv-eh">Edad ' + ['I', 'II', 'III', 'IV'][e - 1] + ' · ' + esc(D.SABER.edadNombres[e - 1]) + '</div>';
    const hecho = {}, bloques = [];
    for (const id of ids) { if (hecho[id]) continue; hecho[id] = 1; const g = D.INVEST[id].excl[0]; if (g && D.INVEST[g] && !hecho[g]) { hecho[g] = 1; bloques.push([id, g]); } else bloques.push([id]); }
    for (const b of bloques) {
      h += '<div class="sv-par' + (b.length > 1 ? ' dos' : '') + '">' + svTarjeta(b[0]) + (b.length > 1 ? '<i class="sv-o">o</i>' + svTarjeta(b[1]) : '') + '</div>';
      const sel = b.find(x => x === UI.svSel); if (sel) h += svDetalle(sel);
    }
    h += '</div>';
  }
  return h + '</div>';
}
function viewSenado() {
  const f = G.favor(), mi = G.misionActual(), mot = G.senadoMotivo();
  const barra = (n, v, c) => '<div class="sn-b"><span>' + n + '</span><div class="sn-bar"><i class="' + c + '" style="width:' + v + '%"></i></div><b>' + v + '</b></div>';
  const efecto = e => { const a = []; if (e.oro) a.push((e.oro > 0 ? '+' : '') + e.oro + ' de oro'); if (e.favorSenado) a.push((e.favorSenado > 0 ? '+' : '') + e.favorSenado + ' favor del Senado'); if (e.favorPueblo) a.push((e.favorPueblo > 0 ? '+' : '') + e.favorPueblo + ' favor del pueblo'); return a.join(', ') || 'nada'; };
  let o = '<div class="acts"><button class="btn ghost" data-act="tab" data-v="imperio">← Volver al Imperio</button></div><div class="sn"><h2>🏛️ El Senado</h2>' + barra('Senado', f.senado, 'sen') + barra('Pueblo', f.pueblo, 'pue') +
    '<p class="sn-ex">El pueblo sigue el ánimo de tus ciudades. El Senado sube con las misiones cumplidas y baja con las falladas o con el oro en rojo a fin de mes.</p>';
  if (mot) o += '<div class="sn-av">' + esc(mot) + '</div>';
  if (!mi) return o + '<div class="empty">El Senado no te pide nada por ahora.</div></div>';
  const m = mi.m, tot = Math.max(1, mi.t1 - mi.t0);
  o += '<div class="sec">Misión en curso</div><div class="card sn-mi"><div class="tt">' + esc(m.n) + '</div><div class="ds">' + esc(m.texto) + '</div>' +
    '<div class="sn-pz"><span>Plazo: quedan ' + mi.quedan + (mi.quedan === 1 ? ' mes' : ' meses') + '</span><div class="sn-bar"><i class="pla" style="width:' + Math.max(0, Math.min(100, mi.quedan / tot * 100)) + '%"></i></div></div>' +
    '<div class="sn-fa"><b>Qué falta</b> ' + esc(String(mi.falta)) + '</div><div class="sn-pr"><b>Premio</b> ' + efecto(m.premio || {}) + '</div><div class="sn-ca"><b>Si fallas</b> ' + efecto(m.castigo || {}) + '</div></div></div>';
  return o;
}
function viewHero() {
  const s = S(), h = s.hero, need = G.xpNeed(h.lvl);
  const where = h.wound > s.t ? '🩸 Herido — se recupera en ' + months(h.wound - s.t) : h.march ? '🚩 En marcha con el ejército' : '📍 En ' + D.CITIES[h.city].n;
  const SK = { mando: [D.GUERRA_ICON.espadas + ' Mando', '+4 % de ataque de tu ejército por nivel'], disc: [D.GUERRA_ICON.escudo + ' Disciplina', '+3 % de defensa y +4 de moral por nivel'], log: ['🧭 Logística', '+8 % de velocidad de marcha y +10 % de botín por nivel'] };
  let o = '<div class="head"><div class="pt">' + pt('general') + '</div><h2>' + esc(h.name) + '</h2><p>General de la República · Nivel ' + h.lvl + '</p>' + '<div class="xp"><i style="width:' + Math.min(100, h.xp / need * 100) + '%"></i></div><p>Experiencia ' + h.xp + ' / ' + need + '<br>' + where + '</p></div>';
  o += '<div class="sec">Habilidades · ' + h.pts + ' punto' + (h.pts === 1 ? '' : 's') + '</div>';
  for (const k in SK) o += '<div class="card"><div class="bd"><div class="tt">' + SK[k][0] + '<span class="lv">Nv ' + h.sk[k] + '</span></div><div class="ds">' + SK[k][1] + '</div></div><button class="btn ' + (h.pts > 0 && h.sk[k] < 10 ? 'gold' : 'no') + '" data-act="skill" data-v="' + k + '">＋</button></div>';
  return o + '<div class="empty">Tu general combate con su guardia de caballería cuando acompaña a un ejército o defiende la ciudad en la que está. Gana experiencia en cada batalla; si su guardia es aniquilada, quedará herido hasta dos años.</div>';
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
  let o = (window.CODICE ? '<div class="acts"><button class="btn gold" style="width:100%" data-act="codice" data-v="tropas">📖 Abrir el Códice</button></div>' : '') + '<div class="head"><h2>' + (G.regionId() === 'mediterraneo' ? 'Carthago delenda est' : 'Dominar ' + esc(G.region().n)) + '</h2><p>Conquista <b>' + D.CITIES[G.region().capitalRival].n + '</b> antes de que termine el año ' + G.region().hasta + ' a.C. Si Roma cae, la campaña termina.</p><p>⏳ Quedan <b>' + left + '</b> años · 🏛️ ' + G.myCities().length + '/' + G.ciudadesRegion().length + ' ciudades · ' + D.GUERRA_ICON.espadas + ' ' + s.stats.wins + '/' + s.stats.battles + ' batallas</p></div>';
  o += '<div class="sec">Línea del tiempo</div><div class="tl">' + D.EVENTS.map((e, i) => '<div class="' + (s.ev[i] ? 'done' : '') + '"' + (s.ev[i] ? ' data-act="ev" data-v="' + i + '"' : '') + '>' + e.y + ' a.C. — ' + (s.ev[i] ? esc(e.t) : '···') + '</div>').join('') + '</div>';
  o += '<div class="sec">Crónica</div>' + (s.log.length ? s.log.map(l => '<div class="logl ' + l.k + '"><small>' + G.yearOf(l.t) + ' a.C.</small>' + esc(l.x) + '</div>').join('') : '<div class="empty">Aún no ha ocurrido nada.</div>');
  return o + '<div class="acts" style="margin-top:16px"><button class="btn ghost" data-act="tomenu">Guardar y salir al menú</button></div>';
}

/* ---------- ficha de ciudad sobre el mapa ---------- */
/* ---------- CN5 · colonias: ficha del sitio y pantalla de fundar ---------- */
const TIPO_COL = { latina: 'Colonia latina', ciudadanos: 'Colonia de ciudadanos', maritima: 'Colonia marítima' };
function sheetSitio(id) {
  const s = S(), sh = $('sheet'), d = D.COLONIAS[id], k = s.colonias && s.colonias[id];
  if (!k || k.estado === 'fundada') { sh.hidden = true; UI.sheetKey = ''; return; }
  const orig = G.myCities().filter(o => D.CITIES[o] && s.cities[o].owner === 'roma');
  if (!UI.colDesde || orig.indexOf(UI.colDesde) < 0) UI.colDesde = orig.indexOf('roma') >= 0 ? 'roma' : orig[0];
  const mar = s.marches.find(m => m.colonos && m.to === id), v = k.estado === 'libre' && UI.colDesde ? G.puedeEnviarColonos(UI.colDesde, id) : { ok: false, motivo: '' };
  const key = 'sitio' + id + k.estado + UI.colDesde + orig.join() + v.ok + v.motivo + (mar ? (G.turnos ? G.turnosFaltan(mar) : Math.round((mar.t1 - s.t) * 2)) : '');
  if (key === UI.sheetKey && !sh.hidden) return; UI.sheetKey = key;
  const K = G.COLONOS, coste = D.POP_ICON + ' ' + K.pop + ' · ' + coste5({ grano: K.grano, oro: K.oro });
  let h = '<button class="x" data-act="unsel" aria-label="Cerrar la ficha">✕</button><h3>' + esc(d.n) + '<span class="tagf" style="background:#8a6a2c">' + (TIPO_COL[d.tipo] || 'Colonia') + '</span></h3><p>' + esc(d.h) + '</p>';
  h += '<span class="stat">📜 Fundada en ' + d.anio + ' a.C.</span><span class="stat">🏛️ ' + (k.estado === 'libre' ? 'Sitio libre' : k.estado === 'camino' ? 'Colonos en camino' : 'Colonos esperando') + '</span>';
  h += '<div class="acts">';
  if (k.estado === 'libre') {
    h += '<label class="orig"><span>Salen de</span><select id="col-desde" aria-label="Ciudad de origen de los colonos">' + orig.map(o => '<option value="' + o + '"' + (o === UI.colDesde ? ' selected' : '') + '>' + esc(D.CITIES[o].n) + ' · ' + months(G.travel(o, id, false)) + '</option>').join('') + '</select></label>';
    h += '<button class="btn gold" data-act="colonos" data-from="' + UI.colDesde + '" data-to="' + id + '"' + (v.ok ? '' : ' disabled') + '>Enviar colonos<small>' + coste + '</small></button>';
    if (!v.ok && v.motivo) h += '<div class="empty">' + esc(v.motivo) + '</div>';
  } else if (k.estado === 'camino') {
    h += '<div class="empty">Los colonos de ' + esc(k.desde && D.CITIES[k.desde] ? D.CITIES[k.desde].n : 'Roma') + ' llegan ' + (mar ? (G.turnos ? turnosTxt(G.turnosFaltan(mar)) : 'en ' + months(mar.t1 - s.t)) : 'pronto') + '.</div>';
  } else {
    h += '<button class="btn gold" data-act="fundar" data-v="' + id + '">Fundar ' + esc(d.n) + '</button>';
  }
  const st = sh.scrollTop; sh.innerHTML = h + '</div>'; sh.hidden = false; sh.scrollTop = st;
}
$('sheet').addEventListener('change', e => { if (e.target && e.target.id === 'col-desde') { UI.colDesde = e.target.value; UI.sheetKey = ''; renderSheet(); } });
/* Pantalla de fundar (reutilizable: I8 la llama igual). UI.abrirFundar(sitio, alFundar): sitio = id de D.COLONIAS con colonos llegados;
   alFundar(sitio) se llama cuando el arado ha terminado el surco (sin él se abre la colonia en la pestaña Ciudad). */
const ciudadE0 = G.ciudadE; G.ciudadE = id => (UI.fundar && id === UI.fundar.sitio && UI.fundar.E) ? UI.fundar.E : ciudadE0(id);   // la ciudad 3D lee la ciudad sin fundar por aquí
UI.abrirFundar = function (sitio, alFundar) {
  const s = S(); if (!s || !UI.cityV || !UI.cityV.listo) { toast('La vista de ciudad aún carga: prueba en unos segundos.', 'bad'); return false; }
  const E = G.ciudadPendiente(sitio); if (!E) { toast('Aún no han llegado los colonos.', 'bad'); return false; }
  if (UI.fundar) cerrarFundar(true);
  UI.fundar = { sitio, E, alFundar, x: undefined, z: undefined, vale: false, fase: 'elegir', stub: { obras: [], units: {} }, t0: 0 };
  UI.modo3 = 'fundar'; UI.modoT = performance.now(); UI.sel3 = null; UI.bsel = null; UI.vistas = false; UI.modalOpen = false;
  $('modal').hidden = true; $('sheet').hidden = true; $('zoom').hidden = true; $('ctop').hidden = true; $('view').hidden = true; $('hoja').hidden = true; $('citywrap').hidden = false; $('csheet').hidden = false; $('csheet').dataset.m = 'fundar';
  UI.cityV.resize(); UI.cityV.calor(G.mapaCalorFundar(sitio)); UI.cityV.update(UI.fundar.stub, sitio, null, performance.now() / 1000);
  UI.cityV.mirar(0, 0, 760, 0);
  let mejor = null; for (let x = -420; x <= 420; x += 60) for (let z = -420; z <= 420; z += 60) { const n = G.notaFundar(sitio, x, z); if (n && n.vale && (!mejor || n.nota > mejor.n)) mejor = { x, z, n: n.nota }; }
  if (mejor) UI.cityV.mirar(mejor.x, mejor.z, 620, 0);
  moverFundar(mejor ? mejor.x : 0, mejor ? mejor.z : 0); return true;
};
function pintaBotonesFundar() {
  const F = UI.fundar, si = $('b-si'), no = $('b-no'); if (!F || !si) return;
  const t = F.fase === 'elegir' ? (F.vale ? 'Fundar aquí' : 'Aquí no se puede fundar') : 'Trazando el surco…';
  if (si._t !== t) { si._t = t; si.textContent = t; } si.disabled = !F.vale || F.fase !== 'elegir'; no.textContent = 'Cancelar'; no.disabled = F.fase !== 'elegir';
}
function moverFundar(x, z) {
  const F = UI.fundar; if (!F || F.fase !== 'elegir') return; const n = G.notaFundar(F.sitio, x, z); if (!n) return;
  const col = n.vale ? Ciudad.color(n.nota) : 'rojo'; Object.assign(F, { x, z, vale: !!n.vale, nota: n.nota });
  UI.cityV.ponerGroma({ x, z, color: col });
  lineaPon((n.razones && n.razones.length ? n.razones.join(' · ') : n.vale ? 'Aquí puede nacer la ciudad.' : 'Aquí no se puede fundar.'), 'sitio ' + col, NOTA3[col]); pintaBotonesFundar();
}
function fundarAqui() {
  const F = UI.fundar; if (!F || F.fase !== 'elegir' || !F.vale) return;
  const r = G.fundarColonia(F.sitio, F.x, F.z);
  if (!r.ok) { lineaPon(r.motivo, 'aviso malo', '', 4); toast(r.motivo, 'bad'); return; }
  F.fase = 'arando'; F.t0 = performance.now(); UI.cityV.calor(null); UI.cityV.ponerGroma(null); UI.cityV.surcar();
  lineaPon('El arado traza el surco sagrado: dentro nacerá la ciudad.', 'aviso'); $('csheet').hidden = true; pintaBotonesFundar();
}
function fundarCuadro(now) {
  const F = UI.fundar; if (!F || !UI.cityV) return;
  if (F.fase === 'arando' && now - F.t0 > 7500) { const sitio = F.sitio, cb = F.alFundar; cerrarFundar(true); UI.city = sitio; if (cb) cb(sitio); else setTab('city'); return; }
  UI.cityV.update(F.stub, F.sitio, null, now / 1000); pintaBotonesFundar();
}
function cerrarFundar(sinTab) {
  const F = UI.fundar; UI.fundar = null; UI.modo3 = 'mirar'; UI.sel3 = null;
  if (UI.cityV) { UI.cityV.ponerGroma(null); UI.cityV.calor(null); }
  $('csheet').dataset.m = ''; lineaPon(''); if (!sinTab) setTab(UI.tab);
}

function renderSheet() {
  if (UI.fundar) { $('sheet').hidden = true; UI.sheetKey = ''; return; }      // la pantalla de fundar no lleva ficha encima
  const s = S(), sh = $('sheet'); if (!s || !UI.sel || UI.tab !== 'map') { sh.hidden = true; UI.sheetKey = ''; return; }
  if (UI.sel && !s.cities[UI.sel] && D.COLONIAS && D.COLONIAS[UI.sel]) { sheetSitio(UI.sel); return; }
  if (!s.cities[UI.sel]) { sh.hidden = true; UI.sheetKey = ''; return; }
  const id = UI.sel, c = s.cities[id], d = D.CITIES[id], f = D.FACTIONS[c.owner], mine = c.owner === 'roma';
  const src = G.neighbors(id).filter(n => s.cities[n].owner === 'roma'), inc = s.marches.filter(m => m.to === id);
  const key = id + c.owner + G.rutasAbiertas().length + JSON.stringify(c.units) + src.join() + inc.map(m => m.id + (G.turnos ? G.turnosFaltan(m) : Math.round((m.t1 - s.t) * 2))).join();
  if (key === UI.sheetKey && !sh.hidden) return; UI.sheetKey = key;
  let h = '<button class="x" data-act="unsel">✕</button><h3>' + d.n + '<span class="tagf" style="background:' + f.col + '">' + f.n + '</span></h3><p>' + esc(d.h) + '</p>';
  h += '<span class="stat">🧱 Muralla ' + (c.b.muralla || 0) + '</span><span class="stat">💰 ' + '★'.repeat(c.w || d.w) + '</span><span class="stat">⚔ Fuerza ' + G.power(c.units) + '</span>' + (D.ESPECIAL[d.esp] ? '<span class="stat">Bien: ' + D.ESPECIAL[d.esp].i + ' ' + D.ESPECIAL[d.esp].n + '</span>' : '');
  { const tr = G.rutasAbiertas().find(r => r.b === id && r.f !== 'roma'); if (tr) h += '<span class="stat">⚖️ Tratado de comercio con Roma</span>'; }
  h += '<div class="units">' + (Object.keys(c.units).filter(k => c.units[k] > 0).map(k => '<span>' + D.UNITS[k].n + ' <b>' + c.units[k] + '</b></span>').join('') || '<span>Sin guarnición</span>') + '</div>';
  if (inc.length) h += inc.map(m => '<div class="stat" style="color:' + (m.owner === 'roma' ? 'var(--good)' : 'var(--bad)') + '">' + (m.owner === 'roma' ? '🚩 Tus tropas llegan' : '⚠️ ' + D.FACTIONS[m.owner].n + ' (' + G.men(m.units) + ') llega') + ' ' + (G.turnos ? turnosTxt(G.turnosFaltan(m)) : 'en ' + months(m.t1 - s.t)) + '</div>').join('');
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
  let h = '<div class="yr">DESDE ' + D.CITIES[from].n.toUpperCase() + ' · ' + (G.turnos ? ('LLEGAN ' + turnosTxt(Math.max(1, Math.ceil((G.llegada(s.t + G.travel(from, to, false)) - s.t) / D.TURNO_MESES - 1e-9)))).toUpperCase() : months(G.travel(from, to, false)).toUpperCase()) + '</div><h2>' + (own ? 'Reforzar ' : 'Atacar ') + D.CITIES[to].n + '</h2>';
  if (!ks.length && !hero) h += '<p>No hay tropas en ' + D.CITIES[from].n + '. Recluta en la pestaña Ejército.</p>';
  h += ks.map(k => '<div class="pick"><div class="pt">' + pt(k) + '</div><div><label><span>' + D.UNITS[k].n + '</span><span><b id="pv-' + k + '">' + c.units[k] + '</b> / ' + c.units[k] + '</span></label><input type="range" min="0" max="' + c.units[k] + '" value="' + c.units[k] + '" data-k="' + k + '"></div></div>').join('');
  if (hero) h += '<label class="chk"><input type="checkbox" id="pk-hero" checked> ' + D.GUERRA_ICON.aguila + ' El general acompaña al ejército</label>';
  if (!own) { const bo = G.botin(to); h += '<label class="chk"><input type="checkbox" id="pk-saq"> 💰 Solo saquear, sin conquistar: las tropas vuelven</label><div class="pw">Botín: ' + D.RES.map(r => bo[r] + ' ' + D.RES_ICON[r]).join(' · ') + '</div>'; }
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
  if (!info.cfg.terreno) info.cfg.terreno = window.Battle.terrenoDe(info.city, info.cfg.seed);   // campo tipo de la ciudad (o por semilla)
  modal('<div class="yr">' + G.yearOf(S().t) + ' A.C.</div><h2>' + (info.kind === 'attack' ? 'Asalto a ' : 'Defensa de ') + d.n + '</h2>' +
    '<div class="vs">' + sideHtml(info.cfg.sides[0]) + sideHtml(info.cfg.sides[1]) + '</div>' +
    '<div class="pw">Fuerza: ' + G.power(info.cfg.sides[0].units) + ' contra ' + G.power(info.cfg.sides[1].units) + ' · Muralla del defensor: nivel ' + info.cfg.wall + '</div>' +
    '<div class="acts"><button class="btn" data-act="bview">' + D.GUERRA_ICON.espadas + ' Dirigir la batalla</button><button class="btn ghost" data-act="bquick">Resolver</button></div>', true);
}
// N15: la dificultad ya no se elige; el motor la explica por contexto (b.dif = { nivel, texto, factores:[{n,txt,v}] })
function rivalHtml(b) {
  const s1 = b.cfg.sides[1], ca = window.Battle.CARACTER[b.ia ? b.ia.car : window.Battle.caracterDe(b.cfg)], d = b.dif, pr = b.progresoObjetivo ? b.progresoObjetivo() : null;
  const fac = d && d.factores && d.factores.length ? '<div class="fac" hidden>' + d.factores.map(f => '<div><i class="' + (f.v > 0 ? 'up' : f.v < 0 ? 'dn' : '') + '">' + (f.v > 0 ? '▲' : f.v < 0 ? '▼' : '•') + '</i> ' + esc(f.txt) + '</div>').join('') + '</div>' : '';
  return '<div class="rv"' + (fac ? ' data-act="bfac" role="button"' : '') + '>Rival: <b>' + esc(s1.gen && s1.gen.n || s1.name) + '</b> · ' + esc(ca.n.toLowerCase()) + (d && d.texto ? ' · ' + esc(d.texto.replace(/^Rival:\s*/, '')) : '') + (fac ? ' ▾' : '') + '</div>' + fac +
    (pr && pr.texto ? '<div class="ob">Objetivo: ' + esc(pr.texto) + '</div>' : '');
}
// objetivo de la batalla: una línea fina bajo el cabezal con barra mínima
function objetivoHud(B) {
  const b = B.b, pr = b.cfg.objetivo && b.progresoObjetivo ? b.progresoObjetivo() : null; let el = $('bobj');
  if (!pr || !pr.texto || b.fase === 'despliegue') { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'bobj'; $('battle').appendChild(el); }
  const k = pr.texto + '|' + Math.round((pr.frac || 0) * 50); if (el.dataset.k !== k) { el.dataset.k = k; el.innerHTML = '<span>' + esc(pr.texto) + '</span><i><u style="width:' + Math.round(Math.max(0, Math.min(1, pr.frac || 0)) * 100) + '%"></u></i>'; }
}
function startBattle() {
  closeModal();
  $('battle').hidden = false;
  const cfg = Object.assign({}, UI.binfo.cfg, { fh: 1000, despliegue: true, rondas: true, dificultad: 'normal' }), b = new window.Battle(cfg), B = { b: b, speed: 1, paused: false, acc: 0, endT: 0 };
  try { B.view = new BattleView3D($('bfield'), b, { aviso: (t, k) => toast(t, k), cards: $('bcards'), speed: () => (B.paused || b.over ? 0 : B.speed) }); }
  catch (e) { // sin WebGL: vista 2D de reserva
    console.warn('WebGL no disponible, usando vista 2D', e);
    const cv = document.createElement('canvas'); cv.className = 'c2d'; $('bfield').appendChild(cv); B.view = new window.BattleView(cv, b); B.flat = cv;
    cv.addEventListener('pointerdown', ev => { if (!b.over) B.view.down(ev); });
    cv.addEventListener('pointermove', ev => B.view.move(ev)); cv.addEventListener('pointerup', ev => B.view.up(ev)); cv.addEventListener('pointercancel', ev => B.view.up(ev));
  }
  UI.battle = B;
  { const dv = document.createElement('div'); dv.id = 'bdif'; dv.innerHTML = rivalHtml(b); $('battle').appendChild(dv); }
  montaMandoL1(B);
  $('bauto').classList.add('on'); $('bspeed').textContent = 'x1'; $('bpause').textContent = 'II';
  // despliegue: la barra de mando cambia hasta pulsar «Empezar batalla»
  B.barra = $('bctl').innerHTML; B.hint = $('bhint').innerHTML;
  // 6 formaciones + «Empezar batalla»: en 390 px no caben en una fila, así que la barra se parte en dos filas
  $('bctl').style.flexWrap = 'wrap'; $('bctl').classList.add('desp'); $('battle').classList.add('desp');
  $('bctl').innerHTML = Battle.PLANTILLAS.map(p => '<button style="flex:1 1 11%;min-width:0;padding:0 2px;font-size:12px;white-space:nowrap" data-act="bform" data-v="' + p[0] + '"' + (p[0] === 'clasica' ? ' class="on"' : '') + '>' + (Battle.CORTOS[p[0]] || p[1]) + '</button>').join('') + '<button style="flex:2 1 18%;padding:0 4px" data-act="bstart" class="on">Empezar batalla</button>';
  $('bhint').textContent = 'Coloca tus tropas: arrastra un regimiento por el campo, o toca uno y luego el campo. Después, Empezar batalla.' + (b.tr && !b.tr.plano ? ' Campo: ' + b.tr.nombre.toLowerCase() + ' (contorno en tu zona: ocre = colina, verde = bosque).' : ' Campo: llano.'); $('bhint').style.opacity = 1;
}
// repone la barra de mando y el texto de ayuda de antes del despliegue
function reponerBarra(B) { if (!B || B.barra == null) return; const dv = $('bdif'); if (dv) dv.remove(); $('bctl').style.flexWrap = ''; $('bctl').classList.remove('desp'); $('battle').classList.remove('desp'); $('bctl').innerHTML = B.barra; $('bhint').innerHTML = B.hint; B.barra = null; }
function stopBattle() { const B = UI.battle; if (B) { const dv = $('bdif'); if (dv) dv.remove(); const ob = $('bobj'); if (ob) ob.remove(); const gs = $('bgesto'); if (gs) gs.remove(); $('battle').classList.remove('ronda'); const pn = $('bpanel'); if (pn) pn.remove(); quitaMandoL1(B); reponerBarra(B); if (B.view.dispose) B.view.dispose(); if (B.flat) B.flat.remove(); } $('battle').hidden = true; UI.battle = null; UI.binfo = null; if (UI.map) UI.map.resize(); }
// L1: mando con el dedo: botón dorado de orden recomendada, minimapa táctil y grupos por clase
const GRUPOS_L1 = [['inf', 'Infantería', ['inf', 'spear', 'ele']], ['rng', 'Tiradores', ['rng']], ['cav', 'Caballería', ['cav', 'gen']]];
function montaMandoL1(B) {
  if (!B.view || !B.view.ordenRecomendada) return; // vista 2D de reserva: sin esto
  const bt = $('battle'), mk = (tag, id, cls, html) => { const e = document.createElement(tag); e.id = id; e.className = cls; e.innerHTML = html || ''; bt.appendChild(e); return e; };
  const oro = mk('button', 'bgold', 'l1 off', '<i>⚔</i><b>Orden</b>'); oro.dataset.act = 'bgold'; oro.disabled = true;
  const mini = mk('canvas', 'bmini', 'l1'), anch = Math.max(66, Math.min(120, Math.round(60 * B.b.W / B.b.H))); mini.width = anch * 2; mini.height = 120; mini.style.width = anch + 'px';   // el recuadro sigue la proporción del campo (N14)
  const grp = mk('div', 'bgrp', 'l1', GRUPOS_L1.map(g => '<button data-act="bgrp" data-v="' + g[0] + '">' + g[1] + '</button>').join(''));
  mini.addEventListener('pointerdown', ev => {
    const rc = mini.getBoundingClientRect(), b = B.b, x = (ev.clientX - rc.left) / rc.width * b.W, y = (ev.clientY - rc.top) / rc.height * b.H;
    if (b.fase !== 'despliegue' && B.view.moverSel(x, y)) toast('Tropas en marcha.'); else B.view.centrarEn(x, y); ev.stopPropagation();
  });
  mini.addEventListener('pointermove', ev => { if (ev.buttons !== 1 || B.view.sel.size && B.b.fase !== 'despliegue') return; const rc = mini.getBoundingClientRect(); B.view.centrarEn((ev.clientX - rc.left) / rc.width * B.b.W, (ev.clientY - rc.top) / rc.height * B.b.H); ev.stopPropagation(); });
  const alas = mk('div', 'balas', 'l1', ALAS.map(a => '<button data-act="bala" data-v="' + a[0] + '">' + a[1] + '<small></small></button>').join(''));
  alas.querySelectorAll('button').forEach(bn => {   // toque corto: elige el ala; toque largo: mete en ella los regimientos elegidos (o los saca si ya están)
    let tm = null, largo = false;
    bn.addEventListener('pointerdown', () => { largo = false; clearTimeout(tm); tm = setTimeout(() => { largo = true; const id = bn.dataset.v, v = B.view; const n = v.moverAAla(id); toast(n ? n + (n === 1 ? ' regimiento pasa' : ' regimientos pasan') + ' al ala «' + bn.firstChild.textContent + '».' : 'Elige antes un regimiento y mantén pulsada el ala.'); }, 550); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) bn.addEventListener(ev, () => clearTimeout(tm));
    bn.addEventListener('click', ev => { if (largo) { ev.stopPropagation(); ev.preventDefault(); largo = false; } });
    bn.addEventListener('contextmenu', ev => ev.preventDefault());
  });
  B.l1 = { oro: oro, mini: mini, grp: grp, alas: alas, txt: '' };
}
function quitaMandoL1(B) { if (B.l1) { for (const k of ['oro', 'mini', 'grp', 'alas']) B.l1[k].remove(); B.l1 = null; } }
function actualizaL1(B) {
  const L = B.l1; if (!L) return; const v = B.view, b = B.b, desp = b.fase === 'despliegue';
  const sel = [...v.sel].filter(r => r.st === 'ok'), rec = !desp && sel.length ? recomendada(sel[0], b) : null;
  const txt = rec ? rec.ic + '|' + rec.txt : ''; if (txt !== L.txt) { L.txt = txt; L.oro.disabled = !rec; L.oro.classList.toggle('off', !rec); L.oro.innerHTML = '<i>' + (rec ? rec.ic : '⚔') + '</i><b>' + (rec ? rec.txt : 'Orden') + '</b>'; }
  const act = v.alaActiva ? v.alaActiva() : null;
  L.alas.querySelectorAll('button').forEach(bn => { const m = v.miembros(bn.dataset.v).length; bn.classList.toggle('on', act === bn.dataset.v); bn.classList.toggle('vacia', !m); const sm = bn.lastChild; if (sm.textContent !== String(m)) sm.textContent = m; });
  const x = L.mini.getContext('2d'), W = L.mini.width, H = L.mini.height; x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(12,16,22,.7)'; x.fillRect(0, 0, W, H);
  const kx = W / b.W, ky = H / b.H; window.Battle.pintaTerreno(x, b, kx, ky);
  for (const r of b.regs) { if (r.st !== 'ok') continue; const px = r.x * kx, py = r.y * ky; x.fillStyle = b.cfg.sides[r.side].col; x.beginPath(); x.arc(px, py, r.u.cls === 'gen' ? 5 : 4, 0, 7); x.fill(); if (v.sel.has(r)) { x.strokeStyle = '#f2cf72'; x.lineWidth = 2.5; x.beginPath(); x.arc(px, py, 8, 0, 7); x.stroke(); } }
  if (v.vista) { const p = v.vista(); x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); p.forEach((q, i) => i ? x.lineTo(q[0] * kx, q[1] * ky) : x.moveTo(q[0] * kx, q[1] * ky)); x.closePath(); x.stroke(); }   // lo que ve la cámara
  x.strokeStyle = '#e3b54a99'; x.lineWidth = 2; x.strokeRect(1, 1, W - 2, H - 2);
}
function battleHud() {
  if (rondaHud()) return;
  const b = UI.battle.b, s0 = b.cfg.sides[0], s1 = b.cfg.sides[1], n0 = b.men(0), n1 = b.men(1), mo = sd => { let a = 0, t = 0; for (const r of b.regs) if (r.side === sd && r.st === 'ok') { a += r.mor / r.morMax * r.men; t += r.men; } return t ? Math.round(a / t * 100) : 0; }, m0 = mo(0), m1 = mo(1), key = n0 + '|' + n1 + '|' + m0 + '|' + m1; actualizaL1(UI.battle); if (key === UI.hudKey) return; UI.hudKey = key;
  $('bhud').innerHTML = '<div class="nm"><span style="color:#ff9c8c">' + esc(s0.name) + ' · ' + n0 + ' <small>moral ' + m0 + '%</small></span><span><small>moral ' + m1 + '%</small> ' + n1 + ' · ' + esc(s1.name) + '</span></div><div class="bar"><i style="width:' + n0 / Math.max(1, n0 + n1) * 100 + '%;background:' + s0.col + '"></i><i style="flex:1;background:' + s1.col + '"></i></div>';
}
/* ---------- rondas (N2): plan, ejecución e informe ---------- */
// iconos de línea de las órdenes (trazo, sin relleno)
const ICO_ORD = {
  aguantar: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 7.8 7.5 9.5 4.3-1.7 7.5-4.9 7.5-9.5V6z"/>',
  avanzar: '<path d="m6 12 6-6 6 6M6 19l6-6 6 6"/>',
  cargar: '<path d="M5 19 19 5M10 5h9v9"/><path d="M5 14l5 5"/>',
  hostigar: '<path d="M4 17c3-9 8-9 14-6M14 6l5 5-6 3"/><path d="M4 21h4"/>',
  relevar: '<path d="M4 8h14m-4-4 4 4-4 4M20 16H6m4-4-4 4 4 4"/>',
  retirarse: '<path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 8h-3"/>',
  sig: '<path d="m9 5 7 7-7 7"/>',
  mas: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'
};
const icoOrd = k => '<svg class="io" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO_ORD[k] + '</svg>';
// fila única de botones de abajo, según el momento de la ronda
function filaRonda(B) {
  const C = window.Battle.CONDICIONES, sel = condSel(B), act = c => sel.length && sel.every(r => (r.order.cond || '') === c);
  switch (B.modo) {
    case 'ejec': return '<button data-act="bpause" id="bpause">' + (B.paused ? '▶' : 'II') + '</button><button data-act="bspeed" id="bspeed">x' + B.speed + '</button><button data-act="bcam">Cámara</button><button data-act="bskip">Resolver</button>';
    case 'informe': return '<button data-act="brepetir">Ver otra vez</button><button class="go on" data-act="bseguir">Seguir planeando</button>';
    case 'cond': return Object.keys(C).map(k => '<button data-act="bcnd" data-v="' + k + '"' + (act(k) ? ' class="on"' : '') + '>' + C[k] + '</button>').join('') + '<button data-act="bcnd" data-v="">Sin condición</button><button class="on" data-act="bcondok">Listo</button>';
    default: {
      const ps = B.view && B.view.propios ? B.view.propios() : [], tp = ps.length && ps.every(r => tipoOrden(r) === tipoOrden(ps[0])) ? tipoOrden(ps[0]) : null;
      return '<div class="ord' + (ps.length ? '' : ' sinsel') + '">' + TIPOS_ORDEN.map(t => '<button class="ob o-' + t[0] + (tp === t[0] ? ' on' : '') + '" data-act="bord" data-v="' + t[0] + '">' + icoOrd(t[0]) + '<span>' + t[1] + '</span></button>').join('') + '</div>' +
        '<button class="mini" data-act="bsig" aria-label="Siguiente regimiento">' + icoOrd('sig') + '<span>Siguiente</span></button><button class="mini' + (B.mas ? ' on' : '') + '" data-act="bmas" aria-label="Más opciones">' + icoOrd('mas') + '<span>Más</span></button>' + chipMando(B) + '<button class="go on" data-act="bejec">Ver la ronda</button>';
    }
  }
}
// N5: puntos de mando junto al botón de ejecutar (rojo si te pasas) y fila de cartas de táctica
const CARTAS_TXT = { arenga: ['Arenga', 'Sube la moral (+15 %) de las tropas dentro del radio de mando, en la ronda siguiente'], paso: ['Paso doble', 'Velocidad x1,25 la ronda siguiente, dentro del radio de mando'], cerrada: ['Cerrada', 'Reciben x0,85 de daño la ronda siguiente, dentro del radio de mando'] };
function chipMando(B) { const m = B.b.mandoPuntos(); return '<span class="mando' + (m.usados > m.max ? ' mal' : '') + '" title="Cada orden activa gasta un punto; Aguantar no gasta">Mando<b>' + m.usados + '/' + m.max + '</b></span>'; }
function filaCartas(B) {
  const b = B.b, ok = !!b.generalVivo(0) && b.cartaRonda !== b.ronda;
  return Object.keys(CARTAS_TXT).map(id => { const libre = b.cartas.indexOf(id) >= 0, use = libre && ok; return '<button class="carta' + (use ? '' : ' off') + (b.cartaPlan === id ? ' on' : '') + '" data-act="bcarta" data-v="' + id + '" title="' + CARTAS_TXT[id][1] + '">' + CARTAS_TXT[id][0] + '</button>'; }).join('');
}
function condSel(B) { return B.view && B.view.sel ? [...B.view.sel].filter(r => r.st === 'ok' && r.side === 0 && r.order && r.order.k !== 'quieto') : []; }
function rondaModo(B, m) {
  B.modo = m; B.filaKey = ''; B.mas = false; B.atajoTx = null; B.formVer = null; if (B.view && B.view.ponTPrev) { B.view.ponTPrev(0); B.view.activaFrente && B.view.activaFrente(false); } B.pmin = false; B.panelTx = null; if (m === 'plan' || m === 'informe') B.paused = false;
  if (m !== 'plan') B.choque = null;
}
function textoRonda(B) {
  const b = B.b, v = B.view, C = window.Battle.CONDICIONES;
  if (B.modo === 'ejec') return '';
  if (B.modo === 'informe') return '<div class="pt" data-act="bpmin">Lo que pasó · ronda ' + (b.ronda - 1) + '<i></i></div><ul>' + b.hechos.map(h => '<li>' + esc(h) + '</li>').join('') + '</ul>';
  if (B.modo === 'cond') { const sel = condSel(B); if (!sel.length) return 'Elige un regimiento con orden y vuelve a pulsar «Más» y «Condición».'; const r = sel[0], c = r.order.cond; return '<b>' + esc(r.name || r.u.n) + (sel.length > 1 ? ' y ' + (sel.length - 1) + ' más' : '') + '</b>: ' + (c ? esc(C[c]) + '.' : 'sin condición. Elige una (solo una por orden).'); }
  if (v && v.modoFrente) return '<div class="pt" data-act="bfrente">Frente<i></i></div>Arrastra el dedo sobre el campo, de un extremo a otro del frente. Pulsa aquí para cancelar.';
  if (B.mas === 'form' || B.mas === 'atajos' || B.mas === 'tiempo') return panelN7(B);
  if (B.mas) { const w = B.b, ex = (c, a, t) => c ? '<button data-act="' + a + '">' + t + '</button>' : ''; return '<div class="pt" data-act="bmas">Más<i></i></div><div class="pbt p3"><button data-act="bcond">Condición</button><button data-act="bchoque">Prever choque</button><button data-act="ball">Todas</button><button data-act="bskip">Resolver</button><button data-act="bsonido">' + (window.Sonido && !window.Sonido.activo ? '🔇 Sonido apagado' : '🔊 Sonido activado') + '</button>' + ex(w.formacionesPosibles, 'bformas', 'Formación') + ex(w.fijarFrente && B.view.activaFrente, 'bfrente', 'Frente') + ex(w.agrupar, 'bjuntos', 'Marchar juntos') + ex(w.relevarLinea, 'brelevar', 'Relevar línea') + ex(w.atajo, 'batajos', 'Atajos') + ex(w.prevision && B.view.ponTPrev, 'btiempo', 'Ver futuro') + '</div>'; }
  if (B.choque && performance.now() < B.choqueT) return B.choque;
  if (condSel(B).length) return 'Orden dada. En «Más» puedes añadirle una condición.';
  if (v && v.propios && v.propios().length) return 'Elige una orden abajo o dibuja el recorrido sobre el campo. Toca otro estandarte para cambiar de regimiento.';
  if (v && v.haySombras) return 'Las siluetas marcan dónde acabarían tus tropas si el enemigo se queda quieto. <b>El enemigo puede moverse.</b>';
  return 'Toca un estandarte (o los soldados) para elegir un regimiento.';
}
/* ---------- N7: formaciones, atajos y fantasmas con tiempo (paneles de «Más») ---------- */
const ATAJOS = [['testudo', 'Testudo'], ['carga', 'Carga'], ['retirada', 'Retirada'], ['refuerzo', 'Refuerzo']];
function panelN7(B) {
  const b = B.b, v = B.view, F = window.Battle.FORM || {}, sel = v && v.propios ? v.propios() : [], volver = '<div class="pt" data-act="bmas">';
  if (B.mas === 'atajos') return volver + 'Atajos<i></i></div><div class="pbt p4">' + ATAJOS.map(a => '<button data-act="bataj" data-v="' + a[0] + '">' + a[1] + '</button>').join('') + '</div>' + (B.atajoTx ? '<div class="fi">' + esc(B.atajoTx) + '</div>' : '<div class="fi">Actúan sobre lo elegido (o todo tu ejército si no hay nada elegido).</div>');
  if (B.mas === 'tiempo') { const i = [0, 10, 20, 30].indexOf(v && v.tPrev || 0); return volver + 'Ver futuro<i></i></div><input id="btslider" type="range" min="0" max="3" step="1" value="' + Math.max(0, i) + '"><div class="tk"><span>Final</span><span>10 s</span><span>20 s</span><span>30 s</span></div><div class="fi">Dónde estarían tus tropas pasado ese tiempo, si el enemigo se queda quieto.</div>'; }
  if (!sel.length) return volver + 'Formación<i></i></div>Elige antes un regimiento: toca su estandarte.';
  let ks = null; for (const r of sel) { const k = b.formacionesPosibles ? (b.formacionesPosibles(r) || []) : []; ks = ks ? ks.filter(x => k.indexOf(x) >= 0) : k.slice(); }
  ks = ks || []; const act = k => sel.every(r => (r.form || 'normal') === k), cur = ks.find(act) || B.formVer, d = cur && F[cur];
  return volver + 'Formación · ' + esc(sel[0].name || sel[0].u.n) + (sel.length > 1 ? ' +' + (sel.length - 1) : '') + '<i></i></div><div class="pbt pf">' + ks.map(k => '<button data-act="bformsel" data-v="' + k + '"' + (act(k) ? ' class="on"' : '') + '>' + esc(F[k] ? F[k].n : k) + '</button>').join('') + '</div>' +
    (d ? '<div class="fi"><b>' + esc(d.n) + '</b>: gana ' + esc(d.gana || '—') + ' · pierde ' + esc(d.pierde || '—') + '</div>' : '<div class="fi">Pulsa una formación para ver lo que da y lo que quita.</div>');
}
function entraPlan(B) {
  const bt = $('battle'); bt.classList.add('ronda');
  if (!$('bpanel')) { const pn = document.createElement('div'); pn.id = 'bpanel'; bt.appendChild(pn); }
  if (B.view && B.view.cycleCam && !B.camPlan) { B.camPlan = true; B.view.cycleCam(); const c = B.view.c; if (c) { c.dist = 270; c.z = B.view.halfD * 0.1; } }   // vista alta para planear
  rondaModo(B, 'plan');
}
// una sola línea arriba: ronda y momento, fuerzas de los dos bandos. Devuelve true si pintó la del modo rondas.
function rondaHud() {
  const B = UI.battle, b = B.b; if (!b.rondas || !B.modo) return false;
  actualizaL1(B);
  { let gs = $('bgesto'); if (!gs) { gs = document.createElement('div'); gs.id = 'bgesto'; $('battle').appendChild(gs); } const tg = B.modo === 'ejec' && b.gesto ? '⚑ ' + b.gesto : ''; if (gs.textContent !== tg) gs.textContent = tg; gs.style.display = tg ? '' : 'none'; }
  if (!b.over) {
    if (b.fase === 'ejecucion' && B.modo !== 'ejec') rondaModo(B, 'ejec');
    else if (b.fase === 'plan' && B.modo === 'ejec') rondaModo(B, 'informe');
  }
  const s0 = b.cfg.sides[0], s1 = b.cfg.sides[1], n0 = b.men(0), n1 = b.men(1), ej = b.fase === 'ejecucion';
  const seg = Math.max(0, Math.ceil(window.Battle.RONDA_SEG - b.tRonda)), tit = ej ? (b.repite ? 'Repetición' : 'Ronda ' + b.ronda) + ' · ' + seg + ' s' : 'Ronda ' + b.ronda + ' · Plan';
  const key = tit + '|' + n0 + '|' + n1; if (key !== UI.hudKey) { UI.hudKey = key;
    $('bhud').innerHTML = '<div class="r1"><b class="rt">' + tit + '</b><span class="n0" style="color:#ff9c8c">' + esc(s0.name) + ' ' + n0 + '</span><div class="bar"><i style="width:' + n0 / Math.max(1, n0 + n1) * 100 + '%;background:' + s0.col + '"></i><i style="flex:1;background:' + s1.col + '"></i></div><span class="n1">' + n1 + ' ' + esc(s1.name) + '</span><span class="alj"><button data-act="bsalto" data-v="-1">Ala izq.</button><button data-act="bsalto" data-v="0">Centro</button><button data-act="bsalto" data-v="1">Ala der.</button></span></div>'; }
  { let cr = $('bcartas'); if (!cr) { cr = document.createElement('div'); cr.id = 'bcartas'; $('bctl').parentNode.insertBefore(cr, $('bctl')); }
    const ver = B.modo === 'plan' && !b.over, ck = ver ? filaCartas(B) : ''; if (cr.dataset.k !== ck) { cr.dataset.k = ck; cr.innerHTML = ck; } cr.style.display = ver ? '' : 'none';
    if (ver && B.avisoGen !== b.ronda && b.genDown[0]) { B.avisoGen = b.ronda; toast('Cayó tu general: solo ' + b.mandoPuntos().max + ' órdenes por ronda.', 'bad'); } }
  const mp = b.mandoPuntos(), fk = mp.usados + '/' + mp.max + b.cartas.join() + b.cartaPlan + b.cartaRonda + '|' + B.modo + '|' + B.speed + '|' + B.paused + '|' + (B.mas ? 'm' + B.mas : '') + '|' + (B.modo === 'cond' ? condSel(B).map(r => r.id + (r.order.cond || '')).join() : B.modo === 'plan' && B.view && B.view.propios ? B.view.propios().map(r => r.id + (tipoOrden(r) || '-')).join() : '');
  if (fk !== B.filaKey) { B.filaKey = fk; $('bctl').innerHTML = filaRonda(B); }
  const pn = $('bpanel'), tx = textoRonda(B); if (pn) {
    if (tx !== B.panelTx) { B.panelTx = tx; B.panelT = performance.now(); pn.innerHTML = tx; }
    pn.className = (B.modo === 'informe' || B.mas || B.modo === 'cond' ? 'act' : '') + (B.pmin ? ' min' : '');
    // los consejos de plan se apagan solos a los 7 s para no tapar el campo; el informe y «Más» se quedan hasta cerrarlos
    pn.style.display = tx && (B.modo !== 'plan' || B.mas || performance.now() - B.panelT < 7000 || (B.choque && performance.now() < B.choqueT)) ? '' : 'none'; }
  return true;
}
function endBattle(res) {
  const info = UI.binfo, out = G.applyBattle(res), d = D.CITIES[info.city];
  const loss = side => Object.keys(res.lost[side]).filter(k => res.lost[side][k] > 0).map(k => '<div><span>' + D.UNITS[k].n + '</span><b>−' + res.lost[side][k] + '</b></div>').join('') || '<div><span>Sin bajas</span></div>';
  modal('<div class="yr">' + (out.kind === 'attack' ? 'ASALTO A ' : 'DEFENSA DE ') + d.n.toUpperCase() + '</div><h2>' + (out.win ? '¡Victoria!' : 'Derrota') + '</h2>' +
    '<div class="vs"><div class="side"><h4 style="color:#ff9c8c">Bajas romanas</h4>' + loss(0) + '</div><div class="side"><h4>Bajas enemigas</h4>' + loss(1) + '</div></div>' +
    (res.objetivo ? '<p><b>' + (res.objetivo.cumplido || res.objetivo.ok ? 'Objetivo cumplido' : 'Objetivo no cumplido') + ':</b> ' + esc(res.objetivo.texto || '') + '</p>' : '') + '<p>' + out.lines.map(esc).join('\n') + '</p><div class="acts"><button class="btn" data-act="bdone">Continuar</button></div>', true);
}

/* ---------- acciones ---------- */
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-act]');
  if (!el && e.target.closest('#cuentas')) return;
  if (!el) { $('cuentas').hidden = true; $('hoja').hidden = true; $('citymenu').hidden = true; $('popsheet').hidden = true; if (e.target.id === 'modal' && !UI.sticky) closeModal(); hudDock(); return; }
  const a = el.dataset.act, v = el.dataset.v, s = S(), B = UI.battle;
  if (a !== 'menumodo') $('hoja').hidden = true; if (a !== 'citymenu') $('citymenu').hidden = true; if (a !== 'pill' && a !== 'imp' && a !== 'rep') $('popsheet').hidden = true; if (a !== 'cuentas' && a !== 'imp' && a !== 'cuvender' && a !== 'cuadelantar') $('cuentas').hidden = true;
  if (a !== 'derr') UI.derr = null;
  switch (a) {
    case 'fluidez': fijarFluidez(!fluidezOn()); showMenu(); break;
    case 'new': case 'newregion': G.newGame(($('hname').value || '').trim() || 'Lucio Cornelio Escipión', a === 'newregion' ? v : 'mediterraneo'); G.turnos = true; S().turnos = true; UI.overShown = false; G.save(); startGame(); break;
    case 'continue': if (G.load()) { UI.overShown = false; startGame(); if (S().over) showOver(); } break;
    case 'tomenu': G.save(); UI.modalQ = []; closeModal(); stopBattle(); showMenu(); break;
    case 'tab': UI.codice = null; setTab(v); break;
    case 'codice': UI.codice = v || null; render(); { const vw = $('view'); if (vw) vw.scrollTop = 0; } break;
    case 'turno': if (!G.turnos || s.over || s.pending.length || UI.modalOpen) break; G.pasarTurno(); UI.dirty = true; tickUI(); break;
    case 'speed': if (G.turnos) { s.speed = s.speed ? 0 : 1; tickUI(); break; } s.speed = v === 'next' ? ({ 1: 2, 2: 4, 4: 0, 0: 1 }[s.speed] || 1) : +v; tickUI(); break;
    case 'modo': setModo(v); break;
    case 'citymenu': { const m = $('citymenu'); m.hidden = !m.hidden; if (!m.hidden) m.innerHTML = cityMenuHtml(); break; }
    case 'menumodo': { const h = $('hoja'); h.hidden = !h.hidden; if (!h.hidden) h.innerHTML = hojaHtml(); hudDock(); break; }
    case 'accion': if (UI.modo === 'guerra') setTab('army'); else { UI.cityList = true; setTab('city'); } break;
    case 'pill': if (UI.modo !== 'guerra') { const ps = $('popsheet'); ps.hidden = !ps.hidden; renderPop(); } break;
    case 'popx': $('popsheet').hidden = true; break;
    case 'cuentas': { const cs = $('cuentas'); cs.hidden = !cs.hidden; if (!cs.hidden) { $('popsheet').hidden = true; renderCuentas(true); } break; }
    case 'cux': $('cuentas').hidden = true; break;
    case 'cuvender': { const got = G.venderSobrante(v), U = G.ultimaVenta, n = RES_NOM[v].toLowerCase();
      const msg = { ok: '⚖️ Vendes el sobrante de ' + n + ' y recibes ' + got + ' denarios.', parcial: '⚖️ Solo se pudo vender ' + U.vendido + ' de ' + n + ' (' + got + ' denarios); quedará ' + U.quedara + ' por perder.', orolleno: 'No se vende: el almacén de denarios está lleno y el cobro se perdería. Gasta oro antes.', sinmercado: 'No se puede vender: hace falta un mercado.', sinsobrante: 'No hay nada que se vaya a perder de ' + n + '.', sincaja: 'No hay ' + n + ' en la caja del mes para vender; lo que se perderá aún no se ha producido.', invalido: 'No se puede vender eso.' }[U.motivo] || 'No se pudo vender.';
      toast(msg, U.motivo === 'ok' ? '' : 'bad'); renderCuentas(true); break; }
    case 'cuobra': $('cuentas').hidden = true; if (v && s.cities[v]) { UI.city = v; UI.bsel = null; UI.cityList = false; } else UI.cityList = true; setTab('city'); break;
    case 'cuadelantar': { const nm = D.CITIES[v] ? D.CITIES[v].n : v; if (G.adelantarObra(v, el.dataset.i == null ? undefined : +el.dataset.i)) toast('🔨 ' + nm + ': pagas de golpe las cuotas que faltan.'); else toast('No alcanza para adelantar las cuotas de ' + nm + '.', 'bad'); renderCuentas(true); break; }
    case 'ayuda': UI.codice = window.CODICE ? 'tropas' : null; setTab('log'); break;
    case 'menu': G.save(); showMenu(); break;
    case 'impf': UI.impF = v; render(); break;
    case 'impmismo': { const c = s.cities[v], o = c.obras[0], pz = o && o.pieza ? o.pieza : consejo(c, v).pieza; if (pz) mismoModal(v, pz, o && o.pieza ? !!o.nuevo : !consejo(c, v).mej); else toast('Esa ciudad no tiene una obra de la que copiar.', 'bad'); break; }
    case 'impmas': { const q = v.split('>'), op = opcionPieza(q[0], q[1], q[2] === '1'); if (!op) toast('Ya no se puede hacer esa obra.', 'bad'); else { const r = ponPieza(q[0], op); if (r.ok) { toast('🔨 ' + D.CITIES[q[0]].n + ': ' + op.nombre + '.'); closeModal(); render(); mismoModal(q[0], q[1], q[2] === '1'); } else toast(r.motivo + '.', 'bad'); } break; }
    case 'impc': UI.city = v; UI.bsel = null; UI.cityList = false; setTab('city'); break;
    case 'city': UI.city = v; UI.bsel = null; $('view').scrollTop = 0; if (UI.tab === 'map' && UI.map) UI.map.center(v); render(); tickUI(); break;
    case 'rep': if (G.reparto(UI.city, el.dataset.r, +el.dataset.d)) render(); break;
    case 'imp': if (G.setImp(UI.city, el.dataset.v)) render(); break;
    case 'ciud': if (G.darCiudadania(UI.city)) render(); break;
    case 'ruta': { const q = v.split('>'); if (G.rutaAbrir(q[0], q[1])) { toast('⚖️ Ruta abierta con ' + D.CITIES[q[1]].n + '.'); render(); } else toast(G.rutaPuede(q[0], q[1]) || 'No se puede abrir la ruta.', 'bad'); break; }
    case 'rutacerrar': { const q = v.split('>'); if (G.rutaCerrar(q[0], q[1])) { toast('Ruta cerrada.'); render(); } break; }
    case 'tipos': modal(tiposModal()); break;
    case 'dios': if (G.elegirDios(UI.city, v)) render(); break;
    case 'tipo': if (G.setTipo(UI.city, v)) { closeModal(); toast(D.TIPOS[v].i + ' ' + D.CITIES[UI.city].n + ': ' + D.TIPOS[v].n + '.'); render(); } else toast('No se puede elegir ese tipo.', 'bad'); break;
    case 'derr': { const k = UI.city + ':' + v; if (UI.derr !== k) { UI.derr = k; renderCity3D(); break; } UI.derr = null; const r = G.derribarPieza(UI.city, +v); if (r.ok) { UI.bsel = null; toast('🧱 Pieza derribada.', 'good'); } else toast(r.motivo + '.', 'bad'); renderCity3D(); tickUI(); break; }
    case 'clist': UI.cityList = !UI.cityList; setTab('city'); break;
    case 'cview': if (UI.cityV) { UI.bsel = null; UI.vistas = false; UI.cityV.view(v); renderCity3D(); } break;
    case 'tab3': UI.codice = null; UI.vistas = false; UI.bsel = null; if (v === 'imperio') { UI.modo = 'gobierno'; setTab('imperio'); } else { UI.cityList = v === 'gobierno'; setTab('city'); } break;
    case 'cvistas': UI.vistas = !UI.vistas; renderCity3D(); break;
    case 'cbuild': construir3(); break;
    case 'fundar': closeModal(); UI.abrirFundar(v); break;
    case 'colonos': { const r = G.enviarColonos(el.dataset.from, el.dataset.to); if (r.ok) toast('🏛️ Los colonos parten hacia ' + G.lugar(el.dataset.to).n + '.', 'good'); else toast(r.motivo, 'bad'); UI.sheetKey = ''; renderSheet(); break; }
    case 'ccancel': salir3(); break;
    case 'cclose': UI.bsel = null; renderCity3D(); tickUI(); break;
    case 'saber': { const r = G.invUp(v); if (r.ok) { toast('Empiezas a estudiar: ' + D.INVEST[v].n); UI.svSel = null; UI.svDown = false; render(); } else toast(r.motivo, 'bad'); break; }
    case 'saberedad': { const r = G.edadUp(); if (r.ok) { toast('Empiezas a subir de edad'); UI.svDown = false; render(); } else toast(r.motivo, 'bad'); break; }
    case 'sabersel': UI.svSel = UI.svSel === v ? null : v; UI.svDown = false; render(); break;
    case 'dotsab': case 'clasab': { const x = G.sabiosDe(s.cities[UI.city]), r = a === 'dotsab' ? G.setSabios(UI.city, +v, x.clase) : G.setSabios(UI.city, x.dot, v); if (!r.ok) toast(r.motivo + '.', 'bad'); render(); break; }
    case 'forja': if (G.forjaUp(UI.city, v)) render(); else toast(S().forja.cola ? 'Ya hay una mejora en curso.' : 'Faltan recursos.', 'bad'); break;
    case 'mejpz': { const r = G.mejorarPieza(UI.city, +v); if (r.ok) toast('🔨 ' + obraNom(r.obra) + ': obra en marcha.', 'good'); else toast(r.motivo + '.', 'bad'); renderCity3D(); tickUI(); break; }
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
    case 'goport': { closeModal(); UI.city = v; const E = G.ciudadE(v), e = E && E.edificios.find(q => q.tipo === 'muelle'); UI.bsel = e ? { k: 'pieza', id: e.id, x: e.x, z: e.z } : null; setTab('city'); break; }
    case 'pick': showPicker(el.dataset.from, el.dataset.to); break;
    case 'send': {
      const hero = $('pk-hero') && $('pk-hero').checked;
      const saq = $('pk-saq') && $('pk-saq').checked;
      if (G.send(el.dataset.from, el.dataset.to, pickUnits(), hero, saq ? 'saqueo' : null)) { closeModal(); toast((saq ? '💰 Partida de saqueo hacia ' : '🚩 El ejército parte hacia ') + D.CITIES[el.dataset.to].n + '.'); UI.sheetKey = ''; renderSheet(); }
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
    case 'ball': B.view.selectAll(); B.mas = false; B.panelTx = null; B.filaKey = ''; break;
    case 'bgold': { const o = B.view.ordenRecomendada(); if (o) toast(o.txt + '.'); break; }
    case 'bala': B.view.selAla(v); break;
    case 'bgrp': { const g = GRUPOS_L1.find(q => q[0] === v); if (g) B.view.selPorClase(g[2]); break; }
    case 'bord': { const t = B.view.darOrden(v); if (t) { B.filaKey = ''; B.panelTx = null; } else toast(B.view.propios().length ? 'Ese regimiento no puede recibir esa orden ahora.' : 'Elige antes un regimiento: toca su estandarte.'); break; }
    case 'bsig': { const r = B.view.siguienteReg(1); if (r) { B.view.centrarEn(r.x, r.y); B.filaKey = ''; B.panelTx = null; } break; }
    case 'bformas': B.mas = 'form'; B.panelTx = null; break;
    case 'btiempo': B.mas = 'tiempo'; B.panelTx = null; break;
    case 'batajos': B.mas = 'atajos'; B.atajoTx = null; B.panelTx = null; break;
    case 'bformsel': { const sel = B.view.propios(); B.formVer = v; let fallo = null; for (const r of sel) if (!B.b.ponerFormacion(r, v)) fallo = fallo || B.b.motivo || 'No se puede ahora.'; if (fallo) toast(fallo, 'bad'); B.panelTx = null; B.filaKey = ''; break; }
    case 'bfrente': { const on = B.view.activaFrente(); B.mas = false; B.panelTx = null; if (on && !B.view.propios().length) { B.view.activaFrente(false); toast('Elige antes un regimiento: toca su estandarte.'); } else if (on) toast('Arrastra el dedo sobre el campo, de un extremo a otro del frente.'); break; }
    case 'bjuntos': { const sel = B.view.propios(); if (sel.length < 2) { toast('Elige varios regimientos (botón «Todas») para que marchen juntos.'); break; } const n = B.b.agrupar(sel); toast(n === false || n === 0 ? (B.b.motivo || 'No pueden marchar juntos ahora.') : 'Marchan juntos, a la velocidad del más lento.', n === false || n === 0 ? 'bad' : undefined); B.mas = false; B.panelTx = null; break; }
    case 'brelevar': { const r = B.view.propios().find(q => q.linea); if (!r) { toast('Elige un regimiento romano con su línea (I, II o III).'); break; } const n = B.b.relevarLinea(0, r.linea); toast(n ? 'Relevo: ' + n + (n === 1 ? ' regimiento cambia' : ' regimientos cambian') + ' de línea.' : 'No hay relevo posible ahora.', n ? undefined : 'bad'); B.mas = false; B.panelTx = null; break; }
    case 'bataj': { const sel = B.view.propios(), regs = sel.length ? sel : B.b.regs.filter(q => q.side === 0 && q.st === 'ok'), q = B.b.atajo(v, regs); B.atajoTx = q ? q.txt : (B.b.motivo || 'Ahora no sirve.'); if (q) toast(q.txt); B.panelTx = null; B.filaKey = ''; break; }
    case 'bmas': B.mas = !B.mas; B.choque = null; B.panelTx = null; B.filaKey = ''; break;
    case 'bpmin': B.pmin = !B.pmin; break;
    case 'bsalto': B.view.saltoAla(+v); break;
    case 'bcam': if (B.view.cycleCam) B.view.cycleCam(); break;
    case 'bsonido': if (window.Sonido) { if (window.Sonido.activo) window.Sonido.off(); else window.Sonido.on(); } B.filaKey = ''; B.panelTx = null; break;
    case 'bfac': { const f = document.querySelector('#bdif .fac'); if (f) f.hidden = !f.hidden; break; }
    case 'bform': B.b.formar(0, v); document.querySelectorAll('#bctl [data-act="bform"]').forEach(x => x.classList.toggle('on', x === el)); break;
    case 'bejec': if (B.b.ejecutar()) { B.view.sel.clear(); B.mas = false; B.speed = 1; rondaModo(B, 'ejec'); } else if (B.b.motivo) toast(B.b.motivo, 'bad'); break;
    case 'bcarta': if (B.b.jugarCarta(v)) { toast('Carta jugada: ' + CARTAS_TXT[v][0] + '. Vale para la ronda que viene.'); B.filaKey = ''; } else toast(B.b.generalVivo(0) ? 'Solo una carta por ronda.' : 'Sin general no hay cartas.', 'bad'); break;
    case 'bchoque': { const q = B.b.preverChoque(), n = B.b.cfg.sides, p = x => Math.round(x * 100) + ' %'; B.choque = 'Si chocan ya (aproximado): ' + (q.gana < 0 ? 'empate.' : q.claro ? 'ventaja de <b>' + esc(n[q.gana].name) + '</b>.' : 'muy igualado, algo mejor para <b>' + esc(n[q.gana].name) + '</b>.') + ' Conservarían ' + esc(n[0].name) + ' ' + p(q.f0) + ' y ' + esc(n[1].name) + ' ' + p(q.f1) + '.'; B.choqueT = performance.now() + 9000; B.mas = false; B.panelTx = null; B.filaKey = ''; break; }
    case 'bcond': if (condSel(B).length) rondaModo(B, 'cond'); else toast('Elige un regimiento con orden: toca su estandarte y dale una orden.'); break;
    case 'bcnd': for (const r of condSel(B)) B.b.condicion(r, v || null); B.filaKey = ''; break;
    case 'bcondok': rondaModo(B, 'plan'); break;
    case 'bseguir': rondaModo(B, 'plan'); break;
    case 'brepetir': if (B.b.repetir()) { if (B.view.reiniciaFiguras) B.view.reiniciaFiguras(); B.speed = 1; rondaModo(B, 'ejec'); } break;
    case 'bstart': B.b.empezar(); reponerBarra(B); if (B.b.rondas) { B.speed = 1; B.paused = false; entraPlan(B); break; } $('bauto').classList.add('on'); $('bspeed').textContent = 'x1'; $('bpause').textContent = 'II'; B.speed = 1; B.paused = false; $('bhint').style.opacity = 1; setTimeout(() => { $('bhint').style.opacity = 0; }, 7000); break;
    case 'bskip': reponerBarra(B); B.b.finish(); break;
  }
});

/* ---------- bucle principal ---------- */
function frame(now) {
  const dt = Math.min(0.25, (now - UI.last) / 1000 || 0); UI.last = now;
  const s = S();
  if (UI.battle) {
    const B = UI.battle, b = B.b;
    if (!B.paused && !b.over) { B.acc += dt * B.speed; let n = 0; while (B.acc >= 0.05 && n++ < 12) { b.step(0.05); B.acc -= 0.05; } }
    battleHud(); objetivoHud(B); B.view.draw();
    if (b.over && !B.done) { B.endT += dt; if (B.endT > 2.2) { B.done = true; endBattle(b.result()); } }
  } else if (s && !UI.menu) {
    if (!UI.modalOpen && !s.over) {
      if (s.pending.length) battlePrompt();
      else if (s.speed > 0) G.tick(dt * s.speed / 4);
    }
    if (UI.fundar) fundarCuadro(now);
    else if (UI.map && UI.tab === 'map') UI.map.update(s, UI.sel);
    if (UI.cityV && UI.tab === 'city' && !UI.cityList && !UI.fundar) { if (s.cities[UI.city].owner !== 'roma') UI.city = G.myCities()[0] || 'roma'; if (UI.cityV.listo && !UI.minis) { try { UI.minis = UI.cityV.miniaturas(); } catch (e) { UI.minis = {}; } UI.bandK = ''; cityPantalla(); } UI.cityV.update(s.cities[UI.city], UI.city, UI.bsel, now / 1000); }
    if (UI.modo3 && UI.modo3 !== 'mirar' && UI.modo3 !== 'fundar' && (UI.tab !== 'city' || UI.cityList || UI.city !== UI.col3City)) salir3();
    if (UI.dirty) render();
    UI.acc = (UI.acc || 0) + dt; if (UI.acc > 0.25) { UI.acc = 0; tickUI(); if (UI.tab === 'map' && UI.sel && !UI.modalOpen) renderSheet(); }
    UI.saveT += dt; if (UI.saveT > 8) { UI.saveT = 0; G.save(); }
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { if (UI.map) UI.map.resize(); if (UI.cityV && !$('citywrap').hidden) UI.cityV.resize(); if (UI.battle && UI.battle.view.resize) UI.battle.view.resize(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S() && !UI.menu) G.save(); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });

buildTop(); buildTabs(); initBandeja();
try { UI.map = new MapView3D($('mapwrap'), { onSelect: id => { UI.sel = id; UI.sheetKey = ''; renderSheet(); } }); }
catch (e) { console.warn('WebGL no disponible para el mapa', e); $('mapwrap').innerHTML = '<div class="empty" style="padding:160px 24px;text-align:center">Tu dispositivo no puede mostrar el mapa 3D. Puedes jugar desde las pestañas Ciudad y Ejército.</div>'; }
showMenu(); requestAnimationFrame(frame);
// modelos reales (0 A.D.): se cargan en segundo plano; hasta entonces se usan los generados por código
loadIndex().then(idx => preload(Object.keys(idx))).then(() => { UI.dirty = true; });
loadStaticIndex().then(idx => Promise.all([preloadStatic(Object.keys(idx)), loadGroundTextures()])).then(() => {
  try { $('citywrap').hidden = false; UI.cityV = new CityView3D($('citywrap'), Object.assign({ onPick: tocarCiudad }, gestosCiudad)); $('citywrap').hidden = true; if (UI.tab === 'city' && !UI.menu) setTab('city'); }
  catch (e) { console.warn('Sin vista 3D de ciudad', e); $('citywrap').hidden = true; }
});
window.UI = UI;

// N7: el deslizador de tiempo de «Ver futuro» (4 posiciones: final, 10, 20, 30 s)
document.addEventListener('input', ev => { const t = ev.target; if (!t || t.id !== 'btslider' || !UI.battle || !UI.battle.view || !UI.battle.view.ponTPrev) return; UI.battle.view.ponTPrev([0, 10, 20, 30][+t.value] || 0); });
