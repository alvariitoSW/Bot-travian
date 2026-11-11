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
- ⬜ A1 Formaciones de verdad: tabla por unidad (ancho/fondo, separación), arrastrar para dar ancho y frente,
  esperar a los rezagados, columna de marcha. (Ideas del estudio de 0 A.D. y TotalWarSimulator.)
- ⬜ A2 Animaciones por fila: falange con lanzas bajadas, testudo, postura «listo» frente a «relajado».
- ⬜ A3 Golpe sincronizado con la animación; combate solo de las primeras filas; persecución de los que huyen.
- ⬜ A4 Daño por tipo (corte/punta/aplastamiento) y armadura; revisar equilibrio (hoy las batallas igualadas se
  deciden de forma muy brusca; A8 ya lo suavizó).
- ⬜ A9 **Formación de salida y paso de marcha** (pedido 11/11, lo primero): al empezar, infantería delante, tiradores (vélites, arqueros, honderos) detrás y caballería en las alas, en los dos bandos; velocidades de marcha y carga creíbles por tipo de tropa; los tiradores disparan por encima y no se meten en el cuerpo a cuerpo. Vélites detrás: licencia de juego.
- ⬜ A5a **Despliegue antes de la batalla** (aprobada 11/11, P41): colocas tus regimientos, tres plantillas de un toque, y pulsas «Empezar batalla». 0,2 + 0,7 M · 20 min.
- ⬜ A5b **Terreno con efecto: colina y bosque** (aprobada 11/11, P42), un campo tipo por ciudad. 0,25 + 0,9 M · 25 min. Después de A5a.
- ✅ A8 **Ritmo y moral** (11/11): batallas igualadas de 8 a 12 minutos, sin corte a los 4; moral gradual; cansancio con marca «Cansado».
- ⬜ A8b Ajuste fino del ritmo con partidas del usuario: las muy desiguales duran unos 2,5 min y las algo desiguales 7 a 8; revisar si la calidad de tropa pesa demasiado (exponente 0,85).
- ⬜ A6 Cámara cinematográfica (seguir cargas), sonido, proyectiles con arco y polvo mejorados.
- ⬜ A7 Ciudades enemigas con edificios de su cultura (cartaginesa, griega, gala, íbera).

## Carril B — Ciudad y economía (tipo Travian/Ikariam)
- ⬜ B1 Recurso especial por ciudad (vino, mármol, plata, caballos…) necesario para niveles altos y tropas de élite.
- ⬜ B2 Rutas comerciales entre ciudades propias y con aliados; barcos mercantes visibles.
- ✅ B3 Felicidad e impuestos (bajo, normal, alto) por ciudad.
- ✅ B4 Termas, acueducto y anfiteatro con sus reglas; en 3D llevan un modelo provisional hasta E4.
- ⬜ B5 Marina: flotas, batallas navales o bloqueo.
- ✅ B6 Equilibrio: el bot de pruebas toma Cartago en 6 de 10 campañas; sin cambiar números del juego.

- ⬜ B7 **Saqueo**: atacar una ciudad para robar recursos sin conquistarla (botín según almacén y muralla), y que los
  rivales te saqueen; escondite de recursos. Rivales con ciudades que crecen como la tuya («otros jugadores» de la IA).
- ✅ B8 Herrería: mejoras de armas y armaduras, +5 % por nivel (máx. +25 %).
- ✅ B10 Aníbal suavizado: 20 % menos de tropas y dos meses más de marcha; el bot gana 8 de 10 y Roma ya no cae.
- ✅ B9 Roma con el Tíber y una colina (versión simple; las demás ciudades, igual).

## Carril F — Modos de juego (decisión del usuario, 11/11/2026)
- ✅ F1 Diseño de modos decidido: campaña histórica como base del modo largo, primero la partida corta, tres dioses (Marte, Ceres, Neptuno). `gobierno/estudios/F1-modos-de-juego.md`.
- ✅ F2 Sustituida por I2 (mapa por turnos; decisión del 11/11).
- ✅ F3 Aldeanos: reparto entre madera, piedra, hierro y grano (en la vista de lista).
- ⬜ F5 **Templos a un dios** (aprobada 11/11, P56; antes «favor de un dios»): en cada ciudad puedes levantar un templo a Marte, Ceres o Neptuno; cada templo extiende cultura y religión y hace que una ciudad conquistada se rebele menos. Ocupa un solar (I4). ≈0,2 + 0,6 M, a ojo. Después de I4.

