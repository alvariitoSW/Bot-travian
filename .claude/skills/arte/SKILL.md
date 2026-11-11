---
name: arte
description: Ministerio de Arte de AQVILA. Dueño de `tools/`, de las licencias y del presupuesto de peso y triángulos. Úsala en cualquier tarea que añada, convierta o cambie modelos, texturas, animaciones, iconos o sonido (carril E y afines).
---

# Arte

## Qué es suyo
- `tools/`: la conversión del arte de 0 A.D. (ver README).
- `assets/` y sus `LICENSE.txt`.
- El presupuesto: `gobierno/arte.json`. Lo cambia solo el usuario.
- El juez: `node gobierno/arte.mjs` (peso, triángulos por pieza, licencias y créditos).

## Reglas
1. **Licencia antes que píxeles.** Solo entra arte con licencia libre comprobada en su fuente. Hoy todo es de 0 A.D. (Wildfire Games, CC BY-SA 3.0). Otra fuente: decide el usuario.
2. **CC BY-SA obliga a tres cosas**: citar a Wildfire Games, enlazar la licencia y compartir ese arte (y lo que se derive de él) con la misma licencia. El crédito va en `assets/*/LICENSE.txt`, en el README y en el menú del juego. El código del juego es aparte.
3. **Nada de juegos comerciales**: ni extraído, ni calcado, ni «inspirado» píxel a píxel.
4. **Coherencia de época**: 280–146 a.C. Cada pueblo con lo suyo (romano, cartaginés, griego, galo, íbero). Sin legionarios imperiales ni castillos.
5. **Arte derivado** (retoques, atlas, iconos hechos a partir de 0 A.D.) hereda la CC BY-SA. El arte propio hecho desde cero lleva su licencia apuntada.

## Presupuesto (provisional hasta que el usuario lo apruebe y se mida en un móvil real)
Está en `gobierno/arte.json`: descarga total, triángulos por unidad y por edificio. Si una pieza no cabe, se simplifica o no entra. Subir el tope es una decisión del usuario.

## Al añadir o cambiar arte
1. Apunta la fuente y la licencia exactas antes de convertir.
2. Convierte con `tools/` (hace falta un clon parcial de `0ad/0ad`; ver README). No edites a mano los `.bin`.
3. Actualiza el índice (`units.json` o `static.json`), el `LICENSE.txt` si cambia la fuente, y `sw.js` si hay archivos nuevos que deban ir en la caché.
4. `node gobierno/arte.mjs` y `node gobierno/jueces.mjs`: los dos APTO.
5. Mira las capturas: escala junto a un soldado, color junto al resto, lectura a 390 px.
6. En el parte: piezas añadidas, megas que suma y triángulos de la mayor.
