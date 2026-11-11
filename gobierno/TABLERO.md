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
- ⬜ B3 Felicidad/orden público, impuestos regulables, eventos de ciudad.
- ⬜ B4 Más edificios (anfiteatro, termas, acueducto, capitolio) y aspecto distinto por nivel.
- ⬜ B5 Marina: flotas, batallas navales o bloqueo.
- ⬜ B6 Ajuste de costes y tiempos con partidas reales (el bot no llega a tomar Cartago).

- ⬜ B7 **Saqueo**: atacar una ciudad para robar recursos sin conquistarla (botín según almacén y muralla), y que los
  rivales te saqueen; escondite de recursos. Rivales con ciudades que crecen como la tuya («otros jugadores» de la IA).
- ⬜ B8 Mejoras de materiales (herrería): niveles de armas y armaduras que suben el ataque/defensa de las tropas.
- ⬜ B9 Ciudad fiel a cada lugar: Roma con sus colinas, el Tíber y la muralla serviana; cada cultura, su trazado.
  (Hoy todas usan el trazado de colonia romana: recinto rectangular, cardo y decumano, foro e ínsulas.)

## Carril E — Arte (sistema coherente con la época)
- ⬜ E1 Guía de arte: paleta, materiales, tipografía e iconos romanos; sustituir los emojis de la interfaz por iconos
  propios; retratos y marcos con estilo de mosaico/fresco.
- ⬜ E2 Más piezas de 0 A.D. por cultura (edificios, barcos, máquinas de asedio, estandartes) con su crédito.
- ⬜ E3 Presupuesto de peso y de triángulos por escena.

## Carril C — Mapa y campaña
- ⬜ C1 Zoom continuo mapa → ciudad; ejércitos de guarnición visibles junto a cada ciudad.
- ⬜ C2 Costa y relieve del mapa con datos mejores; texturas de terreno en el mapa.
- ⬜ C3 Diplomacia sencilla (alianzas, tributos) e IA enemiga que también construye.

## Carril D — Técnica
- ⬜ D1 Medir rendimiento en un móvil real y fijar presupuestos (triángulos, descarga: hoy ~32 MB de arte).
- ⬜ D2 Niveles de detalle para soldados lejanos; comprimir animaciones.
- ⬜ D3 Motor nativo (Godot): está parado porque instalarlo aquí requiere un permiso del usuario.
- 🔶 D4 Publicar en GitHub Pages para instalar en el móvil: falta que el usuario active Pages en los ajustes del
  repositorio (rama de trabajo, carpeta raíz). Dirección prevista: https://alvariitosw.github.io/Bot-travian/
- ⬜ D5 Jueces automáticos: un solo comando que pase pruebas de lógica + recorrido en navegador + capturas.

## Gobierno
- ⬜ G1 Adaptar a este repositorio el sistema de `fiebres-neutropenias` (plan por equipos, bitácora, jueces,
  ahorro), en versión reducida. Decisión del usuario pendiente: qué ministerios trae.
