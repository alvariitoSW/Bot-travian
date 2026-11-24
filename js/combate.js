/* AQVILA — CB1: el motor de lucha cuerpo a cuerpo. Un hombre, dos manos: la izquierda lleva el escudo, la derecha el arma.
   Sin pantalla: corre en Node y en el navegador. Determinista: todo el azar sale de crearAzar(semilla) (mulberry32).
   Prueba: test/combate.test.mjs. Guía: .claude/skills/ministerio-combate/SKILL.md («Arquitectura del motor»).

   CONTRATO
   import * as Combate from './combate.js';
   Combate.crearAzar(semilla)            → rnd() en [0, 1). Siempre el mismo chorro para la misma semilla.
   Combate.crearHombre({ id, bando, x, z, yaw, arma, escudo, fila, linea })
                                         → hombre: { izq: { estado: 'alzado'|'bajo'|'roto' }, der: { estado: 'guardia'|'golpea'|'recupera' },
                                           vida (0..1), heridas { leve, grave }, cansancio (0..1), vivo, huye, escudoVida, arma, escudo, ... }
                                           yaw como en fisica-batalla.js: frente = (sin yaw, −cos yaw); derecha = (cos yaw, sin yaw).
   Combate.crearManipulo({ bando, linea, filas, frente, x, z, yaw, arma, escudo, id }) → { id, bando, linea, hombres, x, z, yaw, ... }
                                           x, z: centro de la primera fila. Filas hacia atrás cada FONDO m; hombres cada LADO m.
   Combate.relevo(cansado, fresco)        el fresco ocupa el sitio del cansado, el cansado pasa al del fresco → evento 'relevo'.
   Combate.paso(hombres, dt, { rnd, eventos }) → eventos [{ tipo, de, a, arma, en, ... }] de este paso:
       'golpe'  (en: 'aire'|'escudo'|'cuerpo')   'para' (en: 'escudo'|'arma')   'escudo_roto'   'herida' (grado 'leve'|'grave')
       'cae'    'relevo' (en: 'fila'|'manipulo')  'lanza' (pilum arrojado)   'dobla' (espada gala doblada)   'rompe' (manípulo que huye)
   Combate.golpear(atacante, defensor, rnd, arma?) → eventos de un golpe suelto (lo usa paso; sirve para pruebas y duelos).
   Combate.pelea({ a: [manípulos de delante a atrás], b: [...], dt, tMax, semilla, relevo: { a: { umbralCansancio }, b: null } })
                                         → { gana: 'a'|'b'|null, bajas: { a, b }, tiempo, eventosContados: { golpe: n, ... } }
   Combate.tablaMedia(armaA, escudoA, armaB, escudoB, n) → media de n semillas de un choque de 10×3 contra 10×3 durante 60 s:
                                           { bajasMinA, bajasMinB (bajas por minuto), paradasA, paradasB (% de golpes recibidos que para) }
   Combate.cicloEfectivo(h)               segundos entre golpes con su cansancio (y su guardia).
   GUARDIAS (h.guardia): 'normal' | 'testudo' | 'falange' (por defecto 'falange' si lleva sarisa). crearManipulo({ guardia }) o
   Combate.ponerGuardia(M, guardia) (aprieta las filas a 0,9 m). Combate.arcoEscudo(h) → [der, izq] grados que cubre ahora.
   Combate.proyectil(h, arriba, ang, tipo, rnd) → { para, en: 'escudo'|'techo'|'cuerpo' }: un proyectil que cae sobre h
                                           (arriba: grados desde la vertical; ang: como anguloLlegada; tipo 'pilum' atraviesa a veces).
   Combate.puntasDelante(h)               puntas de sarisa en la columna del falangita (5 primeras filas).
   pelea() mueve lo mínimo: un manípulo cuya primera fila no llega pero tiene enemigos delante avanza (AVANCE).

   CÓMO DECIDE UN GOLPE
   Cada hombre vivo busca (rejilla espacial) al enemigo más cercano dentro del alcance de su arma y delante (±CONO°). Golpea cada
   cicloEfectivo s. El golpe llega al defensor con un ángulo (0° = de frente, + = por su izquierda). Si cae dentro del ARCO de su
   escudo (centrado a la izquierda) y el escudo no está roto, lo para con probabilidad `para` (menos si está bajo por cansancio);
   la punta busca el hueco (HUECO_PUNTA). Parar gasta escudoVida (según danoEscudo del arma) y cansa al que para. Fuera del arco
   (derecha descubierta, espalda) entra al cuerpo con más daño (FLANCO, ESPALDA). Así salen solos el flanqueo y la formación cerrada.
   Herida: d = danoCuerpo × lado × (0,5 + azar). d ≥ GRAVE tumba; si no, leve: resta vida y cansa. Vida ≤ 0 también tumba.
   El hueco del caído lo ocupa el de detrás en la misma columna del manípulo (evento 'relevo', en: 'fila').

   HISTORIA. Ver `fuente` y `dictamen` de cada arma y escudo. Las líneas y su relevo: Polibio 6.21-23 (hastati, principes, triarii;
   histórico) y Livio 8.8 (los hastati cansados se retiran entre los principes; los triarii, rodilla en tierra, la última reserva;
   histórico). TODAS LAS CIFRAS (alcances, ciclos, daños, probabilidades, cansancio, arcos) SON LICENCIA DE JUEGO: órdenes de magnitud
   razonables (longitud de las armas según las fuentes y la arqueología), ajustadas para que el combate se lea y se juegue. */

