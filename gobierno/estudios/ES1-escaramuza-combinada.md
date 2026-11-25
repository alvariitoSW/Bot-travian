# Corazón · Escaramuza combinada: falange + manípulos + tiradores que mandas tú (ES1, 24/11/2026)

**Qué es.** Diseño, sin código. Sirve a `OBJETIVOS.md`, órgano Corazón: **L12** (Escaramuzas), **L10** (una sola batalla) y
**L17** (formaciones). Pedido del usuario (24/11, ~20:35, literal): «Abre una sesión para que diseñen que en las escaramuzas
puedas elegir la falange de picas con 2-3 manípulos a la vez y puedas poner detrás tropas de ataque a distancia y poder
manejarlas también y tener su jugabilidad de tropa a distancia con sus físicas».
Leído antes: FU0, partes FU1–FU3b, ES0, REF-batallas, la escena `maquetas/bloque/` y `js/fisica-batalla.js` (proyectiles).
Boceto estático: `gobierno/maquetas/es1/index.html` · capturas `capturas-tarea/ES1-boceto-v.jpg` y `ES1-boceto-h.jpg`.

## 1. Qué se pide, leído (interpretación recomendada)
En Escaramuzas eliges **un ejército combinado y lo mandas entero, cuerpo a cuerpo**: una **falange de picas** en el centro,
**dos manípulos** a sus lados (tres como opción) y, **detrás**, un cuerpo de **tiradores** (honderos, arqueros o vélites con
jabalina) que también diriges: a quién tiran, cuándo, si avanzan a hostigar o se retiran por los huecos de tu línea. Los
proyectiles vuelan con la física que ya tiene el motor (se clavan, rebotan, chocan con las picas alzadas).

**Tiene base histórica, y es justo nuestra fecha**: Pirro, en Ásculo (279 a.C.), **intercaló manípulos itálicos entre las
compañías de su falange** para poder luchar contra la legión (Polibio 18.28.10, `histórico`), y trajo a Italia 2.000
arqueros y 500 honderos (Plutarco, *Pirro* 15.1, `histórico`). Por eso el escenario recomendado es **«Ásculo»: tú eres Pirro**
(falange epirota + 2 manípulos itálicos + honderos o arqueros) **contra una legión romana** (manípulos con sus vélites delante).
- **(A) recomendado**: tú mandas falange + manípulos + tiradores; el rival es la legión (manípulos + vélites).
- (B) el espejo: tú eres Roma (2–3 manípulos + vélites) y el rival es la falange con sus tiradores (Cinoscéfalas, Pidna).
- (C) los dos: (A) primero y (B) después reutilizando todo (el rival es el mismo juego de piezas).

## 2. Lo que ve y toca el jugador a 390 px, paso a paso
**Entrada.** Escaramuzas → paso 2 «Tu ejército» → nuevo botón «Combinada» (o la plantilla «Pirro en Ásculo»): pone falange,
dos manípulos itálicos y honderos; puedes cambiar los tiradores (honderos · arqueros · vélites) y el número de manípulos (2 o 3).
→ «Al despliegue» (CG5a, si está; si no, despliegue fijo: falange al centro, manípulos a los lados con un hueco de 8 m,
tiradores 20 m detrás).

**En vertical (390×844)** — ver `ES1-boceto-v.jpg`:
1. **Arriba**: el objetivo en una línea («Rompe la línea romana antes de que lleguen sus príncipes»), ⏸ y «Datos ▾».
2. **El campo**, visto desde detrás y arriba de tu línea (la cámara del bloque). Cada cuerpo con su **estandarte** y su nombre
   corto: «Falange», «Man. I», «Man. II», «Honderos 18» (el número es la munición que les queda).
3. **La tira de mando** (nueva), encima de los botones: **cinco fichas** de 52 px de alto: «Todos», «Falange», «Man. I»,
   «Man. II», «Honderos». Cada ficha, su barra de vida (verde/ámbar/roja como el estandarte) y, en los tiradores, la munición.
   La elegida lleva **borde dorado** y su bloque en el campo un **aro dorado** en el suelo.
