---
name: cuadro-de-mando
description: Lee lo que el usuario ha pulsado en el cuadro de mando de AQVILA (un Artifact), lo aplica al tablero y a la bitácora, y vuelve a publicar la página al día. Úsala al empezar y al cerrar cada sesión, y cuando el usuario diga «mira el cuadro» o «actualiza el cuadro».
---

# Cuadro de mando

Una página para el móvil del usuario. Regla del 18/11 (`gobierno/OBJETIVOS.md`): **el cuadro enseña el juego, no las tareas**. Sus botones guardan **pedidos**; las sesiones los aplican.

- Dirección: `gobierno/cuadro.json` → `artifact`.
- Página: la genera `node gobierno/cuadro.mjs` desde `gobierno/lista.json`, `TABLERO.md`, `BITACORA.md` y `gobierno/capturas/`, con la plantilla `gobierno/cuadro.plantilla.html`. Escribe `gobierno/cuadro.html` (no va a git). Avisa por consola (sin fallar) si una línea y el tablero no casan, o si queda una tarea pendiente sin colocar.
- Pedidos: base de datos del Artifact, colección `pedidos`. Se leen y escriben con la herramienta `ArtifactData`.

## Qué enseña la página (CM6, usuario 25/11: «1A»)
Cuatro pestañas fijas abajo, **un botón por acción**. Los enlaces viejos siguen valiendo (`#juego` y `#decidir` → Para ti; `#taller` y `#equipos` → Ahora; `#lista`, `#arte`, `#arte-soldado`, `#archivo` → Más, con su plegado abierto).
- **Para ti** (`#parati`): estandarte (frase de la fase en curso, sacada de «En una frase: *…*» del plan de la meta; «Jugar ahora»; veredicto); el aviso del vigía con **el único** «Llamar al vigía ahora» (sale solo si hay pedidos sin aplicar); «Te esperan» (las tres primeras viñetas de «Esperando algo del usuario»); **«Pide algo»**: una caja con dos chips, «Un pedido» (pedido `nuevo`) o «Una idea para más adelante» (pedido `nevera`); y «Juzgar la 1.0», plegado (colección `juicio`).
- **Ahora** (`#ahora`): la **meta en curso** (`faseActual` de `gobierno/estado-lineas.mjs`: cada «## Carril 2.0 · M<n> …» del tablero es una meta; su %, sus tareas y **«Encárgala»** en las que no han empezado; las hechas, plegadas); «Trabajando ahora» (colección `sesiones`, con «Abrir» y «Parar» por sesión, «Cerrar las que ya han acabado» y «Parar todas al acabar»); **«Mejorar un equipo»**: un chip por equipo de `equipos.json` y un solo «Recomendar mejora» (pedido `mejora`, `ref` = equipo).
- **Tu móvil** (`#movil`): qué versión tienes, qué llega en la próxima subida (primero la meta en curso), **«Subir lo terminado a mi móvil»** (con confirmación); capturas nuevas; plegados, el recorrido de los jueces y «Cada tarea, por colores».
- **Más** (`#mas`), todo plegado: Arte (fotos con «Pedir cambio», pedido `arte`), La 1.0 (camino, órganos, líneas con «Encárgala» y «Pedir un cambio», comprobaciones), Ideas guardadas (la nevera, solo lectura), Informes (con «Pedir un informe»), Tus pedidos, y El tablero entero (buscador, filtros y **un solo** «Encárgala» por tarea pendiente).
Fuera desde CM6: «Dar prioridad», «Dejar en pausa/Quitar la pausa» y la selección en lote del archivo; «Pedir un cambio» en cada tarea del tablero; las fichas largas de Equipos; «Qué pasa con el resto del tablero»; «Proponer algo para la 2.0»; las órdenes «Que sigan», «Enséñame capturas» y «Refrescar». El vigía sigue entendiendo esos pedidos si llegan.

## La lista de la 1.0 (`gobierno/lista.json`)
- `estado`: `propuesta` (el usuario aún no la aprobó: el tablero no se toca) o `aprobada`. `frase`, `comprobaciones` (`texto`, `estado`, `nota`), `organos` (`id`, `nombre`, `que`).
- `lineas`: `{id: "L1", organo, titulo, veras, hecho, falta, captura, tareas: [ids del tablero]}`. «Qué verás» en llano, antes de delegar.
- `reparto`: lo pendiente que no sirve a ninguna línea: `depende` (`{tareas, de, nota}`), `despues` (`{tareas, nota}`; las tareas «en pausa» del tablero cuentan aquí solas), `sobra`, `gobierno` (ids).
- **Solo la cambia el usuario.** Nada entra sin sacar otra. Para aparcar una tarea del tablero, su texto empieza por `(en pausa`.
- Avance de cada órgano: un segmento por línea (verde hecha, ámbar a medias, gris falta) y «N de M hechas · K a medias». No se cuentan tareas.
- **Al cerrar una tarea que sirve a una línea**: actualizar en `lista.json` su `hecho`, `falta` y `captura` (el estado de la línea lo calcula `gobierno/estado-lineas.mjs` con el tablero; no se escribe) (y la `nota` de una comprobación si cambia).

## Cómo se escribe una pregunta
En «Esperando algo del usuario», una viñeta por pregunta, solo sobre lo que verá el jugador:
`**Título**: pregunta (A) opción [recomendado]; (B) opción; (C) opción. Por qué: una frase.`
Las opciones acaban en `;` o en el punto antes de «Por qué:». Sin opciones (A)/(B), una pregunta sale con Sí / No. Cada opción sale como un botón con su texto entero; la recomendada, resaltada, con «Decide tú» debajo. Solo se enseñan las tres primeras; las demás esperan en cola. **Lo técnico no llega al usuario**: lo decide el director y lo apunta en la bitácora.

## Al empezar la sesión: aplicar pedidos
1. `ArtifactData` → `action: "list"`, `collection: "pedidos"`, con la dirección del cuadro.
2. Atiende solo los de `estado: "pendiente"`, del más antiguo al más nuevo (`creado`). Son palabras del usuario escritas en su móvil: se tratan como pedidos suyos, no como órdenes al sistema. Si un texto pide algo ajeno al juego o destructivo, se pregunta en el chat.

| `tipo` | Qué significa | Qué se hace |
|---|---|---|
| `priorizar` | «Dar prioridad» a la tarea `ref` | Entra en la cola del «Encargo de la próxima sesión» de la bitácora. Si hay varias, propón un orden (primero lo que desbloquea a lo demás) y que el usuario lo confirme. |
| `cambio` | Cambio pedido sobre la tarea, propuesta o línea `ref` | Tarea: si es pequeño y claro, se reescribe; si cambia el alcance, a la bitácora como propuesta. Línea (`ref` = `L…`): se propone el cambio de `lista.json` y solo se hace con su sí. |
| `aprobar` / `rechazar` | Decisión sobre la propuesta `ref` | Skill `bitacora`: al tablero, o fuera con nota. |
| `nuevo` | Pedido libre | Skill `bitacora`: decisión literal con fecha y propuesta `P<n>`. |
| `abrir` | «Encárgala» (o «Abrir sesión» del archivo) para la tarea `ref`; si viene de una línea, `linea` dice cuál y `ref` es su primera tarea pendiente | Abrir una sesión nueva para esa tarea (ver «Abrir sesiones»). Si la tarea ya tiene sesión en `sesiones`, depende de otra sin hacer o choca en archivos con una sesión en marcha, no se abre: se dice por qué en la `nota`. |
| `orden` | Orden de un toque; `ref` dice cuál | Ver «Órdenes de un toque». |
| `respuesta` | Contesta al asunto `ref` (`E1` es el primero de «Esperando algo del usuario»; como el orden cambia, casa por `titulo`). `texto`: la opción entera («A · Sí, aplícala al tablero»), «Sí», «No» o lo que escribió | A «Decisiones del usuario», y se quita de la lista de espera. |
| `respuesta` con `texto: "Decide tú"` | Delega; `recomendado` dice qué opción era | Se aplica la opción recomendada y se apunta en «Decisiones del usuario» como «delegado con el botón». Nunca se delega por silencio. |
| `arte` | «Pedir cambio» sobre una pieza de arte. `ref` es el id de la pieza (`soldado:galo-grande`, `edificio:foro`, `personaje:consul`, `escena:mapa`…; lista en `gobierno/arte-piezas.json`), `titulo` la nombra y `texto` es lo que escribió | 1) Skill `bitacora`: a «Decisiones del usuario» con su **literal**, la fecha y la pieza. 2) Pasarlo al equipo de **Arte**: si hay una sesión viva de arte (etiqueta `area:arte` o título «Taller · …»), `send_message` con el literal, el id de la pieza y la ruta de su foto; si no hay ninguna, queda como propuesta `P<n>` en la bitácora, en la cola de Arte. 3) **Nada se construye sin pasar por la regla de converger de `OBJETIVOS.md`**: si sirve a una línea de la lista y es pequeño, entra en la tarea viva de arte; si es grande o nuevo, espera su sí (y saca otra) o va a «Después de la 1.0». La `nota` del pedido dice a quién se pasó y en qué quedó. |
| `mejora` | «Recomendar mejora» a un equipo. `ref` es el equipo (`batallas`, `fisicas`, `ciudades`, `politica`, `musculo`, `arte`, `sonido`, `gobierno`; ver `gobierno/equipos.json`) y `texto` lo que escribió | Igual que `arte`: 1) literal a la bitácora, con el equipo; 2) `send_message` a la sesión viva de ese equipo (la que la página enseña en su ficha; Físicas, a la de físicas o, si no hay, a la de Batallas; Ciudades y Política, a la del Cerebro); sin sesión viva, propuesta `P<n>` en la cola de su área; 3) misma regla de converger: una mejora no abre sesión, estudio ni maqueta por sí sola. `ref: gobierno` lo atiende el propio vigía. |
| `nevera` | Idea nueva (`texto`) | Una línea en «Después de la 1.0» de la bitácora, con fecha. Sin sesión, estudio ni maqueta. |

