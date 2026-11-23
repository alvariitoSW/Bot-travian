# Corazón · Estudio de la lucha a pie, antes de construir (TP9-0, 20–23/11/2026)

**Qué es esta página.** El estudio que pidió el usuario antes de tocar nada (literal, 20/11): «antes de hacer nada hagan un
estudio de cómo está el juego en eso, cuál es el objetivo final exacto, y qué habría que hacer para llevarlo a cabo de manera
impresionantemente artística y perfecta». Sirve a **L11** y **L17**. No cambia el objetivo aprobado
(`TP9-objetivo-lucha-a-pie.md`, que manda): lo mide contra el juego de hoy, lo vuelve exacto y afina el reparto.
**Estado: BORRADOR.** Lo aprueba o corrige el usuario; hasta entonces no se construye nada.

**En cuatro frases.** (1) La pantalla en blanco del pilum es **un fallo de código**, no el móvil: se arregla en una tarea
pequeña. (2) La lucha «es pulsar botones» porque está hecha así: ocho botones, un golpe que bloquea 1,2 s y un anillo que
manda. (3) Para que sea impresionante hay que construirla con **el soldado nuevo** (el de «Bajar a pie»), no con los
muñecos de las maquetas: es lo único que permite gestos de verdad, cuatro galos distintos y «una sola pieza». (4) Cuesta más
de lo previsto (≈11 M declarados, esperable 13–15 M, frente a 6,4 M): abajo se dice por qué y la alternativa barata.

## 1. Cómo está hoy (medido el 20/11; capturas `gobierno/capturas-tarea/TP9-0-*.jpg`)

### 1.1 La pantalla en blanco al lanzar el pilum: causa demostrada
- **Qué se ve** (`TP9-0-testudo-pilum-h.jpg`): desaparece toda la escena y queda el color de la bruma, con los botones
  encima. Dura **1,2 s**, lo que vuela el pilum. Pasa en **las dos salvas**, no solo la primera.
- **Causa**: `maquetas/a-pie/escena.js:455` guarda los cuerpos lejanos con el nombre `L`, y ese nombre ya era la fila donde
  empiezan las posturas de lanzar. `acciones.js:35` suma sobre él y obtiene un número imposible. De ahí: la mano no tiene
  posición, el pilum tampoco, y la cámara, que sigue al pilum, se pierde. Con la cámara perdida no se pinta nada.
- **Prueba**: devolviendo a `L` su valor desde el navegador (sin tocar archivos), el blanco desaparece y la cámara sigue al
  pilum. Entró con TP8b («más gente», commit `0707d4e`).
- **Descartado**: no es que el móvil prepare efectos (solo aparece 1 programa nuevo, y más tarde); no hay destello en la
  interfaz; no se crea nada al lanzar. **La causa escrita en TP9 §9 («compila efectos») era errónea.**
- **Daño añadido del mismo fallo**: los pila de las dos primeras filas no se ven volar y esos hombres no hacen el gesto.

