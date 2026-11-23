---
name: sonido-efectos
description: Habilidad del Director de Sonido de AQVILA para efectos, voces y ambientes (golpes de escudo y hierro, pasos, pilum, gritos, quejidos, cuernos, viento, río, mercado). Úsala cuando haya que buscar, cortar, igualar, sintetizar o sustituir un sonido corto o un ambiente.
---

# Efectos, voces y ambientes

Primero lee la skill `sonido` (carta sonora, mezcla, licencias, presupuesto). Esta dice **cómo se hace**.

## Lo que ya hay (no lo rehagas sin motivo)
- **36 sonidos grabados CC0** en `assets/sonido/` (GM43i, 20/11): madera, hierro, escudo, paso, vuelo, esfuerzo, herido,
  coro, grito, clamor, cuerno, lucha y viento. Autor y enlace de cada uno en `assets/sonido/LICENSE.txt`.
- **El banco** de `js/gfx/sonido.js`: `BANCO = { grupo: variantes }`; toca una variante al azar sin repetir la última.
  Mientras no carga, suena la síntesis de antes (ruido filtrado y tonos).
- **El ambiente de la ciudad** en `js/gfx/sonido-ciudad.js`: todo por código (viento, río, martillos, forja, mercado,
  recuas, pájaros, cigarras, grillos), sin archivos.

## Elegir: grabado o por código
| Por código (WebAudio) | Grabado (mp3) |
|---|---|
| Ambientes largos que se repiten (viento, río, multitud lejana) | Voces humanas, gritos, cuernos de verdad |
| Pesa 0 KB; varía solo | Golpes con carácter (escudo, hierro, madera) |
| Suena «a sintetizador» si se abusa | Cada variante pesa 2–40 KB |
Regla: lo que lleva voz o un instrumento de época, grabado. Lo que es aire o agua, por código.

## Buscar (con licencia antes que oído)
1. Primero CC0: OpenGameArt (filtro de licencia CC0), Freesound (filtro «Creative Commons 0»), Kenney.
   Luego CC BY con crédito. `opengameart.org` está abierto en el entorno «AQVILA Batallas taller»; Freesound pide
   cuenta para bajar: si hace falta, pregunta en el parte.
2. Apunta en la fuente: autor, licencia tal como la página la dice, enlace y fecha de la comprobación.
3. Añade la fuente a `tools/sonido-fuentes.sh` (para que se pueda rehacer todo desde cero).

## Cortar, igualar, comprimir
`tools/sonido.py` (numpy + ffmpeg): `trozo` (corta), `iguala` (pico a −1 o −2 dB), `fundidos` (sin chasquidos),
`bucle` (el final se funde con el principio), `suave` (quita siseo). Salida: mp3 mono 32 kHz, VBR calidad 7.
```
sh tools/sonido-fuentes.sh <carpeta-fuentes>      # una vez
python3 -I tools/sonido.py <carpeta-fuentes> assets/sonido
node gobierno/juez-sonido.mjs --carta
```
- Varias variantes (3–4) de lo que suena mucho (golpes, pasos): el oído caza la repetición enseguida.
- Que suenen parejas: si el juez avisa «sonará flojo» o «fuerte», se iguala en `sonido.py`, no a mano en el código.
- Nombres: `<grupo><n>.mp3`, en minúsculas y sin tildes (así los pide el banco).

## Al añadir un sonido nuevo (lista completa)
1. mp3 en `assets/sonido/` con `tools/sonido.py`.
2. Línea en `assets/sonido/LICENSE.txt`.
3. **Pases** (archivos de otros): ficha en `js/registro.js` → `R.sonidos`; ruta en la lista `FILES` de `sw.js`;
   autor en `CREDITOS` de `js/ui.js` si es nuevo; grupo en `BANCO` de `js/gfx/sonido.js` (Batallas) y dónde suena.
4. `node gobierno/juez-sonido.mjs`: APTO (sin la caché o la ficha, el juez dice NO APTO hasta que el pase entre).
5. Dictamen de `historia` si es un instrumento, un grito o una voz de un pueblo.

## Voces
- **Regla del usuario (23/11)**: toda palabra que se entienda debe ser **español, griego antiguo o latín**. Nada de inglés ni idiomas inventados (élfico, etc.). Gritos sin palabra, sí. Latín y griego con dictamen de `historia`.
- Los pueblos se distinguen: romanos en orden y a golpe de cuerno; galos y celtíberos, gritos y carnyx; griegos, peán
  antes de cargar (dictamen de `historia`).
