# K2 · Concurso de interfaz, segunda ronda (11/11/2026)
Diez maquetas nuevas (5 Gobierno, 5 Guerra), cinco o más pantallas cada una, con tres criterios del usuario: **artístico, escalable, intuitivo** (más profundidad de juego y facilidad de construir). Jurado ciego de tres agentes que vieron al menos cuatro capturas de cada una. Puntos sobre 25 por jurado; suma sobre 75. **El ganador lo decide el usuario.** Bases: `maquetas/concurso/BASES2.md`; maquetas en `maquetas/concurso2/`.

## Concurso Gobierno 2 (390×844)
| Puesto | Maqueta | J1 | J2 | J3 | Suma |
|---|---|---|---|---|---|
| 1 | **Ciudad** (ciudad 3D con medallas y una ficha única) | 20 | 21 | 20 | **61** |
| 2 | **Tabularium** (libro de cuentas con filas deslizables) | 19 | 20 | 21 | **60** |
| 3 | Lentes (mapa de calor sobre la ciudad) | 19 | 19 | 18 | 56 |
| 4 | Domus (estancias de una casa romana) | 17 | 18 | 17 | 52 |
| 5 | Foro (multitudes por clase social) | 14 | 17 | 13 | 44 |

- **Ciudad**: la ciudad real del juego llena la pantalla; cada edificio lleva una medalla de bronce con su nivel y avisos; tocar abre una sola ficha inferior con la acción aconsejada; tres pestañas (Ciudad, Gobierno, Imperio). Lo más claro en 5 segundos y escalable (Imperio con 12+ ciudades, 14 obras agrupadas). Defecto: la política y las crisis tienen menos peso.
- **Tabularium**: tablas con filas deslizables, costes visibles, 18 ciudades y cola de 24 obras; lo más fácil de construir y lo que más gobierno enseña (votos, remedios con efecto). Defecto: parece hoja de cálculo y la ciudad queda en una ventana pequeña.
- **Mi lectura**: coincido en la cabeza. Recomiendo **Ciudad como pantalla principal** y el **Tabularium como pestaña Imperio/Obras** (listas y colas), con la **vista previa del efecto sobre el mapa** de Lentes antes de confirmar una decisión. Foro es original pero caro y choca con el 3D.

## Concurso Guerra 2 (844×390)
| Puesto | Maqueta | J1 | J2 | J3 | Suma |
|---|---|---|---|---|---|
| 1 | **Legado** (cámara baja, trazo y botón de orden recomendada) | 21 | 18 | 21 | **60** |
| 2 | **Fantasmas** (pausa con sombras a 10/20/30 s) | 16 | 20 | 19 | **55** |
| 3 | Estandartes (la moral se lee en la tela) | 17 | 17 | 19 | 53 |
| 4 | Miniaturas (mesa de arena con peanas) | 19 | 15 | 16 | 50 |
| 5 | Mosaico (todo en teselas) | 15 | 16 | 15 | 46 |

- **Legado**: reúne lo que te gustó de General y Trazo. Arrastras desde un regimiento sobre el suelo y el trazo se clasifica solo (cargar, flanquear, retirar, batir la puerta); un botón dorado grande ejecuta la orden recomendada; la rueda solo sale para excepciones; minimapa, grupos con un toque y lista de batalla para 24+ regimientos. Defecto: hay bastante HUD en el borde inferior y los soldados son siluetas vectoriales.
- **Fantasmas**: la mayor profundidad táctica (se ve dónde estará cada regimiento a 10, 20 y 30 s y qué podría hacer el rival), pero la más cargada y la más cara.
- **Miniaturas** (la evolución de Arena) ganó en arte pero perdió en escala y legibilidad: el desenfoque y la inclinación estorban con 49 regimientos.
- **Mi lectura**: coincido. Recomiendo **Legado como base**, con tres robos: el **deslizador de fantasmas** de Fantasmas como opción en pausa, las **peanas y la cenefa de moral** de Miniaturas y los **corchetes dorados de ala** de Estandartes.

## Ideas a robar (de los jurados y mías)
Gobierno: medallas y ficha única (Ciudad); orden por urgencia y filtros (Tabularium); vista previa del efecto en el mapa (Lentes); chips verde/rojo de efecto por clase (Foro). Guerra: lo anterior más la moral en la tela de Estandartes.

## Salvedades
Todas son HTML con dibujos propios, no el 3D real; ninguna se probó en un móvil real. Varias usan el render real del juego como fondo y llevan etiquetas viejas debajo. Los jurados puntuaron por capturas, no jugando.

## Gasto
`gasto.mjs` suma 12,1 M entre las dos rondas, de modo que esta ronda costó **unos 8 M** frente a los 4,3 M presupuestados. Lo que más pesó fue que cada concursante hizo 18–48 pasos con capturas y retoques, y que `gasto.mjs` cuenta lecturas de caché. Para otra ronda conviene tope más duro (por ejemplo 3 pantallas y 2 rondas de captura) o menos concursantes.
