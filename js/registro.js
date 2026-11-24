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
  /* GM44c: soldado nuevo de las batallas (js/gfx/soldado.js): cuerpo de MakeHuman y movimientos de Quaternius, CC0 1.0 */
  const nuevo = (m, dibujo) => ({ modelo: 'assets/soldados/' + m + '.bin', licencia: 'CC0 1.0', credito: 'MakeHuman 1.3.2 (cuerpo, esqueleto y pesos) y Quaternius, Universal Animation Library 1 y 2 (movimientos); equipo, ropa y texturas hechos en AQVILA', nota: 'en las batallas; cuatro niveles de detalle (' + m + ', _lejos, _muylejos, _fondo)' + (dibujo ? '. ' + dibujo : '') });   // GM44d: dibujo = el equipo dibujado, con su fuente
  /* CR1: soldado de las batallas que parte de un modelo generado con Meshy (CC BY 4.0, obliga a citar a Meshy); ver assets/soldados/LICENSE.txt */
  const meshy = (m, dibujo, guion) => Object.assign(nuevo(m, dibujo), { licencia: 'CC BY 4.0 (Meshy)', credito: 'Meshy (meshy.ai), modelo generado por el usuario con su cuenta gratuita el 23/11/2026 (cuerpo, ropa, armadura y texturas); manos de MakeHuman 1.3.2 y movimientos de Quaternius (CC0 1.0); aligerado, esqueleto, armas y teñido hechos en AQVILA', fuente: 'https://www.meshy.ai · licencia https://creativecommons.org/licenses/by/4.0/ · conversión: tools/blender/' + guion + '_meshy_ligero.py y ' + guion + '_meshy_juego.py' });
  /* AL11: soldado de las batallas que parte de un modelo generado por el usuario con Meshy, plan de pago (AL1–AL10, 23/11/2026).
     Decisión del usuario: se publica con CC BY-SA 3.0 citando a Meshy como herramienta; ver assets/soldados/LICENSE.txt */
  const meshyPago = (m, dibujo, guion) => Object.assign(nuevo(m, dibujo), { licencia: 'CC BY-SA 3.0 (generado con Meshy) y CC0 1.0', credito: 'modelo generado por el usuario con Meshy (meshy.ai, herramienta), plan de pago, 23/11/2026 (cuerpo, ropa, armadura y texturas); manos y esqueleto de MakeHuman 1.3.2 y movimientos de Quaternius (CC0 1.0); aligerado, esqueleto, armas por código y teñido hechos en AQVILA', fuente: 'https://www.meshy.ai · licencia https://creativecommons.org/licenses/by-sa/3.0/ · conversión: tools/blender/' + guion + '_meshy_ligero.py y ' + guion + '_meshy_juego.py' });
  const uni = (m, extra) => Object.assign({ modelo: 'assets/units/' + m + '.bin', licencia: CC, credito: WG }, extra || {});   // tropa real de 0 A.D.
  const h = (fuente, dictamen, nota, texto) => Object.assign({ fuente, dictamen: dictamen || 'por cotejar' }, nota ? { nota } : {}, texto ? { texto } : {});   // texto: lo que lee el jugador en el Códice
  const f = (arte, historia) => ({ arte, historia });
  const SIN_H = h('', 'por cotejar');   // la auditoría H1 no dice nada de esta pieza
  /* CI1: piezas de la Roma de su siglo, hechas por código en js/gfx/roma-siglo.js (geometría y atlas pintados ahí; arte propio, sin licencia ajena) */
  const propia = nota => ({ modelo: 'js/gfx/roma-siglo.js', licencia: 'propia, por código', credito: 'AQVILA (arte propio, por código)', nota });

  // ---- Edificios (D.BUILD). Modelo: el que usa city3d.js (D.BUILD[b].modelo || b) ----
  const edificio = {
    aserradero: f(est('aserradero'), SIN_H), cantera: f(est('cantera'), SIN_H), mina: f(est('mina'), SIN_H), granja: f(est('granja'), SIN_H),
    viviendas: f(est('casa_b', { nota: 'CI1: en la ciudad romana ya no sale casa.bin (tenía entramado de madera de aspecto medieval): las casas son casa_b, casa_c y casa_d de 0 A.D., estiradas a lo largo de la calle para ir pared con pared, y en los barrios de III y IV parte de ellas son casas de vecinos de dos alturas por código (UR1, 20/11: antes tres pisos; el tercer piso de Livio 21.62 es de 218 a.C.) (rs_insula en js/gfx/roma-siglo.js, arte propio: bajo de tiendas en arco con zócalo rojo, dos pisos de enlucido con ventanas pequeñas, tejado de teja a cuatro aguas; Livio 21.62, el buey que sube a un tercer piso; reparto por barrios y cuántas: licencia de juego). Antes: las ínsulas se dibujaban como manzanas de casas (casa.bin, casa_b, casa_c y casa_d). Según la cultura de la ciudad (E.cultura) se usan las casas griegas grie_casa, _b, _c, _d y _e o las púnicas cart_casa, _b y _c, todas de 0 A.D. (Wildfire Games, CC BY-SA 3.0; assets/static/*.bin, mismo crédito en assets/static/LICENSE.txt). Forma y estilo de época son reconstrucción de 0 A.D.: licencia de juego, sin fuente cotejada' }), h('Livio 21.62', 'historico', 'cotejado el 13/11/2026 en Perseus (trad. Roberts). Livio no da año en el pasaje (solo «este invierno», 218-217); que sean ínsulas de adobe y madera es lectura, y generalizarlas a toda ciudad es licencia de juego', 'En Roma ya había casas de varios pisos. Según Livio, un buey subió por su cuenta hasta el tercer piso de una casa del Foro Boario y se arrojó asustado por la gente. Fuera de Roma, las casas eran más bajas.')),
    foro: f(est('foro', { nota: 'CI1: en la ciudad romana, dos filas de tabernas (tiendas con pórtico de postes y tejado de teja) en los lados largos de la plaza, por código (rs_tabernas en js/gfx/roma-siglo.js, arte propio, sin licencia ajena). Foro alargado con tiendas: CI0 §4 (por cotejar); su número y su sitio exacto son licencia de juego' }), h('Livio 5.55; Livio 41.27 (de memoria, por cotejar)', 'licencia de juego', 'CI1b: el juego traza un eje de puerta a puerta que pasa por el foro. Roma no tenía cardo ni decumano: su eje real era la Vía Sacra, y tras el saqueo galo se reconstruyó deprisa, con calles torcidas (Livio 5.55). Los censores empiedran calles en 174 a.C. (Livio 41.27). CI3a: el recinto Servio encerraba unas 426 ha; la Roma del juego (la urbe a la vista, de radio ≈ 2,2 veces el surco) se dibuja a escala de juego, no a la real')), almacen: f(est('almacen'), SIN_H), mercado: f(est('mercado', { nota: 'los puestos pequeños de ciudad púnica usan prop_puesto_cart.bin (0 A.D., CC BY-SA 3.0)' }), SIN_H), puerto: f(est('puerto'), h('Livio 35.10; Livio 40.51', 'historico', 'cotejado el 13/11/2026 en Perseus (trad. Roberts/Edmonds). 35.10: ediles Lépido y Paulo (193), no censores; el año sale de los cónsules. 40.51: Fulvio (179) hace pilares de puente y mercados; el texto no dice «emporium» ni «pórtico Emilio»', 'Roma tenía su puerto fluvial en el Tíber. Según Livio, en 193 a.C. dos ediles construyeron un pórtico y junto a él un muelle sobre el río. En 179 el censor Fulvio levantó los pilares de un puente y un mercado con columnata fuera de la Porta Trigemina.')),
    cuartel: f(est('cuartel'), SIN_H), establo: f(est('establo'), SIN_H),
    muralla: f(propia('CI1: en la ciudad romana, muralla Servia por código (rs_muro, rs_torre, rs_puerta): sillares de toba ocre-gris en hiladas, coronación plana sin almenas, juntas y algún bastión bajo y liso, puertas con arco entre dos machones. La empalizada de la fase 1 es la de siempre. UR1 (20/11): en Roma la muralla se dibuja de piedra desde la fase 1 (solo vista; la defensa no cambia); con la urbe grande a la vista se dibuja por el borde de fuera, con terraplén y foso (agger) en el tramo llano, sin pisar el agua y con la ribera del río abierta (lectura nuestra: junto al Tíber no consta muro continuo). Las ciudades griegas y púnicas siguen con muro.bin, torre.bin y puerta.bin de 0 A.D. (Wildfire Games, CC BY-SA 3.0)'), h('Livio 1.44 (cotejado en Perseus 13/11/2026); Livio 6.32 (muro de sillares, 378 a.C.) y toba de Grotta Oscura, según CI0 §8 y la lámina L.1, por cotejar; Varrón, LL 5.143 por cotejar', 'probable', 'CI1: el muro de piedra de 378 a.C. era de sillares de toba de Grotta Oscura, liso y sin almenas (Livio 6.32; L.1, por cotejar). Bastiones rectangulares bajos y el arco de las puertas, simplificados: licencia de juego. Livio 1.44: Servio rodeó Roma con terraplén, fosos y muro y así extendió el pomerio; los mojones se adelantaban con el muro. No dice quién podía ampliarlo (eso, y Varrón 5.143, siguen por cotejar). Muro regular con torres en las cuatro puertas: licencia de juego', 'Servio Tulio, según Livio, rodeó Roma con terraplén, fosos y muro. El pomerio, la franja sagrada sin cultivar ni edificar, se corría hacia fuera al avanzar el muro. Las ciudades seguían el terreno; el recinto cuadrado del juego es una simplificación.')),
    herreria: f({ sin: 'la herrería no tiene modelo: no se dibuja en la ciudad', provisional: true }, SIN_H),
    escuela: f({ sin: 'la escuela no tiene modelo propio: de momento no se dibuja en la ciudad', provisional: true }, SIN_H),
    templo: f(propia('CI1: templo toscano (rs_templo) en la ciudad romana: podio alto de toba con escalinata solo delante, pronaos hondo con dos filas de cuatro columnas lisas enlucidas, cella cerrada, tejado de teja con alero muy ancho y terracotas pintadas en rojo, ocre y negro. Desde 146 a.C. sale el templo de mármol de 0 A.D. (assets/static/templo.bin, Wildfire Games, CC BY-SA 3.0); las ciudades griegas y púnicas usan grie_templo y cart_templo (0 A.D.)'), h('Vitruvio 4.7 (templo toscano); Veleyo Patérculo 1.11 (primer templo de mármol en Roma, h. 146 a.C.); láminas L.2 y L.3 (gobierno/historia/laminas-ciudades.md); citados en gobierno/estudios/CI0-objetivo-ciudad.md §8', 'probable', 'Planta y alzado siguen a Vitruvio 4.7 (podio, columnas solo delante, alero ancho, terracotas). Simplificado: una sola cella en vez de tres, proporciones algo más altas para que se vea de lejos y cambio a mármol justo en 146 a.C.: licencia de juego. Pasajes por cotejar en esta ficha (el estudio CI0 los da por históricos)'))
  };

  // ---- Tropas (D.UNITS). Modelo: assets/units/<id>.bin (el índice es el id). Fuente: H1-tropas.md ----
  const tropa = {
    hastati: f(uni('hastati', { batalla: meshy('hastatus', null, 'hastatus'), oficial: meshyPago('centurion', 'centurión a pie del jugador (AL3; escudo y espada por código). Histórico: casco Montefortino y grebas (Polibio 6.23), cota de malla (Polibio 6.23.15), dos centuriones por manípulo (Polibio 6.24), de memoria, sin cotejar. Licencia de juego: coraza que se lee como escamas, cresta de delante atrás (la distintiva es de época imperial, Vegecio 2.16), phalerae en el pecho, dos grebas, capa y cresta siempre rojas', 'centurion') }), h('Polibio 6.21-23', 'historico', null, 'Era la primera línea de la legión. Según Polibio, llevaban escudo grande, espada corta de estilo hispano, dos jabalinas, casco de bronce con tres plumas y grebas. Los ricos vestían cota de malla.')),
    velites: f(uni('velites', { batalla: meshyPago('velite', 'cuerpo, túnica y casco de Meshy (AL7); parma, jabalinas y gladius por código. Equipo: túnica, parma de unos 90 cm, casco liso, gladius y jabalinas (Polibio 6.22, citado de memoria, sin cotejar). Sin la piel de lobo: licencia de juego (decidido por el usuario el 23/11). Túnica blanca de un hombro, faja y casco dorado: licencia de juego', 'velite') }), h('Polibio 6.21-22; Livio 26.4; Livio 8.8', 'probable', 'Livio 26.4 ya los nombra en 211 a.C.; en 280 es probable, no seguro', 'Infantes ligeros: los más jóvenes y pobres, con espada, jabalinas y escudo redondo. Polibio los describe, y Livio ya los nombra en 211. En 340 todavía no existían, así que en 280 es probable, no seguro.')),
    principes: f(uni('principes', { batalla: meshy('hastatus', 'mismo equipo que el hastatus (Polibio 6.23, citado de memoria, sin cotejar)', 'hastatus') }), h('Polibio 6.21; Polibio 6.23', 'historico', null, 'Hombres en plena edad, segunda línea de la legión. Según Polibio llevaban el mismo equipo que los hastati. Solo los triarios cambiaban las jabalinas pesadas por lanzas largas.')),
    triarii: f(uni('triarii', { batalla: meshyPago('triario', 'equipo: el del hastatus con hasta en vez de pila (Polibio 6.23, citado de memoria, sin cotejar); veterano con barba: probable; casco ático con cimera naranja transversal: licencia de juego (Polibio da tres plumas rojas o negras); dos grebas y falera: probable', 'triario') }), h('Polibio 6.21-23; Livio 8.8', 'historico', null, 'Los veteranos, al fondo, con lanza larga en vez de jabalinas. Según Polibio eran 600 por legión. Livio cuenta que esperaban de rodillas; de ahí el dicho «la cosa ha llegado a los triarios».')),
    equites: f(uni('equites'), h('Polibio 6.20; Polibio 6.25; Livio 8.8', 'historico', null, 'La caballería romana, formada por ciudadanos acomodados. Según Polibio, eran 300 por legión. Antes iban sin coraza y con escudo de cuero; luego adoptaron armas a la griega y una lanza con contera.')),
    vigiles: f(uni('vigiles', { batalla: meshy('hastatus', 'dibujado como un hastatus: licencia de juego', 'hastatus'), provisional: true, nota: 'la tropa es un anacronismo; el modelo es un jabalinero romano' }), h('Regla de juego: guardia genérica; los Vigiles son de Augusto (Dión Casio 55.26; Suetonio, Augusto 30; Livio 39.14)', 'licencia de juego', 'renombrada «Guardia urbana» (H5): los Vigiles de verdad son de Augusto (Dión 55.26; Suetonio, Augusto 30); aquí es una guardia genérica', 'En el juego es una tropa de vigilancia de la ciudad. Los Vigiles de verdad son de Augusto, siglos después. En la República, de noche vigilaban unos magistrados con ayudantes, según Livio.')),
    milicia: f(uni('milicia', { batalla: meshyPago('velite', 'dibujada como un vélite (modelo de Meshy, AL7) con ropa parda sin teñir: licencia de juego', 'velite') }), h('Regla de juego: leva genérica, no es una tropa de las fuentes', 'licencia de juego', 'leva ciudadana genérica', 'Ciudadanos armados deprisa. Las fuentes cuentan que las ciudades armaban a su gente en apuros, pero no describen una tropa así. Es una pieza del juego para tener un soldado barato.')),
    hoplitas: f(uni('hoplitas', { batalla: nuevo('hoplita', 'equipo dibujado: aspis, linotórax, grebas, dory y xiphos (equipo clásico del hoplita, citado de memoria, sin cotejar); colores, licencia de juego') }), h("Plutarco, Filopemén 9.1-2", "probable", "reconstrucción razonada: el pasaje habla del rearme aqueo, no describe al hoplita clásico", "Soldado griego de línea, con lanza, escudo grande, casco, coraza y grebas. Plutarco cuenta que Filopemén rearmó a los aqueos con pica larga y escudo pesado en lugar de lanza corta y escudo ligero. La ficha es una reconstrucción razonada.")),
    falange: f(uni('falange', { batalla: meshy('falangita', 'equipo dibujado (FA2): sarisa de 6 m a dos manos con manguito, escudo macedonio de bronce de 65 cm con estrella, colgado del cuello, casco frigio, linotórax y grebas (Asclepiódoto, Táctica 5.1; Polibio 18.29-30, de memoria). Su oficial de primera fila es assets/soldados/oficial-falange.bin (CC BY 4.0 (Meshy), mismo crédito): coraza de bronce (reglamento de Anfípolis) y penacho blanco (licencia de juego)', 'falangita') }), h('Polibio 18.29-32; Plutarco, Pirro 15.1', 'historico', 'GC5 (16/11/2026): su manera de luchar en la batalla (firme de frente, se hunde más de flanco que otras tropas) sale de Polibio 18.29-32, que dice que la falange es irresistible de frente y en llano y inútil de flanco o en terreno desigual; pasaje recordado, sin cotejar con el texto. Las cifras (cuánto más se hunde) son licencia de juego', 'Masa de infantes con lanza larguísima, la sarisa. Según Polibio, la sarisa se diseñaba de 16 codos y en la práctica medía 14. Pirro pasó a Italia con 20.000 infantes, según Plutarco. De frente es muy difícil de romper; de flanco se hunde, como en Cinoscéfalas.')),
    peltastas: f(uni('peltastas', { batalla: nuevo('peltasta', 'equipo dibujado: pelte de mimbre, alopekis (gorro de piel de zorro), zeira (manto tracio) y jabalinas (citado de memoria, sin cotejar; probable para el peltasta tracio, licencia de juego en la Macedonia de Pidna)') }), h('Livio 44.41', 'probable', 'Livio no usa la palabra «peltastas» (caetrati y chalcaspides, 44.41); el nombre es del juego', 'Infantería ligera griega con escudo pequeño. Livio habla de «caetrati» y «chalcaspides» en la Macedonia de Pidna, pero no usa la palabra peltastas. El nombre del juego es una etiqueta cómoda.')),
    honderos: f(uni('honderos', { batalla: nuevo('hondero', 'equipo dibujado: túnica, tres hondas (cabeza, cintura y mano) y zurrón (Diodoro 5.18; Estrabón 3.5.1; citado de memoria, sin cotejar). Las tres hondas son licencia de juego mientras no se coteje') }), h("Diodoro 5.18; Livio 28.37", "historico", "las «tres hondas» no se pudieron confirmar y se quitaron", "Famosos por la honda. Según Diodoro, los baleares lanzaban piedras mucho mayores que otros honderos y se entrenaban de niños con pan como blanco. Livio dice que la honda era su única arma.")),
    libios: f(uni('libios', { batalla: meshy('hastatus', 'equipo de hastatus con paleta púnica: armados a la romana con el botín de Trasimeno (Polibio 3.114, citado de memoria, sin cotejar); los colores, licencia de juego', 'hastatus') }), h('Polibio 3.87; Polibio 3.114', 'historico', null, 'Tras Trasimeno, Aníbal cambió sus armas por las romanas capturadas, según Polibio. En Cannas formaban con armadura romana. Era la infantería pesada y de confianza de su ejército.')),
    iberos: f(uni('iberos', { batalla: nuevo('ibero', 'equipo dibujado: túnica blanca con orla púrpura (Polibio 3.114), gorro de cuero, caetra, falcata y soliferreum (citado de memoria, sin cotejar)') }), h('Polibio 3.114', 'historico', null, 'Según Polibio, en Cannas vestían túnicas cortas con borde púrpura, un color que se veía de lejos. Cartago los reclutaba como mercenarios en Hispania, y en el juego también defienden Sagunto.')),
    galos: f(uni('galos', { batalla: nuevo('galo'), variantes: [meshyPago('galo-grande', 'galo grande (AL1), sin teñir: calzas a cuadros rojo y negro; escudo y armas por código', 'galo-grande'), meshyPago('galo-grande-v2a', 'galo grande v2a (AL9): falda a cuadros y esclavina; falda teñida por bando', 'galo-grande-v2a'), meshyPago('galo-grande-v2b', 'galo grande v2b (AL10): falda a cuadros teñida por bando, banda dorada cruzada; botas repintadas a cuero liso', 'galo-grande-v2b'), meshyPago('galo-rapido', 'galo rápido (AL2): torso medio desnudo y bracae a cuadros (Polibio 2.28, de memoria); túnica teñida por bando', 'galo-rapido'), meshyPago('galo-rapido-b', 'galo rápido B (AL8): túnica sin mangas teñida por bando; pelo rapado con tupé y polainas: licencia de juego', 'galo-rapido-b'), meshyPago('galo-lancero', 'galo lancero (AL5): capa con capucha (sagum, cucullus) y bracae; casco de punta: licencia de juego; lanza y escudo por código', 'galo_lancero'), meshyPago('jefe-galo', 'jefe galo (AL6): penacho rojo en abanico (más griego que galo), coraza de escamas y faldón a cuadros: licencia de juego; espada y escudo por código', 'jefe_galo')], notaHistoria: 'variantes de Meshy (AL1–AL10): barba en los galos, falda a cuadros (los galos llevaban bracae, Polibio 2.28; Diodoro 5.30, de memoria) y cuadros de colores: licencia de juego (decidido por el usuario el 23/11)' }), h('Polibio 2.28-30', 'historico', null, 'Según Polibio, algunos luchaban con calzas y capa y los gesatos, desnudos, por bravura. Los romanos los temían desde el saqueo de Roma. Fueron aniquilados en Telamón en 225.')),
    sagrada: f(uni('sagrada', { batalla: nuevo('hoplita', 'dibujado como hoplita (aspis, linotórax, grebas, dory) con paleta púnica: Diodoro 16.80 los describe con armas pesadas (citado de memoria, sin cotejar); los colores, licencia de juego') }), h("Diodoro 16.80.4; Diodoro 20.11.1; Diodoro 20.12.3", "probable", "renombrada «Ciudadanos de Cartago» (H5): que no aparezca después de 310 es silencio de las fuentes abiertas, no prueba de que desapareciera", "Cartago solía pagar mercenarios, pero tenía una élite de ciudadanos ricos, el Batallón Sagrado: 2.500 hombres según Diodoro, que lo muestra en el Crimiso (339) y contra Agatocles (310). Después no lo hemos hallado en las fuentes que abrimos, lo que no prueba que desapareciera.")),
    jinetes: f(uni('jinetes'), h('Regla de juego: caballería genérica, no es una tropa de las fuentes', 'licencia de juego', 'caballería local genérica', 'Una caballería genérica para que todas las facciones tengan jinetes. Las fuentes describen caballerías concretas, como los équites o los númidas, pero no esta pieza.')),
    numidas: f(uni('numidas'), h("Livio 35.11; Polibio 15.5", "historico", null, "Jinetes ligeros con jabalinas. Según Livio, montaban sin bridas, y en 193 había unos 800 al servicio de Roma. En Zama, Masinisa aportó unos 4.000, según Polibio.")),
    tesalios: f(uni('tesalios'), h("Plutarco, Pirro 17.3; Livio 42.58.13", "historico", "Heraclea y 171 salen del contexto, no del pasaje; en Pidna (168) no consta", "Caballería de Tesalia, famosa en Grecia. Según Plutarco, Pirro lanzó a sus jinetes tesalios contra los romanos cuando los elefantes los habían desordenado, en Heraclea (280). Livio coloca a 400 tesalios junto a los romanos en Calínico, en 171.")),
    elefantes: f(uni('elefantes', { provisional: true, nota: 'un solo modelo cartaginés; no encaja para los elefantes asiáticos de Pirro' }), h('Plutarco, Pirro 15.1 y 17; Polibio 1.40; Polibio 5.84', 'historico', 'GC5 (16/11/2026): que arrollen al chocar y que heridos se desboquen contra los suyos sale de Plutarco, Pirro 17 (Heraclea) y Polibio 1.40 (Panormus), recordados y sin cotejar con el texto. Que formen un cuerpo propio delante en el centro, su cansancio y cuánto pierden al desbocarse son licencia de juego', 'Pirro trajo 20 a Italia, según Plutarco. En Panormus los de Asdrúbal fueron derrotados, según Polibio. Asustaban al enemigo y arrollaban al chocar, pero heridos podían volverse contra los suyos.')),
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
    carthago: f(SIN_C, h("Livio, Períocas 51.1-5", "historico", "sin general con nombre en 280 (H6); «Asdrúbal el Beotarca» es de 149-146. Apiano, Libyca 127-132 sin abrir: los «seis días» y los «50.000» se quitaron", "Gran potencia del mar. En 146 cayó ante Escipión Emiliano tras un asedio largo, según las Períocas de Livio, que la dan capturada «por partes» y en el año setecientos desde su fundación. La mujer de su jefe Asdrúbal se arrojó a las llamas con sus hijos.")),
    perusia: f(SIN_C, h('Livio 28.45.18; Livio 10.30-37', 'probable', 'en 280 es etrusca e independiente en el juego: licencia de juego (su sumisión a Roma fue hacia 295) Cita de memoria, sin cotejar con el pasaje.', 'Ciudad etrusca sobre un monte. Según Livio, en 205 a.C. Perusia, Clusium y Rusellae ofrecieron abeto para construir las naves de Escipión.')),
    clusium: f(SIN_C, h('Livio 28.45.18; Livio 2.9', 'probable', 'el abeto de 205 es de Livio 28.45; que Porsenna fuera de Clusium es tradición, no historia sólida Cita de memoria, sin cotejar con el pasaje.', 'Ciudad etrusca del interior. Según Livio, en 205 a.C. dio abeto para las naves de Escipión junto con Perusia y Rusellae.')),
    rusellae: f(SIN_C, h('Livio 28.45.18; Livio 10.37', 'probable', 'el abeto de 205 es de Livio 28.45; la toma de 294 es de Livio 10.37 y se cita sin cotejar Cita de memoria, sin cotejar con el pasaje.', 'Ciudad etrusca cercana a la costa. Según Livio, Roma la tomó hacia 294 a.C.; en 205 dio abeto para las naves de Escipión.')),
    neapolis: f(SIN_C, h('Livio 8.25-26; Livio 35.16', 'probable', 'dueño «Colonos griegos» en 280: licencia de juego (era ciudad griega aliada de Roma con pacto propio) Cita de memoria, sin cotejar con el pasaje.', 'Colonia griega de la bahía de Campania. Según Livio, en 326 a.C. hizo con Roma un pacto de igual a igual y, más tarde, aportó naves a su flota.')),
    massalia: f(SIN_C, h('Polibio 3.95; Estrabón 4.1.5', 'probable', 'dueño «Colonos griegos»: licencia de juego (Massalia era ciudad libre y aliada de Roma) Cita de memoria, sin cotejar con el pasaje.', 'Colonia focense de la Galia. Según Polibio, fue aliada fiel de Roma y los romanos recibieron noticias de Aníbal por ella.')),
    tarraco: f(SIN_C, h('Livio 21.61; Estrabón 3.4.7', 'probable', 'dueño «Íberos»: licencia de juego (el nombre y la base romana son de 218; antes era una población ibera) Cita de memoria, sin cotejar con el pasaje.', 'Puerto de la costa ibera. Según Livio, Cneo Escipión desembarcó en 218 a.C. y de aquí salió su campaña; Estrabón la llama fondeadero natural.')),
    gades: f(SIN_C, h('Livio 28.37; Estrabón 3.5.3', 'probable', 'la rendición de 206 es de Livio 28.37; aquí es cartaginesa desde 280, licencia de juego Cita de memoria, sin cotejar con el pasaje.', 'Colonia fenicia fuera del Estrecho. Según Livio, se entregó a Roma en 206 a.C. tras la derrota púnica en Ilipa.')),
    hadrumetum: f(SIN_C, h('Livio 30.25; Polibio 15.5', 'probable', 'el desembarco de Aníbal en 203 es de Livio 30.25; la riqueza y la guarnición son licencia de juego Cita de memoria, sin cotejar con el pasaje.', 'Puerto cartaginés del sur. Según Livio, Aníbal desembarcó aquí en 203 a.C. al volver de Italia y reunió tropas antes de Zama.')),
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
    'tributo-zama': f(SIN_MIS, h('Polibio 15.18; Livio 30.37', 'historico', 'plazos, premios, castigos y cifras: licencia de juego', 'Cartago pagará una indemnización tras Zama. Ten 600 denarios en las arcas.')),
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

  // ---- CN17: encargos del Senado y hitos (D.ENCARGOS, D.HITOS). Son mecánicas de juego: sin fuente antigua; cifras y plazos, licencia de juego. ----
  const SIN_ENC = { sin: 'un encargo no tiene modelo 3D' };
  const LIC = 'encargo inventado para jugar: cifras, plazos y premios son licencia de juego';
  const encargo = {
    'techo-30': f(SIN_ENC, h('Vitruvio 2.8 (casas de Roma); Livio 5.55 (reconstrucción tras los galos)', 'probable', LIC, 'Roma se amontona en casas altas y estrechas; el Senado quiere más hogares.')),
    'agua-2': f(SIN_ENC, h('Frontino, Acueductos 4-5 (Apio Claudio, 312)', 'historico', LIC, 'Roma ya lleva agua con acueductos y fuentes; el pueblo la pide en sus calles.')),
    'segundo-barrio': f(SIN_ENC, h('Varrón, Lengua latina 5.45-56 (las regiones y los vici)', 'probable', LIC, 'La ciudad se ordena en barrios (vici) con su capilla de cruce (compitum).')),
    'barrio-sano': f(SIN_ENC, h('Varrón, Lengua latina 5.45-56', 'probable', LIC, 'Un barrio con agua, grano y cobijo prospera.')),
    'arcas-300': f(SIN_ENC, h('Polibio 6.13 (el Senado y el tesoro)', 'probable', LIC, 'El Senado vigila el tesoro de la República.')),
    'techo-80': f(SIN_ENC, h('Vitruvio 2.8', 'probable', LIC, 'Una ciudad grande necesita muchas viviendas.')),
    'barrio-rico': f(SIN_ENC, h('sin fuente antigua: es una meta de juego', 'licencia de juego', LIC, 'Los barrios ricos tienen casas de buena posición, con patio, agua y comercio cerca. Es una meta de juego.'))
  };
  const hito = {
    'casas-50': f(SIN_ENC, h('Vitruvio 2.8', 'probable', LIC, 'Medio centenar de hogares marca el paso de aldea a villa.')),
    'barrio-3': f(SIN_ENC, h('Varrón, Lengua latina 5.45-56', 'probable', LIC, 'Un barrio de buena posición abre encargos mayores.')),
    'tres-barrios': f(SIN_ENC, h('Varrón, Lengua latina 5.45-56', 'probable', LIC, 'Tu ciudad ya tiene tres barrios con nombre propio, cada uno con su capilla de cruce.')),
    'primer-encargo': f(SIN_ENC, h('Polibio 6.13', 'probable', LIC, 'Has cumplido tu primer encargo: el Senado empieza a fiarse de ti.'))
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
    maderanaval: f(SIN_T, h('Livio 28.45.18', 'probable', 'Livio cuenta que Perusia, Clusium y Rusellae dieron abeto para las naves de Escipión en 205 a.C. (H11c: el bien salió de Siracusa y Panormus, que no tienen fuente). Los efectos son licencia de juego.' + MEC)),
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
    etruria: f(SIN_ZONA, h('Livio 28.45; Estrabón 5.2', 'licencia de juego', 'Etruria es el país de los etruscos; su capital en el juego (Volsinii) y los límites son agrupación de juego')),
    gallia: f(SIN_ZONA, h('Polibio 3.41-43; Estrabón 4.1', 'licencia de juego', 'Gallia agrupa aquí solo Massalia, la costa gala; la zona y su capital son agrupación de juego')),
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
    quinque: f(SIN_I, h("Polibio 1.20: Roma copia una nave cartaginesa varada (260 a.C.); Tarento y otros aliados prestan naves (1.20.14).", "historico", "I5d: el apartado .14 es de memoria, por cotejar. Cifra: licencia de juego.")),
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
    perseo: f(SIN_I, h("Plutarco, Emilio Paulo 28: los libros de Perseo pasan a los hijos de Paulo, entre ellos Escipión Emiliano (168 a.C.).", "probable", "I5d (17/11/2026): el pasaje de Plutarco se da por bueno de memoria. Polibio 31.23-25 se quitó de la cita: habla de Escipión y Paulo, pero no se pudo comprobar que mencione los libros; por cotejar.")),
    acoger: f(SIN_I, h("Plutarco, Catón 22; Gelio 6.14: embajada de Carnéades (155 a.C.).", "probable")),
    expulsar: f(SIN_I, h("Suetonio, De rhetoribus 1; Gelio 15.11: expulsión de 161 a.C.", "probable")),
    hormigon: f(SIN_I, h("Livio 35.10: Pórtico Emilio (193 a.C.).", "por cotejar", "I5d (17/11/2026): Livio solo da por seguro el pórtico y el muelle de 193; que fueran «primeros usos del hormigón» no está en Livio, es lectura moderna del opus caementicium (por cotejar). Cifra: licencia de juego."))
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

  // ---- Leva y Campo de Marte (D.LEVA_FICHAS, CN16a). Cotejo: gobierno/historia/CN16-cotejo.md ----
  const SIN_LEVA = { sin: 'la leva es una acción y el campo es una explanada: se dibujan con figuras de soldados y un suelo liso, sin modelo propio' };
  const leva = {
    dilectus: f(SIN_LEVA, h('Polibio 6.19-21 (cotejado 16/11/2026 en LacusCurtius, penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/6*.html); Livio 22.57.9-11 (cotejado en Perseus, 1999.02.0144)', 'licencia de juego', 'Polibio 6.19-21: cada año los cónsules convocan a los ciudadanos en edad militar; los tribunos militares los reparten en cuatro legiones y eligen por tribus, de cuatro en cuatro; el censo decide (los de menos de 400 dracmas van a la flota) y se jura. Es histórico, pero el alistamiento lo dirigen cónsules y tribunos, no un voto del Senado. Livio 22.57.9-11 (216 a.C., tras Cannas): leva desde los 17 años y 8.000 esclavos armados a costa del erario. Aquí la leva es un botón que se paga con grano y oro y alista milicia al momento, con tope por población: regla de juego.', 'En Roma los cónsules convocaban cada año a los ciudadanos en edad de servir y los tribunos los repartían en legiones, según su fortuna (Polibio 6.19-21). Aquí, cuando pulsas, un grupo de aldeanos toma las armas a cambio de grano y oro.')),
    campo_marte: f(SIN_LEVA, h('Livio 2.5.2 (cotejado 16/11/2026 en Perseus, 1999.02.0026); Polibio 6.19.3-4 (leva en el Capitolio, no en el Campo)', 'licencia de juego', 'Livio 2.5.2: las tierras de los Tarquinios, entre la ciudad y el Tíber, quedaron consagradas a Marte y se llamaron Campo de Marte. Ese pasaje no dice que allí se reuniera o adiestrara a la tropa, y Polibio sitúa el alistamiento en el Capitolio. Ponerlo ante la puerta de cada ciudad, con una muestra de la guarnición, es licencia de juego.', 'El Campo de Marte era la gran llanura junto al Tíber, consagrada a Marte según Livio. Aquí, ante la puerta, ves una muestra de tu guarnición.')),
    puertas: f(SIN_LEVA, h('Regla de juego; sin fuente cotejada para esta época (por cotejar: Livio 26.10, Aníbal ante Roma en 211 a.C.)', 'licencia de juego', 'Cerrar las puertas ante el enemigo es lo obvio en una ciudad amurallada, pero no se ha cotejado un pasaje de 280-146 a.C. Las cifras (+15 % de defensa, −20 % de oro del foro y del puerto, marchas un 25 % más lentas) son de equilibrio.', 'Con el enemigo cerca, una ciudad amurallada cerraba sus puertas: aguantaba mejor un asalto, pero el comercio y el paso de tropas se frenaban.')),
    evocati: f(SIN_LEVA, h('Polibio 6.19.2 (cotejado 17/11/2026 en LacusCurtius, penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/6*.html)', 'licencia de juego', 'Polibio 6.19.2: el infante debe servir dieciséis campañas antes de los 46 años (veinte en caso de gran peligro); el jinete, diez. Que los soldados se licencien tras tres batallas y se asienten en la ciudad con grano es licencia de juego; el reparto de tierras a veteranos es sobre todo posterior (fin del siglo II a.C.).', 'Según Polibio, un infante romano servía hasta dieciséis campañas. Después volvía a su tierra: el juego deja que los veteranos se licencien y se asienten como vecinos.')),
    triumphus: f(SIN_LEVA, h('Polibio 6.15.7-8 (cotejado 17/11/2026 en LacusCurtius, penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/6*.html)', 'historico', 'Polibio 6.15.7-8: el triunfo, procesión en la que el general muestra sus logros a los ciudadanos, no puede celebrarse sin el consentimiento del Senado y los fondos que este da. Histórico. El umbral (200 bajas enemigas y tres veces más que las propias, o una ciudad conquistada), el coste en oro y la felicidad durante seis meses son licencia de juego.', 'El triunfo era el desfile del general vencedor por Roma. Según Polibio, sin el permiso del Senado y su dinero no había triunfo.'))
  };

  // ---- Fiestas del Foro y del Templo (D.FIESTAS, CN13a). Se casan por id. Cotejo: gobierno/historia/CN13-cotejo.md ----
  const SIN_FIESTA = { sin: 'una fiesta no tiene modelo 3D propio; la ciudad solo cambia el aspecto del arca (CN15)' };
  const fiesta = {
    ofrenda: f(SIN_FIESTA, h('Livio 22.9-10; Livio 25.12; Livio 29.14.14 (cotejados 16/11/2026 en Perseus, 1999.02.0144); Ovidio, Fastos 4 por cotejar (no se pudo abrir)', 'licencia de juego', 'El Senado votó ofrendas y ritos tras el Trasimeno (Livio 22.9-10) y fundó los juegos de Apolo en 212 por consejo de los libros sibilinos (25.12): eso es histórico. Pagarlas con lo que sobra, una al mes, y duplicar el don de un dios son reglas de juego.', 'Tras el desastre del Trasimeno, el Senado votó ofrendas y ritos a los dioses (Livio 22.9-10). Aquí puedes hacer una al mes, y el templo de tu ciudad favorece más a su dios.')),
    juegos: f(SIN_FIESTA, h('Livio 22.9-10 (ludi magni, 217); Livio 25.12.12-15 (ludi Apollinares, 212: el Senado vota los juegos y da al pretor 12.000 ases y dos reses); Livio 29.14.14 (Megalesias, 12 de abril de 204 a.C.); cotejados 16/11/2026 en Perseus (1999.02.0144); Ovidio, Fastos 4 por cotejar (no se pudo abrir)', 'licencia de juego', 'Los ludi eran fiestas públicas reales que el Senado votaba y el erario pagaba en parte (25.12.12), con aportación voluntaria del pueblo (25.12.14). Su precio ligado al ingreso, el reposo de seis meses y el calmar a una ciudad conquistada son reglas de juego. Ovidio no se ha comprobado y no se usa para nada.', 'Los ludi eran juegos públicos que pagaban los magistrados o el erario por voto del Senado (Livio 22.9-10). Aquí calman al pueblo y a una ciudad conquistada.'))
  };

  const SIN_REM = { sin: 'un remedio no tiene modelo 3D propio: el dique usa el muro de 0 A.D. como figura provisional (js/gfx/city3d.js, CN13b; en la ciudad romana, desde CI1, el tramo liso de toba por código de js/gfx/roma-siglo.js, arte propio) y el tejado lo pintará CN15' };
  const remedio = {
    dique: f(SIN_REM, h('Livio 24.9.6 (214 a.C.) y 30.38.10 (201 a.C.), cotejados 16/11/2026 en Perseus (1999.02.0144); sin fuente de diques en 280-146', 'licencia de juego', 'Livio 24.9.6: dos grandes crecidas ese año; el Tíber inundó los campos con muchas pérdidas de edificios, ganado y vidas. Livio 30.38.10: lluvia extraordinaria, el Tíber anegó el Circo y los juegos apolinares casi se trasladan al templo de Venus Ericina. Las crecidas son históricas; que Roma levantara diques o malecones en esta época no consta y los grandes muros de contención son posteriores. Es una regla de juego para dar remedio a la ribera baja.', 'El Tíber se desbordaba a menudo y anegaba la parte baja de Roma; Livio lo cuenta varias veces. Aquí puedes levantar un dique en la orilla para guardar las casas, aunque no consta que se hiciera así entonces.')),
    tejas: f(SIN_REM, h('Plinio, Historia natural 16.36 (numeración Loeb; 16.15 en la de Bostock), cotejado 16/11/2026 en Perseus, 1999.02.0137, citando a Cornelio Nepote', 'probable', 'Plinio dice, según Cornelio Nepote, que Roma se cubrió solo con tablillas de madera hasta la guerra de Pirro, unos 470 años desde la fundación. El pasaje no dice que después vinieran las tejas ni que hubiera remedios contra incendios, y no se ha contrastado con la arqueología: por eso, probable y no histórico. Techar por barrios, su coste y su plazo son reglas de juego.')),
    cubos: f(SIN_REM, h('Livio 39.14.10 (186 a.C.) y 9.46.3, cotejados 16/11/2026 en Perseus; Digesto 1.15 (vigiles, época imperial) por cotejar. Livio 5.7 no sirve: cuenta el incendio de las obras de asedio de Veyes', 'licencia de juego', 'Livio 39.14.10: en 186 a.C. los triunviros de policía ponen vigilancia en la ciudad y cinco hombres ayudan a prevenir incendios. Livio 9.46.3 nombra a un triunviro nocturno. Eso apoya que había vigilancia contra el fuego, no que se apagara con cubos y vecinos; eso es plausible, no consta. Los vigiles de Augusto son posteriores a 146 a.C. y que los ayudaran esclavos públicos no se ha comprobado. Las probabilidades, el coste en oro y la distancia al agua son una regla de juego.', 'Sin bomberos como los de hoy: Roma tenía magistrados de vigilancia nocturna (Livio 39.14), y es de suponer que ante un incendio acudían los vecinos con cubos de agua del río o las fuentes. Aquí puedes mandar cubos y salvarás más casas cuanto más cerca esté el agua; la guardia urbana de los vigiles llegaría mucho más tarde.')),
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


  // ---- Sitios de los caminos (D.SITIOS, GM15b). Fuente: gobierno/historia/sitios-de-los-caminos.md (ficha GM15a). Sin `texto`: las citas no cotejadas NO se enseñan, en pantalla solo el nombre ----
  const SIN_SIT = { sin: 'un sitio del camino es un dato de terreno; no tiene modelo 3D propio' };
  const LJ_SIT = ' · licencia de juego: el camino es una recta entre ciudades y el punto del sitio es su proyección sobre ella';
  // s(fuente, etiqueta del estudio ('h' histórico, 'p' probable), cotejada, nota). Histórico sin pasaje cotejado queda «por cotejar» (la regla del registro: «historico» = cotejado)
  const s = (fuente, et, cot, nota) => f(SIN_SIT, h(fuente, et === 'p' ? 'probable' : cot ? 'historico' : 'por cotejar', (nota ? nota + ' · ' : '') + 'estudio GM15a: ' + (et === 'p' ? 'probable' : 'histórico') + (cot ? ', pasaje cotejado' : ', pasaje de memoria, sin cotejar') + LJ_SIT));
  const BA = 'Barrington Atlas 2000 (de memoria, no se pudo abrir)';
  const sitio = {
    tiber: s(BA + ', mapa 43', 'p', false, 'vado del valle del Tíber; ningún combate del periodo localizado aquí'),
    vadimon: s('Polibio 2.20; Livio, Per. 12 (de memoria)', 'p', false, 'Polibio 2.20 solo menciona la derrota de boyos y etruscos en 283; el lugar exacto del lago se discute'),
    ciminio: s('Livio 9.36-37 (de memoria)', 'h', false, 'Fabio Ruliano lo cruzó en 310, antes del periodo: vale como terreno'),
    albanos: s(BA, 'p', false, 'colinas volcánicas; sin batalla del periodo conocida'),
    liris: s('Livio 22.13-15 (de memoria)', 'p', false, 'Aníbal lo dejó atrás en 217; la identificación del vado es de memoria'),
    massico: s('Polibio 3.90-94', 'h', true, 'Fabio guardó los pasos en 217; Aníbal salió con la argucia de los bueyes con fuego'),
    trasimeno: s('Polibio 3.82-85', 'h', true, 'emboscada de Aníbal, 217: franja estrecha entre colinas y lago, con niebla'),
    arno: s('Polibio 3.78-79', 'p', true, 'marcha de tres días por marismas en 217; que fuera el Arno lo da la tradición, lo cotejado es la marisma'),
    trebia: s('Polibio 3.67-74', 'h', true, 'batalla del Trebia, 218; el cauce de orillas empinadas escondió la emboscada (3.71)'),
    ticino: s('Polibio 3.64-65', 'h', true, 'choque de caballería, 218; Polibio no da el lugar exacto'),
    alpes: s('Polibio 3.47-56', 'h', true, 'marcha de Aníbal, 218; las lomas del juego suavizan los Alpes'),
    rodano: s('Polibio 3.42-43', 'h', true, 'cruce con balsas, 218; el vado exacto se discute'),
    benevento: s('Plutarco, Pirro 25 (de memoria)', 'h', false, 'batalla de Benevento, 275: Curio Dentato vence a Pirro'),
    ausculum: s('Plutarco, Pirro 21 (cotejado vía la ficha heraclea-280)', 'p', true, 'batalla de Ausculum, 279; el lugar exacto se discute y queda lejos de la recta (más de 0,5 grados)'),
    siris: s('Plutarco, Pirro 16-17 (cotejado vía la ficha heraclea-280)', 'h', true, 'batalla de Heraclea, 280, vado del Siris; llanura de trigo'),
    silaro: s('Livio 25.19-20 (de memoria)', 'p', false, 'combate de Aníbal con Centenio, 212; la identificación con el Sele es de memoria; el camino 6 es licencia de estrecho'),
    sila: s('Estrabón 6.1.9 (de memoria)', 'p', false, 'bosque de pino para la brea; sin batalla del periodo'),
    aspromonte: s(BA, 'p', false, 'sierra que acaba en el estrecho; sin batalla del periodo'),
    longano: s('Polibio 1.9', 'h', true, 'Hierón derrotó a los mamertinos junto al Longano (hacia 269); llano de trigo'),
    simeto: s('Estrabón 6.2.3 (de memoria)', 'p', false, 'llanura de Catania, vado grande; trigal'),
    anapo: s('Livio 24.35 (de memoria)', 'p', false, 'cartagineses e Himilcón lucharon cerca en 213; el sitio es de memoria'),
    nebrodi: s(BA, 'p', false, 'selva interior de Sicilia; sin batalla del periodo conocida'),
    himera: s('Polibio 1.24', 'h', true, 'campamento romano entre el Paropo y las termas de Himera, 258'),
    panormus: s('Polibio 1.40', 'h', true, 'batalla de Panormus, 250: Metelo atrae a Hasdrúbal al otro lado del río y captura diez elefantes'),
    hibleos: s(BA, 'p', false, 'mesetas calizas; sin batalla del periodo'),
    gela: s('Diodoro 13.108-111 (de memoria)', 'p', false, 'batalla de Gela, 405, antes del periodo: vale como terreno; trigal'),
    salso: s('Diodoro 19.109 (de memoria)', 'p', false, 'Agátocles vencido allí en 311, antes del periodo: vale como terreno'),
    toro: s('Polibio 1.17-19', 'h', true, 'asedio romano de Agrigento, 262; Hanón ocupó la colina Toro (1.19.5)'),
    halico: s('Diodoro (sin capítulo; de memoria)', 'p', false, 'frontera clásica sicula y cartaginesa; sin batalla del periodo'),
    lilybaeum: s('Polibio 1.42-45', 'h', true, 'asedio romano, 250-249: fosos y empalizada entre campamentos'),
    hercte: s('Polibio 1.56 (de memoria)', 'h', false, 'campamento de Amílcar, hacia 247-244; el pasaje no se cotejó'),
    erice: s('Polibio 1.55-58 (de memoria)', 'h', false, 'ocupado por Amílcar contra Roma en 244; cotejo no logrado'),
    drepana: s('Polibio 1.46-55 (de memoria)', 'p', false, 'zona de la batalla naval de Drepana, 249; la tierra es llana'),
    tarraco: s('Polibio 3.76; Livio 21.60-61 (de memoria)', 'h', false, 'Cneo Escipión vence a Hannón en Cissa, 218, y hace de Tarraco su base'),
    ebro: s('Livio 23.28-29 (de memoria)', 'h', false, 'batalla de Dertosa, 215; el resultado se discute (victoria romana o inconcluyente)'),
    valencia: s('Estrabón 3.4.6 (de memoria)', 'p', false, 'huerta fértil; sin batalla del periodo localizada'),
    sucro: s('Estrabón 3.4.6 (de memoria)', 'p', false, 'motín de las tropas de Escipión junto al Sucro, 206 (Livio 28.24, de memoria); la batalla del Sucro es del 75 a.C., posterior al periodo'),
    esparto: s('Estrabón 3.4.9 (de memoria)', 'h', false, 'llanura de esparto al interior de Cartagena'),
    tader: s('Plinio, NH 3.19; Livio (de memoria)', 'p', false, 'combates menores de la guerra de Iberia; nada cotejado'),
    aous: s('Livio 32.10-12; Plutarco, Flaminino 3-5 (de memoria)', 'h', false, 'batalla del Aous, 198 (Filipo V y Flaminino); el lugar exacto se discute y queda lejos de la recta (más de 1 grado)'),
    cinoscefalas14: s('Polibio 18.19-27', 'h', true, 'batalla de Cinoscéfalas, 197: colinas «cabezas de perro» rotas y ásperas (18.22.9); queda lejos de la recta (medio grado)'),
    tempe14: s('Polibio 18.27', 'h', true, 'Filipo se retira hacia Tempe tras Cinoscéfalas'),
    termopilas15: s('Livio 36.15-19; Apiano, Siria 17-20 (de memoria)', 'h', false, 'batalla de las Termópilas, 191: Acilio Glabrión supera a Antíoco III rodeando por el monte'),
    parnaso: s(BA, 'p', false, 'sierras entre Fócida y Beocia; sin batalla del periodo'),
    beocia: s(BA, 'p', false, 'llanura y trigal; Beocia es llano de trigo notable'),
    tempe16: s('Polibio 18.27; Livio 44.6 (de memoria)', 'h', true, 'paso clásico entre Macedonia y Tesalia (lo cotejado es Polibio 18.27)'),
    cinoscefalas16: s('Polibio 18.19-27', 'h', true, 'batalla de 197; ver el camino 14'),
    termopilas16: s('Livio 36.15-19; Apiano, Siria 17-20 (de memoria)', 'h', false, 'batalla de 191; ver el camino 15')
  };

  // ---- Monumentos del mapa (D.MONUMENTOS, C9). Dibujados por código, sin archivo de arte; ficha larga en gobierno/historia/C9-egipto.md ----
  const POR_CODIGO = { sin: 'dibujado por código en js/gfx/map3d.js (formas simples, sin archivo de arte ni licencia ajena)' };
  const LJ_MON = ' · licencia de juego: muy agrandado para que se vea en el mapa';
  const monumento = {
    giza: f(POR_CODIGO, h('Heródoto, Historias 2.124-127 y 2.134; Diodoro Sículo 1.63-64; Estrabón, Geografía 17.1.33', 'historico', 'C9: pasajes cotejados en Perseus y LacusCurtius el 17/11/2026; la fecha moderna (h. 2600-2500 a.C.) es de memoria' + LJ_MON,
      'Las tres grandes pirámides de Giza, de Keops, Kefrén y Micerino, ya tenían más de dos mil años cuando Roma luchaba contra Pirro. Los griegos viajaban a verlas y las contaban entre las maravillas del mundo. En el mapa se dibujan enormes para que se vean: en la realidad serían apenas un punto.')),
    faro: f(POR_CODIGO, h('Estrabón, Geografía 17.1.6; Plinio, Historia Natural 36.83 (36.18 en la numeración de Bostock); Luciano, Cómo debe escribirse la historia 62 (sin cotejar); forma de tres cuerpos por Ibn al-Shaykh y monedas romanas', 'probable', 'C9: Estrabón y Plinio cotejados el 17/11/2026; la fecha de acabado se discute entre 283 y 279; la forma de tres cuerpos y el fuego en lo alto son reconstrucción posterior' + LJ_MON,
      'El Faro de Alejandría, obra del arquitecto Sóstrato de Cnidos, se acabó hacia 280 a.C. (las fuentes discuten entre 283 y 279). Era una torre blanca y de varios pisos que guiaba a los barcos hacia el puerto. Su forma de tres cuerpos es una reconstrucción hecha con descripciones árabes y monedas romanas posteriores.'))
  };

  // ---- Adornos de carta del mapa (D.ADORNOS, C10). Dibujados por código; ficha larga en gobierno/historia/C10-mares.md ----
  const POR_CODIGO_C10 = { sin: 'dibujado por código en js/gfx/map3d.js (tinta sobre un lienzo, sin archivo de arte ni licencia ajena)' };
  const EST = 'Estrabón, Geografía 2.5.19-22 (las partes del mar interior)', PLI = 'Plinio, Historia Natural 3.74-75', C10 = 'C10: citado de memoria el 17/11/2026, sin cotejar el pasaje';
  const mar = (fuente, texto, nota) => f(POR_CODIGO_C10, h(fuente, 'historico', C10 + (nota ? '; ' + nota : '') + ' · licencia de juego: letra muy grande y puesta a ojo', texto));
  const LJ_ADORNO = 'Las cartas antiguas que conocemos no llevan barcos ni monstruos dibujados en el mar: es costumbre de las cartas del Renacimiento (Olao Magno, 1539). Aquí es adorno.';
  const adorno = {
    internum: mar('Pomponio Mela 1.6-7; Plinio, Historia Natural 3.3-5; Salustio, Yugurta 17-18 («mare nostrum»)', 'Mare Internum, «el mar de dentro»: así llamaban los romanos al Mediterráneo, y también «mare nostrum», nuestro mar. La palabra «Mediterráneo» llegó mucho después.', 'Mela y Plinio usan «internum» y «nostrum»'),
    tyrrhenum: mar(EST + '; ' + PLI, 'Mare Tyrrhenum, el mar de los tirrenos, que es como los griegos llamaban a los etruscos. Los romanos lo llamaban también Mare Inferum, el mar de abajo.'),
    hadriaticum: mar('Livio 5.33.7-8; Plinio, Historia Natural 3.150; ' + EST, 'Mare Hadriaticum, por la ciudad de Adria, en la desembocadura del Po. Los romanos lo llamaban también Mare Superum, el mar de arriba.'),
    ionium: mar(EST + '; Polibio 2.14', 'Mare Ionium, el mar entre el sur de Italia y Grecia. En tiempos de Pirro era el paso de Epiro a Tarento.'),
    aegaeum: mar(EST + '; Plinio, Historia Natural 4.51', 'Mare Aegaeum, el mar de las islas griegas, entre Grecia y Asia.'),
    libycum: mar(EST, 'Mare Libycum, el mar al sur de Creta, frente a la costa de Libia (Cirenaica).'),
    aegyptium: mar(EST, 'Mare Aegyptium, el mar frente a Egipto, hacia Chipre.'),
    sardoum: mar(EST + '; ' + PLI, 'Mare Sardoum, el mar al oeste de Cerdeña.'),
    balearicum: mar(PLI + ' («Baliaricum»); Estrabón, Geografía 2.5.19 (mar ibérico)', 'Mare Balearicum, el mar de las islas Baleares, entre Hispania y África. Estrabón lo llama mar ibérico.'),
    ligusticum: mar(EST + '; ' + PLI, 'Mare Ligusticum, el golfo de los ligures, hoy golfo de Génova.'),
    pontus: mar('Estrabón, Geografía 7.3.6; Plinio, Historia Natural 4.76', 'Pontus Euxinus, el Mar Negro. «Euxinos» quiere decir «hospitalario»: según Estrabón, antes se llamó «Axenos», el inhóspito.'),
    oceanus: mar('Plinio, Historia Natural 4.109-110 (océano gálico); Estrabón, Geografía 2.5.26', 'Oceanus: para griegos y romanos, el mar exterior que rodeaba la tierra, más allá de las Columnas de Hércules.'),
    rosa: f(POR_CODIGO_C10, h('Vitruvio, De architectura 1.6.4-10 (ocho vientos: septentrio, aquilo, solanus, eurus, auster, africus, favonius, caurus); Aristóteles, Meteorológica 2.6 (doce vientos); Torre de los Vientos de Atenas (s. I a.C.)', 'licencia de juego', C10 + '. La rosa dibujada en estrella es de las cartas náuticas medievales (portulanos); los nombres de los vientos sí son antiguos; Vitruvio escribe hacia el 25 a.C., algo después de la época del juego',
      'Los antiguos no tenían brújula, pero sí nombraban los vientos: Vitruvio cuenta ocho, cuatro de ellos en esta rosa (Septentrio, el norte; Solanus, el este; Auster, el sur; Favonius, el oeste). La estrella es adorno de cartas posteriores.')),
    navis1: null, navis2: null, navis3: null, navis4: null, navis5: null,
    ketos1: f(POR_CODIGO_C10, h('Iconografía griega del ceto (κῆτος): vasos y mosaicos de Perseo y Andrómeda y de Heracles y Hesíone; Homero, Odisea 12.96-97 (los cetos que pesca Escila)', 'licencia de juego', C10 + '. ' + LJ_ADORNO,
      'El ceto (en griego, kêtos) era el monstruo marino de los mitos griegos, como el que iba a devorar a Andrómeda. Los griegos lo pintaban como una serpiente con cabeza de dragón y cola de pez. Ponerlo en un mapa es adorno, no historia.')),
    delphini: f(POR_CODIGO_C10, h('Plinio, Historia Natural 9.20-33; Heródoto 1.23-24 (Arión y el delfín)', 'licencia de juego', C10 + '. ' + LJ_ADORNO,
      'Los delfines abundan en el Mediterráneo y los antiguos los querían: Heródoto cuenta que uno salvó al músico Arión, y Plinio les dedica muchas páginas. Dibujarlos en el mapa es adorno.')),
    physeter: f(POR_CODIGO_C10, h('Plinio, Historia Natural 9.8 (el «physeter» del océano gálico)', 'licencia de juego', C10 + '. ' + LJ_ADORNO,
      'Plinio cuenta que en el océano de la Galia vive el físeter, una bestia enorme que se alza como una columna y escupe agua que podría hundir un barco. Era seguramente un cachalote. Dibujarlo en el mapa es adorno.'))
  };
  const GALERA = f(POR_CODIGO_C10, h('Polibio 1.20-21 (la primera flota romana, 260 a.C., copiada de un quinquerreme cartaginés); Casson, Ships and Seamanship in the Ancient World (1971)', 'probable', C10 + '. Galera de guerra con espolón, vela cuadra y ojo en la proa, como en vasos y relieves; los remos y el tamaño son a ojo. ' + LJ_ADORNO,
    'Las galeras de guerra de la época iban a remo y llevaban una vela cuadrada para navegar con viento a favor. Atacaban con el espolón de bronce de la proa. Roma construyó su primera gran flota en 260 a.C., copiando un barco cartaginés varado, según Polibio.'));
  for (const id of ['navis1', 'navis2', 'navis3', 'navis4', 'navis5']) adorno[id] = GALERA;
  adorno.ketos2 = adorno.ketos1;

  // ---- Pueblos y tribus del mapa (D.TRIBUS, C11). Dibujados por código; ficha larga en gobierno/historia/C11-pueblos.md ----
  // Cotejado el 17/11/2026 en LacusCurtius y Perseus (traducciones inglesas). Lo no cotejado queda «por cotejar», con la fuente de memoria.
  const POR_CODIGO_C11 = { sin: 'dibujado por código en js/gfx/map3d.js (cabañas, muros y cinta a tinta; sin archivo de arte ni licencia ajena)' };
  const LJ_TRIBU = 'licencia de juego: el sitio es aproximado y puesto a ojo; el poblado es genérico de su familia, no un lugar concreto';
  const COT = 'cotejado el 17/11/2026', MEM = 'citado de memoria, sin cotejar';
  const tri = (fuente, dictamen, nota) => f(POR_CODIGO_C11, h(fuente, dictamen, nota + ' · ' + LJ_TRIBU));
  const tribu = {
    lusitani: tri('Estrabón, Geografía 3.3.3 y 3.3.5; Apiano, Iberia 56-75 (Viriato)', 'historico', COT + ': Estrabón 3.3.3 llama a Lusitania «la mayor de las naciones ibéricas», al norte del Tajo; Apiano, ' + MEM + '. Que vivieran en castros de piedra es lectura arqueológica (cultura castreña), no de ese pasaje: probable'),
    callaeci: tri('Estrabón, Geografía 3.3.2-3; Apiano, Iberia 73-75 (Bruto, 137 a.C.)', 'por cotejar', MEM + '. Roma no llega hasta ellos hasta 137 a.C., después de la época del juego; el pueblo ya existía'),
    cantabri: tri('Estrabón, Geografía 3.3.7-8 y 3.4.12', 'por cotejar', MEM + '. Sin guerra con Roma en la época del juego (sus guerras son de 29-19 a.C.)'),
    vaccaei: tri('Polibio 3.14', 'historico', COT + ': Aníbal ataca a los vacceos y toma Hermandica al primer asalto, y luego Arbacala (220 a.C.)'),
    celtiberi: tri('Estrabón, Geografía 3.4.12-13; Polibio 35.1 (la «guerra de fuego», 153 a.C., ' + MEM + ')', 'historico', COT + ': Estrabón 3.4.13 los divide en cuatro partes, la más fuerte los arévacos, con Numancia'),
    carpetani: tri('Polibio 3.14', 'historico', COT + ': los carpetanos atacan a Aníbal junto al Tajo a la vuelta de los vacceos (220 a.C.)'),
    oretani: tri('Polibio 3.33.9 (oretes íberos en las tropas de Aníbal); Livio 35.7', 'por cotejar', MEM),
    turdetani: tri('Estrabón, Geografía 3.1.6 y 3.2.1-15; Livio 34.17-19', 'por cotejar', MEM + '. Estrabón los tiene por los más cultos de Iberia, con leyes escritas'),
    contestani: tri('Plinio, Historia Natural 3.19-20; Ptolomeo, Geografía 2.6.14', 'por cotejar', MEM),
    ilergetes: tri('Polibio 3.35; Livio 22.21 y 28.24-34 (Indíbil y Mandonio)', 'historico', COT + ': Polibio 3.35 escribe «Ilurgetes», sometidos por Aníbal al pasar el Ebro; Livio, ' + MEM),
    aquitani: tri('Estrabón, Geografía 4.1.1 y 4.2.1-2; César, Guerra de las Galias 1.1', 'por cotejar', MEM + '. Las fuentes que los describen son algo posteriores a la época del juego'),
    volcae: tri('Livio 21.26.6', 'historico', COT + ': los volcas pasan su gente a la otra orilla del Ródano para frenar a Aníbal (218 a.C.); aquí van hacia Tolosa (los volcas tectósages), ' + MEM),
    arverni: tri('Estrabón, Geografía 4.2.3 (Bituito, 121 a.C.)', 'por cotejar', MEM + '. Su gran poder lo cuentan fuentes algo posteriores'),
    aedui: tri('Estrabón, Geografía 4.3.2; César, Guerra de las Galias 1.10-11', 'por cotejar', MEM + '. «Amigos y hermanos» de Roma ya en el siglo II a.C. según fuentes posteriores'),
    belgae: tri('Estrabón, Geografía 4.4.3; César, Guerra de las Galias 1.1', 'por cotejar', MEM + '. Fuentes del siglo I a.C.'),
    allobroges: tri('Polibio 3.50', 'historico', COT + ': los jefes alóbroges ocupan las alturas del camino para atacar a Aníbal en los Alpes (3.49 no los nombra)'),
    taurini: tri('Polibio 3.60.8-10', 'probable', COT + ' en parte: Aníbal toma en tres días su ciudad principal; en el extracto leído no salía el nombre del pueblo'),
    ligures: tri('Polibio 2.16; Livio 39.1-2 y 40.38 (guerras ligures); Estrabón, Geografía 4.6.1-3', 'por cotejar', MEM + '. Sus castillos en las alturas (castella) los cita Livio'),
    cenomani: tri('Polibio 2.17 y 2.23-24', 'historico', COT + ': Polibio 2.17 los pone tras los ínsubres en el valle del Po; en 225 a.C. se ponen del lado de Roma (2.23-24, ' + MEM + ')'),
    boii: tri('Polibio 2.17.7, 2.20-31; Livio 21.25', 'historico', COT + ': Polibio 2.17 los pone en el valle del Po; la guerra de 225 y el ataque a Placentia y Cremona (Livio 21.25) son ' + MEM),
    veneti: tri('Polibio 2.17.5-6 y 2.23-24', 'historico', COT + ': Polibio 2.17.5 los nombra; que hablaran otra lengua que los galos y fueran aliados de Roma en 225 queda ' + MEM),
    samnites: tri('Plutarco, Pirro 13.6 y 17.5; Livio, Períocas 12-14', 'historico', COT + ': Pirro espera fuerzas del Samnio (13.6) y samnitas y lucanos se le unen tras Heraclea (17.5); Livio ' + MEM),
    lucani: tri('Plutarco, Pirro 13.6 y 17.5', 'historico', COT + ': como los samnitas'),
    bruttii: tri('Livio 22.61 y 23.30; Polibio 1.56 (de memoria); Estrabón, Geografía 6.1.4', 'por cotejar', MEM + '. Aliados de Pirro y luego de Aníbal'),
    dalmatae: tri('Polibio 32.13 (32.9 en otras ediciones)', 'historico', COT + ': el Senado decide la guerra contra los dálmatas; el año (156 a.C.) sale de los cónsules de 32.10'),
    ardiaei: tri('Polibio 2.4-12', 'historico', COT + ': la reina Teuta y la guerra de 229 a.C.; los ardieos se nombran en 2.11.10 y 2.12.2'),
    dardani: tri('Polibio 2.6.4; Livio 40.57', 'por cotejar', MEM + '. Vecinos y enemigos de los reyes de Macedonia'),
    scordisci: tri('Estrabón, Geografía 7.5.12; Livio 40.57 (de memoria)', 'por cotejar', MEM + '. Celtas que se quedaron en el Danubio tras la invasión de 279 a.C.: al empezar la partida (280) aún no estaban'),
    odrysae: tri('Polibio 23.8; Livio 39.53 y 45.42 (Cotis)', 'por cotejar', MEM + '. El reino tracio de los odrisios'),
    getae: tri('Estrabón, Geografía 7.3.13; Diodoro 21.12 (Dromiquetes captura a Lisímaco, h. 292 a.C.)', 'historico', COT + ': Estrabón 7.3.13 (getas y dacios hablan la misma lengua y cruzan el Istro); Diodoro, ' + MEM),
    paphlagones: tri('Estrabón, Geografía 12.3.9-10 y 12.3.41', 'por cotejar', MEM),
    galatae: tri('Livio 38.16.11-12; Estrabón, Geografía 12.5.1', 'historico', COT + ': las tres tribus (trocmos, tolistobogios, tectósages) se reparten Asia (Livio) y se gobiernan por tetrarquías (Estrabón). Pasan a Asia en 278-277 a.C.: al empezar la partida (280) aún no estaban'),
    pisidae: tri('Polibio 5.72-76 (Selge); Estrabón, Geografía 12.7.1-3', 'por cotejar', MEM),
    mauri: tri('Estrabón, Geografía 17.3.7; Salustio, Yugurta 18', 'historico', COT + ': Estrabón 17.3.7 los pinta casi todos nómadas, con el pelo trenzado y adornos de oro; Salustio 18 describe las mapalia, chozas alargadas «como quillas de barco», de los númidas'),
    masaesyli: tri('Livio 29.31-32 (Sífax)', 'historico', COT + ': Livio 29.32.14 escribe «Masaesulii», el pueblo de Sífax, al oeste. Chozas: Salustio, Yugurta 18 (cotejado)'),
    massyli: tri('Livio 29.29-32 (Masinisa)', 'historico', COT + ': Livio 29.32.13 escribe «Maesulii», el pueblo de Masinisa, al este; que Livio los diga expresamente pueblo de Masinisa en esos capítulos no se vio en lo leído. Chozas: Salustio, Yugurta 18 (cotejado)'),
    gaetuli: tri('Salustio, Yugurta 18-19; Estrabón, Geografía 17.3.2', 'por cotejar', MEM + '. Nómadas del interior, al sur de los númidas'),
    libyes: tri('Polibio 1.65-88 (la guerra de los mercenarios y los libios, 241-238 a.C.)', 'por cotejar', MEM + '. Los campesinos libios súbditos de Cartago'),
    nasamones: tri('Heródoto 4.172-173', 'historico', COT + ': Heródoto 4.172 los pone al oeste de los auschisas, con rebaños junto al mar en verano; la Sirte la nombra en 4.169 y 4.173. Heródoto escribe dos siglos antes de la época del juego')
  };


  // ---- Calzadas, puertos y rutas de mar del mapa (D.CALZADAS, D.PUERTOS, D.RUMBOS, C12). Dibujados por código; ficha larga en
  // gobierno/historia/C12-calzadas.md. Cotejado el 17/11/2026 en LacusCurtius (Estrabón, Polibio; trad. inglesas). Livio no cargó:
  // lo que sale de Livio queda de memoria. «histórico» solo si el pasaje se ha leído; si el año no se ha leído, «probable».
  const POR_CODIGO_C12 = { sin: 'dibujado por código en js/gfx/map3d.js (tinta roja, trazos y ancla; sin archivo de arte ni licencia ajena)' };
  const LJ_VIA = 'licencia de juego: el trazado va a ojo por las ciudades de paso sobre el mapa moderno, y los extremos van a la ciudad del juego (Capua, Tarento)';
  const LJ_PUERTO = 'licencia de juego: el ancla va en el agua junto al puerto; es adorno de carta';
  const LJ_RUMBO = 'licencia de juego: el trazado por el mar va a ojo; las fuentes dan los puertos y alguna distancia, no la derrota';
  const COT12 = 'cotejado el 17/11/2026', MEM12 = 'citado de memoria, sin cotejar';
  const via = (fuente, dictamen, nota) => f(POR_CODIGO_C12, h(fuente, dictamen, nota + ' · ' + LJ_VIA));
  const calzada = {
    appia: via('Estrabón, Geografía 5.3.6 y 6.3.7; Livio 9.29.5-6', 'probable', COT12 + ' en Estrabón 5.3.6: la Vía Apia va de Roma a Brentesio (Brundisium) y es la más transitada; 6.3.7: de Benevento a Roma el camino común es la Apia. El año (312 a.C., censura de Apio Claudio) sale de Livio 9.29, ' + MEM12),
    appiaB: via('Estrabón, Geografía 6.3.7; Veleyo Patérculo 1.14 (colonia de Brundisium)', 'probable', COT12 + ' en Estrabón 6.3.7: la Apia, por Venusia y Tarento, llega a Brentesio; de Roma a Brentesio, 360 millas. Ninguna fuente fecha la prolongación: se usa el año de la colonia latina de Brundisium (244 a.C., Veleyo 1.14, ' + MEM12 + '), marcado «hacia»: licencia de juego'),
    latina: via('Livio 26.8-9 (Aníbal marcha sobre Roma por la Vía Latina, 211 a.C.); Estrabón, Geografía 5.3.9', 'por cotejar', MEM12 + '. Camino anterior a 280 a.C. sin fecha de construcción: el mapa lo marca «camino antiguo»'),
    valeria: via('Livio 9.43.25 (censores de 307 a.C. hacen caminos por los campos); Estrabón, Geografía 5.3.11', 'por cotejar', MEM12 + '. Que el camino de los censores de 307 sea la Valeria (Tíbur-Alba Fucens-Corfinio) es lectura moderna: fecha marcada «hacia»'),
    salaria: via('Estrabón, Geografía 5.3.1; Plinio, Historia Natural 31.89', 'por cotejar', MEM12 + '. El camino de la sal de los sabinos es muy anterior a 280 a.C.; sin fecha: «camino antiguo»'),
    flaminia: via('Estrabón, Geografía 5.1.11; Livio, Períocas 20', 'probable', COT12 + ' en Estrabón 5.1.11: Flaminio hizo la Vía Flaminia de Roma, por Tirrenia y Umbría, hasta Ariminum. Estrabón lo hace cónsul con Lépido (187), confundiendo a dos Flaminios; el año 220 (censura de Gayo Flaminio) sale de Livio, Períocas 20, ' + MEM12),
    aurelia: via('Sin pasaje antiguo que la feche', 'por cotejar', 'el año 241 a.C. (censura de Gayo Aurelio Cota) es atribución moderna, sin pasaje: marcado «hacia». Aquí llega hasta Cosa; su prolongación a Pisa es de 109 a.C., fuera del juego'),
    aemilia: via('Estrabón, Geografía 5.1.11; Livio 39.2.10', 'probable', COT12 + ' en Estrabón 5.1.11: la Vía Emilia sigue a la Flaminia; de Placentia a Ariminum, 1.300 estadios. El año (187 a.C., cónsul Marco Emilio Lépido) sale de Livio 39.2.10, ' + MEM12),
    postumia: via('Inscripciones (CIL); sin pasaje literario', 'por cotejar', 'de Génova a Aquilea por Placentia, Cremona y Verona; atribuida al cónsul Espurio Postumio Albino (148 a.C.) por miliarios, ' + MEM12 + '. Es de las últimas del juego (146 a.C.)')
  };
  const pto = (fuente, dictamen, nota) => f(POR_CODIGO_C12, h(fuente, dictamen, nota + ' · ' + LJ_PUERTO));
  const puerto = {
    ostia: pto('Estrabón, Geografía 5.3.5 y 5.2.1', 'historico', COT12 + ': Ostia «no tiene puerto» por el limo del Tíber; los mercantes fondean mar adentro y descargan en barcas, o suben el río hasta Roma (190 estadios). En 5.2.1, puerto de la flota romana'),
    puteoli: pto('Livio 34.45.1 (colonia romana, 194 a.C.)', 'por cotejar', MEM12 + '. Antes de la colonia era la ciudad griega de Dicearquía'),
    brundisium: pto('Estrabón, Geografía 6.3.8', 'historico', COT12 + ': de Brentesio se cruza a los montes Ceraunios o a Epidamno, la travesía habitual'),
    tarentum: pto('Polibio 8.24-34 (Aníbal y el puerto de Tarento, 212 a.C.)', 'por cotejar', MEM12),
    syracusae: pto('Livio 25.23-31 (sitio de Siracusa); Tucídides 7', 'por cotejar', MEM12),
    messana: pto('Polibio 1.10-11 (los mamertinos piden ayuda a Roma)', 'por cotejar', MEM12),
    lilybaeum: pto('Polibio 1.41-42', 'probable', 'leído en resumen el 17/11/2026, sin el texto palabra por palabra: el cabo de Lilibeo está bien situado para atacar los promontorios frente a Cartago, a unos 1.000 estadios'),
    carthago: pto('Apiano, Líbica 96 (el puerto circular, el cotón)', 'por cotejar', MEM12),
    utica: pto('Polibio 1.73-75 (guerra de los mercenarios)', 'por cotejar', MEM12 + '. La costa antigua estaba más cerca de Útica; hoy el río la ha rellenado'),
    gades: pto('Estrabón, Geografía 3.5.3', 'por cotejar', MEM12),
    carthagonova: pto('Polibio 10.10 (el puerto de Cartago Nova, 209 a.C.)', 'por cotejar', MEM12),
    emporion: pto('Livio 34.9; Estrabón, Geografía 3.4.8', 'por cotejar', MEM12),
    massalia: pto('Estrabón, Geografía 4.1.4-5', 'por cotejar', MEM12),
    dyrrachium: pto('Estrabón, Geografía 6.3.8', 'historico', COT12 + ': Epidamno (Dirraquio) es la travesía habitual desde Brentesio. Que Epidamno y Dirraquio sean la misma ciudad lo dice Estrabón 7.5.8, ' + MEM12),
    piraeus: pto('Estrabón, Geografía 9.1.15', 'por cotejar', MEM12),
    rhodus: pto('Polibio 5.88-90 (el terremoto de Rodas y la ayuda de los reyes)', 'por cotejar', MEM12),
    alexandria: pto('Estrabón, Geografía 17.1.6-7', 'por cotejar', 'el pasaje no cargó el 17/11/2026 (LacusCurtius, Strabo/17A1); ' + MEM12 + ': Faro y dos puertos; el mayor mercado del mundo habitado')
  };
  const rum = (fuente, dictamen, nota) => f(POR_CODIGO_C12, h(fuente, dictamen, nota + ' · ' + LJ_RUMBO));
  const rumbo = {
    tyrrhenus: rum('Estrabón, Geografía 5.3.5-6', 'por cotejar', 'Ostia y Putéolos son puertos de Roma; la costa entre ambos, ' + MEM12),
    frumentarius: rum('Livio 23.38 y 27.5 (grano de Sicilia a Roma)', 'por cotejar', MEM12 + '. En el mapa el estrecho de Mesina sale cerrado (contorno simplificado): el trazo lo cruza'),
    libycus: rum('Polibio 1.42', 'probable', 'leído en resumen: Lilibeo, base para pasar a África, a unos 1.000 estadios de Cartago'),
    punicus: rum('Polibio 3.24 (tratado con Cartago: mares vedados a Roma); Estrabón, Geografía 3.5.5', 'por cotejar', MEM12),
    ibericus: rum('Estrabón, Geografía 3.4.8 y 4.1.5 (colonias de Massalia en Iberia)', 'por cotejar', MEM12),
    gallicus: rum('Polibio 3.41 (Publio Escipión navega a Massalia, 218 a.C.)', 'por cotejar', MEM12),
    hadriaticus: rum('Estrabón, Geografía 6.3.8', 'historico', COT12 + ': de Brentesio a Epidamno, la travesía habitual. Estrabón da 1.800 estadios; el editor cree que es error por unos 800'),
    ionius: rum('Tucídides 6-7 (Atenas y Siracusa); Polibio 5.101', 'por cotejar', MEM12),
    aegyptius: rum('Estrabón, Geografía 17.1.6-7; Polibio 5.88-90', 'por cotejar', MEM12 + '. Rodas vivía del comercio con Alejandría')
  };

  // ---- Vida en el mapa (D.VIDA, C13). Dibujada por código; ficha larga en gobierno/historia/C13-vida.md ----
  const POR_CODIGO_C13 = { sin: 'dibujado por código en js/gfx/map3d.js (formas sencillas con color; sin archivo de arte ni licencia ajena)' };
  const MEM13 = 'citado de memoria el 18/11/2026, por cotejar', LJ_VIDA = 'licencia de juego: los animales, barcos y carros son mucho mayores que a escala para que se vean, y van donde cae bien a la vista';
  const vid = (fuente, dictamen, nota, texto) => f(POR_CODIGO_C13, h(fuente, dictamen, nota + ' · ' + LJ_VIDA, texto));
  const vida = {
    ovis: vid('Varrón, De re rustica 2.1-2 y 2.2.9 (rebaños que pasan el verano en el Samnio y el invierno en Apulia); Polibio 2.15 (la Galia Cisalpina, rica en ganado)', 'por cotejar', MEM13 + '. Varrón escribe en 37 a.C., algo después de la época, pero cuenta costumbres antiguas'),
    capra: vid('Varrón, De re rustica 2.3; Polibio 12.3-4 (las cabras de Córcega)', 'por cotejar', MEM13 + '. En el mapa van sobre todo en los montes y en las tierras secas'),
    bos: vid('Catón, De agri cultura 10-11 (cuántos bueyes necesita una finca); Varrón, De re rustica 2.5', 'por cotejar', MEM13 + '. Catón escribe hacia 160 a.C., dentro de la época del juego'),
    fumus: vid('Virgilio, Bucólicas 1.82 («ya humean a lo lejos los tejados de las granjas»)', 'licencia de juego', MEM13 + '. El humo de los hogares es de todas las épocas; Virgilio es posterior (h. 39 a.C.)',
      'En las casas y cabañas antiguas el fuego del hogar ardía todo el día, para cocinar y calentarse, y el humo salía por el techo. De lejos, el humo era la señal de que un pueblo estaba vivo.'),
    oneraria: vid('Pecio de Kyrenia (Chipre, h. 300 a.C.); Casson, Ships and Seamanship in the Ancient World (1971)', 'probable', MEM13 + '. Mercante de casco redondo y una vela cuadrada, sin remos ni espolón; tamaño y forma a ojo',
      'Los barcos mercantes eran de casco ancho y redondo y navegaban a vela, sin remos. Llevaban ánforas de vino y aceite, grano y cerámica de puerto en puerto. El pecio de Kyrenia, hundido hacia 300 a.C. con su carga de ánforas, es uno de esa época.'),
    plaustrum: vid('Catón, De agri cultura 10-11 (los carros de la finca); Varrón, De re rustica 1.22', 'por cotejar', MEM13 + '. En el juego, un carro por calzada construida')
  };

  // ---- CE2: recursos guardados (D.RES_NOM), vetas de hierro (D.VETAS_HIERRO) y bienes guardados (D.BIENES). Sin arte propio: iconos de línea de ui.js ----
  const SIN_R = { sin: 'recurso: se dibuja con un icono de línea propio (js/ui.js), sin modelo' };
  const H_ETR = 'Diodoro 5.13 (hierro de Etalia, la isla de Elba, que se funde frente a Populonia); Estrabón 5.2.6 (Populonia y el hierro de Elba)';
  const H_HIS = 'Estrabón 3.2.8-10 (minas de Turdetania y de Hispania); Plinio, NH 34.149 (hierro de Hispania)';
  const recurso = {
    grano: f(SIN_R, h('', 'licencia de juego', 'el trigo como recurso que se produce, se guarda y se gasta es una abstracción del juego; las cifras son nuestras')),
    denarios: f(SIN_R, h('Crawford, Roman Republican Coinage (1974): el denario de plata se acuña desde h. 211 a.C.', 'licencia de juego', 'antes de h. 211 a.C. Roma pagaba con bronce (aes grave, piezas fundidas, y bronce a peso). El juego llama «denarios» a la moneda desde 280 a.C. para no cambiar de nombre a mitad de partida: licencia de juego')),
    materiales: f(SIN_R, h('', 'licencia de juego', 'madera y piedra van juntas en un solo recurso para que la ciudad sea más fácil de llevar en el móvil; aserradero y cantera siguen siendo edificios distintos')),
    hierro: f(SIN_R, h(H_ETR + '; ' + H_HIS, 'probable', 'Etruria (Elba y Populonia) e Hispania eran las grandes fuentes de hierro del Mediterráneo occidental; pasajes citados por el encargo CE2, por cotejar en Perseus. Que solo haya mina en esas ciudades y el precio del hierro comprado: licencia de juego'))
  };
  const vH = (fuente, nota) => f(SIN_R, h(fuente, 'licencia de juego', nota + '; qué ciudad concreta tiene veta es licencia de juego'));
  const veta = {
    volsinii: vH(H_ETR, 'ciudad etrusca: el hierro etrusco salía sobre todo de Elba y Populonia'), perusia: vH(H_ETR, 'ciudad etrusca: el hierro etrusco salía sobre todo de Elba y Populonia'),
    clusium: vH(H_ETR, 'ciudad etrusca: el hierro etrusco salía sobre todo de Elba y Populonia'), rusellae: vH(H_ETR, 'ciudad etrusca de la costa, cerca de Populonia y Elba'),
    emporion: vH(H_HIS, 'Hispania'), saguntum: vH(H_HIS, 'Hispania'), carthagonova: vH(H_HIS, 'Hispania; Carthago Nova es más famosa por sus minas de plata (Polibio 34.9, por cotejar)'), tarraco: vH(H_HIS, 'Hispania'), gades: vH(H_HIS, 'Hispania')
  };
  const BIEN_LIC = h('', 'licencia de juego', 'guardar el bien en almacén, su tope, su precio fijo y que los ricos lo consuman cada mes es regla del juego; de dónde salía cada bien está en su ficha de bien especial');
  const bien = {}; for (const k of ['sal', 'vino', 'caballos', 'pieles', 'plata', 'marmol', 'purpura', 'maderanaval']) bien[k] = f(SIN_R, BIEN_LIC);


  // ---- Bandos del Senado de familias (D.BANDOS, CE6). Se casan por id. Bandos como grupos fijos dirigidos por una familia: licencia de juego
  //      (no había partidos; Scullard, Roman Politics 220–150 B.C., 1951, habla de grupos de familias, matizado por Gruen y Brunt). ----
  const SIN_BAN = { sin: 'un bando del Senado no tiene modelo 3D' }, LIC_BAN = 'grupo fijo, escaños por población y provincia, humor y cifras: licencia de juego';
  const bando = {
    ter: f(SIN_BAN, h('Livio 27.11 (Q. Fabio Máximo, princeps senatus, 209 a.C.); Plutarco, Fabio Máximo', 'historico', LIC_BAN, 'Los Fabios, gran familia patricia con tierras. Quinto Fabio Máximo, el Contemporizador, fue Príncipe del Senado.')),
    mer: f(SIN_BAN, h('Plutarco, Emilio Paulo 28–38 (Pidna, 168 a.C., y el botín de Macedonia); Livio 21.63 (ley Claudia, 218 a.C.)', 'probable', LIC_BAN + '; los senadores no podían comerciar a lo grande (ley Claudia): Emilios con los mercaderes es licencia de juego', 'Los Emilios: Lucio Emilio Paulo venció en Pidna y trajo tanto botín que Roma dejó de cobrar tributo.')),
    mil: f(SIN_BAN, h('Polibio 10.2–20; Livio 26–30 (Escipión en Hispania, 210–206 a.C., y en África, 204–202 a.C.)', 'historico', LIC_BAN, 'Los Escipiones: Publio Cornelio Escipión venció a Aníbal en Zama. Familia de generales.')),
    sac: f(SIN_BAN, h('Livio 27.8 (C. Valerio Flaco, flamen de Júpiter, 209 a.C.)', 'probable', LIC_BAN + '; que los Valerios lleven a los sacerdotes es licencia de juego', 'Los Valerios: Cayo Valerio Flaco fue flamen de Júpiter, uno de los sacerdocios más altos de Roma.')),
    ita: f(SIN_BAN, h('Cicerón, Pro Plancio 20 (los Fulvios, de Túsculo); Apiano, Guerras civiles 1.21 (M. Fulvio Flaco propone la ciudadanía para los itálicos, 125 a.C.)', 'probable', LIC_BAN + '; la propuesta de Flaco es de 125 a.C., fuera del periodo', 'Los Fulvios venían de Túsculo, ciudad latina. Uno de ellos pidió después la ciudadanía para los aliados itálicos.')),
    pro: f(SIN_BAN, h('Cicerón, In Verrem 2.4.89 (los Claudios Marcelos, patronos de Sicilia desde la toma de Siracusa, 212 a.C.)', 'historico', LIC_BAN, 'Los Claudios Marcelos tomaron Siracusa en 212 a.C. y desde entonces fueron patronos de toda Sicilia.')),
    pue: f(SIN_BAN, h('Livio 23–25 (Ti. Sempronio Graco, cónsul en 215 y 213 a.C.); Plutarco, Tiberio Graco (tribuno de la plebe en 133 a.C.)', 'probable', LIC_BAN + '; los Gracos, tribunos del pueblo, son de después del 146 a.C.', 'Los Sempronios: sus nietos, los Gracos, fueron los grandes tribunos de la plebe. Por eso aquí llevan al pueblo.'))
  };
  // ---- Provincias del Senado (D.PROVINCIAS, CE6): agrupan ciudades y dan sus escaños a un bando afín. El Senado no representaba territorios: licencia de juego. ----
  const SIN_PRO = { sin: 'una provincia del Senado no tiene modelo 3D' }, LIC_PRO = 'agrupación de ciudades, bando afín y escaños: licencia de juego';
  const provincia = {};
  for (const id of ['lacio', 'campania', 'etruria', 'magnagrecia', 'cisalpina', 'sicilia', 'cerdena', 'hispania', 'grecia', 'galia', 'africa']) provincia[id] = f(SIN_PRO, h('Livio 23.23 (unos 300 senadores); Cicerón, In Verrem 2.2.2 (Sicilia, primera provincia)', 'licencia de juego', LIC_PRO));
  /* CDe1-C: las diez obras de ciudad nuevas (js/ciudad.js, EDIF). Arte: piezas ya cargadas de 0 A.D. reutilizadas; no hay modelo propio de cada obra. */
  const obra = {
    termas: f(est('mercado', { nota: 'baños con la pieza del mercado, provisional' , provisional: true }), h('Plauto (balneae); las grandes termas son de Agripa, 25 a.C.', 'probable', 'baños de pago en el siglo II a.C.; por eso se llaman «Baños» y no «termas»; su efecto sobre salud y limpieza es licencia de juego')),
    acueducto: f(est('arco', { nota: 'tramo de arcos de 0 A.D.' }), h('Frontino, Acueductos 1.5 (Aqua Appia, 312 a.C., censura de Apio Claudio)', 'historico')),
    cloaca: f(est('prop_pozo', { nota: 'sumidero con la pieza del pozo, provisional', provisional: true }), h('Livio 1.38 y 1.56 (Cloaca Máxima)', 'historico', 'la tradición la atribuye a los reyes')),
    medico: f(est('casa_c', { nota: 'tienda con una casa, provisional', provisional: true }), h('Plinio, Historia natural 29.12 (Arcágato, primer médico griego en Roma, 219 a.C.)', 'historico')),
    jardin: f(est('olivo', { nota: 'verde con el olivo de 0 A.D., provisional', provisional: true }), h('', 'licencia de juego', 'un jardín público de barrio es una pieza del juego')),
    parque: f(est('cipres', { nota: 'verde con el ciprés de 0 A.D., provisional', provisional: true }), h('', 'licencia de juego', 'un parque público de barrio es una pieza del juego')),
    curia: f(est('foro', { nota: 'RESERVA PROVISIONAL: el centro cívico de 0 A.D. no es una curia', provisional: true }), h('Livio 1.30 (Curia Hostilia, tradición de Tulo Hostilio)', 'probable', 'sede del Senado; el modelo es provisional')),
    comicio: f(est('mercado', { nota: 'plaza con la pieza del mercado, provisional', provisional: true }), h('Livio 1.36 (el comicio, junto al foro); Polibio 6.14', 'probable', 'plaza donde vota el pueblo; su coste y sitio son licencia de juego')),
    astillero: f(est('puerto', { nota: 'con la pieza del puerto' }), h('Polibio 1.20-1.21 (la flota de 260 a.C., construida deprisa); Livio 40.51 (arsenal)', 'probable', 'obra de la costa; coste y sitio son licencia de juego')),
    faro: f(est('torre', { nota: 'torre de 0 A.D., provisional', provisional: true }), h('Suetonio, Claudio 20 (faro de Ostia, siglo I d.C.); Estrabón 17.1.6 (Faros de Alejandría, 280 a.C.)', 'probable', 'en Roma no hay faro antes de 146; el de Alejandría es de 280 a.C.; el juego lo deja en la costa como licencia de juego'))
  };
  /* CDe1-C: reglas y cargos de la ciudad nueva (D.SISTEMAS). Sin modelo 3D. */
  const SIN_REGLA = { sin: 'una regla o un cargo no tiene modelo 3D' };
  const sistema = {
    ministros: f(SIN_REGLA, h('Regla de juego: el Senado reparte encargos entre ministros', 'licencia de juego', 'en la República no había ministros, sino magistrados con tareas propias')),
    censor: f(SIN_REGLA, h('Livio 9.29; Frontino, Acueductos 1.5 (Aqua Appia, 312 a.C.); Polibio 6.13', 'historico', 'los censores llevaban las obras públicas y los arriendos')),
    edil: f(SIN_REGLA, h('Cicerón, Leyes 3.7', 'historico', 'los ediles cuidaban mercados, calles, grano y juegos; el «edil del grano» es un edil plebeyo con el abasto (las Ceriales son del 44 a.C.)')),
    cuestor: f(SIN_REGLA, h('Polibio 6.13', 'probable', 'los cuestores guardaban el tesoro (aerarium); el ministro del juego es una simplificación')),
    pontifice: f(SIN_REGLA, h('Livio 1.20 (los pontífices, desde Numa)', 'probable', 'los pontífices cuidaban el culto y el calendario')),
    legado: f(SIN_REGLA, h('Polibio 6.12; Livio 26.1', 'probable', 'los legados acompañaban al general; el encargo es licencia de juego')),
    publicanos: f(SIN_REGLA, h('Polibio 6.17 (los censores arriendan contratos a los publicanos)', 'historico', 'el «procurador de minas» es imperial; en la República eran publicanos')),
    necesidades: f(SIN_REGLA, h('Frontino, Acueductos 1.5; Livio 1.38; Plinio, Historia natural 29.12; Cicerón, Leyes 3.7', 'licencia de juego', 'que el servicio llegue por la calle hasta la casa, las ocho necesidades, el umbral del 80 % y los pesos de cada clase son reglas del juego')),
    revuelta: f(SIN_REGLA, h('Livio 2.32 (secesión de la plebe, 494 a.C.); Livio, Periocha 11 y Plinio, Historia natural 16.37 (287 a.C., lex Hortensia)', 'historico', 'calmarla con grano o juegos se inspira en Livio 31.4 y 31.50; los repartos de grano por ley son de Cayo Graco (123 a.C.) y quedan fuera de la época')),
    planSenado: f(SIN_REGLA, h('Polibio 6.13 y 6.17; Livio 9.33-34, 39.44, 40.46, 44.16', 'licencia de juego', 'el Senado concedía el dinero de las obras y los censores las contrataban (histórico), pero votar planes por bandos y el juicio final son licencia de juego'))
  };
  R.fichas = { obra, sistema, vida, calzada, puerto, rumbo, tribu, monumento, adorno, sitio, terreno, piezaTerreno, edificio, tropa, fiesta, leva, remedio, ciudad, hecho, mision, ley, encargo, hito, colonia, region, modo, zona, faccion, mejora, tipo, especial, recurso, veta, bien, invest, edad: edades, pueblo, bando, provincia };

  /* De qué tabla de data.js sale cada tipo y qué campos son obligatorios allí (lo usa el juez).
     numericos: números sueltos · mapas: objetos de números (costes, guarnición) · textos: cadenas · segunClase: extra según cls. */
  R.tipos = {
    obra: { tabla: 'OBRAS', numericos: [], textos: ['n', 'fam'] },
    sistema: { tabla: 'SISTEMAS', numericos: [], textos: ['n'] },
    edificio: { tabla: 'BUILD', numericos: ['time'], mapas: ['cost'], textos: ['n', 'd'] },
    tropa: { tabla: 'UNITS', numericos: ['atk', 'def', 'spd', 'mor', 'up'], textos: ['n', 'cls'], segunClase: { rng: ['ratk', 'range'] } },
    ciudad: { tabla: 'CITIES', numericos: ['lon', 'lat', 'w', 'wl'], mapas: ['g'], textos: ['n', 'f'] },
    hecho: { tabla: 'EVENTS', lista: true, numericos: ['y'], textos: ['t', 'x'] },
    zona: { tabla: 'ZONAS', numericos: [], textos: ['n'] },
    region: { tabla: 'REGIONES', numericos: ['hasta'], textos: ['n', 'capitalRival'] },
    modo: { tabla: 'MODOS', numericos: [], textos: ['n'] },
    sitio: { tabla: 'SITIOS', numericos: ['c', 'p'], textos: ['n', 'r'] },
    terreno: { tabla: 'TERRENOS', numericos: [], textos: ['n', 'd'] },
    piezaTerreno: { tabla: 'PIEZAS_TERRENO', numericos: [], textos: ['n', 'd'] },
    colonia: { tabla: 'COLONIAS', numericos: ['lon', 'lat', 'anio', 'colonos'], textos: ['n', 'h', 'tipo'] },
    mision: { tabla: 'MISIONES', numericos: ['desde', 'plazo'], textos: ['n', 'texto'] },
    ley: { tabla: 'LEYES', numericos: [], textos: ['n', 'texto'] },
    bando: { tabla: 'BANDOS', numericos: [], textos: ['n', 'fam'] },
    provincia: { tabla: 'PROVINCIAS', numericos: [], textos: ['n'] },
    encargo: { tabla: 'ENCARGOS', numericos: ['plazo'], textos: ['n', 'texto'] },
    hito: { tabla: 'HITOS', numericos: [], textos: ['n', 'texto'] },
    faccion: { tabla: 'FACTIONS', numericos: [], textos: ['n', 'col'] },
    mejora: { tabla: 'FORJA', numericos: ['time'], mapas: ['cost'], textos: ['n', 'ef'] },
    tipo: { tabla: 'TIPOS', numericos: [], textos: ['n', 'i', 'd'] },
    especial: { tabla: 'ESPECIAL', numericos: [], textos: ['n', 'i', 'd'] },
    pueblo: { tabla: 'PUEBLO_TIPOS', numericos: [], textos: ['n', 'i', 'd'] },
    invest: { tabla: 'INVEST', numericos: ['edad', 'time'], mapas: ['cost'], textos: ['n', 'i', 'rama'] },
    edad: { tabla: 'EDADES', numericos: ['edad', 'time'], mapas: ['cost'], textos: ['n'] },
    fiesta: { tabla: 'FIESTAS', numericos: ['mult', 'min', 'dura', 'reposo'], textos: ['n', 'i', 'd'] },
    leva: { tabla: 'LEVA_FICHAS', numericos: [], textos: ['n', 'i', 'd'] },
    remedio: { tabla: 'REMEDIOS', numericos: [], textos: ['n', 'i', 'd'] },
    monumento: { tabla: 'MONUMENTOS', numericos: ['lon', 'lat'], textos: ['n'] },
    adorno: { tabla: 'ADORNOS', numericos: ['lon', 'lat', 't'], textos: ['n', 'clase'] },
    tribu: { tabla: 'TRIBUS', numericos: ['lon', 'lat'], textos: ['n', 'la', 'gente', 'casa'] },
    calzada: { tabla: 'CALZADAS', numericos: [], textos: ['n', 'la'] },
    puerto: { tabla: 'PUERTOS', numericos: ['lon', 'lat'], textos: ['n', 'la'] },
    rumbo: { tabla: 'RUMBOS', numericos: [], textos: ['n'] },
    vida: { tabla: 'VIDA', numericos: [], textos: ['n', 'la'] },
    recurso: { tabla: 'RES_NOM', numericos: [], textos: [] },   // CE2
    veta: { tabla: 'VETAS_HIERRO', numericos: [], textos: [] },   // CE2: lista de ids de ciudad
    bien: { tabla: 'BIENES', numericos: ['precio'], textos: [] }   // CE2: bienes guardados
  };

  /* Ficha de una pieza. Para un hecho vale el id completo ('280-pirro') o solo el año (280; si hay dos, el primero). */
  R.de = function (tipo, id) {
    const t = R.fichas[tipo]; if (!t) return null;
    if (t[id]) return t[id];
    if (tipo === 'hecho') { const k = Object.keys(t).find(x => x.split('-')[0] === String(id)); return k ? t[k] : null; }
    return null;
  };

  /* GM43i: sonido grabado (assets/sonido, todo CC0 1.0). Uno por archivo; lo comprueba gobierno/arte.mjs */
  R.sonidos = {
    madera1: { archivo: 'assets/sonido/madera1.mp3', licencia: 'CC0 1.0', credito: 'rubberduck', fuente: 'https://opengameart.org/content/100-cc0-sfx' },
    madera2: { archivo: 'assets/sonido/madera2.mp3', licencia: 'CC0 1.0', credito: 'rubberduck', fuente: 'https://opengameart.org/content/100-cc0-sfx' },
    madera3: { archivo: 'assets/sonido/madera3.mp3', licencia: 'CC0 1.0', credito: 'rubberduck', fuente: 'https://opengameart.org/content/80-cc0-rpg-sfx' },
    madera4: { archivo: 'assets/sonido/madera4.mp3', licencia: 'CC0 1.0', credito: 'rubberduck', fuente: 'https://opengameart.org/content/80-cc0-rpg-sfx' },
    hierro1: { archivo: 'assets/sonido/hierro1.mp3', licencia: 'CC0 1.0', credito: 'rubberduck', fuente: 'https://opengameart.org/content/100-cc0-sfx' },
    hierro2: { archivo: 'assets/sonido/hierro2.mp3', licencia: 'CC0 1.0', credito: 'rubberduck', fuente: 'https://opengameart.org/content/100-cc0-sfx' },
    hierro3: { archivo: 'assets/sonido/hierro3.mp3', licencia: 'CC0 1.0', credito: 'rubberduck', fuente: 'https://opengameart.org/content/100-cc0-sfx' },
    hierro4: { archivo: 'assets/sonido/hierro4.mp3', licencia: 'CC0 1.0', credito: 'marchelonia', fuente: 'https://freesound.org/s/588278/' },
    escudo1: { archivo: 'assets/sonido/escudo1.mp3', licencia: 'CC0 1.0', credito: 'marchelonia', fuente: 'https://freesound.org/s/588278/' },
    escudo2: { archivo: 'assets/sonido/escudo2.mp3', licencia: 'CC0 1.0', credito: 'marchelonia', fuente: 'https://freesound.org/s/588278/' },
    escudo3: { archivo: 'assets/sonido/escudo3.mp3', licencia: 'CC0 1.0', credito: 'rubberduck', fuente: 'https://opengameart.org/content/100-cc0-sfx' },
    escudo4: { archivo: 'assets/sonido/escudo4.mp3', licencia: 'CC0 1.0', credito: 'rubberduck', fuente: 'https://opengameart.org/content/100-cc0-sfx' },
    paso1: { archivo: 'assets/sonido/paso1.mp3', licencia: 'CC0 1.0', credito: 'Kenney', fuente: 'https://opengameart.org/content/50-rpg-sound-effects' },
    paso2: { archivo: 'assets/sonido/paso2.mp3', licencia: 'CC0 1.0', credito: 'Kenney', fuente: 'https://opengameart.org/content/50-rpg-sound-effects' },
    paso3: { archivo: 'assets/sonido/paso3.mp3', licencia: 'CC0 1.0', credito: 'Kenney', fuente: 'https://opengameart.org/content/50-rpg-sound-effects' },
    paso4: { archivo: 'assets/sonido/paso4.mp3', licencia: 'CC0 1.0', credito: 'Kenney', fuente: 'https://opengameart.org/content/50-rpg-sound-effects' },
    vuelo1: { archivo: 'assets/sonido/vuelo1.mp3', licencia: 'CC0 1.0', credito: 'artisticdude', fuente: 'https://opengameart.org/content/swishes-sound-pack' },
    vuelo2: { archivo: 'assets/sonido/vuelo2.mp3', licencia: 'CC0 1.0', credito: 'artisticdude', fuente: 'https://opengameart.org/content/swishes-sound-pack' },
    vuelo3: { archivo: 'assets/sonido/vuelo3.mp3', licencia: 'CC0 1.0', credito: 'artisticdude', fuente: 'https://opengameart.org/content/swishes-sound-pack' },
    esfuerzo1: { archivo: 'assets/sonido/esfuerzo1.mp3', licencia: 'CC0 1.0', credito: 'ale-batec', fuente: 'https://freesound.org/s/511023/' },
    esfuerzo2: { archivo: 'assets/sonido/esfuerzo2.mp3', licencia: 'CC0 1.0', credito: 'ale-batec', fuente: 'https://freesound.org/s/511023/' },
    esfuerzo3: { archivo: 'assets/sonido/esfuerzo3.mp3', licencia: 'CC0 1.0', credito: 'ale-batec', fuente: 'https://freesound.org/s/511023/' },
    esfuerzo4: { archivo: 'assets/sonido/esfuerzo4.mp3', licencia: 'CC0 1.0', credito: 'ale-batec', fuente: 'https://freesound.org/s/511023/' },
    herido1: { archivo: 'assets/sonido/herido1.mp3', licencia: 'CC0 1.0', credito: 'salemaudio', fuente: 'https://freesound.org/s/803168/' },
    herido2: { archivo: 'assets/sonido/herido2.mp3', licencia: 'CC0 1.0', credito: 'salemaudio', fuente: 'https://freesound.org/s/803168/' },
    orden1: { archivo: 'assets/sonido/orden1.mp3', licencia: 'CC0 1.0', credito: 'DeqstersLab', fuente: 'https://freesound.org/s/661242/' },
    aclamacion1: { archivo: 'assets/sonido/aclamacion1.mp3', licencia: 'CC0 1.0', credito: 'HowardV', fuente: 'https://freesound.org/s/264377/' },
    aclamacion2: { archivo: 'assets/sonido/aclamacion2.mp3', licencia: 'CC0 1.0', credito: 'HowardV', fuente: 'https://freesound.org/s/264377/' },
    panico1: { archivo: 'assets/sonido/panico1.mp3', licencia: 'CC0 1.0', credito: 'Archeos', fuente: 'https://freesound.org/s/325548/' },
    panico2: { archivo: 'assets/sonido/panico2.mp3', licencia: 'CC0 1.0', credito: 'IENBA', fuente: 'https://freesound.org/s/491405/' },
    canto1: { archivo: 'assets/sonido/canto1.mp3', licencia: 'CC0 1.0', credito: 'marconi68', fuente: 'https://freesound.org/s/588578/' },
    canto2: { archivo: 'assets/sonido/canto2.mp3', licencia: 'CC0 1.0', credito: 'marconi68', fuente: 'https://freesound.org/s/588578/' },
    quejido1: { archivo: 'assets/sonido/quejido1.mp3', licencia: 'CC0 1.0', credito: 'Morshuman', fuente: 'https://freesound.org/s/556006/' },
    quejido2: { archivo: 'assets/sonido/quejido2.mp3', licencia: 'CC0 1.0', credito: 'RepDac3', fuente: 'https://freesound.org/s/477756/' },
    coro1: { archivo: 'assets/sonido/coro1.mp3', licencia: 'CC0 1.0', credito: 'Jace', fuente: 'https://freesound.org/s/57204/' },
    grito1: { archivo: 'assets/sonido/grito1.mp3', licencia: 'CC0 1.0', credito: 'joelcarrsound', fuente: 'https://freesound.org/s/521830/' },
    grito2: { archivo: 'assets/sonido/grito2.mp3', licencia: 'CC0 1.0', credito: 'joelcarrsound', fuente: 'https://freesound.org/s/521831/' },
    grito3: { archivo: 'assets/sonido/grito3.mp3', licencia: 'CC0 1.0', credito: 'joelcarrsound', fuente: 'https://freesound.org/s/521832/' },
    clamor1: { archivo: 'assets/sonido/clamor1.mp3', licencia: 'CC0 1.0', credito: 'WelvynZPorterSamples', fuente: 'https://freesound.org/s/621374/' },
    clamor2: { archivo: 'assets/sonido/clamor2.mp3', licencia: 'CC0 1.0', credito: 'florianreichelt', fuente: 'https://freesound.org/s/563011/' },
    cuerno1: { archivo: 'assets/sonido/cuerno1.mp3', licencia: 'CC0 1.0', credito: 'adharca', fuente: 'https://freesound.org/s/539956/' },
    cuerno2: { archivo: 'assets/sonido/cuerno2.mp3', licencia: 'CC0 1.0', credito: 'DeVern', fuente: 'https://freesound.org/s/512490/' },
    lucha1: { archivo: 'assets/sonido/lucha1.mp3', licencia: 'CC0 1.0', credito: 'DeadVDI', fuente: 'https://freesound.org/s/376646/' },
    lucha2: { archivo: 'assets/sonido/lucha2.mp3', licencia: 'CC0 1.0', credito: 'mario1298', fuente: 'https://freesound.org/s/177084/' },
    viento1: { archivo: 'assets/sonido/viento1.mp3', licencia: 'CC0 1.0', credito: 'Globofonia', fuente: 'https://freesound.org/s/553733/' }
  };

  /* SON2: las frases habladas (assets/voces/<id>.mp3, id = el de la frase de js/voces.js; griego1-3 = gritos del enemigo griego).
     Hechas por AQVILA con Piper (síntesis de voz libre) y la voz es_ES-sharvard-medium (datos Sharvard, CC BY 3.0, Univ. de Edimburgo); detalle en assets/voces/LICENSE.txt. */
  const VOCES_HABLADAS = 'espera-1 espera-2 espera-3 espera-4 espera-5 espera-6 espera-7 espera-8 espera-9 pila-12 pila-13 pila-14 pila-15 pila-16 choque-18 choque-19 choque-20 choque-21 choque-22 choque-23 empujar-26 empujar-27 empujar-28 empujar-29 empujar-30 aguantar-31 aguantar-32 aguantar-33 aguantar-34 carga-enemiga-35 carga-enemiga-36 carga-enemiga-37 elefantes-41 elefantes-42 elefantes-43 elefantes-44 caballeria-47 caballeria-48 caballeria-49 caballeria-50 flanco-52 flanco-53 flanco-54 flanco-55 cansancio-56 cansancio-57 cansancio-58 cansancio-59 flaquea-60 flaquea-61 flaquea-62 flaquea-63 flaquea-64 roto-propio-65 roto-propio-66 roto-propio-67 roto-propio-68 roto-enemigo-69 roto-enemigo-70 roto-enemigo-71 enemigo-cede-73 enemigo-cede-74 enemigo-cede-75 relevo-77 relevo-78 relevo-79 relevo-80 victoria-81 victoria-82 victoria-83 victoria-84 derrota-85 derrota-86 derrota-87 lucha-89 lucha-90 lucha-91 griego1 griego2 griego3'.split(' ');
  /* SON5: las frases en griego antiguo de nuestra falange (gr-*) y los gritos de guerra en español de Cartago, los galos y los íberos (ca-*, ga-*, ib-*); ids de js/voces.js (GRIEGAS, GRITOS) */
  const VOCES_SON5 = 'gr-espera-1 gr-espera-2 gr-espera-3 gr-espera-4 gr-pila-5 gr-pila-6 gr-choque-7 gr-choque-8 gr-choque-9 gr-empujar-10 gr-empujar-11 gr-empujar-12 gr-aguantar-13 gr-aguantar-14 gr-carga-enemiga-15 gr-carga-enemiga-16 gr-elefantes-17 gr-elefantes-18 gr-caballeria-19 gr-flanco-20 gr-flanco-21 gr-cansancio-22 gr-flaquea-23 gr-flaquea-24 gr-roto-propio-25 gr-roto-propio-26 gr-roto-enemigo-27 gr-roto-enemigo-28 gr-enemigo-cede-29 gr-enemigo-cede-30 gr-victoria-31 gr-victoria-32 gr-derrota-33 gr-derrota-34 gr-lucha-35 gr-lucha-36 ca-espera-1 ca-espera-2 ca-empujar-3 ca-choque-4 ca-elefantes-5 ca-roto-enemigo-6 ca-victoria-7 ca-derrota-8 ga-espera-9 ga-empujar-10 ga-choque-11 ga-carga-enemiga-12 ga-roto-enemigo-13 ga-victoria-14 ga-derrota-15 ib-espera-16 ib-empujar-17 ib-choque-18 ib-flaquea-19 ib-roto-enemigo-20 ib-victoria-21 ib-derrota-22'.split(' ');
  /* SON9: la arenga del general, las preguntas de los oficiales y el clamor de la tropa (js/dialogos.js, DICHOS); ids dl-* */
  const VOCES_SON9 = 'dl-arenga-hogares dl-arenga-botin dl-arenga-auspicios dl-clamor dl-q-elefantes dl-q-caballeria dl-q-flanco dl-q-triarios dl-q-cansancio dl-q-flaquea dl-q-tiempo'.split(' ');
  for (const id of VOCES_HABLADAS.concat(VOCES_SON5, VOCES_SON9)) R.sonidos[id] = { archivo: 'assets/voces/' + id + '.mp3', licencia: 'CC BY 3.0', credito: 'Voz sintética hecha con Piper y es_ES-sharvard-medium; datos del Corpus Sharvard: Vincent Aubanel, Maria Luisa García Lecumberri, Martin Cooke (Univ. de Edimburgo)', fuente: 'https://datashare.ed.ac.uk/handle/10283/574' };

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
