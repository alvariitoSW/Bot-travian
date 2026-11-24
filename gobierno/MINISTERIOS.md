# Ministerios por área (en vigor desde el 23/11/2026)

Pedido del usuario: reorganizar el gobierno en ministerios para quitar cuellos de botella. Es su excepción a «nada
nuevo hasta la 1.0». **Decidido por él el 23/11**: mapa **A**; las reglas valen para **todas** las sesiones desde hoy;
sin tope de gasto para montarlo, pero midiendo. El código del juego no se ha tocado.

| Área | Guía (skill) | Juez de área (medido el 23/11) | Entorno |
|---|---|---|---|
| **Corazón · Batallas**, con su taller | `ministerio-batallas` | lógica 48 s + navegador 12 min (`juez-guerra`) + 5,5 min (sus pasos de `jueces.mjs`, MIN4) | «AQVILA Batallas taller» |
| **Cerebro** (ramas Ciudades y Política) | `ministerio-cerebro` | lógica 63 s + navegador 2 min (MIN4): **3,6 min en total** | el de siempre |
| **Músculo** (mapa, menús, manejo, fluidez) | `ministerio-musculo` | lógica 10 s + navegador 8 min (MIN4, con la batalla de preparación) | el de siempre |
| **Taller de Arte** común | `arte` | `arte.mjs` y `fichas.mjs`, segundos | «AQVILA Batallas taller» |
| **Taller de Sonido** (director de sonido, 23/11) | `sonido` (+ `sonido-efectos`, `sonido-musica`) | `juez-sonido.mjs`, 3 s | «AQVILA Batallas taller» (OpenGameArt abierto) |

## 1. Lo medido antes de cambiar nada
Página entera: `estudios/MIN1-medicion.md`. Resumen:

| Dónde se va | Cifra (259 partes, 11 a 20/11) | Lectura |
|---|---|---|
| Jueces | Una pasada completa: de ≈7 min (12/11) a **≈59 min** de mediana (18–20/11), máximo 80. 35,8 h medidas en 51 pasadas; estimado **55–80 h** en unas 176, ≈24 repetidas. Unos 41 min son bots de campaña, antes de abrir el navegador | **El cuello mayor en tiempo.** De 43 comprobaciones, 13 son de batalla, 13 de ciudad y Senado, 8 de mapa y 9 generales: una tarea paga las de todos |
| Choques de archivos | `sw.js` lo tocan **75 tareas**; `js/ui.js`, 48. 31 uniones de ramas en 4,6 días; marcas de conflicto subidas al menos 3 veces (la bitácora las llevaba hoy, también en la rama del juego) | **El cuello mayor entre sesiones.** Son archivos comunes, no de un área |
| Esperar al usuario | 127 partes (49 %) acaban con algo que decide él. Cuando consta, **responde el mismo día** (60 de 68). Lo caro: 10 paradas por corte de gasto esperando su «sí» | Él no es lento. Lo que cuesta es **parar** a preguntar y despertar la sesión después |
| Reinstalar herramientas | **No consta** como problema en ningún parte. Sí pesa la red bloqueada (7 partes). Blender no se había instalado nunca antes del 20/11 | El taller en la nube es para lo que viene (arte propio), no un ahorro medido |
| Gasto | Declarado 208 M, gastado **314 M** (×1,51) en 160 tareas. Causas: encargos de constructor grandes (33 tareas), repetir jueces (18), conversación larga (13) | Los ministerios no arreglan la primera causa; la arregla el encargo corto, que ya es regla |

**Qué dice la medición del pedido**: los ministerios ayudan en dos de los cuatro puntos (jueces y choques). Las esperas
se arreglan con el despacho diario, no con más ministerios. Y más ministerios que cruzan archivos empeorarían los choques.

## 2. El mapa de áreas: el usuario eligió A (23/11)
| | (A) Tres áreas y un taller **[recomendado]** | (B) Sus cinco ministerios |
|---|---|---|
| Áreas | **Cerebro** (ciudad, recursos, clases, Senado, comercio) · **Corazón** (batallas) · **Músculo** (mapa, menús, manejo, fluidez) · **taller de Arte** común | **Batallas** · **Ciudades** · **Política** · **Arte Visual** (ciudades, tropas, mapas, menús y ajustes) · **Jugabilidad** (batalla, política, ciudad) |
| Sesiones a la vez sin pisarse | 3 + el taller | 5 sobre el papel; en la práctica 3 |
| Encaja con lo aprobado | Son los tres órganos de `OBJETIVOS.md` y del cuadro: no hay que rehacer nada | Hay que repartir de nuevo la lista de la 1.0 y la portada del cuadro |
| Dónde chocaría | Poco: cada archivo tiene un solo dueño (`areas.json`) | Mucho: **Jugabilidad y Arte Visual cruzan a los otros tres**. Una batalla sería de Batallas, de Jugabilidad·batalla y de Arte·tropas: tres dueños para `js/ui-mando.js` |
| Decisiones para el usuario | Una cola por área (3) | Una cola por ministerio y rama (hasta 11) |

