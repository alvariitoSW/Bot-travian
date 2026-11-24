---
name: ministerio-batallas
description: Ministerio de Batallas de AQVILA (ejércitos, mando, campo y pantallas de la batalla; el cuerpo a cuerpo, las físicas y los soldados son del Departamento de Combate). Úsala al empezar cualquier tarea de batalla (carriles CG, TP, GM, ES, UB): dice qué archivos son tuyos, cuáles están vetados, cómo se prueba sin pasar los jueces enteros y a quién se pasa cada cosa.
---

# Ministerio de Batallas

Eres el director de una tarea de batalla. Esta guía va **además** de `plan-socialista` (presupuesto, reparto, parte) y
manda sobre ella en tres cosas: qué archivos tocas, qué jueces pasas y quién escribe en el tablero y la bitácora.

## Objetivo final (no se discute en cada sesión)
`gobierno/OBJETIVOS.md`, órgano **Corazón**: se puede ganar por las armas; hay **una sola batalla**, y el testudo a
pie se alcanza desde el juego. Criterio del usuario (19/11): «construimos hasta que sea muy parecido a aquellas
referencias». Antes de diseñar, lee `gobierno/estudios/REF-batallas-referencias.md`; no le pidas que repita vídeos.
Lo que no sirva a esto no se hace: va a ideas (abajo).

## Tus archivos
La tabla viva es `gobierno/areas.json` → `batallas`. Pregunta por un archivo: `node gobierno/juez-area.mjs --dueno <ruta>`.
- **Propios** (los cambias sin pedir nada): la lógica de guerra (`js/battle.js`, `guerra.js`, `simulador.js`,
  `maniobra.js`, `falange.js`, `bloque.js`), sus pantallas (`js/ui-guerra.js`, `ui-mando.js`, `ui-maniobra.js`, `ui-escaramuza.js`), su dibujo
  (`js/gfx/campo-mando.js`, `sonido.js`), sus estilos (`css/guerra.css`, `mando.css`,
  `maniobra.css`), sus pruebas y su juez (`gobierno/juez-guerra.mjs`), y las maquetas de batalla.
- **Sonido** (`js/gfx/sonido.js` sigue siendo tuyo): los archivos de audio (`assets/sonido/`, `tools/sonido*`) son del
  Director de Sonido (skill `sonido`). Él te pasa la partitura (qué suena, cuándo, a qué volumen) y tú la montas.
- **Departamento de Combate** (desde el 24/11, skill `ministerio-combate`): el motor de lucha (`js/combate.js`), las
  físicas (`js/fisica-batalla.js`), los soldados y sus movimientos (`js/gfx/soldado.js`, `units.js`, `models.js`), las
  piezas de lucha de la maqueta a pie y el **taller de arte de soldados** (`assets/soldados/`, `assets/units/`,
  `tools/blender/`). Tú usas su motor y lo conectas en tus escenas; un cambio en él se pide como pase → Combate.
- **Comunes** (NO se tocan salvo que el vigía te nombre sesión «de paso»): `js/ui.js`, `js/game.js`, `js/data.js`,
  `js/registro.js`, `index.html`, `css/style.css`, `sw.js`, `test/sim.test.js`, `gobierno/jueces.mjs`.
- **Solo el vigía**: `gobierno/BITACORA.md`, `TABLERO.md`, `lista.json`, `cuadro.json`. Tú escribes tu **parte**; él lo pasa.
- **Vetados**: todo lo de ciudad, Senado, economía, mapa y menús (`js/ciudad.js`, `js/gfx/city3d.js`, `map3d.js`…).

Antes de cada commit: `node gobierno/juez-area.mjs batallas --archivos`. «VETADO» se deshace. «PASE» se pide (abajo).

