# GM6b · Las cuatro críticas, a fondo, y la mejora final de las batallas (16/11/2026)

Segunda versión, mucho más profunda que la primera (que era un resumen de 123 líneas). Pedido del usuario: sacar lo
positivo y lo negativo de cada empresa rival, volver lo negativo en positivo, mezclarlo con lo bueno del informe del
gobierno y fundirlo todo en **una sola mejora final**. Es un estudio: no toca el juego ni las maquetas, y nada pasa al
tablero hasta que el usuario lo apruebe. Solo ideas; nada de código ni arte de juegos comerciales.

## 0. Cómo leer esto y qué he mirado de verdad

**Palabras que salen mucho** (por si alguna no está clara):
- **Cuerpo**: cada una de las tres porciones del ejército (ala izquierda, centro, ala derecha). Tú mandas tres cuerpos.
- **Ánimo**: lo que le queda de ganas de luchar a una tropa. Se gana haciendo huir, no matando.
- **Flanco / costado**: el lado de una tropa. Si te pegan por el costado o por la espalda, sufres mucho más que de frente.
- **Relevo**: la línea cansada se retira y entra la de refresco, como hacían los manípulos romanos.
- **Maqueta**: una versión de prueba aparte, que no toca el juego publicado.

**Lo que he leído** para esta versión: el informe de las cuatro empresas (`GM6-critica-batallas.md`); las reglas reales de
las maquetas `guerra-cuerpo` (GM2 y GM6, 451 líneas) y `guerra-lejos` (GM7, 343 líneas); los estudios de GC1, GM1, GM2,
GM7, R21 y R22; los partes de GC1, GM1, GM6; y todo lo que has dicho en la bitácora al probar cada cosa.
**Lo que no he hecho**: jugar la batalla en un móvil, abrir las vistas (`vista.js`) a fondo ni cotejar ninguna cita
histórica con el texto antiguo. Los costes son estimaciones mías, apoyadas en lo que costó cada tarea parecida
(y esas tareas se pasaron casi siempre; ver §6).

**Lo que me ha cambiado la opinión respecto a la primera versión**: al leer las reglas he visto que el problema no es solo
«hay muchas batallas», sino que **hoy hay cinco juegos de reglas distintos** y cada mejora vive en uno diferente (§2).
Eso cambia cuál debe ser la primera decisión.

## 1. Lo que has dicho tú, en orden (para no perderlo en la fusión)

| Cuándo | Qué probaste | Qué dijiste (resumido) | Qué obliga a respetar |
|---|---|---|---|
| GC1 | Batalla nueva de tres pulsos y cuatro órdenes | «Es la base que quería hacer» | Una pantalla, cuatro órdenes, vertical y horizontal |
| GC4 | La batalla nueva dentro del juego | «Bien, pero faltan las mejoras que estamos haciendo» | El juego ya la tiene; falta lo demás |
| GM1 | Ejércitos grandes | «Sí, con cambios»: menos polígonos, flanqueo más natural, caballería mejor con cámara que la siga, empezar de lejos, escudos y testudo, batallas más espaciadas | Aspecto de GM1 como base; más tiempo para maniobrar |
| Fluidez | 10 000 por bando en tu móvil | 60 imágenes por segundo, de lejos | Ejércitos sin tope; falta medir «de cerca» y un móvil modesto |
| GM2 | Reglas de combate en vivo | «Está bien»; prefieres el aspecto 3D de otra maqueta; relevo mejor animado y que premie o castigue | Reglas de GM2 + aspecto 3D |
| GM6 | Relevo, premio y castigo | «Va mejorando, pero muchos fallos: la caballería atraviesa a todos; los elefantes, que deberían ser lo más temible, mueren con una carga tonta» | Arreglar caballería y elefantes (R21, GM9) |
| GM9 | Cuánto parecerse a Rome II | «Hazlo todo enfocado en parecernos a un Rome II» | Imitar el comportamiento, no el código ni el arte |
| GM10 | Mover tropas con el dedo | «A, y algo adaptado a nosotros para B» | Mover con el dedo, a nuestra manera; no veinte piezas |
| Decisión | Una sola batalla | «Sí»: reglas de GM2, aspecto 3D, cuatro órdenes; se dejan de mantener la vieja, la N y la NB | Un solo motor |

**Lo que sigue sin contestar** (y condiciona todo): las preguntas de GM7 (¿así empieza la batalla?, ¿40 segundos de
acercarse?, ¿el testudo en campo abierto?), las propuestas P125, P126 y P128.

## 2. Dónde estamos de verdad (lo que no decía el informe de las cuatro empresas)

El informe decía «cinco batallas». Hoy, mirando el código, son **cinco juegos de reglas vivos**, y cada uno tiene algo que
los otros no tienen:

| Dónde vive | Qué es | Lo que tiene | Lo que le falta |
|---|---|---|---|
| `js/guerra.js` (el juego publicado) | Motor de GC3 y GC5 | Guardar a mitad, sonido, falange y elefantes (GC5), rivales con carácter, unido a la campaña | Todo lo de GM2, GM6, GM7 y GM9 |
| `guerra-cero/` (GC1) | La base de tres pulsos | La idea, probada y querida | Es la más simple: sin armas, flancos, distancia ni ánimo |
| `guerra-cuerpo/` (GM2 y GM6) | Reglas de combate en vivo | Cinco armas, siete formaciones, flancos, huecos, caballería enemiga, elefantes que se revuelven, **ánimo de la legión y juicio de cada orden** | Empezar de lejos, cubrirse, testudo |
| `guerra-grande/` (GM1) | Aspecto de ejércitos grandes | Cartones: 10 000 por bando a 60 img/s en tu móvil | Reglas de GC1 tal cual |
| `guerra-lejos/` (GM7) | GM1 + batalla que empieza de lejos | Proyectiles, escudos, testudo, ficha por tropa, honderos, el aspecto que prefieres | Armas, formaciones, flancos, ánimo, elefantes, falange, juicio del mando |
| `guerra-relevo/` (GM6) | Vista 3D del relevo con ánimo | Se ve pasar la línea entre la otra | Va sobre las figuras viejas de GC1, no sobre el aspecto de GM1 |

