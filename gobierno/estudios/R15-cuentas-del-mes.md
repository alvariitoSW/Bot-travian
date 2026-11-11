# R15 · Las cuentas del mes: ingresos, gastos y saldo (Imperator: Rome)

Estudio de una sola mecánica. Solo cómo se comporta; nada de código, arte ni textos del juego.

## 1. Pregunta
¿Cómo le enseña Imperator: Rome al jugador lo que gana y gasta cada mes, y qué pasa con lo que sobra?

## 2. Observación
- Hay **ingresos** y **gastos** mensuales, y el saldo se suma o resta al tesoro cada mes. [wikiwiki](https://wikiwiki.jp/irome/Economy)
- Ingresos: impuestos, comercio y tributo de súbditos. Gastos: ejércitos, flotas, fortalezas y salarios. [Diario de desarrollo](https://forum.paradoxplaza.com/forum/threads/imperator-development-diary-26th-of-november.1131338/page-6)
- El diario habla de **tres categorías de ingreso con tres ajustes cada una** (políticas económicas). Es de antes del lanzamiento. [Diario](https://forum.paradoxplaza.com/forum/threads/imperator-development-diary-26th-of-november.1131338/page-6)
- Cada batallón en pie cuesta un mantenimiento mensual (según una wiki japonesa, 1/48 de su coste de reclutar; **sin confirmar** en la versión actual). [wikiwiki](https://wikiwiki.jp/irome/Economy)
- El tesoro tiene tope (100 000 de oro según esa wiki) y **lo que excede se pierde**; puede quedar en negativo. [wikiwiki](https://wikiwiki.jp/irome/Economy)
- Los costes puntuales (edificios, misiones) salen directo del tesoro, aparte del saldo mensual. [wikiwiki](https://wikiwiki.jp/irome/Economy)
- Contraste EU4: el presupuesto se reduce a ingresos y gastos mensuales en una sola pestaña. [Gamepressure](https://www.gamepressure.com/europauniversalisiv/the-budget/z1547a)
- Sin confirmar: el desglose exacto de la pantalla y los deslizadores de gasto en Imperator (las búsquedas no los describen); en EU4 los deslizadores tampoco se pudieron cotejar.

## 3. Por qué funciona
El jugador ve de dónde viene cada moneda y a dónde va. Con un número final («+12 al mes») decide si reclutar más. El tope hace que acumular sin fin no sea gratis.

## 4. Traducción a AQVILA (números nuestros)
- Hoy: producción continua, almacén con tope, impuestos B3, mantenimiento I3, rutas B2.
- Propuesta: **mes = 30 días de juego**. Se enseña una hoja «Cuentas del mes» por material: ingresos (producción, impuestos, rutas) a la izquierda, gastos (mantenimiento de tropas, colas de edificios y reclutas, consumo de población) a la derecha, **saldo** abajo en verde/rojo.
- Al cerrar el mes: el saldo positivo va al almacén **hasta el tope**; lo que no cabe se pierde y se avisa («Perdiste 40 de madera: amplía el almacén»). Saldo negativo: se cubre del almacén; si no alcanza, tropas sin paga pierden moral (nuestra regla).
- Dos deslizadores por ciudad (nuestros): impuestos bajo/normal/alto (±25 % oro, ∓ felicidad) y ración de tropas.
- Lógica en `js/game.js` (acumuladores del mes por concepto, cierre mensual); datos en `js/data.js`; hoja en `js/ui.js`. Migrar el campo en `G.load`.
- Móvil: lista de 2 columnas, 5 materiales en pestañas. Offline: no afecta.
- Época: **licencia de juego** (presupuesto mensual no es romano; las cuentas anuales del erario sí existían).

## 5. Coste y riesgo
- 1 sesión media, ~1 M de tokens (estimación nuestra). Riesgo: el bot de pruebas y el equilibrio cambian; la hoja puede abrumar si muestra demasiadas líneas.

## 6. Versión mínima
Una línea «Este mes: +X / −Y = saldo» por material, aviso de lo perdido por tope, sin deslizadores.
