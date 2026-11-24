/* AQVILA — MN4c · Portada y láminas. Script clásico, no toca la lógica del juego.
   - Pone la clase `portada` en <body> y, cada vez que ui.js repinta #menu, le añade la capa de fondo (lámina de época) si falta.
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
  function arranca() {
    document.body.classList.add('portada');
    var m = document.getElementById('menu'); if (!m) return;
    var ob = new MutationObserver(function () { fondo(m); });   // fondo() es idempotente: el cambio que hace solo añade un hijo con clase pt-fondo
    ob.observe(m, { childList: true }); fondo(m);
  }
  if (document.body) arranca(); else document.addEventListener('DOMContentLoaded', arranca);
})();
