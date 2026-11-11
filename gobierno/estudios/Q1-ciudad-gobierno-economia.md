# Q1 · Ciudad, gobierno y economía en un solo modelo

Pedido del usuario, 11/11/2026: «¿Y la parte de la ciudad y el gobierno no se está desarrollando artísticamente ni su
jugabilidad ni su desarrollo?». Y de la economía: «los materiales deberían tener un presupuesto mensual… según lo que
ganes en el mes es lo que gastas». Eligió que lo que sobra **se guarda, con tope**: va al almacén hasta llenarlo; lo
que no cabe se pierde.

Este diseño junta en una sola pieza lo que estaba suelto: O1 (economía nueva), J3, J4, J5 y J8, y las propuestas P67 a
P71. No cambia el juego todavía: primero lo ves en las capturas y decides.

Capturas: la **ciudad 3D real del juego** con la interfaz nueva encima (`gobierno/capturas-tarea/Q1-*.jpg`, script
`gobierno/maquetas/ciudad-nueva.mjs`).

Estudios (una mecánica cada uno, con fuentes; ideas, nunca código ni arte):
| Estudio | Juego mirado | Qué nos da |
|---|---|---|
| R1 Barrios con servicios | Caesar III | El barrio sube o baja solo según sus servicios, con retraso |
| R2 Población por clases | Imperator: Rome | Tres clases con su ánimo; la conquista trae esclavos |
| R3 Radio de efecto | Grand Ages: Rome | Edificios que ayudan o molestan a sus vecinos |
| R4 Senado y familia | Rome: Total War | Misiones con plazo y premio; favor del Senado |
| R5 Provincias y edictos | Total War: Rome II | Provincias con capital; un edicto si las tienes todas |
| R15 Cuentas del mes | Imperator: Rome (contraste EU4) | Ingresos y gastos del mes; el saldo va al tesoro, con tope |
| R16 Balance y necesidades | Anno 1800 | Producción menos consumo a la vista; cada clase sube si cubre lo básico |
| R17 Almacén con tope | Travian, Ikariam | Lo que pasa del tope se pierde; el escondite protege una parte |
| R18 Cadenas de producción | Caesar III | Una materia, un producto; el taller se para si falta gente o materia |
| R19 Ciudad viva | Anno 1800 y 117, Manor Lords | Luz del día y estación, humo, obras que se ven, multitud que se puede bajar |

## 1. La idea en cinco frases
- **Cada mes tiene su caja.** Lo que tus ciudades producen en el mes es lo que puedes gastar ese mes.
- **Todo gasto se ve contra la caja**: obras (se pagan a plazos mientras duran), reclutas, mantenimiento y lo que come
  la gente. Antes de pulsar ves si llega.
- **Al cerrar el mes, lo que sobra va al almacén hasta su tope.** Lo que no cabe se pierde, y se avisa antes para que
  puedas venderlo o gastarlo.
- **La ciudad crece por barrios y clases**: sube de nivel si tiene agua, comida, templo, ocio y termas; cada clase
  pide cosas distintas y paga distinto.
- **Se gobierna con poco**: una misión del Senado a la vez, una decisión en el Foro con su efecto en verde o rojo por
  clase, y un edicto por provincia.

## 2. Cómo crece la ciudad
**2.1 Solares (ya existe, I4).** 7 a 10 solares por ciudad. Elegir qué va en cada uno sigue siendo la decisión central.

**2.2 Nivel de barrio (P67, de R1).** Cada ciudad tiene un nivel de 1 a 4. Sube cuando tiene los servicios del nivel
siguiente; baja si los pierde, pero **con 2 o 3 meses de retraso** (un descuido no castiga).
| Nivel | Pide | Da |
|---|---|---|
| 1 Aldea | Grano que sobre | Población base |
| 2 Villa | + templo | +25 % población máxima |
| 3 Ciudad | + agua (acueducto) y ocio (anfiteatro) | +50 %; aparecen ciudadanos ricos |
| 4 Urbs | + termas y algún bien de lujo (vino, aceite, púrpura: B1 y rutas) | +80 %; más oro por impuestos |
Números nuestros, por probar. En pantalla: cinco iconos de servicio, llenos o grises, y una frase: «Para nivel 3 falta
agua». El consejo de J6 ya sabe decir eso.

