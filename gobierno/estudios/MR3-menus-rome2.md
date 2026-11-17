# MR3 · Menús de Rome II: principal, escaramuzas y carga · estudio corto (17/11/2026)

Pedido del usuario (P173): «buscar en internet cómo son los menús de escaramuzas del Rome 2 Total War y sacar ideas
de ahí para hacer un buen menú principal y de escaramuzas y que cargue bien el juego mejor de lo que tenemos ahora».
Skill `ingenieria-reversa`: **solo ideas**. No se copia arte, logotipos, textos ni la disposición exacta; no se guarda
ninguna imagen del juego en el repositorio. Lo de abajo está descrito con palabras propias.

## 1. Pregunta
¿Cómo hace Rome II para que el jugador entre rápido a jugar (menú), monte una batalla suelta en pocos toques
(batalla personalizada) y espere la carga sin aburrirse?

## 2. Observación
1. **Menú principal**: una lista corta de destinos en columna (campaña, batallas, multijugador, opciones, enciclopedia)
   sobre una escena en movimiento del propio juego. Las batallas sueltas están partidas en dos: **personalizada** (montas
   un ejército para cada bando y eliges el mapa) e **históricas** (escenarios reales contra la máquina). Fuente: manual
   oficial, página del menú principal (r2encv2.totalwar.com, «frontend main menu»).
2. **Seguir donde lo dejaste** está siempre a mano y es lo más grande: el jugador que vuelve no busca. Fuente: manual
   oficial (campaña); observación general del juego.
3. **Batalla personalizada**: pantalla partida en **dos bandos frente a frente**; cada uno elige facción (con su escudo
   y su color) y un presupuesto o tamaño; en medio, el **mapa con una vista previa** del campo, y ajustes de la
   batalla (hora, clima). Un solo botón grande para empezar. Fuentes: manual oficial (menú principal: «construir un
   ejército para cada bando y elegir el mapa»); notas de parche 17 en wiki.totalwar.com (todas las facciones disponibles
   en la batalla personalizada).
4. **Carga**: imagen grande a pantalla completa, una **barra de progreso** abajo y un **texto corto** para leer mientras
   espera (consejo o pasaje histórico). En la carga de batalla se ven los dos bandos. Fuente: observación general; los
   mods de pantallas de carga del taller de Steam (Rome II) confirman que es una imagen más barra y texto.

Lo que **no** se pudo leer: la enciclopedia oficial y la wiki no se dejaron descargar desde aquí; no hay fuente
escrita sobre si los textos de carga son citas por facción. No se usa.

## 3. Por qué funciona
- Una sola acción grande por pantalla: nadie duda qué tocar.
- Los dos bandos frente a frente se entienden sin leer: «yo contra él», con sus fuerzas a la vista antes de empezar.
- La vista previa del campo dice qué pasará sin explicarlo.
- En la carga, el progreso visible y algo que leer hacen la espera corta; la pantalla nunca está vacía.

## 4. Traducción a AQVILA (390 px, sin conexión, todo dibujado por código)
| Idea | En AQVILA | Archivo |
|---|---|---|
| Seguir donde lo dejaste, lo más grande | Tarjeta de papiro «Tu campaña» con fecha, ciudades y sello rojo «Continuar» | `js/ui.js` (`showMenu`), `css/style.css` |
| Lista corta de destinos | Filas de bronce: Nueva campaña, Escaramuzas, Partida corta, Región de Italia, Opciones | idem |
| Escena del juego detrás | Escena dibujada en SVG: atardecer, colinas y la legión formada con estandartes (sin imágenes) | idem |
| Dos bandos frente a frente | Cabecera «Roma contra …» con escudo de color de cada bando, hombres de cada uno y una barra de fuerzas | `escHtml` en `js/ui.js` |
| Facción con escudo y color | Cinco escudos con el color de la facción (de `D.FACTIONS`) | idem |
| Vista previa del campo | Cuatro tarjetas con un paisaje dibujado (llano, colina, bosque, mixto) | idem |
| Composición del ejército | Fichas «Hastati 300» de cada bando en vez de un párrafo | idem |
| Carga con barra y texto | Portada de carga desde el primer instante (en `index.html`), barra por fases con su nombre y un «¿Sabías que…?» sacado del Códice, con su fuente y su dictamen | `index.html`, `js/carga.js` |
| Nada de pantallas a medio cargar | Si entras antes de que estén los soldados y edificios, la misma pantalla de carga tapa hasta que llegan (como mucho 15 s) | `js/ui.js`, `js/carga.js` |

Fuera (no cabe en la 1.0 o cambia reglas): hora del día y clima en escaramuzas (el motor de guerra no los tiene),
presupuesto en monedas para comprar tropas, batallas históricas con escenario propio. Van a «Después de la 1.0».

## 5. Coste y riesgo
Una sesión (≈1,2 M). Riesgo: los jueces pulsan `#menu [data-act="new"]`, `continue`, `newregion` y
`[data-act="hoja"][data-v="corta"]`; se conservan visibles. La portada de carga no debe retrasar el menú.

## 6. Versión mínima
Portada de carga con barra y dato; tarjeta «Continuar» grande; escaramuza con los dos bandos frente a frente.

## Fuentes
- Manual oficial de Rome II, menú principal: https://r2encv2.totalwar.com/en/manual/single-player/0006_enc_page_frontend_main_menu/index.html
- Notas del parche 17 de Rome II: https://wiki.totalwar.com/w/Total_War_ROME_II:_Patch_17
- Taller de Steam de Rome II (mods de pantallas de carga): https://steamcommunity.com/app/214950/workshop/
