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
- ✅ I3b **La paga de las tropas se cobra de verdad** (12/11): lo que no se paga se debe (`s.deudaPaga`), deserción y Senado en proporción.
- ✅ I5 **Saber: investigación y edades** (12/11): 22 saberes, 3 edades, cola, techos, ganchos de economía y pestaña «Saber»; precio fijo con tope. Parte: `partes/2026-11-12-I5.md`.
- ✅ I5b **Escuela y sabios** (P93): la Escuela se abre con «Preceptores griegos», destinas plebeyos, ciudadanos o esclavos a estudiar; ritmo real de estudio, paga mensual que sube con el total de sabios, script de calibración. Parte `partes/2026-11-12-I5b.md`.
- ✅ I5c **Ciencia en combate y rival**: moral, ataque, muralla, brecha y herida cableados; el rival copia por bando (techos bajados tras medir 4.16). Parte `partes/2026-11-12-I5c.md`.
- ⬜ I5d **Reformar y afinado** (opcional, ≈1 M; tras jugar el sistema): cambiar de saber pagando el coste completo; afinado con medida real y cotejo de citas.
- ✅ I6 **Región de Italia** montada solo con fichas (12/11): `D.REGIONES`, `G.newGame(nombre, región)`, mapa que oculta lo de fuera, botón «Región de Italia». Cómo definir una región: parte I6.
- ✅ I7 Fundida en J3 (capital y pueblos; decisión del 11/11).
- ✅ I8 **Partida corta** (P49): menú con «Roma y Capua en pie» y «Fundar de la nada», Italia, un rival, final con resumen (D.MODOS). Parte: gobierno/partes/2026-11-13-I8.md

## Carril J — Interfaz y territorio (aprobado 11/11/2026, P58 a P62)
- ✅ J1 **Pantalla limpia** (11/11): maqueta B elegida por el usuario; dos modos Gobierno/Guerra, fila fina de recursos, tira de vistas y tres botones redondos abajo; sin barra de pestañas. Parte: `partes/2026-11-11-J1.md`.
- ✅ J2 **Obras de un toque** (11/11): hecha dentro de J7 (cola de obras y filas deslizables en Imperio).
- ✅ J6 **Ciudad como pantalla principal** (11/11): ciudad 3D a pantalla completa, medallas de bronce con nivel, ficha única con consejo, pestañas Ciudad/Gobierno/Imperio. Parte `partes/2026-11-11-J6.md`.
- ✅ J7 **Parte densa: Imperio y Obras** (11/11): pestaña Imperio con ciudades por urgencia, filtros, resumen de población y ánimo, cola de obras, filas deslizables y «Hacer lo mismo en…». Parte `partes/2026-11-11-J7.md`.
- ⬜ J7b **Pestañas también en el mapa de guerra** (sacada de J7; esperar a que I2 Mapa por turnos termine con `js/game.js` y el mapa).
- ⬜ J3 **Capital y pueblos** (P60; incluye I7): cada territorio tiene una capital con los edificios de gobierno y pueblos de recursos, pescadores y agricultores-ganaderos. Los pueblos producen; la capital gobierna, recluta y comercia. 0,3 + 1,0 M, en dos tareas. Después de I6.
- ⬜ J4 **Mapa más grande por regiones** (P62; amplía I6): más ciudades y territorios, cada región con su capital y sus núcleos pequeños; lista de ciudades con fuente histórica; vigilar la fluidez. 0,3 + 1,2 M, en dos o tres tareas. Después de J3. **Incluye** crear Perusia, Clusio y Rusellae (H11c, madera naval, Livio 28.45). Idea para bajar de nivel (Mare Nostrum › región › ciudad, con «volver»): `estudios/R20-niveles-de-mapa.md` (solo la idea, sin código del kit; 12/11).
- ➡️ J5 (absorbida por SN, 13/11) **Política territorial** (P61): apartado «Senado» con planes de infraestructuras, ciudadanía, ejército, diplomacia y mercado. Primero informe corto de diseño con fuentes; se une con I5 y C3. 0,3 + 1,0 M, en dos tareas.
- ➡️ J8 (absorbida por SN, 13/11: chips por clase en las leyes y juegos del Foro) **Foro y chips** (P65, aprobada 11/11 desde el cuadro): discursos y revueltas en el Foro por clases sociales; chips verde/rojo con el efecto de cada decisión por clase. Va con J5, después de J6 y J7.

