# SUP1 · Mesa de diseño del modo supervivencia (25/11/2026)

Estado: **diseño cerrado y respondido por el usuario el 25/11** (§9, §11). Reparto aprobado. Sin construir. Rama `sup1-diseno`.
Base: `SUP0-modo-supervivencia.md` (decisiones literales del usuario, no se reabren) y `PLAN-2.0.md` («Modo
supervivencia», §3 Estándar, «M2: respuesta del usuario al estándar»). Aprobado abrir SUP1 el 25/11: «Carril aparte»,
«Sí, ya». Sirve a OBJETIVOS → Corazón (guerras) y Músculo (entretenimiento).

Mesa: Corazón (Batallas + Combate), Músculo (con Arte de Mapas), Arte, Sonido e Historia, cada uno con su guía; y,
por aviso del vigía, los dos departamentos de batalla nuevos: Animación y Gráficos (§2b).
Todos leyeron y opinaron; ninguno tocó código. Lo que sigue es la síntesis del director; las discrepancias van a §9.

## 0. En una frase
Eres el oficial de una guarnición argiva en la frontera con Esparta, hacia el 669 a.C. El tiempo corre sin parar: de
mañana repartes a tus hombres para talar, cavar y vigilar; por la tarde te preparas; por la noche llega la oleada y la
peleas **a pie con tus 12** mientras el resto aguanta en sus puestos. Al alba, cuentas y sigues. Ganas si aguantas **3 años**.

## 1. El tiempo (decidido por el usuario: «Tiempo seguido»)
El reloj **no se corta**: no hay hoja que pare el juego ni turno. Corren el día y la noche, y pasan solas las estaciones
y los años. (La mesa recomendaba un día por estación; el usuario eligió tiempo seguido.)

| Pieza | Cifra | Qué pasa |
|---|---|---|
| Un día | ~3 min reales | Mañana ~1:10 trabajos · tarde ~0:40 preparar · noche ~1:10 |
| Una estación | 3 días · ~9 min | Una noche de **oleada grande** por estación (con aviso); las otras, tranquilas o con una incursión pequeña |
| Un año | 4 estaciones · ~36 min | Primavera tantean · **verano la gorda** · otoño saqueo · invierno frío y hambre |
| Partida | **3 años** · 12 oleadas grandes · ~1 h 45 | La última, en el invierno del año 3, la más dura |

Reglas del reloj:
- Pausa siempre a la vista; se pausa sola al salir de la aplicación. **×2 solo de día**; de noche nunca.
- «Saltar a la noche» cuando no queda nada que hacer. Rueda de órdenes abierta: el juego va a ×0,25 (no se para).
- **Siempre hay aviso** al menos medio día antes (humo, el perro, un explorador): cuántos, de dónde, qué traen.
- Al alba, un **parte corto en la cinta** (bajas, daños, lo recogido, lo que viene). No para el juego; se abre entero con un toque.
- Las obras largas (doblar el foso, una torre) se eligen cuando quieras en el panel; duran días o estaciones y se ven avanzar.
- Guardado solo, cada alba y al salir; si recargas a media oleada, esa noche vuelve a empezar.

Para cuando entre en la campaña («primero aparte, luego dentro»): el cambio de estación sigue marcado, así que una
estación del campamento casa con un turno de la polis sin rehacer el reloj.
Historia: los griegos guerreaban en verano (temporada de campaña); el invierno pesa por comida y leña.

**Jueces rápidos** (usuario, literal, §11): los jueces **no juegan la partida entera**. Las reglas se prueban en Node
con el reloj acelerado y desde partidas guardadas avanzadas (año 2, año 3 a punto de acabar); el navegador solo saca
las capturas de cada punto de la ficha. Vara: **≤ 15 min** por prueba de tanda, como pide PLAN-2.0 para M1.

## 2. La pelea en oleadas (decidido por el usuario: «Las dos a la vez»)
**Las dos cosas a la vez, en la misma escena**: no se carga otra pantalla.
- **A pie (lo normal)**: llevas al oficial y su grupo de **12** con la rueda. Vas a donde duele: la puerta, la brecha.
- **El resto de la guarnición** pelea sola en el **puesto** que le diste: un tramo de empalizada, la puerta, las
  torres o la reserva. Desde arriba (1 toque) solo das órdenes de puesto: «Reserva al norte», «Torres: piedras»,
  «Abandonar el oeste». No se dirige hombre a hombre.

