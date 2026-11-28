# Especificación · PL2 Politeia: secretos, duelo de preguntas, piedras y tribunal (Node)

**Estado**: aprobada (encargo del vigía, 28/11; rumbo aprobado por el usuario el 26/11)
**Sirve a**: POLITEIA §0 (objetivo final) · prueba P0, fila PO2 de §14
**Área**: polis
**Rama**: pl2-politeia-debate
**Creada**: 28/11/2026

## Qué verá el jugador
Nada en pantalla todavía. En Node, el otoño ya no es una cuenta: subes a un orador de tu casa, haces dos preguntas que
salen de lo que sabes, el rival miente, calla o dice la verdad, y luego te pregunta él a ti. Caen las piedras una a una.
En invierno, si te sacan un atajo, vas a un tribunal de jueces sorteados y te defiendes negando, pagando o contraatacando.

## Decisiones del usuario
- **D1** (26/11, POLITEIA §5 ✔): «Tus atajos son tus secretos: lo que compras o rompes queda apuntado y te lo pueden sacar en el debate o en el tribunal.»
- **D2** (26/11, §5 ✔): «El debate: duelo de preguntas (lo original) con "hablan los tuyos" como función: eliges quién sube; haces dos preguntas que salen de lo que sabes; él miente, calla o dice la verdad, y todo le cuesta; luego pregunta él; al final caen las piedras.»
- **D3** (26/11, §4 ◐, provisional): Tribunal: «Jueces por sorteo; te acusan solo de lo que hiciste; negar, pagar, contraatacar.» Salida: «salir limpio, o multa, cargo perdido o destierro».
- **D4** (26/11, §1 ✔): «Nada se repite y todo cuesta.» · §0: «dos partidas de la misma polis cuentan historias distintas».
- **D5** (vigía, 28/11): «El bot gana y pierde debates según juegue»; varias semillas, bots listo, pasivo y tramposo.

## Diseño (provisional donde dice ◐)
**Secretos** (D1). Cada secreto es `{ id, t, de, p, sabe:[casas], fuera:false }`: `de` = 'tuya' o una casa rival.
- Tus atajos (pagar, rumor, comprar, pagar_jueces) apuntan un secreto tuyo. Cada rival que juega en esa estación tiene
  una probabilidad de **enterarse** (entra en `sabe`); el astuto, más.
- Los rivales también hacen atajos (reparte plata, compra piedras, rumor, paga jueces) y apuntan secretos suyos.
  Tú te enteras con banquete (ya existe, ahora puede darte un secreto real del invitado) y con una acción nueva de verano,
  **espiar** (ágora, plata 15) ◐. `P.sabidos` pasa a guardar referencias a secretos (o grietas de casa, que siguen valiendo).
- Migración: PL1 no se guardó nunca en partida; basta `v: 2` en `nueva`.

**Duelo de preguntas** (D2), en otoño. Los tres pasos de otoño siguen siendo preparación (discurso, convencer, comprar y,
nuevo, **subir orador**: eliges a una persona de tu casa ◐; sin orador habla el jefe, con −1). Al cerrar el otoño, por
cada asunto del debate se abre `P.duelo` y el año **espera al jugador**:
1. Tú preguntas dos veces (`preguntar`, objetivo = un secreto o grieta que sabes del rival que se opone, o «al aire» sin prueba).
2. El rival responde según su carácter ◐: **verdad** (pierde fama 1, el secreto sale, tú +2 piedras), **callar** (−1 piedra
   suya, nada sale), **mentir** (si tú tenías prueba —el secreto está en `sabidos`— le pillan: −3 piedras y fama −2; si no, +1 para él).
3. Pregunta él (una o dos veces, de los secretos tuyos que `sabe`; si no sabe ninguno, pregunta «al aire»). Tú respondes
   con `verdad`, `callar` o `mentir`, mismas reglas al revés. `pasar` durante el duelo = callar.
4. **Caen las piedras**: cada casa echa su peso (influencia + extra + ventaja) a sí o no, más el pueblo, más lo que movió
   el duelo. `P.votos` guarda el detalle `{ piedras: { si, no }, duelo: [...] }`. Un secreto que sale en el duelo queda
   `fuera: true` y pesa en el tribunal.
`acciones(P)` durante el duelo devuelve solo las jugadas del duelo; `P.duelo` es JSON. La API no cambia de nombre.

