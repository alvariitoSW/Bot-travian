# Crítica independiente de la maqueta «guerra-unica» (GM11) · 16/11/2026

Encargo: decir sin suavizar qué hay que rehacer, qué falla, qué no es realista y cómo arreglarlo.
No se ha tocado nada del juego ni de la maqueta. Solo este documento y unas capturas de apoyo.

**Qué he mirado de verdad**
- Todo el código de `gobierno/maquetas/guerra-unica/` (`reglas.js`, `vista.js`, `formacion.js`, `index.html`, `prueba.mjs`, `captura.mjs`).
- Las seis capturas `GM11-*.jpg` y catorce mías (`gobierno/capturas-tarea/crit-fable-*.jpg`), a 390×844 y 844×390,
  con 5 000 y 10 000 hombres, contra Cartago y contra Pirro. Sin errores de consola.
- La prueba de reglas (`prueba.mjs`): pasa, y sus cifras las uso abajo.
- Lo que **no** he podido medir: la fluidez en un móvil real. Aquí solo hay dibujo por programa.
  El «60 img/s» que sale en mis capturas no vale como dato.

---

## 0. Veredicto en cinco líneas

1. **La técnica de dibujo es buena y se queda**: 10 000 hombres como cartones, figuras completas solo de cerca. Eso está resuelto.
2. **El campo de batalla está mal planteado**: son tres pasillos fijos. Cada cuerpo solo va adelante y atrás. De ahí salen casi
   todas las quejas: tropas «a lo largo», sin maniobra, caballería que es un botón, flancos que son un aviso y no un sitio.
3. **De cerca no hay combate**: dos muros de soldados idénticos, de pie, separados por una raya limpia. Nadie pega a nadie.
4. **La batalla dura un minuto y pico** y obliga a tocar cada segundo y medio. No da tiempo a mirar ni a pensar.
5. **No hay nada antes de la batalla**: ni despliegue, ni ancho o fondo, ni plan. Lo ha dicho el usuario hoy y tiene razón (punto 2.1).
6. **El terreno es un decorado viejo**: llano, a rayas, y no sirve ni a favor ni en contra. También lo ha dicho el usuario hoy
   («parece la beta de un juego de 1997») y también tiene razón (puntos 2.9, 3.10 y 4.J).

**Qué haría**: conservar el dibujo y las fichas, y **rehacer el esqueleto del campo** (unidades con sitio propio en vez de tres
pasillos). Lo visual, por partes, sobre ese esqueleto. Detalle en el punto 6.

---

## 1. Qué se conserva y qué se rehace

### Se conserva (funciona, costó caro y está bien hecho)
| Qué | Dónde | Por qué vale |
|---|---|---|
| Cartones: cada hombre son dos triángulos con su foto en 8 direcciones y 11 poses | `vista.js` (`atlasDe`, sombreador `VS`/`FS`) | 9 400 hombres en unas 60 órdenes de dibujo y 110 000 triángulos. Es lo que permite ejércitos grandes en un móvil |
| Figuras completas solo junto a la cámara, con tope | `vista.js` (`detalle`) | Buena idea. Hay que afinarla (punto 3.12), no tirarla |
| Fichas de tropa, arma y formación en tablas | `reglas.js` (`TROPAS`, `ARMAS`, `FORMACIONES`) | Añadir una tropa es añadir una línea. Correcto y fiel a la arquitectura |
| Reglas sin pantalla y con su prueba en Node | `reglas.js`, `prueba.mjs` | Cumple «la lógica no toca la pantalla» |
| Juicio de cada orden (relevo a tiempo, empujar cuando flaquean) | `reglas.js` (`juicioRelevo`, `juicioPostura`) | Es lo más original del diseño. Hoy casi no se ve (punto 2.6) |
| Cielo, montañas al fondo, niebla de distancia | `js/gfx/ground.js` | De cerca el horizonte queda bien |
| Tarjetas de los tres cuerpos con escudos que se vacían | `index.html`, `pintarCartas` | Se entienden de un vistazo |

### Se rehace
| Qué | Por qué |
|---|---|
| **Los tres pasillos** (`B.sect[0..2]`, cada uno con una distancia y un «frente» de −1 a 1) | No existe posición lateral. Nada puede rodear, desbordar, ensanchar ni girar de verdad. El flanco es una bandera (`c.flanqueado`), no geometría |
| **La forma de los regimientos** (`FILES` = raíz de los hombres × 1,25 con el móvil de pie) | Salen bloques de 27 de frente por 22 de fondo. Una línea romana formaba de 6 a 8 de fondo. Por eso se ven «a lo largo» |
| **La línea de contacto** | Hoy es una raya recta con un hueco. Hay que mezclar las dos primeras filas y que se vea pegar |
| **La cámara** | Solo hay dos vistas fijas y la máquina te la mueve sola. No se puede arrastrar ni pellizcar |
| **La caballería** | Es un botón con espera. No es una tropa que esté en un sitio y vaya a otro |
| **El ritmo** | 36 s de acercarse y 30 s de lucha. Un relevo de 1 600 hombres en 1,9 s |
| **El testudo pintado** | Es una caja con tejas (punto 3.6) |
| **Los caídos** | Cartones de 72×96 píxeles ampliados: de cerca son manchas rojas a cuadros |

---

## 2. Qué falla hoy (juego, claridad, reglas, errores)

