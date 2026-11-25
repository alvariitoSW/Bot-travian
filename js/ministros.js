/* AQVILA — CD3a: los ocho ministros. Lógica pura (corre en Node), sin pantalla. No llama a game.js: el juego ejecuta las órdenes.
   Solo escribe en s.ministros = { v, encargos:{mid:e|null}, propuestas:{mid:e|null}, actos:{}, avisos:{mid:texto}, hechos:{mid:n}, fallos:{mid:n} }.
   NOTA HISTÓRICA: en la República no había ministros. Es LICENCIA DE JUEGO. Cada uno lleva el cargo que hacía ese trabajo:
   censores (obras y censo; Apio Claudio, Aqua Appia 312 a.C., Livio 9.29, Frontino 1.5), ediles (calles, mercados, grano y juegos;
   Cicerón, Leyes 3.7), cuestores (el tesoro), pontífices (el culto), legados (mando delegado). Las minas las arrendaban los censores
   a publicanos (Polibio 6.17). «Sabio» y el reparto de bandos son licencia de juego. */
(function (root) {
  'use strict';
  const D = root.DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const M = { PREMIO: 4, CASTIGO: -3, PLAZO: 12, PLAZO_SABER: 24 };
  const L = 'Licencia de juego: ';
  M.DATOS = [
    { id: 'ejercito', area: 'Ejército', cargo: 'Legado', i: '🛡️', bando: 'mil', edificios: ['cuartel', 'establo', 'herreria', 'muralla', 'guardia'], tipos: ['nivel', 'tropas'], nota: L + 'el mando delegado lo ejercían los legados.' },
    { id: 'ciencia', area: 'Ciencia', cargo: 'Sabio', i: '📜', bando: null, edificios: ['escuela'], tipos: ['saber'], nota: L + 'el «Sabio» no existía; no encabeza ningún bando (usuario, 23/11).' },
    { id: 'infra', area: 'Infraestructura', cargo: 'Censor', i: '🏛️', bando: 'pue', edificios: ['fuente', 'cloaca', 'termas', 'medico', 'acueducto', 'jardin', 'parque'], tipos: ['nivel', 'reserva'], nota: L + 'los censores contrataban las obras públicas (Livio 9.29; Frontino 1.5).' },
    { id: 'hacienda', area: 'Hacienda', cargo: 'Cuestor', i: '💰', bando: 'mer', edificios: ['foro', 'almacen'], tipos: ['impuesto', 'reserva'], nota: L + 'los cuestores guardaban el tesoro.' },
    { id: 'agricultura', area: 'Agricultura', cargo: 'Edil del grano', i: '🌾', bando: 'ter', edificios: ['granja', 'granero'], tipos: ['nivel', 'reserva', 'campo', 'mejora', 'cambiar'], nota: L + 'los ediles cuidaban el grano (Cicerón, Leyes 3.7).' },
    { id: 'mineria', area: 'Minería', cargo: 'Publicano de minas', i: '⛏️', bando: 'pro', edificios: ['cantera', 'mina', 'aserradero'], tipos: ['nivel', 'reserva'], nota: L + 'los censores arrendaban las minas a publicanos (Polibio 6.17).' },
    { id: 'artesania', area: 'Artesanía y comercio', cargo: 'Edil del mercado', i: '🏺', bando: 'ita', edificios: ['mercado', 'puerto', 'taller'], tipos: ['nivel', 'acto'], actos: ['ruta'], nota: L + 'los ediles vigilaban mercados y pesos (Cicerón, Leyes 3.7).' },
    { id: 'culto', area: 'Culto y fiestas', cargo: 'Pontífice', i: '🔱', bando: 'sac', edificios: ['templo', 'teatro'], tipos: ['nivel', 'acto'], actos: ['juegos', 'ofrenda'], nota: L + 'los pontífices regían el culto; los ediles, los juegos.' }
  ];
  M.ORDEN = M.DATOS.map(x => x.id);
  const FICHA = {}; M.DATOS.forEach(x => { FICHA[x.id] = x; });
  const TODOS_ACTOS = ['ruta', 'juegos', 'ofrenda', 'leva', 'grano'];

  const mesDe = s => Math.floor((s.t || 0) + 1e-9);
  const r2 = x => Math.round(x * 100) / 100;
  const nombreB = b => (D.BUILD[b] && D.BUILD[b].n) || b;
  const nombreC = id => (D.CITIES[id] && D.CITIES[id].n) || id;
  const nombreU = u => (D.UNITS[u] && D.UNITS[u].n) || u;
  const obj = x => x && typeof x === 'object' && !Array.isArray(x);

  M.migrar = s => {
    if (!obj(s.ministros)) s.ministros = {};
    const m = s.ministros; m.v = 1;
    for (const k of ['encargos', 'propuestas', 'actos', 'avisos', 'hechos', 'fallos', 'perdidos']) if (!obj(m[k])) m[k] = {};
    for (const id of M.ORDEN) {
      if (!obj(m.encargos[id])) m.encargos[id] = null;
      if (!obj(m.propuestas[id])) m.propuestas[id] = null;
      if (typeof m.hechos[id] !== 'number') m.hechos[id] = 0;
      if (typeof m.fallos[id] !== 'number') m.fallos[id] = 0;
      if (typeof m.perdidos[id] !== 'number') m.perdidos[id] = 0;
    }
    return s;
  };

  const mias = s => Object.keys(s.cities).filter(id => s.cities[id].owner === 'roma');
  const porPop = s => mias(s).sort((a, b) => (s.cities[b].pop || 0) - (s.cities[a].pop || 0) || (a < b ? -1 : 1));
  const hombresC = c => { let n = 0; for (const k in (c.units || {})) n += c.units[k] || 0; return n; };
  const hombres = s => mias(s).reduce((n, id) => n + hombresC(s.cities[id]), 0);
  const popTotal = s => mias(s).reduce((n, id) => n + (s.cities[id].pop || 0), 0);
  const nivelB = (c, b) => (c.b && c.b[b]) || 0;

  M.topeForo = (c, b, nivel) => {
    if (nivel > D.MAX_LVL) return 'Ya está al máximo';
    if (b !== 'foro' && nivel > ((c.b && c.b.foro) || 1)) return 'Sube antes el Foro';
    return '';
  };

  M.costeTropas = (d, u, n) => { const k = (d.UNITS[u] && d.UNITS[u].cost) || {}; return { hombres: n, hierro: (k.hierro || 0) * n, denarios: (k.denarios || 0) * n, grano: (k.grano || 0) * n }; };
  M.pagaTropa = (d, u) => { const up = (d.UNITS[u] && d.UNITS[u].up) || 0; return { grano: r2(up * 3), denarios: r2(up * 3 * d.MANT_TROPA) }; };

  const parcelaDe = (s, e) => ((s.agro && s.agro.parcelas) || []).find(p => p.id === e.parcela && p.ciudad === e.ciudad) || null;   // CDe3-F2a: campos de la agricultura por suelos
  M.medir = (s, e) => {
    const c = e.ciudad ? s.cities[e.ciudad] : null;
    switch (e.tipo) {
      case 'nivel': return c ? nivelB(c, e.b) : 0;
      case 'tropas': return c ? ((c.units && c.units[e.u]) || 0) : 0;
      case 'saber': return (s.inv && s.inv.hechas && s.inv.hechas[e.saber]) ? 1 : 0;
      case 'impuesto': return c && (c.imp || 'normal') === e.nivel ? 1 : 0;
      case 'reserva': return Math.max(0, (s.res && s.res[e.recurso]) || 0) + Math.max(0, (s.alm && s.alm[e.recurso]) || 0);   // ES20: una sola reserva (caja + almacén)
      case 'campo': return ((s.agro && s.agro.parcelas) || []).filter(p => p.ciudad === e.ciudad && p.campo === e.campo).length;
      case 'mejora': { const p = parcelaDe(s, e); return p && (p.mejoras || []).indexOf(e.mejora) >= 0 ? 1 : 0; }
      case 'cambiar': { const p = parcelaDe(s, e); return p && p.campo === e.campo ? 1 : 0; }
      case 'acto': return ((s.ministros && s.ministros.actos && s.ministros.actos[e.acto]) || 0);
    }
    return 0;
  };
  M.progreso = (s, e) => {
    const m = M.medir(s, e), b = e.base || 0, o = e.objetivo || 0;
    if (o <= b) return m >= o ? 1 : 0;
    return Math.max(0, Math.min(1, (m - b) / (o - b)));
  };

  M.validar = (s, e) => {
    if (!e || !FICHA[e.mid]) return 'Ministro desconocido';
    const f = FICHA[e.mid];
    if (f.tipos.indexOf(e.tipo) < 0) return 'Ese ministro no admite ese encargo';
    const c = e.ciudad ? s.cities[e.ciudad] : null;
    if (['nivel', 'tropas', 'impuesto', 'campo', 'mejora', 'cambiar'].indexOf(e.tipo) >= 0 && (!c || c.owner !== 'roma')) return 'La ciudad no es tuya';
    if (e.tipo === 'campo') return e.campo && e.suelo ? (e.objetivo > M.medir(s, e) ? '' : 'Ya está hecho') : 'Falta el campo o el suelo';
    if (e.tipo === 'mejora' || e.tipo === 'cambiar') {
      const p = parcelaDe(s, e); if (!p) return 'Esa parcela ya no existe';
      if (e.tipo === 'mejora' && !e.mejora) return 'Falta la mejora';
      if (e.tipo === 'cambiar' && !e.campo) return 'Falta el campo';
      return e.objetivo > M.medir(s, e) ? '' : 'Ya está hecho';
    }
    if (e.tipo === 'nivel') {
      if (!D.BUILD[e.b] || (!e.libre && f.edificios.indexOf(e.b) < 0)) return 'Ese edificio no existe';
      if (!(e.objetivo > nivelB(c, e.b))) return 'Ya tiene ese nivel';
      return M.topeForo(c, e.b, e.objetivo);
    }
    if (e.tipo === 'tropas') {
      const U = D.UNITS[e.u]; if (!U) return 'Esa unidad no existe';
      if (!(e.n > 0) && !(e.objetivo > M.medir(s, e))) return 'Falta el número de hombres';
      for (const b in (U.req || {})) if (nivelB(c, b) < U.req[b]) return 'Falta ' + nombreB(b);
      return '';
    }
    if (e.tipo === 'saber') {
      if (!D.INVEST[e.saber]) return 'Ese saber no existe';
      if (s.inv && s.inv.hechas && s.inv.hechas[e.saber]) return 'Ese saber ya está hecho';
      return '';
    }
    if (e.tipo === 'impuesto') {
      if (!D.IMPUESTOS[e.nivel]) return 'Impuesto desconocido';
      return (c.imp || 'normal') === e.nivel ? 'Ya tiene ese impuesto' : '';
    }
    if (e.tipo === 'reserva') {
      if (['grano', 'denarios', 'materiales', 'hierro'].indexOf(e.recurso) < 0 || !(e.objetivo > 0)) return 'Recurso desconocido';
      return e.objetivo <= M.medir(s, e) ? 'Ya tienes esa reserva' : '';
    }
    if (e.tipo === 'acto') {
      const ok = f.actos || TODOS_ACTOS;
      if (ok.indexOf(e.acto) < 0) return 'Ese ministro no encarga ese acto';
      if (!(e.n > 0) && !(e.objetivo > M.medir(s, e))) return 'Falta el número de actos';
      return '';
    }
    return 'Tipo desconocido';
  };

  const textoDe = (s, e) => {
    const c = e.ciudad ? nombreC(e.ciudad) : '';
    switch (e.tipo) {
      case 'nivel': return (e.para ? 'Sube antes el Foro para poder subir ' + nombreB(e.para.b) + ' a nivel ' + e.para.nivel + ': ' : '') + 'Subir ' + nombreB(e.b) + ' a nivel ' + e.objetivo + ' en ' + c;
      case 'tropas': { const n = (e.objetivo - (e.base || 0)) || 0, k = M.costeTropas(D, e.u, n); return 'Reclutar ' + n + ' ' + nombreU(e.u) + ' en ' + c + ' (' + k.hombres + ' hombres, ' + k.hierro + ' de hierro, ' + k.denarios + ' denarios)'; }
      case 'saber': return 'Investigar ' + ((D.INVEST[e.saber] && D.INVEST[e.saber].n) || e.saber);
      case 'impuesto': return 'Poner impuestos «' + e.nivel + '» en ' + c;
      case 'reserva': return 'Reunir ' + e.objetivo + ' de ' + e.recurso + (e.recurso === 'grano' ? ' para el invierno' : '');
      case 'campo': case 'mejora': case 'cambiar': return (e.txt || 'Trabajo en los campos') + ' (' + c + ')';
      case 'acto': return 'Hacer ' + ((e.objetivo - (e.base || 0)) || 0) + ' acto de ' + e.acto;
    }
    return '';
  };
  /* completa base, desde, plazo, texto e id (sin guardar) */
  const completar = (s, e, mes) => {
    e.base = M.medir(s, e);
    if ((e.tipo === 'tropas' || e.tipo === 'acto') && e.n > 0) e.objetivo = e.base + e.n;
    if (e.tipo === 'saber') e.objetivo = 1;
    if (e.tipo === 'impuesto') e.objetivo = 1;
    if (e.tipo === 'campo') e.objetivo = e.base + 1;
    if (e.tipo === 'mejora' || e.tipo === 'cambiar') e.objetivo = 1;
    e.desde = mes; e.plazo = mes + (e.tipo === 'saber' ? M.PLAZO_SABER : M.PLAZO);
    e.id = e.mid + '-' + mes + '-' + e.tipo; e.texto = textoDe(s, e);
    return e;
  };

  M.encargar = (s, mid, e, mes) => {
    M.migrar(s); if (mes == null) mes = mesDe(s);
    e = Object.assign({}, e, { mid });
    completar(s, e, mes);
    const mot = M.validar(s, e); if (mot) return { ok: false, motivo: mot };
    s.ministros.encargos[mid] = e; s.ministros.propuestas[mid] = null; delete s.ministros.avisos[mid];
    return { ok: true, motivo: '' };
  };

  /* Remedio a una necesidad: r = {necesidad, servicio, ministro, casas, ciudad?}. Encarga subir el edificio de servicio un nivel. */
  M.remedio = (s, r, mes) => {
    M.migrar(s); if (mes == null) mes = mesDe(s);
    if (!r || !D.BUILD[r.servicio] || !FICHA[r.ministro]) return { ok: false, motivo: 'Ese servicio aún no se puede construir' };
    const cid = r.ciudad || porPop(s)[0]; if (!cid || !s.cities[cid]) return { ok: false, motivo: 'No hay ciudad' };
    const res = M.encargar(s, r.ministro, { tipo: 'nivel', ciudad: cid, b: r.servicio, objetivo: nivelB(s.cities[cid], r.servicio) + 1, libre: true, necesidad: r.necesidad }, mes);
    return res.ok ? { ok: true } : res;
  };
  /* candidatos: se prueba cada uno y gana el primero válido */
  const cand = (s, mid, mes, e) => { e.mid = mid; completar(s, e, mes); return M.validar(s, e) ? null : e; };
  const primero = (s, mid, mes, lista) => { for (const f of lista) { const e = f(); if (!e) continue; const r = cand(s, mid, mes, e); if (r) return r; } return null; };
  const nivelMas = (s, b, cids) => () => {
    if (!D.BUILD[b]) return null;
    let foro = null;
    for (const id of cids) {
      const c = s.cities[id], n = nivelB(c, b) + 1, tope = M.topeForo(c, b, n);
      if (!tope) return { tipo: 'nivel', ciudad: id, b, objetivo: n };
      if (!foro && tope === 'Sube antes el Foro' && D.BUILD.foro && !M.topeForo(c, 'foro', nivelB(c, 'foro') + 1)) foro = { tipo: 'nivel', ciudad: id, b: 'foro', objetivo: nivelB(c, 'foro') + 1, libre: true, para: { b, nivel: n } };
    }
    return foro;
  };
  const reserva = (recurso, objetivo) => () => ({ tipo: 'reserva', ciudad: null, recurso, objetivo });
  const acto = (a, ciudad) => () => ({ tipo: 'acto', ciudad: ciudad || null, acto: a, n: 1 });

  M.proponer = (s, mid, mes, ayuda) => {
    M.migrar(s); ayuda = ayuda || {}; if (mes == null) mes = mesDe(s);
    const cs = porPop(s), mayor = cs[0]; if (!mayor || !FICHA[mid]) return null;
    const C = s.cities[mayor], res = {};   // ES20: la reserva entera (caja + almacén)
    for (const r of ['grano', 'denarios', 'materiales', 'hierro']) res[r] = Math.max(0, (s.res && s.res[r]) || 0) + Math.max(0, (s.alm && s.alm[r]) || 0);
    const P = lista => primero(s, mid, mes, lista);
    switch (mid) {
      case 'ejercito': {
        const tropa = () => {
          const romanas = (s.polis && D.POLIS && D.POLIS[s.polis] ? ['hoplitas', D.POLIS[s.polis].tropa.id].filter((u, i, a) => a.indexOf(u) === i) : ['hastati', 'principes', 'triarii', 'velites', 'equites']).filter(u => D.UNITS[u] && Object.keys(D.UNITS[u].req || {}).every(b => nivelB(C, b) >= D.UNITS[u].req[b]));
          return romanas.length ? { tipo: 'tropas', ciudad: mayor, u: romanas[0], n: 100 } : null;
        };
        const lista = [];
        if (nivelB(C, 'herreria') < nivelB(C, 'cuartel')) lista.push(nivelMas(s, 'herreria', [mayor]));
        if (hombres(s) < 200) lista.push(tropa);
        lista.push(nivelMas(s, 'cuartel', [mayor]));
        return P(lista);
      }
      case 'ciencia': {
        const ed = (s.inv && s.inv.edad) || 1, h = (s.inv && s.inv.hechas) || {};
        const coste = i => { let t = 0; for (const k in (i.cost || {})) t += i.cost[k] || 0; return t; };
        const ids = Object.keys(D.INVEST).filter(id => !h[id] && (D.INVEST[id].edad || 1) <= ed && (!ayuda.invPuede || ayuda.invPuede(id)))
          .sort((a, b) => coste(D.INVEST[a]) - coste(D.INVEST[b]) || (a < b ? -1 : 1));
        return P(ids.map(id => () => ({ tipo: 'saber', ciudad: null, saber: id, objetivo: 1 })));
      }
      case 'infra': {
        const fam = FICHA.infra.edificios.filter(b => D.BUILD[b]);
        return P(fam.map(b => nivelMas(s, b, cs)).concat([reserva('materiales', Math.ceil(res.materiales || 0) + 300)]));
      }
      case 'hacienda': {
        const lista = [];
        if ((res.denarios || 0) < 100 && (C.imp || 'normal') !== 'alto') lista.push(() => ({ tipo: 'impuesto', ciudad: mayor, nivel: 'alto', objetivo: 1 }));
        if (ayuda.felicidad) { const id = cs.find(x => s.cities[x].imp === 'alto' && ayuda.felicidad(s.cities[x]) < 45); if (id) lista.push(() => ({ tipo: 'impuesto', ciudad: id, nivel: 'normal', objetivo: 1 })); }
        lista.push(reserva('denarios', Math.ceil(res.denarios || 0) + 300));
        return P(lista);
      }
      case 'agricultura': {
        const cons = ayuda.consumoMes ? ayuda.consumoMes() : 0.5 * hombres(s) + 0.1 * popTotal(s);
        const inv = cons * 3, lista = [];
        if ((res.grano || 0) < inv) lista.push(reserva('grano', Math.ceil(inv * 3)));
        if (ayuda.encargosAgro) for (const g of ayuda.encargosAgro(mayor) || []) if (g.tipo === 'campo' || g.tipo === 'mejora' || g.tipo === 'cambiar') lista.push(() => ({ tipo: g.tipo, ciudad: mayor, parcela: g.parcela, campo: g.campo, suelo: g.suelo, mejora: g.mejora, txt: g.texto }));   // CDe3-F2a: campos, mejoras y cambios de la agricultura por suelos
        lista.push(nivelMas(s, 'granja', cs));
        return P(lista);
      }
      case 'mineria': {
        const lista = [];
        if ((res.hierro || 0) < 100) lista.push(reserva('hierro', 200));
        const conMina = cs.filter(id => nivelB(s.cities[id], 'mina') > 0 || (ayuda.veta && ayuda.veta(id)));
        if (conMina.length) lista.push(nivelMas(s, 'mina', conMina));
        lista.push(nivelMas(s, 'cantera', cs));
        return P(lista);
      }
      case 'artesania': {
        const costeras = cs.filter(id => D.CITIES[id] && D.CITIES[id].sea);
        return P([nivelMas(s, 'mercado', cs), nivelMas(s, 'puerto', costeras), acto('ruta')]);
      }
      case 'culto': {
        const lista = [];
        if (nivelB(C, 'templo') < 1) lista.push(nivelMas(s, 'templo', [mayor]));
        lista.push(acto('juegos', mayor));
        return P(lista);
      }
    }
    return null;
  };

  M.propuestas = (s, mes, ayuda) => {
    M.migrar(s); if (mes == null) mes = mesDe(s);
    for (const mid of M.ORDEN) if (!s.ministros.encargos[mid] && !s.ministros.propuestas[mid]) s.ministros.propuestas[mid] = M.proponer(s, mid, mes, ayuda);
    return s.ministros.propuestas;
  };
  M.aceptar = (s, mid, mes) => {
    M.migrar(s); const p = s.ministros.propuestas[mid];
    if (!p) return { ok: false, motivo: 'No hay propuesta' };
    return M.encargar(s, mid, p, mes == null ? mesDe(s) : mes);
  };
  M.cancelar = (s, mid) => { M.migrar(s); s.ministros.encargos[mid] = null; delete s.ministros.avisos[mid]; };
  M.acto = (s, tipo, dato) => { M.migrar(s); void dato; s.ministros.actos[tipo] = (s.ministros.actos[tipo] || 0) + 1; };

  M.ordenes = (s, mes) => {
    M.migrar(s); if (mes == null) mes = mesDe(s);
    const out = [];
    for (const mid of M.ORDEN) {
      const e = s.ministros.encargos[mid]; if (!e) continue;
      const c = e.ciudad ? s.cities[e.ciudad] : null, m = M.medir(s, e);
      if (e.ciudad && (!c || c.owner !== 'roma')) continue;
      if (m >= e.objetivo) continue;
      if (e.tipo === 'nivel' && c) {
        const hay = b => (c.obras || []).some(o => o.b === b);
        if (hay(e.b)) continue;
        const sig = m + 1, tope = M.topeForo(c, e.b, sig);
        if (!tope) out.push({ mid, tipo: 'subir', ciudad: e.ciudad, b: e.b, nivel: sig });
        else if (e.b !== 'foro' && tope === 'Sube antes el Foro' && !hay('foro') && !M.topeForo(c, 'foro', nivelB(c, 'foro') + 1)) out.push({ mid, tipo: 'subir', ciudad: e.ciudad, b: 'foro', nivel: nivelB(c, 'foro') + 1 });
      } else if (e.tipo === 'tropas' && c) {
        const n = e.objetivo - (e.base || 0) - (e.pedido || 0);
        if (n > 0) out.push({ mid, tipo: 'reclutar', ciudad: e.ciudad, u: e.u, n });
      } else if (e.tipo === 'saber') {
        if (!(s.inv && s.inv.cola)) out.push({ mid, tipo: 'investigar', saber: e.saber });
      } else if (e.tipo === 'impuesto') {
        out.push({ mid, tipo: 'impuesto', ciudad: e.ciudad, nivel: e.nivel });
      } else if (e.tipo === 'campo') {
        out.push({ mid, tipo: 'plantar', ciudad: e.ciudad, campo: e.campo, suelo: e.suelo });
      } else if (e.tipo === 'mejora') {
        out.push({ mid, tipo: 'mejorar', ciudad: e.ciudad, parcela: e.parcela, mejora: e.mejora });
      } else if (e.tipo === 'cambiar') {
        out.push({ mid, tipo: 'cambiar', ciudad: e.ciudad, parcela: e.parcela, campo: e.campo });
      } else if (e.tipo === 'acto' && (e.acto === 'juegos' || e.acto === 'ofrenda')) {
        const cid = e.ciudad || porPop(s)[0], F = D.FIESTAS[e.acto], ult = cid && s.cities[cid] && s.cities[cid].fiesta ? s.cities[cid].fiesta[e.acto] : -99;
        if (cid && !(F && mes - (typeof ult === 'number' ? ult : -99) < (F.reposo || 0))) out.push({ mid, tipo: 'fiesta', ciudad: cid, fiesta: e.acto });
      }
    }
    return out;
  };
  M.anotar = (s, orden, ok, motivo, hecho) => {
    M.migrar(s); const mid = orden && orden.mid, e = mid && s.ministros.encargos[mid]; if (!e) return;
    if (ok) { if (orden.tipo === 'reclutar') e.pedido = (e.pedido || 0) + (hecho != null ? hecho : orden.n); delete s.ministros.avisos[mid]; }
    else s.ministros.avisos[mid] = motivo || 'Faltan recursos';
  };

  M.revisar = (s, mes) => {
    M.migrar(s); if (mes == null) mes = mesDe(s);
    const m = s.ministros, r = { efectos: [], cumplidos: [], fallidos: [], perdidos: [] };
    const activos = (s.senado && s.senado.bandos) || ['ter', 'mer', 'mil'];
    const humor = (bando, d) => r.efectos.push({ tipo: 'humor', bando, d, activo: activos.indexOf(bando) >= 0 });
    for (const mid of M.ORDEN) {
      const e = m.encargos[mid]; if (!e) continue;
      const f = FICHA[mid], B = f.bando ? D.BANDOS[f.bando] : null;
      if (e.ciudad && !(s.cities[e.ciudad] && s.cities[e.ciudad].owner === 'roma')) {
        m.perdidos[mid]++; m.encargos[mid] = null; delete m.avisos[mid]; r.fallidos.push(mid); r.perdidos.push(mid);
        r.efectos.push({ tipo: 'log', texto: 'El encargo se pierde con la ciudad', tono: 'bad' });
        continue;
      }
      if (M.medir(s, e) >= e.objetivo) {
        m.hechos[mid]++; m.encargos[mid] = null; delete m.avisos[mid]; r.cumplidos.push(mid);
        if (B) { humor(f.bando, M.PREMIO); for (const rv of B.rival) humor(rv, -1); }
        r.efectos.push({ tipo: 'log', texto: '🏛️ El ' + f.cargo.toLowerCase() + ' cumple: ' + e.texto + (B ? '. Contenta a los ' + B.fam + ' (+' + M.PREMIO + ').' : '.'), tono: 'good' });
        m.propuestas[mid] = M.proponer(s, mid, mes);
      } else if (mes > e.plazo) {
        m.fallos[mid]++; m.encargos[mid] = null; delete m.avisos[mid]; r.fallidos.push(mid);
        if (B) humor(f.bando, M.CASTIGO);
        r.efectos.push({ tipo: 'log', texto: '🏛️ El ' + f.cargo.toLowerCase() + ' no llegó a tiempo: ' + e.texto + (B ? '. Disgusta a los ' + B.fam + ' (' + M.CASTIGO + ').' : '.'), tono: 'bad' });
      }
    }
    return r;
  };

  M.estado = (s, mes) => {
    M.migrar(s); if (mes == null) mes = mesDe(s);
    const m = s.ministros;
    return M.DATOS.map(f => {
      const e = m.encargos[f.id], p = m.propuestas[f.id];
      return {
        id: f.id, area: f.area, cargo: f.cargo, i: f.i, bando: f.bando, familia: f.bando ? D.BANDOS[f.bando].fam : null,
        encargo: e ? { texto: e.texto, progreso: M.progreso(s, e), plazoEst: Math.max(0, Math.ceil((e.plazo - mes) / D.TURNO_MESES)) } : null,
        propuesta: p ? { texto: p.texto } : null,
        aviso: m.avisos[f.id] || '', hechos: m.hechos[f.id] || 0, fallos: m.fallos[f.id] || 0
      };
    });
  };

  root.MINISTROS = M;
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
