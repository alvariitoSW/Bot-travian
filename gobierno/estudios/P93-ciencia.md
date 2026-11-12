# P93 Ciencia: Saber y Escuela (estudio final, versión corregida)

Fecha: 12/11/2026. Para guardar como `gobierno/estudios/P93-ciencia.md` antes de abrir I5.
Pedido del usuario: «Apruebo ambas y que lo de ciencia sea más elaborado como lo que se investigue y las mejoras y que esté todo balanceado para no ser el jugador más chetado tan fácil pero que sean algo ingenioso».

Estado: segunda vuelta. La primera versión pasó por una revisión de trampas (trece formas de romperla o de exprimirla, con medidas hechas sobre el repo). Esta versión cierra las trece. El resumen está en la sección 10.

Base elegida: el diseño 2 (la Escuela) con injertos de los otros dos. Dos de los tres jueces lo escogieron y es el más fiel al código.

## 0. Lo que se comprobó en el repo (solo lectura)

- **Q7 (Senado) sí está hecha.** El tablero la marca hecha y `G.favorBajo` existe. `aplicaMision` es una constante privada: se expone una función pequeña `G.favorAplica(senado, pueblo)`.
- **CN2 hecha**: `G.ciudadE(id)`, `c.obras`, piezas en `ciudad.js` con mejoras I, II y III (niveles `c.b` 1, 3, 6 y 10). **CN4 (colocar con el dedo) no.** `forjaHtml` se pinta hoy en `ui.js` (líneas 354 y 499). La Escuela se pinta en los mismos sitios y CN4 la moverá después.
- Los niveles de `c.b` saltan 0, 1, 3, 6, 10. Por eso los requisitos de edificio usan solo 1, 3 o 6.
- Roma arranca con 287 habitantes y 164 puestos: sobran 123 aldeanos. La producción sale de `pop / puestos` con tope 1 (`G.manoObraDe`), así que **sacar gente del campo no baja la producción** mientras sobren manos. El coste real del sabio va en oro, impuestos, reclutas y solar. Se lo decimos claro al jugador.
- `G.trade` y `G.venderSobrante` cambian cualquier material por oro a 0,45-0,90. El oro no frena solo; por eso el freno también es el solar, los reclutas y un precio que sigue a tu producción (4.6).
- **El reloj de la partida** (nuevo, comprobado): `G.yearOf(t) = 280 - floor(t/12)`. El año 264 a.C. cae en el mes 192, el 218 a.C. en el mes 744, el 200 a.C. en el mes 960 y el fin (146 a.C.) en el mes 1.608. Los bots ganan hacia el mes 200-250. Los hechos históricos salen por año (`D.EVENTS`); los saberes y las edades van **por progreso, no por fecha**.
- **Cobro mensual** (nuevo, comprobado): los plazos de obras y reclutas se cobran en `G.cierreMes` con `pagaCuota`; si no hay fondos, la obra se pausa y `rojo = true` llega a `G.senadoMes(rojo)`. En cambio, en `G.tick` un déficit de oro se resta de la caja y del almacén y, si no alcanza, **el resto desaparece**: con el oro a cero nadie "debe" nada. Por eso la paga de los sabios no puede ir por ahí.
- **Recursión** (nuevo, comprobado): `G.prod()` calcula `gOk` (hay grano) y lo pasa a `G.popEfectiva` y `G.cabezasImp` para no dar vueltas. `G.animoClases(c)` sin `gOk` llama a `G.prod()`. Cualquier función nueva que `G.prod` use y que lea el ánimo de las clases debe recibir `gOk`.
- **Arranque de partida** (nuevo, comprobado): `G.newGame` (línea ~587) llama a `G.migrarSenado(s)` y `cargar()` (línea ~1057) también. `G.migrarInv` va en **los dos** sitios.
- **Viajes** (nuevo, comprobado): `G.travel` calcula meses continuos; en modo turnos `G.llegada` los redondea hacia arriba a múltiplos de 3 meses (`D.TURNO_MESES`). Por eso un "-15 %" casi nunca se ve.
- **Almacén** (nuevo, comprobado): `G.cap()` = suma por ciudad de 600 × 1,45 elevado al nivel del almacén, y vale para cada recurso.
- La madera naval abre el puerto desde el nivel 7 y da -10 % a los viajes por mar (`viajeMar: 0.9`). El hecho de 260 ya da -30 % a las travesías (`fx: 'corvus'`, `s.mods.sea = 0.7`). La Ciudad de artesanos (`D.TIPOS.saber`) ya abarata la forja un 25 %.
- Bienes que ya tocan los mismos campos (`D.ESPECIAL`): Sal (crece ×1,1), Plata (impuestos ×1,1), Púrpura (oroCom ×1,1), Madera naval (viajeMar ×0,9), Pieles (paga ×0,9), Mármol (obra ×0,95), Caballos (instr ×0,9). Los tipos de ciudad multiplican aparte (por ejemplo `paga` de la Colonia militar).
- `D.CLASES` existe con `escConquista 0.25`, `escAnimo 0.15` (tope 15), `bajo 30`, `manumision 55`, `manumisionTasa 0.05`, `ciudadaniaCoste 60`, `ciudadaniaMax 0.4`, `impCiu 2.5`. Hay **12 lecturas** (10 en `game.js`, 2 en `ui.js`; busca `D.CLASES`).
- Tests que cambian: `sim.test.js` lista de exclusión del bot (línea ~275, la que lleva `'herreria','acueducto','termas','anfiteatro'`), el contador de edificios urbanos (12 pasan a 13; búscalo por el número) y `ciudad.test.mjs` líneas ~47-51 (16 piezas pasan a 17 y 12 `bid` a 13).
- `G.faltaEspecial` se llama en `game.js` (líneas ~528, 539 y 597). Ahí va `G.faltaInv`.
- `CACHE` de `sw.js` es hoy `aqvila-v50`.
- El tablero ya lista I5 (P47, investigación y edades) e I5b (P93). **Este estudio sustituye a las dos** y las reparte en I5, I5b, I5c e I5d.

## 1. La idea en 6 líneas

1. **Saber es una cola de estudio**: un saber a la vez, que se paga al empezar (materiales y oro) y dura meses. Sin Escuela corre a ritmo 1. Nadie se queda bloqueado.
2. **La Escuela se abre al investigar «Preceptores griegos».** Allí destinas gente a estudiar. Más sabios, más rápido, pero cada sabio nuevo rinde menos **y cobra más** (la paga sube con el total de sabios del imperio). El ritmo tiene tope ×3.
3. **Un sabio cuesta oro, impuestos, un recluta y un solar.** La producción casi no baja. Es verdad y se enseña. El oro se cobra de verdad cada mes: sin oro, los sabios se van a casa.
4. **22 saberes, 4 ramas (Campo, Oficios, Guerra, Mar) y 4 edades.** Hay 6 pares «o tú o yo» con raíz histórica. De 22 caben 16. Más la herrería, que sigue siendo la forja de la rama Guerra.
5. **Frenos que duran toda la campaña**: nada de lo que investigas acelera el investigar (salvo Eureka, acotado). **El precio sigue a tu producción**: todo el camino cuesta unos 40 meses de producción del imperio. Subir de edad pide mundo. Cada bono tiene techo, y el resultado final (con bienes y tipos de ciudad) también.
6. **El enemigo no investiga, pero copia tu armamento, tu moral y tus murallas cuando pelea contigo**, bando por bando (hasta la mitad de tu ventaja). Poseer la ciudad histórica que inspiró un saber (Siracusa, Tarento...) lo estudia un cuarto más deprisa mientras la tengas.

### 1b. Injertos y por qué

- (D1) **Nada acelera el estudiar.** Sin interés compuesto. Perseo y Acoger no dan ritmo. Única excepción: Eureka, sobre un solo saber y solo mientras posees la ciudad.
- (D1, rehecho) **Precio que sigue a la producción**, sin tope. Es el freno que dura: el grande paga más, el pequeño menos.
- (D1) **El rival copia la mitad de tu ventaja** (Polibio 3.87). Ahora por bando y con moral y murallas incluidas.
- (D1) **Todo en `D.SABER` y `D.INVEST` y un script de calibración como condición de entrega.**
- (D1, rehecho) **Alta de 6 oro por sabio, paga por edad y paga que sube con el total de sabios.** Evita barajar gente cada mes y repartir escuelas para esquivar el coste.
- (D1) **Afinidad por tipo de ciudad** (×1,25 en su rama).
- (D3) **Esclavos letrados como sabios** (Livio Andronico, esclavo griego).
- (D3, rehecho) **Eureka**: ritmo ×4/3 (tiempo ×0,75) en ese saber mientras posees la ciudad histórica. Es también la ruta blanda de los saberes de conquista.
- (D3) **Presets de dotación y de clase**, y pares de tarjetas lado a lado con una «o» en medio.
- (D3) **Techos duros por campo**, ahora también sobre el resultado final, y el aviso «Tope útil alcanzado».
- (D3) **Astilleros de ribera**: suple la madera naval. Es lo que pidió el usuario.
- (D3) **Favor del Senado y del pueblo en 3 saberes** (Q7 ya existe).
- (D3) **Tres pasos explicados en la primera pantalla** y una línea en la Crónica y el Códice por saber.
- (D3, opcional) **Reformar** con precio real: tarea I5d.
- (D2) Se mantiene: pares con historia, saberes que se conquistan o llegan por progreso, precio dentro de cada saber fuerte, la Escuela ocupa un solar, `G.sabiosDe` como único lector, caché de `G.invMul`, efectos de una sola vez al completar.

