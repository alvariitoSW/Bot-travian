# EV1 · Cómo orientar la política de AQVILA (16/11/2026)

Informe pedido por el usuario: «un informe de Fable 5.2 sobre cómo orientar esta parte y que nos dé una pequeña maqueta».
Maqueta para el móvil: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/politica/ (un año, 264 a.C., cinco minutos).
**El juego no se ha tocado.** Todo lo de abajo es propuesta hasta que lo apruebes.

## 1. La idea en una frase
**Cada estación, una carta. Cada carta, una decisión con precio a la vista. Al acabar el año, ves tu hilo al lado del de
la historia real.** No hay cinco sistemas de política: hay uno solo, con la misma forma siempre.

Brújula que diste el 16/11: «un juego propio, hasta donde puedas ver la política en directo, que tenga mucho peso en el
juego y sea una parte viva e interactiva». De ahí salen cuatro reglas:
- **Juego propio, no un menú**: la sala del Senado es un lugar, con sus senadores a la vista, como la batalla tiene su campo.
- **En directo**: no ves solo el resultado. Ves el debate, quién habla, qué senadores cambian de opinión y el recuento voto a voto.
- **Interactiva**: influyes mientras ocurre, con tratos, promesas y, más adelante, discursos y el veto del tribuno.
- **Con mucho peso**: cada ley cambia algo que se toca fuera de la sala (oro, levas, obras, guerras permitidas,
  alianzas) y deja una marca en el hilo de la historia. Regla del 13/11 que se mantiene: «lo que no toca la ciudad, sobra».

## 2. El problema de hoy
La política está repartida en siete papeles que se pisan: Senado nuevo (SN), Foro (Q8), provincias y edictos (Q10),
decretos de Tropico (FJ1), gobierno de provincias (GR1), diplomacia (C3) y eventos (P103). Construidos por separado
serían cinco pantallas y cinco maneras de decidir. Y lo único hecho, el motor del Senado (SN1), no se ve: no tiene pantalla.

## 3. Qué se funde, qué se aplaza y qué sobra
| Hoy está como | Pasa a ser | Por qué |
|---|---|---|
| Senado nuevo (SN1 hecho, SN2 pantalla) | **La sala**: el sitio único de la política | Ya está aprobado y el motor existe |
| Foro, una decisión al mes (Q8) | **Carta de un toque** dentro de la sala (sin votación) | Ya decidiste el 13/11 fundir el Foro en el Senado |
| Eventos de historia alternativa (P103) | **Encrucijada**: la carta fechada que abre la estación | Es lo que da sentido a votar: pasa algo real y respondes |
| Diplomacia (C3: alianzas, tributos) | **Leyes de paz, alianza y tributo** que se votan, más una lista «Tratados» | No hace falta una pantalla de diplomacia |
| Edictos (Q10) + decretos (FJ1) + oficios (GR1) | **Un solo sistema: «oficio y edicto» por provincia** | Son la misma idea con tres nombres |
| Cónsules (SN3) y dictador (SN4) | **Cartas**: elección de cónsules cada invierno; dictador tras un desastre | No necesitan pantalla propia |
| Triunfo (SN5) | Se queda, detrás de la batalla nueva (GC4) | Depende de ella |

**Se aplaza**: empezar con cualquier pueblo (Cartago, griegos, galos). Primero Roma bien hecha; las encrucijadas se
guardan con un campo «para quién», así otro pueblo es añadir cartas, no rehacer nada. La familia con parientes (P70).
**Sobra**: la pantalla del Foro aparte; J5; el concurso de arte del Senado (SN6: basta la guía de arte); «la IA enemiga
también construye» sale de C3 y va al carril de campaña (no es política).

## 4. Cómo se juega (lo que enseña la maqueta)
1. **Sale una encrucijada fechada**: «Primavera de 264 a.C. · Mesina pide ayuda». Depende del año y de lo que has hecho.
2. **La sesión del Senado, en directo**: 30 senadores en tres bandos que salen de tu ciudad. Hablan por turno, los
   dudosos se van decantando y la cuenta se mueve sola. Te faltan votos: tocas un trato (una promesa o un pago) y los
   dudosos de ese bando se pasan a tu lado en el acto. Cuando quieras, «Votar ya»: el recuento sale voto a voto.
3. **Decides, y se nota**: las promesas te atan. Si prometes botín y luego firmas la paz, los militares te lo cobran.
4. **Cierre del año, «el hilo de la historia»**: dos hilos, el real y el tuyo. Donde te desvías, se separan. Abajo, el
   rumbo que llevas. Los finales de partida salen de ahí.

Los cinco terrenos que pediste caben en la misma carta: batallas (¿cruzas?), alianzas (Hierón), política (el voto),
economía (el oro del trato), cultura (los gladiadores).

**Por qué se entiende sin instrucciones**: una sola cosa por pantalla; un solo botón rojo; cada opción enseña antes lo
que cuesta y lo que da; después, las cifras se mueven delante de ti; y siempre los mismos tres gestos (leer, tocar una
tarjeta, pulsar el botón). No se chiva «lo que pasó de verdad» hasta el cierre: ahí se aprende la historia.

