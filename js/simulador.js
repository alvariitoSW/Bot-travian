/* AQVILA — CG3 (18/11/2026): el SIMULADOR DE BATALLAS por manípulos, solo lógica. Corre en Node y en el navegador (global `Simulador`).
   Objetivo y vara: gobierno/estudios/CG1-objetivo-batalla.md (§5 y §9). Todavía no lo usa el juego: lo enlaza CG4.

   QUÉ SIMULA. Cada manípulo (de 60 a 120 hombres, con los datos de su tropa en D.UNITS) es un rectángulo en el campo, en metros.
   Se mueve a un destino, forma (línea, columna, cuña, orden abierto, testudo, muro de escudos, falange de picas: según lo que su
   tropa sepa, tabla SABE), se cansa, carga, flanquea, pierde moral, duda, se rompe y huye. Los tribunos (tres por bando, uno por ala)
   llevan los manípulos que el jugador no toca. El paso de tiempo es fijo (PASO = 0,2 s) y el azar es un número del estado:
   el mismo estado inicial, la misma semilla y las mismas órdenes dan la misma batalla. El estado S es JSON puro: se guarda y se carga.

   REGLAS QUE SE REUTILIZAN de js/guerra.js, sin cambiarla (la batalla vieja sigue viva hasta CG4):
   · importadas: Guerra.CARACTER (calidad, cansancio, mente, firmeza, flanco de cada tropa), Guerra.POSTURAS (cuánto protegen
     escudos y testudo de los proyectiles, cuánto cansan) y Guerra.tiroDe (alcance, ritmo y munición de los tiradores);
   · copiadas, con su nombre de allí (no están exportadas): la fuerza en el choque (`fuerza`), el reparto de bajas y moral del choque,
     la mente del que lucha (`mente`), K_BAJAS, BASE_FATIGA, DESCANSO, T_RELEVO, T_DESHACER, SUSTO, SALVA, ARROJA, BLANCO, VIDA,
     el testudo que se deshace al chocar y los elefantes que se desbocan.

   API: crear(cfg) · paso(S) · avanzar(S, segundos, programadas?) · ordenar(S, orden) · puede(S, orden) · retirarse(S) · resumen(S)
        guardar(S) · cargar(texto) · vista(S) · palabras(u) · ordenesDe(S, id) · tablas SABE, FORMAS, TAM, TRIBUNOS
   cfg = { semilla, ejercitos: [{tropa: n}, {tropa: n}] }        → despliegue clásico (Roma en tres líneas; el enemigo en una o dos)
       o { semilla, manipulos: [{lado, tropa, n, x, y, a?, forma?, ala?, mando?, fatiga?, moral?, tras?}] }   → a mano (pruebas, CG5)
       + tribunos: [[{n, car}×3], [{n, car}×3]] (opcional) · planes: [[plan×3], [plan×3]] (opcional) · limite: segundos (900)
   orden = { tipo, lado, ids, ... }: ver ordenar(). Historia y licencias: al final de las tablas y en el parte de CG3. */
