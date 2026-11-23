# Parte FI3 (maquetas) · Pilum que rebotan o se clavan en la falange y el testudo (23/11/2026)

**Aviso al vigía: FI3 se hizo dos veces a la vez.** Otra sesión subió `2026-11-23-FI3.md`: proyectiles *solo en el motor*
(`Fi.lanza`, `Fi.vuela` dentro de `crearFisica`), para que los conecte LP5. Esta sesión los ha conectado ya a las dos maquetas
con su propio `crearProyectiles()`, en el mismo archivo. Los dos conviven: pruebas 33 de 33. Hay que elegir uno y quitar el
otro (ver «Decide el usuario»). Los dos partes se quedan.

Sirve a **L17** (formaciones a pie). Aprobada por el usuario el 23/11 («Si hazlo ya»), tras FI1 y FI2. Diseño:
`estudios/FI3-diseno-proyectiles.md`. Todo con Opus: director, cuatro constructores y un verificador.

## Qué se ha hecho
Una regla nueva en el motor sin pantalla (`crearProyectiles()` en `js/fisica-batalla.js`). Como en FI1 y FI2, solo decide
cómo se ve. Quién muere, qué escudo se rompe y los golpes los siguen decidiendo las reglas. La física no usa su azar.
- **En el aire**: el proyectil sigue la parábola de las reglas, pero se para en lo primero que toca: escudo, cuerpo, asta
  alzada o suelo. Mira el astil entero, de la cola a la punta.
- **Al llegar**: escudo de frente → se clava. De refilón, el canto o el umbo → rebota, gira y cae. Casco → rebota.
  Suelo alto → se clava con la punta enterrada. Suelo bajo → resbala y se queda tumbado.
- **Lo clavado va pegado al hueso** de su escudo o de su pecho: sigue al hombre y cae con él. Si al caer el astil se
  mete en el vecino, gira un poco sobre la punta; si no basta, se suelta y cae al suelo.
- Falange: los pila de los romanos contra el muro. Testudo: los venablos de los peltastas y los pila contra los galos.
- `?fisica=0` deja el dibujo de antes.

## Cifras (una salva completa de cada maqueta; guiones `mide-fi3.mjs`, los dos APTO)
| | Falange (pila) | Testudo (venablos) | Testudo (pila) |
|---|---|---|---|
| Muestras con el astil dentro de escudo, cuerpo o suelo | **0** de 220 | **0** de 5306 | **0** de 6749 |
| Golpes de cara, 0–30° | 8 clavan | — | 9: todos clavan |
| Golpes de cara, 30–60° | 6 clavan | 76: todos clavan | 63: todos clavan |
| Golpes de cara, más de 60° | — | 4: todos rebotan | 12: 3 rebotan, 9 resbalan |
| Aparte, por el sitio (rebotan siempre) | canto 3, umbo 1, asta 5 (1 clava) | canto 30, umbo 4 | canto 16, umbo 17 |
| Sigue a su dueño (< 1 cm) | — | 431 de 431 | 205 de 205 |
| Reglas iguales con y sin física | sí (24 pila, 6 bajas) | sí | sí |
| Coste medio por fotograma (vara ≤ 1 ms) | 0,63 ms | 0,66 ms | 0,42 ms |
| p95 / peor fotograma | 1,6 / 4,3 ms | 1,6 / 7,9 ms | 1,3 / 3,1 ms |
| Llamadas de dibujo | sin cambio | 30 y 30 | 49 y 49 |
`test/fisica-batalla.test.mjs`: 23 de 23 (las 10 de FI1 y FI2 siguen). `test/falange.test.mjs` y `pilum.test.mjs` en verde.

## Capturas (vistas por el director)
`capturas-tarea/FI3-tes-h-venablos` contra `-tes-h-venablos-antes` es **la que mejor lo enseña**. Antes, el techo del testudo era un
erizo de venablos tiesos, clavados en cualquier ángulo. Ahora se ven menos: los de refilón y los que dan en el canto rebotan y caen.
`FI3-fal-v-clavados`: dos pila tumbados en el suelo delante del muro. `FI3-tes-h-suelo`: un pilum tumbado entre los pies de los
galos que cargan, junto a un caído. `FI3-fal-h-salva` y `-antes`, `FI3-fal-h-cerca`, `FI3-tes-v-pila`.
**Lo que se dice y no se promete**: en la falange los pila son finos y se pierden entre las sarisas. El antes y el después se
distinguen mal en una foto quieta. En `fal-h-cerca` no salió ningún pilum clavado en un escudo.

## Lo que no se ha hecho o queda flojo
- **Picos de coste**: la media cumple, pero el fotograma en que llega toda la descarga cuesta de 3 a 8 ms (navegador por software).
  Bajarlo pide reescribir las cuentas sin crear vectores sueltos. No está medido en un móvil real.