**La consecuencia, dicha claro**: lo que tú prefieres en el aspecto (GM1 y GM7) **no tiene** lo que prefieres en las reglas
(GM2 y GM6). Y el juego publicado no tiene ninguna de las dos cosas. Cada maqueta nueva se construyó copiando la
anterior y se quedó con la mitad. Es el mismo error de siempre —rehacer en vez de sumar— pero esta vez a pequeña escala.
La mejora final empieza por **sumar** (decisión 1).

**Dos hallazgos más que salen de leer las reglas** (no los decía ninguna empresa, y ayudan a los puntos de abajo):
1. **El azar de la batalla se anula solo.** Hoy el azar es un pequeño temblor (±10 %) que se aplica a cada instante y a
   los dos bandos por igual. Con mil instantes por batalla, los temblores se compensan y casi todo lo decide lo que
   mandas. Por eso «con cabeza» gana siempre. Para que haya variedad hacen falta **pocos golpes grandes y que se vean
   venir**, no más temblor.
2. **Cuando un cuerpo huye, la batalla casi se acaba para él: no hay persecución.** En las reglas, un cuerpo roto deja de
   luchar; el vencedor solo descansa y se vuelve hacia el costado del vecino. No hay bajas entre los que huyen. Justo
   al revés que en la historia.

## 3. Las cuatro empresas, a fondo

Cada una se trata igual: su modelo en una frase; **(a)** lo que acierta y habría que conservar, con cómo estamos hoy;
**(b)** lo que exagera, se equivoca o no encaja; **(c)** cómo volver cada punto negativo en algo positivo.

### 3.A · Estudios Cónsul (gran batalla en tiempo real)
**Su modelo.** Regimientos con frente, costado y espalda; terreno con colinas y bosques; veinte piezas; moral que manda;
todo viene de la campaña y vuelve a ella.

**(a) Lo que acierta**
1. **El dónde importa.** Sin terreno, la batalla son tres barras que se empujan. Comprobado: las reglas solo conocen
   «distancia entre líneas» y «cuánto ha cedido cada sector». No hay loma, bosque ni río. *Hoy: no lo tenemos.*
2. **La moral manda.** En AQVILA ya manda: el ánimo de la legión (GM6) y el contagio (si un cuerpo huye, los vecinos
   pierden 0,13 de ánimo y los rivales ganan 0,10). *Hoy: lo tenemos, solo en la maqueta GM2/GM6.*
3. **El costado y la espalda deciden.** *Hoy: lo tenemos* (GM2: costado ×0,5 y espalda ×0,9 de daño extra, más el hueco
   que deja un vecino que cede), pero solo en la maqueta de GM2, no en GM7 ni en el juego.
4. **La caballería es una pieza con cuerpo**: no atraviesa una línea, rodea. Es **tu queja exacta** al probar GM6.
5. **Todo viene de la campaña y vuelve a ella.** *Hoy: viene (qué tropas), pero vuelve casi vacío: solo bajas.*
6. Dice que «lo tuvisteis» (el carril A tenía despliegue, colina y bosque). Es verdad, y hay que aprovechar lo que
   aprendimos de aquello sin recuperar su peso.

**(b) Lo que exagera o no encaja**
1. **Veinte piezas con un dedo.** En 390 px no caben, y tú ya lo dijiste: «a nuestra manera, no las veinte de Rome II».
2. **Veinte minutos por batalla.** Aquí una batalla son 2 a 4 minutos. No se discute.
3. **Que abandonamos el carril A «por no caber»**: a medias. Se dejó porque al probarlo no te gustó (empezaba en pausa,
   no se podía salir). El problema no era el despliegue, era la pantalla.
4. **Miles de figuras y una máquina potente.** Ya está resuelto de otra forma: cartones (GM1), 10 000 por bando a 60 img/s.
5. **Que no tenemos «campo»**: exagera. Tenemos tres sectores, distancia, hueco y flanco. Lo que falta es relieve y sitio
   a los lados para rodear.

**(c) Cómo volverlo positivo**
| Punto negativo | Versión AQVILA, en positivo |
|---|---|
| Veinte piezas | **Tres cuerpos y los jinetes.** El dedo arrastra solo los jinetes (por dónde rodean y a quién cargan) y, a lo sumo, adelanta o retrasa un cuerpo. Es GM10, que tú ya pediste |
| Veinte minutos | Mantener 3 a 4 minutos, pero que cada fase **tenga su decisión**: acercarse (40 s), choque, maniobra, persecución |
| «Abandonasteis el despliegue» | **Cero despliegue, pero el terreno ya viene puesto** (R22): una loma, un bosque o un río con vado por batalla, y tú lo lees y lo aprovechas. Sin menú previo |
| Faltan sitio a los lados | **Campo el doble de ancho que el ejército** (P128): es lo que deja a los jinetes rodear por fuera |
| «Viene de la campaña, vuelve vacío» | **La batalla devuelve algo**: veteranía y nota (decisión 7) |
| Terreno decorativo | Que el terreno **cambie las reglas** (arriba se tira más lejos y se carga mejor; el bosque esconde jinetes y frena la carga; el vado desordena al que cruza) |

