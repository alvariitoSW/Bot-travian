# PO1 · Política: ¿encaja y cómo convergemos? · 18/11/2026

Estudio pedido por el usuario en el cuadro de mando (18/11, 15:19 UTC). Sin código. Sirve a las líneas **L4** (un solo
Senado) y **L7** (ganar por política) de la lista corta. No se ha construido ni movido nada: decide él.

## 1. El objetivo final de la política, con tus palabras
1. La política es **una de las tres formas de ganar**: se puede acabar una campaña «sin dedicarla a la guerra».
2. Es **viva y con peso**: «ver la política en directo», con intrigas, y que lo votado cambie la ciudad («lo que no
   toca la ciudad, sobra»; «crucial: que todo converja ahí»).
3. Va **dentro del mismo juego**: misma partida, mismos menús, sencilla «para el público general» y sin instrucciones.

## 2. Qué hay hoy (inventario honesto)
| Política | Qué hace | ¿Funciona? | ¿Está en el juego? | Llevarla o acabarla |
|---|---|---|---|---|
| **Senado del juego** (SN1 + SN2) | Una ley por estación (12 leyes con fuente, más 11 obras). Sala de 30 escaños en tres bandos que salen de tu ciudad (granjas, mercados, legiones). Tratos, promesas, veto del tribuno, juegos para calmarlo. Lo votado cambia la partida: permiso de guerra, tregua, leva, oro, ciudadanía. | Sí. Pasa los jueces. | **Sí**, con los menús de papiro y la partida guardada. | Ya está. Le falta meta y final. |
| **EV8 «Gobierno y ciudad juntos»** (contiene EV7) | Un juego aparte de 12 estaciones: plan del año con tres consejeros, delegar o hacerlo a mano, Senado que **te juzga** cada estación, banquetes, juegos y ritos con imágenes de museo, siete finales. | Sí, como maqueta (robots y recorrido APTO). | **No.** Ciudad propia dibujada, reglas propias, sin mapa, sin guerra, sin guardado. | ≈2 500 líneas en 5 archivos. Traerla entera: **10 a 15 M** y rehacer la ciudad que ya das por buena (L1). |
| **EV4a «política grande»** | Año de cónsul con veredicto (honores, año gris, a casa), seis senadores con nombre, rival que contrapropone. | Solo las reglas. La pantalla (EV4b) no se hizo. | No. | ≈4 M, y repite lo que hace el Senado. |
| **EV1 «política»** | Primera maqueta: debate con bocadillos. | Sí. | No. **Ya retirada por ti** (16/11). | — |
| Maqueta `senado-nuevo` | El dibujo del que salió el Senado del juego. | — | Ya convertida en SN2. | — |

En corto: hay **una** política dentro del juego y **tres** fuera. Las de fuera suman ≈15 M gastados y varias buenas ideas.

## 3. ¿Encajan con el objetivo?
| Pregunta | Senado del juego | EV8 | EV4a |
|---|---|---|---|
| ¿Se puede ganar por política? | **No.** Hoy solo se gana tomando la capital enemiga. | Sí, pero en su mundo aparte (siete finales). | Sí, en el suyo (veredicto del año). |
| ¿Toca a las clases sociales? | A medias: el tribuno veta si la plebe está mal y cada ley dice a qué clase gusta. | Sí: el Senado te juzga por plebe y grano. | Poco. |
| ¿Toca al comercio? | A medias: los mercaderes ganan escaños con tus mercados. No hay acuerdos que votar. | Poco. | No. |
| ¿Se entiende sin instrucciones? | Bastante: sí, duda, no; cuenta y dos botones. | Sí, y es la más vistosa. | Sin pantalla. |
| ¿Es el mismo juego? | **Sí.** | **No**: es otro juego. | No. |

Lo que le falta a cada una para encajar:
- **Senado del juego**: una meta que se pueda ganar, que el Senado te juzgue (hoy solo vota leyes) y algo de la vida de
  EV8: caras, banquete, la ley señalada en la ciudad. Es poco y cabe.
