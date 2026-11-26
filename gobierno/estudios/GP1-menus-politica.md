# GP1 · Menús de política de la polis: el ágora · 25/11/2026

Sesión de diseño (Fable, por excepción del usuario del 25/11). No toca el juego. Parte de `GP0-politica-polis.md`.
Sirve a PLAN-2.0 **M4 · Política y dominio** («Regímenes que cambian»; «Se entiende: régimen y votación en ≤ 2 toques»;
«Aspecto: asamblea, ágora, retratos de época») y a OBJETIVOS, Cerebro (rama Política). Roma se queda como está.

**Pedido del usuario** (25/11, literal): «Prefiero debatirlo más, antes de nada, me gustaría rehacer los menús, algo más
minimalista pero que sea más visual y le de más jugabilidad que solo pulsar el botón para las votaciones, puede pensarlo
en otra sesión fable».

Maquetas: `gp1/maqueta.html` (se abre en el navegador, 390 px) y sus capturas `gp1/*.jpg`.

## 1. Qué falla hoy (captura `gp0/hoy-senado-atenas.jpg`)
Seis pestañas, tres tarjetas de texto, un hemiciclo que no se toca y un botón rojo. Se lee mucho y se juega poco:
la única decisión es pulsar «Votar». La maqueta de GP0 arregló los nombres, pero seguía siendo lista y botón.

## 2. Lo común a las tres maquetas
- **Aspecto de vasija** (figuras negras sobre barro, con greca). Es de época (Corinto c. 700 a.C., Atenas c. 620–480),
  barato (dibujo hecho con código, 0 KB de arte, sin licencias ajenas) y se distingue de Roma de un vistazo.
- **Tres medallones** en vez de seis pestañas: **Hoy** (se vota), **Régimen**, **Cargos**. Fiestas, Plan y Ministros
  salen de aquí (van donde ya están en la ciudad; lo decide el constructor con el Cerebro, sin borrar nada).
- **La ley es una estela** de piedra: nombre y dos efectos con icono. La fuente histórica, al tocarla.
- **Una hilera de piedras** dice cómo va el voto: blancas sí, vacías dudan, negras no, y una raya donde hace falta llegar.
- **Los cuatro bandos son figuras**, no nombres: noble (bastón y manto), hoplita (escudo y lanza), mercader (ánfora),
  pobre (remo). Granate = está en contra. Mano levantada = vota sí.
- **Los que no votan se ven**: detrás de una cuerda, mirando. Si están hartos, se nota ahí (es el aviso del tirano).
- **Mismo motor**: bandos, humor, promesas y pagos de `js/game.js`. Solo cambia cómo se enseña y cómo se toca.
- Cada votación debe durar **≤ 20 segundos**. «Dejar pasar» sigue estando.

## 3. Las tres maquetas de la votación
### A · El ágora: mueves a la gente (`gp1/a1.jpg`, `gp1/a2.jpg`) — **recomendada**
La plaza tiene tres zonas: **sí**, **dudan**, **no**. Abajo tienes hasta tres **fichas** (plata, promesa, grano).
Arrastras una ficha a un grupo y esas figuras **caminan** al sí. Luego «Contar las manos»: se levantan una a una y el
heraldo canta el número. Las promesas quedan apuntadas como deuda.
- Juego: a quién compro, a quién prometo, cuánto gasto. Tres gestos como mucho.
- Motor: las fichas **son** los tratos que el motor ya genera (pagar por votos, prometer). Sin reglas nuevas.
- Manejo: arrastrar, o tocar ficha y luego grupo (por si arrastrar falla en algún móvil).
- Tiranía: no hay plaza que mover; estás solo en la piedra, pulsas «Decretar» y los nobles te dan la espalda (−4).

### B · El discurso: tú hablas (`gp1/b1.jpg`)
Subes a la piedra. El reloj de agua te da **tres frases**. En cada una eliges entre dos argumentos (Gloria, Los
abuelos, El pan, La plata). Cada uno gusta a un bando y molesta a otro; ves las manos subir y bajar. Sin gastar nada.
- Juego: leer la sala. No cuesta recursos: se gana o se pierde hablando.
- Motor: regla nueva pequeña (4 argumentos × 4 bandos) y hay que equilibrarla con el bot. Riesgo: repetitivo a la 20.ª vez.

### C · Las piedras: lo mínimo (`gp1/c1.jpg`)
Dos urnas y una fila de piedras por bando. Tocas un bando y te dice qué pide por cambiar una piedra. «Echar las piedras».
- Juego: el de hoy, mejor dibujado. Es la más barata y la que menos cambia.

| | A · Ágora | B · Discurso | C · Piedras |
|---|---|---|---|
| Más juego que «Votar» | sí (mover gente) | sí (elegir frases) | poco |
| Reglas nuevas | ninguna | una pequeña | ninguna |
| Coste de la pantalla de votar | ≈ 1,5 M | ≈ 2,2 M | ≈ 0,6 M |
| Riesgo | arrastrar en móvil (hay plan B: tocar) | equilibrio y repetición | sabe a poco |

