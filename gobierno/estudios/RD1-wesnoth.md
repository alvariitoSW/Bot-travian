# RD1 · `wesnoth/wesnoth` (GPL-2.0) — terreno, flancos y equilibrio (16/11/2026)
**Para**: GM2 (armas por unidad, flancos y retaguardia). Licencia GPL-2.0 (`COPYING`): **solo ideas, ni una línea de código ni de datos**. Los números de abajo son para entender el método; los nuestros salen de nuestro registro histórico.
**Enlace**: https://github.com/wesnoth/wesnoth · leído en clon parcial temporal (`data/core/units.cfg`, `terrain.cfg`, `src/pathfind`). GM2 aún no tiene estudio.

## Qué hace
Juego por turnos en casillas hexagonales, con la fama de ser de los mejor equilibrados del software libre.
1. **Cada unidad es una ficha corta**: vida, coste en oro, un «tipo de movimiento» y 1–3 ataques (daño × golpes, tipo, alcance). Ejemplo leído: lancero, 14 de oro, 36 de vida, lanza 7×3 cuerpo a cuerpo con «primer golpe» y jabalina 6×1 a distancia.
2. **El terreno decide dos cosas con una tabla por tipo de movimiento**: cuánto cuesta entrar y cuánta defensa da. Infantería normal: llano 60 % de ser alcanzado, bosque y colina 50 %, montaña, pueblo y castillo 40 %, agua baja 80 %. Cada terreno es una **decisión** (defender mejor o moverte más).
3. **Zona de control** (`pathfind.cpp`, `enemy_zoc`): entrar junto a un enemigo te deja sin movimiento ese turno; solo los «escaramuzadores» la ignoran. Obliga a formar línea y hace útil la retaguardia.
4. **Flanqueo con «puñalada»** (`backstab` en `weapon_specials.cfg`): daño doble si hay un aliado al lado opuesto del enemigo.
5. **Equilibrio por piedra-papel-tijera**: resistencias por tipo de daño (filo, perforante, contundente…) por unidad; ninguna unidad lo gana todo.

## Qué enseña para GM2 (y por qué funciona)
- **Pocas casillas de terreno, cada una con efecto claro** (defensa y coste), no una lista infinita.
- **Flanco medible**: «mismo golpe, doble daño si te rodean» es lo que hace útil colocar la retaguardia. Encaja con lo que ya tiene `battle.js` (flanqueo, carga).
- **Un arma por rol, con su pega**: la lanza golpea primero pero poco; el jabalinero tiene alcance pero un solo golpe. Coherente con hastati/triarii/velites.
- **Control de zona** da retaguardia sin reglas extra, pero exige casillas; AQVILA lucha por regimientos con cinta de tiempo, no por casillas.

## Traducción a AQVILA
Datos de armas y defensa por terreno: `js/data.js` (números) y `js/registro.js` (fuente histórica de cada arma). Reglas: `js/battle.js` (flanco ya existe; añadir «defensa por terreno» como multiplicador). Nada visual. Dos sistemas separados: no toca `game.js`.
**Coste**: medio (1 tarea). **Riesgo**: **medio-alto de equilibrio** (Wesnoth lleva 20 años afinando); `test/sim.test.js` y `tools/calibra-combate.mjs` ya sirven de red.
**Versión mínima**: una tabla `defensaTerreno` (3–4 terrenos) y «daño doble por la espalda» con regimiento enemigo detrás; medir con `calibra-combate.mjs` que ningún bando gana más del 60 %.
**Duda**: sin fuente de historia para cada cifra, lo de Wesnoth es solo un método. Dictamen histórico: skill `historia`.
