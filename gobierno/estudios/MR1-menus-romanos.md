# MR1 · Menús al estilo romano · estudio de diseño (17/11/2026)

Pedido del usuario, literal: «No me gusta el formato, hazlo rollo pergaminos antiguos o pergaminos romanos, parece un
cuaderno de un chaval de primaria» y «Quiero mejorar más los menús, hacerlos más acordes al juego y a la época».
Maqueta: `gobierno/maquetas/menus-romanos/index.html` (abrir sin parámetro para ver todas; `?p=imperio`, `imperio-b`,
`gobierno`, `senado`, `carta` para una). Capturas: `capturas-tarea/MR1-1…5-*.jpg`.

## 1. La idea en una frase
Un romano no tenía «menús»: tenía **rollos de papiro** para leer, **tablillas de cera** para escribir y elegir,
**placas de bronce** para lo oficial y **sellos** para comprometerse. Cada material significa una cosa y se usa
siempre igual. Así el estilo es coherente y además ayuda a entender la pantalla sin leer.

## 2. Gramática de materiales (la regla para todos los menús)
| Material | Para qué | Cómo se ve | Ejemplos |
|---|---|---|---|
| **Papiro** | Lo que se lee | Crema con fibras cruzadas muy tenues; enrollado en un palo con pomos de bronce (el palo es el asa para arrastrar la hoja) | Imperio, Gobierno, Senado, Crónica, Saber, informes |
| **Tablilla de cera** | Lo que eliges o ajustas | Marco de madera, cera oscura, letra clara «rayada»; lo elegido sale en crema con borde rojo | Filtros, pestañas internas, propuestas del Senado, Ajustes |
| **Bronce** | Títulos y «ir a otro sitio» | Placa con asas (*tabula ansata*) para el título; placas oscuras con filo de bronce para los atajos | Cabeceras, atajos de Gobierno, botones de volver |
| **Bronce verdoso** | Lo oficial y solemne | Tabla de bronce con clavos en las esquinas | Decreto o hecho histórico del Senado |
| **Sello de cera roja** | La acción que compromete | Rojo legión con un sello redondo; **una por pantalla** | Pasar turno, Votar, Construir, Confirmar |
| **Noche** (sin cambio) | Lo que flota sobre el 3D | Cristal oscuro con filete de bronce y greca debajo | Barra de arriba, pestañas de abajo |

Tintas sobre papiro: **parda** `#2b1c0a` (texto), **minio** `#9b2a1a` (rúbricas, avisos, «va mal»), **oliva**
`#46661f` («va bien»). Ornamento: greca (meandro) solo en la barra de arriba; filete doble entre bloques;
interpunto triangular (▴/▾) como separador en títulos.

## 3. Qué se conserva de K12 (funcionaba)
La estructura entera: barra de arriba, «Pasar turno» grande, tres pestañas abajo, hoja inferior única con sus alturas,
el ☰ con «Volver al menú principal» al fondo, Imperio sin scroll de página (solo se desplaza la lista), anillo de
felicidad y «Falta», hemiciclo del Senado, Crónica en folios (K12b, ya códice), Saber en pergamino (I5d).
**Cambia solo la piel**: las cajas redondeadas de color crema y los botones-pastilla dorados (lo que daba aire de
cuaderno escolar) pasan a papiro, cera, bronce y sello.

## 4. Legibilidad en 390 px y con pulgares
- Texto sobre papiro ≥15 px, letra de libro (Georgia/Noto Serif, ya en el móvil: **no añade archivos**); títulos en
  Cinzel (ya incluido). Contraste tinta/papiro ≈ 12:1; minio/papiro ≈ 6:1 (ambos pasan WCAG AA).
- Las fibras del papiro van muy tenues y densas (no rayas cada 20 px, que era el «cuaderno»); detrás de las cifras no
  hay textura que estorbe.
