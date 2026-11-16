# GM15 · Terreno, hora del día y maniobra al empezar (diseño corto, 16/11/2026)

Solo diseño: ni código ni maqueta. Nada pasa a construirse hasta que contestes las dudas del final.
Lo que pediste, con tus palabras: «si en una batalla entre ejércitos se hace cuando están andando por el mapa y se chocan
o se luchan entre ellos como en el Rome 2 Total War, poder elegir día, noche, niebla o que aparezcan aleatorias, y aparte
cuando empiece la batalla y haya tocado cerca de un río o lo que sea, si no es una emboscada, puedas maniobrar a llevar
al ejército al otro lado del río antes de que se acerque el ejército enemigo».
Ya decidido por ti y respetado aquí: batalla de hasta 4 minutos; jinetes con el botón Caballería; mover con el dedo
(GM10) después del motor único; ejércitos sin tope; vertical y horizontal; una mano.

## 0. Lo que decidiste (16/11, tras leerlo)
1. **Maniobra**: variante C, **solo escenario**. No hay fase de 20 s ni botones; los apartados 2 (paso 4) y 4 quedan como descartados.
   La orilla o la loma es de quien ya esperaba allí en el mapa.
2. **Hora y niebla**: eliges la hora si llevas la iniciativa; la niebla, cuando el sitio y la estación la dan.
3. **Toparse**: al cruzarse en el camino y con «Salir al encuentro».
4. **Río y nadie cruza**: no hay batalla; cada uno vuelve.
5. **Emboscada**, con tus palabras: ocurre «si antes de que un ejército pase cerca tuya el tuyo está escondido», y eso es
   «en el mapa grande general, no durante la batalla»; durante la batalla «solo puedes esconder tropas en las arboladas o
   en campos de trigo grandes». El trigal es un rasgo nuevo (esconde como el bosque; su regla está por escribir).
6. **Noche**: solo en emboscadas.
7. **Maqueta**: después del motor único (GM11).
**Queda por concretar** al hacer la maqueta: cómo se esconde un ejército en el mapa y cómo se esconden tropas en la batalla sin despliegue.

**Lo que he mirado**: los estudios GM6b (decisión 6 y apartado 3.A), R22, GM7 y R6; la bitácora; y, solo leyendo, cómo
marchan los ejércitos en `js/game.js` y `js/data.js`. **Lo que no**: no he abierto Rome II ni ninguna guía hoy (todo lo
suyo va de memoria); no he probado nada en un móvil; ninguna cita antigua está cotejada con el texto.

## 1. Qué hace Rome II (solo ideas, de memoria)
1. **El campo sale del sitio.** Donde se tocan dos ejércitos en el mapa de campaña, ahí se lucha: si hay río, hay río;
   si hay bosque o cuesta, también. No se elige campo en un menú. *(De memoria; R22 lo vio en fotogramas.)*
2. **Hora y tiempo.** Antes de empezar se ve el tiempo que hace, y quien ataca puede **esperar** a que cambie, pocas
   veces. La batalla de noche no es libre: la da una habilidad del general. Lluvia y niebla acortan el tiro y la vista.
   *(De memoria y sin comprobar: no estoy seguro de cuántas esperas deja ni de los números.)*
3. **Despliegue y luego marcha.** Cada bando coloca sus tropas en su zona, sin reloj, y los ejércitos empiezan lejos:
   el primer minuto es andar y tomar posición (la loma, la orilla). *(De memoria.)*
4. **Río.** Si el encuentro es en un paso de río, el campo trae vados o puente; quien espera en la orilla lleva ventaja
   y quien cruza llega lento y apretado. *(De memoria; el vado bajo proyectiles está en los fotogramas de R22.)*
5. **Emboscada.** Un ejército puede apostarse en el mapa. Si el otro no lo descubre, la batalla empieza con el
   emboscado **en columna de marcha, sin despliegue y rodeado**. *(De memoria.)*
6. **No mirado**: cómo decide exactamente el tipo de campo, la probabilidad de descubrir una emboscada, los números del
   tiempo. No hacen falta: los nuestros se ponen probando.

**Por qué funciona**: el jugador siente que la batalla es consecuencia de por dónde movió al ejército, y el primer
minuto tiene una decisión clara (¿tomo la loma?, ¿cruzo?). **Lo que no nos cabe**: veinte piezas que colocar, un
despliegue sin reloj y veinte minutos.

## 2. Cómo lo ve el jugador, paso a paso
1. **En el mapa.** Tu ejército va por un camino y uno enemigo viene por el mismo. Los dos estandartes se paran donde
   se encuentran y sale un cartel: «**Se topan junto al río Volturno**» (el nombre del sitio, de verdad).
