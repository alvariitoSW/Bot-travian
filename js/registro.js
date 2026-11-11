/* AQVILA — registro de piezas: una ficha por cada pieza de js/data.js, con su arte y su fuente histórica.
   Los NÚMEROS (costes, ataque, tiempos…) NO están aquí: siguen en data.js. La ficha se casa con la pieza por id.
   El juez (node gobierno/fichas.mjs) comprueba que no sobre ni falte ninguna ficha y que los archivos de arte existan.
   La historia viene de gobierno/historia/ (auditoría H1, PROVISIONAL: nada está cotejado con el texto antiguo todavía).
   dictamen: 'historico' (cotejado con el pasaje) | 'licencia de juego' (inventado o cambiado para poder jugar) | 'por cotejar'. */
(function (root) {
  const R = {};
  const CC = 'CC BY-SA 3.0', WG = 'Wildfire Games (0 A.D.)';
  const est = (m, extra) => Object.assign({ modelo: 'assets/static/' + m + '.bin', licencia: CC, credito: WG }, extra || {});   // edificio real de 0 A.D.
  const uni = (m, extra) => Object.assign({ modelo: 'assets/units/' + m + '.bin', licencia: CC, credito: WG }, extra || {});   // tropa real de 0 A.D.
  const h = (fuente, dictamen, nota) => Object.assign({ fuente, dictamen: dictamen || 'por cotejar' }, nota ? { nota } : {});
  const f = (arte, historia) => ({ arte, historia });
  const SIN_H = h('', 'por cotejar');   // la auditoría H1 no dice nada de esta pieza

  // ---- Edificios (D.BUILD). Modelo: el que usa city3d.js (D.BUILD[b].modelo || b) ----
  const edificio = {
    aserradero: f(est('aserradero'), SIN_H), cantera: f(est('cantera'), SIN_H), mina: f(est('mina'), SIN_H), granja: f(est('granja'), SIN_H),
    viviendas: f(est('casa', { nota: 'las ínsulas se dibujan como manzanas de casas (casa.bin)' }), SIN_H),
    foro: f(est('foro'), SIN_H), almacen: f(est('almacen'), SIN_H), mercado: f(est('mercado'), SIN_H), puerto: f(est('puerto'), SIN_H),
    cuartel: f(est('cuartel'), SIN_H), establo: f(est('establo'), SIN_H),
    muralla: f(est('muro', { nota: 'recinto con muro.bin, torre.bin y puerta.bin' }), SIN_H),
    herreria: f({ sin: 'la herrería no tiene modelo: no se dibuja en la ciudad', provisional: true }, SIN_H),
    acueducto: f(est('arco', { provisional: true, nota: 'arco.bin prestado; falta un acueducto' }), SIN_H),
    termas: f(est('vesta', { provisional: true, nota: 'vesta.bin (templo de Vesta) prestado; faltan unas termas' }), SIN_H),
    anfiteatro: f(est('foro', { provisional: true, nota: 'foro.bin prestado; falta un anfiteatro' }), SIN_H),
    templo: f(est('templo'), SIN_H)
  };

  // ---- Tropas (D.UNITS). Modelo: assets/units/<id>.bin (el índice es el id). Fuente: H1-tropas.md ----
  const tropa = {
    hastati: f(uni('hastati'), h('Polibio 6.21 y 6.23; Livio 8.8; Connolly 1998; Goldsworthy 2000')),
    velites: f(uni('velites'), h('Polibio 6.21.7 y 6.22; Livio 26.4; Keppie 1984', 'licencia de juego', 'Livio 26.4 los fecha en 211 a.C.; en 280 es dudoso')),
    principes: f(uni('principes'), h('Polibio 6.21 y 6.23; Livio 8.8')),
    triarii: f(uni('triarii'), h('Polibio 6.23; Livio 8.8')),
    equites: f(uni('equites'), h('Polibio 6.20.9 y 6.25')),
    vigiles: f(uni('vigiles', { provisional: true, nota: 'la tropa es un anacronismo; el modelo es un jabalinero romano' }), h('Suetonio, Augusto 25.2; Dion Casio 55.26', 'por cotejar', 'anacronismo: los vigiles son de Augusto (6 d.C.)')),
    milicia: f(uni('milicia'), h('Sin fuente específica; Connolly 1998', 'licencia de juego', 'leva ciudadana genérica')),
    hoplitas: f(uni('hoplitas'), h('Polibio 11.9; Plutarco, Filopemén 9; Sekunda 1996')),
    falange: f(uni('falange'), h('Plutarco, Pirro 15-17; Polibio 18.28-32; Livio 38.4-9 y 44.41')),
    peltastas: f(uni('peltastas'), h('Livio 44.41; Sekunda 1996', 'licencia de juego', 'infantería ligera griega genérica')),
    honderos: f(uni('honderos'), h('Diodoro 5.18; Livio 28.37')),
    libios: f(uni('libios'), h('Polibio 3.87.3, 3.114 y 6.52')),
    iberos: f(uni('iberos'), h('Polibio 3.114; Quesada Sanz 1997')),
    galos: f(uni('galos'), h('Polibio 2.28-30; Plutarco, Marcelo 6-7')),
    sagrada: f(uni('sagrada'), h('Diodoro 16.80.4 y 20.12.3; Apiano, Libyca 93', 'por cotejar', 'anacronismo: el Batallón Sagrado desaparece de las fuentes tras 310 a.C.')),
    jinetes: f(uni('jinetes'), h('Criterio general', 'licencia de juego', 'caballería local genérica')),
    numidas: f(uni('numidas'), h('Livio 21.46 y 35.11.7; Polibio 3.65')),
    tesalios: f(uni('tesalios'), h('Plutarco, Pirro 16; Livio 42.58', 'por cotejar', 'en Pidna (168) los tesalios luchaban del lado romano')),
    elefantes: f(uni('elefantes', { provisional: true, nota: 'un solo modelo cartaginés; no encaja para los elefantes asiáticos de Pirro' }), h('Plutarco, Pirro 15-17; Polibio 1.40 y 5.84; Scullard 1974')),
    general: f(uni('general', { provisional: true, nota: 'modelo único de Escipión para todos los generales' }), h('', 'licencia de juego', 'cada bando tuvo generales distintos'))
  };

  // ---- Ciudades (D.CITIES). Sin modelo propio: todas usan la escena común de city3d.js. Fuente: H1-ciudades.md ----
  const SIN_C = { sin: 'sin modelo propio: usa la escena común de la ciudad (city3d.js)' };
  const ciudad = {
    roma: f(SIN_C, h('Livio, Per. 12-13; Polibio 6.21-24')),
    volsinii: f(SIN_C, h('Livio, Per. 16; Fasti Triumphales, año 280; Floro 1.21')),
    capua: f(SIN_C, h('Livio 8.14 y 9.20; Livio 23.2-10 y 26.14-16', 'por cotejar', 'anacronismo: en 280 Capua era súbdita de Roma, no independiente')),
    tarentum: f(SIN_C, h('Plutarco, Pirro 15; Estrabón 6.3.2-3; Livio, Per. 14', 'por cotejar', 'dueño Epiro desde 280 y general Pirro «hasta 272»: licencia de juego')),
    mediolanum: f(SIN_C, h('Livio 5.34; Polibio 2.17 y 2.34; Livio, Per. 20; Plutarco, Marcelo 7')),
    messana: f(SIN_C, h('Polibio 1.7-11; Diodoro 21.18; Tucídides 6.4')),
    syracusae: f(SIN_C, h('Diodoro 22.7-8; Plutarco, Pirro 22-23; Polibio 1.8-9 y 8.3-7; Livio 24.34 y 25.23-31; Cicerón, Verr. 4.117', 'por cotejar', 'dueño «Siracusa» estable en 280: licencia de juego')),
    agrigentum: f(SIN_C, h('Diodoro 22.2 y 23.8; Plutarco, Pirro 22-23; Polibio 1.17-19', 'por cotejar', 'anacronismo: en 280 era la griega Akragas, no cartaginesa')),
    panormus: f(SIN_C, h('Polibio 1.38-40; Diodoro 22.10 y 23.18-21')),
    lilybaeum: f(SIN_C, h('Diodoro 14.48 y 14.53; Plutarco, Pirro 22; Polibio 1.41-48 y 1.67')),
    carales: f(SIN_C, h('Polibio 1.88 y 3.10; Livio, Per. 20')),
    emporion: f(SIN_C, h('Estrabón 3.4.8; Livio 21.60 y 34.9; Polibio 3.76')),
    saguntum: f(SIN_C, h('Livio 21.7 y 21.15; Polibio 3.15-17 y 3.30; Estrabón 3.4.6')),
    carthagonova: f(SIN_C, h('Polibio 2.13 y 10.8-20; Diodoro 25.12; Livio 26.42-46', 'por cotejar', 'anacronismo: no existía en 280 a.C. (fundada hacia 228)')),
    ambracia: f(SIN_C, h('Estrabón 7.7.6; Plutarco, Pirro 9; Polibio 21.26-30; Livio 38.4-9')),
    pella: f(SIN_C, h('Justino 24.5 y 25.1-2; Pausanias 10.19.7; Livio 44.40-42 y 45.29')),
    corinthus: f(SIN_C, h('Polibio 2.41 y 2.43; Plutarco, Arato 16-24; Livio, Per. 52; Estrabón 8.6.23', 'por cotejar', 'anacronismo: en 280 no era de la Liga Aquea')),
    carthago: f(SIN_C, h('Diodoro 16.80 y 20.10; Polibio 3.25 y 36.9; Apiano, Lib. 93-135; Livio, Per. 13; Justino 18.2; Plutarco, Catón 27', 'por cotejar', 'el general «Asdrúbal el Beotarca» es de 149-146, no de 280'))
  };

  // ---- Hechos (D.EVENTS). D.EVENTS es una lista sin id. El id de la ficha es «<año>-<clave>» y se casa por el AÑO (cada año sale una sola vez).
  //      Si data.js añade un hecho, hay que añadir su ficha con el mismo año; el juez dice cuál falta. R.de('hecho', 277) también vale. ----
  const SIN_E = { sin: 'un hecho no tiene modelo 3D' };
  const hecho = {
    '280-fundacion': f(SIN_E, h('Plutarco, Pirro 15; Polibio 1.1-3 y 2.14-21')),
    '277-pirro': f(SIN_E, h('Plutarco, Pirro 17 y 21; Plinio, Hist. Nat. 8.16; Varrón, De ling. lat. 7.39', 'por cotejar', 'fecha errónea: Pirro marcha sobre Roma en 280, no en 277')),
    '272-tarento': f(SIN_E, h('Polibio 2.21-35')),
    '264-primera-punica': f(SIN_E, h('Polibio 1.11 y 1.63.4', 'por cotejar', 'los ataques cartagineses a tus ciudades son licencia de juego')),
    '260-milas': f(SIN_E, h('Polibio 1.22-23', 'por cotejar', 'Polibio no dice que Duilio inventara el corvus')),
    '241-egadas': f(SIN_E, h('Polibio 1.62-63')),
    '225-telamon': f(SIN_E, h('Polibio 2.23-24 y 2.27-31; Diodoro 25.13')),
    '218-anibal': f(SIN_E, h('Polibio 3.64-65 y 3.70-74; Cicerón, Filípica 1.11', 'por cotejar', '«Aníbal ad portas» es una frase de época posterior')),
    '216-cannas': f(SIN_E, h('Polibio 3.115-118; Livio 22.46-49, 22.54 y 23.2-10', 'por cotejar', 'bajas: Polibio y Livio no coinciden; decir «según»')),
    '214-filipo': f(SIN_E, h('Polibio 7.9; Livio 23.33-39, 24.40 y 26.24', 'por cotejar', 'Filipo nunca llegó a Italia: su ataque a ciudades romanas es licencia de juego')),
    '212-siracusa': f(SIN_E, h('Polibio 8.5-7; Plutarco, Marcelo 15-19; Livio 25.31; Valerio Máximo 8.7 ext. 7', 'por cotejar', 'la frase sobre los círculos es una paráfrasis tardía')),
    '209-cartagonova': f(SIN_E, h('Livio 26.18-19 y 26.45; Polibio 10.8 y 10.14')),
    '202-zama': f(SIN_E, h('Polibio 15.5-14; Livio 30.33')),
    '197-cinoscefalas': f(SIN_E, h('Polibio 18.18-32; Livio 33.7-10')),
    '168-pidna': f(SIN_E, h('Livio 45.29; Plutarco, Emilio Paulo 34')),
    '149-delenda': f(SIN_E, h('Plinio, Hist. Nat. 15.74; Floro 1.31; Polibio 36.1-9; Apiano, Líbica 69 y 74-135', 'por cotejar', 'la frase literal «Carthago delenda est» es una redacción tardía')),
    '275-benevento': f(SIN_E, h('Plutarco, Pirro 25-26; Livio, Períocas 14.3')),
    '243-arato': f(SIN_E, h('Polibio 2.43; Plutarco, Arato 16-24', 'por cotejar', 'el año 243 se deduce de Polibio')),
    '228-cartagonova': f(SIN_E, h('Polibio 2.13; Diodoro 25.12', 'por cotejar', 'probable: ninguna fuente da el año; 228 es la fecha de los historiadores modernos')),
    '217-trasimeno': f(SIN_E, h('Polibio 3.83-85; Livio 22.4-7')),
    '207-metauro': f(SIN_E, h('Polibio 11.1-3; Livio 27.47-49', 'por cotejar', 'cifras: Polibio y Livio no coinciden; decir «según»')),
    '206-ilipa': f(SIN_E, h('Polibio 11.20-24; Livio 28.12-15', 'por cotejar', 'cifras: Polibio y Livio no coinciden; decir «según»')),
    '190-magnesia': f(SIN_E, h('Livio 37.37-44; Apiano, Siria 30-36')),
    '146-corinto-cartago': f(SIN_E, h('Pausanias 7.16; Livio, Períocas 51-52; Apiano, Libyca 127-132'))
  };

  // ---- Facciones (D.FACTIONS). Sin modelo: solo un nombre y un color. Fuente: H1-ciudades.md y H1-hechos.md ----
  const SIN_F = { sin: 'sin modelo: la facción es un nombre y un color' };
  const faccion = {
    roma: f(SIN_F, SIN_H),
    cartago: f(SIN_F, h('Polibio 1.10-11', 'por cotejar', 'sus ataques desde 264 son licencia de juego')),
    epiro: f(SIN_F, h('Plutarco, Pirro 15')),
    macedonia: f(SIN_F, h('Polibio 7.9', 'por cotejar', 'sus ataques desde 214 son licencia de juego')),
    aquea: f(SIN_F, h('Polibio 2.41 y 2.43', 'por cotejar', 'anacronismo para 280; histórica hacia 243-146')),
    siracusa: f(SIN_F, h('', 'licencia de juego', 'no estaba unificada en 280')),
    galos: f(SIN_F, h('Polibio 2.17 y 2.22-23', 'por cotejar', 'el ataque desde 270 es licencia de juego')),
    etruscos: f(SIN_F, h('Livio 5.1', 'licencia de juego', 'eran ciudades-Estado federadas, no una nación')),
    campanos: f(SIN_F, h('Polibio 1.7; Livio 8.14', 'licencia de juego', 'Capua y Messana comparten facción por comodidad')),
    iberos: f(SIN_F, SIN_H),
    griegos: f(SIN_F, h('Estrabón 3.4.8', 'licencia de juego', 'colonos griegos de Emporion')),
    mamertinos: f(SIN_F, h('Polibio 1.7-8', 'por cotejar', 'mercenarios campanos de Agatocles que tomaron Messana')),
    akragas: f(SIN_F, h('Diodoro 22.8; Polibio 1.17-19', 'licencia de juego', 'una sola facción para una ciudad griega independiente'))
  };

  // ---- Mejoras de herrería (D.FORJA). Sin modelo; la herrería tampoco dibuja nada ----
  const SIN_M = { sin: 'sin modelo: solo un icono' };
  const mejora = { armas: f(SIN_M, SIN_H), armaduras: f(SIN_M, SIN_H) };

  // ---- Tipos de ciudad (D.TIPOS). Licencia de juego: nadie «elegía» su oficio así. Sin modelo ----
  const SIN_T = { sin: 'sin modelo: solo un icono' };
  const T_H = h('Livio 27.9-10; Gelio 16.13', 'licencia de juego', 'colonia y municipium eran estatus jurídicos (Livio 27.9-10 sobre las colonias latinas; Gelio 16.13 sobre municipios y colonias); emporion es el término griego para puerto de comercio; el reparto de oficios es invención del juego');
  const tipo = { municipio: f(SIN_T, T_H), agraria: f(SIN_T, T_H), militar: f(SIN_T, T_H), emporio: f(SIN_T, T_H), naval: f(SIN_T, T_H), saber: f(SIN_T, T_H) };

  R.fichas = { edificio, tropa, ciudad, hecho, faccion, mejora, tipo };

  /* De qué tabla de data.js sale cada tipo y qué campos son obligatorios allí (lo usa el juez).
     numericos: números sueltos · mapas: objetos de números (costes, guarnición) · textos: cadenas · segunClase: extra según cls. */
  R.tipos = {
    edificio: { tabla: 'BUILD', numericos: ['time'], mapas: ['cost'], textos: ['n', 'd'] },
    tropa: { tabla: 'UNITS', numericos: ['atk', 'def', 'spd', 'mor', 'up'], textos: ['n', 'cls'], segunClase: { rng: ['ratk', 'range'] } },
    ciudad: { tabla: 'CITIES', numericos: ['lon', 'lat', 'w', 'wl'], mapas: ['g'], textos: ['n', 'f'] },
    hecho: { tabla: 'EVENTS', lista: true, numericos: ['y'], textos: ['t', 'x'] },
    faccion: { tabla: 'FACTIONS', numericos: [], textos: ['n', 'col'] },
    mejora: { tabla: 'FORJA', numericos: ['time'], mapas: ['cost'], textos: ['n', 'ef'] },
    tipo: { tabla: 'TIPOS', numericos: [], textos: ['n', 'i', 'd'] }
  };

  /* Ficha de una pieza. Para un hecho vale el id completo ('277-pirro') o solo el año (277). */
  R.de = function (tipo, id) {
    const t = R.fichas[tipo]; if (!t) return null;
    if (t[id]) return t[id];
    if (tipo === 'hecho') { const k = Object.keys(t).find(x => x.split('-')[0] === String(id)); return k ? t[k] : null; }
    return null;
  };

  /* Fichas vacías para copiar y rellenar al añadir contenido nuevo. */
  const ARTE_TROPA = { modelo: 'assets/units/<id>.bin', licencia: 'CC BY-SA 3.0', credito: 'Wildfire Games (0 A.D.)' };   // o { sin: '<motivo>' }; añade provisional: true si el modelo es prestado
  R.plantillas = {
    ciudad: { arte: { sin: 'sin modelo propio: usa la escena común de la ciudad (city3d.js)' }, historia: { fuente: '<autor antiguo y pasaje, p. ej. Polibio 1.7-11>', dictamen: 'por cotejar' } },
    tropa: { arte: ARTE_TROPA, historia: { fuente: '<autor antiguo y pasaje>', dictamen: 'por cotejar' } },
    edificio: { arte: { modelo: 'assets/static/<id>.bin', licencia: 'CC BY-SA 3.0', credito: 'Wildfire Games (0 A.D.)' }, historia: { fuente: '<autor antiguo y pasaje>', dictamen: 'por cotejar' } },
    hecho: { arte: { sin: 'un hecho no tiene modelo 3D' }, historia: { fuente: '<autor antiguo y pasaje>', dictamen: 'por cotejar' } }   // el id es «<año>-<clave>»; el año casa con D.EVENTS
  };

  root.REGISTRO = R;
  if (typeof module !== 'undefined') module.exports = R;
})(typeof window !== 'undefined' ? window : globalThis);
