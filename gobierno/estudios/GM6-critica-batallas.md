# GM6 · Crítica dura de las batallas de AQVILA (16/11/2026)

Pedido del usuario: una crítica sin paños calientes de todo el proyecto de batallas, como si la hicieran cuatro empresas
rivales con un modelo mejor que el nuestro, más la voz de cada ministerio. Las cuatro empresas son **inventadas**. Cada
una resume una manera real de resolver batallas (gran estrategia en tiempo real, táctica por turnos, móvil de partidas
cortas, simulación histórica). Se toman ideas, nunca código ni arte.

## 0. El veredicto, en cinco frases
1. **Llevamos cinco batallas y el jugador no tiene ninguna.** Carriles A, N, NB, GC y GM: cinco motores (`battle.js`,
   `batalla2.js` con `maniobra.js`, `guerra.js` y dos maquetas con sus reglas). En el juego publicado sigue saliendo la vieja.
2. **Cada vez que algo no gustó, se empezó de cero en vez de arreglar lo que fallaba.** Solo NB costó unos 8,5 M. Lo
   aprendido en cada vuelta (terreno, general, objetivos, veteranía) se tiró con el agua sucia.
3. **La batalla que ahora defendemos tiene una respuesta correcta.** Nuestras propias pruebas lo dicen: «con cabeza»
   gana el 100 % y «sin tocar» pierde el 100 %. Eso no es estrategia: es un examen con chuleta. A la quinta batalla aburre.
4. **Nada de lo que pasa en la batalla importa después.** No hay veteranos, ni general, ni botín, ni perseguir. La
   campaña entrega tropas y recibe bajas. Ganar bien y ganar mal valen casi lo mismo.
5. **Se ha probado todo menos lo que importa.** Hay pruebas de equilibrio con bots a cientos; no hay una sola medida de
   fluidez en un móvil real, ni sonido, ni un juez que juegue la batalla nueva. Y el usuario prefiere el aspecto de una
   maqueta y las reglas de otra: las hemos hecho por separado.
   *(Nota del mismo día: después de escribirse esto, el usuario midió en su móvil 50–60 imágenes por segundo con 10 000
   hombres por bando en la maqueta de ejércitos grandes, y se abrieron el sonido, GC5, y el juez que juega la batalla, GC2.)*

## 1. Las cuatro empresas (inventadas)

### A · «Estudios Cónsul» — gran batalla en tiempo real (manera tipo Total War)
**Su modelo.** Cada regimiento es una pieza con sitio, frente y espalda de verdad. El jugador coloca, mueve y gira
veinte piezas sobre un terreno con colinas y bosques; pausa cuando quiere. La moral es la reina: se gana haciendo huir,
no matando. Todo viene de la campaña y vuelve a ella: veteranía, general con rasgos, cansancio de la marcha.
**Qué nos dice.** «Vosotros no tenéis campo de batalla: tenéis tres barras que se empujan. No hay dónde. No se elige
el sitio, ni la altura, ni por dónde entra la caballería: se pulsa un botón y la caballería "va". El flanco no lo ganáis
maniobrando; os lo regala una regla cuando un cuerpo recula. Y lo más triste: lo tuvisteis. Vuestro carril A tenía
despliegue, colina, bosque y formaciones, y lo habéis abandonado porque no cabía en un móvil, en vez de preguntaros qué
parte sí cabía.»
**Dónde pierde ella.** Veinte piezas no se manejan con un dedo en 390 px; sus batallas duran veinte minutos; necesita
miles de figuras y una máquina que el móvil no es. Su modelo, tal cual, fue justo lo que al usuario no le funcionó (A y N).

