# Zama · 202 a.C.
**Estado de la ficha**: cotejada el 11/11/2026 contra Polibio 15.5-16 (LacusCurtius), Livio 30.29-35 (Perseus) y Apiano, *Púnica* 40-48 (Livius.org): 20 datos cotejados, 2 corregidos, 2 sin comprobar (tabla al final).

**En una frase**: Escipión derrota a Aníbal en África y acaba la Segunda Guerra Púnica, en gran parte gracias a la caballería númida de Masinisa.

**Qué pasó**: Aníbal vuelve de Italia a Cartago. Los dos generales hablan antes y no pactan. Aníbal pone elefantes delante y tres líneas de infantería detrás. Escipión deja pasillos entre sus manípulos y llena el hueco con vélites. Los elefantes asustados se desvían o pasan por los pasillos. La caballería romana y la númida ahuyenta a la cartaginesa y se aleja persiguiéndola. Las dos primeras líneas púnicas chocan con los romanos. La tercera línea, los veteranos de Aníbal, aguanta hasta que la caballería vuelve por la espalda. Escipión gana (Polibio 15.9-15; Livio 30.32-35).

**Cifras** (no hay cifra única; lo que sigue es lo que consta):
| Dato | Versión | Fuente |
|---|---|---|
| Elefantes de Aníbal | más de 80 | Polibio 15.11; Livio 30.33 dice 80 |
| Ejércitos | Polibio: unos 12.000 mercenarios en la primera línea, sin totales. Apiano: Aníbal unos 50.000 hombres y 80 elefantes; Escipión unos 23.000 de a pie y 1.500 jinetes más los númidas. Livio: Masinisa llega con 6.000 de a pie y 4.000 jinetes | Polibio 15.11; Apiano 40-41; Livio 30.29. Las cifras de 36.000 / 29.000 que traía la ficha no están en ningún pasaje leído: son cálculo moderno |
| Cartagineses muertos | más de 20.000, y casi otros tantos prisioneros | Polibio 15.14; Livio 30.35 (132 enseñas y 11 elefantes capturados) |
| Romanos muertos | más de 1.500 (Polibio 15.14); unos 1.500 (Livio 30.35); 2.500 (Apiano) | Polibio, Livio y Apiano |
| Muertos cartagineses | 25.000 muertos y 8.500 prisioneros | Apiano, *Púnica* 47-48 |
| Bajas totales | 20.500 | Orosio (cita secundaria, **sin comprobar**; no está en los sitios permitidos) |

**Despliegue** (histórico, Polibio 15.9-12 y Livio 30.32-33, cotejados):
- Roma: hastati delante, príncipes detrás y triarios al fondo, pero los manípulos en columna, no en tablero de ajedrez, para dejar pasillos rectos. Vélites en los huecos (Polibio 15.9; Livio 30.32). Caballería itálica de Lelio a la izquierda; númidas de Masinisa a la derecha.
- Cartago: elefantes al frente. Después, tres líneas: unos 12.000 mercenarios (ligures, celtas, baleares, mauros), libios y cartagineses, y los hombres traídos de Italia a más de un estadio de distancia (Polibio 15.11; Livio 30.33 los llama tropas itálicas, sobre todo brucios). Caballería en las alas: númidas aliados a la izquierda y caballería cartaginesa a la derecha (Polibio 15.11).

**Terreno**: llanura abierta, sin río ni colinas relevantes. El lugar **se discute**: Polibio sitúa el campamento de Aníbal junto a Zama (15.5) y Livio el romano junto a Naraggara (30.29); Margaron, sin comprobar en los textos abiertos. Sin comprobar cuál prefiere cada moderno.

**Fases de la batalla**:
1. Escaramuza de elefantes y vélites; los elefantes se desvían o cruzan los pasillos.
2. Choque de caballerías; la cartaginesa huye y los romanos la persiguen lejos del campo.
3. Hastati contra la primera línea mercenaria, y apoyo de príncipes (`probable`: reconstrucción de Lazenby, 1978, sin comprobar página).
4. La segunda línea cae sobre los romanos; Escipión reordena sus tres líneas en una sola frente.
5. Choque final contra los veteranos de Aníbal (Polibio 15.13-14).
6. La caballería vuelve por la espalda y decide (Polibio 15.14).

