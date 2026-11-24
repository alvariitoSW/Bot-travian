import * as AGRO from './agricultura.js';   // CDe3-F2c: suelos, campos y la Villa
import { montarBarrioUI } from './barrio-ui.js';   // CD5b: manchas de barrio, ficha y capa de necesidades
/* CD1b: el botón «Construir» de la ciudad y su mini menú por siete familias.
   Solo pinta y maneja el menú. Todo lo que necesita se lo pasa ui.js por parámetro (nada de globales):
   ctx = { ministros(), senado(), D, ids(), info(id), famDe(id), minis(), coste5(c), puede(coste), costa(), elegir(id), aviso(t) } */

/* dibujos sencillos propios (sin arte externo) para las fichas «Pronto» sin miniatura */
const TR = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
const SVG = {
  columnas: '<path d="M8 24 32 10l24 14z"/><path d="M12 28v22M24 28v22M40 28v22M52 28v22M8 54h48"/>',
  arcos: '<path d="M4 20h56M4 54h56M10 54V34a8 8 0 0 1 16 0v20M30 54V34a8 8 0 0 1 16 0v20M50 54V34"/>',
  cloaca: '<path d="M6 30h52M6 50h52M14 50a18 14 0 0 1 36 0"/><path d="M24 50c4-4 12-4 16 0"/>',
  gotas: '<path d="M32 8c8 12 14 19 14 27a14 14 0 0 1-28 0c0-8 6-15 14-27z"/><path d="M26 38a6 6 0 0 0 6 6"/>',
  cruz: '<path d="M24 8h16v16h16v16H40v16H24V40H8V24h16z"/>',
  arbol: '<path d="M32 56V34"/><circle cx="32" cy="22" r="14"/><path d="M32 40l-8-8M32 36l8-8"/>',
  parque: '<path d="M16 56V40M16 40a9 9 0 1 0 0-1M46 56V36"/><circle cx="46" cy="24" r="12"/><path d="M4 56h56"/>',
  barco: '<path d="M6 38h52l-8 14H14zM32 8v30M32 10l16 20H32"/>',
  faro: '<path d="M24 56 28 20h8l4 36zM26 20h12l-2-8H28zM8 18l14 4M56 18 42 22M32 4v4M12 56h40"/>'
};
const GLIFO = { termas: 'gotas', acueducto: 'arcos', cloaca: 'cloaca', medico: 'cruz', jardin: 'arbol', parque: 'parque', curia: 'columnas', comicio: 'columnas', astillero: 'barco', faro: 'faro' };
const svgG = g => '<svg class="cm-svg" viewBox="0 0 64 64" aria-hidden="true" ' + TR + '>' + (SVG[g] || SVG.columnas) + '</svg>';
/* la miniatura de cada familia: la primera pieza suya que tenga miniatura */
const PORTADA = { principales: ['almacen', 'mercado', 'escuela', 'granero'], infra: ['fuente', 'zanja', 'dique'], politica: ['templo', 'curia'], militar: ['cuartel', 'establo', 'herreria'], produccion: ['granja', 'aserradero', 'cantera', 'taller'], viviendas: ['compitum', 'casa', 'insula'], puerto: ['muelle'], agricultura: ['granja', 'granero', 'aserradero'] };
const PORTADA_SVG = { principales: 'columnas', infra: 'arcos', politica: 'columnas', militar: 'faro', produccion: 'arbol', viviendas: 'parque', puerto: 'barco', agricultura: 'arbol' };
/* CDe3-F2c: estilo propio de la hoja de campos (colores del encaje, filas de 44 px o más) */
const CSS_AGRO = '#cmenu .cm-sec{margin:12px 2px 6px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--gold,#d9b44a)}#cmenu .cm-ed span.cm-ico:not(.x){font-size:44px;line-height:78px;height:78px;min-height:78px;color:inherit}#cmenu .cm-ed span.cm-falta:not(.x){white-space:normal;font-size:11.5px;line-height:1.15;color:var(--bad,#f07a5a);min-height:28px}#cmenu .cm-ed.cerrada .cm-ico{filter:grayscale(1)}#cmenu .cm-ico + b{white-space:normal!important;min-height:30px}#cmenu .cm-nota{margin:6px 2px 10px;font-size:13px;line-height:1.3;opacity:.85}#cmenu .cm-filas{display:flex;flex-direction:column;gap:8px}#cmenu .cm-fila{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;min-height:56px;padding:8px 12px;border-radius:12px;text-align:left;color:inherit;border:0;border-left:6px solid #888;background:rgba(255,255,255,.07)}#cmenu .cm-fila b{font-size:15px;font-weight:650}#cmenu .cm-fila small{grid-column:1;font-size:12.5px;line-height:1.25;opacity:.85}#cmenu .cm-fila .cm-c{grid-row:1/3;grid-column:2;font-size:12px;font-weight:650;color:var(--gold,#d9b44a);text-align:right}#cmenu .cm-fila .cm-e{font-weight:700;font-size:12px;margin-left:6px}#cmenu .cm-fila.bien{border-left-color:#6fbf6f}#cmenu .cm-fila.bien .cm-e{color:#8fd88f}#cmenu .cm-fila.regular{border-left-color:#d8c060}#cmenu .cm-fila.regular .cm-e{color:#e6d27a}#cmenu .cm-fila.mal{border-left-color:#e08a4a}#cmenu .cm-fila.mal .cm-e{color:#f0a468}#cmenu .cm-fila.no{border-left-color:#c8584a;opacity:.55}#cmenu .cm-fila.no .cm-e{color:#f07a5a}#cmenu .cm-fila.cara .cm-c{color:var(--bad,#f07a5a)}#cmenu .cm-fila:active:not(.no){filter:brightness(1.18)}';

