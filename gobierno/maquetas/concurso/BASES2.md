# Bases del concurso K2 (segunda ronda) — 11/11/2026

## Qué dijo el usuario (decisión, literal)
«El K arena, el trazo de órdenes dibujadas y el general rueda de órdenes me gustan. Hay que hacer un nuevo concurso con 5 modelos también totalmente diferentes y que compitan por el mejor proyecto **artístico, escalable e intuitivo**. Las del gobierno no me gustan ninguna, deben repetirse de 0 todas con mejores instrucciones.»

## Lo que aprendimos de la primera ronda (léelo, no lo repitas)
- Gustaron en Guerra: **Arena** (mesa cenital con fichas, casi sin interfaz), **Trazo** (dibujar la línea y las flechas con el dedo) y **General** (cámara baja, rueda de órdenes con la recomendada en dorado). Pueden inspirarte; NO se trata de copiarlas: tu concepto manda.
- En Gobierno no gustó ninguna: eran trucos sueltos (cartas, rueda, pergamino) que **reducían el gobierno a menús bonitos**, con dibujos planos y sin la ciudad real a la vista. Evita: decidir solo con sí/no, retratos de dibujo infantil, paneles que tapan la ciudad, pantallas que no se parecen al juego.

## Los tres criterios (el jurado puntuará de 0 a 5 cada uno)
1. **ARTÍSTICO**: una dirección de arte reconocible y coherente de Roma republicana (280–146 a.C.), no «app genérica». Usa lo que el juego YA tiene: renders y fondos reales (gobierno/capturas-tarea/*.jpg, gobierno/maquetas/fondo-ciudad.jpg y fondo-mapa.jpg, gobierno/captura-batalla.mjs, gobierno/maquetas/_fondos.mjs), la letra Cinzel (assets/fuentes) y la guía gobierno/estudios/E1-guia-de-arte.md; o ilustración propia en SVG/CSS de alto nivel (mosaico, cerámica, grabado, bronce, mármol…). Cuida luz, textura, tipografía, iconos de línea. Se puede romper la paleta razonándolo.
2. **ESCALABLE**: tiene que seguir funcionando cuando el juego crezca: 18 ciudades, 30+ edificios, 5 recursos, 20 regimientos, 4 facciones, docenas de avisos a la vez. Enseña en la maqueta CÓMO escala (p. ej. una pantalla con 12 ciudades o 30 regimientos, o una nota con la regla). Piezas reutilizables y consistentes, no una pantalla hecha a medida de tres datos.
3. **INTUITIVO**: «prueba de los 5 segundos» (un jugador nuevo entiende qué pasa y qué tocar sin leer); «prueba del pulgar» (todo lo frecuente al alcance de una mano, sin botones pequeños, ≥44 px); pocos botones a la vista; texto mínimo 13 px; botones que dicen lo que hacen.

## Reglas comunes
- Español en todo; frases cortas. Es un juego real: usa recursos reales (madera, piedra, hierro, grano, oro/denarios), facciones (Roma, Cartago, galos, griegos, íberos) y datos plausibles; mira js/data.js (solo leer) para nombres reales de edificios y unidades.
- Ideas de otros juegos sí; **código y arte de juegos comerciales, nunca**. Arte solo de 0 A.D. (CC BY-SA, ya en el repositorio) o hecho a mano en SVG/CSS.
- NO toques el juego (js/, css/, index.html, sw.js). Escribes SOLO tus tres archivos.
- HTML autocontenido, interactivo con toques simples, sin dependencias externas (Cinzel se puede referenciar desde assets/fuentes con ruta relativa).
- Gasto: máximo ~0,35 M de tokens por concursante. Un solo HTML bien hecho (600–1000 líneas), máximo 3 rondas de captura y corrección. Mira SIEMPRE tus capturas (Read) y arregla solapes, textos cortados y escala antes de entregar.

## Entrega (K2-ID = tu identificador)
1. `gobierno/maquetas/concurso2/K2-ID.html`
2. Capturas JPG con Playwright (Chromium instalado; NODE_PATH=/opt/node-tools/node_modules; deviceScaleFactor 2) en `gobierno/capturas-tarea/K2-ID-1.jpg`, `-2.jpg`, … una por pantalla.
3. `gobierno/maquetas/concurso2/K2-ID-nota.md`: siete líneas numeradas, sin nombre de autor ni de modelo: 1 la idea; 2 cómo se juega con el pulgar; 3 botones a la vista (cuántos); 4 dirección de arte (qué estilo y de dónde sale); 5 cómo escala (a 18 ciudades / 30 regimientos); 6 qué parte de js/ui.js o js/gfx/ habría que cambiar; 7 coste estimado en tareas.
Responde al terminar con 3 líneas.

## Concurso GOBIERNO 2 (vertical 390×844) — repetido desde cero
Política y senado, intrigas, bienestar y felicidad, recursos y obras, catástrofes (incendio, plaga, inundación, hambruna), revueltas. Mínimo CINCO pantallas: (1) vista principal con la ciudad; (2) construir/mejorar con varias ciudades y recursos; (3) una decisión política o una intriga; (4) una crisis en curso y cómo se atiende; (5) un lugar donde se vea la escala (lista o mapa de varias ciudades, o la cola de obras con muchos elementos). La ciudad real del juego (3D con edificios de 0 A.D.) es el corazón: no la escondas.

## Concurso GUERRA 2 (horizontal 844×390)
Batallas de estrategia con tropas romanas tipo Total War Rome 2: campo abierto, asedio, emboscada, defensa de una ciudad; formaciones, órdenes, moral, refuerzos. Mínimo CINCO pantallas: (1) despliegue; (2) órdenes a un regimiento en pleno choque; (3) flanqueo o carga; (4) asedio o emboscada (otro tipo de batalla); (5) resultado o retirada. Debe verse cómo se manejan 20+ regimientos sin ensuciar la pantalla.

## Conceptos (uno por concursante)
### Gobierno 2
- **gob-A-ciudad**: CIUDAD ILUSTRADA A LA IKARIAM/ANNO, pulida. Vista isométrica de la ciudad real; cada barrio se toca y abre una ficha inferior; avisos como iconos de línea sobre los edificios; tres pestañas máximo. La apuesta es la limpieza, la jerarquía visual y que escale.
- **gob-B-lentes**: LENTES. Una sola ciudad/mapa y cuatro «lentes» (Pueblo, Economía, Política, Peligro) que la recolorean como mapa de calor; la crisis se ve en la lente, se pulsa y se resuelve ahí. Gobernar es leer el mapa.
- **gob-C-domus**: LA DOMUS DEL MAGISTRADO. Navegación espacial por estancias de una casa romana (atrio con clientes, tablinum con cartas y votos, peristilo, almacén, torre de vigía hacia la ciudad); cada estancia es un tipo de asunto; se ve la ciudad por la ventana.
- **gob-D-foro**: EL FORO VIVO. La gente es el dato: grupos de patricios, plebeyos, equites, esclavos y soldados en la plaza con ánimo visible; hablas desde la tribuna; las intrigas son corrillos; las revueltas, multitud que crece. Política = oratoria y gestos.
- **gob-E-tabularium**: EL TABULARIUM, panel de gestión profundo pero táctil: colas, listas, comparativas, acciones por deslizamiento, filtros; estilo libro de cuentas romano. Es la apuesta por la escala máxima (jugadores veteranos) sin perder el pulgar.

### Guerra 2
- **guerra-A-miniaturas**: MESA DE ARENA DE MINIATURAS. Evolución de «Arena»: vista cenital inclinada con efecto maqueta (tilt-shift), unidades como miniaturas reales (renders de 0 A.D. en assets/ o fichas muy cuidadas), terreno modelado, órdenes con trazos y fichas. El arte es el protagonista.
- **guerra-B-legado**: CÁMARA DE LEGADO. Evolución de «General» + «Trazo»: cámara baja 3D detrás de la línea; arrastras el dedo sobre el suelo para dibujar la orden (avance, flanqueo, retirada) y la rueda radial solo aparece para excepciones; minimapa; grupos de regimientos con un toque.
- **guerra-C-mosaico**: BATALLA COMO MOSAICO / CERÁMICA. Dirección de arte radical: toda la interfaz y el campo en estilo mosaico romano o cerámica de figuras rojas sobre negro; las órdenes son grabados que se «pintan»; moral como cenefa. Debe seguir siendo legible a 844×390.
- **guerra-D-estandartes**: ESTANDARTES. Cada regimiento es un estandarte (vexillum, águila, signum) clavado en el campo; se ordena moviendo, girando o alzando el estandarte con el dedo; cuernos y trompetas como señales (iconos de sonido en la pantalla); HUD casi inexistente.
- **guerra-E-fantasmas**: PLAN Y FANTASMAS. Pausa táctica: planeas con el dedo y ves «fantasmas» translúcidos de dónde estará cada regimiento dentro de 10/20/30 s; el rival también deja sombras de lo que podría hacer; luego se ejecuta. El tiempo es un deslizador mínimo, sin partitura.
