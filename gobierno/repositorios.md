# Repositorios de los que AQVILA puede aprender (16/11/2026)

Pedido del usuario: «recuerda todos los repositorios de GitHub que puedes buscar para ayudarte, los que te he pasado
y los de otros repositorios de mi cuenta». Esta es la lista. Regla de siempre: **ideas sí; código y arte solo con
licencia compatible y decisión del usuario** (skills `ingenieria-reversa` y `arte`).

## Los que pasó el usuario
| Repositorio | Para qué | Estado |
|---|---|---|
| `fiebres-neutropenias` (suyo, privado) | Repositorio modelo: de ahí salen el plan socialista, los ministerios y las skills; «ayúdate de todas sus skills y ministerios» (11/11) | Con acceso. Se lee con `add_repo` (solo lectura) si la tarea lo pide |
| `0ad/0ad` (0 A.D., Wildfire Games) | Modelos, animaciones y texturas, CC BY-SA 3.0; también reglas de batalla y formaciones (se puede leer el código para entender la idea) | En uso; crédito en README y menú |
| `arjun988/blender-skills` | 94 habilidades de Blender, MIT, solo texto | Copiadas a `.claude/skills/`; ver `gobierno/kits/blender-skills.md` |
| `songsummer920-dazzle/three-scope-map-skill` | Idea de mapa por regiones y bajar de nivel (J4, C1, C4) | Solo consulta; licencia no libre, nada de su código |

## Los que ya cita el README (inspiración, sin copiar código)
`jurerotar/Pillage-First-Ask-Questions-Later` (aldeas estilo Travian) · `Areso/1255-burgomaster` (gestión de ciudad) ·
`Venerons/civis` (4X en JavaScript) · `CesarAugustoAndrade/game-antiquity-battle-sim` (batallas antiguas con
formaciones y moral) · `dimitarbez/battle-simulator` (batalla en tiempo real, relevante para GM1 y GM2) ·
`tvdboom/augustus` (estrategia histórica). Casi todos son GPL o AGPL o no tienen licencia: se mira cómo se comportan, no se copia.

## Técnica y datos
`mrdoob/three.js` (0.170, ya dentro) · `tilezen/joerd` (relieve del mapa) · `ahujasid/blender-mcp` (para ejecutar Blender
desde un ordenador; no instalado) · `maplibre/maplibre-gl-js`, `protomaps/PMTiles` (solo si se hiciera un mapa de
regiones aparte; hoy no).

## Radar de GitHub del 16/11/2026 (nada descargado; licencias leídas de la ficha de GitHub, a comprobar en la fuente antes de usar)
| Repositorio | Licencia | Para qué | Tarea |
|---|---|---|---|
| `Pulindu1/procedural-graphics-engine` | MIT | Multitudes con instancias, rejilla espacial y detalle según distancia, en three.js puro | GM1 |
| `wesnoth/wesnoth` | GPL-2.0 | Equilibrio de unidades, terreno y zonas de control: solo ideas | GM2 |
| `unknown-horizons/unknown-horizons` | GPL (la ficha no la indica) | Ciudad y economía tipo Anno: solo ideas | FJ, CN |
| `SFTtech/openage` | sin licencia clara | Cómo se mueven y forman las unidades de Age of Empires II: solo ideas | GM2 |
| `donmccurdy/glTF-Transform` | MIT | Comprimir y aligerar modelos en `tools/` | arte, GM4 |
| Listas para seguir buscando: `AxiomeCG/awesome-threejs`, `michelpereira/awesome-open-source-games`, `Roobyx/awesome-game-design`, `devanshutak25/3d-resources`, `madjin/awesome-cc0` | CC0 o CC BY | Índices | radar |

## Los de la cuenta del usuario
No se copian aquí los nombres: este repositorio es **público** y varios de los suyos son privados o personales.
Para verlos, una sesión llama a `list_repos` (herramienta de Claude Code Remote; da la lista al momento) y adjunta
con `add_repo` solo el que la tarea necesite, en lectura. Antes de usar uno, mira qué es: puede traer ideas (una
simulación 3D en el móvil, un juego de decisiones, una app que funciona sin conexión, aprendizaje por refuerzo para
afinar el equilibrio del bot) o ser asunto aparte (clases, guardias, trabajo) que no se toca ni se cita.
Su propio código es suyo y se puede reutilizar si él lo dice; lo de otros dueños (colaboraciones), no.

## Cómo buscar
- GitHub desde la nube: solo `alvariitosw/bot-travian` está adjunto de serie; los demás entran con `add_repo`.
- Búsqueda de código: `gh api -X GET search/code -f q='<términos> repo:<dueño>/<nombre>'`.
- Fuera de GitHub (0 A.D., wikis, Natural Earth, Perseus, Livio…): skill `radar`.
