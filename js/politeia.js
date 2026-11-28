/* AQVILA — PL1/PL2 Politeia: reglas del año político (agenda, intrigas, duelo de preguntas, tribunal). Lógica pura (corre en Node), sin pantalla.
   Estado P: solo datos JSON (se puede guardar con JSON.stringify, también a mitad de duelo y de juicio). Azar con semilla en P.rng. Ver gobierno/specs/PL1.md y PL2.md.
   Provisional (PL1): cinco casas tal cual; pistas 0–6; régimen fijo; ostracismo como acción simple; un solo año; rentas de 10 de plata por estación.
   PL4 (v3): santuario (oráculo, regalo), puerto (huésped, boda), tribunal (testigo), escenas(P) para la vasija e hitos(P). Un P v2 se completa con migra(P).
   Provisional (PL2): duelo de dos preguntas tuyas y una o dos del rival; el rival opuesto se elige por su voto de partida; piedras que mueve cada respuesta
   (en politeia-datos.js); probabilidad de enterarse de un secreto; acusa el rival que más cargos sabe; cinco jueces con inclinación −1..+1;
   veredicto por votos culpables (≤2 limpio; 3 multa o cargo perdido si lo tenías; ≥4 o 3 cargos destierro); un solo orador por año. */
(function (root) {
  'use strict';
  const DATOS = (typeof module !== 'undefined' && module.exports) ? require('./politeia-datos.js') : root.POLITEIA_DATOS;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // Azar con semilla (mulberry32). El estado vive en P.rng, un entero.
  function az(P) { P.rng = (P.rng + 0x6D2B79F5) | 0; let t = P.rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  const ent = (P, n) => Math.floor(az(P) * n);
  const elige = (P, l) => l[ent(P, l.length)];
  function baraja(P, l) { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ent(P, i + 1); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  const asunto = (P, id) => DATOS.polis[P.polis].asuntos.find(a => a.id === id);
  const cn = (P, id) => id === 'tuya' ? 'tu casa' : 'la casa del ' + P.casas[id].nombre;
  const Cn = (P, id) => { const s = cn(P, id); return s[0].toUpperCase() + s.slice(1); };
  const nota = (P, quien, texto) => P.cronica.push({ estacion: P.estacion, quien, texto });
  const otras = P => Object.keys(P.casas).filter(i => i !== 'tuya');

  function nueva(o) {
    o = o || {}; const polis = o.polis || 'atenas'; const D = DATOS.polis[polis];
    if (!D) throw new Error('Polis desconocida: ' + polis);
    const P = { v: 3, polis, anio: D.anio, rng: (o.semilla == null ? 1 : o.semilla) | 0, estacion: 0, pasos: 3, casas: {}, personas: [], rivales: [], discordia: 0,
      agenda: [], debate: [], ventaja: 0, secretos: [], sabidos: [], cargo: null, cronica: [], fin: null, votos: [], extra: {}, conv: {}, cedido: false, cerrando: false, orador: null, duelo: null, juicio: null, veredicto: null, oraculo: null, huesped: null, boda: null, testigo: false };
    az(P); az(P);
    for (const c of D.casas) {
      const v = () => 0.8 + 0.4 * az(P);
      P.casas[c.id] = { id: c.id, nombre: c.nombre, emblema: c.emblema, comarca: c.comarca, lema: c.lema, grieta: c.grieta,
        influencia: Math.max(1, Math.round(c.influencia * v())), plata: Math.round(c.plata * v()), fama: c.fama,
        trato: c.id === 'tuya' ? 0 : ent(P, 3) - 1, caracter: c.id === 'tuya' ? 'tuya' : elige(P, DATOS.CARACTERES) };
    }
    if (o.nombreCasa) P.casas.tuya.nombre = o.nombreCasa;
    P.personas = D.personas.map(p => ({ id: p.id, nombre: p.nombre, casa: p.casa, labia: p.labia || 0 }));
    P.rivales = baraja(P, otras(P)).slice(0, 2);
    P.agenda = baraja(P, D.asuntos.map(a => a.id)).slice(0, 3).map(id => ({ id, pista: 1 + ent(P, 3), emp: {} }));
    P.cargo = Object.keys(P.casas).reduce((m, i) => P.casas[i].fama > P.casas[m].fama ? i : m, 'tuya');
    nota(P, 'ciudad', 'Atenas, año ' + (-D.anio) + ' a.C. Las casas ' + P.rivales.map(r => 'del ' + P.casas[r].nombre).join(' y ') + ' juegan contra ti.');
    return P;
  }

  function acciones(P) {
    if (P.fin) return [];
    const t = P.casas.tuya, C = DATOS.COSTES, e = P.estacion, out = [];
    if (P.duelo) return accionesDuelo(P, out);
    const paga = id => t.plata >= (C[id].plata || 0) && t.fama >= (C[id].fama || 0);
    const mk = (id, objs) => {
      if (objs && !objs.length) return;
      const a = { id, nombre: DATOS.ACCIONES[id], lugar: DATOS.LUGARES[id], coste: Object.assign({}, C[id], { pasos: 1 }) };
      if (objs) a.objetivos = objs; out.push(a);
    };
    const ag = P.agenda.map(a => a.id), ot = otras(P);
    if (e === 0) {
      if (paga('hablar')) mk('hablar', [].concat(...ag.map(i => [i + ':+', i + ':-'])));
      mk('favor', [].concat(...ot.filter(c => P.casas[c].trato >= 1).map(c => ag.map(i => c + '>' + i))));
      if (paga('pagar')) mk('pagar', ag);
    } else if (e === 1) {
      if (paga('banquete')) mk('banquete', ot);
      if (paga('rumor')) mk('rumor', ot);
      if (paga('espiar')) mk('espiar', ot);
      if (paga('enviado')) mk('enviado');
      if (paga('ofrenda')) mk('ofrenda');
      if (paga('oraculo') && !P.oraculo) mk('oraculo');
      if (paga('inclinar')) mk('inclinar');
      if (paga('huesped') && !P.huesped) mk('huesped', Object.keys(DATOS.VECINAS));
      if (paga('boda') && !P.boda) mk('boda', ot.filter(c => P.casas[c].trato >= 0));
    } else if (e === 2) {
      if (paga('discurso')) mk('discurso');
      if (paga('orador') && !P.orador) mk('orador', P.personas.filter(x => x.casa === 'tuya').map(x => x.id));
      if (paga('convencer')) mk('convencer', ot.filter(c => !P.conv[c]));
      if (paga('comprar')) mk('comprar');
    } else {
      const J = P.juicio;
      if (J) mk('negar');
      if (J && paga('pagar_jueces') && J.pagados < 2 && J.jueces.some(j => j.inc < 1)) mk('pagar_jueces');
      if (J && paga('contraatacar')) mk('contraatacar', objetivosContra(P));
      if (J && P.huesped && !P.testigo && J.jueces.some(j => j.inc < 1)) mk('testigo');
      if (paga('dar_cuentas')) mk('dar_cuentas');
      if (P.cargo === 'tuya' && paga('ceder_cargo')) mk('ceder_cargo');
      if (P.discordia >= 4 && paga('ostracismo')) mk('ostracismo', ot);
    }
    return out;
  }

  function subeDisc(P, n) {
    P.discordia = clamp(P.discordia + n, 0, 6);
    if (P.discordia >= 6 && !P.fin) terminar(P, 'revuelta', 'El pueblo pierde la paciencia y se alza en la ciudad. El año acaba en revuelta.');
  }
  function terminar(P, resultado, texto) {
    const t = P.casas.tuya; nota(P, 'ciudad', texto);
    P.fin = { resultado, fama: t.fama, plata: t.plata, cargo: P.cargo, estacion: P.estacion + (P.cerrando ? 1 : 0),
      cronica: P.cronica.slice(-3).map(c => c.texto).join(' ') };
  }
  // Un secreto: quién lo hizo (de), quién lo sabe, si ya salió a la luz. Los atajos tuyos los puede saber un rival.
  function apunta(P, de, t) {
    const s = { id: 's' + (P.nsec = (P.nsec || 0) + 1), t, de, p: 0.25, sabe: [], fuera: false, est: P.estacion };
    if (de === 'tuya') for (const r of P.rivales) if (az(P) < (P.casas[r].caracter === 'astuto' ? DATOS.DUELO.enterarseAstuto : DATOS.DUELO.enterarse)) s.sabe.push(r);
    P.secretos.push(s); return s;
  }
  // Tú te enteras de algo de la casa c: un secreto real que aún no sabías, o su grieta. Devuelve el texto o null.
  function aprende(P, c) {
    const s = P.secretos.find(x => x.de === c && !x.sabe.includes('tuya'));
    if (s) { s.sabe.push('tuya'); P.sabidos.push({ casa: c, texto: s.t, sec: s.id }); return s.t; }
    if (!P.sabidos.some(x => x.casa === c && !x.sec)) { P.sabidos.push({ casa: c, texto: P.casas[c].grieta }); return P.casas[c].grieta; }
    return null;
  }
  const secreto = (P, t) => apunta(P, 'tuya', t);

  // Lo que hace el jugador con cada acción. Devuelve la frase de la crónica.
  const EJEC = {
    hablar(P, o) { const [id, d] = o.split(':'); const a = P.agenda.find(x => x.id === id); a.pista = clamp(a.pista + (d === '+' ? 1 : -1), 0, 6); a.emp.tuya = (a.emp.tuya || 0) + 1;
      return 'Hablas en el Consejo ' + (d === '+' ? 'a favor' : 'en contra') + ' de «' + asunto(P, id).nombre + '».'; },
    favor(P, o) { const [c, id] = o.split('>'); const a = P.agenda.find(x => x.id === id); a.pista = clamp(a.pista + 2, 0, 6); a.emp.tuya = (a.emp.tuya || 0) + 1; P.casas[c].trato -= 1;
      return 'Cobras un favor a ' + cn(P, c) + ' para empujar «' + asunto(P, id).nombre + '».'; },
    pagar(P, id) { const a = P.agenda.find(x => x.id === id); a.pista = clamp(a.pista + 2, 0, 6); a.emp.tuya = (a.emp.tuya || 0) + 1; secreto(P, 'compró apoyo en el Consejo');
      return 'Pagas apoyos en el Consejo para «' + asunto(P, id).nombre + '». Nadie debe saberlo.'; },
    banquete(P, c) { const k = P.casas[c]; k.trato = clamp(k.trato + 1, -3, 3); let x = '';
      if (az(P) < 0.3) { const q = aprende(P, c); if (q) x = ' Entre copas te cuentan algo: ' + q + '.'; }
      return 'Das un banquete a ' + cn(P, c) + '.' + x; },
    espiar(P, c) { const k = P.casas[c];
      if (az(P) < (k.caracter === 'astuto' ? DATOS.DUELO.espiarAstuto : DATOS.DUELO.espiar)) { const q = aprende(P, c); if (q) return 'Espías a ' + cn(P, c) + ' y averiguas: ' + q + '.'; }
      return 'Espías a ' + cn(P, c) + ' y no sacas nada en limpio.'; },
    orador(P, id) { const p = P.personas.find(x => x.id === id); P.orador = id; return 'Subes a ' + p.nombre + ' de tu casa a la tribuna: hablará él en el debate.'; },
    rumor(P, c) { const k = P.casas[c]; const sabe = P.sabidos.some(s => s.casa === c); k.influencia = Math.max(1, k.influencia - (sabe ? 2 : 1)); secreto(P, 'soltó un rumor contra ' + cn(P, c)); let x = '';
      if (az(P) < 0.35) { k.trato = clamp(k.trato - 2, -3, 3); subeDisc(P, 1); x = ' Se descubre de dónde sale el rumor.'; }
      return 'Sueltas un rumor contra ' + cn(P, c) + '.' + x; },
    enviado(P) { P.casas.tuya.plata += 40; let x = ''; if (P.rivales.includes('delfin')) { P.casas.delfin.trato = clamp(P.casas.delfin.trato - 1, -3, 3); x = ' Al Delfín no le gusta que le pises el puerto.'; }
      return 'Mandas un enviado al puerto y vuelve con plata.' + x; },
    ofrenda(P) { P.ventaja += 1; return 'Haces una ofrenda en el santuario. Los dioses te miran bien.'; },
    oraculo(P) {
      const O = DATOS.ORACULO; let cand = P.rivales.filter(c => !P.sabidos.some(x => x.casa === c && !x.sec));
      if (!cand.length) cand = otras(P).filter(c => !P.sabidos.some(x => x.casa === c && !x.sec));
      const da = az(P) < O.prob && cand.length;
      if (da) { const c = elige(P, cand); P.sabidos.push({ casa: c, texto: P.casas[c].grieta, oraculo: true }); P.oraculo = { frase: O.pista[c], casa: c, pista: true }; }
      else P.oraculo = { frase: elige(P, O.sinPista), casa: null, pista: false };
      return 'Consultas el oráculo de Delfos. La sacerdotisa dice: «' + P.oraculo.frase + '»' + (da ? ' Entiendes a quién se refiere.' : ''); },
    inclinar(P) { P.ventaja += 2; secreto(P, 'compró al oráculo'); return 'Haces un regalo al oráculo para que hable a tu favor. Los dioses se dejan querer, pero alguien lo ha visto.'; },
    huesped(P, v) {
      const H = DATOS.VECINAS[v], f = H.efecto, t = P.casas.tuya; P.huesped = { polis: v, est: P.estacion }; let x = '';
      if (f.plata) t.plata += f.plata; if (f.ventaja) P.ventaja += f.ventaja;
      for (const k of Object.keys(f.trato || {})) P.casas[k].trato = clamp(P.casas[k].trato + f.trato[k], -3, 3);
      if (f.aprende) for (const c of P.rivales) { const q = aprende(P, c); if (q) { x = ' Te cuenta de ' + cn(P, c) + ': ' + q + '.'; break; } }
      return 'Acoges en tu casa a un huésped de ' + H.nombre + '. ' + H.texto + x; },
    boda(P, c) {
      let m = null; for (const o of otras(P)) if (o !== c && (m === null || P.casas[o].trato > P.casas[m].trato)) m = o;
      P.casas[c].trato = clamp(P.casas[c].trato + 2, -3, 3); P.boda = { casa: c }; let x = '';
      if (m) { P.casas[m].trato = clamp(P.casas[m].trato - 1, -3, 3); x = ' ' + Cn(P, m) + ' se siente ofendida.'; }
      return 'Concertáis una boda con ' + cn(P, c) + '. Los tratos se afianzan.' + x; },
    testigo(P) { const J = P.juicio; P.testigo = true; const a = J.jueces.filter(j => j.inc < 1).sort((x, y) => x.inc - y.inc).slice(0, 2); a.forEach(j => { j.inc++; });
      return 'Tu huésped de ' + DATOS.VECINAS[P.huesped.polis].nombre + ' habla ante los jueces en tu favor. ' + a.map(j => j.nombre).join(' y ') + ' te miran mejor.'; },
    discurso(P) { P.ventaja += 1; return 'Das un discurso en la asamblea y la plaza te escucha.'; },
    convencer(P, c) { const p = clamp(0.5 + 0.15 * P.casas[c].trato, 0.1, 0.9);
      if (az(P) < p) { P.conv[c] = true; return 'Convences a ' + cn(P, c) + ' de que vote contigo.'; }
      return cn(P, c) + ' no se deja convencer.'; },
    comprar(P) { P.ventaja += 3; secreto(P, 'compró piedras de voto'); return 'Compras piedras de voto. Alguien las contó.'; },
    pagar_jueces(P) { const J = P.juicio; J.pagados++;
      const ord = J.jueces.slice().sort((a, b) => a.inc - b.inc)[0]; ord.inc = 1;
      const s = secreto(P, 'pagó a los jueces'); let x = '';
      if (s.sabe.includes(J.acusador) && !J.cargos.includes(s.id)) { J.cargos.push(s.id); x = ' Pero el acusador se entera y lo añade a los cargos.'; }
      return 'Pagas a ' + ord.nombre + ' para que mire hacia otro lado.' + x; },
    negar(P) { P.juicio.negado = true; return 'Niegas todos los cargos ante los jueces.'; },
    contraatacar(P, o) { const J = P.juicio, a = J.acusador;
      if (o === 'grieta') { const g = P.sabidos.find(x => x.casa === a && !x.sec); g.usada = true; }
      else { const s = P.secretos.find(x => x.id === o.slice(4)); s.fuera = true; const g = P.sabidos.find(x => x.sec === s.id); if (g) g.usada = true; }
      J.jueces.filter(j => j.inc < 1).sort((x, y) => x.inc - y.inc).slice(0, 2).forEach(j => { j.inc++; });
      P.casas[a].fama = Math.max(0, P.casas[a].fama - 1); J.contra++;
      return 'Contraatacas: sacas a la luz un secreto de ' + cn(P, a) + ' ante los jueces. Ya no miran solo a tu casa.'; },
    dar_cuentas(P) { for (const s of P.secretos) s.p *= 0.9; if (P.juicio) P.juicio.cuentas++; return 'Das cuentas claras ante los jueces. Algo de confianza gana la casa.'; },
    ceder_cargo(P) { P.cargo = null; P.cedido = true; let m = -1; const mios = P.secretos.filter(s => s.de === 'tuya' && !s.fuera);
      for (const s of mios) if (m < 0 || s.p > m.p) m = s;
      if (m && m.id) { P.secretos.splice(P.secretos.indexOf(m), 1); if (P.juicio) { P.juicio.cargos = P.juicio.cargos.filter(i => i !== m.id); if (!P.juicio.cargos.length) P.juicio = null; } }
      return 'Cedes el cargo del año. Un secreto menos que te pese.'; },
    ostracismo(P, c) { P.casas[c].influencia = Math.max(1, P.casas[c].influencia - 2); P.casas[c].trato = clamp(P.casas[c].trato - 2, -3, 3); subeDisc(P, -1);
      return 'Pides el ostracismo para el jefe de ' + cn(P, c) + '. La ciudad se calma un poco.'; }
  };

  function jugar(P, id, obj) {
    if (P.fin) return { ok: false, texto: 'El año ya acabó.' };
    const a = acciones(P).find(x => x.id === id);
    if (!a) return { ok: false, texto: 'Esa acción no está disponible ahora.' };
    if (a.objetivos && !a.objetivos.includes(obj)) return { ok: false, texto: 'Falta elegir un objetivo válido.' };
    const t = P.casas.tuya; t.plata -= a.coste.plata || 0; t.fama -= a.coste.fama || 0;
    const enDuelo = !!P.duelo;
    const texto = EJEC[id](P, obj);
    if (P.fin) P.cronica.splice(P.cronica.length - 1, 0, { estacion: P.estacion, quien: 'tuya', texto }); else nota(P, 'tuya', texto);
    if (!enDuelo) { P.pasos--; if (!P.fin && P.pasos <= 0) cierra(P); }
    return { ok: true, texto };
  }
  function pasar(P) {
    if (P.fin) return { ok: false, texto: 'El año ya acabó.' };
    if (P.duelo) { const texto = pasaDuelo(P); return { ok: true, texto }; }
    let m = null; for (const c of otras(P)) if (!m || P.casas[c].trato > P.casas[m].trato) m = c;
    P.casas[m].trato = clamp(P.casas[m].trato - 1, -3, 3);
    const texto = 'Dejas pasar el tiempo. ' + Cn(P, m) + ' se siente desatendida.'; nota(P, 'tuya', texto);
    P.pasos--; if (P.pasos <= 0) cierra(P);
    return { ok: true, texto };
  }

  // Los rivales juegan solos, según su carácter.
  // Devuelve una clave de lo que hizo; la segunda jugada de la estación no repite la clave de la primera.
  function juegaRival(P, id, prev) {
    const c = P.casas[id], e = P.estacion, n = Cn(P, id);
    if (e === 0) {
      let a, A, d, k;
      for (let i = 0; i < 12; i++) {
        const dep = i < 6 ? P.agenda.filter(x => { const B = asunto(P, x.id); return B.pro.includes(id) || B.contra.includes(id); }) : [];
        a = elige(P, dep.length ? dep : P.agenda); A = asunto(P, a.id); d = A.contra.includes(id) ? -1 : 1; if (i >= 6 && az(P) < 0.5) d = -d;
        k = a.id + d; if (k !== prev) break;
      }
      if (c.caracter === 'rico' && c.plata >= 30 && az(P) < 0.5) { c.plata -= 30; a.pista = clamp(a.pista + 2 * d, 0, 6); a.emp[id] = (a.emp[id] || 0) + 2; apunta(P, id, 'repartió plata en el Consejo'); nota(P, id, n + ' reparte plata para ' + (d > 0 ? 'apoyar' : 'frenar') + ' «' + A.nombre + '».'); }
      else { if (c.caracter === 'ambicioso' && az(P) < 0.4) apunta(P, id, 'compró votos en el Consejo'); a.pista = clamp(a.pista + d, 0, 6); a.emp[id] = (a.emp[id] || 0) + (c.caracter === 'ambicioso' ? 2 : 1); nota(P, id, n + (d > 0 ? ' empuja ' : ' frena ') + '«' + A.nombre + '» en el Consejo.'); }
      return k;
    } else if (e === 1) {
      let acc, obj, k;
      for (let i = 0; i < 20; i++) {
        acc = { astuto: 'rumor', ambicioso: 'rumor', rico: 'banquete', piadoso: 'ofrenda' }[c.caracter];
        if (i > 0 || az(P) < 0.3) acc = elige(P, ['rumor', 'banquete', 'enviado', 'ofrenda']);
        if ((acc === 'banquete' && c.plata < 25) || (acc === 'ofrenda' && c.plata < 20)) acc = 'enviado';
        obj = az(P) < 0.5 ? 'tuya' : elige(P, otras(P).filter(x => x !== id));
        k = acc === 'enviado' || acc === 'ofrenda' ? acc : acc + obj; if (k !== prev) break;
      }
      const o = P.casas[obj];
      if (acc === 'rumor') {
        o.influencia = Math.max(1, o.influencia - 1); apunta(P, id, 'soltó un rumor contra ' + cn(P, obj));
        if (az(P) < 0.35) { if (obj === 'tuya') c.trato = clamp(c.trato - 2, -3, 3); nota(P, id, n + ' suelta un rumor contra ' + cn(P, obj) + ' y se nota quién fue.'); subeDisc(P, 1); }
        else nota(P, id, n + ' suelta un rumor contra ' + cn(P, obj) + '.');
      } else if (acc === 'banquete') { c.plata -= 25; if (obj === 'tuya') c.trato = clamp(c.trato + 1, -3, 3); nota(P, id, n + ' da un banquete para ' + cn(P, obj) + '.'); }
      else if (acc === 'ofrenda') { c.plata -= 20; P.extra[id] = (P.extra[id] || 0) + 1; nota(P, id, n + ' hace una ofrenda en el santuario.'); }
      else { c.plata += 40; nota(P, id, n + ' manda un barco al puerto y gana plata.'); }
      return k;
    } else if (e === 2) {
      if (prev !== 'comprar' && (c.caracter === 'rico' || az(P) < 0.2) && c.plata >= 40) { c.plata -= 40; P.extra[id] = (P.extra[id] || 0) + 3; apunta(P, id, 'compró piedras de voto'); nota(P, id, n + ' compra piedras de voto.'); return 'comprar'; }
      P.extra[id] = (P.extra[id] || 0) + 1; nota(P, id, n + (prev === 'habla' ? ' insiste ante la asamblea.' : ' habla a la asamblea.')); return 'habla';
    }
    if (prev !== 'pagar' && c.caracter === 'rico' && c.plata >= 30) { c.plata -= 30; c.fama += 1; apunta(P, id, 'pagó a los jueces'); nota(P, id, n + ' paga a los jueces.'); return 'pagar'; }
    c.fama += 1; nota(P, id, n + (prev === 'cuentas' ? ' vuelve a dar cuentas.' : ' da cuentas y gana buen nombre.')); return 'cuentas';
  }

  function cierra(P) {
    for (const r of P.rivales) { const k = juegaRival(P, r, null); if (P.fin) return; juegaRival(P, r, k); if (P.fin) return; }
    P.cerrando = true;
    const e = P.estacion;
    if (e === 0) resuelveAgenda(P); else if (e === 2) { abreDuelo(P, 0); P.cerrando = false; return; } else if (e === 3) resuelveCuentas(P);
    acaba(P, e);
  }
  // Remate de la estación: discordia, rentas y paso a la siguiente (en otoño, tras el último duelo y sus piedras).
  function acaba(P, e) {
    P.cerrando = true;
    if (!P.fin && P.rivales.some(r => P.casas[r].caracter === 'ambicioso')) { nota(P, 'ciudad', 'Un ambicioso agita la ciudad.'); subeDisc(P, 1); }
    if (!P.fin) {
      for (const i of Object.keys(P.casas)) P.casas[i].plata += 10;
      if (e === 3) terminar(P, 'sigue', 'El año acaba. Sigues en Atenas con tu casa en pie.');
      else { P.estacion++; P.pasos = 3; nota(P, 'ciudad', 'Llega el ' + ['verano', 'otoño', 'invierno'][e] + '. ' + DATOS.ACTOS[e + 1] + '.'); if (e === 2) abreJuicio(P); }
    }
    P.cerrando = false;
  }

  function resuelveAgenda(P) {
    const orden = P.agenda.slice().sort((a, b) => b.pista - a.pista);
    let suben = orden.filter(a => a.pista >= 4).slice(0, 2); if (!suben.length) suben = [orden[0]];
    P.debate = suben.map(a => {
      let m = null; for (const k of Object.keys(a.emp)) if (a.emp[k] > 0 && (m === null || a.emp[k] > a.emp[m])) m = k;
      if (m) { P.casas[m].fama += 1; nota(P, 'ciudad', Cn(P, m) + ' presenta «' + asunto(P, a.id).nombre + '» a la asamblea.'); }
      else nota(P, 'ciudad', '«' + asunto(P, a.id).nombre + '» llega a la asamblea sin dueño.');
      return { id: a.id, presentador: m };
    });
  }

  // ---- Duelo de preguntas (otoño). El año espera al jugador; P.duelo es JSON. ----
  // fase 'tuya': haces hasta 2 preguntas. fase 'rival': te pregunta él (1 o 2 veces) y respondes verdad, callar o mentir.
  function abreDuelo(P, i) {
    const d = P.debate[i], A = asunto(P, d.id), L = d.presentador === 'tuya' ? 'si' : A.pueblo;
    const mide = r => { const v = A.pro.includes(r) ? 'si' : A.contra.includes(r) ? 'no' : null; return (v && v !== L ? 0 : v ? 2 : 1) * 10 + P.casas[r].trato; };
    const rival = P.rivales.slice().sort((a, b) => mide(a) - mide(b))[0];
    const D = P.duelo = { i, id: d.id, rival, lado: L, fase: 'tuya', q: 0, nr: 0, hechas: 0, pend: null, mov: { tuya: 0, rival: 0 }, log: [] };
    const o = P.personas.find(x => x.id === P.orador);
    D.mov.tuya += o ? o.labia : DATOS.DUELO.sinOrador;
    nota(P, 'ciudad', 'Debate de «' + A.nombre + '». ' + (o ? 'Habla ' + o.nombre + ' por tu casa.' : 'No hay orador: habla el jefe de tu casa, sin gracia.') + ' Te responde ' + cn(P, rival) + '.');
  }
  function objetivosPregunta(P) {
    const D = P.duelo, out = [];
    for (const s of P.sabidos) if (s.casa === D.rival && !s.usada) {
      if (s.sec) { const sc = P.secretos.find(x => x.id === s.sec); if (sc && !sc.fuera) out.push('sec:' + s.sec); } else out.push('grieta');
    }
    out.push('aire'); return out.filter((x, k) => out.indexOf(x) === k);
  }
  function objetivosContra(P) {
    const a = P.juicio.acusador, out = [];
    for (const s of P.sabidos) if (s.casa === a && !s.usada) {
      if (s.sec) { const sc = P.secretos.find(x => x.id === s.sec); if (sc && !sc.fuera) out.push('sec:' + s.sec); } else out.push('grieta');
    }
    return out.filter((x, k) => out.indexOf(x) === k);
  }
  function accionesDuelo(P, out) {
    const D = P.duelo, t = P.casas.tuya, C = DATOS.COSTES;
    const mk = (id, objs) => { const a = { id, nombre: DATOS.ACCIONES[id], lugar: DATOS.LUGARES[id], coste: Object.assign({}, C[id], { pasos: 0 }) }; if (objs) a.objetivos = objs; if (D.pend) a.pregunta = D.pend; out.push(a); };
    if (D.fase === 'tuya') { if (t.plata >= C.preguntar.plata) mk('preguntar', objetivosPregunta(P)); }
    else { mk('verdad'); mk('callar'); mk('mentir'); }
    return out;
  }
  const fraseObj = (P, obj, de) => {
    if (obj === 'aire') return 'sin nada concreto';
    if (obj === 'grieta') return 'por ' + P.casas[de].grieta;
    return 'por «' + P.secretos.find(x => x.id === obj.slice(4)).t + '»';
  };
  // Aplica una respuesta. q = quien pregunta, r = quien responde ('tuya' o 'rival').
  function respuesta(P, q, r, resp, obj) {
    const D = P.duelo, prueba = obj !== 'aire', E = DATOS.DUELO[prueba ? 'pr' : 'aire'][resp];
    const rc = P.casas[r === 'tuya' ? 'tuya' : D.rival];
    rc.fama = Math.max(0, rc.fama + (E.fama || 0)); D.mov[r] += E.mio || 0; D.mov[q] += E.suyo || 0;
    if (prueba && E.sale) {
      if (q === 'tuya') { const g = P.sabidos.find(x => x.casa === D.rival && (obj === 'grieta' ? !x.sec : x.sec === obj.slice(4))); if (g) g.usada = true; if (obj !== 'grieta') P.secretos.find(x => x.id === obj.slice(4)).fuera = true; }
      else P.secretos.find(x => x.id === obj.slice(4)).fuera = true;
    }
    D.log.push({ q, r, obj, resp, prueba, fama: E.fama || 0, mio: E.mio || 0, suyo: E.suyo || 0 });
    return E;
  }
  const verbo = { verdad: 'dice la verdad', callar: 'calla', mentir: 'miente' };
  function preguntaTuya(P, obj) {
    const D = P.duelo, r = D.rival, prueba = obj !== 'aire', p = DATOS.DUELO.pesos[P.casas[r].caracter].slice();
    if (prueba) p[2] *= 0.5; const u = az(P) * (p[0] + p[1] + p[2]);
    const resp = u < p[0] ? 'verdad' : u < p[0] + p[1] ? 'callar' : 'mentir';
    respuesta(P, 'tuya', 'rival', resp, obj); D.q++;
    const E = DATOS.DUELO[prueba ? 'pr' : 'aire'][resp];
    const fin = { verdad: ' Reconoce la verdad y pierde nombre.', callar: ' Calla, y la asamblea lo nota.', mentir: prueba ? ' Miente, y tú tenías la prueba: lo pillan delante de todos.' : ' Miente con aplomo y nadie puede desmentirlo.' }[resp];
    const texto = 'Preguntas a ' + cn(P, r) + ' ' + fraseObj(P, obj, r) + '. ' + Cn(P, r) + ' ' + verbo[resp] + '.' + fin;
    if (D.q >= 2) pasaARival(P);
    return texto;
  }
  function pasaARival(P) { const D = P.duelo; D.fase = 'rival'; D.nr = 1 + ent(P, 2); D.hechas = 0; preguntaRival(P); }
  function preguntaRival(P) {
    const D = P.duelo, c = P.secretos.filter(s => s.de === 'tuya' && !s.fuera && s.sabe.includes(D.rival));
    const obj = c.length ? 'sec:' + elige(P, c).id : 'aire';
    D.pend = { obj, texto: obj === 'aire' ? 'te pregunta a bocajarro, sin nada concreto' : 'te pregunta ' + fraseObj(P, obj, 'tuya') };
    nota(P, D.rival, 'Sobre «' + asunto(P, D.id).nombre + '», ' + cn(P, D.rival) + (D.hechas ? ' insiste y' : '') + ' ' + D.pend.texto + '.');
  }
  function responde(P, resp) {
    const D = P.duelo, obj = D.pend.obj, prueba = obj !== 'aire'; respuesta(P, 'rival', 'tuya', resp, obj); D.pend = null; D.hechas++;
    const fin = { verdad: prueba ? 'Dices la verdad: el secreto sale y pierdes nombre.' : 'No hay nada que decir y se queda con las manos vacías.', callar: 'Callas. Algo huele mal y la plaza murmura.',
      mentir: prueba ? 'Mientes, pero él tenía la prueba: te pillan y pagas caro.' : 'Mientes sin que nadie pueda probarlo.' }[resp];
    if (D.hechas < D.nr) preguntaRival(P); else cierraDuelo(P);
    return fin;
  }
  function pasaDuelo(P) {
    const D = P.duelo; let texto;
    const apunta1 = tx => { if (P.fin) P.cronica.splice(P.cronica.length - 1, 0, { estacion: P.estacion, quien: 'tuya', texto: tx }); else nota(P, 'tuya', tx); };
    if (D.fase === 'tuya') { D.mov.tuya -= 1; D.q++; texto = 'No preguntas nada y callas ante la asamblea.'; nota(P, 'tuya', texto); if (D.q >= 2) pasaARival(P); }
    else { texto = responde(P, 'callar'); apunta1(texto); }
    return texto;
  }
  EJEC.preguntar = (P, obj) => preguntaTuya(P, obj);
  for (const r of ['verdad', 'callar', 'mentir']) EJEC[r] = P => responde(P, r);
  function cierraDuelo(P) {
    const D = P.duelo, d = P.debate[D.i]; P.cerrando = true; votaAsunto(P, d, D); P.duelo = null;
    if (P.fin) { P.cerrando = false; return; }
    if (D.i + 1 < P.debate.length) { abreDuelo(P, D.i + 1); P.cerrando = false; return; }
    P.ventaja = 0; P.extra = {}; acaba(P, 2);
  }
  // Caen las piedras de un asunto: cada casa echa su peso, más el pueblo, más lo que movió el duelo.
  function votaAsunto(P, d, D) {
    const t = P.casas.tuya, A = asunto(P, d.id), lados = { si: 0, no: 0 }, voto = {};
    for (const id of Object.keys(P.casas)) {
      const c = P.casas[id]; let v;
      if (id === 'tuya') v = d.presentador === 'tuya' ? 'si' : A.pueblo;
      else if (P.conv[id]) v = d.presentador === 'tuya' ? 'si' : A.pueblo;
      else { const s = (A.pro.includes(id) ? 2 : 0) - (A.contra.includes(id) ? 2 : 0) + (d.presentador === 'tuya' ? c.trato : 0); v = s > 0 ? 'si' : s < 0 ? 'no' : (az(P) < 0.5 ? 'si' : 'no'); }
      voto[id] = v; lados[v] += c.influencia + (P.extra[id] || 0) + (id === 'tuya' ? P.ventaja : 0);
    }
    lados[A.pueblo] += 3 + ent(P, 3) - 1;
    const otro = D.lado === 'si' ? 'no' : 'si'; lados[D.lado] += D.mov.tuya; lados[otro] += D.mov.rival;
    lados.si = Math.max(0, lados.si); lados.no = Math.max(0, lados.no);
    const res = lados.si > lados.no ? 'si' : lados.no > lados.si ? 'no' : A.pueblo, ef = A.efectos[res];
    const perj = otras(P).filter(i => voto[i] !== res);
    for (const i of ef.perjudica) if (!perj.includes(i)) perj.push(i);
    t.plata = Math.max(0, t.plata + (ef.plata || 0)); t.fama = Math.max(0, t.fama + (ef.fama || 0));
    for (const k of Object.keys(ef.trato || {})) P.casas[k].trato = clamp(P.casas[k].trato + ef.trato[k], -3, 3);
    for (const i of perj) P.casas[i].trato = clamp(P.casas[i].trato - 1, -3, 3);
    for (const i of ef.perjudica) P.casas[i].influencia = Math.max(1, P.casas[i].influencia - 1);
    if (d.presentador === 'tuya' && res === 'si') { t.fama += 2; }
    P.votos.push({ asunto: d.id, resultado: res, perjudicadas: perj, presentador: d.presentador, rival: D.rival, lado: D.lado, gana: res === D.lado,
      piedras: { si: lados.si, no: lados.no }, duelo: D.log.slice(), mov: { tuya: D.mov.tuya, rival: D.mov.rival } });
    nota(P, 'ciudad', '«' + A.nombre + '» ' + (res === 'si' ? 'se aprueba' : 'se rechaza') + ' (' + lados.si + ' a ' + lados.no + ' piedras). Sale perdiendo ' + perj.map(i => cn(P, i)).join(' y ') + '.');
    subeDisc(P, ef.discordia || 0); if (P.fin) return;
    if (res !== A.pueblo) { nota(P, 'pueblo', 'El pueblo no consigue lo que quería con «' + A.nombre + '» y murmura.'); subeDisc(P, 1); }
  }

  // ---- Tribunal (invierno). Sin acusación no hay juicio. ----
  function abreJuicio(P) {
    const J = DATOS.JUICIO; let mejor = null;
    for (const r of P.rivales) {
      const c = P.secretos.filter(s => s.de === 'tuya' && (s.sabe.includes(r) || s.fuera));
      if (!c.length) continue;
      if (!(c.some(s => s.fuera) || az(P) < J.acusa[P.casas[r].caracter])) continue;
      if (!mejor || c.length > mejor.c.length) mejor = { r, c };
    }
    if (!mejor) { nota(P, 'ciudad', 'Nadie te acusa de nada. No habrá juicio este invierno.'); return; }
    const jueces = baraja(P, J.nombres).slice(0, J.jueces).map((n, k) => ({ id: 'j' + (k + 1), nombre: n, inc: ent(P, 3) - 1 }));
    P.juicio = { acusador: mejor.r, cargos: mejor.c.map(s => s.id), jueces, negado: false, pagados: 0, cuentas: 0, contra: 0 };
    nota(P, mejor.r, Cn(P, mejor.r) + ' te acusa ante el tribunal de ' + mejor.c.map(s => '«' + s.t + '»').join(', ') + '.');
  }
  function veredicto(P) {
    const t = P.casas.tuya, J = DATOS.JUICIO, ju = P.juicio;
    const fuera = ju.cargos.filter(i => P.secretos.find(s => s.id === i).fuera).length;
    const base = J.base + J.porCargo * (ju.cargos.length - 1) + (fuera ? J.porFuera : 0) - (ju.negado ? (fuera ? J.negarFuera : J.negar) : 0) - J.cuentas * ju.cuentas;
    let culp = 0; const votos = ju.jueces.map(j => { const c = az(P) < clamp(base - J.inclinacion * j.inc, 0.05, 0.95); if (c) culp++; return { juez: j.nombre, inc: j.inc, culpable: c }; });
    let tipo = culp <= 2 ? 'limpio' : (culp >= 4 || (culp >= 3 && ju.cargos.length >= 3)) ? 'destierro' : P.cargo === 'tuya' ? 'cargo' : 'multa';
    P.veredicto = { tipo, culpables: culp, de: ju.jueces.length, cargos: ju.cargos.slice(), votos };
    const ac = P.casas[ju.acusador];
    if (tipo === 'limpio') { ac.fama = Math.max(0, ac.fama - 1); nota(P, 'ciudad', 'Los jueces te absuelven (' + culp + ' culpables de 5). Sales limpio y ' + cn(P, ju.acusador) + ' queda en ridículo.'); }
    else if (tipo === 'multa') { if (t.plata >= J.multa) { t.plata -= J.multa; nota(P, 'ciudad', 'Condena de ' + culp + ' a ' + (5 - culp) + ': multa de ' + J.multa + ' de plata.'); } else { t.fama = Math.max(0, t.fama - 2); nota(P, 'ciudad', 'Condena de ' + culp + ' a ' + (5 - culp) + ': no puedes pagar la multa y pierdes buen nombre.'); } }
    else if (tipo === 'cargo') { P.cargo = null; P.cedido = true; t.fama = Math.max(0, t.fama - 2); nota(P, 'ciudad', 'Condena de ' + culp + ' a ' + (5 - culp) + ': pierdes el cargo del año.'); }
    else terminar(P, 'desterrado', 'Los jueces te condenan por ' + culp + ' a ' + (5 - culp) + ' y te destierran diez años. Tu casa queda sin cabeza.');
    P.juicio = null;
  }
  function resuelveCuentas(P) {
    if (P.juicio) veredicto(P); else P.veredicto = { tipo: 'ninguno', culpables: 0, de: 0, cargos: [], votos: [] };
    if (P.fin) return;
    let m = null; for (const i of Object.keys(P.casas)) { if (i === 'tuya' && P.cedido) continue; if (m === null || P.casas[i].fama > P.casas[m].fama) m = i; }
    P.cargo = m; nota(P, 'ciudad', Cn(P, m) + ' recibe el cargo del año.');
  }

  function resumen(P) {
    const t = P.casas.tuya; const e = Math.min(P.estacion, 3);
    return 'Atenas, ' + (-P.anio) + ' a.C. · ' + DATOS.ESTACIONES[e] + ' · pasos ' + P.pasos + ' · plata ' + t.plata + ' · fama ' + t.fama + ' · discordia ' + P.discordia + '/6'
      + (P.duelo ? ' · duelo' : '') + (P.juicio ? ' · juicio' : '') + (P.fin ? ' · FIN: ' + P.fin.resultado : '');
  }
  // Cadena que distingue una partida de otra: asuntos del año, rivales y resultado de cada voto.
  function firma(P) {
    return P.agenda.map(a => a.id).join(',') + '|' + P.rivales.slice().sort().join(',') + '|' + P.votos.map(v => v.asunto + ':' + v.resultado + ':' + v.duelo.map(x => x.resp[0]).join('')).join(',') + '|' + (P.veredicto ? P.veredicto.tipo : '');
  }

  // ---- PL4: guardado antiguo, vasija (escenas del año) e hitos ----
  // Un P de la versión 2 no trae los campos nuevos: se rellenan. Devuelve el mismo P.
  function migra(P) { if (P && P.v < 3) { P.v = 3; if (P.oraculo === undefined) P.oraculo = null; if (P.huesped === undefined) P.huesped = null; if (P.boda === undefined) P.boda = null; if (P.testigo === undefined) P.testigo = false; } return P; }
  // Hasta 8 escenas {estacion, quien, texto, tipo} de la crónica: sin repetir, y al menos una por estación con crónica. Pura (no usa azar).
  function escenas(P) {
    const tipoDe = c => /se aprueba|se rechaza/.test(c.texto) ? 'voto' : /absuelven|Condena de|te condenan|destierran/.test(c.texto) ? 'veredicto' : /te acusa ante/.test(c.texto) ? 'juicio'
      : /^El año acaba|revuelta|^Los jueces te condenan/.test(c.texto) ? 'fin' : c.quien === 'tuya' ? 'tuya' : c.quien === 'ciudad' || c.quien === 'pueblo' ? 'ciudad' : 'rival';
    const PESO = { fin: 6, veredicto: 6, voto: 5, juicio: 5, tuya: 3, ciudad: 1, rival: 0.5 };
    // PL4b: lo tuyo, los votos y el veredicto mandan; de los rivales, como mucho una banda (más solo si una estación no tiene otra cosa).
    // Dos frases que empiezan igual («Das un banquete…» y «Das un banquete… Entre copas…») cuentan como una.
    const vistos = new Set(), l = [], clave = t => t.split(/[.:;]/)[0].trim();
    P.cronica.forEach((c, i) => { if (vistos.has(clave(c.texto)) || /^Llega el /.test(c.texto)) return; vistos.add(clave(c.texto)); const tipo = tipoDe(c); l.push({ i, estacion: c.estacion, quien: c.quien, texto: c.texto, tipo, pt: PESO[tipo] + (tipo === 'tuya' && /oráculo|huésped|boda|testigo/.test(c.texto) ? 1 : 0) - (/^(Dejas pasar el tiempo|No preguntas nada)/.test(c.texto) ? 2.5 : 0) }); });
    if (!l.length && P.cronica.length) { const c = P.cronica[0]; l.push({ i: 0, estacion: c.estacion, quien: c.quien, texto: c.texto, tipo: tipoDe(c), pt: 1 }); }
    const elegidas = [];
    for (const e of Array.from(new Set(l.map(x => x.estacion)))) { const m = l.filter(x => x.estacion === e).sort((a, b) => b.pt - a.pt || a.i - b.i)[0]; if (m) elegidas.push(m); }
    let rivales = elegidas.filter(x => x.tipo === 'rival').length;
    for (const x of l.slice().sort((a, b) => b.pt - a.pt || a.i - b.i)) { if (elegidas.length >= 8) break; if (elegidas.includes(x)) continue;
      if (x.tipo === 'rival') { if (rivales >= 1) continue; rivales++; } elegidas.push(x); }
    return elegidas.sort((a, b) => a.i - b.i).map(x => ({ estacion: x.estacion, quien: x.quien, texto: x.texto, tipo: x.tipo }));
  }
  // Asuntos aprobados este año, cada uno con lo que deja dibujado en la ciudad.
  function hitos(P) {
    const out = [];
    for (const v of P.votos) { if (v.resultado !== 'si') continue; const a = asunto(P, v.asunto); if (!a || !a.hito || out.some(h => h.id === a.id)) continue;
      out.push({ id: a.id, asunto: a.nombre, cinta: a.hito.cinta, texto: a.hito.texto, etiqueta: a.hito.etiqueta, fuente: a.hito.fuente }); }
    return out;
  }

  const POLITEIA = { nueva, acciones, jugar, pasar, resumen, firma, escenas, hitos, migra, DATOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = POLITEIA; else root.POLITEIA = POLITEIA;
})(typeof self !== 'undefined' ? self : globalThis);