### 1.2 Testudo a pie, la lucha (`TP9-0-testudo-lucha-h.jpg`, `-v.jpg`, `-anillo-h.jpg`, `-fin-h.jpg`)
| Qué | Hoy | Vara de TP9 |
|---|---|---|
| Botones en plena lucha | **8** (Parar, Estocada, Empujar y cuatro órdenes, más Salir); tapan ≈30 % en horizontal | Ninguno de golpe (§6-2) |
| Encadenar golpes | **No se puede**: la estocada ocupa 1,19 s y rechaza toques («Ya golpeas»); Parar, cada 0,75 s | El segundo golpe empieza antes de acabar el primero (§6-3) |
| Respuesta al toque | 2 fotogramas (0,10 s de juego): **bien** | Menos de 100 ms |
| Quién marca el ritmo | El anillo rojo: 15–20 toques por minuto cuando él dice | Tú lees el cuerpo del enemigo (§3) |
| Moverte en la fila | No hay palanca en la lucha; el rival te lo pone el juego | Palanca: eliges a quién (§3) |
| Compañeros | Sostienen el escudo; pelean «por parejas» sin relación contigo | Rematan lo que tú abres (§6-5) |
| Enemigos | **Un solo galo, clonado**: misma cara, escudo y túnica; cambia el golpe (tajo, rápido, finta), no la figura | 4 tipos que se reconocen por la silueta (§6-7) |
| Peligro | Heridas 1 a 3 y relevo; nadie te rodea; el escudo no se rompe en la lucha | Te rodean, escudo roto, retirada (§6-6) |
| Racha y momento épico | No hay | Arco, plano corto y grito (§6-8) |
| Aviso del golpe | Dos aros rojos y un triángulo amarillo **encima** del mundo | Lo avisa el cuerpo del enemigo |
| Llamadas de dibujo | 37–41 en la lucha; **69 con el anillo** | ≤ 30 (§6-11) |
| Triángulos | 616 mil, iguales en todas las fases | ≤ 750 mil |
| Tarjeta final | Dice «33 de 16 galos» y «Derrota» mientras arriba pone «ganando» | — (dos fallos) |

**Lo que ya vale**: la luz de tarde, la bruma, el polvo y el campo; la cámara sobre el hombro en vertical (tu centurión y
su galo, grandes y al centro); la pausa y el tirón al herir; las reglas de fondo (aliento, finta, heridas, relevo).
**Lo que se ve falso**: muñecos de 0 A.D. sin cara ni cota, todos iguales; la espada es una pieza pegada a la mano; el
golpe es un tajo genérico, no una estocada de gladio; sin sangre ni chispas visibles en la foto; no hay ninguna voz.

### 1.3 Falange a pie (`TP9-0-falange-lucha-h.jpg`, `-v.jpg`, `-marcha-v.jpg`, `-salva-h.jpg`, `-flanco-h.jpg`)
- **Se ve mejor que el testudo**: cámara sobre los cascos, 4–5 hileras de puntas de madera clara, romanos legibles.
- **Se juega como un ritmo con instrucciones**: cinco botones (Golpe, Empujad, Alzar picas, Aguantar, Avanzar) y un consejo
  que dice siempre cuál tocar. Es una prueba de reflejos; no decides nada.
- **El flanco no existe en la escena**: es un cartel rojo que tapa un quinto de la pantalla. No entra ningún romano por ahí.
- **El muro no puede girar**: formación, sarisas, choque y cámara están clavados mirando al frente. Girarlo es obra nueva.
- **Las picas alzadas** son postes rectos y paralelos, como barrotes; no hacen abanico. La salva apenas se ve (rayas finas).
- **No se ven caídos** delante del muro. Dos textos flotan en mitad de la escena.
- Peso: **24 llamadas** y 609 mil triángulos (cumple). No eres el oficial: nadie se distingue en la fila.

### 1.4 «Bajar a pie» en la batalla grande (`TP9-0-bajar-hombro-h.jpg`; duelo: `CG6b-2-duelo-h.jpg`)
- **Los soldados son otros y mejores**: el soldado nuevo, con cota de malla, cuerpo proporcionado y cuatro niveles de detalle.
- **La lucha es peor**: cuatro botones (Golpear, Parar, Empujar, Pilum) y cuatro órdenes; el rival queda **detrás de tu primera
  fila** y mide ≈8 % del alto de la pantalla; el aro rojo flota sobre un hombre diminuto. Los compañeros, quietos de espaldas.
- **Qué comparte con la maqueta**: solo las reglas (están copiadas a mano en `js/simulador.js:700-757`). Soldados, esqueleto,
  cámara, campo y luz son distintos. Las bajas suben como un recuento suelto (`Sim.apie(S, id, {mata|heridas|cae})`), con tope del 30 %.
- Peso: 25 llamadas y 690 mil triángulos al hombro.

