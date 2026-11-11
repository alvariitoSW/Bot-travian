# Bases del concurso K

## Común
Eres concursante del CONCURSO DE DISEÑO DE INTERFAZ de AQVILA (juego de estrategia romano, 280–146 a.C., PWA móvil; el usuario es médico, no programador, juega en el móvil). Haz UNA maqueta HTML autocontenida (CSS/JS/SVG a mano, interactiva con toques simples, sin dependencias externas) que proponga un REDISEÑO TOTAL y atrevido de la interfaz, con el concepto que se te asigna abajo. Puedes proponer tirar todo y empezar de cero. Punto de partida a superar: gobierno/capturas-tarea/J1-ciudad.jpg, J1-guerra.jpg, J1-menu.jpg (míralas) y gobierno/maquetas/ (A.html, B.html, _fondos.mjs, _captura.mjs, fondos .jpg). Lee gobierno/estudios/E1-guia-de-arte.md (paleta Noche #0b1016, Rojo legión #c0281f, Oro #e9c063, Bronce #b8862b, Mármol #f1ead9, Piedra #9aa6b4, Oliva #8fae5a, Terracota #d9764a; se puede romper razonándolo). Lee solo lo necesario; no releas archivos grandes ni gobierno/cuadro.json.
Reglas: español en todo; frases cortas; botones que dicen lo que hacen; MENOS botones a la vista es mejor; todo alcanzable con el pulgar; texto mínimo 13 px. Arte solo de 0 A.D. (CC BY-SA, ya en assets/) o dibujado a mano en SVG/CSS; ideas de otros juegos sí, código y arte de juegos comerciales NUNCA. NO toques el juego (js/, css/, index.html, sw.js): escribe SOLO los tres archivos de entrega. Datos de ejemplo históricos plausibles (Roma, Cartago, Pirro, Aníbal, Escipión, Fabio Máximo, Tarento, Capua...).
Entrega (K-ID = el identificador que se te da):
1) gobierno/maquetas/concurso/K-ID-nombre.html (usa el nombre corto de tu concepto en minúsculas sin tildes).
2) Captura(s) JPG con Playwright (Chromium pre-instalado; require('playwright'); ver gobierno/maquetas/_captura.mjs): una por pantalla, en gobierno/capturas-tarea/ como K-ID-1.jpg, K-ID-2.jpg, K-ID-3.jpg (y más si quieres). MIRA las capturas (Read) y corrige lo que se vea mal (solapes, texto cortado, escala) antes de entregar.
3) gobierno/maquetas/concurso/K-ID-nota.md: exactamente cinco líneas numeradas: 1 la idea; 2 cómo se juega con el pulgar; 3 qué botones quedan a la vista (cuántos); 4 qué parte de js/ui.js o js/gfx/ habría que cambiar; 5 coste estimado en tareas (sesiones). Sin el nombre del autor ni del modelo.
Cuida el gasto: sé directo, un solo HTML bien hecho (~600-900 líneas máx.), pocas iteraciones. No hagas commit ni push. Al terminar responde con 3 líneas: archivos entregados y qué pantallas muestra.

## Concurso Gobierno
CONCURSO GOBIERNO — vertical 390×844. Política y senado, intrigas y conspiraciones, bienestar y felicidad de la población, gestión de recursos y obras, catástrofes (incendio, plaga, inundación, hambruna), revueltas. Debe mostrar, como mínimo, TRES pantallas: (1) la vista principal; (2) una decisión política o una intriga; (3) una crisis (catástrofe o revuelta) en curso y cómo se atiende con el pulgar. Captura a 390×844, deviceScaleFactor 2.

## Concurso Guerra
CONCURSO GUERRA — horizontal 844×390. Batallas de estrategia con tropas romanas tipo Total War Rome 2, de varios tipos (campo abierto, asedio, emboscada, defensa de una ciudad), con formaciones (hastati, principes, triarii, velites, equites, manípulos, testudo…), órdenes, moral y refuerzos. Debe mostrar, como mínimo, TRES pantallas: (1) despliegue; (2) batalla en pleno choque (órdenes a un regimiento, flanqueo o carga); (3) resultado o retirada. Para fondos puedes usar gobierno/captura-batalla.mjs o dibujar el campo en SVG/CSS. Captura a 844×390, deviceScaleFactor 2.