**Corregido sobre D2**: Perseo y Acoger no aceleran. Magón baja a +3 % de grano y pierde el ×1,40 agrario. Botín de Macedonia (×1,25) se descarta. Arquímedes pasa de 4 % a 2,5 % por nivel de muralla (tope +15 %). Hormigón pierde `costeObra` y deja solo `obra`. La Edad IV pide barrio 2, no 3. Letras se funde en Oficios (4 ramas, no 5). El Corvus ya no hace las travesías más lentas.

**Descartado**: Rectificar cada lustro de D1 (lo cubre Reformar opcional). Ideas del -30 % y ciudades maestras de D1 (una sola palanca de descuento: Eureka). Techo de forja por edad de D1 (cambia el calendario militar ya aprobado). Moneda de plata de D2 (engorda la venta de sobrantes). Parcelas, Libros Sibilinos y Servicio largo (quedan de reserva). El precio por ciudades y saberes hechos de la primera versión (lo sustituye el precio por producción).

## 2. El edificio: la Escuela

### 2.1 Cómo se abre
- Se investiga **Preceptores griegos** (`griego`, Edad I, 12 meses base). Es la llave. Sin él, `G.colocar`, `G.mejorarPieza` y `G.upgrade` devuelven «Pide investigar Preceptores griegos» (función `G.faltaInv(b)`, junto a las 3 llamadas a `G.faltaEspecial`; mismo motivo en `ui.js`).
- Además: la ciudad llega a **300 habitantes** (`desde: 300`, como el cuartel) y hay un solar libre (`solar: 1`). Compite con foro, almacén, mercado, templo, cuartel, establo, puerto y herrería por los 7 a 11 solares (Roma tiene 10).
- Una Escuela por ciudad. `G.colocar` rechaza la segunda.

### 2.2 Datos
- `D.BUILD.escuela = { n:'Escuela', i:<icono de pergamino>, solar:1, time:3, cost:{madera:70, piedra:90, hierro:10, grano:40, oro:60}, d:'Aquí estudian los sabios: aceleran las investigaciones y cobran paga.' }`.
- `EDIF.escuela` en `ciudad.js`: `bid:'escuela'`, `coste:R5(70,90,10,40,60)`, `obra:2`, `w:22`, `d:20`, `radio:0`, `desde:300`, `que:'Los sabios estudian aquí; cerca del foro y lejos del humo'`. Va en `ORDEN` tras `herreria`. Regla de sitio: copiar la de la herrería (cerca del foro, lejos del taller).
- Mejoras I a III con la fórmula de `ciudad.js`: I ≈ 3,75 veces el coste base (oro 225), II ≈ 16 veces (oro 960), III ≈ 92,5 veces (oro 5.550; lujo de fin de partida). Mantenimiento: 0,15 oro por nivel.
- **Cada mejora da dos cosas**: más aforo y más calidad. Calidad por sabio (`cal`): nivel 1 y 3 = ×1,00; nivel 6 (mejora II) = ×1,10; nivel 10 (mejora III) = ×1,20. Así subir una sola escuela rinde más que abrir muchas pequeñas.
- **Arte: ninguno.** Ficha del registro `{ sin: 'la escuela no tiene modelo: no se dibuja en la ciudad', provisional: true }`, como la herrería. `arte.mjs` no cambia (34,1 de 37 MB). Cuando CN3 dibuje piezas, se le asigna un modelo que ya exista.
- Comprobar que `PIEZA_DE.escuela` entra y que `c.b.escuela` se deriva de la pieza sin código extra (como `herreria`). Leer piezas con `G.ciudadE(cid)`.

### 2.3 Cómo se destinan ciudadanos
Campo propio `c.sabios = { dot: 0..3, clase: 'ple' | 'ciu' | 'esc' }`. No se toca `c.reparto` (exige 4 claves y suma 20). Una ciudad sin ese campo cuenta como `{dot:0, clase:'ple'}`.

- Tarjeta «Escuela» en la ficha de la ciudad (patrón de `forjaHtml`; nunca una hoja flotante: se repinta y pierde los toques).
- Fila 1, **Dotación**: Cerrada, Un tercio, Dos tercios, Plena (0, ⅓, ⅔, 1 del aforo).
- Fila 2, **Quién estudia**: Plebeyos, Ciudadanos, Maestros esclavos.
- Línea viva (sin repintar la hoja): «18 estudian de 30 plazas · rinde 18 · cuestan 5,4 oro/mes (0,30 por cabeza) · quitan 18 reclutas · ociosos en la ciudad: 123». El botón de la dotación enseña antes el efecto: «Plena: +12 sabios, +0,25 de ritmo, +5,1 oro/mes de coste, alta 72 oro».
- **Aforo** = 10 × nivel de la Escuela: 10, 30, 60, 100 (niveles 1, 3, 6, 10).
- **Sabios efectivos** = mín(dotación × aforo, disponibles de esa clase, 15 % de (población - 50)).
- **`G.sabiosDe(c, gOk)` es el único lector** y devuelve `{n, porClase, R, imp, ociosos}`. **Primera línea: salida inmediata si `!c.sabios || !c.sabios.dot`**, sin tocar el ánimo. Solo la clase esclavos llama a `G.animoClases(c, gOk)`, y siempre con el `gOk` que recibe. `G.prod` lo pasa a `G.popEfectiva` y `G.cabezasImp` como ya hace hoy. Se recorta solo si la población cae (hambre, guerra).
- **Ciudadanos** salen de `c.ciu`. **Plebeyos** son `pop - ciu - esc`. **Esclavos** salen de `c.esc`, solo si su ánimo es 30 o más; por debajo no rinden.
- Si la ciudad pasa a otro dueño o se rebela (`soltarCiudad`, `rebelion`): `c.sabios = {dot:0, clase:'ple'}`.
- Una ciudad con felicidad bajo `D.FELICIDAD_MIN_CRECER` (40) no estudia.
- `ociosos` = habitantes sin puesto una vez quitados los sabios (la cifra de 123 en Roma al principio).

### 2.4 Qué cuesta cada sabio al mes (Edad I)

La paga de cada sabio es: **paga base × factor de edad × (1 + S/50)**, donde S es el número total de sabios en todo tu imperio.
- Factor de edad: ×1,00 / 1,25 / 1,50 / 1,75 (Edades I a IV).
- El factor (1 + S/50) vale ×1,2 con 10 sabios, ×1,6 con 30, ×2,2 con 60 y ×3,0 con 100. No importa cuántas escuelas haya: **cuenta el total**. Repartir sabios en muchas ciudades no abarata nada.

| Clase | Rinde | Paga base | Impuesto que deja | Total al mes por cabeza con S = 10 / 30 / 60 / 100 |
|---|---|---|---|---|
| Plebeyo | 1,0 | 0,20 | 0,03 | 0,27 / 0,35 / 0,47 / 0,63 |
| Ciudadano | 1,6 | 0,45 | 0,075 | 0,62 / 0,80 / 1,07 / 1,43 |
| Maestro esclavo | 1,3 | 0,10 | 0 | 0,12 / 0,16 / 0,22 / 0,30 |

Coste mensual del imperio con todos plebeyos (Edad I): S = 10 cuesta 2,7 oro/mes, S = 30 cuesta 10,5, S = 60 cuesta 28,2 y S = 100 cuesta 63. En Edad II ×1,25 de paga: 30 sabios 12,9; 60 sabios 34,8. En Edad IV ×1,75 de paga: 30 sabios 17,7; 60 sabios 48; 100 sabios 108.

Además, cada sabio:
- **Alta**: 6 oro una sola vez por sabio añadido, sin devolución. Bajar la dotación es gratis. Subir y bajar para esquivar la paga cuesta más que pagarla.
- **Reclutas**: sale de `G.recruits` (que pasa a restar `G.sabiosDe(c).n`). Los reclutas son **por ciudad**: en Roma, 30 sabios son 30 de los 237 reclutas (13 %); en una ciudad de 830 habitantes, el 4 %.
- **Población efectiva**: sale de `G.popEfectiva` y de `G.cabezasImp`. Solo muerde en ciudades pequeñas o sin sobrantes.
- **Come** lo mismo que cualquiera (0,02 de grano).
- **La paga se cobra como un plazo al cerrar el mes** (ver 4.15), no por `G.mantenimiento`. Así no hay doble cobro, no hay recursión con `G.prod` y no se puede esquivar dejando el oro a cero.
- Los maestros esclavos son baratos y escasos. Solo existen en ciudades conquistadas (25 % de la población, o 60 % con Villa esclavista). Si su ánimo pasa de 55 se liberan (manumisión 5 % al mes; **0 con la Villa**). Quien los quiera sin Villa tiene que mantenerlos entre 30 y 55 de ánimo. Es la tensión histórica del maestro cautivo.

### 2.5 Qué hace: el ritmo

- `R` = suma, en todas tus ciudades, de **sabios × rendimiento de su clase × afinidad × calidad de la escuela (`cal`)**.
- **Ritmo `vel = mín(3, 1 + 2,4 × R / (R + 60))`.** Sin Escuela `vel = 1`.
- Afinidad por tipo (`D.TIPOS[..].afin`): Colonia agraria = Campo, Colonia militar = Guerra, Base naval = Mar, Emporio = Oficios; sus sabios rinden ×1,25 **mientras la investigación en curso sea de esa rama**. Ciudad de artesanos: ×1,12 en todas. Municipio: nada. No hay descuento de precio por tipo.
- Cola: `p += dm × vel × eur`, donde `eur = 4/3` si en ese instante posees la ciudad Eureka del saber y `1` si no. Acaba cuando `p ≥ P`, con `P = meses base × D.SABER.tiempoMul`. **P no se toca por Eureka**: si pierdes la ciudad, el ritmo vuelve a la normalidad al instante.
- La barra `.prog` usa `data-t0 = t - p/(vel·eur)` y `data-t1 = t + (P - p)/(vel·eur)`. Se recalcula al tocar la dotación y cuando cambia la posesión de la ciudad.