- **EV8**: todo lo que no es política (mapa, guerra, mercado, guardado, ciudad en 3D). Meterla es sustituir medio juego.
  Sería el quinto «juego dentro del juego», justo lo que criticaste de las batallas.
- **EV4a**: una pantalla entera, para acabar haciendo lo mismo que el Senado.

## 4. Cómo convergemos
**Recomendación: una sola política, el Senado del juego, y se le funden cuatro ideas de las maquetas.** Nada se borra:
las maquetas se quedan en `gobierno/maquetas/` como cantera, marcadas «archivada», sin más tareas ni pulidos (P166 y
P176 se cierran).

Qué se funde, en este orden:
1. **La meta: «Primero del Senado»** (L7; idea de los finales de EV7 y del veredicto de EV4a). Una barra de
   **Autoridad** a la vista en la partida y en la sala. Sube con cada ley tuya que sale, cada promesa cumplida y cada
   estación con el Senado y el pueblo a favor. Baja con promesas rotas, vetos y clases desatendidas. Al llenarse, el
   Senado te nombra Primero del Senado y **ganas sin tomar Cartago**. Pantalla de victoria: la de fin de partida que
   ya existe (papiro con tu nota), con ese título. (Historia: el título es real, *princeps senatus*; ganarlo con una
   barra es licencia de juego.) ≈1,5 M reglas con partidas de prueba + ≈1,5 M pantalla. Toca `game.js`, `data.js`, `ui.js`, `style.css`.
2. **El juicio de la estación** (de EV8; es lo que une con L3). Al pasar estación, el Senado dice en una línea cómo lo
   llevas: plebe, grano, promesas. Si descuidas a una clase, pierdes Autoridad y lo ves ahí. ≈1 M.
3. **Acuerdos comerciales que se votan** (une con L5 y L6). Cada acuerdo con otra ciudad es una ley de la sala: los
   mercaderes la apoyan, los terratenientes no. Un acuerdo firmado cuenta para ganar por comercio **y** da Autoridad.
   Se hace dentro de la tarea de acuerdos que L5 ya tiene prevista; aquí no cuesta aparte.
4. **Un banquete con un bando** (intriga de EV8): un trato más en la tablilla, con su escena. ≈0,7 M. Es lo primero
   que se cae si falta presupuesto.

**Total ≈4,7 M** (Opus construye), en tres o cuatro tareas cortas. Para después de la 1.0, ya apuntado o por apuntar:
plan del año con consejeros y delegar, senadores con nombre y carrera de cónsul, imágenes de museo en cada ley.

**Alternativa: llevar EV8 al juego como «modo Gobierno».** Es lo más vistoso y lo último que te gustó. Pero cuesta de
10 a 15 M, cambia la ciudad que ya construyes a mano, deja dos Senados durante semanas y obliga a sacar de la 1.0
dos o tres líneas. No la recomiendo antes de la 1.0.

## 5. Lo que decides tú
1. **Una sola política**: (A) El Senado del juego, con las cuatro ideas fundidas y las maquetas archivadas
   **[recomendado]**; (B) Llevar EV8 al juego como modo Gobierno (10 a 15 M, saca líneas de la 1.0).
2. **Cómo se gana por política**: (A) Barra de Autoridad hasta «Primero del Senado» **[recomendado]**: se ve siempre
   y se entiende sola; (B) Carrera de cargos: ganar elecciones hasta ser cónsul varias veces (más fiel a tu «soy el
   cónsul y voy ascendiendo», pero ≈2 M más y otra pantalla).
3. **El banquete y la vida de EV8**: (A) Solo el banquete en la 1.0; consejeros, plan del año e imágenes, justo
   después **[recomendado]**; (B) También el plan del año con consejeros en la 1.0 (≈3 M más; dime qué línea sale).
