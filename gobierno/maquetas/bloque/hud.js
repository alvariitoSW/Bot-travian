/* LP3 · Lo que se ve encima de la escena (LP0 §3, seis cosas como mucho):
   1) arriba, el objetivo y cómo va, en palabras · 2) la línea de choque (la pinta la escena: polvo y chispas)
   3) sobre cada bloque, su estandarte con un aro de color y una palabra · 4) avisos en el borde, nunca en medio
   5) una sola raya: el cansancio de la fila que pelea · 6) las cuatro órdenes; la que conviene se ilumina (sin texto).
   LP4b · Trabados: mientras tu manípulo está en el choque, su estandarte lleva la placa «Trabados» y el botón «Alto» se
   vuelve «Retirada» (siempre cuatro botones). Tocar «Testudo» cuando ya lo tienes lo abre.
   LP4b (4B): cuando conviene girar hacia su jefe (C.giroUtil()), una raya dorada en el suelo marca el frente; tocarla gira ahí.
   Y «Datos ▾», plegado: cifras de los dos bandos en una tira fina arriba.
   Contrato: crearHud({ $, proyecta, ladoEnPantalla, Son }) → { pon(C), tick(dt), aviso(tipo, d), muestraFin(), oculta() }
     proyecta(x, y, z) → [px, py, visible] · ladoEnPantalla(x, z) → −1 izquierda | 1 derecha (según la cámara) */
import { AGOTADA, COH_ORDEN, centro } from '../../../js/bloque-ia.js';

const NOMBRE = { tuyo: 'Tu manípulo', amiga: 'Compañeros', centro: 'Su centro', ala: 'Galos', reserva: 'Su jefe', tiradores: 'Tiradores' };
/* LP7: desde la batalla grande el rival puede no ser galo: S.rival = { los: 'los cartagineses', Los: 'Cartagineses' } (si no, galos) */
const RIVAL = { los: 'los galos', Los: 'Galos' };
/* FU3: la falange da su rival por nombre (js/falange-rivales.js) */
const RIVAL_NOMBRE = { manipulos: { los: 'los manípulos', Los: 'Los manípulos' } };
const rival = S => (S && S.rival && (typeof S.rival === 'string' ? RIVAL_NOMBRE[S.rival] : S.rival)) || RIVAL;
const lim = (x, a, b) => Math.max(a, Math.min(b, x));

/* la palabra y el color del estandarte de un bloque: verde «fresca/firme», ámbar «cede/cansada», rojo «huye» */
export function palabraDe(b) {
  if (b.U.roto || b.estado === 'huye' || b.estado === 'fuera') return ['rojo', 'huye'];
  if (b.estado === 'retira') return ['ambar', 'se retira'];
  if (b.estado === 'reforma') return ['ambar', 'se rehace'];
  if (b.U.animo < 0.35) return ['ambar', 'cede'];
  if (b.fila >= AGOTADA) return ['ambar', 'agotada'];
  if (b.fila >= 0.4) return ['ambar', 'cansada'];
  if (b.bando === 'r' && b.orden === 'testudo') return ['verde', 'testudo'];
  if (b.contactos && b.contactos.length) return ['verde', 'firme'];
  return ['verde', 'fresca'];
}