| R | 10 | 20 | 30 | 48 | 60 | 100 | 150 |
|---|---|---|---|---|---|---|---|
| Ritmo | ×1,34 | ×1,60 | ×1,80 | ×2,07 | ×2,20 | ×2,50 | ×2,71 |
| Árbol completo (666 meses base, sin Eureka) | 496 | 416 | 370 | 322 | 303 | 266 | 246 |

Cuánto cuesta cada paso (plebeyos, Edad I): de 10 a 30 sabios, +0,46 de ritmo por +7,8 oro/mes (1,7 oro por cada 0,1 de ritmo). De 30 a 60, +0,40 por +17,7 (4,4 por 0,1). De 60 a 100, +0,30 por +34,8 (11,6 por 0,1). **Hay un punto interior donde dejar de meter gente.**

### 2.6 Tres ejemplos en Roma
- Escuela I con 10 plebeyos: ×1,34, 2,7 oro/mes (13 % del +20,6 de arranque), alta 60 oro.
- Escuela nivel 6 con 60 plebeyos (R = 60 × 1,1 = 66): ×2,26 y 28,2 oro/mes en Edad I (48 en Edad IV), 60 reclutas.
- Escuela nivel 6 con 60 ciudadanos (R = 60 × 1,6 × 1,1 = 106): ×2,53 y 63,9 oro/mes en Edad I (108 en Edad IV). Los ciudadanos dan +0,27 de ritmo por +36 oro/mes más: solo valen donde falta aforo o faltan reclutas.

### 2.7 Cómo se ve
- Pestaña «Saber» (botón en Imperio, junto a Senado; `UI.tab='saber'`, ajuste en `setTab` y `hudDock`).
- **Primera vez, tres pasos**: «1 Investiga Preceptores griegos. 2 Construye la Escuela y pon gente a estudiar. 3 En cada par elige uno: el otro se cierra».
- Arriba: edad actual con lista de requisitos para la siguiente (chips verdes y rojos), investigación en curso con barra y «ritmo ×1,8 con tus 30 sabios», aviso «Tope útil alcanzado» si `vel ≥ 0,9 × velMax`, y «Cartago ya copia el 56 % de tu ventaja» (uno por bando que haya peleado contigo).
- 4 chips de rama (Campo, Oficios, Guerra, Mar). Debajo, una fila por edad. Los pares se pintan como dos tarjetas lado a lado (unas de 170 px) con una «o» en medio; la excluida muestra un candado con el nombre de su gemela.
- Al tocar una tarjeta se despliega el detalle **en línea** (efecto, coste en chips rojos o verdes con la escala ya aplicada, meses estimados, «Estudiar» y luego «Confirmar»). Nunca una hoja flotante.
- Estados: disponible, «Pide: Edad II, granja 3», «Excluida por X», «No cabe en tus almacenes» (ver 4.6), «Eureka: posees Siracusa, ritmo ×1,33».
- Cada saber terminado escribe una línea en la Crónica y entra en el Códice con su fuente.

## 3. Las investigaciones

**Cuatro ramas**: Ca = Campo, Of = Oficios (incluye las Letras), Gu = Guerra, Ma = Mar. La forja (armas y armaduras, niveles 0 a 5) queda tal cual como columna de Guerra, con su cola aparte que corre en paralelo. `s.forja` no se toca.

**Coste** en el orden madera/piedra/hierro/grano/oro, **antes de la escala** (ver 4.6): son los precios que valen cuando tu producción de materiales es 470 al mes o menos. Meses = meses base con `vel = 1`. **Nombres de edad**: licencia de juego, ligados al progreso y no al reloj; los años entre paréntesis son de ambientación y no abren nada. Nada de «Monarquía» ni «Imperio».

**Eureka**: si pones «Eureka: X», mientras poseas la ciudad X ese saber avanza a ritmo ×4/3 (tiempo ×0,75). Pierde el efecto al perder la ciudad.

**Gramática de requisitos** (`G.invReq(c, req)`, un objeto por requisito, el único lugar que los lee): `{edad:n}`, `{b:[id,n]}` (alguna ciudad propia; usar 1, 3 o 6), `{barrio:n}`, `{ciudades:n}` (recortado a las ciudades de la región menos una), `{tiene:[ids]}`, `{fac:'cartago'}`, `{inv:[ids]}`, `{saberes:n}`, `{ramas:n}`, `{y:n}` (año a.C. igual o menor), `{o:[req,req]}`. Edificios usados: foro, granja, cuartel, puerto, mercado, muralla, templo, escuela y barrio hasta nivel 2 (Villa). **Ninguno pide acueducto, termas, anfiteatro, vigiles ni lujo.** **Ningún saber depende solo de una fecha**: el año `{y:n}` solo puede aparecer dentro de un `{o:[...]}` con una salida por progreso.

**Efectos de viaje, en meses** (se cambió de porcentaje a meses para que se vean con turnos): `viajeTierra:{resta:3, sobre:3}` significa «a los trayectos de más de 3 meses se les quitan 3, y nunca bajan de 3». Orden en `G.travel`: primero los porcentajes que ya existen (hecho de 260, madera naval, puerto), luego la resta de la ciencia, luego el redondeo a turno.

### Edad I «Roma itálica» (se empieza en ella)

| id | Rama | Requisitos | Excluye | Coste | Meses | Efecto (dato) | Base histórica y dictamen |
|---|---|---|---|---|---|---|---|
| `griego` Preceptores griegos | Of | foro 1 | - | 40/50/10/60/50 | 12 | `ef:{abre:'escuela'}` | Suetonio, Gramáticos 1; Cicerón, Bruto 72: Livio Andronico, griego de Tarento, enseña hacia 272 a.C. **Probable.** La Escuela como edificio: **licencia de juego.** |
| `apio` Obras de Apio Claudio | Of | foro 1 | - | 90/140/20/40/60 | 20 | `ef:{viajeTierra:{resta:3,sobre:3}, popCap:1.05}` (los trayectos de tierra de más de 3 meses duran 3 menos, nunca menos de 3; población máxima +5 %) | Livio 9.29; Frontino, De aquaeductu 4-6: Vía Apia y Aqua Appia (312 a.C.), agua subterránea, sin arcos. **Probable.** Cifras: licencia. |
| `castra` Campamento y disciplina | Gu | cuartel 1 | - | 60/60/110/60/50 | 16 | `ef:{mor:3, paga:0.95}` | Polibio 6.27-39: campamento, castigos y premios. **Probable.** |

### Edad II «Roma sale al mar»
Se abre con **E2**. Requisitos de edad: ver tabla de edades.

| id | Rama | Requisitos | Excluye | Coste | Meses | Efecto (dato) | Base histórica y dictamen |
|---|---|---|---|---|---|---|---|
| `quinque` Quinquerreme copiada | Ma | Edad II; puerto 1. Eureka: `tarentum` | - | 280/40/90/80/110 | 24 | `ef:{viajeMar:{resta:3,sobre:3}}` (travesías de más de 3 meses duran 3 menos, nunca menos de 3) | Polibio 1.20: Roma copia una nave cartaginesa varada (260 a.C.); Tarento y otros aliados prestan naves (1.20.14). **Histórico.** Cifra: licencia. |
| `corvus` Corvus | Ma | Edad II; `quinque` | `remeros` | 220/30/200/60/130 | 28 | `ef:{atkMar:1.07}` (ataque ×1,07 si el ejército de Roma ataca llegando por una arista marítima; solo `kind:'attack'`; junto con Pilum llega justo al techo ×1,10) | Polibio 1.22: pasarela de abordaje (cotejado en H1). **Histórico.** Cifra: licencia. No toca el -30 % a las travesías que ya da el hecho de 260. |
| `remeros` Remeros adiestrados en seco | Ma | Edad II; `quinque` | `corvus` | 180/40/40/120/120 | 28 | `ef:{viajeMar:{resta:3,sobre:6}}` (se suma a Quinquerreme: las travesías de más de 6 meses duran otros 3 menos, nunca menos de 3; techo del mar: -6 meses) | Polibio 1.21: remeros adiestrados en bancos sobre la arena. **Histórico.** Cifra: licencia. |
| `fasti` Fasti y ley escrita | Of | Edad II; escuela 1 | - | 50/90/10/80/130 | 24 | `ef:{inqMeses:0.6, inqProd:0.6}` (la inquietud tras conquistar dura 4,8 meses y quita el 24 % de producción, no 8 meses y 40 %) | Livio 9.46: Cneo Flavio publica el derecho y el calendario (304 a.C.). **Probable.** |
| `vina` Viña y olivar | Ca | Edad II; granja 3. Eureka: `agrigentum` | `trigo` | 140/120/20/60/130 | 28 | `ef:{oroCom:1.25, impuestos:1.08}` (su precio es cerrar el grano y el crecimiento de Trigo) | Catón, De agri cultura 1.7: la viña, primera en rendimiento. **Probable.** Cifras: licencia. |
| `trigo` Trigo y diezmo de Sicilia | Ca | Edad II; granja 3 | `vina` | 120/60/20/140/110 | 28 | `ef:{grano:1.05, crece:1.06}` | Cicerón, Verrinas 3: lex Hieronica, el diezmo de Hierón que Roma conserva. **Probable.** |
| `pilum` Pilum y manípulo | Gu | Edad II; cuartel 3 | - | 80/40/200/60/140 | 26 | `ef:{atk:1.03}` | Polibio 6.23.9-11 (dentro del tramo 6.21-23 ya cotejado). **Histórico.** Cifra: licencia. |

