# Corazón · Objetivo final de Escaramuzas (ES0, 19/11/2026)

**Qué es esta página.** El detalle de la línea **L12** (Escaramuzas) y de lo que arrastra en **L10** (batalla) y **L17**
(formaciones). Amplía `CG1-objetivo-batalla.md` §4 y §8 y lo sustituye donde choquen. Conversada con el usuario el
19/11 (once respuestas suyas, §2). Solo la cambia él. **No abre líneas nuevas: reformula CG2, CG9, CG5, CG4b y CG7 (§8).**

## 1. El objetivo, en una frase
Escaramuzas es **el escaparate del simulador de batallas**: con un dinero compras el ejército del pueblo que quieras,
tropa a tropa, viendo su dibujo y sus datos; lo despliegas como en un Total War y lo mandas en la batalla nueva.

**Para qué sirve en el juego**
- **Modo con gracia propia**: una batalla a tu medida en dos minutos de menú, sin campaña.
- **Banco de pruebas de la campaña**: mismas tropas, mismos datos y misma batalla. Lo que aprendes aquí vale allí; la
  ficha de tropa es la misma que al reclutar en la ciudad.
- **Camino de las armas**: no da victoria por sí sola (no toca la partida guardada); enseña a ganarlo.
- **Qué te hace volver**: seis pueblos que luchan distinto, tres bolsas de dinero, veteranía, tus ejércitos guardados
  (hasta 5) y montar tú al rival para una prueba concreta («mi testudo contra solo honderos»).

## 2. Sus palabras y sus decisiones (19/11)
Quejas (08:34): menú «una mierda»; «crear el ejército y elegir yo las tropas y luego ponerlas en la batalla como yo
quiera»; «la vida de los soldados… es una cuenta atrás»; «rehacer de 0 la salud, y todos los stats»; «todo ocupa la
pantalla de cosas que no puedes ni interactuar»; «un scroll de móvil básico, sin diseño propio».

| Pregunta | Decidió |
|---|---|
| Para qué sirve | Batalla a tu medida + batallas famosas, «+ crear el motor gráfico, de jugabilidad y batalla para evolucionar esa parte del juego en un verdadero simulador de batallas antiguas como los juegos de la saga total war» |
| Vida | Por manípulo, con heridos. «Los manípulos deben ser al menos de 80-120 unidades» (lo son: 120, y 60 los triarios) |
| Despliegue | «Como en los juegos de total war. Antes de comenzar… puedes seleccionar las unidades donde quieras con sus formaciones… y cuando inicia la batalla según esa formación inicial avanza aunque puedes cambiarla en cualquier momento» |
| Dinero | Las dos cosas: tres bolsas con dificultad, y «A mi gusto» con el dinero de cada bando |
| Pueblo | Cualquier pueblo, solo sus tropas |
| Rival | Lo monta la máquina y lo puedes retocar |
| Pantalla (bocetos) | «Sí, está mejor… pero puedes hacerlo mejor, meter mejor las stats y hacerlo un sistema más completo para poder crear el simulador bien y tener batallas más reales» |
| Apartados sueltos | Se quedan como «Pruebas rápidas» |
| Datos | 12 datos «y también veteranía» |
| Batallas famosas | Primero «todo en la 1.0»; al ver el precio: «Mejor después de la 1.0» |
| Heridos | «El que pierda, los heridos se convierten en esclavos y entran como recurso del juego y los que ganan recuperan a los que puedan… algún edificio sanitario… que en cada pase de turno… tarden más o menos en recuperarse cuando el ejército está en una ciudad». En la 1.0: esclavos y cura por turnos; el edificio, después |

Lectura del director (no es literal): «un verdadero simulador como Total War» es ya el objetivo de L10 (CG1) y la tarea
CG8 (batalla épica). No se abre nada nuevo; Escaramuzas es donde se enseña.