### 3.B · Taller Hexágono (táctica por turnos)
**Su modelo.** Turnos, casillas y la cuenta a la vista: «62 % de ganar el choque; +1 por cargar cuesta abajo».

**(a) Lo que acierta**
1. **Enseñar la cuenta antes de actuar.** Hoy el botón «late» y poco más. Comprobado: la maqueta GM6 ya hace un juicio
   de cada orden (relevo a tiempo, sin necesidad, bajo la carga, sin aliento; empujar cuando flaquean; contraórdenes…)
   y lo muestra **después**, como rótulo dorado o rojo. Pero no antes, y no se acuerda al final.
2. **Saber por qué se gana o se pierde.** Los datos ya existen: el resultado guarda cuántas órdenes fueron bien y mal y
   el ánimo final. **No se enseñan.** Es el trabajo más barato de todo el informe.
3. **Pensar sin prisa.** Con tres frentes y avisos que se van solos, quien juega con una mano pierde la información.
   La pausa y el aviso que permanece en pantalla son una necesidad real, no un lujo.
4. **Dos jugadores podrían turnarse.** Las reglas corren sin pantalla y el azar es un número guardable; no cuesta nada
   conservarlo.

**(b) Lo que exagera o no encaja**
1. **Por turnos no se ve la batalla.** Tú pediste «ver y dirigir». Descartado.
2. **Porcentajes y dados en pantalla.** En 390 px y con una mano, una tabla de cuentas es ruido. Roma no era una hoja de cálculo.
3. **«Nunca sabe por qué gana.»** Exagera: en GM6 ya lo sabe un poco (los rótulos). Pero es cierto que en GM7 y GM1 no.
4. **Tiempo real castiga al que juega con una mano.** Cierto en parte; por eso los avisos deben aguantar y avisar antes.

**(c) Cómo volverlo positivo**
| Punto negativo | Versión AQVILA, en positivo |
|---|---|
| Tabla de cuentas | **Una sola línea** bajo el botón: lo que da y lo que cuesta **ahora** («Relevo: entran frescos · 2 s de desorden · tus hastati llevan 68 % de cansancio») |
| «Nunca sabe por qué» | **El porqué al final, en tres frases**, hechas con lo que ya se guarda: «Ganaste porque soltaste los jinetes a la espalda a los 61 s» · «Perdiste el ala derecha porque dejaste el costado al aire 9 s» |
| Dados a la vista | Al revés: **que el resultado se explique, no que se calcule antes.** Lo que se calcula antes se enseña en palabras: «bien momento», «aún están enteros», «¡te están cargando!» |
| No se ve la batalla | Se conserva todo el espectáculo; la pausa solo congela y deja leer |
| Tiempo real castiga | **Avisos que duran** hasta que haces algo o pasa el peligro; nunca desaparecen solos mientras haya peligro |

### 3.C · Pulgar Rojo (móvil de partidas cortas)
**Su modelo.** Tres minutos, una mano, vertical, respuesta inmediata con sonido, estrellas al final, dificultad que se ajusta sola.

**(a) Lo que acierta**
1. **El sonido.** Hoy: el **juego publicado ya suena** (GC5: cuerno, carga, choque, barrito, redoble; síntesis propia en
   `js/gfx/sonido.js`). **Ninguna maqueta suena.** La crítica estaba en lo cierto cuando se escribió y ya es a medias
   falsa; pero hay que trasladar el sonido a la batalla fusionada.
2. **Respuesta inmediata**: cada toque debe responder en una décima (golpe, número, sonido). Es un criterio de aceptación
   que nadie ha medido: «primer toque útil sin leer» es una de las tres medidas que faltan.
3. **Un cierre con nota** y un motivo para repetir. Sin cierre, una victoria vale lo mismo que otra.
4. **Enseñanza guiada**: se suelta al jugador con cuatro verbos y ya. Una primera batalla guiada (con avisos de «ahora
   Escudos») enseña mejor que un texto.
5. **Medir en un móvil modesto**: tú ya mediste el tuyo (60 img/s con 10 000). No hay dato de un móvil de 150 euros.

**(b) Lo que exagera o no encaja**
1. **Estrellas huecas y premios que se abren.** Sin historia, es adictivo y vacío. AQVILA no cobra ni quiere cobrar.
2. **Energía que cuesta.** Los botones no deben costar dinero ni «vidas». Nos importa el cansancio **del campo**, no una barra de pago.
3. **Rival «de tu nivel».** Borra la historia: Pirro no se ajusta a nadie. En una campaña de Roma, a veces te toca
   un enemigo mucho más fuerte, y eso es parte de la gracia.
4. **Tres minutos.** Para esto es poco con 40 s de acercarse; tú pediste batallas «más espaciadas».

**(c) Cómo volverlo positivo**
| Punto negativo | Versión AQVILA, en positivo |
|---|---|
| Estrellas huecas | **Nota con sentido histórico**: bronce, plata, oro, y además qué hiciste bien y mal. La nota **cuenta en la campaña** (decisión 7) |
| Premio que se cobra | El premio es **lo que sobrevive**: veteranos que luchan mejor la próxima y prestigio ante el Senado. Sin monedas |
| Energía | El «coste» lo pone el **campo**: cansancio, ánimo y reserva ya existen; solo hay que verlos llenarse y vaciarse |
| Rival de tu nivel | **Dificultad elegible** al empezar, como los cargos del cónsul que asciende; el rival es histórico y no se ajusta |
| Sin enseñanza | **Primera batalla guiada** con avisos que se apagan según aciertas (los avisos «late» ya existen) |
| Fluidez sin medir | **Contador de img/s** en pantalla (0,2 M) y una prueba en un móvil modesto antes de decir APTO |

