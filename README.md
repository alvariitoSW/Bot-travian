# 🦅 AQVILA — El ascenso de Roma

Juego de estrategia para **móvil y offline** ambientado en la República romana (280–146 a.C.).
Mezcla la gestión de ciudades y reclutamiento de los juegos de navegador clásicos con batallas
tácticas en tiempo real que puedes ver y dirigir, y una campaña con **principio y final**.

## Qué incluye

- **Mapa de campaña en 3D** — el Mediterráneo con relieve (Alpes, Apeninos, Pirineos, Atlas), mar, bosques,
  18 ciudades reales modeladas y ejércitos que marchan por rutas de tierra y mar. Es la pantalla principal.
- **Batallas en 3D** — cada soldado es una figura animada (marcha, ataque) en formación sobre un terreno con
  colinas, árboles y la ciudad asediada al fondo. Moral, huidas, flanqueos, cargas, proyectiles, polvo,
  estandartes y caídos. Cámara libre (arrastrar, pellizcar, girar), tarjetas de unidad y órdenes táctiles.
- **Ciudades y recursos** — madera, piedra, hierro, grano y denarios; diez edificios mejorables con colas.
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
| `js/gfx/models.js` | Modelos 3D procedurales de las unidades, animación por shader y retratos |
| `js/gfx/battle3d.js` | Vista 3D de la batalla |
| `js/gfx/map3d.js` | Mapa de campaña 3D |
| `js/ui.js` | Interfaz: paneles, modales y pantalla de batalla |
| `js/vendor/` | three.js (MIT), incluido para funcionar sin conexión |
| `test/sim.test.js` | Pruebas sin navegador (`node test/sim.test.js`) |

Sin paso de compilación. Todos los modelos se generan por código: no hay arte de terceros.

## Referencias consultadas

Proyectos abiertos de género parecido, útiles como inspiración de diseño (no se ha copiado código;
la mayoría son GPL/AGPL o no tienen licencia):

- [jurerotar/Pillage-First-Ask-Questions-Later](https://github.com/jurerotar/Pillage-First-Ask-Questions-Later) — alternativa de un jugador a los juegos de aldeas.
- [Areso/1255-burgomaster](https://github.com/Areso/1255-burgomaster) — gestión de ciudad con mecánicas de rol.
- [Venerons/civis](https://github.com/Venerons/civis) — 4X en JavaScript.
- [CesarAugustoAndrade/game-antiquity-battle-sim](https://github.com/CesarAugustoAndrade/game-antiquity-battle-sim) — simulador de batallas antiguas con formaciones y moral.
- [dimitarbez/battle-simulator](https://github.com/dimitarbez/battle-simulator) — simulador de batallas en tiempo real.
- [tvdboom/augustus](https://github.com/tvdboom/augustus) — estrategia histórica multijugador.
