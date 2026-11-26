# BT1 · Informe del motor de guerra (revisión independiente de Fable 5.2 · 26/11/2026)

Pedido literal del usuario: «quiero que fable 5.2 revise el motor y nos de un informe de lo mierda que es y como optimizarlo al máximo
para crear un Elden ring y rome 2 total war a nivel simulador de batallas y de gráficos en el móvil».
Solo lectura de la rama `bt1-lo-comun`. Medido aquí en Node (`test/combate-bloque.test.mjs`, `test/fisica-batalla.test.mjs`); **nada medido
en un móvil real**: las cifras de móvil de este informe son estimaciones (un móvil medio va 3–5 veces más lento que este servidor).

## 1. Veredicto en una pantalla

**En una frase**: no hay un motor de guerra; hay seis juegos de reglas y tres pantallas cosidos con capas que tienen prohibido cambiar el
resultado. Por eso los soldados «se sienten muñecos»: **lo son, literalmente**. La batalla la deciden rectángulos y números; los hombres
se pintan después para que lo parezca.

**Basura (se tira o se deja solo para resolver sin jugar)**
- **Los hombres son decorado.** `gobierno/maquetas/bloque/tropas.js:139-146`: cuando las reglas dicen «quedan N en pie», se tumba a los
  de delante hasta cuadrar la cuenta. Nadie muere porque le hayan dado: muere porque sobra.
- **La física es maquillaje.** `js/fisica-batalla.js:1-2` lo dice: «no decide nada del juego, solo DÓNDE SE DIBUJA cada hombre», con un
  muelle que lo devuelve a su sitio (`TOPE`, línea 44). Un empujón nunca gana terreno de verdad.
- **El hombre a hombre es un pegote.** `js/combate-tropas.js:33` (`FILAS = 2`): el motor de golpes solo ve las dos primeras filas del
  bloque trabado, y está ajustado «para que dure como antes» (línea 37). Es un buen motor atado de manos.
- **Las armas no van en la mano.** `bloque/formaciones/falange.js:107-124`: cada sarisa es una malla aparte colocada en un «carril» fijo
  junto al hombro («Solo dibujo»). Si el soldado no se pinta (tope de figuras, fuera de cámara) o se mueve distinto, la lanza vuela. Es
  exactamente lo que el usuario vio.
- **«Nada atraviesa» resuelto escondiendo el arma.** `bloque/soldados.js:144-165` (`gestoEspada`): si hay un compañero a menos de 0,85 m,
  se le quita la lanza de la mano y se envaina la espada. Parche que tapa, no arregla.
- **De cerca se pinta el soldado de lejos.** `bloque/escena.js:151` (`NIV = [1, 2, 3]`): la escena a pie nunca usa el nivel fino (14 000
  triángulos, 74 huesos con dedos, textura de 2048); el más cercano es el «_lejos» (≈4 000 triángulos, 36 huesos, textura de 1024). El
  modelo bueno se descarga y no se enseña en la vista del oficial. Buena parte del «parece de PS1» sale de esta línea.
- **«Bajar a pie» abre otra página dentro de un marco** (`js/ui-mando.js:584-638`, un `iframe`): segundo motor gráfico, texturas cargadas
  dos veces, otro mundo. Así es imposible «bajar sin cambiar de escena».
- **La batalla grande** (`js/simulador.js` + `js/ui-mando.js`): rectángulos con estandartes y barras; `js/battle.js` (1 490 líneas) sigue
  viva solo para dar «el carácter del rival»; `js/ui-batalla-rapida.js` es un tercer aspecto.
- **Animación sin mezcla**: `js/gfx/soldado.js:163` (`pose`) toca un solo movimiento cada vez; pasar de andar a golpear es un salto. Y el
  paso no va atado a la zancada (`tropas.js:103`: velocidad del clip a ojo), así que los pies patinan.

**Aprovechable (con cambios)**
- `js/combate.js`: golpes, paradas, arco del escudo, cansancio; el flanqueo sale solo. Barato: 0,06 ms por paso con 170 hombres.
- `js/fisica-batalla.js`: rejilla de 1 m, memoria reutilizada, ≈1,1 ms por paso con 600 hombres. Sirve si pasa a **mandar** en vez de corregir.
- `js/bloque.js`: dibujar el frente con el dedo y girar «como una puerta». Es la mejor idea de manejo del juego.
- Tablas de moral, cansancio y formaciones de `js/simulador.js`; proyectiles (`crearProyectiles`); las tablas de posturas de brazos (`generaTabla`).

