# H1 — Auditoría histórica de los 16 hechos de la campaña

**Resumen.**
Los 16 hechos de `D.EVENTS` (`js/data.js`, líneas 128-147) son en su mayoría sólidos. Hay un error claro (Pirro «marcha sobre Roma» en 277), un dato atribuido a la persona equivocada (Duilio no «inventó» el corvus según Polibio) y varias frases que son leyenda o tradición, no cita antigua.
Los efectos de juego (`fx`) y los ataques de facciones son licencia de juego y quedan marcados como tal.
**Aviso de método:** en esta auditoría no se pudo abrir ningún texto antiguo (Perseus, Penelope/LacusCurtius, Attalus y Gutenberg están bloqueados en la red de la sesión). Solo funcionó la búsqueda web, que devuelve resúmenes. Por eso cada cita lleva una marca: **(S)** = el dato apareció en un resumen de búsqueda que cita el pasaje; **(†)** = el pasaje es de memoria del auditor y **no se ha leído**. Antes de usar un (†) en el juego, hay que abrir el texto.

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
| **277** · «Pirro marcha sobre Roma» | Pirro avanza al norte en 277. | **Error de fecha.** Su marcha hacia Roma fue en 280, tras Heraclea: llegó cerca de Preneste, a unos 40 km (Plutarco; Apiano; Eutropio). En 278-276 estaba en Sicilia. Vuelve a Italia en 276 y es frenado en Benevento (275). | `anacronismo` (fecha mal) | Plutarco, *Pirro* 17 (†), 22-25 (†); Eutropio 2.12 (†). Autor moderno para Pirro: **sin comprobar**. | Mover el hecho a 280 o 279 («Pirro avanza hacia Roma») o cambiar texto: «Pirro vuelve de Sicilia en 276». Coste: pequeño (hay que cambiar `from: 279` de Epiro o el año). |
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
| 260 · idem | «El cónsul Duilio inventa el corvus». | **Corregir.** Polibio describe el corvus (pasarela de abordaje, unos 11 m de largo y 1,2 m de ancho) pero **no dice** que lo inventara Duilio; atribuye la idea a los romanos. Duilio mandó la flota tras la captura de su colega Cneo Cornelio Escipión Asina. | `anacronismo` (atribución errónea) | Polibio 1.22 (S); 1.21 (†) sobre Escipión Asina. | Texto: «los romanos usan el corvus, un puente de abordaje; Duilio manda la flota». Coste: texto. |
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
| **218** · «Aníbal cruza los Alpes» | Tras tomar Sagunto, cruza Pirineos, Ródano y Alpes con elefantes. | Sagunto cae en 219 (asedio de ocho meses). Aníbal parte en primavera de 218. Llega a Italia con unos 20.000 infantes y 6.000 jinetes; los elefantes casi todos mueren en el Trebia. | `histórico` | Polibio 3.17, 3.34, 3.50-56 (†), 3.74 (†). | Texto: añadir «(219)» tras Sagunto. Coste: texto. |
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
| 212 · idem | «Muere a manos de un soldado». | Cierto, pero con versiones: Livio dice que lo mató un soldado que no lo reconoció; Plutarco da tres versiones. Marcelo había ordenado respetarlo. | `histórico` | Livio 25.31 (†); Plutarco, *Marcelo* 19 (S, resumen). | Ninguno. |
| 212 · idem | «No molestes a mis círculos». | **Cita no literal.** Valerio Máximo (siglo I d.C.) dice que pidió que no tocaran «ese» dibujo en la arena (Lat.: *noli istum disturbare*). Plutarco no trae la frase. La forma «*noli turbare circulos meos*» es posterior. | `licencia de juego` (paráfrasis tardía) | Valerio Máximo 8.7 ext. 7 (S); Plutarco, *Marcelo* 19 (S). | Texto: «cuenta la tradición que dijo…». Coste: texto. |
| **209** · «Escipión toma Carthago Nova» | Año 209. | Año aceptado: 209 (llegó a Hispania a finales de 210). Livio narra la toma en el libro 26, dentro de la secuencia de 210. | `probable` | Polibio 10.6-20 (†); Livio 26.41-51 (†). | Ninguno. |
| 209 · idem | «Escipión, de 26 años». | Nació hacia 236 (algunos dicen 235). En 210 tenía unos 24-25; en 209 unos 26 (el resumen de búsqueda confirmó 25 en 210, no encontró 26). | `probable` | Livio 26.18-19 (†); resumen (S). | Texto: «de unos 26 años». Coste: texto. |
| 209 · idem | «Cruza la laguna con la marea baja y toma en un solo día la capital». | El asalto duró dos días (el primero fracasó en parte). Polibio dice que unos pescadores le informaron de que la laguna se podía vadear a cierta hora; Livio atribuye el reflujo al viento del norte. El Mediterráneo casi no tiene mareas; los modernos discuten la explicación. | `probable` (versión de Polibio) | Polibio 10.8, 10.14 (S, resumen); Livio 26.45 (S). Moderno: Richardson, «P. Cornelius Scipio and the capture of New Carthage: the tide, the wind and other fantasies», *Classical Quarterly* (año **sin comprobar**). | Texto: «vadea la laguna cuando baja el agua y entra por la muralla». Coste: texto. |
| 209 · idem | `fx: 'escipion'`: +1 punto de habilidad. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **202** · «Zama» | Escipión lleva la guerra a África; derrota a Aníbal en Zama. | Cierto: Zama se fecha en 202 (la fecha exacta, octubre, se discute). La paz fue en 201. | `histórico` | Polibio 15.5-14 (S/†); Livio 30.29-35 (†). | Texto: «derrota a Aníbal; la paz llega en 201». Coste: texto. |
| 202 · idem | «Abre pasillos entre sus manípulos para los elefantes». | Cierto: dejó los manípulos en columnas con callejones, rellenos de vélites que se retiraban al llegar los elefantes. Hannibal tenía unos 80 elefantes. Livio difiere en detalles. | `histórico` | Polibio 15.9 (S), 15.11 (S); Livio 30.33 (S). | Ninguno. |
| 202 · idem | «Con la caballería númida de Masinisa». | Cierto: Masinisa trajo unos 4.000 jinetes (y 6.000 infantes); su caballería y la de Lelio decidieron el choque. | `histórico` (cifras sin comprobar) | Polibio 15.5, 15.9, 15.14 (†). | Ninguno. |
| 202 · idem | `fx: 'masinisa'`: Masinisa te envía jinetes a Roma. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **197** · «Cinoscéfalas» | Flaminino vence a la falange en terreno quebrado. | Cierto: junio de 197; la ventaja fue el terreno y un tribuno que atacó a la falange por la espalda. La tesis del manípulo flexible es del propio Polibio. | `histórico` | Polibio 18.18-27 (†), 18.28-32 (†); Livio 33.7-10 (†). | Ninguno. |
| 197 · idem | `fx: 'flex'`: +10 % de ataque permanente. | Mecánica de juego. | `licencia de juego` | — | Ninguno. |
| **168** · «Pidna» | Emilio Paulo destruye en Pidna al ejército de Perseo, último rey de Macedonia. | Cierto: 22 de junio de 168. | `histórico` | Plutarco, *Emilio Paulo* 17-23 (†); Livio 44.40-42 (†). | Ninguno. |
| 168 · idem | «El reino de Alejandro Magno deja de existir». | La monarquía acabó: Macedonia se dividió en cuatro repúblicas en 167. Perseo era antigónida, no de la casa de Alejandro. Provincia romana: 148/146. | `probable` | Livio 45.29 (†); Plutarco, *Emilio Paulo* 34 (†). | Texto: «el reino macedonio cae (167: se parte en cuatro)». Coste: texto. |
| **149** · «Carthago delenda est» | Catón termina todos sus discursos con la misma frase. | Plutarco lo dice casi así: terminaba todos los discursos con «opino que Cartago no debe existir». Su rival Escipión Nasica respondía con lo contrario. | `histórico` | Plutarco, *Catón el Viejo* 27 (S, resumen; pasaje †). | Ninguno. |
| 149 · idem | La frase literal «Carthago delenda est». | No hay fuente antigua con esas tres palabras tal cual. Plinio y Floro la dan en estilo indirecto («Cartago debe ser destruida»). «Ceterum censeo» es la forma popular. | `probable` (forma abreviada) | Plinio, *Hist. Nat.* 15.74 (S/†); Floro 1.31 (†). Moderno: Little, «The Authenticity and Form of Cato's Saying», *Classical Journal* (1934) (S). | Texto: «Catón repetía…». Coste: texto. |
| 149 · idem | Roma declara la Tercera Guerra Púnica; quedan tres años; Escipión Emiliano arrasó Cartago en 146. | Cierto: declaración en 149; cae en la primavera de 146. La campaña de Catón es de antes (embajada de 153/152; anécdota de los higos). | `histórico` | Polibio 36.1-9 (†); Apiano, *Líbica* 69, 74-135 (†). | Ninguno. |

