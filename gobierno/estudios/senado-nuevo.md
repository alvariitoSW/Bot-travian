# Senado nuevo: sala de votos con tres bandos (informe del usuario, 13/11/2026)

> Informe del chat de diseño, guardado tal cual (el Word está en `gobierno/maquetas/senado-nuevo/AQVILA-senado-nuevo.docx`). Captura de referencia: `gobierno/capturas-tarea/senado-1-votacion.png`; maqueta: `gobierno/maquetas/senado-nuevo/senado.html`.

**ENCARGO PARA LA SESIÓN DE GOBIERNO DE AQVILA**

Guarda este informe como gobierno/estudios/senado-nuevo.md. Guarda la captura del anexo como gobierno/capturas-tarea/senado-1-votacion.png y la maqueta como gobierno/maquetas/senado-nuevo/senado.html (el usuario las tiene en el chat; si no llegan, pídeselas).

Apunta en la bitácora las decisiones del 13/11/2026 de la sección 1. Añade al tablero el carril SN con SN1 y SN2 (ahora) y SN3 a SN7 (después, sin empezar). J5 y J8 quedan absorbidas por SN (márcalas así). K8 se queda solo para la economía.

Después, con la skill plan-socialista, empieza por SN1. Una tarea por sesión, constructor en Sonnet. SN2 va en otra sesión, después de SN1. No toques js/battle.js.

AQVILA · El Senado nuevo

Sala de votos con tres bandos. Encargo para Sonnet. Diseño cerrado con el usuario el 13/11/2026.

La captura del anexo es la referencia visual obligatoria. Donde este texto y la captura no coincidan, manda este texto. Las cifras marcadas «(orient.)» son orientativas: se fijan con test/equilibrio.js. Lo demás no se cambia sin preguntar al usuario.

# 0. Qué cambia para el jugador

Hoy el Senado es una pantalla escondida en Imperio, con dos barras y una misión: un informe que solo castiga. Ahora:

- **Cada estación el Senado vota una ley.** La propone él (sale de lo que pasa en tu imperio) o la cambias tú gastando favor.

- **La sala tiene 30 escaños en tres bandos**: Terratenientes, Mercaderes y Militares. Cuántos tiene cada uno sale de tu ciudad: granjas, mercados y legiones. Lo que construyes decide quién manda en Roma.

- **Ganas votos con tratos**: una tarjeta por bando, como las de los tribunos en la batalla, con Favorable, Dudoso o Arriesgado. Prometes algo o pagas.

- **El tribuno de la plebe veta** si la plebe está descontenta y la ley la perjudica. Lo evitas con juegos en el Foro.

- **Perder no prohíbe**: puedes atacar sin permiso, pero lo pagas.

# 1. Decisiones del usuario (13/11/2026)

1.  Política desde cero, conectada con la batalla y con la ciudad. «Lo que no toca la ciudad, sobra».

2.  **Qué se vota**: el Senado propone una ley por estación; gastando favor pones otra tuya.

3.  **Las 11 misiones de Q7 pasan a ser propuestas**: el Senado las lleva a la sala. Se reaprovecha su texto y su fuente.

4.  **Perder una votación de guerra no prohíbe atacar**: baja el favor del Senado, no te pagan la legión y no hay triunfo aunque ganes.

5.  **El Foro (J8) se funde en el Senado**: una sola pantalla política. Las decisiones del Foro son leyes que se votan, con sus chips por clase. J5 y J8 se cierran dentro de este carril.

6.  La maqueta de la sala (anexo) le gusta «como empiece».

7.  **Plazo**: todo lo jugable en unos 30 a 60 minutos de trabajo, con Sonnet (o Haiku donde se pueda).

## Supuestos (el usuario no contestó; cambiar si lo pide)

- 30 escaños y mayoría de 16. Cada bando tiene al menos 4.

- Los escaños se recalculan una vez por estación, al pasar turno; no bailan durante la votación.

- Un trato por bando y votación como máximo.

- Si pasas el turno sin votar, la votación se hace sola («Dejar pasar»): los dudosos se abstienen.

- Las guerras que ya están en marcha al empezar la partida (las históricas de la campaña) cuentan como permitidas: nadie se queda sin poder jugar el principio.

- Se entra al Senado desde el «Consejo de estación» (un aviso con botón) y desde Imperio, como hoy. No se cambia la barra de pestañas.

- Cónsules, dictador y triunfo van después (SN3 a SN5): no caben en la hora.

