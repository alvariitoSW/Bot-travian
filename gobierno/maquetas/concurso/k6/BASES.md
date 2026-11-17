# Bases K6 · Batalla: cómo se ven y se manejan las tropas (17/11/2026)
Pedido del usuario: «un concurso de arte sobre mejorar la parte de batalla, la estrategia de manejar las tropas».

## Entrega
UN archivo `index.html` en tu carpeta (CSS y JS dentro, sin librerías ni red; SVG/CSS a mano). **Horizontal 844×390**
(móvil de lado). Datos de mentira pero coherentes: Roma contra Cartago o Pirro, 8 a 12 regimientos por bando
(infantería hastati/principes/triarii, velites, caballería, elefantes), campo abierto. NO uses el navegador:
yo hago las capturas. Máximo 15 pasos. Escribe el archivo de una vez y revisa solo leyendo.

## Qué debe poder hacerse con el dedo (todo en la maqueta, aunque sea simulado)
1. Ver de un vistazo qué es cada regimiento (tipo, bando, tamaño, moral, si está cansado o rodeado).
2. Elegir uno o varios regimientos.
3. Dar una orden: mover, atacar, aguantar, relevar, cargar con caballería, retirarse.
4. Ver una carga o un flanqueo y su efecto en la moral.
5. Que el campo de batalla ocupe casi toda la pantalla: la interfaz es mínima y no tapa las tropas.

## Reglas de diseño (el jurado las mide)
- Botones y zonas tocables ≥ 44 px. Texto ≥ 11 px (el importante 13+). Pulgar: lo frecuente abajo a los lados.
- Paleta de `gobierno/estudios/E1-guia-de-arte.md`: Noche #0b1016, Rojo #c0281f, Oro #e9c063, Bronce #b8862b,
  Mármol #f1ead9, Piedra #9aa6b4, Oliva #8fae5a, Terracota #d9764a. Iconos de línea SVG, nada de emojis.
- Español, frases cortas, botones que dicen lo que hacen. Roma 280–146 a.C.
- Ideas de otros juegos sí; código y arte de juegos comerciales, nunca.
- Solo escribes en tu carpeta. La maqueta debe verse bien SIN interacción (primera impresión) y responder al tocar.

## Conceptos (uno por concursante; tu concepto manda, hazlo distinto de los demás)
- **A · Bloques de color**: cada regimiento es un bloque limpio, color por tipo, con un icono y un anillo de moral.
  Sin figuras. Máxima claridad con 20+ unidades. Órdenes con un menú pequeño junto al bloque.
- **B · Miniaturas**: figuras dibujadas en SVG (siluetas de legionario, jinete, elefante) en filas, vista inclinada
  tipo maqueta; el arte es el protagonista. Órdenes con una tira de botones abajo.
- **C · Trazo**: pausa táctica. Se arrastra el dedo para dibujar la ruta o el frente; flechas de ataque y de
  flanqueo; luego «Ejecutar». Casi sin botones.
- **D · Estandartes y señales**: cada regimiento es un estandarte (signum, vexillum, águila); se ordena con
  cuernos y trompetas (iconos de señal); la moral se ve en la tela. HUD casi inexistente.
- **E · Tácticas en cartas**: mano de 4 cartas de táctica abajo (Cuña, Doble línea, Flanqueo, Retirada ordenada);
  se arrastra la carta sobre un grupo; vista de campo ancha con lo mínimo.
