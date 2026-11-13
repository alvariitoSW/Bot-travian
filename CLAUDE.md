# AQVILA — reglas del proyecto

Juego de estrategia para **móvil y offline** ambientado en Roma (280–146 a.C.): gestión de ciudades y campaña en un
mapa, más batallas tácticas en 3D que se pueden ver y dirigir. Es una PWA: HTML, CSS y JavaScript sin compilación.

Este archivo son las reglas vigentes, cortas a propósito. Lo pendiente vive en `gobierno/TABLERO.md` (tareas
aprobadas, por carriles) y `gobierno/BITACORA.md` (decisiones del usuario, lo que espera algo suyo y el encargo de la
próxima sesión). **Una sesión, una tarea**: al terminar se apunta en el tablero y se cierra.
Cómo se trabaja cada sesión: §7 (gobierno).

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
| `js/registro.js` | Una ficha por pieza de `data.js`: arte (modelo, licencia) y fuente histórica con su dictamen. Sin números; casa por id. Juez: `node gobierno/fichas.mjs` |
| `js/game.js` | Economía, población, mercado, puerto, colas, marchas, IA enemiga, eventos, guardado |
| `js/battle.js` | Simulación de batalla (regimientos, moral, flanqueo, carga) + vista 2D de reserva |
| `js/gfx/units.js` | Unidades reales: animación horneada en textura de huesos, retratos |
| `js/gfx/statics.js`, `ground.js` | Edificios, barcos, árboles; suelo con texturas y agua |
| `js/gfx/battle3d.js`, `map3d.js`, `city3d.js` | Las tres vistas 3D |
| `js/gfx/models.js` | Figuras sencillas de reserva si no cargan los modelos reales |
| `js/ui.js` | Paneles, modales, bucle principal |
| `tools/` | Conversión de arte de 0 A.D. (ver README) |

## 4. Cómo probar (obligatorio antes de dar algo por hecho)
- **Un solo comando: `node gobierno/jueces.mjs`** (unos 3 minutos). Pasa la lógica, recorre el juego en un navegador a
  390×844 y deja capturas e informe en `gobierno/capturas/`. Debe decir APTO. `--rapido` pasa solo la lógica.
- `node test/sim.test.js` — batallas, campaña completa con un bot, economía.
- A mano, para lo que el recorrido no cubre: servir con `python3 -m http.server` y conducir con Playwright a 390×844 (Chromium con
  `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`); esperar ~10 s a que carguen los modelos.
  Comprobar sin errores de consola: nueva partida, construir, reclutar, atacar una ciudad, dirigir la batalla, recargar
  sin red. **Mirar las capturas**: muchos fallos solo se ven (etiquetas, escala, colores).
- Trampas conocidas: un comentario `//` en una línea larga anula el resto; en plantillas de texto, `\/` se pierde;
  los contenedores de etiquetas usan `overflow: clip` (si no, el navegador los desplaza al tocar).
- Rendimiento en móvil real: el usuario lo probó el 13/11 y va fluido (aquí solo hay render por software; no está medido en cifras).

## 5. Git
- Rama de trabajo: `claude/roman-strategy-mobile-game-bx9oq2` (desde ella se publica el juego), salvo que la sesión
  asigne otra. Solo se sube una tarea terminada y con los jueces en APTO: lo que se sube, se publica.
- No crear PR salvo que el usuario lo pida.

## 6. Redacción
Todo en español (interfaz, comentarios, documentos). Frases cortas. Los botones dicen lo que hacen.

## 7. Gobierno (cómo se trabaja cada sesión)
Guía de una página: `gobierno/LEEME.md`. Lo esencial:
- **Empezar**: skill `plan-socialista`. Aplica los pedidos del cuadro de mando, elige UNA tarea y la reparte según su
  tamaño: pequeña, el director solo; media o grande, agentes `constructor`, `verificador` y `revisor`.
- **Cerrar**: jueces APTO, mirar las capturas, tablero y bitácora al día, parte en `gobierno/partes/`, cuadro
  publicado, commit y push.
- **El usuario pide o decide algo**: skill `bitacora`. Nada entra al tablero sin su aprobación.
- **Arte**: skill `arte` y `node gobierno/arte.mjs` (peso, triángulos, licencias). Presupuesto en `gobierno/arte.json`.
- **Historia**: skill `historia`. Todo contenido de época lleva fuente y dictamen histórico; lo cambiado para poder
  jugar se marca como licencia de juego.
- **Mirar fuera**: skills `ingenieria-reversa` (una mecánica de otro juego) y `radar` (arte libre, técnica, historia).
  Ideas sí; código y arte de juegos comerciales, nunca.
- **Gasto**: presupuesto antes de empezar y `node gobierno/gasto.mjs` al cerrar. El director no construye; los
  agentes van en Sonnet. La skill `ahorro` revisa los partes y propone recortes.
- **Cuadro de mando** (Artifact para el móvil del usuario): dirección en `gobierno/cuadro.json`; skill `cuadro-de-mando`.