### 1.5 Lo que NO se pudo medir (se dice claro)
- **La fluidez real**: aquí se pinta sin tarjeta gráfica (0,4 imágenes por segundo); las cifras de tiempo no valen. Solo
  valen llamadas, triángulos y programas. La fluidez solo la mide **el móvil del usuario**: TP9a añade un medidor en pantalla.
- El duelo de «Bajar a pie» con captura propia (no se logró provocarlo; se usa la de CG6b) y si allí hay parón al lanzar.

### 1.6 Con qué arte contamos
| | Muñecos de las maquetas (0 A.D.) | Soldado nuevo (ya en «Bajar a pie») |
|---|---|---|
| Huesos | 27–29; dos por mano | **74, con dedos** |
| Movimientos | 6 clips y posturas por código | 11 (quieto ×3, andar, correr, guardia, lanzar, golpear, cubrirse, encajar, morir) |
| De dónde salen más | Habría que convertir más de 0 A.D. (CC BY-SA) | Biblioteca de Quaternius (**CC0**), la misma de hoy |
| Equipo | Fijo en el modelo | **Hecho por código, por piezas**: torques, melena, bigote, lanza, espada, vaina, escudo |
| Galos distintos | 1 | 1 hoy; con las piezas salen 4 siluetas sin arte ajeno |
| Triángulos de cerca | ≈2 mil | ≈14 mil (tope aprobado: 40 de cerca) |
- **Sonido**: todo sintetizado; el usuario dijo que «no convence». GM43i grabó 36 sonidos CC0 pero no los ha subido. **No hay voces.**
- **Dedos**: no existe ningún gesto de lucha; la única palanca es la de «Bajar a pie» (`js/ui-mando.js:548-555`).
- **Descarga**: 43,6 MB de arte sobre un tope de 50. Quedan unos 6 MB para movimientos y sonido nuevos.

## 2. El objetivo final exacto, pieza a pieza
Lo de TP9 §3–§4, bajado a cifras que un constructor puede cumplir y un juez medir. Los números son de partida: se ajustan
jugando, pero cada pieza se entrega con su vara.

### 2.1 Tus dedos (horizontal manda; en vertical, lo mismo con los pulgares abajo)
| Gesto | Cómo lo reconoce | Qué hace | Vara |
|---|---|---|---|
| Tocar (derecha) | menos de 180 ms y de 12 px | Estocada | Arranca en ≤ 1 fotograma |
| Deslizar a un lado | más de 28 px en menos de 250 ms | Tajo por ese lado | Entra solo si su escudo está al otro lado |
| Deslizar hacia delante | igual, hacia arriba en pantalla | Empujón con el umbo | Lo desequilibra **hacia el compañero más cercano** |
| Mantener | más de 180 ms sin moverse | Escudo arriba mientras dure | Alzarlo ≤ 0,25 s antes del golpe = «parada limpia»: lo abre 1,4 s |
| Palanca (izquierda) | aparece donde cae el pulgar | Paso lateral de 0,9 m en 0,25 s; adelante presiona; atrás cede; dos atrás en 0,8 s = retirada | Cambiar de rival: menos de 0,4 s |
| Tocar el estandarte | arriba, al centro | El tiempo va a un tercio y se abren cuatro órdenes | Elegir y cerrar en un toque |
- **Encadenar**: cada golpe tiene anticipo (60 ms), golpe (90 ms) y recobro (200 ms). El siguiente gesto se guarda si llega
  en los últimos 250 ms y **corta el recobro**. Tres seguidos como mucho; el tercero pesa más y te deja abierto.
- **Aporrear pierde**: golpe contra guardia cerrada rebota (chispa, 0,4 s perdidos y aliento); al tercero, contraataque.
- **El escudo tiene vida**: seis golpes fuertes. A la mitad se raja (se ve y suena); roto, solo desvías con la espada.

### 2.2 Lo que lees: el enemigo avisa con el cuerpo
- Cada galo lleva la guardia en un lado (se ve dónde tiene el escudo) y **arma el golpe con el cuerpo**: brazo atrás, peso al
  pie de atrás. No hay aros. Ayuda discreta: un brillo en el filo durante el anticipo; se puede apagar.
