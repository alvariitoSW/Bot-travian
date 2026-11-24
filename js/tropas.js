/* AQVILA — CG9: los 12 datos de cada tropa, por pueblo y por veteranía. Solo lógica: corre en Node y en el navegador.
   Todos los NÚMEROS son licencia de juego (las fuentes dan el equipo, no las cifras). Las citas son las de ES0 §9
   y están pendientes de que Historia las coteje pasaje a pasaje. */
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
      lleva: 'Escudo largo, espada hispana, dos pila, casco de bronce y pectoral. Jóvenes: la primera línea.',
      fuente: 'Polibio 6.22-23 (equipo del manípulo); 6.21 (hastati jóvenes).',
      licencia: 'Todas las cifras. La edad por línea es histórica; el reparto en grados de veteranía, no.' }),
    velites: T(6, 5, 1, 2, 9, 1, 3, 6, 45, 55, 2.0, jab, {
      contra: { ele: 1.5 },
      lleva: 'Jabalinas, espada corta y escudo redondo (parma). Sin armadura: hostigan y se retiran.',
      fuente: 'Polibio 6.22 (vélites: jabalinas, espada, parma, casco).',
      licencia: 'Cifras; el bono contra elefantes (Polibio 15.12 los muestra hostigándolos) es una simplificación.' }),
    principes: T(11, 10, 1, 5, 10, 6, 8, 11, 70, 65, 1.5, null, {
      arroja: { dano: 6, perfora: 8, alc: 14 },
      lleva: 'Escudo largo, espada hispana, dos pila, casco y cota de malla los más ricos. Hombres en su plenitud.',
      fuente: 'Polibio 6.22-23 (equipo); 6.21 (príncipes, edad intermedia).',
      licencia: 'Todas las cifras.' }),
    triarii: T(10, 10, 2, 4, 10, 7, 8, 15, 85, 75, 1.4, null, {
      contra: { cab: 1.5 },
      lleva: 'Lanza larga en vez de pila, escudo largo, casco y malla. Veteranos: se arrodillan y esperan.',
      fuente: 'Polibio 6.23 (triarios con lanza); 6.21 (los más veteranos).',
      licencia: 'Cifras y el bono contra caballería (la lanza larga es histórica; el 1,5 no).' }),
    equites: T(11, 10, 2, 14, 14, 4, 5, 9, 65, 70, 3.6, null, {
      lleva: 'Jinete con lanza, espada, escudo redondo y coraza; armado a la griega.',
      fuente: 'Polibio 6.25 (caballería romana armada a la griega).',
      licencia: 'Todas las cifras.' }),
    vigiles: T(6, 6, 0, 2, 10, 1, 4, 7, 50, 55, 1.5, null, {
      lleva: 'Guardia urbana: porra, espada corta y escudo ligero. Sin entrenamiento de legión.',
      fuente: 'Livio 9.46 (vigilancia nocturna por triunviros). El cuerpo como tal no existió.',
      licencia: 'Toda la tropa y las cifras: es licencia de juego.' }),
    milicia: T(5, 6, 0, 2, 10, 1, 4, 5, 40, 50, 1.5, null, {
      lleva: 'Leva improvisada: lanza o hacha, escudo de madera, sin armadura.',
      fuente: 'Sin fuente concreta: leva genérica.',
      licencia: 'Toda la tropa y las cifras.' }),
    hoplitas: T(8, 9, 1, 4, 10, 5, 8, 12, 65, 70, 1.4, null, {
      contra: { cab: 1.5 },
      lleva: 'Lanza, espada corta, gran escudo redondo (hoplon), casco y coraza. Combaten en línea cerrada.',
      fuente: 'Plutarco, Pirro 16-17 (infantería de Epiro); Polibio 18.29-30.',
      licencia: 'Cifras; el bono contra caballería.' }),
    falange: T(9, 10, 3, 4, 10, 5, 2, 17, 75, 85, 1.3, null, {
      contra: { cab: 1.5 },
      lleva: 'Sarisa de varios metros, escudo pequeño al brazo, casco y coraza. Formada en muchas filas.',
      fuente: 'Polibio 18.29-30 (falange de 16 filas); 18.32 (ventaja de frente, debilidad de flanco).',
      licencia: 'Cifras; la ventaja de formación la da el simulador.' }),
    peltastas: T(6, 5, 1, 2, 9, 1, 3, 6, 45, 55, 2.0, jab, {
      lleva: 'Jabalinas y espada corta, escudo ligero (pelta). Infantería ligera de tiro.',
      fuente: 'Plutarco, Pirro 21 (tropas ligeras de Pirro); sin cotejar.',
      licencia: 'Todas las cifras.' }),
    honderos: T(4, 3, 3, 1, 9, 0, 0, 5, 45, 60, 2.0, { alc: 80, dano: 3, perfora: 3, mun: 50 }, {
      lleva: 'Honda y piedras o bolas de plomo; sin armadura ni escudo. Tiran de lejos.',
      fuente: 'Diodoro 5.18 (honderos baleares).',
      licencia: 'Cifras de alcance, daño y munición.' }),
    libios: T(9, 9, 1, 4, 10, 6, 8, 10, 60, 85, 1.5, null, {
      lleva: 'Escudo largo, espada y lanza; en Cannas, con armas romanas tomadas. Resisten mucho.',
      fuente: 'Polibio 3.87 y 3.114 (rearmados con armas romanas); 15.11-14.',
      licencia: 'Todas las cifras.' }),
    iberos: T(11, 10, 2, 5, 10, 2, 4, 8, 60, 60, 1.7, null, {
      arroja: { dano: 4, perfora: 6, alc: 14 },
      lleva: 'Escudo pequeño redondo (caetra), espada corta de punta y tajo, jabalina toda de hierro (soliferrum).',
      fuente: 'Diodoro 5.33-34; Estrabón 3.4.15; Polibio 3.114 (túnica blanca con ribete púrpura).',
      licencia: 'Cifras.' }),
    galos: T(13, 14, 1, 6, 10, 0, 6, 6, 45, 30, 1.8, null, {
      lleva: 'Espada larga de tajo que se dobla, escudo largo; muchos, desnudos de cintura arriba. Furia inicial.',
      fuente: 'Polibio 2.28-33 (espadas largas, gesatos desnudos); 3.114.',
      licencia: 'Todas las cifras, incluida la poca resistencia.' }),
    sagrada: T(12, 12, 2, 4, 10, 7, 8, 14, 90, 80, 1.4, null, {
      lleva: 'Ciudadanos de Cartago con lanza y escudo, casco y coraza. Cuerpo de élite.',
      fuente: 'Diodoro 16.80 y 20.10 (Batallón Sagrado, siglo IV a.C.).',
      licencia: 'El cuerpo en 280-146 a.C. y todas las cifras: licencia de juego.' }),
    jinetes: T(9, 9, 1, 12, 14, 2, 4, 7, 60, 65, 3.4, null, {
      lleva: 'Caballería de varias facciones: lanza o jabalina, escudo redondo, poca armadura.',
      fuente: 'Genérica; sin fuente concreta.',
      licencia: 'Toda la tropa y las cifras.' }),
    numidas: T(8, 6, 1, 10, 13, 0, 2, 9, 60, 75, 4.0, { alc: 30, dano: 5, perfora: 2, mun: 40 }, {
      lleva: 'Sin silla ni brida, jabalinas y escudo de cuero; ligeros y rapidísimos.',
      fuente: 'Polibio 3.72; Livio 35.11 (númidas ligeros con jabalinas).',
      licencia: 'Cifras.' }),
    tesalios: T(12, 11, 2, 16, 14, 6, 5, 10, 75, 70, 3.4, null, {
      lleva: 'Caballería pesada de Tesalia: lanza, espada, coraza y casco. Golpe de choque.',
      fuente: 'Plutarco, Pirro 16-17 (caballería tesalia); Polibio 18.',
      licencia: 'Cifras.' }),
    elefantes: T(10, 14, 4, 28, 90, 6, 0, 6, 50, 40, 2.1, null, {
      lleva: 'Elefante de guerra con guía; arrolla al chocar y, herido, se desboca contra los suyos.',
      fuente: 'Polibio 15.11-12 (elefantes en Zama); Plutarco, Pirro 17 y 21; Polibio 1.40.',
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
      elefantes: { moral: 5, tiro: { alc: 12, dano: 3, perfora: 1, mun: 30 } }  // torre con arqueros (Plutarco, Pirro 33; sin cotejar)
    },
    macedonia: {
      falange: { resistencia: 5 }
    },
    galos: {
      jinetes: { carga: 3, armadura: -2 }   // jinete galo: choque, poca coraza (Polibio 2.28; sin cotejar)
    },
    iberos: {
      jinetes: { acierto: 2, velocidad: 0.4 }  // jinete íbero: ágil (Livio 28.2; sin cotejar)
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
  const PRECIO = {};
  /* Bolsas de denarios para comprar un ejército en Escaramuzas: provisional. */
  const BOLSAS = { pequena: 5000, mediana: 10000, grande: 15000 };

  const Tropas = { DATOS, PUEBLO, VET, CAMPOS, PRECIO, BOLSAS, datos, barras };
  root.Tropas = Tropas;
  if (typeof module !== 'undefined' && module.exports) module.exports = Tropas;
})(typeof window !== 'undefined' ? window : globalThis);
