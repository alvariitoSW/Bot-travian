# Bases de la ronda K9 · Bosque y cerámica (13/11/2026)

## Qué pide el usuario (literal, resumido)
- «Mezcla bosque y cerámica, pero enfatiza en la parte visual de guerra, y en la parte de estrategia.»
- Lectura aprobada: **bosque como estilo visual** (paleta de hojas, tierra y verde, sombra de sotobosque) y **cerámica** como
  forma de la pantalla (ánfora, figuras rojas sobre negro, bandejas de barro). Más peso en lo visual de la guerra
  (tropas, choque, polvo, estandartes) y en la estrategia (planear, flanquear, emboscar, mantener posición).
- Tres cosas que tiene que hacer la batalla: 1) **planearla**; 2) **verla en directo o por turnos** para hacer estrategia
  (flancos, caballería, emboscadas); 3) **ver a las tropas moverse y luchar**. Mapa en grande, turnos, entretenido.
- Ideas que gustaron antes: mantener una posición varios días con sus recursos; consejo con tres opciones por turno;
  ver las tropas en el campo.

## Lo que hay que evitar
- Repetir la dirección de arte de K8: cianotipo y bronce ya salieron dos veces. Tampoco fresco, moneda, tablilla de cera,
  viñetas ni manuscrito.
- Pantallas que se parezcan entre sí en la disposición. Cada concursante usa una disposición distinta de la lista de abajo.

## Tres variantes (una por concursante); cada una con una disposición distinta
- **K9-1 · Ánfora y bosque**: el campo es un claro de bosque visto desde arriba, con sotobosque y sombra; el HUD es una
  bandeja de barro en la parte inferior. Disposición **L1 · Campo entero** (HUD en las esquinas).
- **K9-2 · Friso de bosque**: la batalla se ve en perfil con hojas y troncos como marco; figuras de cerámica de figuras
  rojas. Disposición **L2 · Dos mitades** (mapa a la izquierda, escena a la derecha).
- **K9-3 · Vaso de caza**: el mapa es una superficie de vaso con el bosque en el centro; las órdenes salen en un anillo
  de barro alrededor del dedo. Disposición **L4 · Capas** (escena en ventana flotante abajo).

## Cómo se debe ver (lo que el jurado mirará)
- **Visual de guerra**: tropas legibles a 844×390, con choque, polvo y estandartes; el bosque da cobertura y se ve.
- **Estrategia**: planear, ver el turno, emboscar en el bosque, flanquear por el claro, y decidir si se mantiene la posición.
- **Escala**: 20 y 30 regimientos, 1.500 m de campo, un río.

## Reglas comunes
- Un solo HTML autocontenido, sin dependencias externas. Cinzel desde `../../../assets/fuentes/cinzel-700.woff2`.
- **Horizontal, 844×390**, sin scroll. Español. Frases cortas. Cada botón dice lo que hace.
- Arte: solo de 0 A.D. (CC BY-SA, en `assets/`) o hecho a mano en SVG/CSS.
- Tocas **solo** tus archivos en `gobierno/maquetas/concurso8/`. Puedes leer hasta dos capturas de `gobierno/maquetas/concurso7/capturas/` (K8-3-1 y K8-1-1). No abras otros archivos.
- **Cuatro pantallas**: (1) planear la batalla; (2) turno en directo con emboscada o flanco; (3) tropas moviéndose y luchando;
  (4) resultado, o mantener la posición unos días.
- **Presupuesto: 0,3 M de tokens y como mucho 10 llamadas de herramienta.** Escribe el HTML (250 a 400 líneas), capturas
  las cuatro pantallas **una sola vez** con Playwright y comprueba la consola. **No mires tus capturas.**
- Playwright: Chromium ya instalado. `require('playwright')` desde cualquier carpeta; `chromium.launch()` sin opciones;
  viewport 844×390 y `deviceScaleFactor: 2`. No instales nada.

## Entrega (K9-N-nombre)
1. `gobierno/maquetas/concurso8/K9-N-nombre.html`
2. Capturas en `gobierno/maquetas/concurso8/capturas/K9-N-1.jpg` a `-4.jpg`.
3. `gobierno/maquetas/concurso8/K9-N-nombre-nota.md`, siete líneas numeradas:
   1. La idea. 2. Cómo se maneja con el pulgar y cómo pasa del mapa a la escena. 3. Botones a la vista.
   4. Dirección de arte y de dónde sale. 5. Cómo escala y cómo se vive el turno.
   6. Qué cambiar en el juego (solo proponer). 7. Coste estimado en tareas.
   La nota no lleva el nombre del concepto ni de la disposición.
4. Responde al terminar con tres líneas.
