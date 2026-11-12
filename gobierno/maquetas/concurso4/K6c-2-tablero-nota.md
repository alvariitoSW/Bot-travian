1. Un campo entero visto desde arriba, con fichas de marfil y madera; cada turno se planean tres órdenes y los choques se resuelven con una tirada a la vista.
2. Se maneja con dos toques: tocas una pieza y luego un punto azul (avanzar) o rojo (atacar). «Ver el choque» inclina el mismo campo y levanta las fichas; «Volver al mapa» regresa sin perder las órdenes.
3. Tres botones en la pantalla de juego (quitar la última orden, ver el choque, ejecutar el turno) y dos en el resultado.
4. Hecho a mano en HTML y CSS, sin arte importado: cuadrícula de madera, fichas de marfil, río azul con tres vados y Cinzel en los títulos. La inspiración viene de los juegos de mesa romanos, no de otro juego.
5. A 20 regimientos cabe en la cuadrícula de 15 × 8 casillas de 100 m (1.500 m). A 30 hacen falta dos filas más por bando. El turno dura 60 s con barra y cuenta atrás; si se agota, se ejecuta solo.
6. Solo proponer: en `js/ui.js`, el bucle de turnos con órdenes limitadas y cuenta atrás; en `js/gfx/battle3d.js`, la escena inclinada sobre el mismo mapa; en `js/battle.js`, la tirada con probabilidad visible, el río con vados y el aviso de riesgo.
7. Unas cuatro tareas medianas: turnos y órdenes, escena inclinada, tirada y riesgo, y ajuste a 30 regimientos con pruebas.
