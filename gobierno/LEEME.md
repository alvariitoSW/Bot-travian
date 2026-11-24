# Gobierno de AQVILA

Cómo se organiza el trabajo. Reducido a propósito: ocho oficios, tres comandos y un cuadro para el usuario.

## Los oficios
| Oficio | Qué hace | Dónde está |
|---|---|---|
| **Plan socialista** | El director reparte UNA tarea del tablero entre constructor, verificador y revisor; rama y parte | skill `plan-socialista`, agentes en `.claude/agents/` |
| **Registro** | `js/registro.js`: ficha de cada edificio, tropa, ciudad, hecho, facción y mejora, con su arte y su fuente. Al añadir una pieza a `data.js`, se añade su ficha (hay plantillas). Los números siguen en `data.js` | `node gobierno/fichas.mjs` (corre también en `jueces.mjs --rapido`) |
| **Jueces** | Dicen si el juego funciona: lógica, recorrido en navegador y capturas | `node gobierno/jueces.mjs` |
| **Bitácora** | Apunta lo que pide el usuario, lo pasa al tablero cuando lo aprueba, informe «¿a dónde vamos?» | skill `bitacora`, `BITACORA.md`, `TABLERO.md` |
| **Ahorro** (Hacienda) | Sin tope ni corte (usuario 24/11); gasto medido al cerrar y apuntado; recortes propuestos | skill `ahorro`, `node gobierno/gasto.mjs`, línea «Cuentas» de los partes |
| **Exteriores** | Estudia mecánicas de otros juegos y rastrea arte libre, técnica e historia. Ideas sí; código y arte, no | skills `ingenieria-reversa` y `radar` |
| **Arte** | Dueño de `tools/`, las licencias y el presupuesto de peso y triángulos | skill `arte`, `node gobierno/arte.mjs`, `arte.json` |
| **Sonido** | Director de Sonido de todo el juego: carta sonora, mezcla, licencias y presupuesto de audio | skills `sonido`, `sonido-efectos`, `sonido-musica`; `node gobierno/juez-sonido.mjs` |
| **Combate** | Motor de lucha (escudo, mano del arma, armas, manípulos), físicas, soldados y sus movimientos | skill `ministerio-combate`; `node gobierno/juez-area.mjs combate` |
| **Historia** | Fidelidad a 280–146 a.C.: fichas con fuentes, dictamen histórico, lo que se aprende jugando | skill `historia`, `gobierno/historia/` |
| **Cuadro de mando** | Página para el móvil del usuario con el estado y botones para decidir | skill `cuadro-de-mando`, `cuadro.mjs`, `cuadro.json` |

**Ministerios por área, en vigor desde el 23/11** (`MINISTERIOS.md`; decisión del usuario): Cerebro (Ciudades y Política),
Corazón (Batallas y Combate), Músculo, taller de Arte y taller de Sonido (23/11). Guías: skills `ministerio-batallas`, `ministerio-cerebro`,
`ministerio-musculo`, `ministerio-combate`, `arte` y `sonido`. Dueño de cada archivo: `areas.json`. Cada tarea cierra con `node gobierno/juez-area.mjs <área>`; los jueces
completos, una vez al subir. Tablero y bitácora los escribe solo el vigía, con los partes.

## Los comandos
```bash
node gobierno/jueces.mjs            # todo: ~3 min, deja capturas e informe en gobierno/capturas/
node gobierno/jueces.mjs --rapido   # solo la lógica: segundos
node gobierno/arte.mjs              # peso, triángulos y licencias del arte
node gobierno/fichas.mjs            # cada pieza de data.js tiene su ficha (arte + fuente histórica) en js/registro.js
node gobierno/cuadro.mjs            # genera gobierno/cuadro.html para publicarlo
node gobierno/arte-fotos.mjs        # lista y fotos pequeñas de las piezas de arte, para la pestaña «Arte» del cuadro
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