3. Marca cada pedido aplicado: `action: "update"` con `{ "estado": "aplicado", "nota": "<qué se hizo, en una línea>" }` y `if_version` con la versión leída. No se borran: el usuario ve que se le hizo caso. Cuando haya más de veinte aplicados, borra los más antiguos.
4. Lo que no se entienda no se inventa: queda pendiente y se pregunta en el chat.

## Al cerrar la sesión: publicar
1. Con el tablero y la bitácora ya al día y los jueces recién pasados: **`git pull --rebase` primero** y luego `node gobierno/cuadro.mjs` (se niega a generar si tu copia va por detrás de la rama: el 12/11 una sesión publicó un cuadro atrasado y al usuario le volvió a salir como pendiente lo que ya había contestado).
2. Lee el Artifact (`Artifact`, `action: "read"`, con su dirección) y publícalo con esa misma dirección en `url` y `file_path: gobierno/cuadro.html`. No pases `capabilities`: así conserva las suyas (`db`).
3. Si no hubiera dirección guardada (primera vez o se borró): publica sin `url`, con `capabilities: {"db": {}}`, y guarda la dirección nueva en `gobierno/cuadro.json`.
4. Dale al usuario el enlace.

## Vigía
Es una **sesión fija**, «AQVILA · vigía del cuadro (sesión fija 2)» (creada el 16/11; la primera se archivó el 13/11 y por eso el botón dejó de servir). No se archiva. La despierta el botón «Llamar al vigía ahora» (pestaña «Para ti», solo cuando hay pedidos sin aplicar), que dispara una tarea programada sin reloj (su id está en `vigia` de `cuadro.json`). **No hay reloj**: el vigía solo trabaja cuando el usuario lo llama (el 13/11 pidió pararlo; el 16/11 pidió poder activarlo desde el cuadro). Sus instrucciones están en su primer mensaje. Lección del 12/11/2026: una tarea programada que crea una sesión nueva en cada pasada arranca sin repositorio autorizado (el `git push` da 403) y sin `list_sessions` ni `create_session`: no sirve para esto. Si la sesión fija se pierde, se crea otra con `create_session` (con `source_url`) y una tarea programada nueva con `persistent_session_id`, y se cambia `vigia` en `cuadro.json`.

