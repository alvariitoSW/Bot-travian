/* AQVILA — MN4c · Portada y láminas; PN1 · menú de inicio «Continuar · Partida nueva · Escaramuzas · Opciones». Script clásico, no toca la lógica del juego.
   - Pone la clase `portada` en <body> y, cada vez que ui.js repinta #menu, le añade la capa de fondo (lámina de época) si falta.
   - PN1: tras cada repintado reordena el menú (decora(), idempotente). Quita las filas «Nueva campaña», «Partida corta» y «Región de Italia»
     y pone delante «Partida nueva». Lleva su propia vista: 'inicio' (Continuar, o «Bienvenido» si no hay partida), 'nueva' (pantalla provisional:
     Grecia llega en la próxima versión; mientras, partida corta, Región de Italia o la campaña Roma contra Cartago, en pausa) y 'campana'
     (la tarjeta de nueva campaña de ui.js con la etiqueta «En pausa»). Sus botones usan data-pn (no data-act: ese lo atiende ui.js).
     window.PORTADA.vista(v) cambia la vista desde las pruebas.
   - Expone window.LAMINAS, window.laminaHtml(clave) y window.miniEdif(id, nivel) para que ui.js vista Saber, Senado, Tropas, Imperio y las fichas de edificio.
   Imágenes: assets/laminas/ — renders de modelos de 0 A.D. (Wildfire Games, CC BY-SA 3.0), derivados por Proyecto AQVILA. */
