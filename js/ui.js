/* AQVILA — interfaz: mapa 3D como pantalla principal, paneles, modales y pantalla de batalla */
import { MapaPartida } from './gfx/mapa-partida.js';   // AM4: en partida de polis, el mapa vivo de Grecia; en las demás, el de siempre (map3d.js)
import { portrait } from './gfx/models.js';
import { preload, loadIndex, realPortrait } from './gfx/units.js';
import * as ESC from './ui-escaramuza.js';   // CG2a: constructor de ejército de Escaramuzas
import { preloadStatic, loadStaticIndex } from './gfx/statics.js';
import { CityView3D } from './gfx/city3d.js';
import { loadGroundTextures } from './gfx/ground.js';
import { fijar as fijarFluidez, estaEncendido as fluidezOn } from './gfx/fluidez.js';
import * as Ciudad from './ciudad.js';
import * as NEC from './necesidades.js';   // CDe1: necesidades de la ciudad (las usa game.js)
import * as AGRO from './agricultura.js';   // CDe3: campos por suelo (los usa game.js)
import * as COMARCA from './comarca.js';   // PN3: comarca aleatoria de la partida de polis (la usa game.js)
import { crearMenu } from './ciudad-menu.js';   // CD1b: botón «Construir» y su menú por familias
import { abrirMercado, fijarAviso } from './mercado-ui.js';   // CDe3 2b: pantalla del mercado
import { descargar, copiar, hacerPostal, guardarCopia, cargarCopia, contemplar } from './gfx/movil.js';   // CN18

const D = window.DATA, G = window.Game, $ = id => document.getElementById(id);
G.usarCiudad(Ciudad); if (G.usarNecesidades) G.usarNecesidades(NEC); if (G.usarAgricultura) G.usarAgricultura(AGRO); if (G.usarComarca) G.usarComarca(COMARCA);   // CN2b: game.js (script clásico) recibe la ciudad nueva antes de cargar o crear partida
const UI = { codice: null, modo: 'gobierno', tab: 'map', city: 'roma', sel: null, modalQ: [], modalOpen: false, battle: null, menu: true, last: 0, saveT: 0, map: null };
const ROMA = D.FACTIONS.roma.col;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => { n = Math.floor(n); return n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + '\u202fM' : n >= 10000 ? (n / 1000).toFixed(1).replace('.', ',') + '\u202fk' : String(n); };   // CDe4: «12,3 k», «1,2 M»
/* CE3-B: tiempos en estaciones (la lógica da G.estaciones, G.estacionesRestan, G.llegada) */
const estTxt = n => n + (n === 1 ? ' estación' : ' estaciones');
const mesesEst = m => estTxt(G.estaciones(m));
const quedanTxt = t1 => { const n = G.estacionesRestan({ t1 }); return n > 0 ? 'acaba en ' + estTxt(n) : 'acaba al pasar estación'; };
const llegaEn = t1 => { const n = G.estacionesRestan({ t1 }); return n > 0 ? 'en ' + estTxt(n) : 'al cerrar la estación'; };
const months = m => m >= 12 ? (m / 12).toFixed(1).replace('.', ',') + ' años' : mesesEst(m);   // ES20: en estaciones (o años)
/* Iconos de línea de la guía de arte (E1b), dibujados aquí en SVG: sustituyen en pantalla a los emojis de data.js */
const svgIco = (d, oro) => '<svg class="ico' + (oro ? ' oro' : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
/* CE2: cuatro recursos guardados (grano, denarios, materiales, hierro). Madera y piedra quedan como iconos de sus edificios */
const ICO_MADERA = svgIco('<ellipse cx="6" cy="12" rx="2.6" ry="4.5"/><path d="M6 7.5h11.5c1.4 0 2.6 2 2.6 4.5s-1.2 4.5-2.6 4.5H6"/><path d="M6 11v2M11 10.5h4M12.5 13.5h3.5"/>'), ICO_PIEDRA = svgIco('<path d="M3 13.5h18v6.5H3zM12 13.5V20M6.5 13.5V7h11v6.5"/><path d="M9 10h2M14.5 16.8h2"/>');
D.RES_ICON = {
  grano: svgIco('<path d="M12 21.5V8"/><path d="M12 8c-1.6-1.7-1.6-3.8 0-5.5 1.6 1.7 1.6 3.8 0 5.5z"/><path d="M12 13c-2.6 0-3.8-1.6-3.8-3.8 2.6 0 3.8 1.6 3.8 3.8zM12 13c2.6 0 3.8-1.6 3.8-3.8-2.6 0-3.8 1.6-3.8 3.8zM12 18c-2.6 0-3.8-1.6-3.8-3.8 2.6 0 3.8 1.6 3.8 3.8zM12 18c2.6 0 3.8-1.6 3.8-3.8-2.6 0-3.8 1.6-3.8 3.8z"/>'),
  denarios: svgIco('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6.3" stroke-dasharray="1.2 2.1"/><path d="M10 9.2l4 5.6M14 9.2l-4 5.6"/>', true),
  materiales: svgIco('<path d="M3 14h18v6H3zM10 14v6M16 14v6"/><ellipse cx="6" cy="9.3" rx="2" ry="3"/><path d="M6 6.3h12c1.1 0 2 1.3 2 3s-.9 3-2 3H6"/>'),
  hierro: svgIco('<path d="M8.5 7.5h7l1.5 4.5h-10z"/><path d="M7 12l-3.5 5.5h17L17 12M8.5 7.5L3.5 17.5M15.5 7.5l5 10"/>')
};
D.POP_ICON = svgIco('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.6 2.6-6 6-6s6 2.4 6 6"/><circle cx="16.8" cy="9" r="2.5"/><path d="M17.5 14.2c2.2.5 3.6 2.4 3.6 5"/>');
/* Iconos de guerra y de edificios (E1c): dibujos de línea propios, como los de recursos */
D.GUERRA_ICON = { espadas: svgIco('<path d="M5 19L17 7M14.5 5.5L18.5 9.5M3.5 17.5l3 3M7 17l-2.5 2.5"/><path d="M19 19L7 7M9.5 5.5L5.5 9.5M20.5 17.5l-3 3M17 17l2.5 2.5"/>'), escudo: svgIco('<path d="M12 3l7 2.5v6c0 4.5-3 7.8-7 9.5-4-1.7-7-5-7-9.5v-6z"/><path d="M12 3v18M5 11h14"/>'), aguila: svgIco('<circle cx="12" cy="5.5" r="2"/><path d="M12 7.5V17M12 10C9 9 5 9.5 2.5 12c2 .3 3.5.2 5 0-1.5 1.5-2.5 2.500-3 4 3-.5 5.500-2.500 7.500-6M12 10c3-1 7-.5 9.500 2-2 .3-3.500.2-5 0 1.500 1.500 2.500 2.500 3 4-3-.5-5.500-2.500-7.500-6"/><path d="M10 20.500l2-3.500 2 3.500"/>'), casco: svgIco('<path d="M4 15a8 8 0 0116 0v2H4z"/><path d="M12 7V4M8 17v3M16 17v3M4 17h16"/>') };
D.BUILD_ICON = {
  aserradero: ICO_MADERA, cantera: ICO_PIEDRA, mina: D.RES_ICON.hierro, granja: D.RES_ICON.grano, cuartel: D.GUERRA_ICON.espadas,
  viviendas: svgIco('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10M10 20v-5h4v5"/>'),
  foro: svgIco('<path d="M3 20h18M5 20V9h14v11M3 9h18M9 20v-6h6v6M12 4v5"/>'),
  almacen: svgIco('<path d="M9 3h6M10 3v3c-3 1-4 4-4 7 0 4 2 7 6 7s6-3 6-7c0-3-1-6-4-7V3"/><path d="M6.5 11h-2M17.5 11h2"/>'),
  mercado: svgIco('<path d="M12 4v16M6 20h12M4 8h16"/><path d="M4 8l-3 6h6zM20 8l-3 6h6z"/>'),
  puerto: svgIco('<circle cx="12" cy="5" r="2"/><path d="M12 7v14M7 11h10M4 15c0 3.5 3.5 6 8 6s8-2.5 8-6"/>'),
  establo: svgIco('<path d="M7 20c0-5 1-8 4-10l-1-4 3 1 4 3c2 2 3 4 3 6M11 10c-2 0-3-1-4-2"/>'),
  muralla: svgIco('<path d="M3 20V8h3v2h3V8h3v2h3V8h3v12zM3 20h18M8 20v-5h8v5"/>'),
  herreria: svgIco('<path d="M4 9h13c0 2.5-1.5 3.5-4 3.5v3H8v-3C5.5 12.5 4 11.5 4 9zM17 9l3-1.5M7 15.5h6M6 19h8"/>'),
  escuela: svgIco('<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11M9 8h6M9 11h4"/>'),
  templo: svgIco('<path d="M3 10l9-6 9 6zM6 12v6M10 12v6M14 12v6M18 12v6M3 20h18"/>')
};
/* CDe4 (MN4a): los cuatro recursos con el icono pintado de assets/iconos/ (CC BY-SA 3.0). BUILD_ICON ya guardó los de línea */
{ const im = n => '<img class="ico" src="assets/iconos/' + n + '.svg" alt="">'; ['grano', 'denarios', 'materiales', 'hierro'].forEach(r => { D.RES_ICON[r] = im(r); }); D.RES_ICON_IMG = true; }
const bIco = b => D.BUILD_ICON[b] || D.BUILD[b].i;
// ES20: obras y lotes se pagan enteros al ordenarlos («Pagas ahora»)
const pagasHtml = c => '<div class="pagas">Pagas ahora:</div>' + costHtml(c);
const asFalta = (r, n) => { try { return G.disponible(r) < n ? ' falta' : ''; } catch (e) { return ''; } };   // CDe4: el coste en rojo si no alcanza
const sinHuecoTxt = c => G.huecosObra(c) === 1 ? 'Ya hay una obra en curso en esta ciudad' : 'Sube el foro para otra obra';
const obrasTxt = c => 'Obras ' + c.obras.length + '/' + G.huecosObra(c);
const obraBarra = q => '<div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div><span class="rem"></span>';
const costHtml = c => '<div class="cost as-costes">' + Object.keys(c).map(r => '<span class="as-coste' + asFalta(r, c[r]) + '">' + D.RES_ICON[r] + fmt(c[r]) + '</span>').join('') + '</div>';
const pt = (k, col) => { const u = realPortrait(k, col || ROMA) || portrait(k, col || ROMA); return u ? '<img src="' + u + '" alt="">' : '<span style="display:grid;place-items:center;height:100%;font-size:22px">' + D.UNITS[k].g + '</span>'; };
window.PORTADA_RETRATO = k => realPortrait(k, ROMA) || portrait(k, ROMA) || '';   // PN2: la ficha de polis enseña el retrato de su tropa propia
const troopsHtml = (u, col) => { const k = Object.keys(u).filter(x => u[x] > 0); return k.length ? '<div class="troops">' + k.map(x => '<div class="troop">' + pt(x, col) + '<em>' + u[x] + '</em><b>' + D.UNITS[x].n + '</b></div>').join('') + '</div>' : '<div class="empty">Sin tropas.</div>'; };
const S = () => G.state;
const licHtml = o => o && o.lic ? '<div class="licl"><span class="lic">licencia de juego</span> ' + esc(o.lic) + '</div>' : '';
const cohort = k => (D.UNITS[k].cls === 'cav' ? 10 : 20);

/* ---------- avisos y modales ---------- */
/* Cola de avisos (CN22): nunca más de UN aviso a la vista, ≈2,8 s, debajo de #linea.
   Misma clave = sustituye (y cuenta «+N»). Distintos esperan en cola corta (máx. 3; el resto se agrupa en «+N avisos»).
   Los errores de acción directa del jugador pasan por delante; los de sistema (4.º parámetro true) esperan.
   Es memoria de pantalla: no se guarda. Todo sigue en G.log (pestaña Crónica). */
const AV = { cur: null, pend: [], mas: 0, tm: 0, acum: null };
const avClave = txt => String(txt).replace(/[0-9]+/g, '').split(/[:.;(]/)[0].trim().slice(0, 24);
function avPon() {
  const box = $('toasts'); if (!box) return;
  const a = AV.cur; if (!a) { box.textContent = ''; return; }
  const lin = $('linea'), r = lin && !lin.hidden && lin.offsetParent ? lin.getBoundingClientRect() : null;
  box.style.top = r && r.height ? Math.round(r.bottom + 6) + 'px' : '';
  const t = document.createElement('div'); t.className = 'toast ' + (a.kind || '');
  t.textContent = a.txt + (a.n > 1 ? ' · +' + (a.n - 1) : '') + (a.extra ? ' · +' + a.extra + (a.extra === 1 ? ' aviso' : ' avisos') : '');
  box.textContent = ''; box.appendChild(t);
  clearTimeout(AV.tm); AV.tm = setTimeout(avSigue, 2800);
}
function avSigue() {
  AV.cur = AV.pend.shift() || null;
  if (AV.cur && !AV.pend.length && AV.mas) { AV.cur.extra = AV.mas; AV.mas = 0; }
  avPon();
}
function toast(txt, kind, clave, sistema) {
  if (sistema && AV.acum) { AV.acum.push({ txt: txt, kind: kind }); return; }           // durante «Pasar estación»: se acumulan (la hoja de estación los enseña)
  const k = clave || avClave(txt), a = { txt: txt, kind: kind || '', k: k, n: 1, extra: 0, sis: !!sistema };
  if (AV.cur && AV.cur.k === k) { a.n = AV.cur.n + 1; a.extra = AV.cur.extra; AV.cur = a; avPon(); return; }
  const q = AV.pend.findIndex(x => x.k === k); if (q >= 0) { a.n = AV.pend[q].n + 1; AV.pend[q] = a; return; }
  if (!AV.cur) { AV.cur = a; avPon(); return; }
  if (!sistema && a.kind === 'bad') { const f = AV.pend.findIndex(x => x.sis); AV.pend.splice(f < 0 ? AV.pend.length : f, 0, a); }
  else AV.pend.push(a);
  while (AV.pend.length > 3) { AV.pend.pop(); AV.mas++; }
}
/* Resumen de «Pasar estación» cortado por una batalla o un fuego: un solo aviso con lo que ha pasado (todo sigue en la Crónica) */
function toastResumen(lista) {
  if (!lista || !lista.length) return;
  const gr = lista.filter(x => x.kind === 'bad'); if (gr.length === 1 && lista.length === 1) { toast(gr[0].txt, 'bad', 'turno'); return; }   // un solo aviso grave: se lee entero
  const graves = gr.length, obras = lista.filter(x => /^🔨/.test(x.txt)).length;
  const p = []; if (obras) p.push(obras + (obras === 1 ? ' obra' : ' obras')); if (graves) p.push(graves + (graves === 1 ? ' aviso grave' : ' avisos graves'));
  const otros = lista.length - obras - graves; if (otros > 0 || !p.length) p.push(Math.max(otros, 0) + (otros === 1 ? ' aviso' : ' avisos'));
  toast(ASESOR.TEXTOS.turno(p.join(', ')), graves ? 'bad' : '', 'turno');
}
function modal(html, sticky, cls) { UI.modalQ.push({ html: html, sticky: sticky, cls: cls || '' }); pump(); }
/* MR2b: aviso como carta de papiro con lacre; el botón que avanza va con sello, el otro en tinta */
function carta(html, sticky) { modal('<i class="ro-carta-sello">' + RO_LACRE + '</i>' + html.replace(/class="btn( gold)?"/g, 'class="btn ro-sello"').replace(/class="btn ghost"/g, 'class="btn ro-tinta"'), sticky, 'ro-carta'); }
function pump() {
  if (UI.modalOpen || !UI.modalQ.length) return;
  const m = UI.modalQ.shift(); UI.modalOpen = true; UI.sticky = m.sticky;
  $('mbox').innerHTML = m.html; $('mbox').className = m.cls || ''; $('modal').hidden = false; $('mbox').scrollTop = 0;
}
function closeModal() { UI.modalOpen = false; $('modal').hidden = true; pump(); }

/* ES20: sin reloj. El juego solo avanza con «Pasar estación»; ya no hay pausas ni velocidad. */
G.onEvent = function (type, p) {
  if (type === 'parar') return;   // ES20: sin reloj no hay nada que parar
  if (type === 'event') carta('<div class="yr">' + p.y + ' A.C.</div><h2>' + esc(p.t) + '</h2><p>' + esc(p.x) + '</p><div class="acts"><button class="btn" data-act="close">Continuar</button></div>');
  else if (type === 'alert') toast(p, 'bad', null, true);
  else if (type === 'log') { if (!p.mudo) { if (p.k === 'good') toast(p.x, '', null, true); else if (p.k === 'bad') toast(p.x, 'bad', null, true); } UI.dirty = true; }
  else if (type === 'dirty') UI.dirty = true;
  else if (type === 'colonos') { const d = D.COLONIAS[p.sitio]; if (d) carta('<div class="yr">COLONOS</div><h2>Han llegado a ' + esc(d.n) + '</h2><p>Los colonos esperan tu orden. Elige el lugar del foro y el arado trazará el surco sagrado.</p><div class="acts"><button class="btn ghost" data-act="close">Más tarde</button><button class="btn gold" data-act="fundar" data-v="' + p.sitio + '">Fundar ' + esc(d.n) + '</button></div>'); }
  else if (type === 'turno') { if (window.MINISTROS_UI) MINISTROS_UI.pintar(); UI.dirty = true; }
  else if (type === 'hoja') { UI.hojaPend = true; UI.dirty = true; }   // ES20: al cerrar la estación sale su hoja, en cuanto no haya carta, batalla ni fuego por medio (hojaEstEspera)
  else if (type === 'victoria') { if (!UI.camVic) setTimeout(camVictoria, 0); }
  else if (type === 'over') { if (!UI.binfo) showOver(); }
};

/* ---------- menú ---------- */
/* CN14-C: dificultad (3 botones) y casilla del asesor; en el menú ('m') valen para la partida nueva, en Ajustes ('g') para la actual */
const DIF_NOM = { tranquila: 'Tranquila', normal: 'Normal', dura: 'Dura' };
function difFila(donde) {
  const act = donde === 'g' ? ((G.ajustes() || {}).dif || 'normal') : (UI.difSel || 'normal'), ase = donde === 'g' ? !!(G.ajustes() || {}).asesor : UI.asesorSel !== false;
  return '<div class="ajf" id="dif-' + donde + '"><b>Dificultad de la ciudad</b><div class="ajb">' + Object.keys(D.DIFICULTAD).map(k => '<button class="chip' + (k === act ? ' on' : '') + '" data-act="dif" data-v="' + k + '" data-d="' + donde + '">' + (DIF_NOM[k] || k) + '</button>').join('') + '</div>' +
    '<label class="ajc"><input type="checkbox" id="ase-' + donde + '" data-act="asesor" data-d="' + donde + '"' + (ase ? ' checked' : '') + '> Consejos del asesor</label></div>';
}
/* CN15c: sonido sí/no (Sonido guarda la clave 'aqvila-sonido'); el contexto de audio nace en el primer toque (lo hace sonido.js) */
const sonidoOn = () => !window.Sonido || window.Sonido.activo !== false, sonidoTxt = () => 'Sonido: ' + (sonidoOn() ? 'sí' : 'no');
const musicaOn = () => !window.Musica || !window.Musica.encendida || window.Musica.encendida(), musicaTxt = () => 'Música: ' + (musicaOn() ? 'sí' : 'no');
/* SON10: «Preguntas de oficiales» sí/no (Dialogos guarda la clave 'aqvila-preguntas'; encendido por defecto). Con «no», en la batalla no preguntan; la arenga sigue. */
const preguntasOn = () => !window.Dialogos || window.Dialogos.preguntasOn(), preguntasTxt = () => 'Preguntas de oficiales: ' + (preguntasOn() ? 'sí' : 'no');
/* SON6: banda sonora del resto del juego: el tema según la pantalla (menú, ciudad, mapa, Senado); en el mapa, más tensa con ejércitos enemigos en marcha */
function musicaPantalla() { try { const M = window.Musica; if (!M || !M.tema) return; const s = UI.menu ? null : S(); if (!s) { M.tema(UI.menu ? 'menu' : null); return; } M.tema(M.temaDe(UI.tab), { estacion: D.ESTACIONES.indexOf(G.estacion(s.t)), tension: M.tensionMapa(s.marches.filter(m => m.owner !== 'roma').length) }); } catch (e) { /* la música nunca rompe el juego */ } }
function ajustesHtml() {
  const a = G.ajustes(); if (!a) return '';
  const sw = [['crecida', 'Crecida del río'], ['fuego', 'Incendios'], ['hambre', 'Hambre de invierno']];
  return '<div class="empty ajustes" id="ajustes"><b>Ajustes</b>' + difFila('g') + '<div class="ajb">' + sw.map(q => '<button class="chip' + (a.suc[q[0]] ? ' on' : '') + '" data-act="suceso" data-v="' + q[0] + '">' + q[1] + ': ' + (a.suc[q[0]] ? 'sí' : 'no') + (q[0] === 'hambre' && !((D.DIFICULTAD[a.dif] || {}).hambre || {}).meses ? ' (sin efecto en Tranquila)' : '') + '</button>').join('') + '</div>' +
    '<small>Los cambios de dificultad y sucesos valen desde la estación siguiente.</small><div class="ajb"><button class="chip" data-act="repetirasesor">Repetir los consejos</button></div>' +
    '<div class="ajf" id="aj-ambiente"><div class="ajb"><button class="chip' + (G.ambiente() ? ' on' : '') + '" data-act="ambiente">Ambiente: ' + (G.ambiente() ? 'sí' : 'no') + '</button></div><small>Tono por estación, viñeta y contorno dorado en la ciudad.</small></div>' +
    '<div class="ajf" id="aj-sonido"><div class="ajb"><button class="chip' + (sonidoOn() ? ' on' : '') + '" data-act="sonido">' + sonidoTxt() + '</button><button class="chip' + (musicaOn() ? ' on' : '') + '" data-act="musica">' + musicaTxt() + '</button><button class="chip' + (preguntasOn() ? ' on' : '') + '" data-act="preguntas">' + preguntasTxt() + '</button></div></div></div>';
}
/* I8: bloque «Partida corta» del menú: dos botones con su línea de explicación (los textos vienen de D.MODOS.corta) */
function cortaHtml() {
  const m = D.MODOS && D.MODOS.corta; if (!m) return '';
  const b = (k, act) => '<button class="btn corta" data-act="' + act + '">' + esc(m.inicio[k].n) + '</button><small class="cortad">' + esc(m.inicio[k].d) + '</small>';
  return '<div class="cortab"><b>Partida corta (Italia, ' + m.duracion.horasMin + ' a ' + m.duracion.horasMax + ' horas)</b>' + b('enPie', 'cortaen') + b('fundar', 'cortafun') + '</div>';
}
/* ES1 «Escaramuzas»: batalla suelta desde el menú, con el simulador de manípulos (js/simulador.js) y sin campaña: no lee ni escribe la partida guardada.
   Se elige en tablillas de cera; «Empezar la batalla» (sello) abre la guerra; al acabar, la hoja «escfin» con el resultado. */
const milesTxt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
/* MR3b: Escaramuzas con ideas de la batalla personalizada de Rome II (estudios/MR3-menus-rome2.md): los dos bandos frente a frente
   con su escudo, su color y sus hombres; facción en escudos; tamaños con las tropas en fichas; campo con vista previa dibujada; dificultad. */
const escudoSvg = col => '<svg class="esc-esc" viewBox="0 0 40 48" aria-hidden="true"><path d="M20 2l17 6v14c0 13-8 21-17 24C11 43 3 35 3 22V8z" fill="' + col + '" stroke="#e9c063" stroke-width="2.4"/><path d="M20 8l11 4v10c0 9-5 15-11 17-6-2-11-8-11-17V12z" fill="none" stroke="rgba(255,240,200,.45)" stroke-width="1.4"/><path d="M20 14v20M13 22h14" stroke="rgba(255,240,200,.7)" stroke-width="2"/></svg>';
const CAMPO_SVG = {
  llano: '<path d="M0 26h80v18H0z" fill="#6f7d3a"/><path d="M0 26q40-3 80 0" fill="none" stroke="#8a9a4a" stroke-width="1"/>',
  colina: '<path d="M0 30q22-2 34-12t46 10v16H0z" fill="#6a7838"/><path d="M0 34h80v10H0z" fill="#5d6a30"/>',
  bosque: '<path d="M0 27h80v17H0z" fill="#5e6c32"/>' + [8, 18, 27, 52, 61, 70, 40].map((x, i) => '<path d="M' + x + ' ' + (14 + (i % 3) * 2) + 'l5 12h-10z" fill="#2f4420"/>').join(''),
  mixto: '<path d="M0 30q18-1 28-8t30 6 22 2v14H0z" fill="#6a7838"/>' + [60, 68, 74].map(x => '<path d="M' + x + ' 16l4 11h-8z" fill="#2f4420"/>').join('')
};
const campoPrev = (k, colE) => '<svg viewBox="0 0 80 44" aria-hidden="true"><defs><linearGradient id="ecielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb6c4"/><stop offset="1" stop-color="#e7d3a0"/></linearGradient></defs><rect width="80" height="44" fill="url(#ecielo)"/>' + (CAMPO_SVG[k] || CAMPO_SVG.llano) +
  '<rect x="10" y="35" width="16" height="4" fill="#b3261e"/><rect x="54" y="35" width="16" height="4" fill="' + colE + '"/></svg>';
/* CG2a: la pantalla de Escaramuzas es el constructor de ejército de js/ui-escaramuza.js; aquí solo el enganche */
function escHtml() { ESC.init({ pt, escudoSvg, campoPrev }); return ESC.html(); }
function escFinHtml() {
  const x = UI.escRes; if (!x) return '<div class="empty">Sin resultado.</div>';
  const R = x.res, t = { victoria: 'Victoria', derrota: 'Derrota', retirada: 'Retirada' }[R.como] || 'Fin', m = Math.floor(R.t / 60), sg = Math.round(R.t % 60);
  return '<div class="esc esc-fin"><h3 class="esc-res ' + R.como + '">' + t + '</h3><p class="esc-d">' + esc(R.motivo || '') + '</p>' +
    '<div class="esc-cif"><span>Tus bajas</span><b>' + milesTxt(R.bajas[0]) + ' de ' + milesTxt(R.inicial[0]) + '</b><span>Bajas de ' + esc(D.FACTIONS[x.fac] ? D.FACTIONS[x.fac].n : '') + '</span><b>' + milesTxt(R.bajas[1]) + ' de ' + milesTxt(R.inicial[1]) + '</b><span>Duración</span><b>' + m + ' min ' + sg + ' s</b></div>' + escHeridosHtml(R) +
    '<button class="btn ro-sello esc-go" data-act="hoja" data-v="escaramuza">Otra escaramuza</button><button class="btn ghost esc-go" data-act="hojax">Volver al menú</button></div>';
}
// CG4b (pase de CG9): muertos y heridos de cada bando, en frases cortas. Sin esos datos (resultado viejo), nada
function escHeridosHtml(R) {
  if (!R || !Array.isArray(R.muertos) || !Array.isArray(R.heridos)) return '';
  const fr = [], n = milesTxt, gano = R.como === 'victoria';
  fr.push('Tuyos: ' + n(R.muertos[0]) + ' muertos y ' + n(R.heridos[0]) + ' heridos.');
  fr.push('Del enemigo: ' + n(R.muertos[1]) + ' muertos y ' + n(R.heridos[1]) + ' heridos.');
  if (gano && R.recuperados > 0) fr.push('Te quedas con el campo: tus ' + n(R.recuperados) + ' heridos se recuperan.');
  if (R.prisioneros > 0) fr.push('Sus ' + n(R.prisioneros) + ' heridos caen prisioneros.');
  if (!gano && R.recuperados > 0) fr.push('El enemigo recoge a sus ' + n(R.recuperados) + ' heridos.');
  if (R.cautivos > 0) fr.push('Tus ' + n(R.cautivos) + ' heridos caen prisioneros.');
  return '<p class="esc-d">' + fr.map(esc).join('<br>') + '</p>';
}
function escEmpieza() {
  if (!ESC.listo()) { toast('Pon al menos un manípulo en cada bando.', 'bad'); return; }
  const e = ESC.batalla(), alFin = r => {   // sin guardar: no toca aqvila-save-v1 ni aqvila-guerra-v1
    const B = r && r.estado; UI.escRes = { res: (B && B.resultado) || { como: 'retirada', motivo: '', t: 0, bajas: [0, 0], inicial: [0, 0] }, fac: e.fac };
    setTimeout(() => { if (UI.menu) hojaAbre('escfin'); }, 0);   // después del toque en «Ver el resultado»: el oyente general cierra las hojas
  };
  /* CG4: las escaramuzas van con el simulador de manípulos (js/simulador.js) y la pantalla de mando (js/ui-mando.js); su resumen trae
     estado.resultado = {como, motivo, t, bajas, inicial, sanos, heridos, muertos, prisioneros, cautivos, recuperados}, lo que lee escFinHtml. */
  if (!window.UIMando || !window.Simulador) { toast('No se ha podido cargar la batalla.', 'bad'); return; }
  { hojaCierra(true); UI.escRes = null; const cfg = { semilla: e.semilla, ejercitos: e.ejercitos, campo: e.campo, col: (D.FACTIONS[e.fac] || {}).col }; import('./ui-batalla-rapida.js').then(() => window.UIBatallaRapida.elegir(cfg, alFin, { volver: () => hojaAbre('escaramuza') })).catch(() => window.UIMando.abrir(cfg, alFin)); return; }   // CG7 (CDe4)
}
/* MR3b «Menú principal tipo Rome 2» (estudios/MR3-menus-rome2.md, maqueta capturas-tarea/MR3-7): arriba águila y nombre; la campaña
   guardada en papiro con «Continuar» en sello (lo más grande); sin partida, el papiro es «Nueva campaña» con el general y la dificultad;
   debajo, filas de bronce con los destinos. Detrás, una escena dibujada en SVG (legión formada al atardecer): nada de imágenes. */
const AGUILA = '<svg class="maguila" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="m-br" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0bd"/><stop offset=".35" stop-color="#e9c063"/><stop offset=".7" stop-color="#a8781f"/><stop offset="1" stop-color="#6b4a12"/></linearGradient></defs><g fill="url(#m-br)" stroke="#3a2405" stroke-width="1" stroke-linejoin="round"><path id="m-ala" d="M45 47C40 36 30 22 14 8c1 6 3 9 6 12l-8-1c4 4 7 7 11 8l-8 1c5 4 9 6 14 6l-7 3c5 2 10 3 14 2l-5 4c4 1 8 1 12 0l-3 4c3 1 6 1 9 0z"/><use href="#m-ala" transform="matrix(-1 0 0 1 100 0)"/><path d="M42 62l8 13 8-13c-3 2-5 3-8 3s-5-1-8-3z"/><path d="M40 44c0-6 4-9 10-9s10 3 10 9l-4 15c-1 3-3 5-6 5s-5-2-6-5z"/><path d="M46 34c0-5 3-8 6-8 3 0 5 1 6 3 3 0 5 1 6 3-2 0-3 0-4 1l-1 2c-1 3-3 4-6 4-4 0-7-2-7-5z"/><rect x="30" y="74" width="40" height="5" rx="1"/><rect x="48" y="79" width="4" height="21"/></g><g fill="none" stroke="#3a2405" stroke-width=".7"><path d="M46 46q4 3 8 0M46 51q4 3 8 0M46 56q4 3 8 0"/></g><circle cx="55.5" cy="30.5" r="1.1" fill="#2a1a06"/><g fill="#5f7d2d" stroke="#2f4214" stroke-width=".5"><ellipse cx="38" cy="86" rx="2" ry="4.5" transform="rotate(-50 38 86)"/><ellipse cx="42" cy="91" rx="2" ry="4.5" transform="rotate(-25 42 91)"/><ellipse cx="62" cy="86" rx="2" ry="4.5" transform="rotate(50 62 86)"/><ellipse cx="58" cy="91" rx="2" ry="4.5" transform="rotate(25 58 91)"/></g></svg>';
const ICO_GLOBO = svgIco('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'), ICO_ESC = svgIco('<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/>'),
  ICO_ESPADA = svgIco('<path d="M14 3h7v7L9 22l-3-3zM6 15l3 3M4 17l3 3M3 21l2-2"/>'), ICO_RELOJ = svgIco('<path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9"/>'),
  ICO_AJUS = svgIco('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>');
// escena del fondo: cielo de atardecer, colinas, templo en el monte y bloques de la legión con sus estandartes (perspectiva por filas)
const MFONDO = (() => {
  const bloques = (y, h, w, n, pat, sep) => { let s = ''; const x0 = 195 - (n * w + (n - 1) * sep) / 2; for (let i = 0; i < n; i++) { const x = x0 + i * (w + sep); s += '<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#' + pat + ')"/>'; if (i % 2 === 0) s += '<path d="M' + (x + w / 2).toFixed(1) + ' ' + (y + h * .4) + 'V' + (y - h * .9) + '" stroke="#3a2a14" stroke-width="' + (h / 14).toFixed(1) + '"/><rect x="' + (x + w / 2 - h * .18).toFixed(1) + '" y="' + (y - h * .85).toFixed(1) + '" width="' + (h * .36).toFixed(1) + '" height="' + (h * .42).toFixed(1) + '" fill="#a3231a"/>'; } return s; };
  return '<svg id="mfondo" viewBox="0 0 390 844" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><defs>' +
    '<linearGradient id="mcielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140f17"/><stop offset=".1" stop-color="#3a2530"/><stop offset=".17" stop-color="#9a5232"/><stop offset=".214" stop-color="#e2a457"/><stop offset=".222" stop-color="#6b4a2a"/><stop offset=".4" stop-color="#2a1d12"/><stop offset="1" stop-color="#0b0806"/></linearGradient>' +
    '<radialGradient id="msol" cx="72%" cy="15%" r="30%"><stop offset="0" stop-color="#ffd98a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>' +
    '<pattern id="mt1" width="3" height="4" patternUnits="userSpaceOnUse"><rect width="2" height="4" fill="#3d1712"/><rect width="2" height="1" fill="#8a7a5a"/></pattern>' +
    '<pattern id="mt2" width="4.5" height="6" patternUnits="userSpaceOnUse"><rect width="3" height="6" fill="#4a1a13"/><rect width="3" height="1.4" fill="#a08a5c"/></pattern>' +
    '<pattern id="mt3" width="7" height="9" patternUnits="userSpaceOnUse"><rect width="5" height="9" fill="#5a1f16"/><rect width="5" height="2" fill="#b39a64"/><rect x="5" width="2" height="9" fill="#2a1a10"/></pattern>' +
    '<linearGradient id="mbaja" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0806" stop-opacity="0"/><stop offset="1" stop-color="#0b0806"/></linearGradient></defs>' +
    '<rect width="390" height="844" fill="url(#mcielo)"/><rect width="390" height="400" fill="url(#msol)"/><circle cx="282" cy="138" r="20" fill="#ffe2a0" opacity=".85"/>' +
    '<path d="M0 172q60-26 130-14t120-10 140 6v40H0z" fill="#4a2c22"/><g fill="#2c1a14" transform="translate(0 -42)"><rect x="72" y="182" width="40" height="4"/><path d="M70 182l22-10 22 10z"/><rect x="75" y="186" width="3" height="14"/><rect x="83" y="186" width="3" height="14"/><rect x="91" y="186" width="3" height="14"/><rect x="99" y="186" width="3" height="14"/><rect x="107" y="186" width="3" height="14"/></g>' +
    '<path d="M0 182q90-14 200-6t190-4v30H0z" fill="#33231a"/><rect y="194" width="390" height="650" fill="#2a1f14"/>' +
    bloques(190, 8, 28, 8, 'mt1', 9) + bloques(205, 12, 42, 6, 'mt2', 11) + bloques(228, 18, 66, 4, 'mt3', 14) +
    '<rect y="236" width="390" height="220" fill="url(#mbaja)"/><rect y="455" width="390" height="389" fill="#0b0806"/></svg>';
})();
// lo que se lee de la partida guardada sin cargarla (no toca el estado del juego)
function infoGuardada() {
  try {
    const r = JSON.parse(localStorage.getItem('aqvila-save-v1') || 'null'), st = r && (r.t != null ? r : r.state || r.s); if (!st || st.t == null) return null;
    const cs = st.cities || {}, ids = Object.keys(cs), mias = ids.filter(k => cs[k] && cs[k].owner === 'roma');
    let hombres = 0; for (const k of mias) for (const u in (cs[k].units || {})) hombres += cs[k].units[u] || 0;
    for (const m of (st.marches || [])) if (m.owner === 'roma') for (const u in (m.units || {})) hombres += m.units[u] || 0;
    return { fecha: G.dateStr(st.t, st.anio0), gen: st.hero && st.hero.name || '', mias: mias.length, total: ids.length, hombres, fin: !!st.over };
  } catch (e) { return null; }
}
function subGuardada() { const i = infoGuardada(); return i ? i.fecha : ''; }
function mFila(act, v, ico, t, d, cls) { return '<button class="mfila' + (cls ? ' ' + cls : '') + '" data-act="' + act + '"' + (v ? ' data-v="' + v + '"' : '') + '>' + ico + '<span><b>' + t + '</b><small>' + d + '</small></span><i class="mchev"></i></button>'; }
function showMenu() {
  hojaCierra(true); UI.menu = true; musicaPantalla(); $('menu').hidden = false;
  const sv = G.hasSave(), inf = sv ? infoGuardada() : null, nueva = !inf || UI.mPanel === 'nueva', nombre = 'Lucio Cornelio Escipión';
  const act = UI.difSel || 'normal', ase = UI.asesorSel !== false, DIFD = { tranquila: 'Casi sin incendios ni hambre', normal: 'Como se pensó el juego', dura: 'Más incendios, crecidas y hambre' };
  const tarjeta = nueva
    ? '<section class="mcarta ro-papiro mnueva"><div class="mct"><p class="ro-rubrica">Nueva campaña</p>' + (inf ? '<button class="mvolver" data-act="mpanel" data-v="">Volver</button>' : '') + '</div>' +
      '<p class="mtit">Roma contra Cartago</p><p class="mmeta">De 280 a 146 a.C., por todo el Mediterráneo.' + (inf ? ' <b>Empezar borra la campaña guardada.</b>' : '') + '</p>' +
      '<label class="mlab" for="hname">Tu general</label><input id="hname" maxlength="28" placeholder="Nombre de tu general" aria-label="Nombre de tu general" value="' + esc(nombre) + '">' +
      '<p class="mlab">Dificultad de la ciudad</p><div class="ro-tablilla mdif" id="dif-m">' + Object.keys(D.DIFICULTAD).map(k => '<button class="' + (k === act ? 'on' : '') + '" data-act="dif" data-v="' + k + '" data-d="m">' + (DIF_NOM[k] || k) + '<small>' + (DIFD[k] || '') + '</small></button>').join('') + '</div>' +
      '<label class="mase"><span>Consejos del asesor<small>Te avisa de lo que falta</small></span><input type="checkbox" id="ase-m" data-act="asesor" data-d="m"' + (ase ? ' checked' : '') + '><i></i></label>' +
      '<button class="btn ro-sello mcont" data-act="new"><span class="msello"></span>Empezar la campaña</button></section>'
    : '<section class="mcarta ro-papiro"><p class="ro-rubrica">Tu campaña</p><p class="mtit">' + esc(inf.fecha) + '</p>' +
      '<p class="mmeta">' + (inf.gen ? esc(inf.gen) + ' · ' : '') + inf.mias + (inf.mias === 1 ? ' ciudad' : ' ciudades') + ' · ' + milesTxt(inf.hombres) + ' soldados' + (inf.fin ? ' · <b>terminada</b>' : '') + '</p>' +
      '<div class="mprog"><i style="width:' + Math.round(100 * inf.mias / Math.max(1, inf.total)) + '%"></i></div><p class="mprogt"><span>Ciudades de Roma</span><b>' + inf.mias + ' de ' + inf.total + '</b></p>' +
      '<button class="btn ro-sello mcont" data-act="continue"><span class="msello"></span>Continuar</button></section>';
  $('menu').innerHTML = MFONDO +
    '<header class="mtop">' + AGUILA + '<div><h1>AQVILA</h1><div class="sub">El ascenso de Roma · 280–146 a.C.</div></div></header>' + tarjeta +
    '<nav class="mlista" aria-label="Menú principal">' + (nueva ? '' : mFila('mpanel', 'nueva', ICO_ESPADA, 'Nueva campaña', 'Roma contra Cartago, de 280 a 146 a.C.')) +
    mFila('hoja', 'escaramuza', ICO_ESC, 'Escaramuzas', 'Una batalla suelta, sin campaña', 'mesc') + mFila('hoja', 'corta', ICO_RELOJ, 'Partida corta', 'Italia, de 3 a 5 horas, con final') +
    mFila('newregion', 'italia', ICO_GLOBO, 'Región de Italia', 'Campaña solo en el mapa de Italia') + mFila('hoja', 'sonmenu', ICO_AJUS, 'Opciones', 'Sonido, fluidez y copias de la partida') + '</nav>' + novedadesHtml() +
    '<div class="mcred">' + CREDITOS + '</div><div class="spqr">S·P·Q·R</div>';
}
/* CDe3: «Versión v… · Novedades» abajo en el menú; al tocarlo, hoja de papiro con lo nuevo y las 3 versiones anteriores (js/novedades.js) */
function novedadesHtml() {
  const N = window.NOVEDADES; if (!N || !N.length) return '';
  const ver = e => '<section class="nv-v"><p class="ro-rubrica">Versión v' + e.v + ' · ' + esc(e.fecha) + '</p><ul>' + e.cosas.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul></section>';
  const A = N.avance, barra = A ? '<div class="mav"><p>Hacia la 1.0: <b>' + A.hecho + ' % hecho</b> · queda ' + (100 - A.hecho) + ' %</p><div class="mprog"><i style="width:' + A.hecho + '%"></i></div></div>' : '';
  const falta = A && A.pendientes.length ? '<section class="nv-v"><p class="ro-rubrica">Hacia la 1.0: ' + A.hecho + ' % hecho · lo que queda</p><ul>' + A.pendientes.map(p => '<li>' + esc(p.t) + ' <small>(' + p.e + ')</small></li>').join('') + '</ul></section>' : '';
  return barra + '<button class="mver" data-act="novedades">Versión v' + N[0].v + ' · Novedades</button>' +
    (UI.novedades ? '<div class="mnov" data-act="novedades"><div class="nv-hoja ro-papiro"><div class="nv-t"><p class="mtit">Lo nuevo</p><button class="mvolver" data-act="novedades">Cerrar</button></div>' + ver(N[0]) + (N.length > 1 ? '<p class="nv-ant">Antes</p>' + N.slice(1, 4).map(ver).join('') : '') + (falta ? '<p class="nv-ant">Lo que falta</p>' + falta : '') + '</div></div>' : '');
}
{ let tv = 0; const sf = () => { clearTimeout(tv); tv = setTimeout(() => { UI.svDown = false; }, 150); };   // Saber: no repintar entre pulsar y soltar
  document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('.sv')) { UI.svDown = true; clearTimeout(tv); tv = setTimeout(() => { UI.svDown = false; }, 1500); } }, true);
  document.addEventListener('pointerup', sf, true); document.addEventListener('pointercancel', sf, true); }
{ const cu = () => $('cuentas'); let tm = 0;   // no repintar la hoja entre pulsar y soltar: se perderían los toques
  const fin = () => { clearTimeout(tm); tm = setTimeout(() => { UI.cuDown = false; }, 120); };
  document.addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('#cuentas')) { UI.cuDown = true; clearTimeout(tm); tm = setTimeout(() => { UI.cuDown = false; }, 1500); } }, true);
  document.addEventListener('pointerup', fin, true); document.addEventListener('pointercancel', fin, true); }
