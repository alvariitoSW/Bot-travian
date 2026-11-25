/* AQVILA — novedades de cada versión, para el menú principal («Versión v… · Novedades»).
   La primera entrada es la versión que se publica: su número es el de la caché de sw.js
   (lo vigila test/novedades.test.mjs). Frases cortas y en llano, de 3 a 6 por versión. */
(function (root) {
  'use strict';
  const NOVEDADES = [
    { v: 173, fecha: '25/11/2026', cosas: [
      'En Partida nueva eliges entre 8 polis griegas: Atenas, Esparta, Corinto, Argos, Tebas, Mégara, Mileto y Calcis.',
      'Cada una tiene su rasgo, su edificio propio, su tropa y su lujo; la ciudad y el bando llevan su nombre.',
      'De momento tu polis se juega sobre el mapa de Italia; su comarca en Grecia llega en la próxima versión.'] },
    { v: 172, fecha: '25/11/2026', cosas: [
      'El tiempo ya no corre solo: pasa por estaciones cuando pulsas «Pasar estación».',
      'Al empezar cada estación ves la hoja: lo que has recogido, lo que se ha acabado y lo que ha pasado.',
      'Obras y tropas se pagan enteras al ordenarlas y tardan una o dos estaciones.',
      'Todo lo guardado en el almacén se puede gastar; lo que no cabe se pierde.',
      'En Partida nueva puedes ver ya el mapa de Grecia.'] },
    { v: 171, fecha: '25/11/2026', cosas: [
      'Limpieza: fuera las escenas viejas del testudo y la falange a pie; el juego pesa menos y se ve igual.'] },
    { v: 170, fecha: '25/11/2026', cosas: [
      'Escaramuza nueva: Ásculo, 279 a.C. Está en Escaramuzas, «Pruebas rápidas».',
      'Eliges bando: ser Pirro, con su falange, o ser Roma, con tres manípulos que forman el testudo.',
      'Mandas varios cuerpos a la vez: toca su ficha y dibuja su frente, o el de todos.',
      'El botón de pausa para el tiempo y te deja dar órdenes con calma.',
      'Honderos, arqueros y vélites: tocas un rival para marcarlo y disparan salvas que vuelan de verdad.'] },
    { v: 169, fecha: '25/11/2026', cosas: [
      'La batalla de la campaña es ya la misma que la de Escaramuzas: jugar en vivo, batalla rápida o resolver.',
      'Si cierras el juego a mitad de batalla, al volver la retomas donde la dejaste.',
      'Tus heridos vuelven a filas mes a mes en la ciudad; los del vencido pasan a esclavos o se venden.',
      'La cámara sigue sola al choque, el campo es más verde y los caballos ya no salen negros.',
      'La falange a pie tiene su propia explicación al empezar.'] },
    { v: 168, fecha: '24/11/2026', cosas: [
      'Cada tropa tiene sus datos y tres grados de veteranía; en la batalla verás sanos, heridos y muertos.',
      'Falange a pie nueva: baja las sarisas a tiempo, cierra los huecos y aguanta el empuje; si se parten, siguen con el muñón.',
      'Othismos: cuando las dos falanges chocan, empuja a compás y mira la barra para no ceder.',
      'Rivales nuevos para la falange: ya no son tu reflejo, nadie atraviesa a nadie, los elefantes aguantan y rompen picas, y llegan hasta 144 enemigos.',
      'Muro de escudos y orden abierto en el abanico del estandarte: muro contra lo que viene de frente, abierto para pasar.',
      'Tácticas de la época en la batalla dirigida: los triarios se alzan, la falange cae por el flanco, el que queda rodeado sufre y la furia gala se agota.'] },
    { v: 167, fecha: '24/11/2026', cosas: [
      'Caminos de victoria afinados: el del comercio se gana con la renta del año, que crece con tus ciudades.',
      'La ciudad pide casas en barrios ricos según cuántas ciudades tengas; la política, planes del Senado bien hechos.',
      'Las rutas no se cierran en una guerra: quedan paradas y vuelven con la paz.',
      'El vino que compras da lujo a tus barrios. En la partida corta, las armas piden tomar Tarento.'] },
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
  const AVANCE = {"hecho":69,"total":18,"hechas":8,"medias":9,"faltan":1,"pendientes":[{"t":"Camino del comercio","e":"a medias"},{"t":"Camino de la política: Príncipe del Senado","e":"a medias"},{"t":"Camino de las armas","e":"a medias"},{"t":"Una sola batalla, con un solo aspecto","e":"a medias"},{"t":"El testudo a pie, dentro del juego","e":"a medias"},{"t":"Escaramuzas: batallas sueltas desde el menú","e":"a medias"},{"t":"Fluido y sin conexión en tu móvil, y publicada","e":"por hacer"},{"t":"Formaciones en Escaramuzas","e":"a medias"},{"t":"Menús reordenados y con un solo aspecto antiguo","e":"a medias"},{"t":"Soldados nuevos, con licencia clara","e":"a medias"}]};
  /* FIN AVANCE */
  NOVEDADES.avance = AVANCE;
  root.NOVEDADES = NOVEDADES;
  if (typeof module !== 'undefined' && module.exports) module.exports = NOVEDADES;
})(typeof window !== 'undefined' ? window : globalThis);
