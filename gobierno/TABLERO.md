# Tablero de AQVILA

Lo pendiente, por carriles. Cada tarea es independiente para poder trabajarse en una sesión corta.
Estado: ⬜ por hacer · 🔶 a medias · ✅ hecho. Al cerrar una tarea, se apunta aquí en una línea y se quita el detalle.

## Hecho hasta el 11/11/2026
✅ Campaña 280–146 a.C. con 18 ciudades, hechos históricos y final · ✅ Batallas 3D con unidades reales animadas
(infantería, caballería, elefantes) · ✅ Mapa 3D · ✅ Ciudad 3D con edificios reales, ciudadanos y guarnición visible ·
✅ Población, mercado y puerto · ✅ Suelo con texturas, agua animada, sombreado de edificios · ✅ Ciudad con trazado romano (cardo, decumano, foro,
cuatro puertas) y edificios de materiales junto a bosque, ladera y campos · ✅ PWA offline.

## Dirección del usuario (11/11/2026)
- Dos sistemas: **ciudad/economía** propia (recursos, mercado, mar) y **guerra** aparte tipo Rome 2 Total War.
- Mezcla buscada: Travian/Ikariam (recursos → mejorar materiales → muchas tropas → **saquear a otros jugadores** para
  ganar materiales) con toques de Age of Empires / Age of Mythology. Solo ideas, nunca su código ni su arte.
- **Sistema de arte acorde a la época y a la historia**, coherente en todo el juego.
- Vistas a varias escalas: mapa grande → ciudad → calles con ciudadanos → ejército con su tamaño real.
- Los edificios de materiales van **junto a su recurso natural**; la ciudad amurallada, **históricamente fiel**.

## Carril A — Guerra (tipo Total War)
- ✅ A1 Formaciones de verdad: absorbida por N7 (12/11).
- ✅ A2 Absorbida por N8 (12/11): posturas «listo» y «relajado», falange inclinada, testudo bajo, por código.
- ✅ A3 **Combate que se ve** (11/11): los tiradores descargan 6–8 s antes del choque; en el cuerpo a cuerpo solo pega el frente; la caballería persigue y mata a los que huyen, arrolla a ligeros y carga por flanco o espalda. Las batallas igualadas duran 8–9 min; el bot agresivo gana 7 de 10.
- ✅ A4 **Papeles de la infantería** (11/11): ligera, media, pesada y lanceros por unidad, con daño por arma y armadura; los lanceros frenan la carga de caballería; la marca sale en la carta del regimiento. Bot agresivo 8 de 10.
- ✅ A9 **Formación de salida y paso de marcha** (11/11): los dos bandos salen con infantería delante, tiradores detrás y caballería en las alas; avanzan juntos a paso de marcha (la mitad que antes) y solo corren o cargan cerca del enemigo; los tiradores disparan por encima y no entran al cuerpo a cuerpo mientras aguante su infantería. Vélites detrás: licencia de juego.
- ✅ A5a **Despliegue antes de la batalla** (11/11): la batalla empieza parada; tocas un regimiento y luego el campo para colocarlo dentro de tu zona (línea roja), o eliges «Clásica», «Ancha» o «Centro» de un toque, y pulsas «Empezar batalla». El enemigo sale siempre en formación clásica.
- ✅ A5c **Arrastre y más formaciones en el despliegue** (11/11): arrastras el regimiento con el dedo (3D y vista plana) y hay seis formaciones de un toque: Clásica, Línea, Ancha, Tres líneas, Centro y Alas fuertes.
- ✅ A5b **Terreno con efecto: colina y bosque** (11/11): cuatro campos (llano, colina, bosque, mixto), uno por ciudad; en lo alto se pega más y se dispara más lejos, el bosque frena, protege de flechas y quita fuerza a la carga. Contorno en tu zona durante el despliegue.
- ✅ A8 **Ritmo y moral** (11/11): batallas igualadas de 8 a 12 minutos, sin corte a los 4; moral gradual; cansancio con marca «Cansado».
- ⬜ A8b Ajuste fino del ritmo con partidas del usuario: las muy desiguales duran unos 2,5 min y las algo desiguales 7 a 8; revisar si la calidad de tropa pesa demasiado (exponente 0,85).
- ✅ A6 Absorbida por N8 (12/11): cámara «Seguir», sonido por código, proyectiles con arco y polvo nuevo.
- ✅ A7 Ciudades enemigas con edificios de su cultura (11/11/2026): en la batalla, si defiende Cartago, un pueblo griego, los galos o los íberos, su ciudad se pinta con sus propios templos o centros de 0 A.D. (`piezaCultura` en `js/gfx/statics.js`, 5 líneas en `buildRealCity` de `js/gfx/battle3d.js`). Etruscos, campanos y mamertinos siguen con lo romano. Las casas siguen siendo romanas. Parte: `partes/2026-11-11-A7.md`.

## Carril B — Ciudad y economía (tipo Travian/Ikariam)
- ✅ B1 Recurso especial por ciudad (11/11): nueve bienes (sal, vino, caballos, hierro de calidad, plata, mármol, púrpura, madera naval, pieles), uno por ciudad y sin contador nuevo; tenerlo da una ventaja pequeña y cuatro de ellos abren triarios, équites y los niveles 7 a 10 de varios edificios.
- ✅ B2 Rutas comerciales (11/11): desde una ciudad con mercado abres ruta con una vecina propia o firmas un tratado con una ajena (100 de oro); da oro cada mes y el tratado da acceso al bien de esa ciudad; se rompe si hay guerra. En el mapa, trazo dorado con un mercante (barco o carro).
- ✅ B3 Felicidad e impuestos (bajo, normal, alto) por ciudad.
- ✅ B4 Termas, acueducto y anfiteatro con sus reglas; en 3D llevan un modelo provisional hasta E4.
- ⬜ B5 Marina: flotas, batallas navales o bloqueo.
- ✅ B6 Equilibrio: el bot de pruebas toma Cartago en 6 de 10 campañas; sin cambiar números del juego.