### Edad III «Aníbal»
Se abre con **E3**.

| id | Rama | Requisitos | Excluye | Coste | Meses | Efecto (dato) | Base histórica y dictamen |
|---|---|---|---|---|---|---|---|
| `latif` Villa esclavista | Ca | Edad III; granja 6 | `colon` | 240/100/160/200/270 | 44 | `ef:{cl:{escConquista:0.60, escRenta:0.20, escAnimo:0.25, escAnimoTope:20, manumisionTasa:0, inquietud:35}}` (60 % de la ciudad conquistada pasa a esclavos; cada esclavo rinde 0,20 oro/mes; **no se libera ninguno**; cada punto de % de esclavos resta 0,25 de ánimo a los plebeyos, hasta 20; con ánimo de esclavos bajo 35, -8 de felicidad) | Catón, De agri cultura 2.7 y 56-59; la crisis del pequeño campesino es tesis moderna (Toynbee). **Probable.** Cifras: licencia. |
| `colon` Colonos y asignaciones | Ca | Edad III; barrio 2 | `latif` | 220/160/80/240/250 | 44 | `ef:{cl:{ciudadaniaCoste:30, ciudadaniaMax:0.55, impCiu:2.9, escConquista:0.10}, instr:0.94}` | Polibio 2.21: ley de Flaminio, ager Gallicus (232 a.C.). **Probable.** |
| `sambuca` Sambuca y arietes | Gu | Edad III; puerto 1; cuartel 3 | `arquimedes` | 360/60/260/100/290 | 44 | `ef:{brecha:1}` (al atacar, la muralla enemiga cuenta un nivel menos; solo `cfg.wall`, nunca `c.b.muralla`) | Polibio 8.4-6 (dentro del tramo 8.5-8 cotejado): Marcelo y las sambucas sobre barcos en Siracusa. **Histórico.** |
| `arquimedes` Máquinas de Arquímedes | Gu | Edad III; muralla 3; `{o:[{tiene:['syracusae']},{ciudades:6}]}`. Eureka: `syracusae` | `sambuca` | 160/300/300/80/320 | 48 | `ef:{defMuro:0.025}` (al defender, defensa × (1 + 0,025 × nivel de muralla, tope 6) = hasta +15 %) | Polibio 8.5-8; Plutarco, Marcelo 15-17 (cotejados). **Histórico.** Cifra: licencia. |
| `astilleros` Astilleros de ribera | Ma | Edad III; puerto 3. Eureka: `panormus` o `lilybaeum` | `derrota` | 480/140/140/100/190 | 40 | `ef:{sinBien:'puerto'}` (el puerto deja de pedir madera naval para pasar del nivel 6; el bien conserva su -10 % de viaje y su peso en el mapa) | Polibio 1.20-21: la flota se levanta desde cero. **Histórico.** Que sustituya al bien: licencia. |
| `derrota` Derrota mercante | Ma | Edad III; mercado 3; puerto 1 | `astilleros` | 480/140/140/100/190 | 40 | `ef:{rutas:1, rutaRenta:1.15}` | Polibio 3.22-25: tratados de comercio Roma-Cartago (ya citado en `D.RUTA`). **Histórico.** Cifras: licencia. |
| `medicina` Cirujanos griegos | Of | Edad III; escuela 1; `{o:[{y:219},{ciudades:5}]}` («llega Arcágato» en 219 a.C., o antes si Roma tiene mundo para atraerlo) | - | 100/60/80/260/290 | 38 | `ef:{crece:1.10, herida:-12, fel:-2, favor:{senado:-3, pueblo:3}}` (el héroe herido cura en 12 meses, no 24) | Plinio, NH 29.12-14: Arcágato, primer médico griego, 219 a.C.; apodado «verdugo»; Catón desconfiaba. **Probable.** Cifras: licencia. |

### Edad IV «Roma y los reinos griegos»
Se abre con **E4**.

| id | Rama | Requisitos | Excluye | Coste | Meses | Efecto (dato) | Base histórica y dictamen |
|---|---|---|---|---|---|---|---|
| `magon` Tratado de Magón | Ca | Edad IV; `{o:[{fac:'cartago'},{ciudades:7}]}`. Eureka: `carthago` | - | 360/140/70/360/430 | 68 | `ef:{grano:1.03, crece:1.04, hambre:0.5}` (con falta de grano la población baja a la mitad de ritmo: silos y reservas) | Plinio, NH 18.22-23 (y Varrón, RR 1.1.10): el Senado manda traducir los 28 libros de Magón tras 146 a.C. **Probable.** En el juego se obtiene al tomar una plaza púnica. |
| `perseo` Biblioteca del rey Perseo | Of | Edad IV; escuela 3; `{o:[{tiene:['pella']},{ciudades:7}]}`. Eureka: `pella` | - | 120/160/20/300/440 | 58 | `ef:{pts:2, fel:2}` (los 2 puntos de héroe se pagan una sola vez al completar; marca en `hechas`) | Plutarco, Emilio Paulo 28; Polibio 31.23-25: los libros de Perseo pasan a los hijos de Paulo, entre ellos Escipión Emiliano (168 a.C.). **Probable.** |
| `acoger` Acoger a los filósofos | Of | Edad IV; escuela 3 | `expulsar` | 40/40/10/160/360 | 38 | `ef:{impuestos:1.08, crece:1.04, pts:1, fel:-2, favor:{senado:-4, pueblo:3}}` (1 punto de héroe una sola vez) | Plutarco, Catón 22; Gelio 6.14: embajada de Carnéades (155 a.C.). **Probable.** |
| `expulsar` Expulsar a los filósofos | Of | Edad IV; escuela 1 | `acoger` | 60/60/60/160/250 | 28 | `ef:{fel:4, crece:0.96, favor:{senado:4, pueblo:-2}}` (sin paga ni moral: eso se queda en Castra) | Suetonio, De rhetoribus 1; Gelio 15.11: expulsión de 161 a.C. **Probable.** |
| `hormigon` Opus caementicium | Of | Edad IV; escuela 1 | - | 200/380/60/100/300 | 48 | `ef:{obra:0.88}` (obras un 12 % más cortas; entra por `G.bonoMul('obra')`, sin gancho nuevo) | Livio 35.10: Pórtico Emilio (193 a.C.), primeros usos del hormigón. **Probable.** Cifra: licencia. |

### Los tres hitos de edad

| id | Nombre | Requisitos | Coste | Meses | Efecto | Base |
|---|---|---|---|---|---|---|
| `E2` | Roma sale al mar (264-219 a.C.) | 2 saberes de la Edad I; foro 2; 2 ciudades | 150/150/60/100/100 | 24 | Abre la fila II | Polibio 1.5-6 (periodización). **Licencia de juego.** |
| `E3` | Aníbal (218-201 a.C.) | 5 saberes en 3 ramas distintas; 3 ciudades; mercado 3; barrio 2 | 300/300/150/200/240 | 38 | Abre la fila III | Hechos de `D.EVENTS`. **Licencia de juego.** |
| `E4` | Roma y los reinos griegos (200-146 a.C.) | 9 saberes en las 4 ramas; 5 ciudades; templo 3; barrio 2 | 500/500/300/350/480 | 58 | Abre la fila IV | Polibio 1.1-3. **Licencia de juego.** |

Subir de edad ocupa la cola: mientras dura no se investiga nada. Es parte del precio.

### Cuentas del árbol
- 22 saberes + 3 edades = 25 entradas, más la herrería (2) y la Escuela (1). **26 fichas nuevas** (22 de tipo `invest`, 3 de tipo `edad`, 1 de edificio).
- **Alcanzables: 16 de 22** (3 + 5 + 4 + 4) más 2 líneas de forja. Seis pares: `corvus|remeros`, `vina|trigo`, `latif|colon`, `sambuca|arquimedes`, `astilleros|derrota`, `acoger|expulsar`.
- Camino completo: **546 a 560 meses base de saberes + 120 de edades = 666 a 680.**
- Recursos del camino (sin escala, medidos sobre las 64 combinaciones): madera 3.530-3.830, piedra 2.540-2.930, hierro 1.730-2.060, grano 2.710-2.910, oro 4.030-4.220 (materiales en total: 10.980-11.260).
- Sin Escuela el árbol tardaría 666-680 meses (el 42 % de los 1.608 de la campaña). Nunca es imposible.

## 4. Reglas de equilibrio, con números

Todo vive en `D.SABER` y `D.INVEST` (datos puros) y se calibra con un script.

**4.1 Pares.** De 22 saberes caben 16. Cada opción del par es útil: se renuncia de verdad. Las exclusiones son permanentes salvo el Reformar opcional (I5d).

**4.2 Nada acelera el estudiar.** Ningún saber toca el ritmo, el rendimiento ni los cupos de la Escuela. Solo cuentan Escuela, sabios, calidad de la escuela y afinidad. No existe la espiral «investigo para investigar más». **Única excepción: Eureka**, acotada a un saber, a ×4/3 y solo mientras posees la ciudad.

**4.3 Ritmo con rendimiento decreciente y tope.** `vel = mín(3, 1 + 2,4·R/(R + 60))`. Ver 2.5. Con 30 sabios el árbol baja a 370 meses; con 60 a 303; con 100 a 266. El suelo absoluto (tope ×3) es unos 222 meses (200 con todas las Eureka). Meter más gente no acelera: la pantalla avisa «Tope útil alcanzado».

