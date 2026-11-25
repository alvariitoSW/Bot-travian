# Plan de la 2.0 — BORRADOR (en debate con el usuario)

Abierto el 25/11/2026 por pedido del usuario (literal, ~11:20 Madrid): «como hacemos el plan para el 2.0 y le incluimos
las críticas que haré al 1.0? Necesito debatirlo en una nueva sesión donde me aparezca todo lo que haya en bitácora».
Rama `plan-2.0`. **Sin aprobar**: hasta su «sí» no se toca TABLERO, BITACORA, lista.json ni el cuadro (los lleva el vigía).

Estado: 1.0 en `main` = v168 (SB6). La subida final SB7 (v171) está en prueba.

## 0. Cómo convergemos (acordado el 25/11)
1. El usuario dice mejoras, sueltas o en tanda; se apuntan literales con fecha y su área.
2. Cada idea pasa tres preguntas: ¿la verás jugando?, ¿sirve a «EL JUEGO»?, ¿cuánto cuesta?
3. Cada idea cuelga de una meta («La 2.0 está terminada cuando…») o queda fuera. Sin término medio.
4. Cuando el usuario diga «ya está»: página con metas, orden y lo que queda fuera; decide con preguntas A/B.

Decisiones del usuario (25/11, en este chat):
- «5 metas (Recomendado)»: la 2.0 tiene **5 metas como máximo**.
- «Archivar todas (Recomendado)»: las **105 tareas «en pausa» del tablero se archivan** (siguen en git); solo vuelve
  la que encaje en una meta. Lo aplica el vigía cuando se apruebe el plan.

### Jueces de la 2.0 (decidido por el usuario el 25/11)
- Cambia **cómo se trabaja y las reglas del juego**: «Las dos cosas». Primero jueces, luego reglas del juego.
- Sí a: **juez por meta**, **tu «Bien» cierra la meta**, **juez de aspecto y diversión**. Literal añadido: «Y además,
  repensar como trabaja el juez porque si cada vez hace una partida entera va a tardar muchísimo y eso nos retrasa un montón».
- Medido en SB7 (v171): bots de dificultad 24 min, bots de reglas (sim.test) 21 min, bot investigador ≥20 min; las
  otras 40 comprobaciones y el recorrido, ~8 min.
- Literal: «Vamos a medir primero que tiene que juzgar y como. Y así les podemos poner un estándar y hasta que no llegue
  a ese estándar no pasan la prueba y creamos o mejoramos los jueces para afinar el objetivo final de cada tarea que juzgan».
  → Cada meta (y cada tarea) lleva su **estándar**: qué se mide, cómo, con qué cifra pasa. Los jueces se crean o
  mejoran para medir eso; hasta llegar a la cifra, no pasa.
- Bots desde **partidas ya avanzadas**: «Sí (Recomendado)».

### Decisiones sobre M3 y el menú (25/11)
- Descarga: **«1A»**, subir el tope a ~80 MB. Meshy: **«2A»**, empezar con modelos propios y Poly Haven; Meshy cuando haya créditos.
- Literal: «Antes hay que cambiar una cosa. Primero en el menú no solo tener la opción de campaña sino la opción de
  partida nueva y ahí elija campaña, cambiar la partida corta a partida nueva (y que aquí trabajen los jueces porque la
  campaña la vamos a dejar pausada)».
  → La 2.0 se construye y se juzga sobre **«Partida nueva»** (hoy «Partida corta», Italia, 3–5 h, con final). La campaña
  larga queda **en pausa**. Los bots y jueces juegan la partida nueva: más corta, más rápido el juez.

- Menú: **«Partida nueva arriba (Recomendado)»**: arriba «Continuar» y «Partida nueva»; dentro de Partida nueva se elige
  Italia (la corta de hoy, con final) o la Campaña Roma contra Cartago; debajo Escaramuzas y Opciones; «Región de Italia»
  sale de la lista (queda dentro).
- Campaña: **«Jugable, sin mejoras (Recomendado)»**: en el menú con etiqueta «en pausa»; nadie la mejora; los jueces
  solo miran que abra.
