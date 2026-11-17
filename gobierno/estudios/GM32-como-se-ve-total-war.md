# GM32 · Cómo se ve Total War y cómo acercarnos en el móvil (ingeniería reversa, 16/11/2026)

Pedido: «se ve como muñecos y no parece un juego como el Rome 2 Total War»; «haría animaciones realistas y le daría
mejor estética visual». Se toman **ideas**; nunca su código ni su arte. No repite R22 (escenario y tropas) ni GM4.

**Para probar en el móvil**: https://alvariitosw.github.io/Bot-travian/gobierno/maquetas/guerra-aspecto/
Botón arriba «Aspecto: nuevo / de antes» para comparar. Solo cambia el campo y el aire, **no los soldados** (ver abajo).

## Qué he podido ver de verdad, y qué no
- **Visto**: nuestras capturas (GM4, GM10) y las diez nuevas de la maqueta (`capturas-tarea/GM32-antes-*` y `GM32-despues-*`).
- **Solo resúmenes del buscador** (ninguna página se dejó abrir; la red de la sesión no llega a gpuopen.com ni
  totalwar.com): las fuentes de la lista final. Van marcadas [R].
- **De memoria**, sin comprobar aquí: lo marcado [M]. Esta sesión **no ha visto ni una imagen ni un vídeo de Total War**;
  los 150 fotogramas de Rome II los miró la sesión de R22 y me fío de su descripción.
- Si se quiere leer la serie técnica oficial («Anatomy of the Total War Engine»), hay que permitir gpuopen.com en la red.

## Por qué lo nuestro parece de muñecos (mirando nuestras capturas)
1. **Todos iguales y a la vez.** Misma figura, misma postura, mismo paso. Una tropa real es un gentío.
2. **Color de juguete.** Rojo y morado lisos y fuertes de pies a cabeza. De lejos, el bloque es una alfombra de color.
3. **Rejilla perfecta** y bloques rectangulares exactos.
4. **De lejos el hombre es un punto que centellea**: no se ven lanzas, ni escudos, ni brillo de metal.
5. **El movimiento no pesa**: la tropa se desliza entera; nadie tropieza, mira, se cubre o cae de verdad.
6. **El campo**: suelo a rayas repetidas, sin horizonte en la vista de mando, sin aire. (Esto lo arregla ya la maqueta.)
7. **Los carteles** tapan una cuarta parte de la pantalla y recuerdan que es un tablero.

## Cómo lo hace Total War (lo que se sabe) → qué idea nos llevamos
| Tema | Qué hace | Fuente | Idea para AQVILA |
|---|---|---|---|
| Miles a distintas distancias | Descarta lo que ocupa muy poco en pantalla y elige el detalle por el tamaño en pantalla, no por metros; varios escalones de detalle | [R] charla GDC de Three Kingdoms; Warhammer II | Ya tenemos dos (figura y cartón). Falta un **tercero para lo muy lejano**: pintar la tropa como masa (lanzas y cascos sobre una mancha), no hombre a hombre |
| Variedad en la unidad | Cada soldado se monta con piezas al azar (casco, escudo, cara) y texturas al azar por pieza | [R] wiki oficial de modding | Dos o tres variantes de escudo y túnica por tropa con el arte de 0 A.D. que ya hay; tono de piel, tela y bronce distintos por hombre |
| Animación | Captura de movimiento; cada hombre va a su ritmo; en el choque se emparejan y luchan de dos en dos; los muertos caen y se quedan | [M] | Desfase por hombre, gestos de reposo, paso atado a la velocidad (sin patinar), primera fila que lucha por parejas, caída animada |
| Terreno | Hasta 8 capas de textura por zona, mezcladas; material físico desde Rome II | [R] serie de gpuopen | Mezclar la textura a varias escalas y manchas grandes de tono (hecho en la maqueta) |
| Detalle junto a la cámara | Hierba, matas y piedras solo cerca; campo lejano pintado fuera de la zona de juego | [M] | Matas y piedras en instancias a menos de 40 m; colinas de fondo |
| Luz y sombras | Sombras del sol en 2 a 4 escalones; en Troy, sombras ya hechas para lo lejano | [R] gpuopen; blog de Troy | Lo nuestro: sombra por hombre cerca (GM4) y mancha bajo el bloque lejos (maqueta). Sin sombras de verdad: en móvil no caben |
| Aire | Lo lejano pierde color y contraste; polvo que queda colgado tras la marcha | [M] | Niebla con color de horizonte (hecho en la maqueta); polvo que dura |
| Cámara | Baja y tendida: se ve horizonte; al alejar, sube y mira más de arriba | [R] comentario de modder; R22 | Hecho en la maqueta en vertical; en horizontal falta ajustar |
| Estandartes y carteles | El cartel de la unidad es su estandarte: pequeño, flota encima, se apaga al acercar | [M]; R22 | Cartel más pequeño unido al estandarte; el número, solo al tocar |

