# BG1 · Estudio de la batalla grande de Rome II, para llevarla a AQVILA (19/11/2026)

**Pedido del usuario (19/11)**: «quiero que fable estudie en otra sesión aparte vídeos de YouTube del Rome 2 Total War para
que sepa qué es lo que quiero con la parte del combate grande… que entienda el juego, más mecánicas y se fije mucho en los
gráficos y la jugabilidad para estudiarlo y poder meterlo en nuestro juego».
**Qué es esta página**: un estudio. No construye nada. Sirve a las líneas **L10** (batalla), **L11** (a pie) y **L12**
(Escaramuzas). **No abre líneas nuevas**: reformula CG5, CG7, CG8, CG4b y CG6 (§4.5). Parte de
`REF-batallas-referencias.md` y no repite GM32, GM42, R22, TP0 §3, CG1 ni ES0. Se toman **ideas**; nunca código, arte,
sonido, textos ni interfaz del juego comercial. Nada suyo se ha guardado en el repositorio.

**Estado**: segunda pasada (19/11, tarde). El usuario corrigió la primera: «esas fotos no me sirven, tienes que ver combates de verdad». Hecho: **dos partidas reales vistas de principio a fin** (§2 bis). Quedan sus tres respuestas (§6).

## 0. Qué he visto de verdad, qué he leído y qué es de memoria
- **[P] Visto en partidas reales** (segunda pasada): dos vídeos enteros bajados de Internet Archive a una carpeta
  temporal (borrados al acabar; nada en el repositorio) y mirados con su minuto marcado: el **recorrido oficial de
  Teutoburgo** narrado por sus autores (10 min 45 s, una imagen cada 8 s) y **un asedio en línea de tres contra tres**
  de un youtuber (28 min, una imagen cada 21 s). Además, **cuatro ráfagas** de dos imágenes por segundo (la carga, la
  salva de pila, la bajada de cámara, el asalto a la torre) y el tráiler oficial de Steam (82 s). En total, unas 250
  imágenes en orden. **Sigue sin sonido**: no puedo oír.
- **[V] Visto**: 84 fotogramas públicos (portada y tres imágenes fijas) de **21 vídeos** de YouTube de Rome II (lista en
  §5). Son imágenes sueltas: **no he visto ninguno en movimiento ni lo he oído**. YouTube pide iniciar sesión para
  reproducir desde la nube. También nuestras capturas `CG4-*` y `CG6-*`.
- **[L] Leído entero**: la wiki oficial de Total War (wiki.totalwar.com): ficha de la batalla de Teutoburgo, la serie
  «Unit Spotlight» (títulos y resúmenes de nueve vídeos de los diseñadores) y «Mastering Battles» (es del primer Rome;
  vale para lo común a la saga: despliegue, reloj, plaza, estandartes, mini-mapa). Los estudios nuestros ya citados.
- **[R] Solo el resumen del buscador** (la red de esta sesión no deja abrir esas páginas): manual oficial de Rome II
  (r2enc.totalwar.com: asedios, moral, cansancio, habilidades), Total War Academy, avances y crítica de PC Gamer,
  GameSpot, GameWatcher y TheSixthAxis, guías de GamePressure.
- **[M] De memoria**, sin poder comprobarlo aquí: casi todos los **números** (hombres por unidad, estados exactos de
  moral y cansancio) y el detalle de cómo suena. Va marcado. Si un número importa para construir, se comprueba antes.
- **Sin ver**: sonido y voces; movimiento fino (animación de cada hombre) más allá de las ráfagas; y cualquier clip que el usuario tenga en mente y no
  haya subido a este chat. **Un clip suyo vale más que todo lo de arriba.**

## 1. Qué es la batalla de Rome II y cómo se juega, de principio a fin

**En una frase**: mandas hasta 20 unidades (bloques de unos 160 hombres [M]) en tiempo real con pausa; no gana quien
mata más, sino quien **hace huir** al otro; y se gana con **dónde y cuándo** metes cada bloque, no con reflejos.

### 1.1 Antes de empezar
- **Panel previo** [L, saga]: una barra compara las fuerzas; tres salidas: luchar tú, que la máquina la resuelva
  (rápido, pero con más bajas) o retirarte. Los refuerzos cercanos se cuentan.
- **Atacante y defensor** [L]: reglas distintas. El atacante tiene **reloj**: si se acaba, pierde. El defensor gana
  aguantando.
- **Vuelo de la cámara sobre el campo** y arenga del general antes de colocar [L, saga; en Rome II la arenga es corta [M]].
- **Despliegue** [L] [V]: tu zona va marcada en el suelo con tu color. El juego te coloca «con sentido»; tú puedes
  cambiarlo. Tocas unidades o sus tarjetas, y **arrastras en el suelo para dibujar la línea**: el largo del arrastre
  da el ancho y, con él, el fondo (visto: una línea amarilla en el suelo mientras se arrastra, vídeo oficial de mandos).
  Se seleccionan varias y se colocan juntas. En una emboscada no hay despliegue: te pillan en columna.
- **Tropas ocultas** [L]: las de sigilo se colocan fuera de la zona y no se ven. El bosque y las lomas esconden
  (línea de visión real, la novedad que el estudio enseñó en Teutoburgo).

