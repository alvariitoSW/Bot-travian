# Q1l · Competencia: cómo sacarle más jugo a la ciudad de cero

Informe rápido (12/11/2026). Parte del diseño aprobado en `Q1k-ciudad-de-cero.md`. **No cambia nada del juego.**
Fiabilidad **media-baja**: 12 búsquedas, solo se leyeron resúmenes; varias fuentes son agregadores automáticos de
reseñas. «s. c.» = sin confirmar. De otros juegos se toman **ideas**, nunca arte ni código.

## 1. Quién compite
| Juego | Lo que hace mejor | Lo que le critican | ¿Móvil? | Fuente |
|---|---|---|---|---|
| Pocket City 2 | ciudad completa de pago único (5 $), sin compras dentro | poca rejugabilidad (nota 6 en una reseña); ¿offline? s. c. | Sí | [PC Gamer](https://pcgamer.com/this-fantastic-new-city-building-mobile-game-could-teach-pc-city-builders-a-few-tricks), [Gaming on Phone](https://gamingonphone.com/reviews/pocket-city-2-game-review) |
| TheoTown | simulación honda «de PC», funciona sin conexión, ampliaciones hechas por jugadores | anuncios que cortan el juego, interfaz torpe, inestable | Sí | [148Apps](https://148apps.com/reviews/theotown-review), [ficha App Store](https://apps.apple.com/us/app/theotown/id1459639864) |
| Townscaper | tocas y sale bonito solo; relaja | «no es un juego»: sin metas ni retos; no pasa la ciudad de un aparato a otro | Sí | [TouchArcade](https://toucharcade.com/2021/10/20/townscaper-mobile-review-iphone-android-ipad-icloud-controller-support-raw-fury/) |
| Dorfromantik | colocar una pieza y ver cuánto encaja; partidas tranquilas | la suerte al robar piezas frustra | anunciado; salida s. c. | [Pocket Gamer](https://www.pocketgamer.com/dorfromantik/coming-to-mobile) |
| Polytopia | estrategia por turnos reducida a partidas cortas; hecha para el dedo | poca variedad entre partidas; el final se repite; tribus de pago | Sí | [TouchArcade](https://toucharcade.com/2016/04/20/super-tribes-review/), [Nintendo World Report](https://nintendoworldreport.com/review/63151) |
| Rome: Total War (móvil) | el juego entero de PC en el móvil, con asesor que enseña; unas 10 £ | dedo impreciso al mandar tropas; pensado para ratón | Sí | [Feral](https://www.feralinteractive.com/en/news/building-rome-the-touch-controls-of-rome-total-war-on-ipad/), [App Store](https://apps.apple.com/gb/app/rome-total-war/id1106831630?uo=2) |
| Northgard (móvil) | estrategia de PC rehecha para tocar; pago único (8 $) | cierres al arrancar; clanes aparte a 3 $ cada uno | Sí | [TouchArcade](https://toucharcade.com/2021/04/13/northgard-mobile-out-now-ios-price-free-dlc-roadmap-playdigious-shiro-games/) |
| Nova Roma (acceso anticipado, marzo 2026) | agua de verdad: presas, crecidas, sequías; dioses que premian y castigan | interfaz poco clara, ritmo, sistemas que se pisan; hay quien apaga dioses e invasiones | No (PC) | [Steam Deck HQ](https://steamdeckhq.com/game-reviews/nova-roma-early-access/), [Game8](https://game8.co/articles/reviews/nova-roma-review-early-access) |
| Anno 117 | cadenas de producción y comercio entre regiones, en Roma | arranque abrumador de menús; combate flojo; campaña corta | No (PC y consola) | [GDGTME](https://www.gdgtme.com/video-game-reviews/anno-117-pax-romana-review), [Prima Games](https://primagames.com/?p=356679) |
| Manor Lords | pueblo que crece con forma natural + batallas | a media partida «no hay nada nuevo»; sin objetivo claro; combate limitado | No (PC) | [GamesRadar](https://gamesradar.com/games/city-builder/manor-lords-dev-responds-to-criticism-of-his-city-builders-updates-saying-that-while-theyre-not-always-impressive-to-show-off-he-wants-to-focus-on-issues-that-people-comment-on), [debate en Steam](https://steamcommunity.com/app/1363080/discussions/1/594014141938701835) |
| Kingdoms and Castles | ciudad sencilla y relajada con ataques de fuera | poco contenido; el final se repite; enseña mal | no se encontró versión móvil | [Metacritic](https://legacy.prod.metacritic.com/game/pc/kingdoms-and-castles/critic-reviews) |
| Rise of Kingdoms, Forge of Empires (contraejemplo) | enganchan a diario, juego con otra gente | «paga para ganar»; piden mucho tiempo y dinero | Sí | [Trustpilot](https://uk.trustpilot.com/review/forgeofempires.com), [Metacritic](https://www.metacritic.com/game/forge-of-empires/) |

## 2. El hueco
- **Nadie junta las cinco cosas.** Ciudad que nace sola + sitio que importa + guerra táctica + historia real + offline
  sin compras ni anuncios.
- Los bonitos del móvil (Townscaper) no tienen metas. Los hondos del móvil (TheoTown) llevan anuncios.
- Los de Roma con ciudad viva (Nova Roma, Anno 117) son de PC y su guerra es lo flojo.
- El que tiene guerra buena en el móvil (Rome: Total War) no deja fundar ni colocar: la ciudad es una lista.
- El más parecido en espíritu (Manor Lords) no está en móvil y se queda vacío a media partida.
- **Dónde es más débil AQVILA hoy:**
  - La ciudad nueva es una maqueta, no está en el juego (P80 sin empezar).
  - El rendimiento en un móvil real no está medido.
  - Los números de equilibrio son de muestra.
  - Solo se probó un terreno: no se sabe si siempre sale una ciudad bonita.
  - Riesgo que señalan las críticas ajenas: sin metas ni novedades a media partida, se apaga (Townscaper, Manor
    Lords, Kingdoms and Castles).

## 3. Diez palancas, de más efecto con menos trabajo a menos
Tamaño: pequeña = una sesión; grande = varias. «De memoria» = idea conocida del juego, no comprobada en esta búsqueda.

| # | Qué vería el jugador | Idea de | Tamaño | Riesgo |
|---|---|---|---|---|
| 1 | Al mover la pieza, un **número que cambia**: «+14 casas con agua». No solo verde y rojo. | Dorfromantik; Islanders (de memoria) | pequeña | bajo: una cifra más en la línea de razones |
| 2 | **Encargos del Senado** cortos y con premio: «Da agua a 40 casas antes del invierno». Siempre hay uno. | lo que le falta a Townscaper y Manor Lords | pequeña | bajo; hay que escribir bastantes para que no se repitan |
| 3 | **Asesor que enseña una cosa cada vez**, cuando toca, y luego calla. | Rome: Total War móvil (Feral) | pequeña | bajo; si habla de más, molesta |
| 4 | **Sucesos apagables y tres dificultades**: crecidas, incendios y hambre se pueden suavizar. | Nova Roma (hay quien los apaga) | pequeña | bajo; hay que probar cada combinación |
| 5 | **Copia de la partida** en un archivo, para no perderla ni al cambiar de móvil. | queja a Townscaper (no pasa entre aparatos) | pequeña | bajo; hoy la partida vive solo en el navegador |
| 6 | **Crónica de la ciudad**: «268 fundada · 265 crecida · 260 muralla de piedra». Y una **foto** para guardar. | Townscaper (enseñar lo hecho); la historia real es propia | pequeña | bajo |
| 7 | **Partida corta** de un cuarto de hora: fundar una colonia, 20 años, nota final. | Polytopia (partidas cortas) | media | medio: necesita una puntuación justa |
| 8 | **Terrenos distintos** en cada colonia (costa, vega, sierra): no hay dos ciudades iguales. | crítica a Polytopia y Manor Lords (poca variedad) | grande | medio: puede salir una ciudad fea en algún terreno |
| 9 | **Hitos a media y larga partida**: cada salto de población abre algo nuevo (pieza, monumento, cargo). | lo que le falta a Manor Lords y Kingdoms and Castles | media | medio: toca equilibrio e historia (sin anacronismos) |
| 10 | **Tu sitio se defiende en la batalla**: si fundaste en la loma, el enemigo ataca cuesta arriba contra tu muralla. | Rome: Total War, Manor Lords | grande | alto: une ciudad y batalla, hoy separadas a propósito; decide el usuario |

- Reserva (no entra en las diez): **dioses con favor** (Nova Roma). En la época hay base (prodigios y expiaciones),
  pero pide dictamen histórico y a algunos jugadores les cansa el castigo.
- Las palancas 1 a 6 caben dentro de P80 y P81 o justo después. La 10 es la que más diferencia, y la más cara.

## 4. Tres cosas que NO copiar
1. **Esperas de reloj real y compras para saltarlas** (Rise of Kingdoms, Forge of Empires). Es lo que más odian sus
   jugadores y rompe el offline. El tiempo de AQVILA son meses de juego que pasan cuando tú quieres.
2. **Anuncios y contenido troceado de pago** (TheoTown, clanes de Northgard, tribus de Polytopia). Dan las peores
   reseñas a juegos buenos. Además el arte de 0 A.D. obliga a compartir, no a vender por piezas.
3. **Juguete sin metas, o montaña de menús** (Townscaper por un lado; Anno 117 por el otro). Ni tan vacío que no sea
   un juego, ni tan cargado que no quepa en 390 px. Una línea arriba, una bandeja abajo.

## 5. Lo que no se pudo comprobar
- No se buscó: **Caesar III/Augustus, Citadelum, Foundation, Islanders**. Lo de Islanders es de memoria.
- Si **Pocket City 2** funciona sin conexión. Si **Dorfromantik** ya salió en móvil. Si **Kingdoms and Castles**
  tiene versión móvil (no apareció ninguna).
- Las quejas por **temporizadores** en Rise of Kingdoms y Forge of Empires: las reseñas halladas hablan de «pagar
  para ganar», no de esperas en concreto. Que usan esperas es conocimiento general, no fuente de esta búsqueda.
- Los **precios** son los de las fuentes (algunas antiguas) y pueden haber cambiado. Nova Roma: precio s. c.
- Varias críticas salen de **agregadores automáticos** (vaporlens, marlvel) o de reseñas sueltas de usuarios.
- No se abrió ninguna página entera ni se jugó a nada. No se miró el código de AQVILA: su estado sale solo de Q1k.
- Que las diez palancas quepan en los tamaños dichos es **estimación**, no medida.
