# H1 — Auditoría histórica de los 16 hechos de la campaña

**Resumen.**
Los 16 hechos de `D.EVENTS` (`js/data.js`, líneas 128-147) son en su mayoría sólidos. Hay un error claro (Pirro «marcha sobre Roma» en 277), un dato atribuido a la persona equivocada (Duilio no «inventó» el corvus según Polibio) y varias frases que son leyenda o tradición, no cita antigua.
Los efectos de juego (`fx`) y los ataques de facciones son licencia de juego y quedan marcados como tal.
**Estado de las citas:** cotejadas contra el texto el 11/11/2026 (Perseus, LacusCurtius, Livius.org): 55 cotejados, 10 corregidos y 17 sin comprobar. Las marcas (S) y (†) de la tabla son de la primera pasada; vale lo que digan las dos secciones «Cotejo» del final.

Etiquetas: `histórico`, `probable`, `licencia de juego`, `anacronismo`.
Costes de cambio: «texto» (solo cambiar palabras), «pequeño», «medio».

## Facciones (`D.FACTIONS`, campo `from`)

| Facción | `from` | Dictamen |
|---|---|---|
| Cartago | 264 | `licencia de juego`. La guerra empieza en 264 (Polibio 1.10-11 †), pero «atacar tus ciudades vecinas» es mecánica de juego. |
| Epiro | 279 | `licencia de juego`. Pirro estuvo en Italia 280-275 (salvo 278-276 en Sicilia). El evento está fechado en 277: inconsistente con `from: 279`. Ver fila de 277. |
| Macedonia | 214 | `licencia de juego`. Filipo V nunca atacó Italia; la guerra se libró en Iliria y Grecia (Livio 24.40 †; 26.24 †). |
| Galos ínsubres | 270 | `licencia de juego`. No hay ataque gálico a Roma en 270; el siguiente gran peligro es 225 (Polibio 2.22-23 (S)). Hubo guerras con boyos en 238-236 (Polibio 2.21 †). |

## Tabla de hechos

