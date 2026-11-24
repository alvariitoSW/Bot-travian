/* AQVILA — CD4: el Plan del Senado (reglas). Lógica pura (corre en Node), sin pantalla. No llama a game.js.
   El jugador arma un plan de obras de 4 a 8 estaciones, con una prioridad; el Senado lo vota; si sale, los ministros lo ejecutan
   (encargos de js/ministros.js) y al final el Senado juzga cuántas obras se hicieron.
   Solo escribe en s.planSenado = { v, seq, borrador, plan, votacion:{est,n,firmas}, avisos:[{texto,tono,est,clave}], historial:[] }.
   NOTA HISTÓRICA: Licencia de juego. Lo más parecido: el Senado daba los fondos a los censores para las obras públicas
   (Polibio 6.13; contratos de los censores, Livio 39.44 y 40.46). */
(function (root) {
  'use strict';
  const D = root.DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const MIN = root.MINISTROS || (typeof require !== 'undefined' ? require('./ministros.js') : null);
  const P = { MIN_EST: 4, MAX_EST: 8, POR_EST: 3, MAX_OBRAS: 16, VOTOS_EST: 3, ABANDONO: -3, JUICIO: { bien: 0.8, mal: 0.5, premio: 2, castigo: -3 } };
  P.PRIORIDADES = {
    crecer: { n: 'Crecer', bando: 'ter' }, defender: { n: 'Defender', bando: 'mil' },
    plebe: { n: 'Contentar a la plebe', bando: 'pue' }, riqueza: { n: 'Enriquecerse', bando: 'mer' }
  };
  const BANDOS_INI = ['ter', 'mer', 'mil'];

  const obj = x => x && typeof x === 'object' && !Array.isArray(x);
  const mesDe = s => Math.floor((s.t || 0) + 1e-9);
  const estDe = mes => Math.floor(mes / D.TURNO_MESES);
  const nombreB = b => (D.BUILD[b] && D.BUILD[b].n) || b;
  const nombreC = id => (D.CITIES[id] && D.CITIES[id].n) || id;
  const J = x => JSON.stringify(x);
  const nivelB = (c, b) => (c && c.b && c.b[b]) || 0;
  const activos = s => (s.senado && s.senado.bandos) || BANDOS_INI;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ficha = mid => MIN.DATOS.find(f => f.id === mid);

  P.migrar = s => {
    if (!obj(s.planSenado)) s.planSenado = {};
    const p = s.planSenado; p.v = 1;
    if (typeof p.seq !== 'number') p.seq = 0;
    if (!obj(p.borrador)) p.borrador = null;
    if (!obj(p.plan)) p.plan = null;
    if (!obj(p.votacion)) p.votacion = {};
    if (typeof p.votacion.est !== 'number') p.votacion.est = -1;
    if (typeof p.votacion.n !== 'number') p.votacion.n = 0;
    if (!Array.isArray(p.votacion.firmas)) p.votacion.firmas = [];
    if (!Array.isArray(p.avisos)) p.avisos = [];
    if (!Array.isArray(p.historial)) p.historial = [];
    if (p.borrador && !Array.isArray(p.borrador.obras)) p.borrador.obras = [];
    if (p.plan && !Array.isArray(p.plan.obras)) p.plan.obras = [];
    return s;
  };

  /* ---------- obras y ministros ---------- */
  /* dueño del edificio (de quién es el bando que vota) y ministro que lo ejecuta: si el dueño no admite encargos de nivel
     (Hacienda, Ciencia), lo ejecuta el Censor, que contrataba las obras públicas (decisión de CD4) */
  const dueno = b => D.BUILD[b] ? (MIN.DATOS.find(x => x.edificios.indexOf(b) >= 0) || null) : null;
  P.ministroDe = b => { const f = dueno(b); if (!f) return null; return f.tipos.indexOf('nivel') >= 0 ? f.id : 'infra'; };
  P.bandoDe = b => { const f = dueno(b); return f ? f.bando : null; };
  P.coste = (s, b, nivelActual, ayuda) => {
    if (ayuda && typeof ayuda.coste === 'function') return ayuda.coste(b, nivelActual);
    const base = (D.BUILD[b] && D.BUILD[b].cost) || {}, out = {};
    for (const k in base) out[k] = Math.round(base[k] * (nivelActual + 1) / 5) * 5;
    return out;
  };
  const mias = s => Object.keys(s.cities).filter(id => s.cities[id].owner === 'roma')
    .sort((a, b) => (s.cities[b].pop || 0) - (s.cities[a].pop || 0) || (a < b ? -1 : 1));
  const textoObra = o => {
    const f = ficha(o.mid);
    return 'Subir ' + nombreB(o.b) + ' a nivel ' + o.nivel + ' en ' + nombreC(o.ciudad) + (f ? ' (' + f.cargo + ')' : '');
  };

  /* Revisa un conjunto de obras: niveles seguidos desde el actual, estaciones sin volver atrás y Foro ganado antes.
     Devuelve '' o el motivo; con `fuera` devuelve también la primera obra mala. */
  const motivoDe = (s, obras) => {
    const grupos = {};
    obras.forEach(o => { (grupos[o.ciudad + ':' + o.b] = grupos[o.ciudad + ':' + o.b] || []).push(o); });
    for (const k in grupos) {
      const g = grupos[k].slice().sort((a, b) => a.nivel - b.nivel), c = s.cities[g[0].ciudad];
      for (let i = 0; i < g.length; i++) {
        if (g[i].nivel !== nivelB(c, g[i].b) + i + 1) return { m: 'Ese nivel no sigue al anterior', o: g[i] };
        if (i > 0 && g[i].est < g[i - 1].est) return { m: 'Ese nivel va después del anterior', o: g[i] };
      }
    }
    for (const o of obras) {
      const c = s.cities[o.ciudad]; if (!c) continue;
      if (o.nivel > D.MAX_LVL) return { m: 'Ya está al máximo', o };
      if (o.b === 'foro') continue;
      const foro = nivelB(c, 'foro') + obras.filter(x => x.ciudad === o.ciudad && x.b === 'foro' && x.est < o.est).length;
      const t = MIN.topeForo({ b: { foro } }, o.b, o.nivel);
      if (t) return { m: t, o };
    }
    return null;
  };

  P.catalogo = (s, borrador) => {
    const obras = (borrador && borrador.obras) || [], out = [];
    for (const cid of mias(s)) {
      const c = s.cities[cid];
      for (const f of MIN.DATOS) {
        for (const b of f.edificios) {
          if (!D.BUILD[b]) continue;
          const mid = P.ministroDe(b);
          const nivel = nivelB(c, b) + obras.filter(o => o.ciudad === cid && o.b === b).length + 1;
          if (nivel > D.MAX_LVL) continue;
          const foro = nivelB(c, 'foro') + obras.filter(o => o.ciudad === cid && o.b === 'foro').length;
          if (MIN.topeForo({ b: { foro } }, b, nivel)) continue;
          const o = { ciudad: cid, b, nivel, mid };
          out.push({ ciudad: cid, b, nivel, mid, bando: f.bando, coste: P.coste(s, b, nivel - 1), texto: textoObra(o) });
        }
      }
    }
    return out;
  };

  /* ---------- borrador ---------- */
  const enMarcha = s => !!s.planSenado.plan;
  P.nuevo = (s, estaciones, prioridad) => {
    P.migrar(s);
    if (enMarcha(s)) return { ok: false, motivo: 'Ya hay un plan en marcha' };
    if (!(estaciones >= P.MIN_EST && estaciones <= P.MAX_EST) || estaciones !== Math.floor(estaciones)) return { ok: false, motivo: 'Elige entre ' + P.MIN_EST + ' y ' + P.MAX_EST + ' estaciones' };
    if (!P.PRIORIDADES[prioridad]) return { ok: false, motivo: 'Esa prioridad no existe' };
    s.planSenado.borrador = { estaciones, prioridad, obras: [] };
    return { ok: true, motivo: '' };
  };
  P.poner = (s, o) => {
    P.migrar(s); const B = s.planSenado.borrador;
    if (enMarcha(s)) return { ok: false, motivo: 'Ya hay un plan en marcha' };
    if (!B) return { ok: false, motivo: 'Elige entre ' + P.MIN_EST + ' y ' + P.MAX_EST + ' estaciones' };
    if (!(o && o.est >= 0 && o.est < B.estaciones && o.est === Math.floor(o.est))) return { ok: false, motivo: 'Esa estación no está en el plan' };
    const c = s.cities[o.ciudad];
    if (!c || c.owner !== 'roma') return { ok: false, motivo: 'La ciudad no es tuya' };
    const mid = P.ministroDe(o.b);
    if (!mid) return { ok: false, motivo: 'Ningún ministro hace esa obra' };
    const nivel = nivelB(c, o.b) + B.obras.filter(x => x.ciudad === o.ciudad && x.b === o.b).length + 1;
    if (nivel > D.MAX_LVL) return { ok: false, motivo: 'Ya está al máximo' };
    if (B.obras.filter(x => x.est === o.est).length >= P.POR_EST) return { ok: false, motivo: 'Caben ' + P.POR_EST + ' obras por estación' };
    if (B.obras.length >= P.MAX_OBRAS) return { ok: false, motivo: 'Caben ' + P.MAX_OBRAS + ' obras' };
    const nueva = { id: 'o' + (s.planSenado.seq + 1), ciudad: o.ciudad, b: o.b, nivel, est: o.est, mid };
    const mal = motivoDe(s, B.obras.concat([nueva]));
    if (mal) return { ok: false, motivo: mal.m };
    s.planSenado.seq++; B.obras.push(nueva);
    return { ok: true, motivo: '', obra: nueva };
  };
  /* quita las obras que han quedado sin sentido (niveles que saltan, Foro perdido) */
  const limpiar = (s, B) => { for (;;) { const mal = motivoDe(s, B.obras); if (!mal) return; B.obras = B.obras.filter(x => !(x === mal.o || (x.ciudad === mal.o.ciudad && x.b === mal.o.b && x.nivel > mal.o.nivel))); } };
  P.quitar = (s, id) => {
    P.migrar(s); const B = s.planSenado.borrador;
    if (!B) return { ok: false, motivo: 'No hay borrador', quitadas: 0 };
    const i = B.obras.findIndex(x => x.id === id); if (i < 0) return { ok: false, motivo: 'Esa obra no está', quitadas: 0 };
    const antes = B.obras.length;
    B.obras.splice(i, 1);
    // los niveles posteriores del mismo edificio y ciudad saltarían: se quitan; y lo que perdió el Foro
    limpiar(s, B);
    return { ok: true, motivo: '', quitadas: antes - B.obras.length };
  };
  P.mover = (s, id, est) => {
    P.migrar(s); const B = s.planSenado.borrador;
    if (!B) return { ok: false, motivo: 'No hay borrador' };
    const o = B.obras.find(x => x.id === id); if (!o) return { ok: false, motivo: 'Esa obra no está' };
    if (!(est >= 0 && est < B.estaciones && est === Math.floor(est))) return { ok: false, motivo: 'Esa estación no está en el plan' };
    if (B.obras.filter(x => x.est === est && x !== o).length >= P.POR_EST) return { ok: false, motivo: 'Caben ' + P.POR_EST + ' obras por estación' };
    const prueba = B.obras.map(x => x === o ? Object.assign({}, x, { est }) : x);
    const mal = motivoDe(s, prueba); if (mal) return { ok: false, motivo: mal.m };
    o.est = est; return { ok: true, motivo: '' };
  };
  P.cambiarPrioridad = (s, p) => {
    P.migrar(s); const B = s.planSenado.borrador;
    if (!B) return { ok: false, motivo: 'No hay borrador' };
    if (!P.PRIORIDADES[p]) return { ok: false, motivo: 'Esa prioridad no existe' };
    B.prioridad = p; return { ok: true, motivo: '' };
  };
  P.cambiarEstaciones = (s, n) => {
    P.migrar(s); const B = s.planSenado.borrador;
    if (!B) return { ok: false, motivo: 'No hay borrador', quitadas: 0 };
    if (!(n >= P.MIN_EST && n <= P.MAX_EST) || n !== Math.floor(n)) return { ok: false, motivo: 'Elige entre ' + P.MIN_EST + ' y ' + P.MAX_EST + ' estaciones', quitadas: 0 };
    const antes = B.obras.length;
    B.obras = B.obras.filter(x => x.est < n); B.estaciones = n;
    limpiar(s, B);
    return { ok: true, motivo: '', quitadas: antes - B.obras.length };
  };

  /* Un borrador razonable, sin azar: cada estación una obra del afín a la prioridad y otra de otro bando activo (rotando). */
  P.sugerir = (s, estaciones, prioridad, ayuda) => {
    void ayuda;
    const r = P.nuevo(s, estaciones, prioridad); if (!r.ok) return r;
    const B = s.planSenado.borrador, afin = P.PRIORIDADES[prioridad].bando;
    const otros = activos(s).filter(b => b !== afin && MIN.DATOS.some(f => f.bando === b && f.edificios.some(x => D.BUILD[x] && P.ministroDe(x))));
    const orden = {}; mias(s).forEach((id, i) => { orden[id] = i; });
    const intentar = (bando, est) => {
      const cat = P.catalogo(s, B).filter(x => x.bando === bando)
        .sort((a, b) => orden[a.ciudad] - orden[b.ciudad] || a.nivel - b.nivel);   // estable: mantiene el orden de ministros
      for (const x of cat) if (P.poner(s, { ciudad: x.ciudad, b: x.b, est }).ok) return true;
      return false;
    };
    for (let e = 0; e < estaciones; e++) {
      if (!intentar(afin, e)) {
        // el afín no cabe: casi siempre falta Foro; se sube para poder seguir en la estación siguiente
        const c = mias(s).find(id => P.poner(s, { ciudad: id, b: 'foro', est: e }).ok); void c;
      }
      for (let j = 0; j < otros.length; j++) if (intentar(otros[(e + j) % otros.length], e)) break;
    }
    return { ok: true, motivo: '' };
  };

  /* ---------- votación ---------- */
  const bandoObra = o => P.bandoDe(o.b);
  P.postura = (s, B, b) => {
    const obras = (B && B.obras) || [], rival = (D.BANDOS[b] && D.BANDOS[b].rival) || [];
    const suyas = obras.filter(o => bandoObra(o) === b).length;
    const riv = obras.filter(o => rival.indexOf(bandoObra(o)) >= 0).length;
    const afin = B && P.PRIORIDADES[B.prioridad] ? P.PRIORIDADES[B.prioridad].bando : null;
    let p = Math.min(2, 0.5 * suyas) - 0.25 * riv - (suyas === 0 && obras.length >= 4 ? 1 : 0);
    if (afin) p += (afin === b ? 1 : 0) - ((D.BANDOS[afin].rival || []).indexOf(b) >= 0 ? 1 : 0);
    return clamp(p, -2, 2);
  };
  P.comoLey = (s, B) => {
    const postura = {};
    for (const b in D.BANDOS) postura[b] = P.postura(s, B, b);
    const n = B ? B.estaciones : 0;
    return { id: 'plan-senado', tipo: 'obra', n: 'Plan de obras de ' + n + ' estaciones', postura, chips: {}, h: 'Obras que los ministros harán en ' + n + ' estaciones. Licencia de juego: el Senado daba los fondos a los censores (Polibio 6.13).' };
  };
  P.votos = (s, B) => {
    const q = s.senado || {}, A = activos(s), por = {}; let si = 0, duda = 0, no = 0, esc = 0;
    for (const b of A) {
      const e = (q.escanos && q.escanos[b]) || 0, h = (q.humor && typeof q.humor[b] === 'number') ? q.humor[b] : 50;
      const p = P.postura(s, B, b) * 15 + (h - 50) / 2;
      const y = Math.round(clamp(e * (0.5 + p / 50) * 0.8, 0, e)), n = Math.round(clamp(e * (0.5 - p / 50) * 0.8, 0, e - y)), d = e - y - n;
      por[b] = { escanos: e, si: y, duda: d, no: n, trato: null }; si += y; duda += d; no += n; esc += e;
    }
    const familia = q.familia || 0; si += familia;
    const total = familia + esc, mayoria = Math.floor(total / 2) + 1;
    return { si, duda, no, porBando: por, familia, total, mayoria, sale: si >= mayoria };
  };
  const firma = B => B.obras.map(o => o.ciudad + ':' + o.b + ':' + o.nivel + ':' + o.est).sort().join('|') + '#' + B.prioridad + '#' + B.estaciones;
  P.puedeVotar = (s, mes) => {
    P.migrar(s); if (mes == null) mes = mesDe(s);
    const B = s.planSenado.borrador, v = s.planSenado.votacion, est = estDe(mes);
    if (enMarcha(s)) return { ok: false, motivo: 'Ya hay un plan en marcha' };
    if (!B) return { ok: false, motivo: 'Aún no has armado un plan' };
    const con = {}; B.obras.forEach(o => { con[o.est] = 1; });
    const hace = Math.ceil(B.estaciones / 2);
    if (Object.keys(con).length < hace) return { ok: false, motivo: 'Pon obras en al menos ' + hace + ' estaciones' };
    const n = v.est === est ? v.n : 0, firmas = v.est === est ? v.firmas : [];
    if (n >= P.VOTOS_EST) return { ok: false, motivo: 'El Senado no se reúne más esta estación' };
    if (firmas.indexOf(firma(B)) >= 0) return { ok: false, motivo: 'Cambia alguna obra antes de votar otra vez' };
    return { ok: true, motivo: '' };
  };
  P.votar = (s, mes, resultado) => {
    P.migrar(s); if (mes == null) mes = mesDe(s);
    const pv = P.puedeVotar(s, mes); if (!pv.ok) return { ok: false, motivo: pv.motivo, efectos: [] };
    const p = s.planSenado, B = p.borrador, v = p.votacion, est = estDe(mes);
    const r = resultado || P.votos(s, B);
    const mayoria = r.mayoria, sale = r.si >= mayoria;
    if (v.est !== est) { v.est = est; v.n = 0; v.firmas = []; }
    v.n++;
    const efectos = [];
    for (const b of activos(s)) {
      const g = Math.sign(P.postura(s, B, b)); if (!g) continue;
      efectos.push({ tipo: 'humor', bando: b, d: sale ? g * D.SENADO.postura : -g * D.SENADO.postura / 2, activo: true });
    }
    const cuenta = '(' + r.si + ' de ' + r.total + ')';
    if (sale) {
      p.seq++;
      p.plan = { id: 'p' + p.seq, e0: est, estaciones: B.estaciones, prioridad: B.prioridad, obras: B.obras.map(o => Object.assign({}, o, { hecha: false, perdida: false, atrasada: false })), aprobado: { si: r.si, total: r.total } };
      p.plan.humorVoto = {}; efectos.forEach(x => { if (x.tipo === 'humor') p.plan.humorVoto[x.bando] = x.d; });
      p.borrador = null; v.firmas = [];
      efectos.push({ tipo: 'log', texto: '🏛️ El Senado aprueba el plan de obras ' + cuenta + '. Los ministros se ponen a ello.', tono: 'good' });
    } else {
      v.firmas.push(firma(B));
      efectos.push({ tipo: 'log', texto: '🏛️ El Senado rechaza el plan ' + cuenta + '. Cambia obras y vota otra vez.', tono: 'bad' });
    }
    return { ok: true, motivo: '', sale, si: r.si, total: r.total, mayoria, efectos };
  };

  const guardarHistorial = (p, plan, juicio) => {
    const vivas = plan.obras.filter(o => !o.perdida);
    p.historial.push({ id: plan.id, e0: plan.e0, estaciones: plan.estaciones, hechas: vivas.filter(o => o.hecha).length, total: vivas.length, juicio });
    while (p.historial.length > 4) p.historial.shift();
  };
  const cancelarEncargos = (s, plan) => {
    const ids = plan.obras.map(o => o.id), e = s.ministros && s.ministros.encargos;
    if (!e) return;
    for (const mid in e) if (e[mid] && e[mid].plan && ids.indexOf(e[mid].plan) >= 0) MIN.cancelar(s, mid);
  };
  P.abandonar = (s, mes) => {
    P.migrar(s); MIN.migrar(s); if (mes == null) mes = mesDe(s);
    const p = s.planSenado, plan = p.plan;
    if (!plan) return { ok: false, motivo: 'No hay plan en marcha', efectos: [] };
    plan.obras.forEach(o => { if (!o.perdida && !o.hecha && nivelB(s.cities[o.ciudad], o.b) >= o.nivel) o.hecha = true; });
    const efectos = [], bandos = {};
    plan.obras.filter(o => !o.hecha && !o.perdida).forEach(o => { const b = bandoObra(o); if (b) bandos[b] = 1; });
    for (const b of activos(s)) if (bandos[b]) efectos.push({ tipo: 'humor', bando: b, d: P.ABANDONO, activo: true });
    // se devuelve lo que dio la votación
    const hv = plan.humorVoto || {};
    for (const b in hv) if (hv[b]) efectos.push({ tipo: 'humor', bando: b, d: -hv[b], activo: activos(s).indexOf(b) >= 0 });
    cancelarEncargos(s, plan); guardarHistorial(p, plan, 'abandonado'); p.plan = null; p.avisos = [];
    efectos.push({ tipo: 'log', texto: '🏛️ Abandonas el plan de obras. El Senado lo toma a mal.', tono: 'bad' });
    return { ok: true, motivo: '', efectos };
  };

  /* ---------- ejecución mensual ---------- */
  P.mes = (s, mes, ayuda) => {
    P.migrar(s); MIN.migrar(s); if (mes == null) mes = mesDe(s);
    const p = s.planSenado, est = estDe(mes), efectos = [];
    p.avisos = p.avisos.filter(a => a.est === est);
    const plan = p.plan; if (!plan) return { efectos, avisos: p.avisos };
    const aviso = (texto, tono, clave) => {
      if (p.avisos.some(a => (clave ? a.clave === clave : a.texto === texto))) return;
      p.avisos.push({ texto, tono, est, clave: clave || '' }); efectos.push({ tipo: 'log', texto, tono });
    };
    // 2. hechas y perdidas
    for (const o of plan.obras) {
      const c = s.cities[o.ciudad];
      if (o.perdida && c && c.owner === 'roma') o.perdida = false;   // ciudad recuperada: vuelve a contar
      if (!o.perdida && !(c && c.owner === 'roma')) { o.perdida = true; efectos.push({ tipo: 'log', texto: 'Se pierde la obra del plan con la ciudad: ' + textoObra(o), tono: 'bad' }); }
      if (!o.perdida && !o.hecha && nivelB(c, o.b) >= o.nivel) o.hecha = true;
    }
    const k = est - plan.e0;
    const vivas = () => plan.obras.filter(o => !o.perdida);
    // 6. fin del plan
    if (k >= plan.estaciones) {
      const v = vivas(), hechas = v.filter(o => o.hecha).length, total = v.length, r = total ? hechas / total : 1;
      const A = activos(s), texto = ' (' + hechas + ' de ' + total + ')';
      let juicio = 'regular';
      if (r >= P.JUICIO.bien) {
        juicio = 'bien'; A.forEach(b => efectos.push({ tipo: 'humor', bando: b, d: P.JUICIO.premio, activo: true }));
        efectos.push({ tipo: 'log', texto: '🏛️ El Senado alaba el plan de obras' + texto + '.', tono: 'good' });
      } else if (r < P.JUICIO.mal) {
        juicio = 'mal'; const con = {}; v.filter(o => !o.hecha).forEach(o => { const b = bandoObra(o); if (b) con[b] = 1; });
        A.filter(b => con[b]).forEach(b => efectos.push({ tipo: 'humor', bando: b, d: P.JUICIO.castigo, activo: true }));
        efectos.push({ tipo: 'log', texto: '🏛️ El Senado reprocha el plan de obras, casi sin hacer' + texto + '.', tono: 'bad' });
      } else efectos.push({ tipo: 'log', texto: '🏛️ El Senado da por cumplido a medias el plan de obras' + texto + '.', tono: 'info' });
      cancelarEncargos(s, plan); guardarHistorial(p, plan, juicio); p.plan = null; p.avisos = [];
      return { efectos, avisos: p.avisos };
    }
    // 3. pendientes
    const afin = P.PRIORIDADES[plan.prioridad] ? P.PRIORIDADES[plan.prioridad].bando : null;
    const pend = plan.obras.map((o, i) => ({ o, i })).filter(x => !x.o.hecha && !x.o.perdida && x.o.est <= k)
      .sort((a, b) => ((bandoObra(b.o) === afin) - (bandoObra(a.o) === afin)) || a.o.est - b.o.est || a.i - b.i).map(x => x.o);
    plan.obras.forEach(o => { o.atrasada = !o.hecha && !o.perdida && o.est < k; });
    // 4. encargos: una obra por ministro a la vez
    const enc = mid => s.ministros.encargos[mid];
    const usados = {}; pend.forEach(o => { const e = enc(o.mid); if (e && e.plan === o.id) usados[o.mid] = 1; });
    for (const o of pend) {
      if (usados[o.mid]) continue;
      const e = enc(o.mid);
      if (e && !e.plan) { aviso('El ' + ficha(o.mid).cargo.toLowerCase() + ' acaba antes otro encargo: ' + textoObra(o) + ' espera', 'bad', 'ocupado:' + o.id); continue; }
      if (e && e.plan) {
        const otra = plan.obras.find(x => x.id === e.plan);
        if (otra && !otra.hecha && !otra.perdida && MIN.medir(s, e) < e.objetivo) continue;   // sigue con otra obra del plan
      }
      const r = MIN.encargar(s, o.mid, { tipo: 'nivel', ciudad: o.ciudad, b: o.b, objetivo: o.nivel, libre: true, plan: o.id }, mes);
      if (r.ok) { usados[o.mid] = 1; s.ministros.encargos[o.mid].plazo = (plan.e0 + plan.estaciones) * D.TURNO_MESES - 1; }
      else if (r.motivo === 'Sube antes el Foro' && plan.obras.some(x => x.b === 'foro' && x.ciudad === o.ciudad && !x.hecha && !x.perdida)) continue;
      else aviso(textoObra(o) + ': ' + r.motivo, 'bad', 'falla:' + o.id);
    }
    // 5. dinero y material de la estación
    const falta = {};
    for (const o of pend) { const e = enc(o.mid); if (!(e && e.plan === o.id)) continue; const c = P.coste(s, o.b, nivelB(s.cities[o.ciudad], o.b), ayuda); for (const r in c) falta[r] = (falta[r] || 0) + c[r]; }
    for (const r in falta) {
      const d = falta[r] - ((s.res && s.res[r]) || 0);
      if (d > 0) aviso('Faltan ' + Math.ceil(d) + ' de ' + r + ' para las obras de esta estación', 'bad', 'falta:' + r);
    }
    return { efectos, avisos: p.avisos };
  };

  /* ---------- para la pantalla ---------- */
  P.estado = (s, mes, ayuda) => {
    P.migrar(s); MIN.migrar(s); if (mes == null) mes = mesDe(s);
    const p = s.planSenado, B = p.borrador, plan = p.plan;
    const prioridades = Object.keys(P.PRIORIDADES).map(id => ({ id, n: P.PRIORIDADES[id].n, bando: P.PRIORIDADES[id].bando }));
    const cargoDe = mid => (ficha(mid) || {}).cargo || '', icono = mid => (ficha(mid) || {}).i || '';
    const out = { prioridades, borrador: null, plan: null, avisos: p.avisos.slice(), historial: p.historial.slice() };
    if (B) {
      out.borrador = {
        estaciones: B.estaciones, prioridad: B.prioridad,
        obras: B.obras.map(o => ({ id: o.id, texto: textoObra(o), est: o.est, mid: o.mid, cargo: cargoDe(o.mid), i: icono(o.mid), bando: bandoObra(o), coste: P.coste(s, o.b, o.nivel - 1, ayuda) })),
        votos: P.votos(s, B), puede: P.puedeVotar(s, mes)
      };
    }
    if (plan) {
      const k = estDe(mes) - plan.e0;
      const obras = plan.obras.map(o => {
        const e = s.ministros.encargos[o.mid];
        const estado = o.hecha ? 'hecha' : o.perdida ? 'perdida' : (e && e.plan === o.id) ? 'en marcha' : (o.est < k) ? 'atrasada' : 'espera';
        return { id: o.id, texto: textoObra(o), est: o.est, cargo: cargoDe(o.mid), estado };
      });
      const vivas = plan.obras.filter(o => !o.perdida);
      out.plan = { id: plan.id, e0: plan.e0, estaciones: plan.estaciones, prioridad: plan.prioridad, k, obras, hechas: vivas.filter(o => o.hecha).length, total: vivas.length, aprobado: plan.aprobado };
    }
    return out;
  };

  root.PLAN_SENADO = P;
  if (typeof module !== 'undefined') module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