- Dónde va lo nuevo: **«1 y 2»** → todo lo nuevo se hace y se juzga en Partida nueva, y las batallas nuevas (asedio,
  históricas) también entran en Escaramuzas.
- Va en **M1** (base de la 2.0), lo primero de todo: sin ella, los jueces nuevos no tienen dónde medir.

### La idea central de la 2.0 (usuario, 25/11, literal)
«Vale, ahora yo en la ciudad puedo elegir civilización. Y empiezo en un mapa aleatorio de 0 según haya elegido ciudad,
y empiece con el foro y unas pocas casas de ciudadanos con algo de materias básicas y tenga un pequeño núcleo de
población, y ahí es donde entra la verdadera jugabilidad que hemos creado de ir construyendo, delegar en los ministros
para que la construyan de 0. Y la ciudad empiece a crecer y se vaya construyendo mientras se abastece a la ciudadanía y
se va construyendo el ejercito y el comercio etc. La cuestión sería empezar de 0 en una ciudad de Grecia en el 1000 ac o
en el 800ac y desde ahí cogiendo las cosas del 1.0 que hay hechas las pulimos creando la 2.0. Como se integra esto en el plan?»
→ Propuesta: las 5 metas se reordenan alrededor de «Partida nueva desde cero» (ver §3, versión 2). Choca con la regla
de época de CLAUDE.md (280–146 a.C.): la cambia solo el usuario.

### Vistas, arte y tiempo (usuario, 25/11, literal)
«Después, hay que hacer algo con las diferentes visiones de la ciudad, no puede tener 5 visiones, los ciudadanos y los
soldados usan texturas diferentes. La ciudad viva se siente artificial en roma, hay que rehacerla un poco de 0 con la de
ciudad griega, y ya después lo fusionamos con la de Roma con las mejoras. Después el tema de los tiempos del juego hay
que quitarlo, osea solo tener estaciones y que al principio de cada estación tengas los recursos que has recogido y con
eso puedas construir tropas y edificios y se construyan durante la estación en la que estás según los tiempos que dure
su creación».
Lectura: hoy la ciudad tiene «Desde arriba / De cerca», «Ciudad entera», «Calle», «Tropas» y «Ver necesidades»
(`js/ui.js`, menú de vistas). Propuesta: una sola vista con zoom (M1); personas y soldados con un solo estilo de arte
(M2); ciudad viva griega rehecha desde cero (M2) y su fusión con Roma después de la 2.0; tiempo solo por estaciones (M1).

Respuestas (25/11): tiempo **«Por turnos (Recomendado)»**: al empezar la estación cobras lo recogido, das órdenes y
pulsas «Pasar estación»; obras y tropas duran 1, 2 o más estaciones, con andamios a la vista. Vistas: **«Dos vistas»**:
desde arriba para construir y otra de cerca para mirar (fuera «Ciudad entera», «Calle» y «Tropas»; necesidades, un botón
encima). Estilo: **«De momento ambos para ir más rápido ambos pueden convivir»**: Meshy y 0 A.D. conviven; no se
unifica en la 2.0.

Literal (25/11): «Y que al mandar construir se vea la animación de que se construye algo y mientras estoy en la estación
veo como se construye y si paso estación de ha construido. Y lo mismo con la creación de tropas». → M1: al ordenar una
obra aparecen en el solar andamios, obreros y material; durante la estación se ve trabajar (animación en bucle); al pasar
estación, hecha (si dura 2, a medias en la primera). Tropas: reclutas entrenando en el patio del cuartel; al pasar
estación forman y quedan listas.

Precisión (25/11, literal): «Y lo d las vistas tendría 2, la de desde arriba, la de poder moverte por la ciudad que ya
hay». → Vista 1 «Desde arriba» (construir); vista 2 la ciudad 3D de hoy por la que te mueves (la que hoy abre «De
cerca»). Se quitan «Ciudad entera», «Calle» y «Tropas».