# 2. Cómo se juega

## 2.1 Una estación en el Senado (la vuelta completa)

1.  Al pasar turno, el consejo dice: «El Senado vota: Guerra a Cartago» con el botón «Ir al Senado».

2.  Arriba ves la ley, quién la propone y qué pasa si sale. Botón pequeño «Cambiar propuesta» (cuesta favor, ver 2.6).

3.  En la sala ves cómo votaría cada escaño ahora: relleno = sí, «?» = duda, aspa = no. Debajo, la cuenta: «13 sí · 8 dudan · 9 no — hacen falta 16 de 30».

4.  Tocas las tarjetas de trato que quieras (una por bando). La sala y la cuenta cambian al momento. El botón dice «Con la promesa: 18 de 16».

5.  Miras la franja morada del tribuno de la plebe: veta o no, y cómo evitarlo.

6.  Pulsas «Votar» o «Dejar pasar». Sale una línea con el resultado y sus efectos, y vuelves a la ciudad.

Se juega en menos de un minuto por estación. Es una decisión, no una gestión: una ley, tres tarjetas, un botón.

## 2.2 Los escaños salen de tu ciudad

Cada bando tiene un peso que sale de lo que ya existe en el juego. Escaños = 4 + reparto de los 18 restantes en proporción al peso (orient.). Redondeo por restos mayores para que siempre sumen 30.

| **Bando**      | **Peso (todo ya existe en el juego)**                                          | **Color en la sala** |
|----------------|--------------------------------------------------------------------------------|----------------------|
| Terratenientes | Grano que producen tus ciudades al mes ÷ 10 + niveles de granjas               | Oliva \#8FAE5A       |
| Mercaderes     | Niveles de mercado y puerto × 3 + rutas comerciales × 5 + oro del mes ÷ 20     | Azul \#5AA6C4        |
| Militares      | Hombres en armas ÷ 100 + niveles de cuartel × 2 + victorias del último año × 3 | Rojo \#D0443A        |

Así, quien llena Italia de granjas tiene un Senado de terratenientes que no quiere levas; quien vive del puerto tiene mercaderes que odian la guerra en el mar. Es la conexión con la ciudad.

## 2.3 El humor de cada bando

Cada bando tiene un humor de 0 a 100 (empieza en el favor del Senado que tengas, o 50). **El favor del Senado pasa a ser la media de los tres humores ponderada por escaños.** Así la barra de Q7 y todo lo que ya la usa (tratados, levas extra, favor bajo de 25) sigue funcionando sin tocarlo.

| **Qué pasa**                                               | **Humor (orient.)** |
|------------------------------------------------------------|---------------------|
| Sale una ley que le gusta (postura +)                      | +4 a ese bando      |
| Sale una ley que no le gusta (postura −)                   | −4 a ese bando      |
| Cumples una promesa                                        | +5                  |
| Rompes una promesa                                         | −15                 |
| Le pagas un trato                                          | +2                  |
| Cambias la propuesta del Senado                            | −3 a los tres       |
| Atacas sin permiso del Senado                              | −10 a los tres      |
| Cierre de mes con el oro en rojo (ya existe: −2 al Senado) | −2 a los tres       |

## 2.4 Las leyes

Seis tipos. Cada ley tiene postura de cada bando (−2 a +2), efecto si sale y chips por clase (lo que era el Foro). Doce leyes al empezar (orient.), más las 11 misiones convertidas.

| **Tipo**   | **Ejemplo**                   | **Ter / Mer / Mil** | **Si sale**                                                                                                    | **Chips por clase**                     |
|------------|-------------------------------|---------------------|----------------------------------------------------------------------------------------------------------------|-----------------------------------------|
| Guerra     | Guerra a Cartago              | −1 / −1 / +2        | Permiso de atacar a esa facción 4 estaciones; el Senado paga la paga de una legión (≈1.200 hombres) ese tiempo | Plebeyos −3                             |
| Paz        | Paz con Pirro                 | +1 / +2 / −2        | Tregua 4 estaciones; se pueden abrir rutas con ellos                                                           | Plebeyos +3                             |
| Leva       | Leva extraordinaria           | −2 / 0 / +2         | Sin tope de levas una estación; reclutar 25 % más rápido                                                       | Plebeyos −5                             |
| Ley        | Grano barato en Roma          | −1 / +1 / 0         | −60 de oro por estación                                                                                        | Plebeyos +8, ciudadanos −2              |
| Obra       | Acueducto en Roma (misión Q7) | +1 / +1 / 0         | Se abre la misión con su plazo y premio de hoy; esa obra cuesta 20 % menos                                     | Según la obra                           |
| Ciudadanía | Ciudadanía a Capua            | −1 / +1 / −1        | «Dar ciudadanía» a mitad de precio un año en esa ciudad                                                        | Ciudadanos +4 allí, plebeyos de Roma −2 |