- Tiempos de anticipo por tipo: grande 0,95 s · rápido 0,4 s ×2 · el que finta 0,95 + 0,5 s · jefe, mezcla de los tres.

### 2.3 Tu fila
- Tienes un compañero a cada lado, con nombre (Tito, Marco, Lucio, Cayo). Cada uno pelea con el suyo.
- **Remate**: enemigo desequilibrado hacia un compañero → lo remata en ≤ 0,8 s y sale «¡Bien, Tito!». Vara: 3 o más por minuto del bot bueno.
- **Hueco**: la línea enemiga son puestos. Dos caídos en diez segundos a tres puestos de ti abren un hueco **ahí**; tus hombres
  entran y esa parte de su línea recula 2 m. Vara: el hueco sale donde peleó el bot (captura).
- **Lo que haces sube**: cada caído resta al manípulo enemigo y a su ánimo, como hoy.

### 2.4 El peligro
- Un paso por delante de tu fila más de 4 s: dos galos te entran por los lados. Se marcan en los **bordes de la pantalla**.
  El escudo no para lo que viene de lado: solo sirve retroceder.
- **Retirada**: dos tirones atrás; otro ocupa tu sitio en 0,8 s; en segunda fila el aliento vuelve tres veces más deprisa.
  Las heridas no se curan. Vuelves empujando la palanca adelante.
- Tres heridas y caes: pasas a ser el hombre que te releva (como hoy). Bot «quieto delante»: cae antes de 25 s.

### 2.5 Cuatro galos (historia: ver §2.9)
| Tipo | Se reconoce por | Pelea |
|---|---|---|
| **El grande** | Más alto (+12 %), torso desnudo, espada larga a dos tiempos | Tajo lento y fuerte; quita dos golpes de vida al escudo |
| **El rápido** | Joven, escudo pequeño, espada corta | Dos golpes seguidos; cae de un tajo bien puesto |
| **El que finta** | Veterano, lanza y escudo largo | Amaga a un lado y pega por el otro |
| **El jefe** | Casco con cimera, cota de malla, torques de oro, capa; dos guardias | Mezcla de los tres; al caer, su línea duda 5 s |

### 2.6 Racha y momento épico
- Arco junto a tu cresta. Golpe limpio +1, parada limpia +2, remate +3; llena a 12; recibir un golpe quita 3.
- Llena, el estandarte ofrece **«¡Cargad!»** o **«¡Pila!»**. Secuencia de 2,5 s: tiempo a un tercio, plano corto de tu
  centurión alzando el gladio, la voz escrita y el grito de todos, y la ola: la línea avanza 3 m y caen de 4 a 6. Vara: el bot bueno la llena en menos de 60 s.

### 2.7 Falange: el oficial en la fila
| Pieza | Exacto | Vara |
|---|---|---|
| Quién eres | El jefe de fila, con penacho distinto, en el centro de la primera | Se te distingue en la captura |
| Compás | Latido cada 1,6 s. Toque a ±0,2 s: el muro avanza medio metro. A destiempo: Cohesión −8 | A compás gana 15 m; a destiempo retrocede |
| Cómo se ve el compás | **En el muro, no en un botón**: las puntas se recogen un palmo antes del «¡Ha!»; suena un golpe sordo | Sin botón «Golpe» |
| Girar | Arrastrar: el muro entero gira a 8° por segundo (formación, picas y cámara) | Con 8 s de aviso se llega a encarar 60° |
| Filas | Esquema de cinco rayas junto al pulgar izquierdo; tocar una la baja o la alza | Bajadas ensartan y cansan; alzadas paran 6 de cada 10 pila |
| El flanco | **Entra de verdad** un manípulo romano por el lado; aviso en el borde, sin cartel | Girando a tiempo se para; sin girar, rompe |
| Abanico de astas | Las filas de atrás inclinan las astas escalonadas, cada una a su ritmo | Se ve abanico en la captura de marcha |
| Caídos | Se quedan delante del muro | Se ven en la captura de lucha |