**Bueno (se conserva tal cual)**
- `js/gfx/soldado.js`: huesos horneados en textura, una tropa = una llamada de dibujo, variedad por hombre (talla, cabeza, piel, tela,
  barro) sin coste, cuatro niveles, movimientos compartidos entre modelos. Es la técnica correcta para móvil.
- El arte: 18 soldados × 4 niveles, 23 MB, con relieve y brillo. **No hace falta ningún modelo nuevo**; hace falta enseñar el bueno.
- La luz y el campo comunes (`MUNDO` en `js/gfx/campo-mando.js`), la lógica que corre en Node y las pruebas deterministas.

## 2. Arquitectura: cuántos motores hay y por qué no convergen

**Reglas (6)**: (1) `battle.js` clásica; (2) `simulador.js` por manípulos-rectángulo; (3) `bloque.js` + `bloque-ia.js` (testudo y manípulo);
(4) `falange.js` + `falange-rivales.js`; (5) `mando-varios.js` + `tiro.js` (Ásculo); (6) `combate.js` hombre a hombre, colgado de (3).
Además, capas de dibujo con estado propio (`tropas.js`, `bloque/fisica.js`, `oficial.js`) y **tres pantallas**: mando en vivo, escena a pie
(en un marco, y en `gobierno/maquetas/bloque/`: 3 400 líneas de maqueta que se publican como juego) y batalla rápida 2D.
El bucle de la escena (`escena.js:469-472`) encadena hasta seis sistemas por fotograma, cada uno dueño de un trozo de la verdad.

**Por qué no convergen**: cada pieza nació como maqueta con la condición «no cambies la partida» («la física no cambia el final», «con el
motor gana lo mismo que antes»). Esa condición es la enfermedad: obliga a que la verdad siga en los rectángulos y todo lo demás sea
adorno. Las pruebas premian que nada cambie, no que la batalla sea de verdad.

**El núcleo único que hace falta** (una batalla, dos alturas):
- **Un solo estado**: todos los hombres de la batalla en tablas de números (posición, rumbo, velocidad, vida, cansancio, escudo, unidad,
  fila, columna, movimiento). Las unidades (bloques) solo dan a cada hombre **el hueco al que quiere ir** y la moral del grupo.
- **Un solo paso, 20 veces por segundo**: órdenes → el bloque se mueve (`bloque.js`) → cada hombre anda a su hueco → la física separa y
  empuja **de verdad** (el que cede, cede) → los que tienen enemigo al alcance luchan (`combate.js`, todas las filas que lleguen, no dos)
  → las bajas salen de los golpes → la moral sale de las bajas, el cansancio y el flanco (tablas del simulador).
- **Falange, testudo, manípulo, tiradores = datos**, no archivos de reglas: huecos, guardia del escudo, arma, orden propia.
- **Dos alturas = dos cámaras sobre la misma escena**, una sola página y un solo motor gráfico. Bajar a la fila es mover la cámara.
  Sitio: `js/batalla/` (núcleo sin pantalla, corre en Node) y `js/gfx/batalla/` (dibujo).
- **El simulador por números queda solo para «Resolver» y la batalla rápida**, con las mismas tablas.

## 3. Rendimiento: dónde se va el tiempo y cuántos hombres caben

**El cálculo no es el problema hoy; lo será al quitar los atajos.** Medido aquí: lucha 0,06 ms (170 hombres); física 1,1 ms (600) y <4 ms
(800 con todo el enganche). En un móvil medio: 3–15 ms de los 50 ms de cada paso. Con 2 000 por bando y física real para todos serían
30–60 ms: **no cabe en el hilo principal**.

**Cuellos reales, por orden**
1. **Píxeles** (`escena.js:106-107`, `ui-mando.js:169-170`): suavizado de bordes + resolución ×2 + material completo (relieve, brillo,
   máscara y dos ruidos por píxel en `soldado.js:36-39`). En una gráfica media de móvil esto manda. Arreglo: resolución que se adapta
   sola (de ×1 a ×1,5), material sencillo para los niveles lejanos, barro pasado del píxel al vértice.
2. **Vértices**: cada vértice lee 24 datos de la textura de huesos (4 huesos × 2 posturas × 3). Bien de cerca; de lejos sobra: un hueso
   y una postura para «_muylejos» y «_fondo» (4–8 veces menos).
3. **Triángulos**: el presupuesto de `gobierno/arte.json` (1 000 000 por batalla) es optimista; objetivo sano en móvil medio: 300–500 000.
   El «_fondo» son ≈400 triángulos por hombre: con 2 000 al fondo son 800 000. Hace falta el **cartón** (2 triángulos) a partir de 80–100 m.
