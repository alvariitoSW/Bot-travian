# MIN1 · Dónde se va el tiempo y el gasto del gobierno (medición, 23/11/2026)

Fuentes: 259 partes (`gobierno/partes/`, 11/11 a 20/11), `BITACORA.md`, `VIGIA.md` §5, `gobierno/jueces.mjs` y `git log`.
Método: búsquedas y guiones sobre las líneas **Jueces**, **Cuentas**, **Decide el usuario** y **Archivos** de los partes.
Ojo: el `git log` de este equipo es parcial (copia corta): solo 190 commits, del 18/11 23:09 al 23/11.
«Medido» = sale tal cual de los textos. «Estimado» = cuenta mía sobre datos medidos.

| Qué | Cifra | Base | Confianza |
|---|---|---|---|
| 1. Esperar al usuario | 127 de 259 partes (49 %) acaban con algo que decide él. 449 entradas de decisiones en la bitácora. 10 paradas por corte de gasto que esperaron su «sí» (19–20/11). Cuando consta, responde en minutos u horas: 60 de 68 respuestas, el mismo día | Partes y bitácora (medido). El tiempo de respuesta es un cruce automático de tarea y fecha | Media. Los días, sí. Las horas, solo en unos pocos casos |
| 2. Choques de archivos | 31 commits de unión en 4,6 días (24 «Merge» y 7 «Une la rama»). 7 partes con conflictos. Marcas de conflicto subidas al menos 3 veces. `sw.js` lo tocan 75 tareas; `js/ui.js`, 48 | `git log` y línea **Archivos** (medido) | Alta en lo contado. El total de conflictos no consta |
| 3. Pasadas de jueces | De ≈7 min (12/11) a ≈59 min de mediana (18–20/11). 51 pasadas con duración: 35,8 h medidas. Unas 176 pasadas en total y ≈24 repetidas. Total estimado: 55–80 h | 51 partes con segundos o minutos (medido). El resto, estimado por día | Media |
| 4. Reinstalar herramientas | No consta en ningún parte que se reinstale algo en cada sesión. Red bloqueada en 7 partes (fuentes de historia y web publicada, error 403). Blender nunca se instaló | Búsqueda de Blender, MakeHuman, Quaternius, Playwright, ffmpeg, «instal», proxy (medido) | Alta: el problema no aparece |

## 1. Esperar decisiones del usuario
- **Partes**: 127 piden algo al usuario, 96 dicen «nada» y 36 no traen la línea.
- **Bitácora**: 449 entradas fechadas en «Decisiones»; 81 citan su frase literal o su respuesta.
  Por día: 16/11, 76; 17/11, 108; 18/11, 60; 19/11, 68.
- **Respuesta**: de 127 preguntas, 68 tienen respuesta localizable. 60 llegaron el mismo día; 8, de 1 a 8 días después. Las otras 59 no dejan rastro.
  Casos con hora: GM43i, parada a las 18:25 y respuesta «A» a las 18:30 (20/11). CI1b, propuesta el 18/11 a las 20:20 y «sí» al día siguiente a las 09:30 (≈13 h).
  Al revés también pasa: un pedido suyo esperó 3 h 41 min al vigía (19/11, de 08:34 a 12:15). La ciudad ×5 la llevaba «pidiendo 2 días».
- **Sesiones paradas esperando su «sí»** (19–20/11): GM43i, 3 veces; CI1b+CI3a, 3; CE3, 3; GM44d, 1. Mientras, el trabajo quedaba en commits locales sin subir.
- **Despertar sesiones**: cuesta 0,2–0,3 M cada vez (VIGIA §5, medido el 19/11). No consta cuántas veces se hizo.
  Estimado: con las 10 paradas y sus prórrogas, entre 2 y 3 M.

## 2. Choques de archivos entre sesiones
- **git**: 31 commits de unión entre el 18/11 y el 23/11, de 190 (16 %). El historial anterior no está en esta copia.
- **Conflictos en los partes**: 7 (A5a, union, H12-H14, CN17, E5, J3 y Q4b; este último con 21 conflictos). En la bitácora: MN1 se pasó del corte por un conflicto en `sw.js`; CE3, 2 conflictos al unir CE6.
- **Marcas `<<<<<<<` subidas**: J3 (13/11), otra en un parte de cierre arreglada minutos después, y la bitácora.
  La bitácora tiene 2 bloques sin resolver (líneas 26 y 531) desde la unión `e5105e4` de UR1 (20/11, 22:41). **Están también en `origin/…bx9oq2`**.
  En el árbol de trabajo de hoy ya están quitadas, pero sin commit.
