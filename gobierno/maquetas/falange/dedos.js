/* Pieza «dedos» (FA3, falange): los gestos de los pulgares y el puente que los traduce a las órdenes de hoy.
   Diseño: gobierno/estudios/FA3-diseno-dedos.md.
   - crearPuente({ S, acc, avisa }): EL ÚNICO SITIO que convierte gestos en órdenes del motor (js/falange.js, por acciones.js). Corre en Node: no toca el DOM.
   - crearDedos({ puente, S, zona }): reconoce los gestos con Pointer Events sobre window (dos dedos a la vez).
   - botDedos(puente, S): un jugador que juega bien SOLO por el puente (para las pruebas).
   Gestos, compás a toques y abanico de órdenes: licencia de juego. */
import { PULSO, VENTANA } from './acciones.js';

/* FA4: el puente va derecho al motor (js/falange.js). acc es el objeto de crearAcciones (el de crearFalange).
   Tocar → toque() · deslizar → estocada() · arrastrar → gira(±1), soltar → gira(0) · raya → fila(i, abajo) · estandarte → orden(n) */
export function crearPuente({ S, acc, avisa = () => {} }) {
  let estocadas = 0, tPrev = -1;
  const vivo = () => S.fase !== 'fin' && !S.ganador;
  /* si la partida vuelve a empezar, se cuentan de nuevo las estocadas */
  const asegura = () => { if (S.T < tPrev - 1e-6) estocadas = 0; tPrev = S.T; };
  /* devuelve 'bueno' | 'destiempo' | 'nada' | 'gira' (o null al acabar) */
  function toque() { asegura(); return acc.toque(); }
  function estocada() { asegura(); const r = acc.estocada(); if (r && r !== 'espera') estocadas++; return r; }
  function gira(l) { asegura(); acc.gira(Math.sign(l || 0)); }
  function fila(i, baja) { asegura(); if (i < 0 || i > 4) return; acc.fila(i, baja); }
  /* el estandarte: aguantar · empujad · cerrar · retroceder (la misma orden otra vez la suelta) */
  function orden(n) { asegura(); return vivo() ? acc.orden(n) : null; }
  /* el motor gira solo con S.girando: aquí no hay nada que hacer cada fotograma */
  function paso() { asegura(); }
  /* lo que leen el HUD y las pruebas. giro en grados; pulso 0 en el latido */
  function lee() {
    asegura(); const p = S.pulso || 0;
    return { giro: +((S.giro || 0) * 180 / Math.PI).toFixed(2), filas: S.filas.slice(), pulso: p, enCompas: Math.min(p, 1 - p) * PULSO <= VENTANA, orden: S.orden || null, estocadas, girando: S.girando || 0 };
  }
  return { toque, estocada, gira, fila, orden, estandarte: orden, paso, lee };
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

/* El bot de los dedos: la lógica de F.bot('compas') del motor, pero mandando SOLO por el puente. Gira hacia el flanco al
   aviso y vuelve al frente cuando se resuelve */
const GIRO_BOT = 57 * Math.PI / 180;
export function botDedos(puente, S) {
  let kBot = -99;
  return function juega() {
    if (S.ganador || S.fase === 'fin') return;
    const T = S.T, M = S.motor;
    let cerca = 1e9; for (const h of S.ene) if (h.vivo && h.est !== 'huye') { const l = M.local(h.x, h.z); if (Math.abs(l.lado) < 12 && l.delante > -1) cerca = Math.min(cerca, l.delante); }
    const vuela = S.proyectiles.some(p => p.est === 1), bajar = S.choque || (cerca < 11 && !vuela);
    for (let i = 0; i < 5; i++) if (S.filas[i] !== bajar) puente.fila(i, bajar);
    const Fl = S.flanco, obj = Fl && Fl.estado === 'viene' ? Fl.lado * GIRO_BOT : 0, dif = obj - S.giro;
    puente.gira(Math.abs(dif) < 0.006 ? 0 : Math.sign(dif));
    const colado = S.ene.some(h => h.vivo && h.est === 'dentro' && h.por === 'frente');
    if (colado) { if (S.orden !== 'cerrar') puente.orden('cerrar'); }
    else if (S.orden === 'cerrar') puente.orden('cerrar');
    else if (S.orden === 'aguantar') { if (S.coh >= 90) puente.orden('aguantar'); }
    else if (S.choque && S.coh < 50) puente.orden('aguantar');
    else if (S.choque && S.orden !== 'empujar' && S.coh >= 90) puente.orden('empujad');
    if (S.yo.blanco && S.yo.blanco.est === 'dentro') puente.estocada();
    const fase = ((T % PULSO) + PULSO) % PULSO, d = Math.min(fase, PULSO - fase), k = Math.round(T / PULSO);
    if (d < 0.05 && k !== kBot) { kBot = k; puente.toque(); if (S.yo.blanco) puente.estocada(); }
  };
}
