# AR2 · Estudio del catálogo NVIDIA SimReady (Hugging Face), 27/11/2026

Taller de Arte. Solo estudio: **no entra nada en el juego.**
Pedido del usuario (27/11): revisar entero `huggingface.co/datasets/nvidia/simready-assets`.
Sirve a la línea de arte de `OBJETIVOS.md` (variedad de la ciudad y del mercado con licencia limpia).

## En tres frases
1. **La licencia vale**: cada pieza trae su propio `LICENSE.txt` con la **CC BY 4.0** completa. Se puede usar, cambiar y publicar gratis en GitHub Pages, citando a NVIDIA. Encaja con la CC BY-SA 3.0 de 0 A.D.
2. **Para la Antigüedad sirve poco**: de 2.919 piezas, unas **60** valen: ollas de barro, cestas, panes, fruta, queso, pescado, cucharas de madera, un taburete. Son de **almacén, hospital, taller de coches y cocina moderna**. **No hay** árboles, rocas, animales, ánforas, barriles de madera, sacos ni tiendas.
3. **Se convierten bien, pero pesan muchísimo**: texturas de 2.048 y 4.096 px, y un pan con 82.788 triángulos. Recortadas a 800 triángulos y 256 px quedan en 43–75 KB y se ven bien junto a un plebeyo (foto). El problema es otro: **el arte del juego ya pesa 55,6 de los 56 MB**.

## 1. Licencia exacta
- **Archivo leído**: `<pieza>/.metadata/LICENSE.txt` en cada carpeta. Es el texto oficial «Attribution 4.0 International» de Creative Commons.
  Las tres piezas bajadas tienen el mismo archivo (huella md5 `2ab72471…`). La ficha de cada pieza (`com.nvidia.simready.packaging.json`) dice `"license": "CC-BY-4.0"`.
- **README del repositorio**: solo pone `license: cc-by-4.0`. No hay condiciones extra de NVIDIA, ni registro, ni casilla que aceptar (`gated: false`).
- **¿Juego gratuito en GitHub Pages?** Sí. La CC BY 4.0 deja copiar, cambiar y redistribuir, incluso con fines comerciales. Exige cuatro cosas:
  1. Citar al autor: «NVIDIA Corporation, SimReady Assets».
  2. Enlazar la licencia: https://creativecommons.org/licenses/by/4.0/
  3. Enlazar la obra (la carpeta de Hugging Face de cada pieza).
  4. Decir que la hemos cambiado («reducida y convertida a glTF en AQVILA»).
  Prohíbe dos cosas: dar a entender que NVIDIA patrocina el juego y añadir candados (DRM). No usaríamos su logotipo.
- **¿Compatible con CC BY-SA 3.0 de 0 A.D.?** Sí.
  - Si cada pieza va en su propio archivo, es una **colección**: cada archivo conserva su licencia. Basta con un `LICENSE.txt` propio en su carpeta.
  - Si se mezcla con arte de 0 A.D. (por ejemplo, un atlas común), el resultado puede publicarse con BY-SA 3.0. La CC BY 4.0 lo permite si se conserva el crédito a NVIDIA.
  - Al revés no vale: el arte de 0 A.D. no puede pasar a BY 4.0. No hace falta.
- **Regla del proyecto**: la lista del 16/11 (skill `arte`) admite arte externo de Kenney, Quaternius y OpenGameArt. NVIDIA es una **fuente nueva**: la decide el usuario. La CC BY 4.0 ya está admitida para el sonido (`arte.json`).

## 2. Inventario
Recorrido entero por la API de Hugging Face (`/api/datasets/nvidia/simready-assets/tree/main`), sin bajar modelos: **2.919 carpetas** (una por pieza).
Las familias más grandes: comida 539, menaje de cocina 179, cajas de cartón 154, herramientas de mano 97, consumibles 77, pintura 68, piezas de coche 67+52, almacén 67, palés 64.

**Lo que falta del todo**: árboles, arbustos, hierba, rocas, animales (ni caballos ni ovejas), ánforas, barriles de madera, sacos de tela, tiendas, carros de madera, armas.
Las «cercas» (`environment_fence_*`) son vallas metálicas de seguridad. Los «barriles» son bidones de plástico o acero. «pallet_drum» es un palé.

Ruta de cada pieza: `<carpeta>/simready_usd/sm_<carpeta>_01.usd` (o `.usda`). Peso = carpeta entera en Hugging Face, casi todo texturas.