| Año y título | En el juego (lo que afirma) | Según las fuentes | Etiqueta | Fuente | Cambio propuesto |
|---|---|---|---|---|---|
| **280** · «Ab urbe condita CDLXXIV» | Año 474 de Roma. | Con la fundación en 753 a.C. (cómputo de Varrón), 280 a.C. es el año 474. Pero los romanos fechaban por cónsules; contar desde la fundación es un hábito posterior. | `histórico` (cuenta correcta) | Varrón, según Aulo Gelio y Censorino (†, pasaje sin comprobar). | Ninguno. Opcional: añadir «(según el cómputo de Varrón)». Coste: texto. |
| 280 · idem | Pirro «acaba de desembarcar en Tarento con 25.000 hombres y veinte elefantes». | Plutarco da 20.000 infantes, 3.000 jinetes, 2.000 arqueros, 500 honderos y 20 elefantes: unos 25.500. Año de llegada: 280 (algunos autores, finales de 281). | `probable` | Plutarco, *Pirro* 15 (†). | Sin cambio. Coste: —. |
| 280 · idem | «Cartago reina en el mar, los griegos en el sur y los galos acechan en el norte». | Panorama general correcto. | `histórico` | Polibio 1.1-3, 2.14-21 (†). | Ninguno. |
| 280 · idem | «Tu misión: destruir Cartago antes del 146». «Si Roma cae…». | Objetivo del jugador. | `licencia de juego` | — | Ninguno. |
| **277** · «Pirro marcha sobre Roma» | Pirro avanza al norte en 277. | **Error de fecha.** Su marcha hacia Roma fue en 280, tras Heraclea: llegó a unos 300 estadios (unos 55 km) de Roma según Plutarco, *Pirro* 17.5; Apiano lo lleva hasta Anagnia (Anagni) y lo hace volver a Campania; Preneste no sale en los textos cotejados. En 278-276 estaba en Sicilia. Vuelve a Italia en 276 y es frenado en Benevento (275). | `anacronismo` (fecha mal) | Plutarco, *Pirro* 17 (†), 22-25 (†); Eutropio 2.12 (†). Autor moderno para Pirro: **sin comprobar**. | Mover el hecho a 280 o 279 («Pirro avanza hacia Roma») o cambiar texto: «Pirro vuelve de Sicilia en 276». Coste: pequeño (hay que cambiar `from: 279` de Epiro o el año). |
| 277 · idem | Heraclea (280) y Ásculo (279) fueron victorias «costosas». | Cierto: ganó ambas con muchas bajas. | `histórico` | Plutarco, *Pirro* 17, 21 (S). | Ninguno. |
| 277 · idem | «Otra victoria como esta y estaré perdido». | Plutarco lo pone en boca de Pirro tras **Ásculo** (279). Hay traducciones con «otra victoria así nos arruinará». Es cita de Plutarco, no de testigo. | `probable` | Plutarco, *Pirro* 21 (S). | Texto: añadir «según Plutarco». Coste: texto. |
| 277 · idem | Los romanos llaman a los elefantes «bueyes lucanos». | Cierto: se vieron por primera vez en Lucania. Pirro tenía 20 en 280; el nombre aparece en autores latinos. | `histórico` | Plinio, *Hist. Nat.* 8.16 (†); Varrón, *De ling. lat.* 7.39 (†). El resumen de búsqueda **no** confirmó la anécdota. | Texto: «los llaman "bueyes lucanos" por haberlos visto en Lucania». Coste: texto. |
| 277 · idem | `fx: 'pirro'`: ejército epirota ataca tus tierras. | Pirro nunca atacó «tus tierras» así. | `licencia de juego` | — | Ninguno. |
| **272** · «La caída de Tarento» | Pirro dejó Italia tras Benevento (275); Tarento se rindió en 272. | Pirro dejó Italia en 275 (Benevento, resultado discutido: empate o derrota). Murió en Argos en 272. Tarento fue tomada por Roma en 272. | `histórico` | Plutarco, *Pirro* 25, 34 (†); Livio, *Períocas* 14 (†); Zonaras 8.6 (†). Resumen de búsqueda de acuerdo (S). | Ninguno. |
| 272 · idem | «Toda la Italia peninsular quedó bajo control romano». | Exagerado: quedaba el norte (Galia Cisalpina) sin dominar, hasta la guerra de 225-222. | `probable` | Polibio 2.21-35 (S/†). | Texto: «toda la Italia al sur del Arno». Coste: texto. |
| 272 · idem | `fx: 'pirroSeVa'`. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **264** · «Primera Guerra Púnica» | Los mamertinos de Messana, amenazados por Siracusa y Cartago, piden ayuda a Roma. | Cierto: Hierón II de Siracusa los presionaba y los cartagineses ocupaban su ciudadela. | `histórico` | Polibio 1.10-11 (†). | Ninguno. |
| 264 · idem | «El Senado cruza el estrecho». | Matiz: el Senado dudó y pasó la decisión al pueblo, que votó la ayuda (Polibio 1.11). Apio Claudio cruzó con el ejército. | `probable` | Polibio 1.11 (†). | Texto: «el pueblo romano vota ayudarlos». Coste: texto. |
| 264 · idem | «Una guerra de 23 años». | De 264 a 241 hay 23 años cumplidos; Polibio la cuenta como de 24 años seguidos. | `probable` | Polibio 1.63.4 (†). | Texto: «una guerra de más de 20 años» o «24 años según Polibio». Coste: texto. |
| 264 · idem | «Las guarniciones cartaginesas atacarán tus ciudades vecinas». | Mecánica de juego (hubo incursiones navales cartaginesas en la costa italiana, pero no un frente terrestre). | `licencia de juego` | — | Ninguno. |
| **260** · «La batalla de Milas» | Roma construye su primera gran flota copiando una nave púnica varada. | Polibio lo cuenta: una quinquerreme cartaginesa varada sirvió de modelo. Los modernos dudan de lo literal (Roma ya tenía algunos barcos). La flota: 100 quinquerremes y 20 trirremes. | `probable` | Polibio 1.20 (S, de resúmenes). Moderno: Lazenby, *The First Punic War* (1996), páginas **sin comprobar**. | Texto: «según Polibio». Coste: texto. |
| 260 · idem | «El cónsul Duilio inventa el corvus». | **Corregir.** Polibio describe el corvus (pasarela de abordaje, unos 11 m de largo y 1,2 m de ancho) pero **no dice** que lo inventara Duilio: escribe que «alguien» les sugirió construirlo, sin nombre (1.22). Duilio mandó la flota tras la captura de su colega Cneo Cornelio Escipión Asina. | `anacronismo` (atribución errónea) | Polibio 1.22 (S); 1.21 (†) sobre Escipión Asina. | Texto: «los romanos usan el corvus, un puente de abordaje; Duilio manda la flota». Coste: texto. |
| 260 · idem | Duilio vence en Milas. | Cierto. Polibio 1.23: Duilio gana a la flota cartaginesa (130 naves). Bajas cartaginesas: unas 50 naves. | `histórico` | Polibio 1.23 (S). | Ninguno. |
| 260 · idem | `fx: 'corvus'`: travesías marítimas +30 % de velocidad. | El corvus hacía los barcos romanos más torpes, no más rápidos. | `licencia de juego` | — | Texto del hecho debe decir que es un bono de juego. Coste: texto. |
| **241** · «Las islas Egadas» | La flota de Lutacio Cátulo destruye a la cartaginesa frente a las Egadas. | Cierto: batalla del 10 de marzo de 241; los cartagineses perdieron 50 naves hundidas y 70 apresadas. | `histórico` | Polibio 1.60-61 (†). | Ninguno. |
| 241 · idem | Cartago evacúa Sicilia y paga 3.200 talentos de plata. | Primer acuerdo: 2.200 talentos en 20 años. Roma lo mejoró: sumó 1.000 talentos más y acortó el plazo a 10 años. Suma 3.200. Las versiones de resumen difieren en el calendario de pagos. | `histórico` (cifra) · calendario sin comprobar | Polibio 1.62-63 (S, resúmenes; texto †). | Texto: «paga 3.200 talentos en total». Coste: texto. |
| 241 · idem | `fx: 'egadas'`: indemnización si controlas ciudades en Sicilia. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **225** · «La invasión gala: Telamón» | Galos ínsubres, boyos y gesatas cruzan los Apeninos. | Los pueblos fueron ínsubres, boyos, tauriscos y gesatas (mercenarios transalpinos). Faltan los tauriscos. | `histórico` (falta uno) | Polibio 2.22-23 (S). | Texto: añadir «tauriscos». Coste: texto. |
| 225 · idem | «70.000 guerreros». | Polibio: 50.000 infantes y 20.000 jinetes y carros: 70.000 en total. La cifra de jinetes es muy alta; los modernos la bajan. Diodoro da cifras mucho mayores (200.000). | `probable` (cifra «según Polibio») | Polibio 2.23 (S). Diodoro 25.13 (†). | Texto: «unos 70.000 según Polibio». Coste: texto. |
| 225 · idem | «Roma, aterrada por el saqueo de 390, moviliza a toda Italia». | Roma y los aliados reclutaron cifras enormes (Polibio da más de 700.000 infantes disponibles). El saqueo gálico es el de Breno; 390 es la fecha de Varrón; Polibio lo sincroniza con 387/386. | `probable` | Polibio 2.23-24 (†), 2.18 (†). | Texto: «hacia 390». Coste: texto. |
| 225 · idem | Los aplasta en Telamón. | Cierto: Polibio dice 40.000 gálicos muertos y 10.000 prisioneros; el cónsul Régulo murió. | `histórico` | Polibio 2.27-31 (†). | Ninguno. |
| 225 · idem | `fx: 'telamon'`: horda gala ataca tus ciudades. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **218** · «Aníbal cruza los Alpes» | Tras tomar Sagunto, cruza Pirineos, Ródano y Alpes con elefantes. | Sagunto cae en 219 (asedio de ocho meses). Aníbal parte en primavera de 218. Llega a Italia con unos 20.000 infantes y 6.000 jinetes; los elefantes casi todos mueren después del Trebia, por el frío (Polibio 3.74: sobrevive uno). | `histórico` | Polibio 3.17, 3.34, 3.50-56 (†), 3.74 (†). | Texto: añadir «(219)» tras Sagunto. Coste: texto. |
| 218 · idem | Vence en el Tesino y en el Trebia. | Cierto: Tesino (noviembre) y Trebia (diciembre) de 218. | `histórico` | Polibio 3.64-65 (†), 3.70-74 (†). | Ninguno. |
| 218 · idem | «¡Aníbal ad portas!». | Locución proverbial atestiguada en autores latinos tardíos; no es lo que dijo nadie en 218. | `probable` (frase de época posterior) | Cicerón, *Filípica* 1.11 (†, sin comprobar). | Opcional: «los romanos dirán más tarde…». Coste: texto. |
| 218 · idem | `fx: 'anibal1'`. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **216** · «El desastre de Cannas» | Aníbal envuelve y aniquila a ocho legiones. | Roma puso ocho legiones y un número igual de aliados (Polibio 3.107: unos 80.000 infantes y 6.000 jinetes). Aníbal tenía unos 40.000 infantes y 10.000 jinetes. Envolvimiento: cierto. | `histórico` | Polibio 3.107, 3.113-117 (S/†); Livio 22.36, 22.47-49 (†). | Ninguno. |
| 216 · idem | «50.000 romanos muertos». | Polibio: unos 70.000 infantes muertos (más 5.630 jinetes, que parecen incluidos entre muertos o capturados); Livio: 45.500 infantes y 2.700 jinetes: 48.200. La cifra de 50.000 aparece en Plutarco (*Fabio* 16) y Apiano (*Aníbal* 25), ambos †. | `probable` (cifra «según Livio»; Polibio da más) | Polibio 3.117 (S); Livio 22.49 (S). | Texto: «entre 48.000 y 70.000 muertos, según Livio y Polibio». Coste: texto. |
| 216 · idem | «En una tarde». | La batalla duró desde la mañana hasta la tarde (varias horas); el 2 de agosto de 216. | `probable` | Polibio 3.115-117 (†); Livio 22.46-49 (†). | Texto: «en un solo día». Coste: texto. |
| 216 · idem | «La peor derrota de la República». | Una de las peores; la comparte con Arausio (105). | `probable` | Livio 22.54 (†) para la reacción romana. | Texto: «una de las peores». Coste: texto. |
| 216 · idem | Capua y otras ciudades se pasan al enemigo; Roma se niega a negociar. | Capua pasó a Aníbal en 216. Roma no rescató a los prisioneros ni admitió a su enviado. | `histórico` | Polibio 3.118 (†); Livio 23.2-10 (†), 22.58-61 (†). | Ninguno. |
| 216 · idem | `fx: 'anibal2'`: segundo ejército de Aníbal ataca. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **214** · «Filipo V de Macedonia» | Filipo, aliado de Aníbal, abre frente en Iliria: Primera Guerra Macedónica. | Filipo firmó tratado con Aníbal en 215 (texto en Polibio); en 214 atacó Orico y asedió Apolonia. La guerra suele fecharse 215/214-205. | `histórico` (año aceptable) | Polibio 7.9 (S, el texto del tratado); Livio 23.33-39 (S), 24.40 (S/†). Moderno: Walbank, *Philip V of Macedon* (1940) (†, sin comprobar págs.). | Texto: «tras su pacto con Aníbal (215), ataca Iliria en 214». Coste: texto. |
| 214 · idem | «Macedonia atacará las ciudades romanas vecinas». | Filipo nunca llegó a Italia; Roma lo contuvo con una flota y aliados etolios. | `licencia de juego` | Livio 26.24 (†). | Dejar claro que es mecánica. Coste: texto. |
| **212** · «Arquímedes y Siracusa» | Marcelo toma Siracusa tras dos años de asedio. | Marcelo ataca en 213/214 y la ciudad cae en 212 (otoño). Fecha 212 aceptada. | `histórico` | Livio 24.33-34 (†), 25.23-31 (†); Plutarco, *Marcelo* 14-19 (†). | Ninguno. |
| 212 · idem | Máquinas de Arquímedes: garras que volcaban naves y catapultas de precisión. | Cierto en lo esencial: «manos de hierro» y catapultas ajustadas a distancia. | `histórico` | Polibio 8.5-7 (†); Plutarco, *Marcelo* 15-17 (†). | Ninguno. |
| 212 · idem | «Muere a manos de un soldado». | Cierto, pero con versiones: Livio dice que lo mató un soldado que no lo reconoció; Plutarco da tres versiones. Marcelo se afligió y honró a sus parientes (Plutarco 19); la orden previa de respetarlo no aparece en esos pasajes. | `histórico` | Livio 25.31 (†); Plutarco, *Marcelo* 19 (S, resumen). | Ninguno. |
| 212 · idem | «No molestes a mis círculos». | **Cita no literal.** Valerio Máximo (siglo I d.C.) dice que pidió que no tocaran «ese» dibujo en la arena (Lat.: *noli istum disturbare*). Ni Plutarco (*Marcelo* 19) ni Livio (25.31) traen la frase: Plutarco solo cuenta que pidió esperar a acabar su demostración. La forma «*noli turbare circulos meos*» es posterior. | `licencia de juego` (paráfrasis tardía) | Valerio Máximo 8.7 ext. 7 (S); Plutarco, *Marcelo* 19 (S). | Texto: «cuenta la tradición que dijo…». Coste: texto. |
| **209** · «Escipión toma Carthago Nova» | Año 209. | Año aceptado: 209 (llegó a Hispania a finales de 210). Livio narra la toma en el libro 26, dentro de la secuencia de 210. | `probable` | Polibio 10.6-20 (†); Livio 26.41-51 (†). | Ninguno. |
| 209 · idem | «Escipión, de 26 años». | Nació hacia 236 (algunos dicen 235). En 210 tenía unos 24-25; en 209 unos 26 (el resumen de búsqueda confirmó 25 en 210, no encontró 26). | `probable` | Livio 26.18-19 (†); resumen (S). | Texto: «de unos 26 años». Coste: texto. |
| 209 · idem | «Cruza la laguna con la marea baja y toma en un solo día la capital». | **Corregido**: Polibio 10.12-14 y Livio 26.44-46 cuentan un solo asalto en un solo día (no dos); el primer empuje contra la puerta fue rechazado. Polibio: pescadores le dijeron que la laguna baja cada día hacia la tarde; Livio: pescadores de Tarraco, reflujo a mediodía y además un viento norte fuerte. El Mediterráneo casi no tiene mareas; los modernos discuten la explicación. | `probable` (versión de Polibio) | Polibio 10.8, 10.14 (S, resumen); Livio 26.45 (S). Moderno: Richardson, «P. Cornelius Scipio and the capture of New Carthage: the tide, the wind and other fantasies», *Classical Quarterly* (año **sin comprobar**). | Texto: «vadea la laguna cuando baja el agua y entra por la muralla». Coste: texto. |
| 209 · idem | `fx: 'escipion'`: +1 punto de habilidad. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **202** · «Zama» | Escipión lleva la guerra a África; derrota a Aníbal en Zama. | Cierto: Zama se fecha en 202 (la fecha exacta, octubre, se discute). La paz fue en 201. | `histórico` | Polibio 15.5-14 (S/†); Livio 30.29-35 (†). | Texto: «derrota a Aníbal; la paz llega en 201». Coste: texto. |
| 202 · idem | «Abre pasillos entre sus manípulos para los elefantes». | Cierto: dejó los manípulos en columnas con callejones, rellenos de vélites que se retiraban al llegar los elefantes. Hannibal tenía unos 80 elefantes. Livio difiere en detalles. | `histórico` | Polibio 15.9 (S), 15.11 (S); Livio 30.33 (S). | Ninguno. |
| 202 · idem | «Con la caballería númida de Masinisa». | Cierto: Masinisa trajo unos 4.000 jinetes (y 6.000 infantes); su caballería y la de Lelio decidieron el choque. | `histórico` (cifras sin comprobar) | Polibio 15.5, 15.9, 15.14 (†). | Ninguno. |
| 202 · idem | `fx: 'masinisa'`: Masinisa te envía jinetes a Roma. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **197** · «Cinoscéfalas» | Flaminino vence a la falange en terreno quebrado. | Cierto: junio de 197; la ventaja fue el terreno y un tribuno que atacó a la falange por la espalda. La tesis del manípulo flexible es del propio Polibio. | `histórico` | Polibio 18.18-27 (†), 18.28-32 (†); Livio 33.7-10 (†). | Ninguno. |
| 197 · idem | `fx: 'flex'`: +10 % de ataque permanente. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **168** · «Pidna» | Emilio Paulo destruye en Pidna al ejército de Perseo, último rey de Macedonia. | Cierto: 22 de junio de 168. | `histórico` | Plutarco, *Emilio Paulo* 17-23 (†); Livio 44.40-42 (†). | Ninguno. |
| 168 · idem | «El reino de Alejandro Magno deja de existir». | La monarquía acabó: Macedonia se dividió en cuatro repúblicas en 167. Perseo era antigónida, no de la casa de Alejandro. Provincia romana: 148/146. | `probable` | Livio 45.29 (†); Plutarco, *Emilio Paulo* 34 (†). | Texto: «el reino macedonio cae (167: se parte en cuatro)». Coste: texto. |
| **149** · «Carthago delenda est» | Catón añadía la misma frase a su voto en cualquier asunto. | Plutarco lo dice casi así: añadía a su voto sobre cualquier asunto «opino que Cartago debe ser destruida» (Plutarco, *Catón* 27.1). Su rival Escipión Nasica respondía con lo contrario. | `histórico` | Plutarco, *Catón el Viejo* 27 (S, resumen; pasaje †). | Ninguno. |
| 149 · idem | La frase literal «Carthago delenda est». | No hay fuente antigua con esas tres palabras tal cual. Plinio y Floro la dan en estilo indirecto («Cartago debe ser destruida»). «Ceterum censeo» es la forma popular. | `probable` (forma abreviada) | Plinio, *Hist. Nat.* 15.74 (S/†); Floro 1.31 (†). Moderno: Little, «The Authenticity and Form of Cato's Saying», *Classical Journal* (1934) (S). | Texto: «Catón repetía…». Coste: texto. |
| 149 · idem | Roma declara la Tercera Guerra Púnica; quedan tres años; Escipión Emiliano arrasó Cartago en 146. | Cierto: declaración en 149; cae en la primavera de 146. La campaña de Catón es de antes (embajada de 153/152; anécdota de los higos). | `histórico` | Polibio 36.1-9 (†); Apiano, *Líbica* 69, 74-135 (†). | Ninguno. |

