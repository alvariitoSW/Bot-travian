---
name: arte
description: Ministerio de Arte de AQVILA. Dueño de `tools/`, de las licencias y del presupuesto de peso y triángulos. Úsala en cualquier tarea que añada, convierta o cambie modelos, texturas, animaciones o iconos (carril E y afines). El sonido y la música son del Director de Sonido (skill `sonido`).
---

# Arte

## Qué es suyo
- `tools/`: la conversión del arte de 0 A.D. (ver README).
- `assets/` y sus `LICENSE.txt`.
- El presupuesto: `gobierno/arte.json`. Lo cambia solo el usuario.
- El juez: `node gobierno/arte.mjs` (peso, triángulos por pieza, licencias y créditos).

## Taller común (ministerios por área, 23/11; `gobierno/MINISTERIOS.md`)
- El taller guarda las reglas, las licencias, el presupuesto y las herramientas de **todo** el arte.
- Cada área lleva el arte de lo suyo: **Batallas**, soldados y tropas (`assets/soldados/`, `units/`, `tools/blender/`); **Arte de Mapas** (skill `arte-mapas`, 25/11), el mapa de campaña (`assets/mapa/`, `assets/mapa-*/`, `tools/mapa-*`); el taller, **edificios y menús** (`assets/static/`, `fuentes/`, el resto de `tools/`).
- **Sonido y música**: Taller de Sonido (skill `sonido`, 23/11): `assets/sonido/`, `assets/musica/`, `tools/sonido*`. Usa estas mismas reglas de licencia.
- Una sesión del taller trabaja por encargo de un área (un pase) y cierra con `node gobierno/juez-area.mjs arte`
  y las capturas de la pieza junto a un soldado. Dueño de cada archivo: `node gobierno/juez-area.mjs --dueno <ruta>`.
- Blender sin pantalla, Quaternius y MakeHuman: entorno «AQVILA Batallas taller» (`gobierno/entornos/batallas-taller.md`); sirve también al taller común.

## Reglas
1. **Licencia antes que píxeles.** Solo entra arte con licencia libre comprobada en su fuente. Hoy todo es de 0 A.D. (Wildfire Games, CC BY-SA 3.0). Otra fuente: decide el usuario. **Decidido el 16/11/2026**: se admite arte externo solo si una tarea lo pide, de Kenney y Quaternius (CC0, primero) y de OpenGameArt con licencia CC0, CC-BY, CC-BY-SA 3.0 u OGA-BY. Se descartan GPL, CC-BY-SA 4.0 y toda obra de licencia poco clara. Cada obra: ficha en `js/registro.js`, licencia y enlace de su página, y crédito. Textos de las licencias en `gobierno/repositorios.md`.
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