**4.4 Cuatro monedas por sabio.** Oro (paga que sube con el total de sabios), impuestos, reclutas y solar. Más el alta de 6 oro. En Roma, 30 plebeyos cuestan 10,5 oro/mes (el 23 % del +46 del mes 12; el 10 % del +106 del mes 120) y el 13 % de los reclutas.

**4.5 Solar y escuelas extra.** La Escuela ocupa uno de los 7 a 11 solares. Sacrificar el establo o el cuartel duele. Abrir escuelas pequeñas en muchas ciudades **no abarata la paga** (cuenta el total de sabios) y gasta un solar y 300 habitantes en cada una. Las mejoras II y III dan además +10 % y +20 % de calidad, así que concentrar rinde más: 120 puntos de R con 100 plebeyos en una escuela de nivel 10 cuestan 63 oro/mes; con 120 plebeyos repartidos cuestan 85 y ocupan 12 solares. Oro de mejora por punto de R ganado: 11 (I), 27 (II), 103 (III).

**4.6 El precio sigue a tu producción.**
`escala = máx(1, pm / 470)`, donde `pm` es la **producción media de los últimos 6 meses** de madera + piedra + hierro + grano de todo el imperio (sin restar consumo). Se aplica a materiales y oro de saberes y edades (no a los meses). `pm` vive en `s.inv.pm` y se actualiza en `G.cierreMes` (`pm += (producción - pm) / 6`); se usa la media y no el valor del momento para que nadie pueda bajar la producción un mes para pagar barato. Sin tope.

| Producción pm | Escala | Un saber medio de Edad II (381 mat. + 124 oro) | Magón (930 mat. + 430 oro) |
|---|---|---|---|
| 470 o menos (mes 12) | ×1,00 | 381 + 124 | 930 + 430 |
| 1.400 (mes 120) | ×2,98 | 1.135 + 370 | 2.771 + 1.281 |
| 1.760 (mes 240) | ×3,74 | 1.425 + 464 | 3.478 + 1.608 |
| 3.770 (mes 360) | ×8,02 | 3.056 + 994 | 7.459 + 3.449 |

Dicho en tiempo: el precio de un saber es casi el mismo **en meses de producción** esté la partida donde esté. Con el oro convertido a 1,7 materiales por denario, un saber medio cuesta: Edad I 0,7 meses de producción del imperio, Edad II 1,3, Edad III 2,5, Edad IV 2,5 (Magón 3,5). Las edades: E2 1,3, E3 2,9, E4 5,3. **Todo el camino de 16 saberes y 3 edades cuesta unos 39 meses de producción**, repartidos a lo largo de la partida y justo cuando también quieres ejército y obras. El jugador pequeño paga menos que el grande y quien va atrasado nunca paga más de la base.

Dos salvaguardas: (a) **ningún precio pasa de 0,8 × `G.cap()` por recurso**, para que nunca sea imposible por falta de almacén; si aun así el almacén es corto, el botón dice «No cabe en tus almacenes: sube el almacén»; (b) cada pago se hace de golpe al empezar y debe caber en `G.disponible`; si no, el botón dice «Faltan X».

**4.7 Las edades piden mundo.** Ciudades 2, 3 y 5; ramas 1, 3 y 4; barrio Villa; mercado 3; templo 3. El que solo conquista no sube de edad. El que solo investiga tampoco. En una región pequeña (I6) las ciudades se recortan a las de la región menos una.

**4.8 Techos duros, de dos clases.**

Primero, el **techo de la ciencia** (`D.SABER.techos`), que aplican `G.invMul` y `G.invSum` antes de devolver nada. Segundo, el **techo del resultado final**: un ayudante `G.techoFinal(campo, sinCiencia, conCiencia)` que se llama en cada punto donde hoy se multiplica ese campo (`paga` en `G.mantenimiento`, `instr` en `G.trainDur`, `viajeMar` en `G.travel`, `crece` y `grano` en `G.prod`, etc.), con todas las fuentes juntas: bienes especiales, tipo de ciudad y ciencia. **Regla**: si ya sin ciencia estás más allá del techo final, la ciencia no suma ni resta nada (nunca se quita lo que el juego ya daba); si no, el resultado es el más favorable que no pase del techo.

| Campo | Techo de la ciencia | Techo del resultado final |
|---|---|---|
| grano | ×1,08 | ×1,30 |
| crece | ×1,20 | ×1,25 |
| impuestos | ×1,12 | ×1,20 |
| oroCom | ×1,25 | ×1,40 |
| viajeTierra | -3 meses | trayecto nunca menor de 3 meses |
| viajeMar | -6 meses | trayecto nunca menor de 3 meses |
| obra | no menos de ×0,85 | no menos de ×0,75 |
| paga de tropas | no menos de ×0,85 | no menos de ×0,70 |
| instr | no menos de ×0,90 | no menos de ×0,78 |
| rutaRenta | ×1,20 | ×1,40 |
| moral | +4 | solo la ciencia la da |
| ataque (atk × atkMar) | ×1,10 | - |
| defensa por muralla | +15 % | - |

Casos que muerden de verdad: Sal ×1,1 con crece de ciencia ×1,2 daría ×1,32 y se queda en ×1,25. Pieles ×0,9 con Colonia militar ×0,75 ya dan ×0,675 sin ciencia: la ciencia no los empuja más. Plata ×1,1 con impuestos de ciencia ×1,12 daría ×1,23 y se queda en ×1,20. Viña y Acoger juntos darían impuestos ×1,166 y se quedan en ×1,12 (apilarlos no compensa).

**Los techos económicos medidos en oro al mes equivalente** (grano a 0,6 denarios; estimación sobre la economía medida del bot, que el script vuelve a medir):

| Saber | Mes 12 | Mes 120 | Mes 480 |
|---|---|---|---|
| Trigo (grano ×1,05) | +4 | +11 | +32 |
| Viña (oroCom ×1,25, impuestos ×1,08) | +5 | +22 | +25 |
| Magón (grano ×1,03) | +2 | +7 | +19 |

Viña gana al principio y Trigo gana tarde (el cruce cae hacia el mes 300), y Trigo además da crecimiento: elegir de verdad. **Toda la ciencia económica junta, con los techos puestos, suma entre el 3 y el 6 % del valor total que produce el imperio** (materiales + oro a 1,7 materiales por denario) en los meses 120 y 480. El script lo mide y **falla si pasa del 8 %**.

Combinaciones máximas diseñadas: ataque ×1,03 en general y ×1,10 en desembarcos; defensa +15 % con muralla 6; moral +3 (techo +4); mar -6 meses; tierra -3 meses; paga de tropas ×0,95 (la ciencia solo da Castra).

**4.9 Cada saber fuerte lleva su precio dentro.** Viña: cierra Trigo (grano y crecimiento). Villa: revueltas si falta grano y cierra Colonos. Medicina y Acoger: -2 de felicidad y favor del Senado. Expulsar: baja el crecimiento un 4 %. Colonos: la conquista da solo 10 % de esclavos. Sambuca: cierra a Arquímedes. Ninguno es solo «+10 %».

**4.10 Favor.** Tres saberes mueven el favor del Senado y del pueblo (`favor:{senado, pueblo}`): Medicina (-3, +3), Acoger (-4, +3), Expulsar (+4, -2). Se aplican una vez, al completar. Es un coste que no se paga vendiendo materiales.

**4.11 El atrasado nunca se atasca.** Sin Escuela, ritmo 1. El precio baja si tu producción es pequeña (y nunca pasa de la base). Eureka acelera ese saber. Los saberes de conquista se pueden alcanzar con más ciudades en vez de conquistar. Siempre hay otro saber disponible en cada edad.

**4.12 Calendario de papel** (cálculo a mano, **no medido en partida**):
- Edad II hacia el mes 43-55. Edad III hacia el 110-200. Edad IV hacia el 250-450. Árbol de 16 hacia el 380-700 según los sabios que pongas.
- Quien corre a ganar (los bots ganan hacia el mes 200-250) no completa el árbol: llega a la Edad II o III. Es la gracia.
- Coste: unos 39 meses de producción en total, más la paga: de 2,7 oro/mes con 10 plebeyos a 28 con 60 (Edad I), sobre un neto de +46 (mes 12), +98 (mes 60) y +106 (mes 120).

**4.13 Calibración obligatoria** (criterio de aceptación de I5b; si no sale, se toca `D.SABER`, no el código). Script `tools/calibra-saber.mjs`. Se prueba con recursos infinitos, 6 ciudades y todos los edificios de los requisitos ya dados, el camino de 16 en orden fijo, `tiempoMul = 1`, **sin ningún saber fechado** (Medicina entra por sus 5 ciudades). Para cada fila imprime los meses y los compara con la banda. «Con Eureka» significa que posees desde el mes 0 las seis ciudades históricas (el caso más favorable, un tope).

| Caso | Sin Eureka | Con las seis Eureka |
|---|---|---|
| Sin Escuela (ritmo 1) | 666-680, banda 650-700 | 604-614, banda 590-630 |
| Escuela nivel 3, 30 plebeyos desde el mes 15 (ritmo 1,8) | 377-384, banda 350-420 | 342-348, banda 320-380 |
| R = 60 constante desde el mes 0 (ritmo 2,2) | 303-309, **no antes del mes 300** | 274-279, **no antes del mes 270** |
| Tope (ritmo 3) | 222, no antes del 215 | 201, no antes del 195 |

Un solo multiplicador global, `D.SABER.tiempoMul` (y otro por modo en `D.MODOS`), absorbe el ajuste. El script exige solo lo que se puede medir; no exige fechas ni victorias.

