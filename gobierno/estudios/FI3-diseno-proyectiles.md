# FI3 · Pilum que rebotan o se clavan (23/11/2026)

Sirve a **L17** (formaciones a pie). Aprobada por el usuario el 23/11 («Si hazlo ya»), tras FI1 y FI2. Es la propuesta (e) de
`FI1-diseno-fisicas.md`. Pedido: «que no se choquen y atraviesen las cosas». Diseña y construye Opus.

## Qué se ve
1. **En el aire**: el proyectil sigue la parábola de las reglas, pero se para en lo primero que toca (escudo, cuerpo, asta
   alzada o suelo). Nunca lo cruza.
2. **Al llegar, según el ángulo y lo que toca**:
   - Escudo de frente (menos de 60° respecto a su cara) → **se clava** y se queda con el escudo.
   - Escudo de refilón, el canto o el umbo de metal → **rebota**: vuelo corto, gira en el aire y cae al suelo.
   - Cuerpo → se clava en él. Casco (lo alto del cuerpo) → rebota.
   - Asta alzada de la falange → se clava en ella o, de refilón, se desvía y cae.
   - Suelo en ángulo alto (más de 25°) → se clava con la punta enterrada. En ángulo bajo → **resbala** y se queda tumbado.
3. **Lo clavado sigue a lo que lo lleva**: al escudo que se mueve y al hombre que cae, porque va pegado a su hueso.
4. Interruptor `?fisica=0` para ver el antes.

## Lo que no cambia
Quién muere, qué escudo se rompe y cuántos golpes cuenta lo deciden las reglas (`js/falange.js` y la maqueta del
testudo). La física solo decide cómo se ve. No consume el azar de las reglas: usa el suyo propio. Una prueba lo comprueba
(las partidas salen iguales con y sin física).

## Dónde vive
- `js/fisica-batalla.js`: `crearProyectiles()` nuevo, sin pantalla, con su prueba en `test/fisica-batalla.test.mjs`.
  `crearFisica()` no cambia: FI1 y FI2 dan lo mismo.
- Adaptadores: `gobierno/maquetas/falange/fisica.js` y `gobierno/maquetas/a-pie/fisica.js`. Dan al motor los obstáculos tal
  como se dibujan (escudo desde su hueso, cuerpo, asta, suelo), solo los cercanos a un proyectil.
- `escena.js` de cada maqueta: solo líneas de conexión marcadas `FI3`.

## Cómo se mide (número, no opinión)
| Vara | Número |
|---|---|
| Nada atraviesa | **0** muestras con el astil dentro de un escudo, un cuerpo o el suelo en una salva completa de cada maqueta. Al clavado se le permite solo la punta (≤ 0,25 m) dentro de lo que lo lleva |
| Según el ángulo | % de clavados y rebotes por tramos de ángulo (0–30°, 30–60°, más de 60°): los clavados bajan al subir el ángulo |
| Sigue a su dueño | el clavado guarda su sitio respecto al hueso (diferencia < 1 cm mientras el hombre se mueve o cae) |
| Reglas intactas | mismas bajas, mismos estados de las reglas y mismos golpes con `?fisica=0` y con física |
| Coste | ≤ 1 ms por fotograma la parte de proyectiles; llamadas de dibujo iguales (se reusan las mallas de siempre) |

## Guion de fotos (`gobierno/capturas-tarea/FI3-*.jpg`)
Falange: `fal-h-salva` y `fal-h-salva-antes` (la salva de pila llegando al muro, 844×390, con y sin física) · `fal-v-clavados`
(390×844, clavados y rebotados en el suelo) · `fal-h-cerca` (a ras: un pilum clavado en un escudo y otro tumbado).
Testudo: `tes-h-venablos` y `tes-h-venablos-antes` (la descarga contra el muro) · `tes-v-pila` (390×844, la salva de pila
contra los galos) · `tes-h-suelo` (en tierra: clavados y tumbados).

## Historia
El pilum se hacía para clavarse en el escudo y doblarse; el escudo lastrado había que soltarlo (Polibio 6.23; César, Guerra de
las Galias 1.25). Que rebote en el umbo o el casco y resbale en el suelo es física, no fuente. Los ángulos de corte (60° y 25°),
la elasticidad del rebote y el rozamiento son licencia de juego.
