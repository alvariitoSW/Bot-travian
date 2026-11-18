# Cerebro · Objetivo final de la economía (EC0, 18/11/2026)

**Qué es esta página.** El detalle de la línea L2 («Recursos, mercado y cuentas claras») del órgano «Cerebro» de
`gobierno/OBJETIVOS.md`, que manda sobre todo. No es una tarea: es la vara con la que se mide toda tarea de economía.
Cada tarea dice a qué apartado sirve y, al cerrar, enseña capturas y cifras del bot frente a §4. Solo la cambia el
usuario. Copia la forma de la página de las batallas (`TP0-objetivo-testudo-y-lucha.md`). No se ha construido nada.

## 1. El objetivo, en una frase
Cada estación **te falta algo y tienes que elegir**: pan para la plebe, legiones, favores en el Senado o rutas de
comercio; y lo que eliges te acerca a **una de las tres victorias** (armas, comercio o política).

## 2. De dónde sale (palabras del usuario, 18/11)
- «Hay que replantear la economía que tenemos, meterla en el juego, medir como la integramos con los tiempos del juego,
  que le falla, que hay que mejorar, cual es el objetivo último de la economía en este juego».
- Elegido en el cuadro: «A · Primero una página de objetivo de la economía, como la de las batallas, sin construir nada».
- De `OBJETIVOS.md`: «aprendes a gestionar una ciudad y un imperio con los recursos y a mantener las ciudades,
  ciudadanos y plebeyos… ganar la partida sin dedicarla a la guerra: ganarla por política y por economía».

## 3. Qué hay hoy, medido
**Cómo se midió.** El bot de la campaña de `test/sim.test.js`, copiado en un guion aparte (no está en el repositorio),
que apunta cada cierre de mes lo que entra, lo que se gasta y lo que se pierde. Cinco partidas: campaña larga
(Mediterráneo) agresiva y pasiva, partida corta (Italia, Roma y Capua en pie) agresiva y pasiva, corta fundando de la
nada. «Gasto» = lo que entra − lo que se pierde − lo que crece el almacén. El bot no usa el mercado ni abre rutas.

**El reloj.** Un mes son 4 s de reloj a velocidad normal; un turno, 3 meses. La partida corta dura 49 años
(588 meses, unos 196 turnos, de 2 a 4 h). La larga que ganó el bot duró 106 años (1273 meses, unos 424 turnos).

| Momento (bot agresivo, campaña larga) | Ciudades | Entra al mes (madera / piedra / hierro / grano / oro) | Se gasta al mes | Se pierde por el tope |
|---|---|---|---|---|
| Primer año (280 a.C.) | 2 | 127 / 124 / 124 / 82 / 41 | 92 / 20 / 97 / 76 / 30 | casi nada |
| Años 270–260 | 5 | 743 / 598 / 614 / 323 / 312 | 554 / 287 / 481 / 351 / 56 | piedra 256, oro 181 |
| Años 260–240 | 7 | 1447 / 1351 / 1278 / 694 / 420 | 1042 / 342 / 1042 / 687 / 233 | piedra 788 |
| Del 240 al final (174 a.C.) | 7 | 1580 / 1548 / 1440 / 198 / 70 | 288 / 59 / 341 / 201 / 72 | madera 1257, piedra 1455, hierro 1064 |

**En toda la campaña larga se perdió por el tope** el 84 % de la piedra, el 61 % de la madera, el 55 % del hierro y el
27 % del oro. Del grano, nada: no sobra nunca. En la corta agresiva, 57 % de la piedra y 28 % de la madera.

**Tiempos frente a la partida** (Roma, foro nivel 1): una granja de nivel 1 tarda 1,4 meses (6 s); de nivel 10,
21 meses (86 s, 7 turnos). Un cuartel o un mercado de nivel 10, 36 meses (12 turnos). La obra típica del bot tardó
9 meses (3 turnos) en la larga y 11,5 en la corta. El coste sube ×1,5 por nivel; la producción solo sube en línea.
Reclutar: el lote típico del bot fue de **16 hombres en un mes**; lo que limita es la gente libre, no los recursos.