### 3.D · Polibio Digital (simulación histórica)
**Su modelo.** Simula lo que un cónsul podía hacer: poco. Las órdenes tardan, la línea se cansa, casi todas las bajas llegan en la huida, cada batalla es una batalla con nombre.

**(a) Lo que acierta**
1. **Casi todas las bajas llegan en la huida.** Confirmado en las reglas: un cuerpo roto no sufre más. Es el fallo
   histórico más grande. *(Según la historiografía moderna —Goldsworthy 1996, Sabin 2000—; de memoria, sin cotejar.)*
2. **El cónsul mandaba poco.** Nuestras cuatro órdenes ya lo expresan: es una ventaja, no una carencia.
3. **Batallas con nombre.** No hay **ni una**: ni Heraclea, ni Cannas, ni Zama. El juego dice enseñar historia y el
   ejército de Cartago es una «mezcla tipo». Pero ojo: los **estudios** (GM2, GM7, R21) sí tienen citas por tropa,
   solo que **de memoria**, como dice la propia crítica.
4. **Las licencias se amontonan donde más se ve.** Cierto: tiempo (140 m en 15 s), 40 a 60 vélites donde hubo 1 200,
   elefantes de Pirro delante (en Heraclea los guardó), libios con lanza tras 217 a.C., aliados dibujados como romanos,
   y el **testudo en campo abierto**, que en 280–146 a.C. solo se atestigua para asaltar murallas (GM7, marcado).
5. **El relevo es lo que peor conocen las fuentes.** Cierto: Livio 8.8 y los estudios modernos lo discuten. Por eso
   conviene decir en pantalla que es una reconstrucción.

**(b) Lo que exagera o no encaja**
1. **Órdenes que tardan y reglas de fatiga de minutos.** Con 3 a 4 minutos y un dedo, no se sostiene.
2. **Mirar mucho y mandar poco.** Es para un simulador, no para el autobús. Se abandona a la segunda batalla.
3. **«El pecado mayor.»** Exagera: la fidelidad se gana **por capas** sin frenar el juego. Tampoco hay una sola
   fuente que cuente todo con detalle de una batalla; la línea honesta es decir «según Polibio…».
4. **Comprimir horas en minutos «mata» la historia.** Es una licencia inevitable en un juego; basta con **decirla**.

**(c) Cómo volverlo positivo**
| Punto negativo | Versión AQVILA, en positivo |
|---|---|
| Sin persecución | **La huida mata**: el cuerpo roto sufre bajas mientras huye si los jinetes u otro cuerpo lo persiguen (decisión 4) |
| Sin batallas con nombre | **Una batalla con nombre como prueba** (Heraclea 280: elefantes, la más enseñable para esto) con sus fuerzas reales y su lección (decisión 8) |
| Citas de memoria | **Cotejar** las citas por tropa con el texto (Polibio, Livio, Plutarco) antes de afirmar nada en pantalla |
| Aliados como romanos | **Aliados con aspecto propio** (la propia Historia lo pide: Polibio 6.26) |
| Licencias amontonadas | **Un «Códice» breve al final:** tres frases de «esto es histórico / esto es licencia de juego». Dos o tres frases, el detalle en el Códice |
| Mirar mucho, mandar poco | Se queda: la persecución y la cámara de caballería **dan que mirar con motivo** (tú pediste seguir a los jinetes) |
| Testudo anacrónico | Se queda **marcado como licencia** (tú lo pediste); además un texto breve dice cuándo sí se usó |

## 4. Lo positivo del informe del gobierno (lo que ya hemos hecho bien, con pruebas)

**Del informe de las cuatro empresas y de los ministerios**
- **Fable 5.2 (dirección)**: diagnóstico honrado: «se ha confundido "no le gusta" con "hay que rehacerlo"». Y la regla útil:
  **no se equilibra nada que el usuario no haya jugado**.
- **Historia**: reconoce que las licencias están marcadas y los dictámenes son «APTO CON NOTAS»; las notas son las que
  dice §3.D.
- **Arte**: ya hay decisión de aspecto (el 3D de GM1) y una lista de qué sobra.
- **Ahorro**: una cuenta clara del gasto (cuatro sesiones sobre lo mismo; carriles paralelos que luego hay que coser).
- **Jueces**: la confesión que sí hay que arreglar (GC2) y las tres medidas que faltan.

**De las maquetas, qué aporta cada una a la fusión** (esta es la tabla de materiales, y es la que más importa):
| Pieza | Qué trae de bueno | Prueba |
|---|---|---|
| GC1 (`guerra-cero`) | La idea: tres pulsos, cuatro órdenes, una pantalla, «Retirarse» siempre a mano. «Es la base que quería hacer» | No tocar nada: 0 %. Solo empujar: 0 %. Con cabeza: 100 %. Dura 1,5 a 3 min |
| GM1 (`guerra-grande`) | El aspecto que prefieres: cartones, 220 figuras como mucho, filas que adelgazan al caer gente | 10 000 por bando a 60 img/s en tu móvil; costó lo mismo que 1 620 de GC1 |
| GM2 (`guerra-cuerpo`) | Armas y formaciones con fuente; flancos y huecos; elefantes que se revuelven; caballería enemiga | Ninguna arma gana siempre. Por el costado, 170 príncipes vencen a 260 libios que de frente ganan siempre |
| GM6 (ánimo) | **Mandar bien premia y mal castiga**; el relevo se ve; botón que dice «buen momento» | Relevo a tiempo gana 7,5 m en 10 s; bajo la carga, 3,2 m; sin necesidad, 0,2 m. Marear a la tropa hunde el ánimo y pierde siempre |
| GM7 (`guerra-lejos`) | Empezar de lejos; proyectiles que se ven; escudos y testudo; **ficha por tropa** (añadir tropa = añadir una línea) | Con escudos a tiempo gana el 98 %; sin cubrirse, el 33 %; testudo hasta el choque, 0 %; escudos siempre, 95 % |
| GC3 a GC5 (`js/guerra.js`) | Ya está en el juego; guardado a mitad; sonido; falange y elefantes; unido a la campaña | Jueces de lógica APTO; tú: «bien» |
| Las tres medidas de GC2 | El juez que **juega** la batalla: primer toque, duración, salida en dos toques | Parte de `captura.mjs` |

