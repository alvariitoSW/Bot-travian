/* AQVILA — PL3 Politeia: la ciudad de pie (390x844). Una sola pantalla, sin menús: la polis pintada en vertical, siete medallones de lugar,
   un pergamino con lo que se puede hacer allí y «Pasar» siempre abajo. Solo usa la API de js/politeia.js (nueva, acciones, jugar, pasar, resumen).
   Provisional: solo hay Atenas (594 a.C.). Guardado en localStorage['aqvila-politeia-v1'] = P. Ver gobierno/specs/PL3.md. */
(function (root) {
  'use strict';
  const GUARDA = 'aqvila-politeia-v1', RUTA = 'assets/politeia/';
  const MUNDO = { w: 390, h: 1500 };
  // Lugares: posición del medallón en la ciudad (px del dibujo), nombre y qué se hace allí
  const LUGARES = [
    { id: 'santuario', n: 'Santuario', x: 195, y: 306, que: 'Las ofrendas a los dioses ganan voluntades y calman a la gente.' },
    { id: 'asamblea', n: 'Asamblea', x: 292, y: 540, que: 'El pueblo vota en la colina. Aquí se habla, se compra apoyo y se pregunta.' },
    { id: 'consejo', n: 'Consejo', x: 96, y: 636, que: 'Aquí se decide qué asuntos llegan al pueblo. Empuja los que te convienen.' },
    { id: 'tribunal', n: 'Tribunal', x: 296, y: 826, que: 'Los jueces del pueblo. Aquí se rinden cuentas y se defiende tu nombre.' },
    { id: 'agora', n: 'Ágora', x: 150, y: 952, que: 'La plaza: se murmura, se escucha y se espía a las casas.' },
    { id: 'casa', n: 'Tu casa', x: 290, y: 1160, que: 'Tu mesa y tus invitados. Un banquete gana amigos y suelta lenguas.' },
    { id: 'puerto', n: 'Puerto', x: 130, y: 1318, que: 'Llegan barcos y noticias. Un enviado trae favores de fuera.' }
  ];
  const ESTACION_INICIO = ['consejo', 'casa', 'asamblea', 'tribunal'];
  const ESTACION_NOMBRE = ['Primavera', 'Verano', 'Otoño', 'Invierno'];
  const ACTO = ['La agenda', 'Las intrigas', 'El debate', 'Las cuentas'];
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Emblemas de los medallones (trazos sencillos 24x24)
  const EMBLEMA = {
    consejo: 'M3 9l9-5 9 5zM5 11h14M6 12v7M10 12v7M14 12v7M18 12v7M3 20h18',
    casa: 'M3 12l9-8 9 8M6 11v9h12v-9M10 20v-5h4v5',
    agora: 'M3 8h18M5 8v12M12 8v12M19 8v12M3 20h18',
    asamblea: 'M3 19h18M5 19a7 7 0 0 1 14 0M8 19a4 4 0 0 1 8 0',
    tribunal: 'M12 4v16M6 20h12M4 8h16M4 8l-2 6a3 3 0 0 0 4 0zM20 8l-2 6a3 3 0 0 0 4 0z',
    santuario: 'M12 3c3 4 4 6 0 10-4-4-3-6 0-10zM7 20h10M9 14l-2 6M15 14l2 6',
    puerto: 'M12 3a2 2 0 1 0 0 4a2 2 0 0 0 0-4zM12 7v13M8 10h8M5 15c0 3 3 5 7 5s7-2 7-5M3 14l2 1M21 14l-2 1'
  };
  const emblema = id => '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + EMBLEMA[id] + '"/></svg>';

  let UI = null;   // estado de la pantalla abierta

  // ---------- Traducción a frases llanas ----------
  const REG = () => root.POLITEIA, DAT = () => root.POLITEIA.DATOS;
  const asuntoDe = (P, id) => DAT().polis[P.polis].asuntos.find(a => a.id === id);
  const casaTxt = (P, id) => id === 'tuya' ? 'tu casa' : 'la casa del ' + P.casas[id].nombre;
  const Mayus = s => s.charAt(0).toUpperCase() + s.slice(1);
  function frasePregunta(P, obj, de) {   // «sin nada concreto», «por su grieta…», «por «secreto»»
    if (obj === 'aire') return 'sin nada concreto';
    if (obj === 'grieta') return 'por ' + P.casas[de].grieta;
    const s = P.secretos.find(x => x.id === String(obj).slice(4)); return 'por «' + (s ? s.t : '…') + '»';
  }
  function fraseObjetivo(P, accion, obj) {
    obj = String(obj);
    if (obj.indexOf('>') > 0) { const p = obj.split('>'); const a = asuntoDe(P, p[1]); return 'Pedir a ' + casaTxt(P, p[0]) + ' su apoyo en «' + (a ? a.nombre : p[1]) + '»'; }
    if (/:[+-]$/.test(obj)) { const a = asuntoDe(P, obj.slice(0, -2)); return '«' + (a ? a.nombre : obj) + '» — ' + (obj.slice(-1) === '+' ? 'a favor' : 'en contra'); }
    if (obj === 'aire') return 'Una pregunta al aire (sin prueba)';
    const rival = P.duelo ? P.duelo.rival : (P.juicio ? P.juicio.acusador : null);
    if (obj === 'grieta') return 'Su grieta: ' + (rival ? P.casas[rival].grieta : 'un punto débil');
    if (obj.indexOf('sec:') === 0) { const s = P.secretos.find(x => x.id === obj.slice(4)); return 'Su secreto: «' + (s ? s.t : '…') + '»'; }
    const a = asuntoDe(P, obj); if (a) return '«' + a.nombre + '»';
    if (P.casas[obj]) return Mayus(casaTxt(P, obj));
    const pe = P.personas.find(x => x.id === obj);
    if (pe) return pe.nombre + (pe.labia >= 2 ? ', de buena lengua' : pe.labia === 1 ? ', de voz cansada' : '');
    return obj;
  }
  function fraseCoste(c) {
    const t = []; c = c || {};
    if (c.plata) t.push(c.plata + ' plata'); if (c.fama) t.push(c.fama + ' fama'); if (c.favor) t.push(c.favor + ' favor');
    if (c.pasos) t.push(c.pasos + (c.pasos === 1 ? ' paso' : ' pasos'));
    return t.join(' · ') || 'sin coste';
  }
  const VERBO_T = { verdad: 'dijiste la verdad', callar: 'callaste', mentir: 'mentiste' };
  const VERBO_R = { verdad: 'dijo la verdad', callar: 'calló', mentir: 'mintió' };
  function fraseLog(P, e) {
    const D = P.duelo, r = D ? D.rival : null;
    if (e.q === 'tuya') return 'Preguntaste a ' + casaTxt(P, r) + ' ' + frasePregunta(P, e.obj, r) + ': ' + VERBO_R[e.resp] + '.';
    return Mayus(casaTxt(P, r)) + ' te preguntó ' + frasePregunta(P, e.obj, 'tuya') + ': ' + VERBO_T[e.resp] + '.';
  }
  const lugarId = a => norm(a.lugar);

  // ---------- Guardado ----------
  function guarda() { try { root.localStorage.setItem(GUARDA, JSON.stringify(UI.P)); } catch (e) { /* se juega igual */ } }
  function carga(polis) {
    try { const s = root.localStorage.getItem(GUARDA); if (!s) return null; const P = JSON.parse(s); if (P && P.v && !P.fin && P.polis === polis && P.casas && P.agenda) return P; } catch (e) { /* nada */ }
    return null;
  }

  // ---------- Pantalla ----------
  function medallones() {
    return LUGARES.map(l => '<button type="button" class="pt-medallon" data-lugar="' + l.id + '" style="left:' + (l.x / MUNDO.w * 100).toFixed(2) + '%;top:' + l.y + 'px" aria-label="' + l.n + '">'
      + '<span class="pt-med-disco">' + emblema(l.id) + '<i class="pt-med-n"></i></span><span class="pt-med-nombre">' + l.n + '</span></button>').join('');
  }
  const figura = (cls, x, y, d, t, col) => '<span class="pt-fig ' + cls + '" style="left:' + x + 'px;top:' + y + 'px;--d:' + d + 'px;--t:' + t + 's"><svg viewBox="0 0 12 22" width="12" height="22" aria-hidden="true"><circle cx="6" cy="4" r="3" fill="' + col + '"/><path d="M2.5 8h7l2 12h-11z" fill="' + col + '"/></svg></span>';
  const nube = (y, t, delay, w) => '<span class="pt-nube" style="top:' + y + 'px;--t:' + t + 's;animation-delay:' + delay + 's;width:' + w + 'px"><svg viewBox="0 0 80 24" width="100%" aria-hidden="true"><path d="M6 20q-6 0-5-6q1-5 8-4q3-8 14-6q8 1 9 6q10-3 14 4q10-4 14 4q8 0 8 6z" fill="#fbf1d8" opacity=".85"/></svg></span>';
  const humo = (x, y, d) => '<span class="pt-humo" style="left:' + x + 'px;top:' + y + 'px;animation-delay:' + d + 's"></span>';
  function construye() {
    const d = root.document, el = d.createElement('div'); el.id = 'pt-raiz'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'La política de la polis');
    el.innerHTML = '<div id="pt-cifras"><div id="pt-cifras-txt"></div><button type="button" id="pt-salir">Salir</button></div>'
      + '<div id="pt-escena"><div id="pt-scroll"><div id="pt-mundo" style="height:' + MUNDO.h + 'px"><img id="pt-fondo" src="' + RUTA + 'ciudad.svg" alt="La ciudad" width="' + MUNDO.w + '" height="' + MUNDO.h + '" draggable="false">'
      + nube(70, 70, -10, 90) + nube(150, 95, -55, 70) + nube(40, 120, -90, 110)
      + humo(264, 232, 0) + humo(300, 1186, -1.5) + humo(60, 790, -.8)
      + figura('pt-anda', 90, 910, 70, 11, '#1c120c') + figura('pt-anda', 230, 1012, -90, 14, '#7a1f1f') + figura('pt-anda', 60, 1100, 120, 18, '#1c120c')
      + '<span class="pt-brilla" style="top:1262px"></span><span class="pt-brilla b2" style="top:1400px"></span>'
      + medallones() + '</div><div id="pt-mar"></div></div>'
      + '<div id="pt-cinta" hidden></div><div id="pt-pergamino" hidden></div><div id="pt-fin" hidden></div></div>'
      + '<button type="button" id="pt-pasar"></button>';
    return el;
  }

  function pintaCifras() {
    const P = UI.P, t = P.casas.tuya, e = Math.min(P.estacion, 3);
    let marcas = ''; for (let i = 0; i < 6; i++) marcas += '<i class="' + (i < P.discordia ? 'on' : '') + '"></i>';
    UI.q('#pt-cifras-txt').innerHTML = '<b>Atenas · ' + (-P.anio) + ' a.C.</b> · ' + ESTACION_NOMBRE[e]
      + '<br><span>pasos <b>' + P.pasos + '</b> · plata <b>' + t.plata + '</b> · fama <b>' + t.fama + '</b></span> <span class="pt-disc" title="Discordia ' + P.discordia + ' de 6">discordia ' + marcas + '</span>';
  }
  function accionesPorLugar() {
    const m = {}; for (const l of LUGARES) m[l.id] = [];
    for (const a of REG().acciones(UI.P)) { const k = lugarId(a); (m[k] || (m[k] = [])).push(a); }
    return m;
  }
  function pintaMedallones() {
    const m = accionesPorLugar(); UI.acc = m;
    for (const l of LUGARES) {
      const b = UI.q('.pt-medallon[data-lugar="' + l.id + '"]'), n = m[l.id].length;
      b.classList.toggle('hay', n > 0); b.classList.toggle('activo', UI.lugar === l.id);
      b.querySelector('.pt-med-n').textContent = n ? String(n) : '';
    }
  }
  function pintaPasar() {
    const P = UI.P, b = UI.q('#pt-pasar');
    b.hidden = !!P.fin; if (P.fin) return;
    const e = Math.min(P.estacion, 3);
    b.textContent = P.duelo ? 'Pasar (callar y seguir)' : 'Pasar · ' + ESTACION_NOMBRE[e] + ' (' + P.pasos + (P.pasos === 1 ? ' paso)' : ' pasos)');
  }

  // ---------- Cámara ----------
  function enfoca(id, zoom) {
    const l = LUGARES.find(x => x.id === id), sc = UI.q('#pt-scroll'), mu = UI.q('#pt-mundo'); if (!l) return;
    const hc = sc.clientHeight || 600, top = Math.max(0, Math.min(MUNDO.h + hc * 0.5 - hc, l.y - hc * (zoom ? 0.2 : 0.4)));
    if (zoom) { sc.classList.add('zoom'); sc.scrollTop = top; mu.style.transformOrigin = (l.x) + 'px ' + (l.y) + 'px'; mu.classList.add('cerca'); }
    else sc.scrollTop = top;
  }
  function alejaCamara() { const sc = UI.q('#pt-scroll'), mu = UI.q('#pt-mundo'); mu.classList.remove('cerca'); sc.classList.remove('zoom'); }

  // ---------- Pergamino ----------
  function abrirLugar(id) { UI.lugar = id; UI.paso = null; UI.msg = UI.msg && UI.msgLugar === id ? UI.msg : ''; enfoca(id, true); pintaPergamino(); pintaMedallones(); }
  function cerrarLugar() { if (UI.P.duelo) { UI.msg = ''; } UI.lugar = null; UI.paso = null; alejaCamara(); pintaPergamino(); pintaMedallones(); }
  function cabecera(titulo, extra) { return '<div class="pt-perg-cab"><b class="pt-perg-titulo">' + esc(titulo) + '</b>' + (extra || '') + '<button type="button" class="pt-cerrar" data-x="cerrar">Cerrar</button></div>'; }
  function botonAccion(a, pend) {
    const sub = a.objetivos ? 'elige a quién o qué' : fraseCoste(a.coste);
    return '<button type="button" class="pt-accion" data-id="' + a.id + '"><span class="pt-a-n">' + esc(a.nombre) + '</span><span class="pt-a-c">' + esc(a.objetivos ? fraseCoste(a.coste) + ' · ' + sub : sub) + '</span></button>';
  }
  function htmlDuelo() {
    const P = UI.P, D = P.duelo, A = asuntoDe(P, D.id), propio = D.lado === 'si' ? 'a favor' : 'en contra';
    const piedras = (n, c) => { let s = ''; const k = Math.max(0, Math.min(8, Math.abs(n))); for (let i = 0; i < k; i++) s += '<i></i>'; return '<span class="pt-piedras ' + c + (n < 0 ? ' neg' : '') + '">' + s + '</span> <b>' + (n > 0 ? '+' : '') + n + '</b>'; };
    let h = cabecera('El debate: «' + A.nombre + '»');
    h += '<p class="pt-linea">Defiendes el «' + (D.lado === 'si' ? 'sí' : 'no') + '» (' + propio + '). Te responde ' + casaTxt(P, D.rival) + '.</p>';
    h += '<div class="pt-balanza"><div>Tus piedras ' + piedras(D.mov.tuya, 'mia') + '</div><div>Las suyas ' + piedras(D.mov.rival, 'suya') + '</div></div>';
    if (D.log.length) h += '<ul class="pt-log">' + D.log.map(e => '<li>' + esc(fraseLog(P, e)) + '</li>').join('') + '</ul>';
    if (D.pend) h += '<p class="pt-pend">' + esc(Mayus(casaTxt(P, D.rival)) + ' ' + D.pend.texto + '.') + ' ¿Qué respondes?</p>';
    else if (D.fase === 'tuya') h += '<p class="pt-pend">' + (2 - D.q === 1 ? 'Te queda 1 pregunta' : 'Te quedan 2 preguntas') + ' para ' + casaTxt(P, D.rival) + '.</p>';
    return h;
  }
  function htmlJuicio() {
    const P = UI.P, J = P.juicio; if (!J) return '';
    const cargos = J.cargos.map(i => { const s = P.secretos.find(x => x.id === i); return '«' + (s ? s.t : '…') + '»'; }).join(', ');
    return '<p class="pt-linea">' + esc(Mayus(casaTxt(P, J.acusador))) + ' te acusa de ' + esc(cargos) + '.</p>'
      + '<ul class="pt-jueces">' + J.jueces.map(j => '<li class="' + (j.inc > 0 ? 'amigo' : j.inc < 0 ? 'hostil' : '') + '">' + esc(j.nombre) + '<small>' + (j.inc > 0 ? ' te favorece' : j.inc < 0 ? ' te es hostil' : ' sin inclinar') + '</small></li>').join('') + '</ul>';
  }
  function pintaPergamino() {
    const P = UI.P, pg = UI.q('#pt-pergamino');
    if (P.fin) { pg.hidden = true; return; }
    const id = UI.lugar; if (!id) { pg.hidden = true; pg.className = ''; return; }
    const l = LUGARES.find(x => x.id === id), lista = UI.acc[id] || [];
    const duelo = !!P.duelo && id === 'asamblea';
    pg.hidden = false; pg.className = duelo ? 'alto' : ''; pg.setAttribute('data-lugar', id);
    let h = '';
    if (UI.paso) {
      const a = UI.paso;
      h = cabecera(a.nombre, '') + '<p class="pt-linea">' + (a.id === 'preguntar' ? '¿Con qué prueba preguntas? ' : '¿A quién o a qué? ') + '<small>' + esc(fraseCoste(a.coste)) + '</small></p>'
        + '<div class="pt-lista">' + a.objetivos.map(o => '<button type="button" class="pt-objetivo" data-o="' + esc(o) + '">' + esc(fraseObjetivo(P, a.id, o)) + '</button>').join('') + '</div>'
        + '<button type="button" class="pt-atras" data-x="atras">Elegir otra cosa</button>';
    } else {
      if (duelo) h += htmlDuelo(); else {
        h += cabecera(l.n) + '<div class="pt-perg-vineta"><img src="' + RUTA + 'vineta-' + id + '.svg" alt="" width="200" height="120"><p class="pt-linea">' + esc(l.que) + '</p></div>';
        if (id === 'tribunal') h += htmlJuicio();
      }
      if (UI.msg && UI.msgLugar === id) h += '<p class="pt-resultado">' + esc(UI.msg) + '</p>';
      if (lista.length) h += '<div class="pt-lista">' + lista.map(a => botonAccion(a)).join('') + '</div>';
      else if (!duelo) h += '<p class="pt-vacio">Aquí no hay nada que hacer en esta estación.</p>';
    }
    pg.innerHTML = h; pg.scrollTop = 0;
  }

  // ---------- Fin del año ----------
  const FIN_TXT = { sigue: 'El año acaba y sigues en Atenas con tu casa en pie.', desterrado: 'Los jueces te condenan y te destierran diez años. Tu casa se queda sin cabeza.', revuelta: 'El pueblo pierde la paciencia y se alza en la ciudad. El año acaba en revuelta.' };
  const VEREDICTO = { limpio: 'Los jueces te absuelven y tu acusador queda en ridículo.', multa: 'Te condenan a una multa.', cargo: 'Te condenan y pierdes el cargo del año.', destierro: 'Te condenan al destierro.', ninguno: 'Nadie te acusó: no hubo juicio.' };
  function pintaFin() {
    const P = UI.P, el = UI.q('#pt-fin'); if (!P.fin) { el.hidden = true; return; }
    const t = P.casas.tuya, v = P.veredicto;
    let h = '<div class="pt-fin-caja"><b class="pt-perg-titulo">Fin del año</b><p class="pt-resultado">' + esc(FIN_TXT[P.fin.resultado] || P.fin.cronica || 'El año ha terminado.') + '</p>'
      + '<p class="pt-linea">Plata <b>' + t.plata + '</b> · fama <b>' + t.fama + '</b> · discordia <b>' + P.discordia + '/6</b></p>';
    if (P.votos.length) h += '<b class="pt-sub">Lo votado</b><ul class="pt-log">' + P.votos.map(x => { const a = asuntoDe(P, x.asunto); return '<li>«' + esc(a ? a.nombre : x.asunto) + '»: ' + (x.resultado === 'si' ? 'se aprueba' : 'se rechaza') + ' (' + x.piedras.si + ' a ' + x.piedras.no + ' piedras).</li>'; }).join('') + '</ul>';
    h += '<b class="pt-sub">El tribunal</b><p class="pt-linea">' + esc(v ? (VEREDICTO[v.tipo] || '') + (v.de ? ' (' + v.culpables + ' de ' + v.de + ' jueces te hallan culpable)' : '') : 'No llegaste al invierno: no hubo juicio.') + '</p>';
    h += '<b class="pt-sub">La crónica</b><ul class="pt-log cronica">' + P.cronica.slice(-10).map(c => '<li>' + esc(c.texto) + '</li>').join('') + '</ul>'
      + '<div class="pt-fin-botones"><button type="button" id="pt-otro" class="pt-accion">Otro año</button><button type="button" id="pt-fin-salir" class="pt-cerrar">Salir</button></div></div>';
    el.innerHTML = h; el.hidden = false; el.scrollTop = 0;
    UI.q('#pt-pergamino').hidden = true; alejaCamara();
  }

  // ---------- Acciones ----------
  function cinta(txt) {
    const c = UI.q('#pt-cinta'); if (!txt) { c.hidden = true; return; }
    c.textContent = txt; c.hidden = false; c.classList.remove('sube'); void c.offsetWidth; c.classList.add('sube');
    clearTimeout(UI.tcinta); UI.tcinta = setTimeout(() => { if (UI) c.hidden = true; }, 3200);
  }
  // Tras cualquier cambio: guardar, repintar y abrir solo el debate o el juicio cuando toque
  function despues(estAntes) {
    const P = UI.P; guarda(); pintaCifras(); UI.acc = accionesPorLugar();
    if (P.fin) { UI.lugar = null; pintaMedallones(); pintaPasar(); pintaFin(); return; }
    if (P.duelo) { if (UI.lugar !== 'asamblea') { UI.msg = ''; UI.paso = null; UI.lugar = 'asamblea'; enfoca('asamblea', true); } }
    else if (P.estacion !== estAntes) {
      UI.msg = ''; UI.paso = null; UI.juicioVisto = false;
      if (P.estacion === 3 && P.juicio) { UI.juicioVisto = true; UI.lugar = 'tribunal'; enfoca('tribunal', true); }
      else { UI.lugar = null; alejaCamara(); enfoca(ESTACION_INICIO[Math.min(P.estacion, 3)], false); }
    } else if (UI.lugar === 'asamblea' && !P.duelo && UI.estabaDuelo) { UI.lugar = null; alejaCamara(); }
    UI.estabaDuelo = !!P.duelo;
    pintaMedallones(); pintaPasar(); pintaPergamino();
  }
  function juega(id, obj) {
    const est = UI.P.estacion, lugarAntes = UI.lugar, r = REG().jugar(UI.P, id, obj);
    UI.paso = null; UI.msg = r.texto || ''; UI.msgLugar = lugarAntes;
    if (UI.P.duelo || lugarAntes === 'asamblea') UI.msgLugar = 'asamblea';
    if (UI.P.estacion !== est || UI.P.fin) cinta(r.texto);
    despues(est);
    if (!r.ok) { UI.msg = r.texto; UI.msgLugar = UI.lugar; pintaPergamino(); }
  }
  function pasa() {
    if (UI.P.fin) return;
    const est = UI.P.estacion, r = REG().pasar(UI.P);
    UI.msg = ''; cinta(r.texto); if (UI.P.duelo) { UI.msg = r.texto; UI.msgLugar = 'asamblea'; }
    despues(est);
  }
  function nuevoAnio() {
    const sem = (Math.floor(Math.random() * 1e6) + 1) | 0;
    UI.P = REG().nueva({ polis: UI.polis, semilla: sem }); UI.lugar = null; UI.paso = null; UI.msg = ''; UI.estabaDuelo = false;
    UI.q('#pt-fin').hidden = true; alejaCamara(); guarda(); pintaCifras(); pintaMedallones(); pintaPasar(); pintaPergamino();
    enfoca(ESTACION_INICIO[0], false);
  }
  function clic(e) {
    const t = e.target.closest('button'); if (!t) return;
    if (t.id === 'pt-salir' || t.id === 'pt-fin-salir') return cerrar();
    if (t.id === 'pt-pasar') return pasa();
    if (t.id === 'pt-otro') return nuevoAnio();
    if (t.classList.contains('pt-medallon')) { const id = t.getAttribute('data-lugar'); return UI.lugar === id ? cerrarLugar() : abrirLugar(id); }
    if (t.getAttribute('data-x') === 'cerrar') return cerrarLugar();
    if (t.getAttribute('data-x') === 'atras') { UI.paso = null; return pintaPergamino(); }
    if (t.classList.contains('pt-objetivo')) { return juega(UI.paso.id, t.getAttribute('data-o')); }
    if (t.classList.contains('pt-accion') && t.hasAttribute('data-id')) {
      const a = (UI.acc[UI.lugar] || []).find(x => x.id === t.getAttribute('data-id')); if (!a) return;
      if (a.objetivos) { UI.paso = a; return pintaPergamino(); }
      return juega(a.id);
    }
  }

  // ---------- API pública ----------
  function abrir(op) {
    op = op || {}; if (!root.POLITEIA) throw new Error('Falta js/politeia.js'); cerrar(true);
    const d = root.document, polis = op.polis || 'atenas';
    const P = carga(polis) || root.POLITEIA.nueva({ polis, semilla: op.semilla == null ? (Math.floor(Math.random() * 1e6) + 1) : op.semilla });
    const el = construye(); d.body.appendChild(el);
    UI = { el, P, polis, alSalir: op.alSalir, lugar: null, paso: null, msg: '', msgLugar: null, acc: {}, estabaDuelo: !!P.duelo, juicioVisto: false, q: s => el.querySelector(s) };
    el.addEventListener('click', clic);
    pintaCifras(); UI.acc = accionesPorLugar(); pintaMedallones(); pintaPasar(); pintaFin();
    if (P.duelo) { UI.lugar = 'asamblea'; enfoca('asamblea', true); pintaPergamino(); pintaMedallones(); }
    else if (!P.fin) enfoca(ESTACION_INICIO[Math.min(P.estacion, 3)], false);
    guarda();
    return el;
  }
  function cerrar(silencio) {
    const viejo = root.document.getElementById('pt-raiz'); if (viejo) viejo.remove();
    const u = UI; UI = null; if (u && u.tcinta) clearTimeout(u.tcinta);
    if (!silencio && u && typeof u.alSalir === 'function') { try { u.alSalir(); } catch (e) { /* nada */ } }
  }
  root.POLITEIA_UI = { abrir, cerrar, _estado: () => UI && UI.P };
})(typeof self !== 'undefined' ? self : globalThis);
