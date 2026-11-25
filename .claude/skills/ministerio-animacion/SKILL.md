---
name: ministerio-animacion
description: Departamento de Animación de AQVILA (uno de los seis de batalla, 25/11). Dueño de cómo se mueven soldados, jinetes, elefantes y barcos: posturas, andar y correr, golpes, caídas, lanzamientos y la animación horneada. Úsala al empezar cualquier tarea de movimientos o posturas de batalla: qué archivos son tuyos, ficha de objetivo y juez de aspecto (nota ≥ 8,5), cómo se prueba y a quién pasas cada cosa.
---

# Departamento de Animación

Creado por el usuario el 25/11 (`gobierno/estudios/PLAN-2.0.md`, «Departamentos de batalla»): «¿Te vale este reparto de
departamentos de batalla?» → «Sí, los seis (Recomendado)»; «¿Cuándo se montan?» → «Ya, antes de M5 y de las oleadas».
Antes vivía dentro de Combate; se separa para que una sesión mejore los movimientos mientras otra mejora el motor.
Esta guía va **además** de `plan-socialista` y manda sobre ella en qué archivos tocas y qué juez pasas.

## Los seis departamentos de batalla (una línea cada uno)
| Departamento | Guía | Dueño de |
|---|---|---|
| Jugabilidad y mando | `ministerio-batallas` | Qué haces y cómo mandas, ritmo, IA rival, equilibrio, pantallas |
| Motor de guerra | `ministerio-combate` | Lucha, física y proyectiles; fluido con 1.000–2.000 por bando |
| **Animación (tú)** | `ministerio-animacion` | Movimientos de soldados, jinetes, elefantes y barcos |
| Gráficos | `ministerio-graficos` | Luz, cielo, campo, polvo, sangre, cámara de cine, fluidez de la escena |
| Arte de soldados | `arte` (sección «Arte de soldados») | Modelos, telas, escudos, estandartes, pueblos |
| Sonido | `sonido` | Gritos, golpes, voces, música de batalla |

Una frase: **el motor dice qué pasa; tú haces que se vea moverse bien; Arte de soldados pone el cuerpo y la ropa.**

## Objetivo y vara
- `OBJETIVOS.md`, órgano Corazón; PLAN-2.0: «sin atravesar escudos ni movimientos robóticos; aspecto ≥ 8,5».
- **Ficha de objetivo**: `gobierno/aspecto/animacion.md` (12 cosas que se tienen que ver, referencias, captura de partida y
  exámenes). Léela antes de diseñar, junto con `gobierno/estudios/REF-batallas-referencias.md`. Cada tarea dice en su
  parte **qué cosas de la ficha** mueve y las enseña en capturas lado a lado con la captura de partida.
- **Juez de aspecto**: `node gobierno/juez-aspecto.mjs animacion`. Comprueba la ficha y que ninguna tarea cierre con nota
  < 8,5. La nota la pone una sesión que **no construyó** (el `verificador` u otra), que añade su fila en «Exámenes» con
  capturas. Si la nota no llega, la tarea no se da por terminada: se rehace la pieza (criterio del usuario, REF §0).
- Línea de partida (DB0, 25/11): **5,0**. Lo que el móvil no da (caras de cine, miles con detalle) se dice, no se promete.

## Tus archivos (`gobierno/areas.json` → `animacion`; duda: `node gobierno/juez-area.mjs --dueno <ruta>`)
- **Propios**: `js/gfx/soldado.js` (soldado nuevo, movimientos horneados), `js/gfx/units.js` (unidades de 0 A.D., textura
  de huesos, `zancadas()`), `js/gfx/models.js` (figuras de reserva y su animación por shader), `js/combate-poses.js` (la pose
  sacada del estado del motor) y `test/combate-poses.test.mjs`; nuevos `js/animacion*.js`, `js/gfx/animacion*.js`,
  `test/animacion*.mjs`; las piezas de movimiento de la maqueta de falange (`esqueleto.js`, `locomocion.js`,
  `caballeria.js`, `elefante.js`, `soldados.js`); `gobierno/maquetas/soldado-pil3/`, `gobierno/maquetas/animacion-*/`;
  `soldado-rome2/construir/{anim,poses,probar_anim}.py`; en Blender, `tools/blender/pilum_tiro.py`, `pilum_throw.glb`,
  `importa_ual.py`, `pil3_lanzar2_meshy.py` y `tools/blender/anim*`; `gobierno/captura-animacion*.mjs`;
  `gobierno/aspecto/animacion*`.
