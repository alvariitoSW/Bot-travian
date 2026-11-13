/* AQVILA — NB5: motor de la maniobra previa a la batalla (sin pantalla; corre en Node y en el navegador).
   Dos bandos mueven sus legiones por un mapa pequeño de la zona (D.ZONAS_MANIOBRA) hasta 8 días: víveres, cansancio, niebla,
   enemigo con los cinco planes de Battle.PLANES, rendición por cerco, retirada por hambre y, al coincidir dos legiones,
   la cfg del choque. El estado es JSON puro: se guarda y se clona sin perder nada.
   API: crear(cfg) · vista(e,b) · consejoDia(e,b) · moverDia(e,ordenes,b) · resolverDia(e,semilla) → {estado,sucesos,choque} · retirarse(e,b) · ventajaFinal(e). */
(function (root) {
  const D = root.DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const M = {};
  const PLANES = { centro: 'Centro fuerte', alas: 'Envolver por las alas', cerro: 'Defender el cerro', emboscar: 'Emboscar', hostigar: 'Hostigar y huir' };   // mismas claves que Battle.PLANES
  const VIVERES = 6, DIAS = 8, DESERCION = 0.1;
  const UMBRAL = { equilibrado: 1.1, astuto: 1.25, impetuoso: 0.6, prudente: 1.5 };   // fuerza propia / enemiga a partir de la cual el enemigo ataca lo que ve
  const TRIBUNOS = [{ n: 'Quinto Fabio', car: 'prudente', t: 'Prudente' }, { n: 'Marco Claudio', car: 'agresivo', t: 'Agresivo' }, { n: 'Cayo Lelio', car: 'astuto', t: 'Astuto' }];
  const RASGO = { Castra: 'castra', Cerro: 'cerro', Vado: 'vado', Puente: 'puente', Pinar: 'bosque', Cruce: 'llano', Llano: 'llano' };
  const BASE = { Castra: 'llano', Cerro: 'cerro', Vado: 'rio', Puente: 'paso', Pinar: 'bosque', Cruce: 'llano', Llano: 'llano' };
  const TXT_TERRENO = { Castra: 'campamento (el defensor ya está desplegado)', Cerro: 'cerro (quien lo ocupa recibe un 25 % menos de daño)', Vado: 'vado (quien cruza llega cansado y Vacilante)', Puente: 'puente: el centro es un solo regimiento de frente', Pinar: 'pinar', Cruce: 'cruce de caminos', Llano: 'llano' };
  M.PLANES = PLANES; M.TRIBUNOS = TRIBUNOS; M.VIVERES = VIVERES; M.DIAS = DIAS;

  const clon = o => JSON.parse(JSON.stringify(o));
  const pt = (e, id) => e.zona.puntos.find(p => p.id === id);
  const tipo = (e, id) => pt(e, id).tipo;
  const vecinos = (e, id) => { const r = []; e.zona.caminos.forEach(c => { if (c[0] === id) r.push(c[1]); else if (c[1] === id) r.push(c[0]); }); return r; };
  const suma = u => { let n = 0; for (const k in u) n += u[k]; return n; };
  const fuerza = L => suma(L.units);
  const explora = L => { let n = 0; for (const k in L.units) { const u = D.UNITS[k]; if (u && (u.cls === 'rng' || u.cls === 'cav')) n += L.units[k]; } return n >= 10; };
  const legs = (e, b) => e.bandos[b].legiones;
  const en = (e, b, p) => legs(e, b).filter(L => L.punto === p);
  const iaActiva = (e, b) => b === 1 ? e.bandos[1].ia !== false : e.bandos[0].ia === true;
  function dist(e, a, b, evitar) {   // pasos mínimos de a a b (o -1); evitar = puntos que no se cruzan
    if (a === b) return 0; const d = { [a]: 0 }, q = [a];
    while (q.length) { const p = q.shift(); for (const v of vecinos(e, p)) { if (d[v] != null || (evitar && evitar.includes(v) && v !== b)) continue; d[v] = d[p] + 1; if (v === b) return d[v]; q.push(v); } }
    return -1;
  }
  function paso(e, a, b, evitar) {   // primer punto del mejor camino de a a b
    if (a === b) return a; let best = null, bd = 1e9;
    for (const v of vecinos(e, a)) { if (evitar && evitar.includes(v) && v !== b) continue; const d = dist(e, v, b, evitar); if (d >= 0 && d + 1 < bd) { bd = d + 1; best = v; } }
    return best != null ? best : (evitar ? paso(e, a, b) : a);
  }
  function masCerca(e, desde, t, evitar) {   // punto de ese tipo más cercano
    let best = null, bd = 1e9; e.zona.puntos.forEach(p => { if (p.tipo !== t) return; const d = dist(e, desde, p.id, evitar); if (d >= 0 && d < bd) { bd = d; best = p.id; } }); return best;
  }

  // quedan víveres justos para llegar a la castra más cercana (hasta 2 por paso, vado o bosque, y uno de margen)
  function hambriento(e, L) { const c = masCerca(e, L.punto, 'Castra'); return L.vivres <= (c == null ? 2 : dist(e, L.punto, c) * 2 + 1); }

  /* ---------- crear ---------- */
  // cfg: { zona | ciudad, semilla, defensor (0|1, por defecto 1), max, bandos: [{ nombre, car, plan, ia, legiones: [{ nombre, units, vivres?, cansancio? }] }, …] }
  M.crear = function (cfg) {
    cfg = cfg || {}; const id = D.ZONAS_MANIOBRA[cfg.zona] ? cfg.zona : D.zonaManiobra(cfg.ciudad, cfg.semilla), z = D.ZONAS_MANIOBRA[id];
    const e = { v: 1, zona: { id, n: z.n, ini: z.ini.slice(), centro: z.centro, puntos: clon(z.puntos), caminos: clon(z.caminos) }, dia: 0, max: cfg.max || DIAS, defensor: cfg.defensor == null ? 1 : cfg.defensor,
      rng: (cfg.semilla || 1) >>> 0, terminado: false, fin: null, choque: null, bandos: [] };
    for (let b = 0; b < 2; b++) {
      const c = (cfg.bandos || [])[b] || {};
      e.bandos.push({ nombre: c.nombre || (b ? 'Enemigo' : 'Roma'), car: c.car || 'equilibrado', plan: PLANES[c.plan] ? c.plan : 'centro', ia: c.ia == null ? null : c.ia, moral: 100, memoria: null, retirados: [],
        legiones: (c.legiones || []).slice(0, 3).map((l, i) => { const u = clon(l.units || {}); return { id: 'b' + b + 'l' + i, nombre: l.nombre || ('Legión ' + (i + 1)), punto: z.ini[b], prev: z.ini[b], units: u, vivres: l.vivres == null ? VIVERES : l.vivres, sinVivres: 0, cansancio: l.cansancio || 0, orden: null }; }) });
    }
    e.bandos[1].memoria = z.ini[0];
    return e;
  };

  /* ---------- niebla ---------- */
  // Solo ves puntos vecinos a tus legiones; en un pinar no se ve al enemigo (aunque sea vecino) salvo que explore una legión con vélites o équites (alcance 2).
  M.vista = function (e, b) {
    const vis = {};
    legs(e, b).forEach(L => {
      const ex = explora(L), r = ex ? 2 : 1;
      e.zona.puntos.forEach(p => { const d = dist(e, L.punto, p.id); if (d < 0 || d > r) return; vis[p.id] = vis[p.id] || d === 0 || ex || p.tipo !== 'Pinar'; });
    });
    const puntos = {}, enemigos = [];
    e.zona.puntos.forEach(p => {
      const ve = !!vis[p.id], lista = ve ? en(e, 1 - b, p.id).map(L => ({ legion: L.id, nombre: L.nombre, fuerza: Math.round(fuerza(L) / 10) * 10 })) : null;
      puntos[p.id] = { visible: ve, enemigos: lista, txt: ve ? lista.map(x => '~' + x.fuerza).join(', ') : '?' };
      if (lista) lista.forEach(x => enemigos.push({ punto: p.id, legion: x.legion, nombre: x.nombre, fuerza: x.fuerza }));
    });
    return { puntos, enemigos, explora: legs(e, b).some(explora) };
  };

  /* ---------- órdenes ---------- */
  M.moverDia = function (e0, ordenes, b) {
    const e = clon(e0);
    (ordenes || []).forEach(o => {
      const L = legs(e, b).find(x => x.id === o.legion); if (!L) throw new Error('Legión desconocida: ' + o.legion);
      const a = o.a == null ? L.punto : o.a;
      if (a !== L.punto && !vecinos(e, L.punto).includes(a)) throw new Error('«' + a + '» no es vecino de «' + L.punto + '»');
      L.orden = a === L.punto ? null : a;
    });
    return e;
  };

  /* ---------- enemigo: los cinco planes traducidos a movimientos ---------- */
  function iaOrdenes(e, b) {
    const B = e.bandos[b], vi = M.vista(e, b), car = B.car, enemigo0 = e.zona.ini[1 - b], evitar = [e.zona.centro], primeros = [];
    if (vi.enemigos.length) B.memoria = vi.enemigos[0].punto;
    B.legiones.forEach((L, i) => {
      L.orden = null; const aqui = L.punto, vec = vecinos(e, aqui), esCastra = tipo(e, aqui) === 'Castra';
      const meta = (dest, m) => { if (dest && dest !== aqui) L.orden = dest; L.motivo = m; };
      if (!esCastra && hambriento(e, L)) { const c = masCerca(e, aqui, 'Castra'); if (c != null) return meta(paso(e, aqui, c), 'busca víveres'); }   // hambre: a la castra
      if (esCastra && L.vivres < VIVERES && B.plan !== 'hostigar') return meta(null, 'repone víveres');
      const vistos = vi.enemigos.filter(x => vec.includes(x.punto)).sort((x, y) => y.fuerza - x.fuerza);
      let umbral = UMBRAL[car] || 1.1;
      if (B.plan === 'cerro') umbral = Math.max(umbral, 2); if (B.plan === 'hostigar') umbral = Math.max(umbral, 2.2); if (B.plan === 'emboscar') umbral *= 0.8;
      const atacable = vistos.find(x => fuerza(L) / Math.max(1, x.fuerza) >= umbral && (B.plan !== 'emboscar' || tipo(e, aqui) === 'Pinar' || car === 'impetuoso'));
      if (atacable) return meta(atacable.punto, 'ataca lo que ve');
      const objetivo = B.memoria || enemigo0;
      if (B.plan === 'centro') return meta(paso(e, aqui, e.zona.centro), 'al centro');
      if (B.plan === 'cerro') return meta(paso(e, aqui, masCerca(e, e.zona.ini[b], 'Cerro') || e.zona.ini[b]), 'ocupa el cerro');
      if (B.plan === 'emboscar') {
        const pin = e.zona.puntos.filter(p => p.tipo === 'Pinar').sort((x, y) => dist(e, x.id, e.zona.centro) - dist(e, y.id, e.zona.centro));
        return meta(pin.length ? paso(e, aqui, pin[Math.min(i, pin.length - 1)].id) : null, 'espera emboscado');
      }
      if (B.plan === 'hostigar') {
        if (vi.enemigos.some(x => dist(e, aqui, x.punto) === 1)) { const c = masCerca(e, aqui, 'Castra') || e.zona.ini[b]; return meta(vec.filter(v => !vistos.some(x => x.punto === v)).sort((x, y) => dist(e, x, c) - dist(e, y, c))[0], 'se retira hostigando'); }
        return meta(paso(e, aqui, objetivo), 'busca al rival');
      }
      let p = paso(e, aqui, objetivo, evitar);   // alas: la primera legión rodea sin pasar por el centro; la segunda, por otro primer paso
      if (i > 0 && primeros.includes(p)) { const alt = vec.find(v => !primeros.includes(v) && dist(e, v, objetivo, evitar) >= 0); if (alt) p = alt; }
      primeros.push(p); meta(p, 'envuelve por el ala');
    });
  }

  /* ---------- un día ---------- */
  const quitar = (e, b, L) => { legs(e, b).splice(legs(e, b).indexOf(L), 1); };

  M.resolverDia = function (e0, semilla) {
    const e = clon(e0), su = [], S = (bando, tipoS, texto) => su.push({ dia: e.dia, bando, tipo: tipoS, texto });
    if (e.terminado) return { estado: e, sucesos: su, choque: e.choque };
    if (semilla != null) e.rng = ((semilla >>> 0) ^ Math.imul(e.dia + 1, 2654435761)) >>> 0;
    e.dia++;
    for (let b = 0; b < 2; b++) if (iaActiva(e, b)) iaOrdenes(e, b);
    const visto = [M.vista(e, 0), M.vista(e, 1)];   // lo que cada bando veía al empezar el día (decide quién es sorprendido)
    legs(e, 0).concat(legs(e, 1)).forEach(L => { L.prev = L.punto; });
    // 1. hambre: sin víveres 2 días seguidos, la legión se retira sola (10 % deserción)
    for (let b = 0; b < 2; b++) legs(e, b).slice().forEach(L => {
      if (L.sinVivres < 2) return;
      const baja = Math.round(fuerza(L) * DESERCION); for (const k in L.units) L.units[k] = Math.floor(L.units[k] * (1 - DESERCION));
      e.bandos[b].retirados.push({ id: L.id, nombre: L.nombre, fuerza: suma(L.units), deserciones: baja, units: Object.assign({}, L.units) }); quitar(e, b, L);
      S(b, 'hambre', L.nombre + ' de ' + e.bandos[b].nombre + ' se retira por hambre (' + baja + ' desertan).');
    });
    for (let b = 0; b < 2; b++) if (!legs(e, b).length && !e.terminado) { e.terminado = true; e.fin = { tipo: 'retirada', bando: b }; }
    if (e.terminado) return { estado: e, sucesos: su, choque: null };
    // 2. cerco: todos sus caminos ocupados por el enemigo
    for (let b = 0; b < 2; b++) for (const L of legs(e, b).slice()) {
      const vec = vecinos(e, L.punto), cerc = vec.map(v => en(e, 1 - b, v)); if (!vec.length || cerc.some(c => !c.length)) continue;
      const todas = cerc.reduce((a, c) => a.concat(c), []), fuer = todas.reduce((s, x) => s + fuerza(x), 0);
      if (fuerza(L) < fuer / 2) {
        quitar(e, b, L); e.bandos[b].retirados.push({ id: L.id, nombre: L.nombre, fuerza: fuerza(L), rendida: true });
        S(b, 'rendicion', L.nombre + ' de ' + e.bandos[b].nombre + ' cercada y en inferioridad: se rinde.');
        if (!legs(e, b).length) { e.terminado = true; e.fin = { tipo: 'rendicion', bando: b }; return { estado: e, sucesos: su, choque: null }; }
      } else {
        S(b, 'cerco', L.nombre + ' está cercada: combate con todos los flancos abiertos.');
        todas.sort((x, y) => fuerza(y) - fuerza(x))[0].punto = L.punto; return cierra(e, L.punto, 'cerco', visto, su, { cercado: b });
      }
    }
    // 3. marcha: víveres y cansancio
    for (let b = 0; b < 2; b++) legs(e, b).forEach(L => {
      const mueve = L.orden != null && L.orden !== L.punto, dest = mueve ? L.orden : L.punto, t = tipo(e, dest);
      L.punto = dest; L.orden = null;
      if (t === 'Castra') { L.vivres = VIVERES; L.sinVivres = 0; L.cansancio = Math.max(0, L.cansancio - (mueve ? 10 : 30)); }
      else {
        L.vivres = Math.max(0, L.vivres - (mueve && (t === 'Vado' || t === 'Pinar') ? 2 : 1)); L.sinVivres = L.vivres === 0 ? L.sinVivres + 1 : 0;
        L.cansancio = mueve ? Math.min(100, L.cansancio + 20 + (t === 'Cerro' || t === 'Vado' ? 10 : 0)) : Math.max(0, L.cansancio - 15);
        if (L.vivres === 0) L.cansancio = Math.min(100, L.cansancio + 10);
      }
      if (mueve) S(b, 'marcha', L.nombre + ' (' + e.bandos[b].nombre + ') marcha a ' + pt(e, dest).n + '.');
    });
    // hostigar: quien acaba el día a un paso de un enemigo lo cansa
    for (let b = 0; b < 2; b++) if (e.bandos[b].plan === 'hostigar' && iaActiva(e, b)) legs(e, b).forEach(L => legs(e, 1 - b).forEach(V => {
      if (vecinos(e, L.punto).includes(V.punto)) { V.cansancio = Math.min(100, V.cansancio + 10); S(1 - b, 'hostigar', V.nombre + ' es hostigada: más cansancio.'); } }));
    // 4. contacto: mismo punto, o cruce en el mismo camino
    for (const a of legs(e, 0)) for (const c of legs(e, 1)) {
      if (a.punto === c.punto) return cierra(e, a.punto, 'encuentro', visto, su, {});
      if (a.prev === c.punto && c.prev === a.punto) { const p = e.defensor === 0 ? a.prev : c.prev; a.punto = c.punto = p; return cierra(e, p, 'encuentro', visto, su, { cruce: true }); }
    }
    // 5. plazo: al acabar el último día hay que pelear donde está el defensor
    if (e.dia >= e.max) {
      const def = legs(e, e.defensor).slice().sort((x, y) => fuerza(y) - fuerza(x))[0], atq = legs(e, 1 - e.defensor).slice().sort((x, y) => dist(e, x.punto, def.punto) - dist(e, y.punto, def.punto))[0];
      if (def && atq) { S(e.defensor, 'plazo', 'Se acaban los ' + e.max + ' días: hay que combatir.'); atq.punto = def.punto; return cierra(e, def.punto, 'plazo', visto, su, {}); }
    }
    const v1 = M.vista(e, 1); if (v1.enemigos.length) e.bandos[1].memoria = v1.enemigos[0].punto;   // lo último que vio el enemigo
    return { estado: e, sucesos: su, choque: null };
  };

  /* ---------- la cfg del choque ---------- */
  function cierra(e, punto, motivo, visto, su, ex) {
    const t = tipo(e, punto), G = [en(e, 0, punto), en(e, 1, punto)], pn = pt(e, punto);
    const llegan = G.map(g => g.filter(L => ex.cruce || L.prev !== punto)), quietos = G.map(g => g.length > 0 && !ex.cruce && g.every(L => L.prev === punto));
    const defensor = quietos[0] !== quietos[1] ? (quietos[0] ? 0 : 1) : e.defensor;
    const embosc = [false, false];   // sorprendido por una legión que salió de un pinar sin ser vista
    for (let b = 0; b < 2; b++) if (G[b].some(L => tipo(e, L.prev) === 'Pinar' && !visto[1 - b].puntos[L.prev].visible) && G[1 - b].length) embosc[1 - b] = true;
    const flanco = [[], []];   // una segunda legión que llega por otro camino abre un flanco al rival
    for (let b = 0; b < 2; b++) { const orig = [...new Set(G[b].map(L => L.prev))]; if (orig.length >= 2) flanco[1 - b].push(pt(e, orig[1]).y < 50 ? 'izq' : 'der'); }
    if (ex.cercado != null) flanco[ex.cercado] = ['izq', 'centro', 'der'];
    const animo = [0, 1].map(b => embosc[b] || (t === 'Vado' && llegan[b].length) ? 'Vacilante' : 'Firme');
    const media = b => { const f = G[b].reduce((s, L) => s + fuerza(L), 0) || 1; return G[b].reduce((s, L) => s + L.cansancio * fuerza(L), 0) / f; };
    const cans = [0, 1].map(b => Math.min(3, Math.floor(media(b) / 30) + (t === 'Vado' && llegan[b].length ? 1 : 0)));
    const desplegado = [0, 1].map(b => (quietos[b] || (t === 'Castra' && punto === e.zona.ini[b] && G[b].length > 0)) && !embosc[b] && ex.cercado !== b);   // el campamento propio siempre está listo
    const unidades = b => { const u = {}; G[b].forEach(L => { for (const k in L.units) u[k] = (u[k] || 0) + L.units[k]; }); return u; };
    const alto = t === 'Cerro' ? (quietos[defensor] ? defensor : llegan[0].length && !llegan[1].length ? 1 : llegan[1].length && !llegan[0].length ? 0 : null) : null;   // llegan los dos a la vez: nadie tiene la altura
    const tr = RASGO[t], terreno = t === 'Puente' ? { izq: 'rio', centro: 'puente', der: 'rio' } : t === 'Castra' ? { izq: 'llano', centro: 'castra', der: 'llano' } : t === 'Cerro' ? { izq: 'llano', centro: 'cerro', der: 'llano' } : { izq: tr, centro: tr, der: tr };
    const lineas = ['Dos ejércitos se encuentran en ' + pn.n + (motivo === 'cerco' ? ': una legión está cercada.' : motivo === 'plazo' ? ' al agotarse los días de maniobra.' : '.'),
      'Tú: ' + (embosc[0] ? 'te sorprenden saliendo del bosque' : llegan[0].length ? (t === 'Vado' ? 'cruzas el vado, cansado y Vacilante' : 'llegas marchando') : 'esperas desplegado') + '.',
      'Ellos: ' + (embosc[1] ? 'caen en tu emboscada' : llegan[1].length ? (t === 'Vado' ? 'cruzan el vado, cansados y Vacilantes' : 'llegan marchando') : 'esperan desplegados') + '.',
      'Terreno: ' + TXT_TERRENO[t] + '.'];
    const ch = { punto, nombre: pn.n, tipoPunto: t, zona: e.zona.id, terrenoBase: BASE[t], terreno, defensor, desplegado, animo, cansancio: cans, flancoAbierto: flanco, alto, emboscado: embosc[0] ? 0 : embosc[1] ? 1 : null,
      motivo, dia: e.dia, vivres: [0, 1].map(b => Math.min.apply(null, G[b].map(L => L.vivres).concat(VIVERES))), moral: [e.bandos[0].moral, e.bandos[1].moral], lineas,
      sides: [0, 1].map(b => ({ name: e.bandos[b].nombre, car: e.bandos[b].car, units: unidades(b), fuerza: G[b].reduce((s, L) => s + fuerza(L), 0), legiones: G[b].map(L => L.id) })) };
    e.terminado = true; e.fin = { tipo: 'choque', punto, motivo }; e.choque = ch;
    return { estado: e, sucesos: su, choque: ch };
  }

  // Ventaja del bando 0 en un choque (>1 favorece a Roma), con los mismos factores que pasan a la cfg.
  M.ventajaChoque = function (ch) {
    const p = b => ch.sides[b].fuerza * (1 + 0.15 * (ch.desplegado[b] ? 1 : 0)) * (1 + 0.25 * (ch.alto === b ? 1 : 0)) * (1 - 0.2 * (ch.animo[b] === 'Vacilante' ? 1 : 0)) * (1 - 0.08 * ch.cansancio[b]) * (1 - 0.15 * ch.flancoAbierto[b].length);
    return p(0) / Math.max(1, p(1));
  };
  M.ventajaFinal = function (e) {
    if (e.choque) return M.ventajaChoque(e.choque);
    if (e.fin && e.fin.bando != null) return e.fin.bando === 1 ? 5 : 0.2;
    return 1;
  };

  /* ---------- retirarse del choque (pierdes víveres y algo de moral, no hombres) ---------- */
  M.retirarse = function (e0, b) {
    const e = clon(e0); if (!e.choque) return e; const ch = e.choque, c = masCerca(e, ch.punto, 'Castra');
    legs(e, b).filter(L => L.punto === ch.punto).forEach(L => {
      const a = L.prev !== ch.punto ? L.prev : (c != null && c !== ch.punto ? paso(e, ch.punto, c) : (vecinos(e, ch.punto)[0] || ch.punto));
      L.punto = a; L.prev = a; L.vivres = Math.max(0, L.vivres - 2);
    });
    e.bandos[b].moral = Math.max(0, e.bandos[b].moral - 10); e.choque = null; e.terminado = false; e.fin = null;
    if (e.dia >= e.max) { e.terminado = true; e.fin = { tipo: 'retirada', bando: b }; }
    return e;
  };

  /* ---------- los tres tribunos ---------- */
  // Valora una jugada de un día mirando solo lo que ves (la niebla manda): puntuación media y la razón principal.
  function evaluar(e, b, destinos) {
    const vi = M.vista(e, b), L = legs(e, b), razones = []; let total = 0;
    L.forEach(l => {
      const d = destinos[l.id] || l.punto, t = tipo(e, d), mueve = d !== l.punto; let s = 0, r = '';
      const comida = t === 'Castra' ? VIVERES : Math.max(0, l.vivres - (mueve && (t === 'Vado' || t === 'Pinar') ? 2 : 1));
      if (t !== 'Castra' && comida === 0 && l.sinVivres >= 1) { s -= 3; r = 'sin víveres: se retiraría por hambre'; } else if (t !== 'Castra' && comida <= 1) { s -= 1; r = 'quedan pocos víveres'; }
      if (t === 'Castra' && mueve && l.vivres <= 3) { s += 1.5; r = 'repones víveres antes de quedarte sin comida'; }
      const cans = t === 'Castra' ? l.cansancio - 30 : mueve ? l.cansancio + 20 : l.cansancio - 15; if (cans >= 70) { s -= 1; r = r || 'la tropa llega agotada'; }
      const ve = vi.puntos[d].enemigos || [], mia = L.filter(x => (destinos[x.id] || x.punto) === d).reduce((q, x) => q + fuerza(x), 0);
      if (ve.length) {
        const rival = ve.reduce((q, x) => q + x.fuerza, 0), alto = t === 'Cerro' ? 1.25 : t === 'Castra' ? 1.15 : 1, rr = mia / (rival * alto * 1.15) * (t === 'Vado' && mueve ? 0.8 : 1);   // el que espera está desplegado (+15 %)
        if (rr >= 1.15) { s += 2; r = r || 'superioridad sobre lo que se ve en ' + pt(e, d).n; } else if (rr <= 0.87) { s -= 2; r = r || 'el rival es más fuerte en ' + pt(e, d).n; } else r = r || 'fuerzas parejas en ' + pt(e, d).n;
      } else {
        const carrera = vi.enemigos.some(x => dist(e, x.punto, d) <= 1);   // si el rival ya está a un paso del cerro, llegáis a la vez y nadie tiene la altura
        const v = { Cerro: carrera ? 0 : 1.1, Castra: 0.4, Pinar: carrera ? -0.2 : 0.4, Vado: -0.9, Puente: -0.3 }[t] || 0; s += v;
        if (!mueve && (t === 'Castra' || t === 'Cerro') && l.vivres >= 3) { s += 0.6; r = r || 'esperar descansado y desplegado en ' + pt(e, d).n.toLowerCase(); }   // el que espera en buen sitio obliga al otro a venir cansado
        if (v >= 1) r = r || 'tomas ' + pt(e, d).n.toLowerCase() + ' antes que el rival'; else if (v < 0) r = r || 'cruzar ' + pt(e, d).n.toLowerCase() + ' te dejaría cansado y Vacilante';
        if (mueve && t === 'Pinar' && !vi.explora) { s -= 0.3; r = r || 'el pinar puede esconder una emboscada'; }
      }
      total += s; razones.push([Math.abs(s), r]);
    });
    if (L.length > 1 && new Set(L.map(l => l.punto)).size > 1 && new Set(L.map(l => destinos[l.id] || l.punto)).size === 1) { total += 1; razones.push([1, 'dos legiones convergen por caminos distintos']); }
    razones.sort((x, y) => y[0] - x[0]);
    return { score: L.length ? total / L.length : 0, motivo: (razones.find(x => x[1]) || [0, 'sin novedad'])[1] };
  }
  M.evaluar = evaluar;

  // Tres opciones, una por tribuno (prudente, agresivo, astuto), con etiqueta Favorable / Dudoso / Arriesgado y su motivo.
  M.consejoDia = function (e, b) {
    const vi = M.vista(e, b), meta = e.zona.ini[1 - b], centro = e.zona.centro, L = legs(e, b);
    const plan = T => {
      const dest = {}, usados = [];
      L.forEach((l, i) => {
        const aqui = l.punto, esC = tipo(e, aqui) === 'Castra', objetivo = (vi.enemigos[0] && vi.enemigos[0].punto) || meta; let d = aqui;
        if (!esC && hambriento(e, l)) { const c = masCerca(e, aqui, 'Castra'); d = c != null ? paso(e, aqui, c) : aqui; }
        else if (T.car === 'prudente') { const c = masCerca(e, aqui, 'Cerro'); d = tipo(e, aqui) === 'Cerro' || (esC && l.vivres < VIVERES) ? aqui : (c != null && dist(e, aqui, c) <= 2 ? paso(e, aqui, c) : aqui); }
        else if (T.car === 'agresivo') d = paso(e, aqui, objetivo);
        else { const p = masCerca(e, aqui, 'Pinar'); d = p != null && dist(e, aqui, p) <= 2 && !vi.enemigos.length ? paso(e, aqui, p) : paso(e, aqui, objetivo, [centro].concat(i % 2 ? usados : [])); usados.push(d); }
        dest[l.id] = d == null ? aqui : d;
      });
      return dest;
    };
    return TRIBUNOS.map(T => {
      const dest = plan(T), ev = evaluar(e, b, dest), et = ev.score >= 0.9 ? 'Favorable' : ev.score <= -0.9 ? 'Arriesgado' : 'Dudoso';
      return { tribuno: T.n, caracter: T.t, etiqueta: et, puntos: Math.round(ev.score * 100) / 100, motivo: ev.motivo.charAt(0).toUpperCase() + ev.motivo.slice(1) + '.',
        ordenes: L.map(l => ({ legion: l.id, a: dest[l.id] })), resumen: L.map(l => l.nombre + (dest[l.id] === l.punto ? ' se queda' : ' va a ' + pt(e, dest[l.id]).n)).join('; ') };
    });
  };

  root.Maniobra = M;
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? window : globalThis);
