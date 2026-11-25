# REF · El zoom que quiere el usuario para el mapa vivo (AM2, 25/11/2026)

**Para qué sirve.** Primera página que lee quien toque el mapa vivo de Grecia. El usuario enseñó el 25/11, en la sesión AM2,
cuatro capturas de una aplicación de mapas del móvil con este literal: «Si y algo parecido a esto no tan realista pero básate
en estas imágenes de ejemplo». **No se guardan** (norma de `CLAUDE.md` §7: son de un producto ajeno). Solo ideas.

## Qué se ve en las cuatro (de lejos a cerca)
1. **El Mediterráneo oriental entero** (unos 2 000 km de ancho de pantalla): foto desde el espacio, mar azul hondo con
   el fondo marino en claroscuro, tierra verde y ocre, nombres de países grandes y pocos.
2. **El Peloponeso y el Ática** (unos 300 km): mapa en relieve sombreado, verde claro en los llanos y rayado gris en las
   sierras; mar de un azul plano; nombres de ciudades (pocas, con punto) y de islas en cursiva sobre el mar.
3. **La comarca de Argos** (unos 15 km): la bahía con su curva, llanura verde, sierras con sombra, pueblos como manchas
   claras con su nombre, carreteras finas, los sitios antiguos (Tirinto, Hereo) con un sello.
4. **La ciudad de Argos** (unos 1,5 km): se ven las calles una a una, las manzanas apretadas de tejados, las huertas y
   olivares en cuadros alrededor, y la escala abajo («200 m»).

## Qué idea tomamos (y dónde está hecha)
| Idea | En el mapa vivo |
|---|---|
| Un solo mapa que se amplía con dos dedos, sin cambiar de pantalla, del mar entero a las calles | Zoom continuo de ~840 km a ~1,2 km de ancho de pantalla |
| Cada altura enseña cosas distintas: cuanto más cerca, más nombres y más detalle | Niveles de detalle: región → comarca → polis; los nombres entran por altura |
| El zoom se ancla bajo los dedos; al soltar, el mapa sigue un poco | Gestos del motor (pellizco anclado, inercia, doble toque) |
| De cerca, la ciudad es un tejido de calles y manzanas rodeado de huertas en cuadros | Polis de cerca: calles, casas una a una, parcelas y olivares |
| Escala gráfica abajo | Regla de escala en km/estadios |
| Nombres de islas en cursiva sobre el mar, comarcas en versalitas | Rótulos por clases (mar, región, isla, monte, santuario) |

**«No tan realista»**: no es una foto. Se pinta (estilo A, relieve natural; estilo B, carta antigua) y las casas son más
grandes de lo real para que se lean en el móvil. Época: la Grecia de las polis, sin carreteras ni ciudades modernas.