### 2.8 La pantalla
Solo cuatro cosas: el objetivo en una línea, el estandarte, el arco de la racha y dos huellas tenues que se borran a los 3 s.
Heridas: tres marcas junto a la cresta y los bordes de la pantalla que se oscurecen. Aliento: una raya fina bajo la cresta.
Las respuestas («¡Parado!», «¡Buen golpe!») salen pequeñas junto al rival, no en el centro.

### 2.9 Historia (dictamen del estudio: APTO CON NOTAS; se mantiene TP9 §8 y se añade)
- **El grande con hacha**, como decía TP9 §3: no tengo fuente de hachas galas en batalla. Propongo **espada larga de tajo**
  y torso desnudo: los gesatas pelearon desnudos en primera fila en Telamón, y la espada gala solo cortaba y se doblaba
  (Polibio 2.28–33). El hacha, si el usuario la quiere, iría como **licencia de juego**.
- **El jefe**: torques y brazaletes de oro en las primeras filas (Polibio 2.29); cascos con cimera y cotas de hierro entre los
  nobles (Diodoro 5.30); el duelo con el galo del torques (Livio 7.10, de 361 a.C., fuera de época: sirve para el Códice).
- **Nombres de los compañeros**: praenomina corrientes: **histórico**.
- Estos pasajes están citados de memoria: **TP9e los comprueba con la skill `historia`** antes de dibujar nada.

### 2.10 Peso (para todas las piezas)
Llamadas de dibujo ≤ 30 en plena lucha (hoy 37–69) · triángulos ≤ 750 mil · como mucho 40 soldados de cerca · ningún
programa nuevo después de la carga · y en el móvil del usuario, con el medidor: **30 imágenes por segundo o más y ningún
fotograma de más de 100 ms**.

## 3. Qué hay que hacer para que sea impresionante
### 3.1 La decisión de fondo: con qué soldado se construye
**Recomiendo el soldado nuevo desde el primer día.** Con los muñecos de las maquetas no se llega: no tienen dedos, hay un
solo galo, cada gesto habría que inventarlo a mano y luego rehacerlo al cambiar de soldado (eso es una tirita, REF §0).
Con el soldado nuevo: los gestos salen de una biblioteca libre, los cuatro galos salen de piezas hechas por código y la
lucha es **de verdad la misma** en la prueba rápida y en «Bajar a pie», porque son los mismos hombres.
**Consecuencia**: la lucha se construye en una prueba rápida nueva, **«Lucha a pie»** (empieza en el choque, con la luz y el
campo del testudo, que ya valen), no dentro del archivo de 129 KB del testudo. Al final se enlaza: «Testudo a pie» marcha,
lanza y carga como hoy, y al chocar pasa por corte de cine a la lucha nueva.

### 3.2 Pieza a pieza
| Oficio | Qué hay que hacer | De dónde sale |
|---|---|---|
| **Animación** | Un gesto propio por acción: estocada baja de gladio, tajo a cada lado, escudo arriba que **se sostiene**, empujón de umbo, paso lateral, ceder, tambalearse, encajar, caer de tres maneras, rematar, huir. Mezcla de tres capas (piernas, torso, brazo) para golpear mientras te mueves. Cada golpe **llega a algo** y quien lo recibe reacciona en el mismo fotograma | Biblioteca de Quaternius, CC0 (ya es la del soldado nuevo); lo que falte, posturas por código sobre sus 74 huesos |
| **Cámara** | Sobre el hombro derecho, baja (1,7 m), pegada: el rival ocupa **40 % o más del alto**; se ve tu centurión de cintura arriba y un compañero a cada lado. Se inclina con la palanca. Plano corto en la orden y en el momento épico. Nunca corta sin motivo | Código; base en la cámara de duelo de hoy |
| **Impacto** | Pausa de 60–90 ms en cada golpe que entra; sacudida corta; chispa en el umbo; astillas; sangre que **mancha el suelo y se queda**; polvo en cada paso; escudo con tres estados (entero, rajado, roto); los caídos se quedan | Código; texturas propias |
| **Luz** | Sol bajo de lado y a contraluz (como REF: polvo naranja que separa planos); una sola sombra; bordes de pantalla que se oscurecen al herirte. Sin efectos de cine a pantalla completa | Lo que ya tiene la maqueta |
| **Sonido** | Por capas: madera, hierro, carne, jadeo, pasos; el latido cuando te rodean; el coro en la carga; bajo el escudo se oye sordo | Los 36 sonidos CC0 de GM43i (pendientes de subir) y los que falten, CC0 o CC BY con crédito (skill `arte`) |
| **Interfaz** | §2.8: casi nada en pantalla; todo lo demás lo dice el mundo | Código y estilos |

