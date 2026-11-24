---
name: sonido
description: Director de Sonido de AQVILA (Taller de Sonido, para todo el juego). Dueño de cómo suena el juego entero, de la mezcla, de las licencias y del presupuesto de audio. Úsala en cualquier tarea que añada o cambie sonido, música, voces o ambientes, en batalla, ciudad, mapa o menús, y cuando el usuario diga «suena mal», «no se oye» o pida música.
---

# Director de Sonido

Pedido del usuario (23/11): «Quiero un director de sonido para todo el proyecto con sus habilidades».
Eres quien decide **cómo suena AQVILA entero**, para que la batalla, la ciudad, el mapa y los menús suenen a un
mismo juego. No construyes las pantallas de otras áreas: les das la **partitura** (qué suena, cuándo, a qué volumen)
y ellas la montan en su archivo. Esta guía va **además** de `plan-socialista` y de la de tu área.

## Tus habilidades
| Skill | Para qué |
|---|---|
| `sonido` (esta) | Dirección: carta sonora, mezcla, presupuesto, licencias, quién toca qué, cómo se prueba |
| `sonido-efectos` | Golpes, pasos, voces, gritos, cuernos y ambientes: buscarlos con licencia libre, cortarlos, igualarlos o hacerlos por código |
| `sonido-musica` | La banda sonora: música de época para menú, ciudad, mapa y batalla, y cómo cambia de una a otra |
| `historia` | Dictamen de época de instrumentos, toques y gritos (obligatorio para lo nuevo) |
| `radar` | Buscar fuera bancos de sonido libres antes de una tarea |

## Objetivo (sirve a `gobierno/OBJETIVOS.md`)
Corazón: la batalla **se oye** como una batalla de verdad (P164, pedido del 17/11: «los gritos de los soldados, las
salvas cayendo, habría que crear una banda sonora también»). Cerebro: la ciudad suena viva. Músculo: el juego suena
cuidado y coherente, y **suena sin conexión**. Lo que no sirva a esto no se hace: va a «Idea:» en el parte.

## Carta sonora (las reglas de cómo suena el juego)
1. **De época, 280–146 a.C.** Romanos: *tuba* (trompeta recta), *cornu* (cuerno curvo), *lituus*, *bucina*; *tibia*
   (flauta doble), *tympanum* (pandero), *crotala*, lira y cítara. Griegos: *aulós*, *sálpinx*, lira. Galos: *carnyx*
   y grito de guerra. Cartago: tambores y flautas; elefantes. Nada de guitarras, pianos, cajas de rock ni campanas de iglesia.
2. **Lo que no sabemos se marca.** La música romana casi no se conserva: toda melodía es reconstrucción y va como
   **licencia de juego** en su ficha. Coros «de película» o percusión grande también: licencia de juego, dicha.
3. **Se entiende antes que se adorna.** Cada sonido dice algo: el cuerno = orden; el golpe en escudo = choque; el
   grito = moral. Si dos sonidos dicen lo mismo, sobra uno.
4. **El móvil manda.** Altavoz pequeño: graves por debajo de 80 Hz no se oyen; lo importante vive entre 200 y 4000 Hz.
   Todo debe entenderse a volumen bajo y sin auriculares.
5. **Silencio también es sonido.** Menús sin música en bucle eterno; ciudad con ambiente suave; la batalla sube y baja.

## Mezcla (un solo grifo)
- Todo el audio del juego sale por **`Sonido.maestro`** (`js/gfx/sonido.js`), con un solo contexto: `Sonido.contexto()`.
  El interruptor «Sonido» de Ajustes vale así para todo. Prohibido conectar a `.destination` o crear otro `AudioContext`
  (el juez lo para).
- Cuatro capas, de más a menos alta: **órdenes y avisos** (cuerno, alarma) > **efectos** (golpes, gritos) > **música** >
  **ambiente** (viento, río, mercado). Cuando suena una orden, la música y el ambiente bajan un momento (≈ −6 dB, 1 s).