### M1: añadidos y arranque (usuario, 25/11, literal)
«M1: 2- hay que poder elegir más polis, y que cada una tenga su cultura específica que ya se desarrollará más con el
departamento de historia y de arte pero de momento se puede reciclar lo que hay. 3- hay que crear el departamento de
arte de mapas para que mejoren el mapa básico de roma que hay y lo lleven a. Otro nivel con un mapa vivo bien renderizado
que cada uno disponga en diferentes partes del mapa de los recursos básicos, y los de lujo haya en algunas ciudades y los
que no haya los tengas que conseguir por comercio o por conquista de esa ciudad y explotación de sus recursos. De momento
empieza con la m1 y la juzgo».
→ **M1 aprobada para empezar** (M2–M5 siguen en debate). Añadidos a M1:
- **Más polis** (propuesta: 8 — Atenas, Esparta, Corinto, Argos, Tebas, Mégara, Mileto, Calcis), cada una con su cultura
  (rasgo, edificio o tropa propia y ficha), reciclando lo que hay; Historia y Arte la amplían después.
- **Departamento de Arte de Mapas** (nuevo, dentro del Músculo, con el taller de Arte): mapa vivo y bien renderizado.
- **Recursos repartidos por el mapa**: los básicos en distintas zonas; los de lujo solo en algunas ciudades; lo que no
  tienes, por comercio o conquistando la ciudad y explotando su recurso.

**Orden dentro de M1 (tandas)**: 1) jueces rápidos y liga de bots (para medir lo demás) → 2) tiempo por estaciones →
3) menú, elegir polis, arranque y comarca → 4) dos vistas y ver construir/entrenar → 5) mapa vivo y recursos (Arte de
Mapas, puede ir en paralelo desde la tanda 2) → 6) críticas a la 1.0 cuando el usuario las dé.

## 1. Críticas del usuario a la 1.0
Literales y con fecha. Fuente: este chat y el botón «Juzgar la 1.0» del cuadro (colección `juicio`: vacía el 25/11 ~11:40).

- (pendiente: el usuario juega la v171 cuando llegue)

## 2. Inventario de partida (todo lo que había en la bitácora el 25/11)
Fuentes: `BITACORA.md` (rama del juego, 67d0671), entradas del 24/11 solo en `ccr-ee9e87a2-wh0o23`, `lista.json`,
`camino.json`, `TABLERO.md` (105 tareas «en pausa») y la colección `pedidos` del cuadro (194, todas aplicadas).

