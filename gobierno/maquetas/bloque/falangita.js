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
     FU3c: dos gestos más. 'empuje' (sostener: F.pide('sostener', { on })) y 'othismos' (compás: F.pide('golpe')). Avisos: 'empuja' { t } · 'aguanta' { ok, k } ·
                'othismos' { t } · 'compas' { n } · 'golpe-oth' { bien } · 'othismos-fin' { res: 'gana'|'pierde'|'tablas' }
     F.estado() añade empuje null | { fase 'aviso'|'empuja', t, sujeta, k }, othismos null | { fase, t, fuerza, compas (0 = en el golpe), ultimo, tUltimo }, sujeta,
                aguantes, cedidos, othGanados, othPerdidos, primera { acomete, empuje, othismos }
     F.pide(gesto, datos)   'bajar' (desliza hacia abajo: las sarisas de la fila bajan T_BAJADAS s) · 'cerrar' { col } (arrastra al de atrás al hueco)
     F.paso(dt)             avanza la acometida del rival y el hueco
     F.estado()             { lucha, rival { fase 'guardia'|'acomete', t (0..1 del aviso) } | null, bajadas, hueco { col, t (0..1 restante) } | null,
                              eco { texto, tipo 'bien'|'mal'|'', t }, ensartados, entradas, brechas, cerrados }
     F.rival / F.hueco      el rival en curso { b, ts, pendiente, ... } y el hueco abierto { col, h, t0, tFin } (o null)
   Hay LUCHA solo si tu bloque tiene contacto con un bloque enemigo vivo. Fuera de contacto no pasa nada. */

export const ESPERA_MIN = 2.5, ESPERA_VAR = 2, AVISO = 1.1, T_BAJADAS = 0.8, VENTANA = 0.5, T_HUECO = 3, RETRASO_ENSARTA = 1;
export const AVISO_EMP = 0.9, T_EMP = 2.5, V_CEDE = 0.6, COH_CEDE = 4, K_AGUANTA = 0.8;
export const AVISO_OTH = 1.0, T_OTH = 5, R_OTH = 0.12, BEAT = 0.8, VENT_OTH = 0.16, SUBE_BIEN = 0.17, SUBE_FLOJO = 0.04, UMBRAL_OTH = 0.25, PESOS = [0.45, 0.3, 0.25];
export const COH_ENSARTA = 4, COH_BRECHA = 6;
export const ANIMO_ENSARTA_RIVAL = -0.03, ANIMO_ENSARTA_TUYO = 0.02, ANIMO_ENTRA = -0.03, ANIMO_BRECHA = -0.04;