/* ---------- azar determinista ---------- */
export function crearAzar(semilla = 1) {
  let s = semilla >>> 0;
  return function rnd() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- constantes del motor (licencia de juego) ---------- */
export const ARCO_DER = -30, ARCO_IZQ = 100;   /* arco del scutum: de 30° a la derecha hasta 100° a la izquierda del frente */
export const CONO = 60;            /* busca enemigos dentro de ±60° de su frente */
export const LADO = 1.2, FONDO = 1.2;   /* hueco entre hombres de una fila y entre filas (m). Polibio 18.30 da ~3 pies por hombre y otros 3 de hueco */
export const FLANCO = 1.35, ESPALDA = 1.7;   /* multiplica el daño por la derecha descubierta y por la espalda (más de 120°) */
export const GRAVE = 0.8;          /* d desde aquí: herida grave, cae (de frente un gladius casi nunca tumba de un golpe: hace falta el flanco o varias leves) */
export const HUECO_PUNTA = 0.08;   /* la punta pasa por encima o por debajo del escudo alzado */
export const PARADA_ARMA = 0.12;   /* sin escudo, parar con el arma */
export const PARA_CANSA = 0.006;   /* cansancio por parar, por punto de danoEscudo */
export const TENSION = 0.0015;     /* cansancio por segundo solo por estar en la pelea */
export const DESCANSO = 0.02;      /* lo que baja el cansancio por segundo descansando */
export const QUIETO = 1.5;         /* sin golpear ni recibir este tiempo: descansa */
export const BAJA_ESCUDO = 0.75, ALZA_ESCUDO = 0.65;   /* cansancio con el que baja el escudo y con el que lo vuelve a alzar */
export const ESCUDO_BAJO = { arco: 0.55, para: 0.7 };  /* el escudo bajo cubre menos y para peor */
export const LENTO = 0.9;          /* el ciclo crece × (1 + LENTO × cansancio) */
export const FALLA = 0.45;         /* el acierto baja × (1 − FALLA × cansancio) */
export const T_GOLPE = 0.3;        /* lo que dura la estocada o el tajo (estado 'golpea') */
export const ROTURA = 0.5;         /* el manípulo huye al perder esta parte de sus hombres */
export const AGOTADO = 0.9;        /* … o cuando su primera fila está agotada sin relevo (Livio 8.8: los hastati que no pueden más se retiran) */
export const CELDA = 2;            /* rejilla espacial (m) */
/* guardias: 'normal' | 'testudo' | 'falange' */
export const TESTUDO = { arco: [-45, 120], vecino: 45, para: 0.04, lento: 3, cansa: 0.004, techo: 0.95, lado: 0.9, fondo: 0.9 };
/* testudo: muro delante (arco más ancho; el vecino tapa el hueco hasta `vecino` grados más), techo de escudos encima (para
   `techo` de lo que cae de arriba), golpea `lento` veces más despacio y cansa `cansa`/s más */
export const FALANGE = { filas: 5, cono: 15, puntas: 3, lado: 0.9, fondo: 0.9 };
/* falange: pegan las 5 primeras filas (la punta de la fila k queda ≈ alcance − 0,9·k delante del frente, sale sola de la
   geometría con fondo 0,9 m); la sarisa no gira (cono de ataque ±15°); un arma corta no entra de frente con ≥3 puntas delante */
export const CORTA = 2;            /* m: alcance por debajo del cual un arma es «corta» frente a las puntas */

/* ---------- armas ---------- */
export const ARMAS = {
  gladius: {
    nombre: 'gladius hispaniensis', alcance: 1.2, golpe: 'punta', ciclo: 1.0, acierto: 0.8, danoCuerpo: 0.5, danoEscudo: 0.6,
    cansa: 0.024, manos: 1,
    fuente: 'Polibio 6.23 (espada «hispana», de punta y de dos filos); Livio 31.34 (los macedonios se espantan de las heridas del gladius, 200 a.C.)',
    dictamen: 'histórico; cifras: licencia de juego'
  },
  pilum: {
    nombre: 'pilum', alcance: 1.8, golpe: 'punta', ciclo: 1.3, acierto: 0.75, danoCuerpo: 0.45, danoEscudo: 0.6, cansa: 0.028, manos: 1,
    arroja: { alcance: 15, minimo: 3, acierto: 0.7, danoCuerpo: 0.7, danoEscudo: 5, luego: 'gladius' },
    fuente: 'Polibio 6.23 (cada hastatus lleva dos pila, uno grueso y uno fino, de hierro largo); Livio 9.19 (se arrojan antes del choque)',
    dictamen: 'histórico; un solo tiro y luego el gladius: licencia de juego (Polibio da dos); cifras: licencia de juego'
  },
  hasta: {
    nombre: 'hasta', alcance: 2.4, golpe: 'punta', ciclo: 1.4, acierto: 0.75, danoCuerpo: 0.45, danoEscudo: 0.6, cansa: 0.028, manos: 1,
    fuente: 'Polibio 6.23 (los triarii llevan hasta en lugar de pila); Livio 8.8 (los triarii, la reserva, con la hasta clavada en tierra)',
    dictamen: 'histórico; cifras: licencia de juego'
  },
  sarisa: {
    nombre: 'sarisa', alcance: 4.5, golpe: 'punta', ciclo: 1.8, acierto: 0.7, danoCuerpo: 0.4, danoEscudo: 0.8, cansa: 0.02, manos: 2,
    fuente: 'Polibio 18.29 (14 codos; 10 sobresalen delante del hombre); 18.30 (las puntas de cinco filas asoman delante)',
    dictamen: 'histórico; cifras: licencia de juego'
  },
  falcata: {
    nombre: 'falcata', alcance: 1.1, golpe: 'ambos', ciclo: 1.3, acierto: 0.78, danoCuerpo: 0.6, danoEscudo: 2.0, cansa: 0.036, manos: 1,
    fuente: 'Diodoro 5.33 (las espadas de los celtíberos cortan de modo que no aguantan escudo, casco ni hueso); F. Quesada Sanz, «El armamento ibérico» (1997), la falcata ibérica',
    dictamen: 'probable: Diodoro habla de la espada celtíbera de dos filos, la falcata es ibérica (arqueología); cifras: licencia de juego'
  },
  espada_gala: {
    nombre: 'espada gala', alcance: 1.4, golpe: 'filo', ciclo: 1.6, acierto: 0.75, danoCuerpo: 0.55, danoEscudo: 1.6, cansa: 0.04, manos: 1,
    dobla: 0.12, enderezar: 2,
    fuente: 'Polibio 2.30 (la espada gala solo sirve de tajo, sin punta); 2.33 (se dobla al primer golpe y la enderezan con el pie; Telamón, 225 a.C.)',
    dictamen: 'histórico según Polibio; la arqueología lo discute (hojas La Tène de buen hierro): que se doble a veces es licencia de juego'
  }
};

/* ---------- escudos ---------- */
export const GUARDIAS = {
  normal: { fuente: '—', dictamen: '—' },
  testudo: {
    fuente: 'Livio 44.9 (169 a.C.: los jóvenes romanos forman la testudo de escudos y suben por ella, como en el asalto a una muralla)',
    dictamen: 'histórico (existe en la época, sobre todo en asaltos y bajo proyectiles); que encaje con el vecino y sus cifras: licencia de juego'
  },
  falange: {
    fuente: 'Polibio 18.29-30 (filas a 3 pies; asoman las puntas de cinco filas; la falange no puede girar ni pelear por el flanco y la espalda; Cinoscéfalas, 197 a.C.)',
    dictamen: 'histórico; cifras: licencia de juego'
  }
};

export const ESCUDOS = {
  scutum: {
    nombre: 'scutum', arco: [ARCO_DER, ARCO_IZQ], para: 0.92, resistencia: 12,
    fuente: 'Polibio 6.23 (2,5 × 4 pies, curvo, de dos capas de tabla con lienzo y cuero, borde de hierro y umbo)',
    dictamen: 'histórico; cifras: licencia de juego'
  },
  aspis: {
    nombre: 'aspís (hoplon)', arco: [-20, 95], para: 0.9, resistencia: 12,
    fuente: 'Tucídides 5.71 (el hoplita arrima su derecha descubierta al escudo del vecino: el escudo cubre la izquierda)',
    dictamen: 'histórico; cifras: licencia de juego'
  },
  pelta: {
    nombre: 'pelta de la falange', arco: [-10, 60], para: 0.55, resistencia: 5,
    fuente: 'Asclepiódoto 5.1 (escudo de 8 palmos, colgado del hombro: las dos manos van en la sarisa); Polibio 18.29',
    dictamen: 'histórico; cifras: licencia de juego'
  },
  thureos: {
    nombre: 'escudo galo (thureos)', arco: [-25, 90], para: 0.85, resistencia: 9,
    fuente: 'Polibio 2.30 (el escudo galo no cubre todo el cuerpo); Livio 38.21 (escudos largos pero estrechos de los gálatas, 189 a.C.)',
    dictamen: 'histórico; cifras: licencia de juego'
  },
  ninguno: { nombre: 'sin escudo', arco: null, para: 0, resistencia: 0, fuente: '—', dictamen: '—' }
};

/* ---------- hombres y manípulos ---------- */
let sigId = 1;
export function crearHombre({ id, bando = 'a', x = 0, z = 0, yaw = 0, arma = 'gladius', escudo = 'scutum', fila = 0, linea = null, col = 0, rnd = null, guardia } = {}) {
  const A = ARMAS[arma], E = ESCUDOS[escudo];
  if (!A) throw new Error('arma desconocida: ' + arma);
  if (!E) throw new Error('escudo desconocido: ' + escudo);
  return {
    id: id ?? sigId++, bando, x, z, yaw, arma, escudo, fila, col, linea, manip: null,
    guardia: guardia || (arma === 'sarisa' ? 'falange' : 'normal'),
    izq: { estado: E.arco ? 'alzado' : 'roto' }, der: { estado: 'guardia' },
    vida: 1, heridas: { leve: 0, grave: 0 }, cansancio: 0, vivo: true, huye: false, escudoVida: E.resistencia,
    pilos: A.arroja ? 1 : 0, reloj: rnd ? rnd() * A.ciclo : 0, tEstado: 0, quieto: 99, golpes: 0
  };
}

let sigManip = 1;
export function crearManipulo({ id, bando = 'a', linea = 'hastati', filas = 3, frente = 10, x = 0, z = 0, yaw = 0, arma = 'gladius', escudo = 'scutum', semilla = 7, guardia, lado, fondo } = {}) {
  guardia = guardia || (arma === 'sarisa' ? 'falange' : 'normal');
  const G = guardia === 'falange' ? FALANGE : guardia === 'testudo' ? TESTUDO : null;
  const M = { id: id ?? ('m' + sigManip++), bando, linea, filas, frente, x, z, yaw, hombres: [], total: filas * frente, roto: false, sucio: false,
    lado: lado ?? (G ? G.lado : LADO), fondo: fondo ?? (G ? G.fondo : FONDO), primera: [] };
  const rnd = crearAzar(semilla);
  for (let f = 0; f < filas; f++) for (let c = 0; c < frente; c++) {
    const h = crearHombre({ id: M.id + ':' + f + ':' + c, bando, yaw, arma, escudo, fila: f, col: c, linea, rnd, guardia });
    h.manip = M; M.hombres.push(h);
  }
  colocar(M);
  return M;
}

/* pone a cada hombre en su sitio (fila, columna) según el ancla del manípulo */
function colocar(M) {
  const Fx = Math.sin(M.yaw), Fz = -Math.cos(M.yaw), Rx = Math.cos(M.yaw), Rz = Math.sin(M.yaw);
  M.primera.length = 0;
  for (const h of M.hombres) {
    const lado = (h.col - (M.frente - 1) / 2) * M.lado, fondo = h.fila * M.fondo;
    h.x = M.x + Rx * lado - Fx * fondo; h.z = M.z + Rz * lado - Fz * fondo; h.yaw = M.yaw;
    if (h.fila === 0 && h.vivo && !h.huye) M.primera[h.col] = h;
  }
}

/* cambia la guardia de todo el manípulo (y aprieta o abre las filas) */
export function ponerGuardia(M, guardia) {
  const G = guardia === 'falange' ? FALANGE : guardia === 'testudo' ? TESTUDO : null;
  M.lado = G ? G.lado : LADO; M.fondo = G ? G.fondo : FONDO;
  for (const h of M.hombres) h.guardia = guardia;
  colocar(M);
}

/* arco que cubre el escudo de h ahora mismo ([der, izq] en grados) o null */
export function arcoEscudo(h) {
  const E = ESCUDOS[h.escudo];
  if (!E.arco || h.izq.estado === 'roto') return null;
  let d = E.arco[0], i = E.arco[1];
  if (h.guardia === 'testudo') {
    d = Math.min(d, TESTUDO.arco[0]); i = Math.max(i, TESTUDO.arco[1]);
    const M = h.manip;
    if (M && h.fila === 0) {
      const der = M.primera[h.col + 1], izq = M.primera[h.col - 1];
      if (der && der.guardia === 'testudo' && der.vivo) d -= TESTUDO.vecino;
      if (izq && izq.guardia === 'testudo' && izq.vivo) i += TESTUDO.vecino;
    }
  }
  if (h.izq.estado === 'bajo') { const c = (d + i) / 2, m = (i - d) / 2 * ESCUDO_BAJO.arco; d = c - m; i = c + m; }
  return [d, i];
}

/* cuántas puntas de sarisa tiene delante el falangita h (su columna, 5 primeras filas) */
export function puntasDelante(h) {
  const M = h.manip;
  if (!M) return h.guardia === 'falange' ? 1 : 0;
  let n = 0;
  for (const o of M.hombres) if (o.col === h.col && o.vivo && !o.huye && o.fila < FALANGE.filas && o.guardia === 'falange') n++;
  return n;
}

/* un proyectil (flecha, jabalina, piedra, pilum) que llega a h. arriba: grados desde la vertical (0 = cae a plomo, 90 = horizontal);
   ang: por dónde llega en horizontal (como anguloLlegada). → { para: bool, en: 'escudo'|'techo'|'cuerpo' } */
export function proyectil(h, arriba, ang = 0, tipo = 'jabalina', rnd = azarComun) {
  const E = ESCUDOS[h.escudo], pasa = tipo === 'pilum' ? 0.15 : 0;   /* el pilum atraviesa a veces el escudo */
  if (!E.arco || h.izq.estado === 'roto') return { para: false, en: 'cuerpo' };
  if (h.guardia === 'testudo' && (h.fila > 0 || arriba < 60)) {
    /* el techo: los de dentro llevan el escudo sobre la cabeza; a la fila delantera la tapa el de detrás */
    const p = TESTUDO.techo - pasa;
    return rnd() < p ? { para: true, en: 'techo' } : { para: false, en: 'cuerpo' };
  }
  const A = arcoEscudo(h);
  let p = E.para - pasa;
  if (arriba < 45) p *= 0.25;   /* de arriba, el escudo de pie apenas tapa */
  if (!A || ang < A[0] || ang > A[1]) p = 0;
  return rnd() < p ? { para: true, en: 'escudo' } : { para: false, en: 'cuerpo' };
}

/* el de detrás ocupa el hueco del caído, columna a columna */
function cerrarFilas(M, eventos) {
  for (let c = 0; c < M.frente; c++) {
    const col = M.hombres.filter(h => h.col === c && h.vivo && !h.huye).sort((p, q) => p.fila - q.fila);
    col.forEach((h, i) => { if (h.fila !== i) { h.fila = i; eventos.push({ tipo: 'relevo', de: h.id, a: null, en: 'fila', fila: i }); } });
    for (const h of M.hombres) if (h.col === c && (!h.vivo || h.huye)) h.fila = 99;
  }
  colocar(M);
  M.sucio = false;
}

export function relevo(cansado, fresco, eventos = []) {
  const ax = cansado.x, az = cansado.z;
  cansado.x = fresco.x; cansado.z = fresco.z; fresco.x = ax; fresco.z = az;
  colocar(cansado); colocar(fresco);
  eventos.push({ tipo: 'relevo', de: cansado.id, a: fresco.id, en: 'manipulo' });
  return eventos;
}

/* ---------- reglas de un golpe ---------- */
export function cicloEfectivo(h) {
  const A = ARMAS[h.arma];
  return A.ciclo * (1 + LENTO * h.cansancio) * (h.guardia === 'testudo' ? TESTUDO.lento : 1);
}

const RAD = 180 / Math.PI;
/* ángulo (grados) por el que llega el golpe al defensor: 0 de frente, + por su izquierda, − por su derecha */
export function anguloLlegada(def, atk) {
  const dx = atk.x - def.x, dz = atk.z - def.z;
  const Fx = Math.sin(def.yaw), Fz = -Math.cos(def.yaw), Lx = -Math.cos(def.yaw), Lz = -Math.sin(def.yaw);
  return Math.atan2(dx * Lx + dz * Lz, dx * Fx + dz * Fz) * RAD;
}

function cansar(h, c) { h.cansancio = Math.min(1, h.cansancio + c); }

export function golpear(atk, def, rnd, A = ARMAS[atk.arma], eventos = []) {
  const ev = (o) => { eventos.push(o); return o; };
  atk.golpes++; atk.quieto = 0; def.quieto = 0;
  cansar(atk, A.cansa);
  if (rnd() > A.acierto * (1 - FALLA * atk.cansancio)) { ev({ tipo: 'golpe', de: atk.id, a: def.id, arma: atk.arma, en: 'aire' }); return eventos; }
  const ang = anguloLlegada(def, atk), E = ESCUDOS[def.escudo];
  /* de frente contra la falange, un arma corta no pasa las puntas (Polibio 18.30) */
  if (def.guardia === 'falange' && A.alcance < CORTA && Math.abs(ang) < 45 && puntasDelante(def) >= FALANGE.puntas) {
    ev({ tipo: 'golpe', de: atk.id, a: def.id, arma: atk.arma, en: 'puntas', ang });
    ev({ tipo: 'para', de: def.id, a: atk.id, arma: atk.arma, en: 'puntas' });
    cansar(atk, A.cansa);
    return eventos;
  }
  /* ¿dentro del arco del escudo? */
  const arco = arcoEscudo(def);
  if (arco) {
    const bajo = def.izq.estado === 'bajo';
    if (ang >= arco[0] && ang <= arco[1]) {
      let pPara = E.para * (bajo ? ESCUDO_BAJO.para : 1) + (def.guardia === 'testudo' ? TESTUDO.para : 0);
      if (A.golpe === 'punta') pPara -= HUECO_PUNTA;
      if (rnd() < pPara) {
        ev({ tipo: 'golpe', de: atk.id, a: def.id, arma: atk.arma, en: 'escudo', ang });
        ev({ tipo: 'para', de: def.id, a: atk.id, arma: atk.arma, en: 'escudo' });
        def.escudoVida -= A.danoEscudo;
        cansar(def, PARA_CANSA * A.danoEscudo);
        if (def.escudoVida <= 0) { def.escudoVida = 0; def.izq.estado = 'roto'; ev({ tipo: 'escudo_roto', de: atk.id, a: def.id, arma: atk.arma, en: 'escudo' }); }
        if (A.dobla && rnd() < A.dobla) { atk.reloj += A.enderezar; ev({ tipo: 'dobla', de: atk.id, a: def.id, arma: atk.arma, en: 'escudo' }); }
        return eventos;
      }
    }
  } else {
    /* sin escudo: para con el arma, solo de frente */
    if (Math.abs(ang) < 60 && rnd() < PARADA_ARMA) {
      ev({ tipo: 'golpe', de: atk.id, a: def.id, arma: atk.arma, en: 'escudo', ang });
      ev({ tipo: 'para', de: def.id, a: atk.id, arma: atk.arma, en: 'arma' });
      cansar(def, PARA_CANSA);
      return eventos;
    }
  }
  /* entra al cuerpo */
  const lado = Math.abs(ang) > 120 ? ESPALDA : ang < ARCO_DER ? FLANCO : 1;
  const d = A.danoCuerpo * lado * (0.5 + rnd());
  ev({ tipo: 'golpe', de: atk.id, a: def.id, arma: atk.arma, en: 'cuerpo', ang, dano: d });
  if (d >= GRAVE) {
    def.heridas.grave++; def.vida = 0;
    ev({ tipo: 'herida', de: atk.id, a: def.id, arma: atk.arma, en: 'cuerpo', grado: 'grave', dano: d });
  } else {
    def.heridas.leve++; def.vida -= d; cansar(def, 0.08);
    ev({ tipo: 'herida', de: atk.id, a: def.id, arma: atk.arma, en: 'cuerpo', grado: 'leve', dano: d });
  }
  if (def.vida <= 0) {
    def.vivo = false; def.der.estado = 'guardia';
    ev({ tipo: 'cae', de: atk.id, a: def.id, arma: atk.arma, en: 'cuerpo' });
    if (def.manip) def.manip.sucio = true;
  }
  return eventos;
}

/* ---------- el paso ---------- */
const azarComun = crearAzar(1);
let ultimaRejilla = new Map();
const clave = (cx, cz) => (cx + 32768) * 65536 + (cz + 32768);

function buscar(h, rejilla, alcance, minimo = 0) {
  const Fx = Math.sin(h.yaw), Fz = -Math.cos(h.yaw), cosCono = Math.cos((h.guardia === 'falange' ? FALANGE.cono : CONO) / RAD);
  const r = Math.ceil(alcance / CELDA), cx0 = Math.floor(h.x / CELDA), cz0 = Math.floor(h.z / CELDA);
  let mejor = null, dMejor = alcance * alcance;
  for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
    const L = rejilla.get(clave(cx0 + i, cz0 + j));
    if (!L) continue;
    for (const o of L) {
      if (o.bando === h.bando || !o.vivo || o.huye) continue;
      const dx = o.x - h.x, dz = o.z - h.z, d2 = dx * dx + dz * dz;
      if (d2 > dMejor || d2 < minimo * minimo) continue;
      const d = Math.sqrt(d2) || 1e-6;
      if ((dx * Fx + dz * Fz) / d < cosCono) continue;
      mejor = o; dMejor = d2;
    }
  }
  return mejor;
}

