# R16 · Balance por bien y necesidades de cada clase (Anno 1800)

Estudio de una sola mecánica. Solo cómo se comporta; nada de código, arte ni textos del juego.

## 1. Pregunta
¿Cómo muestra Anno 1800 si un bien sobra o falta, y cómo hace que eso suba, estanque o enfade a cada clase?

## 2. Observación
- Hay varias clases (cinco en el Viejo Mundo, dos en el Nuevo). Cada una tiene necesidades básicas y de lujo, con consumo por habitante y minuto. [Wiki](https://anno1800.fandom.com/wiki/Population?oldid=3313)
- Para subir de clase **bastan las necesidades básicas** cubiertas; la felicidad ya no es requisito (separaron «lo que da población» de «lo que da felicidad»). [DevBlog felicidad](https://www.anno-union.com/en/devblog-happiness/)
- Los lujos no cubiertos no tienen castigo fuerte; dan impuestos y felicidad extra. [Steam](https://steamcommunity.com/app/916440/discussions/0/4035852798889680783) (comentario de jugador)
- Si faltan necesidades, los habitantes pueden **marcharse** o protestar, y eso daña las cadenas que dependían de su trabajo. [Gamepressure](https://www.gamepressure.com/newsroom/how-to-fix-a-problem-with-insufficient-workforce-in-anno-1800/za520c)
- El jugador vigila **producción frente a consumo** de cada bien y puede ajustar producción desde la barra de clases. [PC Gamer](https://www.pcgamer.com/uk/anno-1800-tips-guide/)
- Hay una vista de estadísticas que suma producción y consumo por isla. [PC Gamer](https://www.pcgamer.com/uk/anno-1800-tips-guide/), [Steam](https://steamcommunity.com/app/916440/discussions/0/4035852798889680783)
- Sin confirmar: colores y umbrales exactos del balance, y reglas exactas de descenso de clase. Anno 117: Pax Romana: no se halló nada fiable.

## 3. Por qué funciona
El jugador no adivina: ve «+2 / −3» por bien y sabe qué cadena ampliar. Separar crecer (básicas) de contentar (lujos) permite elegir ritmo.

## 4. Traducción a AQVILA (números nuestros)
- Hoy: población, grano, felicidad e impuestos B3. Falta la noción de clase.
- Propuesta: tres clases por ciudad (plebe, ecuestres, patricios; **licencia de juego**, la plebe y los equites sí existían). Cada una consume por mes: plebe grano 1 y madera 0,2 por 100 hab.; ecuestres además hierro y oro; patricios piedra y oro (cifras nuestras, a ajustar).
- Cada bien muestra su **balance mensual** (+/−) en la ficha, junto al saldo de R15.
- Sube la clase si sus básicas se cubren 3 meses seguidos; si faltan 2 meses, **se enfada** (menos impuestos); 4 meses, **baja** y se va el 10 % de esa clase. Lujos: solo suben impuestos.
- Lógica en `js/game.js` y tabla de necesidades en `js/data.js`; filas con barra en `js/ui.js`. Migrar en `G.load`.
- Móvil: una fila por bien, icono + número a 390 px.

## 5. Coste y riesgo
- 1–2 sesiones, ~1,5 M de tokens (nuestra estimación). Riesgo: equilibrio del bot; castigo opaco si no se explica.

## 6. Versión mínima
Dos clases (plebe y ecuestres), una necesidad básica cada una, balance +/− del grano a la vista y aviso «tu plebe pasa hambre».
