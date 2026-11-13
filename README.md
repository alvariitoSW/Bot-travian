# 🦅 AQVILA — El ascenso de Roma

Juego de estrategia para **móvil y offline** ambientado en la República romana (280–146 a.C.).
Mezcla la gestión de ciudades y reclutamiento de los juegos de navegador clásicos con batallas
tácticas en tiempo real que puedes ver y dirigir, y una campaña con **principio y final**.

## Qué incluye

- **Mapa de campaña en 3D** — el Mediterráneo con relieve (Alpes, Apeninos, Pirineos, Atlas), mar, bosques,
  18 ciudades reales modeladas y ejércitos que marchan por rutas de tierra y mar. Es la pantalla principal.
- **Batallas en 3D** — cada soldado es un modelo real animado (marcha, carrera, ataque, muerte) en formación sobre un terreno con
  colinas, árboles y la ciudad asediada al fondo. Moral, huidas, flanqueos, cargas, proyectiles, polvo,
  estandartes y caídos. Cámara libre (arrastrar, pellizcar, girar), tarjetas de unidad y órdenes táctiles.
- **Ciudad en 3D** — cada ciudad es una escena con edificios romanos reales que aparecen al construirlos: foro,
  templo de Marte, cuartel, establo, herrería, aserradero, cantera, granja, almacén, mercado, puerto con barcos,
  ínsulas y muralla. Tres vistas: ciudad entera, a pie de calle (con ciudadanos paseando) y la guarnición formada
  ante la puerta, para ver de un vistazo el tamaño del ejército.
- **Economía** — madera, piedra, hierro, grano y denarios; **población** que crece con las ínsulas, paga impuestos y
  de la que salen los reclutas; **mercado** para cambiar recursos; **puerto** para embarcar ejércitos por mar y
  ganar con el comercio. Trece edificios mejorables con colas.
- **Ejército** — hastati, vélites, príncipes, triarios y équites, con retratos 3D; cada pueblo enemigo tiene
  sus propias tropas (falanges, hoplitas, honderos baleares, jinetes númidas, elefantes de guerra…).
- **General** — sube de nivel, reparte puntos en Mando, Disciplina y Logística, y puede caer herido.
- **Hechos reales** — Pirro, las Guerras Púnicas, Aníbal cruzando los Alpes, Cannas, Zama… en su año.
- **Final de partida** — ganas si conquistas **Carthago** antes de que acabe el 146 a.C.; pierdes si cae Roma.
- **Offline** — es una PWA: se instala en el móvil y funciona sin conexión. La partida se guarda sola.

## Cómo jugar

```bash
python3 -m http.server 8000   # o cualquier servidor estático
# abre http://localhost:8000
```

En el móvil: publica la carpeta en un alojamiento estático con HTTPS (por ejemplo GitHub Pages), ábrela en
Chrome o Safari y elige **«Añadir a pantalla de inicio»**. Las batallas se ven mejor con el móvil en horizontal.

## Estructura

| Archivo | Contenido |
| --- | --- |
| `js/data.js` | Edificios, unidades, facciones, ciudades, mapa y hechos históricos |
| `js/game.js` | Campaña: economía, colas, marchas, IA enemiga, eventos, guardado |
| `js/battle.js` | Simulación de batalla (y vista 2D de reserva si no hay WebGL) |
| `js/gfx/units.js` | Unidades reales: carga, animación horneada en textura y retratos |
| `js/gfx/models.js` | Figuras de reserva generadas por código |
| `js/gfx/battle3d.js` | Vista 3D de la batalla |
| `js/gfx/map3d.js` | Mapa de campaña 3D |
| `js/gfx/city3d.js` | Vista 3D de la ciudad (edificios, ciudadanos, guarnición) |
| `js/gfx/statics.js` | Edificios, murallas, barcos y árboles reales |
| `js/ui.js` | Interfaz: paneles, modales y pantalla de batalla |
| `js/vendor/` | three.js (MIT), incluido para funcionar sin conexión |
| `test/sim.test.js` | Pruebas sin navegador (`node test/sim.test.js`) |

Sin paso de compilación para jugar.

## Arte de las unidades

Los soldados, caballos, elefantes, civiles, edificios, barcos y árboles son modelos reales con esqueleto y animaciones (reposo, marcha, carrera,
ataque, muerte) tomados del juego libre **[0 A.D.](https://play0ad.com)**, de **Wildfire Games**, con licencia
**[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)** (ver `assets/units/LICENSE.txt` y `assets/static/LICENSE.txt`).
Esa licencia obliga a citar a Wildfire Games y a compartir este arte y sus modificaciones con la misma licencia.

La letra de los títulos es **Cinzel**, de The Cinzel Project Authors, con licencia **[SIL OFL 1.1](https://openfontlicense.org)**
(ver `assets/fuentes/LICENSE.txt`). Va incluida en el juego para que se vea igual sin conexión.
Los iconos de recursos son dibujos propios en SVG, dentro de `js/ui.js`.

Para regenerarlos hace falta un clon parcial de `github.com/0ad/0ad` y los cargadores de ejemplo de three.js:

```bash
tools/build_all.sh <clon de 0ad> <three/examples/jsm> <carpeta temporal>          # unidades
tools/build_static_all.sh <clon de 0ad> <three/examples/jsm> <carpeta temporal>   # edificios, barcos, árboles
```

`tools/resolve_units.py` decide qué actor de 0 A.D. es cada unidad; `tools/build_units.mjs` hornea cuerpo, piezas
y animaciones a `assets/units/*.bin`; `tools/build_atlas.py` compone las texturas; `tools/aligerar_static.mjs` (necesita el paquete npm `meshoptimizer`) aligera piezas que pasan del tope de triángulos. Si los modelos no cargan, el
juego usa figuras sencillas generadas por código (`js/gfx/models.js`).

## Datos del mapa
La costa viene de **Natural Earth** (dominio público; ver `assets/mapa/LICENSE.txt`). El relieve (`assets/mapa/alturas.js`) sale de
las *Terrain Tiles* (Terrarium, nivel 6) de Mapzen/Tilezen alojadas en AWS Open Data. Según la cabecera `x-amz-meta-x-imagery-sources`
de las 28 teselas usadas, solo contienen: **GMTED2010** (U.S. Geological Survey y NGA; *Global Multi-resolution Terrain Elevation Data 2010*,
dominio público) y **ETOPO1** (NOAA National Centers for Environmental Information, *ETOPO1 1 Arc-Minute Global Relief Model*, dominio público).
No aparecen SRTM ni EU-DEM. Se generan con `assets/mapa/generar-alturas.py`.

## Referencias consultadas

Proyectos abiertos de género parecido, útiles como inspiración de diseño (no se ha copiado código;
la mayoría son GPL/AGPL o no tienen licencia):

- [jurerotar/Pillage-First-Ask-Questions-Later](https://github.com/jurerotar/Pillage-First-Ask-Questions-Later) — alternativa de un jugador a los juegos de aldeas.
- [Areso/1255-burgomaster](https://github.com/Areso/1255-burgomaster) — gestión de ciudad con mecánicas de rol.
- [Venerons/civis](https://github.com/Venerons/civis) — 4X en JavaScript.
- [CesarAugustoAndrade/game-antiquity-battle-sim](https://github.com/CesarAugustoAndrade/game-antiquity-battle-sim) — simulador de batallas antiguas con formaciones y moral.
- [dimitarbez/battle-simulator](https://github.com/dimitarbez/battle-simulator) — simulador de batallas en tiempo real.
- [tvdboom/augustus](https://github.com/tvdboom/augustus) — estrategia histórica multijugador.