## 3. Qué se queda y qué se tira
**Se queda**: la batalla nueva por manípulos (CG4: tocar, arrastrar, formar, cargar, relevar, pausa); el simulador
(`js/simulador.js`) con moral, cansancio, flanqueo, carga y formaciones; el soldado nuevo de las 12 tropas a pie; los
cuatro campos (llano, colina, bosque, mixto); las escenas «Testudo a pie» y «Falange a pie», que pasan a un rincón
llamado **Pruebas rápidas**; el papiro y los sellos de los demás menús.
**Se tira**: el menú de hoy entero (`capturas-tarea/MR3b-5-escaramuzas.jpg`); los tres tamaños fijos de ejército y la
tabla de «ajuste» por pueblo; que tú seas siempre Roma; la vida como un número de hombres que baja; el despliegue fijo.

## 4. El constructor de ejército
- **Cuatro pasos**, siempre a la vista arriba y tocables en cualquier orden: **1 Bandos** (tu pueblo, el rival, la
  bolsa, la dificultad) · **2 Tu ejército** · **3 Rival** · **4 Campo** (terreno y «Al despliegue»).
- **Pueblos**: Roma, Cartago, Epiro, Macedonia, galos e íberos. Cada uno compra solo sus tropas y los mercenarios que
  tuvo de verdad (§9). Sin mezcla libre.
- **Se compra por manípulos** (120 hombres; 60 los triarios; un grupo de elefantes; una turma de caballería). Tope: 24
  por bando, para que el móvil vaya fluido.
- **Bolsas**: pequeña, mediana y grande (provisional: 5.000, 10.000 y 15.000 denarios; las fija CG9 al medir).
- **Dificultad = dinero del rival**: Fácil, un 20 % menos que tú; Normal, lo mismo; Difícil, un 25 % más. **«A mi
  gusto»** abre dos deslizadores, tu dinero y el suyo, y entonces no hay etiqueta de dificultad.
- **El precio lo pone la prueba, no el gusto**: el coste de cada tropa sale de miles de batallas del bot (tanto de
  una tropa contra tanto de otra, hasta que gana la mitad). Así «Normal» es pareja con cualquier pueblo y se tira la
  tabla de ajuste de hoy.
- **Veteranía**: novatos, curtidos (lo normal) y veteranos. Se elige por manípulo; el veterano cuesta más y sube
  acierto, defensa y moral; no sube vida ni armadura (el hierro es el mismo).
- **Rival**: la máquina compra un ejército típico de su pueblo con su dinero. Lo ves en el paso 3; «Cambiar» te deja
  montarlo tropa a tropa.
- **Guardar**: hasta 5 ejércitos tuyos con nombre («Guardar este ejército», «Mis ejércitos»). Botón «Ejército típico»
  para rellenar de un toque. Se guardan aparte de la partida (`aqvila-ejercitos-v1`).
- **Despliegue, como en un Total War** (es la primera pieza de CG5): ves el campo desde arriba y tu zona marcada.
  Tocas un manípulo y lo arrastras; con dos dedos lo giras; «Formar…» le da su forma; «Varios» mueve un grupo. Tres
  plantillas de un toque: tres líneas romanas, línea única, alas fuertes. Del rival solo ves dónde está, no qué es.
  «Al combate» empieza; todo avanza desde como lo dejaste y lo cambias cuando quieras.

## 5. Vida y datos
**Decidido: opción A, vida por manípulo con heridos.** La B (cada soldado con su vida) queda descartada.
- **Por qué A**: de lejos la B no se ve distinta; obliga a calcular unos 3.500 hombres en vez de unos 50 manípulos en
  cada paso; y el equilibrio se hace con miles de batallas del bot, que con la B irían decenas de veces más lentas.
  **Sin medir en cifras**: es una estimación por el número de piezas, no una prueba.
- **Cómo es un manípulo**: sanos, heridos y muertos. Barra de tres colores. Un herido no lucha.
- **Cómo se pelea**: solo luchan los de delante. Cada golpe acierta o no (acierto contra defensa; el escudo ayuda de
  frente y contra el tiro, no por el flanco ni la espalda). Si acierta, la armadura para una parte del daño; lo que
  **perfora** no lo para. El daño que pasa gasta vida; un hombre sin vida cae, herido o muerto según lo fuerte del golpe.