4. **Cuatro botones** de órdenes **del cuerpo elegido** (siempre cuatro, la que conviene se ilumina, como hoy).
5. **Avisos en el borde**, nunca en medio: «Tirando por encima de la falange · 18 tiros», «¡Sin munición!», «¡Están trabados con
   los tuyos!».

**En horizontal (844×390)** — ver `ES1-boceto-h.jpg`: la tira de mando pasa a una **columna a la izquierda** (pulgar izquierdo)
y las cuatro órdenes a una **columna a la derecha** (pulgar derecho); el campo queda en medio, entero.

## 3. Cómo se elige y se manda cada cuerpo con el dedo sin liarse
Regla de oro: **un dedo, un cuerpo**. Siempre hay **uno** elegido (o «Todos»), y todo gesto en el campo es para él.
| Gesto | Qué hace |
|---|---|
| Tocar una ficha de la tira, o el estandarte de un cuerpo tuyo | Lo elige. Vibración corta y aro dorado. |
| Tocar dos veces una ficha | Elige y lleva la cámara a ese cuerpo. |
| Arrastrar por el suelo | Dibuja el frente **del elegido** (lo de siempre: gira como una puerta y marcha). |
| Arrastrar con «Todos» | Dibuja el frente **de la línea entera**: la falange al centro, los manípulos a sus lados con su hueco y los tiradores 20 m detrás (lo que hoy hace `manda(C, p0, p1, { amigas: true })`). |
| Tocar un bloque enemigo **con tiradores elegidos** | Lo marca como **blanco**: cinta roja hasta él y recuadro rojo. Con otro cuerpo elegido, el toque no hace nada (como hoy). |
| Pellizco | Baja al oficial **del cuerpo elegido**: en la falange, el gesto de FU3b (bajar sarisas, cerrar el hueco); en un manípulo, el duelo de FU2; en los tiradores, **tú tiras** (mantener y soltar, como el pilum de FU2, con la parábola dibujada). |
| ⏸ | **Pausa con órdenes**: el tiempo se para, puedes elegir y dibujar; al reanudar se cumplen. (Total War la tiene; en un móvil con cuatro cuerpos hace falta.) |
- **Lo que no se hace** (para no liarse): no hay selección de varios sueltos con el dedo (solo uno o «Todos»); no hay cajas de
  arrastre; un toque corto en el suelo sigue sin hacer nada.
- **Lo que cada cuerpo hace solo si no le mandas**: sigue su última orden; si le atacan de flanco, se gira él (IA de amigas de
  LP2); los tiradores, en «Tirar», tiran al más cercano a su alcance si no hay blanco marcado.

**Las cuatro órdenes de cada cuerpo**
| Cuerpo | Botones (el que conviene se ilumina) |
|---|---|
| Falange | Bajar picas · Cerrar filas · Avanzar · Alto (los de FU3) |
| Manípulo | Testudo · Cargar · Relevo · Alto (los de LP3; «Alto» pasa a «Retirada» trabado) |
| Tiradores | **Tirar** (↔ «Alto el fuego») · **Hostigar** (ir hasta su alcance, tirar y volver) · **Retirarse** (por los huecos, detrás de la línea) · **Alto** |
| Todos | Avanzar · Alto · Cargar (los manípulos cargan; la falange avanza con picas bajadas) · Retirada |

