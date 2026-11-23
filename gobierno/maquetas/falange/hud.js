/* Pieza «hud» (FA3, falange): lo que se ve encima de la escena. Pantalla limpia: sin botones de golpe.
   Arriba: Salir, una línea con la situación (nunca un botón), la barra fina de cohesión y el terreno; al centro el
   estandarte (único botón de mando) con la orden vigente; al tocarlo, el abanico de cuatro órdenes y el tiempo a un tercio.
   Abajo a la izquierda, las cinco rayas de filas. Las huellas de los pulgares; la derecha hace de aro del compás en el choque.
   Flanco: el borde de ese lado en rojo. Las órdenes van por el puente de dedos.js (diseño FA3 §3).
   Contrato: crearHud(m) con m = { S, Son, $, puente, dedos, acc } devuelve { hud, muestraFin, lento, abierto }. */
import { META, AVISO_FLANCO } from './acciones.js';
export function crearHud(m) {
  const { S, Son, $, puente, dedos, acc } = m;
  const linea = (nombre, u) => { const p = u.palabras(); return `${nombre} · ${p.enPie} en pie · ${p.animo} · ${p.cansancio} · ${p.combate}`; };
  let abierto = false, t0 = null, tPrev = -1;
  const ORDEN_T = { aguantar: 'Aguantar', empujar: 'Empujad' };
  /* la situación, en pocas palabras */
  function situacion() {
    if (S.ganador) return S.ganador === 'falange' ? 'El manípulo rompe' : 'Tu falange rompe';
    if (!S.choque) {
      if (S.fase === 'marcha') return !S.andando ? 'Toca para avanzar' : S.picas ? 'Vienen pila: alza las filas' : 'Avanzáis con las filas alzadas';
      if (!S.salva || S.T - S.tSalva < 1.6) return S.picas ? 'Vienen pila: alza las filas' : 'Los pila caen en el bosque de astas';
      return S.picas ? 'Filas abajo: llega el choque' : 'Cargan: baja las filas';
    }
    if (S.flanco && !S.flanco.hecho) return S.flanco.lado > 0 ? 'Entran por la derecha' : 'Entran por la izquierda';
    if (S.colado) return 'Hay uno dentro: cerrad filas';
    if (S.orden === 'aguantar') return S.coh < 95 ? 'El muro se rehace' : 'Muro firme';
    if (S.coh < 40 || (S.orden === 'empujar' && S.coh < 68)) return 'El muro se afloja';
    return S.orden === 'empujar' ? 'Empujáis: marca el compás' : 'Marca el compás';
  }
  function abre(v) { abierto = v; $('abanico').hidden = !v; $('estandarte').classList.toggle('abierto', v); $('cinta').style.visibility = v ? 'hidden' : ''; }
  function hud() {
    $('nos').textContent = linea('Falange', S.U); $('ellos').textContent = linea('Romanos', S.R);
    const fin = S.fase === 'fin' || !!S.ganador, c = acc.consejo(), L = puente.lee(), D = dedos.estado(), W = innerWidth, Hh = innerHeight;
    if (t0 === null || S.T < tPrev - 1e-6) t0 = S.T; tPrev = S.T;
    $('objetivo').textContent = situacion();
    const k = Math.round(S.coh); $('coh').style.width = k + '%'; $('coh').style.background = k >= 60 ? 'var(--verde)' : k >= 40 ? '#e6ac3c' : 'var(--rojo)'; $('cohn').textContent = k;
    $('terreno').textContent = `${Math.floor(S.ganado)} de ${META} m`;
    /* el estandarte y su abanico */
    $('estandarte').hidden = fin; if (fin && abierto) abre(false);
    $('estandarte-t').textContent = ORDEN_T[S.orden] || (S.andando ? 'Adelante' : S.retrocede ? 'Atrás' : 'Libre');
    $('estandarte').classList.toggle('pide', !abierto && !fin && (c.toca === 'aguantar' || c.toca === 'empujad') && !(S.flanco && !S.flanco.hecho));
    for (const b of $('abanico').children) b.classList.toggle('vigente', (b.dataset.o === 'aguantar' && S.orden === 'aguantar') || (b.dataset.o === 'empujad' && S.orden === 'empujar') || (b.dataset.o === 'retroceder' && S.retrocede));
    /* las rayas */
    $('rayas').hidden = fin;
    for (const r of $('rayas').children) r.classList.toggle('baja', !!L.filas[+r.dataset.i]);
    /* las huellas: donde está el pulgar o, si no, donde suele caer */
    const vert = Hh > W, yBase = vert ? Hh * 0.78 : Hh * 0.7;
    const hd = $('huella-d'), hi = $('huella-i'), dX = D.der.activo ? D.der.x : W * 0.8, dY = D.der.activo ? D.der.y : yBase;
    hd.style.left = dX + 'px'; hd.style.top = dY + 'px'; hd.classList.toggle('toca', D.der.activo); hd.hidden = fin;
    const r0 = $('rayas').getBoundingClientRect();
    hi.style.left = (D.izq.activo ? D.izq.x : r0.left + r0.width / 2) + 'px'; hi.style.top = (D.izq.activo ? D.izq.y : r0.top - 40) + 'px'; hi.classList.toggle('toca', D.izq.activo); hi.hidden = fin || !D.izq.activo;
    /* el compás: el aro se cierra sobre la huella derecha y se enciende verde en el «¡Ha!» */
    if (S.choque && !fin) { const u = 1 - L.pulso; $('aro').style.transform = `scale(${(1 + 0.6 * u).toFixed(3)})`; $('aro').style.opacity = (0.3 + 0.7 * (1 - u)).toFixed(2); }
    else $('aro').style.opacity = 0;
    hd.classList.toggle('ya', S.choque && !fin && L.enCompas);
    /* la pista de los pulgares: 3 s al empezar */
    const pista = !fin && S.T - t0 < 3;
    $('pista-d').style.left = Math.min(dX, W - 100) + 'px'; $('pista-d').style.top = (dY - 50) + 'px'; $('pista-d').classList.toggle('ve', pista);
    $('pista-i').style.left = (r0.left + r0.width / 2) + 'px'; $('pista-i').style.top = (r0.top - 14) + 'px'; $('pista-i').classList.toggle('ve', pista);
    /* el arco de grados mientras arrastras */
    const gira = D.der.activo && D.der.modo === 'arrastre';
    $('arco').hidden = !gira || fin;
    if (gira) { $('arco').style.left = D.der.x + 'px'; $('arco').style.top = (D.der.y - 92) + 'px'; $('arco').textContent = `${L.giro > 0 ? '+' : ''}${Math.round(L.giro)}°`; }
    /* el flanco: el borde de ese lado en rojo, más fuerte según se acaba el tiempo */
    const F = S.flanco && !S.flanco.hecho && !fin ? S.flanco : null;
    for (const [id, l] of [['borde-d', 1], ['borde-i', -1]]) { const q = F && F.lado === l ? Math.min(1, Math.max(0, 1 - (F.tI - S.T) / AVISO_FLANCO)) : -1; $(id).style.opacity = q < 0 ? 0 : (0.4 + 0.6 * q).toFixed(2); }
    if (S.tCinta && S.T - S.tCinta > 2.2) { $('cinta').classList.remove('ve'); S.tCinta = 0; }
    if (S.tGrito && S.T - S.tGrito > 1.8) { $('grito').classList.remove('ve'); S.tGrito = 0; }
  }
  function muestraFin() {
    const gana = S.ganador === 'falange', bF = S.U.hombres - S.U.enPie, bR = S.R.hombres - S.R.enPie, q = gana ? S.U.enPie / S.U.hombres : S.R.enPie / S.R.hombres;
    abre(false);
    $('fin-t').textContent = gana ? (q > 0.8 ? 'Victoria clara' : 'Victoria por poco') : (q > 0.8 ? 'Derrota clara' : 'Derrota por poco');
    $('fin-p').textContent = (gana ? 'El manípulo rompe y huye ante el muro de puntas. ' : 'Tu falange rompe y huye. ') + `Bajas: ${bF} de los tuyos y ${bR} romanos. Terreno ganado: ${Math.floor(S.ganado)} m. ` +
      `Estocadas: ${S.golpes.buenos} al compás y ${S.golpes.parados} a destiempo. ` + (gana ? 'Muro firme, golpe a compás y flancos cerrados: así ganaba la falange de Pirro.' : 'Toca al compás, cierra filas cuando se abra un hueco y gira hacia el flanco.');
    $('fin').hidden = false;
  }
  addEventListener('pointerdown', () => { if (!Son.listo() && Son.inicia()) Son.cuerno(); }, { once: true });
  /* con el abanico abierto, tocar fuera lo cierra y ese toque no es gesto */
  addEventListener('pointerdown', e => { if (abierto && !e.target.closest('#abanico,#estandarte')) { abre(false); e.aqvIgnora = true; } }, true);
  $('estandarte').addEventListener('click', () => abre(!abierto));
  for (const b of $('abanico').children) b.addEventListener('click', () => { puente.estandarte(b.dataset.o); abre(false); });
  $('otra').addEventListener('click', () => { location.href = location.pathname; });
  $('salir').addEventListener('click', () => { location.href = document.baseURI; });
  return { hud, muestraFin, lento: () => abierto, abierto: () => abierto };
}
