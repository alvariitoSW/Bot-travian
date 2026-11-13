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
    escuela: { n: 'Escuela', i: '📜', solar: 1, cost: { madera: 70, piedra: 90, hierro: 10, grano: 40, oro: 60 }, time: 3, d: 'Aquí estudian los sabios: aceleran las investigaciones y cobran paga.' },
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
  // Licencia de juego (cifra mía, no histórica): en 216 Capua se pasa a Aníbal si no tiene al menos esta cantidad de hombres propios
  D.CAPUA_LEALTAD = { hombres: 150 };
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
  D.FORO_CASAS = 25;   // CN2b: el foro de una ciudad con ciudad nueva sube 1 nivel por cada 25 casas (más 1 por barrio extra)
  D.HUECOS_OBRA = [0, 1, 2, 2, 3, 3, 3, 4, 4, 4, 4];   // Q4b: obras a la vez por ciudad según el nivel del foro (índice = nivel 1..10); el foro no tiene mejoras, su nivel es c.b.foro (casas y barrios)
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
    escRenta: 0,               // oro/mes por esclavo (0 hasta que Villa esclavista lo cambie)
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
    agraria: { n: 'Colonia agraria', i: '🌾', d: '+25 % de madera, piedra, hierro y grano.', rec: 1.25, afin: 'ca' },
    militar: { n: 'Colonia militar', i: '⚔️', d: 'Instrucción un 25 % más rápida y la paga de su guarnición cuesta un 25 % menos.', instr: 0.8, paga: 0.75, afin: 'gu' },
    emporio: { n: 'Emporio', i: '⚖️', d: '+50 % del oro de foro, puerto y rutas. Con mercado, cambias recursos a mejor precio. Una ruta comercial más.', oroCom: 1.5, mercado: 0.05, rutas: 1, afin: 'of' },
    naval: { n: 'Base naval', i: '⚓', d: 'Solo en ciudades con mar: viajes por mar un 25 % más rápidos y +3 de oro por nivel de puerto.', mar: true, viajeMar: 0.75, oroPuerto: 3, afin: 'ma' },
    saber: { n: 'Ciudad de artesanos', i: '🔨', d: 'Las mejoras de la herrería y las investigaciones encargadas desde aquí cuestan y tardan un 25 % menos.', forjaCoste: 0.75, forjaTiempo: 0.75, invCoste: 0.75, invTiempo: 0.75 }
  };
  /* Investigación (I5). Licencia de juego: el árbol de «saberes» (4 ramas, 3 edades) es invención; las fuentes de cada saber son las de gobierno/estudios/P93-ciencia.md §3.
     Los PRECIOS Y MESES SON FIJOS (nada depende de la producción); solo los recorta D.SABER.tope × G.cap(). Aquí solo hay datos: las reglas las lee game.js (G.inv*).
     rama: ca campo, of oficios, gu guerra, ma mar. req: gramática de G.invReq. ef: datos que leen G.invMul/G.invSum y los ganchos de economía. eureka: ciudad que acelera ×4/3. */
  D.SABER = {
    tiempoMul: 1, tope: 0.8,
    techos: { grano: 1.08, crece: 1.20, impuestos: 1.12, oroCom: 1.25, rutaRenta: 1.20, viajeTierra: 3, viajeMar: 6, obra: 0.85, paga: 0.85, instr: 0.90, mor: 3, atk: 1.05, defMuro: 0.15 },
    final: { grano: 1.30, crece: 1.25, impuestos: 1.20, oroCom: 1.40, rutaRenta: 1.40, viajeMin: 3, obra: 0.75, paga: 0.70, instr: 0.78 },
    edadNombres: ['Roma itálica', 'Roma sale al mar', 'Aníbal', 'Roma y los reinos griegos'],
    copia: 0.5, copiaBatalla: 0.15, copiaBajasMin: 60,
    /* Sabios de la Escuela (I5b). Todo número de las reglas está aquí. dotFrac: fracción del aforo; aforo = aforoNivel × nivel de la Escuela;
       calNivel: calidad por nivel; rinde/pagaBase por clase (ple plebeyo, ciu ciudadano, esc maestro esclavo); pagaEdad por edad; paga = base × edad × (1 + S/pagaDiv). */
    dotFrac: [0, 1 / 3, 2 / 3, 1], aforoNivel: 10, calNivel: { 1: 1, 3: 1, 6: 1.1, 10: 1.2 }, rinde: { ple: 1, ciu: 1.6, esc: 1.3 }, pagaBase: { ple: 0.20, ciu: 0.45, esc: 0.10 },
    pagaEdad: [1, 1.25, 1.5, 1.75], pagaDiv: 50, alta: 6, topePob: 0.15, animoMin: 30, velK: 2.4, velR0: 60, velMax: 3, afinMul: 1.25, artesanosMul: 1.12
  };
  const invC = (madera, piedra, hierro, grano, oro) => ({ madera, piedra, hierro, grano, oro });
  const inv = (id, n, i, rama, edad, req, excl, cost, time, ef, eureka, fuente, dictamen) => { const o = { id, n, i, rama, edad, req, excl, cost, time, ef, fuente, dictamen }; if (eureka) o.eureka = eureka; return o; };
  const IV = [
    inv('griego', 'Preceptores griegos', '📜', 'of', 1, [{ b: ['foro', 1] }], [], invC(40, 50, 10, 60, 50), 12, { abre: 'escuela' }, 0, 'Suetonio, De grammaticis 1; Cicerón, Bruto 72: Livio Andronico, griego de Tarento, enseña hacia 272 a.C. La Escuela como edificio es licencia de juego.', 'probable'),
    inv('apio', 'Obras de Apio Claudio', '🛣️', 'of', 1, [{ b: ['foro', 1] }], [], invC(90, 140, 20, 40, 60), 20, { viajeTierra: { resta: 3, sobre: 3 }, popCap: 1.05 }, 0, 'Livio 9.29; Frontino, De aquaeductu 4-6: Vía Apia y Aqua Appia (312 a.C.). Cifras: licencia de juego.', 'probable'),
    inv('castra', 'Campamento y disciplina', '⛺', 'gu', 1, [{ b: ['cuartel', 1] }], [], invC(60, 60, 110, 60, 50), 16, { mor: 3, paga: 0.95 }, 0, 'Polibio 6.27-39: campamento, castigos y premios.', 'probable'),
    inv('quinque', 'Quinquerreme copiada', '⚓', 'ma', 2, [{ edad: 2 }, { b: ['puerto', 1] }], [], invC(280, 40, 90, 80, 110), 24, { viajeMar: { resta: 3, sobre: 3 } }, 'tarentum', 'Polibio 1.20: Roma copia una nave cartaginesa varada (260 a.C.); Tarento y otros aliados prestan naves (1.20.14). Cifra: licencia de juego.', 'historico'),
    inv('corvus', 'Corvus', '🪝', 'ma', 2, [{ edad: 2 }, { inv: ['quinque'] }], ['remeros'], invC(220, 30, 200, 60, 130), 28, { atkMar: 1.05 }, 0, 'Polibio 1.22: pasarela de abordaje (cotejado en H1). Cifra: licencia de juego.', 'historico'),
    inv('remeros', 'Remeros adiestrados en seco', '🚣', 'ma', 2, [{ edad: 2 }, { inv: ['quinque'] }], ['corvus'], invC(180, 40, 40, 120, 120), 28, { viajeMar: { resta: 3, sobre: 6 } }, 0, 'Polibio 1.21: remeros adiestrados en bancos sobre la arena. Cifra: licencia de juego.', 'historico'),
    inv('fasti', 'Fasti y ley escrita', '⚖️', 'of', 2, [{ edad: 2 }, { b: ['escuela', 1] }], [], invC(50, 90, 10, 80, 130), 24, { inqMeses: 0.6, inqProd: 0.6 }, 0, 'Livio 9.46: Cneo Flavio publica el derecho y el calendario (304 a.C.).', 'probable'),
    inv('vina', 'Viña y olivar', '🍇', 'ca', 2, [{ edad: 2 }, { b: ['granja', 3] }], ['trigo'], invC(140, 120, 20, 60, 130), 28, { oroCom: 1.25, impuestos: 1.08 }, 'agrigentum', 'Catón, De agri cultura 1.7: la viña, primera en rendimiento. Cifras: licencia de juego.', 'probable'),
    inv('trigo', 'Trigo y diezmo de Sicilia', '🌾', 'ca', 2, [{ edad: 2 }, { b: ['granja', 3] }], ['vina'], invC(120, 60, 20, 140, 110), 28, { grano: 1.05, crece: 1.06 }, 0, 'Cicerón, Verrinas 3: lex Hieronica, el diezmo de Hierón que Roma conserva.', 'probable'),
    inv('pilum', 'Pilum y manípulo', '🗡️', 'gu', 2, [{ edad: 2 }, { b: ['cuartel', 3] }], [], invC(80, 40, 200, 60, 140), 26, { atk: 1.03 }, 0, 'Polibio 6.23.9-11 (dentro del tramo 6.21-23 ya cotejado). Cifra: licencia de juego.', 'historico'),
    inv('latif', 'Villa esclavista', '⛓️', 'ca', 3, [{ edad: 3 }, { b: ['granja', 6] }], ['colon'], invC(240, 100, 160, 200, 270), 44, { cl: { escConquista: 0.60, escRenta: 0.20, escAnimo: 0.25, escAnimoTope: 20, manumisionTasa: 0, inquietud: 35 } }, 0, 'Catón, De agri cultura 2.7 y 56-59; la crisis del pequeño campesino es tesis moderna (Toynbee). Cifras: licencia de juego.', 'probable'),
    inv('colon', 'Colonos y asignaciones', '🏡', 'ca', 3, [{ edad: 3 }, { barrio: 2 }], ['latif'], invC(220, 160, 80, 240, 250), 44, { cl: { ciudadaniaCoste: 30, ciudadaniaMax: 0.55, impCiu: 2.9, escConquista: 0.10 }, instr: 0.94 }, 0, 'Polibio 2.21: ley de Flaminio, ager Gallicus (232 a.C.).', 'probable'),
    inv('sambuca', 'Sambuca y arietes', '🪜', 'gu', 3, [{ edad: 3 }, { b: ['puerto', 1] }, { b: ['cuartel', 3] }], ['arquimedes'], invC(360, 60, 260, 100, 290), 44, { brecha: 1 }, 0, 'Polibio 8.4-6 (dentro del tramo 8.5-8 cotejado): Marcelo y las sambucas sobre barcos en Siracusa.', 'historico'),
    inv('arquimedes', 'Máquinas de Arquímedes', '🔭', 'gu', 3, [{ edad: 3 }, { b: ['muralla', 3] }, { o: [{ tiene: ['syracusae'] }, { ciudades: 6 }] }], ['sambuca'], invC(160, 300, 300, 80, 320), 48, { defMuro: 0.025 }, 'syracusae', 'Polibio 8.5-8; Plutarco, Marcelo 15-17 (cotejados). Cifra: licencia de juego.', 'historico'),
    inv('astilleros', 'Astilleros de ribera', '🏗️', 'ma', 3, [{ edad: 3 }, { b: ['puerto', 3] }], ['derrota'], invC(480, 140, 140, 100, 190), 40, { sinBien: 'puerto' }, ['panormus', 'lilybaeum'], 'Polibio 1.20-21: la flota se levanta desde cero. Que sustituya al bien especial: licencia de juego.', 'historico'),
    inv('derrota', 'Derrota mercante', '🧭', 'ma', 3, [{ edad: 3 }, { b: ['mercado', 3] }, { b: ['puerto', 1] }], ['astilleros'], invC(480, 140, 140, 100, 190), 40, { rutas: 1, rutaRenta: 1.15 }, 0, 'Polibio 3.22-25: tratados de comercio Roma-Cartago (ya citado en D.RUTA). Cifras: licencia de juego.', 'historico'),
    inv('medicina', 'Cirujanos griegos', '⚕️', 'of', 3, [{ edad: 3 }, { b: ['escuela', 1] }, { o: [{ y: 219 }, { ciudades: 5 }] }], [], invC(100, 60, 80, 260, 290), 38, { crece: 1.10, herida: -12, fel: -2, favor: { senado: -3, pueblo: 3 } }, 0, 'Plinio, NH 29.12-14: Arcágato, primer médico griego, 219 a.C.; apodado «verdugo»; Catón desconfiaba. Cifras: licencia de juego.', 'probable'),
    inv('magon', 'Tratado de Magón', '📚', 'ca', 4, [{ edad: 4 }, { o: [{ fac: 'cartago' }, { ciudades: 7 }] }], [], invC(360, 140, 70, 360, 430), 68, { grano: 1.03, crece: 1.04, hambre: 0.5 }, 'carthago', 'Plinio, NH 18.22-23 (y Varrón, RR 1.1.10): el Senado manda traducir los 28 libros de Magón tras 146 a.C.', 'probable'),
    inv('perseo', 'Biblioteca del rey Perseo', '🏛️', 'of', 4, [{ edad: 4 }, { b: ['escuela', 3] }, { o: [{ tiene: ['pella'] }, { ciudades: 7 }] }], [], invC(120, 160, 20, 300, 440), 58, { pts: 2, fel: 2 }, 'pella', 'Plutarco, Emilio Paulo 28; Polibio 31.23-25: los libros de Perseo pasan a los hijos de Paulo, entre ellos Escipión Emiliano (168 a.C.).', 'probable'),
    inv('acoger', 'Acoger a los filósofos', '🤝', 'of', 4, [{ edad: 4 }, { b: ['escuela', 3] }], ['expulsar'], invC(40, 40, 10, 160, 360), 38, { impuestos: 1.08, crece: 1.04, pts: 1, fel: -2, favor: { senado: -4, pueblo: 3 } }, 0, 'Plutarco, Catón 22; Gelio 6.14: embajada de Carnéades (155 a.C.).', 'probable'),
    inv('expulsar', 'Expulsar a los filósofos', '🚪', 'of', 4, [{ edad: 4 }, { b: ['escuela', 1] }], ['acoger'], invC(60, 60, 60, 160, 250), 28, { fel: 4, crece: 0.96, favor: { senado: 4, pueblo: -2 } }, 0, 'Suetonio, De rhetoribus 1; Gelio 15.11: expulsión de 161 a.C.', 'probable'),
    inv('hormigon', 'Opus caementicium', '🧱', 'of', 4, [{ edad: 4 }, { b: ['escuela', 1] }], [], invC(200, 380, 60, 100, 300), 48, { obra: 0.88 }, 0, 'Livio 35.10: Pórtico Emilio (193 a.C.), primeros usos del hormigón. Cifra: licencia de juego.', 'probable')
  ];
  D.INVEST = {}; IV.forEach(x => { D.INVEST[x.id] = x; });
  const edad = (id, n, e, req, cost, time, fuente) => ({ id, n, edad: e, req, cost, time, fuente, dictamen: 'licencia de juego' });
  D.EDADES = {
    E2: edad('E2', 'Roma sale al mar', 2, [{ saberes: 2 }, { b: ['foro', 2] }, { ciudades: 2 }], invC(150, 150, 60, 100, 100), 24, 'Polibio 1.5-6 (periodización de 264 a 219 a.C.). La división en edades es licencia de juego.'),
    E3: edad('E3', 'Aníbal', 3, [{ edad: 2 }, { saberes: 5 }, { ramas: 3 }, { ciudades: 3 }, { b: ['mercado', 3] }, { barrio: 2 }], invC(300, 300, 150, 200, 240), 38, 'Hechos de D.EVENTS (218-201 a.C.). La división en edades es licencia de juego.'),
    E4: edad('E4', 'Roma y los reinos griegos', 4, [{ edad: 3 }, { saberes: 9 }, { ramas: 4 }, { ciudades: 5 }, { b: ['templo', 3] }, { barrio: 2 }], invC(500, 500, 300, 350, 480), 58, 'Polibio 1.1-3 (200-146 a.C.). La división en edades es licencia de juego.')
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
    capua: { n: 'Capua', lon: 14.5, lat: 40.95, f: 'roma', esp: 'caballos', tipo: 'agraria', w: 3, wl: 1, g: { hoplitas: 30, milicia: 30 }, post: { cartago: { hoplitas: 60, milicia: 60, jinetes: 30, libios: 60 } }, h: 'La ciudad más rica de Campania, aliada de Roma desde 338 a.C. (Livio 8.14). Se pasó a Aníbal tras Cannas (216 a.C.) y Roma la recuperó en 211 a.C.' },
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
    carthagonova: { n: 'Carthago Nova', antes: { n: 'Poblado íbero', hasta: 228 }, lon: -1.0, lat: 37.6, f: 'iberos', esp: 'plata', w: 1, wl: 1, g: { iberos: 60, honderos: 20, jinetes: 8 }, en228: { w: 4, wl: 3, g: { libios: 220, iberos: 160, honderos: 60, numidas: 60, elefantes: 8 } }, h: 'En 280 a.C. era un poblado íbero junto a la bahía (probable; su tamaño es licencia de juego). Hacia 228 a.C. Asdrúbal fundó aquí Carthago Nova, capital bárcida de Hispania y sus minas de plata. Escipión la tomó por sorpresa en 209 a.C.' },
    ambracia: { n: 'Ambracia', lon: 20.9, lat: 39.2, f: 'epiro', esp: 'pieles', w: 2, wl: 2, g: { falange: 140, peltastas: 60, tesalios: 40 }, h: 'Capital del rey Pirro de Epiro. Saqueada por Roma en 189 a.C.' },
    pella: { n: 'Pella', lon: 22.5, lat: 40.8, f: 'macedonia', esp: 'marmol', tipo: 'militar', w: 4, wl: 3, g: { falange: 320, peltastas: 100, tesalios: 100 }, h: 'Capital de Macedonia, cuna de Alejandro. El reino cayó tras Pidna (168 a.C.).' },
    corinthus: { n: 'Corinthus', lon: 22.9, lat: 37.9, f: 'macedonia', esp: 'marmol', tipo: 'emporio', w: 4, wl: 3, g: { falange: 200, peltastas: 100, tesalios: 50 }, post: { aquea: { hoplitas: 300, peltastas: 100, jinetes: 50 } }, h: 'Con guarnición macedonia (probable ya en 280 a.C.). Arato la liberó hacia 243 a.C. y entró en la Liga Aquea (Polibio 2.43). Arrasada por Lucio Mumio en 146 a.C., el mismo año que Cartago.' },
    carthago: { n: 'Carthago', lon: 10.3, lat: 36.85, f: 'cartago', esp: 'purpura', tipo: 'emporio', w: 5, wl: 6, g: { sagrada: 300, libios: 400, iberos: 150, honderos: 120, numidas: 120, elefantes: 20 }, gen: { n: 'Asdrúbal el Beotarca', mando: 3, disc: 4, from: 149, until: 0 }, h: 'La gran rival de Roma. Escipión Emiliano la destruyó en 146 a.C.' }
  };

  /* Nombre según la fecha. `n` es el NOMBRE ACTUAL de la ciudad: en las ciudades con `antes` es un getter que mira D.anio
     (año a.C. en curso; game.js lo fija en newGame, cargar y tick). En 280 a.C. Carthago Nova se llama «Poblado íbero»:
     nombre genérico y licencia de juego (las fuentes no dan ninguno). Pasado el año `hasta` (al llegar a él ya cuenta) se ve el nombre final. */
  D.anio = D.START_YEAR;
  const NOMBRE_FINAL = {};
  D.nombreCiudad = (id, anio) => { const c = D.CITIES[id]; return c.antes && anio > c.antes.hasta ? c.antes.n : (NOMBRE_FINAL[id] !== undefined ? NOMBRE_FINAL[id] : c.n); };
  Object.keys(D.CITIES).forEach(id => { const c = D.CITIES[id]; if (!c.antes) return; NOMBRE_FINAL[id] = c.n; Object.defineProperty(c, 'n', { enumerable: true, configurable: true, get() { return D.nombreCiudad(id, D.anio); } }); });

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

  // Hechos históricos. fx: clave interpretada por game.js (o varias separadas por comas, en ese orden). k: clave opcional para distinguir dos hechos del mismo año (id de ficha «<año>-<k>»)
  // H13b, licencia de juego: Roma empieza con más tropas para la llegada temprana de Pirro (no es un dato histórico)
  D.LEVA_CURTIDO_MESES = 6;   // N15b: una leva sigue siendo bisoña este tiempo tras salir del cuartel
  D.LEVA_INICIAL = { hastati: 30, velites: 20 };
  D.EVENTS = [
    { y: 280, k: 'fundacion', t: 'Ab urbe condita CDLXXIV', x: 'Año 280 a.C. Roma domina el Lacio, pero el Mediterráneo pertenece a otros: Cartago reina en el mar, los griegos en el sur y los galos acechan en el norte. El rey Pirro de Epiro acaba de desembarcar en Tarento con 25.000 hombres y veinte elefantes.\n\nTu misión: llevar las águilas hasta Cartago y destruirla antes de que termine el año 146 a.C. Si Roma cae, todo estará perdido.' },
    { y: 280, k: 'pirro', t: 'Pirro marcha sobre Roma', x: 'En 280 a.C., tras vencer en Heraclea, Pirro avanzó hacia el norte hasta unos 300 estadios de Roma, unos 55 km según Plutarco (hasta Anagnia, según Apiano), y luego se retiró a Campania. Al año siguiente venció de nuevo en Ásculo, a gran coste: «otra victoria así y estaré perdido». Los romanos jamás habían visto elefantes: los llaman «bueyes lucanos».\n\nUn ejército epirota se dirige a tus tierras, y tras él vienen refuerzos. ¡Prepara las defensas!', lic: 'Que el ejército de Pirro ataque tus ciudades, sus dos oleadas, sus tamaños, los plazos de llegada y las levas extra con que empiezas son regla de juego, no historia', fx: 'pirro' },
    { y: 275, t: 'Benevento', x: 'El cónsul Manio Curio Dentato vence a Pirro en Benevento. El rey renuncia a Italia y vuelve al Epiro con 8.000 infantes y 500 jinetes, según Plutarco.\n\nLa guerra contra Pirro ha terminado.' },
    { y: 272, t: 'La caída de Tarento', x: 'Tarento, la ciudad que había llamado a Pirro, se rinde a Roma este año. Con ello toda la Italia peninsular queda bajo control romano.' , lic: 'Que el ejército de Pirro se retire de tu mapa es regla de juego, no historia', fx: 'pirroSeVa'},
    { y: 264, t: 'Primera Guerra Púnica', x: 'Los mamertinos de Messana, amenazados por Siracusa y Cartago, piden ayuda a Roma. El Senado cruza el estrecho: comienza una guerra de 23 años por Sicilia.\n\nDesde ahora las guarniciones cartaginesas atacarán tus ciudades vecinas.', lic: 'Año aproximado: Agrigentum pasa a Cartago hacia 262; los ataques púnicos son regla de juego', fx: 'agrigentoPunica' },
    { y: 260, t: 'La batalla de Milas', x: 'Roma, potencia terrestre, construye su primera gran flota copiando una nave púnica varada. Alguien —Polibio no dice quién— propuso el corvus, un puente de abordaje que convierte el combate naval en uno de infantería; el cónsul Duilio, al mando de la flota, vence en Milas.\n\nTus travesías marítimas son ahora un 30 % más rápidas.', lic: 'La mejora de travesías un 30 % más rápidas es regla de juego, no historia', fx: 'corvus' },
    { y: 243, t: 'Arato libera Corinto', x: 'Arato de Sición toma de noche la ciudadela de Corinto a la guarnición de Antígono Gónatas y expulsa a los macedonios. Corinto entra en la Liga Aquea, que se convierte en la mayor potencia de Grecia (Polibio 2.43; Plutarco, Arato 18-24).', lic: 'El cambio de manos de Corinto en tu mapa es regla de juego', fx: 'aratoCorinto' },
    { y: 241, t: 'Las islas Egadas', x: 'La flota de Lutacio Cátulo destruye a la cartaginesa frente a las Egadas. Cartago pide la paz, evacúa Sicilia y paga 3.200 talentos de plata.\n\nSi controlas ciudades en Sicilia recibirás una indemnización.', lic: 'La indemnización en recursos es regla de juego, no historia', fx: 'egadas' },
    { y: 228, t: 'Asdrúbal funda Carthago Nova', x: 'Asdrúbal, yerno de Amílcar Barca, funda en la costa del sureste de Iberia una ciudad que llama como la capital africana: Carthago Nova (Polibio 2.13; Diodoro 25.12). Las fuentes no dan el año; «hacia 228 a.C.» es la fecha de los historiadores modernos. Será la base cartaginesa de Hispania.\n\nSi la ciudad ya es tuya, Asdrúbal funda su base en otro punto de la costa (licencia de juego).', lic: 'El año 228 es aproximado; el poblado íbero previo y su tamaño son licencia de juego', fx: 'fundaCarthagoNova' },
    { y: 225, t: 'La invasión gala: Telamón', x: 'Una gran coalición de galos ínsubres, boyos y gesatas cruza los Apeninos con 70.000 guerreros. Roma, aterrada por el recuerdo del saqueo de 390 a.C., moviliza a toda Italia y los aplasta en Telamón.\n\nUna horda gala desciende hacia tus ciudades.', lic: 'Los galos atacan antes de 225 en el juego; el ataque a tus ciudades es regla de juego', fx: 'telamon' },
    { y: 218, t: 'Aníbal cruza los Alpes', x: 'Tras tomar Sagunto, Aníbal Barca hace lo impensable: cruza los Pirineos, el Ródano y los Alpes con su ejército y sus elefantes. Vence en el Tesino y en el Trebia.\n\nEl mayor general de su tiempo desciende sobre Italia. ¡Aníbal ad portas!', lic: 'El ataque de Aníbal a tus ciudades es regla de juego, no historia', fx: 'anibal1' },
    { y: 217, t: 'Trasimeno', x: 'Aníbal embosca junto al lago Trasimeno al cónsul Flaminio, que muere con su ejército. Caen 15.000 romanos, según Polibio y según Livio; Aníbal pierde 1.500 hombres según Polibio, 2.500 según Livio.\n\nCapua vacila: guarnécela con al menos 150 hombres antes de que acabe el año; si no, se pasará a Aníbal.', lic: 'El plazo y el umbral de 150 hombres para que Capua resista son regla de juego, no historia' },
    { y: 216, t: 'El desastre de Cannas', x: 'En Cannas, Aníbal envuelve y aniquila a ocho legiones: unos 70.000 muertos según Polibio, 48.200 según Livio, en una tarde; la peor derrota de la República. Otras ciudades se pasan al enemigo, pero Roma se niega a negociar.\n\nCapua se pasa al enemigo si no la guarneciste.\n\nUn segundo ejército de Aníbal marcha contra ti.', lic: 'La caída de Capua en 216 es histórica (Livio 23.2-7); el umbral de 150 hombres y la guarnición cartaginesa son regla de juego, igual que el segundo ejército de Aníbal contra ti', fx: 'capuaSePasa,anibal2' },
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

  /* Regiones (I6). Una región es una ficha de datos: nombra ciudades de D.CITIES por id (no las duplica) y los hechos de D.EVENTS
     por año (`hechos`: lista de años; null = todos). ciudades null = todas. Roma está siempre en toda región. La partida se monta
     solo con esas ciudades y las rutas de D.EDGES con ambos extremos dentro. `final.gana` / `final.agota` son los textos de fin
     de partida ({anio} = año de la caída). `hasta`: al pasar ese año a.C. sin ganar, se pierde. `camara`: encuadre inicial del mapa (zoom: 1 = distancia base de cámara, mayor = más lejos).
     Licencia de juego en Italia: Tarentum sigue de Epiro en 280 (cayó en 272), Volsinii cae en 264 (aquí sigue etrusca), Mediolanum
     es gala (Roma la tomó en 222) y Messana/Syracusae entran como vecinas del sur; la fecha de corte es de jugabilidad. */
  D.REGIONES = {
    mediterraneo: {
      n: 'Mediterráneo', ciudades: null, hechos: null, capitalRival: 'carthago', hasta: D.END_YEAR,
      final: { gana: 'Cartago ha caído en {anio} a.C. Sus muros son arrasados y Roma es dueña del Mediterráneo: Mare Nostrum.', agota: 'El año 146 a.C. ha terminado y Cartago sigue en pie. La historia recordará a otro.' },
      camara: { lon: 12.5, lat: 41.9, zoom: 1 }
    },
    italia: {
      n: 'Italia', ciudades: ['roma', 'capua', 'volsinii', 'mediolanum', 'tarentum', 'messana', 'syracusae'],
      hechos: [280, 275, 272, 264, 225], capitalRival: 'tarentum', hasta: 230,
      final: { gana: 'Tarento ha caído en {anio} a.C. Toda la Italia peninsular reconoce a Roma: el Sur ya no tiene rey.', agota: 'Ha pasado el año 230 a.C. y Tarento sigue libre. Roma no domina la península.' },
      camara: { lon: 13.4, lat: 40.2, zoom: 3.2 }
    }
  };
  D.regionCiudades = id => { const r = D.REGIONES[id]; return r && r.ciudades ? r.ciudades.filter(c => D.CITIES[c]) : Object.keys(D.CITIES); };
  D.regionEdges = id => { const l = D.regionCiudades(id); return D.EDGES.filter(e => l.indexOf(e[0]) >= 0 && l.indexOf(e[1]) >= 0); };

  /* Zonas del mapa (C6, escalones). Agrupan las ciudades de D.CITIES por id para los nombres grandes de Mare Nostrum.
     Cada ciudad está en una sola zona. Los límites son agrupación de juego, no fronteras de la época. */
  D.ZONAS = {
    italia: { n: 'Italia', ciudades: ['roma', 'volsinii', 'capua', 'tarentum', 'mediolanum'] },
    sicilia: { n: 'Sicilia', ciudades: ['messana', 'syracusae', 'agrigentum', 'panormus', 'lilybaeum'] },
    sardinia: { n: 'Sardinia', ciudades: ['carales'] },
    hispania: { n: 'Hispania', ciudades: ['emporion', 'saguntum', 'carthagonova'] },
    graecia: { n: 'Graecia', ciudades: ['ambracia', 'pella', 'corinthus'] },
    africa: { n: 'Africa', ciudades: ['carthago'] }
  };
  D.zonaDe = id => Object.keys(D.ZONAS).find(z => D.ZONAS[z].ciudades.indexOf(id) >= 0) || null;

  /* Senado (Q7). Dos barras de favor, de 0 a 100: la del Senado se mueve con las misiones y con cerrar el mes en rojo;
     la del pueblo tiende al ánimo medio de tus ciudades (inercia por mes). Con el Senado por debajo de «bajo» se niegan
     tratados con ciudades ajenas y la quinta leva en cola. Licencia de juego: las barras y todas las cifras (los hechos
     que inspiran las misiones están en sus fichas). Las condiciones son datos sobre piezas y niveles reales de D.BUILD
     (no sobre viviendas ni foro, que son derivados). tipo de cond: lo define G.MISION_TIPOS en game.js. */
  D.DEUDA = { desBase: 0.02, desMes: 0.03, desMax: 0.12 };   // I3b: deserción mensual con paga atrasada = base + desMes por mes de paga debido, con tope
  D.SENADO = {
    favorIni: 50, min: 0, max: 100, bajo: 25,
    inercia: 0.12,         // el pueblo se acerca esa fracción al ánimo medio cada mes
    oroRojo: -2,           // favor del Senado por cada mes que cierra con obras o levas detenidas por falta de oro
    premio: 12, castigo: -10,   // favor del Senado por defecto al cumplir o fallar una misión
    pausa: 3,              // meses entre una misión y la siguiente
    ventana: 20,           // años que una misión sigue disponible desde su fecha
    levaMax: 4             // con poco favor no se admite una leva más si ya hay tantas en cola
  };
  // desde: año (a.C.) en que el Senado puede encargarla; plazo en meses; las cifras son licencia de juego
  /* Sitios de colonias (CN5-A). Aún no son ciudades: el jugador manda colonos y funda. Mismo sistema lon/lat que D.CITIES.
     anio = a.C. positivo; tipo: 'latina' | 'ciudadanos' | 'maritima'; colonos = cifra histórica (cotejo en registro.js y en gobierno/historia/fundacion-de-colonias.md).
     Posiciones aproximadas: las de Beneventum, Cremona y Aesernia se desplazan unas décimas de grado para no pisar Capua, Placentia ni el camino (licencia de juego). */
  D.COLONIAS = {
    cosa: { id: 'cosa', n: 'Cosa', lon: 11.3, lat: 42.4, anio: 273, tipo: 'latina', colonos: 4000, h: 'Colonia latina sobre una loma junto a la costa etrusca: recinto de piedra, foro abajo y templos arriba.' },
    ariminum: { id: 'ariminum', n: 'Ariminum', lon: 12.6, lat: 44.05, anio: 268, tipo: 'latina', colonos: 6000, h: 'Colonia latina en el Adriático, puerta de la llanura del Po.' },
    beneventum: { id: 'beneventum', n: 'Beneventum', lon: 14.95, lat: 41.2, anio: 268, tipo: 'latina', colonos: 2500, h: 'Colonia latina en el Samnio, donde Pirro fue vencido en 275. Vigila los pasos del interior.' },
    brundisium: { id: 'brundisium', n: 'Brundisium', lon: 17.9, lat: 40.65, anio: 244, tipo: 'latina', colonos: 6000, h: 'Colonia latina en el talón de Italia, el mejor puerto hacia Grecia.' },
    placentia: { id: 'placentia', n: 'Placentia', lon: 9.7, lat: 45.0, anio: 218, tipo: 'latina', colonos: 6000, h: 'Colonia latina junto al Po, frente a los galos, fundada al empezar la guerra con Aníbal.' },
    cremona: { id: 'cremona', n: 'Cremona', lon: 10.25, lat: 45.1, anio: 218, tipo: 'latina', colonos: 6000, h: 'Colonia latina en la orilla norte del Po, gemela de Placentia.' },
    bononia: { id: 'bononia', n: 'Bononia', lon: 11.35, lat: 44.5, anio: 189, tipo: 'latina', colonos: 3000, h: 'Colonia latina en la vía hacia Mutina, sobre una antigua ciudad de los galos boyos.' },
    aesernia: { id: 'aesernia', n: 'Aesernia', lon: 14.2, lat: 41.6, anio: 263, tipo: 'latina', colonos: 2500, h: 'Colonia latina en las montañas del Samnio, pensada para sujetar a los samnitas.' }
  };

  D.MISIONES = {};   // por id (el registro casa por id); el orden de las claves es el orden del Senado
  [
    { id: 'levas-heraclea', n: 'Nuevas levas tras Heraclea', desde: 280, plazo: 12, cond: { tipo: 'tropas', n: 300 },
      texto: 'Pirro ha vencido en Heraclea. El Senado manda alistar nuevas legiones: reúne 300 hombres en armas.',
      premio: { oro: 80, favorSenado: 12, favorPueblo: -3 }, castigo: { favorSenado: -10, favorPueblo: 3 },
      fuente: 'Plutarco, Pirro 17; Eutropio 2.11', dictamen: 'historico' },
    { id: 'presidio-regio', n: 'Presidio de la costa', desde: 279, plazo: 18, cond: { tipo: 'tropas_en', ciudad: 'capua', n: 100 },
      texto: 'Una guarnición romana ha de sostener la Campania. Mantén 100 hombres en Capua.',
      premio: { oro: 60, favorSenado: 10 }, castigo: { favorSenado: -10 },
      fuente: 'Polibio 1.7; Livio, Períocas 12', dictamen: 'probable' },
    { id: 'colonias-latinas', n: 'Colonias latinas', desde: 273, plazo: 30, cond: { tipo: 'ciudades', n: 3 },
      texto: 'Roma asienta colonos en tierras conquistadas (Paestum, Cosa, Ariminum). Ten 3 ciudades propias.',
      premio: { oro: 120, favorSenado: 15, favorPueblo: 8 }, castigo: { favorSenado: -8, favorPueblo: -5 },
      fuente: 'Livio, Períocas 14 y 15; Veleyo Patérculo 1.14', dictamen: 'historico' },
    { id: 'fundar-colonia', n: 'Una colonia para Roma', desde: 268, plazo: 30, cond: { tipo: 'colonia', n: 1 },
      texto: 'El Senado manda asentar colonos en tierras conquistadas. Envía colonos y funda una colonia.',
      premio: { oro: 100, favorSenado: 12, favorPueblo: 8 }, castigo: { favorSenado: -8, favorPueblo: -5 },
      fuente: 'Veleyo Patérculo 1.14; Livio, Períocas 15 y 19', dictamen: 'historico' },
    { id: 'flota-260', n: 'Una flota para Roma', desde: 262, plazo: 14, cond: { tipo: 'edificio', b: 'puerto', n: 3 },
      texto: 'Roma no tiene flota contra Cartago. Levanta un puerto de nivel 3 (la flota de Mylae se botó en 260).',
      premio: { oro: 150, favorSenado: 15, favorPueblo: 5 }, castigo: { favorSenado: -12, favorPueblo: -4 },
      fuente: 'Polibio 1.20 y 1.23', dictamen: 'historico' },
    { id: 'grano-sicilia', n: 'Grano de Sicilia', desde: 241, plazo: 24, cond: { tipo: 'rutas', n: 2 },
      texto: 'Sicilia alimenta a Roma con su diezmo de grano. Abre 2 rutas comerciales.',
      premio: { oro: 100, favorSenado: 10, favorPueblo: 8 }, castigo: { favorSenado: -6, favorPueblo: -6 },
      fuente: 'Cicerón, Verrinas 3.12 (ley de Hierón); Polibio 1.16', dictamen: 'historico' },
    { id: 'templo-ver-sacrum', n: 'Voto de templos', desde: 217, plazo: 14, cond: { tipo: 'edificio', b: 'templo', n: 2, ciudad: 'roma' },
      texto: 'Tras el desastre del Trasimeno el Senado vota templos y ofrendas. Templo de nivel 2 en Roma.',
      premio: { favorSenado: 10, favorPueblo: 12 }, castigo: { favorSenado: -8, favorPueblo: -8 },
      fuente: 'Livio 22.9 y 22.10', dictamen: 'historico' },
    { id: 'almacen-grano', n: 'Graneros para la guerra', desde: 217, plazo: 16, cond: { tipo: 'edificio', b: 'almacen', n: 4, ciudad: 'roma' },
      texto: 'Hierón de Siracusa envía trigo y cebada. Almacén de nivel 4 en Roma para guardarlos.',
      premio: { oro: 90, favorSenado: 10 }, castigo: { favorSenado: -8 },
      fuente: 'Livio 22.37', dictamen: 'historico' },
    { id: 'muralla-roma', n: 'Defensas de Roma', desde: 216, plazo: 12, cond: { tipo: 'edificio', b: 'muralla', n: 4, ciudad: 'roma' },
      texto: 'Aníbal está en Italia. Muralla de nivel 4 en Roma.',
      premio: { favorSenado: 12, favorPueblo: 6 }, castigo: { favorSenado: -12, favorPueblo: -6 },
      fuente: 'Livio 22.8 y 22.55', dictamen: 'probable' },
    { id: 'armas-canas', n: 'Armas tras Cannas', desde: 216, plazo: 14, cond: { tipo: 'edificio', b: 'herreria', n: 3 },
      texto: 'Tras Cannas faltan armas. Levanta una herrería de nivel 3 en cualquiera de tus ciudades.',
      premio: { oro: 100, favorSenado: 12 }, castigo: { favorSenado: -10 },
      fuente: 'Livio 22.57 y 23.14', dictamen: 'probable' },
    { id: 'tributo-zama', n: 'Tributo de Cartago', desde: 202, plazo: 18, cond: { tipo: 'oro', n: 600 },
      texto: 'Cartago pagará una indemnización tras Zama. Ten 600 de oro en las arcas.',
      premio: { oro: 150, favorSenado: 12, favorPueblo: 5 }, castigo: { favorSenado: -6 },
      fuente: 'Polibio 15.18; Livio 30.37', dictamen: 'historico' },
    { id: 'levas-macedonia', n: 'Legiones para Macedonia', desde: 200, plazo: 20, cond: { tipo: 'edificio', b: 'cuartel', n: 5, ciudad: 'roma' },
      texto: 'El Senado declara la guerra a Filipo V. Cuartel de nivel 5 en Roma para instruir legiones.',
      premio: { oro: 120, favorSenado: 12, favorPueblo: -4 }, castigo: { favorSenado: -8, favorPueblo: 3 },
      fuente: 'Livio 31.6 a 31.8; Polibio 6.19 a 6.21', dictamen: 'historico' }
  ].forEach(m => { D.MISIONES[m.id] = m; });

  root.DATA = D;
  if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
