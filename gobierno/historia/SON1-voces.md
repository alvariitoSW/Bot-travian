# Voces y banda sonora de la batalla · SON1-b (23/11/2026)
**En una frase**: los soldados hablan en latín corto con subtítulo y traducción; el enemigo se «oye» como descripción. La música (por código) imita tibia, tympanum, cornu y bordón en modo dorio/frigio.

**Dictamen: APTO CON NOTAS.** Sin anacronismos imperiales («Imperio», «César Augusto», cohortes, etc.); comprobado por prueba (`test/voces.test.mjs`).

**Frases atestiguadas o con base (etiqueta en `js/voces.js`, campo `fuente`)**
- «Fortes fortuna adiuvat»: Terencio, *Formión* 203 (161 a.C.). Histórico (proverbio).
- «Res ad triarios rediit»: Livio 8.8.11, proverbio de la última línea. Histórico.
- «Boves Lucae» (bueyes de Lucania, los elefantes de Pirro en 280 a.C.): Plinio, *Historia Natural* 8.16. Histórico.
- «Signifer, statue signum! Hic manebimus optime!»: Livio 5.55.1; es de 390 a.C., anterior a la época. Probable.
- «Signa inferre», «ad arma», «circumveniri», «subsistere», «terga dare», «impetum facere»: expresiones de Livio y César, passim; el uso como grito es probable.
- Los pasillos ante los elefantes (Zama, 202 a.C.): táctica en Polibio 15.9 y Livio 30.33; la frase «Intervalla aperite!» es del juego.
- Enemigo: cuernos y trompas galos (Polibio 2.29, Telamón 225 a.C.); romanos a una sola voz y cartagineses de lenguas dispares (Polibio 15.12; Livio 30.34); númidas sin brida (Livio 21.46 y 35.11: pasaje por cotejar).
- «Io triumphe!»: grito del triunfo (Livio libro 45; Plutarco, *Paulo Emilio*). Probable.

**Licencia de juego**: el resto (órdenes de centurión y optio, charla de soldados, quejidos). Ningún texto de época fija esas palabras; son latín corriente y correcto, reconstruido para jugar. Marcadas `licencia: 'juego'`. Las voces del enemigo son descripciones en castellano: no se inventa su lengua.

**Notas**
- Los pasajes se citan de memoria de la bibliografía; **cotejar libro y párrafo** antes de ponerlos en el Códice (en especial Livio 21.46/35.11 y Polibio 2.29).
- El cántico grabado (`canto`) es celta: solo suena si el rival incluye galos. Las voces de `panico` (con mujeres) solo al romperse un cuerpo y lejos.
- Música: toda melodía es reconstrucción (casi no se conserva música romana): licencia de juego. Modo dorio/frigio sobre re y el bordón son de corte griego, el que el mundo romano heredó. Instrumentos: tibia (flauta doble, aulós), tympanum, cornu y tuba: atestiguados.

---
## SON2 (23/11/2026): voz hablada y gritos griegos
**Dictamen: APTO CON NOTAS.**

**Regla del usuario (23/11, literal)**: «tienen que ser palabras en español, griego antiguo o en latín». Por eso se quitaron de `assets/sonido/` los tres gritos que podían llevar palabras no permitidas (`orden1`, `orden2`: posible inglés; `orden3`: «grito élfico» de un podcast de fantasía). Queda un grito gutural sin palabra.

**Los romanos hablan en voz alta.** Las 77 frases romanas de `js/voces.js` están dichas con síntesis de voz libre (Piper, voz española `es_ES-sharvard-medium`, datos CC BY 3.0 de la Univ. de Edimburgo, elegida de oído por el usuario el 23/11; ver `assets/voces/LICENSE.txt`). El latín va con **pronunciación restituida** (la clásica, la que reconstruye la filología) escrita para una voz española: c y g siempre duras («Caesar» sonaría «Káisar»), v como u/b, ae como ai, h muda, qu como «cu», acento donde manda la cantidad latina (ej. *ORdines*, *adiúvat*). Es una **aproximación**: una voz española no da la vocal larga ni la corta, ni la «r» ni la «i» consonante latinas. La transcripción está en el campo `pron` de cada frase. Dictamen: la pronunciación restituida es la convención científica; que la dé una voz española es **licencia de juego**, dicha.

**Gritos griegos del enemigo** (solo si el rival lleva falange u hoplitas; `Voces.GRIEGO`). Palabras atestiguadas en griego antiguo, sin inventar nada:
- «Alalá» (ἀλαλά / ἀλαλαί; verbo *alalázein*): el grito de guerra griego. Jenofonte, *Anábasis* 1.8.18; Plutarco, *Pirro* 16 y *Alejandro* 33. Histórico (el grito está bien atestiguado; el pasaje exacto, por cotejar).
- «Eleleú» (ἐλελεῦ; *eleleú*, *eleleízein*): variante del grito de guerra. Píndaro, fr. 78; Aristófanes, *Aves* 364. Probable.
- El peán «Yé, yé, paián» (ἰὴ ἰὴ παιάν): canto de la falange antes de cargar. Tucídides 4.43; Jenofonte, *Anábasis* 1.8.17. Histórico (de Jenofonte, 401 a.C.; vale como costumbre de época).
Los pasajes se citan de memoria: **cotejar libro y párrafo** antes de ponerlos en el Códice. El tratamiento (varios hombres, grito) es del juego.

**Notas**
- Se considera «griego» al rival con `falange` u `hoplitas` en su ejército (Pirro y las falanges macedonias). Si Cartago o Siracusa usaran hoplitas, también gritarían en griego: Siracusa es plausible; Cartago, **dudoso**. Decisión del usuario si se quiere afinar.
- Galos, cartagineses, númidas e íberos **siguen con gritos sin palabra** del banco: no se pone en su boca una lengua que no sabemos reconstruir con seguridad.
- Pendiente de oído humano: nadie ha escuchado estas voces en un altavoz (medido, sin oír).