### 1.2 Las tropas y el papel de cada una
| Tropa | Para qué sirve | Su punto débil | Fuente |
|---|---|---|---|
| Infantería de línea (espada y escudo) | Aguantar el centro y ganar la melé larga; descarga de pila al cargar | Lenta para rodear; el flanco | R22; [M] |
| Lanceros y hoplitas | Parar caballería; muro a pie firme | Pierden contra espadas en melé larga | R22; [M] |
| Picas (falange) | De frente no se entra: mata antes de que lleguen | Gira muy mal; costado, espalda y proyectiles | [V] (pilas de caídos delante del muro); guías [R] |
| Jabalinas | Mucho daño, poco alcance, poca munición; se retiran solos («escaramuza») | Caballería | Unit Spotlight 2 [L] |
| Honderos y arqueros | Alcance; desgastar antes del choque; tirar por encima | Indefensos de cerca; el escudo de frente los frena | [L] [M] |
| Caballería de choque | Carga, sale y vuelve a cargar; **martillo y yunque** (la infantería sujeta, el caballo pega por detrás) | Quedarse en la melé; lanzas y picas | Unit Spotlight 1 y 7 [L] |
| Caballería ligera y de tiro | Cazar tiradores, perseguir a los que huyen, hostigar | Cualquier choque serio | Unit Spotlight 8 [L] |
| Elefantes | Rompen la línea y **dan miedo** (bajan la moral de quien tienen cerca) | Jabalinas y fuego; se desbocan y pisan a los suyos | Unit Spotlight 5 [L]; R21 |
| Máquinas (balistas, onagros) | Abrir murallas y castigar bloques quietos de lejos | Lentas; cualquier jinete | [V] (onagros numerados en fila, proyectiles con estela) |
| General | Sube la moral a su alrededor; habilidades de un toque (arengar, reagrupar) | Si muere, golpe de moral a todo el ejército | [L] [R] |

### 1.3 Órdenes y formaciones
- **Mover y atacar**: tocar unidad, tocar destino u objetivo. Andar o correr (correr cansa). Arrastrar para dar ancho y
  frente. **Grupos** que guardan su forma [M]. Las órdenes se pintan en el suelo: flechas y rutas [V].
- **Tres interruptores por unidad** [M]: *mantener la posición* (no persigue), *escaramuza* (los tiradores se apartan
  solos) y *disparar a discreción*. Los tiradores también pueden cargar a mano.
- **Formaciones y habilidades** (botones propios de cada tropa) [R] [M]: testudo, falange de picas, falange hoplita,
  muro de escudos, cuadro, cuña y rombo de caballería, círculo cántabro (jinetes que tiran girando), ataque en
  formación (los legionarios no rompen filas). Otras son empujones con cuenta atrás: arenga, frenesí, látigo. Tienen
  **precio**: el testudo y la falange frenan; el látigo deja a la tropa sin aliento después.
- **Lo importante**: cada tropa tiene **dos o tres botones suyos**, no veinte. El resto es colocar.

### 1.4 Lo que decide: moral, cansancio, flanco y carga
- **Moral** [R] [L]: cada unidad tiene una barra. Amarilla, algo la está asustando; roja, **flaquea** y está a punto
  de romper. Rota, huye; puede **reagruparse** si la dejan en paz. Si su general ha muerto, queda **deshecha** y ya
  no vuelve. La bajan: bajas rápidas, ataque por el flanco y sobre todo **por la espalda**, proyectiles, el
  cansancio, enemigos que dan miedo, ver huir a los vecinos (los parches doblaron ese contagio) y perder al general.
  La suben: el general cerca, la veteranía, ir ganando, tener los flancos cubiertos.
- **Cansancio** [R] [M]: de fresca a agotada, por escalones. Lo suben correr, luchar, la formación cerrada y el mal
  tiempo. Una tropa agotada pega menos, corre menos y rompe antes. Se recupera quieta. De ahí sale la **reserva**:
  quien guarda tropas frescas gana el final.
- **Flanco y espalda** [R]: el escudo solo cubre de frente y a la izquierda; por detrás, el golpe entra y la moral cae
  en picado. Toda la táctica es **sujetar de frente y pegar por donde no hay escudo**.
- **Carga** [R]: un bono que sube el ataque y el daño **los primeros segundos**. Por eso la caballería entra, sale y
  repite. Cuesta abajo carga mejor; contra picas de frente, se mata sola [V].
- **Cuerpo a cuerpo, por dentro** [R]: el ataque es la probabilidad de acertar; la defensa, la de parar; el daño va
  en dos partes, la que la armadura frena y la que **perfora**. (Es lo que ES0 §5 ya adoptó para CG9.)
- **Munición** [M]: cada tirador tiene un número de descargas, a la vista en su ficha. Se acaba y solo le queda cargar.
- **Terreno y tiempo** [L] [R]: la altura da alcance y carga; el bosque esconde y desordena; el vado frena; la lluvia
  cansa más y estropea los arcos; la niebla tapa.

### 1.5 Refuerzos, asedios y final
- **Refuerzos** [L] [R]: hasta 20 unidades tuyas en el campo; un segundo ejército cercano entra **por el borde del mapa
  por donde venía** en la campaña. Puedes llevarlo tú (hasta 40) o dejárselo a la máquina.
