# CE6 · Senado de familias · encargo del director (19/11/2026)

Línea L4. Alcance congelado en `CE1-objetivo-cerebro.md` §4. Aquí solo: bandos, escaños, humor, peticiones, votos y la
pantalla mínima. **No** entra: Autoridad ni cargos (CE7), sala viva ni consejeros (CE8), banquete, juegos ni rito (CE9).
Todas las cifras son licencia de juego. Se toca solo el código del Senado (bloque SN1 de `js/game.js`, `D.SENADO`,
`D.BANDOS`, y lo nuevo en `js/data.js`) y la sala en `js/ui.js`. Nada de costes, tiempos, producción, edificios ni tropas.

## 1. Bandos (hasta siete) y tu familia
| id | Bando | Familia | Entra | Trato que ofrece | Rivales |
|---|---|---|---|---|---|
| `ter` | Terratenientes | Fabios | desde el principio | promesa: sin leva en una ciudad | `mer` |
| `mer` | Mercaderes | Emilios | desde el principio | pago en denarios | `ter` |
| `mil` | Militares | Escipiones | desde el principio | promesa: hombres en armas | `pue` |
| `sac` | Sacerdotes | Valerios | suma de niveles de templo ≥ 2 en tus ciudades | pago (ofrenda) | `pro` |
| `ita` | Itálicos | Fulvios | 4 o más ciudades tuyas en Italia | promesa: sin leva en una ciudad itálica | `pro` |
| `pro` | Provinciales | Claudios | tu primera ciudad fuera de Italia | promesa: hombres en armas | `ita`, `sac` |
| `pue` | Pueblo | Sempronios | plebe total de tus ciudades ≥ 1500 | pago (reparto) | `mil` |

- Los ids `ter`, `mer`, `mil` no cambian (guardado y pruebas viejas). Al entrar un bando: aviso en el registro
  («🏛️ Entran en el Senado los Valerios, con los sacerdotes.») y se queda para siempre. Humor inicial = favor del Senado.
- **Tu familia** (la del jugador: «Tu familia») tiene escaños propios, siempre vota sí: `2 + round(3 % del total)`.
  No es un bando: no tiene humor ni pide nada.

## 2. Escaños por población y provincia
- **Total** = `min(300, max(30, round(población de tus ciudades / 20)))`. Mayoría = `floor(total / 2) + 1`.
- **Provincias** (`D.PROVINCIAS`, ciudad → provincia → bando afín):
  Lacio (roma) → `ter`; Campania (capua, neapolis) → `mer`; Etruria (volsinii, perusia, clusium, rusellae) → `sac`;
  Magna Grecia (tarentum) → `ita`; Galia Cisalpina (mediolanum) → `mil`; Sicilia (messana, syracusae, agrigentum,
  panormus, lilybaeum) y Cerdeña (carales) → `pro`; Hispania (emporion, saguntum, carthagonova, tarraco, gades) → `mil`;
  Grecia (ambracia, pella, corinthus) → `mer`; Galia (massalia) → `mer`; África (carthago, hadrumetum) → `mil`.
  Italia = Lacio, Campania, Etruria, Magna Grecia, Galia Cisalpina. Colonias fundadas: a la provincia de la ciudad propia más cercana.
- **Reparto**: quitados los de tu familia, cada bando activo tiene un mínimo de `max(2, round(6 % del total))`. Lo que
  queda se reparte: **60 %** por provincias (cada provincia pesa la población que tienes en ella y da sus escaños a su
  bando afín; si ese bando aún no ha entrado, esa parte va al 40 % siguiente) y **40 %** por los pesos de hoy
  (`pesosBandos`, ampliado: `sac` = niveles de templo × 3; `ita` = ciudades itálicas propias × 2; `pro` = ciudades
  fuera de Italia × 3; `pue` = plebe / 300). Restos mayores: la suma es exacta.

## 3. Humor: tus actos, rivales y peticiones
- `G.senadoActo(tipo, dato)`: un solo punto de entrada, llamado con **una línea** desde donde ya ocurre la cosa
  (obra terminada con su edificio, leva puesta en cola, victoria, ruta nueva, ciudad tomada, ciudadanía, juegos).
  Tabla `D.SENADO.actos`: a quién contenta (+2) cada acto; sus **rivales** pierden la mitad (−1). Ejemplos: granja o
  almacén → `ter`; mercado, puerto o ruta → `mer`; cuartel, herrería, establo, leva o victoria → `mil`; templo → `sac`;
  ciudad tomada fuera de Italia → `pro`, dentro → `ita`; ciudadanía → `ita`; juegos o reparto de grano → `pue`.
