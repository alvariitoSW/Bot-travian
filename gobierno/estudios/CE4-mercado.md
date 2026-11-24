# CE4 · El mercado de los recursos (diseño)

Respuestas del usuario (24/11): precios por **ciudad, estación y sucesos**; comerciar con **rutas que van solas y viajes a
mano**; extras: **aduanas (portoria), contratos del Senado, almacenes y especular, mercaderes rivales**; pantalla:
**rejilla de productos con flechas**.

## 1. Reglas en una frase
Cada ciudad tiene un precio por producto. Sube si allí falta y baja si sobra. Comprar barato aquí y vender caro allí da
dinero, pero el viaje tarda, cuesta, paga aduana y puede perderse. Rivales cartagineses, griegos e itálicos hacen lo mismo.

## 2. Productos (`MER.PRODUCTOS`; ids = los del juego y los de AG1)
| id | precio base (denarios/carga) | peso | barato en (origen) | caro en (demanda) | nota |
|---|---|---|---|---|---|
| grano | 2 | 1 | syracusae, agrigentum, capua, carales, hadrumetum, carthago | roma, corinthus, pella, neapolis | sube en primavera, baja tras la cosecha (verano) |
| aceite | 5 | 1 | tarentum, capua, corinthus, hadrumetum | roma, mediolanum, massalia, gades | baja en invierno (cosecha de la aceituna) |
| vino | 6 | 1 | messana, agrigentum, massalia, emporion, tarraco, capua | mediolanum, roma, carthago | baja en otoño (vendimia). Mismo id que el bien regional |
| verdura | 2 | 1 | cualquier ciudad con huerto | ciudades grandes (w≥4) | se pierde un 30 % al mes y 10 % por mes de viaje |
| lana | 4 | 1 | tarentum, mediolanum, ambracia, capua | roma, carthago, corinthus | baja en primavera (esquileo) |
| materiales | 3 | 2 | perusia, clusium, rusellae, syracusae | roma, carthago, ciudades en obras | |
| hierro | 8 | 2 | `D.VETAS_HIERRO` | ciudades de tipo militar | |
| sal, caballos, pieles, plata, marmol, purpura, maderanaval | `D.BIENES[id].precio` | 1 (caballos 3, marmol 3) | ciudades con ese `esp` | Roma y emporios | |
| denarios | 1 | — | — | — | es la moneda: no se compra ni se vende |

Peso: cuántos huecos ocupa una carga en un barco o caravana.

## 3. Precio
`precio(c, p) = base × origen × estación × oferta × suceso × contrato × (1 + ruido)`
- **origen**: 0,7 si la ciudad lo produce; 1,4 si lo demanda; 1 si nada.
- **estación**: tabla por producto (grano: primavera 1,25, verano 0,8, otoño 0,9, invierno 1,1…). Mes = `floor(s.t) % 12`.
- **oferta**: índice `S` en [-1, 1] por ciudad y producto. Vender sube `S` (precio baja), comprar lo baja (precio sube):
  cada carga mueve `1 / (30 × w)`. Cada mes `S` vuelve un 20 % hacia 0. Precio × (1 − 0,4 × S). Esto pone tope al arbitraje.
- **sucesos** (duran meses): guerra de la facción dueña (grano y hierro × 1,3), bloqueo de un puerto (todo × 1,5 y
  rutas de mar cortadas), mala cosecha en una región (grano × 1,6), buena cosecha (grano × 0,75). Los da el juego por
  `ayuda` o salen al azar con semilla (`s.mercado.semilla`, sin `Math.random`: las pruebas deben repetirse).
- **ruido** ±5 % por mes, con semilla.
- **flecha**: compara con el precio del mes anterior (`s.mercado.prev`): ↑ si sube más de un 3 %, ↓ si baja más de un 3 %.

## 4. Comerciar
- **Comprar y vender aquí** (almacenes y especular): `MER.comprar` y `MER.vender` en una ciudad tuya con mercado.
  Precio medio con el empuje de `S`. Lo guardado vive en el almacén del juego (`s.res` y `s.bienes`).
  **Acaparar grano** (más de 3 meses de consumo mientras el grano de tu ciudad pasa de 1,5 × base) → aviso de los ediles
  y −5 de felicidad de la plebe (Livio 38.35: multas a los tratantes de grano en 189 a.C.).
- **Viaje a mano**: compras N cargas en A, salen hacia B, llegan en los meses de `flete` y se venden al precio de B
  ese mes. Riesgo por mes de mar: 4 % (piratas) y 8 % si hay guerra con la facción del destino. Licencia de juego.
