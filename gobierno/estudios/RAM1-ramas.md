# RAM1 — Repaso de las ramas antiguas (24/11/2026)

**Resumen para el usuario.** De las 42 ramas que hay en GitHub además de `main` y la rama del juego, 24 ya no
guardan nada que falte (7 ya están dentro y 17 son viejas o están superadas), 16 tienen trabajo de hoy y no se tocan,
y solo 2 guardan algo que merece rescatarse: los edificios 3D de termas, acueducto y anfiteatro (hechos el 11/11, que
nunca llegaron al juego) y el estudio de la batalla dentro de una ciudad. No se ha borrado nada; las etiquetas de
archivo están preparadas, pero esta sesión no tiene permiso para subirlas (ver «Etiquetas» al final).

## Cómo se ha mirado
- Por historia: `git log rama-del-juego..origin/<rama>` (casi todas «van por delante» porque la rama del juego se une
  con «ours + read-tree», que cambia los hashes; por eso esto solo no sirve).
- Por contenido: para cada archivo que la rama cambió, se busca si **esa misma versión** estuvo alguna vez en la
  historia de la rama del juego. Si estuvo, ya entró. Lo que nunca estuvo se mira a mano: si el juego lo hizo de otra
  forma después, es «superado»; si no, es «útil».
- Ramas sin antepasado común (las del 11–17/11) son de antes de rehacer la historia: se cotejan archivo por archivo.

## Tabla

