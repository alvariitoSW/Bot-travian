/* AQVILA — FU3b: el gesto propio de la falange en la escena única del bloque. Solo reglas: sin three.js ni DOM (corre en Node).
   Inspirado en Polibio 18.29–32 (la falange es un muro de sarisas que, bien sostenido, ensarta a quien llega, pero si se abre un hueco
   el enemigo entra por él). Licencia de juego: todas las cifras (tiempos, ventana, efectos en cohesión y moral).

   CONTRATO
     const F = crearFalangita({ S, azar, alAviso })
       S        el estado de crearCombate (js/bloque-ia.js): S.tuyo (bloque de reglas) y, si hay, S.B (bloque LP1 con B.hombres, cada uno {col, fila, vivo})
       azar     función 0..1 (si falta, una semilla propia)
       alAviso  (tipo, datos) opcional, para la escena:
                'acomete' { t }  (segundos hasta el golpe)  ·  'golpe' { res: 'ensarta' } | { res: 'entra', hueco }
                'cierra' { col, h }  ·  'brecha' { col }
     F.pide(gesto, datos)   'bajar' (desliza hacia abajo: las sarisas de la fila bajan T_BAJADAS s) · 'cerrar' { col } (arrastra al de atrás al hueco)
     F.paso(dt)             avanza la acometida del rival y el hueco
     F.estado()             { lucha, rival { fase 'guardia'|'acomete', t (0..1 del aviso) } | null, bajadas, hueco { col, t (0..1 restante) } | null,
                              eco { texto, tipo 'bien'|'mal'|'', t }, ensartados, entradas, brechas, cerrados }
     F.rival / F.hueco      el rival en curso { b, ts, pendiente, ... } y el hueco abierto { col, h, t0, tFin } (o null)
   Hay LUCHA solo si tu bloque tiene contacto con un bloque enemigo vivo. Fuera de contacto no pasa nada. */

export const ESPERA_MIN = 2.5, ESPERA_VAR = 2, AVISO = 1.1, T_BAJADAS = 0.8, VENTANA = 0.5, T_HUECO = 3, RETRASO_ENSARTA = 1;
export const COH_ENSARTA = 4, COH_BRECHA = 6;
export const ANIMO_ENSARTA_RIVAL = -0.03, ANIMO_ENSARTA_TUYO = 0.02, ANIMO_ENTRA = -0.03, ANIMO_BRECHA = -0.04;

