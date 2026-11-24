/* AQVILA — CG7: pantalla de la BATALLA RÁPIDA (planear y mirar, tres rondas). Solo pantalla: la lógica es js/batalla-rapida.js.
   Se carga con import() y deja window.UIBatallaRapida = { abrir, elegir, resolver }.
   Vista ligera: un lienzo 2D visto desde arriba (sin three.js), con la cámara encuadrando solo a las tropas vivas.
   Los estilos van en un <style id="br-estilo"> con todo prefijado «br-». */
(function () {
  'use strict';
  if (window.UIBatallaRapida) return;

  const ROJO = '#b3261e', AZUL = '#1f3a5f', SUELO = '#6a6f45';
  const CORTA = { avanzar: 'Av', aguantar: 'Ag', flanquear: 'Fl', cargar: 'Ca', retirarse: 'Re' };

  const ESTILO = `
#br,#br-el{position:fixed;inset:0;z-index:90;margin:0;color:var(--ink,#f1ead9);font:14px/1.25 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;overflow:clip;overscroll-behavior:none;touch-action:none;user-select:none;-webkit-user-select:none}
#br{background:#15130f;display:grid;grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:"top" "lienzo" "panel"}
#br .br-top{grid-area:top;padding:calc(6px + env(safe-area-inset-top)) 10px 6px;background:linear-gradient(#2a1f12,#1a140c);border-bottom:2px solid #6a4a18;box-shadow:0 2px 8px rgba(0,0,0,.5)}
#br .br-fila{display:flex;align-items:center;gap:8px}
#br .br-tit{flex:1;min-width:0;font:700 14px var(--serif,Georgia,serif);letter-spacing:.04em;color:#f3dfae;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#br .br-rel{font:600 14px/1 system-ui;font-variant-numeric:tabular-nums;color:#e9c063;min-width:38px;text-align:right}
#br .br-ret{flex:none;padding:6px 10px;min-height:32px;border-radius:8px;border:1px solid rgba(233,192,99,.45);background:rgba(255,255,255,.06);color:#f1ead9;font-size:12px;font-weight:650}
#br .br-ret.on{background:linear-gradient(#c0281f,#7d1712);border-color:#fff5}
#br .br-fuer{position:relative;display:flex;height:18px;margin-top:6px;border-radius:9px;overflow:hidden;background:#000;border:1px solid rgba(233,192,99,.35)}
#br .br-fuer i{display:block;height:100%;transition:width .3s}
#br .br-f0{background:${ROJO}}#br .br-f1{background:${AZUL};flex:1}
#br .br-fuer span{position:absolute;top:0;bottom:0;display:flex;align-items:center;padding:0 7px;font:700 11px system-ui;font-variant-numeric:tabular-nums;text-shadow:0 1px 2px #000;color:#fff}
#br .br-n0{left:0}#br .br-n1{right:0}
#br .br-lienzo{grid-area:lienzo;position:relative;min-height:0;min-width:0;background:${SUELO}}
#br canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
#br .br-aviso{position:absolute;left:10px;right:10px;bottom:8px;padding:8px 12px;border-radius:10px;background:rgba(20,12,6,.92);border:1px solid #e9c063;color:#fbe9c7;text-align:center;font-size:13px;pointer-events:none}
#br .br-cinta{position:absolute;left:0;right:0;top:0;padding:6px 10px;background:rgba(20,12,6,.78);color:#fbe9c7;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
#br .br-tribunos{position:absolute;left:10px;right:10px;top:40%;padding:12px;border-radius:10px;background:rgba(20,12,6,.94);border:1px solid #e9c063;color:#fbe9c7;text-align:center;font:700 16px var(--serif,Georgia,serif);pointer-events:none}
#br .br-panel{grid-area:panel;padding:8px 8px calc(8px + env(safe-area-inset-bottom));background:linear-gradient(#e6d3a3,#cdb67e);color:#2b1d0c;border-top:3px solid #6a4a18;max-height:50vh;overflow-y:auto;touch-action:pan-y}
#br .br-ala{padding:5px 6px 6px;margin-bottom:5px;border-radius:8px;background:rgba(255,255,255,.35);border:1px solid rgba(106,74,24,.45)}
#br .br-ala.vacia{opacity:.5}
#br .br-ah{display:flex;align-items:center;gap:8px;margin-bottom:4px;font-size:13px}
#br .br-ah b{font:700 13px var(--serif,Georgia,serif);flex:none}
#br .br-ah em{font-style:normal;flex:none;font-variant-numeric:tabular-nums}
#br .br-mor{flex:1;min-width:30px;height:7px;border-radius:4px;background:rgba(0,0,0,.28);overflow:hidden}
#br .br-mor i{display:block;height:100%;background:#4f7a2a}
#br .br-ch{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
#br .br-c{min-height:34px;padding:2px 1px;border-radius:7px;border:1px solid rgba(106,74,24,.6);background:rgba(255,255,255,.55);color:#2b1d0c;font-size:11.5px;font-weight:650;text-align:center}
#br .br-c.on{background:linear-gradient(#c0281f,#7d1712);color:#fff;border-color:#6a4a18}
#br .br-c:disabled{opacity:.5}
#br .br-sin{font-size:12.5px;padding:4px 0}
#br .br-su{width:100%;margin-top:4px}
#br .br-mirar,#br .br-saltar{display:block;width:100%;min-height:48px;margin-top:4px}
#br .br-pie{padding:2px 4px 6px;font-size:12.5px}
#br .br-vacio{margin:6px 0;font-size:12.5px;color:#5a4423}
#br .br-velo{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px;text-align:center;background:rgba(10,8,6,.86);overflow-y:auto;touch-action:pan-y}
#br .br-velo[hidden]{display:none}
#br .br-velo h2{font:700 30px var(--serif,Georgia,serif);color:#e9c063;margin:0}
#br .br-velo h2.mal{color:#d9764a}
#br .br-velo p{margin:0;max-width:340px;color:#f1ead9}
#br .br-baj{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:360px;text-align:left;font-size:12.5px}
#br .br-baj h3{font:700 12px var(--serif,Georgia,serif);color:#e9c063;margin:0 0 3px}
#br .br-baj div div{display:flex;justify-content:space-between;gap:6px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.1)}
#br .br-baj b{font-variant-numeric:tabular-nums}
#br .br-ver{min-width:210px;min-height:48px;margin-top:6px}
@media (orientation:landscape) and (max-height:520px){
#br{grid-template-columns:minmax(0,1fr) 330px;grid-template-rows:auto minmax(0,1fr);grid-template-areas:"top top" "lienzo panel"}
#br .br-panel{max-height:none;border-top:0;border-left:3px solid #6a4a18;padding-bottom:8px}
#br .br-top{padding-top:calc(4px + env(safe-area-inset-top))}
#br .br-ala{margin-bottom:4px}
#br .br-c{min-height:30px;font-size:11px}
#br .br-velo{flex-direction:column;gap:5px;padding:8px}
#br .br-velo h2{font-size:24px}
}
#br-el{background:rgba(10,8,6,.78);display:flex;align-items:flex-end;justify-content:center;touch-action:none}
#br-el .br-hoja{width:100%;max-width:480px;max-height:100%;overflow-y:auto;padding:14px 14px calc(14px + env(safe-area-inset-bottom));border-radius:16px 16px 0 0;background:linear-gradient(#e6d3a3,#cdb67e);border-top:3px solid #6a4a18;color:#2b1d0c}
#br-el h3{font:700 17px var(--serif,Georgia,serif);margin:0 0 10px;text-align:center}
#br-el .br-gran{display:block;width:100%;min-height:56px;margin-top:8px;padding:8px 12px}
#br-el .br-gran small{display:block;margin-top:2px;font:400 12px system-ui;letter-spacing:0;opacity:.9}
#br-el .br-vol{display:block;width:100%;min-height:44px;margin-top:10px;color:#2b1d0c;background:rgba(255,255,255,.4);border:1px solid rgba(106,74,24,.6);border-radius:8px;font-weight:650}
@media (orientation:landscape) and (max-height:520px){#br-el{align-items:center}#br-el .br-hoja{border-radius:16px;max-width:560px}#br-el .br-gran{min-height:48px;margin-top:5px}}
`;

  function estilo() {
    if (document.getElementById('br-estilo')) return;
    const s = document.createElement('style'); s.id = 'br-estilo'; s.textContent = ESTILO; document.head.appendChild(s);
  }
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  async function cargaBR() { if (!window.BatallaRapida) await import('./batalla-rapida.js'); return window.BatallaRapida; }
  const vivo = v => v.estado === 'firme' || v.estado === 'duda';
  const reloj = t => { t = Math.max(0, Math.floor(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  const miles = n => Math.round(n).toLocaleString('es');
  function colorRival(cfg) {
    if (cfg && cfg.col) return cfg.col;
    const F = (window.DATA && window.DATA.FACTIONS) || {};
    return (cfg && cfg.fac && F[cfg.fac] && F[cfg.fac].col) || AZUL;
  }
  function mezcla(hex, a) {   // '#rrggbb' + alfa → rgba()
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return hex;
    const n = parseInt(m[1], 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ---------- el velo del final (lo comparten abrir y resolver) ---------- */
  function veloFin(nodo, res, retirada, alVer) {
    const gana = !!res.victoria, tit = retirada ? 'Retirada' : gana ? '¡Victoria!' : 'Derrota';
    const lista = l => (res.bajas || []).filter(b => b.bando === l).map(b => '<div><span>' + esc(b.nombre) + '</span><b>' + miles(b.bajas) + '</b></div>').join('') || '<div><span>—</span></div>';
    const v = nodo.querySelector('.br-velo');
    v.innerHTML = '<h2 class="' + (gana && !retirada ? 'bien' : 'mal') + '">' + tit + '</h2><p>' + esc(res.motivo || '') + '</p>' +
      '<div class="br-baj"><div><h3>Tus bajas · ' + miles((res.bajasTotal || [0, 0])[0]) + '</h3>' + lista(0) + '</div><div><h3>Del rival · ' + miles((res.bajasTotal || [0, 0])[1]) + '</h3>' + lista(1) + '</div></div>' +
      '<button class="btn ro-sello br-ver">Ver el resultado</button>';
    v.hidden = false;
    v.querySelector('.br-ver').addEventListener('click', e => { e.stopPropagation(); alVer(); }, { once: true });
  }

  /* ---------- Resolver sin mirar ---------- */
  async function resolver(cfg, alTerminar) {
    const BR = await cargaBR(); estilo();
    const res = BR.resolver(cfg || {});
    const nodo = document.createElement('div'); nodo.id = 'br'; nodo.innerHTML = '<div class="br-velo" hidden></div>';
    document.body.appendChild(nodo); nodo.addEventListener('click', e => e.stopPropagation());   // el menú cierra sus hojas con cualquier toque que le llegue
    veloFin(nodo, res, false, () => { nodo.remove(); if (alTerminar) alTerminar(res); });
  }

  /* ---------- Batalla rápida ---------- */
  async function abrir(cfg, alTerminar) {
    const BR = await cargaBR(); estilo();
    cfg = cfg || {};
    if (document.getElementById('br')) document.getElementById('br').remove();
    const R = BR.crear(cfg), colE = colorRival(cfg);
    const nodo = document.createElement('div'); nodo.id = 'br'; nodo.setAttribute('role', 'dialog'); nodo.setAttribute('aria-label', 'Batalla rápida');
    nodo.innerHTML = '<div class="br-top"><div class="br-fila"><b class="br-tit"></b><span class="br-rel"></span><button class="br-ret">Retirarse</button></div>' +
      '<div class="br-fuer"><i class="br-f0"></i><i class="br-f1"></i><span class="br-n0"></span><span class="br-n1"></span></div></div>' +
      '<div class="br-lienzo"><canvas></canvas><div class="br-cinta" hidden></div><div class="br-aviso" hidden></div><div class="br-tribunos" hidden>Los tribunos terminan la batalla</div></div>' +
      '<div class="br-panel"></div><div class="br-velo" hidden></div>';
    document.body.appendChild(nodo); nodo.addEventListener('click', e => e.stopPropagation());   // el menú cierra sus hojas con cualquier toque que le llegue
    const $ = s => nodo.querySelector(s), lienzo = $('.br-lienzo'), cv = $('canvas'), ctx = cv.getContext('2d'), panel = $('.br-panel');
    const tit = $('.br-tit'), rel = $('.br-rel'), btnRet = $('.br-ret'), f0 = $('.br-f0'), n0 = $('.br-n0'), n1 = $('.br-n1'), cinta = $('.br-cinta'), aviso = $('.br-aviso'), trib = $('.br-tribunos');
    const pub = window.__br = { R, fase: R.fase, cuadros: 0 };
    let sel = null, vista = [], idx = 0, ultimo = 0, rid = 0, vivoNodo = true, retirada = false, tAviso = 0, tRet = 0, tFin = 0, tHud = 0, cuadro = 0;
    const roto = {};   // id → instante en que se vio roto (para que se desvanezca)
    let W = 1, H = 1, dpr = 1;
    const cam = { x: 0, y: 0, s: 3, listo: false };

    const medida = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(1, lienzo.clientWidth); H = Math.max(1, lienzo.clientHeight);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medida) : null;
    if (ro) ro.observe(lienzo); else window.addEventListener('resize', medida);
    medida();

    const hablar = t => { aviso.textContent = t; aviso.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(() => { aviso.hidden = true; }, 2400); };

    /* --- paneles --- */
    function chips(act, ala, actual, extra) {
      return '<div class="br-ch">' + BR.ORDENES.map(o => '<button class="br-c' + (actual === o.k ? ' on' : '') + '" data-br="' + act + '" data-ala="' + ala + '" data-k="' + o.k + '">' + o.n + '</button>').join('') + '</div>' + (extra || '');
    }
    function panelPlanear() {
      const bot = '<button class="btn ro-sello br-mirar" data-br="mirar">Mirar ' + BR.SEG + ' s ›</button>';
      const v = sel !== null ? vista.find(u => u.id === sel) : null;
      if (v) {
        const actual = R.ordUni[v.id] || 'ala';
        panel.innerHTML = '<div class="br-ala"><div class="br-ah"><b>' + esc(v.nom) + '</b><em>' + miles(v.n) + ' / ' + miles(v.n0) + '</em><span class="br-mor"><i style="width:' + Math.round(Math.max(0, Math.min(1, v.moral)) * 100) + '%"></i></span></div>' +
          '<div class="br-ch">' + BR.ORDENES.map(o => '<button class="br-c' + (actual === o.k ? ' on' : '') + '" data-br="uni" data-k="' + o.k + '">' + o.n + '</button>').join('') + '</div>' +
          '<button class="br-c br-su' + (actual === 'ala' ? ' on' : '') + '" data-br="uni" data-k="ala">Con su ala</button></div>' +
          '<p class="br-vacio">Toca el suelo para volver a las alas.</p>' + bot;
        return;
      }
      panel.innerHTML = BR.grupos(R).map(g => {
        const vacia = !g.ids.length;
        return '<div class="br-ala' + (vacia ? ' vacia' : '') + '"><div class="br-ah"><b>' + esc(g.nombre) + '</b>' + (vacia ? '<em>Sin tropas</em>' : '<em>' + miles(g.hombres) + ' hombres</em><span class="br-mor"><i style="width:' + Math.round(Math.max(0, Math.min(1, g.moral)) * 100) + '%"></i></span>') + '</div>' +
          (vacia ? '' : chips('ala', g.ala, g.orden)) + '</div>';
      }).join('') + bot;
    }
    function panelMirar() {
      panel.innerHTML = '<p class="br-pie">Los manípulos cumplen lo ordenado. Mira cómo marcha la batalla.</p><button class="btn ro-sello br-saltar" data-br="saltar">Saltar ›</button>';
    }
    function pinta() {
      pub.fase = R.fase;
      tit.textContent = R.fase === 'fin' ? 'Batalla terminada' : 'Ronda ' + R.ronda + ' de ' + BR.RONDAS + ' · ' + (R.fase === 'planear' ? 'Planea' : 'Mira');
      cinta.hidden = R.fase !== 'mirar' || !cinta.textContent;
      if (R.fase === 'planear') panelPlanear(); else if (R.fase === 'mirar') panelMirar(); else panel.innerHTML = '';
      hud(true);
    }
    function hud(ya) {
      const ahora = performance.now(); if (!ya && ahora - tHud < 120) return; tHud = ahora;
      let a = 0, b = 0; for (const u of vista) if (vivo(u)) { if (u.lado === 0) a += u.n; else b += u.n; }
      f0.style.width = (a + b ? a / (a + b) * 100 : 50) + '%'; n0.textContent = miles(a); n1.textContent = miles(b);
      rel.textContent = reloj(R.S.t);
    }

    /* --- fin --- */
    function terminar() {
      if (tFin) return; tFin = 1; cancelAnimationFrame(rid); rid = 0;
      vista = BR.vista(R); pinta(); veloFin(nodo, BR.resumen(R), retirada, () => { cerrar(); if (alTerminar) alTerminar(BR.resumen(R)); });
    }
    function tras(fase) {   // lo que pasa tras avanzar o saltar
      pinta();
      if (fase !== 'fin') return;
      if (R.ronda >= BR.RONDAS && R.S.t > R.tFin + 0.5) { trib.hidden = false; setTimeout(() => { trib.hidden = true; if (vivoNodo) terminar(); }, 1700); }
      else terminar();
    }

    /* --- ratón y dedo --- */
    const aPantalla = (x, y) => [W / 2 + (x - cam.x) * cam.s, H / 2 - (y - cam.y) * cam.s];
    function toca(e) {
      if (R.fase !== 'planear') return;
      const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
      let mejor = null, md = 1e9;
      for (const u of vista) {
        if (u.lado !== 0 || !vivo(u)) continue;
        const [sx, sy] = aPantalla(u.x, u.y), dx = px - sx, dy = py - sy, c = Math.cos(u.a), s = Math.sin(u.a);
        const lx = dx * c - dy * s, ly = -(dx * s + dy * c);   // al marco del manípulo (x: hacia donde mira)
        const hw = Math.max(u.fondo * cam.s, 6) / 2 + 12, hh = Math.max(u.frente * cam.s, 6) / 2 + 12;
        const d = Math.hypot(dx, dy);
        if (Math.abs(lx) <= hw && Math.abs(ly) <= hh && d < md) { md = d; mejor = u.id; }
      }
      sel = mejor; pinta();
    }
    let ini = null;
    const abajo = e => { ini = { x: e.clientX, y: e.clientY }; };
    const arriba = e => { if (ini && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) < 10) toca(e); ini = null; };
    cv.addEventListener('pointerdown', abajo); cv.addEventListener('pointerup', arriba);

    function clic(e) {
      const b = e.target.closest('[data-br]'); if (!b) return;
      const act = b.dataset.br;
      if (act === 'ala') { const m = BR.ordenarAla(R, +b.dataset.ala, b.dataset.k); if (m) hablar(m); pinta(); }
      else if (act === 'uni') { const m = BR.ordenarUnidad(R, sel, b.dataset.k); if (m) hablar(m); pinta(); }
      else if (act === 'mirar') { BR.mirar(R); sel = null; ultimo = performance.now(); pinta(); }
      else if (act === 'saltar') { tras(BR.saltar(R)); }
    }
    panel.addEventListener('click', clic);
    btnRet.addEventListener('click', () => {
      if (R.fase === 'fin') return;
      if (!tRet) { btnRet.textContent = '¿Seguro?'; btnRet.classList.add('on'); tRet = setTimeout(() => { tRet = 0; btnRet.textContent = 'Retirarse'; btnRet.classList.remove('on'); }, 3000); return; }
      clearTimeout(tRet); tRet = 0; retirada = true; BR.retirarse(R); terminar();
    });

    /* --- dibujo --- */
    function encuadra(dt) {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const u of vista) {
        if (!vivo(u)) continue;
        const r = Math.max(u.frente, u.fondo) / 2 + 2; x0 = Math.min(x0, u.x - r); x1 = Math.max(x1, u.x + r); y0 = Math.min(y0, u.y - r); y1 = Math.max(y1, u.y + r);
      }
      if (x0 > x1) return;
      const bw = Math.max(60, x1 - x0 + 30), bh = Math.max(60, y1 - y0 + 30);
      const s = Math.min(6, (W - 28) / bw, (H - 28) / bh), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      if (!cam.listo) { cam.x = cx; cam.y = cy; cam.s = s; cam.listo = true; return; }
      const k = 1 - Math.exp(-dt * 3);
      cam.x += (cx - cam.x) * k; cam.y += (cy - cam.y) * k; cam.s += (s - cam.s) * k;
    }
    function dibuja(ahora) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = SUELO; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.beginPath();
      const mx = W / 2 / cam.s, my = H / 2 / cam.s;
      for (let g = Math.floor((cam.x - mx) / 50) * 50; g <= cam.x + mx; g += 50) { const sx = Math.round(W / 2 + (g - cam.x) * cam.s) + .5; ctx.moveTo(sx, 0); ctx.lineTo(sx, H); }
      for (let g = Math.floor((cam.y - my) / 50) * 50; g <= cam.y + my; g += 50) { const sy = Math.round(H / 2 - (g - cam.y) * cam.s) + .5; ctx.moveTo(0, sy); ctx.lineTo(W, sy); }
      ctx.stroke();
      const orden = vista.slice().sort((a, b) => (vivo(a) ? 1 : 0) - (vivo(b) ? 1 : 0));   // los rotos debajo
      const etiquetas = [];
      for (const u of orden) {
        const [sx, sy] = aPantalla(u.x, u.y), base = u.lado === 0 ? ROJO : colE;
        if (!vivo(u)) {
          if (!roto[u.id]) roto[u.id] = ahora;
          const a = Math.max(0.12, 0.8 - (ahora - roto[u.id]) / 3500);
          ctx.fillStyle = mezcla(base, a); ctx.beginPath(); ctx.arc(sx, sy, 2.4, 0, 6.2832); ctx.fill(); continue;
        }
        delete roto[u.id];
        const w = Math.max(u.fondo * cam.s, 7), h = Math.max(u.frente * cam.s, 7);
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(-u.a);
        ctx.fillStyle = mezcla(base, u.estado === 'duda' ? 0.5 : 0.95); ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.lineWidth = u.lado === 0 && u.id === sel ? 3 : u.lucha ? 2 : 1;
        ctx.strokeStyle = u.lado === 0 && u.id === sel ? '#ffd95a' : u.lucha ? '#f6efd8' : 'rgba(0,0,0,.45)'; ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2 + 6, 0); ctx.stroke();
        ctx.restore();
        if (u.lado === 0 && R.fase === 'planear') etiquetas.push([sx, sy, CORTA[R.ordUni[u.id] || R.ordAla[u.ala]] || '']);
      }
      if (etiquetas.length) {
        ctx.font = '700 9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.fillStyle = '#fff';
        for (const [x, y, t] of etiquetas) { ctx.strokeText(t, x, y); ctx.fillText(t, x, y); }
      }
    }
    function eventosNuevos() {
      const ev = BR.eventos(R, idx); idx += ev.length;
      for (let i = ev.length - 1; i >= 0; i--) if (ev[i].tipo !== 'orden' && ev[i].texto) { cinta.textContent = ev[i].texto; cinta.hidden = false; break; }
    }
    function bucle(ts) {
      if (!vivoNodo) return;
      rid = requestAnimationFrame(bucle);
      const dt = Math.min(0.1, Math.max(0, (ts - (cuadro || ts)) / 1000)); cuadro = ts;
      if (R.fase === 'mirar') {
        const f = BR.avanzar(R, dt * 5); eventosNuevos();
        if (f !== 'mirar') { vista = BR.vista(R); tras(f); }
      }
      vista = BR.vista(R); encuadra(dt); dibuja(ts); hud(false); pub.cuadros++;
    }

    function cerrar() {
      vivoNodo = false; cancelAnimationFrame(rid); clearTimeout(tAviso); clearTimeout(tRet);
      if (ro) ro.disconnect(); else window.removeEventListener('resize', medida);
      cv.removeEventListener('pointerdown', abajo); cv.removeEventListener('pointerup', arriba); panel.removeEventListener('click', clic);
      nodo.remove(); if (window.__br === pub) delete window.__br;
    }

    pub.pos = id => { const u = vista.find(v => v.id === id); if (!u) return null; const [x, y] = aPantalla(u.x, u.y), r = cv.getBoundingClientRect(); return [r.left + x, r.top + y]; };   // para las pruebas
    vista = BR.vista(R); pinta(); rid = requestAnimationFrame(bucle);
    return { cerrar };
  }

  /* ---------- ¿Cómo quieres librar la batalla? ---------- */
  function elegir(cfg, alTerminar, opc) {
    estilo(); opc = opc || {};
    const viejo = document.getElementById('br-el'); if (viejo) viejo.remove();
    const nodo = document.createElement('div'); nodo.id = 'br-el'; nodo.setAttribute('role', 'dialog'); nodo.setAttribute('aria-label', '¿Cómo quieres librar la batalla?');
    nodo.innerHTML = '<div class="br-hoja"><h3>¿Cómo quieres librar la batalla?</h3>' +
      '<button class="btn ro-sello br-gran" data-k="vivo">Jugar en vivo<small>Diriges cada manípulo en 3D</small></button>' +
      '<button class="btn ro-sello br-gran" data-k="rapida">Batalla rápida<small>Tres rondas: planeas y miras</small></button>' +
      '<button class="btn ro-sello br-gran" data-k="resolver">Resolver<small>Sin mirar: lo deciden tus tribunos</small></button>' +
      '<button class="br-vol" data-k="volver">Volver</button></div>';
    document.body.appendChild(nodo); nodo.addEventListener('click', e => e.stopPropagation());   // el menú cierra sus hojas con cualquier toque que le llegue
    nodo.addEventListener('click', e => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      const k = b.dataset.k; nodo.remove();
      if (k === 'vivo') { if (opc.vivo) opc.vivo(); else if (window.UIMando) window.UIMando.abrir(cfg, alTerminar); }
      else if (k === 'rapida') abrir(cfg, alTerminar);
      else if (k === 'resolver') resolver(cfg, alTerminar);
      else if (opc.volver) opc.volver();
    });
  }

  window.UIBatallaRapida = { abrir, elegir, resolver };
})();