### 2.1 No hay nada antes de la batalla (lo que ha visto el usuario)
- La batalla empieza ya formada y andando. No se elige nada.
- **Ancho o fondo**: lo decide el programa según cómo sujetas el móvil (`DE_PIE ? 1.25 : 3.2` en `vista.js`, línea 20).
  De pie: bloques casi cuadrados, tres líneas una tras otra. El conjunto es más hondo que ancho. En las capturas
  `GM11-vertical-1-lejos` y `crit-fable-g2-10000-lucha` el ejército parece una pila de alfombras.
- **Además es solo dibujo**: las reglas no saben el ancho. Formar ancho o hondo no cambiaría nada del combate.
- **Formaciones**: cada tropa tiene una fija en su ficha. El jugador no elige.
- **Plan**: no hay. Ni dónde va la caballería, ni si salen los vélites, ni qué ala es la fuerte.
- En Total War el despliegue es la mitad de la batalla. Aquí falta entero. Cómo hacerlo: punto 4.A.

### 2.2 Dura muy poco y exige tocar sin parar
Cifras de `prueba.mjs` (5 000 por bando, contra Cartago):
- Sin tocar nada: **derrota en 67 segundos, siempre**.
- Solo avanzar y empujar: derrota en 67 segundos, siempre.
- «Con cabeza»: victoria en unos 2 minutos. Pero ese robot toca **cada 1,5 segundos** y da unas 14 órdenes buenas.
- En mi partida de prueba (pocas órdenes) la batalla acabó a los 75 segundos: «Tu centro huye».
- Una persona con el pulgar, tres cuerpos y la cámara moviéndose sola no llega. Y no le queda tiempo para mirar la batalla,
  que es para lo que se hizo todo el dibujo.

### 2.3 Roma pierde siempre de frente y gana siempre «con cabeza»
- Príncipes contra libios, de frente e iguales en número: gana Roma el **0 %**. Contra galos: **0 %**.
- Con el robot bueno: **100 %**. Con el robot que no se cubre: 28 %.
- O sea: no hay suerte ni variedad. Hay una receta (cubrirse, relevar a tiempo, jinetes a los honderos) y quien la sabe gana siempre.
  A la tercera batalla ya está vista. Lo mismo dijo la síntesis GM6b y sigue igual.

### 2.4 El número de hombres es decoración
- 1 000, 5 000 y 10 000 dan **los mismos resultados al segundo** (mismas duraciones, mismos porcentajes). Todo va multiplicado por un factor y se anula.
- El botón «5 000» dice «por bando», pero el enemigo lleva 3 823.

### 2.5 Reglas que no se entienden o no existen
- **Atacar por la espalda no existe.** `flancos()` pone `espalda = 0` siempre. La regla está escrita (`GOLPE.espalda`) y nunca se usa.
- **El flanco no es un sitio.** Te «envuelven» cuando huye el cuerpo vecino y pasan 4 segundos. No porque alguien llegue andando a tu costado.
- **Huir sale gratis.** Un cuerpo roto deja de contar. Nadie lo persigue. En la historia, la matanza era ahí.
- **La batalla se corta** al huir dos de tres cuerpos. De golpe sale el cartel.
- **Los vélites no pasan por ningún hueco**: no hay huecos. Desaparecen de delante y reaparecen detrás.
- **Jinetes enemigos**: esperan parados y a la vista en una esquina. Luego dan vueltas en óvalo junto a tu ala (un tiovivo).
  No luchan nunca contra tus jinetes: tu carga los «espanta» y ya.
- **Tus jinetes** están aparcados detrás del centro. Pulsas, tardan unos segundos, golpean, vuelven y esperan 24 s. Es un hechizo con recarga.
- **Los botones cambian de oficio bajo el dedo**: «Avanzar» pasa a ser «Empujar» en el mismo sitio al chocar. Es fácil dar una orden que no querías.
- **Testudo en las tres líneas a la vez**, triarios incluidos, y los vélites delante de pie bajo las piedras (`crit-fable-v3`, `v4`).

### 2.6 Lo bueno del diseño no se ve
- El **ánimo de la legión** es un número pequeño arriba («Ánimo 50 %») entre otras cifras. Nadie lo mira.
- El **juicio de la orden** («Relevo a tiempo…») sale en una cinta de 2,8 segundos. Solo cabe un aviso. Con tres cuerpos, unos pisan a otros.
- No hay registro, ni pausa, ni cámara lenta. Lo que no leíste, se perdió.

### 2.7 Fallos de pantalla
- **Carteles del enemigo montados** unos sobre otros e ilegibles: `crit-fable-v4`, `v7`, `v9`, `GM11-vertical-2`.
- **Texto cortado** en los botones con el móvil de pie: «pega más, can…», «aún están ente…».
- **El mando tapa el 22 % de abajo.** Detrás se ven medias cabezas y los jinetes escondidos.
- **La cámara se va sola** a cada orden y a cada aviso (`mirar()`), aunque estés mirando otra cosa.
- **Los jinetes romanos se ven casi negros** de lejos (`crit-fable-g2`, `v8`). Parece un fallo de luz al fotografiar el caballo.
- «img/s» en la pantalla del jugador: es dato de taller.

### 2.8 Fallos de taller (no los ve el jugador, pero cuestan)
- Cabeceras, título y créditos dicen «Maqueta GM7». Es GM11.
- **La cuenta de dónde va cada hombre está escrita tres veces** (sombreador, `formacion.js` y `sitio()` en `vista.js`). Si se cambia una y no las otras, cartones y figuras no casan.
- `captura.mjs` **fuerza el estado** para las fotos (pone la fatiga a 0,8 a mano, mueve el frente a mano, usa `G.R.CEDE`, que no existe). Las capturas de relevo y de flanco no salen de una partida jugada.
- `vista.js` tiene líneas de 500 a 900 letras. Es justo la trampa que avisa CLAUDE.md (un `//` anula el resto).
- De cerca se dibujan **580 000 triángulos** (220 figuras de unos 2 600). De lejos, 110 000. La fluidez de cerca en móvil no está medida.

