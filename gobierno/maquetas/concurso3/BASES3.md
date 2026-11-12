# Bases del concurso K6 — batalla y manejo de tropas (12/11/2026)

## Qué pidió el usuario (literal, resumido)
«Quiero un concurso de arte sobre mejorar la parte de batalla de la app de estrategia: manejar las tropas.» Cinco modelos,
todos distintos, que compitan por el mejor proyecto **artístico, escalable e intuitivo**. Que se vea cómo se maneja
una batalla, no solo cómo se ve.

## Lo que ya hay en el juego (no lo inventes; cuéntalo como punto de partida)
- Campo ancho, de 1.200 a 1.500 m de frente. Colina, bosque, río con tres vados, pantano y paso estrecho.
- Batalla por **rondas**: en cada ronda se planea con pausa y luego se ejecuta para los dos bandos («planeas y luego miras»).
- 20 regimientos o más por bando, cada uno con su estandarte. Moral de Firme a Huye, cansancio, tropa bisoña que se curte.
- Órdenes: cargar, avanzar, flanquear, retirar, aguantar, hostigar, relevar. Formaciones: línea, tres líneas, alas fuertes,
  testudo, cuña, orbe, falange.
- Mando: el general da órdenes con radio de 200 m; fuera de él, la orden llega 6 s tarde. 5 puntos de mando por ronda.
  Tres cartas por batalla (arenga, paso doble, cerrada).
- Enemigo que elige uno de cinco planes y avisa su gesto en cada ronda.
- Tres objetivos: resistir, tomar la zona, escapar con el general. Tres dificultades.
- Infantería ligera, media, pesada y lanceros; caballería que arrolla a los ligeros y carga por flanco o espalda; tiradores que
  disparan por encima de su infantería.
- Vista 3D horizontal (844×390), con cámara «Seguir».

## Lo que ya se vio y NO se repite (K1, K2 y K4)
Ya probados: rueda radial de órdenes, trazo de flechas con el dedo, mesa cenital de fichas de madera, partitura en el tiempo,
mano de cartas de unidades, fantasmas a 10/20/30 s, estandartes clavados en el campo, mosaico y cerámica de figuras rojas,
miniaturas con peanas. Un concepto que repita uno de estos no gana: se busca algo distinto.

## Los tres criterios (el jurado puntúa de 0 a 5 cada uno)
1. **ARTÍSTICO**: dirección de arte reconocible de Roma republicana (280–146 a.C.), no «app genérica». Coherente, con mano.
2. **ESCALABLE**: sigue sirviendo con 20 regimientos por bando, 1.500 m de campo, un río y un enemigo que avisa. Enseña
   cómo: una pantalla con 30 regimientos o una nota con la regla.
3. **INTUITIVO**: «prueba de los 5 segundos» (un jugador nuevo sabe qué pasa y qué tocar), «prueba del pulgar» (lo
   frecuente al alcance de una mano, botones de 44 px o más, texto de 13 px o más) y pocos botones a la vista.

## Lo que hay que resolver: el manejo de las tropas
Cada tropa tiene velocidad, formación y papel: infantería delante, tiradores detrás, caballería que carga y arrolla.
Se tiene que ver de un vistazo **quién obedece, quién tarda y quién está en peligro**. Una batalla no puede ser un combate
a lo loco: se decide en el plan y se ve en la ejecución.

## Los cinco conceptos (uno por concursante; no cambies de concepto)
- **K6-A · Mensajeros**: el campo es un plano topográfico en colores de tierra (ocre, oliva, azul de río, curvas de nivel).
  Las órdenes salen del general y viajan con jinetes mensajeros que se ven moverse por el mapa: la orden llega al regimiento
  cuando llega el jinete. El enemigo también envía. Control: tocar un regimiento y luego su destino.
- **K6-B · Friso**: la batalla es un bajorrelieve de piedra clara (marfil y gris, sombras de talla), en perfil lateral, como un
  friso de la Columna de Trajano (idea, nunca copia). Las líneas son franjas: caballería arriba, infantería en medio, tiradores
  abajo. Se desliza el friso con el dedo para seguir el choque. Orden: tocar una figura y arrastrarla hacia delante o atrás.