function startGame() {
  UI.mPanel = ''; if (window.Carga) window.Carga.velo('Preparando las legiones');   // MR3b: si aún faltan soldados o edificios, la pantalla de carga tapa hasta que llegan (15 s como mucho)
  hojaCierra(true); hojaEstCierra(); UI.menu = false; $('menu').hidden = true; UI.sel = null; if (UI.map) UI.map.encuadre(); UI.cityList = false;
  const sitio = G.fundando() ? G.modo().inicio.fundar.sitio : null, cap = S() && S().capital;
  UI.city = sitio || (cap && S().cities[cap] ? cap : 'roma');   // I8: en «fundar de la nada» la ciudad es el sitio; con capital propia, esa
  if (sitio) { UI.tab = 'city'; iniciarFundar(); } else { UI.cityList = false; setTab('city'); }
  UI.pasando = false; UI.hojaPend = !sitio && !!(G.hojaEstacion && G.hojaEstacion());   // ES20: al cargar, la hoja de la última estación (sale tras «Dónde lo dejaste»)
}
/* I8: «Fundar de la nada». Con el reloj parado (G.fundando) se abre la pantalla de fundar; si la vista 3D aún carga, se reintenta en 0,4 s. */
function iniciarFundar() {
  clearTimeout(UI.fundarT); if (!G.fundando() || UI.menu) return;
  const sitio = G.modo().inicio.fundar.sitio;
  if (!UI.cityV || !UI.cityV.listo) { UI.fundarT = setTimeout(iniciarFundar, 400); return; }
  if (UI.fundar) return;
  if (UI.modalOpen || UI.modalQ.length) { UI.fundarT = setTimeout(iniciarFundar, 400); return; }   // primero los avisos de época que haya en cola
  UI.city = sitio; UI.tab = 'city';
  if (UI.abrirFundar(sitio, alFundarModo)) lineaPon('Tus colonos han llegado a ' + D.COLONIAS[sitio].n + ': elige dónde fundar.', 'aviso');
  else UI.fundarT = setTimeout(iniciarFundar, 600);
}
function alFundarModo(sitio) { UI.city = sitio; UI.overShown = false; G.save(); UI.cityList = false; setTab('city'); toast('Has fundado ' + D.CITIES[sitio].n + ': es tu capital.', ''); }
function fundarCancelado() {   // sin ciudad no hay partida a la que volver: se ofrece reabrir la pantalla o salir al menú (la partida queda guardada)
  carta('<div class="yr">COLONOS</div><h2>Aún no has fundado</h2><p>Tus colonos esperan en ' + esc(D.COLONIAS[G.modo().inicio.fundar.sitio].n) + '. La partida no empieza hasta que elijas el lugar.</p><div class="acts"><button class="btn ghost" data-act="tomenu">Volver al menú</button><button class="btn gold" data-act="refundar">Elegir el lugar</button></div>', true);
}
function showOver() {
  const s = S(), o = s.over; if (!o || UI.overShown) return; UI.overShown = true;
  if (o.resumen) { showOverCorta(o); return; }
  carta('<div class="yr">' + (o.win ? 'VICTORIA' : 'DERROTA') + '</div><h2>' + (o.win ? 'Roma Victrix' : 'Vae victis') + '</h2><p>' + esc(o.why) + '</p>' +
    '<p>Ciudades: <b>' + G.myCities().length + '</b> de ' + G.ciudadesRegion().length + ' · Batallas: <b>' + s.stats.wins + '/' + s.stats.battles + '</b> ganadas\nEnemigos abatidos: <b>' + s.stats.kills + '</b> · Bajas propias: <b>' + s.stats.lost + '</b>\n' + esc(s.hero.name) + ', nivel <b>' + s.hero.lvl + '</b></p>' +
    '<div class="acts"><button class="btn" data-act="tomenu">Volver al menú</button></div>', true);
}

/* I8: final de la partida corta: resumen en llano, sin nota ni puntuación */
function showOverCorta(o) {
  const r = o.resumen, md = D.MODOS[r.modo], ini = md && md.inicio && md.inicio[r.inicio], ed = r.edad || 1, edn = D.SABER.edadNombres[ed - 1] || '';
  const hr = r.horas, hTxt = hr < 0.95 ? 'menos de una hora' : hr < 1.05 ? 'una hora' : 'unas ' + String(Math.round(hr * 10) / 10).replace('.', ',') + ' horas';
  const f = (k, v) => '<div class="rs-f"><span>' + k + '</span><b>' + v + '</b></div>';
  carta('<div class="yr">' + (o.win ? 'VICTORIA' : 'DERROTA') + '</div><h2>' + (o.win ? 'Roma Victrix' : 'Vae victis') + '</h2><p>' + esc(o.why) + '</p>' +
    '<div class="resumen"><div class="rs-t">' + esc(md ? md.n : 'Partida') + (ini ? ' · ' + esc(ini.n) : '') + '</div>' +
    f('Año al terminar', r.anio + ' a.C.') + f('Estaciones jugadas', r.turnos) + f('Tiempo de juego', hTxt + ' (estimado)') +
    f('Ciudades que tenías', r.ciudades + (r.fundadas ? ' (' + r.fundadas + (r.fundadas === 1 ? ' fundada' : ' fundadas') + ' por ti)' : '')) +
    f('Batallas ganadas', r.victorias + ' de ' + r.batallas) + f('Enemigos abatidos', r.bajasEnemigas) + f('Bajas propias', r.bajasPropias) +
    f('Edad alcanzada', 'Edad ' + ['I', 'II', 'III', 'IV'][ed - 1] + (edn ? ' · ' + esc(edn) : '')) + f(esc(s_name()), 'nivel ' + r.heroe) + notaHtml(r.nota) + '</div>' +
    '<div class="acts"><button class="btn" data-act="tomenu">Volver al menú</button></div>', true);
}
/* CN18: la nota de la partida corta (1 a 10) con sus criterios y lo que la sube o baja */
const notaHtml = n => !n ? '' : '<div class="nota"><b>' + n.nota + '</b><small>de 10 · dificultad más dura: ' + esc(n.difNombre) + '</small></div>' + n.criterios.map(q => '<div class="rs-n"><span>' + esc(q.n) + ' <small>(' + esc(q.d) + ')</small></span><b>' + q.v.toFixed(1).replace('.', ',') + '</b></div>').join('') +
  (n.apagados.length ? '<div class="rs-nn">Sucesos apagados (' + esc(n.apagados.join(', ')) + '): -' + String(n.penal).replace('.', ',') + '.</div>' : '') + (n.mul !== 1 ? '<div class="rs-nn">La dificultad ' + esc(n.difNombre) + ' multiplica por ' + String(n.mul).replace('.', ',') + '.</div>' : '');
const s_name = () => (S() && S().hero && S().hero.name) || 'General';

/* ---------- HUD ---------- */
/* CDe3: UNA tira arriba (recursos clave, fecha y «Pasar estación»). Al tocarla se despliega #tpanel con todo lo demás.
   TIRA es la lista de lo que enseña la tira: la fase 2 la cambia en esta línea (si un nombre no está en s.res ni en s.bienes, no se pinta). */
const TIRA = ['denarios', 'grano', 'aceite', 'vino', 'materiales'];
const fmtK = n => { n = Math.floor(n); return n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',') + 'k' : String(n); };
const valorTira = (s, r) => s.res && typeof s.res[r] === 'number' ? G.reserva(r) :   /* ES20: una sola reserva */ s.bienes && typeof s.bienes[r] === 'number' ? s.bienes[r] : null;
const iconoTira = r => D.RES_ICON[r] || (window.MERCADO && window.MERCADO.PRODUCTOS[r] && window.MERCADO.PRODUCTOS[r].i) || (D.ESPECIAL && D.ESPECIAL[r] && D.ESPECIAL[r].i) || '';
function buildTop() { $('tira-b').dataset.act = 'tira'; }
/* la tira: icono y cifra corta de cada recurso de TIRA; en rojo si se va a perder al cerrar la estación, en oro si el almacén está lleno */
function tiraPinta(s, p, pr) {
  const h = TIRA.map(r => {
    const v = valorTira(s, r); if (v === null) return '';
    const esRes = D.RES.indexOf(r) >= 0, cap = esRes ? G.capDe(r) : 0, pierde = !!(esRes && pr && pr[r] && pr[r].perdera >= 1), lleno = !!(esRes && cap > 0 && G.reserva(r) >= cap - 1);
    return '<span class="tr' + (pierde ? ' pierde' : lleno ? ' full' : '') + '" title="' + esc(RES_NOM[r] || (window.MERCADO && window.MERCADO.PRODUCTOS[r] && window.MERCADO.PRODUCTOS[r].n) || (D.ESPECIAL && D.ESPECIAL[r] && D.ESPECIAL[r].n) || r) + ': ' + fmt(v) + (pierde ? ' · se perderán ' + pr[r].perdera + ' al cerrar la estación' : lleno ? ' (almacén lleno)' : '') + '">' + iconoTira(r) + '<b>' + fmtK(v) + '</b></span>';
  }).join('');
  setTxt('tira-r', h);
}
/* panel desplegable bajo la tira: todos los recursos (con producción y almacén), población, bienes, ciudades propias y el botón «Menú» */
function tpanelHtml() {
  const s = S(), c = s.cities[cityOk()], p = G.prod(), pr = G.previsionCierre(), EM = D.TURNO_MESES || 3;   // ES20: producción por estación (3 meses internos)
  const fila = r => { const cap = G.capDe(r), v = Math.round(p[r] * EM), hay = G.reserva(r), pierde = pr[r].perdera >= 1, lleno = hay >= cap - 1;
    return '<div class="tp-f' + (pierde ? ' pierde' : lleno ? ' full' : '') + '"><i>' + D.RES_ICON[r] + '</i><span>' + esc(RES_NOM[r] || r) + '</span><b>' + fmt(hay) + '</b><em>' + (v >= 0 ? '+' : '') + v + ' por estación</em><small>caben ' + fmt(cap) + (pierde ? ' · al cerrar la estación se pierden ' + pr[r].perdera : '') + '</small></div>'; };
  const b = G.bienes(), pb = G.bienesPerdera(), NUEVOS = ['aceite', 'vino', 'verdura', 'lana'], ks = Object.keys(D.BIENES || {}).filter(k => (b[k] || 0) > 0 && NUEVOS.indexOf(k) < 0);
  const mesN = Math.floor(s.t + 1e-9), mensual = k => { let q = 0; try { for (const id of G.myCities()) q += (G.agroProduccion(s, id, mesN) || {})[k] || 0; } catch (e) { q = 0; } return Math.round(q); };
  const filaN = k => { const P = window.MERCADO && window.MERCADO.PRODUCTOS[k], q = mensual(k) * EM; return '<div class="tp-f' + (pb[k] >= 1 ? ' pierde' : '') + '"><i>' + (P ? P.i : '') + '</i><span>' + esc(P ? P.n : k) + '</span><b>' + fmt(b[k] || 0) + '</b><em>' + (q > 0 ? '+' + q + ' por estación' : '') + '</em></div>'; };
  const bien = k => '<span class="tp-bn' + (pb[k] >= 1 ? ' pierde' : '') + '" title="' + esc(D.ESPECIAL[k].n) + '">' + D.ESPECIAL[k].i + ' ' + esc(D.ESPECIAL[k].n) + ' <b>' + Math.floor(b[k]) + '</b></span>';
  const guerra = UI.tab === 'map' || UI.tab === 'army', nm = s.marches.filter(m => m.owner === 'roma').length;
  return '<div class="tp-fecha"><span>' + esc(G.dateStr(s.t)) + '</span><span>Recursos por estación</span></div><div class="tp-sec">' + esc(D.CITIES[cityOk()].n.toUpperCase()) + ' · RECURSOS</div>' + D.RES.map(fila).join('') + NUEVOS.map(filaN).join('') +
    '<div class="tp-pob"><i>' + D.POP_ICON + '</i><span>Población</span><b>' + fmt(c.pop || 0) + '</b><small>Hombres para reclutar en tus ciudades: ' + fmt(G.hombres()) + '</small></div>' +
    (guerra ? '<div class="tp-pob"><i>' + D.GUERRA_ICON.casco + '</i><span>Reclutas aquí</span><b>' + fmt(G.recruits(c)) + '</b><small>' + nm + (nm === 1 ? ' marcha' : ' marchas') + ' en curso</small></div>' : '') +
    (ks.length ? '<div class="tp-sec">BIENES GUARDADOS</div><div class="tp-bienes">' + ks.map(bien).join('') + '</div>' : '') +
    '<div class="tp-sec">TUS CIUDADES</div><div class="tp-ciu">' + cityMenuHtml() + '</div>' +
    '<div class="tp-pie"><button type="button" data-act="hoja" data-v="ciudad">Ficha de ' + esc(D.CITIES[cityOk()].n) + '</button><button type="button" data-act="cuentas">Cuentas</button><button type="button" data-act="mercadoui">Mercado</button><button type="button" class="tp-menu" data-act="menumodo">Menú</button></div>';
}
function tpanelPinta(forzar) { const e = $('tpanel'); if (!e || e.hidden || !S()) return; const h = G.fundando() ? '<div class="tp-pie"><button type="button" class="tp-menu" data-act="menumodo">Menú</button></div>' : tpanelHtml();   // antes de fundar: solo «Menú»
  if (forzar || e.dataset.k !== h) { e.dataset.k = h; e.innerHTML = h; } }
function tpanelCierra() { const e = $('tpanel'); if (e && !e.hidden) { e.hidden = true; $('tira-b').setAttribute('aria-expanded', 'false'); } }
/* ES20: hoja de estación. Una sola tarjeta al pasar estación (y al cargar la partida si la hay): lo que entra, lo que se acabó,
   lo que acabará la próxima estación, lo que pasó y el consejo. «Ver más» enseña las listas enteras; «A trabajar» la cierra. */
