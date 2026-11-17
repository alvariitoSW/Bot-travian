# Bases K7 · Ciudades, rutas, diplomacia y tropas (16/11/2026)
Pedido del usuario: «cómo sería la interfaz y la jugabilidad de la parte de las ciudades y fuera de las ciudades, mejorar las rutas de comercio y hacerlas parte del juego, mejorar la diplomacia y el movimiento de tropas».

## Entrega
Una maqueta jugable: UN archivo `index.html` (CSS y JS dentro, sin librerías, sin red, sin imágenes externas; SVG/CSS a mano) en tu carpeta. Móvil vertical 390×844. Datos de mentira pero coherentes.

## Guion común (las cuatro cosas tienen que poder hacerse con el dedo)
a) **Rutas de comercio**: abrir una ruta entre dos ciudades; ver el flujo (qué sale, qué entra, oro/mes); cortarla; protegerla (escolta o patrulla). Regla del juego: renta mensual = (4 + mercado de cada extremo si es tuya, o 1 por estrella si es ajena) ×1,5 por mar; coste de abrir 100 denarios; máx. de rutas por ciudad = 1 + mercado/3.
b) **Diplomacia en el mapa**: alianza, tributo, tratado (paz/comercio). Enlázala con el Senado: un tratado es una ley que se vota (ver `gobierno/maquetas/politica/` y `gobierno/estudios/EV1-politica.md`); aquí basta un botón «Proponer al Senado» y su resultado.
c) **Tropas fuera de la ciudad**: enviar una marcha, verla avanzar, interceptar una marcha enemiga, saquear.
d) **Ciudad ⇄ fuera de la ciudad** sin perderse: un gesto claro para pasar de una a otro y volver; siempre se sabe dónde estás.

## Reglas de diseño (el jurado las mide)
- Se entiende al primer toque, sin instrucciones. Pocas cosas en pantalla a la vez.
- Botones y zonas tocables ≥ 44×44 px. Texto ≥ 11 px (el principal 13+).
- Solo la paleta de `gobierno/estudios/E1-guia-de-arte.md`: Noche #0b1016, Rojo #c0281f, Oro #e9c063, Bronce #b8862b, Mármol #f1ead9, Piedra #9aa6b4, Oliva #8fae5a, Terracota #d9764a (y tonos de la misma familia solo para fondos). Iconos de línea SVG, no emojis. Esquinas 6–8 px.
- Todo en español, frases cortas, botones que dicen lo que hacen.
- Ciudades reales de `js/data.js` (Roma, Capua, Siracusa, Cartago…); no copies arte nuevo ni código de otros juegos (ideas sí).
- No toques nada fuera de tu carpeta. Tope: 40 pasos.
