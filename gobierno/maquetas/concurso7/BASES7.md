# Bases de la ronda K8 · Pantallas que no se parecen (12/11/2026)

## Qué pide el usuario (literal)
- «No me gusta ninguna que se repita»: que las pantallas de una misma ronda **no se parezcan entre sí**, en la disposición
  de la pantalla, no solo en el arte.
- La batalla tiene que: 1) **planearse**; 2) **verse en directo o por turnos**, para hacer estrategia (flancos, caballería,
  emboscadas); 3) **verse a las tropas moverse y luchar**. Mapa en grande, turnos y entretenido.
- Lo que gustó como idea: **mantener una posición varios días** en una ciudad, pueblo o puesto, con los recursos de esas
  tropas; **un consejo** con tres opciones por turno; **ver las tropas** en el campo.

## Lo que hay que cumplir de verdad: cinco disposiciones distintas
Cada concursante usa **una** disposición de la lista y no puede parecerse a las otras cuatro en la disposición:
- **L1 · Campo entero**: el mapa ocupa toda la pantalla; el HUD solo en las esquinas, flotando.
- **L2 · Dos mitades**: mapa a la izquierda y escena a la derecha, con una línea divisoria.
- **L3 · Tres franjas**: una franja superior de turno, el campo en el centro y una bandeja inferior de órdenes.
- **L4 · Capas**: el mapa de fondo y la escena en una ventana flotante inferior que se puede cerrar.
- **L5 · Columna lateral**: el campo a la derecha y una columna estrecha a la izquierda con tropas, recursos y consejo.

Además, cada una tiene una **dirección de arte** propia, distinta de las de K6 y K7 (fresco, moneda, tablilla de cera, viñetas,
manuscrito y el resto de las ya usadas). Puedes elegirla tú.

## Reglas comunes
- Un solo HTML autocontenido, sin dependencias externas. Cinzel desde `../../../assets/fuentes/cinzel-700.woff2`.
- **Horizontal, 844×390**, sin scroll en cada pantalla. Español. Frases cortas. Cada botón dice lo que hace.
- Arte: solo de 0 A.D. (CC BY-SA, en `assets/`) o hecho a mano en SVG/CSS.
- Tocas **solo** tus archivos en `gobierno/maquetas/concurso7/`. No abras otros archivos del repositorio.
- **Cuatro pantallas**: (1) planear la batalla; (2) turno en directo con flancos, caballería o emboscada; (3) tropas
  moviéndose y luchando; (4) resultado, o ocupar y mantener la posición unos días.
- **Presupuesto: 0,15 M de tokens y como mucho 8 llamadas de herramienta.** Escribe el HTML (250 a 400 líneas), capturas
  las cuatro pantallas **una sola vez** con Playwright y comprueba la consola. No mires tus capturas.
- Playwright: Chromium ya instalado. `require('playwright')` desde cualquier carpeta; `chromium.launch()` sin opciones;
  viewport 844×390 y `deviceScaleFactor: 2`. No instales nada.

## Entrega (K8-N-nombre)
1. `gobierno/maquetas/concurso7/K8-N-nombre.html`
2. Capturas en `gobierno/maquetas/concurso7/capturas/K8-N-1.jpg` a `-4.jpg`.
3. `gobierno/maquetas/concurso7/K8-N-nombre-nota.md`, siete líneas numeradas:
   1. La idea. 2. Cómo se maneja con el pulgar y cómo pasa del mapa a la escena. 3. Botones a la vista.
   4. Dirección de arte y de dónde sale. 5. Cómo escala (20 y 30 regimientos, 1.500 m) y cómo se vive el turno.
   6. Qué cambiar en el juego (solo proponer). 7. Coste estimado en tareas.
   La nota no lleva el nombre de la disposición ni del concepto.
4. Responde al terminar con tres líneas.
