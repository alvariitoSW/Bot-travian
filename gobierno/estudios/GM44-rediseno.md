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