## 5. Qué reutiliza del motor que ya existe
- `G.senadoSala`, `G.escanos`, `G.humores`, `G.votos`, `G.tratos`, `G.votar`, `G.dejarPasar`, `G.veto`: la sala entera.
  La maqueta usa la misma fórmula de voto.
- `D.BANDOS` y `D.LEYES` (12 leyes con fuente y dictamen): son ya la mitad de las cartas.
- `G.favorAplica`, `G.favorBajo`: el favor sigue siendo la media de los humores; nada de lo que lo usa se rompe.
- Hechos históricos y Códice: cada encrucijada enlaza su ficha; el hilo del año va a la Crónica.
- Lo nuevo de verdad es poco: una tabla `D.ENCRUCIJADAS`, la cuenta del desvío y los finales.

## 6. En qué orden y por qué
1. **La sala a la vista** (es SN2). El motor lleva hecho desde el 13/11 y nadie lo ve. Es lo más barato y lo que más se nota.
2. **Encrucijadas: motor y luego pantalla.** Es tu pedido (P103) y se apoya en la sala.
3. **El hilo y los finales.** Sin esto, desviarse no tiene premio.
4. **Foro de un toque y tratados.** Son más cartas para un sistema que ya funciona.
5. **Provincias: oficio y edicto.** Lo último porque depende del formato A+ y del mapa, y es lo más caro.
6. **Cónsules, dictador, triunfo y equilibrio.** Adorno y ajuste, con partidas tuyas.

## 7. Historia: fuentes y dictamen de la maqueta
| Carta | Fuente | Dictamen |
|---|---|---|
| Mesina pide ayuda (264) | Polibio, *Historias* 1.10–11 | Histórico. El Senado dudó y votó la asamblea del pueblo |
| Paz y alianza con Hierón | Polibio 1.16; Diodoro 23.4 (difieren en la cifra del pago) | Histórico, pero fue en 263: juntarlo en 264 es **licencia de juego** |
| Tratados con Cartago | Polibio 3.22–26 | Los tratados, históricos; renovarlos en 264 no ocurrió: **licencia de juego** |
| Primeros gladiadores (264) | Livio, *Períoca* 16; Valerio Máximo 2.4.7 | Histórico. Que tú lo permitas o lo pagues: **licencia de juego** |
| Primera flota (260) | Polibio 1.20–21 | Histórico |
| Tres bandos y 30 escaños | — | **Licencia de juego**: Roma no tenía partidos y el Senado eran unos 300 |
| Los rumbos que no ocurrieron | — | Conjetura nuestra, marcada así en pantalla |

Citas hechas de memoria, sin abrir las obras en esta sesión: hay que cotejarlas antes de llevarlas al juego (skill `historia`).
Dictamen: **APTO CON NOTAS** para maqueta.

## 8. Tareas propuestas (una sesión cada una; coste aproximado)
| Tarea | Qué se nota al jugar | M |
|---|---|---|
| PL1 La sala del Senado en el juego (es SN2) | Cada estación votas una ley con tratos | 0,95 |
| PL2 Motor de encrucijadas, sin pantalla | Nada aún: 8 a 10 cartas de 280 a 241 a.C. con fuente, desvío y guardado | 1,0 |
| PL3 Encrucijadas en pantalla | La carta fechada abre la estación, como en la maqueta | 1,0 |
| PL4 El hilo de la historia y los finales | Cierre de año con los dos hilos; 4 o 5 finales de partida | 0,9 |
| PL5 Foro de un toque (Q8 fundida) | Decisiones pequeñas con efecto por clase, sin votar | 0,6 |
| PL6 Tratados (lo político de C3) | Paz, alianza y tributo se votan; lista de tratados | 1,0 |
| PL7 Provincias: oficio y edicto, diseño y maqueta (es GR1 + Q10) | Maqueta: dar oficio y un edicto a una provincia | 0,8 |
| PL8 Provincias en el juego | Las ciudades fuera del tope se gobiernan así | 2,0 |
| PL9 Cónsules y dictador como cartas (SN3 + SN4) | Eliges cónsules en invierno; dictador tras un desastre | 0,9 |
| PL10 Equilibrio con tus partidas (SN7) | Que ninguna decisión sea obvia | 1,0 |

Total: unos 10 M en diez sesiones. Lo jugable de verdad (PL1 a PL4) son unos 3,9 M. El triunfo (SN5) sigue donde está.

## 9. Lo que decides tú
1. ¿Vale la orientación «una sola sala, todo son cartas»? (A) Sí, y pasa al tablero PL1 a PL4; (B) Sí, pero quiero cambiar cosas; (C) No.
2. ¿Con qué pueblo se empieza? (A) Solo Roma primero y los demás después, recomendada; (B) Roma y Cartago a la vez (dobla el coste de las cartas).
3. ¿Cuánto se enseña de la historia real antes de elegir? (A) Nada hasta el cierre del año, recomendada; (B) Una marca «así fue» en la opción real.
4. ¿Cada cuánto sale una encrucijada? (A) Una por año y las demás estaciones leyes normales, recomendada; (B) Una por estación.
