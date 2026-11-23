/* Pieza «dedos» (FA3, falange): los gestos de los pulgares y el puente que los traduce a las órdenes de hoy.
   Diseño: gobierno/estudios/FA3-diseno-dedos.md.
   - crearPuente({ S, acc, avisa }): EL ÚNICO SITIO que convierte gestos en órdenes de acciones.js. FA4 cambia solo este
     puente (cada función dice qué campo del contrato usará). Corre en Node: no toca el DOM.
   - crearDedos({ puente, S, zona }): reconoce los gestos con Pointer Events sobre window (dos dedos a la vez).
   - botDedos(puente, S, acc): un jugador que juega bien SOLO por el puente (para las pruebas).
   Gestos, compás a toques y abanico de órdenes: licencia de juego. */
import { PULSO } from './acciones.js';

const GIRO_V = 8 * Math.PI / 180, GIRO_MAX = 60 * Math.PI / 180;

export function crearPuente({ S, acc, avisa = () => {} }) {
  let tPrev = -1, lado = 0, soltarFlanco = false, picasVistas = null, estocadas = 0;
  const filas = () => { if (!Array.isArray(S.filas) || S.filas.length !== 5) S.filas = Array(5).fill(!!S.picas); return S.filas; };
  function nueva() { S.giro = 0; S.filas = Array(5).fill(!!S.picas); lado = 0; soltarFlanco = false; picasVistas = !!S.picas; estocadas = 0; S.tMiEstocada = -9; S.retrocede = false; }
  function asegura() {
    if (S.T === undefined) return;
    if (typeof S.giro !== 'number' || !Array.isArray(S.filas) || S.T < tPrev - 1e-6) nueva();
    tPrev = S.T;
    /* las picas cambiaron por otra vía (bot viejo, ?fase=): las cinco rayas se ponen iguales */
    if (picasVistas !== !!S.picas) { picasVistas = !!S.picas; const F = filas(); if ((F.filter(Boolean).length >= 3) !== picasVistas) F.fill(picasVistas); }
  }
  const flancoVivo = () => S.flanco && !S.flanco.hecho ? S.flanco : null;
  /* Tocar. Hoy: antes del choque echa a andar; en el choque, acc.golpe(). FA4: S.pulso (el muro empuja medio metro) */
  function toque() {
    asegura();
    if (S.fase === 'fin' || S.ganador) return null;
    if (!S.choque) { if (!S.andando) { S.retrocede = false; acc.orden('avanzar'); } return 'anda'; }
    return acc.golpe();
  }
  /* Deslizar hacia delante. Hoy solo se ve (tu sarisa clava y el marcado recula), sin dado. FA4: S.yo.tEstocada */
  function estocada() {
    asegura();
    if (S.fase === 'fin' || S.ganador) return false;
    estocadas++; S.tMiEstocada = S.T;
    const yo = S.fal && S.fal[S.yo]; if (yo) yo.tG = S.T;
    const r = S.choque ? acc.marcado() : null; if (r) r.tRecibe = S.T;
    avisa('clava', {});
    return true;
  }
  /* Arrastrar a un lado (lado -1, 0 o 1). Hoy: S.giro a 8°/s y, hacia el flanco anunciado, «aguantar». FA4: S.giro mueve muro, picas y cámara */
  function gira(l) {
    asegura(); lado = Math.sign(l || 0);
    const F = flancoVivo();
    if (lado && F && lado === F.lado && S.fase !== 'fin' && !S.ganador) { if (S.orden !== 'aguantar') { acc.orden('aguantar'); soltarFlanco = true; } }
  }
  /* Una raya (pulgar izquierdo). baja: true/false (o nada para cambiarla). Hoy manda la mayoría. FA4: S.filas[i], cada fila la suya */
  function fila(i, baja) {
    asegura(); const F = filas(); if (i < 0 || i > 4) return;
    F[i] = baja === undefined ? !F[i] : !!baja;
    const may = F.filter(Boolean).length >= 3;
    if (may !== !!S.picas && S.fase !== 'fin' && !S.ganador) { acc.orden('picas'); picasVistas = !!S.picas; }
  }
  /* El estandarte: aguantar · empujad · cerrar · retroceder. FA4 separa «cerrar» de «aguantar» y hace ceder terreno a «retroceder» */
  function estandarte(n) {
    asegura(); if (S.fase === 'fin' || S.ganador) return;
    if (n === 'aguantar' || n === 'cerrar') { if (S.orden !== 'aguantar') acc.orden('aguantar'); S.retrocede = false; }
    if (n === 'empujad') { S.retrocede = false; if (S.choque) acc.orden('empujad'); else if (!S.andando) acc.orden('avanzar'); }
    if (n === 'retroceder') {
      S.retrocede = true;
      if (S.andando) acc.orden('avanzar');
      else if (S.orden) { S.orden = null; avisa('grito', { texto: '¡Atrás, paso a paso!' }); }
    }
  }
  /* cada fotograma: el giro, soltar el «aguantar» del flanco y las rayas al día */
  function paso(dt) {
    asegura(); if (typeof S.giro !== 'number') return;
    if (lado) S.giro = Math.max(-GIRO_MAX, Math.min(GIRO_MAX, S.giro + lado * GIRO_V * dt));
    if (soltarFlanco && !S.flanco) { soltarFlanco = false; if (S.orden === 'aguantar') acc.orden('aguantar'); }
  }
  /* lo que leen el HUD y las pruebas. giro en grados */
  function lee() {
    asegura();
    return { giro: +((S.giro || 0) * 180 / Math.PI).toFixed(2), filas: filas().slice(), pulso: S.choque ? acc.fasePulso() / PULSO : 0, enCompas: !!(S.choque && acc.enPulso()), orden: S.orden || null, estocadas, girando: lado };
  }
  return { toque, estocada, gira, fila, estandarte, paso, lee };
}

