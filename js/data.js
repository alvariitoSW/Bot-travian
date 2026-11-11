/* AQVILA — datos del juego: edificios, unidades, facciones, ciudades y hechos históricos */
(function (root) {
  const D = {};
  D.START_YEAR = 280; // a.C.
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
    viviendas: { n: 'Ínsulas', i: '🏘️', cost: { madera: 60, piedra: 50, hierro: 10, grano: 30 }, time: 1.8, d: 'Viviendas: aumentan la población máxima. La población paga impuestos y de ella salen los reclutas.' },
    foro: { n: 'Foro', i: '🏛️', prod: 'oro', cost: { madera: 80, piedra: 90, hierro: 40, grano: 40 }, time: 2.5, d: 'Recauda denarios, acelera las obras un 4 % por nivel y permite más población.' },
    almacen: { n: 'Almacén', i: '🏺', cost: { madera: 70, piedra: 60, hierro: 30, grano: 20 }, time: 2, d: 'Aumenta la capacidad de almacenamiento.' },
    mercado: { n: 'Mercado', i: '⚖️', cost: { madera: 80, piedra: 70, hierro: 30, grano: 30, oro: 40 }, time: 2.5, d: 'Permite cambiar unos recursos por otros. Cada nivel mejora el cambio.' },
    puerto: { n: 'Puerto', i: '⚓', cost: { madera: 140, piedra: 80, hierro: 50, grano: 30, oro: 60 }, time: 3, sea: true, d: 'Necesario para embarcar ejércitos por rutas marítimas. Da ingresos por comercio y acorta las travesías.' },
    cuartel: { n: 'Cuartel', i: '⚔️', cost: { madera: 90, piedra: 60, hierro: 70, grano: 40 }, time: 2.5, d: 'Recluta infantería. Nv 3: Príncipes. Nv 5: Triarios.' },
    establo: { n: 'Establo', i: '🐎', cost: { madera: 110, piedra: 60, hierro: 80, grano: 70 }, time: 3, d: 'Recluta caballería (Équites).' },
    muralla: { n: 'Muralla', i: '🧱', cost: { madera: 40, piedra: 120, hierro: 30, grano: 20 }, time: 3, d: '+10 % de defensa por nivel y más vigiles al defender.' },
    herreria: { n: 'Herrería', i: '🔨', cost: { madera: 70, piedra: 60, hierro: 90, grano: 30, oro: 30 }, time: 2.5, d: 'Forja mejoras de armas y armaduras para todo el ejército. Cada mejora no puede pasar del nivel de la herrería.' },
    templo: { n: 'Templo de Marte', i: '🔥', cost: { madera: 80, piedra: 100, hierro: 30, grano: 60, oro: 50 }, time: 3, d: '+10 % de experiencia del héroe y +3 de moral al defender, por nivel.' }
  };
  D.MAX_LVL = 10;
  // mejoras de la herrería: globales, nivel 0 a FORJA_MAX, +5 % por nivel. Coste y tiempo base (nivel 0), crecen x1.5 y x1.4 por nivel
  /* Impuestos: oro x mult, felicidad +/- f. Edificios que suben la felicidad: puntos por nivel (aquí se añaden termas, anfiteatro…). */
  D.IMPUESTOS = { bajo: { n: 'Impuestos bajos', mult: 0.7, f: 15 }, normal: { n: 'Impuestos normales', mult: 1, f: 0 }, alto: { n: 'Impuestos altos', mult: 1.4, f: -25 } };
  D.FELICIDAD_BASE = 60; D.FELICIDAD_MIN_CRECER = 40;
  D.FELICIDAD_EDIF = { templo: 3 };
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
    vigiles: { n: 'Vigiles', g: '⚔', cls: 'inf', atk: 6, def: 7, spd: 30, mor: 50, up: 0 },
    // --- otros pueblos ---
    milicia: { n: 'Milicia', g: '⚔', cls: 'inf', atk: 5, def: 5, spd: 30, mor: 40, up: 0.1 },
    hoplitas: { n: 'Hoplitas', g: '↟', cls: 'spear', atk: 8, def: 12, spd: 27, mor: 65, up: 0.2 },
    falange: { n: 'Falange', g: '↟', cls: 'spear', atk: 11, def: 14, spd: 22, mor: 75, up: 0.25 },
    peltastas: { n: 'Peltastas', g: '➶', cls: 'rng', atk: 4, ratk: 7, def: 4, spd: 40, mor: 45, range: 170, up: 0.1 },
    honderos: { n: 'Honderos baleares', g: '➶', cls: 'rng', atk: 3, ratk: 8, def: 3, spd: 40, mor: 45, range: 200, up: 0.1 },
    libios: { n: 'Infantería libia', g: '⚔', cls: 'inf', atk: 9, def: 9, spd: 30, mor: 60, up: 0.15 },
    iberos: { n: 'Guerreros íberos', g: '⚔', cls: 'inf', atk: 11, def: 8, spd: 33, mor: 60, up: 0.15 },
    galos: { n: 'Guerreros galos', g: '⚔', cls: 'inf', atk: 13, def: 6, spd: 34, mor: 45, up: 0.15 },
    sagrada: { n: 'Batallón Sagrado', g: '⚔', cls: 'inf', atk: 13, def: 14, spd: 28, mor: 90, up: 0.3 },
    jinetes: { n: 'Jinetes', g: '♞', cls: 'cav', atk: 12, def: 8, spd: 70, mor: 60, up: 0.4 },
    numidas: { n: 'Caballería númida', g: '♞', cls: 'cav', atk: 11, def: 7, spd: 82, mor: 60, up: 0.35 },
    tesalios: { n: 'Caballería tesalia', g: '♞', cls: 'cav', atk: 15, def: 10, spd: 72, mor: 75, up: 0.4 },
    elefantes: { n: 'Elefantes de guerra', g: '🐘', cls: 'ele', atk: 13, def: 9, spd: 42, mor: 50, hp: 8, mass: 4, up: 2 },
    general: { n: 'General', g: '★', cls: 'gen', atk: 17, def: 16, spd: 68, mor: 100, hp: 3, up: 0 }
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
    campanos: { n: 'Campanos', col: '#a8873f' },
    iberos: { n: 'Íberos', col: '#a04a2a' },
    griegos: { n: 'Colonos griegos', col: '#3aa0a0' }
  };

  // w = riqueza (1-5), wl = muralla, g = guarnición inicial
  D.CITIES = {
    roma: { n: 'Roma', lon: 12.5, lat: 41.9, f: 'roma', w: 3, wl: 1, g: { hastati: 80, velites: 40 }, h: 'La ciudad de las siete colinas. En 280 a.C. domina el Lacio y mira hacia el sur de Italia.' },
    volsinii: { n: 'Volsinii', lon: 11.6, lat: 43.0, f: 'etruscos', w: 2, wl: 1, g: { hoplitas: 60, milicia: 50, peltastas: 20 }, h: 'Última gran ciudad etrusca independiente. Roma la tomó en 264 a.C.' },
    capua: { n: 'Capua', lon: 14.5, lat: 40.95, f: 'campanos', w: 3, wl: 1, g: { hoplitas: 50, milicia: 60, jinetes: 20 }, h: 'La ciudad más rica de Campania. Se pasó a Aníbal tras Cannas y Roma la reconquistó en 211 a.C.' },
    tarentum: { n: 'Tarentum', lon: 17.2, lat: 40.6, f: 'epiro', w: 3, wl: 2, g: { falange: 120, hoplitas: 80, peltastas: 50, tesalios: 40, elefantes: 6 }, gen: { n: 'Pirro de Epiro', mando: 4, disc: 3, until: 272 }, h: 'Colonia espartana que llamó en su ayuda al rey Pirro. Cayó ante Roma en 272 a.C.' },
    mediolanum: { n: 'Mediolanum', lon: 9.2, lat: 45.4, f: 'galos', w: 2, wl: 0, g: { galos: 260, jinetes: 40 }, h: 'Capital de los galos ínsubres. Tomada por Marcelo y Escipión Calvo en 222 a.C.' },
    messana: { n: 'Messana', lon: 15.55, lat: 38.3, f: 'campanos', w: 2, wl: 1, g: { milicia: 60, hoplitas: 60, peltastas: 30 }, h: 'Ocupada por los mamertinos, mercenarios campanos. Su petición de auxilio desató la Primera Guerra Púnica (264 a.C.).' },
    syracusae: { n: 'Syracusae', lon: 15.3, lat: 37.0, f: 'siracusa', w: 4, wl: 4, g: { hoplitas: 180, peltastas: 80, jinetes: 40 }, h: 'La mayor ciudad griega de Occidente. Defendida por las máquinas de Arquímedes, cayó ante Marcelo en 212 a.C.' },
    agrigentum: { n: 'Agrigentum', lon: 13.55, lat: 37.25, f: 'cartago', w: 3, wl: 2, g: { libios: 140, iberos: 60, honderos: 40, numidas: 30 }, h: 'Base cartaginesa en Sicilia. Roma la sitió y tomó en 262 a.C.' },
    panormus: { n: 'Panormus', lon: 13.35, lat: 38.2, f: 'cartago', w: 3, wl: 2, g: { libios: 160, honderos: 50, numidas: 40, elefantes: 5 }, h: 'Puerto púnico. En 250 a.C. Metelo capturó aquí los elefantes de Asdrúbal.' },
    lilybaeum: { n: 'Lilybaeum', lon: 12.3, lat: 37.75, f: 'cartago', w: 3, wl: 4, g: { libios: 200, iberos: 80, honderos: 50, numidas: 40 }, h: 'Fortaleza cartaginesa que resistió nueve años de asedio romano (250–241 a.C.).' },
    carales: { n: 'Carales', lon: 9.1, lat: 39.25, f: 'cartago', w: 2, wl: 1, g: { libios: 100, honderos: 40, milicia: 40 }, h: 'Puerto púnico de Cerdeña. Roma se anexionó la isla en 238 a.C.' },
    emporion: { n: 'Emporion', lon: 3.1, lat: 42.15, f: 'griegos', w: 2, wl: 1, g: { hoplitas: 70, peltastas: 30, milicia: 30 }, h: 'Colonia focense. Aquí desembarcó Cneo Escipión en 218 a.C. para iniciar la conquista de Hispania.' },
    saguntum: { n: 'Saguntum', lon: -0.3, lat: 39.7, f: 'iberos', w: 2, wl: 2, g: { iberos: 180, honderos: 40, jinetes: 20 }, h: 'Su asedio por Aníbal en 219 a.C. fue el casus belli de la Segunda Guerra Púnica.' },
    carthagonova: { n: 'Carthago Nova', lon: -1.0, lat: 37.6, f: 'cartago', w: 4, wl: 3, g: { libios: 220, iberos: 160, honderos: 60, numidas: 60, elefantes: 8 }, h: 'Capital bárcida de Hispania y sus minas de plata. Escipión la tomó por sorpresa en 209 a.C.' },
    ambracia: { n: 'Ambracia', lon: 20.9, lat: 39.2, f: 'epiro', w: 2, wl: 2, g: { falange: 140, peltastas: 60, tesalios: 40 }, h: 'Capital del rey Pirro de Epiro. Saqueada por Roma en 189 a.C.' },
    pella: { n: 'Pella', lon: 22.5, lat: 40.8, f: 'macedonia', w: 4, wl: 3, g: { falange: 320, peltastas: 100, tesalios: 100 }, h: 'Capital de Macedonia, cuna de Alejandro. El reino cayó tras Pidna (168 a.C.).' },
    corinthus: { n: 'Corinthus', lon: 22.9, lat: 37.9, f: 'aquea', w: 4, wl: 3, g: { hoplitas: 300, peltastas: 100, jinetes: 50 }, h: 'Cabeza de la Liga Aquea. Arrasada por Lucio Mumio en 146 a.C., el mismo año que Cartago.' },
    carthago: { n: 'Carthago', lon: 10.3, lat: 36.85, f: 'cartago', w: 5, wl: 6, g: { sagrada: 300, libios: 400, iberos: 150, honderos: 120, numidas: 120, elefantes: 20 }, gen: { n: 'Asdrúbal el Beotarca', mando: 3, disc: 4, until: 0 }, h: 'La gran rival. «Carthago delenda est». Escipión Emiliano la destruyó en 146 a.C.' }
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
    { y: 277, t: 'Pirro marcha sobre Roma', x: 'Tras sus costosas victorias en Heraclea (280) y Ásculo (279) —«otra victoria como esta y estaré perdido»—, Pirro avanza hacia el norte. Los romanos jamás habían visto elefantes: los llaman «bueyes lucanos».\n\nUn ejército epirota se dirige a tus tierras. ¡Prepara las defensas!', fx: 'pirro' },
    { y: 272, t: 'La caída de Tarento', x: 'Históricamente, Pirro abandonó Italia tras la batalla de Benevento (275 a.C.) y Tarento se rindió a Roma este año. Con ello toda la Italia peninsular quedó bajo control romano.' , fx: 'pirroSeVa'},
    { y: 264, t: 'Primera Guerra Púnica', x: 'Los mamertinos de Messana, amenazados por Siracusa y Cartago, piden ayuda a Roma. El Senado cruza el estrecho: comienza una guerra de 23 años por Sicilia.\n\nDesde ahora las guarniciones cartaginesas atacarán tus ciudades vecinas.' },
    { y: 260, t: 'La batalla de Milas', x: 'Roma, potencia terrestre, construye su primera gran flota copiando una nave púnica varada. El cónsul Duilio inventa el corvus, un puente de abordaje que convierte el combate naval en uno de infantería, y vence en Milas.\n\nTus travesías marítimas son ahora un 30 % más rápidas.', fx: 'corvus' },
    { y: 241, t: 'Las islas Egadas', x: 'La flota de Lutacio Cátulo destruye a la cartaginesa frente a las Egadas. Cartago pide la paz, evacúa Sicilia y paga 3.200 talentos de plata.\n\nSi controlas ciudades en Sicilia recibirás una indemnización.', fx: 'egadas' },
    { y: 225, t: 'La invasión gala: Telamón', x: 'Una gran coalición de galos ínsubres, boyos y gesatas cruza los Apeninos con 70.000 guerreros. Roma, aterrada por el recuerdo del saqueo de 390 a.C., moviliza a toda Italia y los aplasta en Telamón.\n\nUna horda gala desciende hacia tus ciudades.', fx: 'telamon' },
    { y: 218, t: 'Aníbal cruza los Alpes', x: 'Tras tomar Sagunto, Aníbal Barca hace lo impensable: cruza los Pirineos, el Ródano y los Alpes con su ejército y sus elefantes. Vence en el Tesino y en el Trebia.\n\nEl mayor general de su tiempo desciende sobre Italia. ¡Aníbal ad portas!', fx: 'anibal1' },
    { y: 216, t: 'El desastre de Cannas', x: 'En Cannas, Aníbal envuelve y aniquila a ocho legiones: 50.000 romanos muertos en una tarde, la peor derrota de la República. Capua y otras ciudades se pasan al enemigo, pero Roma se niega a negociar.\n\nUn segundo ejército de Aníbal marcha contra ti.', fx: 'anibal2' },
    { y: 214, t: 'Filipo V de Macedonia', x: 'Filipo V, aliado de Aníbal, abre un nuevo frente en Iliria: comienza la Primera Guerra Macedónica.\n\nMacedonia atacará a partir de ahora las ciudades romanas vecinas.' },
    { y: 212, t: 'Arquímedes y Siracusa', x: 'Marcelo toma Siracusa tras dos años de asedio frustrado por las máquinas de Arquímedes: garras que volcaban naves y catapultas de precisión. El sabio muere a manos de un soldado: «No molestes a mis círculos».' },
    { y: 209, t: 'Escipión toma Carthago Nova', x: 'El joven Publio Cornelio Escipión, de 26 años, cruza la laguna con la marea baja y toma en un solo día la capital púnica de Hispania.\n\nSu ejemplo inspira a tu general: +1 punto de habilidad.', fx: 'escipion' },
    { y: 202, t: 'Zama', x: 'Escipión lleva la guerra a África. En Zama abre pasillos entre sus manípulos para los elefantes y, con la caballería númida de Masinisa, derrota por fin a Aníbal.\n\nEl rey Masinisa te envía jinetes númidas a Roma.', fx: 'masinisa' },
    { y: 197, t: 'Cinoscéfalas', x: 'En las colinas de Cinoscéfalas, Flaminino demuestra que el flexible manípulo romano supera a la rígida falange macedonia en terreno quebrado.\n\nTus tropas aprenden la lección: +10 % de ataque permanente.', fx: 'flex' },
    { y: 168, t: 'Pidna', x: 'Emilio Paulo destruye en Pidna al ejército de Perseo, último rey de Macedonia. El reino de Alejandro Magno deja de existir.' },
    { y: 149, t: 'Carthago delenda est', x: 'Catón el Viejo termina todos sus discursos con la misma frase: «Además, opino que Cartago debe ser destruida». Roma declara la Tercera Guerra Púnica.\n\nQuedan tres años. Históricamente Escipión Emiliano arrasó Cartago en 146 a.C. ¿Lo lograrás tú?' }
  ];

  root.DATA = D;
  if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
