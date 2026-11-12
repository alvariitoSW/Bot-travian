# Propuesta de interfaz para la batalla

1. La batalla es un bajorrelieve horizontal de piedra clara: caballería arriba, infantería en medio y tiradores abajo. Se ordena arrastrando cada figura hacia delante o hacia atrás.
2. Con el pulgar: tocar un regimiento y arrastrarlo a la derecha (avanza) o a la izquierda (retira); la distancia sale en metros. Arrastrar en vacío desliza el friso. "Ejecutar ronda" queda abajo, al alcance del pulgar; los botones miden 44 px o más y el texto 13 px o más.
3. Cuatro botones fijos (Pausa, Ejecutar ronda, Cartas, Centrar) y uno más dentro de la tarjeta del regimiento elegido (Quitar orden). El mando libre se ve como puntos.
4. Dirección de arte: relieve romano de época republicana, marfil y gris con sombras de talla, en perfil. La idea viene de los frisos históricos en piedra; las figuras están hechas a mano en SVG, sin arte de 0 A.D. La letra es Cinzel, de assets/fuentes.
5. A 20 y 30 regimientos por bando, las tres franjas admiten más figuras por fila sin cambiar la pantalla. A 1.500 m (unos 2.400 px), la vista de 844 px muestra unos 9 regimientos seguidos; un mapa en miniatura arriba muestra todos los regimientos y el recuadro de la vista, y tocarlo salta a esa zona.
6. Cambios propuestos (no tocados): `js/ui.js` para la pantalla de despliegue y la tarjeta de orden; `js/gfx/battle3d.js` para pintar la vista de friso con relieve y sombras; `js/battle.js` para el orden por distancia (200 m del general y 6 s de retraso fuera de él) y la detección de peligro (regimiento a menos de 60 m del enemigo).
7. Coste estimado: 1,5 tareas medias (una para la vista y el arrastre de órdenes, media para el mapa en miniatura y las pantallas de carga y resultado).
