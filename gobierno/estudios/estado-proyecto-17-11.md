# Estado del proyecto · Consejo del 17/11/2026 (noche)

Pedido del usuario, literal: «Abre otra sesión que convoque al gobierno y haga un vídeo con Moncloa y explique el estado
actual del proyecto, qué queda para terminarlo, por qué no se hace ya cuando se puede terminar y por qué tarda tanto en
hacerse bien y diverge tanto».

Es un informe. No se ha tocado el juego. Presentación con capturas y guion:
https://claude.ai/artifact/UbBHfUxAR7GxQ4SpqjRw14 (el vídeo no se pudo hacer; ver el final).

## En cinco frases
1. La 1.0 está cerca: quedan **cuatro tareas** (ES1, GM36, V10a, V10b) y poner los jueces en verde; con lo que cuesta
   de verdad cada tarea, unos **5 M** y uno o dos días.
2. No se termina ya porque **la lista no está cerrada**: el mismo día que aprobaste la 1.0 de 12 tareas entraron 10
   más y salieron 2, y una de ellas (el soldado nuevo) no tiene final definido.
3. Tarda porque **cada tarea cuesta casi el doble de lo previsto** (hoy +79 %), sobre todo en esperas: los jueces
   tardan de 15 a 36 minutos por pasada y aquí se dibuja a un fotograma por segundo.
4. Diverge porque **el trabajo se va a maquetas y estudios que no llegan al juego**: hoy, unos 17 M en cinco maquetas,
   más del doble de lo que costaba toda la 1.0; y ahora mismo solo 2 de las 8 sesiones abiertas son de la 1.0.
5. Se arregla con cinco decisiones tuyas (abajo): sacar el soldado nuevo de la 1.0, parar lo que no es 1.0, nevera con
   candado, jueces primero y tope de gasto que corta.

## Lo medido (no supuesto)

| Qué | Cifra | De dónde sale |
|---|---|---|
| Carril V (la 1.0): líneas | 20: **13 hechas**, 1 a medias, 4 por hacer, 2 sacadas a «después» | `TABLERO.md`, Carril V |
| Plan de esta mañana | 12 tareas, 7,4 M | `estudios/CV1-converger.md` |
| De esas 12 | 8 hechas, 2 pendientes (V10a, V10b), 2 sacadas (MR3b, GM23) | tablero (GC6 a GC9 están en el carril GC) |
| Entraron hoy en la 1.0 | **10**: SN2, CN26, ES1, GM34, GM36, GM4b, GM44, GM43, GM43b, GM43c | tablero |
| Gastado hoy en tareas de la 1.0 | unos **25 M** (20 M en las cerradas con presupuesto de 10,5 M, más 4,9 M del soldado nuevo) | línea «Cuentas» de los partes del 17/11 |
| Todo el tablero | 229 hechas, 86 por hacer, 2 a medias, en 27 carriles | `TABLERO.md` |
| Partes del 11 al 17/11 | 205; 136 con presupuesto y gasto escritos | `gobierno/partes/` |
| Previsto y gastado en esos 136 | previsto 174 M, gastado **254 M (+46 %)** | suma de «Cuentas» |
| Tareas por encima de lo previsto | **93 de 136** (68 %); 67 con alerta de +25 % | ídem |
| Solo hoy, 17/11 | previsto 28,7 M, gastado 51,5 M (**+79 %**); 20 de 23 por encima | ídem |
| Sesiones abiertas ahora | **9** (7 trabajando, 2 esperando); 8 de AQVILA, y de esas **2 de la 1.0** (GM36 y JU1) | lista de sesiones, 21:10 UTC |
| Sesiones creadas | 63 hoy y 37 ayer (de las 100 últimas; alguna es del otro proyecto) | lista de sesiones |
| Subidas a la rama del juego | 162 hoy, 32 ayer | `git log` |
| Apuntes en «Decisiones del usuario» | 81 hoy, 76 ayer; propuestas numeradas hasta P167 | `BITACORA.md` |
| Jueces | 35 de 37; en rojo «Construir aquí» y la guerra que se atasca al dar una orden | bitácora, 20:22 y 21:00 UTC |

Avisos sobre las cifras: las sumas de gasto salen de leer con un programa la línea «Cuentas» de cada parte; 69 partes
no la traen completa, así que el total real es mayor. No he vuelto a pasar los jueces (tardan 20 minutos y los lleva
JU1): el estado es el que consta en la bitácora. La fluidez en un móvil real sigue sin medirse en cifras.

