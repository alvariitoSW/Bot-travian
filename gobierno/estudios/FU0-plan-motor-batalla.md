# Corazón · Plan del motor único de batalla a pie (FU0, 24/11/2026)

**Qué es.** El plan para fundir las tres escenas a pie («Testudo a pie», «Falange a pie» y «Manípulo a pie») en **un solo
motor**. Solo plan: no cambia código. Sirve a `OBJETIVOS.md`, órgano Corazón: **L10** (una sola batalla, con un solo
aspecto), **L11** (el testudo a pie dentro del juego) y **L17** (formaciones). Pedido del usuario (24/11): «hay que empezar a
fusionar la de testudo, falange de picas y manípulo a pie para crear nuestro motor de batalla… junto con arte, físicas y
animación». Eligió **1A** (plan corto y luego por partes: un motor con el control de «Manípulo a pie»; testudo y falange son
formaciones suyas) y **2A** (la fusión va antes de CG4b). Dijo también que el testudo «lleva sin aplicarse mejoras un tiempo».

## 1. Qué verá el usuario al final
- **Una sola escena a pie.** Se entra igual desde Escaramuzas («Testudo a pie», «Falange a pie», «Manípulo a pie» siguen
  en el menú, pero abren la misma escena con otra formación) y desde la batalla grande con «Bajar a pie».
- **Un solo control, el de «Manípulo a pie»**: arrastras el dedo por el suelo y el bloque gira como una puerta y marcha
  hasta esa raya; cuatro órdenes abajo, la que conviene se ilumina; pellizco hasta el hombro del oficial y vuelta; «Datos ▾».
- **Testudo, falange, muro y orden abierto son formaciones o habilidades del mismo bloque.** El manípulo cierra el
  testudo con su botón (techo de escudos de verdad, las jabalinas se clavan en él y suena «dentro»), abre el orden para
  esquivar una salva o forma muro en la primera fila. La falange es el mismo bloque con sarisas, abanico y sus rivales
  (manípulos, jinetes, elefantes, falange u hoplitas).
- **Mismos soldados, misma física, misma animación y mismo sonido** en todas: los soldados nuevos (Meshy y FA2), los
  cuerpos que no se atraviesan y los proyectiles que se clavan (FI1–FI5), los movimientos de `js/gfx/soldado.js` y un solo
  sonido con voces y música.
- **Lo del testudo que valía no se pierde**: cruzar el campo bajo las salvas hasta la colina, la cámara bajo los escudos,
  lanzar el pilum manteniendo y soltando, el duelo del oficial (parar, empujar, estocada) y, si caes, seguir como otro.
  Pero ahora con los soldados nuevos y el control del manípulo. Eso son las mejoras que el testudo llevaba tiempo sin ver.

## 2. Cómo está hoy (leído en el código, 24/11)
| | Testudo (`maquetas/a-pie/`) | Falange (`maquetas/falange/`) | Manípulo (`maquetas/bloque/`) |
|---|---|---|---|
| Tamaño | 16 archivos, escena de 1.520 líneas | 21 archivos, escena de 730 | 9 archivos, escena de 351 |
| Reglas | en la maqueta (`unidad.js`, `acciones.js`, `formacion.js`) | `js/falange.js` + `js/falange-rivales.js` | `js/bloque.js` + `js/bloque-ia.js` |
| Control | ocho botones y gestos propios | el del manípulo (LP6: importa `bloque/dedos.js` y `bloque/camara.js`) + `mando.js` | dibujar el frente, cuatro órdenes, pellizco |
| Soldados | **los viejos de 0 A.D.** con esqueleto y paso hechos a mano | los nuevos de FA2 (`soldados.js`) | los nuevos de Meshy (`soldados.js`, `tropas.js`) |
| Física | `js/fisica-batalla.js` con su `fisica.js` y `proyectiles.js` | lo mismo, con su `fisica.js` | lo mismo, con su `fisica.js` (usa aún el lanzador viejo que FI3u marcó para quitar) |
| Sonido | `a-pie/sonido.js` (dentro/fuera, voces SON4) | lo reexporta | lo importa de `../a-pie/` |
| «Bajar a pie» | no | sí (LP7b) | sí (LP7) |