**Un matiz importante sobre GM7**: ya trae **más de una manera de ganar en el acercamiento** (escudos a tiempo, escudos todo
el camino y testudo con cabeza ganan; el testudo eterno pierde). Es el primer sitio donde dejó de haber una sola
respuesta. Hay que **conservarlo y llevarlo al choque**.

## 5. Lo que fallan las cuatro a la vez (los cuatro agujeros), con su arreglo

| Agujero | Lo que dicen las cuatro | Estado real hoy | Arreglo (decisión) |
|---|---|---|---|
| **Falta el dónde** | Todas tienen posición o terreno | Solo hay distancia y sectores; sin relieve | Terreno por batalla y campo ancho (6); jinetes que rodean (3) |
| **Falta el porqué** | Todas explican el resultado | Los datos existen y no se enseñan | Línea de coste y tres frases finales (2) |
| **Falta el después** | Todas dejan huella | Solo bajas | Nota y veteranía en la campaña (7); la huida que mata (4) |
| **Falta decidir el modelo** | Cada una es una cosa | Cinco juegos de reglas a medias | Un solo motor (1) |
| (nuevo) **Hay una respuesta correcta** | No lo dicen todas, pero 3 lo insinúan | «Con cabeza» gana el 100 % en GC1, GM2 y el juego | Planes enemigos que se leen y dos maneras de ganar (5) |

## 6. La mejora final: «La batalla que se lee, se juega de más de una manera y deja huella»

### 6.1 Cómo sería una batalla (la película, para que se entienda lo que se pide)
1. **Antes de empezar** (5 s). Ves el campo: una loma a la izquierda, el enemigo con su estandarte. Un texto de una línea
   dice quién eres y qué batalla es («Ásculo, 279 a.C.»). Sin menú de despliegue.
2. **El acercamiento** (40 s). Salen los tiradores, hay piedras y jabalinas. Tus botones son Avanzar, Escudos, Testudo y
   Caballería. Cada botón dice una línea: lo que da y lo que cuesta ahora. Si no te cubres, caen hombres y el ánimo baja.
3. **El choque** (60 a 90 s). Empujar, Aguantar, Relevo y Caballería. Tu relevo a tiempo se ve y se oye; si es mal
   momento, se ve el desorden. Los jinetes salen **por el ala**, dan la vuelta y entran por la espalda (se tarda unos
   8 s y se ve venir). Los elefantes se paran con jabalinas, calles o lanzas, no con una carga de caballería.
4. **La ruptura y la persecución** (20 a 30 s). Si rompes un cuerpo, ves cómo huye. La caballería persigue y cae gente;
   puedes **reagrupar** en vez de perseguir (si te pasas, dejas tu flanco al aire). La cámara sigue a los jinetes.
5. **El final** (15 s). Banner con la nota (bronce, plata, oro) y tres frases de por qué. Una línea de historia dice
   qué es hecho y qué es licencia.
6. **Después.** La campaña se lleva la nota: veteranos que mejoran y prestigio. Si eres derrotado, también hay nota
   («retirada en orden», que cuenta).
Duración total objetivo: **2,5 a 4 minutos**. Con tu móvil: de pie o tumbado, una mano, «Retirarse» siempre arriba.

### 6.2 Las ocho decisiones, ordenadas

**Decisión 1 · Un solo motor de reglas y un solo aspecto** (la base de todo lo demás)
- *Qué cambia para ti*: una sola batalla que **se ve como la de GM1/GM7** y **se juega con las reglas de GM2 + GM6 + GM7**: armas,
  formaciones, flancos, ánimo, premio y castigo, empezar de lejos, escudos, testudo, elefantes y falange. Se acabaron
  las cinco versiones.
- *De dónde sale*: informe (el hallazgo de §2); P126 (que ya proponía unir relevo y aspecto de GM1); tu respuesta «sí»
  a «una sola batalla».
- *Cómo*: partir de `guerra-lejos/reglas.js` (tiene ya la **ficha por tropa**: añadir una tropa es añadir una línea) y
  **traerle** desde `guerra-cuerpo/reglas.js` las armas, formaciones, flancos, hueco, caballería enemiga y ánimo.
  Las dos tienen estructura parecida (sectores, cuerpos, líneas). Una sola prueba que pase a la vez las de GM2, GM6 y GM7.
  El juego (`js/guerra.js`) se actualiza después (GM5), no en esta tarea.
- *Riesgo*: es la tarea que más se parece a la que se pasó de gasto en GM6 (3,0 M frente a 1,1 M previstos):
  «adaptar una vista a reglas nuevas no es una pieza, son tres». Hay que **partirla en tres encargos** (armas y formaciones;
  flancos y ánimo; aspecto y relevo) y poner tope duro.
- *Coste*: **grande** (1,5 a 2,5 M, repartidos en tres piezas). Es la inversión que **ahorra** en las demás.

**Decisión 2 · El porqué, a la vista**
- *Qué cambia*: bajo cada botón una línea con lo que da y cuesta **ahora**. Al final, tres frases de por qué ganaste o
  perdiste y una nota (bronce, plata u oro). La pausa deja leer.