## Carril K — Concurso de diseño de interfaz (pedido 11/11/2026)
- ✅ K1 **Concurso Gobierno** (11/11): cinco maquetas verticales y jurado ciego. Ranking: Cartas 73, Tablero 70, Senado 65, Cursus 63, Crónica 61. Informe `estudios/K-concurso.md`.
- ✅ K2 **Concurso Guerra** (11/11): cinco maquetas horizontales y jurado ciego. Ranking: General 72, Trazo 69, Partitura 60, Arena 60, Cartas 59.
- ✅ K4 **Concurso Guerra 2** (11/11): Legado 60, Fantasmas 55, Estandartes 53, Miniaturas 50, Mosaico 46. Informe `estudios/K2-concurso.md`.
- ✅ K5 **Concurso Gobierno 2** (11/11): Ciudad 61, Tabularium 60, Lentes 56, Domus 52, Foro 44.
- ⬜ V1 **Informe en vídeo: menús del juego** (pedido 12/11): cómo hacer los menús legibles, que no ocupen toda la pantalla, que quepan en el móvil para usarlos con los pulgares y sin mil cosas a la vez. Sesión barata (Haiku) con la maquinaria de /moncloa del repositorio de fiebres. Solo informe; no toca el juego.
- ⬜ K6 **Concurso de arte: batalla y manejo de tropas** (pedido 12/11): cinco maquetas en Haiku (esfuerzo alto) y jurado ciego, sobre cómo se ve y se manejan las tropas. Solo `gobierno/maquetas/`; no toca `js/`.
- ⬜ K7 **Concurso: interfaz y jugabilidad de ciudades y fuera de ellas** (pedido 12/11; después de K6): rutas de comercio como parte del juego, diplomacia y movimiento de tropas. Solo `gobierno/maquetas/`.
- ⬜ K8 (13/11: el Senado sale de aquí, lo hace el carril SN; queda solo la economía) **Concurso: Senado, política y economía** (pedido 12/11, aprobado «igual que K6»; ≈2 a 3 M): ocho maquetas rivales en Haiku (esfuerzo alto) y jurado ciego, sobre el diseño y la jugabilidad del Senado, la política y la economía (incluye avisos de «Cierre de mes» e informe de estación que hoy tapan la pantalla, y construir y conseguir recursos, conservando lo que va bien). Solo `gobierno/maquetas/`; no toca `js/`. Después de K6 y K7.
- 🔶 K10 **Concurso de arte de la batalla** (13/11, pedido del usuario): piezas P1 a P5 en cuatro rondas, Opus y Sonnet sin Fable, jurado ciego y voto del usuario. Solo `gobierno/maquetas/piezas-batalla/`; no toca `js/`. Tope duro 4 M.
- ✅ K11 **Concurso de menús y pantallas** (13/11): cuatro maquetas y jurado ciego; 1.º B Hojas (118/150), 2.º D Códice (102), 3.º C Mosaico (100), 4.º A Mármol (99). Informe `estudios/K11-concurso.md`. Elige el usuario. Gasto 3,45 M (tope 3).
- 🔶 K12 **Construir los menús ganadores** (tope duro total 3,5 M; aprobado por el usuario el 13/11 con «vamos a finalizarlo… para subirlo a main»): se conservan los cuatro estilos, uno por tipo de pantalla; «Volver al menú principal» dentro del ☰, al fondo y con confirmación. Tres partes, una detrás de otra (todas tocan `js/ui.js` y `css/style.css`):
  - ✅ K12a **Marco general (B Hojas)** (13/11): hoja inferior única con 3 alturas, menú ☰ con «Volver al menú principal» al fondo y confirmación, Gobierno nuevo (anillo de felicidad, «Falta», 6 atajos), Ajustes/Pausas/Mercado/Rutas/Pueblo/Estado en hojas, barras de cristal, «Pasar turno» grande, menú principal estilo B. Jueces APTO. Gasto ≈2,7 M (por encima de los 1,8 M previstos). Parte `partes/2026-11-13-K12a.md`. Queda para K12b/K12c: Crónica sigue a pantalla completa; Mercado, Rutas e Imperio con su contenido de hoy.
  - ⬜ K12 **Construir los menús mezclados** (aprobado por el usuario el 13/11; tope duro 3,5 M, agentes en Sonnet): reparto de estilos de K11 — Hojas (B) marco general, barra, «Pasar turno», ☰ y ajustes/pausas; Códice (D) Senado, Crónica, línea del tiempo e informe de estación con sello; Mármol (A) Mercado, Rutas e Imperio; Mosaico (C) Saber y habilidades del general. «Volver al menú principal» escondido al fondo del ☰, con confirmación. Maquetas en `maquetas/menus/`, informe `estudios/K11-concurso.md`. Toca `js/ui.js` y `css/style.css`; conviene partirlo en varias sesiones (marco+☰ primero). Sesión nueva.
  - ⬜ K12c **Mármol (A) y Mosaico (C)**: Mercado, Rutas, Imperio (libro de cuentas); Saber y habilidades del general.
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
- ✅ N15b **Segunda pasada de equilibrio y campaña conectada** (13/11): `game.js` pasa levas bisoñas (`c.levas`, 6 meses), mando/disciplina del general y objetivo según contexto (resistir si te superan 1,3×, escapar si 0,5× con general, tomar la zona si la muralla es ≥3); las muy desiguales duran la mitad; la cuña afecta a elefantes y general; sin órdenes con ventaja el ejército se releva solo; arreglados los dos menores de I5c.
- ✅ N15c **Lo que N15b dejó** (13/11): aguantar más fuerte y la IA baja del cerro (0,67× con plan de aguante gana 30 %; con el plan antiguo sigue 0 %), frente de 60 figuras compacto (fondo 8), igualadas ~10 min, relevo sin órdenes solo en automático, franja del gesto bajo el objetivo, etiqueta «Bis» en bisoñas. Parte: gobierno/partes/2026-11-13-N15c.md. Pendiente: trampa de ganar por tablas quedándose quieto (decide el usuario).
- 🔶 N15d **Trampa de «Aguantar»** (13/11): quieto con Aguantar ya no gana (0 % a 0,85/1/1,15×; el tope de tiempo da la victoria a quien conserve más hombres; el bono se apaga a los 60-100 s) y la ayuda dice «un tercio menos de daño». FALTA: el buen plan a 0,67× sigue en 0 % (el reloj de moral de N15b lo decide); espera decisión del usuario (parte N15d).
- ⬜ NB1 **Batalla nueva · motor del choque sin pantalla** (informe `gobierno/estudios/batalla-nueva.md` §7, aprobado 13/11; en el informe se llama B1, aquí NB para no chocar con el carril B; ≈1,2 M): `js/batalla2.js` y `test/batalla2.test.mjs`: pulso de 2 s, tres sectores, ánimo, avisos de pausa, fin, consejo con tres tipos; el bot que elige «Favorable» gana 4 o más de 10 igualadas. No toca `js/battle.js`.
- ⬜ NB2 **Las cuatro maniobras del choque y el enemigo** (≈1,0 M): rodeo, mover entre sectores, reserva oculta, retirada fingida; a 0,75× con rodeo o retirada bien hechos gana 3 de 10.
- ⬜ NB3 **Pantalla 2D del choque** (≈1,2 M): `js/ui.js`, `css/style.css`; capturas iguales a las de referencia 1, 3, 4, 7, 8; usa las piezas del concurso K10 si ya hay ganadoras.
- ⬜ NB4 **3D en directo** (≈1,5 M): `js/gfx/battle3d.js` recibe los sucesos y los enseña; cámara que va sola a la pausa.
- ⬜ NB5 **Motor de la maniobra sin pantalla** (≈1,0 M): `js/maniobra.js`, 4 plantillas de zona en `js/data.js`; puede ir a la vez que NB1.
- ⬜ NB6 **Pantalla de la maniobra** (≈1,0 M): capturas iguales a 5 y 6.
- ⬜ NB7 **Conectar con la campaña, tribunos-generales e interruptor «Batalla nueva / clásica»** (≈0,8 M).
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
- ✅ Q4b **Varias obras según el nivel del foro** (13/11): huecos de obra 1, 2, 3 y 4 según el nivel del foro (`D.HUECOS_OBRA`); cada obra con sus cuotas y su andamio; Imperio con varias barras.
- ✅ Q5 **Barrios con servicios** (12/11): cada ciudad tiene nivel de barrio 1 a 4 (Aldea, Villa, Ciudad, Urbs) según grano, templo, agua, ocio, termas y lujo; sube un nivel al cerrar el mes y baja con 3 meses de retraso; da más población máxima (hasta ×1,8) y, en Urbs, +15 % de impuestos. Ficha «Barrio» con seis iconos y consejo («Para ser Villa falta un Templo»). Parte `partes/2026-11-12-Q5.md`.
- ✅ Q11 **Ciudad viva: luz y antorchas** (12/11): luz, niebla y cielo por estación con transición suave, tarde dorada, sombras solo al cambiar de estación, antorchas en foro y puertas. Parte `2026-11-12-Q11.md`.
- ✅ Q6 **Tres clases y lo que piden** (12/11): ciudadanos, plebeyos y esclavos por ciudad, cada clase con su ánimo; esclavos por conquista (trabajan más, no pagan) y manumisión mensual; «Dar ciudadanía» (60 denarios, +10). Bloque «Clases» en la ficha. Parte `partes/2026-11-12-Q6.md`.
- ✅ Q7 **Senado y pueblo** (12/11): dos barras de favor, una misión del Senado a la vez (11 misiones con fuente), pantalla «Senado» en Imperio; con poco favor niega tratados ajenos y levas extra. `G.MISION_TIPOS` abierto para CN5.
- ⬜ Q8 en adelante **aprobadas enteras** (P75, 12/11): Foro (decisiones al mes), provincias y edictos. Detalle en `estudios/Q1-ciudad-gobierno-economia.md` §8.