**Repetido**: `campo.js` es idéntico en testudo y falange (el bloque ya usa el de la falange); `camara.js`, `esqueleto.js`,
`locomocion.js`, `soldado.js`, `hud.js` y `fisica.js` existen dos o tres veces con pequeñas diferencias.
**Ya se comparte**: física y proyectiles (`js/fisica-batalla.js`), soldado nuevo (`js/gfx/soldado.js`), sonido, dedos y
cámara del bloque (la falange los toma prestados) y el «Bajar a pie» de `js/ui-mando.js`.
**Solo lo tiene una**: el testudo, el paso cruzando el campo, el pilum mantener-soltar, el duelo con dedos, cambiar de
soldado al caer y la cámara bajo el techo; la falange, sarisas, abanico, picas que se parten y los cuatro rivales con su
dibujo (`caballeria.js`, `elefante.js`, `rival.js`); el bloque, el dibujo del frente, la IA en tres niveles, compañeras y
vecinos, «Trabados» y retirada, y el enganche limpio a la batalla grande.

## 3. El motor único: qué se queda, qué se funde y qué se borra
**Casa del motor: `gobierno/maquetas/bloque/`** (no se cambia de sitio: así `js/ui-mando.js`, los jueces y la caché no se
mueven). La escena lee `?formacion=manipulo|testudo|falange` (y `?rival=` para la falange).
- **Se queda como base**: `bloque/escena.js`, `dedos.js`, `camara.js`, `hud.js`, `fisica.js`, `tropas.js`, `soldados.js`,
  `rotulos.js`; `js/bloque.js` y `js/bloque-ia.js` (el bloque y su IA); `js/fisica-batalla.js`; `js/gfx/soldado.js`.
- **Nuevo, una carpeta `bloque/formaciones/`**: un archivo por formación con el mismo contrato:
  `{ ordenes, util(S), mods(S), guardia(h, S), monta(ctx), paso(dt), alAviso(tipo, d) }` (sus cuatro órdenes, cuál se
  ilumina, cómo cambian velocidad y golpe, cómo lleva el escudo cada hombre en la física, qué dibuja de más y qué suena).
  `manipulo.js` (lo de hoy), `testudo.js`, `falange.js` (usa `js/falange.js` y `js/falange-rivales.js` **tal como están**:
  las reglas de la falange no se reescriben, se enchufan).
- **Se funde**: el duelo del oficial y el pilum mantener-soltar del testudo pasan a `bloque/oficial.js` (vale en cualquier
  formación, en la vista del oficial); los rivales de la falange (`caballeria.js`, `elefante.js`, `rival.js`) y sus
  falangitas pasan a `bloque/rivales/`; el sonido de `a-pie/sonido.js` pasa a `bloque/sonido.js`.
- **Se borra** (al final, etapa 6): `maquetas/a-pie/` y `maquetas/falange/` salvo un `index.html` de dos líneas que lleva
  a la escena única con su formación (los enlaces viejos y los jueces siguen sirviendo); el esqueleto y el paso hechos a
  mano para los soldados de 0 A.D. (los soldados nuevos ya traen sus movimientos); el lanzador viejo de proyectiles en
  `js/fisica-batalla.js`. Lo bueno del paso de TP1 (cada hombre con su paso, inclinarse al correr) se lleva a `tropas.js`.
- **Sonido (SON7 trabaja en paralelo)**: el motor no hace sonido por su cuenta. Todo pasa por **un solo enchufe**:
  la escena avisa `avisa(tipo, datos)` → `bloque/sonido.js` → golpes y pasos del banco (`js/gfx/sonido.js`) y, para voces y
  música, `Voces.deAviso(tipo, datos)` y `Banda` (de `js/voces.js` y `js/gfx/musica.js`, que son de SON7). Cada formación
  añade sus avisos (testudo: `techo`, `abre`; falange: `pica_rota`, `ha`; rivales: `elefante`, `flanco`). **Pase → SON7**:
  la lista de avisos con sus nombres, fija desde la etapa 1; SON7 no toca la escena y FU no toca sus archivos.

