/* AQVILA — NB3: pantalla 2D del choque (solo dibuja; la lógica es js/batalla2.js).
   Uso: UIBatalla2.abrir(cfg, alTerminar). cfg = lo de Batalla2.crear, o { estado } para seguir una batalla guardada.
   alTerminar(resultado): { ganador, victoria, motivo, t, bajas: [{ id, bando, tipo, nombre, n0, n, bajas, huyo, vet }], bajasTotal: [roma, enemigo],
                            general: { vivo, n } | null, prisioneros, estado }.
   Ganchos para el 3D (NB4): <div id="b2-3d"> (contenedor del canvas, detrás de los estandartes) y el callback
   UIBatalla2.alSuceso(sucesos, estado), que recibe la lista de sucesos de cada pulso (lugar, objetivo, reg, txt...).
   Ajustes de prueba: UIBatalla2.ritmo = milisegundos reales por pulso a ×1 (2000 por defecto).
   Idea de pantalla: más campo y menos marco. Una línea arriba; en directo no hay panel abajo; en pausa sale un panel compacto. */
(function (root) {
  'use strict';
  const B = () => root.Batalla2;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => Math.round(n).toLocaleString('es-ES');
  const mmss = t => Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2);
  const SECT = ['ALA IZQ.', 'CENTRO', 'ALA DER.'];
  const ANIMO_C = ['#8fae5a', '#e9c063', '#d9764a', '#9aa6b4'];   /* borde por ánimo: Firme, Vacilante, Desordenado, Huye */
  const ANIMO_N = ['Firme', 'Vacilante', 'Desordenado', 'Huye'];
  const VET_N = ['bisoños', 'normales', 'veteranos'];
  const TELA = ['#c0281f', '#5b3a8c'];
  const MARF = '#f1ead9', ORO = '#e9c063', BRO = '#b8862b', NOCHE = '#0b1016';
  const ORD6 = [['aguantar', 'Aguantar', 'gratis'], ['avanzar', 'Avanzar', 'mando 1'], ['cargar', 'Cargar', 'mando 1'], ['hostigar', 'Hostigar', 'mando 1'], ['relevar', 'Relevar', 'mando 2'], ['retirarse', 'Retirarse', 'mando 1']];
  const AJUSTES = ['todas', 'graves', 'ninguna'], AJ_N = { todas: 'Pausas: todas', graves: 'Pausas: graves', ninguna: 'Pausas: nunca' };
  let S = null;

  /* ---------- el estandarte (ficha de regimiento) ---------- */
  function pilum(x, y0, y1, w) { return '<path d="M' + x + ' ' + y0 + 'l-3 6h6z" fill="' + MARF + '"/><path d="M' + x + ' ' + (y0 + 5) + 'V' + y1 + '" stroke="' + MARF + '" stroke-width="' + (w || 2.2) + '" stroke-linecap="round"/>'; }
  function emblema(tipo, cls, col) {
    if (cls === 'gen') return '<circle cx="18" cy="30" r="10" fill="none" stroke="' + MARF + '" stroke-width="2.4" stroke-dasharray="3.2 2.2"/><path d="M18 22l2.3 5.8 6.2.2-4.9 3.8 1.7 6-5.3-3.5-5.3 3.5 1.7-6-4.9-3.8 6.2-.2z" fill="' + MARF + '"/>';
    if (cls === 'ele') return '<circle cx="10.5" cy="27" r="6" fill="' + MARF + '"/><circle cx="25.5" cy="27" r="6" fill="' + MARF + '"/><ellipse cx="18" cy="28" rx="5" ry="7" fill="' + MARF + '" stroke="' + col + '" stroke-width="1.6"/><path d="M18 33v7q0 3 3 3" fill="none" stroke="' + MARF + '" stroke-width="3" stroke-linecap="round"/><path d="M13.500 35q-3.500 3-2.500 8M22.500 35q3.500 3 2.500 8" fill="none" stroke="' + ORO + '" stroke-width="2.200" stroke-linecap="round"/>';
    if (cls === 'cav') return '<path d="M11 43l1-9c-3-2-4-6-2.500-9l-.5-6 4.500 3 2.500-2.500 1 3c5-.5 9.500 3 11 8.500v4c-3-1-5 0-6 2l1 6z" fill="' + MARF + '" stroke="' + MARF + '" stroke-width="1" stroke-linejoin="round"/><circle cx="21" cy="27" r="1.500" fill="' + col + '"/>';
    if (cls === 'rng') return tipo === 'velites' ? [0, 1, 2].map(i => { const x = 11 + i * 7, y = 36 - (i === 1 ? 0 : 3); return '<path d="M' + (x - 2) + ' ' + (y + 5) + 'l5-13" stroke="' + MARF + '" stroke-width="2" stroke-linecap="round"/><circle cx="' + (x + 3.400) + '" cy="' + (y - 9) + '" r="2" fill="' + MARF + '"/>'; }).join('') : '<path d="M9 40q-1-18 11-19" fill="none" stroke="' + MARF + '" stroke-width="2.400" stroke-linecap="round"/><circle cx="25" cy="21" r="4.500" fill="' + MARF + '"/><path d="M9 40l5-4" stroke="' + MARF + '" stroke-width="2.400" stroke-linecap="round"/>';
    if (tipo === 'hastati') return pilum(18, 18, 43, 2.600) + '<path d="M13 36h10" stroke="' + MARF + '" stroke-width="2" stroke-linecap="round"/>';
    if (tipo === 'principes') return '<g transform="rotate(32 18 31)">' + pilum(18, 17, 44) + '</g><g transform="rotate(-32 18 31)">' + pilum(18, 17, 44) + '</g>';
    if (cls === 'spear') return tipo === 'triarii' ? pilum(10.500, 23, 43, 2) + pilum(18, 17, 43, 2) + pilum(25.500, 23, 43, 2) + '<path d="M9 40h18" stroke="' + MARF + '" stroke-width="2" stroke-linecap="round"/>' : '<path d="M8 21h20" stroke="' + MARF + '" stroke-width="2" stroke-linecap="round"/>' + [0, 1, 2].map(r => [0, 1, 2].map(q => '<circle cx="' + (11 + q * 7) + '" cy="' + (27 + r * 7) + '" r="2.400" fill="' + MARF + '"/>').join('')).join('');
    return '<path d="M9 36l9-14 9 14" fill="none" stroke="' + MARF + '" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 43l6-9 6 9" fill="none" stroke="' + MARF + '" stroke-width="2.600" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  /* d: { bando, tipo, cls, animo 0..3, fat 0..3 (puntos gastados), vet 0..2, sel, general } */
  function estandarte(d) {
    const col = TELA[d.bando], an = Math.max(0, Math.min(3, d.animo | 0)), fat = Math.max(0, Math.min(3, d.fat | 0)), vet = Math.max(0, Math.min(2, d.vet | 0));
    const top = d.bando ? 'M4 18Q4 7 14 7H22Q32 7 32 18' : 'M4 7H32';
    let tela;
    if (an === 2) tela = top + 'L32 46l-4 4-3-3-4 8-3-5-4 6-4-8-3 4-3-5z';
    else if (d.cls === 'cav') tela = top + 'L32 56 18 47 4 56z';
    else tela = top + 'L32 44 18 57 4 44z';
    const gal = [0, 1, 2].slice(0, vet + 1).map(i => '<path d="M12.500 ' + (13.500 + i * 3.400) + 'L18 ' + (10.500 + i * 3.400) + 'l5.500 3" fill="none" stroke="' + (vet === 2 ? ORO : vet === 1 ? '#d8a94a' : '#c9ab7a') + '" stroke-width="1.900" stroke-linecap="round" stroke-linejoin="round"/>').join('');
    const apaga = [0, 0, .18, .34][fat], pun = [0, 1, 2].map(i => '<circle cx="' + (11 + i * 7) + '" cy="62" r="2.800" fill="' + (i < 3 - fat ? MARF : '#3a4452') + '" stroke="' + NOCHE + '" stroke-width="1"/>').join('');
    return '<svg class="b2-svg" viewBox="0 0 36 66" aria-hidden="true"><circle cx="18" cy="3.500" r="2.800" fill="' + ORO + '"/><path d="M18 5v2" stroke="' + BRO + '" stroke-width="2"/>' +
      '<path d="' + tela + '" fill="' + col + '" stroke="' + ANIMO_C[an] + '" stroke-width="3.200" stroke-linejoin="round"' + (an === 3 ? ' stroke-dasharray="4 3"' : '') + '/>' +
      (apaga ? '<path d="' + tela + '" fill="' + NOCHE + '" fill-opacity="' + apaga + '"/>' : '') + '<g opacity="' + (an === 3 ? .55 : 1) + '">' + emblema(d.tipo, d.cls, col) + '</g>' + gal + pun + '</svg>';
  }

  /* ---------- abrir / cerrar ---------- */
  function abrir(cfg, alTerminar) {
    cerrar();
    const e = (cfg && cfg.estado) || B().crear(cfg);
    const el = document.createElement('div'); el.id = 'b2';
    el.innerHTML = '<div id="b2-3d"></div><div class="b2-ui"></div>'; document.body.appendChild(el);
    S = { e, el, ui: el.querySelector('.b2-ui'), fin: alTerminar || function () {}, corre: false, vel: 1, cons: null, plan: -1, cola: [], sel: null, mano: false, mas: false, chips: [], pausa: { motivo: 'Antes de empezar', tipo: 'inicio' }, semilla: (cfg && cfg.semilla) || e.semilla || 1, hist: [], flot: {}, acc: 0, fuera: null, verFin: false, mandoSim: e.bandos[0].mando, pulsos: 0 };
    el.addEventListener('pointerdown', ev => { const b = ev.target.closest('button'); S.down = b ? { b, t: Date.now() } : null; });
    el.addEventListener('click', onClick);
    S.timer = setInterval(tick, 100);
    pausar(S.pausa); return el;
  }
  function cerrar() { if (S) { clearInterval(S.timer); if (S.el) S.el.remove(); } S = null; }

  /* ---------- bucle ---------- */
  function tick() {
    if (!S || !S.corre || S.verFin) return;
    const ritmo = root.UIBatalla2.ritmo || 2000;
    S.acc += 100 * S.vel;
    while (S && S.corre && S.acc >= ritmo) { S.acc -= ritmo; pulso(); }
  }
  function pulso() {
    const antes = {}; for (const id in S.e.regs) antes[id] = S.e.regs[id].n;
    const r = B().pulso(S.e, S.semilla++); S.e = r.estado; S.pulsos++;
    S.flot = {}; for (const id in S.e.regs) { const d = antes[id] - S.e.regs[id].n; if (d >= 4) S.flot[id] = Math.round(d); }
    S.hist.push.apply(S.hist, r.sucesos);
    avisosDe(r.sucesos);
    try { if (typeof root.UIBatalla2.alSuceso === 'function') root.UIBatalla2.alSuceso(r.sucesos, S.e); } catch (err) { console.warn('alSuceso:', err); }
    if (S.e.fin) { S.corre = false; S.verFin = true; S.pausa = { motivo: S.e.fin.motivo, tipo: 'fin' }; S.cons = null; pintar(); return; }
    if (r.pausa) { pausar(r.pausa); return; }
    pintar();
  }
  function pausar(p) {
    if (!S) return; S.corre = false; S.pausa = p || { motivo: '', tipo: 'manual' };
    S.cons = S.e.fin ? null : B().consejo(S.e, 0); S.plan = -1; S.cola = []; S.mandoSim = S.e.bandos[0].mando; S.mano = false; S.mas = false; S.sel = null; pintar();
  }
  function seguir() {
    if (!S || S.verFin) return;
    if (S.cola.length) { const r = B().aplicar(S.e, S.cola, 0); S.e = r.estado; if (r.rechazadas.length) chip(r.rechazadas[0].motivo, 'mal'); }
    S.cola = []; S.plan = -1; S.mano = false; S.mas = false; S.sel = null; S.pausa = null; S.corre = true; S.acc = 0; pintar();
  }

  /* ---------- avisos pequeños y transitorios ---------- */
  function chip(t, k) { const c = { t, k: k || '', id: Math.random() }; S.chips.push(c); if (S.chips.length > 3) S.chips.shift(); setTimeout(() => { if (S && S.chips.indexOf(c) >= 0) { S.chips.splice(S.chips.indexOf(c), 1); const z = S.ui.querySelector('.b2-chips'); if (z) z.innerHTML = chipsHtml(); } }, 4600); }
  function avisosDe(su) {
    for (const s of su) {
      if (['huye', 'cae', 'roto'].indexOf(s.tipo) >= 0) chip(s.txt, s.bando === 0 ? 'mal' : 'bien');
      else if (['carga', 'rodeoLlega', 'rodeoInterceptado', 'bolsa', 'generalCae', 'rodeo', 'fingida'].indexOf(s.tipo) >= 0) chip(s.txt, s.tipo === 'generalCae' ? (s.bando === 0 ? 'mal' : 'bien') : (s.bando === 0 ? 'oro' : 'mal'));
    }
  }
  const chipsHtml = () => S.chips.map(c => '<div class="b2-chip ' + c.k + '">' + esc(c.t) + '</div>').join('');

  /* ---------- dibujo ---------- */
  const reg = id => S.e.regs[id];
  function pendiente(s) { let p = null; for (const o of S.cola) if (o.sector === s && ['aguantar', 'avanzar', 'cargar', 'hostigar', 'retirarse'].indexOf(o.orden) >= 0) p = o.orden; return p; }
  function tarjeta(r, x, y) {
    const sel = S.sel === r.id, fl = S.flot[r.id];
    return '<button class="b2-st ' + (r.bando ? 'rival' : 'mio') + (sel ? ' sel' : '') + (r.cargando ? ' carga' : '') + '" data-r="' + r.id + '" style="left:' + x + '%;top:' + y + '%" aria-label="' + esc(r.nombre + ', ' + ANIMO_N[r.animo] + ', ' + Math.round(r.n) + ' hombres') + '">' +
      estandarte({ bando: r.bando, tipo: r.tipo, cls: r.cls, animo: r.animo, fat: r.fat, vet: r.vet }) + '<span class="nm">' + esc(r.nombre) + '<small>' + fmt(r.n) + (r.vet ? ' · ' + (r.vet === 2 ? '★★' : '★') : '') + '</small></span>' + (fl ? '<b class="fl">−' + fl + '</b>' : '') + '</button>';
  }
  const FILAS = { ea: 2, ef: 21, mf: 49, ma: 68 };
  function sectorHtml(s) {
    const sec = S.e.sectores[s], ps = S.pausa && S.pausa.sector === s && S.pausa.tipo !== 'inicio' && S.pausa.tipo !== 'manual', pend = pendiente(s), l = sec.linea;
    const dy = -l * 8, tr = sec.rasgo.tipo;
    let h = '<div class="b2-sec' + (ps ? ' foco' : '') + (tr !== 'llano' ? ' t-' + tr : '') + '" style="left:' + (s * 33.333) + '%"><div class="b2-in" style="transform:translateY(' + dy + 'px)">';
    h += '<div class="b2-linea"></div>';
    const fila = (b, nom, top) => { const ids = sec.filas[b][nom]; return ids.map((id, i) => tarjeta(reg(id), ((i + .5) / ids.length) * 100, top)).join(''); };
    h += fila(1, 'apoyo', FILAS.ea) + fila(1, 'frente', FILAS.ef) + fila(0, 'frente', FILAS.mf) + fila(0, 'apoyo', FILAS.ma);
    h += '</div>';
    if (pend === 'avanzar' || pend === 'cargar') h += '<svg class="b2-flecha" viewBox="0 0 40 60"><path d="M20 56V10M8 22l12-14 12 14" fill="none" stroke="' + ORO + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    else if (pend === 'retirarse') h += '<svg class="b2-flecha" viewBox="0 0 40 60"><path d="M20 6v46M8 40l12 14 12-14" fill="none" stroke="' + ORO + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 6"/></svg>';
    const g = S.e.bandos[0].general, lc = l > 0 ? 'bien' : l < 0 ? 'mal' : '';
    h += '<div class="b2-lab"><b>' + SECT[s] + '</b>' + (tr !== 'llano' ? ' · ' + esc(tr) : '') + ' <i class="' + lc + '">línea ' + (l > 0 ? '+' : '') + l + '</i>' + (pend ? ' <u>' + esc(B().POSTURAS[pend].n) + '</u>' : '') + (g && g.vivo && g.sector === s ? ' <em>★ ' + esc(g.n) + (g.alerta ? ' ¡en peligro!' : '') + '</em>' : '') + '</div></div>';
    return h;
  }
  function pintar() {
    if (!S) return; const e = S.e, B2 = B();
    const h0 = B2.hombres(e, 0), h1 = B2.hombres(e, 1), pc = Math.round(100 * h0 / Math.max(1, h0 + h1));
    const bd = e.bandos[0], mando = S.mandoSim != null && !S.corre ? S.mandoSim : bd.mando, mx = bd.general && bd.general.vivo ? 5 : 2;
    const enm = Object.keys(e.regs).map(i => e.regs[i]).filter(r => r.bando === 0 && (r.lugar === 'rodeo' || r.lugar === 'marcha')).length;
    const estado = S.verFin ? 'Fin' : S.corre ? 'Directo' : 'En pausa';
    let h = '<div class="b2-top"><b class="' + (S.corre ? 'vivo' : '') + '">' + estado + ' · ' + mmss(e.t) + '</b><span class="n0">' + esc(bd.nombre) + ' ' + fmt(h0) + '</span><div class="b2-bar"><s style="width:' + pc + '%"></s></div><span class="n1">' + fmt(h1) + ' ' + esc(e.bandos[1].nombre) + '</span>' +
      '<span class="b2-mando' + (mando < 1 ? ' mal' : '') + '" title="Mando">Mando ' + '●'.repeat(Math.max(0, mando)) + '<i>' + '●'.repeat(Math.max(0, mx - mando)) + '</i></span>' +
      '<span class="b2-meta">' + (bd.reserva.length ? 'Reserva ' + bd.reserva.length : '') + (bd.cola.length ? ' · Cola ' + bd.cola.length : '') + (enm ? ' · En marcha ' + enm : '') + (e.objetivo && e.objetivo.tipo === 'resistir' ? ' · Resistir ' + mmss(Math.max(0, e.objetivo.seg - e.t)) : '') + '</span></div>';
    h += '<div class="b2-campo"><div class="b2-sectores">' + [0, 1, 2].map(sectorHtml).join('') + '<div class="b2-sep" style="left:33.333%"></div><div class="b2-sep" style="left:66.666%"></div></div>';
    h += '<div class="b2-chips">' + chipsHtml() + '</div>';
    const ges = e.bandos[1].gesto && e.bandos[1].gesto.texto;
    if (ges && !S.verFin) h += '<div class="b2-gesto"><b>' + esc(e.bandos[1].nombre) + '</b> ' + esc(ges) + (S.cons && S.cons.reservaEnemiga ? ' · reserva a la vista' : '') + '</div>';
    if (S.pausa && S.pausa.tipo !== 'inicio' && S.pausa.tipo !== 'manual' && S.pausa.tipo !== 'fin' && !S.corre) h += '<div class="b2-aviso">' + esc(S.pausa.motivo) + '</div>';
    if (S.sel && reg(S.sel)) { const r = reg(S.sel); h += '<div class="b2-info">' + esc(r.nombre) + ' · ' + ANIMO_N[r.animo] + ' · ' + ['descansados', 'algo cansados', 'cansados', 'agotados'][r.fat] + ' · ' + fmt(r.n) + ' hombres · ' + VET_N[r.vet] + '</div>'; }
    if (!S.verFin) h += '<div class="b2-cluster"><button class="b2-btn" data-a="pp" aria-label="' + (S.corre ? 'Pausar' : 'Seguir') + '">' + (S.corre ? 'II' : '▶') + '</button><button class="b2-btn" data-a="vel" aria-label="Velocidad">×' + S.vel + '</button><button class="b2-btn aj" data-a="aj" aria-label="Cuándo pausa sola">' + esc(AJ_N[e.ajustes.pausas].replace('Pausas: ', 'Pausa ')).replace(' ', '<br>') + '</button></div>';
    h += '</div>';
    if (S.verFin) h += finHtml();
    else if (S.mano || (S.sel && S.sel !== 'x')) h += ordenesHtml();
    else if (!S.corre) h += consejoHtml();
    S.ui.innerHTML = h;
  }
  function consejoHtml() {
    const c = S.cons; if (!c) return '';
    const mandoQ = S.mandoSim;
    return '<div class="b2-pie">' + c.planes.map((p, i) => '<button class="b2-tar' + (S.plan === i ? ' on' : '') + '" data-c="' + i + '"><span class="l1"><strong>' + esc(p.titulo) + '</strong><u class="' + p.etiqueta + '">' + p.etiqueta + '</u></span><span class="l2">' + esc(p.tribuno.n + ' · ' + p.tribuno.car + ' — ' + p.motivo) + '</span></button>').join('') +
      '<button class="b2-mano" data-a="mano">A mano</button><button class="b2-seguir" data-a="seguir">SEGUIR ▶<small>mando ' + mandoQ + (S.plan >= 0 ? ' · ' + esc(c.planes[S.plan].tribuno.n.split(' ')[0]) : '') + '</small></button></div>';
  }
  function ordenesHtml() {
    const r = S.sel ? reg(S.sel) : null, s = r ? r.sector : null, pend = s != null ? pendiente(s) : null, actual = s != null ? S.e.sectores[s].posturas[0] : null, B2 = B(), mando = S.corre ? S.e.bandos[0].mando : S.mandoSim;
    const sinsel = s == null || r.bando !== 0;
    const bt = (a, n, sub, coste, on, extra) => '<button class="b2-or' + (on ? ' on' : '') + '" data-o="' + a + '"' + (sinsel || (coste > mando && !on) || extra === 'off' ? ' disabled' : '') + '><b>' + n + '</b><small>' + sub + '</small></button>';
    let h = '<div class="b2-pie ord">';
    if (!S.mas) {
      h += ORD6.map(o => bt(o[0], o[1], o[2], o[0] === 'aguantar' ? 0 : o[0] === 'relevar' ? 2 : 1, (pend || actual) === o[0] && o[0] !== 'relevar')).join('');
      h += '<button class="b2-or mas" data-a="mas"><b>Más</b><small>maniobras</small></button>';
    } else {
      const op = B2.opcionesRodeo ? B2.opcionesRodeo(S.e, 0) : [], puedeRodear = s != null && op.some(x => x.origen === s);
      h += bt('moverI', 'Mover ◀', 'mando 1', 1, false, s === 0 ? 'off' : '') + bt('moverD', 'Mover ▶', 'mando 1', 1, false, s === 2 ? 'off' : '') + bt('rodear', 'Rodear', 'mando 2', 2, false, puedeRodear ? '' : 'off') + bt('fingir', 'Fingir', 'mando 2', 2, false) + bt('vigilar', 'Vigilar', 'mando 1', 1, false) + bt('general', 'General aquí', 'mando 1', 1, false) + bt('reservaOculta', 'Esconder', 'la reserva', 0, false) + '<button class="b2-or mas" data-a="menos"><b>◂ Órdenes</b><small>básicas</small></button>';
    }
    h += S.corre ? '<button class="b2-or cierra" data-a="cerrar"><b>Cerrar</b></button>' : '<button class="b2-or cons" data-a="consejo"><b>Consejo</b><small>planes</small></button><button class="b2-seguir" data-a="seguir">SEGUIR ▶<small>mando ' + mando + '</small></button>';
    return h + '</div>';
  }

  /* ---------- Lo que pasó ---------- */
  function resultado() {
    const e = S.e, f = e.fin || { ganador: 0, motivo: '', t: e.t }, bajas = [];
    for (const id in e.regs) { const r = e.regs[id]; bajas.push({ id, bando: r.bando, tipo: r.tipo, nombre: r.nombre, n0: r.n0, n: Math.round(r.n), bajas: Math.max(0, Math.round(r.n0 - r.n)), huyo: r.lugar === 'huido', vet: r.vet }); }
    const g = e.bandos[0].general, vivosEn = e.fin && e.fin.resultado ? e.fin.resultado[1].vivos : B().hombres(e, 1);
    const prisioneros = f.ganador === 0 ? Math.round(vivosEn * 0.25) : 0;   /* un cuarto de los enemigos que quedan en pie al terminar */
    return { ganador: f.ganador, victoria: f.ganador === 0, motivo: f.motivo, t: f.t, bajas, bajasTotal: [0, 1].map(b => bajas.filter(x => x.bando === b).reduce((a, x) => a + x.bajas, 0)), general: g ? { vivo: !!g.vivo, n: g.n } : null, prisioneros, estado: e };
  }
  function lineaSector(s) {
    const e = S.e, sec = e.sectores[s], l = sec.linea, mios = sec.roto[0], suyos = sec.roto[1];
    const h = S.hist.filter(x => x.sector === s);
    const rodeo = h.some(x => x.tipo === 'rodeoLlega' && x.bando === 0), bolsa = h.some(x => x.tipo === 'bolsa' && x.bando === 0);
    if (mios) return ['mal', 'Se rompió: nos quedamos sin tropas.'];
    if (suyos) return ['bien', 'El enemigo se rompió aquí.'];
    if (bolsa) return ['bien', 'La retirada fingida los metió en la bolsa.'];
    if (rodeo) return ['bien', 'Nuestro rodeo entró por la espalda.'];
    if (l >= 1) return ['bien', 'Ganamos terreno (línea +' + l + ').'];
    if (l <= -1) return ['mal', 'Cedimos terreno (línea ' + l + ').'];
    return ['', 'Igualado. Nadie cede terreno.'];
  }
  function finHtml() {
    const r = resultado(), e = S.e, tiene = r.bajas.filter(x => x.bando === 0 && x.bajas > 0).sort((a, b) => b.bajas - a.bajas).slice(0, 3);
    return '<div class="b2-fin"><h2>' + (r.victoria ? 'Victoria' : 'Derrota') + ' · Lo que pasó</h2><p class="mot">' + esc(r.motivo) + ' · ' + mmss(r.t) + '</p><dl>' +
      [0, 1, 2].map(s => { const l = lineaSector(s); return '<dt>' + SECT[s] + '</dt><dd class="' + l[0] + '">' + esc(l[1]) + '</dd>'; }).join('') +
      '<dt>BAJAS</dt><dd>Roma ' + fmt(r.bajasTotal[0]) + ' · ' + esc(e.bandos[1].nombre) + ' ' + fmt(r.bajasTotal[1]) + (tiene.length ? '. Más castigados: ' + tiene.map(x => esc(x.nombre) + ' −' + x.bajas).join(', ') : '') + '</dd>' +
      '<dt>GENERAL</dt><dd class="' + (r.general && !r.general.vivo ? 'mal' : '') + '">' + (r.general ? esc(r.general.n) + (r.general.vivo ? ' sigue vivo.' : ' cayó en el campo.') : 'Sin general.') + '</dd>' +
      (r.victoria ? '<dt>BOTÍN</dt><dd>Prisioneros: ' + fmt(r.prisioneros) + '. La tropa gana veteranía.</dd>' : '') + '</dl><button class="b2-seguir" data-a="fin">CONTINUAR</button></div>';
  }

  /* ---------- toques ---------- */
  function onClick(ev) {
    if (!S) return; let b = ev.target.closest('button');
    if (!b && S.down && Date.now() - S.down.t < 1500) b = S.down.b;
    S.down = null;
    if (!b) { if (S.sel) { S.sel = null; if (S.corre) S.mano = false; pintar(); } return; }
    const d = b.dataset;
    if (d.r) { const r = reg(d.r); if (!r || S.verFin) return; if (r.bando !== 0) { chip(r.nombre + ': ' + ANIMO_N[r.animo].toLowerCase() + ', ' + fmt(r.n) + ' hombres', ''); pintar(); return; } S.sel = S.sel === d.r ? null : d.r; if (S.sel && !S.corre) S.mano = true; S.mas = false; pintar(); return; }
    if (d.c != null) { const p = S.cons.planes[+d.c]; S.plan = S.plan === +d.c ? -1 : +d.c; S.cola = S.plan >= 0 ? p.ordenes.slice() : []; const sim = B().aplicar(S.e, S.cola, 0); S.mandoSim = sim.mando; pintar(); return; }
    if (d.o) { dar(d.o); return; }
    const a = d.a;
    if (a === 'seguir') seguir();
    else if (a === 'pp') { if (S.corre) pausar({ motivo: 'Pausa manual', tipo: 'manual' }); else seguir(); }
    else if (a === 'vel') { S.vel = S.vel === 1 ? 2 : 1; pintar(); }
    else if (a === 'aj') { const e = S.e; e.ajustes.pausas = AJUSTES[(AJUSTES.indexOf(e.ajustes.pausas) + 1) % 3]; pintar(); }
    else if (a === 'mano') { S.mano = true; S.mas = false; pintar(); }
    else if (a === 'consejo') { S.mano = false; S.sel = null; pintar(); }
    else if (a === 'mas') { S.mas = true; pintar(); } else if (a === 'menos') { S.mas = false; pintar(); }
    else if (a === 'cerrar') { S.sel = null; S.mano = false; pintar(); }
    else if (a === 'fin') { const r = resultado(), f = S.fin; cerrar(); f(r); }
  }
  function dar(o) {
    const r = S.sel && reg(S.sel); if (!r || r.bando !== 0) return; const s = r.sector;
    let ord;
    if (['aguantar', 'avanzar', 'cargar', 'hostigar', 'retirarse', 'relevar', 'fingir', 'vigilar', 'general'].indexOf(o) >= 0) ord = { orden: o, sector: s };
    else if (o === 'moverI' || o === 'moverD') ord = { orden: 'mover', sector: s, a: s + (o === 'moverI' ? -1 : 1), reg: r.id };
    else if (o === 'rodear') { const c = B().consejo(S.e, 0).sectores; let d = -1; for (let i = 0; i < 3; i++) if (S.e.sectores[i].filas[1].frente.length && (d < 0 || c[i].r < c[d].r)) d = i; ord = { orden: 'rodear', sector: s, objetivo: d < 0 ? 1 : d, reg: r.id }; }
    else if (o === 'reservaOculta') ord = { orden: 'reservaOculta' };
    if (!ord) return;
    const prueba = B().aplicar(S.e, S.cola.concat([ord]), 0);
    if (prueba.rechazadas.length) { chip(prueba.rechazadas[0].motivo, 'mal'); pintar(); return; }
    if (S.corre) { S.e = prueba.estado; S.cola = []; chip(ord.orden === 'rodear' || ord.orden === 'mover' ? 'Orden dada' : B().POSTURAS[ord.orden] ? B().POSTURAS[ord.orden].n + ' en ' + SECT[s].toLowerCase() : 'Orden dada', 'oro'); S.sel = null; }
    else { S.cola.push(ord); S.mandoSim = prueba.mando; S.plan = -1; }
    pintar();
  }

  root.UIBatalla2 = { abrir, cerrar, estandarte, ritmo: 2000, alSuceso: null, _estado: () => S, _pulso: () => { if (S) pulso(); } };
})(window);
