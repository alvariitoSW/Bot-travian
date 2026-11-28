# AR3 · Fuentes libres nuevas de arte y atlas del mercado (28/11/2026)

Taller de Arte. Decisiones del usuario del 28/11: «1A» (buscar fuentes libres nuevas) y «2A» (atlas de NVIDIA SimReady para el puesto del mercado).
Sirve a la línea de arte de `OBJETIVOS.md`: variedad de ciudad, terreno y batalla con licencia limpia.

## En cuatro frases
1. **El atlas del mercado ya está hecho**: `assets/mercado/mercado.glb`, **300 KB**, 10 piezas y **3.348 triángulos** en total. Lleva una textura y un material. El crédito a NVIDIA está en el `LICENSE.txt`, en el README y en el menú. El tope sube a **57 MB**. Hoy el arte pesa 55,9 MB.
2. **Las fuentes libres que más sirven son Quaternius, Kenney y OpenGameArt** (CC0, salvo alguna CC BY). Son las únicas que se pueden bajar hoy desde este entorno: tienen copia en `opengameart.org` y en `huggingface.co`.
3. **De estilo, lo que mejor casa son las piezas con textura pintada**, como las armas griegas de gamekorp. Los animales de Quaternius son de caras planas y desentonan junto a la gente de Meshy.
4. **Ninguna fuente libre trae scutum, pilum, casco romano ni olivo.** Esas piezas tienen que salir de Meshy o de 0 A.D.

## 1. Licencias: qué vale con la CC BY-SA 3.0 de 0 A.D.
| Fuente | Licencia exacta | Dónde se lee | ¿Compatible? | Se baja desde aquí |
|---|---|---|---|---|
| NVIDIA SimReady | CC BY 4.0 | `.metadata/LICENSE.txt` de cada pieza | Sí, citando a NVIDIA | **Sí** (huggingface.co) |
| Quaternius | CC0 1.0 | `License.txt` de cada zip; campo de licencia en OGA | Sí (dominio público) | **Sí** (OGA; GLB en `huggingface.co/datasets/codepawl/quaternius-glb`, CC0) |
| Kenney | CC0 | `License.txt` de `kenney_survival-kit.zip` | Sí | **Sí** (OGA; GLB en `huggingface.co/datasets/codepawl/kenney-glb`) |
| OpenGameArt (otros autores) | Una por pieza: CC0, CC-BY 3.0/4.0, CC-BY-SA 3.0, OGA-BY | Campo «License(s)» de cada página | Sí, salvo CC-BY-SA 4.0 y GPL | **Sí** |
| Poly Haven | CC0 | polyhaven.com/license (vista con el buscador) | Sí | **No**: polyhaven.com y dl.polyhaven.org están cerrados en este entorno |
| Sketchfab | Una por modelo | Ficha de cada modelo | Solo si es CC0 o CC BY | **No**: hace falta cuenta y el host está cerrado |
| Smithsonian 3D | CC0 por modelo | 3d.si.edu | Sí, si dice CC0 | **No** (host cerrado) |
| Museo Británico (Sketchfab) | CC BY-NC-SA 4.0 | Fichas | **No**: prohíbe el uso comercial y es BY-SA 4.0 | — |
| Met (Open Access 3D, 2026) | «La mayoría» CC0, ficha a ficha | Nota de prensa del Met | Sí, pieza a pieza | No comprobado |
| Wikimedia Commons | Una por archivo; solo STL sin textura | — | Según la pieza | Sirve poco |

**Regla del proyecto** (skill `arte`, 16/11): Kenney, Quaternius y OpenGameArt ya están admitidos. NVIDIA entra ahora por decisión del usuario («2A»).
Poly Haven, Smithsonian y el Met serían fuentes nuevas. Las decide el usuario, y además hay que abrir sus hosts en el entorno.

## 2. Piezas por fuente
Las cifras de triángulos y KB son medidas aquí cuando dice «medido». Las demás vienen de la ficha de la fuente.

