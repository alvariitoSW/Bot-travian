# Corazón · Plan de la falange (FA0, 23/11/2026)

**Qué es.** Lo que el usuario decidió el 23/11 para la falange a pie y la lista de sesiones que la construyen, con su
encargo listo para abrir. Sirve a `OBJETIVOS.md`, órgano Corazón (L17, formaciones a pie; L11 en el enlace final). Manda
`TP9-objetivo-lucha-a-pie.md` §4; esta página lo amplía con lo que él añadió. Lee antes `REF-batallas-referencias.md`
(clips de falange, elefantes y Pidna) y `TP9-0-estudio-lucha.md` §1.3, §2.7 y §2.10.

## 1. Sus respuestas (literales, opciones elegidas en el chat de FA0)
| Pregunta | Eligió |
|---|---|
| (a) La propuesta de TP9-0 (oficial en la fila, compás, giro, filas, flanco de verdad) | **«Sí, y además luchar»**: todo lo propuesto y además tú clavas tu propia sarisa con un gesto |
| (b) Qué tendría que sentir | **Las cuatro**: «Peso y peligro» · «Decidir de verdad» · «Espectáculo» · «Variedad» |
| (c) Los dedos | **«Como propone»** |
| (d) Contra quién | **Los cuatro**: manípulos · caballería al flanco · elefantes · otra falange / hoplitas |
| (e) Dónde | **«Primero prueba, luego batalla»**: Escaramuzas, y cuando le guste, «Bajar a pie» |
| (f) Aspecto | **«Soldado nuevo, macedonio»** |
| (g) Orden | **«Todo a la vez»** (sesiones en paralelo). Él prueba en el móvil al cerrar cada ola |
| (h) Gasto | **«Sin tope, pero medido»** |
| Aprobación del plan (literal) | **«Que salgan las máximas sesiones posibles para acabar cuanto antes y que piense fablenm y trabaje opus»** |
Nota que sigue en pie (20/11): «La de picas ha mejorado pero la jugabilidad es muy pobre también y falta innovación para la lucha».

## 2. Qué verá en el móvil al acabar
Escaramuzas → «Falange a pie» → eliges rival: **manípulos, caballería, elefantes o falange**. Eres el oficial de penacho
blanco, en el centro de la primera fila, con el soldado nuevo macedonio. Sin botones de golpe ni consejos. **Dedos** (horizontal):
derecho, tocar al compás = el muro empuja («¡Ha!»); derecho, deslizar hacia delante = **tu estocada** al romano marcado;
derecho, arrastrar a un lado = el muro gira despacio; izquierdo, tocar una de las cinco rayas = esa fila baja o alza la sarisa;
estandarte = Aguantar · Empujad · Cerrar filas · Retroceder. El flanco **entra de verdad** (aviso en el borde, no cartel):
giras a tiempo o te rompen. Jinetes buscan el lado; elefantes se estrellan contra las picas o te las abren; muro contra
muro, empuje puro. Cada partida cambia (rival, lado del flanco, terreno con un trozo roto). Abanico de astas, caídos
delante del muro, polvo, gritos y plano corto en los choques. Después, lo mismo al «Bajar a pie» con una falange.

## 3. Sesiones, por olas (lo de una ola va a la vez; la siguiente se abre en cuanto la anterior da APTO)
Para todas: **Fable piensa y Opus construye** (excepción del usuario a «Sin Fable», 23/11, solo para la falange): Fable
dirige y escribe media página de diseño (qué gesto, qué se ve, cómo se mide, guion de fotos); un constructor Opus de ≤30
pasos. Skill `ministerio-batallas`; prueba `node gobierno/juez-area.mjs batallas` y capturas propias a 390×844 y 844×390
en `capturas-tarea/<ID>-*.jpg`; gasto medido con `gasto.mjs`; parte con Pases, Ideas y Decide el usuario. Nadie toca
archivos de otra sesión de su ola. Él prueba cada ola en el móvil cuando puede; su nota **no frena** la ola siguiente: lo
que diga se corrige en la siguiente sesión de esos archivos (R2).

