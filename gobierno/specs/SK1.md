# Especificación · SK1 Mezclar spec-kit con el plan socialista

<!-- Primera especificación con la plantilla gobierno/plantillas/especificacion.md (la tarea se prueba a sí misma). -->

**Estado**: en obra
**Sirve a**: OBJETIVOS, «Reglas para converger» (lista corta, pocas preguntas, delegar bien); PLAN-2.0 §0 «Cómo convergemos»
**Área**: gobierno
**Rama**: sk1-metodo
**Creada**: 27/11/2026

## Qué verá el jugador
Nada en el juego. El usuario verá en el parte un método de una tabla y una lista de lo que hoy no cuadra entre lo que
él decidió y lo que hay que hacer. Desde la próxima tarea (si dice «sí»), cada sesión empieza con una especificación.

## Decisiones del usuario
- **D1** (27/11): sobre spec-kit, «Lo probamos mezclar con nuestra forma de trabajo? Una opción a pero algo más mezclado».
- **D2** (27/11, por el vigía): la opción A era no instalar spec-kit y meter un repaso de coherencia antes de construir y repetir hasta converger.
- **D3** (23/11, normas): las reglas las decide el usuario; `CLAUDE.md` §7 no se cambia sin su «sí».

## Criterios de aceptación
- **CA1** (de D1): tabla del método, paso a paso, spec-kit al lado de lo nuestro · Se comprueba: `gobierno/METODO.md` existe y tiene la tabla
- **CA2** (de D1): plantilla de especificación · Se comprueba: `gobierno/plantillas/especificacion.md` y esta spec la usa
- **CA3** (de D2): «analizar» barato que cruza bitácora, planes y specs con el tablero · Se comprueba: `node gobierno/analizar.mjs` en menos de 5 s
- **CA4** (de D2): probado sobre lo de hoy (plan 2.0, POLITEIA, EB1, tablero, bitácora) · Se comprueba: informe en `gobierno/partes/2026-11-27-SK1-analizar.md`
- **CA5** (de D1): plan socialista y LEEME siguen especificar → aclarar → plan → analizar → construir → converger · Se comprueba: lectura de los dos archivos
- **CA6** (de D3): pregunta (A)/(B) en el parte; `CLAUDE.md` sin tocar · Se comprueba: `git diff CLAUDE.md` vacío

## Fuera de esta tarea
Instalar `specify-cli`; tocar tablero, bitácora, `lista.json`, `camino.json`, `cuadro.json` o el juego; arreglar lo que encuentre «analizar» (es del vigía).

## Por aclarar
- P: ¿instalar spec-kit? → R: no, mezclar (D1, 27/11).

## Plan y presupuesto
| Pieza | Quién | Modelo | M decl. (esperable) |
|---|---|---|---|
| Leer spec-kit | agente de lectura | haiku | 0,2 |
| Método, plantilla, analizar, skill, parte | directora sola | opus | 1,3 (2) |

## Tareas
| Tarea | Qué se ve al acabar | Cumple | Tamaño |
|---|---|---|---|
| SK1 | Método, plantilla, analizar y parte con la pregunta | CA1 CA2 CA3 CA4 CA5 CA6 (D1 D2 D3) | pequeña |

## Convergencia
**Tope: 3 M** · aviso al usuario al pasar el tope o con 3 vueltas sin subir la nota.
| Vuelta | M gastados | CA cumplidos | Qué falta |
|---|---|---|---|
| 1 | 1,5 | 6/6 | el «sí» del usuario al método |

## Referencias
- spec-kit: README y `templates/commands/{analyze,clarify,converge}.md` (MIT).
- `gobierno/partes/2026-11-25-PN3.md`, `2026-11-25-PN3e.md`, `BT1` (rama `bt1-lo-comun`).
