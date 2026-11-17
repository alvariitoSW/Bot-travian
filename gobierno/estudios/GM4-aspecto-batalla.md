# GM4 · Aspecto de la batalla grande (16/11/2026)

**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/guerra-arte/
Es la maqueta GM1 con el dibujo mejorado. Mismas reglas y botones (`reglas.js` y `formacion.js` idénticos byte a byte).
Maqueta aparte: no cambia el juego. Compárala con la de antes: `.../gobierno/maquetas/guerra-grande/`.

## Qué cambia a la vista
1. **Soldados sin aristas, de cerca.** Las superficies se redondean (normales suavizadas; los cantos vivos de verdad se
   quedan), la luz envuelve en vez de cortar, hay un filo de contraluz y la textura se filtra mejor en ángulo.
2. **Cartón y figura casan.** La foto del cartón se hace ahora con el sol del campo (antes, con una luz pegada a la
   cámara), con el mismo material, el mismo tamaño y los pies en el suelo. El cambio es hombre a hombre, en una franja de 35 cm.
3. **Cada hombre da su sombra.** Dos triángulos más por hombre, tumbados en el suelo, con la silueta del propio soldado
   vista desde el sol. Sigue igual bajo las figuras completas, así que no hay salto. Solo en los cuerpos a menos de unos
   80 m de la cámara; más lejos queda la sombra del bloque.
4. **La masa no es una alfombra.** Cada hombre varía en brillo (±12 %), tono de la ropa, estatura (±4 %) y un leve ladeo,
   igual en cartón y en figura. El bando se sigue leyendo: rojo Roma, morado el enemigo.
5. **Campo.** Sol más bajo y cálido; tierra pisada donde se marcha y se lucha; polvo que se lleva el viento en el choque,
   la marcha y la huida; los caídos duran 140 s (antes 45) y hay hasta 420 por tropa (antes 140), y se funden en vez de encogerse.
6. **Estandartes propios** (hechos desde cero, licencia del proyecto): vexillum romano con paño que ondea y remate dorado;
   banderola enemiga de cola de golondrina con creciente de bronce.

Capturas antes y después: `gobierno/capturas-tarea/GM4-antes-*.jpg` y `GM4-5000-*.jpg`, `GM4-despues-primer-plano.jpg`.

## Medidas (antes → después)
Con `captura.mjs`, a 390×844 y `dpr=1`. Aquí no hay tarjeta gráfica: los milisegundos solo comparan; el ruido es de ±15 %.

| Por bando | Triángulos de lejos | Triángulos de cerca | ms de lejos | ms de cerca | Memoria de cartones |
|---|---|---|---|---|---|
| 1 000 | 92 627 → 99 657 | 571 865 → 576 791 | 235 → 307 | 685 → 881 | 31 → 29,7 MB |
| 5 000 | 106 995 → 112 849 | 574 399 → 592 845 | 365 → 432 | 733 → 922 | 31 → 29,7 MB |
| 10 000 | 128 075 → 133 179 | 594 353 → 629 605 | 532 → 569 | 838 → 1 175 | 31 → 29,7 MB |

- **Dentro de `arte.json`**: lejos ≤ 150 000, cerca ≤ 650 000 (a 10 000 quedan solo 20 000 de margen), 220 figuras,
  cartones ≤ 32 MB, descarga nueva 0. Llamadas de dibujo: 55 a 62, como antes.
- **Cuesta más pintar**: de lejos entre un 7 y un 30 % más; de cerca entre un 26 y un 40 % más. Tu móvil iba a 50–60 con
  10 000; **hay que volver a mirarlo**. Si de cerca baja de 40, lo primero que se recorta es la sombra por hombre y el contraluz.
- La memoria baja poco (se quitaron sobras de las celdas). Dieciséis ángulos por cartón la doblarían: descartado.

## Descartado, y por qué
- Transición con tramado (puntos): dejaba motas oscuras; el corte hombre a hombre no se nota.
- Suavizado del atlas entero (MSAA): tumbaba el navegador a 10 000. Ahora cada celda se pinta al doble y se reduce.
- Sombra por hombre en todo el campo: a 10 000 pasaba el tope de triángulos de lejos (171 000).

## Cómo se une con GM7 y GM8
Todo el dibujo nuevo está en **un archivo**, `guerra-arte/arte.js`. En `vista.js` solo hay diez enganches de una línea,
marcados `/* GM4 */`. Para ponerlo sobre `guerra-lejos/` (o la que venga): copiar `arte.js` y añadir esas líneas.
1. `import * as A from './arte.js';`
2. `const luces = A.luces;`
3. Primera línea de `atlasDe`: `return A.atlasDe(renderer, tipo, lado, MONTADO, COLOR);`
4. Primera línea de `carton`: `{ const o = A.carton(escena, at, lado, propios, caido, COMUN, COLOR, VS); if (o) return o; }`
5. En `caidosDe`: `cap = 420` y `uVida: 140`.
6. Final de `mover`: `A.paso(dt, T, B, todos, estand);`
7. En `detalle`, tras fijar la pose: `A.figura(m, slot, q.id);`
8. Final de `campo()`: `A.campo({ escena, camara, COMUN, COLOR, figM, polvo, sombras, suelo, zona });`
9. En `__gc.estado`: `cartonesMB: A.memoriaMB()`.
10. Solo pruebas: `window.__camLibre` en `camaraMeta`.

Ojo al unir: `arte.js` lleva su copia del sombreador del cartón. Si GM7 añade poses o estados (escudo alzado, testudo,
tirar), hay que añadirlos también ahí; si no reconoce el sombreador, el enganche 4 vuelve solo al cartón antiguo.
Los proyectiles de GM7 no los toca.

## Qué llevar al juego (`js/gfx/units.js`) cuando toque GM5
Normales suavizadas, mipmaps y anisotropía de la textura, luz envolvente y contraluz, la foto del cartón con la luz del
mundo, y la variación por hombre.

## Lo que no hace
- Las figuras de cerca siguen sin animación de muerte propia (cae un cartón).
- De lejos no hay sombra por hombre, solo la del bloque.
- No se añadió arte descargado (ni modelos ni texturas nuevas): todo sale del arte de 0 A.D. que ya había y de código.
- Sin revisor ni vuelta de arreglos: el gasto se pasó y se paró (ver el parte). Los caídos de cerca no se han mirado a ojo.

## Historia (dictamen: APTO CON NOTAS)
- El **vexillum** (paño cuadrado rojo colgado de un travesaño) es romano y de época; el paño exacto de un manípulo
  republicano no se conoce (Polibio 6.24 habla de dos portaestandartes por manípulo, sin describir la enseña).
- **Licencia de juego**: la enseña enemiga (banderola con creciente) es inventada para que se distinga de lejos; el
  creciente es un motivo púnico conocido, pero no hay enseña cartaginesa documentada así. Fuentes citadas de memoria.

## Lo que decide el usuario tras probarla
1. ¿Se ve mejor? (A) sí, así; (B) sí, pero quiero más (di qué: soldados, sombras, polvo, suelo, estandartes); (C) no.
2. Dime las imágenes por segundo que marca tu móvil con 10 000, de lejos y de cerca.
3. Si quieres soldados todavía más finos, el siguiente paso es arte nuevo (modelos con más detalle o texturas mejores),
   que sube la descarga: (A) no subir el peso; (B) estudiar cuánto subiría.
