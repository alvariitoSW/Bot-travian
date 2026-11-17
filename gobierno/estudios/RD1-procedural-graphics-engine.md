# RD1 · `Pulindu1/procedural-graphics-engine` (MIT) — multitudes en three.js (16/11/2026)
**Para**: GM1 (ejércitos grandes sin miles de figuras). Licencia MIT (`LICENSE` del repositorio): se puede estudiar el código; **copiarlo exige decisión del usuario**. No se ha copiado nada.
**Enlace**: https://github.com/Pulindu1/procedural-graphics-engine · leído en un clon temporal (fuera del proyecto).
**Nota**: GM1 aún no tiene estudio ni maqueta en el repositorio (`gobierno/maquetas/guerra-grande/` no existe); se cruza con lo que ya hace `js/gfx/battle3d.js`.

## Qué hace
Una escena three.js sin compilación (como la nuestra): un festival junto a un río con 2.500 luces, 500 peatones con articulaciones y 400 luciérnagas.
1. **Instancias** (`InstancedMesh`): las luces y los árboles se pintan de golpe. Agrupa en «trozos» espaciales de ≤512 con recorte por trozo (`src/agents/chunkedInstancing.js`).
2. **Rejilla espacial** (`ISpatialIndex`): celdas de 10 m con clave entera, o un árbol cuaternario con reserva de nodos, para que cada agente solo mire a sus vecinos y no a todos.
3. **Detalle según distancia**: tres niveles para el decorado; las luces lejanas pasan a puntitos con una banda de 10 m para que no parpadeen; y los peatones **animan menos cuanto más lejos** (cerca: cada fotograma; medio: uno de cada 4; lejos: pose fija) (`src/crowd/animationLOD.js`).

## ¿Es creíble su rendimiento?
Anuncia 60 FPS con ~3.400 agentes y 40 FPS con 10.000 luces; «6.700+» en otro apartado del propio README (no cuadra con el 3.400 de arriba). **Matices**: un solo commit, probado «en Chrome con tarjeta gráfica dedicada», sin medidas en móvil, sin tablas de resultados. Y lo importante: **solo las luces están instanciadas**; los 500 peatones son figuras sueltas (una por cada una, `createMiniPersonMesh`), hechas de cubos simples. Lo que se anuncia no demuestra «miles de soldados con modelo real». Creíble para esferas; no medido para figuras.

## Qué serviría para GM1
Ya lo tenemos casi todo: `battle3d.js` tiene figura real/ligera con histéresis (`LOD_HIST`) y un tope de triángulos por batalla (`arte.json`). Lo nuevo y aprovechable:
- **Animar menos lo lejano** (1 de cada 4 fotogramas): aquí la animación va horneada en textura de huesos (`units.js`), así que el ahorro sería de actualizar matrices, no de huesos. Pequeño pero barato.
- **Trozos con recorte propio** para las figuras ligeras lejanas (hoy `frustumCulled = false`).
- **Rejilla espacial** si `battle.js` busca vecinos a fuerza bruta; **medir antes** (la lógica son regimientos, no soldados sueltos, y puede no hacer falta).
- Idea más grande, no del repositorio: pintar el regimiento lejano como **una sola bandera con bloque de figuras** (Total War lo hace). Es el verdadero camino a «ejércitos grandes sin miles de figuras».

## Traducción a AQVILA
`js/gfx/battle3d.js` (nivel de detalle y trozos), `js/gfx/units.js` (ritmo de animación). Nada en `battle.js`. Móvil a 390 px: ahorrar CPU de JavaScript por fotograma, que en un móvil pesa más que en un portátil.
**Coste**: bajo-medio (1 tarea media). **Riesgo**: bajo, pero el beneficio **no está medido en móvil**; y el render aquí es por software.
**Versión mínima**: animación a ritmo reducido para soldados a más de X metros + medir fotogramas antes y después con el mismo juez de siempre. Nada más.