| Pieza | Cifra |
|---|---|
| Grupo del oficial | 12 (una fila de 12 o dos de 6) |
| Guarnición | 48 al empezar (4 grupos de 12); 72 como mucho |
| Refuerzos | 2–4 por estación, por mar desde la polis. No hay reclutas a voluntad: cada hombre importa |
| Oleada | De 15–20 hombres (primera) a 120–150 (última). Las grandes llegan por tandas |
| Figuras vivas a la vez | ≤ 200 (≈ 70 propias, ≈ 130 enemigas); los caídos, con tope |

Escalones del enemigo (lore elegido: frontera de Argos con Esparta, §5; Historia lo afina): saqueadores ligeros
con jabalina y honderos → hoplitas vecinos en grupos pequeños con hachas y fuego contra la madera → columnas mayores →
**la falange espartana** al final. Escala en número, en mezcla, en lados de entrada y en herramientas.

Las defensas cambian la pelea:
- **Foso**: el que lo cruza va a menos de la mitad y queda abajo, a tiro.
- **Empalizada**: no se cruza. Solo por la puerta o por una **brecha** (cae tras un rato de hacha o fuego).
- **Puerta**: hueco de 3–4 m, el cuello de botella. Tu fila de 12 con los escudos solapados la tapona.
- **Torres**: 2–4 hombres tiran piedras y jabalinas desde arriba; gastan lo que traen los trabajadores.

Heridos y bajas: muerto no vuelve; grave, fuera 1–2 estaciones en la tienda de heridos; leve, vuelve al alba cansado.
Se gana la noche cuando el enemigo pierde la mitad y huye. **Se pierde la partida** si muere el oficial (en «Normal» el
segundo toma el mando una vez), si el enemigo ocupa el fuego del centro 20 s, o si la guarnición baja de una cuarta parte.

**Motor**: se usa el de hoy, sin fijar motor nuevo. Tal cual: lucha hombre a hombre con escudo y heridas
(`js/combate.js`), física que no deja atravesarse (`js/fisica-batalla.js`), tiradores (`js/tiro.js`), columna y línea
(`js/bloque.js`), muro hoplita rival (`js/falange-rivales.js`). **Depende del rediseño de la batalla** (sesión de
debate 2.0): animaciones (golpe, caída, subir a la torre, hachazo a madera), cámara detrás del oficial y pintar
150–200 figuras en el móvil. **Piezas que faltan** (pases a Combate): muros fijos en la física (empalizada, foso,
puerta), enemigos sueltos que piensen (hoy la IA piensa por bloques), la lanza hoplita (dory) en la tabla de armas y
hacha contra madera.

## 2b. Los seis departamentos de batalla (vigía, 25/11)
El usuario aprobó seis departamentos de batalla («Sí, los seis»): Jugabilidad y mando (hoy Batallas), Motor de guerra
(hoy Combate), **Animación** (nuevo), **Gráficos** (nuevo), Arte de soldados y Sonido. Se montan en la sesión DB0. Los
seis han opinado en esta mesa. **Lo que es de su terreno no se fija aquí**: queda como dependencia o pregunta para ellos.

**Animación** (dueño de los movimientos):
- Hoy los soldados solo tienen movimientos de pelea: quieto, andar, correr, guardia, lanzar, golpear, cubrirse,
  encajar y morir (`assets/soldados/*.json`). `tools/resolve_units.py` convierte solo seis de 0 A.D. (l. 40).
- **No existen**: talar, cavar, clavar, acarrear, sentarse, dormir, subir a la torre, hachazo a la madera ni perro.
  El trabajo de la ciudad se finge balanceando la figura entera (`js/gfx/trajin.js:190`), y eso suspende el juez de lo «robótico».
- Fallo de fondo: el paso de un movimiento a otro es de golpe (`js/gfx/units.js:74`). Lo arregla el rediseño.
- **Se puede ya** (SUP3/SUP4): movimientos de trabajo de 0 A.D. solo para el modo, sin tocar los de pelea. Perro y
  mula de 0 A.D., por comprobar y si cabe el peso.

**Gráficos** (dueño de luz, cielo, cámara y fluidez):
- La receta de día y noche ya existe en la ciudad, apagada (`js/gfx/city3d.js:233`, `DIA_NOCHE=false`): sol y
  hemisférica, niebla por estación, antorchas instanciadas sin luz real (l. 637), humo (`js/gfx/vida.js:27`), cielo
  (`js/gfx/ground.js:141`). En el campamento: **una sola luz real** (sol → luna), círculos de luz pintados en el suelo,
  sombra recalculada solo al cambiar la hora y ninguna de noche.