/* el cuarto botón: «Alto» fuera del choque, «Retirada» mientras estás trabado (o retrocediendo) */
const CUARTO = {
  alto: { o: 'alto', t: 'Alto', svg: '<path d="M7 11h18M7 16h18M7 21h18"/>' },
  retirada: { o: 'retirada', t: 'Retirada', svg: '<path d="M16 6v16"/><path d="M10 16l6 6 6-6"/><path d="M7 27h18"/>' },
};
/* FU3: las órdenes de cada formación, con su palabra y su dibujo (las del manípulo están en index.html) */
const ORDEN = {
  testudo: { t: 'Testudo', svg: '<path d="M5 19c0-6 5-11 11-11s11 5 11 11"/><path d="M5 19h22M10 19v6M16 19v6M22 19v6M8.5 13.5h15M16 8v11"/>' },
  cargar: { t: 'Cargar', svg: '<path d="M9 20l7-7 7 7"/><path d="M9 27l7-7 7 7"/><path d="M16 4v8"/><path d="M13 7l3-3 3 3"/>' },
  relevo: { t: 'Relevo', svg: '<path d="M10 25V9M6 13l4-4 4 4"/><path d="M22 7v16M18 19l4 4 4-4"/>' },
  alto: CUARTO.alto,
  picas: { t: 'Bajar picas', svg: '<path d="M6 26L26 10"/><path d="M10 27L28 14"/><path d="M23 9l4 0-1 4"/>' },
  cerrar: { t: 'Cerrar filas', svg: '<path d="M6 10h20M6 16h20M6 22h20"/><path d="M4 7l4 3-4 3M28 7l-4 3 4 3"/>' },
  avanzar: { t: 'Avanzar', svg: '<path d="M9 22l7-7 7 7"/><path d="M16 15v13"/><path d="M9 12l7-7 7 7"/>' }
};