### 2.9 El terreno no juega (lo que ha visto el usuario)
- En `reglas.js` **no existe la palabra terreno**. No hay altura, ni bosque, ni río, ni cuesta. Todas las batallas se dan en el mismo llano.
- Nada da ventaja ni estorba: no se puede esperar en alto, ni apoyar un ala en un río, ni esconder jinetes en un olivar, ni obligar a la falange a pasar por terreno roto.
- Los árboles se colocan **adrede fuera** del campo de lucha (`campo()` los descarta si caen dentro). Son un marco, no un obstáculo.
- La única loma está más allá de donde se lucha (`lejos > llano`). El campo de batalla es una mesa.
- GM15 ya tiene diseñado terreno, hora del día y maniobra. Nada de eso ha llegado a esta maqueta.

---

## 3. Lo visual: qué no es realista y cómo debería verse

### 3.1 Soldados: un ejército de clones
- **Se ve**: todos iguales, misma talla, mismo color, misma postura, mismo instante (`GM11-vertical-2-choque`).
- **Debería**: tallas algo distintas, túnicas y escudos con variación, cada uno a su compás. Los galos e iberos, muy variados; Roma, más uniforme.
- **Por qué**: el ojo detecta la repetición al instante. Es lo que más delata «muñecos».

### 3.2 Formaciones: bloques de regla
- **Se ve**: rectángulos perfectos, 20 filas de fondo, pegados por los lados, sin huecos entre manípulos.
- **Debería**: líneas de 6 a 8 de fondo, mucho más anchas. Manípulos con hueco entre ellos y al tresbolillo (los de la segunda línea tapan los huecos de la primera).
  Un estandarte y un centurión por manípulo. Filas algo torcidas. La falange, apretada y honda (16). Los galos, en masa irregular.
- **Por qué**: es la imagen de la legión. Y sin huecos no puede haber relevo creíble.

### 3.3 La línea de contacto: no hay lucha
- **Se ve**: una raya recta. A un lado todos de espaldas quietos; al otro todos de frente quietos. Un pasillo limpio entre los dos (`crit-fable-v6`, `h4`).
  Solo algunos cartones de las dos primeras filas mueven el brazo. Las figuras de cerca, casi todas en reposo.
- **Debería**: las dos primeras filas mezcladas. Parejas que se pegan, uno avanza y otro cede. La línea ondula: se hunde donde pierdes y abomba donde ganas.
  Los de atrás empujan y miran. Caídos en el sitio donde cayeron.
- **Por qué**: es el plano que el usuario quiere ver de cerca. Hoy está vacío.

### 3.4 Escala
- **Proyectiles**: las piedras de honda son barras blancas del tamaño de un hombre (`crit-fable-v1`, `v4`). Una piedra no se ve; se ve la lluvia y el polvo al caer.
  Las jabalinas deben ser rayas finas y oscuras.
- **Estandartes**: de lejos se agrandan hasta nueve veces. Sirven de marca, pero parecen postes de portería.
- **Árboles**: crecen con el tamaño del ejército. El olivo acaba más alto que una cohorte.
- **Distancias**: las reglas dicen 150 m; la pantalla lo encoge según el ejército. El cartel dice «a 140 m» y lo dibujado no son 140 m.

### 3.5 Movimiento
- **Marcha**: cuatro poses de paso a 5 por segundo. Se ve a saltos y los pies patinan (la velocidad del bloque no casa con el paso).
- **Giros**: el regimiento gira entero como una tabla.
- **Huida**: todos corren recto en la misma dirección y **encogen hasta desaparecer**. En `crit-fable-v9` los que se retiran van en filas indias ordenadas, andando.
- **Relevo**: 1,9 segundos. Parece un truco de cartas, no 1 600 hombres cruzándose.
- **Debería**: 8 poses de paso; el compás atado a la velocidad; al huir, cada uno por su lado, tirando el escudo, y el vencedor detrás.

### 3.6 Escudos y testudo
- **Se ve**: una losa naranja con escudos pintados en cuadrícula perfecta y paredes rectas. Los cascos asoman por encima del tejado (`crit-fable-v4`).
  De lejos parece un tejado de tejas o un contenedor.
- **Debería**: los propios soldados con el escudo en alto, solapados, con sus irregularidades. Solo la tropa que lo sabe hacer y solo la que está a tiro.
- **Y una duda de historia**: el testudo es de asedio. En campo abierto, contra honderos, es más juego que historia. Debe ir marcado como licencia de juego (skill `historia`).

### 3.7 Polvo
- **Se ve**: 240 discos beis solo sobre la raya de lucha. Nada al marchar, nada con los caballos.
- **Debería**: polvo bajo los pies de quien anda, estela larga tras la caballería, nube que crece con la lucha y se la lleva el viento. Con el sol detrás, dorado.
- **Por qué**: el polvo es lo que da tamaño y movimiento a un ejército visto de lejos.

### 3.8 Sangre y caídos
- **Se ve**: no hay sangre. El rojo del suelo es la túnica del caído, a cuadros gordos porque es una foto pequeña ampliada.
  El caído es un cartón que mira a la cámara: un tumbado «de pie». A los 45 s desaparece.
- **Debería**: cuerpos planos en el suelo, cada uno girado a su manera, escudos y lanzas sueltos. Tierra oscurecida donde se ha luchado mucho.
  Sin chorros: en un móvil no se leen y cambian el tono del juego. El grado lo decide el usuario.

