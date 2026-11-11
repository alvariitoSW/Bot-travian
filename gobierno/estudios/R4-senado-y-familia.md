# R4 · Senado y familia (estudio de ingeniería reversa)

Solo ideas de cómo se comporta el juego. Nada de código, arte, textos ni nombres copiados. Nada entra al tablero sin tu
aprobación.

## 1. Pregunta
¿Cómo hace *Rome: Total War* (2004) para que el jugador sienta que debe rendir cuentas a Roma y que su familia es un
puñado de personas con carácter, y no solo un ejército?

## 2. Observación
1. **El Senado manda encargos.** Las tres facciones romanas reciben misiones del Senado. No son obligatorias.
   [Wiki de la comunidad](https://forums.totalwar.org/wiki/index.php/Rome:_Total_War)
2. **Premio y castigo.** Cumplir sube tu prestigio ante el Senado y puede dar premios, entre ellos tropas raras.
   Fallar lo baja. Una guía añade que fallar también baja la simpatía del pueblo.
   [Guía de foro](https://forums.totalwar.org/vb/showthread.php/45315-Quietus-Rome-Total-War-Guide/blog.php?u=55881)
3. **Escalera de la reputación.** La misma guía cuenta que, en el peor grado, el Senado te declara fuera de la ley y
   estalla la guerra civil. También la causa atacar a otras facciones romanas. Es una guía de aficionados.
4. **El peso en el Senado** depende de los cargos de tus familiares y de cuántos tienes allí. Los cargos dan influencia
   y habilidades. [Foro](https://forums.totalwar.org/vb/showthread.php/45315-Quietus-Rome-Total-War-Guide/blog.php?u=55881)
5. **Familia con rasgos.** Los miembros ganan rasgos por lo que hacen en batalla o al gobernar una ciudad. Algunos se
   heredan. Edificios de estudio dan más rasgos.
   [Wiki de la comunidad](https://forums.totalwar.org/wiki/index.php/Rome:_Total_War)
6. **Séquito.** Cada personaje lleva consejeros y guardias, hasta ocho, que se pueden pasar de uno a otro; los rasgos,
   no. Los hombres entran por nacimiento, matrimonio o adopción; un gobernador rige la provincia donde está.
   [Wiki fandom](https://totalwar.fandom.com/wiki/Rome:_Total_War) · [foro](https://forums.totalwar.org/vb/archive/index.php/t-45969.html)

**Sin confirmar**: plazo exacto de cada misión, cifras de premio y castigo, qué misiones concretas pide. No lo he
podido leer en ninguna fuente (las webs de guías estaban bloqueadas en este contenedor). No pongo números.

## 3. Por qué funciona
- Da **objetivos externos** sin quitarte libertad (no son obligatorios): siempre hay algo que hacer.
- La reputación convierte una guerra en una **elección con precio**: atacar a quien no toca te cuesta caro.
- Pocos personajes con nombre y rasgos crean **cariño y pérdida**: te importa que muera el general.

## 4. Traducción a AQVILA
**Qué es histórico.** El Senado asigna mandos y provincias; los cónsules son dos y duran un año; las grandes familias
(Cornelios, Fabios, Claudios, Emilios) acaparan los cargos. Fuentes: Polibio, *Historias* VI 11–18 (poderes del Senado
y de los cónsules); Livio, *Ab urbe condita*, libros XXI–XXX (reparto anual de provincias y mandos).
**Licencia de juego**: misiones con plazo y premio, rasgos, adopciones y séquito. Se marcan con la pastilla de licencia.

**Qué se apoya en lo que ya existe**
- *Hechos históricos* (`js/data.js`): cada misión se escribe como un hecho con su fuente. Ej.: «el Senado pide Siracusa
  antes del año X».
- *J5 Política territorial*: aquí vive el apartado «Senado» (`js/ui.js`, pestaña Gobierno). **Esta propuesta es
  su primer contenido**; no choca, la llena.
- *B3 felicidad*: el «favor del pueblo» se suma a la felicidad de las ciudades; el «favor del Senado» es un número
  nuevo del jugador (`s.senado`, migrado en `G.load`).
- *Dos modos Gobierno/Guerra (J1)*: las misiones salen en Gobierno; el aviso, un chip en la fila fina.
- *P65 chips por clase*: un chip «Senado» con la misión activa.
- *I2 mapa por turnos*: el plazo se cuenta en estaciones. **Depende de I2**; sin I2 se cuenta en meses.
- *C3 diplomacia*: la reputación con el Senado puede cerrar o abrir alianzas con Roma. Se amplía, no choca.
- *J3 capital y pueblos*: los familiares serían gobernadores de capitales. Después de J3.

**Familia (segunda etapa)**: 3 a 5 personajes con nombre, uno o dos rasgos y un cargo (gobernar ciudad o mandar
ejército). El rasgo da un bonus pequeño (ej. «pródigo»: +ánimo, −oro). Lógica en `js/game.js` y tabla en `js/data.js`;
tarjeta en `js/ui.js`. En 390 px: una fila de retratos redondos bajo el consejo.

**Offline y guardado**: todo local; campos nuevos migrados.

## 5. Coste y riesgo
Una tarea media ha costado 0,7–1,5 M.
- Etapa 1, misiones y reputación: ~0,2 + 0,7 M, una sesión. Más ajuste del bot: ~0,5 M extra.
- Etapa 2, familia con rasgos: ~0,3 + 1,0 M, dos sesiones. Total orientativo: **2,2–3 M**.
- Riesgo: el bot de pruebas puede perder si ignora misiones; y los plazos mal puestos agobian. Se vería como avisos
  rojos molestos. Se corrige con premios generosos y castigos blandos al principio.
- Choca con `js/game.js` si I2 se hace a la vez: no van en paralelo.

## 6. Versión mínima
**Una misión del Senado a la vez, con plazo y premio, y una barra de «favor del Senado» que sube o baja.** Sin familia
todavía.
