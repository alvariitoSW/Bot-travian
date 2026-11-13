# Batalla nueva: maniobra + choque (documento aportado por el usuario, 13/11/2026)

> Texto tal cual del informe subido al chat. Las ocho capturas de referencia están en `gobierno/maquetas/piezas-batalla/referencias/`. Su primer párrafo («Encargo para la sesión de gobierno») pide guardar el informe, añadir B1 a B7 al tablero y empezar por B1: eso está PENDIENTE de confirmación del usuario (ver BITACORA, «Esperando algo del usuario»).

Encargo para la sesión de gobierno de AQVILA
Guarda este informe tal cual en gobierno/estudios/batalla-nueva.md. Guarda las ocho capturas en gobierno/capturas-tarea/ con su nombre (batalla-1-planear.png … batalla-8-pausa-automatica.png) y batalla.html en gobierno/maquetas/batalla-nueva/. Añade al tablero, carril N, las tareas B1 a B7 de la sección 7 con su presupuesto, y apunta en la bitácora que el usuario aprobó este diseño el 13/11/2026. Después, con la skill plan-socialista, empieza por B1. Una tarea por sesión, en Sonnet. No toques js/battle.js.
AQVILA · Batalla nueva: maniobra + choque (encargo para Sonnet)
Diseño cerrado con el usuario el 13/11/2026. Las ocho capturas batalla-1 a batalla-8 y batalla.html son la referencia visual obligatoria: la pantalla final debe parecerse a ellas (disposición, textos, colores). Donde este texto y las capturas no coincidan, manda este texto.
Las cifras marcadas «(orient.)» son orientativas: se fijan con test/equilibrio.js. Lo demás no se cambia sin preguntar al usuario.
0. Qué cambia para el jugador
Antes, una batalla era un campo abierto con regimientos que se mueven en tiempo real cortado en rondas de 20 s, ocho botones y nadie sabía qué decidía. Ahora:
Maniobra (capturas 5 y 6): antes de chocar, tus legiones se mueven varios días por un mapa pequeño de la zona. Gestionas víveres, cansancio y posición. Ahí se gana o se pierde la ventaja, y a veces la batalla ni llega a darse.
Choque (capturas 1, 2, 4, 7 y 8): tres sectores (ala izquierda, centro, ala derecha). Corre en directo; en cada pausa eliges uno de tres planes de tus tribunos o das órdenes a mano, y pulsas «Seguir». Al final, «Lo que pasó» (3).
Maniobra también dentro del choque (captura 7): rodear por el terreno, mover tropas entre sectores, reserva oculta y retirada fingida. Es lo que deja ganar a un ejército más pequeño.
1. Decisiones del usuario
Maniobra antes y durante la batalla. Debe tener peso real: equilibrar a un ejército pequeño frente a uno grande.
La maniobra previa pone las condiciones (terreno, despliegue, cansancio, flancos) y, en casos extremos, decide sola: un ejército sin víveres o cercado se rinde o se retira sin pelear.
Maniobra previa en un mapa propio de la zona (6 a 10 puntos), no en el mapa del Mediterráneo.
Dentro del choque, las cuatro maniobras: rodear por el terreno, mover entre sectores, reserva oculta, retirada fingida.
El choque va en directo con pausa táctica, como Rome 2 en el móvil: corre solo en 3D, pausas cuando quieras o se pausa sola cuando pasa algo importante (captura 8). No hay rondas.
Maniobra previa de hasta 8 días; niebla: solo ves lo cercano (vélites y équites ven más lejos).
El enemigo también puede rendirse o retirarse por hambre o cerco.
Despliegue: plantilla y retocar algún estandarte.
El general puede morir del todo (pierdes sus niveles).
Al ganar: prisioneros (esclavos, rescate o libertad), botín, veteranía y elegir perseguir o reagrupar.
Los tribunos son generales. Tú eres el César; tienes varios tribunos con nombre. Cada ejército necesita uno al mando: así hay un número máximo de ejércitos, no infinitos.
Cámara que sigue sola el choque; se puede arrastrar para mirar otra zona y vuelve sola. Velocidades ×1 y ×2.
Se pueden dar órdenes sin pausar, tocando un estandarte (sale la fila de órdenes y la batalla sigue).
Tope de 20 regimientos por bando en el campo para que no sea caótico y no rompa el arte. Se puede ir a la batalla con más tropas: el resto espera fuera como refuerzos, y cada vez que un regimiento propio huye o cae, entra uno de refuerzo por el borde de tu lado (el jugador elige el orden de entrada en el despliegue).
Supuestos (el usuario no contestó; cambiar si lo pide): - Una batalla igualada dura unos 4 minutos de reloj a velocidad normal, sin contar las pausas. - La pausa automática salta con: carga, flanco abierto, regimiento que huye, general en peligro, reserva enemiga que aparece. Ajuste: «todas / solo graves / ninguna». - Un ejército por general. Los tribunos nuevos los nombra el Senado con favor alto o ascienden de un regimiento veterano.
2. La maniobra (capturas 5 y 6)
Cuándo: cuando una marcha de campaña llega a una ciudad o ejército enemigo y entre los dos bandos hay más de 600 hombres (orient.). Por debajo se va directo al choque (escaramuza).
El mapa: 6 a 10 puntos unidos por caminos. Cada punto tiene un tipo:
Tipo
Efecto si el choque empieza allí
Castra (campamento)
Repone víveres; el defensor empieza desplegado
Cerro
Sector alto: quien lo ocupa recibe −25 % de daño (orient.)
Vado
Quien cruza llega cansado y Vacilante
Puente
Único paso: el centro del choque es el puente; solo cabe un regimiento de frente
Pinar / bosque
Esconde lo que hay dentro: permite emboscar
Cruce, llano
Sin efecto
Cada batalla tiene su plantilla de zona en js/data.js (empezar con 4 plantillas: río, cerro, bosque, paso), elegida por el terreno que ya tiene cada ciudad (D.CIUDADES[...]).
Por días, los dos bandos a la vez, 8 días como máximo (orient.): - Cada día, cada legión (grupo de regimientos) va a un punto vecino o se queda. - Víveres: cada legión lleva días de comida (empieza con 6, orient.). Cada día fuera de la castra gasta 1; marchar por vado o bosque gasta 2. En la castra se repone. - Cansancio: marchar sube el cansancio de la legión; quedarse quieto lo baja. - Niebla: solo ves al enemigo en puntos vecinos a los tuyos. Lo que no ves sale con «?» (captura 5). En bosque no se ve aunque sea vecino, salvo que exploren vélites o équites. - El enemigo sigue uno de los cinco planes que ya existen (Battle.PLANES), traducidos a movimientos.
Cada día, los tres tribunos proponen (captura 5): tres opciones con etiqueta Favorable / Dudoso / Arriesgado y un motivo. Se toca una y «Pasar el día». «A mano» deja mover cada legión tocando el punto destino.
El choque empieza cuando dos legiones enemigas coinciden en un punto o en el mismo camino. Pantalla de aviso (captura 6) con cuatro líneas: qué pasa, cómo llegas tú, cómo llegan ellos, terreno. Botones «A la batalla» y «Retirarse» (pierdes víveres y algo de moral, no hombres).
La maniobra decide sola si al empezar un día: - una legión está sin víveres 2 días seguidos: se retira sola, con bajas por deserción (10 %, orient.); - una legión está cercada (todos sus caminos ocupados por el enemigo): se rinde si su fuerza es menos de la mitad de la del enemigo; si no, choque con todos los flancos abiertos.
Lo que pasa al choque (cfg de la batalla): terreno de sectores según el punto, quién está desplegado, ánimo inicial (Vacilante si llegó por vado o emboscado), cansancio inicial, y si algún sector empieza con el flanco abierto (si llegó una segunda legión tuya por otro camino).
3. El choque (capturas 1, 2, 4, 7 y 8)
Estado (todo pequeño, sin posiciones x/y libres): - Tres sectores. Cada sector: línea de choque de −2 a +2, rasgo de terreno, y por bando una fila de frente y una de apoyo (hasta 3 regimientos cada una, orient.). Con reserva y alas, el tope total es de 20 por bando; el resto, cola de refuerzos fuera del campo. - Reserva común por bando. General en un sector. - Regimiento: tipo, hombres, Ánimo (Firme, Vacilante, Desordenado, Huye) y Cansancio (3 puntos). - Mando: 5 puntos con general, 2 sin él; se recargan con el tiempo (ver abajo).
Directo con pausa (capturas 1, 2, 7 y 8): - El tiempo corre en pulsos de 2 s (orient.): en cada pulso cada sector se resuelve con la regla de abajo. El 3D enseña continuo lo que deciden los pulsos. - Pausa cuando el jugador toca «II» o cuando salta un aviso (lista en §1). En pausa: la cámara va al sitio del aviso y salen los tres planes (captura 8) o la vista general con planes (capturas 1 y 7). - Las órdenes dadas en pausa se aplican al seguir. El mando se recarga 1 punto cada 10 s (orient.), hasta 5.
Lo que en las capturas pone «Ronda» y «Ver la ronda» pasa a ser «En pausa · m:ss» y «Seguir ▶».
En cada pausa: 1. El enemigo anuncia un gesto (franja morada, como hoy). 2. Los tres tribunos proponen un plan completo cada uno, de tipos distintos: uno prudente, uno agresivo, uno astuto. Cada plan son posturas por sector más gastos de mando. Etiqueta: Favorable si la fuerza propia en el sector clave supera a la enemiga en más de un 15 % o hay flanco libre; Arriesgado si es inferior en más de un 15 %; Dudoso en el resto. 3. El jugador toca un plan o va a «A mano» (captura 4): toca un estandarte y elige en la fila de abajo. 4. «Seguir ▶»: el combate continúa (captura 2) hasta la siguiente pausa. 5. «Lo que pasó» (captura 3) sale solo al final de la batalla, con persecución, prisioneros y botín.
Órdenes a mano (fila de captura 4): Aguantar (gratis), Avanzar (1), Cargar (1), Hostigar (1), Relevar (2), Retirarse (1). Por sector, la postura sale de ellas: Avanzar/Cargar = presionar, Aguantar = sostener, Retirarse = ceder.
Resolución por sector: golpe = fuerza del frente × postura × ánimo × cansancio × contra de tropas × terreno × saberes, más un cuarto de la fuerza del apoyo (orient.). Quien gana por más de un 15 % mueve la línea un paso. Quien pierde por más de un 50 % baja un estado de ánimo. Cansancio en el frente: presionar gasta 1 punto de los tres cada 20 s; sostener, cada 40 s; ceder, nada. En el apoyo se recupera 1 punto cada 20 s (orient.). Un regimiento con los tres puntos gastados no puede presionar.
Fin: pierde quien tiene dos sectores rotos (frente que huye sin apoyo, o línea en −2 y pierde otra vez), o quien pierde al general con el ánimo bajo. Objetivos que ya existen (cfg.objetivo): «resistir» pasa a segundos (unos 2 minutos, orient.).
4. Las cuatro maniobras dentro del choque (captura 7)
Maniobra
Coste de mando
Qué hace
Riesgo
Rodear por el terreno
2
Un regimiento de un ala sale del campo y entra unos 20 s después (orient.) por el flanco o la espalda de un sector enemigo. Solo si el terreno tiene vado, bosque o cerro lateral
Si el enemigo explora (gesto «vigila el flanco»), lo intercepta y llega Vacilante
Mover entre sectores
1 por regimiento
Pasa un regimiento al sector vecino
El sector que deja queda con un regimiento menos unos 10 s
Reserva oculta
0 (se marca al desplegar)
El enemigo no ve la reserva ni la cuenta en sus planes. Al entrar, golpe ×1,3 durante 10 s (orient.)
Si no entra antes del minuto 2, se descubre
Retirada fingida
2
Un sector cede dos pasos a propósito sin perder ánimo. Si el enemigo entra a −2 y los sectores vecinos aguantan, queda en bolsa: golpe por el flanco y −1 ánimo cada 10 s
Si un vecino también cede, el sector se rompe de verdad
El enemigo puede usar las mismas cuatro según su carácter (Aníbal astuto: retirada fingida y rodeo; galo impetuoso: nunca finge; rey helenístico prudente: reserva oculta).
5. Pantalla (copiar las capturas)
Horizontal 844×390. Barra arriba: «En pausa · m:ss» o el día de maniobra, fuerzas y barra roja/púrpura. Objetivo arriba a la izquierda, gesto enemigo arriba a la derecha. Nombres de sector abajo del campo, sobre las tarjetas.
Estandarte = ficha del regimiento. Tela del color del bando, emblema del tipo, borde con el ánimo (oliva, oro, terracota, gris), tres puntos de cansancio debajo, nombre a la derecha de la tela (no encima).
Abajo: tres tarjetas de tribuno (nombre y carácter, título, motivo, etiqueta de color), «A mano» y el botón rojo con borde de oro («Seguir» con el mando que queda). En «A mano», la fila de seis órdenes con su coste.
Flechas del plan elegido en oro; gesto enemigo en morado claro; rodeos en oro discontinuo con etiqueta «Por el vado · 20 s».
Colores: los de la guía E1 (gobierno/estudios/E1-guia-de-arte.md). Nada más.
Botones de 44 px o más; letra de 11 px o más (las capturas usan 11 a 14).
6. Técnica
Motor nuevo y aparte: js/batalla2.js (corre en Node, sin pantalla). Exporta crear(cfg), consejo(estado,   bando), aplicar(estado, ordenes, bando), pulso(estado, semilla) → { estado, sucesos, pausa } (un pulso de 2 s; pausa dice si salta aviso y por qué). Lo mismo para la maniobra en js/maniobra.js: crear, consejoDia, moverDia, resolverDia.
El motor viejo (js/battle.js) no se borra. Interruptor en Ajustes «Batalla nueva / clásica». Se borra cuando la nueva se juegue entera y el usuario diga.
El 3D enseña el estado en directo: js/gfx/battle3d.js recibe la lista de sucesos («centro: la línea retrocede», «Hastati III: Desordenado», «équites entran por la espalda») y los enseña con las animaciones que ya hay (marchar, correr, atacar, morir). Sin simulación de posiciones. Los estandartes se dibujan como en las capturas.
La batalla sigue sin saber de economía: recibe dos ejércitos y devuelve bajas, prisioneros y estado del general.
Guardado: una batalla o maniobra a medias se guarda en G y se migra en G.load.
7. Tareas, en orden (una por sesión, Sonnet, con plan-socialista)
#
Tarea
Archivos
Presupuesto
Hecho si
B1
Motor del choque sin pantalla
js/batalla2.js, test/batalla2.test.mjs
1,2 M
Pruebas: pulso, sectores, ánimo, avisos de pausa, fin, consejo con tres tipos distintos; bot que elige siempre «Favorable» gana 4 o más de 10 igualadas
B2
Las cuatro maniobras del choque y el enemigo
js/batalla2.js, pruebas
1,0 M
Prueba: con rodeo o retirada fingida bien hechos, un ejército a 0,75× gana 3 o más de 10
B3
Pantalla 2D del choque (sin 3D)
js/ui.js, css/style.css
1,2 M
Capturas iguales a 1, 3, 4, 7 y 8 sobre un fondo liso; se gana una batalla solo con tarjetas
B4
3D en directo
js/gfx/battle3d.js
1,5 M
Captura igual a 2; cámara que va sola a la pausa; estandartes como en las capturas; nada tapa a nada
B5
Motor de la maniobra sin pantalla
js/maniobra.js, js/data.js (4 plantillas), pruebas
1,0 M
Pruebas de víveres, niebla, emboscada, rendición; bot de maniobra que mejora el resultado del choque
B6
Pantalla de la maniobra
js/ui.js, css/style.css
1,0 M
Capturas iguales a 5 y 6
B7
Conectar con la campaña, tribunos-generales e interruptor
js/game.js, js/data.js, js/ui.js
0,8 M
Jueces APTO; una campaña con el bot termina con la batalla nueva
Total ≈ 7,5 M (realista 10 a 12). B1 y B5 pueden ir a la vez (no comparten archivo). B3 y B6 también, después.
8. Defender tu ciudad (tanda siguiente, ya decidida)
El usuario quiere defender en las afueras de su ciudad, y que lo que haya construido cuente: si la ciudad está muy mejorada, puede tener un río o foso con agua, arqueros en torres y más, y defenderse mucho mejor. - El campo de batalla sale del plano real de tu ciudad (js/ciudad.js): río, puente, muralla, arrabal. - Cada obra defensiva da un rasgo a un sector: foso o río (el atacante cruza Vacilante y cansado), torres con arqueros (tiro sobre el sector cercano), empalizada o muralla (el defensor recibe menos daño; cifras de hoy: 0, 3, 6), puerta (único paso si hay muralla). - Antes del choque repartes la guarnición por sectores (plantilla y retocar). - Obras defensivas nuevas (decididas): foso con agua, torres con arqueros u honderos, empalizada exterior y trampas y zanjas (frenan caballería y elefantes). Se construyen en la ciudad como cualquier obra y aparecen en el campo de defensa.
Supuestos de esta tanda (sin respuesta del usuario): - Asedio cuando atacas tú: cerco en el mapa (meses: hambre, minas, máquinas) y luego asalto por puerta, muro o brecha, con el mismo motor. - Batalla naval: el mismo motor con barcos (embestir, mantener la línea, abrirse, abordar; Corvus), en una tanda posterior. - Se resuelven solas: escaramuzas de menos de 600 hombres y batallas en las que un bando triplica al otro, con aviso y resultado; además, botón «Delegar» en cualquier batalla, con un resultado algo peor que jugarla bien.
9. Otras decisiones del usuario
Veteranía en tres grados (bisoños, normales, veteranos) con marca en el estandarte; los veteranos rinden más y cobran más.
Sonido y música: cuernos, choque, cargas y gritos, y música de fondo que sube en el choque. Solo música con licencia libre verificada y su crédito; con interruptor.
El tiempo cuenta: la niebla esconde tropas, la lluvia quita fuerza al tiro, el invierno cansa más, el atardecer reduce la vista. Se ve en la escena y sale como causa en la línea «Rival» (▲▼).
Aspecto: los soldados 3D de 0 A.D. que ya hay, con la cámara cerca. Las capturas son el boceto de la interfaz encima, no el estilo de las tropas.
Escala: 20 a 40 figuras por regimiento en pantalla.
Gran victoria: triunfo en Roma (desfile en la ciudad 3D, mucho favor del pueblo) y fama del general (sube de rango; si gana demasiado, el Senado le teme). Nada más fuera de la batalla. (El usuario marcó también «Nada extra»; se lee como «solo esas dos».)
Dificultad del rival: su carácter (Aníbal muy bueno, jefe galo impetuoso) y además la dificultad elegida (Tranquila, Normal, Dura). Se dice antes de empezar, en la línea «Rival» con sus causas ▲▼.
Frente y retaguardia: en cada batalla el jugador reparte su ejército entre los que luchan y la retaguardia, que guarda el campamento (víveres y tiendas) y vigila la espalda. Si otro ejército enemigo llega por detrás durante el choque, choca primero con la retaguardia; si no hay nadie, quema los víveres y ataca por la espalda. En la maniobra, el campamento es un punto más del mapa y se puede atacar.
Doble línea de asedio (idea de Alesia; tanda de asedios): al sitiar se puede levantar una línea hacia la ciudad (contravalación) y otra hacia fuera (circunvalación) contra el ejército de socorro. Cuesta tiempo y brazos; cada línea da un rasgo defensivo a sus sectores. Alesia es del 52 a. C., fuera de la campaña (280–146): se usa como mecánica, con la nota «licencia de juego» en el registro histórico.
Retaguardia como cuarto sector, abajo del campo: el campamento con su guardia. Si llega otro ejército, se pelea ahí y salta una pausa automática.
Refuerzos a mitad de batalla: un ejército (tuyo o enemigo) que estaba en un punto vecino en la maniobra entra por el borde del lado por el que venía, tras un tiempo según la distancia.
Prioridad: primero el choque en directo con pausa (B1 a B4); la maniobra (B5, B6) después.
Supuestos de esta vuelta (sin respuesta del usuario): - Tropas por época: las mismas, mejoradas por los saberes (armas, armaduras, moral), como ya hace la herrería. - Tropas de otros pueblos: las dan las ciudades aliadas o súbditas (sus tropas típicas). Mercenarios, más adelante. - Heridos: un tercio de las bajas eran heridos y vuelven en unos meses si el ejército está en campamento o ciudad.
10. Lo que no se hace en esta tanda
Batallas navales, asedios, defensa de tu ciudad (§8), ejércitos de más de tres legiones en la maniobra, multijugador.
Anexo · Las ocho capturas de referencia

1 · Planear

2 · Choque

3 · Lo que pasó

4 · A mano

5 · Maniobra

6 · Emboscada

7 · Maniobra en batalla

8 · Pausa automática