| Pieza | Carpeta (ruta) | Peso en HF | Para qué | ¿De época? |
|---|---|---|---|---|
| Olla de barro | `cookware_pot_clay_a01`, `_a03` | 42 / 30 MB | mercado, cocina, campamento | **Sí** (olla de cerámica común) |
| Botella de barro | `container_bottle_clay_a01` | 227 MB | mercado | Dudosa: forma torneada moderna |
| Cuenco viejo decorado | `dishware_bowl_decor_old_a01`, `_a02` | 26 MB | mesa, mercado | Sí, si el dibujo no es moderno |
| Jarra | `kitchenware_jug_a01`…`i01` (9) | 6–13 MB | mercado | **No**: loza pintada moderna (azul con flores) |
| Cesta del pan | `utensil_breadBasket_a01` | 83 MB | panadería, mercado | Sí (mimbre) |
| Cesto de bambú | `storage_bin_bamboo_a01` | 401 MB | almacén, mercado | Sí de forma; muy pesado |
| Caja de listones | `storage_crate_wooden_a01` | 125 MB | almacén, puerto, campamento | Pasable: listones y asas, aire moderno |
| Tablas | `misc_boards_wooden_a01`, `_a02` | 46 MB | obra, aserradero | Sí (aspecto de aglomerado) |
| Taco de madera | `primitives_block_wood_a01` | 21 MB | obra | Sí |
| Taburete viejo | `furniture_stool_wooden_old_a01` | 127 MB | casa, taberna | Sí |
| Utensilios de madera | `utensil_spoon_wooden_*`, `utensil_ladle_wooden_a01`, `utensil_cuttingBoard_wooden_*`, `utensil_servingTray_wooden_*` (~20) | 20–50 MB | cocina, campamento (detalle) | Sí; demasiado pequeños para verse a 390 px |
| Alfombra | `textileDecor_rug_a01` | 186 MB | casa rica | Dudosa (dibujo) |
| Estera tejida | `decor_placeMat_table_woven_a01` | 130 MB | mercado (suelo del puesto) | Sí |
| Planta seca en jarrón | `decor_plant_dried_vase_a01`, `_b01` | 125 MB | casa | Sí |
| Panes rústicos | `food_prepared_bread_farmerSourdough_a01`, `_panDiCasa_a01`, `_darkRye_a01`, `_harvestBread_a01` | 40–70 MB | panadería, mercado, campamento | **Sí** (pan redondo de horno) |
| Uvas | `food_produce_grape_a01` | 137 MB | mercado, vendimia | **Sí** |
| Cebolla, ajo | `food_produce_onion_a01`…`d01`, `food_produce_garlic_*` (10) | 7–127 MB | mercado, campamento | **Sí** |
| Peras, manzanas | `food_produce_pear_*` (16), `food_produce_apple_*` (22) | 5–15 MB | mercado | Sí |
| Queso | `food_dairy_cheese_h01`, `_i01` | 24 MB | mercado | Sí (cuña de queso) |
| Huevos | `food_egg_chicken_a01`… (13) | 6 MB | mercado, granja | Sí |
| Pescado | `food_fish_spottedSardine_a01` (y lubina, trucha, salmón, tilapia) | 32 MB | puerto, mercado | Sardina sí; el resto, especies de fuera |
| Martillo de madera, mazo | `instrument_mallet_a01`, `handTool_hammer_rubberMallet_*` | 40–78 MB | taller | **No**: mango metálico o de goma |
| Cubo de hierro | `cleaning_bucket_iron_a01` | 81 MB | — | **No**: cubo de cinc moderno |

**De fuera de época y descartado**: tomate, patata, maíz, aguacate, plátano, pimiento (vienen de América o de Asia), latas, botellas de cristal, cajas de cartón, todo lo de hospital, coche y oficina.

Foto: `gobierno/capturas-tarea/AR2-inventario.jpg` (las miniaturas oficiales de 21 candidatas). Se ve el estilo: foto-realista, para simulación de robots.

## 3. Prueba de conversión
Tres piezas bajadas (solo esas, **99 MB**): olla de barro, caja de listones y pan `panDiCasa`.
Herramienta: Blender 5.3 sin pantalla (el `bpy` del entorno «AQVILA Batallas taller»). Importa el USD sin ayuda y exporta GLB. Guion de una página, fuera del repositorio.
**Ningún modelo se sube al repositorio.**

