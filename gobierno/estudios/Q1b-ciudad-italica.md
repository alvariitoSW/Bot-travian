# Q1b · Ciudad itálica 280–146 a.C.: cómo era y cómo hacerla en el juego

Estudio de historia y de aspecto. Solo ideas de otros juegos; nada de su arte ni código.
Queja del usuario: «la ciudad no me gusta, no es históricamente precisa, es finita, no hay vida».
Rumbo elegido por él: **plano itálico común**, denso e irregular, de toba y teja, que cambia por cultura.

Etiquetas (skill `historia`): `histórico` (con fuente), `probable` (reconstrucción razonada), `licencia de juego`, `sin confirmar` (no he podido cotejar el pasaje; no entra como historia hasta hacerlo).
Cómo se ha hecho: lectura de `city3d.js`, `data.js`, `registro.js` y `H1-ciudades.md`. Autores antiguos citados de memoria con libro y capítulo: **ninguno cotejado esta vez en el texto**, salvo lo que ya cotejó H1. Por eso todo lo de abajo es `probable` hasta que un agente de historia lo coteje.

---

## 1. Cómo eran las ciudades

### 1.1 Roma y las ciudades latinas e itálicas (plano orgánico)

| Rasgo | Qué se sabe | Fuente | Etiqueta |
|---|---|---|---|
| Sitio | Ciudades en colinas o espolones, con una ciudadela alta (*arx*) y el foro en el valle bajo. Roma: Capitolio con la arx y el Foro en el valle. | Livio 1.10-1.12 (arx/Capitolio); Coarelli, *Roma* (1980) | `histórico` |
| Muralla | Roma tuvo la llamada **Muralla Serviana**. La de piedra se contrata en 378 a.C. (Livio 6.32.1). Sillares rectangulares de toba de Grotta Oscura (cantera de Veyes). En el lado llano seguía un terraplén (*agger*) con foso. La muralla **sigue el terreno**: no es un rectángulo. | Livio 6.32.1; Dionisio 9.68 (agger); Coarelli, *Roma* | `histórico` (fecha y toba); `probable` (trazado y torres, sin confirmar el detalle) |
| Puertas | Puertas con nombre en los caminos (Colina, Esquilina, Capena…). Pocas, no cuatro simétricas. | Livio, varios; Coarelli | `probable` |
| Templo en alto | Templo de Júpiter Óptimo Máximo en el Capitolio: **podio alto**, escalera solo por delante, tres celdas, columnas al frente, tejado de terracota con figuras. Es el modelo del templo etrusco-itálico. | Vitruvio 4.7 («tusco»); Livio 2.8 (dedicación); Plutarco, *Publícola* 13 (cuádriga de terracota) | `histórico` |
| Foro | Plaza abierta con tiendas (*tabernae*) alrededor. Las **basílicas** llegan tarde: Porcia 184, Fulvia 179, Sempronia 170 a.C. | Livio 39.44, 40.51, 44.16 | `histórico` |
| Casas | Casa de **atrio**: patio con abertura al cielo, habitaciones alrededor. Muros de toba, adobe y entramado; tejado de teja. | Vitruvio 2.3 (adobe), 2.7 (toba), 6.3 (atrio) | `histórico` (materiales); `probable` (aspecto exacto) |
| Tejas | Tras el saqueo galo (390 a.C.) el Estado dio tejas para reconstruir deprisa. Calles torcidas y casas apiñadas por no seguir plan. | Livio 5.55.2-5 | `histórico` |
| Casas altas | Ya en 218 a.C. hay casas de varios pisos en Roma: un buey «subió al tercer piso» en el Foro Boario. Son las primeras *insulae*. | Livio 21.62 | `histórico` |
| Calles | Estrechas e irregulares en el casco viejo. Las grandes calzadas fuera: Vía Apia (312 a.C.). | Livio 5.55; Frontino, *De aquis* 5 (Apio Claudio, 312) | `histórico` |
| Arrabales | Casas, talleres y mercados fuera de la muralla, pegados a las puertas. | Coarelli; sin pasaje concreto | `sin confirmar` |
| Tumbas | Se enterraba **fuera** de la ciudad, junto a los caminos: Doce Tablas, tabla X; Sepulcro de los Escipiones en la Vía Apia (s. III a.C.). | Cicerón, *Leyes* 2.58; Livio 38.56 | `histórico` |
| Campo | Villas y granjas fuera. Finca con casa, lagar y almacenes. Tierra repartida en parcelas cuadradas en las colonias (centuriación). | Catón, *De agri cultura* (c. 160 a.C.); Varrón, *Res rusticae* | `histórico` (finca); `probable` (colores) |

