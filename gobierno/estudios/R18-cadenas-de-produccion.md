# R18 · Cadenas de producción cortas (Pharaoh y Caesar III)

Estudio de una sola mecánica. Solo cómo se comporta; nada de código, arte ni textos de los juegos.

## 1. Pregunta
¿Cómo hacen Caesar III y Pharaoh que una cadena (materia prima, taller, bien, casa) importe sin ser un rompecabezas, y cómo dejarla corta en un móvil sin calles?

## 2. Observación
- Caesar III: cada materia prima tiene un solo producto: aceitunas a aceite, uvas a vino, arcilla a cerámica, madera a muebles, hierro a armas. [Caesar III Augustus, industria](https://www.caesar3augustus.com/book/farmingindustry/industry)
- Un productor de materia prima a pleno rendimiento abastece unos **dos talleres**. [Caesar III Augustus, talleres](https://www.caesar3augustus.com/book/farmingindustry/workshops)
- Un taller parado le falta una de dos cosas: **trabajadores o materia prima**. [Caesar III Augustus, talleres](https://www.caesar3augustus.com/book/farmingindustry/workshops)
- Los sitios de materia prima necesitan trabajadores cerca y camino hasta el taller; la arcilla, agua cerca. [Caesar III Augustus, arcilla, hierro, madera](https://www.caesar3augustus.com/book/farmingindustry/clayirontimber)
- Falta de mano de obra: se desactivan granjas o industrias con sobrante desde el consejero de comercio, y hay prioridades de trabajo. [Caesar III Augustus, personas](https://www.caesar3augustus.com/book/info/managingpeople), [GameRevolution, guía](https://www.gamerevolution.com/?p=29190)
- Sin confirmar: si un taller sin trabajadores se para del todo o solo baja (las fuentes no lo dicen). Pharaoh y Pharaoh: A New Era: no salió nada útil en las búsquedas; no se afirma nada de ellos.

## 3. Por qué funciona
Cada eslabón tiene una razón visible de fallo (falta gente o falta insumo). El jugador diagnostica sin números. El bien final tiene consumidor claro: la casa lo pide para subir.

## 4. Traducción a AQVILA
- No hay calles ni carros: el «transporte» es gratis dentro de la ciudad. Solo quedan **insumo** y **gente**.
- Hoy (`js/data.js`): 5 recursos; aserradero, cantera, mina y granja producen directo.
- Propuesta (nuestra): una sola cadena de dos pasos: **hierro, herrería, armas** y **grano, molino, pan** cuando la ciudad tiene el taller. Cada taller convierte 2 de insumo en 1 de bien al mes (nuestro), usa 1 «obrero» de la población (nuestro).
- Si falta insumo u obreros, el taller **baja a la mitad** (nuestro), nunca a cero: en móvil no castiga el descuido. Qué se pierde: las tropas que piden armas cuestan más oro sin ellas.
- Visual: en la medalla del edificio (`city3d.js`) el aviso de alerta ya existe; sirve para «falta hierro».
- Lógica en `js/game.js`, cálculo mensual; datos en `js/data.js`. Migrar en `G.load`.
- Época: **licencia de juego** (talleres y fábricas de armas del Estado son anacronismo, aunque hubo fabricae en el Imperio).

## 5. Coste y riesgo
- 1 sesión media (0,7–1,5 M de tokens, cifra del tablero), más ajuste del bot.
- Riesgo: más números que explicar. Mitiga: una sola cadena y un consejo de línea («la herrería para: falta hierro»).

## 6. Versión mínima
Solo herrería: consume hierro y da «armas»; el reclutamiento de infantería pesada usa armas. Sin obreros todavía.
