# CN25 · Lectura: el mes pasa sin que hagas nada

Estudio de solo lectura. No se ha tocado el juego. Rutas relativas a `js/`.

## 0. Lo primero: nada está roto de forma grave
- Nada avanza sin parar: en modo turnos (el de la interfaz, `ui.js:1147`) el tiempo se corta SIEMPRE al cambiar de estación (`game.js:1010`, `finTurno` en `game.js:899`) y la interfaz pone la velocidad a 0 y abre el informe (`ui.js:78`).
- Ningún mes dura minutos. Lo que molesta es otra cosa: casi todo lo que importa no detiene el reloj (sección 1).
- Pequeño fallo de diseño: si cierras o dejas abierto un modal, el bucle se frena (`ui.js:1269`, `!UI.modalOpen`) pero la velocidad sigue en ▶; al cerrarlo el tiempo continúa solo.

## 1. Qué ve el jugador mientras pasa el tiempo
Tiempos: una estación = `D.TURNO_MESES = 3` meses (`data.js:5`). Un año son 4 turnos.

Qué PARA el reloj solo:
| Evento | Dónde | Efecto |
|---|---|---|
| Fin de estación | `game.js:1056` emite `turno`; `ui.js:78` pone `speed = 0` y abre `consejoModal` (`ui.js:115`) | Para y muestra informe + consejo |
| Batalla pendiente (marcha que llega: ataque tuyo o defensa) | `game.js:1047-1049, 1057`; `ui.js:1270` `battlePrompt` | Para (tick no corre con `pending`) |
| Hecho histórico | `game.js:973` `emit('event')`; `ui.js:71` modal | Frena mientras el modal está abierto (la velocidad no se pone a 0) |
| Colonos llegados | `game.js:855`; `ui.js:74` modal | Igual: modal |
| Fin de partida | `ui.js:79` | Para |

Qué NO para el reloj aunque importe (solo toast fugaz o nada):
- **Obra terminada**: `game.js:560` `G.log` sin tipo. Ni toast ni pausa; solo queda en el registro (`ui.js:73` solo saca toast con `good`/`bad`).
- **Tropa lista**: `game.js:1039`, igual, sin tipo. Silencioso.
- **Herrería**: `game.js:1033`, igual, silencioso.
- **Misión del Senado cumplida/fallida**: `game.js:1663/1666`, toast de 3,2 s (`ui.js:59-63`). No para.
- **Ataque enemigo en camino**: `game.js:1001-1002` log `bad` y alerta: toast de 3,2 s. No para. Además en modo turnos las marchas solo llegan al cambio de estación (`game.js:895-896`, `1046`), así que el aviso útil es el del consejo de fin de turno (`game.js:1176-1180`, «llega al acabar este turno»), que sale demasiado tarde para reaccionar con calma.
- **Almacén lleno / se pierde recurso**: aviso «Fin de mes» al pasar el 75 % del mes (`ui.js:149`, `D.AVISO_CIERRE=0.75` en `data.js:48`): toast rojo de 3,2 s, uno por mes. Y `game.js:1161` registra «Cierre de mes: ... perdido» cada mes que se pierde algo (toast `bad`). No para.
- **Hambre/deserción** (`game.js:1060`), **sabios sin paga** (`game.js:1135`), **obra detenida por falta de fondos** (`game.js:1124`), **rebelión** (`game.js:1283`): toast rojo, sin pausa.
- **Conquista/saqueo/rechazo** (`game.js:1306-1329`): toast verde.
- Los toasts: máximo 3 a la vez, 3,2 s cada uno (`ui.js:59-63`). Con una cola de 3 se pierden los anteriores.

Avisos repetidos sin información nueva:
- «Fin de mes: …se perderán N de madera (y 2 más)» (`ui.js:149`) sale cada mes mientras el almacén siga lleno, igual que el mes anterior. Y a la vez el log «Cierre de mes… perdido…» (`game.js:1161`). Dos avisos del mismo hecho.
- El informe de estación repite a menudo «Sin obras en cola» y «Almacén lleno» (`game.js:1184-1189`) cada trimestre si el jugador no hace nada.
- El aviso de cierre solo muestra el primer problema y «(y N más)»: no dice cuál es el importante.

## 2. «Pasar turno» y ▶
- **▶ / II** (`ui.js:1153`): en modo turnos solo alterna 0 y 1. Velocidades `VEL` = 0, 1, 2, 4 (`ui.js:121`) existen solo en tiempo continuo (pruebas, bot); el jugador no las ve.
- Segundos reales: cada fotograma suma `dt * speed / 4` meses (`ui.js:1270`) con `dt ≤ 0,25 s` (`ui.js:1260`). A ×1: **4 s por mes, 12 s por estación, 48 s por año**. A ×2 serían 2 s/mes y a ×4, 1 s/mes (no accesibles en turnos).
- **Pasar turno** (`ui.js:1152` → `G.pasarTurno`, `game.js:1075-1080`): simula de golpe el resto de la estación en pasos de 0,25 mes (hasta 100). Es instantáneo, no acelerado, y solo cubre lo que falta hasta el fin de estación (1 a 3 meses; no 3 meses fijos). Termina abriendo el informe y consejo (`ui.js:78`). Se detiene antes solo si hay batalla pendiente (`game.js:1076, 1077`). Los toasts intermedios (obra, ataque, misión) salen todos de golpe y solo sobreviven los 3 últimos.
- Cada mes dentro del turno se cierra solo (`game.js:1020`, `cierreMes`): el almacén recoge lo que cabe y el resto se pierde. No hay ninguna decisión posible a mitad de turno que el juego te pida.