2. **El cartel** (una pantalla, 390 px): dibujo pequeño del sitio (río con vado), las fuerzas de cada uno, y una línea
   de hora: **Amanecer con niebla · Mediodía · Noche · Lo que venga**. Dos botones: **Dar batalla** y **Retirarse**.
3. **Se abre el campo.** Cámara alta. Se ve el rasgo (el río cruza el campo) y el enemigo lejos, todavía en columna.
4. **Maniobra (unos 20 s).** Abajo, donde irán luego las órdenes, hay dos o tres botones grandes con la pregunta del
   sitio: «**Cruzar ya**», «**Esperar en la orilla**». Encima, dos barritas: «Tú cruzas en 16 s · ellos llegan en 22 s».
   Tocas uno y los tres cuerpos van solos. Puedes cambiar de idea, pero pierdes el tiempo andado.
5. **Acercarse (los 40 s de GM7).** Los botones pasan a ser Avanzar, Escudos, Testudo y Caballería. Proyectiles.
6. **Choque.** Como hoy. Si te pillaron a medio cruzar, tus cuerpos llegan desordenados y se nota en el cartel de cada uno.

En llano no hay pregunta: se salta el paso 4 y la batalla empieza como en GM7. En emboscada tampoco (apartado 5).

## 3. Rasgos, hora y reglas (números orientativos, para afinar con la prueba)
Un solo rasgo por batalla. Todo en la escala de GM7 (las líneas salen a 150 m).

| Rasgo | Qué se ve | Regla | Pregunta de la maniobra |
|---|---|---|---|
| **Llano** | Campo abierto, el doble de ancho | Ninguna. Los jinetes rodean sin estorbo | No hay |
| **Loma** | Cuesta muy suave (4 a 6 m de alto) a un lado o al centro | Arriba: tiro +20 % de alcance, carga cuesta abajo +15 %. Subir: medio paso y +25 % de cansancio | «Subir a la loma» / «Quedarse abajo» |
| **Bosque** | Mancha de árboles en un ala | Esconde a los jinetes hasta 40 m. Dentro: carga a caballo −50 %, proyectiles −50 %, la falange se desordena. El ala apoyada en él no se rodea | «Esconder los jinetes» / «Apoyar el ala» / «Campo abierto» |
| **Río con vado** | Franja de agua con uno o dos vados, cada uno del ancho de un cuerpo | Cruzar: 10 s a medio paso; llega **desordenado** (−25 % de empuje 15 s), sin descarga de pila, y recibe +25 % de bajas por proyectil. Fuera del vado no se pasa | «Cruzar ya» / «Esperar en la orilla» |

| Hora | Qué se ve | Regla |
|---|---|---|
| **Día** | Como hoy | Ninguna |
| **Noche** | Tinte azul oscuro, antorchas; los estandartes siguen claros | Se ve a 60 m (más lejos, el enemigo sale como «?»). Tiro −40 % de alcance. El pánico se contagia el doble. No hay persecución |
| **Niebla** | Velo gris, el fondo se pierde | Se ve a 40 m. Tiro −50 % de alcance. Los jinetes de los dos llegan sin ser vistos. Se levanta sola a los 90 s |

El enemigo sufre lo mismo. La noche y la niebla quitan valor a honderos y arqueros y se lo dan al choque y a la sorpresa.

## 4. La maniobra previa
- **Cuánto dura**: 20 s de reloj a la vista (25 como mucho). No alarga la marcha: se le quita a la batalla un trozo
  de espera. Cuenta: maniobra 20 s + acercarse 40 s + choque ≈ 2 min 20 s a 3 min. Cabe en los 4 minutos.
- **Qué hace el dedo**: tocar **un** botón de dos o tres. No se coloca nada, no hay zona de despliegue, no hay pausa.
  Los botones ocupan la franja de órdenes; no hay ni uno más en pantalla. Sirve de pie y tumbado, con el pulgar.
- **Dónde está la decisión**: es una carrera con riesgo. Quien tiene más jinetes y tropa ligera llega antes. Las dos
  barritas dicen si te da tiempo. Cruzar y no llegar es lo peor; esperar es seguro pero cede el sitio.
- **El enemigo también elige**, según su carácter (los galos cruzan casi siempre; Cartago espera si tiene honderos).
- **Si no tocas nada**: tu ejército se queda donde está y forma. Nunca es peor que «Esperar».
- **Con los 40 s de GM7**: van detrás, sin cambio. El enemigo no tira durante la maniobra (aún está en columna).
- **Con GM10 (mover con el dedo, más adelante)**: los botones se quedan como atajo. Arrastrar un cuerpo a la otra
  orilla hará lo mismo que «Cruzar ya», pero cuerpo a cuerpo (cruzar solo con un ala, por ejemplo). No hay que rehacer nada.