**2.3 Tres clases (P68, de R2 y R16).** En cada ciudad, tres cifras en vez de una (las de R2; R16 proponía plebe,
ecuestres y patricios, pero esclavos y conquista dan más juego en esta época):
- **Ciudadanos**: pagan oro y dan legionarios. Piden vino o aceite, juegos y termas.
- **Plebeyos**: los aldeanos de hoy (F3): trabajan campos y talleres. Piden grano y templo.
- **Esclavos**: llegan con las conquistas; producen más en el campo, no pagan, y suben la inquietud.
Cada clase tiene su ánimo (cara contenta, seria o enfadada). Como en Anno 1800 (R16), para subir basta lo básico; el
lujo sube impuestos. Si una clase tiene lo que pide durante unos meses, parte
**asciende** (esclavos a plebeyos por manumisión; plebeyos a ciudadanos con «Dar ciudadanía», por oro). Si le falta,
se enfada: produce menos o se amotina.

**2.4 Cadenas cortas (de R18).** No hay calles ni caminantes: AQVILA es para el móvil. Las cadenas tienen **un solo
paso** y se ven en la cuenta del mes, no en el mapa: grano → la gente come; hierro + herrería → armas (ya existe, B8);
bien especial (B1) o ruta (B2) → lujo para los ciudadanos. Si un eslabón falta, la fila sale en rojo y el consejo dice
cuál. Un eslabón roto **baja a la mitad**, no a cero (R18): castiga sin hundir la partida.

**2.5 Capital y pueblos (J3).** La capital gobierna, recluta y comercia; los pueblos producen y llenan la caja. Igual
que estaba aprobado; aquí solo cambia que su producción entra en la caja del mes.

**2.6 Radio de efecto (P69, de R3): se aplaza.** Con 7 a 10 solares se nota poco. Vuelve cuando haya más solares.

## 3. Cómo se gobierna
Regla de pantalla limpia (la misma que pidió el usuario para la guerra): **una sola cosa por pantalla**.

**3.1 Dos favores.** Dos barras arriba de la pestaña Gobierno: **favor del Senado** y **favor del pueblo**. El Senado
da permisos y premios; el pueblo da calma y reclutas. Muchas decisiones suben una y bajan la otra.

**3.2 Misiones del Senado (P70 mínima, J5).** Una a la vez, con plazo y premio: «Construye un acueducto en Roma antes
de Iunius: 200 de oro y +10 de favor». Si fallas, baja el favor. Con poco favor, el Senado te niega cosas (levas
extra, tratados). La familia de P70 (parientes con rasgos) **se aplaza**: es mucho para el móvil al principio.

**3.3 Foro: una decisión al mes (J8).** El Foro propone una decisión con **chips verde y rojo por clase** y su coste:
«Juegos en honor de Ceres: plebeyos +8, ciudadanos +3, −120 de oro». Puedes aceptarla o dejarla pasar. Es la parte
«de discursos» que pidió P65, en pequeño.

**3.4 Provincias y edictos (P71, J4).** Las ciudades se agrupan en provincias con capital. Si tienes todas las de una
provincia, eliges **un edicto** (impuestos bajos, levas, obras públicas, comercio). Llega con J4, que agranda el mapa.

**3.5 Política territorial (J5).** Los cinco planes que pedía J5 (infraestructuras, ciudadanía, ejército, diplomacia,
mercado) se reparten: infraestructuras y ejército son misiones del Senado; ciudadanía es «Dar ciudadanía» (2.3);
mercado son rutas y edictos de comercio; diplomacia va con C3. J5 deja de ser una tarea aparte.

## 4. La economía del mes
**4.1 La caja.** Cada mes empieza con una caja por material (madera, piedra, hierro, grano) y oro. La llena lo que
producen tus ciudades ese mes, más rutas (B2), puerto y tributos. Es el «presupuesto mensual» que pidió el usuario.

**4.2 Lo comprometido.** Contra la caja se apunta, a la vista y antes de pulsar:
- **Obras a plazos**: una obra de 3 meses paga un tercio cada mes mientras dura. Así puedes tener dos obras si la caja
  da, y la cola de obras (J7) muestra cuánto se lleva cada una.
- **Reclutas**: igual, a plazos mientras se entrenan.
- **Mantenimiento** (ya existe, I3): edificios y legiones cuestan oro cada mes.
- **Comida**: la gente y el ejército comen grano cada mes.
La pantalla «Cuentas del mes» enseña, por material, una barra: lo que entra, lo comprometido y lo que queda.

**4.3 El almacén: la reserva.** Lo que sobra al cerrar el mes **va al almacén hasta su tope**; lo que no cabe **se
pierde**. Una semana antes del cierre sale un aviso: «Madera: sobran 180, caben 60, se perderán 120» con dos botones,
«Vender en el mercado» y «Adelantar obra». El tope lo da el nivel del almacén (como hoy). El almacén sigue escondiendo
parte del botín si te saquean (ya existe).
Qué se puede sacar del almacén lo decide el usuario (§7, pregunta 2).