- *De dónde sale*: Hexágono y Pulgar Rojo; ánimo de GM6; P125 («el porqué a la vista»).
- *Cómo*: los datos ya están (`mando.bien`, `mando.mal`, el juicio de cada orden, el ánimo final, tiempos de cada evento).
  Falta una función que **escoja los tres hechos más importantes** y los escriba en llano, y la línea del botón.
- *Riesgo*: que sea texto largo en un móvil. Tres frases, no cinco.
- *Coste*: **pequeña a media** (0,8 M).

**Decisión 3 · La caballería maniobra y el elefante impone** (ya aprobada: GM8 y GM9)
- *Qué cambia*: los jinetes viven en las alas, **rodean por fuera**, no atraviesan a los suyos, y al centro solo llegan
  por detrás. Antes hay duelo con los jinetes enemigos del ala. Los caballos **no cargan elefantes** (se espantan).
  Al elefante lo paran jabalinas, flechas y lanzas clavadas; la espada de frente apenas. Su carga desordena y asusta.
- *De dónde sale*: tú, al probar GM6; estudio R21; «parecernos a Rome II» (GM9); Cónsul.
- *Cómo*: ya estudiado seis reglas en R21. Falta llevarlo al motor único (para no hacerlo dos veces, **después de la 1**).
- *Riesgo*: Pirro y Cartago se vuelven más difíciles; hay que volver a probar el equilibrio **después** de que lo juegues, no antes.
- *Coste*: **media**, ya presupuestado (0,8 M sobre GM8).

**Decisión 4 · La huida mata y la cámara sigue a los jinetes** (parte ya aprobada en GM8)
- *Qué cambia*: cuando un cuerpo se rompe, no se queda quieto: huye y **cae gente mientras huye**, más si lo persiguen
  los jinetes. Puedes **perseguir o reagrupar** (el botón Caballería se convierte en «Perseguir» tras la ruptura).
  Si te pasas, dejas el flanco al aire. La cámara puede seguir a los jinetes.
- *De dónde sale*: Polibio Digital (casi todas las bajas llegan en la huida); tu petición en GM1 («perseguir a los
  arqueros con la cámara»); hallazgo 2 de §2.
- *Cómo*: hoy un cuerpo roto no sufre más. Añadir un estado «persigue» y bajas escalonadas a quien huye, con un
  tope de tiempo para que no alargue la batalla.
- *Riesgo*: que la batalla se alargue más de 4 minutos; la persecución tiene tope (20 a 30 s).
- *Coste*: **media** (0,6 M, además de lo ya aprobado en GM8).

**Decisión 5 · Que no haya una respuesta correcta**
- *Qué cambia*: dos partidas contra el mismo rival no se parecen. El enemigo **escoge un plan** al empezar y lo
  **anuncia** con un aviso («Cartago refuerza su ala izquierda»). Hay **dos maneras de ganar** (por las alas o por el
  centro). Bien jugado, se gana **el 75 a 85 %**, no el 100 %.
- *De dónde sale*: informe (la prueba «con cabeza gana el 100 %» era un defecto); Cónsul; Pulgar Rojo; GM7, que ya
  trae varias maneras de ganar en el acercamiento.
- *Cómo*: **no con más temblor** (se anula, §2) sino con **pocos golpes grandes y legibles**: 2 a 3 planes por rival que
  cambian dónde carga y cuándo salen los jinetes; un suceso grande por batalla (un cuerpo enemigo que se rompe pronto,
  una carga que llega más tarde). Con la misma semilla, la misma batalla (sirve para dos jugadores).
- *Riesgo*: que el jugador sienta injusticia. Todo **se anuncia antes**; lo malo se ve venir.
- *Coste*: **media** (1,0 M).

**Decisión 6 · Un poco de dónde: terreno por batalla y campo ancho**
- *Qué cambia*: el campo es el doble de ancho que el ejército, con lomas suaves y horizonte; **un rasgo de terreno por
  batalla** con su regla: loma (arriba se tira más lejos y se carga mejor), bosque (esconde jinetes y frena la carga) o
  río con vado (quien cruza llega desordenado). Color de tierra y cielo según la región. La orden se pinta en el suelo
  con una flecha. **Sin menú de despliegue.**
- *De dónde sale*: Cónsul; estudio R22 y propuesta P128 (todavía sin aprobar).
- *Cómo*: sobre la maqueta fusionada. Primero la versión mínima (campo ancho con lomas, una loma que da ventaja y la flecha).
- *Riesgo*: el relieve puede tapar tropas en un móvil de pie. Lomas muy suaves al principio.
- *Coste*: **media** (0,8 M la versión mínima; 2,3 M entera en tres sesiones).

**Decisión 7 · El después: la nota cuenta en la campaña**
- *Qué cambia*: ganar bien y ganar mal ya no valen casi lo mismo. La nota da **veteranía** a los hombres que
  sobreviven (pegan algo mejor en la siguiente) y **prestigio** ante el Senado. Una derrota en orden (retirarse a
  tiempo) cuenta. Sin monedas.
- *De dónde sale*: Cónsul («todo viene y vuelve»); Pulgar Rojo (nota); Ahorro («lo que no importa después, aburre»); NB8 ya lo tenía apuntado.
- *Cómo*: tocar `js/game.js` y la campaña (guardado nuevo → migrar en `G.load`). Va **detrás** de GC y de GM5.
- *Riesgo*: tocar el guardado y la economía. Es el cambio con más riesgo, y por eso va casi al final.
- *Coste*: **grande** (1,2 M, y con mala racha 2 M).

