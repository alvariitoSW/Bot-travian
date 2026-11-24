# CE12 · Equilibrio de los cuatro caminos (fase 1, 24/11/2026)

Medido con `node test/equilibrio-caminos.mjs` (nuevo): un bot por camino, partida corta (Italia, hasta 232 a.C.) y
campaña larga (hasta 146 a.C.), semillas 1..N, 4 hilos. N=5 tarda ≈11 min; N=10, ≈20 min.
Los caminos aún no están enganchados al juego: el banco llama él mismo a `CAM.paso(s, CAM.foto(s, G), mes)` cada mes.
Las obras las pone el gobernador (`GOB.estacion`, pase de MN3). El bot de armas usa un híbrido: el gobernador en la capital
y el bucle de obras viejo de `sim.test.js`. Con el gobernador solo, el bot de armas se hundía (2 plazas, no 7).

## Cifras puestas (en `js/caminos.js`, propio)
| Cifra | Antes | Ahora | Por qué |
|---|---|---|---|
| armas.plazas | 8 | **6** | La larga llega a 6,8 de media al final (máximo 8). Con 8, solo una de cada cinco |
| comercio.acuerdos | 3 | **5** | Sobraban: 5 en la corta y 8 en la larga |
| politica.favorPrinceps | 80 | **75** | El favor se queda en ≈62–75; con 70 la corta lo lograba el tercer año |
| sostener.ciudad | 6 | **12** | Un año seguido, como el comercio |
Probadas y descartadas: Urbs 3 (todos los bots lograban la ciudad en el 279 a.C.), tesoro 2500, rutas 3 o comercio
sostenido 6 meses (comercio logrado en el 279 a.C.: mucho antes que las armas).

## Resultado (N=5, cifras de arriba)
| Bot | Corta: logra su camino | Larga: logra su camino | Hito que frena |
|---|---|---|---|
| Armas | 0/5 | 0/5 | **Cartago** 0/5 (no existe en la corta; en la larga ningún bot la toma). Plazas 6,8/6 |
| Comercio | 0/5 | 0/5 | Corta: tesoro 1740/3000 (una sola ciudad, techo del almacén). Larga: rutas 4 se pierden (final 2) y Roma cae 5/5 |
| Política | 5/5 (277 a.C.) | 0/5 | Larga: planes bien 0/2 y bandos 0,99 (mercaderes y militares en humor 0, hostiles) |
| Ciudad | 0/5 | 0/5 | Nivel de barrio 3/4: el nivel 4 pide **lujo** y una Roma en paz no tiene bienes de lujo |
Metas: (a) 4–7 de 10 por camino: **no** se cumple en ninguno. (b) y (c): sin comparación, el bot de armas no toma Cartago.
Conclusión: el freno ya no está en las cifras de `caminos.js`, sino en reglas comunes. Están abajo. Las cifras se fijan
del todo en la fase 2, con el juego enganchado (CDe4: mercado, «Este año» y gobernador en game.js).

## Lo que haría falta cambiar en data.js / game.js (pases → común)
1. **Cartago en la partida corta** (`js/caminos.js` + `game.js`): Carthago no está en `s.cities` en la corta. El camino de las
   armas es imposible ahí. Propuesta: en la corta, el hito lee la capital rival (`G.capitalRival()`, Tarento). Cambio de regla:
   lo decide el usuario (abajo).
2. **Cartago en la larga** (Batallas, `game.js`/`battle.js`): ningún bot la toma, ni el bot viejo de `sim.test.js`.
   Las plazas sí llegan a 8. Pase → vigía de Batallas: medir con `sim.test.js` si la campaña agresiva sigue tomando Cartago
   tras la batalla nueva (CG4b).
3. **Lujo para el nivel 4 de barrio** (`data.js`, `D.BARRIO[4].pide`, y `G.servicios`): solo da lujo una ciudad propia con
   bien de lujo (`D.CITIES[id].esp`). Propuesta: que el lujo comprado en el mercado (`s.bienes` desde `mercado.js`, CE4b)
   cuente. Si no, el camino de la ciudad exige conquistar.
