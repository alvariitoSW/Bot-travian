---
name: arte-mapas
description: Departamento de Arte de Mapas de AQVILA (dentro del Músculo, con el taller de Arte). Dueño del mapa de campaña en 3D: relieve, agua, costas, ciudades vivas sobre el mapa, Grecia con sus polis y los recursos repartidos por zonas. Úsala al empezar cualquier tarea del mapa vivo (AM1, AM2, AM3 y siguientes): qué archivos son tuyos, cómo se trabaja (maqueta con capturas → el usuario elige → construir), presupuesto, licencias y cómo se prueba.
---

# Departamento de Arte de Mapas

Creado por el usuario el 25/11 (`gobierno/estudios/PLAN-2.0.md` §0, «M1: añadidos y arranque»), literal:
«hay que crear el departamento de arte de mapas para que mejoren el mapa básico de roma que hay y lo lleven a otro
nivel con un mapa vivo bien renderizado». Vive **dentro del Músculo** y trabaja **con el taller de Arte** (licencias y
presupuesto). Esta guía va **además** de `plan-socialista` y de `arte`, y manda sobre ellas en qué archivos tocas y qué
juez pasas (`gobierno/MINISTERIOS.md`).

## Qué hace
1. **Mapa vivo y bien renderizado**: relieve, mar y ríos que se mueven, costas, luz, ciudades que se ven vivas (humo,
   barcos, caminos), legible a 390 px. Aprueba con **nota ≥ 7** frente a referencias tipo Total War (juez de aspecto,
   «Estándar de M1» del plan).
2. **Grecia con sus polis**: la 2.0 empieza en Grecia (Atenas, Esparta, Corinto y las que traiga PN2). El mapa de Roma
   que hay es la base: se mejora y se lleva a Grecia, no se tira.
3. **Recursos sobre el mapa** (AM3, con el Cerebro): los **básicos** repartidos por zonas (cada uno en ≥ 3); los de **lujo**
   solo en algunas ciudades (1–3 cada uno); lo que no tienes, por **comercio** o **conquistando** la ciudad y explotando
   su recurso. Las reglas (qué da cada recurso, cómo se comercia) son del Cerebro en `js/game.js`/`js/data.js` (comunes):
   tú los **pintas** y los colocas; las cifras van por pase.

## Cómo trabaja
1. **Maqueta primero** (AM1): dos o tres propuestas de aspecto en `gobierno/maquetas/mapa-*/`, con capturas a 390×844
   (y apaisado), para que el usuario **elija** por lo que ve. Sin tocar el juego.
2. **Construir lo elegido** (AM2): en `js/gfx/map3d.js` y archivos nuevos `js/gfx/mapa-*.js`. Constructor + verificador.
3. **Recursos** (AM3): necesita AM2 y PN2. Constructor + revisor.
Orden y tamaños: `PLAN-2.0.md` §4, carril (d). Puede ir en paralelo a las demás tandas porque sus archivos son suyos.

## Modelo y gasto
- **AM1 y AM2 los hace Fable**, por excepción del usuario a «solo Opus»: «**Fable diseña y construye**» (25/11). Es más
  caro: se mide. AM0, AM3 y lo demás, Opus.
- Sin tope fijo, pero medido: `node gobierno/gasto.mjs` al volver cada agente y al cerrar; la cifra va en el parte.
  Declarado en el plan: AM1 1,0 M (esperable 1,5–2), AM2 2,5 M (4–5), AM3 1,5 M (2–3).

## Tus archivos (`gobierno/areas.json` → `mapas`; duda: `node gobierno/juez-area.mjs --dueno <ruta>`)
- **Propios**: `js/gfx/map3d.js`, `js/gfx/mapa-*.js` (nuevos), `assets/mapa/` (alturas, agua, costas y sus generadores),
  `assets/mapa-*/` (nuevos), `tools/mapa-*`, `test/mapa.test.mjs`, `test/mapa-*.mjs`, `gobierno/captura-mapa.mjs`,
  `gobierno/captura-mapa-*.mjs`, `gobierno/juez-mapas.mjs`, `gobierno/maquetas/mapa*/`.
- **Del Músculo, por pase**: `js/gfx/ground.js` y `js/gfx/statics.js` (los usan también ciudad y batalla), fluidez y móvil.
- **Comunes, por pase**: `js/ui.js` (paneles, minimapa, botones del mapa), `js/game.js`, `js/data.js` (ciudades, rutas,
  recursos), `index.html`, `sw.js` (los archivos nuevos van a la caché: los sube la sesión de subida).
- **Vetados**: batalla (`js/guerra.js`, `js/ui-guerra.js`…) y ciudad (`js/gfx/city3d.js`…).

## Presupuesto
- `gobierno/arte.json` (lo cambia solo el usuario). Hoy la descarga total tope es **56 MB**; el plan 2.0 la sube a
  **~80 MB** («1A», 25/11) para todo el juego, no solo el mapa. El mapa vivo pide su parte en la maqueta (AM1) con una
  cifra, y la apunta en el parte; si no cabe, se simplifica.
- Hoy: `alturas.js` ≤ 330 KB y `agua.js` ≤ 60 KB (`test/mapa.test.mjs`). Triángulos y llamadas de cada vista los escribe
  `gobierno/captura-mapa.mjs`. Fluidez: aquí solo hay render por software; di «no medido» y pide la prueba en su móvil.

## Licencias (CLAUDE.md §2 y skill `arte`)
- Modelos de 0 A.D. (Wildfire Games, **CC BY-SA 3.0**): cita, enlace y misma licencia.
- Texturas de **Poly Haven** (CC0), aprobadas para ciudad y suelo. **Meshy**, cuando haya créditos (lo generado se
  publica CC BY-SA 3.0, como decidió el usuario).
- Datos de relieve y costas: dominio público con su cita (`assets/mapa/LICENSE.txt`: Natural Earth, GMTED2010…).
- **Nada de juegos comerciales**: las capturas de Total War son referencia de ideas, nunca se guardan en el repositorio
  ni se calcan. Cada pieza nueva: ficha en `js/registro.js` (pase → común) y `node gobierno/arte.mjs` en APTO.

## Cómo se prueba
| Cuándo | Orden | Tarda |
|---|---|---|
| Mientras construyes y para cerrar | `node gobierno/juez-area.mjs mapas` (lógica `mapa.test` + navegador `juez-mapas.mjs`) | ≈1–3 min |
| Solo lógica | `node gobierno/juez-area.mjs mapas --rapido` | segundos |
| Si tocaste arte | `node gobierno/arte.mjs` | segundos |
| Lo que se ve | `node gobierno/captura-mapa.mjs <ID> vistas=grecia,italia,…` (vistas en su cabecera); **mirarlas** | minutos |
El juez de navegador deja `gobierno/capturas-area/mapas/AM-juez-italia.jpg` y `-grecia.jpg`: comprueba que el mapa
arranca, pinta y no da errores de consola; la belleza la juzgan las capturas y el usuario.

## Lo que vale para todas las áreas
Igual que en `ministerio-cerebro` («Lo que vale para todas las áreas»): comunes solo por pase; tablero, bitácora y
skills solo el vigía; `node gobierno/juez-area.mjs mapas --archivos` antes de cada commit («VETADO» se deshace, «PASE»
se pide); decisiones del usuario como pregunta en el parte, sin parar; parte en `gobierno/partes/<fecha>-<ID>.md` con
**Pases**, **Ideas** y **Decide el usuario**; avisar al vigía al cerrar.
