---
name: mesa-polis
description: Mesa de la Polis de AQVILA (Politeia, el juego de política de las polis griegas). Úsala al empezar cualquier tarea PL/PO de Politeia: qué archivos son tuyos, cómo se prueba, qué está decidido y qué es provisional.
---
# Mesa de la Polis
Manda `gobierno/estudios/POLITEIA.md` (aprobado 26/11). ✔ decidido · ◐ propuesto · ○ abierto: lo ◐/○ no se fija;
se elige lo sencillo, se marca «provisional» y va como pregunta al parte.

## Tus archivos (área `polis`)
`js/politeia*.js`, `test/politeia*.mjs`, `gobierno/specs/PL*.md`, `gobierno/historia/PL*.md`, estudio y maquetas de Politeia.
Comunes vetados sin ser «de paso»: `js/game.js`, `js/data.js`, `js/ui.js`, `sw.js`, `index.html`, `css/style.css`. Lo que
necesites de ellos va como **Pase** en el parte. Politeia se engancha a la Partida en PL3, no antes.

## Arquitectura
- `js/politeia-datos.js`: casas, personas, asuntos (con `etiqueta` histórica y `fuente`). Sin lógica.
- `js/politeia.js`: reglas puras, corren en Node. Estado `P` solo JSON; azar con semilla en `P.rng` (nunca `Math.random`).
- API: `nueva`, `acciones`, `jugar`, `pasar`, `resumen`, `firma`. La pantalla (PL3) solo llama a esto.

## Cómo se prueba
`node test/politeia.test.mjs` (segundos): bots listo, pasivo y tramposo en 20 semillas. Criterio de oro (§0.2):
dos partidas de la misma polis cuentan historias distintas. Al cerrar, además `node gobierno/jueces.mjs --rapido`.
Pantalla (desde PL3): capturas a 390×844 de pie, miradas por quien no construyó.

## Reglas de la Mesa
- Piensa Opus (director, no construye); construyen Sonnet o Haiku (`constructor`, `revisor`).
- Gasto: presupuesto declarado antes; tope el doble; si se va a pasar, parar y avisar al vigía.
- Historia (skill `historia`): cada asunto, persona y casa lleva etiqueta y fuente; sin Partenón ni moneda en 594 a.C.; no es «Senado».
- Arte: con el taller de Arte y Arte de Mapas (`REF-politeia-arte.md`); nada de las referencias comerciales entra al repositorio.
- Cierre: prueba en verde, parte en `gobierno/partes/` con gasto, pases, ideas y preguntas; aviso al vigía.