## 4. Etapas (en orden; cada una ≤30 pasos de constructor; Opus dirige y construye)
Para todas: «Bajar a pie» (manípulo y falange) y Escaramuzas siguen funcionando al cerrar cada etapa; no se relaja ninguna
vara de los jueces. Prueba: `node gobierno/juez-area.mjs batallas` en APTO y capturas propias a **390×844 y 844×390** en
`capturas-tarea/FU<n>-*.jpg`, vistas. Archivos comunes (`js/ui.js`, `js/game.js`, `js/data.js`, `js/registro.js`,
`index.html`, `sw.js`): solo como pase a la sesión «de paso» (hoy CDe3).

**FU1 · El testudo con el control del manípulo** (primera; ≈1,6 M; riesgo medio)
- *Se ve*: Escaramuzas → «Testudo a pie» abre la escena del bloque con soldados nuevos. Cruzas el campo dibujando el frente
  hacia la colina; llegan dos salvas; tocas «Testudo» y el bloque cierra un **techo de escudos** visible (primera fila en
  muro, las demás con el escudo arriba), las jabalinas se clavan en él y el sonido pasa a «dentro». Luego los galos cargan y
  se lucha hasta el 15 %. El testudo viejo queda detrás de `?antiguo=1` para comparar.
- *Archivos*: `bloque/escena.js`, `hud.js`, `tropas.js`, `fisica.js` (guardia del techo, ya esbozada), nuevos
  `bloque/formaciones/{manipulo,testudo}.js` y `bloque/sonido.js` (copia de `a-pie/sonido.js`; el viejo lo reexporta);
  `js/bloque-ia.js` (escenario «cruzar bajo las salvas»: objetivo, dos salvas, carga) y su prueba; `a-pie/index.html`
  (lleva a `bloque/?formacion=testudo`); `js/ui-escaramuza.js` solo si hace falta. **Pase → jueces**: ninguno (el enlace del
  menú sigue siendo `maquetas/a-pie/`).
- *Prueba extra*: una salva en testudo mata mucho menos que sin él (prueba en Node) y la captura enseña el techo cerrado.
- *Riesgo*: que el techo con soldados de Meshy atraviese cabezas; se mide con la física (`ESCUDO_ALTO`) antes de dibujar.

**FU2 · Tú en la fila, en cualquier formación** (≈1,5 M; riesgo medio)
- *Se ve*: con el pellizco bajas al oficial y, además de mandar, **peleas**: mantener y soltar para lanzar el pilum, parar,
  empujar y estocada con los dedos (lo de TP8b/TP9); si caes, sigues como el siguiente de la fila; en testudo, cámara bajo
  el techo. Vale en manípulo y testudo.
- *Archivos*: nuevo `bloque/oficial.js` (reglas del duelo y del pilum tomadas de `a-pie/acciones.js`, sin pantalla dentro),
  `bloque/camara.js`, `dedos.js`, `escena.js`; su prueba en Node. `js/simulador.js` no cambia (sus números de CG6b se copian, no se importan).
- *Riesgo*: gestos del duelo contra el dibujo del frente: arriba se dibuja; abajo, un dedo pelea y dos dedos suben.

**FU3 · La falange, formación del motor** (≈1,6 M; riesgo alto)
- *Se ve*: «Falange a pie» contra manípulos abre la escena única con `?formacion=falange`: mismo control, sarisas bajadas y
  abanico, picas que se parten, soldados de FA2. «Bajar a pie» con una falange también entra aquí.