### B · «Taller Hexágono» — táctica por turnos (manera tipo juego de mesa histórico)
**Su modelo.** Turnos, casillas y dados a la vista. Antes de atacar, el juego enseña la cuenta: «62 % de ganar el
choque; +1 por cargar cuesta abajo; −2 porque te cogen de costado». Cada unidad tiene zona de control y encaramiento.
Se puede pensar sin prisa y jugar con una mano en el autobús. Dos jugadores pueden turnarse por correo.
**Qué nos dice.** «Vuestro jugador nunca sabe por qué gana o pierde. El botón "late" y él obedece: eso es seguir a un
semáforo, no decidir. No enseñáis ni una cuenta. ¿Cuánto me cuesta relevar ahora? ¿Cuánto gano si espero diez
segundos? Nadie lo sabe, ni vosotros sin abrir el código. Y vuestro tiempo real castiga al que juega en el móvil con
una mano: tres frentes a la vez y avisos que se van solos. Con rondas (que ya teníais en el carril N) se podía pensar.»
**Dónde pierde ella.** No se ve una batalla: se ve un tablero. Sin espectáculo, sin polvo, sin la emoción de la línea
que cede. El usuario pidió «ver y dirigir batallas», y por turnos se dirige pero no se ve.

### C · «Pulgar Rojo» — móvil de partidas cortas (manera tipo duelo de tres minutos)
**Su modelo.** Tres minutos, una mano, vertical. Todo cuesta algo que se ve llenarse (energía). Cada toque responde
en una décima con sonido, golpe y número. Al acabar, estrellas: una por ganar, dos por ganar con pocas bajas, tres por
ganar deprisa; y un premio que se abre. La dificultad sube sola y empareja con un rival de tu nivel.
**Qué nos dice.** «Sois un juego de móvil que no ha leído ningún juego de móvil. **No tenéis sonido.** Ninguno. El
relevo, que es vuestra gran idea, es un salto brusco de muñecos. Los botones no cuestan nada, así que no hay nada que
administrar: se pulsa lo que late. Al terminar no hay nota, ni premio, ni motivo para repetir. No hay enseñanza: se
suelta al jugador con cuatro verbos. Y no sabéis a cuántas imágenes por segundo va en un móvil de 150 euros, que es
donde vive vuestro público.»
**Dónde pierde ella.** Sus batallas no significan nada: no hay historia, ni legión que se recuerde, ni campaña. Es
adictiva y hueca. Y su negocio vive de cobrar, cosa que AQVILA no hace ni quiere.

### D · «Polibio Digital» — simulación histórica (manera tipo simulador de mando)
**Su modelo.** Simula lo que un cónsul podía hacer de verdad: poco. Las órdenes tardan en llegar, la línea se cansa en
minutos y descansa en pausas, la batalla se decide por el orden y el pánico más que por las bajas (casi todas llegan en
la huida). Cada batalla es una batalla con nombre, terreno y fuerzas reales, y enseña por qué pasó lo que pasó.
**Qué nos dice.** «Citáis a Polibio "de memoria, sin cotejar pasaje a pasaje": lo decís vosotros en vuestros propios
partes. Vuestros ejércitos son "una mezcla tipo": Pirro con elefantes delante, que no fue así; libios con lanza
después de Trasimeno; 60 vélites donde hubo 1.200. Comprimís horas en noventa segundos y la matanza ocurre en el
choque, cuando en la realidad ocurría en la persecución, que no tenéis. El relevo, vuestro orgullo, es lo que peor
conocen las fuentes, y lo resolvéis con "tres segundos de desorden". Y no hay ni una batalla real: ni Heraclea, ni
Cannas, ni Zama. Para un juego que quiere enseñar historia, es el pecado mayor.»
**Dónde pierde ella.** La fidelidad le sale lenta, árida y cara. El jugador manda poco y mira mucho; en un móvil se
abandona a la segunda batalla.