- **Asedio** [R] [V]: el atacante construye antes **escalas** (lentas, la tropa sube sin cobijo), **torres** (cubren a
  los que suben) y **arietes** (la puerta); las máquinas abren brecha. El defensor pone tropas en el adarve y sus torres
  disparan. Dentro se lucha por las calles. Se gana echando al enemigo **o tomando la plaza central** antes de que se
  acabe el reloj. En los fotogramas: torres altas como siluetas contra el sol, la tropa formada delante esperando, el
  testudo acercándose bajo los proyectiles, calles con tejados rojos llenas de estandartes.
- **Tiempo** [V] [M]: pausa (se pueden dar órdenes en pausa), cámara lenta y dos velocidades rápidas.
- **Cómo se lee una unidad** [V] [L]: (1) su **estandarte** grande sobre el bloque, con el color del bando y el icono
  de su tropa; brilla si está elegida y parpadea si flaquea; tocar el estandarte elige la unidad, que es lo cómodo en
  plena melé; (2) su **tarjeta** en la fila de abajo, con retrato, barra de hombres y avisos; (3) al elegirla, un
  **panel** con sus datos en barras y su estado en palabras; (4) el **mini-mapa** con puntas de flecha por unidad.
- **Cómo termina** [L] [M]: cuando un bando entero huye o cae, o se acaba el reloj, o se toma la plaza. Puedes seguir
  para **perseguir** (los que escapan vuelven en la campaña). Sale un veredicto por grados (de victoria decisiva a
  derrota aplastante) y el recuento de bajas.

## 2. Gráficos y sensación: lo que se ve en los fotogramas

### 2.1 La cámara tiene tres alturas, y cada una enseña otra cosa
| Altura | Qué se ve [V] | Para qué |
|---|---|---|
| **Águila** (muy alta, oblicua) | Los hombres no se distinguen: **alfombras de color** con sus estandartes. El campo ocupa todo; las rutas pintadas en el suelo | Mandar. Es donde se juega |
| **Loma** (media, 30–40°) | Bloques con filas que se cuentan, lanzas que asoman, sombras largas de cada bloque | Colocar y mirar el choque |
| **Hierba** (a la altura del pecho o por debajo) | Tres a ocho hombres llenan la pantalla; el resto es masa desenfocada detrás; cielo arriba; hierba delante del objetivo | Sentirlo. Aquí no se manda |

- Los vídeos que el usuario llama «épicos» son casi todos **de la tercera altura**, montados como una película:
  **contrapicado** (la cámara en el suelo mirando hacia arriba: soldados y estandarte contra un cielo de tormenta),
  **a contraluz** (siluetas con el sol detrás), **en fila oblicua** (la línea de escudos que se pierde hacia el fondo) y
  **desde dentro** (entre las picas, por encima de los cascos).
- Rome II tiene un botón de **cámara de unidad**: se pega al hombro de un soldado. Sus propios diseñadores dijeron
  que sirve para mirar y orientarse; se manda desde arriba [R]. **AQVILA ya va más lejos**: en la nuestra, a pie, se lucha.

### 2.2 Cómo se dibuja un ejército grande
- **De lejos, el bloque es el personaje**: rectángulo limpio de un color, hueco entre bloque y bloque, y un estandarte
  alto encima [V]. Un ejército entero se lee como una fila de bloques (visto: decenas de cohortes en rejilla sobre
  la arena, con sus sombras).
- **De cerca, nadie es igual**: en una misma fila, escudos con dibujos distintos, túnicas de varios colores, cascos
  distintos, barbas, pieles [V]. Lo que **sí** se repite es la silueta del escudo y su color: eso da el bando.
- **El escudo manda en la imagen**: es lo más grande, lo más cercano a la cámara y lo más pintado. Una fila de escudos
  que se solapan llena medio fotograma [V].
- **Lanzas y picas hacen el dibujo del cielo**: un bosque de astas en abanico sobre las cabezas [V].
- **Escala real**: 20 unidades de unos 160 = **unos 3.000 hombres por bando** [M]. Los vídeos de «10.000» o «30.000»
  son batallas preparadas con varios ejércitos o con modificaciones, grabadas sin interfaz.

### 2.3 Luz, suelo y aire
- **Sol bajo y de lado** en casi todos los planos buenos: sombras largas que dibujan cada bloque en el suelo, borde
  dorado en cascos y hombros [V]. La luz de mediodía aplana; la de tarde hace la épica.
- **Una paleta por sitio**: arena y cielo azul duro (Egipto, Zama), hierba verde con flores (Italia, Germania),
  nieve y cielo de plomo (Alesia), naranja de polvo (Cinoscéfalas) [V].
- **Hierba alta en primer plano**, a veces tapando las piernas; árboles y palmeras en grupos al borde; lomas al fondo [V].
- **Polvo**: velo naranja detrás de la masa, que quita contraste a lo lejano y separa planos [V].

### 2.4 Proyectiles, impactos y muertos
- **Estelas**: las piedras y flechas incendiarias dejan una raya de humo en arco; donde caen, humo [V] (y clip 6 de TP8b).
- **Los caídos se quedan**: delante de un muro de picas se forma una **alfombra de cuerpos**; bajo un testudo castigado,
  un montón de escudos y hombres [V]. El campo cuenta la batalla.