### 2a. Nevera «Después de la 1.0», por área
**Batallas**
- Arqueros y honderos contra la falange a pie; brazos que no atraviesan escudos ni picas; rival a pie con soldados de Meshy (P186–P188).
- Maquetas de luz y hora del día (CR4, CR4b) y «motor de lucha» (CB1), acabadas solo como maqueta.
- Elefante que empuja: tus filas reculan y se doblan (FE3).
- Regla del 15 % también con caballería, falange y hoplitas; hoplitas y Batallón Sagrado bajan a pie con lanza corta.
- Jinete con movimientos propios (caballería y elefantes con el soldado nuevo).
- Pellizcar para acercar la cámara en la batalla.
- Escaramuzas como Rome II: hora y clima, presupuesto en monedas, batallas históricas con escenario.
- Batallas famosas (Heraclea, Cannas, Zama), retos y medallas; edificio sanitario; mezcla libre de pueblos.
- Asalto a la muralla completo (escalas, torres, ariete, calles), refuerzos, emboscadas, clima, máquinas, minimapa, repetición, modo foto (BG1; sin confirmar).
- Batalla dentro de la ciudad (P161; estudio rescatado en rama).
- Asedio entero de las ciudades (L10).
- Detalles de mando «como Rome II»: brillo bajo la tropa, ruta de la orden, minimapa, avisos del asesor, portaestandarte (P163).
- Más tipos de tropa: de 20 a ~35 (P159).
- Más civilizaciones jugables: Cartago primero (P160).
- Tarjetas de tropa con dibujo de tinta propio (P162).
- Guerra «como Rome II», el resto tras GM22 (P158/GM42).
- Dificultad que cambie también al enemigo (V10a).
- Escaramuza combinada: ES5 (flanco débil, arte de itálicos y tiradores).
**Ciudades**
- Calibrar el camino de la ciudad con bots que crezcan, hasta 4–7 de 10 (CE12).
- Mirar por qué Aníbal toma Roma hacia el 216 a.C. con 600 de guarnición.
- Embellecer la ciudad (CD6).
- Pulido de la ciudad (CI1c): casas sin cuadrícula, río, arco, templo, granja.
- «Más ciudad de verdad» y dos mapas: el vivo y una Roma grande (Roma 3D, RM1–RM7).
- Ciudad «tipo Nova Roma» (P164; tres decisiones pendientes).
- Ciudad griega y púnica de su siglo (CI2).
- Edificios: estudiar, rehacer y crear nuevos; herrería, campo de entrenamiento, mercenarios; con Meshy (ED0).
- Bot que ponga servicios (baños, mercados); el asesor aún habla de la «bandeja».
- Detalles del mapa: sitio con colonos que se esconde, fecha partida en dos líneas.
**Política**
- Calibrar el camino de la política con bots (Senado activo) hasta 4–7 de 10 (CE12).
- Camino de la ciencia (CE11), fuera de la 1.0.
- Senado: nombres de cónsul (SN3), dictador, triunfo y fama, pantalla de resultado más rica, títulos largos.
- Votaciones de verdad con hemiciclo (maqueta MR1-4).
- Plan del año; senadores en 3D; otras formas de ganar.
- Imagen de época (moneda, relieve, mosaico) en cada suceso y en el Senado (P158); vídeos con piezas de museo (P165).
**Mapa y menús**
- Pequeños de aspecto: hoja de Escaramuzas, aviso de pausa, «Pirro» y «Tu manípulo» cortados, aviso tapado.
- Mundo más ancho: ~45 ciudades (P183).
- Mapa hacia Grecia y el Egeo (P175).
- Mapa libre (C14, GM25a–h).
**Arte**
- Texturas de Poly Haven (CC0) para ciudad y suelo (aprobado «Ok»).
- Aspecto griego: tropas y edificios (P173); ciudades y cultura griegas (P174); modo Grecia y mitología (MG1).
- Meshy no obedece negaciones: galo afeitado desde imagen libre; piel de lobo del vélite aparte.
- Galo nuevo y realista con tatuajes (AR1), espera créditos de Meshy.
- Idea de suavizado de movimientos (`ai-3d-animator-skill`).
**Gobierno**
- Medir las skills con `skill-creator` antes de cambiarlas.
- Control de gasto según el catálogo awesome-claude-code.
- Auditoría: piezas sin identificador estable.

### 2b. Lo que espera al usuario o está sin aprobar
- «Sin confirmar» en OBJETIVOS: ¿una sola política (Senado del juego o maquetas «Gobierno por turnos»)? ¿Roma 3D, modo Grecia, Egeo?
- BG1 asalto a la muralla: propuesta del director sin confirmar.
- Nova Roma (P164): tres decisiones antes de abrirla.
- Maquetas viejas de batalla (GM2, GM7, GM8, GM9) «esperan prueba» desde el 16/11: probablemente superadas por el motor nuevo.
- Mini guía de juego (`GUIA-JUGAR.md`): rehacer tras la batalla nueva en campaña.

### 2c. Lo que la 1.0 deja a medias o con riesgo
- Caminos: con los bots se gana por armas y comercio; ciudad y política 0 de 10.
- Aníbal toma una Roma que no recluta hacia el 215 (decidido: así se queda).
- Tu prueba en el móvil (fluido y sin red): la última, el 13/11.
- Hoplitas y Batallón Sagrado no bajan a pie; 15 % sin caballería, falange ni hoplitas.
- Física en la escaramuza: 1,31 ms por paso (tope 1 ms).
- Descarga 55,6 de 56 MB: no cabe más arte sin subir el tope.
- Meshy sin créditos hasta el mes que viene.
- Jueces completos ~1 h; el bot investigador se pasa de plazo; «Construir un edificio» falla a veces.
- Gasto real ×1,5 a ×2,7 sobre lo previsto; límite semanal de uso en aviso.
- Tablero: 105 tareas «en pausa», muchas de carriles viejos que el motor nuevo ya dejó atrás.