**Por qué A.** El cuello de botella medido son los archivos compartidos y las esperas, no la falta de ministerios. B
reparte por *oficio* (arte, jugabilidad) además de por *zona del juego*, y eso obliga a que dos o tres ministerios
toquen el mismo archivo: más pases, no menos. A reparte solo por zona del juego. Lo que B quiere proteger se conserva
dentro de A así:
- **Ciudades y Política** son dos **ramas del Cerebro** (comparten `js/game.js` y `js/data.js`; separarlas del todo las haría esperarse).
- **Arte Visual**: cada área lleva el arte de lo suyo (Batallas: tropas; Cerebro: ciudades; Músculo: mapas, menús y
  ajustes) y el **taller de Arte común** guarda las reglas, las licencias, el presupuesto y las herramientas.
- **Jugabilidad** no es un ministerio sino un **examen** que pasa cada área antes de cerrar: «¿se entiende y divierte
  en el móvil?», con capturas a 390 px. Lo pasa el `verificador`, que no ha construido.

Si elige B, la tabla de dueños se rehace con una regla añadida: en cada archivo manda la zona (Batallas, Ciudades,
Política) y Arte Visual y Jugabilidad trabajan **por encargo** de ella, nunca por su cuenta.

## 3. El primero que se montó: Batallas con su taller de arte
- **Guía**: skill `ministerio-batallas` (`.claude/skills/ministerio-batallas/SKILL.md`): objetivo final, archivos
  propios y vetados, cómo prueba y a quién pasa qué.
- **Archivos**: `gobierno/areas.json` → `batallas`. 13 archivos de código, 3 de estilos, 6 pruebas, su juez de navegador,
  sus maquetas y, en el taller, `assets/soldados/`, `assets/units/`, `assets/sonido/` y `tools/blender/`.
- **Juez propio**: `node gobierno/juez-area.mjs batallas`.
- **Entorno en la nube**: guion `gobierno/entornos/batallas-taller.sh` y guía `batallas-taller.md`.

**El entorno, creado y aprobado el 23/11**: «AQVILA Batallas taller» (personal, `env_01CJEDdinXvGa5FE4zimPosh`; red: registros de
paquetes, `opengameart.org` y `patch.gg`). Las sesiones de batalla se abren en él. Al arrancar deja en `/opt/aqvila-taller`:
| Qué | Cómo queda | Probado aquí |
|---|---|---|
| Blender sin pantalla | `bpy` 5.3.0; se usa con `blender-py guion.py` | Sí: rehízo el cuartel de UR2 (1 832 triángulos), horneó su textura y `glb_a_static.mjs` lo convirtió |
| Movimientos de Quaternius (CC0) | Bibliotecas 1 y 2, de OpenGameArt | Sí |
| Datos de MakeHuman (CC0) | Malla, esqueleto, pesos y 1 280 deformadores | Sí: `construir.py hastatus` saca los 1 033 triángulos de siempre |
Tarda 28 s y ocupa 1,3 GB. **No comprobado**: que corra igual al construir un contenedor nuevo (se probó a mano aquí); si
GitHub no responde en ese momento, faltará MakeHuman y lo dirá `/opt/aqvila-taller/LEEME.txt`.

**Patch (el Blender en la nube de patch.gg) no va en el guion, y no puede ir**: pide entrar con la cuenta del usuario o
una clave secreta, y gasta créditos (≈0,83 por minuto; 1 crédito = 0,01 $). El Blender instalado hace lo mismo que
se usó de Patch el 20/11 (modelar por código, hornear, exportar, render con Cycles) sin cuenta ni gasto. Patch queda
como opción: su red está permitida y basta con que el usuario entre con su cuenta en la sesión que lo necesite.

**Material de la sesión «Ciudad generada por IA»** (rama `ccr-eda89860-50oj5c`, sin unir): `tools/glb_a_static.mjs`,
`tools/blender/cuartel_build.py` y, ya guardada allí (commit `f6f292d`), la prueba del pilum `tools/blender/pilum_tiro.py`
con sus vídeos `capturas-tarea/PIL-*`. Son del taller de Batallas; se unen cuando el usuario apruebe UR2 o la primera tarea del taller.

**Cómo se sabrá si funciona** (cuenta MIN2 del tablero, la lleva el vigía): en las cinco próximas tareas, comparar con
el §1 los minutos de jueces por tarea, los archivos vetados tocados, los conflictos al unir, las paradas esperando al
usuario y el gasto frente a lo declarado.

