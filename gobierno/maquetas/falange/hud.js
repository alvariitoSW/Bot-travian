/* Pieza «hud» (TP7a, falange): lo que se ve encima de la escena y los botones. Lee el estado; las órdenes las pasa a
   acciones.js. Arriba, el siguiente paso en pocas palabras, la cohesión del muro, el terreno ganado y el estado de las
   dos unidades (de unidad.js, las de TP0 §6). Abajo, un botón por orden; el que toca late y los que no sirven, apagados.
   TP8b-P2: sobre «Golpe», un anillo que se cierra al compás; en el latido se pone verde y dice «¡Ha!».
   Contrato: crearHud(m) con m = { S, Son, $, orden, golpe, acc } devuelve { hud, muestraFin }. */
import { PULSO, META } from './acciones.js';
export function crearHud(m) {
  const { S, Son, $, orden, golpe, acc } = m;
  const linea = (nombre, u) => { const p = u.palabras(); return `${nombre} · ${p.enPie} en pie · ${p.animo} · ${p.cansancio} · ${p.combate}`; };
  const IDS = ['avanzar', 'aguantar', 'picas', 'empujad', 'golpe'];
  function hud() {
    $('nos').textContent = linea('Falange', S.U); $('ellos').textContent = linea('Romanos', S.R);
    $('nos').className = S.U.roto ? 'mal' : ''; $('ellos').className = S.R.roto ? 'bien' : '';
    const fin = S.fase === 'fin' || !!S.ganador, c = acc.consejo();
    $('avanzar').hidden = S.choque || fin; $('avanzar').classList.toggle('activa', S.andando); $('avanzar-t').textContent = S.andando ? 'Alto' : 'Avanzar';
    $('aguantar').hidden = fin; $('aguantar').classList.toggle('activa', S.orden === 'aguantar');
    $('picas').hidden = fin; $('picas').classList.toggle('activa', S.picas); $('picas-t').textContent = S.picas ? 'Alzar picas' : 'Picas abajo';
    $('empujad').hidden = !S.choque || fin; $('empujad').classList.toggle('activa', S.orden === 'empujar');
    $('golpe').hidden = !S.choque || fin;
    for (const id of IDS) { $(id).classList.toggle('pide', c.toca === id); $(id).classList.toggle('apagado', c.off.includes(id)); }
    $('objetivo').textContent = c.texto;
    /* la cohesión y el terreno */
    const k = Math.round(S.coh); $('coh').style.width = k + '%'; $('coh').style.background = k >= 60 ? 'var(--verde)' : k >= 40 ? '#e6ac3c' : 'var(--rojo)'; $('cohn').textContent = k;
    $('terreno').textContent = `Terreno ganado: ${Math.floor(S.ganado)} de ${META} m`;
    /* el compás: el anillo se cierra sobre «Golpe» y late en el golpe de tambor */
    if (S.choque && !fin) {
      const f = acc.fasePulso() / PULSO, u = 1 - f, ya = acc.enPulso();
      $('anillo').style.transform = `scale(${(1 + 0.45 * u).toFixed(3)})`; $('anillo').style.opacity = (0.35 + 0.65 * (1 - u)).toFixed(2);
      $('golpe').classList.toggle('ya', ya);
    }
    /* el aviso de flanco: flecha grande al lado por donde vienen y los segundos que quedan */
    const F = S.flanco && !S.flanco.hecho ? S.flanco : null; $('flanco').hidden = !F || fin;
    if (F) { $('flanco').classList.toggle('izq', F.lado < 0); $('flanco-t').textContent = F.lado > 0 ? '¡Por la derecha!' : '¡Por la izquierda!'; $('flanco-s').textContent = S.orden === 'aguantar' ? 'Cerrando…' : `Aguantar · ${Math.max(0, Math.ceil(F.tI - S.T))} s`; }
    if (S.tCinta && S.T - S.tCinta > 2.2) { $('cinta').classList.remove('ve'); S.tCinta = 0; }
    if (S.tGrito && S.T - S.tGrito > 1.8) { $('grito').classList.remove('ve'); S.tGrito = 0; }
  }
  function muestraFin() {
    const gana = S.ganador === 'falange', bF = S.U.hombres - S.U.enPie, bR = S.R.hombres - S.R.enPie, q = gana ? S.U.enPie / S.U.hombres : S.R.enPie / S.R.hombres;
    $('fin-t').textContent = gana ? (q > 0.8 ? 'Victoria clara' : 'Victoria por poco') : (q > 0.8 ? 'Derrota clara' : 'Derrota por poco');
    $('fin-p').textContent = (gana ? 'El manípulo rompe y huye ante el muro de puntas. ' : 'Tu falange rompe y huye. ') + `Bajas: ${bF} de los tuyos y ${bR} romanos. Terreno ganado: ${Math.floor(S.ganado)} m. ` +
      `Estocadas: ${S.golpes.buenos} al compás y ${S.golpes.parados} a destiempo. ` + (gana ? 'Muro firme, golpe a compás y flancos cerrados: así ganaba la falange de Pirro.' : 'Pincha al compás, aguanta cuando se abre un hueco y cierra los flancos.');
    $('fin').hidden = false;
  }
  addEventListener('pointerdown', () => { if (!Son.listo() && Son.inicia()) Son.cuerno(); }, { once: true });
  for (const [id, n] of [['avanzar', 'avanzar'], ['aguantar', 'aguantar'], ['picas', 'picas'], ['empujad', 'empujad']]) $(id).addEventListener('pointerdown', e => { e.preventDefault(); orden(n); });
  $('golpe').addEventListener('pointerdown', e => { e.preventDefault(); golpe(); });
  $('otra').addEventListener('click', () => { location.href = location.pathname; });
  $('salir').addEventListener('click', () => { location.href = document.baseURI; });
  return { hud, muestraFin };
}