## 4. Los tiradores: jugabilidad y física
**Tres tipos**, con su forma de jugar distinta (cada cifra con su etiqueta):
| | Honderos (baleares, rodios) | Arqueros (cretenses) | Vélites / jabalineros |
|---|---|---|---|
| Hombres | 40 por cuerpo | 40 | 40 por manípulo en la legión (Polibio 6.21: 1.200 vélites por legión, es decir 40 por cada uno de los 30 manípulos), `histórico` |
| Proyectil | piedra (no se clava: golpea, rebota y cae) | flecha (se clava; `PROYECTIL.flecha` ya existe) | jabalina (`PROYECTIL.jabalina` ya existe) |
| Tiro | **directo o parábola**; directo pega más | **parábola** sobre los tuyos; directo de cerca | **solo directo**: no pasa por encima de su propia línea |
| Alcance en el juego | 60 m (máx. 75) | 80 m (máx. 100) | 25 m |
| Alcance real | Vegecio 2.23: arqueros y honderos se entrenaban a 600 pies (≈180 m), `histórico` como cifra de práctica | lo mismo | sin cifra antigua; 20–30 m es la estimación moderna, `probable` |
| Munición | 20 | 24 | **7** jabalinas (Livio 26.4: siete jabalinas de cuatro pies por hombre), `histórico` (pasaje a cotejar) |
| Cadencia | un tiro cada 6 s | cada 5 s | cada 6 s |
| Bueno contra | armadura y casco (golpe que aturde); hombres sin escudo | lo que no tiene escudo de frente: vélites, flancos, la espalda | escudos (lastran: `Pr.pila`), tropa ligera |
| Flojo contra | testudo | testudo, **scutum de frente** | todo lo que esté a más de 25 m |
- **Escala**: el campo del bloque mide ~150 m y los rivales empiezan a 70 m; por eso los alcances de 180 m se **comprimen a
  60–80 m**: `licencia de juego` (si no, los tiradores barrerían el campo desde su sitio). Munición, cadencias y daños: `licencia de juego`.

**Lo que decide el jugador y lo que se ve**
- **Blanco**: el marcado o, si no hay, el más cercano a su alcance. Al elegir los tiradores se pinta en el suelo su **arco de
  alcance** (dorado) y, mientras apuntan, **las trayectorias** que van a seguir.
- **Directo o parábola: lo elige el juego, y lo enseña**. Si no hay nadie tuyo entre ellos y el blanco: directo (cinta blanca, más
  daño). Si tu línea está en medio: parábola (cinta ámbar, menos daño, aviso «Tirando por encima de la falange»). La jabalina no
  tira en parábola: si su línea está en medio, se queda «Sin tiro» y se ilumina «Hostigar» o «Retirarse». (Alternativa en «Decide».)
- **Fuego amigo**: si el blanco está **trabado** con un cuerpo tuyo, parte de los tiros cae en los tuyos (parábola 25 %, directo
  10 %); sale el aviso «¡Están trabados con los tuyos!» y se ilumina «Alto el fuego». `licencia de juego` (cifras); que los
  tiradores dejaran de tirar al llegar al cuerpo a cuerpo es lo normal en las fuentes, `probable`.
- **Cubrirse tras la falange**: las sarisas alzadas de las filas de atrás **paran parte de lo que llega por arriba** (Polibio
  18.30.3, `histórico`). El motor ya trata las sarisas alzadas como obstáculos `asta`: los proyectiles enemigos en parábola contra
  tus tiradores, si pasan por encima de la falange, chocan con las astas (−30 %, cifra `licencia de juego`).
- **Hostigar y retirarse por los huecos**: es lo que hacían los vélites, que abrían la batalla y se retiraban entre los
  manípulos (Polibio 15.9 y Livio 30.33, en Zama; `histórico`). «Hostigar» los lleva hasta su alcance, tiran dos veces y vuelven
  solos. «Retirarse» busca el hueco más cercano entre tus cuerpos (entre falange y manípulo hay 8 m) y pasan por él a la
  retaguardia; si el hueco está trabado, rodean por el ala. Pasar por un manípulo le baja un poco la cohesión; por la falange no
  se puede (no tiene huecos).
- **Si los alcanzan** (caballería, vélites, una carga): los tiradores no aguantan el choque (atk 0,4 como hoy): se rompen y huyen.
  Es la gracia del mando: ponerlos detrás y quitarlos a tiempo.
- **Sin munición**: se iluminan «Retirarse»; detrás de la línea, pueden luchar mal (licencia) o quedarse de reserva.

