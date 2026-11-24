/* AQVILA — CD3b: pantalla «Tus ministros». Solo pantalla: la lógica está en ministros.js (window.MINISTROS).
   Hoja de papiro que sube desde abajo. Estilos propios con prefijo mn-, inyectados una sola vez. */
(function (root) {
  'use strict';
  const M = () => root.MINISTROS, D = () => root.DATA;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* nombre visible: «termas» se llama siempre «Baños» */
  const vis = t => String(t == null ? '' : t).replace(/termas/g, 'baños').replace(/Termas/g, 'Baños').replace(/TERMAS/g, 'BAÑOS');
  const txt = t => esc(vis(t));
  const nomB = b => b === 'termas' ? 'Baños' : ((D().BUILD[b] && D().BUILD[b].n) || b);
  const nomC = id => (D().CITIES[id] && D().CITIES[id].n) || id;
  const nomU = u => (D().UNITS[u] && D().UNITS[u].n) || u;
  const RECURSO = { grano: 'grano', denarios: 'denarios', materiales: 'materiales', hierro: 'hierro' };
  const ACTO = { ruta: 'abrir una ruta de comercio', juegos: 'dar unos juegos', ofrenda: 'hacer una ofrenda', leva: 'hacer una leva', grano: 'repartir grano' };
  const IMP = { bajo: 'bajos', normal: 'normales', alto: 'altos' };

  const CSS = '' +
    '.mn-fondo{position:fixed;left:0;right:0;bottom:76px;top:auto;z-index:60;display:flex;justify-content:center;pointer-events:none;overflow:clip}' +
    '.mn-hoja{--tinta:#2b1c0a;--tinta2:#5a4220;--oliva:#46661f;pointer-events:auto;box-sizing:border-box;width:100%;max-width:560px;max-height:min(85vh,calc(100vh - 84px));display:flex;flex-direction:column;color:var(--tinta);font-family:var(--libro,Georgia,serif);' +
    'background-color:var(--papiro,#e8d4a2);background-image:var(--fibras),var(--manchas),radial-gradient(ellipse at 20% 0%,rgba(255,246,214,.7),transparent 55%),radial-gradient(ellipse at 100% 100%,rgba(140,92,36,.38),transparent 60%);' +
    'border-radius:4px 4px 0 0;box-shadow:inset 14px 0 18px -12px rgba(100,60,18,.8),inset -14px 0 18px -12px rgba(100,60,18,.8),0 -14px 40px #000c;padding:0 14px;animation:mn-sube .22s ease-out}' +
    '@keyframes mn-sube{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}' +
    '@keyframes mn-brilla{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}' +
    '.mn-asa{flex:none;position:relative;height:22px;margin:0 -14px 8px;border-radius:9px;background:var(--veta),linear-gradient(#9a6c38,#6a4520 40%,#3a230c);box-shadow:0 3px 5px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,220,160,.35)}' +
    '.mn-asa::before,.mn-asa::after{content:"";position:absolute;top:-4px;width:16px;height:30px;border-radius:6px/10px;background:radial-gradient(ellipse at 40% 28%,#fff1c0 0 8%,#e2b860 22%,#a8781f 55%,#4e3409 100%);box-shadow:inset 0 0 0 1px rgba(60,35,5,.7),0 2px 3px #000}' +
    '.mn-asa::before{left:-6px}.mn-asa::after{right:-6px}' +
    '.mn-cab{flex:none;display:flex;align-items:center;gap:8px;margin-bottom:8px}' +
    '.mn-cab .ro-ansata{flex:1;min-width:0;height:40px;margin:0 22px 0 20px;font-size:17px;letter-spacing:.08em}' +
    '.mn-cerrar{flex:none;min-height:44px;padding:0 12px;color:var(--tinta);font:700 15px var(--serif,serif);border-radius:8px;border:1px solid rgba(60,35,10,.7);background:var(--fibras),linear-gradient(#f5e6bd,#e3cc94);box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 3px rgba(0,0,0,.2)}' +
    '.mn-lista{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 0 14px;display:flex;flex-direction:column;gap:8px;scrollbar-width:none}' +
    '.mn-lista::-webkit-scrollbar{display:none}' +
    '.mn-card{flex:none;border-radius:6px;border:1px solid rgba(60,35,10,.4);background:rgba(255,246,214,.35);overflow:clip}' +
    '.mn-card.abierta{background:rgba(255,246,214,.6);border-color:var(--minio,#9b2a1a)}' +
    '.mn-cab1{display:flex;align-items:center;gap:10px;width:100%;min-height:64px;padding:8px 10px;border:0;background:none;color:inherit;font:inherit;text-align:left}' +
    '.mn-ins{flex:none;width:56px;height:56px;box-sizing:border-box;border-radius:50%;display:grid;place-items:center;font-size:28px;line-height:1;background:radial-gradient(circle at 35% 30%,#4a3519,#1f160a);border:4px solid var(--bc,#b8862b);box-shadow:0 0 0 1px rgba(0,0,0,.6),inset 0 0 0 2px rgba(0,0,0,.6),0 2px 3px rgba(0,0,0,.4)}' +
    '.mn-cuerpo{flex:1;min-width:0}' +
    '.mn-l1{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap}' +
    '.mn-area{font:700 17px/1.2 var(--serif,serif);letter-spacing:.02em;color:var(--tinta)}' +
    '.mn-area small{font:400 14px var(--libro,serif);color:var(--tinta2);letter-spacing:0}' +
    '.mn-chipb{display:inline-flex;align-items:center;gap:5px;padding:2px 8px;border-radius:10px;font-size:13px;color:var(--tinta);background:rgba(255,250,230,.6);border:1px solid rgba(60,35,10,.35);white-space:nowrap}' +
    '.mn-pt{flex:none;width:10px;height:10px;border-radius:50%;box-shadow:0 0 0 1px rgba(60,35,10,.5)}' +
    '.mn-sin{font-size:14px;color:var(--tinta2);font-style:italic;margin-top:2px}' +
    '.mn-aviso{margin:0 10px 8px;font-size:14px;line-height:1.3;color:var(--minio,#9b2a1a);font-weight:700}' +
    '.mn-res{padding:0 10px 10px}' +
    '.mn-fila{display:flex;align-items:center;gap:8px}' +
    '.mn-fila .mn-txt{flex:1;min-width:0}' +
    '.mn-tit{font:700 15px/1.25 var(--serif,serif);color:var(--tinta)}' +
    '.mn-sub{font-size:13px;color:var(--tinta2)}' +
    '.mn-chs{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}' +
    '.mn-ch{display:inline-flex;align-items:center;gap:3px;padding:1px 7px;border-radius:10px;font:700 13px var(--libro,serif);color:var(--tinta);background:rgba(255,250,230,.7);border:1px solid rgba(60,35,10,.35)}' +
    '.mn-img{position:relative;flex:none;border-radius:8px;background:radial-gradient(circle at 50% 40%,#f6e9c4,#d4b87c);box-shadow:inset 0 0 0 1px rgba(60,35,10,.45);overflow:clip;display:grid;place-items:center}' +
    '.mn-img img{display:block;width:100%;height:100%;object-fit:contain}' +
    '.mn-img.med{border-radius:50%;background:radial-gradient(circle at 35% 30%,#4a3519,#1f160a);box-shadow:0 0 0 2px #b8862b,inset 0 0 0 2px rgba(0,0,0,.6);color:#f6e9c4;overflow:visible}' +
    '.mn-img.med .mn-sello{right:auto;left:50%;transform:translateX(-50%);bottom:-7px;white-space:nowrap}' +
    '.mn-img.oro{background:radial-gradient(circle at 50% 40%,#fff3c4,#e2b860 75%);box-shadow:0 0 0 2px #c99a2e,0 0 12px 3px rgba(233,192,99,.8),inset 0 0 0 1px rgba(255,255,255,.5)}' +
    '.mn-img.oro img{filter:saturate(1.25) brightness(1.08) drop-shadow(0 0 3px rgba(255,220,120,.9))}' +
    '.mn-img .bri{position:absolute;color:#fff7d0;font-size:12px;line-height:1;text-shadow:0 0 4px #e9c063;animation:mn-brilla 1.8s ease-in-out infinite}' +
    '.mn-sello{position:absolute;right:2px;bottom:2px;min-width:30px;padding:1px 5px;box-sizing:border-box;border-radius:10px;text-align:center;font:700 12px var(--serif,serif);color:#fbe9c7;background:linear-gradient(#b8321f,#6a140c);border:1px solid #4a0d08;box-shadow:0 1px 2px rgba(0,0,0,.5)}' +
    '.mn-img.oro .mn-sello{background:linear-gradient(#e9c063,#a8781f);color:#2b1c0a;border-color:#6a4a18}' +
    '.mn-flecha{flex:none;font-size:22px;color:var(--minio,#9b2a1a);font-weight:700}' +
    '.mn-grande{display:flex;align-items:center;justify-content:center;gap:10px;margin:2px 0 8px}' +
    '.mn-barra{height:7px;margin-top:6px;border-radius:4px;background:rgba(60,35,10,.18);box-shadow:inset 0 1px 1px rgba(60,35,10,.35);overflow:clip}' +
    '.mn-barra i{display:block;height:100%;background:linear-gradient(90deg,#5f7d2e,var(--oliva))}' +
    '.mn-quedan{font-size:13px;color:var(--tinta2);margin-top:3px}' +
    '.mn-prop{margin:0 10px 10px;padding:8px 10px;border-radius:6px;border:1px dashed rgba(60,35,10,.55);background:rgba(255,250,230,.45)}' +
    '.mn-prop>b{display:block;color:var(--minio,#9b2a1a);font:700 13px var(--serif,serif);letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}' +
    '.mn-bots{display:flex;gap:8px;margin-top:8px}' +
    '.mn-b{flex:1;min-width:0;min-height:44px;padding:4px 8px;border-radius:8px;font:700 15px var(--serif,serif);letter-spacing:.03em;color:var(--tinta);border:1px solid rgba(60,35,10,.7);background:var(--fibras),linear-gradient(#f5e6bd,#e3cc94);box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 3px rgba(0,0,0,.2)}' +
    '.mn-b.sello{color:#fbe9c7;text-shadow:0 1px 0 rgba(0,0,0,.5);border:1px solid #6e130d;background:radial-gradient(ellipse at 30% 0%,rgba(255,190,160,.3),transparent 60%),linear-gradient(#b8321f,#7e1910 70%,#6a140c);box-shadow:0 0 0 2px #6a4a18,0 0 0 3px rgba(233,192,99,.55),0 3px 8px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,220,200,.4)}' +
    '.mn-b.bronce{color:#ecd9a8;border:1px solid #7a5a1f;background:radial-gradient(ellipse at 50% 0%,rgba(233,192,99,.22),transparent 70%),linear-gradient(#3e2e16,#1f160a);box-shadow:inset 0 0 0 1px rgba(0,0,0,.6),inset 0 0 0 3px rgba(184,134,43,.28),0 2px 4px rgba(0,0,0,.4)}' +
    '.mn-det{padding:8px 10px 10px;border-top:1px solid rgba(60,35,10,.25)}' +
    '.mn-det .mn-bots{margin-top:0}' +
    '.mn-cont{margin-top:8px;font-size:13px;color:var(--tinta2)}' +
    '.mn-cont b{color:var(--tinta)}' +
    '.mn-rej{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}' +
    '.mn-rej h4{grid-column:1/-1;margin:4px 0 0;font:700 13px var(--serif,serif);letter-spacing:.08em;text-transform:uppercase;color:var(--minio,#9b2a1a)}' +
    '.mn-o{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:0;min-height:44px;padding:6px;text-align:center;border-radius:8px;font:inherit;color:var(--tinta);border:1px solid rgba(60,35,10,.55);background:var(--fibras),linear-gradient(#f5e6bd,#e3cc94);box-shadow:inset 0 1px 0 rgba(255,250,230,.8),0 2px 3px rgba(0,0,0,.25)}' +
    '.mn-o .mn-img{width:100%;height:72px}' +
    '.mn-o .mn-img.med{width:72px;border-radius:50%;font-size:34px}' +
    '.mn-o .n{font:700 14px/1.2 var(--serif,serif)}' +
    '.mn-o .d{font-size:13px;color:var(--tinta2)}' +
    '.mn-o.no{filter:grayscale(1);opacity:.65;box-shadow:none}' +
    '.mn-o .m{font-size:13px;line-height:1.2;font-weight:700;color:var(--minio,#9b2a1a)}' +
    '.mn-err{margin-top:6px;font-size:14px;font-weight:700;color:var(--minio,#9b2a1a)}' +
    '.mn-vacio{font-size:14px;color:var(--tinta2);padding:6px 0}';

  const meter = () => { if (document.getElementById('ministros-ui-css')) return; const st = document.createElement('style'); st.id = 'ministros-ui-css'; st.textContent = CSS; document.head.appendChild(st); };

  const U = { s: null, op: null, el: null, abierta: null, lista: null, err: {} };

  /* ---- candidatos para «Encargar» ---- */
  const ciudadMayor = s => Object.keys(s.cities).filter(id => s.cities[id].owner === 'roma').sort((a, b) => (s.cities[b].pop || 0) - (s.cities[a].pop || 0) || (a < b ? -1 : 1))[0];
  const frase = (s, e) => {
    const c = e.ciudad ? nomC(e.ciudad) : '';
    switch (e.tipo) {
      case 'nivel': return 'Subir ' + nomB(e.b) + ' a nivel ' + e.objetivo + ' en ' + c;
      case 'tropas': return 'Reclutar ' + e.n + ' ' + nomU(e.u) + ' en ' + c;
      case 'saber': return 'Investigar ' + ((D().INVEST[e.saber] && D().INVEST[e.saber].n) || e.saber);
      case 'impuesto': return 'Poner impuestos ' + (IMP[e.nivel] || e.nivel) + ' en ' + c;
      case 'reserva': return 'Reunir ' + e.objetivo + ' de ' + (RECURSO[e.recurso] || e.recurso);
      case 'acto': return 'Pedir ' + e.n + ' acto: ' + (ACTO[e.acto] || e.acto);
    }
    return '';
  };
  const candidatos = (s, f) => {
    const d = D(), cid = ciudadMayor(s), c = cid ? s.cities[cid] : null, out = [];
    if (!c) return out;
    for (const t of f.tipos) {
      if (t === 'nivel') f.edificios.filter(b => d.BUILD[b]).forEach(b => out.push({ tipo: 'nivel', ciudad: cid, b, objetivo: ((c.b && c.b[b]) || 0) + 1 }));
      if (t === 'tropas') ['hastati', 'principes', 'triarii', 'velites', 'equites'].filter(u => d.UNITS[u]).forEach(u => out.push({ tipo: 'tropas', ciudad: cid, u, n: 100 }));
      if (t === 'saber') {
        const h = (s.inv && s.inv.hechas) || {}, ed = (s.inv && s.inv.edad) || 1, coste = i => { let n = 0; for (const k in (i.cost || {})) n += i.cost[k] || 0; return n; };
        Object.keys(d.INVEST).filter(id => !h[id] && (d.INVEST[id].edad || 1) <= ed).sort((a, b) => coste(d.INVEST[a]) - coste(d.INVEST[b]) || (a < b ? -1 : 1)).slice(0, 6).forEach(id => out.push({ tipo: 'saber', saber: id }));
      }
      if (t === 'impuesto') Object.keys(d.IMPUESTOS).filter(n => n !== (c.imp || 'normal')).forEach(n => out.push({ tipo: 'impuesto', ciudad: cid, nivel: n }));
      if (t === 'reserva') ['grano', 'denarios', 'materiales', 'hierro'].forEach(r => out.push({ tipo: 'reserva', recurso: r, objetivo: Math.ceil((s.res && s.res[r]) || 0) + 300 }));
      if (t === 'acto') (f.actos || []).forEach(a => out.push({ tipo: 'acto', acto: a, n: 1 }));
    }
    return out;
  };
  /* ¿vale? se prueba sobre una copia profunda; no toca la partida */
  const motivoDe = (s, mid, e) => {
    const copia = JSON.parse(JSON.stringify(s));
    const r = M().encargar(copia, mid, Object.assign({}, e), U.op.mes);
    return r.ok ? '' : (r.motivo || 'No se puede');
  };

  /* ---- imágenes: reales si el juego las da; si no, icono grande en medallón ---- */
  const IC = { grano: '🌾', denarios: '🪙', materiales: '🪵', hierro: '⛏', hombres: '👥' };
  const ICACTO = { juegos: '🏟️', ofrenda: '🔥', ruta: '⛵', leva: '🪖', grano: '🌾' };
  const FACTO = { juegos: 'Celebrar unos juegos', ofrenda: 'Hacer una ofrenda', ruta: 'Abrir una ruta de comercio', leva: 'Hacer una leva', grano: 'Repartir grano' };
  const imgDe = (k, id) => { const f = U.op && U.op.imagenes && U.op.imagenes[k]; let u = ''; try { u = f ? f(id) || '' : ''; } catch (e) { u = ''; } return u; };
  /* caja de imagen: url real o emoji grande; px = lado; extra = clases; sello = texto del sello */
  const caja = (url, emoji, px, extra, sello, brillo) => {
    let h = '<span class="mn-img' + (url ? '' : ' med') + (extra ? ' ' + extra : '') + '" style="width:' + px + 'px;height:' + px + 'px;font-size:' + Math.round(px * 0.5) + 'px">' + (url ? '<img alt="" src="' + esc(url) + '">' : esc(emoji));
    if (brillo) h += '<span class="bri" style="left:6px;top:4px">✦</span><span class="bri" style="right:8px;top:12px;animation-delay:.6s">✦</span><span class="bri" style="left:14px;bottom:10px;animation-delay:1.1s">✧</span>';
    if (sello) h += '<span class="mn-sello">' + esc(sello) + '</span>';
    return h + '</span>';
  };
  const chips = o => { let h = ''; for (const k of ['hombres', 'grano', 'denarios', 'materiales', 'hierro']) if (o && o[k] > 0) h += '<span class="mn-ch">' + IC[k] + ' ' + Math.round(o[k]) + '</span>'; return h ? '<div class="mn-chs">' + h + '</div>' : ''; };
  const costeNivel = (b, L) => { try { return U.op.coste ? U.op.coste(b, L) : null; } catch (e) { return null; } };
  /* ficha visual de un encargo o propuesta e. grande = ficha abierta (imágenes mayores) */
  const visual = (s, e, grande) => {
    const px = grande ? 72 : 46, px2 = grande ? 84 : 52;
    const c = e.ciudad ? nomC(e.ciudad) : '';
    if (e.tipo === 'nivel') {
      const L = e.objetivo - 1, u = imgDe('edificio', e.b), em = (D().BUILD[e.b] && D().BUILD[e.b].i) || '🏛️';
      const fi = caja(u, em, px, '', L > 0 ? 'Nv ' + L : 'Nuevo') + '<span class="mn-flecha">➜</span>' + caja(u, em, px2, 'oro', 'Nv ' + e.objetivo, true);
      return { fi, tit: nomB(e.b) + ' · ' + c, sub: 'Nivel ' + L + ' ➜ ' + e.objetivo, ch: chips(costeNivel(e.b, L)) };
    }
    if (e.tipo === 'tropas') {
      const u = imgDe('unidad', e.u), n = (e.objetivo - (e.base || 0)) || e.n || 0, k = M().costeTropas(D(), e.u, n);
      return { fi: caja(u, (D().UNITS[e.u] && D().UNITS[e.u].g) || '⚔', px2, '', '×' + n), tit: nomU(e.u) + ' · ' + c, sub: 'Reclutar', ch: chips(k) };
    }
    if (e.tipo === 'saber') return { fi: caja('', '📜', px2, ''), tit: (D().INVEST[e.saber] && D().INVEST[e.saber].n) || e.saber, sub: 'Investigar', ch: '' };
    if (e.tipo === 'reserva') {
      const cur = Math.floor((s.res && s.res[e.recurso]) || 0), p = Math.max(0, Math.min(100, Math.round(100 * cur / e.objetivo)));
      return { fi: caja('', IC[e.recurso] || '📦', px2, ''), tit: 'Reunir ' + (RECURSO[e.recurso] || e.recurso), sub: cur + ' / ' + e.objetivo, ch: '', mini: '<div class="mn-barra"><i style="width:' + p + '%"></i></div>' };
    }
    if (e.tipo === 'acto') return { fi: caja('', ICACTO[e.acto] || '🏛️', px2, ''), tit: FACTO[e.acto] || 'Hacer un acto', sub: '', ch: '' };
    if (e.tipo === 'impuesto') return { fi: caja('', '🪙', px2, ''), tit: 'Impuestos ' + (IMP[e.nivel] || e.nivel), sub: c, ch: '' };
    return { fi: '', tit: e.texto || '', sub: '', ch: '' };
  };
  const ficha = (s, e, grande) => {
    const v = visual(s, e, grande);
    if (grande) return '<div class="mn-grande">' + v.fi + '</div><div class="mn-tit" style="text-align:center">' + txt(v.tit) + '</div>' + (v.sub ? '<div class="mn-sub" style="text-align:center">' + txt(v.sub) + '</div>' : '') + (v.ch ? v.ch.replace('mn-chs', 'mn-chs" style="justify-content:center') : '') + (v.mini || '');
    return '<div class="mn-fila">' + v.fi + '<div class="mn-txt"><div class="mn-tit">' + txt(v.tit) + '</div>' + (v.sub ? '<div class="mn-sub">' + txt(v.sub) + '</div>' : '') + v.ch + '</div></div>' + (v.mini || '');
  };

  /* ---- pintado ---- */
  const tarjeta = (s, f, st) => {
    const D0 = D(), B = f.bando ? D0.BANDOS[f.bando] : null, ab = U.abierta === f.id, enc = s.ministros.encargos[f.id], pro = s.ministros.propuestas[f.id];
    let h = '<div class="mn-card' + (ab ? ' abierta' : '') + '" data-mid="' + f.id + '">';
    h += '<button class="mn-cab1" data-acc="abrir" data-mid="' + f.id + '" aria-expanded="' + ab + '"><span class="mn-ins" style="--bc:' + (B ? esc(B.col) : '#b8862b') + '">' + esc(f.i) + '</span><span class="mn-cuerpo">';
    h += '<div class="mn-l1"><span class="mn-area">' + txt(f.area) + ' <small>· ' + txt(f.cargo) + '</small></span><span class="mn-chipb">' + (B ? '<span class="mn-pt" style="background:' + esc(B.col) + '"></span>' + txt(B.n) : 'Sin bando') + '</span></div>';
    if (!enc && !pro) h += '<div class="mn-sin">Sin encargo</div>';
    h += '</span></button>';
    if (st.aviso) h += '<div class="mn-aviso">⚠ ' + txt(st.aviso) + '</div>';
    if (enc && st.encargo) {
      const p = Math.round(st.encargo.progreso * 100), q = st.encargo.plazoEst;
      h += '<div class="mn-res">' + ficha(s, enc, ab) + '<div class="mn-barra"><i style="width:' + p + '%"></i></div><div class="mn-quedan">' + p + ' % · ' + (q > 1 ? 'quedan ' + q + ' estaciones' : q === 1 ? 'queda 1 estación' : 'último plazo') + '</div></div>';
    }
    if (pro) h += '<div class="mn-prop"><b>Propone</b>' + ficha(s, pro, ab) + '<div class="mn-bots"><button class="mn-b sello" data-acc="aceptar" data-mid="' + f.id + '">Aceptar</button><button class="mn-b" data-acc="descartar" data-mid="' + f.id + '">Descartar</button></div></div>';
    if (ab) {
      h += '<div class="mn-det"><div class="mn-bots"><button class="mn-b bronce" data-acc="encargar" data-mid="' + f.id + '">' + (U.lista === f.id ? 'Cerrar la lista' : 'Encargar') + '</button>' + (enc ? '<button class="mn-b" data-acc="cancelar" data-mid="' + f.id + '">Cancelar encargo</button>' : '') + '</div>';
      h += '<div class="mn-cont">' + (st.familia ? 'Familia ' + txt(st.familia) + ' · ' : '') + 'Cumplidos <b>' + st.hechos + '</b> · Fallidos <b>' + st.fallos + '</b></div>';
      if (U.err[f.id]) h += '<div class="mn-err">' + txt(U.err[f.id]) + '</div>';
      if (U.lista === f.id) h += lista(s, f);
      h += '</div>';
    }
    return h + '</div>';
  };
  /* baldosa de la rejilla de Encargar */
  const baldosa = (s, e) => {
    const c = ciudadMayor(s), cs = c ? s.cities[c] : null;
    if (e.tipo === 'nivel') { const L = e.objetivo - 1; return { im: caja(imgDe('edificio', e.b), (D().BUILD[e.b] && D().BUILD[e.b].i) || '🏛️', 72, ''), n: nomB(e.b), d: 'Nv ' + L + ' ➜ ' + e.objetivo }; }
    if (e.tipo === 'tropas') return { im: caja(imgDe('unidad', e.u), (D().UNITS[e.u] && D().UNITS[e.u].g) || '⚔', 72, ''), n: nomU(e.u), d: '×' + e.n };
    if (e.tipo === 'saber') return { im: caja('', '📜', 72, ''), n: (D().INVEST[e.saber] && D().INVEST[e.saber].n) || e.saber, d: 'Investigar' };
    if (e.tipo === 'impuesto') return { im: caja('', '🪙', 72, ''), n: 'Impuestos ' + (IMP[e.nivel] || e.nivel), d: cs ? nomC(c) : '' };
    if (e.tipo === 'reserva') return { im: caja('', IC[e.recurso] || '📦', 72, ''), n: 'Reunir ' + (RECURSO[e.recurso] || e.recurso), d: e.objetivo + '' };
    return { im: caja('', ICACTO[e.acto] || '🏛️', 72, ''), n: FACTO[e.acto] || 'Hacer un acto', d: '' };
  };
  const lista = (s, f) => {
    const cs = candidatos(s, f); if (!cs.length) return '<div class="mn-vacio">No hay nada que encargar ahora.</div>';
    let h = '<div class="mn-rej">', ult = '';
    const TIT = { nivel: 'Obras', tropas: 'Tropas', saber: 'Saberes', impuesto: 'Impuestos', reserva: 'Reservas', acto: 'Actos' };
    cs.forEach((e, i) => {
      if (e.tipo !== ult) { h += '<h4>' + TIT[e.tipo] + '</h4>'; ult = e.tipo; }
      const mot = motivoDe(s, f.id, e), t = baldosa(s, e);
      h += '<button class="mn-o' + (mot ? ' no' : '') + '" data-acc="elegir" data-mid="' + f.id + '" data-i="' + i + '"' + (mot ? ' aria-disabled="true"' : '') + '>' + t.im + '<span class="n">' + txt(t.n) + '</span>' + (mot ? '<span class="m">' + txt(mot) + '</span>' : (t.d ? '<span class="d">' + txt(t.d) + '</span>' : '')) + '</button>';
    });
    return h + '</div>';
  };

  const pintar = () => {
    if (!U.el || !U.s) return;
    const s = U.s, est = M().estado(s, U.op.mes), lista0 = U.el.querySelector('.mn-lista'), y = lista0 ? lista0.scrollTop : 0;
    let h = '<div class="mn-hoja" role="dialog" aria-label="Tus ministros"><div class="mn-asa"></div><div class="mn-cab"><h2 class="ro-ansata" style="margin:0 22px 0 20px">Tus ministros</h2><button class="mn-cerrar" data-acc="cerrar">Cerrar</button></div><div class="mn-lista">';
    est.forEach(st => { h += tarjeta(s, M().DATOS.find(x => x.id === st.id), st); });
    h += '</div></div>';
    U.el.innerHTML = h;
    const n = U.el.querySelector('.mn-lista'); if (n) n.scrollTop = y;
  };

  /* sube la tarjeta abierta al principio de la lista, para ver su lista de encargos */
  const verAbierta = () => { const l = U.el && U.el.querySelector('.mn-lista'), c = l && l.querySelector('.mn-card.abierta'); if (c) l.scrollTop = c.offsetTop - l.offsetTop - 4; };
  const cambio = () => { pintar(); if (U.op.alCambiar) U.op.alCambiar(U.s); };
  const clic = ev => {
    const b = ev.target.closest('[data-acc]'); if (!b || !U.el.contains(b)) return;
    const acc = b.dataset.acc, mid = b.dataset.mid, s = U.s, m = M();
    if (acc === 'cerrar') return cerrar();
    if (acc === 'abrir') { U.abierta = U.abierta === mid ? null : mid; U.lista = null; U.err = {}; pintar(); return verAbierta(); }
    if (acc === 'encargar') { U.lista = U.lista === mid ? null : mid; U.err = {}; pintar(); return verAbierta(); }
    if (acc === 'aceptar') { const r = m.aceptar(s, mid, U.op.mes); if (!r.ok) { U.err[mid] = r.motivo; U.abierta = mid; return pintar(); } U.err = {}; return cambio(); }
    if (acc === 'descartar') { m.migrar(s); s.ministros.propuestas[mid] = null; return cambio(); }
    if (acc === 'cancelar') { m.cancelar(s, mid); U.lista = null; return cambio(); }
    if (acc === 'elegir') {
      const e = candidatos(s, m.DATOS.find(x => x.id === mid))[+b.dataset.i];
      const r = e ? m.encargar(s, mid, e, U.op.mes) : { ok: false, motivo: 'Ya no está disponible' };
      if (!r.ok) { U.err[mid] = r.motivo; return pintar(); }
      U.lista = null; U.err = {}; return cambio();
    }
  };

  const abrir = (s, op) => {
    meter(); cerrar();
    U.s = s; U.op = Object.assign({ mes: Math.floor((s.t || 0) + 1e-9) }, op || {}); U.abierta = null; U.lista = null; U.err = {};
    M().migrar(s);
    U.el = document.createElement('div'); U.el.className = 'mn-fondo'; U.el.id = 'mn-fondo';
    (U.op.contenedor || document.body).appendChild(U.el);
    U.el.addEventListener('click', clic);
    pintar();
  };
  const cerrar = () => { if (U.el) { U.el.remove(); U.el = null; } };
  const api = { abrir, cerrar, pintar, abre: id => { U.abierta = id; U.lista = null; pintar(); verAbierta(); }, lista: id => { U.abierta = id; U.lista = id; pintar(); verAbierta(); }, nombreVisible: vis };
  root.MINISTROS_UI = api;
})(typeof window !== 'undefined' ? window : globalThis);
