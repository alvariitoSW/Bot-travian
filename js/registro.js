/* AQVILA — registro de piezas: una ficha por cada pieza de js/data.js, con su arte y su fuente histórica.
   Los NÚMEROS (costes, ataque, tiempos…) NO están aquí: siguen en data.js. La ficha se casa con la pieza por id.
   El juez (node gobierno/fichas.mjs) comprueba que no sobre ni falte ninguna ficha y que los archivos de arte existan.
   La historia viene de gobierno/historia/ (auditoría H1, cotejada el 11/11/2026 con Perseus, LacusCurtius y Livius.org).
   dictamen: 'historico' (cotejado con el pasaje) | 'probable' (reconstrucción razonada) | 'licencia de juego' (inventado o cambiado
   para poder jugar) | 'por cotejar' (nadie lo ha cotejado todavía; nada inventado).
   UNA SOLA FUENTE (P55): el texto que lee el jugador en el Códice vive aquí, en historia.texto (tropas, ciudades y hechos).
   js/codice.js no guarda textos: los lee de este registro. Una ficha con texto no puede quedar «por cotejar» (lo vigila el juez). */
(function (root) {
  const R = {};
  const CC = 'CC BY-SA 3.0', WG = 'Wildfire Games (0 A.D.)';
  const est = (m, extra) => Object.assign({ modelo: 'assets/static/' + m + '.bin', licencia: CC, credito: WG }, extra || {});   // edificio real de 0 A.D.
  const uni = (m, extra) => Object.assign({ modelo: 'assets/units/' + m + '.bin', licencia: CC, credito: WG }, extra || {});   // tropa real de 0 A.D.
  const h = (fuente, dictamen, nota, texto) => Object.assign({ fuente, dictamen: dictamen || 'por cotejar' }, nota ? { nota } : {}, texto ? { texto } : {});   // texto: lo que lee el jugador en el Códice
  const f = (arte, historia) => ({ arte, historia });
  const SIN_H = h('', 'por cotejar');   // la auditoría H1 no dice nada de esta pieza

  // ---- Edificios (D.BUILD). Modelo: el que usa city3d.js (D.BUILD[b].modelo || b) ----
  const edificio = {
    aserradero: f(est('aserradero'), SIN_H), cantera: f(est('cantera'), SIN_H), mina: f(est('mina'), SIN_H), granja: f(est('granja'), SIN_H),
    viviendas: f(est('casa', { nota: 'las ínsulas se dibujan como manzanas de casas (casa.bin, casa_b, casa_c y casa_d). Según la cultura de la ciudad (E.cultura) se usan las casas griegas grie_casa, _b, _c, _d y _e o las púnicas cart_casa, _b y _c, todas de 0 A.D. (Wildfire Games, CC BY-SA 3.0; assets/static/*.bin, mismo crédito en assets/static/LICENSE.txt). Forma y estilo de época son reconstrucción de 0 A.D.: licencia de juego, sin fuente cotejada' }), h('Livio 21.62', 'historico', 'cotejado el 13/11/2026 en Perseus (trad. Roberts). Livio no da año en el pasaje (solo «este invierno», 218-217); que sean ínsulas de adobe y madera es lectura, y generalizarlas a toda ciudad es licencia de juego', 'En Roma ya había casas de varios pisos. Según Livio, un buey subió por su cuenta hasta el tercer piso de una casa del Foro Boario y se arrojó asustado por la gente. Fuera de Roma, las casas eran más bajas.')),
    foro: f(est('foro'), SIN_H), almacen: f(est('almacen'), SIN_H), mercado: f(est('mercado', { nota: 'los puestos pequeños de ciudad púnica usan prop_puesto_cart.bin (0 A.D., CC BY-SA 3.0)' }), SIN_H), puerto: f(est('puerto'), h('Livio 35.10; Livio 40.51', 'historico', 'cotejado el 13/11/2026 en Perseus (trad. Roberts/Edmonds). 35.10: ediles Lépido y Paulo (193), no censores; el año sale de los cónsules. 40.51: Fulvio (179) hace pilares de puente y mercados; el texto no dice «emporium» ni «pórtico Emilio»', 'Roma tenía su puerto fluvial en el Tíber. Según Livio, en 193 a.C. dos ediles construyeron un pórtico y junto a él un muelle sobre el río. En 179 el censor Fulvio levantó los pilares de un puente y un mercado con columnata fuera de la Porta Trigemina.')),
    cuartel: f(est('cuartel'), SIN_H), establo: f(est('establo'), SIN_H),
    muralla: f(est('muro', { nota: 'recinto con muro.bin, torre.bin y puerta.bin' }), h('Livio 1.44 (cotejado en Perseus 13/11/2026); Varrón, LL 5.143 por cotejar', 'probable', 'Livio 1.44: Servio rodeó Roma con terraplén, fosos y muro y así extendió el pomerio; los mojones se adelantaban con el muro. No dice quién podía ampliarlo (eso, y Varrón 5.143, siguen por cotejar). Muro regular con torres en las cuatro puertas: licencia de juego', 'Servio Tulio, según Livio, rodeó Roma con terraplén, fosos y muro. El pomerio, la franja sagrada sin cultivar ni edificar, se corría hacia fuera al avanzar el muro. Las ciudades seguían el terreno; el recinto cuadrado del juego es una simplificación.')),
    herreria: f({ sin: 'la herrería no tiene modelo: no se dibuja en la ciudad', provisional: true }, SIN_H),
    escuela: f({ sin: 'la escuela no tiene modelo propio: de momento no se dibuja en la ciudad', provisional: true }, SIN_H),
    templo: f(est('templo'), SIN_H)
  };

  // ---- Tropas (D.UNITS). Modelo: assets/units/<id>.bin (el índice es el id). Fuente: H1-tropas.md ----
  const tropa = {
    hastati: f(uni('hastati'), h('Polibio 6.21-23', 'historico', null, 'Era la primera línea de la legión. Según Polibio, llevaban escudo grande, espada corta de estilo hispano, dos jabalinas, casco de bronce con tres plumas y grebas. Los ricos vestían cota de malla.')),
    velites: f(uni('velites'), h('Polibio 6.21-22; Livio 26.4; Livio 8.8', 'probable', 'Livio 26.4 ya los nombra en 211 a.C.; en 280 es probable, no seguro', 'Infantes ligeros: los más jóvenes y pobres, con espada, jabalinas y escudo redondo. Polibio los describe, y Livio ya los nombra en 211. En 340 todavía no existían, así que en 280 es probable, no seguro.')),
    principes: f(uni('principes'), h('Polibio 6.21; Polibio 6.23', 'historico', null, 'Hombres en plena edad, segunda línea de la legión. Según Polibio llevaban el mismo equipo que los hastati. Solo los triarios cambiaban las jabalinas pesadas por lanzas largas.')),
    triarii: f(uni('triarii'), h('Polibio 6.21-23; Livio 8.8', 'historico', null, 'Los veteranos, al fondo, con lanza larga en vez de jabalinas. Según Polibio eran 600 por legión. Livio cuenta que esperaban de rodillas; de ahí el dicho «la cosa ha llegado a los triarios».')),
    equites: f(uni('equites'), h('Polibio 6.20; Polibio 6.25; Livio 8.8', 'historico', null, 'La caballería romana, formada por ciudadanos acomodados. Según Polibio, eran 300 por legión. Antes iban sin coraza y con escudo de cuero; luego adoptaron armas a la griega y una lanza con contera.')),
    vigiles: f(uni('vigiles', { provisional: true, nota: 'la tropa es un anacronismo; el modelo es un jabalinero romano' }), h('Regla de juego: guardia genérica; los Vigiles son de Augusto (Dión Casio 55.26; Suetonio, Augusto 30; Livio 39.14)', 'licencia de juego', 'renombrada «Guardia urbana» (H5): los Vigiles de verdad son de Augusto (Dión 55.26; Suetonio, Augusto 30); aquí es una guardia genérica', 'En el juego es una tropa de vigilancia de la ciudad. Los Vigiles de verdad son de Augusto, siglos después. En la República, de noche vigilaban unos magistrados con ayudantes, según Livio.')),
    milicia: f(uni('milicia'), h('Regla de juego: leva genérica, no es una tropa de las fuentes', 'licencia de juego', 'leva ciudadana genérica', 'Ciudadanos armados deprisa. Las fuentes cuentan que las ciudades armaban a su gente en apuros, pero no describen una tropa así. Es una pieza del juego para tener un soldado barato.')),
    hoplitas: f(uni('hoplitas'), h("Plutarco, Filopemén 9.1-2", "probable", "reconstrucción razonada: el pasaje habla del rearme aqueo, no describe al hoplita clásico", "Soldado griego de línea, con lanza, escudo grande, casco, coraza y grebas. Plutarco cuenta que Filopemén rearmó a los aqueos con pica larga y escudo pesado en lugar de lanza corta y escudo ligero. La ficha es una reconstrucción razonada.")),
    falange: f(uni('falange'), h('Polibio 18.29; Plutarco, Pirro 15.1', 'historico', null, 'Masa de infantes con lanza larguísima, la sarisa. Según Polibio, la sarisa se diseñaba de 16 codos y en la práctica medía 14. Pirro pasó a Italia con 20.000 infantes, según Plutarco.')),
    peltastas: f(uni('peltastas'), h('Livio 44.41', 'probable', 'Livio no usa la palabra «peltastas» (caetrati y chalcaspides, 44.41); el nombre es del juego', 'Infantería ligera griega con escudo pequeño. Livio habla de «caetrati» y «chalcaspides» en la Macedonia de Pidna, pero no usa la palabra peltastas. El nombre del juego es una etiqueta cómoda.')),
    honderos: f(uni('honderos'), h("Diodoro 5.18; Livio 28.37", "historico", "las «tres hondas» no se pudieron confirmar y se quitaron", "Famosos por la honda. Según Diodoro, los baleares lanzaban piedras mucho mayores que otros honderos y se entrenaban de niños con pan como blanco. Livio dice que la honda era su única arma.")),
    libios: f(uni('libios'), h('Polibio 3.87; Polibio 3.114', 'historico', null, 'Tras Trasimeno, Aníbal cambió sus armas por las romanas capturadas, según Polibio. En Cannas formaban con armadura romana. Era la infantería pesada y de confianza de su ejército.')),
    iberos: f(uni('iberos'), h('Polibio 3.114', 'historico', null, 'Según Polibio, en Cannas vestían túnicas cortas con borde púrpura, un color que se veía de lejos. Cartago los reclutaba como mercenarios en Hispania, y en el juego también defienden Sagunto.')),
    galos: f(uni('galos'), h('Polibio 2.28-30', 'historico', null, 'Según Polibio, algunos luchaban con calzas y capa y los gesatos, desnudos, por bravura. Los romanos los temían desde el saqueo de Roma. Fueron aniquilados en Telamón en 225.')),
    sagrada: f(uni('sagrada'), h("Diodoro 16.80.4; Diodoro 20.11.1; Diodoro 20.12.3", "probable", "renombrada «Ciudadanos de Cartago» (H5): que no aparezca después de 310 es silencio de las fuentes abiertas, no prueba de que desapareciera", "Cartago solía pagar mercenarios, pero tenía una élite de ciudadanos ricos, el Batallón Sagrado: 2.500 hombres según Diodoro, que lo muestra en el Crimiso (339) y contra Agatocles (310). Después no lo hemos hallado en las fuentes que abrimos, lo que no prueba que desapareciera.")),
    jinetes: f(uni('jinetes'), h('Regla de juego: caballería genérica, no es una tropa de las fuentes', 'licencia de juego', 'caballería local genérica', 'Una caballería genérica para que todas las facciones tengan jinetes. Las fuentes describen caballerías concretas, como los équites o los númidas, pero no esta pieza.')),
    numidas: f(uni('numidas'), h("Livio 35.11; Polibio 15.5", "historico", null, "Jinetes ligeros con jabalinas. Según Livio, montaban sin bridas, y en 193 había unos 800 al servicio de Roma. En Zama, Masinisa aportó unos 4.000, según Polibio.")),
    tesalios: f(uni('tesalios'), h("Plutarco, Pirro 17.3; Livio 42.58.13", "historico", "Heraclea y 171 salen del contexto, no del pasaje; en Pidna (168) no consta", "Caballería de Tesalia, famosa en Grecia. Según Plutarco, Pirro lanzó a sus jinetes tesalios contra los romanos cuando los elefantes los habían desordenado, en Heraclea (280). Livio coloca a 400 tesalios junto a los romanos en Calínico, en 171.")),
    elefantes: f(uni('elefantes', { provisional: true, nota: 'un solo modelo cartaginés; no encaja para los elefantes asiáticos de Pirro' }), h('Plutarco, Pirro 15.1; Polibio 1.40; Polibio 5.84', 'historico', null, 'Pirro trajo 20 a Italia, según Plutarco. En Panormus los de Asdrúbal fueron derrotados, según Polibio. Asustaban al enemigo, pero también podían volverse contra los suyos.')),
    general: f(uni('general', { provisional: true, nota: 'modelo único de Escipión para todos los generales' }), h('Regla de juego: el general es una pieza propia del juego', 'licencia de juego', 'cada bando tuvo generales distintos', 'El jefe del ejército, un personaje de juego que mejora tus tropas. Representa a los grandes mandos de la época, pero no es un cargo concreto de las fuentes.'))
  };

  // ---- Ciudades (D.CITIES). Sin modelo propio: todas usan la escena común de city3d.js. Fuente: H1-ciudades.md ----
  const SIN_C = { sin: 'sin modelo propio: usa la escena común de la ciudad (city3d.js)' };
  const ciudad = {
    roma: f(SIN_C, h('Polibio 6.21-26; Plutarco, Pirro 15', 'historico', null, 'En 280 ya manda en Italia central. Su legión se organiza en manípulos por edad y riqueza, según Polibio. Ese año llega Pirro de Epiro, y empieza una guerra que cambiará su suerte.')),
    volsinii: f(SIN_C, h("Livio, Períocas 16.8", "historico", "el año exacto de la caída no consta en ese pasaje; el 264 se anota por el contexto del libro", "Ciudad etrusca. Las Períocas de Livio recogen, en el libro que empieza en 264, una guerra victoriosa de Roma contra los volsinios. El año exacto de su caída no consta en ese pasaje.")),
    capua: f(SIN_C, h('Livio 8.14; Livio 23.2-7', 'historico', 'en 280 es aliada de Roma (derechos desde 338, Livio 8.14); pasa a Aníbal tras Cannas (Livio 23.7)', 'Recibió derechos de ciudadano romano en 338, según Livio. Tras Cannas se pasó a Aníbal, que le dejó sus magistrados y leyes. Roma la recuperó después.')),
    tarentum: f(SIN_C, h("Livio, Períocas 14.9 y 15.1", "historico", "dueño Epiro desde 280 y general Pirro «hasta 272»: licencia de juego", "Colonia griega del sur de Italia. Según las Períocas de Livio, en 272 una flota cartaginesa acudió en su ayuda y rompió el tratado con Roma; después la ciudad fue sometida y Roma le dejó paz y libertad.")),
    mediolanum: f(SIN_C, h("Polibio 2.17.4; Polibio 2.34.1 y 2.34.10-15", "historico", null, "Capital de los ínsubres, según Polibio la mayor tribu gala del valle del Po. El cónsul Cneo Cornelio la tomó al asalto, con Marco Claudio como colega. El año 222 se deduce de los cónsules, no del pasaje.")),
    messana: f(SIN_C, h('Polibio 1.7-11; Diodoro 21.18', 'historico', null, 'Campanos al servicio de Agatocles la tomaron por traición, según Polibio, y se llamaron mamertinos. En 264 pidieron ayuda a Cartago y a Roma, y de ahí salió la Primera Guerra Púnica.')),
    syracusae: f(SIN_C, h("Diodoro 22.2; Polibio 8.3-5", "historico", "dueño «Siracusa» estable en 280: licencia de juego (Diodoro 22.2 habla de tiranos rivales)", "La gran ciudad griega de Sicilia. En 280 no había un estado único: según Diodoro, mandaban tiranos rivales, y Hicetas gobernaba Siracusa. Cuando Roma la sitió bajo Marcelo, las máquinas de Arquímedes la defendieron y, según Polibio, los romanos no volvieron a asaltarla durante ocho meses de cerco. Cayó en 212.")),
    agrigentum: f(SIN_C, h('Diodoro 22.8; Diodoro 22.10; Polibio 1.17-19', 'historico', 'en 280 es la griega Akragas (corregido en H7); en el juego pasa a Cartago en 264 (Polibio 1.17 la da como base en 262): licencia de juego', 'Griega, no cartaginesa, en 280. Según Diodoro, la entregó a Pirro Sosístrato, que la dominaba. En 262 Cartago la hizo su base, según Polibio, y Roma la tomó.')),
    panormus: f(SIN_C, h('Polibio 1.38; Polibio 1.40', 'historico', null, 'Ciudad cartaginesa de Sicilia. Roma la tomó en la Primera Guerra Púnica, y junto a ella Asdrúbal fue derrotado y perdió sus elefantes, según Polibio.')),
    lilybaeum: f(SIN_C, h("Diodoro 22.10; Polibio 1.41-47", "historico", null, "Fortaleza cartaginesa en el extremo oeste de Sicilia, fundada con los supervivientes de Motya. Según Diodoro, Pirro la asedió unos dos meses y desistió. Los romanos la sitiaron en el año catorce de la guerra, según Polibio.")),
    carales: f(SIN_C, h("Polibio 1.88.12; Polibio 3.10.3", "historico", "«principal puerto» no está en ningún pasaje y se quitó", "Ciudad púnica de Cerdeña. Según Polibio, Cartago cedió la isla a Roma tras la guerra de los mercenarios; el año 238 se saca del contexto, no del pasaje.")),
    emporion: f(SIN_C, h("Livio 21.60.2-3; Polibio 3.76.1; Estrabón 3.4.8", "historico", "Estrabón dice «masaliota», no «griega»; el año 218 se deduce de la campaña", "Colonia fundada por los masaliotas (de Massalia), según Estrabón, en la costa de Hispania. Cneo Escipión desembarcó allí con su ejército, según Livio y Polibio, y desde allí ganó a las poblaciones de la costa hasta el Ebro. El año 218 se deduce de la campaña.")),
    saguntum: f(SIN_C, h("Livio 21.7; Polibio 3.15.2-5 y 3.17.9", "historico", null, "Ciudad de Hispania, a una milla del mar, la más rica al sur del Ebro según Livio; se decía fundada por colonos de Zacinto. Aníbal la sitió y, según Polibio, la tomó al asalto tras ocho meses; Roma la consideraba bajo su protección. De ahí vino la Segunda Guerra Púnica.")),
    carthagonova: f(SIN_C, h("Polibio 2.13.1; Polibio 3.15.3", "probable", "en 280 es un poblado íbero (probable); el nombre «Poblado íbero» es genérico y licencia de juego: las fuentes no dan un nombre y no se inventa uno; Asdrúbal la funda hacia 228, año moderno (Polibio 2.13.1, sin año). Diodoro 25.12 no trata de la fundación y se quitó", "No existía como ciudad cartaginesa en 280. Según Polibio, Asdrúbal fundó la ciudad llamada Cartago o «Ciudad Nueva», buena base para actuar en Hispania o en Libia; luego fue la capital cartaginesa en Hispania. Polibio no da el año; «hacia 228» es fecha moderna.")),
    ambracia: f(SIN_C, h("Estrabón 7.7.6; Livio 38.4.7-9", "historico", null, "Fue residencia real de Pirro, según Estrabón, que la adornó mucho. En 189 el cónsul romano la sitió y, según Livio, los etolios acudieron en su defensa: Eupólemo entró en la ciudad con mil soldados ligeros.")),
    pella: f(SIN_C, h("Livio 44.45.5; Livio 45.29.8-9", "historico", "«capital del reino» queda sin fuente (Justino 24.5 y Pausanias 10.19.7 sin abrir)", "Ciudad de Macedonia. Tras la victoria romana de Pidna, en 168, se rindió con casi todo el país, según Livio. Roma dividió Macedonia en cuatro distritos y Pella fue la capital del tercero.")),
    corinthus: f(SIN_C, h("Polibio 2.41; Polibio 2.43.4; Plutarco, Arato 16-24; Livio, Períocas 52", "probable", "guarnición macedonia en 280: probable (consta solo cuando Arato la toma, 243). Livio, Períocas 52 (Mumio, 146) sin abrir", "Según Polibio, Corinto no estaba entre las primeras ciudades de la Liga Aquea: Arato tomó la ciudadela, que tenía Antígono, y la incorporó a la Liga. No sabemos si ya había guarnición macedonia en 280. Mumio la saqueó en 146.")),
    carthago: f(SIN_C, h("Livio, Períocas 51.1-5", "historico", "sin general con nombre en 280 (H6); «Asdrúbal el Beotarca» es de 149-146. Apiano, Libyca 127-132 sin abrir: los «seis días» y los «50.000» se quitaron", "Gran potencia del mar. En 146 cayó ante Escipión Emiliano tras un asedio largo, según las Períocas de Livio, que la dan capturada «por partes» y en el año setecientos desde su fundación. La mujer de su jefe Asdrúbal se arrojó a las llamas con sus hijos."))
  };

  // ---- Hechos (D.EVENTS). D.EVENTS es una lista sin id. El id de la ficha es «<año>-<clave>» y se casa por el AÑO (cada año sale una sola vez).
  //      Si data.js añade un hecho, hay que añadir su ficha con el mismo año; el juez dice cuál falta. R.de('hecho', 280) devuelve el primero de ese año; el id completo ('280-pirro') elige. Dos hechos del mismo año llevan `k` en data.js. ----
  const SIN_E = { sin: 'un hecho no tiene modelo 3D' };
  const hecho = {
    '280-fundacion': f(SIN_E, h('Plutarco, Pirro 15', 'historico', null, 'El año 280 a.C. era el 474 de Roma contando desde su fundación. Pirro llegó con unos 25.500 hombres y 20 elefantes, según Plutarco; una tormenta dispersó parte de la flota.')),
    '280-pirro': f(SIN_E, h('Plutarco, Pirro 17 y 21; Apiano, Samn. 10; Livio, Períocas 12-13', 'historico', 'la marcha sobre Roma fue en 280, tras Heraclea; que su ejército ataque tus ciudades, en dos oleadas pequeñas (a los 32 y 42 meses; Plutarco habla de unos 25.000 hombres y 20 elefantes, Pirro 15-17), y las levas extra de Roma son licencia de juego', 'El avance fue en 280, tras Heraclea. Según Plutarco, Pirro llegó a unos 300 estadios de Roma, unos 55 km. Ásculo le costó tanto que habría dicho que otra victoria igual lo hundiría.')),
    '272-tarento': f(SIN_E, h("Livio, Períocas 14.9-10 y 15.1; Plutarco, Pirro 34", "historico", "«murió en Argos» se quitó: no aparece en Pirro 34", "Según las Períocas de Livio, una flota cartaginesa acudió en ayuda de Tarento en 272, y después la ciudad fue sometida. Pirro murió en un combate callejero cuando una mujer le arrojó una teja, según Plutarco.")),
    '264-primera-punica': f(SIN_E, h('Polibio 1.10-11; Polibio 1.63', 'historico', 'los ataques cartagineses a tus ciudades son licencia de juego', 'Los mamertinos pidieron ayuda a Cartago y a Roma. Según Polibio, no decidió el Senado: votó el pueblo, y se envió al cónsul Apio Claudio. La guerra duró 24 años seguidos.')),
    '260-milas': f(SIN_E, h('Polibio 1.20-23', 'historico', 'Polibio 1.22: «alguien les sugirió» el corvus; no nombra a Duilio', 'Roma copió una nave cartaginesa varada para hacer su flota, según Polibio. Alguien sugirió el corvus, una pasarela de abordaje, sin nombre. En Milas los cartagineses perdieron 50 de 130 naves.')),
    '241-egadas': f(SIN_E, h("Polibio 1.61-63", "historico", null, "La flota romana hundió 50 naves cartaginesas y apresó 70 con sus tripulaciones, según Polibio. Cartago aceptó pagar 2.200 talentos euboicos en 20 años; Roma añadió 1.000 y redujo el plazo a la mitad (3.200 en total, cuenta nuestra).")),
    '225-telamon': f(SIN_E, h("Polibio 2.23; Polibio 2.28; Polibio 2.31", "historico", "cifra de infantes según la edición: Polibio 2.23.4 (Thayer) da 50.000; otras traducciones dan 150.000. Nombre del cónsul: Gayo Atilio (2.27-28)", "Galos de varias tribus (ínsubres, boyos, gesatos, tauriscos) se reunieron, según Polibio, con unos 50.000 infantes y 20.000 jinetes y carros; alguna traducción da 150.000 infantes. Roma movilizó a toda Italia. En Telamón murieron 40.000 galos y unos 10.000 fueron presos; el cónsul Gayo Atilio cayó luchando.")),
    '218-anibal': f(SIN_E, h("Polibio 3.56; Polibio 3.74", "historico", "«Aníbal ad portas» es una frase de época posterior", "Según Polibio, que cita la columna de Aníbal en Lacinio, llegó a Italia con 12.000 libios, 8.000 íberos y unos 6.000 jinetes. Tras el Trebia, la lluvia y la nieve mataron a todos sus elefantes menos uno.")),
    '216-cannas': f(SIN_E, h("Polibio 3.107-117; Livio 22.49; Livio 23.2-7", "historico", "bajas: Polibio y Livio no coinciden; se dice «según». «Roma no negoció» se quitó: sin cotejar. La caída de Capua en 216 es histórica (Livio 23.2-7: decide el pueblo con la mayoría del senado; Livio 23.7: pacto de Aníbal con sus magistrados y tropas para guarnecerla). Licencia de juego: el umbral de 150 hombres, la guarnición cartaginesa de Capua y el segundo ejército de Aníbal contra ti", "Aníbal envolvió al ejército romano de ocho legiones y sus aliados. Según Polibio murieron unos 70.000 infantes; según Livio, 45.500 infantes y 2.700 jinetes (48.200 en total). Capua se pasó a Aníbal por voto del pueblo y de la mayoría de su senado, con un pacto que respetaba a sus magistrados. En el juego, solo resiste con 150 hombres de guarnición (licencia).")),
    '214-filipo': f(SIN_E, h("Polibio 7.9; Livio 24.40", "historico", "Filipo nunca llegó a Italia: su ataque a ciudades romanas es licencia de juego", "Filipo V pactó con Aníbal, y Polibio conserva el texto del tratado. Según Livio, la guerra con Filipo estalló ese verano, cuando legados de Orico pidieron ayuda al pretor Valerio, que guardaba Brindisi con su flota.")),
    '212-siracusa': f(SIN_E, h("Plutarco, Marcelo 15 y 19; Livio 25.31; Polibio 8.7-8", "historico", "la frase sobre los círculos no está en Livio ni en Plutarco", "Marcelo tomó Siracusa en 212, tras un asedio de casi tres años. Un soldado mató a Arquímedes; según Plutarco, Marcelo se afligió y honró a sus parientes. La frase «no molestes a mis círculos» no está ni en Livio ni en Plutarco.")),
    '209-cartagonova': f(SIN_E, h('Polibio 10.8-14; Livio 26.44-46', 'historico', null, 'Escipión la tomó en un solo asalto, aprovechando el reflujo, según Polibio. El defensor Magón tenía 1.000 soldados y armó a unos 2.000 ciudadanos.')),
    '202-zama': f(SIN_E, h('Polibio 15.5; Polibio 15.9-11; Livio 30.33', 'historico', null, 'Los cartagineses tenían más de 80 elefantes, según Polibio. Escipión dejó pasillos entre sus manípulos, y Masinisa aportó unos 4.000 jinetes númidas.')),
    '197-cinoscefalas': f(SIN_E, h("Polibio 18.26; Livio 33.10", "historico", null, "Según Polibio, un tribuno, por iniciativa propia y con unos veinte manípulos, rodeó a la falange y la atacó por la espalda; los hombres de la falange no pueden volverse uno a uno, y la batalla se decidió.")),
    '168-pidna': f(SIN_E, h("Livio 44.42; Plutarco, Emilio Paulo 23; Livio 45.29", "historico", "«repúblicas» corregido a «distritos» (Livio 45.29.8-9); los consejos y magistrados anuales quedan sin releer", "En Pidna, la infantería de Perseo fue masacrada y el rey huyó, según Livio. Después Macedonia se dividió en cuatro distritos, y pagaron a Roma la mitad del tributo que daban a sus reyes.")),
    '149-delenda': f(SIN_E, h('Plutarco, Catón 27', 'historico', 'la frase corta «Carthago delenda est» es una síntesis posterior', 'Según Plutarco, Catón añadía a su voto sobre cualquier asunto que Cartago debía ser destruida. Nasica replicaba lo contrario. La frase latina corta es una síntesis posterior.')),
    '275-benevento': f(SIN_E, h("Plutarco, Pirro 25-26; Livio, Períocas 14.3", "historico", "el detalle de los elefantes contra los suyos y los 500 jinetes se quitó: sin cotejar", "El cónsul Manio Curio Dentato derrotó a Pirro cuando este atacó su campamento de noche. Según Plutarco, algunos elefantes quedaron atrás y fueron capturados. Pirro volvió al Epiro con 8.000 infantes.")),
    '243-arato': f(SIN_E, h('Polibio 2.43; Plutarco, Arato 16-24', 'historico', 'el año 243 se deduce de Polibio 2.43 («un año antes de la derrota cartaginesa»)', 'Arato de Sición tomó la ciudadela de Corinto a la guarnición macedonia y la unió a la Liga Aquea. Según Polibio, ocurrió un año antes de la derrota cartaginesa; el 243 se deduce.')),
    '228-cartagonova': f(SIN_E, h("Polibio 2.13.1", "probable", "ninguna fuente da el año; 228 es la fecha de los historiadores modernos. Diodoro 25.12 no trata de la fundación y se quitó", "Asdrúbal fundó la Ciudad Nueva en Iberia, según Polibio. Polibio no da el año: «hacia 228» es la fecha de los historiadores modernos, por eso es probable.")),
    '217-trasimeno': f(SIN_E, h('Polibio 3.83-85; Livio 22.4-7', 'historico', 'el aviso sobre Capua y el plazo para guarnecerla con 150 hombres son licencia de juego', 'Aníbal emboscó con niebla al cónsul Flaminio, que murió. Cayeron 15.000 romanos, según Polibio y Livio. Aníbal perdió 1.500 según Polibio y 2.500 según Livio.')),
    '207-metauro': f(SIN_E, h('Polibio 11.1-3; Livio 27.47-49', 'historico', 'cifras: Polibio y Livio no coinciden; se dice «según»', 'Los cónsules Nerón y Salinátor vencieron a Asdrúbal, que murió. Las cifras difieren: unos 10.000 cartagineses muertos según Polibio, 56.000 según Livio.')),
    '206-ilipa': f(SIN_E, h('Polibio 11.20-24; Livio 28.12-15', 'historico', 'cifras: Polibio y Livio no coinciden; se dice «según»', 'Escipión invirtió su orden de batalla: íberos al centro y legiones a las alas. Según Polibio, Asdrúbal tenía 70.000 infantes; según Livio, unos 50.000. Una tormenta salvó su campo.')),
    '190-magnesia': f(SIN_E, h("Livio 37.37-44; Apiano, Siria 30-36", "historico", null, "El cónsul Lucio Escipión, con Eumenes, venció a Antíoco III. Según Livio, murieron unos 50.000 infantes y 3.000 jinetes de Antíoco, y de los romanos 300 infantes y 24 jinetes. Apiano da cifras muy parecidas. Su hermano el Africano estaba enfermo.")),
    '146-corinto-cartago': f(SIN_E, h("Pausanias 7.16; Livio, Períocas 51-52", "historico", "los «seis días» de Apiano se quitaron: Apiano, Libyca 127-132 sin abrir", "Mumio venció a la Liga Aquea en el Istmo y saqueó Corinto. Ese año Escipión Emiliano tomó Cartago, que según las Períocas de Livio cayó «por partes», y la ciudad ardió."))
  };

  // ---- Misiones del Senado (D.MISIONES, Q7). Se casan por id. Las condiciones y cifras son licencia de juego. ----
  const SIN_MIS = { sin: 'una misión no tiene modelo 3D' };
  const mision = {
    'levas-heraclea': f(SIN_MIS, h('Plutarco, Pirro 17; Eutropio 2.11', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'Pirro ha vencido en Heraclea. El Senado manda alistar nuevas legiones: reúne 300 hombres en armas.')),
    'presidio-regio': f(SIN_MIS, h('Polibio 1.7; Livio, Períocas 12', 'probable', 'plazos, premios, castigos y cifras: licencia de juego', 'Una guarnición romana ha de sostener la Campania. Mantén 100 hombres en Capua.')),
    'fundar-colonia': f(SIN_MIS, h('Veleyo Patérculo 1.14; Livio, Períocas 15 y 19', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'El Senado manda asentar colonos en tierras conquistadas. Envía colonos y funda una colonia.')),
    'colonias-latinas': f(SIN_MIS, h('Livio, Períocas 14 y 15; Veleyo Patérculo 1.14', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'Roma asienta colonos en tierras conquistadas (Paestum, Cosa, Ariminum). Ten 3 ciudades propias.')),
    'flota-260': f(SIN_MIS, h('Polibio 1.20 y 1.23', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'Roma no tiene flota contra Cartago. Levanta un puerto de nivel 3 (la flota de Mylae se botó en 260).')),
    'grano-sicilia': f(SIN_MIS, h('Cicerón, Verrinas 3.12 (ley de Hierón); Polibio 1.16', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'Sicilia alimenta a Roma con su diezmo de grano. Abre 2 rutas comerciales.')),
    'templo-ver-sacrum': f(SIN_MIS, h('Livio 22.9 y 22.10', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'Tras el desastre del Trasimeno el Senado vota templos y ofrendas. Templo de nivel 2 en Roma.')),
    'almacen-grano': f(SIN_MIS, h('Livio 22.37', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'Hierón de Siracusa envía trigo y cebada. Almacén de nivel 4 en Roma para guardarlos.')),
    'muralla-roma': f(SIN_MIS, h('Livio 22.8 y 22.55', 'probable', 'plazos, premios, castigos y cifras: licencia de juego', 'Aníbal está en Italia. Muralla de nivel 4 en Roma.')),
    'armas-canas': f(SIN_MIS, h('Livio 22.57 y 23.14', 'probable', 'plazos, premios, castigos y cifras: licencia de juego', 'Tras Cannas faltan armas. Levanta una herrería de nivel 3 en cualquiera de tus ciudades.')),
    'tributo-zama': f(SIN_MIS, h('Polibio 15.18; Livio 30.37', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'Cartago pagará una indemnización tras Zama. Ten 600 de oro en las arcas.')),
    'levas-macedonia': f(SIN_MIS, h('Livio 31.6 a 31.8; Polibio 6.19 a 6.21', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'El Senado declara la guerra a Filipo V. Cuartel de nivel 5 en Roma para instruir legiones.')),
  };

  // ---- Leyes del Senado nuevo (D.LEYES, SN1). Se casan por id. Las posturas de los bandos, los efectos y los chips son licencia de juego. ----
  const SIN_LEY = { sin: 'una ley no tiene modelo 3D' };
  const ley = {
    "guerra-cartago": f(SIN_LEY, h("Polibio, Historias 1.10–11", "historico", "cifras y efectos: licencia de juego", "En 264 a.C. los mamertinos de Mesina piden ayuda a Roma; el Senado la acepta y empieza la primera guerra púnica.")),
    "guerra-tarento": f(SIN_LEY, h("Livio, Periocha 12", "probable", "cifras y efectos: licencia de juego", "En 282–281 a.C. Tarento ataca a la flota romana en su bahía; la guerra atrae a Pirro, que llega en 280.")),
    "paz-pirro": f(SIN_LEY, h("Plutarco, Vida de Pirro 18–19", "historico", "cifras y efectos: licencia de juego", "Hacia 279 a.C. Cineas, enviado de Pirro, propone la paz en Roma; el anciano Apio Claudio Ceco hace rechazarla.")),
    "paz-cartago": f(SIN_LEY, h("Polibio, Historias 1.62", "historico", "cifras y efectos: licencia de juego", "En 241 a.C., tras la batalla de las Égadas, Cartago firma con Lutacio Catulo el tratado que pone fin a la primera guerra púnica.")),
    "leva-volones": f(SIN_LEY, h("Livio, 22.57", "historico", "cifras y efectos: licencia de juego", "En 216 a.C., tras Cannas, Roma arma a esclavos voluntarios, los volones, y les promete la libertad al acabar la guerra.")),
    "leva-sin-bienes": f(SIN_LEY, h("Livio, 24.11", "probable", "cifras y efectos: licencia de juego", "Hacia 214 a.C., con Aníbal en Italia, el Senado arma a ciudadanos de la clase más baja del censo.")),
    "ley-grano-barato": f(SIN_LEY, h("Plutarco, Vida de Cayo Graco (referencia posterior)", "licencia de juego", "ley inventada para el juego: la de Cayo Graco es de 123 a.C.", "El reparto de grano llega después: la ley de Cayo Graco es de 123 a.C. Esta ley es licencia de juego.")),
    "ley-claudia": f(SIN_LEY, h("Livio, 21.63", "historico", "cifras y efectos: licencia de juego", "En 218 a.C., la ley Claudia prohíbe a los senadores naves de más de 300 ánforas de carga.")),
    "obra-anio-vetus": f(SIN_LEY, h("Frontino, Sobre los acueductos de Roma, 6", "historico", "cifras y efectos: licencia de juego", "Hacia 272 a.C. se construye el Anio Vetus, segundo acueducto de Roma, pagado con botín de la guerra de Pirro.")),
    "obra-via-flaminia": f(SIN_LEY, h("Livio, Periocha 20", "probable", "cifras y efectos: licencia de juego", "En 220 a.C. el censor Cayo Flaminio abre la calzada que lleva su nombre hacia el norte de Italia.")),
    "ciudadania-sabinos": f(SIN_LEY, h("Veleyo Patérculo, Historia romana, 1.14", "probable", "cifras y efectos: licencia de juego", "En 268 a.C. Roma concede la ciudadanía a los sabinos, que pasan a votar y a servir en las legiones.")),
    "ciudadania-capua": f(SIN_LEY, h("Livio, 8.14", "historico", "cifras y efectos: licencia de juego", "En 338 a.C. Roma da a Capua la ciudadanía sin voto (civitas sine suffragio): cargas romanas sin voto en Roma."))
  };

  // ---- Facciones (D.FACTIONS). Sin modelo: solo un nombre y un color. Fuente: H1-ciudades.md y H1-hechos.md ----
  const SIN_F = { sin: 'sin modelo: la facción es un nombre y un color' };
  const faccion = {
    roma: f(SIN_F, SIN_H),
    cartago: f(SIN_F, h('Polibio 1.10-11', 'historico', 'sus ataques desde 264 son licencia de juego')),
    epiro: f(SIN_F, h('Plutarco, Pirro 15', 'historico')),
    macedonia: f(SIN_F, h('Polibio 7.9', 'historico', 'sus ataques desde 214 son licencia de juego')),
    aquea: f(SIN_F, h('Polibio 2.41 y 2.43', 'historico', 'no existía con Corinto en 280: entra en 243 (hecho de Arato)')),
    siracusa: f(SIN_F, h('', 'licencia de juego', 'no estaba unificada en 280')),
    galos: f(SIN_F, h('Polibio 2.17 y 2.22-23', 'historico', 'el ataque desde 270 es licencia de juego')),
    etruscos: f(SIN_F, h('Livio 5.1', 'licencia de juego', 'eran ciudades-Estado federadas, no una nación')),
    campanos: f(SIN_F, h('Polibio 1.7; Livio 8.14', 'licencia de juego', 'Capua y Messana comparten facción por comodidad')),
    iberos: f(SIN_F, SIN_H),
    griegos: f(SIN_F, h('Estrabón 3.4.8', 'licencia de juego', 'colonos griegos de Emporion')),
    mamertinos: f(SIN_F, h('Polibio 1.7-8; Diodoro 21.18', 'historico', 'mercenarios campanos de Agatocles que tomaron Messana')),
    akragas: f(SIN_F, h('Diodoro 22.8; Polibio 1.17-19', 'licencia de juego', 'una sola facción para una ciudad griega independiente'))
  };

  // ---- Mejoras de herrería (D.FORJA). Sin modelo; la herrería tampoco dibuja nada ----
  const SIN_M = { sin: 'sin modelo: solo un icono' };
  const mejora = { armas: f(SIN_M, SIN_H), armaduras: f(SIN_M, SIN_H) };

  // ---- Tipos de ciudad (D.TIPOS). Licencia de juego: nadie «elegía» su oficio así. Sin modelo ----
  const SIN_T = { sin: 'sin modelo: solo un icono' };
  const T_H = h('Livio 27.9-10; Gelio 16.13', 'licencia de juego', 'colonia y municipium eran estatus jurídicos (Livio 27.9-10 sobre las colonias latinas; Gelio 16.13 sobre municipios y colonias); emporion es el término griego para puerto de comercio; el reparto de oficios es invención del juego');
  const tipo = { municipio: f(SIN_T, T_H), agraria: f(SIN_T, T_H), militar: f(SIN_T, T_H), emporio: f(SIN_T, T_H), naval: f(SIN_T, T_H), saber: f(SIN_T, T_H) };

  // ---- Bienes especiales (D.ESPECIAL, B1). El mecanismo «tener acceso abre niveles y tropas» es licencia de juego; aquí va la fuente de que cada ciudad lo diera ----
  const MEC = ' · el mecanismo (abrir niveles y tropas) es licencia de juego';
  const especial = {
    sal: f(SIN_T, h("Livio 1.33.9", "probable", "Livio cuenta que Anco Marcio fundó Ostia y estableció salinas junto a ella (1.33.9): tradición del rey, pero las salinas de Ostia son bien conocidas. Plinio NH 31.89 y la vía Salaria siguen sin cotejar; Lilibeo y Carales, sin fuente (licencia de juego)" + MEC)),
    vino: f(SIN_T, h("Polibio 3.91.1-2", "por cotejar", "Polibio llama a la llanura de Capua la más famosa de Italia por su fertilidad y su belleza (3.91). El vino falerno es fama que recoge Plinio (NH 14.62, no se pudo abrir) y no está comprobado; Messana, Agrigentum y Emporion: licencia de juego" + MEC)),
    caballos: f(SIN_T, h("Livio 23.46", "probable", "Livio muestra una caballería campana numerosa y bien considerada en 216 a.C. (23.46); no habla de cría de caballos, así que el vínculo con el bien es una inferencia. Tarento: licencia de juego" + MEC)),
    hierro: f(SIN_T, h("Diodoro 5.13; Livio 28.45", "historico", "Diodoro describe la isla de Etalia (Elba), frente a Populonia, de la que se saca mucho hierro. Livio cuenta que Populonia ofreció hierro a Escipión en 205. Saguntum: licencia de juego" + MEC)),
    plata: f(SIN_T, h("Estrabón 3.2.10 (= Polibio 34.9.8-9)", "historico", "Polibio, citado por Estrabón, cuenta que las minas de plata de Cartago Nova empleaban a 40.000 obreros y daban al tesoro romano 25.000 dracmas al día; la cifra es ya de época romana" + MEC)),
    marmol: f(SIN_T, h("Estrabón 9.1.23; Estrabón 10.5.7", "probable", "Estrabón, hacia el cambio de era, describe las canteras del Pentélico y el Himeto junto a Atenas y la piedra de Paros, la mejor para escultura. Es testimonio posterior, pero las canteras son antiguas. Corinto y Pella: licencia de juego. El mármol de Luna (Carrara) es del siglo I a.C. y no se usa" + MEC)),
    purpura: f(SIN_T, h('Plinio, NH 9.127', 'por cotejar', 'tinte fenicio de Cartago' + MEC)),
    maderanaval: f(SIN_T, h('', 'por cotejar', 'astilleros de Siracusa y Panormus sin cotejar' + MEC)),
    pieles: f(SIN_T, h("Estrabón 5.1.8; Estrabón 5.1.12", "licencia de juego", "Estrabón cuenta que en Aquileya se comerciaban esclavos, ganado y pieles (5.1.8) y que la llanura del Po era rica en ganado (5.1.12). No nombra pieles de Mediolanum ni de Ambracia" + MEC))
  };

  // ---- Regiones (D.REGIONES, I6). Se casan por id. Qué ciudades entran y el corte de fechas son licencia de juego. ----
  const SIN_REG = { sin: 'una región es una ficha de datos; no tiene modelo 3D' };
  const region = {
    mediterraneo: f(SIN_REG, h('Polibio 1.1-3 (de 264 a 146 a.C.); Livio, Períocas 51', 'historico', 'la campaña entera de 280 a 146 a.C. con todas las ciudades del mapa; la caída de Cartago en 146 a.C. es el cierre histórico', 'Roma contra Cartago por el dominio del Mediterráneo, de Pirro a la destrucción de Cartago.')),
    italia: f(SIN_REG, h('Plutarco, Pirro 13-25; Polibio 1.6-7 y 2.14-35', 'licencia de juego', 'campaña corta en la península y Sicilia oriental contra Tarento (cayó en 272); Tarentum sigue de Epiro, Volsinii etrusca y Mediolanum gala, y la fecha de corte es de jugabilidad', 'La Italia de Pirro: Roma contra Tarento, la ciudad que llamó al rey del Epiro.'))
  };

  // ---- Modos de partida (D.MODOS, I8). Se casan por id. Los factores, el año tope y la duración son licencia de juego (nota en gobierno/historia/I8-partida-corta.md). ----
  const SIN_MODO = { sin: 'un modo de partida es una ficha de datos; no tiene modelo 3D' };
  const modo = {
    campana: f(SIN_MODO, h('Polibio 1.1-3; Livio, Períocas 51', 'historico', 'la campaña de 280 a 146 a.C.: es la de siempre, sin factores ni tope de horas')),
    corta: f(SIN_MODO, h('Plutarco, Pirro 13-25; Polibio 1.6-7 y 2.14-35; Eutropio 2.11-14', 'licencia de juego', 'Roma contra Tarento (Epiro) en Italia es histórico; fundar de la nada, el rival único, las tres edades, el año tope y la duración de 2 a 4 horas son licencia de juego. Sin Roma ni Capua, la primera colonia hace de capital (las colonias latinas de Beneventum, 268 a.C., y Cosa, 273 a.C., son históricas)', 'Una partida de unas horas: conquista Tarento antes de que se acabe el plazo, con Roma y Capua en pie o fundando tu primera ciudad.'))
  };

  // ---- Zonas del mapa (D.ZONAS, C6). Se casan por id. Los límites son agrupación de juego. ----
  const SIN_ZONA = { sin: 'una zona es una ficha de datos; no tiene modelo 3D' };
  const zona = {
    italia: f(SIN_ZONA, h('Polibio 2.14-35 (descripción de Italia); Estrabón 5', 'licencia de juego', 'Italia es el nombre romano de la península; los límites de la zona son agrupación de juego, licencia de juego (Mediolanum, gala en la época, entra por cercanía)')),
    sicilia: f(SIN_ZONA, h('Polibio 1.8-11 y 1.38-44; Estrabón 6.2', 'licencia de juego', 'Sicilia es el nombre antiguo de la isla; sus ciudades se agrupan por geografía y los límites de la zona son licencia de juego')),
    sardinia: f(SIN_ZONA, h('Estrabón 5.2; Polibio 1.79', 'licencia de juego', 'Sardinia es el nombre latino de Cerdeña; la zona es agrupación de juego, licencia de juego')),
    hispania: f(SIN_ZONA, h('Polibio 3.13-15; Estrabón 3', 'licencia de juego', 'Hispania es el nombre romano de la península Ibérica; solo entran las ciudades de la costa del juego, licencia de juego')),
    graecia: f(SIN_ZONA, h('Polibio 2 y 18; Estrabón 8', 'licencia de juego', 'Graecia agrupa Epiro, Macedonia y Grecia propia; la unidad es agrupación de juego, licencia de juego')),
    africa: f(SIN_ZONA, h('Polibio 1.73 y 15.5-14; Estrabón 17.3', 'licencia de juego', 'Africa es la costa cartaginesa; la zona es agrupación de juego, licencia de juego'))
  };

  // ---- Saberes y edades (D.INVEST y D.EDADES, I5). Fuente: gobierno/estudios/P93-ciencia.md §3. Las cifras, los nombres de edad y el árbol entero son licencia de juego. ----
  const SIN_I = { sin: 'un saber es una ficha de datos; no tiene modelo 3D' };
  const invest = {
    griego: f(SIN_I, h("Suetonio, De grammaticis 1; Cicerón, Bruto 72: Livio Andronico, griego de Tarento, enseña hacia 272 a.C.", "probable", "La Escuela como edificio es licencia de juego.")),
    apio: f(SIN_I, h("Livio 9.29; Frontino, De aquaeductu 4-6: Vía Apia y Aqua Appia (312 a.C.).", "probable", "Cifras: licencia de juego.")),
    castra: f(SIN_I, h("Polibio 6.27-39: campamento, castigos y premios.", "probable")),
    quinque: f(SIN_I, h("Polibio 1.20: Roma copia una nave cartaginesa varada (260 a.C.); Tarento y otros aliados prestan naves (1.20.14).", "historico", "Cifra: licencia de juego.")),
    corvus: f(SIN_I, h("Polibio 1.22: pasarela de abordaje (cotejado en H1).", "historico", "Cifra: licencia de juego.")),
    remeros: f(SIN_I, h("Polibio 1.21: remeros adiestrados en bancos sobre la arena.", "historico", "Cifra: licencia de juego.")),
    fasti: f(SIN_I, h("Livio 9.46: Cneo Flavio publica el derecho y el calendario (304 a.C.).", "probable")),
    vina: f(SIN_I, h("Catón, De agri cultura 1.7: la viña, primera en rendimiento.", "probable", "Cifras: licencia de juego.")),
    trigo: f(SIN_I, h("Cicerón, Verrinas 3: lex Hieronica, el diezmo de Hierón que Roma conserva.", "probable")),
    pilum: f(SIN_I, h("Polibio 6.23.9-11 (dentro del tramo 6.21-23 ya cotejado).", "historico", "Cifra: licencia de juego.")),
    latif: f(SIN_I, h("Catón, De agri cultura 2.7 y 56-59; la crisis del pequeño campesino es tesis moderna (Toynbee).", "probable", "Cifras: licencia de juego.")),
    colon: f(SIN_I, h("Polibio 2.21: ley de Flaminio, ager Gallicus (232 a.C.).", "probable")),
    sambuca: f(SIN_I, h("Polibio 8.4-6 (dentro del tramo 8.5-8 cotejado): Marcelo y las sambucas sobre barcos en Siracusa.", "historico")),
    arquimedes: f(SIN_I, h("Polibio 8.5-8; Plutarco, Marcelo 15-17 (cotejados).", "historico", "Cifra: licencia de juego.")),
    astilleros: f(SIN_I, h("Polibio 1.20-21: la flota se levanta desde cero.", "historico", "Que sustituya al bien especial: licencia de juego.")),
    derrota: f(SIN_I, h("Polibio 3.22-25: tratados de comercio Roma-Cartago (ya citado en D.RUTA).", "historico", "Cifras: licencia de juego.")),
    medicina: f(SIN_I, h("Plinio, NH 29.12-14: Arcágato, primer médico griego, 219 a.C.; apodado «verdugo»; Catón desconfiaba.", "probable", "Cifras: licencia de juego.")),
    magon: f(SIN_I, h("Plinio, NH 18.22-23 (y Varrón, RR 1.1.10): el Senado manda traducir los 28 libros de Magón tras 146 a.C.", "probable")),
    perseo: f(SIN_I, h("Plutarco, Emilio Paulo 28; Polibio 31.23-25: los libros de Perseo pasan a los hijos de Paulo, entre ellos Escipión Emiliano (168 a.C.).", "probable")),
    acoger: f(SIN_I, h("Plutarco, Catón 22; Gelio 6.14: embajada de Carnéades (155 a.C.).", "probable")),
    expulsar: f(SIN_I, h("Suetonio, De rhetoribus 1; Gelio 15.11: expulsión de 161 a.C.", "probable")),
    hormigon: f(SIN_I, h("Livio 35.10: Pórtico Emilio (193 a.C.), primeros usos del hormigón.", "probable", "Cifra: licencia de juego."))
  };
  const edades = {
    E2: f(SIN_I, h("Polibio 1.5-6 (periodización de 264 a 219 a.C.).", "licencia de juego", "La división en edades es licencia de juego.")),
    E3: f(SIN_I, h("Hechos de D.EVENTS (218-201 a.C.).", "licencia de juego", "La división en edades es licencia de juego.")),
    E4: f(SIN_I, h("Polibio 1.1-3 (200-146 a.C.).", "licencia de juego", "La división en edades es licencia de juego."))
  };

  // ---- Sitios de colonias (D.COLONIAS, CN5-A). Sin modelo propio: el sitio es un punto del mapa. Fechas y colonos: por cotejar salvo lo anotado ----
  const SIN_COL = { sin: 'un sitio de colonia no tiene modelo 3D propio; se funda con la escena común de la ciudad' };
  const LJ = ' · posición aproximada y que el jugador la funde cuando quiera: licencia de juego';
  const colonia = {
    cosa: f(SIN_COL, h('Veleyo Patérculo 1.14.7; Livio, Períocas 14; Brown 1980', 'probable', '273 a.C., latina: Veleyo, por cotejar el pasaje; 4.000 colonos: cifra por cotejar; recinto y foro según Brown 1980, fechas exactas por cotejar' + LJ)),
    ariminum: f(SIN_COL, h('Veleyo Patérculo 1.14.8; Livio, Períocas 15', 'probable', '268 a.C., latina (no de ciudadanos: livius.org la cita mal); 6.000 colonos: cifra por cotejar' + LJ)),
    beneventum: f(SIN_COL, h('Veleyo Patérculo 1.14.6; Livio, Períocas 15', 'probable', '268 a.C., latina: pasaje por cotejar; 2.500 colonos: cifra sin fuente, licencia de juego; sitio movido unas décimas de grado respecto a Capua' + LJ)),
    brundisium: f(SIN_COL, h('Veleyo Patérculo 1.14.8; Livio, Períocas 19', 'probable', '244 a.C. (livius.org da 246: las fuentes difieren), latina; 6.000 colonos: cifra por cotejar' + LJ)),
    placentia: f(SIN_COL, h('Polibio 3.40; Livio 21.25', 'historico', '218 a.C., latina, 6.000 colonos según Polibio 3.40; Livio 21.25 por cotejar' + LJ)),
    cremona: f(SIN_COL, h('Polibio 3.40; Livio 21.25', 'historico', '218 a.C., latina, 6.000 colonos según Polibio 3.40; Livio 21.25 por cotejar; sitio movido para no pisar Placentia' + LJ)),
    bononia: f(SIN_COL, h('Livio 37.57', 'probable', '189 a.C., latina, 3.000 colonos: Livio 37.57 por fuente secundaria, pasaje por cotejar' + LJ)),
    aesernia: f(SIN_COL, h('Veleyo Patérculo 1.14.7', 'por cotejar', '263 a.C., latina: fecha y colonos (2.500, sin fuente, licencia de juego) por cotejar' + LJ))
  };

  // ---- Fiestas del Foro y del Templo (D.FIESTAS, CN13a). Se casan por id. Cotejo: gobierno/historia/CN13-cotejo.md ----
  const SIN_FIESTA = { sin: 'una fiesta no tiene modelo 3D propio; la ciudad solo cambia el aspecto del arca (CN15)' };
  const fiesta = {
    ofrenda: f(SIN_FIESTA, h('Livio 22.9-10 (cotejado); pistas por comprobar: Livio 25.12 y 29.14, Ovidio, Fastos 4', 'licencia de juego', 'El Senado votó ofrendas y ritos tras el Trasimeno (Livio 22.9-10): eso es histórico. Pagarlas con lo que sobra, una al mes, y duplicar el don de un dios son reglas de juego.', 'Tras el desastre del Trasimeno, el Senado votó ofrendas y ritos a los dioses (Livio 22.9-10). Aquí puedes hacer una al mes, y el templo de tu ciudad favorece más a su dios.')),
    juegos: f(SIN_FIESTA, h('Livio 22.9-10 (los ludi magni votados en 217); pistas por comprobar: Livio 25.12 (ludi Apollinares), Livio 29.14, Ovidio, Fastos 4', 'licencia de juego', 'Los ludi eran fiestas públicas reales; su precio ligado al ingreso, el reposo de seis meses y el calmar a una ciudad conquistada son reglas de juego. Los pasajes marcados como pista no se han comprobado.', 'Los ludi eran juegos públicos que pagaban los magistrados o el erario por voto del Senado (Livio 22.9-10). Aquí calman al pueblo y a una ciudad conquistada.'))
  };

  const SIN_REM = { sin: 'un remedio no tiene modelo 3D propio: el dique usa el muro de 0 A.D. como figura provisional (js/gfx/city3d.js, CN13b) y el tejado lo pintará CN15' };
  const remedio = {
    dique: f(SIN_REM, h('Livio 24.9; Livio 30.38 (crecidas del Tíber, por cotejar); sin fuente abierta de diques en 280-146', 'licencia de juego', 'Las crecidas del Tíber están en Livio, pero no se ha comprobado que Roma levantara diques o malecones en esta época: los grandes muros de contención son posteriores. Es una regla de juego para dar remedio a la ribera baja.', 'El Tíber se desbordaba a menudo y anegaba la parte baja de Roma; Livio lo cuenta varias veces. Aquí puedes levantar un dique en la orilla para guardar las casas, aunque no consta que se hiciera así entonces.')),
    tejas: f(SIN_REM, h('Plinio, Historia natural 16.36 (por cotejar: Roma cubierta con tablillas de madera hasta la guerra de Pirro)', 'por cotejar', 'Se cita la pista de Plinio, sin abrir aquí: según ella Roma se cubrió con tablillas de madera hasta la guerra de Pirro (280-275) y después vendrían las tejas. Techar por barrios, su coste y su plazo son reglas de juego.'))
  };

  // ---- Pueblos (D.PUEBLO_TIPOS, J3). Sin modelo. La vida rural (aldeas, villas, pesca) existió; el pueblo como hueco que se funda y sube de nivel es invención del juego ----
  const PU = 'el pueblo como hueco que se funda y mejora es invención del juego';
  const pueblo = {
    lenadores: f(SIN_T, h('Catón, De agri cultura 1', 'licencia de juego', 'la villa rural aprovecha el bosque y la leña; ' + PU)),
    canteros: f(SIN_T, h('Catón, De agri cultura 14', 'licencia de juego', 'la villa rústica se construía con piedra y cal; ' + PU)),
    mineros: f(SIN_T, h('Livio 34.21', 'licencia de juego', 'las minas de hierro y su arriendo en Roma; ' + PU)),
    pescadores: f(SIN_T, h('Varrón, Res rusticae 3.17', 'licencia de juego', 'la pesca y los viveros de peces como negocio de villa costera; ' + PU)),
    agricolas: f(SIN_T, h('Livio 9.13; Varrón, Res rusticae 1', 'licencia de juego', 'vici y pagi como aldeas de labradores; la villa como explotación agraria; ' + PU))
  };

  // ---- Terrenos de colonia (D.TERRENOS, CN19-A). Las reglas y cifras son licencia de juego; la geografía de cada sitio, histórica (pasajes por cotejar) ----
  const SIN_TER = { sin: 'un terreno es un conjunto de reglas sobre el relieve de la ciudad; no tiene modelo 3D propio' };
  const LJ_TER = ' · las cifras de D.TERRENO_REGLAS son inventadas para poder jugar: licencia de juego';
  const terreno = {
    rio: f(SIN_TER, h('Regla de juego: el valle del río de la ciudad común; no es un sitio histórico concreto', 'licencia de juego', 'es el terreno de todas las ciudades que no son colonias y de las partidas antiguas' + LJ_TER)),
    costa: f(SIN_TER, h('Livio 1.33.9; Plinio, NH 31.73-89; Veleyo Patérculo 1.14.7-8', 'licencia de juego', 'Cosa, Brundisium y Ariminum eran colonias de costa (pasajes de Veleyo por cotejar); la sal de las costas: ver salinas' + LJ_TER)),
    pantano: f(SIN_TER, h('Polibio 2.15-17; Livio 21.25', 'licencia de juego', 'Cremona, junto al Po, en tierra baja y húmeda: Polibio describe la llanura del Po y Livio la fundación de 218 a.C. (pasajes por cotejar)' + LJ_TER)),
    terrazas: f(SIN_TER, h('Veleyo Patérculo 1.14.6-7; Livio, Períocas 15', 'licencia de juego', 'Beneventum y Aesernia, colonias en el Samnio montañoso (pasajes por cotejar); las terrazas de cultivo en ladera son una licencia de juego, no un dato de las fuentes' + LJ_TER)),
    llanura: f(SIN_TER, h('Polibio 2.14-17; Livio 21.25; Livio 37.57', 'licencia de juego', 'Placentia y Bononia, en la llanura emiliana y padana, sin defensa natural (pasajes por cotejar)' + LJ_TER))
  };
  // ---- Piezas de ciudad que solo existen en un terreno (D.PIEZAS_TERRENO). Sin modelo: de momento se dibujan con una pieza genérica ----
  const SIN_PZ = { sin: 'sin modelo propio: de momento no se dibuja en la ciudad', provisional: true };
  const piezaTerreno = {
    salinas: f(SIN_PZ, h('Livio 1.33.9; Plinio, NH 31.73-89', 'probable', 'Livio cuenta que Anco Marcio estableció salinas junto a Ostia (tradición del rey, pero las salinas de Ostia son bien conocidas); Plinio habla de la sal marina y de cómo se obtiene. Que estropeen las granjas vecinas y su renta en oro son licencia de juego')),
    zanja: f(SIN_PZ, h('Livio 1.38.6; Livio 1.56.2; Vitruvio 1.4.11-12', 'probable', 'Livio atribuye a Tarquinio Prisco el desagüe del Foro con cloacas; Vitruvio recomienda sanear los sitios encharcados. Que reduzca la ruina de la crecida es licencia de juego'))
  };

  R.fichas = { terreno, piezaTerreno, edificio, tropa, fiesta, remedio, ciudad, hecho, mision, ley, colonia, region, modo, zona, faccion, mejora, tipo, especial, invest, edad: edades, pueblo };

  /* De qué tabla de data.js sale cada tipo y qué campos son obligatorios allí (lo usa el juez).
     numericos: números sueltos · mapas: objetos de números (costes, guarnición) · textos: cadenas · segunClase: extra según cls. */
  R.tipos = {
    edificio: { tabla: 'BUILD', numericos: ['time'], mapas: ['cost'], textos: ['n', 'd'] },
    tropa: { tabla: 'UNITS', numericos: ['atk', 'def', 'spd', 'mor', 'up'], textos: ['n', 'cls'], segunClase: { rng: ['ratk', 'range'] } },
    ciudad: { tabla: 'CITIES', numericos: ['lon', 'lat', 'w', 'wl'], mapas: ['g'], textos: ['n', 'f'] },
    hecho: { tabla: 'EVENTS', lista: true, numericos: ['y'], textos: ['t', 'x'] },
    zona: { tabla: 'ZONAS', numericos: [], textos: ['n'] },
    region: { tabla: 'REGIONES', numericos: ['hasta'], textos: ['n', 'capitalRival'] },
    modo: { tabla: 'MODOS', numericos: [], textos: ['n'] },
    terreno: { tabla: 'TERRENOS', numericos: [], textos: ['n', 'd'] },
    piezaTerreno: { tabla: 'PIEZAS_TERRENO', numericos: [], textos: ['n', 'd'] },
    colonia: { tabla: 'COLONIAS', numericos: ['lon', 'lat', 'anio', 'colonos'], textos: ['n', 'h', 'tipo'] },
    mision: { tabla: 'MISIONES', numericos: ['desde', 'plazo'], textos: ['n', 'texto'] },
    ley: { tabla: 'LEYES', numericos: [], textos: ['n', 'texto'] },
    faccion: { tabla: 'FACTIONS', numericos: [], textos: ['n', 'col'] },
    mejora: { tabla: 'FORJA', numericos: ['time'], mapas: ['cost'], textos: ['n', 'ef'] },
    tipo: { tabla: 'TIPOS', numericos: [], textos: ['n', 'i', 'd'] },
    especial: { tabla: 'ESPECIAL', numericos: [], textos: ['n', 'i', 'd'] },
    pueblo: { tabla: 'PUEBLO_TIPOS', numericos: [], textos: ['n', 'i', 'd'] },
    invest: { tabla: 'INVEST', numericos: ['edad', 'time'], mapas: ['cost'], textos: ['n', 'i', 'rama'] },
    edad: { tabla: 'EDADES', numericos: ['edad', 'time'], mapas: ['cost'], textos: ['n'] },
    fiesta: { tabla: 'FIESTAS', numericos: ['mult', 'min', 'dura', 'reposo'], textos: ['n', 'i', 'd'] },
    remedio: { tabla: 'REMEDIOS', numericos: [], textos: ['n', 'i', 'd'] }
  };

  /* Ficha de una pieza. Para un hecho vale el id completo ('280-pirro') o solo el año (280; si hay dos, el primero). */
  R.de = function (tipo, id) {
    const t = R.fichas[tipo]; if (!t) return null;
    if (t[id]) return t[id];
    if (tipo === 'hecho') { const k = Object.keys(t).find(x => x.split('-')[0] === String(id)); return k ? t[k] : null; }
    return null;
  };

  /* Fichas vacías para copiar y rellenar al añadir contenido nuevo. */
  const ARTE_TROPA = { modelo: 'assets/units/<id>.bin', licencia: 'CC BY-SA 3.0', credito: 'Wildfire Games (0 A.D.)' };   // o { sin: '<motivo>' }; añade provisional: true si el modelo es prestado
  R.plantillas = {
    ciudad: { arte: { sin: 'sin modelo propio: usa la escena común de la ciudad (city3d.js)' }, historia: { fuente: '<autor antiguo y pasaje, p. ej. Polibio 1.7-11>', dictamen: 'por cotejar' } },
    tropa: { arte: ARTE_TROPA, historia: { fuente: '<autor antiguo y pasaje>', dictamen: 'por cotejar' } },
    edificio: { arte: { modelo: 'assets/static/<id>.bin', licencia: 'CC BY-SA 3.0', credito: 'Wildfire Games (0 A.D.)' }, historia: { fuente: '<autor antiguo y pasaje>', dictamen: 'por cotejar' } },
    region: { arte: { sin: 'una región es una ficha de datos; no tiene modelo 3D' }, historia: { fuente: '<autor antiguo y pasaje>', dictamen: 'por cotejar' } },   // el id es el de D.REGIONES
    modo: { arte: { sin: 'un modo de partida es una ficha de datos; no tiene modelo 3D' }, historia: { fuente: '<autor antiguo y pasaje>', dictamen: 'licencia de juego' } },   // el id es el de D.MODOS
    pueblo: { arte: { sin: 'sin modelo: solo un icono' }, historia: { fuente: '<autor antiguo y pasaje>', dictamen: 'licencia de juego' } },
    hecho: { arte: { sin: 'un hecho no tiene modelo 3D' }, historia: { fuente: '<autor antiguo y pasaje>', dictamen: 'por cotejar' } }   // el id es «<año>-<clave>»; el año casa con D.EVENTS
  };

  root.REGISTRO = R;
  if (typeof module !== 'undefined') module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
