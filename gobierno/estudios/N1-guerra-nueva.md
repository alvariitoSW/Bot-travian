# N1 · Guerra nueva: «planeas y luego miras»

Diseño para rehacer la parte de guerra de AQVILA. Pedido del usuario (11/11/2026): «quiero rehacer toda la parte de
guerra, es muy simplona y fea, tiene que ser un videojuego de estrategia». Sus respuestas: entra la batalla **y** la
campaña militar; hoy falla todo (se ve fea, hay poco que decidir, se maneja mal, el enemigo es tonto); combate de
**planear y luego mirar**; primero diseño y maqueta.

Maqueta para probar en el móvil (en horizontal): `gobierno/maquetas/guerra-nueva.html`.

## 1. La idea en cuatro frases
- La batalla va por **rondas**. Con todo parado das las órdenes; después las dos partes se mueven a la vez durante
  unos 20 segundos y tú solo miras. Y vuelta a planear.
- No hace falta ser rápido con los dedos: se gana **pensando**, no pulsando.
- No puedes mandar a todos a la vez: el general tiene pocos **puntos de mando** por ronda. Elegir a quién se los das
  es la decisión.
- La batalla empieza antes, en el mapa: dónde la das, con qué comida, con qué general y si el enemigo te ha visto.

## 2. La batalla
**Ronda de plan (todo parado, vista desde arriba).**
- Tocas un regimiento o un ala entera y dibujas con el dedo adónde va. Eliges qué hace: aguantar, avanzar, cargar,
  hostigar (tirar y retroceder), retirarse, relevar.
- Una **sombra** enseña dónde acabará cada regimiento al final de la ronda.
- Cada orden cuesta 1 punto de mando. Un general normal da 4; uno bueno, 6. Quien no recibe orden sigue con la que
  tenía. Si el general cae, quedan 2.
- Una orden puede llevar una **condición**: «si te cargan, aguanta», «si huyen, no persigas».
- Del enemigo ves lo que tus tropas ven. Con exploradores, ves también su intención (una flecha tenue).

**Ronda de ejecución (20 segundos, vista de cerca en 3D).**
- La cámara va sola al choque más importante. Puedes mover la vista, pero no dar órdenes.
- Aquí está el espectáculo: polvo, jabalinas con arco, estandartes, caídos que se quedan en el suelo, la línea que
  cede poco a poco.
- Una batalla igualada dura de 8 a 12 rondas: unos diez minutos.

**Lo que hace que haya estrategia.**
| Pieza | Qué decide el jugador | Estado hoy |
|---|---|---|
| Flanco y espalda | Dónde meter la caballería | Ya existe |
| Terreno (colina, bosque) | Dónde plantar la línea | Ya existe |
| Cansancio y moral | Cuándo parar y cuándo apretar | Ya existe; falta que el miedo se contagie |
| Reserva y **relevo de líneas** | Cuándo cambiar hastati cansados por principes | Nuevo |
| Formaciones (testudo, cuña, falange) | Aguantar flechas, romper, frenar caballos | Nuevo |
| Emboscada | Esconder ligeros en el bosque (P72) | Nuevo |
| Cartas de táctica | Tres por batalla, según el general: arenga, paso doble, retirada fingida | Nuevo |
| Tiempo y hora | Lluvia que estropea los arcos; sol de cara | Nuevo |

**Un enemigo que piensa.** Antes de empezar elige uno de cinco planes según sus tropas y el terreno: centro fuerte,
envolver por las dos alas, defender la colina, emboscar, hostigar y huir. Cada ronda lo revisa: manda la reserva al
punto débil, busca tu flanco con los jinetes y se retira si va perdiendo. Tres niveles de dificultad.

## 3. La campaña militar (el mapa)
- **Ejércitos con general.** Un ejército es una pieza en el mapa con su general (rasgos que da la experiencia) y sus
  regimientos. Ya no son marchas sueltas. El mapa va por turnos: una estación, un turno (I2, ya aprobada).
