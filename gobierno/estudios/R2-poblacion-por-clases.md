# R2 · Población por clases (Imperator: Rome)

Estudio de una sola mecánica. Solo cómo se comporta; nada de código, arte ni textos del juego.

## 1. Pregunta
¿Cómo usa Imperator: Rome las clases de población para que cada ciudad produzca cosas distintas y tenga problemas distintos?

## 2. Observación
- Hay cuatro clases: **ciudadanos** (patricios; dan investigación y comercio), **libertos/plebeyos** (sobre todo mano de obra militar), **tribales** (algo de mano de obra e impuestos) y **esclavos** (impuestos). [Diario de desarrollo n.º 5 de Paradox](https://forum.paradoxplaza.com/forum/threads/imperator-development-diary-5-25th-of-june-2018.1107368/), [resumen de guías](https://www.magicgameworld.com/imperator-rome-populations/)
- Cada clase tiene **felicidad propia**. Base: 20 % ciudadanos, 25 % libres, 100 % tribales y esclavos, ajustada por cultura y religión. [resumen de guías](https://www.magicgameworld.com/imperator-rome-populations/)
- La **producción depende de la felicidad media** de esa clase en la ciudad: con 50 % de felicidad, el bono de un 10 % solo da un 55 % de su efecto. [resumen de guías](https://www.magicgameworld.com/imperator-rome-populations/)
- Se puede **ascender** a un habitante (tribal o esclavo a libre, libre a ciudadano) pagando un recurso (10 de «poder oratorio» en la versión citada). [resumen de guías](https://www.magicgameworld.com/imperator-rome-populations/)
- Hay cambio **automático**: la «movilidad social» equilibra poco a poco ciudadanos, libres y esclavos; el «esfuerzo de civilización» convierte tribales en libres o esclavos según el nivel de la ciudad. [resumen de guías](https://www.magicgameworld.com/imperator-rome-populations/)
- Versión posterior: la felicidad de los esclavos pasó a ser mala, pero producen siempre al máximo y pesan menos en el descontento. [resumen de guías](https://www.magicgameworld.com/imperator-rome-populations/)
- Sin confirmar: números exactos de producción por cabeza y de impuestos; cambian con los parches.

## 3. Por qué funciona
Una ciudad ya no es «500 habitantes»: es «tantos de cada tipo». Eso crea decisiones (¿libero esclavos o los exploto?) y explica por qué dos ciudades iguales rinden distinto.

## 4. Traducción a AQVILA
- Hoy: aldeanos repartidos entre madera, piedra, hierro y grano (F3), mano de obra y mantenimiento (I3), felicidad e impuestos (B3), inquietud en las conquistadas (F5).
- Propuesta: **tres clases, no cuatro**: ciudadanos (impuestos y cupo de legionarios), plebeyos (los aldeanos de hoy) y esclavos (más producción de campo, menos felicidad, que sube la inquietud). Cada ciudad guarda tres cifras en lugar de una; la felicidad de B3 se calcula por clase.
- Ascenso: botón «Dar ciudadanía» a cambio de oro (encaja con el plan de ciudadanía de J5). Las conquistadas traen esclavos y tribales; con el tiempo, sin hacer nada, parte pasa a plebeyos (movilidad lenta).
- Lógica en `js/data.js` (constantes por clase) y `js/game.js` (reparto, paso mensual; migrar en `G.load`). Visual en `js/ui.js`: tres chips con número y cara (P65). A 390 px caben tres.
- Con J3: los pueblos tienen sobre todo plebeyos y esclavos; la capital, ciudadanos. Choca con I3 si se cambia la fórmula de producción: hay que mover los puestos de trabajo a cada clase.
- Época: **histórico en esencia** (ciudadanos, libertos y esclavos son reales, la guerra de Sicilia y la conquista traían esclavos), pero los porcentajes son **licencia de juego**. Pasa por la skill `historia`.

## 5. Coste y riesgo
- Dos tareas medias: 1,5–2,5 M de tokens (la economía de I3 ya cuesta 1,6 M en una sola tarea). Más alto que R1 y R3.
- Riesgo: puede ser demasiado para móvil y para el bot; la regla de oro: cada clase debe verse en un número y una cara, nada más.

## 6. Versión mínima
Añadir solo los esclavos: las conquistas dan esclavos que aumentan la producción del campo y bajan la felicidad. Nada de ascensos aún.
