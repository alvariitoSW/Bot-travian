# K11 · Concurso de menús y pantallas (13/11/2026)
Cuatro maquetas HTML (390×844, sin scroll de página) de estilos distintos, hechas por agentes distintos con las mismas bases (`maquetas/menus/BASES.md`). Cada una cubre Gobierno (estado, ajustes, pausas del reloj, mercado, rutas, crónica), menú principal, Imperio y el modal del informe de estación. Jurado ciego de tres agentes (novato, diseñador de interfaz, director de arte) que solo vieron capturas en carpetas anónimas P1–P4 y los puntos 2 y 3 de la nota. Clave en `maquetas/menus/CLAVE-CIEGA.md`. **El ganador lo decide el usuario.**

## Ranking (suma de tres jurados, sobre 150)
| Puesto | Maqueta | Novato | Interfaz | Arte | Suma |
|---|---|---|---|---|---|
| 1 | **B · Hojas inferiores** (`K11-B-hoja.html`) | 43 | 41 | 34 | **118** |
| 2 | **D · Códice con marcapáginas** (`K11-D-codice.html`) | 35 | 31 | 36 | **102** |
| 3 | **C · Mosaico de teselas** (`K11-C-mosaico.html`) | 34 | 34 | 32 | **100** |
| 4 | **A · Mármol y bronce** (`K11-A-piedra.html`) | 33 | 33 | 33 | **99** |
Capturas: `gobierno/capturas-tarea/K11-<letra>-<nombre>-{gobierno,menu,imperio,modal,gobierno-mercado,gobierno-rutas,gobierno-ajustes,gobierno-cronica}.jpg`. Cada maqueta se abre en el navegador y admite `#gobierno`, `#menu`, `#imperio`, `#modal`, `#gobierno-mercado`…

## Qué dijo el jurado
- **B Hojas**: la más clara y con mejor pulgar: «Pasar turno» enorme, cuatro atajos abajo, Mercado/Rutas/Ajustes/Crónica en hojas que suben desde abajo. Fallos: parece una app oscura genérica con poca Roma; huecos vacíos en Gobierno y Menú; filtros del Imperio cortados; X de cierre del menú arriba.
- **D Códice**: la más romana (estandartes, folios con capitular, sello de lacre, informe en pergamino) y la mejor de arte. Fallos: cinco pestañas arriba (lejos del pulgar), letra pequeña y apretada, Imperio saturado, «Pasar turno» pintado en el menú.
- **C Mosaico**: teselas enormes, «Volver» abajo, muy fácil de construir. Fallos: parece app de azulejos de colores, sin Roma; paneles con mucho vacío; el Imperio 2×2 no aguanta más ciudades.
- **A Mármol**: greca y pergamino cálidos, crónica con meses en latín. Fallos: cabecera de ~300 px arriba, modal roto (barra a media pantalla, botones cortados), greca más griega que romana.

## Lectura del director (no es el voto)
B gana por claridad y ergonomía con ventaja clara (118 frente a 102). El jurado de arte la penaliza por genérica; D es la más romana pero la más densa. Combinación posible: **estructura de B + lenguaje de D** (sello de lacre y pergamino en el informe, capitulares, rojo y oro, Cinzel en títulos). Es una propuesta, la elección es del usuario.

## Salvedades
Son HTML con datos fijos, no el juego real; ninguna probada con un dedo en móvil real. Pantallas Ciudad/Senado/Saber/General solo con aviso. Los jurados son agentes Sonnet y puntuaron sobre capturas; el de arte y el novato discrepan en el orden de D. Construir al ganador (cambios en `js/ui.js` y `css/style.css`) será otra tarea, a aprobar por el usuario.

## Gasto
**3,45 M frente al tope duro de 3 M (+15 %)**: concursantes 1,73 M (cuatro de ~0,43), jurados 0,51 M, director 1,22 M (incluye el rodeo inicial para conseguir el repositorio y las lecturas de guías). Todo en Sonnet. Aviso dado al llegar al tope; no se gastó más.