## El Consejo, ministerio a ministerio
Sin agentes: cada dictamen sale de los archivos de su ministerio, para no gastar.

- **Plan socialista (obras)**: la 1.0 tiene hechos los menús romanos, el Senado, reclutar desde el cuartel, la batalla
  que empieza de lejos, el movimiento vivo, cerrar el ejército y la partida corta. Faltan Escaramuzas (ES1), la primera
  fila que lucha (GM36, en marcha), el equilibrio con el bot (V10a) y tu prueba en el móvil (V10b).
- **Hacienda (ahorro)**: de 23 tareas con cuentas hoy, 20 pasaron el presupuesto. Las causas se repiten en los partes:
  esperar a los jueces, capturas repetidas (siete rondas en SN2), el director construyendo él solo y releer la rama.
  La única por debajo fue CN26 (0,15 M de 0,4 M): encargo pequeño, cerrado y en un solo archivo.
- **Justicia (jueces)**: llevan todo el día en NO APTO, 35 de 37. JU1 dice que los dos rojos son del juez (aquí se
  dibuja a un fotograma por segundo y se le acaba el tiempo), no del juego; lo está comprobando con la pasada completa.
  Mientras, se ha subido con 35 de 37, contra la regla de «solo con APTO».
- **Arte**: el soldado nuevo (GM44) lleva dos maquetas y 4,9 M; de cerca gana, en línea de 640 pasa del tope de
  triángulos, y tú aún no lo has dado por bueno («muñecos de hojalata»). No tiene una meta que se pueda medir.
- **Historia**: sin atasco. Lo nuevo de época (imágenes de museo, más tropas, más pueblos) ya está en la nevera.
- **Exteriores (radar)**: en pausa hasta la 1.0, como manda el plan. Pero hay abierto un concurso de arte (GM43d) y un
  plan de Roma en 3D (P167), que el plan prohibía hasta la 1.0.
- **Cuadro de mando**: enseña 315 capturas y 54 informes. Falta lo que pediste: que enseñe solo «n de la 1.0».

## 1. Qué queda para terminar la 1.0 y cuánto cuesta

| Tarea | Qué es | Previsto | Realista (×1,8) |
|---|---|---|---|
| JU1 | Jueces en verde (en marcha) | — | — |
| GM36 | Primera fila que lucha y caídos (en marcha) | 1,0 M | 1,8 M |
| ES1 | Escaramuzas: batallas sueltas desde el menú | 0,8 M | 1,4 M |
| V10a | Equilibrio con el bot, campaña larga y corta | 0,5 M | 0,9 M |
| V10b | Tu prueba en el móvil, arreglos y publicar | 0,5 M | 0,9 M |
| **Total** | cuatro sesiones | 2,8 M | **unos 5 M** |

Aparte queda **GM44, el soldado nuevo**. Si entra en la 1.0, hay que rehacer el detalle, aligerarlo para 640 hombres,
darle todos los movimientos y llevarlo al juego para todas las tropas: el estudio GM4b lo cifró entre 3 y 8 M, y a ese
tipo de tarea le ha pasado siempre lo mismo (tres vueltas de corrección). Con él, la 1.0 son de 8 a 13 M y no tiene
fecha. Sin él, la 1.0 sale con los soldados de hoy, que funcionan, y el nuevo llega en la 1.1.

## 2. Por qué no se termina ya, si se puede
1. **La lista no está cerrada.** El plan decía «nada nuevo entra salvo sacando otra». En el mismo día entraron 10 y
   salieron 2. Varias con tu orden directa («sin sacar otra»), y nadie del gobierno te dijo que eso alejaba el final.
2. **Las dos últimas tareas piden que todo lo demás pare.** El equilibrio (V10a) solo vale con el juego quieto: si
   mientras tanto cambian la batalla o el mapa, hay que repetirlo. Y V10b eres tú con el móvil.
3. **Los jueces están en rojo.** Sin jueces en verde no se puede decir «terminado» ni subir a la versión pública.
4. **El soldado nuevo no tiene final.** «Que parezca de PS4» no se puede comprobar con una prueba; depende de que
   te guste, y aún no te gusta.
5. **Las manos están en otra parte.** De 8 sesiones de AQVILA abiertas, 2 son de la 1.0. Las otras: un plan de Roma
   3D, una maqueta de gobierno y ciudad, un concurso de arte del testudo, el mapa, el vigía y este informe.

## 3. Por qué tarda tanto en salir bien y por qué diverge
1. **Entra más de lo que sale.** 81 apuntes tuyos hoy y 76 ayer; las propuestas van por la P167. Cada estudio o
   concurso deja de 4 a 8 tareas nuevas. Esta mañana había 104 abiertas; el plan cerró esa puerta y por la tarde se
   volvió a abrir.
