/* Pieza «hud»: lo que se ve encima de la escena y los botones. Lee el estado; las órdenes las deja en S (andando, corre,
   el dedo en «Lanzar») o las pasa a ordena() (Escudos, Cargad, Relevo: sin centurión tardan). Los botones dicen lo que
   hacen y miden al menos 44 px (index.html).
   TP1b: cuatro órdenes siempre a la vista (Escudos · Pila · Cargad · Relevo; apagadas cuando no valen), los tres gestos
   de tu duelo (Parar · Estocada · Empujar), el estado de los dos bandos en palabras (unidad.js) y la respuesta a cada golpe.
   Contrato: crearHud(m) con m = { S, Son, $, M, RECARGA, ZONA, vivos, armar, soltar, ordena, puedeOrden } devuelve { hud, muestraFin }. */
import { palabras, veredicto } from './unidad.js';
export function crearHud(m) {
  const { S, Son, $, M, RECARGA, ZONA, vivos, armar, soltar, ordena, puedeOrden } = m;
  let textoR = '', textoG = '';
  const linea = (quien, u) => {
    const p = palabras(u), mal = { duda: 1, rompe: 1, cansada: 1, agotada: 1, perdiendo: 1 }, c = w => `<span class="${mal[w] ? 'mal' : w === 'ganando' ? 'bien' : ''}">${w}</span>`;
    return `<b>${quien}</b> ${p.enPie} en pie · ${c(p.animo)} · ${c(p.cansancio)} · ${c(p.combate)}`;
  };
  function hud() {
    const n = vivos(), f = n / M, b = $('barra').firstElementChild, lucha = S.choque && !S.huida && !S.derrota && S.fase !== 'fin';
    $('cuenta').textContent = n + '/' + M; b.style.width = (f * 100).toFixed(0) + '%'; b.style.background = f > 0.7 ? 'var(--verde)' : f > 0.45 ? '#e6ac3c' : 'var(--rojo)';
    const av = $('avanzar'), es = $('escudos'), ac = $('accion'), co = $('correr');
    co.hidden = S.fase !== 'avance'; co.classList.toggle('activa', S.corriendo); co.classList.toggle('cansado', S.agotado); $('aliento').style.width = (S.aliento * 100).toFixed(0) + '%'; $('correr-t').textContent = S.agotado ? 'Sin aliento' : 'Correr';
    const me = $('miescudo'); me.setAttribute('class', S.roto ? 'roto' : 'e' + (S.golpes <= 0 ? 0 : S.golpes <= 2 ? 1 : 2)); me.title = S.roto ? 'Tu escudo está roto' : 'Tu escudo';
    av.hidden = S.fase !== 'avance'; av.classList.toggle('activa', S.andando);
    /* «Escudos»: en la marcha, el testudo; en la lucha, aguantar tras la madera */
    const escOn = S.choque ? S.muro : S.escudos;
    es.classList.toggle('apagada', !puedeOrden('escudos')); es.classList.toggle('activa', escOn); es.classList.toggle('pide', S.aviso && !S.escudos && S.fase === 'avance');
    $('escudos-t').textContent = escOn ? 'Bajar escudos' : 'Escudos';
    /* GM43h: «Lanzar» se mantiene pulsado; el medidor sube y baja y la zona verde es el buen tiro. Mientras pasan el segundo pilum, espera */
    const enPila = S.fase === 'pila' && S.salvas < 2, espera = enPila && S.T < S.listo && !S.armando;
    ac.classList.toggle('apagada', !enPila); $('accion-t').textContent = !enPila ? 'Pila' : S.salvas === 0 ? 'Lanzar' : 'Segundo pilum';
    ac.classList.toggle('pide', enPila && !espera && !S.armando); ac.classList.toggle('activa', S.armando); ac.classList.toggle('espera', espera);
    const ag = $('aguja'), mm = S.armando ? S.medidor : espera && S.salvas === 1 ? 1 - (S.listo - S.T) / RECARGA : 0;
    ag.style.width = (Math.max(0, Math.min(1, mm)) * 100).toFixed(1) + '%'; ag.classList.toggle('buena', S.armando && mm >= ZONA);
    $('cargad').classList.toggle('apagada', !puedeOrden('cargad')); $('cargad').classList.toggle('activa', S.T < S.cargaHasta);
    $('relevo').classList.toggle('apagada', !puedeOrden('relevo'));
    /* tu duelo: los tres gestos, mientras luchas y estás en pie; «Parar» llama cuando tu rival arma el golpe */
    const yoVivo = lucha && S.yo && S.yo.vivo && S.yo.duelo, d = yoVivo ? S.yo.duelo : null;
    for (const id of ['parar', 'estocada', 'empujar']) $(id).hidden = !yoVivo;
    /* TP8b-L1: «Parar» late en la ventana de parada y se apaga si aún no puede; «Estocada» late y se enciende con el galo
       abierto o desequilibrado, y se apaga mientras golpeas; «Empujar», apagado mientras recupera */
    /* TP8b-L2: con poco aliento el gesto se apaga (la barra fina de cada botón es tu aliento); sin escudo, «Parar» es «Desviar» */
    const tu = d && S.tuyo, fu = tu && tu.fuelle !== undefined ? tu.fuelle : null, falta = c => fu !== null && fu < c, est = !!(tu && tu.abierto && tu.estocada && !falta(tu.cS));
    $('parar-t').textContent = tu && tu.roto ? 'Desviar' : 'Parar';
    $('parar').classList.toggle('pide', !!(tu && tu.ventana && !falta(tu.cP))); $('parar').classList.toggle('apagada', !!(tu && (!tu.parar || falta(tu.cP))));
    $('estocada').classList.toggle('pide', est); $('estocada').classList.toggle('activa', est); $('estocada').classList.toggle('apagada', !!(tu && (!tu.estocada || falta(tu.cS))));
    $('empujar').classList.toggle('apagada', !!(tu && (!tu.empujar || falta(tu.cE))));
    for (const id of ['parar', 'estocada', 'empujar']) { const b = $('fu-' + id); b.parentNode.hidden = fu === null; if (fu !== null) { b.style.width = Math.max(0, fu).toFixed(0) + '%'; b.classList.toggle('bajo', fu < 30); } }
    $('objetivo').textContent = S.fase === 'avance' ? 'Lleva el cuerpo hasta la loma' : S.fase === 'pila' ? (S.salvas === 0 ? 'Lanza los pila' : S.salvas === 1 ? 'Lanza el segundo pilum' : 'Aguanta, ya llegan')
      : !S.choque ? 'Carga contra su línea' : S.huida ? 'Huyen: la línea es tuya' : S.derrota ? 'Tu línea se rompe' : 'Rompe su línea: para, golpea, releva';
    /* el estado en palabras: tus hombres y, si caben, los galos */
    const tr = linea('Tuyos', S.unidad), tg = linea('Galos', S.unidadG);
    if (tr !== textoR) { $('est-r').innerHTML = tr; textoR = tr; }
    if (tg !== textoG) { $('est-g').innerHTML = tg; textoG = tg; }
    const ec = $('eco'), ve = S.eco && S.T - S.eco.t < 1.4 && S.T >= S.eco.t;
    if (ve && ec.textContent !== S.eco.texto) ec.textContent = S.eco.texto;
    ec.className = ve ? 've ' + (S.eco.tipo || '') : '';
  }
  function muestraFin() {
    const n = S.llegaron, c = S.caidos, cg = S.galos.filter(g => !g.vivo).length, cr = M - vivos();
    if (S.ruptura) {
      /* TP1b: gana quien rompe al otro. El veredicto en palabras y las bajas de los dos bandos */
      $('fin-t').textContent = veredicto(S.unidad, S.unidadG);
      $('fin-p').textContent = (S.ruptura === 'galos' ? 'Los galos rompieron y huyeron. ' : 'Tus hombres rompieron. ') + `Bajas: ${cr} de tus ${M} hombres; ${cg} de 16 galos (${c} por los pila). `
        + (S.ruptura === 'galos' ? (cr <= 6 ? 'El manípulo aguantó entero.' : 'Para a tiempo y releva a los cansados: perderás menos.') : 'Sube los escudos cuando cansen, y releva la primera fila.');
    } else {
      $('fin-t').textContent = n >= M * 0.8 ? '¡Choque!' : n >= M * 0.5 ? 'Llegasteis' : 'Llegasteis a duras penas';
      $('fin-p').textContent = `Los pila tumbaron ${c} galo${c === 1 ? '' : 's'}. Quedan ${n} de ${M} hombres en pie. ` + (c < 7 ? 'Suelta el pilum con la aguja en la zona verde, y lanza los dos.' : n >= M * 0.8 ? 'El testudo aguantó y los pila hicieron su trabajo.' : 'Sube los escudos a tiempo cuando suene el aviso.');
    }
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
  for (const id of ['escudos', 'cargad', 'relevo']) $(id).addEventListener('pointerdown', e => { e.preventDefault(); ordena(id); });
  /* los gestos del duelo: un toque cada uno */
  for (const id of ['parar', 'estocada', 'empujar']) $(id).addEventListener('pointerdown', e => { e.preventDefault(); S.pide = id; });
  /* GM43h: «Lanzar» se mantiene: al bajar el dedo se arma el brazo, al soltarlo se lanza (un toque corto también lanza, flojo).
     Si el navegador cancela el toque, se lanza igual: el botón nunca se queda enganchado */
  const accion = $('accion');
  accion.addEventListener('pointerdown', e => { e.preventDefault(); try { accion.setPointerCapture(e.pointerId); } catch (x) { /* nada */ } S.dedo = true; armar(); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) accion.addEventListener(ev, () => { if (!S.dedo) return; S.dedo = false; soltar(); });
  $('otra').addEventListener('click', () => { location.href = location.pathname; });
  $('salir').addEventListener('click', () => { location.href = document.baseURI; });
  return { hud, muestraFin };
}
