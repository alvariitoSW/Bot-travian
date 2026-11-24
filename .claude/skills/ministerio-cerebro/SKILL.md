---
name: ministerio-cerebro
description: Ministerio del Cerebro de AQVILA, con dos ramas, Ciudades y Política (ciudad y construcción, recursos, clases sociales, Senado, comercio, ciencia). Úsala al empezar cualquier tarea de ciudad, economía, Senado, diplomacia o saber (carriles CE, CI, CS, CN, SN, PO, EV, UR): dice qué archivos son tuyos, cuáles están vetados, cómo se prueba y a quién se pasa cada cosa.
---

# Ministerio del Cerebro (ramas: Ciudades y Política)

Eres el director de una tarea del Cerebro. Esta guía va **además** de `plan-socialista` y manda sobre ella en qué
archivos tocas, qué jueces pasas y quién escribe en el tablero y la bitácora (`gobierno/MINISTERIOS.md`).

## Objetivo final
`gobierno/OBJETIVOS.md`, órgano **Cerebro**: se pueden lograr los caminos del **comercio, la política y la ciencia**;
descuidar a una clase social tiene consecuencias que se ven. Plan: `gobierno/estudios/CE1-objetivo-cerebro.md`.

## Tus archivos (`gobierno/areas.json` → `cerebro`; duda: `node gobierno/juez-area.mjs --dueno <ruta>`)
- **Rama Ciudades**: `js/ciudad.js`, `js/gfx/city3d.js`, `roma-siglo.js`, `vida.js`, `trajin.js`, `fachadas.js`, `civicas.js`,
  `campos.js`, `mundo.js`, `sonido-ciudad.js`; pruebas `ciudad`, `encargos`, `sonido-ciudad`; maquetas de ciudad.
  `sonido-ciudad.js` sigue siendo tuyo, pero cómo suena lo dicta el Director de Sonido (skill `sonido`) con su partitura.
- **Rama Política**: `js/diplomacia.js`; pruebas `senado`, `saber`, `diplomacia`, `investigador`, `consejo`; maquetas de Senado y política.
- **Ojo**: casi toda la economía, el Senado y los datos viven en `js/game.js` y `js/data.js`, que son **comunes**. Por eso
  **solo hay una sesión del Cerebro que los toque a la vez**: las dos ramas se encadenan, no van en paralelo, salvo
  que una de las dos trabaje solo en archivos propios (lo visual de la ciudad).
- **Vetados**: batalla (`js/guerra.js`, `js/ui-mando.js`, `js/gfx/soldado.js`…), mapa y menús (`js/gfx/map3d.js`…).
- Arte de edificios: lo pide al taller de Arte (pase → Arte), con dictamen de la skill `historia`.

## Cómo se prueba
| Cuándo | Orden | Tarda (medido el 23/11) |
|---|---|---|
| Mientras construyes y para cerrar | `node gobierno/juez-area.mjs cerebro` | 63 s |
| Si tocaste economía o datos | además `node -r ./test/soft-assert.js test/sim.test.js` (el bot de campaña) | ≈18 min, en segundo plano |
| Lo que se ve | capturas propias con `gobierno/captura-ciudad.mjs` y afines; **mirarlas** | minutos |
El área no tiene todavía juez de navegador propio: lo que se ve se comprueba con las capturas de la tarea.

## Lo que vale para todas las áreas
- **Comunes** (NO se tocan salvo que el vigía te nombre sesión «de paso»): `js/ui.js`, `js/game.js`, `js/data.js`,
  `js/registro.js`, `index.html`, `css/style.css`, `sw.js`, `test/sim.test.js`, `gobierno/jueces.mjs`.
- **Solo el vigía**: `gobierno/BITACORA.md`, `TABLERO.md`, `lista.json`, `cuadro.json`, las skills. Tú escribes tu **parte**; él lo pasa.
- Antes de cada commit: `node gobierno/juez-area.mjs cerebro --archivos`. «VETADO» se deshace. «PASE» se pide.
- **Pase** (línea «Pases» del parte): el cambio que necesitas en un archivo común o de otra área, con el trozo exacto
  (`Pase → común: en js/ui.js, … añadir …`). Deja lo tuyo funcionando sin él y no esperes. La caché de `sw.js` no la
  subes tú: apunta los archivos nuevos; la sube la sesión de subida.
- **Una decisión del usuario**: no pares a preguntar. Elige lo recomendado, sigue, y deja la pregunta en el parte:
  `**Título**: pregunta (A) opción [recomendado]; (B) opción. Por qué: una frase.` El vigía la junta en el despacho
  del día. Solo se para si es irreversible, quita algo del juego o pasa del gasto aprobado.
- **Una idea nueva**: una línea «Idea:» en el parte. No abre sesión, estudio ni maqueta.
- **Jueces completos** (`jueces.mjs`, ≈59 min): no los pasas tú. Los pasa una vez la sesión de subida.
- **Examen de jugabilidad** antes de cerrar: ¿se entiende y divierte en el móvil? Capturas a 390×844 (y 844×390 si
  es batalla) en `gobierno/capturas-tarea/<ID>-*.jpg`, miradas por quien no construyó (`verificador` o el director).
- **Gasto**: sin tope fijo (usuario, 23/11), pero se mide: `node gobierno/gasto.mjs` al volver cada agente y al cerrar; la cifra va en el parte.
- **Cierre**: parte en `gobierno/partes/<fecha>-<ID>.md` con las líneas de siempre más **Pases**, **Ideas** y
  **Decide el usuario**. Juez de área APTO, capturas vistas, commit y push a tu rama. Avisa al vigía con una línea.
