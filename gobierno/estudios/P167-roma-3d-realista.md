# P167 · Roma y las ciudades en 3D «como si fueran de verdad» · plan (17/11/2026)

Solo plan. No se ha tocado el juego. Lo aprueba el usuario antes de construir nada.

**Pedido (literal)**: «esa visión desde la colina realista»; usar la ciudad 3D del juego, «pero es que habría que
mejorar muchísimo el 3D que ya hay pero es lo que quiero. Replicar la Roma y las ciudades con IA como si fueran de verdad».

## 1. Dónde estamos hoy
La ciudad 3D vive en `js/gfx/city3d.js` (cámara, luz, casas, calles), `statics.js` (edificios y árboles) y `ground.js`
(suelo, agua, cielo). Las piezas son de 0 A.D. (`assets/static/`, 9 MB; todo el arte pesa 29 MB de un tope de 37).

Tres capturas propias a 390 px, bajando la cámara a la altura de una colina (hoy el juego no deja bajar tanto):
- `capturas-tarea/P167-1-colina.jpg` — Roma desde lejos. 88 000 triángulos (el tope es 300 000) y 41 llamadas de dibujo.
- `capturas-tarea/P167-2-colina-cerca.jpg` — a media distancia.
- `capturas-tarea/P167-3-calle.jpg` — a pie de calle.

**Lo que ya está bien**: cielo, bruma a lo lejos, sombras, luz cálida según la estación, humo, río.
**Lo que delata que es un juego** (por orden de lo que más se nota):
1. **Hay muy pocas casas**. Se ve una aldea con empalizada, no una ciudad. Es lo que más aleja de «Roma de verdad».
2. **El suelo es una mancha marrón** borrosa: sin hierba, sin empedrado, sin huertos.
3. **No hay colinas dentro de la ciudad** ni un mirador: Roma sin Capitolio ni Palatino no es Roma.
4. **De cerca, las paredes y tejas se ven borrosas** (texturas pequeñas) y los árboles son cartones.
5. **Las antorchas son bolas de luz** sobre un palo blanco; de día sobran.
6. **No hay nada reconocible**: ni templo de Júpiter, ni muralla de piedra, ni puente, ni Foro con puestos.

## 2. Caminos posibles
Peso = megas que suma a la descarga. Móvil = riesgo de que vaya lento (aquí no se puede medir: lo prueba el usuario).

| Camino | Qué da | Contras | Peso | Móvil |
|---|---|---|---|---|
| **A. Mirador y relieve** (cámara baja desde una colina; las colinas de Roma y el Tíber) | La vista que pide. Sin arte nuevo | Hay que rehacer el terreno de Roma | 0 | Sin riesgo |
| **B. Luz, sombras y bruma** (bruma por alturas, hora dorada, sombras finas cerca, antorchas solo de noche) | Mucho por poco; ya hay base | Solo no basta: la luz buena sobre poca ciudad sigue siendo poca ciudad | 0 a 1 MB | Bajo |
| **C. Texturas reales libres** (ambientCG y Poly Haven, **CC0**: toba, estuco, teja, tierra, hierba, empedrado) | Suelo y muros creíbles de cerca | Hay que casarlas con el arte de 0 A.D. para que no desentone | 4 a 6 MB | Bajo |
| **D. Ciudad densa** (cientos de casas e ínsulas repetidas con la misma pieza, calles, huertos, gente) | El salto mayor: pasa de aldea a ciudad | Trabajo de código; la partida debe seguir leyéndose | 0 a 2 MB | Medio: hay margen (88 000 de 300 000) |
| **E. Modelos hechos con IA** (templo de Júpiter, puerta, puente…) | Edificios únicos que 0 A.D. no tiene | Salen muy pesados y hay que aligerarlos; a veces con errores de época (mármol, arcos imperiales); estilo distinto al resto | 1 a 2 MB por pieza | Medio |
| **F. Fondo pintado** (un panorama lejano: montes Albanos, campiña, Tíber) | Horizonte «de cuadro» casi gratis | Es plano: no gira bien si la cámara se mueve mucho; la IA tiende a pintar el Coliseo | 0,5 a 1 MB | Sin riesgo |
| **G. Fotogrametría libre** (rocas, muros y árboles escaneados, Poly Haven CC0) | Rocas y troncos de verdad | De edificios romanos solo hay **ruinas**, no sirven como ciudad viva; pesan mucho | 1 a 3 MB por pieza | Alto |

