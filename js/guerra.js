/* AQVILA — Guerra nueva (GC3): el motor de la batalla nueva, sin pantalla. Corre en Node y en el navegador (global `Guerra`).
   Sale de la maqueta gobierno/maquetas/guerra-cero/reglas.js SIN cambiar cómo se juega: tres cuerpos (ala izquierda, centro,
   ala derecha), cuatro órdenes (empujar, aguantar, relevo, caballería) y los mismos números de ritmo.
   Cambia de dónde salen los ejércitos y cómo se guarda: todo el estado B es JSON puro (sin funciones ni ciclos).

   GM5 (17/11/2026): EMPIEZA DE LEJOS, como la maqueta guerra-lejos (GM7 y GM7b, aprobadas). Los cuerpos salen a DIST0 = 240 m
   y se acercan; cada cuerpo choca cuando llega. Mientras se acercan, los botones de Roma son avanzar, escudos y testudo
   (testudo en campo abierto: licencia de juego). Delante van los tiradores (vélites, peltastas, honderos: cls «rng»): tiran
   a lo que tengan a tiro y se retiran antes del choque. Al llegar, la descarga de pila. Lo demás (choque, relevo, jinetes) no cambia.

   API: crear({semilla, ejercitos:[{id:n}, {id:n}]}) · paso(B,dt) · ordenar(B,i,orden) · puede(B,i,orden) · retirarse(B) · fin(B,como,motivo)
        guardar(B) = JSON.stringify · cargar(texto) · resumen(B) · rnd(B) · ayudas: frente, hombres, hombresLado, inicialLado, vecino
   El azar es un número en el estado (B.sem). Misma semilla y mismas órdenes dan la misma batalla; guardar a mitad y cargar no la cambia.

   REPARTO DE LOS EJÉRCITOS (cada ejército es {idTropa: cantidad} de D.UNITS, como info.cfg.sides[b].units)
   · Roma (bando 0): hastati, príncipes y triarios son las líneas 1, 2 y 3 de cada cuerpo. Cada tipo se reparte entre los tres
     cuerpos a partes iguales; lo que sobra va al centro. La caballería (cls «cav») no entra en las líneas: es la reserva de cargas.
     Su impacto escala con sus hombres (60 jinetes = la maqueta). Sin caballería no hay orden «caballería».
     Las tropas de tiro (cls «rng») van delante, en c.tir, repartidas entre los tres cuerpos (GM5). Si no hay otra infantería, forman línea.
     Las demás tropas (milicia, aliados, elefantes…) se suman como hombres a la primera línea; sin hastati, forman esa línea.
     Si falta un tipo de línea, el cuerpo tiene menos líneas (mínimo una). Cada línea guarda su composición para repartir las bajas por tipo.
   · Enemigo (bando 1): cada tipo tiene un carácter (tabla CARACTER). Los tipos de infantería se ordenan por hombres. Con 3 o más
     tipos, el tipo k va entero al cuerpo k (el mayor al centro, luego izquierda, derecha) y los sobrantes forman una línea de
     refresco en el cuerpo con menos hombres. Con 1 o 2 tipos, cada tipo se reparte a partes iguales en los tres cuerpos.
     Los jinetes enemigos hacen de númidas: su número escala el hostigamiento. Sin jinetes enemigos no hay númidas.
   · Tamaño: el daño de una línea escala con sus hombres respecto de un tamaño de referencia (Roma: 120 por línea, 60 los triarios,
     como en la maqueta; enemigo: 720 por cuerpo, que es lo que valen 230–260 hombres de la maqueta en un ejército de campaña
     de 2 100 hombres). Con topes (0,15 a 3) para que no explote. Un ejército doble gana con claridad; con fuerzas parejas vale la maqueta.
   · Cuerpos vacíos se dan por rotos. Un bando sin infantería pierde.

   PARA GC4 (no escrito aquí): en js/game.js haría falta algo como G.estadoGuerra(info), que devuelva
   Guerra.crear({semilla: info.cfg.seed, ejercitos: [info.cfg.sides[0].units, info.cfg.sides[1].units]}),
   y al terminar G.resultadoNueva(info, Guerra.resumen(B), estM). Los bonos (muralla, atkMul…) no se usan todavía. */
