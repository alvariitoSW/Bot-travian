# GM25 · Mapa libre, posturas y campamentos (diseño, 16/11/2026)

Solo diseño: ni código ni maqueta. Nada se construye hasta que contestes las dudas del apartado 9.
Tu pedido: mapa mucho más grande; ejércitos que se mueven libres, se esconden, montan campamento y luchan desde él;
cada turno, una distancia de movimiento; modos emboscada, saqueo y campamento (ideas de Total War, nunca su código).

**Lo que miré**: `CLAUDE.md`; en `js/game.js` el viaje (`G.travel`), los turnos (`llegada`, `G.finTurno`, `tick`), las
marchas, los encuentros de GM15b y `G.load`; en `js/data.js` `D.EDGES`, `D.SITIOS`, `D.CAMPO`, `D.WORLD`; en
`js/gfx/map3d.js` la cabecera y la malla; GM15 (§0, §5, §6) y la ficha de sitios. Medí las distancias de los caminos con un
cálculo de lectura.
**Lo que no**: `js/battle.js` (supongo que acepta la ficha de campo como en GM15b), `js/ui.js`, el motor único GM11, el
estudio R11 (turnos simultáneos), ningún dato de ríos. No probé nada en móvil. Rome II, solo de memoria.

## 1. Qué ve y hace el jugador (móvil, 390 px)
1. Toca su ejército en el mapa. Se abre una hoja abajo con tropas, comida y **cuatro botones de postura**.
2. Toca cualquier punto de tierra. Sale una línea dorada con marcas de turno y un óvalo sombreado: **hasta dónde llegas
   este turno**. Si el punto queda lejos, la línea sigue y dice «3 turnos».
3. El óvalo se encoge en monte y bosque, y se estira por calzada. Un río sin vado corta la línea en rojo.
4. Elige postura (apartado 4). Pulsa «Fin de turno» (o deja correr el reloj). El ejército avanza.
5. Si el enemigo lo ve o él ve al enemigo, sale un aviso. Un toque abre «Atacar», «Esperar» o «Montar campamento».
6. La niebla oscurece lo que no ves. Lo ya explorado queda en gris.
7. Todo con un dedo: tocar, arrastrar el punto de destino, pulsar el botón de la hoja.

## 2. El mapa: cuánto más grande y cómo
- **Hoy**: mundo 1600×800 unidades; la malla 3D ya tiene 420×210 casillas (~88 000 vértices). Un mes de marcha son
  60 unidades. Roma–Capua son 2 meses; Mediolanum–Emporion, 6,2.
- **Separo dos cosas**: lo que se dibuja y lo que se juega. **No** subo la malla 3D: duplicarla a 840×420 son ~350 000
  vértices; en móvil es el riesgo mayor. Se queda como está.
- **Rejilla de juego aparte**: celdas de 10 unidades → 160×80 = 12 800 celdas, **un byte cada una** (tipo de terreno).
  Ocupa 13 KB. Se calcula al cargar con lo que ya existe: costa (mar/tierra) y alturas (`assets/mapa/alturas.js`):
  llano, colina, monte, bosque, pantano, río. Los ríos importantes se añaden a mano como líneas (no hay datos hoy).
- **«Mucho más grande»** puede ser dos cosas, y es la duda 1: (a) **más geografía** (Asia Menor, Egipto) o (b) **más
  recorrido** en el mismo mapa: el viaje libre va más lento (ej. 30 u/mes) y cruzar Italia son 4 turnos, no 1.
  Con (b) no cuesta nada dibujar.
- **Fluidez**: ruta por A* sobre 12 800 celdas (unos ms). Niebla: una textura de 160×80 sobre el mapa. Un ejército
  libre = una pieza más en la escena. Peso extra estimado: despreciable. Sin medir en móvil real.

## 3. Movimiento libre y el reloj
**Qué es un «turno»**. El juego tiene `D.TURNO_MESES = 3`: una estación. En modo turnos las marchas llegan al cambio de
estación; en tiempo continuo (pruebas, bot) los meses corren solos. Propongo **no tocarlo**:
- **Turno de movimiento = una estación = 3 meses**. Presupuesto: velocidad × 3. Infantería: 60 u/mes → 180 u/turno.
- En modo turnos, das las órdenes y al cerrar la estación se resuelve **todo a la vez**, en pasos de ¼ de mes (para que
  se vean y se topen a mitad de camino). En tiempo continuo gasta el mismo presupuesto con el reloj.
- Es **un solo reloj**: ningún turno nuevo, ningún modo aparte.

