# Bitácora de AQVILA

Lo que el usuario ha pedido y decidido, y lo que espera algo suyo. Las tareas ya definidas están en `TABLERO.md`.
Regla: lo nuevo se apunta aquí; cuando el usuario lo aprueba, pasa al tablero. Cómo se lleva: skill `bitacora`.

## Decisiones del usuario (literal o casi)
- 11/11/2026 — Dos sistemas separados: ciudad/economía propia (recursos, mercado, mar) y guerra tipo Rome 2 Total War.
- 11/11/2026 — Arte real conseguido por Claude (se eligió 0 A.D., CC BY-SA 3.0) y, además, motor nativo (opción 3).
- 11/11/2026 — Vistas a varias escalas: mapa grande, ciudad, calles con ciudadanos, ejército con su tamaño.
- 11/11/2026 — Edificios de materiales junto a su recurso natural; ciudad amurallada históricamente fiel.
- 11/11/2026 — Mezcla: Travian/Ikariam (recursos, mejorar materiales, muchas tropas, saquear a otros para ganar
  materiales) con toques de Age of Empires / Age of Mythology. Sistema de arte acorde a la época.
- 11/11/2026 — **Cerrar la sesión larga** y trabajar por sesiones cortas con un gobierno reducido, adaptado de
  `fiebres-neutropenias` (se puede ampliar o mejorar), más un cuadro de mando sencillo en un Artifact.

- 11/11/2026 — **Gobierno montado** (G1): equipos, jueces, bitácora, ahorro, exteriores, arte y cuadro de mando. Ver `gobierno/LEEME.md`.
- 11/11/2026 — **Publicar**: «¡Sí, claro!». Todo pasa a la rama que publica el juego.
- 11/11/2026 — **Historia**: aprobadas P17 a P24 (cotejo, textos, tropas, general, mapa de 280, Carthago Nova, hechos que faltan, etiqueta de licencia). En Carthago Nova no eligió versión; Claude toma la fiel (poblado íbero hasta 228), por coherencia con el mapa real.
- 11/11/2026 — **Batallas**, tras pasarse la campaña: «Es aún muy sencillo. Hay que hacer más cambios aparte del visual, pero las batallas deben ser más estratégicas, hasta más pausadas, que el terreno pueda jugar a tu favor o en contra, que puedas desplegar en diferentes formaciones a tus tropas, que las batallas duren más y sean más realistas. En fin, aún queda. Muchas mejoras sobre esto».
- 11/11/2026 — **Gran diseño**: «Habría que mejorar el arte y juntarlo con la historia pero usando un cableado europeo en cuanto a cableado/código para que con cosas sencillas se pueda montar un mapa realista y que haya batallas de mar y de tierra. Que aparte veas tu ciudad crecer y los recursos recolectar y que tenga una lógica, crear el apartado de investigación y que cada cosa te permita llevar a mejoras. Hacer diferentes tipos de ciudades, unas más militares, otras de comercio, otras civiles, montar una economía más real y ampliar la que hay ahora, no en tanto a más recursos sino a que funcione como una economía real. Se podría hacer un juego casi por turnos en algunas cosas y otras en tiempo real, habría que darle una vuelta». (Lectura de Claude: pide pensarlo antes de construir; va a la sesión Diseño.)
- 11/11/2026 — **Gran diseño, respuestas desde el cuadro**. Dijo «Ok» a cuatro preguntas; Claude lo lee como «vale lo recomendado» (confirmar si no):
  - **Economía real** (b): mano de obra y mantenimiento primero; después precios por ciudad y rutas.
  - **Investigación** (c): árbol corto de unas 16 mejoras ligado a edificios y edades.
  - **Mar** (e): transporte y bloqueo primero; la batalla naval jugable, al final.
  - **Cableado** (f): registro único de piezas, poco a poco, sin rehacer el juego. Añadió: «ayúdate de todas las skills y ministerios del repositorio fiebres-neutropenias si lo necesitas».