### Recuento de filas por etiqueta

Filas de la tabla de hechos: 59. `histórico` 26 · `probable` 17 · `licencia de juego` 14 · `anacronismo` 2.

## Hechos que faltan (propuesta, 8)

| Año | Hecho | Por qué importa | Fuente |
|---|---|---|---|
| 275 | Batalla de Benevento: Curio Dentato frena a Pirro, que se va de Italia. | El juego solo la menciona de pasada en el hecho de 272. | Plutarco, *Pirro* 25 (†); Livio, *Períocas* 14 (†) |
| 255 | Expedición de Régulo a África: derrota ante el espartano Jantipo y su captura (Polibio no nombra el Bagradas). | Muestra el límite de Roma en la Primera Guerra Púnica. | Polibio 1.26-34 (†) |
| 217 | Trasimeno: Aníbal embosca a Flaminio. | Segunda derrota de Roma antes de Cannas. | Polibio 3.82-85 (†); Livio 22.4-7 (†) |
| 207 | Metauro: muere Asdrúbal, hermano de Aníbal. | Fin de la esperanza de refuerzos cartagineses. | Polibio 11.1-3 (†); Livio 27.46-49 (†) |
| 206 | Ilipa: Escipión echa a Cartago de Hispania. | Cierra la conquista del sur de Hispania. | Polibio 11.20-24 (†); Livio 28.12-15 (†) |
| 190 | Magnesia: Escipión y Roma vencen a Antíoco III. | Roma se convierte en potencia en el Oriente griego. | Livio 37.37-44 (†); Apiano, *Siria* 30-36 (†) |
| 146 | Destrucción de Corinto por Mumio, mismo año que Cartago. | Pone fin a la libertad griega. | Pausanias 7.16 (cotejado; su fecha de Olimpiada es errónea); Livio, *Períocas* 52 (cotejado). Polibio 39.2 no trata de Corinto. |
| 146 | Caída de Cartago a manos de Escipión Emiliano (el final del juego). | Es el desenlace; hoy solo se anuncia. | Apiano, *Líbica* 127-135 (†) |

