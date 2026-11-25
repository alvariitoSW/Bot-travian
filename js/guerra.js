/* AQVILA — Guerra: las TABLAS de tropa que lee el simulador de manípulos (js/simulador.js). Corre en Node y en el navegador (global `Guerra`).
   Historia: aquí vivía el motor de la batalla vieja de la campaña (GC3, GM5: tres cuerpos, cuatro órdenes), dibujado por js/ui-guerra.js.
   En CG4b la campaña pasó al simulador (el mismo de Escaramuzas) y se retiraron el motor y su pantalla: nadie los llamaba.
   Quedan solo las cifras que el simulador importa, sin cambiar ni una:
     CARACTER (calidad, cansancio, mente, firmeza y flanco de cada tropa) y GENERICO (la tropa sin ficha),
     POSTURAS (cuánto protegen escudos y testudo de los proyectiles y cuánto cansan),
     TIRO y tiroDe(tropa) (arma, alcance, ritmo y munición de los tiradores).
   Las reglas que se copiaron al simulador (K_BAJAS, fatiga, relevo, pila…) están escritas allí. */
(function (root) {
  'use strict';
  /* ---------- carácter de cada tropa ----------
     cal = calidad en el choque · cansa = cuánto se fatiga al empujar · firme = aguanta mejor a pie quieto
     mente: furia = carga y se cansa · paciencia = espera y contragolpea · media = alterna.
     Las cifras de cal y cansa son licencia de juego. Las fuentes dan el carácter, no los números
     (todo sin cotejar pasaje a pasaje: se cita la obra y el capítulo que se recuerda). */
  const CARACTER = {
    hastati:   { cal: 1.00, cansa: 1.00, mente: 'media', pl: true },                 /* legión manipular: Polibio 6.21-24, sin cotejar. Cifras: licencia de juego */
    principes: { cal: 1.14, cansa: 0.90, mente: 'media', pl: true },                 /* ídem */
    triarii:   { cal: 1.12, cansa: 0.80, mente: 'media', firme: true, pl: true },    /* ídem; lanceros que aguantan a pie quieto */
    galos:     { cal: 1.34, cansa: 1.75, mente: 'furia', nom: 'guerreros galos' },                 /* Polibio 2.33: furia inicial que se agota. Cifras: licencia de juego */
    libios:    { cal: 1.20, cansa: 0.72, mente: 'paciencia', nom: 'infantería libia', art: 'la', pl: false },             /* Polibio 15.11-14 y 3.114: armados a la romana en Cannas. Cifras: licencia de juego */
    iberos:    { cal: 1.10, cansa: 1.05, mente: 'media', nom: 'guerreros íberos' },                 /* Polibio 3.114. Cifras: licencia de juego */
    sagrada:   { cal: 1.25, cansa: 0.75, mente: 'media', firme: true, nom: 'ciudadanos de Cartago' },    /* Diodoro 16.80 (Batallón Sagrado). Cifras: licencia de juego */
    falange:   { cal: 1.22, cansa: 0.70, mente: 'media', firme: true, flanco: 1.85, art: 'la', pl: false },   /* Polibio 18.29-30 y 18.32: de frente imbatible, de flanco se hunde. Cifras: licencia de juego */
    elefantes: { cal: 1.55, cansa: 2.4, mente: 'furia', pavor: true, art: 'los', pl: true },        /* Plutarco, Pirro 17 y 21; Polibio 1.40: arrollan al chocar y, heridos, se desbocan. Cifras: licencia de juego */
    hoplitas:  { cal: 1.05, cansa: 0.85, mente: 'media', firme: true },    /* licencia de juego */
    peltastas: { cal: 0.70, cansa: 1.00, mente: 'media' },                 /* licencia de juego */
    honderos:  { cal: 0.65, cansa: 1.00, mente: 'media' },                 /* licencia de juego */
    milicia:   { cal: 0.80, cansa: 1.00, mente: 'media', art: 'la', pl: false },                 /* licencia de juego */
    vigiles:   { cal: 0.85, cansa: 1.00, mente: 'media', nom: 'guardia urbana', art: 'la', pl: false }                  /* licencia de juego */
  };
  const GENERICO = { cal: 1.0, cansa: 1.0, mente: 'media' };
  /* paso = metros por segundo · recibe = parte de los proyectiles que hacen baja · cansa = fatiga por segundo · aprieta = cuánto se juntan */
  const POSTURAS = {
    avanzar: { paso: 2.4,  recibe: 1,    cansa: 0,      aprieta: 1 },
    escudos: { paso: 1.3,  recibe: 0.42, cansa: 1 / 90, aprieta: 0.82 },
    testudo: { paso: 0.35, recibe: 0.1,  cansa: 1 / 40, aprieta: 0.62 }
  };
  /* Tiradores: arma, alcance (m), bajas por tirador y segundo contra tropa sin cubrir, segundos de munición, cuánto se adelantan y a qué paso */
  const TIRO = {
    velites:   { arma: 'jabalinas', alc: 30, tiro: 0.032, mun: 15, adelanto: 34, marcha: 3.6 },
    peltastas: { arma: 'jabalinas', alc: 30, tiro: 0.032, mun: 15, adelanto: 34, marcha: 3.6 },
    honderos:  { arma: 'piedras',   alc: 80, tiro: 0.15,  mun: 24, adelanto: 34, marcha: 3.0 }
  };
  const TIRO_GEN = { arma: 'jabalinas', alc: 30, tiro: 0.032, mun: 15, adelanto: 34, marcha: 3.4 };
  const tiroDe = t => TIRO[t] || TIRO_GEN;

  const Guerra = { CARACTER, GENERICO, POSTURAS, TIRO, tiroDe };
  root.Guerra = Guerra;
  if (typeof module !== 'undefined') module.exports = Guerra;
})(typeof window !== 'undefined' ? window : globalThis);