**Dictamen del contraste.** El juego dibuja el plano de una **colonia en damero con recinto rectangular**. Eso solo es cierto para fundaciones nuevas. No vale para Roma ni para las ciudades viejas.

### 1.2 Colonias en damero (el otro modelo itálico)
- **Cosa** (273 a.C.): colonia latina sobre colina; muralla poligonal que sigue la cresta; arx con Capitolio hacia 150 a.C.; foro con calles en cuadrícula. Fuente: Velleyo 1.14 (fundación); Brown, *Cosa: The Making of a Roman Town* (1980). `histórico` / `probable` en el detalle.
- **Paestum** (273) y **Alba Fucens** (303): damero y muralla poligonal. Fuente: Livio 10.1 (Alba Fucens); Velleyo 1.14. `histórico` (fecha), `probable` (aspecto).
- Aun así, la muralla **se adapta a la colina**. Ningún recinto era un rectángulo perfecto con torres idénticas.

### 1.3 Ciudades griegas (Magna Grecia, Sicilia, Macedonia)
- **Siracusa** era «cuatro ciudades»: Ortigia, Acradina, Tique y Neápolis. Fuente: Cicerón, *Verrinas* 2.4.117-119; Livio 25.24. `histórico`. Muralla de Dionisio (c. 400) con fuerte Euríalo: Diodoro 14.18. Teatro tallado en la roca de Neápolis; altar de Hierón II.
- **Plano hipodámico** (calles en cuadrícula, ágora abierta): Pella, Mileto, Metaponto. Casas de patio o peristilo en Pella. Fuente: arqueología moderna (sin autor concreto cotejado). `probable`.
- **Templo dórico** de piedra caliza en la acrópolis. Se solía revocar con estuco blanco y pintar. `probable`; color exacto `sin confirmar`.
- Tarento, Capua y Agrigento: ver `H1-ciudades.md` (dueños y fechas). Aspecto: `sin confirmar`.

### 1.4 Cartago (púnica)
- **Muralla triple del istmo**, con torres y establos para elefantes y caballos. Fuente: Apiano, *Líbica* 95. `histórico` (según Apiano; cifras de él, no las uso).
- **Puerto circular (cothon)** con isla central para el almirante. Fuente: Apiano, *Líbica* 96. `histórico`.
- **Byrsa**: calles empinadas con casas de **seis plantas**. Fuente: Apiano, *Líbica* 128. `histórico` (según Apiano). Excavación del barrio de Byrsa del s. II a.C.: Lancel, *Carthage: A History* (1995). `probable`.
- **Tofet** (cementerio-santuario de niños): Lancel; discutido si fue sacrificio. Para el juego: **no mostrarlo**, queda para el Códice. `licencia de juego`.
- Colores ocre y cal blanca: `sin confirmar`. Cartago fue arrasada en 146 a.C., fin del periodo.

### 1.5 Paleta que sale de esto (todo `probable`)
- Toba: pardo grisáceo a amarillento. Adobe: ocre. Teja: terracota naranja a rojiza. Cal y estuco: blanco hueso. Madera: pardo oscuro.
- **Roma/latina**: toba y teja. **Griega**: estuco blanco, templo con columnas. **Púnica**: cal y ocre, casas más altas, tejados planos (terrazas) `sin confirmar`.

---

## 2. Edificios del juego y qué hacer

Qué hay hoy (`city3d.js`, `registro.js`): muralla (recinto rectangular, torres, 4 puertas), foro, templo, mercado, almacén, cuartel, establo, viviendas, herrería (sin modelo), puerto, aserradero, cantera, mina, granja, acueducto, termas, anfiteatro; más arco (foro nv 4) y templo de Vesta (más de 34 niveles).