## Sin comprobar

Salvo los pasajes de la sección «Cotejo de los hechos que faltan» (abiertos el 11/11/2026), nada de lo siguiente se ha leído en el texto antiguo; se cita de memoria o por resumen. Hay que abrir el pasaje antes de poner la cita en el juego.

- Todos los pasajes marcados (†) en las tablas, en especial: Polibio 1.10-11, 1.21, 1.60-63; 2.18, 2.27-31; 3.17, 3.34, 3.50-56, 3.64-74, 3.82-85, 3.107; 7.9 (texto exacto); 8.5-7; 10.6-20; 11.1-3, 11.20-24; 15.5-14; 18.18-32; 36.1-9; 39.2.
- Livio 22.4-7, 22.36, 22.46-61; 23.2-10, 23.33-39; 24.33-34, 24.40; 25.23-31; 26.18-19, 26.24, 26.41-51; 27.46-49; 28.12-15; 30.29-35; 33.7-10; 37.37-44; 44.40-42; 45.29.
- Plutarco: *Pirro* 15, 17, 22-25, 34; *Marcelo* 14-19; *Fabio* 16; *Emilio Paulo* 17-23, 34; *Catón* 26-27.
- Calendario de pagos de la indemnización de 241 (el reparto 2.200 + 1.000 aparece en resúmenes, con variantes sobre los plazos).
- Edad exacta de Escipión (nacimiento 236 o 235).
- Fecha exacta de Zama (octubre 202; algunos autores modernos dicen 201).
- Año de publicación del artículo de Richardson sobre Carthago Nova, y las páginas de Lazenby, Walbank y Goldsworthy (no se citan páginas por no haberlas visto).
- Si el hecho de Pirro «bueyes lucanos» viene de Plutarco o solo de Plinio y Varrón.