### Licencias de las herramientas de IA (miradas el 17/11; se vuelven a comprobar en su página el día que se usen)
- **Meshy, plan de pago** (unos 20 $ al mes): el modelo es **del usuario**. Puede publicarlo con la licencia que quiera. ✔
- **Meshy, plan gratis**: sale con **CC BY 4.0** (obliga a poner «hecho con Meshy»). Se puede usar, con ese crédito. ✔ con nota
- **Tripo, plan gratis**: Tripo se queda los derechos. ✘ (de pago, sí.)
- **Hunyuan3D** (Tencent): su licencia **excluye la Unión Europea**. ✘
- **TRELLIS** (Microsoft, licencia MIT): libre, pero necesita una tarjeta gráfica que aquí no hay. Aparcado.
- **Imágenes de ChatGPT**: OpenAI cede el resultado al usuario; él puede publicarlas con licencia libre. ✔
- Texturas de **ambientCG** y **Poly Haven**: CC0 (dominio público). ✔ Sin obligación de crédito; se pone igual.

Tres avisos de licencia, en llano:
1. Lo nuevo **no hace falta que sea CC BY-SA**: CC0 o CC BY conviven con el arte de 0 A.D. si cada pieza lleva su ficha.
   Lo que sí hereda CC BY-SA 3.0 es lo que se **derive** de 0 A.D. (retocar una casa suya, por ejemplo).
2. Al pedir a la IA una imagen o un modelo, **nunca** se le da una captura de un juego comercial ni se le pide «como
   Rome II». Se le describe la Roma histórica (apartado 3).
3. Meshy y las imágenes de IA no están en la lista de fuentes aprobadas el 16/11 (Kenney, Quaternius, OpenGameArt):
   añadirlas es decisión del usuario (pregunta 2).

**Quién genera**: estas sesiones no pueden entrar en Meshy ni en ChatGPT. Los modelos y el fondo los generaría el
usuario desde su móvil, con un encargo escrito por nosotros, y los subiría al repositorio o al chat.

## 3. Fidelidad histórica (qué había en 264–146 a.C.)
**Roma** — una ciudad de toba, adobe, madera y teja; apretada, parda y rojiza. Nada de blanco imperial.
- **Muralla serviana**: sillares de toba amarillenta de Grotta Oscura, unos 11 km, del siglo IV a.C. (Livio 6.32). `histórico`
- **Templo de Júpiter en el Capitolio**: podio de toba, columnas y techo de madera, adornos de terracota pintada; la
  cuadriga del tejado, de bronce desde 296 a.C. (Livio 1.55-56 y 10.23; Dionisio 4.61). Es **el** edificio a reconocer. `histórico`
- **Foro**: plaza de tierra y losas con puestos (tabernae), la Curia, el Comicio y los Rostra (desde 338 a.C.). Las
  basílicas llegan tarde: Porcia en 184 y Emilia en 179 (Livio 39.44 y 40.51). `histórico`
- **Casas**: casas de atrio y bloques de pisos; en 218 a.C. un buey subió a un tercer piso (Livio 21.62). Tejados de
  tablilla de madera hasta la guerra de Pirro, luego teja (Plinio, *Hist. Nat.* 16.36). Incendios de 213 y 210 (Livio 24.47, 26.27). `histórico`
- **Puentes**: el Sublicio, de madera. El Emilio, pilares de piedra en 179 y arcos en 142 (Livio 40.51). `histórico`
- **Agua**: Aqua Appia (312) y Anio Vetus (272), casi enteros **bajo tierra** (Frontino, *De aq.* 1.5-6). Los arcos
  largos son de la Marcia, 144 a.C.: solo al final. `histórico`
- **Circo Máximo**: una vaguada con gradas y cuadras de madera (Livio 8.20). `histórico`
- **Lo que NO había**: Coliseo (80 d.C.), teatros de piedra (55 a.C.), termas, arcos de triunfo imperiales, cúpulas,
  mármol (el primer templo de mármol es de 146 a.C.; Veleyo 1.11), ladrillo cocido a la vista.
- **Lo que se discute**: cuánta gente vivía (de 150 000 a 400 000 según quién) y cómo eran de altas las casas.
- Obras modernas: Coarelli, *Rome and Environs* (2007); Claridge, *Rome* (2010); Cornell, *The Beginnings of Rome* (1995);
  Davies, *Architecture and Politics in Republican Rome* (2017).

**Otras ciudades con rasgo propio** (cada una pide su ficha de `historia` antes de hacerse):
- **Cartago**: colina de Byrsa, casas de hasta seis pisos, puerto redondo de guerra, triple muralla (Apiano, *Púnica* 95-96 y 128).
- **Siracusa**: isla de Ortigia, meseta de Epípolas, teatro griego; Marcelo la miró desde lo alto antes de tomarla (Livio 25.24).
- **Tarento**: acrópolis en la punta y gran puerto interior (Polibio 8.34; Estrabón 6.3.1).
- **Cartago Nova**: cinco cerros y una laguna (Polibio 10.10).
- **Capua**: llana y rica, la segunda de Italia (Livio 7.31). **Poblados galos e íberos**: madera, adobe y cerro fortificado.

