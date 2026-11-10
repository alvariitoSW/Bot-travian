# 🦅 AQVILA — El ascenso de Roma

Juego de estrategia para **móvil y offline** ambientado en la República romana (280–146 a.C.).
Mezcla la gestión de ciudades y reclutamiento de los juegos de navegador clásicos con batallas
tácticas en tiempo real que puedes ver y dirigir, y una campaña con **principio y final**.

## Qué incluye

- **Ciudades y recursos** — madera, piedra, hierro, grano y denarios. Diez edificios mejorables
  (aserradero, cantera, mina, granja, foro, almacén, cuartel, establo, muralla, templo de Marte),
  con colas de construcción y de instrucción. Las tropas consumen grano.
- **Ejército romano** — hastati, vélites, príncipes, triarios y équites; cada pueblo enemigo tiene
  su propio ejército (falanges, hoplitas, honderos baleares, jinetes númidas, elefantes de guerra…).
- **Héroe** — tu general sube de nivel, reparte puntos en Mando, Disciplina y Logística, combate
  con su guardia y puede caer herido.
- **Batallas visibles** — regimientos en formación, moral, huidas, flanqueos, cargas de caballería,
  proyectiles y murallas. Puedes dar órdenes (tocar regimiento → tocar destino u objetivo), dejar
  que luchen solos o resolverlas al instante.
- **Mapa de campaña** — 18 ciudades reales del Mediterráneo unidas por rutas terrestres y marítimas.
- **Hechos reales** — Pirro y sus elefantes, las Guerras Púnicas, Aníbal cruzando los Alpes, Cannas,
  Zama, Cinoscéfalas… aparecen en su año y cambian la partida.
- **Final de partida** — ganas si conquistas **Carthago** antes de que acabe el 146 a.C.; pierdes si
  cae Roma o se agota el tiempo.
- **Offline** — es una PWA: se instala en el móvil y funciona sin conexión. La partida se guarda sola.

## Cómo jugar

En el ordenador:

```bash
python3 -m http.server 8000   # o cualquier servidor estático
# abre http://localhost:8000
```

En el móvil: publica la carpeta en cualquier alojamiento estático con HTTPS (por ejemplo GitHub
Pages: *Settings → Pages → Deploy from a branch*), abre la dirección en Chrome o Safari y elige
**«Añadir a pantalla de inicio»**. A partir de ahí funciona sin conexión.

## Estructura

| Archivo | Contenido |
| --- | --- |
| `js/data.js` | Edificios, unidades, facciones, ciudades, mapa y hechos históricos |
| `js/game.js` | Campaña: economía, colas, marchas, IA enemiga, eventos, guardado |
| `js/battle.js` | Simulación de batalla y su dibujo en canvas |
| `js/ui.js` | Interfaz: pestañas, mapa, modales y pantalla de batalla |
| `sw.js`, `manifest.webmanifest` | Instalación y funcionamiento offline |
| `test/sim.test.js` | Pruebas sin navegador (`node test/sim.test.js`) |

Sin dependencias ni paso de compilación: HTML, CSS y JavaScript puro.

## Referencias consultadas

Proyectos abiertos de género parecido, útiles como inspiración de diseño (no se ha copiado código;
la mayoría son GPL/AGPL o no tienen licencia):

- [jurerotar/Pillage-First-Ask-Questions-Later](https://github.com/jurerotar/Pillage-First-Ask-Questions-Later) — alternativa de un jugador a los juegos de aldeas.
- [Areso/1255-burgomaster](https://github.com/Areso/1255-burgomaster) — gestión de ciudad con mecánicas de rol.
- [Venerons/civis](https://github.com/Venerons/civis) — 4X en JavaScript.
- [CesarAugustoAndrade/game-antiquity-battle-sim](https://github.com/CesarAugustoAndrade/game-antiquity-battle-sim) — simulador de batallas antiguas con formaciones y moral.
- [dimitarbez/battle-simulator](https://github.com/dimitarbez/battle-simulator) — simulador de batallas en tiempo real.
- [tvdboom/augustus](https://github.com/tvdboom/augustus) — estrategia histórica multijugador.
