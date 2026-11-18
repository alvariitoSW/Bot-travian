# GM43d · Participante B «Campo de batalla» · 17/11/2026

**Qué cambió.** Todo el campo es nuevo y vive en `campo.js` (la maqueta solo lo llama; reglas, botones, cámara, gestos y
sonido, sin tocar).
- **Suelo**: tres fotos de suelo de verdad mezcladas a la vez: hierba seca de verano, manchas de hierba verde y tierra
  pisada. Hay una **senda** que serpentea hacia la loma con guijarros, **calvas** de tierra sueltas y laderas más secas.
  Cada textura se lee a dos tamaños girados, para que no se vea el cuadriculado.
- **Hierba**: ya no son tarjetas a cuadros. Son matas de hojas curvas, cada una de tamaño, tono (pajizo o verde) e
  inclinación distintos, en corros y claros, con menos sobre la senda. Se mecen con el viento.
- **Flores** silvestres en corros: amapolas, manzanilla, crisantemo amarillo y aciano (todas de la Italia antigua).
- **Piedras**: guijarros en la senda, piedras sueltas por el prado y algún peñasco lejos de la marcha.
- **Árboles de 0 A.D.** (los mismos del juego): una hilera de cipreses junto a un lindero, corros de pinos tras la loma
  del enemigo, un olivar plantado en filas a la izquierda y bosquetes de olivos y cipreses por las lomas.
- **Lomas y montes**: el terreno sube en lomas suaves lejos de donde se juega, con manchas de matorral; detrás, dos
  cordilleras con silueta y bruma al pie.
- **Cielo**: una foto panorámica de cielo de verano con nubes, girada para que el sol caiga donde el de la escena. La
  bruma del horizonte tiene su mismo color.
- **Sombra de contacto** bajo cada hombre (vivo o caído), echada hacia donde cae la sombra.

**Qué traje de fuera** (todo CC0, licencia comprobada en https://polyhaven.com/license; detalle en `LICENSE.txt`):
cielo «Kloofendal 48d Partly Cloudy (Pure Sky)» (Greg Zaal y Jarod Guest), texturas «Grass Ground» (Charlotte
Baglioni), «Sparse Grass» (Amal Kumar), «Brown Mud Dry» (Rob Tuytel) y «Rock Boulder Dry» (Dimitrios Savva y Rico
Cilliers), de https://polyhaven.com. Los árboles son de 0 A.D. (CC BY-SA 3.0) y ya estaban en `assets/`: solo se cargan.

**Peso**: `du -sh arte` = **1,1 MB** (cinco JPG: cielo de 2048×1024 y suelos de 1024 o menos). Tope: 6 MB.

**Coste en pantalla** (medido en el navegador de la nube, fase de marcha, vertical):
- Llamadas de dibujo por fotograma: **14 → 21 (+7)**; en la carga, 29.
- Triángulos: **197 000 → 492 000** (hierba 128 000, árboles unos 80 000, el resto suelo lejano, flores y piedras).
- Sin pasadas de pantalla completa ni sombras de toda la escena. Hierba, flores, piedras, árboles y sombras van por
  instancias (una llamada cada uno).
- Aquí, con dibujo por programa y la máquina cargada, un fotograma cuesta unas 2,2 veces lo de antes.

**Lo que quedó flojo**
- **Sin medir en un móvil real.** Medio millón de triángulos va bien en un móvil de los últimos años; en uno viejo
  puede notarse. Si hace falta, lo primero que se recorta es la hierba (cuántas matas y cuántas hojas por mata).
- Las lomas de lejos son algo lisas y de un solo tono caqui; el matorral solo se ve de cerca.
- Los árboles de 0 A.D. son de poca resolución: de cerca (el ciprés junto a la cámara, en horizontal) se ven las hojas
  recortadas.
- La sombra de contacto apenas se ve: con el sol a la espalda, cae delante de cada hombre, tapada por él mismo.
- Las piedras son bolas deformadas por código: de lejos valen, de cerca se ven facetas.
- La hierba no se aparta al pisarla.