- Cámaras: la maqueta del bloque (`gobierno/maquetas/bloque/camara.js`) ya pasa de arriba al oficial en 1,4 s. Falta
  encuadrar el campamento entero, no meterse en la empalizada y probarlo a 390 px con el panel abierto.
- Presupuesto propuesto, sin fijar: ≤ 120 llamadas de dibujo, ≤ 600 000 triángulos, densidad de píxeles ≤ 1,5. Las
  cifras de aquí son de render por software: la prueba de verdad es su móvil.
- **Se puede ya** (SUP2, en `js/gfx/superv3d.js`): reloj de luz de cuatro tramos, antorchas con su círculo, humo,
  cielo de noche y la cámara de arriba. La del oficial se copia de la maqueta, **provisional**.

**Preguntas para la mesa de batallas** (no al usuario; las responde DB0 o el debate de batallas):
1. ¿La cámara del oficial de SUP3 será la de la maqueta del bloque o la del rediseño? ¿Quién es su dueño?
2. ¿El rediseño trae su propio tono de luz, cielo y color? Si es así, el campamento los usa.
3. ¿Las figuras del campamento (trabajadores, guarnición) cuentan dentro del tope de 200 o aparte?
4. ¿El paso suave entre movimientos es para todas las figuras o solo para el grupo del oficial?
5. ¿Los movimientos de trabajo son de Animación o del taller de soldados? ¿Perro y mula, de Animación o de Arte?
6. ¿La torre se sube con escala o el hombre aparece arriba? ¿El hachazo a la madera es un golpe nuevo?
7. ¿Quién reactiva la receta de día y noche: Cerebro (ciudad) o un módulo común nuevo?

## 3. El campamento (cerrado por la mesa)
«Otro juego, nada que ver con la ciudad». Lo que lo hace distinto:
1. **Tus hombres son el recurso.** No hay oro ni colas. Cada hombre talando no vigila ni descansa; el que no descansa
   pelea cansado de noche. El panel de abajo es solo eso: cuántos a cada trabajo (`−` / `+`).
2. **Se levanta a mano, en el sitio.** Tocas el suelo para marcar una obra; la ves avanzar (foso al 62 %, estacas que
   suben una a una). Lo que traen de fuera (leña → estacas, piedra, comida, agua) es lo que limita.
3. **Cuanto más grande, más cuesta defenderlo.** Más empalizada = más tramos que cubrir con los mismos hombres.
4. **Se rompe y se repara.** Cada noche deja brechas y quemaduras; al alba eliges reparar o avanzar.
5. **Salir es arriesgar.** Talar y cazar lejos da más, pero el bosque es donde espera el enemigo.

Cinco etapas visibles, mismo encuadre (captura `SUP1-etapas.jpg`): **Vivac** (carros, hogueras, mantas) → **Tiendas**
en filas, leña y grano → **Foso** (se ve cavar) → **Empalizada con puerta** → **Torres y talleres** (fragua, horno,
altar). Todo madera, tierra, cuero y lona; ni piedra labrada, ni tejas, ni edificios de la ciudad.
Licencia de juego (Historia): el plano ordenado, las torres de madera, el campamento que crece durante años y los
talleres. Base real: la *Ilíada* (muro, foso y estacas del campamento aqueo, 7.436–441, 12.52–66), el *charax* de
Tucídides 6.66 y el muro de piedra suelta de Pilos (Tuc. 4.4).

## 4. Las dos vistas y la rueda
- **Desde arriba** (vertical, como la ciudad): campamento entero, panel de hombres, obras. Botón «A pie» arriba a la
  derecha (1 toque) y pellizco.
- **El oficial a pie** (horizontal, como las batallas; también vale en vertical): cámara a la espalda, palanca a la
  izquierda, **rueda** a la derecha con tres partes: **Tú · Tu grupo · Perro**. Cada orden en 2 toques: Línea,
  Columna de dos, Sígueme, Defender aquí, Trabajar conmigo. Botones ≥ 44 px. Se cierra al tocar fuera.
