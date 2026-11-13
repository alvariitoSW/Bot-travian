/* AQVILA · Ficha de regimiento «estandarte», voz «friso de cerámica de figuras rojas».
   Asta con estandarte: Roma = vexillum cuadrado con lengüetas; Cartago = paño redondeado con disco y creciente.
   Medallón negro con figura terracota de perfil (como una vasija), banda de meandro arriba.
   Ánimo = inclinación y rotura del paño; cansancio = mancha oscura que sube desde abajo;
   veteranía = discos de oro (phalerae) en el asta; elegido = marco de oro. */
(function () {
  var N = '#0b1016', R = '#c0281f', O = '#e9c063', B = '#b8862b', M = '#f1ead9',
      P = '#9aa6b4', T = '#d9764a', PU = '#5b3a8c';
  var cuenta = 0;

  function hex(c) { c = c.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(c.substr(i, 2), 16); }); }
  function mezcla(a, b, t) {
    var x = hex(a), y = hex(b);
    return '#' + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? '0' : '') + r.toString(16); }).join('');
  }

  // Paños: [Roma, Cartago] × ánimo. V lleva una muesca; D va rasgado.
  var PANO = {
    0: {
      F: 'M6 9H30V37L26 42L22 37L18 42L14 37L10 42L6 37Z',
      V: 'M6 9H30V30L26.5 33.5L29 36L26 42L22 37L18 42L14 37L10 42L6 37Z',
      D: 'M6 9H30V26L25.5 30L27 33L22 35.5L20 32.5L16 38L13 34.5L9 40L6 35Z'
    },
    1: {
      F: 'M6 9H30V30Q30 41 18 42Q6 41 6 30Z',
      V: 'M6 9H30V26.5L26.5 30L29.5 32.5Q28 40.5 18 42Q6 41 6 30Z',
      D: 'M6 9H30V25.5L25.5 29.5L27 33L22 35L20 32L15 37L12 34L8 37.5L6 33Z'
    }
  };

  // Emblemas: figuras terracota con línea fina negra, centradas en (0,0), radio ~8.
  function emblema(tipo, t) {
    var L = ' stroke="' + N + '" stroke-width="0.6" stroke-linejoin="round" stroke-linecap="round"';
    var F = ' fill="' + t + '"' + L;
    var lanza = function (x1, y1, x2, y2, w) {
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + t + '" stroke-width="' + (w || 1.1) + '" stroke-linecap="round"/>';
    };
    var punta = function (x, y, ang) { // hoja de lanza
      return '<path transform="translate(' + x + ' ' + y + ') rotate(' + ang + ')" d="M0 -3.2L1.1 -0.6L0 0.6L-1.1 -0.6Z"' + F + '/>';
    };
    switch (tipo) {
      case 'hastati': // escudo oval + pilum en diagonal
        return '<ellipse cx="-1.6" cy="0.8" rx="3.9" ry="6" ' + F + '/>' +
          '<line x1="-1.6" y1="-4.6" x2="-1.6" y2="6.2" stroke="' + N + '" stroke-width="0.6"/>' +
          '<circle cx="-1.6" cy="0.8" r="1.2" fill="' + N + '"/>' +
          lanza(-6, 6.6, 4.6, -4.4, 1.2) + punta(5.4, -5.2, 45);
      case 'principes': // escudo rectangular + gladio en pie
        return '<rect x="-6" y="-5.6" width="6.6" height="11.6" rx="1.4"' + F + '/>' +
          '<line x1="-2.7" y1="-5" x2="-2.7" y2="5.4" stroke="' + N + '" stroke-width="0.6"/>' +
          '<rect x="-3.9" y="-0.4" width="2.4" height="2.4" rx="0.5" fill="' + N + '"/>' +
          '<path d="M3.4 -7L4.5 -5.5V2.4H2.3V-5.5Z"' + F + '/>' +
          '<path d="M1.2 2.6H5.6M3.4 2.6V6.2" stroke="' + t + '" stroke-width="1.3" stroke-linecap="round"/>' +
          '<circle cx="3.4" cy="6.6" r="0.9"' + F + '/>';
      case 'triarios': // tres lanzas en pie tras un escudo
        return lanza(-3.8, 7.4, -3.8, -4.2) + lanza(0, 7.6, 0, -5) + lanza(3.8, 7.4, 3.8, -4.2) +
          punta(-3.8, -4.6, 0) + punta(0, -5.4, 0) + punta(3.8, -4.6, 0) +
          '<path d="M-5.6 1.2H5.6V3.6Q5.6 7.2 0 7.6Q-5.6 7.2 -5.6 3.6Z"' + F + '/>';
      case 'velites': // parma redonda pequeña + dos jabalinas cruzadas
        return lanza(-6.4, 6.4, 5.2, -5.2, 0.9) + lanza(6.4, 6.4, -5.2, -5.2, 0.9) +
          punta(5.8, -5.8, 45) + punta(-5.8, -5.8, -45) +
          '<circle cx="0" cy="1.4" r="4.2"' + F + '/>' +
          '<circle cx="0" cy="1.4" r="2.3" fill="none" stroke="' + N + '" stroke-width="0.6"/>' +
          '<circle cx="0" cy="1.4" r="0.8" fill="' + N + '"/>';
      case 'equites': // cabeza de caballo de perfil
        return '<path d="M5.6 7.4C6 2.4 4.4 -2.4 1.6 -5L1.2 -7.8L-0.4 -5.6C-2.8 -5.2 -5.6 -2.2 -7.4 1.2C-7.9 2.4 -6.9 3.6 -5.6 3.1C-4.2 2.5 -2.9 1.8 -1.6 1.8C-1.2 4 -1.9 6 -3 7.6Z"' + F + '/>' +
          '<path d="M1.8 -4.8C4.6 -3 6.4 0.6 6.6 6.4" fill="none" stroke="' + N + '" stroke-width="0.9" stroke-dasharray="0.9 0.7"/>' +
          '<circle cx="-2.2" cy="-2.6" r="0.65" fill="' + N + '"/>' +
          '<path d="M-6.5 1.4L-5.4 1.2" stroke="' + N + '" stroke-width="0.6"/>' +
          '<path d="M-3.4 -0.6Q-1.4 0.6 -1.6 1.8" fill="none" stroke="' + N + '" stroke-width="0.5"/>';
      case 'general': // corona de laurel con hojas a ambos lados
        var g = '<path d="M-2.6 5.4A5.6 5.6 0 1 1 2.6 5.4" fill="none" stroke="' + t + '" stroke-width="1"/>';
        [232, 190, 148, 308, 350, 32].forEach(function (th) {
          var rad = th * Math.PI / 180, x = (5.6 * Math.cos(rad)).toFixed(2), y = (-5.6 * Math.sin(rad)).toFixed(2);
          g += '<ellipse cx="' + x + '" cy="' + y + '" rx="1.25" ry="2.4" transform="rotate(' + (-th) + ' ' + x + ' ' + y + ')"' + F + '/>';
        });
        // cinta que ata la corona y casco pequeño de perfil en el centro
        return g + '<path d="M-2.4 5.6L-3.6 8M2.4 5.6L3.6 8" stroke="' + t + '" stroke-width="1" stroke-linecap="round"/>' +
          '<path d="M-2.6 2.2C-2.8 -0.8 -1.2 -2 0.4 -2C2.2 -2 3 -0.6 2.8 1.6V2.8H1.2V1.2H-0.6V3.2H-2.4Z"' + F + '/>' +
          '<path d="M-2.4 -0.8C-1.6 -4.4 2.4 -4.4 3.4 -1.2" fill="none" stroke="' + t + '" stroke-width="1.2" stroke-linecap="round"/>';
      case 'elefantes': // elefante de perfil con torre
        return '<rect x="-0.4" y="-6.2" width="5.4" height="3.6"' + F + '/>' +
          '<path d="M-0.4 -6.2V-7.4H1V-6.2M2.3 -6.2V-7.4H3.7V-6.2" fill="' + t + '" stroke="' + N + '" stroke-width="0.5"/>' +
          '<path d="M-3 -2.6C-1 -3.2 5.6 -3.4 7.6 -1.6C8.6 0.6 8 3 7 3.4V6.6H5.2V4H1V6.6H-0.8V3.4C-1.8 3.4 -2.6 3.2 -3 2.8Z"' + F + '/>' +
          '<path d="M-2.6 -2.8C-5 -3.6 -7 -1.8 -7 0.8C-7 2.4 -7.4 4.6 -8.2 5.6C-8.6 6.2 -7.6 6.8 -7 6C-6 4.8 -5.4 3 -5.2 2C-4.2 2.6 -3.4 2.8 -2.6 2.6Z"' + F + '/>' +
          '<path d="M-3.4 -2.2C-1.6 -1.2 -1.6 1.6 -3.2 2.4" fill="none" stroke="' + N + '" stroke-width="0.6"/>' +
          '<circle cx="-5" cy="-0.8" r="0.55" fill="' + N + '"/>' +
          '<path d="M-6.6 2.2L-8.6 1.6" stroke="' + M + '" stroke-width="0.7" stroke-linecap="round"/>';
      case 'falange': // sarisas en diagonal sobre fila de escudos
        var s = '';
        for (var i = 0; i < 5; i++) {
          var x = -6.8 + i * 2.6;
          s += lanza(x, 6.8, x + 5.4, -6.2, 0.8);
        }
        return s + '<circle cx="-4.6" cy="3.6" r="2.6"' + F + '/>' +
          '<circle cx="0" cy="3.6" r="2.6"' + F + '/>' +
          '<circle cx="4.6" cy="3.6" r="2.6"' + F + '/>' +
          '<circle cx="-4.6" cy="3.6" r="0.7" fill="' + N + '"/><circle cx="0" cy="3.6" r="0.7" fill="' + N + '"/><circle cx="4.6" cy="3.6" r="0.7" fill="' + N + '"/>';
    }
    return '<circle r="3" fill="' + t + '"/>';
  }

  function estandarte(d) {
    d = d || {};
    var bando = d.bando === 1 ? 1 : 0;
    var tipo = d.tipo || 'hastati';
    var animo = ({ F: 1, V: 1, D: 1, H: 1 })[d.animo] ? d.animo : 'F';
    var can = Math.max(0, Math.min(3, d.cansancio | 0));
    var vet = Math.max(0, Math.min(2, d.vet | 0));
    var sel = !!d.sel;
    var id = 'aqe' + (++cuenta);

    var col = d.color || (bando ? PU : R);
    var terr = T, bronce = B, marm = M;
    if (can === 3) col = mezcla(col, N, 0.3);
    if (animo === 'H') { // apagado: todo tira a piedra
      col = mezcla(col, P, 0.5); terr = mezcla(T, P, 0.55); bronce = mezcla(B, P, 0.5); marm = mezcla(M, P, 0.4);
    }
    var pano = PANO[bando][animo === 'H' ? 'F' : animo];
    var montado = tipo === 'equites' || tipo === 'elefantes';

    // Postura según el ánimo (giro alrededor del centro de la ficha).
    var gesto = { F: '', V: 'rotate(-11 18 31)', D: 'translate(18 31) rotate(-27) scale(0.86) translate(-18 -31)', H: 'rotate(180 18 30) translate(0 1)' }[animo];

    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 60" width="36" height="60">';
    s += '<defs><clipPath id="' + id + 'c"><path d="' + pano + '"/></clipPath></defs>';

    if (sel) s += '<rect x="1.5" y="1.5" width="33" height="57" rx="5" fill="' + O + '" fill-opacity="0.22" stroke="' + N + '" stroke-width="3.4"/>' +
      '<rect x="1.5" y="1.5" width="33" height="57" rx="5" fill="none" stroke="' + O + '" stroke-width="2"/>';

    s += '<g transform="' + gesto + '">';
    // Asta
    s += '<line x1="18" y1="5" x2="18" y2="57.5" stroke="' + N + '" stroke-width="3.2" stroke-linecap="round"/>';
    s += '<line x1="18" y1="5" x2="18" y2="57" stroke="' + (sel ? O : bronce) + '" stroke-width="1.6" stroke-linecap="round"/>';
    // Remate
    var remate = sel ? O : bronce;
    if (bando === 0) {
      s += '<path d="M18 0.6L20.2 4.6L18 7.2L15.8 4.6Z" fill="' + remate + '" stroke="' + N + '" stroke-width="0.8" stroke-linejoin="round"/>';
    } else {
      s += '<circle cx="18" cy="2.4" r="1.9" fill="' + remate + '" stroke="' + N + '" stroke-width="0.8"/>' +
        '<path d="M14.4 4.6Q18 8.6 21.6 4.6Q18 6.6 14.4 4.6Z" fill="' + remate + '" stroke="' + N + '" stroke-width="0.8" stroke-linejoin="round"/>';
    }
    // Travesaño
    s += '<line x1="5" y1="8.6" x2="31" y2="8.6" stroke="' + N + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<line x1="5.3" y1="8.6" x2="30.7" y2="8.6" stroke="' + remate + '" stroke-width="1.1" stroke-linecap="round"/>';

    // Paño de la facción
    s += '<path d="' + pano + '" fill="' + col + '" stroke="' + N + '" stroke-width="1.2" stroke-linejoin="round"/>';
    s += '<g clip-path="url(#' + id + 'c)">';
    // Banda de meandro
    s += '<rect x="6" y="9" width="24" height="4.4" fill="' + N + '"/>';
    var m = '';
    for (var x = 7; x < 29; x += 4) m += 'M' + x + ' 12.4V10.2H' + (x + 2.6) + 'V11.6H' + (x + 1.3);
    s += '<path d="' + m + '" fill="none" stroke="' + terr + '" stroke-width="0.7" stroke-linejoin="round"/>';
    // Cansancio: el barniz se apaga desde abajo, con borde irregular
    var alto = [0, 9, 17, 26][can];
    if (alto) {
      var y0 = 42.5 - alto, borde = 'M5 ' + (y0 + 1);
      for (var k = 0; k <= 6; k++) borde += 'L' + (5 + k * 4.4) + ' ' + (y0 + (k % 2 ? -1.2 : 1));
      s += '<path d="' + borde + 'V44H5Z" fill="' + N + '" fill-opacity="0.6"/>';
    }
    s += '</g>';
    // Cansancio: una gota de mármol por nivel, a la izquierda del asta
    for (var gi = 0; gi < can; gi++) {
      var gy = 45 + gi * 5;
      s += '<path d="M10 ' + gy + 'C11.6 ' + (gy + 1.8) + ' 11.8 ' + (gy + 3.2) + ' 10 ' + (gy + 3.6) + 'C8.2 ' + (gy + 3.2) + ' 8.4 ' + (gy + 1.8) + ' 10 ' + gy + 'Z" fill="' + marm + '" stroke="' + N + '" stroke-width="0.8" stroke-linejoin="round"/>';
    }
    // Desgarro del desordenado
    if (animo === 'D') s += '<path d="M8 15.6L12 18.6L10.4 20.2L14 23" fill="none" stroke="' + N + '" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>';

    // Medallón con la figura (ovalado si va montado)
    s += montado
      ? '<ellipse cx="18" cy="24.6" rx="10.6" ry="9.2" fill="' + N + '"/><ellipse cx="18" cy="24.6" rx="9.7" ry="8.3" fill="none" stroke="' + terr + '" stroke-width="0.5"/>'
      : '<circle cx="18" cy="24.6" r="9.2" fill="' + N + '"/><circle cx="18" cy="24.6" r="8.3" fill="none" stroke="' + terr + '" stroke-width="0.5"/>';
    s += '<g transform="translate(18 24.6)">' + emblema(tipo, terr) + '</g>';
    // Exhausto: grieta de mármol que cruza la figura
    if (can === 3) s += '<path d="M12 17.4L15.6 21L13.8 23.4L18.4 27.4L17 29.6L20.6 33" fill="none" stroke="' + marm + '" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>';

    // Veteranía: phalerae de oro en el asta
    for (var v = 0; v < vet; v++) {
      var cy = 47.4 + v * 5.6;
      s += '<circle cx="18" cy="' + cy + '" r="2.6" fill="' + (animo === 'H' ? mezcla(O, P, 0.4) : O) + '" stroke="' + N + '" stroke-width="0.9"/>' +
        '<circle cx="18" cy="' + cy + '" r="0.8" fill="' + N + '"/>';
    }
    s += '</g></svg>';
    return s;
  }

  if (typeof window !== 'undefined') window.estandarte = estandarte;
  if (typeof module !== 'undefined') module.exports = estandarte;
})();