**Límites conocidos**: (1) Desde MIN4 (23/11) cada área pasa sus pasos de pantalla con `jueces.mjs --area <área>`
(lo llama `juez-area.mjs`; capturas en `gobierno/capturas-area/<área>/`, fuera de git). Cada paso dice de qué área es y a
cuál prepara: Músculo pasa la batalla del recorrido como preparación porque «Recargar sin red» la necesita. Reparto de los
24 pasos: 5 de Cerebro, 10 de Músculo, 7 de Batallas y 2 comunes. Los jueces completos siguen dando las mismas 43. (2) Casi toda la economía y los menús viven en archivos comunes
(`js/game.js`, `js/data.js`, `js/ui.js`): ahí sigue habiendo una sola sesión a la vez; el reparto no lo arregla, lo ordena.

## 4. Reglas contra cuellos de botella
**R1 · Cada archivo tiene un dueño.** Tabla: `gobierno/areas.json`. Portero: `node gobierno/juez-area.mjs <área> --archivos`
antes de cada commit. Cuatro clases:
| Clase | Quién lo toca | Ejemplos |
|---|---|---|
| Propio de un área | Solo las sesiones de esa área | `js/guerra.js` (Batallas), `js/gfx/city3d.js` (Cerebro), `js/gfx/map3d.js` (Músculo) |
| **Común** | Una sola sesión a la vez, la que el vigía nombre «de paso» | `js/ui.js`, `js/game.js`, `js/data.js`, `js/registro.js`, `sw.js`, `index.html` |
| Solo el vigía | El vigía | `BITACORA.md`, `TABLERO.md`, `lista.json`, `cuadro.json` |
| Libre | Cualquiera, solo archivos nuevos con su ID | `partes/`, `capturas-tarea/`, `estudios/` |

Un área que necesita algo de un común lo escribe en su parte como **pase**, con el trozo exacto, y sigue. La sesión
«de paso» aplica todos los pases del día de una vez. La versión de caché de `sw.js` la sube **solo** la sesión de subida.

**R2 · Decisiones del usuario, una vez al día.** Ninguna sesión para a preguntar. Elige lo recomendado, sigue y deja
la pregunta en su parte. El vigía junta las de todas las áreas en **un despacho al día** en el cuadro: como mucho tres
preguntas a la vista (regla de `OBJETIVOS.md`), cada una con su recomendación y su botón **«decide tú»**. Lo que el
usuario no conteste ese día **no bloquea**: se queda lo recomendado, apuntado como provisional, y él puede cambiarlo
después. Excepciones que sí paran: algo irreversible, quitar cosas del juego, o pasar del gasto aprobado.

**R3 · Jueces por área.** Cada tarea cierra con el juez de su área (`juez-area.mjs`), no con los 43 pasos completos.
Los jueces completos se pasan **una vez por subida a `main`**, en la sesión de subida, con todas las áreas unidas.
Medido el 23/11 para Batallas: lógica 48 s y navegador 12 min (APTO): **≈13 min frente a ≈59** de los completos.

**R4 · Ideas aparte.** Una idea nueva es una línea «Idea:» en el parte, o lo que el usuario diga en el chat. El vigía
la copia a la nevera de la bitácora («Después de la 1.0») con su área. **Solo el vigía la convierte en tarea**, y solo
con el sí del usuario y sacando otra. Ninguna sesión de área abre estudio, maqueta ni tarea por una idea.

**R5 · Herramientas puestas, no reinstaladas.** Cada área con taller tiene su entorno en la nube con guion de
instalación guardado en `gobierno/entornos/`. Si falta algo, se arregla el guion, no la sesión.

## 4b. El Taller de Sonido (pedido del usuario, 23/11)
Literal: «Quiero un director de sonido para todo el proyecto con sus habilidades». Como el taller de Arte: guarda las
reglas, la mezcla, las licencias, el presupuesto de audio (`arte.json` → `sonido`, **provisional**) y los archivos de audio
(`assets/sonido/`, `assets/musica/`, `tools/sonido*`, el futuro `js/gfx/musica.js`). Los dos archivos de código que ya suenan
siguen con su área (`js/gfx/sonido.js` en Batallas, `js/gfx/sonido-ciudad.js` en Cerebro): el director les pasa la
**partitura** y ellos la montan, para que ningún archivo tenga dos dueños. Juez: `node gobierno/juez-sonido.mjs` (también
lo pasan Batallas y Cerebro si tocan arte). Aquí nada se oye: el juez mide y el usuario escucha en el móvil.

## 5. Lo que NO cambia
`OBJETIVOS.md` y la lista de la 1.0; «una sesión, una tarea»; el plan socialista (presupuesto, constructor, verificador,
revisor, parte); el usuario decide reglas, arquitectura, quitar cosas y aspecto grande; se sube a `main` solo con su «sube».