## 2. Las cuatro, comparadas entre sí y con nosotros
| | A · Cónsul | B · Hexágono | C · Pulgar Rojo | D · Polibio | **AQVILA hoy** |
|---|---|---|---|---|---|
| Lo que decide el jugador | Dónde y cuándo | Qué, con la cuenta delante | Cuándo gastar | Poco, pero real | **Cuándo pulsar lo que late** |
| ¿Hay lugar (terreno, posición)? | Sí, todo | Sí, en casillas | Apenas | Sí, el real | **No** |
| ¿Se entiende por qué ganas? | A medias | Sí | Sí (números) | Sí (lo explica) | **No** |
| ¿Se ve y se oye? | Mucho | Poco | Mucho, y suena | Regular | **Se ve algo; no suena** |
| ¿Cabe en un móvil, con una mano? | No | Sí | Sí | Regular | Sí |
| Duración | 20 min | 15–30 min | 3 min | 30 min | 1,5 min |
| ¿La batalla deja huella? | Sí (veteranos, general) | Sí (campaña) | Premios | Sí (historia) | **No** |
| ¿Se puede repetir sin aburrir? | Sí | Sí | Sí | Regular | **No: hay una respuesta correcta** |
| Coste de hacerla | Enorme | Bajo | Medio | Alto | **Ya hemos pagado cinco** |

**En lo que las cuatro coinciden contra nosotros** (y por eso es lo que más pesa):
1. **Falta el dónde.** Las cuatro tienen posición o terreno. Nosotros, tres barras.
2. **Falta el porqué.** Las cuatro explican el resultado. Nosotros damos un consejo que late.
3. **Falta el después.** En las cuatro la batalla deja algo. En la nuestra, solo bajas.
4. **Falta decidir el modelo.** Cada una es una cosa. Nosotros hemos sido las cuatro por turnos, y ninguna entera.

**En lo que nosotros acertamos** (para no tirarlo en la sexta vuelta): una pantalla y cuatro órdenes se entienden sin
leer; «Retirarse» siempre a mano; las reglas corren sin pantalla y con azar guardable (sirve para dos jugadores); las
armas y formaciones de GM2 tienen fuente y ninguna gana a todas; el motor ya está dentro del juego (GC3).

## 3. La voz del gobierno
**Fable 5.2 (dirección).** El fallo de fondo es mío y de las sesiones anteriores: se ha confundido «al usuario no le
gusta» con «hay que rehacerlo». Dos veces se le entregó una batalla que no se podía ni empezar ni abandonar (empezaba
en pausa, no tenía salida) y nadie lo vio porque los jueces no la jugaban. GC1 corrigió eso, pero se pasó de frenada:
quitó tanto que quitó el juego. Y hoy mismo hay cuatro sesiones sobre la batalla (GC4, GM1, GM2, esta): el aspecto por
un lado, las reglas por otro, y el usuario comparando maquetas que no se parecen. Eso no es un plan; es un reparto.

**Ministerio de Historia.** Dictamen general: *apto con notas que nadie cierra*. (1) Ninguna cita está cotejada con el
texto; todas son «de memoria». (2) No hay una sola batalla histórica jugable, cuando el periodo las tiene célebres y la
campaña las nombra. (3) Las licencias están marcadas, pero se amontonan justo en lo que más se ve: tiempo, número de
vélites, elefantes, el relevo. (4) Falta lo que más enseñaría: que la mayoría de las muertes llegan cuando una línea
huye, y que el cónsul mandaba poco. (5) Los aliados de las alas se pintan como romanos.

**Ministerio de Arte.** (1) Hay tres aspectos distintos para lo mismo: figuras 3D reales (GC1), puntos y bloques (GM2)
y cartón a lo lejos (GM1, sin terminar). El usuario ya ha dicho cuál prefiere; los otros dos sobran. (2) El relevo es
un cambio de sitio brusco: no se ve pasar una línea entre la otra. (3) No hay sonido en ninguna maqueta. (4) Los avisos
son texto que se va solo: en una batalla, lo importante debe verse en el campo, no leerse arriba. (5) El terreno es un
decorado: montes al fondo que no hacen nada. (6) Nadie ha medido triángulos ni fluidez de la batalla nueva en un móvil.

