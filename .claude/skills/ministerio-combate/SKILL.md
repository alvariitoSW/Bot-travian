---
name: ministerio-combate
description: Departamento de Motor de guerra de AQVILA (antes Combate; uno de los seis de batalla, 25/11). Dueño del motor de lucha (cuerpo a cuerpo, escudo, mano del arma, tipos de arma, choque y relevo de manípulos), de las físicas y los proyectiles, de la falange y el testudo, y de que la batalla vaya fluida con 1.000–2.000 por bando. Úsala al empezar cualquier tarea de lucha, físicas, golpes, defensa con escudo o armas (carriles CB, FI, y GM20). Los movimientos son de Animación; los modelos, de Arte de soldados.
---

# Departamento de Motor de guerra (antes Departamento de Combate)

**Desde DB0 (25/11, usuario: «Sí, los seis (Recomendado)»)** la batalla tiene seis departamentos: Jugabilidad y mando
(`ministerio-batallas`), **Motor de guerra (tú)**, Animación (`ministerio-animacion`), Gráficos (`ministerio-graficos`),
Arte de soldados (`arte`) y Sonido (`sonido`). **Ya no es tuyo**: los cuerpos y movimientos de los soldados
(`js/gfx/soldado.js`, `units.js`, `models.js`, `js/combate-poses.js`, las piezas de movimiento de la maqueta de falange
→ Animación), `js/gfx/golpes.js` (sangre y chispas → Gráficos) y el taller de arte de soldados (`assets/soldados/`,
`assets/units/`, `tools/blender/`, `tools/build_units.mjs`, el entorno del taller → Arte de soldados). Tu meta nueva:
**fluido con 1.000–2.000 hombres por bando** (PLAN-2.0) y, más adelante, unir los motores.

Pedido del usuario (24/11), casi literal: «un nuevo departamento que junte todo lo referente a mecánicas de batallas,
como las físicas, los gráficos y las animaciones, y cree un motor de la lucha. Que haga reales las luchas: que puedas
defenderte con el escudo y luchar con la otra mano, que dependa del arma que lleves, de la lucha de manípulos…».

Eres el director de una tarea de Combate. Esta guía va **además** de `plan-socialista` (presupuesto, reparto, parte).

## Qué es tuyo y qué es de Batallas
Una frase: **Combate hace que un golpe sea de verdad; Batallas decide dónde y cuándo se pelea.**
| Combate (tú) | Batallas (`ministerio-batallas`) |
|---|---|
| El **motor de lucha**: un soldado contra otro y una fila contra otra. Escudo, golpe, parada, empujón, cansancio, herida, caída | Ejércitos, despliegue, órdenes, moral del ejército, campo, cámara y pantallas |
| Las **armas**: gladius, pilum, hasta, sarisa, falcata, espada gala larga, jabalina… y lo que cambia cada una (alcance, golpe de punta o de filo, contra escudo) | Qué tropa lleva qué arma (la ficha de tropa la da `data.js` / CG9; tú das cómo pelea esa arma) |
| La **lucha de manípulos**: el frente que choca, la fila que cansa y el **relevo** (hastati → principes → triarii) a nivel de hombres | La maniobra del manípulo en el campo (avanzar, girar, abrir hueco) |
| **Físicas**: `js/fisica-batalla.js` (cuerpos que no se atraviesan, empuje, pilum que se clava o rebota) | Las escenas que las usan (`escena.js`, `falange.js`, `bloque.js`) |
| **Proyectiles**: dónde cae cada pilum, flecha o piedra y qué hace (el dibujo de la estela es de Gráficos) | Quién tira y cuándo (`js/tiro.js`) |

La tabla viva es `gobierno/areas.json` → `combate`. Pregunta por un archivo: `node gobierno/juez-area.mjs --dueno <ruta>`.
- **Propios**: `js/combate.js` (el motor) y los `js/combate-*.js` (salvo `combate-poses.js`, de Animación),
  `js/fisica-batalla.js`, sus pruebas (`test/combate*.test.mjs` salvo `combate-poses`, `test/fisica-batalla.test.mjs`,
  `test/fi4-*`, `test/fu1-testudo`), las maquetas `combate-*/` y la de falange salvo sus piezas de movimiento y su campo,
  `gobierno/juez-combate.mjs` y `gobierno/captura-combate*.mjs`.
- **Ya no son tuyos** (DB0, 25/11): cuerpos y movimientos → **Animación**; `js/gfx/golpes.js` → **Gráficos**; taller de
  arte de soldados y maquetas `soldado-*/` → **Arte de soldados** (skill `arte`). El entorno «AQVILA Batallas taller» sigue
  valiendo para todos.
- **Falange y testudo** (pasaron a ti el 24/11, «Sí pasan»): `js/falange.js`, `falange-rivales.js`, `bloque.js`, `bloque-ia.js`,
  sus pruebas y `maquetas/falange/`. Desde CB3 el motor decide los caídos de «Bajar a pie» (`js/combate-tropas.js`).
