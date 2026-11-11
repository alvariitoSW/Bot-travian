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
1. Que diga si el enlace del juego carga y cómo va de fluido en su móvil, y lo que quiera cambiar al probarlo.
2. **Rama**: el gobierno (G1) se guardó en la rama `ccr-07cfa4be-35ag3l`, la que asignó la sesión. La página del juego
   se publica desde `claude/roman-strategy-mobile-game-bx9oq2`. ¿Se unen las dos, o se cambia la rama de trabajo?
3. **Repositorio modelo**: la sesión G1 no tuvo permiso para leer `alvariitoSW/fiebres-neutropenias`. El gobierno se
   montó solo con el encargo escrito. ¿Quiere dar acceso para compararlo y traer lo que falte?

## Propuestas por aprobar
- P14 **H1 Auditoría histórica de lo que ya hay** · 0,15 M Fable + 0,9 M Sonnet · 20 min. Repasar con fuentes las tropas (armas y vestimenta), las 18 ciudades y los hechos de la campaña. Sale una lista de aciertos, anacronismos y licencias de juego, con los cambios propuestos. No cambia el juego.
- P15 **H2 Fichas de las grandes batallas** · 0,15 M Fable + 1,0 M Sonnet · 25 min. Una ficha con fuentes para Heraclea, Ásculo, Trebia, Trasimeno, Cannas, Zama y Pidna: tropas, despliegue, terreno, qué pasó y qué se discute. Base para batallas históricas jugables más adelante.
- P16 **H3 Códice dentro del juego, simple** · 0,2 M Fable + 0,8 M Sonnet · 20 min. Una pestaña para leer, con las fichas de tropas, ciudades y hechos ya comprobadas. Va después de H1.

## Encargo en curso (11/11/2026)
El usuario aprobó todo (P1 a P13) y pidió hacerlo ya, en varias sesiones que no se pisen. Plan: `gobierno/plan-12.md`.
Tres sesiones, cada una en su rama, salidas de `ccr-07cfa4be-35ag3l`:
- **Pensar** (`gob/pensar`): F1, E1, D3, E3. Solo documentos y `gobierno/arte.mjs`.
- **Reglas** (`gob/reglas`): B6, B8, B3, F3, B4. `js/data.js`, `js/game.js`, paneles de `js/ui.js`, pruebas.
- **Visual** (`gob/visual`): D1, D2, B9. `js/gfx/` y lo mínimo de `js/ui.js`.
Ninguna toca tablero, bitácora ni cuadro: dejan un parte por tarea en `gobierno/partes/`. Al acabar, la sesión
madre une las tres ramas, pasa los jueces, pone al día tablero y cuadro y lo cuenta al usuario.
Después: unir con la rama que publica el juego (espera 2) para que el usuario lo vea en su móvil.

## Notas para quien continúe
- El arte pesa ~31 MB y cada soldado tiene 2.000–4.000 triángulos: el rendimiento en móvil real no está medido.
- Las batallas igualadas se deciden de forma brusca y el bot de pruebas no llega a tomar Cartago: falta equilibrar.
- Para regenerar el arte hace falta un clon parcial de `0ad/0ad` y los cargadores de ejemplo de three.js (README).