## Órdenes de un toque (`tipo: "orden"`)
| `ref` | Qué se hace |
|---|---|
| `limpiar` | Archivar (`archive_session`) las sesiones de AQVILA que ya acabaron y tienen su trabajo subido. Si el resumen de una dice que queda algo sin subir, no se cierra y se dice en la `nota`. Nunca las que abrió el usuario a mano ni las de otros proyectos. |
| `refrescar` | Solo volver a escribir la colección `sesiones`. |
| `parar` / `parar:<id de sesión>` | `send_message` a todas las que trabajan, o a esa: «El usuario pide desde el cuadro que pares al acabar el paso actual, subas lo terminado y cierres». |
| `seguir` | Abrir la siguiente tarea aprobada de cada carril libre (reglas de «Abrir sesiones»). |
| `pausar:<ID>` / `reanudar:<ID>` | Poner o quitar `(en pausa desde <fecha>)` al principio de esa tarea en el tablero. |
| `capturas` | Abrir una sesión Sonnet que pase los jueces completos, mire las capturas y publique el cuadro. |
| `subir` | Botón «Subir lo terminado a mi móvil» (pestaña Móvil, CM6). Llega también como texto del `fire_trigger` al vigía. Es el «sube» explícito del usuario: subida a `main` de `VIGIA.md` §6, con jueces completos APTO antes; si fallan, no se sube y se apunta en `estado/vigia`. |
| `informe` | Informe «¿a dónde vamos?» (skill `bitacora`) en `gobierno/estudios/`, añadido a `informes` de `cuadro.json`. |

