# FA4 · Diseño de la escena nueva de la falange (23/11/2026)

Sirve a L17. Ola 2 del plan `FA0-plan-falange.md`. Diseña el director; construye Opus. Media página.

## Qué cambia por dentro
- `acciones.js` deja de tener reglas. Es un **adaptador** fino: crea `crearFalange({ semilla, rival, avisa, H, locomocion, zancadas })`
  de `js/falange.js`, elige rival por `?rival=` (`manipulos` por defecto; los demás con `rivalDe()` de `js/falange-rivales.js`) y
  semilla por `?semilla=`. Añade a cada hombre solo lo que es de dibujo (vaivén del asta, abanico, gesto de estocada).
  Se borra la copia: `unidad.js`, las reglas de `enemigo.js` y las constantes repetidas de `formacion.js` (se reexportan del motor).
- `dedos.js`: solo `crearPuente`. Tocar → `toque()`; deslizar → `estocada()`; arrastrar → `gira(±1)` y al soltar `gira(0)`;
  raya → `fila(i, abajo)`; estandarte → `orden(n)`.
- La escena **no decide nada**: pinta `S.fal`, `S.ene`, `S.proyectiles`, `S.flanco`, `S.terreno` donde el motor dice.

## Qué se ve
1. **Muro, picas y cámara giran juntos.** Cada hombre va en su `x, z, yaw` del motor. La sarisa se calcula en el marco del
   hombre y se gira con él (carriles incluidos). La cámara va detrás de ti sobre el eje del muro: posición = tú − frente·d +
   derecha·0,6; mira con `yaw = −S.giro`, con 0,3 s de retraso (el giro pesa, no marea). La luz de sombras sigue al pivote.
2. **El flanco llega andando.** Los hombres de `S.flanco.hombres` son de `S.ene`: se pintan como los demás, con su paso.
   Mientras `estado === 'viene'`, la cámara se asoma 14° hacia ese lado y abre 6° el campo: los ves venir sin cartel.
   Al girar tú, la cámara vuelve sola al eje. El borde rojo de FA3 sigue; con el aviso `finta` cambia de lado.
3. **Abanico escalonado.** Las filas alzadas ya no van todas igual: la primera fila alzada por detrás de las bajadas se
   inclina 34° hacia delante y cada fila de más, 6° menos, hasta 8° (Polibio 18.30: las de atrás, inclinadas sobre los
   hombros de delante). Las bajadas, cada una en su carril de altura. Cada fila baja o sube sola (`S.filas[i]`, `h.kB`).
4. **Caídos que se quedan.** Quien cae queda donde cayó (posición del motor en ese instante, guardada al aviso `cae`), con
   giro al azar y su arma en el suelo. No se recolocan ni se borran. Tope: los que quepan en las instancias de hoy.
5. **Tu estocada se ve.** Al aviso `estocada`: tu asta sale 0,9 m en 0,12 s y vuelve en 0,35 s, el oficial se vence hacia
   delante, polvo en la punta, y si acierta, el blanco cae. El aro marca a `S.yo.blanco`. La cámara da un empujón de 15 cm.
6. **Terreno roto**: una mancha de piedra y matas donde `S.terreno` (en `campo.js`), para saber qué pisas.
7. **Hueco del rival.** Se usa el contrato que avisó FA7 (cambia lo que decía el primer borrador): si `S.rival` no es
   `manipulos` y existe `rival.js` en la maqueta, la escena lo importa y llama `montaRivalDe(S.rival, { escena, estado: () => S, H })`,
   que devuelve `{ paso(dt), aviso(tipo, datos), quita(), peso() }`. Con él, la escena no pinta `S.ene` (lo pinta el rival).
   Sin él, todo `S.ene` se pinta con el muñeco de hoy (el hastati; jinete a escala 1,25 y elefante a 2,4, de reserva).

## Cómo se mide (guion `captura-fa4.mjs`, pocas pruebas y cortas; la partida se salta sin dibujar)
| Vara | Cómo |
|---|---|
| Giro | arrastrar 5 s por el puente → `S.giro` 40° ± 2; cada hombre a < 0,3 m de `S.motor.puesto(f, r)`; cámara a ± 4° de `−S.giro`; el asta de primera fila apunta al frente (coseno > 0,95) |
| Hecho de la tarea | bot por el puente que gira al aviso: al menos un `flancoParado` y gana la falange; el que no gira pierde por flanco |
| Flanco a pie | con el flanco viniendo, sus hombres se mueven entre dos instantes y al menos uno cae dentro de la pantalla |
| Abanico | inclinación media por fila alzada, decreciente de delante atrás; `astasMin` ≥ grosor con 0, 3 y 5 filas bajadas, a 0° y a 40° |
| Caídos | un caído no se mueve en 10 s |
| Estocada | la punta de tu asta avanza ≥ 0,6 m a los 0,12 s |
| Peso | ≤ 30 llamadas de dibujo y ≤ 750 mil triángulos (`renderer.info`) en el choque |
| Limpieza | sin errores de consola; `grep` sin reglas en `acciones.js` (ni `crearUnidad` ni tiradas) |

## Guion de fotos (`gobierno/capturas-tarea/FA4-*.jpg`)
`h-marcha` (abanico, todo alzado) · `h-filas` (tres bajadas, dos alzadas) · `h-flanco-viene` (sin girar: entran por el borde) ·
`h-giro` (muro girado ≈ 50°, flanco contra las puntas) · `h-alto-giro` (vista alta: se ve el muro entero girado y el flanco) ·
`h-estocada` · `h-caidos` (tras 40 s de lucha) · `v-choque` y `v-giro` (390×844). Horizontales a 844×390.

## Historia
Giro del muro por conversión, flanco débil y astas inclinadas de las filas de atrás: histórico (Asclepiódoto 10; Polibio
18.29–32). Cámara, aro del blanco y medidas del abanico: licencia de juego. Sin contenido de época nuevo.
