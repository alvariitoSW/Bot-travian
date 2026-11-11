# Bitácora de AQVILA

Lo que el usuario ha pedido y decidido, y lo que espera algo suyo. Las tareas ya definidas están en `TABLERO.md`.
Regla: lo nuevo se apunta aquí; cuando el usuario lo aprueba, pasa al tablero.

## Decisiones del usuario (literal o casi)
- 11/11/2026 — Dos sistemas separados: ciudad/economía propia (recursos, mercado, mar) y guerra tipo Rome 2 Total War.
- 11/11/2026 — Arte real conseguido por Claude (se eligió 0 A.D., CC BY-SA 3.0) y, además, motor nativo (opción 3).
- 11/11/2026 — Vistas a varias escalas: mapa grande, ciudad, calles con ciudadanos, ejército con su tamaño.
- 11/11/2026 — Edificios de materiales junto a su recurso natural; ciudad amurallada históricamente fiel.
- 11/11/2026 — Mezcla: Travian/Ikariam (recursos, mejorar materiales, muchas tropas, saquear a otros para ganar
  materiales) con toques de Age of Empires / Age of Mythology. Sistema de arte acorde a la época.
- 11/11/2026 — **Cerrar la sesión larga** y trabajar por sesiones cortas con un gobierno reducido, adaptado de
  `fiebres-neutropenias` (se puede ampliar o mejorar), más un cuadro de mando sencillo en un Artifact.

## Esperando algo del usuario
1. **Activar GitHub Pages** (Settings → Pages → Deploy from a branch → rama de trabajo, carpeta raíz) para tener el
   enlace https://alvariitosw.github.io/Bot-travian/ y decir si carga y cómo va de fluido en su móvil.
2. **Qué quiere exactamente de Age of Empires / Age of Mythology** (¿edades?, ¿dioses con poderes?, ¿aldeanos?).
3. **Permiso para instalar Godot** en la sesión (regla de permiso para Bash), si sigue queriendo el motor nativo.
4. Lo que vaya viendo al probar el juego: se apunta aquí.

## Encargo de la próxima sesión (G1): montar el gobierno
Única tarea. No tocar el juego. Leer `CLAUDE.md`, este archivo y `TABLERO.md`; como modelo, el repositorio
`alvariitoSW/fiebres-neutropenias` (`.claude/skills/`, `.claude/agents/`, `autonomo/REGLAS.md`, `autonomo/LEEME.md`).
Traer **adaptado y reducido**, no copiado:
- **Plan por equipos** (skill tipo `plan-socialista`): el director reparte una tarea del tablero a constructor,
  verificador (capturas a 390 px) y revisor de código; rama y parte de sesión.
- **Jueces**: un solo comando (`node gobierno/jueces.mjs`) que pase `test/sim.test.js`, el recorrido en navegador
  (nueva partida, construir, reclutar, atacar, batalla, recarga sin red) y deje las capturas.
- **Bitácora** (skill): apuntar lo que pide el usuario, aprobar al tablero, informe «¿a dónde vamos?».
- **Ahorro**: revisar el gasto de cada tanda y proponer recortes.
- **Exteriores**: `ingenieria-reversa` y `radar`, adaptadas a juegos (ideas sí, código y arte no).
- **Arte** (ministerio nuevo): dueño de `tools/`, las licencias y el presupuesto de peso y triángulos.
- **Cuadro de mando**: un Artifact sencillo para el móvil con el estado del juego (carriles y tareas del tablero, lo
  que espera al usuario, últimas capturas, enlace al juego) y botones para aprobar, priorizar o pedir cambios; lo que
  el usuario pulse se guarda y una sesión lo aplica al tablero y a la bitácora.
Al terminar: reglas en `CLAUDE.md`, un parte breve, commit y push. Lo que el usuario deba decidir, a esta bitácora.

## Notas para quien continúe
- El arte pesa ~31 MB y cada soldado tiene 2.000–4.000 triángulos: el rendimiento en móvil real no está medido.
- Las batallas igualadas se deciden de forma brusca y el bot de pruebas no llega a tomar Cartago: falta equilibrar.
- Para regenerar el arte hace falta un clon parcial de `0ad/0ad` y los cargadores de ejemplo de three.js (README).