**4.14 Bot sin cambios.** `campaign1` no investiga, no levanta la Escuela y no tiene copia del rival. Todos los multiplicadores valen 1. La salida debe ser **literalmente** la de hoy (ver prueba 1).

**4.15 La paga se cobra de verdad.** En `G.cierreMes`, junto al cobro de plazos de obras y reclutas: `deuda = G.pagaSabios()`. Si `G.canAfford({oro: deuda})`, se cobra con el mismo `gasta('oro', ...)`. Si no alcanza: **todos los sabios se van a casa** (`c.sabios.dot = 0` en todas las ciudades), se pone `rojo = true` (el Senado lo ve igual que una obra pausada) y la Crónica dice «Sin oro para pagar a los sabios: las escuelas cierran». Para reabrir hay que volver a pagar el alta de 6 oro por sabio. La paga **no** pasa por `G.mantenimiento` (evita el doble cobro y la recursión). `G.prod` devuelve `p.sabios` solo como dato para las Cuentas, sin restarlo de `p.oro`, y la interfaz lo resta al enseñar el neto. Dejar el oro a cero cada mes ya no regala la ciencia. (La paga de las tropas tiene hoy el mismo agujero; es otro asunto y va en las preguntas.)

**4.16 Regla de combate para calibrar.** Ningún saber suelto mueve la victoria más de 10 puntos de porcentaje en una pelea pareja. El script de I5c lo mide con 80 semillas por efecto (`mor`, `atk`, `atkMar`, `defMuro`, `brecha`). Si alguno se pasa (en las medidas hechas, defensa +15 % con muralla 4 llevaba la victoria del 84 % al 98 %), se baja su constante en `D.SABER` (por ejemplo `defMuro` de 0,025 a 0,02).

## 5. Cómo juega el enemigo

El rival **no investiga**: no tiene economía, almacén ni colas, y C3 (IA que construye) sigue sin hacerse. Su fuerza sale del general (Pirro, Aníbal, Asdrúbal) y del multiplicador de `turnoIA`. **Eso no cambia.**

Lo que sí hace es **copiar tu armamento, tu moral y tus murallas cuando pelea contigo**, como Aníbal armó a sus libios con armas romanas capturadas (Polibio 3.87.3, por cotejar; **probable**).

- Estado: un número por bando, `s.inv.copia = { cartago: 0..1, ... }`. Empieza vacío (0).
- Cuenta una batalla cuando Roma combate (ataque o defensa, ganada o perdida) contra un bando con nombre que no sea Roma ni aliado de Roma, **y** entre los dos bandos suman al menos `D.SABER.copiaBajasMin` bajas (60). Las escaramuzas y los rebeldes sin bando no cuentan. Entonces `copia[bando] += (1 - copia[bando]) × 0,15`.
- Cada bando aprende por separado. Con 1, 3, 5, 7, 10 y 19 batallas de peso contra él, copia vale 0,15 / 0,39 / 0,56 / 0,68 / 0,80 / 0,95.
- Tu ventaja, completa:
  - `tuAtk = G.forjaMul('armas') × G.invMul('atk') × (en desembarco: G.invMul('atkMar'))`.
  - `tuDef = G.forjaMul('armaduras') × (1 + defMuro × mín(6, nivel de muralla de la ciudad defendida))`.
  - `tuMor` = la moral de la ciencia (Castra: +3, techo +4).
- Lo que aplica el rival en `G.battleInfo`: `foe.atkMul *= 1 + copia × 0,5 × (tuAtk - 1)`, `foe.defMul *= 1 + copia × 0,5 × (tuDef - 1)` y `foe.moral += copia × 0,5 × tuMor`. Si el rival desembarca, copia también `atkMar` con la misma condición que tú.
- Con forja 5/5 y Pilum (`tuAtk` 1,2875): tras 5 batallas el rival llega a ×1,08; tras 10, a ×1,115; con `copia` casi 1, a ×1,14. Tu ventaja neta pasa de ×1,29 a ×1,13.
- **Premio al ataque relámpago de verdad**: quien liquida a un bando con pocas batallas de peso apenas le deja aprender, y las escaramuzas no regalan nada. Quien se eterniza contra el mismo bando se encuentra un enemigo que ya conoce sus armas.
- No toca guarniciones, generales ni `turnoIA`. Sin `Math.random` ni llamadas nuevas. Excluir aliados de Roma (comprobar con el test de rebelión).
- El bot de `campaign1` no forja ni investiga: `tuAtk = tuDef = 1` y `tuMor = 0`, la copia no cambia nada. Resultado idéntico.
- La pantalla Saber lo enseña: «Cartago ya copia el 56 % de tu ventaja».
- Constantes en `D.SABER`: `copia: 0.5`, `copiaBatalla: 0.15`, `copiaBajasMin: 60`. Gancho apagado para después: subir las guarniciones de `turnoIA` con los saberes de guerra.

## 6. Tres elecciones difíciles de ejemplo

**1. Sambuca o Arquímedes (Edad III, con Siracusa a tiro).** Siracusa tiene muralla 4 y guarnición 300.
- *Sambuca* (290 oro, 44 meses): la muralla enemiga cuenta como 3, un 10 % menos de defensa del defensor. Te ayuda a tomarla. Pero cierra Arquímedes para siempre.
- *Arquímedes* (320 oro, 48 meses): tus ciudades con muralla 4 defienden un 10 % más (hasta +15 % con muralla 6). Si ya posees Siracusa, se estudia un cuarto más deprisa mientras la tengas (Eureka). Y el rival copiará la mitad de esa ventaja cuando defienda con murallas.
- Hay que decidir **antes** de saber si el asalto sale bien. Tomar Siracusa sin sambuca duele; tomarla con sambuca te quita las máquinas.

**2. Villa esclavista o Colonos (Edad III).** Una ciudad conquistada de 150 habitantes.
- *Villa*: 90 esclavos (el 60 %) que rinden 18 oro/mes desde el primer día y nadie se libera. Además salen maestros esclavos baratos para la Escuela (0,10 oro/mes por 1,3 de rendimiento, antes del factor de total de sabios). Pero los plebeyos pierden 15 de ánimo, y si falta grano el ánimo de esclavos baja de 35 y hay -8 de felicidad: se levantan.
- *Colonos*: solo 15 esclavos, pero puedes crear hasta 82 ciudadanos por unos 240 oro (a 30 oro el lote de 10, la mitad que sin el saber). Pagan +4,6 oro/mes y se amortizan en unos 52 meses sin arriesgar nada; en una ciudad grande de 850 habitantes, Colonos deja unos +11 oro/mes más que sin él. Los ciudadanos rinden 1,6 como sabios.
- La villa paga ya y arriesga, y solo sirve en ciudades conquistadas. Los colonos tardan, valen en todas y duermen tranquilos.

**3. Treinta sabios o treinta hastati, cuando se acerca una guerra grande.** Roma tiene 10 solares y ya ocupa foro, almacén, mercado, templo, cuartel, establo, puerto y herrería. La Escuela necesita un solar.
- 30 plebeyos cuestan 10,5 oro/mes (12,9 en Edad II) y 30 reclutas de los 237 posibles (el 13 %) justo cuando hace falta ejército. A cambio, la Edad III baja de 38 a unos 21 meses.
- Sacrificar el establo da el solar pero se acaban los équites. Sacrificar la Escuela deja el árbol a ritmo ×1.
- Otras elecciones del mismo tipo: Viña (más oro pronto) o Trigo (más grano y población, mejor tarde); Acoger (impuestos, crecimiento y un punto de héroe, con el Senado en contra) o Expulsar (felicidad y Senado a favor, algo menos de población).

## 7. Cómo se prueba

1. **Bots, salida literal (sin cambio)**: guardar antes de empezar la salida actual de `node test/sim.test.js` y compararla **línea por línea**. Línea base medida hoy:
   - Bot pasivo: `d145 d217 d145 d145 d217 d145 d215 d145 d145 d145`
   - Bot agresivo: `V237 V206 V236 V233 V248 V240 V202 V237 V206 V233`
   Las dos líneas deben salir idénticas. Esta comparación es obligatoria en I5, I5b e I5c (el umbral «agresivo al menos 6/10» no basta: dejaría pasar una caída silenciosa desde 10/10). Añadir `escuela` a la lista de exclusión del bot (`sim.test.js`, línea ~275).
