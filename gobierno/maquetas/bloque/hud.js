/* LP3 · Lo que se ve encima de la escena (LP0 §3, seis cosas como mucho):
   1) arriba, el objetivo y cómo va, en palabras · 2) la línea de choque (la pinta la escena: polvo y chispas)
   3) sobre cada bloque, su estandarte con un aro de color y una palabra · 4) avisos en el borde, nunca en medio
   5) una sola raya: el cansancio de la fila que pelea · 6) las cuatro órdenes; la que conviene se ilumina (sin texto).
   Y «Datos ▾», plegado: cifras de los dos bandos en una tira fina arriba.
   Contrato: crearHud({ $, proyecta, ladoEnPantalla, Son }) → { pon(C), tick(dt), aviso(tipo, d), muestraFin(), oculta() }
     proyecta(x, y, z) → [px, py, visible] · ladoEnPantalla(x, z) → −1 izquierda | 1 derecha (según la cámara) */
import { AGOTADA, centro } from '../../../js/bloque-ia.js';

const NOMBRE = { tuyo: 'Tu manípulo', amiga: 'Compañeros', centro: 'Su centro', ala: 'Galos', reserva: 'Su jefe', tiradores: 'Tiradores' };
const lim = (x, a, b) => Math.max(a, Math.min(b, x));

/* la palabra y el color del estandarte de un bloque: verde «fresca/firme», ámbar «cede/cansada», rojo «huye» */
export function palabraDe(b) {
  if (b.U.roto || b.estado === 'huye' || b.estado === 'fuera') return ['rojo', 'huye'];
  if (b.estado === 'reforma') return ['ambar', 'se rehace'];
  if (b.U.animo < 0.35) return ['ambar', 'cede'];
  if (b.fila >= AGOTADA) return ['ambar', 'agotada'];
  if (b.fila >= 0.4) return ['ambar', 'cansada'];
  if (b.bando === 'r' && b.orden === 'testudo') return ['verde', 'testudo'];
  if (b.contactos && b.contactos.length) return ['verde', 'firme'];
  return ['verde', 'fresca'];
}

