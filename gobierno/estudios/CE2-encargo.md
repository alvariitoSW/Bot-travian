# CE2 · Recursos nuevos — encargo del director (18/11/2026)

Vara: `estudios/CE1-objetivo-cerebro.md` §5 y §6. Solo CE2: nada de cinco niveles, paga nueva, estaciones, precios
por ciudad, «Este año» ni tributo (CE3 a CE5).

## Reglas (decididas por el director dentro de CE1 §5)
1. **Recursos guardados**: `D.RES = ['grano', 'denarios', 'materiales', 'hierro']`. Las claves viejas desaparecen de la
   lógica: `oro` → `denarios`; `madera` y `piedra` → `materiales` (se suman). Iconos: 🌾 grano, 🪙 denarios,
   🧱 materiales, ⚒️ hierro, 👥 hombres.
2. **Hombres**: no se guardan. `G.hombres()` = suma de `G.recruits(c)` de tus ciudades. Se ven en la barra. Cada recluta
   sale de ahí (como hoy); al licenciar vuelven a la población (como hoy).
3. **Materiales**: aserradero y cantera producen los dos `materiales` (mismos edificios, nombre y texto «Da materiales:
   madera / piedra»). Aldeas de leñadores y canteros, igual.
4. **Hierro**: solo hay vetas en las ciudades de **Etruria** (facción de origen etrusca: Volsinii, Perusia, Clusium,
   Rusellae…) y de **Hispania** (región Hispania). Lista explícita en `data.js` (`D.VETAS_HIERRO`). La mina solo se
   construye o sube allí; fuera, el botón dice por qué. Minas que ya existan fuera (partidas viejas): siguen, al
   25 % («vetas pobres»). El hierro sirve para reclutar (armas) y la forja; los edificios ya no lo piden.
   Fuera de las vetas, el hierro se compra en el mercado con denarios.
5. **Bienes por región**: el `esp` de cada ciudad (vino, sal, plata, púrpura, mármol…) ya existe y su acceso sigue
   igual. Ahora además **se guarda**: cada ciudad tuya con bien produce unas unidades al mes en `s.bienes[esp]`, con
   tope propio. Los ciudadanos ricos (`ciu`) consumen bienes de lujo (`D.LUJO`) al mes; si no hay, su necesidad de
   lujo no se cumple. Se venden en el mercado por denarios a un precio fijo por bien (precios propios llegan en CE4).
6. **Costes**: traducción mecánica y documentada (`D.costeNuevo(viejo)` o equivalente, que sirve también para los
   costes de `js/ciudad.js`, que NO se toca):
   - Edificios, obras, aldeas, piezas de ciudad, muralla, grandes obras: `materiales = madera + piedra + hierro`,
     `denarios = oro + grano × 0,5`, sin grano ni hierro.
   - Tropas: `hierro` (el de hoy), `denarios = oro + madera × 0,5`, `grano` (el de hoy) — luego se ajusta con el bot.
   - Forja y saberes: `hierro` si lo pedía, `materiales = madera + piedra`, `denarios = oro`.
   Ajustar después con el bot. Todo número es licencia de juego y lleva comentario.
7. **Nada se quema en silencio**: el almacén lleno avisa (ya existe para los viejos); cubre los cuatro recursos y los
   bienes. Salida simple: «Vender lo que sobra» en el mercado, barato (sin precios nuevos).
8. **Migración** en `G.load` (`aqvila-save-v1`, `G.migrarRecursos`): para `s.res`, `s.alm`, `s.cuarto`, costes ya
   pagados de obras y reclutas en curso (`pagado`, etc.), rutas, saberes, cualquier objeto con claves viejas.
   Idempotente. Prueba con `test/partida-vieja.json` y un guardado de hoy.

## Medida (juez de CE2)
Un guion del bot (`test/economia.js`, en el repositorio) que mida, en partida corta y campaña larga, agresiva y pasiva:
% de cada recurso perdido por el tope en toda la partida, y % de estaciones (3 meses) en que **falta al menos uno**
(una obra o recluta que el bot quiso y no pudo pagar, o grano en negativo). Se pasa **antes** de tocar nada (cifras
«antes») y después. Criterio CE1: ningún recurso pierde más del 10 %; en 7 de cada 10 estaciones falta alguno; el bot
sigue ganando la campaña.