## Carril CN — Ciudad nueva: colocar y crecer (P80 a P82 y P89, aprobadas 12/11/2026; diseño `gobierno/estudios/Q1k-ciudad-de-cero.md` §9, donde se llaman C1 a C11)
Una tarea por sesión; CN1 a CN4 tocan `js/game.js` y `js/data.js`, así que van de una en una con Economía. Empieza la partida con «ambas opciones» (pregunta abierta en la bitácora).
- ✅ CN1 **Reglas sin pantalla** (12/11): `js/ciudad.js` (módulo sin pantalla: terreno, nota de sitio, calles, parcelas, casas, barrios, sucesos; radio de efecto P69; mejoras I a III como datos; guardar y cargar con `aDatos`/`deDatos`) y `test/ciudad.test.mjs` (23 comprobaciones, dentro de los jueces). Parte `partes/2026-11-12-CN1.md`.
- ✅ CN2 **Guardado y economía** (12/11): cada ciudad propia tiene su ciudad nueva (`G.ciudadE`); las partidas viejas se convierten al cargar; producción y población salen de piezas y casas; tres mejoras I a III; obras en lista con un hueco (`c.obras`); API para CN4 (`G.colocar`, `G.mejorarPieza`, `G.derribarPieza`, `G.levantarMuralla`, `G.notaSitio`, `G.mapaCalor`). Parte: `partes/2026-11-12-CN2.md`. La lista «Construir» aún muestra costes de un nivel (los reales saltan de mejora): lo arregla CN4.
- ✅ CN3 **Ciudad que nace** (hecha 12/11): terreno vacío, calles pintadas al jugar, casas romanas por nivel, andamio, ruinas y muralla sobre el surco. Parte `gobierno/partes/2026-11-12-CN3.md`.
- ✅ CN4 **Colocar con el dedo** (hecha 12/11): bandeja de fichas abajo, fantasma con mapa verde/ocre/rojo y una línea de motivo, «Construir aquí»/«Cancelar», ficha del edificio colocado (Mejorar I a III, Derribar), ficha «Muralla» (`G.levantarMuralla`); fuera solares, medallas y lista. Parte `gobierno/partes/2026-11-12-CN4.md`.
- ✅ CN5 **Fundar colonias** (13/11): 8 sitios históricos en el mapa, colonos que marchan sin batalla, pantalla de fundar con arado; misión «Una colonia para Roma».
- ✅ CN6 **Barrios** (13/11): cada barrio sube de uno en uno y baja tras 3 meses sin servicio; la ciudad es la media; lista de barrios en la ficha y etiqueta por barrio con la cámara lejos. Mercado sustituye a ocio y termas.
- ✅ CN7 **Muralla y arrabal** (13/11): la defensa en guerra sale de la fase de la muralla (sin 0, empalizada 3, piedra 6); los ataques que ganan saquean casas del arrabal (menos con piedra) con aviso; consejo «Tu arrabal tiene N casas sin muralla»; partida vieja migrada.
- ✅ CN8 **Sucesos** (0,8 M, gastó 1,24 M): crecida, incendio y hambre con su aviso y su remedio. Parte `gobierno/partes/2026-11-13-CN8.md`.
- ✅ CN9 **Roma, Capua, conquistadas y enemigas** (1,5 M): plantillas por cultura y tamaño; el enemigo coloca solo (funde Q1h). **CN9a (lógica) y CN9b (arte) hechas** — ver `partes/2026-11-13-CN9a.md` y el de CN9b.
- ✅ CN9c **Afinar Capua, Roma y Tranquila** (0,3 M; gastó 0,89 M): Capua 300 hab. y 12 de oro (antes 405 y 24), `enInvierno` con 0 meses sin hambre; Tranquila +3,2 % (meta +5 % abierta, decide el usuario). Parte: `partes/2026-11-13-CN9c.md`
- ✅ CN10 **Edificios de época y revisión** (1,2 M): fuera anfiteatro, termas y arcos; citas cotejadas (funde Q1g y Q1j).
- ✅ CN11 **Vida y peso** (12/11): gente, humo y fuego, carros, pozo, guarnición ligera (P79); Roma bajo 300 mil triángulos. Parte en `gobierno/partes/2026-11-12-CN11.md`.
- ⬜ (en pausa: espera a CN8 y al carril Guerra) CN12 **Asedio en tu propia muralla** (P89, ≈3 M): el sitio y la muralla que colocaste son el campo de batalla. Une ciudad y batalla (CLAUDE.md §2): el usuario dijo «Sí» el 12/11. Toca `js/battle.js` y la ciudad. Alcance en `estudios/Q1l-competencia.md` (palanca 10) y `Q1l-lluvia-de-ideas.md` (paquete E).
- ⬜ CN13 **Lo que sobra se gasta y sucesos que se juegan** (P83): ✅ **CN13a hecha (13/11)**: arca, ofrenda, juegos y hambre que se ve. ✅ **CN13b hecha (13/11)**: dique, tejas por barrio y marca de la crecida. Falta **CN13c** (cubos y reloj parado). Plan: `gobierno/olas-22-ciudad.md`.
- ✅ CN14 (A, B y C hechas, 13/11) **Colocar con número vivo, asesor y dificultad** (P84, ≈1 M): «+14 casas con agua» que cambia al mover la pieza; asesor que enseña una cosa cada vez; sucesos apagables y tres dificultades. Tras CN4 y CN8.  **CN14-B hecha (13/11); faltan A y C.**
- ✅ CN15 **Ciudad viva** (P85, ≈1,5 M): estaciones y luz, andamios, fachadas ricas y pobres, recuas, sonido. Tras CN11 y Q11; no repite lo suyo. **CN15a, b y c hechas (estaciones, fachadas, obra, recuas y sonido); cerrada.**
- ✅ CN15d **Dique, tejado y arca del foro (solo dibujo)** (13/11): `js/gfx/civicas.js` dibuja tramos de dique (`E.edificios` tipo `dique`) y el arca (`E.arca`); el tejado rojo por barrio (`E.barrios[i].tejas`) va en `tinteC`. Sin esos datos no pinta nada: lo activa CN13.
- ⬜ CN16 **El ejército vive en la ciudad** (P86, ≈1,5 M): campo de Marte, leva en el foro, guarnición en torres, cerrar puertas, veteranos que se asientan, triunfo. Tras CN11.
- ⬜ CN17 **Barrios con carácter, encargos e hitos** (P87, ≈1,5 M): barrios con nombre propio, plaza en los cruces, encargos cortos del Senado, hitos que abren algo nuevo. Tras CN6 y Q7.
- ⬜ CN18 **Hecho para el móvil** (P88, ≈1,5 M): postal y crónica de la ciudad, modo contemplar, punto de parada, copia de la partida en un archivo, partida corta con nota (enlaza con I8).
- ⬜ CN19 **Más terrenos donde fundar** (P90, ≈2,5 M, partir en dos): costa con salinas, pantano, terrazas, llanura. Tras CN5.
- ⬜ CN20 **La historia llega a tu ciudad** (P91, ≈1,5 M más fichas): Pirro, Aníbal, la Gran Madre, auspicios, fiestas; cada hecho con su ficha antes de entrar (skill `historia`).
- ✅ CN21 **Mover un edificio** (13/11): botón «Mover» en la ficha; `CI.mover` + `G.moverPieza`, conserva mejoras, gratis.
- ✅ CN22 **Avisos pequeños que no tapan la pantalla** (P97): los «Cierre de mes» se apilan y tapan la ciudad y el informe de estación ocupa todo. Avisos pequeños que se van solos o se agrupan, y mejor la parte de construir y conseguir recursos, sin tirar lo que hay. Toca `js/ui.js` y `css/`.
- ✅ CN23 **Ampliar la muralla: segundo recinto** (13/11): `ampliarMuralla` (2× coste, 4 meses, solo con muralla de piedra); `E.muralla.rec`, `cercado()`, `geo.surco` = anillo activo.
- ✅ CN24 **Empalizada en obra que suba en altura** (13/11): las estacas suben del 30 % al 100 % con la obra.
- ⬜ CN25 **Tiempos del juego: el mes pasa sin que hagas nada** (pedido 12/11, respuesta «A» el 13/11): meses y turnos duran demasiado o pasan sin decisiones. Primero medir cuánto dura cada mes y qué se decide en él; luego propuesta concreta antes de tocar `game.js`. **CN25a medida hecha; CN25b sustituida por R3 (hecha)** (informe `gobierno/estudios/CN25-tiempos.md`, parte `partes/2026-11-13-CN25a.md`).

