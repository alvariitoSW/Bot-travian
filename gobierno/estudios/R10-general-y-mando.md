# R10 · General y mando (Total War: Rome II y Field of Glory II)

Estudio de ingeniería reversa. Solo cómo se comporta el juego; ningún código, arte ni texto suyo.

## 1. Pregunta
¿Qué aporta el general, qué cuesta perderlo, y tiene precedentes limitar las órdenes (nuestros «puntos de mando»)?

## 2. Observación
**Rome II**
1. La autoridad del general agranda su radio de influencia y le da habilidades de mando. [Gamepressure](https://www.gamepressure.com/totalwarromeii/leader/z45726).
2. Sus habilidades se apuntan a una unidad: subir moral, atacar o defender mejor, bajar la del enemigo (grito de guerra). [Gamepressure](https://www.gamepressure.com/totalwarromeii/mechanics/zd5798). Radio exacto: sin confirmar (un jugador cita 40 m para una habilidad de susto, [Steam](https://steamcommunity.com/app/214950/discussions/0/2965019884823106662), sin verificar).
3. Su presencia sube la moral cercana. Si muere con tropas huyendo, quedan «quebradas»: no se reagrupan ya. [Manual oficial](https://r2encv2.totalwar.com/en/manual/single-player/0087_enc_page_battle_play_phase_conflict_morale/index.html).
4. Castigo por su muerte: foros de la serie hablan de -8 un rato y -2 el resto, pero no de Rome II: [foro](https://forums.totalwar.org/vb/showthread.php/97254-Assassinated-General-morale-penalty). Sin confirmar.

**Field of Glory II**
5. Las tropas a 4 casillas de un general tienen +1 en chequeos de cohesión; con general siempre se tira para reagruparse. [Foro](https://forum.slitherine.com/viewtopic.php?p=865483).
6. El general se adjunta a una unidad y le da bono de combate. Alcance según rango: 1 a 3 casillas según un foro; otro dice 3 o 4 según el tamaño de la batalla. Se contradicen: sin confirmar. En combate, huyendo o persiguiendo, pierde su alcance y sus tropas quedan «fuera de mando» salvo que otro general las cubra. [Foro](https://forum.slitherine.com/viewtopic.php?p=966188).

**Limitar órdenes: precedentes**
7. Commands & Colors: una carta fija cuántas unidades se pueden ordenar por turno; las órdenes sobrantes se pierden. [Reglas](https://www.commandsandcolors.net/ancients/the-game/main/06-play-a-command-card.html). Sensación de mesa: sin confirmar.
8. Radio de mando: en Grand Tactician fuera del radio hay castigo y peor recuperación ([Steam](https://steamcommunity.com/app/654890/discussions/0/600767185374208030)). Flashpoint Campaigns lo liga a suministro y recuperación ([Matrix](https://www.matrixgames.com/news/flashpoint-campaigns-southern-storm-dev-log-2)). Órdenes con retraso por mensajero: Scourge of War y Grand Tactician ([MGW](https://www.magicgameworld.com/grand-tactician-the-civil-war-1861-1865-order-delays/)); sensación: sin confirmar.

## 3. Por qué funciona
El general da al jugador un sitio donde mirar y algo que proteger. Un límite de órdenes obliga a priorizar. Pero en tiempo real cansa; por turnos (el nuestro), no.

## 4. Traducción a AQVILA
- **Puntos de mando (N1)**: tienen precedente claro en C&C (límite por turno). Encajan mejor en rondas que en tiempo real. Ventaja de móvil: menos toques.
- **Radio de mando como añadido**: un regimiento a menos de ~R del general no cuesta punto para seguir su orden; fuera, sí, o reagrupa peor. R sale de pruebas. El radio se dibuja como círculo tenue en `js/gfx/battle3d.js`; la lógica en `js/battle.js` (hoy `MOR_GENERAL` = 4 al caer).
- **Orden con retraso**: un regimiento lejano obedece la ronda siguiente. Se ve como flecha punteada. Idea que mejor casa con «planeas y luego miras». Riesgo: parece fallo si no se explica.
- **Muerte del general**: puntos de mando pasan de 4 a 2 (N1), huyendo no reagrupan, golpe de moral moderado.
- **Habilidades**: las cartas de táctica (N1) hacen de «habilidades del general».
- **Maqueta**: círculo de mando y contador de puntos.

## 5. Historia (280–146 a.C.)
- **Histórico (por cotejar)**: el general romano dirigía desde la línea y su caída era grave: Flaminio muere en Trasimeno 217 (Polibio III 84; Livio XXII 6) y Paulo en Cannas 216 (Polibio III 116). Los tribunos y centuriones transmitían las órdenes por señales (Polibio VI 24, 35).
- **Licencia de juego**: puntos, radio, retraso, números.

## 6. Coste y riesgo
0,7–1,0 M (ya cuenta N3). Riesgo: dos reglas de mando a la vez (puntos y radio) confunden; elegir una.

## 7. Versión mínima
Puntos de mando por ronda, círculo de mando del general y pérdida de la mitad de los puntos al caer.
