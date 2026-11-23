/* Lucha a pie: la interfaz mínima. Solo pinta: lo que pasa lo dicen las reglas (reglas.js).
   crearHud() -> { pinta(resumen), eco(texto, clase, x, y), huella(lado, x, y), palanca(...), fin(tipo), medidor(fps, peor) } */
const $ = id => document.getElementById(id);

export function crearHud({ otra } = {}) {
  const H = {}, huellas = { i: $('huella-i'), d: $('huella-d') }, borrado = {};
  let ecoReloj = 0;
  H.pinta = r => {
    $('meta').textContent = 'Rompe su línea · ' + r.caidos + ' de 8';
    [...$('heridas').children].forEach((b, i) => b.classList.toggle('mal', i < r.heridas));
    const al = $('aliento').firstElementChild; al.style.width = r.aliento + '%'; al.classList.toggle('bajo', r.aliento < 25);
    const e = $('escudo'); e.setAttribute('class', (r.escudo <= 0 ? 'roto' : r.escudo <= 3 ? 'rajado' : '') + (r.alzado ? ' arriba' : ''));
    e.title = r.escudo <= 0 ? 'Escudo roto' : r.escudo <= 3 ? 'Escudo rajado' : 'Escudo entero';
    $('rodea').classList.toggle('ve', !!r.rodeado);
  };
  H.eco = (texto, clase, x, y) => {
    const e = $('eco'); e.textContent = texto; e.className = 've ' + (clase || '');
    if (x !== undefined) { e.style.left = Math.round(Math.max(80, Math.min(innerWidth - 80, x))) + 'px'; e.style.top = Math.round(Math.max(60, Math.min(innerHeight - 80, y))) + 'px'; }
    clearTimeout(ecoReloj); ecoReloj = setTimeout(() => { e.className = clase || ''; }, 900);
  };
  H.huella = (lado, x, y) => {
    const h = huellas[lado]; h.style.left = x + 'px'; h.style.top = y + 'px'; h.classList.add('ve');
    clearTimeout(borrado[lado]); borrado[lado] = setTimeout(() => h.classList.remove('ve'), 3000);
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
