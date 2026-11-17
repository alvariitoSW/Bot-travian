# GM4b · Soldados más finos: cuánto cuesta y qué camino tomar (17/11/2026)

Pedido: «que los soldados parezcan más reales aunque siga siendo un videojuego, pero hay que mejorar sus animaciones,
su forma, que parezcan al menos de un juego de PS4». Es un estudio: **no cambia el juego ni sube la descarga**.

Captura: `gobierno/capturas-tarea/GM4b-hoy-lejos-cerca-malla.jpg` (el hastatus de hoy: de lejos, de cerca y con sus
triángulos a la vista).

## 1. Por qué de cerca parecen «de 2003»
Medido en `assets/units/` con `node gobierno/arte.mjs` y abriendo los archivos. Ejemplo: el hastatus.

| Qué | Hoy | Un soldado de tropa de la época PS4 (de memoria, orientativo) |
|---|---|---|
| Triángulos del soldado entero | 2 120 | 5 000 a 10 000 |
| … de ellos, el cuerpo | 932 | 3 000 o más |
| … la cabeza | 166 (cara plana: nariz y boca van pintadas) | 800 o más |
| … las manos | manoplas, sin dedos | dedos |
| Dibujo de la piel y la ropa (textura) | 512 px para todo el cuerpo; 256 px para cara, casco y escudo | 1 024 a 2 048 px |
| Relieve fino (arrugas, malla, abolladuras) | no hay: todo es color pintado | sí, una segunda imagen de relieve |
| Brillo del metal | no hay: el bronce es pintura amarilla | sí |
| Huesos | 29, contando armas y escudo | 50 a 70, con dedos |
| Movimientos | 6 (quieto, andar, correr, dos golpes, morir): 9 segundos en total, hechos a mano | decenas, grabados de personas reales |

Tres causas, por orden de lo que más se nota:
1. **La forma.** 0 A.D. se hizo para verse desde arriba y lejos. Con 932 triángulos el hombro es un pico y la cara una
   careta. Suavizar la luz (GM4) lo disimula, pero el contorno sigue siendo de picos.
2. **El movimiento.** Solo seis gestos y todos los hombres hacen el mismo. No hay parar un golpe, encajarlo, mirar,
   cubrirse ni caer de dos maneras.
3. **La superficie.** Sin relieve ni brillo, la tela, la piel y el bronce parecen el mismo plástico pintado.

Un dato que ayuda: **los triángulos casi no pesan en la descarga**. De los 0,78 MB del hastatus, 0,37 son movimientos,
0,19 el dibujo y solo 0,17 la forma. Lo que sube la descarga son las imágenes y los movimientos, no la figura.

## 2. Tres caminos
Para todos vale lo mismo en el móvil: hoy la batalla de cerca pinta unos 600 000 triángulos (tope 650 000) con 220
figuras completas, y va a 50–60. Si cada figura pasa de 2 120 a 6 000 triángulos, las 220 no caben (1,3 millones).
Solución común: **solo los 30 o 40 hombres más cercanos llevan la figura fina**; el resto sigue como hoy. Así se
queda en unos 620 000–640 000. Lo que sí encarece es el relieve y el brillo (GM4 ya vio que pintar mejor cuesta un
26–40 % más de cerca): habría que medirlo en tu móvil y dejar un ajuste «Calidad: alta / normal».

### A. Exprimir los de 0 A.D. (sin arte de fuera, sin ordenador)
- **Qué se hace**: redondear por programa cuerpo y cabeza (cada triángulo se parte en cuatro y se alisa); fabricar el
  relieve a partir del dibujo que ya hay; dar brillo al metal; convertir más movimientos de los que 0 A.D. ya trae
  (más golpes, otra muerte, guardia). Falta comprobar cuántos trae para cada tropa.
- **Triángulos**: 4 000 a 4 500 por soldado (justo en el tope de 4 500 de `arte.json`).
- **Descarga**: +4 a +8 MB (relieve 0,1–0,2 MB y movimientos 0,2–0,4 MB por tropa). Cabe: hoy 27,6 de 37.
- **Coste**: 3 sesiones, unos 3 M.
- **Riesgo en el móvil**: medio-bajo.
- **Hasta dónde llega**: hombros y cascos redondos, tela con arrugas, bronce que brilla. **No arregla la cara ni las
  manos** (redondear no inventa una nariz ni dedos) y los movimientos siguen siendo los de 0 A.D. Diría «PS2 bueno,
  casi PS3». No es PS4.

### B. Cuerpo y movimientos libres nuevos, vestidos con el equipo de 0 A.D.
Rastreo (skill `radar`): **no existe un soldado romano republicano libre y listo**. En OpenGameArt no hay ninguno. En
Sketchfab los hay con licencia CC-BY, pero son imperiales (anacrónicos), sin huesos, hechos por IA o escaneos de
300 000 triángulos; y Sketchfab no está entre las fuentes aprobadas. Lo que sí hay, con licencia comprobada en su página:
- **Cuerpos**: Quaternius, «Universal Base Characters». CC0 (sin condiciones). 6 cuerpos de unos 13 000 triángulos,
  con huesos. Proporción «Regular», algo estilizada. https://quaternius.com/packs/universalbasecharacters.html