## Cómo se prueba
| Cuándo | Orden | Tarda (medido el 23/11) |
|---|---|---|
| Mientras construyes | `node gobierno/juez-area.mjs batallas --rapido` | 48 s |
| Para cerrar la tarea | `node gobierno/juez-area.mjs batallas` (lógica + `juez-guerra` en navegador) y **mirar las capturas** | ≈13 min |
| Si tocaste arte | lo añade solo: `gobierno/arte.mjs` y `gobierno/fichas.mjs` | segundos |
| Jueces completos (`jueces.mjs`) | **No los pasas tú.** Los pasa una vez la sesión de subida, sobre todas las áreas unidas | 45–75 min |

Capturas de la tarea: 390×844 y 844×390, en `gobierno/capturas-tarea/<ID>-*.jpg`. Sin capturas vistas no hay «hecho».
Si tu cambio puede romper la campaña (bajas, botín, moral que vuelve a `game.js`), dilo en el parte: la sesión de subida
mirará `test/sim.test.js` primero.

## A quién pasas qué (línea «Pases» del parte)
- **Un cambio en un archivo común** (un botón en `ui.js`, un dato en `data.js`, un archivo nuevo en `sw.js`): escríbelo
  como pase, con el trozo exacto: `Pase → común: en js/ui.js, menú de Escaramuzas, añadir la entrada «Muro hoplita» que
  llama a UIEscaramuza.abrir('hoplita')`. Deja tu parte funcionando sin él (entrada por la escena o por una bandera) y no esperes.
- **La caché de `sw.js`**: no la subes tú. Apunta en el parte los archivos nuevos; la sube la sesión de subida.
- **Historia** (equipo, tácticas, fechas): dictamen con la skill `historia`; va en el parte, línea «Historia».
- **Arte que no es de guerra** (edificios, mapa, menús): no es tuyo; pase → Arte.
- **Gasto**: sin tope fijo (usuario, 23/11), pero se mide: `node gobierno/gasto.mjs` al volver cada agente y al cerrar; la cifra va en el parte.
- **Una decisión del usuario**: no le preguntes en mitad de la tarea. Elige lo recomendado, sigue, y deja la pregunta en
  el parte con la forma `**Título**: pregunta (A) opción [recomendado]; (B) opción. Por qué: una frase.` El vigía la
  junta en el despacho del día. Solo se para si es irreversible o cuesta más de lo aprobado.
- **Una idea nueva**: una línea en el parte, «Idea:». No abre sesión, estudio ni maqueta. El vigía decide si llega a tarea.

## El taller de arte (pasó a Combate el 24/11)
Lo que sigue es para cuando Combate te pida montar algo suyo; el taller lo dirige él.
Entorno en la nube «AQVILA Batallas taller» (las sesiones de batalla se abren en él): guion `gobierno/entornos/batallas-taller.sh`, guía
`gobierno/entornos/batallas-taller.md` (rutas, versiones, órdenes de ejemplo y lo que no está comprobado). Deja
Blender sin pantalla, los movimientos de Quaternius (CC0) y los datos de MakeHuman (CC0) en `/opt/aqvila-taller/`.
- Blender se usa así: `blender-py tools/blender/<guion>.py`, y luego `node tools/glb_a_static.mjs <modelo.glb> <clave> <textura.webp>`.
  Render: con Cycles (Eevee por software tarda 76 s). Patch (patch.gg) solo si el usuario entra con su cuenta: gasta créditos.
- Se modela **por código** (`tools/blender/*.py`): el guion es la fuente; el `.glb` y el `.bin` se regeneran.
- Licencia antes que píxeles (skill `arte`). Arte propio: se apunta como propio en `assets/*/LICENSE.txt`.
- Presupuesto de peso y triángulos: `gobierno/arte.json`. Subirlo es decisión del usuario.
- Si abres una sesión en otro entorno y falta algo, no lo reinstales a mano: dilo en el parte y pide el entorno bueno.

## Cierre
Parte en `gobierno/partes/<fecha>-<ID>.md` con las líneas de siempre más **Pases**, **Ideas** y **Decide el usuario**.
Juez de área APTO, capturas vistas, commit y push a tu rama. No tocas tablero ni bitácora: avisa al vigía con una línea.
