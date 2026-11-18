# Corazón · Objetivo final de la guerra: un simulador de batallas propio (CG1, 18/11/2026)

**Qué es esta página.** El detalle del órgano «Corazón» de `gobierno/OBJETIVOS.md` para las líneas **L10** (batalla),
**L11** (testudo a pie) y **L17** (formaciones). Amplía `TP0-objetivo-testudo-y-lucha.md` (las dos alturas siguen) y
lo sustituye donde choquen. Cerrada con el usuario el 18/11. Solo la cambia él. **Una decisión, un plan (§10).**

## 1. El objetivo, en una frase
Un **simulador de batallas en tiempo real**, propio, que sirve igual para la campaña y para Escaramuzas: lo planeas, lo
mandas en vivo (tú o tus tribunos, hasta un solo manípulo cada vez) y, cuando quieres, bajas a luchar desde el hombro
de un soldado. Si no quieres una batalla larga, la juegas como **minijuego** corto.

## 2. Sus palabras (18/11)
- «Las batallas… son una mierda… las Escaramuzas… una basura. Hay que rehacerlo todo. Y usamos de base el movimiento y
  lo que hemos creado de testudo y lo que estamos creando de tipo de tropa».
- «tenga la parte previa del combate, que se pueda saltar… para ver cómo irá la batalla, y luego jugarla en vivo con una
  estrategia previa y delegar las tropas a los tribunos… entrenados en jugar a estrategia bien».
- «que el testudo solo sea algo de muchas cosas que puedo hacer, como moverme, luchar, habilidades… en primera persona,
  que realmente es visión desde el hombro, y hacerlo así de realista».
- Al ver la lectura de Claude: «No, no quiero una sola batalla. Quiero crear un simulador de batallas propio que valga
  para campaña, escaramuzas, poder incluso controlar un manípulo a la vez», «en el menú [de Escaramuzas] poder elegir las
  tropas… ver cada tropa lo que cuesta, sus stats… y la vea dibujada y ahí sepa si puede tener en su forma de luchar
  testudo o picas», «evolucionar las batallas a tener un simulador de guerra en tiempo real», «minijuegos… de los
  concursos para cuando no quiero jugar una batalla simulada larga y no quiero resolverla ni rendirme». «Me gusta tu
  plan… incluye también esta idea y haz una síntesis final».

## 3. Qué hay hoy y por qué falla
Cuatro pantallas de guerra que no se parecen (maniobra en el mapa, batalla de la campaña, Escaramuzas, testudo a pie;
`capturas-tarea/GM44c-4`, `ES1-5`, `TP1-h-10`). El motor de hoy (`js/guerra.js`) son **tres bloques fijos** (alas y
centro) y cuatro botones: miras chocar muñecos y no mueves nada. No hay plan, ni tropas que elegir con sus datos, ni
forma de entrar a pie en una batalla de verdad. Lo único que el usuario salva es el movimiento, el testudo y el soldado
nuevo. (No contestó a la pregunta de qué falla: su respuesta fue rehacerlo como simulador; se toma así.)

## 4. Elegir el ejército (Escaramuzas, y reclutar en la campaña)
Una **ficha por tropa**, con su **dibujo** (el soldado nuevo, en retrato), su **coste** (denarios, hierro, hombres), sus
**datos** en barras (ataque, defensa, moral, velocidad, aguante) y **lo que sabe hacer**: testudo, picas, muro de
escudos, cuña, orden abierto, pilum. Eliges con un tope de denarios. La misma ficha se ve al reclutar en la ciudad.

## 5. La batalla, en tres tiempos
1. **Plan previo (se salta con un botón «Al combate»).** Ves el campo desde arriba. Colocas tus manípulos (o dejas el
   despliegue romano clásico en tres líneas), repartes las alas entre tus tribunos y les das su orden. Un toque en
   «Ver cómo irá» enseña la **vista previa del concurso «Fantasmas»** (K2): sombras doradas de dónde estará cada tropa a
   10, 20 y 30 s y dónde chocará, con el aviso honrado «el enemigo puede moverse».
2. **Mando en vivo.** Todo se mueve a la vez. Tocas uno o varios manípulos y arrastras para moverlos; botones para
   formar (testudo, cuña…), cargar, relevar o retirarse. Puedes **pausar** para dar órdenes. Lo que no tocas lo llevan
   tus **tribunos**.
3. **A pie, desde el hombro.** Tocas un manípulo propio y «Bajar». Eres su centurión; la cámara va detrás de tu hombro.
   El resto de la batalla sigue y se ve a tus lados, porque es la misma batalla. Botón «Mando» para volver arriba.

## 6. Los tribunos
- Tres por ejército, uno por ala (los de la maniobra: Quinto Fabio, prudente; Marco Claudio, agresivo; Cayo Lelio, astuto).
- **Qué les ordenas**: una orden de plan por ala (aguantar, avanzar, envolver el flanco, guardar la reserva) y cuándo
  (al empezar, si el enemigo rompe, si os cargan).
- **Qué los hace buenos**: saben cerrar huecos, relevar la línea cansada, proteger el flanco y no perseguir a lo loco.
  Su **carácter** cambia cómo lo hacen (el agresivo carga antes). Un tribuno **veterano** (gana experiencia en cada
  batalla de la campaña) reacciona antes y se equivoca menos.