| Edificio | Problema histórico | Dictamen | Remedio propuesto |
|---|---|---|---|
| **Muralla** rectangular, torres iguales, 4 puertas en cruz | Roma y casi todas siguen el terreno; forma irregular (§1.1). Solo hay damero puro en colonias, y aun así adaptado. | **NO APTO** | Trazado **orgánico** cerrado sobre un polígono irregular; torres solo en puertas y esquinas; sillares de toba; agger donde no hay muro. Pasa a `probable`. |
| **Anfiteatro** de Pompeya | Primer anfiteatro permanente: Pompeya, hacia 70 a.C. (inscripción CIL X 852). Los combates de gladiadores empiezan en 264 a.C. en el Foro Boario. | **NO APTO** | Quitar. Cambiar por **circo de madera con graderío** (Livio 1.35: Circo Máximo; 8.20: cárceres de madera, 329 a.C.) o **gradas de madera en el foro** para juegos. El teatro de piedra permanente estaba prohibido hasta el 55 a.C. (Livio, *Per.* 48 y Valerio Máximo 2.4.2: prohibición de 151 a.C.). Mantener el id `anfiteatro`, cambiar nombre y modelo: `licencia de juego` marcada. |
| **Termas** | Termas públicas imperiales son de Agripa (25 a.C.) en adelante. En la República: *balnea* pequeños, oscuros y privados o de barrio (Séneca, *Ep.* 86, sobre el baño de Escipión). | **NO APTO** como están | Cambiar a **balneum**: edificio bajo, de toba, con chimenea; sin cúpulas ni grandes salas. Renombrar «Baños». Nota actual del registro ya dice «idealizado». |
| **Acueducto** con arcada | Aqua Appia (312 a.C.) y Anio Vetus (272) iban casi **bajo tierra** (Frontino, *De aquis* 5-6). Arcos largos llegan con la Aqua Marcia (144-140 a.C., fin del periodo). | **APTO CON NOTAS** | Antes de 144: canal subterráneo con boca de piedra y cisterna; arcos cortos solo desde nivel alto, como «Marcia». `licencia de juego` marcada. |
| **Arco** (foro nv 4) | Los primeros *fornices* triunfales: 196 a.C. (L. Estertinio, Foro Boario y Circo Máximo, Livio 33.27.4). Un arco de sillar con estatuas doradas, no un arco imperial. | **APTO CON NOTAS** | Cambiar por **fornix** sencillo de un vano con estatuas encima. Solo en Roma, no en cada ciudad. |
| **Templo de Vesta** (nv total >34) | Templo circular, real. Pero no en cada ciudad. | **APTO CON NOTAS** | Solo Roma. Otras culturas: templo de su dios. |
| **Foro** | El modelo de 0 A.D. puede traer basílica y columnata. Basílica llega en 184 a.C. | **sin confirmar** (no he visto el modelo) | Revisar el modelo. Antes de 184: plaza con tiendas; basílica solo desde nivel alto y marcada. |
| **Templo** | Debe ser etrusco-itálico: podio, escalera al frente, tejado de terracota. | **sin confirmar** | Comprobar el modelo `templo.bin`. Si es peristilo griego, usar ese para ciudades griegas y hacer uno itálico para las demás. |
| **Cuartel** / **Establo** | No había cuarteles permanentes; la legión se levantaba por leva y acampaba. | `licencia de juego` | Mantener, marcar. Aspecto: casa de toba con patio de armas, sin cuartel de piedra «moderno». |
| **Almacén** | *Horrea* públicos grandes: Sempronio Graco, 123 a.C. (posterior). Antes: graneros y almacenes de particulares. | **APTO CON NOTAS** | Aspecto de granero sencillo de toba y teja. |
| **Puerto** | Emporio y Puerto Tiberino de Roma: obras de 193 y 179 a.C. (Livio 35.10, 40.51). | **APTO** | Muelle de madera y piedra; en Cartago, el cothon circular. |
| **Herrería** | No tiene modelo. | pendiente | Taller con humo (ver §4), aprovechando una casa. |
| **Solares vacíos** (arena con cuatro postes) | No es ni histórico ni bonito. | no hace falta dictamen | Sustituir por **obra**: andamio de madera con montón de sillares y un par de peones. Las parcelas libres se ven como **huerto o corral**. |
| **Suelo** de tierra batida plana y hierba | Vacío y plano. | no hace falta dictamen | Ver §4. |

Resumen del dictamen: **NO APTO ahora** en muralla, anfiteatro y termas. Con los cambios de arriba pasa a **APTO CON NOTAS**.

---

## 3. Referencias de aspecto de otros juegos

**Red.** WebSearch funciona; YouTube y wikis casi todas no abren. Salieron reseñas de texto (resultados dudosos en detalle); lo demás es lo que se sabe en general y va **sin cotejar**.