| Rama | Último commit | Clase | Qué tiene | Qué hacer |
|---|---|---|---|---|
| `ccr-64c464d7-o4tgp0` | 12/11 | **Útil por rescatar** | E4: termas y acueducto dibujados desde cero y anfiteatro de 0 A.D. aligerado. El tablero da E4 por hecha, pero sus modelos nunca entraron: hoy la ciudad pinta las termas con el modelo del mercado y el acueducto con un arco. | Receta abajo (R1). |
| `ccr-3109a3a8-6hc0m0` | 17/11 | **Útil por rescatar** | Estudio P161 «Batalla dentro de la ciudad» (Esparta), cotejado con fuentes y con decisiones del usuario; la propuesta P161 sigue en la bitácora sin estudio. | Receta abajo (R2). El resto de la rama, superado. |
| `ccr-22c9de99-bqsyqf` | 23/11 | Ya dentro | FI2 (física del testudo) y MS1 (galo de Meshy); solo difieren tablero, bitácora y cuadro. | Archivar. |
| `ccr-a4ce3c98-oqkcpw` | 20/11 | Ya dentro | UR1 (ciudad sin sinsentidos), subida a `main` el 20/11; solo difiere la versión de caché. | Archivar. |
| `cd3b-ministros-ui` | 23/11 | Ya dentro | Ministros en la pantalla; nada le falta a la rama del juego. | Archivar. |
| `claude/cd4-plan-senado` | 23/11 | Ya dentro | Plan del Senado (CD4); nada falta. | Archivar. |
| `claude/cd0b-concurso-arte` | 23/11 | Ya dentro | Una línea del parte de CD0b (umbral del 80 %); la regla ya está en `js/necesidades.js` (`UMBRAL.cubierta = 0.8`). | Archivar. |
| `ce3` | 19/11 | Ya dentro | CE3 (economía nueva), subida a `main` el 19/11; solo versiones intermedias de `ui.js`/`style.css`. | Archivar. |
| `claude/gm43i-sonido` | 20/11 | Ya dentro | GM43i (sonido grabado del testudo), subida a `main` el 20/11. | Archivar. |
| `ccr-07cfa4be-35ag3l` | 11/11 | Descartable | Uniones de carriles y cuadro del 11/11 (historia vieja). | Archivar. |
| `ccr-214ebdb5-5o0xju` | 17/11 | Descartable | MR2a (menús en papiro) y reglas de cierre; superado por MN1–MN4. | Archivar. |
| `ccr-25b86489-lhdexe` | 17/11 | Descartable | EV7, GM4b/GM44a y papeles del 17/11; todo cerrado o rehecho después. | Archivar. |
| `ccr-32a2b8f1-a411vx` | 11/11 | Descartable | I1 (registro de piezas) y G3; I1 ya está (`js/registro.js`). | Archivar. |
| `ccr-ba981b2a-heh0fu` | 11/11 | Descartable | Uniones del 11/11; trae copia de E4 (se rescata desde `ccr-64c464d7`) y dos texturas de E2 que el juego resolvió de otro modo. | Archivar. |
| `ccr-d8bbfb6c-3pd4ub` | 12/11 | Descartable | C6 (mapa por escalones) y CN4; hechas. Trae copia de E4. | Archivar. |
| `ccr-eda89860-50oj5c` | 23/11 | Descartable | PIL2 (pilum) sin subir: se rehízo como PIL3 ✅. CV1/CV4a: subidas. Un cuartel de Blender de prueba (UR2), y UR2 la sustituyó el carril CD. Los dos estudios CV0 y CV-objetivo están también en `ccr-b0d546c7` (hoy). | Archivar. |
| `claude/c6-mapa-escalones` | 12/11 | Descartable | C6, I6, N7: hechas. Trae copia de E4. | Archivar. |
| `claude/charming-dijkstra-ixcg4m` | 17/11 | Descartable | GM43c/GM43d (concurso del testudo), cerrados; textos de carteles por IA ya sin uso. | Archivar. |
| `claude/concurso-arte-testudo-gm43d` | 18/11 | Descartable | GP1 en carpeta de prueba; GP1 se fundió en TP1. | Archivar. |
| `claude/cuadro-de-mando-x19ccw` | 13/11 | Descartable | Papeles y K11/K12 del 13/11; hechas. | Archivar. |
| `gob/historia` | 11/11 | Descartable | H1/H2 (auditoría y fichas de batalla); hechas y cotejadas después. | Archivar. |
| `gob/pensar` | 11/11 | Descartable | F1, E1, D3, E3 (estudios del 11/11); decididos. | Archivar. |
| `gob/reglas` | 11/11 | Descartable | B3, B4, B6, B8, B10 (reglas simples); hechas y superadas por la economía nueva. | Archivar. |
| `gob/visual` | 11/11 | Descartable | B9, D1, D2; hechas. | Archivar. |
| `subida-ciudad` | 23/11 | Descartable | Preparación de subida de la ciudad con PIL2; la ciudad se subió por otra vía, PIL2 → PIL3. | Archivar. |
| `subida-ciudad2` | 23/11 | Descartable | Subida de CV1/CV4a, AL3–AL8 y MIN4; todo dentro por otra unión. | Archivar. |
| `ccr-347da7e8-h1wbei` | 24/11 | En obra hoy | CB1/CB2: motor de lucha de cerca, poses y maquetas (37 archivos que faltan). La bitácora la deja como maqueta hasta la 1.0. | No tocar. |
| `ccr-85d92c05-p7hlfy` | 24/11 | En obra hoy | Nada le falta a la rama del juego. | No tocar (archivar mañana). |
| `ccr-b0d546c7-9uwkp2` | 24/11 | En obra hoy | Plano con los menús recogidos (`style.css`, `ui.js`, `sw.js`), pase a la sesión de subida; estudios CV0 y CV-objetivo y maquetas P190/P191 que nunca entraron. | No tocar. Cuando se suba, que lleve también esos dos estudios. |
| `ccr-debd3a84-qp341g` | 24/11 | En obra hoy | Papeles del vigía (P186, carril CR). | No tocar. |
| `ccr-ee9e87a2-wh0o23` | 24/11 | En obra hoy | MN4b/MN4c (iconos y láminas), CE12 en curso; ya viaja dentro de `cde4-enganche`. | No tocar. |
| `ccr-fd811fbb-te9a42` | 24/11 | En obra hoy | Papeles del vigía (LP4b, LP5a). | No tocar. |
| `cde3-pantalla` | 24/11 | En obra hoy | CDe3: pantalla mínima, mercado, novedades. | No tocar. |
| `cde4-enganche` | 24/11 | En obra hoy | CDe4: une CDe3, MN4c y AG1. | No tocar. |
| `claude/ag1-agricultura` | 24/11 | En obra hoy | AG1 (campos abiertos por la ciencia); ya viaja en `cde3-pantalla` y `cde4-enganche`. | No tocar. |
| `claude/cd1-ciudad-arriba` | 24/11 | En obra hoy | Respuestas del usuario en el parte de CD1. | No tocar. |
| `claude/cd5b-ciudad-viva` | 24/11 | En obra hoy | Nada le falta. | No tocar (archivar mañana). |
| `claude/ce4-mercado` | 24/11 | En obra hoy | Nada le falta. | No tocar (archivar mañana). |
| `claude/cr4-luz` | 24/11 | En obra hoy | Maqueta de luz CR4 (en la nevera hasta la 1.0). Queda contenida en `cr4b-tiempo`. | No tocar. |
| `claude/cr4b-tiempo` | 24/11 | En obra hoy | Maqueta de luz y tiempo CR4b (nevera hasta la 1.0). | No tocar. |
| `claude/fe3-elefantes` | 24/11 | En obra hoy | Respuestas del usuario en el parte de FE3. | No tocar. |
| `subida-md1` | 24/11 | En obra hoy | MD1 no se subió; sus reglas pasaron a CDe1/CDe2. | No tocar (casi seguro descartable mañana). |

**Cuenta:** 7 ya dentro · 17 descartables · 2 útiles · 16 en obra hoy = 42.

## Recetas de rescate (no unidas aquí)

