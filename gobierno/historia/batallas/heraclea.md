# Heraclea · 280 a.C.
**En una frase**: primer choque de Roma con Pirro de Epiro; los romanos, que nunca habían visto elefantes, pierden en el río Siris, pero el rey paga muy caro.

> Estado de las fuentes: en esta sesión solo se pudo consultar resúmenes y fragmentos por búsqueda web (los sitios de textos completos no eran accesibles). Todo lo marcado **sin comprobar** debe verificarse en el texto antes de usarlo en el juego.

**Qué pasó** (histórico, en lo básico)
- Pirro llegó a Italia en ayuda de Tarento con un ejército de tipo helenístico y elefantes.
- El cónsul Publio Valerio Levino marchó contra él y acampó junto al río Siris, en la llanura entre Pandosia y Heraclea.
- Pirro se acercó por la otra orilla. Los romanos cruzaron el vado y combatieron en la ribera.
- La batalla fue muy igualada: Plutarco habla de varios retrocesos de cada bando.
- Los elefantes asustaron a los caballos romanos y desbarataron su caballería; la línea cedió y los romanos huyeron al otro lado del río.
- Pirro se quedó con el campo, pero sus mejores hombres habían caído.

**Cifras**
| Dato | Versión | Fuente |
|---|---|---|
| Fuerza de Pirro al desembarcar: 20.000 infantes, 3.000 jinetes, 2.000 arqueros, 500 honderos, 20 elefantes | histórico (es el ejército de la invasión, no el de la batalla) | Plutarco, *Pirro* 15 (de memoria; **sin comprobar** el pasaje exacto) |
| Bajas romanas | unos 7.000 muertos y unos 1.800 prisioneros | Jerónimo de Cardia, citado por Plutarco, *Pirro* 17 |
| Bajas romanas | casi 15.000 | Dionisio de Halicarnaso, citado por Plutarco, *Pirro* 17 |
| Bajas de Pirro | menos de 4.000 | Jerónimo, citado por Plutarco, *Pirro* 17 |
| Bajas de Pirro | unas 13.000 | Dionisio, citado por Plutarco, *Pirro* 17 |
| Tropas de Levino | **sin comprobar** (ver Dionisio 19, Zonaras 8.3, Orosio 4.1, Justino 18.1) | — |

Nota: Jerónimo era del círculo de Pirro y su paisano; Dionisio escribe siglos después, con fuentes romanas. La diferencia (7.000 contra 15.000) es una discrepancia clásica; no se resuelve (Lévêque 1957 y Champion 2009 discuten las cifras, **sin comprobar** su postura).

**Despliegue**
- Roma: ejército consular de legiones y aliados itálicos; infantería en el centro y caballería en alas (disposición general de la época, **probable**; Dionisio 19 y Zonaras 8.3 dan más detalle, **sin comprobar**).
- Pirro: falange y aliados itálicos de infantería, caballería tesalia y aliada, arqueros y honderos, elefantes. Plutarco cuenta que Pirro, para no ser reconocido, cambió su armadura con su compañero Megacles, y que Megacles fue derribado por un tal Dexoo, que se jactó de haber matado al rey (Plutarco, *Pirro* 17; según el resumen de búsqueda, **sin comprobar** el texto).
- Reparto exacto de alas, línea y elefantes: **sin comprobar**.

**Terreno**
- Llanura junto al río Siris (hoy Sinni, Basilicata). Los romanos pasaron por un vado. El lugar exacto no se discute en sus líneas generales; el punto concreto del vado, **sin comprobar**.

**Fases de la batalla** (histórico en lo general; orden **probable**)
1. Levino acampa en el Siris; Pirro llega a la orilla opuesta.
2. La caballería romana cruza el vado y ataca; Pirro, sorprendido, trae su caballería y entra en combate.
3. Pirro cruza con la infantería y empeña la falange; varios avances y retrocesos de ambos lados.
4. Cae Megacles con la armadura del rey y se corre la voz de que Pirro ha muerto; Pirro se muestra a cara descubierta para frenar el desánimo.
5. Pirro lanza los elefantes y la caballería tesalia; los caballos romanos se espantan.
6. Los romanos rompen y huyen hacia el Siris.

**Vestimenta y armas** (probable, consenso general)
- Roma: ejército manipular reciente, escudo, lanza de los triarios, jabalinas; sin elefantes propios ni experiencia contra ellos.
- Pirro: falange de sarisas y escudos redondos, caballería tesalia, elefantes con torres y arqueros, tropas ligeras.
- Detalle de armaduras por tropa: **sin comprobar**.

**Lo que se discute**
- Las bajas de cada bando (tabla).
- Si la lucha empezó por la caballería romana o por la infantería.
- Cuántos elefantes intervinieron.

**En el juego hoy**
- Coincide: Roma tiene hastati, príncipes, triarios, vélites y équites; Pirro puede usar falange, caballería tesalia y elefantes.
- No coincide: el campo es plano, sin río; no hay refuerzos que lleguen en el curso del combate.
- Licencia de juego: el motor da tamaño de regimiento igual a ambos lados.

**Para jugarla en el motor actual**
Proporciones aproximadas (no cifras reales; licencia de juego):
- Roma: hastati 40 %, príncipes 25 %, triarios 10 %, vélites 15 %, équites 10 %.
- Pirro: falange 40 %, hoplitas/milicia (itálicos) 25 %, tesalios 12 %, jinetes 5 %, honderos/peltastas 15 %, elefantes (unos pocos regimientos de 8).
Falta en el motor (el repaso de `js/battle.js` no encontró terreno, río ni despliegue especial):
- Río con vado (cruce que desordena): coste grande.
- Pánico de caballos ante elefantes: coste medio (comprobar si ya existe).
- Cambio de armadura y rumor de muerte del rey: coste pequeño/medio.
- Fases de refuerzos: coste medio.

**Cambios que propongo**
- Una zona de «río» en el campo que ralentice y debilite al que cruza: grande.
- Pánico de caballería ante elefantes: medio.
- Escenario Heraclea con el ejército de arriba: pequeño.

**Fuentes**
- Plutarco, *Vida de Pirro* 15-17 (Jerónimo de Cardia y Dionisio de Halicarnaso citados para bajas en 17). Textos de libre acceso: Perseus / LacusCurtius (no accesibles en esta sesión).
- Dionisio de Halicarnaso, *Antigüedades romanas* 19.9-12 y ss. (**sin comprobar**).
- Zonaras 8.3; Orosio 4.1; Justino 18.1; Livio, *Periocha* 13 (**sin comprobar**).
- Lévêque, P., *Pyrrhos* (1957); Champion, J., *Pyrrhus of Epirus* (2009) (**sin comprobar** páginas).
