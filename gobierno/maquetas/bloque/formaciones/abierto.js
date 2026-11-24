/* FU5 · El orden abierto (plan: gobierno/estudios/FU0-plan-motor-batalla.md §FU5). Lo que se ve son los HUECOS: las reglas
   (js/bloque-ia.js, S.tuyo.forma === 'abierto') escalan B.dx y B.dz (×1,6 y ×1,8) y los hombres de TP1 andan solos a sus puestos
   nuevos, así que no hay malla extra (cero llamadas de dibujo). Lo único propio es el sonido: al abrirse, unos pasos sueltos de
   gente que se separa (Son.tierra). Historia: los vélites y las líneas sueltas del manípulo pelean separados (Polibio 6.21–23;
   Livio 8.8); cifras y sonido, licencia de juego.
   Contrato: crearAbierto() → { monta(ctx), paso(dt), alAviso(tipo, d) } con ctx = { THREE, escena, H, C, S, TR, Son }. */
export const PASOS_ABRIR = 5;   /* pasos sueltos al abrirse */

export function crearAbierto() {
  let ctx = null, pendientes = 0, espera = 0;
  return {
    monta(c) { ctx = c; pendientes = 0; espera = 0; },
    alAviso(tipo, d) { if (tipo === 'forma' && d && d.f === 'abierto') { pendientes = PASOS_ABRIR; espera = 0; } },
    paso(dt) {
      if (!ctx || pendientes <= 0) return; espera -= dt; if (espera > 0) return;
      espera = 0.12 + 0.1 * ((pendientes * 0.618) % 1); pendientes--;
      try { ctx.Son && ctx.Son.tierra && ctx.Son.tierra(((pendientes * 7) % 5 - 2) / 3, 0); } catch (e) { /* sin sonido */ }
    },
    pasosPendientes: () => pendientes
  };
}