4. **Basura de memoria por fotograma**: `pintaSoldados` crea listas por hombre (`var4`, `escena.js:156`), ordena todas las figuras, y
   `marcaApretados` (`soldados.js:133`) monta un mapa con claves de texto cada fotograma; `tropas.js` copia y busca en listas. Con 300
   hombres no se nota; con 2 000 da tirones. Todo a tablas de números reutilizadas.
5. **Memoria**: se cargan los cuatro niveles de cada modelo aunque uno no se use; con el marco, dos veces. Un móvil de 4 GB cierra la pestaña.

**Técnicas, en orden de rendimiento por esfuerzo**
- **Simulación por niveles**: bloque sin contacto = sus hombres van en su hueco, sin física ni lucha (coste casi cero); en contacto pero
  lejos de la cámara = lucha por columnas cada 4 pasos; en contacto y cerca = hombre a hombre completo. Solo «despiertan» los frentes.
- **Hilo aparte** (trabajador web) para el núcleo: el dibujo va a 30–60 y la batalla a 20 sin tirones; la pantalla interpola entre dos
  estados. Funciona sin conexión. La memoria compartida entre hilos pide cabeceras que la web del juego hoy no da: se pasa por copia
  (barato con tablas de números).
- **Dibujo escalonado**: cerca, animación a cada fotograma; a media distancia, cada 2; al fondo, cada 4 y sin mezcla.
- **Cartones** para el fondo (ya previsto en `arte.json`, «batallaGrande») horneados de los modelos que hay.

**Cuántos hombres por bando (estimación honrada, sin medir en móvil)**
| Situación | Hombres por bando | Condición |
|---|---|---|
| Hoy, con lucha real solo en 2 filas | 300–600 | lo que hay |
| Núcleo único, sin hilo aparte | 400–600 | 30 imágenes por segundo en móvil medio |
| Núcleo + niveles de simulación + hilo aparte + cartones | **800–1 200** | objetivo realista |
| Lo mismo en un móvil alto | 1 500–2 000 | la meta del Motor de guerra; hay que medirla |
| 10 000 | solo como cartones movidos por números | no es hombre a hombre |
De ellos, con detalle completo: 12–40 (nivel fino), 200–300 a media distancia; el resto, sencillo o cartón.

## 4. Gráficos y animación hacia «Rome 2 / Elden Ring en móvil», reusando el arte

**Se puede acercar (un 7–8 frente a sus imágenes, de cerca y en los momentos fuertes)**
- **Usar el nivel fino en la vista del oficial**: los 12–30 hombres más cercanos con el modelo de 14 000 triángulos y textura de 2048.
  Es cambiar `NIV` y los topes; cuesta ≈300 000 triángulos, asumible bajando el fondo a cartón. **Lo más barato y lo que más se ve.**
- **El arma en la mano**: la sarisa, el pilum y la espada vuelven a ser piezas del propio soldado pegadas al hueso de la mano (el
  mecanismo ya existe: piezas que se muestran u ocultan, `soldado.js:28-29`). La otra mano y el codo se ajustan **al hornear**
  (`generaTabla` ya lo hace para la sarisa): posturas nuevas en la textura, coste cero en el móvil. Ajuste en vivo solo para el oficial
  del jugador y su rival (2 hombres).
- **Mezcla de movimientos**: una segunda pareja de posturas por hombre y un peso (0,2 s de fundido). Solo en el nivel cercano.
- **Pies que no patinan**: la velocidad del andar atada a la zancada, que ya está medida (`soldado.js:125`, `zw`, `zr`) y no se usa bien.
- **Peso**: el golpe empuja de verdad (física que manda), parón de 2–3 fotogramas al impacto, sacudida corta de cámara, el herido
  recula con `encajar`. Es lo que hace que Elden Ring «pese», y es código, no arte.
- **Variedad sin modelos nuevos**: mezclar los 7 galos y variantes por pieza (casco, capa, escudo visibles o no), desfase de animación,
  tres «quieto» ya horneados, espejo de algunos movimientos.
- **Caídos y paisaje**: dos o tres posturas finales del mismo `morir`, sin transparencia; dos o tres campos hechos a mano con el arte que hay.
- **Ambiente**: polvo por partículas donde chocan los frentes, contraluz, bruma por distancia (ya hay), viñeta y color cálido hechos
  dentro del propio material (sin pasada extra), fondo pintado de colinas y templo, hierba solo cerca.

