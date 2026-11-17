# Maqueta GM44 · Soldados nuevos (hastatus y guerrero galo)

**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/soldado-rome2/
Arrastra para girar, pellizca para acercar. Botones: movimientos (Quieto, Andar, En guardia, Lanzar, Golpear, Cubrirse,
Caer) y vistas (Uno, La cara, Romano y galo, Ver 40, La línea, Comparar niveles).

## Archivos
- `index.html`, `vista.js` (escena y botones), `soldado.js` (carga y sombreador), `captura.mjs` (capturas).
- `datos/`: por soldado y nivel, un `.bin` (malla, pesos y movimientos), un `.json` y cuatro `.webp`. 8,6 MB en total.
- `construir/`: los programas de Python que lo fabrican todo (`python3 construir.py hastatus|galo [--lod|--lod2]`).
  Necesitan los datos de origen fuera del repositorio (ver abajo) y solo numpy y Pillow.

## Arte y licencias
| Parte | Fuente | Licencia |
|---|---|---|
| Cuerpo, esqueleto, pesos y deformadores | MakeHuman 1.3.2 (`base.obj`, `default.mhskel`, `default_weights.mhw`, `targets.npz`), https://github.com/makehumancommunity/makehuman, LICENSE.md apartado C | **CC0 1.0** |
| Movimientos | Quaternius, Universal Animation Library 1 y 2 (Standard), https://opengameart.org/content/universal-animation-library y `-2` | **CC0 1.0** |
| Equipo, ropa, texturas, escena | Hechos por código en `construir/` y `vista.js` | Arte propio del proyecto |
No se usa código de MakeHuman (es AGPL): solo sus datos. Nada de juegos comerciales. Al llevarlo al juego: ficha en
`js/registro.js` y crédito a MakeHuman y Quaternius (CC0 no obliga, pero se cita).

## Medidas (17/11/2026, GM44b)
| | Fino | Ligero | Medio | Fondo |
|---|---|---|---|---|
| Hastatus (triángulos) | 13 796 | 4 139 | 1 033 | 442 |
| Galo (triángulos) | 13 970 | 3 643 | 956 | 436 |
| Se usa cuando el hombre mide en pantalla | 200 px o más | 90 a 200 | 42 a 90 | menos de 42, o fuera de pantalla |
| Huesos | 74 | 36 | 36 | 36 |

Cada hombre se dibuja con el nivel que su tamaño en pantalla puede enseñar (`repartir()` en `vista.js`); como mucho 40
finos (`gobierno/arte.json`). Una llamada de dibujo por tipo y nivel. Triángulos reales medidos (incluida la escena):

| Hombres | Sin sombras | Con sombras | Llamadas |
|---|---|---|---|
| 40 | 220 000 | 420 000 | 8 a 10 |
| 160 | 270 000 | 475 000 | 9 a 13 |
| 640 (320 + 320) | 500 000 | 720 000 a 755 000 | 9 a 13 |
| 1 280 | 800 000 | 1 060 000 | 10 a 13 |
| 640 vistos desde arriba y lejos | 325 000 | 380 000 | 8 a 9 |

Antes (GM44r): 640 = 1,45 M sin sombras y 2,4 M con sombras. Descarga: 8,6 MB los dos soldados con sus cuatro niveles.
Imágenes por segundo: sin medir (aquí no hay tarjeta gráfica).

## Reconstruir
Los datos de origen no están en el repositorio. `MH_DATOS` = carpeta con `base.obj`, `default.mhskel`,
`default_weights.mhw` y `targets/macrodetails/*.target` (de `makehuman/data/` en el repositorio de MakeHuman);
`UAL_DATOS` = carpeta con `ual1/AnimationLibrary_Godot_Standard.glb` y `ual2/UAL2_Standard.glb` (OpenGameArt).
`python3 construir.py hastatus|galo [--lod|--lod2|--lod3]`.

## Lo que falta
Una sola cara por pueblo (cambia la forma de la cabeza, el pelo, la barba y la piel, pero no los rasgos); la carrillera
del yelmo es tosca; ropa pegada al cuerpo (no cuelga ni ondea); el golpe es un tajo, falta la estocada; no hay duelos ni
caídos; el galo no lleva capa ni casco; faltan las demás tropas. Para batallas de miles de hombres haría falta el
cartón de GM33 para los que midan menos de unos 25 px: es una decisión del usuario.