- 11/11/2026 — **Tipos de ciudad** (d): «Ok, y así tener diferentes tipos de ciudades, rollo una ciudad principal dentro de una región que pueda construir un número determinado de edificios y así cada ciudad tenga para recursos o para tropas o para comercio o para naval, o para investigar o hacer mezclas, y tener regiones para la industria y en cada ciudad poder tener como edificios religiosos, de ocio y demás cosas para dar más jugabilidad y que cada ciudad esté limitada para no poder tener infinitos edificios, etc.». (Lectura de Claude: acepta elegir el tipo y pide más: solares limitados, regiones con capital y edificios religiosos y de ocio. Amplía P46 y abre P50.)
- 11/11/2026 — **Aprobadas P40 a P50** desde el cuadro: batallas (ritmo y moral, despliegue, terreno) y toda la fase 1 del gran diseño. Al tablero como A8, A5a, A5b e I1 a I8.
- 11/11/2026 — **Turnos y tiempo real**: no contestó la pregunta, pero aprobó el «Reloj por estaciones» (P44). Lectura de Claude: vale lo recomendado, mapa por estaciones y ciudad y batalla en tiempo real (confirmar si no).
- 11/11/2026 — **Unir I1 y seguir**: «Sí, únela ya, y para lo siguiente que dices abre una nueva sesión si es necesario». I1 unida a la rama que publica; A8 va en sesión nueva.
- 11/11/2026 — **Cómo trabajar**: «Aplica el cuadro en las sesiones necesarias pero que no se pisen entre ellas y que cuando terminen se cierren por su cuenta y lo que me tengan que enseñar que aparezca en el cuadro de mando».
- 11/11/2026 — **Red**: aprobó añadir al entorno penelope.uchicago.edu, www.perseus.tufts.edu y www.livius.org para cotejar las fuentes.
- 11/11/2026 — **Historia aprobada**: H1, H2 y H3 (P14 a P16), «pueden abrirse en otros carriles». H1 y H2 en una sesión (`gob/historia`); H3 después, porque depende de H1 y toca el juego.
- 11/11/2026 — **Repositorio modelo**: dio acceso («sí le doy acceso para comparar y traer lo que falte»). Ya se leyó y de ahí salió el plan socialista de AQVILA.
- 11/11/2026 — **Ministerio de Adecuación Histórica**: «Lo ideal es montar el ministerio de adecuación histórica y que busque toda la información para las batallas, el lore, la vestimenta, etc., y que el juego sea también para aprender historia». Montado: skill `historia`.
- 11/11/2026 — **Respuestas al carril Reglas**: (1) suavizar a Aníbal: sí. (2) herrería +5 % por nivel, máx. +25 %, y se conserva al perder la ciudad: escribió «pl»; Claude lo lee como «ok» (confirmar si no). (3) impuestos: ok. (4) aldeanos solo en la vista de lista: ok. (5) termas y anfiteatro: «mejor sería tener arte propio».
- 11/11/2026 — **Respuestas al carril Pensar** (dadas en esa sesión, «por el momento, acepto todo»): F1 campaña histórica como base del modo largo, empezar por la partida corta, tres dioses (Marte, Ceres, Neptuno); E1 le gusta la guía de arte; D3 no pasar a Godot ahora; E3 topes provisionales hasta D1.
- 11/11/2026 — **Aprobado todo**: presupuesto de arte (P1) y las doce versiones simples (P2 a P13), con plan socialista. «Que empiece todo en otra nueva sesión o en varias que no se pisen».
- 11/11/2026 — **Prioridad** (desde el cuadro): B3, B4, B6, B8, B9, D1, D2, D3, E1, E3, F1 y F3 antes que el resto.
- 11/11/2026 — **GitHub Pages activado** por el usuario (rama de trabajo, raíz): https://alvariitosw.github.io/Bot-travian/
- 11/11/2026 — **Permiso para instalar Godot**, dado por el usuario en el chat. (Si el sistema de permisos vuelve a
  bloquear la descarga, hace falta además una regla de permiso para Bash en la configuración.)