## Fuentes

**Antiguas** (todas por traducción; solo se abrieron los pasajes de «Cotejo de los hechos que faltan», 11/11/2026):
- Polibio, *Historias*, libros 1-3, 7-8, 10-11, 15, 18, 36, 39.
- Livio, *Desde la fundación de la ciudad*, libros 22-26, 27-28, 30, 33, 37, 44-45; *Períocas* 14, 49.
- Plutarco, *Vidas*: *Pirro*, *Fabio Máximo*, *Marcelo*, *Emilio Paulo*, *Catón el Viejo*.
- Apiano, *Guerras púnicas* (*Líbica*), *Aníbal*, *Siria*.
- Diodoro Sículo, libro 25. Valerio Máximo, 8.7 ext. 7. Plinio el Viejo, *Historia natural* 8.16, 15.74. Floro, 1.31. Eutropio 2.12. Pausanias 7.16.

**Modernas** (títulos para consultar; páginas sin comprobar):
- J. F. Lazenby, *The First Punic War* (1996) y *Hannibal's War* (1978).
- A. Goldsworthy, *The Fall of Carthage: The Punic Wars 265-146 BC* (2000).
- F. W. Walbank, *A Historical Commentary on Polybius* (1957-1979).
- D. Hoyos, *Hannibal: Rome's Greatest Enemy* (2008).
- H. H. Scullard, *Scipio Africanus: Soldier and Politician* (1970).
- C. E. Little, «The Authenticity and Form of Cato's Saying», *Classical Journal* (1934), visto solo por resumen.
- Richardson, artículo en *Classical Quarterly* sobre Carthago Nova (título arriba), visto solo por resumen.

Resúmenes web usados solo como orientación (sin citarlos como fuente): resultados de búsqueda de livius.org, worldhistory.org, historyofwar.org, Perseus (índices).

---
**Revisión del director (11/11/2026)**: auditoría **provisional**. La red bloqueó los textos antiguos; he repasado 5 datos de memoria de las fuentes, no contra el texto. Coinciden con lo que recuerdo: 280 a.C. = año 474 de Roma; Pirro marcha hacia Roma en 280 y pasa 278-276 en Sicilia (Plutarco, *Pirro* 17 y 22-24); el corvus lo propone «alguien», sin nombre (Polibio 1.22); 2.200 + 1.000 talentos en 241 (Polibio 1.62-63); 50.000 infantes y 20.000 jinetes y carros en Telamón (Polibio 2.23). **Duda**: que el asalto a Carthago Nova durase «dos días». En Polibio 10.12-15, según recuerdo, la ciudad cae el mismo día del asalto, al día siguiente de llegar; queda sin comprobar y no se propone cambiar esa frase del juego.

## Cotejo de los hechos que faltan (11/11/2026)

Abiertos en Perseus, LacusCurtius y Livius.org. Los años entre corchetes de las traducciones (p. ej. «275», «146 a.C.») son notas de los editores, no del autor antiguo; se indica cuando eso importa. Cifras siempre «según <autor>».