const HE_CORTO = { acaba: 3, siguiente: 2, pasa: 2, avisos: 2 };
function hojaEstHtml(h, mas) {
  const lista = l => (Array.isArray(l) ? l : []).map(q => typeof q === 'string' ? { k: '', x: q } : q && q.x ? q : null).filter(Boolean);
  const L = { acaba: lista(h.acaba), siguiente: lista(h.siguiente), pasa: lista(h.pasa), avisos: lista(h.avisos).slice(0, 3) };
  const corta = k => mas ? L[k] : L[k].slice(0, HE_CORTO[k]), sobra = k => !mas && L[k].length > HE_CORTO[k] ? L[k].length - HE_CORTO[k] : 0;
  const lin = q => '<div class="he-l' + (q.k === 'bad' ? ' mal' : q.k === 'good' ? ' bien' : '') + '">' + esc(q.x) + '</div>';
  const sec = (k, t, vacio) => '<div class="he-s he-' + k + '"><b class="he-st">' + t + '</b>' + (L[k].length ? corta(k).map(lin).join('') + (sobra(k) ? '<div class="he-l he-mas">y ' + sobra(k) + ' más</div>' : '') : vacio ? '<div class="he-l he-vacio">' + vacio + '</div>' : '') + '</div>';
  const res = D.RES.map(r => { const a = (h.entra && h.entra[r]) || { recogido: 0, gastado: 0, perdido: 0, ahora: G.reserva(r) };
    return '<div class="he-r"><span class="he-ri">' + D.RES_ICON[r] + '<b>' + fmt(a.ahora) + '</b></span><span class="he-rn">' + esc(RES_NOM[r] || r) + '</span><small>+' + fmt(a.recogido) + (a.gastado - (a.ordenado || 0) >= 1 ? ' · −' + fmt(a.gastado - (a.ordenado || 0)) : '') + '</small>' + (a.ordenado >= 1 ? '<small class="ord">−' + fmt(a.ordenado) + ' en obras y tropas</small>' : '') + (a.perdido > 0 ? '<small class="mal">−' + fmt(a.perdido) + ' sin sitio</small>' : '') + '</div>'; }).join('');
  const hayMas = Object.keys(HE_CORTO).some(k => L[k].length > HE_CORTO[k]);
  const sen = D.SENADO.sala && G.senadoSala() ? '<button class="btn ro-bronce" data-act="inf-senado" id="inf-senado">Ir al Senado</button>' : '';   // SN2
  return '<i class="inf-sello">' + RO_LACRE + '</i><div class="inf-t">' + esc(h.titulo || G.dateStr(S().t)) + '</div><div class="he-cu">' +
    '<div class="he-s he-entra"><b class="he-st">Entra</b><div class="he-rs">' + res + '</div></div>' +
    sec('acaba', 'Se acaba', 'Nada terminó esta estación.') + sec('siguiente', 'La próxima estación', 'Nada termina la próxima estación.') + sec('pasa', 'Pasa', '') + sec('avisos', 'Consejo', '') + '</div>' +
    '<div class="inf-b">' + (hayMas ? '<button class="btn ro-tinta" data-act="inf-mas" id="inf-mas">' + (mas ? 'Ver menos' : 'Ver más') + '</button>' : '') + sen + '<button class="btn ro-sello" data-act="inf-cierra" id="inf-seguir">Empezar la estación</button></div>';
}
function hojaEstMuestra(mas) {
  const h = G.hojaEstacion && G.hojaEstacion(); let el = $('inf');
  if (!h || !S() || S().over) { hojaEstCierra(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'inf'; document.body.appendChild(el); }
  el.className = 'inf ro-carta hojaest' + (mas ? ' mas' : ''); el.innerHTML = hojaEstHtml(h, !!mas); UI.hojaEstMas = !!mas; UI.pasando = false;
  document.body.classList.add('conhojaest'); UI.dirty = true;
}
function hojaEstCierra() { const el = $('inf'); if (el) el.remove(); document.body.classList.remove('conhojaest'); UI.hojaEstMas = false; }
const consejoModal = () => hojaEstMuestra(false);   // nombre viejo (UI.consejoModal)
/* la hoja pendiente sale cuando no hay modal, batalla por decidir o en curso, ni fuego; hasta entonces «Pasar estación» sigue cerrado */
function hojaEstEspera() {
  const s = S(); if (!UI.hojaPend || !s || UI.menu) return;
  if (s.over) { UI.hojaPend = false; UI.pasando = false; return; }
  if (UI.modalOpen || UI.nueva || UI.modalQ.length || s.pending.length || s.vivo || UI.fundar) return;
  UI.hojaPend = false; hojaEstMuestra(false);
}
UI.infoMas = function () { if ($('inf')) hojaEstMuestra(!UI.hojaEstMas); };
UI.infoCierra = function () { hojaEstCierra(); UI.dirty = true; };
/* el botón «Pasar estación»: dice a qué estación se pasa */
const ESTA_A = { Primavera: 'a la primavera', Verano: 'al verano', 'Otoño': 'al otoño', Invierno: 'al invierno' };
const estSiguiente = s => G.estacion(G.finTurno() + 0.01);
const ICO_GOB = svgIco('<path d="M3 20h18M5 20V9h14v11M3 9h18M9 20v-6h6v6M12 4v5"/>');
function cityOk() { const my = G.myCities(); if (!my.includes(UI.city)) UI.city = my[0] || 'roma'; return UI.city; }
function setTxt(id, v) { const e = $(id); if (e && e.dataset.k !== v) { e.dataset.k = v; e.innerHTML = v; } }
/* MN1: barra de seis (Ciudad · Senado · Saber · Tropas · Mapa · Imperio). Sin modos: cada pestaña marca su botón */
const BARRA_DE = { city: 'ciudad', senado: 'senado', saber: 'saber', army: 'tropas', map: 'mapa', imperio: 'imperio', hero: 'imperio' };
function hudDock() {
  musicaPantalla();
  const s = S(); if (!s || G.fundando()) return; cityOk(); const nm = s.marches.filter(m => m.owner === 'roma').length;
  const t3 = UI.tab === 'city' && UI.cityList && UI.cityV ? '' : (BARRA_DE[UI.tab] || '');
  document.querySelectorAll('#tabs3 button').forEach(b => { const on = b.dataset.v === t3; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); $('app').dataset.tab = t3; $('app').dataset.vista = UI.tab; $('app').toggleAttribute('data-sala', UI.tab === 'senado' && (UI.senT || 'hoy') === 'hoy' && !!G.senadoSala());   // MN2: solo en la pestaña «Hoy se vota»   // SN2: en la sala, Votar y Dejar pasar van abajo y «Pasar estación» sube a la tira
  $('app').toggleAttribute('data-sello', t3 !== 'ciudad');   // ES20: «Pasar estación» grande sobre la barra; en la ciudad, en la tira de arriba (no tapa Construir)
  const bm = $('bmarchas'); bm.hidden = UI.tab !== 'map'; setTxt('bmarchas', D.GUERRA_ICON.espadas + '<span>Marchas</span>' + (nm ? '<i>' + nm + '</i>' : ''));
}
/* Entrar en una ciudad propia desde el mapa: con el vuelo de cámara si se puede */
function entrarEn(id) { UI.city = id; if (UI.map && propiaEntrable(id) && !UI.map.esc.entrando) { UI.sel = id; UI.map.entrarCiudad(id); } else { UI.cityList = false; setTab('city'); } }
/* I8b: antes de fundar, la barra muestra lo que traen los colonos (sin producción ni almacén aún); aún no se puede pasar estación */
function hudFundando(s) {
  tiraPinta(s);
  $('date').textContent = (G.polis() ? D.POLIS[G.polis()].n + ' · ' : '') + G.dateStr(s.t); $('turno').hidden = true;
}
function tickUI() {
  const s = S(); if (s && !UI.camVic && !UI.modalOpen && s.caminos && s.caminos.victoria && !s.caminos.victoriaVista && window.CAMINOS_UI) camVictoria();   // CDe4: pantalla de victoria por caminos
  if (!s) return;
  hojaEstEspera();   // ES20: la hoja que espera a que se cierre una carta, una batalla o un fuego
  if (G.fundando()) { hudFundando(s); return; }   // I8: sin ciudad aún no hay cuentas; I8b: la barra enseña lo que traen los colonos
  if (UI.map && UI.map.cities) for (const id in UI.map.cities) { if (!D.CITIES[id] || !D.CITIES[id].antes) continue; const sp = UI.map.cities[id].el.querySelector('span'); if (sp && sp.textContent !== D.CITIES[id].n) sp.textContent = D.CITIES[id].n; }   // H14: el nombre del mapa cambia con la fecha (Poblado íbero → Carthago Nova)
  const p = G.prod(), pr = G.previsionCierre();
  tiraPinta(s, p, pr); tpanelPinta();
  renderCuentas(); hojaPinta();
  const c = s.cities[cityOk()];
  hudDock();
  $('date').textContent = (G.polis() ? D.POLIS[G.polis()].n + ' · ' : '') + G.dateStr(s.t);
  /* ES20: «Pasar estación» siempre a la vista (no con un modal ni con la hoja de estación abiertos; en batalla la pantalla es otra) */
  const sig = estSiguiente(s), tu = $('turno'); tu.hidden = !!(s.over || UI.modalOpen || UI.pasando || UI.hojaPend || $('inf')); tu.title = 'Pasar a la estación siguiente: ' + sig.toLowerCase();
  setTxt('turno', '<i class="tu-lacre">' + RO_LACRE + '</i><b>Pasar estación</b><span class="tu-est"> · ' + (ESTA_A[sig] || sig) + '</span>');
  document.querySelectorAll('[data-t1]').forEach(e => {
    const t0 = +e.dataset.t0, t1 = +e.dataset.t1, f = Math.max(0, Math.min(1, (s.t - t0) / (t1 - t0)));
    const bar = e.querySelector('i'); if (bar) bar.style.width = (f * 100).toFixed(1) + '%';
    const rem = e.parentElement.querySelector('.rem'); if (rem) rem.textContent = s.t < t0 ? 'en cola' : quedanTxt(t1);
  });
  document.querySelectorAll('[data-need]').forEach(b => b.classList.toggle('no', !G.canAfford(JSON.parse(b.dataset.need))));
  document.querySelectorAll('[data-have]').forEach(e => { e.textContent = 'de ' + fmt(G.disponible(e.dataset.have)); });
  if (UI.tab === 'city' && UI.cityV && !UI.cityList && !UI.fundar && !$('citywrap').hidden) { const m = cityMeta(c), k = metaKey(m); if (k !== UI.metaK) renderCity3D(); else { UI.cityV.meta = m; cityPantalla(); pintaLinea(); } }
}

/* C1: ¿se puede abrir la ciudad 3D desde el mapa? Solo las propias y con la vista ya cargada */
function propiaEntrable(id) { const s = S(); return !!(s && s.cities[id] && s.cities[id].owner === 'roma' && UI.cityV && UI.cityV.listo && G.ciudadE(id) && !UI.fundar); }
function volverAlMapa() { UI.deMapa = false; setTab('map'); if (UI.map) UI.map.restaurar(); }

/* ---------- paneles ---------- */
function setTab(t) {
  if (UI.cityV && UI.cityV.enCalles) UI.cityV.calles(false); document.body.classList.remove('encalles');   // CD2a: al cambiar de pestaña se sale del modo calles
  if (window.MINISTROS_UI) MINISTROS_UI.cerrar();   // CDe1: la hoja de ministros no sobrevive al cambio de pestaña
  if (UI.fundar) cerrarFundar(true);
  eaCierra(); UI.tab = t; hojaCierra(true); $('popsheet').hidden = true; $('cuentas').hidden = true; tpanelCierra();
  const c3 = t === 'city' && UI.cityV && !UI.cityList;            // ciudad en 3D
  if (!c3 && UI.cityV && UI.cityV.enPlano) UI.cityV.plano(false, null, true);   // CV1: al salir de la ciudad, el plano se apaga (o en lista si se prefiere)
  $('view').hidden = t === 'map' || c3; $('zoom').hidden = t !== 'map'; $('citywrap').hidden = !c3; $('ctop').hidden = !c3; $('csheet').hidden = !c3; UI.linK = null; if (!c3) $('linea').hidden = true;
  if (c3) { UI.cityV.resize(); renderCity3D(); }
  if (t !== 'city') UI.deMapa = false;
  if (t === 'map') renderSheet(); else { $('sheet').hidden = true; $('view').scrollTop = 0; render(); }
  hudDock();
}
function cityChips() { cityOk(); return ''; }      // el selector de ciudad ya no son fichas fijas: es el desplegable de arriba
/* Cuentas de la estación (Q3; ES20: lo que corre se da por estación, 3 meses internos) */
const sg = (n, d) => (n >= 0 ? '+' : '−') + (Math.abs(n) >= 100 ? Math.round(Math.abs(n)) : Math.abs(n).toFixed(d === undefined ? 1 : d));
function cuentasHtml() {
  const s = S(), c = s.cities[cityOk()], cu = G.cuentas(), o = cu.denarios, mercado = G.tradeRate() > 0, avisos = [], om = G.obraMayor(), ob = om ? om.id : null, EM = D.TURNO_MESES || 3; const of = G.fiestaInfo(cityOk(), 'ofrenda');
  const fila = r => { const m = cu.mat[r], tope = Math.max(1, m.entra * EM, m.comprometido + Math.max(0, m.queda)), pc = Math.min(100, Math.round(m.comprometido / tope * 100)), pq = Math.max(0, Math.min(100 - pc, Math.round(Math.max(0, m.queda) / tope * 100)));
    if (m.perdera >= 1) avisos.push('<div class="cu-aviso" data-r="' + r + '">⚠ <span>' + RES_NOM[r] + ': al cerrar la estación habrá ' + Math.floor(m.queda) + ', caben ' + Math.floor(m.caben) + ', <b>se pierden ' + Math.floor(m.perdera) + '</b></span></div><div class="cu-btns"><button class="btn" data-act="cuvender" data-v="' + r + '"' + (mercado ? '' : ' disabled') + '>Vender en el mercado</button>' + (ob ? '<button class="btn" data-act="cuobra" data-v="' + ob + '">Ir a la obra de ' + esc(D.CITIES[ob].n) + '</button>' : '') + (of.motivo ? '' : '<button class="btn" data-act="fiesta" data-v="ofrenda">' + D.FIESTAS.ofrenda.i + ' Ofrenda con lo que sobra · ' + D.RES_ICON.denarios + fmt(of.coste) + '</button>') + (mercado ? '' : '<small>Sin mercado: construye uno para vender.</small>') + '</div>');
    return '<div class="cu-fila"><span class="cu-ic">' + D.RES_ICON[r] + '</span><div class="cu-cen"><div class="cu-l1"><b>' + RES_NOM[r] + '</b> <span>entra ' + Math.round(m.entra * EM) + ' por estación</span></div><div class="cu-bar"><i class="c" style="width:' + pc + '%"></i><i class="q" style="width:' + pq + '%"></i></div></div>' +
      '<div class="cu-der"><b class="' + (m.queda >= 0 ? 'ok' : 'mal') + '">' + sg(m.queda, 0) + '</b><span>guardas ' + Math.floor(m.alAlmacen) + '</span></div></div>' + (m.perdera >= 1 ? avisos.pop() : ''); };
  const impu = Object.keys(D.IMPUESTOS).map(k => '<button class="chip ' + ((c.imp || 'normal') === k ? 'on' : '') + '" data-act="imp" data-v="' + k + '">' + D.IMPUESTOS[k].n + '</button>').join('');
  const l = (n, v, mal) => { v *= EM; const z = Math.abs(v) < 0.05; return '<div><span>' + n + '</span><b class="' + (z ? '' : mal ? 'mal' : 'ok') + '">' + (z ? '0' : sg(mal ? -v : v)) + '</b></div>'; };
  return '<div class="cu-top"><div class="tt">Cuentas de ' + G.estacion(s.t).toLowerCase() + '</div><button class="cu-x" data-act="cux" aria-label="Cerrar">✕</button></div>' +
    '<div class="cu-sec"><span>RECURSOS</span><div class="cu-imp"><small>Impuestos de ' + esc(D.CITIES[c.id || UI.city].n) + '</small>' + impu + '</div></div>' + ['materiales', 'hierro', 'grano'].map(fila).join('') + '<div class="cu-hom">' + D.POP_ICON + '<span>Hombres para reclutar en tus ciudades: <b>' + fmt(G.hombres()) + '</b></span></div>' + bienesCu(mercado) +
    '<div class="cu-sec"><span>DENARIOS POR ESTACIÓN</span><i>' + D.RES_ICON.denarios + '</i></div><div class="cu-oro"><div class="cu-col">' + l('Impuestos', o.impuestos) + l('Foro y comercio', o.foro) + l('Rutas · puerto', o.rutas) + '</div><div class="cu-col">' + l('Edificios', o.edificios, 1) + (o.sabios >= 0.05 ? l('Sabios', o.sabios, 1) : '') + l(G.polis() ? 'Hoplitas' : 'Legiones', o.legiones, 1) + l('Obras y tropas', o.obras, 1) + (o.otros >= 0.05 ? l('Otros', o.otros, 1) : '') + '</div></div>' +
    '<div class="cu-saldo ' + (o.saldo >= 0 ? 'ok' : 'mal') + '"><span>Saldo por estación</span><b>' + (o.saldo >= 0 ? '+ ' : '− ') + Math.round(Math.abs(o.saldo * EM)) + '</b></div>';
}
/* CE2: bienes guardados en la hoja de cuentas: cuántos, cuánto entra por estación, el tope, el lujo y botones para venderlos */
function bienesCu(mercado) {
  const b = G.bienes(), m = G.bienesMes(), pb = G.bienesPerdera(), ks = Object.keys(D.BIENES).filter(k => (b[k] || 0) >= 1 || m[k]), pide = G.lujoPide();
  if (!ks.length && pide < 0.05) return '';
  const fila = k => { const n = Math.floor(b[k] || 0), p = G.precioBien(k), v = Math.min(n, 10);
    return '<div class="cu-fila cu-bien"><span class="cu-ic">' + D.ESPECIAL[k].i + '</span><div class="cu-cen"><div class="cu-l1"><b>' + esc(D.ESPECIAL[k].n) + '</b> <span>' + n + ' de ' + D.BIEN_TOPE + '</span><em>+' + (m[k] || 0) * (D.TURNO_MESES || 3) + ' por estación' + (D.LUJO.indexOf(k) >= 0 ? ' · lujo' : '') + '</em></div><div class="cu-bar"><i class="q" style="width:' + Math.min(100, Math.round(n / D.BIEN_TOPE * 100)) + '%"></i></div></div>' +
      '<div class="cu-der">' + (v >= 1 ? '<button class="btn cu-vb" data-act="cubien" data-v="' + k + '" data-n="' + v + '">Vender ' + v + '<small>+' + Math.round(v * p) + ' ' + D.RES_ICON.denarios + '</small></button>' : '<span>sin guardar</span>') + '</div></div>' +
      (pb[k] >= 1 ? '<div class="cu-aviso" data-r="' + k + '">⚠ <span>' + esc(D.ESPECIAL[k].n) + ': no caben más de ' + D.BIEN_TOPE + ', <b>se pierden ' + pb[k] + '</b></span></div><div class="cu-btns"><button class="btn" data-act="cuvender" data-v="' + k + '">Vender lo que sobra</button></div>' : ''); };
  return '<div class="cu-sec"><span>BIENES</span></div>' + ks.map(fila).join('') + (pide >= 0.05 ? '<div class="cu-lujo' + (S().lujoFalta ? ' mal' : '') + '">Tus ciudadanos ricos piden ' + String(Math.round(pide * (D.TURNO_MESES || 3) * 10) / 10).replace('.', ',') + ' de lujo por estación (vino, púrpura o plata)' + (S().lujoFalta ? ': <b>la última vez no hubo bastante</b>.' : '.') + '</div>' : '');
}
function renderCuentas(forzar) { const e = $('cuentas'); if (!e || e.hidden || !S() || (UI.cuDown && !forzar)) return; const h = cuentasHtml(); if (forzar || e.dataset.k !== h) { e.dataset.k = h; e.innerHTML = h; } }
/* K12a: HOJA INFERIOR única (menú, ajustes, mercado, rutas, pueblo…). #hoja es el panel y #hscrim el telón que oscurece. Cuerpo = HOJAS[id].html() */
const CREDITOS = 'Láminas del menú y miniaturas de edificios: renders de modelos de 0 A.D. © Wildfire Games, licencia CC BY-SA 3.0 (assets/laminas/LICENSE.txt)<br>Modelos y animaciones de las unidades: 0 A.D. © Wildfire Games, licencia CC BY-SA 3.0<br>Hastatus y galo de las batallas: cuerpo y esqueleto de MakeHuman 1.3.2, movimientos de Quaternius (Universal Animation Library), licencia CC0 1.0<br>Falangita, oficial de la falange y hastatus: modelos generados con Meshy (meshy.ai), licencia CC BY 4.0 (creativecommons.org/licenses/by/4.0)<br>Centurión, triario, vélite, galo grande (y v2a, v2b), galo rápido (y B), galo lancero y jefe galo: modelos generados por el usuario con Meshy (meshy.ai, herramienta), licencia CC BY-SA 3.0 (creativecommons.org/licenses/by-sa/3.0)<br>Sonido grabado: OpenGameArt (rubberduck, Kenney, artisticdude) y Freesound (marchelonia, marconi68, DeqstersLab, adharca, DeVern, Globofonia, felix.blume, JohnsonBrandEditing), licencia CC0 1.0<br>Gritos y quejidos de los soldados: HaelDB (OpenGameArt, OGA-BY 3.0); F.M.Audio y chripei (Freesound, CC BY 4.0); Michel Baradari (OpenGameArt, CC BY 3.0)<br>Música: «Heroic Demise (Updated Version)», «Woodland Fantasy» y «Colossal Boss Battle Theme» de Matthew Pablo (matthewpablo.com), «Varyag War Drum» de Tausdei, licencia CC BY 3.0; «Medieval: Victory Theme» y «Medieval: Defeat Theme» de RandomMind, licencia CC0 1.0 (OpenGameArt)<br>Voces de los soldados: síntesis de AQVILA con Piper (Open Home Foundation) y la voz española es_ES-sharvard-medium, entrenada con el Corpus Sharvard de Vincent Aubanel, Maria Luisa García Lecumberri y Martin Cooke (Univ. de Edimburgo), licencia CC BY 3.0<br>Personajes de las clases sociales: modelos generados por el usuario con Meshy (meshy.ai, herramienta), licencia CC BY-SA 3.0<br>Templo y bouleuterion de las ciudades griegas: modelos generados por el usuario con Meshy (meshy.ai, herramienta), licencia CC BY-SA 3.0 (creativecommons.org/licenses/by-sa/3.0)<br>Ollas, cesta, panes, fruta, queso, pescado y estera del mercado: NVIDIA Corporation, SimReady Assets, licencia CC BY 4.0 (creativecommons.org/licenses/by/4.0), reducidas y convertidas en AQVILA<br>Iconos de recursos y menús: arte propio del Proyecto AQVILA, licencia CC BY-SA 3.0<br>Letra Cinzel © The Cinzel Project Authors, licencia SIL OFL 1.1';
const HOJA_ALT = [420, 600, 770];
const ICO_AJ = svgIco('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'), ICO_MERC = svgIco('<path d="M4 8h15l-3-3M20 16H5l3 3"/>'), ICO_RUTA = svgIco('<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>'),
  ICO_PUEB = svgIco('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M16 5a3 3 0 0 1 0 6M18 14c2 1 3 3 3 6"/>'), ICO_CRON = svgIco('<path d="M7 4h11v13a3 3 0 0 1-3 3H6M7 4a2 2 0 0 0-2 2v2h2M7 4v12a3 3 0 0 1-3 3 2 2 0 0 0 2 1M10 9h5M10 13h5"/>'),
  ICO_TEMPLO = svgIco('<path d="M3 10l9-6 9 6M5 10v9M9 10v9M15 10v9M19 10v9M3 20h18"/>'), ICO_INFO = svgIco('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'), ICO_CRED = svgIco('<path d="M12 3l2.5 5.5 6 .7-4.4 4.1 1.2 5.9L12 16.3 6.7 19.2l1.2-5.9L3.5 9.2l6-.7z"/>'), ICO_FLU = svgIco('<path d="M3 17l5-6 4 4 4-7 5 6"/>');
const ICO_LIBRO = svgIco('<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1zM12 6v14"/>');   // MN1: Códice
const ICO_FOTO = svgIco('<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/>');   // CN18
const copiasHtml = () => '<button class="hf" data-act="copiaguardar">' + ICO_CRON + '<span>Guardar copia en un archivo</span></button><button class="hf" data-act="copiacargar">' + ICO_CRON + '<span>Cargar copia de un archivo</span></button>';
function menuHoja() {
  if (UI.hojaConf) return '<div class="hconf ro-carta"><p class="hq">¿Volver al menú principal?</p><p class="hs">Tu partida se guarda sola.</p><button class="hbig ro-sello" data-act="hojax">Seguir jugando</button><button class="hdisc ro-tinta" data-act="menu">Sí, volver al menú</button></div>';
  const f = (act, v, ico, txt) => '<button class="hf" data-act="' + act + '"' + (v ? ' data-v="' + v + '"' : '') + '>' + ico + '<span>' + txt + '</span></button>';
  return (window.CODICE ? f('codicem', null, ICO_LIBRO, 'Códice') : '') + f('tab', 'log', ICO_CRON, 'Crónica') + f('ayuda', null, ICO_INFO, 'Ayuda') + f('hoja', 'ajustes', ICO_AJ, 'Ajustes') + f('hoja', 'movil', ICO_FOTO, 'Postal y copias') + f('hoja', 'creditos', ICO_CRED, 'Créditos') +
    '<div class="hsep"></div><button class="hdisc hfondo" data-act="menuconf">Volver al menú principal</button>';
}
function ajustesHoja() {
  const a = G.ajustes(); if (!a) return '<div class="empty">Aún no hay partida.</div>';
  const seg = (lis, cur, act, d) => '<div class="hseg">' + lis.map(q => '<button class="chip' + (q[0] === cur ? ' on' : '') + '" data-act="' + act + '" data-v="' + q[0] + '"' + (d ? ' data-d="' + d + '"' : '') + '>' + q[1] + '</button>').join('') + '</div>';
  const tog = (txt, attrs, on, sub) => '<label class="htog"><span>' + txt + (sub ? '<small>' + sub + '</small>' : '') + '</span><input type="checkbox" ' + attrs + (on ? ' checked' : '') + '></label>';
  const sw = [['crecida', 'Crecida del río'], ['fuego', 'Incendios'], ['hambre', 'Hambre de invierno']];
  return '<div id="ajustes" class="ajh"><div class="ajf" id="dif-g"><b class="hrot">Dificultad</b>' + seg(Object.keys(D.DIFICULTAD).map(k => [k, DIF_NOM[k] || k]), a.dif || 'normal', 'dif', 'g') + '<small>Los cambios de dificultad y sucesos valen desde la estación siguiente.</small></div>' +
    '<div class="hsep"></div>' +
    tog('Consejos del asesor', 'id="ase-g" data-act="asesor" data-d="g"', !!a.asesor) + '<button class="chip hbtn" data-act="repetirasesor">Repetir los consejos</button><div class="hsep"></div><b class="hrot">Sucesos</b>' +
    sw.map(q => tog(q[1], 'data-act="suceso" data-v="' + q[0] + '"', !!a.suc[q[0]], q[0] === 'hambre' && !((D.DIFICULTAD[a.dif] || {}).hambre || {}).meses ? 'Sin efecto en Tranquila' : '')).join('') +
    '<div class="hsep"></div><button class="chip hbtn" data-act="fluidez">' + (fluidezOn() ? 'Dejar de medir fluidez' : 'Medir fluidez') + '</button><div class="hsep"></div>' + tog('Ambiente', 'id="aj-ambiente" data-act="ambiente"', G.ambiente(), 'Tono por estación, viñeta y contorno dorado en la ciudad') + '<div id="aj-sonido">' + tog('Sonido', 'data-act="sonido"', sonidoOn()) + '</div>' + tog('Preguntas de oficiales', 'id="aj-preguntas" data-act="preguntas"', preguntasOn(), 'En la batalla, tu oficial te pregunta qué hacer. La arenga sigue.') + '</div>';
}
/* MN1: el botón «Marchas» del mapa abre las marchas, el minimapa e «Ir a mi general» */
const ICO_MAPA = svgIco('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>');   // C18: minimapa
function guerraHoja() {
  const s = S(); if (!s) return '<div class="empty">Aún no hay partida.</div>';
  const nom = id => esc(((D.CITIES[id] || (D.COLONIAS && D.COLONIAS[id])) || { n: id }).n), ms = s.marches.filter(m => m.owner === 'roma');
  const f = (act, v, ico, txt) => '<button class="hf" data-act="' + act + '"' + (v ? ' data-v="' + v + '"' : '') + '>' + ico + '<span>' + txt + '</span></button>';
  return '<b class="hrot">' + (ms.length ? (ms.length === 1 ? '1 marcha en curso' : ms.length + ' marchas en curso') : 'Ninguna marcha en curso') + '</b>' +
    ms.map(m => f('vera', m.to, '🚩', 'De ' + nom(m.from) + ' a ' + nom(m.to) + ' · llega ' + llegaEn(m.t1))).join('') +
    '<div class="hsep"></div>' + (G.polis() ? '' : f('minimapa', null, ICO_MAPA, UI.map && UI.map.miniOn ? 'Ocultar minimapa' : 'Ver minimapa')) + f('home', null, D.GUERRA_ICON.aguila, 'Ir a mi general');
}
const HOJAS = {
  menu: { titulo: 'Menú', alt: 1, html: menuHoja },
  marchas: { titulo: 'Marchas', alt: 0, html: guerraHoja },
  ciudad: { get titulo() { return S() ? D.CITIES[cityOk()].n : 'Ciudad'; }, alt: 2, html: () => fichaCiudad() },   // MN1: ROMA ▾
  ajustes: { titulo: 'Ajustes', alt: 2, html: ajustesHoja },
  escaramuza: { titulo: 'Escaramuzas', alt: 2, html: () => escHtml() },   // ES1
  escfin: { titulo: 'Escaramuza', alt: 1, html: () => escFinHtml() },
  corta: { titulo: 'Partida corta', alt: 1, html: () => cortaHtml() || '<div class="empty">No disponible.</div>' },
  sonmenu: { titulo: 'Opciones', alt: 0, html: () => '<button class="hf" data-act="sonido">' + ICO_INFO + '<span>' + sonidoTxt() + '</span></button><button class="hf" data-act="musica">' + ICO_INFO + '<span>' + musicaTxt() + '</span></button><button class="hf" data-act="preguntas">' + ICO_INFO + '<span>' + preguntasTxt() + '</span></button><button class="hf" data-act="fluidez">' + ICO_FLU + '<span>' + (fluidezOn() ? 'Dejar de medir fluidez' : 'Medir fluidez') + '</span></button>' + copiasHtml() },
  movil: { titulo: 'Postal y copias', alt: 1, html: () => '<button class="hf" data-act="postal">' + ICO_FOTO + '<span>Postal de la ciudad (imagen)</span></button><button class="hf" data-act="contemplar">' + ICO_FOTO + '<span>Contemplar la ciudad</span></button><button class="hf" data-act="hoja" data-v="cronicac">' + ICO_CRON + '<span>Crónica de la ciudad (texto)</span></button>' + copiasHtml() },
  cronicac: { titulo: 'Crónica de la ciudad', alt: 2, html: () => S() ? '<pre class="hcron">' + esc(G.cronicaTexto(cityOk())) + '</pre><div class="hdos2"><button class="hf" data-act="croncopiar"><span>Copiar texto</span></button><button class="hf" data-act="crondescargar"><span>Bajar archivo .txt</span></button></div>' : '<div class="empty">Aún no hay partida.</div>' },
  creditos: { titulo: 'Créditos', alt: 0, html: () => '<div class="hcred">' + CREDITOS + '</div>' },
  mercado: { titulo: 'Mercado', alt: 1, html: () => marketHtml() || '<div class="empty">Sin mercado: construye uno para cambiar recursos.</div>' },
  rutas: { titulo: 'Rutas', alt: 2, html: () => rutasHtml(S().cities[cityOk()], UI.city) || '<div class="empty">Esta ciudad no tiene rutas.</div>' },
  pueblo: { titulo: 'Pueblo', alt: 2, html: () => { const c = S().cities[cityOk()]; return '<div class="empty">' + popHtml(c) + '</div>' + repartoHtml(c) + (c.owner === 'roma' ? '<div class="empty">' + tipoHtml(c) + '</div>' : ''); } },
  aldeas: { titulo: 'Pueblos', alt: 2, html: () => pueblosHtml(S().cities[cityOk()]) || '<div class="empty">Solo en tus ciudades.</div>' },
  servicios: { titulo: 'Templo y forja', alt: 2, html: () => { const c = S().cities[cityOk()]; return (c.b.templo > 0 ? '<div class="empty">' + diosBloque(c, 'templo') + '</div>' : '') + forjaHtml(c); } },
  estado: { titulo: 'Estado de la ciudad', alt: 1, html: () => { const c = S().cities[cityOk()], f = Math.round(G.felicidad(c)); return '<div class="empty"><span class="stat">' + (f >= 60 ? '😊' : f >= 40 ? '😐' : '😠') + ' Felicidad <b>' + f + ' %</b></span>' + inqHtml(c) + '</div>' + (c.owner === 'roma' ? '<div class="empty">' + espResumen() + '</div>' : ''); } },
};
function hojaAlt(i) { if (!UI.hoja) return; UI.hoja.alt = Math.max(0, Math.min(2, i)); $('hoja').style.setProperty('--ha', HOJA_ALT[UI.hoja.alt] + 'px'); }
function hojaPinta(forzar) {
  const h = $('hoja'), d = UI.hoja && HOJAS[UI.hoja.id]; if (h.hidden || !d || (!S() && !UI.menu) || (UI.hjDown && !forzar)) return;
  const titulo = UI.hojaConf ? 'Volver al menú' : d.titulo, cuerpo = d.html();
  if (h.dataset.id !== UI.hoja.id) { h.dataset.id = UI.hoja.id; h.dataset.k = ''; h.innerHTML = '<div class="hasa" role="button" aria-label="Cambiar la altura de la hoja"><i></i></div><div class="hcab"><h2 class="ht ro-ansata"></h2><button class="hx" data-act="hojax" aria-label="Cerrar">' + ICO_X + '</button></div><div class="hcuerpo"></div>'; }
  const k = titulo + '|' + cuerpo; if (h.dataset.k === k) return; h.dataset.k = k;
  h.querySelector('.ht').textContent = titulo;
  const b = h.querySelector('.hcuerpo'), st = b.scrollTop; b.innerHTML = cuerpo; tintaDom(b); b.scrollTop = st;
}
function hojaAbre(id, alt) {
  if (!HOJAS[id] || (!S() && !UI.menu)) return; UI.hoja = { id, alt: 1 }; UI.hojaConf = false; const h = $('hoja'); if (UI.menu) { document.body.append($('hscrim'), h); h.classList.add('enmenu'); $('hscrim').classList.add('enmenu'); } h.dataset.id = ''; h.hidden = false; $('hscrim').hidden = false; document.body.classList.add('conhoja');
  hojaAlt(alt == null ? HOJAS[id].alt : alt); hojaPinta(true); hudDock();
}
function hojaCierra(sinDock) { if ($('hoja').classList.contains('enmenu')) { const ap = $('app'), r = $('popsheet'); ap.insertBefore($('hscrim'), r); ap.insertBefore($('hoja'), r); $('hoja').classList.remove('enmenu'); $('hscrim').classList.remove('enmenu'); } UI.hoja = null; UI.hojaConf = false; document.body.classList.remove('conhoja'); $('hoja').hidden = true; $('hscrim').hidden = true; $('hoja').style.transform = ''; if (!sinDock) hudDock(); }
{ let y0 = null, via = '';   // asa y cabecera: tocar el asa = siguiente altura; arrastrar abajo = bajar o cerrar; arriba = subir
  document.addEventListener('pointerdown', e => { const t = e.target.closest && e.target.closest('#hoja'); if (!t) return; UI.hjDown = true; clearTimeout(UI.hjT); UI.hjT = setTimeout(() => { UI.hjDown = false; }, 1500);
    const z = e.target.closest('.hasa, .hcab'); y0 = z && !e.target.closest('.hx') ? e.clientY : null; via = z && z.classList.contains('hasa') ? 'asa' : 'cab'; }, true);
  document.addEventListener('pointermove', e => { if (y0 == null || !UI.hoja) return; const dy = e.clientY - y0; if (Math.abs(dy) > 6) $('hoja').style.transform = 'translateY(' + Math.max(0, dy) + 'px)'; });
  const fin = e => { clearTimeout(UI.hjT); UI.hjT = setTimeout(() => { UI.hjDown = false; }, 120); if (y0 == null) return; const dy = e.type === 'pointercancel' ? 0 : e.clientY - y0; y0 = null; $('hoja').style.transform = ''; if (!UI.hoja) return;
    if (Math.abs(dy) < 8) { if (via === 'asa' && e.type !== 'pointercancel') hojaAlt((UI.hoja.alt + 1) % 3); } else if (dy > 50) { if (UI.hoja.alt > 0) hojaAlt(UI.hoja.alt - 1); else hojaCierra(); } else if (dy < -50) hojaAlt(UI.hoja.alt + 1); };
  document.addEventListener('pointerup', fin); document.addEventListener('pointercancel', fin);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && UI.hoja) hojaCierra(); }); }
