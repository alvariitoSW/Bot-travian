# Contrato de enganche del aspecto nuevo (MN4a → CDe4)

Maqueta: `gobierno/maquetas/aspecto/index.html` (se edita a mano; capturas con `node capturas.mjs`).
Piezas: `css/aspecto.css` (todo bajo `body.aspecto`, variables `--as-*`) y `assets/iconos/*.svg` (20 iconos, 9 KB).

## Enganche (mínimo)
1. `index.html`: `<link rel="stylesheet" href="css/aspecto.css">` justo después de `css/style.css`.
2. `js/ui.js` al arrancar: `document.body.classList.add('aspecto')` (quitar la clase lo apaga todo).
3. `sw.js`: añadir `css/aspecto.css` y los 20 `assets/iconos/*.svg` a la lista de caché y subir la versión de la caché.
4. Créditos: `assets/iconos/LICENSE.txt` ya está; citarlo en «Créditos» (Proyecto AQVILA, CC BY-SA 3.0).

## Marcado que debe emitir ui.js (por pieza)
- **Tira `#res`**: cada `.r` = `<img class="ico" src="assets/iconos/grano.svg" alt="">` + `<b>` cifra + `<small>▲</small>` (clase `neg` si ▼).
  Sustituir `D.RES_ICON` (emoji/SVG de línea) por esas imágenes; nombres: grano, denarios, materiales, hierro, hombres, aceite, vino, verdura, lana.
  5 caben en una fila; con 9 pasan a dos filas solas (rejilla de 5). Ocultar `small.alm`.
- **Barra `#tabs`**: seis `<button><i><img src="assets/iconos/nav-ciudad.svg" alt=""></i>Ciudad</button>` (nav-senado, saber, tropas, mapa, imperio). `.on` = activo.
- **Costes** (`costHtml`, `costPlanHtml`): `<span class="as-coste"><img src="…/materiales.svg" alt="">120</span>` dentro de `<div class="as-costes">`;
  `falta` si no alcanza el recurso; cuota/total en `<small>`.
- **Edificio**: miniatura `<span class="as-mini [g|p] [claro]"><img src=… alt=""><span class="nv">Nv 2</span></span>`.
  Hace falta una imagen por edificio (retrato 120×120 de `js/gfx`, o `.jpg` pequeño); hasta entonces, icono sobre `.as-mini.claro`.
- **Mejora** (ministros, ficha de edificio): `<div class="as-mejora">` mini «Nv 1» + `<span class="as-flecha"></span>` + mini `.nuevo` «Nv 2».
- **Ministros**: cabecera `<span class="as-ico g"><img src="…/min-ejercito.svg"></span>` (min-ejercito, min-ciencia, min-infra, min-comercio, min-culto) en lugar de 🪙🪵🛡📜; la «propuesta» usa `.as-ico.cera`.
- **Hojas**: la bandeja Construir (`#sheet`), `#mbox` y `#csheet` se visten solas en papiro. Para Senado, Imperio, Saber y Tropas:
  `<div class="as-hoja as-lleno">` + `<div class="as-titulo">Título</div>` + tarjetas `.as-tarjeta`; pestañas `.as-pestanas > button(.on)`.
- **Botones**: `.as-btn` (bronce), `.as-btn.sello` (acción principal, uno por pantalla), `.as-btn.tinta`, `.as-btn.off` (con el motivo escrito).
- **Lámina** (Saber, Senado, Fiestas): `<figure class="as-lamina"><img><figcaption>Autor · licencia</figcaption></figure>` (11 px).
- Barra de avance: `.as-barra > i[style=width:%]`. Sello de delegación: `.as-lleva`.

## Pendiente / avisos
- `.as-hoja.as-lleno` y `.as-titulo` fijan posición en la maqueta (el `<style>` de index.html); en el juego van dentro de `#view`.
- Las miniaturas de la maqueta son recortes de capturas (0 A.D., CC BY-SA 3.0); en el juego saldrán de los retratos reales.
- `style.css` aún pone cristal oscuro a `#bar2`/`#citybtn`: `aspecto.css` los pisa; revisar `#datebox` (contiene el botón de velocidad).
- No hay estilos para el modo horizontal (mapa/batalla); queda para CDe4.