- ✅ B7 Saqueo (11/11): al atacar eliges «Solo saquear»: botín según riqueza, almacén y muralla de la ciudad enemiga, sin conquistarla y con las tropas de vuelta; una ciudad saqueada hace poco da el 40 %. Los rivales también saquean: la mitad de sus incursiones no conquistan, te llevan el 20 % de lo que el almacén no esconde (120 por nivel de almacén y recurso).
- ✅ B8 Herrería: mejoras de armas y armaduras, +5 % por nivel (máx. +25 %).
- ✅ B10 Aníbal suavizado: 20 % menos de tropas y dos meses más de marcha; el bot gana 8 de 10 y Roma ya no cae.
- ✅ B9 Roma con el Tíber y una colina (versión simple; las demás ciudades, igual).

## Carril F — Modos de juego (decisión del usuario, 11/11/2026)
- ✅ F1 Diseño de modos decidido: campaña histórica como base del modo largo, primero la partida corta, tres dioses (Marte, Ceres, Neptuno). `gobierno/estudios/F1-modos-de-juego.md`.
- ✅ F2 Sustituida por I2 (mapa por turnos; decisión del 11/11).
- ✅ F3 Aldeanos: reparto entre madera, piedra, hierro y grano (en la vista de lista).
- ✅ F5 Templos a un dios (11/11): un templo por ciudad, ocupa solar, y se dedica a Marte (moral al defender), Ceres (+8 % de grano por nivel) o Neptuno (mar más rápido, oro del puerto). Las ciudades conquistadas están inquietas 8 meses (producen menos) y se rebelan si la felicidad cae bajo 40; el templo las calma antes.

## Carril I — Gran diseño, fase 1 (aprobado 11/11/2026; informe `gobierno/estudios/G3-gran-diseno.md`)
Orden: I1 primero y sola; después I2 a I5 (no se pisan si van de una en una); I6, I7; I8 al final.
- ✅ I1 Registro de piezas: `js/registro.js` (84 fichas con arte y fuente) y juez `node gobierno/fichas.mjs`, dentro de los jueces.
- ✅ I1b Fichas del registro al día (11/11/2026): 54 históricas, 10 probables, 15 licencia de juego y 30 por cotejar (antes 0/0/16/93); el Códice lee sus textos del registro, sin duplicados (P55). Parte: `partes/2026-11-11-I1b.md`.
- ✅ I2 **Mapa por turnos** (11/11): una estación (3 meses) = un turno; botón «Pasar turno» y «Consejo de estación»; las marchas llegan al cambio de estación y los rivales mueven en cada turno; ciudad y batalla siguen en tiempo real. Pieza para otros: `G.pasarTurno`, `G.finTurno`, `G.consejo`, `G.turnosFaltan`, evento `turno`. Parte: `partes/2026-11-11-I2.md`.
- ✅ I3 **Mano de obra y mantenimiento** (11/11): la producción depende de la gente que queda en la ciudad (reclutar vacía los campos); edificios y tropas cuestan oro cada mes; sin oro, las tropas desertan.
- ✅ I4 **Tipos de ciudad con solares limitados** (11/11): 7 a 10 solares por ciudad para los edificios urbanos (campos y muralla no ocupan); seis tipos a elegir (municipio, colonia agraria, colonia militar, emporio, base naval, ciudad de artesanos); «Derribar» libera un solar.
- ⬜ I3b **La paga de las tropas se cobra de verdad** (aprobada 12/11, ≈0,5 M; antes de I5b): hoy, con el oro a cero, la paga de las tropas se evapora (unos 252 oro/mes en una campaña del bot); pasa a cobrarse o a generar deuda con consecuencias (deserción, Senado). Cambia los resultados de los bots: reajustar (agresivo ≥6/10, pasivo 0/10). Toca `js/game.js` (G.tick y G.cierreMes).
- ⬜ I5 **Saber: investigación y edades** (P47, rediseñada el 12/11 por `estudios/P93-ciencia.md`, decisiones del usuario en §11 del estudio; ≈2,2 M): 22 saberes en 4 ramas (Campo, Oficios, Guerra, Mar) y 4 edades, con 6 pares «o tú o yo»; una cola de estudio; **precio fijo con tope (decisión del usuario, 12/11)**; techos en cada bono; pantalla «Saber». Sustituye a F4. Va sola sobre `js/game.js` y `js/data.js`.
- ⬜ I5b **Escuela y sabios** (P93, aprobada 12/11; ≈1,8 M; tras I5): edificio que se abre al investigar «Preceptores griegos»; destinas gente a estudiar (más sabios, más rápido, pero cada uno rinde menos y cobra más: la paga sube con el total de sabios y se cobra cada mes). Cuesta oro, impuestos, un recluta y un solar. Calibración con `tools/calibra-saber.mjs`.
- ⬜ I5c **Ciencia en combate y rival** (≈1,2 M; tras I5b): ganchos de batalla; el rival no investiga pero copia por bando la mitad de tu ventaja en armas, moral y murallas (Polibio 3.87). Toca `js/battle.js`.
- ⬜ I5d **Reformar y afinado** (opcional, ≈1 M; tras jugar el sistema): cambiar de saber pagando el coste completo; afinado con medida real y cotejo de citas.
- ✅ I6 **Región de Italia** montada solo con fichas (12/11): `D.REGIONES`, `G.newGame(nombre, región)`, mapa que oculta lo de fuera, botón «Región de Italia». Cómo definir una región: parte I6.
- ✅ I7 Fundida en J3 (capital y pueblos; decisión del 11/11).
- ⬜ I8 **Partida corta** (P49): fundas de cero, un rival, un final. Sustituye a F1b. 0,25 + 0,8 M · 25 min. Después de I2 a I7.