- **K6-C · Casillas**: el campo es una cuadrícula de hexágonos dibujada como grabado de cobre (tinta negra y ocre, tramas).
  Planeas en pausa y al ejecutar avanzan por casillas en pasos visibles. Control: tocar una casilla. Sin 3D.
- **K6-D · A pie**: el jugador es el general a pie, en tercera persona. Camina entre las tropas: las que están a menos de
  200 m obedecen al instante; las demás llegan 6 s tarde. Dar una orden: mantener pulsado sobre un regimiento y elegir.
  Puedes usar `gobierno/capturas-tarea/N15-hud.jpg` como fondo de campo (solo lectura).
- **K6-E · Cuaderno de campo**: la batalla está en el cuaderno del general. Cada ronda es una página, con papel crema, tinta
  azul-negra y lápiz rojo. Los regimientos son dibujos a tinta con su estandarte. Las órdenes se escriben en el margen con una
  flecha. Pasar la página ejecuta la ronda, y el informe es la página siguiente.

## Reglas comunes
- Un solo HTML autocontenido. Sin dependencias externas. La letra Cinzel puede cargarse desde
  `../../../assets/fuentes/cinzel-700.woff2` (ruta relativa desde tu archivo).
- **Horizontal, 844×390** (la batalla es en horizontal). Sin scroll en cada pantalla.
- Español en todo; frases cortas. Cada botón dice lo que hace.
- Arte: solo de 0 A.D. (CC BY-SA, en `assets/`) o hecho a mano en SVG/CSS. Si usas una captura real del juego, cítala en la nota.
  Ideas de otros juegos sí; código ni arte de juegos comerciales, nunca.
- Tocas **solo** tus archivos en `gobierno/maquetas/concurso3/` (HTML, nota y capturas). No toques `js/`, `css/`,
  `index.html`, `sw.js`, `gobierno/capturas-tarea/` ni `gobierno/estudios/`. Puedes leer lo que haga falta.
- **Cuatro pantallas**, en este orden: (1) despliegue antes de la batalla; (2) órdenes en pleno choque con 20 o más regimientos;
  (3) carga o flanqueo; (4) resultado o retirada.
- Presupuesto: **0,2 M de tokens como máximo**. Una sola pasada: escribir el HTML (400 a 800 líneas), capturar las cuatro
  pantallas con Playwright, mirar cada captura (Read), arreglar solo lo que esté roto (texto cortado, solapes, escala) y
  volver a capturar solo lo arreglado. **Sin rondas de pulido.** Como mucho 30 llamadas de herramienta.
- Playwright: Chromium ya está instalado. `require('playwright')` funciona desde cualquier carpeta; `chromium.launch()` sin
  opciones; viewport 844×390 y `deviceScaleFactor: 2`. No instales nada ni ejecutes `playwright install`.

## Entrega (K6-LETRA-nombre, por ejemplo K6-A-mensajeros)
1. `gobierno/maquetas/concurso3/K6-LETRA-nombre.html`
2. Capturas JPG en `gobierno/maquetas/concurso3/capturas/K6-LETRA-1.jpg`, `-2.jpg`, `-3.jpg`, `-4.jpg`, una por pantalla.
3. `gobierno/maquetas/concurso3/K6-LETRA-nombre-nota.md`, con **siete líneas numeradas**:
   1. La idea (en una frase).
   2. Cómo se maneja con el pulgar.
   3. Cuántos botones a la vista.
   4. Dirección de arte y de dónde sale.
   5. Cómo escala (a 20 y 30 regimientos, a 1.500 m).
   6. Qué habría que cambiar en el juego (`js/ui.js`, `js/gfx/battle3d.js`, `js/battle.js`). Solo proponer; no tocar.
   7. Coste estimado en tareas.
   **La nota es ciega**: no pongas tu nombre de concepto, ni tu letra en el título, ni el nombre del modelo.
4. Al terminar responde con tres líneas: el HTML, las capturas y la nota. Nada más.