**«Mods» gráficos = interruptores de calidad** (pantalla de ajustes, con elección automática al medir los primeros segundos):
| Interruptor | Bajo | Medio | Alto |
|---|---|---|---|
| Resolución | ×1 | ×1,25 | ×1,5–2 |
| Soldados finos cerca | 0 | 12 | 30–40 |
| Relieve y brillo | no | cerca | cerca y media |
| Sombras | disco | disco | sombra real para los 30 de cerca |
| Mezcla de movimientos | no | cerca | cerca |
| Polvo y chispas | pocos | medios | muchos |
| Filtro final (resplandor del sol, profundidad) | no | no | sí |
| Fondo | cartón desde 60 m | desde 90 m | desde 120 m |

**No se puede acercar**: ver §6.

## 5. Plan por fases (ordenado por lo que el usuario VE)

| Fase | Qué se hace | Qué ve el usuario | Tamaño | Riesgo |
|---|---|---|---|---|
| 0 · Enseñar lo que ya hay | Nivel fino cerca del oficial; resolución adaptable; pies atados a la zancada; quitar la basura por fotograma | Soldados que dejan de parecer de PS1, sin patinar | S | Bajo |
| 1 · El arma en la mano | Armas como piezas del soldado en el hueso de la mano; posturas de dos manos horneadas (hoplita: lanza y aspis; luego sarisa); fuera los «carriles» y el esconder armas | Ninguna lanza vuela; las manos agarran | M | Medio |
| 2 · Mezcla y peso | Fundido entre movimientos, parón de impacto, recular, caídos variados, polvo en el choque | Deja de «sentirse un muñeco» | M | Medio |
| 3 · Núcleo único | `js/batalla/`: un estado de hombres, física que manda, lucha en todas las filas, formaciones como datos. Primero una pieza: **muro de hoplitas contra muro de hoplitas** | Los hombres caen porque les dan; el empuje gana terreno | L | **Alto** (hay que volver a equilibrar todo) |
| 4 · Una escena, dos alturas | Varios bloques por bando en una sola escena y página; cámara de arriba a la fila sin marco; una barra de órdenes | Mandas desde arriba y bajas sin cambiar de mundo | L | Alto |
| 5 · Escala | Niveles de simulación, hilo aparte, cartones, dibujo escalonado, interruptores de calidad | De cientos a ≈1 000 por bando, fluido | L | Medio |
| 6 · Resto de tropas | Tiradores jugables, caballería, elefantes, sarisa, legión, sobre el núcleo | Cada tropa nueva es datos, no otro juego | M cada una | Bajo |

- **Se tira**: `tropas.js` (figuras decorado), `bloque/fisica.js` como corrector, `falange.js`/`falange-rivales.js`/`mando-varios.js` como
  reglas aparte (sus ideas pasan a datos), el marco de «Bajar a pie», `battle.js`, la batalla grande como modo jugable, los carriles de sarisas.
- **Se reescribe**: el bucle de la escena, `bloque-ia.js` (IA rival sobre el núcleo nuevo), `ui-mando.js` (cámara alta de la misma escena).
- **Se conserva**: `soldado.js`, el arte, `combate.js`, la rejilla y los proyectiles de `fisica-batalla.js`, `bloque.js` (dibujar el
  frente), `campo-mando.js`, las tablas del simulador, el sonido.
- **Regla de método**: las fases 0–2 no tocan reglas y se enseñan pronto; la 3 cambia el resultado de las batallas a propósito: su
  prueba no puede ser «sale igual que antes», sino «se parece a la imagen y el usuario le da ≥ 8».

## 6. Lo que es imposible en un móvil (se dice y no se promete)

- **Rome 2 entero**: 10 000–20 000 hombres hombre a hombre, cada uno con su duelo animado. En móvil y en un navegador: no. Sí ≈1 000 por
  bando de verdad y miles «de cartón» al fondo.
- **Elden Ring**: un personaje de 100 000 triángulos, cientos de animaciones capturadas a actores, telas y pelo con física, sombras y luz
  de consola. No. Sí su **sensación de peso** en el duelo del oficial (2 hombres con todo el cuidado) y unos 30 alrededor.
- **Duelos emparejados** (dos hombres que encajan golpe y parada como coreografía) para todos: piden animaciones hechas por pares que no
  tenemos y no se pueden pedir. Solo golpes sueltos bien sincronizados; el duelo del oficial puede fingirlo.
- **Caras de película, sangre y barro que se acumulan con detalle, lluvia, hierba pisada**: solo trucos (casco que tapa, manchas en la
  textura, partículas).
- **Sombras reales para todo el ejército, y 60 imágenes por segundo con todo al máximo en un móvil medio**: no. Objetivo honesto: 30
  estables con calidad media. Aquí solo hay render por software: cada fase se mide en el móvil del usuario antes de darla por buena.
