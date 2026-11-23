# FA3 · Dedos y pantalla limpia de la falange (diseño, 23/11/2026)

Sirve a L17. Amplía `FA0-plan-falange.md` §2 y §3 (FA3), `TP9-0` §2.7–2.8 y `TP9-objetivo` §4. Solo la maqueta
`gobierno/maquetas/falange/`: `dedos.js` (nuevo), `hud.js`, `index.html` y en `escena.js` la conexión de entrada.

## 1. Zonas (sin botones de golpe)
- **Horizontal (844×390)**: mitad derecha = pulgar derecho (gestos). Abajo a la izquierda = cinco rayas de filas.
- **Vertical (390×844)**: lo mismo en el 55 % de abajo. Arriba no se recogen gestos.
- Arriba al centro, el **estandarte** (único botón de mando, ≥ 48 px). A la izquierda, «Salir».
- Dos **huellas** tenues (círculos sin letra) donde caen los pulgares, con una pista de 3 s al empezar
  («Filas» · «Toca · desliza · arrastra») que luego se borra.

## 2. Cada gesto (pulgar derecho)
| Gesto | Cómo se reconoce | Puente de hoy (`acciones.js`) | Con FA4 (contrato) |
|---|---|---|---|
| **Tocar** | menos de 14 px y de 300 ms; se decide al soltar | Antes del choque: «¡Adelante!» (`orden('avanzar')` si está parado). En el choque: `golpe()` (estocada a una, al compás) | `S.pulso`: el muro empuja medio metro |
| **Deslizar hacia delante** (arriba) | sube ≥ 40 px en menos de 400 ms, más alto que ancho; salta al cruzar el umbral, sin esperar a soltar | Tu sarisa clava sola: se ve (`yo.tG`, el marcado recula). Sin dado: la regla llega con FA1/FA4 | `S.yo.tEstocada` |
| **Arrastrar a un lado** | ≥ 28 px de lado, más ancho que alto; sigue mientras se mantiene; zona muerta de 18 px para cambiar de lado | `S.giro` gira a 8°/s (tope ±60°). Si arrastras **hacia el flanco anunciado**: `orden('aguantar')` (las filas de atrás giran y cierran) y se suelta sola al pasar | `S.giro` mueve muro, picas y cámara |

Pulgar izquierdo: **tocar una raya** = `S.filas[i]` cambia (bajada/alzada). Pasar el dedo por varias las cambia todas al
mismo estado. Puente de hoy: el muro obedece a la **mayoría** (3 o más bajadas = `S.picas` abajo). Con FA4, cada fila la suya.

**Estandarte** → se abre el abanico (cuatro órdenes en arco, tiempo a un tercio); se elige una y se cierra; tocar fuera cierra.
| Orden | Puente de hoy |
|---|---|
| Aguantar | `orden('aguantar')` si no lo está |
| Empujad | en el choque `orden('empujad')`; antes, echa a andar |
| Cerrar filas | hoy es la misma orden que Aguantar (remata al colado). FA4 la separa |
| Retroceder | deja de andar o de empujar (`S.retrocede = true` para FA4). Hoy no cede terreno |

## 3. Qué se ve
- **Arriba**: Salir · una línea de objetivo (situación, nunca «pulsa tal botón») con la barra fina de cohesión y el
  terreno · estandarte con la orden vigente en pequeño. Las líneas «Falange…/Romanos…» dejan de verse (siguen en el DOM).
- **Compás**: la huella derecha es un aro que se cierra y se enciende verde en el «¡Ha!» (solo en el choque). No es
  botón: vale tocar en toda la mitad derecha. FA4 lo pasa al muro (las puntas se recogen).
- **Rayas**: cinco trazos apilados (arriba = primera fila). Bajada: trazo dorado largo con punta. Alzada: trazo corto y pálido.
- **Giro**: mientras arrastras, un arco pequeño sobre el pulgar con los grados.
- **Flanco**: el **borde** de ese lado se enciende en rojo con tres cuñas que laten, más fuerte según se acaba el tiempo. Sin cartel ni flecha grande.
- **Respuestas**: la cinta, más pequeña, bajo el estandarte.

## 4. Cómo se mide (`captura-fa3.mjs`, Playwright con toque emulado, 844×390)
1. No hay ningún `.boton` visible en ninguna fase; solo `#salir`, `#estandarte` y, abierto, el abanico.
2. Toque en la derecha antes del choque → `S.andando`. Toque en el latido → `golpes.buenos` sube; fuera → `parados` sube.
3. Deslizar arriba → `puente.lee().estocadas` sube y `golpes` no cambia.
4. Arrastrar 1 s a la derecha → `S.giro` ≈ 8° (±3); con flanco por ese lado → `S.orden === 'aguantar'`.
5. Tocar la raya 3 → `S.filas[2]` cambia; pasar por las cinco → `S.picas` cambia.
6. Estandarte → abanico visible → «Empujad» → `S.orden === 'empujar'` y abanico cerrado.
7. Partida entera **solo con los dedos** (un bot dentro de la página que llama al puente, no a `acciones`): gana la falange.
8. Toques ≥ 44 px, nada fuera de pantalla, sin errores de consola.

## 5. Guion de fotos (`gobierno/capturas-tarea/FA3-*.jpg`)
`FA3-h-marcha` (pista de los pulgares) · `FA3-h-choque` (aro del compás, sin botones) · `FA3-h-abanico` · `FA3-h-flanco`
(borde rojo) · `FA3-h-giro` (arco de grados) · `FA3-h-filas` (dos alzadas, tres bajadas) · `FA3-v-choque` (390×844).

## 6. Historia
Órdenes del oficial desde la primera fila y filas que bajan o alzan: histórico (Asclepiódoto 2; Polibio 18.29–30).
Gestos, compás a toques y abanico de órdenes: licencia de juego.
