# GM44 · Rediseño de los soldados (17/11/2026)

Pedido: «los 2 son una mierda (el de 0 A.D. de hoy y la maqueta de GM44a); que Fable lo haga bien». Después, viendo las
primeras capturas: «parecen muñecos de hojalata», «me da igual un diseño más de dibujo, pero que estén bien hechos» y
«los escudos atraviesan a los soldados». Maqueta: `gobierno/maquetas/soldado-rome2/`. No toca el juego.

## Por qué los dos anteriores parecían muñecos
1. **El cuerpo no era de persona.** El de 0 A.D. tiene 932 triángulos y la cara pintada; el de GM44a estaba hecho con
   fórmulas (tubos y bolas). Un cuerpo humano no sale de fórmulas: hay que partir de uno modelado por anatomistas.
2. **El movimiento era de marioneta.** Seis gestos hechos a mano o por fórmulas; sin peso.
3. **Todo era del mismo plástico.** Sin relieve, sin brillo distinto entre piel, tela, bronce y hierro, sin suciedad.
4. **Todos iguales y tiesos**, y sobre un suelo liso con luz plana.

## Qué se ha hecho (técnicas)
| Qué | Cómo | De dónde sale |
|---|---|---|
| Cuerpo, cara, manos con dedos | Malla humana de MakeHuman con su esqueleto y sus pesos; se quita lo que tapa la ropa y se aligera por programa (la cara conserva casi todo su detalle) | MakeHuman, **CC0** |
| Movimiento con peso | Movimientos grabados (andar, correr, guardia, lanzar, golpear, cubrirse, encajar, caer) pasados al esqueleto del cuerpo | Quaternius, Universal Animation Library 1 y 2, **CC0** |
| Agarres | Puños que cierran sobre el arma; el brazo del escudo y el del pilum se colocan solos; el escudo se queda vertical y por delante del cuerpo | Código propio |
| Equipo | Cota de malla y túnica ceñidas al cuerpo (se doblan con él), yelmo Montefortino con carrilleras y tres plumas, scutum oval curvo con espina, umbo y cantos, gladius hispaniensis con vaina, pilum pesado, greba izquierda, sandalias | Código propio |
| Superficies | Cuatro imágenes pintadas por programa: color, relieve (anillas, tejido, veta, martillado), brillo/metal/sombra de rincones y máscara de tintes | Código propio |
| Variedad | Cada hombre con su tono de piel, tinte de túnica y escudo, polvo y barro, talla y anchura; tres maneras de estar quieto, con la cabeza girada distinto | Sombreador y clips |
| Escena | Sol bajo y cálido con sombras, cielo con nubes, bruma, suelo con relieve, piedras y matas, sombra de contacto bajo cada hombre | Código propio |
| Muchos a la vez | Una llamada de dibujo por tipo y nivel. Tres niveles: fino (los 40 más cercanos), ligero y de fondo | Como `js/gfx/units.js` |

## Qué cabe en un navegador de móvil y qué no (con franqueza)
- **Cabe**: 40 hombres finos (13 561 triángulos cada uno, 545 000 en total; tope 560 000) y texturas de 2 048 px. La
  descarga de un tipo de soldado con sus tres niveles es de unos 4 MB.
- **No cabe tal cual**: la línea de 640 hombres de la maqueta pinta 1,45 millones de triángulos (2,4 con sombras); el
  tope de batalla es 1,1. En el juego, el fondo tendría que ir en cartones (GM33) y las sombras solo para los cercanos.
- **No medido**: las imágenes por segundo. Aquí solo hay render por programa. Hay que probarlo en tu móvil.
- **No llega a Rome II**: allí cada soldado tiene cara distinta, ropa que cuelga y se mueve, duelos hombre a hombre y
  decenas de movimientos encadenados. Aquí hay una sola cara por pueblo, la ropa va pegada al cuerpo y los movimientos
  son nueve. Las capturas de Rome II no se pudieron abrir desde aquí (la tienda pide edad): la comparación se hace
  con lo descrito en GM32, GM42 y R22.

## Dictamen histórico: APTO CON NOTAS
- Hastatus: cota de malla con hombreras (los más pudientes, Polibio 6.23; el resto llevaba pectoral), Montefortino con
  tres plumas negras, scutum oval con espina y umbo, pilum pesado, gladius al costado derecho, greba en la izquierda.
- Galo: torso desnudo, bracae de cuadros, torques, pelo encalado hacia atrás y bigote (Diodoro 5.28), escudo plano oval
  con espina, espada larga de La Tène y lanza.