**Mercado, puerto y rutas.** El mercado cambia cualquier cosa por cualquier otra al mismo precio (del 50 % al 90 %
según su nivel): 100 de madera dan 55 de oro o 55 de grano (captura `capturas-tarea/K12c-mercado.jpg`). El puerto da
5 de oro al mes por nivel. Una ruta cuesta 100 de oro y renta de 4 a unos 30 al mes. La hoja de cuentas ya avisa de lo que
se va a perder y ofrece «Vender en el mercado» (`capturas-tarea/Q4-1-cuentas.jpg`).

**Clases y Senado.** Las clases solo miran **sí o no**: ¿hay grano, templo, agua, mercado, lujo? La cantidad no cuenta.
El Senado baja su favor si el mes cierra con el oro en rojo; nada más de la economía le llega.

## 4. Qué le falla (con la cifra que lo prueba)
1. **Sobra casi todo y se quema en silencio.** 84 % de la piedra perdida en la campaña larga. Desde el 240 a.C. el bot
   gasta solo el 4 % de la piedra que produce: ya no hay en qué gastarla.
2. **Solo el grano manda, y sin remedio a la vista.** Al final, el ejército y la gente comen 2767 de grano al mes y
   sobran 198. En la corta pasiva, tras perder Capua, sobra 1 de grano al mes y las obras pasan **549 de 588 meses
   paradas** (piden grano), con el almacén lleno de madera, piedra y hierro.
3. **El oro no sirve para mucho.** Al final de la larga hay 28 000 guardados y entran 70 al mes; las legiones cuestan
   863 al mes y se pagan sin apuros. No hay nada grande que comprar con él.
4. **Precios fijos e iguales para todo.** La madera vale lo mismo que el oro. No se aprende qué es caro ni dónde.
5. **Comercio sin peso.** El bot gana sin abrir una sola ruta. Ganar por el comercio (L6) no tiene de qué alimentarse.
6. **El ritmo se estira.** Al final, una obra son 12 turnos y no hay nada que decidir mientras tanto: el turno se pasa
   sin elegir. En los primeros años, en cambio, sí falta de todo y hay que elegir: eso es lo que se quiere todo el rato.
7. **Las clases no notan cuánto, solo si hay.** Dar mucho o poco grano a la plebe da igual mientras haya algo.

**Lo que ya vale y no se rehace**: la caja del mes con almacén y tope, las obras y reclutas a plazos, la hoja de
cuentas con su aviso de pérdida, el mercado y el puerto como edificios, las rutas, los bienes especiales por ciudad
(vino, púrpura, plata…), la ración escasa, las fiestas y la leva.

## 5. Para qué sirve la economía en este juego
La economía no gana sola: **alimenta las tres victorias** y se nota en las clases y en el Senado.
| Sirve a | Cómo |
|---|---|
| Armas (L8 a L10) | Grano para comer en marcha, hierro para armas, oro para la paga. Un ejército grande ahoga la caja. |
| Comercio (L5, L6) | Lo que sobra se vende o se lleva por una ruta adonde vale más. La riqueza y los acuerdos son la meta de VC1. |
| Política (L4, L7) | Oro para juegos, triunfos y tratos en el Senado; oro en rojo resta favor. |
| Clases (L3) | La plebe pide grano **en cantidad**; los ciudadanos, mercado y lujo; los esclavos trabajan las tierras. Descuidarlos para la producción (CS1). |

Una sola caja para las tres: lo que gastas en una, no lo tienes para otra. Eso es el «tienes que elegir» de §1.

## 6. Referencias (solo ideas; nunca su código ni su arte; nada guardado en el repositorio)
- **Travian**: almacén con tope y producción por hora (ya lo tenemos); el comercio tarda, porque los mercaderes viajan.
- **Ikariam**: cada isla da un bien de lujo y las demás lo necesitan. Idea: cada bien especial pedido por alguien.
- **Caesar III**: la plebe pide comida variada y la ciudad baja si falta; el tributo al emperador es un gasto fijo.
  Idea: un gasto grande y fijo que Roma exige (sumidero del oro).
- **Imperator: Rome**: tesoro con ingresos y gastos mensuales a la vista; el excedente de una provincia se lleva por
  ruta a otra y da bonos. Idea: el excedente tiene adónde ir.

