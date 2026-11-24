/* AQVILA — CG9: los 12 datos de cada tropa, por pueblo y por veteranía. Solo lógica: corre en Node y en el navegador.
   Todos los NÚMEROS son licencia de juego (las fuentes dan el equipo, no las cifras). Citas y textos «lleva» según gobierno/historia/CG9-fuentes.md (cotejado = leído en el pasaje; probable = no). */
(function (root) {
  'use strict';

  /* Atajo para escribir una tropa: pegar, aguantar, durar, tiro; luego los extras (arroja, contra, textos). */
  const T = (a, d, p, c, v, ar, es, df, mo, re, ve, tiro, ex) => Object.assign({
    acierto: a, dano: d, perfora: p, carga: c, vida: v, armadura: ar, escudo: es, defensa: df,
    moral: mo, resistencia: re, velocidad: ve, tiro: tiro || null
  }, ex || {});
  const jab = { alc: 30, dano: 5, perfora: 2, mun: 40 };

  const DATOS = {
    hastati: T(9, 9, 1, 4, 10, 4, 8, 9, 60, 60, 1.6, null, {
      arroja: { dano: 6, perfora: 7, alc: 14 },
      lleva: 'Lleva scutum, espada hispana, dos pila, casco de bronce con plumas y greba; pectoral de bronce, o cota de malla si es rico.',
      fuente: 'Polibio 6.22-23 (cotejado); 6.21 (hastati jóvenes).',
      licencia: 'Todas las cifras. La edad por línea es histórica; los grados de veteranía, no. Que el pilum atraviese escudos: probable (César, BG 1.25, fuera de época).' }),
    velites: T(6, 5, 1, 2, 9, 1, 3, 6, 45, 55, 2.0, jab, {
      contra: { ele: 1.5 },
      lleva: 'Lleva espada, jabalinas ligeras y parma redonda de tres pies; casco sencillo, a veces con piel de lobo. Sin coraza.',
      fuente: 'Polibio 6.22 (cotejado): sin coraza.',
      licencia: 'Cifras; el bono contra elefantes (Polibio 15.12 los muestra hostigándolos) es una simplificación.' }),
    principes: T(11, 10, 1, 5, 10, 6, 8, 11, 70, 65, 1.5, null, {
      arroja: { dano: 6, perfora: 8, alc: 14 },
      lleva: 'Lleva lo mismo que los hastati: scutum, espada hispana, dos pila, casco de bronce, greba y pectoral o cota de malla.',
      fuente: 'Polibio 6.23 (cotejado); 6.21 (edad intermedia).',
      licencia: 'Todas las cifras.' }),
    triarii: T(10, 10, 2, 4, 10, 7, 8, 15, 85, 75, 1.4, null, {
      contra: { cab: 1.5 },
      lleva: 'Lleva scutum, espada hispana y lanza larga en vez de pila; casco de bronce, greba y pectoral o cota de malla.',
      fuente: 'Polibio 6.23 (cotejado); Livio 8.8.',
      licencia: 'Cifras y el bono contra caballería (la lanza larga es histórica; el 1,5 no).' }),
    equites: T(11, 10, 2, 14, 14, 4, 5, 9, 65, 70, 3.6, null, {
      lleva: 'Lleva coraza, escudo redondo y lanza con contera, a la griega; antes iban sin coraza. Sin estribos.',
      fuente: 'Polibio 6.25 (cotejado).',
      licencia: 'Todas las cifras.' }),
    vigiles: T(6, 6, 0, 2, 10, 1, 4, 7, 50, 55, 1.5, null, {
      lleva: 'Lleva garrote o lanza corta, escudo pequeño y casco sencillo; sin coraza. Ronda de noche y apaga fuegos.',
      fuente: 'Livio 39.14 (guardias nocturnas, 186 a.C.). Los vigiles reales son de Augusto: licencia de juego.',
      licencia: 'Toda la tropa y las cifras: es licencia de juego.' }),
    milicia: T(5, 6, 0, 2, 10, 1, 4, 5, 40, 50, 1.5, null, {
      lleva: 'Lleva lo que puede pagar: lanza o jabalinas, escudo de su ciudad y casco si hay dinero. Casi nunca coraza.',
      fuente: 'Sin fuente concreta (leva ciudadana): licencia de juego.',
      licencia: 'Toda la tropa y las cifras.' }),
    hoplitas: T(8, 9, 1, 4, 10, 5, 8, 12, 65, 70, 1.4, null, {
      contra: { cab: 1.5 },
      lleva: 'Lleva escudo redondo grande, lanza larga y espada corta; casco de bronce y coraza de lino o de bronce.',
      fuente: 'Plutarco, Filopemén 9 (solo escudos y lanzas aqueas); Connolly 1998: probable.',
      licencia: 'Cifras; el bono contra caballería.' }),
    falange: T(9, 10, 3, 4, 10, 5, 2, 17, 75, 85, 1.3, null, {
      contra: { cab: 1.5 },
      lleva: 'Lleva sarisa de 14 codos (unos 6 m) a dos manos y escudo pequeño colgado; casco y, solo algunos, coraza ligera.',
      fuente: 'Polibio 18.29 (sarisa, cotejado); escudo y coraza: Connolly 1998, probable.',
      licencia: 'Cifras; la ventaja de formación la da el simulador.' }),
    peltastas: T(6, 5, 1, 2, 9, 1, 3, 6, 45, 55, 2.0, jab, {
      lleva: 'Lleva jabalinas, espada y escudo ligero (oval o en media luna); casco sencillo y sin coraza.',
      fuente: 'Sekunda 1996; Livio 44.41 (caetrati, cotejado). El nombre es licencia de juego.',
      licencia: 'Todas las cifras.' }),
    honderos: T(4, 3, 3, 1, 9, 0, 0, 5, 45, 60, 2.0, { alc: 60, dano: 2, perfora: 1, mun: 40 }, {
      lleva: 'Lleva tres hondas (en la cabeza, a la cintura y en la mano) y tira piedras grandes. Sin escudo ni armadura.',
      fuente: 'Diodoro 5.18; Livio 28.37 (cotejados).',
      licencia: 'Cifras de alcance, daño y munición.' }),
    libios: T(9, 9, 1, 4, 10, 6, 8, 10, 60, 85, 1.5, null, {
      lleva: 'Lleva equipo romano tomado al enemigo desde 217 a.C.: scutum, espada, casco y pectoral o cota. Antes, lanza y escudo.',
      fuente: 'Polibio 3.87, 3.114; Livio 22.46 (cotejados). Lo de «antes»: probable.',
      licencia: 'Todas las cifras.' }),
    iberos: T(11, 10, 2, 5, 10, 2, 4, 8, 60, 60, 1.7, null, {
      arroja: { dano: 4, perfora: 6, alc: 14 },
      lleva: 'Lleva escudo largo o caetra pequeña, espada de punta y filo, jabalina toda de hierro y túnica de lino con borde púrpura.',
      fuente: 'Polibio 3.114 (cotejado); Diodoro 5.33 «espada de dos filos y puñal», 5.34 (extracto).',
      licencia: 'Cifras.' }),
    galos: T(13, 14, 1, 6, 10, 0, 6, 6, 45, 30, 1.8, null, {
      lleva: 'Lleva espada larga que solo corta y escudo largo; calzas y capa, o desnudo como los gesatos. Casi nunca coraza.',
      fuente: 'Polibio 2.28-30 (cotejado), 2.33 (extracto), 3.114 (cotejado).',
      licencia: 'Todas las cifras, incluida la poca resistencia.' }),
    sagrada: T(12, 12, 2, 4, 10, 7, 8, 14, 90, 80, 1.4, null, {
      lleva: 'Lleva escudo redondo grande, lanza, casco y coraza: equipo caro de ciudadanos ricos de Cartago.',
      fuente: 'Diodoro 16.80 (ciudadanos ricos; el equipo no lo detalla): probable. La tropa en 280-146 es licencia.',
      licencia: 'El cuerpo en 280-146 a.C. y todas las cifras: licencia de juego.' }),
    jinetes: T(9, 9, 1, 12, 14, 2, 4, 7, 60, 65, 3.4, null, {
      lleva: 'Lleva lanza, jabalinas o espada, escudo redondo y casco; coraza según su pueblo y su riqueza.',
      fuente: 'Ninguna concreta: licencia de juego.',
      licencia: 'Toda la tropa y las cifras.' }),
    numidas: T(8, 6, 1, 10, 13, 0, 2, 9, 60, 75, 4.0, { alc: 30, dano: 5, perfora: 2, mun: 40 }, {
      lleva: 'Lleva un haz de jabalinas y escudo redondo pequeño; monta sin silla ni freno. Sin armadura.',
      fuente: 'Livio 35.11 (cotejado); el escudo: Connolly 1998, probable.',
      licencia: 'Cifras.' }),
    tesalios: T(12, 11, 2, 16, 14, 6, 5, 10, 75, 70, 3.4, null, {
      lleva: 'Lleva lanza larga de caballería, espada, casco y coraza; sin escudo, a la manera macedonia.',
      fuente: 'Plutarco, Pirro 17.3 (solo la carga, cotejado); equipo: Connolly 1998, probable.',
      licencia: 'Cifras.' }),
    elefantes: T(10, 14, 4, 28, 90, 6, 0, 6, 50, 25, 2.1, null, {
      lleva: 'Lleva conductor y, a veces, torre con tiradores. Pirro, elefantes indios; Cartago, africanos más pequeños.',
      fuente: 'Plutarco, Pirro 15-17, 21; Polibio 5.84 (cotejados). La torre en Cartago, discutida.',
      licencia: 'Todas las cifras (masa, vida y carga incluidas).' }),
    general: T(17, 14, 2, 10, 20, 8, 6, 16, 100, 90, 3.2, null, {
      lleva: 'Un mismo modelo para todos los generales: caballo, coraza y escolta.',
      fuente: 'Genérica.',
      licencia: 'Toda la tropa y las cifras.' })
  };

  /* Retoques por pueblo (suma sobre la base). Pocos y con su razón. */
  const PUEBLO = {
    roma: {},
    cartago: {
      libios: { armadura: 1, escudo: 1 },   // armas romanas tomadas (Polibio 3.87, 3.114)
      iberos: { armadura: 0 }
    },
    epiro: {
      elefantes: { moral: 5, tiro: { alc: 12, dano: 3, perfora: 1, mun: 30 } }  // torre con arqueros (Plutarco, Pirro 33; probable)
    },
    macedonia: {
      falange: { resistencia: 5 }
    },
    galos: {
      jinetes: { carga: 3, armadura: -2 }   // jinete galo: choque, poca coraza (Polibio 2.28; probable)
    },
    iberos: {
      jinetes: { acierto: 2, velocidad: 0.4 }  // jinete íbero: ágil (Livio 28.2; probable)
    }
  };

  const VET = {
    novato:   { n: 'Novatos',   acierto: -2, defensa: -2, moral: -10, precio: 0.8 },
    curtido:  { n: 'Curtidos',  acierto: 0,  defensa: 0,  moral: 0,   precio: 1 },
    veterano: { n: 'Veteranos', acierto: 2,  defensa: 2,  moral: 10,  precio: 1.3 }
  };

  /* Topes de cada campo [mín, máx] (el elefante sobrepasa carga y vida normales). */
  const TOPE = {
    acierto: [1, 20], dano: [1, 20], perfora: [0, 10], carga: [0, 35],
    vida: [1, 150], armadura: [0, 12], escudo: [0, 10], defensa: [1, 20],
    moral: [0, 100], resistencia: [0, 100], velocidad: [0.5, 5]
  };

  /* Los 12 datos para la ficha: [clave, nombre llano, explicación corta, grupo]. */
  const CAMPOS = [
    ['acierto', 'Acierto', 'cuántos golpes dan en el blanco', 'Pegar'],
    ['dano', 'Daño', 'fuerza del golpe de filo', 'Pegar'],
    ['perfora', 'Perfora', 'lo que la armadura no para', 'Pegar'],
    ['carga', 'Carga', 'fuerza del primer impacto al cargar', 'Pegar'],
    ['vida', 'Vida', 'puntos de vida por hombre', 'Aguantar'],
    ['armadura', 'Armadura', 'parte del daño que se queda en el hierro', 'Aguantar'],
    ['escudo', 'Escudo', 'protege de frente y del tiro, no de flanco', 'Aguantar'],
    ['defensa', 'Defensa', 'habilidad para parar los golpes', 'Aguantar'],
    ['moral', 'Moral', 'ánimo antes de romper filas', 'Durar'],
    ['resistencia', 'Resistencia', 'aguante al cansancio', 'Durar'],
    ['velocidad', 'Velocidad', 'metros por segundo andando', 'Durar'],
    ['tiro', 'Tiro', 'alcance, daño y munición a distancia', 'Tiro']
  ];

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const memo = {};

  function datos(tropa, pueblo, vet) {
    const id = DATOS[tropa] ? tropa : 'milicia';
    const v = VET[vet] ? vet : 'curtido';
    const clave = id + '|' + (pueblo || '') + '|' + v;
    if (memo[clave]) return memo[clave];
    const b = DATOS[id], r = Object.assign({}, b);
    r.tiro = b.tiro ? Object.assign({}, b.tiro) : null;
    r.arroja = b.arroja ? Object.assign({}, b.arroja) : undefined;
    r.contra = b.contra ? Object.assign({}, b.contra) : {};
    const p = (PUEBLO[pueblo] || {})[id] || {};
    for (const k in p) {
      if (k === 'tiro') r.tiro = Object.assign(r.tiro || {}, p.tiro);
      else r[k] = r[k] + p[k];
    }
    const e = VET[v];
    r.acierto += e.acierto; r.defensa += e.defensa; r.moral += e.moral;
    for (const k in TOPE) r[k] = clamp(r[k], TOPE[k][0], TOPE[k][1]);
    if (r.arroja === undefined) delete r.arroja;
    r.id = id; r.vet = v;
    memo[clave] = r;
    return r;
  }

  /* Las 4 barras de la tarjeta, entre 0 y 1. */
  function barras(tropa, pueblo, vet) {
    const d = datos(tropa, pueblo, vet);
    const ataque = (d.acierto / 20 * 0.35 + d.dano / 20 * 0.4 + d.perfora / 10 * 0.25);
    const armadura = (d.armadura / 12 * 0.45 + d.escudo / 10 * 0.25 + d.defensa / 20 * 0.3);
    return {
      ataque: clamp(ataque, 0, 1),
      armadura: clamp(armadura, 0, 1),
      vida: clamp(Math.sqrt(d.vida / 100), 0, 1),
      moral: clamp(d.moral / 100, 0, 1)
    };
  }

  /* Lo rellena el bot de precios (CG9 pieza C). */
  /* Precio de un manípulo (curtido). Medido el 2026-11-24 con test/tropas-precios.mjs: 12 semillas; por bisección, hombres que empatan contra 4 manípulos de hastati (480)
     y, para caballería y tiradores, también contra 3 hastati + 1 velites + 1 equites (media). Precio = 700 × valor por hombre × hombres del manípulo / 120, a 50; mínimo 150. */
  const PRECIO = { hastati: 700, principes: 800, triarii: 800, velites: 700, equites: 800, libios: 800, honderos: 1150, numidas: 300, elefantes: 600, iberos: 700, sagrada: 1300, falange: 1700, hoplitas: 700, peltastas: 700, tesalios: 900, galos: 600, jinetes: 500 };
    /* Precio final por pueblo (medido): el precio base por un factor (cartago 1.41, epiro 0.89, macedonia 0.99, galos 1.04, iberos 1.61) para que, con el mismo dinero, su ejército típico empate con el romano. */
  const PRECIO_PUEBLO = {
    roma: { hastati: 700, principes: 800, triarii: 800, velites: 700, equites: 800 },
    cartago: { libios: 1150, honderos: 1600, numidas: 400, elefantes: 850, iberos: 1000, sagrada: 1850 },
    epiro: { falange: 1500, hoplitas: 600, peltastas: 600, tesalios: 800, elefantes: 550 },
    macedonia: { falange: 1700, peltastas: 700, tesalios: 900 },
    galos: { galos: 650, jinetes: 500 },
    iberos: { iberos: 1150, honderos: 1850, jinetes: 800 }
  };
  /* Bolsas de denarios para Escaramuzas. Cuenta (CG9, 24/11): ejército típico de 16 manípulos por pueblo con estos precios:
     roma 11450, cartago 20350, epiro 15100, macedonia 18750, galos 9000, iberos 26500; media 16858 → mediana 17000 (≈16 manípulos),
     pequeña 8500 (≈8) y grande 25500 (≈24). Redondeo a 500. */
  const BOLSAS = { pequena: 8000, mediana: 16000, grande: 24000 };

  /* Precio de un manípulo de esa tropa con esa veteranía, a 50 denarios. */
  function precio(tropa, pueblo, vet) {
    const v = VET[vet] ? vet : 'curtido';
    const base = (PRECIO_PUEBLO[pueblo] && PRECIO_PUEBLO[pueblo][tropa]) || PRECIO[tropa] || 700;
    return Math.round(base * VET[v].precio / 50) * 50;
  }

  const Tropas = { DATOS, PUEBLO, VET, CAMPOS, PRECIO, PRECIO_PUEBLO, BOLSAS, datos, barras, precio };
  root.Tropas = Tropas;
  if (typeof module !== 'undefined' && module.exports) module.exports = Tropas;
})(typeof window !== 'undefined' ? window : globalThis);
