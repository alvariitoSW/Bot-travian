# Método mezclado: plan socialista + spec-kit (PROPUESTA SK1, 27/11/2026)

**Sin aprobar.** Lo decide el usuario (pregunta en `partes/2026-11-27-SK1.md`). Hasta su «sí», `CLAUDE.md` §7 sigue igual.
Pedido (literal, 27/11): «Lo probamos mezclar con nuestra forma de trabajo? Una opción a pero algo más mezclado».
Ideas y textos tomados de **spec-kit** (github/spec-kit, licencia MIT): sus comandos `constitution`, `specify`, `clarify`,
`plan`, `tasks`, `analyze`, `implement` y `converge`. No se instala nada: son pasos de nuestro plan socialista con un archivo
y un comando nuevos.

## Por qué
Lo que falló en las últimas sesiones, y el paso que lo habría parado:
| Qué pasó | Dónde | Paso que lo para |
|---|---|---|
| «Solo victoria por conquista» se dijo en el chat, no se apuntó y no llegó al juego hasta que el usuario lo repitió enfadado | bitácora 25/11 ~18:00, PN3b | **Especificar**: las decisiones se copian literales (D1…) y cada una necesita su criterio y su tarea |
| Sesiones cerradas «a medias» que el tablero marca ✅ (AM2, J20b, PN3c con 8,4) | tablero | **Analizar**: tablero ≠ parte y «bajo la vara» salen como ALTO |
| Gasto ×2 o ×3 sin parar (ES20 +220 %, AM2 8,3 M sobre 2,5, BT1 61 M) | tablero, partes | **Converger con tope**: al pasar el tope se para y se pregunta |
| Plan aprobado cuyas tareas no están en el tablero (POLITEIA: PO1–PO5; PO1 ya era otra cosa) | rama `gp1-menus-politica` | **Analizar**: «plan sin tarea» es CRÍTICO |
| Las críticas de BT1 cambian el objetivo después de construir (61 M) | parte BT1 | **Aclarar** antes, con la ficha de objetivo delante |

## Los pasos
| # | spec-kit | Nuestro paso | Qué se hace | Archivo o comando | Quién |
|---|---|---|---|---|---|
| 0 | `constitution` | **Constitución** | Ya existe: no se toca por tarea | `CLAUDE.md` + `OBJETIVOS.md` + guía del ministerio | el usuario |
| 1 | `specify` | **Especificar** | Copiar la plantilla. Qué verá el jugador; decisiones LITERALES (D1…); criterios comprobables (CA1…), cada uno con «Se comprueba:»; lo que queda fuera | `gobierno/specs/<ID>.md` desde `gobierno/plantillas/especificacion.md` | director |
| 2 | `clarify` | **Aclarar** | Como mucho 3 dudas, cada una (A)/(B) con [recomendado] y «Por qué». Se preguntan ANTES de construir; la respuesta se escribe en la spec | sección «Por aclarar» | director → usuario |
| 3 | `plan` + `tasks` | **Plan** | Plan socialista §2–§3: tamaño, agentes, modelo, M. Tareas con ID, cada una con los CA que cumple. La ficha de aspecto (si la hay) va al verificador antes de construir | secciones «Plan y presupuesto» y «Tareas»; `gobierno/aspecto/<id>.md` | director |
| 4 | `analyze` | **Analizar** | Repaso automático, solo lectura, segundos. Falla (CRÍTICO) si una decisión o un criterio no tiene tarea, si quedan dudas en una spec aprobada o si se pasó el tope | `node gobierno/analizar.mjs --spec gobierno/specs/<ID>.md --estricto` | director |
| 5 | `implement` | **Construir** | Como hoy: constructor, revisor, verificador; juez de área | plan socialista §3 | agentes |
| 6 | `converge` | **Converger** | Tras cada vuelta: qué CA están ✔ y cuánto se gastó (una fila). Se repite construir → comprobar hasta 6/6. **Tope = presupuesto × 2**: al pasarlo, o con 3 vueltas sin subir la nota, se para y se pregunta (seguir, recortar o dejarlo) | sección «Convergencia»; `node gobierno/gasto.mjs` | director → usuario |
| 7 | — | **Cerrar** | Como hoy (jueces, parte). El parte copia la tabla de convergencia; «hecho» solo con todos los CA ✔ o el «Bien» del usuario por escrito | `gobierno/partes/` | director |

**El vigía** pasa `node gobierno/analizar.mjs <planes>` (sin `--spec`) en cada vuelta: cruza la bitácora (decisiones de los
últimos 3 días), los planes que le diga, los partes y todas las specs con el tablero, y arregla lo que salga. Es el mismo
juez para todos; nadie más escribe en tablero ni bitácora.

## Lo que NO cambia
Una sesión, una tarea. Ministerios y sus archivos. Juez de área al cerrar; jueces completos solo al subir. Director que
no construye. Preguntas (A)/(B). Gasto medido.

## Lo que se quita o se funde
- El criterio de hecho del plan socialista §1.5 pasa a ser «Qué verá el jugador» de la spec.
- La ficha de objetivo de aspecto (`gobierno/aspecto/`) sigue igual: un CA de la spec la cita («Se comprueba: juez-aspecto pn3-comarca»).
- El tope de 1,5 M del plan socialista §2.3 choca con «sin tope» (usuario 24/11): con el método, el tope es el de la convergencia (presupuesto × 2), y lo que se haga al pasarlo lo decide el usuario.

## Tamaño
Tarea pequeña: spec corta (Qué verá, D, 2–4 CA, una tarea). Estudios y conversaciones (EB1, GP1): la spec es su plan; sus
tareas con ID salen en la tabla «Tareas» y el vigía las mete en el tablero con su «sí».