## 4. Recomendación
**Ir por capas, de la más barata a la más cara, y parar a mirar tras cada una.** El orden: A + B (mirador, relieve,
luz) → D (ciudad densa) → C (texturas reales) → F (fondo) → E (tres o cuatro edificios únicos con IA) → llevarlo al juego.
La fotogrametría (G) se deja fuera, salvo rocas sueltas.

Por qué: lo que hoy más falla no es la calidad de cada casa, sino que hay pocas y están en un llano marrón. La IA
ayuda donde 0 A.D. no llega (el templo de Júpiter, el puente, el fondo), no para rehacer toda la ciudad.

**Hasta dónde se puede llegar, sin engaños**: en un móvil y dentro del navegador se llega a «buen juego histórico en
3D» (una Roma que se reconoce, densa y con luz bonita). No a foto ni a película. La primera maqueta dirá cuánto.

### Plan (una sesión por tarea; dirige Fable, construye un agente Opus)
Todo se hace primero en **maqueta aparte** (`gobierno/maquetas/roma-colina/`), sin tocar el juego, hasta R6.

| Tarea | Qué se entrega | M |
|---|---|---|
| **R1 Mirador** | Maqueta: Roma con sus colinas y el Tíber, cámara desde el Janículo, luz y bruma nuevas, con el arte de hoy. El usuario la abre en el móvil y dice imágenes por segundo | 1,2 |
| **R2 Ciudad densa** | De 30 casas a varios cientos, ínsulas, calles torcidas, huertos; lo lejano simplificado | 1,3 |
| **R3 Texturas reales** | Toba, estuco, teja, tierra, hierba y empedrado CC0, con su ficha y crédito | 1,0 |
| **R4 Historia de Roma** | Ficha `gobierno/historia/roma-ciudad.md` con fuentes cotejadas y plano de dónde va cada cosa (agente Sonnet) | 0,4 |
| **R5 Edificios únicos y fondo** | Templo de Júpiter, puerta de la muralla, puente Sublicio, Foro; fondo pintado. Con IA si el usuario lo aprueba; si no, montados con piezas de 0 A.D. | 1,4 |
| **R6 Al juego** | Pasarlo a `city3d.js` con interruptor «calidad alta / normal», jueces en APTO | 1,5 |
| **Total Roma** | | **≈ 6,8** |
| R7+ Otra ciudad (Cartago, Siracusa…) | Reutiliza todo lo anterior; ficha de historia y dos o tres piezas propias | ≈ 1,2 cada una |

**Puntos de parada**: tras R1 (1,2 M) el usuario ve la vista y decide si sigue. Tras R3 (3,5 M) ya se sabe el techo
de realismo sin IA. Si una tarea pasa de su cifra en un 30 %, se para y se pregunta.

**Riesgos**: (1) rendimiento sin medir aquí: cada maqueta lleva contador de imágenes por segundo. (2) Los modelos de
IA pueden no valer tras aligerarlos: se prueba **uno** antes de pagar más. (3) La descarga sube de 29 a unos 40 MB.

## 5. Lo que decide el usuario
1. **¿Hasta dónde apruebas ahora?** (A) solo R1, la maqueta del mirador, y decido al verla [recomendado]; (B) todo Roma, R1 a R6, ≈6,8 M; (C) a la nevera hasta la 1.0.
2. **¿Modelos hechos con IA?** (A) sí, tres o cuatro edificios únicos; los genero yo en Meshy de pago (unos 20 $, un mes) con vuestro encargo [recomendado]; (B) sí, con Meshy gratis y el crédito «hecho con Meshy, CC BY 4.0»; (C) no, solo piezas de 0 A.D. y texturas libres.
3. **¿Fondo pintado?** (A) lo genero yo con ChatGPT con vuestro encargo y lo publico como dominio público (CC0) [recomendado]; (B) sin imagen: horizonte hecho por el juego.
4. **¿Subir el tope de descarga de 37 a 50 MB?** (A) sí [recomendado; ya lo aceptaste para las tropas]; (B) no, que quepa en 37.
5. **¿Qué Roma se ve?** (A) una sola, hacia 200 a.C. [recomendado, más barato]; (B) que cambie con la partida: en 280 más madera, en 150 ya con basílicas (unos 1,5 M más).

Fuentes de licencias: docs.meshy.ai/pricing · help.meshy.ai (propiedad de los modelos) · tripo3d.ai/help (uso comercial) ·
huggingface.co/tencent/Hunyuan3D-2 (LICENSE) · polyhaven.com/license · docs.ambientcg.com/license
