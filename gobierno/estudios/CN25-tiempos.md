# CN25a · Medir el ritmo del mes (13/11/2026)

Pedido del usuario: «los tiempos no están bien planteados». Al concretar eligió «A»: **los meses y turnos duran demasiado o pasan sin que hagas nada.**
Detalle: `CN25-medidas.md` (cifras) y `CN25-lectura.md` (código, archivo:línea). Script: `node gobierno/medir-ritmo.mjs` (`--rapido` sin navegador).

## Lo primero: nada roto de gravedad
- Ningún avance deja de detenerse: en turnos el reloj se para solo al acabar la estación.
- Aviso menor: por debajo de 4 fotogramas/s el tiempo va a cámara lenta (tope de `dt`). En un móvil flojo un mes puede pasar de 4 s. Aquí (render por software, 5 fps) un mes ×1 salió en 7 s.
- Aviso menor: con un modal abierto el bucle se frena, pero la velocidad sigue en ▶ y el tiempo continúa al cerrarlo.

## Tiempos reales (teoría del código; en navegador salen más largos por los 5 fps de esta máquina)
| | Mes | Turno (estación = 3 meses) |
|---|---|---|
| Parado | no avanza (medido) | — |
| ×1 (la única velocidad en modo turnos) | 4 s | 12 s |
| ×2 (solo tiempo continuo, pruebas y bot) | 2 s | 6 s |
| ×4 (idem) | 1 s | 3 s |
| «Pasar turno» | — | instantáneo: simula lo que falta de la estación (1 a 3 meses) |
Medido en navegador (5,3 fps): mes ×1 7,0 s · turno ×1 19,6 s. Un móvil normal debería cumplir la teoría (sin medir).

Obras a ×1: aserradero/granja 6 s (nivel 1) a 19 s (nivel 5); cuartel/mercado 10 a 32 s; templo/puerto 12 a 38 s. Marchas: Roma→Capua 2 meses (8 s) pero en turnos llega al fin de turno (12 s); Carthago↔Poblado íbero 9,5 meses → 12 en turnos (48 s); Roma→Poblado íbero 15 (60 s).

## Meses «muertos» en 60 meses (Roma y Capua, bot)
- Contando también «marchar» y «mercado»: ninguno, pero son acciones casi siempre posibles y poco útiles.
- Contando solo construir, reclutar o forjar: el bot que gasta en cuanto puede se queda **sin ninguna 41 de 60 meses**; en 40 de ellos tiene todos los huecos de obra llenos (1 a 4 huecos según el foro). Media: 4,1 acciones/mes.
- El bot que gasta cada 2 meses: 10 meses sin acción, media 15,4; acumula 1.200 a 1.600 de recursos sin gastar.
- Tras actuar, el recurso más escaso queda entre 15 y 50.
- Lectura: con pocos huecos de obra (Q4b) y cuotas por mes, **casi siempre hay obras en curso y poco que decidir**; el tiempo «pasa solo» porque el cuello de botella son los huecos, no el reloj.
- Aparte: en ambos perfiles Roma pierde Capua hacia el mes 30-33 (conviene mirarlo aparte). No se midieron misiones, investigación ni órdenes de batalla.

## Qué ve el jugador mientras pasa el tiempo
- **Paran el reloj**: fin de estación (informe), batalla pendiente, hecho histórico, colonos, fin de partida.
- **No paran**: obra terminada, tropa lista, herrería (ni siquiera dan toast), misión cumplida o fallida, ataque enemigo en camino, almacén que pierde recursos, hambre, obra detenida por falta de caja, rebelión (estos dan un toast de 3,2 s).
- En turnos las marchas enemigas solo llegan al cambio de estación; el aviso útil sale en el consejo de fin de turno, tarde.
- Pasar turno suelta todos los toasts juntos y solo sobreviven 3.
- **Avisos repetidos**: «Fin de mes… se perderán N» y «Cierre de mes… perdido» (dos avisos del mismo hecho cada mes con el almacén lleno); el informe repite «Sin obras en cola» y «Almacén lleno» cada trimestre.
- En un trimestre sin acciones el jugador ve 12 s con las mismas cifras y no distingue un trimestre vacío de uno con peligro.

## Tres propuestas (nada implementado)
**A · Pausa automática con motivo** (obra terminada, tropa lista, misión, ataque, primera pérdida de recursos), con ajuste «todas / solo graves / ninguna».
Cambia: el reloj se para y dice por qué. Toca `game.js` (evento `parar` en terminarObra, colas, misión, IA), `ui.js` (`onEvent`), `G.load` (migrar el ajuste). Coste ≈ 0,5 M Sonnet. Riesgo bajo (más pausas pueden cansar: por eso el ajuste).

**B · «Avanzar hasta lo próximo que importa» (+ ▶▶ real en turnos)**. El botón salta al siguiente hito (obra acabada, huecos libres, caja suficiente, llegada de marcha, ataque). Toca `game.js` (nueva `G.proximoHito`), `ui.js` (botón, velocidad, bucle). Coste ≈ 0,8 M. Riesgo medio: el cálculo del hito debe coincidir con el motor.

**C · Resumen único del mes o estación** (diario) en lugar de varios toasts y avisos repetidos. Toca `game.js`, `ui.js`, guardado. Coste ≈ 0,7 M. Riesgo medio-bajo. Mejora la claridad, poco el ritmo.

**Recomiendo A primero**, con el ▶▶ de B en turnos como segundo paso. Razón: la queja es que el tiempo pasa sin avisar; hoy terminan obras y tropas, e incluso llegan ataques, sin parar. Los 12 s por estación ya son cortos; acortar más agravaría el problema. Pedir menos meses «vacíos» pasa por Q4b (huecos) más que por el reloj.

**Decide el usuario**: cuál (A, B, C o combinación) y qué nivel de pausas quiere por defecto: es regla de juego.