| Pieza | Tamaño real | Original: triángulos / texturas | GLB directo (texturas 512) | GLB «de juego» (800 triángulos, 256 px, sin mapa de relieve) |
|---|---|---|---|---|
| Olla de barro | 28 × 28 × 25 cm | 21.840 / 3 de 2.048 px | 693 KB | **43 KB** |
| Caja de listones | 37 × 28 × 19 cm | 12.348 / 3 de 4.096 px | 554 KB | **75 KB** |
| Pan | 17 × 17 × 9 cm | **82.788** / 3 de 2.048 px | 2.040 KB | **61 KB** |

- Cada pieza trae tres texturas (color, relieve y una mezcla de brillo, metal y sombra). Es el mismo PBR que lee three.js.
- Los materiales de NVIDIA (MDL) no pasan a glTF. Blender lee las texturas del USD y basta con eso.
- **Contra el presupuesto** (`arte.json`, `node gobierno/arte.mjs` = APTO):
  - Triángulos: la pieza reducida (800) cabe de sobra en el tope de un edificio (12.000). En bruto, el pan solo ya pasa ese tope siete veces.
  - Descarga: **55,6 de 56 MB usados**. Las tres piezas de juego suman 179 KB; seis piezas, unos 0,35 MB. Caben justo y dejan el arte sin margen.
- Foto: `gobierno/capturas-tarea/AR2-junto-plebeyo.jpg`, render de taller en Blender (no es el juego). El plebeyo de Meshy, a 1,70 m, con la caja, la olla y el pan a escala real.
  El color y el acabado casan con Meshy (también foto-realista). Junto a 0 A.D., que es más pintado y de pocos polígonos, se notaría más realista, pero a esta escala no chirría.
  En la vista de ciudad (cámara alta) una olla de 28 cm ocupa unos pocos píxeles: **solo se lee en grupos** (un puesto lleno de ollas, una pila de cajas).

## 4. Veredicto
**Merece la pena poco y solo para el mercado y el campamento.** No resuelve lo que más falta (árboles, rocas, animales, ánforas, barriles, sacos): para eso SimReady no tiene nada.
Lo que sí da, con licencia limpia, es **comida y cacharros de verdad**, mejores que hechos a mano.

- **Piezas que sí** (unas 10): olla de barro, cuenco viejo, cesta del pan, estera, caja de listones, taburete, dos panes, uvas, cebolla/ajo, peras/manzanas, queso, sardina.
- **Quién las usaría**:
  - **Ciudades** (Cerebro): los 14 puestos del mercado y la panadería. Es el mejor uso.
  - **Supervivencia**: el campamento (comida, ollas, cajas). Encaja.
  - **Mapas**: no. Las piezas son demasiado pequeñas para el mapa y no hay árboles ni rocas.
- **Cuánto costaría**:
  - Una sesión del taller para 10 piezas: bajar unos 0,8 GB, reducir a 300–800 triángulos y texturas de 256 px.
  - Mejor en un solo atlas para todo el puesto de mercado: un archivo de unos 0,3–0,5 MB y una sola llamada de dibujo.
  - Ficha en `js/registro.js`, `LICENSE.txt` con el crédito a NVIDIA, línea en el menú de créditos y en el README.
  - **Bloqueo**: la descarga de arte está a 0,4 MB del tope. Hay que subir el tope (decisión del usuario) o ahorrar en otra parte.
- **Gasto de este estudio**: ver el parte. Bajados 99 MB de los 518 GB (0,02 %) y 20 MB de miniaturas.

## Pregunta al usuario
¿Traemos piezas de NVIDIA SimReady al juego?
- **(A) Recomendada**: admitir NVIDIA SimReady (CC BY 4.0) como fuente nueva y encargar **un solo atlas del puesto de mercado** (ollas, panes, fruta, queso, cestas; unos 0,4 MB) cuando Ciudades lo pida, subiendo el tope de descarga de 56 a 57 MB.
- **(B)** No traer nada ahora: archivarlo como fuente posible y seguir con Meshy y 0 A.D.

**Por qué (A)**: es la única fuente libre de comida y cacharros realistas que hemos visto, la licencia es limpia, y un solo atlas cuesta poco. Pero no sirve para árboles, rocas ni animales.