(function (root) {
  'use strict';
  let D = root.DATA, G = root.Guerra;
  if (typeof require !== 'undefined') {
    try { if (!D) D = require('./data.js'); } catch (e) { /* sin datos */ }
    try { if (!G) G = require('./guerra.js'); } catch (e) { /* sin guerra: tablas vacías */ }
  }
  const UN = (D && D.UNITS) || {};
  const CARACTER = (G && G.CARACTER) || {}, GENERICO = (G && G.GENERICO) || { cal: 1, cansa: 1, mente: 'media' };
  const POSTURAS = (G && G.POSTURAS) || { escudos: { recibe: 0.42, cansa: 1 / 90 }, testudo: { recibe: 0.1, cansa: 1 / 40 } };
  const tiroDe = (G && G.tiroDe) || (() => ({ arma: 'jabalinas', alc: 30, tiro: 0.032, mun: 15 }));

  /* ---------- copiado de js/guerra.js (mismos nombres y cifras; allí no se exportan) ---------- */
  const K_BAJAS = 1.55;             /* hombres por segundo que causa una fuerza de 1 */
  const BASE_FATIGA = 1 / 42;       /* empujando sin parar, una línea se agota en unos 40 s */
  const DESCANSO = 1 / 120;         /* una línea en retaguardia recobra el aliento despacio */
  const T_RELEVO = 3.2;             /* lo que tarda una línea en pasar por los huecos de la otra */
  const T_DESHACER = 3.5;           /* segundos que tarda un testudo en deshacerse */
  const SUSTO = 0.02;               /* moral que pierde por segundo quien recibe proyectiles sin cubrirse */
  const SALVA = { alc: 14, parte: 0.05 };                                       /* la descarga de pila antes del choque */
  const ARROJA = { hastati: 'pila', principes: 'pila', iberos: 'jabalinas' };
  const BLANCO = { hastati: 0.8, principes: 0.75, triarii: 0.7, galos: 1, libios: 0.6, iberos: 0.75, falange: 0.55, hoplitas: 0.6, sagrada: 0.6, velites: 0.3, peltastas: 0.5, honderos: 0.7, milicia: 0.9, elefantes: 1 };
  const VIDA = { elefantes: 8 };    /* un elefante cuenta como 8 hombres */

  /* ---------- propio del simulador (licencia de juego salvo lo que se dice) ---------- */
  const PASO = 0.2;                 /* segundos por paso: fijo */
  const TIC_TRIBUNO = 5;            /* los tribunos piensan cada 5 pasos (1 s) */
  const CAMPO = { ancho: 1200, largo: 700 };   /* metros; quien sale por su borde de atrás, sale de la batalla */
  const DIST0 = 240;                /* metros entre los frentes al desplegar, como js/guerra.js */
  const LIMITE = 900;               /* segundos: cae la tarde */
  const CONTAGIO = { radio: 70, amigos: 0.06, rivales: 0.05 };   /* una ruptura cercana asusta (guerra.js: −0,13 / +0,1 por cuerpo; aquí, por manípulo) */
  const MORAL_BAJA = 2.5;           /* moral por baja: js/guerra.js usa 1,2 sobre todo el cuerpo (tres líneas); un manípulo solo lo siente más */
  const TENSION = 0.006;            /* moral que gasta por segundo el cuerpo a cuerpo, gane o pierda */

  /* Formaciones. hombre = metros de frente por hombre · filas = filas de fondo · vel = paso · atk = golpe de frente · recibe = daño cuerpo a cuerpo
     de frente · tiro = parte de los proyectiles que hacen baja · flanco = daño extra por el flanco · giro = radianes por segundo · t = segundos
     para formarla · cansa = fatiga por segundo mientras se mantiene · frena = para cargas de caballo y elefantes de frente */
  const FORMAS = {
    linea:   { n: 'Línea',            hombre: 1.0, filas: 6,  vel: 1.0,  atk: 1.0,  recibe: 1.0,  tiro: 1.0,  flanco: 1,   giro: 0.6,  t: 4 },
    columna: { n: 'Columna',          hombre: 1.0, filas: 20, vel: 1.25, atk: 0.6,  recibe: 1.3,  tiro: 1.1,  flanco: 1.3, giro: 1.5,  t: 4 },
    cuna:    { n: 'Cuña',             hombre: 1.0, filas: 12, vel: 1.1,  atk: 1.1,  recibe: 1.15, tiro: 1.0,  flanco: 1.2, giro: 0.8,  t: 6, choque: 1.5 },
    abierto: { n: 'Orden abierto',    hombre: 2.2, filas: 3,  vel: 1.15, atk: 0.75, recibe: 1.25, tiro: 0.5,  flanco: 1,   giro: 1.2,  t: 3 },
    testudo: { n: 'Testudo',          hombre: 0.8, filas: 6,  vel: 0.2,  atk: 0.5,  recibe: 0.9,  tiro: POSTURAS.testudo.recibe, flanco: 1, giro: 0.3, t: T_DESHACER, cansa: POSTURAS.testudo.cansa },
    muro:    { n: 'Muro de escudos',  hombre: 0.9, filas: 8,  vel: 0.55, atk: 0.85, recibe: 0.7,  tiro: POSTURAS.escudos.recibe, flanco: 1.1, giro: 0.4, t: 4, cansa: POSTURAS.escudos.cansa, frena: true },
    falange: { n: 'Falange de picas', hombre: 0.9, filas: 16, vel: 0.6,  atk: 1.3,  recibe: 0.5,  tiro: 0.8,  flanco: 1.3, giro: 0.15, t: 8, frena: true }
  };
  /* Lo que sabe hacer cada tropa; la primera es la de siempre (la que toma el tribuno). La usará CG2 en las fichas.
     Histórico: línea manipular (Polibio 6.21-24); triarios rodilla en tierra tras los escudos, aquí «muro» (Livio 8.8); falange de picas
     (Polibio 18.29-30); muro hoplita. Licencia de juego: testudo en campo abierto (TP0 §11), cuña de hastati y príncipes, cuña gala. */
  const SABE = {
    hastati: ['linea', 'columna', 'abierto', 'testudo', 'cuna'], principes: ['linea', 'columna', 'abierto', 'testudo', 'cuna'],
    triarii: ['linea', 'muro', 'columna'], velites: ['abierto', 'columna'], peltastas: ['abierto', 'columna'], honderos: ['abierto', 'columna'],
    equites: ['linea', 'cuna', 'columna'], jinetes: ['linea', 'cuna', 'columna'], tesalios: ['linea', 'cuna', 'columna'], numidas: ['abierto', 'linea', 'columna'],
    falange: ['falange', 'columna'], hoplitas: ['muro', 'linea', 'columna'], galos: ['linea', 'cuna', 'columna', 'abierto'],
    iberos: ['linea', 'abierto', 'columna'], libios: ['linea', 'muro', 'columna'], sagrada: ['linea', 'muro', 'columna'],
    milicia: ['linea', 'columna'], vigiles: ['linea', 'columna'], elefantes: ['abierto', 'columna'], general: ['linea', 'columna']
  };
  const sabe = t => SABE[t] || ['linea', 'columna'];
  /* Hombres de un manípulo. Histórico: 120, y 60 los triarios (Polibio 6.21-24). Licencia: vélites en grupos de 120 (en Polibio se
     reparten entre los manípulos), dos turmas de 30 jinetes juntas, falange en grupos de 120 (la sintagma era de 256), elefantes de 10 en 10. */
  const TAM = { hastati: 120, principes: 120, triarii: 60, equites: 60, jinetes: 60, numidas: 60, tesalios: 60, elefantes: 10, general: 30 };
  const tam = t => TAM[t] || 120;
  /* Los tribunos de js/maniobra.js (copiados: aquel archivo necesita el mapa). Que cada uno mande un ala: licencia de juego (CG1 §11). */
  const TRIBUNOS = [{ n: 'Quinto Fabio', car: 'prudente' }, { n: 'Marco Claudio', car: 'agresivo' }, { n: 'Cayo Lelio', car: 'astuto' }];
  const JEFES = [{ n: 'Jefe del ala izquierda', car: 'agresivo' }, { n: 'Jefe del centro', car: 'prudente' }, { n: 'Jefe del ala derecha', car: 'astuto' }];
  /* Cómo es cada carácter: relevo = cansancio al que pide relevo · carga = metros a los que carga · persigue · cubre = forma testudo o muro bajo
     los proyectiles · envuelve = busca el flanco del enemigo que ya lucha con otro */
  const CAR = {
    prudente: { relevo: 0.6,  carga: 22, persigue: 0,   cubre: true,  envuelve: false },
    agresivo: { relevo: 0.85, carga: 50, persigue: 140, cubre: false, envuelve: false },
    astuto:   { relevo: 0.7,  carga: 34, persigue: 60,  cubre: true,  envuelve: true }
  };
  const PLANES = ['avanzar', 'aguantar', 'envolver', 'reserva'];

  const limita = (x, a, b) => Math.max(a, Math.min(b, x));
  const car = t => CARACTER[t] || GENERICO;
  const nombre = t => (UN[t] && UN[t].n) || t;
  const cls = t => (UN[t] && UN[t].cls) || 'inf';
  const aPie = t => !esCab(t) && t !== 'elefantes' && cls(t) !== 'ele';   /* CG6b: tropa a pie (el duelo es solo contra infantes) */
  const VEL_APIE = 3.4;   /* CG6b: lo más que corre un manípulo tras su centurión, en veces su paso (1,6 × 3,4 ≈ 5,4 m/s en hastati) */
  const esCab = t => cls(t) === 'cav';
  const esTiro = t => cls(t) === 'rng';
  const esEle = t => cls(t) === 'ele';
  const cal = t => CARACTER[t] ? CARACTER[t].cal : limita(((UN[t] && UN[t].atk) || 10) / 10, 0.3, 1.8);
  const defMul = t => limita(Math.sqrt(10 / ((UN[t] && UN[t].def) || 10)), 0.75, 1.35);
  const morMul = t => limita(Math.sqrt(60 / ((UN[t] && UN[t].mor) || 60)), 0.75, 1.3);
  const velBase = t => ((UN[t] && UN[t].spd) || 30) / 32 * 1.6;   /* m/s andando; hastati 1,6 m/s, équites 3,5 m/s */
  const peso = t => esEle(t) ? 2.2 : esCab(t) ? 1.8 : 1;
  const blanco = t => BLANCO[t] || 0.8;
  const num = k => { let r = ''; for (const [v, l] of [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (k >= v) { r += l; k -= v; } return r; };
  const vivo = u => u.estado === 'firme' || u.estado === 'duda';
  const enCampo = u => u.estado !== 'fuera' && u.estado !== 'caida';

  /* ---------- azar dentro del estado (el mismo generador que js/guerra.js) ---------- */
  function rnd(S) { S.sem = (Math.imul(S.sem, 1664525) + 1013904223) >>> 0; return S.sem / 4294967296; }

  /* ---------- crear ---------- */
  function manipulo(S, m) {
    const t = m.tropa, n = Math.max(1, Math.round(m.n || tam(t))), forma = m.forma && sabe(t).includes(m.forma) ? m.forma : sabe(t)[0];
    S.cuenta[m.lado][t] = (S.cuenta[m.lado][t] || 0) + 1;
    const u = { id: S.man.length, lado: m.lado, tropa: t, nom: nombre(t) + ' ' + num(S.cuenta[m.lado][t]), n, n0: n,
      x: m.x || 0, y: m.y || 0, a: m.a !== undefined ? m.a : (m.lado === 0 ? Math.PI / 2 : -Math.PI / 2),
      forma, luego: null, cambio: 0, moral: m.moral !== undefined ? m.moral : 1, fatiga: m.fatiga || 0, estado: 'firme',
      orden: 'quieto', dest: null, obj: -1, postura: 'aguantar', tPost: 0, mando: m.mando || 'tribuno', ala: m.ala !== undefined ? m.ala : 1,
      linea: m.linea !== undefined ? m.linea : (esTiro(t) ? 0 : esCab(t) ? 4 : 1), tras: m.tras !== undefined ? m.tras : -1,
      impulso: 0, frenada: 0, golpe: 0, relevo: 0, con: -1, carga: false, pila: !ARROJA[t], mun: esTiro(t) ? tiroDe(t).mun : 0,
      fuego: -9, lucha: 0, rival: -1, flanqueado: false, tirando: -1, desboque: false, dicho: {} };
    S.man.push(u); return u;
  }

  /* Despliegue clásico. Roma: vélites delante, hastati, príncipes tras los huecos (tresbolillo), triarios detrás, jinetes en las alas
     (Polibio 6.21-24 y Livio 8.8: histórico en lo general; las distancias, licencia de juego). Otro ejército: tiradores delante, elefantes
     delante del centro, una línea de infantería (la tropa más numerosa en el centro), una segunda si pasa de 12 manípulos, jinetes en las alas. */
  function desplegar(S, lado, ej) {
    const sg = lado === 0 ? -1 : 1, y0 = sg * DIST0 / 2, partes = {};   /* sg: hacia su retaguardia */
    const trozos = t => { const n = ej[t] || 0, k = Math.max(1, Math.round(n / tam(t))), r = []; for (let i = 0; i < k; i++) r.push(Math.round(n / k)); return n > 0 ? r : []; };
    for (const t in ej) if (ej[t] > 0) partes[t] = trozos(t);
    const ancho = (t, n) => Math.ceil(n / FORMAS[sabe(t)[0]].filas) * FORMAS[sabe(t)[0]].hombre;
    const fila = (lista, y, hueco, tras) => {     /* lista: [[tropa, n]] centrada en x; devuelve los manípulos */
      const anchos = lista.map(([t, n]) => ancho(t, n)), tot = anchos.reduce((a, b) => a + b, 0) + hueco * Math.max(0, lista.length - 1);
      let x = -tot / 2; const r = [];
      lista.forEach(([t, n], i) => { const cx = x + anchos[i] / 2; x += anchos[i] + hueco; r.push(manipulo(S, { lado, tropa: t, n, x: lado === 0 ? cx : -cx, y })); });
      if (tras) r.forEach(u => { let mejor = -1, d = 1e9; for (const v of tras) { const dd = Math.abs(v.x - u.x); if (dd < d) { d = dd; mejor = v.id; } } u.tras = mejor; });
      return { r, tot };
    };
    const tipos = Object.keys(partes), inf = tipos.filter(t => !esCab(t) && !esTiro(t) && !esEle(t)), tiro = tipos.filter(esTiro), cab = tipos.filter(esCab), ele = tipos.filter(esEle);
    const lista = ts => { const l = []; for (const t of ts) for (const n of partes[t]) l.push([t, n]); return l; };
    let primera;
    if (lado === 0 && (partes.hastati || partes.principes || partes.triarii)) {
      const l1 = lista(['hastati'].concat(inf.filter(t => !['hastati', 'principes', 'triarii'].includes(t)))), l2 = lista(['principes'].filter(t => partes[t])), l3 = lista(['triarii'].filter(t => partes[t]));
      const hueco = 4;                               /* licencia: los huecos del tresbolillo se cierran; el relevo no los necesita aquí */
      primera = fila(l1.length ? l1 : l2, y0, hueco);
      let atras = primera.r;
      if (l1.length && l2.length) { const s2 = fila(l2, y0 + sg * 30, hueco, atras); s2.r.forEach(u => { u.linea = 2; }); atras = s2.r; }
      if (l3.length) { const s3 = fila(l3, y0 + sg * 60, Math.max(10, hueco), atras); s3.r.forEach(u => { u.linea = 3; }); }
    } else {
      inf.sort((a, b) => (ej[b] || 0) - (ej[a] || 0));
      const todos = lista(inf), orden = [];          /* la tropa más numerosa en el centro: se va colocando a uno y otro lado */
      todos.forEach((m, i) => { if (i % 2) orden.push(m); else orden.unshift(m); });
      const l1 = orden.length > 12 ? orden.filter((m, i) => i % 3 !== 1) : orden, l2 = orden.length > 12 ? orden.filter((m, i) => i % 3 === 1) : [];
      primera = fila(l1.length ? l1 : lista(tiro), y0, 6);
      if (l2.length) fila(l2, y0 + sg * 30, 20, primera.r).r.forEach(u => { u.linea = 2; });
    }
    if (ele.length) fila(lista(ele), y0 - sg * 28, 12);
    if (tiro.length && primera.r.some(u => !esTiro(u.tropa))) fila(lista(tiro), y0 - sg * 34, 14);
    const lc = lista(cab);                          /* jinetes: mitad a cada ala */
    lc.forEach(([t, n], i) => { const lad = i % 2 ? 1 : -1, k = Math.floor(i / 2), x = lad * (primera.tot / 2 + 30 + k * 34); manipulo(S, { lado, tropa: t, n, x: lado === 0 ? x : -x, y: y0 }); });
    /* alas: por tercios del frente, vistas desde el propio bando (su izquierda) */
    const W = Math.max(60, primera.tot);
    for (const u of S.man) if (u.lado === lado) { const lx = lado === 0 ? u.x : -u.x; u.ala = lx < -W / 6 ? 0 : lx > W / 6 ? 2 : 1; }
  }

  function crear(cfg) {
    cfg = cfg || {};
    const S = { v: 1, sem: ((cfg.semilla || 7) >>> 0) || 1, n: 0, t: 0, fase: 'lucha', pausa: false, man: [], reg: [], resultado: null, ordenes: 0,
      campo: Object.assign({}, CAMPO), limite: cfg.limite || LIMITE, cuenta: [{}, {}],
      tribunos: cfg.tribunos || [TRIBUNOS.map(x => Object.assign({}, x)), JEFES.map(x => Object.assign({}, x))],
      planes: cfg.planes || [['avanzar', 'avanzar', 'avanzar'], ['avanzar', 'avanzar', 'avanzar']], n0: [{}, {}] };
    if (cfg.manipulos) for (const m of cfg.manipulos) manipulo(S, m);
    else for (let b = 0; b < 2; b++) desplegar(S, b, (cfg.ejercitos && cfg.ejercitos[b]) || {});
    for (const u of S.man) S.n0[u.lado][u.tropa] = (S.n0[u.lado][u.tropa] || 0) + u.n0;
    recontar(S);
    return S;
  }

  /* ---------- geometría: cada manípulo es un rectángulo con su frente (ancho) y su fondo ---------- */
  const frente = u => Math.max(2, Math.ceil(u.n / FORMAS[u.forma].filas) * FORMAS[u.forma].hombre);
  const fondo = u => Math.max(1.5, Math.min(FORMAS[u.forma].filas, u.n) * (u.forma === 'abierto' ? 2 : 1));
  const fwd = u => [Math.cos(u.a), Math.sin(u.a)];
  /* Coordenadas de un punto en el marco del manípulo: ly hacia delante, lx a su derecha */
  function local(u, x, y) { const c = Math.cos(u.a), s = Math.sin(u.a), dx = x - u.x, dy = y - u.y; return [dx * s - dy * c, dx * c + dy * s]; }
  const angDif = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  /* De qué lado de u está v: 'frente' si v queda delante y los dos frentes se solapan al menos 2 m; 'retaguardia' igual por detrás;
     si no, 'flanco'. g = medidas del paso (frente f y fondo d de cada uno) */
  function lado(u, v, g) {
    const gv = g ? g[v.id] : { f: frente(v), d: fondo(v) }, gu = g ? g[u.id] : { f: frente(u), d: fondo(u) };
    const [lx, ly] = local(u, v.x, v.y), d = angDif(u.a, v.a), hx = Math.abs(Math.cos(d)) * gv.f / 2 + Math.abs(Math.sin(d)) * gv.d / 2;
    if (Math.abs(lx) < gu.f / 2 + hx - 2) return ly > 0 ? 'frente' : 'retaguardia';
    return 'flanco';
  }
  /* ¿Se tocan? Separación por los ejes de los dos rectángulos (con un metro de holgura) */
  function tocan(u, v, g) {
    for (const [p, q] of [[u, g[u.id]], [v, g[v.id]]]) {
      const o = p === u ? v : u, go = g[o.id], [lx, ly] = local(p, o.x, o.y), d = angDif(p.a, o.a), c = Math.abs(Math.cos(d)), s = Math.abs(Math.sin(d));
      const hx = c * go.f / 2 + s * go.d / 2, hy = s * go.f / 2 + c * go.d / 2;
      if (Math.abs(lx) > q.f / 2 + hx + 0.5 || Math.abs(ly) > q.d / 2 + hy + 1) return false;
    }
    return true;
  }

  /* ---------- registro ---------- */
  function ev(S, tipo, u, texto, mas) {
    const e = { t: Math.round(S.t * 10) / 10, tipo, texto };
    if (u) { e.id = u.id; e.lado = u.lado; e.x = Math.round(u.x); e.y = Math.round(u.y); }
    S.reg.push(Object.assign(e, mas || {}));
  }

  /* ---------- fuerza en el choque: la de js/guerra.js (fuerza), por manípulo ---------- */
  function fuerza(u) {
    const fondoF = Math.max(0.3, Math.min(1, u.n / (0.4 * u.n0))), F = FORMAS[u.forma];
    return cal(u.tropa) * fondoF * (1 - 0.55 * u.fatiga) * (u.postura === 'empujar' ? 1.25 : 0.8) * (u.relevo > 0 || u.cambio > 0 ? 0.7 : 1) * (0.7 + 0.3 * Math.max(0, u.moral)) *
      (u.impulso > 0 ? 1.15 * (F.choque || 1) : 1) * (u.frenada > 0 ? 0.8 : 1) * F.atk;
  }
  const escala = u => limita(u.n0 / tam(u.tropa), 0.15, 3);

  /* ---------- órdenes ---------- */
  /* Qué puede hacer un manípulo. Devuelve '' si se puede, o el motivo en llano. */
  function puedeUno(S, u, o) {
    if (!u) return 'No existe ese manípulo';
    if (o.lado !== undefined && u.lado !== o.lado) return 'Ese manípulo es del enemigo';
    if (!vivo(u)) return u.estado === 'roto' ? 'Ese manípulo huye' : 'Ese manípulo ya no está en el campo';
    if (o.tipo === 'formar') { if (!sabe(u.tropa).includes(o.forma)) return 'Esa tropa no sabe formar así'; if (u.forma === o.forma && !u.cambio) return 'Ya están en esa formación'; if (u.cambio > 0) return 'Están cambiando de formación'; return ''; }
    if (o.tipo === 'relevar') { if (u.relevo > 0) return 'El relevo ya está en marcha'; if (!enLucha(S, u)) return 'No están luchando'; if (!quienReleva(S, u)) return 'No hay manípulo fresco detrás'; return ''; }
    if (o.tipo === 'cargar') { const v = o.objetivo !== undefined ? S.man[o.objetivo] : masCerca(S, u, true); if (!v || !vivo(v) || v.lado === u.lado) return 'No hay enemigo al que cargar'; if (u.forma === 'testudo') return 'En testudo no se carga'; return ''; }
    if (o.tipo === 'mover') { if (typeof o.x !== 'number' || typeof o.y !== 'number') return 'Falta el destino'; if (u.cambio > 0 && u.forma === 'testudo') return 'Están deshaciendo el testudo'; return ''; }
    if (o.tipo === 'retirar' || o.tipo === 'aguantar' || o.tipo === 'devolver') return '';
    return 'Orden desconocida';
  }
  function puede(S, o) {
    if (S.fase === 'fin') return 'La batalla ha terminado';
    if (o.tipo === 'pausa') return '';
    if (o.tipo === 'plan') return PLANES.includes(o.plan) && o.ala >= 0 && o.ala <= 2 ? '' : 'Plan desconocido';
    const ids = o.ids || [];
    if (!ids.length) return 'No hay manípulos elegidos';
    let motivo = '';
    for (const id of ids) { const m = puedeUno(S, S.man[id], o); if (!m) return ''; motivo = motivo || m; }
    return motivo;
  }
  /* orden = { tipo, lado, ids:[…], por? }
     · mover {x, y, a?}: los elegidos van juntos, guardando sus distancias, al punto (x, y); a = hacia dónde miran al llegar
     · formar {forma} · cargar {objetivo?} (sin objetivo, el enemigo más cercano) · relevar · retirar (marcha atrás en orden, 80 m)
     · aguantar (quietos, escudos juntos) · devolver (vuelven al tribuno) · pausa {valor?} · plan {lado, ala, plan} (lo que hace el tribuno de un ala)
     Lo que ordena el jugador pasa a ser suyo (mando «jugador») hasta que lo devuelva. Devuelve '' si se hizo, o el motivo. */
  function ordenar(S, o) {
    const no = puede(S, o); if (no) return no;
    const por = o.por || 'jugador';
    if (o.tipo === 'pausa') { S.pausa = o.valor !== undefined ? !!o.valor : !S.pausa; ev(S, 'orden', null, S.pausa ? 'Pausa' : 'Sigue la batalla', { orden: 'pausa', por }); return ''; }
    if (o.tipo === 'plan') { S.planes[o.lado || 0][o.ala] = o.plan; ev(S, 'orden', null, 'Plan del ala: ' + o.plan, { orden: 'plan', lado: o.lado || 0, ala: o.ala, por }); return ''; }
    const us = o.ids.map(i => S.man[i]).filter(u => !puedeUno(S, u, o));
    if (por === 'jugador') S.ordenes++;
    let cx = 0, cy = 0; for (const u of us) { cx += u.x / us.length; cy += u.y / us.length; }
    for (const u of us) {
      if (por === 'jugador') u.mando = o.tipo === 'devolver' ? 'tribuno' : 'jugador';
      hacer(S, u, o, cx, cy);
    }
    if (por === 'jugador' || ['relevar', 'cargar', 'formar', 'retirar'].includes(o.tipo)) {
      const quien = us.length === 1 ? us[0].nom : us.length + ' manípulos';
      ev(S, 'orden', us[0], quien + ': ' + TXT_ORDEN(o), { orden: o.tipo, ids: us.map(u => u.id), por });
    }
    return '';
  }
  const TXT_ORDEN = o => o.tipo === 'formar' ? 'forman en ' + FORMAS[o.forma].n.toLowerCase() : ({ mover: 'en marcha', cargar: '¡a la carga!', relevar: 'relevo de línea', retirar: 'atrás, en orden', aguantar: 'escudos juntos', devolver: 'vuelven al tribuno' })[o.tipo];

  function hacer(S, u, o, cx, cy) {
    if (o.tipo === 'mover') {
      u.dest = { x: o.x + (u.x - cx), y: o.y + (u.y - cy), a: o.a }; u.orden = 'mover'; u.obj = -1; u.carga = false;
      if (o.vel > 0) u.dest.vel = o.vel;   /* CG6b: a pie, el manípulo sigue a su centurión a la velocidad que lleva (m/s; licencia de juego) */
    } else if (o.tipo === 'formar') {
      u.luego = o.forma; u.cambio = u.forma === 'testudo' ? T_DESHACER : FORMAS[o.forma].t;
    } else if (o.tipo === 'cargar') {
      const v = o.objetivo !== undefined ? S.man[o.objetivo] : masCerca(S, u, true); u.obj = v.id; u.orden = 'cargar'; u.dest = null; u.postura = 'empujar'; u.tPost = 0;
    } else if (o.tipo === 'relevar') {
      const r = quienReleva(S, u); u.relevo = r.relevo = T_RELEVO; u.con = r.id; r.con = u.id; r.dest = null; r.orden = 'quieto';
    } else if (o.tipo === 'retirar') {
      const [fx, fy] = fwd(u); u.dest = { x: u.x - fx * 80, y: u.y - fy * 80, a: u.a, atras: true }; u.orden = 'retirar'; u.obj = -1; u.carga = false;
      if (enLucha(S, u)) { u.moral -= 0.05; u.golpe = Math.max(u.golpe, 3); }    /* despegarse del enemigo cuesta: licencia de juego */
    } else if (o.tipo === 'aguantar') { u.dest = null; u.orden = 'aguantar'; u.rival = -1; u.obj = -1; u.carga = false; u.postura = 'aguantar'; u.tPost = 0; }
  }

  /* El manípulo fresco que puede relevar a u: el que lo respalda (tras) o cualquier propio libre detrás, a menos de 50 m */
  function quienReleva(S, u) {
    const [fx, fy] = fwd(u); let mejor = null, md = 1e9;
    for (const v of S.man) {
      if (v === u || v.lado !== u.lado || !vivo(v) || v.relevo > 0 || esCab(v.tropa) !== esCab(u.tropa) || esTiro(v.tropa) || v.moral < 0.5 || v.fatiga > 0.45 || S.cont[v.id].length) continue;
      const dx = v.x - u.x, dy = v.y - u.y, atras = -(dx * fx + dy * fy), d = Math.hypot(dx, dy);
      if (atras < 5 || d > 50) continue;
      const k = d - (v.tras === u.id ? 30 : 0); if (k < md) { md = k; mejor = v; }
    }
    return mejor;
  }
  const enLucha = (S, u) => !!(S.cont && S.cont[u.id] && S.cont[u.id].length);
  function masCerca(S, u, soloVivos, max) {
    let mejor = null, md = max || 1e9;
    for (const v of S.man) { if (v.lado === u.lado || !enCampo(v) || (soloVivos && !vivo(v))) continue; const d = Math.hypot(v.x - u.x, v.y - u.y); if (d < md) { md = d; mejor = v; } }
    return mejor;
  }

  /* ---------- los tribunos ---------- */
  /* La mente del que lucha, copiada de js/guerra.js (mente): cuándo empuja y cuándo aguanta, según su tropa */
  function mente(S, u, dt) {
    const m = car(u.tropa).mente; u.tPost += dt; let q = u.postura;
    if (m === 'furia') q = u.postura === 'empujar' ? (u.fatiga > 0.78 ? 'aguantar' : 'empujar') : (u.fatiga < 0.5 || u.tPost > 16 ? 'empujar' : 'aguantar');
    else if (m === 'paciencia') q = u.lucha < 14 ? 'aguantar' : u.postura === 'empujar' ? (u.tPost > 15 || u.fatiga > 0.85 ? 'aguantar' : 'empujar') : (u.tPost > 9 && u.fatiga < 0.7 ? 'empujar' : 'aguantar');
    else q = u.postura === 'empujar' ? (u.tPost > 11 || u.fatiga > 0.8 ? 'aguantar' : 'empujar') : (u.tPost > 8 && u.fatiga < 0.65 ? 'empujar' : 'aguantar');
    if (q !== u.postura) { u.postura = q; u.tPost = 0; }
  }

  function tribuno(S, u) {
    const T = S.tribunos[u.lado][u.ala] || TRIBUNOS[0], C = CAR[T.car] || CAR.prudente, plan = S.planes[u.lado][u.ala], por = T.n;
    const mando = o => { o.ids = [u.id]; o.por = por; return ordenar(S, o); };
    const pref = sabe(u.tropa)[0];
    if (S.cont[u.id].length) {                                       /* luchando: mente, relevo y nada más */
      mente(S, u, TIC_TRIBUNO * PASO);
      if (u.forma === 'columna' && !u.cambio) mando({ tipo: 'formar', forma: pref });
      if (u.relevo <= 0 && (u.fatiga > C.relevo || u.moral < 0.3) && quienReleva(S, u)) mando({ tipo: 'relevar' });
      if (esCab(u.tropa) && u.lucha > 10 && S.cont[u.id].some(c => c.cara === 'frente' && (cls(S.man[c.id].tropa) === 'spear' || FORMAS[S.man[c.id].forma].frena))) mando({ tipo: 'retirar' });
      return;
    }
    if (u.orden === 'retirar' && u.dest) return;
    /* respaldo: la segunda y la tercera línea siguen a la que tienen delante, a 30 m */
    const delante = u.tras >= 0 ? S.man[u.tras] : null;
    if (delante && !vivo(delante)) u.tras = -1;
    else if (delante && plan !== 'envolver') {
      const [fx, fy] = fwd(delante), off = 30 + fondo(delante) / 2;
      const x = delante.x - fx * off, y = delante.y - fy * off;
      if (Math.hypot(x - u.x, y - u.y) > 3) { u.dest = { x, y, a: delante.a }; u.orden = 'mover'; }
      if (u.forma !== pref && !u.cambio && !(C.cubre && S.t - u.fuego < 2)) mando({ tipo: 'formar', forma: pref });
      return;
    }
    /* tiradores: se acercan hasta su alcance, tiran y se retiran tras las líneas cuando llega la infantería o se acaba la munición */
    if (esTiro(u.tropa)) {
      const v = masCerca(S, u, true), A = tiroDe(u.tropa);
      if (!v) return;
      const d = Math.hypot(v.x - u.x, v.y - u.y), cuerpo = masCercaCuerpo(S, u);
      if (u.mun <= 0 || (cuerpo && cuerpo.d < 30)) { const sg = u.lado === 0 ? -1 : 1; if (u.orden !== 'retirar' && u.y * sg < S.campo.largo / 2 - 40) { u.dest = { x: u.x, y: u.y + sg * 70, a: u.a, atras: true }; u.orden = 'retirar'; } return; }
      if (d > A.alc * 0.85) { u.dest = { x: v.x, y: v.y }; u.orden = 'mover'; } else { u.dest = null; u.orden = 'quieto'; u.a = Math.atan2(v.y - u.y, v.x - u.x); }
      return;
    }
    if (plan === 'reserva') {
      const rompe = S.reg.some(e => e.tipo === 'ruptura' && e.lado === u.lado && S.t - e.t < 5), cerca = masCerca(S, u, true, 70);
      if (!rompe && !cerca) return;
      S.planes[u.lado][u.ala] = 'avanzar';
    }
    /* el blanco: el enemigo más cercano en pie; el que persigue también mira a los que huyen */
    let v = masCerca(S, u, true);
    if (C.persigue) { const h = masCerca(S, u, false, C.persigue); if (h && (!v || !vivo(h) && Math.hypot(h.x - u.x, h.y - u.y) < Math.hypot(v.x - u.x, v.y - u.y) * 0.6)) v = h; }
    if (!v) { u.dest = null; u.orden = 'quieto'; return; }
    const d = Math.hypot(v.x - u.x, v.y - u.y);
    /* bajo los proyectiles: testudo (o muro) si lo sabe y el cuerpo a cuerpo está lejos; al acercarse, deshacerlo */
    const bajoFuego = S.t - u.fuego < 2;
    if (C.cubre && bajoFuego && d > 45 && !u.cambio) { const f = sabe(u.tropa).includes('testudo') ? 'testudo' : sabe(u.tropa).includes('muro') ? 'muro' : null; if (f && u.forma !== f) mando({ tipo: 'formar', forma: f }); }
    else if (!u.cambio && u.forma !== pref && (!bajoFuego || d < 45)) mando({ tipo: 'formar', forma: pref });
    if (plan === 'aguantar' && d > 25) { u.dest = null; u.orden = 'quieto'; if (Math.abs(angDif(u.a, Math.atan2(v.y - u.y, v.x - u.x))) > 0.4) u.dest = { x: u.x, y: u.y, a: Math.atan2(v.y - u.y, v.x - u.x) }; return; }
    /* envolver: si el enemigo ya lucha con otro, ir a su flanco y cargar desde allí */
    const envuelve = (C.envuelve || plan === 'envolver' || esCab(u.tropa)) && vivo(v) && S.cont[v.id].length > 0;
    if (envuelve) {
      const [fx, fy] = fwd(v), rx = Math.sin(v.a), ry = -Math.cos(v.a), [lx] = local(v, u.x, u.y), sg = lx >= 0 ? 1 : -1, off = frente(v) / 2 + fondo(u) / 2 + 12;
      const px = v.x + rx * sg * off - fx * 4, py = v.y + ry * sg * off - fy * 4;
      if (Math.hypot(px - u.x, py - u.y) > 10 && u.orden !== 'cargar') { u.dest = { x: px, y: py }; u.orden = 'mover'; return; }
      if (u.orden !== 'cargar' && u.forma !== 'testudo') mando({ tipo: 'cargar', objetivo: v.id });
      return;
    }
    const alcance = C.carga * (esCab(u.tropa) ? 2 : 1);
    if (d < alcance && u.orden !== 'cargar' && u.forma !== 'testudo' && !u.cambio) { mando({ tipo: 'cargar', objetivo: v.id }); return; }
    if (u.orden !== 'cargar') { u.dest = { x: v.x, y: v.y }; u.orden = 'mover'; }
  }
  function masCercaCuerpo(S, u) {
    let md = 1e9, m = null; for (const v of S.man) { if (v.lado === u.lado || !vivo(v) || esTiro(v.tropa)) continue; const d = Math.hypot(v.x - u.x, v.y - u.y); if (d < md) { md = d; m = v; } }
    return m ? { v: m, d: md } : null;
  }

  /* ---------- un paso ---------- */
  function paso(S) {
    if (S.fase === 'fin' || S.pausa) return;
    const dt = PASO; S.n++; S.t = S.n * PASO;
    const M = S.man, g = [];
    for (const u of M) g[u.id] = { f: frente(u), d: fondo(u) };
    for (const u of M) {
      for (const q of ['impulso', 'frenada', 'golpe']) if (u[q] > 0) u[q] = Math.max(0, u[q] - dt);
      if (u.cambio > 0) { u.cambio -= dt; if (u.cambio <= 0) { u.cambio = 0; if (u.luego) { u.forma = u.luego; u.luego = null; ev(S, 'forma', u, u.nom + ' en ' + FORMAS[u.forma].n.toLowerCase(), { forma: u.forma }); } } }
      if (u.relevo > 0) { u.relevo -= dt; if (u.relevo <= 0) { u.relevo = 0; cambiarLinea(S, u); } }
    }
    /* contactos */
    S.cont = M.map(() => []);
    for (let i = 0; i < M.length; i++) {
      const u = M[i]; if (!enCampo(u)) continue;
      const ru = Math.hypot(g[i].f, g[i].d) / 2 + 2;
      for (let j = i + 1; j < M.length; j++) {
        const v = M[j]; if (v.lado === u.lado || !enCampo(v)) continue;
        const rv = Math.hypot(g[j].f, g[j].d) / 2, dx = v.x - u.x, dy = v.y - u.y;
        if (dx * dx + dy * dy > (ru + rv) * (ru + rv)) continue;
        if (!tocan(u, v, g)) continue;
        if (!vivo(u) && !vivo(v)) continue;
        const cu = lado(u, v, g), cv = lado(v, u, g);
        if (cu !== 'frente' && cv !== 'frente') continue;          /* se rozan de lado o por la esquina: no luchan */
        S.cont[i].push({ id: j, cara: cu }); S.cont[j].push({ id: i, cara: cv });
      }
    }
    for (const u of M) if (S.cont[u.id].length) {
      if (vivo(u) && !u.lucha && S.t - (u.ultLucha || -99) > 3) choque(S, u); u.lucha += dt; u.ultLucha = S.t;
      const c = S.cont[u.id].find(c => c.cara === 'frente' && vivo(M[c.id])) || S.cont[u.id].find(c => vivo(M[c.id])); u.rival = c ? c.id : -1;
    } else u.lucha = 0;
    /* tribunos */
    if (S.n % TIC_TRIBUNO === 0) for (const u of M) if (vivo(u) && u.mando === 'tribuno') tribuno(S, u);
    /* mover */
    for (const u of M) mover(S, u, dt);
    /* proyectiles */
    for (const u of M) if (vivo(u)) { if (esTiro(u.tropa)) tirar(S, u, dt); if (!u.pila) pila(S, u); }
    /* cuerpo a cuerpo: primero se suma el daño de todos, luego se aplica (así el orden de la lista no decide) */
    const dano = M.map(() => 0), golpeF = M.map(() => 0), flanq = M.map(() => false);
    for (const a of M) {
      if (!vivo(a) || !S.cont[a.id].length) continue;
      const blancos = S.cont[a.id].filter(c => c.cara === 'frente'); if (!blancos.length) continue;
      const fa = fuerza(a) / blancos.length, ruido = 0.9 + 0.2 * rnd(S);
      for (const c of blancos) {
        const b = M[c.id], cara = S.cont[b.id].find(x => x.id === a.id).cara, T = car(b.tropa), F = FORMAS[b.forma];
        let d = fa * K_BAJAS * dt * ruido * escala(a);
        if (!vivo(b)) d *= 2;                                                   /* persecución: el que huye no se defiende (licencia de juego) */
        else {
          d *= b.postura === 'aguantar' ? (T.firme ? 0.45 : 0.6) : 1;           /* js/guerra.js */
          if (b.postura === 'empujar' && a.postura === 'aguantar') d *= 1.12;
          if (b.postura === 'empujar' && a.postura === 'empujar') d *= 1.2;
          if (cara === 'frente') d *= F.recibe; else { d *= (T.flanco || 1.5) * F.flanco * (cara === 'retaguardia' ? 1.35 : 1); flanq[b.id] = true; }
          if (b.golpe > 0) d *= 1.4;
          if (b.cambio > 0) d *= 1.2;
          golpeF[b.id] += fa;
        }
        dano[b.id] += d * defMul(b.tropa) / (VIDA[b.tropa] || 1);
      }
    }
    for (const b of M) {
      if (!enCampo(b)) continue;
      const lucha = S.cont[b.id].length > 0;
      if (dano[b.id] > 0) quitar(S, b, dano[b.id]);
      if (vivo(b) && lucha) {
        const fb = fuerza(b), T = car(b.tropa);
        b.moral -= morMul(b.tropa) * (dano[b.id] / b.n0 * MORAL_BAJA + TENSION * dt + (flanq[b.id] ? 0.028 : 0) * dt + (golpeF[b.id] > fb ? 0.013 * (golpeF[b.id] - fb) * dt : 0) + (b.fatiga > 0.85 ? 0.006 * dt : 0));
        if (b.postura === 'aguantar' && !flanq[b.id]) b.moral += 0.004 * dt;
        b.fatiga = limita(b.fatiga + (b.postura === 'empujar' ? BASE_FATIGA * T.cansa : -BASE_FATIGA * 0.22) * dt, 0, 1);
        if (flanq[b.id] && !b.flanqueado && S.t - (b.tFlanco || -99) > 8) b.tFlanco = S.t, ev(S, S.cont[b.id].some(c => c.cara === 'retaguardia') ? 'retaguardia' : 'flanqueo', b, b.nom + (S.cont[b.id].some(c => c.cara === 'retaguardia') ? ': ¡les atacan por la espalda!' : ': ¡les atacan por el flanco!'));
        b.flanqueado = flanq[b.id];
        if (esEle(b.tropa) && !b.desboque && (b.fatiga > 0.7 || b.n < 0.5 * b.n0)) desbocar(S, b);
      } else if (vivo(b)) {
        b.flanqueado = false;
        const F = FORMAS[b.forma];
        if (F.cansa) b.fatiga = Math.min(1, b.fatiga + F.cansa * car(b.tropa).cansa * dt);
        else if (!b.dest && (b.orden === 'quieto' || b.orden === 'aguantar')) b.fatiga = Math.max(0, b.fatiga - DESCANSO * dt);
        if (S.t - b.fuego > 3 && b.moral < 1) b.moral = Math.min(1, b.moral + 0.002 * dt);
      }
      b.moral = Math.min(1, b.moral);
      estado(S, b);
    }
    comprobarFin(S);
  }

  /* Al tocar por primera vez: el choque. Con carga, el impacto; el testudo se deshace (js/guerra.js: chocar) */
  function choque(S, u) {
    const rivales = S.cont[u.id].map(c => S.man[c.id]).filter(vivo);
    if (!rivales.length) return;
    if (u.forma === 'testudo') { u.forma = 'linea'; u.cambio = 0; u.luego = null; u.golpe = 14; u.moral -= 0.3; ev(S, 'testudo-roto', u, 'El choque deshace el testudo de ' + u.nom); }
    if (u.carga) impacto(S, u, rivales);
    else if (u.mando === 'tribuno') { u.postura = car(u.tropa).mente === 'furia' ? 'empujar' : 'aguantar'; u.tPost = 0; }
    ev(S, 'choque', u, u.nom + ' chocan con ' + rivales[0].nom, { con: rivales[0].id });
  }

  /* El impacto de una carga. Caballo o elefante contra picas o muro de frente: rebota (Polibio 18.29-30 para las picas; lo demás, licencia).
     Jinetes por el flanco: lo de js/guerra.js (moral −0,2 y bajas 22 por cada 60 jinetes). Infantería: menos, pero cuenta. */
  function impacto(S, a, rivales) {
    a.carga = false; a.orden = 'quieto'; a.postura = 'empujar'; a.tPost = 0;
    const b = rivales.find(v => v.id === a.obj) || rivales[0], cc = S.cont[b.id].find(c => c.id === a.id), cara = cc ? cc.cara : lado(b, a), pa = peso(a.tropa), esc = limita(a.n0 / tam(a.tropa), 0.25, 2.5);
    if ((esCab(a.tropa) || esEle(a.tropa)) && cara === 'frente' && (FORMAS[b.forma].frena || cls(b.tropa) === 'spear')) {
      a.moral -= 0.15; quitar(S, a, a.n * 0.06 / (VIDA[a.tropa] || 1)); a.frenada = 5;
      ev(S, 'carga-frenada', a, 'La carga de ' + a.nom + ' se estrella contra las lanzas de ' + b.nom, { con: b.id }); return;
    }
    a.impulso = 5;
    const lado2 = cara === 'frente' ? 1 : 1.7;
    let bajas, moral;
    if (esCab(a.tropa)) { bajas = 22 * esc * (cara === 'frente' ? 0.4 : 1); moral = 0.2 * esc * (cara === 'frente' ? 0.4 : 1); }
    else if (esEle(a.tropa)) { bajas = 5 * a.n * lado2; moral = 0.18 * lado2; for (const v of S.man) if (v.lado !== a.lado && vivo(v) && Math.hypot(v.x - a.x, v.y - a.y) < 40) v.moral -= 0.05; }   /* pavor (Plutarco, Pirro 21) */
    else { bajas = 0.04 * a.n * (FORMAS[a.forma].choque || 1) * lado2; moral = 0.06 * lado2 * (FORMAS[a.forma].choque || 1); }
    b.golpe = Math.max(b.golpe, 4); b.moral -= moral * morMul(b.tropa); quitar(S, b, bajas * defMul(b.tropa) * (FORMAS[b.forma].frena && cara === 'frente' ? 0.5 : 1));
    ev(S, 'carga', a, a.nom + ' cargan contra ' + b.nom + (cara === 'frente' ? '' : cara === 'flanco' ? ' por el flanco' : ' por la espalda'), { con: b.id, cara, bajas: Math.round(bajas) });
  }

  /* El relevo termina: el fresco ocupa el sitio del cansado y el cansado pasa atrás (js/guerra.js: relevo, moral +0,1) */
  function cambiarLinea(S, u) {
    const r = S.man[u.con]; if (!r || r.con !== u.id) { u.con = -1; return; }
    if (!vivo(u) || !vivo(r)) { u.con = r.con = -1; return; }
    const [fx, fy] = fwd(u), x = u.x, y = u.y, a = u.a, ox = r.x, oy = r.y;
    r.x = x; r.y = y; r.a = a; r.moral = Math.min(1, r.moral + 0.1); r.relevo = 0; r.con = u.con = -1;
    const atras = fondo(u) / 2 + fondo(r) / 2 + 2;
    u.x = x - fx * atras; u.y = y - fy * atras; u.dest = { x: ox, y: oy, a }; u.orden = 'mover'; u.obj = -1; u.carga = false;
    const t = u.tras; u.tras = r.id; r.tras = t === r.id ? -1 : t;
    for (const v of S.man) if (v !== u && v.tras === u.id) v.tras = r.id;
    if (r.mando === 'tribuno') { r.postura = 'aguantar'; r.tPost = 0; }
    ev(S, 'relevo', r, 'Entra ' + r.nom + ' y releva a ' + u.nom, { sale: u.id, entra: r.id });
  }

  function mover(S, u, dt) {
    if (!enCampo(u)) return;
    const F = FORMAS[u.forma], lucha = S.cont[u.id].length > 0;
    if (u.estado === 'roto') {                                    /* huye hacia su borde */
      const sg = u.lado === 0 ? -1 : 1, quiere = sg > 0 ? Math.PI / 2 : -Math.PI / 2;
      u.a += limita(angDif(u.a, quiere), -2 * dt, 2 * dt);
      const v = velBase(u.tropa) * 1.4 * (1 - 0.3 * u.fatiga);
      u.x += Math.cos(u.a) * v * dt; u.y += Math.sin(u.a) * v * dt;
      if (Math.abs(u.y) > S.campo.largo / 2 || Math.abs(u.x) > S.campo.ancho / 2) { u.estado = 'fuera'; ev(S, 'huida', u, u.nom + ' salen del campo', { n: Math.round(u.n) }); }
      return;
    }
    if (lucha) {                                                  /* luchando: no anda (salvo retirarse); se vuelve hacia quien le pega */
      if (u.orden === 'retirar' && u.dest && !u.cambio) return andar(S, u, dt, F, 0.4);
      const delante = S.cont[u.id].some(c => c.cara === 'frente' && vivo(S.man[c.id]));
      if (!delante && !u.cambio) { const c = S.cont[u.id].map(c => S.man[c.id]).find(vivo) || S.man[S.cont[u.id][0].id]; u.a += limita(angDif(u.a, Math.atan2(c.y - u.y, c.x - u.x)), -F.giro * 0.5 * dt, F.giro * 0.5 * dt); }
      return;
    }
    if (u.cambio > 0) return;                                     /* cambiando de formación: quietos */
    if (u.orden === 'quieto' && u.rival >= 0) {                   /* siguen pegados a su rival si se separa unos metros (al girar, al ceder) */
      const v = S.man[u.rival];
      if (v && vivo(v) && Math.hypot(v.x - u.x, v.y - u.y) < (fondo(u) + fondo(v)) / 2 + 12) { const d0 = u.dest; u.dest = { x: v.x, y: v.y }; andar(S, u, dt, F, 1); u.dest = d0; return; }
      u.rival = -1;
    }
    if (u.orden === 'cargar') {
      const v = S.man[u.obj];
      if (!v || !enCampo(v) || (!vivo(v) && u.mando === 'jugador')) { u.orden = 'quieto'; u.obj = -1; u.carga = false; return; }
      const d = Math.hypot(v.x - u.x, v.y - u.y), corre = d < (esCab(u.tropa) ? 120 : 60);
      u.carga = corre; u.dest = { x: v.x, y: v.y };
      andar(S, u, dt, F, corre ? (esCab(u.tropa) ? 2.0 : 2.2) : 1);
      if (corre) u.fatiga = Math.min(1, u.fatiga + dt / 40 * car(u.tropa).cansa);     /* correr cansa (licencia de juego) */
      u.dest = null; return;
    }
    if (u.dest) andar(S, u, dt, F, u.dest.atras ? 0.5 : 1);
  }
  function andar(S, u, dt, F, ritmo) {
    const D2 = u.dest, dx = D2.x - u.x, dy = D2.y - u.y, d = Math.hypot(dx, dy);
    if (d < 0.6) {
      if (D2.a !== undefined) { const e = angDif(u.a, D2.a); u.a += limita(e, -F.giro * dt, F.giro * dt); if (Math.abs(e) > 0.02) return; }
      u.dest = null; if (u.orden !== 'cargar') u.orden = 'quieto'; return;
    }
    if (D2.vel) { const b = velBase(u.tropa) * F.vel * (1 - 0.4 * u.fatiga); ritmo = Math.max(ritmo, Math.min(VEL_APIE, D2.vel / b)); if (ritmo > 1.2) u.fatiga = Math.min(1, u.fatiga + dt / 40 * car(u.tropa).cansa); }
    const v = velBase(u.tropa) * F.vel * (1 - 0.4 * u.fatiga) * ritmo * dt;
    if (D2.atras) { u.x += dx / d * Math.min(v, d); u.y += dy / d * Math.min(v, d); return; }      /* marcha atrás mirando al enemigo */
    const quiere = Math.atan2(dy, dx), e = angDif(u.a, quiere);
    u.a += limita(e, -F.giro * dt * 1.5, F.giro * dt * 1.5);
    if (Math.abs(e) > 0.6 && d > 5) return;                       /* primero se vuelve, luego anda */
    u.x += Math.cos(u.a) * Math.min(v, d); u.y += Math.sin(u.a) * Math.min(v, d);
    u.fatiga = Math.min(1, u.fatiga + dt / 900 * car(u.tropa).cansa);
  }

  /* Tiradores (js/guerra.js: tirar, con sus cifras de Guerra.TIRO): tiran a lo que tengan delante a tiro */
  function tirar(S, u, dt) {
    if (u.mun <= 0 || S.cont[u.id].length || u.estado === 'roto') { u.tirando = -1; return; }
    const A = tiroDe(u.tropa); let b = null, md = A.alc;
    for (const v of S.man) { if (v.lado === u.lado || !vivo(v)) continue; const d = Math.hypot(v.x - u.x, v.y - u.y) - fondo(v) / 2; if (d < md) { const [lx, ly] = local(u, v.x, v.y); if (Math.abs(Math.atan2(lx, ly)) < 1.1) { md = d; b = v; } } }
    if (!b) { u.tirando = -1; return; }
    if (u.tirando !== b.id) { u.tirando = b.id; ev(S, 'tiro', u, u.nom + ' lanzan sus ' + A.arma + ' sobre ' + b.nom, { con: b.id, arma: A.arma }); }
    u.mun -= dt;
    const F = FORMAS[b.forma], n = u.n * A.tiro * dt * (0.85 + 0.3 * rnd(S)) * blanco(b.tropa) * F.tiro;
    b.fuego = S.t; quitar(S, b, n / (VIDA[b.tropa] || 1));
    b.moral -= morMul(b.tropa) * (n / b.n0 * 1.5 + (F.tiro >= 1 ? SUSTO : 0) * dt);
  }
  /* La descarga de pila justo antes del choque (js/guerra.js: acercar). Dentro del testudo no se puede lanzar */
  function pila(S, u) {
    if (u.forma === 'testudo' || u.cambio > 0) return;
    let b = null; for (const v of S.man) { if (v.lado === u.lado || !vivo(v)) continue; const [lx, ly] = local(u, v.x, v.y); if (ly > 0 && ly - fondo(v) / 2 - fondo(u) / 2 < SALVA.alc && Math.abs(lx) < frente(u) / 2 + frente(v) / 2) { b = v; break; } }
    if (!b) return;
    u.pila = true;
    const n = SALVA.parte * u.n * blanco(b.tropa) * FORMAS[b.forma].tiro;
    quitar(S, b, n / (VIDA[b.tropa] || 1)); b.moral -= morMul(b.tropa) * n / b.n0 * 1.5; b.frenada = 5; b.fuego = S.t;
    ev(S, 'pila', u, u.nom + ' arrojan ' + (ARROJA[u.tropa] === 'pila' ? 'los pila' : 'sus jabalinas') + ' sobre ' + b.nom, { con: b.id, arma: ARROJA[u.tropa] });
  }
  /* Elefantes heridos o agotados se vuelven contra los suyos (js/guerra.js: mente; Polibio 1.40) */
  function desbocar(S, u) {
    u.desboque = true; let v = null, md = 40;
    for (const w of S.man) { if (w === u || w.lado !== u.lado || !vivo(w)) continue; const d = Math.hypot(w.x - u.x, w.y - u.y); if (d < md) { md = d; v = w; } }
    if (v) { quitar(S, v, v.n * 0.1); v.moral -= 0.1; }
    ev(S, 'desboque', u, 'Los elefantes se desbocan' + (v ? ': pisotean a ' + v.nom : ''), { con: v ? v.id : -1 });
    romper(S, u);
  }

  function quitar(S, u, n) { const q = Math.min(Math.max(0, n), u.n); u.n -= q; return q; }

  function estado(S, u) {
    if (!enCampo(u)) return;
    if (u.n < Math.max(2, 0.05 * u.n0)) { u.estado = 'caida'; u.n = Math.max(0, u.n); ev(S, 'caida', u, 'Cae ' + u.nom + ': no queda casi nadie'); contagio(S, u); return; }
    if (!vivo(u)) return;
    if (u.moral <= 0 || u.n < 0.15 * u.n0) { romper(S, u); return; }
    if (u.estado === 'firme' && u.moral < 0.35) { u.estado = 'duda'; ev(S, 'duda', u, u.nom + ' dudan'); }
    else if (u.estado === 'duda' && u.moral > 0.45) u.estado = 'firme';
  }
  function romper(S, u) {
    u.estado = 'roto'; u.moral = 0; u.orden = 'huir'; u.dest = null; u.carga = false; u.relevo = 0;
    if (u.con >= 0) { const r = S.man[u.con]; if (r) { r.con = -1; r.relevo = 0; } u.con = -1; }
    ev(S, 'ruptura', u, u.nom + ' se rompen y huyen', { n: Math.round(u.n) });
    contagio(S, u);
  }
  /* Una ruptura cercana asusta a los suyos y anima al rival (js/guerra.js: romper, a la escala de un manípulo) */
  function contagio(S, u) {
    for (const v of S.man) { if (v === u || !vivo(v)) continue; const d = Math.hypot(v.x - u.x, v.y - u.y); if (d > CONTAGIO.radio) continue; if (v.lado === u.lado) v.moral = Math.max(0.02, v.moral - CONTAGIO.amigos * morMul(v.tropa)); else v.moral = Math.min(1, v.moral + CONTAGIO.rivales); }
  }

  /* ---------- fin ---------- */
  const enPie = (S, l) => S.man.reduce((a, u) => a + (u.lado === l && vivo(u) ? u.n : 0), 0);
  const inicial = (S, l) => S.man.reduce((a, u) => a + (u.lado === l ? u.n0 : 0), 0);
  function comprobarFin(S) {
    const p = [0, 1].map(l => inicial(S, l) ? enPie(S, l) / inicial(S, l) : 0);
    if (p[0] <= 0 && p[1] <= 0) return fin(S, p[0] >= p[1] ? 'victoria' : 'derrota', 'Los dos ejércitos se deshacen');
    if (p[1] < 0.3) return fin(S, 'victoria', 'El ejército enemigo se deshace y huye.');
    if (p[0] < 0.3) return fin(S, 'derrota', 'Tu ejército se deshace y huye.');
    if (S.t >= S.limite) fin(S, p[0] > p[1] ? 'victoria' : 'derrota', 'Cae la tarde y los ejércitos se separan');
  }
  function fin(S, como, motivo) {
    if (S.fase === 'fin') return;
    S.fase = 'fin';
    if (!motivo) motivo = como === 'retirada' ? 'Sacas a la legión en orden. El campo queda para el enemigo.' : '';
    const tot = l => Math.round(S.man.reduce((a, u) => a + (u.lado === l ? u.n : 0), 0));
    S.resultado = { como, motivo, t: S.t, bajas: [0, 1].map(l => Math.round(inicial(S, l)) - tot(l)), inicial: [0, 1].map(l => Math.round(inicial(S, l))), ordenes: S.ordenes };
    ev(S, 'fin', null, motivo, { como });
  }
  const retirarse = S => fin(S, 'retirada');

  /* Avanza segundos (con paso fijo). programadas = [{t, …orden}] se dan cuando llega su hora: sirve para repetir una batalla igual */
  function avanzar(S, segundos, programadas) {
    const hasta = S.t + segundos - 1e-9, cola = (programadas || []).slice().sort((a, b) => a.t - b.t);
    while (S.t < hasta && S.fase !== 'fin') {
      while (cola.length && cola[0].t <= S.t + 1e-9) ordenar(S, cola.shift());
      if (S.pausa) { if (!cola.length) break; continue; }
      paso(S);
    }
    return S;
  }

  const guardar = S => JSON.stringify(S, (k, v) => k === 'cont' ? undefined : v);
  function cargar(texto) { const S = JSON.parse(texto); recontar(S); return S; }
  /* Los contactos no se guardan: se recalculan al cargar (los necesitan las órdenes antes del primer paso) */
  function recontar(S) {
    const g = []; for (const u of S.man) g[u.id] = { f: frente(u), d: fondo(u) };
    S.cont = S.man.map(() => []);
    for (let i = 0; i < S.man.length; i++) for (let j = i + 1; j < S.man.length; j++) {
      const u = S.man[i], v = S.man[j]; if (u.lado === v.lado || !enCampo(u) || !enCampo(v) || (!vivo(u) && !vivo(v)) || !tocan(u, v, g)) continue;
      const cu = lado(u, v, g), cv = lado(v, u, g); if (cu !== 'frente' && cv !== 'frente') continue;
      S.cont[i].push({ id: j, cara: cu }); S.cont[j].push({ id: i, cara: cv });
    }
  }

  /* ---------- salida para la campaña: la misma forma que Guerra.resumen ---------- */
  function resumen(S) {
    if (S.fase !== 'fin') retirarse(S);
    const f = S.resultado, filas = [];
    for (let b = 0; b < 2; b++) for (const t of Object.keys(S.n0[b])) {
      const us = S.man.filter(u => u.lado === b && u.tropa === t), n0 = S.n0[b][t], n = Math.round(us.reduce((a, u) => a + u.n, 0));
      filas.push({ id: 'b' + b + '-' + t, bando: b, tipo: t, nombre: nombre(t), n0, n: Math.min(n0, n), bajas: Math.max(0, n0 - n), huyo: us.every(u => !vivo(u)), vet: 0 });
    }
    const ganador = f.como === 'victoria' ? 0 : 1, vivos = filas.filter(x => x.bando === 1).reduce((a, x) => a + x.n, 0);
    return { ganador, victoria: ganador === 0, motivo: f.motivo, t: f.t, bajas: filas, bajasTotal: [0, 1].map(b => filas.filter(x => x.bando === b).reduce((a, x) => a + x.bajas, 0)),
      general: null, prisioneros: ganador === 0 ? Math.round(0.25 * vivos) : 0, registro: S.reg, estado: S };
  }

  /* ---------- para pintar (CG4) ---------- */
  /* Las palabras de TP0 §6: ánimo (firme, duda, rompe) · cansancio (fresca, cansada, agotada) · combate (ganando, igualado, perdiendo) */
  function palabras(u, S) {
    const animo = u.estado === 'roto' ? 'rompe' : u.estado === 'duda' ? 'duda' : vivo(u) ? 'firme' : u.estado;
    const cansancio = u.fatiga < 0.4 ? 'fresca' : u.fatiga < 0.8 ? 'cansada' : 'agotada';
    let combate = '';
    if (S && S.cont && S.cont[u.id] && S.cont[u.id].length) { const r = S.man[S.cont[u.id][0].id], k = fuerza(u) * escala(u) - fuerza(r) * escala(r); combate = k > 0.12 ? 'ganando' : k < -0.12 ? 'perdiendo' : 'igualado'; }
    return { animo, cansancio, combate };
  }
  function vista(S) {
    return S.man.map(u => ({ id: u.id, lado: u.lado, tropa: u.tropa, nom: u.nom, x: u.x, y: u.y, a: u.a, frente: frente(u), fondo: fondo(u), forma: u.forma, luego: u.luego,
      estado: u.estado, n: Math.round(u.n), n0: u.n0, moral: u.moral, fatiga: u.fatiga, mando: u.mando, ala: u.ala, orden: u.orden, dest: u.dest, obj: u.obj,
      lucha: !!(S.cont && S.cont[u.id] && S.cont[u.id].length), relevo: u.relevo > 0 ? 1 - u.relevo / T_RELEVO : 0, carga: u.carga, palabras: palabras(u, S) }));
  }
  /* Las órdenes que tocan ahora a un manípulo (para los botones): [{tipo, forma?, no}] con no = '' si se puede o el motivo */
  function ordenesDe(S, id) {
    const u = S.man[id], r = [];
    for (const tipo of ['mover', 'cargar', 'relevar', 'retirar', 'aguantar']) r.push({ tipo, no: puede(S, { tipo, ids: [id], x: 0, y: 0 }) });
    for (const forma of sabe(u.tropa)) r.push({ tipo: 'formar', forma, nombre: FORMAS[forma].n, no: puede(S, { tipo: 'formar', ids: [id], forma }) });
    if (u.mando === 'jugador') r.push({ tipo: 'devolver', no: '' });
    return r;
  }


  /* ---------- CG6b: a pie, tu duelo (reglas y números de la maqueta TP8b, gobierno/maquetas/a-pie/acciones.js, tuDuelo).
     El galo de delante avisa su golpe: arma el brazo (el anillo se cierra, ámbar → rojo) y suelta. Si paras dentro de la
     ventana, da en tu escudo y queda abierto: tu golpe entra. El empujón lo desequilibra (y corta su golpe si aún arma).
     Golpear sin abrirlo: te para y su contraataque no se para. Cada gesto gasta aliento (0–100) y se recobra si no pulsas.
     A la tercera herida caes y otro soldado toma tu puesto. El pilum, una vez, al empezar el duelo. Lógica pura: ni pantalla
     ni azar de fuera (semilla propia). El reloj D.T lo lleva quien llama, en segundos. ---------- */
  const C_EST = 30, C_EMP = 25, C_PAR = 8, C_PIL = 20, RECOBRA = 14, CONTRA = 0.22;
  const AVISO = 0.95, RAPIDO = 0.4, FINTA = 0.5, VENTANA = 0.45, CD_PARAR = 0.75, SUELTA = 0.32, TU_GOLPE = 0.34, PILUM_HASTA = 2.5;
  function duelo(semilla) {
    return { T: 0, sem: (semilla >>> 0) % 2147483646 + 1, fuelle: 100, heridas: 0, mata: 0, caidas: 0, gg: 0, pilum: true, t0: 0,
      at: null, tu: null, abierto: 0, deseq: 0, next: 1.4, tParar: -9, tEmpuja: 0, tPulsa: -9, contraT: 0, eco: [], hechos: [] };
  }
  const azarD = D => { D.sem = (D.sem * 16807) % 2147483647; return (D.sem - 1) / 2147483646; };
  const ecoD = (D, t, c) => D.eco.push({ t: D.T, texto: t, clase: c || '' });
  const ocupadoD = D => !!(D.at && D.T <= D.at.ts + 0.05) || !!(D.tu && D.T <= D.tu.ts + 0.05);
  function avisaD(D, forz) {
    const r = azarD(D), tipo = forz || (r < 0.3 ? 'rapido' : r < 0.58 && !(D.at && D.at.tipo === 'finta') ? 'finta' : 'tajo');
    const tA = tipo === 'rapido' ? RAPIDO : tipo === 'contra' ? 0.1 : AVISO, tb = tA + (tipo === 'finta' ? FINTA : 0);
    D.at = { tipo, t0: D.T, tA, tb, ts: D.T + tb + SUELTA, imparable: tipo === 'contra', hecho: false, ecoF: false };
    D.next = D.at.ts + 1.3 + azarD(D) * 1.3; D.contraT = 0;
  }
  function nuevoGalo(D) { D.gg = 0; D.at = null; D.abierto = 0; D.deseq = 0; D.next = D.T + 1.6; }
  /* un paso del duelo: dt segundos; pide = 'golpear' | 'parar' | 'empujar' | 'pilum' | null. Devuelve los hechos nuevos */
  function dueloPaso(D, dt, pide) {
    D.T += Math.max(0, dt || 0); const T = D.T, hechos = []; D.hechos = hechos;
    if (pide) D.tPulsa = T;
    if (T - D.tPulsa > 0.35) D.fuelle = Math.min(100, D.fuelle + RECOBRA * (dt || 0));
    if (D.contraT && T >= D.contraT) avisaD(D, 'contra');
    const oc = ocupadoD(D), abierto = T < D.abierto || T < D.deseq;
    if (pide === 'parar') { if (T - D.tParar >= CD_PARAR && D.fuelle >= C_PAR) { D.tParar = T; D.fuelle -= C_PAR; hechos.push('para'); } }
    else if (pide === 'empujar') {
      if (T < D.tEmpuja) ecoD(D, 'Aún no: recobra el escudo', 'mal'); else if (D.fuelle < C_EMP) ecoD(D, 'Sin aliento', 'mal');
      else {
        D.tEmpuja = T + 1.5; D.fuelle -= C_EMP; hechos.push('empuja');
        const armando = D.at && !D.at.hecho && T - D.at.t0 < D.at.tb * 0.9;
        if (!oc || armando) { if (armando) D.at = null; D.deseq = T + 1.5; D.next = Math.max(D.next, T + 2.4); ecoD(D, armando ? '¡Le cortas el golpe! Golpea' : 'Lo desequilibras: ¡golpea!', 'bien'); }
        else ecoD(D, 'Tarde: para su golpe', 'mal');
      }
    } else if (pide === 'golpear') {
      if (oc) ecoD(D, D.tu ? 'Ya golpeas' : 'Espera: para su golpe', 'mal'); else if (D.fuelle < C_EST) ecoD(D, 'Sin aliento', 'mal');
      else { D.fuelle -= C_EST; D.tu = { t0: T, ts: T + TU_GOLPE, abierto, pilum: false, hecho: false }; D.abierto = 0; D.deseq = 0; D.next = Math.max(D.next, T + 1.6 + azarD(D) * 0.8); hechos.push('golpea'); }
    } else if (pide === 'pilum') {
      if (!D.pilum) ecoD(D, 'Ya lanzaste el pilum', 'mal'); else if (T - D.t0 > PILUM_HASTA) ecoD(D, 'Demasiado cerca para el pilum', 'mal');
      else if (oc) ecoD(D, 'Espera: para su golpe', 'mal'); else if (D.fuelle < C_PIL) ecoD(D, 'Sin aliento', 'mal');
      else { D.pilum = false; D.fuelle -= C_PIL; D.tu = { t0: T, ts: T + 0.5, abierto: abierto || azarD(D) < 0.5, pilum: true, hecho: false }; D.next = Math.max(D.next, T + 1.8); hechos.push('lanza'); }
    }
    /* tu golpe llega */
    if (D.tu && !D.tu.hecho && T >= D.tu.ts) {
      const g = D.tu; g.hecho = true;
      if (g.pilum) { if (g.abierto) { D.mata++; hechos.push('mata'); ecoD(D, '¡El pilum lo abate!', 'bien'); nuevoGalo(D); } else { D.deseq = T + 2; ecoD(D, 'El pilum se clava en su escudo: ¡golpea!', 'bien'); } }
      else if (g.abierto) { if (D.gg >= 1) { D.mata++; hechos.push('mata'); ecoD(D, '¡Buen golpe! Cae', 'bien'); nuevoGalo(D); } else { D.gg++; hechos.push('hiere'); ecoD(D, '¡Buen golpe!', 'bien'); } }
      else { D.contraT = T + CONTRA; hechos.push('parado'); ecoD(D, 'Te para: ábrelo antes', 'mal'); }
    }
    /* su golpe llega */
    if (D.at && !D.at.hecho && T >= D.at.ts) {
      const a = D.at; a.hecho = true;
      const par = !a.imparable && D.tParar > a.ts - VENTANA && D.tParar <= a.ts + 0.06;
      if (par) { D.abierto = T + 1.4; hechos.push('parada'); ecoD(D, '¡Parado!', 'bien'); }
      else {
        D.heridas++; const pronto = a.tipo === 'finta' && D.tParar > a.t0;
        if (D.heridas >= 3) { D.heridas = 0; D.caidas++; D.fuelle = 100; D.contraT = 0; D.tu = null; D.next = T + 2; hechos.push('cae'); ecoD(D, 'Has caído: otro soldado toma tu puesto', 'mal'); }
        else { hechos.push('herido'); ecoD(D, a.imparable ? 'Te has descubierto: herido (' + D.heridas + ' de 3)' : pronto ? 'Paraste pronto: herido (' + D.heridas + ' de 3)' : 'Herido (' + D.heridas + ' de 3)', 'mal'); }
      }
    }
    if (D.at && !D.at.hecho && a2Finta(D)) { D.at.ecoF = true; ecoD(D, '¡Finta!'); }
    if (!ocupadoD(D) && T >= D.next && T >= D.deseq) avisaD(D);
    return hechos;
  }
  const a2Finta = D => D.at.tipo === 'finta' && !D.at.ecoF && D.T - D.at.t0 > D.at.tA + 0.05;
  /* lo que se ve: el aviso (fraccion 0 → 1 del anillo que se cierra; ventana = ahora es cuándo parar) y en qué punto del
     clip de ataque va cada uno (null si no ataca). Arma despacio (hasta 0,4 del clip) y suelta deprisa */
  function dueloVer(D) {
    const T = D.T, a = D.at && !D.at.hecho ? D.at : null, u = D.tu && T <= D.tu.ts + 0.35 ? D.tu : null;
    const aviso = a ? { tipo: a.tipo, frac: Math.min(1, (T - a.t0) / (a.ts - a.t0)), ventana: !a.imparable && T > a.ts - VENTANA, imparable: a.imparable } : null;
    const clipG = D.at && T <= D.at.ts + 0.3 ? (T < D.at.t0 + D.at.tb ? 0.4 * (T - D.at.t0) / D.at.tb : 0.4 + 0.6 * Math.min(1, (T - D.at.t0 - D.at.tb) / (SUELTA + 0.3))) : null;
    const clipR = u ? Math.min(1, (T - u.t0) / (u.ts - u.t0 + 0.35)) : null;
    return { aviso, fuelle: Math.round(D.fuelle), heridas: D.heridas, mata: D.mata, caidas: D.caidas, abierto: T < D.abierto || T < D.deseq,
      pilum: D.pilum && T - D.t0 <= PILUM_HASTA, parando: T - D.tParar < 0.5, clipG, clipR, tuPilum: !!(u && u.pilum),
      costes: { golpear: C_EST, parar: C_PAR, empujar: C_EMP, pilum: C_PIL } };
  }
  /* lo hecho a pie pesa en el simulador: cada galo que abates quita 1 al rival en contacto y le baja la moral; cada vez que
     caes quita 1 al tuyo; un duelo bien llevado anima a los tuyos. Tope: lo tuyo no pasa del 30 % de las bajas del rival
     en ese contacto (licencia de juego: un hombre no gana la batalla) */
  function apie(S, id, h) {
    const u = S.man[id]; if (!u || !vivo(u)) return { mata: 0, cae: 0 };
    h = h || {}; const c = (S.cont[id] || []).find(c => c.cara === 'frente' && vivo(S.man[c.id])) || (S.cont[id] || []).find(c => vivo(S.man[c.id]));
    const r = { mata: 0, cae: 0 }; S.apie = S.apie || {};
    if (c && h.mata > 0) {
      const v = S.man[c.id], k = id + '-' + v.id, hechas = S.apie[k] || 0, tope = Math.max(2, Math.floor(0.3 * (v.n0 - v.n + 1)));
      const q = Math.min(h.mata, Math.max(0, tope - hechas));
      if (q > 0) { r.mata = quitar(S, v, q); S.apie[k] = hechas + r.mata; v.moral -= 0.012 * q; u.moral = Math.min(1, u.moral + 0.008 * q); ev(S, 'apie', u, 'Tu centurión abate a un galo'); }
    }
    if (h.heridas > 0) u.moral -= 0.004 * h.heridas;
    if (h.cae > 0) { r.cae = quitar(S, u, h.cae); u.moral -= 0.01 * h.cae; ev(S, 'apie', u, 'Cae tu centurión: otro toma su puesto'); }
    return r;
  }

  /* LP7: vuelve la lucha a pie («Bajar a pie», el control del bloque de js/bloque-ia.js en una capa). La batalla no sabe cómo se
     peleó: recibe por bloque { hombres, enPie, roto } (r.bloques[k]) y lo pasa a sus manípulos con mapa[k] = { id, esc }
     (esc = hombres de aquí por hombre de allí). r.pose = dónde acabó la primera fila de tu bloque en su marco (x a su derecha,
     z hacia atrás, ang girado a su derecha), que empezó en (0, 0, 0). Devuelve { bajas: [tuyas, suyas], rotos: [ids] } */
  function vuelveDePie(S, o) {
    const r = (o && o.r) || {}, B = r.bloques || {}, out = { bajas: [0, 0], rotos: [] };
    for (const k in (o.mapa || {})) {
      const m = o.mapa[k], b = B[k], u = S.man[m.id]; if (!b || !u || !vivo(u)) continue;
      const q = quitar(S, u, Math.round(Math.max(0, b.hombres - b.enPie) * (m.esc || 1))); out.bajas[u.lado] += q;
      if (b.roto) { romper(S, u); out.rotos.push(u.id); } else estado(S, u);
    }
    const u = S.man[o.tuyo], p = r.pose;
    if (u && vivo(u) && p) {
      const c = Math.cos(u.a), s = Math.sin(u.a), lat = p.x, ade = -p.z;
      u.x += s * lat + c * ade; u.y += -c * lat + s * ade; u.a -= p.ang || 0; u.dest = null;
      if (u.orden === 'mover') u.orden = 'quieto';
    }
    if (u) ev(S, 'apie', u, (r.ganador === 'tuyo' ? 'Vuelves a pie con la victoria: ' : r.ganador === 'enemigo' ? 'Tu manípulo rompió a pie: ' : 'Vuelves al mando: ') + out.bajas[0] + ' bajas tuyas y ' + out.bajas[1] + ' suyas', { bajas: out.bajas });
    return out;
  }

  const Simulador = { crear, vuelveDePie, paso, avanzar, ordenar, puede, retirarse, fin, resumen, guardar, cargar, vista, palabras, ordenesDe, rnd,
    fuerza, frente, fondo, lado, duelo, dueloPaso, dueloVer, apie, aPie, PASO, FORMAS, SABE, TAM, TRIBUNOS, JEFES, CAR, PLANES, CAMPO, DIST0, LIMITE };
  root.Simulador = Simulador;
  if (typeof module !== 'undefined') module.exports = Simulador;
})(typeof window !== 'undefined' ? window : globalThis);