## Carril I — Gran diseño, fase 1 (aprobado 11/11/2026; informe `gobierno/estudios/G3-gran-diseno.md`)
Orden: I1 primero y sola; después I2 a I5 (no se pisan si van de una en una); I6, I7; I8 al final.
- ✅ I1 Registro de piezas: `js/registro.js` (84 fichas con arte y fuente) y juez `node gobierno/fichas.mjs`, dentro de los jueces.
- 🔶 I1b Fichas del registro al día tras Historia 2 (el juez pasa; 10 fichas nuevas). Falta: pasar a «histórico» los dictámenes ya cotejados y que Códice y registro compartan una sola fuente (P55, aprobada 11/11). ≈0,3 M.
- ⬜ I2 **Mapa por turnos** (P44 y P57, aprobadas 11/11): una estación = un turno, con «consejo de estación» y botón «Pasar turno»; los rivales mueven y atacan en los suyos y ves llegar sus tropas turno a turno; ciudad y batalla siguen en tiempo real. ≈0,25 + 0,8 M · 25 min.
- ⬜ I3 **Mano de obra y mantenimiento** (P45): reclutar vacía los campos; edificios y tropas cuestan. 0,15 + 0,5 M · 15 min.
- ⬜ I4 **Tipos de ciudad con solares limitados** (P46): cada ciudad tiene un número fijo de solares y se dedica a recursos, tropas, comercio, mar, investigación o una mezcla; caben templos y edificios de ocio. 0,2 + 0,7 M · 20 min.
- ⬜ I5 **Investigación y edades** (P47): árbol corto de unas 16 mejoras; la herrería pasa a ser su rama de guerra. Sustituye a F4. 0,2 + 0,7 M · 20 min.
- ⬜ I6 **Región de Italia** montada solo con fichas (P48; prueba del cableado). 0,2 + 0,6 M · 20 min. Después de I1.
- ⬜ I7 **Regiones** (P50): cada región tiene una ciudad principal y zonas de industria a su alrededor. 0,2 + 0,7 M · 20 min, a ojo. Después de I4 e I6.
- ⬜ I8 **Partida corta** (P49): fundas de cero, un rival, un final. Sustituye a F1b. 0,25 + 0,8 M · 25 min. Después de I2 a I7.

## Carril E — Arte (sistema coherente con la época)
- ✅ E1 Guía de arte aprobada (paleta, letra, iconos): `gobierno/estudios/E1-guia-de-arte.md` y su muestra.
- ⬜ E4 Arte propio para termas, acueducto y anfiteatro (pedido 11/11/2026): buscar piezas con licencia libre (skills `radar` y `arte`); mientras, llevan un modelo provisional.
- ✅ E1b Guía de arte, primera parte (11/11): iconos de línea para madera, piedra, hierro, grano, denarios y población; letra Cinzel incluida en el juego (SIL OFL 1.1, 29 KB); mármol, oliva y terracota en vez de blanco azulado, verde fosforito y rosa.
- ⬜ E1c Guía de arte, segunda parte: iconos de guerra (⚔️ 🛡️ 🦅 🪖) y de edificios, marcos con doble filete y greca, esquinas de 6–8 px. Las barras de moral de la batalla siguen en el verde antiguo (`js/gfx/battle3d.js`, carril Batallas).
- ⬜ E2 Más piezas de 0 A.D. por cultura (edificios, barcos, máquinas de asedio, estandartes) con su crédito.
- ✅ E3 Presupuesto por escena en `node gobierno/arte.mjs` (batalla 1,1 millones, ciudad 300 mil; provisional hasta D1).

## Carril C — Mapa y campaña
- ⬜ C1 Zoom continuo mapa → ciudad; ejércitos de guarnición visibles junto a cada ciudad.
- ⬜ C2 Costa y relieve del mapa con datos mejores; texturas de terreno en el mapa.
- ⬜ C3 Diplomacia sencilla (alianzas, tributos) e IA enemiga que también construye.

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
- ⬜ H11 **Segunda pasada de cotejo** (aprobada 11/11, P51): los 60 datos «sin comprobar» y los pasajes dudosos en latín y griego. Hace falta abrir attalus.org o similar. ≈1,5 M Sonnet.
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
