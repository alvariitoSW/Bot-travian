1. La idea: cada turno cada legión hace una tirada a la vista, y la probabilidad de ganar su duelo se ve antes de decidir.
2. Pulgar: se toca una legión en el mapa grande y aparecen tres órdenes (atacar, aguantar, retirar), con lo que pasa en cada caso. «Escena» amplía el campo y muestra las tiradas sobre cada duelo; «Ver el resultado» lleva al registro.
3. Botones a la vista: dos, «Escena» y «Tirar los dados». Al elegir una legión aparecen tres órdenes. El reloj del turno va en la cabecera, con el tiempo que falta.
4. Dirección de arte: mapa cenital con tierra, río, bosques y cuadrícula de 100 m, hecho a mano en SVG y CSS. Fichas de legión con numeral y barra de fuerza; tiradas con dos caras de puntos. No usa arte externo ni modelos de 0 A.D.
5. Escala: el campo es de 1.500 m y 20 legiones por bando caben de una vez en el mapa. A 30 por bando sube a seis filas. El turno es un reloj de 90 segundos para planear; al llegar a cero se tiran las tiradas solas.
6. Qué cambiar (solo proponer): en `js/ui.js`, un modo por turnos con reloj y órdenes por legión. En `js/battle.js`, separar la tirada en una función que devuelva la probabilidad antes de resolver. En `js/gfx/battle3d.js`, las tiradas como capa encima del campo.
7. Coste estimado: 4 tareas (modo por turnos con probabilidades, capa de tiradas en 3D, pantalla de resultado, pruebas en móvil).
