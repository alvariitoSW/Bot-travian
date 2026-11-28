/* AQVILA — PL1 Politeia: reglas del año político (agenda, intrigas, debate, cuentas). Lógica pura (corre en Node), sin pantalla.
   Estado P: solo datos JSON (se puede guardar con JSON.stringify). Azar con semilla en P.rng. Ver gobierno/specs/PL1.md.
   Provisional (PL1): cinco casas tal cual; pistas 0–6; régimen fijo; ostracismo como acción simple; un solo año; rentas de 10 de plata por estación. */
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
    const P = { v: 1, polis, anio: D.anio, rng: (o.semilla == null ? 1 : o.semilla) | 0, estacion: 0, pasos: 3, casas: {}, personas: [], rivales: [], discordia: 0,
      agenda: [], debate: [], ventaja: 0, secretos: [], sabidos: [], cargo: null, cronica: [], fin: null, votos: [], extra: {}, conv: {}, cedido: false, cerrando: false };
    az(P); az(P);
    for (const c of D.casas) {
      const v = () => 0.8 + 0.4 * az(P);
      P.casas[c.id] = { id: c.id, nombre: c.nombre, emblema: c.emblema, comarca: c.comarca, lema: c.lema, grieta: c.grieta,
        influencia: Math.max(1, Math.round(c.influencia * v())), plata: Math.round(c.plata * v()), fama: c.fama,
        trato: c.id === 'tuya' ? 0 : ent(P, 3) - 1, caracter: c.id === 'tuya' ? 'tuya' : elige(P, DATOS.CARACTERES) };
    }
    if (o.nombreCasa) P.casas.tuya.nombre = o.nombreCasa;
    P.personas = D.personas.map(p => ({ id: p.id, nombre: p.nombre, casa: p.casa }));
    P.rivales = baraja(P, otras(P)).slice(0, 2);
    P.agenda = baraja(P, D.asuntos.map(a => a.id)).slice(0, 3).map(id => ({ id, pista: 1 + ent(P, 3), emp: {} }));
    P.cargo = Object.keys(P.casas).reduce((m, i) => P.casas[i].fama > P.casas[m].fama ? i : m, 'tuya');
    nota(P, 'ciudad', 'Atenas, año ' + (-D.anio) + ' a.C. Las casas ' + P.rivales.map(r => 'del ' + P.casas[r].nombre).join(' y ') + ' juegan contra ti.');
    return P;
  }

  function acciones(P) {
    if (P.fin) return [];
    const t = P.casas.tuya, C = DATOS.COSTES, e = P.estacion, out = [];
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
      if (paga('enviado')) mk('enviado');
      if (paga('ofrenda')) mk('ofrenda');
    } else if (e === 2) {
      if (paga('discurso')) mk('discurso');
      if (paga('convencer')) mk('convencer', ot.filter(c => !P.conv[c]));
      if (paga('comprar')) mk('comprar');
    } else {
      if (paga('pagar_jueces') && P.secretos.length) mk('pagar_jueces');
      if (paga('dar_cuentas')) mk('dar_cuentas');
      if (P.cargo === 'tuya') mk('ceder_cargo');
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
  const secreto = (P, t) => P.secretos.push({ t, p: 0.25 });

  // Lo que hace el jugador con cada acción. Devuelve la frase de la crónica.
  const EJEC = {
    hablar(P, o) { const [id, d] = o.split(':'); const a = P.agenda.find(x => x.id === id); a.pista = clamp(a.pista + (d === '+' ? 1 : -1), 0, 6); a.emp.tuya = (a.emp.tuya || 0) + 1;
      return 'Hablas en el Consejo ' + (d === '+' ? 'a favor' : 'en contra') + ' de «' + asunto(P, id).nombre + '».'; },
    favor(P, o) { const [c, id] = o.split('>'); const a = P.agenda.find(x => x.id === id); a.pista = clamp(a.pista + 2, 0, 6); a.emp.tuya = (a.emp.tuya || 0) + 1; P.casas[c].trato -= 1;
      return 'Cobras un favor a ' + cn(P, c) + ' para empujar «' + asunto(P, id).nombre + '».'; },
    pagar(P, id) { const a = P.agenda.find(x => x.id === id); a.pista = clamp(a.pista + 2, 0, 6); a.emp.tuya = (a.emp.tuya || 0) + 1; secreto(P, 'compró apoyo en el Consejo');
      return 'Pagas apoyos en el Consejo para «' + asunto(P, id).nombre + '». Nadie debe saberlo.'; },
    banquete(P, c) { const k = P.casas[c]; k.trato = clamp(k.trato + 1, -3, 3); let x = '';
      if (az(P) < 0.3) { P.sabidos.push({ casa: c, texto: k.grieta }); x = ' Entre copas te cuentan algo: ' + k.grieta + '.'; }
      return 'Das un banquete a ' + cn(P, c) + '.' + x; },
    rumor(P, c) { const k = P.casas[c]; const sabe = P.sabidos.some(s => s.casa === c); k.influencia = Math.max(1, k.influencia - (sabe ? 2 : 1)); secreto(P, 'soltó un rumor contra ' + cn(P, c)); let x = '';
      if (az(P) < 0.35) { k.trato = clamp(k.trato - 2, -3, 3); subeDisc(P, 1); x = ' Se descubre de dónde sale el rumor.'; }
      return 'Sueltas un rumor contra ' + cn(P, c) + '.' + x; },
    enviado(P) { P.casas.tuya.plata += 40; let x = ''; if (P.rivales.includes('delfin')) { P.casas.delfin.trato = clamp(P.casas.delfin.trato - 1, -3, 3); x = ' Al Delfín no le gusta que le pises el puerto.'; }
      return 'Mandas un enviado al puerto y vuelve con plata.' + x; },
    ofrenda(P) { P.ventaja += 1; return 'Haces una ofrenda en el santuario. Los dioses te miran bien.'; },
    discurso(P) { P.ventaja += 1; return 'Das un discurso en la asamblea y la plaza te escucha.'; },
    convencer(P, c) { const p = clamp(0.5 + 0.15 * P.casas[c].trato, 0.1, 0.9);
      if (az(P) < p) { P.conv[c] = true; return 'Convences a ' + cn(P, c) + ' de que vote contigo.'; }
      return cn(P, c) + ' no se deja convencer.'; },
    comprar(P) { P.ventaja += 3; secreto(P, 'compró piedras de voto'); return 'Compras piedras de voto. Alguien las contó.'; },
    pagar_jueces(P) { let m = null; for (const s of P.secretos) if (!m || s.p > m.p) m = s; if (m) m.p = Math.max(0.05, m.p - 0.15); secreto(P, 'pagó a los jueces');
      return 'Pagas a los jueces para que miren hacia otro lado.'; },
    dar_cuentas(P) { for (const s of P.secretos) s.p *= 0.9; return 'Das cuentas claras ante los jueces. Algo de confianza gana la casa.'; },
    ceder_cargo(P) { P.cargo = null; P.cedido = true; let m = -1; P.secretos.forEach((s, i) => { if (m < 0 || s.p > P.secretos[m].p) m = i; }); if (m >= 0) P.secretos.splice(m, 1);
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
    const texto = EJEC[id](P, obj); nota(P, 'tuya', texto);
    P.pasos--; if (!P.fin && P.pasos <= 0) cierra(P);
    return { ok: true, texto };
  }
  function pasar(P) {
    if (P.fin) return { ok: false, texto: 'El año ya acabó.' };
    let m = null; for (const c of otras(P)) if (!m || P.casas[c].trato > P.casas[m].trato) m = c;
    P.casas[m].trato = clamp(P.casas[m].trato - 1, -3, 3);
    const texto = 'Dejas pasar el tiempo. ' + Cn(P, m) + ' se siente desatendida.'; nota(P, 'tuya', texto);
    P.pasos--; if (P.pasos <= 0) cierra(P);
    return { ok: true, texto };
  }

  // Los rivales juegan solos, según su carácter.
  function juegaRival(P, id) {
    const c = P.casas[id], e = P.estacion, n = Cn(P, id);
    if (e === 0) {
      const dep = P.agenda.filter(a => { const A = asunto(P, a.id); return A.pro.includes(id) || A.contra.includes(id); });
      const a = elige(P, dep.length ? dep : P.agenda), A = asunto(P, a.id);
      const d = A.contra.includes(id) ? -1 : 1;
      if (c.caracter === 'rico' && c.plata >= 30 && az(P) < 0.5) { c.plata -= 30; a.pista = clamp(a.pista + 2 * d, 0, 6); a.emp[id] = (a.emp[id] || 0) + 2; nota(P, id, n + ' reparte plata para ' + (d > 0 ? 'apoyar' : 'frenar') + ' «' + A.nombre + '».'); }
      else { a.pista = clamp(a.pista + d, 0, 6); a.emp[id] = (a.emp[id] || 0) + (c.caracter === 'ambicioso' ? 2 : 1); nota(P, id, n + (d > 0 ? ' empuja ' : ' frena ') + '«' + A.nombre + '» en el Consejo.'); }
    } else if (e === 1) {
      let acc = { astuto: 'rumor', ambicioso: 'rumor', rico: 'banquete', piadoso: 'ofrenda' }[c.caracter];
      if (az(P) < 0.3) acc = elige(P, ['rumor', 'banquete', 'enviado', 'ofrenda']);
      if ((acc === 'banquete' && c.plata < 25) || (acc === 'ofrenda' && c.plata < 20)) acc = 'enviado';
      const obj = az(P) < 0.5 ? 'tuya' : elige(P, otras(P).filter(x => x !== id)), k = P.casas[obj];
      if (acc === 'rumor') {
        k.influencia = Math.max(1, k.influencia - 1);
        if (az(P) < 0.35) { if (obj === 'tuya') c.trato = clamp(c.trato - 2, -3, 3); nota(P, id, n + ' suelta un rumor contra ' + cn(P, obj) + ' y se nota quién fue.'); subeDisc(P, 1); }
        else nota(P, id, n + ' suelta un rumor contra ' + cn(P, obj) + '.');
      } else if (acc === 'banquete') { c.plata -= 25; if (obj === 'tuya') c.trato = clamp(c.trato + 1, -3, 3); nota(P, id, n + ' da un banquete para ' + cn(P, obj) + '.'); }
      else if (acc === 'ofrenda') { c.plata -= 20; P.extra[id] = (P.extra[id] || 0) + 1; nota(P, id, n + ' hace una ofrenda en el santuario.'); }
      else { c.plata += 40; nota(P, id, n + ' manda un barco al puerto y gana plata.'); }
    } else if (e === 2) {
      if ((c.caracter === 'rico' || az(P) < 0.2) && c.plata >= 40) { c.plata -= 40; P.extra[id] = (P.extra[id] || 0) + 3; nota(P, id, n + ' compra piedras de voto.'); }
      else { P.extra[id] = (P.extra[id] || 0) + 1; nota(P, id, n + ' habla a la asamblea.'); }
    } else {
      if (c.caracter === 'rico' && c.plata >= 30) { c.plata -= 30; c.fama += 1; nota(P, id, n + ' paga a los jueces.'); }
      else { c.fama += 1; nota(P, id, n + ' da cuentas y gana buen nombre.'); }
    }
  }

  function cierra(P) {
    for (const r of P.rivales) { juegaRival(P, r); juegaRival(P, r); if (P.fin) return; }
    P.cerrando = true;
    const e = P.estacion;
    if (e === 0) resuelveAgenda(P); else if (e === 2) resuelveDebate(P); else if (e === 3) resuelveCuentas(P);
    if (!P.fin && P.rivales.some(r => P.casas[r].caracter === 'ambicioso')) { nota(P, 'ciudad', 'Un ambicioso agita la ciudad.'); subeDisc(P, 1); }
    if (!P.fin) {
      for (const i of Object.keys(P.casas)) P.casas[i].plata += 10;
      if (e === 3) terminar(P, 'sigue', 'El año acaba. Sigues en Atenas con tu casa en pie.');
      else { P.estacion++; P.pasos = 3; nota(P, 'ciudad', 'Llega el ' + ['verano', 'otoño', 'invierno'][e] + '. ' + DATOS.ACTOS[e + 1] + '.'); }
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

  function resuelveDebate(P) {
    const t = P.casas.tuya;
    for (const d of P.debate) {
      const A = asunto(P, d.id), lados = { si: 0, no: 0 }, voto = {};
      for (const id of Object.keys(P.casas)) {
        const c = P.casas[id]; let v;
        if (id === 'tuya') v = d.presentador === 'tuya' ? 'si' : A.pueblo;
        else if (P.conv[id]) v = d.presentador === 'tuya' ? 'si' : A.pueblo;
        else { const s = (A.pro.includes(id) ? 2 : 0) - (A.contra.includes(id) ? 2 : 0) + (d.presentador === 'tuya' ? c.trato : 0); v = s > 0 ? 'si' : s < 0 ? 'no' : (az(P) < 0.5 ? 'si' : 'no'); }
        voto[id] = v; lados[v] += c.influencia + (P.extra[id] || 0) + (id === 'tuya' ? P.ventaja : 0);
      }
      lados[A.pueblo] += 3 + ent(P, 3) - 1;
      const res = lados.si > lados.no ? 'si' : lados.no > lados.si ? 'no' : A.pueblo, ef = A.efectos[res];
      const perj = otras(P).filter(i => voto[i] !== res);
      for (const i of ef.perjudica) if (!perj.includes(i)) perj.push(i);
      t.plata = Math.max(0, t.plata + (ef.plata || 0)); t.fama = Math.max(0, t.fama + (ef.fama || 0));
      for (const k of Object.keys(ef.trato || {})) P.casas[k].trato = clamp(P.casas[k].trato + ef.trato[k], -3, 3);
      for (const i of perj) P.casas[i].trato = clamp(P.casas[i].trato - 1, -3, 3);
      for (const i of ef.perjudica) P.casas[i].influencia = Math.max(1, P.casas[i].influencia - 1);
      if (d.presentador === 'tuya' && res === 'si') { t.fama += 2; }
      P.votos.push({ asunto: d.id, resultado: res, perjudicadas: perj, presentador: d.presentador });
      nota(P, 'ciudad', '«' + A.nombre + '» ' + (res === 'si' ? 'se aprueba' : 'se rechaza') + ' (' + lados.si + ' a ' + lados.no + '). Sale perdiendo ' + perj.map(i => cn(P, i)).join(' y ') + '.');
      subeDisc(P, ef.discordia || 0); if (P.fin) return;
      if (res !== A.pueblo) { nota(P, 'pueblo', 'El pueblo no consigue lo que quería y murmura.'); subeDisc(P, 1); if (P.fin) return; }
    }
    P.ventaja = 0; P.extra = {};
  }

  function resuelveCuentas(P) {
    const t = P.casas.tuya, astutos = P.rivales.filter(r => P.casas[r].caracter === 'astuto').length; let fuera = 0;
    for (const s of P.secretos) {
      if (az(P) < clamp(s.p + 0.1 * astutos, 0, 1)) {
        fuera++;
        if (t.plata >= 40) { t.plata -= 40; nota(P, 'ciudad', 'Sale a la luz que ' + s.t + '. Pagas una multa de 40.'); }
        else { t.fama -= 2; nota(P, 'ciudad', 'Sale a la luz que ' + s.t + '. No puedes pagar y pierdes buen nombre.'); }
      }
    }
    P.secretos = [];
    if (fuera >= 3 || t.fama < 0) { terminar(P, 'desterrado', 'Los jueces te destierran diez años. Tu casa queda sin cabeza.'); return; }
    let m = null; for (const i of Object.keys(P.casas)) { if (i === 'tuya' && P.cedido) continue; if (m === null || P.casas[i].fama > P.casas[m].fama) m = i; }
    P.cargo = m; nota(P, 'ciudad', Cn(P, m) + ' recibe el cargo del año.');
  }

  function resumen(P) {
    const t = P.casas.tuya; const e = Math.min(P.estacion, 3);
    return 'Atenas, ' + (-P.anio) + ' a.C. · ' + DATOS.ESTACIONES[e] + ' · pasos ' + P.pasos + ' · plata ' + t.plata + ' · fama ' + t.fama + ' · discordia ' + P.discordia + '/6'
      + (P.fin ? ' · FIN: ' + P.fin.resultado : '');
  }
  // Cadena que distingue una partida de otra: asuntos del año, rivales y resultado de cada voto.
  function firma(P) {
    return P.agenda.map(a => a.id).join(',') + '|' + P.rivales.slice().sort().join(',') + '|' + P.votos.map(v => v.asunto + ':' + v.resultado).join(',');
  }

  const POLITEIA = { nueva, acciones, jugar, pasar, resumen, firma, DATOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = POLITEIA; else root.POLITEIA = POLITEIA;
})(typeof self !== 'undefined' ? self : globalThis);