- **Cuánto se fían**: si tocas un manípulo, es tuyo hasta que lo devuelvas («Devolver al tribuno»).

## 7. A pie: controles en el móvil (horizontal)
- **Pulgar izquierdo**: palanca para moverte. Tu manípulo te sigue en formación: el centurión va delante.
- **Pulgar derecho**: arrastrar mueve la cámara; botones **Golpear**, **Parar** (mantener), **Empujar** y **Pilum**
  (mantener y soltar).
- **Órdenes al manípulo** (una fila arriba a la derecha): **Testudo**, Relevo, Cargad, Formar. Lo que sepa la tropa:
  una falange tiene «Picas abajo»; un hoplita, «Muro». El testudo es una habilidad más.
- **Si caes**, pasas a otro hombre de tu manípulo; si cae entero o rompe, vuelves al mando.
- Arriba, siempre: el objetivo y el estado del manípulo en palabras (TP0 §6).

## 8. Minijuegos: la batalla corta
Al empezar una batalla eliges: **Jugar en vivo** · **Batalla rápida** · **Resolver**. «Batalla rápida» es un minijuego
de pocos minutos que decide la misma batalla, con el mismo simulador por debajo: **planeas y miras en tres rondas** de
20 s (la idea de N1 y del concurso «Fantasmas»). En Escaramuzas quedan además, como minijuegos sueltos, las **escenas a
pie** (testudo y falange de picas). La maniobra en el mapa pasa a ser opcional en la campaña («Maniobrar antes»).

## 9. Qué se reutiliza y qué se tira
**Se queda**: el soldado nuevo y sus tropas (GM44), las piezas de la escena a pie (movimiento, acciones, cámara,
formación, enemigo: `maquetas/a-pie/`, TP1b), la falange (TP7a), la luz y el campo de GM43e, el motor de la maniobra
(`js/maniobra.js`) y sus tribunos, las reglas de moral, cansancio, carga y flanqueo de `js/guerra.js`.
**Se tira**: los tres bloques fijos y los cuatro botones de la batalla de hoy, la pantalla de batalla de `js/ui-guerra.js`
tal como es, y el «Testudo a pie» como modo aparte (pasa a minijuego). La batalla vieja vive hasta que la nueva la sustituye.

## 10. Plan cerrado (el juego sigue jugable en cada paso)
| # | Tarea | Qué se ve al acabar | M |
|---|---|---|---|
| 1 | **CG2 Fichas de tropa** | En Escaramuzas eliges tropas con dibujo, coste, datos y lo que saben hacer | 0,8 |
| 2 | **CG3 Simulador** (solo lógica, Node) | Batallas de manípulos que se mueven, forman, se cansan y rompen; pruebas | 2,5 |
| 3 | **CG4 Mando en vivo** | Escaramuzas y campaña usan el simulador: mueves manípulos, pausa, mismo aspecto | 2,5 |
| 4 | **CG5 Tribunos y plan previo** | Repartes alas, das su orden, «Ver cómo irá», «Al combate» | 1,5 |
| 5 | **CG6 A pie desde el hombro** | «Bajar» a un manípulo de la batalla, luchar, habilidades, caer y seguir, «Mando» | 2,5 |
| 6 | **CG7 Batalla rápida y minijuegos** | Jugar en vivo, Batalla rápida o Resolver; escenas a pie en Escaramuzas | 0,8 |
| | **Total** | | **10,6** |

Orden: CG2 tras CE2 (toca `ui.js`). CG3 a la vez que GM44 (archivo nuevo). CG4 tras GM44 y GC10. CG6 tras TP1b y TP7a.
**Absorbe** (salen del tablero, ≈ 8 M que ya estaban en la 1.0): UB1, UB2 (=TP2), UB3, GM43g (=TP3), TP4, TP7, GM43l.
**Siguen tal cual**: GM44, TP1b, TP7a, GC10 (en obra; son la base), GM43i (sonido) y GM43j (caras, detrás de GM44).
**Cifra honrada**: la 1.0 sumaba unos 25 M; esto añade 10,6 y libera unos 8: queda en **≈ 28 M**, y una semana más
de obra. **Si no cabe**, se saca primero el veterano de los tribunos y luego la vista previa «Ver cómo irá» (se queda
«Al combate»); nunca el simulador ni el bajar a pie.

## 11. Historia (dictamen)
Manípulo de 120 hombres (60 los triarios) y orden en tres líneas, hastati, principes y triarios: histórico (Polibio
6.21–24). Relevo de líneas: histórico en lo general (Livio 8.8). Seis tribunos militares por legión: histórico (Polibio
6.19, 6.34); que cada uno mande un ala en batalla es **licencia de juego** (Polibio no lo cuenta así; en batalla mandaba
el cónsul). Testudo en campo abierto: licencia de juego (TP0 §11). Falange de picas: histórica (Polibio 18.29–30).
Experiencia de los tribunos: licencia de juego.

## 12. Fuera
Batallas navales a pie, asedios a pie, caballería a pie, cámara libre por el campo, multijugador.

**ALCANCE CONGELADO.**