## Carril J — Interfaz y territorio (aprobado 11/11/2026, P58 a P62)
- ✅ J1 **Pantalla limpia** (11/11): maqueta B elegida por el usuario; dos modos Gobierno/Guerra, fila fina de recursos, tira de vistas y tres botones redondos abajo; sin barra de pestañas. Parte: `partes/2026-11-11-J1.md`.
- ✅ J2 **Obras de un toque** (11/11): hecha dentro de J7 (cola de obras y filas deslizables en Imperio).
- ✅ J6 **Ciudad como pantalla principal** (11/11): ciudad 3D a pantalla completa, medallas de bronce con nivel, ficha única con consejo, pestañas Ciudad/Gobierno/Imperio. Parte `partes/2026-11-11-J6.md`.
- ✅ J7 **Parte densa: Imperio y Obras** (11/11): pestaña Imperio con ciudades por urgencia, filtros, resumen de población y ánimo, cola de obras, filas deslizables y «Hacer lo mismo en…». Parte `partes/2026-11-11-J7.md`.
- ⬜ J7b **Pestañas también en el mapa de guerra** (sacada de J7; esperar a que I2 Mapa por turnos termine con `js/game.js` y el mapa).
- ⬜ J3 **Capital y pueblos** (P60; incluye I7): cada territorio tiene una capital con los edificios de gobierno y pueblos de recursos, pescadores y agricultores-ganaderos. Los pueblos producen; la capital gobierna, recluta y comercia. 0,3 + 1,0 M, en dos tareas. Después de I6.
- ⬜ J4 **Mapa más grande por regiones** (P62; amplía I6): más ciudades y territorios, cada región con su capital y sus núcleos pequeños; lista de ciudades con fuente histórica; vigilar la fluidez. 0,3 + 1,2 M, en dos o tres tareas. Después de J3. **Incluye** crear Perusia, Clusio y Rusellae (H11c, madera naval, Livio 28.45). Idea para bajar de nivel (Mare Nostrum › región › ciudad, con «volver»): `estudios/R20-niveles-de-mapa.md` (solo la idea, sin código del kit; 12/11).
- ⬜ J5 **Política territorial** (P61): apartado «Senado» con planes de infraestructuras, ciudadanía, ejército, diplomacia y mercado. Primero informe corto de diseño con fuentes; se une con I5 y C3. 0,3 + 1,0 M, en dos tareas.
- ⬜ J8 **Foro y chips** (P65, aprobada 11/11 desde el cuadro): discursos y revueltas en el Foro por clases sociales; chips verde/rojo con el efecto de cada decisión por clase. Va con J5, después de J6 y J7.

## Carril K — Concurso de diseño de interfaz (pedido 11/11/2026)
- ✅ K1 **Concurso Gobierno** (11/11): cinco maquetas verticales y jurado ciego. Ranking: Cartas 73, Tablero 70, Senado 65, Cursus 63, Crónica 61. Informe `estudios/K-concurso.md`.
- ✅ K2 **Concurso Guerra** (11/11): cinco maquetas horizontales y jurado ciego. Ranking: General 72, Trazo 69, Partitura 60, Arena 60, Cartas 59.
- ✅ K4 **Concurso Guerra 2** (11/11): Legado 60, Fantasmas 55, Estandartes 53, Miniaturas 50, Mosaico 46. Informe `estudios/K2-concurso.md`.
- ✅ K5 **Concurso Gobierno 2** (11/11): Ciudad 61, Tabularium 60, Lentes 56, Domus 52, Foro 44.
- ⬜ K3 **Construir los ganadores**: elegido el 11/11 (ver bitácora: Ciudad + Tabularium, Legado + Estandartes); falta aprobar las tareas P63 a P66 (decide él: cambio grande de aspecto). Lo que cambie en `js/ui.js` y `js/gfx/` lo estima cada nota de `maquetas/concurso/`. No empezar antes.

## Carril L — Interfaz de guerra: Legado + Estandartes (P66, aprobada 11/11/2026; en paralelo al carril J)
Maquetas: `maquetas/concurso2/K2-guerra-B-legado.html` y `K2-guerra-D-estandartes.html` (notas y capturas `K2-guerra-*`). Toca `js/ui.js` (solo lo de batalla), `js/gfx/battle3d.js`, `css/style.css`; no `js/battle.js` salvo leer.
- ✅ L1 **Órdenes dibujadas y orden recomendada** (11/11): trazo con el dedo → cargar/avanzar/flanquear/retirar; botón dorado con la orden recomendada; HUD con moral, minimapa y grupos. Pendiente L1b: testudo (no existe en `battle.js`), vista 2D de reserva y vertical.
- ✅ L2 **Estandartes y alas** (11/11): moral y cansancio en la tela del estandarte; alas Línea, Reserva, Ligeros y Jinetes con corchete dorado; tocar un ala la elige y la orden va a todos sus regimientos. Pendiente: 20+ regimientos sin medir, estandartes en huida solo en tarjeta.
- ✅ L3 Fantasmas en pausa y atajos: absorbida por N7 (12/11).