export function crearHud({ $, proyecta, ladoEnPantalla, Son }) {
  let C = null, S = null, tocado = false, ests = [], tGrito = 0, tDatos = 0, salva = false, finHecho = false, tFin = -1, tAvisoTrabado = -9, cuarto = 'alto', suelta = 0;
  const cuenta = { jabSin: 0, jabCon: 0, pilum: 0, agotadaSinRelevo: 0 };
  const botones = [...document.querySelectorAll('.orden')];
  const b4 = botones.find(el => el.dataset.o === 'alto');
  if (b4) { const sm = document.createElement('small'); sm.id = 'retiradas'; sm.hidden = true; b4.appendChild(sm); }
  let conRetirada = true;
  /* FU3: pone los cuatro botones de la formación (lista de 4 órdenes); retirada: false = el cuarto no pasa a «Retirada» al trabarse */
  function ordenes(lista, { retirada = true, tuyo } = {}) {
    conRetirada = retirada; if (tuyo) NOMBRE.tuyo = tuyo;
    lista.forEach((o, i) => { const el = botones[i], c = ORDEN[o]; if (!el || !c) return; el.dataset.o = o; el.setAttribute('aria-label', c.t); el.querySelector('b').textContent = c.t; el.querySelector('svg').innerHTML = c.svg;
      const sm = el.querySelector('small#relevos'); if (sm) sm.hidden = o !== 'relevo'; });
  }
  function ponCuarto(k) {
    if (!b4 || k === cuarto) return; cuarto = k; const c = CUARTO[k];
    b4.dataset.o = c.o; b4.setAttribute('aria-label', c.t); b4.querySelector('b').textContent = c.t; b4.querySelector('svg').innerHTML = c.svg;
    $('retiradas').hidden = k !== 'retirada'; b4.classList.toggle('cambia', true); setTimeout(() => b4.classList.remove('cambia'), 600);
  }

  /* ---------- las cuatro órdenes ---------- */
  for (const el of botones) {
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('click', e => { e.stopPropagation(); if (!C) return; Son.toque && Son.toque(); C.orden(el.dataset.o); });
  }
  $('datosB').addEventListener('pointerdown', e => e.stopPropagation());
  /* la raya dorada: tocarla dibuja ese frente */
  let giro = null, giroVisto = false;
  $('giro-t').addEventListener('pointerdown', e => e.stopPropagation());
  $('giro-t').addEventListener('click', e => { e.stopPropagation(); if (C && giro) { Son.toque && Son.toque(); C.frente(giro); } });
  function pintaGiro(g) {
    giro = g; const sv = $('giro'); if (!g) { sv.toggleAttribute('hidden', true); return; }   /* (un svg no tiene .hidden) */
    const tu = S.tuyo, w = tu.ancho / 2, F = { x: Math.sin(g.ang), z: -Math.cos(g.ang) }, D = { x: Math.cos(g.ang), z: Math.sin(g.ang) };
    const P = (l, d) => proyecta(g.x + D.x * l + F.x * d, 0.2, g.z + D.z * l + F.z * d);
    const a = P(-w, 0), b = P(w, 0); if (!a[2] && !b[2]) { sv.toggleAttribute('hidden', true); return; }
    sv.toggleAttribute('hidden', false); const L = `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    $('giro-l').setAttribute('d', L); $('giro-t').setAttribute('d', L);
    let f = '';   /* tres flechas: hacia dónde mirará la primera fila */
    for (const k of [-0.6, 0, 0.6]) { const q = P(k * w, 6.5), l = P(k * w - 0.9, 1.2), r = P(k * w + 0.9, 1.2);
      f += `M${q[0].toFixed(1)},${q[1].toFixed(1)}L${l[0].toFixed(1)},${l[1].toFixed(1)}L${r[0].toFixed(1)},${r[1].toFixed(1)}Z`; }
    $('giro-f').setAttribute('d', f);
  }
  $('datosB').addEventListener('click', () => { const ab = $('datos').hidden; $('datos').hidden = !ab; $('datosB').setAttribute('aria-expanded', String(ab)); $('datosB').textContent = ab ? 'Datos ▴' : 'Datos ▾'; tDatos = 0; });

  function pon(c) {
    C = c; S = c.S; tocado = false; finHecho = false; tFin = -1; salva = false; Object.keys(cuenta).forEach(k => { cuenta[k] = 0; });
    const cont = $('ests'); cont.textContent = ''; ests = [];
    for (const b of S.bloques) {
      if (b.papel === 'tiradores') continue;   /* tiradores sueltos: sin estandarte (lanzan y se retiran; un «huye» confundiría) */
      const el = document.createElement('div'); el.className = 'est ' + (b.bando === 'g' ? 'g' : 'r') + (b.papel === 'tuyo' ? ' tuyo' : '');
      el.innerHTML = (b.papel === 'tuyo' ? '<em>Trabados</em>' : '') + '<i></i><s></s><b></b>'; cont.appendChild(el); ests.push({ b, el, w: el.querySelector('b'), clase: '', pal: '', trab: false });
    }
    cuarto = ''; ponCuarto('alto'); suelta = 0; giro = null; giroVisto = false; $('giro').toggleAttribute('hidden', true);
    $('fin').hidden = true; cont.style.visibility = ''; for (const id of ['borde-i', 'borde-d', 'borde-a']) $(id).classList.remove('ve', 'late');
  }

  function grito(t) { const g = $('grito'); g.textContent = t; g.classList.add('ve'); tGrito = 1.8; }

  /* cómo va, en palabras */
  function marcha() {
    const tu = S.tuyo, ce = S.ene.centro, R = S.ene.reserva;
    if (tu.U.roto) return ['Tu manípulo huye', 'mal'];
    if (tu.estado === 'retira') return tu.coh >= COH_ORDEN ? ['Retirada en orden' + (suelta ? ' · cayeron ' + suelta : ''), ''] : ['Retirada en desorden: os persiguen', 'mal'];
    if (tu.estado === 'reforma') return ['Os rehacéis · ' + Math.max(1, Math.ceil(tu.tReforma - S.T)) + ' s', 'bien'];
    if (giro && tu.vueltas) return ['Toca la raya dorada: gira', 'mal'];
    if (S.flanco && S.flanco.de && S.flanco.de.estado !== 'fuera') { const l = ladoEnPantalla(S.flanco.de.x, S.flanco.de.z); return ['Su jefe viene por la ' + (l < 0 ? 'izquierda' : 'derecha'), 'mal']; }
    if (ce.U.roto) return R && R.estado !== 'fuera' && !R.U.roto ? ['Su centro huye · queda su jefe', 'bien'] : ['Su centro huye', 'bien'];
    /* FU1: cruzando hacia la colina (escenario del testudo) */
    if (S.escenario && S.escenario.fase === 'cruza') { const c0 = centro(tu), m = S.escenario.meta, d0 = Math.round(Math.hypot(c0.x - m.x, c0.z - m.z) - m.r); return [d0 <= 0 ? 'En la colina: aguanta' : 'Colina a ' + d0 + ' m', '']; }
    if (!tocado) {
      const c1 = centro(tu), c2 = centro(ce), d = Math.round(Math.hypot(c1.x - c2.x, c1.z - c2.z) - (tu.fondo + ce.fondo) / 2);
      if (!(tu.contactos && tu.contactos.length)) return [rival(S).Los + ' a ' + Math.max(0, d) + ' m', ''];
      tocado = true;
    }
    const r = tu.U.enPie / tu.U.hombres * (0.5 + tu.U.animo), g = ce.U.enPie / ce.U.hombres * (0.5 + ce.U.animo), d = r - g;
    const extra = ce.U.animo < 0.35 ? ' · su centro cede' : tu.U.animo < 0.35 ? ' · los tuyos ceden' : '';
    return d > 0.15 ? ['Vais ganando' + extra, 'bien'] : d < -0.15 ? ['Vais perdiendo' + extra, 'mal'] : ['Igualado' + extra, ''];
  }

  function datos() {
    const tu = S.tuyo, pct = x => Math.round(x * 100), e = S.ene, enPie = (...bs) => bs.reduce((s, b) => s + (b && b.estado !== 'fuera' ? b.U.enPie : 0), 0);
    $('datos-r').innerHTML = `<b>Tuyos</b> · ${tu.U.enPie} de ${tu.U.hombres} · moral ${pct(tu.U.animo)} · cohesión ${Math.round(tu.coh)} · relevos ${tu.relevos} · retiradas ${tu.retiradas} · compañeros ${enPie(...S.amigas)}`;
    $('datos-g').innerHTML = `<b>${rival(S).Los}</b> · centro ${e.centro.U.enPie} (moral ${pct(e.centro.U.animo)}) · jefe ${enPie(e.reserva)} · alas ${enPie(...e.alas)} · tiradores ${enPie(e.tiradores)}`;
  }

  /* el borde de un lado: franja roja con su frase */
  function borde(lado, texto, late) {
    for (const [id, l] of [['borde-i', -1], ['borde-d', 1]]) {
      const on = texto && l === lado; $(id).classList.toggle('ve', !!on); $(id).classList.toggle('late', !!(on && late));
      if (on) $(id + '-t').textContent = texto;
    }
  }

  function tick(dt) {
    if (!S) return;
    const tu = S.tuyo;
    /* órdenes: la vigente rellena, la útil iluminada */
    const trab = !S.ganador && !tu.U.roto && (C.trabado() || tu.estado === 'retira');
    ponCuarto(trab && conRetirada ? 'retirada' : 'alto');
    const util = C.ordenUtil();
    const g = C.giroUtil(); pintaGiro(g);
    if (g && tu.vueltas && !giroVisto) { giroVisto = true; grito('¡Su jefe vuelve! Girad'); } else if (!g) giroVisto = false;
    for (const el of botones) {
      const o = el.dataset.o, vig = o === 'relevo' ? tu.tRelevo > S.T : o === 'retirada' ? tu.estado === 'retira' : tu.orden === o;
      el.classList.toggle('vigente', vig); el.classList.toggle('luz', o === util && (!vig || o === 'testudo'));   /* Testudo vigente e iluminado: tócalo para abrirlo */
      el.classList.toggle('apagada', !!(S.ganador || tu.U.roto || (o === 'relevo' && tu.relevos <= 0) || (o === 'retirada' && tu.retiradas <= 0 && !vig) || (tu.estado === 'retira' && o !== 'retirada')));
    }
    $('relevos').textContent = tu.relevos; if ($('retiradas')) $('retiradas').textContent = tu.retiradas;
    /* la raya: cansancio de la fila que pelea */
    const f = lim(tu.fila || 0, 0, 1), pal = tu.tRelevo > S.T ? 'relevando' : f >= AGOTADA ? 'agotada' : f >= 0.4 ? 'cansada' : 'fresca';
    $('barra-b').style.width = Math.round((1 - f) * 100) + '%';
    $('barra-b').style.background = f >= AGOTADA ? 'var(--rojo)' : f >= 0.4 ? 'var(--ambar)' : 'var(--verde)';
    $('raya-t').innerHTML = 'Fila que pelea · <b>' + pal + '</b>';
    /* cómo va */
    const [m, cl] = marcha(); if ($('marcha').textContent !== m) $('marcha').textContent = m; $('marcha').className = cl;
    /* estandartes */
    for (const E of ests) {
      const b = E.b, c = centro(b), [px, py, vis] = proyecta(c.x, 3.6, c.z);
      if (!vis || b.estado === 'fuera') { E.el.style.display = 'none'; continue; }
      E.el.style.display = ''; E.el.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) translate(-50%,-100%)`;
      const [col, p] = palabraDe(b); if (col !== E.clase) { E.el.classList.remove('verde', 'ambar', 'rojo'); E.el.classList.add(col); E.clase = col; }
      const tb = trab && tu.estado !== 'retira';   /* la placa, solo mientras sigue dentro */
      if (b === tu && tb !== E.trab) { E.el.classList.toggle('trabado', tb); E.trab = tb; }
      const t = (b.papel === 'tuyo' || b.papel === 'reserva' || b.papel === 'centro' ? (b.papel === 'ala' ? rival(S).Los : NOMBRE[b.papel]) + ' · ' : '') + p;
      if (t !== E.pal) { E.w.textContent = t; E.pal = t; }
    }
    /* avisos en el borde: flanco que viene, o enemigo pegado por tu costado */
    let lado = 0, texto = '', late = false;
    const deLado = (tu.contactos || []).find(c => c.zona !== 'frente');
    if (deLado) { lado = ladoEnPantalla(deLado.b.x, deLado.b.z); texto = deLado.zona === 'espalda' ? '¡Por la espalda!' : '¡Te atacan por el flanco!'; late = true; }
    else if (S.flanco && S.flanco.de && !S.ganador) { lado = ladoEnPantalla(S.flanco.de.x, S.flanco.de.z); texto = S.flanco.finta ? '¡Era una finta! Su jefe viene por aquí' : '¡Su jefe va a tu ' + (lado < 0 ? 'izquierda' : 'derecha') + '!'; }
    if (S.ganador) texto = '';
    borde(lado, texto, late);
    $('borde-a').classList.toggle('ve', salva && !!S.salva);
    /* grito */
    if (tGrito > 0 && (tGrito -= dt) <= 0) $('grito').classList.remove('ve');
    /* datos */
    if (!$('datos').hidden && (tDatos -= dt) <= 0) { datos(); tDatos = 0.4; }
    if (tFin > 0 && (tFin -= dt) <= 0) muestraFin();
  }

  function aviso(tipo, d) {
    if (!S) return;
    switch (tipo) {
      case 'orden': grito(d.texto); break;
      case 'salva': salva = d.blanco === S.tuyo; break;
      case 'jabalinas': if (d.blanco === S.tuyo) { if (d.testudo) cuenta.jabCon += d.muertos; else cuenta.jabSin += d.muertos; } salva = false; break;
      case 'pilum': cuenta.pilum += d.muertos; break;
      case 'agotada': if (d.de === S.tuyo && S.tuyo.relevos <= 0) cuenta.agotadaSinRelevo++; break;
      case 'rompe': if (d.de === S.ene.centro) grito('¡Su centro huye!'); else if (d.de === S.tuyo) grito(S.cuenta.rotaRetira ? '¡Se rompen al retirarse!' : '¡Los tuyos huyen!'); break;
      /* LP4b: trabados y retirada */
      case 'trabado': if (S.T - tAvisoTrabado > 4) { tAvisoTrabado = S.T; grito('¡Trabados! Solo giran'); } break;
      case 'retirandose': if (S.T - tAvisoTrabado > 4) { tAvisoTrabado = S.T; grito('Retroceden: esperad'); } break;
      case 'suelta': if (d.de === S.tuyo) suelta = d.muertos; break;
      case 'retira': if (d.de === S.ene.centro) grito('¡Su centro se retira a formar!'); else if (d.de === S.ene.reserva) grito('¡Su jefe se retira a formar!'); break;
      case 'vuelve': if (d.de === S.tuyo) grito('¡Formados! Fila fresca'); break;
      case 'escenario': if (d.fase === 'carga') grito('¡Los galos cargan!'); break;   /* FU1 */
      case 'fin': tFin = 2.5; break;
    }
  }

  /* la tarjeta del final: qué pasó, qué más pesó y qué costó */
  function muestraFin() {
    if (finHecho) return; finHecho = true;
    /* FU4: el resumen de la falange dice 'falange'/'rival'; su S.ganador ya viene traducido a 'tuyo'/'enemigo' */
    const r = C.resumen(), fal = !!S.fal, gan = fal ? S.ganador : r.ganador, gana = gan === 'tuyo', mm = Math.floor(r.T / 60), ss = String(Math.round(r.T % 60)).padStart(2, '0');
    $('fin-t').textContent = gana ? 'Victoria' : gan === 'enemigo' ? 'Derrota' : 'Tablas';
    $('fin-p').textContent = (gana ? (fal ? 'Rompiste a ' + rival(S).los : 'Rompiste su centro') : gan === 'enemigo' ? (fal ? 'Tu falange se rompió' : 'Tu manípulo rompió') : 'La lucha acabó') + ` en ${mm}:${ss}. Perdiste ${r.perdidos} de ${S.tuyo.U.hombres}; cayeron ${r.matados} de ${rival(S).los}.` + (S.tuyo.U.fin ? ' Lucharon hasta quedar el 15 %.' : '');
    const peso = [], costo = [];
    if (r.salvasTestudo) peso.push(r.salvasTestudo === r.salvas ? `El testudo paró ${r.salvas > 1 ? 'las ' + r.salvas + ' salvas' : 'la salva'} de jabalinas.` : `El testudo paró ${r.salvasTestudo} de ${r.salvas} salvas de jabalinas.`);
    if (cuenta.pilum) peso.push(`Tu pilum mató a ${cuenta.pilum} antes del choque.`);
    if (r.relevos) peso.push(`${r.relevos} relevo${r.relevos > 1 ? 's' : ''}: tu primera fila peleó fresca.`);
    if (r.cargas) peso.push('La carga los hizo ceder al chocar.');
    if (r.retiradas && !r.rotaRetira) peso.push(`Te retiraste en orden ${r.retiradas > 1 ? r.retiradas + ' veces' : 'a tiempo'}: al soltarte cayeron ${r.muertosSuelta}, pero volviste fresco.`);
    if (r.rotaRetira) costo.push('Te retiraste con las filas deshechas y se rompieron.');
    if (r.flanqueado) costo.push('Su jefe entró por tu flanco: allí cada golpe pesa el doble.');
    if (cuenta.jabSin) costo.push(`Las jabalinas mataron a ${cuenta.jabSin} sin testudo.`);
    if (cuenta.agotadaSinRelevo || (!r.relevos && r.perdidos > 30)) costo.push('Tu fila se agotó sin relevo.');
    if (r.fintas && r.flanqueado) costo.push('Su jefe fintó: amagó un lado y entró por el otro.');
    if (!r.cargas && !fal) costo.push('No cargaste: chocaron sin tu golpe de carga.');
    $('fin-c').innerHTML = (peso.length ? '<p><b>Lo que más pesó:</b> ' + peso.slice(0, 2).join(' ') + '</p>' : '') + (costo.length ? '<p><b>Lo que costó:</b> ' + costo.slice(0, 2).join(' ') + '</p>' : '');
    $('fin').hidden = false; $('ests').style.visibility = 'hidden';
  }
  return { pon, tick, aviso, muestraFin, grito, ordenes };
}