## Carril R — Plan de hoy (informe del 13/11, aprobado por el usuario el 13/11; uno detrás de otro, todos con Sonnet)
- ✅ R1 **Batalla más corta y campo más lleno** (≈0,6 M): `RITMO` (0,0365) hasta que las igualadas de `test/equilibrio.js` duren 4–6 min (probar el doble); `ANCHO_BASE` 1200→800 y `ANCHO_GRANDE` 1500→1000; objetivo «resistir» 12→6 rondas en `cfg.objetivo` de `game.js`. Se acepta si sim.test pasa y equilibrio no se mueve >10 puntos (si el ancho lo rompe, solo el ritmo). Capturas a los 25 s antes y después. **Hecha (13/11):** RITMO 0,11, anchos 800/1000, resistir 7 rondas; igualadas de 592 s a 357 s. Parte `partes/2026-11-13-R1.md`.
- ✅ R2 (13/11) **Consejo de tribunos y pantalla limpia** (≈1,8 M, tras R1): gestos de `iaRonda0` sacados a una función por bando; `Battle.prototype.consejo()` (hasta 3 opciones de tipos distintos: nombre del tribuno prudente/agresivo/astuto, título, motivo, etiqueta Favorable/Dudoso/Arriesgado, órdenes) y `aplicarConsejo(i)`; en `filaRonda` tres tarjetas, «A mano» y «Ver la ronda». El enemigo no cambia (misma semilla, mismo resultado). No toca `js/gfx/`.
- ✅ R3 **El reloj se para con motivo** (hecha 13/11, parte `partes/2026-11-13-R3.md`; sustituye a CN25b) (≈0,5 M, tras I8): propuesta A de `gobierno/estudios/CN25-tiempos.md` con pausas **todas** por defecto; ajuste «todas / solo graves / ninguna» en Ajustes; migrar en `G.load`. Sustituye a CN25b.
- ✅ R4 **Avisos de una frase** (≈0,3 M): cada texto de `js/asesor.js` y del consejo de `ui.js` en una frase de ≤80 caracteres y una acción; si hay dos avisos, el más urgente. Lista de textos antes y después.
- ✅ R5 **Batalla más cerca** (≈0,3 M): la cámara de inicio encuadra el ancho de los dos ejércitos; estandartes que se pisan, separados en vertical. Sin tocar el motor. Capturas antes y después a 844×390. Hecha (13/11): la vista alta encuadra los dos ejércitos (nunca más lejos que antes) y los estandartes que se pisan suben en vertical. Parte R5.