- Toques ≥48 px (tablillas 48, atajos 62–70, sello 56). La acción roja siempre en el mismo sitio, abajo.
- Rendimiento: todo es CSS y SVG en línea (sin imágenes). Si en móvil viejo el ruido SVG pesara, se cambia por una
  tesela de 64 px.

## 5. Dictamen histórico (skill `historia`)
**APTO CON NOTAS.**
| Elemento | Etiqueta | Fuente |
|---|---|---|
| Rollo de papiro (*volumen*) como libro de la época | histórico | Plinio, *Historia natural* XIII 68–83 (fabricación del papiro) |
| Pergamino | probable al final del periodo | Plinio, *HN* XIII 70 (citando a Varrón): se generaliza en Pérgamo bajo Eumenes II (197–159 a.C.). Por eso la base es **papiro**, y «pergamino» queda como nombre coloquial |
| Palo con pomos del rollo (*umbilicus*) | probable (fuentes algo posteriores) | Catulo 22, 7; Marcial IV 89 |
| Tablillas de cera para cartas y cuentas | histórico | Plauto, *Pseudolus* (191 a.C.), acto I: la carta llega en tablillas |
| Sello con anillo sobre cera | histórico | Plauto, *Pseudolus*, acto II (el sello del soldado como prueba) |
| Leyes y decretos en tabla de bronce | histórico | *Senatus consultum de Bacchanalibus*, 186 a.C. (CIL I² 581; Livio XXXIX 8–19) |
| Rúbricas en rojo (minio) | probable | Plinio, *HN* XXXIII 111–124 (minio); «rubrica» para títulos de ley: Juvenal 14, 193 (posterior) |
| Tabula ansata para títulos | probable | Forma helenística, frecuente desde la República tardía |
| Greca (meandro) | histórico | Bordes de mosaico helenísticos e itálicos del s. II a.C. (Dunbabin, *Mosaics of the Greek and Roman World*, 1999, cap. 2–3) |
| Interpunto triangular | histórico | Inscripciones latinas republicanas (p. ej. epitafio de Escipión Barbato, CIL I² 6–7) |
| Letra Cinzel (capital monumental) | **licencia de juego** | Imita la capital del s. I d.C. (columna de Trajano); la del s. III a.C. era más tosca. Se queda por legible |
| Mes en latín «IANVARIVS» | probable | El calendario prejuliano tenía Ianuarius; Roma fechaba por cónsules, no por «a.C.» (licencia de juego) |
| Botones, pestañas, anillo de felicidad | licencia de juego | Necesarios para jugar en un móvil |

Fuentes visuales para mirar (no se copian; en el juego **todo se dibuja con CSS y SVG propios**, así que no entra
arte ajeno ni hay licencia que citar): la tabla de bronce de las Bacanales (Viena, Kunsthistorisches Museum), los
papiros de Herculano, el fresco pompeyano de la mujer con tablillas y estilo (Nápoles, MANN). Nada de juegos
comerciales.