**Decisión 8 · Una batalla con nombre, como prueba**
- *Qué cambia*: una batalla histórica jugable, con sus fuerzas, su terreno y una lección. **Heraclea (280 a.C.)** es la primera
  recomendada: Pirro, elefantes y caballos que se espantan (Plutarco, *Pirro* 17; de memoria). Citas cotejadas con el
  texto. Aliados con aspecto propio. Un «Códice» de tres frases: qué es histórico y qué es licencia.
- *De dónde sale*: Polibio Digital; dictamen de Historia («ninguna cita cotejada; no hay una batalla jugable»).
- *Cómo*: un agente de Sonnet con búsqueda para el estudio, ficha en `gobierno/historia/`, y luego escenario sobre el motor
  fusionado. **Una sola** primero; las otras (Cannas, Zama) si gusta. Cannas pide un diseño especial: históricamente
  se pierde, así que la nota se mide contra lo que hizo el cónsul real, no contra ganar.
- *Riesgo*: que la «fidelidad» frene el juego. Se hace en capas: la batalla se juega igual; la historia va en el final.
- *Coste*: **grande** (1,5 M la primera).

### 6.3 Orden recomendado y dependencias
| Orden | Decisión | Por qué en ese puesto | Depende de |
|---|---|---|---|
| 1.º | **2** El porqué | Lo más barato que más se nota; no toca reglas, solo enseña lo que ya hay | Nada |
| 2.º | **1** Motor único | Una vez, y antes de ensanchar las reglas | Tu respuesta a GM7 (qué empezar de lejos) |
| 3.º | **3** Caballería y elefantes | Tu queja; ya aprobada; se hace sobre el motor único | 1 |
| 4.º | **5** Sin respuesta correcta | Necesita el motor único y la caballería que maniobra | 1 y 3 |
| 5.º | **4** La huida mata | Necesita caballería nueva | 3 |
| 6.º | **6** Terreno | Necesita el campo ancho y la caballería que rodea | 1 y 3 |
| 7.º | **7** El después | Toca el guardado y la campaña | GM5 (llevar la batalla al juego) |
| 8.º | **8** Batalla con nombre | La más cara; solo si las demás gustan | 6 y 7 |

**Primera ola recomendada: 2, 1 y 3.** Es lo que tú pediste (caballería y elefantes, una sola batalla) más lo barato que
más se nota (el porqué). Total orientativo **3,1 a 4,1 M**, más el margen de corrección de §6.4.

### 6.4 Cuánto costaría, con honestidad
| Decisión | Estimación mía | Ya aprobada |
|---|---|---|
| 2 | 0,8 M | Parte (P125, sin aprobar) |
| 1 | 1,5–2,5 M | P126 (sin aprobar) |
| 3 | 0,8 M | **Sí** (GM8 y GM9) |
| 5 | 1,0 M | Parte (P125) |
| 4 | 0,6 M extra | **Sí** (parte en GM8) |
| 6 | 0,8–2,3 M | No (P128, sin aprobar) |
| 7 | 1,2–2 M | No |
| 8 | 1,5 M | No |
| **Total** | **8,2 a 11,5 M** |
**Ojo con las estimaciones**: las últimas tareas parecidas se pasaron casi siempre: GM6 +172 % (3,0 M frente a 1,1), GC4 +31 %,
GM2 +28 %, GM1 +20 %. Recomiendo sumar **un 30 a 50 %** de margen y poner un **tope duro de pasos** a cada encargo.
Los 15 M que ya se gastaron en batallas que no se ven son el motivo de **empezar por sumar, no por rehacer**.

### 6.5 Cómo sabremos que mejora (criterios de aceptación)
1. **Primer toque útil sin leer**: un jugador nuevo hace una orden con sentido en 10 s (ya lo mide `captura.mjs`).
2. **Variedad**: con jugadores de mentira, **dos maneras distintas de jugar bien ganan las dos** (por alas y por centro) y
   el que juega «con cabeza» no gana el 100 % (objetivo 75–85 %).
3. **Fluidez**: ≥ 30 imágenes por segundo en un móvil modesto con 10 000 por bando. Hoy solo hay dato de tu móvil.
4. **Duración**: 2,5 a 4 minutos.
5. **Que se entienda**: el porqué del final lo explica, y el jugador puede decir «gané porque…» sin mirar las reglas.
6. **Que lo juegues tú** antes de equilibrar nada con bots (regla de Ahorro).

### 6.6 Lo que no se hace
- Una sexta batalla desde cero.
- Veinte piezas movidas a dedo.
- Turnos.
- Energía, estrellas que se cobran o dificultad que se ajusta sola.
- Más armas o formaciones antes de que la batalla fusionada esté en el juego.
- Equilibrar con bots lo que no has jugado.

## 7. Las dudas que decides tú (con mi recomendación)
Las dudas se dicen, no se resuelven a ojo.

1. **¿Cuánto se aprueba?** (A) Primera ola: decisiones 2, 1 y 3 (≈3 a 4 M, más margen); (B) todas; (C) eliges tú.
   *Recomiendo (A).* Lo demás se decide al probar la fusión.
2. **¿Sobre qué base se hace el motor único (decisión 1)?** (A) Sobre `guerra-lejos` (GM7), trayéndole las reglas de GM2 y
   GM6; (B) sobre `guerra-cuerpo` (GM2/GM6), trayéndole lo de GM7; (C) otra. *Recomiendo (A):* ya tiene el aspecto que
   prefieres y la ficha por tropa. **Depende de que contestes las tres preguntas de GM7.**
3. **¿Se puede perder jugando bien?** (A) Sí, entre un 15 y un 25 %; (B) no, siempre ganable con buen juego pero por
   caminos distintos. *Recomiendo (A):* sin riesgo no hay tensión, y la derrota «en orden» da nota igualmente.
