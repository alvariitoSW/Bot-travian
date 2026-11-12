# Q1b2 · Referencias para rehacer la vista de ciudad

Solo ideas y técnicas; nada de arte ni código ajeno. Queja: «edificios pobres», «luz, colores y suelo», «de juguete», «finita, sin vida».
Cómo se hizo: 27 búsquedas. **Aviso**: YouTube no devolvió nada útil y la red de la sesión bloquea leer páginas (anno-union, trac.wildfiregames, unrealengine, runevision). Lo de abajo sale de resúmenes de búsqueda; lo marcado *(obs.)* es observación propia del juego citado, sin página leída.
Qué falla en la maqueta actual (capturas Q1b-1 y Q1b-2): césped verde vivo y liso; tierra interior de un solo color; casas sueltas como fichas, todas iguales; muralla como polígono limpio; parcelas de borde duro; horizonte vacío.

## 1. Por qué una ciudad parece maqueta (y cómo evitarlo)
- **Cámara alta + color saturado + contraste duro = miniatura.** Es la receta del «tilt-shift» de fotografía: vista desde arriba, saturación subida «como pintura de maqueta». Hay que hacer lo contrario. [Videomaker](https://www.videomaker.com/article/c3/15704-creating-the-tilt-shift-look-in-post) · [Zoner](https://learn.zoner.com/the-tilt-shift-effect-make-it-mini/)
- **Focal**: un campo de visión estrecho aplasta el espacio; la escala se lee por «pistas» de tamaño conocido (personas, puertas). Probar 35–45° y cámara más baja (25–35° sobre el horizonte), con horizonte visible. [Cycling74, escala y distancia](https://docs.cycling74.com/learn/articles/04-scale-and-distance/)
- **Perspectiva aérea**: lo lejano pierde contraste y detalle y se va al color del aire. Es lo que más «agranda». Sin pasarse: demasiada niebla borra la profundidad. [Runevision, notas](https://blog.runevision.com/2025/06/notes-on-atmospheric-perspective-and.html)
- **Desgaste**: Rome II se elogió por armas melladas y muros con pintadas, no por el motor. Nada limpio ni nuevo. [PC Gamer, avance Rome II](https://www.pcgamer.com/previews/total-war-rome-2-preview-every-detail-about-the-new-engine-naval-combat-multiplayer-and-mods/2/)
- **Color**: 0 A.D. reserva los colores vivos para el color del jugador; el resto, neutros (pardos, grises). Y pinta sombras falsas en la textura para dar detalle a mallas pobres. [0 A.D., documento de arte](https://trac.wildfiregames.com/wiki/ArtDesignDocument)
- **Trazado sin rejilla**: Manor Lords coloca y gira libre; las parcelas largas (burgage) llenan la manzana sin huecos. Casas pegadas, medianeras, patios traseros; no fichas sueltas. [manorlords.com](https://manorlords.com) · [Epic, entrevista](https://store.epicgames.com/news/manor-lords-solo-developer-s-highly-anticipated-medieval-strategy-game-hits-this-month)
- **Silueta**: Imperator rehízo sus edificios de mapa para tener «silueta más icónica y fácil de leer», y solo dibuja casas donde hay ciudad. Pocas piezas reconocibles (templo, foro) sobre masa anónima. [Imperator, diario 16-9-2019](https://forum.paradoxplaza.com/forum/threads/imperator-rome-development-diary-16th-of-september-2019.1245913/)

## 2. Trucos baratos para móvil (three.js, sin post-proceso)
- **Sombra de contacto falsa**: un plano con textura gris difuminada bajo cada edificio o manzana. Es el método del manual oficial. [three.js, sombras](https://threejs.org/manual/en/shadows.html)
- **Evitar post-proceso; usar mapas de luz u oclusión** horneados. [Foro three.js](https://discourse.threejs.org/t/ambient-occlusion-shadows-on-the-ground/1873)
- **Un solo mapa de sombras**, con la cámara de sombra ajustada a la ciudad, y sombra de suelo borrosa de baja resolución (64×64 basta). [Sombras en three.js, vivo](https://besthub.dev/articles/mastering-three-js-shadows-performance-tips-and-real-world-optimizations-57951b5a7347)
- **Luz horneada primero**: su único coste es la textura. La ciudad es estática: vale hornear al construir, no cada fotograma. [Android, luz en móvil](https://developer.android.com/games/optimize/lighting-for-mobile-games-with-unity)
- **Luz de hemisferio** (cielo azulado arriba, tierra cálida abajo) y niebla del mismo color que el horizonte del cielo. [three.js, sombras](https://threejs.org/manual/en/shadows.html) *(lo de la niebla, obs.)*
- **Color de vértice** *(obs.)*: oscurecer la base de los muros y aclarar el alero; variar el tono de cada casa ±8 %. Gratis en el shader y rompe el «todas iguales».
- **Gradación y viñeta sin post** *(obs.)*: un `div` encima con degradado radial y mezcla `multiply`; tono cálido en la luz y frío en la sombra, en el propio material.

## 3. Hacer grande una ciudad pequeña
- **La ciudad no acaba en la muralla**: en Rome II crece a la vista en el mapa, con humo y grúas. Arrabal a ambos lados de cada puerta. [TheSixthAxis, reseña](https://www.thesixthaxis.com/2013/09/02/total-war-rome-2-review/)
- **Capital frente a aldea**: Total War solo da muralla y mapa de asedio a la capital; las menores son abiertas. La muralla puede quedar a medio tapar por casas. [Total War Wiki](https://wiki.totalwar.com/w/Capital_Cities_(TWR2))
- **Recorte de cámara** *(obs., Anno/Total War)*: en la vista por defecto la ciudad debe **salirse del encuadre** por dos lados. Si se ve entera con margen, parece un plato sobre una mesa.
- **Tres franjas de fondo** *(obs.)*: huertos y tumbas junto al camino; campos y villas; sierra azulada sin detalle. Cada franja, menos contraste.
- **Borde blando** *(obs., Manor Lords)*: de casa a huerto, a cercado, a campo, a monte. Sin línea recta entre «ciudad» y «césped». Parcelas con lindes torcidas y setos, no rectángulos nítidos.
- **Terreno**: Roma y Cosa están en colina; la altura esconde el final y da silueta. [Estudio Q1b](Q1b-ciudad-italica.md)

## 4. Vida barata
- **«Unidades de aviso»** de Anno: gente y animales que pasean solo para dar ambiente y decir cómo va la ciudad; con azar para que no se repitan; menos de noche. [Anno Union, aviso visual](https://anno-union.com/author/bb_volty/page/12) · [Anno 117, nov. 2024](https://www.anno-union.com/devblog-anno-117-project-update-november-2024/)
- **Los caminantes son la vida** en Caesar III/Faraón: se ve a quién sirve cada edificio. [ACOUP, juegos de ciudades](https://acoup.blog/2024/02/02/fireside-friday-february-2-2024-on-city-building-games/) · [Scientific Gamer, Faraón](https://scientificgamer.com/in-praise-of-pharaoh)
- **Trabajo a la vista**: Citadelum enseña a la gente trabajando dentro de los edificios. Aquí: talleres abiertos a la calle. [Abylight, diario](https://abylight.com/the-growth-of-our-city-citizens-and-housing/)
- **Humo y obra**: columnas de humo y grúas marcan actividad desde lejos (Rome II, misma reseña de arriba).
- **Lista barata** *(obs.)*: humo de hogar con 3–4 planos; 30–60 peatones instanciados en calles y foro; un carro por camino; toldos de tela en las tiendas; ropa tendida; gallinas y cabras en patios; bandada de pájaros; sombra de nubes que cruza el suelo (una textura que se desplaza).

## 5. Datos históricos (etiquetas de la skill `historia`)
- **Sin mármol**: el primer templo de mármol de Roma es de Metelo, 146 a.C. — Veleyo Patérculo, *Historia romana* 1.11 (s. I d.C.). `histórico`. [Templo de Júpiter Estátor](https://en.wikipedia.org/wiki/Temple_of_Jupiter_Stator_(2nd_century_BC))
- **Calles de tierra**: los censores de 174 a.C. fueron los primeros en contratar el empedrado de las calles de la Urbe — Livio 41.27. `histórico` (texto con lagunas). [Livio, períocas 41–45](https://www.livius.org/sources/content/livy/livy-periochae-41-45/)
- **Hormigón y opus incertum, tardíos**: hacia mediados del s. II a.C., primero en casas; antes, sillar de toba, adobe y entramado — Mogetta, «A New Date for Concrete in Rome», *JRS* 105 (2015). `histórico`. [JRS](https://resolve.cambridge.org/core/journals/journal-of-roman-studies/article/abs/new-date-for-concrete-in-rome/6761DD92010E0E269940BDF086661A07)
- **Pompeya antes de 200 a.C.**: casas de atrio de caliza; toba gris en el s. II — Mau, *Pompeii: Its Life and Art* (1899); esquema aún dominante pero discutido (Fulford y Wallace-Hadrill, 1999). `probable`. [Mau](https://digi.ub.uni-heidelberg.de/diglit/mau1899/0074)
- **Materiales de la Roma media**: piedra, arcilla, madera — Bernard, *Building Mid-Republican Rome* (2018), cap. 2. `probable` (no leído; solo reseña). [BMCR](https://bmcr.brynmawr.edu/?p=44291)
- **Alturas y ladrillo** `sin confirmar` (de memoria, ya en Q1b): domus de 1–2 plantas; adobe (Vitruvio 2.3); pisos altos ya en 218 a.C. (Livio 21.62) pero raros; ladrillo cocido visto es imperial. Color: toba parda, revoco ocre o hueso, zócalo más oscuro, teja de tonos desiguales.
- **Contraste imperial**: Rome Reborn y la maqueta de Gismondi muestran la Roma de c. 320 d.C. (mármol, ínsulas, ladrillo). **No sirven de modelo.** [Big Think, Rome Reborn](https://bigthink.com/the-past/rome-reborn-model/)

## Diez reglas para la maqueta (por impacto)
1. **Bajar saturación y contraste.** Hierba seca y oliva, no verde vivo; teja de 4–5 tonos apagados. El color vivo, solo en toldos y estandartes.
2. **Aire**: niebla del color del horizonte (cálido al sol) que se come contraste con la distancia; cielo y niebla del mismo tono.
3. **Cámara más baja y más cerca**: la ciudad se sale del encuadre por dos lados; horizonte con sierra arriba.
4. **Manzanas compactas**: casas pegadas en hileras con medianera y patio; calles estrechas y torcidas. Nada de fichas sueltas sobre tierra.
5. **Suelo en capas**: tierra pisada, hierba rala, grava, barro en puertas; rodadas en los caminos; manchas oscuras al pie de los muros. Nunca un color liso.
6. **Sombra**: sombra de contacto falsa bajo cada manzana más un solo mapa de sombras con sol bajo (sombras largas).
7. **Borde blando**: arrabal fuera de las puertas, huertos, tumbas junto a la vía, cercados, villas; lindes torcidas. La muralla, irregular y medio tapada.
8. **Variedad barata**: 5–6 volúmenes de casa × giro × tono de vértice × altura (1–2 plantas); 2–3 hitos de silueta clara (templo en alto, foro).
9. **Vida**: humo, peatones y carro en la vía, toldos, animales, pájaros, sombra de nubes.
10. **Época**: toba, adobe revocado y teja; calles de tierra; sin mármol, sin ladrillo visto, sin ínsulas altas.

## Dudas
- No se pudo ver ningún vídeo ni captura de los juegos: conviene que el usuario señale 2–3 imágenes que le gusten.
- Faltan por cotejar en el texto: Vitruvio 2.3, Livio 21.62 y 5.55, y el ladrillo (pasa a la skill `historia`).
- Para leer los diarios de Anno, 0 A.D. y Manor Lords hay que permitir en la red: anno-union.com, trac.wildfiregames.com, unrealengine.com, blog.runevision.com.
