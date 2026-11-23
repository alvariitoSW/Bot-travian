/* Pieza «acciones» (FA4): adaptador fino sobre las reglas de js/falange.js. Aquí ya no hay reglas: las pone el motor.
   Contrato: crearAcciones(m) con m = { H, avisa, zanF, hombres } devuelve el objeto de crearFalange (F) más:
     { F, S, paso(dt) } — paso avanza el motor y luego viste a cada hombre con lo que es solo de dibujo.
   Rival por ?rival= (manípulos por defecto; los demás con rivalDe de js/falange-rivales.js), semilla por ?semilla=
   (por defecto, la de hoy: misma fecha, misma partida).
   Lo de dibujo de cada hombre: va (vaivén del asta), kA (inclinación de su asta alzada, rad; va suave hacia el abanico), kG (gesto de la estocada, de h.tG),
   fase (desfase del paso), paso (la pierna, si el motor aún no lo movió), esc (talla). Corre en Node. */
import { crearFalange, PULSO, VENTANA, META, AVISO_FLANCO, BAJAN } from '../../../js/falange.js';
import { rivalDe } from '../../../js/falange-rivales.js';
import { crearPaso, velocidad, pisa } from './locomocion.js';
import { vaiven, primeraAlzada, abanicoObj } from './formacion.js';
export { PULSO, VENTANA, META, AVISO_FLANCO };
export const NPILA = 48;   /* proyectiles que se pintan a la vez (los demás esperan) */
const hacia = (v, o, d) => v < o ? Math.min(o, v + d) : Math.max(o, v - d);
const TALLA = { jinete: 1.25, elefante: 2.4 };   /* de reserva, hasta que cada rival traiga su dibujo (FA7) */

/* la semilla de hoy: AAAAMMDD */
const hoy = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };

export function crearAcciones(m = {}) {
  const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const nombre = Q.get('rival') || 'manipulos', semilla = +Q.get('semilla') || hoy();
  const zan = m.zanF || { walk: 1.5, run: 2.2 };
  const F = crearFalange({ semilla, rival: rivalDe(nombre) || undefined, avisa: m.avisa, H: m.H, hombres: m.hombres, locomocion: { crearPaso, velocidad, pisa }, zancadas: zan });
  const S = F.S;
  /* azar propio del dibujo (no toca las tiradas del motor) */
  let sV = 7; const azarV = () => { sV = (sV * 16807) % 2147483647; return (sV - 1) / 2147483646; };
  function viste1(h, dt, alzar) {
    if (!h.va) { const a = h.az ?? azarV(), b = azarV(); h.va = vaiven(a, b); h.fase ??= b * 3; h.kA = alzar === undefined ? 0 : abanicoObj(h.r, alzar); h.kG = 0; h.A = h.B = h.mx = 0; h.pitch = 0; }
    if (!h.paso) h.paso = crearPaso({ zW: zan.walk, zR: zan.run, fase: azarV(), prisa: 0.85 + azarV() * 0.3 });
    if (alzar === undefined) return;
    if (h.vivo && !h.huye) h.kA = hacia(h.kA, abanicoObj(h.r, alzar), dt * 0.5);   /* 0,5 rad/s: el abanico se abre o cierra en un segundo */
    h.kG = Math.max(0, 1 - Math.abs(S.T - (h.tG ?? -9) - 0.18) / 0.22) * (h.r === 0 ? 1 : 0);
  }
  function viste(dt = 0) {
    const alzar = primeraAlzada(S.filas);
    for (const h of S.fal) viste1(h, dt, alzar);
    for (const h of S.ene) { viste1(h); h.tAtk ??= -9; h.tRecibe ??= -9; h.esc ??= TALLA[h.tipo] || 0.96 + azarV() * 0.08; }
  }
  const reinicia = () => { sV = 7; F.reinicia(); viste(); };
  const paso = dt => { F.paso(dt); viste(dt); };
  viste();
  return { ...F, F, S, reinicia, paso, BAJAN };
}