- **Saltos**: cuando las reglas dicen «muere este hombre» y el vuelo tocó a otro, el pilum se dibuja en el de las reglas, entrando
  desde arriba (falange: 7 de 24). En escudos y astas vale el que tocó (la regla solo dice que la falange lo paró).
- **El pilum en la mano** cruza el cilindro de su propio lanzador durante un cuarto de segundo. Se cuenta aparte («en la mano»),
  no como «dentro»: es el brazo, no el cuerpo.
- **Medidas supuestas**: grosor del scutum, caja del escudo galo (0,6 × 0,9 m) y del aspís (0,62 m). No se ha cotejado de cerca
  el aspís con su caja en una foto.
- **El escudo lastrado** (que se incline por el peso del pilum) no se hace: tocaría `soldado.js`.
- No hubo revisor aparte, por el gasto: las pruebas y los dos guiones de medida hacen de juez.

## Pases
- Pase → vigía (`gobierno/areas.json`): dar a batallas `js/fisica-batalla.js` y `test/fisica-batalla.test.mjs` (siguen «sin dueño»).
- Pase → subida (`sw.js`): si las maquetas van en la caché, añadir `gobierno/maquetas/a-pie/proyectiles.js`.
- Pase → FA8 y FA9 (falange, `escena.js`): líneas `FI3`: las matrices de trabajo y `FIS.conecta(...)` (tras crear `FIS`); `const PF = FIS.proyectiles(S)`
  y la línea de su dibujo dentro del bucle de los pila; `__tp.proyectiles` y `__tp.proyectilesJuega`. Quien cambie el dibujo de los pila, que deje la rama de `PF`.
- Pase → quien toque `gobierno/maquetas/a-pie/escena.js`: líneas `FI3`: el import; crear y conectar `FP`; `FP.paso(S, dt)` al final del paso;
  una línea en el dibujo de los venablos y otra en el de los pila; `__tp.proyectiles` y `proyectilesMide`.
- Motor: `crearFisica` no cambia. `crearProyectiles` es nuevo, con su contrato en la cabecera.
- Guiones nuevos: `gobierno/maquetas/falange/mide-fi3.mjs` y `captura-fi3.mjs`; `gobierno/maquetas/a-pie/mide-fi3.mjs` y `captura-fi3.mjs`.
- No se tocaron `js/falange.js` ni las reglas del testudo. La campaña no cambia.

## Ideas
- Idea: el escudo con un pilum clavado que se incline por el peso y que el galo acabe soltándolo (César 1.25). Pide tocar `soldado.js` o el escudo galo.
- Idea: chispa y un «clinc» cuando el proyectil rebota en el umbo o el casco (la física ya sabe dónde y cuándo).

## Historia
El pilum se hacía para clavarse en el escudo y doblarse, y el escudo lastrado se soltaba (Polibio 6.23; César, Guerra de las
Galias 1.25). Que rebote en el umbo o el casco y resbale en el suelo es física, no fuente. Son licencia de juego los ángulos de
corte (60° y 25°), la elasticidad, el rozamiento y las medidas de los escudos. Citas de memoria del director: que Historia las coteje.

## Gasto
`gasto.mjs` al cerrar: ver la línea final. Avisado el vigía al pasar de 1,0 M y de 2,0 M (y de 4,0 M). Hicieron falta cuatro
constructores en lugar de dos: la primera vuelta dejaba astiles dentro de los cuerpos y el pilum del testudo con un largo equivocado.

## Decide el usuario
- **Dos motores de proyectiles**: FI3 se hizo dos veces. (A) quedarse con este, que ya se ve en la falange y el testudo, y llevarle lo bueno del otro (pilum que se dobla, herida en el casco) [recomendado]; (B) quedarse con el del motor (`Fi.lanza`) y volver a conectar las maquetas con él. Por qué: (A) ya está conectado y medido en pantalla; (B) tira trabajo hecho.
- **El techo del testudo**: con física, los venablos de refilón rebotan y el techo ya no queda erizado. (A) así, como manda el ángulo [recomendado]; (B) que casi todos se claven en el techo, aunque sea menos realista. Por qué: (A) es lo que pidió («según las físicas»), pero el erizo de venablos es una imagen muy de película.
- **Los picos de coste al llegar la descarga**: (A) dejarlo y medirlo en tu móvil [recomendado]; (B) reescribir las cuentas para bajarlos ya. Por qué: de media cuesta 0,4–0,7 ms; el pico es un solo fotograma y aquí el navegador va sin tarjeta gráfica.

## Juez
`node gobierno/juez-area.mjs batallas`: **APTO** (11 pruebas, 927 s, con `juez-guerra` en navegador). `--archivos`: todo en casa (dos avisos «sin dueño», en Pases).

**Gasto final** (`gasto.mjs`): **4,48 M**, todo Opus: director 0,99 M; constructores 0,88 + 0,47 + 0,89 + 0,65 M; verificador 0,61 M.
Ningún ayudante pasó de 30 pasos.