- **Movimientos**: Quaternius, «Universal Animation Library» 1 y 2. CC0. Más de 120 y más de 130 movimientos:
  andar en ocho direcciones, golpes encadenados, caídas, gestos. La segunda pesa 10,3 MB entera.
  https://quaternius.com/packs/universalanimationlibrary.html · https://opengameart.org/content/universal-animation-library-2
- **Reserva**: MakeHuman (cuerpos realistas, CC0 al exportar; solo visto en el resumen del buscador, sin abrir su página).

- **Qué se hace**: cuerpo nuevo rebajado a 5 000–6 000 triángulos, con cara y dedos; casco, escudo, espada y coraza de
  0 A.D. encima; túnica nueva; 12 a 15 movimientos elegidos. **Un solo cuerpo y un solo juego de movimientos para
  toda la infantería** (hoy cada tropa repite los suyos: 6 MB solo en movimientos).
- **Triángulos**: 6 000 a 7 000 el soldado fino (hay que subir el tope de 4 500).
- **Descarga**: entre −3 y +8 MB, según cuántos movimientos y qué tamaño de imágenes. Estimación, no medida.
- **Coste**: 1 sesión de prueba con UN soldado (1,2 M); si convence, 5 o 6 más (6–8 M en total). Caballos y
  elefantes se quedan como están.
- **Riesgo en el móvil**: medio. **Riesgo de aspecto**: alto hasta ver la prueba; el cuerpo de Quaternius es limpio
  y algo de dibujo animado, y puede no casar con el equipo pintado de 0 A.D. Vestirlo pide Blender: en la nube se
  puede intentar sin pantalla (no probado); con tu ordenador sería más seguro.
- **Hasta dónde llega**: es el único camino sin ordenador que cambia la cara, las manos y, sobre todo, el movimiento.
  «PS3 bueno» de cerca.

### C. Soldados hechos a mano en Blender (pide un ordenador tuyo)
- **Qué se hace**: con Blender 5.2 en tu ordenador, encendido y conectado, Claude modela cada soldado desde cero con
  las skills de Blender que ya están copiadas (y las de P150). Arte propio, con la licencia que tú quieras.
- **Triángulos**: 6 000 a 8 000. **Descarga**: +10 a +20 MB (tope nuevo: 50–60 MB).
- **Coste**: el primer soldado, 2 o 3 sesiones (unos 3 M); después 1 M por tropa: **15 a 20 M** las 16 de a pie.
- **Riesgo**: en el móvil, medio. De resultado, alto: nunca se ha probado aquí que Claude modele bien una figura
  humana; habría que ver el primero antes de seguir.
- **Hasta dónde llega**: el más fiel a la época y el de mejor acabado posible. También el más caro y lento.

## 3. Recomendación
**B, empezando por la prueba de un solo soldado** (un hastatus en una maqueta, al lado del de hoy, para que lo
compares en tu móvil y digas las imágenes por segundo). Cuesta 1,2 M y no toca el juego ni la descarga.
- Si convence: se sigue con B.
- Si el cuerpo no casa: se cae a **A**, que es seguro y barato, y aun así se aprovechan los movimientos libres.
- **C** solo si tienes ordenador y quieres el máximo, sabiendo lo que cuesta.

**Franqueza**: 220 soldados de PS4 a un palmo de la cámara no caben en un móvil. Lo alcanzable es que los 30–40 de
delante aguanten la mirada y que el resto se mueva como gente. Buena parte de «parecer PS4» es movimiento, relieve y
brillo, no triángulos. Y lo de «todos iguales y a la vez» no lo arregla este estudio: son GM34 y GM36, ya en la 1.0.

## 4. Preguntas (una línea cada una)
1. ¿Hago la **prueba de un soldado** con cuerpo y movimientos libres nuevos (1,2 M, solo maqueta)? (A) sí; (B) no,
   solo mejorar los de 0 A.D. (camino A); (C) esperar.
2. ¿Tienes un **ordenador** (Windows o Mac) donde instalar Blender y dejarlo encendido mientras se trabaja? (A) sí; (B) no.
3. **Descarga**: hoy 27,6 MB, tope 37. ¿Hasta dónde puede subir? (A) se queda en 37; (B) hasta 50; (C) hasta 70.
4. **Triángulos por soldado**: el tope es 4 500. ¿Lo subo a 7 000 solo para los 40 más cercanos? (A) sí; (B) no.
5. ¿Qué te molesta más de cerca? (A) la forma (cara, manos, hombros); (B) el movimiento; (C) las dos por igual.
6. ¿Admites **MakeHuman** (CC0) como fuente de cuerpos, además de Kenney, Quaternius y OpenGameArt? (A) sí; (B) no.

## Cómo se ha medido y qué no se ha comprobado
- Medido aquí: triángulos por pieza, tamaño de imágenes, huesos, movimientos y reparto del peso (`assets/units/*.bin`
  y `units.json`); totales con `node gobierno/arte.mjs` (APTO, 27,6 MB).
- Licencias de Quaternius: leídas en sus páginas (dicen «CC0»). MakeHuman y Sketchfab: solo el resumen del buscador.
- **De memoria, sin comprobar**: las cifras de «época PS4». **Estimado, no medido**: descarga, sesiones y fluidez de
  cada camino. No se ha descargado ni instalado nada.