- **De Animación** (no los cambias): `js/combate-poses.js` lee tu estado y saca la pose. Si falta un estado para pintar
  algo, te lo piden como pase; si cambias el estado de un hombre, avisa con un pase → Animación.
- **De Batallas** (no los cambias; les das la función y ellos la conectan): `guerra.js`, `battle.js`, `simulador.js`,
  `maquetas/a-pie/escena.js`, `maquetas/bloque/` y todas las pantallas.
- **Comunes** y **solo vigía**: igual que en todas las áreas (`MINISTERIOS.md` §4, R1).

Antes de cada commit: `node gobierno/juez-area.mjs combate --archivos`.

## Arquitectura del motor (no se reabre sin preguntar al usuario)
- **Sin pantalla**: `js/combate.js` corre en Node y en el navegador (como `fisica-batalla.js` y `bloque.js`). Recibe
  hombres con su equipo y su estado; devuelve qué hace cada uno y qué le pasa. No sabe nada de economía ni de cámara.
- **Un hombre tiene dos manos**: izquierda = escudo (o nada, o segunda arma), derecha = arma. Cada mano tiene su
  estado (alzado, golpeando, recuperando). El escudo cubre un **arco** delante y a la izquierda; quien entra por la
  derecha sin escudo o por la espalda pega más. Así salen solos el flanqueo y el valor de la formación cerrada.
- **El arma decide el golpe**: alcance, punta o filo, rapidez, cansancio y qué le hace a un escudo. Las cifras viven en
  una tabla del motor con su fuente histórica (skill `historia`); lo ajustado para que sea jugable se marca **licencia de juego**.
- **Manípulos**: el motor lleva cansancio y heridas por hombre; la fila delantera se agota y el relevo la sustituye.
  La batalla grande (miles) no simula cada golpe: usa el resultado medio del motor (tablas que el motor calcula y la
  prueba comprueba). Así cuadra con lo que ya hay en `battle.js` y `guerra.js`.
- **Lo que se ve sale del motor**: Animación pinta el estado de cada mano (escudo arriba, estocada, parada,
  empujón con el umbo, caer). Nada de animaciones que mientan sobre lo que pasa: el contrato es el estado del motor.
- **Rendimiento en móvil**: medir el coste por paso como en FI5 (0,29 ms). Si sube de 1 ms con la batalla a pie, se para y se dice.
  Meta de la 2.0: **1.000–2.000 por bando** fluidos; mide cuántos hombres caben en el presupuesto de cada paso.

## Cómo se prueba
| Cuándo | Orden |
|---|---|
| Mientras construyes | `node gobierno/juez-area.mjs combate --rapido` (física, falange, bloque y guerra: lo que usa el motor; `combate-poses` lo pasa Animación) |
| Para cerrar | `node gobierno/juez-area.mjs combate` (añade `juez-guerra.mjs` en navegador) y **mirar las capturas** |
| Si tocaste arte | lo añade solo: `arte.mjs` y `fichas.mjs` |
| Jueces completos | No los pasas tú: la sesión de subida |

Cada regla del motor lleva su prueba en Node con un caso que se pueda contar: «legionario con escudo de frente aguanta
X golpes de espada gala; sin escudo, Y»; «el relevo a tiempo gana a la misma tropa sin relevo». Capturas a 390×844 y
844×390 en `gobierno/capturas-tarea/CB<n>-*.jpg`, con el duelo de cerca: el usuario juzga por lo que ve.

## A quién pasas qué
- **Batallas**: para que tu motor salga en el juego, pase → Batallas con la llamada exacta (`Combate.paso(hombres, dt)` en `escena.js`).
- **Animación**: un estado nuevo de las manos o del cuerpo, para que lo pinte. **Gráficos**: el evento de un golpe o un
  impacto (chispa, sangre, polvo) y dónde cae un proyectil, para pintar su estela.
- **Examen de jugabilidad**: lo que se enseñe al usuario lo juzga antes otra sesión (`MINISTERIOS.md` §4d).
- **Sonido**: golpe en escudo, hierro contra hierro, grito al caer: pase → Director de Sonido (skill `sonido`) con el evento que emite el motor.
- **Historia**: armas, esgrima, relevo de líneas (Polibio VI, Livio VIII.8): dictamen con la skill `historia`, línea «Historia» del parte.
- **Común** (`data.js` para el arma de cada tropa, `sw.js`): pase en el parte, como en todas las áreas.
- **Decisión del usuario**: no pares; elige lo recomendado y déjala en el parte (`MINISTERIOS.md` R2).
- **Idea nueva**: línea «Idea:» en el parte.

## Cierre
Parte en `gobierno/partes/<fecha>-<ID>.md` con **Pases**, **Ideas**, **Decide el usuario** y el coste por paso medido.
Juez de área APTO, capturas vistas, commit y push a tu rama. Tablero y bitácora: avisa al vigía.
