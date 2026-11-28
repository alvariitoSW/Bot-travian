# Especificación · PL1 Politeia: reglas del año político (Node, sin pantalla)

**Estado**: cerrada
**Sirve a**: OBJETIVOS.md, órgano Cerebro: «gestionar una ciudad con sus intrigas políticas» y el camino de la política (PLAN-2.0 M4, que absorbe Politeia).
**Área**: polis (propuesta; hasta el alta del vigía, solo archivos nuevos)
**Rama**: pl1-politeia-reglas
**Creada**: 28/11/2026

## Qué verá el jugador
Nada todavía: son las reglas. Al acabar, un bot juega en Node un año político entero de Atenas (primavera, verano,
otoño, invierno) contra dos casas rivales que juegan solas, y cada semilla cuenta una crónica distinta. La pantalla llega en PO3/PL3.

## Decisiones del usuario
- **D1** (26/11): «Si lo apruebo» — aprueba `gobierno/estudios/POLITEIA.md` como rumbo y el arranque por la prueba P0.
- **D2** (POLITEIA §1.2, ✔): «Un año, cuatro actos: agenda, intrigas, debate, cuentas. Pocas votaciones, y que pesen.» Tres pasos por estación (§3).
- **D3** (POLITEIA §1.4, ✔): «Nada se repite y todo cuesta: ninguna decisión es gratis; no se castiga torcer la historia, pero cada camino perjudica a alguien.»
- **D4** (POLITEIA §0, criterio 2): «dos partidas de la misma polis cuentan historias distintas».
- **D5** (POLITEIA §5, ✔): «Se puede perder: destierro de diez años y vuelta.» Y «Tus atajos son tus secretos».
- **D6** (POLITEIA §1.3 y §6, ◐ «improvisa y sorpréndeme»): ocho personas con nombre (inventadas y reales); cinco casas: Caballo, Delfín, Carnero, Gallo y la tuya.
- **D7** (encargo del vigía, 28/11, con el «vale» del usuario): «solo reglas en Node, sin pantalla … cinco casas y dos rivales que juegan solos. Un bot termina el año … Las decisiones con ◐ u ○ … elige lo más sencillo y apúntalo como provisional.»

## Criterios de aceptación
Todos se comprueban con `node test/politeia.test.mjs` (líneas «bien»/«MAL», sale con código 1 si hay algún MAL).
- **CA1** (de D2, D7): con 20 semillas, el bot «listo» y el bot «pasivo» terminan el año (o pierden antes) sin error; el año pasa por las cuatro estaciones en orden y cada una da 3 pasos al jugador. · Se comprueba: `node test/politeia.test.mjs`
- **CA2** (de D7, D6): hay 5 casas (4 + la tuya) y 8 personas con nombre; en cada partida 2 de las 4 casas son rivales, y cada rival hace al menos una jugada en cada estación que juega. · Se comprueba: `node test/politeia.test.mjs`
- **CA3** (de D3): toda acción del jugador tiene un coste (`coste` con algo > 0) y al menos una casa sale perjudicada en todo asunto votado; ningún recurso queda negativo y la discordia queda en 0–6. · Se comprueba: `node test/politeia.test.mjs`
- **CA4** (de D4): en 20 semillas de Atenas, al menos 16 crónicas distintas (firma = asuntos del año + rivales + resultado de cada voto); y dos semillas fijas (1 y 2) dan crónicas distintas. · Se comprueba: `node test/politeia.test.mjs`
- **CA5** (de D5): se puede perder: el bot «tramposo» (compra votos siempre que puede) acaba desterrado en al menos 1 de 20 semillas; el destierro queda en `fin.resultado`. · Se comprueba: `node test/politeia.test.mjs`
- **CA6** (arquitectura): misma semilla + mismas jugadas → mismo final; guardar a mitad con `JSON.parse(JSON.stringify(P))` y seguir da el mismo final; el módulo no usa `document`, `window` ni `Math.random`; un año del bot tarda < 200 ms. · Se comprueba: `node test/politeia.test.mjs`

## Fuera de esta tarea
Duelo de preguntas, secretos de las personas y tribunal de verdad (PL2 = PO2). Pantalla y ciudad pintada (PO3 = PL3).
Santuario/puerto completos, vasija e hitos (PO4). Regímenes y cambio de régimen (tanda P1). Enganche con `game.js`, `data.js`, `ui.js`, `sw.js` (PL3).

## Por aclarar
Ninguna para construir. Lo ◐/○ se fija provisional (ver «Provisionales» abajo) y va al parte como pregunta.

