/* Pieza «acciones» (FA4): adaptador fino sobre las reglas de js/falange.js. Aquí ya no hay reglas: las pone el motor.
   Contrato: crearAcciones(m) con m = { H, avisa, zanF, hombres } devuelve el objeto de crearFalange (F) más:
     { F, S, paso(dt) } — paso avanza el motor y luego viste a cada hombre con lo que es solo de dibujo.
   Rival por ?rival= (manípulos por defecto; los demás con rivalDe de js/falange-rivales.js), semilla por ?semilla=
   (por defecto, la de hoy: misma fecha, misma partida).
   Lo de dibujo de cada hombre: va (vaivén del asta), kA (inclinación de su asta alzada, rad; va suave hacia el abanico), kG (gesto de la estocada, de h.tG),
   fase (desfase del paso), paso (la pierna, si el motor aún no lo movió), esc (talla). Corre en Node. */
import { crearFalange, PULSO, VENTANA, META, AVISO_FLANCO, BAJAN, FIN_LUCHA } from '../../../js/falange.js';
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
  const nombre = m.rival || Q.get('rival') || 'manipulos', semilla = m.semilla ?? (+Q.get('semilla') || hoy());
  const zan = m.zanF || { walk: 1.5, run: 2.2 };
  /* LP6: contra los manípulos se lucha hasta el 15 % (FIN_LUCHA, la lucha sola del motor). Los elefantes ya lo traen de FE1; caballería,
     falange e hoplitas siguen con su regla (?fin=0 vuelve a lo de antes también con los manípulos) */
  const fin = m.fin !== undefined ? m.fin : nombre === 'manipulos' && Q.get('fin') !== '0' ? FIN_LUCHA : null;
  const F = crearFalange({ semilla, rival: rivalDe(nombre) || undefined, avisa: m.avisa, H: m.H, hombres: m.hombres, locomocion: { crearPaso, velocidad, pisa }, zancadas: zan, fin, vivo: !!m.vivo });   /* FU4: el rival vivo (lo pide combate() del bloque) */
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

/* ---------- LP7b: «Bajar a pie» con una falange desde la batalla grande (la escena los usa; corren en Node) ---------- */
/* el manípulo rival sale a 52 m (MANIPULOS.crea); desde la batalla grande, a la distancia que había allí (de 22 a 52 m: la salva
   de pila se tira a 19). Va justo después de reiniciar */
export function acercaRival(S, lejos) {
  const d = 52 - Math.max(22, Math.min(52, +lejos || 52)); if (!d || !S.riv) return 0;
  const Fx = Math.sin(S.giro), Fz = -Math.cos(S.giro); S.riv.x -= Fx * d; S.riv.z -= Fz * d; for (const h of S.ene) { h.x -= Fx * d; h.z -= Fz * d; }
  return d;
}
/* lo que vuelve a la batalla grande, con el contrato de la maqueta del bloque (resultadoLP7 de bloque/escena.js): bloques tuyo y
   centro con { hombres, enPie, roto }; pose de tu muro en el marco del inicio P0 = { x, z, giro }: x a su derecha, z hacia atrás
   (avanzar da z negativa), ang lo girado a la derecha. ganador: 'tuyo' | 'enemigo' | null */
export function resultadoLP7(S, P0 = { x: 0, z: -10, giro: 0 }) {
  if (!S || !S.U || !S.R) return null; const c = Math.cos(P0.giro), s = Math.sin(P0.giro), dx = S.xF - P0.x, dz = S.zF - P0.z;
  const b = u => ({ hombres: u.hombres, enPie: u.enPie, roto: !!u.roto });
  return { ganador: S.ganador === 'falange' ? 'tuyo' : S.ganador === 'rival' ? 'enemigo' : null, causa: S.causa, T: +S.T.toFixed(1), bloques: { tuyo: b(S.U), centro: b(S.R) },
    pose: { x: +(dx * c + dz * s).toFixed(2), z: +(-dx * s + dz * c).toFixed(2), ang: +(S.giro - P0.giro).toFixed(3) } };
}