**4.4 Oro: ingresos y gastos.** Mismo formato que el material, desglosado:
- Ingresos: impuestos por clase (ciudadanos pagan más; esclavos nada), rutas, puerto, botín.
- Gastos: mantenimiento de edificios, sueldo de las legiones, juegos y decisiones del Foro.
- Saldo del mes en grande, verde o rojo. Si cierras en negativo: desertan tropas (ya existe, I3) y baja el favor del
  Senado.

**4.5 Impuestos.** La tasa baja, normal o alta (B3) sigue por ciudad, pero ahora se ve qué paga cada clase y cómo
cambia su ánimo (chips verde y rojo).

**4.6 Comercio.** El mercado sirve sobre todo para **no perder lo que sobra**: vender antes del cierre. Las rutas (B2)
dan oro fijo al mes y acceso a bienes de lujo, que son lo que piden los ciudadanos para subir de barrio.

**4.7 El ritmo.** Hoy un mes dura 4 segundos a velocidad normal: un aviso grande cada mes cansaría. Por eso: la cuenta
es mensual y se cierra sola (la línea de arriba parpadea y suma al almacén); el **informe grande de cierre** sale cada
estación, que con I2 es el turno del mapa. Alternativa: hacer el mes más lento (§7, pregunta 3).

**4.8 Qué cambia por dentro.** Hoy los recursos son un montón único que crece de forma continua hasta el tope
(`G.tick` en `js/game.js`). Con la caja hay dos montones: **caja del mes** y **almacén**. La batalla no cambia. El
guardado gana dos campos (caja y compromisos), que se migran en `G.load`.

## 5. Cómo debe verse
El usuario juzga por la vista. Lo que pide es que la ciudad parezca viva y que la interfaz parezca de un juego de hoy.

**5.1 La ciudad 3D (city3d.js).** Ya tiene edificios de 0 A.D. y medallas de bronce (J6). Falta vida:
- **Luz de la estación**: sol alto y cálido en verano, bajo y frío en invierno; tarde dorada al cerrar el mes.
- **Humo y fuego**: humo de hornos y talleres, antorchas al anochecer. Partículas baratas.
- **Obras con andamios**: el solar en obra lleva andamio y grúa hasta acabar.
- **El edificio cambia al subir de nivel**: más alto, más piezas, tejado de otro color. Pide arte: quedan solo 1 MB
  hasta el tope de 35 (ver skill `arte`).
- **Ciudadanos**: ya pasean ciudadanas y sacerdotes por las calles, más cuantos más vecinos (city3d.js). Falta que
  digan algo: más gente en la plaza en día de juegos, menos y con antorchas de noche, corrillos enfadados si una
  clase está molesta. Sin arte nuevo.
- **El barrio se nota**: un barrio de nivel 1 tiene casas bajas; uno de nivel 4, villas, estatuas y jardines.
Referencias (R19; solo ideas): Anno 1800 aquieta la ciudad de noche y deja parar el ciclo; deja bajar la multitud en
los ajustes porque cuesta rendimiento. Anno 117 suelta la cuadrícula y da más vida a la gente. En Manor Lords las
familias construyen a la vista. Lo de Pharaoh: A New Era quedó sin confirmar.

**5.2 La interfaz.** Guía E1 (bronce, papiro, rojo pompeyano, Cinzel), maquetas elegidas del concurso K2: **Ciudad**
(medallas sobre los edificios, ficha abajo) y **Tabularium** (libro de cuentas con filas densas y chips).
- Arriba: una línea fina con la ciudad, el mes y los cinco recursos con su saldo del mes (+120 en verde, −40 en rojo).
- Abajo: tres botones redondos (Obras, Cuentas, Senado) y como mucho una ficha abierta.
- El 3D siempre visible al menos en la mitad de arriba.
- Rendimiento en móvil real **sin medir**: todo lo de 5.1 debe poder apagarse.

## 6. Qué absorbe
| Pieza | Qué pasa |
|---|---|
| O1 Economía nueva | Absorbida entera: es §4 |
| J3 Capital y pueblos | Se queda como estaba; su producción entra en la caja (§2.5) |
| J4 Mapa por regiones | Se queda; las regiones son las provincias de §3.4 |
| J5 Política territorial | Se reparte en misiones, ciudadanía, edictos y rutas (§3.5); deja de ser tarea aparte |
| J8 Foro y chips | Es §3.3 (una decisión al mes con chips por clase) |
| P67 Barrios | Entra (§2.2) |
| P68 Clases | Entra (§2.3), con necesidades por clase |
| P69 Radio de efecto | Se aplaza hasta tener más solares |
| P70 Senado y familia | Entra la misión y el favor (§3.2); la familia se aplaza |
| P71 Provincias y edictos | Entra con J4 (§3.4) |

