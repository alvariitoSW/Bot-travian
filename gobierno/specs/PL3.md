# PL3 · Politeia: la ciudad de pie con arte de relleno · 28/11/2026
Tercera tarea de la prueba P0 (= «PO3» de `gobierno/estudios/POLITEIA.md` §14). Área «polis». Rama `pl3-politeia-ciudad`.
Presupuesto 1,3 M (tope 2,6 M). Director Opus; constructor y verificador Sonnet.

## Qué se ve al acabar
Una sola pantalla viva, de pie (390×844), sin menús: la ciudad griega pintada en vertical, que se desliza con el dedo.
Encima, medallones de lugar. Al tocar uno, la ciudad se acerca a ese punto y sube un pergamino corto con lo que se
puede hacer allí. Abajo, siempre, el botón **Pasar**. Se juega un año entero hasta su final.

## Reglas: solo la API
`POLITEIA.nueva({polis, semilla})`, `acciones(P)`, `jugar(P, id, obj)`, `pasar(P)`, `resumen(P)`. Datos en
`POLITEIA.DATOS`. No se toca `js/politeia.js` ni `js/politeia-datos.js` (si falta algo, va como pregunta al parte).
Cada acción trae `lugar` ('Consejo', 'casa', 'ágora', 'asamblea', 'tribunal', 'santuario', 'puerto'), `coste` y,
si hace falta, `objetivos` (claves: `'asunto:+'`/`'asunto:-'`, `'casa>asunto'`, id de casa, id de persona,
`'aire'`, `'grieta'`, `'sec:…'`). La pantalla los traduce a frases llanas (nombre del asunto, «la casa del Delfín»…).

## Archivos (nuevos, propios)
- `js/politeia-ui.js` — IIFE, sin módulos; `window.POLITEIA_UI = { abrir(op), cerrar() }`. `abrir({polis, semilla, alSalir})`.
- `css/politeia.css` — todo con prefijo `.pt-`; nada global.
- `assets/politeia/*.svg` — arte de relleno **propio** (SVG a mano: cielo, mar, acrópolis sin Partenón, casas de adobe
  y teja, pórticos de madera y piedra; 594 a.C.). Ciudad vertical (≈390×1500) y una viñeta pequeña por lugar.
  `assets/politeia/LICENSE.txt`: obra propia de AQVILA, CC BY-SA 3.0 como el resto del arte. Nada de las pinturas de
  referencia. Peso total < 200 KB.
- `test/politeia-ui.test.mjs` — prueba de navegador (Playwright, 390×844, servidor propio). Con `--capturas`, deja PNG en
  `gobierno/capturas/pl3/`.

## La pantalla
1. **Línea de cifras** arriba: Atenas 594 a.C. · estación · pasos · plata · fama · discordia (0–6, como 6 marcas). Y
   «Salir» (llama a `alSalir` o cierra).
2. **La ciudad** (centro): SVG alto que se desliza en vertical. Vive: nubes que cruzan, humo, brillo del agua, dos o
   tres figuras que andan (CSS, ligero). Siete **medallones** redondos con emblema y nombre: Consejo, Tu casa, Ágora,
   Asamblea, Tribunal, Santuario, Puerto. El que tiene acciones en esta estación **late**; los demás, apagados pero
   tocables. Al abrir, si la estación es Primavera, la vista arranca en el Consejo; Verano, en Tu casa; etc.
3. **Tocar un lugar**: la capa de la ciudad se escala (≈1,6×) hacia ese punto con transición, y sube el **pergamino**
   (máx. 55 % del alto): título, una línea de «qué se hace aquí», la viñeta del lugar y sus acciones con su coste
   (plata, fama, pasos). Si la acción pide objetivo, segundo paso: lista de objetivos en frases llanas. Tras jugar,
   el texto que devuelve `jugar` aparece en el pergamino. «Cerrar» devuelve la cámara. Sin acciones: «Aquí no hay nada
   que hacer en esta estación».
4. **Pasar** siempre visible abajo (salvo en el final del año), a toda la anchura, con el nombre de la estación. Llama a
   `pasar(P)`. Muestra su texto en una cinta breve (≈3 s).
5. **El debate** (momento grande): mientras `P.duelo` exista, el pergamino del lugar «asamblea» se abre solo, más
   alto, con el asunto, las piedras de cada lado (`P.duelo.mov`), lo dicho hasta ahora (`P.duelo.log`, en frases) y las
   acciones (preguntar con sus objetivos; o verdad/callar/mentir con la pregunta pendiente). Pasar sigue visible.
6. **Juicio** (invierno con `P.juicio`): el pergamino del Tribunal se abre solo, con acusador, cargos y jueces.
7. **Final del año** (`P.fin` o tras invierno): pergamino grande «Fin del año»: resultado en una frase, lo votado
   (`P.votos`), el veredicto y la crónica (últimas 10 de `P.cronica`). Botones «Otro año» (nueva semilla) y «Salir».
8. **Guardado**: `localStorage['aqvila-politeia-v1']` = P (try/catch; si falla, se juega igual). Al abrir se continúa.

## Enganche con el juego (común, «de paso», mínimo)
- `index.html`: `<link rel="stylesheet" href="css/politeia.css">` y tres `<script>`: `politeia-datos.js`,
  `politeia.js`, `politeia-ui.js` (en ese orden, antes de `js/novedades.js`).
- `js/ui.js`: en la ficha del ágora (donde dice «El ágora sube solo con las casas…», ≈ línea 1122), si `G.polis()`, un
  botón «🏛️ La política de la polis» (`data-act="politeia"`), y su `case` en el switch de acciones: abre
  `POLITEIA_UI.abrir({ polis: POLITEIA.DATOS.polis[G.polis()] ? G.polis() : 'atenas' })`. Provisional: solo hay Atenas.
- `sw.js`: los archivos nuevos a `FILES` y la caché de v178 a v179. `js/novedades.js`: entrada v179 con 1–3 frases.

## Criterios de aceptación
CA1 Abre la pantalla de pie sin errores de consola. CA2 Se desliza en vertical y los siete medallones se tocan.
CA3 Consejo, Tu casa y Ágora: se juega al menos una acción en cada uno desde el pergamino. CA4 «Pasar» visible en
todas las estaciones y en el debate; con solo «Pasar» se llega al final del año. CA5 El debate y el final del año se
ven en su pergamino. CA6 Se entra desde una partida de polis (ficha del ágora). CA7 Prueba de navegador en verde y
`node test/politeia.test.mjs` sigue en 0 MAL. CA8 Arte propio con su LICENSE; sin Partenón, sin moneda, sin «Senado».