## 5. La emboscada
- **Cuándo**: un ejército apostado en un tramo con bosque o loma, y el que pasa no lo descubre. Lo descubren los
  jinetes ligeros y el general (más jinetes, más fácil). Orientativo: 30 % de caer con buena caballería, 70 % sin ella.
- **Qué cambia en la batalla** para el emboscado: no elige hora, no hay maniobra, no hay fase de tiradores. Empieza a
  60 m y **en columna**: el centro llega ya, un ala a los 10 s y la otra a los 20 s. Ánimo −15 % al empezar. Los jinetes
  del que embosca salen ya por el costado.
- **Salida digna**: el botón «Retirarse» (decisión GC8) sigue ahí. Perder poco en una emboscada cuenta como hacerlo bien.
- **¿Puedes emboscar tú?** Es la duda 5. El estudio R6 (esconder tropas en bosque) queda dentro de esto.

## 6. Cómo se enlaza con la campaña (`js/game.js`, solo leído)
**Cómo es hoy**: un ejército es una marcha de una ciudad a otra por un camino de `D.EDGES` (`{from, to, t0, t1}`).
Solo hay batalla **al llegar a una ciudad** (`s.pending` con `attack` o `defense`). **Hoy dos ejércitos nunca se topan
en el camino**: se cruzan sin verse. Así que «toparse» es una regla nueva de campaña, no solo un cartel.

**Lo que haría falta**:
1. **Toparse**: en cada paso del tiempo, si dos marchas enemigas van por el mismo camino en sentidos contrarios y sus
   posiciones se cruzan, se paran y nace una batalla de campo (`kind: 'campo'`). Por mar no (eso es marina, otra tarea).
2. **El sitio**: una tabla nueva en `js/data.js`, por camino, con sus rasgos y a qué altura están. Ejemplo:
   Roma–Capua: loma al 30 % (montes Albanos), río al 55 % (Liris), río al 90 % (Volturno). El rasgo más cercano al
   punto del encuentro manda; si no hay ninguno cerca, llano. Cada rasgo, con su ficha en `js/registro.js` (fuente).
3. **La hora**: la que elijas o al azar; la niebla depende del sitio y la estación (`G.estacion`): otoño e invierno,
   junto a río o pantano.
4. **Después**: el que pierde vuelve a su ciudad de salida; el que gana sigue su marcha con retraso.
5. **La batalla no aprende economía**: recibe dos ejércitos y una ficha de campo; devuelve bajas. La arquitectura no cambia.

**Qué se guarda** (y cómo se migra en `G.load`):
| Dato nuevo | Dónde | Partida vieja |
|---|---|---|
| `campo: {camino, punto, rasgo, nombre, hora, niebla, emboscada, semilla}` | en la entrada de `s.pending` | Sin `campo` = batalla de ciudad, como hoy. No hay que tocar nada |
| `postura: 'apostado'` (si se aprueba emboscar) | en la marcha | Sin `postura` = marcha normal |
| `ajustes.hora: 'elijo' / 'azar'` | en ajustes | Lo pone `G.migrarAjustes` con «elijo» |
No hace falta cambiar la versión del guardado: todo son campos opcionales.

## 7. Variantes
| | Qué es | A favor | En contra |
|---|---|---|---|
| **A · Cartel y botones** (recomendada) | Lo descrito: el sitio manda, cartel con hora, 20 s de maniobra con dos o tres botones | Cumple todo lo que pediste; un dedo; no espera a GM10; barata de probar | La maniobra es «elegir», no «mover»: menos libre |
| **B · Maniobra con el dedo** | Igual, pero en los 20–30 s arrastras cada cuerpo a donde quieras | Lo más parecido a Rome II | Depende de GM10 y del motor único (tarde); riesgo de volver al despliegue que no te gustó; más larga |
| **C · Solo escenario** | El sitio y la hora mandan, sin fase de maniobra: la orilla es de quien ya estaba esperando en el mapa | La más corta y barata | No hace lo del río que pediste |
Recomiendo **A**, hecha de forma que B sea añadir el dedo encima cuando llegue GM10.

## 8. Coste por piezas y riesgos
| Pieza | Tamaño | M |
|---|---|---|
| 1. Maqueta: campo ancho, loma, río con vado y maniobra con botones | media | 1,0 |
| 2. Bosque, noche y niebla (reglas y aspecto) | media | 0,8 |
| 3. Emboscada en la maqueta | pequeña | 0,5 |
| 4. Campaña: toparse en el camino, tabla de sitios, guardado, cartel en el mapa | grande | 1,5 |
| 5. Fichas de historia de ríos y sitios (agente con búsqueda) | pequeña | 0,4 |
Total orientativo **4,2 M**: casi el doble de los 2,3 M que decía la decisión 6, porque entonces no contaba ni la
campaña ni la emboscada. Las piezas 1 a 3 se pueden probar sin tocar el juego.
**Cuándo**: las piezas 1 a 3 van sobre el motor único (GM11). Hacerlas antes sería otra maqueta suelta que luego hay que fundir.