## 7. Tareas que saldrían (PROPUESTAS; van a «Propuestas por aprobar»; nada entra sin el sí del usuario)
Todas sirven a la línea L2, que **ya está en la lista de la 1.0**: no abren línea nueva, no hay que sacar otra.
Lo de abajo del todo va detrás de la 1.0.
1. **EC1 · Cada recurso tiene uso hasta el final** (≈0,8 M; reglas y bot). Piedra para obras públicas y murallas,
   madera para la flota, hierro para la forja; costes de niveles altos y producción que casen; el tope deja de
   quemar más de una cuarta parte. Se ve: en la hoja de cuentas casi nunca sale «se pierden»; cifra del bot por debajo
   del 25 % en las dos partidas.
2. **EC2 · Mercado con precios** (≈0,6 M; reglas, ficha y bot que lo usa). Cada bien tiene su precio; si vendes mucho,
   baja; el grano se encarece en invierno y en guerra. Se ve: el mercado dice «hoy el grano está caro». Sirve también
   a L6 (VC1 se apoya en él: va **antes** de VC1).
3. **EC3 · Un ritmo con decisiones cada estación** (≈0,4 M; datos y una prueba). Obras y reclutas que nunca pasen de
   unos 6 turnos y un gasto grande que elegir cada año (el tributo de guerra, §8). Se ve: cada turno hay algo que
   decidir. Prueba con el bot que lo mide.
4. **EC4 · Clases que notan cuánto** (sin coste aparte: se mete en CS1, que ya está aprobada para L3). La plebe mira
   cuánto grano hay por cabeza, no solo si hay.
5. **EC5 · «Este año» de un vistazo** (≈0,6 M; pantalla a 390 px). Qué produces, qué gastas, qué te falta y hacia qué
   victoria va tu dinero. Es el «Sabes de un vistazo» de L2.
Orden: EC1 → EC2 → (VC1, VC2, VC3) → EC3 → EC5. Suma ≈2,4 M.
**Después de la 1.0**: cadenas de productos (aceite, vino, cerámica), villas de esclavos, economía por región.

## 8. Historia (dictamen: APTO CON NOTAS)
- **Qué se producía**: grano sobre todo; vino y aceite crecen tras la segunda guerra púnica, con fincas trabajadas por
  esclavos (Catón, *De agri cultura*, h. 160 a.C.): histórico. Plata de las minas de Cartago Nova, con unos 40 000
  hombres según Polibio (en Estrabón 3.2.10): histórico.
- **Cómo se pagaba**: en bronce (*aes grave*) y didracmas; el **denario** nace hacia el 211 a.C. (M. Crawford, *Roman
  Republican Coinage*, 1974). Llamar «denarios» al oro antes del 211 es **licencia de juego**. La paga del soldado
  (*stipendium*) desde el 406 a.C. (Livio 4.59–60): histórico. El **tributo** de los ciudadanos pagaba la guerra y se
  suspendió en 167 a.C. con el botín de Macedonia (Plutarco, *Emilio Paulo* 38; Cicerón, *De officiis* 2.76):
  histórico, y es la base del «gasto grande de cada año» de EC3. El diezmo de grano de Sicilia (Cicerón, *In Verrem*
  2.3): histórico. Indemnizaciones de Cartago, 3200 talentos en 241 y 10 000 en 201 (Polibio 1.63 y 15.18): histórico.
- **Cómo se comerciaba**: tratados Roma–Cartago que reglan dónde se puede comerciar (Polibio 3.22–25): histórico. Los
  senadores no podían tener barcos grandes desde el 218 (ley Claudia, Livio 21.63): el comercio queda para los
  ecuestres (encaja con las clases). Delos, puerto franco en 166 (Polibio 30.31): histórico.
- **Licencia de juego**: el «oro» como moneda única, los cinco recursos, el almacén que pierde lo que no cabe, el
  cambio fijo del mercado y todas las cifras. Precios que suben en invierno y en guerra: **probable** (Livio cuenta
  repartos de grano barato por los ediles, 30.26 y 31.4).