- 11/11/2026 — **La mezcla que quiere**, con sus palabras resumidas:
  - De Age of Empires / Age of Mythology: empezar **de cero** fundando una ciudad en una partida; **aldeanos** que
    recolectan y trabajan; hacer soldados; atacar otras ciudades; **edades** que desbloquean cosas; **algún dios con
    poderes**.
  - De Travian / Ikariam: la **continuidad** y la economía de recursos.
  - De Rome 2 Total War: llevar ciudades y tropas, crearlas, mejorarlas, y las batallas.
  - **Duración a elegir**: partida corta de unas horas, o larga de semanas o meses, siempre **con un final**.

## Esperando algo del usuario
1. **Medir fluidez**: menú → «Medir fluidez»; dime la cifra en el mapa, en la ciudad y en una batalla grande. (Dijo «ok» el 11/11; faltan las cifras.)

## Propuestas por aprobar
De Historia 2 (numeradas desde P51 porque P25 a P50 ya están usadas):
- P51 **Segunda pasada de cotejo**: los 60 datos «sin comprobar» (Justino, Valerio Máximo, Eutropio, Orosio; hace falta abrir attalus.org o similar) y los pasajes dudosos en latín y griego. ≈1,5 M Sonnet (el primer cotejo costó 5,4 M; esta vez bajando los pasajes a archivo).
- P52 **Capua se rebela en 216**: tras Cannas, Capua se pasa a Aníbal si no la defiendes bien (Livio 23.2-7). Cambia reglas: le quita una ciudad al jugador. ≈0,3 M.
- P53 **Pirro ataca en 280, no en 277**: hoy el texto dice la verdad pero el ataque llega en 277 para dar tiempo. Adelantarlo obliga a reequilibrar el arranque. ≈0,3 M.
- P54 **«Poblado íbero» en el mapa**: que Carthago Nova se llame así hasta 228. ≈0,15 M.
- P55 **Códice y registro, una sola fuente**: el Códice (H3) y el registro de piezas (I1) guardan las fuentes por duplicado; unirlos y marcar «histórico» lo ya cotejado. ≈0,3 M.

## Encargo en curso (11/11/2026)
Rama única desde ahora: `claude/roman-strategy-mobile-game-bx9oq2` (la que publica el juego). Sesiones, que no se pisan (Diseño ya cerró: informes G3):
- Ninguna abierta. **Historia 2** cerró el 11/11/2026: cotejo, H4 a H10 y Códice hechos (partes `2026-11-11-H1b`, `-H4-H10`, `-H3`).
Cada una, al cerrar: tablero y bitácora al día, capturas e informes en el cuadro, cuadro publicado, aviso a la sesión madre y se archiva sola.

## Encargo de la próxima sesión
Una tarea por sesión, en este orden (propuesto por Claude: primero lo que desbloquea a lo demás):
1. ✅ I1 Registro de piezas, hecha. Queda I1b al unir con Historia 2.
2. **A8 Ritmo y moral** (lo que más se nota al jugar; no depende de nada).
3. A5a Despliegue → A5b Terreno.
4. I3 Mano de obra → I4 Tipos de ciudad → I5 Investigación → I2 Reloj por estaciones.
5. I6 Región de Italia → I7 Regiones → I8 Partida corta.
Siguiente: **A8 Ritmo y moral** (toca `js/battle.js`; no pisa a Historia 2).

## Notas para quien continúe
- I1 e Historia 2 ya están unidas en la rama que publica (11/11/2026). El jugador empieza ahora con dos ciudades (Roma y Capua): tenerlo en cuenta al equilibrar. Queda I1b (ver tablero).
- El arte pesa ~31 MB y cada soldado tiene 2.000–4.000 triángulos: el rendimiento en móvil real no está medido.
- Las batallas igualadas se deciden de forma brusca y el bot de pruebas no llega a tomar Cartago: falta equilibrar.
- Para regenerar el arte hace falta un clon parcial de `0ad/0ad` y los cargadores de ejemplo de three.js (README).
