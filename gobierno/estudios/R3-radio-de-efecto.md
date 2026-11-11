# R3 · Radio de efecto de los edificios (Grand Ages: Rome)

Estudio de una sola mecánica. Solo cómo se comporta; nada de código, arte ni textos del juego.

## 1. Pregunta
¿Cómo hace Grand Ages: Rome para que importe **dónde** colocas un edificio y cómo se lo enseña al jugador?

## 2. Observación
- Los edificios dan sus bonos o necesitan otros **dentro de cierta distancia** (un radio), en lugar de repartir por calles como Caesar. [Wikipedia (espejo)](https://en.wikipedia.org/wiki/Grand_Ages:_Rome), [comparación con Caesar en foro](https://embed.gog.com/forum/caesar_series/range_of_influence_indicator_is_there_an_easy_way)
- Colocar ciertos edificios juntos o en buenas zonas da bonos de producción y de popularidad. [GameWatcher](https://www.gamewatcher.com/reviews/grand-ages-rome-review/9760)
- Las casas piden comida, ocio y religión; cuanto más rica la clase, más variedad. Plebeyos: solo comida; ecuestres: también ocio; patricios: también religión. [GameGrin y reseñas](https://www.gamegrin.com/reviews/grand-ages-rome)
- Si las necesidades no se cubren, se extienden crimen y enfermedad y las casas se abandonan, con efecto en cadena. (De segunda mano; no cotejado con una reseña original.) [Wikipedia (espejo)](https://en.wikipedia.org/wiki/Grand_Ages:_Rome)
- Sin confirmar: los radios en metros o casillas, qué edificio da qué, y cómo se dibuja el radio al colocar. No lo dicen las fuentes alcanzables; en otros juegos del género se enseña con un círculo o casillas coloreadas, pero **no está comprobado** para este.

## 3. Por qué funciona
La pregunta «¿dónde pongo esto?» se contesta con la vista: un círculo te dice qué casas ganan. No hay que leer tablas.

## 4. Traducción a AQVILA
- Hoy: la ciudad es una pantalla 3D (J6) con solares fijos (I4), sin posición libre.
- Propuesta: **no radio en metros, sino en solares vecinos**. Los 7–10 solares forman un anillo o rejilla pequeña; el templo, las termas y el anfiteatro dan su bono a los solares **adyacentes** (por ejemplo, +felicidad a casas vecinas) y los talleres lo restan (humo). Al arrastrar un edificio a un solar, se **iluminan** en verde o rojo los solares que ganan o pierden, y un texto de una línea dice el total («+6 felicidad»).
- Lógica del vecindario en `js/data.js` (qué edificio afecta a quién) y `js/game.js` (suma a la felicidad B3). Visual en `js/ui.js` y `js/gfx/city3d.js` (resaltar solares; hay medallas ya en J6).
- Con R1: los servicios cubren los barrios vecinos y no toda la ciudad. Con J3: la capital tendría más solares y más juego de radios; los pueblos, casi ninguno. Choca con I4: si los solares son pocos, el radio apenas importa; solo vale si hay unos 10 solares o más.
- Móvil: tocar y ver el resaltado funciona en 390 px. Offline sin problema.
- Época: **licencia de juego** (el urbanismo romano tenía zonas, pero no estos radios).

## 5. Coste y riesgo
- Una tarea media: 0,7–1,2 M de tokens. Más barato si no hay arte nuevo.
- Riesgo: demasiada atención al colocar en una ciudad con pocos solares; resultado poco visible. Mejor tras R1 y J3.

## 6. Versión mínima
Que el templo dé +felicidad a los dos solares vecinos y que, al elegir solar, estos se vean resaltados con el número.
