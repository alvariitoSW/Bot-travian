/* FI2: la conexión de la física (js/fisica-batalla.js) con el testudo a pie. ?fisica=0 la apaga (el «antes»).
   Diseño: gobierno/estudios/FI2-diseno-fisica-testudo.md. La física solo mueve lo que se dibuja: escribe en cada hombre
   h.fx, h.fz (y h.fCae al caer). Las reglas de la maqueta no lo leen: la partida sale igual con y sin física.

   Al motor no se le pasan los hombres, sino un «cuerpo» por hombre: su sitio es donde lo ponen las reglas para dibujarlo
   (h.xd, h.zd en el choque; h.x, h.z antes). Romanos: el bloque propio (columna f; fila r, o su puesto j en la lucha).
   Galos: los rivales (los de reserva cuentan mientras se dibujan).

   La llegada: las reglas paran a los galos en seco al chocar. El cuerpo no se para así: lo que pierde de golpe de su
   velocidad (más de lo que frena un hombre, FRENA) sigue como impulso. En esta maqueta los galos se paran a distancia de
   espada (no llegan a tocar los cuerpos): el golpe llega por los escudos. Por eso una parte (AL_MURO) pasa al romano de la
   1.ª fila con quien se bate (o el más cercano, a menos de ALCANCE): cede, y la compresión fila a fila lo pasa a los de detrás. Los romanos
   lo reciben a pie firme (Polibio 2.33): a ellos no se les da impulso propio. Medidas: licencia de juego. */
import { crearFisica, MIN_DIST } from '../../../js/fisica-batalla.js';

export const ESCALA = 2.15 / 1.9;    /* las figuras del testudo miden 2,15 «m»; las de la falange, 1,9 */
export const FRENA = 12;             /* m/s²: lo más que frena un hombre por sí solo */
export const LLEGADA = 0.8;          /* qué parte de lo que no puede frenar sigue como impulso */
export const AL_MURO = 0.5, ALCANCE = 3, V_MURO = 2;   /* parte que pasa al escudo de enfrente; hasta dónde; tope (m/s) */
export const VARA_DIST = MIN_DIST;   /* 0,45 m (escalada daría 0,51) */