**La física** (lo que hay y lo que falta)
- **Ya hay** (FI3u, `crearProyectiles`): pilum, jabalina y flecha que se clavan, rebotan o resbalan; escudos, cuerpos y astas
  como obstáculos; lastre en el escudo; `salva(de, a, n, dur, tipo, punto)` en `bloque/fisica.js` con 160 proyectiles dibujados como
  máximo. Las reglas deciden quién muere; la física solo lo enseña (eso no cambia).
- **Falta**: (1) un tipo **piedra** (masa 0,05 kg, v 30 m/s, nunca se clava: golpea, rebota y rueda), `probable` para las cifras;
  (2) **elegir el ángulo**: para un blanco a d metros con velocidad v, el ángulo bajo (directo) o el alto (parábola) de la misma
  ecuación; hoy `salva` calcula solo «llega en dur s»; (3) que la línea de vuelo mire si cruza a los tuyos (para elegir directo o
  parábola y para el fuego amigo); (4) **estela** corta en cada proyectil en vuelo (lo pide REF §2: «proyectiles con estela»).

## 5. Cómo encaja en el motor único (FU) y qué hace falta
**Lo que el motor ya da**: el bloque y su frente dibujado (`js/bloque.js`, que **ya tiene el tipo `falange`** con sus huecos),
compañeras que se ponen a tus lados (`manda(..., { amigas: true })`), la IA del rival en tres niveles con tiradores que tiran
salvas (`js/bloque-ia.js`, solo galos), formaciones con contrato (`bloque/formaciones/`), física de proyectiles, la vista del oficial.
**Lo que no da**: (a) **mandar a más de un cuerpo** (hoy mandas a `C.yo`; las amigas las lleva la IA); (b) **mezclar formaciones
en la misma escena** (hoy una formación por escena: `?formacion=`); (c) **tiradores tuyos** con órdenes; (d) un **rival romano**
con vélites (hoy el rival del bloque es galo; la falange de FU3 lucha contra manípulos, pero dentro de `js/falange.js`).

**Decisión de diseño clave (recomendada)**: en la combinada, la falange es **un bloque del motor del bloque** (`tipo: 'falange'`
de `js/bloque.js`, con sus cifras sacadas de `js/falange.js`: frente fuerte, flanco débil, giro lento, sarisas dibujadas con lo
de `formaciones/falange.js`). La simulación pica a pica de `js/falange.js` sigue en «Falange a pie», y vuelve en la combinada
**solo cuando bajas a su oficial** (gesto de FU3b). Así hay un solo combate con todos los cuerpos dentro. La otra vía (meter la
falange entera de `js/falange.js` junto a los manípulos) cuesta el doble y mezcla dos simulaciones; ver «Decide».

**Etapas nuevas** (cada una ≤30 pasos de constructor; Opus construye; prueba de Node y capturas 390×844 y 844×390):
| Etapa | Qué se ve al acabar | Archivos (todos de Batallas) | Coste |
|---|---|---|---|
| **ES2 · Mando de varios** | `?formacion=combinada`: falange + 2 manípulos tuyos; tira de mando, elegir, frente de cada uno o de «Todos», órdenes por cuerpo, ⏸ con órdenes. Rival: los galos de hoy | `js/bloque-ia.js` (S.tuyos[], el elegido, la falange como bloque), `bloque/escena.js`, `hud.js` (tira), `dedos.js`, nuevo `bloque/formaciones/combinada.js`; prueba `test/es2-mando.test.mjs` | 1,6 M |
| **ES3 · Tiradores tuyos con su física** | Honderos, arqueros o vélites detrás; blanco, arco de alcance, directo o parábola, munición, fuego amigo, hostigar, retirarse por los huecos, estelas | nuevo `js/tiro.js` (reglas, corre en Node), `js/bloque-ia.js` (enganche), `bloque/fisica.js` (ángulo, piedra, estela), `js/fisica-batalla.js` (tipo `piedra`), `hud.js`; prueba `test/es3-tiro.test.mjs` | 1,6 M |
| **ES4 · Ásculo: el rival romano y la entrada** | La legión rival (manípulos con huecos y vélites que hostigan y se retiran), el escenario «Ásculo», la entrada desde Escaramuzas, medida de rendimiento | `js/bloque-ia.js` (rival romano), `bloque/soldados.js`, `js/ui-escaramuza.js`; **pase → común** si hace falta un botón en `js/ui.js` y la caché de `sw.js` | 1,2 M |
**Total ≈ 4,4 M** (con la desviación medida en las tandas FU, entre 5,5 y 6,5 M). ES1 (este estudio): ≈0,4 M.

