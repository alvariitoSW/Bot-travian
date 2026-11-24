/* AQVILA — SON9: la arenga antes de la batalla y las preguntas de tus oficiales durante ella (lógica pura, también en Node; no toca la pantalla ni el audio).
   · ARENGAS: tres discursos del general a sus tropas. Cada uno da un efecto distinto y pequeño, que se mide en las pruebas (test/dialogos.test.mjs).
     arengar(estado, id) deja en cada cuerpo (campaña, js/guerra.js) o manípulo (Escaramuzas, js/simulador.js) del jugador:
       tope (moral máxima), moral (la inicial), mod = { empuja: fuerza al empujar, cansa: ritmo de fatiga al empujar, moral: ritmo de pérdida de moral }.
     Los motores solo leen esos campos (c.mod, c.tope); no saben de arengas.
   · PREGUNTAS: en 2–4 momentos clave un oficial (tribuno, primipilo) te dice la situación y te pregunta. detectar(estado) devuelve la pregunta
     pendiente o null: no más de una cada 40 s de batalla, como mucho 4 por batalla y nunca dos seguidas del mismo tipo. responder(estado, p, k)
     da la orden de verdad (con la API de órdenes de cada motor) y mueve la moral de ese cuerpo lo que dice la respuesta. porTiempo() es lo
     prudente si no se contesta. El estado guarda lo suyo en estado.arenga y estado.dlg (se guardan con la batalla a medias).
   Estado de campaña (estado.sect) o de Escaramuzas (estado.man): se distingue solo.
   DICHOS: todas las frases habladas (assets/voces/<id>.mp3, hechas con tools/voces.py). Dictamen histórico: gobierno/historia/SON9-dialogos.md.
   Todo el texto latino es licencia de juego (restitución sencilla); lo atestiguado lleva su fuente y dictamen. */
