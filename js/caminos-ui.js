/* AQVILA — CE10: pantalla «Tus caminos» y pantalla de victoria. Solo pantalla: los datos vienen de CAMINOS.vista().
   Estilos propios con prefijo cam-, inyectados una sola vez. Papiro romano. */
(function (root) {
  'use strict';
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : (d || 0);
  /* trazos de los iconos (mismos que el hueco MN2 de la hoja Imperio; ciudad: muralla con puerta) */
  const TRAZO = {
    armas: '<path d="M5 19L19 5M15 5h4v4M5 5l14 14M5 15v4h4"/>',
    comercio: '<path d="M12 3v18M5 7h14M3 14l2-7 2 7a2 2 0 0 1-4 0zM17 14l2-7 2 7a2 2 0 0 1-4 0z"/>',
    politica: '<path d="M4 20h16M6 17V9M10 17V9M14 17V9M18 17V9M3 9l9-5 9 5z"/>',
    ciudad: '<path d="M3 20V8l2-1V5l2 1 2-1v2l2-1 2 1V5l2 1 2-1v2l2 1v12M3 20h18M9 20v-6a3 3 0 0 1 6 0v6M12 11v3"/>'
  };
  const COLOR = { armas: '#9b2a1a', comercio: '#8a6414', politica: '#5a3a78', ciudad: '#46661f' };
  const NOMBRE = { armas: 'Armas', comercio: 'Comercio', politica: 'Política', ciudad: 'Ciudad' };
  const ico = (id, px, extra) => '<svg class="cam-svg" viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + (TRAZO[id] || '') + '</svg>';
  /* corona de laurel: dos ramas en arco casi cerradas arriba, hojas puntiagudas en pares, cinta roja abajo */
  const RAMA = (() => { let h = ''; const f = Math.PI / 180;
    for (let i = 0; i < 7; i++) { const t = (108 + i * 25) * f, x = 24 + 16.5 * Math.cos(t), y = 25 + 16.5 * Math.sin(t), tx = -Math.sin(t), ty = Math.cos(t), nx = Math.cos(t), ny = Math.sin(t);
      [1, -1].forEach(sg => { const dx = tx * Math.cos(40 * f) + sg * nx * Math.sin(40 * f), dy = ty * Math.cos(40 * f) + sg * ny * Math.sin(40 * f), r = Math.atan2(dx, -dy) / f;
        h += '<path d="M0 0Q3.1-4.4 0-10.5Q-3.1-4.4 0 0Z" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + r.toFixed(0) + ')"/>'; }); }
    return h; })();
  const LAUREL = (px, lleno) => '<svg viewBox="0 0 48 48" width="' + px + '" height="' + px + '" aria-hidden="true" stroke-linejoin="round" stroke-linecap="round">' +
    '<g fill="' + (lleno ? '#55661c' : 'none') + '" stroke="' + (lleno ? '#c9a232' : 'rgba(90,66,32,.5)') + '" stroke-width="' + (lleno ? 1.1 : 1.2) + '"><g>' + RAMA + '</g><g transform="translate(48 0) scale(-1 1)">' + RAMA + '</g></g>' +
    '<g fill="' + (lleno ? '#9b2a1a' : 'none') + '" stroke="' + (lleno ? '#5a0f06' : 'rgba(90,66,32,.5)') + '" stroke-width="1"><path d="M24 41l-6 6 3 .5 3-3 3 3 3-.5z"/><circle cx="24" cy="41" r="2.6"/></g></svg>';
  const RELOJ = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const VISTO = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  const PELIGRO = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l10 18H2zM12 10v5M12 18v.5"/></svg>';
  const CRUZ = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  const CSS = '' +
    '.cam-caja,.cam-caja *{box-sizing:border-box}' +
    '.cam-caja{--tinta:#2b1c0a;--tinta2:#5a4220;--oro:#a8781f;--rojo:#9b2a1a;--gris:#7d7360;color:var(--tinta);font-family:var(--libro,Georgia,serif);overflow:clip}' +
    '.cam-caja button{font-family:inherit;color:inherit;cursor:pointer}' +
    '.cam-svg{display:block;flex:none}' +
    /* barra y estados */
    '.cam-barra{position:relative;height:9px;border-radius:5px;background:rgba(60,35,10,.22);box-shadow:inset 0 1px 2px rgba(60,35,10,.5);overflow:clip}' +
    '.cam-barra i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:var(--bc,#8a6414)}' +
    '.cam-e-sost .cam-barra i{background:repeating-linear-gradient(135deg,var(--bc) 0 6px,#d9b24a 6px 12px)}' +
    '.cam-e-logrado .cam-barra i{background:linear-gradient(#e6c458,#b8862b)}' +
    '.cam-e-peligro .cam-barra i{background:linear-gradient(#e6c458,#b8862b)}' +
    '.cam-e-perdido .cam-barra i{background:#9a9282}' +
    '.cam-marca{display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:22px;height:22px;padding:0 5px;border-radius:11px;font:700 12px/1 var(--serif,serif);white-space:nowrap;border:1px solid rgba(60,35,10,.45);background:rgba(255,250,230,.7);color:var(--tinta2)}' +
    '.cam-e-sost .cam-marca{color:#6b4a0c;border-color:#a8781f;background:#f3dfa0}' +
    '.cam-e-logrado .cam-marca{color:#fff3c8;border-color:#6a4a0a;background:radial-gradient(circle at 35% 30%,#e8c24c,#a8781f)}' +
    '.cam-e-peligro .cam-marca{color:#fff;border-color:#5a0f06;background:var(--rojo)}' +
    '.cam-e-perdido .cam-marca{color:#f0ead8;border-color:#4a4536;background:var(--gris)}' +
    /* tira */
    '.cam-tira{display:block;width:100%;margin:0 0 10px;padding:8px 10px 10px;border-radius:6px;border:1px solid rgba(60,35,10,.5);background:rgba(255,246,214,.5);text-align:left;font:inherit;min-height:44px}' +
    '.cam-tira-t{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:7px}' +
    '.cam-tira-t b{font:700 16px var(--serif,serif);letter-spacing:.04em}' +
    '.cam-tira-t span{font-size:13px;color:var(--tinta2)}' +
    '.cam-fila{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}' +
    '.cam-casi{min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 3px 7px;border-radius:6px;border:1px solid rgba(60,35,10,.35);background:rgba(255,250,230,.55)}' +
    '.cam-casi .cam-ic{color:var(--bc);height:26px;display:grid;place-items:center}' +
    '.cam-casi .cam-nom{font:700 12px/1.1 var(--serif,serif);letter-spacing:.01em;max-width:100%;overflow:clip;white-space:nowrap}' +
    '.cam-casi .cam-barra{width:100%;height:7px}' +
    '.cam-e-logrado.cam-casi{background:linear-gradient(#fbefc2,#f0d98a);border-color:#a8781f}' +
    '.cam-e-peligro.cam-casi{background:#f6d9ce;border-color:var(--rojo)}' +
    '.cam-e-perdido.cam-casi{background:rgba(150,140,120,.35);border-color:var(--gris)}' +
    '.cam-e-perdido .cam-ic,.cam-e-perdido .cam-nom{color:var(--gris)}' +
    /* hoja */
    '.cam-hoja{display:flex;flex-direction:column;gap:10px;padding:2px 0 8px}' +
    '.cam-cab{display:flex;align-items:center;gap:10px}' +
    '.cam-cab h2{flex:1;margin:0;font:700 20px var(--serif,serif);letter-spacing:.06em}' +
    '.cam-cerrar{flex:none;min-height:44px;padding:0 14px;font:700 15px var(--serif,serif);border-radius:8px;border:1px solid rgba(60,35,10,.7);background:linear-gradient(#f5e6bd,#e3cc94);box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 3px rgba(0,0,0,.2)}' +
    '.cam-laureles{display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 8px;border-radius:8px;border:1px solid rgba(60,35,10,.4);background:linear-gradient(rgba(255,246,214,.65),rgba(240,217,138,.35))}' +
    '.cam-laureles .cam-lh{flex:none;width:56px;height:56px;display:grid;place-items:center}' +
    '.cam-laureles .cam-cuenta{text-align:center;min-width:0}' +
    '.cam-cuenta b{display:block;font:700 34px/1 var(--serif,serif);color:#7a5410}' +
    '.cam-cuenta span{font-size:13px;color:var(--tinta2)}' +
    '.cam-card{border-radius:8px;border:1px solid rgba(60,35,10,.45);background:rgba(255,246,214,.5);overflow:clip}' +
    '.cam-card.cam-e-logrado{border-color:#a8781f;background:linear-gradient(rgba(255,246,214,.7),rgba(240,217,138,.5));box-shadow:0 0 0 1px #e6c458 inset}' +
    '.cam-card.cam-e-peligro{border-color:var(--rojo);box-shadow:0 0 0 1px rgba(155,42,26,.5) inset}' +
    '.cam-card.cam-e-perdido{background:rgba(150,140,120,.3);border-color:var(--gris)}' +
    '.cam-card.cam-e-perdido .cam-foto{filter:grayscale(1) brightness(.85)}' +
    '.cam-top{display:flex;gap:10px;padding:10px 10px 6px;align-items:center}' +
    '.cam-foto{flex:none;width:74px;height:74px;border-radius:8px;border:2px solid var(--bc);background:radial-gradient(circle at 35% 30%,#4a3519,#1f160a);display:grid;place-items:center;color:#f3dfa0;overflow:clip;position:relative}' +
    '.cam-foto img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.cam-foto .cam-sello{position:absolute;right:2px;bottom:2px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#e8c24c,#a8781f);border:1px solid #5a3a06;color:#fff3c8}' +
    '.cam-sello:empty{display:none}' +
    '.cam-e-peligro .cam-foto .cam-sello{background:var(--rojo);border-color:#5a0f06;color:#fff}' +
    '.cam-e-perdido .cam-foto .cam-sello{background:var(--gris);border-color:#4a4536;color:#f0ead8}' +
    '.cam-e-sost .cam-foto .cam-sello{background:#f3dfa0;border-color:#a8781f;color:#6b4a0c}' +
    '.cam-dato{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}' +
    '.cam-nombre{display:flex;align-items:center;gap:8px;justify-content:space-between}' +
    '.cam-nombre b{font:700 19px/1.1 var(--serif,serif);letter-spacing:.03em;color:var(--bc)}' +
    '.cam-e-perdido .cam-nombre b{color:var(--gris)}' +
    '.cam-lema{font-size:13px;line-height:1.2;color:var(--tinta2);font-style:italic}' +
    '.cam-aviso{display:flex;align-items:center;gap:6px;margin:0 10px 8px;padding:5px 8px;border-radius:6px;font:700 13px/1.2 var(--serif,serif)}' +
    '.cam-aviso.sost{background:#f3dfa0;color:#6b4a0c;border:1px solid #a8781f}' +
    '.cam-aviso.peligro{background:var(--rojo);color:#fff}' +
    '.cam-aviso.perdido{background:var(--gris);color:#f0ead8}' +
    '.cam-aviso.logrado{background:#e8c24c;color:#4a3206}' +
    '.cam-aviso span{min-width:0}' +
    '.cam-hitos{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 10px 10px}' +
    '.cam-hito{min-width:0;display:flex;align-items:center;gap:6px;padding:6px 7px;border-radius:6px;border:1px solid rgba(60,35,10,.3);background:rgba(255,250,230,.6)}' +
    '.cam-hito .cam-hi{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:1.5px solid rgba(60,35,10,.5);background:rgba(255,250,230,.8);color:transparent}' +
    '.cam-hito.ok{background:rgba(180,210,120,.4);border-color:#46661f}' +
    '.cam-hito.ok .cam-hi{background:#46661f;border-color:#2c4a10;color:#fff}' +
    '.cam-hito .cam-ht{min-width:0;display:flex;flex-direction:column;gap:1px;overflow:clip}' +
    '.cam-hito .cam-hn{font:700 12px/1.15 var(--serif,serif);overflow-wrap:anywhere}' +
    '.cam-hito .cam-hx{font-size:13px;line-height:1.15;color:var(--tinta2);overflow-wrap:anywhere}' +
    '.cam-e-perdido .cam-hito{opacity:.6}' +
    /* victoria */
    '.cam-vic{position:fixed;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px 16px;overflow:clip;text-align:center;color:#2b1c0a;font-family:var(--libro,Georgia,serif);' +
    'background:radial-gradient(ellipse at 50% 28%,#fff4c8,#e8d4a2 55%,#b88a48 100%)}' +
    '.cam-vic *{box-sizing:border-box}' +
    '.cam-vic-l{filter:drop-shadow(0 4px 8px rgba(90,60,10,.5));animation:cam-late 2.4s ease-in-out infinite}' +
    '@keyframes cam-late{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}' +
    '.cam-vic h1{margin:0;font:700 40px/1.1 var(--serif,serif);letter-spacing:.06em;color:#7a2a12;text-shadow:0 2px 0 rgba(255,246,214,.9)}' +
    '.cam-vic p{margin:0;font-size:18px;color:#5a4220}' +
    '.cam-vic-c{display:flex;justify-content:center;gap:10px;margin:6px 0;flex-wrap:wrap}' +
    '.cam-vic-i{width:72px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px;border-radius:8px;border:2px solid #a8781f;background:linear-gradient(#fbefc2,#f0d98a);color:var(--bc)}' +
    '.cam-vic-i b{font:700 12px var(--serif,serif);color:#2b1c0a}' +
    '.cam-vic-bt{display:flex;flex-direction:column;gap:10px;width:100%;max-width:320px;margin-top:8px}' +
    '.cam-vic-bt button{min-height:50px;padding:0 16px;font:700 17px var(--serif,serif);border-radius:10px;border:1px solid rgba(60,35,10,.7);background:linear-gradient(#f5e6bd,#e3cc94);box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 4px rgba(0,0,0,.3);color:#2b1c0a}' +
    '.cam-vic-bt button.pri{background:linear-gradient(#b8382a,#8a2014);color:#fff3e0;border-color:#4a0f06}';

  function estilos() {
    if (typeof document === 'undefined' || document.getElementById('cam-estilos')) return;
    const st = document.createElement('style'); st.id = 'cam-estilos'; st.textContent = CSS; document.head.appendChild(st);
  }

  /* estado visible del camino: perdido > peligro > logrado > sosteniendo > en marcha */
  function estado(c) {
    if (c.perdido) return 'perdido';
    if (c.logrado && num(c.fallo) > 0) return 'peligro';
    if (c.logrado) return 'logrado';
    if (c.cumple) return 'sost';
    return 'marcha';
  }
  const pct = c => Math.round(Math.max(0, Math.min(1, num(c.avance))) * 100);
  const bar = c => '<div class="cam-barra"><i style="width:' + (estado(c) === 'marcha' ? Math.max(pct(c), pct(c) ? 4 : 0) : (estado(c) === 'perdido' ? pct(c) : 100)) + '%"></i></div>';
  function marca(c, e) {
    if (e === 'logrado') return '<span class="cam-marca" title="Logrado">' + VISTO + '</span>';
    if (e === 'peligro') return '<span class="cam-marca" title="En peligro">' + PELIGRO + '</span>';
    if (e === 'perdido') return '<span class="cam-marca" title="Perdido">' + CRUZ + '</span>';
    if (e === 'sost') return '<span class="cam-marca">' + RELOJ + num(c.sost) + '/' + num(c.sostMeta) + '</span>';
    return '<span class="cam-marca">' + pct(c) + '%</span>';
  }
  const cls = c => 'cam-e-' + estado(c);
  const col = c => ' style="--bc:' + (COLOR[c.id] || '#8a6414') + '"';
  const nom = c => NOMBRE[c.id] || c.n || c.id;
  const caminos = v => (v && Array.isArray(v.caminos)) ? v.caminos : [];

  function tira(v) {
    return '<button type="button" class="cam-caja cam-tira" data-cam="abrir" aria-label="Tus caminos: ver el detalle"><div class="cam-tira-t"><b>Tus caminos</b><span>Ganas con ' + num(v && v.necesarios, 3) + ' de ' + num(v && v.total, 4) + '</span></div><div class="cam-fila">' +
      caminos(v).map(c => { const e = estado(c); return '<div class="cam-casi ' + cls(c) + '"' + col(c) + '><div class="cam-ic">' + ico(c.id, 24) + '</div><div class="cam-nom">' + esc(nom(c)) + '</div>' + bar(c) + marca(c, e) + '</div>'; }).join('') + '</div></button>';
  }

  function aviso(c, e) {
    if (e === 'sost') return '<div class="cam-aviso sost">' + RELOJ + '<span>Aguanta ' + Math.floor(num(c.sost) / 3) + '/' + Math.ceil(num(c.sostMeta) / 3) + ' estaciones</span></div>';   // ES20: meses internos en estaciones
    if (e === 'peligro') { const r = Math.max(1, Math.ceil(Math.max(0, num(c.gracia, 3) - num(c.fallo)) / 3)); return '<div class="cam-aviso peligro">' + PELIGRO + '<span>Se pierde en ' + r + (r === 1 ? ' estación' : ' estaciones') + '</span></div>'; }
    if (e === 'perdido') return '<div class="cam-aviso perdido">' + CRUZ + '<span>Perdido</span></div>';
    if (e === 'logrado') return '<div class="cam-aviso logrado">' + VISTO + '<span>Camino logrado</span></div>';
    return '';
  }
  function hito(h) {
    return '<div class="cam-hito' + (h.ok ? ' ok' : '') + '"><span class="cam-hi">' + VISTO + '</span><div class="cam-ht"><span class="cam-hn">' + esc(h.n) + '</span><span class="cam-hx">' + (h.ok ? 'Hecho' : esc(h.texto)) + '</span></div></div>';
  }
  function tarjeta(c, img) {
    const e = estado(c), src = img && img[c.id];
    const foto = '<div class="cam-foto">' + (src ? '<img src="' + esc(src) + '" alt="" loading="lazy">' : ico(c.id, 52)) + '<span class="cam-sello">' + (e === 'logrado' ? VISTO : e === 'peligro' ? PELIGRO : e === 'perdido' ? CRUZ : e === 'sost' ? RELOJ : '') + '</span></div>';
    return '<section class="cam-card ' + cls(c) + '"' + col(c) + '><div class="cam-top">' + foto + '<div class="cam-dato"><div class="cam-nombre"><b>' + esc(nom(c)) + '</b>' + marca(c, e) + '</div>' + bar(c) + '<div class="cam-lema">' + esc(c.lema) + '</div></div></div>' + aviso(c, e) +
      '<div class="cam-hitos">' + (c.hitos || []).map(hito).join('') + '</div></section>';
  }
  function hoja(v, opts) {
    opts = opts || {}; const img = opts.img || {}, lg = num(v && v.logrados), nec = num(v && v.necesarios, 3);
    let lau = ''; for (let i = 0; i < nec; i++) lau += '<div class="cam-lh">' + LAUREL(56, i < lg) + '</div>';
    return '<div class="cam-caja cam-hoja"><div class="cam-cab"><h2>Tus caminos</h2><button type="button" class="cam-cerrar" data-cam="cerrar">Cerrar</button></div>' +
      '<div class="cam-laureles">' + lau + '<div class="cam-cuenta"><b>' + lg + '/' + nec + '</b><span>Ganas con ' + nec + ' de ' + num(v && v.total, 4) + '</span></div></div>' +
      caminos(v).map(c => tarjeta(c, img)).join('') + '</div>';
  }
  function victoria(v, opts) {
    const logs = caminos(v).filter(c => c.logrado || (v.victoria && (v.victoria.caminos || []).indexOf(c.id) >= 0)), n = (v && v.victoria && v.victoria.caminos) ? v.victoria.caminos.length : logs.length;
    return '<div class="cam-caja cam-vic" role="dialog" aria-label="Victoria"><div class="cam-vic-l">' + LAUREL(150, true) + '</div><h1>¡Victoria!</h1><p>Roma te aclama</p>' +
      '<div class="cam-vic-c">' + logs.map(c => '<div class="cam-vic-i"' + col(c) + '>' + ico(c.id, 34) + '<b>' + esc(nom(c)) + '</b></div>').join('') + '</div>' +
      '<p>Ganaste por ' + n + ' caminos de ' + num(v && v.total, 4) + '</p>' +
      '<div class="cam-vic-bt"><button type="button" class="pri" data-cam="seguir">Seguir jugando</button><button type="button" data-cam="abrir">Ver mis caminos</button></div></div>';
  }
  function montar(cont, html, alAccion) {
    estilos(); if (!cont) return;
    cont.innerHTML = html;
    if (!cont._camOn) { cont._camOn = true; cont.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-cam]'); if (b && cont.contains(b) && typeof cont._camFn === 'function') cont._camFn(b.getAttribute('data-cam')); }); }
    cont._camFn = alAccion;
  }
  root.CAMINOS_UI = { estilos, tira, hoja, victoria, montar };
})(typeof window !== 'undefined' ? window : globalThis);
