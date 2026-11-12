/* AQVILA — datos del juego: edificios, unidades, facciones, ciudades y hechos históricos */
(function (root) {
  const D = {};
  D.START_YEAR = 280; // a.C.
  D.TURNO_MESES = 3; // una estación = un turno
  D.ESTACIONES = ['Primavera', 'Verano', 'Otoño', 'Invierno']; // el año empieza en Ianuarius (invierno): ver G.estacion
  D.END_YEAR = 146;   // a.C. — destrucción histórica de Cartago

  D.RES = ['madera', 'piedra', 'hierro', 'grano', 'oro'];
  D.POP_ICON = '👥';
  D.RES_ICON = { madera: '🪵', piedra: '🪨', hierro: '⚒️', grano: '🌾', oro: '🪙' };
  D.MONTHS = ['Ianuarius', 'Februarius', 'Martius', 'Aprilis', 'Maius', 'Iunius', 'Quintilis', 'Sextilis', 'September', 'October', 'November', 'December'];

  D.BUILD = {
    aserradero: { n: 'Aserradero', i: '🪓', prod: 'madera', cost: { madera: 30, piedra: 50, hierro: 20, grano: 20 }, time: 1.5, d: 'Produce madera.' },
    cantera: { n: 'Cantera', i: '⛏️', prod: 'piedra', cost: { madera: 50, piedra: 20, hierro: 30, grano: 20 }, time: 1.5, d: 'Produce piedra.' },
    mina: { n: 'Mina de hierro', i: '⚒️', prod: 'hierro', cost: { madera: 50, piedra: 40, hierro: 15, grano: 25 }, time: 1.5, d: 'Produce hierro.' },
    granja: { n: 'Granja', i: '🌾', prod: 'grano', cost: { madera: 40, piedra: 40, hierro: 20, grano: 10 }, time: 1.5, d: 'Produce grano. Las tropas lo consumen.' },
    viviendas: { n: 'Ínsulas', i: '🏘️', solar: 1, cost: { madera: 60, piedra: 50, hierro: 10, grano: 30 }, time: 1.8, d: 'Viviendas: aumentan la población máxima. La población paga impuestos y de ella salen los reclutas.' },
    foro: { n: 'Foro', i: '🏛️', solar: 1, prod: 'oro', cost: { madera: 80, piedra: 90, hierro: 40, grano: 40 }, time: 2.5, d: 'Recauda denarios, acelera las obras un 4 % por nivel y permite más población.' },
    almacen: { n: 'Almacén', i: '🏺', solar: 1, cost: { madera: 70, piedra: 60, hierro: 30, grano: 20 }, time: 2, d: 'Aumenta la capacidad de almacenamiento.' },
    mercado: { n: 'Mercado', i: '⚖️', solar: 1, cost: { madera: 80, piedra: 70, hierro: 30, grano: 30, oro: 40 }, time: 2.5, d: 'Permite cambiar unos recursos por otros. Cada nivel mejora el cambio.' },
    puerto: { n: 'Puerto', i: '⚓', solar: 1, cost: { madera: 140, piedra: 80, hierro: 50, grano: 30, oro: 60 }, time: 3, sea: true, d: 'Necesario para embarcar ejércitos por rutas marítimas. Da ingresos por comercio y acorta las travesías.' },
    cuartel: { n: 'Cuartel', i: '⚔️', solar: 1, cost: { madera: 90, piedra: 60, hierro: 70, grano: 40 }, time: 2.5, d: 'Recluta infantería. Nv 3: Príncipes. Nv 5: Triarios.' },
    establo: { n: 'Establo', i: '🐎', solar: 1, cost: { madera: 110, piedra: 60, hierro: 80, grano: 70 }, time: 3, d: 'Recluta caballería (Équites).' },
    muralla: { n: 'Muralla', i: '🧱', cost: { madera: 40, piedra: 120, hierro: 30, grano: 20 }, time: 3, d: '+10 % de defensa por nivel y más guardia urbana al defender.' },
    herreria: { n: 'Herrería', i: '🔨', solar: 1, cost: { madera: 70, piedra: 60, hierro: 90, grano: 30, oro: 30 }, time: 2.5, d: 'Forja mejoras de armas y armaduras para todo el ejército. Cada mejora no puede pasar del nivel de la herrería.' },
    acueducto: { n: 'Acueducto', i: '🌉', solar: 1, cost: { madera: 90, piedra: 160, hierro: 50, grano: 50, oro: 60 }, time: 3.5, d: 'Trae agua a la ciudad: +40 de población máxima por nivel.' },
    termas: { n: 'Termas', i: '♨️', solar: 1, cost: { madera: 100, piedra: 140, hierro: 40, grano: 60, oro: 80 }, time: 3.5, d: 'Baños públicos: +4 de felicidad y +15 de población máxima por nivel.' },
    anfiteatro: { n: 'Anfiteatro', i: '🏟️', solar: 1, cost: { madera: 130, piedra: 180, hierro: 60, grano: 80, oro: 100 }, time: 4, d: 'Juegos y espectáculos: +6 de felicidad por nivel.' },
    templo: { n: 'Templo', i: '🔥', solar: 1, cost: { madera: 80, piedra: 100, hierro: 30, grano: 60, oro: 50 }, time: 3, d: 'Un templo a un dios por ciudad (Marte, Ceres o Neptuno). Por nivel: +3 de felicidad, +10 % de experiencia del héroe, calma antes a una ciudad conquistada y el don de su dios.' }
  };
  /* Templos (F5): cada ciudad puede dedicar su templo a un dios. Los dones son por nivel de templo. Licencia de juego:
     los romanos no «elegían» un dios por ciudad, pero Marte, Ceres y Neptuno eran divinidades reales de Roma (Livio 2.41 para el templo de Ceres, 493 a.C.; Marte, Campo de Marte; Neptuno, Circo Flaminio). Dones inventados. */
  D.DIOSES = {
    marte: { n: 'Marte', i: '🔥', d: '+3 de moral de la guarnición al defender, por nivel.', mor: 3 },
    ceres: { n: 'Ceres', i: '🌾', d: '+8 % de grano de esa ciudad, por nivel.', grano: 0.08 },
    neptuno: { n: 'Neptuno', i: '🔱', d: 'Solo con mar: viajes por mar un 4 % más rápidos y +2 de oro por nivel de puerto.', sea: true, mar: 0.04, oroPuerto: 2 }
  };
  // ciudad conquistada: meses de inquietud (producción reducida; con felicidad baja se rebela). El templo la calma INQ_TEMPLO meses extra por nivel
  D.INQ_MESES = 8; D.INQ_TEMPLO = 0.35; D.INQ_REBELION = 40; D.INQ_PROD = 0.4;
  /* Saqueo (B7): atacar sin conquistar. Botín = SAQUEO_BASE x riqueza de la ciudad, +5 % por nivel de almacén y -8 % por nivel de muralla;
     una ciudad ya saqueada hace menos de SAQUEO_MESES da solo SAQUEO_REPETIDO. Licencia de juego en las cifras (la praeda era real: Polibio 10.17 y Livio 26.47 en Cartago Nova).
     Si te saquean a ti, cada almacén esconde ESCONDITE de cada recurso y de lo demás se llevan SAQUEO_ROBO. */
  D.SAQUEO_BASE = 90; D.SAQUEO_REPETIDO = 0.4; D.SAQUEO_MESES = 6; D.ESCONDITE = 120; D.SAQUEO_ROBO = 0.2; D.SAQUEO_IA = 0.5;
  /* Caja del mes (Q2): lo que se gasta en el mes es lo que se gana en el mes. Al cerrar el mes lo que sobra va al almacén hasta su tope (lo que no cabe se pierde)
     y de él solo se puede sacar un cuarto cada mes. */
  D.CUARTO_ALMACEN = 0.25; D.AVISO_CIERRE = 0.75;
  D.MAX_LVL = 10;
  // mejoras de la herrería: globales, nivel 0 a FORJA_MAX, +5 % por nivel. Coste y tiempo base (nivel 0), crecen x1.5 y x1.4 por nivel
  /* Impuestos: oro x mult, felicidad +/- f. Edificios que suben la felicidad: puntos por nivel (aquí se añaden termas, anfiteatro…). */
  D.IMPUESTOS = { bajo: { n: 'Impuestos bajos', mult: 0.7, f: 15 }, normal: { n: 'Impuestos normales', mult: 1, f: 0 }, alto: { n: 'Impuestos altos', mult: 1.4, f: -25 } };
  D.FELICIDAD_BASE = 55;   // + 5 del municipio (tipo por defecto) = 60, como antes de I4
  D.FELICIDAD_MIN_CRECER = 40;
  D.FELICIDAD_EDIF = { templo: 3, termas: 4, anfiteatro: 6 };
  D.POP_EDIF = { viviendas: 130, foro: 30, acueducto: 40, termas: 15 };   // población máxima por nivel de cada edificio
  /* Barrios (P67). Licencia de juego: la idea de que un barrio crece al cubrir servicios viene de Caesar III (estudio R1); los niveles,
     los servicios y todos los números son nuestros. Aldea no pide nada. D.LUJO: claves de D.ESPECIAL que cuentan como bien de lujo. */
  D.BARRIO = [
    null,
    { n: 'Aldea', pop: 1, imp: 1, pide: [] },
    { n: 'Villa', pop: 1.25, imp: 1, pide: ['grano', 'templo'] },
    { n: 'Ciudad', pop: 1.5, imp: 1, pide: ['grano', 'templo', 'agua', 'ocio'] },
    { n: 'Urbs', pop: 1.8, imp: 1.15, pide: ['grano', 'templo', 'agua', 'ocio', 'termas', 'lujo'] }
  ];
  D.BARRIO_RETRASO = 3;   // meses con déficit antes de bajar un nivel
  D.LUJO = ['vino', 'purpura', 'plata'];
  /* Clases (Q6). Licencia de juego: tres clases por ciudad (ciudadanos, plebeyos, esclavos) con su ánimo; todos los números son nuestros.
     c.pop es el total; plebeyos = pop - ciu - esc. */
  D.CLASES = {
    escConquista: 0.25,        // parte de la población de una ciudad conquistada que pasa a esclavos
    escTrabajo: 0.3,           // cada esclavo trabaja 1,3 veces
    impCiu: 2.5,               // impuestos por ciudadano (plebeyo 1, esclavo 0)
    escAnimo: 0.15, escAnimoTope: 15,   // ánimo que pierden los plebeyos por cada punto de % de esclavos (con tope)
    bajo: 30, inquietud: 25, inquietudFel: 8,   // por debajo de 'bajo' la clase rinde la mitad; esclavos por debajo de 'inquietud': -8 de felicidad
    manumision: 55, manumisionTasa: 0.05,       // con este ánimo de esclavos, esta parte se libera cada mes
    ciudadaniaLote: 10, ciudadaniaCoste: 60, ciudadaniaBarrio: 2, ciudadaniaMax: 0.4,
    caraBuena: 60, caraMedia: 35
  };
  D.BARRIO_SERV = { grano: 'Grano', templo: 'Templo', agua: 'Agua', ocio: 'Ocio', termas: 'Termas', lujo: 'Lujo' };
  // mano de obra y mantenimiento (I3): puestos = base + por nivel de aserradero/cantera/mina/granja; la producción de recursos se multiplica por pop/puestos (con suelo)
  D.PUESTOS_BASE = 20; D.PUESTOS_NIVEL = 12; D.MANO_MIN = 0.25;
  D.MANT_EDIF = 0.15; D.MANT_TROPA = 0.35;   // oro/mes por nivel de edificio no productivo y por punto de «up» de tropa (stipendium)
  /* Solares (I4): los edificios urbanos (solar: 1 en D.BUILD) ocupan uno cuando su nivel es 1 o más; campos y muralla, no.
     Cada ciudad tiene los suyos: D.CITIES[id].solares o 7 + riqueza/2 (nunca más de SOLARES_MAX: ninguna ciudad lo tiene todo). */
  D.SOLARES_BASE = 7; D.SOLARES_MAX = 11;
  /* Tipos de ciudad (licencia de juego): uno por ciudad propia. Los números son multiplicadores que lee game.js.
     rec = producción de madera, piedra, hierro y grano; fel = felicidad; instr = velocidad de instrucción; paga = coste de la paga de la guarnición;
     oroCom = oro de foro y puerto; mercado = mejora del cambio; viajeMar = tiempo de los viajes por mar; oroPuerto = oro por nivel de puerto;
     forjaCoste / forjaTiempo = mejoras de la herrería encargadas desde la ciudad. */
  D.TIPO_CAMBIO = 250;
  D.TIPOS = {
    municipio: { n: 'Municipio', i: '🏛️', d: 'Hace de todo: +5 de felicidad.', fel: 5 },
    agraria: { n: 'Colonia agraria', i: '🌾', d: '+25 % de madera, piedra, hierro y grano.', rec: 1.25 },
    militar: { n: 'Colonia militar', i: '⚔️', d: 'Instrucción un 25 % más rápida y la paga de su guarnición cuesta un 25 % menos.', instr: 0.8, paga: 0.75 },
    emporio: { n: 'Emporio', i: '⚖️', d: '+50 % del oro de foro, puerto y rutas. Con mercado, cambias recursos a mejor precio. Una ruta comercial más.', oroCom: 1.5, mercado: 0.05, rutas: 1 },
    naval: { n: 'Base naval', i: '⚓', d: 'Solo en ciudades con mar: viajes por mar un 25 % más rápidos y +3 de oro por nivel de puerto.', mar: true, viajeMar: 0.75, oroPuerto: 3 },
    saber: { n: 'Ciudad de artesanos', i: '🔨', d: 'Las mejoras de la herrería encargadas desde aquí cuestan y tardan un 25 % menos.', forjaCoste: 0.75, forjaTiempo: 0.75 }
  };
  /* Bien especial por ciudad (B1). Licencia de juego: el mecanismo «tener acceso abre niveles y tropas» es invención.
     No se almacena: Roma «tiene acceso» a un bien si posee alguna ciudad que lo da (D.CITIES[id].esp), vea G.especiales.
     abre.edificios: pasar del nivel D.ESP_NIVEL en esos edificios pide el bien; abre.tropas: esas tropas piden el bien.
     bono: se aplica una vez al tener acceso (no se acumula por tener dos ciudades). Lo lee game.js con G.bonoMul y G.bonoSum. */
  D.ESP_NIVEL = 6;
  /* Rutas comerciales (B2). Licencia de juego: el mecanismo es invención; el trasfondo (los tratados de Roma y Cartago
     regulaban dónde comerciar, Polibio 3.22-25; Hierón II aliado de Roma desde 263, Polibio 1.16) es histórico.
     Renta mensual = (RUTA_BASE + mercado de a + mercado de b si es propia, o RUTA_W por estrella de la ciudad ajena) × 1,5 por mar × oroCom del tipo.
     Máximo de rutas por ciudad: 1 + mercado/3 (+ D.TIPOS[..].rutas). */
  D.RUTA_COSTE = 100; D.RUTA_BASE = 4; D.RUTA_W = 1; D.RUTA_MAR = 1.5; D.RUTA_POR_MERCADO = 3;
  D.ESPECIAL = {
    sal: { n: 'Sal', i: '🧂', d: '+10 % de crecimiento de población.', abre: {}, bono: { crece: 1.1 } },
    vino: { n: 'Vino', i: '🍷', d: '+5 de felicidad en tus ciudades.', abre: {}, bono: { fel: 5 } },
    caballos: { n: 'Caballos', i: '🐎', d: 'Abre los Équites y el establo desde el nivel 7. Instrucción un 10 % más rápida.', abre: { edificios: ['establo'], tropas: ['equites'] }, bono: { instr: 0.9 } },
    hierro: { n: 'Hierro de calidad', i: '⚒️', d: 'Abre los Triarios, y cuartel y herrería desde el nivel 7. Mejoras de la herrería un 10 % más baratas.', abre: { edificios: ['cuartel', 'herreria'], tropas: ['triarii'] }, bono: { forjaCoste: 0.9 } },
    plata: { n: 'Plata', i: '⚪', d: '+10 % de oro de impuestos.', abre: {}, bono: { impuestos: 1.1 } },
    marmol: { n: 'Mármol', i: '🏛️', d: 'Abre foro, templo, termas y anfiteatro desde el nivel 7. Obras un 5 % más rápidas.', abre: { edificios: ['foro', 'templo', 'termas', 'anfiteatro'] }, bono: { obra: 0.95 } },
    purpura: { n: 'Púrpura', i: '🟣', d: '+10 % del oro de foro y puerto.', abre: {}, bono: { oroCom: 1.1 } },
    maderanaval: { n: 'Madera naval', i: '🌲', d: 'Abre el puerto desde el nivel 7. Viajes por mar un 10 % más rápidos.', abre: { edificios: ['puerto'] }, bono: { viajeMar: 0.9 } },
    pieles: { n: 'Pieles', i: '🦌', d: 'La paga de las guarniciones cuesta un 10 % menos.', abre: {}, bono: { paga: 0.9 } }
  };
  D.FORJA_MAX = 5; D.FORJA_BONO = 0.05;
  D.FORJA = {
    armas: { n: 'Armas', i: '🗡️', ef: 'ataque', cost: { hierro: 120, madera: 40, oro: 50 }, time: 3 },
    armaduras: { n: 'Armaduras', i: '🛡️', ef: 'defensa', cost: { hierro: 140, piedra: 40, oro: 50 }, time: 3 }
  };

  // cls: inf, spear (anti-caballería), rng (a distancia), cav, ele, gen
  D.UNITS = {
    // --- Roma ---
    hastati: { n: 'Hastati', g: '⚔', cls: 'inf', atk: 9, def: 9, spd: 32, mor: 60, up: 0.15, time: 0.05, cost: { madera: 15, hierro: 20, grano: 15, oro: 4 }, req: { cuartel: 1 }, d: 'Primera línea del manípulo. Jóvenes y baratos.' },
    velites: { n: 'Vélites', g: '➶', cls: 'rng', atk: 4, ratk: 7, def: 4, spd: 40, mor: 45, range: 170, up: 0.1, time: 0.04, cost: { madera: 15, hierro: 8, grano: 10, oro: 2 }, req: { cuartel: 1 }, d: 'Hostigadores con jabalinas. Débiles cuerpo a cuerpo.' },
    principes: { n: 'Príncipes', g: '⚔', cls: 'inf', atk: 12, def: 11, spd: 30, mor: 70, up: 0.2, time: 0.07, cost: { madera: 20, hierro: 35, grano: 20, oro: 8 }, req: { cuartel: 3 }, d: 'Veteranos de la segunda línea, bien acorazados.' },
    triarii: { n: 'Triarios', g: '↟', cls: 'spear', atk: 11, def: 15, spd: 28, mor: 85, up: 0.25, time: 0.09, cost: { madera: 30, hierro: 40, grano: 25, oro: 12 }, req: { cuartel: 5 }, d: 'Lanceros de élite. «Res ad triarios venit». Frenan a la caballería.' },
    equites: { n: 'Équites', g: '♞', cls: 'cav', atk: 14, def: 9, spd: 70, mor: 65, up: 0.4, time: 0.1, cost: { madera: 25, hierro: 30, grano: 45, oro: 15 }, req: { establo: 1 }, d: 'Caballería. Carga devastadora por flancos y retaguardia.' },
    vigiles: { n: 'Guardia urbana', lic: 'En la República no hubo un cuerpo con ese nombre; de noche vigilaban unos triunviros (Livio 9.46)', g: '⚔', cls: 'inf', atk: 6, def: 7, spd: 30, mor: 50, up: 0 },
    // --- otros pueblos ---
    milicia: { n: 'Milicia', lic: 'Leva genérica, no es una tropa concreta de las fuentes', g: '⚔', cls: 'inf', atk: 5, def: 5, spd: 30, mor: 40, up: 0.1 },
    hoplitas: { n: 'Hoplitas', g: '↟', cls: 'spear', atk: 8, def: 12, spd: 27, mor: 65, up: 0.2 },
    falange: { n: 'Falange', g: '↟', cls: 'spear', atk: 11, def: 14, spd: 22, mor: 75, up: 0.25 },
    peltastas: { n: 'Peltastas', g: '➶', cls: 'rng', atk: 4, ratk: 7, def: 4, spd: 40, mor: 45, range: 170, up: 0.1 },
    honderos: { n: 'Honderos baleares', g: '➶', cls: 'rng', atk: 3, ratk: 8, def: 3, spd: 40, mor: 45, range: 200, up: 0.1 },
    libios: { n: 'Infantería libia', g: '⚔', cls: 'inf', atk: 9, def: 9, spd: 30, mor: 60, up: 0.15 },
    iberos: { n: 'Guerreros íberos', g: '⚔', cls: 'inf', atk: 11, def: 8, spd: 33, mor: 60, up: 0.15 },
    galos: { n: 'Guerreros galos', g: '⚔', cls: 'inf', atk: 13, def: 6, spd: 34, mor: 45, up: 0.15 },
    sagrada: { n: 'Ciudadanos de Cartago', g: '⚔', cls: 'inf', atk: 13, def: 14, spd: 28, mor: 90, up: 0.3 },
    jinetes: { n: 'Jinetes', lic: 'Caballería genérica que sirve a varias facciones', g: '♞', cls: 'cav', atk: 12, def: 8, spd: 70, mor: 60, up: 0.4 },
    numidas: { n: 'Caballería númida', g: '♞', cls: 'cav', atk: 11, def: 7, spd: 82, mor: 60, up: 0.35 },
    tesalios: { n: 'Caballería tesalia', g: '♞', cls: 'cav', atk: 15, def: 10, spd: 72, mor: 75, up: 0.4 },
    elefantes: { n: 'Elefantes de guerra', g: '🐘', cls: 'ele', atk: 13, def: 9, spd: 42, mor: 50, hp: 8, mass: 4, up: 2 },
    general: { n: 'General', lic: 'Un mismo modelo y valores para todos los generales', g: '★', cls: 'gen', atk: 17, def: 16, spd: 68, mor: 100, hp: 3, up: 0 }
  };

  D.FACTIONS = {
    roma: { n: 'Roma', col: '#b3261e' },
    cartago: { n: 'Cartago', col: '#7b3fa8', raid: true, from: 264 },
    epiro: { n: 'Epiro', col: '#1f8a9e', raid: true, from: 279 },
    macedonia: { n: 'Macedonia', col: '#2a56b0', raid: true, from: 214 },
    aquea: { n: 'Liga Aquea', col: '#2f8f5a' },
    siracusa: { n: 'Siracusa', col: '#d08a1c' },
    galos: { n: 'Galos ínsubres', col: '#4f7a2a', raid: true, from: 270 },
    etruscos: { n: 'Etruscos', col: '#8a5a2b' },
    campanos: { n: 'Campanos', col: '#a8873f' },   // ya sin ciudades iniciales: solo para partidas guardadas antiguas
    mamertinos: { n: 'Mamertinos', col: '#c25e8a' },
    akragas: { n: 'Akragas', col: '#d4c43a' },
    iberos: { n: 'Íberos', col: '#a04a2a' },
    griegos: { n: 'Colonos griegos', col: '#3aa0a0' }
  };

  // w = riqueza (1-5), wl = muralla, g = guarnición inicial
  D.CITIES = {
    roma: { n: 'Roma', lon: 12.5, lat: 41.9, f: 'roma', esp: 'sal', tipo: 'municipio', solares: 10, w: 3, wl: 1, g: { hastati: 80, velites: 40 }, h: 'La ciudad de las siete colinas. En 280 a.C. domina el Lacio y mira hacia el sur de Italia.' },
    volsinii: { n: 'Volsinii', lon: 11.6, lat: 43.0, f: 'etruscos', esp: 'hierro', tipo: 'militar', w: 2, wl: 1, g: { hoplitas: 60, milicia: 50, peltastas: 20 }, h: 'Última gran ciudad etrusca independiente. Roma la tomó en 264 a.C.' },
    capua: { n: 'Capua', lon: 14.5, lat: 40.95, f: 'roma', esp: 'caballos', tipo: 'agraria', w: 3, wl: 1, g: { hoplitas: 30, milicia: 30 }, h: 'La ciudad más rica de Campania, aliada de Roma desde 338 a.C. (Livio 8.14). Se pasó a Aníbal tras Cannas (216 a.C.) y Roma la recuperó en 211 a.C.' },
    tarentum: { n: 'Tarentum', lon: 17.2, lat: 40.6, f: 'epiro', esp: 'caballos', tipo: 'naval', w: 3, wl: 2, g: { falange: 120, hoplitas: 80, peltastas: 50, tesalios: 40, elefantes: 6 }, gen: { n: 'Pirro de Epiro', mando: 4, disc: 3, until: 272 }, h: 'Colonia espartana que llamó en su ayuda al rey Pirro. Cayó ante Roma en 272 a.C.' },
    mediolanum: { n: 'Mediolanum', lon: 9.2, lat: 45.4, f: 'galos', esp: 'pieles', tipo: 'militar', w: 2, wl: 0, g: { galos: 260, jinetes: 40 }, h: 'Capital de los galos ínsubres. Tomada por Marcelo y Escipión Calvo en 222 a.C.' },
    messana: { n: 'Messana', lon: 15.55, lat: 38.3, f: 'mamertinos', esp: 'vino', tipo: 'naval', w: 2, wl: 1, g: { milicia: 60, hoplitas: 60, peltastas: 30 }, h: 'Ocupada por los mamertinos, mercenarios campanos de Agatocles (Polibio 1.7-8). Su petición de auxilio desató la Primera Guerra Púnica (264 a.C.).' },
    syracusae: { n: 'Syracusae', lon: 15.3, lat: 37.0, f: 'siracusa', esp: 'maderanaval', tipo: 'emporio', w: 4, wl: 4, g: { hoplitas: 180, peltastas: 80, jinetes: 40 }, h: 'La mayor ciudad griega de Occidente. Defendida por las máquinas de Arquímedes, cayó ante Marcelo en 212 a.C.' },
    agrigentum: { n: 'Agrigentum', lon: 13.55, lat: 37.25, f: 'akragas', esp: 'vino', tipo: 'agraria', w: 3, wl: 2, g: { hoplitas: 120, peltastas: 60, jinetes: 30 }, post: { cartago: { libios: 140, iberos: 60, honderos: 40, numidas: 30 } }, h: 'Ciudad griega e independiente en 280 a.C. Cartago la hizo su base en 262 a.C. y Roma la tomó ese mismo año (Polibio 1.17-19).' },
    panormus: { n: 'Panormus', lon: 13.35, lat: 38.2, f: 'cartago', esp: 'maderanaval', tipo: 'emporio', w: 3, wl: 2, g: { libios: 160, honderos: 50, numidas: 40, elefantes: 5 }, h: 'Puerto púnico. En 250 a.C. Metelo capturó aquí los elefantes de Asdrúbal.' },
    lilybaeum: { n: 'Lilybaeum', lon: 12.3, lat: 37.75, f: 'cartago', esp: 'sal', tipo: 'militar', w: 3, wl: 4, g: { libios: 200, iberos: 80, honderos: 50, numidas: 40 }, h: 'Fortaleza cartaginesa que resistió nueve años de asedio romano (250–241 a.C.).' },
    carales: { n: 'Carales', lon: 9.1, lat: 39.25, f: 'cartago', esp: 'sal', w: 2, wl: 1, g: { libios: 100, honderos: 40, milicia: 40 }, h: 'Puerto púnico de Cerdeña. Roma se anexionó la isla en 238 a.C.' },
    emporion: { n: 'Emporion', lon: 3.1, lat: 42.15, f: 'griegos', esp: 'vino', tipo: 'emporio', w: 2, wl: 1, g: { hoplitas: 70, peltastas: 30, milicia: 30 }, h: 'Colonia focense. Aquí desembarcó Cneo Escipión en 218 a.C. para iniciar la conquista de Hispania.' },
    saguntum: { n: 'Saguntum', lon: -0.3, lat: 39.7, f: 'iberos', esp: 'hierro', tipo: 'militar', w: 2, wl: 2, g: { iberos: 180, honderos: 40, jinetes: 20 }, h: 'Su asedio por Aníbal en 219 a.C. fue el casus belli de la Segunda Guerra Púnica.' },
    carthagonova: { n: 'Carthago Nova', lon: -1.0, lat: 37.6, f: 'iberos', esp: 'plata', w: 1, wl: 1, g: { iberos: 60, honderos: 20, jinetes: 8 }, en228: { w: 4, wl: 3, g: { libios: 220, iberos: 160, honderos: 60, numidas: 60, elefantes: 8 } }, h: 'En 280 a.C. era un poblado íbero junto a la bahía (probable; su tamaño es licencia de juego). Hacia 228 a.C. Asdrúbal fundó aquí Carthago Nova, capital bárcida de Hispania y sus minas de plata. Escipión la tomó por sorpresa en 209 a.C.' },
    ambracia: { n: 'Ambracia', lon: 20.9, lat: 39.2, f: 'epiro', esp: 'pieles', w: 2, wl: 2, g: { falange: 140, peltastas: 60, tesalios: 40 }, h: 'Capital del rey Pirro de Epiro. Saqueada por Roma en 189 a.C.' },
    pella: { n: 'Pella', lon: 22.5, lat: 40.8, f: 'macedonia', esp: 'marmol', tipo: 'militar', w: 4, wl: 3, g: { falange: 320, peltastas: 100, tesalios: 100 }, h: 'Capital de Macedonia, cuna de Alejandro. El reino cayó tras Pidna (168 a.C.).' },
    corinthus: { n: 'Corinthus', lon: 22.9, lat: 37.9, f: 'macedonia', esp: 'marmol', tipo: 'emporio', w: 4, wl: 3, g: { falange: 200, peltastas: 100, tesalios: 50 }, post: { aquea: { hoplitas: 300, peltastas: 100, jinetes: 50 } }, h: 'Con guarnición macedonia (probable ya en 280 a.C.). Arato la liberó hacia 243 a.C. y entró en la Liga Aquea (Polibio 2.43). Arrasada por Lucio Mumio en 146 a.C., el mismo año que Cartago.' },
    carthago: { n: 'Carthago', lon: 10.3, lat: 36.85, f: 'cartago', esp: 'purpura', tipo: 'emporio', w: 5, wl: 6, g: { sagrada: 300, libios: 400, iberos: 150, honderos: 120, numidas: 120, elefantes: 20 }, gen: { n: 'Asdrúbal el Beotarca', mando: 3, disc: 4, from: 149, until: 0 }, h: 'La gran rival de Roma. Escipión Emiliano la destruyó en 146 a.C.' }
  };

  // [a, b, marítima]
  D.EDGES = [
    ['roma', 'volsinii'], ['roma', 'capua'], ['roma', 'carales', 1], ['roma', 'emporion', 1],
    ['volsinii', 'mediolanum'], ['mediolanum', 'emporion'],
    ['capua', 'tarentum'], ['capua', 'messana'], ['tarentum', 'messana', 1], ['tarentum', 'ambracia', 1],
    ['messana', 'syracusae'], ['messana', 'panormus'], ['syracusae', 'agrigentum'], ['agrigentum', 'lilybaeum'], ['panormus', 'lilybaeum'],
    ['lilybaeum', 'carthago', 1], ['carales', 'carthago', 1], ['carales', 'emporion', 1],
    ['emporion', 'saguntum'], ['saguntum', 'carthagonova'], ['carthagonova', 'carthago', 1],
    ['ambracia', 'pella'], ['ambracia', 'corinthus'], ['pella', 'corinthus']
  ];

  for (const e of D.EDGES) if (e[2]) { D.CITIES[e[0]].sea = true; D.CITIES[e[1]].sea = true; }   // ciudades con salida al mar

  // Proyección lon/lat -> mundo
  D.WORLD = { w: 1600, h: 800 };
  D.proj = function (lon, lat) { return [(lon + 7) * 50, (47 - lat) * 64]; };

  // Costas aproximadas (lon, lat)
  D.LAND = [
    // Europa: Iberia, Galia, Italia, Balcanes, Grecia
    [[-7, 47], [-7, 37.2], [-6.3, 36.6], [-5.6, 36.0], [-4.4, 36.7], [-2.2, 36.7], [-1.6, 37.4], [-0.7, 37.6], [-0.1, 38.5], [0.2, 38.8], [-0.3, 39.5], [0.9, 41.0], [2.2, 41.4], [3.2, 41.9], [3.1, 42.5],
      [3.0, 43.2], [4.0, 43.5], [5.4, 43.2], [6.6, 43.1], [7.5, 43.7], [8.9, 44.4], [10.1, 44.0], [10.5, 42.9], [11.1, 42.4], [12.2, 41.75], [13.0, 41.25], [14.0, 40.8], [14.9, 40.2], [15.7, 40.0], [16.1, 39.0], [15.65, 38.0],
      [16.1, 37.9], [16.6, 38.4], [17.1, 39.0], [16.5, 39.7], [16.9, 40.4], [17.3, 40.45], [18.0, 39.95], [18.4, 39.8], [18.5, 40.2], [18.0, 40.7], [17.0, 41.1], [16.0, 41.5], [16.2, 41.9], [15.3, 41.9], [14.7, 42.2], [13.9, 43.0], [13.5, 43.6], [12.6, 44.0], [12.3, 44.8], [12.4, 45.4], [13.6, 45.7],
      [13.6, 45.0], [14.3, 45.3], [15.2, 44.2], [16.4, 43.5], [17.6, 42.9], [18.5, 42.4], [19.4, 41.8], [19.4, 40.9], [19.5, 40.3], [20.2, 39.6], [20.7, 39.0], [21.1, 38.4], [21.3, 37.8], [21.6, 36.9], [22.4, 36.5], [23.1, 36.5], [23.1, 37.4], [23.5, 37.9], [24.0, 37.7], [24.0, 38.3], [23.0, 39.4], [22.6, 40.4], [23.0, 40.4], [23.6, 40.0], [24.0, 40.5], [25, 40.9], [25, 47]],
    // África
    [[-7, 34.5], [-7, 35.5], [-5.9, 35.8], [-5.3, 35.9], [-3.0, 35.3], [-1.0, 35.2], [0, 35.9], [1.3, 36.5], [3.0, 36.8], [5.1, 36.8], [7.0, 37.0], [8.8, 37.0], [9.8, 37.3], [10.3, 37.0], [11.1, 37.0], [10.6, 36.4], [10.6, 35.6], [11.1, 35.2], [10.7, 34.5]],
    // Sicilia
    [[12.4, 37.8], [13.3, 38.2], [15.6, 38.3], [15.1, 37.4], [15.3, 37.0], [15.1, 36.7], [14.4, 36.8], [13.5, 37.3], [12.6, 37.6]],
    // Cerdeña
    [[8.2, 40.9], [9.2, 41.2], [9.8, 40.5], [9.6, 39.2], [9.1, 39.0], [8.4, 39.0], [8.4, 40.3]],
    // Córcega
    [[9.4, 43.0], [9.5, 42.0], [9.2, 41.4], [8.6, 41.9], [8.6, 42.6]],
    // Mallorca
    [[2.4, 39.6], [3.1, 39.9], [3.4, 39.6], [3.0, 39.3]]
  ];
  D.LABELS = [['HISPANIA', -3.5, 40.5], ['GALLIA', 3, 45.5], ['ITALIA', 13.2, 42.9], ['AFRICA', 5, 35.6], ['GRAECIA', 21.6, 38.9], ['MACEDONIA', 22, 41.6], ['ILLYRICVM', 17.5, 44.2], ['MARE NOSTRVM', 6, 38.6], ['SICILIA', 14.2, 37.7]];

  // Hechos históricos. fx: clave interpretada por game.js
  D.EVENTS = [
    { y: 280, t: 'Ab urbe condita CDLXXIV', x: 'Año 280 a.C. Roma domina el Lacio, pero el Mediterráneo pertenece a otros: Cartago reina en el mar, los griegos en el sur y los galos acechan en el norte. El rey Pirro de Epiro acaba de desembarcar en Tarento con 25.000 hombres y veinte elefantes.\n\nTu misión: llevar las águilas hasta Cartago y destruirla antes de que termine el año 146 a.C. Si Roma cae, todo estará perdido.' },
    { y: 277, t: 'Pirro marcha sobre Roma', x: 'En 280 a.C., tras vencer en Heraclea, Pirro avanzó hacia el norte hasta unos 300 estadios de Roma, unos 55 km según Plutarco (hasta Anagnia, según Apiano), y luego se retiró a Campania. Al año siguiente venció de nuevo en Ásculo, a gran coste: «otra victoria así y estaré perdido». Los romanos jamás habían visto elefantes: los llaman «bueyes lucanos».\n\nUn ejército epirota se dirige a tus tierras. ¡Prepara las defensas!', lic: 'La marcha fue en 280; en el juego el ataque llega en 277 para dar tiempo a prepararse', fx: 'pirro' },
    { y: 275, t: 'Benevento', x: 'El cónsul Manio Curio Dentato vence a Pirro en Benevento. El rey renuncia a Italia y vuelve al Epiro con 8.000 infantes y 500 jinetes, según Plutarco.\n\nLa guerra contra Pirro ha terminado.' },
    { y: 272, t: 'La caída de Tarento', x: 'Tarento, la ciudad que había llamado a Pirro, se rinde a Roma este año. Con ello toda la Italia peninsular queda bajo control romano.' , lic: 'Que el ejército de Pirro se retire de tu mapa es regla de juego, no historia', fx: 'pirroSeVa'},
    { y: 264, t: 'Primera Guerra Púnica', x: 'Los mamertinos de Messana, amenazados por Siracusa y Cartago, piden ayuda a Roma. El Senado cruza el estrecho: comienza una guerra de 23 años por Sicilia.\n\nDesde ahora las guarniciones cartaginesas atacarán tus ciudades vecinas.', lic: 'Año aproximado: Agrigentum pasa a Cartago hacia 262; los ataques púnicos son regla de juego', fx: 'agrigentoPunica' },
    { y: 260, t: 'La batalla de Milas', x: 'Roma, potencia terrestre, construye su primera gran flota copiando una nave púnica varada. Alguien —Polibio no dice quién— propuso el corvus, un puente de abordaje que convierte el combate naval en uno de infantería; el cónsul Duilio, al mando de la flota, vence en Milas.\n\nTus travesías marítimas son ahora un 30 % más rápidas.', lic: 'La mejora de travesías un 30 % más rápidas es regla de juego, no historia', fx: 'corvus' },
    { y: 243, t: 'Arato libera Corinto', x: 'Arato de Sición toma de noche la ciudadela de Corinto a la guarnición de Antígono Gónatas y expulsa a los macedonios. Corinto entra en la Liga Aquea, que se convierte en la mayor potencia de Grecia (Polibio 2.43; Plutarco, Arato 18-24).', lic: 'El cambio de manos de Corinto en tu mapa es regla de juego', fx: 'aratoCorinto' },
    { y: 241, t: 'Las islas Egadas', x: 'La flota de Lutacio Cátulo destruye a la cartaginesa frente a las Egadas. Cartago pide la paz, evacúa Sicilia y paga 3.200 talentos de plata.\n\nSi controlas ciudades en Sicilia recibirás una indemnización.', lic: 'La indemnización en recursos es regla de juego, no historia', fx: 'egadas' },
    { y: 228, t: 'Asdrúbal funda Carthago Nova', x: 'Asdrúbal, yerno de Amílcar Barca, funda en la costa del sureste de Iberia una ciudad que llama como la capital africana: Carthago Nova (Polibio 2.13; Diodoro 25.12). Las fuentes no dan el año; «hacia 228 a.C.» es la fecha de los historiadores modernos. Será la base cartaginesa de Hispania.\n\nSi la ciudad ya es tuya, Asdrúbal funda su base en otro punto de la costa (licencia de juego).', lic: 'El año 228 es aproximado; el poblado íbero previo y su tamaño son licencia de juego', fx: 'fundaCarthagoNova' },
    { y: 225, t: 'La invasión gala: Telamón', x: 'Una gran coalición de galos ínsubres, boyos y gesatas cruza los Apeninos con 70.000 guerreros. Roma, aterrada por el recuerdo del saqueo de 390 a.C., moviliza a toda Italia y los aplasta en Telamón.\n\nUna horda gala desciende hacia tus ciudades.', lic: 'Los galos atacan antes de 225 en el juego; el ataque a tus ciudades es regla de juego', fx: 'telamon' },
    { y: 218, t: 'Aníbal cruza los Alpes', x: 'Tras tomar Sagunto, Aníbal Barca hace lo impensable: cruza los Pirineos, el Ródano y los Alpes con su ejército y sus elefantes. Vence en el Tesino y en el Trebia.\n\nEl mayor general de su tiempo desciende sobre Italia. ¡Aníbal ad portas!', lic: 'El ataque de Aníbal a tus ciudades es regla de juego, no historia', fx: 'anibal1' },
    { y: 217, t: 'Trasimeno', x: 'Aníbal embosca junto al lago Trasimeno al cónsul Flaminio, que muere con su ejército. Caen 15.000 romanos, según Polibio y según Livio; Aníbal pierde 1.500 hombres según Polibio, 2.500 según Livio.' },
    { y: 216, t: 'El desastre de Cannas', x: 'En Cannas, Aníbal envuelve y aniquila a ocho legiones: unos 70.000 muertos según Polibio, 48.200 según Livio, en una tarde; la peor derrota de la República. Capua y otras ciudades se pasan al enemigo, pero Roma se niega a negociar.\n\nUn segundo ejército de Aníbal marcha contra ti.', lic: 'El segundo ejército de Aníbal contra ti es regla de juego, no historia', fx: 'anibal2' },
    { y: 214, t: 'Filipo V de Macedonia', x: 'Filipo V, aliado de Aníbal, abre un nuevo frente en Iliria: comienza la Primera Guerra Macedónica.\n\nMacedonia atacará a partir de ahora las ciudades romanas vecinas.', lic: 'Que Macedonia ataque tus ciudades vecinas es regla de juego, no historia' },
    { y: 212, t: 'Arquímedes y Siracusa', x: 'Marcelo toma Siracusa tras un asedio de más de dos años, frustrado por las máquinas de Arquímedes: garras que volcaban naves y catapultas de precisión. El sabio muere a manos de un soldado; Livio solo dice que murió absorto en sus figuras, y la tradición posterior le atribuye la frase «No molestes a mis círculos».' },
    { y: 209, t: 'Escipión toma Carthago Nova', x: 'El joven Publio Cornelio Escipión, de 26 años, cruza la laguna con la marea baja y toma en un solo día la capital púnica de Hispania.\n\nSu ejemplo inspira a tu general: +1 punto de habilidad.', lic: 'El punto de habilidad para tu general es regla de juego, no historia', fx: 'escipion' },
    { y: 207, t: 'El Metauro', x: 'Los cónsules Claudio Nerón y Livio Salinátor vencen a Asdrúbal Barca, hermano de Aníbal, que muere en la batalla y no logra reunirse con él. Los cartagineses muertos son unos 10.000 según Polibio y 56.000 según Livio.' },
    { y: 206, t: 'Ilipa', x: 'Escipión vence en Ilipa a Asdrúbal, hijo de Giscón, y a Magón. Los cartagineses tenían 70.000 infantes según Polibio, unos 50.000 según Livio.\n\nCartago pierde Hispania.' },
    { y: 202, t: 'Zama', x: 'Escipión lleva la guerra a África. En Zama abre pasillos entre sus manípulos para los elefantes y, con la caballería númida de Masinisa, derrota por fin a Aníbal.\n\nEl rey Masinisa te envía jinetes númidas a Roma.', lic: 'Los jinetes númidas como regalo son regla de juego, no historia', fx: 'masinisa' },
    { y: 197, t: 'Cinoscéfalas', x: 'En las colinas de Cinoscéfalas, Flaminino demuestra que el flexible manípulo romano supera a la rígida falange macedonia en terreno quebrado.\n\nTus tropas aprenden la lección: +10 % de ataque permanente.', lic: 'El +10 % de ataque permanente es regla de juego, no historia', fx: 'flex' },
    { y: 190, t: 'Magnesia', x: 'El cónsul Lucio Cornelio Escipión y el rey Eumenes de Pérgamo vencen a Antíoco III de Siria; su hermano el Africano, enfermo, no estuvo presente. Antíoco pierde unos 50.000 hombres según Livio y según Apiano; los romanos, poco más de 300 según Livio.' },
    { y: 168, t: 'Pidna', x: 'Emilio Paulo destruye en Pidna al ejército de Perseo, último rey de Macedonia. El reino de Alejandro Magno deja de existir.' },
    { y: 149, t: 'Carthago delenda est', x: 'Según Plutarco, Catón el Viejo añadía a su voto sobre cualquier asunto: «Opino que Cartago debe ser destruida». La tradición posterior lo resumió como «Carthago delenda est». Roma declara la Tercera Guerra Púnica.\n\nQuedan tres años. Históricamente Escipión Emiliano arrasó Cartago en 146 a.C. ¿Lo lograrás tú?', lic: 'El plazo de tres años para destruir Cartago es regla de juego, no historia' },
    { y: 146, t: 'Corinto y Cartago', x: 'El cónsul Lucio Mumio vence a la Liga Aquea en el Istmo, y Corinto es saqueada y quemada. Ese mismo año Escipión Emiliano toma Cartago tras seis días de lucha hasta la Birsa; 50.000 personas se rinden, según Apiano.\n\nLa ciudad había durado 700 años, según Apiano.' },
  ];

  root.DATA = D;
  if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