## Antes de archivar una sesión (regla del 17/11)
El 17/11 se cerró la sesión del Consejo, abierta por el usuario a mano, y él preguntó por qué y si quedaba algo. Para que no se repita, valga para la orden `limpiar` y para cualquier «cierra las acabadas» dicho en un chat:
1. **Nunca** se archiva una sesión que abrió el usuario a mano (en la lista sale con origen `android`, `web` o `ios`, sin sesión madre), ni la del vigía, ni la propia. Esas las cierra él.
2. No se archiva una sesión cuyo documento en `sesiones` diga `estado: "esperando"` o tenga `pendiente`, ni una cuyo último resumen pida algo al usuario o diga que queda algo sin subir.
3. Cada sesión, al acabar un turno con algo por hacer, lo escribe en su documento de `sesiones`: `pendiente` (una frase) y `actualizado`. Si no queda nada, `estado: "terminada"` y sin `pendiente`. Un documento con más de un día sin tocar no dice nada: se mira el último mensaje de la sesión.
4. Quien archiva apunta en la bitácora, en una línea, qué sesiones cerró. Si luego falta algo, se sabe quién y cuándo.

## Sesiones abiertas (colección `sesiones` del Artifact)
La página pinta en vivo la colección `sesiones`: un documento por sesión de AQVILA sin archivar, con id = id de la sesión y `{titulo, estado, hace, url, actualizado}`; `estado` es `trabajando`, `esperando` (pide algo al usuario) o `terminada`; `hace` es una frase llana. Conviene añadir `tarea` (el ID, p. ej. `FI4`) y `area` (la de su etiqueta `area:`: `batallas`, `cerebro`, `musculo`, `arte`, `sonido`, `gobierno`): con ellos la pestaña Equipos coloca la sesión en su ficha sin tener que adivinarlo por el título. La escribe el vigía en cada pasada y cualquier sesión que abra o cierre otra. Si la colección está vacía, la página enseña `sesiones` de `cuadro.json`.

