/* Pieza «unidad»: los números de un cuerpo de tropa en la escena a pie. Sin pantalla: corre igual en Node (pruebas).
   Hoy, un manípulo de hastati de ejemplo; después, cualquier cuerpo que mande la batalla (mismos campos).
   Contrato: crearUnidad({ hombres }) devuelve un objeto con
     enPie        cuántos quedan en pie
     animo        0 a 1: baja con las bajas, sube con una buena salva
     cansancio    0 a 1: sube al correr, baja al paso o quieto (con el aliento de 5 s de carrera de la maqueta)
     agotado      true al vaciarse el aliento; no vuelve a correr hasta recobrar la mitad
   y las funciones baja(n), anima(x), esfuerzo(dt, corriendo). */
export function crearUnidad({ hombres }) {
  const u = {
    hombres, enPie: hombres, animo: 0.8, cansancio: 0, agotado: false,
    get aliento() { return 1 - u.cansancio; },
    baja(n = 1) { u.enPie = Math.max(0, u.enPie - n); u.animo = Math.max(0, u.animo - 0.04 * n); },
    anima(x) { u.animo = Math.min(1, Math.max(0, u.animo + x)); },
    /* correr gasta el aliento en 5 s y se recobra al 20 % por segundo; sin el margen del «agotado», con el botón pulsado
       corrían y se paraban a cada instante */
    esfuerzo(dt, corriendo) {
      if (corriendo) u.cansancio = Math.min(1, u.cansancio + dt / 5); else u.cansancio = Math.max(0, u.cansancio - dt * 0.2);
      if (u.aliento <= 0.02) u.agotado = true; else if (u.aliento >= 0.5) u.agotado = false;
    },
  };
  return u;
}
