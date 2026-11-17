# K7 · Concurso: ciudades, rutas, diplomacia y tropas (16/11/2026)
Cinco maquetas (Haiku, esfuerzo alto) sobre el mismo guion; tres jueces ciegos (Sonnet). Probar en el móvil:
https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/concurso9/ (carpetas `A`…`E`). Capturas: `capturas-tarea/K7-{A..E}-1.png`.

## Puntuación (3 jueces, sobre 35; clave en `maquetas/concurso9/clave-ciega.md`)
| | Idea | J1 | J2 | J3 | Total /105 |
|---|---|---|---|---|---|
| **D** | **Puerta de la ciudad** (Puerto · Camino · Foro, con miga «Roma › Camino») | 33 | 34 | 33 | **100** |
| B | Pestañas de abajo (Ciudad · Mapa · Rutas · Tratados) | 32 | 30 | 33 | 95 |
| E | Esquema de metro (rutas gruesas según renta) | 31 | 32 | 30 | 93 |
| C | Mapa completo + hoja inferior arrastrable | 27 | 28 | 26 | 81 |
| A | Mapa único con zoom | 27 | 20 | 24 | 71 |
Medidas: botones ≥44 px en todas. Texto <11 px: solo A (etiquetas del mapa a 8,7 px). Colores fuera de paleta: tintes rosados/azulados en B–E (pequeño). Sin errores de consola (C no la ejecutó su autor, pero abre bien).

## Ganadora: D «Puerta de la ciudad»
Los tres jueces la ponen primera (B empata en uno). Resuelve lo más difícil, **pasar de ciudad a fuera sin perderse**: tres puertas (Puerto = rutas de mar, Camino = rutas de tierra y marchas, Foro = diplomacia) y una miga siempre visible. Cada ruta enseña barras de flujo sale/entra, «+18 den./mes», **Proteger** y **Cortar**; el Camino compara fuerzas al **Interceptar** («7 contra 5, favorable»); el Foro vota tratados en el Senado.
Flojo: mapa pequeño con la leyenda encima y nombres recortados; el Foro obliga a desplazarse; la fórmula de renta es densa.

## Qué copiar de las demás
- **B**: la tarjeta de ruta con renta desglosada y «Neto al mes»; «Estás en: …» fijo arriba (pero sin botón apagado).
- **E**: grosor de línea según renta y marcas A/G (aliada/guerra) en el mapa; la hoja de ruta que dice la consecuencia de cada protección (escolta: sin asaltos · patrulla: la mitad · cortar: sin renta).
- **C**: botón rojo único «Entrar en la ciudad» / «Salir al mapa».
- **A**: nada fuerte; evitar etiquetas <11 px y paneles que tapan la barra.
Ninguna enseñó bien saquear; D e interceptar sí.

## Propuesta de tareas pequeñas (a aprobar por el usuario; coste aproximado)
- **K7a** Mapa con grosor de ruta según renta y marcas de aliada/guerra (solo mapa 3D/2D de campaña). ≈0,4 M.
- **K7b** Tarjeta de ruta en el juego: flujo sale/entra, renta desglosada, Proteger/Cortar (datos `D.RUTA_*`; lógica de «cortar/proteger» en `game.js`). ≈0,8 M.
- **K7c** Miga «Roma › Camino» y botón único de volver, ciudad⇄mapa. ≈0,3 M.
- **K7d** Interceptar con comparación de fuerzas antes de confirmar. ≈0,5 M.
- **K7e** Tratados como ley del Senado desde el Foro (enlaza con EV1/EV6, sin rehacerlo). ≈0,6 M.
- **K7f** Saquear marchas/rutas (hoy sin buena maqueta): pequeña maqueta propia antes. ≈0,3 M.

## Cuentas y honestidad
Tope 2,5 M; `gasto.mjs` midió **7,11 M** (Haiku 5,82 · Sonnet 1,29): me pasé de largo, sobre todo porque cada Haiku gastó 0,9–1,5 M (mucha prueba en navegador). No se lanzó nada más; esto es lo hecho. Lección: para otro concurso, tope de 20 pasos por Haiku y pedir una sola captura final.
