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

## Licencias de bancos de arte — leídas en su fuente (16/11/2026, RD2)
Leídas el 16/11/2026 en las tres páginas oficiales. Las citas están en inglés, tal como las pone cada página. Resumen para el usuario: **Kenney y Quaternius son CC0 (dominio público): se pueden usar sin pedir permiso y sin crédito.** **OpenGameArt no tiene una licencia: cada obra trae la suya**, y hay que mirarla obra por obra antes de usarla. Aun con CC0, antes de meter arte en el juego va su ficha en `js/registro.js` (de dónde viene y con qué licencia).

### Kenney — https://kenney.nl/support (leída)
- **Licencia**: CC0. «all game assets on the asset pages are public domain licensed (CC0). You're free to use them, even in commercial projects.»
- **Crédito**: no se exige. «Attribution is not required. If you want to support us mention "Kenney" or use one of the badges.» Citarlo es una cortesía, no una obligación.
- **Qué no se puede**: la única restricción de la página es el logotipo: «Refrain from using the 'Kenney' logo seen on top of the page separately.» Es decir, el arte sí; el logo de la web, no.
- **Dudas**: la página remite a «the included license file or visit the asset page» para el detalle de cada paquete, y ese fichero no se ha leído. Comprobar que cada paquete concreto diga CC0 antes de usarlo. El pie de la web dice «All rights reserved», pero es el copyright del sitio, no el de los paquetes. Sobre redistribuir los paquetes sueltos o revenderlos, la página no dice nada: no verificado.

### Quaternius — https://quaternius.com/faq.html (leída)
- **Licencia**: CC0. «All models are under the CC0 License.»
- **Uso**: «these assets can be used for free without the need for attribution in commercial, educational, and personal projects.»
- **Crédito**: no se exige, se agradece. «No, attribution is not necessary. However, credit is always appreciated.»
- **Modificar**: «you are free to modify the models in any way you like, including combining them with other asset packs.»
- **Qué no se puede**: la página no lista ninguna restricción. Sobre redistribuir los modelos sueltos, no dice nada: no verificado. La FAQ habla de «All models» en general; si algún paquete de pago o de otra serie tuviera otra licencia, esta página no lo dice: comprobar en la página de cada paquete.

### OpenGameArt — https://opengameart.org/content/faq (leída con curl; el lector web recibió un 403)
**La licencia es por obra.** El sitio acepta varias (las que la FAQ describe: CC0, CC-BY 3.0/4.0, CC-BY-SA 3.0/4.0, OGA-BY, GPL 2/3). Cada obra pone la suya junto a su descarga, y el autor puede añadir más. Reglas de la FAQ:
- Con varias licencias en una obra: «You must follow only one of the licenses.» Se elige la que mejor convenga.
- Las vistas previas pueden no ir con la misma licencia: «Unless otherwise noted, assume the previews are 'All rights reserved'.» Solo vale lo que se descarga.
- Si el autor cambia la licencia más tarde, la que ya se obtuvo sigue valiendo: «the license you obtained it under is irrevocable.»
- Crédito: si la obra trae un «Copyright/Attribution Notice», se copia tal cual; si no, título, autor y licencia en los créditos.
- Aviso de la propia FAQ: texturas y sonidos de otros sitios pueden traer restricciones incompatibles. Si una obra no deja claro de dónde viene, se descarta.

| Licencia en OGA | Qué exige (según la FAQ) | ¿Se puede repartir un juego web con ella? | ¿Encaja con nuestro arte de 0 A.D. (CC BY-SA 3.0)? |
|---|---|---|---|
| **CC0** | «may be copied, modified, distributed, performed or otherwise used in anyway without asking, crediting or notifying» | Sí, sin condiciones. | Sí. |
| **CC-BY 3.0 / 4.0** | Crédito (título, autor, aviso de copyright, licencia, enlace) y «does not include DRM». | Sí, citando al autor. Un juego web sin DRM cumple. | Sí en uso: el CC-BY puede ir dentro de un conjunto compartido con CC-BY-SA. Lo que se cita aparte, con su autor. |
| **CC-BY-SA 3.0 / 4.0** | Lo del CC-BY y, si se hacen obras derivadas, «distribute them under the same license». | Sí, citando y compartiendo igual lo derivado. | **Sí con 3.0**: es la misma licencia que la de 0 A.D. **Con 4.0**: duda abierta, no verificada en esta FAQ (distinta versión; la SA 4.0 declara compatibilidades propias). |
| **OGA-BY 3.0** | Crédito, sin la cláusula contra DRM. | Sí, citando. | Sí en uso, como CC-BY. |
| **GPL 2 / 3** | «written with source code in mind»; la FAQ avisa de que GNU «no ha dado guía» para el arte de juegos y recomienda a quien no use GPL «fully understand GNU GPL». | **Duda abierta**: la FAQ no lo resuelve. | **Duda**: mezclarla con CC BY-SA no es evidente; no se usa. |

- **Cómo se lee la FAQ sobre CC-BY / CC-BY-SA y GPL**: son incompatibles para mezclar código con licencias distintas, pero «for the intent of creating and distributing games, the Free Software Foundation has clarified that the game code and game media are separate entities and do not need to be released under the same license, provided those licenses allow you to copy and redistribute the work for both commercial and non-commercial purposes». Es lo que permite que el código del juego y el arte vayan cada uno con la suya. Esto es lo que dice la FAQ, no un dictamen jurídico.
- **Por qué importa la SA**: la CC BY-SA exige que lo derivado se comparta con la misma licencia. Lo que se **modifique** de una obra CC-BY-SA (re-texturizar, recortar, convertir) queda también CC BY-SA, como ya pasa con 0 A.D. Lo CC0 no obliga a nada.
- **Regla de trabajo, hasta que el usuario decida otra**: de OpenGameArt solo entran obras **CC0, CC-BY 3.0/4.0, CC-BY-SA 3.0 u OGA-BY** (esta última sin cláusula DRM). **Se descartan GPL**, **CC-BY-SA 4.0** (duda) y cualquier obra cuya licencia no se lea con claridad. Cada obra que entre: ficha en `js/registro.js` con título, autor, licencia y enlace de la página de la obra, y crédito en README y menú.
- **No verificado** (la FAQ no lo dice): compatibilidad exacta CC BY-SA 3.0 con 4.0; encaje de la GPL con arte repartido junto a un juego que no es GPL. Un jurista o la licencia original lo resolvería; no se resuelve a ojo.

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
