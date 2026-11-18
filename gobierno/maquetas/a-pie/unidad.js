/* Pieza «unidad»: los números de un cuerpo de tropa en la escena a pie. Sin pantalla: corre igual en Node (pruebas).
   Hoy, un manípulo de hastati y los galos de enfrente; después, cualquier cuerpo que mande la batalla (mismos campos).
   Contrato: crearUnidad({ hombres, porBaja }) devuelve un objeto con
     enPie        cuántos quedan en pie
     animo        0 a 1: baja con las bajas, con el cansancio y si pierde; sube con una buena salva o si gana
     cansancio    0 a 1: el aliento de correr (5 s de carrera); sube al correr, baja al paso o quieto
     agotado      true al vaciarse el aliento; no vuelve a correr hasta recobrar la mitad
     fatiga       0 a 1: lo que cansa la lucha (TP1b); el relevo la baja, cargar la sube
     balance      cómo va la lucha: muertos que hace menos muertos que pone, con memoria de unos 8 s
     centurion    true mientras vive el centurión; sin él, la unidad tarda más en obedecer (retraso())
     rota         true cuando el ánimo llega a «rompe»: da la espalda y huye
   y las funciones baja(n), mata(n), anima(x), esfuerzo(dt, corriendo), lucha(dt, { muro, carga, contra }),
   relevo(), centurionCae(), retraso(). Las palabras (TP0 §6, iguales arriba y abajo) las da palabras(u). */
export const ROMPE = 0.2, DUDA = 0.45;
export function crearUnidad({ hombres, porBaja = 0.04 }) {
  const u = {
    hombres, enPie: hombres, animo: 0.8, cansancio: 0, agotado: false, fatiga: 0, balance: 0, centurion: true, rota: false, enLucha: false,
    get aliento() { return 1 - u.cansancio; },
    baja(n = 1) { u.enPie = Math.max(0, u.enPie - n); u.animo = Math.max(0, u.animo - porBaja * n); if (u.enLucha) u.balance -= n; },
    mata(n = 1) { if (!u.enLucha) return; u.balance += n; u.anima(0.01 * n); },
    anima(x) { u.animo = Math.min(1, Math.max(0, u.animo + x)); },
    /* correr gasta el aliento en 5 s y se recobra al 20 % por segundo; sin el margen del «agotado», con el botón pulsado
       corrían y se paraban a cada instante */
    esfuerzo(dt, corriendo) {
      if (corriendo) u.cansancio = Math.min(1, u.cansancio + dt / 5); else u.cansancio = Math.max(0, u.cansancio - dt * 0.2);
      if (u.aliento <= 0.02) u.agotado = true; else if (u.aliento >= 0.5) u.agotado = false;
    },
    /* un instante de lucha: cansa (más si carga; menos tras los escudos; más si «contra» se refugia tras los escudos, que
       hay que golpear la madera), el ánimo sigue a cómo va y el cansancio pasado de la mitad lo come. Si llega a «rompe», rota */
    lucha(dt, { muro = false, carga = false, contraMuro = false } = {}) {
      u.enLucha = true;
      u.fatiga = Math.min(1, u.fatiga + dt * (muro ? 0.006 : 0.018) + (carga ? dt * 0.04 : 0) + (contraMuro ? dt * 0.03 : 0));
      u.balance *= Math.exp(-dt / 8);
      const b = Math.max(-2, Math.min(2, u.balance));
      u.anima(dt * (0.008 * b - 0.03 * Math.max(0, u.fatiga - 0.45) - (u.centurion ? 0 : 0.004) - 0.002));
      if (u.animo <= ROMPE) u.rota = true;
      return u.rota;
    },
    /* la fila fresca entra delante: la fatiga de la primera fila se va; un poco de ánimo */
    relevo() { u.fatiga *= 0.35; u.anima(0.03); },
    centurionCae() { if (!u.centurion) return; u.centurion = false; u.anima(-0.08); },
    /* segundos que tarda en obedecer una orden */
    retraso() { return u.centurion ? 0 : 1.1; },
  };
  return u;
}
/* las palabras del estado (las mismas que el mapa de general): hombres en pie, ánimo, cansancio y combate */
export function palabras(u) {
  const c = Math.max(u.fatiga, u.cansancio * 0.8);
  return {
    enPie: u.enPie,
    animo: u.rota || u.animo <= ROMPE ? 'rompe' : u.animo < DUDA ? 'duda' : 'firme',
    cansancio: c < 0.35 ? 'fresca' : c < 0.7 ? 'cansada' : 'agotada',
    combate: !u.enLucha ? 'sin trabar' : u.balance > 0.5 ? 'ganando' : u.balance < -0.5 ? 'perdiendo' : 'igualado',
  };
}
/* el veredicto, en palabras de general: quién rompió y por cuánto (el ánimo que le quedaba al otro) */
export function veredicto(nuestra, suya) {
  if (!nuestra.rota && !suya.rota) return 'Sin decidir';
  const gana = suya.rota, resto = gana ? nuestra.animo : suya.animo;
  const grado = resto >= 0.5 ? 'clara' : resto >= 0.32 ? '' : 'por poco';
  return (gana ? 'Victoria' : 'Derrota') + (grado ? ' ' + grado : '');
}
