# Gobierno de AQVILA

Cómo se organiza el trabajo. Reducido a propósito: siete oficios, tres comandos y un cuadro para el usuario.

## Los oficios
| Oficio | Qué hace | Dónde está |
|---|---|---|
| **Plan por equipos** | El director reparte UNA tarea del tablero entre constructor, verificador y revisor; rama y parte | skill `plan-equipos`, agentes en `.claude/agents/` |
| **Jueces** | Dicen si el juego funciona: lógica, recorrido en navegador y capturas | `node gobierno/jueces.mjs` |
| **Bitácora** | Apunta lo que pide el usuario, lo pasa al tablero cuando lo aprueba, informe «¿a dónde vamos?» | skill `bitacora`, `BITACORA.md`, `TABLERO.md` |
| **Ahorro** | Revisa el gasto de cada tanda y propone recortes | skill `ahorro`, línea «Gasto» de los partes |
| **Exteriores** | Estudia mecánicas de otros juegos y rastrea arte libre, técnica e historia. Ideas sí; código y arte, no | skills `ingenieria-reversa` y `radar` |
| **Arte** | Dueño de `tools/`, las licencias y el presupuesto de peso y triángulos | skill `arte`, `node gobierno/arte.mjs`, `arte.json` |
| **Cuadro de mando** | Página para el móvil del usuario con el estado y botones para decidir | skill `cuadro-de-mando`, `cuadro.mjs`, `cuadro.json` |

## Los comandos
```bash
node gobierno/jueces.mjs            # todo: ~3 min, deja capturas e informe en gobierno/capturas/
node gobierno/jueces.mjs --rapido   # solo la lógica: segundos
node gobierno/arte.mjs              # peso, triángulos y licencias del arte
node gobierno/cuadro.mjs            # genera gobierno/cuadro.html para publicarlo
```

## Una sesión, de principio a fin
1. Leer `CLAUDE.md`, `BITACORA.md` y `TABLERO.md`.
2. Aplicar los pedidos que el usuario dejó en el cuadro de mando.
3. Elegir una tarea y repartirla según su tamaño.
4. Construir, verificar mirando capturas a 390 px, revisar el código.
5. Jueces APTO. Tablero, bitácora y parte. Publicar el cuadro. Commit y push.
6. Contarle al usuario, en llano y con capturas, qué cambia.

## Quién decide qué
- **El usuario**: reglas del juego, arquitectura, quitar cosas, cambios grandes de aspecto, presupuesto de arte, qué
  entra al tablero y en qué orden.
- **El director**: cómo se hace, el reparto, lo pequeño y obvio.
- **Nadie se salta**: mirar las capturas, los jueces al cierre, las licencias del arte.

## Archivos
- `TABLERO.md` tareas aprobadas · `BITACORA.md` decisiones, esperas, propuestas y encargo siguiente.
- `partes/` un parte breve por sesión · `estudios/` estudios de Exteriores (si los hay).
- `capturas/` y `cuadro.html` se generan; no van a git.