## Conceptos (uno por concursante; K-ID es la clave)

### K-ID = gob-1-senado
Concepto: MESA DEL SENADO. Todo el juego es una mesa de mármol con tablillas de cera: cada asunto (obras, grano, tropas, leyes) es una tablilla que se desliza, apila y sella con el anillo. Sin menús: la mesa es la pantalla.

### K-ID = gob-2-cursus
Concepto: PERGAMINO / CURSUS HONORUM. Un único pergamino vertical infinito que se desenrolla; tu carrera política (cuestor→edil→pretor→cónsul) es la columna; decisiones, intrigas y obras brotan como entradas del pergamino con sellos y lacre. Popularidad, clientela y favor del Senado como medidores de tu carrera.

### K-ID = gob-3-tablero
Concepto: CIUDAD COMO TABLERO VIVO. La ciudad llena la pantalla, sin paneles; los problemas aparecen como avisos flotantes sobre los propios edificios y barrios (humo, multitud, rata, agua) y se resuelven ARRASTRANDO recursos/personas del borde inferior sobre el aviso. Intrigas como hilos rojos entre palacios.

### K-ID = gob-4-cartas
Concepto: CONSEJO DE ASESORES EN CARTAS (estilo baraja de decisiones, deslizar a izquierda/derecha). Cada asesor (cuestor, augur, tribuno, general, mercader, cliente) trae una carta; el deslizar decide; cuatro medidores (Pueblo, Senado, Tesoro, Legiones) arriba. Crisis = baraja de emergencia con cuenta atrás.

### K-ID = gob-5-cronica
Concepto: CRÓNICA / CALENDARIO ROMANO COMO LÍNEA DE TIEMPO. Una rueda o franja del año (Calendas, Nonas, Idus, festivales, cosechas) en la que se PLANIFICA: arrastras obras, juegos y leyes a fechas; lo que viene (plagas, elecciones, conspiraciones) se anuncia como presagios en el tiempo. Interfaz por gestos, casi sin botones.

### K-ID = guerra-1-arena
Concepto: MESA DE ARENA CENITAL. Vista desde arriba de una mesa de arena del estado mayor con fichas de madera/bronce talladas por regimiento; se empuja, gira y se estira cada ficha con los dedos; el terreno es modelado en relieve. Casi sin interfaz: el tablero es la interfaz.

### K-ID = guerra-2-cartas
Concepto: CARTAS DE UNIDADES EN MANO. Una mano de cartas en el borde inferior (cada regimiento una carta con retrato, moral y cansancio); se juega arrastrando la carta al mapa; cartas de táctica (testudo, carga, retirada, refuerzo) se combinan con las de unidad.

### K-ID = guerra-3-trazo
Concepto: DIBUJAR CON EL DEDO LA LÍNEA DE BATALLA. En el despliegue trazas una línea y los regimientos se reparten sobre ella (triplex acies); en combate dibujas flechas de avance, flanqueo y retirada que los regimientos siguen. Sin barras de botones: gestos y trazos.

### K-ID = guerra-4-general
Concepto: CÁMARA DE GENERAL CON RUEDA DE ÓRDENES. Vista 3D baja detrás de la línea; pulsar un regimiento abre una rueda radial de órdenes con el pulgar (avanzar, mantener, cargar, flanquear, testudo, retirar); minimapa y moral en el borde; todo en el hemisferio del pulgar.

### K-ID = guerra-5-partitura
Concepto: UNA SOLA BARRA DE TEMPO TIPO PARTITURA. Debajo del campo hay un pentagrama temporal: cada regimiento es una línea; planificas órdenes como notas en el tiempo (a los 20 s carga de la caballería, a los 40 s entran los triarios) y ves el choque desarrollarse sobre la partitura; pausa táctica y reproducción.
