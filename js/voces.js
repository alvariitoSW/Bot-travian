/* AQVILA — SON1-b: las voces de los soldados (lógica pura, también en Node; no toca la pantalla ni el audio).
   Cada frase: { id, ev (situación), quien (centurion | optio | soldado | enemigo), lat (lo que se dice), es (traducción; vacía en el enemigo,
   donde lat es una descripción entre paréntesis de lo que se oye), grupo (sonido del banco que la acompaña), peso, fuente | licencia: 'juego' }.
   Voces.elige(situacion, estado, rng) devuelve una frase o null: no repite la última ni las recientes de esa situación, guarda una pausa
   mínima entre frases (más corta cuanto más tensión) y habla más a menudo cuanto más tensión.
   Dictamen histórico: gobierno/historia/SON1-voces.md. Lo atestiguado lleva su fuente; lo demás va marcado licencia: 'juego'. */
(function (raiz) {
  'use strict';
  const GRUPOS = ['grito', 'clamor', 'esfuerzo', 'herido', 'coro', 'cuerno', 'orden', 'aclamacion', 'panico', 'canto', 'quejido'];
  /* si un grupo no está en el banco, se cae al más parecido que sí esté */
  const CAIDA = { orden: ['grito', 'clamor'], aclamacion: ['clamor', 'coro', 'grito'], panico: ['grito', 'herido'], canto: ['coro', 'clamor'], quejido: ['herido', 'esfuerzo'], grito: ['clamor', 'esfuerzo'], clamor: ['grito', 'coro'], esfuerzo: ['herido'], herido: ['esfuerzo'], coro: ['clamor'], cuerno: [] };
  const NOMBRE = { centurion: 'Centurión', optio: 'Optio', soldado: 'Soldado', enemigo: 'Se oye' };
  const SITUACIONES = ['espera', 'pila', 'choque', 'empujar', 'aguantar', 'carga-enemiga', 'elefantes', 'caballeria', 'flanco', 'cansancio', 'flaquea', 'roto-propio', 'roto-enemigo', 'enemigo-cede', 'relevo', 'victoria', 'derrota', 'lucha'];
  /* estas se dicen siempre (con solo 1,2 s de pausa): cambian la batalla */
  const URGENTES = ['victoria', 'derrota', 'elefantes', 'roto-propio', 'roto-enemigo', 'flanco'];

  /* [situación, quién, latín o descripción, traducción, grupo, peso, fuente (o '' = licencia de juego)] */
  const T = [
    // ---- despliegue y espera: tensa, contenida
    ['espera', 'centurion', 'Tenete ordines!', '¡Mantened las filas!', 'orden', 3, ''],
    ['espera', 'centurion', 'Silentium in acie!', '¡Silencio en la formación!', 'orden', 2, ''],
    ['espera', 'centurion', 'Signifer, statue signum! Hic manebimus optime!', '¡Portaestandarte, planta la enseña! ¡Aquí estaremos muy bien!', 'orden', 1, 'Livio 5.55.1 (frase de un centurión en 390 a.C., anterior a la época; probable)'],
    ['espera', 'optio', 'Servate ordinem, milites.', 'Guardad vuestro puesto, soldados.', 'orden', 2, ''],
    ['espera', 'optio', 'Scuta parata! Pila in manu!', '¡Escudos listos! ¡Los pila en la mano!', 'orden', 2, ''],
    ['espera', 'soldado', 'Fortes fortuna adiuvat.', 'A los valientes los ayuda la fortuna.', 'esfuerzo', 2, 'Terencio, Formión 203 (161 a.C.; proverbio)'],
    ['espera', 'soldado', 'Iuppiter, adiuva nos.', 'Júpiter, ayúdanos.', 'esfuerzo', 2, ''],
    ['espera', 'soldado', 'Veniunt. Exspectemus.', 'Vienen. Esperemos.', 'esfuerzo', 2, ''],
    ['espera', 'soldado', 'Mars pater, tecum sumus.', 'Padre Marte, estamos contigo.', 'esfuerzo', 1, ''],
    ['espera', 'enemigo', '(Al otro lado suenan cuernos y gritos que no entiendes)', '', 'canto', 2, 'Polibio, Historias 2.29 (cuernos y trompas galos; probable)'],
    ['espera', 'enemigo', '(Un canto grave y un golpeteo de armas en la otra línea)', '', 'canto', 2, ''],
    // ---- primeras jabalinas y pila
    ['pila', 'centurion', 'Pila! Mittite!', '¡Los pila! ¡Lanzad!', 'orden', 3, ''],
    ['pila', 'optio', 'Scuta alte!', '¡Escudos en alto!', 'orden', 3, ''],
    ['pila', 'soldado', 'Cavete pila!', '¡Cuidado con las jabalinas!', 'grito', 2, ''],
    ['pila', 'soldado', 'Sub scuta!', '¡Bajo el escudo!', 'grito', 2, ''],
    ['pila', 'soldado', 'Iaculate! Iaculate!', '¡Tirad! ¡Tirad!', 'grito', 2, ''],
    ['pila', 'enemigo', '(Una lluvia de dardos silba desde su línea)', '', 'grito', 2, ''],
    // ---- el choque
    ['choque', 'centurion', 'Signa inferte!', '¡Adelante las enseñas!', 'orden', 3, 'Livio, passim («signa inferre»; probable)'],
    ['choque', 'centurion', 'Iungite scuta!', '¡Juntad los escudos!', 'orden', 2, ''],
    ['choque', 'optio', 'Ferite! Ferite!', '¡Golpead! ¡Golpead!', 'orden', 2, ''],
    ['choque', 'soldado', 'Gladio! Gladio!', '¡Con la espada! ¡Con la espada!', 'esfuerzo', 2, ''],
    ['choque', 'soldado', 'Pro Roma!', '¡Por Roma!', 'grito', 2, ''],
    ['choque', 'soldado', 'Ad arma!', '¡A las armas!', 'grito', 1, 'Livio, passim («ad arma conclamatur»)'],
    ['choque', 'enemigo', '(Rugidos y un golpeteo furioso de armas contra los escudos)', '', 'clamor', 3, ''],
    ['choque', 'enemigo', '(Un aullido largo recorre su línea)', '', 'clamor', 2, ''],
    // ---- empujar
    ['empujar', 'centurion', 'Urgete! Urgete!', '¡Apretad! ¡Apretad!', 'orden', 3, ''],
    ['empujar', 'centurion', 'Pro Roma! Impetum facite!', '¡Por Roma! ¡Cargad!', 'grito', 2, 'Livio y César, passim («impetum facere»; la frase es del juego)'],
    ['empujar', 'optio', 'Premite, premite!', '¡Empujad, empujad!', 'orden', 2, ''],
    ['empujar', 'soldado', 'Heia! Heia!', '¡Ea! ¡Ea!', 'esfuerzo', 2, 'Plauto (interjección atestiguada; probable)'],
    ['empujar', 'soldado', 'Impellite!', '¡Empujad!', 'esfuerzo', 2, ''],
    // ---- aguantar
    ['aguantar', 'centurion', 'State, milites!', '¡Firmes, soldados!', 'orden', 3, ''],
    ['aguantar', 'optio', 'Scuta iuncta!', '¡Escudos juntos!', 'orden', 2, ''],
    ['aguantar', 'soldado', 'Hic manebimus.', 'De aquí no nos movemos.', 'esfuerzo', 2, ''],
    ['aguantar', 'soldado', 'Tenete! Tenete!', '¡Aguantad! ¡Aguantad!', 'esfuerzo', 2, ''],
    // ---- carga enemiga
    ['carga-enemiga', 'centurion', 'Excipite impetum!', '¡Recibid la carga!', 'orden', 3, ''],
    ['carga-enemiga', 'optio', 'Hostes veniunt! Parati!', '¡Vienen! ¡Preparados!', 'orden', 3, ''],
    ['carga-enemiga', 'soldado', 'Ecce, ruunt!', '¡Ahí vienen, se lanzan!', 'grito', 2, ''],
    ['carga-enemiga', 'enemigo', '(Se lanzan a la carga entre gritos y pisadas)', '', 'clamor', 3, ''],
    ['carga-enemiga', 'enemigo', '(Los galos aúllan y hacen sonar sus cuernos)', '', 'clamor', 2, 'Polibio, Historias 2.29 (los galos en Telamón, 225 a.C.)'],
    ['carga-enemiga', 'enemigo', '(Cada pueblo grita en su lengua; no se oye un solo grito)', '', 'clamor', 1, 'Polibio, Historias 15.12 y Livio 30.34 (Zama, 202 a.C.: los romanos a una sola voz, los cartagineses dispares)'],
    // ---- elefantes
    ['elefantes', 'centurion', 'Intervalla aperite!', '¡Abrid los pasillos!', 'orden', 3, 'Táctica de Zama: Polibio 15.9 y Livio 30.33 (la frase es del juego)'],
    ['elefantes', 'soldado', 'Boves Lucae!', '¡Bueyes de Lucania!', 'grito', 2, 'Plinio, Historia Natural 8.16 (así llamaron a los elefantes de Pirro en 280 a.C.)'],
    ['elefantes', 'soldado', 'Elephanti! Cedite!', '¡Elefantes! ¡Apartaos!', 'grito', 2, ''],
    ['elefantes', 'optio', 'Pila in bestias!', '¡Los pila contra las bestias!', 'orden', 2, ''],
    ['elefantes', 'enemigo', '(Un barrito ensordecedor hace temblar el suelo)', '', 'grito', 3, ''],
    ['elefantes', 'enemigo', '(Los cornacas azuzan a las bestias en una lengua extraña)', '', 'clamor', 1, ''],
    // ---- caballería (la nuestra y la del enemigo)
    ['caballeria', 'optio', 'Equites! Equites in latere!', '¡Jinetes! ¡Jinetes al flanco!', 'orden', 3, ''],
    ['caballeria', 'centurion', 'Equites, ite!', '¡Jinetes, adelante!', 'orden', 2, ''],
    ['caballeria', 'soldado', 'Nostri equites veniunt!', '¡Llegan nuestros jinetes!', 'grito', 2, ''],
    ['caballeria', 'soldado', 'Equites hostium!', '¡La caballería enemiga!', 'grito', 2, ''],
    ['caballeria', 'enemigo', '(Jinetes sin silla ni brida gritan y revolotean por el flanco)', '', 'grito', 2, 'Livio 21.46 y 35.11 (los númidas montan sin brida; probable, pasaje por cotejar)'],
    // ---- flanco envuelto
    ['flanco', 'soldado', 'Circumvenimur!', '¡Nos rodean!', 'grito', 3, 'Livio, passim («circumveniri»)'],
    ['flanco', 'centurion', 'Latus tuemini!', '¡Cubrid el flanco!', 'orden', 3, ''],
    ['flanco', 'optio', 'Conversi! Orbem facite!', '¡Volveos! ¡Formad el círculo!', 'orden', 2, ''],
    ['flanco', 'soldado', 'A tergo! A tergo!', '¡Por la espalda!', 'grito', 2, ''],
    // ---- cansancio
    ['cansancio', 'optio', 'Durate, milites! Paulum adhuc!', '¡Resistid, soldados! ¡Un poco más!', 'orden', 3, ''],
    ['cansancio', 'soldado', 'Lassus sum...', 'Estoy agotado...', 'quejido', 2, ''],
    ['cansancio', 'soldado', 'Brachia mihi gravia sunt.', 'Los brazos me pesan.', 'quejido', 2, ''],
    ['cansancio', 'soldado', 'Aquam! Aquam!', '¡Agua! ¡Agua!', 'quejido', 1, ''],
    // ---- un cuerpo que flaquea
    ['flaquea', 'soldado', 'Non possumus!', '¡No podemos más!', 'quejido', 3, ''],
    ['flaquea', 'soldado', 'Cedimus!', '¡Cedemos!', 'quejido', 2, ''],
    ['flaquea', 'centurion', 'Nolite cedere! Retro nemo!', '¡No cedáis! ¡Nadie atrás!', 'orden', 3, ''],
    ['flaquea', 'centurion', 'Res ad triarios rediit!', '¡Hemos llegado a los triarios!', 'orden', 1, 'Livio 8.8.11 (proverbio sobre la última línea)'],
    ['flaquea', 'optio', 'Ordines! Ordines servate!', '¡Las filas! ¡Guardad las filas!', 'orden', 2, ''],
    // ---- un cuerpo propio se rompe
    ['roto-propio', 'soldado', 'Fugite! Fugite!', '¡Huid! ¡Huid!', 'panico', 3, ''],
    ['roto-propio', 'soldado', 'Perdita res est!', '¡Todo está perdido!', 'panico', 2, ''],
    ['roto-propio', 'soldado', 'Di immortales!', '¡Dioses inmortales!', 'panico', 2, 'Terencio (exclamación de la época; probable)'],
    ['roto-propio', 'centurion', 'Subsistite! Subsistite!', '¡Deteneos! ¡Deteneos!', 'orden', 3, 'Livio, passim («subsistere»; probable)'],
    // ---- un cuerpo enemigo se rompe
    ['roto-enemigo', 'soldado', 'Fugiunt! Fugiunt!', '¡Huyen! ¡Huyen!', 'grito', 3, 'Livio, passim'],
    ['roto-enemigo', 'soldado', 'Terga dant!', '¡Dan la espalda!', 'grito', 2, 'Livio y César («terga dare»; probable)'],
    ['roto-enemigo', 'centurion', 'Instate! Insequimini!', '¡Apretad! ¡Perseguidlos!', 'orden', 2, ''],
    ['roto-enemigo', 'enemigo', '(Gritos de pánico y armas tiradas al suelo)', '', 'panico', 3, ''],
    // ---- el enemigo cede
    ['enemigo-cede', 'soldado', 'Cedunt! Premite!', '¡Ceden! ¡Apretad!', 'aclamacion', 3, ''],
    ['enemigo-cede', 'centurion', 'Nunc! Nunc! Urgete!', '¡Ahora! ¡Ahora! ¡Apretad!', 'orden', 3, ''],
    ['enemigo-cede', 'optio', 'Ordines servate! Ne sequamini temere!', '¡Guardad las filas! ¡No persigáis sin orden!', 'orden', 2, ''],
    ['enemigo-cede', 'enemigo', '(Su línea se agrieta entre gritos de aviso)', '', 'grito', 2, ''],
    // ---- relevo
    ['relevo', 'centurion', 'Hastati, recedite! Principes, procedite!', '¡Hastati, retiraos! ¡Príncipes, adelante!', 'orden', 3, 'Livio 8.8 y Polibio 15.9 (el relevo de líneas; la frase es del juego)'],
    ['relevo', 'optio', 'Acies secunda, procede!', '¡Segunda línea, adelante!', 'orden', 2, ''],
    ['relevo', 'soldado', 'Succedimus vobis!', '¡Os relevamos!', 'grito', 2, ''],
    ['relevo', 'soldado', 'Res ad triarios rediit!', '¡Hemos llegado a los triarios!', 'grito', 1, 'Livio 8.8.11 (proverbio)'],
    // ---- victoria y derrota
    ['victoria', 'centurion', 'Vicimus!', '¡Hemos vencido!', 'aclamacion', 3, ''],
    ['victoria', 'soldado', 'Io triumphe!', '¡Viva el triunfo!', 'aclamacion', 3, 'Livio (libro 45) y Plutarco, Paulo Emilio (el grito del triunfo; probable)'],
    ['victoria', 'soldado', 'Roma! Roma!', '¡Roma! ¡Roma!', 'aclamacion', 2, ''],
    ['victoria', 'centurion', 'Gratias tibi, Mars pater!', 'Gracias, padre Marte.', 'aclamacion', 2, ''],
    ['derrota', 'centurion', 'Recedite! Servate quos potestis!', '¡Retiraos! ¡Salvad a los que podáis!', 'orden', 3, ''],
    ['derrota', 'soldado', 'Di, miseremini nostri!', '¡Dioses, apiadaos de nosotros!', 'quejido', 2, ''],
    ['derrota', 'soldado', 'Perdidimus...', 'Hemos perdido...', 'quejido', 2, ''],
    ['derrota', 'enemigo', '(El enemigo aúlla de triunfo sobre el campo)', '', 'clamor', 3, ''],
    // ---- charla suelta en plena lucha (jadeos y ánimos entre golpes)
    ['lucha', 'soldado', 'Sta! Sta!', '¡Aguanta! ¡Aguanta!', 'esfuerzo', 2, ''],
    ['lucha', 'soldado', 'Frater, tege me!', '¡Hermano, cúbreme!', 'grito', 2, ''],
    ['lucha', 'optio', 'Ne rumpite ordines!', '¡No rompáis las filas!', 'orden', 2, ''],
    ['lucha', 'enemigo', '(Entre el estruendo se oyen voces que animan en otra lengua)', '', 'canto', 1, ''],
  ];
  const FRASES = T.map((f, k) => {
    const o = { id: f[0] + '-' + (k + 1), ev: f[0], quien: f[1], lat: f[2], es: f[3], grupo: f[4], peso: f[5] };
    if (f[6]) o.fuente = f[6]; else o.licencia = 'juego';
    return o;
  });
  const POR = {}; for (const f of FRASES) (POR[f.ev] = POR[f.ev] || []).push(f);

  /* el estado de las voces de una batalla: t = segundos de batalla (lo pone quien llama), tension 0..1 */
  const nuevo = () => ({ t: 0, tension: 0.3, ultimaId: '', tUlt: -99, tCharla: 9, recientes: {} });
  const pausaMin = ten => 5 - 3 * Math.max(0, Math.min(1, ten === undefined ? 0.3 : ten));   // 5 s en calma, 2 s al máximo

  function elige(situacion, estado, rng) {
    const lista = POR[situacion]; if (!lista || !estado) return null;
    rng = rng || Math.random;
    const ten = Math.max(0, Math.min(1, estado.tension === undefined ? 0.3 : estado.tension)), t = estado.t || 0;
    const urgente = URGENTES.includes(situacion);
    // charla suelta (espera o lucha): su propio reloj, de 8 a 15 s (algo menos con tensión)
    if (situacion === 'espera' || situacion === 'lucha') {
      if (t < (estado.tCharla || 0)) return null;
      estado.tCharla = t + (8 + 7 * rng()) * (1 - 0.25 * ten);
    }
    if (t - estado.tUlt < (urgente ? 1.2 : pausaMin(ten))) return null;
    if (!urgente && situacion !== 'espera' && situacion !== 'lucha' && rng() > 0.45 + 0.5 * ten) return null;
    const rec = estado.recientes[situacion] = estado.recientes[situacion] || [];
    let cand = lista.filter(f => f.id !== estado.ultimaId && !rec.includes(f.id));
    if (!cand.length) cand = lista.filter(f => f.id !== estado.ultimaId);
    if (!cand.length) return null;
    // con poca tensión, menos enemigo; con mucha, más
    const pesa = f => f.peso * (f.quien === 'enemigo' ? 0.5 + ten : 1);
    let tot = 0; for (const f of cand) tot += pesa(f);
    let r = rng() * tot, f = cand[cand.length - 1];
    for (const c of cand) { r -= pesa(c); if (r < 0) { f = c; break; } }
    estado.ultimaId = f.id; estado.tUlt = t; rec.push(f.id); while (rec.length > Math.min(4, lista.length - 1)) rec.shift();
    return f;
  }

  /* qué situación es un evento de js/guerra.js (null si no habla nadie) */
  function deEvento(e) {
    if (!e) return null;
    switch (e.tipo) {
      case 'orden': return e.orden === 'empujar' || e.orden === 'avanzar' ? 'empujar' : e.orden === 'aguantar' || e.orden === 'escudos' || e.orden === 'testudo' ? 'aguantar' : null;
      case 'pila': case 'lluvia': return 'pila';
      case 'choque': case 'testudo-roto': return 'choque';
      case 'carga-enemiga': return e.tropa === 'elefantes' ? 'elefantes' : e.tropa === 'equites' || e.tropa === 'numidas' ? 'caballeria' : 'carga-enemiga';
      case 'elefantes-desbocados': return 'elefantes';
      case 'caballeria': case 'numidas-aviso': return 'caballeria';
      case 'envuelve': return e.lado === 1 ? 'flanco' : 'enemigo-cede';
      case 'linea-deshecha': return 'flaquea';
      case 'cansados': return 'cansancio';
      case 'roto': return e.lado === 0 ? 'roto-propio' : 'roto-enemigo';
      case 'enemigo-cede': case 'impacto': return 'enemigo-cede';
      case 'relevo': return 'relevo';
      default: return null;
    }
  }
  const rotulo = f => f ? NOMBRE[f.quien] + ': ' + f.lat + (f.es ? ' — ' + f.es : '') : '';
  /* el primer grupo del banco que exista (g, o su sustituto); null si ninguno. tiene(g) → bool */
  function grupoDisponible(g, tiene) {
    if (tiene(g)) return g;
    for (const h of CAIDA[g] || []) if (tiene(h)) return h;
    return null;
  }

  const Voces = { FRASES, GRUPOS, SITUACIONES, URGENTES, NOMBRE, CAIDA, nuevo, elige, deEvento, rotulo, grupoDisponible, pausaMin };
  raiz.Voces = Voces;
  if (typeof module !== 'undefined' && module.exports) module.exports = Voces;
})(typeof window !== 'undefined' ? window : globalThis);
