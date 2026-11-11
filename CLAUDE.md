# AQVILA — reglas del proyecto

Juego de estrategia para **móvil y offline** ambientado en Roma (280–146 a.C.): gestión de ciudades y campaña en un
mapa, más batallas tácticas en 3D que se pueden ver y dirigir. Es una PWA: HTML, CSS y JavaScript sin compilación.

Este archivo son las reglas vigentes, cortas a propósito. Lo pendiente vive en `gobierno/TABLERO.md`.

## 1. Cómo trabaja el usuario
- Es médico, no programador: explícale en lenguaje llano y enséñale **capturas**; juzga por lo que ve.
- Juega en el móvil: piensa en 390 px de ancho (y en horizontal para las batallas).
- Referencias de lo que quiere: batallas y mapa «tipo Total War», ciudad y economía «tipo Travian/Ikariam».
  Se toman **ideas**, nunca su código ni su arte.
- Decide él: reglas, arquitectura, quitar cosas, cambios de aspecto grandes. Lo pequeño y obvio, se hace.

## 2. Arquitectura (no reabrir sin preguntar)
- **Dos sistemas separados**: campaña/ciudad (`js/game.js`, `js/data.js`) y guerra (`js/battle.js`). La batalla recibe
  dos ejércitos y devuelve bajas; no sabe nada de economía.
- **La lógica no toca la pantalla**: `data.js`, `game.js` y `battle.js` corren también en Node (pruebas).
  Todo lo visual está en `js/ui.js` y `js/gfx/`.
- **Sin dependencias en ejecución** salvo three.js 0.170, copiado en `js/vendor/` para funcionar sin conexión.
- **Arte**: modelos, animaciones y texturas vienen del juego libre 0 A.D. (Wildfire Games, **CC BY-SA 3.0**), convertidos
  con `tools/`. Obliga a citar al autor y compartir ese arte con la misma licencia (`assets/*/LICENSE.txt`, README y menú).
  Arte nuevo: solo con licencia libre verificada y su crédito. Nada extraído de juegos comerciales.
- Guardado en `localStorage` (`aqvila-save-v1`); al añadir campos, migrarlos en `G.load`.

## 3. Mapa del código
| Archivo | Qué hace |
|---|---|
| `js/data.js` | Edificios, unidades, facciones, ciudades, rutas, hechos históricos |
| `js/game.js` | Economía, población, mercado, puerto, colas, marchas, IA enemiga, eventos, guardado |
| `js/battle.js` | Simulación de batalla (regimientos, moral, flanqueo, carga) + vista 2D de reserva |
| `js/gfx/units.js` | Unidades reales: animación horneada en textura de huesos, retratos |
| `js/gfx/statics.js`, `ground.js` | Edificios, barcos, árboles; suelo con texturas y agua |
| `js/gfx/battle3d.js`, `map3d.js`, `city3d.js` | Las tres vistas 3D |
| `js/gfx/models.js` | Figuras sencillas de reserva si no cargan los modelos reales |
| `js/ui.js` | Paneles, modales, bucle principal |
| `tools/` | Conversión de arte de 0 A.D. (ver README) |

## 4. Cómo probar (obligatorio antes de dar algo por hecho)
- `node test/sim.test.js` — batallas, campaña completa con un bot, economía.
- Servir con `python3 -m http.server` y conducir con Playwright a 390×844 (Chromium con
  `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`); esperar ~10 s a que carguen los modelos.
  Comprobar sin errores de consola: nueva partida, construir, reclutar, atacar una ciudad, dirigir la batalla, recargar
  sin red. **Mirar las capturas**: muchos fallos solo se ven (etiquetas, escala, colores).
- Trampas conocidas: un comentario `//` en una línea larga anula el resto; en plantillas de texto, `\/` se pierde;
  los contenedores de etiquetas usan `overflow: clip` (si no, el navegador los desplaza al tocar).
- El rendimiento en un móvil real **no está medido** (aquí solo hay render por software).

## 5. Git
- Rama de trabajo `claude/roman-strategy-mobile-game-bx9oq2`; commit y push tras cada tanda verificada.
- No crear PR salvo que el usuario lo pida.

## 6. Redacción
Todo en español (interfaz, comentarios, documentos). Frases cortas. Los botones dicen lo que hacen.