| Juego | Qué se observa | Fuente / estado | Qué se copia como IDEA |
|---|---|---|---|
| **Anno 117: Pax Romana** | Reseñas: pueblos «más orgánicos y menos de cuadrícula», con aspecto de habitados; al acercar, gente y texturas finas. | Reseñas de TheSixthAxis, GamesRadar y otras (búsqueda web, 2025) | Casco apiñado e irregular; vida visible al acercar. |
| **Manor Lords** | Reseñas: parcelas de casa (*burgage plots*) con mucha variedad; paleta ocre apagada, madera oscura; humo y fuego «discretos». | GodisaGeek, Windows Central, Spawning Point (búsqueda web) | Parcelas con huerto detrás; humo discreto; paleta apagada. |
| **Total War: Rome (Remastered)** | La búsqueda **no** dio nada del aspecto de las ciudades. En general: casas apiñadas con tejados rojizos, muralla que rodea una plaza. | `sin cotejar` | Densidad de tejados; plaza central. |
| **Imperator: Rome, Rome II, Pharaoh/Nova Roma, Grand Ages: Rome, Caesar III, Ikariam, Travian** | Sin búsqueda. De memoria: Caesar III y Pharaoh = casas pequeñas pegadas con gente caminando; Ikariam/Travian = parcelas con edificios sobre un fondo de paisaje. | `sin cotejar` | Gente por las calles; el paisaje que rodea la ciudad hace que parezca grande. |

Lo que se copia, sin tocar su arte: **densidad** (muchas casas pequeñas), **tejados** (mancha de terracota), **paleta** (apagada), **humo** (poco y fino), **gente** (en grupos, no uno a uno).
Encargo del usuario: ver vídeos. No he podido. Propuesta: que el usuario pase 3 capturas o enlaces de lo que más le guste y las uso de guía de paleta y densidad (`sin cotejar` hasta entonces).

---

## 4. Técnicas baratas para que parezca grande y viva

Tope de escena de ciudad: 300 000 triángulos. Descarga de arte: 34,1 de 35 MB. **No hay presupuesto para arte nuevo pesado**: todo se genera en código o con modelos que ya están.
Los costes de triángulos son **estimaciones nuestras, sin medir** (render por software en pruebas; el móvil real no está medido).

### 4.1 Hacerla más grande
| Técnica | Qué se ve | Triángulos (estimación) |
|---|---|---|
| **Arrabales** con casas instanciadas que bajan de densidad al alejarse de la muralla | La ciudad no acaba en la muralla | 250 casas × ~30 = 8 000 |
| **Campos en parcelas** de colores (verde, dorado, barbecho), planos con líneas | Campo cultivado hasta el horizonte | 60 parcelas × 2 = 120 |
| **Caminos** que salen por las puertas hasta perderse | Hay un mundo más allá | casi 0 (cintas en el suelo) |
| **Niebla de color** y degradado de cielo | El horizonte se disuelve | 0 |
| **Colinas lejanas** de relieve bajo, en 2-3 capas azuladas | Borde del mundo oculto | ~5 000 |
| **Suelo sin borde visible**: el plano se extiende bajo la niebla y se funde con el cielo | Quita el efecto «mesa» | 0 |
| **Granjas y villas** sueltas con huerto, y **tumbas** junto al camino | Mundo con historia (§1.1) | 20 × ~100 = 2 000 |

### 4.2 Más vida
| Técnica | Qué se ve | Triángulos |
|---|---|---|
| **Humo** de hogares y herrería: sprites con textura, 1 malla instanciada | Hilos finos de humo | 100 × 2 = 200 |
| **Gente en grupos** de 2-4 (ya hay figuras animadas instanciadas) | Mercado, corros, porteadores | ya existe; sube de 70 a ~150 |
| **Ropa tendida, toldos, carros**: planos y cajas instanciados | Detalle humano | ~3 000 |
| **Luz cálida de tarde**, sombra suave (una sola direccional con sombra de baja resolución, o sombras falsas en el suelo) | Calidez | sombra real = coste de render alto: preferir sombras falsas (manchas); `sin medir` |
| **Ganado y aves** (pocos, en el campo) | Movimiento al fondo | ~1 000 |

### 4.3 Cómo se haría la ciudad densa
- Un **generador** crea casas de caja con tejado a dos aguas (medidas distintas, giros irregulares) siguiendo calles torcidas. Una malla instanciada por tipo; **color por instancia** (toba, ocre, cal, teja).
- Así no se descarga arte nuevo y cada cultura cambia la paleta y la forma (alta y con terraza en Cartago, patio con estuco blanco en Grecia).
- Ya existe el modelo `casa` de 0 A.D. (CC BY-SA 3.0): se puede **mezclar** con las casas generadas.
- Con 400 casas × ~40 triángulos = 16 000. Muralla, torres, edificios principales y árboles caben de sobra bajo 300 000, **si no se multiplican los pinos** (el modelo más pesado, según `city3d.js`).