**Velocidad por celda** (orientativa, a afinar): calzada ×1,5 (los caminos de `D.EDGES`), llano ×1, colina ×0,7, bosque
×0,6, monte ×0,4, pantano ×0,4. Río: solo por vado o puente. Mar: no (los barcos siguen yendo por rutas marítimas).
**Por tropas**: se mueve el más lento. Jinetes ×1,5, legión ×1, con tren de bagaje ×0,8, héroe ya da `log`.
**Por postura** (apartado 4): marcha ×1, saqueo ×0,5, emboscada y campamento 0.

**Convivencia con los caminos**: los 16 caminos de tierra siguen siendo calzadas rápidas. Una marcha vieja (de ciudad a
ciudad) sigue igual. El libre es una marcha con **posición propia** y lista de puntos. GM15b se queda: toparse en
calzada, «Salir al encuentro» (pasa a ser «ir a interceptar»), «Apostar» (pasa a ser la postura emboscada).

## 4. Posturas
| Postura | Da | Cuesta |
|---|---|---|
| **Marcha** | Velocidad completa. | Visible; si te topan, batalla normal. |
| **Emboscada** | Escondido en bosque, loma o trigal; si el enemigo no te descubre, empiezas con ventaja (GM15 §5). Dura hasta ~1 mes. | No te mueves; comes igual. Solo en celdas aptas. |
| **Saqueo** | Sacas recursos de los pueblos de la zona (pierden ese ingreso) y comes del país. | Velocidad ×0,5; te ven de lejos (humo); ánimo −; el pueblo se arruina (reputación con aliados). |
| **Campamento** | Foso y empalizada: ver abajo. Cura y recibe refuerzos. | Montarlo gasta **medio turno** (1,5 meses) parado. Comes de tu reserva. |

**Campamento**
- **Montaje**: el primer turno parado en la celda lo deja «a medias»; al segundo, listo. Antes, solo parte del bonus.
- **Defensa**: el defensor recibe +25 % de defensa y los jinetes cargan peor contra la empalizada (cifras orientativas).
  Un ejército que lo ataca no tiene flanqueo libre.
- **Suministro**: cada ejército lleva comida para ~1 turno. Fuera de tu territorio y sin saquear, se acaba y desgasta.
  Dentro de un campamento junto a ciudad propia, reaprovisiona. (Lo ve R13; no lo he releído.)
- **Batalla desde el campamento**: se crea con la **ficha de campo** de GM15b más `campamento: true` y `nivel`. El
  motor de batalla recibe dos ejércitos y esa ficha; el defensor empieza dentro del recinto y detrás de la empalizada.
  La batalla no sabe nada de comida.
- **Quien lo ataca**: puede asaltarlo o **cercarlo** (le corta el suministro y el campamento se agota). Ver duda 5.

## 5. Cómo se descubre a un ejército escondido
- **Visión**: cada ejército ve en un radio (hoy propongo 30 unidades; 20 en bosque; 50 en loma). Jinetes ligeros ×2.
  El héroe suma. Una ciudad ve 40.
- **Escondido** = no se ve dentro del radio normal. Se descubre dentro de **~10 unidades** (la mitad con jinetes),
  con la probabilidad ya existente de `D.CAMPO.descubre` (70 % con buena caballería, 30 % sin ella).
- **Explorar**: manda a un jinete o activa «Explorar» y el radio sube; revela la niebla de tu lado.
- **Pueblos y ciudades enemigas** avisan al IA si ven pasar a alguien (no a ti: tú lo ves en el aviso).
- Moverse **rompe** el escondite; el saqueo y el campamento no se esconden.

## 6. Enlace con batalla y guardado
- **Batalla**: sin cambios de arquitectura. La campaña crea la ficha (terreno de la celda, hora, niebla, emboscada,
  campamento) y llama a la batalla con dos ejércitos. Las bajas vuelven. El terreno de la celda → rasgo (`rio`, `colina`,
  `bosque`, `llano`) como hoy `D.TERRENO_CAMPO`.
- **Guardado**: solo campos opcionales, **sin subir de versión**. En `G.load`, una `G.migrarLibre` como `G.migrarCampo`.
| Dato | Dónde | Partida vieja |
|---|---|---|
| `libre: {x, y, ruta[], postura, tPostura}` | en la marcha | Sin `libre` = marcha por camino, como hoy |
| `campamento: {x, y, nivel, tMontaje, owner}` | `s.campamentos[]` | Si falta, se crea vacío |
| `explorado` (celdas vistas, 1 bit cada una; ~2 KB) | `s.vis` | Se crea vacío; Italia y ciudades propias, vistas |
| `comida` del ejército | en la marcha | Si falta, lleno |