### NVIDIA SimReady (CC BY 4.0) — ciudad
| Pieza | Ruta | Peso original | En el juego (medido) | Estilo |
|---|---|---|---|---|
| Olla, cuenco, cesta, 2 panes, uvas, pera, queso, sardina, estera | `huggingface.co/datasets/nvidia/simready-assets/<carpeta>` (lista en `assets/mercado/LICENSE.txt`) | 3–61 MB cada una; de 5.816 a 188.704 triángulos | **Atlas único de 300 KB y 3.348 triángulos** (de 2 a 600 por pieza) | Foto-realista. Casa con Meshy |

### Quaternius (CC0) — terreno y ciudad
| Pieza | Ruta | Triángulos / peso | Estilo |
|---|---|---|---|
| Caballo, oveja, vaca | OGA `lowpoly-animated-farm-animal-pack`; HF `codepawl/quaternius-glb/engine/farmanimal__Horse/…` | Caballo 690 tris y **310 KB medido** (casi todo son animaciones; sin ellas no está medido); oveja 612 tris y **271 KB medido** | Caras planas, de color liso. **Desentonan junto a Meshy** (foto) |
| Carro con toldo, barril, sacos, rocas | OGA `lowpoly-medieval-village-pack`; HF `medievalvillage__Cart` | Carro **2.660 tris, 61 KB medido**; barril 1.312; saco 304; roca 28 | Tipo juguete, con aire medieval |
| Árboles, arbustos, hierba, rocas (Ultimate Nature, Simple Nature) | OGA `low-poly-nature-pack-1`; HF `simplenature__*` | Arbustos de 86–214 tris; hierba de 88–184; rocas de 28–34 | Caras planas. Sirven de relleno lejano |
| Lanza, espada, escudo redondo | OGA `lowpoly-medieval-weapons` | 872–1.202 tris | Medievales |

### Kenney (CC0) — relleno del mapa
| Pieza | Ruta | Peso | Estilo |
|---|---|---|---|
| Pinos, robles, arbustos, hierba, rocas, columnas, cabeza de estatua | OGA `nature-kit` (Nature Kit 2.1, ya en GLB) | zip de 10,5 MB; piezas de pocos cientos de tris | Juguete muy simple. Solo de lejos |
| Carro, barril, troncos, cajas | OGA `fantasy-town-kit`, `survival-kit`, `pirate-kit` | GLB pequeños | Juguete |

### OpenGameArt, otros autores — soldados y ciudad
| Pieza | Ruta | Licencia (autor) | Triángulos / peso | Encaje |
|---|---|---|---|---|
| **Hoplon, lanza y espada griega** | OGA `3d-greek-weapons-set` (`WeaponSetcc0.zip`, 2,3 MB) | **CC0** (gamekorp) | **Medido**: hoplon 798 tris y 34 KB; lanza 224 tris y 13 KB; espada 232 tris y 19 KB (textura de 256 px) | **Bueno**: textura pintada, de época |
| Gladius | OGA `gladius` (`gladius_0.zip`, 152 KB) | CC0 (lordneo) | — | Bueno |
| Ciprés | OGA `cypress-tree` (4,9 MB) | CC-BY 4.0 (david-w-cg) | — | Bueno, citando al autor |
| Pino | OGA `low-poly-pine-tree-0` (150 KB) | CC0 (aredon) | — | Bueno |
| Tinaja de cerámica | OGA `ceramic-jar` (845 KB) | CC0 (rayb2) | — | Puede hacer de ánfora |
| Tinaja de piedra | OGA `stone-jar` | CC-BY 3.0 (Clint Bellanger) | — | Válida |
| Oveja animada | OGA `sheep-rigged-textured-and-animated` | CC-BY-SA 3.0 (p0ss) | 3,6 MB | Válida, con textura |
| Carros, carro de mano | OGA `carts`, `hand-cart-lowpoly` | CC-BY 3.0 | 1,5–2,9 MB | Válidos |
| Columna antigua | OGA `ancient-column` | CC-BY 4.0 (odintdh) | 5 MB | Buena |
| Hoplon «aspis» | OGA `aspis-hoplite-shield` | CC0 | **131 MB** | Demasiado pesado |
| *No valen*: «Roman Vase» y «Ancient temple» (CC-BY-SA 4.0); «Two Urns» y «Simple Helmets» (solo GPL) | | | | |