- **Tu animal: el perro** (Historia: APTO; Argos, *Odisea* 17.290–327): avisa de noche, sigue al oficial. Las mulas,
  parte del campamento (acarrean leña, *Ilíada* 23.110–126).

## 5. Época y lore (Historia)
- **Hoplitas en el 800 a.C.: NO APTO tal cual.** El escudo hoplita y el casco corintio aparecen hacia el 700 a.C.
  (Snodgrass 1964; coraza de Argos T45, ~720 a.C.); la falange cerrada, en el vaso Chigi (~650 a.C.) y Tirteo.
  **Decidido por el usuario: 700–650 a.C.** (el modo es aparte de la campaña y tiene su fecha). Hoplitas sin licencia.
- **Primer lore, decidido por el usuario: la frontera de Argos con Esparta** (Tireátide e Hisias, ~669 a.C.; Pausanias
  2.24.7 cuenta la derrota espartana en Hisias; la disputa de Tirea, Heródoto 1.82, es posterior, ~546). Eres el
  oficial de una guarnición argiva en la frontera. Enemigo: incursiones espartanas, de ligeros a la falange.
  Historia redacta el lore con fuente y dictamen. Siguientes lores: Tasos (~650 a.C., colonos de Paros contra los
  tracios, Arquíloco fr. 5 West), Leontinos (729 a.C., Tucídides 6.3), Monte Ira (Pausanias 4.17–20, leyenda).
- Lo que se tiene que ver: escudo redondo grande **con emblema pintado** (gorgona, toro, ave; todos los de la
  guarnición, el mismo), casco corintio con cimera, grebas, coraza de campana. Evitar: lino, cascos ático y tracio,
  todo lo romano y el escudo de rayos de los vídeos de referencia. Espartanos del s. VII: hoplitas como los tuyos; se distinguen por el emblema y el color del escudo (la lambda es posterior, s. V: no usarla).
- Las citas son de memoria: Historia las comprueba antes de que salga texto en pantalla.

## 6. Sonido (Director de Sonido)
- Día: hachazos, mazo en estacas, palas, voces cortas, viento; donde trabaja cada hombre. Sin música.
- Noche: fuego, grillos, un búho, el perro; un bordón grave casi inaudible. El silencio da el miedo.
- Aviso de oleada: **sálpinx** (trompeta griega de bronce; Il. 18.219); 30 s antes lejos, 10 s antes cerca. Peán y
  «Alalá» antes de cargar (las voces ya existen en `assets/voces/`).
- Amanecer: pájaros, sálpinx corto, música de victoria (ya existe). Derrota: el fuego solo, sin voces.
- Todo aviso tiene también su icono: nada depende solo del oído.
- Peso: audio hoy 8,9 MB de 10 MB; lo nuevo, 150–250 KB (cabe). Ambiente por código, 0 KB.

## 7. FICHA DE OBJETIVO y juez de aspecto (nota ≥ 8,5)
Doce cosas que se tienen que **ver**. Cada una se comprueba en una captura fija (encuadre y hora fijados por el
script de capturas de cada tanda) a 390×844 o 844×390.

| # | Se tiene que ver | Captura | Tanda |
|---|---|---|---|
| 1 | Cinco etapas del campamento con el mismo encuadre; cada una con al menos una pieza nueva | 5 desde arriba, mediodía | SUP4 |
| 2 | ≥ 3 hombres a la vez con la herramienta en la mano (no flotando), en postura de trabajo (talar, cavar, clavar), con ≥ 2 posturas distintas; no quietos | arriba, mañana | SUP4 |
| 3 | Un hombre acarreando un tronco o un saco entre el bosque y el campamento | arriba, mañana | SUP4 |
| 4 | Foso: franja más oscura que el suelo, con borde de tierra; a medias se ve el tramo sin cavar | arriba, etapa 3 | SUP4 |
| 5 | Empalizada que rodea con un hueco de puerta reconocible | arriba, etapa 4 | SUP4 |
| 6 | ≥ 2 hogueras con humo que sube de día | arriba, mediodía | SUP2 |
| 7 | Noche: cielo más oscuro que el campamento; ≥ 4 antorchas con su círculo de luz en el suelo; a pie, el oficial se distingue del fondo | arriba y a pie, noche | SUP2 |
| 8 | El oficial de espaldas con penacho y su grupo, en columna de dos y en línea (dos capturas): cabezas y escudos de los 12 a la misma altura; el perro a < 3 m, sin flotar ni hundirse | a pie, tarde | SUP3 |
| 9 | ≥ 10 escudos de la guarnición con el mismo emblema, de color distinto al enemigo | a pie | SUP3 |
| 10 | Oleada con antorchas a < 20 m de la empalizada, saliendo del bosque | arriba, noche | SUP5 |
| 11 | La fila de 12 tapando la puerta o una brecha, con enemigos amontonados en el hueco; ningún escudo dentro de otro ni de un cuerpo, los bordes se solapan | a pie, noche | SUP5 |
| 12 | Después de la noche: caídos fuera del foso y un tramo roto por reparar. En **todas**: ni piedra labrada, ni tejas, ni edificios de la ciudad | arriba, alba | SUP5 |