- **Del Motor de guerra** (no los cambias; pase): `js/combate.js`, `combate-tropas.js`, `fisica-batalla.js`, `falange.js`,
  `bloque.js`… Tú **lees** su estado (manos, guardia, caído) y lo pintas. «Nada de animaciones que mientan sobre lo que pasa».
- **De Jugabilidad y mando** (pase): escenas y pantallas (`js/ui-mando.js`, `ui-escaramuza.js`, `guerra.js`…). Tú entregas
  la función (`Soldados.pinta(hombres, t)`…) y ellos la conectan.
- **De Arte de soldados** (pase): mallas, texturas, equipo y `tools/build_units.mjs` (que hornea los clips de 0 A.D.). Si
  un clip nuevo necesita otra malla o hueso, pide la pieza.
- **De Gráficos**: sangre, polvo y chispas (`js/gfx/golpes.js`) y la cámara. **Comunes** y **solo vigía**: como todas.

Antes de cada commit: `node gobierno/juez-area.mjs animacion --archivos`.

## Cómo se trabaja
1. Elige de la ficha las cosas que vas a mover (2–4 por tarea) y su referencia. Una frase de qué tiene que verse.
2. Maqueta si cambia mucho (`gobierno/maquetas/animacion-<ID>/`), con capturas a 390×844 y 844×390, de cerca y de general.
3. Construir (constructor). Movimientos de licencia libre: Quaternius y MakeHuman (CC0), 0 A.D. (CC BY-SA 3.0); propios
   por código en Blender (entorno «AQVILA Batallas taller», `gobierno/entornos/batallas-taller.md`).
4. **Examen** de una sesión que no construyó: nota en la ficha. ≥ 8,5 para cerrar.
5. Rendimiento: la animación horneada es lo que deja pintar miles en una llamada. Mide llamadas de dibujo y coste por
   cuadro; si un movimiento nuevo rompe la meta de 1.000–2.000 por bando, dilo al Motor de guerra y a Gráficos.

## Cómo se prueba
| Cuándo | Orden | Tarda |
|---|---|---|
| Mientras construyes | `node gobierno/juez-area.mjs animacion --rapido` (`combate-poses` + juez de aspecto) | segundos |
| Para cerrar | `node gobierno/juez-area.mjs animacion` (añade `juez-guerra.mjs`, la batalla en navegador) | 13–25 min (medido aquí: 25) |
| Si tocaste arte | lo añade solo: `arte.mjs` y `fichas.mjs` | segundos |
| Jueces completos | No los pasas tú: la sesión de subida | — |
Capturas en `gobierno/capturas-tarea/AN<n>-*.jpg`. **Míralas**: el movimiento se juzga por lo que se ve.

## A quién pasas qué
- Motor de guerra: un estado que falta para poder pintarlo («mano izquierda: empujando con el umbo»).
- Jugabilidad y mando: la llamada exacta para conectar tu función en su escena.
- Arte de soldados: una malla, un hueso o un equipo nuevo. Gráficos: sangre, polvo o cámara que acompañe un golpe.
- Sonido: el evento que emite tu movimiento (pie a tierra, golpe en escudo) para su partitura.
- Común (`sw.js` con archivos nuevos, `registro.js` con la ficha de un clip): pase en el parte.
- Decisión del usuario: no pares; lo recomendado y la pregunta en el parte (`MINISTERIOS.md` R2). Idea: línea «Idea:».

## Cierre
Parte en `gobierno/partes/<fecha>-<ID>.md` con **qué cosas de la ficha mueve**, nota del examen, **Pases**, **Ideas** y
**Decide el usuario**. Juez de área APTO, capturas vistas, commit y push a tu rama. Tablero y bitácora: avisa al vigía.