**Riesgos**
- **El relieve tapa tropas en el móvil de pie.** Lomas de 4 a 6 m, cámara alta en la maniobra, estandartes siempre encima. Se prueba primero con una sola loma.
- **Noche y niebla ilegibles** (pantalla oscura a pleno sol). La noche es tinte azul, no negro; los estandartes y los carteles no se oscurecen.
- **La maniobra alarga la batalla.** Tope de 25 s; en llano no existe; no hay pausa.
- **El río vuelve invencible al que espera**, o nadie cruza y no hay batalla. Es la duda 4.
- **Las pruebas se multiplican**: 4 rasgos × 3 horas son 12 combinaciones para los jugadores de mentira. Se afina primero llano, loma y río de día.
- **Toparse puede pasar muy poco**: hay 24 caminos y casi todas las marchas van a una ciudad. Es la duda 3.
- **El enemigo debe saber usarlo** (tomar la loma, no cruzar a lo loco); si no, el terreno solo te ayuda a ti.

## 9. Dictamen histórico: APTO CON NOTAS (citas de memoria, sin cotejar)
- **Histórico**: batallas en un río del periodo. Heraclea, 280: los romanos cruzan el Siris ante Pirro (Plutarco,
  *Pirro* 16). Trebia, 218: Sempronio hace cruzar el río helado al amanecer y llegan ateridos (Polibio 3.71-74; Livio
  21.54-56). Cannas, 216, junto al Aufidus (Polibio 3.110-113). Metauro, 207 (Livio 27.47-49). Bagradas, 255 (Polibio
  1.33-34). Aous, 198 (Livio 32.11-12). **Niebla y encuentro por sorpresa**: Cinoscéfalas, 197, los dos ejércitos se
  topan en la niebla de las colinas (Polibio 18.20-22); Trasimeno, 217, emboscada con niebla (Polibio 3.83-84; Livio
  22.4-6). **Emboscada**: Magón oculto en la Trebia (Polibio 3.71). **Elegir día y hora**: los generales formaban y
  ofrecían o rehusaban batalla; el viento y el polvo de Cannas (Livio 22.46).
- **Probable**: que un general se apresure a cruzar antes de que llegue el enemigo; es lo que las fuentes discuten
  en Heraclea y Trebia, no una orden con nombre.
- **Licencia de juego**: **elegir la niebla** (se aprovechaba, no se pedía); la **batalla campal de noche** como
  opción normal (hubo marchas y golpes nocturnos, como el incendio de los campamentos junto a Útica en 203, Polibio
  14.4-5, pero casi no batallas formadas); un solo rasgo por campo; los 20 s; todos los números; la probabilidad de emboscada.
- **Pendiente**: la tabla de sitios (qué río corta qué camino) necesita su ficha con fuente antes de salir en pantalla (pieza 5).

## 10. Dudas que decides tú (con mi recomendación)
1. **Variante**: (A) cartel y botones; (B) maniobra con el dedo, esperando a GM10; (C) solo escenario. *Recomiendo A.*
2. **Hora y niebla**: (A) eliges siempre lo que quieras: día, noche, niebla o al azar, tal como lo dijiste; (B) eliges
   la hora si llevas la iniciativa, y la niebla solo se ofrece cuando el sitio y la estación la dan; (C) siempre al azar.
   *Recomiendo B, con un ajuste «siempre al azar»: es más creíble y la niebla sigue saliendo. Si prefieres tu frase literal, es A.*
3. **Cómo se topan**: (A) solo cuando dos marchas se cruzan en el mismo camino; (B) además, cuando el enemigo marcha
   sobre una ciudad tuya, un botón «Salir al encuentro» que te deja elegir en qué sitio del camino lo esperas (el río,
   la loma). *Recomiendo B: sin ella toparse pasaría pocas veces. Ojo: en B eliges tú el sitio en el mapa.*
4. **Río y nadie cruza**: (A) quien ataca en la campaña está obligado: pasados 60 s su ejército cruza solo; (B) no
   hay batalla y cada uno vuelve por donde vino. *Recomiendo A.*
5. **Emboscar tú**: (A) de momento solo ocurre por el sitio y la suerte, a ti o a ellos; (B) orden «Apostarse» en el
   mapa de campaña, como pieza aparte. *Recomiendo A ahora y B después.*
6. **Noche**: es rara en la historia del periodo. (A) se ofrece, marcada como licencia de juego; (B) solo en
   emboscadas y golpes por sorpresa. *Recomiendo A, porque la pediste.*
7. **Cuándo se hace la maqueta**: (A) después del motor único (GM11); (B) ya, sobre la maqueta de GM7, aunque luego
   haya que fundirla. *Recomiendo A.*