function semillaPropia(s) { return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function crearFalangita({ S, azar, alAviso, motor } = {}) {
  /* motor (opcional): el de js/falange.js (C.motor de formaciones/falange.js). Con él, los que caen son hombres de verdad del motor
     (caeRival, caeFalangita, cohesion): la vista de bloque (S) se rehace en cada paso y no se escribe. Sin él, las reglas de bloque */
  const rnd = azar || semillaPropia(20251124);
  const aviso = (t, d) => { try { if (alAviso) alAviso(t, d); } catch (e) { /* la pantalla no tumba las reglas */ } };
  const B = S && S.B, mitad = B ? (B.cols - 1) / 2 : 0;
  let nEv = 0, sujeta = false, ev = null, cuentas = { acomete: 0, empuje: 0, othismos: 0 }, aguantes = 0, cedidos = 0, othGanados = 0, othPerdidos = 0, cum = 0, pulsoAnt = null;
  let T = 0, tBajar = -9, rival = null, hueco = null, ensartados = 0, entradas = 0, brechas = 0, cerrados = 0;
  const eco = { texto: '', tipo: '', t: -9 };
  const dice = (texto, tipo = '') => { eco.texto = texto; eco.tipo = tipo; eco.t = T; };
  const delEnemigo = b => b && b.bando !== S.tuyo.bando && b.estado !== 'fuera' && !b.U.roto && b.U.enPie > 0;
  function rivalEnContacto() { if (!S || !S.tuyo || !S.tuyo.contactos.length) return null; const c = S.tuyo.contactos.find(c => delEnemigo(c.b)); return c ? c.b : null; }
  const espera = () => ESPERA_MIN + rnd() * ESPERA_VAR;
  const nuevoRival = b => ({ b, pendiente: false, t0: -9, ts: -9, next: T + espera() });

  const animoRival = () => { const a = rival && rival.b && rival.b.U ? rival.b.U.animo : 0.8; return typeof a === 'number' ? a : 0.8; };
  const finEv = () => { ev = null; if (rival) rival.next = T + espera(); };
  function tipoSig() { if (nEv < 3) return ['acomete', 'empuje', 'othismos'][nEv]; let r = rnd() * (PESOS[0] + PESOS[1] + PESOS[2]); return r < PESOS[0] ? 'acomete' : r < PESOS[0] + PESOS[1] ? 'empuje' : 'othismos'; }
  function armaEv() {
    const tp = tipoSig(); nEv++; cuentas[tp]++;
    if (tp === 'acomete') return arma();
    if (tp === 'empuje') { ev = { tipo: 'empuje', t0: T, tIni: T + AVISO_EMP, tFin: T + AVISO_EMP + T_EMP, suj: 0, dur: 0 }; aviso('empuja', { t: AVISO_EMP }); }
    else { ev = { tipo: 'othismos', t0: T, tIni: T + AVISO_OTH, tFin: T + AVISO_OTH + T_OTH, fuerza: 0, ultimo: '', tUltimo: -9, tocados: new Set(), nCompas: Math.floor(cum * 2), seguidos: 0 }; aviso('othismos', { t: AVISO_OTH }); }
  }
  function pasoEmpuje(dt) {
    if (T < ev.tIni) return;
    ev.dur += dt; if (sujeta) ev.suj += dt;
    else if (motor) { motor.empuja(-V_CEDE * dt); motor.cohesion(-COH_CEDE * dt); } else S.tuyo.coh = Math.max(0, S.tuyo.coh - COH_CEDE * dt);
    if (T >= ev.tFin) {
      const k = Math.min(1, ev.suj / T_EMP), ok = k >= K_AGUANTA, U = S.tuyo.U, b = rival.b;
      if (ok) { aguantes++; b.U.anima(-0.02); U.anima(0.01); dice('¡Aguantan!', 'bien'); } else { cedidos++; U.anima(-0.02); dice('La fila cede', 'mal'); }
      aviso('aguanta', { ok, k }); finEv();
    }
  }
  function cierraOth(res) {
    const b = rival.b, U = S.tuyo.U;
    if (res === 'gana') {
      othGanados++;
      if (motor && S.fal) { motor.empuja(1.5); const v = S.fal.ene.filter(h => h.vivo && h.est !== 'huye').sort((a, c) => Math.hypot(a.x - S.tuyo.x, a.z - S.tuyo.z) - Math.hypot(c.x - S.tuyo.x, c.z - S.tuyo.z))[0]; if (v) motor.caeRival(v); }
      else { b.U.baja(1); U.causa(1); b.coh = Math.max(0, b.coh - 6); }
      b.U.anima(-0.04); dice('¡Othismos ganado!', 'bien');
    } else if (res === 'pierde') {
      othPerdidos++;
      if (motor) { motor.empuja(-1.5); motor.cohesion(-8); } else S.tuyo.coh = Math.max(0, S.tuyo.coh - 8);
      U.anima(-0.03); dice('Os empujan', 'mal');
    } else dice('Tablas', '');
    aviso('othismos-fin', { res }); finEv();
  }
  function pasoOth(dt) {
    if (T < ev.tIni) return;
    ev.fuerza = Math.max(-1, ev.fuerza - R_OTH * (0.7 + 0.6 * animoRival()) * dt);
    const n = Math.floor(cum * 2); if (n > ev.nCompas) { ev.nCompas = n; aviso('compas', { n }); }
    if (ev.fuerza >= 1) return cierraOth('gana');
    if (ev.fuerza <= -1) return cierraOth('pierde');
    if (T >= ev.tFin) cierraOth(ev.fuerza >= UMBRAL_OTH ? 'gana' : ev.fuerza <= -UMBRAL_OTH ? 'pierde' : 'tablas');
  }
  function golpeOth() {
    if (!ev || ev.tipo !== 'othismos' || T < ev.tIni) return;
    const f = cum * 2, k = Math.round(f), d = Math.abs(f - k) * BEAT, nuevo = !ev.tocados.has(k), bien = d <= VENT_OTH && nuevo;
    ev.tocados.add(k); ev.tUltimo = T; ev.ultimo = bien ? 'bien' : 'flojo'; ev.seguidos = bien ? ev.seguidos + 1 : 0;
    ev.fuerza = Math.min(1, ev.fuerza + (bien ? SUBE_BIEN : SUBE_FLOJO)); aviso('golpe-oth', { bien });
    if (ev.fuerza >= 1) cierraOth('gana');
  }
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
    else if (gesto === 'sostener') sujeta = !!(datos && datos.on);
    else if (gesto === 'golpe') golpeOth();
    else if (gesto === 'cerrar') { if (hueco && (!datos || datos.col == null || hueco.col == null || datos.col === hueco.col)) cierra(); }
    return null;
  }

  function paso(dt) {
    T += dt;
    if (motor && S.fal && typeof S.fal.pulso === 'number') { let d = S.fal.pulso - (pulsoAnt ?? S.fal.pulso); if (d < 0) d += 1; cum += d; pulsoAnt = S.fal.pulso; } else cum += dt / (2 * BEAT);
    if (hueco && T >= hueco.tFin) brecha();
    const b = rivalEnContacto();
    if (!b) { if (rival) rival.pendiente = false; ev = null; return; }
    if (!rival || rival.b !== b) { rival = nuevoRival(b); ev = null; }
    if (ev) { if (ev.tipo === 'empuje') pasoEmpuje(dt); else pasoOth(dt); }
    else if (rival.pendiente) { if (T >= rival.ts) golpe(); }
    else if (!hueco && T >= rival.next) armaEv();
  }

  function estado() {
    const lucha = !!rivalEnContacto();
    const rv = lucha && rival ? { fase: rival.pendiente ? 'acomete' : 'guardia', t: rival.pendiente ? Math.min(1, (T - rival.t0) / AVISO) : 0 } : null;
    return { lucha, rival: rv, bajadas: T - tBajar < T_BAJADAS, hueco: hueco ? { col: hueco.col, t: Math.max(0, (hueco.tFin - T) / T_HUECO) } : null,
      eco: { ...eco }, ensartados, entradas, brechas, cerrados, sujeta, aguantes, cedidos, othGanados, othPerdidos,
      empuje: lucha && ev && ev.tipo === 'empuje' ? (T < ev.tIni ? { fase: 'aviso', t: (T - ev.t0) / AVISO_EMP, sujeta, k: 0 } : { fase: 'empuja', t: Math.min(1, (T - ev.tIni) / T_EMP), sujeta, k: Math.min(1, ev.suj / T_EMP) }) : null,
      othismos: lucha && ev && ev.tipo === 'othismos' ? (() => { const f = cum * 2, aviso = T < ev.tIni; return { fase: aviso ? 'aviso' : 'empuja', t: aviso ? (T - ev.t0) / AVISO_OTH : Math.min(1, (T - ev.tIni) / T_OTH), fuerza: ev.fuerza, compas: (Math.ceil(f) - f) % 1, ultimo: ev.ultimo, tUltimo: T - ev.tUltimo }; })() : null,
      primera: { acomete: !!(rival && rival.pendiente) && cuentas.acomete === 1, empuje: !!(ev && ev.tipo === 'empuje') && cuentas.empuje === 1, othismos: !!(ev && ev.tipo === 'othismos') && cuentas.othismos === 1 } };
  }

  return { pide, paso, estado, get rival() { return rival; }, get hueco() { return hueco; } };
}
