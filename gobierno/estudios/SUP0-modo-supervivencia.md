# SUP0 · Modo supervivencia (diseño, 25/11/2026)

Estado: **diseño, sin construir**. Base de ideas: `REF-supervivencia.md` (vídeos de Summa Expeditionis; solo ideas).
Sirve a OBJETIVOS → Corazón (guerras y estrategia) y Músculo (entretenimiento). Nada entra al plan sin el «sí» del
usuario; este documento recoge lo que ya dijo.

## En una frase
Un juego dentro del juego: eres el oficial de una guarnición de hoplitas apostada en una región de Grecia; levantas tu
campamento y mantienes la posición contra oleadas cada vez más gordas, durante años.

## Lo que decidió el usuario (25/11, literal)
- Pedido: «quiero meter un nuevo modo de juego rollo de supervivencia […] que será un propio juego dentro del juego en el
  que básicamente seas como un campamento o un regimiento apostado en alguna región del mapa». Vídeos: «Estos son los
  videos que te digo para darte una idea que sea como un pequeño juego dentro del juego tener otro modo a parte».
- «Batallas de sguaz»: **«Batallas de agua pero sería otra cosa diferente a la supervivencia»**. → Batallas navales,
  tema aparte. No entran en este documento.
- Quién eres: **«(C) Las dos cosas»** → desde arriba para mandar el campamento, y bajas a un oficial a pie con su grupo.
- Cómo termina: «Pues sería, que tuviera un lore, y unas fueran de mantener la posición otras de batallas perdidas que
  sean los supervivientes, otras que tengan Lore de mitología griega y el fin pues depende de cada tipo de partida
  alomejor un modo sea el modo libre que no haya fin, otro sería construir un campamento y aguantar unas oleadas gordas
  y mantener la posición durante los años yo que se».
- Con la campaña: **«(C) Primero aparte, luego dentro»**.
- Primer tipo de partida: **«(A) Mantener la posición»**.
- Mitología: «Esto sería algo más elaborado, ya lo desarrollaremos más adelante».
- Tiempo: «Habría que pensarlo bien». → Abierto.
- Cómo se pelea en las oleadas: «Sería otro tipo de jugabilidad que se tendría que cerrar de 0 con todos los
  departamentos nuevos creados y trabajando con un objetivo final muy bien definido». → Abierto; se cierra con todos los
  departamentos.
- Tus hombres: **«(B) Una guarnición de hoplitas»**.
- El campamento: «De forma diferente que en la ciudad es otro juego diferentes con otras mecánicas diferentes nada que
  ver con lo creado de la ciudad».
- Cuándo: **«(B) Ya, en paralelo»** (carril propio desde ya; lo abre quien lleva el plan, con su «sí»).

## Cómo se juega (lo decidido y lo que propone el diseño)
1. **Entrar**: Menú → «Supervivencia» (botón propio, junto a Escaramuzas). Eliges tipo de partida (al principio solo
   «Mantener la posición») y una región de Grecia. No toca tu partida de campaña.
2. **Dos vistas** (decidido):
   - **Desde arriba**: el campamento entero. Repartes trabajos a tus hombres (leña, agua, comida, guardia, obras) y
     decides qué levantar.
   - **El oficial a pie**: cámara detrás de él; su grupo (10–20 hoplitas, propuesta) le sigue. Rueda de órdenes con el
     pulgar, en tres partes: tú, tu grupo, tu animal (de los vídeos). Formar columna o línea, seguirme, trabajar,
     defender.
3. **El campamento crece con mecánicas propias** (decidido: nada que ver con la ciudad). Propuesta para debatir: lo
   levantan tus hombres a mano, pieza a pieza (se ve cómo cavan el foso, clavan la empalizada, alzan la torre), con
   lo que traen de fuera; sin colas de construcción ni edificios de la ciudad.
4. **Las oleadas**: llegan enemigos cada vez más fuertes. Cómo se pelean y cómo pasa el tiempo: **abierto**.
5. **Fin**: en «Mantener la posición», aguantar las oleadas durante años. Otros tipos tendrán su propio fin.