(function () {
  'use strict';
  var PIE = 'Render de 0 A.D. · CC BY-SA 3.0', BASE = window.LAMINAS_BASE || 'assets/laminas/';   // la maqueta pone otra ruta
  var EDIF = { aserradero: 1, cantera: 1, mina: 1, granja: 1, viviendas: 1, foro: 1, almacen: 1, mercado: 1, puerto: 1, cuartel: 1, establo: 1, muralla: 1, templo: 1, acueducto: 1, compitum: 1 };
  var L = { saber: { src: BASE + 'saber.webp', pie: PIE }, senado: { src: BASE + 'senado.webp', pie: PIE }, tropas: { src: BASE + 'tropas.webp', pie: PIE }, imperio: { src: BASE + 'imperio.webp', pie: PIE },
    edif: function (id) { return EDIF[id] ? BASE + 'edif/' + id + '.webp' : null; } };
  window.LAMINAS = L;
  window.laminaHtml = function (clave) {
    var l = L[clave]; if (!l || !l.src) return '';
    return '<figure class="as-lamina"><img src="' + l.src + '" alt="" loading="lazy"><figcaption>' + l.pie + '</figcaption></figure>';
  };
  /* miniatura del contrato MN4a (.as-mini); sin modelo propio devuelve '' y ui.js deja su icono de siempre */
  window.miniEdif = function (id, nivel, extra) {
    var s = L.edif(id); if (!s) return '';
    return '<span class="as-mini claro' + (extra ? ' ' + extra : '') + '"><img src="' + s + '" alt="" loading="lazy">' + (nivel ? '<span class="nv">Nv ' + nivel + '</span>' : '') + '</span>';
  };
  function fondo(m) {
    if (m.firstElementChild && m.firstElementChild.classList.contains('pt-fondo')) return;
    var d = document.createElement('div'); d.className = 'pt-fondo'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<picture><source media="(orientation: landscape)" srcset="' + BASE + 'portada-h.webp"><img src="' + BASE + 'portada-v.webp" alt="" decoding="async"></picture>';
    m.insertBefore(d, m.firstChild);
  }
  /* ===== PN1 · menú de inicio ===== */
  var vista = 'inicio';
  var ESPADA = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7L9 22l-3-3zM6 15l3 3M4 17l3 3M3 21l2-2"/></svg>';
  var PAUSA = '<span class="pn-pausa">En pausa</span>';
  function opcion(attrs, t, d, extra) {
    return '<button class="pn-op" ' + attrs + '><span class="pn-opt"><b>' + t + '</b>' + (extra || '') + '</span><small>' + d + '</small></button>';
  }
  // la duración sale de los datos (D.MODOS.corta), la misma que enseña la hoja de la partida corta
  function horasCorta() {
    var D = window.DATA, d = D && D.MODOS && D.MODOS.corta && D.MODOS.corta.duracion;
    return d ? 'De ' + d.horasMin + ' a ' + d.horasMax + ' horas, con final' : 'Unas horas, con final';
  }
  function cartaPropia(hay) {
    if (vista === 'nueva') return '<div class="mct"><p class="ro-rubrica">Partida nueva</p><button class="mvolver" data-pn="inicio">Volver</button></div>' +
      '<div class="pn-grecia" role="note"><p class="pn-gt">Grecia · elige tu polis</p><p>Aquí elegirás tu ciudad griega: Atenas, Esparta, Corinto y más. ' +
      'Llega en la próxima versión; <b>todavía no se puede jugar.</b></p></div>' +
      '<p class="pn-mient">Mientras tanto, puedes jugar:</p><div class="pn-ops">' +
      opcion('data-act="hoja" data-v="corta"', 'Jugar en Italia · partida corta', horasCorta()) +
      opcion('data-act="newregion" data-v="italia"', 'Jugar la Región de Italia', 'Campaña solo en el mapa de Italia') +
      opcion(hay ? 'data-act="mpanel" data-v="nueva" data-pncamp="1"' : 'data-pn="campana"', 'Campaña Roma contra Cartago', 'De 280 a 146 a.C. Se puede jugar, pero no recibe mejoras.', PAUSA) + '</div>';
    return '<p class="ro-rubrica">Bienvenido</p><p class="mtit">Empieza tu historia</p><p class="mmeta">Aún no hay partida guardada.</p>' +
      '<button class="btn ro-sello mcont" data-pn="nueva"><span class="msello"></span>Partida nueva</button>';
  }
  function decora(m) {
    if (m.hidden) { vista = 'inicio'; return; }
    var carta = m.querySelector('section.mcarta:not(.pn-carta)'), lista = m.querySelector('nav.mlista');
    if (!carta || !lista) return;
    // hay partida guardada si ui.js ofrece «Continuar» o el «Volver» de la nueva campaña (solo lo pone con partida)
    var hay = !!m.querySelector('[data-act="continue"], .mnueva .mvolver[data-act="mpanel"]'), esNueva = carta.classList.contains('mnueva');
    if (vista === 'campana' && !esNueva) vista = 'inicio';
    if (vista !== 'campana' && esNueva && hay) vista = 'campana';   // ui.js sigue en su panel de nueva campaña
    // lista: fuera las tres filas viejas; «Partida nueva» delante
    var fil = lista.querySelectorAll('[data-act="mpanel"][data-v="nueva"], [data-act="hoja"][data-v="corta"], [data-act="newregion"]');
    for (var i = 0; i < fil.length; i++) fil[i].remove();
    if (!lista.querySelector('[data-pn="nueva"]')) {
      var b = document.createElement('button'); b.className = 'mfila'; b.setAttribute('data-pn', 'nueva');
      b.innerHTML = ESPADA + '<span><b>Partida nueva</b><small>Elige ciudad o una partida para jugar ya</small></span><i class="mchev"></i>';
      lista.insertBefore(b, lista.firstChild);
    }
    // la fila «Partida nueva» solo hace falta con «Continuar» arriba: sin partida ya está el sello, y en las otras vistas ya estás dentro
    lista.querySelector('[data-pn="nueva"]').classList.toggle('pn-oculta', !(vista === 'inicio' && hay));
    // tarjeta de arriba
    var propia = m.querySelector('section.pn-carta'), quiere = vista === 'nueva' || (vista === 'inicio' && !hay), clave = vista + (hay ? '+' : '-');
    carta.classList.toggle('pn-oculta', quiere);
    if (!quiere) { if (propia) propia.remove(); }
    else if (!propia || propia.getAttribute('data-k') !== clave) {
      if (!propia) { propia = document.createElement('section'); carta.parentNode.insertBefore(propia, carta.nextSibling); }
      propia.className = 'mcarta ro-papiro pn-carta' + (vista === 'nueva' ? ' pn-nueva' : ''); propia.setAttribute('data-k', clave);
      propia.innerHTML = cartaPropia(hay);
    }
    if (vista === 'campana') {
      var ct = carta.querySelector('.mct'), rub = ct && ct.querySelector('.ro-rubrica');
      if (rub && !rub.querySelector('.pn-pausa')) rub.insertAdjacentHTML('beforeend', ' ' + PAUSA);
      if (ct && !ct.querySelector('.mvolver')) ct.insertAdjacentHTML('beforeend', '<button class="mvolver" data-pn="nueva">Volver</button>');
    }
  }
  function ponVista(v, m) { vista = v; decora(m); m.scrollTop = 0; }
  function arranca() {
    document.body.classList.add('portada');
    var m = document.getElementById('menu'); if (!m) return;
    // fondo() y decora() son idempotentes: lo que cambian no vuelve a pedir cambios
    var ob = new MutationObserver(function () { fondo(m); decora(m); });
    ob.observe(m, { childList: true, attributes: true, attributeFilter: ['hidden'] }); fondo(m); decora(m);
    // en captura, antes que el clic global de ui.js: así la vista ya está puesta cuando ui.js repinta
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('#menu [data-pn], #menu [data-act="mpanel"]'); if (!t) return;
      var pn = t.getAttribute('data-pn');
      if (pn) { ponVista(pn, m); return; }
      if (t.getAttribute('data-v') === 'nueva') vista = 'campana';   // «Campaña Roma contra Cartago» con partida guardada
      else if (vista === 'campana') vista = 'nueva';                 // el «Volver» de ui.js lleva a «Partida nueva»
    }, true);
    window.PORTADA = { vista: function (v) { ponVista(v, m); }, actual: function () { return vista; } };
  }
  if (document.body) arranca(); else document.addEventListener('DOMContentLoaded', arranca);
})();