**Vestimenta y armas**: los romanos llevan el equipo manipular: escudo oval grande (scutum), espada corta, pilum y casco. Los veteranos de Aníbal, según la tradición, se armaban con equipo romano capturado (`probable`; sin comprobar fuente antigua concreta). Las tropas libias son lanceros con escudo redondo. Los númidas montan sin silla.

**Lo que se discute**:
- Lugar de la batalla (arriba).
- **Apiano** da una versión distinta de Polibio y Livio: un duelo personal de jabalinas entre Aníbal y Escipión (Púnica 45) y otro entre Masinisa y Aníbal (46), que los otros no cuentan; sus cifras también difieren (arriba).
- Si los pasillos eran tácticas inventadas por Escipión o una simple adaptación a los elefantes (Scullard, 1970, y Goldsworthy, 2000: sin comprobar página).
- Si Aníbal tuvo intención de la tercera línea como reserva (`probable`: Lazenby, 1978).

**En el juego hoy**: coincide el hecho de «Zama» (`js/data.js`, año 202: pasillos y caballería númida de Masinisa, y su fx `masinisa`). El motor tiene elefantes (cls `ele`), caballería (`numidas`) y generales. No hay pasillos ni despliegue por líneas. El despliegue es automático: elefantes al centro, caballería en las alas (`js/battle.js` `deploy`). Todo lo que haga falta de las tres líneas es `licencia de juego`.

**Para jugarla en el motor actual**:
- Roma: `hastati` (cuerpo), `principes`, `triarii` en proporción 2:2:1, `velites`, `equites` y `numidas` como aliados. Sin números reales.
- Cartago: `honderos`, `iberos`, `galos` (mercenarios), `libios`, `elefantes`, `numidas` (cavalry cartaginesa), general. No hay unidad «veteranos de Aníbal» (pequeño: nueva unidad).
- Falta, con coste: pasillos para elefantes (medio); tres líneas de Aníbal con la tercera retenida (medio); vuelta de caballería por la espalda (medio, el motor ya tiene flanqueo); pánico de elefantes que arrolla a los suyos (medio; el motor da a `ele` masa y hp, pero no hay búsqueda del efecto de pánico, sin comprobar); terreno plano (ya vale, pequeño).

**Cambios que propongo**:
- Escenario «Zama» predefinido con proporciones de arriba (pequeño).
- Nueva unidad `veteranos` púnica o variante de `libios` más moral (pequeño).
- Pasillos y pánico de elefantes (medio).
- Orden «reserva» para retener la tercera línea (medio).

**Fuentes**:
- Polibio, *Historias* 15.5-16 (LacusCurtius, cotejado).
- Livio, *Ab urbe condita* 30.29-35 (Perseus, traducción de Foster, cotejado).
- Apiano, *Púnica* 40-48 (Livius.org, traducción de White, cotejado).
- Orosio (cita secundaria).
- Lazenby, J. F., *Hannibal's War* (1978).
- Scullard, H. H., *Scipio Africanus: Soldier and Politician* (1970).
- Goldsworthy, A., *The Fall of Carthage* (2000).


---
**Revisión del director (11/11/2026)**: la ficha ya no es provisional; ver la sección «Cotejo» al final.

## Cotejo (11/11/2026)
Textos abiertos: Polibio en LacusCurtius (Paton), Livio en Perseus (Foster), Apiano en Livius.org (White).

