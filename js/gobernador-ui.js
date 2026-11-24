/* AQVILA — MN3: bloque «Gobernador» de la ficha de ciudad. Solo pantalla: la lógica está en gobernador.js (window.GOBERNADOR).
   Estilos propios con prefijo gb-, inyectados una sola vez. */
(function (root) {
  'use strict';
  const G = () => root.GOBERNADOR;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CSS = '' +
    '.gb-bloque{box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:6px;border:1px solid rgba(60,35,10,.4);background:rgba(255,246,214,.45);color:var(--tinta,#2b1c0a);font-family:var(--libro,Georgia,serif);overflow:clip}' +
    '.gb-cab{display:flex;align-items:center;gap:12px}' +
    '.gb-med{flex:none;width:64px;height:64px;box-sizing:border-box;border-radius:50%;display:grid;place-items:center;font-size:32px;line-height:1;overflow:clip;color:#f6e9c4;background:radial-gradient(circle at 35% 30%,#4a3519,#1f160a);box-shadow:0 0 0 3px #b8862b,inset 0 0 0 2px rgba(0,0,0,.6)}' +
    '.gb-med img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.gb-tit{flex:1;min-width:0}' +
    '.gb-tit b{display:block;font:700 18px/1.2 var(--serif,Georgia,serif);letter-spacing:.04em}' +
    '.gb-tit span{display:block;font-size:14px;line-height:1.3;color:var(--tinta2,#5a4220)}' +
    '.gb-int{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:48px;padding:6px 12px;box-sizing:border-box;border-radius:8px;border:1px solid rgba(60,35,10,.7);background:var(--fibras,none),linear-gradient(#f5e6bd,#e3cc94);color:inherit;font:700 16px/1.2 var(--serif,Georgia,serif);text-align:left;box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 3px rgba(0,0,0,.2)}' +
    '.gb-int[aria-checked=true]{background:linear-gradient(#f3e2b4,#d8bb80);border-color:var(--oliva,#46661f);box-shadow:inset 0 0 0 2px var(--oliva,#46661f)}' +
    '.gb-pal{flex:none;position:relative;width:46px;height:26px;border-radius:13px;background:#8a7a5a;box-shadow:inset 0 1px 3px rgba(0,0,0,.5);transition:background .15s}' +
    '.gb-pal::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#f6e9c4;box-shadow:0 1px 2px rgba(0,0,0,.6);transition:transform .15s}' +
    '.gb-int[aria-checked=true] .gb-pal{background:var(--oliva,#46661f)}' +
    '.gb-int[aria-checked=true] .gb-pal::after{transform:translateX(20px)}' +
    '.gb-que{margin:0;font-size:15px;line-height:1.35}' +
    '.gb-est{margin:0;font-size:15px;line-height:1.35;color:var(--tinta2,#5a4220);font-style:italic}' +
    '.gb-mes{margin:0;font:700 13px var(--serif,Georgia,serif);letter-spacing:.06em;text-transform:uppercase;color:var(--tinta2,#5a4220)}' +
    '.gb-lin{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}' +
    '.gb-lin li{display:flex;align-items:flex-start;gap:8px;font-size:15px;line-height:1.3;padding:6px 8px;border-radius:5px;background:rgba(255,250,230,.5);border-left:3px solid var(--oliva,#46661f)}' +
    '.gb-lin li.mal{border-left-color:var(--minio,#9b2a1a);background:rgba(155,42,26,.12);color:#6e1d11}' +
    '.gb-lin i{flex:none;font-style:normal;width:22px;text-align:center}' +
    '.gb-lin span{flex:1;min-width:0;overflow-wrap:anywhere}' +
    '.gb-nota{margin:0;font-size:12px;line-height:1.3;color:var(--tinta2,#5a4220);opacity:.85}';
  function css() {
    if (typeof document === 'undefined' || document.getElementById('gb-css')) return;
    const e = document.createElement('style'); e.id = 'gb-css'; e.textContent = CSS; (document.head || document.documentElement).appendChild(e);
  }
  function retrato(op) {
    let u = ''; try { const f = op && op.imagenes && op.imagenes.retrato; u = f ? f() || '' : ''; } catch (e) { u = ''; }
    return u ? '<img src="' + esc(u) + '" alt="">' : '🏛️';
  }
  function html(s, cid, op) {
    op = op || {}; const g = G();
    let on = false, inf = null;
    try { on = !!(g && g.activo(s, cid)); inf = on && g.informe ? g.informe(s, cid) : null; } catch (e) { on = false; inf = null; }
    let cuerpo;
    if (!on) cuerpo = '<p class="gb-est">Llevas tú la ciudad.</p>';
    else if (!inf || !inf.lineas || !inf.lineas.length) cuerpo = '<p class="gb-est">Actuará al cambiar de estación.</p>';
    else {
      let mes = ''; try { mes = op.mesTexto ? op.mesTexto(inf.mes) : ''; } catch (e) { mes = ''; }
      cuerpo = '<p class="gb-mes">' + (mes ? esc(mes) : 'Última estación') + '</p><ul class="gb-lin">' +
        inf.lineas.map(l => '<li class="' + (l.ok ? 'bien' : 'mal') + '"><i>' + esc(l.i || (l.ok ? '✔️' : '⚠️')) + '</i><span>' + esc(l.texto) + '</span></li>').join('') + '</ul>';
    }
    const nom = op.nombreCiudad ? esc(op.nombreCiudad(cid)) : '';
    return '<section class="gb-bloque" data-cid="' + esc(cid) + '"><div class="gb-cab"><div class="gb-med">' + retrato(op) + '</div><div class="gb-tit"><b>Gobernador</b>' +
      (nom ? '<span>' + nom + '</span>' : '') + '</div></div>' +
      '<p class="gb-que">Construye y encarga solo cada estación. Lo quitas cuando quieras.</p>' +
      '<button type="button" class="gb-int" role="switch" aria-checked="' + on + '" data-gb="alternar"><span>Que la lleve un gobernador</span><span class="gb-pal"></span></button>' +
      cuerpo + (g && g.LICENCIA ? '<p class="gb-nota">' + esc(g.LICENCIA) + '</p>' : '') + '</section>';
  }
  function montar(cont, s, cid, op) {
    op = op || {}; css();
    const pinta = () => { cont.innerHTML = html(s, cid, op); };
    const clic = ev => {
      const b = ev.target.closest && ev.target.closest('[data-gb=alternar]'); if (!b || !cont.contains(b)) return;
      const si = b.getAttribute('aria-checked') !== 'true';
      if (op.alternar) op.alternar(cid, si); else if (G()) G().poner(s, cid, si);
      pinta();
    };
    cont.addEventListener('click', clic); pinta();
    return () => { cont.removeEventListener('click', clic); cont.innerHTML = ''; };
  }
  root.GobernadorUI = { html: (s, c, o) => { css(); return html(s, c, o); }, montar };
})(typeof window !== 'undefined' ? window : globalThis);