2. **Contadores que cambian a propósito**: edificios urbanos 12 a 13 en `sim.test.js` y `ciudad.test.mjs` líneas ~47-51 (17 piezas, 13 `bid`).
3. **Reglas** (`test/saber.test.mjs`, nuevo y rápido): cada requisito (Medicina: abre con año 219 o con 5 ciudades, probar los dos lados); cada exclusión (el gemelo queda cerrado); pago al empezar; escala por `pm` (tabla 4.6, con `pm` por debajo de 470 la escala es 1; el cap 0,8 × `G.cap()`); Eureka (ritmo ×4/3 mientras se posee la ciudad y vuelve a 1 al perderla, sin tocar `P`); caída `{o:[...]}` con una región sin Siracusa; subida de edad que ocupa la cola; efectos de una sola vez (`pts` de Perseo y Acoger no se repiten al cargar); `G.invMul` y `G.invSum` con los 22 saberes forzados nunca pasan de los techos de la ciencia; `G.techoFinal` con todos los bienes y tipos de ciudad apilados nunca pasa del techo final salvo cuando ya lo pasaba sin ciencia; caché invalidada al completar.
4. **Medir `G.prod` con y sin cada mejora** (un bucle sobre `D.INVEST`): para cada `ef`, dos partidas iguales, una sin y otra con el saber, y se compara el campo que toca. `grano` y `hambre` en `G.prod`/`G.tick`; `oroCom` e `impuestos` en `G.cuentas`; `crece` en el crecimiento; **`viajeMar` y `viajeTierra` en `G.travel`, probando `G.turnos = true` y `G.turnos = false`** (un trayecto de 6 meses pasa a 3, uno de 3 se queda en 3, uno de 9 con Quinque y Remeros pasa a 3); `popCap` en `G.popCap`; `paga` en `G.mantenimiento`; `instr` en `G.trainDur`; `obra` en `G.buildTime`; `rutas` y `rutaRenta`; `fel`; `inqMeses` e `inqProd`; `cl` en las clases (Villa: sin manumisión; Colonos: lote a 30 oro); `mor`, `atk`, `atkMar`, `defMuro` y `brecha` en `G.battleInfo`; `herida` en `G.applyBattle`.
5. **Sabios**: un plebeyo cuesta 0,35 oro/mes con 30 sabios y 0,27 con 10 (más 6 de alta) y resta 1 de `G.recruits`; sale de `G.popEfectiva` y `G.cabezasImp`; **la paga se cobra en `G.cierreMes` y sube con el total de sabios aunque estén en ciudades distintas**; **con el oro y el almacén a cero al cerrar el mes las escuelas se vacían, el Senado ve el rojo y reabrir cuesta el alta**; la Ficha de Cuentas suma la paga; perder la ciudad pone `c.sabios` a cero; el esclavo con ánimo menor de 30 rinde 0; cambiar la dotación a mitad de una investigación acorta lo que queda; la calidad de nivel 6 y 10 sube R un 10 y un 20 %.
6. **Rival**: bot de `campaign1`, `s.inv.copia` no cambia nada; un bot con forja alta sube `copia` solo tras batallas de 60 bajas o más; cada bando aprende aparte; aliados y rebeldes excluidos; el rival copia `mor`, `atkMar` y `defMuro`.
7. **Bot investigador** (en `sim.test.js`, **4 semillas** que son las 4 primeras del agresivo): igual que el agresivo, pero levanta la Escuela, pone 30 sabios e investiga en orden fijo. Gana en 3 de 4 o más y no toma Cartago más de 10 años antes, de media, que el agresivo normal con esas mismas semillas. `sim.test.js` tarda hoy unos 142 s y `gobierno/jueces.mjs` lo corta a los 300 s: el total con el investigador y `saber.test.mjs` debe quedar bajo 240 s. Si no, el investigador pasa a un archivo propio que `jueces.mjs` llama con su límite.
8. **Partida vieja**: `test/partida-vieja.json` carga; `G.migrarInv` crea `s.inv` y `c.sabios`; la producción es exacta a la de antes; `s.forja` no cambia. **Partida nueva**: `G.newGame` también crea `s.inv` (si no, `G.invMul` lanza error).
9. **Combate** (I5c): muralla 0, 1 y 2 con `brecha`, y muralla 10, en `battle.js` y `battle3d`; Corvus solo en desembarco; regla 4.16 medida con 80 semillas por efecto.
10. **Jueces**: `node gobierno/fichas.mjs` APTO con 26 fichas nuevas; `arte.mjs` sin cambio; JSON de 18 ciudades bajo 300 KB; `node gobierno/jueces.mjs` APTO.
11. **Capturas a 390×844**: pestaña Saber (vacía, con investigación en curso, con un par bloqueado, con «No cabe en tus almacenes»), tarjeta de la Escuela, sin scroll horizontal, y toques que no se pierden al repintar.
12. **Calibración**: el script de 4.13 imprime la tabla de meses (sin y con Eureka) y se pega en el parte; también imprime el peso de la ciencia económica sobre el valor total (falla sobre 8 %).
13. **Recursión**: con una Escuela de 100 sabios esclavos, `G.prod()` en una partida nueva, en una cargada y en `G.recruits` no desborda la pila.

## 8. División en tareas

Antes de abrir cada una: `git pull --rebase`. Subir `CACHE` de `sw.js` (hoy `aqvila-v50`; al unir, el mayor más uno).

**I5 · Saber: datos, reglas, cola, edades, efectos y pantalla** (≈2,2 M)
- `D.SABER`, `D.INVEST` (22), `D.EDADES` y `afin` en `D.TIPOS`.
- Estado `s.inv = {v:1, edad:1, hechas:{id: mes}, cola:{id,p,P,t0}|null, copia:{}, rev:0, pm:0}` y `G.migrarInv(s)` en `cargar()` junto a `G.migrarCaja` **y también en `G.newGame` junto a `G.migrarSenado`**.
- `G.invReq`, `G.invUp`, `G.edadUp`, `G.escala` (por `pm`, con el cap de almacén), Eureka (ritmo por tick), `G.faltaInv`, `G.invMul` y `G.invSum` con techos de la ciencia y caché; `G.techoFinal` en cada punto donde se multiplica un campo; tercera fuente en `G.bonoMul` y `G.bonoSum`.
- **Primer paso: `G.K()`**, que devuelve `D.CLASES` con las sustituciones de Villa y Colonos. Reemplaza las 12 lecturas de `D.CLASES` y se prueba antes de añadir saberes.
- Ganchos de economía: `grano` (`G.prod`), `hambre` (`G.tick`), `popCap`, `viajeTierra` y `viajeMar` en meses (`G.travel`), `rutas` y `rutaRenta`, `sinBien` (`G.faltaEspecial`), `inqMeses` e `inqProd`, `pts` del héroe, `G.favorAplica`. Actualizar `s.inv.pm` en `G.cierreMes`.
- Ritmo provisional `G.saberVel() = 1`. Pantalla «Saber» (sin Escuela). 22 + 3 fichas en `registro.js`.
- Pruebas 1, 3, 4 (economía y viajes), 8 y 13.

**I5b · Escuela y sabios** (≈1,8 M)
- `D.BUILD.escuela`, `EDIF.escuela`, ficha de edificio (arte `sin`), `G.sabiosDe(c, gOk)` con salida inmediata, `c.sabios`, lectura en `G.popEfectiva`, `G.cabezasImp` y `G.recruits`; `G.pagaSabios(gOk)` y cobro en `G.cierreMes` (4.15) con `rojo`; alta; `p.sabios` en `G.prod` y línea en `G.cuentas`; ritmo `vel` con `cal`; afinidad de tipos.
- Tarjeta de Escuela con presets, línea viva y aviso de ociosos. Restablecer `c.sabios` en `soltarCiudad` y `rebelion`.
- **Script de calibración** `tools/calibra-saber.mjs` (criterio de aceptación 4.13 y peso económico 4.8). Pruebas 2, 5, 7, 11 y 12.

**I5c · Combate y rival** (≈1,2 M)
- Ganchos en `G.battleInfo`: `mor`, `atk`, `atkMar`, `defMuro`, `brecha` (solo `cfg.wall`). `herida` en `G.applyBattle`.
- `s.inv.copia` por bando y su actualización por batalla (mínimo de bajas); aplicación a `foe.atkMul`, `foe.defMul` y `foe.moral` con aliados y rebeldes excluidos.
- Medida de la regla 4.16 y ajuste de constantes. Pruebas 6 y 9.

**I5d · Reformar, afinado y cotejo** (≈1,0 M, **opcional**; solo tras jugarlo)
- Reformar un par: paga el coste completo del gemelo (con la escala de ese día), tarda sus meses, deja la casilla vacía mientras estudia, Senado -3 y enfriamiento de 24 meses.
- Afinar `D.SABER` con la medida real. Tarea H pequeña: cotejar las citas «probable» con la skill `historia` y subir a «histórico» solo lo que se sostenga.
- Si la paga de las tropas se arregla (pregunta al usuario), va aquí o en una tarea propia.

**Orden**: I5, I5b, I5c, después I5d si hace falta. **No abrir I5 a la vez que I6, CN4, Q4b ni CN10** (tocan `game.js`, `data.js`, `ui.js` y `registro.js`). **Dependencias**: CN2 (hecha). Q7 (hecha). CN4 no hace falta: la Escuela se pinta junto a la herrería y CN4 la moverá. CN10 no choca: ningún requisito usa lo que retira. CN6 podría cambiar los servicios del barrio: solo se pide barrio 2.

**Total**: ≈5,2 M sin I5d (≈6,2 M con ella). La primera versión decía 4,6 M; los 0,6 M de más son el precio por producción, los techos del resultado final, el cobro mensual real de la paga, la copia por bando con moral y murallas, y los viajes en meses.

## 9. Riesgos