### Recuento de filas por etiqueta

Filas de la tabla de hechos: 59. `histórico` 26 · `probable` 17 · `licencia de juego` 14 · `anacronismo` 2.

## Hechos que faltan (propuesta, 8)

| Año | Hecho | Por qué importa | Fuente |
|---|---|---|---|
| 275 | Batalla de Benevento: Curio Dentato frena a Pirro, que se va de Italia. | El juego solo la menciona de pasada en el hecho de 272. | Plutarco, *Pirro* 25 (†); Livio, *Períocas* 14 (†) |
| 255 | Expedición de Régulo a África: derrota en el Bagradas y su captura. | Muestra el límite de Roma en la Primera Guerra Púnica. | Polibio 1.26-34 (†) |
| 217 | Trasimeno: Aníbal embosca a Flaminio. | Segunda derrota de Roma antes de Cannas. | Polibio 3.82-85 (†); Livio 22.4-7 (†) |
| 207 | Metauro: muere Asdrúbal, hermano de Aníbal. | Fin de la esperanza de refuerzos cartagineses. | Polibio 11.1-3 (†); Livio 27.46-49 (†) |
| 206 | Ilipa: Escipión echa a Cartago de Hispania. | Cierra la conquista del sur de Hispania. | Polibio 11.20-24 (†); Livio 28.12-15 (†) |
| 190 | Magnesia: Escipión y Roma vencen a Antíoco III. | Roma se convierte en potencia en el Oriente griego. | Livio 37.37-44 (†); Apiano, *Siria* 30-36 (†) |
| 146 | Destrucción de Corinto por Mumio, mismo año que Cartago. | Pone fin a la libertad griega. | Pausanias 7.16 (†); Polibio 39.2 (†) |
| 146 | Caída de Cartago a manos de Escipión Emiliano (el final del juego). | Es el desenlace; hoy solo se anuncia. | Apiano, *Líbica* 127-135 (†) |