- **Los 12 datos de cada tropa** (por tipo y por pueblo, en archivo propio `js/tropas.js`):
  pegar: **acierto, daño, perfora, carga** · aguantar: **vida, armadura, escudo, defensa** · durar: **moral,
  resistencia, velocidad** · **tiro** (alcance, daño, munición). Más bonos con nombre: «contra caballería», «contra
  elefantes». En la tarjeta, 4 barras (ataque, armadura, vida, moral); en la ficha, los 12 con número.
- **Al acabar**: el que gana el campo recoge a sus heridos; los del que pierde quedan prisioneros. En Escaramuzas se ve
  en el resumen (sanos, heridos recuperados, muertos, prisioneros). **En la campaña (1.0, dentro de CG4b)**: los
  heridos del vencido pasan a **esclavos** de tu ciudad más cercana o se venden (ya existen la clase y los
  prisioneros); los tuyos vuelven a filas **turno a turno** mientras el ejército descansa en una ciudad, más despacio
  cuantas más bajas tuvo. El **edificio sanitario** va después de la 1.0.

## 6. La pantalla (390 px)
Bocetos: `capturas-tarea/ES0-boceto-a.jpg` (comprar) y `ES0-boceto-b.jpg` (ficha). El usuario: va por ahí, con más datos.
- **Vertical**: título; franja de los dos bandos con su dinero; los cuatro pasos; filtro (todas, infantería, tiro,
  caballería); tarjetas de dos en dos con el **dibujo real del soldado**, hombres y arma, lo que sabe hacer, 4 barras,
  precio y botones − y + de 44 px. **Abajo, fijo**: tu ejército en fichas pequeñas (tocar una la quita), el dinero que
  queda y el botón del paso siguiente.
- **Ficha** (tocar la tarjeta): dibujo grande, los 12 datos, veteranía (tres botones), habilidades, «Lleva…» con su
  fuente, «Bueno contra / Flojo contra», y «Añadir manípulo».
- **Horizontal**: dos columnas; a la izquierda las tarjetas, a la derecha tu ejército y el dinero, siempre a la vista.
- **Reglas**: todo lo que se ve se toca; nada tapa la pantalla; solo desliza la rejilla de tarjetas; papiro, sellos y
  letra de los demás menús (L13). «Pruebas rápidas» es un botón pequeño en el paso 1.

## 7. Fuera de la 1.0 (a «Después de la 1.0» de la bitácora)
Batallas famosas ya montadas (Heraclea, Cannas, Zama), retos y medallas, edificio sanitario, mezcla libre de pueblos.

## 8. Plan (reformula tareas que ya existen; ninguna línea nueva)
| Orden | Tarea | Qué se ve al acabar | M | Toca |
|---|---|---|---|---|
| 1 | **CG2 Constructor de ejército** | Menú nuevo de cuatro pasos, seis pueblos, bolsas y «A mi gusto», rival retocable, fichas, ejércitos guardados, Pruebas rápidas | 1,5 | `js/ui-escaramuza.js` (nuevo), `js/ui.js` (solo el enganche), `css/` |
| 2 | **CG9 Vida, 12 datos y veteranía** | Barra de tres colores, golpes con armadura, datos por tropa y pueblo, precios medidos con el bot | 2,0 (esperable 4 a 6) | `js/tropas.js` (nuevo), `js/simulador.js` |
| 3 | **CG5a Despliegue** (primera pieza de CG5) | Colocas, giras y formas antes de «Al combate»; tres plantillas | 0,8 | `js/ui-mando.js`, `js/simulador.js` (poco) |
| 4 | **CG4b La campaña a la batalla nueva** + heridos | Lo de antes, y además esclavos del vencido y cura por turnos en ciudad | 1,5 → 1,8 | `js/game.js`, `js/ui-guerra.js` |
| 5 | **CG5b Tribunos y plan** (resto de CG5) y **CG7** | Como estaban; CG7 pierde las escenas a pie (ya están en CG2) | 0,7 + 0,6 | `js/ui-mando.js`, `js/ui.js` |

