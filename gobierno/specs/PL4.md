# PL4 · Politeia: tribunal, santuario, puerto y la vasija (+ PL3b) · 28/11/2026
Cuarta tarea de la prueba P0 (= «PO4» de `gobierno/estudios/POLITEIA.md` §14). Área «polis». Rama `pl4-politeia`.
Presupuesto: PL3b 0,2 M + PL4 0,8 M = 1,0 M (tope 2,0 M). Director Opus; constructor Sonnet.
Lo ◐/○ de POLITEIA se resuelve aquí con lo sencillo y se marca **provisional**.

## PL3b · Botón fijo «Politeia» (usuario «1A», 28/11)
- En la barra de abajo (`#tabs3`, `buildTabs` en `js/ui.js`), un botón más **«Politeia»** solo si `G.polis()`.
  En partidas romanas no aparece (ni hueco). Toca → lo mismo que `case 'politeia'` (abre `POLITEIA_UI`).
- Se sigue entrando también por la ficha del ágora. Icono: SVG propio en `assets/politeia/` (columna o tejo).
- Que quepan los botones a 390 px sin cortar texto (ajuste mínimo en `css/style.css` solo para ese caso).

## PL4 · Reglas (en `js/politeia.js` y `js/politeia-datos.js`, con etiqueta y fuente)
Estado `P.v = 3`. Campos nuevos con valor por defecto; la pantalla migra un guardado v2 sin romperlo.
**Santuario** (verano, §4: «oráculo que habla a medias; regalos que lo inclinan»):
- `ofrenda` (ya existe): ventaja +1.
- `oraculo` «Consultar el oráculo» (plata 10; una vez al año): con ~50 % el dios nombra a medias la grieta de un rival
  (frase oscura por casa en datos) y pasa a `P.sabidos` (vale como prueba en el debate); si no, una frase sin pista.
- `inclinar` «Hacer un regalo al oráculo» (plata 30): ventaja +2 y **secreto tuyo** «compró al oráculo».
**Puerto** (verano, §4: «enviados, huéspedes; tratos, alianzas, bodas»):
- `enviado` (ya existe): plata +40.
- `huesped` «Acoger a un huésped» (fama 1; una vez al año), objetivos: polis vecinas en datos (p. ej. Corinto, Egina,
  Mégara), cada una con un efecto pequeño y distinto, y algo que perjudica a alguien. Deja `P.huesped`.
- `boda` «Concertar una boda» (plata 30; una vez al año), objetivo: una casa con trato ≥ 0: trato +2 con ella;
  la otra casa con más trato contigo se ofende (−1).
**Tribunal** (invierno): lo de PL2 sigue. Nuevo `testigo` «Llamar a tu huésped como testigo» (si hay juicio y
`P.huesped`; una vez): dos jueces menos inclinados +1.
**Vasija** (API nueva, pura): `escenas(P)` → hasta 8 escenas `{ estacion, quien, texto, tipo }` sacadas de la crónica
(lo tuyo y lo de la ciudad que pesa: votos, juicio, veredicto, fin), sin repetir, al menos una por estación jugada.
**Hitos** (API nueva): `hitos(P)` → asuntos aprobados este año, cada uno con su `hito` de datos
`{ texto, etiqueta, fuente }` (p. ej. deudas: se arrancan las piedras de hipoteca de los campos; pozos: pozo público).
Los rivales pueden usar `ofrenda`/`enviado` como ya hacen; no hace falta que usen lo nuevo.

## PL4 · Pantalla (`js/politeia-ui.js`, `css/politeia.css`, `assets/politeia/`)
- Santuario, Puerto y Tribunal: sus acciones con coste y objetivos en frases llanas («Corinto, la del istmo»…).
  El oráculo muestra su frase en el pergamino con letra de pergamino, entre comillas.
- **Juicio**: el pergamino del Tribunal enseña los cinco jueces (nombre y si te miran bien, regular o mal) y los cargos.
- **Vasija**: botón «Vasija» en la línea de cifras → pergamino con una vasija propia (SVG) y sus escenas en bandas,
  una por escena, con su texto. En el final del año, la vasija del año sale en el pergamino final.
  Provisional: las vasijas de años pasados se guardan en `localStorage['aqvila-politeia-vasijas-v1']` (máx. 10, con
  sus hitos), y se ven en fila pequeña bajo la vasija actual.
- **Hito en la ciudad**: cada hito aprobado (este año y años guardados) aparece **dibujado** en la ciudad, en su sitio
  (SVG propio pequeño: pozo, piedras arrancadas, tablas de leyes…), con una cinta con su nombre. Tocarlo dice el `texto`.
- Arte propio, CC BY-SA 3.0 (`assets/politeia/LICENSE.txt` al día). Peso total de `assets/politeia/` < 200 KB.

## Detalles de SB24 (de paso, solo si triviales)
Mapa de Grecia: «Marchas» tapa parte del título. Imperio: hueco vacío grande entre la lista y «Este año»/«General».
Si es CSS de una o dos líneas, se arregla; si no, va como pase al Músculo en el parte.

## Común «de paso»
`sw.js`: archivos nuevos a `FILES` y caché v179 → **v180**. `js/novedades.js`: entrada v180, ≤ 6 frases sencillas.

## Criterios de aceptación
CA1 Partida de polis: botón «Politeia» en la barra abre Politeia; partida romana: no está. CA2 Santuario: ofrenda,
oráculo y regalo se juegan; el oráculo dice su frase. CA3 Puerto: enviado, huésped y boda se juegan con objetivo.
CA4 Tribunal: el juicio enseña jueces y cargos; el testigo funciona con huésped. CA5 La vasija se abre y enseña las
escenas; sale en el final del año. CA6 Un asunto aprobado aparece dibujado en la ciudad. CA7 Un guardado v2 carga.
CA8 `node test/politeia.test.mjs` 0 MAL (con pruebas nuevas de oráculo, huésped, boda, testigo, escenas, hitos) y
`node test/politeia-ui.test.mjs` en verde (con PL3b y PL4). CA9 Sin errores de consola. Sin Partenón, sin moneda, sin «Senado».
Capturas: `gobierno/capturas-tarea/PL4-*.jpg` (390×844). Ficha de aspecto: `gobierno/aspecto/pl4-politeia.md`.