### 2d. Decisiones que marcan el rumbo (resumen)
EL JUEGO (cita en OBJETIVOS); caminos de victoria sin plazo, 2 de 3 en la 1.0; un juego, un menú, aspecto antiguo;
arte solo libre (0 A.D., Meshy publicado CC BY-SA 3.0, CC0); batalla «tipo Rome II» con el bloque y un solo motor a
pie; ciudad desde arriba, pantalla mínima, agricultura y mercado; construir hasta parecerse a las referencias, sin
tiritas; solo Opus; ministerios «A»; cadenas sin supervisión y subidas con jueces APTO; descarga hasta ~56 MB.

## 3. Metas de la 2.0
**Versión 2 (25/11), tras la idea central del usuario.** Decidido: **800 a.C.** «(Recomendado)»; **«Solo Grecia»**;
**«Tu comarca aleatoria (Recomendado)»** (el terreno de tu ciudad cambia cada partida según la región; el Mediterráneo
sigue real). La campaña Roma contra Cartago (280–146) queda jugable y en pausa. La versión 1 (5 metas sueltas) queda
sustituida.

En una frase: *eliges Grecia, empiezas en el 800 a.C. con un ágora y unas casas en una comarca nueva cada vez, y
levantas tu polis hasta ganar.* Se reutiliza de la 1.0: construir, ministros, gobernador, clases y necesidades,
agricultura, mercado, caminos de victoria y batallas a pie (falange, hoplitas).

| Meta | Terminada cuando… | Tamaño |
|---|---|---|
| **M1 · Empezar de cero** | (1) Menú: Continuar · Partida nueva · Escaramuzas · Opciones; Partida nueva → Grecia o Campaña «en pausa». (2) Eliges Atenas, Esparta o Corinto. (3) Comarca aleatoria según la región. (4) Arranque: ágora, 5–8 casas, 100–200 personas, materias básicas. (5) Tiempo solo por estaciones, por turnos: cobras al empezar, «Pasar estación». (6) Dos vistas: «Desde arriba» y la ciudad 3D por la que te mueves; necesidades encima. (7) Se ve construir (andamios, obreros) y entrenar (reclutas en el cuartel) durante la estación. (8) Jueces rápidos (≤15 min) y liga de bots desde partidas avanzadas. (9) Críticas a la 1.0 arregladas | **Grande** (creció: era «Medio») |
| **M2 · La polis crece** | Ciudad viva griega rehecha desde cero (la de Roma se siente artificial); la levantas tú o delegas en ministros; crece y pide por clases; edificios griegos con aspecto propio, ninguno repetido; militares (herrería, campo de entrenamiento, mercenarios); tres épocas que cambian el aspecto (barro y madera → mármol); bella (nota ≥ 7); texturas Poly Haven; descarga hasta ~80 MB; Meshy cuando haya créditos | Grande |
| **M3 · Ejército y comercio desde la ciudad** | Las tropas salen de tus edificios; comercias con tus vecinos (mercado y agricultura de la 1.0, en griego) | Grande |
| **M4 · Ganar** | Se gana por armas, comercio, política, ciudad y ciencia en esta partida; política griega (asamblea, consejo, arcontes); los bots logran cada camino 4–7 de 10; imagen de época en sucesos | Grande |
| **M5 · Guerra** | Las batallas de la 1.0 enganchadas a la partida (hoplitas, falange), también en Escaramuzas, y un asedio corto | Medio |