## Tipos de partida (orden)
| Orden | Tipo | Fin | Estado |
|---|---|---|---|
| 1 | Mantener la posición | Aguantar oleadas gordas durante años | **Primero** (decidido) |
| 2 | Supervivientes | Restos de una batalla perdida en tierra enemiga | Idea del usuario |
| 3 | Mitología griega | Con su lore propio | «Más adelante» |
| 4 | Libre | Sin fin | Idea del usuario |

Todo lleva **lore** (relato). Lo de época con fuente y dictamen (skill `historia`); lo inventado para jugar, marcado
como licencia de juego. Guarnición de hoplitas en el 800 a.C.: el hoplita pleno es algo posterior (s. VII a.C.);
habrá que marcarlo como licencia de juego o vestirlos como guerreros de la época (lo dictamina Historia).

## Qué reutiliza
- Soldados (modelos y animaciones de la batalla a pie), control a pie del bloque y la cámara detrás.
- Regiones del mapa de Grecia (mapa vivo, M1) para elegir dónde acampas.
- Menú de la Partida nueva (PN1) para el botón.
- Suelo, árboles y agua de `js/gfx/`.
- **No** reutiliza la ciudad ni su economía (decidido).

## Lo que queda abierto (para cerrarlo con todos los departamentos)
1. Cómo pasa el tiempo (día jugable por estación, tiempo seguido u otro).
2. Cómo se pelea una oleada (tu grupo a pie, batalla grande o las dos).
3. Mecánicas del campamento (propuesta del punto 3, por aprobar).
4. Tamaño del grupo del oficial y de la guarnición.
5. Qué es «tu animal» (perro, mula, caballo).
6. Cuándo pasa de «aparte» a «dentro de la campaña».

El usuario pidió cerrar esto «de 0 con todos los departamentos nuevos creados y trabajando con un objetivo final muy
bien definido». Propuesta: la primera tarea del carril (SUP1) es una mesa de diseño con Corazón (Batallas y Combate),
Músculo, Arte, Sonido e Historia que entrega la ficha de objetivo y las respuestas a 1–6, para que el usuario las
apruebe antes de construir.

## Estándar (qué se mide, quién, valor para aprobar)
| Qué se mide | Quién lo mide | Aprueba si… |
|---|---|---|
| Aspecto | Juez de aspecto con ficha de objetivo | Nota ≥ 8,5. Ficha de 8–12 cosas que se ven: campamento que cambia por etapas, hombres trabajando de verdad (leña, foso, empalizada), humo y fuego, noche con antorchas, oficial y grupo formando en columna y línea, oleada llegando a la empalizada |
| Se entiende | Juez de pantalla | Entrar desde el menú en ≤ 2 toques; cambiar de vista en 1 toque; cada orden de la rueda en ≤ 2 toques; a 390 px y en horizontal |
| Se puede aguantar y se puede perder | Bot de reglas | Con un bot que juega bien, aguanta las primeras oleadas en 8 de 10 partidas; con un bot que no trabaja, cae en 10 de 10 |
| Fluido y sin conexión | Jueces de siempre | Sin errores de consola; funciona sin red; no rompe la campaña ni el guardado |
| Fiel a la época | Ministerio de Historia | Fichas con fuente y dictamen; lo inventado, marcado como licencia de juego |
| Te gusta | El usuario | Su «Bien», en su móvil |

## Tamaño
**Grande**: un juego nuevo dentro del juego. Propuesta de tandas (cifras por medir con `gasto.mjs`):
- SUP1 Mesa de diseño con los departamentos y ficha de objetivo — Medio.
- SUP2 Botón en el menú, elegir región, campamento inicial y las dos vistas — Grande.
- SUP3 Oficial con su grupo y rueda de órdenes — Grande.
- SUP4 Trabajos y campamento que crece — Grande.
- SUP5 Oleadas y fin de «Mantener la posición» — Grande.
Archivos propios del modo (nuevos), para no pisar a la ciudad ni a la batalla.

## Lo que queda fuera
- **Batallas de agua** («sguaz»): tema aparte, otro diseño.
- Supervivientes, Mitología y Libre: después de «Mantener la posición».
- Monstruos y arte de mitología: «más adelante».
- Conectar con la campaña: después de que funcione aparte.
- Nada de código ni arte de Summa Expeditionis: solo ideas.