- **Sangre** en escudos, ropa y suelo (es contenido de pago aparte en el juego original) [V] [M].
- **Duelos**: de cerca, los hombres luchan por parejas con golpes que casan (uno pega, el otro para o cae) [R] [M].

### 2.5 Sonido y voces [M] [R] (lo menos comprobado: no he oído nada)
- El ruido **cambia con la altura**: arriba, viento, cuernos y un rugido lejano; abajo, metal, gritos sueltos, pasos.
- Las unidades **contestan a la orden** con una frase corta en su idioma; el consejero avisa de lo grave («nuestro
  general ha caído», «huyen»). Música de orquesta que sube al chocar.
- La crítica dijo que el sonido «hace el trabajo de la multitud»: la masa se oye antes de verse [R].

### 2.6 Interfaz [V]
- Arriba a la izquierda, tiempo y velocidad. Abajo en el centro, **una fila de tarjetas pequeñas** (una por unidad).
  Abajo a la izquierda, panel de la unidad elegida. Abajo a la derecha, mini-mapa. Los botones de la unidad, en una tira
  sobre las tarjetas. El campo ocupa más de tres cuartos de la pantalla.
- Selección: los hombres se tiñen o se rodean de luz y su estandarte brilla. Destinos: silueta del bloque en el suelo.
- En los vídeos «de cine» **no hay interfaz**: se quita con una tecla. Parte de la épica es eso.

## 2 bis. Lo que enseñan las partidas reales (y cambia lo de arriba)
**La lección principal: una partida de verdad no se parece a los vídeos «de cine».**
1. **Se juega casi todo el tiempo desde arriba.** En los 28 minutos del asedio, 9 de cada 10 imágenes son de águila o
   de loma. Los hombres apenas se distinguen. Lo que llena la pantalla es **un bosque de estandartes** (rojos, morados,
   verdes, amarillos) clavado sobre manchas de tropa. Bajar a ras de suelo ocurre cada dos o tres minutos y dura segundos.
2. **El estandarte lo es todo.** Asta alta (sobresale por encima de los árboles y de las casas), pendón con el
   emblema del bando y debajo una casilla con el dibujo o el número de la unidad. A los que huyen se les pone blanco.
   Con sesenta unidades por bando amontonadas ante una muralla, **se sigue sabiendo quién es quién** solo por ellos.
3. **La unidad elegida lleva un aro amarillo bajo cada hombre.** No hay alfombra ni rectángulo. Las no elegidas, nada.
4. **Las órdenes son cintas en el suelo.** Amarilla y ancha de cada unidad a su destino (cuatro cohortes, cuatro
   cintas paralelas); **roja** hasta el enemigo al que se ataca; el destino se marca con la huella de la formación.
5. **La zambullida.** En el recorrido oficial la cámara baja de la vista de mando hasta quedar detrás de los hombros de
   una cohorte que corre **en unos cuatro segundos y sin cortes**; al llegar, la interfaz desaparece; luego vuelve a
   subir. Es el momento más fuerte del vídeo, y es **la misma escena**, no otra pantalla.
6. **La luz hace el trabajo.** En el bosque, manchas de sol y sombra de árboles y nubes: la cohorte al sol es roja
   viva y la que está a la sombra, casi negra. Bruma azulada al fondo. En el asedio, sol alto y **sombras largas de
   cada bloque y cada torre**, visibles incluso desde muy arriba.
7. **La salva de pila se ve**: rayas brillantes un segundo antes del choque. Las bolas de fuego dejan llamas en el suelo.
8. **De cerca, la melé es un montón**, no una línea limpia: espaldas, escudos girados, hombres encarados cada uno a un
   lado. Al correr, cada hombre lleva su zancada y el escudo le baila.
9. **El panel de la unidad** (leído en una imagen grande): nombre; hombres que quedan y los que eran, «53 (160)»;
   bajas causadas; y **cinco barras**: moral, ataque, defensa, carga y armadura. Debajo de las tarjetas, una fila de
   botones redondos (las habilidades). Arriba a la izquierda, **el consejero**: una cara y una línea de texto cuando
   pasa algo grave. Confirmado: **160 hombres por unidad**.
10. **El asedio real**: muchas torres avanzando a la vez, despacio, empujadas por su tropa; la masa se agolpa al pie;
    muralla de tierra y empalizada con poblado dentro; la lucha se desparrama por las calles. Acaba con una pantalla
    de marcador: las tarjetas de los dos ejércitos y columnas de cifras.
11. **Ritmo**: casi todo el tiempo es **maniobra** (acercar, rodear, esperar); los choques son cortos y deciden. Una
    batalla grande dura unos 25 minutos; la guiada de Teutoburgo, 10.

**Qué cambia en esta página**
- §2.1 se queda, con un matiz: la altura de hierba es **el premio**, no el sitio donde se juega. Lo que hay que clavar
  primero es la de águila: **CG8a es la tanda que más pesa**, y dentro de ella el estandarte, el aro y las cintas.
- §3: lo épico número 1 se confirma con nombre propio: **la zambullida** en cuatro segundos, sin cambiar de pantalla.
- §4.5: CG8c pasa a llamarse «La zambullida y el cine» y su primera pieza es esa bajada continua; **«Bajar» (CG6) debe
  usar el mismo movimiento de cámara**, no un corte.