### 3.9 Luz
- **Se ve**: nadie da sombra (solo un borrón bajo el bloque y un círculo bajo las figuras de cerca). Luz de mediodía, plana.
- **Debería**: sol bajo de mañana o tarde, sombras largas hacia un lado, brillo en cascos y puntas. La hora, la que diga GM15.
- **Por qué**: la sombra pega al soldado al suelo. Sin ella flota.

### 3.10 Terreno
- **Se ve**: un césped a rayas, como un campo de fútbol recién segado (sale de mezclar dos ondas). Llano del todo donde se lucha. La «tierra pisada» es una mancha fija en el centro, se luche donde se luche.
- **Debería**: hierba seca con manchas irregulares, rastrojo, un camino, una loma, un arroyo o un olivar que estorben. La tierra se pisa **donde pasa la tropa**.
- **Además se ve antiguo por cuatro cosas concretas**: una sola textura de hierba repetida, sin mezcla con tierra, piedra o rastrojo; ni una brizna, mata o piedra que sobresalga del suelo;
  ninguna sombra de nube ni de árbol; y un horizonte vacío de lejos (en la vista de dron el campo acaba en un borde liso).
- **Debería verse**: suelo con tres o cuatro materiales mezclados según la cuesta y la humedad (hierba seca, tierra, roca en lo empinado, verde junto al agua); matas, piedras y arbustos sueltos cerca de la cámara;
  parcelas de cultivo con sus lindes, un camino de tierra, una granja o un santuario al fondo; agua que brilla; sombras de nubes que pasan despacio.
- **Por qué**: el terreno es lo que hace distinta una batalla de otra, y es la mitad de cada captura. GM15 ya lo tiene diseñado; falta que se vea y que cuente.

### 3.11 Cámara
- **Se ve**: una vista de dron fija y una vista baja fija. La máquina salta de una a otra sola. De cerca ves sobre todo las espaldas de los tuyos; la lucha queda en el tercio de arriba.
- **Debería**: un dedo arrastra, dos dedos acercan y giran, sin saltos, de la vista de general a la de soldado. La cámara nunca se mueve sola: el aviso se toca y entonces te lleva.
  Las batallas, pensadas en horizontal (así las dirige el usuario según CLAUDE.md); en vertical, que funcione.

### 3.12 El paso de cartón a figura
- **Se ve**: un círculo alrededor de la cámara donde el soldado cambia de golpe de foto a figura. En el borde hay un escalón de tamaño y de luz.
- **Debería**: cambio gradual (fundido corto por distancia) y misma luz en los dos.

### 3.13 Interfaz
- Carteles del enemigo que no se pisen (pegados al borde con una flecha si la tropa no está en pantalla).
- Subtítulos de dos palabras que quepan a 390 px.
- Ánimo como barra grande, no como número.
- Un registro de avisos que se pueda abrir, y pausa.
- El mando, más bajo o plegable, para que no tape la batalla.

---

## 4. Cómo hacer cada cosa

Unidad de esfuerzo: **sesión** (una tarea del tablero con constructor, verificador y revisor).
P = media sesión · M = una · G = dos o más. Todo respeta: lógica sin pantalla, solo three.js 0.170, arte de 0 A.D. (CC BY-SA 3.0).

### 4.A Despliegue y plan antes de la batalla (lo pedido hoy) — M + M
**Versión corta (M), sobre lo que hay:**
1. `reglas.js`: añadir a cada cuerpo `fondo` con tres valores: **ancho** (6 filas), **normal** (10), **hondo** (16). Y que **cuente**:
   - ancho: más hombres pegan a la vez (`frente` +15 %), desborda al rival más estrecho (aviso de costado sobre él), pero aguanta menos (`moral` cae un 20 % más rápido) y el relevo tarda más;
   - hondo: al revés. Empuja más, aguanta más, pero puede ser desbordado.
2. `reglas.js`: `nueva()` recibe un `plan`: fondo de cada cuerpo, dónde va la caballería (ala izquierda, derecha, repartida, reserva), vélites delante sí o no,
   y una de cuatro **disposiciones**: línea recta, centro reforzado, ala fuerte (izquierda o derecha), centro retrasado (la de Aníbal en Cannas).
   Cada una es solo un reparto de hombres y de distancias iniciales entre los tres cuerpos.
3. `vista.js`: pantalla previa con la batalla parada y vista desde arriba. Tres tarjetas (una por cuerpo) con el conmutador ancho/normal/hondo,
   una fila con las cuatro disposiciones dibujadas como esquema, y el botón «Marchar». Los bloques cambian de forma al tocar.
4. `prueba.mjs`: que ningún plan gane siempre y que cada uno gane a alguno (piedra, papel, tijera suave).
- **Historia**: profundidades y disposiciones con su ficha (Polibio 18.28–32 para legión contra falange; Cannas para el centro retrasado). Skill `historia`.
- **Riesgo**: bajo. No toca el rendimiento.

**Versión de verdad (M más, tras 4.B):** arrastrar cada cuerpo con el dedo en la pantalla previa, dentro de tu mitad del campo. Es la respuesta «A» que el usuario dio en GM10.

### 4.B Rehacer el esqueleto: de tres pasillos a unidades con sitio — G (2 a 3 sesiones)
Es el cambio de fondo. Sin él, 4.A se queda en un apaño y la caballería seguirá siendo un botón.
1. **Modelo nuevo** (`reglas.js`, sin pantalla): el ejército es una lista de **unidades** (manípulos de 120, tropas de 200 a 300, alas de jinetes).
   Cada una con posición `x, z`, hacia dónde mira, ancho de frente, filas, hombres, fatiga, moral. Unas 10 por línea y bando: de 40 a 60 en total.
