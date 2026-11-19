# CE2 · Cifras del bot (juez `test/economia.js`)

Cómo se mide: `node test/economia.js --n 5 --md` (unos 8 minutos). El bot es el de `test/sim.test.js` (el que gana la campaña),
5 semillas por fila. La campaña larga corre con la ciudad nueva, como en `sim.test.js`.
- **% perdido**: lo que el tope del almacén tira al cerrar el mes, entre lo que entró (producción, botín, compras y ventas en el
  mercado). No cuenta premios de misiones; por eso un recurso que solo se acumula (los denarios del bot pasivo) puede pasar del 100 %.
- **% estaciones con falta**: estaciones (3 meses) en que el bot quiso una obra o un recluta y no pudo pagarlo, se detuvo una cuota
  por falta de fondos, o el grano llegó a cero con la producción en negativo.
- Criterio CE1 §5: ningún recurso pierde más del 10 %; falta algo en 7 de cada 10 estaciones; el bot sigue ganando.
- Para afinar sin tocar el código: `CE2_SET='HIERRO_COMPRA=0.8,MODOS.corta.factores.costes=0.7' node test/economia.js --modo corta --bot agresivo`.

## Antes (código del 18/11, cinco recursos)

| Modo | Bot | % perdido por recurso | % estaciones con falta | Gana | Años finales |
|---|---|---|---|---|---|
| Partida corta (en pie) | agresivo | madera 11.2 %, piedra 30.7 %, hierro 7.7 %, grano 0 %, oro 8 % | 97.5 % | 4/5 | d231 V252 V251 V242 V249 |
| Partida corta (en pie) | pasivo | madera 80.6 %, piedra 85.5 %, hierro 85.4 %, grano 0 %, oro 142.9 % | 22 % | 0/5 | d231 d231 d231 d231 d231 |
| Campaña larga (Mediterráneo) | agresivo | madera 62.2 %, piedra 79.9 %, hierro 57.7 %, grano 0 %, oro 24.5 % | 100 % | 3/5 | V174 d145 V170 V182 d145 |
| Campaña larga (Mediterráneo) | pasivo | madera 78.5 %, piedra 87.7 %, hierro 77.5 %, grano 7.5 %, oro 117.3 % | 29.5 % | 0/5 | d259 d145 d243 d244 d257 |

Lo que más faltaba: grano para obras (los edificios pedían grano), luego hierro y madera. La piedra sobraba siempre.

## Después (CE2: grano, denarios, materiales, hierro; bienes; el bot compra hierro y vende lo que sobra)

| Modo | Bot | % perdido por recurso | % estaciones con falta | Gana | Años finales |
|---|---|---|---|---|---|
| Partida corta (en pie) | agresivo | grano 4.5 %, denarios 0 %, materiales 2.3 %, hierro 0.4 %, bienes 0 % | 96.2 % | 5/5 | V237 V252 V251 V244 V249 |
| Partida corta (en pie) | pasivo | grano 8.6 %, denarios 0 %, materiales 18.8 %, hierro 0 %, bienes 0 % | 21 % | 0/5 | d231 d231 d231 d231 d231 |
| Campaña larga (Mediterráneo) | agresivo | grano 4 %, denarios 0 %, materiales 22.4 %, hierro 14.1 %, bienes 9.5 % | 97.4 % | 3/5 | V202 d145 d145 V187 V205 |
| Campaña larga (Mediterráneo) | pasivo | grano 10.9 %, denarios 1.3 %, materiales 43.3 %, hierro 0 %, bienes 32.2 % | 23.4 % | 0/5 | d145 d145 d145 d145 d145 |

`test/sim.test.js` (10 semillas): campaña agresiva 6/10, todas después de 218 a.C.; Italia 10/10; corta en pie 10/10 y fundando 8/10;
pasivo 0 en todas. Lo que ahora falta casi siempre son **denarios** (obras y reclutas), luego hierro: el cuello de botella es el dinero.

Números de juego (licencia de juego, comentados en `js/data.js`): vender lo que sobra a la mitad del cambio (`SOBRA_MUL` 0,5); el hierro
comprado rinde el 60 % (`HIERRO_COMPRA`); materiales al 80 % (`MAT_MUL`) y el almacén guarda el doble (`CAP_MUL`); la partida corta cuesta
el 60 % (`MODOS.corta.factores.costes`, antes 1), porque sin eso el bot ya no ganaba a tiempo.

## Lo que no llega al criterio, y por qué
- **Campaña larga agresiva**: materiales (22 %) y hierro (14 %) pasan del 10 %. Vienen sobre todo del botín de cada conquista, que llega
  de golpe a la caja, y de que «Vender lo que sobra» solo vende de la caja del mes: lo que entra en el último cuarto del mes ya no se puede
  vender. Arreglarlo pide decidir si se vende también del almacén, o tocar botines y tiempos: es CE3.
- **Bot pasivo**: no recluta ni conquista, así que acumula; materiales y bienes se le pierden y rara vez le falta algo. Es su papel en la
  prueba (no debe ganar), no un jugador real.
- En la corta agresiva se cumple todo: ningún recurso pasa del 10 % y falta algo en 96 de cada 100 estaciones.