function cityMenuHtml() {
  const s = S(); cityOk();
  return G.myCities().map(id => '<button class="' + (id === UI.city ? 'on' : '') + '" data-act="city" data-v="' + id + '">' + D.CITIES[id].n + (s.hero.city === id ? ' ' + D.GUERRA_ICON.aguila : '') + '<small>' + Math.floor(s.cities[id].pop) + ' hab.</small></button>').join('');
}
function renderPop() { renderCuentas(); const ps = $('popsheet'); if (ps.hidden) return; ps.innerHTML = '<div class="tt">' + D.CITIES[cityOk()].n + '</div>' + popHtml(S().cities[UI.city]) + '<div class="acts"><button class="btn" data-act="popx">Cerrar</button></div>'; }
function render() {
  UI.dirty = false;
  if (!S() || G.fundando()) return; renderPop(); hojaPinta(); if (UI.tab === 'map') { renderSheet(); return; }
  if (UI.tab === 'city' && UI.cityV && !UI.cityList) { renderCity3D(); tickUI(); return; }
  if (UI.tab === 'saber' && UI.svDown) { UI.dirty = true; return; }   // no repintar entre pulsar y soltar: se perderían los toques
  const v = $('view'), st = v.scrollTop;
  v.innerHTML = UI.tab === 'imperio' ? viewImperio() : UI.tab === 'city' ? viewCity() : UI.tab === 'army' ? viewArmy() : UI.tab === 'hero' ? viewHero() : UI.tab === 'senado' ? viewSenado() : UI.tab === 'saber' ? viewSaber() : viewLog();
  if (UI.tab === 'senado' && window.MINISTROS_UI && $('mn-aqui')) abreMinistros($('mn-aqui'));   // CDe3
  if (UI.tab !== 'army') tintaDom(v);   // MR2c: iconos de tinta en los menús (la guerra no se toca)
  v.scrollTop = st; tickUI();
}
const dondeEsp = k => G.dondeEspecial(k).slice(0, 3).map(i => D.CITIES[i].n).join(', ');
const faltaBtn = k => '<button class="btn no" disabled style="max-width:118px;white-space:normal;line-height:1.15">Falta ' + D.ESPECIAL[k].n.toLowerCase() + '<small style="white-space:normal">' + D.ESPECIAL[k].i + ' en ' + dondeEsp(k) + '</small></button>';
const espLinea = c => { if (c.owner !== 'roma') return ''; const e = D.ESPECIAL[D.CITIES[UI.city].esp]; return e ? '<span class="stat">' + e.i + ' Bien de la ciudad: <b>' + e.n + '</b> — ' + esc(e.d) + '</span>' : ''; };
const espResumen = () => {
  const t = G.especiales(), ks = Object.keys(D.ESPECIAL), tiene = ks.filter(k => t[k]), falta = ks.filter(k => !t[k]);
  return '<span class="stat">Tienes: ' + (tiene.map(k => D.ESPECIAL[k].i + ' ' + D.ESPECIAL[k].n).join(' · ') || 'ninguno') + '.</span>' + (falta.length ? '<span class="stat">Te faltan: ' + falta.map(k => D.ESPECIAL[k].i + ' ' + D.ESPECIAL[k].n + ' (' + dondeEsp(k) + ')').join(' · ') + '</span>' : '');
};
/* CN13a: arca del foro, fiestas, ración y granero. Todo lee G.arca / G.fiestaInfo / G.graneroInfo y no guarda nada */
const fiestaBtn = (cid, id, corto) => {
  const d = D.FIESTAS[id], fi = G.fiestaInfo(cid, id), on = !fi.motivo, estado = fi.activa ? 'En marcha: ' + mesesEst(fi.quedan) + '.' : '';
  return '<button class="btn fiesta' + (on ? '' : ' no') + '" data-act="fiesta" data-v="' + id + '"' + (on ? '' : ' disabled') + '>' + d.i + ' ' + (corto || d.n) + ' · ' + D.RES_ICON.denarios + fmt(fi.coste) + (d.pago === 'arca' ? ' en arca' : '') + '</button>' +
    '<small class="fi-n">' + esc(estado + (estado && fi.motivo ? ' ' : '') + (fi.motivo || '')) + '</small>';
};
/* CN16a: botón de leva (dilectus). Lee G.levaInfo; el motivo sale en letra pequeña si no se puede */
const levaBtn = cid => {
  const d = D.LEVA, lv = G.levaInfo(cid, d.n), on = !lv.motivo;
  return '<button class="btn fiesta leva' + (on ? '' : ' no') + '" data-act="leva"' + (on ? '' : ' disabled') + '>⚔️ Reclutar ' + lv.n + ' · ' + D.RES_ICON.grano + fmt(lv.coste.grano) + ' ' + D.RES_ICON.denarios + fmt(lv.coste.denarios) + '</button>' +
    '<small class="fi-n">' + esc(lv.motivo || 'Aldeanos libres: ' + fmt(lv.libres) + '. La milicia guarnece la ciudad.') + '</small>';
};
/* CN16b: puertas, veteranos y triunfo, bajo la leva. Leen G.puertasInfo / G.veteranosInfo / G.triunfoInfo; el motivo sale en letra pequeña */
const ejCiudadHtml = cid => {
  const pu = G.puertasInfo(cid), ve = G.veteranosInfo(cid), tr = G.triunfoInfo(), P = D.PUERTAS, pct = x => Math.round(Math.abs(x - 1) * 100) + ' %';
  const bPu = '<button class="btn fiesta puertas' + (pu.motivo ? ' no' : '') + '" data-act="puertas" data-v="' + (pu.cerradas ? 'abrir' : 'cerrar') + '"' + (pu.motivo ? ' disabled' : '') + '>🚪 ' + (pu.cerradas ? 'Abrir puertas' : 'Cerrar puertas') + '</button>' +
    '<small class="fi-n">' + esc(pu.motivo || (pu.cerradas ? 'Puertas cerradas: ' : 'Si las cierras: ') + 'defensa +' + pct(P.def) + ', comercio −' + pct(P.comercio) + ', marchas +' + pct(P.viaje) + ' de tiempo.') + '</small>';
  const bVe = '<button class="btn fiesta licenciar' + (ve.motivo ? ' no' : '') + '" data-act="licenciar"' + (ve.motivo ? ' disabled' : '') + '>🎖️ Licenciar ' + (ve.n || D.VETERANOS.n) + ' veteranos · +' + D.RES_ICON.grano + fmt(ve.grano || D.VETERANOS.n * D.VETERANOS.grano) + '</button>' +
    '<small class="fi-n">' + esc((ve.motivo ? ve.motivo + ' ' : '') + 'Batallas de esta tropa: ' + ve.batallas + '. Se asientan como vecinos y sube el favor del pueblo.') + '</small>';
  const bTr = !tr.oferta && !tr.activo ? '' : '<button class="btn fiesta triunfo' + (tr.motivo ? ' no' : '') + '" data-act="triunfo"' + (tr.motivo ? ' disabled' : '') + '>🎺 Celebrar el triunfo · ' + D.RES_ICON.denarios + fmt(tr.denarios) + '</button>' +
    '<small class="fi-n">' + esc((tr.activo ? 'Triunfo en marcha: +' + D.TRIUNFO.fel + ' de felicidad ' + mesesEst(tr.quedan) + '. ' : '') + (tr.oferta ? (tr.motivo === 'Faltan denarios.' ? 'Faltan denarios. ' : '') + 'Por la victoria de ' + tr.oferta + ': favor del pueblo y felicidad ' + mesesEst(D.TRIUNFO.dura) + '.' : '')) + '</small>';
  return bPu + bVe + bTr;
};
const arcaHtml = c => {
  const cid = UI.city, a = G.arca(cid), pips = [1, 2, 3, 4].map(i => '<i class="' + (a.nivel >= i ? 'on' : '') + '"></i>').join(''), sob = Object.keys(a.sobra);
  return '<div class="arca"><div class="ar-top"><b>Arca</b><span class="ar-med" title="Lo que el almacén va a perder al cerrar la estación">' + pips + '</span><em>' + (sob.length ? 'sobra ' + sob.map(r => D.RES_ICON[r] + fmt(a.sobra[r])).join(' ') : 'no se pierde nada') + '</em></div>' +
    '<div class="ar-fi">' + fiestaBtn(cid, 'juegos') + '</div><div class="ar-leva" data-hueco="leva">' + levaBtn(cid) + ejCiudadHtml(cid) + '</div></div>';   // el hueco de la leva (CN16) cuelga de .ar-leva
};
const graneroHtml = c => {
  const cid = UI.city, g = G.graneroInfo(cid), rc = c.rac || 'normal', rac = Object.keys(D.RACION).map(k => '<button class="chip ' + (rc === k ? 'on' : '') + '" data-act="racion" data-v="' + k + '" title="' + esc(D.RACION[k].d) + '">' + D.RACION[k].n + '</button>').join('');
  const fr = g.hambre ? 'Sin grano: hay hambre.' : g.invierno ? 'Invierno sin granero: no llegan familias.' : g.meses === null ? 'El grano crece cada estación.' : 'El grano dura ' + mesesEst(g.meses) + '.';
  return '<div class="granero"><div class="gr-top"><b>Granero</b><span class="gr-bar"><i style="width:' + g.pct + '%"></i></span><em>' + g.pct + ' %</em></div><div class="gr-f' + (g.hambre || g.invierno ? ' mal' : '') + '">' + fr + '</div><div class="chips" style="flex-wrap:wrap">' + rac + '</div></div>';
};
function diosBloque(c, b) {
  const dg = b === 'templo' ? G.diosDe(c) : null;
  return b !== 'templo' || c.owner !== 'roma' ? '' : dg ? '<div class="ds">' + dg.i + ' <b>Templo de ' + dg.n + '</b> · ' + esc(dg.d) + '</div><div class="ar-fi">' + fiestaBtn(UI.city, 'ofrenda') + '</div>' :
    '<div class="ds">Elige el dios:</div><div class="chips" style="flex-wrap:wrap">' + Object.keys(D.DIOSES).map(k => { const d = D.DIOSES[k], no = d.sea && !D.CITIES[UI.city].sea; return '<button class="chip ' + ((c.dios || 'marte') === k && !no ? 'on' : '') + '" ' + (no ? 'disabled' : 'data-act="dios" data-v="' + k + '"') + ' title="' + esc(d.d) + '">' + d.i + ' ' + d.n + '</button>'; }).join('') + '</div><div class="ds">' + esc(D.DIOSES[c.dios && !(D.DIOSES[c.dios].sea && !D.CITIES[UI.city].sea) ? c.dios : 'marte'].d) + '</div>';
}
/* Barrios (CN6): la ciudad (Aldea, Villa, Ciudad, Urbs) con lo que le falta, y una fila por barrio con su nivel y su «para subir falta…» */
const BARRIO_ICO = { grano: () => D.RES_ICON.grano, lujo: () => svgIco('<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18M9 4l-2 5 5 11 5-11-2-5"/>') };
const ROMS = ['', 'I', 'II', 'III', 'IV'];
const barrioFrase = bi => {
  const nom = k => (D.BARRIO_SERV[k] || k).toLowerCase(), lst = a => a.map(nom).join(' y ');
  if (bi.objetivo < bi.nivel) { const f = (D.BARRIO[bi.nivel].pide || []).filter(k => !bi.serv[k]); if (!f.length) return 'Algún barrio se queda sin servicios y la ciudad puede bajar de nivel: mira la lista.'; return 'Baja a ' + D.BARRIO[bi.nivel - 1].n + ' en ' + mesesEst(bi.meses) + ' si no recuperas ' + (f.length > 1 ? 'estos servicios: ' : 'el ') + lst(f) + '.'; }
  if (bi.nivel >= D.BARRIO.length - 1) return 'La ciudad está al máximo.';
  return 'Para ser ' + D.BARRIO[bi.nivel + 1].n + ' falta ' + (bi.falta.length ? lst(bi.falta) : 'esperar unas estaciones') + '.';
};
/* CN13b: techar un barrio con tejas (el fuego ya no salta de casa en casa). Botón pequeño en cada fila del barrio. */
const techoBtn = i => {
  const t = G.techoInfo(UI.city, i); if (t.hecho) return '<span class="tj-ok" title="El fuego no salta entre estas casas">techado</span>';
  if (t.enObra) return '<span class="tj-ok" title="' + esc(t.motivo) + '">techando · ' + mesesEst(t.enObra) + '</span>';
  if (!t.coste || t.casas < 1) return '';
  const cs = Object.keys(t.coste).filter(r => t.coste[r] > 0).map(r => D.RES_ICON[r] + fmt(t.coste[r])).join(' ');
  return '<button class="chip tj' + (t.motivo ? ' no' : '') + '" data-act="techar" data-v="' + i + '"' + (t.motivo ? ' disabled' : '') + ' title="' + esc('Techos de teja: el fuego no salta entre las casas. Tarda ' + mesesEst(t.plazo) + '. ' + (t.motivo || '')) + '">Techar barrio · ' + cs + '</button>';
};
const barrioHtml = c => {
  if (c.owner !== 'roma') return '';
  const bi = G.barrioInfo(c), bs = bi.barrios || [], ver = k => BARRIO_ICO[k] && !bi.serv[k] ? '<span class="bs" title="Falta ' + D.BARRIO_SERV[k].toLowerCase() + '">' + BARRIO_ICO[k]() + '</span>' : '';
  return '<div class="barrio"><div class="bn"><b>' + D.BARRIO[bi.nivel].n + '</b> · nivel ' + bi.nivel + ' de ' + (D.BARRIO.length - 1) + '<span class="bsv">' + ver('grano') + ver('lujo') + '</span></div>' +
    '<div class="bf' + (bi.objetivo < bi.nivel ? ' mal' : '') + '">' + barrioFrase(bi) + '</div>' +
    (bs.length ? '<div class="blis">' + bs.map(b => '<div class="bfila' + (b.objetivo < b.nivel ? ' mal' : '') + '"><span class="bniv">' + ROMS[b.nivel] + '</span><span class="bnom">' + esc(b.corto || b.nombre) + '</span><span class="bfalta">' + (b.falta ? 'para subir falta ' + esc(b.falta.replace(/^para subir falta /, '')) : 'lo tiene todo') + '</span>' + techoBtn(b.i) + '</div>').join('') + '</div>' : '') + '</div>';
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
  return '<div class="clases"><div class="bn"><b>Clases</b>' + (window.CLASES_UI ? '<button class="chip" style="margin-left:auto" data-act="clases">Ver clases</button>' : '') + '</div>' + fila('Ciudadanos', 'ciu', cl.ciu) + fila('Plebeyos', 'ple', cl.ple) + fila('Esclavos', 'esc', cl.esc) +
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
const tipoHtml = c => {            // el tipo de ciudad: una línea propia en la ficha de la ciudad (la primera elección es gratis)
  if (c.owner !== 'roma') return '';
  const t = G.tipoDe(c), sug = G.tipoSugerido(UI.city);
  return '<span class="stat">' + t.i + ' <b>' + t.n + '</b> · ' + esc(t.d) + (!c.tipoElegido && sug ? ' Sugerido: ' + D.TIPOS[sug].n + '.' : '') + ' <button class="chip" data-act="tipos">' + (c.tipoElegido ? 'Cambiar tipo' : 'Elegir tipo · gratis') + '</button></span>';
};
function tiposModal() {
  const c = S().cities[UI.city], coste = G.tipoCoste(c), sug = G.tipoSugerido(UI.city);
  let h = '<div class="yr">TIPO DE CIUDAD</div><h2>' + D.CITIES[UI.city].n + '</h2>' + licHtml({ lic: 'Colonia, municipio y emporio eran nombres o estatus reales, pero nadie «elegía» su oficio: el reparto es invención del juego.' }) +
    '<p>' + (coste ? 'Cambiar de tipo cuesta ' + coste + ' ' + D.RES_ICON.denarios + '.' : 'La primera elección es gratis.') + '</p>';
  for (const k in D.TIPOS) {
    const t = D.TIPOS[k], act = c.tipo === k && c.tipoElegido, sinMar = !G.tipoOk(UI.city, k), sinOro = G.disponible('denarios') < coste, no = act || sinMar || sinOro;
    h += '<div class="card ' + (sinMar ? 'locked' : '') + '"><div class="ic">' + t.i + '</div><div class="bd"><div class="tt">' + t.n + (k === sug ? '<span class="lv">Sugerido</span>' : '') + '</div><div class="ds">' + esc(t.d) + '</div>' + (sinMar ? '<div class="ds" style="color:#e0a030">Esta ciudad no tiene mar.</div>' : '') + '</div>' +
      '<button class="btn ' + (no ? 'no' : '') + '" ' + (no ? 'disabled' : 'data-act="tipo" data-v="' + k + '"') + '>' + (act ? 'Actual' : 'Elegir') + (coste && !act ? '<small>' + coste + ' ' + D.RES_ICON.denarios + '</small>' : '') + '</button></div>';
  }
  return h + '<div class="acts"><button class="btn ghost" data-act="close">Cerrar</button></div>';
}
const inqHtml = c => c.owner === 'roma' && c.inq > 0 ? '<span class="stat" style="color:#e0a030">🔥 Ciudad conquistada: inquieta unas ' + mesesEst(Math.ceil(c.inq / (1 + D.INQ_TEMPLO * G.diosNivel(c)))) + ' · produce un ' + Math.round((1 - G.inqMul(c)) * 100) + ' % menos' + (G.felicidad(c) < D.INQ_REBELION ? ' · <b>con esta felicidad se rebelará</b>' : '') + '. Un templo la calma antes.</span>' : '';
const popHtml = c => '<span class="stat">' + D.POP_ICON + ' Población <b>' + Math.floor(c.pop) + '</b> / ' + G.popCap(c) + '</span><span class="stat">' + D.GUERRA_ICON.casco + ' Reclutas disponibles <b>' + G.recruits(c) + '</b></span>' + manoHtml(c) + inqHtml(c) + espLinea(c) + barrioHtml(c) + clasesHtml(c) + impHtml(c);
function marketHtml() {
  const rate = G.tradeRate(); if (!rate) return '';
  UI.mf = UI.mf || 'denarios'; UI.mt = UI.mt || 'hierro';
  const chips = (act, cur) => D.RES.map(r => '<button class="chip ' + (r === cur ? 'on' : '') + '" data-act="' + act + '" data-v="' + r + '">' + D.RES_ICON[r] + '</button>').join('');
  const r2 = rate * (UI.mt === 'hierro' ? D.HIERRO_COMPRA : 1);   // CE2: el hierro comprado rinde menos (escasea fuera de las vetas)
  const pr = G.previsionCierre(), sobra = D.RES.filter(r => r !== 'denarios' && pr[r].perdera >= 1), b = G.bienes(), ks = Object.keys(D.BIENES).filter(k => (b[k] || 0) >= 1);
  const sinVeta = !G.myCities().some(id => G.vetaHierro(id));
  return '<div class="market mar mar-merc"><div class="btns"><button class="btn" data-act="mercadoui">Abrir el mercado (precios, rutas y Senado)</button></div><div class="tt">⚖️ Mercado · cambio ' + Math.round(rate * 100) + ' %</div><div class="mrow"><span>Doy</span>' + chips('mfrom', UI.mf) + '</div><div class="mrow"><span>Recibo</span>' + chips('mto', UI.mt) + '</div>' +
    '<div class="btns" style="flex-direction:row">' + [100, 500, 2000].map(n => '<button class="btn" data-act="trade" data-n="' + n + '" data-need=\'' + JSON.stringify({ [UI.mf]: n }) + '\'>' + n + ' ' + D.RES_ICON[UI.mf] + ' → ' + Math.floor(n * r2) + ' ' + D.RES_ICON[UI.mt] + '</button>').join('') + '</div>' +
    (UI.mt === 'hierro' ? '<div class="mnota">El hierro comprado sale caro: rinde el ' + Math.round(D.HIERRO_COMPRA * 100) + ' % del cambio.' + (sinVeta ? ' Solo hay vetas en Etruria y en Hispania.' : '') + '</div>' : '') +
    (sobra.length ? '<div class="mrow msob"><span>Sobra</span>' + sobra.map(r => '<button class="btn" data-act="cuvender" data-v="' + r + '">Vender lo que sobra · ' + D.RES_ICON[r] + ' ' + pr[r].perdera + '</button>').join('') + '</div>' : '') +
    (ks.length ? '<div class="mrow mbien"><span>Bienes</span>' + ks.map(k => { const n = Math.min(10, Math.floor(b[k])); return '<button class="btn" data-act="cubien" data-v="' + k + '" data-n="' + n + '">Vender ' + n + ' ' + D.ESPECIAL[k].i + ' → ' + Math.round(n * G.precioBien(k)) + ' ' + D.RES_ICON.denarios + '</button>'; }).join('') + '</div>' : '') + '</div>';
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
    const ef = d === 0 && !c.sabios ? 'nadie estudia' : act ? 'puesta ahora' : (d === 0 ? 'quita ' + x.n + ' sabios' : (dn >= 0 ? '+' : '−') + Math.abs(dn) + ' sabios · ' + sgn(v.dVel) + ' ritmo · ' + sgn(v.dPaga * 3) + ' denarios por estación' + (v.alta > 0 ? ' · alta ' + Math.round(v.alta) + ' denarios' : ''));
    return '<button class="esc-b' + (act ? ' on' : '') + '" data-act="dotsab" data-v="' + d + '" aria-pressed="' + act + '"><b>' + DOT_NOM[d] + '</b><small>' + ef + '</small></button>';
  }).join('');
  const clases = ['ple', 'ciu', 'esc'].map(k => {
    const off = k === 'esc' && !hayEsc, act = k === x.clase;
    return '<button class="esc-b esc-c' + (act ? ' on' : '') + (off ? ' off' : '') + '" data-act="clasab" data-v="' + k + '"' + (off ? ' disabled' : '') + ' aria-pressed="' + act + '"><b>' + CLASE_SAB[k] + '</b><small>' + (off ? 'no tienes esclavos' : 'rinde ×' + SD.rinde[k].toString().replace('.', ',') + ' · ' + (Math.round(SD.pagaBase[k] * 100) / 100).toFixed(2).replace('.', ',') + ' denarios') + '</small></button>';
  }).join('');
  const S_ = Math.max(G.sabiosTotal(), x.n), cab1 = SD.pagaBase[x.clase] * ed * (1 + S_ / SD.pagaDiv);
  let viva;
  if (!x.dot) viva = 'Nadie estudia. Plazas: ' + x.aforo + '.';
  else if (!x.n) viva = 'Nadie estudia: ' + (x.clase === 'esc' ? 'los esclavos están muy descontentos' : x.disp[x.clase] < 1 ? 'no hay ' + CLASE_SAB[x.clase].toLowerCase() + ' libres' : 'la ciudad está muy descontenta') + '.';
  else viva = x.n + ' estudian de ' + x.aforo + ' plazas · rinde ' + dec1(x.R).replace(/,0$/, '') + ' · cuestan ' + dec1(x.n * cab1 * 3) + ' denarios por estación (' + (Math.round(cab1 * 300) / 100).toFixed(2).replace('.', ',') + ' por cabeza) · quitan ' + x.n + ' reclutas';
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
      (en || max || topada ? '' : '<button class="btn ' + (f.cola ? 'no' : '') + '" data-act="forja" data-v="' + k + '" ' + (f.cola ? '' : "data-need='" + JSON.stringify(cost) + "'") + '>Mejorar ' + F.n.toLowerCase() + '<small>' + mesesEst(G.forjaTime(k, L, UI.city)) + '</small></button>') + '</div>';
  }).join('');
}
/* Pueblos (J3): satélites que producen para la capital; una fila por hueco */
function pueblosHtml(c) {
  if (c.owner !== 'roma') return '';
  const cid = UI.city;
  return '<div class="sec">Pueblos de ' + D.CITIES[cid].n + '</div>' + G.pueblosDe(cid).map(p => {
    const F = p.ficha, max = p.nivel >= D.PUEBLO_MAX, ok = G.puebloOk(cid, p.i), cost = G.puebloCoste(cid, p.i), prod = Object.keys(F.prod).map(r => D.RES_ICON[r] + ' +' + (G.rate(Math.max(1, p.nivel)) * F.prod[r]).toFixed(0)).join(' ') + (F.pop ? ' · 👥 +' + F.pop + '/nivel' : '');
    return '<div class="card"><div class="ic">' + F.i + '</div><div class="bd"><div class="tt">' + F.n + '<span class="lv">' + (p.nivel ? 'Nv ' + p.nivel : 'Sin fundar') + '</span></div><div class="ds">' + F.d + ' ' + prod + '</div>' +
      (p.obra ? '<div class="prog" data-t0="' + p.obra.t0 + '" data-t1="' + p.obra.t1 + '"><i></i></div><span class="rem"></span>' : max ? '<div class="ds">Nivel máximo.</div>' : costHtml(cost)) + '</div>' +
      (p.obra || max ? '' : '<button class="btn ' + (ok ? '' : 'no') + '" data-act="pueblo" data-v="' + p.i + '" ' + (ok ? "data-need='" + JSON.stringify(cost) + "'" : '') + '>' + (p.nivel ? 'Mejorar a ' + (p.nivel + 1) : 'Fundar') + '<small>' + mesesEst(G.puebloTiempo(cid, p.i)) + '</small></button>') + '</div>';
  }).join('');
}
const RES_NOM = D.RES_NOM;   // CE2: grano, denarios, materiales, hierro
const REP_NOM = { aserradero: ['Aserradero', 'al'], cantera: ['Cantera', 'a la'], mina: ['Mina', 'a la'], granja: ['Granja', 'a la'] };   // CE2: el reparto va por edificio
function repartoHtml(c) {
  if (c.owner !== 'roma') return '';
  const id = c.id || UI.city, veta = G.vetaHierro(id), r = G.repartoDe(c), w = Math.max(0, (c.pop || 0) - G.MIN_POP);
  const base = { aserradero: (4 + G.rate(c.b.aserradero)) * D.MAT_MUL, cantera: (4 + G.rate(c.b.cantera)) * D.MAT_MUL, mina: veta ? 4 + G.rate(c.b.mina) : G.rate(c.b.mina) * D.VETA_POBRE, granja: 6 + G.rate(c.b.granja) };
  const ico = { aserradero: D.RES_ICON.materiales, cantera: D.RES_ICON.materiales, mina: D.RES_ICON.hierro, granja: D.RES_ICON.grano };
  const fila = k => {
    const mas = r[k] < 11 && G.REPARTO_RES.some(o => o !== k && r[o] > 1), menos = r[k] > 1 && G.REPARTO_RES.some(o => o !== k && r[o] < 11), nm = REP_NOM[k];
    return '<div class="ald"><span class="aln">' + ico[k] + ' ' + nm[0] + '</span>' +
      '<button class="albtn" data-act="rep" data-r="' + k + '" data-d="-1" aria-label="Menos aldeanos ' + nm[1] + ' ' + nm[0].toLowerCase() + '"' + (menos ? '' : ' disabled') + '>−</button>' +
      '<b class="alnum">' + Math.round(r[k] * w / 20) + '</b>' +
      '<button class="albtn" data-act="rep" data-r="' + k + '" data-d="1" aria-label="Más aldeanos ' + nm[1] + ' ' + nm[0].toLowerCase() + '"' + (mas ? '' : ' disabled') + '>+</button>' +
      '<span class="alp">' + fmt(base[k] * r[k] / 5 * 3) + ' por estación</span></div>';
  };
  return '<div class="sec">Aldeanos</div><div class="empty">Mueve aldeanos de un trabajo a otro. El total no cambia. Aserradero y cantera dan materiales.' + (veta ? '' : ' Aquí no hay vetas de hierro: la mina rinde poco.') + '</div>' + G.REPARTO_RES.map(fila).join('');
}
function rutasHtml(c, id) {   // CDe3 2b: las rutas viejas ya no se ofrecen; todo va por el mercado nuevo
  if (c.owner !== 'roma') return '';
  return '<div class="mar mar-rut"><div class="sec mar-t">Rutas comerciales</div><div class="empty mar-card">Hay ' + G.rutasTotal(S()) + ' rutas en marcha. Las rutas y los viajes se hacen en el mercado.<div class="btns"><button class="btn" data-act="mercadoui" data-v="rutas">Abrir rutas del mercado</button></div></div></div>';
}
/* C3: diplomacia con la facción dueña de una ciudad ajena (alianza o tributo) */
function dipHtml(c) {
  if (c.owner === 'roma') return '';
  const f = c.owner, fn = D.FACTIONS[f].n, e = G.dipEstado(f);
  let h = '';
  if (e) return h + '<div class="empty" style="margin:6px 0">' + (e === 'alianza' ? '🤝 <b>Aliado</b> de Roma: no os ataca y comercia (+60 denarios por estación).' : '📜 <b>Tributario</b>: no os ataca y paga ' + G.dipIngreso() * 3 + ' denarios por estación.') + '</div>';
  const mA = G.dipMotivoAlianza(f), mT = G.dipMotivoTributo(f);
  h += '<div style="margin:6px 0"><div class="btns" style="display:flex;gap:8px;justify-content:center"><button class="btn ' + (mA ? 'no' : '') + '" data-act="dipalianza" data-v="' + f + '">Alianza (150)</button>' +
    '<button class="btn ' + (mT ? 'no' : '') + '" data-act="diptributo" data-v="' + f + '">Tributo</button></div>' +
    (mA && !/^Esta facción no/.test(mA) ? '<div class="empty" style="opacity:.7">Alianza: ' + esc(mA) + '</div>' : '') + (mT && !/^No es/.test(mT) ? '<div class="empty" style="opacity:.7">Tributo: ' + esc(mT) + '</div>' : '') + '</div>';
  return h + '';
}
const espFalta = () => { const t = G.especiales(); return Object.keys(D.ESPECIAL).filter(k => !t[k]); };
/* MR2a · corona de laurel (dos ramas desde abajo, atadas con cinta roja) y hoja de hiedra para separar; SVG en línea */
const RO_LAUREL = (function () {
  const c = 100, r = 92, P = a => [c + r * Math.cos(a), c + r * Math.sin(a)];
  let l = '<svg class="ro-laurel" viewBox="0 0 200 200" aria-hidden="true">';
  for (const lado of [-1, 1]) {
    const a0 = Math.PI / 2 + lado * 0.2, a1 = Math.PI / 2 + lado * 2.75, p0 = P(a0), p1 = P(a1);
    l += '<path d="M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + r + ' ' + r + ' 0 0 ' + (lado > 0 ? 1 : 0) + ' ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + '" fill="none" stroke="#3d5418" stroke-width="1.6"/>';
    for (let k = 0; k < 11; k++) {
      const a = a0 + lado * (k + .5) * (2.55 / 11), q = P(a), dir = a + lado * Math.PI / 2;
      for (const o of [-1, 1]) {
        const g = dir + o * 0.75, lx = (q[0] + 6.5 * Math.cos(g)).toFixed(1), ly = (q[1] + 6.5 * Math.sin(g)).toFixed(1), deg = (g * 180 / Math.PI + 90).toFixed(1);
        l += '<ellipse cx="' + lx + '" cy="' + ly + '" rx="2.6" ry="7" transform="rotate(' + deg + ' ' + lx + ' ' + ly + ')" fill="' + ((k + o) % 2 ? '#5f7d2d' : '#4a6522') + '" stroke="#2f4214" stroke-width=".5"/>';
      }
    }
  }
  return l + '<path d="M86 192q14-8 28 0M92 192l-6 8M108 192l6 8" fill="none" stroke="#9b2a1a" stroke-width="2.4"/></svg>';
})();
/* MR2b: sello de lacre (borde irregular, anillo impreso y corona de hojas). Solo SVG en línea. */
const RO_LACRE = (function () {
  let d = ''; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = i % 2 ? 17.2 : 19; d += (i ? 'L' : 'M') + (20 + r * Math.cos(a)).toFixed(1) + ' ' + (20 + r * Math.sin(a)).toFixed(1); }
  let h = ''; for (let i = 0; i < 12; i++) { const a = (i / 12 * 300 + 120) * Math.PI / 180, x = 20 + 8.2 * Math.cos(a), y = 20 + 8.2 * Math.sin(a); h += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="2.3" ry="1" transform="rotate(' + ((i / 12 * 300 + 120) + 90 + (i < 6 ? 30 : -30)).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>'; }
  return '<svg class="ro-lacre" viewBox="0 0 40 40" aria-hidden="true"><defs><radialGradient id="roLacreG" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#e2523f"/><stop offset=".55" stop-color="#a3231a"/><stop offset="1" stop-color="#5e0f09"/></radialGradient></defs><path d="' + d + 'Z" fill="url(#roLacreG)" stroke="#4a0a05" stroke-width=".8"/><circle cx="20" cy="20" r="12.5" fill="none" stroke="#5e0f09" stroke-width="1.6"/><circle cx="20" cy="20" r="12.5" fill="none" stroke="#e8705e" stroke-width=".5" transform="translate(.5 .7)" opacity=".6"/><g fill="#6a120b">' + h + '</g></svg>';
})();
const RO_HIEDRA = '<div class="ro-hiedra" aria-hidden="true"><svg viewBox="0 0 22 14"><path d="M3 7C3 3 6 1.5 8.5 3.5 10 1 14 1 15 4c1.5 1 1.5 2 1 3 .5 1 .5 2-1 3-1 3-5 3-6.5.5C6 12.5 3 11 3 7z"/><path d="M16 7h5" stroke="currentColor" stroke-width="1.4" fill="none"/></svg></div>';
function viewCity(enHoja) {   // ficha de la ciudad (K12a): felicidad, lo que falta y atajos. MN1: va en la hoja de ROMA ▾ (enHoja) y, sin 3D, en la pestaña Ciudad
  const s = S(), c = s.cities[UI.city], d = D.CITIES[UI.city], roma = c.owner === 'roma', f = Math.round(G.felicidad(c)), cara = f >= 60 ? '😊' : f >= 40 ? '😐' : '😠', R = 52, C = 2 * Math.PI * R;
  const falta = roma ? espFalta() : [], fic = falta.slice(0, 3).map(k => '<button class="gfic" data-act="hoja" data-v="estado">' + ICO_ALERTA + '<span>' + D.ESPECIAL[k].n + '</span></button>').join('') + (falta.length > 3 ? '<button class="gfic" data-act="hoja" data-v="estado"><span>+' + (falta.length - 3) + '</span></button>' : '');
  const at = (id, ico, nom, sub, off) => '<button class="gat ro-bronce' + (off ? ' off' : '') + '"' + (off ? ' disabled' : ' data-act="' + (id === 'cron' ? 'tab" data-v="log' : id === 'mercado' ? 'mercadoui' : id === 'rutas' ? 'mercadoui" data-v="rutas' : 'hoja" data-v="' + id) + '"') + '>' + ico + '<b>' + nom + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</button>';
  const mer = G.tradeRate() > 0;
  return '<div class="ro ro-gob"><div class="ro-palo"></div><div class="ro-papiro gob"><div class="gnomb"><h2 class="ro-ansata">' + d.n + '</h2><p>' + (UI.city === 'roma' ? 'Capital' : esc(G.tipoDe(c).n)) + ' <span class="ro-flecha"></span> ' + Math.floor(c.pop) + ' habitantes</p></div>' +
    '<button class="gani" data-act="hoja" data-v="estado" aria-label="Felicidad ' + f + ' por ciento: ver el estado"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="gpista" cx="60" cy="60" r="' + R + '"/><circle class="gval" cx="60" cy="60" r="' + R + '" style="stroke:' + (f >= 60 ? 'var(--good)' : f >= 40 ? 'var(--gold)' : 'var(--bad)') + '" stroke-dasharray="' + (C * Math.max(0, Math.min(100, f)) / 100).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 60 60)"/></svg><span class="gcen"><span class="gcara">' + cara + '</span><b>' + f + ' %</b><small>Felicidad</small></span>' + RO_LAUREL + '</button>' +
    '<div class="gfalta"><span>Falta:</span>' + (fic || '<em>No falta nada</em>') + '</div>' +
    '<div class="gatajos">' + at('mercado', ICO_MERC, 'Mercado', mer ? '' : 'Sin mercado', !mer) + (roma ? at('rutas', ICO_RUTA, 'Rutas', G.rutasDeCiudad(UI.city) + '/' + G.rutaMax(c)) : '') + at('pueblo', ICO_PUEB, 'Pueblo') + (roma ? at('aldeas', ICO_PUEB, 'Pueblos', G.pueblosDe(UI.city).filter(p => p.nivel > 0).length + '/' + G.pueblosDe(UI.city).length) : '') + at('cron', ICO_CRON, 'Crónica') + (roma && (c.b.templo > 0 || c.b.herreria > 0) ? at('servicios', ICO_TEMPLO, 'Templo y forja') : '') + '</div>' +
    (UI.cityV && enHoja && UI.tab !== 'city' ? '<button class="gver" data-act="barra" data-v="ciudad">Ver la ciudad</button>' : '') + dipHtml(c) + '</div><div class="ro-palo"></div></div>';
}
/* MN1: hoja de ROMA ▾: arriba la ficha de la ciudad; debajo, cambiar de ciudad */
/* CDe4: bloque «Gobernador» (MN3) de la ficha de ciudad. El interruptor lo atiende el clic de data-gb (más abajo) */
function gobBloque() {
  const s = S(); if (!s || !window.GobernadorUI || !window.GOBERNADOR) return '';
  const cid = cityOk(), c = s.cities[cid]; if (!c || c.owner !== 'roma') return '';
  try { if (!s.gobernador) GOBERNADOR.migrar(s); return '<div class="gobbl">' + GobernadorUI.html(s, cid, { nombreCiudad: id => D.CITIES[id].n, mesTexto: m => G.estacion(m) + ' · ' + G.yearOf(m) + ' a.C.' }) + '</div>'; } catch (e) { return ''; }
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-gb=alternar]'); if (!b || !S()) return;
  const cid = b.closest('[data-cid]') ? b.closest('[data-cid]').dataset.cid : cityOk(), si = b.getAttribute('aria-checked') !== 'true';
  try { GOBERNADOR.poner(S(), cid, si); G.save(); toast(si ? 'Un gobernador lleva ' + D.CITIES[cid].n + '.' : 'Vuelves a llevar ' + D.CITIES[cid].n + ' tú.'); } catch (err) { console.warn('Gobernador', err); }
  UI.hjDown = false; setTimeout(() => hojaPinta(true), 0);   // después del clic global: si no, el botón ya no está en la página y el clic cerraría la hoja
});
function fichaCiudad() {
  if (!S()) return '<div class="empty">Aún no hay partida.</div>'; cityOk();
  return '<div class="fciu">' + viewCity(true) + '</div>' + gobBloque() + '<b class="hrot">Cambiar de ciudad</b><div class="fcam">' + cityMenuHtml() + '</div>';
}
/* ---------- J6 · Ciudad como pantalla principal ---------- */
const ICO_X = svgIco('<path d="M6 6l12 12M18 6L6 18"/>');
const ICO_OBRA = svgIco('<path d="M13.5 4.5l6 6-2.5 2.5-6-6zM12 8l-8 8.5 3 3L15.5 11"/>');
const ICO_ALERTA = svgIco('<path d="M12 4l9.5 16h-19zM12 10v4.5M12 17.2v.3"/>');
const ICO_VER = svgIco('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
const ICO_MUNDO = svgIco('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>');
const ICO_MAS = svgIco('<path d="M4 7h16M4 12h16M4 17h16"/>');
/* MR2c · ICONOS DE TINTA (opción A): en los menús, cada emoji se pinta como un dibujo de línea. data.js no cambia: se sustituye
   en pantalla (tintaDom) al pintar la hoja inferior y las vistas. Caritas y bolas de color → punto de color (.ro-punto) */
const tin = d => svgIco(d), PUNTO = c => '<i class="ro-punto' + (c ? ' ' + c : '') + '" aria-hidden="true"></i>';
const TINTA = (() => {
  const B = D.BUILD_ICON, R = D.RES_ICON, W = D.GUERRA_ICON, casa = B.viviendas, libro = B.escuela, mart = ICO_OBRA, medalla = tin('<circle cx="12" cy="15" r="5"/><path d="M8 3l4 7 4-7"/>'),
    tienda = tin('<path d="M3 20L12 4l9 16zM12 20v-6l-3 6M12 14l3 6"/>'), hoja = tin('<path d="M5 20C5 11 11 5 20 4c-1 9-7 15-15 16zM5 20l9-9"/>');
  const t = {
    '🏛': B.foro, '🏟': tin('<ellipse cx="12" cy="9" rx="9" ry="4"/><path d="M3 9v6c0 2 4 4 9 4s9-2 9-4V9M7 12v5M12 13v6M17 12v5"/>'),
    '⚔': W.espadas, '🗡': tin('<path d="M5 19l10-10M15 9l4-5-5 4M7 13l4 4M4 20l2-2"/>'), '🛡': W.escudo, '🦅': W.aguila, '🎖': medalla, '🏅': medalla, '🏆': medalla,
    '⚖': B.mercado, '💰': R.denarios, '🪙': R.denarios, '🌾': R.grano, '🥖': R.grano, '🍞': R.grano, '🪵': R.materiales, '🧱': R.materiales, '🪨': R.materiales, '⛏': tin('<path d="M4 9c4-4 12-4 16 0M12 6v15"/>'),
    '🔨': mart, '⚒': mart, '🪓': mart, '🏗': mart, '📜': tin('<path d="M8 4h10a2 2 0 0 1 2 2v1h-3M8 4a2 2 0 0 0-2 2v12a2 2 0 0 1-2 2h11a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M9 9h5M9 13h5"/>'),
    '📖': libro, '📚': libro, '🎓': libro, '🔥': tin('<path d="M12 21c-4 0-6-3-6-6 0-4 4-6 3-10 3 2 4 4 4 6 1-1 2-2 2-4 2 2 3 5 3 8 0 3-2 6-6 6z"/>'),
    '🎺': tin('<path d="M3 10v4h3l11 5V5L6 10zM20 9v6"/>'), '💀': tin('<path d="M5 11a7 7 0 0 1 14 0v3l-2 1v4H7v-4l-2-1z"/><circle cx="9.5" cy="11.5" r="1.5"/><circle cx="14.5" cy="11.5" r="1.5"/>'),
    '⚓': B.puerto, '🚪': tin('<path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M4 21h16M14 12v1"/>'), '⚠': ICO_ALERTA, '✔': tin('<path d="M5 12.5l4.5 4.5L19 7"/>'), '✖': ICO_X,
    '🚩': tin('<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>'), '🩸': tin('<path d="M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z"/>'),
    '⛓': tin('<path d="M9 15l6-6M10.5 6.5l2-2a3.5 3.5 0 0 1 5 5l-2 2M13.5 17.5l-2 2a3.5 3.5 0 0 1-5-5l2-2"/>'), '🤝': tin('<path d="M2 11l4-4 6 3 6-3 4 4M6 7l-1 7 7 6 7-6-1-7M9 13l3 3M12 11l3 3"/>'),
    '♞': B.establo, '🐎': B.establo, '🌊': tin('<path d="M3 9c3-2 6 2 9 0s6 2 9 0M3 15c3-2 6 2 9 0s6 2 9 0"/>'), '🌿': hoja, '🌲': tin('<path d="M12 3l6 9h-4l5 6H5l5-6H6zM12 18v3"/>'),
    '🍇': tin('<circle cx="9" cy="10" r="2.2"/><circle cx="14" cy="10" r="2.2"/><circle cx="11.5" cy="14" r="2.2"/><circle cx="11.5" cy="18.5" r="2"/><path d="M12 8V4l3-1"/>'),
    '🍷': tin('<path d="M7 3h10c0 5-2 8-5 8s-5-3-5-8zM12 11v8M8 21h8"/>'), '👥': D.POP_ICON, '🏺': B.almacen, '📦': tin('<path d="M3 8l9-4 9 4v9l-9 4-9-4zM3 8l9 4 9-4M12 12v9"/>'),
    '🎭': tin('<path d="M4 5c5 2 11 2 16 0v6c0 5-4 9-8 9s-8-4-8-9z"/><path d="M8 10h2M14 10h2M9 15c2 1.5 4 1.5 6 0"/>'), '🧭': tin('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
    '💡': tin('<path d="M3 14c0-2 3-3 8-3h4l5-3-1 5c-1 2-4 4-8 4H8c-3 0-5-1-5-3zM12 11c-1-2 0-4 1-6"/>'), '🏚': casa, '🏘': casa, '🏠': casa, '🏡': casa,
    '🔱': tin('<path d="M12 21V5M6 4v4a6 6 0 0 0 12 0V4M10 21h4"/>'), '🪣': tin('<path d="M5 8h14l-2 12H7zM5 8a7 5 0 0 1 14 0"/>'), '🛣': ICO_RUTA, '⛺': tienda, '🏕': tienda,
    '🪝': tin('<path d="M12 3v10a4 4 0 1 1-6-3.5M10 3h4"/>'), '🚣': tin('<path d="M3 15h18l-3 4H6zM12 15V4l6 8h-6"/>'), '🪜': tin('<path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10"/>'),
    '🔭': ICO_VER, '👁': ICO_VER, '⚕': tin('<path d="M12 3v18M8 7c0-2 8-2 8 1s-8 3-8 6 8 3 8 5"/>'), '🐟': tin('<path d="M3 12c4-5 10-5 14 0-4 5-10 5-14 0zM17 12l4-3v6z"/>'),
    '🐘': tin('<path d="M5 19v-6a6 6 0 0 1 6-6h3a6 6 0 0 1 6 6v6M9 19v-4M15 19v-4M20 13c1 2 1 5-1 6M8 11h.5"/>'), '🚚': tin('<circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M3 15h18V9H3zM3 9l2-3"/>'),
    '🔒': tin('<rect x="5" y="11" width="14" height="10" rx="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'), '📍': tin('<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>'),
    '⏳': tin('<path d="M6 3h12M6 21h12M7 3c0 4 5 6 5 9s-5 5-5 9M17 3c0 4-5 6-5 9s5 5 5 9"/>'), '⏸': tin('<path d="M9 5v14M15 5v14"/>'),
    '🔄': tin('<path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5"/>'), '🧂': tin('<path d="M4 19h16M6 19c1-5 4-9 6-9s5 4 6 9M10 6v1M14 5v1M12 3v1"/>'),
    '🦌': tin('<path d="M8 21v-6l-3-3 2-2 3 2h4l3-2 2 2-3 3v6M9 8L6 3M15 8l3-5M7 5L5 6M17 5l2 1"/>'), '⛰': tin('<path d="M3 20l6-11 4 6 2-3 6 8z"/>'), '★': ICO_CRED,
    '😊': PUNTO(''), '🙂': PUNTO(''), '😐': PUNTO('med'), '😠': PUNTO('mal'), '😡': PUNTO('mal'), '⚪': PUNTO('blanco'), '🟣': PUNTO('purpura'), '🔴': PUNTO('mal'), '🟢': PUNTO(''), '🟡': PUNTO('med')
  };
  return t;
})();
const TINTA_RE = /(\p{Extended_Pictographic})️?|️/gu, TINTA_LIBRES = '©®™↔↕←→↑↓✕', TINTA_OTRO = tin('<path d="M12 5l6 7-6 7-6-7z"/>');
const tintaTxt = s => esc(s).replace(TINTA_RE, (m, e) => !e ? '' : TINTA_LIBRES.includes(e) ? e : (TINTA[e] || TINTA_OTRO).replace('class="', 'class="tin '));
function tintaDom(raiz) {   // recorre solo el texto (nunca atributos) y cambia cada emoji por su dibujo
  if (!raiz || !/\p{Extended_Pictographic}/u.test(raiz.textContent)) return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT), lis = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) { TINTA_RE.lastIndex = 0; if (TINTA_RE.test(n.data) && !n.parentNode.closest('svg, textarea')) lis.push(n); }
  for (const n of lis) { const tpl = document.createElement('template'); tpl.innerHTML = tintaTxt(n.data); n.replaceWith(tpl.content); }
}
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
  if (con.flags.viviendas) { if (G.polis()) pon(25, 'Población al tope', 'ambar'); else pon(35, 'Población al tope', 'av'); }   // PN3c: en la polis es lo normal al empezar (la aldea crece con calles y casas): aviso en ámbar, no urgente
  if (!ob.length && con.rec) pon(20, 'Sin obra · hay recursos', 'av');
  else if (!ob.length) pon(5, 'Sin obra', 'ok');
  return { id, c, f, pc, pts, causa, tono, con, ob, urg: pts >= 30 };
}
const impObraHtml = (q, cls) => '<div class="' + cls + '"><span class="imp-nb">' + esc(obraNom(q)) + '</span><div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div><span class="rem"></span></div>';
/* MN2: hueco de «Tus caminos» (cuatro caminos de victoria; los llena CE10). Sin datos aún: cintas vacías y «Pronto» */
const IMP_CAMINOS = [['armas', 'Armas', '<path d="M5 19L19 5M15 5h4v4M5 5l14 14M5 15v4h4"/>'], ['comercio', 'Comercio', '<path d="M12 3v18M5 7h14M3 14l2-7 2 7a2 2 0 0 1-4 0zM17 14l2-7 2 7a2 2 0 0 1-4 0z"/>'], ['politica', 'Política', '<path d="M4 20h16M6 17V9M10 17V9M14 17V9M18 17V9M3 9l9-5 9 5z"/>'], ['ciencia', 'Ciencia', '<path d="M6 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2zM6 18a2 2 0 0 1 2-2h10M10 8h5M10 11h5"/>']];
/* CDe4: «Tus caminos» (CE10). Con CAMINOS_UI sale la tira real; sin ella (o si falla) queda el hueco de arriba */
function camVista() {
  try { const s = S(); if (!s || !window.CAMINOS || !window.CAMINOS_UI) return null; if (!s.caminos) CAMINOS.migrar(s); const v = CAMINOS.vista(s, CAMINOS.foto(s, G)); CAMINOS_UI.estilos(); return v; } catch (e) { return null; }
}
function camAbrir() {
  const v = camVista(); if (!v) return;
  modal(CAMINOS_UI.hoja(v, {}), false, 'cam-modal');
  const mb = $('mbox'); CAMINOS_UI.montar(mb, mb.innerHTML, a => { if (a === 'cerrar') closeModal(); });
}
function camVictoria() {
  const s = S(), v = camVista(); if (!s || !v || !v.nuevaVictoria) { if (s) UI.camVic = true; return; }   // no se recalcula en cada tick
  UI.camVic = true;
  modal(CAMINOS_UI.victoria(v, {}), true, 'cam-modal');
  const mb = $('mbox'); CAMINOS_UI.montar(mb, mb.innerHTML, a => { if (a !== 'seguir' && a !== 'abrir') return; CAMINOS.marcarVista(S()); UI.camVic = false; G.save(); closeModal(); if (a === 'abrir') camAbrir(); });
}
const impCaminos = () => { const v = camVista(); return v ? CAMINOS_UI.tira(v).replace('data-cam="abrir"', 'data-cam="abrir" data-act="camabrir"') : impCaminosVacio(); };
const impCaminosVacio = () => G.polis() ? '<div class="imp-cam" role="group" aria-label="Dominio por las armas"><div class="imp-cam-t"><b>Dominio por las armas</b><span>Ganas al conquistar todas las ciudades o el 90 % del territorio</span></div></div>' : '<div class="imp-cam" role="group" aria-label="Tus caminos de victoria"><div class="imp-cam-t"><b>Tus caminos</b><span>Ganas con tres de cuatro</span></div><div class="imp-cam-g">' +
  IMP_CAMINOS.map(c => '<div class="imp-cam-c" data-c="' + c[0] + '">' + svgIco(c[2]) + '<span>' + c[1] + '</span><div class="sen-cinta"><i></i></div></div>').join('') + '</div></div>';