- §4.2: nuestra alfombra roja o morada bajo el manípulo es justo lo que Rome II **no** hace.
- El panel de cinco barras encaja con las cuatro barras de la tarjeta de ES0 §6: se añade la de carga o se deja en
  cuatro; lo decide CG9.

## 3. Qué la hace épica y qué le da la jugabilidad

**Épica (lo que se ve y se siente)**, por orden de peso:
1. **El salto de escala**: en diez segundos pasas de ver alfombras de color a ver la cara de un hombre. Lo épico no es
   una de las alturas: es **poder cambiar** y que sea la misma batalla.
2. **Orden antes, caos después**: líneas perfectas al amanecer; diez minutos más tarde, polvo, huecos, cuerpos y
   estandartes caídos. El contraste se ve en el suelo.
3. **Luz de tarde, sombras largas y polvo**. Cuesta poco y cambia toda la imagen.
4. **Escudos y astas**: lo grande, lo pintado, lo que se solapa.
5. **Que se queden los muertos** y que la huida se vea (dan la espalda, corren, el estandarte cae).
6. **El sonido de la masa** y las voces al dar la orden.

**Jugabilidad (por qué engancha)**:
1. **Pocas piezas y decisiones grandes**: veinte bloques, no tres mil hombres. Una orden buena vale más que cien toques.
2. **La moral es el marcador**: no cuentas muertos, miras quién flaquea. Una carga por la espalda **se nota al instante**.
3. **Piedra, papel y tijera con tiempo**: lanza para al caballo, caballo caza al tirador, tirador desgasta al de la
   pica, espada gana la melé; y encima el cansancio obliga a guardar reserva.
4. **Dos fases**: colocar con calma y luego aguantar el plan cuando se tuerce. La pausa te deja pensar.
5. **Lectura de un vistazo**: estandarte, color de la barra, una palabra. Nunca hay que abrir un menú para saber cómo va.
6. **Final con veredicto y consecuencias** en la campaña.

**Lo que falla en Rome II** (para no copiarlo) [R]: las batallas acababan demasiado deprisa al salir; los puntos de
captura en campo abierto no gustaron y se quitaron; la interfaz es pequeña y densa (impensable a 390 px); el testudo
protegía poco. Y un aviso de un vídeo crítico: una fila real no se deshace en duelos sueltos; **aguanta junta**.

## 4. Cómo se traduce a AQVILA

### 4.1 Lo que ya hay (y vale)
- **El simulador por manípulos** (`js/simulador.js`, CG3): manípulos que se mueven, forman según su tropa, se cansan,
  cargan, flanquean, se contagian el miedo, rompen y huyen; tribunos que llevan lo que no tocas; pausa y velocidades.
  **Las reglas de Rome II del §1.4 ya están casi todas dentro.** Lo que falta es que **se vean**.
- **El mando en vivo** (CG4): tocar, arrastrar, formar, cargar, relevar, retroceder, pausa.
- **El soldado nuevo** de doce tropas, la luz y el campo de GM43e, y **bajar al hombro** (CG6, tanda 1).
- **Escala**: tope de 24 manípulos de 120 = **2.880 hombres por bando. Es el tamaño de un ejército de Rome II.** En
  número no estamos lejos; lo estamos en lo que enseña cada hombre.

### 4.2 Lo que falta, mirando nuestras capturas al lado de los fotogramas
| Rome II | AQVILA hoy (`CG4-5-choque-h.jpg`, `CG4-1-despliegue-h.jpg`, `CG6-2-hombro.jpg`) |
|---|---|
| Estandarte alto con icono por unidad | Una cajita con tres barras sobre cada manípulo; no dice qué tropa es |
| Selección por luz en los hombres | Alfombra roja o morada bajo el manípulo: parece un tablero |
| Hombres que llenan el bloque | Hombres pequeños y ralos sobre un campo vacío; se leen los rectángulos, no la tropa |
| Sol bajo, sombras largas, paleta por sitio | Campo pardo y plano, luz sin dirección clara desde arriba |
| El choque se ve: polvo, caídos, huecos | Los bloques se tocan y bajan números; apenas quedan cuerpos |
| Tres alturas y planos de cine | Una altura de mando y el hombro; nada entre medias, sin plano de apertura |
| Órdenes pintadas en el suelo | No se ve a dónde va cada manípulo |
| Estado en una palabra y color | Sí lo hay («firme», «agotada»): **esto ya está bien** |
| A pie: cielo, lomas, enemigo en línea | `CG6-2`: **es lo que más se parece ya**; faltan vecinos densos, hierba y polvo |

