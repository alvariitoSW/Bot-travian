/* AQVILA · P1 «Estandarte» · voz: grabado de moneda romana.
   estandarte(datos) devuelve un '<svg>' de 36×60 con:
   - arriba, la insignia: remate (punta de lanza en Roma, disco y media luna en Cartago),
     travesaño, paño (cuadrado con flecos en Roma, en punta en Cartago) y una moneda con el emblema;
   - abajo, una tablilla fija: gotas de cansancio a la izquierda, estrellas de veteranía a la derecha.
   El ánimo inclina, rasga, voltea y apaga la insignia; la tablilla no se mueve.
   Sin dependencias: corre en navegador y en Node. */
function estandarte(datos) {
  var d = datos || {};
  var NOCHE = '#0b1016', ORO = '#e9c063', BRONCE = '#b8862b', MARMOL = '#f1ead9', PIEDRA = '#9aa6b4';
  var bando = d.bando === 1 ? 1 : 0;
  var base = (typeof d.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(d.color)) ? d.color : (bando ? '#5b3a8c' : '#c0281f');
  var tipo = d.tipo || 'hastati';
  var animo = ({ F: 1, V: 1, D: 1, H: 1 })[d.animo] ? d.animo : 'F';
  var cans = Math.max(0, Math.min(3, (d.cansancio | 0)));
  var vet = Math.max(0, Math.min(2, (d.vet | 0)));
  var sel = !!d.sel;

  function mezcla(a, b, t) {
    var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), r = '#';
    for (var s = 16; s >= 0; s -= 8) {
      var c = Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
      r += (c < 16 ? '0' : '') + c.toString(16);
    }
    return r;
  }

  // El cansancio apaga el paño; la huida lo vuelve gris piedra.
  var pano = mezcla(base, NOCHE, [0, 0.2, 0.38, 0.55][cans]);
  var bronce = BRONCE, marmol = MARMOL, tinta = NOCHE;
  if (animo === 'H') {
    pano = mezcla(mezcla(pano, PIEDRA, 0.7), NOCHE, 0.25);
    bronce = mezcla(BRONCE, PIEDRA, 0.6);
    marmol = mezcla(MARMOL, PIEDRA, 0.45);
    tinta = mezcla(NOCHE, PIEDRA, 0.25);
  }
  var roto = animo === 'F' ? 0 : animo === 'V' ? 1 : 2;

  // ---------- paño ----------
  function panoPath() {
    if (bando === 0) {
      if (roto === 0) return 'M5 9H31V35H5Z';
      if (roto === 1) return 'M5 9H31V11.5L26 14.5L31 17.5V35H5Z';
      return 'M5 9H31V10.5L24.5 14L31 18V30L28.5 35L25 31.5L21.5 35L18.5 32L15 35L11 31.5L7.5 35L5 32V19L10.5 14.5L5 12Z';
    }
    if (roto === 0) return 'M5 9H31V30L18 38L5 30Z';
    if (roto === 1) return 'M5 9H31V11.5L26 14.5L31 17.5V30L18 38L5 30Z';
    return 'M5 9H31V10.5L24.5 14L31 18V29L26.5 31L24 33.5L18 38L15 33.5L11 34L5 30V19L10.5 14.5L5 12Z';
  }
  function flecos() {
    if (bando === 1) return roto === 2 ? '' :
      '<line x1="18" y1="38" x2="18" y2="40.5" stroke="' + tinta + '" stroke-width="1.2"/><circle cx="18" cy="41.3" r="1.4" fill="' + bronce + '" stroke="' + tinta + '" stroke-width="0.9"/>';
    if (roto === 2) return '';
    var s = '', xs = roto === 0 ? [7, 10, 13, 23, 26, 29] : [7, 13, 23, 29];
    for (var i = 0; i < xs.length; i++)
      s += '<rect x="' + (xs[i] - 0.9) + '" y="35" width="1.8" height="3.4" rx="0.9" fill="' + bronce + '" stroke="' + tinta + '" stroke-width="0.8"/>';
    return s;
  }
  function remate(halo) {
    var f = halo ? ORO : bronce, k = halo ? ORO : tinta, w = halo ? 5 : 1.3;
    var att = ' fill="' + f + '" stroke="' + k + '" stroke-width="' + w + '" stroke-linejoin="round"';
    var s = '<rect x="16.9" y="7" width="2.2" height="43"' + att + '/>';
    s += '<rect x="4" y="7.4" width="28" height="2.6" rx="1.3"' + att + '/>';
    s += '<circle cx="4" cy="8.7" r="1.7"' + att + '/><circle cx="32" cy="8.7" r="1.7"' + att + '/>';
    if (bando === 0) s += '<path d="M18 0.9C20.8 3 20.8 5.4 18 7.6C15.2 5.4 15.2 3 18 0.9Z"' + att + '/>';
    else s += '<path d="M12.6 2.6A5.4 5.4 0 0 0 23.4 2.6A5.4 3.2 0 0 1 12.6 2.6Z"' + att + '/><circle cx="18" cy="2.6" r="1.9"' + att + '/>';
    return s;
  }

  // ---------- emblemas (en coordenadas de moneda, radio útil 8) ----------
  function estrella(cx, cy, R, r) {
    var p = '';
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R;
      p += (i ? 'L' : 'M') + (cx + q * Math.cos(a)).toFixed(2) + ' ' + (cy + q * Math.sin(a)).toFixed(2);
    }
    return p + 'Z';
  }
  function lanza(x1, y1, x2, y2, ancho, largo) {
    // asta + punta de hoja al final (x2,y2)
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var bx = x2 - ux * largo, by = y2 - uy * largo, mx = x2 - ux * largo * 0.45, my = y2 - uy * largo * 0.45;
    var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + bx.toFixed(2) + '" y2="' + by.toFixed(2) + '" stroke="' + tinta + '" stroke-width="1.5" stroke-linecap="round"/>';
    s += '<path d="M' + x2 + ' ' + y2 + 'L' + (mx + nx * ancho).toFixed(2) + ' ' + (my + ny * ancho).toFixed(2) + 'L' + bx.toFixed(2) + ' ' + by.toFixed(2) +
      'L' + (mx - nx * ancho).toFixed(2) + ' ' + (my - ny * ancho).toFixed(2) + 'Z" fill="' + tinta + '" stroke="' + tinta + '" stroke-width="0.6" stroke-linejoin="round"/>';
    return s;
  }
  function emblema() {
    var t = tinta, m = marmol;
    switch (tipo) {
      case 'hastati': // escudo largo (scutum) con umbo
        return '<rect x="-4.8" y="-7.3" width="9.6" height="14.6" rx="3" fill="' + t + '"/>' +
          '<line x1="0" y1="-5.6" x2="0" y2="5.6" stroke="' + m + '" stroke-width="1" stroke-linecap="round"/>' +
          '<circle cx="0" cy="0" r="2" fill="' + m + '" stroke="' + t + '" stroke-width="0.8"/>';
      case 'principes': // gladius
        return '<path d="M0 -8L2.1 -5.2V2.6H-2.1V-5.2Z" fill="' + t + '" stroke="' + t + '" stroke-width="0.6" stroke-linejoin="round"/>' +
          '<rect x="-5" y="2.4" width="10" height="2.2" rx="1" fill="' + t + '"/>' +
          '<rect x="-1.1" y="4.4" width="2.2" height="2.6" fill="' + t + '"/>' +
          '<circle cx="0" cy="7.4" r="1.6" fill="' + t + '"/>';
      case 'triarios': // tres lanzas en abanico
        return lanza(0, 7.5, 0, -8.2, 1.9, 4.6) + lanza(0, 7.5, -6.3, -5.6, 1.7, 4) + lanza(0, 7.5, 6.3, -5.6, 1.7, 4) +
          '<rect x="-3.6" y="5.6" width="7.2" height="2.4" rx="1.2" fill="' + t + '"/>';
      case 'velites': // dos jabalinas cruzadas y escudo redondo (parma)
        return lanza(-5.6, 5, 5.2, -7.4, 1.9, 4.4) + lanza(5.6, 5, -5.2, -7.4, 1.9, 4.4) +
          '<circle cx="0" cy="5" r="3" fill="' + t + '"/><circle cx="0" cy="5" r="1.2" fill="' + m + '"/>';
      case 'falange': // muro de picas sobre fila de escudos
        return lanza(-6.5, 3, -1.5, -7.8, 1.2, 3) + lanza(-2.5, 3, 2.5, -7.8, 1.2, 3) + lanza(1.5, 3, 6.5, -6, 1.2, 3) +
          '<path d="M-7.6 6.6A2.6 2.6 0 0 1 -2.6 6.6A2.6 2.6 0 0 1 2.6 6.6A2.6 2.6 0 0 1 7.6 6.6Z" fill="' + t + '" stroke="' + t + '" stroke-width="1.2" stroke-linejoin="round"/>' +
          '<rect x="-7.6" y="5.6" width="15.2" height="2.4" rx="1" fill="' + t + '"/>';
      case 'equites': // cabeza de caballo de perfil, mirando a la izquierda
        return '<path d="M4.6 7.6L5.4 0.6C5.6 -3.6 3.6 -6 1.6 -6.8L2.6 -9.2L0.2 -7.4L-0.8 -9L-1.4 -7C-3.6 -6.4 -5.4 -4.2 -7 -1.6C-7.8 -0.4 -7.4 1.4 -6 1.4C-4.6 1.2 -3.4 0.4 -1.6 0.9L-2.4 7.6Z" fill="' + t + '" stroke="' + t + '" stroke-width="0.6" stroke-linejoin="round"/>' +
          '<circle cx="-2.2" cy="-3.6" r="0.9" fill="' + m + '"/>' +
          '<path d="M2.8 -5.2C4.4 -3.4 4.6 0 4.2 3.6" fill="none" stroke="' + m + '" stroke-width="0.8" stroke-linecap="round"/>';
      case 'elefantes': // elefante de perfil con trompa y colmillo
        return '<ellipse cx="1.8" cy="0.2" rx="6" ry="4.4" fill="' + t + '"/>' +
          '<circle cx="-3.8" cy="-2" r="3.6" fill="' + t + '"/>' +
          '<path d="M-6.8 -1.4C-8.8 1.8 -8.6 5 -7.4 7.2L-5.8 6.8C-6.6 4.8 -6.4 2.6 -4.6 0.6Z" fill="' + t + '"/>' +
          '<rect x="-2.4" y="2.6" width="2.8" height="5" rx="0.8" fill="' + t + '"/><rect x="4.4" y="2.6" width="2.8" height="5" rx="0.8" fill="' + t + '"/>' +
          '<path d="M7.6 -1.2L8.6 2.6" stroke="' + t + '" stroke-width="0.9" stroke-linecap="round"/>' +
          '<path d="M-5.4 1.2Q-4.4 3.6 -2 3.4" fill="none" stroke="' + m + '" stroke-width="1" stroke-linecap="round"/>' +
          '<path d="M-2.2 -4.6Q0.6 -2.8 -1.4 0.2" fill="none" stroke="' + m + '" stroke-width="0.8" stroke-linecap="round"/>';
      case 'general': { // corona de laurel abierta arriba, con estrella
        var s = '';
        for (var lado = -1; lado <= 1; lado += 2) {
          for (var i = 0; i < 4; i++) {
            var ang = 55 + i * 34, px = lado * 6.2 * Math.sin(ang * Math.PI / 180), py = -6.2 * Math.cos(ang * Math.PI / 180);
            var rot = lado * (ang - 60);
            s += '<ellipse cx="' + px.toFixed(2) + '" cy="' + py.toFixed(2) + '" rx="1.5" ry="2.8" transform="rotate(' + rot + ' ' + px.toFixed(2) + ' ' + py.toFixed(2) + ')" fill="' + t + '"/>';
          }
        }
        s += '<path d="M-1.5 6.4L-3.4 8.4M1.5 6.4L3.4 8.4" stroke="' + t + '" stroke-width="1.3" stroke-linecap="round"/>';
        s += '<path d="' + estrella(0, -0.6, 3.6, 1.5) + '" fill="' + t + '" stroke="' + t + '" stroke-width="0.5" stroke-linejoin="round"/>';
        return s;
      }
    }
    return '<circle r="4" fill="' + t + '"/>';
  }

  function moneda() {
    var s = '<g transform="translate(18 22)">';
    s += '<circle r="10.2" fill="' + bronce + '" stroke="' + tinta + '" stroke-width="1.4"/>';
    for (var i = 0; i < 16; i++) {
      var a = i * Math.PI / 8;
      s += '<circle cx="' + (9.35 * Math.cos(a)).toFixed(2) + '" cy="' + (9.35 * Math.sin(a)).toFixed(2) + '" r="0.42" fill="' + tinta + '" fill-opacity="0.7"/>';
    }
    s += '<circle r="8.5" fill="' + marmol + '" stroke="' + tinta + '" stroke-width="0.7"/>';
    s += emblema() + '</g>';
    return s;
  }

  // ---------- postura según el ánimo ----------
  var pos = { F: '', V: 'translate(18 30) rotate(-10) scale(0.9) translate(-18 -30)',
    D: 'translate(18 26) rotate(-24) scale(0.8) translate(-18 -26)',
    H: 'translate(18 25) rotate(164) scale(0.84) translate(-18 -25)' }[animo];

  var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 60" width="36" height="60">';
  var g = '<g' + (pos ? ' transform="' + pos + '"' : '') + '>';
  if (sel) {
    out += g + remate(true) + '<path d="' + panoPath() + '" fill="' + ORO + '" stroke="' + ORO + '" stroke-width="5" stroke-linejoin="round"/>' +
      (bando === 0 && roto < 2 ? '<rect x="6" y="34" width="24" height="4.4" fill="' + ORO + '" stroke="' + ORO + '" stroke-width="3" stroke-linejoin="round"/>' :
        bando === 1 && roto < 2 ? '<circle cx="18" cy="41" r="1.6" fill="' + ORO + '" stroke="' + ORO + '" stroke-width="3.5"/>' : '') + '</g>';
  }
  out += g + remate(false);
  out += '<path d="' + panoPath() + '" fill="' + pano + '" stroke="' + tinta + '" stroke-width="1.5" stroke-linejoin="round"/>';
  if (roto === 2) // tajo en el paño
    out += '<path d="M8 25L11.5 28" stroke="' + tinta + '" stroke-width="1.3" stroke-linecap="round"/>';
  out += flecos() + moneda() + '</g>';

  // ---------- tablilla fija: cansancio y veteranía ----------
  out += '<rect x="1.5" y="48.6" width="33" height="10.6" rx="3.2" fill="' + NOCHE + '" stroke="' + (sel ? ORO : BRONCE) + '" stroke-width="' + (sel ? 2 : 1) + '"/>';
  for (var i = 0; i < 3; i++) {
    var x = 6 + i * 5.2, gota = 'M' + x + ' 50.6C' + (x + 0.6) + ' 52 ' + (x + 2.2) + ' 53.6 ' + (x + 2.2) + ' 55.3A2.2 2.2 0 0 1 ' + (x - 2.2) + ' 55.3C' + (x - 2.2) + ' 53.6 ' + (x - 0.6) + ' 52 ' + x + ' 50.6Z';
    out += i < cans ? '<path d="' + gota + '" fill="' + MARMOL + '"/>' :
      '<path d="' + gota + '" fill="none" stroke="' + PIEDRA + '" stroke-opacity="0.35" stroke-width="0.8"/>';
  }
  for (var j = 0; j < 2; j++) {
    var st = estrella(24.6 + j * 6, 54.1, 3.3, 1.4);
    out += j < vet ? '<path d="' + st + '" fill="' + ORO + '" stroke="' + ORO + '" stroke-width="0.5" stroke-linejoin="round"/>' :
      '<path d="' + st + '" fill="none" stroke="' + PIEDRA + '" stroke-opacity="0.35" stroke-width="0.8" stroke-linejoin="round"/>';
  }
  return out + '</svg>';
}
if (typeof module !== 'undefined') module.exports = estandarte;