**Recomendación**: A. Da juego sin reglas nuevas. B puede entrar después como «hablar antes de votar» en las leyes
grandes (guerra, constitución), si A gusta. C queda como reserva si A saliera cara.

## 4. Para las tres: ostracismo, régimen y cargos
- **Ostracismo** (`gp1/o1.jpg`, solo en democracia): tres **tejos** (trozos de vasija), uno por cabecilla de bando, con su
  humor. Eliges uno y «Contar los tejos». Regla de GP0: su bando vuelve a humor 50, una vez cada 10 años.
- **Régimen** (`gp1/r1.jpg`): una **rueda** con los cuatro regímenes y flechas. El tuyo, encendido. La flecha que amenaza
  sale en granate con las estaciones que faltan. Debajo, quién vota (figuras), dos efectos, y la **mecha** de 6 puntos
  del bando harto. Sustituye a los tres párrafos de la maqueta de GP0.
- **Cargos** (`gp1/k1.jpg`): una **escalera** de cuatro peldaños (Agoránomo → Polemarco → Arconte → Arconte epónimo),
  tu figura en el tuyo y el prestigio que falta. Hoy solo cambian los nombres; subir va con CE7.

## 5. Dictamen de historia (de memoria, por cotejar al construir)
| Pieza | Fuente | Etiqueta |
|---|---|---|
| Votar a mano alzada (queirotonía) | Aristóteles, *Const. aten.* 44; Jenofonte, *Helénicas* 1.7.9 | probable (atestiguado en época clásica; llevado al s. VIII) |
| El heraldo: «¿Quién quiere hablar?» | Demóstenes 18.170; Aristófanes, *Acarnienses* 45 | probable |
| Reunirse en el ágora (la Pnyx es de c. 500 a.C.) | Homero, *Odisea* 2.6–14; Plutarco, *Solón* 8 | probable |
| Piedras de voto y dos urnas | *Const. aten.* 68–69 (tribunales) | licencia de juego en la asamblea |
| Reloj de agua (clepsidra) | *Const. aten.* 67 (tribunales) | licencia de juego en la asamblea |
| Ostracismo con tejos, 10 años | *Const. aten.* 22; Plutarco, *Arístides* 7 | histórico desde 487 a.C.; antes, licencia de juego. Fuera de Atenas: Aristóteles, *Política* 1302b (Argos); Diodoro 11.87 (Siracusa) |
| La rueda de los regímenes | Polibio 6.4–9; Aristóteles, *Política* 3.7 | probable (la idea es antigua; nuestro orden es de juego) |
| Figuras negras y greca | cerámica corintia y ática, ss. VII–VI a.C. | histórico como estilo; el dibujo es nuestro |
| «Plata» y no monedas | la moneda llega a Grecia c. 600–550 a.C. (Egina) | ojo: hasta entonces, plata al peso y asadores de hierro (Plutarco, *Lisandro* 17). El texto dirá «plata» |
| «6 de cada 10» en el ostracismo | el quórum real eran 6.000 votos (Plutarco, *Arístides* 7) | licencia de juego |
Idea para después: en Esparta se vota **a gritos** (Tucídides 1.87; Plutarco, *Licurgo* 26): la misma plaza con un medidor de voces.

## 6. Reparto en tareas pequeñas (si se elige A)
Sustituye al reparto de GP0 (su GP1–GP5). Piensa Opus, construye Sonnet, Haiku solo fichas y textos.
| Tarea | Qué | Quién | Tamaño | Gasto esperable |
|---|---|---|---|---|
| GP2 | Tablas griegas: 4 bandos, cargos y nombres; fuera lo romano con polis (era GP1 de GP0) | Sonnet | pequeña | 0,6 M |
| GP3 | 12 leyes griegas con fuente; «vecina» con nombre de rival (era GP2 de GP0) | Sonnet + Haiku | pequeña | 0,8 M |
| GP4 | Piel de vasija, solo con polis: marco con greca, 3 medallones, estela, hilera de piedras, las 4 figuras en SVG (`js/ui-agora.js` nuevo y su CSS) | Sonnet | media | 1,2 M |
| GP5 | El ágora jugable: zonas, fichas (arrastrar o tocar), figuras que caminan, contar las manos, cuerda de los que no votan, decreto del tirano | Sonnet | media | 1,5 M |
| GP6 | Régimen: reglas de GP0 §2.2–2.3 y la rueda con su mecha | Sonnet | media | 1,8 M |
| GP7 | Cambios (tirano, revuelta, nueva constitución), avisos, ostracismo con tejos, escalera de cargos, liga de bots 50 años | Sonnet | media | 1,8 M |
| GP8 | Examen: juez de pantalla a 390 (≤ 2 toques, votar ≤ 20 s, nada romano), historia, revisión | Opus (no construyó) | pequeña | 0,5 M |
| | **Total** | | | **≈ 8,2 M** (GP0 eran 4,9 M; los menús nuevos suman ≈ 3,3 M) |
Orden: GP2 → GP3 → GP4 → GP5 → GP6 → GP7 → GP8. Con C en vez de A: GP5 baja a 0,6 M (total ≈ 7,3 M). Añadir B después: + 1,2 M.
Varas para el constructor: sin arte nuevo ni dependencias; todo SVG y CSS; animaciones con transiciones (nada de 3D);
zonas de toque ≥ 44 px; `touch-action: none` solo dentro de la plaza; la lógica no toca la pantalla (el ágora llama a
las mismas funciones del Senado); Roma no carga `ui-agora.js`.