export function crearFisicaEscena({ H }) {
  const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  /* los dos de un duelo no se separan más que su distancia de las reglas: la hoja para justo en el escudo (TP8) */
  const enDuelo = (a, b) => { const d = a.h.duelo; return !!(d && d.activo && d.g === a.h && d.r === b.h); }, pareja = (a, b) => enDuelo(a, b) || enDuelo(b, a);
  const parMin = (a, b) => pareja(a, b) ? Math.hypot(a.x - b.x, a.z - b.z) : undefined;
  const activa = Q.get('fisica') !== '0', Fi = crearFisica({ H, escala: ESCALA, parMin });
  const C = new WeakMap(), SF = { fal: [], ene: [], giro: 0 };
  const cuerpo = h => { let w = C.get(h); if (!w) C.set(h, w = { h, x: 0, z: 0, fx: 0, fz: 0, vx: 0, vz: 0, f: 0, r: 0, vivo: true, ux0: 0, uz0: 0, px: null, pz: 0 }); return w; };
  const ahora = () => (typeof performance !== 'undefined' ? performance : Date).now();
  let msPaso = 0, nPaso = 0, med = null;

  /* los cuerpos de este fotograma, en el sitio donde las reglas dibujan a cada hombre */
  function lee(S) {
    SF.fal.length = 0; SF.ene.length = 0;
    for (const h of S.romanos) {
      const w = cuerpo(h); w.x = S.choque && h.xd !== undefined ? h.xd : h.x; w.z = S.choque && h.zd !== undefined ? h.zd : h.z;
      w.f = h.f; w.r = S.choque && h.j !== undefined ? h.j : h.r; w.vivo = h.vivo; w.huye = !!h.huye; SF.fal.push(w);
    }
    for (const g of S.galos) {
      if (g.reserva && S.huida) continue;   /* la reserva oculta no cuenta */
      const w = cuerpo(g); w.x = S.choque && g.xd !== undefined ? g.xd : g.x; w.z = S.choque && g.zd !== undefined ? g.zd : g.z;
      w.vivo = g.vivo || !!g.reserva; SF.ene.push(w);
    }
  }
  /* la llegada: lo que el galo no puede frenar en este paso sigue como impulso del cuerpo */
  function llegada(dt) {
    for (const w of SF.ene) {
      if (w.px === null || dt <= 0) { w.px = w.x; w.pz = w.z; continue; }
      const ux = (w.x - w.px) / dt, uz = (w.z - w.pz) / dt; w.px = w.x; w.pz = w.z;
      if (Math.hypot(ux, uz) > 8) { w.ux0 = w.uz0 = 0; continue; }   /* un salto (reinicio), no una carrera */
      if (w.vivo) {
        const dx = w.ux0 - ux, dz = w.uz0 - uz, d = Math.hypot(dx, dz), sobra = (d - FRENA * dt) * LLEGADA;
        if (sobra > 0) {
          let m = w.h.duelo && w.h.duelo.r ? C.get(w.h.duelo.r) || null : null, dm = ALCANCE; if (!m || !m.vivo) for (const r of SF.fal) if (r.vivo && r.r === 0) { const e = Math.hypot(r.x - w.x, r.z - w.z); if (e < dm) { dm = e; m = r; } }
          const k = m ? AL_MURO : 0; w.vx += dx / d * sobra * (1 - k); w.vz += dz / d * sobra * (1 - k);
          if (m) { m.vx += dx / d * sobra * k; m.vz += dz / d * sobra * k; const v = Math.hypot(m.vx, m.vz); if (v > V_MURO) { m.vx *= V_MURO / v; m.vz *= V_MURO / v; } }
        }
      }
      w.ux0 = ux; w.uz0 = uz;
    }
  }
  /* tras el paso de las reglas: mueve los cuerpos y pasa a cada hombre su desplazamiento de dibujo */
  function paso(S, dt, sitio) {
    if (sitio) for (const h of S.romanos) sitio(h);   /* el sitio de este paso (la escena lo pone luego igual) */
    const a = ahora(); lee(S);
    if (activa) {
      llegada(dt); Fi.paso(SF, dt);
      /* el galo que se bate va con su romano: la pareja guarda su distancia de las reglas (la hoja para en el escudo, TP8) */
      const fijos = new Set(), par = new Map();
      for (const w of SF.ene) { const d = w.h.duelo; if (w.vivo && d && d.activo && d.g === w.h) { const r = C.get(d.r); if (r && r.vivo) { w.fx = r.fx; w.fz = r.fz; w.vx = r.vx; w.vz = r.vz; fijos.add(w); fijos.add(r); par.set(w, r); par.set(r, w); } } }
      /* y quien quede pegado a uno de la pareja se aparta él entero (los de la pareja no se mueven).
         Si el pegado es de OTRA pareja, se aparta esa pareja entera (los dos juntos): así su distancia de las reglas no cambia */
      const R2 = 2 * 0.25 * ESCALA;
      for (const a of fijos) for (const b of SF.fal.concat(SF.ene)) {
        if (b === a || b === par.get(a) || !b.vivo) continue; let dx = b.x + b.fx - a.x - a.fx, dz = b.z + b.fz - a.z - a.fz; if (Math.abs(dx) > R2 || Math.abs(dz) > R2) continue;
        const d = Math.hypot(dx, dz); if (d >= R2) continue; if (d < 1e-6) { dx = 1; dz = 0; } else { dx /= d; dz /= d; }
        const e = R2 - d; b.fx += dx * e; b.fz += dz * e; const o = par.get(b); if (o) { o.fx += dx * e; o.fz += dz * e; }
      }
      /* al final, cada galo en duelo vuelve a llevar justo el desplazamiento de su romano (un romano puede tener dos galos) */
      for (const w of SF.ene) if (fijos.has(w)) { const r = C.get(w.h.duelo.r); w.fx = r.fx; w.fz = r.fz; }
      for (const w of SF.fal.concat(SF.ene)) { w.h.fx = w.fx; w.h.fz = w.fz; if (w.fCae !== undefined) w.h.fCae = w.fCae; }
      msPaso += ahora() - a; nPaso++;
    }
    if (med) mide(S);
  }

  /* medidas desde que empieza la carga hasta el final de la lucha (con y sin física, las mismas) */
  function empieza() { med = { parMin: Infinity, parDif: 0, dMin: Infinity, tDMin: null, r1: 0, r2: 0, tPico: null, tChoque: null, muestras: 0 }; msPaso = nPaso = 0; }
  function mide(S) {
    if (S.fase !== 'carga') return;
    if (S.choque && med.tChoque === null) med.tChoque = S.T;
    med.muestras++;
    /* entre vivos dibujados: las parejas en duelo aparte (su vara es la de TP8, 0,4, y su distancia la de las reglas ±2 cm) */
    const V = SF.fal.concat(SF.ene).filter(w => w.vivo && !(w.h.reserva && !w.h.vivo)), P = V.map(w => [w.x + (w.h.fx || 0), w.z + (w.h.fz || 0)]);
    for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
      const dx = P[j][0] - P[i][0], dz = P[j][1] - P[i][1]; if (Math.abs(dx) > 2.5 || Math.abs(dz) > 2.5) continue; const d = Math.hypot(dx, dz);
      if (pareja(V[i], V[j])) { med.parMin = Math.min(med.parMin, d); med.parDif = Math.max(med.parDif, Math.abs(d - Math.hypot(V[j].x - V[i].x, V[j].z - V[i].z))); }
      else if (d < med.dMin) { med.dMin = d; med.tDMin = S.T; }
    }
    /* cuánto recula cada fila en los 3 s que siguen al choque: la media de sus vivos (el frente mira a -z) */
    if (med.tChoque !== null && S.T - med.tChoque <= 3) {
      const fila = k => { let s = 0, n = 0; for (const w of SF.fal) if (w.vivo && w.r === k) { s += w.h.fz || 0; n++; } return n ? s / n : 0; };
      const a = fila(0), b = fila(1); if (a > med.r1) { med.r1 = a; med.tPico = S.T - med.tChoque; } if (b > med.r2) med.r2 = b;
    }
  }
  function medida() {
    const m = med || { dMin: Infinity, r1: 0, r2: 0, muestras: 0 };
    return { activa, parMin: +(+(m.parMin ?? Infinity)).toFixed(3), parDif: +(m.parDif || 0).toFixed(3), distMin: +(+m.dMin).toFixed(3), tDMin: m.tDMin, recula1: +m.r1.toFixed(3), recula2: +m.r2.toFixed(3), tPico: m.tPico === null || m.tPico === undefined ? null : +m.tPico.toFixed(2), muestras: m.muestras, ms: nPaso ? +(msPaso / nPaso).toFixed(3) : 0 };
  }
  return { activa, paso, empieza, medida };
}