- **Peticiones**: al empezar cada estación, cada bando activo pide **una** cosa de su lista (elegida sin azar, por el
  número de turno), con texto corto: `ter` «Sin levas esta estación» / «Una granja»; `mer` «Una ruta o un mercado» /
  «Denarios por encima de N»; `mil` «Una leva» / «Una victoria»; `sac` «Un templo» / «Paz esta estación (sin atacar)»;
  `ita` «Sin levas en Italia» / «Ciudadanía a una ciudad»; `pro` «Una victoria fuera de Italia» / «Guarnición de N»;
  `pue` «Grano sin faltar» / «Juegos en el Foro». Se mide con lo que contó `senadoActo` en la estación. Al pasar la
  estación: cumplida +6, no cumplida −3. Varias chocan entre sí a propósito: **nunca el 100 %**.
- El favor del Senado sigue siendo la media de humores ponderada por escaños (bandos activos; tu familia no cuenta).

## 4. Votos
- `G.votos` recorre los bandos activos más tu familia (todos sí). Postura de cada ley para los bandos nuevos:
  si la ley trae `postura[b]`, esa; si no, `D.SENADO.posturaTipo[tipo][b]` (guerra: `sac` 0, `ita` −1, `pro` +1, `pue` −1;
  paz: +1, +1, −1, +1; leva: 0, −2, 0, −1; obra: +1, 0, 0, +1; ciudadania: −1, +2, +1, −1; ley: según `chips.ple`
  para `pue`, 0 el resto). Las misiones-obra: postura por tipo como hoy, y 0 para los nuevos salvo templo → `sac` +2.
- `G.tratos`: una tarjeta por bando activo, con el trato de la tabla §1. El pago por voto se escala: `max(3,
  round(pagoVoto × 30 / total))`. Todo lo que hoy usa 30 escaños o mayoría 16 pasa a leer el total y la mayoría del momento.

## 5. Guardado
- `s.senado.v` pasa a 2: `bandos` (lista de activos, en orden), `pide` ({bando: {id, texto, turno}}), `actos`
  (contadores de la estación). `G.migrarSala` convierte una v1: añade lo nuevo, humor de los tres de siempre se
  conserva, recalcula escaños y comprueba qué bandos entran. Idempotente. Prueba con `test/partida-vieja.json`.

## 6. Pantalla mínima (solo dentro de la sala de hoy)
- Hemiciclo: un asiento por escaño (filas calculadas según el total), bandos en orden, color de cada uno; tu familia
  en dorado junto a los cónsules. Debajo, leyenda corta.
- Lista «Bandos»: color, **familia** y bando («Fabios · terratenientes»), escaños, barra de humor y «Pide: …». Al pie,
  los que aún no han entrado y qué les falta («Valerios: cuando tengas templos»). En la sala con votación y en la de
  sin votación. Tarjetas de trato con el nombre de la familia. Nada más: el rediseño es CE8, MN1 y MN2.

## 7. Historia (fichas en `js/registro.js`, por id de bando)
- Fabios: Q. Fabio Máximo, *princeps senatus* (Livio 27.11); Plutarco, *Fabio Máximo*. Gran familia patricia de tierras.
- Escipiones: Livio 26–30, Polibio 10.2–20; Escipión en Hispania (210–206) y África (204–202).
- Emilios: L. Emilio Paulo, Pidna (168) y botín de Macedonia (Plutarco, *Emilio Paulo* 28–38).
- Valerios: C. Valerio Flaco, flamen de Júpiter en 209 (Livio 27.8). Familia con cargos sacerdotales.
- Fulvios: de Túsculo, ciudad latina (Cicerón, *Pro Plancio* 20); M. Fulvio Flaco propone la ciudadanía a los itálicos
  en 125 (Apiano, *Guerras civiles* 1.21; fuera del periodo).
- Claudios: los Claudios Marcelos, patronos de Sicilia desde la toma de Siracusa, 212 (Cicerón, *In Verrem* 2.4.89).
- Sempronios: Ti. Sempronio Graco, cónsul en 215 y 213 (Livio 23–25); sus nietos los Gracos, tribunos de la plebe
  en 133 y 123 (Plutarco, *Tiberio Graco*; fuera del periodo).
- Marco: Scullard, *Roman Politics 220–150 B.C.* (1951), grupos de familias; matizado por Gruen y Brunt.
- **Licencia de juego**: bandos como grupos fijos dirigidos por una familia (no había partidos), escaños por población
  y provincia (el Senado no representaba territorios; unos 300 senadores, Livio 23.23), Emilios con los mercaderes
  (ley Claudia, 218), Fulvios con los itálicos y Sempronios con el pueblo (por lo que hicieron después del 146).