### 4.3 Qué cabe en un móvil (cifras)
| Cosa | Rome II (PC) | AQVILA hoy (medido) | Objetivo propuesto | Tope |
|---|---|---|---|---|
| Hombres por bando | ≈3.000 [M] | ≈500 a 570 figuras por bando (955 a 1.137 en total) | Hasta 2.880 **contados**; dibujados con detalle, los de cerca | 24 manípulos (ES0) |
| Triángulos por imagen | millones | 690.000 a 802.000 | Igual o menos, repartidos mejor | 1.100.000 (`arte.json`) |
| Llamadas de dibujo | cientos | 25 a 26 | Hasta 40 | Por medir en su móvil |
| Soldados con todo el detalle | cientos | hasta 40 de 14.000 triángulos | 40 (los del plano de cine y los de a pie) | 40 × 14.000 |
| Hombre lejano | varios escalones de detalle | figura completa siempre | **Tres escalones**: detalle (40), figura sencilla (unos 600), **cartón de dos triángulos** el resto (GM1: hasta 10.000) | Memoria 32 MB |
| Pantalla | 1920 px, ratón | 844×390 en horizontal, dedo | Batalla **solo en horizontal**; botones de 44 px | — |
| Unidades a la vez | 20 a 40 | 10 a 24 | 24 | ES0 |

- **Sin medir**: la fluidez real. Aquí solo hay pintado por software. Cada tanda de CG8 se prueba **en el móvil del
  usuario** antes de darla por buena.
- **Por qué «más gente» es barato con cartones**: a la altura de águila un hombre ocupa cuatro o cinco píxeles. Ahí
  un cartón de dos triángulos se ve igual que una figura de 4.500. Los triángulos se gastan donde está la cámara.

### 4.4 Lo que se dice y no se promete
- **No**: caras de cine, duelos casados hombre a hombre en toda la línea, miles de hombres con detalle a la vez,
  sombras de verdad proyectadas por cada soldado, lucha encima de la muralla y por las calles, batallas navales.
- **Sí**: que **de águila y de loma** parezca un ejército de verdad (bloques llenos, estandartes, sombras, polvo,
  rutas); que **a ras de hierba** haya un plano corto digno con 30 o 40 hombres buenos y masa detrás; que el choque
  **deje huella** (caídos, polvo, hueco, huida); que suene a multitud.
- **Arte**: todo sale de lo que ya hay (0 A.D., CC BY-SA 3.0, y el soldado nuevo). Variar escudos y túnicas es pintar
  variantes de texturas nuestras, no arte ajeno. Sin subir la descarga, salvo que el usuario lo decida.

### 4.5 Plan corto (reformula tareas que ya existen; ninguna línea nueva)
**Idea central**: las reglas ya están; lo que separa AQVILA de Rome II es **lo que se ve y cómo se lee**. Por eso
**CG8 pasa de ser la última a ir repartida en cuatro tandas**, cada una subida con jueces y probada en su móvil.

| Orden | Tarea | Qué se ve al acabar (y qué referencia iguala) | M declarado (esperable) | 1.0 |
|---|---|---|---|---|
| 0 | CG2, CG6 tanda 2, CG9 | Como están (ES0, CG1). No se tocan | — | Sí |
| 1 | **CG8a · El ejército se lee** | Estandarte de asta alta por manípulo con el emblema del bando y el icono de su tropa, que se rompe al flaquear y se pone blanco al huir (sustituye a la cajita); **aro bajo cada hombre** del manípulo elegido, sin alfombra; **cinta en el suelo** hasta el destino (amarilla) o hasta el enemigo (roja) y huella de la formación en el destino; bloques **llenos** con los tres escalones de detalle. Iguala: vídeo oficial de mandos y los planos de águila | 1,2 (2,0) | Sí |
| 2 | **CG8b · Luz, suelo y aire** | Sol bajo de lado y sombra larga de cada bloque; paleta por región (Italia verde, África ocre); hierba alta junto a la cámara; polvo de marcha y de choque; estela de pila, piedras y flechas. Iguala: los planos a contraluz y los de falange con sombras | 0,9 (1,5) | Sí |
| 3 | **CG5a · Despliegue** | Lo de ES0 §4, más dos ideas de aquí: **arrastrar para dibujar la línea** (el largo da el ancho) y **vuelo de cámara** sobre el campo al entrar | 0,8 (1,3) | Sí |
| 4 | **CG8c · La zambullida y el cine** | **Bajada continua de cuatro segundos** del mando al hombro de un manípulo, sin corte y quitando la interfaz al llegar (la misma que usa «Bajar» de CG6); botones «Águila», «Loma» y «De cerca» (salta al choque más caliente, a ras de hierba, sin interfaz); la cámara sigue al choque; temblor en la carga; plano corto automático de dos segundos cuando un manípulo rompe (se puede apagar); pantalla final con veredicto por grados. Comparte cámara con CG6 | 0,9 (1,5) | Sí |
| 5 | **CG4b · La campaña a la batalla nueva** | Lo de ES0, más: panel previo con **barra de fuerzas** y las tres salidas; el campo y la paleta salen del sitio del mapa; el veredicto vuelve a la campaña | 1,8 (2,5) | Sí |
| 6 | **CG8d · El choque deja huella** | Caídos que se quedan (cartones tumbados, con tope); la primera fila empuja y golpea en vez de tocarse; picas bajadas y escudos solapados en el frente; el que huye da la espalda y corre; voces al dar la orden y rugido de masa según la altura (audio libre de TP8b). **Sin** duelos casados | 1,7 (3,0) | Sí, la última; si no cabe, se recorta por aquí |
| 7 | **CG5b + CG7** | Como estaban (tribunos y plan; batalla rápida). CG7 usa la barra de fuerzas de CG4b | 0,7 + 0,6 | Sí |
| — | **CG6 tandas 3 y 4** (ya en CG6b) | A pie: los vecinos densos, la hierba y el polvo de CG8b y CG8d se ven también desde el hombro, porque es la misma escena | ya contado | Sí |