**R1 — Termas, acueducto y anfiteatro en 3D** (línea **L1** «Una ciudad que construyes y ves crecer»; lo une el
**taller de Arte** con la rama **Ciudades** del Cerebro, porque toca `js/gfx/city3d.js`).
- Origen: commit `a26c1cc9` (E4, 11/11) en `origin/ccr-64c464d7-o4tgp0`.
- Archivos: `assets/static/termas.bin` (42 KB), `assets/static/acueducto.bin` (34 KB),
  `assets/static/anfiteatro.bin` (789 KB), `assets/static/structural_ao_rome_amphitheater_pompeii_ao.webp` (52 KB),
  sus entradas de `assets/static/static.json` y `assets/static/LICENSE.txt`, y las piezas de `tools/` que los hacen
  (`propio_static.mjs` y `aligerar_static.mjs` ya están en la rama del juego).
- Cómo: `git checkout a26c1cc9 -- assets/static/termas.bin assets/static/acueducto.bin assets/static/anfiteatro.bin assets/static/structural_ao_rome_amphitheater_pompeii_ao.webp`,
  y a mano: entradas en `static.json`, créditos en `LICENSE.txt`/README, ficha en `js/registro.js`, y cambiar en
  `js/gfx/city3d.js` (línea ≈252) `termas: ['mercado', …]` y `acueducto: ['arco', …]` por los modelos propios.
- Ojo: el arte va por 46,3 de 50 MB. Termas y acueducto caben de sobra (76 KB); el anfiteatro (≈0,8 MB) lo decide
  `node gobierno/arte.mjs`. En la ciudad nueva no hay anfiteatro como obra: puede quedarse fuera.

**R2 — Estudio P161 «Batalla dentro de la ciudad»** (después de la 1.0; línea **L10** como idea futura; lo guarda el
ministerio de **Batallas**).
- Origen: `origin/ccr-3109a3a8-6hc0m0`, commits `95761e74` y `15efae9a`.
- Archivo: `gobierno/estudios/P161-batalla-en-ciudad.md` (solo documento; nada de código).
- Cómo: `git checkout 15efae9a -- gobierno/estudios/P161-batalla-en-ciudad.md`. Como hay veda de estudios hasta la
  1.0, basta con guardarlo; la bitácora ya lo nombra.

## Etiquetas de archivo (preparadas, sin subir)
Esta sesión creó las 24 etiquetas `archivo/<rama>` en su copia, pero GitHub respondió **403** al subirlas: el permiso
de la sesión solo deja empujar a la rama del juego. No se ha intentado otra vía. Las puntas exactas, para crearlas
desde una sesión con permiso (`git tag archivo/<rama> <hash> && git push origin archivo/<rama>`):

| Etiqueta | Punta |
|---|---|
| `archivo/ccr-07cfa4be-35ag3l` | `4a9e074c03` |
| `archivo/ccr-214ebdb5-5o0xju` | `cab2a9fdbd` |
| `archivo/ccr-22c9de99-bqsyqf` | `9c102ff5e3` |
| `archivo/ccr-25b86489-lhdexe` | `11bf5956cf` |
| `archivo/ccr-32a2b8f1-a411vx` | `527388ca08` |
| `archivo/ccr-a4ce3c98-oqkcpw` | `8f496d65ab` |
| `archivo/ccr-ba981b2a-heh0fu` | `0e9e9f0f13` |
| `archivo/ccr-d8bbfb6c-3pd4ub` | `831e69f78b` |
| `archivo/ccr-eda89860-50oj5c` | `8ad5ae68ca` |
| `archivo/cd3b-ministros-ui` | `b27116ab3a` |
| `archivo/ce3` | `fe400eff90` |
| `archivo/claude/c6-mapa-escalones` | `53a6fc9b5b` |
| `archivo/claude/cd0b-concurso-arte` | `e56b260f13` |
| `archivo/claude/cd4-plan-senado` | `5a64208fc4` |
| `archivo/claude/charming-dijkstra-ixcg4m` | `47b4bf19b4` |
| `archivo/claude/concurso-arte-testudo-gm43d` | `e217a869da` |
| `archivo/claude/cuadro-de-mando-x19ccw` | `94abbe53f5` |
| `archivo/claude/gm43i-sonido` | `0d16a56264` |
| `archivo/gob/historia` | `05caa9a733` |
| `archivo/gob/pensar` | `29ae40c05d` |
| `archivo/gob/reglas` | `bc1a28055e` |
| `archivo/gob/visual` | `bd678a18f1` |
| `archivo/subida-ciudad` | `397ec74eaf` |
| `archivo/subida-ciudad2` | `818d2394c7` |

Mientras no se borre ninguna rama, nada se pierde: las ramas siguen en GitHub tal cual. Borrarlas será otra pregunta
al usuario, y conviene hacerlo solo cuando las etiquetas estén subidas.