(function (raiz) {
  'use strict';
  const tope = (x) => x.tope || 1;
  const limita = (x, a, b) => Math.max(a, Math.min(b, x));
  const motor = nombre => raiz[nombre] || (typeof require !== 'undefined' ? require(nombre === 'Guerra' ? './guerra.js' : './simulador.js') : null);
  const esSim = e => !!(e && e.man);

  /* ---------- arengas ---------- */
  /* mod.empuja: fuerza al empujar · mod.cansa: ritmo de fatiga al empujar · mod.moral: ritmo con que pierden moral · moral0: moral extra al empezar (con ese tope) */
  const ARENGAS = [
    { id: 'hogares', nombre: 'Por Roma y por vuestros hogares', efecto: '+4 % de moral al empezar', clamor: 'Imperator',
      lat: 'Pro Roma, pro aris et focis, pugnate!', es: '¡Por Roma, por los altares y los hogares, luchad!', pron: '¡Pro Róma, pro áris et fókis, pugnáte!',
      fuente: 'Cicerón, Sobre la naturaleza de los dioses 3.94 (la fórmula «pro aris et focis», de 45 a. C., recoge un lema antiguo; probable); el discurso exacto es licencia de juego',
      mod: { moral0: 0.04, empuja: 1, cansa: 1, moral: 1 } },
    { id: 'botin', nombre: 'Por el botín y la gloria', efecto: 'Cargan un 4 % más fuerte y se cansan un 12 % antes',
      lat: 'Praeda et gloria vestra erit, milites! Fortiter pugnate!', es: '¡El botín y la gloria serán vuestros, soldados! ¡Luchad con valor!', pron: '¡Préda et glória bestra érit, mílites! ¡Fortíter pugnáte!',
      fuente: 'Polibio 6.39 y 10.17 (premios y coronas a los valientes tras la batalla; Escipión en Cartago Nova, 209 a. C.; probable); el discurso exacto es licencia de juego',
      mod: { moral0: 0, empuja: 1.04, cansa: 1.12, moral: 1 } },
    { id: 'auspicios', nombre: 'Los dioses están con nosotros', efecto: 'Aguantan mejor al flaquear: pierden un 8 % menos de moral',
      lat: 'Di nobiscum sunt! Auspicia laeta sunt, milites!', es: '¡Los dioses están con nosotros! ¡Los auspicios son favorables, soldados!', pron: '¡Di nobískum sunt! ¡Auspíkia léta sunt, mílites!',
      fuente: 'Livio, passim (los cónsules tomaban los auspicios antes de combatir; Flaminio los desoye en 217 a. C., Livio 21.63; probable); el discurso exacto es licencia de juego',
      mod: { moral0: 0, empuja: 1, cansa: 1, moral: 0.92 } },
  ];
  const arenga = id => ARENGAS.find(a => a.id === id) || null;

  /* Aplica la arenga a los cuerpos del jugador. Devuelve { id, moral0 } o null si el id no existe ('ninguna'/null: no hace nada). */
  function arengar(estado, id) {
    const a = arenga(id); if (!estado) return null;
    estado.arenga = a ? a.id : 'ninguna';
    if (!a) return null;
    const lista = esSim(estado) ? estado.man.filter(u => u.lado === 0) : estado.sect.map(s => s.c[0]);
    for (const x of lista) {
      if (x.roto || x.estado === 'roto') continue;
      x.mod = { empuja: a.mod.empuja, cansa: a.mod.cansa, moral: a.mod.moral };
      if (a.mod.moral0) { x.tope = 1 + a.mod.moral0; x.moral = Math.min(x.tope, x.moral + a.mod.moral0); }
    }
    return { id: a.id, moral0: a.mod.moral0 };
  }

  /* ---------- las frases habladas ---------- */
  const DICHOS = [];
  for (const a of ARENGAS) DICHOS.push({ id: 'dl-arenga-' + a.id, quien: 'general', lat: a.lat, es: a.es, pron: a.pron, fuente: a.fuente, licencia: 'juego' });
  DICHOS.push({ id: 'dl-clamor', quien: 'tropa', lat: 'Imperator! Imperator!', es: '¡General! ¡General!', pron: '¡Imperátor! ¡Imperátor!',
    fuente: 'Plauto, Anfitrión (c. 190 a. C.) llama «imperator» al general; Polibio 10.40 y Livio 27.19 narran las aclamaciones del ejército a Escipión en Baécula (208 a. C.); la frase exacta es licencia de juego', licencia: 'juego' });

  /* ---------- las preguntas ---------- */
  /* ops: respuestas. orden = orden abstracta (relevo, aguantar, empujar, caballeria, retirar); moral = lo que sube la moral de ese cuerpo; req = necesita eso;
     solo = solo en 'guerra' (campaña) o 'sim' (Escaramuzas); pru = la que hace el oficial si no contestas (la primera disponible de la lista pru). */
  const PREGUNTAS = {
    elefantes: { ofi: 'tribuno', lat: 'Elephanti! Elephanti veniunt!', es: '¡Elefantes! ¡Vienen los elefantes!', pron: '¡Elefánti! ¡Elefánti uéniunt!',
      fuente: 'Polibio 15.9 (en Zama los manípulos abren calles para que pasen los elefantes; probable)', pru: ['aguantar'],
      ops: [{ txt: '¡Escudos juntos, firmes!', sub: 'aguantan · +6 % de moral', orden: 'aguantar', moral: 0.06 },
        { txt: '¡Que los jinetes los desvíen!', sub: 'carga de caballería · +2 %', orden: 'caballeria', moral: 0.02, req: 'caballeria' },
        { txt: '¡Abrid calles, que pasen!', sub: 'aguantan · +3 % de moral', orden: 'aguantar', moral: 0.03 }] },
    caballeria: { ofi: 'primipilo', lat: 'Equites hostium a latere!', es: '¡Jinetes enemigos por el flanco!', pron: '¡Ékuites hóstium a látere!',
      fuente: 'Polibio 3.115-116 (la caballería númida y cartaginesa en Cannas, 216 a. C.; probable); la frase es licencia de juego', pru: ['aguantar'],
      ops: [{ txt: '¡Escudos arriba y firmes!', sub: 'aguantan · +5 % de moral', orden: 'aguantar', moral: 0.05 },
        { txt: '¡Que nuestra caballería los reciba!', sub: 'carga de caballería · +2 %', orden: 'caballeria', moral: 0.02, req: 'caballeria' },
        { txt: '¡No os paréis, adelante!', sub: 'empujan · +4 %, más cansancio', orden: 'empujar', moral: 0.04 }] },
    flanco: { ofi: 'tribuno', lat: 'Imperator, acies cedit!', es: '¡General, la línea cede!', pron: '¡Imperátor, ákies kédit!',
      fuente: 'Livio 8.8 y Polibio 6.21-24 (la legión en líneas que se turnan; probable); la frase es licencia de juego', pru: ['aguantar', 'relevo'],
      ops: [{ txt: '¡Relevo: que entre la línea fresca!', sub: 'relevo · +4 % de moral', orden: 'relevo', moral: 0.04 },
        { txt: '¡Mantened la línea, que vengan!', sub: 'aguantan · +6 % de moral', orden: 'aguantar', moral: 0.06 },
        { txt: '¡Que la caballería cargue!', sub: 'carga de caballería · +2 %', orden: 'caballeria', moral: 0.02, req: 'caballeria' },
        { txt: 'Retirad ese cuerpo, en orden', sub: 'sale del combate · +3 %', orden: 'retirar', moral: 0.03, solo: 'sim' }] },
    triarios: { ofi: 'primipilo', lat: 'Triarii parati sunt. Quid imperas?', es: 'Los triarios están listos. ¿Qué ordenas?', pron: 'Triárii paráti sunt. ¿Kuíd ímperas?',
      fuente: 'Livio 8.8.11 (el proverbio «res ad triarios rediit»: se llega a los triarios cuando todo está en juego) y Polibio 6.23; la frase es licencia de juego', pru: ['aguantar'],
      ops: [{ txt: '¡Triarios, adelante!', sub: 'relevo · +8 % de moral', orden: 'relevo', moral: 0.08 },
        { txt: 'Que esperen: mantened la línea', sub: 'aguantan · +4 % de moral', orden: 'aguantar', moral: 0.04 }] },
    cansancio: { ofi: 'primipilo', lat: 'Defessi sunt, imperator.', es: 'Están agotados, general.', pron: 'Deféssi sunt, imperátor.',
      fuente: 'Polibio 6.21-24 (las líneas de la legión se turnaban en el combate; probable); la frase es licencia de juego', pru: ['aguantar'],
      ops: [{ txt: '¡Relevo: que entre la línea fresca!', sub: 'relevo · +3 % de moral', orden: 'relevo', moral: 0.03 },
        { txt: '¡Un último esfuerzo, empujad!', sub: 'empujan · +8 %, más cansancio', orden: 'empujar', moral: 0.08 },
        { txt: 'Aguantad y recobrad el aliento', sub: 'aguantan · +2 % de moral', orden: 'aguantar', moral: 0.02 }] },
    flaquea: { ofi: 'tribuno', lat: 'Hostis labat! Instemus!', es: '¡El enemigo flaquea! ¡Apretemos!', pron: '¡Hóstis lábat! ¡Instémus!',
      fuente: 'Livio, passim (el momento en que el enemigo flaquea y se aprieta: «instare»; probable); la frase es licencia de juego', pru: ['aguantar'],
      ops: [{ txt: '¡Empujad, no les deis respiro!', sub: 'empujan · +6 %, más cansancio', orden: 'empujar', moral: 0.06 },
        { txt: '¡Que la caballería los acabe!', sub: 'carga de caballería · +2 %', orden: 'caballeria', moral: 0.02, req: 'caballeria' },
        { txt: '¡Sin romper el orden!', sub: 'aguantan · +3 % de moral', orden: 'aguantar', moral: 0.03 }] },
  };
  const TIEMPO = { id: 'dl-q-tiempo', quien: 'tribuno', ofi: 'tribuno', lat: 'Tenebo aciem!', es: '¡Mantendré la línea!', pron: '¡Tenébo ákiem!' };
  for (const id in PREGUNTAS) { const q = PREGUNTAS[id]; q.id = id; DICHOS.push({ id: 'dl-q-' + id, quien: q.ofi, lat: q.lat, es: q.es, pron: q.pron, fuente: q.fuente, licencia: 'juego' }); }
  DICHOS.push({ id: 'dl-q-tiempo', quien: 'tribuno', lat: TIEMPO.lat, es: TIEMPO.es, pron: TIEMPO.pron, fuente: 'Sin fuente: frase de juego', licencia: 'juego' });
  const NOMBRE = { general: 'General', tropa: 'Tropa', tribuno: 'Tribuno', primipilo: 'Primipilo' };
  const PRIORIDAD = ['elefantes', 'caballeria', 'flanco', 'triarios', 'cansancio', 'flaquea'];
  const COOLDOWN = 40, MAX = 4, PRIMERA = 15, TIEMPO_MAX = 8;
  const DONDE = ['por la izquierda', 'en el centro', 'por la derecha'];

  function dlg(e) { if (!e.dlg) e.dlg = { ult: -999, tipo: '', n: 0, hist: [] }; return e.dlg; }
  /* ¿toca preguntar ahora? (la pausa entre preguntas y el tope por batalla; el último tipo se mira al elegir) */
  function toca(e) { const D = dlg(e); return e.fase !== 'fin' && !e.resultado && D.n < MAX && e.t >= PRIMERA && e.t - D.ult >= COOLDOWN; }

  /* ---- detectores: cada uno devuelve [{ tipo, sect | uid, peso }] del estado ---- */
  function candidatosG(B) {
    const R = motor('Guerra'), r = [], t = B.t, lejos = s => s.dist > 0;
    const sector = i => B.sect[i] && !B.sect[i].c[0].roto && B.sect[i].c[0].inicial > 0 ? B.sect[i] : null;
    for (let k = B.eventos.length - 1; k >= 0 && B.eventos[k].t >= t - 8; k--) {
      const e = B.eventos[k], i = e.sect >= 0 && sector(e.sect) ? e.sect : [1, 0, 2].find(sector);
      if (i === undefined) continue;
      if ((e.tipo === 'carga-enemiga' && e.tropa === 'elefantes') || e.tipo === 'elefantes-desbocados') r.push({ tipo: 'elefantes', sect: i, peso: 0 });
      else if (e.tipo === 'numidas-aviso') r.push({ tipo: 'caballeria', sect: i, peso: 0 });
    }
    for (let i = 0; i < 3; i++) {
      const s = sector(i); if (!s || lejos(s)) continue;
      const c = s.c[0], o = s.c[1], fr = R.frente(c);
      if (c.flanqueado || c.moral < 0.4) r.push({ tipo: 'flanco', sect: i, peso: c.moral - (c.flanqueado ? 0.2 : 0) });
      if (c.moral < 0.55 && c.lineas.slice(1).some(l => l.tipo === 'triarii' && l.hombres > 0)) r.push({ tipo: 'triarios', sect: i, peso: c.moral });
      if (fr && fr.fatiga > 0.65 && c.lineas.length > 1) r.push({ tipo: 'cansancio', sect: i, peso: c.moral });
      if (!o.roto && o.inicial > 0 && o.moral < 0.3) r.push({ tipo: 'flaquea', sect: i, peso: c.moral });
    }
    return r;
  }
  function candidatosS(S) {
    const Sm = motor('Simulador'), r = [], vivo = u => u.estado === 'firme' || u.estado === 'duda', cab = u => ['equites', 'jinetes', 'numidas', 'tesalios'].includes(u.tropa);
    const mios = S.man.filter(u => u.lado === 0 && vivo(u) && !cab(u)), suyos = S.man.filter(u => u.lado === 1 && vivo(u));
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    for (const v of suyos) {
      if (v.tropa === 'elefantes') { const u = mios.filter(m => d(m, v) < 90).sort((a, b) => d(a, v) - d(b, v))[0]; if (u) r.push({ tipo: 'elefantes', uid: u.id, peso: d(u, v) / 100 }); }
      else if (cab(v) && (v.carga || v.estado === 'firme')) { const u = mios.filter(m => d(m, v) < 80).sort((a, b) => d(a, v) - d(b, v))[0]; if (u && v.carga) r.push({ tipo: 'caballeria', uid: u.id, peso: d(u, v) / 100 }); }
    }
    const reserva = mios.some(u => u.tropa === 'triarii' && !(u.lucha > 0) && u.fatiga < 0.3 && u.n > 0.5 * u.n0);
    for (const u of mios) {
      if (!(u.lucha > 0)) continue;
      if (u.estado === 'duda' || u.moral < 0.4 || u.flanqueado) r.push({ tipo: 'flanco', uid: u.id, peso: u.moral - (u.flanqueado ? 0.2 : 0) });
      if (reserva && u.tropa !== 'triarii' && u.moral < 0.55 && Sm.puede(S, { tipo: 'relevar', lado: 0, ids: [u.id] }) === '') r.push({ tipo: 'triarios', uid: u.id, peso: u.moral });
      if (u.fatiga > 0.65) r.push({ tipo: 'cansancio', uid: u.id, peso: u.moral });
      const rv = S.man[u.rival]; if (rv && rv.lado === 1 && vivo(rv) && rv.moral < 0.3) r.push({ tipo: 'flaquea', uid: u.id, peso: u.moral });
    }
    return r;
  }

  /* ---- las respuestas, para cada motor ---- */
  const OKS = /^Ya (lo están haciendo|están en esa)/;
  const bien = no => !no || OKS.test(no);
  function ordenG(B, i, op) {   /* devuelve { orden de Guerra, no-op? } o null si ahora no se puede */
    const R = motor('Guerra'), lejos = B.sect[i].dist > 0;
    const o = op.orden === 'aguantar' ? (lejos ? 'escudos' : 'aguantar') : op.orden === 'empujar' ? (lejos ? 'avanzar' : 'empujar') : op.orden;
    return bien(R.puede(B, i, o)) ? o : null;
  }
  function ordenS(S, u, op) {   /* devuelve la orden de Simulador o null */
    const Sm = motor('Simulador'), x = u.id;
    let o = null;
    if (op.orden === 'aguantar') o = { tipo: 'aguantar', lado: 0, ids: [x] };
    else if (op.orden === 'empujar') o = { tipo: 'cargar', lado: 0, ids: [x] };
    else if (op.orden === 'relevo') o = { tipo: 'relevar', lado: 0, ids: [x] };
    else if (op.orden === 'retirar') o = { tipo: 'retirar', lado: 0, ids: [x] };
    else if (op.orden === 'caballeria') {
      const cav = S.man.filter(c => c.lado === 0 && (c.estado === 'firme' || c.estado === 'duda') && ['equites', 'jinetes', 'tesalios'].includes(c.tropa) && Sm.puede(S, { tipo: 'cargar', lado: 0, ids: [c.id] }) === '');
      if (cav.length) o = { tipo: 'cargar', lado: 0, ids: cav.map(c => c.id) };
    }
    return o && bien(Sm.puede(S, o)) ? o : null;
  }

  /* ¿Hay una pregunta que hacer? Devuelve { tipo, id, ofi, quien, nombre, lat, es, pron, audio, donde, sect | uid, opciones:[{ k, txt, sub, orden, moral }], pru, tope } o null.
     No cambia nada: para dejar constancia de que se hizo, el que la muestra llama a mostrada(estado, p). */
  function detectar(e) {
    if (!e || !toca(e)) return null;
    const D = dlg(e), sim = esSim(e), cs = sim ? candidatosS(e) : candidatosG(e);
    for (const tipo of PRIORIDAD) {
      if (tipo === D.tipo) continue;   /* nunca dos seguidas del mismo tipo */
      const hay = cs.filter(c => c.tipo === tipo).sort((a, b) => a.peso - b.peso);
      for (const c of hay) {
        const q = PREGUNTAS[tipo], ops = [];
        for (const op of q.ops) {
          if (op.solo && op.solo !== (sim ? 'sim' : 'guerra')) continue;
          const o = sim ? ordenS(e, e.man[c.uid], op) : ordenG(e, c.sect, op);
          if (o === null) continue;
          ops.push({ k: ops.length, txt: op.txt, sub: op.sub, orden: op.orden, moral: op.moral, o });
        }
        if (ops.length < 2) continue;
        let pru = null; for (const o of q.pru) { pru = ops.find(x => x.orden === o); if (pru) break; } pru = pru || ops[0];
        const donde = sim ? e.man[c.uid].nom : DONDE[c.sect];
        return { tipo, id: tipo, ofi: q.ofi, quien: q.ofi, nombre: NOMBRE[q.ofi], lat: q.lat, es: q.es, pron: q.pron, audio: 'dl-q-' + tipo, donde, sect: c.sect, uid: c.uid, opciones: ops, pru: pru.k, tope: Dialogos.TIEMPO_MAX, t: e.t };   /* tope se lee del objeto exportado: las capturas lo alargan para poder fotografiar */
      }
    }
    return null;
  }
  function mostrada(e, p) { const D = dlg(e); D.ult = e.t; D.tipo = p.tipo; D.n++; D.hist.push({ t: Math.round(e.t), tipo: p.tipo }); }

  function aplicarMoral(e, p, d) {
    const x = esSim(e) ? e.man[p.uid] : e.sect[p.sect].c[0];
    x.moral = limita(x.moral + d, 0, tope(x)); return x.moral;
  }
  /* Responde con la opción k: da la orden y mueve la moral. Devuelve { ok, no, orden, moral, texto } (no: el motivo si la orden ya no se puede). */
  function responder(e, p, k) {
    const op = p.opciones[k]; if (!op) return { ok: false, no: 'Respuesta desconocida' };
    const sim = esSim(e); let no = '';
    if (sim) no = motor('Simulador').ordenar(e, op.o);
    else { no = motor('Guerra').ordenar(e, p.sect, op.o); if (no && OKS.test(no)) no = ''; }
    if (no) return { ok: false, no };
    const m = aplicarMoral(e, p, op.moral);
    return { ok: true, orden: op.orden, moral: op.moral, nueva: m, texto: op.txt };
  }
  /* Si no se contesta a tiempo, el oficial hace lo prudente (y lo dice, en latín y en castellano). */
  function porTiempo(e, p) {
    const r = responder(e, p, p.pru);
    return Object.assign(r, { porTiempo: true, frase: TIEMPO });
  }

  const Dialogos = { ARENGAS, arenga, arengar, DICHOS, PREGUNTAS, PRIORIDAD, NOMBRE, TIEMPO, TIEMPO_MAX, COOLDOWN, MAX, PRIMERA, toca, detectar, mostrada, responder, porTiempo };
  raiz.Dialogos = Dialogos;
  if (typeof module !== 'undefined' && module.exports) module.exports = Dialogos;
})(typeof window !== 'undefined' ? window : globalThis);
