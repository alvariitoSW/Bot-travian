# EB1 · Estado de las batallas (25/11/2026)

Sesión de **estado de las batallas**: solo investiga, enseña y acuerda el enfoque; no construye nada del juego.
Sirve a `OBJETIVOS.md`, Corazón («una sola batalla») y a la batalla de la 2.0.

**Pedido literal del usuario (25/11)**: «quiero hablar sobre el estado de las batallas en el juego. Quiero mejorar bien el
enfoque que vamos a tener para las mejoras. Quiero saber cómo está actualmente en el móvil. Todos los tipos de juego de
escaramuza, me refiero a lo de falange, testudo, el manípulo y todo eso. Porque quiero ver qué mejoras podemos hacer para el
tema de testudo y unificarlo todo bien. […] quiero terminar bien la jugabilidad de la parte del juego, porque creo que ha
habido mejoras en un lado a la vez que se empeoraba por otro. Entonces quiero saber cómo está todo, si ya está todo
unificado, todas las batallas son iguales, los movimientos, las tropas, todo. Quiero un resumen exacto del estado actual.»

**Añadido (25/11, por el vigía, literal)**: «si juego ahora con la falange y juego desde la visión del oficial, no veo la
lanza como la tenía en la versión anterior, pero sí que desde la vista, desde arriba, se ve mejor que en la visión anterior
y el movimiento también. Entonces quiero un poco ver cuál es el estado actual, porque hay cosas que hay que pulir, otras hay
que definir, y esto sobre todo con el tema de la 2.0, para hacerlo bien y no diverger en mil cosas, sino definir
exactamente el objetivo final y hacerlo ya en la 2.0 fácil y sencillamente, desde todo lo que tenemos hecho.»

**Sobre qué se midió**: `main` (v171, lo que hay en su móvil). La rama del juego (v172) no cambia nada de batallas: solo el
mapa de Grecia, la hoja de estación y menús (`git diff main origin/claude/roman-strategy-mobile-game-bx9oq2`: ningún
archivo de batalla). Capturas de esta sesión: `gobierno/capturas-tarea/EB1-*.jpg` (390×844 «-v» y 844×390 «-h»), hechas con
`gobierno/maquetas/bloque/captura-eb1.mjs` y `captura-eb1-oficial.mjs`. 0 errores de consola en todas.

**Página visual para el móvil** (pedida por el usuario el 25/11: «ejemplificarme de manera visual cómo está ahora el estado
del juego en cuanto a las batallas, para con ese formato visual hacer ajustes más finos»): https://claude.ai/artifact/1jprVyJMkpnDVEYbGYft8N
Cada nota lleva un número (T1, F0, G5…) para pedir ajustes finos.

## 1. En una pantalla
- **No está unificado.** Tres pantallas: batalla grande en vivo (`js/ui-mando.js` + `js/simulador.js`; campaña y escaramuza
  montada), batalla rápida (`js/ui-batalla-rapida.js`, lienzo 2D) y escena «a pie» (`gobierno/maquetas/bloque/`).
- Testudo, falange, manípulo y Ásculo ya son **la misma escena a pie** (FU1–FU6: mismo campo, dibujar el frente, cuatro botones).
- Por dentro, **cuatro reglas de lucha**: bloque con CB3 (`js/bloque.js`, `bloque-ia.js`, `combate-tropas.js`) para testudo y
  manípulo; `js/falange.js` + `falange-rivales.js` para la falange; `js/mando-varios.js` + `tiro.js` para Ásculo; `js/simulador.js`
  para la batalla grande y la rápida.
- **Cuatro juegos de botones**: Testudo·Cargar·Relevo·Alto / Bajar picas·Cerrar filas·Avanzar·Alto / Avanzar·Alto·Cargar·Retirada /
  Cargar·Relevar·Retroceder·Aguantar·Formar…·Al tribuno·Bajar.
- **Soldados comunes** (`js/gfx/soldado.js`, los cargan la escena a pie y el mando), salvo falangitas propios. **Campo y luz
  distintos**: a pie `maquetas/falange/campo.js` (dorado, colinas); arriba `js/gfx/campo-mando.js` (verde y plano).
- Física de cuerpos y proyectiles: un solo motor (`js/fisica-batalla.js`, FI3u/FI4).

## 2. Lo más grave (usuario, 25/11, con captura: «Aquí se ve con el atraviesan las picas que no se cuántas veces habré repetido
que no quiero que pase eso....»)
- **F0 · Las picas atraviesan los cuerpos** en la falange: las de las filas de atrás entran por la espalda de los de delante
  (el oficial incluido) y cruzan a los caídos. Causa: FU3c coloca cada sarisa en un «carril» fijo a 33 cm del hombro
  (`bloque/formaciones/falange.js`, `CARRIL`, «Solo dibujo»): nada comprueba si choca con el cuerpo de delante cuando las filas
  se aprietan. Pedido ya el 23/11 («que no se atraviesen las picas ni los brazos»); P187 (brazos) en la nevera.
- **F1 · La lanza del oficial**: FU3c (24/11) dejó de pintar la sarisa del oficial («salía como una tabla delante de la cámara»)
  y adelgazó todas. Antes: `capturas-tarea/FU3-oficial-390.jpg`; ahora: `EB1-oficial-falange-v.jpg`. Lo que mejoró (el usuario
  lo nota): vista de arriba y movimiento.

