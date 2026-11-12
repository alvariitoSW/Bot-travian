/* AQVILA — motor de batalla táctica en tiempo real (simulación + vista) */
(function (root) {
  const D = root.DATA;
  const FW = 600, CONTACT = 50;
  // --- Ritmo, moral y cansancio (A8) ---
  const RITMO = 0.028;          // multiplica todo el daño: hace las batallas igualadas de 8 a 12 minutos
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
  const AGUANTAR_DEF = 1.15;    // quien aguanta quieto recibe 1/1,15 del daño
  const HOSTIGAR_DIST = 40;     // el hostigador se aparta si un enemigo cuerpo a cuerpo está a menos
  const HOSTIGAR_FAT = 0.5;     // el hostigador se cansa la mitad al moverse
  const RELEVO_ATRAS = 60;      // lo que retrocede el cansado en un relevo
  const RELEVO_CANSADO = 40;    // cansancio desde el que quien recibe 'relevar' es el que se retira
  const RETIRADA_CASTIGO = 0.7; // castigo (× golpe normal) a quien se retira sin que otro regimiento lo cubra
  const RETIRADA_DIST = 60;     // un enemigo a menos de esto castiga la retirada
  const MOR_GENERAL = 4;        // moral que pierde su bando al caer el general (antes 12)
  const MOR_FLANCO = 0.02;      // moral por segundo perdida estando flanqueado
  const MOR_PERDIENDO = 0.05;   // moral por segundo perdida (máx.) si su bando tiene menos hombres que el otro
  const MOR_HERIDO = 0.3;       // moral por segundo perdida con el regimiento al 0 % de hombres (proporcional a sus bajas)
  const MOR_CANSADO = 0.05;     // moral por segundo perdida con cansancio al máximo (empieza en FAT_UMBRAL)
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
  const COLINA_PEGA = 0.15;     // el regimiento en alto pega (y el de abajo pega menos) hasta ±15 % según la diferencia de altura
  const COLINA_ALCANCE = 0.15;  // los tiradores en lo alto de la colina tienen +15 % de alcance
  const FAT_SUBIDA = 4;         // cansancio al subir de una celda llana a una de colina (proporcional a la altura que se gana)
  const FAT_CUESTA = 0.5;       // cansancio por segundo peleando cuesta arriba (diferencia de altura 1)
  const BOSQUE_VEL = 0.78;       // velocidad dentro del bosque
  const BOSQUE_PROY = 0.7;      // el daño de proyectiles que recibe un regimiento dentro del bosque
  // campo tipo por ciudad (lo que no está aquí sale de la semilla); las manchas se repiten giradas 180° para el otro bando
  const TERRENO_CIUDAD = { roma: 'colina', volsinii: 'bosque', capua: 'llano', tarentum: 'llano', mediolanum: 'bosque', messana: 'colina', syracusae: 'mixto', agrigentum: 'colina',
    panormus: 'llano', lilybaeum: 'llano', carales: 'bosque', emporion: 'mixto', saguntum: 'colina', carthagonova: 'mixto', ambracia: 'bosque', pella: 'colina', corinthus: 'mixto', carthago: 'llano' };
  const TERRENOS = { llano: { n: 'Llano', f: [] },
    colina: { n: 'Colina', f: [['h', 0.25, 0.86, 100], ['h', 0.72, 0.62, 90]] },
    bosque: { n: 'Bosque', f: [['b', 0.2, 0.85, 75], ['b', 0.78, 0.74, 65], ['b', 0.62, 0.56, 60]] },
    mixto: { n: 'Mixto', f: [['h', 0.28, 0.88, 90], ['b', 0.75, 0.8, 65], ['h', 0.5, 0.5, 80], ['b', 0.2, 0.62, 55]] } };
  const TERRENO_IDS = ['llano', 'colina', 'bosque', 'mixto'];
  // --- Rondas (N2): plan en pausa y ejecución de unos segundos para los dos bandos ---
  const RONDA_SEG = 20;         // segundos de simulación de cada ronda de ejecución
  const ESPERA_SEG = 10;        // «espera 10 s y avanza»: la orden empieza a los 10 s de la ronda
  const DIST_CARGAN = 120;      // «si te cargan»: un enemigo que corre o carga a menos de esto
  const CONDICIONES = { aguanta: 'Si te cargan, aguanta', nopersigue: 'Si huyen, no persigas', espera: 'Espera 10 s y avanza' };

  function mkRng(seed) { let a = seed >>> 0; const f = function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; f.estado = function () { return a; }; f.fija = function (v) { a = v; }; return f; }
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
    this.rnd = mkRng(cfg.seed || 1);
    this.mkTerreno(cfg.terreno);
    this.genDown = [false, false]; this.cartas = CARTAS.slice(); this.cartaPlan = null; this.cartaRonda = 0;
    // mismo tamaño de regimiento para ambos bandos (máx. ~12 regimientos por ejército)
    let big = 0;
    for (const sd of cfg.sides) { let t = 0; for (const k in sd.units) if (D.UNITS[k].cls !== 'ele') t += sd.units[k]; big = Math.max(big, t); }
    this.size = Math.max(30, Math.ceil(big / 12));
    for (let s = 0; s < 2; s++) this.deploy(s, cfg.sides[s]);
    this.start = [this.men(0), this.men(1)];
  }

  // terreno por defecto de una ciudad (id) o, si no está en la tabla, por semilla
  Battle.terrenoDe = function (city, seed) { return TERRENO_CIUDAD[city] || TERRENO_IDS[Math.abs(Math.floor(seed || 0)) % TERRENO_IDS.length]; };
  Battle.TERRENOS = TERRENOS; Battle.TERRENO_CIUDAD = TERRENO_CIUDAD; Battle.CELDA = CELDA;

  // cuadrícula de terreno: alt (0, 0,5 o 1) y bosque (0/1) por celda; ambos bandos tienen manchas equivalentes en su zona
  Battle.prototype.mkTerreno = function (id) {
    const def = TERRENOS[id] || TERRENOS.llano, H = this.H, cols = Math.ceil(FW / CELDA), rows = Math.ceil(H / CELDA);
    const T = { id: TERRENOS[id] ? id : 'llano', nombre: def.n, cols: cols, rows: rows, alt: new Array(cols * rows).fill(0), bos: new Array(cols * rows).fill(0), plano: !def.f.length };
    for (const f of def.f) for (const m of [1, -1]) {
      const cx = m > 0 ? f[1] * FW : FW - f[1] * FW, cy = m > 0 ? f[2] * H : H - f[2] * H, R = f[3];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const d = Math.hypot((c + 0.5) * CELDA - cx, (r + 0.5) * CELDA - cy), i = r * cols + c;
        if (f[0] === 'b') { if (d < R) T.bos[i] = 1; } else { const v = 1 - d / R, a = v >= 0.66 ? 1 : v >= 0.33 ? 0.5 : 0; if (a > T.alt[i]) T.alt[i] = a; }
      }
    }
    this.tr = T; this.celdas = {};
  };
  // {alt, bosque} en el punto (x,y) del campo; objetos compartidos (no se modifican)
  const LLANO = { alt: 0, bosque: 0 };
  Battle.prototype.terrenoEn = function (x, y) {
    const T = this.tr; if (T.plano) return LLANO;
    const c = Math.max(0, Math.min(T.cols - 1, Math.floor(x / CELDA))), r = Math.max(0, Math.min(T.rows - 1, Math.floor(y / CELDA))), i = r * T.cols + c;
    return this.celdas[i] || (this.celdas[i] = { alt: T.alt[i], bosque: T.bos[i] });
  };
  Battle.prototype.rango = function (r) { return r.u.range * (1 + COLINA_ALCANCE * this.terrenoEn(r.x, r.y).alt); };

  Battle.PAPEL = PAPEL; Battle.PAPEL_NOMBRE = PAPEL_NOMBRE; Battle.papelDe = papelDe;
  Battle.prototype.men = function (side) { let n = 0; for (const r of this.regs) if (r.side === side && r.st === 'ok') n += r.men; return n; };

  Battle.prototype.mk = function (side, k, men, a) {
    const u = D.UNITS[k], hp = u.hp || 1;
    let def = a.defMul || 1;
    if (this.cfg.defender === side) def *= 1 + 0.1 * (this.cfg.wall || 0);
    const mor = u.mor + (a.mor || 0);
    return {
      id: this.regs.length + 1, side: side, k: k, u: u, men: men, max: men, hp: men * hp, mor: mor, morMax: mor,
      x: 0, y: 0, ang: side === 0 ? -Math.PI / 2 : Math.PI / 2, st: 'ok', tgt: null, order: null,
      think: this.rnd() * 0.5, cd: this.rnd() * 1.6, ammo: u.range ? 14 : 0, fight: 0, charge: 0, run: 0, flank: 0, fat: 0, mv: false, corre: false, choque: 0, choqueMor: 0, tCorre: -99, cont: 0, contagiado: 0, reagrupado: 0,
      papel: papelDe(k, u), vel: u.spd * (PAPEL_VEL[papelDe(k, u)] || 1),
      atkMul: (a.atkMul || 1) * (0.92 + this.rnd() * 0.16), defMul: def // ±8 % de fortuna por regimiento
    };
  };

  Battle.prototype.deploy = function (side, a) {
    const list = [], size = this.size;
    for (const k in a.units) {
      const n = Math.floor(a.units[k]); if (n <= 0) continue;
      const sz = D.UNITS[k].cls === 'ele' ? 8 : size, cnt = Math.max(1, Math.round(n / sz));
      for (let i = 0; i < cnt; i++) { const r = this.mk(side, k, Math.floor(n / cnt) + (i < n % cnt ? 1 : 0), a); this.regs.push(r); list.push(r); }
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
    return side === 0 ? { x0: 20, x1: FW - 20, y0: Math.max(H - 260, H * 0.6), y1: H - 24 } : { x0: 20, x1: FW - 20, y0: 24, y1: Math.min(260, H * 0.4) };
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
      const n = foot.length + eles.length, minSp = 34, sp = k => (FW / 2 - 20) / ((k - 1) / 2 + (cav.length ? 1 : 0));
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
    // separación: se estrecha si las alas no caben en el campo (x entre 20 y FW-20)
    const SP = Math.min(62, (FW / 2 - 20) / ((maxN - 1) / 2 + (cav.length && alas ? 1 : 0)));
    rows.forEach((row, i) => row.forEach((r, j) => { r.x = FW / 2 + (j - (row.length - 1) / 2) * SP; r.y = base - f * esp * i; }));
    // caballería: repartida entre las dos alas, en columna hacia atrás (en 'centro' ya va en reserva)
    if (alas) { const wx = ((maxN - 1) / 2 + 1) * SP, cnt = [0, 0]; cav.forEach((r, i) => { const w = i % 2; r.x = FW / 2 + (w ? wx : -wx); r.y = base - f * esp * cnt[w]++; }); }
    const z = nombre === 'clasica' ? { y0: 24, y1: this.H - 24 } : this.zona(side);
    for (const r of mine) { r.y = Math.max(z.y0, Math.min(z.y1, r.y)); r.x = Math.max(20, Math.min(FW - 20, r.x)); }
  };

  // formaciones «linea», «tres» y «alas»: colocan por posiciones y al final separan lo que se solape, siempre dentro de la zona
  Battle.prototype.formarNueva = function (side, nombre, mine, gen, list, f, base) {
    const z = this.zona(side), back = d => base - f * d; // back(d): d unidades hacia atrás de la línea base
    const rank = r => (r.k === 'hastati' ? 0 : r.k === 'triarii' ? 2 : 1);
    const foot = list.filter(r => r.u.cls === 'inf' || r.u.cls === 'spear' || r.u.cls === 'ele'), cav = list.filter(r => r.u.cls === 'cav'), skirm = list.filter(r => r.u.cls === 'rng');
    const centrar = (fila, eles) => { const m = Math.floor(fila.length / 2); return fila.slice(0, m).concat(eles, fila.slice(m)); };
    // pone una fila centrada en x0 con separación sp (se estrecha si no cabe en el campo)
    const fila = (rs, y, sp, x0, mx) => { const n = rs.length, s = n > 1 ? Math.min(sp, ((mx || FW - 40)) / (n - 1)) : 0; rs.forEach((r, j) => { r.x = (x0 == null ? FW / 2 : x0) + (j - (n - 1) / 2) * s; r.y = y; }); };
    const eles = foot.filter(r => r.u.cls === 'ele'), pie = foot.filter(r => r.u.cls !== 'ele');
    if (nombre === 'linea') {
      // una sola fila fina de infantería (dos solo si no cabe), tiradores justo detrás, caballería en las alas, general en el centro atrás
      const todo = centrar(pie.slice(), eles), per = Math.max(1, Math.min(todo.length, 12)), cn = cav.length ? 110 : 0;
      let yy = 0; const sp = 46;
      while (todo.length) { fila(todo.splice(0, per), back(yy), sp, null, FW - 40 - cn); yy += 44; }
      const sk = skirm.slice(); while (sk.length) { fila(sk.splice(0, per), back(yy), 40); yy += 34; }
      if (gen) { gen.x = FW / 2; gen.y = back(yy + 10); }
      const wx = Math.min(FW / 2 - 25, (Math.min(per, pie.length + eles.length) - 1) / 2 * Math.min(sp, (FW - 40 - cn) / Math.max(1, per - 1)) + 55);
      cav.forEach((r, i) => { r.x = FW / 2 + (i % 2 ? wx : -wx); r.y = back(Math.floor(i / 2) * 44); });
    } else if (nombre === 'tres') {
      // triplex acies: hastati, principes y triarii en tres filas con huecos; tiradores delante (vélites); caballería en las alas
      const orden = pie.slice().sort((a, b) => rank(a) - rank(b)), tres = [[], [], []], q = Math.ceil(orden.length / 3);
      orden.forEach((r, i) => tres[Math.min(2, Math.floor(i / q))].push(r));
      tres[1] = centrar(tres[1], eles);
      const cn = cav.length ? 100 : 0, esp = 56;
      tres.forEach((fl, i) => fila(fl, back(i * esp), 78, FW / 2 + (i === 1 ? 39 * (fl.length > 1 ? 1 : 0) : 0), FW - 40 - cn)); // 2.ª fila a tresbolillo
      fila(skirm.slice(), back(-50), 58, null, FW - 40 - cn);
      if (gen) { gen.x = FW / 2; gen.y = back(3 * esp); }
      const wx = FW / 2 - 28;
      cav.forEach((r, i) => { r.x = FW / 2 + (i % 2 ? wx : -wx); r.y = back(Math.floor(i / 2) * 50); });
    } else {
      // alas fuertes: centro flojo y retrasado; infantería pesada y caballería en los dos flancos
      const orden = pie.slice().sort((a, b) => b.hp - a.hp), nc = orden.length < 3 ? 0 : Math.ceil(orden.length / 3), pesada = orden.slice(0, orden.length - nc), centro = centrar(orden.slice(orden.length - nc), eles);
      pesada.forEach((r, i) => { const lado = i % 2, k = Math.floor(i / 2); r.x = lado ? FW - 100 - (k % 2) * 50 : 100 + (k % 2) * 50; r.y = back(Math.floor(k / 2) * 50); });
      while (centro.length) fila(centro.splice(0, 4), back(70 + 0), 52, null, 200);
      fila(skirm.slice(), back(10), 40, null, 220);
      if (gen) { gen.x = FW / 2; gen.y = back(125); }
      cav.forEach((r, i) => { r.x = i % 2 ? FW - 36 : 36; r.y = back(Math.floor(i / 2) * 50); });
    }
    this.separar(mine, z, f);
  };

  // lo que quede solapado o fuera de la zona se mueve al hueco libre más cercano dentro de la zona
  Battle.prototype.separar = function (mine, z, f) {
    const MIN = 26, put = (r, x, y) => { r.x = Math.max(20, Math.min(FW - 20, x)); r.y = Math.max(z.y0, Math.min(z.y1, y)); }, done = [];
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
    const dx = x - r.x, dy = y - r.y, d = Math.hypot(dx, dy);
    if (d < 1) return 0;
    this.turn(r, Math.atan2(dy, dx), dt);
    const t0 = this.terrenoEn(r.x, r.y);
    const m = Math.min(r.vel * (r.cartaFx === 'paso' ? PASO_DOBLE : 1) * (mul || PASO_MARCHA) * (1 - FAT_ANDA * r.fat / 100) * (t0.bosque ? BOSQUE_VEL : 1) * dt, d);
    r.mv = true; r.fat = Math.min(100, r.fat + FAT_MARCHA * dt * (mul > 1 ? 1.6 : 1) * (PAPEL_FAT[r.papel] || 1) * (tipoDe(r) === 'hostigar' ? HOSTIGAR_FAT : 1));
    r.x += dx / d * m; r.y += dy / d * m; r.run += m;
    const t1 = this.terrenoEn(r.x, r.y); if (t1.alt > t0.alt) r.fat = Math.min(100, r.fat + FAT_SUBIDA * (t1.alt - t0.alt));   // cuesta arriba
    return d - m;
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
  Battle.estadoMoral = estadoMoral; Battle.prototype.estadoMoral = estadoMoral;
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

  Battle.prototype.hit = function (a, b, amount, ranged) {
    const prev = b.men, hp = b.u.hp || 1;
    // flanqueo
    const da = Math.abs(angDiff(Math.atan2(a.y - b.y, a.x - b.x), b.ang));
    let fl = 1;
    if (da > 2.1) fl = 1.6; else if (da > 1.15) fl = 1.3;
    if (fl > 1) { b.flank = 1; if (b.k === 'falange') fl *= 1.35; else if (b.papel === 'lanceros') fl *= LANCEROS_FLANCO; } // la falange es muy vulnerable por los flancos
    let m = amount * RITMO * fl * (1 - FAT_PEGA * a.fat / 100);
    { const ea = estadoMoral(a), eb = estadoMoral(b); m *= ea === 2 ? DESORDEN_PEGA : ea === 1 ? VACILANTE_PEGA : 1; if (eb === 2) m *= DESORDEN_RECIBE; if (b.cartaFx === 'cerrada') m *= CERRADA_RECIBE; }
    if (tipoDe(b) === 'aguantar' && !b.mv) m /= AGUANTAR_DEF;
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
      if (o.side !== b.side) { o.mor = Math.min(o.morMax, o.mor + 1.5); continue; }
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
        if (r.cd <= 0) { r.cd = 1.6; r.ammo--; this.hit(r, tgt, effN(r.men) * ratio(r.u.ratk * r.atkMul, tgt.u.def * tgt.defMul) * 0.03 * 1.6 * 0.6 * PROY_MUL, true); this.fx.push({ x0: r.x, y0: r.y, x1: tgt.x, y1: tgt.y, t: 0, n: Math.min(6, 1 + (r.men >> 4)) }); }
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
      r.st = 'ok'; r.mor = Math.max(1, r.morMax * REAGRUPA_MOR); r.order = null; r.tgt = null; r.charge = 0; r.choque = 0; r.reagrupado = (r.reagrupado || 0) + 1;
      this.nota(nombreReg(r) + ' se reagrupa junto a su general');
    }
  };

  Battle.prototype.step = function (dt) {
    if (this.over || this.fase === 'despliegue' || this.fase === 'plan') return;
    this.t += dt;
    const regs = this.regs, cur = [this.men(0), this.men(1)];
    if (this.rondas) for (const r of regs) if (r.pend && this.tRonda >= (r.pendT || ESPERA_SEG) - 1e-6) { r.order = Object.assign({}, r.pend, { cond: null }); r.pend = null; r.pendT = 0; }   // «espera 10 s» o retraso de mando: ya toca avanzar
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
      if (r.choque > 0) r.choque -= dt;
      const collapse = cur[r.side] < this.start[r.side] * 0.15;
      if (collapse) r.mor -= 1.5 * dt;
      r.mv = false; r.corre = false;
      if (r.flank) r.mor -= MOR_FLANCO * dt;
      const mia = cur[r.side] / this.start[r.side], suya = cur[1 - r.side] / this.start[1 - r.side];
      if (mia < suya) r.mor -= MOR_PERDIENDO * Math.min(1, (suya - mia) * 8) * dt;
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
        if (this.moveTo(r, r.order.x, r.order.y, dt, ret ? 1 : PASO_MARCHA) < 6) r.order = r.order.cond === 'nopersigue' ? { k: 'quieto' } : null;
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
              this.fx.push({ x0: r.x, y0: r.y, x1: tgt.x, y1: tgt.y, t: 0, n: Math.min(6, 1 + (r.men >> 4)) });
            }
          } else if (!quieto) this.moveTo(r, tx, ty, dt, paso(r, d));
          else this.turn(r, Math.atan2(tgt.y - r.y, tgt.x - r.x), dt);
        } else if (d > CONTACT) {
          const left = quieto ? 1e9 : this.moveTo(r, tx, ty, dt, paso(r, d));
          if (left <= CONTACT && (r.u.cls === 'cav' || r.u.cls === 'gen' || r.u.cls === 'ele') && r.run > 90 && r.fat < FAT_AGOTADO) { r.charge = 2.5; r.fat = Math.min(100, r.fat + FAT_CARGA * (r.u.cls === 'cav' || r.u.cls === 'gen' ? 1.8 : r.u.cls === 'ele' ? 1.2 : 1)); }
        } else {
          if (r.fight <= 0) { r.cont = 0; r.choqueMor = 0; if (r.charge > 0 || (this.t - r.tCorre < CHOQUE_RECIENTE && (r.u.cls !== 'inf' && r.u.cls !== 'spear' || tipoDe(r) === 'cargar'))) r.choque = CHOQUE_SEG; }   // contacto nuevo: ¿es un choque?
          r.cont += dt;
          fighting = true; r.run = 0; r.fat = Math.min(100, r.fat + FAT_PELEA * dt * (r.u.cls === 'cav' || r.u.cls === 'gen' ? 1.6 : 1 / Math.sqrt(r.u.mass || 1)));
          { const dh = this.terrenoEn(tgt.x, tgt.y).alt - this.terrenoEn(r.x, r.y).alt; if (dh > 0) r.fat = Math.min(100, r.fat + FAT_CUESTA * dh * dt); }   // ataca cuesta arriba
          this.turn(r, Math.atan2(tgt.y - r.y, tgt.x - r.x), dt);
          // solo pelea el frente: las filas de atrás no pegan (el relevo es implícito al bajar el número)
          const frente = Math.min(1, FRENTE_HOMBRES / Math.max(1, r.men));
          this.hit(r, tgt, effN(r.men * (r.u.mass || 1)) * frente * ratio(r.u.atk * r.atkMul, tgt.u.def * tgt.defMul) * 0.03 * dt, false);
          if (r.charge > 0 && r.u.cls === 'cav' && this.ligera(tgt)) { const dx = tgt.x - r.x, dy = tgt.y - r.y, dl = Math.hypot(dx, dy) || 1; tgt.x += dx / dl * EMPUJE_CAB * dt; tgt.y += dy / dl * EMPUJE_CAB * dt; }
        }
      }
      if (!fighting && !r.mv) r.fat = Math.max(0, r.fat - FAT_DESCANSO * dt);
      r.fight = fighting ? 0.4 : Math.max(0, r.fight - dt);
      if (!fighting && r.fight <= 0) { r.mor = Math.min(r.morMax, r.mor + 1.5 * dt); r.flank = 0; r.cont = 0; }
      r.x = Math.max(20, Math.min(FW - 20, r.x)); r.y = Math.max(20, Math.min(this.H - 20, r.y));
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
    for (const f of this.fx) f.t += dt;
    if (this.fx.length && this.fx[0].t > 0.5) this.fx = this.fx.filter(f => f.t <= 0.5);
    const n0 = this.men(0), n1 = this.men(1);
    if (n0 <= 0 || n1 <= 0) { this.over = true; this.winner = n0 > 0 ? 0 : 1; }
    else if (this.t > TOPE_BATALLA) { this.over = true; this.winner = this.cfg.defender; }
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
    return { t: this.t, rnd: this.rnd.estado(), fase: this.fase, ronda: this.ronda, tRonda: this.tRonda, over: this.over, winner: this.winner, auto: this.auto, genDown: this.genDown.slice(), cartas: this.cartas.slice(), cartaPlan: this.cartaPlan, cartaRonda: this.cartaRonda, start: this.start.slice(),
      corpses: this.corpses.map(function (c) { return Object.assign({}, c); }), fx: this.fx.map(function (f) { return Object.assign({}, f); }),
      regs: this.regs.map(function (r) { const c = Object.assign({}, r); c.tgt = r.tgt ? idx.get(r.tgt) : null; c.order = ref(r.order); c.pend = ref(r.pend); return c; }) };
  };
  // vuelve a un estado guardado SIN cambiar la identidad de los regimientos (la vista 3D los tiene agarrados)
  Battle.prototype.aplicar = function (e) {
    const regs = this.regs, ref = function (o) { return o ? Object.assign({}, o, 'r' in o ? { r: regs[o.r] } : {}) : null; };
    e.regs.forEach(function (c, i) { Object.assign(regs[i], c); regs[i].tgt = c.tgt == null ? null : regs[c.tgt]; regs[i].order = ref(c.order); regs[i].pend = ref(c.pend); });
    this.t = e.t; this.rnd.fija(e.rnd); this.fase = e.fase; this.ronda = e.ronda; this.tRonda = e.tRonda; this.over = e.over; this.winner = e.winner; this.auto = e.auto;
    this.cartas = e.cartas.slice(); this.cartaPlan = e.cartaPlan; this.cartaRonda = e.cartaRonda; this.genDown = e.genDown.slice(); this.start = e.start.slice(); this.corpses = e.corpses.map(function (c) { return Object.assign({}, c); }); this.fx = e.fx.map(function (f) { return Object.assign({}, f); });
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
    const mp = this.mandoPuntos();
    if (mp.usados > mp.max) { this.motivo = 'Tienes ' + mp.usados + ' órdenes y solo ' + mp.max + ' puntos de mando'; return false; }
    const g = this.generalVivo(0);
    for (const r of this.regs) {
      r.pend = null; r.pendT = 0; r.cartaFx = null;
      if (r.st !== 'ok' || !r.order) continue;
      if (r.order.cond === 'espera') { r.pend = r.order; r.pendT = ESPERA_SEG; r.order = { k: 'quieto' }; }
      if (g && r.side === 0 && r !== g && r.order.k !== 'quieto' && this.fueraDeMando(r, g)) { if (!r.pend) r.pend = r.order; r.pendT = Math.max(r.pendT, MANDO_RETRASO); r.order = { k: 'quieto' }; }
    }
    if (this.cartaPlan && g) {   // la carta jugada en el plan se aplica a los propios dentro del radio
      for (const r of this.regs) if (r.side === 0 && r.st === 'ok' && !this.fueraDeMando(r, g)) { r.cartaFx = this.cartaPlan; if (this.cartaPlan === 'arenga') r.mor = Math.min(r.morMax, r.mor + ARENGA_MORAL * r.morMax); }
    }
    this.cartaPlan = null;
    this.snapIni = this.estado(); this.notas = []; this.fase = 'ejecucion'; this.tRonda = 0; this.repite = false; return true;
  };
  Battle.prototype.generalVivo = function (side) { return this.regs.find(function (q) { return q.side === side && q.k === 'general' && q.st === 'ok'; }) || null; };
  Battle.prototype.fueraDeMando = function (r, g) { return Math.hypot(g.x - r.x, g.y - r.y) > MANDO_RADIO; };
  // puntos de mando del bando 0: cada regimiento vivo con orden activa (no «Aguantar») gasta uno
  Battle.prototype.mandoPuntos = function () {
    const max = this.generalVivo(0) ? MANDO_PUNTOS : MANDO_PUNTOS_SIN;
    let usados = 0; for (const r of this.regs) if (r.side === 0 && r.st === 'ok' && r.order && r.order.k !== 'quieto') usados++;
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
    this.hechos = this.cronica(); this.fase = 'plan'; this.ronda++; this.tRonda = 0; this.snapFin = this.estado();
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
  Battle.prototype.prevision = function () {
    const c = this.clona(); c.rondas = true; c.fase = 'plan';
    for (const r of c.regs) if (r.side === 1 && r.st === 'ok') r.order = { k: 'quieto' };
    c.ejecutar(); let n = 0; while (c.fase === 'ejecucion' && !c.over && n++ < 400) c.step(0.1);
    return c.regs.filter(function (r) { return r.side === 0; }).map(function (r) { return { id: r.id, x: r.x, y: r.y, st: r.st, men: r.men }; });
  };
  // «prever choque»: si los dos ejércitos chocaran ya (sin órdenes), ¿quién gana? Devuelve fracciones de hombres que conserva cada bando.
  Battle.prototype.preverChoque = function () {
    const c = this.clona(); c.rondas = false; c.fase = 'lucha'; c.auto = true;
    for (const r of c.regs) { r.order = null; r.pend = null; r.tgt = null; }
    let n = 0; while (!c.over && n++ < 2000) c.step(0.2);
    const s0 = Math.max(1, this.men(0)), s1 = Math.max(1, this.men(1)), f0 = c.men(0) / s0, f1 = c.men(1) / s1;
    return { f0: f0, f1: f1, gana: f0 === f1 ? -1 : f0 > f1 ? 0 : 1, claro: Math.abs(f0 - f1) > 0.2 };
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
    const sc = Math.min(w / FW, h / this.b.H);
    this.cv.style.width = FW * sc + 'px'; this.cv.style.height = this.b.H * sc + 'px';
    this.cv.width = Math.round(FW * sc * dpr); this.cv.height = Math.round(this.b.H * sc * dpr);
    this.k = sc * dpr; this.sc = sc;
  };

  BattleView.prototype.makeBg = function () {
    const c = document.createElement('canvas'); c.width = FW; c.height = this.b.H;
    const g = c.getContext('2d'), rnd = mkRng(this.b.cfg.seed || 7);
    const gr = g.createLinearGradient(0, 0, 0, this.b.H); gr.addColorStop(0, '#7d9150'); gr.addColorStop(0.5, '#93a35c'); gr.addColorStop(1, '#84964f');
    g.fillStyle = gr; g.fillRect(0, 0, FW, this.b.H);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(60,80,30,0.10)' : 'rgba(200,190,120,0.10)';
      g.beginPath(); g.ellipse(rnd() * FW, rnd() * this.b.H, 10 + rnd() * 46, 6 + rnd() * 20, rnd() * 3, 0, 7); g.fill();
    }
    // camino
    g.strokeStyle = 'rgba(190,165,110,0.55)'; g.lineWidth = 26; g.beginPath(); g.moveTo(FW * 0.42, 0); g.bezierCurveTo(FW * 0.7, this.b.H * 0.3, FW * 0.3, this.b.H * 0.6, FW * 0.55, this.b.H); g.stroke();
    // árboles en los bordes
    for (let i = 0; i < 46; i++) {
      const left = rnd() < 0.5, x = left ? rnd() * 34 : FW - rnd() * 34, y = rnd() * this.b.H, r = 8 + rnd() * 9;
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.arc(x + 3, y + 4, r, 0, 7); g.fill();
      g.fillStyle = rnd() < 0.5 ? '#3f6a2c' : '#4d7a33'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 0, 7); g.fill();
    }
    // muralla del defensor
    const wall = this.b.cfg.wall || 0;
    if (wall > 0) {
      const y = this.b.cfg.defender === 0 ? this.b.H - 46 : 14;
      g.fillStyle = '#8d8676'; g.fillRect(0, y, FW, 32); g.fillStyle = '#6f695b'; g.fillRect(0, y + 26, FW, 6);
      g.fillStyle = '#a39b88';
      for (let x = 4; x < FW; x += 18) g.fillRect(x, y - 5, 10, 7);
      for (let x = 60; x < FW; x += 160) { g.fillStyle = '#7b7566'; g.fillRect(x - 20, y - 12, 40, 50); g.fillStyle = '#a39b88'; g.fillRect(x - 20, y - 16, 10, 6); g.fillRect(x - 5, y - 16, 10, 6); g.fillRect(x + 10, y - 16, 10, 6); }
      g.fillStyle = '#4a3a22'; g.fillRect(FW / 2 - 16, y + 4, 32, 28);
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
