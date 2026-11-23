# Parte · CV4a (cierre) Vuelta de aspecto del plano de la ciudad · 23/11/2026
**Resultado**: hecha; **sin publicar**, en la rama `ccr-eda89860-50oj5c`. Con esto CV4a queda completa a falta de subida (jueces completos y pases).
**Pedido** (usuario, literal, 23/11): «Quiero continuar con la ciudad para terminarla». Sesión de relevo de «Ciudad generada por IA». Sirve a la línea del Cerebro (ciudad) de `OBJETIVOS.md`. Vara: `capturas-tarea/P190-maqueta-ciudad-plano.png`.
**Qué cambia para el jugador** (solo al pulsar «Plano»; de cerca la luz y el suelo son los de siempre):
- La ciudad llena el ancho del móvil (antes ocupaba la mitad) y se encuadra por su contorno de verdad, no por un círculo alrededor del foro.
- Suelo verde oliva con color, sin el velo pardo; luz clara y neutra, sombras suaves y sin manchas de nubes.
- Tejados de barro rojo (antes granate apagado).
- Campos de cultivo todo alrededor de la urbe (antes cuatro manchas grises): llegan más lejos, ninguno se mete dentro de la urbe y en invierno el trigo ya verdea.
- Más casas y más pegadas a la calle: 927 de relleno en Roma (antes 741). Las calles de adorno se pintan más estrechas.
- Más travesías entre calles casi paralelas: 168 calles en Roma (antes 132); el este ya no queda ralo. Hay casas en la vega baja del noreste.
**Cómo**: un número `uPlano` (0 de cerca, 1 en plano) que leen el suelo, las casas y los campos. El relleno usa una rejilla fina de 1 m solo para la vista (la de 4 m del juego dejaba media calle sin casas). No toca `E.ocup`, economía ni azar; `E.urbe.RU` no cambia.
**Archivos**: `js/gfx/city3d.js` (luz y encuadre del plano), `js/gfx/roma-siglo.js` (`rellenoUrbe`), `js/gfx/campos.js` (vega y colores), `js/ciudad.js` (`urbe`: sitio de las travesías), `js/gfx/ground.js` (suelo en plano, calles estrechas), `gobierno/captura-cv4a.mjs` (nueva).
**Jueces**: `node gobierno/juez-area.mjs cerebro` APTO (5 pruebas, 75 s); `test/ciudad.test.mjs` sin fallos. `--archivos`: `ground.js` sale VETADO (es del Músculo): va como pase, figura en los archivos aprobados de CV4a en el tablero. Jueces completos: no pasados (los pasa la sesión de subida).
**Capturas** (390×844, miradas por el director): `capturas-tarea/CV4a-final-antes-despues.jpg`, `CV4a-final.jpg` (Roma, enero), `CV4a-final-capua.jpg` (Capua, mayo). La anterior quedó como `CV4a-plano-trazado.jpg`. Sin errores de consola; 216 mil triángulos y 38 llamadas en plano (antes 207 mil).
**Se ve flojo**: en la mitad oeste de Roma siguen calles blancas con pocas casas (ladera fuerte y solares del jugador); los árboles se ven como cruces oscuras desde arriba; la muralla es una raya fina de madera, no la cerca de piedra clara de la maqueta; el barbecho de invierno sale algo naranja; todas las casas siguen iguales y nada destaca (eso es CV4b). La vista de cerca en invierno sigue oscura (no era de esta tarea).
**No comprobado**: móvil real (aquí solo render por software); Tarento, Siracusa y Cartago en plano; partidas guardadas con muchos años; el coste de los campos de más en un móvil flojo (unos 5 mil triángulos).
**Historia**: trigo de invierno verde en enero (siembra de otoño): saber común de agricultura mediterránea, sin cita; por cotejar con la skill `historia`. Casas en la vega baja (Velabro): licencia de juego. Livio 5.55 sigue por cotejar.
**Pases**: Pase → Músculo: `js/gfx/ground.js`, tres trozos ya hechos en esta rama: (1) uniforme `uPlano` en el suelo de `crearSuelo3` y el bloque «CV4a: en la vista de plano…» antes de `diffuseColor.rgb`; (2) calles de adorno a `c.w * 1.5` en `pintarCiudad3`; (3) la franja del surco de la sesión anterior. Pase → común: subir la caché en `sw.js` (archivos tocados: los de arriba; ninguno nuevo en `js/`). Aviso al vigía: `gobierno/captura-cv4a.mjs` no tiene dueño en `areas.json`.
**Ideas**: Idea: copas de árbol redondas y opacas en plano, para que no se vean las cruces. Idea: en plano, pintar la muralla con un trazo claro más ancho, como en la maqueta.
**Decide el usuario**:
- **Publicar la ciudad**: ¿se sube ya CV1 + CV4a o se espera a CV4b? (A) subir ya [recomendado]; (B) esperar. Por qué: el plano ya se parece a la maqueta y lo quiere ver en el juego.
- **Publicar el pilum** (PIL2): falta su «publícalo»; cómo subirlo sin arrastrar lo demás, en el parte de relevo.
- **Publicar el menú despejado** (MD1) y si las pestañas «Lo hago yo · Encargar · Gobernador» siguen ocultas.
**Cuentas**: sin agentes. Esta sesión corrió con el modelo que tenía configurado (Fable), no con Opus como manda la regla del 18/11: el relevo la abrió así; lo dejo dicho para que el vigía lo corrija en la siguiente. Gasto: la cifra de `gasto.mjs` de esta sesión.
