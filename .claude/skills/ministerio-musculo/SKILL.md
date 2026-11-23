---
name: ministerio-musculo
description: Ministerio del Músculo de AQVILA (mapa de campaña, menús y ajustes, manejo, fluidez y juego sin conexión). Úsala al empezar cualquier tarea de mapa, menús, ajustes, carga o rendimiento (carriles MN, MR, C, J, K, V): dice qué archivos son tuyos, cuáles están vetados, cómo se prueba y a quién se pasa cada cosa.
---

# Ministerio del Músculo

Eres el director de una tarea del Músculo. Esta guía va **además** de `plan-socialista` y manda sobre ella en qué
archivos tocas, qué jueces pasas y quién escribe en el tablero y la bitácora (`gobierno/MINISTERIOS.md`).

## Objetivo final
`gobierno/OBJETIVOS.md`, órgano **Músculo**: aspecto cuidado y coherente (un mundo antiguo, griego y romano; mismos
menús, botones, letra y partida en todo el juego); **fluido y sin conexión** en el móvil del usuario.

## Tus archivos (`gobierno/areas.json` → `musculo`; duda: `node gobierno/juez-area.mjs --dueno <ruta>`)
- **Propios**: `js/gfx/map3d.js`, `ground.js`, `statics.js`, `fluidez.js`, `movil.js`; pruebas `mapa`, `movil`, `ajustes`,
  `avisos`, `pausas`; maquetas de menús y del concurso.
- **Ojo**: los menús viven en `js/ui.js`, `index.html` y `css/style.css`, que son **comunes**. Una tarea de menús es casi
  siempre la sesión **«de paso»**: pídeselo al vigía al abrir, y aplica de una vez los pases que las otras áreas tengan
  apuntados para esos archivos.
- **Vetados**: batalla y ciudad (`js/guerra.js`, `js/ciudad.js`, `js/gfx/city3d.js`…).
- Arte de mapa y menús: lo pide al taller de Arte (pase → Arte).

## Cómo se prueba
| Cuándo | Orden | Tarda (medido el 23/11) |
|---|---|---|
| Mientras construyes y para cerrar | `node gobierno/juez-area.mjs musculo` | 10 s |
| Lo que se ve | capturas propias con `gobierno/captura-mapa.mjs` y afines, a 390×844; **mirarlas** | minutos |
| Fluidez | aquí solo hay render por software: di «no medido» y pide al usuario la prueba en su móvil | — |
El área no tiene todavía juez de navegador propio: lo que se ve se comprueba con las capturas de la tarea.

## Lo que vale para todas las áreas
- **Comunes** (NO se tocan salvo que el vigía te nombre sesión «de paso»): `js/ui.js`, `js/game.js`, `js/data.js`,
  `js/registro.js`, `index.html`, `css/style.css`, `sw.js`, `test/sim.test.js`, `gobierno/jueces.mjs`.
- **Solo el vigía**: `gobierno/BITACORA.md`, `TABLERO.md`, `lista.json`, `cuadro.json`, las skills. Tú escribes tu **parte**; él lo pasa.
- Antes de cada commit: `node gobierno/juez-area.mjs musculo --archivos`. «VETADO» se deshace. «PASE» se pide.
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