2. **Cada tarea cuesta casi el doble.** +46 % de media en la semana y +79 % hoy. Ejemplos de hoy: GM5 1,2 → 2,7 M;
   I8b 0,4 → 1,5 M; MR2a 0,7 → 1,8 M. Los presupuestos se escriben como si no hubiera esperas, y las hay siempre.
3. **Se trabaja a ciegas y despacio.** Aquí no hay tarjeta gráfica: el juego se dibuja a un fotograma por segundo. Los
   jueces rápidos tardan 17 minutos y los completos de 30 a 36. Cada comprobación es media hora, y hacen falta varias.
4. **Las sesiones en paralelo se pisan.** 162 subidas hoy a una sola rama. Los partes lo repiten: «fallos ajenos» en los
   jueces, «esperar a C8», «la copia local no tenía relación con la remota» (MR2b y MR2c perdieron ahí medio
   presupuesto). Con los jueces en rojo, nadie sabe si el fallo es suyo.
5. **Las maquetas no llegan al juego.** Hoy: testudo a pie (tres versiones; 5,6 M en las dos que traen cuentas), soldado nuevo (4,9 M) y gobierno
   por turnos (6,9 M). Unos 17 M en cosas que te gustan pero que no están en lo que juegas. Y el menú principal, que sí
   tenía maqueta aprobada, salió de la 1.0.
6. **«Bien» no está definido antes de empezar.** «Como Rome II», «de PS4», «como si fuera de verdad» son metas que solo
   se comprueban cuando lo ves, y entonces llegan las vueltas. Cuando la meta fue concreta (CN26: «reclutar desde la
   ficha del cuartel»), salió a la primera y por debajo del presupuesto.

Dicho claro: la mitad de la culpa es del gobierno, que acepta todo, abre sesión para todo y calcula corto. La otra
mitad es que cada idea buena que tienes mientras pruebas se convierte al momento en trabajo, en vez de esperar su turno.

## Cinco medidas, y lo que tendrías que decidir
1. **Cerrar la lista de verdad.** La 1.0 es: jueces en verde, GM36, ES1, V10a y V10b. El soldado nuevo pasa a la 1.1.
   *Decides*: ¿el soldado nuevo fuera de la 1.0? (A) sí · (B) no, la 1.0 espera por él.
2. **Parar lo que no es 1.0.** Cerrar hoy el plan de Roma 3D (P167), la maqueta EV8, el concurso del testudo (GM43d) y
   la cadena del mapa al acabar C10. Lo hecho se guarda. *Decides*: ¿paramos esas cuatro? (A) sí · (B) dime cuáles no.
3. **Nevera con candado.** Hasta publicar, lo que pidas se apunta en una línea y no abre sesión, estudio ni maqueta.
   La única vía de entrada es «cambio esta por aquella». *Decides*: ¿aceptas que te contestemos «apuntado, después de
   la 1.0»? (A) sí · (B) no.
4. **Jueces primero y de uno en uno.** Nada se sube hasta que JU1 los deje en verde; después, una prueba rápida de menos
   de 5 minutos y una sola sesión subiendo cada vez. *Decides*: ¿aceptas unas horas sin subidas? (A) sí · (B) no.
5. **Presupuesto real y tope que corta.** Los presupuestos se multiplican por 1,8, que es lo medido. Al llegar al
   +25 % la sesión para y entrega lo que tenga; hoy solo avisa y sigue. *Decides*: (A) tope que corta · (B) como hoy.

Con las cinco en (A): cuatro sesiones, unos 5 M, y la 1.0 publicada en cuanto hagas tu prueba de media hora en el móvil.

## El vídeo
No se pudo hacer. La fábrica de Moncloa (`fiebres-neutropenias`, skill `moncloa`) se descargó bien y se leyó entera,
pero su instalador (`autonomo/consejo/video/instalar.sh`: voces Piper de España y el «oído») fue **denegado dos veces
por el control de permisos de esta sesión**. Sin voces no hay vídeo de Moncloa: su regla es «nunca un vídeo mudo».
En su lugar va la presentación, con capturas reales, gráficos y el guion ya escrito (251 palabras, unos dos minutos) para grabarlo
tal cual. Para tener el vídeo: una sesión que tenga permiso para ejecutar ese instalador, o lanzarlo desde el
proyecto `fiebres-neutropenias`, donde ya está permitido.
