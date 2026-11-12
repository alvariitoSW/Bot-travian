# Nota del concepto

1. La idea: el campo es una cuadrícula de hexágonos dibujada como grabado de tinta negra y ocre; se planea en pausa y, al ejecutar, cada regimiento avanza hexágono a hexágono, con los pasos numerados a la vista.

2. Pulgar: se toca un regimiento tuyo y luego un hexágono; el camino se traza solo, en puntos y con números. Lo que se toca está abajo: Deshacer y Ejecutar ronda, de 52 px de alto. El texto es de 13 px o más. Lo de arriba (ronda, leyenda, gesto enemigo) solo se lee.

3. Botones a la vista: dos por pantalla. Pantalla 1: Colocar solo y Empezar batalla. Pantalla 2: Deshacer y Ejecutar ronda. Pantalla 3: Volver y Ver resultado. Pantalla 4: Retirar al campamento y Otra ronda. Los hexágonos no cuentan como botones, pero sí se tocan.

4. Dirección de arte y de dónde sale: tinta negra y ocre sobre papel, con tramas de grabado para agua, colina, bosque y peligro, y letra de inscripción (Cinzel, inspirada en las capitales de Trajano). Hecho a mano en SVG y CSS; no usa arte de juegos ni capturas del juego. Honesto: el grabado en cobre es una técnica posterior a Roma; lo romano está en la letra y en la paleta de inscripciones, no en la técnica.

5. Escala: 25 hexágonos de ancho son 1.500 m (unos 60 m por hexágono). Dentro de 3 hexágonos (unos 200 m) del general la orden llega al instante; fuera, marca "6 s". La pantalla 2 muestra 26 regimientos por bando (52 fichas) y es legible. A 30 por bando serían 60 fichas en 175 hexágonos, más de un tercio del campo: haría falta pasar a 9 filas o usar pellizco para alejar. Eso no está probado todavía.

6. Qué cambiar en el juego (solo propuesta, no tocado): `js/battle.js` pasaría de posiciones en metros a una malla de hexágonos, con camino por hexágonos, un paso por turno, el retraso de 6 s fuera del anillo y el aviso de peligro a 2 hexágonos o menos. `js/ui.js` añadiría un modo de batalla en esta vista, con tocar para elegir destino, Deshacer y Ejecutar. `js/gfx/battle3d.js` no haría falta en este modo; quedaría como vista aparte, con un interruptor.

7. Coste estimado: unas 4 tareas. Una grande (malla y camino en `js/battle.js`, con pruebas en Node). Dos medianas (vista de hexágonos y toques en `js/ui.js`; ejecución paso a paso con peligro y retraso). Una pequeña (gesto enemigo y anillo del general). Margen de más o menos una tarea.