export function crearHud({ $, proyecta, ladoEnPantalla, Son }) {
  let C = null, S = null, tocado = false, ests = [], tGrito = 0, tDatos = 0, salva = false, finHecho = false, tFin = -1;
  const cuenta = { jabSin: 0, jabCon: 0, pilum: 0, agotadaSinRelevo: 0 };
  const botones = [...document.querySelectorAll('.orden')];

  /* ---------- las cuatro órdenes ---------- */
  for (const el of botones) {
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('click', e => { e.stopPropagation(); if (!C) return; Son.toque && Son.toque(); C.orden(el.dataset.o); });
  }
  $('datosB').addEventListener('pointerdown', e => e.stopPropagation());
  $('datosB').addEventListener('click', () => { const ab = $('datos').hidden; $('datos').hidden = !ab; $('datosB').setAttribute('aria-expanded', String(ab)); $('datosB').textContent = ab ? 'Datos ▴' : 'Datos ▾'; tDatos = 0; });

  function pon(c) {
    C = c; S = c.S; tocado = false; finHecho = false; tFin = -1; salva = false; Object.keys(cuenta).forEach(k => { cuenta[k] = 0; });
    const cont = $('ests'); cont.textContent = ''; ests = [];
    for (const b of S.bloques) {
      if (b.papel === 'tiradores') continue;   /* tiradores sueltos: sin estandarte (lanzan y se retiran; un «huye» confundiría) */
      const el = document.createElement('div'); el.className = 'est ' + (b.bando === 'g' ? 'g' : 'r') + (b.papel === 'tuyo' ? ' tuyo' : '');
      el.innerHTML = '<i></i><s></s><b></b>'; cont.appendChild(el); ests.push({ b, el, w: el.querySelector('b'), clase: '', pal: '' });
    }
    $('fin').hidden = true; cont.style.visibility = ''; for (const id of ['borde-i', 'borde-d', 'borde-a']) $(id).classList.remove('ve', 'late');
  }

  function grito(t) { const g = $('grito'); g.textContent = t; g.classList.add('ve'); tGrito = 1.8; }

  /* cómo va, en palabras */
  function marcha() {
    const tu = S.tuyo, ce = S.ene.centro, R = S.ene.reserva;
    if (tu.U.roto) return ['Tu manípulo huye', 'mal'];
    if (S.flanco && S.flanco.de && S.flanco.de.estado !== 'fuera') { const l = ladoEnPantalla(S.flanco.de.x, S.flanco.de.z); return ['Su jefe viene por la ' + (l < 0 ? 'izquierda' : 'derecha'), 'mal']; }
    if (ce.U.roto) return R && !R.U.roto ? ['Su centro huye · queda su jefe', 'bien'] : ['Su centro huye', 'bien'];
    if (!tocado) {
      const c1 = centro(tu), c2 = centro(ce), d = Math.round(Math.hypot(c1.x - c2.x, c1.z - c2.z) - (tu.fondo + ce.fondo) / 2);
      if (!(tu.contactos && tu.contactos.length)) return ['Los galos están a ' + Math.max(0, d) + ' m', ''];
      tocado = true;
    }
    const r = tu.U.enPie / tu.U.hombres * (0.5 + tu.U.animo), g = ce.U.enPie / ce.U.hombres * (0.5 + ce.U.animo), d = r - g;
    const extra = ce.U.animo < 0.35 ? ' · su centro cede' : tu.U.animo < 0.35 ? ' · los tuyos ceden' : '';
    return d > 0.15 ? ['Vais ganando' + extra, 'bien'] : d < -0.15 ? ['Vais perdiendo' + extra, 'mal'] : ['Igualado' + extra, ''];
  }

  function datos() {
    const tu = S.tuyo, pct = x => Math.round(x * 100), e = S.ene, enPie = (...bs) => bs.reduce((s, b) => s + (b ? b.U.enPie : 0), 0);
    $('datos-r').innerHTML = `<b>Tuyos</b> · ${tu.U.enPie} de ${tu.U.hombres} · moral ${pct(tu.U.animo)} · cohesión ${Math.round(tu.coh)} · relevos ${tu.relevos} · compañeros ${enPie(...S.amigas)}`;
    $('datos-g').innerHTML = `<b>Galos</b> · centro ${e.centro.U.enPie} (moral ${pct(e.centro.U.animo)}) · jefe ${e.reserva.U.enPie} · alas ${enPie(...e.alas)} · tiradores ${e.tiradores.U.enPie}`;
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
    const util = C.ordenUtil();
    for (const el of botones) {
      const o = el.dataset.o, vig = o === 'relevo' ? tu.tRelevo > S.T : tu.orden === o;
      el.classList.toggle('vigente', vig); el.classList.toggle('luz', o === util && !vig);
      el.classList.toggle('apagada', !!(S.ganador || tu.U.roto || (o === 'relevo' && tu.relevos <= 0)));
    }
    $('relevos').textContent = tu.relevos;
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
      const t = (b.papel === 'tuyo' || b.papel === 'reserva' || b.papel === 'centro' ? NOMBRE[b.papel] + ' · ' : '') + p;
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
      case 'rompe': if (d.de === S.ene.centro) grito('¡Su centro huye!'); else if (d.de === S.tuyo) grito('¡Los tuyos huyen!'); break;
      case 'fin': tFin = 2.5; break;
    }
  }

  /* la tarjeta del final: qué pasó, qué más pesó y qué costó */
  function muestraFin() {
    if (finHecho) return; finHecho = true;
    const r = C.resumen(), gana = r.ganador === 'tuyo', mm = Math.floor(r.T / 60), ss = String(Math.round(r.T % 60)).padStart(2, '0');
    $('fin-t').textContent = gana ? 'Victoria' : r.ganador === 'enemigo' ? 'Derrota' : 'Tablas';
    $('fin-p').textContent = (gana ? 'Rompiste su centro' : 'Tu manípulo rompió') + ` en ${mm}:${ss}. Perdiste ${r.perdidos} de 120; cayeron ${r.matados} galos.`;
    const peso = [], costo = [];
    if (r.salvasTestudo) peso.push(r.salvasTestudo === r.salvas ? `El testudo paró ${r.salvas > 1 ? 'las ' + r.salvas + ' salvas' : 'la salva'} de jabalinas.` : `El testudo paró ${r.salvasTestudo} de ${r.salvas} salvas de jabalinas.`);
    if (cuenta.pilum) peso.push(`Tu pilum mató a ${cuenta.pilum} antes del choque.`);
    if (r.relevos) peso.push(`${r.relevos} relevo${r.relevos > 1 ? 's' : ''}: tu primera fila peleó fresca.`);
    if (r.cargas) peso.push('La carga los hizo ceder al chocar.');
    if (r.flanqueado) costo.push('Su jefe entró por tu flanco: allí cada golpe pesa el doble.');
    if (cuenta.jabSin) costo.push(`Las jabalinas mataron a ${cuenta.jabSin} sin testudo.`);
    if (cuenta.agotadaSinRelevo || (!r.relevos && r.perdidos > 30)) costo.push('Tu fila se agotó sin relevo.');
    if (r.fintas && r.flanqueado) costo.push('Su jefe fintó: amagó un lado y entró por el otro.');
    if (!r.cargas) costo.push('No cargaste: chocaron sin tu golpe de carga.');
    $('fin-c').innerHTML = (peso.length ? '<p><b>Lo que más pesó:</b> ' + peso.slice(0, 2).join(' ') + '</p>' : '') + (costo.length ? '<p><b>Lo que costó:</b> ' + costo.slice(0, 2).join(' ') + '</p>' : '');
    $('fin').hidden = false; $('ests').style.visibility = 'hidden';
  }
  return { pon, tick, aviso, muestraFin, grito };
}