**Cómo puntúa el juez de aspecto** (un agente que solo mira las capturas, sin leer el código):
- Cada punto: **1** se ve claro; **0,5** se ve pero cuesta; **0** no se ve. Nota = suma ÷ 12 × 10.
- **Aprueba con ≥ 8,5** (≥ 10,5 de 12) y **ningún punto a 0** en los de su tanda.
- Cada tanda se juzga solo con sus puntos (nota sobre los suyos) y la SUP5 cierra con los 12 juntos.
- Calibración: la captura de partida (§8) saca **0 de 12**: hoy no hay campamento. Las maquetas son el objetivo de
  composición, no de acabado: el acabado lo da el arte 3D real.

Referencias de **ideas** (nunca su código ni su arte): los vídeos del usuario (`REF-supervivencia.md`: oficial con su
grupo, rueda de tres partes, campamento que crece, noche con antorchas); Total War (puestos en la muralla, cuello de
botella de la puerta); juegos de defensa de colonia (repartir hombres entre trabajar y vigilar).

## 8. Capturas
Captura de partida (lo que hay hoy en el juego; el modo no existe):
- `gobierno/capturas-tarea/SUP1-partida-oficial-h.jpg`: el oficial a pie de hoy (FU5), cámara al hombro.
- `gobierno/capturas-tarea/SUP1-partida-falange-v.jpg`: la falange a pie de hoy (FU6), en vertical.

Maquetas (bocetos 2D del objetivo; fuentes en `gobierno/maquetas/supervivencia/`, se rehacen con
`node gobierno/maquetas/supervivencia/_captura.mjs`):
- `SUP1-menu.jpg`: entrar en 2 toques; tipo de partida y lore (frontera de Argos) con «Acampar».
- `SUP1-arriba-dia.jpg`: desde arriba de mañana; reloj del día, aviso de humo, panel de hombres.
- `SUP1-etapas.jpg`: las cinco etapas del campamento.
- `SUP1-oficial.jpg` (844×390): el oficial a pie, su grupo en línea, el perro y la rueda.
- `SUP1-noche.jpg`: la oleada desde arriba, brecha tapada por tu grupo, puestos.
- `SUP1-amanecer.jpg`: el parte del alba abierto entero (con tiempo seguido, por defecto va corto en la cinta y no para el juego).
- `SUP1-tiempo.jpg`: cómo pasa el tiempo (rehecha con tiempo seguido).

## 9. Lo que decidió el usuario
Respondidas el 25/11 (literales en §11): tiempo **seguido**; **3 años**; **700–650 a.C.**; **frontera de Argos con
Esparta**; pelea **las dos a la vez**; tope de descarga **60 MB**; reparto **aprobado**.

## 10. Reparto SUP2–SUP5 (aprobado por el usuario el 25/11)
Archivos propios del modo (área nueva «supervivencia» en `areas.json`, la da de alta el vigía). Guardado propio
`aqvila-superv-v1`, sin tocar `aqvila-save-v1` ni `G.load`. Lógica sin pantalla, probada en Node.
M = millones de tokens (`gasto.mjs`). Gasto medido en esta sesión: 3,2 M (director + departamentos, todo Opus). Lo de abajo es estimación: declarado (esperable).