## Carril N — Guerra nueva: «planeas y luego miras» (pedido 11/11/2026; diseño `gobierno/estudios/N1-guerra-nueva.md`)
- ✅ N1 **Diseño y maqueta jugable de la guerra nueva** (11/11): batalla por rondas (plan en pausa, ejecución para los dos), 4 puntos de mando, sombras, relevo y enemigo con tres planes. Maqueta `gobierno/maquetas/guerra-nueva.html`; parte `partes/2026-11-11-N1.md`. En pausa hasta que el usuario decida: L3, A1, A2, A6 y A8b.
- ✅ N1b **Guerra ampliada con ingeniería reversa** (11/11): siete estudios (R8 a R14: Rome II, Field of Glory II, Frozen Synapse, Combat Mission, Ultimate General, Imperator, Hegemony), diseño `estudios/N1b-guerra-ampliada.md` y capturas de la vista 3D real con la interfaz nueva (`capturas-tarea/N1b-*.jpg`). Parte `partes/2026-11-11-N1b.md`.
- ✅ N2 Rondas y vista previa (12/11). Parte `partes/2026-11-12-N2.md`.
- ✅ N3 **Interfaz nueva de batalla** (12/11): estandartes con moral y cansancio dibujados, flechas por tipo de orden, fila de botones por orden, informe de ronda, saltos a cada ala; arreglado el panel que tapaba flechas y la elección tocando el estandarte. Parte `partes/2026-11-12-N3.md`.
- ✅ N4 **Estados, choque y contagio** (12/11): estado de moral único en el motor (Firme a Huye), desordenado pega peor, agotado no carga, contagio con tope de uno por ronda y sin reserva detrás, reagrupar con el general cerca, choque y melé, reglas propias de aguantar, hostigar, relevar y retirarse. Sin río (el terreno no lo tiene). Parte `partes/2026-11-12-N4.md`.
- ✅ N5 **General y mando** (12/11): 5 puntos de mando por ronda (2 sin general), radio dorado de 200 con órdenes que llegan 6 s tarde fuera de él, tres cartas por batalla (arenga, paso doble, cerrada), muerte del general. Parte `partes/2026-11-12-N5.md`. Cierra el primer bloque (N2 a N5).
- ✅ N14 **Campos amplios y relieve** (12/11): ancho variable (1200, 1500 con ejércitos grandes), cerro, río con tres vados, pantano y paso estrecho, campo según la ciudad, minimapa con la cámara. Parte `partes/2026-11-12-N14.md`.
- ✅ N6 **Enemigo que piensa** (12/11): el enemigo elige uno de cinco planes, hace un gesto visible por ronda con su línea de aviso, usa puntos de mando, radio, cartas y vados, reacciona con una ronda de retraso y no hace trampas; generales con carácter (astuto, impetuoso, prudente) y tres dificultades (Fácil, Normal, Difícil) que se eligen en el despliegue. Parte `partes/2026-11-12-N6.md`.
- ✅ N15 **Equilibrio y objetivos** (12/11): ancho de frente (tope de 1,5 atacantes por regimiento), levas bisoñas (milicia siempre; empiezan Vacilantes y se curten en 60 s), tres objetivos (resistir, tomar la zona, escapar con el general), dificultad fija en Normal y calculada por contexto (rival, terreno, general, táctica, fuerza, contras) con sus causas a la vista, y `test/equilibrio.js` que mide cientos de batallas. Queda ⬜ N15b: afinar (0,67× nunca gana; muy desiguales duran 7-15 min).
- ⬜ N15b **Segunda pasada de equilibrio**: con N7 y N8 hechas, repetir `node test/equilibrio.js`; que 0,67× gane algo con buen plan, acortar las muy desiguales, y que el campaña (game.js) rellene `sides[i].bis`, `gen.mando/disc` y `cfg.objetivo`.
- ✅ N7 **Relevos y formaciones** (12/11): testudo, cuña, orbe y falange con su «gana/pierde»; ancho y frente que se arrastran; marchar juntos; tres líneas I/II/III que se relevan (también solas); sombras a 10/20/30 s; atajos Testudo, Carga, Retirada y Refuerzo. Equilibrio igual que N15.
- ✅ N8 **Espectáculo** (12/11): polvo de carga y choque, jabalinas y piedras con arco que se clavan, manchas bajo los caídos, luz que se vuelve ámbar y bruma o lluvia, posturas, cámara «Seguir» con cinta y sonido sintetizado (interruptor en «Más»). Absorbe A2 y A6. Parte `partes/2026-11-12-N8.md`.
- ⬜ N9 a N13 **aprobadas enteras** (P74, 12/11; mando: puntos y radio del general): rondas y vista previa, interfaz nueva, estados y contagio, general y mando, enemigo que piensa, relevos y formaciones, espectáculo; ejércitos con general, forraje, asedios, exploración, después de la batalla; campos amplios y relieve. Unos 18 M; primer bloque N2 a N5 (hecho). Detalle en `estudios/N1b-guerra-ampliada.md` §6.

