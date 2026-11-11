# R13 · Abastecimiento y desgaste (Imperator: Rome y la serie Hegemony)

Estudio de ingeniería reversa. Solo cómo se comportan los juegos; ningún código, arte ni texto suyo.

## 1. Pregunta
¿Cómo hace la comida que marchar lejos o juntar demasiados soldados cueste?

## 2. Observación
1. Cada unidad pesa en el límite de abastecimiento de su lugar. Si el peso de todos los ejércitos juntos supera el límite local, todos sufren desgaste. La infantería pesada pesa más. [Guía de combate, foro Paradox](https://forum.paradoxplaza.com/forum/threads/imperator-rome-land-combat-guide.1195508/)
2. Remedios que citan los jugadores: partir el ejército en grupos menores y mirar el mapa de suministro antes de mover. [Guía](https://gameplay.tips/guides/9926-imperator-rome.html)
3. Forrajear da un poco más de límite a costa de velocidad de marcha. Foro. [Foro Paradox](https://forum.paradoxplaza.com/forum/threads/seasons-supply-limit-forts-famine-garrison-battle-engagement-and-reformed-war-goals.1453670/)
4. Hay posts que dicen que el desgaste llega a un tope (5 %) y que la comida solo lo amortigua; se contradicen: sin confirmar. (mismo foro)
5. Hegemony: la logística es el centro del diseño. Atacar en la cosecha quita al rival cultivos y alimenta tu campaña; hay campamentos de suministro y líneas de suministro; en la serie se pueden cortar líneas y quemar cosechas. [Longbow, logística](https://longbowgames.com/new-screenshots-logistics-overview/) · [Ficha Rome](https://longbowgames.com/rome/)
6. Sin confirmar: cuánto lleva un carro, alcance de las líneas, el forraje que se agota con las cifras, trenes de bagaje de Imperator (no aparecen en los resultados).

## 3. Por qué funciona
Cambia la pregunta de «cuántos soldados tengo» a «cuántos puedo alimentar aquí». Obliga a repartir fuerzas, a elegir ruta y a pensar en la estación. El coste es visible (un mapa verde o rojo) antes de moverse.

## 4. Traducción a AQVILA
Encaja con N8 (comida y desgaste) y con N7 (ejércitos con general). Mapa por estaciones: el límite cambia con la estación.
- **Regla**: cada provincia tiene un «forraje» por estación (alto en cosecha, bajo en invierno). Un ejército consume 1 de forraje por regimiento y turno. Si el total de ejércitos allí supera el forraje, hay hambre: baja la moral y se pierde un porcentaje de hombres. En tierra propia, el grano sale de los silos de la ciudad. `js/game.js`.
- **Marcha**: en cada casilla se enseña un color (verde/ámbar/rojo) antes de confirmar el movimiento. `js/gfx/map3d.js` y `js/ui.js`.
- **Forrajear**: postura que da +forraje y -velocidad; saquear el campo deja la provincia agotada unas estaciones (licencia de juego).
- **Bagaje**: ejército con tren de bagaje carga N turnos de grano; se pierde la mitad si lo pillan en marcha.
- **Límite con batalla**: la batalla solo recibe moral y hombres iniciales, no sabe de comida (regla de dos sistemas).
- **Pantalla**: 390 px, un icono de espiga con número junto al ejército.

## Historia (280–146 a.C.)
- **Histórico**: Polibio VI 38–39 describe la ración de grano de los soldados (por cotejar); Livio XXII sobre la mano del hambre en Italia tras Aníbal (por cotejar); forrajeo en Polibio III 100 (Aníbal en Gerunio, por cotejar). La cifra de la ración se cita de memoria: por cotejar.
- **Licencia de juego**: el forraje por provincia, el color de casilla, el bagaje con pérdida.

## 5. Coste y riesgo
- 1,0 M (N8). Con mapa de colores y estaciones: 1,5 M. Ajuste del bot, el doble.
- Riesgo: hacer el juego demasiado contable en 390 px; que la IA enemiga no sepa abastecerse.

## 6. Versión mínima
Cada provincia con un límite de forraje y un aviso rojo si el ejército lo supera, con pérdida de moral y 5 % de hombres por turno.
