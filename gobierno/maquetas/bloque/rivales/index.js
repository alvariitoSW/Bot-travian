/* AQVILA — FU4: el dibujo de los rivales de la falange en la escena del bloque (elefantes, caballería, falange, hoplitas).
   Por ahora solo reexporta el de la escena vieja (gobierno/maquetas/falange/rival.js); el traslado de verdad es de FU6.
   Contrato: montaRivalDe(nombre, { escena, estado: () => S, H }) → { paso(dt), aviso(tipo, d), quita(), peso() } (o null). */
export { montaRivalDe } from '../../falange/rival.js';