| Tanda | Qué entrega | Archivos nuevos | Tamaño | Gasto esperable | Depende de |
|---|---|---|---|---|---|
| **SUP2** | Botón «Supervivencia» (2 toques), tipo y lore, campamento inicial (vivac), reloj del día y la estación, hoja del alba vacía, dos vistas con su botón, día/noche con antorchas y humo, ambiente sonoro, guardado propio | `js/superv.js`, `js/ui-superv.js`, `js/gfx/superv3d.js`, `css/superv.css`, `test/superv.test.mjs` | Grande | 2,5 (4–5) M | Pases: una línea en el menú (`js/ui.js`), `sw.js` (subida), cámara del oficial de la maqueta del bloque (Batallas) |
| **SUP3** | Oficial con su grupo de 12, rueda Tú·Grupo·Perro, columna/línea/sígueme/defender/trabajar, perro, escudos con emblema | `js/sup-grupo.js`, `js/ui-sup-rueda.js`, `js/gfx/sup-camara.js`, `test/sup-grupo.test.mjs` | Grande | 2,5 (4–5) M | Motor a pie de hoy (`bloque.js`); animaciones del rediseño (si no llegan, las de hoy) |
| **SUP4** | Trabajos y campamento que crece: panel de hombres, obras tocando el suelo, 5 etapas, foso, empalizada, puerta, torres, talleres; hombres trabajando de verdad; sonidos de trabajo | `js/sup-campamento.js`, `js/gfx/sup-obras.js`, `test/sup-campamento.test.mjs` | Grande (el arte más gordo: 4 movimientos de trabajo, tiendas, puerta, torre) | 3 (5–6) M | Tope de 60 MB (aprobado; lo aplica Arte en `arte.json`); movimientos de 0 A.D. (talar, cavar, martillear, acarrear) |
| **SUP5a** | Oleadas en reglas: calendario, escalado, tipos, bajas, refuerzos, derrota y victoria a los 3 años; defensas con vida; bot bueno aguanta 8/10, bot vago cae 10/10, **en ≤ 15 min** con reloj acelerado y partidas avanzadas | `js/sup-oleadas.js`, `js/sup-defensas.js`, `test/sup-oleadas.test.mjs` | Medio | 1,5 (2–3) M | Nada (no depende del rediseño) |
| **SUP5b** | La oleada en vivo: enemigos, puestos, brecha, torre, tu fila en la puerta, sálpinx y avisos, hoja del alba con datos, juez de aspecto con los 12 puntos | `js/sup-lucha.js`, `js/ui-sup-oleada.js` | Grande | 2,5 (4–5) M | **Rediseño de la batalla** (animaciones, cámara, 200 figuras); pases a Combate: muros fijos, enemigos sueltos, dory, hacha contra madera |

Orden: SUP2 → SUP3 → SUP4, con **SUP5a en paralelo** desde SUP2 (solo reglas). SUP5b, cuando el rediseño de la
batalla haya fijado animaciones y cámara. Total: **12 M declarados, 19–24 M esperables** (esperable = declarado × 1,5–2, como en PLAN-2.0 §4).

Estándar del carril (de SUP0, se mantiene; Gráficos añade **fluidez**: con 200 figuras de noche, ningún tramo de 10 s baja de 30 img/s en su móvil, medido con `js/gfx/fluidez.js`): aspecto ≥ 8,5 con la ficha de §7; se entiende (≤ 2 toques entrar, 1 toque
cambiar de vista, ≤ 2 toques cada orden, a 390 px y en horizontal); bot de reglas 8/10 y 10/10; sin errores ni red;
fichas de Historia; el «Bien» del usuario en su móvil.

## 11. Respuestas del usuario
25/11/2026, en el chat de SUP1, con botones (pidió «Mándame las preguntas en formato pregunta para que pulse»):
1. Tiempo: **«Tiempo seguido»** (la mesa recomendaba un día por estación).
2. Duración, primera respuesta, literal: «Esto habría UE evitar que los jueces jugases 3,h y tardaswn tanto en pasar las
   pruebas por qué las partidas son largas». → Los jueces no juegan la partida entera (§1, «Jueces rápidos»).
   Repreguntada con esa aclaración: **«3 años, ~1 h 45 (Recomendado)»**.
3. Fecha: **«700–650 a.C. (Recomendado)»**.
4. Lugar: **«Frontera Argos–Esparta»** (la mesa recomendaba Tasos).
5. Pelea: **«Las dos a la vez (Recomendado)»**.
6. Peso: **«Subir el tope a 60 MB (Recomendado)»**.
7. Reparto: **«Sí, aprobado (Recomendado)»**.

## 12. Fuera de este diseño
Supervivientes, Mitología y Libre (después); batallas de agua («sguaz», tema aparte); conectar con la campaña (después
de que funcione aparte); nada de código ni arte de juegos comerciales.
