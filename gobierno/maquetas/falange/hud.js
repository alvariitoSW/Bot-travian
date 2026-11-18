/* Pieza «hud» (TP7a, falange): lo que se ve encima de la escena y los botones. Lee el estado; las órdenes las pasa a
   acciones.js. Arriba, el objetivo y el estado de las dos unidades en palabras (de unidad.js, las de TP0 §6). Abajo, un
   botón por orden: «Avanzar», «Aguantar», «Picas abajo», «Empujad» y, en la lucha, «Golpe». Miden al menos 44 px.
   Contrato: crearHud(m) con m = { S, Son, $, orden, golpe } devuelve { hud, muestraFin }. */
export function crearHud(m) {
  const { S, Son, $, orden, golpe } = m;
  const linea = (nombre, u) => { const p = u.palabras(); return `${nombre} · ${p.enPie} en pie · ${p.animo} · ${p.cansancio} · ${p.combate}`; };
  function hud() {
    $('nos').textContent = linea('Falange', S.U); $('ellos').textContent = linea('Romanos', S.R);
    $('nos').className = S.U.roto ? 'mal' : ''; $('ellos').className = S.R.roto ? 'bien' : '';
    const fin = S.fase === 'fin' || !!S.ganador;
    $('avanzar').hidden = S.choque || fin; $('avanzar').classList.toggle('activa', S.andando); $('avanzar-t').textContent = S.andando ? 'Alto' : 'Avanzar';
    $('aguantar').hidden = fin; $('aguantar').classList.toggle('activa', S.orden === 'aguantar');
    $('picas').hidden = fin; $('picas').classList.toggle('activa', S.picas); $('picas-t').textContent = S.picas ? 'Alzar picas' : 'Picas abajo';
    $('picas').classList.toggle('pide', !S.picas && (S.fase === 'carga' || S.choque));
    $('empujad').hidden = !S.choque || fin; $('empujad').classList.toggle('activa', S.orden === 'empujar');
    $('golpe').hidden = !S.choque || fin; $('golpe').classList.toggle('espera', S.T - S.tGolpe < 0.9);
    $('objetivo').textContent = S.ganador === 'falange' ? 'El manípulo rompe y huye' : S.ganador === 'romanos' ? 'Tu falange rompe' : S.choque ? 'Aguanta el muro y empuja' : S.fase === 'carga' ? '¡Cargan! Picas abajo' : S.fase === 'pila' ? 'Las picas alzadas os cubren' : 'Avanza hacia el manípulo romano';
    if (S.tCinta && S.T - S.tCinta > 2.2) { $('cinta').classList.remove('ve'); S.tCinta = 0; }
    if (S.tGrito && S.T - S.tGrito > 1.8) { $('grito').classList.remove('ve'); S.tGrito = 0; }
  }
  function muestraFin() {
    const gana = S.ganador === 'falange', bF = S.U.hombres - S.U.enPie, bR = S.R.hombres - S.R.enPie, q = gana ? S.U.enPie / S.U.hombres : S.R.enPie / S.R.hombres;
    $('fin-t').textContent = gana ? (q > 0.8 ? 'Victoria clara' : 'Victoria por poco') : (q > 0.8 ? 'Derrota clara' : 'Derrota por poco');
    $('fin-p').textContent = (gana ? 'El manípulo rompe y huye ante el muro de puntas. ' : 'Tu falange rompe y huye. ') + `Bajas: ${bF} de los tuyos y ${bR} romanos. ` +
      `Tus golpes: ${S.golpes.buenos} buenos y ${S.golpes.parados} parados. ` + (gana ? 'Picas abajo a tiempo y aguantar: así ganaba la falange de Pirro.' : 'Baja las picas antes de que lleguen: alzadas no paran a nadie.');
    $('fin').hidden = false;
  }
  addEventListener('pointerdown', () => { if (!Son.listo() && Son.inicia()) Son.cuerno(); }, { once: true });
  for (const [id, n] of [['avanzar', 'avanzar'], ['aguantar', 'aguantar'], ['picas', 'picas'], ['empujad', 'empujad']]) $(id).addEventListener('pointerdown', e => { e.preventDefault(); orden(n); });
  $('golpe').addEventListener('pointerdown', e => { e.preventDefault(); golpe(); });
  $('otra').addEventListener('click', () => { location.href = location.pathname; });
  $('salir').addEventListener('click', () => { location.href = document.baseURI; });
  return { hud, muestraFin };
}