- *Archivos*: `bloque/formaciones/falange.js` (enchufa `js/falange.js` y su física de picas), `escena.js`, `tropas.js`;
  `falange/index.html` lleva a `bloque/?formacion=falange&rival=…`; `js/ui-mando.js` (`RUTA_FAL` → escena única).
- *Riesgo*: dos reglas de bloque distintas (`bloque.js` y `falange.js`) bajo un mismo control; el enchufe se prueba con
  los bots de FA1 («gira gana, no gira pierde») sin cambiar sus cifras.

**FU4 · Los rivales de la falange en el motor** (≈1,3 M; riesgo medio)
- *Se ve*: elegir jinetes, elefantes, falange u hoplitas en Escaramuzas abre la escena única con su rival dibujado; los
  elefantes se clavan como en FE3 (no botan).
- *Archivos*: `bloque/rivales/` (traslado de `caballeria.js`, `elefante.js`, `rival.js`), `formaciones/falange.js`, `escena.js`.
- *Riesgo*: peso en pantalla (≤30 llamadas de dibujo); se mide con el medidor de TP9a.

**FU5 · Muro de escudos y orden abierto** (≈1,2 M; riesgo bajo)
- *Se ve*: dos habilidades más del mismo bloque: **muro** (la primera fila cierra escudos solapados: aguanta la carga, no
  avanza) y **orden abierto** (los hombres se separan: las salvas matan menos, el choque pesa menos). Se eligen en un
  abanico del estandarte para no pasar de cuatro botones. El paso propio de cada hombre de TP1 llega a `tropas.js`.
- *Archivos*: `js/bloque-ia.js` (mods), `formaciones/manipulo.js`, `fisica.js`, `hud.js`, `tropas.js`; pruebas.
- *Riesgo*: que la pantalla se llene: tope de cuatro botones a 390 px.

**FU6 · Limpieza: un solo motor** (≈1,0 M; riesgo medio)
- *Se ve*: nada nuevo; todo igual de rápido o más. Se borran las escenas viejas, el lanzador viejo y las copias.
- *Archivos*: borrar `maquetas/a-pie/*` y `maquetas/falange/*` (salvo los `index.html` que redirigen y sus capturas de
  juez si aún se usan), `js/fisica-batalla.js` (lanzador viejo) y su prueba. **Pase → común** (`sw.js`): quitar de la caché
  los archivos borrados y añadir los de `bloque/formaciones/`, `bloque/rivales/`, `oficial.js` y `sonido.js`.
  **Pase → vigía**: `gobierno/areas.json` si cambian los propios.
- *Riesgo*: el juego sin conexión (si la caché no se sube, faltan archivos): no se borra nada hasta que el pase de `sw.js` entre.

**Total declarado ≈8,2 M** (con la desviación habitual de las tandas de batalla, 10–11 M). Después, **CG4b** engancha la
campaña al motor unido.

## 5. Historia
Sin novedad de época: testudo (Livio 10.41, Dion 49.30), muro y orden abierto de los vélites (Polibio 6.21–23) y falange
(Polibio 18.29–32) ya tienen dictamen en TP0, LP0 y FA0. Lo que se cambie por jugar (salvas en el testudo, abanico de
habilidades) se marca como licencia de juego en cada etapa.

## 6. Preguntas para el usuario
**Menú de Escaramuzas**: (A) siguen los tres botones (Testudo, Falange, Manípulo), cada uno abre la escena única con su
formación [recomendado]; (B) un solo botón «A pie» y eliges la formación dentro. Por qué: A no cambia lo que ya conoce y deja
probar cada formación de un toque.
**El testudo viejo**: (A) se queda detrás de `?antiguo=1` hasta FU6 para comparar y luego se borra [recomendado]; (B) se borra
ya en FU1. Por qué: A deja ver lado a lado que lo nuevo es mejor antes de tirar lo viejo.
**Muro y orden abierto**: (A) en un abanico al tocar el estandarte, con cuatro botones abajo como hoy [recomendado]; (B) más
botones abajo. Por qué: a 390 px caben cuatro botones con dedo; más se tocan sin querer.