- **Posturas.** Marcha normal, marcha forzada (llega antes, llega cansado), fortificarse (campamento, P73), emboscar
  (P72), saquear el campo.
- **Comida.** El ejército come grano. En tierra propia lo recibe; en tierra enemiga forrajea o pasa hambre: baja la
  moral y hay deserciones. En invierno, más.
- **Asedios.** Cercar una ciudad (cae por hambre en varios turnos), asaltarla (rápido y sangriento) o levantar el
  cerco si llega un ejército de socorro.
- **Antes de la batalla** eliges: darla, retirarte o esperar refuerzos. El campo sale del sitio del mapa donde os
  encontráis, y la estación pone el tiempo.
- **Exploración.** De un ejército enemigo solo ves el tamaño aproximado, salvo que tengas jinetes exploradores cerca.

## 4. Qué se tira y qué se guarda
- **Se rehace todo lo que el jugador toca y ve**: órdenes, cámara, pantalla, efectos, enemigo, ejércitos en el mapa.
- **Se guarda el motor de dentro**: las reglas de moral, cansancio, papeles de tropa y terreno ya funcionan y están
  probadas. Tirarlas costaría unas diez tareas sin que se notara nada.
- La regla de la casa sigue: la batalla recibe dos ejércitos y su contexto (terreno, tiempo, general, cartas) y
  devuelve bajas. No sabe nada de economía.
- **Límite honrado sobre el aspecto**: es un juego de navegador en un móvil, con el arte libre de 0 A.D. Puede verse
  mucho mejor que hoy (luz, polvo, formaciones, cámara), pero no como Total War en un ordenador.

## 5. Historia
- Histórico (citas de memoria, **por cotejar** con la skill `historia`): el relevo de las tres líneas (Livio VIII 8;
  Polibio VI 21–23), el campamento de marcha (Polibio VI 27–42), envolver por las alas en Cannas, 216 (Polibio III
  113–117), emboscadas del Trebia y Trasimeno, asedios de Siracusa (213–211), Capua (211) y Cartago (149–146).
- Licencia de juego: las rondas, los puntos de mando, las cartas de táctica y todos los números.

## 6. Plan por piezas (carril N)
| Tarea | Qué se nota al jugar | M aprox. |
|---|---|---|
| N2 Rondas | La batalla va por plan y ejecución, con sombras | 1,5 |
| N3 Mando y general | Puntos de mando; el general importa y puede caer | 1,0 |
| N4 Enemigo con planes | El rival envuelve, embosca, guarda reserva y se retira | 1,5 |
| N5 Relevos y formaciones | Tres líneas que se relevan; testudo, cuña, falange | 1,2 |
| N6 Espectáculo | Cámara sola, polvo, proyectiles, caídos, luz y tiempo | 1,5 |
| N7 Ejércitos con general | Piezas en el mapa con posturas (pide I2) | 1,5 |
| N8 Comida y desgaste | Marchar lejos cuesta; el invierno pesa | 1,0 |
| N9 Asedios | Cercar, asaltar, socorrer | 1,5 |
| N10 Exploración y emboscadas | Niebla, exploradores, P72 | 1,2 |

Total: unos 12 M, de nueve a diez sesiones. Orden recomendado: N2 → N4 → N3 → N6 (con eso la batalla ya es otra);
después N5, y la campaña (N7 a N10) cuando I2 esté hecha.

**Tareas que quedan absorbidas** si se aprueba: L3 (sombras y cartas), L1b, A1 y A2 (formaciones), A6 (cámara y
efectos), A8b (ritmo), P72 (emboscadas) y P73 (campamento).

## 7. Lo que decide el usuario
1. ¿Te convence la maqueta? Es fea a propósito: enseña cómo se juega, no cómo se verá.
2. ¿Aprobamos el carril N entero o solo las cuatro primeras?
3. Puntos de mando: ¿te gusta no poder mandar a todos, o prefieres órdenes libres?