2. **Combate por solape**: dos unidades luchan si sus frentes se tocan. Se calcula cuánto frente comparten (un tramo sobre el eje `x`).
   Quien sobresale por un lado dobla sobre el costado del otro. Flanco y espalda salen de **dónde está** quien ataca (ángulo respecto a hacia dónde mira la víctima), no de una bandera.
3. **Los tres cuerpos siguen siendo el mando**: el jugador sigue dando órdenes a ala izquierda, centro y ala derecha (cuatro botones, una pantalla: decisión firmada).
   Cada cuerpo agrupa sus unidades. Lo que cambia es que debajo hay sitio de verdad.
4. **Caballería como unidad**: está en un ala, tiene delante a los jinetes enemigos, lucha con ellos, y quien gana queda libre para dar la vuelta. La orden es «a dónde», no «cuándo».
5. **Persecución**: la unidad rota sigue en el campo huyendo; quien la persigue le causa bajas y **se aleja** de la batalla (dilema real: perseguir o volver).
6. **Coste de cálculo**: 60 unidades, comparar cada una con las de enfrente: unas 900 cuentas por paso, 20 pasos por segundo. Nada para un móvil.
7. **Dibujo**: el contrato de `formacion.js` ya es «un regimiento = seis números». Vale tal cual. Pasan a ser 60 regimientos en vez de 14: unas 60 órdenes de dibujo más.
   Si pesa, se agrupan por tipo de tropa en una sola malla con una textura de datos (una fila por unidad).
- **Orden**: primero reglas y `prueba.mjs` (una sesión, sin tocar el dibujo); después adaptar `colocar()` en `vista.js`; después caballería y persecución.
- **Riesgo**: es rehacer `reglas.js` casi entero. Se pierden los equilibrios actuales; hay que volver a ajustarlos con los robots. No toca `js/`.

### 4.C Ritmo — P
- `reglas.js`: bajar `K_BAJAS` y la caída de moral para que la lucha dure de 4 a 6 minutos; `T_RELEVO` de 3,2 a unos 12 s; fatiga más lenta (`BASE_FATIGA`).
- Que **no tocar nada** dé una batalla pareja (40–50 %), no una derrota segura. Mandar bien debe subirla a 70–80 %, no a 100 %.
- Azar en pocos golpes grandes y avisados (ya propuesto en GM6b): un jefe que cae, un ala que llega tarde, lluvia.
- Botones de **pausa** y **velocidad** (×1, ×2). Dar órdenes en pausa: en móvil es casi obligado.
- **Riesgo**: ninguno técnico. Es ajustar números con `prueba.mjs`.

### 4.D Línea de contacto viva — M
Archivos: `vista.js` (sombreador `VS`, `detalle()`), `formacion.js`.
1. **Línea que ondula**: cada unidad pasa al sombreador un perfil de 8 valores (cuánto cede o avanza cada tramo de su frente). El sombreador desplaza cada columna según su tramo. Con 4.B el perfil sale del solape real; sin 4.B, de un ruido lento más `s.frente`.
2. **Mezcla**: las dos primeras filas reciben un vaivén propio adelante y atrás (de 0,5 a 1 m, con su compás por hombre) para que se metan en el hueco y lo cierren.
3. **Pegar por parejas**: el hombre de la columna *n* ataca cuando el de enfrente «recibe» (mismo reloj, medio compás de diferencia). Para las figuras de cerca, lo mismo en `detalle()`.
4. **Pose de escudo** en el atlas para la fila que aguanta, si la tropa la tiene en sus animaciones de 0 A.D. (comprobar en `tools/`; si no la hay, se usa el arranque de la animación de ataque).
5. **Una sola cuenta de sitios**: generar el trozo del sombreador a partir de `formacion.js`, o al revés. Hoy está triplicada.
- **Riesgo de rendimiento**: nulo (son sumas en el sombreador de vértices).

### 4.E Formaciones que parezcan una legión — P (tras 4.B) o M (sin 4.B)
- Con 4.B sale casi solo: cada manípulo es una unidad, con su hueco y su estandarte, y las líneas al tresbolillo.
- Sin 4.B: en el sombreador, partir cada línea en 10 bloques con hueco (la cuenta de «calles» del relevo ya hace algo parecido) y desplazar media anchura la segunda línea.
- Filas torcidas: subir el desorden por hombre de 0,34 a 0,5 m en tropas irregulares (dato por formación en `FORMACIONES`).
- Un centurión y un portaestandarte por manípulo (misma malla, otro color de cimera): es arte de 0 A.D. si existe la variante; skill `arte`.

### 4.F Variedad de soldados — P
- **Cartones**: en el sombreador, por hombre: tono de piel y de tela ±8 %, talla ±4 %, y espejo izquierda-derecha en tropas irregulares. Coste cero.
- **Figuras**: lo mismo con un atributo por instancia (ya existe `aFrame`; añadir `aTinte`). Tocar `js/gfx/units.js` exige permiso: es código del juego. En la maqueta se puede probar con un material propio.
- **Variantes de modelo**: 0 A.D. trae varios cascos y escudos por tropa. Dos o tres variantes de hastati y de galos. Skill `arte` y presupuesto de peso en `gobierno/arte.json`.

