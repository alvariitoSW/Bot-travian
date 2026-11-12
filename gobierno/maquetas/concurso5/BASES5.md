# Bases de la ronda K6d · Campaña y batalla (12/11/2026)

## Qué pide el usuario (literal, resumido)
- Lo que gusta: **Ruta y relevo** (K6b-4): ocupar una ciudad, pueblo o puesto, planear los recursos de esas tropas y
  mantener la posición unos días. **Consejo de tribunos** (K6b-3): «chulo». **Cartas de campaña** (K6c-3): ver las tropas.
- Lo que no gusta: señales, tabula de caminos, planos de arquitecto, mapa-tablero, tablero de juego, reloj de agua, dados.
- Tres cosas que tiene que hacer la batalla:
  1. **Planear la batalla.**
  2. **Verla en directo o por turnos**, para hacer estrategia: atacar por los flancos, con la caballería o con emboscadas.
  3. **Ver a las tropas moverse y luchar.**
- Mapa en grande y turnos, y que sea entretenido.

## Lo que ya hay en el juego (punto de partida)
- Batalla por rondas: plan en pausa y luego se ejecuta para los dos bandos. Cinco puntos de mando por ronda.
- Generales con radio de 200 m; fuera de él la orden llega 6 s tarde. Tres cartas por batalla (arenga, paso doble, cerrada).
- Formaciones: línea, tres líneas, alas fuertes, testudo, cuña, orbe, falange. Terreno: colina, bosque, río con vados, pantano.
- Tropas con papel: ligera, media, pesada, lanceros, tiradores, caballería que arrolla a los ligeros.

## Reglas comunes
- Un solo HTML autocontenido, sin dependencias externas. Cinzel desde `../../../assets/fuentes/cinzel-700.woff2`.
- **Horizontal, 844×390**, sin scroll en cada pantalla. Español. Frases cortas.
- Arte: solo de 0 A.D. (CC BY-SA, en `assets/`) o hecho a mano en SVG/CSS.
- Tocas **solo** tus archivos en `gobierno/maquetas/concurso5/`. No toques nada más.
- Puedes **leer hasta tres capturas de referencia** en `gobierno/maquetas/concurso4/capturas/` (K6b-4-1, K6b-3-1, K6c-3-1). No abras otros archivos.
- **Cuatro pantallas**: (1) planear la batalla con el mapa en grande; (2) turno en directo con flancos o emboscadas;
  (3) las tropas moviéndose y luchando; (4) resultado, o ocupar y mantener la posición unos días.
- **Presupuesto: 0,15 M de tokens y como mucho 8 llamadas de herramienta.** Escribe el HTML (300 a 500 líneas),
  capturas las cuatro pantallas **una sola vez** con Playwright y comprueba la consola. **No mires tus capturas** y no
  hagas segundas pasadas: el usuario las mira.
- Playwright: Chromium ya instalado. `require('playwright')` desde cualquier carpeta; `chromium.launch()` sin opciones;
  viewport 844×390 y `deviceScaleFactor: 2`. No instales nada.

## Los cinco conceptos (uno por concursante)
- **K6d-1 · Guarnición**: ocupas un pueblo y lo mantienes unos días. Planeas recursos para la tropa. Cuando llega el
  enemigo, el consejo de tribunos da tres opciones por turno.
- **K6d-2 · Cartas en el campo**: cada turno eliges cartas de maniobra (flanquear, emboscar, carga de caballería). Se ven las tropas moverse en el mapa grande.
- **K6d-3 · Directo por turnos**: la batalla corre en vivo con botón de pausa por turno; flancos, caballería y emboscadas se ven en el mapa.
- **K6d-4 · Tres días**: mantener una posición varios días, con barra de grano y madera por tropa; la batalla llega cuando te atacan.
- **K6d-5 · Emboscada oculta**: colocas tropas escondidas antes del turno; al mover, se revelan y luchan a la vista.

## Entrega (K6d-N-nombre)
1. `gobierno/maquetas/concurso5/K6d-N-nombre.html`
2. Capturas en `gobierno/maquetas/concurso5/capturas/K6d-N-1.jpg` a `-4.jpg`.
3. `gobierno/maquetas/concurso5/K6d-N-nombre-nota.md`, siete líneas numeradas:
   1. La idea (una frase). 2. Cómo se maneja con el pulgar y cómo pasa del mapa a la escena. 3. Botones a la vista.
   4. Dirección de arte y de dónde sale. 5. Cómo escala (20 y 30 regimientos, 1.500 m) y cómo se vive el turno.
   6. Qué cambiar en el juego (solo proponer). 7. Coste estimado en tareas.
   La nota no lleva el nombre del concepto.
4. Responde al terminar con tres líneas: el HTML, las capturas y la nota.
