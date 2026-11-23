/* Lucha a pie: la interfaz mínima. Solo pinta: lo que pasa lo dicen las reglas (reglas.js).
   crearHud() -> { pinta(resumen), eco(texto, clase, x, y), marca(texto | null, clase, x, y), huella(lado, x, y, gesto), palanca(...),
     dano(), racha(n, fuerte), flechaAviso(), fin(tipo), medidor(fps, peor) } */
const $ = id => document.getElementById(id);
/* lo que ha salido de cada dedo, dicho al instante dentro de su huella */
const DICHO = { estocada: 'Golpe', 'tajo-izq': '‹ Tajo', 'tajo-der': 'Tajo ›', empujon: 'Empujón', atras: 'Atrás', adelante: 'Adelante', izq: '‹ Paso', der: 'Paso ›', escudo: 'Escudo' };

export function crearHud({ otra } = {}) {
  const H = {}, huellas = { i: $('huella-i'), d: $('huella-d') }, borrado = {};
  let ecoReloj = 0, danoReloj = 0, rachaAnt = -1;
  H.pinta = r => {
    $('meta').textContent = (innerWidth < 520 ? 'Línea · ' + r.caidos + '/8' : 'Rompe su línea · ' + r.caidos + ' de 8');   /* en vertical no cabe la frase entera */
    [...$('heridas').children].forEach((b, i) => b.classList.toggle('mal', i < r.heridas));
    const al = $('aliento').firstElementChild; al.style.width = r.aliento + '%'; al.classList.toggle('bajo', r.aliento < 25);
    const e = $('escudo'); e.setAttribute('class', (r.escudo <= 0 ? 'roto' : r.escudo <= 3 ? 'rajado' : '') + (r.alzado ? ' arriba' : ''));
    e.title = r.escudo <= 0 ? 'Escudo roto' : r.escudo <= 3 ? 'Escudo rajado' : 'Escudo entero';
    $('rodea').classList.toggle('ve', !!r.rodeado);
    if (r.racha !== rachaAnt) H.racha(r.racha, r.fuerte);
  };
  H.racha = (n, fuerte) => { rachaAnt = n; const e = $('racha'); const corto = innerWidth < 520; e.textContent = fuerte ? (corto ? '¡Fuerte!' : '¡Golpe fuerte listo!') : 'Racha ' + n + (corto ? '/5' : ' de 5'); e.className = fuerte ? 'fuerte' : n > 0 ? 'sube' : ''; };
  H.eco = (texto, clase, x, y) => {
    const e = $('eco'); e.textContent = texto; e.className = 've ' + (clase || '');
    if (x !== undefined) { e.style.left = Math.round(Math.max(80, Math.min(innerWidth - 80, x))) + 'px'; e.style.top = Math.round(Math.max(60, Math.min(innerHeight - 80, y))) + 'px'; }
    clearTimeout(ecoReloj); ecoReloj = setTimeout(() => { e.className = clase || ''; }, 900);
  };
  H.marca = (texto, clase, x, y) => {
    const e = $('marca'); if (texto === null) { e.className = ''; return; }
    if (e.textContent !== texto) e.textContent = texto; e.className = 've ' + clase;
    e.style.left = Math.round(Math.max(40, Math.min(innerWidth - 40, x))) + 'px'; e.style.top = Math.round(Math.max(60, Math.min(innerHeight - 30, y))) + 'px';
  };
  H.dano = () => { const e = $('dano'); e.classList.remove('ve'); void e.offsetWidth; e.classList.add('ve'); clearTimeout(danoReloj); danoReloj = setTimeout(() => e.classList.remove('ve'), 400); };
  H.flechaAviso = () => {};
  H.huella = (lado, x, y, gesto) => {
    const h = huellas[lado]; h.style.left = x + 'px'; h.style.top = y + 'px'; h.classList.add('ve'); h.textContent = gesto ? (DICHO[gesto] || '') : '';
    if (gesto) { h.classList.remove('salta'); void h.offsetWidth; h.classList.add('salta'); }
    clearTimeout(borrado[lado]); borrado[lado] = setTimeout(() => h.classList.remove('ve', 'salta'), gesto ? 700 : 3000);
  };
  H.palanca = (x0, y0, x, y) => {
    const p = $('palanca'); if (x0 === null) { p.classList.remove('ve'); return; }
    p.classList.add('ve'); p.style.left = x0 + 'px'; p.style.top = y0 + 'px';
    const dx = Math.max(-40, Math.min(40, x - x0)), dy = Math.max(-40, Math.min(40, y - y0)); p.firstElementChild.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  };
  H.fin = tipo => {
    $('fin-t').textContent = tipo === 'rompe' ? 'Su línea rompe' : 'Has caído';
    $('fin-p').textContent = tipo === 'rompe' ? 'Los galos que quedan se vuelven y corren.' : 'Tres heridas. Te llevan a retaguardia.';
    $('fin').hidden = false;
  };
  H.medidor = (fps, peor) => { $('medidor').textContent = fps.toFixed(0) + ' img/s · peor ' + Math.round(peor) + ' ms'; };
  $('otra').addEventListener('click', () => { $('fin').hidden = true; otra && otra(); });
  $('ayuda').addEventListener('pointerdown', e => { e.stopPropagation(); $('ayuda').hidden = true; });
  $('salir').addEventListener('pointerdown', e => e.stopPropagation());
  $('salir').addEventListener('click', () => { if (history.length > 1) history.back(); else location.href = './'; });
  return H;
}