## Carril O — Economía nueva (pedido 11/11/2026)
- ✅ Q1 **Diseño de ciudad, gobierno y economía** (11/11): un solo modelo (caja del mes, almacén con tope, barrios, tres clases, Senado, Foro, provincias, aspecto), estudios R15 a R19 y cuatro capturas sobre la ciudad 3D. Diseño `estudios/Q1-ciudad-gobierno-economia.md`; carril Q propuesto en P75.
- ✅ Q1b **Ciudad nueva: plano itálico común** (11/11): estudio `estudios/Q1b-ciudad-italica.md` (dictamen: muralla cuadrada, anfiteatro, termas y acueducto de arcos fuera de época) y maqueta 3D `maquetas/ciudad-italica.mjs` con capturas `Q1b-0` a `Q1b-4` (antes, romana cerca y lejos, griega, púnica). Rechazada por el usuario el 12/11; la sustituye Q1b2.
- ✅ Q1b2 **Ciudad nueva, segunda vuelta al diseño** (12/11): estudio `estudios/Q1b2-ciudad-segunda-vuelta.md`, maqueta `maquetas/ciudad2/` (830 casas reales de 0 A.D. en manzanas, sombras, relieve con río, suelo con texturas, arrabales, vida) y capturas `Q1b2-0` a `Q1b2-5` (antes y después, romana, griega, púnica). 25 piezas nuevas en `maquetas/piezas/` (843 KB, fuera del juego). Pasa el tope de triángulos 3,5 a 5 veces. El usuario: «Sí, adelante».
- ✅ Q1c **Ciudad ligera y prueba en el teléfono** (12/11): la maqueta `maquetas/ciudad2/` baja de 1,07–1,50 millones a 184 000–276 000 triángulos por cuadro (recorte por cámara, casas y muralla lejanas ligeras, árboles en cartel, gente lejana ligera, sombras una vez, suelo más barato), con la ladera llena y el fondo con caseríos, arboledas y montes con detalle. Capturas `Q1c-0` a `Q1c-6`. Página de prueba con contador de fluidez: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/ciudad2/ · **falta que el usuario diga qué números ve en su móvil**; hasta entonces no se abre Q1d.
- ✅ Q1d **Suelo, relieve, luz y cielo en el juego** (12/11): la ciudad del juego se asienta en el relieve de la maqueta (dos lomas, vaguada, río con puente), con suelo de texturas mezcladas, sol bajo con sombras calculadas una vez, bruma, cielo y montes con detalle. Edificios, solares, medallas y guarnición siguen funcionando. Capturas `Q1d-1` a `Q1d-3`. Roma pinta 435 000 triángulos (antes 496 000; tope 300 000): pesa la guarnición.
- ✅ Q1k **Ciudad nueva de cero: diseño y maqueta jugable** (12/11): diseño `estudios/Q1k-ciudad-de-cero.md` (tú colocas lo público; casas y calles nacen solas; barrios por radio; crecidas e incendios), ficha `historia/fundacion-de-colonias.md` (APTO CON NOTAS) y maqueta que se toca en el móvil `maquetas/ciudad3/` (fundar con el surco, nueve fichas con mapa de sitio en verde y rojo, casas de cuatro niveles, muralla, barrios). Capturas `Q1k-1` a `Q1k-6b`. 48 000 a 137 000 triángulos (282 000 en el cuadro que recalcula la sombra). No toca el juego. Prueba: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/ciudad3/ · **falta que el usuario la pruebe y decida** (P80 a P82).
- ✅ Q1l **Lluvia de ideas e informe de competencia para la ciudad nueva** (12/11): 84 ideas de seis modelos baratos, ordenadas en nueve paquetes (`estudios/Q1l-lluvia-de-ideas.md`), e informe de competencia con diez palancas (`estudios/Q1l-competencia.md`). Salen como P83 a P91, por aprobar. El usuario aprobó la manera de jugar de la maqueta Q1k.
- ⬜ (sustituida por CN3/CN4, 12/11) Q1e **Casco denso con casas reales y muralla irregular** (2,5 M): las casas nuevas pasan a `assets/` (tope de descarga 37 MB), manzanas pegadas a las calles, arrabales, tumbas y granjas.
- ⬜ (sustituida por CN4, 12/11) Q1f **Los solares del juego dentro de la ciudad nueva** (1,5 M): dónde se construye, cómo se toca un edificio, etiquetas.
- ⬜ (en pausa desde el 12/11) Q1g **Edificios de época** (1,2 M): fuera anfiteatro, termas y acueducto de arcos; sus sustitutos y sus fichas.
- ⬜ (en pausa desde el 12/11) Q1h **Culturas** (1 M): griega y púnica con sus casas sin pisarse, y muralla, mercado y stoa propios (retoque pedido).
- ⬜ (sustituida por CN11, 12/11) Q1i **Vida** (0,8 M): gente, humo, toldos, carros, ganado, pájaros, sombra de nubes.
- ⬜ (en pausa desde el 12/11) Q1j **Revisión histórica** (0,6 M): cotejar las citas pendientes.
- ✅ Q2 **Caja del mes y cierre** (12/11): la caja es lo gastable del mes; al cerrar el mes lo que sobra va al almacén hasta su tope y el resto se pierde (con aviso); del almacén solo se saca un cuarto al mes; informe de la estación al pasar turno. Migrado en `G.load`. Parte `partes/2026-11-12-Q2.md`.
- ✅ Q3 **Cuentas del mes en pantalla** (12/11): ficha «Cuentas» (barras por material, oro con ingresos y gastos, aviso con «Vender en el mercado» y «Adelantar obra»), colchón inicial de 200 en el almacén, aviso de pérdida al empezar la estación. Parte `partes/2026-11-12-Q3.md`.
- ✅ Q4 **Obras y reclutas a plazos** (12/11): una obra o recluta de varios meses paga una cuota por mes (la 1ª al empezar, el resto al cierre de mes, de la caja); si no alcanza, se detiene hasta que haya. Comprometido y fila «Obras y tropas» reflejan los plazos; «Adelantar cuotas» paga las que faltan. Parte `partes/2026-11-12-Q4.md`.
- ⬜ Q4b **Varias obras según el nivel del foro** (pedido el 12/11): una obra a la vez al principio y más huecos al subir el foro. Cambia cómo se guardan las colas (migrar en `G.load`) y toca la ciudad 3D: después del carril Ciudad (Q1d a Q1f).
- ✅ Q5 **Barrios con servicios** (12/11): cada ciudad tiene nivel de barrio 1 a 4 (Aldea, Villa, Ciudad, Urbs) según grano, templo, agua, ocio, termas y lujo; sube un nivel al cerrar el mes y baja con 3 meses de retraso; da más población máxima (hasta ×1,8) y, en Urbs, +15 % de impuestos. Ficha «Barrio» con seis iconos y consejo («Para ser Villa falta un Templo»). Parte `partes/2026-11-12-Q5.md`.
- ⬜ Q11 **Ciudad viva: luz y humo** espera al carril Ciudad (toca `js/gfx/city3d.js`).
- ✅ Q6 **Tres clases y lo que piden** (12/11): ciudadanos, plebeyos y esclavos por ciudad, cada clase con su ánimo; esclavos por conquista (trabajan más, no pagan) y manumisión mensual; «Dar ciudadanía» (60 denarios, +10). Bloque «Clases» en la ficha. Parte `partes/2026-11-12-Q6.md`.
- ✅ Q7 **Senado y pueblo** (12/11): dos barras de favor, una misión del Senado a la vez (11 misiones con fuente), pantalla «Senado» en Imperio; con poco favor niega tratados ajenos y levas extra. `G.MISION_TIPOS` abierto para CN5.
- ⬜ Q8 en adelante **aprobadas enteras** (P75, 12/11): Foro (decisiones al mes), provincias y edictos. Detalle en `estudios/Q1-ciudad-gobierno-economia.md` §8.

