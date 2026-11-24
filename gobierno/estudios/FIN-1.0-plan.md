# Cerrar la 1.0: plan y cuellos de botella (24/11/2026)

Pedido del usuario (literal): «quiero concentrar los esfuerzos en finiquitar hoy el 1.0 e identificar todos los cuellos
de botella para que se termine sin que tenga que intervenir hasta ver el resultado final».
Estado de partida: `lista.json` 56 % (5 hechas, 10 a medias, 3 por hacer de 18).

## Cuellos de botella y su remedio
| # | Cuello | Remedio (regla desde hoy hasta la 1.0) |
|---|---|---|
| 1 | Preguntas al usuario que paran sesiones | Nadie le pregunta. Se elige lo recomendado y se apunta en el parte. Solo se le avisa al final |
| 2 | Archivos comunes (`game.js`, `data.js`, `ui.js`, `registro.js`, `style.css`, `sw.js`, `index.html`): uno a la vez | Las reglas y pantallas nuevas van en **archivos propios** con contrato. Un **enganche por área y ola**, en cola fija (abajo) |
| 3 | Jueces completos ≈ 1 h por subida | Cada sesión usa su juez de área (MIN4). Jueces completos **solo en los enganches y en la subida final** |
| 4 | Gasto disparado porque los constructores leen de más | Encargos cortos con archivos nombrados. El director no relee el repositorio entero |
| 5 | Ideas nuevas que alargan el final | **Congeladas hasta la 1.0**: van a la nevera. ED0 (edificios) pasa a después de la 1.0 |
| 6 | Conflictos en bitácora y tablero entre sesiones | Solo los vigías los tocan. Unión de líneas (`git merge-file --union`) si chocan |
| 7 | Dos coordinadores sin reparto claro | **Ciudad y Política** (L1, L2, L3, L5, L6, L7, L9 y la parte de ciudad de L13): sesión «Sesiones de ciudad y gobierno». **Batallas y publicación** (L10, L11, L12, L17, L15): vigía de AQVILA |
| 8 | Bot de campaña lento (≈18 min) y equilibrio al final | CE12 (equilibrio) corre una sola vez, al final, con los cuatro caminos ya puestos |
| 9 | Fallos que solo salen sin red | `test/sw-archivos.test.mjs` (CDe3) vigila que todo `js/` esté en la caché |

## Cola de Ciudad y Política
- **Ya, en paralelo y en archivos propios:**
  - CE10, caminos de victoria (L6, L7, L9).
  - CE5, «Este año» y tributo (L2).
  - MN3, gobernador (L13).
  - CS3, clases con sus personajes (L3).
  - MN4a, maqueta del aspecto con más imágenes y la tira de recursos bonita (L13).
- **En curso:** CDe3, la pantalla mínima con la agricultura y el mercado (L1, L2, L5).
- **Tras CDe3:**
  - CE4b, resto del mercado: aduanas, contratos del Senado y rivales (L2, L5).
  - CD2a, calles con el dedo (L1).
- **CDe4, enganche:** CE10, CE5, MN3, CS3, CE4b, CD2a, CD2b y MN4 aplicada. Jueces completos y subida.
- **CE12:** equilibrio de los cuatro caminos con el bot. Ajusta cifras y sube.

## Cola de Batallas (vigía)
- CG4b, la campaña con la batalla nueva.
- CG5, tribunos y plan previo.
- CG7, batalla rápida.
- CG8, la batalla más épica.
- CG9, datos por tropa.
- CG6c, duelo de cerca.
- GM43j, las caras.
- TP8c, lo que quedó de TP8.
- TH1, las tácticas.
- FI4.

Todas en paralelo cuando sus archivos lo permitan, con enganche y subida por tandas.

## Final (vigía)
SB final con jueces completos sobre todo unido, `lista.json` al 100 %, novedades escritas, subida a `main` y aviso al usuario (L15, V10b).
