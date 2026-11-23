# CD0b · Concurso de arte de la vista desde arriba (23/11/2026)

**Qué es.** El concurso que pidió el usuario tras ver las capturas de CD0 («algo así», pero mejor de aspecto). Sirve a **L1**
(una ciudad que construyes y ves crecer) de `OBJETIVOS.md`. Maqueta: `maquetas/ciudad-nueva-concurso/`. Capturas:
`capturas-tarea/CD0b-*.jpg`; la hoja comparativa es `CD0b-hoja-ciudad.jpg` (solo la vista) y `CD0b-hoja.jpg` (vista,
«Construir» y «Necesidades»). **No se ha tocado el juego.**

## Ganador (usuario, 23/11): «B con suelo de A»
**Casas, templo, foro y muralla en 3D real con sombras de tarde (estilo B), sobre el suelo, los campos, los caminos y los
árboles pintados del estilo A.** Cámara fija desde arriba; se acerca con dos dedos, sin girar ni inclinar (decisión de CD0).

## Los tres estilos (los tres que eligió el usuario en CD0)
Los tres pintan la misma ciudad (`comun/escena.js`), con la misma interfaz (`comun/ui.js`): barra de recursos, «Construir»
con las siete familias y la capa de **8 necesidades**, con el Barrio del río **en revuelta** (dureza «Duro»).
| Estilo | Qué se ve | Cómo se haría en three.js | Peso medido en la maqueta | Época |
|---|---|---|---|---|
| **A · Plano pintado** (`pintado/`) | Acuarela cálida: hierba con flores, caminos de borde suave, campos en tiras, copas con luz y sombra blanda, hogueras y ánforas | Plano ortográfico con texturas pintadas por código en un canvas; casas como piezas encima. El desenfoque «gouache» necesita WebGL (Safari de iOS no tiene `ctx.filter`) | 309 ms en pintar (sin GPU) | APTO |
| **B · 3D real desde arriba** (`maqueta/`) | Casas con tejado a dos o cuatro aguas, atrios con impluvio, ínsulas de tres pisos, chozas de paja, comicio de gradas, muralla con torres; sombras de sol bajo | Ya es three.js 0.170: geometría por código con `InstancedMesh` | 37 736 triángulos, 50 llamadas de dibujo, 300 ms el primer cuadro (sin GPU) | APTO |
| **C · Mapa antiguo ilustrado** (`lamina/`) | Tinta sepia en pergamino, rayado en los tejados, alzados pequeños de templo, curia y torres, rótulos latinos, rosa de los vientos, cartela | Plano ortográfico con textura de papel y tinta, edificios como láminas de frente a la cámara, o un shader de rayado | 34 ms en pintar | APTO CON NOTAS |
El punto de partida (`plano-claro/`, el vector de CD0 mejorado) se dejó fuera del concurso.

## Qué debe aplicar CD1 (vista desde arriba y «Construir»)
1. **Cámara**: perspectiva cenital mirando recto hacia abajo, con un campo de visión moderado para que los edificios altos
   se vean un poco de lado hacia los bordes. Dos dedos acercan y alejan; no se gira ni se inclina.
2. **Suelo pintado de A**: un canvas generado por código (semilla fija) con hierba manchada y flores, caminos de tierra de
   borde difuso, campos en tiras con surcos de varios tonos y orilla húmeda del río, puesto como textura del suelo
   (≈1 MB en memoria; sin archivos nuevos). Las calles de la ciudad, de tierra fuera y empedradas cerca del foro.
3. **Edificios de B**: casas, ínsulas, chozas y muralla como `InstancedMesh` por código (base: `maqueta/render.js`). El templo,
   la curia y los barcos, con los modelos de 0 A.D. que ya carga `js/gfx/city3d.js` si se leen mejor desde arriba (en la
   maqueta, el templo solo se reconoce por el tejado).
4. **Luz**: sol bajo de tarde con sombras suaves y luz cálida del cielo. Sin tilt-shift en el juego (en la maqueta son franjas
   CSS: caras en el móvil y tapan la interfaz).
5. **Capa de necesidades**: halo de color por barrio, fila de 8 iconos propios (`comun/ui.js`, `UIComun.ICONOS`) colocada con
   `camera.project` (el `proyectar` de la maqueta), revuelta con aro de llamas y la etiqueta «Revuelta».
6. **Presupuesto**: ciudad entera por debajo de 60 000 triángulos, frente a un tope de 300 000 (`arte.json`). Medir en el móvil.

## Qué debe aplicar CD6 (embellecer)
- Del estilo A: árboles de copas en capas, con su propio color en otoño; hogueras con humo, montones de leña y ánforas en los
  patios; flores en la hierba; viñeta ligera.
- Del estilo B: que se distingan bien la ínsula y la casa de atrio desde arriba (más altura, balcones y sombra más larga) y
  que las sombras no ensucien los huecos entre manzanas.
- Del estilo C, como idea: rótulos latinos pequeños (FORVM, CVRIA, COMITIVM) al acercar mucho, para aprender jugando.

## Dictamen histórico (skill `historia`): APTO CON NOTAS
- **Bien**: teja terracota y toba ocre-gris, sin mármol; muralla de sillares lisa y sin almenas (muralla serviana, L.1);
  templo toscano con podio y columnas solo delante (L.2, L.3); casas de atrio con impluvio (L.6, L.7); comicio redondo de
  gradas junto a la curia; chozas de paja para el nivel más pobre.
- **Notas**: (1) La ciudad oval y casi en cuadrícula es **licencia de juego**: la Roma de 280–146 a.C. tenía calles torcidas
  en las colinas (Livio 5.55; `CI0-objetivo-ciudad.md` §4); CD2 deja las calles torcidas a gusto del jugador. (2) Las chozas
  redondas de paja dentro de la muralla son **probables** para un barrio pobre del siglo III (cabañas del Palatino, de
  tradición antigua), no habituales en Roma; mejor en las colonias jóvenes. (3) En C, «AQVILA» y el «PLANVM» de la cartela son
  invención del juego, no un mapa real. (4) «Revuelta» de barrio: **licencia de juego**. Lo más parecido son las
  secesiones de la plebe (la última, en 287 a.C.; Livio, *Periochae* 11).
- **Arte**: todo por código, sin imágenes externas. Ni Iberus, ni Nova Roma, ni ningún otro juego comercial: solo ideas
  (`REF-ciudad-iberus.md`).