- **Licencias de juego**: rojo de túnica y escudo, sandalias, tres plumas iguales para todos, motivo pintado del
  escudo galo, cuadros del pantalón. Citas de Polibio y Diodoro de memoria, sin cotejar.

## GM44b · Pulido y «el mismo detalle para todos» (17/11/2026, tarde)
Respuestas del usuario: «Sí, sigue puliendo este» y, a los cartones de lejos, «No, quiero el mismo detalle».

### Qué se ha pulido
| Defecto visto en las capturas de GM44r | Arreglo |
|---|---|
| Cara y piel a facetas | La piel aligerada hereda las normales del cuerpo entero de MakeHuman; la sombra de rincones ya no va a escalones de 1 cm |
| Yelmo de hojalata, con vetas de madera | Bronce más pardo y mate, sin rayas; más claro arriba, pátina en los rincones |
| Escudo de plástico con rayas blancas | Pintura gastada en los cantos, barro abajo, roces discretos, hierro más oscuro |
| Cota casi negra | Hierro más claro, anilla legible, menos manchas |
| Túnica como un tubo | Pliegues de verdad en el faldón (más malla) y pintados; arrugas en las mangas |
| Cuello y hombros hinchados | Menos músculo (0,36 en vez de 0,55) |
| El escudo tapaba al hombre de frente | En reposo va más al costado y girado |
| Todos con la misma cabeza | Cada hombre: cabeza algo más ancha, larga u honda; pelo de castaño a negro; barba de ninguna a cerrada; piel, túnica, escudo, talla y suciedad como antes |
| Suelo chillón, matas verde neón, luz dura | Tierra y hierba seca más calladas, sol menos fuerte, más luz de cielo |

### El mismo detalle para todos, sin cartones
La idea: **cada hombre se dibuja con los triángulos que su tamaño en pantalla puede enseñar**. Un hombre que mide
60 px en el móvil no puede enseñar 14 000 triángulos: la mayoría serían más pequeños que un punto de la pantalla.
- Cuatro versiones del mismo soldado (13 796, 4 139, 1 033 y 442 triángulos). Todas salen del mismo modelo y del mismo
  pintor: mismos colores, misma silueta, casco con pluma, escudo con su forma, pilum. Las ligeras heredan las normales
  del fino (se sombrean igual) y llevan el detalle pintado en la textura y en el relieve.
- La maqueta elige la versión por la altura en pantalla (200, 90 y 42 px), nunca más de 40 finos, y a los que quedan
  fuera de la pantalla les deja solo lo justo para su sombra.
- Una llamada de dibujo por tipo y nivel (de 8 a 13 en total con la escena).
- Captura `GM44b-10-niveles-ancho.jpg`: los cuatro, uno al lado del otro, al tamaño real y ampliados.

### Medidas reales (triángulos, con la escena)
| Hombres | Sin sombras | Con sombras |
|---|---|---|
| 40 | 220 000 | 420 000 |
| 160 | 270 000 | 475 000 |
| 640 | 500 000 | 720 000 a 755 000 |
| 1 280 | 800 000 | 1 060 000 |
GM44r pintaba 1,45 M y 2,4 M para 640. El tope de batalla es 1,1 M (`arte.json`); el de la batalla grande, 650 000
de cerca más 150 000 de lejos.

### Franqueza
- **Cabe**: 640 hombres sin cartones, con sombras, por debajo del tope. 1 280 caben sin sombras de los lejanos.
- **No cabe**: los 10 000 por bando de la «batalla grande». A 442 triángulos serían 4,4 M. Ahí, quien mida menos de
  unos 25 px (un hombre del tamaño de una letra) tendría que ser un cartón, como hace Rome II con las masas del fondo.
  Es la única excepción y la decide el usuario; no está construida aquí (ya hay maqueta de cartones en GM33).
- **No medido**: las imágenes por segundo. Aquí el render es por programa. Los triángulos son una señal, no la
  respuesta: hay que probar «La línea» en el móvil.
- **No hecho**: el relieve de las versiones ligeras no se ha horneado punto por punto desde el fino; heredan sus
  normales en los vértices y repiten su pintura. A su tamaño de uso no se nota (captura 10); de cerca sí se notaría.
- **Sigue sin ser Rome II**: una cara por pueblo, ropa pegada, nueve movimientos, sin duelos. La carrillera del yelmo
  es tosca y a la cara, muy de cerca, aún se le ven planos.
- El paso de un nivel a otro al acercar la cámara no se ha podido juzgar en movimiento (aquí solo hay capturas).