---

## 5. Plan de tareas

Costes en M de tokens (referencia: sesión media 1–1,5 M). **Estimaciones nuestras.**
Cada tarea acaba con captura antes/después y los jueces en APTO.

| Tarea | Qué se ve distinto | Coste |
|---|---|---|
| **Q1c · Suelo, cielo y horizonte** | Sin borde de mesa; niebla de color; colinas lejanas; caminos que salen de las puertas; campos en parcelas; luz de tarde. | 1 M |
| **Q1d · Muralla orgánica** | Recinto irregular que sigue la colina; torres solo en puertas; agger donde no hay muro; puertas desiguales. | 1,2 M |
| **Q1e · Casco denso de toba y teja** | Generador de casas apiñadas y calles torcidas; arrabales con densidad decreciente; sustituir solares de arena por huertos y obras. | 1,5 M |
| **Q1f · Edificios de época** | Anfiteatro → circo/gradas de madera; termas → baños; acueducto subterráneo/arcos cortos; fornix; Vesta solo en Roma; revisar foro y templo. Textos y fichas en `registro.js` con etiquetas. | 1,2 M |
| **Q1g · Vida** | Humo, grupos de gente, ropa tendida, ganado, sombras falsas. | 1 M |
| **Q1h · Variantes por cultura** | Paleta y forma: itálica, griega (estuco, templo dórico), púnica (cal, altas, cothon). Puede ir antes de Q1g si se decide. | 1,2 M |
| **Q1i · Revisión histórica** | Un agente cotejando cada `probable` y `sin confirmar` de este documento con el pasaje; dictamen final. | 0,6 M |

Total aproximado: **7,7 M**. Orden recomendado: Q1c → Q1d → Q1e → Q1f → Q1h → Q1g → Q1i. Con Q1c+Q1e ya se nota el cambio en una captura.
Arte nuevo descargado: **0 MB** previsto.

### Qué debe decidir el usuario
1. **¿Un solo plano itálico para todas las ciudades, o uno por cultura?** Recomiendo base común y paleta/forma distinta por cultura (Q1h), no tres ciudades distintas.
2. **Anfiteatro:** ¿se quita y se reemplaza por circo de madera, o se queda marcado como licencia? Recomiendo reemplazar.
3. **Termas:** ¿renombrar «Baños» y rebajar el modelo, o quitar? Recomiendo renombrar.
4. **Muralla:** ¿una forma por ciudad (cada una con su colina) o una forma irregular común? Recomiendo común con giro y tamaño distintos.
5. **Vídeos:** pasar enlaces o capturas de los juegos que le gustan para fijar la paleta.
6. **Cartago:** ¿mostrar el tofet? Recomiendo que no, y explicarlo en el Códice.
7. **Rendimiento en móvil real:** nadie lo ha medido. Antes de Q1e conviene una prueba con su teléfono.

## Fuentes
- Antiguos (citados por libro y capítulo, **no cotejados en el texto** en este estudio): Livio 1.10-12, 1.35, 2.8, 5.55, 6.32, 8.20, 10.1, 21.62, 25.24, 33.27, 35.10, 38.56, 39.44, 40.51, 44.16; Dionisio 9.68; Polibio (no usado); Frontino, *De aquis* 5-7; Vitruvio 2.3, 2.7, 4.7, 6.3; Cicerón, *Verrinas* 2.4.117-119 y *Leyes* 2.58; Plutarco, *Publícola* 13; Apiano, *Líbica* 95-96, 128; Diodoro 14.18; Catón, *De agri cultura*; Séneca, *Ep.* 86; Velleyo 1.14; Valerio Máximo 2.4.2.
- Modernos: Coarelli, *Roma* (1980); Brown, *Cosa: The Making of a Roman Town* (1980); Lancel, *Carthage: A History* (1995).
- Juegos (solo texto de reseñas encontrado por búsqueda web): Anno 117 (TheSixthAxis, GamesRadar), Manor Lords (GodisaGeek, Windows Central, Spawning Point). El resto, `sin cotejar`.
- Código mirado: `js/gfx/city3d.js`, `js/data.js` (D.BUILD), `js/registro.js`, `gobierno/historia/H1-ciudades.md`.