## Diseño (lo decide el director; el constructor lo escribe tal cual)
**Archivos**: `js/politeia-datos.js` (casas, personas, asuntos, acciones; con fuente y etiqueta histórica) y
`js/politeia.js` (reglas). Patrón UMD como `js/diplomacia.js` (`module.exports` en Node, `root.POLITEIA` / `root.POLITEIA_DATOS` en el navegador).
Prueba: `test/politeia.test.mjs`. Nada más.

**Estado** (`P`, solo datos JSON): `{ v:1, polis:'atenas', anio:-594, rng:<entero>, estacion:0..3, pasos:3,
casas:{ caballo, delfin, carnero, gallo, tuya }, personas:[8], rivales:[id,id], discordia:0..6, agenda:[…],
debate:[…], ventaja:0, secretos:[…], cargo:null, cronica:[{estacion, quien, texto}], fin:null }`.
Cada casa: `{ id, nombre, emblema, comarca, lema, grieta, influencia (votos), plata, fama, trato (−3..+3, con la tuya), caracter }`.
Azar: generador propio con semilla (mulberry32) guardado en `P.rng`; nunca `Math.random`.

**Variedad al empezar** (de D4): la semilla elige 2 rivales de las 4 casas, su carácter (`ambicioso`, `astuto`, `piadoso`, `rico`),
3 asuntos de la agenda de un fondo de 8, y reparte ±20 % en plata e influencia.

**API**: `nueva({ polis:'atenas', semilla, nombreCasa? })` · `acciones(P)` → `[{ id, nombre, lugar, coste:{plata?,fama?,favor?,pasos:1}, objetivos? }]`
solo las de la estación y pagables · `jugar(P, id, objetivo?)` → `{ ok, texto }` (gasta 1 paso; con 0 pasos juegan los
rivales, se resuelve el acto y pasa la estación) · `pasar(P)` (renuncia a un paso; también cuesta: −1 de trato con la casa de mejor trato, porque no la atiendes — licencia de juego) ·
`resumen(P)` → texto corto del estado · `firma(P)` → cadena para CA4.

**Los cuatro actos** (tres pasos del jugador; luego los dos rivales, 2 jugadas cada uno; luego se resuelve):
1. **Agenda (Consejo, primavera)**: tres asuntos con pista 0–6. Acciones: *hablar* (empuja +1 o −1, cuesta 1 fama), *pedir favor* a una casa con trato ≥ 1
   (+2, le baja el trato 1), *pagar* (+2, cuesta plata 30 y apunta un secreto «compró apoyo en el Consejo»). Rivales empujan según sus intereses.
   Al acabar: los 1–2 asuntos con pista ≥ 4 suben al debate (si ninguno, el más alto); el que más empujó un asunto lo «presenta» (+1 fama).
2. **Intrigas (casa, puerto, santuario, ágora, verano)**: *banquete* a una casa (plata 25 → trato +1; 30 % de sacar un secreto suyo),
   *rumor* contra una casa (fama 1 → su influencia −1; 35 % de que se sepa: discordia +1 y trato −2 con ella; apunta secreto),
   *enviado al puerto* (fama 1 → plata +40 y la casa Delfín trato −1 si es rival), *ofrenda en el santuario* (plata 20 → ventaja +1 en el debate).
   Los rivales usan las mismas acciones contra ti o entre ellos.
3. **Debate (ágora/asamblea, otoño)**: por cada asunto en debate, cada casa vota a favor o en contra según sus intereses (tabla del asunto) y su trato contigo
   si tú lo presentas; pesa su influencia; el pueblo suma 3 piedras a la postura que cuadre con `pueblo` del asunto, ±1 de azar. Acciones: *discurso*
   (fama 1 → ventaja +1 piedra), *convencer* a una casa (plata 20, 50 % + 15 % × trato de cambiar su voto), *comprar piedras* (plata 40 → +3 piedras; apunta secreto).
   Al votar: se aplican los efectos del asunto (plata, fama, discordia, trato); siempre pierde alguna casa (CA3). Si gana el asunto que presentaste: +2 fama.
4. **Cuentas (tribunal, invierno)**: cada secreto tuyo tiene 25 % (+10 % por rival `astuto`) de salir. Por cada uno que sale: multa 40 de plata o, si no la
   puedes pagar, fama −2. Con 3 o más secretos fuera, o fama < 0, **destierro** (`fin.resultado='desterrado'`, diez años). Acciones: *pagar a los jueces*
   (plata 30 → un secreto menos probable, apunta otro), *dar cuentas* (fama 1 → −10 % a cada secreto), *ceder el cargo* (pierde el cargo → sin multa por un secreto).
   Reparto de cargo: la casa (o tú) con más fama recibe el cargo del año. **Ostracismo**: solo se pregunta si discordia ≥ 4 (provisional; régimen aún no existe).
   Fin: `fin = { resultado:'sigue'|'desterrado'|'revuelta', fama, plata, cargo, cronica }`.
