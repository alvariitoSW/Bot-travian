# NR0 · Plan socialista: ciudad «tipo Nova Roma» (17/11/2026)

Pedido del usuario (17/11): que la parte de construir la ciudad se parezca a Nova Roma. Está en la nevera como **P164**:
no se abre hasta publicar la 1.0. Este papel es solo el plan: tareas, reparto y presupuesto. No se ha construido nada.

Aviso: el vídeo no se pudo abrir desde la nube (solo su título). Lo que se dice de Nova Roma es conocimiento general
del juego; NR1 lo comprueba con el usuario. Se toman ideas; su código y su arte, nunca. El arte sigue siendo de 0 A.D.

## Qué se verá distinto en el móvil al terminar
Trazas las calles con el dedo. Ves el grano ir de la granja al granero y al horno a lomos de porteadores. El agua llega
por un acueducto que tú tiendes hasta las fuentes. Cada dios pide algo y premia o castiga. Sigue siendo a 390 px.

## De dónde se parte (ya está en el juego, `js/ciudad.js`)
- Colocas tú cada edificio, con mapa de calor y nota de sitio (`notaSitio`, `colocar`).
- Las casas suben de nivel si tienen fuente, templo y mercado en su radio; hay barrios que suben y bajan.
- Crecidas del río, dique, zanja, incendio y hambre.
- Gente y recuas por la calle (`js/gfx/trajin.js`, `vida.js`), hoy de adorno.

## Lo que falta frente a Nova Roma
| Falta | Hoy |
|---|---|
| Calles trazadas por el jugador | Nacen solas al colocar (`nuevaVia`) |
| Mercancía física y cadenas | Los recursos suben solos con el tiempo |
| Agua como red (acueducto) | Fuente con radio, sin origen |
| Dioses con peticiones | Un templo por ciudad, efecto fijo |

## Tareas, en orden (una sesión cada una)
Dirige y diseña Fable; construye Opus (regla del 17/11). Tope por tarea: 1,5 M.

| ID | Tarea | Tamaño y reparto | M |
|---|---|---|---|
| NR1 | **Estudio y maqueta**: skill `ingenieria-reversa` sobre Nova Roma; maqueta a 390 px de trazar calle y tender acueducto con el dedo. El usuario la prueba y decide. | Media: constructor | 1,0 |
| NR2 | **Calles con el dedo** en el juego: trazar, borrar, coste; los edificios piden calle. Migrar partidas guardadas. | Grande: constructor → revisor | 1,2 |
| NR3 | **Mercancía que se ve**: dos cadenas cortas (grano → pan; hierro → armas) y porteadores que la llevan. Skill `historia`. | Grande: constructor → revisor → verificador | 1,4 |
| NR4 | **Agua por acueducto**: toma en el río o manantial, tramos, fuentes que solo dan agua si están unidas. Skills `arte` e `historia` (Aqua Appia, 312 a.C.; Anio Vetus, 272 a.C.). | Grande: constructor → revisor | 1,2 |
| NR5 | **Dioses que piden**: cada templo pide algo cada cierto tiempo (fiesta, ofrenda) y da favor o castigo. Skill `historia`. | Media: constructor | 0,8 |
| NR6 | **Equilibrio**: campaña con el bot; las ciudades que no miras se llevan solas. | Media: constructor | 0,6 |
| | **Total** (Opus ≈4,7 M · Fable ≈1,5 M) | 6 sesiones | **6,2** |

Hacienda: presas e inundaciones con agua que corre quedan **fuera** (lo más caro y lo que peor va en móvil). Si NR1
sale mal en el dedo, se para ahí y solo se han gastado 1,0 M.

## Reglas de reparto
- Constructor: la tarea literal, los archivos que puede tocar (`js/ciudad.js`, `js/game.js`, `js/ui.js`, `js/gfx/city3d.js`,
  `js/gfx/trajin.js`) y el criterio de hecho. Nunca `js/battle.js`.
- Revisor: solo el diff. Vigila que `ciudad.js` siga corriendo en Node y que `G.load` migre lo guardado.
- Verificador: solo en NR3 (porteadores: hay que mirarlo, los jueces no lo recorren).
- Cierre de cada una: jueces APTO, capturas, parte y `node gobierno/gasto.mjs`.

## Decide el usuario antes de abrir NR1
1. **¿Dónde?** (A) Solo la capital a mano y las demás solas, recomendado; (B) todas a mano.
2. **¿Calles?** (A) Las trazas tú y las automáticas quedan como ayuda, recomendado; (B) solo a mano.
3. **¿Economía?** Las cadenas cambian cómo se ganan los recursos. (A) Solo dos cadenas y el resto como hoy, recomendado; (B) todo por cadenas.

## Riesgos
- Dedo gordo: trazar calles en 390 px. Por eso la maqueta va primero.
- Atención repartida: el juego tiene muchas ciudades, campaña y batallas; Nova Roma, una sola ciudad.
- Partidas guardadas: NR2, NR3 y NR4 cambian datos; cada una lleva su migración.
