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

## Fase 2
Fusionar la rama tras CDe4, repetir `node test/equilibrio-caminos.mjs --n 10` y dejar aquí las cifras finales.