export function paso(hombres, dt, opciones = {}) {
  const rnd = opciones.rnd || azarComun, eventos = opciones.eventos || [];
  /* rejilla con los que pueden recibir golpes */
  const rejilla = new Map();
  for (const h of hombres) if (h.vivo && !h.huye) {
    const k = clave(Math.floor(h.x / CELDA), Math.floor(h.z / CELDA));
    const L = rejilla.get(k); if (L) L.push(h); else rejilla.set(k, [h]);
  }
  for (const h of hombres) {
    if (!h.vivo || h.huye) continue;
    /* cansancio: tensión en la pelea o descanso */
    h.quieto += dt;
    if (h.quieto > QUIETO) h.cansancio = Math.max(0, h.cansancio - DESCANSO * dt); else cansar(h, TENSION * dt);
    if (h.guardia === 'testudo') cansar(h, TESTUDO.cansa * dt);   /* aguantar el escudo así cansa */
    /* mano izquierda: el escudo baja con el cansancio */
    if (h.izq.estado === 'alzado' && h.cansancio >= BAJA_ESCUDO) h.izq.estado = 'bajo';
    else if (h.izq.estado === 'bajo' && h.cansancio < ALZA_ESCUDO) h.izq.estado = 'alzado';
    /* mano derecha */
    h.tEstado += dt;
    if (h.der.estado === 'golpea' && h.tEstado >= T_GOLPE) { h.der.estado = 'recupera'; h.tEstado = 0; }
    h.reloj -= dt;
    if (h.der.estado === 'recupera' && h.reloj <= 0) h.der.estado = 'guardia';
    if (h.reloj > 0) continue;
    if (h.guardia === 'falange' && h.fila >= FALANGE.filas) { h.reloj = 0.5; continue; }   /* de la sexta fila atrás, la sarisa va alzada */
    const A = ARMAS[h.arma];
    /* el pilum se arroja una vez, antes del choque */
    if (A.arroja && h.pilos > 0) {
      const lejos = buscar(h, rejilla, A.arroja.alcance, A.arroja.minimo);
      if (lejos) {
        h.pilos--; eventos.push({ tipo: 'lanza', de: h.id, a: lejos.id, arma: h.arma, en: 'aire' });
        golpear(h, lejos, rnd, { ...A.arroja, golpe: 'punta', cansa: A.cansa }, eventos);
        h.arma = A.arroja.luego; h.der.estado = 'golpea'; h.tEstado = 0; h.reloj = cicloEfectivo(h);
        continue;
      }
      if (buscar(h, rejilla, A.alcance)) { h.pilos = 0; h.arma = A.arroja.luego; }   /* ya encima: sin tiempo de arrojar */
    }
    const B = ARMAS[h.arma], o = buscar(h, rejilla, B.alcance);
    if (!o) { h.reloj = 0.2 + rnd() * 0.1; continue; }   /* nadie a mano: vuelve a mirar dentro de un rato */
    h.der.estado = 'golpea'; h.tEstado = 0; h.reloj = cicloEfectivo(h);
    golpear(h, o, rnd, B, eventos);
  }
  /* huecos: los de detrás avanzan */
  const vistos = new Set();
  for (const h of hombres) if (h.manip && h.manip.sucio && !vistos.has(h.manip)) { vistos.add(h.manip); cerrarFilas(h.manip, eventos); }
  ultimaRejilla = rejilla;
  return eventos;
}

