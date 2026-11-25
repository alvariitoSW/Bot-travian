---
name: ministerio-graficos
description: Departamento de Gráficos de AQVILA (uno de los seis de batalla, 25/11). Dueño de cómo se ve la escena de batalla: luz, cielo, campo, polvo, sangre, proyectiles con estela, estandartes, cámara de cine y fluidez de la escena. Úsala al empezar cualquier tarea de aspecto de la batalla: qué archivos son tuyos, ficha de objetivo y juez de aspecto (nota ≥ 8,5), cómo se prueba y a quién pasas cada cosa.
---

# Departamento de Gráficos

Creado por el usuario el 25/11 (`gobierno/estudios/PLAN-2.0.md`, «Departamentos de batalla»): «Sí, los seis
(Recomendado)» y «Ya, antes de M5 y de las oleadas (Recomendado)». Antes estaba repartido entre Batallas y Combate
(`cine-mando`, `campo-mando`, `estandartes`…); ahora tiene un solo dueño. Esta guía va **además** de `plan-socialista`.

## Los seis departamentos de batalla (una línea cada uno)
| Departamento | Guía | Dueño de |
|---|---|---|
| Jugabilidad y mando | `ministerio-batallas` | Qué haces y cómo mandas, ritmo, IA rival, equilibrio, pantallas |
| Motor de guerra | `ministerio-combate` | Lucha, física y proyectiles; fluido con 1.000–2.000 por bando |
| Animación | `ministerio-animacion` | Movimientos de soldados, jinetes, elefantes y barcos |
| **Gráficos (tú)** | `ministerio-graficos` | Luz, cielo, campo, polvo, sangre, cámara de cine, fluidez de la escena |
| Arte de soldados | `arte` (sección «Arte de soldados») | Modelos, telas, escudos, estandartes, pueblos |
| Sonido | `sonido` | Gritos, golpes, voces, música de batalla |

Una frase: **tú haces que la batalla parezca de verdad alrededor de los soldados**; ellos (Animación y Arte de soldados)
hacen a los soldados; Jugabilidad y mando decide qué se juega en esa escena.

## Objetivo y vara
- `OBJETIVOS.md`, órgano Corazón; PLAN-2.0: «aspecto ≥ 8,5 frente a referencias; sin tirones en su móvil».
- **Ficha de objetivo**: `gobierno/aspecto/graficos.md` (12 cosas que se tienen que ver, referencias, captura de partida y
  exámenes). Léela antes de diseñar, junto con `gobierno/estudios/REF-batallas-referencias.md` (§2 «Batalla grande y
  épica»). Cada tarea dice qué cosas de la ficha mueve y las enseña lado a lado con la captura de partida.
- **Juez de aspecto**: `node gobierno/juez-aspecto.mjs graficos`. La nota la pone una sesión que **no construyó**, en
  «Exámenes». Para cerrar, ≥ 8,5; si no llega, se rehace la pieza.
- Línea de partida (DB0, 25/11): **4,5** en la batalla grande (la escena a pie, con la luz de GM43e, está mejor).
- **Fluidez**: aquí solo hay render por software. Mide llamadas de dibujo y triángulos por vista y di «no medido en el
  móvil»; pide la prueba en su móvil en «Decide el usuario». Un efecto que cuesta más de lo que luce, fuera.

## Tus archivos (`gobierno/areas.json` → `graficos`; duda: `node gobierno/juez-area.mjs --dueno <ruta>`)
- **Propios**: `js/gfx/campo-mando.js` (luz, niebla, cielo, suelo, piedras, árboles y polvo de la pantalla de mando),
  `js/gfx/cine-mando.js` (cámara de cine), `js/gfx/estandartes.js` (el dibujo del estandarte de cada manípulo),
  `js/gfx/golpes.js` (chispas, astillas, sangre discreta; nuevo), nuevos `js/gfx/graficos*.js` y `test/graficos*.mjs`;
  `gobierno/maquetas/testudo-luz-campo/` (la luz y el campo aprobados, GM43e), `gobierno/maquetas/cine-mando/`,
  `gobierno/maquetas/graficos-*/`, el `campo.js` de las maquetas `a-pie/` y `falange/`; `gobierno/captura-graficos*.mjs`;
  `gobierno/aspecto/graficos*`.
- **De Jugabilidad y mando** (pase): las pantallas que montan tu escena (`js/ui-mando.js`, `ui-escaramuza.js`), las
  marcas de mando y la interfaz. Tú entregas la función (`crearCine(...)`, `crearCampo(...)`) y ellos la conectan.
- **Del Músculo** (pase): `js/gfx/ground.js`, `statics.js`, `fluidez.js`, `movil.js` (los usan ciudad y mapa).
- **De Arte de soldados** (pase): el diseño de paños, escudos y emblemas; tú los pintas en la escena.
- **De Animación**: cómo se mueve cada hombre. **Del Motor de guerra**: dónde cae cada proyectil (tú pintas la estela).
- **Comunes** y **solo vigía**: como todas.

Antes de cada commit: `node gobierno/juez-area.mjs graficos --archivos`.

## Cómo se trabaja
1. Elige de la ficha 2–4 cosas y su referencia. Una frase de qué tiene que verse.
2. Maqueta con capturas a 390×844 y 844×390, desde la altura de general y a pie (`gobierno/maquetas/graficos-<ID>/`).
3. Construir (constructor). Texturas de Poly Haven (CC0), árboles de 0 A.D. (CC BY-SA 3.0), propio por código. Nada de
   juegos comerciales: sus capturas son ideas, no se calcan ni se guardan (skill `arte`).
4. **Examen** de una sesión que no construyó: nota en la ficha. ≥ 8,5 para cerrar.

## Cómo se prueba
| Cuándo | Orden | Tarda |
|---|---|---|
| Mientras construyes | `node gobierno/juez-area.mjs graficos --rapido` (juez de aspecto) | segundos |
| Para cerrar | `node gobierno/juez-area.mjs graficos` (añade `juez-guerra.mjs`, la batalla en navegador) | 13–25 min (medido aquí: 25) |
| Si tocaste arte | lo añade solo: `arte.mjs` y `fichas.mjs` | segundos |
| Jueces completos | No los pasas tú: la sesión de subida | — |
Capturas en `gobierno/capturas-tarea/GR<n>-*.jpg`. **Míralas**: muchos fallos solo se ven (escala, color, bruma que tapa).

## A quién pasas qué
- Jugabilidad y mando: la llamada exacta para conectar tu escena o tu cámara; marcas de mando que ensucian el campo.
- Músculo: un cambio en el suelo común o en la fluidez. Arte de soldados: un paño, escudo o emblema.
- Sonido: lo que se ve y debería oírse (carga con polvo, golpe con chispa).
- Común (`sw.js`, `registro.js` con la ficha de una textura): pase en el parte.
- Decisión del usuario: no pares; lo recomendado y la pregunta en el parte (`MINISTERIOS.md` R2). Idea: línea «Idea:».

## Cierre
Parte en `gobierno/partes/<fecha>-<ID>.md` con **qué cosas de la ficha mueve**, nota del examen, llamadas y triángulos
medidos, **Pases**, **Ideas** y **Decide el usuario**. Juez de área APTO, capturas vistas, commit y push. Avisa al vigía.