- **Suma de CG8**: 4,7 M declarados (esperable 8). Hoy CG8 estaba «por medir». Lo demás no sube más de 0,2 M.
- **En fila**, porque tocan los mismos archivos (`js/ui-mando.js`, `js/gfx/campo-mando.js`): una sesión cada vez.
- **Si no cabe**: sale primero CG8d (queda el polvo de CG8b como huella del choque), luego el plano corto automático
  de CG8c. Nunca CG8a ni CG8b: son las que más cambian la imagen por menos gasto.
- **Cada tanda** empieza eligiendo dos o tres fichas de `REF-batallas-referencias.md` §3 y acaba con un **lado a
  lado** de nuestra captura y lo que dice la ficha (criterio del usuario, REF §0).

### 4.6 Fuera de la 1.0 (apuntado en «Después de la 1.0»; ninguna se abre)
Asalto a la muralla completo (escalas, torres, ariete, adarve, calles, plaza) · refuerzos que entran por el borde ·
emboscadas y tropas ocultas en bosque (línea de visión) · tiempo y clima que cuentan · máquinas de tiro · duelos
casados · mini-mapa · repetición de la batalla y modo foto · arenga larga del general · sangre.

**Una duda que decide el usuario** (pidió el 19/11 llevar «el testudo ante la muralla» a la batalla grande): el asedio
entero no cabe en la 1.0. Cabe una versión corta dentro de CG8c/CG6: un **campo con muralla al fondo** en Escaramuzas,
donde el objetivo es llevar el testudo hasta la puerta bajo los proyectiles (≈1,5 M más). Recomendación: **después de
la 1.0**, salvo que él la prefiera a CG8d.

### 4.7 Historia (dictamen breve; skill `historia`)
- Todo lo de esta página es **aspecto y manejo**; no añade tropas ni hechos. Lo que ya estaba dictaminado sigue igual
  (CG1 §11, ES0 §9): manípulos y tres líneas, históricos; testudo en campo abierto, licencia de juego.
- **Ojo al copiar la imagen de Rome II**: muchos vídeos enseñan legionarios **imperiales** (armadura de placas, escudo
  rectangular curvo). En 280–146 a.C. el escudo es **ovalado** y se lleva cota de malla o pectoral (Polibio 6.23). El
  soldado nuevo ya lo respeta: se mantiene.
- **Estandartes**: el manípulo tenía su enseña (*signum*) y Polibio nombra a sus portaestandartes (6.24): histórico.
  El águila como enseña única de la legión es de Mario (Plinio, *Historia natural* 10.16), fuera de época: en AQVILA,
  enseña de manípulo, no águila. Que la enseña lleve un **icono del tipo de tropa** es licencia de juego (lectura).
- Citas de memoria; se comprueban al construir CG8a.

## 5. Fuentes

### 5.1 Vídeos (solo fotogramas públicos: portada y tres imágenes; ninguno visto en movimiento)
Enlace: `youtube.com/watch?v=` + el código.
| Código | Título (canal) | Qué se sacó |
|---|---|---|
| EVLm16oV2k8 | «How to Control Your Armies in Battle» (Total War Academy, oficial) | Estandartes que brillan al elegir, fila de tarjetas, línea de arrastre que da el ancho |
| 7VCd-JllIPA | «Basic Battle tactics tutorial… Guide #1» (perafilozof) | Disposición de la interfaz: panel, tarjetas, mini-mapa |
| xlQ5cOfLl5M | «2v2 Perfect Cavalry Charge» (Humanvegetable) | Altura de águila: estandartes rojos y azules, rutas y arcos de tiro en el suelo |
| _y9BmvJ37Ns | «Rome Vs Germanic Tribes, 10,000 Unit cinematic battle» (Bellum et Historia) | Fila oblicua de escudos, melé entre flores, arqueros en línea |
| C_GWi_O1iDc | «Legion vs Phalanx… 2nd Macedonian War» (Wolfman) | Masa a contraluz naranja con polvo; planos cortos |
| Nb87XbVikMs | «4000 Romans vs 6000 Celts, Siege of Alesia» (samesonite) | Contrapicado desde la hierba, estandarte contra cielo de tormenta, sangre |
| KBMOKoVgJJ0 | «Battle of Zama (202 BC)…» (Sandokan Battles) | Escudos todos distintos en una fila; silueta contra el sol |
| 50ak6-6scq4 | «ROME vs EGYPT (30K Men)» (SergiuHellDragoonHQ) | Decenas de bloques en rejilla con sus sombras; campo con caídos |
| 3ATuk0J-fGM | «PoV Pike Phalanx Combat» (aceblazer25) | Cámara dentro de la falange: astas en abanico, enemigo entre ellas |
| oimIMZHNRVI | «Charging a pike phalanx, HEAD ON!» (Mr Meowmers) | Muro de picas de lado; alfombra de caídos delante |
| mJWpjVqI2gM | «Battle of PYDNA 168 BC» (Bellum et Historia) | Picas en abanico sobre cielo azul; variedad de ropa |
| eGZVzc2Vqmo | «Macedonian Phalanx vs Roman Legion, Pydna» (Aditu Laudis) | Bloques de picas con sol bajo y sombras largas; mapa de la batalla |
| uBN_u8lwkeU | «100 ELEPHANTS vs 10.000 ROMAN LEGIONARIES» (Ciceronthebattlefield) | Elefantes con torre vistos desde detrás de la línea; hierba alta |
| SwLVS8zioIY | «TESTUDO UNDER ARCHERS AMBUSH» (SergiuHellDragoonHQ) | Testudo en columna desde arriba; montón de caídos |
| WmjHKq4uPUI | «500 PHALANX WALL vs 20K… BRIDGE» (SergiuHellDragoonHQ) | El paso estrecho: un puente decide; masa como alfombra |
| Ejn7LWnV5G8, sfEJlpgVGBs | Dos asedios (Pixelated Apollo) | Ejército formado ante la muralla, torres de asedio a contraluz, calles |
| Jf38wKE8UXI, ZdByF_5N8Hs | Consejos de asedio (FightMe) | Máquinas en fila, estelas de fuego, ciudad con estandartes |
| uIxNDCrXPc8, i5v6hPr6L7U | Tráilers de Teutoburgo y de Aníbal | Solo tono (bosque oscuro, barcos al atardecer); no son juego |