**Orden recomendado**: **FU4 → ES2 → ES3 → FU5 → ES4 → FU6.** ES2 va tras FU4 porque los dos tocan `escena.js` y el rival; ES3
antes de FU5 porque FU5 (orden abierto) se apoya en saber cuánto matan las salvas; ES4 tras FU5 y antes de la limpieza (FU6),
que así borra de una vez. CG5a (despliegue) puede llegar antes o después: la combinada empieza con un despliegue fijo.
**Regla de la 1.0**: esto es nuevo; o entra sacando otra cosa o va a «Después de la 1.0» (ver «Decide»).

**Pruebas que tendrá que pasar** (en Node, sin pantalla): con la misma semilla, los manípulos solos dan lo mismo que hoy; los
tiradores con parábola sobre la falange matan menos que en directo; con el blanco trabado, hay bajas propias y «Alto el fuego»
las quita; unos tiradores que no se retiran a tiempo ante una carga se rompen y unos que sí, no; la munición se acaba; los
honderos contra un testudo casi no matan. Y que «Bajar a pie», «Manípulo a pie», «Testudo a pie» y «Falange a pie» no cambian.

## 6. Rendimiento en móvil
- **Llamadas de dibujo** (vara de hoy: ≤30; la escena del bloque gasta 19–29). Los soldados van en mallas instanciadas por
  modelo, así que suben con los **tipos** de soldado, no con los hombres: falangita (ya), hastatus rival (ya), itálico (uno
  nuevo, o el hastatus con otra paleta = 0), hondero o arquero (1–2), vélite rival (1–2), proyectiles (1), estelas (1), arcos y
  aros en el suelo (en la malla de la raya, 0). **Cálculo: 25–31**. Medidas para quedar ≤30: todos los proyectiles en **una** malla
  instanciada (piedra = la misma con otra escala), estelas en **una** sola, el itálico con la malla del hastatus y otra paleta.
- **Proyectiles**: una salva real son 40 tiros; **se dibujan 20 por salva** (uno de cada dos; las reglas cuentan los 40):
  `licencia de juego` visual. Con tus tiradores y los vélites rivales a la vez, como mucho 3 salvas en el aire: **≈60 volando** +
  los del suelo; se sube `PROY_MAX` de 160 a **200** y los más viejos del suelo se quitan antes (`SUELO_VIDA` 25 → 15 s).
- **Física**: hoy los proyectiles solo miran a los hombres a menos de 4 m (`CERCA_PR`); 60 en el aire × ~20 obstáculos cada uno
  está dentro de lo medido (motor < 1 ms en LP5a/FU1). Se mide con el medidor de TP9a en ES3, en el peor momento (tres salvas y el choque).
- **Hombres en pantalla**: tuyos 128 + 240 + 40 ≈ 410; rival 4 manípulos ≈ 480 + 160 vélites. Es **más** que hoy (unos 700): si
  pasa del tope, la legión rival se reduce a 3 manípulos o los manípulos de lejos se dibujan con la mitad de figuras (las
  reglas cuentan todos). Se decide al medir en ES4, sin prometer más hasta medir.