## Carril CN — Ciudad nueva: colocar y crecer (P80 a P82 y P89, aprobadas 12/11/2026; diseño `gobierno/estudios/Q1k-ciudad-de-cero.md` §9, donde se llaman C1 a C11)
Una tarea por sesión; CN1 a CN4 tocan `js/game.js` y `js/data.js`, así que van de una en una con Economía. Empieza la partida con «ambas opciones» (pregunta abierta en la bitácora).
- ✅ CN1 **Reglas sin pantalla** (12/11): `js/ciudad.js` (módulo sin pantalla: terreno, nota de sitio, calles, parcelas, casas, barrios, sucesos; radio de efecto P69; mejoras I a III como datos; guardar y cargar con `aDatos`/`deDatos`) y `test/ciudad.test.mjs` (23 comprobaciones, dentro de los jueces). Parte `partes/2026-11-12-CN1.md`.
- ✅ CN2 **Guardado y economía** (12/11): cada ciudad propia tiene su ciudad nueva (`G.ciudadE`); las partidas viejas se convierten al cargar; producción y población salen de piezas y casas; tres mejoras I a III; obras en lista con un hueco (`c.obras`); API para CN4 (`G.colocar`, `G.mejorarPieza`, `G.derribarPieza`, `G.levantarMuralla`, `G.notaSitio`, `G.mapaCalor`). Parte: `partes/2026-11-12-CN2.md`. La lista «Construir» aún muestra costes de un nivel (los reales saltan de mejora): lo arregla CN4.
- ✅ CN3 **Ciudad que nace** (hecha 12/11): terreno vacío, calles pintadas al jugar, casas romanas por nivel, andamio, ruinas y muralla sobre el surco. Parte `gobierno/partes/2026-11-12-CN3.md`.
- ⬜ CN4 **Colocar con el dedo** (1,5 M): bandeja, fantasma, verde y rojo con su razón; fuera solares, medallas y lista. Toca `js/ui.js`, `css/`.
- ⬜ CN5 **Fundar colonias** (1,5 M): sitios en el mapa, colonos que viajan, pantalla de fundar con el arado; misión del Senado.
- ⬜ CN6 **Barrios** (1,2 M): capilla de cruce, nivel por barrio (mueve Q5), casas y calles que cambian, etiquetas.
- ⬜ CN7 **Muralla y arrabal** (1,2 M): empalizada y piedra sobre el surco, puertas, saqueo de lo de fuera.
- ⬜ CN8 **Sucesos** (0,8 M): crecida, incendio y hambre con su aviso y su remedio.
- ⬜ CN9 **Roma, Capua, conquistadas y enemigas** (1,5 M): plantillas por cultura y tamaño; el enemigo coloca solo (funde Q1h).
- ⬜ CN10 **Edificios de época y revisión** (1,2 M): fuera anfiteatro, termas y arcos; citas cotejadas (funde Q1g y Q1j).
- ⬜ CN11 **Vida y peso** (1,0 M): gente, humo, carros; guarnición ligera con la figura de lejos (P79); medir triángulos (funde Q1i).
- ⬜ (en pausa: espera a CN8 y al carril Guerra) CN12 **Asedio en tu propia muralla** (P89, ≈3 M): el sitio y la muralla que colocaste son el campo de batalla. Une ciudad y batalla (CLAUDE.md §2): el usuario dijo «Sí» el 12/11. Toca `js/battle.js` y la ciudad. Alcance en `estudios/Q1l-competencia.md` (palanca 10) y `Q1l-lluvia-de-ideas.md` (paquete E).
- ⬜ CN13 **Lo que sobra se gasta y sucesos que se juegan** (P83, ≈1,5 M): arca del foro, ofrendas y juegos, tejas, cubos contra el fuego, marca de la crecida y dique, hambre que se ve. Tras CN8.
- ⬜ CN14 **Colocar con número vivo, asesor y dificultad** (P84, ≈1 M): «+14 casas con agua» que cambia al mover la pieza; asesor que enseña una cosa cada vez; sucesos apagables y tres dificultades. Tras CN4 y CN8.
- ⬜ CN15 **Ciudad viva** (P85, ≈1,5 M): estaciones y luz, andamios, fachadas ricas y pobres, recuas, sonido. Tras CN11 y Q11; no repite lo suyo.
- ⬜ CN16 **El ejército vive en la ciudad** (P86, ≈1,5 M): campo de Marte, leva en el foro, guarnición en torres, cerrar puertas, veteranos que se asientan, triunfo. Tras CN11.
- ⬜ CN17 **Barrios con carácter, encargos e hitos** (P87, ≈1,5 M): barrios con nombre propio, plaza en los cruces, encargos cortos del Senado, hitos que abren algo nuevo. Tras CN6 y Q7.
- ⬜ CN18 **Hecho para el móvil** (P88, ≈1,5 M): postal y crónica de la ciudad, modo contemplar, punto de parada, copia de la partida en un archivo, partida corta con nota (enlaza con I8).
- ⬜ CN19 **Más terrenos donde fundar** (P90, ≈2,5 M, partir en dos): costa con salinas, pantano, terrazas, llanura. Tras CN5.
- ⬜ CN20 **La historia llega a tu ciudad** (P91, ≈1,5 M más fichas): Pirro, Aníbal, la Gran Madre, auspicios, fiestas; cada hecho con su ficha antes de entrar (skill `historia`).