**Qué propone el Senado** (sin azar, como Q7): primero una misión de Q7 si toca por año; si no, la ley que más encaja con lo que pasa: hay un ejército enemigo en tu territorio → guerra o leva; el pueblo por debajo de 40 → ley de grano o juegos; oro en rojo → paz; ninguna de esas → obra.

## 2.5 Cómo vota cada escaño

Para cada bando: **puntos = postura × 15 + (humor − 50) ÷ 2** (orient.).

- Escaños que votan sí = escaños × (0,5 + puntos ÷ 50) × 0,8, entre 0 y el total.

- Escaños que votan no = escaños × (0,5 − puntos ÷ 50) × 0,8.

- El resto dudan. El 0,8 hace que casi siempre haya dudosos: son los votos que se pelean.

- Sin trato, los dudosos se abstienen (no cuentan como sí). Sale si hay 16 sí o más.

En la sala, los escaños de cada bando se pintan juntos en su cuña (Terratenientes a la izquierda, Mercaderes arriba, Militares a la derecha), con los sí más cerca del centro, como en la maqueta.

## 2.6 Los tratos (las tres tarjetas)

Cada bando ofrece un trato. La tarjeta dice el bando y sus escaños, el título, cuántos votos da y qué cuesta. Etiqueta, con la misma regla que los tribunos:

| **Trato**   | **Qué hace**                                                                                                                                                    | **Etiqueta**                                                                         |
|-------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| Ya votan sí | El bando ya da 70 % de sí o más. No cuesta nada                                                                                                                 | Favorable                                                                            |
| Promesa     | Convierte en sí todos sus dudosos. Te obliga 4 estaciones (ej.: «sin leva en Capua», «no subir impuestos», «una obra en el puerto»). Si la rompes, −15 de humor | Dudoso; Arriesgado si choca con la ley (prometer «sin leva» cuando votas una guerra) |
| Pago        | Convierte en sí sus dudosos por 30 de oro por voto (orient.)                                                                                                    | Dudoso si te queda oro para 3 meses después de pagar; si no, Arriesgado              |

**Cambiar propuesta**: cuesta 3 de humor a cada bando. Sale una hoja con tres leyes posibles (las tres que más encajan después de la del Senado). Una vez por estación.

Las promesas se comprueban solas cada mes (el motor sabe si reclutaste en Capua). Si se rompen, sale un aviso de una frase: «Rompes tu promesa a los terratenientes: −15».

## 2.7 El tribuno de la plebe (y el Foro)

- Veta si el **favor del pueblo está por debajo de 35** (orient.) **y la ley tiene un chip negativo para los plebeyos**. Con veto, la ley no sale aunque tenga los votos.

- La franja morada lo dice antes de votar: «Vetará: la plebe está descontenta». Lleva un botón: **«Juegos en el Foro: 120 de oro, pueblo +8»** (orient.). Si con eso el pueblo pasa de 35, no veta.

- Esto es todo lo que queda del Foro de J8: los chips por clase en las leyes y los juegos para calmar a la plebe.

## 2.8 Qué pasa después de votar

| **Resultado**      | **Efecto**                                                                                                                      |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Sale               | Efecto de la ley; humores según postura; promesas apuntadas; línea en el registro: «Sale la guerra a Cartago (18 de 30)»        |
| No sale            | Nada cambia; humores según postura (al revés que si sale, a la mitad). La misión de Q7 que fuese se marca rechazada y no vuelve |
| Vetada             | Igual que no sale; el pueblo y los plebeyos lo ven bien (+2)                                                                    |
| Guerra sin permiso | Puedes atacar igual: −10 a los tres humores, el Senado no paga la legión y esa victoria no da triunfo (gancho para SN5)         |

## 2.9 Lo que viene después (no entra en la hora)

- **SN3 Cónsules con nombre**: dos por año salen de tus tribunos (Quinto Fabio, Cayo Flaminio, Publio Cornelio y los que asciendan). El que propone la ley es uno de ellos; su carácter cambia qué propone.

