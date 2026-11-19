/* Pieza «unidad»: los números de un cuerpo de tropa en la escena a pie. Sin pantalla: corre igual en Node (pruebas).
   TP7a: la sintagma de la falange y el manípulo romano que tiene enfrente usan esta misma pieza.
   Contrato: crearUnidad({ hombres, nombre }) devuelve un objeto con
     enPie        cuántos quedan en pie
     animo        0 a 1: baja con las bajas y con el castigo; con 0,12 o menos, la unidad rompe
     cansancio    0 a 1: sube al empujar o pelear, baja quietos
     roto         true cuando rompe (da la espalda y huye); ya no vuelve
     hizo, sufrio bajas causadas y sufridas hace poco (se olvidan a la mitad cada 6 s): dicen cómo va el combate
   y las funciones baja(n), causa(n), anima(x), cansa(dt, x), tic(dt), palabras().
   Las palabras son las de TP0 §6, iguales arriba (general) y abajo (a pie):
     hombres en pie · ánimo firme / duda / rompe · cansancio fresca / cansada / agotada · combate ganando / igualado / perdiendo */
export const ROMPE = 0.12;
export function crearUnidad({ hombres, nombre = '', ref = hombres }) {
  /* cada baja pesa según el tamaño: perder la mitad de los hombres, por sí solo, deja el ánimo en duda.
     TP8b-E1: ref, el tamaño con el que se ajustó el ánimo (si la tropa crece, cada baja pesa igual que antes) */
  const peso = 0.75 / ref;
  const u = {
    nombre, hombres, enPie: hombres, animo: 0.8, cansancio: 0, roto: false, tRoto: -1, hizo: 0, sufrio: 0, T: 0,
    get aliento() { return 1 - u.cansancio; },
    baja(n = 1) { u.enPie = Math.max(0, u.enPie - n); u.sufrio += n; u.anima(-peso * n); },
    causa(n = 1) { u.hizo += n; u.anima(0.012 * n); },
    anima(x) { if (u.roto) return; u.animo = Math.min(1, Math.max(0, u.animo + x)); u.mira(); },
    cansa(dt, x) { u.cansancio = Math.min(1, Math.max(0, u.cansancio + dt * x)); },
    /* rompe por ánimo o si quedan menos de un tercio */
    mira() { if (!u.roto && (u.animo <= ROMPE || u.enPie < u.hombres / 3)) { u.roto = true; u.tRoto = u.T; u.animo = 0; } },
    tic(dt) {
      u.T += dt; const k = Math.pow(0.5, dt / 6); u.hizo *= k; u.sufrio *= k;
      /* agotados y perdiendo, el ánimo se va solo */
      if (u.cansancio > 0.7) u.anima(-0.004 * dt);
      if (u.combate() === 'perdiendo') u.anima(-0.006 * dt);
    },
    combate() { return u.hizo > u.sufrio * 1.3 + 0.3 ? 'ganando' : u.sufrio > u.hizo * 1.3 + 0.3 ? 'perdiendo' : 'igualado'; },
    palabras() {
      return {
        enPie: u.enPie,
        animo: u.roto ? 'rompe' : u.animo > 0.45 ? 'firme' : 'duda',
        cansancio: u.cansancio < 0.35 ? 'fresca' : u.cansancio < 0.7 ? 'cansada' : 'agotada',
        combate: u.combate(),
      };
    },
  };
  return u;
}
