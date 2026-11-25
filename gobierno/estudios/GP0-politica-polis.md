# GP0 · Política de la polis: leyes, Asamblea o Consejo y cargos · 25/11/2026

Sesión de diseño (Opus). No toca el juego. Sirve a PLAN-2.0 **M4 · Política y dominio** («Regímenes que cambian») y a
OBJETIVOS, Cerebro (rama Política). Roma se queda como está.

**Pedido del usuario** (25/11, literal): «lo de las leyes habría que repensarlo en otra sesión para ajustar los
parlamentos y los gobiernos en cada nueva partida, y reusar lo que hay pero mejorarlo, o crear un departamento
específico para este juego que piense Opus y lo haga Haiku o Sonnet, y sea simple, barato, sencillo, rápido y divertido».

## 1. Lo que hay hoy (captura `gp0/hoy-senado-atenas.jpg`, `gp0/hoy-carrera-atenas.jpg`)
- Atenas, 800 a.C.: «Propone el Senado: **Guerra a Cartago** · Roma entra en guerra…». Bandos con familias romanas
  (Fabios, Emilios, Escipiones), «Cónsules» en el hemiciclo. Pestaña «Tu carrera»: Edil, Pretor, Cónsul, Príncipe del Senado.
- El **motor es bueno y genérico** (`js/game.js` 2864–3200): bandos con humor y escaños, una ley por estación, postura
  de cada bando por tipo de ley (`posturaTipo`), promesas y pagos por votos, peticiones de cada bando, actos que
  contentan a un bando. Las leyes son datos (`D.LEYES`, 12) y los bandos también (`D.BANDOS`, 7).
- Lo romano está en los **datos y los textos**, no en el motor. PN3e ya cambió Senado → Asamblea en la crónica (`G.griego`).

**Conclusión**: no hace falta motor nuevo. Se reusa el del Senado con **tablas griegas** cuando juegas con polis, más
una regla pequeña nueva: el **régimen** (quién vota) y su **cambio** (tirano o revuelta).

## 2. Propuesta: la Asamblea de la polis (simple)
Maquetas: `gp0/maqueta-s1.jpg` (hoy se vota), `-s2.jpg` (régimen), `-s3.jpg` (cargos).

### 2.1 Cuatro bandos griegos (reusan los ids del motor: ter, mil, mer, pue)
| Bando | Id que reusa | Quiénes | Pide |
|---|---|---|---|
| 🐎 Nobles | ter | familias con tierra y caballos (eupátridas) | tierra, paz en casa, jinetes |
| 🛡️ Hoplitas | mil | campesinos que se pagan el escudo | victorias, que no les falte grano |
| ⛵ Mercaderes | mer | comercio y barcos | rutas, mercado, colonias |
| 🧺 Pobres | pue | jornaleros y remeros (thetes) | grano, juegos, perdón de deudas |
Historia: las cuatro clases de Solón (Aristóteles, *Const. aten.* 7; probable). Mercaderes como bando: licencia de juego.
Sacerdotes, Itálicos y Provinciales no salen en la polis.

### 2.2 Cuatro regímenes (M4) — quién vota y qué cambia
| Régimen | Votan | Qué puedes (≥ 2 cosas, vara M4) |
|---|---|---|
| Aristocracia | Consejo: Nobles 60 %, Hoplitas 25 %, Mercaderes 15 % | jinetes −20 %; no puedes armar a los pobres |
| Tiranía | nadie: **tú decretas** | obras −20 % (tiranos constructores); cada decreto: Nobles −4 |
| Oligarquía | Consejo de ricos: Nobles 40 %, Mercaderes 35 %, Hoplitas 25 % | comercio +10 %; no armas a los pobres |
| Democracia | Asamblea: Pobres 40 %, Hoplitas 30 %, Mercaderes 15 %, Nobles 15 % | remeros pobres (barcos baratos, M5); **ostracismo**: echas al cabecilla del bando más enfadado (su humor vuelve a 50), una vez cada 10 años; la guerra siempre se vota |