### Poly Haven (CC0) — no se puede bajar hoy
Busto de mármol `marble_bust_01` (~17 mil tris), roca `boulder_01` (~124 mil tris, demasiado), caja `wooden_crate_02`. No hay ánforas, barriles ni carros. Escaneo foto-realista: casa con Meshy, pero hay que reducirlo mucho.

### Sketchfab y museos — no se puede bajar hoy
Ánfora de cuello del Museo de Cleveland (`skfb.ly/6QZyt`, CC0), un kílix CC0 del Smithsonian y cascos corintios y Montefortino de licencia sin ver. Son escaneos de cientos de miles de triángulos. Sirven para el foro y el museo, con mucho trabajo de reducción.

## 3. Pruebas (convertidas y vistas a 390 px junto a la gente del juego)
Escena de taller con three.js 0.170 y el lector de GLB del propio juego, a 390×844. Es la del juego, no la ciudad real: suelo liso y luz parecida.
- `gobierno/capturas-tarea/AR3-mercado-simready.jpg`: un puesto con el atlas del mercado, junto al plebeyo y la plebeya de Meshy. A la izquierda, de cerca; a la derecha, con la cámara alta de ciudad.
  Se leen las ollas, la estera, los panes, las uvas, las peras, el queso y las sardinas. De lejos solo se leen en grupo.
- `gobierno/capturas-tarea/AR3-atlas-mercado.jpg`: el atlas. El cuenco era de loza azul moderna y se tiñó de barro.
- `gobierno/capturas-tarea/AR3-pruebas-fuentes-nuevas.jpg`: caballo, ovejas y carro de Quaternius, y hoplon, lanza y espada de gamekorp, junto a los mismos plebeyos.
  **Las armas casan**: tienen textura pintada y una escala creíble. **Los animales y el carro se ven de juguete** al lado de la gente de Meshy: colores lisos y caras planas.

## 4. Recomendación: qué traer primero y para qué
1. **Ciudad**: el atlas del mercado ya está listo. Lo coloca Cerebro (pase en el parte).
2. **Soldados**: las **armas griegas de gamekorp** (CC0, 65 KB las tres) para hoplitas y falangitas. Luego el **gladius** de lordneo (CC0).
   El scutum y el pilum no existen libres: siguen por código o con Meshy.
3. **Terreno**: **pino** (CC0) y **ciprés** (CC-BY 4.0) de OpenGameArt, y rocas y arbustos de Quaternius **reteñidos con una textura** para que no se vean de juguete. Solo para relleno lejano.
4. **Batalla y mapa (animales)**: no traer los animales de caras planas tal cual. Mejor la **oveja con textura de p0ss** (CC-BY-SA 3.0) o pedir caballo y oveja a Meshy.
5. **Más adelante**: abrir Poly Haven (CC0) para el busto de mármol y alguna roca, si el usuario lo quiere. Hay que abrir dos hosts en el entorno.

## Pregunta al usuario
¿Qué traemos ahora de las fuentes nuevas?
- **(A) Recomendada**: traer las **armas griegas de gamekorp** (hoplon, lanza y espada; CC0, 65 KB) para los soldados griegos, y el **pino y el ciprés** de OpenGameArt para el terreno. Los animales y el scutum, con Meshy.
- **(B)**: traer además los **animales, el carro y las rocas de Quaternius** tal como vienen, aunque se vean de juguete junto a Meshy.

**Por qué (A)**: es lo único libre que casa con el estilo de Meshy y de 0 A.D. y que pesa poco. Lo de caras planas se nota al lado de la gente realista.
