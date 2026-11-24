/* CD1b: el botón «Construir» de la ciudad y su mini menú por siete familias.
   Solo pinta y maneja el menú. Todo lo que necesita se lo pasa ui.js por parámetro (nada de globales):
   ctx = { D, ids(), info(id), famDe(id), minis(), coste5(c), puede(coste), costa(), elegir(id), aviso(t) } */

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
const PORTADA = { principales: ['almacen', 'mercado', 'escuela', 'granero'], infra: ['fuente', 'zanja', 'dique'], politica: ['templo', 'curia'], militar: ['cuartel', 'establo', 'herreria'], produccion: ['granja', 'aserradero', 'cantera', 'taller'], viviendas: ['compitum', 'casa', 'insula'], puerto: ['muelle'] };
const PORTADA_SVG = { principales: 'columnas', infra: 'arcos', politica: 'columnas', militar: 'faro', produccion: 'arbol', viviendas: 'parque', puerto: 'barco' };

export function crearMenu(ctx) {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('app') || document.body, cs = $('csheet');
  const btn = document.createElement('button'); btn.id = 'cbtn'; btn.type = 'button'; btn.hidden = true; btn.setAttribute('aria-label', 'Construir');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V10l7-6 7 6v11M10 21v-6h4v6"/></svg><b>Construir</b>';
  const hoja = document.createElement('div'); hoja.id = 'cmenu'; hoja.hidden = true;
  (cs || app).appendChild(btn); app.appendChild(hoja);
  const est = { fam: null };

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
  function pintaFamilia(f) {
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
  function abrir() { est.fam = null; pinta(); hoja.hidden = false; btn.classList.add('on'); }
  function cerrar() { if (hoja.hidden) return; hoja.hidden = true; est.fam = null; btn.classList.remove('on'); }
  btn.addEventListener('click', () => hoja.hidden ? abrir() : cerrar());
  hoja.addEventListener('click', e => {
    const t = e.target.closest('[data-cm]'); if (!t) return;
    const a = t.dataset.cm;
    if (a === 'x') cerrar();
    else if (a === 'atras') { est.fam = null; pinta(); }
    else if (a === 'fam') { est.fam = t.dataset.f; pinta(); hoja.scrollTop = 0; }
    else if (a === 'pronto') ctx.aviso(ctx.D.OBRAS_PRONTO[t.dataset.id].n + ': llegará pronto.');
    else if (a === 'ed') { const i = ctx.info(t.dataset.id); if (i.cerrada) { ctx.aviso(i.cerrada + '.'); return; } if (i.enObra) { ctx.aviso('La obra ya está en marcha.'); return; } cerrar(); ctx.elegir(t.dataset.id); }
  });
  /* ui.js lo llama cada vez que repinta la pantalla de la ciudad: m3 es el modo; solo se ve al mirar */
  function sync(m3, visible) {
    const ver = !!visible && m3 === 'mirar'; btn.hidden = !ver;
    if (!ver) cerrar(); else if (!hoja.hidden) { const k = ctx.minis() ? 1 : 0; if (est.k !== k) { est.k = k; pinta(); } }
  }
  return { sync, cerrar, abrir, get abierto() { return !hoja.hidden; } };
}
