/* AQVILA — SON1-b: las voces de los soldados (lógica pura, también en Node; no toca la pantalla ni el audio).
   Cada frase: { id, ev (situación), quien (centurion | optio | soldado | enemigo), lat (lo que se dice), es (traducción; vacía en el enemigo,
   donde lat es una descripción entre paréntesis de lo que se oye), grupo (sonido del banco que la acompaña), peso, pron (SON2: pronunciación para la voz grabada de assets/voces/<id>.mp3), fuente | licencia: 'juego' }.
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

  /* [situación, quién, latín o descripción, traducción, grupo, peso, fuente (o '' = licencia de juego), pron (solo romanos: cómo se lee con voz española; c y g duras, v = b entre vocales, ae = ai)] */
  const T = [
    // ---- despliegue y espera: tensa, contenida
    ['espera', 'centurion', 'Tenete ordines!', '¡Mantened las filas!', 'orden', 3, '', '¡Tenéte órdines!'],
    ['espera', 'centurion', 'Silentium in acie!', '¡Silencio en la formación!', 'orden', 2, '', '¡Siléntium in ákie!'],
    ['espera', 'centurion', 'Signifer, statue signum! Hic manebimus optime!', '¡Portaestandarte, planta la enseña! ¡Aquí estaremos muy bien!', 'orden', 1, 'Livio 5.55.1 (frase de un centurión en 390 a.C., anterior a la época; probable)', '¡Sígnifer, státue sígnum! ¡Ik manébimus óptime!'],
    ['espera', 'optio', 'Servate ordinem, milites.', 'Guardad vuestro puesto, soldados.', 'orden', 2, '', 'Serbáte órdinem, mílites.'],
    ['espera', 'optio', 'Scuta parata! Pila in manu!', '¡Escudos listos! ¡Los pila en la mano!', 'orden', 2, '', '¡Skúta paráta! ¡Píla in mánu!'],
    ['espera', 'soldado', 'Fortes fortuna adiuvat.', 'A los valientes los ayuda la fortuna.', 'esfuerzo', 2, 'Terencio, Formión 203 (161 a.C.; proverbio)', 'Fórtes fortúna adiúbat.'],
    ['espera', 'soldado', 'Iuppiter, adiuva nos.', 'Júpiter, ayúdanos.', 'esfuerzo', 2, '', 'Yúpiter, adiúba nos.'],
    ['espera', 'soldado', 'Veniunt. Exspectemus.', 'Vienen. Esperemos.', 'esfuerzo', 2, '', 'Uéniunt. Ekspektémus.'],
    ['espera', 'soldado', 'Mars pater, tecum sumus.', 'Padre Marte, estamos contigo.', 'esfuerzo', 1, '', 'Mars páter, tékum súmus.'],
    ['espera', 'enemigo', '(Al otro lado suenan cuernos y gritos que no entiendes)', '', 'canto', 2, 'Polibio, Historias 2.29 (cuernos y trompas galos; probable)'],
    ['espera', 'enemigo', '(Un canto grave y un golpeteo de armas en la otra línea)', '', 'canto', 2, ''],
    // ---- primeras jabalinas y pila
    ['pila', 'centurion', 'Pila! Mittite!', '¡Los pila! ¡Lanzad!', 'orden', 3, '', '¡Píla! ¡Mítite!'],
    ['pila', 'optio', 'Scuta alte!', '¡Escudos en alto!', 'orden', 3, '', '¡Skúta álte!'],
    ['pila', 'soldado', 'Cavete pila!', '¡Cuidado con las jabalinas!', 'grito', 2, '', '¡Kabéte píla!'],
    ['pila', 'soldado', 'Sub scuta!', '¡Bajo el escudo!', 'grito', 2, '', '¡Sub skúta!'],
    ['pila', 'soldado', 'Iaculate! Iaculate!', '¡Tirad! ¡Tirad!', 'grito', 2, '', '¡Yakuláte! ¡Yakuláte!'],
    ['pila', 'enemigo', '(Una lluvia de dardos silba desde su línea)', '', 'grito', 2, ''],
    // ---- el choque
    ['choque', 'centurion', 'Signa inferte!', '¡Adelante las enseñas!', 'orden', 3, 'Livio, passim («signa inferre»; probable)', '¡Sígna inférte!'],
    ['choque', 'centurion', 'Iungite scuta!', '¡Juntad los escudos!', 'orden', 2, '', '¡Yúnguite skúta!'],
    ['choque', 'optio', 'Ferite! Ferite!', '¡Golpead! ¡Golpead!', 'orden', 2, '', '¡Feríte! ¡Feríte!'],
    ['choque', 'soldado', 'Gladio! Gladio!', '¡Con la espada! ¡Con la espada!', 'esfuerzo', 2, '', '¡Gládio! ¡Gládio!'],
    ['choque', 'soldado', 'Pro Roma!', '¡Por Roma!', 'grito', 2, '', '¡Pro Róma!'],
    ['choque', 'soldado', 'Ad arma!', '¡A las armas!', 'grito', 1, 'Livio, passim («ad arma conclamatur»)', '¡Ad árma!'],
    ['choque', 'enemigo', '(Rugidos y un golpeteo furioso de armas contra los escudos)', '', 'clamor', 3, ''],
    ['choque', 'enemigo', '(Un aullido largo recorre su línea)', '', 'clamor', 2, ''],
    // ---- empujar
    ['empujar', 'centurion', 'Urgete! Urgete!', '¡Apretad! ¡Apretad!', 'orden', 3, '', '¡Urguéte! ¡Urguéte!'],
    ['empujar', 'centurion', 'Pro Roma! Impetum facite!', '¡Por Roma! ¡Cargad!', 'grito', 2, 'Livio y César, passim («impetum facere»; la frase es del juego)', '¡Pro Róma! ¡Ímpetum fákite!'],
    ['empujar', 'optio', 'Premite, premite!', '¡Empujad, empujad!', 'orden', 2, '', '¡Prémite, prémite!'],
    ['empujar', 'soldado', 'Heia! Heia!', '¡Ea! ¡Ea!', 'esfuerzo', 2, 'Plauto (interjección atestiguada; probable)', '¡Éya! ¡Éya!'],
    ['empujar', 'soldado', 'Impellite!', '¡Empujad!', 'esfuerzo', 2, '', '¡Impelíte!'],
    // ---- aguantar
    ['aguantar', 'centurion', 'State, milites!', '¡Firmes, soldados!', 'orden', 3, '', '¡Státe, mílites!'],
    ['aguantar', 'optio', 'Scuta iuncta!', '¡Escudos juntos!', 'orden', 2, '', '¡Skúta yúnkta!'],
    ['aguantar', 'soldado', 'Hic manebimus.', 'De aquí no nos movemos.', 'esfuerzo', 2, '', 'Ik manébimus.'],
    ['aguantar', 'soldado', 'Tenete! Tenete!', '¡Aguantad! ¡Aguantad!', 'esfuerzo', 2, '', '¡Tenéte! ¡Tenéte!'],
    // ---- carga enemiga
    ['carga-enemiga', 'centurion', 'Excipite impetum!', '¡Recibid la carga!', 'orden', 3, '', '¡Ékskipite ímpetum!'],
    ['carga-enemiga', 'optio', 'Hostes veniunt! Parati!', '¡Vienen! ¡Preparados!', 'orden', 3, '', '¡Óstes uéniunt! ¡Paráti!'],
    ['carga-enemiga', 'soldado', 'Ecce, ruunt!', '¡Ahí vienen, se lanzan!', 'grito', 2, '', '¡Ékke, rúunt!'],
    ['carga-enemiga', 'enemigo', '(Se lanzan a la carga entre gritos y pisadas)', '', 'clamor', 3, ''],
    ['carga-enemiga', 'enemigo', '(Los galos aúllan y hacen sonar sus cuernos)', '', 'clamor', 2, 'Polibio, Historias 2.29 (los galos en Telamón, 225 a.C.)'],
    ['carga-enemiga', 'enemigo', '(Cada pueblo grita en su lengua; no se oye un solo grito)', '', 'clamor', 1, 'Polibio, Historias 15.12 y Livio 30.34 (Zama, 202 a.C.: los romanos a una sola voz, los cartagineses dispares)'],
    // ---- elefantes
    ['elefantes', 'centurion', 'Intervalla aperite!', '¡Abrid los pasillos!', 'orden', 3, 'Táctica de Zama: Polibio 15.9 y Livio 30.33 (la frase es del juego)', '¡Interbála aperíte!'],
    ['elefantes', 'soldado', 'Boves Lucae!', '¡Bueyes de Lucania!', 'grito', 2, 'Plinio, Historia Natural 8.16 (así llamaron a los elefantes de Pirro en 280 a.C.)', '¡Bóbes Lúkai!'],
    ['elefantes', 'soldado', 'Elephanti! Cedite!', '¡Elefantes! ¡Apartaos!', 'grito', 2, '', '¡Elefánti! ¡Kédite!'],
    ['elefantes', 'optio', 'Pila in bestias!', '¡Los pila contra las bestias!', 'orden', 2, '', '¡Píla in béstias!'],
    ['elefantes', 'enemigo', '(Un barrito ensordecedor hace temblar el suelo)', '', 'grito', 3, ''],
    ['elefantes', 'enemigo', '(Los cornacas azuzan a las bestias en una lengua extraña)', '', 'clamor', 1, ''],
    // ---- caballería (la nuestra y la del enemigo)
    ['caballeria', 'optio', 'Equites! Equites in latere!', '¡Jinetes! ¡Jinetes al flanco!', 'orden', 3, '', '¡Ékuites! ¡Ékuites in látere!'],
    ['caballeria', 'centurion', 'Equites, ite!', '¡Jinetes, adelante!', 'orden', 2, '', '¡Ékuites, íte!'],
    ['caballeria', 'soldado', 'Nostri equites veniunt!', '¡Llegan nuestros jinetes!', 'grito', 2, '', '¡Nóstri ékuites uéniunt!'],
    ['caballeria', 'soldado', 'Equites hostium!', '¡La caballería enemiga!', 'grito', 2, '', '¡Ékuites óstium!'],
    ['caballeria', 'enemigo', '(Jinetes sin silla ni brida gritan y revolotean por el flanco)', '', 'grito', 2, 'Livio 21.46 y 35.11 (los númidas montan sin brida; probable, pasaje por cotejar)'],
    // ---- flanco envuelto
    ['flanco', 'soldado', 'Circumvenimur!', '¡Nos rodean!', 'grito', 3, 'Livio, passim («circumveniri»)', '¡Kirkumbenímur!'],
    ['flanco', 'centurion', 'Latus tuemini!', '¡Cubrid el flanco!', 'orden', 3, '', '¡Látus tuémini!'],
    ['flanco', 'optio', 'Conversi! Orbem facite!', '¡Volveos! ¡Formad el círculo!', 'orden', 2, '', '¡Konbérsi! ¡Órbem fákite!'],
    ['flanco', 'soldado', 'A tergo! A tergo!', '¡Por la espalda!', 'grito', 2, '', '¡A térgo! ¡A térgo!'],
    // ---- cansancio
    ['cansancio', 'optio', 'Durate, milites! Paulum adhuc!', '¡Resistid, soldados! ¡Un poco más!', 'orden', 3, '', '¡Duráte, mílites! ¡Páulum adúk!'],
    ['cansancio', 'soldado', 'Lassus sum...', 'Estoy agotado...', 'quejido', 2, '', 'Lásus sum...'],
    ['cansancio', 'soldado', 'Brachia mihi gravia sunt.', 'Los brazos me pesan.', 'quejido', 2, '', 'Brákia míi grábia sunt.'],
    ['cansancio', 'soldado', 'Aquam! Aquam!', '¡Agua! ¡Agua!', 'quejido', 1, '', '¡Ákuam! ¡Ákuam!'],
    // ---- un cuerpo que flaquea
    ['flaquea', 'soldado', 'Non possumus!', '¡No podemos más!', 'quejido', 3, '', '¡Non pósumus!'],
    ['flaquea', 'soldado', 'Cedimus!', '¡Cedemos!', 'quejido', 2, '', '¡Kédimus!'],
    ['flaquea', 'centurion', 'Nolite cedere! Retro nemo!', '¡No cedáis! ¡Nadie atrás!', 'orden', 3, '', '¡Nolíte kédere! ¡Rétro némo!'],
    ['flaquea', 'centurion', 'Res ad triarios rediit!', '¡Hemos llegado a los triarios!', 'orden', 1, 'Livio 8.8.11 (proverbio sobre la última línea)', '¡Res ad triários redíit!'],
    ['flaquea', 'optio', 'Ordines! Ordines servate!', '¡Las filas! ¡Guardad las filas!', 'orden', 2, '', '¡Órdines! ¡Órdines serbáte!'],
    // ---- un cuerpo propio se rompe
    ['roto-propio', 'soldado', 'Fugite! Fugite!', '¡Huid! ¡Huid!', 'panico', 3, '', '¡Fúguite! ¡Fúguite!'],
    ['roto-propio', 'soldado', 'Perdita res est!', '¡Todo está perdido!', 'panico', 2, '', '¡Pérdita res est!'],
    ['roto-propio', 'soldado', 'Di immortales!', '¡Dioses inmortales!', 'panico', 2, 'Terencio (exclamación de la época; probable)', '¡Di inmortáles!'],
    ['roto-propio', 'centurion', 'Subsistite! Subsistite!', '¡Deteneos! ¡Deteneos!', 'orden', 3, 'Livio, passim («subsistere»; probable)', '¡Subsístite! ¡Subsístite!'],
    // ---- un cuerpo enemigo se rompe
    ['roto-enemigo', 'soldado', 'Fugiunt! Fugiunt!', '¡Huyen! ¡Huyen!', 'grito', 3, 'Livio, passim', '¡Fúguiunt! ¡Fúguiunt!'],
    ['roto-enemigo', 'soldado', 'Terga dant!', '¡Dan la espalda!', 'grito', 2, 'Livio y César («terga dare»; probable)', '¡Térga dant!'],
    ['roto-enemigo', 'centurion', 'Instate! Insequimini!', '¡Apretad! ¡Perseguidlos!', 'orden', 2, '', '¡Instáte! ¡Insekuímini!'],
    ['roto-enemigo', 'enemigo', '(Gritos de pánico y armas tiradas al suelo)', '', 'panico', 3, ''],
    // ---- el enemigo cede
    ['enemigo-cede', 'soldado', 'Cedunt! Premite!', '¡Ceden! ¡Apretad!', 'aclamacion', 3, '', '¡Kédunt! ¡Prémite!'],
    ['enemigo-cede', 'centurion', 'Nunc! Nunc! Urgete!', '¡Ahora! ¡Ahora! ¡Apretad!', 'orden', 3, '', '¡Nunk! ¡Nunk! ¡Urguéte!'],
    ['enemigo-cede', 'optio', 'Ordines servate! Ne sequamini temere!', '¡Guardad las filas! ¡No persigáis sin orden!', 'orden', 2, '', '¡Órdines serbáte! ¡Ne sekuámini témere!'],
    ['enemigo-cede', 'enemigo', '(Su línea se agrieta entre gritos de aviso)', '', 'grito', 2, ''],
    // ---- relevo
    ['relevo', 'centurion', 'Hastati, recedite! Principes, procedite!', '¡Hastati, retiraos! ¡Príncipes, adelante!', 'orden', 3, 'Livio 8.8 y Polibio 15.9 (el relevo de líneas; la frase es del juego)', '¡Astáti, rekédite! ¡Prínkipes, prokédite!'],
    ['relevo', 'optio', 'Acies secunda, procede!', '¡Segunda línea, adelante!', 'orden', 2, '', '¡Ákies sekúnda, prokéde!'],
    ['relevo', 'soldado', 'Succedimus vobis!', '¡Os relevamos!', 'grito', 2, '', '¡Sukédimus bóbis!'],
    ['relevo', 'soldado', 'Res ad triarios rediit!', '¡Hemos llegado a los triarios!', 'grito', 1, 'Livio 8.8.11 (proverbio)', '¡Res ad triários redíit!'],
    // ---- victoria y derrota
    ['victoria', 'centurion', 'Vicimus!', '¡Hemos vencido!', 'aclamacion', 3, '', '¡Uíkimus!'],
    ['victoria', 'soldado', 'Io triumphe!', '¡Viva el triunfo!', 'aclamacion', 3, 'Livio (libro 45) y Plutarco, Paulo Emilio (el grito del triunfo; probable)', '¡Yo triúnfe!'],
    ['victoria', 'soldado', 'Roma! Roma!', '¡Roma! ¡Roma!', 'aclamacion', 2, '', '¡Róma! ¡Róma!'],
    ['victoria', 'centurion', 'Gratias tibi, Mars pater!', 'Gracias, padre Marte.', 'aclamacion', 2, '', 'Grátias tíbi, Mars páter.'],
    ['derrota', 'centurion', 'Recedite! Servate quos potestis!', '¡Retiraos! ¡Salvad a los que podáis!', 'orden', 3, '', '¡Rekédite! ¡Serbáte kuos potéstis!'],
    ['derrota', 'soldado', 'Di, miseremini nostri!', '¡Dioses, apiadaos de nosotros!', 'quejido', 2, '', '¡Di, miserémini nóstri!'],
    ['derrota', 'soldado', 'Perdidimus...', 'Hemos perdido...', 'quejido', 2, '', 'Perdídimus...'],
    ['derrota', 'enemigo', '(El enemigo aúlla de triunfo sobre el campo)', '', 'clamor', 3, ''],
    // ---- charla suelta en plena lucha (jadeos y ánimos entre golpes)
    ['lucha', 'soldado', 'Sta! Sta!', '¡Aguanta! ¡Aguanta!', 'esfuerzo', 2, '', '¡Sta! ¡Sta!'],
    ['lucha', 'soldado', 'Frater, tege me!', '¡Hermano, cúbreme!', 'grito', 2, '', '¡Fráter, tégue me!'],
    ['lucha', 'optio', 'Ne rumpite ordines!', '¡No rompáis las filas!', 'orden', 2, '', '¡Ne rúmpite órdines!'],
    ['lucha', 'enemigo', '(Entre el estruendo se oyen voces que animan en otra lengua)', '', 'canto', 1, ''],
  ];
  const FRASES = T.map((f, k) => {
    const o = { id: f[0] + '-' + (k + 1), ev: f[0], quien: f[1], lat: f[2], es: f[3], grupo: f[4], peso: f[5] };
    if (f[6]) o.fuente = f[6]; else o.licencia = 'juego';
    if (f[7]) o.pron = f[7];   /* SON2: el latín restituido escrito para la voz española (tools/voces.py lo lee y graba assets/voces/<id>.mp3) */
    return o;
  });
  const POR = {}; for (const f of FRASES) (POR[f.ev] = POR[f.ev] || []).push(f);
  /* ---------- SON5: frases habladas de NUESTRA falange (Falange a pie, Escaramuzas con falange u hoplitas) ----------
     Griego antiguo en transliteración legible: `gr` (escritura griega), `lat` (transliteración latina: es lo que se lee en el subtítulo, p. ej. «Émba!»),
     `es` (traducción) y `pron` (cómo la lee la voz española: pronunciación koiné aproximada; ει y η = i, ω y ο = o, υ = i, θ = z, φ = f, χ = j, ou = u).
     [situación, quién (lochagos = oficial de la falange | falangita), gr, lat, es, grupo, peso, fuente (o '' = licencia de juego), pron] */
  const TG = [
    ['espera', 'lochagos', 'Μένετε ἐν τάξει!', 'Ménete en táxei!', '¡Mantened la formación!', 'orden', 3, '', '¡Ménete en táksi!'],
    ['espera', 'lochagos', 'Σιγή, ἄνδρες!', 'Sigé, ándres!', '¡Silencio, hombres!', 'orden', 2, 'Jenofonte, Anábasis 1.8 (los griegos avanzan callados hasta el peán; pasaje por cotejar; probable)', '¡Sigué, ándres!'],
    ['espera', 'lochagos', 'Σύνθημα: Ζεὺς σωτὴρ καὶ νίκη!', 'Sýnthema: Zeús sotér kai níke!', '¡Contraseña: Zeus Salvador y Victoria!', 'orden', 2, 'Jenofonte, Anábasis 1.8.16 (la contraseña de los griegos en Cunaxa, 401 a.C.)', '¡Súnzema: Zeus sotér kai níke!'],
    ['espera', 'falangita', 'Ζεῦ σῶτερ, βοήθει!', 'Zeú sóter, boéthei!', '¡Zeus Salvador, ayúdanos!', 'esfuerzo', 2, 'Jenofonte, Anábasis 1.8.16 (Zeus Salvador; la frase es del juego; probable)', '¡Zeus sóter, boézi!'],
    ['pila', 'lochagos', 'Ἀκοντίζετε!', 'Akontízete!', '¡Lanzad las jabalinas!', 'orden', 3, '', '¡Akontízete!'],
    ['pila', 'falangita', 'Ὑπὸ τὰς ἀσπίδας!', 'Hypó tas aspídas!', '¡Bajo los escudos!', 'grito', 2, '', '¡Ipó tas aspídas!'],
    ['choque', 'lochagos', 'Ἀσπὶς ἐπ᾽ ἀσπίδι!', 'Aspís ep’ aspídi!', '¡Escudo contra escudo!', 'orden', 3, 'Tirteo, fr. 11 («ἐπ᾽ ἀσπίδος ἀσπίδ᾽ ἐρείσας») y Homero, Ilíada 13.131; la frase es del juego; probable', '¡Aspís ep aspídi!'],
    ['choque', 'falangita', 'Πρόσφερε τὸ δόρυ!', 'Prósfere tó dóry!', '¡Adelanta la lanza!', 'esfuerzo', 2, '', '¡Prósfere to dóri!'],
    ['choque', 'falangita', 'Ἐνυάλιε!', 'Enyálie!', '¡Enialio!', 'grito', 2, 'Jenofonte, Anábasis 1.8.18 y 5.2.14 (el grito a Enialio, sobrenombre de Ares, al cargar; pasaje por cotejar; probable)', '¡Eniálie!'],
    ['empujar', 'lochagos', 'Ἔμβα!', 'Émba!', '¡Adelante!', 'orden', 3, '', '¡Émba!'],
    ['empujar', 'lochagos', 'Ἴτε, ὦ ἄνδρες!', 'Íte, ō ándres!', '¡Adelante, hombres!', 'orden', 3, 'Jenofonte, Anábasis (arengas con «ὦ ἄνδρες»; el imperativo es del juego; probable)', '¡Íte, o ándres!'],
    ['empujar', 'falangita', 'Ὠθεῖτε! Ὠθεῖτε!', 'Ōtheíte! Ōtheíte!', '¡Empujad! ¡Empujad!', 'esfuerzo', 3, 'Tucídides 4.96 (el «ὠθισμός», el empuje de escudos, en Delio, 424 a.C.); probable', '¡Ozíte! ¡Ozíte!'],
    ['aguantar', 'lochagos', 'Μὴ λείπετε τὴν τάξιν!', 'Mē leípete tēn táxin!', '¡No abandonéis vuestro puesto!', 'orden', 3, 'Tirteo, fr. 10–12 (el que deja su puesto en la línea se deshonra); probable', '¡Mi lípete tin táksin!'],
    ['aguantar', 'falangita', 'Μένε, ὦ ἑταῖρε!', 'Méne, ō hetaíre!', '¡Aguanta, compañero!', 'esfuerzo', 2, '', '¡Méne, o etaíre!'],
    ['carga-enemiga', 'lochagos', 'Δέχεσθε τὴν ἔφοδον!', 'Déjesthe tēn éfodon!', '¡Recibid la carga!', 'orden', 3, '', '¡Déjeste tin éfodon!'],
    ['carga-enemiga', 'falangita', 'Οἱ πολέμιοι ἐπέρχονται!', 'Hoi polémioi epérjontai!', '¡Vienen los enemigos!', 'grito', 2, '', '¡Oi polémioi epérjontai!'],
    ['elefantes', 'lochagos', 'Ἐλέφαντες! Διάστητε!', 'Eléfantes! Diástēte!', '¡Elefantes! ¡Abrid paso!', 'orden', 3, 'Plutarco, Pirro 17 (los elefantes de Pirro rompen la falange; la frase es del juego)', '¡Elefántes! ¡Diástite!'],
    ['elefantes', 'falangita', 'Τὰ θηρία!', 'Tá thería!', '¡Las bestias!', 'grito', 2, 'Polibio 5.84 (llama «θηρία» a los elefantes); probable', '¡Ta ziría!'],
    ['caballeria', 'lochagos', 'Ἱππεῖς! Φυλάττεσθε!', 'Hippeís! Fylátesthe!', '¡Jinetes! ¡Cuidado!', 'orden', 3, '', '¡Ipís! ¡Filátese!'],
    ['flanco', 'falangita', 'Κυκλούμεθα!', 'Kykloúmetha!', '¡Nos rodean!', 'grito', 3, 'Jenofonte, Anábasis (el verbo «κυκλοῦσθαι», ser rodeado); probable', '¡Kikloúmeza!'],
    ['flanco', 'lochagos', 'Στρέφεσθε! Φυλάττετε τὸ πλευρόν!', 'Stréfesthe! Fylátete tó pleurón!', '¡Volveos! ¡Cubrid el flanco!', 'orden', 3, '', '¡Stréfeste! ¡Filátete to pleurón!'],
    ['cansancio', 'lochagos', 'Ἀντέχετε, ὦ ἄνδρες!', 'Antéjete, ō ándres!', '¡Resistid, hombres!', 'orden', 3, '', '¡Antéjete, o ándres!'],
    ['flaquea', 'falangita', 'Οὐ δυνάμεθα!', 'U dynámetha!', '¡No podemos más!', 'quejido', 3, '', '¡U dinámeza!'],
    ['flaquea', 'lochagos', 'Μὴ φεύγετε! Μείνατε!', 'Mē feúgete! Meínate!', '¡No huyáis! ¡Quedaos!', 'orden', 3, 'Tirteo, fr. 10–12 (contra la huida); probable', '¡Mi feúguete! ¡Mínate!'],
    ['roto-propio', 'falangita', 'Φεύγωμεν!', 'Feúgōmen!', '¡Huyamos!', 'panico', 3, '', '¡Feúgomen!'],
    ['roto-propio', 'lochagos', 'Ἀναστρέφετε!', 'Anastréfete!', '¡Volveos, dad la cara!', 'orden', 2, '', '¡Anastréfete!'],
    ['roto-enemigo', 'falangita', 'Φεύγουσιν!', 'Feúgusin!', '¡Huyen!', 'grito', 3, '', '¡Feúgusin!'],
    ['roto-enemigo', 'lochagos', 'Διώκετε!', 'Diókete!', '¡Perseguidlos!', 'orden', 2, '', '¡Diókete!'],
    ['enemigo-cede', 'falangita', 'Ἐνδιδόασιν!', 'Endidóasin!', '¡Ceden!', 'aclamacion', 3, '', '¡Endidóasin!'],
    ['enemigo-cede', 'lochagos', 'Ἐπίκεισθε!', 'Epíkeisthe!', '¡Apretad!', 'orden', 3, '', '¡Epíkiste!'],
    ['victoria', 'lochagos', 'Νενικήκαμεν!', 'Nenikékamen!', '¡Hemos vencido!', 'aclamacion', 3, 'Luciano (s. II d.C.) la pone en boca del corredor de Maratón (490 a.C.): fuente tardía, vale como forma griega correcta; probable', '¡Nenikékamen!'],
    ['victoria', 'falangita', 'Νίκη! Νίκη!', 'Níkē! Níkē!', '¡Victoria! ¡Victoria!', 'aclamacion', 3, 'Jenofonte, Anábasis 1.8.16 («Ζεὺς σωτὴρ καὶ νίκη»)', '¡Níke! ¡Níke!'],
    ['derrota', 'lochagos', 'Ἀναχωρεῖτε κατὰ τάξιν!', 'Anajoreíte katá táxin!', '¡Retiraos en orden!', 'orden', 3, 'Jenofonte, Anábasis (la retirada, «ἀναχώρησις»; la frase es del juego); probable', '¡Anajoríte katá táksin!'],
    ['derrota', 'falangita', 'Ὦ θεοί, σῴζετε ἡμᾶς!', 'Ō theoí, sṓzete hēmás!', '¡Oh dioses, salvadnos!', 'quejido', 2, '', '¡O zeoí, sózete imás!'],
    ['lucha', 'falangita', 'Ὦ φίλε, κάλυπτέ με!', 'Ō fíle, kálypté me!', '¡Amigo, cúbreme!', 'grito', 2, '', '¡O fíle, kálipte me!'],
    ['lucha', 'lochagos', 'Τὴν τάξιν φυλάττετε!', 'Tēn táxin fylátete!', '¡Guardad el puesto!', 'orden', 2, '', '¡Ten táksin filátete!'],
  ];
  const GRIEGAS = TG.map((f, k) => {
    const o = { id: 'gr-' + f[0] + '-' + (k + 1), ev: f[0], quien: f[1], pueblo: 'griego', gr: f[2], lat: f[3], es: f[4], grupo: f[5], peso: f[6], pron: f[8] };
    if (f[7]) o.fuente = f[7]; else o.licencia = 'juego';
    return o;
  });

  /* ---------- SON5: gritos de guerra en castellano de NUESTRO bando cuando es Cartago, los galos o los íberos ----------
     En español (la lengua del juego): lo que se lee es lo que se oye. quien: jefe | guerrero. El enemigo no los usa: sigue con sus descripciones.
     [pueblo, situación, quién, grito, grupo, peso, fuente (o '' = licencia de juego), pron (cómo lo lee la voz)] */
  const TC = [
    ['cartago', 'espera', 'jefe', '¡Baal Hammón, danos la victoria!', 'orden', 3, 'Baal Hammón, dios principal de Cartago (inscripciones púnicas); la frase es del juego', '¡Baál Hamón, danos la victoria!'],
    ['cartago', 'espera', 'guerrero', '¡Por Cartago!', 'esfuerzo', 2, '', '¡Por Kartágo!'],
    ['cartago', 'empujar', 'jefe', '¡Por Melqart, adelante!', 'orden', 3, 'Livio 21.21 (Aníbal hace votos a Melqart en Gades, 218 a.C.); la frase es del juego', '¡Por Melkárt, adelante!'],
    ['cartago', 'choque', 'guerrero', '¡Por Tanit y por Baal!', 'grito', 3, 'Tanit «pene Baal» («rostro de Baal»), diosa de Cartago desde el s. V a.C. (inscripciones púnicas); la frase es del juego', '¡Por Tánit y por Baál!'],
    ['cartago', 'elefantes', 'jefe', '¡Elefantes, adelante!', 'orden', 3, 'Polibio 3.46 y 15.9 (los elefantes cartagineses)', '¡Elefántes, adelante!'],
    ['cartago', 'roto-enemigo', 'guerrero', '¡Huyen! ¡Por Melqart!', 'grito', 3, '', '¡Huyen! ¡Por Melkárt!'],
    ['cartago', 'victoria', 'guerrero', '¡Cartago! ¡Cartago!', 'aclamacion', 3, '', '¡Kartágo! ¡Kartágo!'],
    ['cartago', 'derrota', 'guerrero', '¡Baal, apiádate de Cartago!', 'quejido', 2, '', '¡Baál, apiádate de Kartágo!'],
    ['galos', 'espera', 'guerrero', '¡Por Tutatis!', 'esfuerzo', 2, 'Tutatis (Teutates), dios céltico: Lucano, Farsalia 1.445 (s. I d.C.) e inscripciones; probable', '¡Por Tutátis!'],
    ['galos', 'empujar', 'jefe', '¡A ellos, hijos de Breno!', 'orden', 3, 'Breno saqueó Roma en 390 a.C. (Livio 5.38) y otro Breno atacó Delfos en 279 a.C. (Pausanias 10.19-23); la frase es del juego', '¡A ellos, hijos de Bréno!'],
    ['galos', 'choque', 'guerrero', '¡Por Taranis, señor del trueno!', 'grito', 3, 'Taranis, dios céltico del trueno: Lucano, Farsalia 1.446 (s. I d.C.); probable', '¡Por Taránis, señor del trueno!'],
    ['galos', 'carga-enemiga', 'guerrero', '¡Que suenen los carnyx!', 'grito', 2, 'Polibio 2.29 (cuernos y trompas galos en Telamón, 225 a.C.)', '¡Que suenen los kárnix!'],
    ['galos', 'roto-enemigo', 'guerrero', '¡Huyen! ¡Tras ellos!', 'grito', 3, '', '¡Huyen! ¡Tras ellos!'],
    ['galos', 'victoria', 'jefe', '¡Hemos vencido, hijos de Breno!', 'aclamacion', 3, '', '¡Hemos vencido, hijos de Bréno!'],
    ['galos', 'derrota', 'guerrero', '¡Ay de los vencidos!', 'quejido', 2, 'Livio 5.48 («vae victis», dicho por Breno en 390 a.C.); probable', '¡Ay de los vencidos!'],
    ['iberos', 'espera', 'guerrero', '¡Por la tierra de los íberos!', 'esfuerzo', 2, '', '¡Por la tierra de los ibéros!'],
    ['iberos', 'empujar', 'jefe', '¡Por Neto, dios de la guerra!', 'orden', 3, 'Neto, dios guerrero de los acitanos: Macrobio, Saturnales 1.19.5 (s. V d.C.); probable', '¡Por Néto, dios de la guerra!'],
    ['iberos', 'choque', 'guerrero', '¡Por Indíbil y Mandonio!', 'grito', 3, 'Polibio 3.76 y Livio 28.31 (régulos ilergetes, 218-205 a.C.); probable', '¡Por Indíbil y Mandónio!'],
    ['iberos', 'flaquea', 'guerrero', '¡No cedáis! ¡Es nuestra tierra!', 'orden', 3, '', '¡No cedáis! ¡Es nuestra tierra!'],
    ['iberos', 'roto-enemigo', 'guerrero', '¡Huyen! ¡A ellos, íberos!', 'grito', 3, '', '¡Huyen! ¡A ellos, ibéros!'],
    ['iberos', 'victoria', 'guerrero', '¡Íberos! ¡Íberos!', 'aclamacion', 3, '', '¡Ibéros! ¡Ibéros!'],
    ['iberos', 'derrota', 'guerrero', '¡Ay de nuestra tierra!', 'quejido', 2, '', '¡Ay de nuestra tierra!'],
  ];
  const PREF = { cartago: 'ca', galos: 'ga', iberos: 'ib' };
  const GRITOS = TC.map((f, k) => {
    const o = { id: PREF[f[0]] + '-' + f[1] + '-' + (k + 1), ev: f[1], quien: f[2], pueblo: f[0], lat: f[3], es: '', grupo: f[4], peso: f[5], pron: f[7] };
    if (f[6]) o.fuente = f[6]; else o.licencia = 'juego';
    return o;
  });
  /* el nombre que se lee ante cada frase de un pueblo */
  const NOMBRE_PUEBLO = { griego: { lochagos: 'Lochagós', falangita: 'Falangita' }, cartago: { jefe: 'Jefe cartaginés', guerrero: 'Cartaginés' }, galos: { jefe: 'Jefe galo', guerrero: 'Guerrero galo' }, iberos: { jefe: 'Caudillo íbero', guerrero: 'Guerrero íbero' } };
  const nombreDe = f => (f && f.pueblo && NOMBRE_PUEBLO[f.pueblo] && NOMBRE_PUEBLO[f.pueblo][f.quien]) || (f && NOMBRE[f.quien]) || '';
  /* los pueblos que hablan de nuestro lado: pueblo → situación → frases propias (+ lo que se oye del enemigo, que no depende de quién somos) */
  const FRASES_PUEBLO = { griego: GRIEGAS.slice() };
  for (const f of GRITOS) (FRASES_PUEBLO[f.pueblo] = FRASES_PUEBLO[f.pueblo] || []).push(f);
  const POR_PUEBLO = {};
  for (const p in FRASES_PUEBLO) { const m = POR_PUEBLO[p] = {}; for (const f of FRASES_PUEBLO[p]) (m[f.ev] = m[f.ev] || []).push(f); for (const f of FRASES) if (f.quien === 'enemigo') (m[f.ev] = m[f.ev] || []).push(f); }

  /* el estado de las voces de una batalla: t = segundos de batalla (lo pone quien llama), tension 0..1 */
  const nuevo = () => ({ t: 0, tension: 0.3, ultimaId: '', tUlt: -99, tCharla: 9, recientes: {} });
  const pausaMin = ten => 5 - 3 * Math.max(0, Math.min(1, ten === undefined ? 0.3 : ten));   // 5 s en calma, 2 s al máximo

  /* pueblo (SON5): si nuestro bando habla en su lengua ('griego', 'cartago', 'galos', 'iberos'), la lista son sus frases propias más lo que se oye del enemigo; sin pueblo, las romanas de siempre */
  function elige(situacion, estado, rng, pueblo) {
    const lista = pueblo && POR_PUEBLO[pueblo] ? POR_PUEBLO[pueblo][situacion] : POR[situacion]; if (!lista || !estado) return null;
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
  /* SON2: gritos del enemigo cuando es griego (falange u hoplitas); grabados en assets/voces/griego<n>.mp3.
     alalá (ἀλαλά / ἀλαλαί): grito de guerra; eleleú (ἐλελεῦ): su variante; peán (ἰὴ παιάν): canto antes de cargar. Dictamen en gobierno/historia/SON1-voces.md */
  const GRIEGO = [
    { id: 'griego1', lat: '(Los griegos lanzan su grito de guerra: «¡Alalá! ¡Alalá!»)', ev: ['carga-enemiga', 'choque'], fuente: 'Jenofonte, Anábasis 1.8.18 y Plutarco, Pirro 16 y Alejandro 33 («alalázein»); probable' },
    { id: 'griego2', lat: '(Gritan «¡Eleleú! ¡Eleleú!» al lanzarse)', ev: ['carga-enemiga', 'choque'], fuente: 'Píndaro, fr. 78 y Aristófanes, Aves 364 («eleleú»); probable' },
    { id: 'griego3', lat: '(Entonan el peán: «¡Yé, yé, paián!»)', ev: ['espera', 'carga-enemiga'], fuente: 'Tucídides 4.43 y Jenofonte, Anábasis 1.8.17 (el peán antes de cargar); probable' },
  ];
  /* si el rival es griego y esta frase del enemigo admite un grito suyo, devuelve uno (al azar); si no, null */
  function griegoDe(f, esGriego, rng) {
    if (!esGriego || !f || f.quien !== 'enemigo') return null;
    const c = GRIEGO.filter(g => g.ev.includes(f.ev)); return c.length ? c[Math.floor((rng || Math.random)() * c.length)] : null;
  }
  /* SON4: lo mismo para las falanges que van de nuestro lado (falangitas): no hay frases habladas de los nuestros en griego, solo el grito
     (los mismos assets/voces/griego1-3.mp3) con un subtítulo que lo describe. Solo estas situaciones llevan grito propio. Pregunta abierta para el usuario. */
  const GRIEGO_PROPIO = [
    { id: 'griego1', lat: '(Tus falangitas lanzan su grito de guerra: «¡Alalá! ¡Alalá!»)', ev: ['carga-enemiga', 'choque', 'empujar', 'victoria'], fuente: GRIEGO[0].fuente },
    { id: 'griego2', lat: '(Tus falangitas gritan «¡Eleleú! ¡Eleleú!» al lanzarse)', ev: ['carga-enemiga', 'choque', 'empujar', 'roto-enemigo', 'enemigo-cede'], fuente: GRIEGO[1].fuente },
    { id: 'griego3', lat: '(Tus falangitas entonan el peán: «¡Yé, yé, paián!»)', ev: ['espera', 'pila', 'carga-enemiga', 'victoria'], fuente: GRIEGO[2].fuente },
  ];
  /* si la frase `f` (nuestra: centurión, optio o soldado) admite un grito de falangita, devuelve uno (al azar); si no, null */
  function griegoPropio(f, rng) {
    if (!f || f.quien === 'enemigo') return null;
    const c = GRIEGO_PROPIO.filter(g => g.ev.includes(f.ev)); return c.length ? c[Math.floor((rng || Math.random)() * c.length)] : null;
  }
  /* SON4: qué situación es un aviso de la maqueta de falange (gobierno/maquetas/falange; avisa(tipo, datos)); null si no habla nadie */
  function deAviso(tipo, d) {
    d = d || {};
    switch (tipo) {
      case 'choque': case 'flancoEntra': return 'choque';
      case 'carga': return 'carga-enemiga';
      case 'salva': case 'salva_cae': return 'pila';
      case 'flanco': case 'finta': return 'flanco';
      case 'flancoParado': return 'aguantar';
      case 'barrito': case 'espanta': return 'elefantes';
      case 'oleada': return 'caballeria';
      case 'hueco': case 'dentro': return 'flaquea';
      case 'rompe': return d.ganador === 'falange' ? 'roto-enemigo' : 'roto-propio';
      default: return null;
    }
  }
  /* SON4: qué situación es un evento del registro de js/simulador.js (S.reg: { tipo, lado (0 = tú), texto, ... }); null si no habla nadie */
  function deSim(e) {
    if (!e) return null; const mio = e.lado === 0;
    switch (e.tipo) {
      case 'choque': case 'testudo-roto': return 'choque';
      case 'carga': return mio ? 'empujar' : 'carga-enemiga';
      case 'carga-frenada': return mio ? 'flaquea' : 'enemigo-cede';
      case 'pila': case 'tiro': return 'pila';
      case 'desboque': return 'elefantes';
      case 'flanqueo': case 'retaguardia': return mio ? 'flanco' : 'enemigo-cede';
      case 'duda': return mio ? 'flaquea' : 'enemigo-cede';
      case 'ruptura': case 'caida': return mio ? 'roto-propio' : 'roto-enemigo';
      case 'relevo': return mio ? 'relevo' : null;
      case 'fin': return e.como === 'victoria' ? 'victoria' : e.como === 'derrota' ? 'derrota' : null;
      default: return null;
    }
  }
  const rotulo = f => f ? nombreDe(f) + ': ' + (f.gr ? f.gr + ' · ' : '') + f.lat + (f.es ? ' — ' + f.es : '') : '';
  /* el primer grupo del banco que exista (g, o su sustituto); null si ninguno. tiene(g) → bool */
  function grupoDisponible(g, tiene) {
    if (tiene(g)) return g;
    for (const h of CAIDA[g] || []) if (tiene(h)) return h;
    return null;
  }

  /* ¿El rival es un pueblo griego? (usuario, 23/11: «A»: solo los pueblos griegos gritan en griego). Lleva falange u hoplitas
     y no es Cartago: los libios y la tropa sagrada delatan un ejército cartaginés aunque lleve hoplitas mercenarios.
     Epiro con elefantes (Pirro) sigue siendo griego. n0 = { tipo: hombres } del bando enemigo. */
  const CARTAGO = ['libios', 'sagrada'];
  function esGriego(n0) {
    n0 = n0 || {}; const hay = t => (n0[t] || 0) > 0;
    return (hay('falange') || hay('hoplitas')) && !CARTAGO.some(hay);
  }
  const Voces = { GRIEGAS, GRITOS, FRASES_PUEBLO, NOMBRE_PUEBLO, nombreDe, GRIEGO, GRIEGO_PROPIO, griegoPropio, deAviso, deSim, griegoDe, esGriego, FRASES, GRUPOS, SITUACIONES, URGENTES, NOMBRE, CAIDA, nuevo, elige, deEvento, rotulo, grupoDisponible, pausaMin };
  raiz.Voces = Voces;
  if (typeof module !== 'undefined' && module.exports) module.exports = Voces;
})(typeof window !== 'undefined' ? window : globalThis);