**Discordia**: sube con rumores descubiertos, con un asunto que el pueblo pierde y al acabar cada estación si hay un rival `ambicioso`; a 6, **revuelta**: el año acaba en el acto (`resultado='revuelta'`).
**Crónica**: cada jugada (tuya o rival) y cada resolución apunta una frase llana en español; la crónica es lo que diferencia dos partidas.

**Atenas, 594 a.C.** (datos con etiqueta `histórico` / `probable` / `licencia de juego` y fuente):
- Casas (licencia de juego, de POLITEIA §6): Caballo (Llanura, nobles viejos, «La tierra recuerda», maldición — inspirada en la maldición de los
  Alcmeónidas por Cilón, Plutarco, *Solón* 12; Heródoto 5.71), Delfín (Costa, mercaderes, «El mar no pregunta apellidos», debe plata fuera),
  Carnero (Monte, pobres, «Somos más», su jefe no sabe leer y su hija sí), Gallo (hoplitas, «Primero en la fila», juramento de sangre), la tuya.
  Las tres comarcas (llanura, costa, monte) son históricas, aunque de algo después (Heródoto 1.59; Aristóteles, *Const. Aten.* 13).
- Personas (8): Megacles (Caballo; real, alcmeónida — `probable`: el nombre se repite en la familia), Timónax (Caballo, inventado),
  Hipónico (Delfín, inventado), Nausícrates (Delfín, inventado), Lico (Carnero, jefe, inventado), Clito (Carnero, su hija, inventada),
  Aristón (Gallo, inventado), Solón (sin casa: el árbitro; real, arconte en 594/3, Aristóteles *Const. Aten.* 5–12).
- Asuntos (8): perdonar las deudas (seisáchtheia; Arist. *Const. Aten.* 6; Plutarco *Solón* 15), prohibir la esclavitud por deudas (ídem),
  recuperar Salamina de Mégara (Plutarco *Solón* 8–9), solo se exporta aceite (Plutarco *Solón* 24), pozos públicos y agua (Plutarco *Solón* 23),
  clases por cosecha / censo (Arist. *Const. Aten.* 7), apelar al tribunal del pueblo (Arist. *Const. Aten.* 9), ley contra el lujo en los entierros
  (Plutarco *Solón* 21). Cada asunto: `{ id, nombre, pista, pro:[casas], contra:[casas], pueblo:'si'|'no', efectos:{si:{…}, no:{…}}, etiqueta, fuente }`.
  Sin moneda acuñada ni Partenón (POLITEIA §10).

**Provisionales** (◐/○ elegidos por sencillez; van al parte): casas cinco tal cual §6; Consejo con pistas 0–6; régimen fijo (aristocracia de Atenas 594) sin cambios;
ostracismo solo como pregunta; sin herederos; un solo año (sin «otro año»); los rivales no traman a varias estaciones (eso es PL2/P3).

## Plan y presupuesto
| Pieza | Quién | Modelo | M decl. (esperable) |
|---|---|---|---|
| Diseño, spec, parte, cierre | director | opus | 0,35 (0,5) |
| `politeia-datos.js`, `politeia.js`, prueba | constructor | sonnet | 0,6 (0,9) |
| Revisión del diff | revisor | sonnet | 0,15 (0,25) |
| Arreglos (una vuelta) | constructor | sonnet | 0,1 (0,2) |
| **Total** | | opus 0,35 · sonnet 0,85 | **1,2 (tope 2,4)** |

## Tareas
| Tarea | Qué se ve al acabar | Cumple | Tamaño |
|---|---|---|---|
| PL1 | `node test/politeia.test.mjs` en verde con 20 semillas | CA1 CA2 CA3 CA4 CA5 CA6 (D1–D7) | grande |

## Convergencia
**Tope: 2,4 M** · aviso al usuario (vía vigía) al pasar el tope o con 3 vueltas sin subir la nota.
| Vuelta | M gastados | CA cumplidos | Qué falta |
|---|---|---|---|
| 0 | 0,15 | 0/6 | construir |
| 1 | 0,95 | 6/6 | 5 fallos del revisor (coste falso, errores ocultos, historia, fin) |
| 2 | 1,30 | 6/6 | nada |

## Referencias
`gobierno/estudios/POLITEIA.md` (§0, §3, §5, §6, §14) · `gobierno/partes/2026-11-25-GP1-menus.md` · `gobierno/estudios/REF-politeia-arte.md` · `js/diplomacia.js` (patrón UMD).
