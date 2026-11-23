# Concurso de arte: vista desde arriba de la ciudad (CD0b)
Solo maqueta; no toca el juego. Todos los estilos dibujan la MISMA ciudad con la MISMA interfaz.
- `comun/escena.js`: datos de la ciudad (sin dibujar), lienzo 390x844, semilla fija. Expone `window.ESCENA` (y `module.exports` en Node).
- `comun/ui.js` + `ui.css`: interfaz en HTML sobre el dibujo. `montarUI({modo})`, con modo `ciudad`, `construir` o `necesidades` (si no se da, lee `?p=`).
- `plano-claro/` (estilo 1): `index.html` + `render.js`. `hoja/`: cuadrícula de capturas. `captura.mjs`: saca todo a `gobierno/capturas-tarea/CD0b-*.jpg`.
- Añadir un estilo: carpeta nueva con `index.html` que carga, por este orden, `../comun/ui.css`, un `<style>` propio que redefine las variables
  (`--ui-fondo`, `--ui-texto`, `--ui-acento`, `--ui-borde`, `--ui-fuente`, y opcionales `--ui-fondo2`, `--ui-papel`...), `../comun/escena.js`, `../comun/ui.js` y su `render.js`.
  Su `render.js` pinta en `#lienzo` (SVG o canvas de 390x844) y el HTML termina con `montarUI(); window.listo = true;`.
- Probar: `node gobierno/maquetas/ciudad-nueva-concurso/captura.mjs [estilo]` (abre por `file://`, sin servidor; scripts clásicos, no módulos).
