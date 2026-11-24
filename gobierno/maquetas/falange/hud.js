/* Pieza «hud» (LP6, falange): lo que se ve encima de la escena, con el control de «Manípulo a pie» (LP3).
   Arriba: Salir y una línea con la situación (nunca un botón); «Datos ▾» despliega las cifras (cohesión, terreno, en pie).
   Abajo: las cuatro órdenes de mando.js como estandartes con aro y palabra (Picas · Cerrar filas · Avanzar · Alto). La vigente
   se rellena de rojo; la que conviene se ilumina con un aro dorado que late. Nada en el centro: el grito de la orden sale
   encima de las órdenes y el flanco, en el borde de ese lado. El frente se dibuja en el suelo (dedos.js del bloque).
   Contrato: crearHud(m) con m = { S, Son, $, mando, rival?, vuelve? } devuelve { hud, muestraFin, lento }.
   LP7b: desde la batalla grande, rival es su nombre («Infantería libia») y vuelve() cierra la capa: «Salir» y el final llevan allí. */
import { AVISO_FLANCO } from './acciones.js';
export function crearHud(m) {
  const { S, Son, $, mando } = m, nomR = () => m.rival || NOMBRE[S.rival] || 'Rival';
  const pal = u => u.palabras ? u.palabras() : { enPie: u.enPie, animo: u.roto ? 'rompe' : u.animo > 0.45 ? 'firme' : 'duda', cansancio: (u.cansancio || 0) < 0.35 ? 'fresca' : u.cansancio < 0.7 ? 'cansada' : 'agotada', combate: 'igualado' };
  const NOMBRE = { manipulos: 'Romanos', caballeria: 'Jinetes', elefantes: 'Elefantes', falange: 'Falange rival', hoplitas: 'Hoplitas' };
  const linea = (nombre, u) => { const p = pal(u); return `${nombre} · ${p.enPie} en pie · ${p.animo} · ${p.cansancio} · ${p.combate}`; };
  /* metros desde tu primera fila hasta el rival más cercano que tienes delante */
  function cerca() {
    const M = S.motor; let d = 1e9; if (!M || !S.ene) return d;
    for (const h of S.ene) if (h.vivo && h.est !== 'huye') { const l = M.local(h.x, h.z); if (Math.abs(l.lado) < 14 && l.delante > -1) d = Math.min(d, l.delante); }
    return d;
  }
  /* la situación, en pocas palabras */
  function situacion(L) {
    if (S.ganador) return S.ganador === 'falange' ? 'El enemigo rompe y huye' : 'Tu falange rompe';
    if (S.flanco && S.flanco.estado === 'viene') return S.flanco.lado > 0 ? 'Vienen por la derecha: gira el frente' : 'Vienen por la izquierda: gira el frente';
    if (S.ene.some(h => h.vivo && h.est === 'dentro')) return 'Hay uno dentro: cerrad filas';
    if (!S.choque) {
      const d = cerca(), vuela = S.proyectiles.some(p => p.est === 1);
      if (vuela) return '¡Pila en el aire!';
      if (L.gira) return 'El muro gira';
      if (L.marcha) return d < 60 ? `El muro avanza · enemigo a ${Math.round(d)} m` : 'El muro avanza';
      return d < 60 ? `${m.rival || 'Enemigo'} a ${Math.round(d)} m` : 'Dibuja tu frente en el suelo';
    }
    const u = S.U, r = S.R, mios = u.enPie / u.hombres, suyos = r.enPie / r.hombres;
    if (S.coh < 40) return 'El muro se afloja';
    return suyos < mios - 0.12 ? 'Vais ganando' : suyos > mios + 0.12 ? 'Vais perdiendo' : 'Igualado';
  }
  let datos = false;
  function hud() {
    const fin = S.fase === 'fin' || !!S.ganador, L = mando.lee();
    $('objetivo').textContent = situacion(L);
    if (datos) {
      $('nos').textContent = linea('Falange', S.U); $('ellos').textContent = linea(nomR(), S.R);
      const k = Math.round(S.coh); $('coh').style.width = k + '%'; $('coh').style.background = k >= 60 ? 'var(--verde)' : k >= 40 ? '#e6ac3c' : 'var(--rojo)'; $('cohn').textContent = k;
      $('terreno').textContent = S.choque ? `${S.ganado >= 0 ? '+' : ''}${S.ganado.toFixed(0)} m` : `${S.filas.filter(Boolean).length} filas abajo`;
    }
    $('abajo').hidden = fin;
    for (const b of $('ordenes').children) {
      const o = b.dataset.o, t = L.texto[o];
      if (b.lastChild.textContent !== t) { b.lastChild.textContent = t; b.setAttribute('aria-label', t); }
      b.classList.toggle('vigente', !!L.vigente[o] && o !== 'picas'); b.classList.toggle('luz', L.conviene === o); if (o === 'picas') b.classList.toggle('alza', L.vigente.picas);
    }
    /* el flanco: el borde de ese lado en rojo, más fuerte según se acaba el tiempo */
    const F = S.flanco && S.flanco.estado === 'viene' && !fin ? S.flanco : null;
    for (const [id, l] of [['borde-d', 1], ['borde-i', -1]]) { const q = F && F.lado === l ? Math.min(1, Math.max(0, 1 - (F.tI - S.T) / AVISO_FLANCO)) : -1; $(id).style.opacity = q < 0 ? 0 : (0.4 + 0.6 * q).toFixed(2); }
    if (S.tCinta && S.T - S.tCinta > 2.2) { $('cinta').classList.remove('ve'); S.tCinta = 0; }
    if (S.tGrito && S.T - S.tGrito > 1.8) { $('grito').classList.remove('ve'); S.tGrito = 0; }
  }
  function muestraFin() {
    const gana = S.ganador === 'falange', bF = S.U.hombres - S.U.enPie, bR = S.R.hombres - S.R.enPie, q = S.U.enPie / S.U.hombres;
    $('fin-t').textContent = gana ? (q > 0.75 ? 'Victoria clara' : 'Victoria por poco') : (S.R.enPie / S.R.hombres > 0.75 ? 'Derrota clara' : 'Derrota por poco');
    const quien = nomR();
    $('fin-p').textContent = (gana ? `${quien}: rompen y huyen. ` : 'Tu falange rompe y huye. ') + `Bajas: ${bF} de los tuyos y ${bR} suyos. ` +
      (S.causa === 'bajas' ? 'Lucharon hasta quedar el 15\u00a0%. ' : '') +
      (gana ? (m.vuelve ? '' : 'Picas abajo al llegar, muro cerrado y frente al flanco: así ganaba la falange de Pirro.') : 'Baja las picas antes de que lleguen, cierra filas si se cuela uno y gira el frente hacia el flanco.');
    $('fin').hidden = false;
  }
  addEventListener('pointerdown', () => { if (!Son.listo() && Son.inicia()) Son.cuerno(); }, { once: true });
  for (const b of $('ordenes').children) b.addEventListener('click', () => { mando.orden(b.dataset.o); });
  $('datosB').addEventListener('click', () => { datos = !datos; $('datos').hidden = !datos; $('datosB').setAttribute('aria-expanded', datos); $('datosB').textContent = datos ? 'Datos ▴' : 'Datos ▾'; });
  if (m.vuelve) $('otra').textContent = 'Volver a la batalla';
  $('otra').addEventListener('click', () => { if (m.vuelve) return m.vuelve(); location.href = location.pathname + (S.rival !== 'manipulos' ? '?rival=' + S.rival : ''); });
  $('salir').addEventListener('click', () => { if (m.vuelve) return m.vuelve(); location.href = document.baseURI; });
  return { hud, muestraFin, lento: () => false, abierto: () => false };
}