---
## SON5 (24/11/2026): nuestra falange habla griego antiguo; Cartago, galos e íberos gritan en español
**Dictamen: APTO CON NOTAS.** Pedido del usuario (24/11): «1 vale frases habladas · 2 gritos de guerra en español · 3 sí, como una banda sonora del juego también». Regla de lenguas (23/11): solo español, griego antiguo o latín; aquí, griego y español.

**1. Frases en griego antiguo (36; `Voces.GRIEGAS`, mp3 `gr-*`).** Las dicen el **lochagós** (λοχαγός, oficial de la falange; Jenofonte lo usa) y los **falangitas**, cuando nuestro bando es la falange: Falange a pie, y Escaramuzas con Epiro, Macedonia o hoplitas sin Cartago. Cada frase trae la escritura griega (`gr`), la transliteración latina que se lee en el subtítulo (`lat`, «Émba!»), la traducción (`es`) y `pron` (cómo la lee la voz española: pronunciación **koiné aproximada**: η, ει = i; ω = o; υ = i; θ = z; φ = f; χ = j). No es la pronunciación ática reconstruida con rigor: la voz es una voz española y no hay forma de hacerla más fiel sin una voz griega; se dice.
- **Atestiguado o con base** (campo `fuente`): la contraseña «Ζεὺς σωτὴρ καὶ νίκη» (Jenofonte, *Anábasis* 1.8.16, Cunaxa 401 a.C.) y la invocación a Zeus Salvador; «ἀσπὶς ἐπ᾽ ἀσπίδι» (Tirteo fr. 11 y Homero, *Ilíada* 13.131); el empuje de escudos «ὠθισμός» (Tucídides 4.96, Delio 424 a.C.) → «Ὠθεῖτε!»; no abandonar el puesto y no huir (Tirteo fr. 10–12); Enialio (grito a Ares al cargar, Jenofonte, *Anábasis* 1.8.18 y 5.2.14; por cotejar); «θηρία» para los elefantes (Polibio 5.84); «ὦ ἄνδρες» y «σὺν θεοῖς» (fórmulas de Jenofonte); «Νενικήκαμεν!» (Luciano, siglo II d.C., sobre el corredor de Maratón: fuente tardía, se avisa en la ficha).
- **Licencia de juego**: el resto (órdenes cortas del tipo «Ἔμβα!», «Δέχεσθε τὴν ἔφοδον!», «Ἀκοντίζετε!»…). Son griego corriente y correcto con vocabulario de época (ἔφοδος, ἀκοντίζω, ἀναχωρεῖν, ἐνδιδόναι, ἐπίκειμαι…), pero ningún texto fija esas palabras exactas como grito de guerra. Marcadas `licencia: 'juego'`.
- **Notas**: citas de memoria, **cotejar libro y párrafo** antes del Códice (sobre todo Jenofonte 1.8.18 / 5.2.14 y Tirteo fr. 10–12). Los gritos alalá, eleleú y peán (`GRIEGO_PROPIO`) siguen y salen a veces (1 de cada 5 veces). Sin anacronismos: nada de «hoplita» con armas romanas ni de «Imperio».

**2. Gritos de guerra en español (22; `Voces.GRITOS`, mp3 `ca-*`, `ga-*`, `ib-*`).** Cuando nuestro bando es **Cartago**, los **galos** o los **íberos** en Escaramuzas (el pueblo elegido manda; si no se sabe, se deduce de las tropas). Los dicen un **jefe** o los **guerreros**. El enemigo **no** los usa: sigue con sus descripciones («se oye…») como antes.
- **Cartago**: Baal Hammón (dios principal, inscripciones púnicas), Tanit «rostro de Baal» (pene Baal), Melqart (Livio 21.21: Aníbal hace votos en Gades, 218 a.C.), «¡Elefantes, adelante!» (Polibio 3.46, 15.9). **Se evita** «Delenda…» y todo lo posterior a 146 a.C.
- **Galos**: «¡A ellos, hijos de Breno!» (Breno saquea Roma en 390 a.C., Livio 5.38; otro Breno ataca Delfos en 279 a.C., Pausanias 10.19–23: ambos dentro del recuerdo de la época), Tutatis y Taranis (dioses célticos; las fuentes escritas, Lucano, son del siglo I d.C., pero los dioses son anteriores: probable), los carnyx (Polibio 2.29), «¡Ay de los vencidos!» (Livio 5.48, «vae victis»).
- **Íberos**: Neto (dios guerrero de los acitanos, Macrobio, *Saturnales* 1.19.5, siglo V d.C.: fuente tardía, probable), Indíbil y Mandonio (Polibio 3.76; Livio 28.31), la caetra (Livio 28.5; el escudo íbero). **Se evita** «falcata» (nombre moderno de la espada) y todo lo sin atestiguar como nombre de dios.
- El resto es licencia de juego: gritos cortos en castellano de uso corriente. No se pone en boca de estos pueblos su lengua propia (no se puede reconstruir con seguridad; regla del usuario 23/11).
- **Pregunta abierta**: ¿que también el enemigo de estos pueblos (en la campaña) grite en español? Se dejó **como está** (decisión del encargo).

**3. Efectos en Escaramuzas.** Choques, cuernos (romano y rival, agachan la música), carga, pila y jabalinas, elefantes, falange y fragor de fondo, como en la campaña. Sonidos ya dictaminados en SON1/GM43i; sin cambios de dictamen.
**Pendiente de oído humano**: nadie ha escuchado estas voces en un altavoz (medido, sin oír). En especial el griego con voz española.