/* Umbrales del diseño §2 (px y ms) */
const TOQUE_PX = 14, TOQUE_MS = 300, DESL_PX = 40, DESL_MS = 400, ARR_PX = 28, MUERTA_PX = 18;

export function crearDedos({ puente, S, zona = {} }) {
  const P = new Map(), est = { der: { activo: false, x: 0, y: 0, modo: '' }, izq: { activo: false, x: 0, y: 0, modo: '' }, tUltimo: 0 };
  const vertical = () => innerHeight > innerWidth;
  const ignora = e => e.aqvIgnora || (zona.ignora && zona.ignora(e)) || (e.target && e.target.closest && (e.target.closest('button') || e.target.closest('.velo')));
  const rayaEn = (x, y) => { const el = document.elementFromPoint(x, y); const r = el && el.closest && el.closest('.raya'); return r ? +r.dataset.i : -1; };
  function abajo(e) {
    if (ignora(e) || P.size >= 2) return;
    const x = e.clientX, y = e.clientY, t = e.timeStamp; est.tUltimo = t;
    if (e.target && e.target.closest && e.target.closest('#rayas')) {
      const i = rayaEn(x, y); if (i < 0) return;
      const baja = !(S.filas ? S.filas[i] : S.picas);
      P.set(e.pointerId, { lado: 'izq', modo: 'rayas', baja, vistas: new Set([i]) }); puente.fila(i, baja);
      Object.assign(est.izq, { activo: true, x, y, modo: 'rayas' }); return;
    }
    const der = x > innerWidth / 2;
    if (vertical() && y < innerHeight * 0.45) return;
    if (!der) { P.set(e.pointerId, { lado: 'izq', modo: 'libre' }); Object.assign(est.izq, { activo: true, x, y, modo: 'libre' }); return; }
    if ([...P.values()].some(p => p.lado === 'der')) return;
    P.set(e.pointerId, { lado: 'der', modo: 'espera', x0: x, y0: y, t0: t, giro: 0, ext: x });
    Object.assign(est.der, { activo: true, x, y, modo: 'espera' });
  }
  function mueve(e) {
    const p = P.get(e.pointerId); if (!p) return;
    const x = e.clientX, y = e.clientY, t = e.timeStamp; est.tUltimo = t;
    if (p.lado === 'izq') {
      Object.assign(est.izq, { x, y });
      if (p.modo === 'rayas') { const i = rayaEn(x, y); if (i >= 0 && !p.vistas.has(i)) { p.vistas.add(i); puente.fila(i, p.baja); } }
      return;
    }
    Object.assign(est.der, { x, y });
    const dx = x - p.x0, dy = y - p.y0;
    if (p.modo === 'espera') {
      if (-dy >= DESL_PX && -dy > Math.abs(dx) && t - p.t0 < DESL_MS) { p.modo = 'estocada'; puente.estocada(); }
      else if (Math.abs(dx) >= ARR_PX && Math.abs(dx) > Math.abs(dy)) { p.modo = 'arrastre'; p.giro = Math.sign(dx); p.ext = x; puente.gira(p.giro); }
    } else if (p.modo === 'arrastre') {
      /* sigue hacia el mismo lado; vuelve 18 px desde lo más lejos y cambia de lado */
      if (p.giro > 0) { if (x > p.ext) p.ext = x; else if (p.ext - x >= MUERTA_PX) { p.giro = -1; p.ext = x; puente.gira(-1); } }
      else { if (x < p.ext) p.ext = x; else if (x - p.ext >= MUERTA_PX) { p.giro = 1; p.ext = x; puente.gira(1); } }
    }
    est.der.modo = p.modo;
  }
  function arriba(e, cancela) {
    const p = P.get(e.pointerId); if (!p) return; P.delete(e.pointerId);
    if (p.lado === 'izq') { est.izq.activo = false; return; }
    est.der.activo = false;
    if (p.modo === 'arrastre') puente.gira(0);
    else if (!cancela && p.modo === 'espera' && Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < TOQUE_PX && e.timeStamp - p.t0 < TOQUE_MS) puente.toque({ x: e.clientX, y: e.clientY });
    est.der.modo = '';
  }
  addEventListener('pointerdown', abajo);
  addEventListener('pointermove', mueve);
  addEventListener('pointerup', e => arriba(e, false));
  addEventListener('pointercancel', e => arriba(e, true));
  return {
    paso: dt => puente.paso(dt),
    estado: () => ({ der: { ...est.der }, izq: { ...est.izq }, tUltimo: est.tUltimo }),
  };
}