function viewImperio() {
  const s = S(), filas = G.myCities().map(impFila), n = filas.length;
  const pop = filas.reduce((a, r) => a + Math.floor(r.c.pop), 0), cap = filas.reduce((a, r) => a + r.pc, 0);
  const fm = n ? Math.round(filas.reduce((a, r) => a + r.f, 0) / n) : 0, peor = filas.slice().sort((a, b) => a.f - b.f)[0];
  const obras = filas.filter(r => r.ob.length).length, sin = n - obras;
  const F = UI.impF || 'todas', cuenta = { todas: n, urgentes: filas.filter(r => r.urg).length, sinobra: sin, obras, animo: filas.filter(r => r.f < 40).length };
  const ok = { todas: () => true, urgentes: r => r.urg, sinobra: r => !r.ob.length, obras: r => !!r.ob.length, animo: r => r.f < 40 }[F] || (() => true);
  const lista = filas.filter(ok).sort((a, b) => b.pts - a.pts || b.c.pop - a.c.pop);
  const cara = f => '<span class="ro-punto ' + (f >= 60 ? 'bien' : f >= 40 ? 'med' : 'mal') + '"></span>';
  let h = '<div class="imp mar mar-imp ro ro-imp"><div class="ro-palo"></div><div class="ro-papiro"><div class="mar-top"><h2 class="ro-ansata">Imperio</h2>' + (window.laminaHtml && !G.polis() ? laminaHtml('imperio') : '') + '' + impCaminos() + '<div class="imp-res ro-cifras"><div><b>' + pop + '<small>/' + cap + '</small></b><span>población</span></div><div><b>' + cara(fm) + ' ' + fm + '</b><span>ánimo medio</span></div><div><b>' + obras + '</b><span>en obras</span></div><div><b>' + sin + '</b><span>sin obra</span></div></div>' + RO_HIEDRA +
    (peor && n > 1 ? '<div class="imp-peor">Peor ánimo: <b>' + D.CITIES[peor.id].n + '</b> ' + cara(peor.f) + ' ' + peor.f + '</div>' : '') +
    '<div class="imp-chips ro-tablilla">' + IMP_FILTROS.map(x => '<button class="' + (F === x[0] ? 'on' : '') + '" data-act="impf" data-v="' + x[0] + '">' + x[1] + ' <i>' + cuenta[x[0]] + '</i></button>').join('') + '</div></div><div class="imp-lista mar-lista">';
  if (!lista.length) h += '<div class="imp-vacio">Ninguna ciudad cumple este filtro.</div>';
  for (const r of lista) {
    const c = r.c;
    h += '<div class="imp-sw"><div class="imp-izq"><button data-act="impmismo" data-v="' + r.id + '">Hacer lo mismo en…</button></div><div class="imp-fila' + (r.urg ? ' urg' : '') + '" role="button" tabindex="0" data-act="impc" data-v="' + r.id + '"><div class="imp-l1"><b>' + D.CITIES[r.id].n + '</b><span class="imp-pop">' + D.POP_ICON + ' ' + Math.floor(c.pop) + '/' + r.pc + '</span><span class="imp-an">' + cara(r.f) + ' ' + r.f + '</span><span class="imp-fl" aria-hidden="true">‹ ›</span></div>' +
      '<div class="imp-l2">' + (r.ob.length ? '<div class="imp-obs">' + r.ob.map(q => impObraHtml(q, 'imp-obra')).join('') + '</div>' : '<span class="imp-sin">sin obra</span>') +
      (r.causa ? '<em class="imp-tag ' + r.tono + '">' + r.causa + '</em>' : '') + '</div></div></div>';
  }
  h += '</div><div class="mar-pie"><button class="btn cu-go ro-bronce" data-act="esteano">' + svgIco('<path d="M5 4h12l2 2v14H5zM8 9h8M8 13h8M8 17h5"/>') + '<span>Este año</span><small>cuentas y tributo</small></button><button class="btn cu-go ro-bronce" data-act="tab" data-v="hero">' + svgIco('<path d="M5 15c0-5 3-9 7-9s7 4 7 9v3h-4v-3H9v3H5zM12 6V3M9 3h6"/>') + '<span>General</span></button></div>';
  return h + '</div><div class="ro-palo"></div></div>';
}
/* CDe4: «Este año» (CE5): hoja de papiro con las cuentas del año y el tributo de guerra. Sin ESTEANO_UI, cae a la hoja de cuentas del mes */
function eaPinta() {
  const e = $('eahoja'); if (!e || e.hidden || !S()) return;
  try { ESTEANO_UI.montar(e, ESTEANO.cuentas(S().esteAno.actual, S().esteAno.anterior), eaOpts()); } catch (err) { console.warn('Este año', err); e.hidden = true; }
}
function eaOpts() {
  const s = S(), nombres = {}; G.myCities().forEach(id => { nombres[id] = D.CITIES[id].n; });
  let tributo = null; try { tributo = G.tributoPendiente ? G.tributoPendiente() : null; } catch (e) { tributo = null; }
  return { ambito: UI.eaAmb || 'imperio', nombres, tributo, anioTexto: G.estacion(s.t) + ' · ' + G.yearOf(s.t) + ' a.C.', abierta: UI.eaFila || null };
}
function eaAbre() {
  const s = S(); if (!s) return;
  if (!window.ESTEANO || !window.ESTEANO_UI) { const cs = $('cuentas'); cs.hidden = false; renderCuentas(true); return; }
  try { if (!s.esteAno) ESTEANO.migrar(s, G.yearOf(s.t)); } catch (e) { }
  let e = $('eahoja'); if (!e) { e = document.createElement('div'); e.id = 'eahoja'; $('app').appendChild(e); }
  UI.eaAmb = 'imperio'; UI.eaFila = null; e.hidden = false; eaPinta();
}
function eaCierra() { const e = $('eahoja'); if (e) { e.hidden = true; e.innerHTML = ''; } }
function eaAccion(a, v) {
  if (a === 'eacerrar') return eaCierra();
  if (a === 'eaambito') { UI.eaAmb = v; UI.eaFila = null; }
  else if (a === 'eafila') UI.eaFila = UI.eaFila === v ? null : v;
  else if (a === 'eatributo' || a === 'eacaja') {
    if (!G.resolverTributo) toast('El tributo aún no está en marcha.', 'bad');
    else { let r = null; try { r = G.resolverTributo(a === 'eatributo' ? 'tributo' : 'caja'); } catch (err) { r = { ok: false, motivo: 'No se pudo resolver el tributo.' }; } if (r && r.ok === false) toast(r.motivo || 'No se puede pagar ahora.', 'bad'); else { G.save(); UI.dirty = true; } }
  }
  eaPinta();
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
  const ICO_SAB = svgIco('<path d="M6 4h11a2 2 0 0 1 0 4H6M6 4a2 2 0 0 0 0 4v12h11a2 2 0 0 0 0-4H8M9 11h6M9 14h4"/>');
  $('tabs3').innerHTML = [['ciudad', 'nav-ciudad', 'Ciudad'], ['senado', 'nav-senado', 'Senado'], ['saber', 'nav-saber', 'Saber'], ['tropas', 'nav-tropas', 'Tropas'], ['mapa', 'nav-mapa', 'Mapa'], ['imperio', 'nav-imperio', 'Imperio']].map(t => '<button data-act="barra" data-v="' + t[0] + '" title="' + t[2] + '" aria-label="' + t[2] + '"><i><img src="assets/iconos/' + t[1] + '.svg" alt=""></i><span>' + t[2] + '</span></button>').join('');
  $('bpest').innerHTML = [['yo', 'Lo hago yo'], ['encargar', 'Encargar'], ['gobernador', 'Gobernador']].map((t, i) => '<button role="tab" data-act="bpest" data-v="' + t[0] + '"' + (i && !(t[0] === 'gobernador' && window.GOBERNADOR && window.GobernadorUI) ? ' class="off" aria-disabled="true"' : i ? '' : ' class="on" aria-selected="true"') + '>' + t[1] + '</button>').join('');   // MN1: «Encargar» (CE8) y «Gobernador» (MN3), aún huecos
}
/* ---------- consejo y piezas (CN4): el consejo habla de piezas, no de niveles de edificio ---------- */
const ROM = Ciudad.ROMANOS;
const cPz = k => k ? G.escalaCoste(k) : k;   // CE2: los costes de ciudad.js vienen con claves viejas; aquí, como se cobran
const sin0 = k => { const o = {}; k = cPz(k); for (const r in k) if (k[r] > 0) o[r] = k[r]; return o; };
const obraNom = o => o.b && D.BUILD[o.b] ? D.BUILD[o.b].n : o.pieza && Ciudad.EDIF[o.pieza] ? Ciudad.EDIF[o.pieza].nombre : 'una obra';
const durPieza = (c, P, k) => P.bid ? G.buildTime(c, P.bid) : D.ESTACION * Math.min(D.OBRA_ESTACIONES_MAX, G.estaciones(P.obra * (k || 1)));   // CE3-B: como game.js (1 o 2 estaciones)
const costePieza = (c, P, k) => P.bid ? G.costeObra(c, P.bid) : G.abarata(cPz(k), G.obraMul(c));   // CE3-B: lo que se cobra de verdad, con el abaratado del Foro y los bonos
/* qué se puede hacer con una pieza en una ciudad propia: mejorar la de menor nivel, o colocar una nueva (si nueva, o si no hay nada que mejorar) */
function opcionPieza(cid, pz, nueva) {
  const c = S().cities[cid], E = c && c.owner === 'roma' ? G.ciudadE(cid) : null, P = Ciudad.EDIF[pz];
  if (!E || !P || P.accion || !E.abiertas.includes(pz) || c.obras.length >= G.huecos(c)) return null;
  if (P.bid && ((D.BUILD[P.bid].sea && !D.CITIES[cid].sea) || G.faltaEspecial('edificio', P.bid, c.b[P.bid] || 0) || (P.bid === 'mina' && !G.vetaHierro(cid)))) return null;   // CE2: sin veta no hay mina
  let e = null;
  if (!nueva) for (const q of E.edificios) if (q.tipo === pz && !q.ruina && !q.obra && !c.obras.some(o => o.eid === q.id) && Ciudad.mejoraSiguiente(E, q.id) && (!e || (q.mejora || 0) < (e.mejora || 0))) e = q;
  if (e) { const m = Ciudad.mejoraSiguiente(E, e.id), k = (e.mejora || 0) + 1; const co = costePieza(c, P, m.coste); return { pieza: pz, mej: e.id, nombre: m.nombre, coste: sin0(co), lvl: k - 1, ini: co }; }
  const co = costePieza(c, P, P.coste); return { pieza: pz, mej: null, nombre: P.nombre, coste: sin0(co), lvl: -1, ini: co };
}
/* La acción aconsejada: almacén lleno, granero, población al tope, servicio del barrio, o la obra más barata que se puede pagar.
   Devuelve {t, rec, b (id D.BUILD o null), pieza (id de pieza o null), mej (id de la pieza a mejorar o null), flags} */
const FASE_MURALLA = ['Sin muralla', 'Empalizada', 'Muralla de piedra'];
/* CN7: aviso del arrabal (3 o más casas fuera del surco y sin muralla de piedra); '' si no toca */
function avisoArrabal(E) {
  if (!E || !Ciudad.casasArrabal) return ''; const n = Ciudad.casasArrabal(E), f = Ciudad.faseDeNivel ? (E.muralla.fase || 0) : 0;
  return n >= 3 && f < 2 ? ASESOR.TEXTOS.arrabal(n, f === 1) : '';
}
function consejo(c, id) {
  id = id || UI.city; const s = S(), cap = G.cap(), E = c.owner === 'roma' ? G.ciudadE(id) : null, flags = {};
  const lleno = D.RES.filter(r => r !== 'denarios').map(r => [r, G.reserva(r) / G.capDe(r)]).filter(x => x[1] >= 0.9).sort((x, y) => y[1] - x[1])[0];
  const tope = c.pop >= G.popCap(c) - 1;
  if (E && lleno && E.abiertas.includes('almacen')) flags.almacen = 'alerta';
  if (E && tope) flags.viviendas = 'alerta';
  const rg = E && typeof G.riesgos === 'function' ? (G.riesgos(id) || []).filter(r => r.meses <= G.avisoMeses()) : [];
  const rgP = rg.find(r => r.pieza && !E.edificios.some(q => q.tipo === r.pieza) && opcionPieza(id, r.pieza, true));
  if (rgP) flags[rgP.pieza] = 'alerta';
  const rgT = !rgP && rg[0] ? (rg[0].a || rg[0].t) : '';   // R4: el riesgo (más urgente) sustituye al consejo corriente
  const mk = (t, op) => ({ t: rgT || t, rec: !!op && G.canAfford(op.ini), b: op ? Ciudad.EDIF[op.pieza].bid || null : null, pieza: op ? op.pieza : null, mej: op ? op.mej : null, flags });
  if (c.obras.length >= G.huecos(c)) { const o = c.obras[0]; return { t: ASESOR.TEXTOS.obras(obraNom(o), c.obras.length - 1, estTxt(Math.max(1, G.estacionesRestan(o)))), rec: false, b: o.b || null, pieza: o.pieza || null, mej: null, flags }; }
  if (!E) return mk(ASESOR.TEXTOS.sinRecursos(), null);
  if (flags.almacen) return mk(ASESOR.TEXTOS.almacen(RES_NOM[lleno[0]].toLowerCase(), Math.min(100, Math.round(lleno[1] * 100)), E.edificios.some(q => q.tipo === 'almacen')), opcionPieza(id, 'almacen', true));
  if (rgP) { const op = opcionPieza(id, rgP.pieza, true); if (op && G.canAfford(op.ini)) return mk(rgP.a || rgP.t, op); }
  if (E.abiertas.includes('granero') && !E.edificios.some(q => q.tipo === 'granero') && (sc => sc.on.hambre && ((D.DIFICULTAD[sc.dif] || {}).hambre || {}).meses > 0)(G.sucesosEn(E.mesN + 1))) return mk(ASESOR.TEXTOS.granero(), opcionPieza(id, 'granero', true));
  if (tope) return mk(ASESOR.TEXTOS.tope(), null);
  const bi = G.barrioInfo(c), baja = bi.objetivo < bi.nivel, fl = baja ? (D.BARRIO[bi.nivel].pide || []).filter(k => !bi.serv[k]) : bi.falta;
  const sv = fl.map(k => ({ templo: 'templo', agua: 'fuente', mercado: 'mercado', grano: 'granja' })[k]).filter(Boolean).map(p => opcionPieza(id, p, true)).find(o => o && G.canAfford(o.ini));
  if (sv) return mk(ASESOR.TEXTOS.barrio(baja, baja ? D.BARRIO[bi.nivel].n : D.BARRIO[bi.nivel + 1].n, ({ templo: 'un templo', fuente: 'una fuente', mercado: 'un mercado', granja: 'más grano (una granja)' })[sv.pieza]), sv);
  const cand = ['granja', 'aserradero', 'cantera', 'mina', 'almacen'].map(p => opcionPieza(id, p, false)).filter(o => o && G.canAfford(o.ini)).sort((x, y) => x.lvl - y.lvl)[0];
  if (cand) return mk(avisoArrabal(E) || ASESOR.TEXTOS.mejora(cand.mej, cand.nombre), cand);
  return mk(avisoArrabal(E) || ASESOR.TEXTOS.sinRecursos(), null);
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
  const fk = c.obras.map(o => (o.eid || o.pieza || '') + (o.pausa ? 'p' : '')).join() + '|' + (sd ? sd.k + (sd.e ? sd.e.id + (sd.e.mejora || 0) + (sd.e.ruina ? 'r' : '') : '') + (sd.k === 'foro' ? c.b.foro : '') + (sd.k === 'foro' || (sd.e && (sd.e.tipo === 'granero' || sd.e.tipo === 'templo')) ? '|' + [c.rac, c.fiesta && c.fiesta.ofrenda, c.fiesta && c.fiesta.juegos, Math.floor(S().t), Math.round(S().res.denarios / 10)].join() : '') : '');
  return { cons, rec: cons.rec ? cons.b : null, flags: cons.flags, oculta: {}, fk };
}
const metaKey = m => JSON.stringify([m.cons.pieza, m.cons.mej, m.cons.rec, m.cons.t.replace(/Faltan .*$/, ''), m.flags, m.fk]);
/* ficha de lo tocado en modo mirar: nombre y nivel, qué hace, la obra en marcha, mejorar / derribar (mover: pendiente, falta G.mover en game.js) y lo propio de cada edificio */
/* CE3-B: los cinco niveles de un edificio en la ciudad: el actual marcado, los que están por encima del Foro con candado, y lo que cuesta y tarda el siguiente */
const ROM5 = ['', 'I', 'II', 'III', 'IV', 'V'];
function nivelesHtml(c, bid) {
  const L = bid === 'foro' ? (c.b.foro || 1) : (c.b[bid] || 0), tope = bid === 'foro' ? D.MAX_LVL : Math.min(D.MAX_LVL, c.b.foro || 1);
  let h = '<div class="nv5" role="list" aria-label="Niveles del edificio">';
  for (let i = 1; i <= D.MAX_LVL; i++) h += '<span role="listitem" class="nv5-c' + (i <= L ? ' hecho' : '') + (i === L ? ' act' : '') + (i > tope ? ' tope' : '') + '"' + (i === L ? ' aria-current="true"' : '') + '>' + ROM5[i] + (i > tope ? '<i>🔒</i>' : '') + '</span>';
  h += '</div><div class="nv5-t">' + (bid === 'foro' ? D.BUILD.foro.n : 'Edificio') + ' a nivel <b>' + (ROM5[L] || '0') + '</b> de ' + ROM5[D.MAX_LVL] + (bid !== 'foro' && tope < D.MAX_LVL ? ' · el Foro (nivel ' + ROM5[tope] + ') pone el tope' : '') + '</div>';
  return h;
}
const topeForo = (c, bid) => !!bid && bid !== 'foro' && (c.b[bid] || 0) < D.MAX_LVL && (c.b[bid] || 0) >= (c.b.foro || 1);
function fichaHtml(c, sd) {
  const E = G.ciudadE(UI.city), cn = D.CITIES[UI.city].n, lleno = c.obras.length >= G.huecos(c);
  let ico, nom, sub, que, nv, cuerpo = '', e = null, P = null, ob = null;
  if (sd.k === 'foro') {
    ico = (window.miniEdif && miniEdif('foro', c.b.foro || 1, 'p')) || bIco('foro'); nom = D.BUILD.foro.n; sub = cn + ' · nivel ' + (c.b.foro || 1) + (E && E.terreno && E.terreno !== 'rio' && D.TERRENOS[E.terreno] ? ' · ' + D.TERRENOS[E.terreno].n : ''); que = D.BUILD.foro.d; nv = 'NIVEL ' + (c.b.foro || 1);
    cuerpo = nivelesHtml(c, 'foro') + '<div class="nota">Obras a la vez: <b>' + c.obras.length + ' de ' + G.huecos(c) + '</b>. ' + (G.polis() ? 'El ágora' : 'El foro') + ' sube solo con las casas y los barrios: no se mejora ni se derriba.</div>' + (G.polis() && window.POLITEIA_UI ? '<button class="btn" data-act="politeia">🏛️ La política de la polis</button>' : '') + (G.comarcaTexto && G.comarcaTexto() ? '<div class="nota">🗺️ ' + esc(G.comarcaTexto()) + '</div>' : '') + (c.owner === 'roma' ? arcaHtml(c) : '');
  } else {
    e = sd.e || null; ob = sd.o || c.obras.find(q => q.eid === e.id) || null; P = Ciudad.EDIF[e ? e.tipo : sd.o.pieza];
    const bid = P.bid, dg = bid === 'templo' ? G.diosDe(c) : null, k = e ? (e.mejora || 0) : 0;
    ico = (bid && window.miniEdif && miniEdif(bid, e ? k + 1 : 0, 'p')) || (bid ? bIco(bid) : ICO_OBRA); nom = dg ? 'Templo de ' + dg.n : P.nombre; que = QUE_CE2[e ? e.tipo : sd.o.pieza] || P.que || '';
    nv = e ? 'NIVEL ' + ROM[k + 1] : 'EN OBRA'; sub = cn + (e ? ' · nivel ' + ROM[k + 1] + (e.ruina ? ' · en ruinas' : '') : ' · se está levantando');
    if (bid && bid !== 'muralla' && e && !e.ruina) cuerpo += nivelesHtml(c, bid);
    if (ob) cuerpo += '<div class="obra"><div class="prog" data-t0="' + ob.t0 + '" data-t1="' + ob.t1 + '"><i></i></div><span class="rem"></span></div>' + (e ? '<div class="nota">Sube a nivel ' + ROM[ob.mejora + 1] + '. Mientras dura la obra no se puede mejorar ni derribar.</div>' : '');
    else if (e) {
      const m = e.ruina ? null : Ciudad.mejoraSiguiente(E, e.id), fe = bid && !e.ruina ? G.faltaEspecial('edificio', bid, c.b[bid] || 0) : null, sinVeta = bid === 'mina' && !G.vetaHierro(UI.city);
      if (m && sinVeta) cuerpo += '<div class="nota mina-no">⚠ ' + esc(G.minaMotivo(UI.city)) + ' Esta mina vieja rinde el ' + Math.round(D.VETA_POBRE * 100) + ' %.</div>';   // CE2: sin veta no se sube; dice por qué
      else if (m) {
        const co = sin0(costePieza(c, P, m.coste)), dur = durPieza(c, P, k + 1), need1 = co, tp = topeForo(c, bid);
        cuerpo += '<div class="pagas">Pagas ahora:</div><div class="costes" style="--n:' + Object.keys(co).length + '">' + Object.keys(co).map(r => '<span class="cos" data-need=\'' + JSON.stringify({ [r]: need1[r] || 0 }) + '\'>' + D.RES_ICON[r] + '<b>' + fmt(need1[r] || 0) + '</b><small data-have="' + r + '"></small></span>').join('') + '</div>';
        if (bid && window.miniEdif && miniEdif(bid, k + 1)) cuerpo += '<div class="as-mejora">' + miniEdif(bid, k + 1, 'g') + '<span class="as-flecha"></span>' + miniEdif(bid, k + 2, 'g nuevo') + '</div>';
        cuerpo += '<div class="nota tarda">Tarda <b>' + mesesEst(dur) + '</b>.</div>';
        cuerpo += tp ? '<div class="nota nv5-no">⚠ ' + esc(G.ultimoMotivo === 'Sube antes el Foro' ? G.ultimoMotivo : 'Sube antes el Foro') + ': ningún edificio pasa de su nivel. El Foro sube con las casas.</div>' : fe ? faltaBtn(fe) : '<div class="fila"><button class="bmain' + (lleno ? ' no' : '') + '" data-act="mejpz" data-v="' + e.id + '"' + (lleno ? '' : " data-need='" + JSON.stringify(need1) + "'") + '>' + ICO_OBRA + 'Mejorar a ' + ROM[k + 2] + '</button></div>' + '<div class="nota">' + (lleno ? sinHuecoTxt(c) + '. ' : '') + obrasTxt(c) + (lleno ? '.' : '') + '</div>';
      } else if (!e.ruina && P.mejoras) cuerpo += '<div class="nota">Nivel máximo alcanzado.</div>';
      if (e.tipo !== 'compitum') {
        const dk = UI.city + ':' + e.id;
        cuerpo += '<div class="fila fila2">' + '<button class="bsec" data-act="mover" data-v="' + e.id + '">Mover</button>' + '<button class="bsec' + (UI.derr === dk ? ' sure' : '') + '" data-act="derr" data-v="' + e.id + '">' + (UI.derr === dk ? '¿Seguro? Derribar' : 'Derribar') + '</button></div>';
      } else cuerpo += '<div class="nota">Una capilla de cruce no se derriba.</div>';
    }
  }
  const bid = P && P.bid, extra = (bid === 'templo' ? diosBloque(c, 'templo') : '') + (bid === 'mercado' ? marketHtml() : '') + (bid === 'herreria' ? forjaHtml(c) : '') + (bid === 'escuela' ? escuelaHtml(c) : '') + (e && e.tipo === 'granero' && c.owner === 'roma' ? graneroHtml(c) : '') + (bid && e && !e.ruina && c.owner === 'roma' && reclutaDe(bid).length ? reclutarHtml(c, bid) : '');
  return '<div class="ficha"><div class="greca"></div><div class="cab"><span class="ic"' + (/as-mini/.test(ico) ? ' style="width:auto;height:auto;border:0;background:none;border-radius:0;margin-right:4px"' : '') + '>' + ico + '</span><div class="cn"><h2>' + esc(nom) + '</h2><p>' + esc(sub) + '</p></div><button class="x" data-act="cclose" aria-label="Cerrar la ficha">' + ICO_X + '</button></div>' +
    '<div class="cuerpo">' + (que ? '<div class="efecto"><span class="nv">' + nv + '</span><span>' + esc(que) + '</span></div>' : '') + cuerpo + (extra ? '<div class="fxd">' + extra + '</div>' : '') + '</div></div>';
}
/* ---------- CN4: una línea de contexto arriba y una bandeja de fichas abajo (nunca dos paneles) ----------
   UI.modo3: 'mirar' (bandeja) · 'colocar' (fantasma bajo el dedo) · 'muralla' (un solo botón) · 'ficha' (UI.bsel: la ficha del edificio, pieza B). */
