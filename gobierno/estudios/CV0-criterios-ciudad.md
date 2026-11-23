# CV0 · Criterios para la ciudad (CV1, CV2, CV3)

Lista de repaso para constructor y verificador de CV1, CV2 y CV3. Sale de las habilidades instaladas, a petición del usuario el 23/11/2026.
Cada criterio se contesta sí/no mirando una captura a 390×844. Un «no» en uno de ellos es defecto; se anota con gravedad (bloqueo, mayor, menor).

## CV1 · Vista de plano
1. ¿La cámara está fijada y es la misma en todas las capturas, sin ángulos distintos por pieza? (isometric-style)
2. ¿Se ve entera la urbe (muralla, río, campos) con margen para los botones de pantalla? (isometric-style)
3. ¿Se lee la altura: muralla, torres y casas se distinguen por su alzado y no solo por su planta? (isometric-style, environment-artist)
4. ¿Cada edificio se despega del suelo por contraste de valor o color, también el de menor tamaño? (isometric-style, environment-artist)
5. ¿Los edificios por función se reconocen solo por la silueta o el tejado (casa, templo, granero, mercado)? (environment-artist, genre-strategy-sim)
6. ¿Hay un solo punto focal (foro o templo mayor) y calles o muralla que llevan el ojo a él? (environment-artist)
7. ¿Hay descansos sin detalle (campos, plazas) entre los racimos de casas, sin pared uniforme de casas? (environment-artist, set-dressing)
8. ¿Se separan tres planos por valor: primer término, urbe, fondo? (environment-artist)
9. ¿Los materiales y colores corresponden a la época (adobe, teja, piedra, madera) y no a otra? (historical-worlds)
10. ¿El detalle que solo se ve de cerca (puertas, ventanas, bajos) falta o se ha apagado en esta vista? (isometric-style, environment-artist)

## CV2 · Letreros
1. ¿Cada letrero se lee a 390 px sin ampliar y el sitio al que apunta es inequívoco? (genre-strategy-sim)
2. ¿El letrero explica un sistema («falta agua», «falta madera»), no solo un estado? (genre-strategy-sim)
3. ¿Hay letreros solo en la zona de interés y sobran en el resto (sin papel pintado de letreros)? (set-dressing)
4. ¿Los letreros no tapan puertas, caminos ni el punto focal sin motivo? (set-dressing)
5. ¿Los letreros más lejanos se apagan o se agrupan en vez de apilarse? (isometric-style, set-dressing)
6. ¿El edificio sigue reconociéndose con el letrero encima? (isometric-style)
7. ¿Hay contraste claro entre letrero y fondo sobre campo, tejado y agua? (isometric-style)
8. ¿Un fallo se ve en la captura por un hecho de la ciudad (cola real, obra real) y no por un adorno? (set-dressing, genre-strategy-sim)

## CV3 · Gente con oficio y ficha
1. ¿Los vecinos se leen a la distancia de cámara: se ve cuál va y cuál está quieto? (genre-strategy-sim)
2. ¿Su escala frente a la puerta es creíble (puerta ≈ 2,1 × 0,9 m, persona ≈ 1,7 m)? (environment-artist, prop-artist)
3. ¿El oficio se reconoce por la silueta, el color o la herramienta y no por un rótulo? (prop-artist, historical-worlds)
4. ¿El camino de casa al trabajo cruza calles abiertas, sin atravesar paredes ni obras? (set-dressing)
5. ¿Los grupos de vecinos son racimos pequeños de 3 a 7 con un sentido (cola en la fuente, carga al puerto)? (set-dressing)
6. ¿El atuendo y las herramientas son de época, con fuente en el registro? (historical-worlds, historia)
7. ¿Hay variedad por rotación, escala y color sin que ningún par se vea idéntico en fila? (set-dressing)
8. ¿La ficha de la casa muestra familia, clase, oficio, ánimo y lo que le falta, sin saturar? (genre-strategy-sim)
9. ¿La ficha cabe en 390 px, deja ver la casa elegida y no impide tocar fuera? (isometric-style)

## Rendimiento en móvil
- Números de las habilidades (guía, no ley): casa o prop de fondo 100–500 tris, estándar 500–2.000, héroe 2.000–8.000 (prop-artist). Árbol medio 2.000–5.000 y arbusto 500–2.000 (environment-artist).
- Niveles de detalle: 100 % cerca; 40–60 % medio; 15–30 % lejos; 5–10 % o sombra/tarjeta muy lejos (lod-pipeline, asset-optimization).
- Se enciende cada nivel por el tamaño en pantalla: 100 % hasta 0,5; 50 % hasta 0,25; 25 % hasta 0,1; después 10 % (lod-pipeline). Se fija en tamaño de pantalla, no en metros.
- Cada nivel conserva la silueta y el mismo material (lod-pipeline). Comprobar a ojo en captura.
- Dibujado: repetidos van por instancias, un solo material por kit, sin geometría única por muro, sin detalle de espaldas (environment-artist, asset-optimization).
- Bosque o campo denso: tarjeta o impostor lejos, no un modelo por mata (vegetation-artist).
- Variación procedural: con semilla fija, probada en mínimo y máximo, y con medición de cuadros antes de subir la cantidad (procedural-modeling).
- Aceptar solo con cifras medidas (triángulos, llamadas de dibujado, cuadros) y captura; sin ellas, no hay veredicto (asset-optimization, qa-review).
- Los topes nuevos de nuestro presupuesto se fijan en `gobierno/arte.json`; esta página solo da el orden de magnitud.

## Veredicto (qa-review)
Capturas obligatorias de plano, de cerca y de ficha. Gravedad: bloqueo, mayor, menor, nota. Veredicto explícito: APTO, APTO CON NOTAS o NO APTO; se repite tras corregir.

**No aplicado:** Blender, MCP, nombres `SM_`/`COL_`, UVs, mapas de textura, colisiones, exportación a Unity/Unreal/Godot, retopología y viento por colores de vértice: aquí el arte ya viene hecho de 0 A.D. y se pinta con three.js. Tampoco las 50/25/10 % por módulo ni los 5–15 mil tris de árbol héroe, que no caben en un móvil con cientos de casas. De genre-strategy-sim e historical-worlds salen principios, no pasos.
