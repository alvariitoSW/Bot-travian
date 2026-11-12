# Bases del concurso K7 · Batalla desde cero (12/11/2026)

## Qué pide el usuario (literal, resumido)
- Ninguna de las rondas anteriores gustó del todo. Quiere **cambiar todo**: empezar **de cero**, con maquetas que mejoren el diseño.
- La batalla tiene que cumplir tres cosas:
  1. **Planear la batalla.**
  2. **Verla en directo o por turnos**, para hacer estrategia: atacar por los flancos, con la caballería o con emboscadas.
  3. **Ver a las tropas moverse y luchar.**
- Además: **mapa en grande**, **turnos** y que sea **entretenido**.
- Lo que gustó como idea (no como diseño a copiar): **Ruta y relevo** (ocupar una ciudad, pueblo o puesto, planear los recursos
  de esas tropas y mantener la posición unos días); **Consejo de tribunos** (cada turno, tres opciones claras); **ver las tropas**
  (Cartas de campaña).
- No gustó: señales, tabula de caminos, planos de arquitecto, mapa-tablero, tablero de juego, reloj de agua, dados.

## Lo que ya hay en el juego (punto de partida, no lo inventes)
- Batalla por rondas: plan en pausa y luego se ejecuta para los dos bandos. Cinco puntos de mando por ronda.
- Generales con radio de 200 m; fuera de él, la orden llega 6 s tarde. Tres cartas por batalla (arenga, paso doble, cerrada).
- Formaciones: línea, tres líneas, alas fuertes, testudo, cuña, orbe, falange. Terreno: colina, bosque, río con vados, pantano.
- Tropas con papel: ligera, media, pesada, lanceros, tiradores, caballería que arrolla a los ligeros.
- Ciudad, pueblo y puesto: la tropa puede ocupar un sitio y mantenerlo varios días.

## Lo que hay que mejorar respecto a las rondas anteriores
- Aspecto: que parezca un juego de verdad, con luz, profundidad y letra cuidada, y no una maqueta plana.
- Claridad: un jugador nuevo entiende qué pasa en la primera pantalla.
- Movimiento: se ve a las tropas moverse y luchar, no solo botones.

## Los cinco conceptos (uno por concursante; cada uno con una dirección de arte distinta)
Cada concursante elige la **interacción** de su propuesta, pero debe cumplir las tres cosas y la ruta de días. Direcciones de arte:
- **K7-1 · Fresco pompeyano**: el campo es un fresco de pared con sombras; paneles como nichos; tropas en rojo pompeyano y negro.
- **K7-2 · Denario**: la interfaz es la cara de una moneda romana (bronce y plata); el campo es el reverso; los turnos son giros de la moneda.
- **K7-3 · Tablilla de cera**: las órdenes se escriben con el estilete en una tablilla de cera; cada turno se borra y se reescribe.
- **K7-4 · Viñetas de campaña**: cada turno es una viñeta de cómic con tinta; las tropas se mueven entre viñetas.
- **K7-5 · Manuscrito iluminado**: página de manuscrito con miniaturas y márgenes; las órdenes se anotan al margen.

## Reglas comunes
- Un solo HTML autocontenido, sin dependencias externas. Cinzel desde `../../../assets/fuentes/cinzel-700.woff2`.
- **Horizontal, 844×390**, sin scroll en cada pantalla. Español. Frases cortas. Cada botón dice lo que hace.
- Arte: solo de 0 A.D. (CC BY-SA, en `assets/`) o hecho a mano en SVG/CSS.
- Tocas **solo** tus archivos en `gobierno/maquetas/concurso6/`. Puedes leer hasta **dos** capturas de referencia de `gobierno/maquetas/concurso4/capturas/` (K6b-4-1 y K6b-3-1). No abras otros archivos.
- **Cuatro pantallas**, en este orden: (1) planear la batalla con el mapa en grande; (2) turno en directo con flancos, caballería o emboscada; (3) tropas moviéndose y luchando; (4) resultado, o ocupar y mantener la posición unos días.
- **Presupuesto: 0,2 M de tokens y como mucho 8 llamadas de herramienta.** Escribe el HTML (250 a 450 líneas), capturas las cuatro pantallas **una sola vez** con Playwright y comprueba la consola. **No mires tus capturas**: el usuario las mira.
- Playwright: Chromium ya instalado. `require('playwright')` desde cualquier carpeta; `chromium.launch()` sin opciones; viewport 844×390 y `deviceScaleFactor: 2`. No instales nada.

## Entrega (K7-N-nombre)
1. `gobierno/maquetas/concurso6/K7-N-nombre.html`
2. Capturas en `gobierno/maquetas/concurso6/capturas/K7-N-1.jpg` a `-4.jpg`.
3. `gobierno/maquetas/concurso6/K7-N-nombre-nota.md`, siete líneas numeradas:
   1. La idea (una frase). 2. Cómo se maneja con el pulgar y cómo pasa del mapa a la escena. 3. Botones a la vista.
   4. Dirección de arte y de dónde sale. 5. Cómo escala (20 y 30 regimientos, 1.500 m) y cómo se vive el turno.
   6. Qué cambiar en el juego (solo proponer). 7. Coste estimado en tareas.
   La nota no lleva el nombre del concepto ni de la dirección de arte.
4. Responde al terminar con tres líneas: el HTML, las capturas y la nota.
