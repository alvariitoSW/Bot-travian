/* AQVILA — novedades de cada versión, para el menú principal («Versión v… · Novedades»).
   La primera entrada es la versión que se publica: su número es el de la caché de sw.js
   (lo vigila test/novedades.test.mjs). Frases cortas y en llano, de 3 a 6 por versión. */
(function (root) {
  'use strict';
  const NOVEDADES = [
    { v: 161, fecha: '24/11/2026', cosas: [
      'Economía nueva: tus ciudades producen aceite, vino, verdura y lana, además del grano.',
      'Agricultura en «Construir»: eliges el campo (trigo, olivar, viña, huerto o pasto) y el juego te avisa si el suelo no vale.',
      'La ciencia abre cultivos: «Viña y olivar» trae olivares y viñas; la noria y la bodega llegan después.',
      'Mercado nuevo: precios que suben y bajan por ciudad y estación, rutas, viajes, aduanas y contratos del Senado.',
      'Arriba ves denarios, grano, aceite, vino y materiales. Toca la tira para ver todo.'] },
    { v: 160, fecha: '24/11/2026', cosas: [
      'La ciudad ocupa casi toda la pantalla: una tira fina arriba y las pestañas abajo.',
      'Toca la tira para ver todos los recursos, cambiar de ciudad o abrir el menú.',
      '«Construir» es ahora un botón redondo sobre la ciudad.',
      'Los ministros están dentro del Senado, porque son jefes de bando.',
      'El ojo, la vista desde arriba y las capas van en un solo botón.'] },
    { v: 159, fecha: '24/11/2026', cosas: [
      'Arreglo: sin conexión la ciudad y la falange vuelven a cargar.'] },
    { v: 157, fecha: '24/11/2026', cosas: [
      'Ciudad viva por barrios: cada barrio tiene sus necesidades (agua, comida, limpieza…).',
      'Si descuidas un barrio, se queja, se tapia y puede haber revuelta.',
      'Toca un barrio para ver su ficha y lo que le falta.'] },
    { v: 154, fecha: '23/11/2026', cosas: [
      'La ciudad se ve desde arriba, como un plano.',
      'Botones de Construir, Ministros y plan del Senado.'] }
  ];
  /* AVANCE: lo escribe gobierno/avance.mjs desde gobierno/lista.json; no tocar a mano */
  const AVANCE = {"hecho":39,"total":19,"hechas":2,"medias":11,"faltan":6,"pendientes":[{"t":"Una ciudad que construyes y ves crecer","e":"a medias"},{"t":"Recursos, mercado y cuentas claras","e":"a medias"},{"t":"Clases sociales: descuidarlas se nota","e":"a medias"},{"t":"Rutas y acuerdos comerciales","e":"a medias"},{"t":"Camino del comercio","e":"por hacer"},{"t":"Camino de la política: Príncipe del Senado","e":"por hacer"},{"t":"Campaña en el mapa contra un enemigo que responde","e":"a medias"},{"t":"Camino de las armas","e":"a medias"},{"t":"Una sola batalla, con un solo aspecto","e":"a medias"},{"t":"El testudo a pie, dentro del juego","e":"a medias"},{"t":"Escaramuzas: batallas sueltas desde el menú","e":"por hacer"},{"t":"Fluido y sin conexión en tu móvil, y publicada","e":"por hacer"},{"t":"Camino de la ciencia","e":"por hacer"},{"t":"Formaciones en Escaramuzas","e":"por hacer"},{"t":"Menús reordenados y con un solo aspecto antiguo","e":"a medias"},{"t":"Las batallas se sienten: física de cuerpos y proyectiles","e":"a medias"},{"t":"Soldados nuevos, con licencia clara","e":"a medias"}]};
  /* FIN AVANCE */
  NOVEDADES.avance = AVANCE;
  root.NOVEDADES = NOVEDADES;
  if (typeof module !== 'undefined' && module.exports) module.exports = NOVEDADES;
})(typeof window !== 'undefined' ? window : globalThis);