## 7. IA enemiga
- **Hoy**: `turnoIA` lanza marchas por camino cada estación; saquea a veces (`D.SAQUEO_IA`). No ve ni se esconde.
- **Nuevo, por orden**: (1) que respete tu niebla (si no te ve, no te evita); (2) que acampe cerca de tu ciudad antes de
  asediarla; (3) que pueda emboscar; (4) que mande patrullas de jinetes. Empieza por (1) y (2).
- **Cartago** acampa y saquea; **Pirro** y **Aníbal** cruzan libres con jinetes; **Macedonia** va por calzadas.
- **Riesgo grande**: que el enemigo no sepa usar la libertad (cruza ríos sin vado, se queda sin comida). Se afina con
  el bot de `test/sim.test.js`, que ya corre campañas enteras.

## 8. Tres variantes (coste en M de tokens, orientativo, sin medir)
| | Qué incluye | M | Tareas |
|---|---|---|---|
| **Mínima** | Rejilla de terreno, destino libre con A*, presupuesto por turno, postura campamento (defensa, sin suministro), niebla simple | ~3 | T1 rejilla y ruta; T2 mover y turno; T3 campamento y ficha; T4 pantalla |
| **Recomendada** | Mínima + 4 posturas + descubrir/explorar + comida + saqueo de pueblos + IA acampa y respeta niebla + guardado | ~6 | las 4 de arriba + T5 saqueo y comida; T6 visión; T7 IA; T8 fichas de historia |
| **Entera** | Recomendada + más geografía (Asia Menor, Egipto) + asedio de campamentos + patrullas + fusión de ejércitos + ríos con vados reales | ~11 | las 8 + T9 ampliar mapa y datos; T10 asedio; T11 ríos |
**Qué se tira o cambia de GM15b**: se **queda** el motor de encuentros, la ficha de campo, la niebla y la hora. **Se
sustituyen**: «Salir al encuentro» (por «ir a interceptar») y «Apostar» (por la postura). **Se reutiliza** `D.SITIOS`
como paisajes con nombre en las celdas, no como únicos lugares de batalla.
**Riesgos**: (1) el A* y la niebla sobre 3D, en móvil real, sin medir; (2) **la IA**, lo más caro de afinar; (3) que la
libertad sea tediosa en 390 px: muchos toques por turno; (4) el sitio pierde peso de «lugar histórico»; (5) el juego es
de turnos y 2–4 h; más movimiento alarga la partida (hoy `duracion.horasMax: 4`).

## 9. Dudas para ti (recomendación en negrita)
1. **«Más grande»**: (a) más geografía; (b) **más recorrido en el mismo mapa**; (c) ambas. *(Recomiendo b: más barato y no
   rompe el periodo 280–146.)*
2. **Turno**: (a) **el actual de 3 meses, todos a la vez**; (b) dividirlo en 3 pasos de 1 mes con órdenes en cada uno.
3. **Variante**: (a) mínima; (b) **recomendada**; (c) entera.
4. **Comida**: (a) **sí, desgaste suave**; (b) sin suministro (más simple); (c) estricto como Rome II.
5. **Asediar campamentos**: (a) **solo asaltar**; (b) asaltar o cercar (más trabajo).
6. **Movimiento libre**: (a) **libre en todo el mapa**; (b) libre pero que las calzadas cuesten mucho menos (ya es así); (c) libre solo en tu región.

## 10. Dictamen histórico: APTO CON NOTAS (todo de memoria; ninguna cita cotejada)
- **Histórico (M)**: el ejército romano **fortificaba un campamento cada noche** de marcha en terreno hostil: fosa,
  empalizada y trazado fijo (Polibio 6.27-34, descripción del campamento; también Livio). Tras Cannas, 216, los campamentos
  mayor y menor junto al Aufidus (Polibio 3.110-113, M). Pirro: ataque romano a su campamento junto a Beneventum, 275
  (Plutarco, *Pirro* 25, M). **Forrajeo y saqueo**: el ejército vivía del país; Aníbal devastó el campo itálico; Fabio
  Máximo, en 217, evitó la batalla y acosó los forrajeadores (Polibio 3.90-94, M; Livio 22). **Emboscada**: Trasimeno (Polibio 3.83-84, M).
- **Probable**: que un campamento aguantara asaltos mejor que un ejército en campo abierto; no se cita escena concreta.
- **Licencia de juego**: «montar el campamento» como **un medio turno** (en realidad, unas horas); el bono de +25 %; la
  comida de 1 turno; el saqueo como postura de mapa; velocidades por terreno; la rejilla de celdas; el radio de visión.
- **Pendiente**: fichas en `js/registro.js` con fuente antes de que algo salga en pantalla (agente con búsqueda).
