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
- P1 Presupuesto de arte hasta medir en un móvil real: 35 MB de descarga, 4.500 triángulos por soldado y 12.000 por
  edificio. Hoy el juego usa 30,4 MB, 4.150 y 10.740. Está puesto como provisional en `gobierno/arte.json`.

## Encargo de la próxima sesión
El usuario marcó «Hacer la siguiente» en 12 tareas del cuadro (11/11/2026). Es su cola de prioridad; el resto del
tablero espera. Las marcó de corrido, sin orden entre ellas. Orden propuesto por Claude (el usuario puede cambiarlo):
1. **F1** propuesta de diseño de los modos de juego (condiciona B y F).
2. **D1** medir en su móvil real · 3. **E3** presupuesto por escena · 4. **D2** niveles de detalle.
5. **B6** costes y tiempos · 6. **B8** herrería · 7. **B3** felicidad e impuestos · 8. **B4** más edificios ·
9. **B9** ciudad fiel a cada lugar · 10. **F3** aldeanos · 11. **E1** guía de arte · 12. **D3** motor nativo (Godot).
Una sesión, una tarea: se empieza por la primera con la skill `plan-equipos`.

## Notas para quien continúe
- El arte pesa ~31 MB y cada soldado tiene 2.000–4.000 triángulos: el rendimiento en móvil real no está medido.
- Las batallas igualadas se deciden de forma brusca y el bot de pruebas no llega a tomar Cartago: falta equilibrar.
- Para regenerar el arte hace falta un clon parcial de `0ad/0ad` y los cargadores de ejemplo de three.js (README).