### 3.3 Lo que un móvil no da (se dice y no se promete)
| No habrá | En su lugar |
|---|---|
| Caras con expresión, bocas que gritan | Cascos, crestas, barbas y cuerpos distintos; la voz, escrita y en coro |
| Muertes «casadas» hombre a hombre, como en el cine | Golpe que llega, reacción en el mismo fotograma y caída de tres tipos |
| Cientos de hombres con detalle | 40 de cerca con todo; el resto, sencillos; el fondo, bloques |
| Destellos, desenfoque y brillo de cine | Polvo, contraluz y bordes oscuros, que no cuestan |
| Voces en latín grabadas con licencia libre (no cuento con encontrarlas) | Gritos sin palabras, en coro, y la palabra escrita. Si el usuario quiere, graba él seis voces con el móvil |
| Vibración en iPhone (el navegador no la da) | En Android, sí; en iPhone, pausa y sacudida |
| Dos manos agarrando la sarisa con precisión | Agarre aproximado; no se nota desde la cámara alta |
| Certeza de fluidez desde aquí | El medidor en pantalla, en su móvil, en cada entrega |

## 4. Reparto afinado
**Qué cambia respecto a TP9 §9, y por qué**
- **TP9a** ya no «prepara efectos»: corrige el fallo. Es pequeña. Lleva además el medidor de fluidez y la tarjeta final.
- Aparece **la base** (reglas en limpio y prueba rápida con el soldado nuevo): sin ella, las demás repiten trabajo.
- **Animación e impacto** pasa a ser tarea propia: es donde vive «impresionante».
- **La falange** cuesta el doble: el muro hoy no gira y el flanco no existe.
- **El enlace** final cubre «Bajar a pie» y «Testudo a pie».
- **Ahorro medido en este estudio**: probar en el navegador de la nube es carísimo (1,1–1,5 M por medición). Por eso las
  reglas van en un archivo que corre sin pantalla (`js/lucha.js`): los bots «loco», «bueno» y «quieto» se prueban en
  segundos. El navegador, solo para las fotos, con el guion ya escrito y tope de 15 pasos.