const NOTA3 = { verde: 'Buen sitio', ocre: 'Sitio regular', rojo: 'Mal sitio', nada: 'Aquí no' };
const coste5 = k => Object.keys(k).filter(r => k[r] > 0).map(r => D.RES_ICON[r] + fmt(k[r])).join(' ');
const suma5 = k => Object.keys(k).reduce((a, r) => a + k[r], 0);
/* efecto/mejor (opcionales): la cifra grande de CN14-A; sin ellos #l-cifra queda vacío */
function lineaPon(t, clase, nota, seg, efecto, mejor) { UI.lin = (t || efecto) ? { t: t || '', c: clase || '', n: nota || '', hasta: seg ? performance.now() + seg * 1000 : 0, ef: efecto || null, mj: efecto && mejor != null ? mejor : null } : null; pintaLinea(); }
/* CN14-C: la lección del asesor que toca ahora (o null). No se marca como vista hasta pulsar «Entendido». */
function leccionHoy() {
  const s = S(); if (typeof ASESOR === 'undefined' || !s || !s.ajustes || !s.ajustes.asesor || (s.pending && s.pending.length) || s.vivo || !UI.cityV || !UI.cityV.meta) return null;
  let riesgo = false, arrabal = false, cuotas = false, lleno = false; const c = s.cities[UI.city];
  try { const rg = G.riesgos(UI.city) || []; riesgo = rg.some(r => r.meses <= G.avisoMeses()); } catch (e) { }
  try { arrabal = !!avisoArrabal(G.ciudadE(UI.city)); } catch (e) { }
  try { cuotas = !!(c && c.obras && c.obras.some(o => o.q)); } catch (e) { }
  try { const cap = G.cap(); lleno = !!cap && D.RES.filter(r => r !== 'denarios').some(r => G.reserva(r) / G.capDe(r) >= 0.9); } catch (e) { }
  const ctx = { mes: Math.floor(s.t + 1e-9), ahora: Date.now(), colocando: (UI.modo3 || 'mirar') !== 'mirar', cifra: !!$('l-cifra').textContent, cuotas, riesgo, barrioSube: false, almacenLleno: lleno, arrabal, turnos: !!s.turnos, hierroPolis: !!(G.polis() && !G.vetaHierro(G.capital())) };   // PN3e: la polis sin veta aprende a comprar hierro
  const r = ASESOR.siguiente(s.ajustes, ctx); return r || null;
}
const conSigno = n => (n < 0 ? '\u2212' : '+') + Math.abs(n);
/* CN13c: fuego por decidir. El reloj está parado (s.vivo); la tarjeta dice cuántas casas arden, el coste y la suerte esperada. Solo la muestra si no hay batalla pendiente. */
function vivoPinta() {
  const el = $('cubos'), s = S(), v = s && !s.over && !s.pending.length ? G.vivo() : null, inf = v && G.vivoInfo();
  if (!inf) { if (!el.hidden) el.hidden = true; UI.vivoK = ''; return; }
  const pl = inf.plan, n = pl.casas.length, k = v.cid + '|' + v.t0 + '|' + (inf.puede ? 1 : 0);
  if (UI.vivoK === k && !el.hidden) return;
  if ((UI.vivoK || '').split('|').slice(0, 2).join('|') !== k.split('|').slice(0, 2).join('|')) { UI.city = v.cid; if (UI.tab !== 'city') setTab('city'); if (UI.cityV && UI.cityV.listo) UI.cityV.mirar(inf.x, inf.z, 300, 0); }
  UI.vivoK = k; el.hidden = false;
  $('cu-t').textContent = '🔥 ' + (n === 1 ? 'Arde una casa' : 'Arden ' + n + ' casas') + ' en ' + inf.nombre;
  const cer = Math.min(...pl.casas.map(q => q.agua));
  $('cu-x').textContent = 'Cubos: ' + pl.coste + ' denarios, salvarías unas ' + String(pl.esperadas).replace('.', ',') + (pl.casas.some(q => q.tejada) ? ' (el techo de teja ayuda)' : '') + '. Agua más cercana: ' + cer + ' pasos. Decide antes de pasar estación.';
  const b = $('cu-si'); b.disabled = !inf.puede; b.textContent = inf.puede ? 'Mandar cubos' : 'Sin denarios para cubos';
}
function pintaLinea() {
  const l = $('linea'), m3 = UI.modo3 || 'mirar'; let x = UI.lin;
  if (x && x.hasta && performance.now() > x.hasta) x = UI.lin = null;
  let les = null;   // CN14-C: prioridad colocar > riesgo > lección > consejo (la lección calla con asesor apagado, batalla pendiente o s.vivo)
  if (!x && m3 === 'mirar' && UI.cityV && UI.cityV.meta) {
    x = { t: UI.cityV.meta.cons.t, c: 'aviso consejo', n: '' }; les = leccionHoy();
    if (les) x = { t: les.texto, c: 'aviso leccion', n: 'Lección' };
  }
  const ef = x && x.ef, mj = ef && x.mj != null && x.mj > ef.n ? x.mj : null;
  const k = UI.bsel || !x || (!x.t && !x.ef) ? '' : x.c + '|' + x.n + '|' + x.t + '|' + (ef ? ef.txt + '|' + ef.tono : '') + '|' + (mj != null ? mj : '') + '|' + (les ? 'L' + les.id : '');
  if (k === UI.linK) return; UI.linK = k;
  if (!k) { l.hidden = true; $('l-cifra').textContent = ''; $('l-ok').hidden = true; return; }
  $('l-ok').hidden = !les; UI.lesId = les ? les.id : null;
  l.hidden = false; l.className = x.c; $('l-nota').textContent = x.n; $('l-nota').hidden = !x.n; $('l-texto').textContent = x.t;
  const ci = $('l-cifra'); ci.className = ef ? ef.tono : ''; ci.textContent = ef ? ef.txt : '';
  if (mj != null) { const sm = document.createElement('small'); sm.textContent = 'mejor hasta ahora: ' + conSigno(mj); ci.appendChild(sm); }
}
/* datos de una ficha de la bandeja: nombre, coste total, lo que se paga al empezar y si ya hay obra */
function piezaInfo(id) {
  const c = S().cities[UI.city], E = G.ciudadE(UI.city);
  if (id === 'muralla') { const m = Ciudad.murallaSiguiente(E) || Ciudad.murallaAmpliar(E); return { nombre: E.muralla.rec ? 'Muralla ampliada' : E.muralla.ampl ? 'Muralla en ampliación' : E.muralla.fase ? 'Muralla de piedra' : 'Empalizada', coste: m && cPz(m.coste), ini: m && cPz(m.coste), enObra: !!E.muralla.obra || !!E.muralla.ampl, ya: !!E.muralla.rec, boton: m && m.nombre }; }
  const P = Ciudad.EDIF[id], dur = durPieza(c, P, 1), co = costePieza(c, P, P.coste);
  return { nombre: P.nombre, coste: co, ini: co, dur: dur, cerrada: P.bid === 'mina' && !G.vetaHierro(UI.city) ? G.minaMotivo(UI.city).replace(/\.$/, '') : P.bid ? G.faltaInv(P.bid) : null };   // CE2: la mina sin veta, cerrada con su motivo
}
const PZ_EMO = { salinas: '🧂', zanja: '〰️' };
/* CE2: lo que dicen de sí las piezas de ciudad.js con recursos viejos, dicho con los nuevos (ciudad.js lo cambia otra sesión) */
const QUE_CE2 = { aserradero: 'Da materiales (madera); va junto al bosque', cantera: 'Da materiales (piedra); va en una ladera de roca', salinas: 'Solo en la costa: da denarios, pero la sal estropea las granjas cercanas' };   // icono provisional hasta que carguen las miniaturas
function bandejaIds() {
  const E = G.ciudadE(UI.city); if (!E) return [];
  const ids = E.abiertas.filter(id => id !== 'muralla' && Ciudad.EDIF[id] && !Ciudad.EDIF[id].accion);
  if (Ciudad.murallaSiguiente(E) || Ciudad.murallaAmpliar(E) || E.muralla.obra || E.muralla.ampl || E.muralla.rec) ids.push('muralla'); return ids;
}
function bandejaPinta() {
  const b = $('bandeja'), E = G.ciudadE(UI.city); if (!E || !E.fundada) { b.innerHTML = ''; UI.bandK = ''; return; }
  const ids = bandejaIds(), k = UI.city + '|' + ids.join() + '|' + ids.map(q => piezaInfo(q).cerrada ? 1 : 0).join('') + '|' + E.muralla.fase + E.muralla.obra + (E.muralla.rec || 0) + (E.muralla.ampl || 0) + '|' + (UI.minis ? 1 : 0);
  if (k !== UI.bandK) {
    const antes = (UI.bandK || '').split('|')[1], viejas = antes ? antes.split(',') : []; UI.bandK = k;
    b.innerHTML = ids.map(id => { const i = piezaInfo(id);
      return '<button class="pza' + (viejas.length > 1 && !viejas.includes(id) ? ' nueva' : '') + (i.cerrada ? ' cerrada' : '') + '" data-id="' + id + '"' + (i.cerrada ? ' style="opacity:.55" title="' + esc(i.cerrada) + '"' : '') + '>' + (UI.minis && UI.minis[id] ? '<img src="' + UI.minis[id] + '" alt="" draggable="false">' : '<i>' + (PZ_EMO[id] || '') + '</i>') + '<b>' + esc(i.nombre) + '</b><span>' + (i.cerrada ? 'cerrada' : i.enObra ? 'en obra' : i.ya ? 'ya ampliada' : i.coste ? fmt(suma5(i.coste)) : '') + '</span></button>'; }).join('');
  }
  /* CN8: la ficha que remedia un riesgo (fuente o granero) sale resaltada; se recalcula solo al cambiar la ciudad */
  const rk = UI.city + '|' + E.rev + '|' + E.mesN + '|' + ((G.state && G.state.ajustes && G.state.ajustes.v) || 0); if (UI.rgK !== rk) { UI.rgK = rk; const r = typeof G.riesgos === 'function' ? (G.riesgos(UI.city) || []).find(q => q.pieza && q.meses <= G.avisoMeses() && !E.edificios.some(e => e.tipo === q.pieza)) : null; UI.rgPz = r ? r.pieza : null; }
  for (const f of b.children) { const i = piezaInfo(f.dataset.id); f.classList.toggle('cara', !i.enObra && !!i.ini && !G.canAfford(i.ini)); f.classList.toggle('aconseja', f.dataset.id === UI.rgPz && !i.enObra); }
}
function cityPantalla() {
  const m3 = UI.bsel ? 'ficha' : (UI.modo3 || 'mirar'), cs = $('csheet'); if (cs.dataset.m !== m3) cs.dataset.m = m3;
  if (UI.menuC) { const Ef = G.ciudadE(UI.city); UI.menuC.sync(m3, !!(Ef && Ef.fundada)); }   // CD1b: la bandeja de fichas ya no se pinta
  const si = $('b-si'); if (!si || (m3 !== 'colocar' && m3 !== 'muralla')) return;
  const c = S().cities[UI.city], lleno = c.obras.length >= G.huecos(c); let t, off;
  if (m3 === 'colocar') { const i = piezaInfo(UI.sel3.id), x = UI.sel3; off = !x.vale || lleno || !G.canAfford(i.ini); t = !x.vale ? 'Aquí no se puede' : lleno ? (G.huecos(c) === 1 ? 'Ya hay una obra en curso' : 'Sube el foro para otra obra') : !G.canAfford(i.ini) ? 'Faltan recursos<small>' + coste5(i.ini) + '</small>' : 'Construir aquí' + '<small>' + coste5(i.ini) + '</small>'; }
  else { const i = piezaInfo('muralla'); off = !i.ini || lleno || !G.canAfford(i.ini); t = !i.ini ? 'Obra en marcha' : lleno ? (G.huecos(c) === 1 ? 'Ya hay una obra en curso' : 'Sube el foro para otra obra') : !G.canAfford(i.ini) ? 'Faltan recursos<small>' + coste5(i.ini) + '</small>' : i.boton + '<small>' + coste5(i.ini) + '</small>'; }
  if (si._t !== t) { si._t = t; si.innerHTML = t; } si.disabled = off;
}
function salir3(avisar) {
  if (UI.modo3 === 'fundar') { if (G.fundando()) { cerrarFundar(true); fundarCancelado(); } else cerrarFundar(); return; }
  UI.modo3 = 'mirar'; UI.sel3 = null;      /* con sel3 se van el efecto y el «mejor» */
  if (UI.cityV) { UI.cityV.ponerFantasma(null); UI.cityV.calor(null); }
  if (!avisar) lineaPon(''); cityPantalla(); pintaLinea();
}
function elegir3(id, p) {
  if (!UI.cityV || !G.ciudadE(UI.city)) return; UI.bsel = null; UI.vistas = false; UI.col3City = UI.city; $('csheet').dataset.m = '';
  if (id === 'muralla') { UI.modo3 = 'muralla'; UI.modoT = performance.now(); UI.sel3 = null; UI.cityV.ponerFantasma(null); UI.cityV.calor(null); const E = G.ciudadE(UI.city);
    lineaPon(!Ciudad.murallaSiguiente(E) && Ciudad.murallaAmpliar(E) ? 'La muralla se amplía por fuera del surco: los barrios nuevos dejan de ser arrabal.' : Ciudad.murallaSiguiente(E) ? (E.muralla.fase ? 'La empalizada se rehace en piedra, con torres y puertas donde cruzan las calles.' : 'La empalizada sigue el surco, con puertas donde cruzan las calles. Las casas de fuera quedan de arrabal.') : E.muralla.rec ? 'La muralla ya está ampliada: los barrios nuevos quedan dentro.' : 'La obra de la muralla ya está en marcha.', 'aviso'); renderCity3D(); return; }
  UI.modo3 = 'colocar'; UI.modoT = performance.now(); UI.sel3 = { id, efecto: null, mejor: null }; UI.cityV.calor(G.mapaCalor(UI.city, id));
  if (!p) p = UI.cityV.sueloEn(innerWidth / 2, innerHeight * 0.45); if (!p) { const E = G.ciudadE(UI.city); p = [E.foro.x, E.foro.z]; }
  renderCity3D(); mover3(p[0], p[1]);
}
function mover3(x, z) {
  const sel = UI.sel3; if (UI.modo3 !== 'colocar' || !sel) return; const n = G.notaSitio(UI.city, sel.id, x, z); if (!n) return;
  const col = n.vale ? Ciudad.color(n.nota) : 'rojo'; Object.assign(sel, { x, z, vale: n.vale, nota: n.nota });
  UI.cityV.ponerFantasma({ id: sel.id, x, z, ang: n.ang || 0, color: col, radio: n.vale ? n.radio : 0 });
  const ef = n.efecto || null; sel.efecto = ef; if (ef && (sel.mejor == null || ef.n > sel.mejor)) sel.mejor = ef.n;
  /* con cifra grande se quita de las razones la frase que repite el número */
  const rz = ef ? n.razones.filter(r => !/^(Daría agua a|Llegaría a|Su humo molestaría a) \d|^\d+ casas comprarían aquí/.test(r)) : n.razones;
  lineaPon(rz.join(' · '), 'sitio ' + col, NOTA3[col], 0, ef, sel.mejor); cityPantalla();
}
function construir3() {
  if (performance.now() - (UI.modoT || 0) < 450) return;      // el «clic fantasma» del toque en la ficha cae sobre el botón recién aparecido
  if (UI.modo3 === 'fundar') { fundarAqui(); return; }
  if (UI.modo3 === 'muralla') {
    // CN7: tabla de guerra, saqueo y consejo cuelgan de G.levantarMuralla
    const E3 = G.ciudadE(UI.city), amp = !Ciudad.murallaSiguiente(E3) && (!!Ciudad.murallaAmpliar(E3) || !!E3.muralla.rec || !!E3.muralla.ampl), nom = piezaInfo('muralla').nombre, r = amp ? G.ampliarMuralla(UI.city) : G.levantarMuralla(UI.city); if (!r.ok) { lineaPon(r.motivo, 'aviso malo', '', 4); toast(r.motivo, 'bad'); return; }
    salir3(); toast(amp ? '🔨 Muralla: ampliación en marcha' : '🔨 ' + nom + ': en obra', 'good'); renderCity3D(); tickUI(); return; }
  const sel = UI.sel3; if (UI.modo3 !== 'colocar' || !sel) return;
  if (sel.mover) { const r = G.moverPieza(UI.city, sel.mover, sel.x, sel.z); if (!r.ok) { lineaPon(r.motivo, 'aviso malo', '', 4); toast(r.motivo, 'bad'); cityPantalla(); return; }
    salir3(); toast('🚚 ' + Ciudad.EDIF[sel.id].nombre + ' movido, con sus mejoras', 'good'); renderCity3D(); tickUI(); return; }
  const r = G.colocar(UI.city, sel.id, sel.x, sel.z);
  if (!r.ok) { lineaPon(r.motivo, 'aviso malo', '', 4); toast(r.motivo, 'bad'); cityPantalla(); return; }
  const P = Ciudad.EDIF[sel.id]; salir3(); toast('🔨 ' + P.nombre + ': obra en marcha (' + quedanTxt(r.obra.t1) + ')', 'good'); renderCity3D(); tickUI();
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
  const hayCapas = !!(window.BarrioUI && window.BarrioUI.hayCapas), capasOn = !!(window.BarrioUI && window.BarrioUI.capasAbiertas);   // CDe3: un solo botón de vista; sus opciones salen en un menú
  const vo = (act, v, t, on) => '<button class="vo' + (on ? ' on' : '') + '" role="menuitem" data-act="' + act + '"' + (v ? ' data-v="' + v + '"' : '') + '>' + t + '</button>';
  $('ctop').innerHTML = '<button class="vb" data-act="cvistas" aria-label="Vista de la ciudad: abrir las opciones" aria-expanded="' + !!UI.vistas + '" title="Vista de la ciudad">' + ICO_VER + '</button>' +
    (UI.vistas ? '<div class="vmenu" role="menu">' + vo('cplano', '', UI.cityV && UI.cityV.enPlano ? 'De cerca' : 'Desde arriba') + vo('cview', 'ciudad', 'Ciudad entera') + vo('cview', 'calle', 'Calle') + vo('cview', 'ejercito', 'Tropas') + (hayCapas ? vo('capas', '', capasOn ? 'Ocultar necesidades' : 'Ver necesidades', capasOn) : '') + '</div>' : '');
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
/* CN26: cola «En instrucción» y tarjetas de reclutar. Sin bid, todas las unidades (pestaña Ejército); con bid, solo las que pide ese edificio (ficha del Cuartel, del Establo…) */
const reclutaDe = bid => Object.keys(D.UNITS).filter(k => D.UNITS[k].cost && G.reclutable(k) && (!bid || Object.keys(D.UNITS[k].req)[0] === bid));
function reclutarHtml(c, bid) {
  const ks = reclutaDe(bid); let h = '';
  if (c.train.length) {
    h += '<div class="sec">En instrucción</div>';
    h += c.train.map(q => '<div class="row"><div style="display:flex;justify-content:space-between"><span>' + q.n + ' × ' + D.UNITS[q.u].n + '</span><span class="rem"></span></div><div class="prog" data-t0="' + q.t0 + '" data-t1="' + q.t1 + '"><i></i></div></div>').join('');
  }
  h += '<div class="sec">Reclutar</div>';
  for (const k of ks) {
    const u = D.UNITS[k], pf = G.polisFicha(), loc = pf && pf.tropa.id === k ? pf.tropa : null;   // PN2: la tropa propia de la polis lleva su nombre local
    const ok = G.unitOk(c, k), rb = Object.keys(u.req)[0], n = cohort(k), fe = (c.b[rb] || 0) >= u.req[rb] ? G.faltaEspecial('tropa', k) : null;
    h += '<div class="card ' + (ok ? '' : 'locked') + '"><div class="pt">' + pt(k) + '</div><div class="bd"><div class="tt">' + (loc ? loc.n : u.n) + '</div><div class="ds">' + (loc ? loc.d : u.d) + '</div>' + licHtml(u) +
      '<div class="bars">' + bar('Ataque', u.ratk || u.atk, 16) + bar('Defensa', u.def, 16) + bar('Moral', u.mor, 100) + bar('Velocidad', u.spd, 85) + '</div>' + pagasHtml(G.loteCoste(c, k, n)) + '<div class="ds tarda">Tarda <b>' + mesesEst(G.trainDur(c, k, n)) + '</b></div>' + (ok ? avisoMo(c, n) : '') + '</div>' +
      (ok ? '<div class="btns"><button class="btn" data-act="train" data-v="' + k + '" data-n="' + n + '" data-need=\'' + JSON.stringify(G.loteCoste(c, k, n)) + '\'>+' + n + '<small>' + mesesEst(G.trainDur(c, k, n)) + '</small></button><button class="btn" data-act="train" data-v="' + k + '" data-n="' + n * 3 + '" data-need=\'' + JSON.stringify(G.loteCoste(c, k, n * 3)) + '\'>+' + n * 3 + '<small>' + mesesEst(G.trainDur(c, k, n * 3)) + '</small></button></div>'
        : fe ? faltaBtn(fe) : '<button class="btn no">' + D.BUILD[rb].n + '<small>nivel ' + u.req[rb] + '</small></button>') + '</div>';
  }
  return h;
}
function viewArmy() {
  const s = S(), c = s.cities[UI.city], p = G.prod(), EM = D.TURNO_MESES || 3;
  let h = '<h2 class="vtit">Tropas</h2>' + (window.laminaHtml ? laminaHtml('tropas') : '') + cityChips() + '<div class="sec">Guarnición de ' + D.CITIES[UI.city].n + ' · ' + G.men(c.units) + ' hombres</div>' + troopsHtml(c.units);
  { const hr = G.heridosDe(UI.city), nh = G.men(hr); if (nh > 0) h += '<div class="empty">🩹 Heridos: ' + nh + ' (' + Object.keys(hr).map(k => hr[k] + ' ' + D.UNITS[k].n.toLowerCase()).join(', ') + '). Vuelven a filas poco a poco cada estación.</div>'; }   // CG4b
  h += '<div class="empty">' + popHtml(c) + '</div>';
  h += '<div class="empty">Por estación · 🌾 Consumo de todas tus tropas: ' + Math.round(p.upkeep * EM) + ' grano · 🪙 Mantenimiento: −' + Math.round(p.mant.total * EM) + ' denarios (edificios ' + Math.round(p.mant.edificios * EM) + ', paga ' + Math.round(p.mant.tropas * EM) + ') · ⚖️ Rutas: +' + Math.round(p.rutas * EM) + ' denarios · 🛡️ Guardia urbana al defender: ' + (20 + 20 * G.nivelMuralla(c)) + '<br>Para enviarlas a la guerra, toca una ciudad vecina en el mapa.</div>';
  h += reclutarHtml(c);
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
  if (k('oroCom')) a.push('comercio ' + r('oroCom') + ' % más denarios');
  if (k('rutaRenta')) a.push('rutas ' + r('rutaRenta') + ' % más rentables');
  if (k('rutas')) a.push('+' + ef.rutas + ' ruta comercial');
  if (k('paga')) a.push('paga de tropas ' + r('paga') + ' % menor');
  if (k('instr')) a.push('instrucción ' + r('instr') + ' % más corta');
  if (k('popCap')) a.push('cabe ' + r('popCap') + ' % más gente');
  if (k('viajeTierra')) a.push('marchas por tierra ' + mesesEst(ef.viajeTierra.resta) + ' menos en trayectos largos');
  if (k('viajeMar')) a.push('viajes por mar ' + mesesEst(ef.viajeMar.resta) + ' menos en trayectos largos');
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
  if (st.e === 'hecha') { h += '<div class="sv-ok">✔ Ya lo sabes.</div>'; const rf = G.invReformaInfo(id);
    if (d.excl && d.excl.length) { if (UI.svRef === id && rf.alt) { const c = rf.coste; h += '<div class="sv-aviso"><b>Cambiar a ' + esc(D.INVEST[rf.alt].n) + '</b><p>Pierdes ya: ' + esc(efTxt(d.ef)) + '. Lo que pagaste no vuelve' + (rf.pierde ? ' y se restan ' + rf.pierde + ' puntos de gloria' : '') + '. Pagas el coste completo del nuevo y estudias ' + mesesEst(rf.tiempo) + ' sin él:</p>' + svCoste(rf.alt) + (rf.ok ? '<button class="btn ro-sello" data-act="saberreformar" data-v="' + id + '">Sí, cambiar de saber</button> ' : '<div class="sv-no">' + esc(rf.motivo) + '</div>') + '<button class="btn ro-tinta" data-act="saberreformano">Mejor no</button></div>'; }
      else h += rf.motivo && !rf.alt ? '<div class="sv-no">' + esc(rf.motivo) + '</div>' : '<button class="btn" data-act="saberreforma" data-v="' + id + '">Cambiar de saber…</button>'; }
    return h + '</div>'; }
  h += svCoste(id) + '<div class="sv-m">' + mesesEst(G.invTiempo(id)) + ' de estudio</div>' + svEureka(id);
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
  let h = '<div class="ro ro-mos"><div class="ro-palo"></div><div class="ro-papiro sv mos mos-sab"><div class="mos-cab"><h2 class="ro-ansata">Saber</h2>' + (window.laminaHtml ? laminaHtml('saber') : '') + '', gu = '';   // K12c: cabecera fija, cuerpo con scroll, «volver» abajo
  if (!V.nHechas && !V.cola) gu += '<div class="sv-guia"><b>Primera vez</b><ol><li>Investiga Preceptores griegos.</li><li>Construye la Escuela y pon gente a estudiar desde su ficha.</li><li>En cada par elige uno: el otro se cierra.</li></ol></div>';
  const hc = h; h = '';
  h += '<div class="sv-ed"><b>Edad ' + ['I', 'II', 'III', 'IV'][V.edad - 1] + ' · ' + esc(V.edadNombre) + '</b>';
  if (V.sig) { h += '<small>Para la edad ' + ['II', 'III', 'IV'][V.edad - 1] + ' (' + esc(V.sig.n) + '):</small>' + svChips(V.sig.req) + svCoste(V.sig.id) + '<div class="sv-m">' + months(V.sig.tiempo) + '</div>';
    h += V.sig.estado.e === 'ok' ? '<button class="btn" data-act="saberedad">Subir de edad</button>' : V.sig.estado.e === 'curso' || V.sig.estado.e === 'cola' || V.sig.estado.e === 'req' ? '' : '<div class="sv-no">' + esc(V.sig.estado.motivo) + '</div>'; }
  else h += '<small>Has llegado a la última edad.</small>';
  h += '</div>'; const ed = h; h = hc;
  if (V.cola) { const vel = V.cola.vel || 1, t0 = s.t - V.cola.p / vel, t1 = s.t + (V.cola.P - V.cola.p) / vel;
    h += '<div class="sv-cola"><b>Estudiando: ' + esc(V.cola.n) + '</b><div class="prog" data-t0="' + t0 + '" data-t1="' + t1 + '"><i></i></div><span class="rem"></span>' + (V.cola.eureka ? '<div class="sv-eu">💡 Eureka: ritmo ×1,33</div>' : '') + (V.cola.sabios && V.cola.sabios.n > 0 ? '<div class="sv-eu">📜 Ritmo ×' + dec1(V.cola.sabios.vel).replace(/,0$/, '') + ' con tus ' + V.cola.sabios.n + ' sabios' + (V.cola.sabios.vel >= 0.9 * D.SABER.velMax ? ' · Tope útil alcanzado' : '') + '</div>' : '') + '</div>'; }
  h += '<div class="sv-ramas">' + Object.keys(SV_RAMAS).map(k => '<span class="sv-r">' + SV_RAMAS[k][0] + ' ' + SV_RAMAS[k][1] + '<b>' + V.ramas[k] + '</b></span>').join('') + '</div>';
  h += '</div><div class="mos-cuerpo">' + gu + ed + '<div class="sv-forja">⚔️ Guerra: forja, armas nivel ' + s.forja.armas + ', armaduras nivel ' + s.forja.armaduras + ' (se dirige desde la herrería de la ciudad).</div>';
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
  return h + '</div></div>' + RO_PIE_VOL;
}
/* CN17: encargo corto del Senado (uno cada vez) y hitos */
function encargoHtml() {
  const en = G.encargoActual();
  return en ? '<div class="sec ro-rubrica">Encargo del Senado</div><div class="card sn-mi ro-tabla"><div class="tt">' + esc(en.e.n) + '</div><div class="ds">' + esc(en.e.texto) + '</div><div class="sn-fa"><b>Llevas</b> ' + Math.min(en.tiene, en.pide) + ' de ' + en.pide + ' · quedan ' + mesesEst(en.quedan) + '</div></div>' : '';
}
const hitosHtml = () => '<div class="sec ro-rubrica">Hitos</div><div class="sn-ex sn-hitos">' + G.hitosVista().map(x => (x.logrado ? '✔ ' : '▫ ') + esc(x.h.n)).join(' · ') + '</div>';   // MN2: van en «Tu carrera»
/* SN2: sala del Senado. Ley de la estación, hemiciclo de 30 escaños en tres bandos, tratos, tribuno y voto.
   Lee el motor de SN1 (G.senadoSala, G.votos, G.tratos, G.veto); la elección de tratos vive solo en UI.sn2 (no se guarda). */
const SN2_COL = { ter: '#46661f', mer: '#2c6f8c', mil: '#9b2a1a', sac: '#7a5a08', ita: '#56397f', pro: '#9a4f12', pue: '#7a3424', fam: '#b8860b' };   // tinta de cada bando sobre papiro (más oscura que D.BANDOS.col); fam = tu familia
const SN2_DICT = { historico: 'histórico', probable: 'probable' };
// CE6: un asiento por escaño (de 30 a 300); filas según el total; bandos en su orden y tu familia, en dorado, al final
function sn2Hemiciclo(v) {
  const cx = 195, cy = 186, N = v.total || 30, R = N <= 40 ? 3 : N <= 100 ? 5 : N <= 200 ? 7 : 9, r0 = 62, r1 = 150, rr = [], es = [];
  for (let i = 0; i < R; i++) rr.push(r0 + (r1 - r0) * i / Math.max(1, R - 1));
  const sr = rr.reduce((a, b) => a + b, 0), filas = rr.map(r => Math.max(1, Math.round(N * r / sr)));
  let d = N - filas.reduce((a, b) => a + b, 0); for (let i = R - 1; d !== 0; i = (i + R - 1) % R) { filas[i] += d > 0 ? 1 : -1; d += d > 0 ? -1 : 1; }
  let rad = 10; filas.forEach((n, i) => { rad = Math.min(rad, Math.PI * rr[i] / n * 0.42); }); if (R > 1) rad = Math.min(rad, (rr[1] - rr[0]) * 0.45);
  filas.forEach((n, i) => { const r = rr[i]; for (let k = 0; k < n; k++) { const a = Math.PI * (1 - (k + .5) / n); es.push({ a, x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }); } });
  es.sort((p, q) => q.a - p.a);
  const grupos = Object.keys(v.porBando).map(b => Object.assign({ b }, v.porBando[b]));
  if (v.familia) grupos.push({ b: 'fam', escanos: v.familia, si: v.familia, duda: 0, no: 0 });
  const R1 = rad.toFixed(1), sw = Math.max(1, rad / 6).toFixed(1);
  let h = '<path d="M30 186A165 165 0 0 1 360 186Z" class="sn2-arco"/><path d="M150 186A45 45 0 0 1 240 186Z" class="sn2-cons"/>', k = 0;
  for (const x of grupos) {
    const col = SN2_COL[x.b] || '#333', g = es.slice(k, k + x.escanos); k += x.escanos;
    g.sort((p, q) => Math.hypot(p.x - cx, p.y - cy) - Math.hypot(q.x - cx, q.y - cy));
    g.forEach((s, i) => {
      const X = s.x.toFixed(1), Y = s.y.toFixed(1);
      if (i < x.si) h += '<circle cx="' + X + '" cy="' + Y + '" r="' + R1 + '" fill="' + col + '" stroke="#2b1c0a" stroke-width="' + sw + '"/>';
      else if (i < x.si + x.duda) h += '<circle cx="' + X + '" cy="' + Y + '" r="' + (rad * .85).toFixed(1) + '" fill="none" stroke="' + col + '" stroke-width="' + (rad / 4).toFixed(1) + '" stroke-dasharray="' + (rad / 2.5).toFixed(1) + ' ' + (rad / 3.3).toFixed(1) + '"/>';
      else h += '<circle cx="' + X + '" cy="' + Y + '" r="' + (rad * .85).toFixed(1) + '" fill="rgba(60,35,10,.12)" stroke="' + col + '" stroke-width="' + sw + '" opacity=".75"/>';
    });
  }
  return '<svg class="sn2-sala" viewBox="0 16 390 178" role="img" aria-label="Sala del Senado: ' + v.si + ' sí, ' + v.duda + ' dudan, ' + v.no + ' no, de ' + N + ' escaños">' + h + '<text x="195" y="178" text-anchor="middle" class="sn2-ban" fill="#e9c063">CÓNSULES</text></svg>';
}
// CE6: los bandos del Senado (familia, escaños, humor y lo que piden); los que aún no han entrado, al pie
function sn2Bandos() {
  const sb = G.senadoBandos && G.senadoBandos(); if (!sb) return '';
  const on = sb.bandos.filter(b => b.activo), off = sb.bandos.filter(b => !b.activo);
  let o = '<div class="sec ro-rubrica">Bandos · ' + sb.total + ' escaños</div><div class="sn6">';
  for (const b of on) o += '<div class="sn6-b"><u style="background:' + b.col + '"></u><span class="sn6-n"><b>' + esc(b.fam) + '</b> · ' + esc(b.n.toLowerCase()) + '</span><span class="sn6-e">' + b.escanos + '</span>' +
    '<div class="sn-bar sn6-h"><i style="width:' + b.humor + '%;background:' + b.col + '"></i></div><span class="sn6-hn">' + b.humor + '</span>' + (b.pide ? '<span class="sn6-p">Pide: ' + esc(b.pide) + '</span>' : '') + '</div>';
  o += '<div class="sn6-b sn6-fam"><u style="background:' + SN2_COL.fam + '"></u><span class="sn6-n"><b>Tu familia</b> · vota contigo</span><span class="sn6-e">' + sb.familia + '</span></div>';
  if (off.length) o += '<div class="sn6-fal">' + off.map(b => '<span><b>' + esc(b.fam) + '</b> (' + esc(b.n.toLowerCase()) + '): ' + esc(b.falta.charAt(0).toLowerCase() + b.falta.slice(1)) + '.</span>').join('') + '</div>';
  return o + '<p class="sn-ex">Escaños: uno por cada 20 habitantes de tus ciudades (tope 300). Cada provincia los da a su bando afín. Mayoría: ' + sb.mayoria + '.</p></div>';
}
function sn2Titulo(t) {
  if (t.tipo === 'si') return 'Ya votan sí';
  if (t.tipo === 'pago') return 'Pagar ' + t.coste + ' denarios por sus votos';
  return t.promesa && t.promesa.tipo === 'sinLeva' ? 'Prometer: sin leva en ' + D.CITIES[t.promesa.ciudad].n : 'Prometer: ' + (t.promesa ? t.promesa.n : 0) + ' hombres en armas';
}
function viewSala(sala) {
  const s = S(), S2 = D.SENADO, l = sala.ley, f = G.favor();
  if (!UI.sn2 || UI.sn2.ley !== l.id) UI.sn2 = { ley: l.id, b: {} };
  const tr = G.tratos(l), elegidos = tr.filter(t => t.tipo !== 'si' && UI.sn2.b[t.bando]), v = G.votos(l, elegidos), vet = G.veto(l), falta = v.mayoria || S2.mayoria;
  const barra = (n, x, c) => '<div class="sn2-f"><span>' + n + '</span><div class="sn-bar"><i class="' + c + '" style="width:' + Math.round(x) + '%"></i></div><b>' + Math.round(x) + '</b></div>';
  const fu = l.fuente ? '<div class="sn2-fu">' + esc(l.fuente) + (l.dictamen ? ' · ' + esc(SN2_DICT[l.dictamen] || l.dictamen) : '') + '</div>' : '';
  let o = '<div class="ro ro-sen"><div class="ro-palo"></div><div class="ro-papiro sn sn2' + (l.n.length + l.texto.length > 90 ? ' larga' : '') + '">' + senTabs('hoy', true) +
    '<div class="sn2-fav">' + barra('Senado', f.senado, 'sen') + barra('Pueblo', f.pueblo, 'pue') + '</div>' +
    '<div class="sn2-ley ro-tabla"><div class="sn2-lc"><small>' + (sala.cambiada ? 'La propones tú' : 'Propone el Senado') + '</small>' + (sala.cambiada ? '' : '<button class="btn ro-bronce sn2-cam" data-act="sn2-cambiar">Cambiar ley</button>') + '</div><h3>' + esc(l.n) + '</h3><p>' + esc(l.texto) + '</p>' + fu +
    '</div>' +
    sn2Hemiciclo(v) +
    '<div class="sn2-cuenta"><b class="si">' + v.si + ' sí</b> · <b class="du">' + v.duda + (v.duda === 1 ? ' duda' : ' dudan') + '</b> · <b class="no">' + v.no + ' no</b> <em>· hacen falta ' + falta + '</em></div><div class="sn2-tratos">';
  for (const t of tr) {
    const on = t.tipo !== 'si' && !!UI.sn2.b[t.bando], cls = t.etiqueta === 'Favorable' ? 'fav' : t.etiqueta === 'Dudoso' ? 'dud' : 'arr';
    const vt = 'Te dan <b>' + t.extra + (t.extra === 1 ? ' voto' : ' votos') + '</b>. ', txt = t.tipo === 'si' ? 'No piden nada.' : t.tipo === 'pago' ? vt + Math.round(t.coste / Math.max(1, t.extra)) + ' denarios cada uno.' : vt + 'Romperla: ' + S2.romper + ' de favor.';
    o += '<button class="sn2-trato' + (on ? ' on' : '') + (t.tipo === 'si' ? ' ya' : '') + '"' + (t.tipo === 'si' ? ' disabled' : ' data-act="sn2-trato" data-v="' + t.bando + '"') + ' data-b="' + t.bando + '" aria-pressed="' + on + '">' +
      '<span class="sn2-th"><u style="background:' + D.BANDOS[t.bando].col + '"></u><span>' + (D.BANDOS[t.bando].fam ? D.BANDOS[t.bando].fam + ' · ' : '') + D.BANDOS[t.bando].n.toLowerCase() + ' · ' + t.escanos + ' esc.</span><s class="' + cls + '">' + (t.tipo === 'si' ? 'Ya votan sí' : t.etiqueta) + '</s></span>' + (t.tipo === 'si' ? '' : '<b class="sn2-tt">' + sn2Titulo(t) + '</b><span class="sn2-tx">' + txt + '</span>') + '</button>';
  }
  const ple = ((l.chips || {}).ple || 0);
  o += '</div><div class="sn2-tri"><b>Tribuno de la plebe</b>' + (vet.veta ? 'Vetará: el pueblo está a ' + vet.pueblo + ' y pide ' + vet.umbral + '.' : ple < 0 ? 'No veta: la plebe está contenta.' : 'No veta: esta ley no daña a la plebe.') +
    '</div></div><div class="ro-palo"></div>';
  const con = elegidos.length === 1 ? (elegidos[0].tipo === 'pago' ? 'Con el pago' : 'Con la promesa') : elegidos.length ? 'Con ' + elegidos.length + ' tratos' : 'Sin tratos';
  const pie = v.si >= falta ? con + ': ' + v.si + ' de ' + falta : 'Saldría que no: ' + v.si + ' de ' + falta;
  return o + '<div class="ro-pie sn2-pie"><button class="btn ro-bronce sn2-pasar" data-act="sn2-pasar">Dejar pasar</button>' + (vet.veta ? '<button class="btn ro-sello sn2-votar sn2-jue" data-act="sn2-juegos"><b>Juegos en el Foro</b><span>' + S2.juegos.denarios + ' denarios: +' + S2.juegos.pueblo + ' al pueblo</span></button>' : '<button class="btn ro-sello sn2-votar" data-act="sn2-votar"><b>Votar</b><span>' + pie + '</span></button>') + '</div></div>';
}
function sn2Resultado(r) {
  if (!r || !r.ok) { toast((r && r.motivo) || 'No se pudo votar.', 'bad'); return; }
  UI.sn2 = null; UI.codice = null; UI.vistas = false; UI.cityList = false; setTab('city'); toast(r.linea, r.sale ? 'good' : 'bad');
}
function sn2Cambiar() {
  const alt = G.propuestasAlternativas();
  if (!alt.length) { toast('No hay otra ley que proponer ahora.', 'bad'); return; }
  carta('<div class="yr">CAMBIAR LA PROPUESTA</div><h2>¿Qué ley propones?</h2><p>Cambiarla cuesta ' + (-D.SENADO.cambiar) + ' de favor con los tres bandos. Solo una vez por estación.</p>' +
    alt.map(id => { const l = G.leyDe(id), v = G.votos(l, []); return '<div class="card sn2-alt"><div class="bd"><div class="tt">' + esc(l.n) + '</div><div class="ds">' + esc(l.texto) + '</div><div class="ds">Hoy: ' + v.si + ' sí · ' + v.duda + ' dudan · ' + v.no + ' no</div></div><button class="btn gold" data-act="sn2-proponer" data-v="' + esc(id) + '">Proponer</button></div>'; }).join('') +
    '<div class="acts"><button class="btn ghost" data-act="close">No cambiar</button></div>');
}
/* MN2: el Senado en cuatro pestañas de cera. «Hoy se vota» es la sala (SN2) o, sin votación, la misión y el encargo;
   «Tu carrera» y «Fiestas» dejan el sitio que llenan CE7 (Autoridad y cargos) y CE9 (banquete, juegos y rito) */
const SEN_T = [['hoy', 'Hoy se vota'], ['bandos', 'Bandos'], ['carrera', 'Tu carrera'], ['fiestas', 'Fiestas'], ['plan', 'Plan'], ['ministros', 'Ministros']];
const senTabs = (t, vota) => '<div class="sen-tabs ro-tablilla" role="tablist" aria-label="Senado">' + SEN_T.map(x => '<button role="tab" data-act="sent" data-v="' + x[0] + '" class="' + (x[0] === t ? 'on' : '') + '" aria-selected="' + (x[0] === t) + '">' + x[1] + (x[0] === 'hoy' && vota ? '<i class="sen-voto" aria-label="hay votación"></i>' : '') + '</button>').join('') + '</div>';
const SEN_CARGOS = [['Edil', 'Cuida mercados, calles y juegos'], ['Pretor', 'Juzga y manda un ejército'], ['Cónsul', 'Manda las legiones y preside el Senado'], ['Príncipe del Senado', 'Habla el primero en la sala']];
/* CDe1-B: pantalla «Plan» del Senado. Solo pinta; las reglas son de js/plan-senado.js y las acciones de G.plan*. */
const PLAN = () => window.PLAN_SENADO;
const planAy = () => (G.planAyuda ? G.planAyuda() : {});
const planMes = () => Math.floor((S().t || 0) + 1e-9);
const planMini = b => { const u = UI.minis && UI.minis[b]; return u ? '<img src="' + u + '" alt="" draggable="false">' : '<span class="pl-glifo">' + ((D.BUILD[b] && D.BUILD[b].i) || '🏛️') + '</span>'; };
const planCoste = c => '<span class="pl-coste">' + Object.keys(c || {}).map(r => '<i>' + D.RES_ICON[r] + ' ' + fmt(c[r]) + '</i>').join('') + '</span>';
const PL_ICO = { crecer: '🌾', defender: '🛡️', plebe: '🎭', riqueza: '🪙' };
const PL_ESTADO = { hecha: ['hecha', '✔ Hecha'], 'en marcha': ['marcha', '⚒ En marcha'], espera: ['espera', '⏳ Espera'], atrasada: ['atrasada', '⚠ Atrasada'], perdida: ['perdida', '✖ Perdida'] };
function planObraDe(id) {
  const p = S().planSenado || {}, B = p.borrador, L = p.plan;
  return ((B && B.obras) || []).concat((L && L.obras) || []).find(o => o.id === id) || null;
}
function planBandoBarra(votos) {
  const por = votos.porBando || {}, max = Math.max(1, ...Object.keys(por).map(b => por[b].escanos));
  const filas = Object.keys(por).map(b => {
    const q = por[b], B = D.BANDOS[b] || { n: b, col: '#999' }, w = n => (n / max * 100).toFixed(1) + '%';
    return '<div class="pl-vb"><span class="pl-vn" style="--bc:' + B.col + '">' + esc(B.n) + '</span><div class="pl-vbar" role="img" aria-label="' + q.si + ' sí, ' + q.duda + ' dudan, ' + q.no + ' no"><i class="si" style="width:' + w(q.si) + ';background:' + B.col + '"></i><i class="du" style="width:' + w(q.duda) + ';background:' + B.col + '"></i><i class="no" style="width:' + w(q.no) + '"></i></div><b>' + q.si + '<small>/' + q.escanos + '</small></b></div>';
  }).join('');
  const extra = votos.familia ? '<div class="pl-vf">Tu familia: ' + votos.familia + ' votos a favor</div>' : '';
  return '<div class="pl-votos"><div class="pl-vt"><b>Votos previstos</b><span class="' + (votos.sale ? 'ok' : 'no') + '">' + votos.si + ' sí de ' + votos.total + ' (hacen falta ' + votos.mayoria + ')</span></div>' + filas + extra +
    '<p class="pl-vl"><i class="si"></i>sí <i class="du"></i>dudan <i class="no"></i>no</p></div>';
}
function planCatalogo(B) {
  const cat = PLAN().catalogo(S(), B), ciudades = [];
  cat.forEach(x => { if (ciudades.indexOf(x.ciudad) < 0) ciudades.push(x.ciudad); });
  if (!ciudades.length) return '<div class="pl-cat"><p class="pl-vacio">No hay obras posibles ahora.</p><button class="pl-btn" data-act="plan-cierra">Cerrar el catálogo</button></div>';
  if (ciudades.indexOf(UI.planCiu) < 0) UI.planCiu = ciudades[0];
  const chips = ciudades.length > 1 ? '<div class="pl-chips">' + ciudades.map(c => '<button data-act="plan-ciu" data-v="' + c + '" class="' + (c === UI.planCiu ? 'on' : '') + '">' + esc(D.CITIES[c].n) + '</button>').join('') + '</div>' : '';
  const baldosas = cat.map((x, i) => [x, i]).filter(q => q[0].ciudad === UI.planCiu).map(q => {
    const x = q[0], i = q[1], F = D.BANDOS[x.bando] || { col: '#999' };
    return '<button class="pl-bal" data-act="plan-poner" data-v="' + i + '" style="--bc:' + F.col + '">' + planMini(x.b) + '<b>' + esc((D.BUILD[x.b] || {}).n || x.b) + '</b><em>nivel ' + x.nivel + '</em>' + planCoste(x.coste) + '</button>';
  }).join('');
  return '<div class="pl-cat"><div class="pl-cab"><b>Añadir obra · estación ' + (UI.planAdd + 1) + '</b><button class="pl-btn peq" data-act="plan-cierra">Cerrar</button></div>' + chips + '<div class="pl-rejilla">' + baldosas + '</div></div>';
}
function viewPlan() {
  const P = PLAN(), s = S();
  if (!P) return '<div class="empty sn-nada">El plan del Senado no está disponible.</div>';
  let est;
  try { est = P.estado(s, planMes(), planAy()); } catch (e) { return '<div class="empty sn-nada">El plan del Senado aún no está listo.</div>'; }
  const avisos = (est.avisos || []).slice(-3).map(a => '<div class="pl-aviso' + (a.tono === 'good' ? ' bien' : '') + '">' + esc(a.texto) + '</div>').join('');
  if (est.plan) return planEnCurso(est, avisos);
  const B = est.borrador;
  let o = '<p class="sn-ex">Un plan son obras repartidas en estaciones. Si el Senado lo vota, tus ministros las harán. Hay que dar algo a cada bando.</p>' + avisos;
  const prios = est.prioridades.map(p => '<button class="pl-prio' + ((B && B.prioridad === p.id) || (!B && (UI.planPrio || 'crecer') === p.id) ? ' on' : '') + '" data-act="plan-prio" data-v="' + p.id + '" style="--bc:' + ((D.BANDOS[p.bando] || {}).col || '#999') + '"><span>' + (PL_ICO[p.id] || '') + '</span><b>' + esc(p.n) + '</b></button>').join('');
  o += '<div class="sec ro-rubrica">Prioridad</div><div class="pl-prios">' + prios + '</div>';
  const n = B ? B.estaciones : (UI.planEst || 6);
  o += '<div class="sec ro-rubrica">Estaciones</div><div class="pl-ests" role="group" aria-label="Estaciones del plan">' + [4, 5, 6, 7, 8].map(k => '<button data-act="plan-est" data-v="' + k + '" class="' + (k === n ? 'on' : '') + '">' + k + '</button>').join('') + '</div>';
  o += '<button class="pl-btn grande" data-act="plan-sug">✨ Sugerir un plan</button>';
  if (!B) return o + '<p class="pl-vacio">Aún no hay obras. Pulsa «Sugerir un plan» o elige tú las obras.</p><button class="pl-btn" data-act="plan-nuevo">Empezar un plan en blanco</button>';
  for (let e = 0; e < B.estaciones; e++) {
    const obras = B.obras.filter(x => x.est === e);
    o += '<div class="pl-est"><div class="pl-et"><b>Estación ' + (e + 1) + '</b><span>' + obras.length + ' de 3 obras</span></div>';
    for (const ob of obras) {
      const raw = planObraDe(ob.id) || {};
      o += '<div class="pl-ob"><div class="pl-im">' + planMini(raw.b) + '</div><div class="pl-tx"><b>' + esc(ob.texto) + '</b><small>' + esc(ob.i) + ' ' + esc(ob.cargo) + '</small>' + planCoste(ob.coste) + '</div>' +
        '<div class="pl-mv"><button data-act="plan-mover" data-v="' + ob.id + '|-1" aria-label="A la estación anterior"' + (e === 0 ? ' disabled' : '') + '>‹</button><button data-act="plan-mover" data-v="' + ob.id + '|1" aria-label="A la estación siguiente"' + (e === B.estaciones - 1 ? ' disabled' : '') + '>›</button></div>' +
        '<button class="pl-x" data-act="plan-quitar" data-v="' + ob.id + '" aria-label="Quitar esta obra">✕</button></div>';
    }
    if (obras.length < 3) o += '<button class="pl-mas" data-act="plan-add" data-v="' + e + '">＋ Añadir obra</button>';
    o += '</div>';
  }
  if (UI.planAdd != null && UI.planAdd < B.estaciones) o += planCatalogo(B);
  o += planBandoBarra(B.votos);
  const rep = B.votos.reparto;
  if (rep && !rep.ok) o += '<div class="pl-aviso">' + esc(rep.motivo) + '</div>';
  const pv = B.puede;
  o += '<button class="pl-btn grande voto' + (pv.ok ? '' : ' apagado') + '" data-act="plan-votar"' + (pv.ok ? '' : ' aria-disabled="true"') + '>🗳 Votar el plan</button>';
  if (!pv.ok) o += '<p class="pl-motivo">' + esc(pv.motivo) + '</p>';
  return o;
}
function planEnCurso(est, avisos) {
  const L = est.plan, pr = est.prioridades.find(p => p.id === L.prioridad) || { n: L.prioridad, bando: 'ter' };
  const k = Math.max(0, Math.min(L.estaciones - 1, L.k));
  let o = avisos + '<div class="pl-curso"><span>' + (PL_ICO[L.prioridad] || '') + '</span><div><b>Plan en marcha: ' + esc(pr.n) + '</b><small>' + (L.k >= L.estaciones ? 'El Senado juzgará pronto.' : 'Estación ' + (k + 1) + ' de ' + L.estaciones) + ' · ' + L.hechas + ' de ' + L.total + ' obras hechas</small></div></div>';
  o += '<div class="pl-prog"><i style="width:' + (L.total ? Math.round(L.hechas / L.total * 100) : 0) + '%"></i></div>';
  for (let e = 0; e < L.estaciones; e++) {
    const obras = L.obras.filter(x => x.est === e);
    if (!obras.length) continue;
    o += '<div class="pl-est' + (e === L.k ? ' ahora' : '') + '"><div class="pl-et"><b>Estación ' + (e + 1) + '</b><span>' + (e === L.k ? 'Ahora' : e < L.k ? 'Pasada' : 'Próxima') + '</span></div>';
    for (const ob of obras) {
      const raw = planObraDe(ob.id) || {}, st = PL_ESTADO[ob.estado] || ['espera', ob.estado];
      o += '<div class="pl-ob ' + st[0] + '"><div class="pl-im">' + planMini(raw.b) + '</div><div class="pl-tx"><b>' + esc(ob.texto) + '</b><small>' + esc(ob.cargo) + '</small></div><span class="pl-sello ' + st[0] + '">' + st[1] + '</span></div>';
    }
    o += '</div>';
  }
  o += UI.planConf ? '<p class="pl-motivo">¿Seguro? El Senado lo recordará.</p><div class="pl-dos"><button class="pl-btn" data-act="plan-aband-no">No, seguir con el plan</button><button class="pl-btn peligro" data-act="plan-aband-si">Sí, abandonar el plan</button></div>'
    : '<button class="pl-btn" data-act="plan-aband">Abandonar el plan</button>';
  return o;
}
function planAccion(a, v) {
  const P = PLAN(), s = S();
  let r = { ok: true };
  const B = s.planSenado && s.planSenado.borrador;
  switch (a) {
    case 'plan-prio': if (B) r = P.cambiarPrioridad(s, v); else UI.planPrio = v; break;
    case 'plan-est': if (B) r = P.cambiarEstaciones(s, +v); else UI.planEst = +v; break;
    case 'plan-nuevo': r = P.nuevo(s, UI.planEst || 6, UI.planPrio || 'crecer'); break;
    case 'plan-sug': r = P.sugerir(s, B ? B.estaciones : (UI.planEst || 6), B ? B.prioridad : (UI.planPrio || 'crecer'), planAy()); break;
    case 'plan-add': UI.planAdd = +v; break;
    case 'plan-cierra': UI.planAdd = null; break;
    case 'plan-ciu': UI.planCiu = v; break;
    case 'plan-poner': { const x = P.catalogo(s, B)[+v]; if (x) { r = P.poner(s, { ciudad: x.ciudad, b: x.b, est: UI.planAdd }); if (r.ok) UI.planAdd = null; } break; }
    case 'plan-quitar': r = P.quitar(s, v); break;
    case 'plan-mover': { const q = v.split('|'), o = planObraDe(q[0]); r = o ? P.mover(s, q[0], o.est + (+q[1])) : { ok: false, motivo: 'Esa obra no está' }; break; }
    case 'plan-votar': if (!G.planVotar) { r = { ok: false, motivo: 'El Senado aún no recibe planes' }; break; } r = G.planVotar(); UI.planAdd = null; break;
    case 'plan-aband': UI.planConf = true; break;
    case 'plan-aband-no': UI.planConf = false; break;
    case 'plan-aband-si': UI.planConf = false; r = G.planAbandonar ? G.planAbandonar() : { ok: false, motivo: 'No se puede abandonar aún' }; break;
  }
  if (r && r.ok === false && r.motivo) toast(r.motivo, 'bad');
  else if (r && r.quitadas > 1) toast('Se quitaron ' + r.quitadas + ' obras que dependían de esa.', '');
  G.save(); render();
}
function viewSenado() {
  const sala = G.senadoSala && G.senadoSala(), t = SEN_T.some(x => x[0] === UI.senT) ? UI.senT : 'hoy';
  if (t === 'hoy' && sala) return viewSala(sala);   // SN2: con votación abierta, la sala
  const f = G.favor(), mi = G.misionActual(), mot = G.senadoMotivo();
  const barra = (n, v, c) => '<div class="sn-b"><span>' + n + '</span><div class="sn-bar"><i class="' + c + '" style="width:' + v + '%"></i></div><b>' + v + '</b></div>';
  const efecto = e => { const a = []; if (e.denarios) a.push((e.denarios > 0 ? '+' : '') + e.denarios + ' denarios'); if (e.favorSenado) a.push((e.favorSenado > 0 ? '+' : '') + e.favorSenado + ' favor del Senado'); if (e.favorPueblo) a.push((e.favorPueblo > 0 ? '+' : '') + e.favorPueblo + ' favor del pueblo'); return a.join(', ') || 'nada'; };
  // MR2b: rollo de papiro (como Imperio); misión y encargo en tabla de bronce
  const pie = '</div><div class="ro-palo"></div></div>';
  let o = '<div class="ro ro-sen"><div class="ro-palo"></div><div class="ro-papiro sn sen-' + t + '">' + senTabs(t, !!sala) + (window.laminaHtml ? laminaHtml('senado') : '');
  if (t === 'bandos') {
    o += sn2Bandos() || '<div class="empty sn-nada">Los bandos del Senado aún no se reúnen.</div>';
    return o + pie;
  }
  if (t === 'carrera') {
    o += barra('Senado', f.senado, 'sen') + barra('Pueblo', f.pueblo, 'pue') +
      '<p class="sn-ex">El pueblo sigue el ánimo de tus ciudades. El Senado sube con las misiones cumplidas y baja con las falladas o con los denarios en rojo al cerrar la estación.</p>' +
      '<div class="sec ro-rubrica">Cargos</div><div class="sen-aut"><span>Autoridad</span><div class="sen-cinta"><i></i></div><b>—</b></div>' +
      '<ol class="sen-cursus">' + SEN_CARGOS.map((c, i) => '<li><span class="sen-med">' + (i + 1) + '</span><b>' + c[0] + '</b><small>' + c[1] + '</small></li>').join('') + '</ol>' +
      '<p class="sn-ex sen-pronto">Pronto: ganarás Autoridad con lo que hagas y subirás de cargo, de edil a príncipe del Senado.</p>' + hitosHtml();
    return o + pie;
  }
  if (t === 'plan') return o + viewPlan() + pie;
  if (t === 'ministros') return o + '<div id="mn-aqui"></div>' + pie;   // CDe3: los ministros viven aquí; render() los pinta dentro de #mn-aqui
  if (t === 'fiestas') {
    const cid = cityOk();
    o += '<div class="sec ro-rubrica">Fiestas en ' + esc(D.CITIES[cid].n) + '</div>';
    for (const id in D.FIESTAS) { const d = D.FIESTAS[id]; o += '<div class="card sen-fi ro-tabla"><div class="tt">' + d.i + ' ' + esc(d.n) + '</div><div class="ds">' + esc(d.d) + ' +' + d.fel + ' de ánimo y +' + d.pueblo + ' al pueblo.</div><div class="sen-fb">' + fiestaBtn(cid, id) + '</div></div>'; }
    o += '<div class="card sen-fi sen-hueco"><div class="tt">🍷 Banquete con los bandos</div><div class="ds">Pronto: banquetes, juegos y ritos que se verán en la ciudad, y lo que aprendes de cada uno.</div></div>';
    return o + pie;
  }
  o += barra('Senado', f.senado, 'sen') + barra('Pueblo', f.pueblo, 'pue');
  if (mot) o += '<div class="sn-av">' + esc(mot) + '</div>';
  if (D.SENADO.sala) o += '<p class="sn-ex">El Senado no vota nada esta estación. Al pasar estación propondrá una ley.</p>';
  o += encargoHtml();
  if (!mi) return o + RO_HIEDRA + '<div class="empty sn-nada">El Senado no te pide nada por ahora.</div>' + pie;
  const m = mi.m, tot = Math.max(1, mi.t1 - mi.t0);
  o += '<div class="sec ro-rubrica">Misión en curso</div><div class="card sn-mi ro-tabla"><div class="tt">' + esc(m.n) + '</div><div class="ds">' + esc(m.texto) + '</div>' +
    '<div class="sn-pz"><span>Plazo: quedan ' + mesesEst(mi.quedan) + '</span><div class="sn-bar"><i class="pla" style="width:' + Math.max(0, Math.min(100, mi.quedan / tot * 100)) + '%"></i></div></div>' +
    '<div class="sn-fa"><b>Qué falta</b> ' + esc(String(mi.falta)) + '</div><div class="sn-pr"><b>Premio</b> ' + efecto(m.premio || {}) + '</div><div class="sn-ca"><b>Si fallas</b> ' + efecto(m.castigo || {}) + '</div></div>' + pie;
  return o;
}
const RO_PIE_VOL = '<div class="ro-palo"></div><div class="ro-pie"><button class="btn ro-bronce ro-vol mos-vol" data-act="tab" data-v="imperio">← Volver al Imperio</button></div></div>';   // MR2c: cierre del rollo con «volver» en bronce
function viewHero() {
  const s = S(), h = s.hero, need = G.xpNeed(h.lvl);
  const where = h.wound > s.t ? '🩸 Herido — se recupera en ' + months(h.wound - s.t) : h.march ? '🚩 En marcha con el ejército' : '📍 En ' + D.CITIES[h.city].n;
  const SK = { mando: [D.GUERRA_ICON.espadas + ' Mando', '+4 % de ataque de tu ejército por nivel'], disc: [D.GUERRA_ICON.escudo + ' Disciplina', '+3 % de defensa y +4 de moral por nivel'], log: ['🧭 Logística', '+8 % de velocidad de marcha y +10 % de botín por nivel'] };
  let o = '<div class="ro ro-mos"><div class="ro-palo"></div><div class="ro-papiro mos mos-gen"><div class="mos-cab"><div class="head ro-tabla"><div class="pt">' + pt('general') + '</div><h2>' + esc(h.name) + '</h2><p>General de la República · Nivel ' + h.lvl + '</p>' + '<div class="xp"><i style="width:' + Math.min(100, h.xp / need * 100) + '%"></i></div><p>Experiencia ' + h.xp + ' / ' + need + '<br>' + where + '</p></div></div><div class="mos-cuerpo">';
  o += '<div class="sec ro-rubrica">Habilidades · ' + h.pts + ' punto' + (h.pts === 1 ? '' : 's') + '</div>';
  for (const k in SK) o += '<div class="card"><div class="bd"><div class="tt">' + SK[k][0] + '<span class="lv">Nv ' + h.sk[k] + '</span></div><div class="ds">' + SK[k][1] + '</div></div><button class="btn ' + (h.pts > 0 && h.sk[k] < 10 ? 'gold ro-sello' : 'no') + '" data-act="skill" data-v="' + k + '" aria-label="Subir ' + k + '">+</button></div>';
  return o + '<div class="empty mos-nota">Tu general combate con su guardia de caballería cuando acompaña a un ejército o defiende la ciudad en la que está. Gana experiencia en cada batalla; si su guardia es aniquilada, quedará herido hasta dos años.</div></div></div>' + RO_PIE_VOL;
}
function viewCodice() {
  const K = window.CODICE, sec = UI.codice, N = { tropas: 'Tropas', ciudades: 'Ciudades', hechos: 'Hechos' };
  let o = '<div class="acts"><button class="btn ghost" data-act="codice" data-v="">← Volver a la Crónica</button></div><div class="cdxs">' + Object.keys(N).map(k => '<button class="btn ' + (k === sec ? 'gold' : 'ghost') + '" data-act="codice" data-v="' + k + '">' + N[k] + '</button>').join('') + '</div>';
  o += '<div class="empty cdxn"><span class="lic lic-h">histórico</span> lo cuentan las fuentes antiguas. <span class="lic lic-p">probable</span> es lo más razonable, sin certeza. <span class="lic">licencia de juego</span> se cambió para poder jugar.</div>';
  return o + (K[sec] || []).map(f => '<div class="card cdx">' + (sec === 'tropas' && D.UNITS[f.id] ? '<div class="pt">' + pt(f.id) + '</div>' : '') + '<div class="bd"><div class="tt">' + (sec === 'hechos' ? esc(f.id) + ' a.C. — ' : '') + esc(f.t) + '</div><div><span class="lic ' + (f.tag === 'histórico' ? 'lic-h' : f.tag === 'probable' ? 'lic-p' : '') + '">' + esc(f.tag) + '</span></div><div class="ds">' + esc(f.x) + '</div><div class="cdxf">Fuente: ' + esc(f.src) + '</div></div></div>').join('');
}
function viewLog() {
  if (UI.codice && window.CODICE) return viewCodice();
  // K12b: Crónica en estilo Códice. Tres folios con scroll-snap horizontal (sin scroll infinito): Campaña, Línea del tiempo y Crónica reciente.
  const s = S(), year = G.yearOf(s.t), left = G.anioReglas(s.t) - D.END_YEAR + 1, cap = ch => '<span class="cod-cap">' + ch + '</span>';
  const f1 = '<section class="cod-f"><div class="cod-h">' + cap('C') + '<div><h2>' + (G.regionId() === 'mediterraneo' ? 'Carthago delenda est' : 'Dominar ' + esc(G.region().n)) + '</h2><i>Folio I · La campaña</i></div></div><p>Conquista <b>' + D.CITIES[G.region().capitalRival].n + '</b> antes de que termine el año ' + G.region().hasta + ' a.C. Si Roma cae, la campaña termina.</p><p class="cod-st">⏳ Quedan <b>' + left + '</b> años · 🏛️ ' + G.myCities().length + '/' + G.ciudadesRegion().length + ' ciudades · ' + D.GUERRA_ICON.espadas + ' ' + s.stats.wins + '/' + s.stats.battles + ' batallas</p>' + (window.CODICE ? '<button class="btn ro-bronce cod-b" data-act="codice" data-v="tropas">' + D.BUILD_ICON.escuela + ' Abrir el Códice</button>' : '') + '<button class="btn ro-tinta cod-b" data-act="tomenu">Guardar y salir al menú</button></section>';
  const f2 = '<section class="cod-f"><div class="cod-h">' + cap('L') + '<div><h2>Línea del tiempo</h2><i>Folio II · Lo que fue y lo que viene</i></div></div><div class="tl cod-tl">' + D.EVENTS.map((e, i) => '<div class="' + (s.ev[i] ? 'done' : '') + '"' + (s.ev[i] ? ' data-act="ev" data-v="' + i + '"' : '') + '><b>' + e.y + ' a.C.</b>' + (s.ev[i] ? esc(e.t) : '···') + '</div>').join('') + '</div></section>';
  const f3 = '<section class="cod-f"><div class="cod-h">' + cap('A') + '<div><h2>Anales</h2><i>Folio III · Lo último que ocurrió</i></div></div>' + (s.log.length ? '<div class="cod-an">' + s.log.slice(0, 10).map(l => '<div class="logl ' + l.k + '"><small>' + D.MONTHS[Math.floor(l.t) % 12] + ' · ' + G.yearOf(l.t) + ' a.C.</small>' + esc(l.x) + '</div>').join('') + '</div>' : '<div class="empty">Aún no ha ocurrido nada.</div>') + '</section>';
  return '<div class="cod ro-cod"><div class="cod-fs">' + f1 + f2 + f3 + '</div><div class="cod-pie">Tres folios · desliza ↔</div></div>';
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
  const key = 'sitio' + id + k.estado + UI.colDesde + orig.join() + v.ok + v.motivo + (mar ? G.turnosFaltan(mar) : '');
  if (key === UI.sheetKey && !sh.hidden) return; UI.sheetKey = key;
  const K = G.COLONOS, coste = D.POP_ICON + ' ' + K.pop + ' · ' + coste5({ grano: K.grano, denarios: K.denarios });
  let h = '<button class="x" data-act="unsel" aria-label="Cerrar la ficha">✕</button><h3>' + esc(d.n) + '<span class="tagf" style="background:#8a6a2c">' + (TIPO_COL[d.tipo] || 'Colonia') + '</span></h3><p>' + esc(d.h) + '</p>';
  { const T = D.TERRENOS && D.TERRENOS[D.terrenoDe(id)]; if (T) h += '<span class="stat">⛰️ ' + esc(T.n) + '</span><p>' + esc(T.d) + '</p>'; }
  h += '<span class="stat">📜 Fundada en ' + d.anio + ' a.C.</span><span class="stat">🏛️ ' + (k.estado === 'libre' ? 'Sitio libre' : k.estado === 'camino' ? 'Colonos en camino' : 'Colonos esperando') + '</span>';
  h += '<div class="acts">';
  if (k.estado === 'libre') {
    h += '<label class="orig"><span>Salen de</span><select id="col-desde" aria-label="Ciudad de origen de los colonos">' + orig.map(o => '<option value="' + o + '"' + (o === UI.colDesde ? ' selected' : '') + '>' + esc(D.CITIES[o].n) + ' · ' + llegaEn(G.llegada(s.t + G.travel(o, id, false))) + '</option>').join('') + '</select></label>';
    h += '<button class="btn gold" data-act="colonos" data-from="' + UI.colDesde + '" data-to="' + id + '"' + (v.ok ? '' : ' disabled') + '>Enviar colonos<small>' + coste + '</small></button>';
    if (!v.ok && v.motivo) h += '<div class="empty">' + esc(v.motivo) + '</div>';
  } else if (k.estado === 'camino') {
    h += '<div class="empty">Los colonos de ' + esc(k.desde && D.CITIES[k.desde] ? D.CITIES[k.desde].n : 'Roma') + ' llegan ' + (mar ? llegaEn(mar.t1) : 'pronto') + '.</div>';
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
  $('modal').hidden = true; $('sheet').hidden = true; $('zoom').hidden = true; $('ctop').hidden = true; $('view').hidden = true; hojaCierra(true); $('citywrap').hidden = false; $('csheet').hidden = false; $('csheet').dataset.m = 'fundar';
  UI.cityV.resize(); UI.cityV.calor(G.mapaCalorFundar(sitio)); UI.cityV.update(UI.fundar.stub, sitio, null, performance.now() / 1000);
  UI.cityV.mirar(0, 0, 760, 0);
  let mejor = null; for (let x = -420; x <= 420; x += 60) for (let z = -420; z <= 420; z += 60) { const n = G.notaFundar(sitio, x, z); if (n && n.vale && (!mejor || n.nota > mejor.n)) mejor = { x, z, n: n.nota }; }
  if (mejor) UI.cityV.mirar(mejor.x, mejor.z, 620, 0);
  { const T = D.TERRENOS && D.TERRENOS[D.terrenoDe(sitio)]; if (T) { UI.fundar.terr = T; toast(T.n + ': ' + T.d, '', 'terreno-fundar'); } }
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
  lineaPon((F.terr ? F.terr.n + ' · ' : '') + (n.razones && n.razones.length ? n.razones.join(' · ') : n.vale ? 'Aquí puede nacer la ciudad.' : 'Aquí no se puede fundar.'), 'sitio ' + col, NOTA3[col]); pintaBotonesFundar();
}
function fundarAqui() {
  const F = UI.fundar; if (!F || F.fase !== 'elegir' || !F.vale) return;
  const r = G.fundarColonia(F.sitio, F.x, F.z, true);   // I8b: en «fundar de la nada» el reloj espera a que el arado acabe el surco
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
  G.finArado();   // I8b: al cerrar la pantalla (acabe o no el surco) el reloj vuelve a correr
  if (UI.cityV) { UI.cityV.ponerGroma(null); UI.cityV.calor(null); }
  $('csheet').dataset.m = ''; lineaPon(''); if (!sinTab) setTab(UI.tab);
}

function renderSheet() {
  if (UI.fundar) { $('sheet').hidden = true; UI.sheetKey = ''; return; }      // la pantalla de fundar no lleva ficha encima
  const s = S(), sh = $('sheet'); if (!s || !UI.sel || UI.tab !== 'map') { sh.hidden = true; UI.sheetKey = ''; return; }
  if (UI.sel && !s.cities[UI.sel] && D.COLONIAS && D.COLONIAS[UI.sel]) { sheetSitio(UI.sel); return; }
  if (!s.cities[UI.sel]) { sh.hidden = true; UI.sheetKey = ''; return; }
  const id = UI.sel, c = s.cities[id], d = D.CITIES[id], f = D.FACTIONS[c.owner], mine = c.owner === 'roma';
  const src = G.neighbors(id).filter(n => s.cities[n].owner === 'roma'), inc = s.marches.filter(m => m.to === id && !m.sitio), esp = s.marches.filter(m => m.sitio && m.from === id), sal = c.owner === 'roma' ? G.salidasPosibles(id, G.heroAvailable(id)) : [];
  const key = esp.map(m => m.id + (m.postura || '')).join() + sal.map(x => x.m.id).join() + id + c.owner + G.rutasAbiertas().length + JSON.stringify(c.units) + src.join() + inc.map(m => m.id + G.turnosFaltan(m)).join();
  if (key === UI.sheetKey && !sh.hidden) return; UI.sheetKey = key;
  let h = '<button class="x" data-act="unsel">✕</button><h3>' + d.n + '<span class="tagf" style="background:' + f.col + '">' + (mine && id === 'roma' && G.polis() ? 'tu polis' : f.n === d.n ? 'polis rival' : f.n) + '</span></h3><p>' + esc(d.h) + '</p>';
  h += '<span class="stat">🧱 ' + (id === 'roma' && mine && G.faseMuralla(c) === 1 ? 'Muralla vieja de toba' : FASE_MURALLA[G.faseMuralla(c)]) + ' · Defensa ' + G.nivelMuralla(c) + '</span><span class="stat">💰 ' + '★'.repeat(c.w || d.w) + '</span><span class="stat">⚔ Fuerza ' + G.power(c.units) + '</span>' + ((id === 'roma' ? G.polisFicha() : d.griega && D.POLIS[id]) ? (pf => '<span class="stat">Lujo: ' + (D.ESPECIAL[d.esp] ? D.ESPECIAL[d.esp].i + ' ' : '') + esc(pf.lujoN) + ' (' + esc(pf.lujoDe) + ')' + (D.ESPECIAL[d.esp] ? ' · ' + esc(D.ESPECIAL[d.esp].d) : '') + '</span>')(id === 'roma' ? G.polisFicha() : D.POLIS[id]) : D.ESPECIAL[d.esp] ? '<span class="stat">Bien: ' + D.ESPECIAL[d.esp].i + ' ' + D.ESPECIAL[d.esp].n + '</span>' : '');   // PN3c/PN3d: las 8 polis (la tuya y las rivales) dicen su lujo y qué da, con el mismo formato
  { const tr = G.rutasAbiertas().find(r => r.b === id && r.f !== 'roma'); if (tr) h += '<span class="stat">⚖️ Tratado de comercio con Roma</span>'; }
  h += '<div class="units">' + (Object.keys(c.units).filter(k => c.units[k] > 0).map(k => '<span>' + D.UNITS[k].n + ' <b>' + c.units[k] + '</b></span>').join('') || '<span>Sin guarnición</span>') + '</div>';
  if (inc.length) h += inc.map(m => '<div class="stat" style="color:' + (m.owner === 'roma' ? 'var(--good)' : 'var(--bad)') + '">' + (m.owner === 'roma' ? '🚩 Tus tropas llegan' : '⚠️ ' + D.FACTIONS[m.owner].n + ' (' + G.men(m.units) + ') llega') + ' ' + llegaEn(m.t1) + '</div>').join('');
  h += esp.map(m => '<div class="stat" style="color:var(--good)">🏕️ Tu ejército espera en ' + esc(m.sitio.n) + ' (' + D.RASGOS[m.sitio.r] + ')' + (m.postura ? ' · apostado' : '') + '</div>').join('');
  h += '<div class="acts">';
  h += sal.map(x => '<button class="btn" data-act="salir" data-v="' + id + '" data-m="' + x.m.id + '">⚔️ Salir al encuentro de ' + esc(D.FACTIONS[x.m.owner].n) + '</button>').join('');
  h += esp.map(m => (D.CAMPO.apostables.includes(m.sitio.r) && !m.postura ? '<button class="btn" data-act="apostar" data-m="' + m.id + '">🌿 Apostar en ' + esc(m.sitio.n) + '</button>' : '') + '<button class="btn ghost" data-act="dejarsitio" data-m="' + m.id + '">Volver a ' + esc(D.CITIES[id].n) + '</button>').join('');
  if (mine) h += '<button class="btn gold" data-act="entrar" data-v="' + id + '">Entrar en ' + esc(d.n) + '</button>';
  if (src.length) h += src.map(n => '<button class="btn" data-act="pick" data-from="' + n + '" data-to="' + id + '">' + (mine ? 'Reforzar' : 'Atacar') + ' desde ' + D.CITIES[n].n + (G.edge(n, id)[2] ? ' ⚓' : '') + '</button>').join('');
  else if (!mine) h += '<div class="empty">Sin ruta: conquista antes una ciudad vecina (' + G.neighbors(id).map(n => D.CITIES[n].n).join(', ') + ').</div>';
  const st = sh.scrollTop; sh.innerHTML = h + '</div>'; sh.hidden = false; sh.scrollTop = st;
}

/* ---------- envío de tropas ---------- */
function showPicker(from, to) {
  const s = S(), c = s.cities[from], own = s.cities[to].owner === 'roma', hero = G.heroAvailable(from);
  if (G.edge(from, to)[2] && !(c.b.puerto > 0)) { carta('<div class="yr">RUTA MARÍTIMA</div><h2>Hace falta un puerto</h2><p>Para embarcar un ejército desde ' + D.CITIES[from].n + ' hacia ' + D.CITIES[to].n + ' necesitas construir antes un <b>Puerto</b> en ' + D.CITIES[from].n + '.</p><div class="acts"><button class="btn ghost" data-act="close">Cerrar</button><button class="btn gold" data-act="goport" data-v="' + from + '">Ir a la ciudad</button></div>'); return; }
  const ks = Object.keys(c.units).filter(k => c.units[k] > 0);
  let h = '<div class="yr">DESDE ' + D.CITIES[from].n.toUpperCase() + ' · ' + ('LLEGAN ' + llegaEn(G.llegada(s.t + G.travel(from, to, false) * G.puertasViaje(from, to)))).toUpperCase() + '</div><h2>' + (own ? 'Reforzar ' : 'Atacar ') + D.CITIES[to].n + '</h2>';
  if (!ks.length && !hero) h += '<p>No hay tropas en ' + D.CITIES[from].n + '. Recluta en la pestaña Ejército.</p>';
  h += ks.map(k => '<div class="pick"><div class="pt">' + pt(k) + '</div><div><label><span>' + D.UNITS[k].n + '</span><span><b id="pv-' + k + '">' + c.units[k] + '</b> / ' + c.units[k] + '</span></label><input type="range" min="0" max="' + c.units[k] + '" value="' + c.units[k] + '" data-k="' + k + '"></div></div>').join('');
  { const tl = G.tribunos().filter(t => t.libre), lib = tl[0]; h += '<div class="pw">' + (lib ? 'Sin el general, manda el tribuno <b>' + esc(lib.n) + '</b> (' + esc(lib.car) + '). Tribunos libres: ' + tl.length + ' de ' + G.maxEjercitos() + '.' : (hero ? 'No quedan tribunos libres: solo puede partir el ejército con el general.' : 'No quedan tribunos libres: ningún ejército más puede partir.')) + '</div>'; }
  if (hero) h += '<label class="chk"><input type="checkbox" id="pk-hero" checked> ' + D.GUERRA_ICON.aguila + ' El general acompaña al ejército</label>';
  if (!own) { const bo = G.botin(to); h += '<label class="chk"><input type="checkbox" id="pk-saq"> 💰 Solo saquear, sin conquistar: las tropas vuelven</label><div class="pw">Botín: ' + D.RES.map(r => bo[r] + ' ' + D.RES_ICON[r]).join(' · ') + '</div>'; }
  if (!own) h += '<div class="pw">Fuerza enemiga: ' + G.power(s.cities[to].units) + ' · ' + FASE_MURALLA[G.faseMuralla(s.cities[to])].toLowerCase() + ' (defensa ' + G.nivelMuralla(s.cities[to]) + ')<br>Tu fuerza: <b id="pk-pw"></b></div>';
  h += '<div class="acts"><button class="btn ghost" data-act="close">Cancelar</button>' + (ks.length || hero ? '<button class="btn" data-act="send" data-from="' + from + '" data-to="' + to + '">' + (own ? 'Enviar' : '¡A las armas!') + '</button>' : '') + '</div>';
  modal(h); pickUpdate();
}
// GM15b: salir al encuentro de un enemigo que marcha sobre la ciudad cid: eliges el sitio, las tropas y la hora
function showSalir(cid, eid) {
  const s = S(), c = s.cities[cid], hero = G.heroAvailable(cid), sal = G.salidasPosibles(cid, hero).find(x => x.m.id === eid);
  if (!sal) { toast('Ese ejército ya no marcha hacia allí.', 'bad'); return; }
  const ks = Object.keys(c.units).filter(k => c.units[k] > 0), elijo = G.horaAjuste() === 'elijo'; let primero = true;
  let h = '<div class="yr">' + esc(D.CITIES[cid].n.toUpperCase()) + '</div><h2>Salir al encuentro</h2><p>' + esc(D.FACTIONS[sal.m.owner].n) + ' marcha sobre ' + esc(D.CITIES[cid].n) + ' con ' + G.men(sal.m.units) + ' hombres. Elige dónde esperarlo.</p>';
  h += sal.sitios.map(x => { const ch = x.ok && primero ? ' checked' : ''; if (x.ok) primero = false; return '<label class="chk"><input type="radio" name="sl-sitio" value="' + x.id + '" data-ap="' + (x.apostable ? 1 : 0) + '"' + (x.ok ? '' : ' disabled') + ch + '> <span><b>' + esc(x.n) + '</b> · ' + D.RASGOS[x.r] + (x.ok ? '' : '<br><small>' + esc(x.motivo) + '</small>') + '</span></label>'; }).join('');
  h += '<label class="chk"><input type="checkbox" id="sl-apostar"> 🌿 Apostar: esconderse (solo en bosque o loma)</label>';
  h += elijo ? '<label class="chk"><span>Hora&nbsp;</span><select id="sl-hora"><option value="">Lo que venga</option><option value="amanecer">Amanecer</option><option value="mediodia">Mediodía</option><option value="atardecer">Atardecer</option>' + (sal.niebla ? '<option value="niebla">Amanecer con niebla</option>' : '') + '<option value="noche" hidden>Noche (solo con emboscada)</option></select></label>' : '<div class="pw">La hora sale al azar (ajuste de la partida).</div>';
  h += ks.map(k => '<div class="pick"><div class="pt">' + pt(k) + '</div><div><label><span>' + D.UNITS[k].n + '</span><span><b id="pv-' + k + '">' + c.units[k] + '</b> / ' + c.units[k] + '</span></label><input type="range" min="0" max="' + c.units[k] + '" value="' + c.units[k] + '" data-k="' + k + '"></div></div>').join('');
  if (hero) h += '<label class="chk"><input type="checkbox" id="pk-hero" checked> ' + D.GUERRA_ICON.aguila + ' El general acompaña al ejército</label>';
  h += '<div class="acts"><button class="btn ghost" data-act="close">Cancelar</button><button class="btn" data-act="salirgo" data-v="' + cid + '" data-m="' + eid + '">Salir a esperarlo</button></div>';
  modal(h); pickUpdate();
  const ap = $('sl-apostar'), nn = $('sl-hora') && $('sl-hora').querySelector('option[value=noche]');   // «Noche» solo se ofrece con emboscada (apostar)
  if (ap && nn) ap.addEventListener('change', () => { nn.hidden = !ap.checked; nn.disabled = !ap.checked; if (!ap.checked && $('sl-hora').value === 'noche') $('sl-hora').value = ''; });
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
  const pl = G.planBatalla(info), tr = info.cfg.sides[0].tribuno, resto = G.guerraGuardada(info);   // GC4: una sola batalla (la Guerra); si se recargó a mitad, se puede retomar
  const bot = resto ? '<button class="btn" data-act="bcont">' + D.GUERRA_ICON.espadas + ' Seguir la batalla</button><button class="btn ghost" data-act="bquick">Delegar en tus tribunos</button>'
    : pl.via === 'sola' ? '<button class="btn" data-act="bquick">Ver el resultado</button>'
    : '<button class="btn" data-act="bview">' + D.GUERRA_ICON.espadas + (pl.via === 'maniobra' ? ' Planear la maniobra' : ' Ir al choque') + '</button><button class="btn ghost" data-act="bquick">Delegar en tus tribunos</button>';
  const cp = info.kind === 'campo' ? info.campo : null;   // GM15b: batalla en el camino
  modal('<div class="yr">' + G.yearOf(S().t) + ' A.C.' + (cp ? ' · ' + esc(horaTxt(cp).toUpperCase()) : '') + '</div><h2>' + (cp ? 'Se topan: ' + esc(cp.nombre) : (info.kind === 'attack' ? 'Asalto a ' : 'Defensa de ') + d.n) + '</h2>' +
    '<div class="vs">' + sideHtml(info.cfg.sides[0]) + sideHtml(info.cfg.sides[1]) + '</div>' +
    '<div class="pw">Fuerza: ' + G.power(info.cfg.sides[0].units) + ' contra ' + G.power(info.cfg.sides[1].units) + (cp ? ' · Terreno: ' + esc(D.RASGOS[cp.rasgo]) + (cp.emboscada ? ' · ¡Emboscada!' : '') + '<br>La hora y la niebla aún no cambian la lucha.' : ' · Muralla del defensor: nivel ' + info.cfg.wall) + (tr ? '<br>Al mando: el tribuno ' + esc(tr.n) + ' (' + esc(tr.car) + ')' : '') + (pl.texto ? '<br>' + esc(pl.texto) : pl.via === 'directo' ? '<br>Escaramuza: se va directo al choque.' : '') + '</div>' +
    '<div class="acts">' + bot + '</div>', true);
}
// GM15b: la hora del encuentro en una línea («Amanecer con niebla»)
function horaTxt(K) { return (D.HORAS[K.hora] || 'Día') + (K.niebla ? ' con niebla' : ''); }
/* NB7: la batalla nueva. Maniobra (si hay más de 600 hombres) y luego el choque; al acabar se devuelve a la campaña lo mismo que la clásica. */
function iniciaNueva(info, pl, resto) {
  closeModal(); UI.nueva = true; UI.sheetKey = '';
  try { iniciaNueva2(info, pl, resto); } catch (err) { console.error(err); UI.nueva = false; toast('No se pudo abrir la batalla nueva.', 'bad'); }
}
function iniciaNueva2(info, pl, resto) {
  /* CG4b: el choque es la misma batalla de Escaramuzas (js/simulador.js): la hoja «Jugar en vivo / Batalla rápida / Resolver» (js/ui-batalla-rapida.js)
     y el mando en vivo (js/ui-mando.js). Se guarda a mitad (cfg.guardar → G.guardarGuerra) para retomarla si se recarga la página; al acabar se borra. */
  const fin = estM => r => { G.borrarGuerra(); endBattle(G.resultadoNueva(info, r, estM)); };
  const cfgDe = (ch, estM) => { const c = Object.assign(G.cfgSim(info, ch), { guardar: S => G.guardarGuerra(info, S, estM) }); c.S = window.Simulador.crear(c); return c; };   // el estado ya creado lleva los modificadores y el tribuno de la campaña (UIMando y la hoja usan cfg.S)
  if (!window.UIMando || !window.Simulador) { UI.nueva = false; toast('No se ha podido cargar la batalla.', 'bad'); battlePrompt(); return; }
  if (resto) { window.UIMando.abrir(Object.assign(cfgDe(null, resto.estM), { S: resto.estado }), fin(resto.estM)); return; }
  const alChoque = (ch, estM, volver) => {
    const cfg = cfgDe(ch, estM), hoja = () => window.UIBatallaRapida.elegir(cfg, fin(estM), { volver });
    import('./ui-batalla-rapida.js').then(hoja).catch(err => { console.error(err); window.UIMando.abrir(cfg, fin(estM)); });   // sin la hoja, en vivo
  };
  const aPregunta = () => { UI.nueva = false; battlePrompt(); };   // «Volver» antes de empezar: a la pregunta de la batalla
  if (pl.via === 'maniobra') window.UIManiobra.abrir(G.cfgManiobra(info), r => {
    if (r.accion !== 'batalla') { endBattle(G.resultadoManiobra(info, r.estado)); return; }
    const otraVez = () => alChoque(r.choque, r.estado, () => { toast('La maniobra ya acabó: toca librar la batalla.'); otraVez(); });   // tras la maniobra no hay vuelta atrás
    otraVez();
  });
  else alChoque(null, null, aPregunta);
}
function endBattle(res) {
  UI.nueva = false;
  const info = UI.binfo, out = G.applyBattle(res), d = D.CITIES[info.city];
  const loss = side => Object.keys(res.lost[side]).filter(k => res.lost[side][k] > 0).map(k => '<div><span>' + D.UNITS[k].n + '</span><b>−' + res.lost[side][k] + '</b></div>').join('') || '<div><span>Sin bajas</span></div>';
  carta('<div class="yr">' + (out.kind === 'campo' ? esc(out.campo.nombre.toUpperCase()) : (out.kind === 'attack' ? 'ASALTO A ' : 'DEFENSA DE ') + d.n.toUpperCase()) + '</div><h2>' + (out.win ? '¡Victoria!' : 'Derrota') + '</h2>' +
    '<div class="vs"><div class="side"><h4 style="color:var(--minio)">Bajas romanas</h4>' + loss(0) + '</div><div class="side"><h4>Bajas enemigas</h4>' + loss(1) + '</div></div>' +
    (res.objetivo ? '<p><b>' + (res.objetivo.cumplido || res.objetivo.ok ? 'Objetivo cumplido' : 'Objetivo no cumplido') + ':</b> ' + esc(res.objetivo.texto || '') + '</p>' : '') + '<p>' + out.lines.map(esc).join('\n') + '</p><div class="acts"><button class="btn" data-act="bdone">Continuar</button></div>', true);
}

/* ---------- acciones ---------- */
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-act]');
  if (!el && e.target.closest('#linea')) { $('linea').classList.toggle('abierta'); return; }   // CDe3: tocar el aviso lo despliega o lo recoge
  if (!el && (e.target.closest('#cuentas') || e.target.closest('#tpanel'))) return;
  if (!el) { if (UI.vistas) { UI.vistas = false; if (UI.tab === 'city' && UI.cityV && !UI.cityList) renderCity3D(); } $('cuentas').hidden = true; if (!e.target.closest('#hoja')) hojaCierra(true); tpanelCierra(); $('popsheet').hidden = true; if (e.target.id === 'modal' && !UI.sticky) closeModal(); hudDock(); return; }
  const a = el.dataset.act, v = el.dataset.v, s = S();
  if (el.closest('#hoja')) UI.hjDown = false; if (a !== 'menumodo' && a !== 'marchas' && a !== 'hoja' && !el.closest('#hoja')) hojaCierra(true); if (a !== 'tira') tpanelCierra(); if (a !== 'pill' && a !== 'imp' && a !== 'rep') $('popsheet').hidden = true; if (a !== 'cuentas' && a !== 'imp' && a !== 'cuvender' && a !== 'cubien' && a !== 'cuadelantar') $('cuentas').hidden = true;
  if (a !== 'derr') UI.derr = null;
  switch (a) {
    case 'dif': if (el.dataset.d === 'm') { UI.difSel = v; const nm = $('hname') ? $('hname').value : ''; showMenu(); if (nm && $('hname')) $('hname').value = nm; } else { const r = G.ponerAjustes({ dif: v }); if (!r.ok) toast(r.motivo, 'bad'); else { G.save(); toast('Dificultad ' + (DIF_NOM[v] || v) + ': vale desde la estación siguiente.'); } render(); } break;
    case 'asesor': if (el.dataset.d === 'm') UI.asesorSel = el.checked; else { G.ponerAjustes({ asesor: el.checked }); G.save(); UI.linK = null; pintaLinea(); } break;
    case 'suceso': { const a = G.ajustes(), r = G.ponerAjustes({ suc: { [v]: !a.suc[v] } }); if (!r.ok) toast(r.motivo, 'bad'); else { G.save(); toast('Vale desde la estación siguiente.'); } render(); break; }
    case 'repetirasesor': if (typeof ASESOR !== 'undefined') { ASESOR.repetir(S().ajustes); G.save(); UI.linK = null; pintaLinea(); toast('Los consejos volverán a salir.'); } break;
    case 'cubos': case 'arder': { if (!G.vivo()) break; const r = a === 'cubos' ? G.apagarFuego() : G.dejarArder(); if (r && r.ok === false) { toast(r.motivo || 'No se pudo'); break; } UI.vivoK = ''; vivoPinta(); G.save(); UI.dirty = true; break; }
    case 'entendido': if (typeof ASESOR !== 'undefined' && UI.lesId) { ASESOR.marcar(S().ajustes, UI.lesId, { mes: Math.floor(S().t + 1e-9), ahora: Date.now() }); G.save(); } UI.linK = null; pintaLinea(); break;
    case 'ambiente': { const nv = el.type === 'checkbox' ? el.checked : !G.ambiente(), r = G.ponerAjustes({ ambiente: nv }); if (!r.ok) toast(r.motivo, 'bad'); else { G.save(); if (UI.cityV && UI.cityV.ponerAmbiente) UI.cityV.ponerAmbiente(nv); } render(); break; }
    case 'musica': { const mu = window.Musica; if (mu && mu.on) { if (musicaOn()) mu.off(); else mu.on(); } if (UI.menu) hojaPinta(true); else render(); break; }
    case 'preguntas': { const dl = window.Dialogos; if (dl && dl.ponPreguntas) dl.ponPreguntas(!preguntasOn()); if (UI.menu) hojaPinta(true); else render(); break; }
    case 'sonido': { const so = window.Sonido; if (so) { if (sonidoOn()) so.off(); else so.on(); } if (UI.menu) hojaPinta(true); else render(); break; }
    case 'fluidez': fijarFluidez(!fluidezOn()); hojaPinta(true); break;
    case 'new': case 'newregion': G.newGame(($('hname') ? $('hname').value : '').trim() || 'Lucio Cornelio Escipión', a === 'newregion' ? v : 'mediterraneo', { dificultad: UI.difSel || 'normal', asesor: UI.asesorSel !== false }); G.turnos = true; S().turnos = true; UI.overShown = false; G.save(); startGame(); break;
    case 'politeia': { if (!window.POLITEIA_UI) break; closeModal && closeModal(); POLITEIA_UI.abrir({ polis: POLITEIA.DATOS.polis[G.polis()] ? G.polis() : 'atenas' }); break; }
    case 'newpolis': { const pf = D.POLIS[v]; if (!pf) break; if (G.hasSave() && !confirm('Ya tienes una partida guardada. Empezar con ' + pf.n + ' la reemplaza. ¿Seguir?')) break; G.newGame(pf.heroe, 'italia', { polis: v, dificultad: UI.difSel || 'normal', asesor: UI.asesorSel !== false, semilla: UI.semillaPolis }); G.turnos = true; S().turnos = true; UI.overShown = false; G.save(); startGame(); break; }   // PN2: empezar con una polis griega (sobre el mapa de Italia de momento). PN3: comarca al azar (UI.semillaPolis la fija para las capturas)
    case 'cortaen': case 'cortafun': G.newGame(($('hname') ? $('hname').value : '').trim() || 'Lucio Cornelio Escipión', null, { modo: 'corta', inicio: a === 'cortafun' ? 'fundar' : 'enPie', dificultad: UI.difSel || 'normal', asesor: UI.asesorSel !== false }); G.turnos = true; S().turnos = true; UI.overShown = false; G.save(); startGame(); break;
    case 'refundar': closeModal(); iniciarFundar(); break;
    case 'novedades': if (UI.menu && (!e.target.closest('.nv-hoja') || el.classList.contains('mvolver'))) { UI.novedades = !UI.novedades; showMenu(); } break;   // CDe3
    case 'continue': if (G.load()) { const pa = S().parada; UI.overShown = false; startGame(); if (S().over) showOver(); else if (pa) carta('<div class="yr">DÓNDE LO DEJASTE</div><h2>' + esc(pa.fecha || '') + '</h2><p>' + esc(pa.texto) + '</p><div class="acts"><button class="btn" data-act="close">Seguir jugando</button></div>'); } break;
    case 'postal': if (UI.tab !== 'city' || UI.menu || !UI.cityV || !UI.cityV.listo) toast('Abre una ciudad para sacar la postal.', 'bad'); else hacerPostal(UI.cityV, G, D, cityOk()).then(ok => toast(ok ? 'Postal guardada en tus descargas.' : 'No se pudo hacer la postal.', ok ? '' : 'bad')); break;
    case 'contemplar': if (UI.tab !== 'city' || UI.menu || !UI.cityV || !UI.cityV.listo) toast('Abre una ciudad para contemplarla.', 'bad'); else { hojaCierra(); contemplar(UI.cityV); } break;
    case 'croncopiar': copiar(G.cronicaTexto(cityOk())).then(ok => toast(ok ? 'Crónica copiada.' : 'No se pudo copiar.', ok ? '' : 'bad')); break;
    case 'crondescargar': descargar('cronica-' + cityOk() + '.txt', G.cronicaTexto(cityOk())); toast('Crónica guardada en tus descargas.'); break;
    case 'copiaguardar': if (!S() || UI.menu && !G.hasSave()) toast('Aún no hay partida que copiar.', 'bad'); else { if (UI.menu) G.load(); toast(guardarCopia(G) ? 'Copia guardada en tus descargas.' : 'No se pudo guardar la copia.'); } break;
    case 'copiacargar': { if (S() && !UI.menu && !confirm('Cargar una copia reemplaza la partida de este móvil. ¿Seguir?')) break; cargarCopia(G).then(r => { if (r.nada) return; if (!r.ok) { toast(r.motivo, 'bad'); return; } hojaCierra(true); UI.overShown = false; startGame(); toast('Copia cargada: ' + G.dateStr(S().t) + '.'); }); break; }
    case 'tomenu': G.save(); UI.modalQ = []; closeModal(); showMenu(); break;
    case 'tab': UI.codice = null; setTab(v); break;
    case 'sn2-trato': if (UI.sn2) { UI.sn2.b[v] = !UI.sn2.b[v]; render(); } break;
    case 'sn2-cambiar': sn2Cambiar(); break;
    case 'sn2-proponer': { const r = G.cambiarPropuesta(v); closeModal(); if (!r.ok) toast(r.motivo, 'bad'); else { UI.sn2 = null; toast('Propones: ' + G.leyDe(v).n + '.'); } render(); break; }
    case 'sn2-juegos': { const r = G.juegos(); toast(r.ok ? 'Juegos en el Foro: la plebe lo celebra.' : r.motivo, r.ok ? 'good' : 'bad'); render(); break; }
    case 'sn2-votar': { const sl = G.senadoSala(); if (!sl) break; const tr = G.tratos(sl.ley).filter(t => t.tipo !== 'si' && UI.sn2 && UI.sn2.b[t.bando]); sn2Resultado(G.votar(tr)); break; }
    case 'sn2-pasar': sn2Resultado(G.dejarPasar()); break;
    case 'inf-senado': UI.infoCierra(); UI.codice = null; UI.senT = 'hoy'; setTab('senado'); break;
    case 'plan-prio': case 'plan-est': case 'plan-nuevo': case 'plan-sug': case 'plan-add': case 'plan-cierra': case 'plan-ciu': case 'plan-poner': case 'plan-quitar': case 'plan-mover': case 'plan-votar': case 'plan-aband': case 'plan-aband-no': case 'plan-aband-si': planAccion(a, v); break;
    case 'sent': UI.senT = v; render(); { const vw = $('view'); if (vw) vw.scrollTop = 0; } break;   // MN2: pestañas del Senado
    case 'codice': UI.codice = v || null; render(); { const vw = $('view'); if (vw) vw.scrollTop = 0; } break;
    case 'turno': { if (UI.pasando || UI.hojaPend || $('inf')) break;   // con la hoja a la vista no se pasa: primero «Empezar la estación» if (s.vivo) { toast('🔥 Primero decide qué hacer con el fuego.', 'bad'); break; } if (s.over || s.pending.length || UI.modalOpen) break;
      UI.pasando = true; $('turno').hidden = true; AV.acum = []; let hecho = false;   // ES20: cerrojo: una pulsación, una estación (se abre al salir la hoja)
      try { hecho = G.pasarEstacion(); } finally { const l = AV.acum; AV.acum = null; if (!hecho) { UI.pasando = false; toastResumen(l); } else if (!UI.hojaPend && !$('inf')) UI.pasando = false; }
      UI.dirty = true; tickUI(); break; }   // lo pasado va a la hoja de estación; si una batalla o un fuego la cortan, un aviso
    case 'tira': { const e = $('tpanel'); e.hidden = !e.hidden; $('tira-b').setAttribute('aria-expanded', String(!e.hidden)); if (!e.hidden) { $('cuentas').hidden = true; $('popsheet').hidden = true; tpanelPinta(true); } break; }   // CDe3
    case 'menumodo': if (UI.hoja && UI.hoja.id === 'menu' && !$('hoja').hidden) hojaCierra(); else hojaAbre('menu'); break;
    case 'marchas': if (UI.hoja && UI.hoja.id === 'marchas' && !$('hoja').hidden) hojaCierra(); else hojaAbre('marchas'); break;
    case 'codicem': UI.codice = 'hechos'; setTab('log'); break;
    case 'bpest': if (v === 'gobernador' && window.GobernadorUI && window.GOBERNADOR) { hojaAbre('ciudad'); setTimeout(() => { const b = document.querySelector('#hoja .gb-bloque'); if (b && b.scrollIntoView) b.scrollIntoView({ block: 'start' }); }, 80); } else if (v !== 'yo') toast('Llegará pronto'); break;
    case 'entrar': entrarEn(v); break;
    case 'vera': hojaCierra(true); try { if (UI.map) UI.map.center(v); } catch (e) { } break;
    case 'hoja': hojaAbre(v); break;
    case 'minimapa': if (UI.map) { UI.map.minimapa(); hojaCierra(); } break;   // C18: el minimapa se abre y se cierra desde la hoja «Guerra»
    case 'mpanel': { const nm = $('hname') ? $('hname').value : ''; UI.mPanel = v; showMenu(); if (nm && $('hname')) $('hname').value = nm; $('menu').scrollTop = 0; break; }
    case 'escel': ESC.accion(v); hojaPinta(true); ESC.restaura(); break;   // CG2a
    case 'escempieza': escEmpieza(); break;
    case 'hojax': hojaCierra(); break;
    case 'menuconf': UI.hojaConf = true; hojaPinta(true); break;
    case 'popx': $('popsheet').hidden = true; break;
    case 'esteano': eaAbre(); break;
    case 'eacerrar': case 'eaambito': case 'eafila': case 'eatributo': case 'eacaja': eaAccion(a, v); break;
    case 'camabrir': camAbrir(); break;
    case 'clases': if (window.CLASES_UI) { hojaCierra(true); CLASES_UI.abrir(UI.city); } else toast('El menú de clases no ha cargado.', 'bad'); break;
    case 'cuentas': { const cs = $('cuentas'); cs.hidden = !cs.hidden; if (!cs.hidden) { $('popsheet').hidden = true; renderCuentas(true); } break; }
    case 'cux': $('cuentas').hidden = true; break;
    case 'cubien': { const got = G.venderBien(v, +el.dataset.n || 0), nb = D.ESPECIAL[v] ? D.ESPECIAL[v].n.toLowerCase() : v;   // CE2: vender bienes a precio fijo
      if (got) toast('⚖️ Vendes ' + nb + ' y recibes ' + got + ' denarios.'); else toast('No se vende: no hay ' + nb + ' o el almacén de denarios está lleno.', 'bad'); renderCuentas(true); render(); break; }
    case 'cuvender': { const got = G.venderSobrante(v), U = G.ultimaVenta, n = (RES_NOM[v] || (D.ESPECIAL[v] && D.ESPECIAL[v].n) || v).toLowerCase();
      const msg = { ok: '⚖️ Vendes el sobrante de ' + n + ' y recibes ' + got + ' denarios.', parcial: '⚖️ Solo se pudo vender ' + U.vendido + ' de ' + n + ' (' + got + ' denarios); quedará ' + U.quedara + ' por perder.', orolleno: 'No se vende: el almacén de denarios está lleno y el cobro se perdería. Gasta denarios antes.', sinmercado: 'No se puede vender: hace falta un mercado.', sinsobrante: 'No hay nada que se vaya a perder de ' + n + '.', sincaja: 'No te queda ' + n + ' para vender.', invalido: 'No se puede vender eso.' }[U.motivo] || 'No se pudo vender.';
      toast(msg, U.motivo === 'ok' ? '' : 'bad'); renderCuentas(true); break; }
    case 'cuobra': $('cuentas').hidden = true; if (v && s.cities[v]) { UI.city = v; UI.bsel = null; UI.cityList = false; setTab('city'); } else { UI.cityList = false; setTab('city'); hojaAbre('ciudad'); } break;
    case 'ayuda': UI.codice = window.CODICE ? 'tropas' : null; setTab('log'); break;
    case 'menu': G.save(); hojaCierra(true); showMenu(); break;
    case 'impf': UI.impF = v; render(); break;
    case 'impmismo': { const c = s.cities[v], o = c.obras[0], pz = o && o.pieza ? o.pieza : consejo(c, v).pieza; if (pz) mismoModal(v, pz, o && o.pieza ? !!o.nuevo : !consejo(c, v).mej); else toast('Esa ciudad no tiene una obra de la que copiar.', 'bad'); break; }
    case 'impmas': { const q = v.split('>'), op = opcionPieza(q[0], q[1], q[2] === '1'); if (!op) toast('Ya no se puede hacer esa obra.', 'bad'); else { const r = ponPieza(q[0], op); if (r.ok) { toast('🔨 ' + D.CITIES[q[0]].n + ': ' + op.nombre + '.'); closeModal(); render(); mismoModal(q[0], q[1], q[2] === '1'); } else toast(r.motivo + '.', 'bad'); } break; }
    case 'impc': UI.city = v; UI.bsel = null; UI.cityList = false; setTab('city'); break;
    case 'city': UI.city = v; UI.bsel = null; $('view').scrollTop = 0; if (UI.tab === 'map' && UI.map) UI.map.center(v); render(); tickUI(); break;
    case 'rep': if (G.reparto(UI.city, el.dataset.r, +el.dataset.d)) render(); break;
    case 'leva': if (G.leva(UI.city, D.LEVA.n)) { render(); renderCuentas(true); } break;
    case 'puertas': if (G.puertas(UI.city, v === 'cerrar')) { render(); renderCuentas(true); } break;
    case 'licenciar': if (G.licenciar(UI.city)) { render(); renderCuentas(true); } break;
    case 'triunfo': if (G.triunfo()) { render(); renderCuentas(true); } break;
    case 'fiesta': if (G.hacerFiesta(UI.city, v)) { render(); renderCuentas(true); } break;
    case 'racion': if (G.setRacion(UI.city, v)) render(); break;
    case 'techar': if (G.techarBarrio(UI.city, +v)) render(); break;
    case 'imp': if (G.setImp(UI.city, el.dataset.v)) render(); break;
    case 'ciud': if (G.darCiudadania(UI.city)) render(); break;
    case 'dipalianza': { const r = G.dipAlianza(v); if (r.ok) { toast('🤝 ' + D.FACTIONS[v].n + ' firma el foedus con Roma.', 'good'); render(); } else toast(r.motivo); break; }
    case 'diptributo': { const r = G.dipTributo(v); if (r.ok) { toast('📜 ' + D.FACTIONS[v].n + ' pagará ' + r.mensual * 3 + ' denarios por estación.', 'good'); render(); } else toast(r.motivo); break; }
    case 'mercadoui': { if (UI.hoja) hojaCierra(); tpanelCierra(); abrirMercado(UI.city, v); break; }
    case 'ruta': { const q = v.split('>'); if (G.rutaAbrir(q[0], q[1])) { toast('⚖️ Ruta abierta con ' + D.CITIES[q[1]].n + '.'); render(); } else toast(G.rutaPuede(q[0], q[1]) || 'No se puede abrir la ruta.', 'bad'); break; }
    case 'rutacerrar': { const q = v.split('>'); if (G.rutaCerrar(q[0], q[1])) { toast('Ruta cerrada.'); render(); } break; }
    case 'tipos': modal(tiposModal()); break;
    case 'dios': if (G.elegirDios(UI.city, v)) render(); break;
    case 'tipo': if (G.setTipo(UI.city, v)) { closeModal(); toast(D.TIPOS[v].i + ' ' + D.CITIES[UI.city].n + ': ' + D.TIPOS[v].n + '.'); render(); } else toast('No se puede elegir ese tipo.', 'bad'); break;
    case 'mover': { const E = G.ciudadE(UI.city), e = E && E.edificios.find(q => q.id === +v); if (!e) break; elegir3(e.tipo, [e.x, e.z]); if (UI.sel3) UI.sel3.mover = e.id; break; }
    case 'derr': { const k = UI.city + ':' + v; if (UI.derr !== k) { UI.derr = k; renderCity3D(); break; } UI.derr = null; const r = G.derribarPieza(UI.city, +v); if (r.ok) { UI.bsel = null; toast('🧱 Pieza derribada.', 'good'); } else toast(r.motivo + '.', 'bad'); renderCity3D(); tickUI(); break; }
    case 'cview': if (UI.cityV) { UI.bsel = null; UI.vistas = false; UI.cityV.view(v); renderCity3D(); } break;
    case 'barra': if (v === 'senado') UI.senT = 'hoy'; UI.codice = null; UI.vistas = false; UI.bsel = null; UI.cityList = false; setTab({ ciudad: 'city', senado: 'senado', saber: 'saber', tropas: 'army', mapa: 'map', imperio: 'imperio' }[v] || 'city'); break;
    case 'cplano': if (UI.cityV && UI.cityV.listo) { UI.cityV.plano(!UI.cityV.enPlano); UI.vistas = false; renderCity3D(); } break;
    case 'cvistas': UI.vistas = !UI.vistas; renderCity3D(); break;
    case 'capas': UI.vistas = false; renderCity3D(); if (window.BarrioUI) window.BarrioUI.alternaFila(!window.BarrioUI.capasAbiertas); break;   // CDe3: las capas de barrio, desde el botón de vista
    case 'cbuild': construir3(); break;
    case 'fundar': closeModal(); UI.abrirFundar(v, G.fundando() ? alFundarModo : undefined); break;
    case 'colonos': { const r = G.enviarColonos(el.dataset.from, el.dataset.to); if (r.ok) toast('🏛️ Los colonos parten hacia ' + G.lugar(el.dataset.to).n + '.', 'good'); else toast(r.motivo, 'bad'); UI.sheetKey = ''; renderSheet(); break; }
    case 'ccancel': salir3(); break;
    case 'cclose': UI.bsel = null; renderCity3D(); tickUI(); break;
    case 'saber': { const r = G.invUp(v); if (r.ok) { toast('Empiezas a estudiar: ' + D.INVEST[v].n); UI.svSel = null; UI.svDown = false; render(); } else toast(r.motivo, 'bad'); break; }
    case 'saberedad': { const r = G.edadUp(); if (r.ok) { toast('Empiezas a subir de edad'); UI.svDown = false; render(); } else toast(r.motivo, 'bad'); break; }
    case 'saberreforma': UI.svRef = v; UI.svDown = false; render(); break;
    case 'saberreformano': UI.svRef = null; UI.svDown = false; render(); break;
    case 'saberreformar': { const r = G.invReforma(v); UI.svRef = null; if (r.ok) { toast('Cambias de saber'); UI.svSel = null; } else toast(r.motivo, 'bad'); UI.svDown = false; render(); break; }
    case 'sabersel': UI.svSel = UI.svSel === v ? null : v; UI.svDown = false; render(); break;
    case 'dotsab': case 'clasab': { const x = G.sabiosDe(s.cities[UI.city]), r = a === 'dotsab' ? G.setSabios(UI.city, +v, x.clase) : G.setSabios(UI.city, x.dot, v); if (!r.ok) toast(r.motivo + '.', 'bad'); render(); break; }
    case 'pueblo': if (G.puebloMejorar(UI.city, +v)) render(); else toast(G.state.cities[UI.city].pobra ? 'Ya hay una obra de pueblo en curso.' : 'Faltan recursos.', 'bad'); break;
    case 'forja': if (G.forjaUp(UI.city, v)) render(); else toast(S().forja.cola ? 'Ya hay una mejora en curso.' : 'Faltan recursos.', 'bad'); break;
    case 'mejpz': { const r = G.mejorarPieza(UI.city, +v); if (r.ok) toast('🔨 ' + obraNom(r.obra) + ': obra en marcha.', 'good'); else toast(r.motivo + '.', 'bad'); renderCity3D(); tickUI(); break; }
    case 'train': if (G.train(UI.city, v, +el.dataset.n)) render(); else toast(s.cities[UI.city].train.length >= 5 ? 'La cola de instrucción está llena.' : G.recruits(s.cities[UI.city]) < +el.dataset.n ? 'No hay población suficiente: construye Ínsulas o espera a que crezca.' : 'Faltan recursos.', 'bad'); break;
    case 'mfrom': UI.mf = v; if (UI.mt === v) UI.mt = v === 'denarios' ? 'hierro' : 'denarios'; render(); break;
    case 'mto': UI.mt = v; if (UI.mf === v) UI.mf = v === 'denarios' ? 'materiales' : 'denarios'; render(); break;
    case 'trade': { const got = G.trade(UI.mf, UI.mt, +el.dataset.n); if (got) { toast('⚖️ Recibes ' + got + ' de ' + (RES_NOM[UI.mt] || 'Denarios').toLowerCase()); render(); } else toast('No se puede hacer ese cambio (faltan recursos o el almacén está lleno).', 'bad'); break; }
    case 'skill': if (G.skill(v)) render(); break;
    case 'ev': { const ev = D.EVENTS[+v]; carta('<div class="yr">' + ev.y + ' A.C.</div><h2>' + esc(ev.t) + '</h2><p>' + esc(ev.x) + '</p>' + licHtml(ev) + '<div class="acts"><button class="btn" data-act="close">Cerrar</button></div>'); break; }
    case 'zoom': if (UI.map) UI.map.zoom(+v); break;
    case 'home': if (UI.map) UI.map.center(s.hero.city || 'roma'); break;
    case 'unsel': UI.sel = null; renderSheet(); break;
    case 'goto': UI.city = v; setTab('city'); break;
    case 'goport': { closeModal(); UI.city = v; const E = G.ciudadE(v), e = E && E.edificios.find(q => q.tipo === 'muelle'); UI.bsel = e ? { k: 'pieza', id: e.id, x: e.x, z: e.z } : null; setTab('city'); break; }
    case 'pick': showPicker(el.dataset.from, el.dataset.to); break;
    case 'send': {
      const hero = $('pk-hero') && $('pk-hero').checked;
      const saq = $('pk-saq') && $('pk-saq').checked;
      { const fa = s.cities[el.dataset.to].owner; if (G.dipEstado(fa) === 'alianza') { if (!confirm('Atacar a ' + D.FACTIONS[fa].n + ' rompe vuestra alianza. ¿Seguir?')) break; G.dipRomper(fa); } }   // C3
      if (G.send(el.dataset.from, el.dataset.to, pickUnits(), hero, saq ? 'saqueo' : null)) { closeModal(); toast((saq ? '💰 Partida de saqueo hacia ' : '🚩 El ejército parte hacia ') + D.CITIES[el.dataset.to].n + '.'); UI.sheetKey = ''; renderSheet(); }
      else toast(G.sendMotivo || 'Selecciona al menos una unidad.', 'bad');
      break;
    }
    case 'salir': showSalir(v, +el.dataset.m); break;
    case 'salirgo': {
      const r = document.querySelector('#mbox input[name=sl-sitio]:checked'), hs = $('sl-hora'), hero = $('pk-hero') && $('pk-hero').checked;
      if (!r) { toast('Elige un sitio donde esperarlo.', 'bad'); break; }
      if (G.salirAlEncuentro(+el.dataset.m, r.value, pickUnits(), hero, { apostar: $('sl-apostar').checked, hora: hs ? hs.value : '' })) { closeModal(); toast('🚩 Tu ejército sale a esperarlos en ' + D.SITIOS[r.value].n + '.'); G.save(); UI.sheetKey = ''; renderSheet(); }
      else toast(G.sendMotivo || 'No se puede salir al encuentro.', 'bad');
      break;
    }
    case 'apostar': if (G.apostar(+el.dataset.m)) { toast('🌿 Tu ejército se esconde.'); G.save(); UI.sheetKey = ''; renderSheet(); } else toast(G.sendMotivo || 'No se puede apostar.', 'bad'); break;
    case 'dejarsitio': if (G.dejarElSitio(+el.dataset.m)) { toast('Tu ejército vuelve a la ciudad.'); G.save(); UI.sheetKey = ''; renderSheet(); } break;
    case 'close': closeModal(); break;
    case 'inf-mas': UI.infoMas(); break;
    case 'inf-cierra': UI.infoCierra(); break;
    case 'bview': { const pl = G.planBatalla(UI.binfo); iniciaNueva(UI.binfo, pl); break; }
    case 'bcont': { const resto = G.guerraGuardada(UI.binfo); if (resto) iniciaNueva(UI.binfo, G.planBatalla(UI.binfo), resto); break; }   // retoma la batalla guardada a mitad
    case 'bquick': { closeModal(); const pl = G.planBatalla(UI.binfo); G.borrarGuerra(); endBattle(G.jugarNueva(UI.binfo, { bono0: pl.via === 'sola' ? 1 : 0.92 })); break; }
    case 'bdone': closeModal(); UI.sheetKey = ''; render(); if (S().over) showOver(); break;
  }
});