## 6. Construcción por fases (para Sonnet, una tarea por sesión; solo `css/style.css` salvo donde se dice)
| Fase | Qué | Archivos | Hecho cuando… | M |
|---|---|---|---|---|
| MR2a | **Materiales + Imperio**: variables (`--papiro`, `--tinta`, `--minio`, `--cera`, `--sello`), clases `.papiro`, `.tablilla`, `.ansata`, `.sello-btn`; Imperio como en la captura 1 (o 2 si gana B) | `css/style.css` (bloque nuevo al final); `js/ui.js` solo para poner clases si hace falta | Captura de Imperio en el juego igual a `MR1-1` (o `MR1-2`); jueces APTO | 0,5 |
| MR2b | **Gobierno**: hoja de papiro con palo, título en placa, anillo sobre papiro, «Falta» en minio, 6 atajos en placas de bronce | `css/style.css` | Captura igual a `MR1-3`; toques ≥48 px | 0,3 |
| MR2c | **Senado**: hecho en tabla de bronce, hemiciclo sobre papiro, propuestas en tablillas de cera, «Votar» con sello | `css/style.css`, quizá `js/ui.js` (clases) | Captura igual a `MR1-4` | 0,4 |
| MR2d | **Avisos y modales**: informe de estación como carta con sello; confirmaciones (volver al menú, cambiar de saber) con sello rojo y botón de tinta | `css/style.css` | Captura igual a `MR1-5`; ningún modal crema-cuaderno | 0,3 |
| MR2e | **El resto**: Mercado, Rutas, Pueblo, Ajustes, ☰, General, Crónica (afinar al papiro), Saber (unificar con la gramática) | `css/style.css` | Recorrido de jueces: ninguna pantalla con la piel vieja | 0,5 |
| MR2f | **Iconos de tinta** en vez de emojis en los menús (si se aprueba) | `js/ui.js`, `css/style.css` | Ningún emoji en menús; iconos de línea en bronce/tinta | 0,4 |
| MR2g | **Barras** (pestañas de abajo en bronce, «Pasar turno» con sello, fecha más limpia) | `css/style.css` | Captura de la barra igual a las de la maqueta | 0,2 |

Total ≈2,6 M en 7 sesiones cortas. Orden: a, b, c, d, g, e, f. Ninguna toca la lógica ni el guardado.
Choques: MR2a/c/f tocan `js/ui.js`; esperar a que acaben K7c–K7e si siguen abiertas.

## 8. Segunda pasada artística (v2, 17/11, pedida por el usuario: «Me gusta, pero quiero mejorar el diseño visual y artístico»)
Capturas nuevas `MR1-1…5`; las de la primera versión quedan como `MR1-v1-1…5` para comparar.
- **Papiro más vivo**: bordes laterales rotos, uniones de las hojas cada ~15 cm (*kollesis*), manchas de uso y bordes
  más oscuros; el rollo va **abierto entre dos palos** de madera con veta y pomos de bronce torneados.
- **Bronce martillado** en títulos, atajos, barras y botón rojo; remaches en las esquinas de las placas y en las asas de
  la *tabula ansata*; letra grabada (luz abajo, sombra arriba).
- **Sello de cera de verdad**: borde irregular y anillo impreso; en la carta, el sello con laurel cabalga el papel.
- **Hoja de hiedra** como separador (en vez de la raya doble) e **inicial roja** al empezar los textos.
- **Corona de laurel** alrededor del anillo de felicidad, atada con cinta roja.
- **Tablillas** con veta en el marco y rayas de estilo en la cera; **gradas de piedra** en el hemiciclo del Senado.
- Viñeta cálida en los bordes de la pantalla (luz de lucerna).
Todo sigue siendo CSS y SVG propios, sin imágenes.

Dictamen de lo añadido: uniones de hojas del rollo, **histórico** (Plinio, *HN* XIII 77); corona de laurel del
triunfador, **histórico** (Plinio, *HN* XV 133–135; Aulo Gelio V 6); hoja de hiedra como signo de puntuación
(*hedera distinguens*), **probable** (frecuente en inscripciones latinas, sobre todo algo posteriores); inicial grande
en rojo, **licencia de juego** (es costumbre medieval; aquí se usa por legibilidad y adorno).

## 7. Decide el usuario
1. **Fondo de las hojas**: **(A)** papiro entero, enrollado (captura 1; más «pergamino», tapa más la ciudad) ·
   **(B)** marco oscuro de bronce con hojas de papiro dentro (captura 2; más sobrio, se parece al Saber de hoy).
   Recomiendo **A**: es lo que pediste y se lee mejor (tinta oscura sobre claro).
2. **Iconos**: **(A)** cambiar los emojis de los menús por iconos de tinta dibujados (MR2f) · **(B)** dejar los emojis.
   Recomiendo **A** (los emojis son de móvil moderno, no de Roma).
3. **Aprobar las fases MR2a–MR2g** (≈2,6 M en total, o solo las que quieras).
