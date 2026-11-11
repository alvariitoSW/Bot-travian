# R19 · Ciudad viva: cómo se hace que se vea con vida (aspecto, no reglas)

Estudio de aspecto. Solo cómo se comporta; nada de código, arte ni textos de los juegos.

## 1. Pregunta
¿Qué técnicas usan los juegos de ciudades para que la ciudad parezca viva, y cuáles caben, baratas, en three.js en un móvil?

## 2. Observación
- Anno 1800: el ciclo día/noche no es solo oscurecer; se esperaba la ciudad más tranquila de noche, y se puede parar el ciclo para disfrutar del atardecer. La luz tuvo que cuidar también el crepúsculo. [Anno Union, devblog día/noche](https://devtrackers.gg/anno-1800/p/f5f56fe2-devblog-day-night)
- Anno 1800: las ciudades «bullen» con gente; a más ajustes gráficos, más personas, con coste de rendimiento al alejar la cámara. [Aur Review](https://www.theaureview.com/games/anno-1800-review-bold-new-era/), [PC Gamer](https://pcgamer.com/anno-1800-review)
- Anno 1800: estaciones como sistema oficial: **no confirmado**; solo adornos de temporada y un mod de comunidad. [Devtrackers, mod](https://devtrackers.gg/anno-1800/p/5b2d7cc9-upcoming-mod-new-horizons-of-cities-and-seasons)
- Anno 117: unidades nuevas de «realimentación» (personas y animales); subir una casa cambia su gente de nivel. [Anno Union, 117](https://www.anno-union.com/?p=22663), [Gamingtrend](https://gamingtrend.com/previews/anno-117-pax-romana-hands-on-preview-build-your-island-build-your-legacy)
- Anno 117: la ciudad se lee menos como cuadrícula y más orgánica y habitada. [TechRadar](https://www.techradar.com/gaming/anno-117-pax-romana-review)
- Manor Lords: las familias sin puesto construyen y los bueyes acarrean la madera a la obra. Andamios y animaciones de obra: sin confirmar. [Wiki Manor Lords](https://wiki.hoodedhorse.com/Manor_Lords/Buildings/en)
- Pharaoh: A New Era: sin confirmar (no salió nada).

## 3. Por qué funciona
Movimiento y cambio dicen «aquí pasan cosas» sin leer números. Lo que sube de nivel se ve distinto; lo que se construye, se ve en obra.

## 4. Traducción a AQVILA (todo arte con licencia libre; 0 A.D. CC BY-SA ya se usa)
Ya existe en `js/gfx/city3d.js`: edificios reales de 0 A.D. por nivel (`SLOTS`), medalla con icono, nivel y aviso de obra/alerta; ciudadanos por `WAY` según población (instanciados, animados); sacerdotes; barcos según el puerto; niebla, hemisférica y sol fijo; pixel ratio ≤ 1,75.
Falta, con técnica barata:
- **Hora y estación**: tinte de luz y niebla con la fecha del juego (3 pasos del día, 4 estaciones); sin sombras nuevas. Coste casi nulo.
- **Humo**: 1 malla instanciada de quads con textura; en herrería, termas, cuartel y casas de noche. 
- **Obra**: mientras hay cola, un cubo de «andamio» (listones) instanciado sobre el solar, sin cambiar el modelo.
- **Cambio al subir**: escala/variante cada 3 niveles y banderines por nivel (instanciados).
- **Cámara**: ya hay; añadir inclinación suave al abrir (nuestro) y límites.
- Presupuesto en `gobierno/arte.json`; skill `arte` antes de añadir arte.
- Época: **licencia de juego** en estaciones y humo; nada que contradiga las fuentes.

## 5. Coste y riesgo
- Cada técnica es una tarea pequeña (0,3–0,8 M de tokens, estimación nuestra). Rendimiento en móvil real **sin medir**.

## 6. Versión mínima
Luz según el mes del año (4 tintes) y humo en herrería y termas. Se ve en una captura.