### 4.G Caídos y sangre — P
- Añadir al atlas **una fila fotografiada desde arriba** con la pose final de muerte. El caído se dibuja como un rectángulo **tumbado en el suelo**, girado a su manera, no mirando a cámara.
- Celdas más grandes solo para esa fila (144 px) o usar figura completa para los caídos cercanos.
- Que no desaparezcan a los 45 s: tope de 600 por bando y se reciclan los más viejos y lejanos.
- **Tierra pisada y oscurecida**: una textura pequeña (256×256) que cubre el campo; cada paso de reglas pinta una mancha donde hay lucha o marcha. El suelo (`applyGround`) la mezcla. Sustituye a la mancha fija de hoy.
  Para probarlo en la maqueta sin tocar `js/gfx/ground.js`: un plano encima con esa textura.
- **Riesgo**: bajo. Una textura de 256 se sube a la tarjeta gráfica unas 5 veces por segundo, no más.

### 4.H Polvo — P
- Cambiar los 240 puntos por unos **120 rectángulos grandes y blandos** con textura de ruido (se puede generar con `texturaRuido()`), que nacen bajo unidades que andan, corren o luchan, suben, se ensanchan y se van con el viento.
- Color según el sol (dorado a contraluz).
- **Riesgo real**: pintar muchas veces el mismo píxel con transparencia es lo más caro en un móvil. Reglas: tope de 120, opacidad baja, nada de polvo pegado a la cámara, y medir en el móvil del usuario antes de dar por bueno.

### 4.I Luz y sombras — M
1. **Sombra de cada cartón**: un segundo rectángulo por hombre, tumbado en el suelo y estirado hacia donde cae la sombra, oscuro y translúcido. Mismo sombreador con un `#define`. Dobla los rectángulos (de 10 000 a 20 000): asumible.
2. **Sombra de verdad solo de cerca**: un mapa de sombras de 1024 que cubra solo el círculo de figuras completas. Opcional, con el interruptor de calidad que ya baja la nitidez si el móvil no puede.
3. **Sol bajo**: mover `sol.position` a unos 25° sobre el horizonte y volver a fotografiar los atlas con esa luz. Subir el contraste (menos luz de cielo, hoy 1,3).
4. **Luz de la foto atada al mundo**: hoy la foto se hace con el soldado girado y la luz fija, y luego la cámara gira; la luz del cartón deja de casar con el sol. Arreglo: fotografiar con la luz en el sistema del mundo y elegir la dirección por (giro del soldado − giro de la cámara), o guardar una normal aproximada.
- **Riesgo**: el punto 2 es el único caro. Los demás, baratos.

### 4.J Terreno que se vea real y que juegue — G (dos sesiones: M reglas + M aspecto)
**Primero las reglas (M). Sin esto, un terreno bonito sigue sin servir para nada.**
1. `reglas.js` (o un `terreno.js` aparte, sin pantalla): el campo es una **rejilla pequeña** (por ejemplo 48×32 casillas) con dos datos por casilla: **altura** y **tipo**
   (llano, cuesta, bosque u olivar, arroyo o vado, terreno roto, cultivo). Se genera con la semilla, así que la prueba en Node ve el mismo campo que la pantalla.
2. Efectos, pocos y claros (cada uno con su fuente; skill `historia`):
   - **Cuesta arriba**: quien ataca subiendo anda más lento, se cansa más y pega un 15 % menos. Quien tira desde arriba llega más lejos.
   - **Bosque u olivar**: la tropa de dentro recibe la mitad de proyectiles y no se ve hasta estar cerca (emboscada). La caballería no carga dentro. La falange y la línea cerrada se desordenan.
   - **Arroyo o vado**: cruzarlo frena y desordena. Quien espera en la orilla golpea a quien sale del agua. Un ala pegada al río no puede ser rodeada por ese lado.
   - **Terreno roto**: rompe la falange (es Cinoscéfalas y Pidna: Polibio 18.31, Livio 44.41) y frena a los jinetes. A los manípulos casi no les afecta. Es la ventaja histórica de Roma.
3. **El jugador lo usa en el despliegue** (4.A): ve el campo desde arriba, con las zonas marcadas, y decide dónde forma. Tres o cuatro campos tipo por semilla: llano abierto, loma a un lado, río en un ala, olivar y terreno roto.
4. **El enemigo también**: Cartago busca esconder jinetes; la falange busca llano. Con poco: su disposición inicial depende del campo.
5. `prueba.mjs`: la misma batalla en llano y en cuesta debe dar resultados distintos y razonables. Ningún terreno debe decidir solo.
- Con los tres pasillos de hoy solo cabe una versión pobre (un tipo de terreno por pasillo). Con el esqueleto de 4.B sale completo. Otra razón para hacer 4.B antes.

**Después el aspecto (M).** Archivos: `vista.js` (`campo()`); `js/gfx/ground.js` solo con permiso, es código del juego.
1. **Altura de verdad** dentro del campo: la malla del suelo toma la altura de la rejilla de reglas. Los cartones y las figuras leen la misma altura de una textura pequeña (una consulta en el sombreador de vértices).
2. **Fuera las rayas**: quitar las dos ondas de `W` en `campo()` y repartir los materiales con ruido en dos escalas más la cuesta y el tipo de casilla (roca en lo empinado, tierra en caminos y donde se pisa, verde junto al agua).
   Las texturas de suelo de 0 A.D. que ya están en `assets/` dan para cuatro materiales. Variar el tamaño de repetición con la distancia para que no se vea el mosaico.
