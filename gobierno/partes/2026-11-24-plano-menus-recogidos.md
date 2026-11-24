# Parte · Plano con los menús recogidos · 24/11/2026
**Resultado**: hecho; **sin publicar**, en la rama `ccr-b0d546c7-9uwkp2` (commit `7a1f3db`, ya unida con la rama del juego hasta `fa11399`).
**Pedido** (usuario, literal, 23/11, sobre una captura del plano): «solo veo lo que está en rojo dentro; el resto habría que minimizarlo para que pueda tener más visión de juego».
**Qué cambia para el jugador**: al pulsar «Plano» en la ciudad se recogen la bandeja de construir y sus pestañas, el aviso, la miga y la fila de la fecha. Quedan los recursos, «Salir al mapa», el ojo, «De cerca» y la barra de abajo. Al salir del plano todo vuelve.
**Archivos**: `js/ui.js` (`marcaPlano()`, llamada en `renderCity3D` y `setTab`), `css/style.css` (tres líneas al final, clase `#app.plano`), `sw.js` (caché v150).
**Jueces**: `node gobierno/juez-area.mjs musculo` APTO (5 pruebas, 491 s). `gobierno/captura-plano.mjs`: gestos OK, sin errores de consola. Jueces completos: no pasados (se perdieron en un reinicio; tocan a la sesión de subida).
**Captura**: `capturas-tarea/CV1-plano.jpg`.
**Pase → sesión de subida / vigía de ciudad**: recoger de `7a1f3db` solo `marcaPlano` (ui.js) y el bloque `#app.plano` (style.css); subir la caché. Encaja con CD1 («Vista desde arriba»).
**No comprobado**: móvil en horizontal, móvil real, otras ciudades.
**Además**: la CV4a de esta sesión (constructor Opus, 3,63 M) se descartó: otra sesión hizo y publicó la misma tarea y se ve mejor (parte `2026-11-23-CV4a-duplicada.md`). Lección: mirar la rama del juego antes de lanzar una tarea. CV4b y CB1–CB4 retiradas por decisión del usuario («Manda Ciudad nueva (CD)»).
**Decide el usuario**: nada bloqueante.