| Dato | Cita | Estado | Enlace | Nota |
|---|---|---|---|---|
| Conversación sin acuerdo; batalla al día siguiente al amanecer | Polibio 15.9.1-2 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#9 | Coincide con la ficha. |
| Hastati delante, príncipes detrás sin alinearse con los huecos, triarios al final | Polibio 15.9.6-8 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#9 | Por los elefantes, los manípulos quedan en columna. |
| Lelio con la caballería itálica a la izquierda, Masinisa con los númidas a la derecha | Polibio 15.9.8 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#9 | Livio 30.32 coincide. |
| Vélites en los huecos de la primera línea; se retiran por pasillos rectos | Polibio 15.9.9-10 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#9 | Coincide con la ficha. |
| Manípulos separados para dejar paso a los elefantes; vélites en los huecos | Livio 30.32 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Liv.+30.32 | Los vélites pueden huir o abrirse a los lados. |
| Más de 80 elefantes delante; unos 12.000 mercenarios (ligures, celtas, baleares, mauros) | Polibio 15.11.1 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#11 | La ficha decía «80»; Polibio dice «más de ochenta». |
| Segunda línea de libios y cartagineses; los de Italia a más de un estadio atrás | Polibio 15.11.2 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#11 | Coincide con la ficha. |
| Númidas aliados a la izquierda, caballería cartaginesa a la derecha | Polibio 15.11.3 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#11 | Coincide con la ficha. |
| 80 elefantes, número nunca antes usado por Aníbal | Livio 30.33 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Liv.+30.33 | Tercera línea itálica, sobre todo brucios, separada por un espacio. |
| Elefantes asustados vuelven contra los númidas; otros por los pasillos | Polibio 15.12.1-4 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#12 | Masinisa deja al descubierto el ala izquierda cartaginesa. |
| Elefantes contra el ala izquierda de Aníbal; vélites los hostigan | Livio 30.34 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Liv.+30.34 | Coincide. |
| Lelio persigue a la caballería cartaginesa | Polibio 15.12.5-6 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#12 | Masinisa también persigue. |
| Mercenarios cercan al principio; cartagineses no los apoyan; Aníbal no deja entrar a los fugitivos | Polibio 15.13 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#13 | Los hastati y príncipes los rematan. |
| Escipión forma una sola línea frente a los veteranos | Polibio 15.14.1-5 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#14 | Ficha: «reordena sus tres líneas en un frente»; Polibio: príncipes y triarios cierran por los lados. |
| Lelio y Masinisa vuelven y atacan por la espalda | Polibio 15.14.7-8 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#14 | Coincide con la ficha. |
| Más de 1.500 romanos; 20.000 cartagineses muertos y casi igual número de prisioneros | Polibio 15.14.9 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#14 | Antes marcado «visto en cita secundaria». |
| Más de 20.000 muertos y casi otros tantos presos; unos 1.500 romanos | Livio 30.35 | corregido | https://www.perseus.tufts.edu/hopper/text?doc=Liv.+30.35 | La ficha decía «Livio da cifra algo mayor»; Livio dice unos 1.500, igual que Polibio. |
| Zama a cinco jornadas de Cartago; Aníbal acampa allí | Polibio 15.5.3 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#5 | Escipión junto a Naraggara en Livio 30.29. |
| Escipión junto a Naraggara | Livio 30.29 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Liv.+30.29 | Masinisa llega con 6.000 de a pie y 4.000 jinetes. |
| Duelo de jabalinas entre Escipión y Aníbal | Apiano, *Púnica* 45 | cotejado | https://www.livius.org/sources/content/appian/appian-the-punic-wars/appian-the-punic-wars-9/#45 | Hay otro duelo, Masinisa contra Aníbal, en 46. |
| 25.000 muertos y 8.500 prisioneros; romanos 2.500 | Apiano, *Púnica* 47-48 | cotejado | https://www.livius.org/sources/content/appian/appian-the-punic-wars/appian-the-punic-wars-10/#48 | Aníbal con unos 50.000 y 80 elefantes (40); Escipión unos 23.000 de a pie y 1.500 jinetes (41). |
| Ejércitos: 36.000 + 4.000 (Aníbal) y 29.000 + 6.100 (Escipión) | ficha anterior | corregido | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html#11 | Ningún pasaje leído da esas cifras; son cálculo moderno. Cuerpo corregido con lo que sí dicen Polibio, Apiano y Livio. |
| Margaron como posible lugar | sin autor | sin comprobar | | No aparece en las traducciones abiertas. |
| Bajas totales de 20.500 | Orosio | sin comprobar | | Orosio no está en los sitios permitidos. |
