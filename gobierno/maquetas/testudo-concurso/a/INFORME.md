# GM43d · Participante A · «Luz de cine»

**Idea**: una tarde baja con el sol **de frente**. La cámara siempre mira hacia el enemigo, así que todo sale a contraluz:
los hombres recortados, con el canto del casco y de los hombros encendido, sus sombras largas viniendo hacia ti, y
bajo los escudos una penumbra de verdad con el sol entrando solo por la rendija.

**Qué cambió** (todo en `vista.js` e `index.html` de esta carpeta; nada de `js/`)
- **Sol bajo y de frente** (19°), cálido, con una luz de relleno fría desde detrás de la cámara para que las espaldas no queden negras.
- **Sombras de verdad**: mapa de sombras de 1024 que va con la formación y solo la cubre a ella. Dan sombra los hombres
  (con su esqueleto también en la sombra), escudos, espadas, pila y venablos. Las reciben suelo, matas y hombres.
- **Borde de contraluz** en hombres, escudos, astiles y enemigos: sale de la luz del sol ya sombreada, así que bajo el
  techo no hay borde salvo donde entra el sol por la rendija.
- **Penumbra bajo los escudos**: con el testudo cerrado el cielo deja de iluminar a los hombres (no es un velo por encima:
  es la luz), y el suelo bajo la formación se oscurece. El velo de CSS que había queda más suave.
- **Rayos por la rendija** (cintas de luz que siguen al sol) y **motas de polvo** en el aire que brillan al mirar al sol;
  bajo el techo solo brillan dentro del haz.
- **Polvo de los pies**: nubecillas que levantan los que van delante, más al correr y al cargar.
- **Color**: gradación dentro del propio tonemapping (sombras algo frías, luces cálidas, más contraste), viñeta cálida,
  un velo de sol arriba y grano de película por CSS. Ninguna pasada de pantalla completa.
- **Cielo**: foto panorámica CC0 girada para que su sol caiga donde está el nuestro; montes a contraluz más oscuros, bruma dorada.
- Arreglo pequeño fuera de la luz: el negro liso de nuca y pelo del modelo pasa a castaño muy oscuro (así recibe luz).

**Traído de fuera**: un cielo, «Kloppenheim 06 (Pure Sky)» de Greg Zaal y Jarod Guest, Poly Haven, **CC0**
(https://polyhaven.com/a/kloppenheim_06_puresky; licencia comprobada en https://polyhaven.com/license). Pasado a
`cielo.jpg` de 2048×512. Línea en `LICENSE.txt`.

**Peso**: `cielo.jpg` 66 KB; el código crece unos 20 KB. **Total añadido: 0,09 MB.**

**Llamadas de dibujo** (contadas en WebGL por fotograma, 390×844): marcha 14 → 22 (+8), testudo 14 → 21 (+7),
carga 22 → 27 (+5). De ellas, 6 son la pasada de sombra; el resto, rayos, motas y polvo (una llamada cada uno). El cielo
sustituye al de antes (no suma).

**Qué quedó flojo**
- El suelo y la hierba siguen siendo los de antes: con el sol bajo la hierba sale olivácea y algo «a manchas». No era mi línea.
- En la carga la cámara mira al suelo y no hay cielo: la escena queda más verde y oscura que la marcha.
- Las nubes de polvo son redondas (puntos de pantalla), no tienen forma de nube; de cerca se nota.
- Los rayos son cintas aproximadas, no luz volumétrica: si un rayo pasa delante de un hombre, se ve como una franja clara.
- Sin medir en un móvil real. Sombra suave (PCF) y 1024 deberían ir bien, pero el sombreador de los hombres hace más trabajo.
- La prueba de sonido de `captura.mjs` falló una vez («choque» a 1,01, por azar en el sonido; no lo he tocado) y pasó al repetir.
