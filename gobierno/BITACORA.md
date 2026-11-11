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
2. **Turnos y tiempo real** (a): ¿mapa por estaciones, y ciudad y batalla en tiempo real? Recomiendo B. Informe «G3 · Gran diseño».

## Propuestas por aprobar
Batallas (informe «G3 · Batallas estratégicas»; coste a ojo, Fable + Sonnet):
- P40 **Ritmo y moral**: batallas de 8 a 12 minutos, moral que baja poco a poco, cansancio. 0,15 + 0,4 M · 12 min.
- P41 **Despliegue antes de la batalla**: colocas tus regimientos (tres plantillas de un toque) y pulsas «Empezar batalla». 0,2 + 0,7 M · 20 min.
- P42 **Terreno con efecto: colina y bosque**, un campo tipo por ciudad. 0,25 + 0,9 M · 25 min. Mejor después de P41.

Gran diseño, fase 1 (informe «G3 · Gran diseño»; ya decididos economía, investigación, tipos de ciudad, mar y cableado; falta «Turnos», de la que depende P44):
- P43 **Registro de piezas**: fichas con números, arte y fuente histórica, y un juez que las comprueba. 0,2 + 0,6 M · 20 min. Va sola y la primera.
- P44 **Reloj por estaciones**: «consejo de estación» y botón «Pasar estación». 0,2 + 0,6 M · 20 min.
- P45 **Mano de obra y mantenimiento**: reclutar vacía los campos; edificios y tropas cuestan. 0,15 + 0,5 M · 15 min.
- P46 **Tipos de ciudad con solares limitados** (ampliada con lo que pidió el 11/11): cada ciudad tiene un número fijo de solares y se dedica a recursos, tropas, comercio, mar, investigación o una mezcla; caben templos y edificios de ocio. 0,2 + 0,7 M · 20 min.
- P50 **Regiones**: cada región tiene una ciudad principal y zonas de industria a su alrededor. 0,2 + 0,7 M · 20 min, a ojo. Después de P46 y P48.
- P47 **Investigación y edades**: árbol corto; la herrería pasa a ser su rama de guerra (absorbe F4). 0,2 + 0,7 M · 20 min.
- P48 **Región de Italia** montada solo con fichas (prueba del cableado). 0,2 + 0,6 M · 20 min. Después de P43.
- P49 **Partida corta**: fundas de cero, un rival, un final (es F1b). 0,25 + 0,8 M · 25 min. Después de P44 a P48.

## Encargo en curso (11/11/2026)
Rama única desde ahora: `claude/roman-strategy-mobile-game-bx9oq2` (la que publica el juego). Sesiones, que no se pisan (Diseño ya cerró: informes G3):
- **Historia 2**: coteja las fuentes (H1b, H2b), aplica H4 a H10 y hace el Códice (H3). Toca `gobierno/historia/`, `js/data.js`, `js/game.js` y `js/ui.js`.
Cada una, al cerrar: tablero y bitácora al día, capturas e informes en el cuadro, cuadro publicado, aviso a la sesión madre y se archiva sola.

## Notas para quien continúe
- El arte pesa ~31 MB y cada soldado tiene 2.000–4.000 triángulos: el rendimiento en móvil real no está medido.
- Las batallas igualadas se deciden de forma brusca y el bot de pruebas no llega a tomar Cartago: falta equilibrar.
- Para regenerar el arte hace falta un clon parcial de `0ad/0ad` y los cargadores de ejemplo de three.js (README).