## 7. Lo que decide el usuario
1. ¿Te convence el aspecto de las capturas Q1? Son la ciudad 3D de verdad con la interfaz nueva encima.
2. **¿Qué se puede sacar del almacén?**
   - **A. Libre, pero se ve** (recomendada): puedes gastar del almacén cuando la caja no llega; la barra lo marca en
     otro color («tiras de la reserva»). Lo que sobra cada mes es lo único que la rellena.
   - B. Con tope: como mucho un cuarto del almacén al mes.
   - C. Solo emergencias: el almacén solo paga reparaciones, defensa y hambre.
3. **El ritmo**: A. cuenta mensual que se cierra sola e informe grande cada estación (recomendada) · B. mes más lento
   (unos 15 s), con informe cada mes.
4. ¿Aprobamos el carril Q (P75) entero o solo el primer bloque (Q2 a Q4: la caja del mes)?

## 8. Plan por tareas (carril Q)
| Tarea | Qué se nota al jugar | M aprox. |
|---|---|---|
| Q2 Caja del mes y cierre | Caja y almacén separados; lo que sobra va al almacén hasta el tope, lo demás se pierde | 1,2 |
| Q3 Cuentas del mes en pantalla | La ficha «Cuentas» de las capturas; aviso «se perderán 120» con vender o adelantar | 1,0 |
| Q4 Obras y reclutas a plazos | Pagas cada mes mientras dura; dos obras si la caja da (después de J7) | 0,9 |
| Q5 Barrios con servicios | Nivel 1 a 4, cinco iconos, baja con retraso (P67) | 1,0 |
| Q6 Tres clases y lo que piden | Ciudadanos, plebeyos, esclavos con su ánimo; ascenso y «Dar ciudadanía» (P68) | 1,8 |
| Q7 Senado: favor y misiones | Dos barras de favor; una misión a la vez con plazo y premio (P70 mínima) | 1,2 |
| Q8 Foro: una decisión al mes | Chips verde y rojo por clase (J8) | 0,9 |
| Q9 Capital y pueblos | Lo aprobado en J3, ya con la caja | 1,3 |
| Q10 Provincias y edictos | Lo aprobado en J4 más P71 | 2,0 |
| Q11 Ciudad viva: luz y humo | Luz por estación y hora, humo, antorchas, andamios | 1,2 |
| Q12 Gente que cuenta algo | Las figuras que ya pasean cambian con la hora, los juegos y el ánimo de cada clase | 0,7 |
| Q13 Edificios por nivel | El edificio y el barrio cambian al subir (arte y peso) | 1,0 |
| Q14 Equilibrio con el bot | Que el bot siga ganando y que la caja obligue a elegir | 1,0 |

**Total: unos 15,2 M, de trece a quince sesiones.** Afinar números (Q2, Q6, Q14) suele costar el doble de lo previsto.
**Orden recomendado**: Q2 → Q3 → Q4 (lo que pidió el usuario: la caja del mes; tres sesiones) → Q11 (se ve) → Q5 → Q6
→ Q7 → Q8 → Q9 → Q10 → Q12 → Q13 → Q14.
**Esperas**: Q4 después de J7 (cola de obras); el informe por estación de Q3 después de I2. Q9 y Q10 sustituyen a J3 y
J4 en el tablero; J5 y J8 quedan dentro de Q7 y Q8.

## 9. Historia
- **Histórico** (de memoria; pasar por la skill `historia` antes de construir): ciudadanos, libertos y esclavos; los
  esclavos de las guerras (Agrigento, 262; Cartago, 146); el tributo de los ciudadanos, que deja de cobrarse en 167
  tras Pidna; el diezmo de grano de Sicilia (*decuma*, ley de Hierón); los ediles organizan juegos y a veces reparten
  grano barato (Livio, años 203 a 200); el Senado reparte las provincias y los mandos.
- **Ojo**: el reparto de grano a precio fijo para la plebe es de Cayo Graco (123), **después** de 146: en el juego
  solo pueden salir repartos sueltos de los ediles, no uno fijo.
- **Licencia de juego**: la caja mensual, los niveles de barrio, el favor en barras, las misiones con plazo, los
  chips y todos los números. El calendario: el año empieza en *Martius* hasta 153, y en *Ianuarius* desde 153.
