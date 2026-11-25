/* ES2 · El mando de varios cuerpos de la escena del bloque. Las reglas viven en js/mando-varios.js (corre en Node, sin pantalla);
   aquí solo se reexportan para la escena. ES3 lo amplía con los tiradores: mando.anade({ id: 'tiradores', nombre: 'Honderos', ... }). */
export { crearMando, ORDENES_DE, HUECO } from '../../../js/mando-varios.js';