## 7. Preguntas al usuario
Las 1–4 son las de GP0 (su texto exacto no quedó en el repositorio: se rehacen desde su resumen «quién lo hace,
gobierno de arranque, tirano, votaciones»). Las 5–7 son las de los menús.
1. ¿Quién lo hace? **(A, recomendada)** una «Mesa de la Polis» pequeña dentro del Cerebro: piensa Opus, construye Sonnet, Haiku los textos · (B) el Cerebro de siempre, sin mesa. Por qué: es barato y no se cruza con Roma.
2. ¿Con qué gobierno empieza cada polis? **(A, recomendada)** cada una con el suyo de época (Atenas aristocracia, Argos rey, Esparta dos reyes) · (B) todas igual, aristocracia. Por qué: cada partida empieza distinta, sin coste.
3. Cuando llega el tirano, ¿quién es? **(A, recomendada)** tú: sigues jugando, decretas sin votar y los nobles te odian · (B) otro: pierdes el mando unas estaciones. Por qué: perder el mando aburre.
4. ¿Cuánto se vota? **(A, recomendada)** una ley por estación, como hoy · (B) solo lo grande (guerra, paz, constitución, ostracismo). Por qué: con el ágora, votar pasa a ser juego y dura 20 segundos.
5. ¿Qué votación quieres? **(A, recomendada)** El ágora · (B) El discurso · (C) Las piedras. Por qué: A da juego sin reglas nuevas.
6. ¿Aspecto de vasija griega para la política de las polis? **(A, recomendada)** sí · (B) no, el pergamino de ahora. Por qué: de época, gratis y distinto de Roma.
7. ¿Régimen como rueda, cargos como escalera y ostracismo con tejos? **(A, recomendada)** sí · (B) listas sencillas. Por qué: se entiende de un vistazo.

### Respuestas del usuario
Contestadas el 25–26/11 en cuadro de preguntas. Entre comillas, lo que el usuario escribió de su mano; el resto, la opción que pulsó.
| N.º | Pregunta | Respuesta |
|---|---|---|
| 1 | Quién lo construye | Mesa de la Polis (la recomendada) |
| 2 | Gobierno de arranque | Cada una el suyo (la recomendada) |
| 3 | Quién es el tirano | Tú (la recomendada) |
| 4 | Cuánto se vota | «Esto hay que replantearlo» |
| 5 | Forma de votar | «B y C» (el discurso y las piedras; **no** eligió el ágora A) |
| 6 | Aspecto de vasija griega | Sí (la recomendada) |
| 7 | Rueda, escalera y tejos | «Esto hay que replantearlo» |
| 8 | Seguir con «La vasija» (intrigas) | «Hay que reformularlo» |
| 9 | Cuándo | no se preguntó: la cubre la 15 |
| 10 | Personas con nombre | «Mezcla» (inventadas y reales) |
| 11 | Se puede perder | Sí (la recomendada) |
| 12 | Jugarlo suelto desde el menú | Sí (la recomendada) |
| 13 | La vasija rehecha | Otra vuelta |
| 14 | Peso sobre ciudad y diplomacia | Mucho, con salida (la recomendada) |
| 15 | Dónde entra en el plan | «Que se puede absorber de la M4 y actualizar el proyecto con este cambio para no empezar a diverger» |
| 16 | Escenas grandes | Ilustraciones del taller (de Arte) |
Antes de responder dijo (literal): «Hazme las preguntas en formato pregutna y luego vemos que mejorar de esto de las vasijas y el juego».

**Estado**: aprobado el rumbo (1, 2, 3, 6, 10, 11, 12, 14, 16) y que la política nueva **se absorba en M4** (15).
**Abierto, a debatir con él**: cuánto se vota (4), cómo unir discurso y piedras (5), los menús de régimen, cargos y
ostracismo (7), la reformulación del juego de intrigas (8) y otra vuelta al dibujo de la vasija (13).
Nada se construye todavía. El reparto GP2–GP8 e IN1–IN13 queda en suspenso hasta cerrar lo abierto.

## 8. Cuentas
`node gobierno/gasto.mjs` al cerrar: ver el parte `gobierno/partes/2026-11-25-GP1-menus.md`.