## Carril SN — Senado nuevo: sala de votos con tres bandos (aprobado por el usuario el 13/11/2026; diseño `gobierno/estudios/senado-nuevo.md`, captura `capturas-tarea/senado-1-votacion.png`)
Una tarea por sesión, constructor en Sonnet. SN2 después de SN1. No tocar `js/battle.js` ni `js/gfx/`. Absorbe J5 y J8.
- ⬜ SN1 **Motor del Senado sin pantalla** (≈1,15 M, ~30 min; tope 1,5 M): bandos, escaños desde la ciudad, humores (el favor del Senado = media ponderada), 12 leyes + las 11 misiones como propuestas, votos, tratos (promesa y pago), veto del tribuno y juegos, promesas, permisos de guerra, interruptor `D.SENADO.sala`, migración y bot. Secciones 2 y 4 del informe; «Hecho si» SN1. Si pasa de 1,5 M: quitar el Pago y luego «Cambiar propuesta».
- ⬜ SN2 **Pantalla del Senado** (≈0,95 M, ~30 min; tras SN1): `viewSenado` como la captura, aviso «El Senado vota» en el consejo de estación, captura 390×844. Sección 3 del informe; «Hecho si» SN2.
- ⬜ SN3 Cónsules con nombre desde tus tribunos (sin empezar).
- ⬜ SN4 Dictador (sin empezar).
- ⬜ SN5 Triunfo y fama, tras la batalla nueva (sin empezar).
- ⬜ SN6 Concurso de arte por piezas del Senado, en Haiku (sin empezar).
- ⬜ SN7 Equilibrio con partidas del usuario (sin empezar).