(function (root) {
  'use strict';
  let D = root.DATA;
  if (typeof require !== 'undefined') { try { if (!D) D = require('./data.js'); } catch (e) { /* sin datos: tabla vacía */ } }
  const UN = (D && D.UNITS) || {};

  /* ---------- carácter de cada tropa ----------
     cal = calidad en el choque · cansa = cuánto se fatiga al empujar · firme = aguanta mejor a pie quieto
     mente: furia = carga y se cansa · paciencia = espera y contragolpea · media = alterna.
     Las cifras de cal y cansa son licencia de juego. Las fuentes dan el carácter, no los números
     (todo sin cotejar pasaje a pasaje: se cita la obra y el capítulo que se recuerda). */
  const CARACTER = {
    hastati:   { cal: 1.00, cansa: 1.00, mente: 'media', pl: true },                 /* legión manipular: Polibio 6.21-24, sin cotejar. Cifras: licencia de juego */
    principes: { cal: 1.14, cansa: 0.90, mente: 'media', pl: true },                 /* ídem */
    triarii:   { cal: 1.12, cansa: 0.80, mente: 'media', firme: true, pl: true },    /* ídem; lanceros que aguantan a pie quieto */
    galos:     { cal: 1.34, cansa: 1.75, mente: 'furia', nom: 'guerreros galos' },                 /* Polibio 2.33: furia inicial que se agota. Cifras: licencia de juego */
    libios:    { cal: 1.20, cansa: 0.72, mente: 'paciencia', nom: 'infantería libia', art: 'la', pl: false },             /* Polibio 15.11-14 y 3.114: armados a la romana en Cannas. Cifras: licencia de juego */
    iberos:    { cal: 1.10, cansa: 1.05, mente: 'media', nom: 'guerreros íberos' },                 /* Polibio 3.114. Cifras: licencia de juego */
    sagrada:   { cal: 1.25, cansa: 0.75, mente: 'media', firme: true, nom: 'ciudadanos de Cartago' },    /* Diodoro 16.80 (Batallón Sagrado). Cifras: licencia de juego */
    falange:   { cal: 1.22, cansa: 0.70, mente: 'media', firme: true, flanco: 1.85, art: 'la', pl: false },   /* Polibio 18.29-30 y 18.32: de frente imbatible, de flanco se hunde. Cifras: licencia de juego */
    elefantes: { cal: 1.55, cansa: 2.4, mente: 'furia', pavor: true, art: 'los', pl: true },        /* Plutarco, Pirro 17 y 21; Polibio 1.40: arrollan al chocar y, heridos, se desbocan. Cifras: licencia de juego */
    hoplitas:  { cal: 1.05, cansa: 0.85, mente: 'media', firme: true },    /* licencia de juego */
    peltastas: { cal: 0.70, cansa: 1.00, mente: 'media' },                 /* licencia de juego */
    honderos:  { cal: 0.65, cansa: 1.00, mente: 'media' },                 /* licencia de juego */
    milicia:   { cal: 0.80, cansa: 1.00, mente: 'media', art: 'la', pl: false },                 /* licencia de juego */
    vigiles:   { cal: 0.85, cansa: 1.00, mente: 'media', nom: 'guardia urbana', art: 'la', pl: false }                  /* licencia de juego */
  };
  const GENERICO = { cal: 1.0, cansa: 1.0, mente: 'media' };
  /* Cómo se nombra un cuerpo en los avisos: «Los galos cargan», «La falange avanza». Sin ficha: plural. */
  const sujeto = t => { const T = car(t), n = T.nom || nombre(t).toLowerCase(), pl = T.pl !== undefined ? T.pl : true, art = T.art || (pl ? 'los' : 'la'); const x = art + ' ' + (t === 'elefantes' ? 'elefantes' : n); return { x: x.charAt(0).toUpperCase() + x.slice(1), pl }; };
  const verbo = (t, pl, plural, singular) => pl ? plural : singular;
  const FRASE = {
    carga: (t, d) => { const q = sujeto(t); return t === 'falange' ? q.x + ' avanza con las sarisas bajas ' + d : t === 'elefantes' ? q.x + ' arremeten ' + d : t === 'galos' ? q.x + ' se lanzan a la carga ' + d : q.x + ' ' + verbo(t, q.pl, 'cargan', 'carga') + ' ' + d; },
    cede: (t, d) => { const q = sujeto(t); return t === 'falange' ? 'La falange se detiene ' + d : q.x + ' ' + verbo(t, q.pl, 'flaquean', 'flaquea') + ' ' + d; },
    huye: (t, d) => { const q = sujeto(t); return t === 'falange' ? 'Se rompe la falange ' + d : t === 'elefantes' ? 'Los elefantes se desbandan ' + d : q.x + ' ' + verbo(t, q.pl, 'huyen', 'huye') + ' ' + d; },
    desboque: (t, d) => 'Los elefantes se desbocan ' + d + ': pisotean a los suyos'
  };              /* tipo sin ficha: licencia de juego */
  const car = t => CARACTER[t] || GENERICO;
  const nombre = t => (UN[t] && UN[t].n) || t;
  const esCab = t => !!(UN[t] && UN[t].cls === 'cav');
  const esTiro = t => !!(UN[t] && UN[t].cls === 'rng');

  const NOMBRE_SECTOR = ['Ala izquierda', 'Centro', 'Ala derecha'];
  const DONDE = ['por la izquierda', 'en el centro', 'por la derecha'];
  const T_MARCHA = 7;               /* segundos hasta el choque */
  const T_RELEVO = 3.2;             /* lo que tarda una línea en pasar por los huecos de la otra */
  const T_CABALLERIA = 24;          /* descanso de los jinetes entre cargas (con 60) */
  const BASE_FATIGA = 1 / 42;       /* empujando sin parar, una línea se agota en unos 40 s */
  const DESCANSO = 1 / 120;         /* una línea en retaguardia recobra el aliento despacio */
  const K_BAJAS = 1.55;             /* hombres por segundo que causa una fuerza de 1 */
  const REF_ROMA = { hastati: 120, principes: 120, triarii: 60 };
  const REF_ENEMIGO = 720;
  const REF_ELE = 10;               /* elefantes de una línea con su propia referencia: 10 pesan como 720 hombres */
  const REF_CAB = 60;

  /* ---------- GM5: de lejos (números de la maqueta guerra-lejos; todos licencia de juego) ---------- */
  const DIST0 = 240;                /* metros entre las dos líneas al empezar (GM7b) */
  const CONTACTO = 1;               /* a esta distancia ya se lucha cuerpo a cuerpo */
  const T_DESHACER = 3.5;           /* segundos que tarda un testudo en deshacerse para volver a andar */
  const SUSTO = 0.02;               /* moral que pierde por segundo un cuerpo al que le llueven proyectiles sin cubrirse */
  const LUCHA_MAX = 253;            /* segundos de lucha antes de que caiga la tarde (los de antes, sin contar la marcha) */
  /* paso = metros por segundo · recibe = parte de los proyectiles que hacen baja · cansa = fatiga por segundo · aprieta = cuánto se juntan */
  const POSTURAS = {
    avanzar: { paso: 2.4,  recibe: 1,    cansa: 0,      aprieta: 1 },
    escudos: { paso: 1.3,  recibe: 0.42, cansa: 1 / 90, aprieta: 0.82 },
    testudo: { paso: 0.35, recibe: 0.1,  cansa: 1 / 40, aprieta: 0.62 }
  };
  /* Tiradores: arma, alcance (m), bajas por tirador y segundo contra tropa sin cubrir, segundos de munición, cuánto se adelantan y a qué paso */
  const TIRO = {
    velites:   { arma: 'jabalinas', alc: 30, tiro: 0.032, mun: 15, adelanto: 34, marcha: 3.6 },
    peltastas: { arma: 'jabalinas', alc: 30, tiro: 0.032, mun: 15, adelanto: 34, marcha: 3.6 },
    honderos:  { arma: 'piedras',   alc: 80, tiro: 0.15,  mun: 24, adelanto: 34, marcha: 3.0 }
  };
  const TIRO_GEN = { arma: 'jabalinas', alc: 30, tiro: 0.032, mun: 15, adelanto: 34, marcha: 3.4 };
  const ARROJA = { hastati: 'pila', principes: 'pila', iberos: 'jabalinas' };   /* descarga justo antes del choque */
  const SALVA = { alc: 14, parte: 0.05 };
  const MARCHA = { falange: 1.5, hoplitas: 1.8, libios: 1.8, sagrada: 1.8, galos: 2.7, iberos: 2.7, elefantes: 2.6 };   /* el enemigo no se cubre: anda a su paso */
  const BLANCO = { hastati: 0.8, principes: 0.75, triarii: 0.7, galos: 1, libios: 0.6, iberos: 0.75, falange: 0.55, hoplitas: 0.6, sagrada: 0.6, velites: 0.3, peltastas: 0.5, honderos: 0.7, milicia: 0.9, elefantes: 1 };
  const VIDA = { elefantes: 8 };    /* un elefante cuenta como 8 hombres para los proyectiles */
  const tiroDe = t => TIRO[t] || TIRO_GEN;
  const ESC_MIN = 0.15, ESC_MAX = 3;
  const limita = (x, a, b) => Math.max(a, Math.min(b, x));
  const suma = o => { let s = 0; for (const k in o) s += o[k]; return s; };

  /* ---------- azar dentro del estado ---------- */
  function rnd(B) { B.sem = (Math.imul(B.sem, 1664525) + 1013904223) >>> 0; return B.sem / 4294967296; }

  /* ---------- reparto ---------- */
  const parte = (n, i) => Math.floor(n / 3) + (i === 1 ? n % 3 : 0);

  function linea(tipo, comp, ref) {
    const c = {}; for (const k in comp) if (comp[k] > 0) c[k] = comp[k];
    const h = suma(c);
    return { tipo, hombres: h, max: h, fatiga: 0, comp: c, ref };
  }

  function cuerpo(lado, i, lineas, tir) {
    const l = lineas.filter(x => x.hombres > 0), vacio = l.length === 0;
    const t = !vacio && tir && tir.hombres > 0 ? Object.assign(tir, { estado: 'sale', av: 3, mun: tiroDe(tir.tipo).mun, blanco: null, dicho: 0 }) : null;
    const inicial = l.reduce((a, x) => a + x.hombres, 0) + (t ? t.hombres : 0);
    return { lado, i, lineas: l, tir: t, z: DIST0 / 2, postura: 'avanzar', cambio: 0, luego: null, pila: false, fuego: -9, impulso: 0, frenada: 0,
      moral: vacio ? 0 : 1, roto: vacio, relevo: 0, golpe: 0, flanqueado: false, libre: 0, tPost: 0, inicial, avisado: 0 };
  }
  /* GM5: los tiradores de cada cuerpo (una «línea» aparte, con su composición). tipos = los de tiro del ejército */
  function tiradores(ej, tipos) {
    const r = []; if (!tipos.length) return [null, null, null];
    const mayor = tipos.slice().sort((a, b) => ej[b] - ej[a])[0];
    for (let i = 0; i < 3; i++) { const comp = {}; for (const t of tipos) comp[t] = parte(ej[t], i); r.push(linea(mayor, comp, 1)); }
    return r;
  }
  /* Tropas de tiro que van delante: si el ejército no tiene otra infantería, no hay tiradores (forman la línea) */
  function deTiro(ej) {
    const tiro = [], otra = []; for (const t in ej) if (ej[t] > 0 && !esCab(t)) (esTiro(t) ? tiro : otra).push(t);
    return otra.length ? tiro : [];
  }

  function repartoRoma(ej) {
    const extras = [], cuerpos = [], tiro = deTiro(ej);
    for (const t in ej) if (!esCab(t) && !REF_ROMA[t] && ej[t] > 0 && !tiro.includes(t)) extras.push(t);
    for (let i = 0; i < 3; i++) {
      const ls = [], primera = {};
      if (ej.hastati > 0) primera.hastati = parte(ej.hastati, i);
      for (const t of extras) primera[t] = parte(ej[t], i);
      ls.push(linea('hastati', primera, REF_ROMA.hastati));
      if (ej.principes > 0) ls.push(linea('principes', { principes: parte(ej.principes, i) }, REF_ROMA.principes));
      if (ej.triarii > 0) ls.push(linea('triarii', { triarii: parte(ej.triarii, i) }, REF_ROMA.triarii));
      cuerpos.push(ls);
    }
    return cuerpos;
  }

  function repartoEnemigo(ej) {
    const tipos = [], tiro = deTiro(ej);
    let ele = 0; for (const t in ej) if (!esCab(t) && ej[t] > 0 && !tiro.includes(t)) { if (t === 'elefantes') ele = ej[t]; else tipos.push([t, ej[t]]); }
    if (!tipos.length && ele) { tipos.push(['elefantes', ele]); ele = 0; }
    tipos.sort((a, b) => b[1] - a[1]);
    const cuerpos = [[], [], []];
    if (tipos.length >= 3) {
      const orden = [1, 0, 2];
      for (let k = 0; k < 3; k++) cuerpos[orden[k]].push(linea(tipos[k][0], { [tipos[k][0]]: tipos[k][1] }, REF_ENEMIGO));
      if (tipos.length > 3) {
        const resto = {}; for (let k = 3; k < tipos.length; k++) resto[tipos[k][0]] = tipos[k][1];
        let j = 0; const tot = c => c.reduce((a, l) => a + l.hombres, 0);
        for (let i = 1; i < 3; i++) if (tot(cuerpos[i]) < tot(cuerpos[j])) j = i;
        cuerpos[j].push(linea(tipos[3][0], resto, REF_ENEMIGO));
      }
    } else {
      for (const [t, n] of tipos) for (let i = 0; i < 3; i++) cuerpos[i].push(linea(t, { [t]: parte(n, i) }, REF_ENEMIGO));
    }
    /* Los elefantes van delante, en el centro: el golpe de ariete del ejército. Si caen o se desbocan, entra la línea de detrás. */
    if (ele) cuerpos[1].unshift(linea('elefantes', { elefantes: ele }, REF_ELE));
    return cuerpos;
  }

  function reserva(ej) {
    const comp = {}; for (const t in ej) if (esCab(t) && ej[t] > 0) comp[t] = ej[t];
    const h = suma(comp);
    return { h, h0: h, comp };
  }

  function crear(cfg) {
    cfg = cfg || {}; const ej = cfg.ejercitos || [{}, {}];
    const B = { sem: ((cfg.semilla || 7) >>> 0) || 1, t: 0, t0: null, fase: 'lejos', sect: [], eventos: [], resultado: null, ordenes: 0,
      n0: [Object.assign({}, ej[0]), Object.assign({}, ej[1])], sitio: [{}, {}],
      cab: Object.assign({ estado: 'lista', sect: -1, t: 0 }, reserva(ej[0])),
      num: Object.assign({ estado: 'lejos', sect: -1, t: 0, veces: 0, proxima: 30 }, reserva(ej[1])) };
    const r = repartoRoma(ej[0]), e = repartoEnemigo(ej[1]), tr = tiradores(ej[0], deTiro(ej[0])), te = tiradores(ej[1], deTiro(ej[1]));
    for (let i = 0; i < 3; i++) B.sect.push({ i, frente: 0, dist: DIST0, tChoque: -1, c: [cuerpo(0, i, r[i], tr[i]), cuerpo(1, i, e[i], te[i])] });
    for (let b = 0; b < 2; b++) for (const s of B.sect) for (const l of todas(s.c[b])) for (const t in l.comp) B.sitio[b][t] = (B.sitio[b][t] || []).concat(s.i);
    for (const s of B.sect) s.dist = s.c[0].z + s.c[1].z;
    B.num.espera = 28 + rnd(B) * 8; B.num.proxima = 1e9;      /* GM5: los jinetes enemigos esperan al primer choque */
    if (B.num.h0 <= 0) { B.num.estado = 'ninguna'; B.num.veces = 99; B.num.proxima = 1e9; }
    return B;
  }

  /* ---------- ayudas ---------- */
  const frente = c => c.lineas[0];
  const todas = c => c.tir ? c.lineas.concat([c.tir]) : c.lineas;
  const hombres = c => c.lineas.reduce((a, l) => a + l.hombres, 0) + (c.tir ? c.tir.hombres : 0);
  const hombresLado = (B, lado) => B.sect.reduce((a, s) => a + hombres(s.c[lado]), 0);
  const inicialLado = (B, lado) => B.sect.reduce((a, s) => a + s.c[lado].inicial, 0);
  const guardar = B => JSON.stringify(B);
  /* Carga un estado guardado. Las batallas guardadas antes de GM5 (sin distancias) siguen como estaban: ya juntas */
  function cargar(texto) {
    const B = JSON.parse(texto);
    if (B && B.sect && B.sect[0] && B.sect[0].dist === undefined) {
      const enMarcha = B.fase === 'marcha';
      for (const s of B.sect) { s.dist = enMarcha ? CONTACTO : 0; s.tChoque = enMarcha ? -1 : Math.min(B.t, 7); for (const c of s.c) Object.assign(c, { tir: null, z: 0, cambio: 0, pila: true, fuego: -9, impulso: 0, frenada: 0 }); }
      if (enMarcha) { B.fase = 'lejos'; B.t0 = null; B.num.espera = Math.max(0, B.num.proxima - 7); B.num.proxima = 1e9; } else B.t0 = Math.min(B.t, 7);
    }
    return B;
  }
  const lejos = s => s.dist > 0;                                   /* el cuerpo aún se acerca */
  const tirando = c => c && c.tir && (c.tir.estado === 'sale' || c.tir.estado === 'tira') ? c.tir : null;   /* tiradores que siguen delante */
  const bajoFuego = (B, c) => B.t - c.fuego < 0.6;                  /* le están cayendo proyectiles ahora mismo */
  /* Los cuatro botones que tocan ahora en un sector */
  const ordenesDe = (B, i) => lejos(B.sect[i]) ? ['avanzar', 'escudos', 'testudo', 'caballeria'] : ['empujar', 'aguantar', 'relevo', 'caballeria'];

  function ev(B, tipo, sect, texto, mas) { B.eventos.push(Object.assign({ tipo, sect, texto, t: B.t }, mas || {})); }

  function fuerza(c) {
    const l = frente(c), T = car(l.tipo);
    const fondo = Math.max(0.3, Math.min(1, l.hombres / (0.4 * l.max)));
    return T.cal * fondo * (1 - 0.55 * l.fatiga) * (c.postura === 'empujar' ? 1.25 : 0.8) * (c.relevo > 0 ? 0.7 : 1) * (0.7 + 0.3 * c.moral) * (c.impulso > 0 ? 1.15 : 1) * (c.frenada > 0 ? 0.8 : 1);
  }
  const escala = l => limita(l.max / l.ref, ESC_MIN, ESC_MAX);

  /* Qué puede hacer el jugador ahora mismo en un sector. Devuelve '' si se puede, o el motivo en llano. */
  function puede(B, i, orden) {
    const s = B.sect[i], c = s.c[0];
    if (B.fase === 'fin') return 'La batalla ha terminado';
    if (orden === 'caballeria') {
      if (B.cab.h < 0.5) return 'No tienes caballería';
      if (B.cab.estado !== 'lista') return 'Los jinetes se están rehaciendo';
      if (s.c[1].roto) return 'Ahí ya no queda enemigo';
      if (lejos(s) && !tirando(s.c[1])) return 'Aún no han chocado: no hay flanco que cargar';
      return '';
    }
    if (c.roto) return 'Ese cuerpo ha huido';
    if (POSTURAS[orden]) {
      if (!lejos(s)) return 'Ya están luchando cuerpo a cuerpo';
      if (c.cambio > 0) return 'Están deshaciendo el testudo';
      return c.postura === orden ? 'Ya lo están haciendo' : '';
    }
    if (lejos(s)) return 'Aún no han chocado';
    if (orden === 'relevo') { if (c.lineas.length < 2) return 'No queda línea de refresco'; if (c.relevo > 0) return 'El relevo ya está en marcha'; return ''; }
    if (orden === 'empujar' || orden === 'aguantar') return c.postura === orden ? 'Ya lo están haciendo' : '';
    return 'Orden desconocida';
  }

  function ordenar(B, i, orden) {
    const no = puede(B, i, orden); if (no) return no;
    const c = B.sect[i].c[0]; B.ordenes++;
    if (POSTURAS[orden] && c.postura === 'testudo') { c.luego = orden; c.cambio = T_DESHACER; ev(B, 'orden', i, 'Deshacen el testudo', { orden }); }
    else if (POSTURAS[orden]) { c.postura = orden; ev(B, 'orden', i, orden === 'avanzar' ? '¡Adelante!' : orden === 'escudos' ? 'Escudos arriba' : 'Forman el testudo', { orden }); }
    else if (orden === 'empujar' || orden === 'aguantar') { c.postura = orden; ev(B, 'orden', i, orden === 'empujar' ? '¡Adelante!' : 'Escudos juntos', { orden }); }
    else if (orden === 'relevo') {
      c.lineas.push(c.lineas.shift()); c.relevo = T_RELEVO; c.moral = Math.min(1, c.moral + 0.1);
      ev(B, 'relevo', i, 'Entra la línea de ' + nombre(frente(c).tipo), { orden });
    } else if (orden === 'caballeria') { const t = tirando(B.sect[i].c[1]); B.cab.estado = 'yendo'; B.cab.sect = i; B.cab.t = 3; ev(B, 'caballeria', i, t ? 'Los jinetes van a por los ' + nombre(t.tipo).toLowerCase() : 'Los jinetes cargan ' + DONDE[i], { orden }); }
    return '';
  }

  /* Quita hombres a una reserva de caballo (reparte por tipo) */
  function pierdeReserva(r, n) {
    const q = Math.min(n, r.h); if (q <= 0) return;
    const f = q / r.h; for (const t in r.comp) r.comp[t] -= r.comp[t] * f;
    r.h -= q;
  }

  function romper(B, s, lado) {
    const c = s.c[lado]; if (c.roto) return; c.roto = true; c.moral = 0;
    const quien = lado === 0 ? 'Tu ' + NOMBRE_SECTOR[s.i].toLowerCase() + ' huye' : FRASE.huye(frente(c).tipo, DONDE[s.i]);
    ev(B, 'roto', s.i, quien, { lado, tropa: frente(c).tipo });
    if (lejos(s)) { s.dist = 0; s.tChoque = B.t; empiezaLucha(B); }
    for (const o of B.sect) { if (o === s) continue; if (!o.c[lado].roto) o.c[lado].moral = Math.max(0.02, o.c[lado].moral - 0.13); if (!o.c[1 - lado].roto) o.c[1 - lado].moral = Math.min(1, o.c[1 - lado].moral + 0.1); }
    s.c[1 - lado].libre = 4;
    if (lado === 0 && B.num.estado === 'hostiga' && B.num.sect === s.i) { B.num.estado = 'lejos'; B.num.proxima = B.t + 25; }
  }

  /* El vecino más cercano que aún lucha, para envolverlo */
  function vecino(B, i, ladoRival) {
    for (const j of i === 1 ? [0, 2] : [1, 2 - i]) { const o = B.sect[j]; if (!o.c[ladoRival].roto && !o.c[1 - ladoRival].roto) return o; }
    for (const j of i === 1 ? [0, 2] : [1, 2 - i]) { const o = B.sect[j]; if (!o.c[ladoRival].roto) return o; }
    return null;
  }

  /* Quita n hombres a una línea (o a los tiradores) y reparte la baja entre los tipos que la forman */
  function quitar(l, n) { const q = Math.min(Math.max(0, n), l.hombres); if (q > 0) { const f = q / l.hombres; for (const t in l.comp) l.comp[t] -= l.comp[t] * f; l.hombres -= q; } return q; }
  /* Quita n hombres a la primera línea */
  function bajas(c, n) {
    const l = frente(c); quitar(l, n);
    if (l.hombres < 0.15 * l.max && c.lineas.length > 1) { c.lineas.shift(); c.relevo = Math.max(c.relevo, 1.5); return true; }
    return false;
  }

  /* El enemigo decide solo, y siempre avisa: su postura se ve antes de que haga daño. Su mente sale del tipo del frente. */
  function mente(B, s, dt) {
    const e = s.c[1], r = s.c[0], l = frente(e), tipo = l.tipo, m = car(tipo).mente; e.tPost += dt; let quiere = e.postura;
    if (m === 'furia') quiere = e.postura === 'empujar' ? (l.fatiga > 0.78 ? 'aguantar' : 'empujar') : (l.fatiga < 0.5 || e.tPost > 16 ? 'empujar' : 'aguantar');
    else if (m === 'paciencia') { if (B.t < s.tChoque + 14) quiere = 'aguantar'; else quiere = e.postura === 'empujar' ? (e.tPost > 15 || l.fatiga > 0.85 ? 'aguantar' : 'empujar') : ((e.tPost > 9 && l.fatiga < 0.7) || (!r.roto && frente(r).fatiga > 0.6 && e.tPost > 4) ? 'empujar' : 'aguantar'); }
    else quiere = e.postura === 'empujar' ? (e.tPost > 11 || l.fatiga > 0.8 ? 'aguantar' : 'empujar') : (e.tPost > 8 && l.fatiga < 0.65 ? 'empujar' : 'aguantar');
    if (car(tipo).pavor && !e.desboque && e.postura === 'empujar' && (l.fatiga > 0.7 || l.hombres < 0.5 * l.max)) {
      /* Elefantes heridos o agotados se vuelven contra los suyos (Polibio 1.40): pierden la mitad y el cuerpo duda. Entra la línea de detrás. */
      e.desboque = true; e.moral -= 0.1; if (!bajas(e, l.hombres * 0.5) && e.lineas.length > 1) { e.lineas.shift(); e.relevo = Math.max(e.relevo, 1.5); }
      e.postura = 'aguantar'; e.tPost = 0; ev(B, 'elefantes-desbocados', s.i, FRASE.desboque(tipo, DONDE[s.i])); return;
    }
    if (quiere !== e.postura) { e.postura = quiere; e.tPost = 0; if (!r.roto) ev(B, quiere === 'empujar' ? 'carga-enemiga' : 'enemigo-cede', s.i, quiere === 'empujar' ? FRASE.carga(tipo, DONDE[s.i]) : FRASE.cede(tipo, DONDE[s.i]), { tropa: tipo }); }
  }

  function comprobarFin(B) {
    if (hombresLado(B, 0) <= 0) return fin(B, 'derrota', 'No queda infantería: la legión se deshace.');
    if (hombresLado(B, 1) <= 0) return fin(B, 'victoria', 'No queda infantería enemiga.');
    const rotos = [0, 1].map(l => B.sect.filter(s => s.c[l].roto).length);
    if (rotos[1] >= 2) fin(B, 'victoria'); else if (rotos[0] >= 2) fin(B, 'derrota');
    else if ((B.t0 !== null && B.t - B.t0 > LUCHA_MAX) || B.t > 600) { const p = l => inicialLado(B, l) > 0 ? hombresLado(B, l) / inicialLado(B, l) : 0; fin(B, p(0) > p(1) ? 'victoria' : 'derrota', 'Cae la tarde y los ejércitos se separan'); }
  }

  /* ---------- GM5: DE LEJOS. Acercarse, tirar, cubrirse; cada cuerpo choca al llegar ---------- */
  function empiezaLucha(B) {
    if (B.fase !== 'lejos') return;
    B.fase = 'lucha'; B.t0 = B.t;
    if (B.num.estado !== 'ninguna') B.num.proxima = B.t + (B.num.espera || 30);
  }
  const postura = c => c.lado === 0 ? (POSTURAS[c.postura] || POSTURAS.avanzar) : POSTURAS.avanzar;   /* el enemigo no se cubre */
  const blanco = t => BLANCO[t] || 0.8;
  /* Baja por proyectiles en la primera línea: los elefantes aguantan más (VIDA) */
  function tiroA(o, n) { const v = VIDA[frente(o).tipo] || 1; return bajas(o, n / v); }

  /* Los tiradores de un cuerpo: se adelantan, tiran a lo que tengan a tiro y se retiran antes del choque */
  function tirar(B, s, c, dt) {
    const t = c.tir; if (!t || t.estado === 'fuera') return;
    const A = tiroDe(t.tipo), o = s.c[1 - c.lado], ot = tirando(o), nom = nombre(t.tipo).toLowerCase();
    if (t.estado === 'vuelve') { t.blanco = null; t.av -= 7 * dt; if (t.av <= 0) { t.av = 0; t.estado = 'fuera'; } return; }
    t.av = Math.max(0, Math.min(A.adelanto, t.av + A.marcha * dt, ot ? (s.dist - 8) / 2 : s.dist - 12));
    if (s.dist < 22 || t.mun <= 0 || t.hombres < 0.35 * t.max || o.roto) {      /* el choque se echa encima, sin munición o con demasiadas bajas */
      t.estado = 'vuelve'; t.blanco = null;
      ev(B, c.lado === 0 ? 'tir-vuelven' : 'calma', s.i, c.lado === 0 ? 'Tus ' + nom + ' se retiran tras las líneas' : sujeto(t.tipo).x + ' se ' + (sujeto(t.tipo).pl ? 'retiran ' : 'retira ') + DONDE[s.i], { lado: c.lado }); return;
    }
    const aLinea = s.dist - t.av <= A.alc, aTir = !!ot && s.dist - t.av - ot.av <= A.alc;
    t.blanco = aLinea ? (aTir ? 'ambos' : 'linea') : aTir ? 'tir' : null; if (!t.blanco) { t.estado = 'sale'; return; }
    t.estado = 'tira';
    if (c.lado === 0 && !t.dicho) { t.dicho = 1; ev(B, 'tir-tiran', s.i, 'Tus ' + nom + ' lanzan sus ' + A.arma, { lado: 0, arma: A.arma }); }
    if (c.lado === 1 && (t.dicho || 0) < (aLinea ? 2 : 1)) { t.dicho = aLinea ? 2 : 1; ev(B, 'lluvia', s.i, '¡' + A.arma.charAt(0).toUpperCase() + A.arma.slice(1) + ' sobre tu' + (aLinea ? ' ' + NOMBRE_SECTOR[s.i].toLowerCase() : 's ' + nombre(ot.tipo).toLowerCase() + ' ' + DONDE[s.i]) + '!', { lado: 1, arma: A.arma, linea: aLinea }); }
    t.mun -= dt;
    const d = t.hombres * A.tiro * dt * (0.85 + 0.3 * rnd(B)), parteTir = t.blanco === 'tir' ? 1 : t.blanco === 'ambos' ? 0.35 : 0;
    if (parteTir) quitar(ot, d * parteTir * blanco(ot.tipo));
    if (parteTir < 1) {
      const P = postura(o), n = d * (1 - parteTir) * blanco(frente(o).tipo) * P.recibe;
      o.fuego = B.t; o.moral -= n / Math.max(1, o.inicial) * 1.5 + (P.recibe >= 1 ? SUSTO : 0) * dt;
      if (tiroA(o, n) && o.lado === 0) ev(B, 'linea-deshecha', s.i, 'Línea deshecha: entra la línea de ' + nombre(frente(o).tipo));
      if (o.moral <= 0) romper(B, s, o.lado);
    }
  }

  function acercar(B, s, dt) {
    for (const c of s.c) {
      if (c.cambio > 0) { c.cambio -= dt; if (c.cambio <= 0) { c.cambio = 0; c.postura = c.luego || 'avanzar'; c.luego = null; } }
      const l = frente(c), P = postura(c), v = c.lado === 0 ? P.paso : (MARCHA[l.tipo] || 2.4);
      c.z = Math.max(0, c.z - v * dt);
      if (P.cansa) for (const q of c.lineas) q.fatiga = Math.min(1, q.fatiga + P.cansa * car(q.tipo).cansa * dt);   /* el escudo en alto cansa a las tres líneas */
      if (c.flanqueado) c.moral -= 0.028 * dt;
    }
    s.dist = Math.max(0, s.c[0].z + s.c[1].z);
    for (const c of s.c) { tirar(B, s, c, dt); if (s.c[0].roto || s.c[1].roto) return; }
    /* la descarga antes de chocar: pila y jabalinas pesadas. Dentro del testudo no se puede lanzar */
    for (const c of s.c) {
      const tipo = frente(c).tipo, arma = ARROJA[tipo]; if (!arma || c.pila || s.dist > SALVA.alc) continue; c.pila = true;
      if (c.postura === 'testudo') continue;
      const o = s.c[1 - c.lado], cubierto = o.lado === 0 && o.postura !== 'avanzar', n = SALVA.parte * frente(c).hombres * blanco(frente(o).tipo) * (cubierto ? 0.45 : 1);
      tiroA(o, n); o.moral -= n / Math.max(1, o.inicial) * 1.5; o.frenada = 5;
      ev(B, 'pila', s.i, c.lado === 0 ? 'Tus ' + nombre(tipo).toLowerCase() + ' arrojan los pila' : sujeto(tipo).x + ' arrojan sus jabalinas', { lado: c.lado, arma });
      if (o.moral <= 0) { romper(B, s, o.lado); return; }
    }
    if (s.dist <= CONTACTO) chocar(B, s);
  }

  function chocar(B, s) {
    const r = s.c[0], e = s.c[1], primero = B.fase === 'lejos'; s.dist = 0; s.tChoque = B.t; empiezaLucha(B);
    for (const c of s.c) if (c.tir && c.tir.estado !== 'fuera') { c.tir.estado = 'fuera'; c.tir.av = 0; c.tir.blanco = null; }
    ev(B, 'choque', s.i, primero ? 'Las líneas chocan ' + DONDE[s.i] : 'Chocan ' + DONDE[s.i]);
    if (r.postura === 'testudo') { r.golpe = 14; r.moral -= 0.3; ev(B, 'testudo-roto', s.i, 'El choque deshace tu testudo ' + DONDE[s.i]); }
    if (r.postura === 'avanzar' && !(r.cambio > 0)) { r.postura = 'empujar'; r.impulso = 5; } else r.postura = 'aguantar';
    r.cambio = 0; r.luego = null;
    e.tPost = 0; e.postura = car(frente(e).tipo).mente === 'furia' ? 'empujar' : 'aguantar';
    if (e.postura === 'empujar') { e.impulso = 5; ev(B, 'carga-enemiga', s.i, FRASE.carga(frente(e).tipo, DONDE[s.i]), { tropa: frente(e).tipo }); }
    if (r.moral <= 0) romper(B, s, 0);
  }

  /* Un mando sencillo para el acercamiento (lo usan los bots y «Delegar»): escudos bajo los proyectiles, avanzar para el choque */
  function cubrirse(B) {
    for (let i = 0; i < 3; i++) {
      const s = B.sect[i], c = s.c[0]; if (c.roto || !lejos(s) || c.cambio > 0) continue;
      const quiere = B.t - c.fuego < 2 && s.dist > 26 ? 'escudos' : 'avanzar';
      if (c.postura !== quiere && !puede(B, i, quiere)) ordenar(B, i, quiere);
    }
  }

  function paso(B, dt) {
    if (B.fase === 'fin') return;
    B.t += dt;

    for (const s of B.sect) {
      const r = s.c[0], e = s.c[1];
      for (const c of s.c) { for (const q of ['relevo', 'golpe', 'impulso', 'frenada']) if (c[q] > 0) c[q] = Math.max(0, c[q] - dt); for (let k = 1; k < c.lineas.length; k++) c.lineas[k].fatiga = Math.max(0, c.lineas[k].fatiga - DESCANSO * dt); }
      if (r.roto && e.roto) continue;
      if (r.roto || e.roto) {
        const v = r.roto ? e : r; if (v.libre > 0) { v.libre -= dt; if (v.libre <= 0) { const o = vecino(B, s.i, 1 - v.lado); if (o) { const w = o.c[1 - v.lado]; if (!w.flanqueado) { w.flanqueado = true; ev(B, 'envuelve', o.i, v.lado === 0 ? 'Tus hombres envuelven ' + (o.i === 1 ? 'el centro enemigo' : 'el ala enemiga') : 'El enemigo te envuelve ' + DONDE[o.i], { lado: v.lado }); } } } }
        if (v.lineas.length) frente(v).fatiga = Math.max(0, frente(v).fatiga - DESCANSO * dt); continue;
      }
      if (lejos(s)) { acercar(B, s, dt); continue; }
      mente(B, s, dt);
      const fr = fuerza(r), fe = fuerza(e), ruido = 0.9 + 0.2 * rnd(B);
      for (const [c, f, rival] of [[r, fe, e], [e, fr, r]]) {
        const l = frente(c), T = car(l.tipo);
        let d = f * K_BAJAS * dt * ruido * escala(frente(rival)) * (c.postura === 'aguantar' ? (T.firme ? 0.45 : 0.6) : 1) * (c.flanqueado ? (T.flanco || 1.5) : 1) * (c.golpe > 0 ? 1.4 : 1);
        if (c.postura === 'empujar' && rival.postura === 'aguantar') d *= 1.12;
        if (c.postura === 'empujar' && rival.postura === 'empujar') d *= 1.2;
        const total = c.inicial;
        c.moral -= d / total * 1.2 + (c.flanqueado ? 0.028 : 0) * dt + (f > fuerza(c) ? 0.013 * (f - fuerza(c)) * dt : 0) + (l.fatiga > 0.85 ? 0.006 * dt : 0);
        if (c.postura === 'aguantar' && !c.flanqueado) c.moral += 0.004 * dt;
        l.fatiga = Math.max(0, Math.min(1, l.fatiga + (c.postura === 'empujar' ? BASE_FATIGA * T.cansa : -BASE_FATIGA * 0.22) * dt));
        const cayo = bajas(c, d);
        if (cayo && c.lado === 0) ev(B, 'linea-deshecha', s.i, 'Línea deshecha: entra la línea de ' + nombre(frente(c).tipo));
        c.moral = Math.min(1, c.moral);
      }
      s.frente = Math.max(-1, Math.min(1, s.frente + (fr - fe) * 0.045 * dt));
      if (Math.abs(s.frente) >= 1) (s.frente > 0 ? e : r).moral -= 0.02 * dt;
      for (const c of s.c) { const l = frente(c); if (!c.roto && (c.moral <= 0 || (c.lineas.length === 1 && l.hombres < 0.15 * l.max))) romper(B, s, c.lado); }
      if (!r.roto && !r.avisado && frente(r).fatiga > 0.8 && r.lineas.length > 1 && r.relevo <= 0) { r.avisado = B.t; ev(B, 'cansados', s.i, 'Tus ' + nombre(frente(r).tipo).toLowerCase() + ' están agotados ' + DONDE[s.i]); }
      if (r.avisado && (frente(r).fatiga < 0.6)) r.avisado = 0;
    }

    /* Caballería romana: va, golpea el flanco (o espanta a los númidas) y vuelve a rehacerse. Todo escala con sus hombres. */
    const cab = B.cab, num = B.num;
    if (cab.estado !== 'lista') {
      cab.t -= dt;
      if (cab.t <= 0) {
        if (cab.estado === 'yendo') {
          const s = B.sect[cab.sect], e = s.c[1], esc = limita(cab.h / REF_CAB, 0.25, 2.5);
          const t = tirando(e);
          if (t && !e.roto) { const q = quitar(t, t.hombres * 0.55 * Math.min(1, esc)); t.estado = 'fuera'; t.av = 0; t.blanco = null; e.moral -= 0.06; pierdeReserva(cab, cab.h * 0.02); ev(B, 'impacto', cab.sect, 'Tus jinetes barren a los ' + nombre(t.tipo).toLowerCase(), { a: 'tir', bajas: Math.round(q) }); }
          else if (lejos(s)) { ev(B, 'caballeria-vuelve', cab.sect, 'Los jinetes vuelven: aún no hay flanco que cargar'); }
          else if ((num.estado === 'hostiga' || num.estado === 'llega') && num.sect === cab.sect) { num.estado = 'lejos'; num.proxima = B.t + 34 + rnd(B) * 10; pierdeReserva(num, num.h * 0.1); pierdeReserva(cab, cab.h * 0.03); ev(B, 'numidas-fuera', cab.sect, 'Tus jinetes espantan a los númidas'); }
          else if (!e.roto) { e.moral -= 0.2 * esc; bajas(e, 22 * esc); e.golpe = 6; pierdeReserva(cab, cab.h * 0.05); ev(B, 'impacto', cab.sect, 'Carga en el flanco enemigo'); if (e.moral <= 0) romper(B, s, 1); }
          cab.estado = 'cargando'; cab.t = 4;
        } else if (cab.estado === 'cargando') { cab.estado = 'volviendo'; cab.t = Math.max(6, T_CABALLERIA * limita(Math.sqrt(cab.h / REF_CAB), 0.75, 1.5) - 7); }
        else { cab.estado = 'lista'; cab.sect = -1; ev(B, 'caballeria-lista', -1, 'Jinetes listos'); }
      }
    }
    /* Númidas (jinetes enemigos): avisan, rodean un ala y la hostigan hasta que alguien los eche o se cansen */
    if (num.estado === 'lejos' && B.t >= num.proxima && num.veces < 3) {
      const alas = [0, 2].filter(i => !B.sect[i].c[0].roto);
      if (alas.length) { alas.sort((a, b) => B.sect[a].c[0].moral - B.sect[b].c[0].moral); num.sect = rnd(B) < 0.7 ? alas[0] : alas[alas.length - 1]; num.estado = 'llega'; num.t = 5; num.veces++; ev(B, 'numidas-aviso', num.sect, '¡Jinetes enemigos ' + DONDE[num.sect] + '!'); }
      else num.proxima = B.t + 20;
    } else if (num.estado === 'llega') { num.t -= dt; if (num.t <= 0) { num.estado = 'hostiga'; num.t = 15; } }
    else if (num.estado === 'hostiga') {
      num.t -= dt; const s = B.sect[num.sect], r = s.c[0], dur = limita(num.h / REF_CAB, 0.3, 2);
      if (!r.roto) { const m = frente(r).tipo === 'triarii' && r.postura === 'aguantar' ? 0.35 : 1; r.moral -= 0.024 * m * dur * dt; bajas(r, 1.3 * m * dur * dt); if (r.moral <= 0) romper(B, s, 0); }
      if (num.t <= 0 || r.roto) { num.estado = 'lejos'; num.proxima = B.t + 30 + rnd(B) * 10; if (!r.roto) ev(B, 'numidas-fuera', num.sect, 'Los jinetes enemigos se alejan'); }
    }
    comprobarFin(B);
  }

  function total(B, lado) { return hombresLado(B, lado) + (lado === 0 ? B.cab.h : B.num.h); }

  function fin(B, como, motivo) {
    if (B.fase === 'fin') return;
    B.fase = 'fin';
    const cuales = l => B.sect.filter(s => s.c[l].roto).map(s => ['ala izquierda', 'centro', 'ala derecha'][s.i]).join(' y ');
    if (!motivo) motivo = como === 'victoria' ? 'Rompiste su ' + cuales(1) + ': el resto huye.' : como === 'derrota' ? 'Cedieron tu ' + cuales(0) + ': la legión se deshace.' : 'Sacas a la legión en orden. El campo queda para el enemigo.';
    const ini = l => suma(B.n0[l]);
    B.resultado = { como, motivo, t: B.t, bajas: [ini(0) - Math.round(total(B, 0)), ini(1) - Math.round(total(B, 1))], inicial: [ini(0), ini(1)], ordenes: B.ordenes };
    ev(B, 'fin', -1, '');
  }
  const retirarse = B => fin(B, 'retirada');

  /* ---------- salida: la misma forma que G.resumenBatalla2 ---------- */
  function resumen(B) {
    if (B.fase !== 'fin') retirarse(B);
    const f = B.resultado, filas = [];
    for (let b = 0; b < 2; b++) {
      const vivo = {};
      for (const s of B.sect) for (const l of todas(s.c[b])) for (const t in l.comp) vivo[t] = (vivo[t] || 0) + l.comp[t];
      const res = b === 0 ? B.cab : B.num; for (const t in res.comp) vivo[t] = (vivo[t] || 0) + res.comp[t];
      const tipos = Object.keys(B.n0[b]).filter(t => B.n0[b][t] > 0), perdida = {};
      let tot = 0; for (const t of tipos) { perdida[t] = limita(B.n0[b][t] - (vivo[t] || 0), 0, B.n0[b][t]); tot += perdida[t]; }
      let resto = Math.round(tot); const ent = {}, frac = [];
      for (const t of tipos) { ent[t] = Math.floor(perdida[t]); resto -= ent[t]; frac.push([t, perdida[t] - ent[t]]); }
      frac.sort((x, y) => y[1] - x[1]);
      for (let k = 0; resto > 0 && k < 3 * frac.length; k++) { const t = frac[k % frac.length][0]; if (ent[t] < B.n0[b][t]) { ent[t]++; resto--; } }
      for (const t of tipos) {
        const dondeEstaba = B.sitio[b][t] || [], huyo = !esCab(t) && dondeEstaba.length > 0 && dondeEstaba.every(i => B.sect[i].c[b].roto);
        filas.push({ id: 'b' + b + '-' + t, bando: b, tipo: t, nombre: nombre(t), n0: B.n0[b][t], n: B.n0[b][t] - ent[t], bajas: ent[t], huyo, vet: 0 });
      }
    }
    const ganador = f.como === 'victoria' ? 0 : 1;
    const vivos = B.n0[1] ? filas.filter(x => x.bando === 1).reduce((a, x) => a + x.n, 0) : 0;
    return { ganador, victoria: ganador === 0, motivo: f.motivo, t: f.t, bajas: filas, bajasTotal: [0, 1].map(b => filas.filter(x => x.bando === b).reduce((a, x) => a + x.bajas, 0)), general: null, prisioneros: ganador === 0 ? Math.round(0.25 * vivos) : 0, estado: B };
  }

  const Guerra = { crear, paso, ordenar, puede, retirarse, fin, guardar, cargar, resumen, rnd, frente, hombres, hombresLado, inicialLado, vecino,
    CARACTER, GENERICO, FRASE, NOMBRE_SECTOR, DONDE, T_MARCHA, repartoRoma, repartoEnemigo,
    DIST0, POSTURAS, TIRO, tiroDe, lejos, tirando, bajoFuego, ordenesDe, cubrirse };
  root.Guerra = Guerra;
  if (typeof module !== 'undefined') module.exports = Guerra;
})(typeof window !== 'undefined' ? window : globalThis);
