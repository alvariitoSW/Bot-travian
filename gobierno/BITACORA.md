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
1. **Publicar lo nuevo**: ¿paso todo a la rama que publica el juego (`claude/roman-strategy-mobile-game-bx9oq2`) para que lo veas en tu móvil? Hasta entonces el enlace enseña la versión anterior.
2. **Medir fluidez** (cuando esté publicado): menú → «Medir fluidez»; dime la cifra en el mapa, en la ciudad y en una batalla grande.
3. **Batalla** (D2): ¿te vale el fondo con figuras sencillas que no mueven las piernas, o prefieres menos soldados pero todos reales?
4. **Roma** (B9): ¿te vale con el Tíber y una colina, o quieres colinas dentro de la muralla y lo mismo en otras ciudades?

## Propuestas por aprobar
Salen de la auditoría histórica (`gobierno/historia/H1-resumen.md`), que es **provisional**: sus citas aún no se han cotejado con los textos antiguos.
- P17 **Cotejar la auditoría y las fichas de batalla con los textos antiguos** (H1b y H2b) · 0,1 M Fable + 0,8 M Sonnet · 20 min. Ya se pueden abrir Perseus, LacusCurtius y Livius.org. Sin esto nada de Historia pasa al juego.
- P18 **Corregir los textos de los hechos** · 0,15 M. Pirro marcha sobre Roma en 280 (no 277); Cannas «según Polibio / según Livio»; el corvus sin atribuir a Duilio; las frases de Arquímedes y Catón, como tradición tardía.
- P19 **Renombrar dos tropas fuera de época** · 0,1 M. «Vigiles» (son de Augusto) pasa a «Guardia urbana»; «Batallón Sagrado» (desaparece tras 310) pasa a «Ciudadanos de Cartago». No cambia reglas.
- P20 **Cambiar el general de Cartago en 280** · 0,05 M. Hoy es Asdrúbal el Beotarca, que es de 149-146.
- P21 **Mapa de 280 con sus dueños reales** · 0,5 M. Agrigento griega, Corinto macedonia, Capua aliada de Roma y «Mamertinos» en Messana. Cambia el equilibrio y las partidas guardadas. La alternativa barata es dejarlo y marcarlo «licencia de juego».
- P22 **Carthago Nova** (se fundó hacia 228, no existía en 280) · 0,05 M si se deja y se marca «licencia de juego»; 0,6 M si empieza como poblado íbero y pasa a Cartago en 228.
- P23 **Añadir hechos que faltan** · 0,3 M. Benevento 275, Trasimeno 217, Metauro 207, Ilipa 206, Magnesia 190, Corinto y Cartago 146.
- P24 **Etiqueta visible «licencia de juego»** en lo inventado para poder jugar · 0,2 M.

## Encargo en curso (11/11/2026)
- Las doce tareas del plan están unidas en `ccr-07cfa4be-35ag3l` con los jueces en APTO 12/12. Parte: `gobierno/partes/2026-11-11-union.md`.
- **Historia**: H1 y H2 escritas y unidas (`gobierno/historia/`), pero provisionales: falta cotejar las citas (P17). H3 (Códice) espera a ese cotejo.
- Siguiente recomendada: **F1b**, partir y empezar la partida corta. Antes, que el usuario lo vea en su móvil.

## Notas para quien continúe
- El arte pesa ~31 MB y cada soldado tiene 2.000–4.000 triángulos: el rendimiento en móvil real no está medido.
- Las batallas igualadas se deciden de forma brusca y el bot de pruebas no llega a tomar Cartago: falta equilibrar.
- Para regenerar el arte hace falta un clon parcial de `0ad/0ad` y los cargadores de ejemplo de three.js (README).