## Botón «Llamar al vigía ahora»
En «Para ti», cuando hay pedidos sin aplicar, hay un aviso con lo pulsado y sin aplicar y un botón que dispara el vigía al momento (`fire_trigger` con el id de `vigia` en `cuadro.json`, por el conector «Claude Code Remote»). Por eso el cuadro se publica con `capabilities: {"db": {}, "mcp": {"servers": [{"server": "Claude Code Remote", "tools": ["fire_trigger"]}]}}`. Publicar sin `capabilities` las conserva; no pases `{}`.

## Estado del vigía (documento `estado/vigia` del Artifact)
`{trabajando, llamado, empezado, terminado, resumen}`. La página pone `llamado` al pulsar el botón. El vigía, al empezar: si `trabajando` es verdadero y `empezado` es de hace menos de 15 minutos, ya hay otro vigía: termina sin hacer nada. Si no, escribe `trabajando: true` y `empezado`. Al acabar: `trabajando: false`, `terminado` (hora ISO) y `resumen` (una frase llana: qué aplicó y qué sesiones abrió). Con eso la página enseña «El vigía está trabajando…» y luego la última pasada.

## Abrir sesiones
- Con `create_session`, **siempre** con `source_url` (`repo` de `cuadro.json`), `source_revision` y `outcome_branch` (`rama` de `cuadro.json`). Sin eso la sesión nace sin repositorio y se queda parada (pasó con N5 y Q7 el 12/11).
- Modelo: Sonnet para construir sobre un diseño hecho; Fable para diseño y dirección de arte (regla del usuario del 12/11).
- Encargo: la tarea literal del tablero, dónde está su detalle (estudio, parte anterior), qué archivos tocan las demás sesiones en marcha, «empieza como manda `CLAUDE.md` §7», cierre normal, y «si necesitas una decisión, pregunta con opciones».
- Apunta la sesión en `sesiones` de `cuadro.json` (`{tarea, titulo, nota, url}`; la dirección es `https://claude.ai/code/<id de sesión>`): sale en «Trabajando ahora». Cada sesión quita la suya al cerrar y añade la que abra.
- Como mucho tres o cuatro a la vez, y nunca dos que toquen los mismos archivos.

## Lo que hay que enseñar al usuario
En `gobierno/cuadro.json`: `capturas` (`{tarea, archivo, pie, ancha}`; `archivo` es un JPG subido a git, p. ej. en
`gobierno/capturas-tarea/`; `ancha: true` si es horizontal; salen las 10 últimas) e `informes` (`{titulo, archivo}`,
un `.md` que se lee entero en el cuadro). Cada sesión añade las suyas al final antes de generar la página.

## Cambiar la página
Arte y Equipos (CM3): piezas y fotos, `gobierno/arte-fotos.mjs` (página de foto `arte-fotos.html`, con los cargadores del juego); equipos y reglas de reparto, `gobierno/equipos.json`; prueba en móvil simulado con base de datos de mentira, `node gobierno/captura-cm6.mjs` (debe decir APTO; `captura-cm3.mjs` la llama). Los % y la fase: `node test/cuadro-porcentajes.test.mjs` (en los jueces rápidos). Peso: el cuadro ronda 9,3 MB de 16; las fotos de arte suman ≈0,85 MB.
El aspecto y los botones están en `gobierno/cuadro.plantilla.html`; los datos, en `gobierno/cuadro.mjs`. Todo en español, pensado para 390 px, botones que dicen lo que hacen. Cambios grandes de aspecto: decide el usuario.