- **Ruta que va sola**: A → B con un producto y N cargas al mes (tope 10 × nivel del mercado de A; por mar, del
  puerto). Cada mes: compra en A, vende en B, paga flete y aduanas. Sustituye a la renta fija de `G.rutaRenta`.
  Las rutas viejas `{a,b,f}` se migran eligiendo el producto que más gana.
- **Flete**: por tierra 0,03 denarios por carga, peso y legua de mapa; por mar 0,01 (el mar era mucho más barato;
  licencia de juego en la cifra). Tiempo: `ayuda.travel(a, b)` del juego; sin juego, distancia lon/lat.

## 5. Aduanas (*portoria*)
Cada ciudad tuya con puerto o mercado tiene tasa 0–5 % (empieza en 2,5 %, la *quadragesima*). Cobra a todo lo que entra
o sale: rutas ajenas y mercaderes rivales pagan; tus rutas internas no. Subirla da caja pero aparta a los rivales
(menos comercio, el precio local sube un 1 % por punto).

## 6. Mercaderes rivales
Tres casas: **púnicos** (Cartago, Gades, Panormus…), **griegos** (Massalia, Syracusae, Neapolis, Emporion) e
**itálicos** (Capua, Neapolis, Tarentum). Cada mes cada casa hace su mejor arbitraje entre sus ciudades y las abiertas a
ella: compra donde está barato y vende donde está caro (mueve `S`), y paga portoria si pasa por tus puertos. Si hace el
mismo producto y destino que una ruta tuya, tu margen baja. Están en guerra con quien esté su facción.

## 7. Contratos del Senado (`MER.CONTRATOS`)
Se proponen, el Senado vota (el juego decide con `ayuda.votar(favor, contra)`; sin juego: sale si hay más bandos a
favor) y duran 8 estaciones.
| id | qué hace | a favor | en contra |
|---|---|---|---|
| annona | grano a la plebe a la mitad: cuesta denarios cada mes, +8 felicidad de la plebe | pue | mer |
| monopolio_sal | sal solo tuya: su precio × 1,3 en tus ciudades y renta | mer | pue |
| tratado | con una facción en paz: portoria 0 entre los dos y su casa rival no compite con tus rutas | mer, ita | mil |
| flota | barcos del Estado: el riesgo del mar baja a la mitad; cuesta denarios cada mes | mil, mer | ter |

## 8. Lo que el mercado devuelve al juego (no escribe fuera de `s.mercado`)
Funciones puras. Las que mueven dinero o mercancía devuelven `delta` (`{denarios:-120, vino:+20}`); el juego lo
aplica. `MER.mes(s, ayuda)` devuelve `{ delta, avisos:[{texto, tono}], efectos:{felicidad:{pue}, …} }`.
`MER.consejo(s)` dice al jugador el mejor negocio del momento (lo dice el Edil del mercado, ministro `artesania`).

## 9. Historia (fuentes; dictamen)
- **Grano barato a la plebe**: los ediles repartieron trigo de Hispania a 4 ases el modio en 203 y 201 a.C. y de
  África a 2 ases en 200 a.C. (Livio 30.26.6; 31.4.6; 31.50.1). → contrato *annona* (histórico en la idea; cifras de juego).
- **Precios de la Galia Cisalpina**: trigo a 4 óbolos el medimno siciliano, cebada a 2, el vino al precio de la cebada
  (Polibio 2.15.1). → el grano y el vino baratos en tierra de origen. Histórico.
- **Vino a los galos**: los mercaderes itálicos cambiaban un ánfora de vino por un esclavo (Diodoro 5.26.3). → vino
  caro en Mediolanum. Histórico (cifra exagerada por Diodoro).
- **Aceite y vino en la finca**: Catón pone la viña primero y el olivar después (*De agri cultura* 1.7) y da contratos
  de venta del aceite y de la uva colgada (144–147). → aceite y vino como productos de la finca. Histórico.
- **Portoria**: los censores pusieron aduanas en Capua y Puteoli en 199 a.C. (Livio 32.7.3) y muchas más en 179 a.C.
  (Livio 40.51.8). La tasa del 2,5 % (*quadragesima*) es de época posterior → **licencia de juego** en la cifra.
- **Acaparar grano**: los ediles multaron a los tratantes por encarecer el grano en 189 a.C. (Livio 38.35.5). Histórico.
- **Mercaderes rivales y tratados**: los tratados de Roma y Cartago regulaban dónde podía comerciar cada uno (Polibio
  3.22–24). → rivales púnicos y contrato *tratado*. Histórico en la idea.
- **Senadores sin barcos**: la *lex Claudia* (218 a.C.) prohibió a los senadores barcos de más de 300 ánforas (Livio
  21.63.3). → nota de la ficha; no es regla.
- Los precios base, la estación, el empuje de la oferta, el flete, el riesgo y los rivales son **licencia de juego**.
