# R9 · Cohesión e impacto (Field of Glory II, 2017)

Estudio de ingeniería reversa. Solo cómo se comporta el juego; ningún código, arte ni texto suyo.

## 1. Pregunta
¿Cómo pasa una unidad de firme a huida por escalones, qué chequeos la empujan, cómo se separan el choque de impacto y la melé, y qué cambia el terreno según el tipo de tropa?

## 2. Observación
1. Hay escalones de cohesión. Los nombrados en las fuentes: Disrupted, Fragmented, Routed; arriba, Steady. Fuente: [foro Slitherine](https://forum.slitherine.com/viewtopic.php?p=858740). Umbrales exactos y efectos de cada uno: sin confirmar.
2. Se reagrupa al inicio del turno propio con una tirada. Citan 40 % por turno para desordenadas y fragmentadas y 20 % para las que huyen; con un general cerca, siempre se tira. Pasar sube un escalón. Una huyendo perseguida, o con más de 10 % de bajas por disparos, no puede tirar. [Foro](https://forum.slitherine.com/viewtopic.php?p=865483). Cifras de foro, sin confirmar en el manual.
3. En la melé, primero se resuelve el combate y luego los chequeos posteriores. Si hay varios motivos de chequeo, se aplican todos. Orden respecto a la tirada de muerte: las fuentes se contradicen ([foro](https://forum.slitherine.com/viewtopic.php?p=792560)).
4. Ver huir a vecinos: no hay regla confirmada; un jugador pide un +1 como sugerencia ([foro](https://forum.slitherine.com/viewtopic.php?p=858740)). Sin confirmar.
5. Impacto: la infantería de choque pega fuerte al primer contacto. Las picas son vulnerables al impacto pero suelen ganar a la larga; los romanos fueron la «infantería de impacto» que funcionó contra ellas, normalmente con terreno u otro factor que desordenaba la formación ([foro](https://forum.slitherine.com/viewtopic.php?p=773505)).
6. Terreno: la infantería pesada resiste más que la media pero sufre más en terreno malo; la firme repele caballería en abierto, no si está desordenada ([Magic Game World](https://magicgameworld.com/?p=11634)). Tabla exacta: sin confirmar.

## 3. Por qué funciona
Una unidad no pasa de «bien» a «huye» de golpe: se degrada, y el jugador tiene tiempo de reaccionar. El impacto premia elegir el momento de la carga; la melé premia la resistencia.

## 4. Traducción a AQVILA
- **Tres escalones**: firme, desordenado, en fuga (el cuarto, «fragmentado», sobra en móvil). Se calcula desde `mor` y `fat` de `js/battle.js`: no hace falta otro número, solo umbrales.
- **Impacto / melé**: la primera mitad de la ronda de ejecución es el choque (carga, jabalinas a quemarropa) y la segunda, la melé larga. El impacto puede dar un escalón de golpe; la melé, desgaste. Se ve en `js/gfx/battle3d.js` como destello y empuje al contacto.
- **Terreno**: colina y bosque ya existen. Propuesta: caballería y pesada pierden impacto en bosque; ligeros no.
- **Pantalla 844×390**: el escalón se lee en el estandarte (borde entero, partido, bajado). Sin barras.
- **Maqueta**: tres escalones con tirada al inicio de la ronda.

## 5. Historia (280–146 a.C.)
- **Histórico (por cotejar)**: Pidna 168, la falange se rompe sobre terreno desigual y la legión entra por los huecos (Polibio XVIII 28-32; Livio XLIV 41). Cinoscéfalos 197, igual (Polibio XVIII 25-26).
- **Licencia de juego**: porcentajes, escalones, bono de impacto, tabla de terreno.

## 6. Coste y riesgo
1,0–1,5 M, más si se reequilibra el bot. Riesgo: el reagrupar con tirada da resultados poco repetibles; mejor con regla fija y semilla.

## 7. Versión mínima
Tres escalones visibles y un golpe de impacto en el primer contacto.
