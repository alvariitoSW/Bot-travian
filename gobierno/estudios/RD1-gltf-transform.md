# RD1 · Medida de `donmccurdy/glTF-Transform` (MIT) con piezas de `assets/` (16/11/2026)
**Pregunta**: ¿aligera 2 o 3 modelos pesados más que lo que ya hace `tools/aligerar_static.mjs` (meshoptimizer)? **No se ha tocado `assets/` ni `tools/`**: todo en un directorio temporal, con las versiones @gltf-transform 4.5.1 y meshoptimizer 1.3.0 (MIT). Enlace: https://github.com/donmccurdy/glTF-Transform
**Cómo**: las 4 piezas estáticas más pesadas (`cantera`, `cart_trirreme`, `establo`, `templo`) se convirtieron a glTF solo con la malla (sin texturas, que van aparte en webp). Se aplicó, una a una: soldar vértices → cuantizar → compresión meshopt → simplificar a la mitad.

## Cifras (KB; triángulos entre paréntesis)
| Pieza | Hoy `.bin` (gzip) | Soldar | + cuantizar | + meshopt (gzip) | Simplif. ~50 % → tools hoy | glTF | glTF + meshopt |
|---|---|---|---|---|---|---|---|
| cantera (10 740) | 975 (293) | 614 | 476 | 264 (156) | 7 549 tri → ≈686 | 390 | 221 |
| cart_trirreme (9 969) | 905 (247) | 532 | 325 | 170 (81) | 6 293 tri → ≈572 | 242 | 130 |
| establo (8 846) | 803 (244) | 349 | 250 | 139 (74) | 5 611 tri → ≈510 | 195 | 113 |
| templo (8 661) | 787 (197) | 571 | 432 | 231 (110) | 7 251 tri → ≈659 | 391 | 211 |
«tools hoy» = lo que pesaría el formato propio con esos triángulos (31 bytes por vértice, sin índices). Soldar no cambia los triángulos (solo reparte los vértices en un índice).

## Lectura
- **Triángulos: glTF-Transform no gana nada.** Su simplificador **es el mismo meshoptimizer** que usa `tools/`. Con el mismo error (0,02) quedan los mismos triángulos.
- **Peso: sí gana, pero no por simplificar, sino por el formato.** Nuestro `.bin` no tiene índices (cada triángulo repite 3 vértices de 31 bytes). Solo indexar baja ~40 %; cuantizar otro ~20 %; la compresión meshopt deja cada pieza en ~25 % del `.bin` (≈50 % si se compara ya con gzip, que es lo que el servidor envía).
- Las 51 piezas estáticas suman **10,4 MB** de `.bin` (2,9 MB comprimidos). Ahorro estimado ≈ 7 MB en disco/caché sin conexión y ~1,4 MB descargados. No se midieron las unidades (16 MB, animadas por huesos: glTF-Transform no sirve sin su esqueleto).
- Limitaciones: la cuantización se negó en las coordenadas de textura que pasan de 0–1 (repiten el dibujo), y la compresión meshopt necesita que el juego **lea glTF o descomprima meshopt**: hoy no lo hace (formato propio en `js/gfx/statics.js`). Eso es tocar `js/`, y three.js solo trae ese lector como extra.

## Veredicto
**Compensa algo, pero no con glTF-Transform.** Lo barato es hacer lo mismo **dentro de `tools/` y nuestro formato**: guardar índices y cuantizar posiciones a 16 bits (ahorro ≈ 50 % del `.bin` sin descompresor nuevo). Propuesta P115 (la decide el usuario). Usar glTF-Transform entero (meshopt) solo si el usuario acepta añadir un lector a `js/vendor/`.