3. **Cosas que sobresalen**: matas, piedras y arbustos como cartones cruzados, en una sola malla repetida, solo a menos de 60 m de la cámara (tope de unos 1 500). Es lo que más quita el aire de «mesa de billar».
4. **Árboles dentro del campo**, en olivares y lindes, a tamaño real y fijo (quitar el factor `gr`). Con sombra (un borrón oscuro en el suelo basta).
5. **Agua**: `ground.js` ya trae agua; un arroyo con orilla de tierra y brillo del sol.
6. **Lo humano**: camino de tierra, parcelas con linde, una granja o un santuario de 0 A.D. al fondo (`js/gfx/statics.js` ya carga edificios). Skill `arte` para peso y licencias.
7. **Sombras de nubes**: una textura de ruido que se desliza sobre el suelo y oscurece un 15 %. Coste casi nulo y da mucha vida de lejos.
8. **Horizonte de lejos**: bajar algo la cámara general o subir las lomas del fondo para que la vista de dron no acabe en un borde liso.
- **Riesgo en móvil**: el punto 3 (matas) es el único que pesa: tope fijo y solo cerca. La altura obliga a que los cartones lean una textura en el sombreador de vértices: funciona en casi todos los móviles actuales, pero hay que probarlo en el del usuario.
- **Honradez sobre el techo**: con arte de 0 A.D. y un móvil se llega a un aspecto de juego de estrategia de 2010–2013, no al de Rome II en ordenador. El salto desde lo de hoy es, aun así, muy grande.

### 4.K Cámara — M
- `vista.js`: gestos sobre el lienzo. Un dedo: desplazar. Dos dedos: acercar (distancia) y girar (ángulo). Límites: no salir del campo, no bajar del suelo.
- Al acercar, la inclinación baja sola (de 28° de dron a 12° a ras), como en los juegos del género.
- Quitar los saltos automáticos de `mirar()`. La cinta de aviso se hace **tocable**: tocarla lleva la cámara allí.
- Tocar una tropa la elige (ya está) y doble toque acerca.
- De cerca, colocar la cámara en tres cuartos, de lado, con la línea de lucha en el centro de la zona libre de botones.
- **Riesgo**: que tocar la tropa y arrastrar se confundan. Ya hay umbral de 12 px y 600 ms; hay que probarlo con dedo de verdad.

### 4.L Proyectiles y testudo — P
- Proyectiles: grosor mínimo de 1,5 píxeles en vez de barras; piedras como puntos; jabalinas y pila como rayas oscuras; un golpe de polvo al caer; algunas jabalinas clavadas en el suelo y en escudos (reusar la malla de caídos).
- Testudo: quitar la caja. Fila extra en el atlas con el escudo en alto si existe esa pose en 0 A.D.; si no, mantener solo «escudos» (filas apretadas, escudo al frente) y dejar el testudo para asedios.
- Solo se cubre la línea que está a tiro, no las tres.

### 4.M Paso de cartón a figura y peso de cerca — M
- Fundido de 3 a 4 metros en el borde del círculo (trama de puntos en el sombreador, sin transparencias).
- Figura de cerca más ligera: una versión de unos 900 triángulos por tropa hecha con `tools/` (RD1 ya midió la herramienta). De 580 000 a unos 200 000 triángulos de cerca.
- **Medir en el móvil del usuario la vista de cerca**: no se ha hecho nunca.

### 4.N Interfaz — P
- Carteles enemigos: separarlos en vertical si se pisan; flecha en el borde si la tropa no está en pantalla.
- Subtítulos cortos: «pega y cansa», «están enteros».
- Barra de ánimo ancha bajo la cuenta de hombres, con flecha arriba o abajo al cambiar.
- Registro de avisos (los cinco últimos) al tocar la cinta.
- Los botones de lejos y de lucha, con color de fondo distinto, y medio segundo sin responder al cambiar de oficio.
- Quitar «img/s» de la pantalla (dejarlo con `?taller=1`).

### 4.Ñ Limpieza de taller — P
- Cabeceras y créditos a GM11. Partir las líneas largas de `vista.js`. `captura.mjs` sin forzar el estado: partidas con semilla que lleguen solas al relevo y al flanco.
- Activar la regla de espalda o borrarla.
- Que el tamaño del ejército cuente (frente real con 4.B) o decir en pantalla que es solo aspecto.

---

## 5. Lista por prioridad (lo que más cambia lo que el usuario ve, primero)

| N.º | Qué | Qué notará el usuario | Esfuerzo | Depende de |
|---|---|---|---|---|
| 1 | **Despliegue y plan antes de marchar** (4.A corta) | Elige ancho o fondo, disposición y dónde van los jinetes. Las tropas dejan de ir «a lo largo» | M | — |
| 2 | **Ritmo, pausa y velocidad** (4.C) | Batallas de 4 a 6 minutos. Tiempo para mirar y pensar | P | — |
| 3 | **Cámara con los dedos** (4.K) | Arrastra, acerca y gira como en un Total War. La cámara deja de irse sola | M | — |
| 3b | **Terreno que se ve y que juega** (4.J) | Fuera el césped a rayas. Lomas, río, olivar, terreno roto, y sirven a favor o en contra. Se elige dónde formar | G | GM15; completo solo con 6 |
| 4 | **Línea de contacto viva** (4.D) | De cerca por fin se ve pelear. La línea ondula | M | mejor tras 6 |
| 5 | **Caídos tumbados y tierra pisada** (4.G) | Fuera las manchas rojas a cuadros. El campo guarda la huella | P | — |
| 6 | **Esqueleto nuevo: unidades con sitio** (4.B) | Flancos de verdad, caballería que maniobra, persecución, manípulos | G | — |
| 7 | **Formaciones de legión** (4.E) | Manípulos al tresbolillo, líneas finas y anchas | P | 6 |
| 8 | **Sombras y sol bajo** (4.I, puntos 1 y 3) | Los soldados pisan el suelo. Luz de tarde | M | — |
| 9 | **Polvo** (4.H) | Estelas al marchar y nube en la lucha | P | medir en móvil |
| 10 | **Variedad de soldados** (4.F) | Se acaba el ejército de clones | P | — |
| 12 | **Proyectiles y testudo** (4.L) | Lluvia de piedras creíble. Fuera la caja de tejas | P | — |
| 13 | **Interfaz** (4.N) | Carteles legibles, ánimo a la vista, registro | P | — |
| 14 | **Cartón a figura y peso de cerca** (4.M) | Sin escalón al acercar. Más fluido de cerca | M | medir en móvil |
| 15 | **Limpieza de taller** (4.Ñ) | Nada a la vista. Menos fallos después | P | — |