**Contrato común (lo cumplen todas; lo fija FA1 y no se cambia sin avisar en el parte):** `js/falange.js` exporta
`crearFalange(m)` con estado `S`: `S.giro` (rad), `S.filas[5]` (true = bajada), `S.flanco{lado,hombres}`, `S.pulso` (0–1),
`S.yo.tEstocada`, `S.rival` ('manipulos'|'caballeria'|'elefantes'|'falange'|'hoplitas'), y `avisa(tipo, datos)`. Los rivales
son módulos `{ crea(S, azar), paso(S, dt), choque(S, h) }` que `crearFalange` recibe en `m.rival`. La escena monta el
dibujo de cada rival llamando a `montaRival(ctx)` del archivo del rival, si existe.

**Ola 1 · Cimientos (4 a la vez)**
- **FA1 · Reglas de la falange sin pantalla** (≈1,2 M). Pasa las reglas de `maquetas/falange/acciones.js` a `js/falange.js`
  (nuevo, corre en Node) y añade: giro del muro (8°/s), flanco que entra (hombres de verdad, no cartel), cinco filas que bajan
  o alzan, tu estocada (deslizar; blanco marcado), compás de TP9-0 §2.7, terreno roto, el rival de manípulos como primer
  módulo, y bots «a compás», «a destiempo», «no gira» y «loco». Archivos: `js/falange.js`, `test/falange.test.mjs`.
  Pase → común: en `gobierno/areas.json`, batallas.propios, añadir `js/falange.js`, `js/falange-rivales.js`,
  `test/falange.test.mjs` y `test/falange-rivales.test.mjs`. Hecho: «el bot que no gira pierde por el flanco; el que gira, aguanta».
- **FA5 · Rivales nuevos sin pantalla** (≈1,2 M). `js/falange-rivales.js` y `test/falange-rivales.test.mjs` (nuevos), contra el
  contrato: caballería que busca flanco y espalda; elefantes (con filas bajadas se espantan y vuelven; sin ellas abren hueco);
  falange rival y muro hoplita (empuje puro: gana el compás y la cohesión); variedad por partida. Mientras FA1 no suba, prueba
  con un `crearFalange` de mentira en su test. No toca `js/falange.js`. Hecho: «cada rival tiene su bot ganador y su perdedor».
- **FA2 · Falangita macedonio y oficial** (≈1,2 M; taller, skills `arte` e `historia`). Sobre el `falangita` de
  `assets/soldados/`: oficial con penacho blanco y estrella, escudo pequeño colgado del cuello, sarisa de ≈6 m a dos manos.
  `tools/blender/*falang*`, `assets/soldados/falangita*`, `oficial-falange*`, `LICENSE.txt`. No a la vez que TP9c (`tools/`).
  Hecho: «en la hoja de siluetas distingo al oficial de un vistazo».
- **FA3 · Dedos y pantalla limpia** (≈0,9 M). En la maqueta: `dedos.js` (nuevo: tocar, deslizar, arrastrar, rayas de filas),
  `hud.js`, `index.html`, y en `escena.js` solo la conexión de entrada. Fuera los cinco botones y el consejo; aviso de flanco
  en el borde; abanico del estandarte. Hasta FA4, los gestos mueven las órdenes de hoy. **Tras TP9a** si TP9a toca
  `maquetas/falange/escena.js`. Hecho: «juego una partida sin ver un solo botón de golpe».

**Ola 2 · Que se juegue (3 a la vez; tras la ola 1)**
- **FA4 · La escena nueva** (≈1,8 M). `escena.js`, `campo.js`, `camara.js`, `acciones.js` de la maqueta usan `js/falange.js`
  y `js/falange-rivales.js` (se borra la copia de reglas): muro, picas y cámara giran juntos; los del flanco llegan andando
  por el lado; abanico escalonado; caídos que se quedan; tu estocada se ve; deja el hueco `montaRival(ctx)`. No toca
  `js/falange*.js` (fallos → pase en su parte). Hecho: «giro el muro arrastrando y paro a los que entran por el lado».
- **FA6 · Movimientos de sarisa** (≈1,5 M; taller, tras FA2). Recoger y clavar, bajar y alzar, paso corto de lado al girar,
  tu estocada, caer de dos maneras. `tools/blender/`, `assets/soldados/movimientos_*`. No a la vez que TP9c.
  Hecho: «en las capturas las dos manos guían el asta y el oficial clava».
