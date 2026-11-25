/* AQVILA — lógica de campaña: economía, ciudades, marchas, IA enemiga, hechos históricos */
(function (root) {
  const D = root.DATA;
  const T = (root.ASESOR || (typeof require !== 'undefined' ? require('./asesor.js') : null)).TEXTOS;   // R4: avisos de una frase
  const DIP = root.DIPLOMACIA || require('./diplomacia.js');   // C3: alianzas, tributos e IA que construye
  const G = { state: null, onEvent: null };
  /* CDe1-A: ministros (js/ministros.js), plan del Senado (js/plan-senado.js) y necesidades de barrio (js/necesidades.js, ESM: G.usarNecesidades). Sin ellos todo sigue igual. */
  let MIN = root.MINISTROS || null, PLAN = root.PLAN_SENADO || null, NEC = null, AGRO = null, MERC;
  /* CDe3-F2a: agricultura por suelos (G.usarAgricultura, ESM) y mercado de los recursos (root.MERCADO o require('./mercado.js'); G.usarMercado(null) lo apaga). Sin ellos todo sigue como antes. */
  const merc = () => { if (MERC === undefined) { MERC = root.MERCADO || null; if (!MERC && typeof require !== 'undefined') { try { MERC = require('./mercado.js'); } catch (e) { MERC = null; } } } return MERC; };
  const libs = () => {
    if (!MIN) { MIN = root.MINISTROS || null; if (!MIN && typeof require !== 'undefined') { try { MIN = require('./ministros.js'); } catch (e) { MIN = null; } } }
    if (!PLAN) { PLAN = root.PLAN_SENADO || null; if (!PLAN && MIN && typeof require !== 'undefined') { try { PLAN = require('./plan-senado.js'); } catch (e) { PLAN = null; } } }
    return !!MIN;
  };
  /* CDe4: caminos de victoria (CAMINOS), «Este año» (ESTEANO) y gobernador (GOBERNADOR). Se piden al usarlos; sin ellos todo sigue igual. */
  const modulo = (nom, arch) => { if (root[nom]) return root[nom]; if (typeof require !== 'undefined') { try { return require(arch); } catch (e) { return null; } } return null; };
  const CAM = () => modulo('CAMINOS', './caminos.js'), EA = () => modulo('ESTEANO', './este-ano.js'), GOB = () => modulo('GOBERNADOR', './gobernador.js');
  // apunta en «Este año» (cantidad > 0 entra, < 0 sale); ciudad vacía = '_imperio'
  const apunta = (cid, r, n, mot) => { const s = G.state, e = EA(); if (!e || !s || !s.esteAno || !s.esteAno.actual || typeof n !== 'number' || !isFinite(n) || n === 0) return; e.apunta(s.esteAno.actual, cid || '_imperio', r, n, mot); };
  G.apunta = apunta;
  const SAVE_KEY = 'aqvila-save-v1';
  const emit = (type, p) => { if (G.onEvent) G.onEvent(type, p); };
  const sum = o => { let n = 0; for (const k in o) n += o[k]; return n; };

  // General con nombre que defiende una ciudad en un año (a.C., bajan): entre `from` (opcional) y `until`
  G.cityGen = (id, year) => { const d = D.CITIES[id], g = d && d.gen; return g && year >= g.until && (!g.from || year <= g.from) ? g : null; };
  G.yearOf = t => D.START_YEAR - Math.floor(t / 12);
  G.dateStr = t => G.estacion(t) + ' · ' + G.yearOf(t) + ' a.C.';   // ES20: sin meses a la vista
  G.estTxt = n => n + (n === 1 ? ' estación' : ' estaciones');   // ES20: «1 estación», «2 estaciones»
  G.rate = L => L <= 0 ? 0 : D.PROD_NIVEL1 * D.NIVEL_PROD[Math.min(L, D.MAX_LVL)];   // CE3-A2: 1, 3, 6, 10, 15 x PROD_NIVEL1 (cuenta en data.js)
  G.cost = function (b, L) { const o = {}, base = D.BUILD[b].cost, m = D.NIVEL_COSTE[L + 1] || L + 1; for (const r in base) o[r] = Math.round(base[r] * m / 5) * 5; return escalaCoste(o); };   // CE3-A2: subir al nivel L+1 cuesta base x (L+1)
  /* CE3-A1: tiempo en estaciones. G.estaciones(meses) = estaciones enteras hacia arriba (mínimo 1). Una obra que sube al nivel L dura D.OBRA_ESTACIONES[L].
     Lo que antes acortaba la obra (foro -4 %/nivel, bonoMul('obra'), modo) ahora la abarata en la misma proporción: G.obraMul(c) multiplica el coste. */
  G.estaciones = m => Math.max(1, Math.ceil((m || 0) / D.ESTACION - 1e-9));
  G.obraEstNivel = L => D.OBRA_ESTACIONES[Math.max(1, Math.min(L, D.OBRA_ESTACIONES.length - 1))] || D.OBRA_ESTACIONES_MAX;
  G.obraMul = c => (1 - 0.04 * ((c && c.b && c.b.foro) || 0)) * G.bonoMul('obra');
  const abarata = (o, m) => { if (m === 1) return o; const r = {}; for (const k in o) r[k] = o[k] > 0 ? Math.max(1, Math.round(o[k] * m)) : o[k]; return r; };
  G.abarata = abarata;
  G.obraEstaciones = (c, b) => G.obraEstNivel(((c && c.b && c.b[b]) || 0) + 1);   // para la pantalla: estaciones de la próxima obra de b en la ciudad c
  G.costeObra = (c, b) => abarata(G.cost(b, (c.b[b] || 0)), G.obraMul(c));          // para la pantalla: lo que cuesta de verdad la próxima obra de b (con los bonos)
  G.estacionesRestan = q => !q || !(q.t1 >= 0) ? 0 : Math.max(0, Math.ceil((q.t1 - G.state.t) / D.ESTACION - 1e-9));   // estaciones que le quedan a una obra, lote, marcha o estudio
  G.buildTime = (city, b) => D.ESTACION * G.obraEstaciones(city, b);
  G.myCities = () => Object.keys(G.state.cities).filter(id => G.state.cities[id].owner === 'roma');
  /* ---------- solares y tipos de ciudad (I4) ---------- */
  /* ---------- templos a un dios (F5) y ciudades conquistadas ---------- */
  G.diosDe = c => ((c.b.templo || 0) > 0 || G.obraDe(c, 'templo')) && D.DIOSES[c.dios] ? D.DIOSES[c.dios] : null;
  G.diosNivel = c => G.diosDe(c) ? (c.b.templo || 0) * G.diosMulFiesta(c) : 0;   // CN13a: una ofrenda en vigor multiplica el don del dios
  G.elegirDios = function (cid, k) { const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.DIOSES[k] || (c.b.templo || 0) > 0 || G.obraDe(c, 'templo') || (D.DIOSES[k].sea && !D.CITIES[cid].sea)) return false; c.dios = k; return true; };
  G.inqMul = c => (c.inq > 0 ? 1 - D.INQ_PROD * G.invMul('inqProd') * Math.min(1, c.inq / (D.INQ_MESES * G.invMul('inqMeses'))) : 1);
  G.tipoDe = c => D.TIPOS[c && c.tipo] || D.TIPOS.municipio;
  G.solares = function (id) { const d = D.CITIES[id], c = G.state && G.state.cities[id]; if (d.solares) return d.solares; return Math.min(D.SOLARES_MAX, D.SOLARES_BASE + Math.floor(((c && c.w) || d.w) / 2)); };
  // edificios urbanos que ocupan solar: nivel 1 o más (o levantándose ahora)
  G.solaresUsados = function (c) { let n = 0; for (const b in D.BUILD) if (D.BUILD[b].solar && ((c.b[b] || 0) >= 1 || G.obraDe(c, b))) n++; return n; };
  G.solaresLibres = (id) => G.solares(id) - G.solaresUsados(G.state.cities[id]);
  G.tipoSugerido = id => (D.CITIES[id] && D.CITIES[id].tipo) || null;
  G.tipoOk = (id, tipo) => !!D.TIPOS[tipo] && !(D.TIPOS[tipo].mar && !D.CITIES[id].sea);
  G.tipoCoste = c => c.tipoElegido ? D.TIPO_CAMBIO : 0;
  G.setTipo = function (cid, tipo) {
    const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !G.tipoOk(cid, tipo) || c.tipo === tipo && c.tipoElegido) return false;
    const coste = G.tipoCoste(c); if (G.disponible('denarios') < coste) return false;
    gasta('denarios', coste); c.tipo = tipo; c.tipoElegido = true; return true;
  };
  // tira un edificio urbano propio a nivel 0 (sin devolver nada) y libera su solar
  G.derribar = function (cid, b) {
    const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.BUILD[b] || !D.BUILD[b].solar || b === 'foro' || (c.b[b] || 0) < 1 || G.obraDe(c, b)) return false;
    const pz = piezaDe(b), r = pz && infoC(c);
    if (r) { const e = menorMejora(r.E, pz); if (!e) return false; quitar(r.E, e.id); sinc(c, r); ponerDatos(c, r); }
    else c.b[b] = 0;
    const pc = G.popCap(c); if (c.pop > pc) c.pop = pc; return true;
  };
  G.capDe = r => Math.round(G.cap() * ((D.CAP_MUL && D.CAP_MUL[r]) || 1));   // CE2: tope de un recurso (los materiales caben el doble: son madera y piedra)
  G.cap = () => { let c = 0; for (const id of G.myCities()) c += 600 * Math.pow(1.45, G.state.cities[id].b.almacen || 0); return Math.round(c); };
  G.men = units => { let n = 0; for (const k in units) n += units[k] * (D.UNITS[k].cls === 'ele' ? 1 : 1); return n; };
  G.power = units => { let p = 0; for (const k in units) { const u = D.UNITS[k]; p += units[k] * (u.atk + u.def) * (u.hp || 1) * (u.mass ? 1.6 : 1); } return Math.round(p / 10); };
  G.lugar = id => D.CITIES[id] || (D.COLONIAS && D.COLONIAS[id]) || null;   // ficha de ciudad o de sitio de colonia (n, lon, lat)
  const esSitio = id => !D.CITIES[id] && !!(D.COLONIAS && D.COLONIAS[id]);
  G.pos = id => { const c = G.lugar(id); return D.proj(c.lon, c.lat); };
  G.regionId = () => (G.state && G.state.region && D.REGIONES[G.state.region]) ? G.state.region : 'mediterraneo';
  G.region = () => D.REGIONES[G.regionId()];
  G.ciudadesRegion = () => D.regionCiudades(G.regionId(), !!(G.state && G.state.modo));
  /* ---------- modos de partida (I8): todo número viene de D.MODOS; sin modo (campaña histórica) nada cambia ---------- */
  G.modo = () => { const m = G.state && G.state.modo; return m && D.MODOS[m.id] && m.id !== 'campana' ? D.MODOS[m.id] : null; };
  G.modoFase = () => { const m = G.state && G.state.modo; return m && D.MODOS[m.id] && m.id !== 'campana' ? (m.fase || 'jugando') : null; };   // null (campaña) | 'fundando' | 'arando' | 'jugando'
  G.fundando = () => G.modoFase() === 'fundando';
  G.arando = () => G.modoFase() === 'arando';   // I8b: ciudad ya fundada, el arado aún traza el surco: el reloj sigue parado
  G.finArado = () => { if (G.arando()) { G.state.modo.fase = 'jugando'; emit('dirty'); } };
  // factor del modo para una clave de D.MODOS[id].factores (el de la variante de inicio pisa al general); 1 sin modo
  G.factor = k => { const md = G.modo(); if (!md) return 1; const v = md.inicio && md.inicio[G.state.modo.inicio] && md.inicio[G.state.modo.inicio].factores; const x = v && v[k] !== undefined ? v[k] : (md.factores || {})[k]; return x === undefined ? 1 : x; };
  const escalaCoste = o => { o = D.costeNuevo(o, 'obra'); const f = G.factor('costes'); if (f === 1) return o;   // CE2: los costes de ciudad.js (claves viejas) se traducen aquí
    const r = {}; for (const k in o) r[k] = Math.max(1, Math.round(o[k] * f / 5) * 5); return r; };
  G.escalaCoste = o => escalaCoste(o);   // CE2: la pantalla enseña el coste de una pieza de ciudad.js como se cobra (claves nuevas y factor del modo)
  G.hasta = () => { const md = G.modo(); return md && md.hasta !== undefined ? md.hasta : G.region().hasta; };
  G.capitalRival = () => { const md = G.modo(); return md && md.capitalRival ? md.capitalRival : G.region().capitalRival; };
  G.capital = () => { const s = G.state; return s && s.capital && s.cities[s.capital] ? s.capital : 'roma'; };
  G.edadMax = () => { const md = G.modo(); return md && md.edades ? md.edades : 4; };
  const textoFinal = (k, v) => { const md = G.modo(), t = md && md.final && md.final[k] ? md.final[k] : G.region().final[k]; let o = t; for (const q in (v || {})) o = o.split('{' + q + '}').join(v[q]); return o; };
  // resumen para la pantalla final (sin nota ni puntuación: P88 no está aprobada)
  G.resumen = function () {
    const s = G.state, md = G.modo(), turnos = Math.ceil(s.t / D.TURNO_MESES - 1e-9), seg = md && md.duracion ? md.duracion.segPorTurno : 0;
    return { modo: s.modo ? s.modo.id : 'campana', inicio: s.modo ? s.modo.inicio : null, anio: G.yearOf(s.t), turnos: turnos, horas: Math.round(turnos * seg / 36) / 100,
      ciudades: G.myCities().length, fundadas: G.coloniasFundadas(s), capital: s.capital || null, batallas: s.stats.battles, victorias: s.stats.wins, bajasEnemigas: s.stats.kills, bajasPropias: s.stats.lost,
      edad: s.inv ? s.inv.edad : 1, heroe: s.hero.lvl };
  };
  function terminar(win, why) { const s = G.state; s.over = { win: win, why: why }; if (s.modo) { s.over.resumen = G.resumen(); s.over.resumen.nota = G.nota(win); } }
  /* ---------- CN18: hecho para el móvil (nota de la partida corta, crónica de la ciudad, punto de parada, copia en archivo). Sin pantalla. ---------- */
  const NIV_DIF = { tranquila: 0, normal: 1, dura: 2 };
  // la dificultad más dura usada y los sucesos que alguna vez estuvieron apagados (a.hist guarda cada cambio; a.dif y a.suc son los vigentes)
  G.ajustesUsados = function () { const a = G.state && G.state.ajustes; if (!a) return { dif: 'normal', apagados: [] }; G.migrarAjustes(G.state); return { dif: a.maxDif, apagados: a.apagados.slice() }; };
  // nota de 1 a 10: cuatro criterios de 0 a 10 (ciudad, población, ejército, años); la dificultad más dura usada la multiplica y cada suceso apagado resta medio punto
  const NOTA_REF = { niveles: 100, pob: 2500, poder: 5000 }, NOTA_DIF = { tranquila: 0.8, normal: 1, dura: 1.15 }, NOTA_NOM = { crecida: 'la crecida', fuego: 'los incendios', hambre: 'el hambre de invierno' };
  G.nota = function (win) {
    const s = G.state, cs = G.myCities().map(id => s.cities[id]), md = G.modo(), c10 = x => Math.max(0, Math.min(10, Math.round(x * 10) / 10));
    const niv = cs.reduce((n, c) => n + Object.values(c.b || {}).reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0), 0), pob = cs.reduce((n, c) => n + Math.max(0, c.pop || 0), 0);
    let pod = cs.reduce((n, c) => n + G.power(c.units || {}), 0); for (const m of s.marches) if (m.owner === 'roma') pod += G.power(m.units || {});
    const total = Math.max(1, G.yearOf(0) - G.hasta()), vivido = Math.max(0, Math.min(total, G.yearOf(0) - G.yearOf(s.t))), f = vivido / total;
    const cr = [{ id: 'ciudad', n: 'Ciudad', v: c10(niv / NOTA_REF.niveles * 10), d: niv + ' niveles de edificios' }, { id: 'poblacion', n: 'Población', v: c10(pob / NOTA_REF.pob * 10), d: Math.round(pob) + ' habitantes' },
      { id: 'ejercito', n: 'Ejército', v: c10(pod / NOTA_REF.poder * 10), d: 'fuerza ' + pod }, { id: 'anios', n: 'Años', v: c10(win ? 10 - 6 * f : 10 * f * 0.5), d: win ? 'victoria en ' + G.yearOf(s.t) + ' a.C.' : 'resististe hasta ' + G.yearOf(s.t) + ' a.C.' }];
    const u = G.ajustesUsados(), media = cr.reduce((a, q) => a + q.v, 0) / cr.length, mul = NOTA_DIF[u.dif], pen = Math.min(1.5, 0.5 * u.apagados.length);
    return { nota: Math.max(1, Math.min(10, Math.round(media * mul - pen))), criterios: cr, dif: u.dif, difNombre: (D.DIFICULTAD[u.dif] || {}).nombre || u.dif, mul: mul, apagados: u.apagados.map(k => NOTA_NOM[k] || k), penal: pen };
  };
  /* crónica de una ciudad en texto llano (para copiar o bajar como .txt): barrios, edificios, hitos, encargos y los últimos hechos del diario */
  G.cronicaTexto = function (cid) {
    const s = G.state, c = s && s.cities[cid]; if (!c) return ''; const E = G.ciudadE(cid), l = [], nom = D.CITIES[cid].n, H = Object.values(D.HITOS).filter(h => s.hitos && s.hitos[h.id] !== undefined);
    l.push('CRÓNICA DE ' + nom.toUpperCase(), G.dateStr(s.t) + ' · ' + Math.round(c.pop || 0) + ' habitantes' + (s.ajustes ? ' · dificultad ' + ((D.DIFICULTAD[s.ajustes.dif] || {}).nombre || '') : ''), '');
    if (E && E.edificios) { const n = {}; for (const e of E.edificios) { const q = CI.EDIF && CI.EDIF[e.tipo]; const k = q ? q.nombre : e.tipo; n[k] = (n[k] || 0) + 1; } const t = Object.keys(n).map(k => n[k] + ' ' + k.toLowerCase()); if (t.length) l.push('Edificios: ' + t.join(', ') + '.'); if (E.barrios && E.barrios.length) l.push('Barrios: ' + E.barrios.map(b => b.nombre).join(', ') + '.'); }
    if (c.obras && c.obras.length) l.push('Obras en marcha: ' + c.obras.length + '.');
    if (H.length) { l.push('', 'Hitos'); for (const h of H) l.push('- ' + h.n + ' (' + G.dateStr(s.hitos[h.id]) + ')'); }
    const E1 = s.encargos && s.encargos.hechos ? Object.keys(s.encargos.hechos).filter(k => s.encargos.hechos[k] === 'ok' && D.ENCARGOS[k]) : [];
    if (E1.length) { l.push('', 'Encargos del Senado cumplidos'); for (const k of E1) l.push('- ' + D.ENCARGOS[k].n); }
    const hs = (s.log || []).filter(q => q.x && q.k !== 'bad').slice(0, 10); if (hs.length) { l.push('', 'Últimos hechos'); for (const q of hs) l.push('- ' + G.dateStr(q.t) + ': ' + q.x); }
    l.push('', 'AQVILA · Roma, 280–146 a.C.'); return l.join('\n');
  };
  /* punto de parada: una línea de qué hacías (la guarda G.save y la muestra la pantalla al volver) */
  G.paradaAhora = function () {
    const s = G.state, mias = G.myCities(), cid = mias.includes(s.hero && s.hero.city) ? s.hero.city : (mias[0] || null), nom = cid ? D.CITIES[cid].n : 'Roma'; let x;
    const ob = mias.reduce((n, id) => n + (s.cities[id].obras || []).length, 0), mar = s.marches.filter(m => m.owner === 'roma').length, enc = s.encargos && s.encargos.activo ? G.encargoActual() : null;
    if (s.pending && s.pending.length) x = 'Una batalla esperaba tu orden.'; else if (mar) x = 'Tenías ' + mar + (mar === 1 ? ' ejército en marcha.' : ' ejércitos en marcha.');
    else if (enc) x = 'Encargo del Senado: ' + enc.e.n + ' (' + enc.tiene + ' de ' + enc.pide + ').'; else if (ob) x = 'Tenías ' + ob + (ob === 1 ? ' obra en marcha' : ' obras en marcha') + ' en tus ciudades.'; else x = 'Gobernabas ' + nom + ' con calma.';
    return { t: s.t, anio: G.yearOf(s.t), fecha: G.dateStr(s.t), ciudad: cid, texto: x };
  };
  G.migrarParada = function (s) { const p = s.parada; if (!p || typeof p !== 'object' || typeof p.texto !== 'string' || typeof p.t !== 'number') s.parada = null; };
  /* copia de la partida en un archivo: el mismo JSON que se guarda en el móvil (lleva s.ajustes) */
  G.exportar = function () { const s = G.state; if (!s) return null; for (const id of G.myCities()) { const c = s.cities[id], r = CI && regE.get(c); if (r) ponerDatos(c, r); } s.parada = G.paradaAhora(); return JSON.stringify(s); };
  G.importar = function (txt) {
    const mal = m => ({ ok: false, motivo: m });
    if (typeof txt !== 'string' || txt.length > 12e6) return mal('El archivo es demasiado grande o no es de texto.'); let s; try { s = JSON.parse(txt); } catch (e) { return mal('El archivo no es una copia de AQVILA.'); }
    if (!s || typeof s !== 'object' || s.v !== 1 || !s.cities || typeof s.cities !== 'object' || typeof s.t !== 'number' || !Array.isArray(s.marches) || !s.hero) return mal('El archivo no es una copia de AQVILA (versión 1).');
    if (typeof localStorage === 'undefined') return mal('Este navegador no deja guardar partidas.'); const antes = localStorage.getItem(SAVE_KEY), prev = G.state, volver = () => { G.state = prev; try { if (antes === null) localStorage.removeItem(SAVE_KEY); else localStorage.setItem(SAVE_KEY, antes); } catch (e) { } };
    try { localStorage.setItem(SAVE_KEY, txt); if (!G.load()) { volver(); return mal('La copia está dañada: no se ha cambiado tu partida.'); } } catch (e) { volver(); return mal('La copia está dañada: no se ha cambiado tu partida.'); }
    return { ok: true, motivo: '' };
  };
  let aristasC = null;
  G.aristas = () => { const id = G.regionId(), r = G.region(), col = !!(G.state && G.state.modo); if (!aristasC || aristasC.id !== id || aristasC.r !== r || aristasC.col !== col) aristasC = { id: id, r: r, col: col, e: D.regionEdges(id, col).filter(e => !G.state || !G.state.cities || (G.state.cities[e[0]] && G.state.cities[e[1]])) }; return aristasC.e; };
  G.edge = (a, b) => (esSitio(a) || esSitio(b)) ? ((G.lugar(a) && G.lugar(b)) ? [a, b, false] : undefined) : G.aristas().find(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));   // con un sitio: arista sintética por distancia
  G.neighbors = id => G.aristas().filter(e => e[0] === id || e[1] === id).map(e => e[0] === id ? e[1] : e[0]);
  /* ---------- una sola reserva (ES20) ----------
     s.res = lo recogido este mes interno (pasa al almacén al cerrarlo); s.alm = almacén. Todo se puede gastar: ya no hay cuarto del almacén.
     Al empezar cada estación s.res está a cero y todo lo recogido está en el almacén. s.cuarto queda en la partida sin efecto. */
  const cuartoDisp = r => { const s = G.state; return Math.max(0, (s.alm && s.alm[r]) || 0); };
  G.disponible = r => Math.max(0, G.state.res[r] || 0) + cuartoDisp(r);
  G.reserva = r => G.state ? G.disponible(r) : 0;   // ES20: lo que tienes de r (para la pantalla)
  // gasta n de r: primero lo recogido este mes, luego el almacén
  let ctxG = null;   // CDe4: motivo y ciudad con que se apunta en «Este año» lo que salga de gasta() mientras dura la llamada
  const conGasto = (mot, cid, fn) => { const a = ctxG; ctxG = { mot, cid }; try { return fn(); } finally { ctxG = a; } };
  function gasta(r, n, sinCuenta) { if (n > 0 && (ctxG || !sinCuenta)) apunta(ctxG ? ctxG.cid : null, r, -n, ctxG ? ctxG.mot : 'otros'); const s = G.state, de = Math.min(n, Math.max(0, s.res[r])); if (!sinCuenta && s.gastoMes) s.gastoMes[r] = (s.gastoMes[r] || 0) + de; /* solo cuenta lo salido de la caja */ s.res[r] -= de; const resto = n - de; if (resto > 0) s.alm[r] = Math.max(0, s.alm[r] - resto); return de; }
  G.gasta = gasta;
  G.canAfford = c => { for (const r in c) if (G.disponible(r) < c[r]) return false; return true; };
  const pay = c => { for (const r in c) gasta(r, c[r]); };
  /* ---------- pagar al ordenar (ES20; antes, cuotas mensuales Q4) ----------
     Una obra o lote se paga ENTERO al ordenarlo; si no alcanza, no se ordena. Se guarda q = { nc: 1, pag: 1, cuota, costo, pausa: false }
     (el formato de Q4 con una sola cuota) para que la pantalla y las migraciones lo sigan leyendo. Ya no hay pausas ni cuotas que venzan. */
  const nuevoPlazo = costo => ({ nc: 1, pag: 0, cuota: costo, costo: costo, pausa: false });
  const cuotaK = (q, k) => { const o = {}; if (k < (q.nc || 1)) for (const r in q.costo) o[r] = q.costo[r]; return o; };
  G.cuotaSig = q => cuotaK(q, q.pag);
  G.cuotasRestantes = q => { const o = {}; if (q && q.costo && q.pag < (q.nc || 1)) for (const r in q.costo) o[r] = q.costo[r]; return o; };
  // paga q entero (obra o lote); lo de oro cuenta como obras del mes
  const ciudadDeQ = q => { const s = G.state; for (const id in s.cities) { const c = s.cities[id]; if ((c.obras || []).indexOf(q) >= 0 || (c.train || []).indexOf(q) >= 0) return id; } return null; };
  function pagaCuota(q, cid) { const c = cuotaK(q, q.pag); if (!G.canAfford(c)) return false; const cidQ = cid || ciudadDeQ(q), motQ = q.u ? 'legiones' : 'obras'; for (const r in c) { const de = conGasto(motQ, cidQ, () => gasta(r, c[r])); if (r === 'denarios') G.state.obrasMes = (G.state.obrasMes || 0) + de; } q.pag = q.nc || 1; return true; }
  // ES20: nada vence ni se pausa; se dejan como funciones inofensivas por si la pantalla vieja las llama
  G.plazos = function () { const o = {}; for (const r of D.RES) o[r] = 0; return o; };
  G.reintentarPlazos = function () {};
  G.adelantarObra = () => false;
  G.obraMayor = () => null;
  // ES20: fin de algo que dura `meses`: al cerrar la estación que toca (la actual cuenta como la primera)
  G.finEn = meses => G.finTurno() + (G.estaciones(meses) - 1) * D.ESTACION;

  /* ---------- aldeanos: reparto de la población trabajadora (20 partes) ---------- */
  // CE2: los aldeanos se reparten entre los cuatro campos (aserradero y cantera dan materiales; la mina, hierro solo con veta)
  G.REPARTO_RES = ['aserradero', 'cantera', 'mina', 'granja'];
  // sin veta de hierro la mina no da nada: de partida, un aldeano en ella y el resto en materiales y grano (licencia de juego)
  G.repartoBase = cid => cid && !G.vetaHierro(cid) ? { aserradero: 7, cantera: 6, mina: 1, granja: 6 } : { aserradero: 5, cantera: 5, mina: 5, granja: 5 };
  /* ---------- CE2: hierro, hombres y bienes ---------- */
  G.vetaHierro = cid => D.VETAS_HIERRO.indexOf(cid) >= 0;
  // por qué no se puede abrir o subir la mina en esta ciudad (null = se puede)
  G.minaMotivo = cid => G.vetaHierro(cid) ? null : 'Aquí no hay vetas de hierro: la mina solo se abre en Etruria o en Hispania. Compra el hierro en el mercado.';
  // rendimiento de la mina: entero con veta; una mina vieja fuera de las vetas, al VETA_POBRE («vetas pobres»)
  G.minaMul = cid => G.vetaHierro(cid) ? 1 : D.VETA_POBRE;
  // hombres: no se guardan; son los reclutas libres de tus ciudades
  G.hombres = () => G.state ? G.myCities().reduce((n, id) => n + G.recruits(G.state.cities[id]), 0) : 0;
  // bienes guardados: { esp: n }. Producción al mes de cada bien con las ciudades propias de hoy
  G.bienes = () => (G.state && G.state.bienes) || {};
  G.bienesMes = function () { const o = {}; for (const id of G.myCities()) { const k = D.CITIES[id].esp; if (D.BIENES[k]) o[k] = (o[k] || 0) + D.BIEN_MES; } return o; };
  // bienes de lujo que piden al mes los ciudadanos ricos de tus ciudades
  G.lujoPide = () => { let n = 0; for (const id of G.myCities()) n += G.clases(G.state.cities[id]).ciu * D.LUJO_POR_CIU; return n; };
  G.precioBien = k => D.BIENES[k] ? D.BIENES[k].precio : 0;
  // vende n unidades del bien k por denarios a precio fijo; devuelve los denarios recibidos (0 si no se puede)
  G.venderBien = function (k, n, precio) {
    const s = G.state; if (!s || !D.BIENES[k]) return 0; const b = s.bienes || (s.bienes = {}); n = Math.floor(Math.min(n, b[k] || 0)); if (n < 1) return 0;
    const p = precio || G.precioBien(k), hueco = Math.max(0, G.cap() - s.alm.denarios - s.res.denarios), dar = Math.min(n, Math.floor(hueco / p)); if (dar < 1) return 0;
    b[k] -= dar; const got = Math.round(dar * p); s.res.denarios += got; return got;
  };
  // lo que se perderá al cerrar el mes de cada bien (producción del mes menos lujo, sobre el tope)
  G.bienesPerdera = function () { const s = G.state, b = G.bienes(), m = G.bienesMes(), o = {}; for (const k in D.BIENES) { const v = (b[k] || 0) + (m[k] || 0) * Math.max(0, G.finTurno() - s.t); if (v > D.BIEN_TOPE) o[k] = Math.floor(v - D.BIEN_TOPE); } return o; };
  // cierre de mes de los bienes: entra lo de cada ciudad, los ricos consumen lujo, y lo que pasa del tope se pierde (y se cuenta)
  function cierreBienes() {
    const s = G.state, b = s.bienes || (s.bienes = {}), m = G.bienesMes(), per = [];
    for (const k in m) { b[k] = (b[k] || 0) + m[k]; s.bienesGan = (s.bienesGan || 0) + m[k]; }
    let pide = G.lujoPide(); for (const k of D.LUJO) { if (pide <= 0) break; const de = Math.min(pide, b[k] || 0); b[k] = (b[k] || 0) - de; pide -= de; }
    s.lujoFalta = pide > 1e-9 && G.lujoPide() > 0;
    s.lujoServido = !s.lujoFalta && G.lujoPide() > 0;   // CE12: los ricos tuvieron su lujo este mes aunque se gastara: el servicio «lujo» del barrio sigue
    for (const k in b) { const ag = D.BIENES_AGRO && D.BIENES_AGRO[k]; if (!D.BIENES[k] && !ag) { delete b[k]; continue; } if (b[k] > D.BIEN_TOPE) { const x = b[k] - D.BIEN_TOPE; b[k] = D.BIEN_TOPE; s.bienesPerdidos = (s.bienesPerdidos || 0) + x; per.push(Math.round(x) + ' de ' + (ag ? ag.n : D.ESPECIAL[k].n).toLowerCase()); } }
    return per;
  }
  G.repartoValido = r => !!r && G.REPARTO_RES.every(k => Number.isInteger(r[k]) && r[k] >= 1 && r[k] <= 11) && G.REPARTO_RES.reduce((a, k) => a + r[k], 0) === 20;
  G.repartoDe = c => G.repartoValido(c.reparto) ? c.reparto : G.repartoBase(idDe(c));
  // dir +1: quita una parte al otro recurso con más partes; dir -1: la da al que menos tiene
  G.reparto = function (cid, res, dir) {
    const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || G.REPARTO_RES.indexOf(res) < 0 || (dir !== 1 && dir !== -1)) return false;
    if (!G.repartoValido(c.reparto)) c.reparto = G.repartoBase(cid);
    const r = c.reparto, otros = G.REPARTO_RES.filter(k => k !== res);
    if (dir > 0) { if (r[res] >= 11) return false; let o = otros[0]; for (const k of otros) if (r[k] > r[o]) o = k; if (r[o] <= 1) return false; r[o]--; r[res]++; return true; }
    if (r[res] <= 1) return false; let o = otros[0]; for (const k of otros) if (r[k] < r[o]) o = k; if (r[o] >= 11) return false; r[o]++; r[res]--; return true;
  };

  /* ---------- mano de obra ---------- */
  G.CAMPOS = ['aserradero', 'cantera', 'mina', 'granja'];
  G.puestos = c => { let n = D.PUESTOS_BASE; for (const b of G.CAMPOS) n += D.PUESTOS_NIVEL * ((c.b && c.b[b]) || 0); return n; };
  G.manoObraDe = (c, pop) => Math.max(D.MANO_MIN, Math.min(1, pop / G.puestos(c)));
  G.manoObra = c => G.manoObraDe(c, G.popEfectiva(c));

  G.mantenimiento = function () {
    const s = G.state, pg = G.bonoMul('paga'), cien = G.invMul('paga') !== 1; let ed = 0, up = 0, pb = 0;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      for (const b in c.b) if (G.CAMPOS.indexOf(b) < 0) ed += c.b[b] || 0;
      if (c.pueblos) for (const n of c.pueblos) pb += n || 0;   // niveles de pueblo (J3)
      for (const k in c.units) up += c.units[k] * D.UNITS[k].up * (G.tipoDe(c).paga || 1) * (cien ? G.bonoMul('paga', G.tipoDe(c).paga || 1) : pg);
    }
    for (const m of s.marches) if (m.owner === 'roma') for (const k in m.units) up += m.units[k] * D.UNITS[k].up;
    const edificios = ed * D.MANT_EDIF + pb * D.MANT_EDIF * 0.5, tropas = up * D.MANT_TROPA;
    return { edificios: edificios, tropas: tropas, total: edificios + tropas };
  };

  G.prod = function () {
    const s = G.state, p = { grano: 0, denarios: 0, materiales: 0, hierro: 0 };
    const gOk = s.res.grano + s.alm.grano > 0;   // para el ánimo de las clases (sin recursión con barrioInfo)
    let up = 0, comPop = 0; const pc = {}; const det = { impuestos: 0, foro: 0 }; const ocm = G.bonoMul('oroCom'), imm = G.bonoMul('impuestos'), cOro = G.invMul('oroCom') !== 1, cGra = G.invMul('grano') !== 1;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      const rp = G.repartoDe(c);
      const mo = G.manoObraDe(c, G.popEfectiva(c, gOk)) * G.inqMul(c), tp = G.tipoDe(c), rm = tp.rec || 1, dg = G.diosDe(c), cer = dg && dg.grano ? 1 + dg.grano * G.diosNivel(c) : 1;
      const dM = ((4 + G.rateCampo(c, 'aserradero')) * rp.aserradero + (4 + G.rateCampo(c, 'cantera')) * rp.cantera) / 5 * mo * rm * D.MAT_MUL; p.materiales += dM;   // CE2: aserradero y cantera dan materiales
      const dH = (G.vetaHierro(id) ? 4 + G.rateCampo(c, 'mina') : G.rateCampo(c, 'mina') * D.VETA_POBRE) * rp.mina / 5 * mo * rm; p.hierro += dH;   // CE2: hierro solo con veta; una mina vieja fuera, al 25 %
      const dG = (6 + G.rateCampo(c, 'granja')) * rp.granja / 5 * mo * rm * (cGra ? G.bonoMul('grano', rm) : 1) * cer; p.grano += dG;
      const oF = (G.rate(c.b.foro) * 0.5 + 5 * (c.b.puerto || 0)) * (tp.oroCom || 1) * (cOro ? G.bonoMul('oroCom', tp.oroCom || 1) : ocm) * (c.puertas ? D.PUERTAS.comercio : 1), oI = G.cabezasImp(c, gOk) * 0.03 * G.impMult(c) * imm * D.BARRIO[c.barrio || 1].imp, oP = ((tp.oroPuerto || 0) + (dg && dg.oroPuerto ? dg.oroPuerto * G.diosNivel(c) : 0)) * (c.b.puerto || 0);
      const pb = G.puebloProd(id, gOk); for (const r in pb) p[r] += pb[r];   // pueblos (J3)
      const pcc = pc[id] = { cosecha: { materiales: dM, hierro: dH, grano: dG }, impuestos: 0, comercio: oF + oP, comida: 0, legiones: 0 }; for (const r in pb) pcc.cosecha[r] = (pcc.cosecha[r] || 0) + pb[r];   // CDe4: por ciudad, para «Este año»
      const oE = (c.esc || 0) * G.K().escRenta, rT = CI ? info(c) : null, oT = rT && rT.oroT ? rT.oroT : 0; const rv = 1 - G.revueltaParte(c); pc[id].impuestos = (oI + oE) * rv; pc[id].comercio += oT; p.denarios += oF + (oI + oE) * rv + oP + oT; det.foro += oF + oP + oT; det.impuestos += (oI + oE) * rv;   // CDe1-A: un barrio en revuelta no paga   // Villa esclavista: renta por esclavo (0 sin ese saber)   // foro + impuestos de la población + comercio del puerto
      { const gc = (c.pop || 0) * 0.02 * G.racionDe(c).grano; p.grano -= gc; comPop += gc; pc[id].comida = gc; }   // la ración (c.rac) baja el consumo de grano
      { let u0 = 0; for (const k in c.units) u0 += c.units[k] * D.UNITS[k].up; up += u0; pc[id].legiones = u0; }
    }
    for (const m of s.marches) if (m.owner === 'roma') for (const k in m.units) up += m.units[k] * D.UNITS[k].up;
    p.grano -= up; p.pc = pc; p.upkeep = up; p.comida = comPop + up; p.det = det;
    p.rutas = 0; if (!merc()) for (const r of G.rutasAbiertas()) if (!r.parada) p.rutas += G.rutaRenta(r);   // CDe3-F2a: con el mercado nuevo las rutas pagan en el cierre de mes (MERCADO.mes), no aquí
    p.denarios += p.rutas; det.rutas = p.rutas;
    p.mant = G.mantenimiento(); p.denarios -= p.mant.total;
    p.sabios = G.pagaSabios(gOk);   // solo dato: se cobra al cerrar el mes (G.cierreMes), no entra en p.denarios
    return p;
  };

  // CDe4: lo que entra y sale cada tick, a «Este año»: impuestos y comercio, cosecha, comida, paga y mantenimiento
  function apuntaTick(p, dm) {
    if (!(dm > 0) || !p || !p.pc || !EA()) return;
    for (const id in p.pc) {
      const x = p.pc[id];
      apunta(id, 'denarios', x.impuestos * dm, 'impuestos'); apunta(id, 'denarios', x.comercio * dm, 'comercio');
      for (const r in x.cosecha) apunta(id, r, x.cosecha[r] * dm, 'cosecha');
      apunta(id, 'grano', -x.comida * dm, 'comida'); apunta(id, 'grano', -x.legiones * dm, 'legiones');
    }
    apunta(null, 'denarios', (p.rutas || 0) * dm, 'comercio');
    if (p.mant) { apunta(null, 'denarios', -p.mant.edificios * dm, 'edificios'); apunta(null, 'denarios', -p.mant.tropas * dm, 'legiones'); }
  }

  /* ---------- bien especial por ciudad (B1) ---------- */
  G.fuentesExtra = [];   // ganchos de otras tareas (rutas comerciales con aliados): cada uno recibe el bien y devuelve ids de ciudad
  G.fuentesEspecial = function (k) { const l = G.myCities().filter(id => D.CITIES[id].esp === k); for (const f of G.fuentesExtra) for (const id of f(k) || []) if (l.indexOf(id) < 0) l.push(id); return l; };
  let espMem = null, espClave = null, espEstado = null;   // CDe4: memoria por instante y ciudades propias (bonoMul y G.prod la piden miles de veces por mes)
  G.especiales = function () {
    const s = G.state, clave = s ? s.t + '|' + Object.keys(s.cities).map(id => s.cities[id].owner).join(',') + '|' + G.fuentesExtra.length + '|' + JSON.stringify(G.rutasAbiertas()) : null;
    if (espMem && s === espEstado && clave === espClave) return Object.assign({}, espMem);
    const o = {}; for (const k in D.ESPECIAL) if (G.fuentesEspecial(k).length) o[k] = true; espMem = o; espClave = clave; espEstado = s; return Object.assign({}, o); };
  G.dondeEspecial = k => G.ciudadesRegion().filter(id => D.CITIES[id].esp === k);   // todas las ciudades del mapa que lo dan
  /* PN2: polis elegida en Partida nueva (s.polis = id, o null). Su ficha está en D.POLIS; los números son licencia de juego. */
  G.polis = () => { const s = G.state, p = s && s.polis; return p && D.POLIS[p] ? p : null; };
  G.polisFicha = () => { const p = G.polis(); return p ? D.POLIS[p] : null; };
  G.polisBono = () => { const f = G.polisFicha(); return f ? f.rasgo.bono : null; };
  /* ¿Esta tropa se recluta en esta partida? En partida de polis, solo hoplitas y la tropa propia; en las demás, solo las que no son griegas. */
  G.reclutable = k => { const u = D.UNITS[k], f = G.polisFicha(); if (!u || !u.cost) return false; if (!f) return !u.griega; return !!u.griega && (k === 'hoplitas' || k === f.tropa.id); };
  G.bonoMul = function (campo, tipoMul) { const fm = (campo === 'obra' || campo === 'instr') ? G.factor(campo) : 1; return fm === 1 ? bonoMul0(campo, tipoMul) : bonoMul0(campo, tipoMul) * fm; };   // I8: el modo acorta obras e instrucción
  const bonoMul0 = function (campo, tipoMul) { let m = 1; const e = G.especiales(); for (const k in e) { const v = D.ESPECIAL[k].bono[campo]; if (v) m *= v; }
    const pb = G.polisBono(); if (pb && pb[campo]) m *= pb[campo];   // PN2: el rasgo de la polis elegida (solo en partida de polis)
    const im = G.invMul(campo); if (im === 1) return m;   // sin ciencia: idéntico a siempre
    const tm = tipoMul || 1, sin = m * tm; return G.techoFinal(campo, sin, sin * im) / tm;   // 3.ª fuente: ciencia, con el techo del resultado final (bienes + tipo + ciencia)
  };
  G.bonoSum = function (campo) { let m = 0; const e = G.especiales(); for (const k in e) m += D.ESPECIAL[k].bono[campo] || 0; const pb = G.polisBono(); if (pb) m += pb[campo] || 0; return m + G.invSum(campo); };
  // tipo 'edificio' (nivel = el actual, se quiere subir al siguiente) o 'tropa': devuelve el bien que falta o null
  G.faltaEspecial = function (tipo, id, nivel) {
    const e = G.especiales();
    const sb = tipo === 'edificio' && G.invSinBien(id);   // Astilleros: sustituye al bien especial del puerto
    for (const k in D.ESPECIAL) { const a = D.ESPECIAL[k].abre; if (e[k]) continue; if (sb && a.edificios && a.edificios.indexOf(id) >= 0) continue;
      if (tipo === 'edificio' && a.edificios && a.edificios.indexOf(id) >= 0 && nivel >= D.ESP_NIVEL) return k;
      if (tipo === 'tropa' && a.tropas && a.tropas.indexOf(id) >= 0) return k; }
    return null;
  };
  /* ---------- rutas comerciales (B2) ---------- */
  G.rutasAbiertas = () => (G.state && G.state.rutas) || [];
  G.rutaDe = (a, b) => G.rutasAbiertas().find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a));
  G.rutaMax = c => 1 + Math.floor((c.b.mercado || 0) / D.RUTA_POR_MERCADO) + (G.tipoDe(c).rutas || 0) + G.invSum('rutas');
  G.rutasDeCiudad = id => G.rutasAbiertas().filter(r => r.a === id).length;
  // marcha en curso entre Roma y la facción f (en cualquier sentido)
  G.hayGuerraCon = function (f) { const s = G.state; return s.marches.some(m => !m.colonos && ((m.owner === f && s.cities[m.to].owner === 'roma') || (m.owner === 'roma' && s.cities[m.to].owner === f))); };
  G.rutaPuede = function (a, b) {
    if (merc()) return 'Las rutas comerciales van ahora por el mercado';
    const s = G.state, ca = s.cities[a], cb = s.cities[b], e = G.edge(a, b);
    if (!ca || !cb || ca.owner !== 'roma' || !e || a === b) return 'No hay camino';
    if (G.rutaDe(a, b)) return G.rutaDe(a, b).parada && G.hayGuerraCon(cb.owner) ? 'En guerra con ' + D.FACTIONS[cb.owner].n + ': la ruta está parada' : 'Ya existe';   // CE12
    if (!(ca.b.mercado > 0)) return 'Hace falta un mercado';
    if (e[2] && !(ca.b.puerto > 0)) return 'Hace falta un puerto';
    if (G.rutasDeCiudad(a) >= G.rutaMax(ca)) return 'Sin hueco: mejora el mercado';
    if (cb.owner !== 'roma' && G.hayGuerraCon(cb.owner)) return 'En guerra con ' + D.FACTIONS[cb.owner].n;
    if (cb.owner !== 'roma' && G.favorBajo()) return 'El Senado no autoriza tratados con ciudades ajenas (favor bajo)';
    if (G.disponible('denarios') < D.RUTA_COSTE) return 'Faltan ' + D.RUTA_COSTE + ' denarios';
    return null;
  };
  G.rutaAbrir = function (a, b) {
    if (G.rutaPuede(a, b)) return false;
    const s = G.state; gasta('denarios', D.RUTA_COSTE); s.rutas.push({ a: a, b: b, f: s.cities[b].owner });
    if (D.SENADO.sala) G.senadoActo('ruta', b);   // CE6
    G.log('⚖️ ' + (s.cities[b].owner === 'roma' ? 'Ruta comercial' : 'Tratado de comercio') + ': ' + D.CITIES[a].n + ' ↔ ' + D.CITIES[b].n + '.', 'good'); return true;
  };
  G.rutaCerrar = function (a, b, motivo) {
    const s = G.state, i = s.rutas.findIndex(r => (r.a === a && r.b === b) || (r.a === b && r.b === a)); if (i < 0) return false;
    const r = s.rutas.splice(i, 1)[0]; G.log('⚖️ Ruta cerrada: ' + D.CITIES[r.a].n + ' ↔ ' + D.CITIES[r.b].n + (motivo ? ' (' + motivo + ')' : '') + '.', motivo ? 'bad' : ''); return true;
  };
  G.rutaMar = r => { const e = G.edge(r.a, r.b); return !!(e && e[2]); };
  G.rutaRenta = function (r) {
    const s = G.state, ca = s.cities[r.a], cb = s.cities[r.b], mia = cb.owner === 'roma';
    let v = D.RUTA_BASE + (ca.b.mercado || 0) + (mia ? (cb.b.mercado || 0) : D.RUTA_W * (cb.w || D.CITIES[r.b].w || 0));
    if (G.rutaMar(r)) v *= D.RUTA_MAR;
    const tm = Math.max(G.tipoDe(ca).oroCom || 1, mia ? (G.tipoDe(cb).oroCom || 1) : 1), im = G.invMul('rutaRenta');
    return v * (im === 1 ? tm : G.techoFinal('rutaRenta', tm, tm * im));
  };
  // cierra solas las rutas que ya no valen: se llama en cada tick y al lanzar marchas
  G.rutasRevisar = function () {
    const s = G.state; if (!s || !s.rutas) return;
    for (const r of s.rutas.slice()) {
      const ca = s.cities[r.a], cb = s.cities[r.b];
      if (ca.owner !== 'roma') { G.rutaCerrar(r.a, r.b, D.CITIES[r.a].n + ' ya no es tuya'); continue; }
      if (cb.owner !== r.f) { if (cb.owner === 'roma') { r.f = 'roma'; G.log('⚖️ ' + D.CITIES[r.b].n + ' ya es tuya: la ruta pasa a ser interior.'); } else { G.rutaCerrar(r.a, r.b, D.CITIES[r.b].n + ' cambió de dueño'); } continue; }
      if (r.f !== 'roma' && G.hayGuerraCon(r.f)) { if (!r.parada) { r.parada = true; G.log('⚖️ Ruta parada por la guerra con ' + D.FACTIONS[r.f].n + ': ' + D.CITIES[r.a].n + ' ↔ ' + D.CITIES[r.b].n + '.', 'bad'); } }   // CE12: se para, no se cierra; no paga hasta la paz
      else if (r.parada) r.parada = false;
    }
  };
  // el bien especial de una ciudad ajena con tratado llega a Roma
  G.fuentesExtra.push(function (k) { const l = []; for (const r of G.rutasAbiertas()) if (!r.parada && r.f !== 'roma' && D.CITIES[r.b].esp === k && G.state.cities[r.b].owner === r.f) l.push(r.b); return l; });
  /* ---------- felicidad e impuestos ---------- */
  G.impMult = c => (D.IMPUESTOS[c.imp] || D.IMPUESTOS.normal).mult;
  G.felicidadBase = function (c) {
    let f = D.FELICIDAD_BASE + (D.IMPUESTOS[c.imp] || D.IMPUESTOS.normal).f;
    for (const b in D.FELICIDAD_EDIF) f += D.FELICIDAD_EDIF[b] * ((c.b && c.b[b]) || 0);
    f += (G.tipoDe(c).fel || 0) + G.bonoSum('fel') + G.racionDe(c).f + G.fiestaFel(c) + G.triunfoFel(c);
    return Math.max(0, Math.min(100, Math.round(f)));
  };
  // felicidad con la inquietud de los esclavos (Q6): con ánimo de esclavos muy bajo, -8
  G.felicidad = function (c) {
    const f = G.felicidadBase(c) + (c.owner === 'roma' && merc() && G.state && G.state.mercado && Array.isArray(G.state.mercado.contratos) ? merc().efectos(G.state).felicidad.pue : 0);   // CDe3-F2a: la annona da felicidad a la plebe
    if (c.owner === 'roma' && (c.esc || 0) > 0 && G.animoClases(c).esc < G.K().inquietud) return Math.max(0, f - G.K().inquietudFel);
    return f;
  };
  G.setImp = function (cid, nivel) { const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.IMPUESTOS[nivel]) return false; c.imp = nivel; return true; };

  /* ---------- CN13a: arca del foro, ofrenda y juegos, ración y granero ----------
     Las fiestas se guardan por ciudad en c.fiesta = {ofrenda, juegos}: el mes (s.t) en que se celebró la última (-99 = nunca). Sin multas ni gasto automático. */
  const tiempo = () => (G.state ? G.state.t : 0);
  G.fiestaDe = c => { if (!c.fiesta || typeof c.fiesta !== 'object') c.fiesta = { ofrenda: -99, juegos: -99 }; for (const k in D.FIESTAS) if (typeof c.fiesta[k] !== 'number') c.fiesta[k] = -99; return c.fiesta; };
  const fiestaVista = c => c.fiesta && typeof c.fiesta === 'object' ? c.fiesta : null;   // solo lectura: no crea nada (felicidadBase corre muchas veces)
  G.fiestaActiva = (c, id) => { const f = fiestaVista(c), d = D.FIESTAS[id]; return !!(f && d && typeof f[id] === 'number' && tiempo() < f[id] + d.dura - 1e-9); };
  G.fiestaFel = c => { let f = 0; for (const id in D.FIESTAS) if (G.fiestaActiva(c, id)) f += D.FIESTAS[id].fel; return f; };
  G.diosMulFiesta = c => { let m = 1; for (const id in D.FIESTAS) if (G.fiestaActiva(c, id)) m = Math.max(m, D.FIESTAS[id].dios); return m; };
  G.racionDe = c => D.RACION[c.rac] || D.RACION.normal;
  G.setRacion = function (cid, k) { const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.RACION[k]) return false; c.rac = k; return true; };   // molde: G.setImp
  // Lo que el tope del almacén va a perder este mes, en recursos y en oro. nivel 0-4 por fracción del tope. pide = frase para el consejo (null si no pide nada)
  G.arca = function (cid) {
    const s = G.state, c = s.cities[cid], cap = Math.max(1, G.cap()), pr = G.previsionCierre(), sobra = {}; let oro = 0;
    for (const r of ['materiales', 'hierro', 'grano']) { const n = pr[r].perdera; if (n >= 1) { sobra[r] = n; oro += n * D.ARCA.valor[r]; } }
    oro = Math.round(oro); const pct = oro / cap; let nivel = 0; D.ARCA.umbrales.forEach((u, i) => { if (pct >= u) nivel = i + 1; });
    let pide = null;
    if (c && c.owner === 'roma' && nivel >= D.ARCA.pide) { const fi = G.fiestaInfo(cid, 'ofrenda'); if (!fi.motivo) pide = 'El arca de ' + D.CITIES[cid].n + ' rebosa: haz una ofrenda en el templo antes de que se pierda.'; }
    const out = { nivel: nivel, denarios: oro, cap: cap, pct: Math.round(pct * 100), sobra: sobra, pide: pide };
    if (c && c.owner === 'roma') { const r = regE.get(c); if (r) pantalla(c, r, nivel); }
    return out;
  };
  // cuánto pagaría la ciudad por la fiesta: ingreso bruto mensual (foro + impuestos) por el múltiplo, con mínimo fijo
  G.fiestaCoste = function (id) { const d = D.FIESTAS[id], p = G.prod(), ing = (p.det.foro || 0) + (p.det.impuestos || 0); return Math.max(d.min, Math.round(d.mult * ing)); };
  // plan de pago: la ofrenda usa primero lo que iba a perderse (el arca) y luego grano; los juegos, oro. null si no alcanza
  G.fiestaPago = function (id, coste) {
    const s = G.state, d = D.FIESTAS[id];
    if (d.pago === 'denarios') return G.disponible('denarios') >= coste ? { denarios: coste } : null;
    const pr = G.previsionCierre(), pago = {}; let falta = coste;
    for (const r of ['materiales', 'hierro', 'grano']) {
      if (falta <= 0) break; const v = D.ARCA.valor[r], n = Math.min(Math.floor(pr[r].perdera), Math.floor(G.disponible(r)), Math.ceil(falta / v));   // ES20: de la reserva entera if (n < 1) continue;
      pago[r] = n; falta -= n * v; }
    if (falta > 0) { const v = D.ARCA.valor.grano, mas = Math.ceil(falta / v), hay = Math.floor(G.disponible('grano') - (pago.grano || 0)); if (hay < mas) return null; pago.grano = (pago.grano || 0) + mas; }
    return pago;
  };
  // estado de una fiesta en una ciudad: coste, motivo (null = se puede), activa, meses que quedan de efecto y de reposo
  G.fiestaInfo = function (cid, id) {
    const s = G.state, c = s.cities[cid], d = D.FIESTAS[id], o = { coste: 0, motivo: null, activa: false, quedan: 0, reposo: 0, pago: null };
    if (!d) { o.motivo = 'Fiesta desconocida.'; return o; }
    o.coste = G.fiestaCoste(id);
    if (!c || c.owner !== 'roma') { o.motivo = 'Solo en tus ciudades.'; return o; }
    const f = fiestaVista(c), h = f && typeof f[id] === 'number' ? f[id] : -99;
    o.activa = G.fiestaActiva(c, id); o.quedan = o.activa ? Math.max(1, Math.ceil(h + d.dura - s.t - 1e-9)) : 0; o.reposo = Math.max(0, Math.ceil(h + d.reposo - s.t - 1e-9));
    if (d.templo && !G.diosDe(c)) o.motivo = 'Hace falta un templo con su dios.';
    else if (o.reposo > 0) o.motivo = 'En reposo: ' + G.estTxt(G.estaciones(o.reposo)) + '.';
    else { o.pago = G.fiestaPago(id, o.coste); if (!o.pago) o.motivo = d.pago === 'denarios' ? 'Faltan denarios.' : 'Falta lo que sobra en el arca o grano.'; }
    return o;
  };
  // celebra la fiesta (genérica: Q8 y CN20 la reutilizan). Devuelve true si se hizo.
  G.hacerFiesta = function (cid, id) {
    const s = G.state, c = s.cities[cid], d = D.FIESTAS[id], fi = G.fiestaInfo(cid, id); if (!c || !d || fi.motivo || !fi.pago) return false;
    for (const r in fi.pago) gasta(r, fi.pago[r]);
    G.fiestaDe(c)[id] = s.t;
    if (d.pueblo) G.favorAplica(0, d.pueblo);
    if (id === 'juegos' && D.SENADO.sala) G.senadoActo('juegos', cid);   // CE6 (también cuenta para los ministros)
    else if (libs() && (id === 'juegos' || id === 'ofrenda')) MIN.acto(s, id);   // CDe1-A: sin sala del Senado, el acto cuenta igual para el Pontífice
    if (d.inq && c.inq > 0) c.inq = Math.max(0, c.inq - d.inq);
    G.log(d.i + ' ' + d.n + ' en ' + D.CITIES[cid].n + '.', 'good', true);
    const r = regE.get(c); if (r) pantalla(c, r);
    return true;
  };
  /* CN16a: leva del Foro. G.levaInfo da coste, cuántos se pueden y el motivo si no; G.leva(cid, n) los alista al momento. Nada automático. */
  G.levaInfo = function (cid, n) {
    const s = G.state, c = s.cities[cid], d = D.LEVA, q = Math.max(1, Math.floor(n || d.n)), o = { n: q, coste: { grano: d.grano * q, denarios: d.denarios * q }, motivo: null, tope: 0, libres: 0 };
    if (!c || c.owner !== 'roma') { o.motivo = 'Solo en tus ciudades.'; return o; }
    o.libres = G.recruits(c); const bajoArmas = c.units[d.unidad] || 0; o.tope = Math.max(0, Math.floor(d.tope * (c.pop + bajoArmas)) - bajoArmas);
    const hoy = Math.min(o.libres, o.tope);
    if (c.inq > 0) o.motivo = 'La ciudad está inquieta.';
    else if (o.libres < q) o.motivo = 'No quedan aldeanos libres.';
    else if (hoy < q) o.motivo = 'Ya hay tanta milicia como el campo aguanta.';
    else if (G.disponible('grano') < o.coste.grano) o.motivo = 'Falta grano.';
    else if (G.disponible('denarios') < o.coste.denarios) o.motivo = 'Faltan denarios.';
    return o;
  };
  G.leva = function (cid, n) {
    const o = G.levaInfo(cid, n); if (o.motivo) return false; const c = G.state.cities[cid];
    gasta('grano', o.coste.grano); gasta('denarios', o.coste.denarios); c.pop -= o.n; c.units[D.LEVA.unidad] = (c.units[D.LEVA.unidad] || 0) + o.n;
    G.log('⚔️ Leva en ' + D.CITIES[cid].n + ': ' + o.n + ' aldeanos toman las armas.', 'good', true);
    const r = regE.get(c); if (r) pantalla(c, r);
    return true;
  };
  /* CN16b: cerrar el ejército en la ciudad. Puertas (c.puertas), veteranos (c.vetB) y triunfo (s.triunfo, s.triunfoFin). Nada automático: solo cuando el jugador pulsa.
     No toca E ni E.rnd: son campos de c y de s. */
  G.puertasInfo = function (cid) {
    const c = G.state.cities[cid], o = { cerradas: !!(c && c.puertas), motivo: null };
    if (!c || c.owner !== 'roma') o.motivo = 'Solo en tus ciudades.';
    else if (!o.cerradas && !(G.faseMuralla(c) > 0)) o.motivo = 'Hace falta muralla para cerrar las puertas.';
    return o;
  };
  G.puertas = function (cid, cerrar) {
    const o = G.puertasInfo(cid); if (o.motivo || !!cerrar === o.cerradas) return false; const c = G.state.cities[cid];
    c.puertas = !!cerrar; G.log((cerrar ? '🚪 ' + D.CITIES[cid].n + ' cierra sus puertas.' : '🚪 ' + D.CITIES[cid].n + ' abre sus puertas.'), cerrar ? '' : 'good', true);
    return true;
  };
  // marchas propias: más lentas si salen o entran en una ciudad propia con las puertas cerradas
  G.puertasViaje = function (a, b) { const s = G.state, ca = s.cities[a], cb = s.cities[b]; return (ca && ca.owner === 'roma' && ca.puertas) || (cb && cb.owner === 'roma' && cb.puertas) ? D.PUERTAS.viaje : 1; };
  G.vetCuenta = function (cid) { const c = G.state.cities[cid]; if (c && c.owner === 'roma') c.vetB = (c.vetB || 0) + 1; };
  const soldados = c => { let n = 0; for (const k in c.units) if (k !== 'milicia' && k !== 'vigiles' && D.UNITS[k] && D.UNITS[k].cls !== 'ele') n += c.units[k] || 0; return n; };
  G.veteranosInfo = function (cid) {
    const c = G.state.cities[cid], V = D.VETERANOS, o = { batallas: (c && c.vetB) || 0, faltan: 0, n: 0, grano: 0, motivo: null };
    if (!c || c.owner !== 'roma') { o.motivo = 'Solo en tus ciudades.'; return o; }
    o.faltan = Math.max(0, V.batallas - o.batallas); o.n = Math.min(V.n, soldados(c)); o.grano = o.n * V.grano;
    if (o.faltan > 0) o.motivo = 'Faltan ' + o.faltan + (o.faltan === 1 ? ' batalla' : ' batallas') + ' para tener veteranos.';
    else if (o.n < 1) o.motivo = 'No quedan soldados en la ciudad.';
    return o;
  };
  // licencia hasta n soldados (los de la tropa más numerosa primero), los asienta como población y gasta las batallas del contador
  G.licenciar = function (cid) {
    const o = G.veteranosInfo(cid); if (o.motivo) return false; const s = G.state, c = s.cities[cid]; let q = o.n;
    while (q > 0) { let k = null; for (const u in c.units) if (u !== 'milicia' && u !== 'vigiles' && D.UNITS[u] && D.UNITS[u].cls !== 'ele' && c.units[u] > 0 && (!k || c.units[u] > c.units[k])) k = u; if (!k) break; const t = Math.min(q, c.units[k]); c.units[k] -= t; if (c.units[k] <= 0) delete c.units[k]; q -= t; }
    const n = o.n - q; c.pop = (c.pop || 0) + n; s.res.grano += n * D.VETERANOS.grano; c.vetB -= D.VETERANOS.batallas; G.favorAplica(0, D.VETERANOS.pueblo);
    G.log('🎖️ ' + n + ' veteranos se licencian en ' + D.CITIES[cid].n + ' y se asientan con sus familias.', 'good', true);
    const r = regE.get(c); if (r) pantalla(c, r);
    return true;
  };
  // una gran victoria (o una conquista) ofrece un triunfo; la oferta caduca a los D.TRIUNFO.plazo meses y la sustituye la victoria siguiente
  G.triunfoOfrece = function (nombre, out) { const s = G.state; s.triunfo = { t: s.t, n: nombre }; if (out) out.lines.push('🎺 Puedes celebrar un triunfo en el Foro de tu capital (' + D.TRIUNFO.denarios + ' denarios).'); };
  G.triunfoFel = c => { const s = G.state; return s && c && c.owner === 'roma' && s.t < (s.triunfoFin || 0) - 1e-9 ? D.TRIUNFO.fel : 0; };
  G.triunfoInfo = function () {
    const s = G.state, T = D.TRIUNFO, o = { oferta: null, denarios: T.denarios, activo: s.t < (s.triunfoFin || 0) - 1e-9, quedan: Math.max(0, Math.ceil((s.triunfoFin || 0) - s.t - 1e-9)), motivo: null };
    if (s.triunfo && s.t - s.triunfo.t < T.plazo) o.oferta = s.triunfo.n;
    if (!o.oferta) o.motivo = 'Gana una gran batalla para pedir un triunfo.';
    else if (G.disponible('denarios') < T.denarios) o.motivo = 'Faltan denarios.';
    return o;
  };
  G.triunfo = function () {
    const o = G.triunfoInfo(); if (o.motivo) return false; const s = G.state;
    gasta('denarios', D.TRIUNFO.denarios); s.triunfo = null; s.triunfoFin = s.t + D.TRIUNFO.dura; G.favorAplica(0, D.TRIUNFO.pueblo);
    G.log('🎺 Triunfo por ' + o.oferta + ': el pueblo aclama a sus legiones.', 'good', true);
    return true;
  };
  /* CN13b: techar un barrio con tejas (acción, no pieza). Coste en recursos, plazo en meses, motivo si no se puede. Devuelve {coste, motivo, plazo, casas, hecho, enObra}. */
  G.techoInfo = function (cid, i) {
    const c = G.state && G.state.cities[cid], E = c && c.owner === 'roma' ? G.ciudadE(cid) : null;
    if (!E) return { coste: null, motivo: 'Solo en tus ciudades.', plazo: CI ? CI.TECHO_MESES : 3, casas: 0, hecho: false, enObra: 0 };
    const o = CI.techoInfo(E, i); if (o.coste) { o.coste = escalaCoste(o.coste); if (!o.motivo && !G.canAfford(limpia(o.coste))) o.motivo = 'Faltan recursos.'; } return o;
  };
  G.techarBarrio = function (cid, i) {
    const o = G.techoInfo(cid, i); if (o.motivo) return false; const c = G.state.cities[cid], E = G.ciudadE(cid);
    const r = CI.techarBarrio(E, i, true); if (!r.ok) return false;
    const co = limpia(o.coste); for (const k in co) gasta(k, co[k]);
    const rr = regE.get(c); if (rr) { ponerDatos(c, rr); rr.rev = -1; }
    G.log('Techado de ' + E.barrios[i].nombre + ' en ' + D.CITIES[cid].n + ': acabará en ' + G.estTxt(G.estaciones(o.plazo)) + '.', 'good', true); return true;
  };
  // el granero de la ciudad: pct = grano guardado sobre el tope, meses = cuánto dura (null si no baja), invierno = hambre de invierno en la ciudad (E.hambre), hambre = grano agotado
  G.graneroInfo = function (cid) {
    const s = G.state, c = s.cities[cid], p = G.prod(), tot = Math.max(0, s.res.grano) + Math.max(0, s.alm.grano), E = c ? G.ciudadE(cid) : null;
    return { pct: Math.min(100, Math.round(100 * tot / Math.max(1, G.cap()))), meses: p.grano < 0 ? Math.round(tot / -p.grano * 10) / 10 : null, invierno: !!(E && E.hambre), hambre: tot <= 0 && p.grano < 0, neto: p.grano };
  };
  // campos de pantalla de la ciudad (no se guardan): E.arca 0-4, E.fiesta id|null, E.mendigos 0-8. CN15 los pinta.
  let enPantalla = false;   // G.prod puede pedir otra ciudad y volver a sincronizar: no se entra dos veces
  function pantalla(c, r, nivel) {
    if (enPantalla) return; enPantalla = true; try { pantalla0(c, r, nivel); } catch (e) { /* el dibujo no debe romper la lógica */ } finally { enPantalla = false; }
  }
  function pantalla0(c, r, nivel) {
    const E = r.E, s = G.state; if (!E || !s || !s.res || !s.alm) return; const id = idDe(c); if (!id || s.cities[id] !== c || c.owner !== 'roma') return;
    if (nivel === undefined) { let oro = 0; const pr = G.previsionCierre(); for (const q of ['materiales', 'hierro', 'grano']) oro += pr[q].perdera * D.ARCA.valor[q]; const f = oro / Math.max(1, G.cap()); nivel = 0; D.ARCA.umbrales.forEach((u, i) => { if (f >= u) nivel = i + 1; }); }
    E.arca = nivel; E.fiesta = G.fiestaActiva(c, 'juegos') ? 'juegos' : G.fiestaActiva(c, 'ofrenda') ? 'ofrenda' : null;
    const g = G.graneroInfo(id); let m = 0; if (g.hambre) m = 8; else if (g.meses !== null && g.meses < 2) m = 5; else if (g.meses !== null && g.meses < 4) m = 2; if (E.hambre) m = Math.max(m, 3); E.mendigos = Math.min(8, m);
  }

  /* ---------- población ---------- */
  G.popCapViejo = c => { let n = 120; for (const b in D.POP_EDIF) n += D.POP_EDIF[b] * (c.b[b] || 0); return Math.round(n * D.BARRIO[c.barrio || 1].pop) + puebloPopDe(c); };
  /* Con ciudad nueva: capacidad de sus casas (ciudad.poblacion) x multiplicador de barrio + mercado y templo (D.POP_EDIF). Ya no cuentan viviendas ni foro. */
  G.popCap = c => { const r = infoC(c); if (!r) return Math.round(G.popCapViejo(c) * G.invMul('popCap')); let n = r.cap; for (const b in D.POP_EDIF) if (b !== 'viviendas' && b !== 'foro') n += D.POP_EDIF[b] * (c.b[b] || 0); return Math.round(n * D.BARRIO[c.barrio || 1].pop * G.invMul('popCap')) + puebloPopDe(c); };
  G.rateCampo = (c, b) => { const r = infoC(c); return r ? r.campo[b] : G.rate(c.b[b]); };
  // Barrio (P67, CN6): sin ciudad nueva sale de los servicios de la ciudad (camino Q5, con c.bdef). Con ciudad nueva sale de sus barrios:
  // cada uno tiene nivel efectivo (sube un nivel por mes y baja tras BARRIO_RETRASO meses de déficit) y la ciudad es la media por casas.
  const ELBAR = c => { if (!CI || cargando || !c || c.owner !== 'roma') return null; const r = infoC(c); return r && r.E.barrios && r.E.barrios.length ? r.E : null; };
  // nivelBarrio de todos los barrios, guardado mientras E no cambie (E.rev): servicios() se llama mucho
  const memoNB = new WeakMap();
  const nbs = E => { let m = memoNB.get(E); if (!m || m.rev !== E.rev || m.mes !== E.mesN) { m = { rev: E.rev, mes: E.mesN, l: E.barrios.map((b, i) => CI.nivelBarrio(E, i)) }; memoNB.set(E, m); } return m.l; };
  // topes que ponen los servicios de la ciudad entera: sin grano no pasa de 1; para Urbs hace falta además lujo
  const topeServ = serv => !serv.grano ? 1 : !serv.lujo ? 3 : 4;
  // media de los niveles por casas, redondeada (0,5 sube); campo = 'nivel' (efectivo) u 'obj' (objetivo por servicios)
  const mediaBarrios = (lista, campo) => { let t = 0, w = 0; for (const b of lista) { const k = Math.max(1, b.casas); t += b[campo] * k; w += k; } return w ? Math.max(1, Math.min(D.BARRIO.length - 1, Math.round(t / w + 1e-9))) : 1; };
  G.barrioInfo = function (c) {
    const serv = G.servicios(c, G.prod().grano >= 0), E = ELBAR(c);
    if (!E) {
      let obj = 1; for (let n = 2; n < D.BARRIO.length; n++) { if (D.BARRIO[n].pide.every(k => serv[k])) obj = n; else break; }
      const nivel = c.barrio || 1, sig = D.BARRIO[nivel + 1];
      return { nivel, objetivo: obj, serv, falta: sig ? sig.pide.filter(k => !serv[k]) : [], meses: obj < nivel ? Math.max(0, D.BARRIO_RETRASO - (c.bdef || 0)) : 0, barrios: [] };
    }
    const nb = nbs(E), barrios = E.barrios.map((b, i) => { const n = nb[i], niv = b.nivel || 1, meses = CI.mesesParaBajar(E, i);
      return { i, nombre: b.nombre, corto: b.corto, caracter: CI.caracterBarrio(E, i), nivel: niv, objetivo: n.nivel, casas: n.casas, falta: niv >= n.nivel ? n.falta : '', meses, texto: CI.textoBarrio(E, i) }; });
    const tope = topeServ(serv), nivel = c.barrio || 1, sig = D.BARRIO[nivel + 1], bajan = barrios.filter(b => b.meses > 0).map(b => b.meses);
    return { nivel, objetivo: Math.min(tope, mediaBarrios(barrios, 'objetivo')), serv, falta: sig ? sig.pide.filter(k => !serv[k]) : [], meses: bajan.length ? Math.min.apply(null, bajan) : 0, barrios };
  };
  // nivel de ciudad que sale de los barrios: media de los efectivos por casas, recortada por grano y lujo
  G.nivelDeBarrios = function (c) { const bi = G.barrioInfo(c); return bi.barrios.length ? Math.min(topeServ(bi.serv), mediaBarrios(bi.barrios, 'nivel')) : null; };
  /* ---------- clases (Q6) ---------- */
  // ajusta ciu/esc al total (nunca negativos; los reclutas salen primero de plebeyos, luego de ciudadanos y de esclavos) y devuelve las tres cifras
  G.clases = function (c) {
    const pop = Math.max(0, c.pop || 0); let esc = Math.max(0, c.esc || 0), ciu = Math.max(0, c.ciu || 0);
    if (ciu + esc > pop) { ciu = Math.max(0, Math.min(ciu, pop - esc)); esc = Math.min(esc, pop - ciu); }
    c.ciu = ciu; c.esc = esc;
    return { ciu: ciu, esc: esc, ple: Math.max(0, pop - ciu - esc), pop: pop };
  };
  G.servicios = function (c, granoOk) {
    const e = G.especiales();
    // con ciudad nueva, agua, templo y mercado cuentan si cubren al menos la mitad de las casas (o si hay el edificio heredado). Sin el módulo de ciudad nueva (ciudad.js) el agua se da por cubierta: CN10 retiró el acueducto, que era su única fuente
    const E = ELBAR(c); let cv = null;
    if (E) { let ag = 0, te = 0, me = 0, n = 0; nbs(E).forEach(q => { ag += q.ag; te += q.te; me += q.me; n += q.casas; }); if (n > 0) cv = { ag: ag / n >= 0.5, te: te / n >= 0.5, me: me / n >= 0.5 }; }
    return { grano: granoOk, templo: (c.b.templo || 0) >= 1 || !!(cv && cv.te), agua: !CI || !!(cv && cv.ag), mercado: (c.b.mercado || 0) >= 1 || !!(cv && cv.me), lujo: !G.state.lujoFalta && (D.LUJO.some(k => (G.bienes()[k] || 0) >= 1) || !!G.state.lujoServido) };   // CE2: el lujo se guarda; sin bienes de lujo, los ricos no lo tienen
  };
  // ánimo 0-100 por clase. granoOk: si se omite, sale de la producción de grano (G.prod lo pasa para no dar vueltas)
  G.animoClases = function (c, granoOk) {
    const K = G.K(), cl = G.clases(c), sv = G.servicios(c, granoOk === undefined ? G.prod().grano >= 0 : granoOk), f = G.felicidadBase(c), lim = x => Math.max(0, Math.min(100, Math.round(x)));
    const pesc = cl.pop > 0 ? Math.min(K.escAnimoTope, K.escAnimo * 100 * cl.esc / cl.pop) : 0;
    return {
      ciu: lim(40 + (sv.lujo ? 20 : 0) + (sv.mercado ? 15 : 0) + (sv.agua ? 15 : 0) + (f - 50) * 0.3),
      ple: lim(40 + (sv.grano ? 20 : 0) + (sv.templo ? 15 : 0) + (f - 50) * 0.3 - pesc),
      esc: lim((sv.grano ? 65 : 45) - 0.3 * (100 - f))
    };
  };
  G.cara = a => a >= G.K().caraBuena ? '😊' : a >= G.K().caraMedia ? '😐' : '😠';
  // población que trabaja (esclavos x1,3; una clase con ánimo bajo rinde la mitad)
  G.popEfectiva = function (c, granoOk) {
    const cl = G.clases(c); if (c.owner !== 'roma') return cl.pop;
    const K = G.K(), a = G.animoClases(c, granoOk);
    const sb = G.sabiosDe(c, granoOk).porClase;   // un sabio no produce
    return (cl.ciu - sb.ciu) + (cl.ple - sb.ple) * (a.ple < K.bajo ? 0.5 : 1) + (cl.esc - sb.esc) * (1 + (a.esc < K.bajo ? 0 : K.escTrabajo));
  };
  // impuestos por cabeza: ciudadano x2,5, plebeyo x1, esclavo 0 (ciudadanos con ánimo bajo pagan la mitad)
  G.cabezasImp = function (c, granoOk) {
    const cl = G.clases(c), a = G.animoClases(c, granoOk);
    const sb = G.sabiosDe(c, granoOk).porClase;   // un sabio no paga impuesto
    return (cl.ple - sb.ple) + (cl.ciu - sb.ciu) * G.K().impCiu * (a.ciu < G.K().bajo ? 0.5 : 1);
  };
  G.darCiudadania = function (cid) {
    const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || G.motivoCiudadania(c)) return false;
    gasta('denarios', G.K().ciudadaniaCoste * (D.SENADO.sala ? ciudadaniaMul(cid) : 1)); c.ciu = G.clases(c).ciu + G.K().ciudadaniaLote;
    if (D.SENADO.sala) G.senadoActo('ciudadania', cid);   // CE6
    return true;
  };
  // por qué no se puede dar la ciudadanía (null si se puede)
  G.motivoCiudadania = function (c) {
    const K = G.K(), cl = G.clases(c);
    if ((c.barrio || 1) < K.ciudadaniaBarrio) return 'Pide barrio ' + D.BARRIO[K.ciudadaniaBarrio].n;
    if (cl.ple < K.ciudadaniaLote) return 'Faltan plebeyos';
    if (cl.ciu + K.ciudadaniaLote > cl.pop * K.ciudadaniaMax + 1e-9) return 'Máximo ' + Math.round(K.ciudadaniaMax * 100) + ' % de ciudadanos';
    if (!G.canAfford({ denarios: K.ciudadaniaCoste })) return 'Faltan denarios';
    return null;
  };

  G.MIN_POP = 50;                                   // civiles que nunca se reclutan
  G.recruits = c => Math.max(0, Math.floor((c.pop || 0) - G.MIN_POP) - G.sabiosDe(c).n);   // los sabios no son reclutas

  /* ---------- mercado ---------- */
  G.marketLevel = () => { let l = 0; for (const id of G.myCities()) l = Math.max(l, G.state.cities[id].b.mercado || 0); return l; };
  G.tradeRate = () => { const l = G.marketLevel(); if (!l) return 0; let ex = 0; for (const id of G.myCities()) { const c = G.state.cities[id]; if ((c.b.mercado || 0) > 0) ex = Math.max(ex, G.tipoDe(c).mercado || 0); } return Math.min(0.9, 0.45 + 0.05 * l + ex); };
  // mul: rebaja del cambio (vender lo que sobra va barato). CE2: el hierro comprado cuesta más (D.HIERRO_COMPRA): fuera de las vetas escasea
  G.trade = function (from, to, amount, mul) {
    const s = G.state, M = merc();
    if (M && s && from !== to && (from in s.res) && (to in s.res)) {   // CDe3-F2a: por el mercado nuevo (precio por ciudad); sin denarios de por medio, se vende y se compra
      if (from !== 'denarios' && to !== 'denarios') { const d = G.trade(from, 'denarios', amount, mul); return d ? G.trade('denarios', to, d) : 0; }
      const vende = to === 'denarios', prod = vende ? from : to, cid = G.mercadoMejorCiudad(prod, vende); if (!cid) return 0;
      const ay = G.mercadoAyuda(), pr = M.precio(s, cid, prod, ay), md = mul || 1;
      if (vende) {
        let n = Math.floor(Math.min(amount, ay.tiene(prod), M.MAX_N || 200)); n = Math.min(n, Math.floor(ay.cabe('denarios') / Math.max(0.01, pr * md))); if (n < 1) return 0;   // ES20: como mucho MAX_N por operación (con la reserva entera se pedía más y fallaba todo)
        const r = M.vender(s, cid, prod, n, ay); if (!r.ok) return 0;
        r.delta.denarios = Math.floor(r.delta.denarios * md * 100) / 100; aplicaDelta(s, r.delta); return Math.floor(r.delta.denarios);
      }
      const ay2 = Object.assign({}, ay, { tiene: p => p === 'denarios' ? Math.min(amount, ay.tiene('denarios')) : ay.tiene(p) });
      let n = Math.floor(Math.min(ay2.tiene('denarios') / Math.max(0.01, pr), M.MAX_N || 200, ay.cabe(prod))); for (let k = 0; n >= 1 && k < 30; k++) { const r = M.comprar(s, cid, prod, n, ay2); if (r.ok) { aplicaDelta(s, r.delta); return n; } if (!/denarios/.test(r.motivo)) return 0; n = n > 10 ? Math.floor(n * 0.9) : n - 1; }
      return 0;
    }
    const rate = G.tradeRate() * (mul || 1) * (to === 'hierro' ? D.HIERRO_COMPRA : 1); amount = Math.floor(Math.min(amount, from in s.res ? G.disponible(from) : 0));
    if (!rate || from === to || amount <= 0 || !(from in s.res) || !(to in s.res)) return 0;
    const got = Math.min(Math.floor(amount * rate), Math.max(0, G.capDe(to) - s.res[to] - ((s.alm && s.alm[to]) || 0))); if (got <= 0) return 0;   // ES20: cabe en la reserva entera
    gasta(from, Math.ceil(got / rate), true); s.res[to] += got; return got;   // vender no cuenta como gasto del mes
  };

  G.travel = function (a, b, withHero) {
    const pa = G.pos(a), pb = G.pos(b), e = G.edge(a, b), s = G.state;
    let t = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) / 60;
    if (e && e[2]) { t *= s.mods.sea * Math.max(0.6, 1 - 0.05 * ((s.cities[a].b.puerto || 1) - 1)); if (s.cities[a].owner === 'roma') t *= (G.tipoDe(s.cities[a]).viajeMar || 1) * G.bonoMul('viajeMar') * (G.diosDe(s.cities[a]) && G.diosDe(s.cities[a]).mar ? 1 - G.diosDe(s.cities[a]).mar * G.diosNivel(s.cities[a]) : 1); }
    if (s.cities[a] && s.cities[a].owner === 'roma') t = G.viajeCiencia(e && e[2] ? 'viajeMar' : 'viajeTierra', t);   // ciencia: resta en meses, nunca bajo 3
    if (withHero) t /= 1 + 0.08 * s.hero.sk.log;
    return Math.max(0.5, t);
  };

  G.log = function (txt, kind, mudo) { const s = G.state; s.log.unshift({ t: s.t, x: txt, k: kind || '' }); if (s.log.length > 60) s.log.pop(); hojaLog(txt, kind, mudo); emit('log', { x: txt, k: kind, mudo: !!mudo }); };   // mudo: va a la Crónica pero no saca aviso en pantalla

  /* ---------- la ciudad nueva dentro del juego (CN2b) ----------
     js/ciudad.js (ESM) hace la geometría; este bloque la conecta con la economía. El módulo se enchufa con G.usarCiudad(modulo):
     ui.js lo llama en el navegador y, en Node, se intenta al final de este archivo. Sin módulo todo sigue con c.b como números.
     - La ciudad nueva E de cada ciudad PROPIA vive en una caché fuera de G.state (WeakMap por objeto de ciudad: lleva arrays tipados
       y G.save usa JSON.stringify). En el estado solo va c.ciudad = aDatos(E) + n0 (se refresca tras cada cambio) y c.heredado.
     - c.b es una VISTA derivada (G.sincronizar): c.b[b] = min(MAX_LVL, Σ D.NIVEL_PIEZA[mejora] de las piezas de ese b) + c.heredado[b].
     - CALENDARIO: E.mesN = floor(t) + 9, así fecha(E).mes (= (3 + mesN) % 12) coincide con D.MONTHS[floor(t) % 12]: enero en t = 0.
       cierreMes llama a ciudad.mes(E) una vez por mes entero y mantiene la igualdad. E.n0 = el mesN de su creación (la ciudad no
       rehace los meses anteriores a n0 al reconstruirse).
     - E.modoJuego = true: el juego manda la caja. Las piezas se colocan con E.obra = 0 (el tiempo de obra lo cuenta c.obras). */
  let CI = null, cargando = false;
  const regE = new WeakMap();            // objeto ciudad -> { E, id, rev, cap, casas, campo } | false (no se pudo)
  const memoConv = {};                   // conversiones ya hechas (id|mes|niveles|pop -> datos): repetirlas es solo reconstruir
  G.usarCiudad = m => { CI = m || null; };
  G.hayCiudad = () => !!CI;
  G.ciudadMirada = null;                 // reservado: la interfaz pone aquí la ciudad que se mira (hoy se simulan todas)
  G.huecosObra = c => D.HUECOS_OBRA[Math.min(D.MAX_LVL, Math.max(1, (c && c.b && c.b.foro) || 1))];   // obras a la vez según el nivel del foro (Q4b)
  G.huecos = c => G.huecosObra(c);
  G.huecosLibres = c => Math.max(0, G.huecosObra(c) - c.obras.length);
  G.obraDe = (c, b) => (c.obras || []).find(q => q.b === b) || null;
  G.ultimoMotivo = '';
  const sinHueco = c => G.huecosObra(c) === 1 ? 'Ya hay una obra en curso en esta ciudad' : 'Sube el foro para otra obra';
  const COMPAT = ['almacen', 'templo', 'mercado', 'cuartel', 'establo', 'herreria', 'puerto', 'granja', 'aserradero', 'cantera', 'mina'];
  const piezaDe = b => CI && b && b !== 'muralla' ? CI.PIEZA_DE[b] || null : null;
  const BONO_MIN = 0.8, BONO_MAX = 1.25;
  const bonoSitio = nota => Math.max(BONO_MIN, Math.min(BONO_MAX, 0.9 + 0.04 * (nota || 0)));   // nota 3 = 1,02; vega (+3 a +6) = 1,1 a 1,14
  const semillaDe = id => { let h = 7; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100003; return h + 1; };
  const mesAlin = () => Math.floor(G.state.t + 1e-9) + 9;
  const idDe = c => { const cs = G.state && G.state.cities; if (cs) for (const id in cs) if (cs[id] === c) return id; return null; };
  const limpia = o => { o = D.costeNuevo(o, 'obra'); const r = {}; for (const k in o) if (o[k] > 0) r[k] = o[k]; return r; };   // CE2: traduce claves viejas (ciudad.js)

  /* c.queue es un alias (no enumerable) de c.obras[0], solo por compatibilidad con la pantalla; el motor lee c.obras (huecos: G.huecosObra). */
  G.ligarObras = function (c) {
    const d = Object.getOwnPropertyDescriptor(c, 'queue'); if (d && d.get) return c;
    if (!Array.isArray(c.obras)) c.obras = [];
    if (d && d.value) c.obras.unshift(d.value);
    delete c.queue;
    Object.defineProperty(c, 'queue', { get() { return this.obras[0] || null; }, set(v) { if (v == null) this.obras.length = 0; else this.obras[0] = v; }, enumerable: false, configurable: true });
    return c;
  };

  const poblacionE = E => CI.poblacion(E);
  function info(c) {                     // E y cifras derivadas de una ciudad propia (se recalculan si E cambió)
    let r = regE.get(c); if (!r) return null; const E = r.E;
    if (r.rev !== E.rev) {
      r.rev = E.rev; r.cap = poblacionE(E); let casas = 0; for (const l of E.parcelas) if (l.casa && !l.casa.ruina && !l.fuera) casas++; r.casas = casas;
      const her = c.heredado || {}, campo = {};
      for (const b of G.CAMPOS) { let L = her[b] || 0, w = L; const pz = CI.PIEZA_DE[b]; for (const e of E.edificios) if (e.tipo === pz && !e.ruina && !e.obra) { const n = D.NIVEL_PIEZA[e.mejora || 0]; L += n; w += n * bonoSitio(e.nota) * (b === 'granja' ? CI.rindeGranja(E, e).mul : 1); } campo[b] = L > 0 ? G.rate(Math.min(D.MAX_LVL, L)) * w / L : 0; }   // CE3: rinde el nivel TOTAL (la curva 1-3-6-10-15 no se parte entre piezas); el sitio de cada pieza pesa según los niveles que aporta
      r.campo = campo; r.oroT = CI.oroTerreno(E);      // CN19-A: oro de las salinas
    }
    return r;
  }
  function infoC(c) {                    // info(c) abriendo la ciudad nueva si hace falta (nunca durante una carga)
    if (!CI || cargando || !c || c.owner !== 'roma') return null;
    const r = regE.get(c); if (r === false) return null; if (r) return info(c);
    return abrir(c) ? info(c) : null;
  }
  const datosDe = E => Object.assign(CI.aDatos(E), { n0: E.n0 || 0 }, E.mur0 ? { mur0: E.mur0 } : {});
  /* partida vieja: una ciudad propia con c.b.muralla = N y sin fase pasa a la fase que le toca y conserva su nivel exacto N hasta la próxima obra */
  function aplicarMur0(E, n) { E.mur0 = n || 0; if (E.mur0 > 0 && E.muralla.fase === 0 && !E.muralla.obra) { E.muralla.fase = CI.faseDeNivel(E.mur0); E.muralla.nivel = E.mur0; } else if (E.mur0 > 0 && E.muralla.fase === 0) { E.muralla.nivel = E.mur0; } if (E.muralla.geo) E.muralla.geo.fase = E.muralla.fase; }
  const ponerDatos = (c, r) => { c.ciudad = datosDe(r.E); };

  /* ciudad.crear tarda ~0,3 s (el bosque): se hace una vez por semilla y las demás ciudades con esa semilla copian la plantilla (misma ciudad, mismo azar). */
  const plantillas = {};
  function crearE(sem) {
    const T = plantillas[sem] || (plantillas[sem] = CI.crear(sem)), E = Object.assign({}, T);
    E.rnd = CI.azar(sem * 7919 + 13); E.vias = T.vias.map(v => Object.assign({}, v)); E.arboles = T.arboles.map(a => Object.assign({}, a));
    E.parcelas = []; E.bocas = []; E.edificios = []; E.barrios = []; E.puertas = []; E.diario = []; E.abiertas = T.abiertas.slice(); E.muralla = Object.assign({}, T.muralla); E.avisado = {}; E.suc = mesN => G.sucesosEn(mesN);   // dificultad por mes (Normal si no hay partida)
    E.ocup = T.ocup.slice(); E.lote = T.lote.slice(); E.dVia = T.dVia.slice(); E.aVia = T.aVia.slice(); E.tVia = T.tVia.slice();
    return E;
  }
  /* Rehace E desde sus datos guardados. Igual que ciudad.deDatos pero desde n0 y con la acción 'd' (derribo). */
  /* CI1b: datos viejos sin plano: se prueba el plano 2 (calles con eje) y, si alguna obra no cabe, se rehace con el 1 (el de antes) */
  function reconstruir(d) { const p = d.plano; let E = rehacerCiudad(d, !p || p >= 2 ? 3 : p); if (E.fallos && (!p || p === 2)) E = rehacerCiudad(d, 2); if (E.fallos && !p) E = rehacerCiudad(d, 1); delete E.fallos; return E; }   // CI3a: se prueba el plano 3 (urbe a la vista), luego el 2 y el 1
  function rehacerCiudad(d, plano) {
    const E = crearE(d.semilla); E.plano = plano; E.fallos = 0; E.modoJuego = true; E.cultura = d.cultura || 'roma'; E.tinte = d.tinte || E.cultura; E.tam = d.tam || null; CI.fijarTerreno(E, d.terreno || 'rio'); E.n0 = d.n0 || 0; E.mesN = E.n0; if (d.sitio) CI.fundar(E, d.sitio.x, d.sitio.z); aplicarMur0(E, d.mur0 || 0);
    const ac = d.acciones || [];
    for (let n = E.n0; n <= d.mesN; n++) {
      for (const a of ac) { if (a.n !== n) continue;
        if (a.a === 'c') { const r = CI.colocar(E, a.tipo, a.x, a.z, true); if (r.ok) r.e.obra = 0; else E.fallos++; }
        else if (a.a === 'u') CI.mejorar(E, a.id, true); else if (a.a === 'v') CI.mover(E, a.id, a.x, a.z); else if (a.a === 'k' && CI.trazarCalle) { const r = CI.trazarCalle(E, a.p, true); if (!r || !r.ok) E.fallos = (E.fallos || 0) + 1; } else if (a.a === 'm') CI.levantarMuralla(E, true); else if (a.a === 'a') CI.ampliarMuralla(E, true);
        else if (a.a === 's') CI.sembrarCasas(E, a.pob); else if (a.a === 'd') quitar(E, a.id); else if (a.a === 'q') CI.saquearArrabal(E, a.fz); else if (a.a === 'j') CI.techarBarrio(E, a.i, true); else if (a.a === 'f') CI.apagarFuego(E, a.ids); }
      if (n < d.mesN) CI.mes(E);
    }
    E.monedas = d.monedas; (d.barrios || []).forEach((b, i) => { if (E.barrios[i]) { E.barrios[i].nombre = b.nombre; E.barrios[i].corto = b.corto; } }); E.rev++;
    return E;
  }
  /* quita una pieza de E (ciudad.js no trae derribo): libera su huella en la rejilla y lo anota en el diario para que reconstruir lo repita */
  function quitar(E, id) {
    const i = E.edificios.findIndex(e => e.id === id); if (i < 0) return false; const e = E.edificios[i]; E.edificios.splice(i, 1); E.diario.push({ a: 'd', n: E.mesN, id });
    const marca = (o, v, soloSi) => { const rot = o.ang + Math.PI / 2, cs = Math.cos(rot), sn = Math.sin(rot);
      for (let u = -o.w / 2; u <= o.w / 2 + 0.01; u += 2) for (let t = -o.d / 2; t <= o.d / 2 + 0.01; t += 2) { const x = o.x + u * cs - t * sn, z = o.z + u * sn + t * cs, a = Math.floor((x - CI.X0) / CI.C), b = Math.floor((z - CI.Z0) / CI.C); if (a < 0 || b < 0 || a >= CI.N || b >= CI.N) continue; const k = b * CI.N + a; if (E.ocup[k] === soloSi) { E.ocup[k] = v; E.lote[k] = 0; } } };
    marca(e, 0, 2); for (const o of E.edificios) marca(o, 2, 0); E.rev++; return true;
  }

  G.sincronizar = function (cid) { const c = typeof cid === 'string' ? G.state.cities[cid] : cid, r = c && regE.get(c); if (!r) return false; sinc(c, r); return true; };
  // CD2a: calle trazada con el dedo; el coste sale del almacén del jugador (como una fuente cada 120 m)
  G.trazarCalle = function (cid, pts) { const c = prop(cid), E = c && G.ciudadE(cid); if (!E || !CI.trazarCalle) return { ok: false, motivo: 'Solo puedes trazar calles en tus ciudades' }; const r = CI.trazarCalle(E, pts, false, coste => { if (!G.canAfford(coste)) return false; pay(coste); return true; }); if (r.ok) { G.sincronizar(cid); ponerDatos(c, regE.get(c)); G.save(); } return r; };
  function sinc(c, r) {
    const E = r.E, her = c.heredado || {}, suma = {};
    for (const e of E.edificios) { const bid = CI.EDIF[e.tipo].bid; if (bid && bid !== 'muralla') suma[bid] = (suma[bid] || 0) + D.NIVEL_PIEZA[e.mejora || 0]; }
    for (const b in CI.PIEZA_DE) if (b !== 'muralla') c.b[b] = Math.min(D.MAX_LVL, (suma[b] || 0) + (her[b] || 0));
    c.b.viviendas = 0;
    let casas = 0; for (const l of E.parcelas) if (l.casa && !l.casa.ruina && !l.fuera) casas++;
    c.b.foro = Math.min(D.MAX_LVL, Math.max(c.foroMin || 1, 1 + Math.floor(casas / D.FORO_CASAS) + Math.max(0, E.barrios.length - 1)));   // foro derivado: 1 + una por cada D.FORO_CASAS casas + una por barrio extra
    pantalla(c, r);
    r.rev = -1;
  }

  /* Mejor sitio para una pieza. ciudad.mejorSitio recorre 57.600 celdas y el muelle tarda ~5 s (orientar mide contra todo el río): para el muelle
     solo se prueban las celdas cercanas al río (se calculan una vez por proceso) y el resultado se recuerda mientras E no cambie. */
  let candMuelle = null; const memoSitio = new WeakMap();
  function candidatosMuelle() { if (candMuelle) return candMuelle; const out = [], P = CI.PASO_CALOR;   // la orilla válida (50 a 76 del río), cada 16 unidades
    for (let j = 0; j < CI.N_CALOR; j += 2) for (let i = 0; i < CI.N_CALOR; i += 2) { const x = CI.X0 + (i + 0.5) * P, z = CI.Z0 + (j + 0.5) * P, d = CI.distRio(x, z); if (d >= 49 && d <= 77) out.push([x, z]); }
    return (candMuelle = out); }
  function mejorSitioG(E, pz) {
    let m = memoSitio.get(E); if (!m) memoSitio.set(E, m = {}); const h = m[pz];
    if (h) { if (!h.s) { if (E.mesN - h.mes < 6) return null; } else if (CI.notaSitio(E, pz, h.s[0], h.s[1]).vale) return h.s; }   // lo ya hallado se reutiliza mientras valga; «sin sitio» se recuerda 6 meses
    let r; if (pz !== 'muelle') r = CI.mejorSitio(E, pz);
    else { let b = -1e9; r = null; for (const [x, z] of candidatosMuelle()) { const nt = CI.notaSitio(E, pz, x, z); if (!nt.vale) continue; const v = nt.nota - Math.hypot(x - E.foro.x, z - E.foro.z) / 2000; if (v > b) { b = v; r = [x, z]; } } }
    m[pz] = { s: r, mes: E.mesN }; return r;
  }
  /* Crea la ciudad nueva de una ciudad propia: funda en un sitio automático, coloca cada edificio en su mejor sitio (nivel -> banda de mejora,
     sube al techo de la banda: 2-3 -> 3, 4-6 -> 6, 7-10 -> 10) y siembra casas hasta c.pop. Lo que no tiene sitio queda en c.heredado. */
  function convertir(c, id) {
    const bs = {}; for (const b in CI.PIEZA_DE) if (b !== 'muralla') bs[b] = c.b[b] || 0;
    const n0 = mesAlin(), clave = id + '|' + JSON.stringify(bs) + '|' + Math.round(c.pop || 0), hit = memoConv[clave];
    let E, her;
    if (hit) { const d0 = hit.datos, dd = Object.assign({}, d0, { n0: n0, mesN: n0, acciones: d0.acciones.map(a => Object.assign({}, a, { n: n0 })) }); E = reconstruir(dd); her = Object.assign({}, hit.her); }
    else {
      const sem = semillaDe(id); E = crearE(sem); CI.fijarTerreno(E, D.terrenoDe(id)); E.modoJuego = true; E.n0 = E.mesN = n0; her = {};      // CN19-A: una colonia conserva el terreno de su sitio
      if (!CI.fundarAuto(E, sem)) return null;
      const pon = pz => { const s = mejorSitioG(E, pz); if (!s) return null; const r = CI.colocar(E, pz, s[0], s[1], true); if (!r.ok) return null; r.e.obra = 0; return r.e; };
      for (const b of COMPAT) { const L = bs[b] || 0; if (L < 1) continue; const e = pon(CI.PIEZA_DE[b]); if (!e) { her[b] = L; continue; } const k0 = Math.min(3, L - 1); for (let k = k0; k > 0; k--) CI.mejorar(E, e.id, true); if (L - 1 > k0) her[b] = (her[b] || 0) + (L - 1 - k0); }   // CE3-A2: una pieza llega a nivel 4; lo que sobra queda heredado (otra pieza al mejorar)
      if (!E.edificios.some(e => e.tipo === 'granero')) pon('granero');         // sin granero hay hambre en invierno: cada ciudad lo trae
      if (CI.poblacion(E) < (c.pop || 0)) CI.sembrarCasas(E, c.pop);
      memoConv[clave] = { datos: datosDe(E), her: Object.assign({}, her) };
    }
    aplicarMur0(E, c.b.muralla || 0); c.heredado = her; c.foroMin = Math.max(1, c.b.foro || 0); regE.set(c, { E, id, rev: -1 }); sinc(c, regE.get(c)); ponerDatos(c, regE.get(c));
    return E;
  }
  /* Ciudad de plantilla (CN9a): los DATOS de cada plantilla se generan una vez por proceso (id|facción|w) y se desplazan al mes de la partida. */
  const memoPl = {}, BASE_PL = 1000;
  function desdeP(c, id) {
    const d = D.CITIES[id]; if (!d) return null; const clave = id + '|' + d.f + '|' + d.w; let h = memoPl[clave];
    if (!h) { const E0 = CI.desdePlantilla(id, d.f, d.w, { finEn: BASE_PL }); if (!E0) return null; h = memoPl[clave] = CI.aDatos(E0); }
    const dl = mesAlin() - BASE_PL, dd = Object.assign({}, h, { n0: h.n0 + dl, mesN: h.mesN + dl, acciones: h.acciones.map(a => Object.assign({}, a, { n: a.n + dl })) });
    // viejo es una copia: el primer sinc sobrescribe c.b
    const E = reconstruir(dd), viejo = Object.assign({}, c.b || {}); aplicarMur0(E, viejo.muralla || 0);
    const r = { E, id, rev: -1 }; regE.set(c, r); c.heredado = {}; sinc(c, r);
    const her = {}; for (const b of COMPAT) { const f = (viejo[b] || 0) - (c.b[b] || 0); if (f > 0) her[b] = f; }   // lo que la plantilla no trae se conserva como nivel heredado
    c.heredado = her; c.foroMin = Math.max(1, viejo.foro || 0); sinc(c, r); ponerDatos(c, r);
    return E;
  }
  function abrir(c) {                    // reconstruye (si hay datos) o convierte
    const id = idDe(c); if (!id) return null; let E = null;
    try {
      if (c.ciudad) { if (c.ciudad.mur0 === undefined && c.b.muralla > 0) c.ciudad.mur0 = c.b.muralla; E = reconstruir(c.ciudad); regE.set(c, { E, id, rev: -1 }); const r = regE.get(c); sinc(c, r);
        const alin = mesAlin(); let n = 0; while (E.mesN < alin && n++ < 36) CI.mes(E);       // se pone al día (tope de meses)
        if (n) { sinc(c, r); ponerDatos(c, r); } }
      else { E = c.plantilla ? desdeP(c, id) : null; if (!E) { delete c.plantilla; E = convertir(c, id); } }
    } catch (e) { E = null; }
    if (!E) { try { if (c.ciudad) { delete c.ciudad; delete c.plantilla; E = convertir(c, id); } } catch (e2) { E = null; } }
    if (!E) regE.set(c, false);
    return E;
  }
  /* Ciudad nueva de una ciudad NO propia, bajo demanda: se rehace de la semilla (rápido) y vive solo en esta caché, nunca en G.state ni en el guardado. */
  const cacheEnemiga = new WeakMap();
  G.ciudadEnemiga = function (id) {
    const c = G.state && G.state.cities[id], d = D.CITIES[id]; if (!CI || !c || !d || c.owner === 'roma') return null;
    const wl = c.b.muralla || 0, k = d.f + '|' + d.w + '|' + wl, h = cacheEnemiga.get(c); if (h && h.k === k) return h.E;
    let E = null; try { E = CI.desdePlantilla(id, d.f, d.w, { rapido: true }); } catch (e) { E = null; }
    if (!E) return null; aplicarMur0(E, wl); cacheEnemiga.set(c, { k, E }); return E;
  };
  G.ciudadE = function (id) { const c = G.state && G.state.cities[id]; if (!c || c.owner !== 'roma') return null; const r = infoC(c); return r ? r.E : null; };
  G.convertir = id => { const c = G.state.cities[id]; if (!c || !CI) return null; regE.delete(c); delete c.ciudad; delete c.plantilla; return abrir(c) ? G.ciudadE(id) : null; };
  // una ciudad que deja de ser nuestra pierde su ciudad nueva y se queda con los números
  function soltarCiudad(c) { delete c.heridos; delete c.sabios; regE.delete(c); delete c.ciudad; delete c.plantilla; delete c.heredado; if (!c.b.viviendas) c.b.viviendas = 2; }   // sin ciudad nueva, c.b.viviendas (vista derivada = 0) vuelve a un mínimo para que la reconquista no hunda la población
  // una obra de partida vieja (sin pieza) se liga a la pieza que ahora existe si no pasa por encima de lo ya convertido
  function migrarObra(c, antes) {
    for (const q of c.obras) migrarUna(c, antes, q);
  }
  function migrarUna(c, antes, q) {
    if (!q || 'nuevo' in q) return; q.pieza = null; q.nuevo = false; q.mejora = null;
    const pz = piezaDe(q.b), r = pz && regE.get(c); if (!r) return;
    const ps = r.E.edificios.filter(e => e.tipo === pz);
    if (ps.length) { const e = ps.reduce((m, p) => (p.mejora || 0) < (m.mejora || 0) ? p : m), k = e.mejora || 0; if (k < 3 && D.NIVEL_PIEZA[k] <= (antes[q.b] || 0)) { q.pieza = pz; q.eid = e.id; q.x = e.x; q.z = e.z; q.mejora = k + 1; } }
    else if (!(c.heredado && c.heredado[q.b])) { const s = mejorSitioG(r.E, pz); if (s) { q.pieza = pz; q.nuevo = true; q.x = s[0]; q.z = s[1]; q.mejora = 0; } }
  }

  /* ---------- obras con pieza ----------
     Entrada de c.obras (y de c.queue): { b: id D.BUILD (o null), pieza: id de pieza de ciudad.js (o null = nivel heredado), eid: id del edificio de E
     (solo al mejorar), x, z, nuevo: bool, mejora: mejora destino 0..3 (null si heredado), t0, t1, nc, pag, cuota, costo, pausa }. */
  // duración de una mejora que salta de `desde` a `hasta` niveles: tiempo del nivel de destino menos uno × (1 + 0,25 por paso extra), con tope de 30 meses
  const durNiveles = (c, b, desde, hasta) => D.ESTACION * G.obraEstNivel(hasta);   // CE3-A1: 1 estación hasta nivel 2, 2 desde el 3
  // CE3-A1: gran obra sin nivel (ciudad.js): su tiempo de antes en estaciones, con tope de 2
  const durGranObra = meses => D.ESTACION * Math.min(D.OBRA_ESTACIONES_MAX, G.estaciones(meses));
  function empezar(c, s) {
    if (s.b === 'mina' && !G.vetaHierro(idDe(c))) return false;   // CE2: la mina solo con veta (también desde la ciudad nueva)
    const dur = s.dur, pl = nuevoPlazo(limpia(s.coste)); if (!G.canAfford(pl.costo)) return false;   // ES20: se paga entera al ordenar
    const nq = Object.assign({ b: s.b, pieza: s.pieza, eid: s.eid, x: s.x, z: s.z, nuevo: !!s.nuevo, mejora: s.mejora, t0: G.state.t, t1: G.finEn(dur) }, pl); c.obras.push(nq); pagaCuota(nq);
    return nq;
  }
  function especNueva(c, E, pz, x, z) { const D0 = CI.EDIF[pz], b = D0.bid; return { b: b, pieza: pz, x: x, z: z, nuevo: true, mejora: 0, coste: abarata(b ? G.cost(b, c.b[b] || 0) : escalaCoste(D0.coste), G.obraMul(c)), dur: b ? G.buildTime(c, b) : durGranObra(D0.obra) }; }
  function especMejora(c, e) { const D0 = CI.EDIF[e.tipo], k = e.mejora || 0, b = D0.bid; return { b: b, pieza: e.tipo, eid: e.id, x: e.x, z: e.z, nuevo: false, mejora: k + 1, coste: abarata(b ? G.cost(b, c.b[b] || 0) : escalaCoste(D0.mejoras[k].coste), G.obraMul(c)), dur: b ? durNiveles(c, b, c.b[b] || 0, (c.b[b] || 0) + 1) : durGranObra(D0.obra * (k + 1)) }; }
  function menorMejora(E, pz) { let m = null; for (const e of E.edificios) if (e.tipo === pz && (!m || (e.mejora || 0) < (m.mejora || 0))) m = e; return m; }
  function terminarObra(id, c, q) {
    const nom = D.CITIES[id].n, r = CI && regE.get(c) || null; const ix = c.obras.indexOf(q); if (ix >= 0) c.obras.splice(ix, 1); let txt;
    if (q.pieza && r) {
      const E = r.E, her = c.heredado = c.heredado || {};
      if (q.nuevo) {
        let res = CI.colocar(E, q.pieza, q.x, q.z, true);
        if (!res.ok) { const s = mejorSitioG(E, q.pieza); res = s ? CI.colocar(E, q.pieza, s[0], s[1], true) : { ok: false }; }
        if (res.ok) res.e.obra = 0; else if (q.b) her[q.b] = (her[q.b] || 0) + D.NIVEL_PIEZA[0];
      } else {
        const e = E.edificios.find(p => p.id === q.eid);
        if (!(e && CI.mejorar(E, e.id, true).ok) && q.b) her[q.b] = (her[q.b] || 0) + (D.NIVEL_PIEZA[q.mejora] - D.NIVEL_PIEZA[q.mejora - 1]);
      }
      sinc(c, r); ponerDatos(c, r);
      txt = q.b ? D.BUILD[q.b].n + ' nivel ' + c.b[q.b] : CI.EDIF[q.pieza].nombre + (q.nuevo ? ' levantado' : ' mejorado');
    } else {
      const b = q.b;
      if (r && piezaDe(b)) { c.heredado = c.heredado || {}; c.heredado[b] = (c.heredado[b] || 0) + 1; sinc(c, r); ponerDatos(c, r); } else c.b[b] = (c.b[b] || 0) + 1;
      txt = D.BUILD[b].n + ' nivel ' + c.b[b];
    }
    if (D.SENADO.sala) G.senadoActo('obra', q.b || (CI && CI.EDIF[q.pieza] && CI.EDIF[q.pieza].bid));   // CE6
    G.log('🏗️ ' + nom + ': ' + txt + '.'); emit('dirty'); G.parar(T.obraHecha(nom, txt));
  }
  // cada mes entero: la ciudad nueva vive un mes y sus avisos importantes pasan al diario del juego (máx. 2 líneas por ciudad)
  function mesCiudades() {
    if (!CI) return; const grupo = {};
    for (const id of G.myCities()) { const c = G.state.cities[id], r = infoC(c); if (!r) continue;
      const alin = mesAlin(); let av = [], k = 0; while (r.E.mesN < alin && k++ < 36) av = av.concat(CI.mes(r.E)); if (!k) continue;
      sinc(c, r); ponerDatos(c, r);
      if (k === 1 && !G.autoVivoOn() && r.E.fuego && r.E.fuego.mes === r.E.mesN && av.some(a => a.c === 'fuego' && a.cg && a.cg[0])) { const pl = CI.cubosPlan(r.E); if (pl) { const f = { tipo: 'fuego', cid: id, ids: pl.casas.map(q => q.id), t0: G.state.t }; if (!G.state.vivo) G.state.vivo = f; else if (G.state.vivo.cid !== id && !(G.state.vivoCola || (G.state.vivoCola = [])).some(q => q.cid === id)) G.state.vivoCola.push(f); } }   // CN13c: solo en juego vivo y con un solo mes puesto al día; la batalla pendiente va primero (la interfaz la muestra antes)
      for (const a of av) { if (a.c !== 'crecida' && a.c !== 'fuego' && a.c !== 'hambre') continue; if (a.c === 'fuego' && !(a.cg && a.cg[0])) continue; const g = grupo[a.c] = grupo[a.c] || {}, e = g[id] = g[id] || [0, 0]; if (a.cg) { e[0] += a.cg[0]; e[1] += a.cg[1]; } } }
    const cuenta = (e, u1, uN, o1, oN) => { const p = []; if (e[0]) p.push(e[0] + ' ' + (e[0] === 1 ? u1 : uN)); if (e[1]) p.push(e[1] + ' ' + (e[1] === 1 ? o1 : oN)); return p.join(' y '); };
    const lineas = [['crecida', '🌊 Crecida: ', e => cuenta(e, 'casa', 'casas', 'obra', 'obras')], ['fuego', '🔥 Incendio: ', e => cuenta([e[0], 0], 'casa ardió', 'casas ardieron', '', '')], ['hambre', '🥖 Hambre de invierno (sin granero): ', () => '']];
    for (const [k, pre, f] of lineas) { const g = grupo[k]; if (!g) continue; const txt = pre + Object.keys(g).map(id => { const x = f(g[id]); return D.CITIES[id].n + (x ? ' (' + x + ')' : ''); }).join(', '); if (k === 'fuego' && G.state.vivo) { G.log(txt, '', true); continue; }   /* CN13c: la tarjeta de los cubos ya lo cuenta: ni toast ni alerta */ G.log(txt, 'bad'); emit('alert', txt); }
  }

  /* ---------- cubos contra el fuego (CN13c): el reloj se para con s.vivo hasta que el jugador decide ---------- */
  G.autoVivo = typeof window === 'undefined';   // true en Node (pruebas, bot): el fuego se deja arder solo. En el navegador, false
  G.autoVivoOn = () => !!G.autoVivo;   // ES20: siempre por estaciones
  G.vivo = () => { const v = G.state && G.state.vivo; return v && v.tipo === 'fuego' ? v : null; };
  G.vivoInfo = function () { const v = G.vivo(); if (!v) return null; const E = G.ciudadE(v.cid), pl = E && CI.cubosPlan(E); if (!pl) return null; return { cid: v.cid, nombre: D.CITIES[v.cid].n, x: E.fuego.x, z: E.fuego.z, plan: pl, puede: G.canAfford({ denarios: pl.coste }) }; };
  function cierraFuego(v, txt) { const s = G.state; s.vivo = (s.vivoCola && s.vivoCola.length) ? s.vivoCola.shift() : null;   // CN13c: si otra ciudad ardía el mismo mes, sale su tarjeta
     s.ultFuego = { t: s.t, cid: v.cid, x: txt }; G.log('🔥 ' + txt, '', true); emit('dirty'); }
  G.apagarFuego = function (cid) {
    const s = G.state, v = G.vivo(); if (!v || (cid && cid !== v.cid)) return null; const c = s.cities[v.cid], r = infoC(c), pl = r && CI.cubosPlan(r.E);
    if (!pl) { s.vivo = null; return { ok: true, salvadas: 0, perdidas: 0 }; }
    if (!G.canAfford({ denarios: pl.coste })) return { ok: false, salvadas: 0, perdidas: 0, motivo: 'Faltan ' + pl.coste + ' denarios para los cubos' };
    gasta('denarios', pl.coste); const res = CI.apagarFuego(r.E); sinc(c, r); ponerDatos(c, r);
    cierraFuego(v, 'Cubos en ' + D.CITIES[v.cid].n + ': ' + (res.salvadas.length ? res.salvadas.length + (res.salvadas.length === 1 ? ' casa salvada' : ' casas salvadas') : 'ninguna casa salvada') + (res.perdidas.length ? ', ' + res.perdidas.length + (res.perdidas.length === 1 ? ' perdida.' : ' perdidas.') : '.'));
    return { ok: true, salvadas: res.salvadas.length, perdidas: res.perdidas.length };
  };
  G.dejarArder = function (cid) {
    const s = G.state, v = G.vivo(); if (!v || (cid && cid !== v.cid)) return null; const r = infoC(s.cities[v.cid]), n = r && r.E.fuego && !r.E.fuego.apagado ? r.E.fuego.ids.length : 0;
    cierraFuego(v, 'Dejaste arder ' + (n === 1 ? 'una casa' : n + ' casas') + ' en ' + D.CITIES[v.cid].n + '.'); return { ok: true, salvadas: 0, perdidas: n };
  };
  // riesgos que se ven venir: de una ciudad propia, y agrupados por tipo para el consejo del imperio
  G.riesgos = function (cid) { const E = G.ciudadE(cid); if (!E || !CI) return []; const k = E.rev + '|' + E.mesN + '|' + ((G.state && G.state.ajustes && G.state.ajustes.v) || 0); if (!E._rg || E._rg.k !== k) E._rg = { k, v: CI.riesgos(E) }; return E._rg.v; };   // en caché por revisión y mes: la pantalla lo pide a cada cuadro
  G.riesgosImperio = function () { const m = {}; for (const id of G.myCities()) { for (const r of G.riesgos(id)) { const g = m[r.c] = m[r.c] || { c: r.c, p: r.p, ciudades: [], t: r.t, a: r.a, remedio: r.remedio, pieza: r.pieza, cid: id, _n: -1 }; g.ciudades.push(D.CITIES[id].n); g.meses = Math.min(g.meses === undefined ? 99 : g.meses, r.meses); if (r.n > g._n) { g._n = r.n; g.cid = id; g.t = r.t; g.remedio = r.remedio; } } } return Object.values(m).map(g => { delete g._n; return g; }).sort((a, b) => b.p - a.p); };

  /* ---------- API para el modo «colocar» (CN4) ----------  tipo = id de pieza (EDIF de ciudad.js) o id de D.BUILD */
  const tipoPz = t => piezaDe(t) || (CI && CI.EDIF[t] ? t : null);
  const prop = cid => { const c = G.state.cities[cid]; return c && c.owner === 'roma' && CI ? c : null; };
  G.notaSitio = function (cid, tipo, x, z) { const E = G.ciudadE(cid), pz = tipoPz(tipo); if (!E || !pz) return null; const r = CI.notaSitio(E, pz, x, z);
    if (r.vale && G.CAMPOS.some(b => CI.PIEZA_DE[b] === pz)) { const n = Math.round((bonoSitio(r.nota) - 1) * 100); r.efecto = { n, txt: n ? 'Rinde ' + (n > 0 ? '+' : '\u2212') + Math.abs(n) + ' %' : 'Rinde igual', tono: n > 0 ? 'bien' : n < 0 ? 'mal' : 'neutro' }; }   // el rendimiento de los 4 campos
    return r; };
  G.mapaCalor = function (cid, tipo) { const E = G.ciudadE(cid), pz = tipoPz(tipo); return E && pz ? CI.mapaCalor(E, pz) : null; };
  G.colocar = function (cid, tipo, x, z) {
    const c = prop(cid), E = c && G.ciudadE(cid), pz = tipoPz(tipo); if (!E || !pz || CI.EDIF[pz].accion) return { ok: false, motivo: 'No se puede' };
    if (!isFinite(x) || !isFinite(z)) return { ok: false, motivo: 'Sitio no válido' };
    if (G.huecosLibres(c) === 0) return { ok: false, motivo: sinHueco(c) };
    const b = CI.EDIF[pz].bid; if (b && G.obraDe(c, b)) return { ok: false, motivo: 'Ya se está mejorando' };
    if (b && !G.CAMPOS.includes(b) && libs()) { const m = MIN.topeForo(c, b, (c.b[b] || 0) + 1); if (m) return { ok: false, motivo: m }; }   // CDe1: tope del Foro en todas las vías, salvo los campos (una partida nueva ya los trae por encima del Foro)
    if (b && (D.BUILD[b].sea && !D.CITIES[cid].sea)) return { ok: false, motivo: 'Aquí no hay mar' };
    if (b && G.faltaInv(b)) return { ok: false, motivo: G.faltaInv(b) };
    if (b && G.faltaEspecial('edificio', b, c.b[b] || 0)) return { ok: false, motivo: 'Falta un bien especial' };
    if (b === 'mina' && !G.vetaHierro(cid)) return { ok: false, motivo: G.minaMotivo(cid) };   // CE2: sin veta, el motivo (no «Faltan recursos»)
    if (pz === 'escuela') { if (!E.abiertas.includes('escuela')) return { ok: false, motivo: 'La Escuela se abre con ' + CI.EDIF.escuela.desde + ' habitantes' }; if ((c.b.escuela || 0) >= 1 || E.edificios.some(q => q.tipo === 'escuela') || c.obras.some(o => o.pieza === 'escuela')) return { ok: false, motivo: 'Ya hay una Escuela en esta ciudad' }; }
    const n = CI.notaSitio(E, pz, x, z); if (!n.vale) return { ok: false, motivo: n.razones[0] };
    if (b === 'templo' && !G.diosDe(c)) c.dios = D.DIOSES[c.dios] && !(D.DIOSES[c.dios].sea && !D.CITIES[cid].sea) ? c.dios : 'marte';
    const nq = empezar(c, especNueva(c, E, pz, x, z)); if (!nq) return { ok: false, motivo: 'Faltan recursos' };
    return { ok: true, obra: nq };
  };
  G.mejorarPieza = function (cid, idPieza) {
    const c = prop(cid), E = c && G.ciudadE(cid), e = E && E.edificios.find(p => p.id === idPieza); if (!e) return { ok: false, motivo: 'No existe esa pieza' };
    if (!CI.EDIF[e.tipo].mejoras || (e.mejora || 0) >= 3) return { ok: false, motivo: 'Ya está al máximo' };
    if (G.huecosLibres(c) === 0) return { ok: false, motivo: sinHueco(c) };
    if (c.obras.some(q => q.eid === idPieza) || (CI.EDIF[e.tipo].bid && G.obraDe(c, CI.EDIF[e.tipo].bid))) return { ok: false, motivo: 'Ya se está mejorando' };
    if (e.obra || e.ruina) return { ok: false, motivo: 'Ahora no se puede mejorar' };
    const b = CI.EDIF[e.tipo].bid; if (b && G.faltaInv(b)) return { ok: false, motivo: G.faltaInv(b) }; if (b && G.faltaEspecial('edificio', b, c.b[b] || 0)) return { ok: false, motivo: 'Falta un bien especial' };
    if (b && !G.CAMPOS.includes(b) && libs()) { const m = MIN.topeForo(c, b, (c.b[b] || 0) + 1); if (m) return { ok: false, motivo: m }; }   // CDe1: tope del Foro en todas las vías, salvo los campos (una partida nueva ya los trae por encima del Foro)
    if (b === 'mina' && !G.vetaHierro(cid)) return { ok: false, motivo: G.minaMotivo(cid) };   // CE2: sin veta, el motivo
    const nq = empezar(c, especMejora(c, e)); if (!nq) return { ok: false, motivo: 'Faltan recursos' };
    return { ok: true, obra: nq };
  };
  G.moverPieza = function (cid, idPieza, x, z) {   // CN21: cambia de sitio una pieza terminada; conserva su nivel de mejora. Sin coste.
    const c = prop(cid), r = c && infoC(c), e = r && r.E.edificios.find(p => p.id === idPieza); if (!e) return { ok: false, motivo: 'No existe esa pieza' };
    if (!isFinite(x) || !isFinite(z)) return { ok: false, motivo: 'Sitio no válido' };
    if (c.obras.some(q => q.eid === idPieza)) return { ok: false, motivo: 'Se está mejorando' };
    const res = CI.mover(r.E, idPieza, x, z); if (res.ok) { sinc(c, r); ponerDatos(c, r); } return res;
  };
  G.derribarPieza = function (cid, idPieza) {
    const c = prop(cid), r = c && infoC(c), e = r && r.E.edificios.find(p => p.id === idPieza); if (!e) return { ok: false, motivo: 'No existe esa pieza' };
    if (e.tipo === 'compitum') return { ok: false, motivo: 'Una capilla de cruce no se derriba' };
    if (c.obras.some(q => q.eid === idPieza)) return { ok: false, motivo: 'Se está mejorando' };
    quitar(r.E, idPieza); sinc(c, r); ponerDatos(c, r); const pc = G.popCap(c); if (c.pop > pc) c.pop = pc; return { ok: true };
  };
  /* CN7: nivel de muralla para la guerra. Propia con ciudad abierta: sale de la fase (tabla de ciudad.js); si no, c.b.muralla. */
  G.nivelMuralla = function (c) { const r = c && c.owner === 'roma' && !cargando ? infoC(c) : null; return r ? CI.nivelMuralla(r.E) : ((c && c.b && c.b.muralla) || 0); };
  G.faseMuralla = function (c) { const r = c && c.owner === 'roma' && !cargando ? infoC(c) : null; return r ? r.E.muralla.fase : (n => n <= 0 ? 0 : n <= 3 ? 1 : 2)((c && c.b && c.b.muralla) || 0); };
  G.levantarMuralla = function (cid) {   // paga entera al empezar; la guerra lee la fase por G.nivelMuralla
    const c = prop(cid), r = c && infoC(c); if (!r) return { ok: false, motivo: 'No se puede' };
    const res = CI.levantarMuralla(r.E, false, coste => { const k = limpia(coste); if (!G.canAfford(k)) return false; conGasto('obras', null, () => pay(k)); return true; });
    if (res.ok) ponerDatos(c, r); return res;
  };

  G.ampliarMuralla = function (cid) {   // segundo recinto (CN23): mismo cobro que levantarMuralla
    const c = prop(cid), r = c && infoC(c); if (!r) return { ok: false, motivo: 'No se puede' };
    const res = CI.ampliarMuralla(r.E, false, coste => { const k = limpia(coste); if (!G.canAfford(k)) return false; conGasto('obras', null, () => pay(k)); return true; });
    if (res.ok) ponerDatos(c, r); return res;
  };

  /* deja una ciudad como romana recién incorporada: sin colas, impuesto normal, mitad de población */
  function incorporar(c, units, conquista) { c.prev = c.owner; c.inq = conquista ? D.INQ_MESES * G.invMul('inqMeses') : 0; c.owner = 'roma'; c.tipo = 'municipio'; c.tipoElegido = false; c.imp = 'normal'; c.rac = 'normal'; c.fiesta = { ofrenda: -99, juegos: -99 }; c.puertas = false; c.vetB = 0; c.reparto = G.repartoBase(idDe(c)); c.units = units; G.ligarObras(c); c.obras.length = 0; c.train = []; c.levas = []; c.barrio = 1; c.bdef = 0; soltarCiudad(c); { const idc = idDe(c); if (!(idc && G.state.colonias && G.state.colonias[idc])) c.plantilla = true; }   /* nace con la plantilla de su facción de origen (las colonias, no) */ c.pop = Math.round(G.popCapViejo(c) * 0.5); c.ciu = 0; c.esc = conquista ? Math.round(c.pop * G.K().escConquista) : 0; if (CI && !cargando) abrir(c); }   // la ciudad nueva nace con la población que ya tenía
  G.incorporar = incorporar;   // para las pruebas

  // edificios iniciales de una ciudad según su riqueza w y su muralla wl
  G.edificiosBase = function (id, w, wl) {
    const d = D.CITIES[id], h = Math.floor(w / 2);
    return { aserradero: w, cantera: w, mina: G.vetaHierro(id) ? w : 0, granja: w, viviendas: id === 'roma' ? 2 : w, foro: Math.max(1, h), almacen: Math.max(1, h), mercado: id === 'roma' ? 0 : h, puerto: d.sea && id !== 'roma' ? Math.max(1, h) : 0, cuartel: id === 'roma' ? 1 : h, establo: id === 'roma' ? 0 : Math.max(0, h - 1), muralla: wl, templo: 0, herreria: 0 };
  };
  // guarnición de referencia (refuerzos anuales) de una ciudad según su dueño actual
  G.guarnicionBase = (id, owner) => { const d = D.CITIES[id]; return owner === d.f ? d.g : (d.en228 && owner === 'cartago' ? d.en228.g : (d.post && d.post[owner]) || null); };
  G.newGame = function (heroName, region, opciones) {
    opciones = opciones || {}; G.borrarGuerra();   // una partida nueva no retoma la batalla de la anterior
    const dif0 = Object.hasOwn(D.DIFICULTAD, opciones.dificultad) ? opciones.dificultad : 'normal';
    G.quitarColonias();   // las colonias de la partida anterior no pasan a esta
    let modoId = opciones.modo === 'corta' && D.MODOS.corta ? 'corta' : null;   // I8: 'campana' (por defecto) = la de siempre, con modo null
    if (modoId) region = D.MODOS[modoId].region;
    region = D.REGIONES[region] ? region : 'mediterraneo';
    const inicioId = modoId ? (opciones.inicio === 'fundar' && CI && D.COLONIAS[D.MODOS[modoId].inicio.fundar.sitio] ? 'fundar' : 'enPie') : null;   // sin la ciudad nueva no se puede fundar: se cae a «en pie»
    const s = {
      v: 1, polis: (opciones.polis && D.POLIS[opciones.polis] && !modoId) ? opciones.polis : null, niveles5: true, estaciones: true, es20: true, turnos: true, hoja: null, region: region, modo: modoId ? { id: modoId, inicio: inicioId, fase: inicioId === 'fundar' ? 'fundando' : 'jugando' } : null, t: 0, speed: 0, res: { grano: 400, denarios: 400, materiales: 800, hierro: 400 }, bienes: {}, bienesGan: 0, bienesPerdidos: 0, lujoFalta: false,   /* CE2: materiales = madera + piedra de antes; denarios = oro + grano/2 (los edificios ya no piden grano). Licencia de juego */
      alm: { grano: 200, denarios: 200, materiales: 400, hierro: 200 }, cuarto: { grano: 50, denarios: 50, materiales: 100, hierro: 50 }, gastoMes: { grano: 0, denarios: 0, materiales: 0, hierro: 0 }, obrasMes: 0, gan: { grano: 0, denarios: 0, materiales: 0, hierro: 0 }, informe: [],
      ajustes: { dif: dif0, suc: { crecida: true, fuego: true, hambre: true }, asesor: opciones.asesor !== false, vistos: [], hist: [], v: 0 },   // CN14-B: la dificultad elegida vale desde el mes siguiente (se apunta tras abrir Roma y Capua)
      cities: {}, colonias: {}, rutas: [], marches: [], log: [], ev: {}, pending: [], vivo: null, over: null, mid: 1,
      mods: { sea: 1, flex: 0 }, forja: { armas: 0, armaduras: 0, cola: null }, stats: { battles: 0, wins: 0, kills: 0, lost: 0 }, triunfo: null, triunfoFin: 0,
      hero: { name: heroName || 'Lucio Cornelio Escipión', lvl: 1, xp: 0, pts: 1, sk: { mando: 0, disc: 0, log: 0 }, city: 'roma', march: null, wound: 0 }
    };
    D.polis = s.polis;   // PN2: el nombre de la ciudad y del bando del jugador sale de la polis
    const ciudades = D.regionCiudades(region).filter(id => (inicioId !== 'fundar' || D.CITIES[id].f !== 'roma') && (!s.polis || D.CITIES[id].f !== 'roma' || id === 'roma'));   // con polis: solo la capital es del jugador (sin Capua)   // «fundar de la nada»: ni Roma ni Capua existen en la partida
    for (const id of ciudades) {
      const d = D.CITIES[id];
      s.cities[id] = { owner: d.f, barrio: 1, bdef: 0, tipo: 'municipio', tipoElegido: false, units: Object.assign({}, d.g), obras: [], train: [], levas: [], reparto: G.repartoBase(id), fiesta: { ofrenda: -99, juegos: -99 }, puertas: false, vetB: 0, rac: 'normal', b: G.edificiosBase(id, d.w, d.wl), pueblos: (d.pueblos || []).map(() => 0), pobra: null };
    }
    if (s.polis && s.cities.roma) { const f = D.POLIS[s.polis], r = s.cities.roma; r.units = Object.assign({}, f.leva); r.b[f.edificio.id] = Math.min(D.MAX_LVL, (r.b[f.edificio.id] || 0) + 1); }   // PN2: leva griega y el edificio propio un nivel más alto
    for (const id in s.cities) { const c = s.cities[id]; c.pop = Math.round(G.popCapViejo(c) * 0.7); c.ciu = 0; c.esc = 0; G.ligarObras(c); }
    for (const id of ciudades) if (D.CITIES[id].f === 'roma' && id !== 'roma') incorporar(s.cities[id], D.CITIES[id].g);   // aliada de Roma (Capua): empieza como ciudad recién incorporada
    G.state = s; aristasC = null;
    if (modoId && G.factor('guarnicion') !== 1) for (const id in s.cities) { const c = s.cities[id]; if (c.owner === D.MODOS[modoId].rival) for (const k in c.units) c.units[k] = Math.round(c.units[k] * G.factor('guarnicion')); }   // I8: el rival parte ya con la guarnición del modo
    if (CI) for (const id of G.myCities()) {   // Roma y Capua: en pie desde la plantilla, con su población
      const c = s.cities[id]; c.plantilla = true; const E = abrir(c); if (E && c.plantilla) c.pop = Math.min(G.popCap(c), Math.round(poblacionE(E)));
    }
    if (inicioId === 'enPie') s.capital = 'roma';
    s.ajustes.hist.push([mesAlin() + 1, { dif: dif0, suc: Object.assign({}, s.ajustes.suc) }]);   // Roma y Capua ya nacieron en Normal: la elegida cuenta desde el mes siguiente
    s.evN = D.EVENTS.length; s.evV = EV_VERSION; D.anio = D.START_YEAR;
    if (s.cities.roma && !s.polis) for (const k in D.LEVA_INICIAL) s.cities.roma.units[k] = (s.cities.roma.units[k] || 0) + D.LEVA_INICIAL[k];   // H13b: preparación inicial (licencia de juego)
    checkEvents(D.START_YEAR);
    G.migrarSenado(s); G.migrarInv(s); G.migrarDeuda(s); G.migrarColonias(s); DIP.migrar(s); G.migrarCD(s); G.migrarAgro(s); G.migrarAjustes(s); G.migrarTribunos(s); G.senadoAsignar(); if (D.SENADO.sala) G.senadoEstacion();
    if (inicioId === 'fundar') { s.hero.city = null; s.colonias[D.MODOS[modoId].inicio.fundar.sitio] = { estado: 'pendiente', desde: null }; }
    s.hojaR0 = reservaAhora();   // ES20: la reserva con que empieza la primera estación (la hoja cuenta desde aquí)   // colonos «ya llegados»: la pantalla llama a G.fundarColonia
    if (s.polis) { const f = D.POLIS[s.polis]; G.log('🏛️ Empiezas como ' + f.n + ': ' + f.rasgo.n + '. ' + f.rasgo.d + ' Tu edificio propio, ' + f.edificio.n + ', ya está un nivel más alto.', 'good'); }
    return s;
  };

  /* ---------- CN14-B: ajustes de partida (dificultad, sucesos, asesor) ----------
     Tres «hambres» distintos: E.hambre (invierno sin granero, de ciudad.js, lo apaga suc.hambre), el hambre de grano de G.tick (no se toca) y la ración c.rac. */
  const SUC_CLAVES = ['crecida', 'fuego', 'hambre'], sucOk = o => !!o && typeof o === 'object' && Object.keys(o).every(k => SUC_CLAVES.includes(k) && typeof o[k] === 'boolean');
  const COPIA = o => JSON.parse(JSON.stringify(o));
  G.migrarAjustes = function (s) {
    if (!s.ajustes || typeof s.ajustes !== 'object') s.ajustes = { dif: 'normal', suc: { crecida: true, fuego: true, hambre: true }, asesor: false, vistos: [], hist: [], v: 0 };
    const a = s.ajustes; if (!Object.hasOwn(D.DIFICULTAD, a.dif)) a.dif = 'normal'; a.suc = Object.assign({ crecida: true, fuego: true, hambre: true }, a.suc || {});
    if (typeof a.asesor !== 'boolean') a.asesor = false; if (!Array.isArray(a.vistos)) a.vistos = []; if (!Array.isArray(a.hist)) a.hist = []; if (!(a.v >= 0)) a.v = 0; if (!Object.hasOwn(NIV_DIF, a.maxDif) || NIV_DIF[a.maxDif] < NIV_DIF[a.dif]) a.maxDif = a.dif; if (!Array.isArray(a.apagados)) a.apagados = []; for (const k of SUC_CLAVES) if (a.suc[k] === false && !a.apagados.includes(k)) a.apagados.push(k); G.migrarPausas(s); G.migrarBatalla(s); if (typeof a.ambiente !== 'boolean') a.ambiente = true; if (a.hora !== 'elijo' && a.hora !== 'azar') a.hora = 'elijo';      // E5: tono, viñeta y contorno de la ciudad 3D
  };
  /* R3: pausas del reloj. 'todas' (por defecto) | 'graves' (ataque en camino y misión fallida) | 'ninguna'.
     G.parar avisa a la pantalla (evento 'parar' con motivo); la pantalla pone la velocidad a 0. Sin pantalla (pruebas) no hace nada. */
  const PAUSAS = ['todas', 'graves', 'ninguna'];
  G.PAUSAS = PAUSAS;
  G.migrarPausas = function (s) { const a = s && s.ajustes; if (a && !PAUSAS.includes(a.pausas)) a.pausas = 'todas'; };
  /* NB7/GC4/CG4b: motor de batalla. Solo hay uno: 'nueva' (maniobra + choque en el simulador de manípulos, js/simulador.js). Las partidas viejas con 'clasica' pasan a 'nueva'. */
  const BATALLAS = ['nueva'];
  G.BATALLAS = BATALLAS;
  G.migrarBatalla = function (s) { const a = s && s.ajustes; if (a && !BATALLAS.includes(a.batalla)) a.batalla = 'nueva'; };
  G.batalla = () => { const s = G.state, a = s && s.ajustes; return a && BATALLAS.includes(a.batalla) ? a.batalla : 'nueva'; };
  G.ambiente = () => { const s = G.state, a = s && s.ajustes; return a && typeof a.ambiente === 'boolean' ? a.ambiente : true; };
  G.pausas = () => { const s = G.state, a = s && s.ajustes; return a && PAUSAS.includes(a.pausas) ? a.pausas : 'todas'; };
  G.parar = function (motivo, grave) {
    const m = G.pausas(); if (m === 'ninguna' || (m === 'graves' && !grave)) return false;
    emit('parar', { motivo: motivo, grave: !!grave }); return true;
  };

  G.ajustes = function () { const s = G.state; if (!s) return null; G.migrarAjustes(s); return COPIA(s.ajustes); };
  G.ponerAjustes = function (p) {
    const s = G.state; if (!s) return { ok: false, motivo: 'No hay partida.' }; G.migrarAjustes(s); p = p || {}; const a = s.ajustes;
    if (p.dif !== undefined && !Object.hasOwn(D.DIFICULTAD, p.dif)) return { ok: false, motivo: 'Dificultad desconocida.' };
    if (p.suc !== undefined && !sucOk(p.suc)) return { ok: false, motivo: 'Sucesos no válidos.' };
    if (p.asesor !== undefined && typeof p.asesor !== 'boolean') return { ok: false, motivo: 'El asesor es sí o no.' };
    if (p.pausas !== undefined && !PAUSAS.includes(p.pausas)) return { ok: false, motivo: 'Pausas no válidas.' };
    if (p.batalla !== undefined && !BATALLAS.includes(p.batalla)) return { ok: false, motivo: 'Motor de batalla no válido.' };
    if (p.ambiente !== undefined && typeof p.ambiente !== 'boolean') return { ok: false, motivo: 'El ambiente es sí o no.' };
    if (p.hora !== undefined && p.hora !== 'elijo' && p.hora !== 'azar') return { ok: false, motivo: 'La hora se elige o sale al azar.' };
    const dif = p.dif !== undefined ? p.dif : a.dif, suc = Object.assign({}, a.suc, p.suc || {}), cambia = dif !== a.dif || SUC_CLAVES.some(k => suc[k] !== a.suc[k]);
    if (cambia) {   // vale desde el mes siguiente; el pasado no cambia
      const k = mesAlin() + 1, e = [k, { dif, suc: Object.assign({}, suc) }], i = a.hist.findIndex(h => h[0] === k);
      if (i >= 0) a.hist[i] = e; else a.hist.push(e); a.dif = dif; a.suc = suc;
      if (NIV_DIF[dif] > NIV_DIF[a.maxDif]) a.maxDif = dif; for (const k of SUC_CLAVES) if (suc[k] === false && !a.apagados.includes(k)) a.apagados.push(k);   // CN18: la nota cuenta lo más duro usado
      for (const id of G.myCities()) { const E = G.ciudadE(id); if (E) delete E._rg; }
    }
    if (p.asesor !== undefined) a.asesor = p.asesor;
    if (p.pausas !== undefined) a.pausas = p.pausas;
    if (p.batalla !== undefined) a.batalla = p.batalla;
    if (p.ambiente !== undefined) a.ambiente = p.ambiente;
    if (p.hora !== undefined) a.hora = p.hora;
    if (cambia || p.asesor !== undefined) a.v++;
    return { ok: true, motivo: '' };
  };
  // dificultad y sucesos vigentes en el mes absoluto mesN (última entrada con clave <= mesN; sin ninguna, Normal con todo encendido)
  G.sucesosEn = function (mesN) {
    const a = G.state && G.state.ajustes; let m = null;
    if (a && Array.isArray(a.hist)) for (const h of a.hist) if (h[0] <= mesN && (!m || h[0] >= m[0])) m = h;
    if (!m || !Object.hasOwn(D.DIFICULTAD, m[1].dif)) return { dif: 'normal', on: { crecida: true, fuego: true, hambre: true } };
    const o = m[1].suc || {}; return { dif: m[1].dif, on: { crecida: o.crecida !== false, fuego: o.fuego !== false, hambre: o.hambre !== false } };
  };
  // meses de antelación del consejo (3 en Normal); no es la antelación de Ciudad.riesgos (D.DIFICULTAD.aviso)
  G.avisoMeses = function () { const a = G.state && G.state.ajustes, d = D.DIFICULTAD[a && a.dif] || D.DIFICULTAD.normal; return d.consejo; };

  /* ---------- acciones del jugador ---------- */
  G.derivado = (c, b) => !!(D.BUILD[b] && D.BUILD[b].agro) || ((b === 'viviendas' || b === 'foro') && !!c && c.owner === 'roma' && !!infoC(c));   // con ciudad nueva salen de las casas: no se levantan
  G.upgrade = function (cid, b) {
    const c = G.state.cities[cid], L = c.b[b] || 0; G.ultimoMotivo = '';
    if (D.BUILD[b].agro) { G.ultimoMotivo = 'Los campos se plantan en el suelo (G.plantarCampo)'; return false; }
    if (c.owner !== 'roma' || L >= D.MAX_LVL || (D.BUILD[b].sea && !D.CITIES[cid].sea)) return false;
    if (b === 'mina' && !G.vetaHierro(cid)) { G.ultimoMotivo = G.minaMotivo(cid); return false; }   // CE2: sin veta no hay mina
    if (G.obraDe(c, b)) { G.ultimoMotivo = 'Ya se está mejorando'; return false; }
    if (b !== 'foro' && L >= (c.b.foro || 1)) { G.ultimoMotivo = 'Sube antes el Foro'; return false; }   // CE3-A2: ningún edificio pasa del nivel del Foro
    if (G.huecosLibres(c) === 0) { G.ultimoMotivo = sinHueco(c); return false; }
    if (D.BUILD[b].solar && L < 1 && G.solaresUsados(c) >= G.solares(cid)) return false;
    if (G.faltaInv(b) || G.faltaEspecial('edificio', b, L)) return false;   // niveles altos piden un bien especial (B1)   // sin solares no se levanta un edificio urbano nuevo
    const r = infoC(c);
    if (r && (b === 'viviendas' || b === 'foro')) return false;   // salen de las casas
    const pz = r && piezaDe(b);
    if (pz) {   // atajo «mejor sitio»: coloca la primera pieza o mejora la de menor mejora
      let sp; const e = menorMejora(r.E, pz);
      if (e && (e.mejora || 0) < 3) sp = especMejora(c, e);
      else { const st = mejorSitioG(r.E, pz); if (st) sp = especNueva(c, r.E, pz, st[0], st[1]); else if (!(c.heredado && c.heredado[b])) return false; }
      if (sp) { if (b === 'templo' && !G.diosDe(c)) c.dios = D.DIOSES[c.dios] && !(D.DIOSES[c.dios].sea && !D.CITIES[cid].sea) ? c.dios : 'marte'; return !!empezar(c, sp); }
    }
    const cost = G.costeObra(c, b), dur = G.buildTime(c, b), pl = nuevoPlazo(cost); if (!G.canAfford(cost)) return false;   // ES20: entera al ordenar
    if (b === 'templo' && !G.diosDe(c)) c.dios = D.DIOSES[c.dios] && !(D.DIOSES[c.dios].sea && !D.CITIES[cid].sea) ? c.dios : 'marte';
    const nq = Object.assign({ b: b, pieza: null, nuevo: false, mejora: null, t0: G.state.t, t1: G.finEn(dur) }, pl); c.obras.push(nq); pagaCuota(nq);
    return true;
  };

  /* herrería: mejoras globales de armas y armaduras (niveles 0 a D.FORJA_MAX) */
  G.forjaCost = function (k, L, cid) { const o = {}, base = D.FORJA[k].cost, tp = cid && G.tipoDe(G.state.cities[cid]), m = ((tp && tp.forjaCoste) || 1) * ((tp && tp.forjaTiempo) || 1) * G.bonoMul('forjaCoste'); for (const r in base) o[r] = Math.round(base[r] * Math.pow(1.5, L) * m / 5) * 5; return o; };   // CE3-A1: forjaTiempo ya no acorta, abarata
  G.forjaTime = (k, L, cid) => D.ESTACION * G.obraEstNivel(L + 1);   // CE3-A1: obra de forja, 1 o 2 estaciones según el nivel de destino
  G.forjaMul = (s, k) => 1 + D.FORJA_BONO * ((s.forja && s.forja[k]) || 0);
  G.forjaUp = function (cid, k) {
    const s = G.state, c = s.cities[cid], f = s.forja, L = f[k];
    if (!D.FORJA[k] || c.owner !== 'roma' || f.cola || L >= D.FORJA_MAX || (c.b.herreria || 0) <= L) return false;
    const cost = G.forjaCost(k, L, cid); if (!G.canAfford(cost)) return false;
    pay(cost); f.cola = { k: k, t0: s.t, t1: G.finEn(G.forjaTime(k, L, cid)) };
    return true;
  };

  /* ---------- Pueblos (J3): satélites que producen para su capital ----------
     Estado por ciudad: c.pueblos = [niveles] (0 = sin fundar, mismo largo que D.CITIES[id].pueblos) y c.pobra = {i, t0, t1} | null (una obra a la vez).
     Todas las ciudades son capital (G.esCapital); J4 las agrupará en regiones y usará esta misma API. Cifras en D.PUEBLO_*. */
  G.esCapital = cid => !!D.CITIES[cid];   // hoy toda ciudad es capital de su territorio
  G.pueblosDe = function (cid) {   // lista de huecos: {i, tipo, nivel, ficha, obra: {t0,t1}|null}
    const c = G.state.cities[cid], l = D.CITIES[cid].pueblos || [];
    return l.map((tipo, i) => ({ i: i, tipo: tipo, nivel: (c.pueblos && c.pueblos[i]) || 0, ficha: D.PUEBLO_TIPOS[tipo], obra: c.pobra && c.pobra.i === i ? { t0: c.pobra.t0, t1: c.pobra.t1 } : null }));
  };
  G.puebloOk = function (cid, i) {   // se puede fundar o subir: ciudad propia, hueco válido, tipo permitido, bajo el máximo y sin obra de pueblo en curso
    const c = G.state.cities[cid], t = D.CITIES[cid] && D.CITIES[cid].pueblos && D.CITIES[cid].pueblos[i]; if (!c || !t || c.owner !== 'roma') return false;
    const f = D.PUEBLO_TIPOS[t]; if (!f || (f.mar && !D.CITIES[cid].sea)) return false;
    if (f.prod.hierro && !G.vetaHierro(cid)) return false;   // CE2: aldea minera solo con veta
    return !c.pobra && ((c.pueblos && c.pueblos[i]) || 0) < D.PUEBLO_MAX;
  };
  G.puebloCoste = function (cid, i) {   // coste del siguiente nivel: base x 1.5 por nivel ya alcanzado, múltiplo de 5
    const f = D.PUEBLO_TIPOS[D.CITIES[cid].pueblos[i]], L = (G.state.cities[cid].pueblos && G.state.cities[cid].pueblos[i]) || 0, o = {};
    for (const r in f.cost) o[r] = Math.round(f.cost[r] * Math.pow(D.PUEBLO_COSTE_NIVEL, L) / 5) * 5; return o;
  };
  G.puebloTiempo = function (cid, i) {   // CE3-A1: meses del siguiente nivel = 1 estación hasta el nivel 2, 2 desde el 3
    const L = (G.state.cities[cid].pueblos && G.state.cities[cid].pueblos[i]) || 0; return D.ESTACION * G.obraEstNivel(L + 1);
  };
  G.puebloMejorar = function (cid, i) {   // funda (nivel 0 a 1) o sube de nivel un pueblo; paga al contado como la herrería; false si no se puede
    const s = G.state, c = s.cities[cid]; if (!G.puebloOk(cid, i)) return false;
    const cost = G.puebloCoste(cid, i); if (!G.canAfford(cost)) return false;
    pay(cost); c.pobra = { i: i, t0: s.t, t1: G.finEn(G.puebloTiempo(cid, i)) }; return true;
  };
  G.puebloProd = function (cid, gOk) {   // producción mensual {grano,denarios,materiales,hierro} de los pueblos de la ciudad (mano de obra, inquietud y tipo de ciudad como los campos)
    const c = G.state.cities[cid], o = { grano: 0, denarios: 0, materiales: 0, hierro: 0 }; if (!c || !c.pueblos || !c.pueblos.some(n => n > 0)) return o;
    const m = G.manoObraDe(c, G.popEfectiva(c, gOk)) * G.inqMul(c) * (G.tipoDe(c).rec || 1);
    D.CITIES[cid].pueblos.forEach((t, i) => { const L = c.pueblos[i] || 0, f = D.PUEBLO_TIPOS[t]; if (L > 0) for (const r in f.prod) o[r] += G.rate(L) * f.prod[r] * m * (r === 'denarios' ? 1 / (G.tipoDe(c).rec || 1) : 1) * (r === 'materiales' ? D.MAT_MUL : 1) * (r === 'hierro' ? G.minaMul(cid) : 1); });   // CE2: los mineros, como la mina
    return o;
  };
  const puebloPopDe = c => { let n = 0; const id = c.pueblos && c.pueblos.some(x => x > 0) && G.state && Object.keys(G.state.cities).find(k => G.state.cities[k] === c); if (id) D.CITIES[id].pueblos.forEach((t, i) => { n += (c.pueblos[i] || 0) * D.PUEBLO_TIPOS[t].pop; }); return n; };
  G.puebloPop = cid => puebloPopDe(G.state.cities[cid]);   // población máxima extra que dan los pueblos
  G.pueblosResumen = function () {   // {n: pueblos fundados, niveles, prod: producción mensual total} de las ciudades propias
    const r = { n: 0, niveles: 0, prod: { grano: 0, denarios: 0, materiales: 0, hierro: 0 } };
    for (const id of G.myCities()) { const p = G.puebloProd(id); for (const k in p) r.prod[k] += p[k]; for (const x of G.pueblosDe(id)) if (x.nivel > 0) { r.n++; r.niveles += x.nivel; } }
    return r;
  };
  G.migrarPueblos = function (s) {   // partida vieja o ciudades nuevas: c.pueblos con el largo de su lista (todo 0) y c.pobra nulo
    for (const id in s.cities) { const c = s.cities[id], l = (D.CITIES[id] && D.CITIES[id].pueblos) || [];
      if (!Array.isArray(c.pueblos)) c.pueblos = []; while (c.pueblos.length < l.length) c.pueblos.push(0); c.pueblos.length = l.length;
      if (c.pobra === undefined || (c.pobra && !(c.pobra.i >= 0 && c.pobra.i < l.length))) c.pobra = null; }
  };

  G.unitOk = function (c, k) { const u = D.UNITS[k]; if (!u.cost || !G.reclutable(k) || G.faltaEspecial('tropa', k)) return false; for (const b in u.req) if ((c.b[b] || 0) < u.req[b]) return false; return true; };
  G.unitCost = function (k, n) { const o = {}, c = D.UNITS[k].cost; const f = G.factor('costes'); for (const r in c) o[r] = f === 1 ? c[r] * n : Math.max(1, Math.round(c[r] * n * f)); return o; };
  // tope de reclutas: sin ciudad, por coste total (conservador); con ciudad, lo que alcanza (se paga entero) y la población
  G.maxTrain = function (k, cid) {
    const c = D.UNITS[k].cost; let m = 1e9; for (const r in c) m = Math.min(m, Math.floor(G.disponible(r) / c[r]));
    const ci = cid && G.state.cities[cid]; if (!ci) return m;
    let n = Math.min(G.recruits(ci), 1000);
    while (n > 0 && !G.canAfford(G.loteCoste(ci, k, n))) n = n > 10 ? Math.floor(n * 0.9) : n - 1;
    return Math.max(m, n);
  };
  /* CE3-A1: un lote tarda 1 estación sea del tamaño que sea; los lotes van en paralelo (hasta 5 por ciudad). Lo que antes acortaba la instrucción
     (nivel del cuartel, tipo de colonia, bonos, leva libre del Senado) ahora abarata el lote: G.instrMul(c, k). G.loteCoste es el precio de verdad. */
  // ES20: las tropas de élite tardan 2 estaciones (D.LOTE_FACTOR, data.js); las demás, 1
  G.loteEstaciones = k => Math.min(D.LOTE_ESTACIONES_MAX, G.estaciones(((D.UNITS[k] && D.UNITS[k].time) || 0) * D.LOTE_FACTOR));
  G.trainDur = (c, k, n) => D.ESTACION * G.loteEstaciones(k);
  G.instrMul = (c, k) => { const u = D.UNITS[k], bl = c.b[Object.keys(u.req)[0]] || 1, ti = G.tipoDe(c).instr || 1; return Math.max(0.5, 1 - 0.05 * (bl - 1)) * ti * G.bonoMul('instr', ti) * (levaLibre() ? 0.75 : 1); };
  G.loteCoste = (c, k, n) => abarata(G.unitCost(k, n), G.instrMul(typeof c === 'string' ? G.state.cities[c] : c, k));
  // plan de pago para mostrarlo (ES20: siempre de una vez; se deja por la pantalla)
  G.planPago = costo => ({ nc: 1, primera: costo, total: costo });
  G.train = function (cid, k, n) {
    const s = G.state, c = s.cities[cid]; n = Math.floor(n);
    if (c.owner !== 'roma' || n <= 0 || !G.unitOk(c, k) || c.train.length >= 5 || G.recruits(c) < n) return false;
    if (c.train.length >= D.SENADO.levaMax && G.favorBajo() && !levaLibre()) { G.log('🏛️ El Senado niega levas extra en ' + D.CITIES[cid].n + ' (favor bajo).', 'bad'); return false; }
    const cost = G.loteCoste(c, k, n);
    const t0 = s.t, dur = G.trainDur(c, k, n);   // CE3-A1: en paralelo, sin encadenar
    const lote = Object.assign({ u: k, n: n, t0: t0, t1: G.finEn(dur) }, nuevoPlazo(cost));
    if (!G.canAfford(cost)) return false;   // ES20: el lote se paga entero al ordenar
    c.pop -= n; pagaCuota(lote, cid);                      // los reclutas salen de la población
    c.train.push(lote);
    if (D.SENADO.sala) G.senadoLeva(cid);
    return true;
  };

  G.heroAvailable = cid => { const h = G.state.hero; return h.city === cid && !h.march && h.wound <= G.state.t; };

  // botín de un saqueo a una ciudad enemiga: por recurso; el oro, un 60 %
  G.botin = function (cid) {
    const s = G.state, c = s.cities[cid], d = D.CITIES[cid], h = s.hero; if (!c) return {};
    let b = D.SAQUEO_BASE * (c.w || d.w) * (1 + 0.1 * h.sk.log) * (1 + 0.05 * (c.b.almacen || 0)) * (1 - 0.08 * G.nivelMuralla(c));
    if (c.saqueada !== undefined && s.t - c.saqueada < D.SAQUEO_MESES) b *= D.SAQUEO_REPETIDO;
    const o = {}; for (const r of D.RES) o[r] = Math.max(0, Math.round(b * (r === 'denarios' ? 0.6 : r === 'materiales' ? 2 : 1))); return o;   // CE2: materiales = madera + piedra de antes
  };
  G.send = function (from, to, units, withHero, mision) {
    const s = G.state, c = s.cities[from]; G.sendMotivo = '';
    if (!c || c.owner !== 'roma' || !s.cities[to] || !G.edge(from, to)) return false;
    if (DIP.alAtacar(s, to) === 'alianza') return false;   // C3: antes hay que romper la alianza (G.dipRomper)
    if (G.edge(from, to)[2] && !(c.b.puerto > 0)) return false;       // por mar hace falta un puerto
    const u = {}; let n = 0;
    for (const k in units) { const q = Math.min(Math.floor(units[k]), c.units[k] || 0); if (q > 0) { u[k] = q; n += q; } }
    if (withHero && !G.heroAvailable(from)) withHero = false;
    const own = s.cities[to].owner === 'roma';
    if (n === 0 && !(withHero && own)) return false;
    let tr = null; if (!withHero) { tr = G.tribunoLibre(); if (!tr) { G.sendMotivo = 'Todos tus tribunos mandan ya un ejército. Espera a que vuelva alguno o a que el Senado nombre otro.'; return false; } }   // NB7: cada ejército sin el César necesita un tribuno al mando
    for (const k in u) { c.units[k] -= u[k]; if (c.units[k] <= 0) delete c.units[k]; }
    const m = { id: s.mid++, owner: 'roma', from: from, to: to, units: u, hero: !!withHero, t0: s.t, t1: llegada(s.t + G.travel(from, to, withHero) * G.puertasViaje(from, to)) };
    if (mision === 'saqueo' && !own) m.mision = 'saqueo';
    if (tr) m.tribuno = tr.id;
    if (withHero) { s.hero.city = null; s.hero.march = m.id; }
    if (D.SENADO.sala && !own) G.senadoAtaque(m, s.cities[to].owner);   // SN1: sin permiso del Senado
    s.marches.push(m);
    G.rutasRevisar();
    return true;
  };

  /* ---------- colonias (CN5): sitios de D.COLONIAS, colonos que marchan sin batalla, fundación ----------
     s.colonias[id] = { estado: 'libre' | 'camino' | 'pendiente' | 'fundada', desde, E? }. Los sitios NO están en D.CITIES: la colonia se
     registra al fundarla (y al cargar) y se quita en G.newGame. El bot no funda ni envía colonos. */
  G.COLONOS = { pop: 40, grano: 120, denarios: 100 };
  G.migrarColonias = function (s) {
    if (!s.colonias || typeof s.colonias !== 'object') s.colonias = {};
    G.quitarColonias();   // solo quedan registradas las fundadas de esta partida
    for (const id in (D.COLONIAS || {})) { const k = s.colonias[id]; if (!k || !k.estado) s.colonias[id] = { estado: 'libre', desde: null }; }
    for (const id in s.colonias) { if (!D.COLONIAS || !D.COLONIAS[id]) { delete s.colonias[id]; continue; } const k = s.colonias[id]; if (k.estado === 'fundada' && !s.cities[id]) k.estado = 'libre'; if (k.estado === 'fundada') G.registrarColonia(id); }
  };
  G.registrarColonia = function (id) {
    const d = D.COLONIAS && D.COLONIAS[id]; if (!d) return false; if (D.CITIES[id]) return true;
    D.CITIES[id] = { n: d.n, lon: d.lon, lat: d.lat, f: 'roma', tipo: 'agraria', w: 1, wl: 0, g: {}, sea: d.tipo === 'maritima', colonia: true, h: d.h || '' };
    const pr = D.proj(d.lon, d.lat), hay = o => o !== id && !D.CITIES[o].colonia && (!G.state || !G.state.cities || G.state.cities[o]);
    const cand = Object.keys(D.CITIES).filter(hay).map(o => { const q = D.proj(D.CITIES[o].lon, D.CITIES[o].lat); return [o, Math.hypot(q[0] - pr[0], q[1] - pr[1])]; }).sort((a, b) => a[1] - b[1]);
    const pad = {}, raiz = o => { while (pad[o] !== undefined && pad[o] !== o) o = pad[o]; return o; };   // trozos del mapa (sin Roma ni Capua de I8 hay dos): la colonia se une también al más cercano de cada trozo
    for (const e of D.EDGES) if (hay(e[0]) && hay(e[1])) { if (pad[e[0]] === undefined) pad[e[0]] = e[0]; if (pad[e[1]] === undefined) pad[e[1]] = e[1]; pad[raiz(e[0])] = raiz(e[1]); }
    const cerca = [], vistos = new Set(); for (const c of cand) { const r = raiz(c[0]); if (cerca.length < 2 || !vistos.has(r)) cerca.push(c); vistos.add(r); }
    for (const o of cerca) D.EDGES.push([id, o[0], false]);
    aristasC = null; return true;
  };
  G.quitarColonias = function () {
    for (const id of Object.keys(D.CITIES)) if (D.CITIES[id].colonia) delete D.CITIES[id];
    for (let i = D.EDGES.length - 1; i >= 0; i--) if (!D.CITIES[D.EDGES[i][0]] || !D.CITIES[D.EDGES[i][1]]) D.EDGES.splice(i, 1);
    aristasC = null;
  };
  G.coloniasFundadas = s => { s = s || G.state; let n = 0; for (const id in (s.colonias || {})) if (s.colonias[id].estado === 'fundada' && s.cities[id] && s.cities[id].owner === 'roma') n++; return n; };
  const coloniasEn = est => { const s = G.state, o = []; if (s && s.colonias) for (const id in s.colonias) if (s.colonias[id].estado === est && D.COLONIAS && D.COLONIAS[id]) o.push(id); return o; };
  G.coloniasLibres = () => coloniasEn('libre');
  G.coloniasPendientes = () => coloniasEn('pendiente');
  G.puedeEnviarColonos = function (desde, sitio) {
    const s = G.state, k = s.colonias && s.colonias[sitio], c = s.cities[desde], K = G.COLONOS;
    if (!k || !D.COLONIAS[sitio]) return { ok: false, motivo: 'Ese sitio no existe' };
    if (k.estado !== 'libre') return { ok: false, motivo: k.estado === 'fundada' ? 'Ya está fundada' : 'Ya hay colonos en camino o esperando' };
    if (!c || c.owner !== 'roma' || !D.CITIES[desde]) return { ok: false, motivo: 'Los colonos salen de una ciudad tuya' };
    if (!CI) return { ok: false, motivo: 'No se puede fundar sin la ciudad nueva' };
    if (c.pop < K.pop + 60) return { ok: false, motivo: 'Faltan habitantes: salen ' + K.pop + ' y deben quedar al menos 60' };
    const coste = { grano: K.grano, denarios: K.denarios };
    if (!G.canAfford(coste)) return { ok: false, motivo: 'Faltan recursos: ' + K.grano + ' de grano y ' + K.denarios + ' denarios' };
    return { ok: true, motivo: '' };
  };
  G.enviarColonos = function (desde, sitio) {
    const v = G.puedeEnviarColonos(desde, sitio); if (!v.ok) return v;
    const s = G.state, c = s.cities[desde], K = G.COLONOS;
    pay({ grano: K.grano, denarios: K.denarios }); c.pop -= K.pop;
    s.marches.push({ id: s.mid++, owner: 'roma', from: desde, to: sitio, units: {}, hero: false, t0: s.t, t1: llegada(s.t + G.travel(desde, sitio, false)), mision: 'colonia', colonos: true });
    s.colonias[sitio].estado = 'camino'; s.colonias[sitio].desde = desde;
    G.rutasRevisar(); G.log('🏛️ Colonos de ' + D.CITIES[desde].n + ' parten hacia ' + G.lugar(sitio).n + '.'); emit('dirty');
    return { ok: true, motivo: '' };
  };
  G.llegadaColonos = function (m) {
    const k = G.state.colonias[m.to]; if (!k) return;
    k.estado = 'pendiente';
    G.log('🏛️ Los colonos han llegado a ' + G.lugar(m.to).n + ': funda la colonia.', 'good'); emit('colonos', { sitio: m.to }); emit('dirty');
  };
  const ciudadSitio = new WeakMap();   // registro de s.colonias[id] -> E sin fundar
  G.ciudadPendiente = function (sitio) {
    const k = G.state.colonias && G.state.colonias[sitio]; if (!k || k.estado !== 'pendiente' || !CI) return null;
    let E = ciudadSitio.get(k); if (E) return E;
    const d = k.E || null; E = crearE(d ? d.semilla : semillaDe(sitio)); E.modoJuego = true; E.n0 = E.mesN = mesAlin();
    CI.fijarTerreno(E, d && d.terreno ? d.terreno : D.terrenoDe(sitio));      // CN19-A: el terreno del sitio (partida vieja sin terreno: el del sitio, aún no fundado)
    if (!d || !d.terreno) k.E = { semilla: E.semilla, n0: E.n0, terreno: E.terreno };
    ciudadSitio.set(k, E); return E;
  };
  G.notaFundar = function (sitio, x, z) { const E = G.ciudadPendiente(sitio); return E ? CI.notaFundar(E, x, z) : null; };
  G.mapaCalorFundar = function (sitio) { const E = G.ciudadPendiente(sitio); return E ? CI.mapaCalor(E, 'fundar') : null; };
  G.fundarColonia = function (sitio, x, z, conArado) {   // I8b: conArado (la pantalla de fundar) deja la partida en fase 'arando' hasta G.finArado()
    const s = G.state, k = s.colonias && s.colonias[sitio]; if (!k || k.estado !== 'pendiente') return { ok: false, motivo: 'Los colonos aún no han llegado' };
    if (!isFinite(x) || !isFinite(z)) return { ok: false, motivo: 'Sitio no válido' };
    const E = G.ciudadPendiente(sitio); if (!E) return { ok: false, motivo: 'No se puede fundar sin la ciudad nueva' };
    const n = CI.notaFundar(E, x, z); if (!n.vale) return { ok: false, motivo: n.razones[0] };
    E.n0 = E.mesN = mesAlin();
    if (!CI.fundar(E, x, z)) return { ok: false, motivo: 'No se puede fundar aquí' };
    G.registrarColonia(sitio);
    const b = {}; for (const q in D.BUILD) b[q] = 0;
    const c = s.cities[sitio] = { owner: 'roma', barrio: 1, bdef: 0, tipo: 'municipio', tipoElegido: false, units: {}, obras: [], train: [], levas: [], reparto: G.repartoBase(sitio), fiesta: { ofrenda: -99, juegos: -99 }, puertas: false, vetB: 0, rac: 'normal', b: b, pop: 0, ciu: 0, esc: 0, heredado: {}, foroMin: 1 };
    G.ligarObras(c); c.ciudad = datosDe(E);
    incorporar(c, {}, false); c.heredado = {}; c.foroMin = 1;
    const r = regE.get(c); if (r) { c.pop = Math.max(c.pop, CI.poblacion(r.E)); ponerDatos(c, r); }
    k.estado = 'fundada'; delete k.E; k.cuando = s.t;
    if (G.fundando()) { s.modo.fase = conArado ? 'arando' : 'jugando'; s.capital = sitio; s.hero.city = sitio; for (const q in D.LEVA_INICIAL) c.units[q] = (c.units[q] || 0) + D.LEVA_INICIAL[q]; }   // I8: la primera ciudad fundada es tu capital y arranca la partida
    aristasC = null; G.log('🏛️ Has fundado ' + D.CITIES[sitio].n + '.', 'good'); emit('dirty'); G.rutasRevisar();
    return { ok: true, motivo: '' };
  };

  G.skill = function (k) { const h = G.state.hero; if (h.pts <= 0 || h.sk[k] >= 10) return false; h.pts--; h.sk[k]++; return true; };
  G.xpNeed = l => Math.round(80 * Math.pow(l, 1.6));
  function addXp(x) {
    const s = G.state, h = s.hero; let t = 0;
    for (const id of G.myCities()) t = Math.max(t, s.cities[id].b.templo || 0);
    h.xp += Math.round(x * (1 + 0.1 * t));
    while (h.xp >= G.xpNeed(h.lvl)) { h.xp -= G.xpNeed(h.lvl); h.lvl++; h.pts++; G.log('🦅 ' + h.name + ' asciende al nivel ' + h.lvl + '.', 'good'); }
  }

  /* ---------- IA enemiga y hechos históricos ---------- */
  // las marchas llegan siempre al cambio de estación (mínimo la siguiente), en turnos y en tiempo continuo (CE3-A1)
  function llegada(t1) { return Math.max(Math.ceil(t1 / D.ESTACION - 1e-9) * D.ESTACION, G.finTurno()); }   // CE3-A1: en los dos modos
  G.llegada = llegada;
  // ES20: el juego es siempre por estaciones. G.turnos vale true; asignarle otra cosa no hace nada (pruebas viejas que ponían false)
  Object.defineProperty(G, 'turnos', { get: () => true, set: () => {}, enumerable: true, configurable: true });
  G.finTurno = () => (Math.floor(G.state.t / D.TURNO_MESES + 1e-9) + 1) * D.TURNO_MESES;
  G.estacion = t => D.ESTACIONES[(Math.floor(Math.floor(t / D.TURNO_MESES + 1e-9) * D.TURNO_MESES % 12 / D.TURNO_MESES) + 3) % 4];
  G.turnoN = t => Math.round(Math.floor(t / D.TURNO_MESES + 1e-9) + 1);
  G.turnosFaltan = m => Math.max(0, Math.ceil((m.t1 - G.state.t) / D.TURNO_MESES - 1e-9));
  function spawn(owner, fromId, fromXY, to, units, gen, eta, label) {
    const s = G.state;
    if (!s.cities[to] || (fromId && !s.cities[fromId])) return;   // destino u origen fuera de la región
    s.marches.push({ id: s.mid++, owner: owner, from: fromId, fromXY: fromXY, to: to, units: units, gen: gen || null, t0: s.t, t1: llegada(s.t + eta), label: label || null });
    G.rutasRevisar();
  }
  const firstMine = list => list.find(id => G.state.cities[id] && G.state.cities[id].owner === 'roma') || G.capital();

  const EV_VERSION = 2;   // sube cuando cambia el AÑO de un hecho (Pirro 277 → 280): las partidas viejas recalculan qué hechos ya pasaron
  G.DESARME = 0.4;   // CG10: parte de la guarnición de referencia que le queda a Cartago tras el desarme de 149 a.C. (licencia de juego). CG4c: 0,4 (con la batalla jugada, 1/4 daba 10 de 10 caídas; 2/5, 4 de 10)
  const FX = {
    pirro: function (s) {
      if (!s.cities.tarentum || s.cities.tarentum.owner !== 'epiro') return;
      // H13b, licencia de juego: dos oleadas más pequeñas (la primera a los 32 meses, la segunda a los 42) y Roma empieza con levas extra (D.LEVA_INICIAL)
      const dest = firstMine(['capua', 'roma']), gen = { n: 'Pirro de Epiro', mando: 3, disc: 2 };
      spawn('epiro', 'tarentum', null, dest, { falange: 30, hoplitas: 20, peltastas: 15, tesalios: 10, elefantes: 1 }, gen, 32, 'Pirro');
      spawn('epiro', 'tarentum', null, dest, { falange: 30, hoplitas: 20, peltastas: 10, tesalios: 10, elefantes: 2 }, gen, 42, 'Pirro (refuerzos)');
    },
    pirroSeVa: function (s) { const c = s.cities.tarentum; if (c && c.owner === 'epiro') { delete c.units.elefantes; } },
    // licencia de juego: en 264 Agrigentum pasa a Cartago (en realidad la usó de base en 262, Polibio 1.17-19)
    agrigentoPunica: function (s) {
      const c = s.cities.agrigentum; if (!c || c.owner !== 'akragas') return;
      c.owner = 'cartago'; c.units = Object.assign({}, D.CITIES.agrigentum.post.cartago);
      G.log('⚔️ Cartago ocupa Agrigentum y la convierte en su base de Sicilia.', 'bad');
    },
    aratoCorinto: function (s) {
      const c = s.cities.corinthus; if (!c || c.owner !== 'macedonia') return;
      c.owner = 'aquea'; c.units = Object.assign({}, D.CITIES.corinthus.post.aquea);
      G.log('🏛️ Arato libera Corinto: la ciudad entra en la Liga Aquea.', 'hist');
    },
    // hacia 228 (fecha moderna; Polibio 2.13): el poblado íbero pasa a ser Carthago Nova cartaginesa, salvo que ya sea tuyo
    fundaCarthagoNova: function (s) {
      const c = s.cities.carthagonova, e = D.CITIES.carthagonova.en228; if (!c || c.owner === 'roma' || c.owner === 'cartago') return;
      c.owner = 'cartago'; c.units = Object.assign({}, e.g); c.w = e.w; c.b = Object.assign(c.b, G.edificiosBase('carthagonova', e.w, e.wl)); c.obras.length = 0; c.train = [];
      G.log('🏛️ Asdrúbal funda Carthago Nova: el poblado íbero pasa a Cartago.', 'bad');
    },
    corvus: function (s) { s.mods.sea = 0.7; },
    egadas: function (s) {
      const n = ['messana', 'syracusae', 'agrigentum', 'panormus', 'lilybaeum'].filter(id => s.cities[id] && s.cities[id].owner === 'roma').length;
      if (n > 0 && EA()) { G.indemniza('cartago', 400 * n, 1, 'normal'); }
      else if (n > 0) { s.res.denarios += 400 * n; G.log('🪙 Cartago paga ' + 400 * n + ' denarios de indemnización.', 'good'); }
    },
    telamon: function (s) {
      if (!s.cities.mediolanum || s.cities.mediolanum.owner !== 'galos') return;
      spawn('galos', 'mediolanum', null, firstMine(['volsinii', 'roma']), { galos: 480, jinetes: 80 }, { n: 'Concolitano', mando: 2, disc: 1 }, 14, 'Horda gala');
    },
    anibal1: function (s) {
      spawn('cartago', null, D.proj(6.9, 45.1), firstMine(['mediolanum', 'volsinii', 'roma']), { libios: 240, iberos: 160, galos: 160, numidas: 120, elefantes: 12 }, { n: 'Aníbal Barca', mando: 6, disc: 4 }, 18, 'Aníbal');
    },
    // 216 (Livio 23.2-7: Capua se pasa a Aníbal). Licencia de juego: si es tuya y tiene menos de D.CAPUA_LEALTAD.hombres, se pasa; si no, resiste
    capuaSePasa: function (s) {
      const c = s.cities.capua; if (!c || c.owner !== 'roma') return;
      if (G.men(c.units) >= D.CAPUA_LEALTAD.hombres) { G.log('🛡️ Capua, bien guarnecida, resiste a Aníbal y sigue de tu lado.', 'good'); return; }
      rebelion('capua', 'cartago', '🔥 Capua, mal guarnecida, se pasa a Aníbal. Con ' + D.CAPUA_LEALTAD.hombres + ' hombres de guarnición habría resistido.');
    },
    anibal2: function (s) {
      spawn('cartago', null, D.proj(16.1, 41.3), firstMine(['capua', 'tarentum', 'roma']), { libios: 280, iberos: 200, galos: 200, numidas: 160 }, { n: 'Aníbal Barca', mando: 6, disc: 4 }, 16, 'Aníbal');
    },
    escipion: function (s) { s.hero.pts++; },
    masinisa: function (s) { if (!s.cities.roma) return; const u = s.cities.roma.units; u.numidas = (u.numidas || 0) + 80; },
    flex: function (s) { s.mods.flex = 1; },
    desarme: function (s) { const c = s.cities.carthago, base = D.CITIES.carthago.g; if (!c || c.owner !== 'cartago') return; for (const k in c.units) c.units[k] = Math.min(c.units[k], Math.floor((base[k] || 0) * G.DESARME)); }   // CG10: 149 a.C., Cartago entrega sus armas (Apiano, Líbica 80); su guarnición baja a G.DESARME de la de referencia; la muralla sigue
  };

  function checkEvents(year) {
    const s = G.state;
    const hechos = G.region().hechos;
    D.EVENTS.forEach((ev, i) => {
      if (s.ev[i] || year > ev.y) return;
      s.ev[i] = 1;
      if (hechos && hechos.indexOf(ev.y) < 0) return;   // hecho de otra región: se marca y no ocurre
      if (ev.fx) ev.fx.split(',').forEach(k => { if (FX[k]) FX[k](s); });   // fx puede ser una lista separada por comas; se aplican en orden
      G.log('📜 ' + ev.y + ' a.C. — ' + ev.t, 'hist');
      emit('event', ev);
    });
  }

  /* CDe4-CE5: indemnizaciones de paz (s.indem[f] = plan de ESTEANO.indemnizacion). El año se cuenta en años transcurridos (sube), no en a.C. (baja). */
  const anioN = s => Math.floor(s.t / 12 + 1e-9);
  function cobraIndemnizaciones(s) {
    const e = EA(); if (!e || !s.indem) return;
    for (const f in s.indem) { const an = anioN(s); if (s.indem[f] && s.indem[f].ult === an) continue;   // CDe4: una sola cuota por año (G.indemniza dentro de newYear no cobra dos veces)
      const r = e.cobrarCuota(s.indem[f], an); if (r.cuota > 0) { s.indem[f] = Object.assign(r.plan, { ult: an }); s.res.denarios += r.cuota; s.gan.denarios += r.cuota; apunta(null, 'denarios', r.cuota, 'indemnizacion'); G.log('🪙 ' + (D.FACTIONS[f] ? D.FACTIONS[f].n : f) + ' paga ' + r.cuota + ' denarios de indemnización (' + Math.round(r.plan.pagado) + ' de ' + r.plan.total + ').', 'good'); } }
  }
  // paz con indemnización: riquezaAnual × años × dureza ('leve' | 'normal' | 'dura'); se cobra en cuotas anuales, la primera ya
  G.indemniza = function (f, riquezaAnual, anios, dureza) {
    const s = G.state, e = EA(); if (!s || !e) return null;
    if (!s.indem || typeof s.indem !== 'object') s.indem = {};
    const plan = e.indemnizacion({ riquezaAnual, anios, dureza, inicio: anioN(s) }); s.indem[f] = plan;
    G.log('🪙 ' + (D.FACTIONS[f] ? D.FACTIONS[f].n : f) + ' se compromete a pagar ' + plan.total + ' denarios de indemnización en ' + plan.plazos + ' años.', 'good');
    cobraIndemnizaciones(s); return plan;
  };

  // la campaña larga del Mediterráneo (sin modo corto): ni plazo de años ni fin por tomar la capital rival; gana quien logra los caminos (js/caminos.js)
  G.campanaLarga = () => { const s = G.state; return !!s && !G.modo() && (!s.region || s.region === 'mediterraneo'); };

  // para los bots de prueba: en la campaña larga no hay fin del juego, así que paran al lograr los caminos o al pasar el año de la región
  G.finDePrueba = () => { const s = G.state; return !!s && (!!s.over || (G.campanaLarga() && (!!(s.caminos && s.caminos.victoria) || G.yearOf(s.t) < G.hasta()))); };

  function newYear(year, enTurnos) {
    const s = G.state; D.anio = year;
    if (EA() && s.esteAno) s.esteAno = EA().cerrarAnio(s.esteAno, year);   // CDe4: el libro del año pasa a «anterior»
    if (s.tributo && s.tributo.estado === 'pendiente') s.tributo.estado = 'caducado';   // el tributo no resuelto caduca con el año (no se cobra)
    if (!enTurnos) turnoIA(year, 1);
    checkEvents(year);
    cobraIndemnizaciones(s);
    /* CDe4: sin plazo en la campaña larga; solo las partidas cortas (modos) acaban por años */
    if (!G.campanaLarga() && year < G.hasta() && !s.over) { terminar(false, textoFinal('agota', { hasta: G.hasta() })); emit('over'); }
  }

  // turno de los rivales: refuerzos de guarnición e incursiones. factor 1 = una vez al año; en turnos se llama 4 veces al año con 0.25
  function turnoIA(year, factor) {
    const s = G.state, mult = 1 + (D.START_YEAR - year) / (D.START_YEAR - G.hasta()) * 0.8, md = G.modo();
    for (const id in s.cities) {
      const c = s.cities[id]; if (c.owner === 'roma') continue;
      if (md && c.owner !== md.rival) continue;   // I8: en una partida corta solo la facción rival repone guarnición y ataca
      const d = D.CITIES[id], f = D.FACTIONS[c.owner];
      // refuerzos de la guarnición
      const base = G.guarnicionBase(id, c.owner);
      if (base) for (const k in base) { const cap = Math.round(base[k] * mult * G.factor('guarnicion')), cur = c.units[k] || 0; if (cur < cap) c.units[k] = Math.min(cap, cur + Math.max(1, Math.ceil(cap * 0.06 * factor * G.factor('refuerzos')))); }
      DIP.construye(s, id);   // C3: la IA sube muralla despacio
      // incursiones
      if (DIP.pacifica(s, c.owner)) continue;   // C3: aliado o tributario no incursiona
      if (!f.raid || year > f.from || year > 270) continue;
      if (s.marches.some(m => m.from === id && m.owner !== 'roma')) continue;
      const tg = G.neighbors(id).filter(n => s.cities[n].owner === 'roma');
      if (!tg.length || G.men(c.units) < 100 || Math.random() > 0.14 * factor) continue;
      const to = tg[Math.floor(Math.random() * tg.length)], u = {};
      for (const k in c.units) { const q = Math.floor(c.units[k] * 0.4); if (q > 0) { u[k] = q; c.units[k] -= q; } }
      const sq = Math.random() < D.SAQUEO_IA; spawn(c.owner, id, null, to, u, null, G.travel(id, to) * 2 + 4); if (sq) s.marches[s.marches.length - 1].mision = 'saqueo';
      G.log('⚠️ ' + f.n + ' envía ' + (sq ? 'una partida de saqueo' : 'un ejército') + ' desde ' + d.n + ' contra ' + D.CITIES[to].n + '.', 'bad');
      emit('alert', '¡' + f.n + ' marcha sobre ' + D.CITIES[to].n + '!'); G.parar(T.ataque(f.n, D.CITIES[to].n), true);
    }
  }

  /* ---------- bucle ---------- */
  G.tick = function (dm) {
    const s = G.state; if (s) D.anio = G.yearOf(s.t);   // nombres según la fecha (D.nombreCiudad)
    if (!s || s.over || s.pending.length || s.vivo || G.fundando() || G.arando()) return;   // I8: sin ciudad (fase 'fundando') el tiempo no corre; I8b: ni mientras el arado traza el surco
    if (dm > 1) { let n = 0; while (dm > 1e-9 && n++ < 5000 && !s.over && !s.pending.length && !s.vivo) { const t0 = s.t; G.tick(Math.min(1, dm)); const av = s.t - t0; if (!(av > 1e-12)) break; dm -= av; } return; }   // un salto largo se trocea mes a mes (cada cierre de mes y de estación); se para ante una batalla o un fuego
    const y0 = G.yearOf(s.t), m0 = Math.floor(s.t);
    let B = null;   // ES20: paso interno; si llegamos al final de la estación, B es ese instante exacto (nunca se pasa de ahí)
    { const fin = G.finTurno(); if (s.t + dm >= fin - 1e-9) { B = fin; dm = Math.max(0, fin - s.t); } }
    s.t += dm; if (B !== null) s.t = B;
    G.rutasRevisar();
    // economía
    const p = G.prod(); apuntaTick(p, dm); hojaTick(p, dm);
    for (const r of D.RES) {
      let v = p[r] * dm;
      if (r === 'denarios' && v > 0 && s.deudaPaga > 0) { const pg = Math.min(v, s.deudaPaga); s.deudaPaga -= pg; v -= pg; }   // I3b: los ingresos pagan primero la paga atrasada
      s.res[r] += v; if (v > 0) s.gan[r] += v;
      if (s.res[r] < 0) { const falta = -s.res[r]; s.res[r] = 0; const sale = Math.min(falta, s.alm[r]); s.alm[r] -= sale; if (r === 'denarios') s.deudaPaga = (s.deudaPaga || 0) + falta - sale; }   // el déficit sale de la caja y del almacén; el oro que falta se DEBE (I3b)
    }   // el déficit sale de la caja y, si no alcanza, del almacén
    if (Math.floor(s.t) > m0) G.cierreMes();
    const crm = G.bonoMul('crece');
    for (const id of G.myCities()) { const c = s.cities[id], pc = G.popCap(c); c.pop = s.res.grano + s.alm.grano > 0 ? (G.felicidad(c) < D.FELICIDAD_MIN_CRECER ? c.pop : Math.min(pc, c.pop + (1 + 0.03 * c.pop * Math.max(0, 1 - c.pop / pc)) * dm * crm)) : Math.max(20, c.pop * (1 - 0.02 * G.invMul('hambre') * dm)); }
    // inquietud de ciudades conquistadas: se calma con el tiempo (más deprisa con templo); con la gente descontenta se rebela
    for (const id of G.myCities()) { const c = s.cities[id]; if (!(c.inq > 0)) continue;
      if (c.inq > D.INQ_MESES * G.invMul('inqMeses') / 2 && G.felicidad(c) < D.INQ_REBELION) { rebelion(id); continue; }
      c.inq = Math.max(0, c.inq - dm * (1 + D.INQ_TEMPLO * G.diosNivel(c))); }
    // herrería
    if (s.forja.cola && s.t >= s.forja.cola.t1 - 1e-9) { const k = s.forja.cola.k; s.forja[k]++; s.forja.cola = null; acaba(() => G.log('🔨 Herrería: ' + D.FORJA[k].n + ' nivel ' + s.forja[k] + '.')); emit('dirty'); }
    // pueblos (J3): una obra por ciudad
    for (const id in s.cities) { const c = s.cities[id]; if (c.pobra && s.t >= c.pobra.t1 - 1e-9) { const i = c.pobra.i; c.pueblos[i] = (c.pueblos[i] || 0) + 1; c.pobra = null; if (c.owner === 'roma') acaba(() => G.log(D.PUEBLO_TIPOS[D.CITIES[id].pueblos[i]].i + ' ' + D.PUEBLO_TIPOS[D.CITIES[id].pueblos[i]].n + ' de ' + D.CITIES[id].n + ': nivel ' + c.pueblos[i] + '.')); emit('dirty'); } }
    acaba(() => G.invTick(dm, B !== null));   // saber (I5); ES20: el estudio termina al cerrar la estación
    // colas
    for (const id of G.myCities()) {
      const c = s.cities[id];
      for (const q of c.obras.filter(o => s.t >= o.t1 - 1e-9)) acaba(() => terminarObra(id, c, q));
      for (const q of c.train.filter(l => s.t >= l.t1 - 1e-9)) { c.train.splice(c.train.indexOf(q), 1); c.units[q.u] = (c.units[q.u] || 0) + q.n; if (q.u !== 'milicia') { if (!c.levas) c.levas = []; c.levas.push({ u: q.u, n: q.n, t: s.t }); } acaba(() => G.log('🛡️ ' + D.CITIES[id].n + ': ' + q.n + ' ' + D.UNITS[q.u].n + ' listos.')); emit('dirty'); G.parar(T.tropaLista(D.CITIES[id].n, q.n, D.UNITS[q.u].n)); }   // CE3-A1: lotes en paralelo, acaba el que llega a su fin
    }
    // al cerrar la estación se resuelve el mundo (año nuevo, rivales) antes de que lleguen las marchas
    if (B !== null) { const yb = G.yearOf(s.t); turnoIA(yb, 0.25); if (yb < y0) newYear(yb, true); }   // ES20: los rivales antes que los hechos del año (como hacía newYear sin turnos)
    // marchas
    if (B !== null) G.encuentros();   // GM15b: ¿se topan en el camino?
    for (let i = s.marches.length - 1; i >= 0; i--) {
      const m = s.marches[i]; if (m.sitio || s.t < m.t1 - 1e-9 || B === null) continue;   // un ejército esperando en un sitio no «llega»: o se topa o vuelve a casa
      hojaLlega(m);
      s.marches.splice(i, 1);
      if (m.colonos) { G.llegadaColonos(m); continue; }   // colonos: sin batalla y sin ciudad destino
      const c = s.cities[m.to];
      if (m.owner === 'roma') {
        if (c.owner === 'roma') { merge(c.units, m.units); if (m.hero) { s.hero.city = m.to; s.hero.march = null; } emit('dirty'); }
        else s.pending.push({ kind: 'attack', m: m });
      } else if (c.owner === 'roma') s.pending.push({ kind: 'defense', m: m });
      else if (c.owner === m.owner) merge(c.units, m.units);
    }
    if (B !== null && D.SENADO.sala && !s.over) G.senadoEstacion();   // ES20: peticiones y votación con lo que ya acabó esta estación (también jugando con G.tick)
    if (B !== null) emit('turno', { n: G.turnoN(s.t), estacion: G.estacion(s.t) });
    if (s.pending.length) { emit('battle'); return; }
    // hambre
    if (Math.floor(s.t) > m0 && s.res.grano + s.alm.grano <= 0 && p.grano < 0) {
      for (const id of G.myCities()) { const u = s.cities[id].units; for (const k in u) u[k] = Math.floor(u[k] * 0.96); }
      if (Math.floor(s.t) % 6 === 0) G.log('🍞 ¡No hay grano! Las tropas desertan.', 'bad');
      emit('dirty');
    }
    // sin paga (I3b): la deuda de paga hace desertar a las tropas, más cuanto más atrasada va
    if (Math.floor(s.t) > m0 && s.deudaPaga > 0) {
      const meses = s.deudaPaga / Math.max(1, G.mantenimiento().tropas), f = Math.min(D.DEUDA.desMax, D.DEUDA.desBase + D.DEUDA.desMes * meses);
      for (const id of G.myCities()) { const u = s.cities[id].units; for (const k in u) u[k] = Math.floor(u[k] * (1 - f)); }
      G.log('🪙 Se debe la paga de las tropas (' + Math.round(s.deudaPaga) + ' denarios, ' + G.estTxt(G.estaciones(meses)) + '). Desertan un ' + Math.round(f * 100) + ' %.', 'bad');
      emit('dirty');
    }
    const y1 = G.yearOf(s.t);
    if (y1 < y0 && B === null) newYear(y1);
  };

  /* ---------- ES20: pasar estación y hoja de estación ----------
     El juego solo avanza con G.pasarEstacion(): simula el resto de la estación (3 meses internos que el jugador no ve) y deja la hoja en s.hoja.
     Devuelve false si una batalla, un fuego o el fin de la partida lo detienen antes (el siguiente «Pasar estación» la completa).
     La hoja se va llenando en s.hojaVa mientras dura el paso (si se para a medias, sigue en la llamada siguiente). */
  let pasando = false, enAcaba = false;
  const LISTA_MAX = 30;
  function acaba(fn) { const a = enAcaba; enAcaba = true; try { return fn(); } finally { enAcaba = a; } }   // lo que termina: su aviso va a «acaba» de la hoja
  const hv = () => pasando && G.state && G.state.hojaVa ? G.state.hojaVa : null;
  // G.log llama a esto: recoge el aviso en la hoja que se está llenando (no cambia nada de G.log)
  function hojaLog(txt, kind, mudo) {
    const h = hv(); if (!h || typeof txt !== 'string') return;
    if (enAcaba && kind !== 'bad') { if (h.acaba.length < LISTA_MAX) h.acaba.push(txt); return; }   // los avisos malos van a «pasa»
    if ((!mudo || enAcaba) && (kind === 'bad' || kind === 'good') && h.pasa.length < LISTA_MAX) h.pasa.push({ k: kind, x: txt });
  }
  // lo que entra y sale por la producción en cada paso interno (bruto: entra lo producido, sale la comida y el mantenimiento)
  function hojaTick(p, dm) {
    const h = hv(); if (!h || !(dm > 0)) return; const m = p.mant || { edificios: 0, tropas: 0 };
    for (const r of D.RES) { let e, x;
      if (r === 'grano') { e = (p.grano || 0) + (p.comida || 0); x = p.comida || 0; }
      else if (r === 'denarios') { x = (m.edificios || 0) + (m.tropas || 0); e = (p.denarios || 0) + x; }
      else { e = Math.max(0, p[r] || 0); x = Math.max(0, -(p[r] || 0)); }
      if (e < 0) { x -= e; e = 0; } if (x < 0) { e -= x; x = 0; }
      h.e[r] += e * dm; h.x[r] += x * dm; }
  }
  // una marcha que llega al cerrar la estación
  function hojaLlega(m) {
    const h = hv(); if (!h || h.acaba.length >= LISTA_MAX) return; const s = G.state, c = s.cities[m.to], nom = (D.CITIES[m.to] && D.CITIES[m.to].n) || (G.lugar && G.lugar(m.to) && G.lugar(m.to).n) || m.to;
    if (m.colonos) h.acaba.push('🏕️ Los colonos llegan a ' + nom + '.');
    else if (m.owner === 'roma') h.acaba.push(c && c.owner === 'roma' ? '🚶 Llegan ' + G.men(m.units) + ' hombres a ' + nom + '.' : '⚔️ Tu ejército llega a ' + nom + ': hay batalla.');
    else if (c && c.owner === 'roma') h.acaba.push('⚠️ ' + D.FACTIONS[m.owner].n + ' ataca ' + nom + '.');
  }
  const reservaAhora = () => { const o = {}; for (const r of D.RES) o[r] = Math.floor(G.reserva(r)); return o; };
  const tituloEst = t => G.estacion(t) + ' del ' + G.yearOf(t) + ' a.C.';
  // lo que terminará al pasar la próxima estación (textos)
  G.proximas = function () {
    const s = G.state, out = []; if (!s) return out; const fin = G.finTurno() + 1e-9;
    for (const id of G.myCities()) { const c = s.cities[id], nom = D.CITIES[id].n;
      for (const q of c.obras || []) if (q.t1 <= fin) out.push('🏗️ ' + nom + ': ' + (q.b && D.BUILD[q.b] ? D.BUILD[q.b].n : q.pieza && CI && CI.EDIF && CI.EDIF[q.pieza] ? CI.EDIF[q.pieza].nombre || q.pieza : 'obra') + '.');
      for (const l of c.train || []) if (l.t1 <= fin) out.push('🛡️ ' + nom + ': ' + l.n + ' ' + D.UNITS[l.u].n + '.');
      if (c.pobra && c.pobra.t1 <= fin) out.push(D.PUEBLO_TIPOS[D.CITIES[id].pueblos[c.pobra.i]].i + ' ' + nom + ': ' + D.PUEBLO_TIPOS[D.CITIES[id].pueblos[c.pobra.i]].n + '.'); }
    if (s.forja && s.forja.cola && s.forja.cola.t1 <= fin) out.push('🔨 Herrería: ' + D.FORJA[s.forja.cola.k].n + '.');
    const q = s.inv && s.inv.cola; if (q) { const v = G.saberVel() * G.eurekaMul(q.id); if (v > 0 && q.p + v * (G.finTurno() - s.t) >= q.P - 1e-9) { const d = D.EDADES[q.id] || D.INVEST[q.id]; out.push('📜 Saber: ' + (d ? d.n : q.id) + '.'); } }
    for (const m of s.marches) if (m.owner === 'roma' && !m.sitio && m.t1 <= fin) { const nom = (D.CITIES[m.to] && D.CITIES[m.to].n) || (G.lugar && G.lugar(m.to) && G.lugar(m.to).n) || m.to; out.push((m.colonos ? '🏕️ Colonos a ' : '🚶 Llegada a ') + nom + '.'); }
    return out;
  };
  function hojaCierra(s) {
    const h = s.hojaVa, ahora = reservaAhora(), entra = {};
    for (const r of D.RES) {
      const per = Math.round(h.per[r]); let rec = h.e[r], gas = h.x[r];
      const otras = (ahora[r] - h.r0[r] + per) - (rec - gas);   // botín, aliados, ventas, deudas, robos...: lo que no es producción
      if (otras > 0) rec += otras; else gas -= otras;
      entra[r] = { recogido: Math.round(rec), gastado: Math.round(gas), perdido: per, ahora: ahora[r], ordenado: Math.round(h.ord[r] || 0) };   // ordenado: lo pagado al ordenar antes de pulsar (va dentro de gastado)
    }
    const av = G.consejo().slice(1);
    s.hoja = { titulo: tituloEst(s.t), de: h.de, n: G.turnoN(s.t), entra: entra, acaba: h.acaba.slice(), siguiente: G.proximas(), pasa: h.pasa.slice(-8).reverse(), avisos: av };
    s.hojaVa = null; s.hojaR0 = ahora; emit('hoja', s.hoja);   // ES20: la estación siguiente empieza con esta reserva
  }
  G.hojaEstacion = () => (G.state && G.state.hoja) || null;
  G.pasarEstacion = function () {
    const s = G.state; if (!s || s.over || s.pending.length || s.vivo || G.fundando() || G.arando()) return false;   // CN13c: un fuego por decidir también para el reloj
    if (D.SENADO.sala && s.senado && s.senado.votacion) G.dejarPasar();   // SN1: la votación que quedó abierta se hace sola
    const fin = G.finTurno(); let n = 0;
    if (!s.hojaVa || s.hojaVa.fin !== fin) { const z = () => { const o = {}; for (const r of D.RES) o[r] = 0; return o; }; const ya = reservaAhora(), r0 = s.hojaR0 && typeof s.hojaR0 === 'object' ? Object.assign({}, s.hojaR0) : ya, ord = z(); for (const r of D.RES) { if (typeof r0[r] !== 'number') r0[r] = ya[r]; ord[r] = Math.max(0, r0[r] - ya[r]); } s.hojaVa = { fin: fin, de: tituloEst(s.t), r0: r0, ord: ord, e: z(), x: z(), per: z(), acaba: [], pasa: [] }; }   // ES20: r0 = reserva al empezar la estación (al cerrar la anterior), así cuenta lo ordenado antes de pulsar
    pasando = true;
    try { while (s.t < fin - 1e-9 && !s.over && !s.pending.length && !s.vivo && n++ < 100) G.tick(Math.min(0.25, fin - s.t)); }
    finally { pasando = false; }
    if (D.SENADO.sala && !s.over) G.senadoEstacion();
    const hecho = s.t >= fin - 1e-9;
    if (hecho && s.hojaVa) hojaCierra(s);
    return hecho;
  };
  G.pasarTurno = G.pasarEstacion;   // nombre viejo

  /* ---------- cierre de mes (Q2) ---------- */
  // fracción del mes ya transcurrida (0 a 1)
  G.fraccionMes = () => { const t = G.state.t; return t - Math.floor(t + 1e-9); };
  // qué se perderá por el tope si la estación acaba con la producción que falta (ES20: antes, el mes): sobra = lo que entra, cabe = hueco del almacén
  G.previsionCierre = function () {
    const s = G.state, p = G.prod(), rem = Math.max(0, G.finTurno() - s.t), out = {}, caja = {};   // ES20: lo que entrará hasta el final de la estación
    for (const r of D.RES) caja[r] = Math.max(0, s.res[r] + p[r] * rem);
    for (const r of D.RES) { const sobra = caja[r], cabe = Math.max(0, G.capDe(r) - s.alm[r]); out[r] = { sobra: Math.floor(sobra), cabe: Math.floor(cabe), perdera: Math.max(0, Math.floor(sobra - cabe)) }; }
    return out;
  };
  // avisos de lo que se va a perder (con completo=true, siempre: previsión de la estación entera)
  G.avisoCierre = function (completo) {
    const s = G.state, out = []; if (!s || (!completo && G.fraccionMes() < D.AVISO_CIERRE)) return out;
    const NOM = D.RES_NOM, pr = G.previsionCierre();
    for (const r of D.RES) if (pr[r].perdera >= 1) out.push(T.cierre(NOM[r], pr[r].sobra, pr[r].cabe, pr[r].perdera, completo));
    const pb = G.bienesPerdera(); for (const k in pb) if (pb[k] >= 1) out.push(T.cierre(D.ESPECIAL[k].n, Math.floor(G.bienes()[k] || 0), D.BIEN_TOPE, pb[k], completo));   // CE2: los bienes también avisan
    return out;
  };
  /* ---------- cuentas del mes (Q3) ---------- */
  G.cuentas = function () {
    const s = G.state, p = G.prod(), pr = G.previsionCierre(), pl = G.plazos(), out = { mat: {}, denarios: {} };
    for (const r of D.RES) { if (r === 'denarios') continue;
      const comp = (r === 'grano' ? p.comida : (s.gastoMes && s.gastoMes[r]) || 0) + pl[r],   /* gasto de la caja del mes; queda es la previsión de cierre (incluye caja inicial y ventas), no entra-comprometido */
         entra = r === 'grano' ? p.grano + p.comida : p[r], x = pr[r];
      out.mat[r] = { entra: entra, comprometido: comp, plazos: pl[r], queda: x.sobra, alAlmacen: Math.max(0, x.sobra - x.perdera), caben: x.cabe, perdera: x.perdera };
    }
    const m = G.mantenimiento(), gm = (s.gastoMes && s.gastoMes.denarios) || 0, ob = Math.min(gm, s.obrasMes || 0) + pl.denarios, otros = Math.max(0, gm - (s.obrasMes || 0)), d = p.det, ing = d.impuestos + d.foro + d.rutas, sab = p.sabios || 0, gas = m.edificios + m.tropas + ob + otros + sab;
    out.denarios = { impuestos: d.impuestos, foro: d.foro, rutas: d.rutas, ingresos: ing, edificios: m.edificios, legiones: m.tropas, obras: ob, otros: otros, deuda: Math.round(s.deudaPaga || 0), sabios: sab, plazosOro: pl.denarios, gastos: gas, saldo: ing - gas, neto: p.denarios };
    return out;
  };
  // vende en el mercado lo que se perdería de r; devuelve el oro recibido (0 si no se puede)
  G.ultimaVenta = { got: 0, vendido: 0, quedara: 0, motivo: '' };
  G.venderSobrante = function (r) {
    const U = G.ultimaVenta = { got: 0, vendido: 0, quedara: 0, motivo: '' }, s = G.state;
    if (s && D.BIENES[r]) {   // CE2: un bien que pasa del tope se vende barato (a D.BIEN_SOBRA de su precio)
      const per = G.bienesPerdera()[r] || 0; if (per < 1) { U.motivo = 'sinsobrante'; return 0; }
      const got = G.venderBien(r, per, G.precioBien(r) * D.BIEN_SOBRA); U.got = got; U.vendido = got ? per : 0; U.quedara = G.bienesPerdera()[r] || 0; U.motivo = !got ? 'orolleno' : U.quedara >= 1 ? 'parcial' : 'ok'; return got; }
    if (!s || r === 'denarios' || !(r in s.res)) { U.motivo = 'invalido'; return 0; }
    const rate = G.tradeRate() * D.SOBRA_MUL; if (!rate) { U.motivo = 'sinmercado'; return 0; }   // CE2: lo que sobra se vende barato
    const per = G.previsionCierre()[r].perdera; if (per < 1) { U.motivo = 'sinsobrante'; return 0; }
    const hueco = Math.max(0, G.cap() - s.alm.denarios - s.res.denarios); if (hueco < 1) { U.motivo = 'orolleno'; U.quedara = per; return 0; }
    const dar = Math.min(per, Math.floor(G.disponible(r)), Math.floor(hueco / rate)); if (dar < 1) { U.motivo = G.disponible(r) < 1 ? 'sincaja' : 'orolleno'; U.quedara = per; return 0; }   // ES20: se vende de la reserva entera
    const got = G.trade(r, 'denarios', dar, D.SOBRA_MUL); U.got = got; U.vendido = dar; U.quedara = G.previsionCierre()[r].perdera;
    U.motivo = !got ? 'orolleno' : U.quedara >= 1 ? 'parcial' : 'ok';
    return got;
  };
  // cierra el mes: lo que sobra de la caja pasa al almacén hasta su tope; el resto se pierde
  G.cierreMes = function () {
    const s = G.state, cap = G.cap(), reg = { mes: Math.floor(s.t + 1e-9), tn: Math.floor((Math.floor(s.t + 1e-9) - 1) / D.TURNO_MESES), r: {} }; let pierde = [], rojo = false;
    const paga = G.pagaSabios();   // paga de los sabios (I5b): se cobra con los plazos; sin oro, las escuelas cierran
    if (paga > 0) {
      if (G.canAfford({ denarios: paga })) conGasto('sabios', null, () => gasta('denarios', paga, true));
      else { for (const id of G.myCities()) { const sb = s.cities[id].sabios; if (sb) sb.dot = 0; } rojo = true; G.log('🎓 Sin denarios para pagar a los sabios: las escuelas cierran.', 'bad'); }
    }
    { const o = DIP.ingresoMes(s); if (o > 0) { s.res.denarios += o; s.gan.denarios += o; apunta(null, 'denarios', o, 'aliados'); } }   // C3: comercio de aliados y tributos
    s.obrasMes = 0;
    mesCiudades();
    G.senadoMes(rojo || s.deudaPaga > 0);
    cierreCD(s);   // CDe1-A: ministros, plan del Senado y necesidades de barrio
    cierreAgro(s, mesAhora(s));   // CDe3-F2a: cosecha de los campos, pérdida de lo que se estropea y el mercado del mes
    for (const id in s.cities) if (s.cities[id].heridos && s.cities[id].owner !== 'roma') delete s.cities[id].heridos;   // CG4b: ciudad perdida, heridos perdidos
    for (const id of G.myCities()) G.curaHeridos(id);   // CG4b: parte de los heridos vuelve a filas cada mes
    for (const id of G.myCities()) {   // barrios: sube un nivel si cumple más; baja tras BARRIO_RETRASO meses de déficit
      const c = s.cities[id], bi = G.barrioInfo(c), nom = D.CITIES[id].n;
      if (bi.barrios.length) {   // ciudad nueva: los barrios ya subieron o bajaron solos en su mes; la ciudad es su media
        const n = G.nivelDeBarrios(c), antes = c.barrio || 1; c.barrio = n; c.bdef = 0;
        if (n > antes) G.log('🏛️ ' + nom + ' sube a ' + D.BARRIO[n].n + '.'); else if (n < antes) G.log('🏛️ ' + nom + ' baja a ' + D.BARRIO[n].n + '.', 'bad');
      } else if (bi.objetivo > bi.nivel) { c.barrio = bi.nivel + 1; c.bdef = 0; G.log('🏛️ ' + nom + ' sube a ' + D.BARRIO[c.barrio].n + '.'); }
      else if (bi.objetivo < bi.nivel) {
        c.bdef = (c.bdef || 0) + 1;
        if (c.bdef >= D.BARRIO_RETRASO) { const sg = D.BARRIO[bi.nivel].pide.filter(k => !bi.serv[k]).map(k => D.BARRIO_SERV[k].toLowerCase()); c.barrio = bi.nivel - 1; c.bdef = 0; G.log('🏛️ ' + nom + ' baja a ' + D.BARRIO[c.barrio].n + ': falta ' + sg.join(' y ') + '.', 'bad'); }
      } else c.bdef = 0;
      if ((c.esc || 0) > 0 && G.animoClases(c).esc >= G.K().manumision) {   // manumisión: los esclavos contentos se liberan poco a poco
        const k = Math.min(Math.floor(c.esc) || 1, Math.max(1, Math.round(c.esc * G.K().manumisionTasa))); c.esc = Math.max(0, c.esc - k); G.log('⛓️ ' + nom + ': ' + k + (k === 1 ? ' esclavo liberado pasa' : ' esclavos liberados pasan') + ' a plebeyos.');
      }
    }
    for (const r of D.RES) {
      const sobra = Math.max(0, s.res[r]), cabe = Math.max(0, G.capDe(r) - s.alm[r]), guarda = Math.min(sobra, cabe), per = sobra - guarda;
      s.alm[r] += guarda; s.res[r] = 0; s.gastoMes[r] = 0; if (s.cuarto) s.cuarto[r] = s.alm[r];   // ES20: el cuarto ya no limita
      { const h = hv(); if (h) h.per[r] += per; }   // ES20: lo que se pierde por el tope va a la hoja
      reg.r[r] = { gan: Math.round(s.gan[r]), sob: Math.round(sobra), gua: Math.round(guarda), per: Math.round(per) }; s.gan[r] = 0;
      if (per >= 1) { pierde.push(Math.round(per) + ' de ' + r); apunta(null, r, -per, 'perdido'); }
    }
    for (const x of cierreBienes()) pierde.push(x);   // CE2: bienes por región y lujo de los ricos
    s.informe = (s.informe || []).filter(e => e.tn === reg.tn); s.informe.push(reg);
    if (pierde.length || reg.mes % D.TURNO_MESES === 0) G.log('📦 Al almacén: guardado ' + D.RES.map(r => reg.r[r].gua + ' ' + r).join(', ') + (pierde.length ? '; perdido ' + pierde.join(' ') : '') + '.', pierde.length ? 'bad' : '', true);      // el aviso en pantalla es «Fin de mes…» (ui.js), una vez; aquí solo el diario
    if (reg.mes % 12 === 3) tributoPrimavera(s, reg.mes);   // CDe4: al empezar la primavera, con guerra abierta
    if (CAM()) { const rc = CAM().paso(s, CAM().foto(s, G), reg.mes); rc.efectos.forEach(e => G.log(e.texto, e.tono)); if (rc.gana) emit('victoria'); }   // CDe4: caminos de victoria, una vez al mes
    emit('dirty');
  };
  // suma del informe del turno: por recurso, ganado, guardado y perdido
  G.informeEstacion = function () {
    const s = G.state, out = { meses: (s.informe || []).length, r: {} };
    for (const r of D.RES) { const a = { gan: 0, gua: 0, per: 0, sob: 0 }; for (const e of s.informe || []) { a.gan += e.r[r].gan; a.gua += e.r[r].gua; a.per += e.r[r].per; a.sob += e.r[r].sob; } out.r[r] = a; }
    return out;
  };

  // consejo de estación: lista corta de avisos para el jugador (sin pantalla)
  G.consejo = function () {
    const s = G.state, out = [], p = G.prod(), cap = G.cap(), mis = G.myCities();
    const head = { k: '', x: G.estacion(s.t) + ' del ' + G.yearOf(s.t) + ' a.C. (turno ' + G.turnoN(s.t) + ').' };
    let rec = null;
    for (const m of s.marches) {
      if (m.owner === 'roma' || G.turnosFaltan(m) > 1 || s.cities[m.to].owner !== 'roma') continue;
      out.push({ k: 'bad', x: T.llega(D.FACTIONS[m.owner].n, G.men(m.units), D.CITIES[m.to].n) });
      rec = rec || T.refuerza(D.CITIES[m.to].n);
    }
    for (const id of G.coloniasPendientes()) out.push({ k: '', x: T.colonos(G.lugar(id).n) });
    for (const r of ['grano', 'denarios']) if (p[r] < 0 && (s.res[r] + s.alm[r]) / -p[r] < 3) out.push({ k: 'bad', x: T.seAcaba(r === 'grano', Math.max(1, Math.ceil((s.res[r] + s.alm[r]) / -p[r]))) });
    const sin = mis.filter(id => G.huecosLibres(s.cities[id]) > 0).map(id => D.CITIES[id].n);
    if (sin.length) { out.push({ k: '', x: T.sinObras(sin.slice(0, 3).join(', '), sin.length > 3) }); rec = rec || T.constructores(); }
    for (const x of G.avisoCierre(true)) out.push({ k: 'bad', x: x });
    const rs = typeof G.riesgosImperio === 'function' ? (G.riesgosImperio() || []).filter(r => r.meses <= G.avisoMeses()).sort((a, b) => b.p - a.p) : [];
    if (rs.length) { const r = rs[0]; out.unshift({ k: 'bad', x: r.a || r.t }); rec = rec || r.remedio || null; }
    if (s.ultFuego && s.t - s.ultFuego.t < 3) out.unshift({ k: '', x: s.ultFuego.x });   // CN13c: una línea con el resultado de los cubos
    const llenos = D.RES.filter(r => s.alm[r] >= G.capDe(r) - 1).map(r => D.RES_NOM[r].toLowerCase()).concat(Object.keys(G.bienes()).filter(k => D.BIENES[k] && G.bienes()[k] >= D.BIEN_TOPE - 1e-9).map(k => D.ESPECIAL[k].n.toLowerCase()));   // CE2: también los bienes
    if (llenos.length) out.push({ k: '', x: T.llenoAlm(llenos.slice(0, 3).join(', ') + (llenos.length > 3 ? '…' : '')) });
    for (const id of mis) { const pd = G.arca(id).pide; if (pd) { out.push({ k: '', x: pd }); break; } }   // CN13a: el arca pide una ofrenda
    const mi = G.misionActual(), sen = G.favorBajo() ? { k: 'bad', x: T.favor() } : mi ? { k: '', x: T.mision(mi.m.n, mi.quedan, mi.falta) } : null;   // sustituye al tercer aviso
    const sv = D.SENADO.sala && G.senadoSala() ? { k: '', x: 'El Senado vota: ' + G.senadoSala().ley.n + '.' } : null;   // SN1
    const l = [head].concat(out.slice(0, sv ? Math.max(0, 3 - (sen ? 1 : 0) - 1) : sen ? 2 : 3)); if (sen) l.push(sen); if (sv) l.push(sv);
    l.push({ k: rec ? '' : 'good', x: rec || T.tranquila() });
    return l.slice(0, 5);
  };

  function merge(a, b) { for (const k in b) if (b[k] > 0) a[k] = (a[k] || 0) + b[k]; }

  /* ---------- batallas ---------- */
  // I5c-A: la ventaja de guerra del jugador (forja x ciencia) y si la ruta es de mar
  G.esMar = (from, to) => { const e = G.edge(from, to); return !!(e && e[2]); };
  G.cienciaGuerra = function (wall, mar) {
    const s = G.state, cienAtk = Math.min(D.SABER.techos.atk, G.invMul('atk') * (mar ? G.invMul('atkMar') : 1));
    return { atk: G.forjaMul(s, 'armas') * cienAtk, def: G.forjaMul(s, 'armaduras') * (1 + G.invSum('defMuro') * Math.min(6, wall)), mor: G.invSum('mor') };
  };
  // I5c-B: cada bando enemigo aprende parte de tu ventaja de guerra con cada batalla seria
  G.copiaBando = f => !!(D.FACTIONS[f] && f !== 'roma' && f !== 'campanos');
  G.copiaDe = f => { const s = G.state; return (s && s.inv && s.inv.copia && s.inv.copia[f]) || 0; };
  G.copiaActualiza = function (pb, m, res, facc) {
    const s = G.state, out = [];
    if (!G.copiaBando(facc) || res.dead[0] + res.dead[1] < D.SABER.copiaBajasMin) return out;
    if (!s.inv.copia) s.inv.copia = {};
    const V = G.cienciaGuerra(pb.kind === 'defend' ? 0 : (G.nivelMuralla(s.cities[m.to])), false);
    if (V.atk <= 1 && V.def <= 1 && V.mor <= 0) return out;   // N15b: sin ventaja que copiar, la copia no sube
    const k = G.copiaDe(facc), n = k + (1 - k) * D.SABER.copiaBatalla; s.inv.copia[facc] = n;
    out.push(D.FACTIONS[facc].n + ' ya copia el ' + Math.round(n * D.SABER.copia * 100) + ' % de tu ventaja.');
    return out;
  };
  // N15b: fracción de tropas no-milicia de una ciudad reclutadas hace menos de D.LEVA_CURTIDO_MESES (bisoñas)
  G.fraccionBis = function (cid) {
    const s = G.state, c = s && s.cities[cid]; if (!c || c.owner !== 'roma') return 0;
    if (!c.levas) c.levas = [];
    c.levas = c.levas.filter(l => s.t - l.t < D.LEVA_CURTIDO_MESES);
    let tot = 0, bis = 0; for (const k in c.units) if (k !== 'milicia' && k !== 'vigiles') tot += c.units[k] || 0;
    for (const l of c.levas) bis += l.n;
    return tot > 0 ? Math.max(0, Math.min(1, bis / tot)) : 0;
  };
  // N15b: fuerza simple (hombres x ataque x defensa, sin elefantes ni general)
  const fuerzaSimple = sd => { let n = 0; for (const k in sd.units || {}) { const u = D.UNITS[k]; if (u && u.cls !== 'ele') n += sd.units[k]; } return n * (sd.atkMul || 1) * (sd.defMul || 1); };
  G.objetivoBatalla = function (pb, me, foe, c, heroIn) {
    const a = fuerzaSimple(me), b = fuerzaSimple(foe);
    if (pb.kind === 'defend') return b > 1.3 * a ? { tipo: 'resistir', lado: 0, rondas: 7 } : null;
    if (heroIn !== undefined ? heroIn : pb.m.hero) { if (a < 0.5 * b) return { tipo: 'escapar', lado: 0 }; }
    if (G.nivelMuralla(c) >= 3) return { tipo: 'tomar', lado: 0, zona: { x: 0.35, y: 0.42, w: 0.3, h: 0.16 }, seg: 40 };
    return null;
  };
  G.battleInfo = function (pb) {
    if (pb.kind === 'campo') return G.battleInfoCampo(pb);   // GM15b
    const s = G.state, m = pb.m, cid = m.to, c = s.cities[cid], d = D.CITIES[cid], h = s.hero;
    const fa = G.forjaMul(s, 'armas'), fd = G.forjaMul(s, 'armaduras');
    const hm = { atkMul: (1 + 0.04 * h.sk.mando) * (s.mods.flex ? 1.1 : 1) * fa, defMul: (1 + 0.03 * h.sk.disc) * fd, mor: 4 * h.sk.disc };
    const noHero = { atkMul: (s.mods.flex ? 1.1 : 1) * fa, defMul: fd, mor: 0 };
    let me, foe, heroIn;
    if (pb.kind === 'attack') {
      heroIn = m.hero;
      me = Object.assign({ units: m.units, name: 'Roma', col: D.FACTIONS.roma.col, gen: heroIn ? { n: h.name, mando: h.sk.mando, disc: h.sk.disc, lvl: h.lvl } : null }, heroIn ? hm : noHero);
      const g = c.owner === d.f ? G.cityGen(cid, G.yearOf(s.t)) : null;
      foe = { units: c.units, fac: c.owner, name: D.FACTIONS[c.owner].n, col: D.FACTIONS[c.owner].col, gen: g, atkMul: g ? 1 + 0.04 * g.mando : 1, defMul: g ? 1 + 0.03 * g.disc : 1, mor: g ? 4 * g.disc : 0 };
    } else {
      heroIn = G.heroAvailable(cid);
      const u = Object.assign({}, c.units); u.vigiles = 20 + 20 * G.nivelMuralla(c);
      me = Object.assign({ units: u, name: 'Roma', col: D.FACTIONS.roma.col, gen: heroIn ? { n: h.name, mando: h.sk.mando, disc: h.sk.disc, lvl: h.lvl } : null }, heroIn ? hm : noHero);
      { const dg = G.diosDe(c); if (dg && dg.mor) me.mor += dg.mor * G.diosNivel(c); }
      const g = m.gen;
      foe = { units: m.units, fac: m.owner, name: D.FACTIONS[m.owner].n, col: D.FACTIONS[m.owner].col, gen: g, atkMul: g ? 1 + 0.04 * g.mando : 1, defMul: g ? 1 + 0.03 * g.disc : 1, mor: g ? 4 * g.disc : 0 };
    }
    {   // I5c-A: ciencia de guerra del jugador
      const wall = G.nivelMuralla(c), mar = pb.kind === 'attack' && G.esMar(m.from, m.to);
      me.atkMul *= Math.min(D.SABER.techos.atk, G.invMul('atk') * (mar ? G.invMul('atkMar') : 1)); me.mor += G.invSum('mor');
      if (pb.kind === 'defend') me.defMul *= (1 + G.invSum('defMuro') * Math.min(6, wall)) * (c.puertas ? D.PUERTAS.def : 1);   // CN16b: puertas cerradas
      else if (wall > 0 && G.invSum('brecha') > 0) foe.defMul /= (1 + 0.1 * wall) / (1 + 0.1 * Math.max(0, wall - G.invSum('brecha')));
    }
    {   // I5c-B: copia del rival
      const ff = pb.kind === 'attack' ? c.owner : m.owner, k = G.copiaDe(ff);
      if (G.copiaBando(ff) && k > 0) {
        const V = G.cienciaGuerra(pb.kind === 'defend' ? 0 : G.nivelMuralla(c), pb.kind === 'defend' && G.esMar(m.from, m.to)), q = k * D.SABER.copia;
        foe.atkMul *= 1 + q * (V.atk - 1); foe.defMul *= 1 + q * (V.def - 1); foe.mor += q * V.mor;
      }
    }
    if (pb.kind === 'attack' && !heroIn && m.tribuno != null) { const t = (s.tribunos || []).find(x => x.id === m.tribuno); if (t) me.tribuno = { id: t.id, n: t.n, car: t.car }; }   // NB7: el tribuno que manda este ejército
    {   // N15b: levas bisoñas del jugador y objetivo de batalla
      const oc = pb.kind === 'attack' ? m.from : cid; me.bis = G.fraccionBis(oc); foe.bis = 0;
    }
    const cfg = { sides: [me, foe], defender: pb.kind === 'attack' ? 1 : 0, wall: G.nivelMuralla(c), seed: Math.floor(s.t * 1000) + m.id };
    const ob = G.objetivoBatalla(pb, me, foe, c, heroIn); if (ob) cfg.objetivo = ob;
    return { cfg: cfg, city: cid, heroIn: heroIn, kind: pb.kind };
  };

  const keep = (surv, lost, f, g) => { const o = {}; for (const k in surv) { if (k === 'vigiles') continue; const n = Math.floor(surv[k] * f + (lost[k] || 0) * g); if (n > 0) o[k] = n; } return o; };
  /* CG4b (ES0 §5, decidido por el usuario): heridos y cautivos de la batalla del simulador.
     · Tus heridos no vuelven de golpe: van a c.heridos de la ciudad donde acaba tu ejército y vuelven a filas mes a mes. Si pierdes esa ciudad, se pierden.
     · Los heridos del enemigo vencido son cautivos: esclavos de tu ciudad más cercana hasta que los esclavos sean un tercio de su gente; el resto se vende.
     Cifras: licencia de juego. */
  G.HERIDOS = { rapido: 0.3, lento: 0.1 };   // parte que vuelve cada mes: 30 % con pocos heridos, bajando a 10 % si igualan o superan a los sanos
  G.CAUTIVOS = { tercio: 1 / 3, precio: 3 };   // tope de esclavos (parte de la población) y denarios por cautivo vendido
  // con heridos del simulador, tu bando no recupera de golpe parte de las bajas (el 0,25 de keep): los sustituyen los heridos
  const gTuyo = res => (res && res.heridos ? 0 : 0.25);
  const sumaU = u => { let n = 0; for (const k in u || {}) n += u[k] > 0 ? u[k] : 0; return n; };
  // tu ciudad más cercana a un punto (lon, lat)
  const romanaCerca = (lon, lat) => { let r = null, d = Infinity; for (const id of G.myCities()) { const q = D.CITIES[id], e = (q.lon - lon) * (q.lon - lon) + (q.lat - lat) * (q.lat - lat); if (e < d) { d = e; r = id; } } return r; };
  const cercaDeCiudad = cid => (G.state.cities[cid] && G.state.cities[cid].owner === 'roma' ? cid : romanaCerca(D.CITIES[cid].lon, D.CITIES[cid].lat));
  // los heridos de tu bando quedan en la ciudad cid y vuelven poco a poco
  function heridosA(cid, her, out) {
    const c = cid && G.state.cities[cid]; if (!c || c.owner !== 'roma') return 0; let n = 0;
    for (const k in her || {}) { if (k === 'vigiles' || !D.UNITS[k]) continue; const q = Math.round(her[k]); if (q > 0) { if (!c.heridos) c.heridos = {}; c.heridos[k] = (c.heridos[k] || 0) + q; n += q; } }
    if (n > 0 && out) out.lines.push('🩹 ' + n + (n === 1 ? ' herido vuelve' : ' heridos vuelven') + ' a filas poco a poco en ' + D.CITIES[cid].n + '.');
    return n;
  }
  // los cautivos (heridos del vencido): esclavos de la ciudad cid hasta el tope; lo que no cabe se vende
  function cautivos(n, cid, out) {
    n = Math.max(0, Math.round(n || 0)); if (!n) return { esc: 0, venta: 0 };
    const s = G.state, c = cid && s.cities[cid] && s.cities[cid].owner === 'roma' ? s.cities[cid] : null, T = G.CAUTIVOS.tercio; let k = 0;
    if (c) { const cl = G.clases(c); k = Math.max(0, Math.min(n, Math.floor((T * cl.pop - cl.esc) / (1 - T)))); if (k > 0) { c.pop = (c.pop || 0) + k; c.esc = (c.esc || 0) + k; } }
    const v = n - k, oro = v * G.CAUTIVOS.precio; if (oro > 0) s.res.denarios += oro;
    if (out) out.lines.push('⛓️ ' + n + (n === 1 ? ' cautivo: ' : ' cautivos: ') + (k > 0 ? k + (k === 1 ? ' pasa a esclavo de ' : ' pasan a esclavos de ') + D.CITIES[cid].n : 'ninguno cabe como esclavo') + (v > 0 ? ' y ' + v + (v === 1 ? ' se vende (+' : ' se venden (+') + oro + ' denarios).' : '.'));
    return { esc: k, venta: v };
  }
  // cada mes, en cada ciudad tuya: parte de los heridos vuelve a filas (más despacio cuantos más heridos hay frente a los sanos)
  G.curaHeridos = function (cid) {
    const c = G.state.cities[cid], h = c && c.heridos; if (!h) return 0;
    const n = sumaU(h); if (!n) { delete c.heridos; return 0; }
    const sanos = sumaU(c.units) - (c.units.vigiles || 0), H = G.HERIDOS, p = n >= sanos ? H.lento : H.rapido - (H.rapido - H.lento) * n / Math.max(1, sanos);
    let vuelven = 0;
    for (const k in h) { const q = Math.min(h[k], Math.max(1, Math.round(h[k] * p))); if (q > 0) { c.units[k] = (c.units[k] || 0) + q; h[k] -= q; vuelven += q; } if (!(h[k] > 0)) delete h[k]; }
    if (!Object.keys(h).length) delete c.heridos;
    return vuelven;
  };
  // CG4b: c.heridos = {tropa: n} (opcional). Al cargar, lo que no sea así se limpia
  G.migrarHeridos = function (c) { if (!c || c.heridos === undefined) return; const h = c.heridos; if (!h || typeof h !== 'object' || Array.isArray(h)) { delete c.heridos; return; } for (const k in h) if (!D.UNITS[k] || !(h[k] > 0)) delete h[k]; else h[k] = Math.round(h[k]); if (!Object.keys(h).length) delete c.heridos; };
  G.heridosDe = cid => { const c = G.state && G.state.cities[cid]; return Object.assign({}, (c && c.owner === 'roma' && c.heridos) || {}); };

  // Una ciudad tuya pasa a otro dueño. Sin f: vuelve a su dueño anterior (inquietud). Con f y texto: rebelión de un hecho (Capua, 216)
  function rebelion(id, fijo, texto) {
    const s = G.state, c = s.cities[id], f = fijo || (c.prev && D.FACTIONS[c.prev] && c.prev !== 'roma' ? c.prev : D.CITIES[id].f);
    soltarCiudad(c); c.owner = f; c.inq = 0; c.obras.length = 0; c.train = []; c.levas = []; c.puertas = false; c.vetB = 0; c.units = Object.assign({}, G.guarnicionBase(id, f) || {});
    if (s.hero.city === id) { s.hero.city = G.capital(); s.hero.march = null; }
    G.log(texto || '🔥 ¡' + D.CITIES[id].n + ' se rebela y vuelve a ' + D.FACTIONS[f].n + '! Un templo y una felicidad alta habrían calmado la ciudad.', 'bad'); G.rutasRevisar(); emit('dirty');
  }
  /* CN7: el atacante gana al defender o saquea: las casas de fuera del surco quedan en ruina (fuerza 0,3 a 1 según el tamaño del ataque) */
  function arrabalSaqueado(c, m, res, out) {
    const r = c.owner === 'roma' ? infoC(c) : null; if (!r) return;
    let ata = 0; for (const k in (m.units || {})) ata += m.units[k]; const fz = Math.max(0.3, Math.min(1, ata / 400));
    const q = CI.saquearArrabal(r.E, fz); if (!q.n) return;
    ponerDatos(c, r); r.rev = -1; const t = q.n + (q.n === 1 ? ' casa del arrabal saqueada' : ' casas del arrabal saqueadas');
    out.arrabal = q.n; out.lines.push('🏚️ ' + t + '.'); G.log('🏚️ ' + t + ' en ' + D.CITIES[m.to].n + '.', 'bad');
  }
  G.applyBattle = function (res) {
    if (G.state) G.state.ultGuerra = G.state.t;   // CDe4: guerra abierta si hubo batalla en el último año
    if (G.state.pending[0] && G.state.pending[0].kind === 'campo') return aplicarCampo(res);   // GM15b
    const s = G.state, pb = s.pending.shift(), m = pb.m, cid = m.to, c = s.cities[cid], d = D.CITIES[cid], h = s.hero;
    const heroIn = pb.kind === 'attack' ? m.hero : G.heroAvailable(cid);
    const esc = !!(res.objetivo && res.objetivo.tipo === 'escapar' && res.objetivo.fin && res.objetivo.cumplido), win = res.winner === 0 && !esc, out = { win: win, kind: pb.kind, city: cid, dead: res.dead, lines: [] }; let dHer = null;   // CG4b: dHer = ciudad donde quedan tus heridos
    const copL = G.copiaActualiza(pb, m, res, pb.kind === 'attack' ? c.owner : m.owner); for (const x of copL) out.lines.push(x);
    s.stats.battles++; if (win) s.stats.wins++; if (win && pb.kind === 'attack' && D.SENADO.sala) { G.senadoVictoria(m); out.sinTriunfo = !!m.sinTriunfo; } s.stats.kills += res.dead[1]; s.stats.lost += res.dead[0];
    if (pb.kind === 'attack') {
      if (win && m.mision === 'saqueo') {
        const loot = G.botin(cid), home = s.cities[m.from].owner === 'roma' ? m.from : G.capital();
        for (const r of D.RES) { s.res[r] += loot[r]; apunta(cid, r, loot[r], 'botin'); }
        merge(s.cities[home].units, keep(res.surv[0], res.lost[0], 1, gTuyo(res))); dHer = home; c.units = keep(res.surv[1], res.lost[1], 1, 0.3); c.saqueada = s.t;
        if (m.hero) { h.city = home; h.march = null; }
        G.vetCuenta(home); out.saqueo = true; out.lines.push('💰 Saqueo de ' + d.n + ': ' + D.RES.map(r => '+' + loot[r] + ' ' + D.RES_ICON[r]).join(' ') + '.', 'Tus tropas vuelven a ' + D.CITIES[home].n + '; la ciudad sigue siendo de ' + D.FACTIONS[c.owner].n + '.');
        G.log('💰 Saqueada ' + d.n + ' sin conquistarla.', 'good');
      } else if (win) {
        const prev = D.FACTIONS[c.owner].n;
        DIP.conquista(s, c.owner); incorporar(c, keep(res.surv[0], res.lost[0], 1, gTuyo(res)), true); dHer = cid;
        c.b.muralla = Math.max(0, (c.b.muralla || 0) - 1); G.vetCuenta(cid); out.conquista = true;
        if (D.SENADO.sala) G.senadoActo('tomada', cid);   // CE6
        if (m.hero) { h.city = cid; h.march = null; }
        const loot = Math.round(150 * (c.w || d.w) * (1 + 0.1 * h.sk.log));
        for (const r of D.RES) { const bq = r === 'materiales' ? 2 * loot : loot; s.res[r] += bq; apunta(cid, r, bq, 'botin'); }   // CE2: materiales = madera + piedra de antes
        out.lines.push('🏛️ ' + d.n + ' es ahora romana.', '💰 Botín: +' + loot + ' de cada recurso.');
        G.log('🏆 ¡' + d.n + ' conquistada a ' + prev + '!', 'good');
        if (cid === G.capitalRival() && !G.campanaLarga()) terminar(true, textoFinal('gana', { anio: G.yearOf(s.t) }));   // CDe4: en la campaña larga tomar Cartago ya no acaba la partida: es un hito del camino de las armas (js/caminos.js)
      } else {
        merge(s.cities[m.from].owner === 'roma' ? s.cities[m.from].units : s.cities[G.capital()].units, keep(res.surv[0], res.lost[0], 0.7, 0)); G.vetCuenta(s.cities[m.from].owner === 'roma' ? m.from : G.capital());
        c.units = keep(res.surv[1], res.lost[1], 1, 0.3);
        if (m.hero) { h.city = s.cities[m.from].owner === 'roma' ? m.from : G.capital(); h.march = null; }
        if (esc) out.lines.push('🦅 ' + h.name + ' escapó del campo.');
        out.lines.push('Los supervivientes se retiran a ' + D.CITIES[m.from].n + '.');
        G.log('💀 Derrota ante los muros de ' + d.n + '.', 'bad');
      }
    } else {
      if (win) {
        c.units = keep(res.surv[0], res.lost[0], 1, gTuyo(res)); dHer = cid; G.vetCuenta(cid);
        out.lines.push('🛡️ ' + d.n + ' resiste.');
        G.log('🛡️ ' + d.n + ' rechaza el ataque de ' + D.FACTIONS[m.owner].n + '.', 'good');
      } else if (m.mision === 'saqueo') {
        const esc = D.ESCONDITE * (c.b.almacen || 0), rob = {};
        for (const r of D.RES) { const tot = s.res[r] + s.alm[r]; rob[r] = Math.round(Math.max(0, Math.min(D.SAQUEO_ROBO * tot, tot - esc))); const dc = Math.min(rob[r], Math.max(0, s.res[r])); s.res[r] -= dc; s.alm[r] = Math.max(0, s.alm[r] - (rob[r] - dc)); }   // primero se lleva la caja; el almacén esconde parte
        c.units = keep(res.surv[0], res.lost[0], 1, 0.3); G.vetCuenta(cid); arrabalSaqueado(c, m, res, out);
        out.saqueo = true; out.lines.push('🔥 ' + D.FACTIONS[m.owner].n + ' saquea ' + d.n + ' y se marcha: ' + D.RES.map(r => '-' + rob[r] + ' ' + D.RES_ICON[r]).join(' ') + '.', 'Cada almacén esconde ' + D.ESCONDITE + ' de cada recurso.');
        G.log('🔥 ' + d.n + ' ha sido saqueada por ' + D.FACTIONS[m.owner].n + '.', 'bad');
      } else {
        arrabalSaqueado(c, m, res, out);
        soltarCiudad(c); c.owner = m.owner; c.units = keep(res.surv[1], res.lost[1], 1, 0.3); c.obras.length = 0; c.train = []; c.puertas = false; c.vetB = 0;
        out.lines.push('🔥 ' + d.n + ' ha caído en manos de ' + D.FACTIONS[m.owner].n + '.');
        G.log('🔥 ' + d.n + ' ha caído ante ' + D.FACTIONS[m.owner].n + '.', 'bad');
        if (cid === G.capital()) terminar(false, G.modo() ? textoFinal('pierde', { anio: G.yearOf(s.t), rival: D.FACTIONS[m.owner].n }) : 'Roma ha caído en ' + G.yearOf(s.t) + ' a.C. ante ' + D.FACTIONS[m.owner].n + '. Vae victis.');
        else if (h.city === cid) h.city = G.capital();
        // las marchas propias hacia la ciudad perdida se convierten en ataques al llegar (ya lo gestiona tick)
      }
    }
    if (heroIn) {
      const before = h.lvl; addXp(res.dead[1] / 4 * (win ? 1.5 : 0.7) + 10);
      out.lines.push('🦅 ' + h.name + ' gana experiencia' + (h.lvl > before ? ' y sube al nivel ' + h.lvl + '.' : '.'));
      if (res.genDead[0] && !esc) { const mw = Math.max(6, 24 + G.invSum('herida')); h.wound = s.t + mw; out.lines.push('🩸 ' + h.name + ' ha sido herido: ' + G.estTxt(G.estaciones(mw)) + ' de convalecencia.'); G.log('🩸 ' + h.name + ' cae herido en combate.', 'bad'); }
    }
    if (res.nueva) {   // NB7: prisioneros, triunfo y el tribuno que mandaba
      if (win && res.prisioneros > 0) cautivos(res.prisioneros, cercaDeCiudad(cid), out);   // CG4b: los heridos del vencido son cautivos: esclavos o venta
      if (win && res.heridos) heridosA(dHer, res.heridos[0], out);
      if (!win && res.cautivos > 0) out.lines.push('⛓️ ' + res.cautivos + (res.cautivos === 1 ? ' herido tuyo cae prisionero.' : ' heridos tuyos caen prisioneros.'));
      if (win && res.dead[1] >= D.TRIUNFO.bajas && res.dead[0] * D.TRIUNFO.ratio < res.dead[1]) { G.favorAplica(4, 6); out.triunfo = true; out.lines.push('🎺 ¡Gran victoria! Roma pide un triunfo: sube el favor del Senado y del pueblo.'); }
    }
    if (m.tribuno != null && s.tribunos) {
      const i = s.tribunos.findIndex(t => t.id === m.tribuno);
      if (i >= 0 && res.tribunoMuerto) { out.lines.push('💀 El tribuno ' + s.tribunos[i].n + ' ha caído al mando del ejército.'); G.log('💀 Muere el tribuno ' + s.tribunos[i].n + '.', 'bad'); s.tribunos.splice(i, 1); out.tribunoMuerto = true; }
    }
    if (out.triunfo || out.conquista) G.triunfoOfrece(d.n, out);   // CN16b: un triunfo por victoria, si el jugador lo paga
    if (win && pb.kind === 'attack' && res.nueva && s.stats.wins % NB.TRIB_VICT === 0) { const t = G.nombrarTribuno('ascenso'); if (t) out.lines.push('🦅 ' + t.n + ', centurión veterano, asciende a tribuno.'); }
    G.save();
    if (s.over) emit('over');
    return out;
  };

  /* ---------- NB7: batalla nueva (maniobra + choque) conectada con la campaña, y tribunos-generales ----------
     Tú eres el César. Cada ejército que no lleva al héroe necesita un tribuno al mando (s.tribunos), así que hay un máximo de
     ejércitos a la vez. Un tribuno nuevo lo nombra el Senado con favor alto o asciende de un regimiento veterano tras varias victorias;
     si cae en el choque, se pierde. La lógica de aquí corre en Node: la pantalla (ui.js) solo enlaza UIManiobra y UIBatalla2 con estas funciones. */
  const NB = { MANIOBRA: 600, TRIPLE: 3, TRIB_MAX: 8, TRIB_FAVOR: 65, TRIB_MESES: 12, TRIB_VICT: 4 };
  G.NB = NB;
  const TRIB_INI = [['Quinto Fabio', 'prudente'], ['Marco Claudio', 'agresivo'], ['Cayo Lelio', 'astuto'], ['Publio Cornelio', 'agresivo']];
  const TRIB_NOM = ['Lucio Emilio', 'Tito Manlio', 'Gneo Servilio', 'Aulo Atilio', 'Marco Minucio', 'Sexto Julio', 'Cayo Flaminio', 'Quinto Cecilio', 'Publio Sulpicio', 'Lucio Postumio'], TRIB_CAR = ['prudente', 'agresivo', 'astuto'];
  const BAT = () => root.Battle || (typeof require !== 'undefined' ? require('./battle.js').Battle : null);
  const MAN = () => root.Maniobra || (typeof require !== 'undefined' ? require('./maniobra.js') : null);
  G.migrarTribunos = function (s) {
    if (!s) return;
    if (!Array.isArray(s.tribunos)) { s.tribunos = TRIB_INI.map((x, i) => ({ id: i + 1, n: x[0], car: x[1], vet: 0 })); s.tribSeq = TRIB_INI.length + 1; s.tribNom = Math.floor(s.t || 0); }
    if (!(s.tribSeq > 0)) s.tribSeq = s.tribunos.reduce((a, t) => Math.max(a, t.id), 0) + 1; if (s.tribNom === undefined) s.tribNom = Math.floor(s.t || 0);
    const ocu = new Set((s.marches || []).concat((s.pending || []).map(p => p.m)).filter(m => m && m.tribuno != null).map(m => m.tribuno));
    for (const m of s.marches || []) if (m.owner === 'roma' && !m.hero && !m.colonos && m.tribuno == null) { const t = s.tribunos.find(x => !ocu.has(x.id)); if (t) { m.tribuno = t.id; ocu.add(t.id); } }   // partida vieja: marchas en curso
  };
  // los tribunos con su estado: libre (puede mandar un ejército) u ocupado
  G.tribunos = function () {
    const s = G.state; G.migrarTribunos(s); const ocu = new Set((s.marches || []).concat((s.pending || []).map(p => p.m)).filter(m => m && m.tribuno != null).map(m => m.tribuno));
    return s.tribunos.map(t => Object.assign({}, t, { libre: !ocu.has(t.id) }));
  };
  G.tribunoLibre = () => G.tribunos().find(t => t.libre) || null;
  G.maxEjercitos = () => { const s = G.state; G.migrarTribunos(s); return s.tribunos.length + 1; };   // los tribunos más el César con el héroe
  G.nombrarTribuno = function (motivo) {
    const s = G.state; G.migrarTribunos(s); if (s.tribunos.length >= NB.TRIB_MAX) return null;
    const id = s.tribSeq++, t = { id, n: TRIB_NOM[(id - 1) % TRIB_NOM.length], car: TRIB_CAR[(id - 1) % 3], vet: motivo === 'ascenso' ? 1 : 0 };
    s.tribunos.push(t); s.tribNom = Math.floor(s.t + 1e-9);
    G.log(motivo === 'ascenso' ? '🦅 ' + t.n + ', centurión veterano, asciende a tribuno (' + t.car + ').' : '🏛️ El Senado nombra tribuno a ' + t.n + ' (' + t.car + ').', 'good');
    return t;
  };
  // cada cierre de mes (desde senadoMes): con favor alto del Senado y pasado un año desde el último nombramiento, llega un tribuno
  G.tribunosMes = function () {
    const s = G.state; G.migrarTribunos(s);
    if (s.favor && s.favor.senado >= NB.TRIB_FAVOR && s.tribunos.length < NB.TRIB_MAX && Math.floor(s.t + 1e-9) - s.tribNom >= NB.TRIB_MESES) G.nombrarTribuno('senado');
  };

  const hombres = u => { let n = 0; for (const k in u) n += u[k]; return n; };
  // cómo se resuelve esta batalla: 'sola' (un bando triplica al otro) | 'maniobra' (más de 600 hombres) | 'directo' (escaramuza: al choque)
  G.planBatalla = function (info) {
    const sd = info.cfg.sides, a = hombres(sd[0].units), b = hombres(sd[1].units);
    if (Math.min(a, b) * NB.TRIPLE <= Math.max(a, b)) return { modo: 'nueva', via: 'sola', a, b, texto: a > b ? 'Tu ejército triplica al enemigo: la batalla se resuelve sola.' : 'El enemigo triplica a tu ejército: la batalla se resuelve sola.' };
    return { modo: 'nueva', via: a + b > NB.MANIOBRA ? 'maniobra' : 'directo', a, b };
  };
  const carEnem = cfg => { const Bt = BAT(); let c = 'equilibrado'; try { if (Bt) c = Bt.caracterDe(cfg); } catch (e) { /* sin carácter */ } return ['equilibrado', 'astuto', 'impetuoso', 'prudente'].includes(c) ? c : 'equilibrado'; };
  const PLAN_CAR = { equilibrado: 'centro', astuto: 'emboscar', impetuoso: 'centro', prudente: 'cerro' };
  // cfg de Maniobra.crear: una legión por bando (dos si pasa de 800 hombres)
  G.cfgManiobra = function (info) {
    const sd = info.cfg.sides, car = carEnem(info.cfg);
    const legs = (u, nom) => { const n = hombres(u) >= 800 ? 2 : 1, r = []; for (let i = 0; i < n; i++) { const x = {}; for (const k in u) { const q = n === 1 ? u[k] : (i === 0 ? Math.floor(u[k] / 2) : u[k] - Math.floor(u[k] / 2)); if (q > 0) x[k] = q; } if (hombres(x)) r.push({ nombre: n === 1 ? nom : nom + ' ' + ['I', 'II'][i], units: x }); } return r; };
    return { ciudad: info.city, zona: info.campo ? D.ZONA_CAMPO[info.campo.rasgo] : undefined, semilla: info.cfg.seed, defensor: info.cfg.defender, bandos: [{ nombre: sd[0].name, car: 'equilibrado', plan: 'centro', legiones: legs(sd[0].units, sd[0].tribuno ? 'Legión de ' + sd[0].tribuno.n.split(' ')[1] : 'Legión') }, { nombre: sd[1].name, car, plan: PLAN_CAR[car], legiones: legs(sd[1].units, 'Ejército') }] };
  };
  /* CG4b: el choque de la campaña es el simulador de manípulos (js/simulador.js), el mismo de Escaramuzas: «Jugar en vivo», «Batalla rápida»
     o «Resolver». Los datos de cada tropa salen de js/tropas.js con el pueblo de cada bando; las tácticas de la época (TH1) van siempre. */
  const SIM = () => root.Simulador || (typeof require !== 'undefined' ? require('./simulador.js') : null);
  let _TRO = null;
  const TRO = () => { if (root.Tropas) return root.Tropas; if (!_TRO && typeof require !== 'undefined') { try { _TRO = require('./tropas.js'); } catch (e) { _TRO = false; } } return _TRO || null; };
  // el pueblo de js/tropas.js de una facción (roma, cartago, epiro, macedonia, galos, iberos); otra facción: null (datos base de la tropa)
  G.puebloDe = f => { const T = TRO(); return T && T.PUEBLO && Object.hasOwn(T.PUEBLO, f) ? f : null; };
  // la facción del bando rival de una batalla (battleInfo la apunta en sides[1].fac; si no, por el nombre)
  const facRival = info => { const sd = info.cfg.sides[1] || {}; if (D.FACTIONS[sd.fac]) return sd.fac; return Object.keys(D.FACTIONS).find(f => D.FACTIONS[f].n === sd.name) || null; };
  // el paisaje del simulador (llano, colina, bosque o mixto) desde el terreno de la batalla
  const CAMPO_SIM = { llano: 'llano', colina: 'colina', cerro: 'colina', loma: 'colina', bosque: 'bosque', mixto: 'mixto', rio: 'llano', pantano: 'mixto' };
  // cfg de Simulador.crear (y de UIMando / UIBatallaRapida). ch = choque de la maniobra (sus ejércitos) o null (los de la ciudad)
  /* Los modificadores de la campaña (sides[b].atkMul, defMul y mor: héroe, forja, ciencia, murallas, dioses, copia del rival) pasan al simulador
     como cfg.mods (licencia de juego, ver kMod en js/simulador.js). Levas bisoñas (sides[b].bis, fracción 0–1): atk × (1 − 0,3 × bis), el mismo
     criterio que el poder de un bando en js/battle.js. bono0 (al delegar): atk del bando 0 × bono0. El tribuno de campaña manda el centro romano. */
  /* CG4c: la muralla del que defiende multiplica su defensa por 1 + 0,1 × nivel, como en js/battle.js (licencia de juego; CG4b no la pasaba) */
  const modsDe = (sd, bono0, cfg) => [0, 1].map(b => { const x = sd[b] || {}, muro = cfg && cfg.defender === b ? 1 + 0.1 * Math.max(0, cfg.wall || 0) : 1; return { atk: (x.atkMul || 1) * (1 - 0.3 * Math.max(0, Math.min(1, x.bis || 0))) * (b === 0 && bono0 > 0 ? bono0 : 1), def: (x.defMul || 1) * muro, mor: x.mor || 0 }; });
  G.cfgSim = function (info, ch, bono0) {
    const sd = info.cfg.sides, ej = [0, 1].map(b => { const u = Object.assign({}, ch && ch.sides && ch.sides[b] ? ch.sides[b].units : sd[b].units); for (const k in u) if (!(u[k] > 0)) delete u[k]; return u; });
    const fac = facRival(info), Bt = BAT();
    ej.pueblos = [G.puebloDe('roma'), G.puebloDe(fac)];
    const ter = info.campo ? (D.TERRENO_CAMPO[info.campo.rasgo] || 'llano') : (info.cfg.terreno || (Bt && Bt.terrenoDe ? Bt.terrenoDe(info.city, info.cfg.seed) : 'llano'));
    const cfg = { semilla: (info.cfg.seed >>> 0) || 7, ejercitos: ej, campo: CAMPO_SIM[ter] || 'llano', col: (D.FACTIONS[fac] || {}).col || sd[1].col, tacticas: true, pueblo: 'roma', fac, mods: modsDe(sd, bono0, info.cfg) };
    const tr = sd[0].tribuno, Z = SIM(); if (tr && tr.car && Z && Z.TRIBUNOS) { const t0 = Z.TRIBUNOS.map(x => Object.assign({}, x)); t0[1] = { n: tr.n || t0[1].n, car: tr.car }; cfg.tribunos = [t0, Z.JEFES.map(x => Object.assign({}, x))]; }
    return cfg;
  };
  // el estado inicial del choque (JSON puro: se guarda y se carga)
  G.estadoGuerra = (info, ch, bono0) => SIM().crear(G.cfgSim(info, ch, bono0));
  // juega el estado S hasta el final: deciden los tribunos de los dos bandos (como «Resolver»). Devuelve S
  G.jugarGuerra = function (S) { SIM().avanzar(S, Math.max(0, S.limite - S.t) + 1); return S; };
  /* ES1 «Escaramuzas»: los dos ejércitos de una batalla suelta, sin campaña ni guardado. No toca el estado de la partida.
     Roma: una legión manipular en las proporciones de Polibio 6.21 (hastati y príncipes iguales, triarios la mitad, vélites
     delante, un puñado de équites; Polibio 6.21, sin cotejar). El enemigo: la mezcla de tropas de las guarniciones de esa facción en D.CITIES (la misma
     tabla de la campaña, con su dictamen). Tamaños y dificultad (el enemigo trae más o menos hombres): licencia de juego.
     El «mediano» es la maqueta de la guerra (360 hastati frente a 2 160 infantes enemigos), que es lo que el motor da por parejo. */
  G.ESCARAMUZA = {
    tamanos: { pequeno: { n: 'Pequeño', k: 0.5 }, mediano: { n: 'Mediano', k: 1 }, grande: { n: 'Grande', k: 2 } },
    facciones: ['cartago', 'epiro', 'macedonia', 'galos', 'iberos'],
    campos: { llano: 'Llano', colina: 'Colina', bosque: 'Bosque', mixto: 'Mixto' },
    dificultad: { facil: { n: 'Fácil', k: 0.8 }, normal: { n: 'Normal', k: 1 }, dificil: { n: 'Difícil', k: 1.2 } }
    /* CG4b (pase de CG9): sin tabla de ajuste por facción; los precios por tropa y pueblo de js/tropas.js igualan la pelea. op.ajuste sigue como opción */
  };
  G.escaramuza = function (op) {
    op = op || {}; const E = G.ESCARAMUZA, km = (E.tamanos[op.mio] || E.tamanos.mediano).k;
    const fac = E.facciones.includes(op.fac) ? op.fac : 'cartago', te = E.tamanos[op.ene] ? op.ene : 'mediano';
    const aj = op.ajuste != null ? op.ajuste : 1, ke = E.tamanos[te].k * aj * (E.dificultad[op.dif] || E.dificultad.normal).k;
    const roma = { hastati: Math.round(360 * km), principes: Math.round(360 * km), triarii: Math.round(180 * km), velites: Math.round(240 * km), equites: Math.round(60 * km) };
    const plan = {}; for (const id in D.CITIES) if (D.CITIES[id].f === fac) for (const t in D.CITIES[id].g) plan[t] = (plan[t] || 0) + D.CITIES[id].g[t];
    let pie = 0; for (const t in plan) if (D.UNITS[t] && D.UNITS[t].cls !== 'cav' && D.UNITS[t].cls !== 'ele') pie += plan[t];
    const f = pie > 0 ? 2160 * ke / pie : 0, ene = {};
    for (const t in plan) { const q = Math.round(plan[t] * f); if (q > 0) ene[t] = q; else if (plan[t] > 0 && D.UNITS[t] && D.UNITS[t].cls === 'ele') ene[t] = 1; }
    const semilla = op.semilla != null ? op.semilla >>> 0 : (Math.random() * 1e9) >>> 0;
    return { semilla, campo: E.campos[op.campo] ? op.campo : 'llano', fac, ejercitos: [roma, ene] };
  };
  // la partida a medias de la batalla (clave aparte en localStorage): sobrevive a recargar la página. clave = la batalla pendiente a la que pertenece
  const GUERRA_KEY = 'aqvila-guerra-v1';
  const claveGuerra = info => [info.city, info.cfg.seed, info.kind].join('|');
  G.guardarGuerra = function (info, S, estM) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(GUERRA_KEY, JSON.stringify({ clave: claveGuerra(info), S: SIM().guardar(S), estM: estM || null })); } catch (e) { /* almacenamiento no disponible */ } };   // CG4b: el estado del simulador
  G.guerraGuardada = function (info) { try { if (typeof localStorage === 'undefined') return null; const x = JSON.parse(localStorage.getItem(GUERRA_KEY)); if (!x || x.clave !== claveGuerra(info)) return null; if (typeof x.S !== 'string') { G.borrarGuerra(); return null; } const S = SIM().cargar(x.S); return S && Array.isArray(S.man) && S.fase !== 'fin' ? { estado: S, estM: x.estM || null } : null; } catch (e) { return null; } };   // un guardado viejo de la Guerra (con B) se descarta
  G.borrarGuerra = function () { try { if (typeof localStorage !== 'undefined') localStorage.removeItem(GUERRA_KEY); } catch (e) { /* nada que borrar */ } };
  // bajas por deserción u hombres perdidos en la maniobra: lo que había al empezar menos lo que queda en las legiones
  function bajasManiobra(info, e) {
    const l = [{}, {}]; if (!e) return l;
    for (let b = 0; b < 2; b++) { const q = {}; e.bandos[b].legiones.forEach(L => { for (const k in L.units) q[k] = (q[k] || 0) + L.units[k]; }); (e.bandos[b].retirados || []).forEach(L => { for (const k in (L.units || {})) q[k] = (q[k] || 0) + L.units[k]; }); for (const k in info.cfg.sides[b].units) { const d = info.cfg.sides[b].units[k] - (q[k] || 0); if (d > 0) l[b][k] = d; } }
    return l;
  }
  function forma(info, lost, extra) {
    const sd = info.cfg.sides, surv = [{}, {}], dead = [0, 0];
    for (let b = 0; b < 2; b++) { for (const k in sd[b].units) { const q = Math.max(0, Math.min(sd[b].units[k], Math.round(lost[b][k] || 0))); if (q > 0) lost[b][k] = q; else delete lost[b][k]; dead[b] += q; if (sd[b].units[k] - q > 0) surv[b][k] = sd[b].units[k] - q; } for (const k in lost[b]) if (!(k in sd[b].units)) delete lost[b][k]; }
    return Object.assign({ dead, lost, surv, genDead: [false, false], nueva: true, prisioneros: 0 }, extra);
  }
  // resultado del choque nuevo en la forma que espera applyBattle (bajas, supervivientes, general, prisioneros)
  /* r2 = Simulador.resumen(S): por fila bando, tipo, bajas, heridos, muertos, prisioneros, recuperados. Ojo: el ganador ya recupera a sus heridos dentro de n.
     CG4b: si ganas, tus heridos (recuperados) salen de los supervivientes y van a res.heridos[0] (vuelven mes a mes); los heridos del vencido son
     res.prisioneros (cautivos). Si pierdes, tus heridos caen prisioneros (res.cautivos): ya cuentan en las bajas. */
  G.resultadoNueva = function (info, r2, estM) {
    const lost = bajasManiobra(info, estM), sd = info.cfg.sides, gana = r2.ganador === 0, her = [{}, {}]; let pris = 0, caut = 0, conFila = false;
    for (const x of r2.bajas) {
      if (x.bajas > 0) lost[x.bando][x.tipo] = (lost[x.bando][x.tipo] || 0) + x.bajas;
      if (x.prisioneros === undefined) continue; conFila = true;
      if (gana && x.bando === 0 && x.recuperados > 0) her[0][x.tipo] = (her[0][x.tipo] || 0) + x.recuperados;
      if (gana && x.bando === 1) pris += x.prisioneros || 0;
      if (!gana && x.bando === 0) caut += x.prisioneros || 0;
    }
    const murio = !!(r2.general && !r2.general.vivo), conGen = !!(sd[0].gen || sd[0].tribuno);
    const res = forma(info, lost, { winner: r2.ganador, genDead: [murio && !!sd[0].gen, false], tribunoMuerto: murio && !sd[0].gen && !!sd[0].tribuno, prisioneros: gana ? (conFila ? pris : r2.prisioneros | 0) : 0, conGen });
    if (conFila) {   // los heridos que vuelven no están en filas: se quitan de los supervivientes
      for (const k in her[0]) { const q = Math.min(her[0][k], res.surv[0][k] || 0); if (q > 0) { her[0][k] = q; res.surv[0][k] -= q; if (!(res.surv[0][k] > 0)) delete res.surv[0][k]; } else delete her[0][k]; }
      res.heridos = her; res.cautivos = caut;
    }
    return res;
  };
  // maniobra que termina sin choque: rendición o retirada de un bando
  G.resultadoManiobra = function (info, e) {
    const f = e.fin || {}, b = f.bando == null ? 0 : f.bando, lost = bajasManiobra(info, e); let pris = 0;
    if (f.tipo === 'rendicion') { e.bandos[b].legiones.forEach(L => { for (const k in L.units) lost[b][k] = (lost[b][k] || 0) + L.units[k]; }); if (b === 1) pris = Math.round(hombres(e.bandos[1].legiones.reduce((q, L) => { for (const k in L.units) q[k] = (q[k] || 0) + L.units[k]; return q; }, {})) * 0.5); }
    return forma(info, lost, { winner: 1 - b, prisioneros: pris, sinChoque: f.tipo || 'retirada' });
  };
  // Resuelve toda la batalla sin pantalla con el bot (campaña de pruebas y «Delegar»): maniobra si toca y choque. opt.bono0: el bando 0 rinde menos al delegar
  G.jugarNueva = function (info, opt) {
    opt = opt || {}; const plan = G.planBatalla(info), M = MAN(), sem = info.cfg.seed | 0;
    let estM = null, ch = null;
    if (plan.via === 'maniobra') {
      const cfg = G.cfgManiobra(info); cfg.bandos[0].ia = true; let e = M.crear(cfg);
      for (let i = 0; i < 12 && !e.terminado; i++) { const c = M.consejoDia(e, 0), f = c.filter(x => x.etiqueta === 'Favorable').sort((x, y) => y.puntos - x.puntos)[0] || c.filter(x => x.etiqueta === 'Dudoso').sort((x, y) => y.puntos - x.puntos)[0]; e = M.resolverDia(M.moverDia(e, f ? f.ordenes : [], 0), sem * 7 + i).estado; }
      estM = e; if (!(e.fin && e.fin.tipo === 'choque')) return G.resultadoManiobra(info, e); ch = e.choque;
    }
    const S = G.jugarGuerra(G.estadoGuerra(info, ch, opt.bono0));   // CG4b: deciden los tribunos; al delegar (bono0 < 1) tu bando golpea algo menos
    return G.resultadoNueva(info, SIM().resumen(S), estM);
  };
  // Resuelve la batalla pendiente sin pantalla (bot): la forma de res sirve a applyBattle
  G.resolverPendiente = function () {
    const s = G.state, info = G.battleInfo(s.pending[0]), plan = G.planBatalla(info); let res;
    res = G.jugarNueva(info, { bono0: plan.via === 'sola' ? 1 : 0.92 });
    return { info, plan, out: G.applyBattle(res) };
  };

  /* ---------- GM15b: toparse en el camino (campaña) ----------
     Dos marchas enemigas por el mismo camino de TIERRA en sentidos contrarios que se cruzan luchan allí: batalla `kind: 'campo'` con la ficha
     `campo: { camino, punto, rasgo, nombre, hora, niebla, emboscada, semilla, … }` (D.SITIOS manda por el sitio más cercano; sin sitio cerca, llano).
     Por mar no. El que pierde vuelve a su ciudad de salida; el que gana sigue su marcha con retraso (D.CAMPO.retraso).
     «Salir al encuentro»: ante un enemigo que marcha sobre una ciudad tuya, eliges un sitio de su camino y tu ejército sale a esperarlo allí.
     «Apostar»: ese ejército, parado en un sitio de bosque o loma, se esconde (dura hasta que se mueva o D.CAMPO.apostar meses); el enemigo que pasa lo
     descubre con probabilidad D.CAMPO.descubre (más si lleva buena caballería); si no lo descubre, hay emboscada (campo.emboscada = true).
     Hora: la elige quien lleva la iniciativa (si el ajuste hora es «elijo»), si no sale al azar; niebla solo con río y otoño o invierno; noche solo en emboscadas.
     Río y nadie cruza: no hay batalla (cada uno sigue su camino); la batalla de hoy usa solo el terreno que ya sabe dibujar. La hora y la niebla se guardan
     y se enseñan en el cartel, pero NO cambian el combate todavía. Todas las cifras: licencia de juego. battle.js no sabe nada de esto. */
  const rngCampo = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const progM = (m, t) => { const d = m.t1 - m.t0; return d > 1e-9 ? Math.max(0, Math.min(1, (t - m.t0) / d)) : 1; };   // fracción recorrida de su camino
  const hombresM = u => { let n = 0; for (const k in (u || {})) n += u[k] > 0 ? u[k] : 0; return n; };
  G.horaAjuste = () => { const s = G.state, a = s && s.ajustes; return a && a.hora === 'azar' ? 'azar' : 'elijo'; };
  // ¿puede haber niebla aquí? Solo junto a un río y en otoño o invierno
  G.nieblaPosible = (sitio, t) => { const e = G.estacion(t); return !!sitio && sitio.r === 'rio' && (e === 'Otoño' || e === 'Invierno'); };
  /* La ficha de campo de un encuentro. o: { semilla, t, emboscada, iniciativa (el jugador la lleva), hora (la que pide el jugador) } */
  G.fichaCampo = function (c, punto, o) {
    o = o || {}; const st = D.sitioCerca(c, punto), rasgo = st ? st.r : 'llano', rng = rngCampo(o.semilla | 0), A = D.CAMINOS[c - 1];
    const nieblaOk = G.nieblaPosible(st, o.t === undefined ? G.state.t : o.t);
    let hora = null, niebla = false;
    if (o.iniciativa && G.horaAjuste() === 'elijo' && o.hora) {
      if (o.hora === 'niebla') { if (nieblaOk) { hora = 'amanecer'; niebla = true; } }
      else if (o.hora === 'noche') { if (o.emboscada) hora = 'noche'; }
      else if (D.HORAS[o.hora]) hora = o.hora;
    }
    if (!hora) { const r = rng(); hora = r < 0.25 ? 'amanecer' : r < 0.7 ? 'mediodia' : 'atardecer'; }
    if (!niebla && nieblaOk && hora === 'amanecer' && rng() < D.CAMPO.niebla) niebla = true;
    return { camino: c, punto: Math.round(punto * 1000) / 1000, rasgo: rasgo, sitio: st ? st.id : null, nombre: st ? st.n : 'Camino de ' + D.CITIES[A[0]].n + ' a ' + D.CITIES[A[1]].n,
      hora: hora, niebla: niebla, emboscada: !!o.emboscada, semilla: o.semilla | 0, t: o.t === undefined ? G.state.t : o.t };
  };
  const caballeria = u => { let c = 0, n = 0; for (const k in u) { n += u[k]; if (D.UNITS[k] && D.UNITS[k].cls === 'cav') c += u[k]; } return n > 0 && c / n >= D.CAMPO.cab; };
  function crearCampo(r, e, cm, punto, t, o) {
    const s = G.state; o = o || {};
    for (const x of [r, e]) { const i = s.marches.indexOf(x); if (i >= 0) s.marches.splice(i, 1); }
    const semilla = (Math.floor(t * 1000) + r.id * 31 + e.id * 17) | 0, rng = rngCampo(semilla ^ 0x5bd1e995);
    let emb = false;
    if (o.apostado) { const desc = rng() < (caballeria(e.units) ? D.CAMPO.descubre.conCab : D.CAMPO.descubre.sinCab); emb = !desc; if (desc) G.log('👁️ ' + D.FACTIONS[e.owner].n + ' descubre a tu ejército apostado.', 'bad', true); }
    const K = G.fichaCampo(cm.c, punto, { semilla: semilla, t: t, emboscada: emb, iniciativa: !!o.iniciativa, hora: o.hora });
    K.defensor = o.sitio ? 0 : 1; K.emboscador = emb ? 0 : null;
    s.pending.push({ kind: 'campo', m: r, e: e, campo: K, pm: progM(r, t), pe: progM(e, t) });
    G.log('⚔️ Tus tropas y ' + D.FACTIONS[e.owner].n + ' se topan en el camino: ' + K.nombre + (emb ? ' (emboscada)' : '') + '.', 'bad');
    return K;
  }
  // el ejército vuelve a su ciudad (o a la capital si la de salida ya no es tuya)
  function aCasa(m) {
    const s = G.state, i = s.marches.indexOf(m); if (i >= 0) s.marches.splice(i, 1);
    const home = s.cities[m.from] && s.cities[m.from].owner === 'roma' ? m.from : G.capital();
    merge(s.cities[home].units, m.units); if (m.hero) { s.hero.city = home; s.hero.march = null; }
    return home;
  }
  // el ganador sigue su marcha desde donde luchó, con retraso
  function reanuda(m, pr) {
    const s = G.state, d0 = Math.max(1e-6, m.t1 - m.t0), t1 = llegada(s.t + (1 - pr) * d0 + D.CAMPO.retraso), d = pr < 1 - 1e-6 ? (t1 - s.t) / (1 - pr) : t1 - s.t;
    m.t0 = s.t - pr * d; m.t1 = t1; s.marches.push(m);
  }
  // el momento (en meses) en que la marcha e pasa por el punto `punto` (0 a 1 desde el extremo 0 del camino)
  const tEnPunto = (e, cm, punto) => e.t0 + (cm.sentido > 0 ? punto : 1 - punto) * (e.t1 - e.t0);
  /* Cada vez que corre el tiempo y hay marchas en curso: ¿se topan? Lo llama G.tick antes de las llegadas. */
  const unEncuentro = function () {
    const s = G.state; if (!s || s.over) return false;
    // 1) ejércitos tuyos que esperan en un sitio: el enemigo que pasa por él (el que buscaban u otro del mismo camino) los encuentra
    for (const m of s.marches.filter(x => x.sitio)) {
      if (s.marches.indexOf(m) < 0) continue;
      const S = m.sitio, cmS = { c: S.c, sentido: 1 }; let mejor = null, tm = Infinity;
      for (const e of s.marches) {
        if (e === m || e.owner === 'roma' || e.colonos || e.sitio || !e.from || !hombresM(e.units)) continue;
        const ce = D.caminoDe(e.from, e.to); if (!ce || ce.c !== S.c) continue;
        const t = tEnPunto(e, ce, S.p); if (t >= S.tLlega - 1e-9 && t >= e.t0 - 1e-9 && t < tm) { tm = t; mejor = e; }
      }
      if (mejor && tm <= s.t + 1e-9) {
        const apost = m.postura === 'apostado' && D.CAMPO.apostables.includes(S.r) && tm >= S.tApuesta - 1e-9 && tm - S.tApuesta <= D.CAMPO.apostar + 1e-9;
        if (S.r === 'rio' && !apost && G.power(mejor.units) < D.CAMPO.rioCruza * G.power(m.units)) {   // río y nadie cruza: el enemigo, mucho más flojo, no fuerza el paso; no hay batalla y cada uno vuelve
          const i = s.marches.indexOf(mejor); if (i >= 0) s.marches.splice(i, 1);
          const eh = mejor.from && s.cities[mejor.from] && s.cities[mejor.from].owner === mejor.owner ? mejor.from : null; if (eh) merge(s.cities[eh].units, mejor.units);
          aCasa(m); G.log('🌊 Nadie cruza el ' + S.n + ': ' + D.FACTIONS[mejor.owner].n + ' da la vuelta y tu ejército vuelve a casa.', '', true); return true;
        }
        crearCampo(m, mejor, cmS, S.p, tm, { sitio: true, iniciativa: true, hora: S.hora, apostado: apost }); return true;
      }
      if (!mejor && !s.marches.some(x => x.id === S.contra)) { aCasa(m); G.log('Tu ejército vuelve a casa: el enemigo no pasó por ' + S.n + '.', '', true); return true; }
    }
    // 2) dos marchas enemigas por el mismo camino en sentidos contrarios que ya se han cruzado
    const R = s.marches.filter(m => m.owner === 'roma' && !m.colonos && !m.sitio && m.from && hombresM(m.units) > 0), E = s.marches.filter(m => m.owner !== 'roma' && !m.colonos && !m.sitio && m.from && hombresM(m.units) > 0);
    let cruce = null;
    for (const r of R) { const cr = D.caminoDe(r.from, r.to); if (!cr) continue;
      for (const e of E) {
        const ce = D.caminoDe(e.from, e.to); if (!ce || ce.c !== cr.c || ce.sentido === cr.sentido) continue;
        const dr = r.t1 - r.t0, de = e.t1 - e.t0; if (dr < 1e-9 || de < 1e-9) continue;
        const t = (1 + r.t0 / dr + e.t0 / de) / (1 / dr + 1 / de);   // los dos han recorrido entre ambos todo el camino
        if (t > s.t + 1e-9 || t < Math.max(r.t0, e.t0) - 1e-9) continue;
        const pr = (t - r.t0) / dr; if (pr < -1e-9 || pr > 1 + 1e-9) continue;
        if (!cruce || t < cruce.t) cruce = { r: r, e: e, cm: cr, t: t, punto: cr.sentido > 0 ? pr : 1 - pr };
      } }
    if (cruce) { crearCampo(cruce.r, cruce.e, cruce.cm, Math.max(0, Math.min(1, cruce.punto)), cruce.t, {}); return true; }
    return false;
  };
  G.encuentros = function () { for (let i = 0; i < 20 && unEncuentro(); i++); };
  // marchas enemigas que van sobre una ciudad tuya por camino de tierra, con los sitios donde puedes salir a esperarlas
  G.salidasPosibles = function (cid, conHero) {
    const s = G.state, r = [];
    for (const e of s.marches) {
      if (e.owner === 'roma' || e.colonos || e.sitio || e.to !== cid || !e.from || !s.cities[e.from] || !hombresM(e.units) || s.cities[cid].owner !== 'roma') continue;
      const ce = D.caminoDe(e.from, e.to); if (!ce) continue;
      const q = progM(e, s.t), sitios = D.sitiosDe(ce.c).map(st => {
        const f = ce.sentido > 0 ? st.p : 1 - st.p, tEnc = e.t0 + f * (e.t1 - e.t0), tLlega = s.t + G.travel(cid, e.from, !!conHero) * (1 - f);
        const ok = f > q + 1e-6 && tEnc > s.t + 1e-9 && tLlega <= tEnc + 1e-9;
        return { id: st.id, n: st.n, r: st.r, p: st.p, trigal: st.trigal, tEnc: tEnc, tLlega: tLlega, ok: ok, apostable: D.CAMPO.apostables.includes(st.r), motivo: ok ? '' : f <= q + 1e-6 || tEnc <= s.t + 1e-9 ? 'El enemigo ya ha pasado.' : 'No llegarías a tiempo.' };
      });
      r.push({ m: e, camino: ce.c, sitios: sitios, niebla: sitios.some(x => G.nieblaPosible(D.SITIOS[x.id], s.t)) });
    }
    return r;
  };
  /* Salir al encuentro: tu ejército sale de la ciudad `cid` (la que amenaza el enemigo `enemigoId`) y espera en el sitio. o: { apostar, hora } */
  G.salirAlEncuentro = function (enemigoId, sitioId, units, withHero, o) {
    const s = G.state; o = o || {}; G.sendMotivo = '';
    const e = s.marches.find(x => x.id === enemigoId), st = D.SITIOS[sitioId];
    const no = t => { G.sendMotivo = t; return false; };
    if (!e || !st) return no('Ese enemigo ya no marcha.');
    const cid = e.to, c = s.cities[cid], sp = (G.salidasPosibles(cid, withHero).find(x => x.m === e) || { sitios: [] }).sitios.find(x => x.id === sitioId);
    if (!c || c.owner !== 'roma' || !sp) return no('No se puede salir al encuentro de ese ejército.');
    if (!sp.ok) return no(sp.motivo);
    if (o.apostar && !sp.apostable) return no('Solo se puede apostar en un bosque o una loma.');
    const u = {}; let n = 0; for (const k in (units || {})) { const q = Math.min(Math.floor(units[k]), c.units[k] || 0); if (q > 0) { u[k] = q; n += q; } }
    if (withHero && !G.heroAvailable(cid)) withHero = false;
    if (n === 0) return no('No hay tropas que enviar.');
    let tr = null; if (!withHero) { tr = G.tribunoLibre(); if (!tr) return no('Todos tus tribunos mandan ya un ejército.'); }
    for (const k in u) { c.units[k] -= u[k]; if (c.units[k] <= 0) delete c.units[k]; }
    const m = { id: s.mid++, owner: 'roma', from: cid, to: e.from, units: u, hero: !!withHero, t0: s.t, t1: sp.tEnc,
      sitio: { id: sitioId, c: st.c, p: st.p, r: st.r, n: st.n, tLlega: sp.tLlega, tEnc: sp.tEnc, contra: e.id, tApuesta: Math.max(sp.tLlega, sp.tEnc - D.CAMPO.apostar), hora: o.hora || null } };
    if (o.apostar) m.postura = 'apostado';
    if (tr) m.tribuno = tr.id;
    if (withHero) { s.hero.city = null; s.hero.march = m.id; }
    s.marches.push(m); G.rutasRevisar();
    return true;
  };
  // Apostar: el ejército que espera en un sitio de bosque o loma se esconde hasta que se mueva o pasen D.CAMPO.apostar meses
  G.apostar = function (marchaId) {
    const s = G.state, m = s.marches.find(x => x.id === marchaId); G.sendMotivo = '';
    if (!m || !m.sitio || m.owner !== 'roma') { G.sendMotivo = 'Ese ejército no está en ningún sitio.'; return false; }
    if (!D.CAMPO.apostables.includes(m.sitio.r)) { G.sendMotivo = 'Solo se puede apostar en un bosque o una loma.'; return false; }
    m.postura = 'apostado'; m.sitio.tApuesta = Math.max(m.sitio.tLlega, s.t, m.sitio.tEnc - D.CAMPO.apostar); return true;
  };
  // Se mueve: el ejército deja el sitio y vuelve a su ciudad (deja de estar apostado)
  G.dejarElSitio = function (marchaId) {
    const s = G.state, m = s.marches.find(x => x.id === marchaId); if (!m || !m.sitio || m.owner !== 'roma') return false;
    delete m.postura; aCasa(m); return true;
  };
  G.migrarCampo = function (s) {
    if (!s) return; if (!Array.isArray(s.pending)) s.pending = []; if (!Array.isArray(s.marches)) s.marches = [];
    const vuelve = m => { if (!m || !m.units) return; const home = s.cities[m.from] && s.cities[m.from].owner === 'roma' ? m.from : (s.cities[G.capital()] ? G.capital() : null); if (home) { merge(s.cities[home].units, m.units); if (m.hero) { s.hero.city = home; s.hero.march = null; } } };
    // nada se descarta en silencio: una batalla de campo o un ejército en un sitio que no encajan devuelven sus tropas a su ciudad de salida
    s.pending = s.pending.filter(p => { if (!p) return false; if (p.kind !== 'campo' || (p.m && p.e && p.campo)) return true; if (p.m && p.m.owner === 'roma') vuelve(p.m); return false; });
    s.marches = s.marches.filter(m => { if (!m.sitio || (m.sitio.id && D.SITIOS[m.sitio.id])) return true; if (m.owner === 'roma') vuelve(m); return false; });
    for (const m of s.marches) if (m.postura && m.postura !== 'apostado') delete m.postura;
  };
  // datos de la batalla de campo para la pantalla y el motor: como battleInfo, pero contra otro ejército en marcha (sin ciudad ni muralla)
  G.battleInfoCampo = function (pb) {
    const s = G.state, m = pb.m, e = pb.e, K = pb.campo, h = s.hero, fa = G.forjaMul(s, 'armas'), fd = G.forjaMul(s, 'armaduras');
    const hm = { atkMul: (1 + 0.04 * h.sk.mando) * (s.mods.flex ? 1.1 : 1) * fa, defMul: (1 + 0.03 * h.sk.disc) * fd, mor: 4 * h.sk.disc }, noHero = { atkMul: (s.mods.flex ? 1.1 : 1) * fa, defMul: fd, mor: 0 };
    const heroIn = !!m.hero, me = Object.assign({ units: m.units, name: 'Roma', col: D.FACTIONS.roma.col, gen: heroIn ? { n: h.name, mando: h.sk.mando, disc: h.sk.disc, lvl: h.lvl } : null }, heroIn ? hm : noHero), g = e.gen;
    const foe = { units: e.units, fac: e.owner, name: D.FACTIONS[e.owner].n, col: D.FACTIONS[e.owner].col, gen: g, atkMul: g ? 1 + 0.04 * g.mando : 1, defMul: g ? 1 + 0.03 * g.disc : 1, mor: g ? 4 * g.disc : 0 };
    me.atkMul *= Math.min(D.SABER.techos.atk, G.invMul('atk')); me.mor += G.invSum('mor');
    { const k = G.copiaDe(e.owner); if (G.copiaBando(e.owner) && k > 0) { const V = G.cienciaGuerra(0, false), q = k * D.SABER.copia; foe.atkMul *= 1 + q * (V.atk - 1); foe.defMul *= 1 + q * (V.def - 1); foe.mor += q * V.mor; } }
    if (!heroIn && m.tribuno != null) { const t = (s.tribunos || []).find(x => x.id === m.tribuno); if (t) me.tribuno = { id: t.id, n: t.n, car: t.car }; }
    me.bis = G.fraccionBis(m.from); foe.bis = 0;
    const cfg = { sides: [me, foe], defender: K.defensor === 0 ? 0 : 1, wall: 0, seed: K.semilla, terreno: D.TERRENO_CAMPO[K.rasgo] || 'llano', campo: K };
    return { cfg: cfg, city: m.to, heroIn: heroIn, kind: 'campo', campo: K };
  };
  // aplica el resultado de una batalla de campo: el que pierde vuelve a su ciudad de salida, el que gana sigue (el ejército que esperaba en un sitio vuelve a casa)
  function aplicarCampo(res) {
    const s = G.state, pb = s.pending.shift(), m = pb.m, e = pb.e, K = pb.campo, h = s.hero;
    const win = res.winner === 0, out = { win: win, kind: 'campo', city: m.to, campo: K, dead: res.dead, lines: [] }; let dHer = null;   // CG4b: ciudad donde quedan tus heridos
    s.stats.battles++; if (win) s.stats.wins++; s.stats.kills += res.dead[1]; s.stats.lost += res.dead[0];
    const heroIn = !!m.hero, enNom = D.FACTIONS[e.owner].n; if (s.cities[m.from] && s.cities[m.from].owner === 'roma') G.vetCuenta(m.from);   // CN16b: cuenta para los veteranos de su ciudad
    if (win) {
      m.units = keep(res.surv[0], res.lost[0], 1, gTuyo(res));
      if (m.sitio) { delete m.sitio; delete m.postura; const home = aCasa(m); dHer = home; out.lines.push('Tus tropas vuelven a ' + D.CITIES[home].n + '.'); }
      else { reanuda(m, pb.pm); dHer = s.cities[m.from] && s.cities[m.from].owner === 'roma' ? m.from : G.capital(); out.lines.push('Tu ejército sigue su marcha, con ' + Math.round(D.CAMPO.retraso * 30) + ' días' + ' de retraso.'); }
      const eh = e.from && s.cities[e.from] && s.cities[e.from].owner === e.owner ? e.from : null;
      if (eh) merge(s.cities[eh].units, keep(res.surv[1], res.lost[1], 0.7, 0)); out.lines.push(enNom + ' se retira' + (eh ? ' a ' + D.CITIES[eh].n : '') + '.');
      G.log('🏆 Victoria en el camino: ' + K.nombre + '.', 'good');
    } else {
      const sob = keep(res.surv[0], res.lost[0], 0.7, 0);
      if (m.hero) { s.hero.march = null; }
      m.units = sob; delete m.sitio; delete m.postura; const home = aCasa(m);
      e.units = keep(res.surv[1], res.lost[1], 1, 0.3); reanuda(e, pb.pe);
      out.lines.push('Los supervivientes se retiran a ' + D.CITIES[home].n + '.', enNom + ' sigue su marcha, con ' + Math.round(D.CAMPO.retraso * 30) + ' días' + ' de retraso.');
      G.log('💀 Derrota en el camino: ' + K.nombre + '.', 'bad');
    }
    if (heroIn) {
      const before = h.lvl; addXp(res.dead[1] / 4 * (win ? 1.5 : 0.7) + 10);
      out.lines.push('🦅 ' + h.name + ' gana experiencia' + (h.lvl > before ? ' y sube al nivel ' + h.lvl + '.' : '.'));
      if (res.genDead[0]) { const mw = Math.max(6, 24 + G.invSum('herida')); h.wound = s.t + mw; out.lines.push('🩸 ' + h.name + ' ha sido herido: ' + G.estTxt(G.estaciones(mw)) + ' de convalecencia.'); G.log('🩸 ' + h.name + ' cae herido en combate.', 'bad'); }
    }
    if (res.nueva) {
      if (win && res.prisioneros > 0) { const A = D.CAMINOS[K.camino - 1], p = K.punto || 0, a = A && D.CITIES[A[0]], b = A && D.CITIES[A[1]]; cautivos(res.prisioneros, a && b ? romanaCerca(a.lon + (b.lon - a.lon) * p, a.lat + (b.lat - a.lat) * p) : dHer, out); }   // CG4b: cautivos a tu ciudad más cercana al camino
      if (win && res.heridos) heridosA(dHer, res.heridos[0], out);
      if (!win && res.cautivos > 0) out.lines.push('⛓️ ' + res.cautivos + (res.cautivos === 1 ? ' herido tuyo cae prisionero.' : ' heridos tuyos caen prisioneros.'));
      if (win && res.dead[1] >= D.TRIUNFO.bajas && res.dead[0] * D.TRIUNFO.ratio < res.dead[1]) { G.favorAplica(4, 6); out.triunfo = true; out.lines.push('🎺 ¡Gran victoria! Roma pide un triunfo: sube el favor del Senado y del pueblo.'); }
    }
    if (m.tribuno != null && s.tribunos) {
      const i = s.tribunos.findIndex(t => t.id === m.tribuno);
      if (i >= 0 && res.tribunoMuerto) { out.lines.push('💀 El tribuno ' + s.tribunos[i].n + ' ha caído al mando del ejército.'); G.log('💀 Muere el tribuno ' + s.tribunos[i].n + '.', 'bad'); s.tribunos.splice(i, 1); out.tribunoMuerto = true; }
    }
    if (out.triunfo) G.triunfoOfrece(K.nombre, out);
    G.save(); if (s.over) emit('over'); return out;
  }

  /* ---------- guardado ---------- */
  G.save = function () { try { if (typeof localStorage !== 'undefined' && G.state) { G.state.parada = G.paradaAhora(); for (const id of G.myCities()) { const c = G.state.cities[id], r = CI && regE.get(c); if (r) ponerDatos(c, r); } localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } } catch (e) { /* almacenamiento no disponible */ } };
  G.hasSave = function () { try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  /* C3: diplomacia (API de la pantalla) */
  G.dipEstado = f => DIP.estado(G.state, f);
  G.dipMotivoAlianza = f => DIP.motivoAlianza(G.state, f, G);
  G.dipMotivoTributo = f => DIP.motivoTributo(G.state, f);
  G.dipAlianza = f => { const r = DIP.proponerAlianza(G.state, f, G, gasta); if (r.ok) G.log('🤝 Foedus con ' + D.FACTIONS[f].n + ': aliada de Roma.', 'good'); return r; };
  G.dipTributo = f => { const r = DIP.imponerTributo(G.state, f); if (r.ok) G.log('📜 ' + D.FACTIONS[f].n + ' acepta pagar tributo: ' + Math.round(r.mensual * D.ESTACION) + ' denarios por estación.', 'good'); return r; };
  G.dipRomper = f => { const r = DIP.romper(G.state, f); if (r) G.log('⚔️ Roma rompe el pacto con ' + D.FACTIONS[f].n + '.', 'bad'); return r; };
  G.dipIngreso = () => DIP.ingresoMes(G.state);
  G.load = function () { let ok = false; cargando = true; try { ok = cargar(); } finally { cargando = false; } if (ok) { G.migrarAjustes(G.state); G.migrarTribunos(G.state); G.migrarParada(G.state); G.migrarCampo(G.state); G.migrarAgro(G.state); } if (ok && CI) alCargar(); return ok; };
  function cargar() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) { G.state = s; if (s.polis === undefined || !D.POLIS[s.polis]) s.polis = null; D.polis = s.polis; G.migrarNiveles(s); G.migrarEstaciones(s); G.migrarRecursos(s); for (const id in s.cities) G.ligarObras(s.cities[id]); for (const m of s.marches) { const a = Math.ceil(m.t1 / D.TURNO_MESES - 1e-9) * D.TURNO_MESES; if (a > m.t1) m.t1 = a; } if (s.vivo === undefined) s.vivo = null; if (!Array.isArray(s.vivoCola)) s.vivoCola = []; if (!s.rutas) s.rutas = []; if (!s.forja) s.forja = { armas: 0, armaduras: 0, cola: null }; if (s.evN !== D.EVENTS.length || s.evV !== EV_VERSION) { const y = G.yearOf(s.t); s.ev = {}; D.EVENTS.forEach((e, i) => { if (y <= e.y) s.ev[i] = 1; }); s.evN = D.EVENTS.length; } s.evV = EV_VERSION; D.anio = G.yearOf(s.t); for (const id in s.cities) { const c = s.cities[id]; if (!D.TIPOS[c.tipo]) c.tipo = 'municipio'; if (c.tipoElegido === undefined) c.tipoElegido = false; if (c.inq === undefined) c.inq = 0; if (c.bdef === undefined) c.bdef = 0;  if (c.b.templo > 0 && !D.DIOSES[c.dios]) c.dios = 'marte'; if (!D.FACTIONS[c.owner]) c.owner = id === 'messana' ? 'mamertinos' : 'campanos'; if (id === 'messana' && c.owner === 'campanos') c.owner = 'mamertinos'; for (const b of ['viviendas', 'mercado', 'puerto', 'herreria']) if (c.b[b] === undefined) c.b[b] = b === 'viviendas' ? 2 : 0; if (c.pop === undefined) c.pop = Math.round(G.popCap(c) * 0.7); if (!D.IMPUESTOS[c.imp]) c.imp = 'normal'; if (!D.RACION[c.rac]) c.rac = 'normal'; G.fiestaDe(c); if (!G.repartoValido(c.reparto)) c.reparto = G.repartoBase(id); if (id === 'carthagonova' && c.owner !== 'iberos' && !c.w) c.w = D.CITIES.carthagonova.en228.w; } G.state = s; for (const id in s.cities) if (s.cities[id].barrio === undefined) { const c = s.cities[id]; c.barrio = 1; c.barrio = G.barrioInfo(c).objetivo; } for (const id in s.cities) { const c = s.cities[id]; if (!c.levas) c.levas = []; if (c.esc === undefined) c.esc = 0; G.migrarHeridos(c); if (typeof c.puertas !== 'boolean') c.puertas = false; if (typeof c.vetB !== 'number') c.vetB = 0; if (c.ciu === undefined) c.ciu = (c.barrio || 1) >= 2 ? Math.round((c.pop || 0) * 0.1) : 0; } G.migrarRegion(s); G.migrarCaja(s); G.migrarPueblos(s); G.migrarRetirados(s); G.migrarES20(s); G.migrarSenado(s); G.migrarInv(s); G.migrarDeuda(s); G.migrarColonias(s); DIP.migrar(s); G.migrarCD(s); G.migrarAjustes(s); G.migrarModo(s); if (s.triunfo === undefined) s.triunfo = null; if (typeof s.triunfoFin !== 'number') s.triunfoFin = 0; return true; } } catch (e) { /* partida corrupta */ } return false; }
  /* CE3-A2: de diez niveles a cinco. Todo nivel viejo L pasa a ceil(L / 2) en c.b, c.heredado, foroMin y el muro guardado de la ciudad nueva (las piezas guardan su mejora 0..3:
     ahora valen 1..4 niveles y c.b se rehace solo). Las obras en curso conservan lo pagado y su fin se acorta a 2 estaciones (6 meses) desde ahora. Idempotente con s.niveles5. */
  G.migrarNiveles = function (s) {
    if (!s || s.niveles5) return false;
    const mitad = n => n > 0 ? Math.ceil(n / 2) : n;
    for (const id in s.cities) {
      const c = s.cities[id];
      for (const b in c.b) c.b[b] = mitad(c.b[b] || 0);
      if (c.heredado) for (const b in c.heredado) c.heredado[b] = mitad(c.heredado[b] || 0);
      if (c.foroMin) c.foroMin = mitad(c.foroMin);
      if (c.ciudad && c.ciudad.mur0) c.ciudad.mur0 = mitad(c.ciudad.mur0);
      for (const q of c.obras || []) if (q && q.t1 > s.t + 6) q.t1 = s.t + 6;
    }
    s.niveles5 = true; return true;
  };
  /* CE3-A1: colas de antes de las estaciones. Desde ahora, una obra (edificio, pueblo, forja) acaba como mucho en 2 estaciones y un lote de reclutas
     en 1 (los lotes encadenados empiezan ya, en paralelo). Lo pagado se conserva (no se toca pag ni costo). Idempotente con s.estaciones. */
  G.migrarEstaciones = function (s) {
    if (!s || s.estaciones) return false;
    const t = s.t || 0, obra = t + D.ESTACION * D.OBRA_ESTACIONES_MAX, lote = t + D.ESTACION, corta = (q, fin) => { if (q && q.t1 > fin) q.t1 = fin; if (q && q.t0 > t) q.t0 = t; };
    for (const id in s.cities) { const c = s.cities[id]; for (const q of c.obras || []) corta(q, obra); corta(c.pobra, obra); for (const l of c.train || []) corta(l, lote); }
    if (s.forja && s.forja.cola) corta(s.forja.cola, obra);
    s.estaciones = true; return true;
  };
  // tras cargar: cada ciudad propia recupera (o estrena) su ciudad nueva; la obra en curso de una partida vieja se liga a su pieza
  function alCargar() {
    for (const id of G.myCities()) { const c = G.state.cities[id], antes = Object.assign({}, c.b), tenia = !!c.ciudad; regE.delete(c); if (c.ciudad && !c.ciudad.terreno) c.ciudad.terreno = 'rio';      // CN19-A: partida vieja sin terreno = valle del río
      try { if (abrir(c) && !tenia) migrarObra(c, antes); } catch (e) { regE.set(c, false); }
      try { const n = G.nivelDeBarrios(c); if (n) { c.barrio = n; c.bdef = 0; } } catch (e) { /* sin barrios: se queda el de la partida */ } }   // el nivel de ciudad sale de los barrios rehechos
  }
  // partida vieja sin caja: los recursos pasan al almacén hasta el tope y el resto queda en la caja (no se pierde nada)
  /* CE2: partida de cinco recursos (madera, piedra, hierro, grano, oro) → cuatro (grano, denarios, materiales, hierro). Idempotente.
     Cantidades sueltas (caja, almacén, cuarto, botines, gastos del Senado...): madera + piedra → materiales; oro → denarios, sin cambiar de valor.
     Costes de obras y lotes en curso (costo y cuota): la misma traducción que D.costeNuevo, pero sin redondear, para que las cuotas cuadren.
     Reparto de aldeanos: por campo. El informe del turno se vacía (es solo de la estación en curso). La ciudad nueva (c.ciudad) no se toca: es de ciudad.js. */
  const VIEJAS = ['madera', 'piedra', 'oro'];
  const conViejas = o => !!o && typeof o === 'object' && !Array.isArray(o) && VIEJAS.some(k => k in o && typeof o[k] === 'number');
  function costeLineal(o, tipo) {
    if (!conViejas(o)) return o; const g = k => +o[k] || 0, n = {};
    if (tipo === 'tropa') { n.grano = g('grano'); n.hierro = g('hierro'); n.denarios = g('oro') + g('madera') * 0.5; }
    else { n.materiales = g('madera') + g('piedra') + g('hierro'); n.denarios = g('oro') + g('grano') * 0.5; }
    for (const k in n) if (!n[k]) delete n[k]; return n;
  }
  function sumarViejas(o, visto) {
    if (!o || typeof o !== 'object' || visto.has(o)) return; visto.add(o);
    if (conViejas(o)) { const n = D.recursosNuevos(VIEJAS.concat(['hierro', 'grano', 'materiales', 'denarios']).reduce((a, k) => { if (k in o && typeof o[k] === 'number') a[k] = o[k]; return a; }, {})); for (const k of VIEJAS) delete o[k]; Object.assign(o, n); }
    for (const k in o) if (k !== 'ciudad' && o[k] && typeof o[k] === 'object') sumarViejas(o[k], visto);
  }
  G.migrarRecursos = function (s) {
    if (!s || typeof s !== 'object') return s;
    for (const id in s.cities || {}) { const c = s.cities[id];
      const r = c.reparto; if (r && typeof r === 'object' && 'madera' in r) c.reparto = { aserradero: r.madera, cantera: r.piedra, mina: r.hierro, granja: r.grano };
      for (const q of (c.obras || []).concat(c.queue ? [c.queue] : [])) if (q) { if (q.costo) q.costo = costeLineal(q.costo, 'obra'); if (q.cuota) q.cuota = costeLineal(q.cuota, 'obra'); }
      for (const l of c.train || []) if (l) { if (l.costo) l.costo = costeLineal(l.costo, 'tropa'); if (l.cuota) l.cuota = costeLineal(l.cuota, 'tropa'); } }
    if (Array.isArray(s.informe) && s.informe.some(e => e && e.r && conViejas(Object.keys(e.r).reduce((a, k) => (a[k] = 0, a), {})))) s.informe = [];
    sumarViejas(s, new Set());
    for (const k of ['res', 'alm', 'cuarto', 'gastoMes', 'gan']) if (s[k] && typeof s[k] === 'object') for (const r of D.RES) if (typeof s[k][r] !== 'number') s[k][r] = 0;
    if (!s.bienes || typeof s.bienes !== 'object') s.bienes = {}; if (typeof s.bienesGan !== 'number') s.bienesGan = 0; if (typeof s.bienesPerdidos !== 'number') s.bienesPerdidos = 0; if (typeof s.lujoFalta !== 'boolean') s.lujoFalta = false;
    return s;
  };
  G.migrarDeuda = function (s) { if (!(s.deudaPaga > 0)) s.deudaPaga = 0; };   // I3b: partida vieja, sin deuda
  /* I8: partida vieja o desconocida = campaña (modo null). En «fundar» la fase sigue a si ya hay ciudad propia; la capital por defecto de «en pie» es Roma. */
  G.migrarModo = function (s) {
    const m = s.modo, md = m && typeof m === 'object' && m.id !== 'campana' ? D.MODOS[m.id] : null;
    if (!md) { s.modo = null; delete s.capital; return; }
    if (!md.inicio[m.inicio]) m.inicio = 'enPie';
    const tiene = Object.keys(s.cities).some(id => s.cities[id].owner === 'roma');
    m.fase = m.inicio === 'fundar' && !tiene ? 'fundando' : 'jugando';   // I8b: una partida guardada a medio arar ('arando') sigue jugando
    if (m.fase === 'jugando' && !(s.capital && s.cities[s.capital])) s.capital = m.inicio === 'enPie' && s.cities.roma ? 'roma' : (m.inicio === 'fundar' ? md.inicio.fundar.sitio : undefined);
    if (m.fase === 'fundando') { const k = s.colonias && s.colonias[md.inicio.fundar.sitio]; if (k && k.estado === 'libre') s.colonias[md.inicio.fundar.sitio] = { estado: 'pendiente', desde: null }; }
  };
  G.migrarRegion = function (s) { if (!s.region || !D.REGIONES[s.region]) s.region = 'mediterraneo'; };
  /* CN10: acueducto, termas y anfiteatro ya no existen. Al cargar se quitan de c.b, c.heredado y de las obras (de todas las ciudades) y se
     devuelve su coste a tu almacén (suma del coste de cada nivel construido y lo ya pagado de una obra en marcha), sin pasar del tope G.cap().
     El total devuelto queda en s.devuelto = { acueducto/termas/anfiteatro: niveles quitados, total: { recurso: n }, perdido: { recurso: n } } y G.ultimaMigracion. */
  G.migrarRetirados = function (s) {
    const ids = Object.keys(D.RETIRADOS), tot = {}, perdido = {}, niv = {}; let hubo = false;
    for (const cid in s.cities) {
      const c = s.cities[cid], mia = c.owner === 'roma';
      const dev = (b, L) => { for (let l = 0; l < L; l++) for (const r in D.RETIRADOS[b]) tot[r] = (tot[r] || 0) + Math.round(D.RETIRADOS[b][r] * Math.pow(1.5, l) / 5) * 5; };
      for (const b of ids) {
        const L = Math.max((c.b && c.b[b]) || 0, (c.heredado && c.heredado[b]) || 0);
        if (c.b && b in c.b) { delete c.b[b]; hubo = true; } if (c.heredado && b in c.heredado) { delete c.heredado[b]; hubo = true; }
        if (L > 0) { niv[b] = (niv[b] || 0) + L; if (mia) dev(b, L); }
      }
      const q = c.obras || (c.queue ? [c.queue] : []);
      for (let i = q.length - 1; i >= 0; i--) if (q[i] && ids.includes(q[i].b)) {
        const o = q[i]; hubo = true; if (mia && o.costo) for (const r in o.costo) tot[r] = (tot[r] || 0) + (o.pag >= (o.nc || 1) ? o.costo[r] : Math.floor((o.cuota && o.cuota[r] || 0) * (o.pag || 0)));
        if (c.obras) c.obras.splice(i, 1); else delete c.queue;
      }
    }
    if (!hubo) return null;
    if (!s.alm) s.alm = {}; const antes = G.state; G.state = s; const capR = {}; for (const r in tot) capR[r] = G.capDe ? G.capDe(r) : G.cap(); G.state = antes;   // CE2: tope de cada recurso (los materiales caben el doble)
    const total = {};
    for (const r in tot) { const ya = s.alm[r] || 0, pon = Math.max(0, Math.min(tot[r], capR[r] - ya)); s.alm[r] = ya + pon; if (s.cuarto) s.cuarto[r] = (s.cuarto[r] || 0); total[r] = pon; if (tot[r] > pon) perdido[r] = tot[r] - pon; }
    s.devuelto = Object.assign({}, niv, { total: total, perdido: perdido }); G.ultimaMigracion = s.devuelto;
    return s.devuelto;
  };
  /* ES20: partida de antes de las estaciones por turnos puros. Idempotente con s.es20. Siempre por turnos y sin reloj (speed 0).
     Licencia de juego: las cuotas que faltaban de obras y lotes se dan por pagadas (un regalo pequeño) y nada queda en pausa.
     Obras, lotes, pueblos, forja y marchas acaban al cerrar la estación que toca (t1 redondeado arriba a múltiplo de 3).
     Si la partida está a mitad de estación, se deja: el siguiente «Pasar estación» la completa. */
  G.migrarES20 = function (s) {
    if (!s || s.es20) return false;
    const fin = t => Math.ceil((t || 0) / D.ESTACION - 1e-9) * D.ESTACION, pagada = q => { if (!q) return; if (q.nc && q.pag < q.nc) q.pag = q.nc; q.pausa = false; if (typeof q.t1 === 'number') q.t1 = fin(q.t1); };
    for (const id in s.cities) { const c = s.cities[id];
      for (const q of c.obras || []) pagada(q); if (!c.obras && c.queue) pagada(c.queue);
      for (const l of c.train || []) pagada(l);
      if (c.pobra && typeof c.pobra.t1 === 'number') c.pobra.t1 = fin(c.pobra.t1); }
    if (s.forja && s.forja.cola) s.forja.cola.t1 = fin(s.forja.cola.t1);
    for (const m of s.marches || []) if (typeof m.t1 === 'number') m.t1 = fin(m.t1);
    s.turnos = true; s.speed = 0; s.hoja = null; delete s.hojaVa; s.es20 = true;
    { const antes = G.state; G.state = s; try { s.hojaR0 = reservaAhora(); } finally { G.state = antes; } }   // la estación en curso cuenta desde aquí
    return true;
  };
  G.migrarCaja = function (s) {
    const cero = () => { const o = {}; for (const r of D.RES) o[r] = 0; return o; };
    if (!s.obrasMes) s.obrasMes = 0;
    for (const id in s.cities) { const c = s.cities[id];   // obras y lotes de partidas viejas: pagados enteros
      const vieja = (q, costo) => { if (q && !q.nc) { q.nc = 1; q.pag = 1; q.cuota = costo || {}; q.costo = costo || {}; q.pausa = false; } };
      for (const q of c.obras || []) vieja(q); if (!c.obras) vieja(c.queue); for (const l of c.train || []) vieja(l); }
    if (!s.gastoMes) s.gastoMes = cero(); if (!s.gan) s.gan = cero(); if (!s.informe) s.informe = [];
    if (!s.alm || !s.cuarto) {
      s.alm = cero(); s.cuarto = cero(); const antes = G.state; G.state = s; const cap = G.cap(); G.state = antes;
      for (const r of D.RES) { const v = Math.max(0, s.res[r] || 0), g = Math.min(v, cap); s.alm[r] = g; s.res[r] = v - g; s.cuarto[r] = Math.floor(g * D.CUARTO_ALMACEN); }
    }
  };

  /* ---------- Senado (Q7): favor del Senado y del pueblo, y una misión a la vez ----------
     Pueblo: tiende (inercia) al ánimo medio de tus ciudades. Senado: sube o baja con las misiones y baja si el mes cierra
     con obras o levas detenidas por falta de oro. Sin Math.random: la misión siguiente sale por orden y por año.
     G.MISION_TIPOS está abierto: otra tarea (colonias, CN5) añade su tipo con cumple(s, cond) y falta(s, cond). */
  const propias = s => Object.keys(s.cities).filter(id => s.cities[id].owner === 'roma');
  const nivelMax = (s, c) => { const ids = c.ciudad ? [c.ciudad] : propias(s); let m = 0; for (const id of ids) if (s.cities[id] && s.cities[id].owner === 'roma') m = Math.max(m, s.cities[id].b[c.b] || 0); return m; };
  const tropasDe = (s, ids) => { let n = 0; for (const id of ids) if (s.cities[id]) n += G.men(s.cities[id].units); return n; };
  G.MISION_TIPOS = {
    edificio: { cumple: (s, c) => nivelMax(s, c) >= c.n, falta: (s, c) => D.BUILD[c.b].n + ' de nivel ' + c.n + (c.ciudad ? ' en ' + D.CITIES[c.ciudad].n : '') + ' (tienes ' + nivelMax(s, c) + ').' },
    ciudades: { cumple: (s, c) => propias(s).length >= c.n, falta: (s, c) => 'Ciudades propias: ' + propias(s).length + ' de ' + c.n + '.' },
    tropas: { cumple: (s, c) => tropasDe(s, propias(s)) >= c.n, falta: (s, c) => 'Hombres en armas: ' + tropasDe(s, propias(s)) + ' de ' + c.n + '.' },
    tropas_en: { cumple: (s, c) => !!s.cities[c.ciudad] && s.cities[c.ciudad].owner === 'roma' && tropasDe(s, [c.ciudad]) >= c.n, falta: (s, c) => 'Hombres en ' + D.CITIES[c.ciudad].n + ': ' + tropasDe(s, [c.ciudad]) + ' de ' + c.n + '.' },
    rutas: { cumple: (s, c) => G.rutasTotal(s) >= c.n, falta: (s, c) => 'Rutas comerciales: ' + G.rutasTotal(s) + ' de ' + c.n + '.' },
    bien: { cumple: (s, c) => propias(s).some(id => D.CITIES[id].esp === c.bien), falta: (s, c) => 'Falta una ciudad propia con ' + D.ESPECIAL[c.bien].n.toLowerCase() + '.' },
    colonia: { cumple: (s, c) => G.coloniasFundadas(s) >= (c.n || 1), falta: (s, c) => 'Colonias fundadas: ' + G.coloniasFundadas(s) + ' de ' + (c.n || 1) + '.' },
    denarios: { cumple: (s, c) => s.res.denarios + s.alm.denarios >= c.n, falta: (s, c) => 'Denarios: ' + Math.floor(s.res.denarios + s.alm.denarios) + ' de ' + c.n + '.' }
  };
  // partida nueva o vieja: favor 50/50 y sin misión
  /* Saber (I5): estado de investigación. Solo datos; las reglas (G.inv*) llegan en I5-B. */
  G.migrarInv = function (s) {
    const i = s.inv;
    if (!i || typeof i !== 'object') { s.inv = { v: 1, edad: 1, hechas: {}, cola: null, copia: {}, rev: 0, reformas: 0 }; return; }
    if (!i.v) i.v = 1; if (!(i.edad >= 1)) i.edad = 1; if (!i.hechas) i.hechas = {}; if (i.cola === undefined) i.cola = null; if (!i.copia) i.copia = {}; if (!(i.rev >= 0)) i.rev = 0; if (!(i.reformas >= 0)) i.reformas = 0;
  };
  /* Clases con las sustituciones (ef.cl) de los saberes hechos (Villa esclavista, Colonos). Sin saberes: D.CLASES tal cual. */
  let cacheK = null;
  G.K = function () {
    const s = G.state, h = s && s.inv && s.inv.hechas; if (!h) return D.CLASES;
    const ids = Object.keys(h).filter(id => D.INVEST[id] && D.INVEST[id].ef.cl); if (!ids.length) return D.CLASES;
    const clave = ids.sort().join(',');
    if (cacheK && cacheK.clave === clave) return cacheK.K;
    const K = Object.assign({}, D.CLASES); ids.forEach(id => Object.assign(K, D.INVEST[id].ef.cl)); cacheK = { clave, K }; return K;
  };
  /* ---------- Saber (I5-B): requisitos, precio fijo con tope, cola, efectos y techos ---------- */
  const INV_LOW = { obra: 1, paga: 1, instr: 1 };   // campos donde la ciencia BAJA el multiplicador (el techo es un mínimo)
  const ROMANO = ['', 'I', 'II', 'III', 'IV'];
  /* Sabios (I5b). c.sabios = { dot 0..3, clase 'ple'|'ciu'|'esc' } solo existe si el jugador la usa (el bot nunca lo crea). Constantes: D.SABER. */
  const SB0 = () => ({ n: 0, porClase: { ple: 0, ciu: 0, esc: 0 }, R: 0, ociosos: 0, aforo: 0, disp: { ple: 0, ciu: 0, esc: 0 }, dot: 0, clase: 'ple' });
  G.sabiosDe = function (c, gOk) {
    if (!c || !c.sabios || !c.b || !c.b.escuela) return SB0();   // salida inmediata: el bot y las ciudades sin Escuela no gastan nada
    const SD = D.SABER, sb = c.sabios, dot = Math.max(0, Math.min(3, Math.floor(sb.dot || 0))), clase = SD.rinde[sb.clase] ? sb.clase : 'ple', cl = G.clases(c), r = SB0();
    const niv = c.b.escuela; r.dot = dot; r.clase = clase; r.aforo = SD.aforoNivel * niv; r.disp = { ple: cl.ple, ciu: cl.ciu, esc: cl.esc };
    let n = 0;
    if (dot > 0) {
      let f = G.felicidadBase(c), ok = true;
      if (clase === 'esc') { const a = G.animoClases(c, gOk).esc; ok = a >= SD.animoMin; if (cl.esc > 0 && a < G.K().inquietud) f = Math.max(0, f - G.K().inquietudFel); }   // solo los esclavos miran el ánimo
      if (ok && f >= D.FELICIDAD_MIN_CRECER) n = Math.max(0, Math.min(Math.round(SD.dotFrac[dot] * r.aforo), Math.floor(r.disp[clase]), Math.floor(SD.topePob * Math.max(0, cl.pop - G.MIN_POP))));
    }
    r.n = n; r.porClase[clase] = n;
    let cal = 1; for (const k of [1, 3, 6, 10]) if (niv >= k) cal = SD.calNivel[k];
    const q = G.state.inv && G.state.inv.cola, rama = q && D.INVEST[q.id] ? D.INVEST[q.id].rama : null, tp = G.tipoDe(c);
    r.R = n * SD.rinde[clase] * cal * (tp.afin && tp.afin === rama ? SD.afinMul : 1) * (c.tipo === 'saber' ? SD.artesanosMul : 1);
    r.ociosos = Math.max(0, Math.floor(cl.pop - n - G.puestos(c)));
    return r;
  };
  const sabiosSuma = (gOk, f) => { let t = 0; for (const id of G.myCities()) t += f(G.sabiosDe(G.state.cities[id], gOk)); return t; };
  G.sabiosTotal = gOk => sabiosSuma(gOk, x => x.n);
  G.sabiosR = gOk => sabiosSuma(gOk, x => x.R);
  G.saberVel = function (gOk) { const R = G.sabiosR(gOk), SD = D.SABER; return R > 0 ? Math.min(SD.velMax, 1 + SD.velK * R / (R + SD.velR0)) : 1; };
  // oro al mes: Σ sabios de cada clase × paga base × factor de edad × (1 + S/pagaDiv), S = total del imperio. Sin caché: se recalcula (es barato y depende de la población).
  G.pagaSabios = function (gOk) {
    const SD = D.SABER, cl = { ple: 0, ciu: 0, esc: 0 }; let S = 0;
    for (const id of G.myCities()) { const x = G.sabiosDe(G.state.cities[id], gOk); if (x.n) { for (const k in cl) cl[k] += x.porClase[k]; S += x.n; } }
    if (!S) return 0;
    const ed = SD.pagaEdad[Math.max(0, Math.min(SD.pagaEdad.length, (G.state.inv && G.state.inv.edad) || 1) - 1)];
    return (cl.ple * SD.pagaBase.ple + cl.ciu * SD.pagaBase.ciu + cl.esc * SD.pagaBase.esc) * ed * (1 + S / SD.pagaDiv);
  };
  // cambia dotación y/o clase; cobra el alta (6 oro por sabio nuevo; una clase nueva cuenta entera). Bajar es gratis.
  G.setSabios = function (cid, dot, clase) {
    const s = G.state, c = s.cities[cid]; clase = clase || (c && c.sabios && c.sabios.clase) || 'ple';
    if (!c || c.owner !== 'roma') return { ok: false, motivo: 'No es una ciudad tuya' };
    if (!c.b.escuela) return { ok: false, motivo: 'Esta ciudad no tiene Escuela' };
    if (!D.SABER.rinde[clase] || !(dot >= 0 && dot <= 3)) return { ok: false, motivo: 'Dotación no válida' };
    if (clase === 'esc' && dot > 0 && !((c.esc || 0) >= 1)) return { ok: false, motivo: 'No hay esclavos en esta ciudad' };
    if (!c.sabios && dot === 0 && clase === 'ple') return { ok: true, motivo: '' };   // cerrada y plebeyos = estado por defecto; otra clase sí se guarda
    const antes = c.sabios ? G.sabiosDe(c) : null, mismaClase = !c.sabios || c.sabios.clase === clase, previo = c.sabios ? { dot: c.sabios.dot, clase: c.sabios.clase } : null;
    c.sabios = { dot: Math.floor(dot), clase: clase };
    const alta = D.SABER.alta * Math.max(0, G.sabiosDe(c).n - (antes && mismaClase ? antes.n : 0));
    if (alta > 0 && !G.canAfford({ denarios: alta })) { if (previo) c.sabios = previo; else delete c.sabios; return { ok: false, motivo: 'Faltan ' + Math.ceil(alta - G.disponible('denarios')) + ' denarios' }; }
    if (alta > 0) gasta('denarios', alta);
    emit('dirty'); return { ok: true, motivo: '' };
  };
  // previsión para los botones, sin cambiar nada
  G.sabiosVista = function (cid, dot, clase) {
    const c = G.state.cities[cid]; if (!c) return null; const viejo = c.sabios, cl0 = clase || (viejo && viejo.clase) || 'ple';
    const R0 = G.sabiosR(), v0 = G.saberVel(), p0 = G.pagaSabios(), a0 = G.sabiosDe(c);
    c.sabios = { dot: dot, clase: cl0 };
    try {
      const x = G.sabiosDe(c), v = G.saberVel(), mismaClase = !viejo || viejo.clase === cl0;
      return { n: x.n, dR: G.sabiosR() - R0, vel: v, dVel: v - v0, dPaga: G.pagaSabios() - p0, alta: D.SABER.alta * Math.max(0, x.n - (mismaClase ? a0.n : 0)), ociosos: x.ociosos, rec: G.recruits(c) };
    } finally { if (viejo) c.sabios = viejo; else delete c.sabios; }
  };
  const invDe = id => D.INVEST[id] || D.EDADES[id] || null;
  const nInv = () => { const h = G.state.inv.hechas; return Object.keys(h).filter(k => D.INVEST[k]).length; };
  // ¿se cumple este requisito? (único lector de la gramática de requisitos; _c se ignora: todo sale de G.state)
  G.invReq = function (_c, req) {
    const s = G.state, mis = G.myCities(), h = s.inv.hechas;
    if (req.edad !== undefined) return s.inv.edad >= req.edad;
    if (req.b) { return mis.some(id => (s.cities[id].b[req.b[0]] || 0) >= req.b[1]); }
    if (req.barrio !== undefined) return mis.some(id => G.barrioInfo(s.cities[id]).nivel >= req.barrio);
    if (req.ciudades !== undefined) return mis.length >= Math.max(1, Math.min(req.ciudades, G.ciudadesRegion().length - 1));
    if (req.tiene) return req.tiene.every(id => s.cities[id] && s.cities[id].owner === 'roma');
    if (req.fac) return mis.some(id => D.CITIES[id].f === req.fac);
    if (req.inv) return req.inv.every(id => h[id] !== undefined);
    if (req.saberes !== undefined) return nInv() >= req.saberes;
    if (req.ramas !== undefined) { const r = {}; for (const k in h) if (D.INVEST[k]) r[D.INVEST[k].rama] = 1; return Object.keys(r).length >= req.ramas; }
    if (req.y !== undefined) return G.yearOf(s.t) <= req.y;
    if (req.o) return req.o.some(r => G.invReq(null, r));
    return false;
  };
  const nomB = id => (D.BUILD[id] && D.BUILD[id].n) || id;
  G.invReqTxt = function (req) {
    if (req.edad !== undefined) return 'Edad ' + ROMANO[req.edad];
    if (req.b) return nomB(req.b[0]) + ' ' + req.b[1];
    if (req.barrio !== undefined) return 'Barrio ' + ((D.BARRIO[req.barrio] && D.BARRIO[req.barrio].n) || req.barrio);
    if (req.ciudades !== undefined) return req.ciudades + ' ciudades';
    if (req.tiene) return 'Tener ' + req.tiene.map(id => D.CITIES[id] ? D.CITIES[id].n : id).join(' y ');
    if (req.fac) return 'Una plaza de ' + (D.FACTIONS[req.fac] ? D.FACTIONS[req.fac].n : req.fac);
    if (req.inv) return req.inv.map(id => (D.INVEST[id] || { n: id }).n).join(' y ');
    if (req.saberes !== undefined) return req.saberes + ' saberes';
    if (req.ramas !== undefined) return req.ramas + ' ramas';
    if (req.y !== undefined) return 'Año ' + req.y + ' a.C. o después';
    if (req.o) return req.o.map(G.invReqTxt).join(' o ');
    return '?';
  };
  G.invReqLista = function (id) { const d = invDe(id); return d ? d.req.map(r => ({ txt: G.invReqTxt(r), ok: G.invReq(null, r) })) : []; };
  const mejorTipo = campo => { let m = 1; for (const id of G.myCities()) m = Math.min(m, G.tipoDe(G.state.cities[id])[campo] || 1); return m; };
  // precio FIJO (× tipo artesanos), recortado a tope × almacén por recurso. Sin pm ni escala.
  G.invCoste = function (id) {
    const d = invDe(id), o = {}; if (!d) return o; const m = mejorTipo('invCoste'), tope = Math.floor(D.SABER.tope * G.cap());
    for (const r of D.RES) o[r] = Math.min(Math.round((d.cost[r] || 0) * m), tope);
    return o;
  };
  G.invTiempo = id => { const d = invDe(id); return d ? D.ESTACION * G.estaciones(d.time * D.SABER.tiempoMul * mejorTipo('invTiempo') * G.factor('saber')) : 0; };   // CE3-A1: en estaciones enteras
  const nomR = { grano: 'grano', denarios: 'denarios', materiales: 'materiales', hierro: 'hierro' };
  G.invEstado = function (id) {
    const s = G.state, i = s.inv, d = invDe(id); if (!d) return { e: 'req', motivo: 'No existe' };
    if (i.hechas[id] !== undefined) return { e: 'hecha', motivo: 'Hecha' };
    if (i.cola && i.cola.id === id) return { e: 'curso', motivo: 'En curso' };
    if (D.EDADES[id]) { if (id !== 'E' + (i.edad + 1) || i.edad >= G.edadMax()) return { e: 'edad', motivo: i.edad >= G.edadMax() ? 'Ya estás en la última edad' : 'Antes sube a la Edad ' + ROMANO[i.edad + 1] }; }
    else if (d.edad > i.edad) return { e: 'edad', motivo: 'Pide la Edad ' + ROMANO[d.edad] };
    for (const x of d.excl || []) if (i.hechas[x] !== undefined) return { e: 'excl', motivo: 'Cerrada: elegiste ' + D.INVEST[x].n, excl: x };
    const falta = d.req.filter(r => !G.invReq(null, r)); if (falta.length) return { e: 'req', motivo: 'Pide: ' + falta.map(G.invReqTxt).join(', ') };
    if (i.cola) return { e: 'cola', motivo: 'Ya estudias ' + (invDe(i.cola.id).n) };
    const c = G.invCoste(id);
    if (!G.canAfford(c)) {
      const tope = Math.floor(D.SABER.tope * G.cap()), f = D.RES.filter(r => G.disponible(r) < c[r]);
      if (f.some(r => c[r] >= tope && tope > 0)) return { e: 'almacen', motivo: 'No cabe en tus almacenes: sube el almacén' };
      return { e: 'falta', motivo: 'Faltan ' + f.map(r => Math.ceil(c[r] - G.disponible(r)) + ' ' + nomR[r]).join(', ') };
    }
    return { e: 'ok', motivo: 'Se puede estudiar' };
  };
  // paga de golpe y pone la investigación (o la edad) en la única cola
  G.invUp = function (id) {
    const s = G.state, st = G.invEstado(id); if (st.e !== 'ok') return { ok: false, motivo: st.motivo };
    pay(G.invCoste(id)); const P = G.invTiempo(id); s.inv.cola = { id: id, p: 0, P: P, t0: s.t };
    G.log((D.EDADES[id] ? '🏛️ Empiezas la ' + D.EDADES[id].n : '📜 Empiezas a estudiar ' + D.INVEST[id].n) + ' (' + G.estTxt(G.estaciones(P)) + ').'); emit('dirty'); return { ok: true, motivo: '' };
  };
  /* Reformar (I5d): abandonar un saber elegido de un par excluyente y estudiar el otro, pagando su coste completo.
     Lo pagado antes no se devuelve. Se pierden sus efectos; los puntos de gloria se descuentan y el favor ya recibido se queda. */
  G.invReformaInfo = function (id) {
    const s = G.state, i = s.inv, d = D.INVEST[id]; if (!d || i.hechas[id] === undefined) return { ok: false, motivo: 'No lo sabes' };
    const alt = (d.excl || []).find(x => D.INVEST[x]); if (!alt) return { ok: false, motivo: 'Este saber no se puede cambiar: no tiene alternativa' };
    if (i.cola) return { ok: false, motivo: 'Ya estudias ' + invDe(i.cola.id).n + ': espera a que acabe' };
    const dep = Object.keys(i.hechas).find(k => k !== id && D.INVEST[k] && D.INVEST[k].req.some(r => r.inv && r.inv.includes(id)));
    if (dep) return { ok: false, motivo: 'Lo necesita ' + D.INVEST[dep].n };
    const h0 = i.hechas[id]; delete i.hechas[id]; i.rev++;
    let st; try { st = G.invEstado(alt); } finally { i.hechas[id] = h0; i.rev++; }
    return { ok: st.e === 'ok', motivo: st.e === 'ok' ? '' : st.motivo, alt: alt, coste: G.invCoste(alt), tiempo: G.invTiempo(alt), pierde: d.ef.pts ? d.ef.pts : 0 };
  };
  G.invReforma = function (id) {
    const s = G.state, r = G.invReformaInfo(id); if (!r.ok) return { ok: false, motivo: r.motivo };
    const d = D.INVEST[id]; delete s.inv.hechas[id]; s.inv.rev++;
    if (d.ef.pts) s.hero.pts = Math.max(0, s.hero.pts - d.ef.pts);
    s.inv.reformas = (s.inv.reformas || 0) + 1;
    const u = G.invUp(r.alt);
    if (!u.ok) { s.inv.hechas[id] = Math.floor(s.t); s.inv.rev++; if (d.ef.pts) s.hero.pts += d.ef.pts; s.inv.reformas--; return u; }
    G.log('🔄 Abandonas ' + d.n + ' y pasas a ' + D.INVEST[r.alt].n + '.'); return { ok: true, motivo: '' };
  };
  G.edadUp = function () { const e = G.state.inv.edad; if (e >= G.edadMax()) return { ok: false, motivo: 'Ya estás en la última edad' }; return G.invUp('E' + (e + 1)); };
  G.eurekaMul = function (id) { const d = D.INVEST[id], e = d && d.eureka; if (!e) return 1; const l = Array.isArray(e) ? e : [e]; return l.some(c => G.state.cities[c] && G.state.cities[c].owner === 'roma') ? 4 / 3 : 1; };
  G.invTick = function (dm, cierre) {   // cierre = false: avanza pero no termina (ES20: termina al cerrar la estación); sin él, como antes
    const i = G.state.inv, q = i && i.cola; if (!q) return;
    q.p += dm * G.saberVel() * G.eurekaMul(q.id); if (q.p >= q.P - 1e-9 && cierre !== false) G.invCompleta(q.id);
  };
  // efectos de UNA sola vez: viven en la cola, no en la carga, así que cargar no los repite
  G.invCompleta = function (id) {
    const s = G.state, i = s.inv, d = invDe(id); i.cola = null; i.rev++;
    if (D.EDADES[id]) { i.edad = d.edad; i.hechas[id] = Math.floor(s.t + 1e-9); G.log('🏛️ ¡Nueva edad: ' + d.n + '!', 'good'); emit('dirty'); return; }
    i.hechas[id] = Math.floor(s.t + 1e-9); const ef = d.ef || {};
    if (ef.pts) s.hero.pts += ef.pts;
    if (ef.favor) G.favorAplica(ef.favor.senado, ef.favor.pueblo);
    G.log('📜 Saber: ' + d.n + '.', 'good'); emit('dirty');
  };
  G.faltaInv = function (b) { if (b === 'escuela' && D.BUILD.escuela && G.state.inv.hechas.griego === undefined) return 'Pide estudiar Preceptores griegos (Saber)'; return null; };
  G.invSinBien = id => { const h = G.state.inv.hechas; for (const k in h) { const d = D.INVEST[k]; if (d && d.ef.sinBien === id) return true; } return false; };
  // caché de los productos y sumas de los saberes hechos: se rehace al cambiar la partida o s.inv.rev
  let cacheI = null;
  const resumenInv = function () {
    const s = G.state, i = s && s.inv; if (!i) return { mul: {}, sum: {}, viaje: {} };
    if (cacheI && cacheI.s === s && cacheI.rev === i.rev) return cacheI;
    const mul = {}, sum = {}, viaje = {}, T = D.SABER.techos;
    for (const id in i.hechas) { const d = D.INVEST[id]; if (!d) continue;
      for (const k in d.ef) { const v = d.ef[k];
        if (typeof v === 'number') { mul[k] = (mul[k] === undefined ? 1 : mul[k]) * v; sum[k] = (sum[k] || 0) + v; }
        else if (v && v.resta !== undefined && (k === 'viajeTierra' || k === 'viajeMar')) (viaje[k] = viaje[k] || []).push(v); } }
    for (const k in mul) if (T[k] !== undefined && !(k in { mor: 1, defMuro: 1 })) mul[k] = INV_LOW[k] ? Math.max(mul[k], T[k]) : Math.min(mul[k], T[k]);
    for (const k in sum) if (T[k] !== undefined) sum[k] = Math.min(sum[k], T[k]);
    cacheI = { s: s, rev: i.rev, mul: mul, sum: sum, viaje: viaje }; return cacheI;
  };
  G.invMul = campo => { const v = resumenInv().mul[campo]; return v === undefined ? 1 : v; };
  G.invSum = campo => { const r = resumenInv(); const v = r.sum[campo]; if (v !== undefined) return v; return 0; };
  // techo del resultado final (todas las fuentes juntas). Si ya sin ciencia se pasa del techo, la ciencia ni suma ni resta.
  G.techoFinal = function (campo, sin, con) {
    const F = D.SABER.final, viaje = campo === 'viajeMar' || campo === 'viajeTierra', lim = viaje ? F.viajeMin : F[campo]; if (lim === undefined) return con;
    if (viaje || INV_LOW[campo]) return sin <= lim ? sin : Math.max(con, lim);
    return sin >= lim ? sin : Math.min(con, lim);
  };
  // ciencia de viaje: cada saber resta sus meses si el trayecto (ya con los %) es mayor que su «sobre»; el total tiene techo y nunca se baja de 3 meses
  G.viajeCiencia = function (campo, t) {
    const l = resumenInv().viaje[campo]; if (!l) return t;
    let r = 0; for (const v of l) if (t > v.sobre) r += v.resta; r = Math.min(r, D.SABER.techos[campo]); if (!(r > 0)) return t;
    return G.techoFinal(campo, t, t - r);
  };
  // resumen para la pantalla
  G.invVista = function () {
    const s = G.state, i = s.inv, sig = i.edad < G.edadMax() ? 'E' + (i.edad + 1) : null, q = i.cola, ramas = { ca: 0, of: 0, gu: 0, ma: 0 };
    for (const k in i.hechas) if (D.INVEST[k]) ramas[D.INVEST[k].rama]++;
    const T = D.SABER.techos, r = resumenInv(), techos = [];
    for (const k in r.mul) if (T[k] !== undefined) techos.push({ campo: k, valor: r.mul[k], techo: T[k], lleno: INV_LOW[k] ? r.mul[k] <= T[k] : r.mul[k] >= T[k] });
    return {
      edad: i.edad, edadNombre: D.SABER.edadNombres[i.edad - 1], hechas: Object.keys(i.hechas).filter(k => D.INVEST[k]), nHechas: nInv(), ramas: ramas,
      sig: sig ? { id: sig, n: D.EDADES[sig].n, estado: G.invEstado(sig), req: G.invReqLista(sig), coste: G.invCoste(sig), tiempo: G.invTiempo(sig) } : null,
      cola: q ? { id: q.id, n: invDe(q.id).n, p: q.p, P: q.P, t0: q.t0, frac: Math.min(1, q.p / q.P), eureka: G.eurekaMul(q.id) > 1, vel: G.saberVel() * G.eurekaMul(q.id), sabios: { n: G.sabiosTotal(), R: G.sabiosR(), paga: G.pagaSabios(), vel: G.saberVel() } } : null,
      techos: techos
    };
  };
  G.migrarSenado = function (s) {
    if (!s.favor) s.favor = { senado: D.SENADO.favorIni, pueblo: D.SENADO.favorIni };
    if (s.mision === undefined) s.mision = null;
    if (!s.misionesHechas) s.misionesHechas = {};
    if (!s.proxMision) s.proxMision = 0;
    if (D.SENADO.sala && (!s.senado || s.senado.v !== 2)) G.migrarSala(s);   // SN1 / CE6
    if (!s.encargos || typeof s.encargos !== 'object') s.encargos = { activo: null, hechos: {}, prox: 0 };   // CN17
    if (!s.hitos || typeof s.hitos !== 'object') s.hitos = {};
  };
  const topeFavor = v => Math.max(D.SENADO.min, Math.min(D.SENADO.max, v));
  G.favor = function () { const s = G.state; G.migrarSenado(s); if (D.SENADO.sala) sincFavor(s); return { senado: Math.round(s.favor.senado), pueblo: Math.round(s.favor.pueblo) }; };
  G.favorBajo = () => { const s = G.state; G.migrarSenado(s); if (D.SENADO.sala) sincFavor(s); return s.favor.senado < D.SENADO.bajo; };
  G.senadoMotivo = () => G.favorBajo() ? 'El Senado te mira con malos ojos (favor ' + Math.round(G.state.favor.senado) + '): niega tratados con ciudades ajenas y levas extra.' : '';
  G.misionActual = function () {
    const s = G.state; G.migrarSenado(s); const x = s.mision, m = x && D.MISIONES[x.id]; if (!m) return null;
    return { m: m, t0: x.t0, t1: x.t1, quedan: Math.max(0, x.t1 - Math.floor(s.t + 1e-9)), falta: G.MISION_TIPOS[m.cond.tipo].falta(s, m.cond) };
  };
  const aplicaMision = (e, signo) => {
    const s = G.state; if (!e) return; if (e.denarios) s.res.denarios += e.denarios;
    s.favor.senado = topeFavor(s.favor.senado + (e.favorSenado || 0)); s.favor.pueblo = topeFavor(s.favor.pueblo + (e.favorPueblo || 0));
  };
  G.favorAplica = (senado, pueblo) => { G.migrarSenado(G.state); aplicaMision({ favorSenado: senado || 0, favorPueblo: pueblo || 0 }); };
  // asigna la siguiente misión: la primera por orden que no se hizo y cuyo año está en su ventana
  G.senadoAsignar = function () {
    const s = G.state; G.migrarSenado(s); if (s.mision) return null;
    if (D.SENADO.sala) return G.senadoObraSiguiente();   // SN1: las misiones llegan por votación
    const y = G.yearOf(s.t), mes = Math.floor(s.t + 1e-9);
    const m = Object.values(D.MISIONES).find(q => !s.misionesHechas[q.id] && y <= q.desde && y >= q.desde - D.SENADO.ventana && G.MISION_TIPOS[q.cond.tipo] && (!q.cond.ciudad || s.cities[q.cond.ciudad]));   // I8: sin Roma ni Capua (fundar) no hay misiones en ellas
    if (!m) return null;
    s.mision = { id: m.id, t0: mes, t1: mes + m.plazo };
    G.log('🏛️ El Senado te encarga: ' + m.n + '. ' + m.texto, '');
    return m;
  };
  // cada cierre de mes: el pueblo se acerca al ánimo medio; oro en rojo baja al Senado; se evalúa la misión
  G.senadoMes = function (rojo) {
    const s = G.state; G.migrarSenado(s); const S = D.SENADO, mes = Math.floor(s.t + 1e-9), mis = propias(s);
    if (mis.length) { let a = 0; for (const id of mis) a += G.felicidad(s.cities[id]); a /= mis.length; s.favor.pueblo += (a - s.favor.pueblo) * S.inercia; }
    if (rojo || s.res.denarios < 0) { s.favor.senado += S.oroRojo; G.log('🏛️ El Senado desconfía: la estación acaba con los denarios en rojo.', 'bad'); }
    const x = s.mision, m = x && D.MISIONES[x.id];
    if (x && !m) s.mision = null;
    else if (x && G.MISION_TIPOS[m.cond.tipo].cumple(s, m.cond)) {
      aplicaMision(Object.assign({ favorSenado: S.premio }, m.premio)); s.misionesHechas[m.id] = 'ok'; s.mision = null; s.proxMision = mes + S.pausa;
      G.log('🏛️ Misión cumplida: ' + m.n + '. El Senado lo agradece.', 'good'); G.parar(T.misionOk(m.n));
    } else if (x && mes >= x.t1) {
      aplicaMision(Object.assign({ favorSenado: S.castigo }, m.castigo)); s.misionesHechas[m.id] = 'fallo'; s.mision = null; s.proxMision = mes + S.pausa;
      G.log('🏛️ Misión fallida: ' + m.n + '. El Senado se queja.', 'bad'); G.parar(T.misionMal(m.n), true);
    }
    s.favor.senado = topeFavor(s.favor.senado); s.favor.pueblo = topeFavor(s.favor.pueblo);
    if (D.SENADO.sala) { sincFavor(s); G.senadoMensual(); }   // SN1: promesas y gastos cada mes; la votación de la estación la abre G.tick al cerrarla (ES20), tras obras, lotes y rivales
    if (!s.mision && mes >= s.proxMision) G.senadoAsignar();
    G.tribunosMes();
    try { G.encargosMes(mes); } catch (e) { console.log("ENCERR", e.stack.split("\n").slice(0,3).join(" / ")); }
  };
  /* ---------- CN17: encargos cortos del Senado e hitos (D.ENCARGOS, D.HITOS). Distintos de las misiones históricas: una sola vez, uno activo cada vez. ---------- */
  G.MEDIDAS = {
    casas: s => { let n = 0; for (const id of propias(s)) for (const b of G.barrioInfo(s.cities[id]).barrios) n += b.casas; return n; },
    barrios: s => { let n = 0; for (const id of propias(s)) n += G.barrioInfo(s.cities[id]).barrios.length; return n; },
    barrioNivel: s => { let n = 0; for (const id of propias(s)) for (const b of G.barrioInfo(s.cities[id]).barrios) n = Math.max(n, b.nivel); return n; },
    fuentes: s => { let n = 0; for (const id of propias(s)) { const E = ELBAR(s.cities[id]); if (E) n += E.edificios.filter(e => e.tipo === 'fuente' && !e.obra && !e.ruina).length; } return n; },
    denarios: s => Math.floor(Math.max(0, s.res.denarios || 0) + Math.max(0, (s.alm && s.alm.denarios) || 0)),   // ES20: la reserva entera
    encargos: s => Object.keys(s.encargos.hechos).filter(k => s.encargos.hechos[k] === 'ok').length
  };
  const medida = (s, c) => { const f = G.MEDIDAS[c.tipo]; return f ? f(s) : 0; };
  G.encargoActual = function () {
    const s = G.state; G.migrarSenado(s); const x = s.encargos.activo, e = x && D.ENCARGOS[x.id]; if (!e) return null;
    return { e: e, t0: x.t0, t1: x.t1, quedan: Math.max(0, x.t1 - Math.floor(s.t + 1e-9)), tiene: medida(s, e.cond), pide: e.cond.n };
  };
  G.hitosVista = function () { const s = G.state; G.migrarSenado(s); return Object.values(D.HITOS).map(h => ({ h: h, logrado: s.hitos[h.id] !== undefined })); };
  G.encargosMes = function (mes) {
    const s = G.state; G.migrarSenado(s); const S = s.encargos;
    for (const h of Object.values(D.HITOS)) if (s.hitos[h.id] === undefined && medida(s, h.cond) >= h.cond.n) {
      s.hitos[h.id] = mes; aplicaMision(h.premio); G.log('🏅 Hito: ' + h.n + '. ' + h.texto + (h.abre ? ' Se abren ' + h.abre + '.' : ''), 'good');
    }
    const x = S.activo, e = x && D.ENCARGOS[x.id];
    if (x && !e) S.activo = null;
    else if (x && medida(s, e.cond) >= e.cond.n) { aplicaMision(e.premio); S.hechos[e.id] = 'ok'; S.activo = null; S.prox = mes + D.ENCARGO_PAUSA; G.log('📜 Encargo cumplido: ' + e.n + '. El Senado lo agradece.', 'good'); }
    else if (x && mes >= x.t1) { S.hechos[e.id] = 'fallo'; S.activo = null; S.prox = mes + D.ENCARGO_PAUSA; G.log('📜 Encargo sin cumplir: ' + e.n + '. El Senado lo da por perdido.', 'bad'); }
    if (!S.activo && mes >= S.prox) {
      const n = Object.values(D.ENCARGOS).find(q => !S.hechos[q.id] && (!q.req || s.hitos[q.req] !== undefined) && medida(s, q.cond) < q.cond.n);
      if (n) { S.activo = { id: n.id, t0: mes, t1: mes + n.plazo }; G.log('📜 El Senado te pide: ' + n.n + '. ' + n.texto, ''); }
    }
  };
  /* ---------- Senado nuevo (SN1) y Senado de familias (CE6): sala de votos con hasta siete bandos (sin pantalla) ----------
     Informes: gobierno/estudios/senado-nuevo.md y CE6-encargo.md. Interruptor D.SENADO.sala: con false no se ejecuta nada de este bloque y el juego es el de Q7.
     s.senado = { v:2, bandos:[activos, en orden], humor:{bando}, escanos:{bando}, familia (escaños de tu familia), total, pide:{bando:{id,texto,turno,n}}, actos:{contadores de la estación},
       votacion:{id,turno,cambiada}|null, promesas:[], permisos:{fac: mes de fin}, fs (último favor del Senado sincronizado), turnoVista, treguas, gastos, obras (misiones por abrir),
       victorias (meses), levaHasta, pagaHasta, ciudadania:{ciudad: mes de fin}, ultimas:{ley: turno} }.
     El favor del Senado de Q7 (s.favor.senado) sigue siendo la cifra que lee el resto del juego: es la media de los humores de los bandos activos por escaños (tu familia no cuenta).
     Lo que Q7 (y las pruebas viejas) escriban en s.favor.senado se reparte entre los humores en la lectura siguiente (sincFavor). */
  const SALA = () => !!D.SENADO.sala, BANDOS = ['ter', 'mer', 'mil'], MESES_DUR = () => D.SENADO.duracion * D.TURNO_MESES;
  const act = q => (q && q.bandos) || BANDOS;   // bandos activos
  const mesAhora = s => Math.floor(s.t + 1e-9);
  const mediaHumor = q => { const A = act(q); let t = 0; for (const b of A) t += q.humor[b] * (q.escanos[b] || 0); return t / (A.reduce((a, b) => a + (q.escanos[b] || 0), 0) || 1); };
  const totalDe = q => (q.familia || 0) + act(q).reduce((a, b) => a + (q.escanos[b] || 0), 0);
  const mayoriaDe = q => Math.floor(totalDe(q) / 2) + 1;
  const pagoVotoDe = q => Math.max(3, Math.round(D.SENADO.pagoVoto * 30 / (totalDe(q) || 30)));
  function sincFavor(s) {
    const q = s.senado; if (!q) return;
    if (Math.abs(s.favor.senado - q.fs) > 1e-9) { const d = s.favor.senado - q.fs; for (const b of act(q)) q.humor[b] = topeFavor(q.humor[b] + d); }
    q.fs = mediaHumor(q); s.favor.senado = q.fs;
  }
  const SQ = () => { const s = G.state; G.migrarSenado(s); if (s.senado) sincFavor(s); return s.senado; };
  const sumaHumor = (s, b, d) => { const q = s.senado; if (q.humor[b] === undefined) return; q.humor[b] = topeFavor(q.humor[b] + d); };
  const hum3 = (d) => { const s = G.state, q = SQ(); for (const b of act(q)) sumaHumor(s, b, d); sincFavor(s); return q; };
  // ----- provincias (CE6) -----
  const PROV_DE = {}; for (const p in D.PROVINCIAS) for (const id of D.PROVINCIAS[p].ciudades) PROV_DE[id] = p;
  const coordDe = id => D.CITIES[id] || (D.COLONIAS && D.COLONIAS[id]) || null;
  // provincia de una ciudad; una colonia toma la de la ciudad propia más cercana (o la más cercana de la tabla)
  const provDe = function (s, id) {
    if (PROV_DE[id]) return PROV_DE[id];
    const c0 = coordDe(id); if (!c0) return 'lacio';
    let mejor = null, dm = 1e9, mejorP = null, dp = 1e9;
    for (const k in PROV_DE) { const c = D.CITIES[k]; if (!c) continue; const d = (c.lon - c0.lon) ** 2 + (c.lat - c0.lat) ** 2; if (d < dp) { dp = d; mejorP = k; } if (s.cities[k] && s.cities[k].owner === 'roma' && d < dm) { dm = d; mejor = k; } }
    return PROV_DE[mejor || mejorP] || 'lacio';
  };
  const enItalia = (s, id) => !!D.PROVINCIAS[provDe(s, id)].italia;
  G.provinciaDe = id => { const p = provDe(G.state, id); return Object.assign({ id: p }, D.PROVINCIAS[p]); };
  // ----- bandos que entran (CE6) -----
  const cuentaBandos = function (s) {
    let templos = 0, ita = 0, fuera = 0, plebe = 0;
    for (const id of propias(s)) { const c = s.cities[id]; templos += c.b.templo || 0; if (enItalia(s, id)) ita++; else fuera++; plebe += G.clases(c).ple; }
    return { templos: templos, ita: ita, fuera: fuera, plebe: plebe };
  };
  const cumpleEntrada = function (b, k) {
    const E = D.SENADO.entrada;
    if (b === 'sac') return k.templos >= E.templos; if (b === 'ita') return k.ita >= E.italia; if (b === 'pro') return k.fuera >= E.fuera; if (b === 'pue') return k.plebe >= E.plebe;
    return true;
  };
  // mete en la sala los bandos que ya cumplen su condición; se quedan para siempre. Devuelve los que entran.
  function entran(s, avisar) {
    const q = s.senado, k = cuentaBandos(s), nuevos = [];
    for (const b of D.BANDOS_ORDEN) if (!act(q).includes(b) && cumpleEntrada(b, k)) { nuevos.push(b); q.humor[b] = topeFavor(q.fs !== undefined ? q.fs : s.favor.senado); q.escanos[b] = 0; }
    if (!nuevos.length) return nuevos;
    const A = act(q).concat(nuevos); q.bandos = D.BANDOS_ORDEN.filter(b => A.includes(b));
    if (avisar && s === G.state) for (const b of nuevos) G.log('🏛️ Entran en el Senado los ' + D.BANDOS[b].fam + ', con ' + (b === 'pue' ? 'el pueblo' : 'los ' + D.BANDOS[b].n.toLowerCase()) + '.', 'good');
    if (s === G.state) G.escanos(true);
    return nuevos;
  }
  G.migrarSala = function (s) {
    if (s.senado && s.senado.v === 2) return;
    if (!s.senado || s.senado.v !== 1) {
      const f = s.favor.senado, y = G.yearOf(s.t), perm = {};
      for (const id in D.FACTIONS) { const F = D.FACTIONS[id]; if (id !== 'roma' && F.raid && y <= F.from) perm[id] = 99999; }   // guerras ya en marcha: las que asaltan de antiguo (from = año a.C. en que empiezan)
      const md = s.modo && D.MODOS && D.MODOS[s.modo.id]; if (md && md.rival) perm[md.rival] = 99999;
      if (s.marches) for (const m of s.marches) if (!m.colonos && s.cities[m.to]) { const o = m.owner === 'roma' ? s.cities[m.to].owner : m.owner; if (o !== 'roma') perm[o] = 99999; }
      if (s === G.state) for (const id of propias(s)) for (const n of G.neighbors(id)) { if (G.edge(id, n) && G.edge(id, n)[2]) continue; const o = s.cities[n] && s.cities[n].owner; if (o && o !== 'roma') perm[o] = 99999; }   // vecinas al empezar: nadie se queda sin poder jugar el principio
      s.senado = { v: 1, humor: { ter: f, mer: f, mil: f }, escanos: { ter: 10, mer: 10, mil: 10 }, votacion: null, promesas: [], permisos: perm, fs: f, turnoVista: -1, treguas: {}, gastos: [], obras: [], victorias: [], levaHasta: 0, pagaHasta: 0, ciudadania: {}, ultimas: {} };
    }
    // CE6: de v1 a v2 (los humores de los tres de siempre se conservan)
    const q = s.senado; q.v = 2;
    if (!Array.isArray(q.bandos)) q.bandos = BANDOS.slice();
    if (!q.pide || typeof q.pide !== 'object') q.pide = {};
    if (!q.actos || typeof q.actos !== 'object') q.actos = {};
    if (typeof q.familia !== 'number') q.familia = 0;
    if (typeof q.fs !== 'number') q.fs = s.favor.senado;
    for (const b of BANDOS) { if (typeof q.humor[b] !== 'number') q.humor[b] = q.fs; if (typeof q.escanos[b] !== 'number') q.escanos[b] = 10; }
    if (s.cities) entran(s, s === G.state && s.t > 0);
    if (s === G.state) G.escanos(true);
  };
  // ----- escaños -----
  const pesosBandos = function (s) {
    const mis = propias(s), p = G.prod(), k = cuentaBandos(s); let granja = 0, mer = 0, cuartel = 0, hombres = 0;
    for (const id of mis) { const c = s.cities[id]; granja += c.b.granja || 0; mer += (c.b.mercado || 0) + (c.b.puerto || 0); cuartel += c.b.cuartel || 0; hombres += G.men(c.units); }
    const mes = mesAhora(s), vic = (s.senado.victorias || []).filter(m => m > mes - 12).length;
    return { ter: Math.max(0, p.grano) / 10 + granja, mer: mer * 3 + G.rutasTotal(s) * 5 + Math.max(0, (p.det && p.det.rutas) || 0) / 20, mil: hombres / 100 + cuartel * 2 + vic * 3,
      sac: k.templos * 3, ita: k.ita * 2, pro: k.fuera * 3, pue: k.plebe / 300 };
  };
  // CE6: total por población (30 a 300); tu familia 2 + 3 %; cada bando activo un mínimo; lo demás 60 % por provincias y 40 % por pesos; restos mayores: la suma es exacta
  G.escanos = function (recalcular) {
    const s = G.state, q = SQ(); if (!q) return null;
    if (!recalcular) return Object.assign({}, q.escanos);
    const S = D.SENADO, A = act(q), mis = propias(s);
    let pop = 0; const popProv = {}; for (const id of mis) { const c = s.cities[id], pr = provDe(s, id); pop += c.pop || 0; popProv[pr] = (popProv[pr] || 0) + (c.pop || 0); }
    const total = Math.min(S.totalMax, Math.max(S.totalMin, Math.round(pop / S.porHab))), fam = S.familiaBase + Math.round(S.familiaPct * total);
    const min = Math.max(S.minimoAbs, Math.round(S.minimoPct * total)), libres = Math.max(0, total - fam - min * A.length), cuota = {};
    for (const b of A) cuota[b] = 0;
    let pesos = libres * (1 - S.provPct);
    if (pop > 0) for (const pr in popProv) { const parte = libres * S.provPct * popProv[pr] / pop, af = D.PROVINCIAS[pr].afin; if (A.includes(af)) cuota[af] += parte; else pesos += parte; }
    else pesos += libres * S.provPct;
    const w = pesosBandos(s), W = A.reduce((a, b) => a + w[b], 0);
    for (const b of A) cuota[b] += W > 0 ? pesos * w[b] / W : pesos / A.length;
    const e = {}, resto = []; let usados = 0;
    for (const b of A) { const ent = Math.floor(cuota[b] + 1e-9); e[b] = min + ent; usados += ent; resto.push([b, cuota[b] - ent]); }
    resto.sort((a, c) => c[1] - a[1]); for (let i = 0; usados < libres; i++, usados++) e[resto[i % resto.length][0]]++;
    q.escanos = e; q.familia = fam; q.total = total; sincFavor(s); return Object.assign({}, e);
  };
  G.senadoTotal = function () { const q = SQ(); return q ? { total: totalDe(q), mayoria: mayoriaDe(q), familia: q.familia || 0, pagoVoto: pagoVotoDe(q) } : null; };
  G.humores = function () { const q = SQ(); return q ? Object.assign({}, q.humor) : null; };
  // ----- leyes -----
  const posturaMision = m => {
    const c = m.cond, b = c.b;
    if (c.tipo === 'tropas' || c.tipo === 'tropas_en') return { ter: -1, mer: 0, mil: 2 };
    if (c.tipo === 'edificio') { if (['cuartel', 'herreria', 'establo'].includes(b)) return { ter: -1, mer: 0, mil: 2 }; if (b === 'muralla') return { ter: 1, mer: 0, mil: 1 }; if (['puerto', 'mercado', 'foro'].includes(b)) return { ter: 0, mer: 2, mil: 0 }; if (b === 'templo') return { ter: 1, mer: 1, mil: 0, sac: 2 }; if (['granja', 'almacen'].includes(b)) return { ter: 2, mer: 0, mil: 0 }; return { ter: 1, mer: 1, mil: 0 }; }
    if (c.tipo === 'rutas' || c.tipo === 'denarios' || c.tipo === 'bien') return { ter: 0, mer: 2, mil: 0 };
    if (c.tipo === 'ciudades' || c.tipo === 'colonia') return { ter: 1, mer: 0, mil: 1 };
    return { ter: 1, mer: 1, mil: 0 };
  };
  // postura de una ley para un bando: la suya; si no, la de su tipo (D.SENADO.posturaTipo); en las misiones, 0 para los bandos nuevos
  const posturaDe = function (l, b) {
    if (l.postura && typeof l.postura[b] === 'number') return l.postura[b];
    if (l.mision) return 0;
    if (l.tipo === 'ley' && b === 'pue') return Math.sign((l.chips || {}).ple || 0);
    return ((D.SENADO.posturaTipo || {})[l.tipo] || {})[b] || 0;
  };
  G.postura = (ley, b) => posturaDe(G.leyDe(ley), b);
  const cacheLey = {};
  // una ley por id: de D.LEYES o una misión de Q7 vestida de «obra»
  G.leyDe = function (id) {
    if (id && typeof id === 'object') return id;
    if (D.LEYES[id]) return D.LEYES[id];
    const m = D.MISIONES[id]; if (!m) return null;
    return cacheLey[id] || (cacheLey[id] = { id: m.id, tipo: 'obra', n: m.n, texto: m.texto, h: m.texto, fuente: m.fuente, dictamen: m.dictamen, postura: posturaMision(m), efecto: { mision: m.id }, chips: {}, mision: true });
  };
  const permitida = (q, mes, fac) => q.permisos[fac] !== undefined && q.permisos[fac] > mes;
  const enProgreso = (s, q, id) => (s.mision && s.mision.id === id) || q.obras.includes(id);
  // ¿tiene sentido proponerla ahora? (sin azar)
  const sirve = function (s, q, l) {
    const mes = mesAhora(s), e = l.efecto || {};
    if (l.mision) return !s.misionesHechas[l.id] && !enProgreso(s, q, l.id);
    if (e.permiso) return !permitida(q, mes, e.permiso);
    if (e.tregua) return permitida(q, mes, e.tregua);
    if (e.leva) return !(q.levaHasta > mes);
    if (e.oroEstacion) return !q.gastos.some(g => g.id === l.id && g.hasta > mes);
    if (e.ciudadania) return !!s.cities[e.ciudadania] && s.cities[e.ciudadania].owner === 'roma' && !(q.ciudadania[e.ciudadania] > mes);
    return true;
  };
  // lista ordenada de leyes posibles ahora: la primera es la del Senado
  G.candidatas = function () {
    const s = G.state, q = SQ(), y = G.yearOf(s.t), mes = mesAhora(s), out = [];
    const pon = id => { if (!out.includes(id) && G.leyDe(id) && sirve(s, q, G.leyDe(id))) { const u = q.ultimas[id]; if (u === undefined || G.turnoN(s.t) - u >= D.SENADO.duracion) out.push(id); } };
    if (!s.mision && !q.obras.length) { const m = Object.values(D.MISIONES).find(x => !s.misionesHechas[x.id] && y <= x.desde && y >= x.desde - D.SENADO.ventana && G.MISION_TIPOS[x.cond.tipo] && (!x.cond.ciudad || s.cities[x.cond.ciudad])); if (m) pon(m.id); }
    const rojo = s.res.denarios < 0 || s.deudaPaga > 0, enemigo = s.marches.some(m => m.owner !== 'roma' && s.cities[m.to] && s.cities[m.to].owner === 'roma');
    if (enemigo) { D.LEYES_ORDEN.filter(i => D.LEYES[i].tipo === 'guerra').forEach(pon); D.LEYES_ORDEN.filter(i => D.LEYES[i].tipo === 'leva').forEach(pon); }
    if (s.favor.pueblo < 40) { pon('ley-grano-barato'); }
    if (rojo) D.LEYES_ORDEN.filter(i => D.LEYES[i].tipo === 'paz').forEach(pon);
    D.LEYES_ORDEN.filter(i => D.LEYES[i].tipo === 'obra').forEach(pon);
    D.LEYES_ORDEN.forEach(pon);
    for (const x of Object.values(D.MISIONES)) if (y <= x.desde && y >= x.desde - D.SENADO.ventana && (!x.cond.ciudad || s.cities[x.cond.ciudad]) && G.MISION_TIPOS[x.cond.tipo]) pon(x.id);
    return out;
  };
  G.propuestaEstacion = function () { const c = G.candidatas(); return c.length ? c[0] : null; };
  G.propuestasAlternativas = function () { const q = SQ(), v = q.votacion; return G.candidatas().filter(id => !v || id !== v.id).slice(0, 3); };
  // ----- votos -----
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  G.votos = function (ley, tratos) {
    const l = G.leyDe(ley), q = SQ(), por = {}; let si = 0, duda = 0, no = 0;
    const tr = {}; for (const t of tratos || []) if (t && (t.tipo === 'promesa' || t.tipo === 'pago')) tr[t.bando] = t.tipo;
    for (const b of act(q)) {
      const e = q.escanos[b] || 0, p = posturaDe(l, b) * 15 + (q.humor[b] - 50) / 2;
      let y = Math.round(clamp(e * (0.5 + p / 50) * 0.8, 0, e)), n = Math.round(clamp(e * (0.5 - p / 50) * 0.8, 0, e - y)), d = e - y - n;
      if (tr[b]) { y += d; d = 0; }
      por[b] = { escanos: e, si: y, duda: d, no: n, trato: tr[b] || null }; si += y; duda += d; no += n;
    }
    const fam = q.familia || 0; si += fam;   // tu familia siempre vota sí
    return { si: si, duda: duda, no: no, porBando: por, familia: fam, total: totalDe(q), mayoria: mayoriaDe(q) };
  };
  const tropasTotal = s => tropasDe(s, propias(s));
  const capitalNoRoma = s => { const ids = propias(s); return ids.includes('capua') ? 'capua' : (ids.find(i => i !== 'roma') || 'roma'); };
  const italicaNoRoma = s => { const ids = propias(s).filter(i => i !== 'roma' && enItalia(s, i)); return ids.includes('capua') ? 'capua' : (ids[0] || capitalNoRoma(s)); };
  // CE6: una tarjeta por bando activo, con el trato de D.BANDOS[b].trato. El pago por voto se escala con el total de escaños.
  G.tratos = function (ley) {
    const s = G.state, q = SQ(), l = G.leyDe(ley), v = G.votos(l, []), S = D.SENADO, out = [], oro = s.res.denarios + s.alm.denarios, pv = pagoVotoDe(q);
    const gasto = Math.max(0, -(G.prod().denarios || 0)), nom = b => D.BANDOS[b].n;
    for (const b of act(q)) {
      const x = v.porBando[b], e = x.escanos, base = { bando: b, escanos: e }, tr = D.BANDOS[b].trato;
      if (x.duda === 0 || x.si >= 0.7 * e) { out.push(Object.assign(base, { tipo: 'si', etiqueta: 'Favorable', votos: x.si, extra: 0, coste: 0, texto: nom(b) + ' ya votan a favor. No piden nada.' })); continue; }
      if (tr === 'pago') {
        const coste = x.duda * pv, ok = oro - coste >= 3 * gasto, que = b === 'sac' ? 'Ofrenda: pagas ' : b === 'pue' ? 'Reparto: pagas ' : 'Pagas ';
        out.push(Object.assign(base, { tipo: 'pago', etiqueta: ok ? 'Dudoso' : 'Arriesgado', votos: x.si + x.duda, extra: x.duda, coste: coste, porVoto: pv, texto: que + coste + ' denarios (' + pv + ' por voto) y los dudosos votan sí.' }));
      } else {
        const sinLeva = tr === 'sinLeva' || tr === 'sinLevaItalia';
        const p = sinLeva ? { tipo: 'sinLeva', ciudad: tr === 'sinLevaItalia' ? italicaNoRoma(s) : capitalNoRoma(s) } : { tipo: 'guarnicion', n: Math.max(1, Math.floor(tropasTotal(s) * 0.9)) };
        const choca = sinLeva ? (l.tipo === 'guerra' || l.tipo === 'leva') : (l.tipo === 'guerra' || tropasTotal(s) < 1.1 * p.n);
        const t = sinLeva ? 'Prometes no reclutar en ' + D.CITIES[p.ciudad].n + ' durante ' + S.duracion + ' estaciones.' : 'Prometes mantener ' + p.n + ' hombres en armas durante ' + S.duracion + ' estaciones.';
        out.push(Object.assign(base, { tipo: 'promesa', etiqueta: choca ? 'Arriesgado' : 'Dudoso', votos: x.si + x.duda, extra: x.duda, coste: 0, texto: t + ' Si la rompes, ' + S.romper + ' de humor.', promesa: p }));
      }
    }
    return out;
  };
  // tribuno de la plebe: veta si el pueblo está por debajo del umbral y la ley castiga a los plebeyos
  G.veto = function (ley) {
    const s = G.state, l = G.leyDe(ley); G.migrarSenado(s); const neg = ((l.chips || {}).ple || 0) < 0, bajo = s.favor.pueblo < D.SENADO.vetoPueblo;
    return { veta: neg && bajo, pueblo: Math.round(s.favor.pueblo), umbral: D.SENADO.vetoPueblo, motivo: neg && bajo ? 'Vetará: la plebe está descontenta' : '' };
  };
  G.juegos = function () {
    const s = G.state, J = D.SENADO.juegos; SQ(); if (!G.canAfford({ denarios: J.denarios })) return { ok: false, motivo: 'Faltan denarios' };
    conGasto('senado', null, () => gasta('denarios', J.denarios)); G.favorAplica(0, J.pueblo); G.senadoActo('juegos'); G.log('🎭 Juegos en el Foro: la plebe lo celebra.', 'good'); emit('dirty'); return { ok: true, motivo: '' };
  };
  G.cambiarPropuesta = function (id) {
    const s = G.state, q = SQ(), v = q.votacion; if (!v) return { ok: false, motivo: 'No hay votación abierta' };
    if (v.cambiada) return { ok: false, motivo: 'Ya cambiaste la propuesta esta estación' };
    if (!G.propuestasAlternativas().includes(id)) return { ok: false, motivo: 'Esa ley no se puede proponer ahora' };
    hum3(D.SENADO.cambiar); v.id = id; v.cambiada = true; G.log('🏛️ Cambias la propuesta del Senado: ' + G.leyDe(id).n + '.', ''); emit('dirty'); return { ok: true, motivo: '' };
  };
  // efectos de una ley que sale
  G.senadoEfecto = function (l) {
    const s = G.state, q = s.senado, e = l.efecto || {}, mes = mesAhora(s), dur = MESES_DUR(), ch = l.chips || {};
    if (e.permiso) { q.permisos[e.permiso] = mes + dur; delete q.treguas[e.permiso]; q.pagaHasta = mes + dur; }
    if (e.tregua) { q.treguas[e.tregua] = mes + dur; delete q.permisos[e.tregua]; }
    if (e.leva) q.levaHasta = mes + e.leva * D.TURNO_MESES;
    if (e.oroEstacion) q.gastos.push({ id: l.id, hasta: mes + dur, denarios: e.oroEstacion / D.TURNO_MESES });
    if (e.denarios) s.res.denarios += e.denarios;
    if (e.ciudadania) q.ciudadania[s.cities[e.ciudadania] ? e.ciudadania : 'roma'] = mes + dur;
    if (e.mision) { if (!s.mision) abrirMision(s, e.mision); else q.obras.push(e.mision); }
    const pueblo = (ch.ple || 0) + 0.5 * (ch.ciu || 0); if (pueblo) G.favorAplica(0, pueblo);
    if (l.id === 'ley-grano-barato') G.senadoActo('grano');
  };
  function abrirMision(s, id) { const m = D.MISIONES[id], mes = mesAhora(s); if (!m) return null; s.mision = { id: id, t0: mes, t1: mes + m.plazo }; G.log('🏛️ El Senado te encarga: ' + m.n + '. ' + m.texto, ''); return m; }
  G.senadoObraSiguiente = function () { const s = G.state, q = s.senado; while (q && q.obras.length) { const id = q.obras.shift(); if (!s.misionesHechas[id] && D.MISIONES[id]) return abrirMision(s, id); } return null; };
  function cerrar(s, q, ley, tr, forzarSinTrato) {
    const S = D.SENADO, v = G.votos(ley, tr), vet = G.veto(ley), total = totalDe(q), pv = pagoVotoDe(q); let coste = 0;
    const base = G.votos(ley, []); for (const t of tr) if (t.tipo === 'pago' && base.porBando[t.bando]) coste += base.porBando[t.bando].duda * pv;
    if (coste > 0) { conGasto('senado', null, () => gasta('denarios', coste)); for (const t of tr) if (t.tipo === 'pago') sumaHumor(s, t.bando, S.pagar); }
    const sale = !vet.veta && v.si >= mayoriaDe(q), r = { ok: true, ley: ley.id, sale: sale, vetada: vet.veta, si: v.si, duda: v.duda, no: v.no, total: total, mayoria: mayoriaDe(q), familia: v.familia, coste: coste, porBando: v.porBando };
    for (const b of act(q)) { const pb = posturaDe(ley, b), g = pb > 0 ? 1 : pb < 0 ? -1 : 0; sumaHumor(s, b, sale ? g * S.postura : -g * S.postura / 2); }
    if (sale) {
      for (const t of tr) if (t.tipo === 'promesa') { const pr = Object.assign({}, t.promesa || {}, { bando: t.bando, hasta: mesAhora(s) + MESES_DUR(), rota: false }); q.promesas.push(pr); }
      G.senadoEfecto(ley); r.linea = 'Sale «' + ley.n + '» (' + v.si + ' de ' + total + ').'; G.log('🏛️ ' + r.linea, 'good');
    } else {
      if (ley.mision) s.misionesHechas[ley.id] = 'rechazada';
      if (vet.veta) { G.favorAplica(0, 2); r.linea = 'El tribuno veta «' + ley.n + '»: la plebe está descontenta.'; } else r.linea = 'No sale «' + ley.n + '» (' + v.si + ' de ' + total + ').';
      G.log('🏛️ ' + r.linea, 'bad');
    }
    q.ultimas[ley.id] = G.turnoN(s.t); q.votacion = null; sincFavor(s); emit('dirty'); return r;
  }
  const aTratos = (l, tratos) => (tratos || []).filter(t => t && (t.tipo === 'promesa' || t.tipo === 'pago') && act(G.state.senado).includes(t.bando)).filter((t, i, a) => a.findIndex(u => u.bando === t.bando) === i);
  G.votar = function (tratos) {
    const s = G.state, q = SQ(), v = q && q.votacion; if (!v) return { ok: false, motivo: 'No hay votación abierta' };
    const l = G.leyDe(v.id), tr = aTratos(l, tratos), base = G.votos(l, []); let coste = 0;
    for (const t of tr) if (t.tipo === 'pago' && base.porBando[t.bando]) coste += base.porBando[t.bando].duda * pagoVotoDe(q);
    if (coste > 0 && !G.canAfford({ denarios: coste })) return { ok: false, motivo: 'Faltan denarios' };
    return cerrar(s, q, l, tr);
  };
  G.dejarPasar = function () { const s = G.state, q = SQ(), v = q && q.votacion; if (!v) return { ok: false, motivo: 'No hay votación abierta' }; return cerrar(s, q, G.leyDe(v.id), []); };
  // una vez por estación: escaños nuevos y votación nueva (la anterior, si seguía abierta, se hace sola)
  G.senadoEstacion = function () {
    const s = G.state; if (!SALA() || !s || s.over) return; const q = SQ(), tn = G.turnoN(s.t); if (q.turnoVista === tn) return;
    if (q.votacion) G.dejarPasar();
    peticionesCierra(s, q); q.turnoVista = tn; entran(s, true); G.escanos(true); peticionesAbre(s, q, tn); const id = G.propuestaEstacion(); q.votacion = id ? { id: id, turno: tn, cambiada: false } : null;
    if (q.votacion) G.log('🏛️ El Senado vota: ' + G.leyDe(id).n + '.', ''); emit('dirty');
  };
  // ----- peticiones (CE6): una por bando activo y estación, sin azar; se miden con lo que contó G.senadoActo -----
  const PIDE_TXT = { sinLeva: 'Sin levas esta estación', granja: 'Una granja', rutaMercado: 'Una ruta o un mercado', denarios: 'Denarios por encima de ', leva: 'Una leva', victoria: 'Una victoria',
    templo: 'Un templo', paz: 'Paz esta estación (sin atacar)', sinLevaItalia: 'Sin levas en Italia', ciudadania: 'Ciudadanía a una ciudad', victoriaFuera: 'Una victoria fuera de Italia',
    guarnicion: 'Guarnición de ', grano: 'Grano sin faltar', juegos: 'Juegos en el Foro' };
  function peticionesAbre(s, q, tn) {
    q.pide = {}; q.actos = {}; q.ganado = {};
    for (const b of act(q)) {
      const l = D.SENADO.pide[b]; if (!l) continue; const id = l[tn % l.length], x = { id: id, turno: tn };
      if (id === 'denarios') x.n = Math.max(300, Math.ceil((s.res.denarios + s.alm.denarios + 200) / 100) * 100);
      if (id === 'guarnicion') x.n = Math.max(100, Math.ceil(tropasTotal(s) * 1.1 / 50) * 50);
      x.texto = PIDE_TXT[id] + (x.n ? x.n + (id === 'guarnicion' ? ' hombres' : '') : ''); q.pide[b] = x;
    }
  }
  const rutasVivas = s => ((s.mercado && Array.isArray(s.mercado.rutas) ? s.mercado.rutas.length : 0) + (Array.isArray(s.rutas) ? s.rutas.filter(r => r && !r.parada).length : 0));   // CE12: rutas activas (mercado nuevo o viejas no paradas)
  const cumplePide = function (s, q, x) {
    const a = q.actos || {}, n = k => a[k] || 0;
    switch (x.id) {
      case 'sinLeva': return !n('leva'); case 'granja': return n('granja') > 0; case 'rutaMercado': return n('ruta') + n('mercado') > 0 || rutasVivas(s) > 0;
      case 'denarios': return s.res.denarios + s.alm.denarios >= x.n || rutasVivas(s) >= 2; case 'leva': return n('leva') > 0; case 'victoria': return n('victoria') > 0;
      case 'templo': return n('templo') > 0; case 'paz': return !n('ataque'); case 'sinLevaItalia': return !n('levaItalia'); case 'ciudadania': return n('ciudadania') > 0;
      case 'victoriaFuera': return n('victoriaFuera') > 0; case 'guarnicion': return tropasTotal(s) >= x.n; case 'grano': return !n('hambre'); case 'juegos': return n('juegos') > 0;
    }
    return false;
  };
  // al pasar la estación: cumplida +6, no cumplida -3
  function peticionesCierra(s, q) {
    const P = D.SENADO.peticion, si = [], no = [];
    for (const b in q.pide || {}) { if (!act(q).includes(b)) continue; const ok = cumplePide(s, q, q.pide[b]); sumaHumor(s, b, ok ? P.si : P.no); (ok ? si : no).push(D.BANDOS[b].n.toLowerCase()); }
    if (si.length || no.length) G.log('🏛️ Peticiones del Senado: ' + (si.length ? 'cumples con los ' + si.join(', ') + ' (+' + P.si + ')' : '') + (si.length && no.length ? '; ' : '') + (no.length ? 'fallas a los ' + no.join(', ') + ' (' + P.no + ')' : '') + '.', si.length >= no.length ? 'good' : 'bad');
    q.pide = {}; q.actos = {}; q.ganado = {}; sincFavor(s);
  }
  // CE6: un solo punto de entrada para lo que hace el jugador. tipo: 'obra' (dato = edificio), 'leva', 'victoria', 'tomada', 'ciudadania' (dato = ciudad), 'ruta', 'juegos', 'grano', 'ataque', 'hambre'.
  // Cuenta el acto para las peticiones; si contenta a un bando activo: +2 a él y -1 a sus rivales activos. Devuelve el bando contentado o null.
  G.senadoActo = function (tipo, dato) {
    libs(); if (MIN && G.state && !G.state.over && G.state.cities) MIN.acto(G.state, tipo, dato);   // CDe1-A: los ministros cuentan los actos del jugador
    const s = G.state; if (!SALA() || !s || !s.cities || s.over) return null; const q = SQ(); if (!q) return null; const S = D.SENADO, a = q.actos || (q.actos = {});
    const k = tipo === 'obra' ? dato : tipo === 'tomada' ? (dato && enItalia(s, dato) ? 'tomadaItalia' : 'tomadaFuera') : tipo; if (!k) return null;
    a[k] = (a[k] || 0) + 1;
    if (tipo === 'leva' && dato && enItalia(s, dato)) a.levaItalia = (a.levaItalia || 0) + 1;
    if (tipo === 'victoria' && dato && !enItalia(s, dato)) a.victoriaFuera = (a.victoriaFuera || 0) + 1;
    if (tipo === 'obra' || tipo === 'tomada' || tipo === 'ciudadania') entran(s, true);
    const b = S.actos[k], A = act(q); if (!b || !A.includes(b)) return null;
    const g = q.ganado || (q.ganado = {}), mas = Math.max(0, Math.min(S.acto.mas, S.acto.tope - (g[b] || 0))); g[b] = (g[b] || 0) + mas;   // lo que un bando gana por actos tiene tope por estación; lo que pierden sus rivales, no
    sumaHumor(s, b, mas); for (const r of D.BANDOS[b].rival) if (A.includes(r)) sumaHumor(s, r, S.acto.menos);
    sincFavor(s); return b;
  };
  // CE6: lo que la pantalla necesita de la sala (los siete bandos, activos o no)
  G.senadoBandos = function () {
    const s = G.state; if (!SALA() || !s) return null; const q = SQ(); if (!q) return null; const A = act(q);
    const bandos = D.BANDOS_ORDEN.map(b => { const B = D.BANDOS[b], on = A.includes(b), x = (q.pide || {})[b];
      return { id: b, n: B.n, fam: B.fam, col: B.col, escanos: on ? q.escanos[b] || 0 : 0, humor: on ? Math.round(q.humor[b]) : null, pide: on && x ? x.texto : '', activo: on, falta: on ? '' : B.entra }; });
    return { bandos: bandos, total: totalDe(q), mayoria: mayoriaDe(q), familia: q.familia || 0 };
  };
  G.senadoSala = () => { const s = G.state; if (!SALA()) return null; const q = SQ(); return q.votacion ? { ley: G.leyDe(q.votacion.id), cambiada: q.votacion.cambiada } : null; };
  // promesas: cada mes se comprueban; rota = -15 al bando; cumplida (llegó su fecha) = +5
  G.promesasMes = function () {
    const s = G.state, q = SQ(), mes = mesAhora(s), S = D.SENADO; if (!q || !q.promesas.length) return;
    for (const p of q.promesas.slice()) {
      if (p.tipo === 'guarnicion' && tropasTotal(s) < p.n) p.rota = true;
      if (p.rota) { sumaHumor(s, p.bando, S.romper); G.log('🏛️ Rompes tu promesa a los ' + D.BANDOS[p.bando].n.toLowerCase() + ': ' + S.romper + '.', 'bad'); q.promesas.splice(q.promesas.indexOf(p), 1); }
      else if (mes >= p.hasta) { sumaHumor(s, p.bando, S.cumplir); G.log('🏛️ Cumples tu promesa a los ' + D.BANDOS[p.bando].n.toLowerCase() + ': +' + S.cumplir + '.', 'good'); q.promesas.splice(q.promesas.indexOf(p), 1); }
    }
    sincFavor(s);
  };
  // cada mes: gastos de leyes y paga de la legión que paga el Senado
  G.senadoMensual = function () {
    const s = G.state, q = SQ(), mes = mesAhora(s); if (!q) return;
    q.gastos = q.gastos.filter(g => g.hasta > mes); for (const g of q.gastos) s.res.denarios += g.denarios;
    if (G.disponible('grano') <= 0) G.senadoActo('hambre');   // ES20: sin grano en toda la reserva
    if (q.pagaHasta > mes) { const m = G.mantenimiento().tropas, n = Math.max(1, tropasTotal(s)); s.res.denarios += 1200 * m / n; }
    G.promesasMes();
  };
  // ataque sin permiso del Senado (se llama desde G.send): -10 a los tres bandos; la marcha queda sin triunfo
  G.senadoAtaque = function (m, fac) {
    const s = G.state, q = SQ(); G.senadoActo('ataque', fac); if (permitida(q, mesAhora(s), fac)) return false;
    m.sinTriunfo = true; hum3(D.SENADO.sinPermiso); G.log('🏛️ Atacas a ' + D.FACTIONS[fac].n + ' sin permiso del Senado: ' + D.SENADO.sinPermiso + ' de humor a todos los bandos.', 'bad'); return true;
  };
  G.senadoVictoria = function (m) { const s = G.state, q = SQ(); if (q) { q.victorias.push(mesAhora(s)); G.senadoActo('victoria', m && m.to); } };
  G.senadoLeva = cid => { const s = G.state, q = s.senado; if (q) { for (const p of q.promesas) if (p.tipo === 'sinLeva' && (!p.ciudad || p.ciudad === cid)) p.rota = true; G.senadoActo('leva', cid); } };
  const levaLibre = () => { const s = G.state, q = s && s.senado; return !!q && SALA() && q.levaHasta > mesAhora(s); };
  const ciudadaniaMul = cid => { const s = G.state, q = s && s.senado; return q && SALA() && q.ciudadania && q.ciudadania[cid] > mesAhora(s) ? 0.5 : 1; };
  /* ---------- CDe1-A: ministros, plan del Senado y necesidades de barrio ----------
     Las reglas viven en js/ministros.js, js/plan-senado.js y js/necesidades.js (sin pantalla). Aquí solo se enganchan al juego.
     Sin los módulos todo sigue como antes. Guardado: s.ministros, s.planSenado y c.nec = { mem: [por barrio] } (c.nec.alc no se guarda). */
  G.usarNecesidades = m => { NEC = m || null; };
  G.hayNecesidades = () => !!NEC;
  const necDe = c => { if (!c.nec || typeof c.nec !== 'object' || !Array.isArray(c.nec.mem)) c.nec = { mem: [] }; return c.nec; };
  G.migrarCD = function (s) {
    libs(); if (MIN) MIN.migrar(s); if (PLAN && MIN) PLAN.migrar(s);
    for (const id in s.cities) necDe(s.cities[id]);
    if (CAM()) CAM().migrar(s); if (EA()) EA().migrar(s, G.yearOf(s.t || 0)); if (GOB()) GOB().migrar(s);   // CDe4: caminos, «Este año» y gobernador
    if (!s.indem || typeof s.indem !== 'object') s.indem = {};
    return s;
  };
  // efectos de las reglas: humor de un bando activo -> sumaHumor; texto -> diario
  function aplicaEfectos(s, efectos) {
    let toca = false;
    for (const e of efectos || []) {
      if (e.tipo === 'humor' && e.activo) { sumaHumor(s, e.bando, e.d); toca = true; }
      else if (e.tipo === 'log') G.log(e.texto, e.tono === 'good' || e.tono === 'bad' ? e.tono : '');
    }
    if (toca) sincFavor(s);
  }
  G.ministrosAyuda = () => ({
    invPuede: id => G.invEstado(id).e === 'ok',
    felicidad: c => G.felicidad(c),
    consumoMes: () => Math.max(0, G.prod().comida || 0),
    veta: cid => G.vetaHierro(cid),
    encargosAgro: cid => {   // CDe3-F2a: lo que propone AGRO.encargosAgricultura para una ciudad (campo, mejora o cambiar), con el suelo de cada hueco libre
      const s = G.state, st = AGRO && G.agroEstado(cid); if (!st) return [];
      const alm = Object.assign({}, s.bienes, { grano: Math.max(0, s.res.grano) + (s.alm.grano || 0) });
      return AGRO.encargosAgricultura({ parcelas: st.parcelas, libres: st.libres, almacen: alm, bocas: bocasMes(s), mes: mesAhora(s) % 12, saberes: G.saberesHechos() })
        .filter(g => !(g.tipo === 'cambiar' && (st.parcelas.find(p => p.id === g.parcela) || {}).granja))
        .map(g => Object.assign({}, g, { suelo: g.tipo === 'campo' ? (st.libres.find(l => l.id === g.parcela) || {}).suelo : undefined }));
    }
  });
  G.planAyuda = () => Object.assign({ coste: (b, L) => D.BUILD[b] ? G.cost(b, L) : {} }, G.ministrosAyuda());
  G.planPuedeVotar = function () {
    const s = G.state; if (!s || !libs() || !PLAN) return 'El plan del Senado no está disponible'; PLAN.migrar(s);
    const r = PLAN.puedeVotar(s, mesAhora(s)); return r.ok ? null : r.motivo;
  };
  G.planVotar = function (tratos) {
    const s = G.state, fallo = m => ({ ok: false, motivo: m, aprobado: false, votos: null });
    if (!s || !libs() || !PLAN) return fallo('El plan del Senado no está disponible');
    PLAN.migrar(s); const mes = mesAhora(s), pv = PLAN.puedeVotar(s, mes); if (!pv.ok) return fallo(pv.motivo);
    const q = SQ(), ley = PLAN.comoLey(s, s.planSenado.borrador), tr = aTratos(ley, tratos), base = G.votos(ley, []); let coste = 0;
    for (const t of tr) if (t.tipo === 'pago' && base.porBando[t.bando]) coste += base.porBando[t.bando].duda * pagoVotoDe(q);
    if (coste > 0 && !G.canAfford({ denarios: coste })) return fallo('Faltan denarios');
    if (coste > 0) { conGasto('senado', null, () => gasta('denarios', coste)); for (const t of tr) if (t.tipo === 'pago') sumaHumor(s, t.bando, D.SENADO.pagar); }
    const v = G.votos(ley, tr), r = PLAN.votar(s, mes, v);
    if (!r.ok) { if (coste > 0) sincFavor(s); return fallo(r.motivo); }
    if (r.sale) for (const t of tr) if (t.tipo === 'promesa') q.promesas.push(Object.assign({}, t.promesa || {}, { bando: t.bando, hasta: mes + MESES_DUR(), rota: false }));
    aplicaEfectos(s, r.efectos); sincFavor(s); emit('dirty');
    return { ok: true, motivo: r.motivo || '', aprobado: !!r.sale, votos: v, coste: coste, reparto: r.reparto };
  };
  G.planAbandonar = function () {
    const s = G.state; if (!s || !libs() || !PLAN) return { ok: false, motivo: 'El plan del Senado no está disponible' };
    PLAN.migrar(s); const r = PLAN.abandonar(s, mesAhora(s)); if (!r.ok) return { ok: false, motivo: r.motivo };
    aplicaEfectos(s, r.efectos); emit('dirty'); return { ok: true, motivo: '' };
  };
  // una orden de un ministro: se ejecuta con las mismas funciones que usa el jugador y se anota si salió
  function ejecutaOrden(s, o) {
    let ok = false, hecho; G.ultimoMotivo = '';
    const c = s.cities[o.ciudad];
    if (o.tipo === 'subir') ok = G.upgrade(o.ciudad, o.b);
    else if (o.tipo === 'reclutar') {
      let n = c ? Math.min(o.n, G.recruits(c), 1000) : 0;
      if (!c || !G.unitOk(c, o.u)) G.ultimoMotivo = 'No se puede reclutar eso aquí';
      else if (c.train.length >= 5) G.ultimoMotivo = 'Ya hay cinco lotes en instrucción';
      else if (n <= 0) G.ultimoMotivo = 'No quedan reclutas';
      else { while (n > 0 && !(ok = G.train(o.ciudad, o.u, n))) n = n > 10 ? Math.floor(n * 0.9) : n - 1; hecho = ok ? n : 0; }
    } else if (o.tipo === 'investigar') { const r = G.invUp(o.saber); ok = r.ok; G.ultimoMotivo = r.motivo; }
    else if (o.tipo === 'impuesto') ok = G.setImp(o.ciudad, o.nivel);
    else if (o.tipo === 'plantar' || o.tipo === 'cambiar') { const r = G.plantarCampo(o.ciudad, o.campo, o.tipo === 'plantar' ? o.suelo : o.parcela); ok = r.ok; G.ultimoMotivo = r.motivo; }
    else if (o.tipo === 'mejorar') { const r = G.mejorarParcela(o.ciudad, o.parcela, o.mejora); ok = r.ok; G.ultimoMotivo = r.motivo; }
    else if (o.tipo === 'fiesta') { ok = G.hacerFiesta(o.ciudad, o.fiesta); if (!ok) G.ultimoMotivo = G.fiestaInfo(o.ciudad, o.fiesta).motivo || ''; }
    MIN.anotar(s, o, !!ok, G.ultimoMotivo, hecho);
  }
  // cierre de mes: revisar encargos -> propuestas -> plan del Senado -> órdenes; cada estación, las necesidades de los barrios
  function cierreCD(s) {
    if (!libs()) return;
    const mes = mesAhora(s); G.migrarCD(s);
    aplicaEfectos(s, MIN.revisar(s, mes).efectos);
    MIN.propuestas(s, mes, G.ministrosAyuda());
    if (PLAN) aplicaEfectos(s, PLAN.mes(s, mes, G.planAyuda()).efectos);
    for (const o of MIN.ordenes(s, mes)) ejecutaOrden(s, o);
    if (GOB() && mes % D.TURNO_MESES === 0) { const ay = G.gobAyuda(), ha = G.gobHacer(); for (const cid of GOB().ciudades(s)) if (s.cities[cid] && s.cities[cid].owner === 'roma') GOB().estacion(s, cid, mes, ay, ha); }   // CDe4: el gobernador actúa cada estación, antes de las necesidades para que el informe las incluya
    necesidadesEstacion(s, mes);
  }

  /* ----- necesidades de los barrios (CD5a) ----- */
  const celdaXZ = (x, z) => { const a = Math.max(0, Math.min(CI.N - 1, Math.floor((x - CI.X0) / CI.C))), b = Math.max(0, Math.min(CI.N - 1, Math.floor((z - CI.Z0) / CI.C))); return b * CI.N + a; };
  const casasDeE = E => { const r = []; for (const l of E.parcelas) if (l.casa && !l.casa.ruina && !l.fuera) r.push({ id: l.id, celda: celdaXZ(l.x, l.z), barrio: l.barrio }); return r; };
  const ciudadDeE = E => { const cs = G.state && G.state.cities; if (cs) for (const id in cs) { const r = regE.get(cs[id]); if (r && r.E === E) return cs[id]; } return null; };
  /* servicios de E para necesidades.js: [{id, tipo, celda}]. Piezas con el mismo id (fuente, granero, taller, termas, cloaca, medico, escuela, templo, mercado…) y,
     de lo heredado (templo, mercado, escuela sin pieza), un servicio en el primer barrio. */
  G.necServicios = function (E, c) {
    const out = []; if (!NEC || !E || !CI) return out; c = c || ciudadDeE(E);
    const tiene = {};
    for (const e of E.edificios) { if (e.obra || e.ruina || !NEC.SERVICIOS[e.tipo]) continue; out.push({ id: e.id, tipo: e.tipo, celda: celdaXZ(e.x, e.z) }); tiene[e.tipo] = true; }
    const b0 = E.barrios && E.barrios[0], her = (c && c.heredado) || {};
    if (b0 && typeof b0.x === 'number') for (const b of ['templo', 'mercado', 'escuela']) if ((her[b] || 0) > 0 && !tiene[b] && NEC.SERVICIOS[b]) out.push({ id: 'her-' + b, tipo: b, celda: celdaXZ(b0.x, b0.z) });
    return out;
  };
  const memoNec = new WeakMap();   // objeto ciudad -> { E, rev, alc, casas, red }: se recalcula al subir E.rev
  function necDatos(c) {
    if (!NEC || !CI) return null; const E = ELBAR(c); if (!E) return null;
    let m = memoNec.get(c);
    if (!m || m.E !== E || m.rev !== E.rev) {
      const casas = casasDeE(E), red = NEC.redDeCiudad(E), alc = NEC.calcularAlcances(red, G.necServicios(E, c), casas);
      m = { E, rev: E.rev, alc, casas, red }; memoNec.set(c, m);
    }
    const n = necDe(c); if (n.alc !== m.alc) Object.defineProperty(n, 'alc', { value: m.alc, writable: true, configurable: true, enumerable: false });   // alc no se guarda
    return m;
  }
  G.necAlcances = c => { const m = necDatos(c); return m ? m.alc : null; };
  const clasesBarrio = (c, m, i) => { const cl = G.clases(c), tot = m.casas.length || 1, k = m.casas.filter(x => x.barrio === i).length / tot; return { ple: cl.ple * k, ciu: cl.ciu * k, esc: cl.esc * k }; };
  const calcBarrio = (c, m, i) => {
    const cs = m.casas.filter(x => x.barrio === i), cob = NEC.coberturaBarrio(cs, m.alc.porCasa), dt = G.dieta(); if (dt && dt.cubre < 1) cob.alimento *= dt.cubre; const an = NEC.animo(cob, clasesBarrio(c, m, i));   // CDe3-F2a: lo que hay en los almacenes (grano, aceite, vino, verdura) decide cuánta comida llega
    return { cs, cob, an };
  };
  // para la ficha del barrio: lo ya medido y la memoria de descontento
  G.necBarrio = function (cid, i) {
    const c = G.state && G.state.cities[cid], m = c && c.owner === 'roma' ? necDatos(c) : null; if (!m) return null;
    const x = calcBarrio(c, m, i), mem = Object.assign(NEC.memoriaNueva(), necDe(c).mem[i] || {});
    return { cob: x.cob, animo: x.an, mem, nivel: NEC.nivelBarrio(x.cob) };
  };
  G.enRevuelta = c => !!(D.NEC_CASTIGOS && c && c.nec && Array.isArray(c.nec.mem) && c.nec.mem.some(m => m && m.revuelta));
  /* CDe2: parte de la ciudad (por casas) que está en revuelta y no paga impuestos; 0..1. Sin vista de barrios, toda la ciudad si hay revuelta. */
  G.revueltaParte = function (c) {
    if (!G.enRevuelta(c)) return 0; const m = necDatos(c); if (!m || !m.casas.length) return 1;
    let n = 0; for (const x of m.casas) { const k = c.nec.mem[x.barrio]; if (k && k.revuelta) n++; } return n / m.casas.length;
  };
  /* CDe2: estado a la vista de cada barrio (lo pinta city3d.js): 'revuelta', 'cae' (descontento) o 'sube' (el ánimo sube y está contento); null = normal */
  G.necEstados = function (cid) {
    const c = G.state && G.state.cities[cid]; if (!c || c.owner !== 'roma' || !c.nec || !Array.isArray(c.nec.mem)) return [];
    return c.nec.mem.map(k => !k ? null : k.revuelta ? 'revuelta' : k.desc > 0 ? 'cae' : k.sube ? 'sube' : null);
  };
  /* CDe2: «Encargar al ministro» desde la ficha del barrio. r = remedio de barrio-ui.js {necesidad, servicio, tipoJuego, ministro} */
  G.necEncargar = function (cid, r) {
    const s = G.state; if (!s || !libs() || !MIN) return { ok: false, motivo: 'Los ministros no están disponibles' };
    if (!r) return { ok: false, motivo: 'No hay remedio' };
    const serv = D.BUILD[r.servicio] ? r.servicio : D.BUILD[r.tipoJuego] ? r.tipoJuego : null;
    if (!serv) return { ok: false, motivo: (r.nombre || 'Esa obra') + ' no se encarga: constrúyela tú con «Construir la mejora»' };
    const res = MIN.remedio(s, { necesidad: r.necesidad, servicio: serv, ministro: r.ministro, casas: r.casas, ciudad: cid }, mesAhora(s));
    if (res.ok) { G.log('📜 Encargo al ministro: ' + D.BUILD[serv].n + ' en ' + D.CITIES[cid].n + '.', 'good'); emit('dirty'); }
    return res;
  };
  const FRASE_NEC = { hambre: 'pasa hambre', fiebres: 'sufre fiebres', se_van: 'se vacía', pierde_votos: 'pierde apoyos en el Senado', protesta: 'protesta en la calle', paran_obras: 'frena las obras' };
  /* ----- CDe4-CE5: tributo de guerra y cuentas del año ----- */
  const guerraAbierta = (s, mes) => {
    if ((s.marches || []).some(m => m.owner !== 'roma' || (s.cities[m.to] && s.cities[m.to].owner !== 'roma'))) return true;
    const pm = s.senado && s.senado.permisos; if (pm) for (const f in pm) if (pm[f] > mes) return true;
    return s.ultGuerra !== undefined && s.t - s.ultGuerra < 12;
  };
  function tributoPrimavera(s, mes) {
    const e = EA(); if (!e || !s.esteAno || !guerraAbierta(s, mes)) return;
    let botin = 0, ind = 0; const ant = s.esteAno.anterior;
    if (ant && ant.c) for (const id in ant.c) { const d = ant.c[id].denarios; if (d && d.entra) { botin += d.entra.botin || 0; ind += d.entra.indemnizacion || 0; } }
    let ciu = 0; for (const id of G.myCities()) ciu += G.clases(s.cities[id]).ciu;
    const t = e.tributoPrimavera({ hombresEnArmas: tropasTotal(s), ciudadanos: ciu, botinAnio: botin, indemnizacionAnio: ind, caja: G.disponible('denarios') });
    if (!(t.coste > 0)) return;
    if (t.suspendido) { s.tributo = { anio: anioN(s), estado: 'suspendido', t }; G.log('🏛️ Este año no hay tributo: el botín y las indemnizaciones pagan la guerra.', 'good'); return; }
    s.tributo = { anio: anioN(s), estado: 'pendiente', t };
    G.log('🏛️ Tributo de guerra: faltan ' + t.falta + ' denarios para pagar a las legiones. Decide cómo cubrirlos en «Este año».', 'bad'); emit('tributo', t);
  }
  // el tributo por decidir (el objeto de ESTEANO.tributoPrimavera) o null
  G.tributoPendiente = () => { const s = G.state, tp = s && s.tributo; return tp && tp.estado === 'pendiente' && tp.t ? tp.t : null; };
  // 'tributo' = cobrar a los ciudadanos (resta ánimo a plebe y Senado); 'caja' = pagarlo de la caja
  G.resolverTributo = function (op) {
    const s = G.state, tp = s && s.tributo; if (!tp || tp.estado !== 'pendiente' || !tp.t) return { ok: false, motivo: 'No hay tributo por decidir' };
    const t = tp.t, f = t.falta;
    if (op === 'tributo') {
      if (!t.opciones.tributo.posible) return { ok: false, motivo: 'No hay ciudadanos a quienes cobrar' };
      s.res.denarios += f; apunta(null, 'denarios', f, 'tributo'); gasta('denarios', f, true); apunta(null, 'denarios', -f, 'tributoGuerra');
      const h = t.opciones.tributo.humor || 0; if (h) G.favorAplica(h / 2, h / 2);
      tp.estado = 'cobrado'; G.log('🏛️ Cobras el tributo: ' + f + ' denarios de los ciudadanos' + (h ? '; el ánimo baja ' + Math.abs(h) : '') + '.', h ? 'bad' : '');
    } else if (op === 'caja') {
      if (G.disponible('denarios') < f) return { ok: false, motivo: 'La caja no alcanza (' + f + ' denarios)' };
      conGasto('tributoGuerra', null, () => gasta('denarios', f)); tp.estado = 'pagado'; G.log('🏛️ Pagas el tributo de la caja: ' + f + ' denarios.', '');
    } else return { ok: false, motivo: 'Opción desconocida' };
    emit('dirty'); return { ok: true };
  };
  // cuentas para la hoja «Este año»: ambito 'imperio' o el id de una ciudad. { anio, filas, adonde, guerra, faltan, todo }
  G.esteAnoCuentas = function (ambito) {
    const s = G.state, e = EA(); if (!s || !e || !s.esteAno) return null;
    const c = e.cuentas(s.esteAno.actual, s.esteAno.anterior), amb = ambito && ambito !== 'imperio' && s.cities[ambito] ? ambito : 'imperio', pc = c.porCiudad[amb] || {};   // una ciudad sin apuntes aún (año recién abierto) da cuentas vacías
    return { anio: c.anio, ambito: amb, filas: amb === 'imperio' ? c.imperio : (c.ciudades[amb] || []), adonde: amb === 'imperio' ? c.adonde : (pc.adonde || null), guerra: amb === 'imperio' ? c.guerra : (pc.guerra || null), faltan: c.faltan, todo: c };
  };

  /* ----- CDe4-MN3: el gobernador (copiado de gobierno/maquetas/gobernador/enganche.cjs; el sitio de la pieza, cerca de su barrio) ----- */
  G.gobAyuda = function () {
    const s = G.state;
    return {
      barrios: cid => { const E = G.ciudadE(cid); if (!E || !E.barrios) return []; return E.barrios.map((b, i) => { const x = G.necBarrio(cid, i); return x ? { i, nombre: b.nombre, casas: E.parcelas.filter(l => l.casa && !l.casa.ruina && !l.fuera && l.barrio === i).length, cob: x.cob, mem: x.mem } : null; }).filter(Boolean); },
      huecosLibres: cid => G.huecosLibres(s.cities[cid]), prod: () => G.prod(), disponible: r => G.disponible(r),
      obras: cid => s.cities[cid].obras.map(o => o.pieza || o.b)
    };
  };
  G.gobHacer = function () {
    return {
      calmar: (cid, i, r) => G.calmarRevuelta(cid, i, r),
      obra: (cid, tipo, info) => {
        if (CI && CI.EDIF && CI.EDIF[tipo]) {
          const E = G.ciudadE(cid); if (!E) return { ok: false, motivo: 'La ciudad aún no está dibujada' };
          const b = info && info.barrio != null && E.barrios ? E.barrios[info.barrio] : null;
          let p = null; if (tipo !== 'muelle' && b && typeof b.x === 'number') p = CI.mejorSitio(E, tipo, [b.x, b.z]);   // cerca del barrio que lo pide
          if (!p) p = mejorSitioG(E, tipo);
          return p ? G.colocar(cid, tipo, p[0], p[1]) : { ok: false, motivo: 'No hay sitio' };
        }
        return { ok: !!G.upgrade(cid, tipo), motivo: G.ultimoMotivo || 'Faltan recursos' };
      },
      encargar: (mid, e) => (libs() && MIN ? MIN.encargar(G.state, mid, e) : { ok: false, motivo: 'Los ministros no están disponibles' })
    };
  };

  function necesidadesEstacion(s, mes) {
    if (!NEC || !CI || mes % D.TURNO_MESES !== 0) return;
    for (const id of G.myCities()) {
      const c = s.cities[id], m = necDatos(c); if (!m || !m.casas.length) continue;
      const nom = D.CITIES[id].n, mem = necDe(c).mem, hechos = {}; let dichos = 0;   // CDe2: votos, protesta y obras cuentan una vez por ciudad y estación (no por barrio)
      m.E.barrios.forEach((b, i) => {
        const x = calcBarrio(c, m, i); if (!x.cs.length) return;
        const r = NEC.estacion(mem[i], x.cob, x.an), share = x.cs.length / m.casas.length, nb = (b && b.nombre) || ('barrio ' + (i + 1));
        r.mem.sube = typeof (mem[i] || {}).an === 'number' && x.an >= 60 && x.an > mem[i].an + 3; r.mem.an = x.an;   // CDe2: andamios si mejora
        mem[i] = r.mem;
        for (const su of r.sucesos) {
          if (su.tipo === 'revuelta') G.log(D.NEC_CASTIGOS ? '✊ ' + nom + ', ' + nb + ': revuelta de la plebe. No paga impuestos hasta que la calmes (tropas, grano o juegos).' : '✊ ' + nom + ', ' + nb + ': la plebe amenaza con sublevarse. Le faltan servicios.', 'bad');
          else if (su.tipo === 'consecuencia' && !D.NEC_CASTIGOS) { if (dichos++ < 2) G.log('🏘️ ' + nom + ', ' + nb + ': ' + (FRASE_NEC[su.efecto] || su.efecto) + '.', 'bad', true); }   // CDe1: solo aviso hasta CD5b (D.NEC_CASTIGOS)
          else if (su.tipo === 'consecuencia') {
            const ef = su.efecto, baja = ef === 'hambre' || ef === 'fiebres' || ef === 'se_van', perdida = baja ? Math.ceil((c.pop || 0) * D.NEC_PERDIDA * share) : 0;
            if (baja && hechos['baja' + i]) continue;   // CDe2: una sola pérdida de vecinos por barrio y estación (la de la necesidad peor)
            if (baja) { c.pop = Math.max(G.MIN_POP, (c.pop || 0) - perdida); hechos['baja' + i] = true; }
            else if (hechos[ef]) continue;
            else if (ef === 'pierde_votos') hum3(-1);
            else if (ef === 'protesta') G.favorAplica(0, -1);
            else if (ef === 'paran_obras') G.favorAplica(0, -0.5);
            hechos[ef] = true;
            if (dichos++ < 2) G.log('🏘️ ' + nom + ', ' + nb + ': ' + (FRASE_NEC[ef] || ef) + (baja && perdida ? ' (-' + perdida + ')' : '') + '.', 'bad', true);
          }
        }
      });
    }
  }
  // calmar una revuelta: 'tropas' (sin coste, pide guarnición), 'grano' (grano) o 'juegos' (denarios, como los juegos del Foro)
  G.calmarRevuelta = function (cid, iBarrio, remedio) {
    const s = G.state, c = s && s.cities[cid]; if (!NEC) return { ok: false, motivo: 'Sin necesidades de barrio' };
    if (!c || c.owner !== 'roma') return { ok: false, motivo: 'La ciudad no es tuya' };
    const mem = necDe(c).mem, m = mem[iBarrio]; if (!m || !m.revuelta) return { ok: false, motivo: 'El barrio no está en revuelta' };
    if (!NEC.REMEDIOS_REVUELTA.includes(remedio)) return { ok: false, motivo: 'Ese remedio no existe. Prueba con tropas, grano o juegos.' };
    const dm = necDatos(c), share = dm && dm.casas.length ? dm.casas.filter(x => x.barrio === iBarrio).length / dm.casas.length : 1;
    const pob = Math.max(1, Math.round((c.pop || 0) * share));
    let coste = null;
    if (remedio === 'tropas') { const men = G.men(c.units || {}), pide = Math.max(10, Math.ceil(pob * 0.05)); if (men < pide) return { ok: false, motivo: 'Faltan tropas en la ciudad: hacen falta ' + pide + ' hombres de guarnición' }; }
    else if (remedio === 'grano') { coste = { grano: Math.max(20, Math.ceil(pob * 0.5)) }; if (!G.canAfford(coste)) return { ok: false, motivo: 'Falta grano: ' + coste.grano }; }
    else { coste = { denarios: D.SENADO.juegos.denarios }; if (!G.canAfford(coste)) return { ok: false, motivo: 'Faltan denarios: ' + coste.denarios }; }
    const r = NEC.calmar(m, remedio); if (!r.ok) return { ok: false, motivo: r.texto };
    if (coste) for (const k in coste) gasta(k, coste[k]);
    mem[iBarrio] = r.mem; if (remedio === 'juegos') G.senadoActo('juegos', cid);
    const b = dm && dm.E.barrios[iBarrio]; G.log('🕊️ ' + D.CITIES[cid].n + (b && b.nombre ? ', ' + b.nombre : '') + ': ' + r.texto, 'good'); emit('dirty');
    return { ok: true, motivo: '', texto: r.texto, coste };
  };

  /* ---------- CDe3-F2a: agricultura por suelos (js/agricultura.js, ESM) y mercado de los recursos (js/mercado.js) ----------
     Las reglas viven en esos dos módulos (sin pantalla); aquí se enganchan a la economía. Sin ellos todo sigue como antes.
     Guardado: s.agro = { v, n, parcelas: [{ id, ciudad, campo, suelo, nivel, mejoras, granja?, pieza? }] }, s.mercado (lo escribe MERCADO)
     y las existencias en s.bienes (aceite, vino, verdura y lana junto a los bienes de siempre).
     GRANO: la granja de siempre es el campo de trigo base y sigue dando su grano en G.prod (la ayuda de la mano de obra, el reparto y la ciencia no cambian).
     Su parcela (granja: true) solo suma al cierre lo que añaden sus mejoras. Los campos de trigo nuevos suman su grano al cierre de mes (en 12 meses). */
  G.usarAgricultura = m => { AGRO = m || null; };
  G.usarMercado = m => { MERC = m || null; };
  G.hayAgricultura = () => !!AGRO;
  G.hayMercado = () => !!merc();
  const BIENES_AGRO = ['aceite', 'vino', 'verdura', 'lana'];
  const propiasDe = s => Object.keys(s.cities).filter(id => s.cities[id].owner === 'roma');
  const agroDe = s => { if (!s.agro || typeof s.agro !== 'object' || !Array.isArray(s.agro.parcelas)) AGRO.migrar(s); if (typeof s.agro.n !== 'number') s.agro.n = s.agro.parcelas.length; return s.agro; };
  /* suelo de un punto de la ciudad nueva: pendiente, cara al sol y agua cercana (la misma regla que dibuja los campos en js/gfx/campos.js) */
  G.sueloEn = function (x, z) {
    if (!AGRO || !CI || !CI.altura) return 'llano';
    const h = CI.altura, d = 14, gx = (h(x + d, z) - h(x - d, z)) / (2 * d), gz = (h(x, z + d) - h(x, z - d)) / (2 * d), g = Math.hypot(gx, gz);
    const sz = g > 1e-6 ? -gz / g : 0, solana = Math.max(0, Math.min(1, 0.45 + 0.5 * sz));
    return AGRO.clasificarSuelo({ pend: g, distAgua: CI.distRio(x, z), altAgua: h(x, z) - CI.NIVEL_RIO, solana, pobre: false });
  };
  /* una parcela de trigo por cada granja de la ciudad (la granja existente pasa a ser un campo de trigo en su suelo). Sin la ciudad nueva abierta, una sola con el nivel de c.b.granja */
  G.sincGranjas = function (s, sinAbrir) {
    if (!AGRO || !s) return; const A = agroDe(s);
    for (const id of propiasDe(s)) {
      const c = s.cities[id], r0 = CI ? regE.get(c) : null, r = CI && (sinAbrir ? (r0 ? info(c) : null) : infoC(c));
      const piezas = r && r.E ? r.E.edificios.filter(e => e.tipo === 'granja' && !e.obra && !e.ruina) : null, mias = A.parcelas.filter(p => p.ciudad === id && p.granja);
      if (piezas) {
        for (const p of mias) if (!p.pieza || !piezas.some(e => e.id === p.pieza)) A.parcelas.splice(A.parcelas.indexOf(p), 1);
        for (const e of piezas) {
          let p = A.parcelas.find(q => q.ciudad === id && q.granja && q.pieza === e.id);
          if (!p) { p = { id: 'a' + (++A.n), ciudad: id, campo: 'trigo', suelo: G.sueloEn(e.x, e.z), nivel: 1, mejoras: [], granja: true, pieza: e.id }; A.parcelas.push(p); }
          p.nivel = Math.max(1, Math.min(5, 1 + (e.mejora || 0)));
        }
      } else if (!mias.length) { if ((c.b.granja || 0) >= 1) A.parcelas.push({ id: 'a' + (++A.n), ciudad: id, campo: 'trigo', suelo: 'llano', nivel: Math.max(1, Math.min(5, c.b.granja)), mejoras: [], granja: true, pieza: null }); }
      else for (const p of mias) p.nivel = Math.max(1, Math.min(5, c.b.granja || 1));
    }
    A.parcelas = A.parcelas.filter(p => s.cities[p.ciudad] && s.cities[p.ciudad].owner === 'roma');
  };
  G.migrarAgro = function (s) {
    if (!s) return s;
    if (!s.bienes || typeof s.bienes !== 'object') s.bienes = {};
    if (AGRO) {
      AGRO.migrar(s); agroDe(s); G.sincGranjas(s, true);
      /* CDe3-F2c: cada ciudad tuya empieza con un huerto junto al agua y un pasto en tierra baja, además del trigo (una sola vez) */
      const A = s.agro; if (!A.inicio) { A.inicio = 1; for (const id of propiasDe(s)) for (const [campo, suelo] of [['huerto', 'ribera'], ['pasto', 'baja']]) if (!A.parcelas.some(p => p.ciudad === id && p.campo === campo) && A.parcelas.filter(p => p.ciudad === id).length < G.parcelasMax(id)) A.parcelas.push({ id: 'a' + (++A.n), ciudad: id, campo, suelo, nivel: 1, mejoras: [] }); }
    }
    const M = merc();
    if (M) { M.migrar(s); if (Array.isArray(s.rutas) && s.rutas.length) s.rutas = []; }   // las rutas viejas ya son rutas del mercado nuevo
    return s;
  };
  /* lo que dan en un mes las parcelas de una ciudad: el grano de la granja de siempre no se cuenta dos veces */
  G.agroProduccion = function (s, cid, mes) {
    const out = { grano: 0, aceite: 0, vino: 0, verdura: 0, lana: 0 }; if (!AGRO || !s.agro || !Array.isArray(s.agro.parcelas)) return out;
    const pc = AGRO.produccionCiudad(s, cid, mes);
    for (const k in out) out[k] = pc[k] || 0;
    for (const p of s.agro.parcelas) if (p.ciudad === cid && p.granja) out.grano -= AGRO.produccionMes(Object.assign({}, p, { mejoras: [] }), mes, []).grano || 0;
    out.grano = Math.max(0, out.grano); return out;
  };
  const hayBodega = s => !!(s.agro && s.agro.parcelas.some(p => (p.mejoras || []).includes('bodega')));
  /* aplica lo que devuelve el mercado: denarios y bienes (entran o salen) */
  function aplicaDelta(s, d) {
    for (const k in d || {}) {
      const v = d[k]; if (!v) continue;
      if (k in s.res) { if (v < 0) gasta(k, -v, true); else s.res[k] += v; }
      else { const b = s.bienes || (s.bienes = {}); b[k] = Math.max(0, (b[k] || 0) + v); }
    }
  }
  /* bocas del mes en equivalente de grano: la ración de la gente y la paga de las tropas (sin llamar a G.prod, que puede llamar aquí) */
  function bocasMes(s) {
    let t = 0;
    for (const id of propiasDe(s)) { const c = s.cities[id]; t += (c.pop || 0) * 0.02 * G.racionDe(c).grano; for (const k in c.units) t += c.units[k] * D.UNITS[k].up; }
    return Math.max(1, t);
  }
  let memoDieta = null;
  /* qué come la ciudad: AGRO.dieta con las existencias y las bocas de un mes; cubre = 1 si hay para un mes */
  G.dieta = function () {
    const s = G.state; if (!AGRO || !s || !s.res) return null; const b = s.bienes || {};
    const st = { grano: Math.max(0, s.res.grano) + (s.alm.grano || 0), aceite: b.aceite || 0, vino: b.vino || 0, verdura: b.verdura || 0 }, k = mesAhora(s) + '|' + Object.values(st).map(Math.floor).join('|');
    if (memoDieta && memoDieta.s === s && memoDieta.k === k) return memoDieta.v;
    const v = AGRO.dieta(st, bocasMes(s)); memoDieta = { s, k, v }; return v;
  };
  G.dietaTexto = () => { const d = G.dieta(); return d ? d.texto : ''; };
  G.mercadoAyuda = function () {
    const s = G.state, B = s.bienes || (s.bienes = {});
    const ay = {
      tiene: p => p === 'denarios' ? G.disponible('denarios') : p in s.res ? G.disponible(p) : Math.floor(B[p] || 0),
      cabe: p => p in s.res ? Math.max(0, G.capDe(p) - s.res[p] - ((s.alm && s.alm[p]) || 0)) : Math.max(0, D.BIEN_TOPE - (B[p] || 0)),   // ES20: una sola reserva (lo que no cabe se perdería)
      travel: (a, b) => G.travel(a, b),
      esMar: (a, b) => { const e = G.edge(a, b); return e ? !!e[2] : !!(D.CITIES[a].sea && D.CITIES[b].sea); },
      enGuerra: f => G.hayGuerraCon(f),
      votar: (fav, con) => { const h = G.humores ? G.humores() : null; if (!h) return fav.length > con.length; const m = l => l.reduce((a, x) => a + (typeof h[x] === 'number' ? h[x] : 50), 0) / (l.length || 1); return m(fav) >= 45 && m(fav) >= m(con) - 20; },
      existencias: () => Object.assign({}, B, { grano: Math.max(0, s.res.grano) + (s.alm.grano || 0), materiales: Math.max(0, s.res.materiales) + (s.alm.materiales || 0), hierro: Math.max(0, s.res.hierro) + (s.alm.hierro || 0), consumoGrano: bocasMes(s) })
    };
    if (AGRO) { ay.produccion = (c, mes) => G.agroProduccion(s, c, mes); ay.perdida = (p, c) => AGRO.perdidaMes(p, hayBodega(s) ? ['bodega'] : []); }
    return ay;
  };
  function cierreAgro(s, mes) {
    const M = merc(); if (!AGRO && !M) return;
    const b = s.bienes || (s.bienes = {});
    if (AGRO) {
      G.sincGranjas(s);
      for (const id of propiasDe(s)) {
        const p = G.agroProduccion(s, id, mes);
        if (p.grano > 0) { s.res.grano += p.grano; s.gan.grano += p.grano; }
        for (const k of BIENES_AGRO) if (p[k] > 0) b[k] = (b[k] || 0) + p[k];
      }
      if (!M) for (const k of BIENES_AGRO) { const q = Math.floor((b[k] || 0) * AGRO.perdidaMes(k, hayBodega(s) ? ['bodega'] : [])); if (q > 0) b[k] -= q; }   // sin mercado, la pérdida mensual la aplica el juego
    }
    if (M) {
      const r = M.mes(s, G.mercadoAyuda()); aplicaDelta(s, r.delta);
      for (const a of r.avisos || []) G.log('⚖️ ' + a.texto, a.tono === 'bueno' ? 'good' : a.tono === 'malo' ? 'bad' : '', true);
    }
  }
  /* ----- comercio: precios por ciudad, rutas que van solas, viajes a mano y contratos del Senado (MERCADO). Todos devuelven { ok, motivo } ----- */
  G.mercadoPuede = cid => { const M = merc(), s = G.state; if (!M || !s || !s.cities[cid]) return 'El mercado nuevo no está disponible'; return M.puedeComerciar(s, cid, G.mercadoAyuda()); };
  G.mercadoTabla = function (cid) {
    const M = merc(), s = G.state; if (!M || !s || !s.cities[cid]) return [];
    const ay = G.mercadoAyuda();
    return M.tabla(s, cid, ay).map(r => Object.assign({}, r, { existencias: ay.tiene(r.prod) }));
  };
  const opMercado = (cid, prod, n, vende) => {
    const M = merc(), s = G.state; if (!M || !s) return { ok: false, motivo: 'El mercado nuevo no está disponible', delta: {}, precioMedio: 0 };
    const mal = G.mercadoPuede(cid); if (mal) return { ok: false, motivo: mal, delta: {}, precioMedio: 0 };
    const r = vende ? M.vender(s, cid, prod, n, G.mercadoAyuda()) : M.comprar(s, cid, prod, n, G.mercadoAyuda());
    if (r.ok) { aplicaDelta(s, r.delta); emit('dirty'); }
    return { ok: r.ok, motivo: r.motivo, delta: r.delta, precioMedio: r.precioMedio };
  };
  G.mercadoComprar = (cid, prod, n) => opMercado(cid, prod, n, false);
  G.mercadoVender = (cid, prod, n) => opMercado(cid, prod, n, true);
  /* la mejor ciudad tuya con mercado para vender (la que más paga) o comprar (la que menos cobra) un producto */
  G.mercadoMejorCiudad = function (prod, vende) {
    const M = merc(), s = G.state; if (!M || !s) return null; const ay = G.mercadoAyuda(); let mejor = null, pm = 0;
    for (const id of propiasDe(s)) { if (M.puedeComerciar(s, id, ay)) continue; const p = M.precio(s, id, prod, ay); if (mejor === null || (vende ? p > pm : p < pm)) { mejor = id; pm = p; } }
    return mejor;
  };
  G.rutaCrear = function (a, b, prod, cargas) {
    const M = merc(), s = G.state; if (!M || !s) return { ok: false, motivo: 'El mercado nuevo no está disponible' };
    const r = M.rutaCrear(s, { a, b, prod, cargas }, G.mercadoAyuda());
    if (r.ok) { if (D.SENADO.sala) G.senadoActo('ruta', b); else if (MIN) { libs(); MIN.acto(s, 'ruta', b); } G.log('⚖️ Ruta comercial de ' + (D.CITIES[a].n) + ' a ' + D.CITIES[b].n + '.', 'good'); emit('dirty'); }
    return r;
  };
  G.rutaQuitar = function (id) { const M = merc(), s = G.state; if (!M || !s) return { ok: false, motivo: 'El mercado nuevo no está disponible' }; const ok = M.rutaQuitar(s, id); if (ok) emit('dirty'); return { ok, motivo: ok ? '' : 'Esa ruta no existe' }; };
  G.viajeLanzar = function (a, b, prod, cargas) {
    const M = merc(), s = G.state; if (!M || !s) return { ok: false, motivo: 'El mercado nuevo no está disponible' };
    const r = M.viajeLanzar(s, { a, b, prod, cargas }, G.mercadoAyuda());
    if (r.ok) { aplicaDelta(s, r.delta); emit('dirty'); }
    return { ok: r.ok, motivo: r.motivo, viaje: r.viaje };
  };
  G.contratoProponer = function (id, op) {
    const M = merc(), s = G.state; if (!M || !s) return { ok: false, aprobado: false, motivo: 'El mercado nuevo no está disponible' };
    const r = M.contratoProponer(s, id, op, G.mercadoAyuda());
    if (r.ok) { G.log(r.aprobado ? '📜 El Senado aprueba: ' + M.CONTRATOS[id].n + '.' : '📜 El Senado rechaza: ' + M.CONTRATOS[id].n + '.', r.aprobado ? 'good' : 'bad'); emit('dirty'); }
    return r;
  };
  /* CE4b: contratos públicos de publicanos, casas rivales y aduana propia. Cifras: licencia de juego */
  G.publicanosVer = () => { const M = merc(), s = G.state; return M && s && M.publicanosVer ? M.publicanosVer(s, G.mercadoAyuda()) : { ofertas: [], aceptados: [] }; };
  G.rivalesVer = () => { const M = merc(), s = G.state; return M && s && M.rivalesVer ? M.rivalesVer(s, G.mercadoAyuda()) : []; };
  G.aduanasVer = () => { const M = merc(), s = G.state; return M && s && M.aduanasVer ? M.aduanasVer(s, G.mercadoAyuda()) : []; };
  G.publicanoPujar = function (id) {
    const M = merc(), s = G.state; if (!M || !s || !M.publicanoAceptar) return { ok: false, motivo: 'El mercado nuevo no está disponible' };
    const r = M.publicanoAceptar(s, id, G.mercadoAyuda()); if (r.ok) { aplicaDelta(s, r.delta); G.log('📜 Aceptas un contrato de los censores: dejas la fianza.', 'good'); emit('dirty'); } return r;
  };
  G.publicanoEntregar = function (id, n) {
    const M = merc(), s = G.state; if (!M || !s || !M.publicanoEntregar) return { ok: false, motivo: 'El mercado nuevo no está disponible' };
    const r = M.publicanoEntregar(s, id, n, G.mercadoAyuda()); if (r.ok) { aplicaDelta(s, r.delta); for (const a of r.avisos || []) G.log('📜 ' + a.texto, a.tono === 'malo' ? 'bad' : 'good'); emit('dirty'); } return r;
  };
  G.aduanaFijar = function (cid, tasa) { const M = merc(), s = G.state; if (!M || !s || !M.portoriumFijar) return false; const ok = M.portoriumFijar(s, cid, tasa); if (ok) emit('dirty'); return ok; };
  G.mercadoConsejo = () => { const M = merc(), s = G.state; return M && s ? M.consejo(s, G.mercadoAyuda()) : null; };
  G.rutasMercado = () => { const s = G.state; return s && s.mercado && Array.isArray(s.mercado.rutas) ? s.mercado.rutas : []; };
  G.rutasTotal = s => ((s && s.rutas) || []).length + (s && s.mercado && Array.isArray(s.mercado.rutas) ? s.mercado.rutas.length : 0);
  /* ----- campos: familia Agricultura de D.BUILD (agri_*). No suben de nivel: se plantan en el suelo y viven en s.agro ----- */
  G.parcelasMax = cid => { const c = G.state && G.state.cities[cid]; return c ? 2 + 2 * Math.max(1, c.b.foro || 1) : 0;   /* licencia de juego */ };
  G.parcelas = function (cid) {
    const s = G.state; if (!AGRO || !s || !s.cities[cid]) return [];
    return agroDe(s).parcelas.filter(p => p.ciudad === cid).map(p => {
      const e = AGRO.encaje(p.campo, p.suelo, p.mejoras || []), mj = AGRO.mejorasDe(p.campo);
      return Object.assign({}, p, { mejoras: (p.mejoras || []).slice(), nombre: AGRO.CAMPOS[p.campo].nombre, produce: AGRO.CAMPOS[p.campo].produce, anual: AGRO.produccionAnual(p), nota: e.nota, razon: e.razon, posibles: mj.filter(m => AGRO.puedeMejorar(p, m, G.saberesHechos()).ok) });
    });
  };
  /* ids de los saberes hechos (para saber qué campos y mejoras abre la ciencia) */
  G.saberesHechos = function () { const h = G.state && G.state.inv && G.state.inv.hechas; return h ? Object.keys(h).filter(k => h[k]) : []; };
  /* ¿está abierto un campo, mejora o la villa? → { ok, motivo } (motivo: «Hace falta el saber …») */
  G.agroAbierto = function (id) { if (!AGRO) return { ok: false, motivo: 'La agricultura nueva no está disponible' }; const a = AGRO.abierto(id, G.saberesHechos()); return { ok: a.ok, motivo: a.ok ? '' : a.motivo.replace(/\.$/, '').replace('Hace falta el saber', 'Hace falta') }; };
  G.hayVilla = cid => !!(G.state && G.state.agro && G.state.agro.villas && G.state.agro.villas[cid]);
  G.construirVilla = function (cid) {
    const s = G.state, c = s && s.cities[cid]; if (!AGRO || !s) return { ok: false, motivo: 'La agricultura nueva no está disponible' };
    if (!c || c.owner !== 'roma') return { ok: false, motivo: 'La ciudad no es tuya' };
    const ab = G.agroAbierto('villa'); if (!ab.ok) return ab;
    const A = agroDe(s); if (!A.villas) A.villas = {}; if (A.villas[cid]) return { ok: false, motivo: 'Ya hay una villa en la ciudad' };
    const k = AGRO.EDIFICIOS.villa.coste; if (!G.canAfford(k)) { const f = Object.keys(k).filter(r => G.disponible(r) < k[r]).map(r => D.RES_NOM[r].toLowerCase()); return { ok: false, motivo: 'Faltan ' + f.join(' y ') }; }
    for (const r in k) gasta(r, k[r]);
    A.villas[cid] = 1; G.log('🌱 ' + D.CITIES[cid].n + ': villa con capataz; los campos rinden más.', 'good'); emit('dirty');
    return { ok: true, motivo: '' };
  };
  G.consejoCampo = function (suelo) {
    if (!AGRO) return [];
    return AGRO.consejo(suelo, [], G.saberesHechos()).map(x => Object.assign({ nombre: AGRO.CAMPOS[x.campo].nombre, produce: AGRO.CAMPOS[x.campo].produce, razon: AGRO.encaje(x.campo, suelo).razon, coste: G.cost('agri_' + x.campo, 0) }, x));
  };
  const pagaObra = (b, motivo) => { const k = G.cost(b, 0); if (!G.canAfford(k)) { const f = Object.keys(k).filter(r => G.disponible(r) < k[r]).map(r => D.RES_NOM[r].toLowerCase()); return { ok: false, motivo: 'Faltan ' + f.join(' y ') }; } for (const r in k) gasta(r, k[r]); return { ok: true, motivo: motivo || '' }; };
  /* planta un campo: en un suelo nuevo (sueloOParcela es un suelo) o cambia el campo de una parcela que ya tienes (es el id de la parcela).
     «no» impide plantar (con la razón); «mal» planta y devuelve un aviso */
  G.plantarCampo = function (cid, campo, sueloOParcela) {
    const s = G.state, c = s && s.cities[cid]; if (!AGRO || !s) return { ok: false, motivo: 'La agricultura nueva no está disponible' };
    if (!c || c.owner !== 'roma') return { ok: false, motivo: 'La ciudad no es tuya' };
    if (!AGRO.CAMPOS[campo] || !D.BUILD['agri_' + campo]) return { ok: false, motivo: 'Ese campo no existe' };
    const ab = G.agroAbierto(campo); if (!ab.ok) return ab;
    const A = agroDe(s); let par = null, suelo = sueloOParcela;
    if (!AGRO.SUELOS[suelo]) { par = A.parcelas.find(p => p.id === sueloOParcela && p.ciudad === cid); if (!par) return { ok: false, motivo: 'Ese suelo o parcela no existe' }; suelo = par.suelo; if (par.granja) return { ok: false, motivo: 'Es la granja de la ciudad: su campo de trigo no se cambia' }; if (par.campo === campo) return { ok: false, motivo: 'Ya es ' + AGRO.CAMPOS[campo].art + ' ' + AGRO.CAMPOS[campo].nombre.toLowerCase() }; }
    else if (A.parcelas.filter(p => p.ciudad === cid).length >= G.parcelasMax(cid)) return { ok: false, motivo: 'No caben más campos: sube el Foro' };
    const mejoras = par ? (par.mejoras || []).filter(m => AGRO.MEJORAS[m] && AGRO.MEJORAS[m].campo === campo) : [], e = AGRO.encaje(campo, suelo, mejoras);
    if (e.nota === 'no') return { ok: false, motivo: e.razon };
    const pg = pagaObra('agri_' + campo); if (!pg.ok) return pg;
    if (par) { par.campo = campo; par.mejoras = mejoras; delete par.granja; delete par.pieza; }
    else { par = { id: 'a' + (++A.n), ciudad: cid, campo, suelo, nivel: 1, mejoras: [] }; A.parcelas.push(par); }
    G.log('🌱 ' + D.CITIES[cid].n + ': ' + AGRO.CAMPOS[campo].nombre.toLowerCase() + ' ' + AGRO.SUELOS[suelo].en + '.', 'good'); emit('dirty');
    return { ok: true, motivo: '', aviso: e.nota === 'mal' ? e.razon : '', parcela: par.id, nota: e.nota };
  };
  G.mejorarParcela = function (cid, parcelaId, mejora) {
    const s = G.state, c = s && s.cities[cid]; if (!AGRO || !s) return { ok: false, motivo: 'La agricultura nueva no está disponible' };
    if (!c || c.owner !== 'roma') return { ok: false, motivo: 'La ciudad no es tuya' };
    const par = agroDe(s).parcelas.find(p => p.id === parcelaId && p.ciudad === cid); if (!par) return { ok: false, motivo: 'Esa parcela no existe' };
    const q = AGRO.puedeMejorar(par, mejora, G.saberesHechos()); if (!q.ok) return q;
    const pg = pagaObra('agri_' + mejora); if (!pg.ok) return pg;
    par.mejoras = (par.mejoras || []).concat(mejora); G.log('🌱 ' + D.CITIES[cid].n + ': ' + AGRO.MEJORAS[mejora].nombre.toLowerCase() + '.', 'good'); emit('dirty');
    return { ok: true, motivo: '' };
  };
  /* para el Edil del grano: parcelas de la ciudad y huecos libres (uno por suelo conocido) */
  G.agroEstado = function (cid) {
    const s = G.state, c = s && s.cities[cid]; if (!AGRO || !c) return null;
    const ps = G.parcelas(cid), suelos = [...new Set(ps.map(p => p.suelo).concat(['llano']))], libres = [];
    for (let i = ps.length; i < G.parcelasMax(cid) && libres.length < suelos.length; i++) libres.push({ id: 'libre-' + suelos[libres.length], suelo: suelos[libres.length] });
    return { parcelas: ps, libres };
  };

  G.wipe = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ } };

  root.Game = G;
  if (typeof module !== 'undefined') { module.exports = G; try { G.usarCiudad(require('./ciudad.js')); } catch (e) { /* sin ciudad nueva: el juego sigue con números */ } try { G.usarNecesidades(require('./necesidades.js')); } catch (e) { /* sin necesidades de barrio */ } try { G.usarAgricultura(require('./agricultura.js')); } catch (e) { /* sin agricultura por suelos */ } }
})(typeof window !== 'undefined' ? window : globalThis);