/* ---------- la pelea de manípulos ---------- */
const vivos = (M) => M.hombres.filter(h => h.vivo && !h.huye);
const cansancioMedio = (M, soloPrimera) => { const v = vivos(M).filter(h => !soloPrimera || h.fila === 0); return v.length ? v.reduce((s, h) => s + h.cansancio, 0) / v.length : 1; };
const muertos = (M) => M.hombres.filter(h => !h.vivo).length;

/* movimiento mínimo: si nadie de la primera fila llega a un enemigo pero lo tiene delante, el manípulo avanza (CB2 lo hará bien) */
export const AVANCE = { v: 1, mira: 8, cada: 0.25 };
function avanzar(M, rejilla) {
  const F = M.hombres.filter(h => h.fila === 0 && h.vivo && !h.huye);
  if (!F.length || F.some(h => buscar(h, rejilla, ARMAS[h.arma].alcance))) return;
  if (!F.some(h => buscar(h, rejilla, AVANCE.mira))) return;
  const d = AVANCE.v * AVANCE.cada;
  M.x += Math.sin(M.yaw) * d; M.z -= Math.cos(M.yaw) * d; colocar(M);
}

export function pelea({ a, b, dt = 1 / 30, tMax = 600, semilla = 1, relevo: rel = {}, avanza = true } = {}) {
  const rnd = crearAzar(semilla), lados = { a: [...a], b: [...b] }, hombres = [...a, ...b].flatMap(M => M.hombres);
  const cuenta = {}, ultimo = { a: -99, b: -99 };
  let t = 0, gana = null, tAv = 0;
  const eventos = [];
  while (t < tMax) {
    eventos.length = 0;
    paso(hombres, dt, { rnd, eventos });
    t += dt;
    for (const bando of ['a', 'b']) {
      const L = lados[bando];
      /* el de delante huye si pierde demasiados: el siguiente ocupa su sitio */
      const D = L[0];
      if (D && !D.roto && (muertos(D) >= ROTURA * D.total || cansancioMedio(D, true) >= AGOTADO)) {
        D.roto = true; for (const h of D.hombres) if (h.vivo) h.huye = true;
        eventos.push({ tipo: 'rompe', de: D.id, a: null, en: 'manipulo' });
        L.shift();
        if (L[0]) { L[0].x = D.x; L[0].z = D.z; colocar(L[0]); eventos.push({ tipo: 'relevo', de: D.id, a: L[0].id, en: 'manipulo' }); }
      }
      /* relevo a tiempo (Livio 8.8) */
      const R = rel && rel[bando];
      if (R && L.length > 1 && t - ultimo[bando] > (R.espera ?? 5)) {
        const cF = cansancioMedio(L[0], true);   /* la primera fila es la que se agota */
        if (cF >= R.umbralCansancio) {
          let k = -1, mejor = cF - 0.3;
          for (let i = 1; i < L.length; i++) { const c = cansancioMedio(L[i]); if (c < mejor && vivos(L[i]).length >= vivos(L[0]).length * 0.5) { mejor = c; k = i; } }
          if (k > 0) { relevo(L[0], L[k], eventos); [L[0], L[k]] = [L[k], L[0]]; ultimo[bando] = t; }
        }
      }
    }
    if (avanza && (tAv += dt) >= AVANCE.cada) { tAv = 0; for (const bando of ['a', 'b']) if (lados[bando][0]) avanzar(lados[bando][0], ultimaRejilla); }
    for (const e of eventos) cuenta[e.tipo] = (cuenta[e.tipo] || 0) + 1;
    if (!lados.a.length) { gana = 'b'; break; }
    if (!lados.b.length) { gana = 'a'; break; }
  }
  const bajas = { a: a.reduce((s, M) => s + muertos(M), 0), b: b.reduce((s, M) => s + muertos(M), 0) };
  return { gana, bajas, tiempo: t, eventosContados: cuenta };
}

