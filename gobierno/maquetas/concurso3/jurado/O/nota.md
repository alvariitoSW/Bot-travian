# Propuesta de interfaz de batalla

1. La idea: el jugador camina como general entre sus tropas. Lo que está a menos de 200 m le obedece al instante; lo lejano llega 6 s tarde. Se decide en el sitio y se ve en la marcha.

2. Pulgar: el izquierdo mueve una palanca de 90 px abajo a la izquierda para caminar. El derecho mantiene pulsado un regimiento medio segundo y sale una hoja a la derecha con cuatro órdenes de 56 px de alto (avanzar, aguantar, flanquear, retirar). El botón Cartas está abajo a la derecha. Todo texto va de 13 px para arriba.

3. Botones a la vista: dos (Pausa arriba a la derecha, y Cartas o Listo abajo a la derecha), más la palanca. La hoja de órdenes solo aparece al pulsar un regimiento.

4. Dirección de arte: Roma republicana, con paleta de bronce, bermellón, ocre y crema. Los regimientos son bloques con estandarte: rectángulo para infantería, con puntos para velites y óvalo para jinetes. El general es una silueta de espaldas con capa roja. Todo está dibujado a mano en SVG y CSS, sin arte de 0 A.D. ni capturas del juego. Solo se usa la letra Cinzel, que ya está en el proyecto.

5. Escala: con 20 regimientos por bando (la pantalla 2 tiene 20 contra 23) se lee bien, porque cada regimiento tiene una marca propia. A 30 por bando, las marcas de lejos se juntan; propongo agruparlas por línea a más de 300 m, con una marca por fila. El campo de 1.500 m: de cerca se ven unos 800 m de frente; al fondo cabe el campo entero. El río y los vados se ven como franja con etiqueta.

6. Cambios en el juego (solo proponer, no tocar): `js/ui.js` para la palanca, la pulsación larga y la hoja de órdenes. `js/gfx/battle3d.js` para la cámara detrás del general, el círculo de 200 m y las marcas sobre cada regimiento. `js/battle.js` para exponer, por regimiento, los segundos que tarda su orden y si está en peligro (flanqueado), que es lo que pinta la vista.

7. Coste estimado: tres tareas, dos medias y una pequeña. Media: la palanca y la hoja de órdenes en `js/ui.js`. Media o grande: la cámara, el círculo y las marcas en `js/gfx/battle3d.js`, que es lo que más pesa en un móvil. Pequeña: los datos de orden y de peligro en `js/battle.js`.
