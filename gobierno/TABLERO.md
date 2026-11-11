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
  deciden de forma muy brusca).
- ⬜ A5 Despliegue antes de la batalla y terreno con efecto (altura, bosque).
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
- ⬜ B10 Suavizar la ofensiva de Aníbal sobre Roma hacia el 215 a.C. (aprobado 11/11/2026): hoy causa 3 de cada 4 derrotas del bot.
- ✅ B9 Roma con el Tíber y una colina (versión simple; las demás ciudades, igual).

## Carril F — Modos de juego (decisión del usuario, 11/11/2026)
- ✅ F1 Diseño de modos decidido: campaña histórica como base del modo largo, primero la partida corta, tres dioses (Marte, Ceres, Neptuno). `gobierno/estudios/F1-modos-de-juego.md`.
- ⬜ F1b Construir la partida corta según F1 (el usuario: «podemos empezar por ahí»). Partirla en tareas de una sesión antes de empezar.
- ⬜ F2 Tiempo real que sigue corriendo con el juego cerrado (para la partida de semanas), con tope y resumen al volver.
- ✅ F3 Aldeanos: reparto entre madera, piedra, hierro y grano (en la vista de lista).
- ⬜ F4 Edades (p. ej. Monarquía → República temprana → media → tardía) que desbloquean edificios, tropas y mejoras.
- ⬜ F5 Favor de un dios (Marte, Júpiter, Ceres, Neptuno…): un poder con recarga.

## Carril E — Arte (sistema coherente con la época)
- ✅ E1 Guía de arte aprobada (paleta, letra, iconos): `gobierno/estudios/E1-guia-de-arte.md` y su muestra.
- ⬜ E4 Arte propio para termas, acueducto y anfiteatro (pedido 11/11/2026): buscar piezas con licencia libre (skills `radar` y `arte`); mientras, llevan un modelo provisional.
- ⬜ E1b Aplicar la guía de arte al juego, empezando por los 6 iconos de recursos y la letra Cinzel incluida (aprobado 11/11/2026).
- ⬜ E2 Más piezas de 0 A.D. por cultura (edificios, barcos, máquinas de asedio, estandartes) con su crédito.
- ✅ E3 Presupuesto por escena en `node gobierno/arte.mjs` (batalla 1,1 millones, ciudad 300 mil; provisional hasta D1).

## Carril C — Mapa y campaña
- ⬜ C1 Zoom continuo mapa → ciudad; ejércitos de guarnición visibles junto a cada ciudad.
- ⬜ C2 Costa y relieve del mapa con datos mejores; texturas de terreno en el mapa.
- ⬜ C3 Diplomacia sencilla (alianzas, tributos) e IA enemiga que también construye.

## Carril H — Historia (ministerio de Adecuación Histórica)
- 🔶 H1 Auditoría histórica de lo que ya hay: tropas (armas y vestimenta), las 18 ciudades y los hechos, con fuentes;
  lista de anacronismos, licencias de juego y cambios propuestos. No cambia el juego.
- 🔶 H2 Fichas con fuentes de las grandes batallas: Heraclea, Ásculo, Trebia, Trasimeno, Cannas, Zama y Pidna.
- ⬜ H3 Códice dentro del juego, simple: una pestaña para leer las fichas ya comprobadas. Después de H1.

## Carril D — Técnica
- 🔶 D1 Contador «Medir fluidez» hecho (menú principal). Falta que el usuario mida en su móvil: mapa, ciudad y batalla grande.
- ✅ D2 Niveles de detalle en batalla: lejanos con figura ligera; se pintan ~1.395 soldados en vez de 494 con el mismo tope.
- ✅ D3 Estudio de Godot: no pasar ahora; se revisa tras medir con D1. `gobierno/estudios/D3-godot.md`.
- ✅ D4 Publicado en GitHub Pages: https://alvariitosw.github.io/Bot-travian/ (falta confirmar en el móvil del usuario).
- ✅ D5 Jueces automáticos: `node gobierno/jueces.mjs` (lógica + recorrido en navegador + capturas).

## Gobierno
- ✅ G2 Ministerio de Adecuación Histórica montado (11/11/2026): skill `historia`. Sus tareas, cuando el usuario las apruebe, irán en un carril H.
- ✅ G1 Gobierno reducido y cuadro de mando montados (11/11/2026). Guía: `gobierno/LEEME.md`.
