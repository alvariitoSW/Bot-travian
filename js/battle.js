/* AQVILA — motor de batalla táctica en tiempo real (simulación + vista) */
(function (root) {
  const D = root.DATA;
  const CONTACT = 50;
  // --- Ritmo, moral y cansancio (A8) ---
  const RITMO = 0.0365;           // multiplica todo el daño: hace las batallas igualadas de 8 a 12 minutos
  const TOPE_BATALLA = 1500;    // segundos: tope de seguridad (25 min); si se alcanza gana el defensor
  const MOR_BAJAS = 0.62;        // moral perdida por cada 1 % de la vida del regimiento arrancada de golpe
  const MOR_CONTAGIO = 1.5;     // moral que pierden los vecinos cuando un regimiento rompe (antes 5)
  // --- N4: estados, choque y contagio ---
  const UMBRAL_FIRME = 0.55;    // moral por encima de esto (fracción de la máxima): Firme
  const UMBRAL_VACILA = 0.28;   // por encima de esto: Vacilante; por debajo: Desordenado (y a 0 huye)
  const VACILANTE_PEGA = 0.92;  // el Vacilante pega un poco menos
  const DESORDEN_PEGA = 0.8;    // el Desordenado pega peor...
  const DESORDEN_RECIBE = 1.1;   // ...y aguanta peor (recibe más daño)
  const FAT_AGOTADO = 70;       // cansancio desde el que no se puede cargar
  const CONTAGIO_DIST = 120;    // vecinos que pueden contagiarse del miedo de un regimiento que rompe
  const CONTAGIO_MAX = 0.04;     // el contagio quita como mucho esta fracción de la moral máxima de golpe
  const RESERVA_DIST = 90;      // un aliado de reserva a esta distancia detrás protege del contagio
  const REAGRUPA_DIST = 200;    // el general vivo debe estar a menos de esto para reagrupar a quien huye
  const REAGRUPA_MOR = 0.2;     // moral (fracción) con la que vuelve un regimiento reagrupado: Desordenado
  // --- N5: general y mando (solo el bando 0; el enemigo sigue libre hasta N6) ---
  const MANDO_PUNTOS = 5;       // órdenes activas por ronda con el general vivo
  const MANDO_PUNTOS_SIN = 2;   // ...y con el general muerto
  const MANDO_RADIO = REAGRUPA_DIST;   // más lejos del general que esto, la orden llega con retraso
  const MANDO_RETRASO = 6;      // segundos de ronda que tarda en llegar una orden fuera del radio
  const CARTAS = ['arenga', 'paso', 'cerrada'];   // cartas de táctica por batalla (una por ronda)
  const ARENGA_MORAL = 0.15;    // la arenga sube la moral esta fracción de la máxima
  const PASO_DOBLE = 1.25;      // paso doble: velocidad x1,25 la ronda
  const CERRADA_RECIBE = 0.85;  // formación cerrada: recibe x0,85 de daño
  const CHOQUE_SEG = 4;         // segundos de choque tras el contacto de una carga
  const CHOQUE_RECIENTE = 1;    // segundos: si corría hasta hace esto al tocar al enemigo, el contacto es una carga
  const CHOQUE_DANO = 1.2;     // daño de choque (durante CHOQUE_SEG)
  const CHOQUE_MORAL = 1;           // moral perdida de golpe por el choque (% de la máxima del que lo recibe)
  const CHOQUE_PILUM = 1.25;    // la infantería pesada romana lanza el pilum al contacto: más daño en el choque
  const CHOQUE_FRENTE_LANZA = 0.5;  // lanceros de frente reciben la mitad de la moral del choque
  const CAV_MELE_SEG = 8;       // la caballería pasa a melé larga tras este tiempo de contacto seguido
  const CAV_MELE_MUL = 0.8;     // y pega menos
  const IA_BAJA_RONDA = 10;     // (N15c) y no antes de esta ronda
  const IA_BAJA_FUERZA = 1.25;  // (N15c) la IA en el cerro baja a atacar si es 1,25 veces mayor que el jugador y este no sube
  const AGUANTAR_DEF = 1.5;     // quien aguanta quieto recibe 1/1,5 del daño (N15c: antes 1,15)
  const HOSTIGAR_DIST = 40;     // el hostigador se aparta si un enemigo cuerpo a cuerpo está a menos
  const HOSTIGAR_FAT = 0.5;     // el hostigador se cansa la mitad al moverse
  const RELEVO_ATRAS = 60;      // lo que retrocede el cansado en un relevo
  const RELEVO_CANSADO = 40;    // cansancio desde el que quien recibe 'relevar' es el que se retira
  const RETIRADA_CASTIGO = 0.7; // castigo (× golpe normal) a quien se retira sin que otro regimiento lo cubra
  const RETIRADA_DIST = 60;     // un enemigo a menos de esto castiga la retirada
  const MOR_GENERAL = 4;        // moral que pierde su bando al caer el general (antes 12)
  const MOR_FLANCO = 0.02;      // moral por segundo perdida estando flanqueado
  const MOR_PERDIENDO = 0.115;   // moral por segundo perdida (máx.) si su bando tiene menos hombres que el otro
  const DESIGUAL_REL = 0.75;    // (N15b) si tiene menos que esta fracción de los hombres del rival, pelea con moral que se gasta más deprisa
  const DESIGUAL_ACEL = 1.0;    // (N15b) moral por segundo perdida cuando la diferencia es total; crece con ella (batallas muy desiguales más cortas)
  const MOR_HERIDO = 0.3;       // moral por segundo perdida con el regimiento al 0 % de hombres (proporcional a sus bajas)
  const MOR_CANSADO = 0.10;     // moral por segundo perdida con cansancio al máximo (empieza en FAT_UMBRAL)
  const FAT_UMBRAL = 60;        // cansancio a partir del cual se pierde moral y se marca «Cansado»
  const FAT_PELEA = 0.17;       // cansancio por segundo peleando cuerpo a cuerpo (se divide por la masa)
  const FAT_CARGA = 6;          // cansancio de golpe al lanzar una carga (la caballería pesa más)
  const FAT_MARCHA = 0.15;      // cansancio por segundo al marchar o correr
  const FAT_DESCANSO = 1.2;     // cansancio que se recupera por segundo estando quieto sin pelear
  const FAT_PEGA = 0.3;         // pérdida máxima de daño con cansancio 100 (30 %)
  const FAT_ANDA = 0.25;        // pérdida máxima de velocidad con cansancio 100 (25 %)
  // --- Formación y paso de marcha (A9) ---
  const PASO_MARCHA = 0.5;      // de marcha se anda a spd × 0.5
  const DIST_CARGA_INF = 60;    // a menos de esto del objetivo la infantería corre (spd × 1)
  const DIST_CARGA_CAB = 160;   // a menos de esto del objetivo la caballería y el general galopan (spd × 1.25)
  const DIST_BLOQUE = 220;      // mientras ningún regimiento del bando esté a menos de esto de un enemigo, todos avanzan en bloque al paso del más lento de a pie
  const DIST_TIRADOR = 55;      // los tiradores no pasan de esta distancia por detrás de su infantería más adelantada
  const DIST_TIRO = 130;        // (A3) a menos de esto del objetivo (alcance de los tiradores de detrás) la infantería afloja el paso para dejar disparar a los tiradores
  const PASO_TIRO = 0.12;       // (A3) paso en la fase de tiro: spd × 0.12 (los dos bandos; unos 6-8 s de tiro antes del choque)
  const PROY_MUL = 20;          // (A3) multiplica el daño de cada descarga de proyectiles (antes casi no mataba)
  const PESADA_DEF = 11;        // (A3) infantería con defensa >= esto, o lanceros: armadura pesada
  const ATAC_MAX = 1.5;           // (N15) ancho de frente: como mucho esta cantidad de regimientos cuerpo a cuerpo pega a la vez a un mismo objetivo; los que sobran reparten ese tope
  const SUERTE = 0.08;          // (N15) fortuna del día: cada bando lleva un factor de ±esto en ataque y defensa durante toda la batalla (sale de la semilla)
  const BIS_MOR = 0.75;         // (N15) bisoña: moral máxima ×esto
  const BIS_CURTIDO = 60;       // (N15) segundos peleando cuerpo a cuerpo hasta curtirse del todo (el tope de moral sube de UMBRAL_FIRME a 1)
  const BIS_PEGA = 0.9;         // (N15) la bisoña pega esto de lo normal hasta curtirse
  const SUERTE_ANIMO = 0.14;     // (N15) lo mismo con la moral: el ánimo del día de cada bando (±esto) multiplica su moral máxima
  const FRENTE_HOMBRES = 36;    // (A3) hombres de un regimiento que pelean a la vez (frente); si hay más, las filas de atrás no pegan
  const DIST_PERSEGUIR = 170;   // (A3) la caballería persigue a un regimiento roto que esté a menos de esto
  const PERSEGUIR_MUL = 40;     // (A3) bajas por segundo al que huye (como el golpe normal × esto, sin respuesta)
  const LIGERA_DEF = 8;         // (A3) infantería con defensa <= esto, y los tiradores: «ligera» (la caballería la arrolla)
  const CAB_ARROLLA = 1.35;     // (A3) bonificación de la caballería contra ligera y tiradores (además de la carga)
  const CAB_FLANCO = 1.25;      // (A3) bonificación extra de la caballería al golpear de flanco o por la espalda
  const EMPUJE_CAB = 22;        // (A3) empuje por segundo (unidades) a la ligera arrollada durante la carga
  const DIST_ENCIMA = 90;       // un enemigo a menos de esto obliga al tirador a pelear
  // --- Papeles de la infantería (A4) ---
  // papel por id de unidad (lo que no está aquí se deduce de su clase y defensa: ver papelDe)
  const PAPEL = { velites: 'tirador', hastati: 'media', principes: 'pesada', triarii: 'lanceros', vigiles: 'ligera', milicia: 'ligera',
    hoplitas: 'lanceros', falange: 'lanceros', libios: 'media', iberos: 'ligera', galos: 'ligera', sagrada: 'pesada',
    peltastas: 'tirador', honderos: 'tirador', equites: 'jinete', jinetes: 'jinete', numidas: 'jinete', tesalios: 'jinete', elefantes: 'elefante', general: 'jinete' };
  const PAPEL_NOMBRE = { ligera: 'Ligera', pesada: 'Pesada', lanceros: 'Lanceros' };   // los que se muestran al jugador
  const PAPEL_ATK = { ligera: 0.94, media: 1, pesada: 1, lanceros: 0.95 };           // multiplica el daño que hace en el choque
  const PAPEL_CHOQUE = { ligera: 1.03, media: 1, pesada: 0.85, lanceros: 1 };          // multiplica el daño de choque frontal que recibe (el flanco no cuenta)
  const PAPEL_MORAL = { ligera: 1.1, media: 1, pesada: 0.8, lanceros: 1 };           // multiplica la moral que pierde por bajas
  const PAPEL_PROY = { ligera: 0.85, media: 1, pesada: 0.75, lanceros: 0.75 };        // multiplica el daño de proyectiles recibido
  const PAPEL_VEL = { ligera: 1.1, media: 1, pesada: 0.92, lanceros: 1 };             // multiplica la velocidad
  const PAPEL_FAT = { ligera: 0.85, media: 1, pesada: 1.3, lanceros: 1 };             // multiplica el cansancio de marchar y correr
  // --- N7: formaciones de combate ---
  // vel/proy/melee/flanco/choque/fat/pega: multiplicadores (proy, melee y flanco = daño RECIBIDO; pega = daño que hace; fat = cansancio); t = segundos de transición;
  // sep/fondo/frente: cómo se coloca la gente (fondo × y tope de atacantes ×); cuad: orbe en cuadro; larga: la cuña pega menos en melé larga
  const FORM = {
    normal: { n: 'Normal', gana: 'Se mueve y pelea sin ataduras', pierde: 'Sin ventajas especiales', papeles: null, vel: 1, proy: 1, melee: 1, flanco: 1, choque: 1, fat: 1, pega: 1, t: 3, sep: 1, fondo: 1, frente: 1 },
    testudo: { n: 'Testudo', gana: 'Aguanta flechas y jabalinas (recibe un tercio)', pierde: 'Lenta, pega menos y floja contra caballería por el flanco', papeles: ['pesada', 'media'], vel: 0.6, proy: 0.35, melee: 0.95, flanco: 1.25, choque: 0.7, fat: 1.15, pega: 0.8, t: 4, sep: 0.6, fondo: 1.3, frente: 0.8 },
    cuna: { n: 'Cuña', gana: 'Rompe la línea enemiga en el choque', pierde: 'En melé larga se desgasta y recibe más daño', papeles: ['jinete', 'pesada', 'elefante'], vel: 1.05, proy: 1.1, melee: 1.15, flanco: 1.15, choque: 1.5, fat: 1.2, pega: 1, larga: 0.85, t: 5, sep: 0.9, fondo: 2.5, frente: 0.6 },
    orbe: { n: 'Orbe', gana: 'Sin flancos débiles: aguanta rodeada y recibe menos proyectiles', pierde: 'Muy lenta, pega menos y no carga', papeles: ['ligera', 'media', 'pesada', 'lanceros', 'tirador'], vel: 0.55, proy: 0.85, melee: 1, flanco: 1, choque: 0, fat: 0.9, pega: 0.85, t: 5, sep: 1, fondo: 1, frente: 0.7, cuad: true, sinFlanco: true },
    falange: { n: 'Falange', gana: 'Aguanta mejor de frente, sobre todo contra la caballería', pierde: 'Muy frágil por los flancos y la espalda; algo más lenta', papeles: ['lanceros'], vel: 0.95, proy: 1, melee: 0.95, flanco: 1.35, choque: 1, fat: 1, pega: 1, t: 4, sep: 1, fondo: 2, frente: 1 }
  };
  const TRANS_RECIBE = 1.25;    // (N7) mientras cambia de formación recibe esto más de daño
  const TRANS_VEL = 0.8;        // (N7) y va a esto de su velocidad
  const COL_DIST = 150;         // (N7) marchando sin enemigo a menos de esto, el regimiento va en columna
  const LARGA_SEG = 12;         // (N7) segundos de melé tras los que la cuña se desgasta
  const FORMA_BASE = { ligera: { sep: 2.4, fondo: 3 }, media: { sep: 1.5, fondo: 8 }, pesada: { sep: 1.2, fondo: 8 }, lanceros: { sep: 1, fondo: 8 }, tirador: { sep: 2.2, fondo: 2 }, jinete: { sep: 2.4, fondo: 3 }, elefante: { sep: 7, fondo: 1 } };
  const LINEA_CLASE = { hastati: 1, principes: 2, triarii: 3 };   // (N7) triplex acies
  const LANCEROS_VS_CAB = 1.3;  // bajas extra que los lanceros causan a la caballería (además del ×1,7 de las lanzas)
  const LANCEROS_FLANCO = 1.2;  // los lanceros son débiles de flanco: más daño por flanco o espalda
  const FAT_FRENADA = 12;       // cansancio de golpe que sufre la caballería al estrellarse contra lanceros de frente
  // tipo de daño del arma por papel y tipo de armadura por papel (corte, punta, aplastamiento / cuero, malla, placa)
  const DANO_TIPO = { ligera: 'punta', media: 'corte', pesada: 'corte', lanceros: 'punta', tirador: 'punta', jinete: 'corte', elefante: 'aplastar' };
  const ARMA_TIPO = { ligera: 'cuero', media: 'malla', pesada: 'placa', lanceros: 'malla', tirador: 'cuero', jinete: 'malla', elefante: 'placa' };
  const DANO_MUL = { corte: { cuero: 1.08, malla: 1, placa: 0.8 }, punta: { cuero: 1, malla: 1.1, placa: 1.1 }, aplastar: { cuero: 0.9, malla: 1, placa: 1.25 } }; // 0,8–1,25
  function papelDe(k, u) {
    if (PAPEL[k]) return PAPEL[k];
    if (u.cls === 'spear') return 'lanceros';
    if (u.cls === 'inf') return u.def <= LIGERA_DEF ? 'ligera' : u.def >= PESADA_DEF ? 'pesada' : 'media';
    return u.cls === 'rng' ? 'tirador' : u.cls === 'ele' ? 'elefante' : 'jinete';
  }

  // --- Terreno (A5b): cuadrícula gruesa compartida con la vista 3D ---
  const CELDA = 40;             // lado de cada celda de terreno (unidades del campo)
  const COLINA_PEGA = 0.13;     // el regimiento en alto pega (y el de abajo pega menos) hasta ±15 % según la diferencia de altura
  const COLINA_ALCANCE = 0.15;  // los tiradores en lo alto de la colina tienen +15 % de alcance
  const FAT_SUBIDA = 4;         // cansancio al subir de una celda llana a una de colina (proporcional a la altura que se gana)
  const FAT_CUESTA = 0.5;       // cansancio por segundo peleando cuesta arriba (diferencia de altura 1)
  const BOSQUE_VEL = 0.78;       // velocidad dentro del bosque
  const BOSQUE_PROY = 0.7;      // el daño de proyectiles que recibe un regimiento dentro del bosque
  // --- N14: campos amplios y relieve nuevo ---
  const ANCHO_BASE = 1200;      // ancho del campo por defecto (unidades del campo; cfg.fw lo cambia, mínimo 600)
  const ANCHO_GRANDE = 1500;    // ancho si entre los dos bandos hay más de HOMBRES_GRANDE hombres
  const HOMBRES_GRANDE = 700;
  const VADO_VEL = 0.6;         // velocidad dentro de un vado
  const VADO_MOR = 0.15;        // moral (fracción de la máxima) que pierde un regimiento al entrar en un vado: cruzar desordena
  const PANTANO_VEL = 0.6;      // el pantano frena a todos a este factor
  const PANTANO_FAT = 1.5;      // cansancio por segundo marchando por el pantano
  const CERRO_ALT = 1.6;        // altura del núcleo del cerro (la colina llega a 1): domina más
  const RIO_GROSOR = 80;        // ancho del río (2 celdas)
  const RIO_VADOS = [0.2, 0.5, 0.8];   // posición (fracción del ancho) de los vados, simétricos
  const VADO_ANCHO = 80;        // ancho de cada vado
  const PASO_GROSOR = 120;      // grosor de la muralla de roca del paso estrecho (3 celdas)
  const PASO_ANCHO = 200;       // ancho del paso por el centro: solo caben unos pocos regimientos en línea
  const ORILLA = 8;             // margen con el que se rodea el río o la roca hasta el vado
  // códigos de celda: 0 normal, 1 agua, 2 vado, 3 pantano, 4 roca, 5 paso
  const T_AGUA = 1, T_VADO = 2, T_PANTANO = 3, T_ROCA = 4, T_PASO = 5;
  // campo tipo por ciudad (lo que no está aquí sale de la semilla); las manchas se repiten giradas 180° para el otro bando
  const TERRENO_CIUDAD = { roma: 'cerro', volsinii: 'bosque', capua: 'rio', tarentum: 'rio', mediolanum: 'pantano', messana: 'cerro', syracusae: 'mixto', agrigentum: 'colina',
    panormus: 'llano', lilybaeum: 'llano', carales: 'pantano', emporion: 'mixto', saguntum: 'paso', carthagonova: 'mixto', ambracia: 'paso', pella: 'colina', corinthus: 'mixto', carthago: 'rio' };
  // f: manchas ['h' colina, 'b' bosque, 'c' cerro, 'p' pantano, 'k' cresta (cx, cy, mitad largo, mitad grueso)]; fa: manchas extra si el campo es ancho
  const TERRENOS = { llano: { n: 'Llano', f: [], fa: [] },
    colina: { n: 'Colina', f: [['h', 0.25, 0.86, 100], ['h', 0.72, 0.62, 90]], fa: [['h', 0.5, 0.9, 90], ['h', 0.1, 0.6, 80]] },
    bosque: { n: 'Bosque', f: [['b', 0.2, 0.85, 75], ['b', 0.78, 0.74, 65], ['b', 0.62, 0.56, 60]], fa: [['b', 0.45, 0.9, 70], ['b', 0.08, 0.6, 60]] },
    mixto: { n: 'Mixto', f: [['h', 0.28, 0.88, 90], ['b', 0.75, 0.8, 65], ['h', 0.5, 0.5, 80], ['b', 0.2, 0.62, 55]], fa: [['b', 0.5, 0.9, 60], ['h', 0.08, 0.7, 70]] },
    cerro: { n: 'Cerro', f: [['c', 0.5, 0.5, 150], ['h', 0.15, 0.84, 80], ['k', 0.32, 0.68, 100, 28]], fa: [['b', 0.5, 0.9, 60]] },
    rio: { n: 'Río con vados', f: [['b', 0.12, 0.84, 60], ['b', 0.88, 0.7, 55]], fa: [['b', 0.5, 0.9, 60]], banda: { tipo: 'rio' } },
    pantano: { n: 'Pantano', f: [['p', 0.3, 0.5, 90], ['p', 0.72, 0.42, 80], ['b', 0.12, 0.84, 55]], fa: [['p', 0.5, 0.72, 70], ['p', 0.9, 0.5, 60]] },
    paso: { n: 'Paso estrecho', f: [['b', 0.14, 0.86, 60], ['h', 0.86, 0.8, 70]], fa: [], banda: { tipo: 'paso' } } };
  const TERRENO_IDS = ['llano', 'colina', 'bosque', 'mixto'];
  // --- Rondas (N2): plan en pausa y ejecución de unos segundos para los dos bandos ---
  const RONDA_SEG = 20;         // segundos de simulación de cada ronda de ejecución
  const ESPERA_SEG = 10;        // «espera 10 s y avanza»: la orden empieza a los 10 s de la ronda
  const DIST_CARGAN = 120;      // «si te cargan»: un enemigo que corre o carga a menos de esto
  const CONDICIONES = { aguanta: 'Si te cargan, aguanta', nopersigue: 'Si huyen, no persigas', espera: 'Espera 10 s y avanza' };

  function mkRng(seed) { let a = seed >>> 0; const f = function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; f.estado = function () { return a; }; f.fija = function (v) { a = v; }; return f; }
  // (N15) tope de moral de un regimiento: los bisoños no pasan de Vacilante hasta curtirse peleando (r.curt, segundos)
  function topeMor(r) { return r.bis ? r.morMax * (UMBRAL_FIRME + (1 - UMBRAL_FIRME) * Math.min(1, (r.curt || 0) / BIS_CURTIDO)) : r.morMax; }
  function esBisono(r) { return !!r.bis && (r.curt || 0) < BIS_CURTIDO; }
  function effN(m) { return m <= 24 ? m : 24 + (m - 24) * 0.3; }
  function ratio(atk, def) { return Math.pow(atk / def, 0.85); }
  function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

  /* cfg: { sides:[{units,gen,name,col,atkMul,defMul,mor}, {...}], defender:0|1, wall:n, seed }
     el lado 0 es siempre el jugador (abajo) */
  function Battle(cfg) {
    this.cfg = cfg; this.t = 0; this.regs = []; this.fx = []; this.corpses = [];
    this.over = false; this.winner = null; this.auto = true;
    this.rondas = cfg.rondas === true; this.ronda = 1; this.tRonda = 0; this.hechos = []; this.notas = []; this.snapIni = null; this.snapFin = null; this.repite = false;
    this.fase = cfg.despliegue === true ? 'despliegue' : (this.rondas ? 'plan' : 'lucha'); // 'despliegue' y 'plan': el tiempo no corre; 'ejecucion': una ronda
    this.H = Math.max(800, Math.min(1300, Math.round(cfg.fh || 900))); // alto del campo (se adapta a la pantalla)
    let tot = 0; for (const sd of cfg.sides) for (const k in sd.units) if (D.UNITS[k].cls !== 'ele') tot += sd.units[k];
    this.W = Math.max(600, Math.min(2000, Math.round(cfg.fw || (tot > HOMBRES_GRANDE ? ANCHO_GRANDE : ANCHO_BASE)))); // ancho del campo (N14)
    this.rnd = mkRng(cfg.seed || 1);
    this.mkTerreno(cfg.terreno);
    this.genDown = [false, false]; this.cartas = CARTAS.slice(); this.cartaPlan = null; this.cartaRonda = 0;
    // mismo tamaño de regimiento para ambos bandos (máx. ~12 regimientos por ejército)
    let big = 0;
    for (const sd of cfg.sides) { let t = 0; for (const k in sd.units) if (D.UNITS[k].cls !== 'ele') t += sd.units[k]; big = Math.max(big, t); }
    this.size = Math.max(30, Math.ceil(big / 12));
    // (N15) objetivo de batalla: null = gana quien destruye o rompe al otro. Se guarda en estado()/aplicar().
    this.obj = cfg.objetivo && cfg.objetivo.tipo ? Object.assign({ lado: 0 }, JSON.parse(JSON.stringify(cfg.objetivo)), { tZona: [0, 0], fin: false, cumplido: false }) : null;
    this.suerte = [1 + (this.rnd() * 2 - 1) * SUERTE, 1 + (this.rnd() * 2 - 1) * SUERTE]; this.animo = [1 + (this.rnd() * 2 - 1) * SUERTE_ANIMO, 1 + (this.rnd() * 2 - 1) * SUERTE_ANIMO];
    for (let s = 0; s < 2; s++) this.deploy(s, cfg.sides[s]);
    this.start = [this.men(0), this.men(1)];
    this.ia = null; this.gesto = ''; this.dif = Battle.dificultadContexto(cfg);   // N15: lo duro que es el rival, por contexto (no se elige)
    if (this.rondas && cfg.ia !== false) this.iaInit();   // N6: plan del enemigo antes de la ronda 1
  }

  // terreno por defecto de una ciudad (id) o, si no está en la tabla, por semilla
  Battle.terrenoDe = function (city, seed) { return TERRENO_CIUDAD[city] || TERRENO_IDS[Math.abs(Math.floor(seed || 0)) % TERRENO_IDS.length]; };
  Battle.TERRENOS = TERRENOS; Battle.TERRENO_CIUDAD = TERRENO_CIUDAD; Battle.CELDA = CELDA; Battle.VADO_VEL = VADO_VEL; Battle.PANTANO_VEL = PANTANO_VEL; Battle.VADO_MOR = VADO_MOR;

  // cuadrícula de terreno: alt (0, 0,5 o 1), bosque (0/1) y ter (código de celda) por celda; ambos bandos tienen manchas equivalentes en su zona
  Battle.prototype.mkTerreno = function (id) {
    const def = TERRENOS[id] || TERRENOS.llano, H = this.H, W = this.W, cols = Math.ceil(W / CELDA), rows = Math.ceil(H / CELDA), n = cols * rows;
    const T = { id: TERRENOS[id] ? id : 'llano', nombre: def.n, cols: cols, rows: rows, alt: new Array(n).fill(0), bos: new Array(n).fill(0), ter: new Array(n).fill(0), banda: null, plano: !def.f.length && !def.banda };
    const fs = def.f.concat(W > 800 ? (def.fa || []) : []);
    for (const f of fs) for (const m of [1, -1]) {
      const cx = m > 0 ? f[1] * W : W - f[1] * W, cy = m > 0 ? f[2] * H : H - f[2] * H, R = f[3];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const px = (c + 0.5) * CELDA, py = (r + 0.5) * CELDA, d = Math.hypot(px - cx, py - cy), i = r * cols + c;
        if (f[0] === 'b') { if (d < R) T.bos[i] = 1; }
        else if (f[0] === 'p') { if (d < R) T.ter[i] = T_PANTANO; }
        else if (f[0] === 'k') { if (Math.abs(px - cx) <= f[3] && Math.abs(py - cy) <= f[4] && T.alt[i] < 1) T.alt[i] = 1; }   // cresta: altura en línea
        else if (f[0] === 'c') { const v = 1 - d / R, a = v >= 0.55 ? CERRO_ALT : v >= 0.25 ? 1 : v >= 0.1 ? 0.5 : 0; if (a > T.alt[i]) T.alt[i] = a; }   // cerro: núcleo que domina, con laderas
        else { const v = 1 - d / R, a = v >= 0.66 ? 1 : v >= 0.33 ? 0.5 : 0; if (a > T.alt[i]) T.alt[i] = a; }
      }
    }
    if (def.banda) {   // franja horizontal en mitad del campo con pasos: vados del río o hueco del paso estrecho
      const rio = def.banda.tipo === 'rio', th = rio ? RIO_GROSOR : PASO_GROSOR, nf = Math.round(th / CELDA), rLo = Math.round((H / 2 - th / 2) / CELDA), cr = [];
      if (rio) for (const fx of RIO_VADOS) { const c0 = Math.round(fx * W / CELDA) - Math.round(VADO_ANCHO / 2 / CELDA); cr.push({ c0: c0, c1: c0 + Math.round(VADO_ANCHO / CELDA) - 1 }); }
      else { let c0 = -1, c1 = -1; for (let c = 0; c < cols; c++) if (Math.abs((c + 0.5) * CELDA - W / 2) <= PASO_ANCHO / 2) { if (c0 < 0) c0 = c; c1 = c; } cr.push({ c0: c0, c1: c1 }); }
      for (let r = rLo; r < rLo + nf && r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c, g = cr.some(q => c >= q.c0 && c <= q.c1);
        T.ter[i] = rio ? (g ? T_VADO : T_AGUA) : (g ? T_PASO : T_ROCA); T.bos[i] = 0; T.alt[i] = !rio && !g ? 1 : 0;
      }
      T.banda = { tipo: def.banda.tipo, y0: rLo * CELDA, y1: (rLo + nf) * CELDA, cr: cr.map(q => ({ x0: q.c0 * CELDA, x1: (q.c1 + 1) * CELDA, xc: (q.c0 + q.c1 + 1) * CELDA / 2 })) };
    }
    this.tr = T; this.celdas = {};
  };
  // {alt, bosque, ter, bloq, vado, pantano} en el punto (x,y) del campo; objetos compartidos (no se modifican)
  const LLANO = { alt: 0, bosque: 0, ter: 0, bloq: false, vado: false, pantano: false };
  Battle.prototype.terrenoEn = function (x, y) {
    const T = this.tr; if (T.plano) return LLANO;
    const c = Math.max(0, Math.min(T.cols - 1, Math.floor(x / CELDA))), r = Math.max(0, Math.min(T.rows - 1, Math.floor(y / CELDA))), i = r * T.cols + c;
    if (this.celdas[i]) return this.celdas[i];
    const t = T.ter[i] || 0;
    return this.celdas[i] = { alt: T.alt[i], bosque: T.bos[i], ter: t, bloq: t === T_AGUA || t === T_ROCA, vado: t === T_VADO, pantano: t === T_PANTANO };
  };
  // adónde apuntar para ir de r a (x,y) sin cruzar la franja de agua o roca más que por un paso: [x, y] directo o un punto intermedio
  Battle.prototype.rumbo = function (r, x, y) {
    const B = this.tr.banda; if (!B) return [x, y];
    const lado = v => v < B.y0 ? -1 : v >= B.y1 ? 1 : 0, sr = lado(r.y), st = lado(y);
    if (sr === st && sr !== 0) return [x, y];
    const cerca = (px, ax) => { let b = null, bd = 1e9; for (const c of B.cr) { const d = Math.abs(ax - c.xc) + Math.abs(px - c.xc); if (d < bd) { bd = d; b = c; } } return b; };
    const sal = sg => sg < 0 ? B.y0 - ORILLA : B.y1 + ORILLA;
    if (sr === 0) {
      const c = cerca(r.x, r.x);
      if (st === 0) { if (x >= c.x0 && x <= c.x1) return [x, y]; return [c.xc, sal(r.y < (B.y0 + B.y1) / 2 ? -1 : 1)]; }
      return [c.xc, sal(st)];
    }
    const c = cerca(x, r.x);
    if (Math.abs(r.x - c.xc) > ORILLA) return [c.xc, sal(sr)];
    return st === 0 ? [x, y] : [c.xc, sal(st)];
  };
  Battle.prototype.rango = function (r) { return r.u.range * (1 + COLINA_ALCANCE * this.terrenoEn(r.x, r.y).alt); };

  Battle.esBisono = esBisono; Battle.topeMor = topeMor; Battle.BIS_CURTIDO = BIS_CURTIDO; Battle.prototype.esBisono = esBisono;
  Battle.PAPEL = PAPEL; Battle.PAPEL_NOMBRE = PAPEL_NOMBRE; Battle.papelDe = papelDe;
  Battle.prototype.men = function (side) { let n = 0; for (const r of this.regs) if (r.side === side && r.st === 'ok') n += r.men; return n; };

  Battle.prototype.mk = function (side, k, men, a, bis) {
    const u = D.UNITS[k], hp = u.hp || 1;
    let def = a.defMul || 1;
    if (this.cfg.defender === side) def *= 1 + 0.1 * (this.cfg.wall || 0);
    let mor = (u.mor + (a.mor || 0)) * this.animo[side];
    if (bis) mor *= BIS_MOR;   // la leva sin curtir tiene menos moral y empieza Vacilante (mitad de su máxima)
    return {
      id: this.regs.length + 1, side: side, k: k, u: u, men: men, max: men, hp: men * hp, mor: bis ? mor * 0.5 : mor, morMax: mor, bis: bis ? 1 : 0, curt: 0,
      x: 0, y: 0, ang: side === 0 ? -Math.PI / 2 : Math.PI / 2, st: 'ok', tgt: null, order: null,
      think: this.rnd() * 0.5, cd: this.rnd() * 1.6, ammo: u.range ? 14 : 0, fight: 0, charge: 0, run: 0, flank: 0, fat: 0, mv: false, corre: false, choque: 0, choqueMor: 0, tCorre: -99, cont: 0, contagiado: 0, reagrupado: 0,
      papel: papelDe(k, u), vel: u.spd * (PAPEL_VEL[papelDe(k, u)] || 1), form: k === 'falange' ? 'falange' : 'normal', trans: 0, columna: false, agrupado: false, frente: null, linea: LINEA_CLASE[k] || 0, angObj: null,
      atkMul: (a.atkMul || 1) * this.suerte[side] * (0.92 + this.rnd() * 0.16), defMul: def * this.suerte[side] // ±8 % de fortuna por regimiento
    };
  };

  Battle.prototype.deploy = function (side, a) {
    const list = [], size = this.size;
    for (const k in a.units) {
      const n = Math.floor(a.units[k]); if (n <= 0) continue;
      const sz = D.UNITS[k].cls === 'ele' ? 8 : size, cnt = Math.max(1, Math.round(n / sz));
      // bisoñas: la fracción a.bis de los regimientos de cada tipo; la milicia cuenta como bisoña entera siempre
      const nb = k === 'milicia' ? cnt : Math.round(Math.max(0, Math.min(1, a.bis || 0)) * cnt);
      for (let i = 0; i < cnt; i++) { const r = this.mk(side, k, Math.floor(n / cnt) + (i < n % cnt ? 1 : 0), a, i < nb); this.regs.push(r); list.push(r); }
    }
    if (a.gen) { const gen = this.mk(side, 'general', 20, a); gen.name = a.gen.n; this.regs.push(gen); }
    this.formar(side, 'clasica');
  };

  Battle.PLANTILLAS = [['clasica', 'Clásica'], ['linea', 'Línea'], ['ancha', 'Línea ancha'], ['tres', 'Tres líneas'], ['centro', 'Centro fuerte'], ['alas', 'Alas fuertes']];
  // nombre corto para los botones de la barra de despliegue
  Battle.CORTOS = { clasica: 'Clásica', linea: 'Línea', ancha: 'Ancha', tres: 'Tres líneas', centro: 'Centro', alas: 'Alas' };

  // franja propia donde se puede colocar: desde la línea de salida hacia atrás, más 60 hacia delante; nunca pasa del 40 % del campo
  Battle.prototype.zona = function (side) {
    const H = this.H;
    return side === 0 ? { x0: 20, x1: this.W - 20, y0: Math.max(H - 260, H * 0.6), y1: H - 24 } : { x0: 20, x1: this.W - 20, y0: 24, y1: Math.min(260, H * 0.4) };
  };

  // coloca un regimiento propio (solo en despliegue), recortado a la zona
  Battle.prototype.colocar = function (r, x, y) {
    if (this.fase !== 'despliegue' || !r || r.side !== 0 || r.st !== 'ok') return false;
    const z = this.zona(0);
    r.x = Math.max(z.x0, Math.min(z.x1, x)); r.y = Math.max(z.y0, Math.min(z.y1, y)); r.order = null; r.tgt = null;
    return true;
  };

  Battle.prototype.empezar = function () { this.fase = this.rondas ? 'plan' : 'lucha'; };

  // recoloca los regimientos de un bando con una plantilla: 'clasica' (A9), 'ancha' o 'centro'
  Battle.prototype.formar = function (side, nombre) {
    const mine = this.regs.filter(r => r.side === side), gen = mine.find(r => r.u.cls === 'gen') || null, list = mine.filter(r => r !== gen);
    const f = side === 0 ? -1 : 1, base = side === 0 ? this.H - 200 : 200, CAP = 7;
    if (nombre === 'linea' || nombre === 'tres' || nombre === 'alas') return this.formarNueva(side, nombre, mine, gen, list, f, base);
    const main = list.filter(r => r.u.cls === 'inf' || r.u.cls === 'spear' || r.u.cls === 'ele'), cav = list.filter(r => r.u.cls === 'cav');
    let skirm = list.filter(r => r.u.cls === 'rng');
    const eles = main.filter(r => r.u.cls === 'ele'), foot = main.filter(r => r.u.cls !== 'ele'), rows = [];
    const centrar = (fila, eles) => { const m = Math.floor(fila.length / 2); return fila.slice(0, m).concat(eles, fila.slice(m)); };
    let esp = 60, alas = true;
    if (nombre === 'ancha') {
      // toda la infantería en una línea; si no cabe ni apretada, segunda fila
      const n = foot.length + eles.length, minSp = 34, sp = k => (this.W / 2 - 20) / ((k - 1) / 2 + (cav.length ? 1 : 0));
      const per = n > 1 && sp(n) < minSp ? Math.ceil(n / 2) : Math.max(1, n);
      const todo = centrar(foot.splice(0, foot.length), eles);
      while (todo.length) rows.push(todo.splice(0, per));
      while (skirm.length) rows.push(skirm.splice(0, Math.max(per, 1)));
    } else if (nombre === 'centro') {
      // columna profunda de 4 de ancho; tiradores tras la primera fila; caballería y general en reserva al fondo
      const todo = centrar(foot.splice(0, foot.length), eles);
      rows.push(todo.splice(0, 4));
      while (skirm.length) rows.push(skirm.splice(0, 4));
      while (todo.length) rows.push(todo.splice(0, 4));
      const res = cav.concat(gen ? [gen] : []);
      while (res.length) rows.push(res.splice(0, 5));
      alas = false;
    } else {
      // clásica (A9): fila 1 infantería con elefantes al centro; luego tiradores; luego la reserva; el general, al final
      const first = foot.splice(0, Math.max(0, CAP - eles.length));
      rows.push(centrar(first, eles));
      while (skirm.length) rows.push(skirm.splice(0, CAP));
      while (foot.length) rows.push(foot.splice(0, CAP));
    }
    if (gen && nombre !== 'centro') rows.push([gen]);
    if (nombre !== 'clasica') { const z = this.zona(side); esp = Math.min(60, Math.abs((side === 0 ? z.y1 : z.y0) - base) / Math.max(1, rows.length - 1)); }
    const maxN = Math.max(1, ...rows.map(r => r.length));
    // separación: se estrecha si las alas no caben en el campo (x entre 20 y this.W-20)
    const SP = Math.min(62, (this.W / 2 - 20) / ((maxN - 1) / 2 + (cav.length && alas ? 1 : 0)));
    rows.forEach((row, i) => row.forEach((r, j) => { r.x = this.W / 2 + (j - (row.length - 1) / 2) * SP; r.y = base - f * esp * i; }));
    // caballería: repartida entre las dos alas, en columna hacia atrás (en 'centro' ya va en reserva)
    if (alas) { const wx = ((maxN - 1) / 2 + 1) * SP, cnt = [0, 0]; cav.forEach((r, i) => { const w = i % 2; r.x = this.W / 2 + (w ? wx : -wx); r.y = base - f * esp * cnt[w]++; }); }
    const z = nombre === 'clasica' ? { y0: 24, y1: this.H - 24 } : this.zona(side);
    for (const r of mine) { r.y = Math.max(z.y0, Math.min(z.y1, r.y)); r.x = Math.max(20, Math.min(this.W - 20, r.x)); }
  };

  // formaciones «linea», «tres» y «alas»: colocan por posiciones y al final separan lo que se solape, siempre dentro de la zona
  Battle.prototype.formarNueva = function (side, nombre, mine, gen, list, f, base) {
    const z = this.zona(side), back = d => base - f * d; // back(d): d unidades hacia atrás de la línea base
    const rank = r => (r.k === 'hastati' ? 0 : r.k === 'triarii' ? 2 : 1);
    const foot = list.filter(r => r.u.cls === 'inf' || r.u.cls === 'spear' || r.u.cls === 'ele'), cav = list.filter(r => r.u.cls === 'cav'), skirm = list.filter(r => r.u.cls === 'rng');
    const centrar = (fila, eles) => { const m = Math.floor(fila.length / 2); return fila.slice(0, m).concat(eles, fila.slice(m)); };
    // pone una fila centrada en x0 con separación sp (se estrecha si no cabe en el campo)
    const fila = (rs, y, sp, x0, mx) => { const n = rs.length, s = n > 1 ? Math.min(sp, ((mx || this.W - 40)) / (n - 1)) : 0; rs.forEach((r, j) => { r.x = (x0 == null ? this.W / 2 : x0) + (j - (n - 1) / 2) * s; r.y = y; }); };
    const eles = foot.filter(r => r.u.cls === 'ele'), pie = foot.filter(r => r.u.cls !== 'ele');
    if (nombre === 'linea') {
      // una sola fila fina de infantería (dos solo si no cabe), tiradores justo detrás, caballería en las alas, general en el centro atrás
      const todo = centrar(pie.slice(), eles), per = Math.max(1, Math.min(todo.length, 12)), cn = cav.length ? 110 : 0;
      let yy = 0; const sp = 46;
      while (todo.length) { fila(todo.splice(0, per), back(yy), sp, null, this.W - 40 - cn); yy += 44; }
      const sk = skirm.slice(); while (sk.length) { fila(sk.splice(0, per), back(yy), 40); yy += 34; }
      if (gen) { gen.x = this.W / 2; gen.y = back(yy + 10); }
      const wx = Math.min(this.W / 2 - 25, (Math.min(per, pie.length + eles.length) - 1) / 2 * Math.min(sp, (this.W - 40 - cn) / Math.max(1, per - 1)) + 55);
      cav.forEach((r, i) => { r.x = this.W / 2 + (i % 2 ? wx : -wx); r.y = back(Math.floor(i / 2) * 44); });
    } else if (nombre === 'tres') {
      // triplex acies: hastati, principes y triarii en tres filas con huecos; tiradores delante (vélites); caballería en las alas
      const orden = pie.slice().sort((a, b) => rank(a) - rank(b)), tres = [[], [], []], q = Math.ceil(orden.length / 3);
      orden.forEach((r, i) => tres[Math.min(2, Math.floor(i / q))].push(r));
      tres[1] = centrar(tres[1], eles);
      tres.forEach((fl, i) => fl.forEach(r => { r.linea = LINEA_CLASE[r.k] || i + 1; }));   // (N7) las tres líneas que se relevan: hastati, principes y triarii por clase; el resto, por su posición
      const cn = cav.length ? 100 : 0, esp = 56;
      tres.forEach((fl, i) => fila(fl, back(i * esp), 78, this.W / 2 + (i === 1 ? 39 * (fl.length > 1 ? 1 : 0) : 0), this.W - 40 - cn)); // 2.ª fila a tresbolillo
      fila(skirm.slice(), back(-50), 58, null, this.W - 40 - cn);
      if (gen) { gen.x = this.W / 2; gen.y = back(3 * esp); }
      const wx = Math.min(this.W / 2 - 28, 272);
      cav.forEach((r, i) => { r.x = this.W / 2 + (i % 2 ? wx : -wx); r.y = back(Math.floor(i / 2) * 50); });
    } else {
      // alas fuertes: centro flojo y retrasado; infantería pesada y caballería en los dos flancos
      const orden = pie.slice().sort((a, b) => b.hp - a.hp), nc = orden.length < 3 ? 0 : Math.ceil(orden.length / 3), pesada = orden.slice(0, orden.length - nc), centro = centrar(orden.slice(orden.length - nc), eles);
      pesada.forEach((r, i) => { const lado = i % 2, k = Math.floor(i / 2); r.x = this.W / 2 + (lado ? 200 - (k % 2) * 50 : -200 + (k % 2) * 50); r.y = back(Math.floor(k / 2) * 50); });
      while (centro.length) fila(centro.splice(0, 4), back(70 + 0), 52, null, 200);
      fila(skirm.slice(), back(10), 40, null, 220);
      if (gen) { gen.x = this.W / 2; gen.y = back(125); }
      cav.forEach((r, i) => { r.x = this.W / 2 + (i % 2 ? 264 : -264); r.y = back(Math.floor(i / 2) * 50); });
    }
    this.separar(mine, z, f);
  };

  // lo que quede solapado o fuera de la zona se mueve al hueco libre más cercano dentro de la zona
  Battle.prototype.separar = function (mine, z, f) {
    const MIN = 26, put = (r, x, y) => { r.x = Math.max(20, Math.min(this.W - 20, x)); r.y = Math.max(z.y0, Math.min(z.y1, y)); }, done = [];
    for (const r of mine) {
      const x0 = r.x, y0 = r.y, cands = [[0, 0]];
      for (let k = 1; k <= 10; k++) { const d = 28 * k; cands.push([0, -f * d], [d, 0], [-d, 0], [d, -f * d], [-d, -f * d], [0, f * d]); }
      for (const [dx, dy] of cands) { put(r, x0 + dx, y0 + dy); if (done.every(o => Math.hypot(o.x - r.x, o.y - r.y) >= MIN)) break; }
      done.push(r);
    }
  };

  // regimiento de infantería cuerpo a cuerpo vivo más adelantado del bando (null si no queda ninguno)
  Battle.prototype.pantalla = function (r) {
    let best = null;
    for (const o of this.regs) {
      if (o.side !== r.side || o.st !== 'ok' || (o.u.cls !== 'inf' && o.u.cls !== 'spear')) continue;
      if (!best || (r.side === 0 ? o.y < best.y : o.y > best.y)) best = o;
    }
    return best;
  };

  Battle.prototype.pick = function (r, hold) {
    let best = null, bs = 1e9;
    if (r.u.cls === 'rng' && !hold && this.pantalla(r)) {
      // el tirador con munición prefiere al enemigo más cercano a tiro; sin munición solo pelea si lo tiene encima
      const lim = r.ammo > 0 ? this.rango(r) : DIST_ENCIMA;
      for (const e of this.regs) { if (e.side === r.side || e.st !== 'ok') continue; const d = Math.hypot(e.x - r.x, e.y - r.y); if (d <= lim && d < bs) { bs = d; best = e; } }
      if (best || r.ammo <= 0) return best;
    }
    for (const e of this.regs) {
      if (e.side === r.side || e.st !== 'ok') continue;
      const d = Math.hypot(e.x - r.x, e.y - r.y);
      if (hold && d > (r.ammo > 0 ? this.rango(r) : 130)) continue;
      let s = d;
      if (d < CONTACT + 6) s -= 1000;
      else if (r.u.cls === 'cav') { if (e.u.cls === 'rng') s *= 0.55; else if (e.u.cls === 'spear' || e.u.cls === 'ele') s *= 1.7; }
      if (s < bs) { bs = s; best = e; }
    }
    return best;
  };

  Battle.prototype.turn = function (r, want, dt) {
    const d = angDiff(want, r.ang), m = (r.u.cls === 'cav' || r.u.cls === 'gen' ? 3.2 : 2.2) * dt;
    r.ang += Math.abs(d) <= m ? d : Math.sign(d) * m;
  };

  Battle.prototype.moveTo = function (r, x, y, dt, mul) {
    const B = this.tr.banda;
    if (B && this.terrenoEn(x, y).bloq) { if (r.y < B.y0) y = B.y0 - ORILLA; else if (r.y >= B.y1) y = B.y1 + ORILLA; }   // destino en el agua o la roca: se queda en la orilla
    const fx = x, fy = y;
    if (B) { const w = this.rumbo(r, x, y); x = w[0]; y = w[1]; }
    const dx = x - r.x, dy = y - r.y, d = Math.hypot(dx, dy);
    if (d < 1) return Math.hypot(fx - r.x, fy - r.y);
    this.turn(r, Math.atan2(dy, dx), dt);
    const t0 = this.terrenoEn(r.x, r.y);
    let vv = r.vel * FM(r).vel * (r.trans > 0 ? TRANS_VEL : 1) * (r.cartaFx === 'paso' ? PASO_DOBLE : 1) * (mul || PASO_MARCHA) * (1 - FAT_ANDA * r.fat / 100) * (t0.bosque ? BOSQUE_VEL : 1) * (t0.vado ? VADO_VEL : 1) * (t0.pantano ? PANTANO_VEL : 1);
    if (r.order && r.order.vmax && !r.corre) vv = Math.min(vv, r.order.vmax);   // (N7) marcha agrupada: nadie pasa del ritmo común
    const m = Math.min(vv * dt, d);
    r.mv = true; r.fat = Math.min(100, r.fat + FAT_MARCHA * dt * FM(r).fat * (mul > 1 ? 1.6 : 1) * (PAPEL_FAT[r.papel] || 1) * (tipoDe(r) === 'hostigar' ? HOSTIGAR_FAT : 1) + (t0.pantano ? PANTANO_FAT * dt : 0));
    let nx = r.x + dx / d * m, ny = r.y + dy / d * m;
    if (this.terrenoEn(nx, ny).bloq && !t0.bloq) {   // nunca se entra en el agua ni en la roca: se desliza por la orilla o espera
      if (!this.terrenoEn(nx, r.y).bloq) ny = r.y; else if (!this.terrenoEn(r.x, ny).bloq) nx = r.x; else { nx = r.x; ny = r.y; }
    }
    const mm = Math.hypot(nx - r.x, ny - r.y); r.x = nx; r.y = ny; r.run += mm;
    const t1 = this.terrenoEn(r.x, r.y); if (t1.alt > t0.alt) r.fat = Math.min(100, r.fat + FAT_SUBIDA * (t1.alt - t0.alt));   // cuesta arriba
    if (t1.vado && !r.enVado) r.mor = Math.max(1, r.mor - VADO_MOR * r.morMax);   // cruzar un vado desordena
    r.enVado = t1.vado;
    return Math.hypot(fx - r.x, fy - r.y);
  };

  Battle.prototype.ligera = function (b) { return b.u.cls === 'rng' || (b.u.cls === 'inf' && b.u.def <= LIGERA_DEF); };

  // persecución: la caballería castiga al regimiento roto más cercano, que no responde
  Battle.prototype.perseguido = function (r) {
    let best = null, bs = DIST_PERSEGUIR;
    for (const e of this.regs) { if (e.side === r.side || e.st !== 'rout') continue; const d = Math.hypot(e.x - r.x, e.y - r.y); if (d < bs) { bs = d; best = e; } }
    return best;
  };

  // estado de moral: 0 Firme, 1 Vacilante, 2 Desordenado, 3 Huye (única fuente; la vista la usa)
  function estadoMoral(r) { const mo = r.mor / r.morMax; return r.st !== 'ok' ? 3 : mo > UMBRAL_FIRME ? 0 : mo > UMBRAL_VACILA ? 1 : 2; }
  Battle.estadoMoral = estadoMoral; Battle.BIS_CURTIDO = BIS_CURTIDO; Battle.prototype.estadoMoral = estadoMoral;
  const nombreReg = function (r) { return r.name || r.u.n; };
  Battle.prototype.nota = function (t) { if (this.notas.length < 40 && this.notas.indexOf(t) < 0) this.notas.push(t); };
  // ¿es de reserva? (ala marcada por la vista, o triarios por defecto)
  function esReserva(r) { return r.ala ? r.ala === 'reserva' : r.k === 'triarii'; }
  // ¿tiene un aliado de reserva en pie detrás (a ~RESERVA_DIST)?
  Battle.prototype.tieneReserva = function (o) {
    const dir = o.side === 0 ? 1 : -1;
    for (const q of this.regs) if (q !== o && q.side === o.side && q.st === 'ok' && esReserva(q) && (q.y - o.y) * dir > 8 && Math.hypot(q.x - o.x, q.y - o.y) <= RESERVA_DIST) return true;
    return false;
  };
  const tipoDe = function (r) { return r.order && r.order.tipo ? r.order.tipo : null; };
  const FM = function (r) { return FORM[r.form] || FORM.normal; };

  Battle.prototype.hit = function (a, b, amount, ranged) {
    const prev = b.men, hp = b.u.hp || 1;
    // flanqueo
    const da = Math.abs(angDiff(Math.atan2(a.y - b.y, a.x - b.x), b.ang));
    let fl = 1;
    if (da > 2.1) fl = 1.6; else if (da > 1.15) fl = 1.3;
    const FA = FM(a), FB = FM(b);
    if (fl > 1 && FB.sinFlanco) fl = 1;   // el orbe no tiene flancos
    if (fl > 1) { b.flank = 1; fl *= FB.flanco; if (b.form !== 'falange' && b.papel === 'lanceros') fl *= LANCEROS_FLANCO; } // la falange es muy vulnerable por los flancos (una sola regla: la formación)
    let m = amount * RITMO * fl * (1 - FAT_PEGA * a.fat / 100);
    if (esBisono(a)) m *= 1 - (1 - BIS_PEGA) * (1 - (a.curt || 0) / BIS_CURTIDO);
    { const ea = estadoMoral(a), eb = estadoMoral(b); m *= ea === 2 ? DESORDEN_PEGA : ea === 1 ? VACILANTE_PEGA : 1; if (eb === 2) m *= DESORDEN_RECIBE; if (b.cartaFx === 'cerrada') m *= CERRADA_RECIBE; }
    if (tipoDe(b) === 'aguantar' && !b.mv) m /= AGUANTAR_DEF;
    m *= FA.pega * (ranged ? FB.proy : fl > 1 ? 1 : FB.melee) * (b.trans > 0 ? TRANS_RECIBE : 1); if (!ranged && FA.larga && a.cont > LARGA_SEG) m *= FA.larga;
    const ta = this.terrenoEn(a.x, a.y), tb = this.terrenoEn(b.x, b.y);
    m *= 1 + COLINA_PEGA * (ta.alt - tb.alt);   // arriba se pega más; el que sube pega menos
    const ac = a.u.cls, bc = b.u.cls;
    const frena = !ranged && ac === 'cav' && b.papel === 'lanceros' && fl === 1; // carga de frente contra lanceros
    if (!ranged) {
      m *= (PAPEL_ATK[a.papel] || 1) * ((DANO_MUL[DANO_TIPO[a.papel]] || {})[ARMA_TIPO[b.papel]] || 1);
    }
    let choqueMor = 0;
    if (!ranged && a.choque > 0) {
      const bosq = ta.bosque || tb.bosque, pesadoOCab = ac === 'cav' || ac === 'gen' || a.papel === 'pesada';
      if (!(bosq && pesadoOCab)) {   // el bosque quita el choque a la caballería y los pesados
        m *= FA.choque;
        if (!(a.charge > 0)) m *= CHOQUE_DANO * (a.papel === 'pesada' && a.k === 'principes' ? CHOQUE_PILUM : 1);   // la carga montada ya tiene su ×2,1: no se suma
        if (!a.choqueMor) { a.choqueMor = 1; choqueMor = CHOQUE_MORAL * (ac === 'cav' || ac === 'ele' ? 1.5 : 1) * (b.papel === 'lanceros' && fl === 1 ? CHOQUE_FRENTE_LANZA : 1) * b.morMax / 100; }
      }
    }
    if (!ranged) {
      if ((ac === 'cav' || ac === 'gen') && a.cont > CAV_MELE_SEG && !(a.choque > 0)) m *= CAV_MELE_MUL;
      if (fl === 1) m *= PAPEL_CHOQUE[b.papel] || 1;
      if (ac === 'spear' && (bc === 'cav' || bc === 'ele' || bc === 'gen')) m *= 1.7 * (a.papel === 'lanceros' && bc === 'cav' ? LANCEROS_VS_CAB : 1);
      if ((ac === 'cav' || ac === 'gen') && bc === 'spear' && fl === 1) m *= 0.6;
      if ((ac === 'cav' || ac === 'gen') && bc === 'rng') m *= 1.5;
      if (ac === 'cav' && this.ligera(b) && !frena) m *= CAB_ARROLLA;
      if (ac === 'cav' && fl > 1) m *= CAB_FLANCO;
      if (frena && a.charge > 0) { a.charge = 0; a.run = 0; a.fat = Math.min(100, a.fat + FAT_FRENADA); } // la carga se detiene: sin bonificación
      else if (a.charge > 0) m *= (ta.bosque || tb.bosque) ? 1 : 2.1;   // la carga se desordena en el bosque
    } else {
      if (bc === 'ele') m *= 1.5; // los proyectiles espantan a los elefantes
      if (tb.bosque) m *= BOSQUE_PROY;
      m *= PAPEL_PROY[b.papel] || 1; // según el papel: la ligera esquiva algo, la pesada y los lanceros aguantan
    }
    b.hp -= m;
    b.men = Math.max(0, Math.ceil(b.hp / hp));
    const killed = prev - b.men;
    b.mor -= (m / (b.max * hp)) * 100 * MOR_BAJAS * (PAPEL_MORAL[b.papel] || 1) * (fl > 1 ? 1.35 : 1) * (ac === 'ele' ? 1.25 : 1);
    b.mor -= choqueMor;
    if (killed > 0 && this.corpses.length < 700) {
      const n = Math.min(killed, 3);
      for (let i = 0; i < n; i++) this.corpses.push({ x: b.x + (this.rnd() - 0.5) * 50, y: b.y + (this.rnd() - 0.5) * 30, s: b.side });
    }
    if (b.men <= 0) { b.st = 'dead'; this.onBreak(b); }
    else if (b.mor <= 0) { b.st = 'rout'; this.onBreak(b); }
  };

  Battle.prototype.onBreak = function (b) {
    b.order = null;
    const clave = this.rondas ? this.ronda : 1 + Math.floor(this.t / RONDA_SEG);   // «ronda» también fuera del modo por rondas
    for (const o of this.regs) {
      if (o.st !== 'ok') continue;
      if (b.k === 'general' && o.side === b.side) { o.mor -= MOR_GENERAL; continue; }
      if (Math.hypot(o.x - b.x, o.y - b.y) >= CONTAGIO_DIST) continue;
      if (o.side !== b.side) { o.mor = Math.min(topeMor(o), o.mor + 1.5); continue; }
      // contagio con tope: sin reserva detrás, baja UN escalón, y como mucho una vez por ronda
      if (o.contagiado === clave || this.tieneReserva(o)) continue;
      o.contagiado = clave;
      const e = estadoMoral(o);
      const piso = e === 0 ? UMBRAL_FIRME * o.morMax - 0.01 : e === 1 ? UMBRAL_VACILA * o.morMax - 0.01 : 1;   // el escalón siguiente, sin llegar a huir
      o.mor = Math.max(1, Math.min(o.mor, Math.max(piso, o.mor - CONTAGIO_MAX * o.morMax)));   // baja hasta el siguiente escalón, pero nunca más de CONTAGIO_MAX de golpe
      this.nota(nombreReg(o) + ' se contagia del miedo de ' + nombreReg(b));
    }
    if (b.k === 'general') { if (!this.genDown[b.side] && b.side === 0 && this.rondas) this.nota('Sin general: solo ' + MANDO_PUNTOS_SIN + ' órdenes por ronda'); this.genDown[b.side] = true; }
  };

  // hostigar (ligeros y tiradores): se aparta si un enemigo cuerpo a cuerpo se acerca; si no, dispara; sin blanco, va a su sitio. Devuelve true si lo gestiona.
  Battle.prototype.hostiga = function (r, dt) {
    let cerca = null, dm = HOSTIGAR_DIST;
    for (const e of this.regs) { if (e.side === r.side || e.st !== 'ok' || e.u.cls === 'rng') continue; const d = Math.hypot(e.x - r.x, e.y - r.y); if (d < dm) { dm = d; cerca = e; } }
    if (cerca) { const dx = r.x - cerca.x, dy = r.y - cerca.y, L = Math.hypot(dx, dy) || 1; this.moveTo(r, r.x + dx / L * 30, r.y + dy / L * 30, dt, 1); return true; }
    const tgt = r.ammo > 0 ? this.pick(r, true) : null;
    if (tgt) {
      const d = Math.hypot(tgt.x - r.x, tgt.y - r.y);
      if (d <= this.rango(r) && d > CONTACT + 6) {
        this.turn(r, Math.atan2(tgt.y - r.y, tgt.x - r.x), dt); r.cd -= dt;
        if (r.cd <= 0) { r.cd = 1.6; r.ammo--; this.hit(r, tgt, effN(r.men) * ratio(r.u.ratk * r.atkMul, tgt.u.def * tgt.defMul) * 0.03 * 1.6 * 0.6 * PROY_MUL, true); this.fx.push({ x0: r.x, y0: r.y, x1: tgt.x, y1: tgt.y, t: 0, n: Math.min(6, 1 + (r.men >> 4)), k: r.k }); }
        return true;
      }
    }
    if (r.order.k === 'move') this.moveTo(r, r.order.x, r.order.y, dt, PASO_MARCHA);
    return true;
  };
  // ¿otro regimiento cubre la retirada de r? (un aliado que no se retira, delante de él y cerca)
  Battle.prototype.cubierto = function (r) {
    const dir = r.side === 0 ? 1 : -1;
    for (const q of this.regs) if (q !== r && q.side === r.side && q.st === 'ok' && q.k !== 'general' && tipoDe(q) !== 'retirarse' && (q.y - r.y) * dir < -5 && Math.hypot(q.x - r.x, q.y - r.y) <= RESERVA_DIST) return true;
    return false;
  };
  // relevar: el cansado retrocede y un aliado cercano ocupa su sitio; sin aliado, solo retrocede y queda pendiente
  Battle.prototype.relevo = function (r) {
    const o = r.order; o.hecho = true;
    if (r.fat < RELEVO_CANSADO) return;   // es quien releva (la vista ya le dio su orden)
    let par = null, pd = 150;
    for (const q of this.regs) {
      if (q === r || q.side !== r.side || q.st !== 'ok' || q.k === 'general') continue;
      if (!((q.order && q.order.tipo === 'relevar') || (!q.order && esReserva(q) && q.fat < r.fat - 10))) continue;
      const d = Math.hypot(q.x - r.x, q.y - r.y); if (d < pd) { pd = d; par = q; }
    }
    if (!par) { r.order = { k: 'move', x: r.x, y: Math.max(20, Math.min(this.H - 20, r.y + (r.side === 0 ? 1 : -1) * RELEVO_ATRAS)), tipo: 'relevar', hecho: true }; r.tgt = null; this.nota(nombreReg(r) + ' se retira a descansar; relevo pendiente: no hay reserva cerca'); return; }
    if (!(par.order && par.order.tipo === 'relevar')) { par.order = { k: 'move', x: r.x, y: r.y, tipo: 'relevar', hecho: true }; par.tgt = null; r.order = { k: 'move', x: r.x, y: Math.max(20, Math.min(this.H - 20, r.y + (r.side === 0 ? 1 : -1) * RELEVO_ATRAS)), tipo: 'relevar', hecho: true }; r.tgt = null; }
    else par.order.hecho = true;
    this.nota(nombreReg(par) + ' releva a ' + nombreReg(r));
  };
  // reagrupar (al acabar la ronda): quien huye y sigue en el campo vuelve Desordenado si su general vive y está a menos de REAGRUPA_DIST. Regla fija, sin dados.
  Battle.prototype.reagrupa = function () {
    for (const r of this.regs) {
      if (r.st !== 'rout') continue;
      const g = this.regs.find(function (q) { return q.side === r.side && q.k === 'general' && q.st === 'ok'; });
      if (!g || Math.hypot(g.x - r.x, g.y - r.y) >= REAGRUPA_DIST) continue;
      r.st = 'ok'; r.mor = Math.max(1, Math.min(topeMor(r), r.morMax * REAGRUPA_MOR)); r.order = null; r.tgt = null; r.charge = 0; r.choque = 0; r.reagrupado = (r.reagrupado || 0) + 1;
      this.nota(nombreReg(r) + ' se reagrupa junto a su general');
    }
  };

  Battle.prototype.step = function (dt) {
    if (this.over || this.fase === 'despliegue' || this.fase === 'plan') return;
    this.t += dt;
    const regs = this.regs, cur = [this.men(0), this.men(1)];
    const nAtac = {};   // (N15) cuántos regimientos cuerpo a cuerpo atacan a cada objetivo
    for (const q of regs) if (q.st === 'ok' && q.u.cls !== 'rng' && q.tgt && q.tgt.st === 'ok' && Math.hypot(q.tgt.x - q.x, q.tgt.y - q.y) <= CONTACT) nAtac[q.tgt.id] = (nAtac[q.tgt.id] || 0) + 1;
    if (this.rondas) for (const r of regs) if (r.pend && this.tRonda >= (r.pendT || ESPERA_SEG) - 1e-6) { r.order = Object.assign({}, r.pend, { cond: null }); r.pend = null; r.pendT = 0; this.aplicaForm(r); }   // «espera 10 s» o retraso de mando: ya toca avanzar
    if (this.tr.banda) for (const r of regs) if (r.st === 'ok' && !this.terrenoEn(r.x, r.y).bloq) { r.sx = r.x; r.sy = r.y; }   // última posición en suelo transitable
    // avance en bloque: ¿alguien del bando está ya cerca del enemigo? si no, todos al paso del más lento de a pie
    const cerca = [false, false], lento = [1e9, 1e9];
    for (const a of regs) {
      if (a.st !== 'ok') continue;
      if (a.u.cls !== 'cav' && a.u.cls !== 'gen') lento[a.side] = Math.min(lento[a.side], a.vel);
      if (cerca[a.side]) continue;
      for (const e of regs) if (e.side !== a.side && e.st === 'ok' && Math.hypot(e.x - a.x, e.y - a.y) < DIST_BLOQUE) { cerca[a.side] = true; break; }
    }
    const paso = (r, d) => {
      let mul = PASO_MARCHA;
      if (!r.order && !cerca[r.side] && lento[r.side] < 1e9) mul = lento[r.side] * PASO_MARCHA / r.vel;
      r.corre = false;
      if (r.u.cls === 'cav' || r.u.cls === 'gen') { if (d < DIST_CARGA_CAB) { mul = 1.25; r.corre = true; } }
      else if (d < DIST_CARGA_INF) { mul = 1; r.corre = true; }
      else if (d < DIST_TIRO && r.u.cls !== 'rng' && r.u.cls !== 'ele') mul = PASO_TIRO; // fase de tiro
      if (r.fat >= FAT_AGOTADO && r.corre) { r.corre = false; mul = Math.min(mul, 1); }   // el agotado no corre ni carga
      if (r.corre) r.tCorre = this.t;
      return mul;
    };
    for (const r of regs) {
      if (r.st === 'rout') {
        r.corre = true; r.y += (r.side === 0 ? 1 : -1) * r.vel * 1.3 * dt; r.ang = r.side === 0 ? Math.PI / 2 : -Math.PI / 2;
        if (r.y < -30 || r.y > this.H + 30) r.st = 'fled';
        continue;
      }
      if (r.st !== 'ok') continue;
      if (r.charge > 0) r.charge -= dt;
      if (r.trans > 0) r.trans = Math.max(0, r.trans - dt);
      if (r.choque > 0) r.choque -= dt;
      const collapse = cur[r.side] < this.start[r.side] * 0.15;
      if (collapse) r.mor -= 1.5 * dt;
      r.mv = false; r.corre = false;
      if (r.flank) r.mor -= MOR_FLANCO * dt;
      const mia = cur[r.side] / this.start[r.side], suya = cur[1 - r.side] / this.start[1 - r.side];
      if (mia < suya) r.mor -= MOR_PERDIENDO * Math.min(1, (suya - mia) * 8) * dt;
      const rel = cur[r.side] / Math.max(1, cur[1 - r.side]);
      if (rel < DESIGUAL_REL && r.fight > 0 && !(tipoDe(r) === 'aguantar' && !r.mv) && this.start[r.side] < this.start[1 - r.side] * 0.8) r.mor -= DESIGUAL_ACEL * (DESIGUAL_REL - rel) / DESIGUAL_REL * dt;   // (N15b) con muchos menos hombres que el rival, se hunde antes
      if (r.men < r.max && r.fight > 0) r.mor -= MOR_HERIDO * (1 - r.men / r.max) * dt;
      if (r.fat > FAT_UMBRAL) r.mor -= MOR_CANSADO * (r.fat - FAT_UMBRAL) / (100 - FAT_UMBRAL) * dt;
      if (r.mor <= 0) { r.st = 'rout'; this.onBreak(r); continue; }
      if (r.order && r.order.cond === 'aguanta' && this.cargan(r)) { r.order = { k: 'quieto' }; r.tgt = null; }   // condición: te cargan, aguanta
      { // reglas propias por tipo de orden (N4)
        const tp = tipoDe(r);
        if (tp === 'cargar' && r.fat >= FAT_AGOTADO) { r.order.tipo = 'avanzar'; this.nota(nombreReg(r) + ' está agotado y no puede cargar: avanza al paso'); }
        else if (tp === 'hostigar' && !(r.u.cls === 'rng' || (r.u.cls === 'inf' && r.u.def <= LIGERA_DEF))) { r.order.tipo = 'avanzar'; this.nota(nombreReg(r) + ' no sabe hostigar: avanza'); }
        else if (tp === 'relevar' && !r.order.hecho) this.relevo(r);
      }
      // objetivo
      let tgt = r.tgt && r.tgt.st === 'ok' ? r.tgt : null;
      const hold = (r.side === 0 && !this.auto) || (r.u.cls === 'gen' && cur[r.side] > this.start[r.side] * 0.55) || !!(r.order && r.order.k === 'quieto');
      if (r.order && r.order.k === 'atk') { if (r.order.r.st === 'ok') tgt = r.order.r; else { r.order = r.order.cond === 'nopersigue' ? { k: 'quieto' } : null; tgt = null; } }
      else if (!r.order || r.order.k === 'quieto') { r.think -= dt; if (r.think <= 0 || !tgt) { r.think = 0.5; tgt = this.pick(r, hold); } }
      else tgt = null;
      r.tgt = tgt;
      let fighting = false, fug = null;
      if (r.u.cls === 'cav' && !r.order && !(tgt && Math.hypot(tgt.x - r.x, tgt.y - r.y) <= CONTACT + 6)) fug = this.perseguido(r);
      if (fug) {
        const dd = Math.hypot(fug.x - r.x, fug.y - r.y);
        if (dd > CONTACT) this.moveTo(r, fug.x, fug.y, dt, 1.25);
        else {
          fighting = true; r.fat = Math.min(100, r.fat + FAT_PELEA * dt * 1.6); this.turn(r, Math.atan2(fug.y - r.y, fug.x - r.x), dt);
          fug.hp -= effN(r.men) * ratio(r.u.atk * r.atkMul, fug.u.def * fug.defMul) * 0.03 * dt * RITMO * PERSEGUIR_MUL * (1 - FAT_PEGA * r.fat / 100);
          const pk = fug.men; fug.men = Math.max(0, Math.ceil(fug.hp / (fug.u.hp || 1)));
          if (pk > fug.men && this.corpses.length < 700) this.corpses.push({ x: fug.x + (this.rnd() - 0.5) * 50, y: fug.y + (this.rnd() - 0.5) * 30, s: fug.side });
          if (fug.men <= 0) fug.st = 'dead';
        }
      } else if (tipoDe(r) === 'hostigar' && this.hostiga(r, dt)) {
        // dispara y se aparta (ver hostiga)
      } else if (r.order && r.order.k === 'move') {
        const ret = tipoDe(r) === 'retirarse';
        if (ret && !this.cubierto(r)) for (const e of regs) if (e.side !== r.side && e.st === 'ok' && e.u.cls !== 'rng' && Math.hypot(e.x - r.x, e.y - r.y) < RETIRADA_DIST) { this.hit(e, r, effN(e.men * (e.u.mass || 1)) * ratio(e.u.atk * e.atkMul, r.u.def * r.defMul) * 0.03 * dt * RETIRADA_CASTIGO, false); break; }
        if (r.order && this.moveTo(r, r.order.x, r.order.y, dt, ret ? 1 : PASO_MARCHA) < 6 && r.order) { if (r.order.ang != null) r.angObj = r.order.ang; r.order = r.order.cond === 'nopersigue' ? { k: 'quieto' } : null; }
      } else if (tgt) {
        const d = Math.hypot(tgt.x - r.x, tgt.y - r.y);
        // el tirador sin orden no pasa de unos 55 por detrás de su infantería más adelantada
        let tx = tgt.x, ty = tgt.y, quieto = !!(r.order && r.order.k === 'quieto');
        if (r.u.cls === 'rng' && !r.order && d > DIST_ENCIMA) {
          const sc = this.pantalla(r);
          if (sc) { const lim = sc.y + (r.side === 0 ? DIST_TIRADOR : -DIST_TIRADOR); if (r.side === 0 ? r.y <= lim : r.y >= lim) quieto = true; else ty = r.side === 0 ? Math.max(ty, lim) : Math.min(ty, lim); }
        }
        if (r.ammo > 0 && d > CONTACT + 6) {
          if (d <= this.rango(r)) {
            this.turn(r, Math.atan2(tgt.y - r.y, tgt.x - r.x), dt);
            r.cd -= dt;
            if (r.cd <= 0) {
              r.cd = 1.6; r.ammo--;
              this.hit(r, tgt, effN(r.men) * ratio(r.u.ratk * r.atkMul, tgt.u.def * tgt.defMul) * 0.03 * 1.6 * 0.6 * PROY_MUL, true);
              this.fx.push({ x0: r.x, y0: r.y, x1: tgt.x, y1: tgt.y, t: 0, n: Math.min(6, 1 + (r.men >> 4)), k: r.k });
            }
          } else if (!quieto) this.moveTo(r, tx, ty, dt, paso(r, d));
          else this.turn(r, Math.atan2(tgt.y - r.y, tgt.x - r.x), dt);
        } else if (d > CONTACT) {
          const left = quieto ? 1e9 : this.moveTo(r, tx, ty, dt, paso(r, d));
          if (left <= CONTACT && (r.u.cls === 'cav' || r.u.cls === 'gen' || r.u.cls === 'ele') && r.run > 90 && r.fat < FAT_AGOTADO) { r.charge = 2.5; r.fat = Math.min(100, r.fat + FAT_CARGA * (r.u.cls === 'cav' || r.u.cls === 'gen' ? 1.8 : r.u.cls === 'ele' ? 1.2 : 1)); }
        } else {
          if (r.fight <= 0) { r.cont = 0; r.choqueMor = 0; if (r.charge > 0 || (this.t - r.tCorre < CHOQUE_RECIENTE && (r.u.cls !== 'inf' && r.u.cls !== 'spear' || tipoDe(r) === 'cargar'))) r.choque = CHOQUE_SEG; }   // contacto nuevo: ¿es un choque?
          r.cont += dt; if (r.bis && r.u.cls !== 'rng') r.curt = Math.min(BIS_CURTIDO, (r.curt || 0) + dt);
          fighting = true; r.run = 0; r.fat = Math.min(100, r.fat + FAT_PELEA * dt * FM(r).fat * (r.u.cls === 'cav' || r.u.cls === 'gen' ? 1.6 : 1 / Math.sqrt(r.u.mass || 1)));
          { const dh = this.terrenoEn(tgt.x, tgt.y).alt - this.terrenoEn(r.x, r.y).alt; if (dh > 0) r.fat = Math.min(100, r.fat + FAT_CUESTA * dh * dt); }   // ataca cuesta arriba
          this.turn(r, Math.atan2(tgt.y - r.y, tgt.x - r.x), dt);
          // solo pelea el frente: las filas de atrás no pegan (el relevo es implícito al bajar el número)
          const frente = Math.min(1, frenteHombres(r) / Math.max(1, r.men)) * Math.min(1, ATAC_MAX / Math.max(1, nAtac[tgt.id] || 1));
          this.hit(r, tgt, effN(r.men * (r.u.mass || 1)) * frente * ratio(r.u.atk * r.atkMul, tgt.u.def * tgt.defMul) * 0.03 * dt, false);
          if (r.charge > 0 && r.u.cls === 'cav' && this.ligera(tgt)) { const dx = tgt.x - r.x, dy = tgt.y - r.y, dl = Math.hypot(dx, dy) || 1; tgt.x += dx / dl * EMPUJE_CAB * dt; tgt.y += dy / dl * EMPUJE_CAB * dt; }
        }
      }
      { // (N7) columna de marcha, ángulo de frente pedido y fin de la marcha agrupada
        const col = r.mv && !fighting && r.form === 'normal' && !this.enemigoCerca(r, COL_DIST);
        r.columna = col;
        if (r.angObj != null) { if (r.mv || fighting) r.angObj = null; else { this.turn(r, r.angObj, dt); if (Math.abs(angDiff(r.angObj, r.ang)) < 0.02) r.angObj = null; } }
        if (r.agrupado && !(r.order && r.order.vmax)) r.agrupado = false;
      }
      if (!fighting && !r.mv) r.fat = Math.max(0, r.fat - FAT_DESCANSO * dt);
      r.fight = fighting ? 0.4 : Math.max(0, r.fight - dt);
      if (!fighting && r.fight <= 0) { r.mor = Math.min(topeMor(r), r.mor + 1.5 * dt); r.flank = 0; r.cont = 0; }
      r.x = Math.max(20, Math.min(this.W - 20, r.x)); r.y = Math.max(20, Math.min(this.H - 20, r.y));
    }
    // separación entre regimientos amigos
    for (let i = 0; i < regs.length; i++) {
      const a = regs[i]; if (a.st !== 'ok') continue;
      for (let j = i + 1; j < regs.length; j++) {
        const b = regs[j]; if (b.st !== 'ok' || b.side !== a.side) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < 56) { const p = (56 - d) * 0.5 * Math.min(1, dt * 6), nx = d > 0.01 ? dx / d : 1, ny = d > 0.01 ? dy / d : 0; a.x -= nx * p; a.y -= ny * p; b.x += nx * p; b.y += ny * p; }
      }
    }
    if (this.tr.banda) for (const r of regs) if (r.st === 'ok' && r.sx != null && this.terrenoEn(r.x, r.y).bloq) { r.x = r.sx; r.y = r.sy; }   // empujones: nadie acaba en el agua ni en la roca
    for (const f of this.fx) f.t += dt;
    if (this.fx.length && this.fx[0].t > 0.5) this.fx = this.fx.filter(f => f.t <= 0.5);
    const n0 = this.men(0), n1 = this.men(1);
    if (n0 <= 0 || n1 <= 0) { this.over = true; this.winner = n0 > 0 ? 0 : 1; }
    else if (this.obj) this.chequeaObjetivo(dt);
    if (!this.over && this.t > TOPE_BATALLA) { this.over = true; this.winner = this.cfg.defender; }
    if (this.rondas && this.fase === 'ejecucion') { this.tRonda += dt; if (!this.over && this.tRonda >= RONDA_SEG - 1e-6) this.finRonda(); }
  };

  /* ---------- Rondas (N2) ---------- */
  Battle.CONDICIONES = CONDICIONES; Battle.MANDO_RADIO = MANDO_RADIO; Battle.MANDO_RETRASO = MANDO_RETRASO; Battle.CARTAS = CARTAS; Battle.RONDA_SEG = RONDA_SEG;
  // ¿lo cargan? un enemigo que corre o carga, cerca
  Battle.prototype.cargan = function (r) {
    for (const e of this.regs) if (e.side !== r.side && e.st === 'ok' && (e.charge > 0 || e.corre) && Math.hypot(e.x - r.x, e.y - r.y) < DIST_CARGAN) return true;
    return false;
  };
  // foto completa del estado (orden y objetivo por índice): sirve para clonar, prever y repetir la ronda
  Battle.prototype.estado = function () {
    const idx = new Map(); this.regs.forEach(function (r, i) { idx.set(r, i); });
    const ref = function (o) { return o ? Object.assign({}, o, 'r' in o ? { r: idx.get(o.r) } : {}) : null; };
    return { t: this.t, rnd: this.rnd.estado(), fase: this.fase, ronda: this.ronda, tRonda: this.tRonda, over: this.over, winner: this.winner, auto: this.auto, genDown: this.genDown.slice(), cartas: this.cartas.slice(), cartaPlan: this.cartaPlan, cartaRonda: this.cartaRonda, start: this.start.slice(), ia: this.ia ? JSON.parse(JSON.stringify(this.ia)) : null, gesto: this.gesto, obj: this.obj ? JSON.parse(JSON.stringify(this.obj)) : null,
      corpses: this.corpses.map(function (c) { return Object.assign({}, c); }), fx: this.fx.map(function (f) { return Object.assign({}, f); }),
      regs: this.regs.map(function (r) { const c = Object.assign({}, r); c.tgt = r.tgt ? idx.get(r.tgt) : null; c.order = ref(r.order); c.pend = ref(r.pend); return c; }) };
  };
  // vuelve a un estado guardado SIN cambiar la identidad de los regimientos (la vista 3D los tiene agarrados)
  Battle.prototype.aplicar = function (e) {
    const regs = this.regs, ref = function (o) { return o ? Object.assign({}, o, 'r' in o ? { r: regs[o.r] } : {}) : null; };
    e.regs.forEach(function (c, i) { Object.assign(regs[i], c); regs[i].tgt = c.tgt == null ? null : regs[c.tgt]; regs[i].order = ref(c.order); regs[i].pend = ref(c.pend); });
    this.t = e.t; this.rnd.fija(e.rnd); this.fase = e.fase; this.ronda = e.ronda; this.tRonda = e.tRonda; this.over = e.over; this.winner = e.winner; this.auto = e.auto;
    this.cartas = e.cartas.slice(); this.cartaPlan = e.cartaPlan; this.cartaRonda = e.cartaRonda; this.genDown = e.genDown.slice(); this.start = e.start.slice(); this.ia = e.ia ? JSON.parse(JSON.stringify(e.ia)) : null; this.gesto = e.gesto || ''; this.obj = e.obj ? JSON.parse(JSON.stringify(e.obj)) : null; this.corpses = e.corpses.map(function (c) { return Object.assign({}, c); }); this.fx = e.fx.map(function (f) { return Object.assign({}, f); });
  };
  // copia independiente (comparte solo lo que no cambia: configuración, terreno, fichas de unidad)
  Battle.prototype.clona = function () {
    const c = Object.create(Battle.prototype); Object.assign(c, this);
    c.regs = this.regs.map(function (r) { return Object.assign({}, r); }); c.rnd = mkRng(1); c.snapIni = null; c.snapFin = null; c.repite = false; c.hechos = []; c.notas = [];
    c.aplicar(this.estado()); return c;
  };
  // da (o quita) la condición de la orden de un regimiento propio: 'aguanta' | 'nopersigue' | 'espera' | null
  Battle.prototype.condicion = function (r, c) {
    if (!r || r.side !== 0 || r.st !== 'ok' || this.fase === 'ejecucion' || !r.order || r.order.k === 'quieto') return false;
    if (c && !CONDICIONES[c]) return false;
    r.order.cond = c || null; return true;
  };
  // empieza la ronda de ejecución (desde el plan)
  Battle.prototype.ejecutar = function () {
    if (!this.rondas || this.fase !== 'plan' || this.over) return false;
    if (this.cfg.relevoAuto === true || (this.cfg.relevoAuto !== false && this.auto && !this.manual && !this.regs.some(q => q.side === 0 && q.order))) this.autoRelevo(0);   // (N7) relevo automático del jugador (opcional)
    const mp = this.mandoPuntos();
    if (mp.usados > mp.max) { this.motivo = 'Tienes ' + mp.usados + ' órdenes y solo ' + mp.max + ' puntos de mando'; return false; }
    const g = this.generalVivo(0);
    for (const r of this.regs) {
      r.pend = null; r.pendT = 0; r.cartaFx = null;
      if (r.st !== 'ok' || !r.order) continue;
      if (r.order.cond === 'espera') { r.pend = r.order; r.pendT = ESPERA_SEG; r.order = { k: 'quieto' }; }
      if (g && r.side === 0 && r !== g && (r.order.k !== 'quieto' || r.order.tipo === 'formar') && this.fueraDeMando(r, g)) { if (!r.pend) r.pend = r.order; r.pendT = Math.max(r.pendT, MANDO_RETRASO); r.order = { k: 'quieto' }; }
    }
    if (this.cartaPlan && g) {   // la carta jugada en el plan se aplica a los propios dentro del radio
      for (const r of this.regs) if (r.side === 0 && r.st === 'ok' && !this.fueraDeMando(r, g)) { r.cartaFx = this.cartaPlan; if (this.cartaPlan === 'arenga') r.mor = Math.min(topeMor(r), r.mor + ARENGA_MORAL * r.morMax); }
    }
    this.cartaPlan = null;
    if (this.ia && !this.sinIA) this.iaRonda(); else if (!this.ia) this.gesto = '';
    for (const r of this.regs) if (r.st === 'ok' && r.order && r.order.form) this.aplicaForm(r);
    this.snapIni = this.estado(); this.notas = []; this.fase = 'ejecucion'; this.tRonda = 0; this.repite = false; return true;
  };
  Battle.prototype.generalVivo = function (side) { return this.regs.find(function (q) { return q.side === side && q.k === 'general' && q.st === 'ok'; }) || null; };
  Battle.prototype.fueraDeMando = function (r, g) { return Math.hypot(g.x - r.x, g.y - r.y) > MANDO_RADIO; };
  // puntos de mando del bando 0: cada regimiento vivo con orden activa (no «Aguantar») gasta uno
  Battle.prototype.mandoPuntos = function () {
    const max = this.generalVivo(0) ? MANDO_PUNTOS : MANDO_PUNTOS_SIN;
    let usados = 0; for (const r of this.regs) if (r.side === 0 && r.st === 'ok' && r.order && (r.order.k !== 'quieto' || r.order.tipo === 'formar')) usados++;
    return { usados: usados, max: max, libres: max - usados };
  };
  // carta de táctica en el plan: se aplica en la ronda que sigue. Una por ronda, solo con el general vivo.
  Battle.prototype.jugarCarta = function (id) {
    if (!this.rondas || this.fase !== 'plan' || this.over || !this.generalVivo(0)) return false;
    const i = this.cartas.indexOf(id); if (i < 0 || this.cartaRonda === this.ronda) return false;
    this.cartas.splice(i, 1); this.cartaPlan = id; this.cartaRonda = this.ronda; return true;
  };
  // acaba la ronda: vuelve el plan y se apuntan los hechos. Si era una repetición, se restablece el final guardado.
  Battle.prototype.finRonda = function () {
    if (this.repite) { this.aplicar(this.snapFin); this.repite = false; return; }
    for (const r of this.regs) { if (r.pend) { r.order = Object.assign({}, r.pend, { cond: null }); r.pend = null; } r.pendT = 0; r.cartaFx = null; }
    if (this.ia) { this.ia.fotos.unshift(this.iaFoto()); this.ia.fotos.length = Math.min(2, this.ia.fotos.length); }
    this.hechos = this.cronica(); this.fase = 'plan'; this.ronda++; this.tRonda = 0;
    if (this.obj && !this.over) this.chequeaObjetivo(0);   // las rondas aguantadas cuentan al cerrar cada una
    this.snapFin = this.estado();
  };
  // «Ver otra vez»: vuelve al inicio de la ronda terminada y la repite igual (la simulación es determinista)
  Battle.prototype.repetir = function () {
    if (!this.rondas || this.fase !== 'plan' || !this.snapIni || !this.snapFin || this.over) return false;
    this.aplicar(this.snapIni); this.fase = 'ejecucion'; this.repite = true; return true;
  };
  // dos o tres hechos de la ronda que acaba de pasar
  Battle.prototype.cronica = function () {
    const ini = this.snapIni, nom = [this.cfg.sides[0].name, this.cfg.sides[1].name], baj = [0, 0], rotos = [], caidos = [];
    this.regs.forEach(function (r, i) {
      const a = ini.regs[i]; if (r.k === 'general') { if (a.st === 'ok' && r.st === 'dead') caidos.push(r); return; }
      baj[r.side] += a.men - r.men;
      if (a.st === 'ok' && (r.st === 'rout' || r.st === 'fled' || r.st === 'dead')) rotos.push(r);
    });
    const h = [], n = function (r) { return (r.name || r.u.n) + ' (' + nom[r.side] + ')'; };
    h.push('Bajas: ' + nom[0] + ' ' + baj[0] + ', ' + nom[1] + ' ' + baj[1] + '.');
    if (caidos.length) h.push('Cae el general de ' + nom[caidos[0].side] + '.');
    else if (rotos.length) h.push(rotos.slice(0, 2).map(n).join(' y ') + (rotos.length > 1 ? ' rompen filas' : ' rompe filas') + (rotos.length > 2 ? ' (y ' + (rotos.length - 2) + ' más)' : '') + '.');
    else h.push('Ningún regimiento cede: las líneas aguantan.');
    this.reagrupa();
    for (const t of this.notas.slice(0, 4)) h.push(t);
    this.notas = [];
    h.push('Quedan ' + this.men(0) + ' hombres contra ' + this.men(1) + '.');
    return h;
  };
  // vista previa («sombra»): clona la batalla, deja al enemigo QUIETO y simula la ronda. No toca la batalla real.
  // Con un array de segundos ([10,20,30]) devuelve [{t, sombras}] con UNA sola simulación; sin argumento, las sombras del final de la ronda.
  Battle.prototype.prevision = function (tiempos) {
    const c = this.clona(); c.rondas = true; c.fase = 'plan'; c.sinIA = true;
    for (const r of c.regs) if (r.side === 1 && r.st === 'ok') r.order = { k: 'quieto' };
    const foto = function () { return c.regs.filter(function (r) { return r.side === 0; }).map(function (r) { return { id: r.id, x: r.x, y: r.y, st: r.st, men: r.men }; }); };
    const ts = Array.isArray(tiempos) ? tiempos.map(function (t) { return Math.max(0, Math.min(RONDA_SEG, +t || 0)); }).sort(function (a, b) { return a - b; }) : null, out = [];
    c.ejecutar(); let n = 0, i = 0;
    while (c.fase === 'ejecucion' && !c.over && n++ < 400) {
      c.step(0.1);
      if (ts) while (i < ts.length && c.tRonda >= ts[i] - 1e-6) out.push({ t: ts[i++], sombras: foto() });
    }
    if (ts) { while (i < ts.length) out.push({ t: ts[i++], sombras: foto() }); return out; }
    return foto();
  };
  // «prever choque»: si los dos ejércitos chocaran ya (sin órdenes), ¿quién gana? Devuelve fracciones de hombres que conserva cada bando.
  Battle.prototype.preverChoque = function () {
    const c = this.clona(); c.rondas = false; c.fase = 'lucha'; c.auto = true;
    for (const r of c.regs) { r.order = null; r.pend = null; r.tgt = null; }
    let n = 0; while (!c.over && n++ < 2000) c.step(0.2);
    const s0 = Math.max(1, this.men(0)), s1 = Math.max(1, this.men(1)), f0 = c.men(0) / s0, f1 = c.men(1) / s1;
    return { f0: f0, f1: f1, gana: f0 === f1 ? -1 : f0 > f1 ? 0 : 1, claro: Math.abs(f0 - f1) > 0.2 };
  };


  /* ---------- N7: formaciones, anchos de frente, columnas, tres líneas y atajos (solo lógica) ---------- */
  Battle.FORM = FORM; Battle.FORMA_BASE = FORMA_BASE;
  const redond = function (x) { return Math.round(x * 10) / 10; };
  // ¿hay un enemigo en pie a menos de d?
  Battle.prototype.enemigoCerca = function (r, d) { for (const e of this.regs) if (e.side !== r.side && e.st === 'ok' && Math.hypot(e.x - r.x, e.y - r.y) < d) return true; return false; };
  // anchos válidos (en columnas de hombres) de un regimiento de n hombres
  function limitesFiles(r, n) {
    const B = FORMA_BASE[r.papel] || FORMA_BASE.media, maxFondo = r.papel === 'elefante' ? 2 : B.fondo * 4, minFondo = (r.papel === 'ligera' || r.papel === 'tirador' || r.papel === 'jinete' || r.papel === 'elefante') ? 1 : 2;
    const lo = Math.max(1, Math.ceil(n / maxFondo)); return [lo, Math.max(lo, Math.min(n, Math.floor(n / minFondo)))];
  }
  // dimensiones en metros de un regimiento: {ancho, fondo, sep, files, col}. El 3D coloca las figuras con esto.
  Battle.forma = function (r, men) {
    const F = FORM[r.form] || FORM.normal, B = FORMA_BASE[r.papel] || FORMA_BASE.media, n = Math.max(1, men || r.men), col = !!r.columna;
    const sep = B.sep * (col ? 1.2 : F.sep);
    let files;
    if (col) files = Math.max(2, Math.min(n, Math.round(Math.sqrt(n) * 0.5)));
    else if (F.cuad) files = Math.max(1, Math.ceil(Math.sqrt(n)));
    else if (r.frente && r.frente.ancho > 0) { const lim = limitesFiles(r, n); files = Math.max(lim[0], Math.min(lim[1], Math.round(r.frente.ancho / sep))); }
    else files = Math.max(1, Math.ceil(n / Math.max(1, Math.round(B.fondo * F.fondo))));
    return { ancho: redond(files * sep), fondo: Math.ceil(n / files), sep: redond(sep), files: files, col: col };
  };
  // ancho (m) que tendría en formación normal sin frente fijado, con el efectivo inicial: referencia del tope de atacantes
  function anchoRef(r) { const B = FORMA_BASE[r.papel] || FORMA_BASE.media, n = Math.max(1, r.max || r.men); return Math.ceil(n / Math.max(1, B.fondo)) * B.sep; }
  // hombres que pelean a la vez (N15 + N7): sigue a la formación y al ancho fijado por el jugador
  function frenteHombres(r) {
    let k = FM(r).frente;
    if (r.frente && r.frente.ancho > 0 && !r.columna) { const f = Battle.forma(r, r.max || r.men); k *= (f.ancho / anchoRef(r)); }
    return FRENTE_HOMBRES * k;
  }
  Battle.frenteHombres = frenteHombres;
  // recorta un ancho pedido a lo que admite el regimiento (con su formación actual)
  Battle.prototype.anchoValido = function (r, ancho) {
    const B = FORMA_BASE[r.papel] || FORMA_BASE.media, F = FM(r), sep = B.sep * F.sep, lim = limitesFiles(r, Math.max(1, r.max || r.men));
    return redond(Math.max(lim[0], Math.min(lim[1], Math.round(ancho / sep))) * sep);
  };

  // ¿puede el jugador (o la IA) dar una orden más a r? Los puntos de mando se gastan como en cualquier orden (ver mandoPuntos)
  Battle.prototype.cupo = function (r) {
    if (r.order && (r.order.k !== 'quieto' || r.order.tipo === 'formar')) return true;   // ya gasta su punto: se sustituye
    let libres;
    if (r.side === 0) libres = this.mandoPuntos().libres;
    else { let u = 0; for (const q of this.regs) if (q.side === r.side && q.st === 'ok' && q.order && (q.order.k !== 'quieto' || q.order.tipo === 'formar')) u++; libres = (this.generalVivo(r.side) ? MANDO_PUNTOS : MANDO_PUNTOS_SIN) - u; }
    if (libres < 1) { this.motivo = 'No quedan puntos de mando'; return false; }
    return true;
  };
  Battle.prototype.puedeOrdenar = function (r) {
    this.motivo = '';
    if (!r || r.st !== 'ok' || this.over) { this.motivo = 'Ese regimiento ya no puede recibir órdenes'; return false; }
    if (this.rondas && this.fase === 'ejecucion') { this.motivo = 'Las órdenes se dan en el plan, no durante la ronda'; return false; }
    return true;
  };
  // formaciones que admite un regimiento (siempre 'normal')
  Battle.prototype.formacionesPosibles = function (r) {
    const out = ['normal']; if (!r || r.st !== 'ok') return out;
    if (r.k === 'general' || r.u.cls === 'gen') { if (FORM.cuna.papeles.indexOf(r.papel) >= 0) out.push('cuna'); return out; }   // (N15b) el general también puede ir en cuña
    for (const k of Object.keys(FORM)) if (k !== 'normal' && FORM[k].papeles.indexOf(r.papel) >= 0) out.push(k);
    return out;
  };
  // pone la formación vigente (con el cambio de ritmo y vulnerabilidad de la transición)
  Battle.prototype.aplicaForm = function (r) {
    const o = r.order || null, f = o && o.form; if (!f || !FORM[f]) return;
    delete o.form; if (o.tipo === 'formar') r.order = null;   // la orden «formar» no tiene más propósito: libera su punto de mando
    if (r.form === f) return;
    r.form = f; r.trans = FORM[f].t; r.columna = false;
  };
  // orden «adoptar formación»: es una orden normal del plan (gasta un punto de mando si el regimiento no tenía otra)
  Battle.prototype.ponerFormacion = function (r, clave) {
    if (!this.puedeOrdenar(r)) return false;
    if (!FORM[clave] || this.formacionesPosibles(r).indexOf(clave) < 0) { this.motivo = (FORM[clave] ? FORM[clave].n : 'Esa formación') + ' no es para ' + nombreReg(r); return false; }
    if (this.fase === 'despliegue' || (!this.rondas && this.fase !== 'plan')) { if (r.form !== clave) { r.form = clave; r.trans = this.fase === 'despliegue' ? 0 : FORM[clave].t; } return true; }
    if (!r.order && r.form === clave) return true;
    if (!this.cupo(r)) return false;
    if (r.order) { if (r.order.form === clave) return true; r.order = Object.assign({}, r.order, { form: clave }); }
    else r.order = { k: 'quieto', tipo: 'formar', form: clave };
    return true;
  };
  // orden de mover que además fija el ancho y el ángulo del frente
  Battle.prototype.fijarFrente = function (r, o) {
    if (!this.puedeOrdenar(r)) return false;
    o = o || {}; const W = this.W, H = this.H;
    const x = Math.max(20, Math.min(W - 20, o.x == null ? r.x : o.x)), y = Math.max(20, Math.min(H - 20, o.y == null ? r.y : o.y));
    const ang = o.ang == null ? null : o.ang, ancho = o.ancho > 0 ? this.anchoValido(r, o.ancho) : (r.frente ? r.frente.ancho : null);
    if (this.fase === 'despliegue') { if (r.side === 0 && this.colocar) this.colocar(r, x, y); if (ang != null) r.ang = ang; if (ancho) r.frente = { ancho: ancho }; return true; }
    if (!this.cupo(r)) return false;
    if (ancho) r.frente = { ancho: ancho };
    r.order = { k: 'move', x: x, y: y, tipo: 'frente', ang: ang, ancho: ancho }; r.tgt = null;
    return true;
  };

  // marcha agrupada: todos llegan juntos al ritmo del más lento (esperan a los rezagados)
  Battle.prototype.agrupar = function (regs) {
    this.motivo = '';
    const lista = (regs || []).filter(r => r && r.st === 'ok' && r.k !== 'general'); if (lista.length < 2) { this.motivo = 'Hacen falta al menos dos regimientos'; return 0; }
    if (!this.puedeOrdenar(lista[0])) return 0;
    const enem = this.regs.filter(e => e.side !== lista[0].side && e.st === 'ok'), plan = [];
    for (const r of lista) {
      let x, y, o = r.order;
      if (o && o.k === 'move') { x = o.x; y = o.y; }
      else if (o && o.k === 'atk' && o.r.st === 'ok') { x = o.r.x; y = o.r.y; }
      else { const ne = ia_cerca(enem, r.x, r.y); if (!ne) continue; const d = Math.hypot(ne.x - r.x, ne.y - r.y) || 1, avance = Math.max(0, d - 100); x = r.x + (ne.x - r.x) / d * avance; y = r.y + (ne.y - r.y) / d * avance; }
      if (!(o && o.k !== 'quieto') && !this.cupo(r)) continue;
      const v = r.vel * FM(r).vel * PASO_MARCHA;
      plan.push({ r: r, x: Math.max(20, Math.min(this.W - 20, x)), y: Math.max(20, Math.min(this.H - 20, y)), d: Math.hypot(x - r.x, y - r.y), v: v });
    }
    if (plan.length < 2) return 0;
    let T = 0; for (const p of plan) T = Math.max(T, p.d / p.v);
    const id = (this.grupoN = (this.grupoN || 0) + 1);
    for (const p of plan) {
      const vmax = T > 0 ? Math.max(1, p.d / T) : p.v, r = p.r;
      r.order = r.order && r.order.k === 'atk' ? Object.assign({}, r.order, { vmax: vmax, grupo: id }) : Object.assign({}, r.order && r.order.k === 'move' ? r.order : { tipo: 'avanzar' }, { k: 'move', x: p.x, y: p.y, vmax: vmax, grupo: id });
      r.tgt = null; r.agrupado = true;
    }
    return plan.length;
  };

  // relevo entre dos regimientos: el cansado (r) retrocede y el fresco (par) ocupa su sitio; intercambian línea
  Battle.prototype.relevarPar = function (r, par) {
    if (!this.cupo(r)) return false;
    if (!(par.order && (par.order.k !== 'quieto' || par.order.tipo === 'formar')) && !this.cupo(par)) return false;
    const atras = Math.max(20, Math.min(this.H - 20, r.y + (r.side === 0 ? 1 : -1) * RELEVO_ATRAS));
    par.order = { k: 'move', x: r.x, y: r.y, tipo: 'relevar', hecho: true }; par.tgt = null;
    r.order = { k: 'move', x: r.x, y: atras, tipo: 'relevar', hecho: true }; r.tgt = null;
    const l = r.linea; r.linea = par.linea; par.linea = l;
    this.nota(nombreReg(par) + ' releva a ' + nombreReg(r));
    return true;
  };
  // manda a la línea n a ceder el frente por los huecos a la línea n+1; devuelve cuántos regimientos de la línea n se relevan
  Battle.prototype.relevarLinea = function (side, n) {
    this.motivo = '';
    if (this.rondas && this.fase === 'ejecucion') { this.motivo = 'Las órdenes se dan en el plan'; return 0; }
    const A = this.regs.filter(q => q.side === side && q.st === 'ok' && q.linea === n).sort((a, b) => b.fat - a.fat), usados = new Set(); let hechos = 0;
    const B = this.regs.filter(q => q.side === side && q.st === 'ok' && q.linea === n + 1);
    if (!A.length || !B.length) { this.motivo = 'No hay línea ' + (n + 1) + ' que releve a la ' + n; return 0; }
    for (const r of A) {
      let par = null, pd = 1e9; for (const q of B) { if (usados.has(q)) continue; const d = Math.hypot(q.x - r.x, q.y - r.y); if (d < pd) { pd = d; par = q; } }
      if (!par) break; if (!this.relevarPar(r, par)) break; usados.add(par); hechos++;
    }
    return hechos;
  };
  // relevo automático: la línea 1 Cansada o Vacilante cede a la línea 2 Fresca
  Battle.prototype.autoRelevo = function (side) {
    if (this.over) return 0;
    const cans = this.regs.filter(q => q.side === side && q.st === 'ok' && q.linea === 1 && (q.fat >= RELEVO_CANSADO || estadoMoral(q) >= 1) && !(q.order && q.order.tipo === 'relevar'));
    const frescos = this.regs.filter(q => q.side === side && q.st === 'ok' && q.linea === 2 && q.fat < 30 && estadoMoral(q) === 0 && !(q.order && q.order.tipo === 'relevar'));
    let n = 0; const usados = new Set();
    for (const r of cans.sort((a, b) => b.fat - a.fat)) {
      let par = null, pd = 1e9; for (const q of frescos) { if (usados.has(q)) continue; const d = Math.hypot(q.x - r.x, q.y - r.y); if (d < pd) { pd = d; par = q; } }
      if (!par || !this.relevarPar(r, par)) break; usados.add(par); n++;
    }
    return n;
  };

  // atajos de un toque: 'testudo' | 'carga' | 'retirada' | 'refuerzo' → {n, txt} o null
  Battle.prototype.atajo = function (tipo, regs) {
    this.motivo = '';
    const lista = (regs || []).filter(r => r && r.st === 'ok' && r.k !== 'general'); if (!lista.length) { this.motivo = 'Elige algún regimiento'; return null; }
    const lado = lista[0].side, enem = this.regs.filter(e => e.side !== lado && e.st === 'ok');
    let n = 0, txt = '';
    if (tipo === 'testudo') {
      for (const r of lista) if (this.formacionesPosibles(r).indexOf('testudo') >= 0 && this.ponerFormacion(r, 'testudo')) n++;
      if (!n) { if (!this.motivo) this.motivo = 'Ninguno puede formar testudo'; return null; }
      txt = n === 1 ? 'Un regimiento cierra la testudo' : n + ' regimientos cierran la testudo';
    } else if (tipo === 'carga') {
      if (!enem.length) { this.motivo = 'No hay enemigo'; return null; }
      if (!this.puedeOrdenar(lista[0])) return null;
      for (const r of lista) {
        if (r.u.cls === 'rng' || !this.cupo(r)) continue;
        const ne = ia_cerca(enem, r.x, r.y), blandos = r.u.cls === 'cav' || r.u.cls === 'gen' ? enem.filter(e => e.u.cls === 'rng' || (e.u.cls === 'inf' && e.papel === 'ligera')) : [];
        r.order = { k: 'atk', r: ia_cerca(blandos, r.x, r.y) || ne, tipo: 'cargar' }; r.tgt = null; n++;
      }
      if (!n) { if (!this.motivo) this.motivo = 'Nadie puede cargar'; return null; }
      txt = n === 1 ? 'Un regimiento carga' : n + ' regimientos cargan';
    } else if (tipo === 'retirada') {
      if (!this.puedeOrdenar(lista[0])) return null;
      for (const r of lista) {
        if (!this.cupo(r)) continue;
        r.order = { k: 'move', x: Math.max(20, Math.min(this.W - 20, r.x)), y: Math.max(20, Math.min(this.H - 20, r.y + (r.side === 0 ? 90 : -90))), tipo: 'retirarse' }; r.tgt = null; n++;
      }
      if (!n) { if (!this.motivo) this.motivo = 'Nadie puede retirarse'; return null; }
      txt = n === 1 ? 'Un regimiento se retira' : n + ' regimientos se retiran';
    } else if (tipo === 'refuerzo') {
      if (!this.puedeOrdenar(lista[0])) return null;
      const peor = lista.slice().sort((a, b) => (a.men / a.max + a.mor / a.morMax) - (b.men / b.max + b.mor / b.morMax))[0], dir = lado === 0 ? 1 : -1;
      let par = null, pd = 1e9;
      for (const q of this.regs) {
        if (q === peor || q.side !== lado || q.st !== 'ok' || q.k === 'general' || q.u.cls === 'rng' || lista.indexOf(q) >= 0) continue;
        if ((q.y - peor.y) * dir <= 8 || (q.order && q.order.k !== 'quieto') || q.fat >= peor.fat) continue;
        const d = Math.hypot(q.x - peor.x, q.y - peor.y); if (d < pd) { pd = d; par = q; }
      }
      if (!par) { this.motivo = 'No hay reserva detrás'; return null; }
      if (!this.relevarPar(peor, par)) return null;
      n = 1; txt = nombreReg(par) + ' releva a ' + nombreReg(peor);
    } else { this.motivo = 'Atajo desconocido'; return null; }
    return { n: n, txt: txt };
  };

  /* ---------- N6: el enemigo que piensa (solo modo por rondas) ---------- */
  // Plan elegido antes de la ronda 1; un gesto visible al empezar cada ronda; órdenes reales con puntos, radio y cartas como el jugador.
  // Sin trampas: decide con la FOTO de posiciones (la del final de la ronda anterior; dos rondas atrás en Fácil), nunca con las órdenes del jugador.
  const PLANES = { centro: 'Centro fuerte', alas: 'Envolver por las alas', cerro: 'Defender el cerro', emboscar: 'Emboscar', hostigar: 'Hostigar y huir' };
  const PLAN_ORDEN = ['centro', 'alas', 'cerro', 'emboscar', 'hostigar'];
  // margen: pérdida relativa (frente al jugador) que lo hace replegarse; piso: fracción de hombres bajo la cual se repliega siempre
  const CARACTER = {
    equilibrado: { n: 'Equilibrado', bono: {}, margen: 0.15, piso: 0.45 },
    astuto: { n: 'Astuto', bono: { emboscar: 2.6, alas: 1.2 }, margen: 0.08, piso: 0.4, finta: true },
    impetuoso: { n: 'Impetuoso', bono: { centro: 2.4, alas: 0.4 }, margen: 9, piso: 0.3, carga: true },
    prudente: { n: 'Prudente', bono: { centro: 2.2, cerro: 1.8 }, margen: 0.08, piso: 0.5, cerrada: true }
  };
  const DIFICULTADES = ['facil', 'normal', 'dificil'];
  const CARTA_TXT = { arenga: 'la arenga', paso: 'el paso doble', cerrada: 'la formación cerrada' };
  const ia_d = function (a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };
  const ia_cerca = function (lista, x, y) { let b = null, bd = 1e9; for (const e of lista) { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; b = e; } } return b; };
  // carácter del general enemigo: cfg.sides[1].car, o por el nombre del general y de la facción
  Battle.caracterDe = function (cfg) {
    const sd = cfg.sides[1] || {}; if (sd.car && CARACTER[sd.car]) return sd.car;
    const g = String(sd.gen && sd.gen.n || '').toLowerCase(), f = String(sd.name || '').toLowerCase();
    if (/an[ií]bal|asdr[uú]bal|am[ií]lcar|jant/.test(g)) return 'astuto';
    if (/pirro|antioco|antíoco|filipo|perseo/.test(g)) return 'prudente';
    if (/cartag|libi|n[uú]mid/.test(f)) return 'astuto';
    if (/galo|ínsubre|insubre|boyo|senon|celta/.test(f)) return 'impetuoso';
    if (/epiro|ambrac|macedon|aque|siracus|helen|seleuc|griego|pella|tarent/.test(f)) return 'prudente';
    return 'equilibrado';
  };
  Battle.CARACTER = CARACTER; Battle.PLANES = PLANES; Battle.DIFICULTADES = DIFICULTADES;
  /* ---------- N15: dificultad por contexto ---------- */
  // La dificultad no se elige: sale de la situación. nivel va de -1 (fácil) a 1 (durísimo); lo usa la IA del rival (iaInit/iaRonda) y la pantalla.
  const NIVEL_DURO = 0.5;       // desde aquí (o hasta aquí en negativo) el rival se vuelve más agudo (o más torpe)
  const DIF_TERRENO = { cerro: 0.4, paso: 0.4, rio: 0.3, colina: 0.25, bosque: 0.2, pantano: 0.15, mixto: 0.15, llano: 0 };
  const DIF_TERRENO_TXT = { cerro: 'un cerro', paso: 'un paso estrecho', rio: 'un río con vados', colina: 'una colina', bosque: 'un bosque', pantano: 'un pantano', mixto: 'terreno quebrado' };
  const DIF_CARACTER = { astuto: 0.25, prudente: 0.1, equilibrado: 0, impetuoso: -0.1 };
  // qué papel vence a cuáles (para los «contras» de la composición)
  const BATE = { jinete: ['ligera', 'tirador'], lanceros: ['jinete', 'elefante'], pesada: ['ligera', 'tirador', 'media'], media: ['ligera', 'tirador'], elefante: ['media', 'ligera'], tirador: ['ligera'], ligera: [] };
  Battle.dificultadContexto = function (cfg) {
    const sd = cfg.sides, F = [], add = function (n, txt, v) { F.push({ n: n, txt: txt, v: Math.round(Math.max(-0.5, Math.min(0.5, v)) * 100) / 100 }); };
    const clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    const comp = function (s) { const m = {}; let t = 0; for (const k in s.units || {}) { const u = D.UNITS[k]; if (!u || u.cls === 'ele') { if (u && u.cls === 'ele') { m.elefante = (m.elefante || 0) + s.units[k] * 4; t += s.units[k] * 4; } continue; } const p = papelDe(k, u); m[p] = (m[p] || 0) + s.units[k]; t += s.units[k]; } return { m: m, t: Math.max(1, t) }; };
    // fuerza: hombres × calidad (ataque y defensa), restando lo bisoño (la milicia cuenta entera como bisoña)
    const fuerza = function (s) {
      let p = 0; for (const k in s.units || {}) { const u = D.UNITS[k]; if (!u || u.cls === 'ele') continue; const bis = k === 'milicia' ? 1 : clamp(s.bis || 0, 0, 1); p += s.units[k] * (1 - 0.3 * bis); }
      return p * (s.atkMul || 1) * (s.defMul || 1) * (1 + (s.mor || 0) / 100 * 2);
    };
    const car = Battle.caracterDe(cfg), ca = CARACTER[car];
    // (a) carácter del rival
    add('Rival', car === 'astuto' ? 'rival astuto' : car === 'prudente' ? 'rival prudente' : car === 'impetuoso' ? 'rival impetuoso' : 'rival equilibrado', DIF_CARACTER[car] || 0);
    // (b) terreno: el que defiende en terreno bueno es más difícil de romper
    const ter = TERRENOS[cfg.terreno] ? cfg.terreno : 'llano', vt = DIF_TERRENO[ter] || 0, defRival = cfg.defender === 1;
    add('Terreno', vt === 0 ? 'campo llano' : (defRival ? 'defiende ' : 'defiendes en ') + DIF_TERRENO_TXT[ter], defRival ? vt : -vt);
    // (c) general: mando + disciplina de cada uno (game.js da {mando, disc} al rival; el héroe del jugador, o sus bonos de moral, hace de referencia). Sin datos, vale 0.
    const exp = function (s) { const g = s && s.gen; if (g && (g.mando != null || g.disc != null)) return (g.mando || 0) + (g.disc || 0); if (g && g.lvl != null) return g.lvl; return null; };
    const eR = exp(sd[1]), eJ = exp(sd[0]) != null ? exp(sd[0]) : (sd[0] && sd[0].gen ? (sd[0].mor || 0) / 4 : null);
    if (eR != null) add('General', eR - (eJ || 0) >= 2 ? 'general veterano' : eR - (eJ || 0) <= -2 ? 'general bisoño' : 'generales parejos', (eR - (eJ || 0)) / 16);
    else add('General', 'general sin datos', 0);
    // (d) habilidad táctica: mando completo con general, plan afín al terreno, y el jugador sin general (solo 2 órdenes)
    { const c = comp(sd[1]), lig = ((c.m.ligera || 0) + (c.m.tirador || 0)) / c.t, cab = (c.m.jinete || 0) / c.t;
      const afin = (ter === 'cerro' && defRival) || (ter === 'bosque' && (cab + lig) > 0.3) || lig > 0.45 || cab > 0.25 ? 0.07 : 0;
      add('Táctica', (sd[1].gen ? 'mando completo' : 'sin general') + (afin ? ', plan afín al terreno' : '') + (sd[0].gen ? '' : ', tú sin general'), (sd[1].gen ? 0.07 : -0.05) + afin + (sd[0].gen ? 0 : 0.08)); }
    // (e) fuerza relativa
    { const p0 = Math.max(1, fuerza(sd[0])), p1 = Math.max(1, fuerza(sd[1])), r = Math.log(p1 / p0) / Math.log(2) * 0.5;
      add('Fuerza', r > 0.08 ? 'ejército mayor o mejor' : r < -0.08 ? 'ejército menor o peor' : 'fuerzas parejas', r); }
    // (f) contras: la composición del jugador frente a la del rival
    { const a = comp(sd[0]), b = comp(sd[1]); let sc = 0;
      for (const pa in a.m) for (const pb in b.m) { const w = (a.m[pa] / a.t) * (b.m[pb] / b.t); if ((BATE[pa] || []).indexOf(pb) >= 0) sc += w; if ((BATE[pb] || []).indexOf(pa) >= 0) sc -= w; }
      add('Contras', sc > 0.08 ? 'tus tropas tienen los contras buenos' : sc < -0.08 ? 'tus tropas tienen los contras malos' : 'contras equilibrados', -sc * 0.6); }
    let nivel = 0; for (const f of F) nivel += f.v; nivel = Math.round(clamp(nivel, -1, 1) * 100) / 100;
    const etiqueta = nivel >= 0.6 ? 'muy duro' : nivel >= 0.25 ? 'duro' : nivel > -0.25 ? 'parejo' : nivel > -0.6 ? 'asequible' : 'fácil';
    const top = F.filter(function (f) { return Math.abs(f.v) >= 0.08 && f.n !== 'Rival' || (f.n === 'Rival' && Math.abs(f.v) >= 0.1); }).sort(function (x, y) { return Math.abs(y.v) - Math.abs(x.v); }).slice(0, 2).map(function (f) { return f.txt; });
    return { nivel: nivel, etiqueta: etiqueta, escala: Math.round((nivel + 1) * 50), factores: F, texto: 'Rival: ' + etiqueta + (top.length ? ' · ' + top.join(', ') : '') };
  };
  // refugio de altura en la mitad enemiga y bosque cercano al centro (posiciones fijas del terreno)
  Battle.prototype.iaTerreno = function () {
    const T = this.tr, H = this.H, W = this.W; let cerro = null, bosque = null, bd = 1e9;
    for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) {
      const i = r * T.cols + c, px = (c + 0.5) * CELDA, py = (r + 0.5) * CELDA;
      if (T.ter[i] === T_AGUA || T.ter[i] === T_ROCA || T.ter[i] === T_VADO) continue;
      if (T.alt[i] >= 1 && py < H * 0.6) { const dd = Math.abs(px - W / 2) + py * 0.3; if (!cerro || T.alt[i] > cerro.alt + 1e-9 || (T.alt[i] === cerro.alt && dd < cerro.dd)) cerro = { x: px, y: py, alt: T.alt[i], dd: dd }; }
      if (T.bos[i] && py > H * 0.12 && py < H * 0.5) { const dd = Math.abs(px - W / 2) + Math.abs(py - H * 0.35); if (dd < bd) { bd = dd; bosque = { x: px, y: py }; } }
    }
    return { cerro: cerro ? { x: cerro.x, y: cerro.y } : null, bosque: bosque };
  };
  Battle.prototype.iaInit = function () {
    const cf = this.cfg, car = Battle.caracterDe(cf), ca = CARACTER[car], dif = DIFICULTADES.indexOf(cf.dificultad) >= 0 ? cf.dificultad : 'normal', ter = this.iaTerreno();
    const f = { inf: 0, spear: 0, cav: 0, rng: 0, ele: 0, lig: 0 }; let tot = 0, men0 = 0;
    for (const k in cf.sides[1].units) { const u = D.UNITS[k]; if (!u) continue; const n = cf.sides[1].units[k]; f[u.cls] = (f[u.cls] || 0) + n; if (u.cls === 'rng' || papelDe(k, u) === 'ligera') f.lig += n; if (u.cls !== 'ele') tot += n; }
    for (const k in cf.sides[0].units) { const u = D.UNITS[k]; if (u && u.cls !== 'ele') men0 += cf.sides[0].units[k]; }
    const fr = x => x / Math.max(1, tot), sc = {
      centro: 1 + 3 * fr(f.spear + f.ele) + fr(f.inf),
      alas: 3.5 * fr(f.cav) + (tot > men0 * 1.15 ? 1.5 : 0),
      cerro: (ter.cerro ? 2.2 : 0) + (tot < men0 * 0.85 ? 1.2 : 0),
      emboscar: (ter.bosque ? 1.6 : 0) + 2 * fr(f.cav + f.lig),
      hostigar: 3.2 * fr(f.lig) + (tot < men0 * 0.75 ? 1.2 : 0)
    };
    let plan = 'centro', best = -1e9;
    for (const p of PLAN_ORDEN) { if (p === 'cerro' && !ter.cerro) continue; if (p === 'emboscar' && !ter.bosque) continue; const v = sc[p] + (ca.bono[p] || 0); if (v > best + 1e-9) { best = v; plan = p; } }
    this.ia = { plan: plan, car: car, dif: dif, nivel: this.dif ? this.dif.nivel : 0, cerro: ter.cerro, bosque: ter.bosque, fotos: [], ult: '', finta: 0, emb: null, cartas: CARTAS.slice(), cartaRonda: 0, cartaTxt: '', gestos: 0 };
    this.gesto = '';
  };
  Battle.prototype.iaFoto = function () { return { r: this.regs.map(function (r) { return [Math.round(r.x), Math.round(r.y), r.men, r.st === 'ok' ? 1 : 0]; }) }; };
  // un gesto visible por ronda: decide con la foto, da órdenes (con límite de puntos y radio) y quizá juega una carta
  Battle.prototype.iaRonda = function () { this.iaRonda0(); if (this.cfg.relevoAuto !== false) this.autoRelevo(1); };
  Battle.prototype.iaRonda0 = function () {
    const ia = this.ia, ca = CARACTER[ia.car], dif = ia.dif, nv = ia.nivel || 0, dur = dif === 'dificil' || nv >= NIVEL_DURO,
      margen = ca.margen < 5 ? ca.margen * (1 - 0.5 * nv) : ca.margen, piso = ca.piso * (1 + 0.2 * nv), ronda = this.ronda, W = this.W, H = this.H, T = this.tr, B = T.banda;
    const g = this.generalVivo(1), pts = g ? MANDO_PUNTOS : MANDO_PUNTOS_SIN;
    if (!ia.fotos.length) ia.fotos.push(this.iaFoto());
    const F = ia.fotos[(dif === 'facil' || nv <= -NIVEL_DURO) && ia.fotos.length > 1 ? 1 : 0].r;
    ia.cartaTxt = '';
    if (dif === 'facil' && ronda % 2 === 0) { this.gesto = 'El enemigo mantiene su línea'; return; }
    // lo que se ve: los regimientos del jugador según la foto (la orden de ahora no se mira)
    const vis = [], regs = this.regs; let h0 = 0, h1 = 0;
    regs.forEach(function (r, i) { const f = F[i]; if (!f || !f[3]) return; if (r.side === 0) { h0 += f[2]; if (r.st === 'ok') vis.push({ r: r, x: f[0], y: f[1], men: f[2], cl: r.u.cls, id: i }); } else h1 += f[2]; });
    const m0 = h0 / Math.max(1, this.start[0]), m1 = h1 / Math.max(1, this.start[1]);
    const mios = regs.filter(r => r.side === 1 && r.st === 'ok' && r.k !== 'general');
    if (!mios.length || !vis.length) { this.gesto = 'El enemigo espera'; return; }
    const sede = (r) => (ia_cerca(vis, r.x, r.y) || vis[0]), dist = (r) => ia_d(r, sede(r));
    const tipoA = ca.carga ? 'cargar' : 'avanzar';
    const O = (extra) => Object.assign({ ia: true, hasta: ronda + 1 }, extra);
    const atk = (r, v, tp) => [r, O({ k: 'atk', r: v.r, tipo: tp || tipoA })];
    const mov = (r, x, y, tp) => [r, O({ k: 'move', x: Math.max(20, Math.min(W - 20, x)), y: Math.max(20, Math.min(H - 20, y)), tipo: tp || 'avanzar' })];
    const hayTiro = vis.some(v => v.cl === 'rng');
    const formIA = (r) => r.papel === 'lanceros' && r.u.cls !== 'cav' ? 'falange' : (hayTiro && (r.papel === 'pesada' || r.papel === 'media') && ca.cerrada) ? 'testudo' : r.papel === 'tirador' ? 'orbe' : null;   // (N7) el prudente cierra falange o testudo al aguantar
    const quieto = (r) => [r, O(Object.assign({ k: 'quieto', tipo: 'aguantar', hasta: ronda + 3 }, ca.cerrada && formIA(r) && r.form !== formIA(r) && this.formacionesPosibles(r).indexOf(formIA(r)) >= 0 ? { form: formIA(r) } : {}))];
    const porDist = (lista) => lista.slice().sort((a, b) => dist(a) - dist(b));
    const pesados = mios.filter(r => r.u.cls !== 'cav' && r.u.cls !== 'rng' && r.papel !== 'ligera'), cavs = mios.filter(r => r.u.cls === 'cav');
    const ligeros = mios.filter(r => r.u.cls === 'rng' || r.papel === 'ligera');
    const xs = vis.map(v => v.x), gapIzq = Math.min.apply(null, xs), gapDer = W - Math.max.apply(null, xs), lado = gapDer >= gapIzq ? 1 : -1;
    const ladoTxt = lado > 0 ? 'derecha' : 'izquierda';
    const G = {};
    G.ala = () => {   // los dos regimientos más cerca del borde se estiran hacia el lado abierto
      if (mios.length < 2) return null;
      const ext = mios.slice().sort((a, b) => (b.x - a.x) * lado).slice(0, 2);
      return { t: 'El enemigo estira el ala ' + ladoTxt, o: ext.map(r => mov(r, r.x + lado * 150, r.y + 110)) };
    };
    G.flanco = () => {
      if (!cavs.length) return null;
      const obj = vis.slice().sort((a, b) => (b.x - a.x) * lado)[0];
      return { t: 'La caballería enemiga busca tu flanco ' + (obj.x < W / 2 ? 'izquierdo' : 'derecho'), o: cavs.slice(0, 2).map(r => atk(r, obj, 'cargar')) };
    };
    G.reserva = () => {
      let debil = null, dw = 1e9;
      for (const r of mios) { const q = r.men / r.max + r.mor / r.morMax; if (dist(r) < 130 && (r.men / r.max < 0.7 || r.mor / r.morMax < 0.5) && q < dw) { dw = q; debil = r; } }
      if (!debil) return null;
      const res = ia_cerca(mios.filter(r => r !== debil && r.u.cls !== 'rng' && dist(r) > 200), debil.x, debil.y); if (!res) return null;
      return { t: 'El enemigo manda la reserva al punto débil', o: [atk(res, sede(debil), res.u.cls === 'cav' ? 'cargar' : tipoA)] };
    };
    G.centro = () => {
      const c = porDist(pesados).slice(0, pts); if (!c.length) return null;
      if (ca.cerrada && ronda < 3) return { t: 'El enemigo cierra la falange en el centro', o: c.map(r => quieto(r)) };
      return { t: 'El enemigo adelanta el centro', o: c.map(r => atk(r, sede(r))) };
    };
    G.carga = () => { const c = porDist(mios.filter(r => r.u.cls !== 'rng')).slice(0, pts); return c.length ? { t: 'El caudillo lanza a los suyos a la carga', o: c.map(r => atk(r, sede(r), 'cargar')) } : null; };
    G.avanza = () => { const c = porDist(mios).slice(0, pts); return c.length ? { t: 'El enemigo aprieta el paso', o: c.map(r => atk(r, sede(r), r.u.cls === 'rng' ? 'avanzar' : tipoA)) } : null; };
    G.cerro = () => {
      const s = ia.cerro; if (!s) return null;
      const sube = porDist(mios.filter(r => r.u.cls !== 'cav'), 0).sort((a, b) => ia_d(a, s) - ia_d(b, s)), o = []; let i = 0;
      // (N15c) si ya está arriba, es mayor y nadie ha peleado aún (el jugador no sube a por él), baja a atacar en vez de esperar para siempre
      if (ia.baja) return null;
      if (ronda >= IA_BAJA_RONDA && h1 > h0 * IA_BAJA_FUERZA && sube.every(r => ia_d(r, s) < 130) && m0 > 0.92 && m1 > 0.92) { ia.baja = true; return null; }
      for (const r of sube) { if (ia_d(r, s) < 90) o.push(quieto(r)); else if (o.filter(q => q[1].k !== 'quieto').length < pts) o.push(mov(r, s.x + (i++ % 4 - 1.5) * 45, s.y + (i > 3 ? 40 : 0))); }
      return o.length ? { t: 'El enemigo sube ' + (T.id === 'cerro' ? 'al cerro' : 'a la colina'), o: o } : null;
    };
    G.vado = () => {
      if (!B || B.tipo !== 'rio' || dif === 'facil') return null;
      const norte = mios.filter(r => r.y < B.y0 && r.u.cls !== 'rng'); if (!norte.length) return null;
      let c = null, cq = 1e9; for (const q of B.cr) { const n = vis.filter(v => Math.abs(v.x - q.xc) < 220 && v.y >= B.y1).length * 40 + Math.abs(q.xc - ia_cerca(norte, W / 2, 0).x) * 0.1; if (n < cq) { cq = n; c = q; } }
      const grupo = norte.slice().sort((a, b) => Math.abs(a.x - c.xc) - Math.abs(b.x - c.xc)).slice(0, Math.min(pts, 4));
      return { t: 'El enemigo cruza el río por un vado', o: grupo.map((r, i) => mov(r, c.xc + (i - (grupo.length - 1) / 2) * 30, B.y1 + 70)) };
    };
    G.emboscada = () => {
      const s = ia.bosque; if (!s || ia.emb) return null;
      const gr = porDist(cavs.concat(ligeros)).sort((a, b) => ia_d(a, s) - ia_d(b, s)).slice(0, 2); if (!gr.length) return null;
      ia.emb = { x: s.x, y: s.y, ids: gr.map(r => regs.indexOf(r)), t: ronda };
      return { t: 'Parte del enemigo se pierde en el bosque', o: gr.map((r, i) => mov(r, s.x + (i - 0.5) * 40, s.y)) };
    };
    G.salen = () => {
      const e = ia.emb; if (!e) return null;
      const em = e.ids.map(i => regs[i]).filter(r => r.st === 'ok'); if (!em.length) { ia.emb = null; return null; }
      if (!vis.some(v => Math.hypot(v.x - e.x, v.y - e.y) < 240) && ronda < e.t + 4) return null;
      ia.emb = null; return { t: '¡Los emboscados salen del bosque!', o: em.map(r => atk(r, sede(r), 'cargar')) };
    };
    G.hostiga = () => {
      const c = ligeros.filter(r => r.u.cls === 'rng' || r.papel === 'ligera').slice(0, pts); if (!c.length) return null;
      return { t: 'El enemigo hostiga con sus tiradores', o: c.map(r => atk(r, sede(r), 'hostigar')) };
    };
    G.huida = () => {
      const c = ligeros.filter(r => dist(r) < 160).slice(0, pts); if (!c.length) return null;
      return { t: 'El enemigo rompe contacto y se aleja', o: c.map(r => mov(r, r.x, r.y - 170, 'retirarse')) };
    };
    G.contra = () => {
      if (ia.finta !== ronda - 1) return null; ia.finta = 0;
      const c = porDist(mios.filter(r => r.u.cls !== 'rng')).slice(0, pts); if (!c.length) return null;
      return { t: '¡El enemigo da media vuelta y contraataca!', o: c.map(r => atk(r, sede(r), 'cargar')) };
    };
    G.repliegue = () => {
      if (ronda < 2) return null;
      const aprieta = m0 - m1 > margen || m1 < piso, finta = ca.finta && (m0 - m1 > margen || (ia.plan === 'emboscar' && ronda === 2));
      if (!aprieta && !finta) return null;
      const c = porDist(mios).filter(r => dist(r) < 220).sort((a, b) => a.men / a.max - b.men / b.max).slice(0, Math.min(pts, 3)); if (!c.length) return null;
      const ref = dur && ia.cerro ? ia.cerro : null;
      if (finta) ia.finta = ronda;
      return { t: finta ? 'El enemigo finge retirarse' : 'El enemigo se repliega para rehacerse', o: c.map(r => ref ? mov(r, ref.x, ref.y, 'retirarse') : mov(r, r.x, r.y - 150, 'retirarse')) };
    };
    const apertura = { centro: 'centro', alas: 'ala', cerro: 'cerro', emboscar: 'emboscada', hostigar: 'hostiga' }[ia.plan];
    const resto = { centro: ['flanco', 'ala'], alas: ['flanco', 'ala', 'centro'], cerro: ['cerro'], emboscar: ['salen', 'flanco', 'centro'], hostigar: ['huida', 'hostiga', 'flanco'] }[ia.plan];
    let cola = ['contra', 'repliegue', 'salen'];
    if (dur) cola.push('vado', 'reserva'); else cola.push('reserva', 'vado');
    if (ia.plan === 'cerro' || ia.plan === 'emboscar') cola = cola.filter(k => k !== 'vado');
    if (ca.n === 'Prudente') cola = cola.filter(k => k !== 'vado');
    cola = cola.concat(ronda === 1 ? [apertura] : resto, [apertura], [ca.carga ? 'carga' : 'avanza']);
    if (ronda === 1) cola = [apertura, 'avanza'];
    let gest = null, clave = '';
    for (const pasada of [0, 1]) { for (const k of cola) { if (pasada === 0 && k === ia.ult && ['ala', 'flanco', 'centro', 'hostiga', 'avanza', 'carga', 'huida', 'vado', 'reserva'].indexOf(k) >= 0) continue; const r = G[k](); if (r) { gest = r; clave = k; break; } } if (gest) break; }
    if (!gest) { this.gesto = 'El enemigo mantiene su línea'; return; }
    // órdenes: se conservan las vigentes que no se sustituyen, sin pasar de los puntos de mando
    const nuevo = new Map(); for (const p of gest.o) if (!nuevo.has(p[0])) nuevo.set(p[0], p[1]);
    if (dur) {   // difícil reparte los puntos que sobran: fuego concentrado sobre el más débil que ve
      const debil = vis.slice().sort((a, b) => a.men - b.men)[0];
      for (const r of porDist(mios)) { if (nuevo.size >= pts) break; if (!nuevo.has(r) && r.u.cls !== 'rng' && dist(r) < 260) nuevo.set(r, O({ k: 'atk', r: debil.r, tipo: tipoA })); }
    }
    const vig = []; for (const r of mios) if (!nuevo.has(r) && r.order && r.order.ia && r.order.hasta >= ronda) vig.push(r); else if (!nuevo.has(r) && r.order && (r.order.k !== 'quieto' || (r.order.ia && r.order.hasta < ronda))) { r.order = null; r.tgt = null; }
    let usados = 0; for (const o of nuevo.values()) if (o.k !== 'quieto') usados++;
    for (const r of vig) if (r.order.k !== 'quieto') { if (usados < pts) usados++; else { r.order = null; r.tgt = null; } }
    for (const [r, o] of nuevo) if (o.k !== 'quieto' && !o.form && r.form !== 'normal' && r.k !== 'falange') o.form = 'normal';   // (N7) al avanzar deja la formación cerrada
    let n = 0; for (const [r, o] of nuevo) { if (o.k !== 'quieto') { if (n >= pts) continue; n++; } r.order = o; r.tgt = null; r.pend = null; r.pendT = 0; }
    if (g) for (const r of mios) {   // fuera del radio de su general la orden llega con retraso
      if (r.order && r.order.k !== 'quieto' && !r.pend && this.fueraDeMando(r, g) && nuevo.has(r)) { r.pend = r.order; r.pendT = MANDO_RETRASO; r.order = { k: 'quieto' }; }
    }
    // carta (una por ronda, tres por batalla; solo con general vivo y no en Fácil)
    let carta = null;
    if (dif !== 'facil' && nv > -NIVEL_DURO && g && ia.cartas.length && ia.cartaRonda !== ronda) {
      const aprieta = vis.some(v => ia_cerca(mios, v.x, v.y) && ia_d(v, ia_cerca(mios, v.x, v.y)) < 250), vacila = mios.some(r => estadoMoral(r) >= 1) || m1 < m0 - 0.05;
      if (vacila && ia.cartas.indexOf('arenga') >= 0) carta = 'arenga';
      else if ((ca.cerrada || dur) && aprieta && ia.cartas.indexOf('cerrada') >= 0 && ['ala', 'flanco', 'vado', 'contra', 'carga', 'salen'].indexOf(clave) < 0) carta = 'cerrada';
      else if (dur && ['ala', 'flanco', 'vado', 'contra', 'carga', 'salen'].indexOf(clave) >= 0 && ia.cartas.indexOf('paso') >= 0) carta = 'paso';
    }
    if (carta) {
      ia.cartas.splice(ia.cartas.indexOf(carta), 1); ia.cartaRonda = ronda; ia.cartaTxt = carta;
      for (const r of regs) if (r.side === 1 && r.st === 'ok' && !this.fueraDeMando(r, g)) { r.cartaFx = carta; if (carta === 'arenga') r.mor = Math.min(topeMor(r), r.mor + ARENGA_MORAL * r.morMax); }
    }
    ia.ult = clave; ia.gestos++; this.gesto = gest.t + (carta ? ' y juega ' + CARTA_TXT[carta] : '');
  };

  /* ---------- N15: objetivos de batalla ---------- */
  // cfg.objetivo = { tipo: 'resistir', lado, seg | rondas } | { tipo: 'tomar', lado, zona: {x, y, w, h} (fracciones del campo), seg } | { tipo: 'escapar', lado }
  // «lado» es el bando que persigue el objetivo (0 por defecto). Un objetivo resuelto termina la batalla con winner.
  const ZONA_BORDE = 60;        // el general que escapa debe llegar a esta distancia del borde enemigo
  Battle.prototype.zonaObjetivo = function () {
    const z = this.obj && this.obj.zona; if (!z) return null;
    return { x0: z.x * this.W, y0: z.y * this.H, x1: (z.x + z.w) * this.W, y1: (z.y + z.h) * this.H };
  };
  Battle.prototype.chequeaObjetivo = function (dt) {
    const o = this.obj; if (!o || o.fin || this.over) return;
    const lado = o.lado === 1 ? 1 : 0, fin = ganador => { o.fin = true; o.cumplido = ganador === lado; this.over = true; this.winner = ganador; };
    if (o.tipo === 'resistir') {
      const hecho = o.rondas != null ? (this.rondas ? this.ronda - 1 >= o.rondas : this.t >= o.rondas * RONDA_SEG) : this.t >= (o.seg || 0);
      if (hecho && this.men(lado) > 0) fin(lado);
    } else if (o.tipo === 'tomar') {
      const z = this.zonaObjetivo(), dentro = [0, 0];
      if (z) for (const r of this.regs) if (r.st === 'ok' && r.x >= z.x0 && r.x <= z.x1 && r.y >= z.y0 && r.y <= z.y1) dentro[r.side]++;
      for (let s = 0; s < 2; s++) o.tZona[s] = dentro[s] > 0 && dentro[1 - s] === 0 ? o.tZona[s] + dt : 0;
      for (let s = 0; s < 2; s++) if (o.tZona[s] >= (o.seg || 0) && dentro[s] > 0) { fin(s); return; }
    } else if (o.tipo === 'escapar') {
      const g = this.generalVivo(lado);
      if (!g) { if (this.regs.some(q => q.side === lado && q.k === 'general')) fin(1 - lado); return; }
      if (lado === 0 ? g.y <= ZONA_BORDE : g.y >= this.H - ZONA_BORDE) fin(lado);
    }
  };
  // progreso para el HUD: { tipo, texto, frac (0..1) } o null sin objetivo
  Battle.prototype.progresoObjetivo = function () {
    const o = this.obj; if (!o) return null;
    const lado = o.lado === 1 ? 1 : 0, cl = function (v) { return Math.max(0, Math.min(1, v)); };
    if (o.tipo === 'resistir') {
      if (o.rondas != null) {
        const hechas = this.rondas ? this.ronda - 1 : Math.floor(this.t / RONDA_SEG), falta = Math.max(0, o.rondas - hechas);
        return { tipo: o.tipo, texto: o.fin ? (o.cumplido ? 'Habéis aguantado' : 'No habéis aguantado') : 'Aguantad ' + falta + (falta === 1 ? ' ronda más' : ' rondas más'), frac: cl(hechas / o.rondas) };
      }
      const falta = Math.max(0, Math.ceil((o.seg || 0) - this.t)), mm = Math.floor(falta / 60), ss = falta % 60;
      return { tipo: o.tipo, texto: o.fin ? (o.cumplido ? 'Habéis aguantado' : 'No habéis aguantado') : 'Aguantad ' + mm + ':' + (ss < 10 ? '0' : '') + ss + ' más', frac: cl(this.t / (o.seg || 1)) };
    }
    if (o.tipo === 'tomar') {
      const t = o.tZona[lado], c = o.tZona[1 - lado], seg = o.seg || 1;
      const texto = o.fin ? (o.cumplido ? 'Zona tomada' : 'Zona perdida') : c > 0 ? 'El enemigo tiene la zona: ' + Math.ceil(Math.max(0, seg - c)) + ' s' : t > 0 ? 'Mantened la zona: ' + Math.ceil(Math.max(0, seg - t)) + ' s' : 'Tomad la zona y quedaos solos en ella ' + seg + ' s';
      return { tipo: o.tipo, texto: texto, frac: cl(t / seg) };
    }
    if (o.tipo === 'escapar') {
      const g = this.regs.find(q => q.side === lado && q.k === 'general' && q.st === 'ok');
      const meta = lado === 0 ? ZONA_BORDE : this.H - ZONA_BORDE, ini = lado === 0 ? this.H - 20 : 20;
      const frac = g ? cl((g.y - ini) / (meta - ini)) : 0;
      return { tipo: o.tipo, texto: o.fin ? (o.cumplido ? 'El general ha escapado' : 'El general no escapó') : g ? 'Llevad al general al borde enemigo: ' + Math.round(frac * 100) + ' %' : 'Sin general: no hay escapada', frac: frac };
    }
    return null;
  };
  Battle.prototype.finish = function () { this.rondas = false; this.fase = 'lucha'; let i = 0; while (!this.over && i++ < 8000) this.step(0.2); };

  Battle.prototype.result = function () {
    const res = { winner: this.winner, surv: [{}, {}], lost: [{}, {}], dead: [0, 0], genDead: [false, false], time: this.t };
    for (const r of this.regs) {
      const alive = r.st === 'dead' ? 0 : r.men;
      if (r.k === 'general') { res.genDead[r.side] = r.st === 'dead'; continue; }
      res.surv[r.side][r.k] = (res.surv[r.side][r.k] || 0) + alive;
      res.lost[r.side][r.k] = (res.lost[r.side][r.k] || 0) + (r.max - alive);
      res.dead[r.side] += r.max - alive;
    }
    if (this.obj) { const p = this.progresoObjetivo() || { texto: '' }, aniq = this.over && !this.obj.fin && this.winner === this.obj.lado; res.objetivo = { tipo: this.obj.tipo, fin: !!this.obj.fin, cumplido: !!this.obj.cumplido || aniq, texto: this.obj.fin ? p.texto : aniq ? 'Ganasteis destruyendo al rival' : (this.over ? 'Objetivo no cumplido' : p.texto) }; }
    return res;
  };

  /* ---------------- Vista ---------------- */
  function BattleView(canvas, battle) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.b = battle; this.sel = new Set();
    this.bg = this.makeBg();
    this.resize();
  }

  BattleView.prototype.resize = function () {
    const p = this.cv.parentElement, w = p.clientWidth, h = p.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    const sc = Math.min(w / this.b.W, h / this.b.H);
    this.cv.style.width = this.b.W * sc + 'px'; this.cv.style.height = this.b.H * sc + 'px';
    this.cv.width = Math.round(this.b.W * sc * dpr); this.cv.height = Math.round(this.b.H * sc * dpr);
    this.k = sc * dpr; this.sc = sc;
  };

  // pinta las celdas de terreno (colina, bosque, agua, vado, pantano, roca) en un contexto 2D con escala kx, ky; sirve para el minimapa y la vista de reserva
  Battle.pintaTerreno = function (g, b, kx, ky, fuerte) {
    const T = b.tr; if (!T || T.plano) return;
    const col = { 1: '#3b7fa8', 2: '#8fc4cc', 3: '#5b6e35', 4: '#7a746a' }, C = CELDA;
    for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) {
      const i = r * T.cols + c, t = T.ter[i];
      const f = t && col[t] ? col[t] : T.bos[i] ? '#3f6a2e' : T.alt[i] >= 1 ? '#b79b62' : T.alt[i] > 0 ? '#a8a068' : null;
      if (f) { g.fillStyle = f; g.fillRect(c * C * kx, r * C * ky, Math.ceil(C * kx), Math.ceil(C * ky)); }
    }
  };
  BattleView.prototype.makeBg = function () {
    const c = document.createElement('canvas'); c.width = this.b.W; c.height = this.b.H;
    const g = c.getContext('2d'), rnd = mkRng(this.b.cfg.seed || 7);
    const gr = g.createLinearGradient(0, 0, 0, this.b.H); gr.addColorStop(0, '#7d9150'); gr.addColorStop(0.5, '#93a35c'); gr.addColorStop(1, '#84964f');
    g.fillStyle = gr; g.fillRect(0, 0, this.b.W, this.b.H);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(60,80,30,0.10)' : 'rgba(200,190,120,0.10)';
      g.beginPath(); g.ellipse(rnd() * this.b.W, rnd() * this.b.H, 10 + rnd() * 46, 6 + rnd() * 20, rnd() * 3, 0, 7); g.fill();
    }
    Battle.pintaTerreno(g, this.b, 1, 1);
    // camino
    g.strokeStyle = 'rgba(190,165,110,0.55)'; g.lineWidth = 26; g.beginPath(); g.moveTo(this.b.W * 0.42, 0); g.bezierCurveTo(this.b.W * 0.7, this.b.H * 0.3, this.b.W * 0.3, this.b.H * 0.6, this.b.W * 0.55, this.b.H); g.stroke();
    // árboles en los bordes
    for (let i = 0; i < 46; i++) {
      const left = rnd() < 0.5, x = left ? rnd() * 34 : this.b.W - rnd() * 34, y = rnd() * this.b.H, r = 8 + rnd() * 9;
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(x + 3, y + 4, r, 0, 7); g.fill();
      g.fillStyle = rnd() < 0.5 ? '#3f6a2c' : '#4d7a33'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 0, 7); g.fill();
    }
    // muralla del defensor
    const wall = this.b.cfg.wall || 0;
    if (wall > 0) {
      const y = this.b.cfg.defender === 0 ? this.b.H - 46 : 14;
      g.fillStyle = '#8d8676'; g.fillRect(0, y, this.b.W, 32); g.fillStyle = '#6f695b'; g.fillRect(0, y + 26, this.b.W, 6);
      g.fillStyle = '#a39b88';
      for (let x = 4; x < this.b.W; x += 18) g.fillRect(x, y - 5, 10, 7);
      for (let x = 60; x < this.b.W; x += 160) { g.fillStyle = '#7b7566'; g.fillRect(x - 20, y - 12, 40, 50); g.fillStyle = '#a39b88'; g.fillRect(x - 20, y - 16, 10, 6); g.fillRect(x - 5, y - 16, 10, 6); g.fillRect(x + 10, y - 16, 10, 6); }
      g.fillStyle = '#4a3a22'; g.fillRect(this.b.W / 2 - 16, y + 4, 32, 28);
    }
    return c;
  };

  BattleView.prototype.toField = function (cx, cy) { const r = this.cv.getBoundingClientRect(); return [(cx - r.left) / this.sc, (cy - r.top) / this.sc]; };

  BattleView.prototype.tap = function (cx, cy) {
    const p = this.toField(cx, cy), b = this.b, desp = b.fase === 'despliegue';
    let hit = null, hd = 40;
    for (const r of b.regs) { if (r.st !== 'ok') continue; const d = Math.hypot(r.x - p[0], r.y - p[1]); if (d < hd) { hd = d; hit = r; } }
    if (hit && hit.side === 0) { if (this.sel.has(hit)) this.sel.delete(hit); else this.sel.add(hit); return; }
    const sel = [...this.sel].filter(r => r.st === 'ok');
    if (!sel.length) return;
    if (desp) { if (hit) return; let ax = 0, ay = 0; sel.forEach(r => { ax += r.x; ay += r.y; }); ax /= sel.length; ay /= sel.length; sel.forEach(r => b.colocar(r, p[0] + (r.x - ax), p[1] + (r.y - ay))); return; }
    if (hit) sel.forEach(r => { r.order = { k: 'atk', r: hit }; });
    else {
      let cx0 = 0, cy0 = 0; sel.forEach(r => { cx0 += r.x; cy0 += r.y; }); cx0 /= sel.length; cy0 /= sel.length;
      sel.forEach(r => { r.order = { k: 'move', x: p[0] + (r.x - cx0), y: p[1] + (r.y - cy0) }; r.tgt = null; });
      this.ping = { x: p[0], y: p[1], t: b.t };
    }
  };

  // arrastre en el despliegue (vista plana): down/move/up sustituyen a tap mientras se coloca
  BattleView.prototype.down = function (ev) {
    const b = this.b; if (b.fase !== 'despliegue') return this.tap(ev.clientX, ev.clientY);
    const p = this.toField(ev.clientX, ev.clientY); let hit = null, hd = 40;
    for (const r of b.regs) { if (r.st !== 'ok' || r.side !== 0) continue; const d = Math.hypot(r.x - p[0], r.y - p[1]); if (d < hd) { hd = d; hit = r; } }
    this.drag = hit ? { r: hit, x: ev.clientX, y: ev.clientY, dx: hit.x - p[0], dy: hit.y - p[1], mv: false, id: ev.pointerId } : null;
    if (!hit) return this.tap(ev.clientX, ev.clientY);
    try { ev.target.setPointerCapture(ev.pointerId); } catch (e) { /* sin captura */ }
  };
  BattleView.prototype.move = function (ev) {
    const d = this.drag; if (!d || ev.pointerId !== d.id || this.b.fase !== 'despliegue') return;
    if (!d.mv && Math.hypot(ev.clientX - d.x, ev.clientY - d.y) < 8) return;
    d.mv = true; const p = this.toField(ev.clientX, ev.clientY); this.b.colocar(d.r, p[0] + d.dx, p[1] + d.dy);
  };
  BattleView.prototype.up = function (ev) {
    const d = this.drag; if (!d || ev.pointerId !== d.id) return; this.drag = null;
    if (!d.mv) { if (this.sel.has(d.r)) this.sel.delete(d.r); else this.sel.add(d.r); }
  };

  BattleView.prototype.selectAll = function () {
    const all = this.b.regs.filter(r => r.side === 0 && r.st === 'ok');
    if (this.sel.size >= all.length) this.sel.clear(); else all.forEach(r => this.sel.add(r));
  };

  BattleView.prototype.draw = function () {
    const c = this.ctx, b = this.b;
    c.setTransform(this.k, 0, 0, this.k, 0, 0);
    c.drawImage(this.bg, 0, 0);
    for (const k of b.corpses) { c.fillStyle = k.s === 0 ? 'rgba(90,20,15,0.55)' : 'rgba(40,30,50,0.5)'; c.fillRect(k.x, k.y, 3.5, 2); }
    if (this.ping && b.t - this.ping.t < 0.6) { c.strokeStyle = 'rgba(255,230,120,' + (1 - (b.t - this.ping.t) / 0.6) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(this.ping.x, this.ping.y, 6 + (b.t - this.ping.t) * 40, 0, 7); c.stroke(); }
    // órdenes
    for (const r of this.sel) {
      if (r.st !== 'ok' || !r.order) continue;
      const tx = r.order.k === 'atk' ? r.order.r.x : r.order.x, ty = r.order.k === 'atk' ? r.order.r.y : r.order.y;
      c.strokeStyle = r.order.k === 'atk' ? 'rgba(255,90,60,0.7)' : 'rgba(255,235,140,0.7)'; c.lineWidth = 1.5; c.setLineDash([5, 5]);
      c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(tx, ty); c.stroke(); c.setLineDash([]);
    }
    const order = b.regs.slice().sort((p, q) => p.y - q.y);
    for (const r of order) if (r.st === 'ok' || r.st === 'rout') this.drawReg(r);
    // proyectiles
    c.strokeStyle = 'rgba(40,30,20,0.85)'; c.lineWidth = 1.2;
    for (const f of b.fx) {
      const p = Math.min(1, f.t / 0.45);
      for (let i = 0; i < f.n; i++) {
        const ox = (i - f.n / 2) * 7, x = f.x0 + (f.x1 - f.x0) * p + ox, y = f.y0 + (f.y1 - f.y0) * p - Math.sin(p * Math.PI) * 26;
        const a = Math.atan2(f.y1 - f.y0, f.x1 - f.x0);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.cos(a) * 7, y - Math.sin(a) * 7); c.stroke();
      }
    }
  };

  BattleView.prototype.drawReg = function (r) {
    const c = this.ctx, b = this.b, col = b.cfg.sides[r.side].col, cls = r.u.cls;
    const big = cls === 'cav' || cls === 'gen', ele = cls === 'ele';
    const cols = ele ? 4 : big ? 8 : 12, sp = ele ? 13 : big ? 6.6 : 4.6, ds = ele ? 9 : big ? 4 : 3;
    const maxDots = ele ? r.max : Math.min(r.max, big ? 32 : 48), dots = Math.max(1, Math.round(maxDots * r.men / r.max));
    const rows = Math.ceil(dots / cols), w = cols * sp + 4, d = Math.max(1, rows) * sp + 4;
    c.save(); c.translate(r.x, r.y); c.rotate(r.ang + Math.PI / 2);
    const rout = r.st === 'rout';
    if (!rout) {
      c.fillStyle = col; c.globalAlpha = 0.28; c.fillRect(-w / 2, -d / 2, w, d); c.globalAlpha = 1;
      c.strokeStyle = this.sel.has(r) ? '#ffe27a' : 'rgba(0,0,0,0.45)'; c.lineWidth = this.sel.has(r) ? 2.4 : 1; c.strokeRect(-w / 2, -d / 2, w, d);
      // frente
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(-w / 2, -d / 2 - 2, w, 1.6);
    }
    const tick = Math.floor(b.t * 9), jig = r.fight > 0 ? 1.4 : 0;
    for (let i = 0; i < dots; i++) {
      const cx = i % cols, cy = Math.floor(i / cols);
      let x = -w / 2 + 2 + cx * sp + (sp - ds) / 2, y = -d / 2 + 2 + cy * sp + (sp - ds) / 2;
      if (jig || rout) { const h = Math.sin((i * 12.9898 + tick * 78.233 + r.id) * 43758.5453); x += h * (rout ? 5 : jig); y += Math.cos(h * 9) * (rout ? 5 : jig); }
      if (ele) { c.fillStyle = '#6d6a66'; c.fillRect(x, y, ds, ds + 2); c.fillStyle = col; c.fillRect(x + 2, y + 3, ds - 4, 4); c.fillStyle = '#e8e2d0'; c.fillRect(x + 1, y - 2, 1.5, 3); c.fillRect(x + ds - 2.5, y - 2, 1.5, 3); }
      else {
        c.fillStyle = big ? '#5a3d22' : cy === 0 ? '#f0d9a0' : col;
        c.fillRect(x, y, ds, big ? ds + 2 : ds);
        if (big) { c.fillStyle = cls === 'gen' ? '#ffd24a' : col; c.fillRect(x + 1, y + 1, ds - 2, ds - 1); }
        else if (cy === 0) { c.fillStyle = col; c.fillRect(x + 0.5, y + 1, ds - 1, ds - 1); }
      }
    }
    c.restore();
    // estandarte
    const bx = r.x, by = r.y - 2;
    c.strokeStyle = '#2a1c10'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx, by + 6); c.lineTo(bx, by - 14); c.stroke();
    c.fillStyle = rout ? '#f4f4f4' : cls === 'gen' ? '#ffd24a' : col; c.fillRect(bx, by - 15, 13, 10); c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 0.8; c.strokeRect(bx, by - 15, 13, 10);
    if (!rout) {
      c.fillStyle = cls === 'gen' ? '#5a1a10' : '#fff'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ele ? 'E' : r.u.g, bx + 6.5, by - 9.5);
      const m = Math.max(0, r.mor / r.morMax);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(bx - 14, by + 8, 28, 3.5);
      c.fillStyle = m > 0.5 ? '#7ddc5a' : m > 0.25 ? '#f0c040' : '#e8503a'; c.fillRect(bx - 14, by + 8, 28 * m, 3.5);
      if (r.charge > 0) { c.fillStyle = '#fff'; c.font = 'bold 10px sans-serif'; c.fillText('¡CARGA!', bx, by - 22); }
    }
  };

  root.Battle = Battle; root.BattleView = BattleView;
  if (typeof module !== 'undefined') module.exports = { Battle: Battle };
})(typeof window !== 'undefined' ? window : globalThis);