**Ministerio de Ahorro.** Las cuentas, sin adornos: carril N, una decena de sesiones; NB, unos 8,5 M; GC1 a GC3, unos
3 M; GM2, 1,8 M con alerta de gasto (+28 %). Por encima de quince millones para una batalla que el jugador aún no ve.
Tres despilfarros que se repiten: equilibrar con bots antes de que el usuario diga si le gusta (seis vueltas en GM2);
abrir carriles en paralelo que luego hay que coser (GM1 con GM2); y rehacer en vez de parchear. Regla que propongo:
**no se equilibra nada que el usuario no haya jugado y aprobado en su móvil.**

**Ministerio de Jueces.** Confesión: los jueces dicen APTO y no juegan la batalla nueva. El recorrido de navegador
sigue entrando en la vieja; GC2 (el juez que la juega de verdad) lleva sin abrirse desde que se aprobó. Las pruebas de
las maquetas miden si un bot gana, no si una persona entiende. Y que «con cabeza» gane el 100 % se anotó como un éxito
cuando es un defecto: no hay riesgo. Faltan tres medidas: primer toque útil sin leer, imágenes por segundo en móvil
real, y variedad (que dos maneras distintas de jugar bien ganen las dos).

## 4. Lo que habría que cambiar (corto y por orden)
Coste en **M** (millones de tokens, la unidad de `gasto.mjs`) y en sesiones. Aproximado.

| # | Qué | Por qué va en ese puesto | Coste |
|---|---|---|---|
| 1 | **Cerrar el modelo: una sola batalla.** Reglas de GM2 + aspecto 3D + pantalla del juego (GC4). Las batallas vieja, N y NB dejan de salir y de mantenerse. | Mientras haya cinco, todo lo demás se paga cinco veces | 0 M: es una decisión del usuario |
| 2 | **Mandar bien premia y mandar mal castiga, y se ve** (relevo a tiempo o a destiempo, ánimo de la legión). Relevo que se ve pasar. | Lo pidió el usuario; es lo más barato que da sensación de juego | Hecho en esta tarea (GM6) |
| 3 | **Sonido**: choque, cuerno, carga, relevo, victoria. Por código, sin archivos. | Lo dice Pulgar Rojo y tiene razón: es lo que más se nota por euro gastado | En marcha (GC5) |
| 4 | **El juez que juega la batalla** (GC2) y **medir fluidez en el móvil del usuario** con un contador en pantalla. | Sin esto seguiremos diciendo APTO a ciegas | El juez, en marcha (GC2); el contador, 0,2 M |
| 5 | **Que no haya una respuesta correcta**: azar más ancho, dos o tres planes enemigos por rival y dos maneras de ganar (por las alas o por el centro). | Sin esto la batalla se agota en cinco partidas | 1,0 M · 1 sesión |
| 6 | **El porqué a la vista**: al tocar una orden, una línea con lo que cuesta y lo que da ahora («Relevo: entran frescos · 3 s de desorden»); al final, tres frases de por qué ganaste o perdiste y una nota (bronce, plata, oro). | Lo dicen Hexágono y Pulgar Rojo | 0,8 M · 1 sesión |
| 7 | **El después**: veteranía, perseguir o reagrupar, y que la nota de la batalla cuente en la campaña (NB8 lo tenía apuntado). | Hace que cada batalla importe | 1,2 M · 1–2 sesiones |
| 8 | **Un poco de dónde**: una sola elección antes de chocar (cerro, llano o río a la espalda) que cambia las reglas, sin despliegue de piezas. | Lo dice Cónsul; versión que cabe en un dedo | 1,0 M · 1 sesión |
| 9 | **Tres batallas con nombre** (Heraclea, Cannas, Zama) con sus fuerzas y su lección, y cotejar las citas con el texto. | Lo dice Polibio Digital; es lo que hace de AQVILA un juego de historia | 1,5 M · 2 sesiones |