**Cambios** (una sola regla, sin azar, con aviso 2 estaciones antes):
- Una clase **que no vota**, harta (humor < 25) 6 estaciones → **tirano** (eres tú: pasas a Tiranía).
- La clase **que más vota**, harta 6 estaciones → **revuelta**: Tiranía → Oligarquía (si Nobles + Mercaderes pesan más) o
  Democracia (si Pobres + Hoplitas); Oligarquía → Democracia; Democracia → Oligarquía; Aristocracia → Oligarquía.
- O tú: la ley **«Nueva constitución»** (sale cuando un bando está muy contento; si se vota, cambias al régimen que ese bando quiere).

### 2.3 Gobierno distinto en cada partida (el «ajustar en cada nueva partida» del usuario)
- Cada polis empieza con **su** gobierno de época (pregunta 2): Atenas, Corinto, Tebas, Mégara, Calcis, Mileto:
  aristocracia; Argos: rey fuerte (cuenta como tiranía); Esparta: dos reyes y ancianos (cuenta como oligarquía).
- Y el **reparto de escaños** sale de la semilla de la comarca (como el terreno): misma polis, consejo distinto.
- Los bandos más fuertes al empezar se leen de la comarca: costa → más Mercaderes; llanura → más Nobles.

### 2.4 Leyes griegas (12; tipo = el del motor, así el motor ya sabe quién las quiere)
| Ley | Tipo | Efecto | Fuente (de memoria, por cotejar) |
|---|---|---|---|
| Guerra a «vecina» (nombre de la polis rival) | guerra | permiso para atacarla | guerras de frontera arcaicas · probable |
| Tregua con «vecina» | paz | paz 4 estaciones | probable |
| Tregua olímpica | paz | +ánimo, nadie ataca 1 estación | 776 a.C., Pausanias 5.20.1 · probable |
| Llamar a los hoplitas | leva | leva de hoplitas | probable |
| Armar a los pobres | leva | peltastas y remeros; Pobres suben de peso | licencia de juego |
| Murallas | obra | misión de muralla | probable |
| Fuente pública | obra | misión de fuente | Pisístrato, Enneacrunos · probable |
| Templo de la diosa de la polis | obra | misión de templo | probable |
| Fundar una colonia | obra | prepara colonia (M3) | Tucídides 6.3–4 (Naxos 734, Siracusa 733) · probable |
| Leyes escritas | ley | menos inquietud | Dracón 621, *Const. aten.* 4 · probable |
| Perdón de deudas | ley | Pobres +8, Nobles −6 | Solón 594, *Const. aten.* 6 · probable |
| Nueva constitución | ley | cambia el régimen | Clístenes 508, Heródoto 5.66 · probable |
Licencia de juego: las cifras y que todas las polis tengan las mismas leyes.

### 2.5 Cargos griegos (sustituyen Edil, Pretor, Cónsul, Príncipe)
Agoránomo (mercado) → Polemarco (guerra) → Arconte (juzga y preside) → **Arconte epónimo**: el año lleva tu nombre.
Esparta: Éforo y Rey. Fuente: *Const. aten.* 3 y 51; Plutarco, *Licurgo* 6 (probable). Hoy la carrera es solo cartel
(«Pronto…»); aquí solo cambian los nombres; la subida por prestigio va con CE7 cuando toque.

### 2.6 Nombres en pantalla con polis
Pestaña «Senado» → **«Asamblea»** (con aristocracia u oligarquía, el cartel dice «Consejo»). «Propone el Senado» →
«Propone el Consejo / la Asamblea». Hemiciclo «Cónsules» → «Arcontes». Barra «Senado» → «Consejo». Familias romanas → fuera.