Total aproximado: **12 a 14 sesiones**. Las seis primeras filas (unas 6 sesiones) ya cambian la batalla de arriba abajo.

---

## 6. Veredicto: ¿por partes o rehacer?

**Las dos cosas, y hay que decir cuál es cuál.**

- **El dibujo, por partes.** Cartones, atlas, figuras de cerca, cielo: la base es buena. Lo que falta (lucha, sombras, polvo, caídos, variedad)
  son capas que se añaden encima. No se tira nada.
- **Las reglas del campo, rehacer con otro enfoque.** Los tres pasillos ya no dan más. Se han ido parcheando desde GC1 (frente, hueco, envuelto,
  costado, golpe, cubre…) y cada parche es una bandera que simula algo que no está pasando en ningún sitio. `reglas.js` lleva ya 60 campos por cuerpo.
  Seguir así es volver a pagar cada mejora dos veces.

**El otro enfoque, en claro**
1. El campo es un plano. Cada tropa está en un punto, mira a un lado y ocupa un ancho y un fondo.
2. El campo tiene relieve, bosque, agua y terreno roto, y cada cosa ayuda o estorba según la tropa.
   Antes de empezar, el jugador ve el campo y despliega: dónde forma, ancho o fondo, disposición, caballería. Luego pulsa «Marchar».
3. Se lucha donde dos frentes se tocan. Quien sobresale, dobla. Quien llega por detrás, rompe. Eso lo decide la geometría, no una lista de casos.
4. El jugador manda igual que ahora: tres cuerpos, cuatro órdenes, una pantalla. Se añade arrastrar un cuerpo con el dedo para decirle a dónde ir (lo aprobado en GM10).
5. La caballería es una tropa más, en su ala, con su rival delante.
6. Quien huye sigue en el campo y se le persigue.
7. El dibujo no cambia de técnica: sigue recibiendo «seis números por regimiento».

**Lo que no haría**
- No haría otra maqueta copiando esta. Ese es el error que ya señaló GM6b: cada copia pierde la mitad.
  El esqueleto nuevo se hace **dentro** de `guerra-unica/`: primero `reglas.js` con su prueba, luego la vista.
- No metería nada de esto en `js/` hasta que el usuario lo juegue en su móvil y diga que sí.
- No añadiría elefantes ni falange (GM11b) sobre los tres pasillos. Mejor después del esqueleto nuevo: en pasillos, un elefante vuelve a ser un botón.

**Orden que propongo al usuario (decide él)**
1. Ya, sobre lo que hay: despliegue corto, ritmo con pausa, cámara con dedos, caídos, y el **aspecto** del terreno (puntos 1, 2, 3, 5 y la segunda mitad de 3b). Cinco sesiones. Se nota muchísimo.
2. Después: esqueleto nuevo (punto 6) y, encima, las **reglas** del terreno, lucha viva y manípulos (3b, 4 y 7).
3. Al final: luz, polvo, variedad, peso de cerca.

**Lo que tiene que decidir el usuario**
- ¿Batallas de 4 a 6 minutos con pausa, en vez de 2 minutos sin parar?
- ¿Rehacer el campo (unidades con sitio) antes de GM11b, o seguir con los tres pasillos?
- ¿Cuánta sangre? (tierra oscurecida y caídos, o algo más)
- ¿El testudo se queda en campo abierto como licencia de juego, o pasa solo a los asedios?

---

## Anexo: capturas de apoyo (`gobierno/capturas-tarea/`)
| Captura | Qué enseña |
|---|---|
| `crit-fable-v1-lluvia-lejos.jpg` | Piedras como barras blancas; vélites de pie bajo el tiro |
| `crit-fable-v3-testudo-lejos.jpg`, `v4-testudo-cerca.jpg` | El testudo como caja de tejas; cascos que asoman; carteles enemigos montados |
| `crit-fable-v5-lucha-lejos.jpg`, `h3-lucha-lejos.jpg` | La batalla de lejos: franjas de color apiladas, tres columnas |
| `crit-fable-v6-lucha-cerca.jpg`, `h4-lucha-cerca.jpg` | De cerca: clones de espaldas, nadie lucha, raya limpia |
| `crit-fable-v7-jinetes.jpg` | Carga de caballería ordenada: la cámara baja y los jinetes no se ven |
| `crit-fable-v8-huida-lejos.jpg`, `v9-huida-cerca.jpg` | Huida sin persecución; caídos a cuadros; jinetes negros aparcados |
| `crit-fable-v10-fin.jpg` | Derrota a los 75 segundos |
| `crit-fable-g1-10000-lejos.jpg`, `g2-10000-lucha.jpg` | Con 10 000 se ve igual, más pequeño |
| `crit-fable-p1-pirro-cerca.jpg` | Contra Pirro: mismos problemas |
| `crit-fable-h1-lejos.jpg`, `h2-lluvia.jpg` | En horizontal |