## Carril E — Arte (sistema coherente con la época)
- ✅ E1 Guía de arte aprobada (paleta, letra, iconos): `gobierno/estudios/E1-guia-de-arte.md` y su muestra.
- ✅ E4 Arte propio de termas, acueducto y anfiteatro (11/11/2026): termas y acueducto dibujados desde cero (`tools/propio_static.mjs`, CC BY-SA 3.0, sin texturas nuevas); anfiteatro de Pompeya de 0 A.D. aligerado a 8.483 triángulos y a escala de ciudad (`tools/aligerar_static.mjs`). El arte pasa a 34,0 MB de 35. Parte: `partes/2026-11-11-E4.md`.
- ✅ E1b Guía de arte, primera parte (11/11): iconos de línea para madera, piedra, hierro, grano, denarios y población; letra Cinzel incluida en el juego (SIL OFL 1.1, 29 KB); mármol, oliva y terracota en vez de blanco azulado, verde fosforito y rosa.
- ✅ E1c Guía de arte, segunda parte (11/11/2026): esquinas de 8 px, doble filete y greca (`css/style.css`); iconos de línea propios para guerra (espadas, escudo, águila, casco), las cinco pestañas y los edificios en tarjetas y listas (`D.GUERRA_ICON`, `D.BUILD_ICON`, `bIco()` en `js/ui.js`). Quedan con emoji la etiqueta flotante de la ciudad 3D (`city3d.js`, es texto), los avisos y el resto de emojis (bienes, dioses, tipos). Las barras de moral siguen en `battle3d.js` (Batallas). Parte: `partes/2026-11-11-E1c.md`.
- ✅ E2 Piezas de 0 A.D. por cultura (11/11): en el mapa cada ciudad lleva un edificio de su dueño (cartaginés, griego, galo, íbero; Roma, el templo redondo) y los ejércitos por mar van en barco cartaginés o griego. 6 piezas, +2,7 MB (total 33,1 de 35).
- ✅ E2b Piezas por cultura, lo que sirve (11/11/2026): templo griego de verdad (el templo ateniense de 0 A.D., 1.679 triángulos, columnas y frontón) en lugar del santuario. **Máquinas de asedio y estandartes NO se añaden**: el juego no tiene unidades de asedio y las banderas de regimiento ya se dibujan por código; sería arte sin uso. Se harán cuando exista la unidad (propuesta aparte). Arte 34,1 MB de 35. Parte: `partes/2026-11-11-E2b.md`.
- ✅ E3 Presupuesto por escena en `node gobierno/arte.mjs` (batalla 1,1 millones, ciudad 300 mil; provisional hasta D1).

## Carril C — Mapa y campaña
- ⬜ C1 Zoom continuo mapa → ciudad; ejércitos de guarnición visibles junto a cada ciudad. Idea para bajar de nivel (Mare Nostrum › región › ciudad, con «volver»): `estudios/R20-niveles-de-mapa.md` (solo la idea, sin código del kit; 12/11).
- ✅ C2 Costa real (Natural Earth, 15 KB) y grano de hierba en el suelo del mapa. ✅ C2b Relieve con alturas reales (GMTED2010/ETOPO1, 116 KB) y orillas con espuma (12/11).
- ⬜ C3 Diplomacia sencilla (alianzas, tributos) e IA enemiga que también construye.
- ⬜ C4 **Ríos, lagos y relieve variado en el mapa** (P92, ≈1 M): Po, Tíber, Ebro, Ródano, delta del Nilo y Danubio como cintas de agua sobre el relieve real; lagos; más tipos de terreno (llanura, estepa, desierto del Atlas). Después de J4 (si no, se regenera el marco dos veces). Alturas: `assets/mapa/generar-alturas.py`.
- ⬜ C5 **Botón de mapamundi** (P94, aprobada 12/11, ≈0,6 M): un botón más en el mapa para ver el mundo entero de un vistazo, con las ciudades y los frentes. Después de J4 (el mapa grande por regiones). Toca `js/gfx/map3d.js` y la parte del mapa de `js/ui.js`.
- ✅ C6 **Mapa por escalones** (12/11, P95): seis zonas en latín en Mare Nostrum; tocar una acerca la cámara, migas y «← volver» al encuadre exacto. Parte `partes/2026-11-12-C6.md`.