### Estándar de M1 (borrador, 25/11)
| Qué se mide | Quién lo mide | Aprueba si… |
|---|---|---|
| Menú nuevo | Juez de pantalla 390 px | Continuar, Partida nueva y Escaramuzas a la vista; campaña con «en pausa»; ≤ 3 toques hasta empezar; botones ≥ 44 px |
| Elegir polis | Juez de pantalla y bot de reglas | ≥ 8 polis; cada una distinta en ≥ 2 cosas (rasgo, edificio, tropa) con su ficha; todas sobreviven con el bot |
| Mapa vivo | Juez de aspecto | Nota ≥ 7 frente a referencias (mapa de campaña tipo Total War): relieve, agua, ciudades vivas |
| Recursos en el mapa | Bot de reglas | Cada básico en ≥ 3 zonas; cada lujo en 1–3 ciudades; sin comercio ni conquista no hay lujo; conquistar una ciudad da su recurso |
| Departamento de Arte de Mapas | Vigía | Guía propia, archivos suyos en areas.json y su juez |
| Comarca aleatoria | Bot de reglas, 20 comarcas | 20 distintas, 20 con agua, cultivo y sitio para el ágora, coherentes con la polis |
| Arranque mínimo | Bot de reglas | Ágora, 5–8 casas, 100–200 personas, materias básicas |
| Primeros minutos | Bot «jugador nuevo» | ≥ 5 cosas que hacer en 10 min; siguiendo al asesor nadie pasa hambre |
| La polis aguanta | Liga de bots | Sobrevive 30 años en 8 de 10 con bot normal |
| Solo estaciones | Bot de reglas | Sin reloj, meses ni caja del mes; cobro al empezar la estación; cada obra y tropa acaba cuando toca |
| Se entiende el turno | Juez de pantalla | Hoja de inicio de estación (recogido y lo que acaba); «Pasar estación» siempre a la vista |
| Dos vistas | Juez de pantalla | Solo dos; cambio en 1 toque; necesidades encima |
| Ver construir y entrenar | Juez de pantalla, antes y después | Andamios y obreros; edificio hecho al pasar (a medias si dura 2); reclutas en el cuartel, tropa formada al pasar |
| Fluidez | Juez de fluidez | Sin bajar con 5 obras y 3 tropas a la vez |
| Jueces rápidos | Cada subida | ≤ 15 min |
| Aspecto arcaico | Juez de aspecto | Nota ≥ 7: barro, madera, adobe y tejas |
| Críticas a la 1.0 | Antes/después y el usuario | Cada una arreglada; su «Bien» |
| En su móvil | El usuario | Fluido y sin red |

Decidido después (25/11): **«Una polis real»** (eliges Atenas, Esparta o Corinto y la levantas desde la aldea, cada una con su carácter) y **«Sí, con 3 épocas (Recomendado)»** (arcaica → clásica → helenística: del barro y la madera al mármol; abre edificios, tropas y saberes).

Cada meta lleva su **estándar** (qué se mide, quién lo mide, valor para aprobar); se escriben meta a meta con el usuario.

**Cambia una regla de CLAUDE.md** (época 280–146 a.C.): la Partida nueva va del 800 a.C. en adelante; el vigía la
cambia al aprobarse el plan. Historia: fichas nuevas de la Grecia arcaica con fuente y dictamen.

## 4. Orden — plan socialista de M1 (diseño, 25/11; sin construir)
Pedido literal: «Pero diseña el /plan-socialista de la m1 para ver cómo quedaría antes. Igual el mapa vivo podría
ayudar fable a hacerlo». Modelo: Opus en todo (regla del 23/11), salvo lo que el usuario decida para el mapa vivo.
M = millones de tokens (`gasto.mjs`). «Esperable» = declarado × 1,5–2 (medido en la 1.0: ×1,51 de media, hasta ×2,7).