| # | Tarea | Qué verá el usuario en su móvil | Archivos | Diseña · construye | Encargos (≤ 30 pasos) | Coste |
|---|---|---|---|---|---|---|
| 1 | **TP9a · Pilum sin blanco** | Lanzas y ves volar los pila; un medidor pequeño de fluidez; la tarjeta final dice la verdad | `maquetas/a-pie/escena.js`, `acciones.js`, `hud.js`, `sw.js` | Opus solo | 1 de 12 | ≈0,3 M |
| 2 | **TP9b · Luchar con los dedos** | Prueba rápida «Lucha a pie»: tú contra un galo, con tu fila al lado; tocar, deslizar, mantener, empujar, palanca; golpes encadenados; pantalla limpia | `js/lucha.js` (nuevo, sin pantalla), `test/lucha.test.mjs`, `gobierno/maquetas/lucha/*` (nuevo), `js/ui.js` (una entrada), `sw.js` | Fable · Opus | 2: reglas y bots (25); escena y dedos (30) | ≈2,2 M |
| 3 | **TP9c · Que pese: animación, impacto y sonido** | Cada gesto con su movimiento; pausa, chispa, sangre que se queda, escudo que se raja; sonido grabado | `tools/` (movimientos), `assets/soldados/movimientos_*`, `maquetas/lucha/*`, sonido | Fable · Opus (skill `arte`) | 2: movimientos (30); impacto y sonido (25) | ≈2,0 M |
| 4 | **TP9d · Tu fila y el peligro** | Remates con nombre, huecos donde peleas, te rodean, retirada a segunda fila | `js/lucha.js`, `maquetas/lucha/*` | Fable · Opus | 1 de 30 | ≈1,5 M |
| 5 | **TP9e · Cuatro galos, racha y momento épico** | Grande, rápido, el que finta y el jefe; arco, estandarte, plano corto y grito | `js/lucha.js`, piezas del galo por código, `maquetas/lucha/*` | Fable · Opus (skills `historia` y `arte`) | 2: galos (25); racha y cine (25) | ≈1,8 M |
| 6 | **TP9f · Falange: el oficial en la fila** | Compás en el muro, giro arrastrando, filas, flanco que entra de verdad, abanico y caídos | `js/falange.js` (reglas, nuevo), `maquetas/falange/*` | Fable · Opus | 2: giro y flanco (30); compás, filas y aspecto (30) | ≈2,2 M |
| 7 | **TP9g · La misma lucha en el juego** | En «Bajar a pie» peleas con los dedos, de cerca; «Testudo a pie» acaba en la lucha nueva | `js/ui-mando.js`, `js/simulador.js` (se quita la copia de reglas), `css/mando.css`, `maquetas/a-pie/*`, `sw.js` | Fable · Opus | 1 de 30 | ≈1,5 M |

**Total declarado ≈11,5 M; esperable 13–15 M** (los partes de TP8b y CG6b se pasaron un 23 y un 40 %; este estudio, más).
Antes: 6,4 M declarados, 8–9 esperables.

**Reglas del reparto**
- Orden fijo: a, b, c, d, e, f, g. **El usuario prueba cada una en su móvil antes de abrir la siguiente** y pone nota.
- Cada tarea empieza con media página de Fable (qué gesto, qué se ve, cómo se mide, guion de fotos) y construye Opus.
- TP9a espera a que GM43i suba (mismos archivos). TP9c necesita los sonidos de GM43i.
- TP9g toca `js/simulador.js`: nunca a la vez que CG9. Funde CG6c. TP9f absorbe el pulido de picas de TP8c.
- De TP8c quedan vivos solo «manos y pilum» y «arenga y plano ancho» del testudo, para después.
- Cada tarea cierra con jueces APTO, capturas frente a §2 y la lectura del medidor en el móvil del usuario.

**Camino barato, si el usuario lo prefiere** (no lo recomiendo): seguir con los muñecos de hoy dentro de «Testudo a pie».
≈7–8 M esperables. Se gana jugabilidad antes; no se llega a «impresionante», hay un solo galo (los otros tres serían el
mismo con otra talla y otro color) y los gestos se rehacen cuando el testudo pase al soldado nuevo.

## 5. Lo que decide el usuario
1. **Soldado**: (A) soldado nuevo y prueba rápida «Lucha a pie» **[recomendado]**; (B) muñecos de hoy dentro de «Testudo a pie».
2. **El grande**: (A) espada larga y torso desnudo, como cuentan las fuentes **[recomendado]**; (B) hacha, como licencia de juego.
3. **El reparto y su coste** (§4): aprobar, o recortar piezas.

## 6. Cuentas del estudio
Declarado 1,2 M; corte 1,8 M. Medido al escribir: ≈3,8 M (Fable ≈0,6, Opus ≈3,2). Se fue en tres mediciones con navegador
sin tarjeta gráfica. El director lo midió tarde y no avisó en 0,6 ni en 1,2 M. El usuario amplió el tope a 10 M el 23/11.