- **SN4 Dictador**: con un ejército enemigo en Italia y favor alto, el Senado te ofrece la dictadura 6 meses: sin votaciones y levas sin tope. Al acabar, los tres humores bajan.

- **SN5 Triunfo y fama** (después de la batalla nueva): gran victoria con permiso → desfile en la ciudad 3D, Militares +10, pueblo +8, fama del general. Con mucha fama, Terratenientes y Mercaderes le temen (−humor).

- **SN6 Concurso de arte por piezas** (Haiku): escaño, cuña de bando, tarjeta de trato, franja del tribuno, sello de ley aprobada. Con medidas fijas y las cinco preguntas de K10.

- **SN7 Equilibrio**: que el Senado ni regale ni ahogue, con partidas del usuario.

# 3. Pantalla

Vertical, 390 × 844, de arriba abajo (ver anexo). Paleta E1, Cinzel en títulos, paneles Noche con filete bronce, como la batalla.

| **Zona** | **Contenido**                                                                                                                   | **Alto (px)** |
|----------|---------------------------------------------------------------------------------------------------------------------------------|---------------|
| Cabecera | «Senado» en Cinzel oro · estación y año a la derecha                                                                            | 40            |
| Favor    | Dos barras finas: Senado (oro) y Pueblo (verde) con su cifra                                                                    | 16            |
| Ley      | «Propone el cónsul…» en versalitas · título de la ley en Cinzel 21 px · una frase de efecto · botón pequeño «Cambiar propuesta» | ≈96           |
| Sala     | Hemiciclo SVG con 30 escaños en tres filas (8, 10, 12), cuñas por bando, nombre de bando encima, «Cónsules» en el centro        | ≈192          |
| Cuenta   | «13 sí · 8 dudan · 9 no — hacen falta 16 de 30» en sus colores                                                                  | 24            |
| Tratos   | Tres tarjetas apiladas: punto de color, bando y escaños, etiqueta, título y una frase. La elegida, borde oro y fondo cálido     | 3 × ≈90       |
| Tribuno  | Franja morada: «Tribuno de la plebe» + una frase; si veta, botón «Juegos en el Foro»                                            | ≈34           |
| Botones  | «Dejar pasar» (gris) y «Votar» (rojo, borde oro, con la cuenta: «Con la promesa: 18 de 16»)                                     | 76            |

Si «Votar» no llega a 16, el botón sigue activo (puedes votar y perder) pero dice «Saldría que no: 13 de 16». Toda la pantalla en una sola vista: nada de desplazar.

# 4. Técnica

- **Motor sin pantalla**: todo en js/data.js (datos) y js/game.js (reglas), en un bloque «Senado nuevo (SN1)» junto al de Q7. Corre en Node. Nada de pantalla ahí.

- **Interruptor**: D.SENADO.sala = true. Con false, el juego hace exactamente lo de Q7 (misión a la vez). Así se puede apagar si algo falla en el móvil.

- **Datos nuevos en js/data.js**: D.BANDOS (tres, con color y fórmula de peso), D.LEYES (doce, con tipo, postura, efecto, chips, texto y fuente), y en D.SENADO las cifras: escanos 30, mayoria 16, minimo 4, vetoPueblo 35, juegos {oro 120, pueblo 8}, pagoVoto 30, romper −15, cambiar −3.

- **Funciones nuevas en js/game.js**: G.escanos(), G.humores(), G.propuestaEstacion(), G.votos(ley, tratos) → {si, duda, no, porBando}, G.tratos(ley) → tres tarjetas con etiqueta, G.veto(ley), G.juegos(), G.cambiarPropuesta(id), G.votar(tratos), G.dejarPasar(), G.promesasMes().

- **Ganchos en lo que ya existe**: G.pasarTurno recalcula escaños y abre la votación; si queda abierta al pasar el turno siguiente, G.dejarPasar(). G.senadoMes llama a G.promesasMes(). G.favor() devuelve la media ponderada de humores cuando el interruptor está encendido. G.senadoAsignar alimenta la propuesta con las misiones. G.send apunta «sin permiso» si la facción no está en s.permisos. G.consejo añade la línea «El Senado vota: …».

- **Guardado**: s.senado = { v: 1, humor: {ter, mer, mil}, escanos, votacion, promesas: \[\], permisos: {} }. Migrar en G.migrarSenado (que ya se llama en G.load): humores = favor de Q7, permisos = guerras ya en marcha. Probar con test/partida-vieja.json.