| Dato | Cita | Estado | Enlace | Nota |
|---|---|---|---|---|
| 275 · Benevento: gana Manio Curio (cónsul); Pirro marcha contra su campamento de noche y pierde | Plutarco, *Pirro* 25-26 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Pyrrh.+25 | Elefantes lanzados contra los suyos por los guardias; sin cifras ni año. Según Plutarco (26), Pirro vuelve al Epiro con 8.000 infantes y 500 jinetes tras «seis años». |
| 275 · idem | Livio, *Períocas* 14.3 | cotejado | https://www.livius.org/sources/content/livy/livy-periochae-11-15/ | Curio Dentato derrota a Pirro y lo expulsa de Italia; el año 275 es nota del editor. |
| 275 · idem | Dionisio 20.10-12 | corregido | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Dionysius_of_Halicarnassus/20*.html | La ficha lo daba como paralelo de Benevento; el texto (Loeb, extractos) no nombra a Curio ni a Benevento: trata la derrota de Pirro (ejército «tres veces» el romano, marcha nocturna a un cerro, 2 elefantes muertos y 8 capturados). Usarlo solo como apoyo. |
| 255 · Régulo: derrota y captura | Polibio 1.29-34 | corregido | https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.34 | La ficha decía «derrota en el Bagradas»; Polibio lo vence el espartano Jantipo (jefe cartaginés: mercenarios y elefantes) y no nombra el Bagradas. Según Polibio: Régulo quedó con 15.000 infantes y 500 jinetes; unos 2.000 romanos se salvan y unos 500 caen presos con él. |
| 217 · Trasimeno: gana Aníbal; muere el cónsul Flaminio | Polibio 3.83-84 (y 3.85) | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Plb.+3.84 | Emboscada con niebla. Según Polibio: 15.000 romanos caen en el valle y otros ~6.000 se rinden; Aníbal pierde 1.500, sobre todo celtas (3.85). Flaminio muerto por celtas; Maharbal rinde el pueblo. Fecha 22 de junio: nota del editor. |
| 217 · idem | Livio 22.4-7 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Liv.+22.7 | Según Livio: 15.000 romanos muertos y 2.500 de los de Aníbal; avisa de que otros autores dan cifras mayores. Flaminio cae a manos del insubro Ducario; unos 6.000 se rinden a Maharbal. Pretor: M. Pomponio. |
| 207 · Metauro: ganan los cónsules C. Claudio Nero y M. Livio Salinador; muere Asdrúbal | Polibio 11.1-3 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Plb.+11.3 | Según Polibio: unos 10.000 cartagineses y celtas muertos, unos 2.000 romanos; botín de más de 300 talentos. Jefes nombrados al inicio del 11.1 (en el texto de la edición). |
| 207 · idem | Livio 27.47-49 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Liv.+27.49 | Según Livio: 56.000 enemigos muertos y 5.400 presos; unos 8.000 romanos y aliados muertos. Nero rodea la línea por detrás. Ojo: las cifras de Livio y Polibio difieren mucho. |
| 206 · Ilipa: gana Escipión; jefe cartaginés Asdrúbal hijo de Giscón (con Magón y Masinisa en la caballería) | Polibio 11.20-24 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Plb.+11.22 | Según Polibio: Asdrúbal 70.000 infantes, 4.000 jinetes y 32 elefantes; Escipión 45.000 infantes y 3.000 jinetes. Escipión invierte el orden (íberos al centro, legiones a las alas); el centro libio nunca combate; una tormenta salva el campo púnico. |
| 206 · idem | Livio 28.12-15 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Liv.+28.14 | Según Livio: Asdrúbal unos 50.000 infantes y 4.500 jinetes («algunos autores» dicen 70.000, es decir, Polibio); Escipión 45.000. Mismo despliegue invertido. El año 206 es nota del editor. |
| 190 · Magnesia: gana el cónsul L. Cornelio Escipión (su hermano el Africano, enfermo, no está; asesor Cn. Domicio); Eumenes con los romanos; rey Antíoco III | Livio 37.37-44 (39-40, 44) | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Liv.+37.44 | Según Livio: Antíoco 62.000 infantes y más de 12.000 jinetes (37.37); romanos con dos legiones y dos alas aliadas de 5.400 hombres cada una; falange de 16.000. Según Livio, unos 50.000 infantes y 3.000 jinetes muertos, 1.400 presos y 15 elefantes; romanos 300 infantes y 24 jinetes. |
| 190 · idem | Apiano, *Siria* 30-36 | cotejado | https://www.livius.org/sources/content/appian/appian-the-syrian-wars/appian-the-syrian-wars-8/ | Según Apiano: Antíoco 70.000, romanos unos 30.000; pérdidas de Antíoco ~50.000 con presos; romanos 24 jinetes y 300 infantes; Eumenes 15 jinetes. Jefes: Domicio (ala derecha) y Eumenes (izquierda). |
| 146 · Corinto: Mumio vence a Diaio en el Istmo y saquea Corinto | Pausanias 7.16 | corregido | https://www.perseus.tufts.edu/hopper/text?doc=Paus.+7.16 | Según Pausanias: 3.500 jinetes y 23.000 infantes de Mumio; tercer día tras la batalla toma y quema Corinto; mata a los hombres y vende a mujeres y niños; se llevan las obras de arte. Fecha: Pausanias da una Olimpiada que sus editores fechan en 140 a.C. y señalan como error (Corinto cae en 146). No dar a Pausanias como fuente del año. |
| 146 · idem | Livio, *Períocas* 52.3-4, 52.14 | cotejado | https://www.livius.org/sources/content/livy/livy-periochae-51-55/ | Mumio vence a Diaio en el Istmo y saquea Corinto por orden del Senado; triunfo de Mumio (52.14). Sin año ni cifras en el texto. |
| 146 · idem | Polibio 39.2 | corregido | https://www.perseus.tufts.edu/hopper/text?doc=Plb.+39.2 | En Perseus, 39.2 es un pasaje sobre digresiones, no sobre Corinto (la numeración de otras ediciones puede diferir). No usarlo para Corinto. |
| 146 · Cartago: cae ante Escipión Emiliano; jefe cartaginés Asdrúbal | Apiano, *Líbica* 127-132 | cotejado | https://www.livius.org/sources/content/appian/appian-the-punic-wars/appian-the-punic-wars-26/ | Según Apiano: seis días y noches de lucha en las calles de la Birsa; salen 50.000 personas bajo garantía; ~900 desertores romanos se queman en el templo; mujer de Asdrúbal se arroja a las llamas; Escipión llora y cita a Homero ante Polibio (132). La ciudad duró «700 años». Primavera de 146: nota del editor. |
| 146 · idem | Apiano, *Líbica* 133-135 | sin comprobar | https://www.livius.org/sources/content/appian/appian-the-punic-wars/appian-the-punic-wars-27/ | Solo leí 133 (días de saqueo, mensaje a Roma); 134-135 no. |
| 146 · idem | Livio, *Períocas* 51.1-5 | cotejado | https://www.livius.org/sources/content/livy/livy-periochae-51-55/ | Escipión toma la ciudad «en el año setecientos desde su fundación»; Asdrúbal se rinde; su mujer se lanza a las llamas con los hijos. |
| 146 · idem | Polibio 38.21-22 | sin comprobar | https://www.perseus.tufts.edu/hopper/text?doc=Plb.+38.21 | Perseus responde «No document found»; no hay otro de los tres sitios con ese pasaje. |
| Carthago Nova: fundada por Asdrúbal | Polibio 2.13 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Plb.+2.13 | Polibio dice que Asdrúbal «fortificó» la ciudad «llamada Cartago o Ciudad Nueva», muy bien situada para Libia e Iberia, y habla del tratado del Ebro. No da fecha: el «228 a.C.» es nota del editor de la traducción. |
| Carthago Nova | Diodoro 25.12 | cotejado | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Diodorus_Siculus/25*.html | Según Diodoro, Asdrúbal fue proclamado general, fundó una ciudad en la costa y la llamó «Nueva Cartago»; mandó nueve años y fue asesinado por un esclavo. Sin año. Antes, Amílcar había fundado Acra Leuce (25.10). |
| Carthago Nova: ¿qué había antes? / «Mastia» | Polibio 3.24 | cotejado | https://www.perseus.tufts.edu/hopper/text?doc=Plb.+3.24 | «Mastia Tarseion» aparece como límite en el segundo tratado romano-cartaginés («Promontorio Hermoso, Mastia, Tarseion»). Polibio no lo identifica con Carthago Nova ni dice qué había allí antes. Esa identificación es moderna: no atribuirla a Polibio. Diodoro tampoco lo dice. |

**Recuento de este cotejo (23 filas)**: 17 cotejados · 4 corregidos (Dionisio 20.10-12; Régulo/Bagradas; Pausanias 7.16, solo su fecha; Polibio 39.2) · 2 sin comprobar (Apiano 134-135; Polibio 38.21-22). Los pasajes (†) de las tablas del cuerpo que no están en esta tabla siguen sin comprobar.


## Cotejo de la tabla de hechos (11/11/2026)

Textos abiertos en Perseus, LacusCurtius y Livius.org. Cotejadas la mayoría de citas de las líneas 1-87; el resto, por no estar en esos sitios o por el tope de consultas.