## Carril E — Arte (sistema coherente con la época)
- ✅ E1 Guía de arte aprobada (paleta, letra, iconos): `gobierno/estudios/E1-guia-de-arte.md` y su muestra.
- ✅ E4 Arte propio de termas, acueducto y anfiteatro (11/11/2026): termas y acueducto dibujados desde cero (`tools/propio_static.mjs`, CC BY-SA 3.0, sin texturas nuevas); anfiteatro de Pompeya de 0 A.D. aligerado a 8.483 triángulos y a escala de ciudad (`tools/aligerar_static.mjs`). El arte pasa a 34,0 MB de 35. Parte: `partes/2026-11-11-E4.md`.
- ✅ E1b Guía de arte, primera parte (11/11): iconos de línea para madera, piedra, hierro, grano, denarios y población; letra Cinzel incluida en el juego (SIL OFL 1.1, 29 KB); mármol, oliva y terracota en vez de blanco azulado, verde fosforito y rosa.
- ✅ E1c Guía de arte, segunda parte (11/11/2026): esquinas de 8 px, doble filete y greca (`css/style.css`); iconos de línea propios para guerra (espadas, escudo, águila, casco), las cinco pestañas y los edificios en tarjetas y listas (`D.GUERRA_ICON`, `D.BUILD_ICON`, `bIco()` en `js/ui.js`). Quedan con emoji la etiqueta flotante de la ciudad 3D (`city3d.js`, es texto), los avisos y el resto de emojis (bienes, dioses, tipos). Las barras de moral siguen en `battle3d.js` (Batallas). Parte: `partes/2026-11-11-E1c.md`.
- ✅ E2 Piezas de 0 A.D. por cultura (11/11): en el mapa cada ciudad lleva un edificio de su dueño (cartaginés, griego, galo, íbero; Roma, el templo redondo) y los ejércitos por mar van en barco cartaginés o griego. 6 piezas, +2,7 MB (total 33,1 de 35).
- ✅ E2b Piezas por cultura, lo que sirve (11/11/2026): templo griego de verdad (el templo ateniense de 0 A.D., 1.679 triángulos, columnas y frontón) en lugar del santuario. **Máquinas de asedio y estandartes NO se añaden**: el juego no tiene unidades de asedio y las banderas de regimiento ya se dibujan por código; sería arte sin uso. Se harán cuando exista la unidad (propuesta aparte). Arte 34,1 MB de 35. Parte: `partes/2026-11-11-E2b.md`.
- ✅ E3 Presupuesto por escena en `node gobierno/arte.mjs` (batalla 1,1 millones, ciudad 300 mil; provisional hasta D1).
- 🔶 E5 **Ambiente de la ciudad** (13/11, aprobado y lanzado desde el chat): efectos sobre la imagen final de la ciudad 3D con las piezas de efectos que trae three.js (sin librerías de fuera): tono de color por estación (OJO: Q11 ya cambia luz, niebla y cielo por estación; el tono debe sumarse a eso, no repetirlo), viñeta suave y contorno del edificio elegido; interruptor «Ambiente» en Ajustes (apagado = como hoy). Capturas antes/después por estación. ≈0,8 M, tope 1,1 M. La batalla, después de NB.
- ⬜ E6 **Vida del campo con arte CC0** (13/11, apuntada; sin empezar): ganado, carros, cultivos, árboles y texturas de suelo de Quaternius y Poly Haven (CC0) para la ciudad y la llanura de batalla; skill `arte`, presupuesto de peso. Antes de construir, enseñar al usuario 3 o 4 piezas candidatas junto a 0 A.D. para que apruebe el estilo. ≈0,5 M.

