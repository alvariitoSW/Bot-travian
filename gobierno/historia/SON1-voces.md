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

**Los romanos hablan en voz alta.** Las 77 frases romanas de `js/voces.js` están dichas con síntesis de voz libre (Piper, voz española `es_ES-davefx-medium`, datos CC0; ver `assets/voces/LICENSE.txt`). El latín va con **pronunciación restituida** (la clásica, la que reconstruye la filología) escrita para una voz española: c y g siempre duras («Caesar» sonaría «Káisar»), v como u/b, ae como ai, h muda, qu como «cu», acento donde manda la cantidad latina (ej. *ORdines*, *adiúvat*). Es una **aproximación**: una voz española no da la vocal larga ni la corta, ni la «r» ni la «i» consonante latinas. La transcripción está en el campo `pron` de cada frase. Dictamen: la pronunciación restituida es la convención científica; que la dé una voz española es **licencia de juego**, dicha.

**Gritos griegos del enemigo** (solo si el rival lleva falange u hoplitas; `Voces.GRIEGO`). Palabras atestiguadas en griego antiguo, sin inventar nada:
- «Alalá» (ἀλαλά / ἀλαλαί; verbo *alalázein*): el grito de guerra griego. Jenofonte, *Anábasis* 1.8.18; Plutarco, *Pirro* 16 y *Alejandro* 33. Histórico (el grito está bien atestiguado; el pasaje exacto, por cotejar).
- «Eleleú» (ἐλελεῦ; *eleleú*, *eleleízein*): variante del grito de guerra. Píndaro, fr. 78; Aristófanes, *Aves* 364. Probable.
- El peán «Yé, yé, paián» (ἰὴ ἰὴ παιάν): canto de la falange antes de cargar. Tucídides 4.43; Jenofonte, *Anábasis* 1.8.17. Histórico (de Jenofonte, 401 a.C.; vale como costumbre de época).
Los pasajes se citan de memoria: **cotejar libro y párrafo** antes de ponerlos en el Códice. El tratamiento (varios hombres, grito) es del juego.

**Notas**
- Se considera «griego» al rival con `falange` u `hoplitas` en su ejército (Pirro y las falanges macedonias). Si Cartago o Siracusa usaran hoplitas, también gritarían en griego: Siracusa es plausible; Cartago, **dudoso**. Decisión del usuario si se quiere afinar.
- Galos, cartagineses, númidas e íberos **siguen con gritos sin palabra** del banco: no se pone en su boca una lengua que no sabemos reconstruir con seguridad.
- Pendiente de oído humano: nadie ha escuchado estas voces en un altavoz (medido, sin oír).