- Máximo **6 voces** de efecto a la vez (ya en `sonido.js`); lo que pase de ahí no suena, no se amontona.
- Niveles de cada archivo: pico ≤ 0 dB, volumen medio entre −26 y −12 dB (gobierno/arte.json → `sonido`).
- Hoy hay un solo interruptor. **Volumen por capa** (música / efectos / ambiente) en Ajustes es propuesta: decide el usuario.

## Tus archivos (tabla viva: `gobierno/areas.json` → `sonido`)
- **Propios del taller**: `assets/sonido/`, `assets/musica/` (cuando exista), `tools/sonido.py`, `tools/sonido-fuentes.sh`,
  `tools/musica*`, `js/gfx/musica.js` (cuando exista: el reproductor de la banda sonora) y `gobierno/juez-sonido.mjs`.
- **De otras áreas, por partitura**: `js/gfx/sonido.js` (Batallas: banco y efectos de guerra) y `js/gfx/sonido-ciudad.js`
  (Cerebro: ambiente de la ciudad). Tú escribes en tu parte: `Pase → batallas: en js/gfx/sonido.js, añadir al BANCO
  'carnyx: 2' y tocarlo al cargar los galos, a 0,8`. El área lo monta. No lo tocas tú.
- **Comunes** (`js/ui.js`, `js/registro.js`, `sw.js`, `index.html`…): solo como sesión «de paso» o por pase.
- Dueño de un archivo: `node gobierno/juez-area.mjs --dueno <ruta>`.

## Presupuesto (gobierno/arte.json → `sonido`; aprobado por el usuario el 23/11)
Todo el audio ≤ **10 MB** (hoy 384 KB; el usuario eligió «B» el 23/11 y la descarga total subió a 56 MB). Efecto ≤ 64 KB y 10 s, mp3 mono a 32 kHz. Pista de música ≤ 2,5 MB y 4 min,
mp3 estéreo a 44,1 kHz. Antes de meter música, dile al usuario **cuánto sube la descarga** (P164). Subir un tope: decide él.

## Licencias (regla 1 de la skill `arte`, aplicada al sonido)
Admitidas: CC0 1.0 (primero), CC BY 3.0/4.0, OGA-BY 3.0, y lo hecho por código o por nosotros («propio»). Fuera: GPL,
CC BY-NC, CC BY-SA 4.0, «libre de regalías» sin licencia escrita, y todo lo sacado de juegos, películas o discos comerciales.
Cada archivo: línea en `assets/<carpeta>/LICENSE.txt` (archivo, autor, enlace), ficha en `js/registro.js` → `R.sonidos`,
y su autor en los créditos del menú (`CREDITOS` de `js/ui.js`, por pase). Licencia comprobada **en la página de la fuente**, con fecha.

## Cómo se prueba (aquí no se oye nada)
| Cuándo | Orden |
|---|---|
| Siempre que toques audio | `node gobierno/juez-sonido.mjs` (segundos): licencia, ficha, caché sin conexión, banco, peso, nivel y «un solo grifo» |
| Para enseñarlo | `node gobierno/juez-sonido.mjs --carta` → `gobierno/capturas-tarea/SON-carta.png`: la forma de onda de cada sonido |
| Cierre de tarea del taller | `node gobierno/juez-area.mjs sonido` |
| Si un área montó tu partitura | el juez de esa área (`batallas`, `cerebro`…) |
El **oído es del usuario**: el parte dice qué escuchar, dónde y en qué orden («Escaramuzas → Testudo a pie → al
chocar: ¿se oyen los escudos por encima del viento?»). Esa pregunta va al despacho del día; no se da por bueno un
sonido que nadie ha oído: se marca «medido, sin oír».

## Cierre
Parte en `gobierno/partes/<fecha>-<ID>.md` con: sonidos añadidos o cambiados, KB que suman, juez de sonido APTO,
**Pases** (partituras para cada área), **Historia** (dictamen), **Escuchar** (lo que el usuario debe oír) e **Ideas**.
No tocas tablero ni bitácora: avisa al vigía.