/* ---------- bucle principal ---------- */
function frame(now) {
  const dt = Math.min(0.25, (now - UI.last) / 1000 || 0); UI.last = now;
  const s = S();
  if (s && !UI.menu) {
    if (!UI.modalOpen && !s.over && !UI.nueva) {
      if (s.pending.length) battlePrompt();
    }
    if (UI.fundar) fundarCuadro(now);
    else if (UI.map && UI.tab === 'map') UI.map.update(s, UI.sel);
    if (UI.cityV && UI.tab === 'city' && !UI.cityList && !UI.fundar && !G.fundando()) { if (s.cities[UI.city].owner !== 'roma') UI.city = G.myCities()[0] || 'roma'; if (UI.cityV.listo && !UI.minis) { try { UI.minis = UI.cityV.miniaturas(); } catch (e) { UI.minis = {}; } UI.bandK = ''; cityPantalla(); } UI.cityV.update(s.cities[UI.city], UI.city, UI.bsel, now / 1000); }
    if (UI.modo3 && UI.modo3 !== 'mirar' && UI.modo3 !== 'fundar' && (UI.tab !== 'city' || UI.cityList || UI.city !== UI.col3City)) salir3();
    if (UI.dirty) render();
    UI.acc = (UI.acc || 0) + dt; if (UI.acc > 0.25) { UI.acc = 0; tickUI(); vivoPinta(); if (UI.tab === 'map' && UI.sel && !UI.modalOpen) renderSheet(); }
    UI.saveT += dt; if (UI.saveT > 8) { UI.saveT = 0; G.save(); }
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => { if (UI.map) UI.map.resize(); if (UI.cityV && !$('citywrap').hidden) UI.cityV.resize(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && S() && !UI.menu) G.save(); });
/* Vigía 25/11: al abrir y al volver al juego se busca versión nueva; si llega, un aviso la ofrece (la página abierta sigue con los archivos viejos hasta recargar) */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const habia = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(r => { r.update().catch(() => { }); document.addEventListener('visibilitychange', () => { if (!document.hidden) r.update().catch(() => { }); }); }).catch(() => { });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!habia || document.getElementById('avisoVersion')) return;
    caches.keys().then(ks => ks.filter(k => /^aqvila-v\d+$/.test(k)).sort((a, b) => b.slice(8) - a.slice(8))[0] || '', () => '').then(k => {
      const b = document.createElement('button'); b.id = 'avisoVersion'; b.type = 'button';
      b.textContent = 'Hay una versión nueva' + (k ? ' (' + k.replace('aqvila-', '') + ')' : '') + '. Toca para actualizar';
      b.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:99999;min-height:48px;padding:10px 14px;border:2px solid #8a6d2b;border-radius:14px;background:#f3e2b3;color:#3a2a10;font:600 16px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35)';
      b.onclick = () => location.reload(); document.body.appendChild(b);
    });
  });
}

