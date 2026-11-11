# R17 · Almacén con tope: lo que no cabe se pierde (Travian e Ikariam)

Estudio de una sola mecánica. Solo cómo se comporta; nada de código, arte ni textos de los juegos.

## 1. Pregunta
¿Cómo usan Travian e Ikariam el tope de almacén para que el jugador gaste lo que gana en vez de acumularlo?

## 2. Observación
- Travian: almacén (madera, barro, hierro) y granero (cereal) tienen tope. Lo que se produce por encima **se pierde**; la guía oficial dice que se suban ambos edificios para evitarlo. [Travian, recursos](https://support.travian.com/en/articles/214-guide-resources-explained)
- Travian: el escondrijo (cranny) protege una cantidad fija de cada recurso contra el saqueo; se aconseja cubrir lo que se acumula de noche. [Travian, escondrijo](https://support.travian.com/en/support/solutions/articles/7000068298)
- Travian: el escondrijo rinde más o menos según la tribu atacante y su héroe. Cifras exactas por nivel: sin confirmar (las fuentes se contradicen). [Travian, escondrijo](https://support.travian.com/en/support/solutions/articles/7000068298)
- Ikariam: lo recibido por encima del máximo se pierde. [Ikariam wiki, Dump](https://ikariam.fandom.com/wiki/Building:Dump_(Pre_8.8))
- Ikariam: el almacén guarda recursos y además **protege** una parte de cada uno; lo que excede puede saquearse. Cada tipo se protege por separado. [Gameforge, almacén](https://gameforge.com/no-NO/games/ikariam-lager.html), [Ikariam wiki, Recursos](https://ikariam.fandom.com/wiki/Resources)
- Ikariam: el depósito (dump) da más sitio pero **no** protege del saqueo; la protección depende solo de los almacenes. [Ikariam wiki, Dump](https://ikariam.fandom.com/wiki/Building:Dump_(Pre_8.8))
- Ikariam: lo puesto en venta en el mercado también cuenta y puede dejarte por encima del límite seguro. [Ikariam wiki, Dump](https://ikariam.fandom.com/wiki/Building:Dump_(Pre_8.8))
- Sin confirmar: la barra de llenado y el aviso «lleno en N horas» (no salió en las búsquedas; los juegos suelen mostrar tiempo hasta lleno junto a cada recurso).

## 3. Por qué funciona
El tope convierte el tiempo en presión: si no estás, produces para nada. El jugador gasta, comercia o amplía el almacén. El escondrijo separa «guardar» de «proteger», y da una decisión de solares.

## 4. Traducción a AQVILA
- Ya existe: `G.cap()` limita el stock, el almacén sube la capacidad y el saqueo esconde `D.ESCONDITE` (120) por recurso (`js/data.js`, `js/game.js`).
- Lo nuevo es el **presupuesto mensual** (nuestro): al cerrar el mes, lo ganado entra en un «fondo del mes»; se gasta ese mes; lo que sobra pasa al almacén hasta su tope; lo que no cabe se pierde.
- Cifras nuestras (a ajustar con el bot): tope base 600 por recurso (nuestro), +25 % por nivel de almacén (nuestro). Aviso de pérdida si el sobrante supera el hueco libre.
- Visual en `js/ui.js`: junto a cada recurso del encabezado, una barra fina; ámbar al 80 %, rojo al 100 %, con texto «lleno en 3 meses» (el mes es nuestra unidad; no horas). A 390 px cabe una barra de 3 px bajo cada icono.
- Guardado: migrar el campo del fondo en `G.load`.
- Época: **licencia de juego** (Roma tenía horrea, pero no «presupuesto mensual»).

## 5. Coste y riesgo
- Una tarea media: 1 sesión, 0,7–1,5 M de tokens (cifra del tablero).
- Riesgo: el bot de pruebas acumula y puede perder materiales; hay que enseñarle a gastar. Si la pérdida no se ve, frustra: el aviso de la barra es obligatorio.

## 6. Versión mínima
Barra de llenado en el encabezado y aviso de un mes antes de perder producción. Sin fondo mensual todavía.