| Tanda | ID | Qué verás | Área | Tamaño · agentes | M decl. (esperable) |
|---|---|---|---|---|---|
| 1 Jueces | J20a | Subidas en ≤15 min | Gobierno | Medio · constructor + revisor | 1,5 (2–3) |
| 1 Jueces | J20b | Cifras de la liga de bots en el cuadro, desde partidas avanzadas | Gobierno | Grande · constructor + revisor | 2,0 (3–4) |
| 2 Tiempo | ES20 | Solo estaciones: cobras al empezar, hoja de estación, «Pasar estación» | Cerebro (comunes) | Grande · constructor + revisor + verificador | 2,0 (3–5) |
| 3 Partida | PN1 | Menú: Continuar · Partida nueva · Escaramuzas · Opciones; campaña «en pausa» | Músculo | Medio · constructor | 0,8 (1–1,5) |
| 3 Partida | PN2 | 8 polis con su cultura (rasgo, edificio o tropa reciclada) y ficha | Cerebro + Historia | Medio · constructor + revisor | 1,5 (2–3) |
| 3 Partida | PN3 | Comarca aleatoria y arranque con ágora, 5–8 casas y 100–200 personas | Cerebro + Arte | Grande · constructor + revisor + verificador | 2,5 (4–5) |
| 4 Ciudad | VI1 | Dos vistas: «Desde arriba» y la ciudad por la que te mueves | Cerebro | Pequeño · director | 0,6 (1) |
| 4 Ciudad | VI2 | Andamios y obreros en las obras; reclutas entrenando | Cerebro + Arte | Medio · constructor + verificador | 1,5 (2–3) |
| 5 Mapa | AM0 | Departamento de Arte de Mapas montado (guía, archivos, juez) | Gobierno | Pequeño · director | 0,4 (0,5) |
| 5 Mapa | AM1 | Diseño y maqueta del mapa vivo, con capturas, para que el usuario elija | Arte de Mapas | Medio · diseñador | 1,0 (1,5–2) |
| 5 Mapa | AM2 | Mapa vivo construido (relieve, agua, ciudades vivas, Grecia con sus polis) | Arte de Mapas | Grande · constructor + verificador | 2,5 (4–5) |
| 5 Mapa | AM3 | Recursos por zonas; lujo solo en algunas ciudades; por comercio o conquista | Cerebro + Arte de Mapas | Medio · constructor + revisor | 1,5 (2–3) |
| 6 Críticas | CR20 | Lo que critique de la v171, arreglado | Según la crítica | Según la crítica | (por fijar) |
| Subidas | SB20–SB24 | Cada tanda en su móvil, con jueces rápidos | Gobierno | Pequeño · director | 5 × 0,4 |

**Decidido por el usuario (25/11)**: Fable para el mapa vivo: **«Fable diseña y construye»** (AM1 y AM2 con Fable;
excepción a «solo Opus»; más caro: medirlo). Reparto: **«Sí, que empiece (Recomendado)»**.

**Total M1**: ≈ 20 M declarados; esperable 30–40 M. Sin las críticas.

**Carriles a la vez** (nunca dos en los mismos archivos): (a) Gobierno: J20a → J20b → subidas; (b) Cerebro, dueño de
los comunes: ES20 → PN2 → PN3 → VI1 → VI2 → AM3; (c) Músculo: PN1 (pase a los comunes); (d) Arte de Mapas: AM0 → AM1 →
AM2, desde el primer día (archivos propios del mapa). Puntos de espera: PN3 necesita ES20; AM3 necesita AM2 y PN2; las
partidas avanzadas griegas de la liga llegan con PN3.

**Riesgos**: ES20 cambia la economía entera y el guardado (re-equilibrar con la liga); los comunes (`game.js`, `data.js`,
`ui.js`) son el cuello de botella; la comarca aleatoria es técnica nueva; el mapa vivo pesa en la descarga (tope ~80 MB).

## 5. Lo que queda fuera de la 2.0
Propuesto (versión 2), en debate: mejoras de la campaña Roma contra Cartago (en pausa); Roma, Cartago y otras
civilizaciones jugables (P160); mundo de 45 ciudades (P183); Roma 3D (RM1–7); mapa libre (C14, GM25); batallas
históricas (ES0); batalla dentro de la ciudad (P161); mitología (MG1); Egeo (P175); tarjetas de tinta (P162); vídeos con
piezas de museo (P165); luz y hora del día (CR4); Nova Roma (P164). Gobierno (skills, gasto, auditoría): lo hace el vigía
si sobra, no es meta del juego.
