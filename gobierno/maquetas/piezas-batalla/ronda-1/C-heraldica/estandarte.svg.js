// Estandarte: ficha de regimiento. Heráldica limpia de legión. Sin dependencias.
function estandarte(d) {
  d = d || {};
  var N = '#0b1016', RO = '#c0281f', OR = '#e9c063', BR = '#b8862b', MA = '#f1ead9', PI = '#9aa6b4', TE = '#d9764a';
  var bando = d.bando === 1 ? 1 : 0;
  var c = d.color || (bando ? '#5b3a8c' : RO);
  var tipo = d.tipo || 'hastati', animo = d.animo || 'F';
  var can = Math.max(0, Math.min(3, d.cansancio | 0));
  var vet = Math.max(0, Math.min(2, d.vet | 0));
  var sel = !!d.sel;

  // Forma del paño: arriba recto (Roma) o redondeado (Cartago); abajo en punta o en cola de golondrina (caballería).
  var top = bando ? 'M4 18Q4 9 13 9H23Q32 9 32 18' : 'M4 9H32';
  var bot;
  if (animo === 'D') bot = 'L32 46L28 50L25 47L21 55L18 50L14 56L10 48L7 52L4 46Z';
  else if (tipo === 'equites') bot = 'L32 56L18 47L4 56Z';
  else bot = 'L32 44L18 57L4 44Z';
  var cloth = top + (bando ? 'L32 44' : 'L32 44') + bot.replace(/^L32 4\d/, 'L32 44');
  if (tipo === 'equites' && animo !== 'D') cloth = top + 'L32 56L18 47L4 56Z';
  else if (animo === 'D') cloth = top + 'L32 46L28 50L25 47L21 55L18 50L14 56L10 48L7 52L4 46Z';
  else cloth = top + 'L32 44L18 57L4 44Z';

  function pilum(cx, y0, y1, w) { // asta con punta
    return '<path d="M' + cx + ' ' + y0 + 'L' + (cx - 3) + ' ' + (y0 + 6) + 'L' + (cx + 3) + ' ' + (y0 + 6) + 'Z" fill="' + MA + '"/>' +
      '<path d="M' + cx + ' ' + (y0 + 5) + 'V' + y1 + '" stroke="' + MA + '" stroke-width="' + (w || 2.2) + '" stroke-linecap="round"/>';
  }
  var e = '';
  if (tipo === 'hastati') {
    e = pilum(18, 18, 43, 2.6) + '<path d="M13 36H23" stroke="' + MA + '" stroke-width="2" stroke-linecap="round"/>';
  } else if (tipo === 'principes') {
    e = '<g transform="rotate(32 18 31)">' + pilum(18, 17, 44) + '</g><g transform="rotate(-32 18 31)">' + pilum(18, 17, 44) + '</g>';
  } else if (tipo === 'triarios') {
    e = pilum(10.5, 23, 43, 2) + pilum(18, 17, 43, 2) + pilum(25.5, 23, 43, 2) + '<path d="M9 40H27" stroke="' + MA + '" stroke-width="2" stroke-linecap="round"/>';
  } else if (tipo === 'velites') {
    e = '';
    for (var i = 0; i < 3; i++) {
      var x = 11 + i * 7, y = 36 - (i === 1 ? 0 : 3);
      e += '<path d="M' + (x - 2) + ' ' + (y + 5) + 'L' + (x + 3) + ' ' + (y - 8) + '" stroke="' + MA + '" stroke-width="2" stroke-linecap="round"/><circle cx="' + (x + 3.4) + '" cy="' + (y - 9) + '" r="2" fill="' + MA + '"/>';
    }
  } else if (tipo === 'falange') {
    e = '<path d="M8 21H28" stroke="' + MA + '" stroke-width="2" stroke-linecap="round"/>';
    for (var r = 0; r < 3; r++) for (var q = 0; q < 3; q++) e += '<circle cx="' + (11 + q * 7) + '" cy="' + (27 + r * 7) + '" r="2.4" fill="' + MA + '"/>';
  } else if (tipo === 'equites') {
    e = '<path d="M11 43L12 34C9 32 8 28 9.500 25L9 19L13.500 22L16 19.500L17 22.500C22 22 26.500 25.500 28 31L28 35C25 34 23 35 22 37L23 43Z" fill="' + MA + '" stroke="' + MA + '" stroke-width="1" stroke-linejoin="round"/><circle cx="21" cy="27" r="1.4" fill="' + c + '"/>';
  } else if (tipo === 'general') {
    e = '<circle cx="18" cy="31" r="10.500" fill="none" stroke="' + MA + '" stroke-width="2.600" stroke-dasharray="3.300 2.100" stroke-linecap="round"/>' +
      '<path d="M18 22.500L20.300 28.300L26.500 28.500L21.600 32.300L23.300 38.300L18 34.800L12.700 38.300L14.400 32.300L9.500 28.500L15.700 28.300Z" fill="' + MA + '" stroke="' + MA + '" stroke-width="1" stroke-linejoin="round"/>';
  } else if (tipo === 'elefantes') {
    e = '<circle cx="10.500" cy="27" r="6.500" fill="' + MA + '"/><circle cx="25.500" cy="27" r="6.500" fill="' + MA + '"/>' +
      '<ellipse cx="18" cy="28" rx="5.200" ry="7" fill="' + MA + '" stroke="' + c + '" stroke-width="1.800"/>' +
      '<path d="M18 33V40Q18 43 21 43" fill="none" stroke="' + MA + '" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M13.500 35Q10 38 11 43M22.500 35Q26 38 25 43" fill="none" stroke="' + c + '" stroke-width="3.400" stroke-linecap="round"/>' +
      '<path d="M13.500 35Q10 38 11 43M22.500 35Q26 38 25 43" fill="none" stroke="' + OR + '" stroke-width="1.700" stroke-linecap="round"/>';
  }

  // Cansancio: cuñas oscuras en los bordes (cantidad) y paño que se apaga.
  var wedges = [[32, 22, -1], [4, 29, 1], [32, 36, -1], [4, 43, 1]];
  var nw = can === 3 ? 4 : can, cn = '';
  for (var w = 0; w < nw; w++) {
    var p = wedges[w];
    cn += '<path d="M' + p[0] + ' ' + (p[1] - 3) + 'L' + (p[0] + p[2] * 5) + ' ' + p[1] + 'L' + p[0] + ' ' + (p[1] + 3) + 'Z" fill="' + N + '"/>';
  }
  var apaga = [0, 0.12, 0.26, 0.45][can];
  var over = apaga ? '<path d="' + cloth + '" fill="' + N + '" fill-opacity="' + apaga + '"/>' : '';
  if (can === 3) over += '<path d="' + cloth + '" fill="none" stroke="' + PI + '" stroke-width="1.600" stroke-dasharray="2.500 2" stroke-opacity="0.8"/>';

  // Veteranía: galones de oro bajo el travesaño.
  var vt = '';
  for (var v = 0; v < vet; v++) {
    var yy = 11.500 + v * 3.600;
    vt += '<path d="M12.500 ' + (yy + 3) + 'L18 ' + yy + 'L23.500 ' + (yy + 3) + '" fill="none" stroke="' + OR + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  // Ánimo
  var marca = '', tf = '', apag = '';
  if (animo === 'V') {
    tf = 'translate(18 30) rotate(8) scale(0.96) translate(-18 -30)';
    marca = '<path d="M32 33L27 35L29.500 37L24.500 39.500" fill="none" stroke="' + N + '" stroke-width="1.600" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (animo === 'D') {
    tf = 'translate(18 30) rotate(-18) scale(0.9) translate(-18 -30)';
    marca = '<path d="M4 31L10 33L7.500 35.500L13 38M32 24L26 26L28.500 28.500L23 31" fill="none" stroke="' + N + '" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (animo === 'H') {
    tf = 'translate(18 30) rotate(158) scale(0.86) translate(-18 -30)';
    apag = '<path d="' + cloth + '" fill="' + PI + '" fill-opacity="0.62"/><path d="' + cloth + '" fill="' + N + '" fill-opacity="0.25"/>';
    marca = '<path d="M5 44L31 17" stroke="' + N + '" stroke-width="1.600" stroke-opacity="0.7" stroke-linecap="round"/>';
  }

  // Remate: lanza (Roma) o media luna (Cartago)
  var rem = bando
    ? '<path d="M18 7V5" stroke="' + N + '" stroke-width="2.400"/><path d="M11.500 5.500A6.500 6.500 0 0 1 24.500 5.500A9 9 0 0 0 11.500 5.500Z" fill="' + BR + '" stroke="' + N + '" stroke-width="1.200" stroke-linejoin="round"/>'
    : '<path d="M18 7V4" stroke="' + N + '" stroke-width="2.400"/><path d="M18 0.800L14.800 6.500H21.200Z" fill="' + BR + '" stroke="' + N + '" stroke-width="1.200" stroke-linejoin="round"/>';
  var barra = '<rect x="2" y="6" width="32" height="3.600" rx="1.800" fill="' + (sel ? OR : BR) + '" stroke="' + N + '" stroke-width="1.100"/>';

  var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 60" width="36" height="60">';
  s += '<g transform="' + tf + '">';
  if (sel) s += '<path d="' + cloth + '" fill="' + OR + '" fill-opacity="0.3" stroke="' + OR + '" stroke-opacity="0.45" stroke-width="7" stroke-linejoin="round"/>';
  s += rem + '<path d="' + cloth + '" fill="' + c + '" stroke="' + N + '" stroke-width="1.700" stroke-linejoin="round"/>';
  s += '<path d="' + cloth + '" fill="none" stroke="' + MA + '" stroke-opacity="0.35" stroke-width="0.9" transform="translate(18 31) scale(0.86) translate(-18 -31)"/>';
  s += over + e + vt + cn + marca + apag + barra;
  if (sel) s += '<path d="' + cloth + '" fill="none" stroke="' + OR + '" stroke-width="2.200" stroke-linejoin="round"/>';
  s += '</g></svg>';
  return s;
}
if (typeof module !== 'undefined') module.exports = estandarte;
