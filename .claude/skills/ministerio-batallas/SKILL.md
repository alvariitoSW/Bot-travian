---
name: ministerio-batallas
description: Departamento de Jugabilidad y mando de AQVILA (antes Ministerio de Batallas; uno de los seis de batalla, 25/11). Dueño de qué haces y cómo mandas en la batalla, el ritmo, la IA rival, el equilibrio y las pantallas; lleva el examen de jugabilidad. Úsala al empezar cualquier tarea de batalla (carriles CG, TP, GM, ES, UB): qué archivos son tuyos, cuáles están vetados, cómo se prueba y a quién se pasa cada cosa. Motor, animación, gráficos, arte de soldados y sonido tienen su propia guía.
---

# Departamento de Jugabilidad y mando (antes Ministerio de Batallas)

## Los seis departamentos de batalla (usuario, 25/11: «Sí, los seis (Recomendado)»; «Ya, antes de M5 y de las oleadas»)
| Departamento | Guía | Dueño de |
|---|---|---|
| **Jugabilidad y mando (tú)** | `ministerio-batallas` | Qué haces y cómo mandas, ritmo, IA rival, equilibrio, pantallas |
| Motor de guerra (antes Combate) | `ministerio-combate` | Lucha, física y proyectiles; fluido con 1.000–2.000 por bando |
| Animación (nuevo) | `ministerio-animacion` | Movimientos de soldados, jinetes, elefantes y barcos |
| Gráficos (nuevo) | `ministerio-graficos` | Luz, cielo, campo, polvo, sangre, cámara de cine (`cine-mando`, `campo-mando`, `estandartes`) |
| Arte de soldados | `arte` | Modelos, telas, escudos, estandartes, pueblos |
| Sonido | `sonido` | Gritos, golpes, voces, música de batalla |
**Ya no es tuyo** (desde DB0, 25/11): `js/gfx/campo-mando.js`, `cine-mando.js` y `estandartes.js` (→ Gráficos) y la
maqueta `testudo-luz-campo/` (→ Gráficos). Tú los conectas en tus pantallas; cambiarlos es un pase.

## Examen de jugabilidad (regla del usuario, 25/11; `MINISTERIOS.md` §4d)
Antes de enseñarle al usuario **cualquier** tarea de batalla, la juzga una sesión que **no la construyó** (el
`verificador` u otra sesión): juega la batalla a 390×844 y 844×390, la compara con `REF-batallas-referencias.md` y escribe
`gobierno/partes/<fecha>-<ID>-examen.md` con: qué se entiende y qué no, si se gana y se pierde jugando bien, ritmo,
críticas concretas y un «se puede enseñar: sí/no». Si toca Animación o Gráficos, pone además su nota en la ficha de
`gobierno/aspecto/`. Sin examen, no se enseña ni se da por hecha. El que construyó no se examina a sí mismo.


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
  `maniobra.js`, `tacticas.js`, `tiro.js`, `mando-varios.js`, `tropas.js`), sus pantallas (`js/ui-mando.js`,
  `ui-maniobra.js`, `ui-escaramuza.js`, `ui-batalla-rapida.js`), `js/gfx/sonido.js` y los diálogos, sus estilos
  (`css/mando.css`, `maniobra.css`), sus pruebas y su juez (`gobierno/juez-guerra.mjs`), y las maquetas de batalla.
- **Sonido** (`js/gfx/sonido.js` sigue siendo tuyo): los archivos de audio (`assets/sonido/`, `tools/sonido*`) son del
  Director de Sonido (skill `sonido`). Él te pasa la partitura (qué suena, cuándo, a qué volumen) y tú la montas.
- **Motor de guerra** (skill `ministerio-combate`): el motor de lucha (`js/combate.js`), las físicas
  (`js/fisica-batalla.js`), la falange y el testudo (`js/falange.js`, `falange-rivales.js`, `bloque.js`, `bloque-ia.js`).
  Tú usas su motor y lo conectas en tus escenas; un cambio en él se pide como pase.
- **Animación** (skill `ministerio-animacion`): los soldados y sus movimientos (`js/gfx/soldado.js`, `units.js`,
  `models.js`, `js/combate-poses.js`). **Gráficos** (skill `ministerio-graficos`): luz, campo, cámara de cine, estandartes.
- **Arte de soldados** (skill `arte`): `assets/soldados/`, `assets/units/`, `tools/blender/`.
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

## El taller de arte (pasó a Combate el 24/11 y a Arte de soldados el 25/11)
Lo que sigue es para cuando Arte de soldados te pida montar algo suyo; el taller lo dirige él (skill `arte`).
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
Juez de área APTO, capturas vistas, **examen de jugabilidad hecho por otra sesión**, commit y push a tu rama. No tocas tablero ni bitácora: avisa al vigía con una línea.
