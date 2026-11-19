# CE3 · Edificios, tropas y tiempos nuevos — encargo del director (19/11/2026)

Vara: `estudios/CE1-objetivo-cerebro.md` §5 (alcance congelado). Solo CE3: nada de precios por ciudad, rutas nuevas,
«Este año» ni tributo (CE4, CE5). El reloj interno sigue en **meses** (`s.t`); lo nuevo es que las duraciones son
**estaciones enteras** (`D.TURNO_MESES = 3`, una estación = un turno) y la pantalla habla en estaciones.
Todo número nuevo es **licencia de juego** y lleva comentario. No se toca `js/ciudad.js` (de CI1): la traducción va en
`js/game.js` y `js/data.js`.

## 1. Tiempos (pieza A1)
- `D.ESTACION = 3` (meses). Helper `G.estaciones(meses)` = estaciones enteras hacia arriba, mínimo 1.
- **Obras** (edificios, piezas de ciudad, aldeas/pueblos, muralla, forja): duran **1 estación** si suben a nivel 1–2 y
  **2 estaciones** si suben a nivel 3–5 (`D.OBRA_ESTACIONES = [0, 1, 1, 2, 2, 2]`, índice = nivel de destino).
  Las grandes obras de `ciudad.js` sin nivel: su tiempo de hoy redondeado a estaciones, con tope de 2.
  Los bonos que hoy acortan obras (foro −4 %/nivel, `bonoMul('obra')`, tipo de colonia) ya no cambian el tiempo:
  pasan a **abaratar** la obra en la misma proporción (mismo efecto, sin romper las estaciones enteras).
- **Reclutas**: cada lote tarda **1 estación**, sea del tamaño que sea (el límite son los hombres libres). Los lotes ya no
  se encadenan: van en paralelo, hasta 5 por ciudad. Los bonos de instrucción (`instr`) abaratan el lote en vez de acortarlo.
- **Estudios** (saberes, edades) y **forja**: su duración se muestra y se cuenta en estaciones (redondeo hacia arriba).
- **Marchas**: llegan siempre al cierre de una estación (lo que hoy hace `llegada()` en modo turnos, en los dos modos);
  la duración se dice en estaciones.
- Plazos (Q4): una obra o lote de N estaciones se paga en `3N` cuotas mensuales como hoy (no cambia la caja del mes).
- Lo que hoy se lee «meses» en colas y fichas de la ciudad y del mapa pasa a «estaciones» (pieza B).

## 2. Edificios (pieza A2)
- `D.MAX_LVL = 5`. **Ningún edificio sube por encima del nivel del Foro** (el Foro, derivado de las casas, también
  topado en 5). `G.upgrade` lo niega con el motivo «Sube antes el Foro» (`G.ultimoMotivo`). Lo que una partida vieja
  ya tenga por encima del Foro se conserva (no se derriba), pero no sube.
- **Coste de subir al nivel L** = coste base × L (`D.NIVEL_COSTE = [0, 1, 2, 3, 4, 5]`), en materiales y denarios.
  Sustituye ×1,5 por nivel. Mismo coste para piezas de ciudad con `bid`: el coste lo pone `G.cost(b, L)`, no `ciudad.js`.
- **Producción al ritmo de lo que cuesta**: lo que añade cada nivel es proporcional a lo que costó ese nivel, así que
  la producción total va como 1, 3, 6, 10, 15 (`D.NIVEL_PROD = [0, 1, 3, 6, 10, 15]`): `G.rate(L) = D.PROD_NIVEL1 ×
  NIVEL_PROD[L]`. Ajusta `PROD_NIVEL1` para que **un nivel se pague con unas 8 estaciones (2 años) de lo que produce**
  (dilo en el comentario con la cuenta). Los no productivos (cuartel, templo…) solo siguen la regla de coste.
- **Piezas de ciudad** (`ciudad.js`, mejora 0..3): en `game.js` cada pieza vale `D.NIVEL_PIEZA = [1, 2, 3, 4]` niveles
  según su mejora (en vez de `CI.NIVEL_MEJORA` = 1, 3, 6, 10). `c.b[b] = min(5, Σ niveles de sus piezas + heredado)`.
  Si la pieza ya está en mejora 3, «Mejorar» coloca otra pieza del mismo tipo (en el mejor sitio). Producción de una
  pieza: `G.rate(nivel de la pieza)`.
- `D.HUECOS_OBRA` pasa a índice 1..5.
- **Guardado** (`G.migrarNiveles`, llamado en `G.load`, idempotente con `s.niveles5 = true`): todo nivel viejo L (1..10)
  pasa a `ceil(L / 2)` en `c.b` y `c.heredado` de todas las ciudades (tuyas y ajenas), `foroMin`, pueblos y forja
  (`FORJA_MAX` sigue en 5: no cambia). Obras en curso: se conserva lo pagado y su fin se acorta a como mucho 2 estaciones
  desde ahora. Prueba en `test/sim.test.js` con `test/partida-vieja.json` y una partida de hoy: carga, migra una vez,
  juega 3 años sin errores.

## 3. Tropas (pieza A3)
- **Reclutar cuesta hombres, hierro y denarios**: el grano sale del coste de las tropas (`denarios += round(grano × 0,5)`).
  Los hombres salen de la población (como hoy).
- **Paga por estación**: cada tropa tiene `paga: { grano, denarios }` por hombre y estación en `D.UNITS` (las que hoy
  tienen `up`). Para no mover el equilibrio: `grano = up × 3`, `denarios = up × 3 × D.MANT_TROPA` (lo de hoy, explícito).
  Se cobra como hoy, un tercio en cada cierre de mes; la pantalla la dice **por estación**. Sin paga, la deuda y la
  deserción de I3b siguen igual.
- Lotes en curso de partidas viejas: lo pagado en grano se queda pagado; las cuotas que faltan se recalculan sin grano.
- Fichas de historia (`js/registro.js`, skill `historia`): la estación como unidad de tiempo, los cinco niveles y el tope
  del Foro (licencia de juego), el *stipendium* (paga, Polibio 6.39) y el coste en hierro de las armas.

## 4. Pantalla (pieza B; `js/ui.js`, `css/style.css`)
Ficha de edificio con sus **cinco niveles** (el actual marcado, el tope del Foro visible, coste del siguiente en 🧱 y 🪙,
cuántas estaciones tarda); cola de obras y de reclutas «… estaciones»; reclutar dice 👥 hombres, ⚒️ hierro, 🪙 denarios
y la paga por estación; hoja de cuentas con la paga de las tropas por estación. Mismo aspecto que ya hay.

## Medida
Bot: cifras «antes» = las «después» de CE2 (`estudios/CE2-cifras.md`); **una** pasada «después» de `test/economia.js`
la lanza el director. Ningún constructor lanza el bot ni `test/economia.js`.