## Lo que enseña la maqueta (y lo que no)
Seis mejoras de campo que se apagan una a una (`?sin=suelo,aire,filas,color,sombra,camara`), sin tocar reglas:
suelo sin rayas, aire y horizonte, filas desiguales, color menos chillón, mancha de sombra bajo el bloque, cámara más tendida.
- **Mejora clara**: el suelo ya no tiene rayas, hay cielo y colinas, los bloques pesan en el suelo.
- **Lección principal**: con el campo arreglado, **los soldados siguen pareciendo muñecos**. El campo no era el problema
  de fondo: lo son la figura, el color y el movimiento. Coincide con lo que dijo el usuario.
- **Fallos de la maqueta** (sin vuelta de arreglos: el gasto se pasó): la tropa lejana queda rosada y pálida, el cielo
  lechoso, en horizontal el horizonte queda pegado arriba, y de cerca la figura no lleva aún el color nuevo.
- Medidas: mismos triángulos que GM4 (112 000 de lejos, 593 000 de cerca; dentro de `arte.json`). Los milisegundos aquí
  son de pintar por software y bailan mucho; **hay que mirar las imágenes por segundo en el móvil**.

## Lista ordenada de cambios
| # | Cambio | Qué se vería distinto | Coste | Riesgo |
|---|---|---|---|---|
| 1 | **La tropa como gentío** | Cada hombre con su tono de piel, tela y bronce; dos o tres escudos y túnicas por tropa; el bando se lee en escudo, penacho y estandarte, no en el hombre entero; colores de tierra, lino y bronce; lanzas y pila que asoman sobre la masa; lo mismo de cerca y de lejos | 1,0 M | Que el bando se lea peor a 390 px: se compensa con el estandarte. Sin arte descargado |
| 2 | **Movimiento vivo** | Nadie va al mismo paso; en reposo se mueven, miran, apoyan el escudo; al echar a andar arranca la primera fila y la ola corre hacia atrás; el pie no patina; ceder es andar hacia atrás dando la cara; el giro lo hacen corriendo los de fuera | 1,2 M | Depende de qué animaciones de 0 A.D. estén ya convertidas; convertir más añade algo de peso (se pregunta si pasa de 1 MB). Fluidez |
| 3 | **Campo y aire, corregidos** | Lo de la maqueta sin sus fallos: tropa lejana con su color, cielo limpio, horizonte también en horizontal, tierra pisada visible | 0,5 M | Bajo. Se solapa con GM29 y GM30: se hacen juntas |
| 4 | Primera fila que lucha y caídos de verdad | Parejas que golpean, paran y retroceden; el que cae, cae animado y se queda | 1,5 M | Alto: es lo más caro de pintar de cerca |
| 5 | Lo muy lejano como masa | Sin centelleo: mancha con lanzas y cascos en vez de puntos | 0,8 M | Salto visible al acercar |
| 6 | Carteles discretos | Cartel pequeño pegado al estandarte; números al tocar; marca de selección en el suelo | 0,6 M | Toca el manejo de GM10 y GM31: decide el usuario |
| 7 | Detalle junto a la cámara | Matas, piedras y arboledas (no árboles sueltos) | 0,5 M | Fluidez de cerca, ya justa |
| 8 | Polvo y proyectiles | Polvo que queda colgado; estela de pila y flechas | 0,4 M | Bajo |
| 9 | Tono por región y hora | África ocre, Italia verde, luz de tarde; viñeta suave | 0,3 M | Bajo; pasa por Arte |
| 10 | Soldados más finos (arte nuevo) | Figuras con más detalle | ver GM4b | Sube la descarga: decide el usuario |

## Los tres primeros recomendados
**1, 2 y 3, en ese orden**, en `gobierno/maquetas/guerra-aspecto/` (una detrás de otra: tocan los mismos archivos).
El 1 y el 2 atacan lo que el usuario nombró (muñecos, animaciones). El 3 es barato y ya está medio hecho.
Ninguno quita cosas, toca reglas, sube la descarga ni pasa de 1,5 M.

**Franqueza**: con el arte de 0 A.D. (figuras de pocos polígonos, pensadas para verse desde arriba) y un móvil, no se
llega a Rome II de cerca. Sí se puede llegar a que **de lejos y a media distancia** parezca un ejército y no un tablero.
Si tras 1 y 2 de cerca sigue sin convencer, el paso que queda es arte nuevo (GM4b), que sube la descarga.

## Fuentes (todas [R]: solo el resumen del buscador)
- GDC, «Instancing and Order Independent Transparency in Total War: Three Kingdoms»: gdcvault.com/play/1026177
- gpuopen.com, «Anatomy of the Total War Engine» (partes 1 a 5): capas de terreno, sombras en escalones.
- gamedeveloper.com, «Designing Total War: Warhammer II to handle tons of units».
- wiki.totalwar.com, «Unit Part folder structure documentation»: piezas y texturas al azar.
- totalwar.com, «Ten Tech Improvements in A Total War Saga: TROY»: sombras ya hechas para lo lejano.
- three.js: discourse.threejs.org, «Octahedral Impostors for three.js» (t/80318) y multitudes con instancias (t/89928).