### 5.1 bis Partidas reales vistas enteras (segunda pasada)
| Dónde | Título | Qué se sacó |
|---|---|---|
| archive.org/details/youtube-lM_aYJbgA6M | «Total War Rome II Battle of Teutoburg Forest Walkthrough» (recorrido oficial narrado por Creative Assembly; 10:45) | La zambullida, cintas y aros, panel de cinco barras, luz del bosque, salva de pila, testudo desde arriba, consejero |
| archive.org/details/youtube-qjygv9S_d4I | «An All Out BRUTAL Sally Out!! 3v3 – Total War Rome2» (asedio en línea de un youtuber; 28:16) | Cómo se juega de verdad: 9 de cada 10 imágenes desde arriba, bosque de estandartes, torres de asedio, ritmo, marcador final |
| Steam (ficha del juego) | Tráiler oficial de Teutoburgo (1:22) | Solo tono; es cine, no partida |
- **Sin acabar**: la partida comentada de 42 minutos de Giant Bomb (archive.org/details/gb-2300-7974-ID5GPK3) se
  cortó al bajar y no se miró. Quedan en Internet Archive, sin mirar, un «let's play» de campaña y dos análisis en vídeo.
- **Cómo repetirlo** (para otra sesión): YouTube sigue cerrado, pero **Internet Archive guarda copias de vídeos de
  YouTube** y deja bajarlas. La red de la sesión necesita permiso para el servidor concreto al que redirige cada
  enlace (el usuario aprobó nueve el 19/11). Se bajan a la carpeta temporal, se miran con `ffmpeg` y se borran.

### 5.2 Texto
- **Leído**: wiki.totalwar.com: «Total War: Rome II – Teutoburg Forest», «Unit Spotlight (TWR2)», «Dev Diaries (TWR2)»
  (solo títulos), «Mastering Battles» (primer Rome), «Using Total War Gameplay Footage».
- **Resumen del buscador**: r2enc.totalwar.com (manual: páginas 0084 asedios, 0085 habilidades, 0087 moral, 0088
  cansancio, 0016 ataque); academy.totalwar.com; pcgamer.com (avance del motor y crítica); gamespot.com («Killing the
  Faceless Unit»); gamewatcher.com (cámaras; audio); thesixthaxis.com (entrevista al jefe de batallas);
  gamepressure.com (mecánicas); gamenguides.com (ataque y defensa); wiki.totalwar.com (parche 4: contagio de la huida).
- **De casa**: GM32, GM42, R22, R21, TP0 §3, TP8 (seis clips), CG1, ES0, GM1, partes de CG4 y CG6, `arte.json`.

### 5.3 Qué quedó sin ver
- **El sonido**: nada oído. Voces y música van de memoria. La animación fina de cada hombre, solo en cuatro ráfagas.
- El manual oficial y la prensa, enteros (red cortada: harían falta r2enc.totalwar.com, academy.totalwar.com,
  pcgamer.com, gamespot.com en la lista de la sesión).
- La serie técnica «Anatomy of the Total War Engine» (ya resumida en GM32).
- **Los vídeos concretos que el usuario tiene en la cabeza**: se piden en §6.

## 6. Conversación con el usuario
- **19/11, tras la primera pasada** (literal): «Buscate Gameplays de youtubers y mirate varios, esas fotos no me
  sirven, tienes que ver combates de verdad». → Hecha la segunda pasada (§2 bis). Lectura del director: tenía razón;
  las portadas enseñan el cine y esconden cómo se juega.
- **Pendiente de su respuesta** (apuntado en la bitácora): (1) ¿vale el orden de las cuatro tandas de CG8, con la
  lectura desde arriba primero?; (2) el asedio entero, ¿después de la 1.0 (recomendado) o una versión corta ahora?;
  (3) ¿sube dos o tres clips suyos, sobre todo con **sonido**, que es lo único que sigue sin verse ni oírse?
- **Nada de §4.5 entra al tablero hasta que él lo apruebe.**
