# Zama · 202 a.C.
**Nota de método**: la red de la sesión solo dejó hacer búsquedas, no abrir LacusCurtius, Perseus ni Livius.org. Los pasajes marcados «sin comprobar» vienen de memoria del historiador o de resúmenes secundarios. Hay que cotejarlos con el texto antes de publicarlos en el juego.

**En una frase**: Escipión derrota a Aníbal en África y acaba la Segunda Guerra Púnica, en gran parte gracias a la caballería númida de Masinisa.

**Qué pasó**: Aníbal vuelve de Italia a Cartago. Los dos generales hablan antes y no pactan. Aníbal pone elefantes delante y tres líneas de infantería detrás. Escipión deja pasillos entre sus manípulos y llena el hueco con vélites. Los elefantes asustados se desvían o pasan por los pasillos. La caballería romana y la númida ahuyenta a la cartaginesa y se aleja persiguiéndola. Las dos primeras líneas púnicas chocan con los romanos. La tercera línea, los veteranos de Aníbal, aguanta hasta que la caballería vuelve por la espalda. Según Polibio, Escipión gana (Polibio 15.9-15).

**Cifras** (no hay cifra única; lo que sigue es lo que consta):
| Dato | Versión | Fuente |
|---|---|---|
| Elefantes de Aníbal | 80 | Polibio 15.11 (comprobado por resumen secundario) |
| Ejércitos | Aníbal ~36.000 de infantería, 4.000 de caballería; Escipión ~29.000 y 6.100 | Aparecen en resúmenes modernos; **sin comprobar** a qué autor antiguo corresponden |
| Cartagineses muertos | ~20.000, e igual número de prisioneros | Polibio 15.14 (visto solo en una cita secundaria, **sin comprobar**) |
| Romanos muertos | ~1.500 | Polibio 15.14 (**sin comprobar**; Livio da una cifra algo mayor, **sin comprobar**) |
| Muertos cartagineses | 25.000 | Apiano (cita secundaria; Apiano, Líbica, **sin comprobar** pasaje) |
| Bajas totales | 20.500 | Orosio (cita secundaria, **sin comprobar**) |

**Despliegue** (histórico, Polibio 15.9-12, de memoria; coincide con los resúmenes):
- Roma: hastati delante, príncipes detrás y triarios al fondo, pero los manípulos en columna, no en tablero de ajedrez, para dejar pasillos rectos. Vélites en los huecos (confirmado por resumen de 15.11). Caballería itálica de Lelio a la izquierda; númidas de Masinisa a la derecha.
- Cartago: elefantes al frente. Después, tres líneas: mercenarios (ligures, galos, baleares, mauros), levas libias y cartaginesas, y los veteranos de Italia más atrás, a distancia. Caballería en las alas.

**Terreno**: llanura abierta, sin río ni colinas relevantes. El lugar **se discute**: Zama Regia, Naraggara (donde las fuentes hablan de un campamento romano) o Margaron. Livio y Polibio no coinciden del todo. Sin comprobar cuál prefiere cada moderno.

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
- **Apiano** da una versión muy distinta de Polibio y Livio: incluye un duelo personal entre Aníbal y Escipión, que los otros no cuentan (Apiano, Líbica 40-47; detalles sin comprobar).
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
- Polibio, *Historias* 15.9-16 (LacusCurtius, libre; sin abrir).
- Livio, *Ab urbe condita* 30.32-35 (Perseus, libre; sin abrir).
- Apiano, *Líbica* 40-47 (versión con duelo).
- Orosio (cita secundaria).
- Lazenby, J. F., *Hannibal's War* (1978).
- Scullard, H. H., *Scipio Africanus: Soldier and Politician* (1970).
- Goldsworthy, A., *The Fall of Carthage* (2000).
