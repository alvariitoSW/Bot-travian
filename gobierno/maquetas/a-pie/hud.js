/* Pieza «hud»: lo que se ve encima de la escena y los botones. Lee el estado; las órdenes las deja en S (andando, corre,
   escudos, el dedo en «Lanzar»). Los botones dicen lo que hacen y miden al menos 44 px (index.html).
   Contrato: crearHud(m) con m = { S, Son, $, M, RECARGA, ZONA, vivos, armar, soltar } devuelve { hud, muestraFin }. */
export function crearHud(m) {
  const { S, Son, $, M, RECARGA, ZONA, vivos, armar, soltar } = m;
  function hud() {
    const n = vivos(), f = n / M, b = $('barra').firstElementChild;
    $('cuenta').textContent = n + '/' + M; b.style.width = (f * 100).toFixed(0) + '%'; b.style.background = f > 0.7 ? 'var(--verde)' : f > 0.45 ? '#e6ac3c' : 'var(--rojo)';
    const av = $('avanzar'), es = $('escudos'), ac = $('accion'), co = $('correr');
    co.hidden = S.fase !== 'avance'; co.classList.toggle('activa', S.corriendo); co.classList.toggle('cansado', S.agotado); $('aliento').style.width = (S.aliento * 100).toFixed(0) + '%'; $('correr-t').textContent = S.agotado ? 'Sin aliento' : 'Correr';
    const me = $('miescudo'); me.setAttribute('class', S.roto ? 'roto' : 'e' + (S.golpes <= 0 ? 0 : S.golpes <= 2 ? 1 : 2)); me.title = S.roto ? 'Tu escudo está roto' : 'Tu escudo';
    av.hidden = S.fase !== 'avance'; av.classList.toggle('activa', S.andando);
    es.hidden = S.fase !== 'avance'; es.classList.toggle('activa', S.escudos); es.classList.toggle('pide', S.aviso && !S.escudos);
    $('escudos-t').textContent = S.escudos ? 'Bajar escudos' : 'Escudos';
    /* GM43h: «Lanzar» se mantiene pulsado; el medidor sube y baja y la zona verde es el buen tiro. Mientras pasan el segundo pilum, espera */
    const enPila = S.fase === 'pila' && S.salvas < 2, espera = enPila && S.T < S.listo && !S.armando;
    ac.hidden = !enPila; $('accion-t').textContent = S.salvas === 0 ? 'Lanzar' : 'Segundo pilum';
    ac.classList.toggle('pide', enPila && !espera && !S.armando); ac.classList.toggle('activa', S.armando); ac.classList.toggle('espera', espera);
    const ag = $('aguja'), m = S.armando ? S.medidor : espera && S.salvas === 1 ? 1 - (S.listo - S.T) / RECARGA : 0;
    ag.style.width = (Math.max(0, Math.min(1, m)) * 100).toFixed(1) + '%'; ag.classList.toggle('buena', S.armando && m >= ZONA);
    $('objetivo').textContent = S.fase === 'avance' ? 'Lleva el cuerpo hasta la loma' : S.fase === 'pila' ? (S.salvas === 0 ? 'Lanza los pila' : S.salvas === 1 ? 'Lanza el segundo pilum' : 'Aguanta, ya llegan') : 'Carga contra su línea';
  }
  function muestraFin() {
    const n = S.llegaron, c = S.caidos; $('fin-t').textContent = n >= M * 0.8 ? '¡Choque!' : n >= M * 0.5 ? 'Llegasteis' : 'Llegasteis a duras penas';
    $('fin-p').textContent = `Los pila tumbaron ${c} galo${c === 1 ? '' : 's'}. Quedan ${n} de ${M} hombres en pie. ` + (c < 7 ? 'Suelta el pilum con la aguja en la zona verde, y lanza los dos.' : n >= M * 0.8 ? 'El testudo aguantó y los pila hicieron su trabajo.' : 'Sube los escudos a tiempo cuando suene el aviso.');
    const cg = S.galos.filter(g => !g.vivo).length, cr = S.romanos.filter(h => !h.vivo).length;
    if (S.choque) $('fin-p').textContent += ` En la lucha, ya hay ${cg} galos y ${cr} de los tuyos en el suelo.`;
    $('fin').hidden = false;
  }
  /* el sonido arranca con el primer toque (el navegador no deja antes) y lo abre el cuerno */
  addEventListener('pointerdown', () => { if (!Son.listo() && Son.inicia()) { Son.bajoTecho(S.k); Son.cuerno(); } }, { once: true });
  const avanzar = $('avanzar');
  avanzar.addEventListener('pointerdown', e => { e.preventDefault(); try { avanzar.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } S.andando = true; });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) avanzar.addEventListener(ev, () => { S.andando = false; });
  const correr = $('correr');
  correr.addEventListener('pointerdown', e => { e.preventDefault(); try { correr.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } S.corre = true; if (S.escudos) Son.clac(6); S.escudos = false; });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) correr.addEventListener(ev, () => { S.corre = false; });
  $('escudos').addEventListener('pointerdown', e => { e.preventDefault(); S.escudos = !S.escudos; if (S.escudos) S.corre = false; Son.clac(S.escudos ? 10 : 6); });
  /* GM43h: «Lanzar» se mantiene: al bajar el dedo se arma el brazo, al soltarlo se lanza (un toque corto también lanza, flojo).
     Si el navegador cancela el toque, se lanza igual: el botón nunca se queda enganchado */
  const accion = $('accion');
  accion.addEventListener('pointerdown', e => { e.preventDefault(); try { accion.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } S.dedo = true; armar(); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) accion.addEventListener(ev, () => { S.dedo = false; soltar(); });
  $('otra').addEventListener('click', () => { location.href = location.pathname; });
  $('salir').addEventListener('click', () => { location.href = document.baseURI; });
  return { hud, muestraFin };
}