- **El bot de pruebas** (test/sim.test.js) vota cada estación con la tarjeta Favorable, o deja pasar. Hoy ignora las misiones y acaba en favor bajo: con esto no debe empeorar.

- **Pantalla** (SN2): viewSenado en js/ui.js se rehace entera; estilos en css/style.css con prefijo .sn2-. La sala, SVG hecho a mano a partir de senado.html del anexo (su script de escaños sirve tal cual). Captura con un script como gobierno/maquetas/Q7-capturas.mjs.

- No se toca js/battle.js ni js/gfx/. Sin dependencias nuevas.

# 5. Tareas en orden

Dos sesiones de unos 30 minutos cada una: una hora en total. Una tarea por sesión, como manda plan-socialista. **Haiku no escribe código** (regla de la skill): solo redacta los textos de las leyes.

| **Tarea**    | **Qué**                                                                                                                                   | **Archivos**                                                                                                                                | **Quién**                                                                                              |
|--------------|-------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| SN1 Motor    | Bandos, escaños, humores, leyes, votos, tratos, veto, juegos, promesas, permisos, interruptor, migración, bot. Prueba test/senado.test.js | js/data.js, js/game.js, js/registro.js (fichas de las leyes), test/senado.test.js, test/sim.test.js, gobierno/jueces.mjs (añadir la prueba) | Constructor Sonnet; textos de las 12 leyes con fuente: Haiku en una tabla .md que el constructor copia |
| SN2 Pantalla | Pantalla del Senado como el anexo; aviso en el consejo de estación; captura a 390×844                                                     | js/ui.js, css/style.css, gobierno/maquetas/SN2-capturas.mjs                                                                                 | Constructor Sonnet; el director mira la captura                                                        |

## Presupuesto

| **Pieza**                                | **Modelo** | **M (orient.)** | **Reloj**   |
|------------------------------------------|------------|-----------------|-------------|
| SN1 director (lee, encarga, pasa jueces) | Sonnet     | 0,20            | 5 min       |
| SN1 textos de leyes                      | Haiku      | 0,05            | 3 min       |
| SN1 constructor                          | Sonnet     | 0,90            | 20 min      |
| SN2 director                             | Sonnet     | 0,15            | 5 min       |
| SN2 constructor                          | Sonnet     | 0,80            | 20 min      |
| Jueces (dos veces)                       | —          | —               | 2 × 3 min   |
| **Total**                                |            | **≈2,1 M**      | **≈60 min** |

**Aviso honesto**: CN2 gastó el doble de lo previsto (+97 %). Si SN1 pasa de 1,5 M (la alerta de gasto.mjs), se para y se recorta: primero se quita el Pago (solo Promesa), después «Cambiar propuesta». Lo que no se quita: sala, votos, veto e interruptor.

## Hecho si

**SN1** (se comprueba en Node, sin pantalla):

- Los escaños siempre suman 30 y cada bando tiene 4 o más. Sin mercados ni rutas, los Mercaderes tienen 4.

- Con Militares de humor 80 y 12 escaños, «Guerra a Cartago» sale sin trato.

- Con pueblo en 20, una ley con plebeyos negativo sale vetada; tras «Juegos» que lo suben de 35, no.

- Una promesa rota baja 15 el humor de su bando al cierre de mes.

- Atacar sin permiso baja 10 los tres humores y marca la victoria sin triunfo.

- Con D.SENADO.sala = false, el juego hace lo mismo que hoy (las pruebas de Q7 siguen pasando).

- Una partida vieja (test/partida-vieja.json) carga sin errores y con humores = su favor.

- node gobierno/jueces.mjs dice APTO y test/equilibrio.js no se mueve más de 10 puntos.

**SN2** (se comprueba mirando):

- La captura a 390×844 se parece al anexo: ley, sala, cuenta, tres tarjetas, franja del tribuno y dos botones, todo sin desplazar.

- Tocar una tarjeta cambia la sala, la cuenta y el texto de «Votar» sin recargar.

- Al pasar turno, el consejo de estación muestra «El Senado vota: …» y su botón lleva al Senado.

- Votar devuelve a la ciudad con una línea de resultado. Sin errores de consola. Jueces APTO.

# Anexo · Maqueta de la sala

senado-1-votacion.png (390 × 844, maqueta senado.html). Votación de guerra a medio ganar: la promesa a los Terratenientes la saca adelante.

<img src="media/f93765aa213c62f165bb9f0b901aea2a2126e517.png" style="width:3.125in;height:6.76042in" />