/* ---------- tabla de medias para la batalla grande ---------- */
export function tablaMedia(armaA, escudoA, armaB, escudoB, n = 10) {
  let bA = 0, bB = 0, recA = 0, parA = 0, recB = 0, parB = 0;
  const T = 60, dt = 1 / 20;
  for (let s = 1; s <= n; s++) {
    const sep = Math.max(ARMAS[armaA].alcance, ARMAS[armaB].alcance) * 0.8;
    const MA = crearManipulo({ id: 'A' + s, bando: 'a', filas: 3, frente: 10, x: 0, z: -sep / 2, yaw: Math.PI, arma: armaA, escudo: escudoA, semilla: s * 3 });
    const MB = crearManipulo({ id: 'B' + s, bando: 'b', filas: 3, frente: 10, x: 0, z: sep / 2, yaw: 0, arma: armaB, escudo: escudoB, semilla: s * 3 + 1 });
    const hombres = [...MA.hombres, ...MB.hombres], rnd = crearAzar(s), eventos = [];
    for (let t = 0; t < T; t += dt) {
      eventos.length = 0; paso(hombres, dt, { rnd, eventos });
      for (const e of eventos) {
        const def = e.tipo === 'golpe' && e.en !== 'aire' ? e.a : null;
        if (def) { if (def[0] === 'A') recA++; else recB++; }
        if (e.tipo === 'para') { if (e.de[0] === 'A') parA++; else parB++; }
      }
    }
    bA += muertos(MA); bB += muertos(MB);
  }
  return {
    bajasMinA: bA / n / (T / 60), bajasMinB: bB / n / (T / 60),
    paradasA: recA ? 100 * parA / recA : 0, paradasB: recB ? 100 * parB / recB : 0
  };
}
