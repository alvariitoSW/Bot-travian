# Maqueta GM44 · Soldados nuevos (hastatus y guerrero galo)

**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/soldado-rome2/
Arrastra para girar, pellizca para acercar. Botones: movimientos (Quieto, Andar, En guardia, Lanzar, Golpear, Cubrirse,
Caer) y vistas (Uno, La cara, Romano y galo, Ver 40, La línea).

## Archivos
- `index.html`, `vista.js` (escena y botones), `soldado.js` (carga y sombreador), `captura.mjs` (capturas).
- `datos/`: por soldado y nivel, un `.bin` (malla, pesos y movimientos), un `.json` y cuatro `.webp`. 7,8 MB en total.
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

## Medidas (17/11/2026)
| | Fino | Ligero | Fondo |
|---|---|---|---|
| Hastatus (triángulos) | 13 561 | 3 970 | 980 |
| Galo (triángulos) | 13 957 | 3 538 | 897 |
| Huesos | 74 | 36 | 36 |
40 finos: 545 000 triángulos, 7 llamadas de dibujo con la escena. Línea de 640: 1,45 M (2,4 M con sombras), 13 llamadas.
Imágenes por segundo: sin medir (aquí no hay tarjeta gráfica).

## Lo que falta
Una sola cara por pueblo; ropa pegada al cuerpo (no cuelga ni ondea); el golpe es un tajo, falta la estocada; no hay
duelos ni caídos; de fondo haría falta el cartón de GM33; el galo no lleva capa ni casco; faltan las demás tropas.