## 3. Notas por escena (detalle y capturas en la página)
- Testudo: T1 techo plano de escudos idénticos; T2 sin pared delante ni a los lados; T3 tinte rojo que tapa el objetivo;
  T4 tamaño en vertical; T5 el testudo de la batalla grande no se ve igual; T7 bajo el techo, dos escudos enormes con una raja
  de cielo y el frente abierto. T6 se entiende (bien).
- Falange: F0, F1; F2 penacho de bloque blanco; F3 desde arriba no se lee si las picas están bajadas; F5 pendientes de FU3c; F6 contra elefantes pone «Trabados» y no se ve ningún elefante.
- Manípulo: M1 casi la misma partida que el testudo; M2 vélites y triarios de LP5 perdidos; M3 la vista del
  oficial en la lucha es la mejor del juego (bien); M4 el cuarto botón cambia de «Alto» a «Retirada»; M5 etiquetas que se pisan.
- Ásculo: A1 su falange no tiene nada de la de «Falange a pie»; A2 itálicos y tiradores con modelo equivocado; A3 no cuenta en
  la campaña (ES5); A4 cámara muy alta y con bruma; A5 las fichas tapan el campo y las etiquetas asoman encima de los botones.
- Batalla grande: G1 al empezar solo estandartes y barras; G2 otro campo; G3 nombres de botones distintos; G4 física por encima
  del tope (1,31 ms, FI4); G5 alfombras de color y estandarte enorme; G6 pocas figuras separadas por manípulo.
- Bajar a pie: B1 cambia campo, luz, botones y reglas. Batalla rápida: R1 tercer aspecto.

## 4. Propuesta de objetivo final de las batallas en la 2.0 (para aprobar)
«Una batalla, dos alturas, un solo mundo», sobre lo que hay: (1) una sola forma de mandar (mismos botones y nombres, más una
orden propia por tropa); (2) un solo campo y una luz; (3) las mismas tropas, cada pueblo con su modelo; (4) un motor de golpes
a pie (CB3) para testudo, manípulo, falange y Ásculo; la batalla grande mantiene su simulador («De momento hay que mantener lo
que tenemos», 25/11) con los mismos números de tropa; (5) **nada atraviesa nada**, regla fija con prueba automática; (6) el
testudo como pieza de muestra; (7) vara: ficha de objetivo de 8–12 cosas, aspecto ≥ 8,5 y examen de jugabilidad por una
sesión que no construyó. Tandas: 1 testudo + nada atraviesa nada (F0) · 2 botones iguales + lanza y penacho · 3 un campo y una
luz · 4 Ásculo con la falange de verdad · 5 un motor de golpes a pie (+CB2b).
Para el modo supervivencia (después, aparte): lo que se acuerde aquí (campo, luz, botones, nada atraviesa nada) le sirve igual;
SUP1 dejó preguntas a los departamentos en `estudios/SUP1-diseno.md` §2b.

## 4b. Crítica honesta (pedida por el usuario el 25/11: «quiero una crítica muy honesta y brutal sobre el estado actual de las batallas»)
- **En una frase**: no es todavía un juego de batallas tipo Total War; es un prototipo con piezas buenas sueltas, cosidas a parches.
  «Son 4 juegos diferentes en un juego» (usuario, 18/11) sigue siendo verdad por dentro.
- **El problema de fondo es el método**: cada sesión mejora su escena y nadie mira el conjunto; se da por arreglado lo que no lo
  está (espejo, picas que atraviesan); los jueces dan APTO con fallos que se ven, porque miden que nada se rompa y no que se vea
  bien; el «jugando bien» de las pruebas es un bot que pulsa el botón que se ilumina («es pulsar botones», usuario, 20/11).
- **Notas de aspecto (opinión de EB1, sobre 10)**: batalla grande 3 · testudo 4 · falange 5 desde arriba y 3 de cerca ·
  Ásculo 3 · batalla rápida 2 · manípulo visto por el oficial 6 (lo mejor).
- **Lo que está bien**: una sola escena a pie, un motor de física y de proyectiles, soldados de un solo sitio, 0 errores, fluido
  en su móvil. Faltan aspecto y coherencia, no cimientos.
- **Lo más duro**: se ha gastado en hacer más cosas y poco en terminar una hasta parecerse a las referencias, contra la regla del
  usuario del 19/11 («construimos hasta que sea muy parecido a aquellas referencias»).

## 4c. Propuesta de método (para aprobar; esquema dibujado en la página, sección «Esquema»)
Hoy: cuatro islas (batalla grande, testudo y manípulo, falange, Ásculo), cada una con sus reglas, sus botones y su mundo; solo
comparten física, proyectiles y modelos. Cinco reglas para todas las sesiones de batalla: **a** nada nuevo hasta terminar lo
empezado; **b** «terminado» = se parece a las referencias (captura al lado y examen por una sesión que no construyó; el APTO no
basta); **c** pruebas que miran lo que se ve (nada atraviesa nada, etiquetas que no se pisan, botones con el mismo nombre);
**d** lo que se arregla en una escena se arregla en todas; **e** la nota del usuario (≥ 8,5) cierra la tanda. Vuelta de cada
tanda: ficha → construir en todas → pruebas que miran → examen → nota del usuario (si no llega, vuelve a construir).
Tandas con sus notas: 1 (F0 T1 T2 T3 T5 T7) · 2 (G3 M4 F1 F2 M5 A5) · 3 (G1 G2 G5 G6 B1) · 4 (A1 A2 A3 A4 F6) · 5 motor de
golpes a pie. En espera: supervivencia, naval, batalla rápida (R1), escenas o rivales nuevos.

## 5. Decisiones del usuario (literal)
(pendiente)