function semillaPropia(s) { return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function crearFalangita({ S, azar, alAviso, motor } = {}) {
  /* motor (opcional): el de js/falange.js (C.motor de formaciones/falange.js). Con él, los que caen son hombres de verdad del motor
     (caeRival, caeFalangita, cohesion): la vista de bloque (S) se rehace en cada paso y no se escribe. Sin él, las reglas de bloque */
  const rnd = azar || semillaPropia(20251124);
  const aviso = (t, d) => { try { if (alAviso) alAviso(t, d); } catch (e) { /* la pantalla no tumba las reglas */ } };
  const B = S && S.B, mitad = B ? (B.cols - 1) / 2 : 0;
  let T = 0, tBajar = -9, rival = null, hueco = null, ensartados = 0, entradas = 0, brechas = 0, cerrados = 0;
  const eco = { texto: '', tipo: '', t: -9 };
  const dice = (texto, tipo = '') => { eco.texto = texto; eco.tipo = tipo; eco.t = T; };
  const delEnemigo = b => b && b.bando !== S.tuyo.bando && b.estado !== 'fuera' && !b.U.roto && b.U.enPie > 0;
  function rivalEnContacto() { if (!S || !S.tuyo || !S.tuyo.contactos.length) return null; const c = S.tuyo.contactos.find(c => delEnemigo(c.b)); return c ? c.b : null; }
  const espera = () => ESPERA_MIN + rnd() * ESPERA_VAR;
  const nuevoRival = b => ({ b, pendiente: false, t0: -9, ts: -9, next: T + espera() });

  function arma() { rival.pendiente = true; rival.t0 = T; rival.ts = T + AVISO; aviso('acomete', { t: AVISO }); }
  function ensarta() {
    const b = rival.b, U = S.tuyo.U; ensartados++;
    if (motor && S.fal) {   /* cae el rival vivo más cerca del centro de tu primera fila */
      const v = S.fal.ene.filter(h => h.vivo && h.est !== 'huye').sort((a, c) => Math.hypot(a.x - S.tuyo.x, a.z - S.tuyo.z) - Math.hypot(c.x - S.tuyo.x, c.z - S.tuyo.z))[0];
      if (v) motor.caeRival(v);
    } else { b.U.baja(1); U.causa(1); b.coh = Math.max(0, b.coh - COH_ENSARTA); }
    b.U.anima(ANIMO_ENSARTA_RIVAL); U.anima(ANIMO_ENSARTA_TUYO);
    rival.next = T + espera() + RETRASO_ENSARTA;
    dice('¡Ensartado!', 'bien'); aviso('golpe', { res: 'ensarta' });
  }
  function entra() {
    const U = S.tuyo.U; entradas++; let h = null, col = null;
    const yoI = motor && S.fal && S.fal.yo ? S.fal.yo.i : -1;   /* con el motor, no cae el hombre que eres tú */
    if (B) { h = B.hombres.filter(x => x.vivo && !x.huye && x.fila === 0 && x.i !== yoI).sort((a, b) => Math.abs(a.col - mitad) - Math.abs(b.col - mitad))[0] || null; if (h) col = h.col; }
    if (motor && h) motor.caeFalangita(h, 'acomete');
    else { if (h) h.vivo = false; U.baja(1); }
    U.anima(ANIMO_ENTRA);
    hueco = { col, h, t0: T, tFin: T + T_HUECO };
    dice('Entran: ¡cierra el hueco!', 'mal'); aviso('golpe', { res: 'entra', hueco });
  }
  function golpe() {
    rival.pendiente = false; rival.next = T + espera();
    if (tBajar >= rival.ts - VENTANA && tBajar <= rival.ts) ensarta(); else entra();
  }
  function cierra(col) {
    const h = hueco.h; let n = null;
    if (B && hueco.col != null && !motor) { n = B.hombres.filter(x => x.vivo && x.col === hueco.col && x.fila > 0).sort((a, b) => a.fila - b.fila)[0] || null; if (n) n.fila = 0; }
    cerrados++; const c = hueco.col; hueco = null; if (rival) rival.next = Math.max(rival.next, T + espera());
    dice('¡Muro cerrado!', 'bien'); aviso('cierra', { col: c, h: n || h });
  }
  function brecha() {
    const U = S.tuyo.U, c = hueco.col; brechas++; hueco = null;
    if (motor && B) {   /* entra otro rival por el hueco: cae el de al lado y el muro pierde cohesión */
      const yoI = S.fal && S.fal.yo ? S.fal.yo.i : -1, h = B.hombres.filter(x => x.vivo && !x.huye && x.fila === 0 && x.i !== yoI).sort((a, b) => Math.abs(a.col - (c ?? mitad)) - Math.abs(b.col - (c ?? mitad)))[0];
      if (h) motor.caeFalangita(h, 'brecha'); motor.cohesion(-COH_BRECHA);
    } else { U.baja(1); S.tuyo.coh = Math.max(0, S.tuyo.coh - COH_BRECHA); }
    U.anima(ANIMO_BRECHA);
    if (rival) rival.next = Math.max(rival.next, T + espera());
    dice('Brecha en la falange', 'mal'); aviso('brecha', { col: c });
  }

  function pide(gesto, datos) {
    if (gesto === 'bajar') tBajar = T;
    else if (gesto === 'cerrar') { if (hueco && (!datos || datos.col == null || hueco.col == null || datos.col === hueco.col)) cierra(); }
    return null;
  }

  function paso(dt) {
    T += dt;
    if (hueco && T >= hueco.tFin) brecha();
    const b = rivalEnContacto();
    if (!b) { if (rival) rival.pendiente = false; return; }
    if (!rival || rival.b !== b) rival = nuevoRival(b);
    if (rival.pendiente) { if (T >= rival.ts) golpe(); }
    else if (!hueco && T >= rival.next) arma();
  }

  function estado() {
    const lucha = !!rivalEnContacto();
    const rv = lucha && rival ? { fase: rival.pendiente ? 'acomete' : 'guardia', t: rival.pendiente ? Math.min(1, (T - rival.t0) / AVISO) : 0 } : null;
    return { lucha, rival: rv, bajadas: T - tBajar < T_BAJADAS, hueco: hueco ? { col: hueco.col, t: Math.max(0, (hueco.tFin - T) / T_HUECO) } : null,
      eco: { ...eco }, ensartados, entradas, brechas, cerrados };
  }

  return { pide, paso, estado, get rival() { return rival; }, get hueco() { return hueco; } };
}