/* El bot de los dedos: la lógica de acc.bot('bien') traducida a llamadas del puente. Solo lee S y el compás; manda por el puente */
export function botDedos(puente, S, acc) {
  return function juega() {
    if (S.fase === 'marcha' && !S.andando && S.T > 0.5) puente.toque();
    const F = S.filas || [];
    if (!S.choque && !S.salva && S.andando && S.picas) for (let i = 0; i < 5; i++) puente.fila(i, false);
    if (S.salva && !S.picas && S.T - S.tSalva > 1.6) for (let i = 0; i < 5; i++) if (!F[i]) puente.fila(i, true);
    if (!S.choque) return;
    const ag = S.orden === 'aguantar', fl = S.flanco && !S.flanco.hecho ? S.flanco : null;
    puente.gira(fl ? fl.lado : 0);
    if (S.colado || fl) { if (!ag) puente.estandarte('cerrar'); return; }
    if (ag) { if (S.coh >= 95 && !S.flanco) puente.estandarte('empujad'); return; }
    if (S.orden === 'empujar' && S.coh < 64) { puente.estandarte('aguantar'); return; }
    if (S.orden !== 'empujar' && S.coh >= 90) puente.estandarte('empujad');
    const f = acc.fasePulso(), n = Math.round((S.T - S.tChoque) / PULSO);
    if (S.pulsoUsado !== n && Math.min(f, PULSO - f) < 0.1) puente.toque();
  };
}