1. **Los campos no muerden.** La producción casi no baja. La paga ya sube con el total de sabios; si aun así se queda corta tras CN4, Q4b o Q7, subir `pagaPle` de 0,20 a 0,30 y `pagaCiu` de 0,45 a 0,60, o bajar el divisor 50 a 40. Son números de `D.SABER`.
2. **Nada está medido en partida.** Todo es cálculo de papel (aunque las cifras de producción y combate vienen de medidas del bot). Por eso el script de calibración es condición de entrega.
3. **Choque de archivos.** `data.js`, `game.js`, `ui.js` y `registro.js` los tocan I6, CN4, Q4b, CN10 y J4. Ganchos de una línea, `git pull --rebase`.
4. **`G.K()` sustituye 12 lecturas** que Q6 y CN6 también tocan. Va primero y con su prueba.
5. **Recursión.** Toda función nueva que `G.prod` use recibe `gOk`. Prueba 13.
6. **Batalla.** `brecha` baja `cfg.wall` en 1 y `defMuro` suma a la defensa. Probar muralla 0, 1, 2 y 10. Nunca tocar `c.b.muralla` (lo leen los vigiles y `G.botin`). Si `battle.js` no acepta el valor, cambiar `brecha` por un `atkMul` contra ciudades con muralla.
7. **Citas escritas de memoria.** Solo Polibio 1.20-23, 6.21-23 y 8.5-8, y Plutarco Marcelo 15-17, están cotejadas en el repo. El resto va como «probable» y el Códice dice «según X». Ninguna ficha puede quedar «por cotejar» con texto. Tarea H del cotejo en I5d.
8. **Niveles de `c.b`.** Saltan 0, 1, 3, 6, 10. Los requisitos usan esos valores. Comprobar cómo `CN2` deriva `c.b` cuando hay varias piezas del mismo tipo (CN4 las acotará).
9. **El bot se come la Escuela.** Si `escuela` no está en la exclusión de `sim.test.js`, el bot la intenta, `G.faltaInv` la rechaza y el 10/10 cae.
10. **Regiones (I6).** Los requisitos nombran ciudades: Siracusa, Tarento, Agrigento, Panormus, Lilybaeum, Cartago y Pella existen hoy. Si una región no las incluye, `{o:[...]}` cae a ciudades 6 o 7 (Medicina: 5). Probar en una región con 6 a 8 ciudades.
11. **Interfaz a 390 px.** Pares de unos 170 px, 4 chips y detalle en línea. La barra necesita recalcular al tocar la dotación o al ganar/perder una ciudad Eureka, o el tiempo mostrado miente. Verificar con captura.
12. **Rendimiento.** `G.prod` se llama muchas veces. `G.invMul` no recorre el árbol: caché por `(hechas, rev)`. `G.pagaSabios` se cachea por la dotación.
13. **Pagos de golpe.** El precio sube con la producción; el cap de 0,8 × `G.cap()` evita lo imposible. Si estorba, usar los plazos de Q4 en I5d.
14. **Efecto de una sola vez** (`pts` de Perseo y Acoger): ejecutar al completar y marcar en `hechas`, no dentro de `G.invMul`.
15. **Los pares son permanentes.** Quien se arrepienta no puede volver: por eso Reformar queda como tarea opcional.
16. **El rival copia sobre todo bando con nombre**, incluidos aliados que luego se rebelan. Excluir aliados y probar la rebelión.
17. **Medicina sin fecha dura.** La condición es `{o:[{y:219},{ciudades:5}]}`; `G.yearOf` baja con el tiempo, así que `año <= 219`. Probar los dos lados y que sin año y con 5 ciudades abre.
18. **Un solo bot investigador con 4 semillas** (los tres bots de D3 no entran). Controlar el tiempo total de los tests (prueba 7).
19. **Techos finales contra bienes futuros.** Si se añade un bien nuevo que toca los mismos campos, entra en `G.techoFinal` sin tocar nada más; la prueba 3 lo vigila.
20. **`pm` recién migrado.** En una partida vieja `pm` arranca con la producción del momento (llamar a `G.migrarInv` después de fijar `G.state`); si arrancara en 0, el precio sería la base durante varios meses.
21. **Semillas y repro del bot.** Cualquier gancho nuevo que llame a `Math.random` rompe la comparación literal de la prueba 1.

## 10. Trampas halladas y cómo se cerraron

Resumen: la revisión encontró 13 trampas. Se cierran todas. Los cambios están repartidos por todo el estudio; aquí va dónde.

| N.º | La trampa | Cómo se cerró | Dónde |
|---|---|---|---|
| 1 | `G.sabiosDe` leía el ánimo del esclavo sin `gOk`: `G.prod` → `G.mantenimiento` → `G.sabiosDe` → `G.animoClases` → `G.prod`, pila infinita en la primera `G.prod()`. Además `G.newGame` no creaba `s.inv`. | `G.sabiosDe(c, gOk)` con salida inmediata si no hay sabios; solo los esclavos tocan el ánimo, y con el `gOk` recibido. La paga ya no pasa por `G.mantenimiento`. `G.migrarInv` también en `G.newGame`. Prueba 13 y prueba 8. | 2.3, 4.15, 7, 8 |
| 2 | La calibración 4.13 era imposible: Medicina pedía año 219 (mes 732) y está en el camino; el árbol no podía cerrar antes del mes 749 y la Escuela solo adelantaba 21 meses. Con las Eureka a la mitad, el caso de R = 60 cerraba hacia el mes 248. | Medicina deja de depender solo del año: abre con año 219 o con 5 ciudades. Se calibra sin saberes fechados. Eureka pasa de ×0,5 a ×0,75 y se cuenta en la tabla (sin y con Eureka). El script exige solo lo medible. | Medicina en 3, 4.13, 0 |
| 3 | Los costes no frenaban nada: el árbol era el 2 % de la producción del bot y el oro se compra con materiales. | Precio por producción: `escala = pm / 470`, sin tope; el árbol cuesta unos 39 meses de producción repartidos. Cap de almacén para que nunca sea imposible. Magón abaratado para que no sea un saber sin retorno. | 4.6, 3 |
| 4 | Con el oro siempre a cero, los sabios no costaban paga (el déficit desaparece en `G.tick`). | La paga es un plazo que se cobra en `G.cierreMes`; si no alcanza, los sabios se van a casa, hay "rojo" para el Senado y reabrir cuesta el alta. | 4.15, 2.4 |
| 5 | Escuelas pequeñas en ciudades secundarias o conquistadas y mejoras II/III inútiles. | La paga unitaria se multiplica por (1 + S/50) con S = sabios totales del imperio: sin ahorro por repartir. Las mejoras II y III dan +10 % y +20 % de calidad por sabio además del aforo. | 2.2, 2.4, 2.5, 4.5 |
| 6 | El rival solo copiaba armas y armaduras (Pilum). Moral, Corvus, murallas no se copiaban; la copia se saturaba en 7 a 19 batallas y era global; el "premio al ataque relámpago" no existía. | Copia por bando, +0,15 por batalla de al menos 60 bajas, e incluye moral, `atkMar` y `defMuro`. Techo de moral +4. Regla de calibración: ningún saber mueve la victoria más de 10 puntos. | 5, 4.8, 4.16 |
| 7 | Campo era una máquina de oro: Trigo siempre ganaba a Viña y Magón con el techo de grano valía más que cualquier bono en oro. | Techo de grano ×1,08 (Trigo 1,05, Magón 1,03), Viña con oroCom ×1,25 e impuestos ×1,08 sin penalizar el grano. Los techos se miden en oro equivalente y el script falla sobre el 8 % del valor total. Resultado: Viña gana pronto, Trigo gana tarde. | 3, 4.8 |
| 8 | Expulsar mejor que Acoger en todo. | Expulsar pierde paga y moral (se quedan en Castra) y baja el crecimiento un 4 %. Acoger sube a impuestos ×1,08 y suma un punto de héroe. Se aplicaron las dos mitades de la corrección. | 3 |
| 9 | Colonos ganaba a Villa en cualquier ciudad. | Villa: 60 % de esclavos, 0,20 oro por esclavo, sin manumisión. Nuevo ejemplo con una ciudad conquistada de 150 habitantes. | 3, 6 |
| 10 | Eureka a la mitad, fijado al empezar, regalaba 19 % del árbol y sobrevivía a perder la ciudad. | Eureka ×4/3 de ritmo (tiempo ×0,75) calculado en cada tick mientras posees la ciudad; `P` no cambia. | 2.5, 3, 4.13 |
| 11 | En modo turnos, `llegada()` redondea a múltiplos de 3 meses y los recortes de 3 a 15 % de viaje casi nunca se ven; el bot (tiempo continuo) sí los notaría. | Los efectos de viaje pasan a meses: «resta 3 meses a los trayectos de más de 3, mínimo 3». Quinque y Remeros se suman (techo del mar: -6); Apio da -3 en tierra. Astilleros pierde su `viajeMar` y conserva su efecto sobre el puerto. Pruebas con `G.turnos` verdadero y falso. | 3, 4.8, 7 |
| 12 | Los techos 4.8 solo valían para la parte de ciencia; Sal, Plata, Pieles y los tipos se apilaban por encima. | Segundo techo sobre el resultado final con todas las fuentes (`G.techoFinal`), con la regla de no quitar nunca lo que ya daba el juego. | 4.8 |
| 13 | Los tests se pasaban de tiempo (142 s hoy, límite de 300 s en `jueces.mjs`) y el umbral 6/10 ocultaba una regresión del bot normal. | Bot investigador con 4 semillas; presupuesto de 240 s; comparación literal de las dos líneas base como prueba obligatoria de I5. | 7 |

**Interpretaciones que tomé** (por si no coinciden con lo que se quiso):
- Trampa 8: la revisión daba dos arreglos con «o»; apliqué los dos porque Expulsar era claramente mejor y bastaba uno para empatar pero dos lo dejan elegible.
- Trampa 11: «techo -1 turno» lo apliqué como -1 turno en tierra y -2 en mar (Quinque y Remeros se acumulan) para que Remeros no quede vacío.
- Trampa 5: el divisor 50 de (1 + S/50) sale de la revisión; vive en `D.SABER` para tocarlo sin código.
- Ajustes de coherencia por mi cuenta: Corvus pasa a ×1,07 para que con Pilum quepa justo en el techo ×1,10; Magón baja de precio y gana `hambre`; el techo de impuestos de la ciencia sube a ×1,12 para no anular a Acoger cuando se combina con Viña.

**Fuera de este estudio**: la paga de las tropas tiene el mismo agujero (con oro y almacén a cero, 252 oro/mes se evaporan en la campaña del bot). No se toca aquí porque cambiaría los resultados de los bots; queda como pregunta al usuario.