4. **Bando militar sin guerra** (`data.js`, `D.SENADO.pide`): pide «leva» y «victoria» por turnos. Sin batallas, «victoria»
   resta 4 cada vez y el bando cae a 0 (hostil). Propuesta: que «victoria» valga también con una plaza defendida o una
   leva grande. Si no, la política exige algo de guerra (puede ser lo histórico).
5. **Planes del Senado** (`plan-senado.js`/`game.js`, `P.JUICIO.bien`): con una ciudad y la cola llena casi nunca se llega
   al 80 %. El historial guarda solo los 4 últimos planes. Propuesta: que «planes bien» cuente el total logrado (un contador
   en `s.planSenado`) y no los del historial.
6. **Rutas que se pierden** (`game.js`, `G.rutasRevisar`): en la larga, el bot de comercio llega a 4 rutas y acaba con 2.
   Falta ver por qué (¿guerra o cambio de dueño?).
7. **Lentitud** (`js/ciudad.js`, propio de Ciudades): `CI.mejorSitio` cuesta 22 ms y el gobernador la llama cientos de
   veces por partida. Cachear el mapa de calor bajaría el banco a la mitad.

## Fase 1b (pedida por la coordinación, 24/11)
Hecho en archivos propios:
- `js/caminos.js`: **Cartago en la corta** (opción A, decidida por la coordinación). Si Cartago no está en el mapa, el hito lee la
  capital rival del modo (Tarento) y se llama «Tarento tomada». En la corta bastan 3 plazas (`CIFRAS.armas.plazasCorta`),
  porque la partida acaba al caer Tarento. Prueba nueva en `test/caminos.test.mjs`.
- `js/plan-senado.js`: plan «bien» con el 67 % de las obras (antes 80 %) e historial de 8 planes (antes 4; `P.HISTORIAL`).
  Pruebas de `test/plan-senado.test.mjs` al día (42 bien).

### Contratos exactos para CDe4 (archivos comunes)
- **Lujo sin conquistar** (punto 3). `game.js`, `G.servicios` (línea ≈582) ya cuenta como lujo cualquier `s.bienes[k] ≥ 1` con
  `k` en `D.LUJO = ['vino','purpura','plata']`. Basta con que el enganche de agricultura y mercado haga entrar el vino:
  (a) en el cierre de mes, lo que produzcan las viñas de `agricultura.js` se suma a `s.bienes.vino`; (b) en `MER.comprar`
  de vino, el `delta` se aplica a `s.bienes.vino` (no a `s.res`). Con eso, una Roma en paz con viña o mercado llega a Urbs.
  Histórico: el vino itálico de Campania y el Lacio (Catón, *De agri cultura* 1.7).
- **Bando militar sin guerra** (punto 4). `data.js` línea 751: `mil: ['leva', 'victoria']` → `mil: ['leva', 'guarnicion']`;
  `pro` se queda con `['victoriaFuera', 'guarnicion']`. Así los militares se contentan con tropas pagadas en las plazas y
  no hace falta ganar batallas. Si no se quiere tocar la lista, en `game.js`, donde se evalúa `victoria` del bando, que
  valga también «ninguna plaza perdida esta estación». Licencia de juego.
- **Rutas que se pierden** (punto 6). `game.js`, `G.rutasRevisar` (línea 353): ante una guerra con el socio, en vez de
  `G.rutaCerrar`, marcar `r.parada = true` y no contarla ni cobrarla hasta la paz; al llegar la paz, `r.parada = false`.
  `CAM.foto` cuenta `s.rutas.length`: habría que contar `s.rutas.filter(r => !r.parada).length` (lo cambia el Cerebro
  cuando exista el campo).
- **Cartago en la larga** (punto 2) → vigía de Batallas: ni el bot viejo de `test/sim.test.js` la toma (0/5, larga, con
  `--var viejo`). Plazas sí: hasta 8. Medir si la campaña agresiva de `sim.test.js` sigue ganando tras la batalla nueva.

## Fase 2
Fusionar la rama tras CDe4, repetir `node test/equilibrio-caminos.mjs --n 10` y dejar aquí las cifras finales.