export function crearMenu(ctx) {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('app') || document.body, cs = $('csheet');
  const btn = document.createElement('button'); btn.id = 'cbtn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Construir');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V10l7-6 7 6v11M10 21v-6h4v6"/></svg><b>Construir</b>'; btn.className = 'cbar-b'; btn.title = 'Construir un edificio';
  const hoja = document.createElement('div'); hoja.id = 'cmenu'; hoja.hidden = true;
  /* CDe3: «Construir» es un botón redondo flotante sobre la ciudad. Ministros y Senado ya no tienen botón aquí: viven en la pestaña Senado. */
  const barra = document.createElement('div'); barra.id = 'cbar'; barra.hidden = true;
  barra.appendChild(btn);
  (cs || app).appendChild(barra); app.appendChild(hoja);
  const est = { fam: null, sub: null };
  { const st = document.createElement('style'); st.textContent = CSS_AGRO; document.head.appendChild(st); }

  const foto = (id, fam) => {
    const m = ctx.minis() || {};
    if (id && m[id]) return '<img src="' + m[id] + '" alt="" draggable="false">';
    if (fam) { const p = (PORTADA[fam] || []).find(q => m[q]); if (p) return '<img src="' + m[p] + '" alt="" draggable="false">'; }
    return '<span class="cm-sv">' + svgG(GLIFO[id] || PORTADA_SVG[fam]) + '</span>';
  };
  const familias = () => {
    const ids = ctx.ids(), costa = ctx.costa();
    return ctx.D.FAMILIAS.filter(([f]) => f !== 'puerto' || costa || ids.some(q => ctx.famDe(q) === 'puerto'));
  };
  function pintaFamilias() {
    hoja.innerHTML = '<div class="cm-cab"><b>Construir</b><button type="button" data-cm="x" aria-label="Cerrar">✕ Cerrar</button></div><div class="cm-fams">' +
      familias().map(([f, n]) => '<button type="button" class="cm-fam" data-cm="fam" data-f="' + f + '">' + foto(null, f) + '<b>' + esc(n) + '</b></button>').join('') + '</div>';
  }
  /* ---- CDe3-F2c: Agricultura ---- */
  const G = () => window.Game, cid = () => window.UI && window.UI.city;
  const NOTA_T = { bien: 'Bien', regular: 'Regular', mal: 'Mal', no: 'No' };
  const cab = (nom, atras) => '<div class="cm-cab"><button type="button" data-cm="' + atras + '">‹ ' + (atras === 'atras' ? 'Familias' : 'Agricultura') + '</button><b>' + esc(nom) + '</b><button type="button" data-cm="x" aria-label="Cerrar">✕ Cerrar</button></div>';
  const ficha = (id, ico, nom, pie, extra, falta) => '<button type="button" class="cm-ed' + (falta ? ' cerrada' : '') + (extra || '') + '" data-cm="ag" data-id="' + id + '"><span class="cm-ico" aria-hidden="true">' + ico + '</span><b>' + esc(nom) + '</b>' + (falta ? '<span class="cm-falta">' + esc(falta) + '</span>' : '<span>' + pie + '</span>') + '</button>';
  function pintaAgro() {
    const D = ctx.D, g = G(), c = cid(), ps = g.parcelas(c), max = g.parcelasMax(c);
    const pie = id => ctx.coste5(g.cost('agri_' + id, 0));
    const campos = Object.keys(AGRO.CAMPOS).map(k => { const b = D.BUILD['agri_' + k], ab = g.agroAbierto(k); return ficha('c:' + k, b.i, AGRO.CAMPOS[k].nombre, pie(k), '', ab.ok ? '' : ab.motivo); });
    const mejoras = Object.keys(AGRO.MEJORAS).map(k => { const b = D.BUILD['agri_' + k], ab = g.agroAbierto(k); return ficha('m:' + k, b.i, AGRO.MEJORAS[k].nombre, pie(k), '', ab.ok ? '' : ab.motivo); });
    const vi = AGRO.EDIFICIOS.villa, ab = g.agroAbierto('villa'), ya = g.hayVilla(c);
    const villa = ya ? ficha('v', '🏛️', vi.nombre, 'Ya la tienes', ' obra', '') : ficha('v', '🏛️', vi.nombre, ctx.coste5(vi.coste), '', ab.ok ? '' : ab.motivo);
    hoja.innerHTML = cab('Agricultura', 'atras') + '<p class="cm-nota">Campos plantados: ' + ps.length + ' de ' + max + '. Elige un campo y después el suelo donde plantarlo.</p><div class="cm-sec">Campos</div><div class="cm-eds">' + campos.join('') + '</div><div class="cm-sec">Mejoras</div><div class="cm-eds">' + mejoras.join('') + '</div><div class="cm-sec">Villa</div><div class="cm-eds">' + villa + '</div>';
  }
  function filaSuelo(h) { return '<button type="button" class="cm-fila ' + h.nota + (h.cara ? ' cara' : '') + '" data-cm="' + h.acc + '" data-a="' + h.a + '" data-b="' + h.b + '"' + (h.nota === 'no' ? ' aria-disabled="true"' : '') + '><b>' + esc(h.t) + '<span class="cm-e">' + NOTA_T[h.nota] + '</span></b><small>' + esc(h.razon) + '</small><span class="cm-c">' + h.c + '</span></button>'; }
  function pintaCampo(k) {
    const g = G(), c = cid(), cp = AGRO.CAMPOS[k], coste = g.cost('agri_' + k, 0), cara = !ctx.puede(coste), ps = g.parcelas(c).filter(p => !p.granja && p.campo !== k);
    const orden = Object.keys(AGRO.SUELOS).map((su, i) => ({ su, i, e: AGRO.encaje(k, su) })).sort((a, b) => b.e.rinde - a.e.rinde || a.i - b.i);
    const nuevas = orden.map(o => filaSuelo({ acc: 'plantar', a: k, b: o.su, nota: o.e.nota, cara, t: 'Plantar ' + AGRO.SUELOS[o.su].en, razon: o.e.razon, c: ctx.coste5(coste) }));
    const cambia = ps.map(p => ({ p, e: AGRO.encaje(k, p.suelo) })).sort((a, b) => b.e.rinde - a.e.rinde).map(o => filaSuelo({ acc: 'cambiar', a: k, b: o.p.id, nota: o.e.nota, cara, t: 'Cambiar ' + o.p.nombre.toLowerCase() + ' ' + AGRO.SUELOS[o.p.suelo].de, razon: o.e.razon, c: ctx.coste5(coste) }));
    hoja.innerHTML = cab(cp.nombre, 'ag') + '<p class="cm-nota">' + esc(cp.d) + ' Parcelas: ' + g.parcelas(c).length + ' de ' + g.parcelasMax(c) + '.</p><div class="cm-sec">Suelos libres, de mejor a peor</div><div class="cm-filas">' + nuevas.join('') + '</div>' + (cambia.length ? '<div class="cm-sec">O cambiar un campo tuyo</div><div class="cm-filas">' + cambia.join('') + '</div>' : '');
  }
  function pintaMejora(k) {
    const g = G(), c = cid(), m = AGRO.MEJORAS[k], coste = g.cost('agri_' + k, 0), cara = !ctx.puede(coste), ps = g.parcelas(c).filter(p => p.campo === m.campo);
    const filas = ps.map(p => ({ p, ok: p.posibles.includes(k) })).sort((a, b) => b.ok - a.ok).map(o => filaSuelo({ acc: 'mejorar', a: k, b: o.p.id, nota: o.ok ? o.p.nota : 'no', cara, t: o.p.nombre + ' ' + AGRO.SUELOS[o.p.suelo].de, razon: o.ok ? 'Aquí cabe.' : (o.p.mejoras.includes(k) ? 'Ya la tiene.' : 'No se puede aquí.'), c: ctx.coste5(coste) }));
    hoja.innerHTML = cab(m.nombre, 'ag') + '<p class="cm-nota">' + esc(m.efecto) + '</p><div class="cm-sec">Parcelas</div>' + (filas.length ? '<div class="cm-filas">' + filas.join('') + '</div>' : '<p class="cm-vacio">No tienes ' + AGRO.CAMPOS[m.campo].nombre.toLowerCase() + ' donde ponerla. Planta uno primero.</p>');
  }
  const okAgro = () => !!(G() && G().hayAgricultura && G().hayAgricultura() && cid());
  function pintaFamilia(f) {
    if (f === 'agricultura' && okAgro()) { const u = est.sub; return u && u[0] === 'c' ? pintaCampo(u.slice(2)) : u && u[0] === 'm' ? pintaMejora(u.slice(2)) : pintaAgro(); }
    const D = ctx.D, nom = (D.FAMILIAS.find(q => q[0] === f) || [0, f])[1];
    const reales = ctx.ids().filter(id => ctx.famDe(id) === f);
    const pronto = Object.keys(D.OBRAS_PRONTO).filter(id => D.OBRAS_PRONTO[id].fam === f);
    const fichas = reales.map(id => {
      const i = ctx.info(id), cara = !i.enObra && !!i.ini && !ctx.puede(i.ini), est2 = i.cerrada ? 'cerrada' : i.enObra ? 'en obra' : i.ya ? 'ya ampliada' : '';
      return '<button type="button" class="cm-ed' + (i.cerrada ? ' cerrada' : '') + (cara ? ' cara' : '') + (i.enObra ? ' obra' : '') + '" data-cm="ed" data-id="' + id + '"' + (i.cerrada ? ' title="' + esc(i.cerrada) + '"' : '') + '>' + foto(id, f) + '<b>' + esc(i.nombre) + '</b><span>' + (est2 || (i.coste ? ctx.coste5(i.coste) : '')) + '</span></button>';
    }).concat(pronto.map(id => '<button type="button" class="cm-ed pronto" data-cm="pronto" data-id="' + id + '" aria-disabled="true">' + foto(id, null) + '<b>' + esc(D.OBRAS_PRONTO[id].n) + '</b><span class="cm-sello">Pronto</span></button>'));
    hoja.innerHTML = '<div class="cm-cab"><button type="button" data-cm="atras">‹ Familias</button><b>' + esc(nom) + '</b><button type="button" data-cm="x" aria-label="Cerrar">✕ Cerrar</button></div><div class="cm-eds">' + (fichas.join('') || '<p class="cm-vacio">Aún no hay nada aquí.</p>') + '</div>';
  }
  function pinta() { est.fam ? pintaFamilia(est.fam) : pintaFamilias(); }
  function abrir() { est.fam = null; est.sub = null; pinta(); hoja.hidden = false; btn.classList.add('on'); barra.classList.add('oculta'); }
  function cerrar() { if (hoja.hidden) return; hoja.hidden = true; est.fam = null; est.sub = null; btn.classList.remove('on'); barra.classList.remove('oculta'); }
  btn.addEventListener('click', () => hoja.hidden ? abrir() : cerrar());
  hoja.addEventListener('click', e => {
    const t = e.target.closest('[data-cm]'); if (!t) return;
    const a = t.dataset.cm;
    if (a === 'x') cerrar();
    else if (a === 'atras') { est.fam = null; est.sub = null; pinta(); }
    else if (a === 'ag') { est.sub = t.dataset.id || null; hoja.scrollTop = 0; if (est.sub === 'v') { est.sub = null; const r = G().construirVilla(cid()); ctx.aviso(r.ok ? 'Villa construida: los campos rinden más.' : (r.motivo || 'No se pudo') + '.'); pinta(); } else if (est.sub && G().agroAbierto(est.sub.slice(2)).ok === false) { ctx.aviso(G().agroAbierto(est.sub.slice(2)).motivo + '.'); est.sub = null; } else pinta(); }
    else if (a === 'plantar' || a === 'cambiar' || a === 'mejorar') {
      if (t.getAttribute('aria-disabled')) { ctx.aviso(t.querySelector('small').textContent); return; }
      const g = G(), r = a === 'mejorar' ? g.mejorarParcela(cid(), t.dataset.b, t.dataset.a) : g.plantarCampo(cid(), t.dataset.a, t.dataset.b);
      if (!r.ok) { ctx.aviso((r.motivo || 'No se pudo') + '.'); return; }
      cerrar(); ctx.aviso(a === 'mejorar' ? AGRO.MEJORAS[t.dataset.a].nombre + ': hecho.' : (r.aviso ? 'Plantado, pero ' + r.aviso.charAt(0).toLowerCase() + r.aviso.slice(1) : 'Plantado: ' + AGRO.CAMPOS[t.dataset.a].nombre.toLowerCase() + '.'));
    }
    else if (a === 'fam') { est.fam = t.dataset.f; est.sub = null; pinta(); hoja.scrollTop = 0; }
    else if (a === 'pronto') ctx.aviso(ctx.D.OBRAS_PRONTO[t.dataset.id].n + ': llegará pronto.');
    else if (a === 'ed') { const i = ctx.info(t.dataset.id); if (i.cerrada) { ctx.aviso(i.cerrada + '.'); return; } if (i.enObra) { ctx.aviso('La obra ya está en marcha.'); return; } cerrar(); ctx.elegir(t.dataset.id); }
  });
  /* ui.js lo llama cada vez que repinta la pantalla de la ciudad: m3 es el modo; solo se ve al mirar */
  let bui = null;
  /* CDe2: la ficha del barrio pide al juego (Game): encargar al ministro y calmar una revuelta. «Construir la mejora» lo hace la ficha sola (ctx.elegir). */
  const tras = (r, bien) => { ctx.aviso(r && r.ok ? bien(r) : ((r && r.motivo) || 'No se pudo') + '.'); if (r && r.ok && window.BarrioUI) window.BarrioUI.cerrar(); };
  document.addEventListener('barrio:encargar', e => { if (!G() || !G().necEncargar) return; e.preventDefault(); tras(G().necEncargar(cid(), e.detail), () => 'Encargado. Míralo en «Ministros».'); });
  document.addEventListener('barrio:calmar', e => { if (!G() || !G().calmarRevuelta) return; e.preventDefault(); tras(G().calmarRevuelta(cid(), e.detail.barrio, e.detail.remedio), r => r.texto); });
  function sync(m3, visible) {
    try { if (visible) { const V = window.UI && window.UI.cityV; if (!bui && V && V.listo && V.capaSuelo) bui = montarBarrioUI(V, ctx); if (bui) bui.sync(m3, visible); if (V && V.listo && V.estadosBarrios && G() && G().necEstados) V.estadosBarrios(G().necEstados(cid())); } } catch (e) { console.warn('Barrios: ', e); }
    const ver = !!visible && m3 === 'mirar'; barra.hidden = !ver;
    if (!ver) cerrar(); else if (!hoja.hidden) { const k = ctx.minis() ? 1 : 0; if (est.k !== k) { est.k = k; pinta(); } }
  }
  return { sync, cerrar, abrir, get abierto() { return !hoja.hidden; } };
}
