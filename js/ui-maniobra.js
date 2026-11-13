/* AQVILA — NB6: pantalla de la maniobra (solo dibuja; la lógica es js/maniobra.js).
   Uso: UIManiobra.abrir(cfg, alTerminar). cfg = lo de Maniobra.crear, o { estado } para seguir una maniobra guardada.
   alTerminar({ accion: 'batalla' | 'fin', estado, choque, fin }): 'batalla' trae la cfg del choque (estado.choque); 'fin' = rendición o retirada sin pelear. */
(function (root) {
  const M = () => root.Maniobra, D = () => root.DATA;
  const ICO = {
    Castra: '<path d="M3 20 12 5l9 15zM12 20v-6"/>', Cerro: '<path d="M2 20 9 7l4 7 3-4 6 10z"/>', Vado: '<path d="M2 9q3-3 5 0t5 0 5 0 5 0M2 15q3-3 5 0t5 0 5 0 5 0"/>', Puente: '<path d="M2 18h20M4 18a8 8 0 0 1 16 0M2 10h20"/>',
    Pinar: '<path d="M12 3 6 12h4l-5 7h14l-5-7h4zM12 19v3"/>', Cruce: '<path d="M12 3v18M3 12h18"/>', Llano: '<circle cx="12" cy="12" r="3"/>' };
  const rom = n => ['I', 'II', 'III'][n] || String(n + 1), fmt = n => Math.round(n).toLocaleString('es-ES');
  const suma = u => { let n = 0; for (const k in u) n += u[k]; return n; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let S = null;   // estado de la pantalla abierta

  function abrir(cfg, alTerminar) {
    cerrar();
    const e = (cfg && cfg.estado) || M().crear(cfg);
    const el = document.createElement('div'); el.id = 'man'; document.body.appendChild(el);
    S = { e, el, fin: alTerminar || function () {}, sel: null, mano: false, ordenes: {}, consejo: [], eleg: -1, avisos: [], semilla: (cfg && cfg.semilla) || 1, pausaChoque: false };
    el.addEventListener('click', onClick); nuevoDia(); return el;
  }
  function cerrar() { if (S && S.el) S.el.remove(); S = null; }

  function nuevoDia() {
    const e = S.e; S.mano = false; S.sel = null; S.consejo = e.terminado ? [] : M().consejoDia(e, 0);
    let best = 0; S.consejo.forEach((c, i) => { if (c.puntos > S.consejo[best].puntos) best = i; });
    elegir(best); pintar();
  }
  function elegir(i) { S.eleg = i; S.ordenes = {}; (S.consejo[i] ? S.consejo[i].ordenes : []).forEach(o => { S.ordenes[o.legion] = o.a; }); }
  const pt = id => S.e.zona.puntos.find(p => p.id === id);
  const mias = () => S.e.bandos[0].legiones;
  const vec = id => { const r = []; S.e.zona.caminos.forEach(c => { if (c[0] === id) r.push(c[1]); else if (c[1] === id) r.push(c[0]); }); return r; };
  const pos = p => 'left:' + p.x + '%;top:' + p.y + '%';

  function pintar() {
    const e = S.e, vi = M().vista(e, 0), L = mias(), hayRio = e.zona.puntos.some(p => p.tipo === 'Vado' || p.tipo === 'Puente');
    const minV = Math.min.apply(null, L.map(l => l.vivres).concat(6)), maxC = Math.max.apply(null, L.map(l => l.cansancio).concat(0));
    const total = L.reduce((s, l) => s + suma(l.units), 0);
    let h = '<div class="m-suelo"></div>';
    h += '<div class="m-top"><b>Día ' + Math.min(e.dia + 1, e.max) + ' de ' + e.max + '</b><span>' + esc(e.zona.n) + '</span><div class="m-der"><span class="' + (minV <= 2 ? 'mal' : 'ok') + '">Víveres ' + minV + ' d</span><span class="' + (maxC >= 60 ? 'mal' : '') + '">Cansancio ' + Math.round(maxC) + ' %</span><span>Roma ' + fmt(total) + '</span></div></div>';
    h += '<div class="m-campo"><svg class="m-svg" viewBox="0 0 100 100" preserveAspectRatio="none">';
    if (hayRio && e.zona.id === 'rio') h += '<path class="m-rio" d="M50 -5C44 30 56 60 50 105"/>';
    e.zona.caminos.forEach(c => { const a = pt(c[0]), b = pt(c[1]); h += '<line class="m-camino" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; });
    L.forEach(l => { const d = S.ordenes[l.id]; if (d && d !== l.punto) { const a = pt(l.punto), b = pt(d); h += '<line class="m-orden' + (S.sel === l.id ? ' sel' : '') + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; } });
    h += '</svg>';
    const dest = S.mano && S.sel ? vec(mias().find(l => l.id === S.sel).punto) : [];
    const foco = e.choque ? e.choque.punto : null;
    e.zona.puntos.forEach(p => {
      const v = vi.puntos[p.id], propio = L.some(l => l.punto === p.id), nb = !v.visible && !propio;
      h += '<button class="m-pt' + (nb ? ' niebla' : '') + (dest.includes(p.id) ? ' dest' : '') + (foco === p.id ? ' foco' : '') + '" data-p="' + p.id + '" style="' + pos(p) + '" aria-label="' + esc(p.n) + '"><i><svg viewBox="0 0 24 24">' + ICO[p.tipo] + '</svg></i>' + (nb ? '<span class="q">?</span>' : '') + '<em>' + esc(p.n) + '</em></button>';
    });
    L.forEach((l, i) => { const p = pt(l.punto), n = mias().filter((x, j) => j < i && x.punto === l.punto).length;
      h += '<button class="m-leg mia' + (S.sel === l.id ? ' sel' : '') + '" data-l="' + l.id + '" style="left:calc(' + p.x + '% + ' + (n * 30) + 'px);top:' + p.y + '%"><span class="esc">' + rom(i) + '</span><b>' + fmt(suma(l.units)) + '</b><span class="bar"><s style="width:' + Math.round(l.vivres / 6 * 100) + '%"></s></span><span class="bar c"><s style="width:' + Math.round(l.cansancio) + '%"></s></span></button>'; });
    vi.enemigos.forEach((x, i) => { const p = pt(x.punto), k = L.filter(l => l.punto === x.punto).length + vi.enemigos.filter((y, j) => j < i && y.punto === x.punto).length; h += '<div class="m-leg rival" style="left:calc(' + p.x + '% + ' + (k * 30) + 'px);top:' + p.y + '%"><span class="esc">' + esc(x.nombre.replace(/\D+/g, '') ? rom(+x.nombre.replace(/\D+/g, '') - 1) : 'E') + '</span><b>≈' + fmt(x.fuerza) + '</b></div>'; });
    h += '</div><div class="m-avisos">' + S.avisos.map(a => '<div class="' + a.c + '">' + esc(a.t) + '</div>').join('') + '</div>';
    if (e.terminado && e.choque) h += panelChoque(e.choque);
    else if (e.terminado) h += panelFin(e);
    else {
      h += '<div class="m-pie">' + S.consejo.map((c, i) => '<button class="m-tar' + (!S.mano && S.eleg === i ? ' on' : '') + '" data-c="' + i + '"><small><span>' + esc(c.tribuno.split(' ')[0] + ' ' + c.tribuno.split(' ')[1].charAt(0) + '. · ' + c.caracter.toLowerCase()) + '</span><u class="' + c.etiqueta + '">' + c.etiqueta + '</u></small><div><strong>' + esc(c.resumen) + '</strong><span>' + esc(c.motivo) + '</span></div></button>').join('') +
        '<button class="m-mano' + (S.mano ? ' on' : '') + '" data-a="mano">A mano</button><button class="m-pasar" data-a="pasar">Pasar el día<small>' + (S.mano ? 'órdenes a mano' : esc((S.consejo[S.eleg] || { tribuno: '' }).tribuno.split(' ')[0])) + '</small></button></div>';
    }
    S.el.innerHTML = h;
    if (S.avisos.length) { const q = S.avisos; setTimeout(() => { if (S && S.avisos === q) { S.avisos = []; const a = S.el.querySelector('.m-avisos'); if (a) a.innerHTML = ''; } }, 6200); }
  }

  function panelChoque(ch) {
    const l = ch.lineas || [];
    return '<div class="m-choque"><h2>' + (ch.emboscado === 0 ? '¡Emboscada en ' + esc(ch.nombre) + '!' : ch.emboscado === 1 ? '¡Cae en tu emboscada!' : 'Choque en ' + esc(ch.nombre)) + '</h2><dl><dt>Qué pasa</dt><dd>' + esc((l[0] || '')) + '</dd><dt>Tú</dt><dd class="t">' + esc((l[1] || '').replace(/^Tú: /, '')) + '</dd><dt>Ellos</dt><dd>' + esc((l[2] || '').replace(/^Ellos: /, '')) + '</dd><dt>Terreno</dt><dd>' + esc((l[3] || '').replace(/^Terreno: /, '')) + '</dd></dl><div class="bt"><button data-a="retirar">Retirarse</button><button class="rojo" data-a="batalla">A la batalla</button></div></div>';
  }
  function panelFin(e) {
    const f = e.fin || {}, tuyo = f.bando === 0, t = f.tipo === 'rendicion' ? (tuyo ? 'Tus legiones se rinden' : 'El enemigo se rinde') : (tuyo ? 'Te retiras sin combatir' : 'El enemigo se retira sin combatir');
    return '<div class="m-choque" style="bottom:auto;top:calc(var(--pt) + 8px)"><h2>' + t + '</h2><dl><dt>Qué pasa</dt><dd>' + (f.tipo === 'rendicion' ? 'Cercados y en inferioridad.' : 'Sin víveres: no queda quien combata.') + '</dd></dl><div class="bt"><button class="rojo" data-a="fin">Continuar</button></div></div>';
  }

  function onClick(ev) {
    if (!S) return; const b = ev.target.closest('button'); if (!b) return; const e = S.e;
    if (b.dataset.c != null) { S.mano = false; elegir(+b.dataset.c); pintar(); return; }
    if (b.dataset.l) { if (e.terminado) return; S.mano = true; S.sel = S.sel === b.dataset.l ? null : b.dataset.l; pintar(); return; }
    if (b.dataset.p) {
      if (S.mano && S.sel) { const l = mias().find(x => x.id === S.sel); if (b.dataset.p === l.punto || vec(l.punto).includes(b.dataset.p)) { S.ordenes[l.id] = b.dataset.p; S.sel = null; pintar(); } }
      return;
    }
    const a = b.dataset.a;
    if (a === 'mano') { S.mano = !S.mano; if (S.mano) { S.eleg = -1; } else elegir(0); S.sel = null; pintar(); }
    else if (a === 'pasar') pasar();
    else if (a === 'batalla') { const r = { accion: 'batalla', estado: S.e, choque: S.e.choque }, f = S.fin; cerrar(); f(r); }
    else if (a === 'fin') { const r = { accion: 'fin', estado: S.e, fin: S.e.fin }, f = S.fin; cerrar(); f(r); }
    else if (a === 'retirar') { S.e = M().retirarse(S.e, 0); S.avisos = [{ t: 'Te retiras: pierdes víveres y algo de moral, no hombres.', c: 'hecho' }]; if (S.e.terminado) pintar(); else nuevoDia(); }
  }
  function pasar() {
    const e0 = S.e, ord = mias().map(l => ({ legion: l.id, a: S.ordenes[l.id] || l.punto }));
    const e1 = M().moverDia(e0, ord, 0), r = M().resolverDia(e1, S.semilla++);
    S.e = r.estado;
    S.avisos = r.sucesos.filter(s => s.bando === 0 || s.tipo === 'hambre' || s.tipo === 'rendicion' || s.tipo === 'cerco').slice(0, 3).map(s => ({ t: s.texto, c: s.tipo === 'marcha' ? 'hecho' : '' }));
    if (S.e.terminado) { S.sel = null; pintar(); } else nuevoDia();
  }

  root.UIManiobra = { abrir, cerrar, _estado: () => S };
})(window);