## Sin comprobar

Nada de lo siguiente se ha leído en el texto antiguo; se cita de memoria o por resumen. Hay que abrir el pasaje antes de poner la cita en el juego.

- Todos los pasajes marcados (†) en las tablas, en especial: Polibio 1.10-11, 1.21, 1.60-63; 2.18, 2.27-31; 3.17, 3.34, 3.50-56, 3.64-74, 3.82-85, 3.107; 7.9 (texto exacto); 8.5-7; 10.6-20; 11.1-3, 11.20-24; 15.5-14; 18.18-32; 36.1-9; 39.2.
- Livio 22.4-7, 22.36, 22.46-61; 23.2-10, 23.33-39; 24.33-34, 24.40; 25.23-31; 26.18-19, 26.24, 26.41-51; 27.46-49; 28.12-15; 30.29-35; 33.7-10; 37.37-44; 44.40-42; 45.29.
- Plutarco: *Pirro* 15, 17, 22-25, 34; *Marcelo* 14-19; *Fabio* 16; *Emilio Paulo* 17-23, 34; *Catón* 26-27.
- Calendario de pagos de la indemnización de 241 (el reparto 2.200 + 1.000 aparece en resúmenes, con variantes sobre los plazos).
- Edad exacta de Escipión (nacimiento 236 o 235).
- Fecha exacta de Zama (octubre 202; algunos autores modernos dicen 201).
- Año de publicación del artículo de Richardson sobre Carthago Nova, y las páginas de Lazenby, Walbank y Goldsworthy (no se citan páginas por no haberlas visto).
- Si el hecho de Pirro «bueyes lucanos» viene de Plutarco o solo de Plinio y Varrón.

## Fuentes

**Antiguas** (todas por traducción; ningún texto se pudo abrir en esta sesión):
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