document.body.classList.add('aspecto');   // CDe4 (MN4a): el aspecto nuevo (papiro, bronce, iconos pintados); quitar la clase lo apaga
fijarAviso((x, k) => toast(x, k)); buildTop(); buildTabs(); initBandeja();
/* CDe1-B: botón «Ministros» de la ciudad */
function abreMinistros(dentro) {
  if (!window.MINISTROS_UI || !S()) return;
  const op = { mes: planMes(), alCambiar: () => { G.save(); UI.dirty = true; }, imagenes: { edificio: id => UI.minis && (UI.minis[id] || (id === 'puerto' ? UI.minis.muelle : '')), unidad: k => realPortrait(k) }, coste: (b, L) => G.cost(b, L) };
  if (dentro) MINISTROS_UI.incrustar(dentro, S(), op); else MINISTROS_UI.abrir(S(), op);
}
UI.menuC = crearMenu({ ministros: abreMinistros, senado: () => { UI.senT = 'plan'; setTab('senado'); }, D, ids: bandejaIds, info: piezaInfo, minis: () => UI.minis, coste5, puede: c => G.canAfford(c), elegir: id => elegir3(id), aviso: t => lineaPon(t, 'aviso', '', 5),
  famDe: id => { const P = Ciudad.EDIF[id]; return (P && P.bid && D.BUILD[P.bid] && D.BUILD[P.bid].fam) || D.FAMILIA_PIEZA[id] || 'principales'; },
  costa: () => { const c = D.CITIES[UI.city]; return !!(c && c.sea); } });
try { UI.map = new MapaPartida($('mapwrap'), { onSelect: id => { const otra = id && id === UI.sel && propiaEntrable(id); UI.sel = id; UI.sheetKey = ''; renderSheet(); if (otra) UI.map.entrarCiudad(id); }, puedeEntrar: propiaEntrable, ocupado: () => !!UI.battle, onEntrar: id => { UI.city = id; UI.bsel = null; UI.cityList = false; UI.deMapa = true; setTab('city'); } }); }
catch (e) { console.warn('WebGL no disponible para el mapa', e); $('mapwrap').innerHTML = '<div class="empty" style="padding:160px 24px;text-align:center">Tu dispositivo no puede mostrar el mapa 3D. Puedes jugar desde las pestañas Ciudad y Ejército.</div>'; }
showMenu(); requestAnimationFrame(frame);
// modelos reales (0 A.D.): se cargan en segundo plano; hasta entonces se usan los generados por código.
// MR3b: se cuentan uno a uno para la barra de la pantalla de carga (Carga, js/carga.js); la portada se va con el menú y los modelos
const CG = window.Carga || { fase() { }, progreso() { }, menuListo() { }, todoListo() { } }, cuenta = { n: 0, t: 0, i: 0, u: false, c: false };
const unoMas = () => { cuenta.n++; if (cuenta.i >= 2) CG.progreso(cuenta.n, cuenta.t); else CG.fase('Soldados y edificios', 60); };   // la cuenta, cuando se sabe el total (los dos índices)
const finCarga = () => { if (cuenta.u && cuenta.c) CG.todoListo(); };
CG.fase('Dibujando el mapa', 45); CG.menuListo();
loadIndex().then(idx => { const ks = Object.keys(idx); cuenta.t += ks.length; cuenta.i++; return Promise.all(ks.map(k => preload([k]).then(unoMas, unoMas))); }).then(() => { UI.dirty = true; cuenta.u = true; finCarga(); }, () => { cuenta.u = true; finCarga(); });
loadStaticIndex().then(idx => { const ks = Object.keys(idx).filter(k => !k.startsWith('__')); cuenta.t += ks.length + 1; cuenta.i++; return Promise.all([...ks.map(k => preloadStatic([k]).then(unoMas, unoMas)), loadGroundTextures().then(unoMas, unoMas)]); }).then(() => {
  try { $('citywrap').hidden = false; UI.cityV = new CityView3D($('citywrap'), Object.assign({ planoBase: true, onPick: tocarCiudad, onPlano: () => { if (UI.tab === 'city') renderCity3D(); }, onCalle: pts => { const r = G.trazarCalle(UI.city, pts); if (!r.ok) toast(r.motivo || 'No se puede trazar'); else renderCity3D(); return r; }, onCallesSalir: () => document.body.classList.remove('encalles') }, gestosCiudad)); $('citywrap').hidden = true; botonCalles(); if (UI.tab === 'city' && !UI.menu) setTab('city'); }
  catch (e) { console.warn('Sin vista 3D de ciudad', e); $('citywrap').hidden = true; }
  cuenta.c = true; finCarga();
}, () => { cuenta.c = true; finCarga(); });
window.UI = UI; UI.maniobra = window.UIManiobra; UI.consejoModal = consejoModal; UI.toast = toast; UI.toastResumen = toastResumen;   // CN22: la cola de avisos, para quien la necesite desde fuera


/* CD2a (CDe4): botón «Calles» en la fila de «Construir»; mientras se trazan, la bandeja de abajo se esconde */
function botonCalles() {
  const barra = document.getElementById('cbar'); if (!barra || document.getElementById('kbtn') || !UI.cityV || !UI.cityV.calles) return;
  const b = document.createElement('button'); b.id = 'kbtn'; b.type = 'button'; b.className = 'cbar-b'; b.setAttribute('aria-label', 'Trazar calles');
  b.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21 9 3M20 21 15 3M12 5v2M12 11v2M12 17v2"/></svg><b>Calles</b>';
  b.addEventListener('click', () => { if (UI.menuC && UI.menuC.cerrar) UI.menuC.cerrar(); UI.cityV.calles(true); if (UI.cityV.enCalles) document.body.classList.add('encalles'); else toast('Aquí no se pueden trazar calles.'); });
  barra.appendChild(b);
}