## 3. Meses sin acciones posibles
Con ▶ en marcha y la ciudad ya con la cola llena y recursos al tope: el reloj corre 12 s, los recursos suben, se pierden sobrantes con un toast rojo mensual y el informe final muestra la misma tabla. Nada nuevo salvo cifras. No hay «nada que hacer: avanza»; el jugador no distingue un trimestre vacío de uno con peligro, porque ambos terminan igual (modal «Seguir»). Lo que más se pierde es obra/tropa terminada, que no avisa, y por eso el jugador no sabe cuándo le conviene parar.

## 4. Tres propuestas
Coste en tokens Sonnet (M = millones; todo cabe en una sesión de constructor).

### A. Pausa automática con motivo («para cuando pasa algo»)
- Jugador: ▶ se corta solo, con un cartel corto («Obra terminada: Cuartel en Roma. Seguir»), cuando termina una obra o una tropa, llega o sale una marcha enemiga hacia ti, se completa/falla una misión, o el almacén va a perder recursos por primera vez en la estación. Opción en el menú: pausas «todas / solo graves / ninguna».
- Archivos: `game.js` (`terminarObra` línea 555, cola de tropas 1039, herrería 1033, misión 1663/1666, IA 1001: añadir `emit('parar', {motivo, grave})`); `ui.js` (`G.onEvent` línea 71: poner `speed=0` y toast fijo/botón; ajuste en menú); `sw.js` no. Migrar el ajuste en `G.load` (`game.js:1360`).
- Coste: ~0,5 M. Riesgo bajo; hay que evitar un flujo de pausas insoportables (agrupar las del mismo fotograma, y no pausar en `pasarTurno`). Las pruebas del bot no usan la interfaz: no se rompen. Test lógico nuevo en `test/sim.test.js` para la señal.

### B. Botón «Avanzar hasta lo próximo» (y mes más corto)
- Jugador: un botón junto a «Pasar turno» que avanza (acelerado, ~1 s por mes) hasta el siguiente hecho que importe (obra, tropa, misión, ataque, fin de estación) y se detiene mostrando qué fue. Si no hay nada pendiente salvo el fin de estación, dice «Nada que decidir este turno» y salta. Además, un ▶▶ real en modo turnos (hoy `ui.js:1153` lo bloquea): ×1 (4 s/mes), ×2, ×4.
- Archivos: `game.js` (nueva `G.proximoHito()` que mire `t1` de obras, colas, marchas, misión y devuelva el tiempo; sin tocar la pantalla); `ui.js` (botón en `index.html`/`ui.js:157`, `case 'speed'` línea 1153, bucle 1270 para parar en `hito`); `css`. 
- Coste: ~0,8 M. Riesgo medio: `proximoHito` debe coincidir con el motor para no pasarse; hay que probarla en Node con una prueba que compare con `G.tick` real.

### C. Resumen único del mes/estación (menos toasts, más información)
- Jugador: en vez de 3 a 5 toasts sueltos por mes, un solo aviso «Mes de Marzo: terminó el Cuartel · 40 madera perdida · Cartago se mueve». El informe de estación pasa a listar lo ocurrido (obras, tropas, misiones, pérdidas) en lugar de repetir consejos. Elimina el duplicado «Fin de mes» + «Cierre de mes».
- Archivos: `game.js` (nuevo `s.diario` por mes; rellenar en `cierreMes` 1150-1163, `terminarObra`, colas; migrar `G.load`); `ui.js` (`consejoModal` 115, aviso 149, `onEvent` 73).
- Coste: ~0,7 M. Riesgo medio-bajo: toca el formato del guardado; es lo que menos reduce la espera.

### Recomendación
**Hacer A primero y añadir de B solo el ▶▶ en turnos.** Razón: la queja real es «pasa sin que hagas nada»; lo que falta es que el juego avise y pare cuando hay algo, no acortar el mes (12 s por estación ya es corto). A resuelve el 80 % con poco riesgo y reutiliza `emit` y `onEvent`. El botón «hasta lo próximo» (B) lo haremos si tras A el jugador sigue pulsando ▶ en vacío; C es mejora de claridad, no de ritmo. Decide el usuario (cambio de reglas de juego): propongo preguntarle si quiere pausas «todas / solo graves».

## Dudas abiertas
- No se midió en móvil ni se jugó una partida: los segundos salen del código (`dt/4`), no de un cronómetro.
- Pendiente de confirmar con el usuario si «turno» le molesta por los 12 s o por las 3 pausas del año por motivo de informe.
