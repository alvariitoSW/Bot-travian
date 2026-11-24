/* AQVILA — novedades de cada versión, para el menú principal («Versión v… · Novedades»).
   La primera entrada es la versión que se publica: su número es el de la caché de sw.js
   (lo vigila test/novedades.test.mjs). Frases cortas y en llano, de 3 a 6 por versión. */
(function (root) {
  'use strict';
  const NOVEDADES = [
    { v: 167, fecha: '24/11/2026', cosas: [
      'Falange a pie nueva: baja las sarisas a tiempo, cierra los huecos y aguanta el empuje.',
      'Othismos: cuando las dos falanges chocan, empuja a compás y mira la barra para no ceder.',
      'Las sarisas se parten en el choque y los falangitas siguen con el muñón.',
      'Muro de escudos y orden abierto en el abanico del estandarte: muro contra lo que viene de frente, abierto para pasar.',
      'Tácticas de la época en la batalla dirigida: los triarios se alzan, la falange cae por el flanco, el que queda rodeado sufre y la furia gala se agota.'] },
    { v: 165, fecha: '24/11/2026', cosas: [
      'Se gana con tres de cuatro caminos: armas, comercio, política y ciudad. Míralos en Imperio, «Tus caminos».',
      'Tomar Cartago ya no acaba la partida y no hay límite de años.',
      '«Este año» en Imperio: a dónde va tu dinero y el tributo de guerra de cada primavera.',
      'Gobernador: enciéndelo en la ficha de una ciudad y él la cuida cada estación.',
      'Clases sociales con personajes en 3D, calles que trazas con el dedo, termas y acueducto nuevos y menús de papiro y bronce.',
      'Batalla rápida: al entrar en combate eliges jugarla, mirarla por rondas o resolverla.'] },
    { v: 162, fecha: '24/11/2026', cosas: [
      'La ciudad ocupa casi toda la pantalla: una tira fina arriba (toca para ver todo) y las pestañas abajo.',
      '«Construir» es un botón redondo; los ministros están dentro del Senado.',
      'Economía nueva: tus ciudades producen aceite, vino, verdura y lana, además del grano.',
      'Agricultura en «Construir»: eliges el campo y el juego te avisa si el suelo no vale; la ciencia abre olivar y viña.',
      'Mercado nuevo: precios que suben y bajan, rutas, viajes, aduanas y contratos del Senado.',
      'En las batallas: fragor de golpes, caídas y pila que se clavan.'] },
    { v: 160, fecha: '24/11/2026', cosas: [
      'Banda sonora de época en menú, ciudad, mapa y batalla.',
      'Gritos reales en la batalla y arenga del general antes de empezar.',
      'Los oficiales de Cartago, galos e iberos hablan con su voz.'] },
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
  const AVANCE = {"hecho":67,"total":18,"hechas":7,"medias":10,"faltan":1,"pendientes":[{"t":"Rutas y acuerdos comerciales","e":"a medias"},{"t":"Camino del comercio","e":"a medias"},{"t":"Camino de la política: Príncipe del Senado","e":"a medias"},{"t":"Camino de las armas","e":"a medias"},{"t":"Una sola batalla, con un solo aspecto","e":"a medias"},{"t":"El testudo a pie, dentro del juego","e":"a medias"},{"t":"Escaramuzas: batallas sueltas desde el menú","e":"a medias"},{"t":"Fluido y sin conexión en tu móvil, y publicada","e":"por hacer"},{"t":"Formaciones en Escaramuzas","e":"a medias"},{"t":"Menús reordenados y con un solo aspecto antiguo","e":"a medias"},{"t":"Soldados nuevos, con licencia clara","e":"a medias"}]};
  /* FIN AVANCE */
  NOVEDADES.avance = AVANCE;
  root.NOVEDADES = NOVEDADES;
  if (typeof module !== 'undefined' && module.exports) module.exports = NOVEDADES;
})(typeof window !== 'undefined' ? window : globalThis);