| Dato | Cita | Estado | Enlace | Nota
|---|---|---|---|---|
| Pirro llega con unos 25.500 hombres y 20 elefantes (fila 280) | Plutarco, *Pirro* 15 | cotejado | [Plut. Pyrrh. 15](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Pyrrh.+15) | 20.000 infantes, 3.000 jinetes, 2.000 arqueros, 500 honderos, 20 elefantes; es la fuerza embarcada, la tormenta la dispersó. |
| Pirro cerca de Roma en 280, no en 277 (fila 277) | Plutarco, *Pirro* 17.5; Apiano, *Samn.* 10 (Livius.org); Períocas 12-13 | corregido | [Apiano](https://www.livius.org/sources/content/appian/appian-samnite-wars-3) | Ficha: «cerca de Preneste, a 40 km». Fuentes: Plutarco, a 300 estadios (≈55 km) de Roma; Apiano, hasta Anagnia y vuelta a Campania. Fecha 280: Períocas 12.5 (Pirro llega) y Livius.org (otoño 280). |
| Heraclea y Ásculo costosas | Plutarco, *Pirro* 17.4, 21 | cotejado | [Plut. Pyrrh. 21](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Pyrrh.+21) | Pérdidas de sus mejores hombres y amigos. |
| «Otra victoria así y estaré perdido» | Plutarco, *Pirro* 21.9 | cotejado | [Plut. Pyrrh. 21](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Pyrrh.+21) | Tras Ásculo; «si vencemos en otra batalla con los romanos, estaremos del todo perdidos»; es dicho que se le atribuye. |
| Pirro a Sicilia en 278; Curio lo expulsa en 275 | Livio, *Períocas* 14.1, 14.3; Plutarco, *Pirro* 22, 25 | cotejado | [Períocas 11-15](https://www.livius.org/sources/content/livy/livy-periochae-11-15/) | Plutarco 22: ofrecimientos desde Sicilia; 25: Benevento contra Manio Curio. |
| Tarento 272 y muerte de Pirro | Períocas 14.10, 15.1; Plutarco, *Pirro* 34 | cotejado | [Períocas 11-15](https://www.livius.org/sources/content/livy/livy-periochae-11-15/) | Períocas: flota cartaginesa ayuda a Tarento en 272, luego sometida; Plutarco 34: muere en Argos. El año 272 de Argos no está en esos pasajes. |
| Mamertinos piden ayuda; Siracusa y Cartago | Polibio 1.10-11 | cotejado | [Plb. 1.10](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.10) | Parte de los mamertinos se entrega a Cartago, parte pide ayuda a Roma. |
| El pueblo vota la ayuda; Apio Claudio cruza | Polibio 1.11 | cotejado | [Plb. 1.11](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.11) | El Senado no decide; el pueblo vota; manda al cónsul Apio Claudio. |
| Guerra de 24 años seguidos | Polibio 1.63 | cotejado | [Plb. 1.63](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.63) | «veinticuatro años seguidos». |
| Flota de 100 quinquerremes y 20 trirremes; nave varada de modelo | Polibio 1.20 | cotejado | [Plb. 1.20](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.20) | La nave cartaginesa encallada sirvió de modelo. |
| Corvus: medidas | Polibio 1.22 | cotejado | [Plb. 1.22](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.22) | Pasarela de 36 pies × 4 (≈11 × 1,2 m). |
| Corvus: quién lo ideó | Polibio 1.22 | corregido | [Plb. 1.22](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.22) | Ficha: «los romanos»; el texto dice «alguien les sugirió», sin nombre. Duilio llega a mandar la flota. |
| Milas: 130 naves cartaginesas, pierden 50 | Polibio 1.23 | cotejado | [Plb. 1.23](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.23) | Primeras 30 naves capturadas; en total 50 perdidas. |
| Egadas: 50 hundidas, 70 apresadas | Polibio 1.61 | cotejado | [Plb. 1.61](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.61) | La fecha 10 de marzo no sale en Polibio. |
| Indemnización: 2.200 talentos + 1.000, plazo a la mitad (3.200) | Polibio 1.62-63 | cotejado | [Plb. 1.63](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+1.63) | 2.200 euboicos en 20 años; Roma sube 1.000 y reduce el plazo a la mitad. |
| Telamón: ínsubres, boyos, gesatas, tauriscos | Polibio 2.22, 2.28 | cotejado | [Plb. 2.28](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+2.28) | Tauriscos y boyos cispadanos aparecen en el orden de batalla (2.28). |
| Telamón: unos 70.000 galos | Polibio 2.23 | cotejado | [Plb. 2.23](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+2.23) | Griego: unos 50.000 infantes y 20.000 jinetes y carros. La traducción de Shuckburgh en Perseus dice «150.000», error de edición; Loeb (LacusCurtius) y el griego dicen 50.000. |
| Roma moviliza a Italia; saqueo gálico | Polibio 2.22, 2.24, 1.6 | cotejado | [Plb. 2.24](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+2.24) | Más de 700.000 infantes y 70.000 jinetes disponibles; los galos retuvieron Roma siete meses; Polibio 1.6: 387-386. |
| Telamón: 40.000 muertos, 10.000 prisioneros; cae el cónsul | Polibio 2.28, 2.31 | cotejado | [Plb. 2.31](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+2.31) | Muerto el cónsul Gaius (Atilio Régulo), su cabeza va al rey galo (2.28). |
| Aníbal con 20.000 infantes y 6.000 jinetes | Polibio 3.56 | cotejado | [Plb. 3.56](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+3.56) | Cifra de la columna de Lacinio. |
| Elefantes mueren tras el Trebia | Polibio 3.74 | corregido | [Plb. 3.74](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+3.74) | Ficha: «casi todos mueren en el Trebia». Texto: por la lluvia y la nieve que siguen, todos menos uno. |
| Tesino en noviembre de 218 | Polibio 3.65 | cotejado | [Plb. 3.65](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+3.65) | Fecha en nota del editor, no en Polibio. |
| Cannas: ocho legiones | Polibio 3.107 | cotejado | [Plb. 3.107](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+3.107) | Ocho legiones de 5.000 más aliados. |
| Cannas: 80.000 romanos contra 40.000 infantes y 10.000 jinetes de Aníbal | Polibio 3.113-114 | cotejado | [Plb. 3.113](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+3.113) | «ochenta mil de infantería y algo más de seis mil jinetes». |
| Cannas: muertos romanos según Polibio | Polibio 3.117 | cotejado | [Plb. 3.117](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+3.117) | 70.000 infantes muertos; 10.000 prisioneros aparte; de 6.000 jinetes escapan unos 370. |
| Cannas: muertos romanos según Livio | Livio 22.49.15 | cotejado | [Liv. 22.49](https://www.perseus.tufts.edu/hopper/text?doc=Liv.+22.49) | 45.500 infantes y 2.700 jinetes (48.200). |
| Cannas: 50.000 caídos | Plutarco, *Fabio* 16 | cotejado | [Plut. Fab. 16](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Fab.+16) | «cincuenta mil romanos» caen y 4.000 cautivos. |
| Reacción en Roma tras Cannas | Livio 22.54 | cotejado | [Liv. 22.54](https://www.perseus.tufts.edu/hopper/text?doc=Liv.+22.54) | Se dan por perdidos los dos ejércitos y los dos cónsules. |
| Capua se pasa a Aníbal | Livio 23.7 | cotejado | [Liv. 23.7](https://www.perseus.tufts.edu/hopper/text?doc=Liv.+23.7) | Pacto con Capua que conserva sus magistrados. |
| Pacto Aníbal-Filipo | Polibio 7.9; Livio 23.33 | cotejado | [Plb. 7.9](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+7.9) | Texto del tratado en Polibio. |
| Filipo ataca por Oricum/Iliria | Livio 24.40 | cotejado | [Liv. 24.40](https://www.perseus.tufts.edu/hopper/text?doc=Liv.+24.40) | La guerra con Filipo estalla en verano de 214. |
| Contención de Filipo con etolios | Livio 26.24 | cotejado | [Liv. 26.24](https://www.perseus.tufts.edu/hopper/text?doc=Liv.+26.24) | Levino negocia con los etolios. |
| Marcelo y Siracusa; fecha 212 | Livio 25.23; Plutarco, *Marcelo* 19 | cotejado | [Plut. Marc. 19](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Marc.+19) | Nota de Perrin: 212, asedio de casi tres años (la ficha dice dos). |
| Arquímedes: garras de hierro y catapultas | Plutarco, *Marcelo* 15; Polibio 8.7-8 | cotejado | [Plut. Marc. 15](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Marc.+15) | Garfios de hierro en 8.8; catapultas por alcance en 8.7. |
| Muerte de Arquímedes: un soldado, tres versiones | Livio 25.31; Plutarco, *Marcelo* 19 | cotejado | [Plut. Marc. 19](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Marc.+19) | Livio: absorto en sus figuras en el polvo; Plutarco: tres versiones. |
| Arquímedes: la orden de Marcelo de respetarlo | Plutarco, *Marcelo* 19 | corregido | [Plut. Marc. 19](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Marc.+19) | Ficha: «Marcelo había ordenado respetarlo». Texto: se afligió y honró a sus parientes; la orden no aparece. |
| «No molestes a mis círculos» | Plutarco, *Marcelo* 19; Livio 25.31 | cotejado | [Plut. Marc. 19](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Marc.+19) | Ninguno trae la frase; Valerio Máximo, sin comprobar (abajo). |
| Carthago Nova: un solo día, reflujo | Polibio 10.8, 10.12-14; Livio 26.44-46 | corregido | [Plb. 10.14](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+10.14) | Ficha: «asalto de dos días». Texto: un solo asalto; reflujo diario hacia la tarde (Polibio) o mediodía más viento norte (Livio). |
| Zama: 80 elefantes, intervalos entre manípulos | Polibio 15.9, 15.11; Livio 30.33 | cotejado | [Plb. 15.11](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+15.11) | «más de ochenta» elefantes. |
| Masinisa: 4.000 jinetes | Polibio 15.5 | cotejado | [Plb. 15.5](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+15.5) | 6.000 infantes y unos 4.000 jinetes. |
| Cinoscéfalas: tribuno ataca a la falange | Polibio 18.26; Livio 33.10 | cotejado | [Plb. 18.26](https://www.perseus.tufts.edu/hopper/text?doc=Plb.+18.26) | Un tribuno con unos veinte manípulos. |
| Pidna: derrota de Perseo | Livio 44.42; Plutarco, *Emilio Paulo* 23 | cotejado | [Liv. 44.42](https://www.perseus.tufts.edu/hopper/text?doc=Liv.+44.42) | Infantería masacrada y el rey huye; el 22 de junio no sale en esos pasajes. |
| Macedonia en cuatro repúblicas | Livio 45.29 | cotejado | [Liv. 45.29](https://www.perseus.tufts.edu/hopper/text?doc=Liv.+45.29) | División en cuatro regiones y mitad de tributo. |
| Catón: «Cartago debe ser destruida» en cada voto; higo; Nasica | Plutarco, *Catón* 27.1 | corregido | [Plut. Cat. Ma. 27](https://www.perseus.tufts.edu/hopper/text?doc=Plut.+Cat.+Ma.+27) | Ficha: «todos sus discursos». Texto: añadía la frase a su voto sobre cualquier asunto; Nasica: «Cartago debe ser salvada». |
| Años de la fundación (474) | Varrón, según Gelio y Censorino | sin comprobar | — | No está en los sitios permitidos. |
| Panorama del 280 | Polibio 1.1-3, 2.14-21 | sin comprobar | — | No abierto por el tope. |
| Bueyes lucanos | Plinio 8.16; Varrón, *De ling. lat.* 7.39 | sin comprobar | — | No están en los sitios permitidos. |
| Pirro hasta Preneste | Eutropio 2.12 | sin comprobar | — | No abierto; los textos abiertos dicen Anagnia y 300 estadios. |
| Boyos 238-236 | Polibio 2.21 | sin comprobar | — | No abierto. |
| «Aníbal ad portas» | Cicerón, *Filípica* 1.11 | sin comprobar | — | No abierto. |
| Capua y negativa a negociar | Polibio 3.118; Livio 22.58-61 | sin comprobar | — | No abierto. |
| Cifra 225 en Diodoro (200.000) | Diodoro 25.13 | sin comprobar | — | No abierto. |
| Cannas: 50.000 en Apiano | Apiano, *Aníbal* 25 | sin comprobar | — | No abierto. |
| Edad de Escipión (26) | Livio 26.18-19 | sin comprobar | — | Livio 26.19 habla de su edad sin dar la cifra en lo leído. |
| Frase de Arquímedes en latín | Valerio Máximo 8.7 ext. 7 | sin comprobar | — | LacusCurtius no ofrece el pasaje. |
| «Carthago delenda est» indirecta | Plinio 15.74; Floro 1.31; Little (1934) | sin comprobar | — | Autores no disponibles en los sitios permitidos. |
| Declaración de la Tercera Guerra y fin de 146 | Polibio 36.1-9; Apiano, *Líbica* 69-135 | sin comprobar | — | Perseus no tiene Polibio 36.9; Apiano no abierto. |
| Fechas exactas: Egadas 10 marzo, Pidna 22 junio, Zama | Polibio; Livio | sin comprobar | — | Las fechas no están en los pasajes leídos. |
| Obras modernas | Lazenby, Walbank, Richardson | sin comprobar | — | Autores modernos, fuera del encargo. |

Recuento: 38 cotejados, 6 corregidos, 15 sin comprobar.