- **FA7 · Rivales en pantalla y su menú** (≈1,8 M). Jinetes, elefantes, hoplitas y falange rival con el arte de 0 A.D. que ya
  hay (`assets/units/`: `equites`, `elefantes`, `hoplitas`, `falange`): archivos nuevos de la maqueta `caballeria.js`,
  `elefante.js`, `rival.js` (cada uno con `montaRival`), y elegir rival en la entrada de `js/ui-escaramuza.js` (`?rival=`).
  No toca `escena.js`: FA4 lo enchufa; si FA4 cierra antes, FA7 añade la línea al final. Hecho: «elijo elefantes y se estrellan contra mis picas».

**Ola 3 · Soldado nuevo y espectáculo (2 a la vez; tras la ola 2)**
- **FA8 · El soldado nuevo en la falange** (≈1,5 M). Cambia los muñecos por el falangita de FA2 y FA6: `soldado.js`,
  `esqueleto.js`, `locomocion.js` de la maqueta, con el mismo contrato hacia `escena.js` (no lo toca). Peso de TP9-0 §2.10
  (≤30 llamadas, ≤750 mil triángulos). Hecho: «mi fila son los soldados nuevos y me distingo por el penacho».
- **FA9 · Espectáculo** (≈1,5 M). Plano corto y grito al dar la orden y en cada choque, polvo, sangre que se queda, temblor
  del muro, sonido por capas (CC0 de GM43i), agachar la cabeza bajo la salva. `escena.js`, `camara.js`, `campo.js`,
  `sonido.js` de la maqueta. Hecho: «el choque de elefantes o jinetes impresiona; él pone nota».

**Ola 4 · A la batalla grande (1)** — **FA10** (≈1,5 M): al «Bajar a pie» con una falange, la misma lucha de `js/falange.js`.
`js/ui-mando.js`, gancho en `js/simulador.js`, `css/mando.css`; `sw.js` como pase. **Tras TP9f del tablero** (el «Bajar a pie»
del testudo, mismos archivos) y nunca a la vez que CG9. Hecho: «bajo con mi falange y peleo igual que en la prueba; las bajas cuentan».

**Total declarado ≈14,1 M** más el diseño de Fable (≈0,2 M por sesión; esperable 18–20 M: las tandas de batalla se pasan un 25–40 %). Sin tope, medido por sesión.

## 4. Cómo encaja con TP9a–f del tablero
- **FA1, FA3, FA4 sustituyen a TP9e** («Falange: el oficial en la fila»; en el estudio, TP9f) y absorben el pulido de picas de TP8c.
- **Nuevas**: FA2, FA5, FA6, FA7, FA8, FA9 (lo que él añadió: luchar tú, cuatro rivales, soldado nuevo, espectáculo, variedad)
  y FA10 (la falange al «Bajar a pie»; TP9f del tablero lo hace para el testudo y va antes). Entran sin sacar nada: él pidió «las máximas sesiones posibles para acabar cuanto antes».
- TP9a–d (testudo) siguen como estaban. Choques de archivos: TP9a con FA3 (`maquetas/falange/escena.js`), TP9c con FA2 y FA6
  (`tools/`), TP9f del tablero y CG9 con FA10 (`js/ui-mando.js`, `js/simulador.js`).

## 5. Historia (dictamen para las sesiones; skill `historia` confirma en cada una)
Oficial en la primera fila (lochagos, Asclepiódoto 2): **histórico**. Que el oficial clave su sarisa: **histórico** (pelea en
primera fila). Cinco puntas y abanico (Polibio 18.29–30), flanco y terreno roto (18.31–32; Pidna, Plutarco *Emilio* 20):
**histórico**. Caballería al flanco (Heraclea, 280; yunque y martillo): **histórico**. Elefantes contra picas: **probable**
(Rafia 217, Magnesia 190); que se espanten ante las filas bajadas, **licencia de juego**. Falange contra falange (Selasia 222,
Rafia 217, Mantinea 207): **histórico**; muro hoplita en esta época, raro (Esparta antes de 227): **probable**.
Compás a toques y gestos: **licencia de juego**.