4. **Tras romper al enemigo, ¿persigues tú o va solo?** (A) Tú, con el botón Caballería convertido en «Perseguir»;
   (B) solo, y tú miras. *Recomiendo (A):* si no, mandas menos, y tú ya pediste «seguir a los jinetes».
5. **¿Terreno elegido por ti o impuesto por la batalla?** (A) Impuesto (por región o por batalla) y tú lo lees;
   (B) con menú antes de empezar. *Recomiendo (A):* es lo que dijiste («sin despliegue») y es lo que hace Rome II.
6. **¿Qué da la nota en la campaña?** (A) Veteranía y prestigio ante el Senado; (B) además botín. *Recomiendo (A).*
   Pulgar Rojo cobra; nosotros no.
7. **¿Qué batalla con nombre primero?** (A) Heraclea (elefantes); (B) Cannas (la más enseñable, pero se pierde);
   (C) Zama. *Recomiendo (A)*, y Cannas después como caso especial.
8. **Duración:** (A) hasta 4 minutos (coherente con «más espaciadas»); (B) mantener 2,5. *Recomiendo (A).*
9. **¿Mover con el dedo (GM10) antes o después del motor único?** *Recomiendo después*: depende de cómo rodean los jinetes.

**Cosas que aún no sé y conviene saber antes de gastar**: cuánto tarda en sentirse largo el acercamiento de 40 s; las
imágenes por segundo «de cerca» y en un móvil modesto; y si el testudo en campo abierto se queda (es una licencia
marcada, no un hecho).

## Anexo A · Lo que dicen las empresas, contrastado con el código
| Afirmación de la crítica | ¿Cierta hoy? | Qué he visto |
|---|---|---|
| No hay terreno ni posición | **Sí** | Solo `dist` entre líneas y `frente` por sector; sin relieve |
| El flanco lo regala una regla | **A medias** | Hay hueco por terreno cedido; GM2 añade jinetes y «el vencedor se vuelve»; GM7 no los trae |
| No se enseña ninguna cuenta | **A medias** | GM6 juzga y rotula cada orden; el final no lo cuenta, y GM7/GM1 no lo traen |
| No hay sonido | **Falsa para el juego** (GC5), **cierta para las maquetas** | `js/gfx/sonido.js` existe y está enchufado |
| El relevo es un salto brusco | **Ya no** en `guerra-relevo`; **sí** en GM1 y GM7 | Relevo con tiempo (2 a 4,5 s según el juicio) |
| Los botones no cuestan nada | **Falsa en GM7**, **sí en GC1** | Escudos y testudo cansan; empujar cansa |
| No hay nota ni premio al terminar | **Sí** | `resultado` guarda lo que haría falta, no se enseña |
| «Con cabeza» gana el 100 % | **Sí en GC1 y GM2; no en GM7** | GM7: con escudos a tiempo 98 %, sin cubrirse 33 % |
| La matanza llega en el choque, no en la huida | **Sí** | Un cuerpo roto no sufre bajas |
| No hay una batalla real | **Sí** | Rivales «tipo» (Pirro, Cartago), sin escenario |
| Citas de memoria | **Sí** | Lo dicen los propios partes |
| Los elefantes mueren a la primera carga | **Sí en GM6** | Carga de espalda ×1,4: 28 bajas, cerca de dos bestias; R21 |
| La caballería atraviesa | **Sí** | `ocasion()` deja entrar a cualquier cuerpo, sin ruta |
| El azar no da variedad | **Sí** | Un temblor ±10 % por paso, igual para los dos bandos |

## Anexo B · Historia: dictamen y fuentes (todas de memoria; cotejar antes de afirmar en pantalla)
**Dictamen: APTO CON NOTAS.** Este estudio no añade contenido de época; **propone** contenido y por eso lo marco.
- **Histórico (con fuente)**: la legión en tres líneas (Polibio 6.21–23; Livio 8.8); el relevo entre líneas, discutido en la historiografía moderna; vélites y jabalinas delante (Polibio 6.22); calles a los elefantes en Zama (Polibio 15.9); caballos que se espantan ante elefantes en Heraclea (Plutarco, *Pirro* 17); caballería que decide volviendo sobre la espalda (Polibio 3.115–116, Cannas; 15.12–14, Zama).
- **Probable**: casi todas las bajas del bando vencido llegan en la huida (Goldsworthy 1996; Sabin 2000, *JRS* 90); cubrirse con el escudo bajo una lluvia de proyectiles; reserva que se vuelve a tapar el costado.
- **Licencia de juego**: tiempo comprimido; número de vélites; elefantes de Pirro delante; libios con lanza tras 217 a.C.; **testudo en campo abierto** (Polibio 28.11 y Livio 44.9 solo lo atestiguan para murallas); aliados pintados como romanos; el «ánimo de la legión» en una sola barra; la persecución con tope de 20 a 30 s.
- **Para la batalla con nombre** (decisión 8): hay que revisar cifras, fuerzas y relatos de **Heraclea (280)**, **Ásculo (279)**, **Cannas (216)** y **Zama (202)** con Polibio, Livio, Plutarco, Apiano y Dionisio de Halicarnaso, con las versiones que discrepan. Todavía **no** se ha hecho.

## Anexo C · Lo que este estudio **no** ha hecho
- No he jugado la batalla en un móvil ni mirado capturas nuevas.
- No he abierto las vistas (`vista.js`) a fondo: las conclusiones sobre el dibujo vienen de los estudios y partes.
- No he cotejado ninguna cita con el texto antiguo.
- Las cifras de coste son mías, y son optimistas respecto a la media de las últimas tareas.