## Carril C — Mapa y campaña
- ✅ C1 **Zoom a la ciudad y guarnición en el mapa** (13/11): 1 a 4 figuras de guarnición junto a cada ciudad con la cámara cerca; acercar sobre una ciudad propia (o tocarla dos veces) abre la ciudad con transición y «← Mapa» vuelve al encuadre exacto. Parte `partes/2026-11-13-C1.md`.
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
- ✅ H12 Capua se rebela en 216 si no tiene 150 hombres (Livio 23.2-7; la regla es licencia de juego).
- ✅ H13 Pirro ataca en 280 (llega a los 56 meses; licencia de juego). Bot 10/10 y 0/10.
- ✅ H14 «Poblado íbero» hasta 228 en el mapa y la Crónica; luego Carthago Nova.
- ✅ H13b Pirro llega a los 32 y 42 meses en dos oleadas menores, y Roma empieza con +30 hastati y +20 velites (licencia de juego). Bot 10/10 y 0/10 en las dos regiones.

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
- ⬜ I8b **Pulir la partida corta**: etiquetas de colonias libres tapan Roma en el mapa de Italia; recursos vacíos de la barra mientras se funda; probar edad 3 con el bot; arado: pasar a «jugando» al terminar el surco.

## Carril K — Concurso
- 🟨 K10 Arte de la batalla: R1 (P1 estandarte) **gusta** (falta elegir A/B/C); R2 (tarjeta + barra) **descartada** (las barras tapan el campo; reformular con menos marco); **faltan R1b (P1 con reglas nuevas), R3 (P3 avisos) y R4 (P5 mapa de maniobra)**. Parte: `partes/2026-11-13-K10.md`.