**Lo que no haría**: una sexta batalla desde cero; despliegue de veinte piezas; turnos (el usuario quiere verla); más
armas o formaciones antes de que la batalla esté en el juego; equilibrar con bots lo que el usuario no ha jugado.

## 5. Lo que ya se ha hecho en GM6 (punto 2 de la lista)
**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/guerra-relevo/ (soldados en 3D, reglas
de GM2; añade `?rival=pirro` para luchar contra Pirro). Maqueta aparte: no cambia el juego.

**Premio y castigo.** Hay un marcador nuevo, el **ánimo de la legión** (barra arriba). Cada orden se juzga en el momento:
| Lo que mandas | Juicio | Qué pasa |
|---|---|---|
| Relevo con la línea cansada o mermada, sin carga enemiga encima y con la reserva descansada | **A tiempo** | Entran antes (2 s en vez de 3) y con empuje: pegan un 20 % más durante 6 s. Sube el ánimo |
| Relevo con la línea aún entera | Sin necesidad | La línea se desordena. Baja el ánimo |
| Relevo en los 4 s siguientes a una carga enemiga | Bajo la carga | Tarda más (4,5 s), se desordenan y pierden ánimo. Baja el ánimo |
| Relevo con la reserva cansada | Sin aliento | Baja un poco el ánimo |
| Empujar cuando el enemigo flaquea, está cansado o tiene el costado al aire | Bien visto | Sube el ánimo |
| Empujar con hombres agotados, o con espadas de frente contra picas ordenadas | Mal | Baja el ánimo |
| Aguantar justo cuando cargan; tapar el costado a tiempo; abrir calles a los elefantes | Bien | Sube el ánimo |
| Jinetes a la espalda, o contra los jinetes enemigos | Bien | Sube el ánimo |
| Cambiar de orden antes de 2 s | Órdenes y contraórdenes | Baja el ánimo |
| Dejar 8 s a los agotados sin relevo, una línea deshecha sin relevar, o el costado 6 s al aire pudiendo taparlo | Descuido | Baja el ánimo |

**Qué hace el ánimo.** Con el ánimo arriba toda la legión pega hasta un 10 % más y aguanta mejor; abajo, lo contrario. Vuelve
poco a poco a su sitio: hay que seguir mandando bien. No hacer nada no premia. Sin botones nuevos: el botón Relevo dice
«buen momento», «aún están enteros» o «¡te están cargando!».

**Comprobado** (`node gobierno/maquetas/guerra-cuerpo/prueba.mjs`, APTO): el mismo relevo gana 7,5 m de terreno en 10 s si es a
tiempo, 3,2 m bajo la carga y 0,2 m si era sin necesidad; quien manda con cabeza acaba con el ánimo en 0,75; quien marea a la
tropa lo hunde a 0 y pierde siempre; la misma batalla en automático contra 330 iberos se pierde con el ánimo normal y se gana
con el ánimo alto. Todo lo anterior de GM2 sigue cumpliéndose.

**Historia (dictamen: probable, con licencia de juego).** Que el relevo pedía orden y ocasión, y que hecho bajo presión
desbarataba la línea, lo sostienen Livio 8.8 y los estudios modernos del manípulo (Sabin 2000; Taylor 2014), sin detalle en las
fuentes: *probable*. Las pausas del combate que dan la ocasión de relevar: *probable* (Sabin). El «ánimo de la legión» como
una sola barra y sus números son *licencia de juego*. Citas de memoria, sin cotejar.

## 6. Lo que decide el usuario
1. ¿Se cierra el modelo en «reglas de GM2 + aspecto 3D + cuatro órdenes» y se dejan de mantener las batallas vieja, N y NB? (A) sí; (B) todavía no.
2. ¿El premio y castigo y el relevo nuevo te valen? (A) sí; (B) con cambios; (C) no.
3. De la lista del apartado 4, ¿qué pasa al tablero? (A) los puntos 5 y 6, que es lo recomendado (el 3 y el 4 ya están en marcha); (B) todos; (C) los elijo yo.
