/* Maqueta N1b: dibuja la interfaz nueva encima del 3D real. HUD.render('plan'|'ejec'|'informe', datos) */
(() => {
  const P = {
    aguantar: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z', avanzar: 'M6 12l6-6 6 6M6 19l6-6 6 6', cargar: 'M4 20L17 7M12 5h7v7M6 14l4 4',
    hostigar: 'M7 4c6 3 6 13 0 16M7 12h13M16 9l4 3-4 3', relevar: 'M4 8h14l-3-3M20 16H6l3 3', retirarse: 'M10 6l-6 6 6 6M4 12h10c4 0 6 2 6 6',
    arenga: 'M4 10v4h3l7 4V6L7 10zM17 9c1.6 1.2 1.6 4.8 0 6M19.5 7c3 2.5 3 7.5 0 10', paso: 'M5 17c2-1 3-3 3-6M12 18c2-1 3-3 3-6M8 7l0 .01M15 6l0 .01M4 20h6M11 21h6',
    finge: 'M5 18c0-7 5-10 13-9M14 5l4 4-4 4', casco: 'M4 16a8 8 0 0116 0v3H4zM12 8V4M9 19v-3h6v3', ojo: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6',
    reloj: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2', play: 'M7 5l12 7-12 7z', flecha: 'M4 12h14M13 7l5 5-5 5', cuidado: 'M12 3l10 18H2zM12 10v5M12 18v.01',
    cruz: 'M5 19L19 5M14 5h5v5', bandera: 'M6 21V4M6 5h12l-3 4 3 4H6', atras: 'M4 12h14M9 7l-5 5 5 5', espada: 'M5 19l11-11M14 4h6v6M4 20l3-1-2-2z'
  };
  const ic = n => '<svg class="ico" viewBox="0 0 24 24"><path d="' + P[n] + '"/></svg>';
  const $ = s => document.querySelector(s);
  let root; const mk = () => { if (!root) { root = document.createElement('div'); root.id = 'hud'; document.body.appendChild(root); } return root; };
  const V = () => UI.battle.view;
  function proj(x, y, lift) { // campo -> pantalla (px CSS)
    const v = V(), w = v.toW(x, y), p = v.cam.position.clone(); v.cam.updateMatrixWorld(true);
    p.set(w[0], v.h(w[0], w[1]) + (lift || 0.2), w[1]).project(v.cam); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight, p.z];
  }
  const NOM = { hastati: 'Hastati', principes: 'Príncipes', triarii: 'Triarios', velites: 'Vélites', equites: 'Équites', libios: 'Libios', iberos: 'Íberos', honderos: 'Honderos', numidas: 'Númidas', elefantes: 'Elefantes', general: 'General' };
  const AB = { hastati: 'Hast.', principes: 'Prínc.', triarii: 'Triar.', velites: 'Vélit.', equites: 'Équit.' };
  const nombres = regs => { const c = {}; return new Map(regs.map(r => { c[r.k] = (c[r.k] || 0) + 1; return [r, (AB[r.k] || r.k) + (regs.filter(q => q.k === r.k).length > 1 ? ' ' + ['I', 'II', 'III', 'IV'][c[r.k] - 1] : '')]; })); };
  const coh = r => { const m = r.mor / r.morMax; return m > .66 ? [4, 'Firme'] : m > .4 ? [3, 'Vacilante'] : m > .2 ? [2, 'Desordenado'] : [1, 'Huye']; };
  const can = r => r.fat < 30 ? [0, 'Fresco'] : r.fat < 60 ? [1, 'Cansado'] : [2, 'Agotado'];
  const curva = (a, b, k) => { const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * k, my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * k; return t => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * my + t * t * b[1]]; };
  function flecha(a, b, k, col, op, dash) { // flecha curva en el suelo, devuelve svg y punto medio en pantalla
    const f = curva(a, b, k), pts = []; for (let i = 0; i <= 16; i++) { const q = proj(...f(i / 16)); pts.push(q); }
    const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(''), e = pts[16], s = pts[13], an = Math.atan2(e[1] - s[1], e[0] - s[0]), L = 11;
    const h = [[e[0], e[1]], [e[0] - L * Math.cos(an - .45), e[1] - L * Math.sin(an - .45)], [e[0] - L * Math.cos(an + .45), e[1] - L * Math.sin(an + .45)]].map(q => q.map(n => n.toFixed(1)).join(',')).join(' ');
    return { svg: '<path d="' + d + '" fill="none" stroke="#000" stroke-opacity=".45" stroke-width="7" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-opacity="' + op + '" stroke-width="3.6" stroke-linecap="round"' + (dash ? ' stroke-dasharray="1 7"' : '') + '/><polygon points="' + h + '" fill="' + col + '" fill-opacity="' + Math.min(1, op + .1) + '" stroke="#000" stroke-opacity=".4"/>', mid: pts[8] };
  }
  function ghost(x, y, col) { // sombra: silueta tenue donde acabará el regimiento
    const c = [[-26, -8], [26, -8], [26, 8], [-26, 8]].map(o => proj(x + o[0], y + o[1])), d = 'M' + c.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
    return '<path d="' + d + '" fill="' + col + '" fill-opacity=".16" stroke="' + col + '" stroke-opacity=".85" stroke-width="1.6" stroke-dasharray="4 3"/>';
  }
  function aro(x, y, R, col) {
    const pts = []; for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2; pts.push(proj(x + Math.cos(a) * R, y + Math.sin(a) * R)); }
    const d = 'M' + pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
    return '<path d="' + d + '" fill="' + col + '" fill-opacity=".05" stroke="' + col + '" stroke-opacity=".5" stroke-width="2"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-opacity=".28" stroke-width="7"/>';
  }
  const sup = (tit, extra) => '<div class="abs cristal sup"><div class="gen">' + ic('casco') + '</div><div><small>General</small><div class="gn">Cónsul</div></div>' + tit + extra + '</div>';
  function plan(ctx) {
    const b = UI.battle.b, mios = b.regs.filter(r => r.side === 0 && r.st === 'ok'), ene = b.regs.filter(r => r.side === 1 && r.st === 'ok'), nm = nombres(mios), gen = mios.find(r => r.k === 'general');
    const uni = mios.filter(r => r !== gen); const dem = r => (r.k === 'hastati' && nm.get(r).endsWith(' II')) ? [3, 'Vacilante'] : coh(r), dem2 = r => r.k === 'equites' ? [2, 'Agotado'] : (r.k === 'hastati' && nm.get(r).endsWith(' II')) ? [1, 'Cansado'] : can(r); let svg = '', htm = '';
    if (gen) svg += aro(gen.x, gen.y, 105, '#e0b455');
    const sel = uni.find(r => r.k === 'principes') || uni[1], ord = [[uni.find(r => r.k === 'hastati'), -70, 8, 'Avanzar'], [sel, 40, -50, 'Cargar'], [uni.find(r => r.k === 'equites'), 60, -110, 'Hostigar']].filter(o => o[0]);
    for (const [r, dx, dy, et] of ord) {
      const fx = r.x + dx, fy = r.y - Math.abs(dy) * (dy < 0 ? 1 : 1) * 1.0 - 40;
      svg += ghost(fx, fy, '#e0b455'); const f = flecha([r.x, r.y], [fx, fy], r === sel ? .1 : -.12, '#e8c25f', .95);
      svg += f.svg; htm += '<div class="etq o" style="left:' + f.mid[0] + 'px;top:' + f.mid[1] + 'px">' + et + '</div>';
    }
    const cercanos = ene.filter(r => r.k !== 'general').slice(0, 2);
    cercanos.forEach((e, i) => { const f = flecha([e.x, e.y], [e.x + (i ? 50 : -30), e.y + 55], i ? .1 : -.1, '#e0483c', .62, true); svg += f.svg;
      if (!i) htm += '<div class="etq r" style="left:' + f.mid[0] + 'px;top:' + (f.mid[1] - 12) + 'px">Exploradores: lo ven venir</div>'; });
    for (const r of mios) {
      if (r === gen) continue; const p = proj(r.x, r.y, r.u.cls === 'cav' ? 5 : 4), [c, cn] = dem(r), [f] = dem2(r);
      htm += '<div class="est f' + c + (r === sel ? ' sel' : '') + '" style="left:' + p[0].toFixed(0) + 'px;top:' + (p[1] - 2).toFixed(0) + 'px"><div class="fi"><div class="mc">' + [1, 2, 3, 4].map(i => '<b class="' + (i <= c ? 'on' : '') + '"></b>').join('') + '</div><i class="ca c' + f + '"></i></div></div>';
    }
    const [c, cn] = dem(sel), [f, fn] = dem2(sel), col = ['#9fcf5a', '#e2c24a', '#e08a3c', '#e0483c'][4 - c];
    const bt = (n, t, on) => '<button class="btn' + (on ? ' on' : '') + '">' + ic(n) + t + '</button>';
    const carta = (n, t) => '<button class="btn carta" title="' + t + '">' + ic(n) + '</button>';
    return '<svg class="suelo">' + svg + '</svg>' + htm +
      sup('<div class="ronda">RONDA ' + ctx.ronda + '</div><div class="fase">PLAN</div><div><small>Puntos de mando</small><div class="sellos">' + [1, 2, 3, 4, 5].map(i => '<i class="' + (i <= 3 ? 'on' : '') + '"></i>').join('') + '<span style="margin-left:5px;font-size:12px">3 de 5</span></div></div>', '') +
      '<div class="abs cristal linea"><b class="cin">' + nm.get(sel) + '</b><i></i><span style="color:' + col + '">' + cn + '</span><i></i>' + fn + '<i></i>Cargar a Libios II<i></i>Si le cargan: aguantar<button class="btn mini" title="Prever choque">' + ic('ojo') + '</button></div>' +
      '<div class="abs cristal ord">' + bt('aguantar', 'Aguantar') + bt('avanzar', 'Avanzar') + bt('cargar', 'Cargar', 1) + bt('hostigar', 'Hostigar') + bt('relevar', 'Relevar') + bt('retirarse', 'Retirarse') + '</div>' +
      '<div class="abs cartas">' + carta('arenga', 'Arenga') + carta('paso', 'Paso doble') + carta('finge', 'Retirada fingida') + '</div>' +
      '<button class="abs btn ver">' + ic('play') + 'Ver la ronda</button>';
  }
  function ejec(ctx) {
    const b = UI.battle.b, luch = b.regs.filter(r => r.st === 'ok' && r.fight > 0 && r.k !== 'general'), usados = new Set(); let htm = '';
    const pide = (fn, cls, txt) => { const r = luch.filter(q => !usados.has(q)).find(fn) || null; if (!r) return; usados.add(r); const p = proj(r.x, r.y, 7); htm += '<div class="aviso ' + cls + '" style="left:' + p[0].toFixed(0) + 'px;top:' + (p[1] - 4).toFixed(0) + 'px">' + txt + '</div>'; };
    pide(r => r.side === 0 && r.charge > 0, 'a', 'Carga'); pide(r => r.flank > 0, 'b', '¡Flanco!'); pide(r => r.side === 1, 'c', 'Vacilan');
    const s = ctx.seg;
    return htm + '<div class="abs cristal tiempo"><div class="tt"><span>RONDA ' + ctx.ronda + ' · EJECUCIÓN</span><span><b>' + s + '</b> de 20 s</span></div><div class="bar"><i style="width:' + s / 20 * 100 + '%"></i></div><div class="mir">' + ic('ojo') + 'Mirando: choque del centro</div></div>';
  }
  function informe(ctx) {
    const b = UI.battle.b, m0 = b.men(0), m1 = b.men(1), a0 = ctx.antes[0], a1 = ctx.antes[1];
    const col = (n, nom, m, a, c) => '<div class="baja"><div class="nb" style="color:' + c + '">' + nom + '<i>quedan ' + m + '</i></div><div class="num"><b>' + m + '</b> hombres ' + (a > m ? '<em>−' + (a - m) + '</em> bajas' : '<em style="color:var(--oliva)">sin bajas</em>') + '</div><div class="bar"><i style="width:' + Math.round(m / a * 100) + '%;background:' + c + '"></i></div></div>';
    const h = (i, t) => '<li>' + ic(i) + t + '</li>';
    return '<div class="vel"></div><div class="abs cristal inf"><h2><small>Fin de la ronda</small>Ronda ' + ctx.ronda + ' · Lo que pasó</h2><div class="fil2"></div><div class="bajas">' + col(0, 'Roma', m0, a0, '#e0675a') + col(1, 'Cartago', m1, a1, '#a98ae0') + '</div>' +
      '<ul class="hechos">' + h('cuidado', 'Hastati II pasa a Vacilante.') + h('flecha', 'El enemigo manda su reserva a tu ala izquierda.') + '</ul>' +
      '<div class="cons"><b>LUGARTENIENTE</b> · Releva a los hastati antes de que huyan; los príncipes están frescos.</div>' +
      '<div class="acc"><button class="btn">' + ic('reloj') + 'Repetir lo visto</button><button class="btn gr">Planear ronda ' + (ctx.ronda + 1) + '</button></div></div>';
  }
  window.HUD = { render(modo, ctx) { mk().innerHTML = { plan, ejec, informe }[modo](ctx); } };
})();