## 7. Historia (dictamen: APTO CON NOTAS)
- **Histórico**: Pirro intercala manípulos itálicos en su falange en Ásculo (Polibio 18.28.10); trae 2.000 arqueros y 500
  honderos a Italia (Plutarco, *Pirro* 15.1); las sarisas alzadas de las filas de atrás paran proyectiles (Polibio 18.30.3);
  1.200 vélites por legión, con jabalinas, espada y parma (Polibio 6.21–22); los vélites abren la batalla y se retiran entre los
  manípulos (Polibio 15.9, Livio 30.33 en Zama); siete jabalinas de cuatro pies (Livio 26.4); honderos baleares con tres hondas y
  piedras (Diodoro 5.18); entrenamiento de arqueros y honderos a 600 pies (Vegecio 2.23).
- **Probable**: alcance eficaz de la jabalina 20–30 m (estimación moderna); masa y velocidad de la piedra; que los tiradores
  dejaran de tirar cuando su blanco ya estaba trabado.
- **Licencia de juego**: alcances comprimidos a la escala del campo; munición de honderos y arqueros, cadencias, daños; fuego amigo
  en cifras; dibujar la mitad de los proyectiles; la pausa con órdenes; un general que manda a cada cuerpo con el dedo.
- **Anacronismos a vigilar**: nada de cohortes ni de legionarios imperiales en el rival (manípulos y vélites, 280–146); vélites
  con piel de lobo en el casco (Polibio 6.22), sin coraza; los honderos baleares, sin bolas de plomo (Diodoro no las cita).
- **Pendiente**: las citas de Polibio 18.28, 18.30, 15.9, Livio 26.4 y 30.33, Plutarco *Pirro* 15 y Vegecio 2.23 van de memoria del
  director; se cotejan pasaje a pasaje en ES3 antes de que salgan en pantalla (`node gobierno/fichas.mjs`).

## 8. Decide el usuario
**Quién eres**: (A) Pirro en Ásculo: falange + 2 manípulos itálicos + tiradores contra la legión [recomendado]; (B) Roma: manípulos +
vélites contra la falange; (C) las dos, (A) primero. Por qué: (A) es lo que pidió, es nuestra fecha (279 a.C.) y está en Polibio.
**Cuántos manípulos**: (A) dos, con el tercero como opción si el móvil aguanta [recomendado]; (B) tres siempre. Por qué: cinco fichas
caben a 390 px; seis aprietan, y son unos 120 hombres más en pantalla.
**La falange en la combinada**: (A) un bloque del motor del bloque con sus cifras; la falange pica a pica solo al bajar a su oficial
[recomendado]; (B) la falange entera de `js/falange.js` junto a los manípulos. Por qué: (A) es una sola batalla; (B) cuesta el doble y mezcla dos simulaciones.
**Directo o parábola**: (A) lo elige el juego y lo enseña con el color de la cinta [recomendado]; (B) un botón para cambiarlo. Por qué:
con cuatro botones por cuerpo no cabe otro sin quitar uno.
**Pausa con órdenes**: (A) sí, ⏸ arriba [recomendado]; (B) no, todo en tiempo real. Por qué: con cuatro cuerpos y un dedo, sin pausa se pierde el hilo.
**Cuándo entra**: (A) en la 1.0, tras FU4, sacando de la 1.0 otra tarea de Batallas que el vigía proponga (por ejemplo lo que quede de CG7) [recomendado]; (B) después de la 1.0. Por qué:
es justo lo que pide L12 («el escaparate del simulador»), pero la regla de la 1.0 obliga a sacar algo para meterlo.
**Más llamadas de dibujo**: (A) se queda la vara de 30 y se recorta (proyectiles y estelas en una malla, rival de 3 manípulos si hace
falta) [recomendado]; (B) subir la vara a 36 solo en la combinada. Por qué: el móvil va fluido hoy y la vara es lo que lo garantiza.

## 9. Ideas (no entran sin aprobación)
- Idea: caballería ligera (tarentinos, Livio 35.28) como quinto cuerpo, que hostiga a los tiradores rivales.
- Idea: los elefantes de Pirro en Ásculo (Plutarco, *Pirro* 21) como cuerpo que se manda, cuando FU4 los tenga en el motor.
- Idea: estela de humo en la flecha incendiaria (falárica, Livio 21.8) para asedios, después de la 1.0.
