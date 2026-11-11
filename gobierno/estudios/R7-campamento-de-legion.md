# R7 · Campamento de legión (Expeditions: Rome, 2022)

Estudio de ingeniería reversa. Solo cómo se comporta el juego; ningún código, arte ni texto suyo.

## 1. Pregunta
¿Cómo usa Expeditions: Rome un campamento mejorable entre batallas, y cómo une campaña y batalla?

## 2. Observación
1. Hay un menú de gestión del campamento con una pestaña de mejoras. [Pro Game Guides](https://progameguides.com/expeditions-rome/all-outpost-upgrades-in-expeditions-rome/)
2. Son 27 mejoras, cada una con su coste de recursos; se pagan con lo que dan las zonas conquistadas (granjas, curtidurías, aserraderos, minas de hierro). Fuente: [mismo sitio](https://progameguides.com/expeditions-rome/all-outpost-upgrades-in-expeditions-rome/), guías de comunidad.
3. Cadenas: Cuartel → Guarnición → Pretorio da reclutas, y el pretorio sube su calidad; los últimos niveles solo acortan la curación. Baño → Lavacro sube la aprobación. Empalizada → Muros → Muros de piedra (nombres de cadena según [GameSkinny](https://www.gameskinny.com/tips/expeditions-rome-legion-outpost-upgrades-guide/)).
4. Un personaje asignado a una instalación la hace funcionar; el taller permite estratagemas de un solo uso. (Misma guía.)
5. Las tiendas reponen suministros tácticos. Sin confirmar qué da cada una.
6. Ligazón: el autor dice que todas las instalaciones se pueden mejorar, con recursos de la campaña. [Diario de desarrollo 5](https://community.expeditionsseries.com/forums/topic/16-devdiary-5-metagame-legion-battles/) (no abierto: la red lo bloquea; fuente indirecta).
7. Sin confirmar: costes exactos y efectos de nivel; las guías tienen más de 4 años.

## 3. Por qué funciona
La victoria en campaña se convierte en algo que se ve crecer. Perder gente duele porque hay que curar y reponer. El jugador tiene una razón para cuidar sus tropas.

## 4. Traducción a AQVILA
- **Idea**: un edificio «Castra» por ejército o por ciudad militar, con cuatro mejoras: empalizada (el defensor gana moral), valetudinarium (curar bajas), armamentarium (armas B8) y tribunal (más reclutas de nivel alto).
- **Ligazón con la batalla**: `js/battle.js` sigue sin saber de economía. `js/game.js` convierte las mejoras en números que se pasan a los ejércitos antes de la batalla (como hoy B8 y los templos) y recoge las bajas después. Una parte de los caídos vuelve herida según el nivel del valetudinarium.
- **Encaja con** B8 (herrería), I3 (mantenimiento: cada nivel cuesta oro cada mes), I4 (solares limitados, ocupa uno) e I5 (investigación; el campamento sería su rama de guerra). **Choca con** I2 si el campamento exige estar en un sitio concreto del mapa. Amplía A8 (moral).
- **Móvil**: una ficha con cuatro botones, estilo J7. Offline, guardado en `G.load` con campo nuevo migrado.
- **Vista 3D**: tiendas en `js/gfx/city3d.js` con piezas de 0 A.D. ya existentes. Sin arte nuevo.

## Historia (280–146 a.C.)
- **Histórico**: el campamento de marcha romano, cuadrado, con foso y empalizada, descrito por Polibio VI 27-34 (tiendas, calles, tribunos, guardias). Polibio pone el campamento en el centro de la disciplina romana.
- **Licencia de juego**: mejoras por niveles, curación de heridos con tiempo, reclutas del campamento. En la época no se mejoraba el campamento: se levantaba cada noche, y el campamento fijo de invierno (hiberna) se da más tarde. Ese uso es licencia.

## 5. Coste y riesgo
- Versión mínima: 1 sesión media, 0,8–1,2 M de tokens (tarea media 0,7–1,5 M). Versión completa con curación: 2 sesiones, 1,5–2,5 M. Ajustar números de batalla o equilibrio cuesta el doble.
- Riesgos: solapa con I5 y B8, conviene hacerla tras I5; añade costes de mantenimiento que pueden hundir el equilibrio del bot (B6, 8 de 10); sobrecarga de interfaz en 390 px.

## 6. Versión mínima
Un solo edificio «Castra» con tres niveles. Cada nivel da +moral al ejército que sale de esa ciudad y devuelve una cuarta parte de las bajas como heridos tras la batalla. Sin tiendas ni personajes.
