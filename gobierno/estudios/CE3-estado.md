# CE3 · Estado al parar (19/11/2026, 4,51 M)

Parada al pasar el techo de 4,0 M sin jueces APTO. Nada publicado. Commits locales en la rama de trabajo:
`e431681` (A2 + A1), `065c3eb` (ajuste del bot) y el de este archivo. Reglas: `estudios/CE3-encargo.md`.

## Hecho
- **Cinco niveles** (`js/data.js`, `js/game.js`): `D.MAX_LVL = 5`; ningún edificio sube por encima del Foro («Sube antes
  el Foro»); coste de subir a L = base × L; producción `G.rate(L) = PROD_NIVEL1 (14) × [1, 3, 6, 10, 15][L]`; piezas de
  ciudad valen `D.NIVEL_PIEZA = [1, 2, 3, 4]` (se deja de usar `CI.NIVEL_MEJORA` en game.js); `HUECOS_OBRA` 1..5;
  `D.ESP_NIVEL` 6 → 3; Foro cada 15 casas (`D.FORO_CASAS` 25 → 15); príncipes piden cuartel 2 y triarios 3.
- **Guardado**: `G.migrarNiveles` (niveles ceil(L/2), obras ≤ 2 estaciones) y `G.migrarEstaciones` (lotes ≤ 1
  estación), idempotentes, con prueba en `test/sim.test.js` (partida vieja y de hoy).
- **Tiempos en estaciones**: obras 1 estación (niveles 1–2) o 2 (3–5), también aldeas, forja y muralla; lotes de
  recluta 1 estación, en paralelo; estudios en estaciones enteras; marchas llegan al cierre de estación en los dos
  modos. Los bonos que acortaban (Foro, ciencia, colonia, instrucción) ahora abaratan. Funciones para la pantalla:
  `G.estaciones`, `G.obraEstaciones`, `G.estacionesRestan`, `G.costeObra`, `G.loteCoste`, `G.instrMul`.
- Pruebas viejas adaptadas (`test/sim.test.js`, `test/saber.test.mjs`).

## Falta
1. **Bot (decisión abierta)**: el agresivo gana **0/10** (antes 7/10). Ya no cae ante Aníbal: llega al 145 a.C. con
   7–11 ciudades y ~5.000–6.000 hombres, pero no toma Cartago (9.000–23.000). Con producción 24–26 gana, pero antes
   de Aníbal (236, 242, 251). Ningún número único da 5–8 victorias después del 218: la economía de cinco niveles se
   satura hacia el 265. Opciones: una segunda vía (coste o tope que crezca con la edad) o cambiar V10a o el bot.
   Falla también `test/ajustes.test.mjs` («Dura»). Guion de diagnóstico: una semilla, cada 5 años.
2. **Pantalla (B)**: ficha con cinco niveles, colas en «estaciones», cuentas. `js/ui.js` aún enseña precios sin el
   abaratado (`G.unitCost`) y calcula duraciones propias (líneas ~975 y ~1117).
3. **Tropas y paga (A3 → CE3b)**: nada hecho.
4. Jueces completos, capturas, parte, fichas de historia de lo nuevo.

## Gasto
Director 1,14 · A2 niveles 0,91 (Sonnet) · A1 tiempos 1,11 · ajuste del bot 1,36 (más de 3 pasadas) = **4,51 M**.

## Añadido tras la reanudación (19/11, parada a 7,41 M)
- Hecho: unión con la rama del juego; criterio de la campaña larga «hasta CE12» (en pie en el 150 a.C. con 5+ ciudades, 9/10);
  pantalla B (ficha I–V con candado por el Foro, coste abaratado, colas, reclutar y marchas en estaciones; capturas
  `capturas-tarea/CE3-*.jpg`, sin errores de consola); producción por nivel total; huecos 1-2-3-3-4; requisitos de
  saberes y edades a cinco niveles; pruebas de la ciudad adaptadas.
- Falta: partida corta (en pie 6/10, antes 10/10; fundar 10/10 con victorias de 1,54 h, mínimo 2 h; el bot que investiga
  no llega a la edad III: le falta grano/agua para el barrio Villa o saberes); jueces completos.
- Fallos encontrados por la pieza B: el tope del Foro solo lo cumple `G.upgrade`; `G.mejorarPieza` y `G.colocar` no lo
  comprueban (la pantalla sí). La partida vieja tarda ~30 s en cargar en el navegador de pruebas. Quedan textos
  «al mes» en las cuotas y «meses» en los techos de la ciencia.
