# Cadena de la batalla mejorada (GM11 a GM17) · aprobada por el usuario el 16/11/2026

Decisiones: `estudios/GM6b-sintesis-criticas.md` y, en `BITACORA.md`, «Mejora final de las batallas: nueve respuestas».
Regla de oro: **nunca dos sesiones sobre los mismos archivos**. Van de una en una, en este orden, y cada una abre la
siguiente al cerrar con jueces en APTO (o, si son solo documentos, con su prueba en APTO).

| Orden | Tarea | Qué toca | Modelo | Se abre cuando |
|---|---|---|---|---|
| 0 | GM8 y GM9 (sesión ya abierta) | `maquetas/guerra-lejos/` | Sonnet | Está en marcha |
| 1 | **GM11** motor único | nueva `maquetas/guerra-unica/` (copia de `guerra-lejos/` tal como estaba el 16/11 a las 20:50, con GM7 solo) | Sonnet | **Abierta ya (16/11)**, sin esperar a GM8 y GM9 |
| 1b | **GM11b** integrar lo de GM8 y GM9 | `guerra-unica/` | Sonnet | Cierra GM11 **y** GM8/GM9 |
| 2 | **GM12** el porqué a la vista y la nota | `guerra-unica/` | Sonnet | Cierra GM11b |
| 3 | **GM13** sin respuesta correcta | `guerra-unica/` | Sonnet | Cierra GM12 |
| 4 | **GM14** la huida mata y perseguir | `guerra-unica/` | Sonnet | Cierra GM13 |
| 5 | **GM15** maqueta de terreno y maniobra | `guerra-unica/` | Sonnet (Fable si el diseño lo pide) | Cierra GM14, y existe `estudios/GM15-terreno-y-maniobra.md` con la elección del usuario |
| 6 | **GM17** escenario de Heraclea | `guerra-unica/` | Sonnet | Cierra GM15, y existe `historia/heraclea-280.md` |
| aparte | **GM16** el después en la campaña | `js/game.js`, guardado | Sonnet | Cierra GM5 (batalla en el juego) y GM12 |

Hechas aparte el 16/11, sin código: el estudio de GM17 (`historia/heraclea-280.md`) y el diseño de GM15.

## Lo que lleva cada encargo (copiar al abrir la sesión)
Siempre, al abrir con `create_session`: `source_url` = `repo` de `cuadro.json`, `source_revision` y `outcome_branch` = `rama`.
Texto común: «Empieza como manda CLAUDE.md §7 (skill plan-socialista). Di el presupuesto antes. Lee tu tarea en
TABLERO.md, la decisión correspondiente de `estudios/GM6b-sintesis-criticas.md` (§6.2) y la fila de este archivo.
Otras sesiones trabajan a la vez: no toques sus carpetas (mira `sesiones` en `cuadro.json`). Tope duro de pasos al
constructor y encargos de una pieza (GM6 se pasó +172 %). No se equilibra con bots lo que el usuario no ha jugado.
Cierre normal: jueces, capturas, tablero, bitácora, parte, cuadro, commit y push. Si necesitas una decisión, pregunta
con opciones. Al cerrar, abre la sesión siguiente de esta cadena.»

- **GM11 · Motor único.** Crea `maquetas/guerra-unica/` copiando `guerra-lejos/` tal como está al abrir la sesión. **No toques `guerra-lejos/`**: la sesión de GM8 y GM9 trabaja ahí. **No traigas todavía la caballería ni los elefantes** (los reescribe GM9: se integran en GM11b); deja la caballería y los jinetes enemigos de GM7 como están y los elefantes fuera. Trae de
  `maquetas/guerra-cuerpo/reglas.js` (GM2 y GM6): armas, formaciones, flancos, hueco, caballería enemiga, elefantes,
  falange, ánimo de la legión y juicio de cada orden; y el relevo visible de `maquetas/guerra-relevo/`. **Tres encargos
  seguidos y no uno**: (a) armas y formaciones; (b) flancos, hueco y ánimo; (c) aspecto y relevo. Una sola prueba que
  pase las de GM2, GM6, GM7 y GM9, y una captura a 390×844 y 844×390. No se toca `js/`.
- **GM11b · Integrar GM8 y GM9.** Cuando GM11 y GM8/GM9 hayan cerrado: trae a `guerra-unica/` lo que GM9 cambió en `guerra-lejos/` (jinetes que rodean, duelo de jinetes, elefantes que imponen, flanqueo natural) más los elefantes y la falange de GM2; una sola prueba. Pequeña a media (0,6 M). Abre GM12 al cerrar.
- **GM12 · El porqué y la nota.** Línea bajo cada botón con lo que da y cuesta ahora; al final tres frases de por qué y
  nota bronce, plata u oro; la pausa deja leer; los avisos no se van mientras haya peligro. Con los datos que ya guarda
  el motor (`mando`, juicios, ánimo, eventos). 0,8 M.
- **GM13 · Sin respuesta correcta.** 2 a 3 planes por rival, anunciados; un suceso grande por batalla; dos maneras de
  ganar (alas o centro); bien jugado se gana el 75 a 85 %, no el 100 % (el usuario quiere poder perder jugando bien,
  15 a 25 %). No más temblor de azar: no sirve, se anula. 1,0 M.
- **GM14 · La huida mata y perseguir.** El cuerpo roto sufre bajas mientras huye; tras romper, el botón Caballería pasa
  a «Perseguir» o «Reagrupar» (lo manda el jugador); si se pasa, deja el flanco al aire; tope de 20 a 30 s; cámara que
  sigue a los jinetes. 0,6 M.
- **GM15 · Maqueta de terreno y maniobra.** Sigue el diseño que el usuario elija en `estudios/GM15-terreno-y-maniobra.md`.
  Si el usuario no ha elegido variante, **no abrir**: preguntar. Versión mínima primero (0,8 M).
- **GM17 · Escenario de Heraclea.** Sobre `guerra-unica/`, con la ficha `historia/heraclea-280.md`: fuerzas reales,
  terreno del Siris, aliados con aspecto propio, «Códice» de tres frases. Dictamen histórico en el parte. 1,5 M.
- **GM16 · El después.** Veteranía, prestigio ante el Senado y botín según la nota; una retirada en orden cuenta.
  Toca `js/game.js` y el guardado: migrar en `G.load`. No abrir a la vez que otra sesión que toque `js/ui.js` o `js/game.js`.
