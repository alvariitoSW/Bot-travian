# Concurso GM43d · C «Hombres y hierro» · informe

**Qué cambia** (solo cómo se ven los modelos de hoy; ni modelos, ni reglas, ni botones, ni cámara, ni sonido):
- **Cada hombre es distinto**: tono de piel, rojo de la túnica (rubia, ladrillo o desvaído), color de pelo y desgaste,
  con un azar fijo por hombre. Dentro de lo creíble para hastati: rojos y ocres apagados, castaños.
- **Nuca**: el bloque negro pasa a pelo castaño corto con mechones y, por debajo, cuello con su piel.
- **Tela, cuero y piel con relieve**: trama de lino en la túnica, veta en correas, poros suaves. Barro y polvo de las
  rodillas para abajo, más en unos que en otros.
- **Bronce que brilla**: casco montefortino y placas del pectoral con reflejo del cielo y del suelo, brillo del sol y
  pátina verdosa en unos cascos más gastados que otros. Borde de luz cálido en hombros y cascos.
- **Escudos, uno distinto de otro**: la cara con trama de lienzo, rayas que dejan ver el cuero, desconchones en el canto
  y barro salpicado desde abajo (Polibio 6.23: tabla forrada de lienzo y piel de becerro). El dorso, con veta de madera.
- **Venablos y pila**: astil con veta, hierro con brillo y algo de óxido. El venablo lleva su correa de lanzar (amentum);
  **plumas no**, porque el venablo no las llevaba. El pilum lleva dos virolas y regatón.
- **Sombras de contacto**: cada venablo en vuelo o clavado en tierra echa una tira de sombra; cada hombre (romanos y
  enemigos), una mancha alargada hacia donde la echa el sol. No es un mapa de sombras: es barato.

**Qué traje de fuera**: tres texturas CC0 de Poly Haven (Rough Linen, Fine Grained Wood y Rusty Metal 02), reducidas y
empaquetadas con unos arañazos hechos por código en una sola imagen, `detalle.png`. Licencia comprobada en
polyhaven.com/license. Detalle en `LICENSE.txt`. ambientCG no se pudo usar: sus descargas salen de otro dominio
(`acg-download.struffelproductions.com`) que la red bloquea.

**Peso**: 0,7 MB añadidos (`detalle.png`); la carpeta entera, 828 KB. **Llamadas de dibujo**: +2 (14 → 16 en marcha y en el
testudo): una para las sombras de los venablos y otra para las de los hombres. Ninguna pasada de pantalla completa.
El sombreador de los hombres hace más cuentas por píxel (4 o 5 lecturas de textura más); sin medir en un móvil real.

**Lo flojo, sin adornar**
- Las placas del pectoral y el canto del casco salen de una textura de 0 A.D. de poca resolución: de muy cerca se ve
  el grano, aunque se suavizó.
- La cara sigue siendo la misma para todos (solo cambia el tono de piel). La boca no se abre.
- Las sombras de los hombres se ven en la tierra, pero las matas de hierba las tapan; no caen sobre los vecinos.
- Altura de cada hombre igual: no se tocó para no mover las cuentas de la cámara y del techo.
- Galos y peltastas siguen como estaban (otro material, de `js/`).
- Las rayas y desconchones del escudo, a 390 px, a veces parecen salpicaduras claras más que desgaste.