- **En paralelo sin chocar**: CG2 puede ir **ya**, a la vez que CG6 (que tiene `js/simulador.js` y la pantalla de
  batalla), porque vive en un archivo nuevo y lee los datos de una tabla. Empieza con los datos de hoy (`js/data.js`) y
  CG9 le cambia la tabla sin tocar el menú. En `js/ui.js` solo cabe una sesión a la vez: CG2 va tras CE3c.
- **En fila**: CG9 tras CG6 (mismo archivo). CG5a tras CG6 y CG9. CG4b tras CG9. CG8 (épica) sigue detrás de CG6.
- **Cifra honrada**: CG2 pasa de 1,3 a 1,5; CG4b de 1,5 a 1,8; CG9 igual, con veteranía dentro; CG5 y CG7 no suben
  (se reparten). **Suma: unos 0,5 M más** que lo ya apuntado. **Si no cabe**, salen primero los ejércitos guardados y
  luego «A mi gusto»; nunca comprar tropas, la vida con heridos ni el despliegue.

## 9. Historia (dictamen: APTO CON NOTAS)
**Tropas y equipo por pueblo** (lo que saldrá en «Lleva…»; cada dato con su fuente):
- **Roma**: vélites con jabalinas, espada y escudo redondo, sin armadura; hastati y príncipes con escudo largo, espada
  hispana, dos pila, casco de bronce y pectoral, cota de malla los más ricos; triarios con lanza en vez de pila
  (Polibio 6.22–23). Caballería armada a la griega (Polibio 6.25). Histórico.
- **Cartago**: libios rearmados con armas romanas tomadas en Trebia y Trasimeno; íberos de túnica blanca con ribete
  púrpura y espada de punta y tajo; galos desnudos de cintura arriba con espada larga de tajo (Polibio 3.87, 3.114).
  Honderos baleares (Diodoro 5.18). Jinetes númidas, ligeros y con jabalinas (Polibio 3.72; Livio 35.11). Elefantes
  (Polibio 15.11–12). Histórico. El **Batallón Sagrado** es del siglo IV (Diodoro 16.80, 20.10): en 280–146 es
  **licencia de juego**.
- **Epiro y Macedonia**: falange de picas de 16 filas (Polibio 18.29–30); caballería tesalia y elefantes de Pirro
  (Plutarco, *Pirro* 16–17, 21). Histórico.
- **Galos**: espadas largas que se doblan, escudo largo, los gesatos desnudos (Polibio 2.28–33). Histórico.
- **Íberos**: escudo pequeño redondo o largo, espada corta, jabalina toda de hierro (Diodoro 5.33–34; Estrabón 3.4.15).
  Histórico.
- **Heridos y prisioneros**: vender o esclavizar a los vencidos era lo normal (Livio 22.58–61, los de Cannas sin
  rescatar; Polibio 30.15 y Livio 45.34, Epiro en 167). Histórico. Que el vencedor recupere a los suyos: probable
  (lectura del director). **Hospitales fijos no hay en esta época**: los *valetudinaria* son del Imperio; los heridos
  se alojaban en casas (Livio 2.47). Por eso el edificio sanitario, cuando llegue, será **licencia de juego**.
- **Licencia de juego**: todos los números (los 12 datos, precios, bolsas); comprar un ejército con dinero; los tres
  grados de veteranía comprables (lo histórico es la edad: hastati jóvenes, triarios veteranos, Polibio 6.21); el
  testudo en campo abierto (TP0 §11); la cura por turnos con cifras.
- **Pendiente del ministerio**: las citas están puestas de memoria por el director; CG9 las comprueba pasaje a pasaje
  y pasa `node gobierno/fichas.mjs` antes de que salgan en pantalla.

**ALCANCE CONGELADO.**