- **Caché**: llega a v141 en 10 días. 23 de las 90 versiones que citan los partes las citan dos o más tareas (posibles pisadas; estimado).
- **Colas por archivo**: «ambas tocan `js/ui.js`», por ejemplo CG2 tras MN2. Aparece en 18 entradas de la bitácora.
- **Los 10 archivos más disputados** (tareas distintas que lo nombran en **Archivos**, de 226 partes):

| Archivo | Tareas | Archivo | Tareas |
|---|---|---|---|
| `sw.js` | 75 | `css/style.css` | 27 |
| `js/ui.js` | 48 | `gobierno/jueces.mjs` | 24 |
| `test/sim.test.js` | 34 | `js/data.js` | 23 |
| `index.html` | 29 | `gobierno/cuadro.json` | 16 |
| `js/game.js` | 28 | `js/gfx/city3d.js` / `js/registro.js` | 13 / 13 |

`js/ui-guerra.js` sale en 9 tareas y `js/simulador.js` en 2. Tablero y bitácora los tocan casi todas, pero solo 10 y 11 tareas los apuntan.

## 3. Pasadas de jueces
- **Duración medida** (mediana por día): 12/11, 425 s; 16/11, 1436 s; 17/11, 1968 s; 18/11, 3532 s; 19/11, 3567 s.
  Máximo: 4800 s (CI1, 18/11). 21 de las 51 pasadas medidas pasan de 50 min. CLAUDE.md dice 15–20 min: hoy es falso; VIGIA dice 45–75, y acierta.
- **Por qué tarda**: en V10a (17/11), `sim.test.js` tardó 17,6 min, `investigador` 9,4 y `ajustes` ≈14. Son ≈41 min de bots de campaña antes de abrir el navegador.
- **Cuántas**: 152 partes traen una pasada completa. Además hubo ≈24 repetidas (15 partes dicen «dos, tres o cuatro pasadas»). NO APTO aparece en 23 partes.
  Casos: CG6, cuatro pasadas de una hora; UR1, CI1b, C9, C10 y GM29, tres cada una.
- **Gasto**: 10 partes lo cifran. El director esperando o repitiendo jueces: 3,4 M dichos con cifra exacta (I5 0,8; CN22 0,66; CN9c 0,42; GM31 0,51; CG4 ≈1). Hasta ≈12 M si se cuentan los que dicen «sobre todo esperas» (GM5 4,24; CG6 1,61; TP1 1,4…).
- **Las 43 comprobaciones** (`jueces.mjs`): 17 de lógica sin pantalla y 26 en el navegador. Por área:
  **batalla 13**, **ciudad, economía y Senado 13**, **mapa y campaña 8** (bots incluidos), **generales 9** (carga, sin red, Códice, menú, consola).

## 4. Reinstalar herramientas
- No consta ninguna reinstalación por sesión. Playwright sale en 8 partes, siempre para usarlo, nunca para instalarlo. ffmpeg, en ninguno.
- Blender: nunca instalado; RD3 y RD4 esperan a un ordenador del usuario. MakeHuman y Quaternius se bajaron una vez (GM44); son 8,4 MB en el repositorio.
- **Red bloqueada** (403 del proxy): H1, H2, H12-H14, CN15a, GM17, RD2 y C9. Afecta a Perseus, LacusCurtius, Livius, Wikisource, archive.org y a la web publicada.
  Coste: citas «vistas solo en resumen» y nada comprobado en la web publicada. No consta en tiempo ni en M.

## Al final: declarado frente a gastado
- **160 partes dan las dos cifras**: 208,0 M declarados y 314,2 M gastados. Cociente **1,51**; mediana por tarea, 1,33.
  111 se pasaron y 39 gastaron el doble o más. Las peores, según la bitácora: CE3, 9,71 M frente a 2,0, y CI1b+CI3a, 13,6 M frente a 1,0.
- **Las 3 causas mayores** (en las 86 tareas que se pasaron más de un 25 %, contando qué dice su línea **Cuentas**):
  1. **Encargos de constructor demasiado grandes** (≥30 pasos, «partir en dos»): 33 tareas.
  2. **Esperar y repetir pasadas de jueces**: 18 tareas.
  3. **Conversación larga que se relee en cada paso** (contexto): 13 tareas. Le siguen las capturas y el render por software (10) y unir ramas (4).