**Tribunal mínimo** (D3), en invierno. Al empezar el invierno, cada rival que sabe un secreto tuyo puede **acusarte**
(el astuto casi siempre; solo de secretos tuyos reales: «te acusan solo de lo que hiciste»). Los secretos `fuera` se
acusan solos. Si hay acusación, `P.juicio = { acusador, cargos:[ids], jueces:[5 sorteados ◐ con inclinación −1..+1] }`.
Tus pasos de invierno: `negar` (sin coste; funciona mejor si el cargo no salió en el duelo), `pagar_jueces` (plata 30,
compra un juez, pero apunta secreto nuevo), `contraatacar` (con un secreto que sabes del acusador: jueces −1 contra él),
`dar_cuentas` y `ceder_cargo` siguen. Al cerrar el invierno votan los jueces: absuelto (limpio), o multa, o cargo
perdido, o **destierro** si pierdes por 4–1 o peor, o si ya iban 3 cargos ◐. Sin acusación, no hay juicio.

## Criterios de aceptación
- **CA1** (de D1): cada atajo tuyo apunta un secreto con quién lo sabe; un rival solo te acusa o te pregunta con secretos tuyos reales que sabe · Se comprueba: `node test/politeia.test.mjs` (comprobación sobre 20 semillas y los 3 bots).
- **CA2** (de D2): en otoño el año espera al jugador en un duelo: dos preguntas tuyas, respuestas del rival de los tres tipos (verdad, callar, mentir) vistas en 20 semillas, preguntas del rival y tus tres respuestas posibles; luego piedras con detalle · Se comprueba: `node test/politeia.test.mjs`.
- **CA3** (de D2, D4): cada respuesta cuesta algo (fama, piedras o un secreto fuera); mentir con prueba en contra sale caro · Se comprueba: `node test/politeia.test.mjs`.
- **CA4** (de D3): en invierno, con acusación hay jueces sorteados y las tres defensas; sin secretos no hay juicio; el veredicto da limpio, multa, cargo perdido o destierro, y en 20 semillas salen al menos tres de esos cuatro · Se comprueba: `node test/politeia.test.mjs`.
- **CA5** (de D5): en 20 semillas, el bot listo gana más debates que el pasivo y es desterrado menos que el tramposo; el tramposo gana algún debate y pierde algún juicio; ninguno gana o pierde siempre · Se comprueba: `node test/politeia.test.mjs` (imprime el reparto).
- **CA6** (de D4): dos partidas de la misma polis cuentan historias distintas: 20 de 20 semillas con crónica distinta, y en una misma semilla, listo y tramposo dejan crónicas distintas · Se comprueba: `node test/politeia.test.mjs`.
- **CA7** (de D4): siguen en verde los 22 de PL1 (ajustados solo donde PL2 cambia la regla), sin `Math.random`, `P` guardable con JSON a mitad de duelo y de juicio, y la prueba entera en menos de 10 s · Se comprueba: `node test/politeia.test.mjs` y `node gobierno/jueces.mjs --rapido` APTO.

## Fuera de esta tarea
Pantalla (PL3). Tramas a varias estaciones (P3). Régimen y ostracismo de verdad (§8). Herederos. Juzgar a los rivales.

## Por aclarar
Nada que pare la obra: lo ◐ se elige sencillo y va como pregunta al parte.

## Plan y presupuesto
| Pieza | Quién | Modelo | M decl. (esperable) |
|---|---|---|---|
| Reglas + prueba | constructor | sonnet | 0,65 (1,0) |
| Revisión del diff | revisor | sonnet | 0,15 (0,25) |
| Dirección, spec, parte | director | opus | 0,40 (0,6) |
| **Total** | | | **1,2** (tope 2,4) |

## Tareas
| Tarea | Qué se ve al acabar | Cumple | Tamaño |
|---|---|---|---|
| PL2 | (Reglas en Node.) Secretos, duelo, piedras, tribunal; el bot gana y pierde | CA1, CA2, CA3, CA4, CA5, CA6, CA7 (D1, D2, D3, D4, D5) | grande |

## Convergencia
Tope: 2,4 M (presupuesto × 2); si se va a pasar, se para y se avisa al vigía.
| Vuelta | M gastados | CA cumplidos | Qué falta |
|---|---|---|---|