## Carril H — Historia (ministerio de Adecuación Histórica)
- ✅ H1 Auditoría histórica cotejada con los textos (11/11/2026): `gobierno/historia/H1-resumen.md`. Los 10 fallos se confirman, con matices.
- ✅ H2 Siete fichas de batalla cotejadas (`gobierno/historia/batallas/`). Cannas y Zama se podrían jugar con cambios medios; Trebia, Trasimeno y Pidna piden terreno y emboscadas.
- ✅ H1b/H2b Cotejo hecho (11/11/2026): 227 datos cotejados, 43 corregidos, 60 sin comprobar. Costó 5,4 M (presupuesto 0,9 M).
- ✅ H4 Textos de los hechos corregidos con las fuentes cotejadas (11/11/2026).
- ✅ H5 «Vigiles» es ahora «Guardia urbana» y «Batallón Sagrado», «Ciudadanos de Cartago».
- ✅ H6 Cartago sin general con nombre hasta 149 a.C.; Asdrúbal el Beotarca, desde 149.
- ✅ H7 Mapa de 280 real: Capua aliada de Roma, Agrigento griega (cartaginesa en 264), Corinto macedonia (aquea en 243), Mamertinos en Messana. Bot agresivo 8-9/10.
- ✅ H8 Carthago Nova empieza como poblado íbero y pasa a Cartago hacia 228 con su hecho. El nombre en el mapa no cambia.
- ✅ H9 Hechos nuevos: Benevento 275, Trasimeno 217, Metauro 207, Ilipa 206, Magnesia 190, Corinto y Cartago 146.
- ✅ H10 Pastilla «licencia de juego» con su motivo en 15 hechos y en las tropas inventadas.
- ✅ H3 Códice dentro del juego (11/11/2026): botón en «Crónica», 62 fichas de tropas, ciudades y hechos con etiqueta y fuente.
- ✅ H11a (12/11) cotejo hecho: `estudios/H11-cotejo.md` (65 fichas; 8 errores a corregir, el peor Ambracia: 1.000, no 500).
- ✅ H11b Cotejo aplicado en `js/registro.js` (38 fichas; Plinio y Apiano siguen «por cotejar»). Parte: `gobierno/partes/2026-11-12-H11b.md`.
- ⬜ (decidido 12/11: va dentro de J4) H11c **Madera naval a Perusia, Clusio y Rusellae** (Livio 28.45): J4 (mapa más grande por regiones) crea esas tres ciudades con su fuente; entonces se mueve el bien en `data.js` y la ficha de Siracusa y Panormus. Mientras, la madera naval sigue donde estaba. Plinio NH 9.127/14.62/31.89 y Apiano Líbica por otra edición.
- ⬜ H12 **Capua se rebela en 216** (aprobada 11/11, P52): tras Cannas se pasa a Aníbal si no la defiendes bien (Livio 23.2-7). Cambia reglas. ≈0,3 M.
- ⬜ H13 **Pirro ataca en 280, no en 277** (aprobada 11/11, P53): obliga a reequilibrar el arranque. ≈0,3 M.
- ⬜ H14 **«Poblado íbero» en el mapa** (aprobada 11/11, P54): Carthago Nova se llama así hasta 228. ≈0,15 M.

## Carril D — Técnica
- ✅ D1 Fluidez medida en el móvil del usuario (11/11): menú, ciudad, calles y ejército a unas 60 imágenes por segundo (peor momento 22 a 28). Mapa y batalla grande, sin medir; el usuario no quiere medir más.
- ✅ D2 Niveles de detalle en batalla: lejanos con figura ligera; se pintan ~1.395 soldados en vez de 494 con el mismo tope.
- ✅ D3 Estudio de Godot: no pasar ahora; se revisa tras medir con D1. `gobierno/estudios/D3-godot.md`.
- ✅ D4 Publicado en GitHub Pages: https://alvariitosw.github.io/Bot-travian/ (falta confirmar en el móvil del usuario).
- ✅ D5 Jueces automáticos: `node gobierno/jueces.mjs` (lógica + recorrido en navegador + capturas).

## Gobierno
- ✅ G3 Dos informes de diseño con plan y presupuesto: `gobierno/estudios/G3-batallas-estrategicas.md` (diez tareas; reparte A1 a A6) y `G3-gran-diseno.md` (seis decisiones y tres fases). Propuestas P40 a P49 en la bitácora; nada se construye sin aprobar.
- ✅ G2 Ministerio de Adecuación Histórica montado (11/11/2026): skill `historia`. Sus tareas, cuando el usuario las apruebe, irán en un carril H.
- ✅ G1 Gobierno reducido y cuadro de mando montados (11/11/2026). Guía: `gobierno/LEEME.md`.