### 2.7 Lo que NO se hace (para que sea barato)
Sin motor nuevo, sin arte nuevo (el hemiciclo sirve; la pnyx con arte es para M4 aspecto), sin elecciones, sin
personajes con nombre salvo el tuyo en el año, sin cambiar Roma.

## 3. ¿Departamento propio o reusar?
Recomendado: **Mesa de la Polis**, pequeña, dentro del Cerebro (rama Política), como el Arte de Mapas en el Músculo.
- **Piensa** Opus (esta sesión y una revisión al final). **Construye** Sonnet. **Haiku**: solo textos y fichas de
  `js/registro.js` a partir de la tabla de leyes (trabajo mecánico y barato).
- **Archivos suyos**: `js/polis-politica.js` (nuevo: tablas griegas y regla del régimen; corre en Node),
  `test/politica-polis.test.mjs` (nuevo), `gobierno/captura-gp.mjs` (nuevo), `.claude/skills/mesa-polis/SKILL.md` (guía de una página).
  De paso (comunes): `js/game.js` (que el Senado lea las tablas de la polis), `js/ui.js` (nombres), `js/registro.js`, `sw.js`.
- **Cómo se juzga**: bot de reglas en Node (vara M4: 4 regímenes con ≥ 2 diferencias; el régimen cambia en 7 de 10
  partidas de 50 años con el bot de polis; pierdes ≥ 3 de 10 votos si no cuidas a quien vota; aviso antes del tirano) ·
  juez de pantalla a 390 (régimen y votación en ≤ 2 toques, nada romano) · dictamen de Historia · Roma intacta (`polis.test` y `jueces --rapido`).

## 4. Reparto en tareas pequeñas
| Tarea | Qué | Quién | Tamaño | Gasto esperable |
|---|---|---|---|---|
| GP1 | Nombres griegos: pestaña Asamblea/Consejo, bandos griegos (4), cargos, hemiciclo; fuera lo romano con polis | Sonnet | pequeña | 0,6 M |
| GP2 | 12 leyes griegas con fuente; con polis la Asamblea solo propone griegas; «vecina» con nombre de rival | Sonnet + Haiku (fichas) | pequeña | 0,8 M |
| GP3 | Régimen: 4 regímenes, quién vota, sus efectos; pestaña «Régimen»; gobierno de época y escaños por semilla | Sonnet | media | 1,5 M |
| GP4 | Cambios: tirano, revuelta, «Nueva constitución», ostracismo; avisos 2 estaciones antes; liga de bots 50 años | Sonnet | media | 1,5 M |
| GP5 | Examen: juez de pantalla, historia, revisión Opus | Opus (no construyó) | pequeña | 0,5 M |
| | **Total** | | | **≈ 4,9 M** (≈ 1 M Opus, resto Sonnet/Haiku) |
Orden: GP1 → GP2 → GP3 → GP4 → GP5. GP1 y GP2 ya quitan lo que chirría; GP3–GP4 son M4.

## 5. Preguntas al usuario y respuestas
Las cuatro preguntas (1 quién lo hace, 2 gobierno de arranque, 3 tirano, 4 votaciones) **quedan sin contestar**.
Respuesta del usuario (25/11, literal): «Prefiero debatirlo más, antes de nada, me gustaría rehacer los menús, algo más
minimalista pero que sea más visual y le de más jugabilidad que solo pulsar el botón para las votaciones, puede pensarlo
en otra sesión fable».

**Estado**: propuesta en debate, nada aprobado. Lo que pide primero: una sesión de diseño con **Fable** que rehaga los
menús de la política: más minimalistas, más visuales y con más juego que pulsar «Votar». Esa sesión parte de este
estudio y de su maqueta, y vuelve a traer al usuario las preguntas 1–4.
Ojo para el vigía: la regla dice «sin Fable» (18/11), salvo excepciones dichas por el usuario. Esta frase es una
excepción nueva, solo para esa sesión de diseño.

## 6. Cuentas
Ver `node gobierno/gasto.mjs` al cerrar.
