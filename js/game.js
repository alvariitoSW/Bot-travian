/* AQVILA — lógica de campaña: economía, ciudades, marchas, IA enemiga, hechos históricos */
(function (root) {
  const D = root.DATA;
  const G = { state: null, onEvent: null };
  const SAVE_KEY = 'aqvila-save-v1';
  const emit = (type, p) => { if (G.onEvent) G.onEvent(type, p); };
  const sum = o => { let n = 0; for (const k in o) n += o[k]; return n; };

  // General con nombre que defiende una ciudad en un año (a.C., bajan): entre `from` (opcional) y `until`
  G.cityGen = (id, year) => { const d = D.CITIES[id], g = d && d.gen; return g && year >= g.until && (!g.from || year <= g.from) ? g : null; };
  G.yearOf = t => D.START_YEAR - Math.floor(t / 12);
  G.dateStr = t => D.MONTHS[Math.floor(t) % 12] + ' · ' + G.yearOf(t) + ' a.C.';
  G.rate = L => L <= 0 ? 0 : Math.round(14 * L * Math.pow(1.15, L - 1));
  G.cost = function (b, L) { const o = {}, base = D.BUILD[b].cost; for (const r in base) o[r] = Math.round(base[r] * Math.pow(1.5, L) / 5) * 5; return o; };
  G.buildTime = (city, b) => D.BUILD[b].time * Math.pow(1.35, city.b[b] || 0) * (1 - 0.04 * (city.b.foro || 0)) * G.bonoMul('obra');
  G.myCities = () => Object.keys(G.state.cities).filter(id => G.state.cities[id].owner === 'roma');
  /* ---------- solares y tipos de ciudad (I4) ---------- */
  /* ---------- templos a un dios (F5) y ciudades conquistadas ---------- */
  G.diosDe = c => ((c.b.templo || 0) > 0 || G.obraDe(c, 'templo')) && D.DIOSES[c.dios] ? D.DIOSES[c.dios] : null;
  G.diosNivel = c => G.diosDe(c) ? (c.b.templo || 0) : 0;
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
    const coste = G.tipoCoste(c); if (G.disponible('oro') < coste) return false;
    gasta('oro', coste); c.tipo = tipo; c.tipoElegido = true; return true;
  };
  // tira un edificio urbano propio a nivel 0 (sin devolver nada) y libera su solar
  G.derribar = function (cid, b) {
    const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.BUILD[b] || !D.BUILD[b].solar || b === 'foro' || (c.b[b] || 0) < 1 || G.obraDe(c, b)) return false;
    const pz = piezaDe(b), r = pz && infoC(c);
    if (r) { const e = menorMejora(r.E, pz); if (!e) return false; quitar(r.E, e.id); sinc(c, r); ponerDatos(c, r); }
    else c.b[b] = 0;
    const pc = G.popCap(c); if (c.pop > pc) c.pop = pc; return true;
  };
  G.cap = () => { let c = 0; for (const id of G.myCities()) c += 600 * Math.pow(1.45, G.state.cities[id].b.almacen || 0); return Math.round(c); };
  G.men = units => { let n = 0; for (const k in units) n += units[k] * (D.UNITS[k].cls === 'ele' ? 1 : 1); return n; };
  G.power = units => { let p = 0; for (const k in units) { const u = D.UNITS[k]; p += units[k] * (u.atk + u.def) * (u.hp || 1) * (u.mass ? 1.6 : 1); } return Math.round(p / 10); };
  G.lugar = id => D.CITIES[id] || (D.COLONIAS && D.COLONIAS[id]) || null;   // ficha de ciudad o de sitio de colonia (n, lon, lat)
  const esSitio = id => !D.CITIES[id] && !!(D.COLONIAS && D.COLONIAS[id]);
  G.pos = id => { const c = G.lugar(id); return D.proj(c.lon, c.lat); };
  G.regionId = () => (G.state && G.state.region && D.REGIONES[G.state.region]) ? G.state.region : 'mediterraneo';
  G.region = () => D.REGIONES[G.regionId()];
  G.ciudadesRegion = () => D.regionCiudades(G.regionId());
  let aristasC = null;
  G.aristas = () => { const id = G.regionId(), r = G.region(); if (!aristasC || aristasC.id !== id || aristasC.r !== r) aristasC = { id: id, r: r, e: D.regionEdges(id) }; return aristasC.e; };
  G.edge = (a, b) => (esSitio(a) || esSitio(b)) ? ((G.lugar(a) && G.lugar(b)) ? [a, b, false] : undefined) : G.aristas().find(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));   // con un sitio: arista sintética por distancia
  G.neighbors = id => G.aristas().filter(e => e[0] === id || e[1] === id).map(e => e[0] === id ? e[1] : e[0]);
  /* ---------- caja del mes y almacén (Q2) ----------
     s.res = caja del mes (lo gastable); s.alm = almacén; s.cuarto[r] = lo que aún se puede sacar del almacén este mes. */
  const cuartoDisp = r => { const s = G.state; return Math.max(0, Math.min((s.cuarto && s.cuarto[r]) || 0, (s.alm && s.alm[r]) || 0)); };
  G.disponible = r => Math.max(0, G.state.res[r] || 0) + cuartoDisp(r);
  // gasta n de r: primero la caja, luego el cuarto del almacén
  function gasta(r, n, sinCuenta) { const s = G.state, de = Math.min(n, Math.max(0, s.res[r])); if (!sinCuenta && s.gastoMes) s.gastoMes[r] = (s.gastoMes[r] || 0) + de; /* solo cuenta lo salido de la caja */ s.res[r] -= de; const resto = n - de; if (resto > 0) { s.alm[r] = Math.max(0, s.alm[r] - resto); s.cuarto[r] = Math.max(0, (s.cuarto[r] || 0) - resto); } return de; }
  G.gasta = gasta;
  G.canAfford = c => { for (const r in c) if (G.disponible(r) < c[r]) return false; return true; };
  const pay = c => { for (const r in c) gasta(r, c[r]); };
  /* ---------- obras y reclutas a plazos (Q4) ----------
     Una obra o lote guarda q = { nc, pag, cuota, costo, pausa }: nc cuotas, pag pagadas, cuota = base por recurso (la última lleva el resto). */
  const mesesDe = d => Math.max(1, Math.ceil(d - 1e-9));
  const nuevoPlazo = (costo, n) => { const cuota = {}; for (const r in costo) cuota[r] = Math.floor(costo[r] / n); return { nc: n, pag: 0, cuota: cuota, costo: costo, pausa: false }; };
  // importe de la cuota número k (la última suma el resto, así el total es exacto)
  const cuotaK = (q, k) => { const o = {}; for (const r in q.costo) o[r] = k >= q.nc - 1 ? q.costo[r] - q.cuota[r] * (q.nc - 1) : q.cuota[r]; return o; };
  G.cuotaSig = q => cuotaK(q, q.pag);
  G.cuotasRestantes = q => { const o = {}; for (let k = q.pag; k < q.nc; k++) { const c = cuotaK(q, k); for (const r in c) o[r] = (o[r] || 0) + c[r]; } return o; };
  // paga la cuota siguiente de q (obra o lote); lo de oro que sale de la caja cuenta como obras del mes
  function pagaCuota(q) { const c = cuotaK(q, q.pag); if (!G.canAfford(c)) return false; for (const r in c) { const de = gasta(r, c[r]); if (r === 'oro') G.state.obrasMes = (G.state.obrasMes || 0) + de; } q.pag++; return true; }
  const plazosDe = (q, activo) => !q || q.pag >= q.nc || q.pausa || !activo ? null : cuotaK(q, q.pag);
  // cuotas que vencen en el cruce de mes T: [{ q, c }]
  function vencen(T) {
    const s = G.state, out = [];
    for (const id of G.myCities()) { const c = s.cities[id];
      for (const q of c.obras) if (q.nc) { const x = plazosDe(q, q.t1 > T - 1e-9); if (x) out.push({ q: q, c: x, id: id }); }
      for (const l of c.train || []) if (l.nc) { const x = plazosDe(l, T > l.t0 + 1e-9 && T <= l.t1 + 1e-9); if (x) out.push({ q: l, c: x, id: id }); }
    }
    return out;
  }
  // suma por recurso de lo que se pagará al cerrar el mes actual
  G.plazos = function () { const s = G.state, o = {}; for (const r of D.RES) o[r] = 0; for (const v of vencen(Math.floor(s.t + 1e-9) + 1)) for (const r in v.c) o[r] += v.c[r]; return o; };
  // cada tick: lo que está en pausa reintenta su cuota; si no puede, su plazo se corre lo que dura el tick
  G.reintentarPlazos = function (dm) {
    const s = G.state;
    for (const id of G.myCities()) { const c = s.cities[id], nom = D.CITIES[id].n;
      for (const q of c.obras) if (q.pausa) { if (pagaCuota(q)) { q.pausa = false; G.log('▶️ ' + nom + ': obra reanudada.'); } else q.t1 += dm; }
      for (let i = 0; i < c.train.length; i++) { const l = c.train[i]; if (!l.pausa) continue;
        if (pagaCuota(l)) { l.pausa = false; G.log('▶️ ' + nom + ': instrucción reanudada.'); }
        else for (let j = i; j < c.train.length; j++) { c.train[j].t1 += dm; if (j > i) c.train[j].t0 += dm; } }
    }
  };
  // coste restante (suma de recursos) de las cuotas por pagar de una obra
  const restoObra = q => !q || !q.nc || q.pag >= q.nc ? 0 : D.RES.reduce((a, r) => a + (G.cuotasRestantes(q)[r] || 0), 0);
  // adelanta las cuotas de la obra i de la ciudad cid (sin i: la mayor de esa ciudad)
  G.adelantarObra = function (cid, i) {
    const c = G.state.cities[cid]; if (!c) return false;
    if (i == null) { let bv = 0; i = -1; c.obras.forEach((o, k) => { const v = restoObra(o); if (v > bv) { bv = v; i = k; } }); }
    const q = c.obras[i]; if (!q || !q.nc || q.pag >= q.nc) return false;
    const rest = G.cuotasRestantes(q); if (!G.canAfford(rest)) return false;
    for (const r in rest) { const de = gasta(r, rest[r]); if (r === 'oro') G.state.obrasMes = (G.state.obrasMes || 0) + de; }
    q.pag = q.nc; q.pausa = false; return true;
  };
  // la obra con más coste restante entre todas las ciudades propias: { id, i, q } o null
  G.obraMayor = function () { let best = null, bv = 0; for (const id of G.myCities()) G.state.cities[id].obras.forEach((q, i) => { const v = restoObra(q); if (v > bv) { bv = v; best = { id: id, i: i, q: q }; } }); return best; };

  /* ---------- aldeanos: reparto de la población trabajadora (20 partes) ---------- */
  G.REPARTO_RES = ['madera', 'piedra', 'hierro', 'grano'];
  G.repartoBase = () => ({ madera: 5, piedra: 5, hierro: 5, grano: 5 });
  G.repartoValido = r => !!r && G.REPARTO_RES.every(k => Number.isInteger(r[k]) && r[k] >= 1 && r[k] <= 11) && G.REPARTO_RES.reduce((a, k) => a + r[k], 0) === 20;
  G.repartoDe = c => G.repartoValido(c.reparto) ? c.reparto : G.repartoBase();
  // dir +1: quita una parte al otro recurso con más partes; dir -1: la da al que menos tiene
  G.reparto = function (cid, res, dir) {
    const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || G.REPARTO_RES.indexOf(res) < 0 || (dir !== 1 && dir !== -1)) return false;
    if (!G.repartoValido(c.reparto)) c.reparto = G.repartoBase();
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
    const s = G.state, pg = G.bonoMul('paga'), cien = G.invMul('paga') !== 1; let ed = 0, up = 0;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      for (const b in c.b) if (G.CAMPOS.indexOf(b) < 0) ed += c.b[b] || 0;
      for (const k in c.units) up += c.units[k] * D.UNITS[k].up * (G.tipoDe(c).paga || 1) * (cien ? G.bonoMul('paga', G.tipoDe(c).paga || 1) : pg);
    }
    for (const m of s.marches) if (m.owner === 'roma') for (const k in m.units) up += m.units[k] * D.UNITS[k].up;
    const edificios = ed * D.MANT_EDIF, tropas = up * D.MANT_TROPA;
    return { edificios: edificios, tropas: tropas, total: edificios + tropas };
  };

  G.prod = function () {
    const s = G.state, p = { madera: 0, piedra: 0, hierro: 0, grano: 0, oro: 0 };
    const gOk = s.res.grano + s.alm.grano > 0;   // para el ánimo de las clases (sin recursión con barrioInfo)
    let up = 0, comPop = 0; const det = { impuestos: 0, foro: 0 }; const ocm = G.bonoMul('oroCom'), imm = G.bonoMul('impuestos'), cOro = G.invMul('oroCom') !== 1, cGra = G.invMul('grano') !== 1;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      const rp = G.repartoDe(c);
      const mo = G.manoObraDe(c, G.popEfectiva(c, gOk)) * G.inqMul(c), tp = G.tipoDe(c), rm = tp.rec || 1, dg = G.diosDe(c), cer = dg && dg.grano ? 1 + dg.grano * G.diosNivel(c) : 1;
      p.madera += (4 + G.rateCampo(c, 'aserradero')) * rp.madera / 5 * mo * rm; p.piedra += (4 + G.rateCampo(c, 'cantera')) * rp.piedra / 5 * mo * rm; p.hierro += (4 + G.rateCampo(c, 'mina')) * rp.hierro / 5 * mo * rm; p.grano += (6 + G.rateCampo(c, 'granja')) * rp.grano / 5 * mo * rm * (cGra ? G.bonoMul('grano', rm) : 1) * cer;
      const oF = (G.rate(c.b.foro) * 0.5 + 5 * (c.b.puerto || 0)) * (tp.oroCom || 1) * (cOro ? G.bonoMul('oroCom', tp.oroCom || 1) : ocm), oI = G.cabezasImp(c, gOk) * 0.03 * G.impMult(c) * imm * D.BARRIO[c.barrio || 1].imp, oP = ((tp.oroPuerto || 0) + (dg && dg.oroPuerto ? dg.oroPuerto * G.diosNivel(c) : 0)) * (c.b.puerto || 0);
      const oE = (c.esc || 0) * G.K().escRenta; p.oro += oF + oI + oP + oE; det.foro += oF + oP; det.impuestos += oI + oE;   // Villa esclavista: renta por esclavo (0 sin ese saber)   // foro + impuestos de la población + comercio del puerto
      p.grano -= (c.pop || 0) * 0.02; comPop += (c.pop || 0) * 0.02;
      for (const k in c.units) up += c.units[k] * D.UNITS[k].up;
    }
    for (const m of s.marches) if (m.owner === 'roma') for (const k in m.units) up += m.units[k] * D.UNITS[k].up;
    p.grano -= up; p.upkeep = up; p.comida = comPop + up; p.det = det;
    p.rutas = 0; for (const r of G.rutasAbiertas()) p.rutas += G.rutaRenta(r);
    p.oro += p.rutas; det.rutas = p.rutas;
    p.mant = G.mantenimiento(); p.oro -= p.mant.total;
    p.sabios = G.pagaSabios(gOk);   // solo dato: se cobra al cerrar el mes (G.cierreMes), no entra en p.oro
    return p;
  };

  /* ---------- bien especial por ciudad (B1) ---------- */
  G.fuentesExtra = [];   // ganchos de otras tareas (rutas comerciales con aliados): cada uno recibe el bien y devuelve ids de ciudad
  G.fuentesEspecial = function (k) { const l = G.myCities().filter(id => D.CITIES[id].esp === k); for (const f of G.fuentesExtra) for (const id of f(k) || []) if (l.indexOf(id) < 0) l.push(id); return l; };
  G.especiales = function () { const o = {}; for (const k in D.ESPECIAL) if (G.fuentesEspecial(k).length) o[k] = true; return o; };
  G.dondeEspecial = k => G.ciudadesRegion().filter(id => D.CITIES[id].esp === k);   // todas las ciudades del mapa que lo dan
  G.bonoMul = function (campo, tipoMul) { let m = 1; const e = G.especiales(); for (const k in e) { const v = D.ESPECIAL[k].bono[campo]; if (v) m *= v; }
    const im = G.invMul(campo); if (im === 1) return m;   // sin ciencia: idéntico a siempre
    const tm = tipoMul || 1, sin = m * tm; return G.techoFinal(campo, sin, sin * im) / tm;   // 3.ª fuente: ciencia, con el techo del resultado final (bienes + tipo + ciencia)
  };
  G.bonoSum = function (campo) { let m = 0; const e = G.especiales(); for (const k in e) m += D.ESPECIAL[k].bono[campo] || 0; return m + G.invSum(campo); };
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
    const s = G.state, ca = s.cities[a], cb = s.cities[b], e = G.edge(a, b);
    if (!ca || !cb || ca.owner !== 'roma' || !e || a === b) return 'No hay camino';
    if (G.rutaDe(a, b)) return 'Ya existe';
    if (!(ca.b.mercado > 0)) return 'Hace falta un mercado';
    if (e[2] && !(ca.b.puerto > 0)) return 'Hace falta un puerto';
    if (G.rutasDeCiudad(a) >= G.rutaMax(ca)) return 'Sin hueco: mejora el mercado';
    if (cb.owner !== 'roma' && G.hayGuerraCon(cb.owner)) return 'En guerra con ' + D.FACTIONS[cb.owner].n;
    if (cb.owner !== 'roma' && G.favorBajo()) return 'El Senado no autoriza tratados con ciudades ajenas (favor bajo)';
    if (G.disponible('oro') < D.RUTA_COSTE) return 'Faltan ' + D.RUTA_COSTE + ' de oro';
    return null;
  };
  G.rutaAbrir = function (a, b) {
    if (G.rutaPuede(a, b)) return false;
    const s = G.state; gasta('oro', D.RUTA_COSTE); s.rutas.push({ a: a, b: b, f: s.cities[b].owner });
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
      if (r.f !== 'roma' && G.hayGuerraCon(r.f)) G.rutaCerrar(r.a, r.b, 'guerra con ' + D.FACTIONS[r.f].n);
    }
  };
  // el bien especial de una ciudad ajena con tratado llega a Roma
  G.fuentesExtra.push(function (k) { const l = []; for (const r of G.rutasAbiertas()) if (r.f !== 'roma' && D.CITIES[r.b].esp === k && G.state.cities[r.b].owner === r.f) l.push(r.b); return l; });
  /* ---------- felicidad e impuestos ---------- */
  G.impMult = c => (D.IMPUESTOS[c.imp] || D.IMPUESTOS.normal).mult;
  G.felicidadBase = function (c) {
    let f = D.FELICIDAD_BASE + (D.IMPUESTOS[c.imp] || D.IMPUESTOS.normal).f;
    for (const b in D.FELICIDAD_EDIF) f += D.FELICIDAD_EDIF[b] * ((c.b && c.b[b]) || 0);
    f += (G.tipoDe(c).fel || 0) + G.bonoSum('fel');
    return Math.max(0, Math.min(100, Math.round(f)));
  };
  // felicidad con la inquietud de los esclavos (Q6): con ánimo de esclavos muy bajo, -8
  G.felicidad = function (c) {
    const f = G.felicidadBase(c);
    if (c.owner === 'roma' && (c.esc || 0) > 0 && G.animoClases(c).esc < G.K().inquietud) return Math.max(0, f - G.K().inquietudFel);
    return f;
  };
  G.setImp = function (cid, nivel) { const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.IMPUESTOS[nivel]) return false; c.imp = nivel; return true; };

  /* ---------- población ---------- */
  G.popCapViejo = c => { let n = 120; for (const b in D.POP_EDIF) n += D.POP_EDIF[b] * (c.b[b] || 0); return Math.round(n * D.BARRIO[c.barrio || 1].pop); };
  /* Con ciudad nueva: capacidad de sus casas (ciudad.poblacion) x multiplicador de barrio + mercado y templo (D.POP_EDIF). Ya no cuentan viviendas ni foro. */
  G.popCap = c => { const r = infoC(c); if (!r) return Math.round(G.popCapViejo(c) * G.invMul('popCap')); let n = r.cap; for (const b in D.POP_EDIF) if (b !== 'viviendas' && b !== 'foro') n += D.POP_EDIF[b] * (c.b[b] || 0); return Math.round(n * D.BARRIO[c.barrio || 1].pop * G.invMul('popCap')); };
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
      return { i, nombre: b.nombre, corto: b.corto, nivel: niv, objetivo: n.nivel, casas: n.casas, falta: niv >= n.nivel ? n.falta : '', meses, texto: CI.textoBarrio(E, i) }; });
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
    return { grano: granoOk, templo: (c.b.templo || 0) >= 1 || !!(cv && cv.te), agua: !CI || !!(cv && cv.ag), mercado: (c.b.mercado || 0) >= 1 || !!(cv && cv.me), lujo: D.LUJO.some(k => e[k]) };
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
    gasta('oro', G.K().ciudadaniaCoste); c.ciu = G.clases(c).ciu + G.K().ciudadaniaLote; return true;
  };
  // por qué no se puede dar la ciudadanía (null si se puede)
  G.motivoCiudadania = function (c) {
    const K = G.K(), cl = G.clases(c);
    if ((c.barrio || 1) < K.ciudadaniaBarrio) return 'Pide barrio ' + D.BARRIO[K.ciudadaniaBarrio].n;
    if (cl.ple < K.ciudadaniaLote) return 'Faltan plebeyos';
    if (cl.ciu + K.ciudadaniaLote > cl.pop * K.ciudadaniaMax + 1e-9) return 'Máximo ' + Math.round(K.ciudadaniaMax * 100) + ' % de ciudadanos';
    if (!G.canAfford({ oro: K.ciudadaniaCoste })) return 'Faltan denarios';
    return null;
  };

  G.MIN_POP = 50;                                   // civiles que nunca se reclutan
  G.recruits = c => Math.max(0, Math.floor((c.pop || 0) - G.MIN_POP) - G.sabiosDe(c).n);   // los sabios no son reclutas

  /* ---------- mercado ---------- */
  G.marketLevel = () => { let l = 0; for (const id of G.myCities()) l = Math.max(l, G.state.cities[id].b.mercado || 0); return l; };
  G.tradeRate = () => { const l = G.marketLevel(); if (!l) return 0; let ex = 0; for (const id of G.myCities()) { const c = G.state.cities[id]; if ((c.b.mercado || 0) > 0) ex = Math.max(ex, G.tipoDe(c).mercado || 0); } return Math.min(0.9, 0.45 + 0.05 * l + ex); };
  G.trade = function (from, to, amount) {
    const s = G.state, rate = G.tradeRate(); amount = Math.floor(Math.min(amount, from in s.res ? G.disponible(from) : 0));
    if (!rate || from === to || amount <= 0 || !(from in s.res) || !(to in s.res)) return 0;
    const got = Math.min(Math.floor(amount * rate), Math.max(0, G.cap() - s.res[to])); if (got <= 0) return 0;
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

  G.log = function (txt, kind) { const s = G.state; s.log.unshift({ t: s.t, x: txt, k: kind || '' }); if (s.log.length > 60) s.log.pop(); emit('log', { x: txt, k: kind }); };

  /* ---------- la ciudad nueva dentro del juego (CN2b) ----------
     js/ciudad.js (ESM) hace la geometría; este bloque la conecta con la economía. El módulo se enchufa con G.usarCiudad(modulo):
     ui.js lo llama en el navegador y, en Node, se intenta al final de este archivo. Sin módulo todo sigue con c.b como números.
     - La ciudad nueva E de cada ciudad PROPIA vive en una caché fuera de G.state (WeakMap por objeto de ciudad: lleva arrays tipados
       y G.save usa JSON.stringify). En el estado solo va c.ciudad = aDatos(E) + n0 (se refresca tras cada cambio) y c.heredado.
     - c.b es una VISTA derivada (G.sincronizar): c.b[b] = min(MAX_LVL, Σ NIVEL_MEJORA[mejora] de las piezas de ese b) + c.heredado[b].
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
  G.huecosObra = c => D.HUECOS_OBRA[Math.min(10, Math.max(1, (c && c.b && c.b.foro) || 1))];   // obras a la vez según el nivel del foro (Q4b)
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
  const limpia = o => { const r = {}; for (const k in o) if (o[k] > 0) r[k] = o[k]; return r; };

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
      for (const b of G.CAMPOS) { let t = G.rate(her[b] || 0); const pz = CI.PIEZA_DE[b]; for (const e of E.edificios) if (e.tipo === pz && !e.ruina && !e.obra) t += G.rate(CI.NIVEL_MEJORA[e.mejora || 0]) * bonoSitio(e.nota); campo[b] = t; }
      r.campo = campo;
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
  function reconstruir(d) {
    const E = crearE(d.semilla); E.modoJuego = true; E.cultura = d.cultura || 'roma'; E.tinte = d.tinte || E.cultura; E.tam = d.tam || null; E.n0 = d.n0 || 0; E.mesN = E.n0; if (d.sitio) CI.fundar(E, d.sitio.x, d.sitio.z); aplicarMur0(E, d.mur0 || 0);
    const ac = d.acciones || [];
    for (let n = E.n0; n <= d.mesN; n++) {
      for (const a of ac) { if (a.n !== n) continue;
        if (a.a === 'c') { const r = CI.colocar(E, a.tipo, a.x, a.z, true); if (r.ok) r.e.obra = 0; }
        else if (a.a === 'u') CI.mejorar(E, a.id, true); else if (a.a === 'm') CI.levantarMuralla(E, true);
        else if (a.a === 's') CI.sembrarCasas(E, a.pob); else if (a.a === 'd') quitar(E, a.id); else if (a.a === 'q') CI.saquearArrabal(E, a.fz); }
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
  function sinc(c, r) {
    const E = r.E, her = c.heredado || {}, suma = {};
    for (const e of E.edificios) { const bid = CI.EDIF[e.tipo].bid; if (bid && bid !== 'muralla') suma[bid] = (suma[bid] || 0) + CI.NIVEL_MEJORA[e.mejora || 0]; }
    for (const b in CI.PIEZA_DE) if (b !== 'muralla') c.b[b] = Math.min(D.MAX_LVL, (suma[b] || 0) + (her[b] || 0));
    c.b.viviendas = 0;
    let casas = 0; for (const l of E.parcelas) if (l.casa && !l.casa.ruina && !l.fuera) casas++;
    c.b.foro = Math.min(D.MAX_LVL, Math.max(c.foroMin || 1, 1 + Math.floor(casas / D.FORO_CASAS) + Math.max(0, E.barrios.length - 1)));   // foro derivado: 1 + una por cada 25 casas (D.FORO_CASAS) + una por barrio extra
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
      const sem = semillaDe(id); E = crearE(sem); E.modoJuego = true; E.n0 = E.mesN = n0; her = {};
      if (!CI.fundarAuto(E, sem)) return null;
      const pon = pz => { const s = mejorSitioG(E, pz); if (!s) return null; const r = CI.colocar(E, pz, s[0], s[1], true); if (!r.ok) return null; r.e.obra = 0; return r.e; };
      for (const b of COMPAT) { const L = bs[b] || 0; if (L < 1) continue; const e = pon(CI.PIEZA_DE[b]); if (!e) { her[b] = L; continue; } for (let k = MEJORA(L); k > 0; k--) CI.mejorar(E, e.id, true); }
      if (!E.edificios.some(e => e.tipo === 'granero')) pon('granero');         // sin granero hay hambre en invierno: cada ciudad lo trae
      if (CI.poblacion(E) < (c.pop || 0)) CI.sembrarCasas(E, c.pop);
      memoConv[clave] = { datos: datosDe(E), her: Object.assign({}, her) };
    }
    aplicarMur0(E, c.b.muralla || 0); c.heredado = her; c.foroMin = Math.max(1, c.b.foro || 0); regE.set(c, { E, id, rev: -1 }); sinc(c, regE.get(c)); ponerDatos(c, regE.get(c));
    return E;
  }
  const MEJORA = n => CI.MEJORA_DE_NIVEL(n);
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
  function soltarCiudad(c) { delete c.sabios; regE.delete(c); delete c.ciudad; delete c.plantilla; delete c.heredado; if (!c.b.viviendas) c.b.viviendas = 2; }   // sin ciudad nueva, c.b.viviendas (vista derivada = 0) vuelve a un mínimo para que la reconquista no hunda la población
  // una obra de partida vieja (sin pieza) se liga a la pieza que ahora existe si no pasa por encima de lo ya convertido
  function migrarObra(c, antes) {
    for (const q of c.obras) migrarUna(c, antes, q);
  }
  function migrarUna(c, antes, q) {
    if (!q || 'nuevo' in q) return; q.pieza = null; q.nuevo = false; q.mejora = null;
    const pz = piezaDe(q.b), r = pz && regE.get(c); if (!r) return;
    const ps = r.E.edificios.filter(e => e.tipo === pz);
    if (ps.length) { const e = ps.reduce((m, p) => (p.mejora || 0) < (m.mejora || 0) ? p : m), k = e.mejora || 0; if (k < 3 && CI.NIVEL_MEJORA[k] <= (antes[q.b] || 0)) { q.pieza = pz; q.eid = e.id; q.x = e.x; q.z = e.z; q.mejora = k + 1; } }
    else if (!(c.heredado && c.heredado[q.b])) { const s = mejorSitioG(r.E, pz); if (s) { q.pieza = pz; q.nuevo = true; q.x = s[0]; q.z = s[1]; q.mejora = 0; } }
  }

  /* ---------- obras con pieza ----------
     Entrada de c.obras (y de c.queue): { b: id D.BUILD (o null), pieza: id de pieza de ciudad.js (o null = nivel heredado), eid: id del edificio de E
     (solo al mejorar), x, z, nuevo: bool, mejora: mejora destino 0..3 (null si heredado), t0, t1, nc, pag, cuota, costo, pausa }. */
  // duración de una mejora que salta de `desde` a `hasta` niveles: tiempo del nivel de destino menos uno × (1 + 0,25 por paso extra), con tope de 30 meses
  const durNiveles = (c, b, desde, hasta) => Math.min(30, D.BUILD[b].time * Math.pow(1.35, hasta - 1) * (1 + 0.25 * Math.max(0, hasta - desde - 1)) * (1 - 0.04 * (c.b.foro || 0)) * G.bonoMul('obra'));
  function empezar(c, s) {
    const dur = s.dur, pl = nuevoPlazo(limpia(s.coste), mesesDe(dur)); if (!G.canAfford(cuotaK(pl, 0))) return false;
    const nq = Object.assign({ b: s.b, pieza: s.pieza, eid: s.eid, x: s.x, z: s.z, nuevo: !!s.nuevo, mejora: s.mejora, t0: G.state.t, t1: G.state.t + dur }, pl); c.obras.push(nq); pagaCuota(nq);
    return nq;
  }
  function especNueva(c, E, pz, x, z) { const D0 = CI.EDIF[pz], b = D0.bid; return { b: b, pieza: pz, x: x, z: z, nuevo: true, mejora: 0, coste: D0.coste, dur: b ? G.buildTime(c, b) : D0.obra * (1 - 0.04 * (c.b.foro || 0)) * G.bonoMul('obra') }; }
  function especMejora(c, e) { const D0 = CI.EDIF[e.tipo], k = e.mejora || 0, b = D0.bid; return { b: b, pieza: e.tipo, eid: e.id, x: e.x, z: e.z, nuevo: false, mejora: k + 1, coste: D0.mejoras[k].coste, dur: b ? durNiveles(c, b, CI.NIVEL_MEJORA[k], CI.NIVEL_MEJORA[k + 1]) : D0.obra * (k + 1) * (1 - 0.04 * (c.b.foro || 0)) * G.bonoMul('obra') }; }
  function menorMejora(E, pz) { let m = null; for (const e of E.edificios) if (e.tipo === pz && (!m || (e.mejora || 0) < (m.mejora || 0))) m = e; return m; }
  function terminarObra(id, c, q) {
    const nom = D.CITIES[id].n, r = CI && regE.get(c) || null; const ix = c.obras.indexOf(q); if (ix >= 0) c.obras.splice(ix, 1); let txt;
    if (q.pieza && r) {
      const E = r.E, her = c.heredado = c.heredado || {};
      if (q.nuevo) {
        let res = CI.colocar(E, q.pieza, q.x, q.z, true);
        if (!res.ok) { const s = mejorSitioG(E, q.pieza); res = s ? CI.colocar(E, q.pieza, s[0], s[1], true) : { ok: false }; }
        if (res.ok) res.e.obra = 0; else if (q.b) her[q.b] = (her[q.b] || 0) + CI.NIVEL_MEJORA[0];
      } else {
        const e = E.edificios.find(p => p.id === q.eid);
        if (!(e && CI.mejorar(E, e.id, true).ok) && q.b) her[q.b] = (her[q.b] || 0) + (CI.NIVEL_MEJORA[q.mejora] - CI.NIVEL_MEJORA[q.mejora - 1]);
      }
      sinc(c, r); ponerDatos(c, r);
      txt = q.b ? D.BUILD[q.b].n + ' nivel ' + c.b[q.b] : CI.EDIF[q.pieza].nombre + (q.nuevo ? ' levantado' : ' mejorado');
    } else {
      const b = q.b;
      if (r && piezaDe(b)) { c.heredado = c.heredado || {}; c.heredado[b] = (c.heredado[b] || 0) + 1; sinc(c, r); ponerDatos(c, r); } else c.b[b] = (c.b[b] || 0) + 1;
      txt = D.BUILD[b].n + ' nivel ' + c.b[b];
    }
    G.log('🏗️ ' + nom + ': ' + txt + '.'); emit('dirty');
  }
  // cada mes entero: la ciudad nueva vive un mes y sus avisos importantes pasan al diario del juego (máx. 2 líneas por ciudad)
  function mesCiudades() {
    if (!CI) return; const grupo = {};
    for (const id of G.myCities()) { const c = G.state.cities[id], r = infoC(c); if (!r) continue;
      const alin = mesAlin(); let av = [], k = 0; while (r.E.mesN < alin && k++ < 36) av = av.concat(CI.mes(r.E)); if (!k) continue;
      sinc(c, r); ponerDatos(c, r);
      for (const a of av) { if (a.c !== 'crecida' && a.c !== 'fuego' && a.c !== 'hambre') continue; if (a.c === 'fuego' && !(a.cg && a.cg[0])) continue; const g = grupo[a.c] = grupo[a.c] || {}, e = g[id] = g[id] || [0, 0]; if (a.cg) { e[0] += a.cg[0]; e[1] += a.cg[1]; } } }
    const cuenta = (e, u1, uN, o1, oN) => { const p = []; if (e[0]) p.push(e[0] + ' ' + (e[0] === 1 ? u1 : uN)); if (e[1]) p.push(e[1] + ' ' + (e[1] === 1 ? o1 : oN)); return p.join(' y '); };
    const lineas = [['crecida', '🌊 Crecida: ', e => cuenta(e, 'casa', 'casas', 'obra', 'obras')], ['fuego', '🔥 Incendio: ', e => cuenta([e[0], 0], 'casa ardió', 'casas ardieron', '', '')], ['hambre', '🥖 Hambre de invierno (sin granero): ', () => '']];
    for (const [k, pre, f] of lineas) { const g = grupo[k]; if (!g) continue; const txt = pre + Object.keys(g).map(id => { const x = f(g[id]); return D.CITIES[id].n + (x ? ' (' + x + ')' : ''); }).join(', '); G.log(txt, 'bad'); emit('alert', txt); }
  }
  // riesgos que se ven venir: de una ciudad propia, y agrupados por tipo para el consejo del imperio
  G.riesgos = function (cid) { const E = G.ciudadE(cid); if (!E || !CI) return []; const k = E.rev + '|' + E.mesN + '|' + ((G.state && G.state.ajustes && G.state.ajustes.v) || 0); if (!E._rg || E._rg.k !== k) E._rg = { k, v: CI.riesgos(E) }; return E._rg.v; };   // en caché por revisión y mes: la pantalla lo pide a cada cuadro
  G.riesgosImperio = function () { const m = {}; for (const id of G.myCities()) { for (const r of G.riesgos(id)) { const g = m[r.c] = m[r.c] || { c: r.c, p: r.p, ciudades: [], t: r.t, remedio: r.remedio, pieza: r.pieza, cid: id, _n: -1 }; g.ciudades.push(D.CITIES[id].n); g.meses = Math.min(g.meses === undefined ? 99 : g.meses, r.meses); if (r.n > g._n) { g._n = r.n; g.cid = id; g.t = r.t; g.remedio = r.remedio; } } } return Object.values(m).map(g => { delete g._n; return g; }).sort((a, b) => b.p - a.p); };

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
    if (b && (D.BUILD[b].sea && !D.CITIES[cid].sea)) return { ok: false, motivo: 'Aquí no hay mar' };
    if (b && G.faltaInv(b)) return { ok: false, motivo: G.faltaInv(b) };
    if (b && G.faltaEspecial('edificio', b, c.b[b] || 0)) return { ok: false, motivo: 'Falta un bien especial' };
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
    const nq = empezar(c, especMejora(c, e)); if (!nq) return { ok: false, motivo: 'Faltan recursos' };
    return { ok: true, obra: nq };
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
    const res = CI.levantarMuralla(r.E, false, coste => { const k = limpia(coste); if (!G.canAfford(k)) return false; pay(k); return true; });
    if (res.ok) ponerDatos(c, r); return res;
  };

  /* deja una ciudad como romana recién incorporada: sin colas, impuesto normal, mitad de población */
  function incorporar(c, units, conquista) { c.prev = c.owner; c.inq = conquista ? D.INQ_MESES * G.invMul('inqMeses') : 0; c.owner = 'roma'; c.tipo = 'municipio'; c.tipoElegido = false; c.imp = 'normal'; c.reparto = G.repartoBase(); c.units = units; G.ligarObras(c); c.obras.length = 0; c.train = []; c.levas = []; c.barrio = 1; c.bdef = 0; soltarCiudad(c); { const idc = idDe(c); if (!(idc && G.state.colonias && G.state.colonias[idc])) c.plantilla = true; }   /* nace con la plantilla de su facción de origen (las colonias, no) */ c.pop = Math.round(G.popCapViejo(c) * 0.5); c.ciu = 0; c.esc = conquista ? Math.round(c.pop * G.K().escConquista) : 0; if (CI && !cargando) abrir(c); }   // la ciudad nueva nace con la población que ya tenía
  G.incorporar = incorporar;   // para las pruebas

  // edificios iniciales de una ciudad según su riqueza w y su muralla wl
  G.edificiosBase = function (id, w, wl) {
    const d = D.CITIES[id], h = Math.floor(w / 2);
    return { aserradero: w, cantera: w, mina: w, granja: w, viviendas: id === 'roma' ? 2 : w, foro: Math.max(1, h), almacen: Math.max(1, h), mercado: id === 'roma' ? 0 : h, puerto: d.sea && id !== 'roma' ? Math.max(1, h) : 0, cuartel: id === 'roma' ? 1 : h, establo: id === 'roma' ? 0 : Math.max(0, h - 1), muralla: wl, templo: 0, herreria: 0 };
  };
  // guarnición de referencia (refuerzos anuales) de una ciudad según su dueño actual
  G.guarnicionBase = (id, owner) => { const d = D.CITIES[id]; return owner === d.f ? d.g : (d.en228 && owner === 'cartago' ? d.en228.g : (d.post && d.post[owner]) || null); };
  G.newGame = function (heroName, region, opciones) {
    opciones = opciones || {};
    const dif0 = Object.hasOwn(D.DIFICULTAD, opciones.dificultad) ? opciones.dificultad : 'normal';
    G.quitarColonias();   // las colonias de la partida anterior no pasan a esta
    region = D.REGIONES[region] ? region : 'mediterraneo';
    G.turnos = false;   // la interfaz lo activa después; las pruebas y el bot siguen en tiempo continuo
    const s = {
      v: 1, region: region, t: 0, speed: 1, res: { madera: 400, piedra: 400, hierro: 400, grano: 400, oro: 200 },
      alm: { madera: 200, piedra: 200, hierro: 200, grano: 200, oro: 0 }, cuarto: { madera: 50, piedra: 50, hierro: 50, grano: 50, oro: 0 }, gastoMes: { madera: 0, piedra: 0, hierro: 0, grano: 0, oro: 0 }, obrasMes: 0, gan: { madera: 0, piedra: 0, hierro: 0, grano: 0, oro: 0 }, informe: [],
      ajustes: { dif: dif0, suc: { crecida: true, fuego: true, hambre: true }, asesor: opciones.asesor !== false, vistos: [], hist: [], v: 0 },   // CN14-B: la dificultad elegida vale desde el mes siguiente (se apunta tras abrir Roma y Capua)
      cities: {}, colonias: {}, rutas: [], marches: [], log: [], ev: {}, pending: [], over: null, mid: 1,
      mods: { sea: 1, flex: 0 }, forja: { armas: 0, armaduras: 0, cola: null }, stats: { battles: 0, wins: 0, kills: 0, lost: 0 },
      hero: { name: heroName || 'Lucio Cornelio Escipión', lvl: 1, xp: 0, pts: 1, sk: { mando: 0, disc: 0, log: 0 }, city: 'roma', march: null, wound: 0 }
    };
    const ciudades = D.regionCiudades(region);
    for (const id of ciudades) {
      const d = D.CITIES[id];
      s.cities[id] = { owner: d.f, barrio: 1, bdef: 0, tipo: 'municipio', tipoElegido: false, units: Object.assign({}, d.g), obras: [], train: [], levas: [], reparto: G.repartoBase(), b: G.edificiosBase(id, d.w, d.wl) };
    }
    for (const id in s.cities) { const c = s.cities[id]; c.pop = Math.round(G.popCapViejo(c) * 0.7); c.ciu = 0; c.esc = 0; G.ligarObras(c); }
    for (const id of ciudades) if (D.CITIES[id].f === 'roma' && id !== 'roma') incorporar(s.cities[id], D.CITIES[id].g);   // aliada de Roma (Capua): empieza como ciudad recién incorporada
    G.state = s;
    if (CI) for (const id of G.myCities()) {   // Roma y Capua: en pie desde la plantilla, con su población
      const c = s.cities[id]; c.plantilla = true; const E = abrir(c); if (E && c.plantilla) c.pop = Math.min(G.popCap(c), Math.round(poblacionE(E)));
    }
    s.ajustes.hist.push([mesAlin() + 1, { dif: dif0, suc: Object.assign({}, s.ajustes.suc) }]);   // Roma y Capua ya nacieron en Normal: la elegida cuenta desde el mes siguiente
    s.evN = D.EVENTS.length; s.evV = EV_VERSION; D.anio = D.START_YEAR;
    if (s.cities.roma) for (const k in D.LEVA_INICIAL) s.cities.roma.units[k] = (s.cities.roma.units[k] || 0) + D.LEVA_INICIAL[k];   // H13b: preparación inicial (licencia de juego)
    checkEvents(D.START_YEAR);
    G.migrarSenado(s); G.migrarInv(s); G.migrarDeuda(s); G.migrarColonias(s); G.migrarAjustes(s); G.senadoAsignar();
    return s;
  };

  /* ---------- CN14-B: ajustes de partida (dificultad, sucesos, asesor) ----------
     Tres «hambres» distintos: E.hambre (invierno sin granero, de ciudad.js, lo apaga suc.hambre), el hambre de grano de G.tick (no se toca) y la ración c.rac. */
  const SUC_CLAVES = ['crecida', 'fuego', 'hambre'], sucOk = o => !!o && typeof o === 'object' && Object.keys(o).every(k => SUC_CLAVES.includes(k) && typeof o[k] === 'boolean');
  const COPIA = o => JSON.parse(JSON.stringify(o));
  G.migrarAjustes = function (s) {
    if (!s.ajustes || typeof s.ajustes !== 'object') s.ajustes = { dif: 'normal', suc: { crecida: true, fuego: true, hambre: true }, asesor: false, vistos: [], hist: [], v: 0 };
    const a = s.ajustes; if (!Object.hasOwn(D.DIFICULTAD, a.dif)) a.dif = 'normal'; a.suc = Object.assign({ crecida: true, fuego: true, hambre: true }, a.suc || {});
    if (typeof a.asesor !== 'boolean') a.asesor = false; if (!Array.isArray(a.vistos)) a.vistos = []; if (!Array.isArray(a.hist)) a.hist = []; if (!(a.v >= 0)) a.v = 0;
  };
  G.ajustes = function () { const s = G.state; if (!s) return null; G.migrarAjustes(s); return COPIA(s.ajustes); };
  G.ponerAjustes = function (p) {
    const s = G.state; if (!s) return { ok: false, motivo: 'No hay partida.' }; G.migrarAjustes(s); p = p || {}; const a = s.ajustes;
    if (p.dif !== undefined && !Object.hasOwn(D.DIFICULTAD, p.dif)) return { ok: false, motivo: 'Dificultad desconocida.' };
    if (p.suc !== undefined && !sucOk(p.suc)) return { ok: false, motivo: 'Sucesos no válidos.' };
    if (p.asesor !== undefined && typeof p.asesor !== 'boolean') return { ok: false, motivo: 'El asesor es sí o no.' };
    const dif = p.dif !== undefined ? p.dif : a.dif, suc = Object.assign({}, a.suc, p.suc || {}), cambia = dif !== a.dif || SUC_CLAVES.some(k => suc[k] !== a.suc[k]);
    if (cambia) {   // vale desde el mes siguiente; el pasado no cambia
      const k = mesAlin() + 1, e = [k, { dif, suc: Object.assign({}, suc) }], i = a.hist.findIndex(h => h[0] === k);
      if (i >= 0) a.hist[i] = e; else a.hist.push(e); a.dif = dif; a.suc = suc;
      for (const id of G.myCities()) { const E = G.ciudadE(id); if (E) delete E._rg; }
    }
    if (p.asesor !== undefined) a.asesor = p.asesor;
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
  G.derivado = (c, b) => (b === 'viviendas' || b === 'foro') && !!c && c.owner === 'roma' && !!infoC(c);   // con ciudad nueva salen de las casas: no se levantan
  G.upgrade = function (cid, b) {
    const c = G.state.cities[cid], L = c.b[b] || 0; G.ultimoMotivo = '';
    if (c.owner !== 'roma' || L >= D.MAX_LVL || (D.BUILD[b].sea && !D.CITIES[cid].sea)) return false;
    if (G.obraDe(c, b)) { G.ultimoMotivo = 'Ya se está mejorando'; return false; }
    if (G.huecosLibres(c) === 0) { G.ultimoMotivo = sinHueco(c); return false; }
    if (D.BUILD[b].solar && L < 1 && G.solaresUsados(c) >= G.solares(cid)) return false;
    if (G.faltaInv(b) || G.faltaEspecial('edificio', b, L)) return false;   // niveles altos piden un bien especial (B1)   // sin solares no se levanta un edificio urbano nuevo
    const r = infoC(c);
    if (r && (b === 'viviendas' || b === 'foro')) return false;   // salen de las casas
    const pz = r && piezaDe(b);
    if (pz) {   // atajo «mejor sitio»: coloca la primera pieza o mejora la de menor mejora
      let sp; const e = menorMejora(r.E, pz);
      if (e) { if ((e.mejora || 0) >= 3) return false; sp = especMejora(c, e); }
      else { const st = mejorSitioG(r.E, pz); if (st) sp = especNueva(c, r.E, pz, st[0], st[1]); else if (!(c.heredado && c.heredado[b])) return false; }
      if (sp) { if (b === 'templo' && !G.diosDe(c)) c.dios = D.DIOSES[c.dios] && !(D.DIOSES[c.dios].sea && !D.CITIES[cid].sea) ? c.dios : 'marte'; return !!empezar(c, sp); }
    }
    const cost = G.cost(b, L), dur = G.buildTime(c, b), pl = nuevoPlazo(cost, mesesDe(dur)); if (!G.canAfford(cuotaK(pl, 0))) return false;
    if (b === 'templo' && !G.diosDe(c)) c.dios = D.DIOSES[c.dios] && !(D.DIOSES[c.dios].sea && !D.CITIES[cid].sea) ? c.dios : 'marte';
    const nq = Object.assign({ b: b, pieza: null, nuevo: false, mejora: null, t0: G.state.t, t1: G.state.t + dur }, pl); c.obras.push(nq); pagaCuota(nq);
    return true;
  };

  /* herrería: mejoras globales de armas y armaduras (niveles 0 a D.FORJA_MAX) */
  G.forjaCost = function (k, L, cid) { const o = {}, base = D.FORJA[k].cost, m = ((cid && G.tipoDe(G.state.cities[cid]).forjaCoste) || 1) * G.bonoMul('forjaCoste'); for (const r in base) o[r] = Math.round(base[r] * Math.pow(1.5, L) * m / 5) * 5; return o; };
  G.forjaTime = (k, L, cid) => D.FORJA[k].time * Math.pow(1.4, L) * ((cid && G.tipoDe(G.state.cities[cid]).forjaTiempo) || 1);
  G.forjaMul = (s, k) => 1 + D.FORJA_BONO * ((s.forja && s.forja[k]) || 0);
  G.forjaUp = function (cid, k) {
    const s = G.state, c = s.cities[cid], f = s.forja, L = f[k];
    if (!D.FORJA[k] || c.owner !== 'roma' || f.cola || L >= D.FORJA_MAX || (c.b.herreria || 0) <= L) return false;
    const cost = G.forjaCost(k, L, cid); if (!G.canAfford(cost)) return false;
    pay(cost); f.cola = { k: k, t0: s.t, t1: s.t + G.forjaTime(k, L, cid) };
    return true;
  };

  G.unitOk = function (c, k) { const u = D.UNITS[k]; if (!u.cost || G.faltaEspecial('tropa', k)) return false; for (const b in u.req) if ((c.b[b] || 0) < u.req[b]) return false; return true; };
  G.unitCost = function (k, n) { const o = {}, c = D.UNITS[k].cost; for (const r in c) o[r] = c[r] * n; return o; };
  // tope de reclutas: sin ciudad, por coste total (conservador); con ciudad, lo que alcanza para la primera cuota y la población
  G.maxTrain = function (k, cid) {
    const c = D.UNITS[k].cost; let m = 1e9; for (const r in c) m = Math.min(m, Math.floor(G.disponible(r) / c[r]));
    const ci = cid && G.state.cities[cid]; if (!ci) return m;
    let n = Math.min(G.recruits(ci), 1000);
    while (n > 0 && !G.canAfford(G.planPago(G.unitCost(k, n), G.trainDur(ci, k, n)).primera)) n = n > 10 ? Math.floor(n * 0.9) : n - 1;
    return Math.max(m, n);
  };
  G.trainDur = (c, k, n) => { const u = D.UNITS[k], bl = c.b[Object.keys(u.req)[0]] || 1; return n * u.time * Math.max(0.5, 1 - 0.05 * (bl - 1)) * (G.tipoDe(c).instr || 1) * G.bonoMul('instr', G.tipoDe(c).instr || 1); };
  // plan de pago para mostrarlo: n cuotas, la primera y el total
  G.planPago = (costo, dur) => { const q = nuevoPlazo(costo, mesesDe(dur)); return { nc: q.nc, primera: cuotaK(q, 0), total: costo }; };
  G.train = function (cid, k, n) {
    const s = G.state, c = s.cities[cid]; n = Math.floor(n);
    if (c.owner !== 'roma' || n <= 0 || !G.unitOk(c, k) || c.train.length >= 5 || G.recruits(c) < n) return false;
    if (c.train.length >= D.SENADO.levaMax && G.favorBajo()) { G.log('🏛️ El Senado niega levas extra en ' + D.CITIES[cid].n + ' (favor bajo).', 'bad'); return false; }
    const cost = G.unitCost(k, n);
    const last = c.train[c.train.length - 1];
    const t0 = Math.max(s.t, last ? last.t1 : 0), dur = G.trainDur(c, k, n);
    const lote = Object.assign({ u: k, n: n, t0: t0, t1: t0 + dur }, nuevoPlazo(cost, mesesDe(dur))); 
    if (!G.canAfford(cuotaK(lote, 0))) return false;
    c.pop -= n; pagaCuota(lote);                           // los reclutas salen de la población
    c.train.push(lote);
    return true;
  };

  G.heroAvailable = cid => { const h = G.state.hero; return h.city === cid && !h.march && h.wound <= G.state.t; };

  // botín de un saqueo a una ciudad enemiga: por recurso; el oro, un 60 %
  G.botin = function (cid) {
    const s = G.state, c = s.cities[cid], d = D.CITIES[cid], h = s.hero; if (!c) return {};
    let b = D.SAQUEO_BASE * (c.w || d.w) * (1 + 0.1 * h.sk.log) * (1 + 0.05 * (c.b.almacen || 0)) * (1 - 0.08 * G.nivelMuralla(c));
    if (c.saqueada !== undefined && s.t - c.saqueada < D.SAQUEO_MESES) b *= D.SAQUEO_REPETIDO;
    const o = {}; for (const r of D.RES) o[r] = Math.max(0, Math.round(b * (r === 'oro' ? 0.6 : 1))); return o;
  };
  G.send = function (from, to, units, withHero, mision) {
    const s = G.state, c = s.cities[from];
    if (!c || c.owner !== 'roma' || !s.cities[to] || !G.edge(from, to)) return false;
    if (G.edge(from, to)[2] && !(c.b.puerto > 0)) return false;       // por mar hace falta un puerto
    const u = {}; let n = 0;
    for (const k in units) { const q = Math.min(Math.floor(units[k]), c.units[k] || 0); if (q > 0) { u[k] = q; n += q; } }
    if (withHero && !G.heroAvailable(from)) withHero = false;
    const own = s.cities[to].owner === 'roma';
    if (n === 0 && !(withHero && own)) return false;
    for (const k in u) { c.units[k] -= u[k]; if (c.units[k] <= 0) delete c.units[k]; }
    const m = { id: s.mid++, owner: 'roma', from: from, to: to, units: u, hero: !!withHero, t0: s.t, t1: llegada(s.t + G.travel(from, to, withHero)) };
    if (mision === 'saqueo' && !own) m.mision = 'saqueo';
    if (withHero) { s.hero.city = null; s.hero.march = m.id; }
    s.marches.push(m);
    G.rutasRevisar();
    return true;
  };

  /* ---------- colonias (CN5): sitios de D.COLONIAS, colonos que marchan sin batalla, fundación ----------
     s.colonias[id] = { estado: 'libre' | 'camino' | 'pendiente' | 'fundada', desde, E? }. Los sitios NO están en D.CITIES: la colonia se
     registra al fundarla (y al cargar) y se quita en G.newGame. El bot no funda ni envía colonos. */
  G.COLONOS = { pop: 40, grano: 120, oro: 100 };
  G.migrarColonias = function (s) {
    if (!s.colonias || typeof s.colonias !== 'object') s.colonias = {};
    G.quitarColonias();   // solo quedan registradas las fundadas de esta partida
    for (const id in (D.COLONIAS || {})) { const k = s.colonias[id]; if (!k || !k.estado) s.colonias[id] = { estado: 'libre', desde: null }; }
    for (const id in s.colonias) { if (!D.COLONIAS || !D.COLONIAS[id]) { delete s.colonias[id]; continue; } const k = s.colonias[id]; if (k.estado === 'fundada' && !s.cities[id]) k.estado = 'libre'; if (k.estado === 'fundada') G.registrarColonia(id); }
  };
  G.registrarColonia = function (id) {
    const d = D.COLONIAS && D.COLONIAS[id]; if (!d) return false; if (D.CITIES[id]) return true;
    D.CITIES[id] = { n: d.n, lon: d.lon, lat: d.lat, f: 'roma', tipo: 'agraria', w: 1, wl: 0, g: {}, sea: d.tipo === 'maritima', colonia: true, h: d.h || '' };
    const pr = D.proj(d.lon, d.lat), cerca = Object.keys(D.CITIES).filter(o => o !== id && !D.CITIES[o].colonia).map(o => { const q = D.proj(D.CITIES[o].lon, D.CITIES[o].lat); return [o, Math.hypot(q[0] - pr[0], q[1] - pr[1])]; }).sort((a, b) => a[1] - b[1]).slice(0, 2);
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
    const coste = { grano: K.grano, oro: K.oro };
    if (!G.canAfford(coste)) return { ok: false, motivo: 'Faltan recursos: ' + K.grano + ' de grano y ' + K.oro + ' de oro' };
    return { ok: true, motivo: '' };
  };
  G.enviarColonos = function (desde, sitio) {
    const v = G.puedeEnviarColonos(desde, sitio); if (!v.ok) return v;
    const s = G.state, c = s.cities[desde], K = G.COLONOS;
    pay({ grano: K.grano, oro: K.oro }); c.pop -= K.pop;
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
    if (!d) k.E = { semilla: E.semilla, n0: E.n0 };
    ciudadSitio.set(k, E); return E;
  };
  G.notaFundar = function (sitio, x, z) { const E = G.ciudadPendiente(sitio); return E ? CI.notaFundar(E, x, z) : null; };
  G.mapaCalorFundar = function (sitio) { const E = G.ciudadPendiente(sitio); return E ? CI.mapaCalor(E, 'fundar') : null; };
  G.fundarColonia = function (sitio, x, z) {
    const s = G.state, k = s.colonias && s.colonias[sitio]; if (!k || k.estado !== 'pendiente') return { ok: false, motivo: 'Los colonos aún no han llegado' };
    if (!isFinite(x) || !isFinite(z)) return { ok: false, motivo: 'Sitio no válido' };
    const E = G.ciudadPendiente(sitio); if (!E) return { ok: false, motivo: 'No se puede fundar sin la ciudad nueva' };
    const n = CI.notaFundar(E, x, z); if (!n.vale) return { ok: false, motivo: n.razones[0] };
    E.n0 = E.mesN = mesAlin();
    if (!CI.fundar(E, x, z)) return { ok: false, motivo: 'No se puede fundar aquí' };
    G.registrarColonia(sitio);
    const b = {}; for (const q in D.BUILD) b[q] = 0;
    const c = s.cities[sitio] = { owner: 'roma', barrio: 1, bdef: 0, tipo: 'municipio', tipoElegido: false, units: {}, obras: [], train: [], levas: [], reparto: G.repartoBase(), b: b, pop: 0, ciu: 0, esc: 0, heredado: {}, foroMin: 1 };
    G.ligarObras(c); c.ciudad = datosDe(E);
    incorporar(c, {}, false); c.heredado = {}; c.foroMin = 1;
    const r = regE.get(c); if (r) { c.pop = Math.max(c.pop, CI.poblacion(r.E)); ponerDatos(c, r); }
    k.estado = 'fundada'; delete k.E; k.cuando = s.t;
    G.log('🏛️ Has fundado ' + D.CITIES[sitio].n + '.', 'good'); emit('dirty'); G.rutasRevisar();
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
  // modo turnos: las marchas llegan siempre al cambio de estación (mínimo la siguiente)
  function llegada(t1) { return G.turnos ? Math.max(Math.ceil(t1 / D.TURNO_MESES - 1e-9) * D.TURNO_MESES, G.finTurno()) : t1; }
  G.llegada = llegada;
  G.turnos = false;
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
  const firstMine = list => list.find(id => G.state.cities[id] && G.state.cities[id].owner === 'roma') || 'roma';

  const EV_VERSION = 2;   // sube cuando cambia el AÑO de un hecho (Pirro 277 → 280): las partidas viejas recalculan qué hechos ya pasaron
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
      if (n > 0) { s.res.oro += 400 * n; G.log('🪙 Cartago paga ' + 400 * n + ' denarios de indemnización.', 'good'); }
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
    flex: function (s) { s.mods.flex = 1; }
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

  function newYear(year, enTurnos) {
    const s = G.state; D.anio = year;
    if (!enTurnos) turnoIA(year, 1);
    checkEvents(year);
    if (year < G.region().hasta && !s.over) { s.over = { win: false, why: G.region().final.agota }; emit('over'); }
  }

  // turno de los rivales: refuerzos de guarnición e incursiones. factor 1 = una vez al año; en turnos se llama 4 veces al año con 0.25
  function turnoIA(year, factor) {
    const s = G.state, mult = 1 + (D.START_YEAR - year) / (D.START_YEAR - G.region().hasta) * 0.8;
    for (const id in s.cities) {
      const c = s.cities[id]; if (c.owner === 'roma') continue;
      const d = D.CITIES[id], f = D.FACTIONS[c.owner];
      // refuerzos de la guarnición
      const base = G.guarnicionBase(id, c.owner);
      if (base) for (const k in base) { const cap = Math.round(base[k] * mult), cur = c.units[k] || 0; if (cur < cap) c.units[k] = Math.min(cap, cur + Math.max(1, Math.ceil(cap * 0.06 * factor))); }
      // incursiones
      if (!f.raid || year > f.from || year > 270) continue;
      if (s.marches.some(m => m.from === id && m.owner !== 'roma')) continue;
      const tg = G.neighbors(id).filter(n => s.cities[n].owner === 'roma');
      if (!tg.length || G.men(c.units) < 100 || Math.random() > 0.14 * factor) continue;
      const to = tg[Math.floor(Math.random() * tg.length)], u = {};
      for (const k in c.units) { const q = Math.floor(c.units[k] * 0.4); if (q > 0) { u[k] = q; c.units[k] -= q; } }
      const sq = Math.random() < D.SAQUEO_IA; spawn(c.owner, id, null, to, u, null, G.travel(id, to) * 2 + 4); if (sq) s.marches[s.marches.length - 1].mision = 'saqueo';
      G.log('⚠️ ' + f.n + ' envía ' + (sq ? 'una partida de saqueo' : 'un ejército') + ' desde ' + d.n + ' contra ' + D.CITIES[to].n + '.', 'bad');
      emit('alert', '¡' + f.n + ' marcha sobre ' + D.CITIES[to].n + '!');
    }
  }

  /* ---------- bucle ---------- */
  G.tick = function (dm) {
    const s = G.state; if (s) D.anio = G.yearOf(s.t);   // nombres según la fecha (D.nombreCiudad)
    if (!s || s.over || s.pending.length) return;
    if (dm > 1 && !G.turnos) { let n = 0; while (dm > 1e-9 && n++ < 400 && !s.over && !s.pending.length) { const d = Math.min(1, dm); G.tick(d); dm -= d; } return; }   // un salto largo se trocea mes a mes para cerrar cada cuenta
    const y0 = G.yearOf(s.t), m0 = Math.floor(s.t);
    let B = null;   // modo turnos: si llegamos al final de la estación, B es ese instante exacto
    if (G.turnos) { const fin = G.finTurno(); if (s.t + dm >= fin - 1e-9) { B = fin; dm = Math.max(0, fin - s.t); } }
    s.t += dm; if (B !== null) s.t = B;
    G.rutasRevisar();
    // economía
    const p = G.prod();
    for (const r of D.RES) {
      let v = p[r] * dm;
      if (r === 'oro' && v > 0 && s.deudaPaga > 0) { const pg = Math.min(v, s.deudaPaga); s.deudaPaga -= pg; v -= pg; }   // I3b: los ingresos pagan primero la paga atrasada
      s.res[r] += v; if (v > 0) s.gan[r] += v;
      if (s.res[r] < 0) { const falta = -s.res[r]; s.res[r] = 0; const sale = Math.min(falta, s.alm[r]); s.alm[r] -= sale; if (r === 'oro') s.deudaPaga = (s.deudaPaga || 0) + falta - sale; }   // el déficit sale de la caja y del almacén; el oro que falta se DEBE (I3b)
    }   // el déficit sale de la caja y, si no alcanza, del almacén
    if (Math.floor(s.t) > m0) G.cierreMes();
    G.reintentarPlazos(dm);
    const crm = G.bonoMul('crece');
    for (const id of G.myCities()) { const c = s.cities[id], pc = G.popCap(c); c.pop = s.res.grano + s.alm.grano > 0 ? (G.felicidad(c) < D.FELICIDAD_MIN_CRECER ? c.pop : Math.min(pc, c.pop + (1 + 0.03 * c.pop * Math.max(0, 1 - c.pop / pc)) * dm * crm)) : Math.max(20, c.pop * (1 - 0.02 * G.invMul('hambre') * dm)); }
    // inquietud de ciudades conquistadas: se calma con el tiempo (más deprisa con templo); con la gente descontenta se rebela
    for (const id of G.myCities()) { const c = s.cities[id]; if (!(c.inq > 0)) continue;
      if (c.inq > D.INQ_MESES * G.invMul('inqMeses') / 2 && G.felicidad(c) < D.INQ_REBELION) { rebelion(id); continue; }
      c.inq = Math.max(0, c.inq - dm * (1 + D.INQ_TEMPLO * G.diosNivel(c))); }
    // herrería
    if (s.forja.cola && s.t >= s.forja.cola.t1) { const k = s.forja.cola.k; s.forja[k]++; s.forja.cola = null; G.log('🔨 Herrería: ' + D.FORJA[k].n + ' nivel ' + s.forja[k] + '.'); emit('dirty'); }
    G.invTick(dm);   // saber (I5)
    // colas
    for (const id of G.myCities()) {
      const c = s.cities[id];
      for (const q of c.obras.filter(o => s.t >= o.t1)) terminarObra(id, c, q);
      while (c.train.length && s.t >= c.train[0].t1) { const q = c.train.shift(); c.units[q.u] = (c.units[q.u] || 0) + q.n; if (q.u !== 'milicia') { if (!c.levas) c.levas = []; c.levas.push({ u: q.u, n: q.n, t: s.t }); } G.log('🛡️ ' + D.CITIES[id].n + ': ' + q.n + ' ' + D.UNITS[q.u].n + ' listos.'); emit('dirty'); }
    }
    // modo turnos: al cerrar la estación se resuelve el mundo (año nuevo, rivales) antes de que lleguen las marchas
    if (B !== null) { const yb = G.yearOf(s.t); if (yb < y0) newYear(yb, true); turnoIA(yb, 0.25); }
    // marchas
    for (let i = s.marches.length - 1; i >= 0; i--) {
      const m = s.marches[i]; if (s.t < m.t1 - 1e-9 || (G.turnos && B === null)) continue;
      s.marches.splice(i, 1);
      if (m.colonos) { G.llegadaColonos(m); continue; }   // colonos: sin batalla y sin ciudad destino
      const c = s.cities[m.to];
      if (m.owner === 'roma') {
        if (c.owner === 'roma') { merge(c.units, m.units); if (m.hero) { s.hero.city = m.to; s.hero.march = null; } emit('dirty'); }
        else s.pending.push({ kind: 'attack', m: m });
      } else if (c.owner === 'roma') s.pending.push({ kind: 'defense', m: m });
      else if (c.owner === m.owner) merge(c.units, m.units);
    }
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
      G.log('🪙 Se debe la paga de las tropas (' + Math.round(s.deudaPaga) + ' de oro, ' + meses.toFixed(1) + ' meses). Desertan un ' + Math.round(f * 100) + ' %.', 'bad');
      emit('dirty');
    }
    const y1 = G.yearOf(s.t);
    if (y1 < y0 && B === null) newYear(y1);
  };

  // avanza el resto de la estación de golpe; false si una batalla pendiente o el fin de la partida lo detienen
  G.pasarTurno = function () {
    const s = G.state; if (!s || s.over || s.pending.length) return false;
    const fin = G.finTurno(); let n = 0;
    while (s.t < fin - 1e-9 && !s.over && !s.pending.length && n++ < 100) G.tick(Math.min(0.25, fin - s.t));
    return s.t >= fin - 1e-9;
  };

  /* ---------- cierre de mes (Q2) ---------- */
  // fracción del mes ya transcurrida (0 a 1)
  G.fraccionMes = () => { const t = G.state.t; return t - Math.floor(t + 1e-9); };
  // qué pasaría con la caja actual si el mes acabara con la producción que falta
  G.previsionCierre = function () {
    const s = G.state, p = G.prod(), cap = G.cap(), rem = 1 - G.fraccionMes(), out = {}, caja = {}, cu = {};
    for (const r of D.RES) { caja[r] = Math.max(0, s.res[r] + p[r] * rem); cu[r] = cuartoDisp(r); }
    for (const v of vencen(Math.floor(s.t + 1e-9) + 1)) {   // mismo orden y mismas reglas que G.cierreMes: si no alcanza, no se cobra (la obra se pausa)
      if (!Object.keys(v.c).every(r => caja[r] + cu[r] >= v.c[r])) continue;
      for (const r in v.c) { const de = Math.min(v.c[r], caja[r]); caja[r] -= de; cu[r] -= v.c[r] - de; } }
    for (const r of D.RES) { const sobra = caja[r], cabe = Math.max(0, cap - s.alm[r]); out[r] = { sobra: Math.floor(sobra), cabe: Math.floor(cabe), perdera: Math.max(0, Math.floor(sobra - cabe)) }; }
    return out;
  };
  // avisos de lo que se va a perder (solo con el mes avanzado; con completo=true, también al inicio: previsión del mes entero)
  G.avisoCierre = function (completo) {
    const s = G.state, out = []; if (!s || (!completo && G.fraccionMes() < D.AVISO_CIERRE)) return out;
    const NOM = { madera: 'Madera', piedra: 'Piedra', hierro: 'Hierro', grano: 'Grano', oro: 'Oro' }, pr = G.previsionCierre();
    for (const r of D.RES) if (pr[r].perdera >= 1) out.push(NOM[r] + ': sobran ' + pr[r].sobra + ', caben ' + pr[r].cabe + ', se perderán ' + pr[r].perdera + (completo ? ' si no lo gastas.' : '.'));
    return out;
  };
  /* ---------- cuentas del mes (Q3) ---------- */
  G.cuentas = function () {
    const s = G.state, p = G.prod(), pr = G.previsionCierre(), pl = G.plazos(), out = { mat: {}, oro: {} };
    for (const r of D.RES) { if (r === 'oro') continue;
      const comp = (r === 'grano' ? p.comida : (s.gastoMes && s.gastoMes[r]) || 0) + pl[r],   /* gasto de la caja del mes; queda es la previsión de cierre (incluye caja inicial y ventas), no entra-comprometido */
         entra = r === 'grano' ? p.grano + p.comida : p[r], x = pr[r];
      out.mat[r] = { entra: entra, comprometido: comp, plazos: pl[r], queda: x.sobra, alAlmacen: Math.max(0, x.sobra - x.perdera), caben: x.cabe, perdera: x.perdera };
    }
    const m = G.mantenimiento(), gm = (s.gastoMes && s.gastoMes.oro) || 0, ob = Math.min(gm, s.obrasMes || 0) + pl.oro, otros = Math.max(0, gm - (s.obrasMes || 0)), d = p.det, ing = d.impuestos + d.foro + d.rutas, sab = p.sabios || 0, gas = m.edificios + m.tropas + ob + otros + sab;
    out.oro = { impuestos: d.impuestos, foro: d.foro, rutas: d.rutas, ingresos: ing, edificios: m.edificios, legiones: m.tropas, obras: ob, otros: otros, deuda: Math.round(s.deudaPaga || 0), sabios: sab, plazosOro: pl.oro, gastos: gas, saldo: ing - gas, neto: p.oro };
    return out;
  };
  // vende en el mercado lo que se perdería de r; devuelve el oro recibido (0 si no se puede)
  G.ultimaVenta = { got: 0, vendido: 0, quedara: 0, motivo: '' };
  G.venderSobrante = function (r) {
    const U = G.ultimaVenta = { got: 0, vendido: 0, quedara: 0, motivo: '' }, s = G.state;
    if (!s || r === 'oro' || !(r in s.res)) { U.motivo = 'invalido'; return 0; }
    const rate = G.tradeRate(); if (!rate) { U.motivo = 'sinmercado'; return 0; }
    const per = G.previsionCierre()[r].perdera; if (per < 1) { U.motivo = 'sinsobrante'; return 0; }
    const hueco = Math.max(0, G.cap() - s.alm.oro - s.res.oro); if (hueco < 1) { U.motivo = 'orolleno'; U.quedara = per; return 0; }
    const dar = Math.min(per, Math.floor(s.res[r]), Math.floor(hueco / rate)); if (dar < 1) { U.motivo = s.res[r] < 1 ? 'sincaja' : 'orolleno'; U.quedara = per; return 0; }
    const got = G.trade(r, 'oro', dar); U.got = got; U.vendido = dar; U.quedara = G.previsionCierre()[r].perdera;
    U.motivo = !got ? 'orolleno' : U.quedara >= 1 ? 'parcial' : 'ok';
    return got;
  };
  // cierra el mes: lo que sobra de la caja pasa al almacén hasta su tope; el resto se pierde
  G.cierreMes = function () {
    const s = G.state, cap = G.cap(), reg = { mes: Math.floor(s.t + 1e-9), tn: Math.floor((Math.floor(s.t + 1e-9) - 1) / D.TURNO_MESES), r: {} }; let pierde = [], rojo = false;
    for (const v of vencen(Math.floor(s.t + 1e-9))) {   // plazos de obras y reclutas, de la caja antes de guardar
      if (!pagaCuota(v.q)) { v.q.pausa = true; rojo = true; G.log('⏸️ ' + D.CITIES[v.id].n + ': ' + (v.q.u ? 'instrucción' : 'obra') + ' detenida por falta de fondos.', 'bad'); } }
    const paga = G.pagaSabios();   // paga de los sabios (I5b): se cobra con los plazos; sin oro, las escuelas cierran
    if (paga > 0) {
      if (G.canAfford({ oro: paga })) gasta('oro', paga, true);
      else { for (const id of G.myCities()) { const sb = s.cities[id].sabios; if (sb) sb.dot = 0; } rojo = true; G.log('🎓 Sin oro para pagar a los sabios: las escuelas cierran.', 'bad'); }
    }
    s.obrasMes = 0;
    mesCiudades();
    G.senadoMes(rojo || s.deudaPaga > 0);
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
      const sobra = Math.max(0, s.res[r]), cabe = Math.max(0, cap - s.alm[r]), guarda = Math.min(sobra, cabe), per = sobra - guarda;
      s.alm[r] += guarda; s.res[r] = 0; s.gastoMes[r] = 0; s.cuarto[r] = Math.floor(s.alm[r] * D.CUARTO_ALMACEN);
      reg.r[r] = { gan: Math.round(s.gan[r]), sob: Math.round(sobra), gua: Math.round(guarda), per: Math.round(per) }; s.gan[r] = 0;
      if (per >= 1) pierde.push(Math.round(per) + ' de ' + r);
    }
    s.informe = (s.informe || []).filter(e => e.tn === reg.tn); s.informe.push(reg);
    if (pierde.length || reg.mes % D.TURNO_MESES === 0) G.log('📦 Cierre de mes: guardado ' + D.RES.map(r => reg.r[r].gua + ' ' + r).join(', ') + (pierde.length ? '; perdido ' + pierde.join(' ') : '') + '.', pierde.length ? 'bad' : '');
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
      out.push({ k: 'bad', x: D.FACTIONS[m.owner].n + ' (' + G.men(m.units) + ' hombres) llega a ' + D.CITIES[m.to].n + ' al acabar este turno.' });
      rec = rec || 'Refuerza ' + D.CITIES[m.to].n + ' antes de que acabe la estación.';
    }
    for (const id of G.coloniasPendientes()) out.push({ k: '', x: 'Los colonos han llegado a ' + G.lugar(id).n + ': funda la colonia.' });
    for (const r of ['grano', 'oro']) if (p[r] < 0 && (s.res[r] + s.alm[r]) / -p[r] < 3) out.push({ k: 'bad', x: (r === 'grano' ? 'El grano' : 'El oro') + ' se acaba en ' + Math.max(1, Math.ceil((s.res[r] + s.alm[r]) / -p[r])) + ' mes(es).' });
    const sin = mis.filter(id => G.huecosLibres(s.cities[id]) > 0).map(id => D.CITIES[id].n);
    if (sin.length) { out.push({ k: '', x: 'Sin obras en cola: ' + sin.slice(0, 3).join(', ') + (sin.length > 3 ? '…' : '') + '.' }); rec = rec || 'Pon a trabajar a los constructores.'; }
    for (const x of G.avisoCierre(G.turnos)) out.push({ k: 'bad', x: x });
    const rs = typeof G.riesgosImperio === 'function' ? (G.riesgosImperio() || []).filter(r => r.meses <= G.avisoMeses()).sort((a, b) => b.p - a.p) : [];
    if (rs.length) { const r = rs[0]; out.unshift({ k: 'bad', x: r.t + (r.remedio ? ' ' + r.remedio : '') }); rec = rec || r.remedio || null; }
    const llenos = D.RES.filter(r => s.alm[r] >= cap - 1);
    if (llenos.length) out.push({ k: '', x: 'Almacén lleno: ' + llenos.join(', ') + '. Gasta o amplía.' });
    const mi = G.misionActual(), sen = G.favorBajo() ? { k: 'bad', x: 'Senado: favor bajo; sin tratados ajenos ni levas extra.' } : mi ? { k: '', x: 'Senado: ' + mi.m.n + ', quedan ' + mi.quedan + ' meses. ' + mi.falta } : null;   // sustituye al tercer aviso
    const l = [head].concat(out.slice(0, sen ? 2 : 3)); if (sen) l.push(sen);
    l.push({ k: rec ? '' : 'good', x: rec || 'Estación tranquila: reúne tropas o amplía la ciudad.' });
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
    if (pb.kind === 'defend') return b > 1.3 * a ? { tipo: 'resistir', lado: 0, rondas: 12 } : null;
    if (heroIn !== undefined ? heroIn : pb.m.hero) { if (a < 0.5 * b) return { tipo: 'escapar', lado: 0 }; }
    if (G.nivelMuralla(c) >= 3) return { tipo: 'tomar', lado: 0, zona: { x: 0.35, y: 0.42, w: 0.3, h: 0.16 }, seg: 40 };
    return null;
  };
  G.battleInfo = function (pb) {
    const s = G.state, m = pb.m, cid = m.to, c = s.cities[cid], d = D.CITIES[cid], h = s.hero;
    const fa = G.forjaMul(s, 'armas'), fd = G.forjaMul(s, 'armaduras');
    const hm = { atkMul: (1 + 0.04 * h.sk.mando) * (s.mods.flex ? 1.1 : 1) * fa, defMul: (1 + 0.03 * h.sk.disc) * fd, mor: 4 * h.sk.disc };
    const noHero = { atkMul: (s.mods.flex ? 1.1 : 1) * fa, defMul: fd, mor: 0 };
    let me, foe, heroIn;
    if (pb.kind === 'attack') {
      heroIn = m.hero;
      me = Object.assign({ units: m.units, name: 'Roma', col: D.FACTIONS.roma.col, gen: heroIn ? { n: h.name, mando: h.sk.mando, disc: h.sk.disc, lvl: h.lvl } : null }, heroIn ? hm : noHero);
      const g = c.owner === d.f ? G.cityGen(cid, G.yearOf(s.t)) : null;
      foe = { units: c.units, name: D.FACTIONS[c.owner].n, col: D.FACTIONS[c.owner].col, gen: g, atkMul: g ? 1 + 0.04 * g.mando : 1, defMul: g ? 1 + 0.03 * g.disc : 1, mor: g ? 4 * g.disc : 0 };
    } else {
      heroIn = G.heroAvailable(cid);
      const u = Object.assign({}, c.units); u.vigiles = 20 + 20 * G.nivelMuralla(c);
      me = Object.assign({ units: u, name: 'Roma', col: D.FACTIONS.roma.col, gen: heroIn ? { n: h.name, mando: h.sk.mando, disc: h.sk.disc, lvl: h.lvl } : null }, heroIn ? hm : noHero);
      { const dg = G.diosDe(c); if (dg && dg.mor) me.mor += dg.mor * G.diosNivel(c); }
      const g = m.gen;
      foe = { units: m.units, name: D.FACTIONS[m.owner].n, col: D.FACTIONS[m.owner].col, gen: g, atkMul: g ? 1 + 0.04 * g.mando : 1, defMul: g ? 1 + 0.03 * g.disc : 1, mor: g ? 4 * g.disc : 0 };
    }
    {   // I5c-A: ciencia de guerra del jugador
      const wall = G.nivelMuralla(c), mar = pb.kind === 'attack' && G.esMar(m.from, m.to);
      me.atkMul *= Math.min(D.SABER.techos.atk, G.invMul('atk') * (mar ? G.invMul('atkMar') : 1)); me.mor += G.invSum('mor');
      if (pb.kind === 'defend') me.defMul *= 1 + G.invSum('defMuro') * Math.min(6, wall);
      else if (wall > 0 && G.invSum('brecha') > 0) foe.defMul /= (1 + 0.1 * wall) / (1 + 0.1 * Math.max(0, wall - G.invSum('brecha')));
    }
    {   // I5c-B: copia del rival
      const ff = pb.kind === 'attack' ? c.owner : m.owner, k = G.copiaDe(ff);
      if (G.copiaBando(ff) && k > 0) {
        const V = G.cienciaGuerra(pb.kind === 'defend' ? 0 : G.nivelMuralla(c), pb.kind === 'defend' && G.esMar(m.from, m.to)), q = k * D.SABER.copia;
        foe.atkMul *= 1 + q * (V.atk - 1); foe.defMul *= 1 + q * (V.def - 1); foe.mor += q * V.mor;
      }
    }
    {   // N15b: levas bisoñas del jugador y objetivo de batalla
      const oc = pb.kind === 'attack' ? m.from : cid; me.bis = G.fraccionBis(oc); foe.bis = 0;
    }
    const cfg = { sides: [me, foe], defender: pb.kind === 'attack' ? 1 : 0, wall: G.nivelMuralla(c), seed: Math.floor(s.t * 1000) + m.id };
    const ob = G.objetivoBatalla(pb, me, foe, c, heroIn); if (ob) cfg.objetivo = ob;
    return { cfg: cfg, city: cid, heroIn: heroIn, kind: pb.kind };
  };

  const keep = (surv, lost, f, g) => { const o = {}; for (const k in surv) { if (k === 'vigiles') continue; const n = Math.floor(surv[k] * f + (lost[k] || 0) * g); if (n > 0) o[k] = n; } return o; };

  // Una ciudad tuya pasa a otro dueño. Sin f: vuelve a su dueño anterior (inquietud). Con f y texto: rebelión de un hecho (Capua, 216)
  function rebelion(id, fijo, texto) {
    const s = G.state, c = s.cities[id], f = fijo || (c.prev && D.FACTIONS[c.prev] && c.prev !== 'roma' ? c.prev : D.CITIES[id].f);
    soltarCiudad(c); c.owner = f; c.inq = 0; c.obras.length = 0; c.train = []; c.levas = []; c.units = Object.assign({}, G.guarnicionBase(id, f) || {});
    if (s.hero.city === id) { s.hero.city = 'roma'; s.hero.march = null; }
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
    const s = G.state, pb = s.pending.shift(), m = pb.m, cid = m.to, c = s.cities[cid], d = D.CITIES[cid], h = s.hero;
    const heroIn = pb.kind === 'attack' ? m.hero : G.heroAvailable(cid);
    const esc = !!(res.objetivo && res.objetivo.tipo === 'escapar' && res.objetivo.fin && res.objetivo.cumplido), win = res.winner === 0 && !esc, out = { win: win, kind: pb.kind, city: cid, dead: res.dead, lines: [] };
    const copL = G.copiaActualiza(pb, m, res, pb.kind === 'attack' ? c.owner : m.owner); for (const x of copL) out.lines.push(x);
    s.stats.battles++; if (win) s.stats.wins++; s.stats.kills += res.dead[1]; s.stats.lost += res.dead[0];
    if (pb.kind === 'attack') {
      if (win && m.mision === 'saqueo') {
        const loot = G.botin(cid), home = s.cities[m.from].owner === 'roma' ? m.from : 'roma';
        for (const r of D.RES) s.res[r] += loot[r];
        merge(s.cities[home].units, keep(res.surv[0], res.lost[0], 1, 0.25)); c.units = keep(res.surv[1], res.lost[1], 1, 0.3); c.saqueada = s.t;
        if (m.hero) { h.city = home; h.march = null; }
        out.saqueo = true; out.lines.push('💰 Saqueo de ' + d.n + ': ' + D.RES.map(r => '+' + loot[r] + ' ' + D.RES_ICON[r]).join(' ') + '.', 'Tus tropas vuelven a ' + D.CITIES[home].n + '; la ciudad sigue siendo de ' + D.FACTIONS[c.owner].n + '.');
        G.log('💰 Saqueada ' + d.n + ' sin conquistarla.', 'good');
      } else if (win) {
        const prev = D.FACTIONS[c.owner].n;
        incorporar(c, keep(res.surv[0], res.lost[0], 1, 0.25), true);
        c.b.muralla = Math.max(0, (c.b.muralla || 0) - 1);
        if (m.hero) { h.city = cid; h.march = null; }
        const loot = Math.round(150 * (c.w || d.w) * (1 + 0.1 * h.sk.log));
        for (const r of D.RES) s.res[r] += loot;
        out.lines.push('🏛️ ' + d.n + ' es ahora romana.', '💰 Botín: +' + loot + ' de cada recurso.');
        G.log('🏆 ¡' + d.n + ' conquistada a ' + prev + '!', 'good');
        if (cid === G.region().capitalRival) { s.over = { win: true, why: G.region().final.gana.replace('{anio}', G.yearOf(s.t)) }; }
      } else {
        merge(s.cities[m.from].owner === 'roma' ? s.cities[m.from].units : s.cities.roma.units, keep(res.surv[0], res.lost[0], 0.7, 0));
        c.units = keep(res.surv[1], res.lost[1], 1, 0.3);
        if (m.hero) { h.city = s.cities[m.from].owner === 'roma' ? m.from : 'roma'; h.march = null; }
        if (esc) out.lines.push('🦅 ' + h.name + ' escapó del campo.');
        out.lines.push('Los supervivientes se retiran a ' + D.CITIES[m.from].n + '.');
        G.log('💀 Derrota ante los muros de ' + d.n + '.', 'bad');
      }
    } else {
      if (win) {
        c.units = keep(res.surv[0], res.lost[0], 1, 0.25);
        out.lines.push('🛡️ ' + d.n + ' resiste.');
        G.log('🛡️ ' + d.n + ' rechaza el ataque de ' + D.FACTIONS[m.owner].n + '.', 'good');
      } else if (m.mision === 'saqueo') {
        const esc = D.ESCONDITE * (c.b.almacen || 0), rob = {};
        for (const r of D.RES) { const tot = s.res[r] + s.alm[r]; rob[r] = Math.round(Math.max(0, Math.min(D.SAQUEO_ROBO * tot, tot - esc))); const dc = Math.min(rob[r], Math.max(0, s.res[r])); s.res[r] -= dc; s.alm[r] = Math.max(0, s.alm[r] - (rob[r] - dc)); }   // primero se lleva la caja; el almacén esconde parte
        c.units = keep(res.surv[0], res.lost[0], 1, 0.3); arrabalSaqueado(c, m, res, out);
        out.saqueo = true; out.lines.push('🔥 ' + D.FACTIONS[m.owner].n + ' saquea ' + d.n + ' y se marcha: ' + D.RES.map(r => '-' + rob[r] + ' ' + D.RES_ICON[r]).join(' ') + '.', 'Cada almacén esconde ' + D.ESCONDITE + ' de cada recurso.');
        G.log('🔥 ' + d.n + ' ha sido saqueada por ' + D.FACTIONS[m.owner].n + '.', 'bad');
      } else {
        arrabalSaqueado(c, m, res, out);
        soltarCiudad(c); c.owner = m.owner; c.units = keep(res.surv[1], res.lost[1], 1, 0.3); c.obras.length = 0; c.train = [];
        out.lines.push('🔥 ' + d.n + ' ha caído en manos de ' + D.FACTIONS[m.owner].n + '.');
        G.log('🔥 ' + d.n + ' ha caído ante ' + D.FACTIONS[m.owner].n + '.', 'bad');
        if (cid === 'roma') s.over = { win: false, why: 'Roma ha caído en ' + G.yearOf(s.t) + ' a.C. ante ' + D.FACTIONS[m.owner].n + '. Vae victis.' };
        else if (h.city === cid) h.city = 'roma';
        // las marchas propias hacia la ciudad perdida se convierten en ataques al llegar (ya lo gestiona tick)
      }
    }
    if (heroIn) {
      const before = h.lvl; addXp(res.dead[1] / 4 * (win ? 1.5 : 0.7) + 10);
      out.lines.push('🦅 ' + h.name + ' gana experiencia' + (h.lvl > before ? ' y sube al nivel ' + h.lvl + '.' : '.'));
      if (res.genDead[0] && !esc) { const mw = Math.max(6, 24 + G.invSum('herida')); h.wound = s.t + mw; out.lines.push('🩸 ' + h.name + ' ha sido herido: ' + mw + ' meses de convalecencia.'); G.log('🩸 ' + h.name + ' cae herido en combate.', 'bad'); }
    }
    G.save();
    if (s.over) emit('over');
    return out;
  };

  /* ---------- guardado ---------- */
  G.save = function () { try { if (typeof localStorage !== 'undefined' && G.state) { for (const id of G.myCities()) { const c = G.state.cities[id], r = CI && regE.get(c); if (r) ponerDatos(c, r); } localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } } catch (e) { /* almacenamiento no disponible */ } };
  G.hasSave = function () { try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  G.load = function () { let ok = false; cargando = true; try { ok = cargar(); } finally { cargando = false; } if (ok && CI) alCargar(); return ok; };
  function cargar() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) { G.state = s; for (const id in s.cities) G.ligarObras(s.cities[id]); if (s.turnos === undefined) s.turnos = true; G.turnos = !!s.turnos; if (G.turnos) { if (s.speed === undefined) s.speed = 0; for (const m of s.marches) { const a = Math.ceil(m.t1 / D.TURNO_MESES - 1e-9) * D.TURNO_MESES; if (a > m.t1) m.t1 = a; } } if (!s.rutas) s.rutas = []; if (!s.forja) s.forja = { armas: 0, armaduras: 0, cola: null }; if (s.evN !== D.EVENTS.length || s.evV !== EV_VERSION) { const y = G.yearOf(s.t); s.ev = {}; D.EVENTS.forEach((e, i) => { if (y <= e.y) s.ev[i] = 1; }); s.evN = D.EVENTS.length; } s.evV = EV_VERSION; D.anio = G.yearOf(s.t); for (const id in s.cities) { const c = s.cities[id]; if (!D.TIPOS[c.tipo]) c.tipo = 'municipio'; if (c.tipoElegido === undefined) c.tipoElegido = false; if (c.inq === undefined) c.inq = 0; if (c.bdef === undefined) c.bdef = 0;  if (c.b.templo > 0 && !D.DIOSES[c.dios]) c.dios = 'marte'; if (!D.FACTIONS[c.owner]) c.owner = id === 'messana' ? 'mamertinos' : 'campanos'; if (id === 'messana' && c.owner === 'campanos') c.owner = 'mamertinos'; for (const b of ['viviendas', 'mercado', 'puerto', 'herreria']) if (c.b[b] === undefined) c.b[b] = b === 'viviendas' ? 2 : 0; if (c.pop === undefined) c.pop = Math.round(G.popCap(c) * 0.7); if (!D.IMPUESTOS[c.imp]) c.imp = 'normal'; if (!G.repartoValido(c.reparto)) c.reparto = G.repartoBase(); if (id === 'carthagonova' && c.owner !== 'iberos' && !c.w) c.w = D.CITIES.carthagonova.en228.w; } G.state = s; for (const id in s.cities) if (s.cities[id].barrio === undefined) { const c = s.cities[id]; c.barrio = 1; c.barrio = G.barrioInfo(c).objetivo; } for (const id in s.cities) { const c = s.cities[id]; if (!c.levas) c.levas = []; if (c.esc === undefined) c.esc = 0; if (c.ciu === undefined) c.ciu = (c.barrio || 1) >= 2 ? Math.round((c.pop || 0) * 0.1) : 0; } G.migrarRegion(s); G.migrarCaja(s); G.migrarRetirados(s); G.migrarSenado(s); G.migrarInv(s); G.migrarDeuda(s); G.migrarColonias(s); G.migrarAjustes(s); return true; } } catch (e) { /* partida corrupta */ } return false; }
  // tras cargar: cada ciudad propia recupera (o estrena) su ciudad nueva; la obra en curso de una partida vieja se liga a su pieza
  function alCargar() {
    for (const id of G.myCities()) { const c = G.state.cities[id], antes = Object.assign({}, c.b), tenia = !!c.ciudad; regE.delete(c);
      try { if (abrir(c) && !tenia) migrarObra(c, antes); } catch (e) { regE.set(c, false); }
      try { const n = G.nivelDeBarrios(c); if (n) { c.barrio = n; c.bdef = 0; } } catch (e) { /* sin barrios: se queda el de la partida */ } }   // el nivel de ciudad sale de los barrios rehechos
  }
  // partida vieja sin caja: los recursos pasan al almacén hasta el tope y el resto queda en la caja (no se pierde nada)
  G.migrarDeuda = function (s) { if (!(s.deudaPaga > 0)) s.deudaPaga = 0; };   // I3b: partida vieja, sin deuda
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
    if (!s.alm) s.alm = {}; const antes = G.state; G.state = s; const cap = G.cap(); G.state = antes;
    const total = {};
    for (const r in tot) { const ya = s.alm[r] || 0, pon = Math.max(0, Math.min(tot[r], cap - ya)); s.alm[r] = ya + pon; if (s.cuarto) s.cuarto[r] = (s.cuarto[r] || 0); total[r] = pon; if (tot[r] > pon) perdido[r] = tot[r] - pon; }
    s.devuelto = Object.assign({}, niv, { total: total, perdido: perdido }); G.ultimaMigracion = s.devuelto;
    return s.devuelto;
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
    tropas_en: { cumple: (s, c) => s.cities[c.ciudad].owner === 'roma' && tropasDe(s, [c.ciudad]) >= c.n, falta: (s, c) => 'Hombres en ' + D.CITIES[c.ciudad].n + ': ' + tropasDe(s, [c.ciudad]) + ' de ' + c.n + '.' },
    rutas: { cumple: (s, c) => (s.rutas || []).length >= c.n, falta: (s, c) => 'Rutas comerciales: ' + (s.rutas || []).length + ' de ' + c.n + '.' },
    bien: { cumple: (s, c) => propias(s).some(id => D.CITIES[id].esp === c.bien), falta: (s, c) => 'Falta una ciudad propia con ' + D.ESPECIAL[c.bien].n.toLowerCase() + '.' },
    colonia: { cumple: (s, c) => G.coloniasFundadas(s) >= (c.n || 1), falta: (s, c) => 'Colonias fundadas: ' + G.coloniasFundadas(s) + ' de ' + (c.n || 1) + '.' },
    oro: { cumple: (s, c) => s.res.oro + s.alm.oro >= c.n, falta: (s, c) => 'Oro: ' + Math.floor(s.res.oro + s.alm.oro) + ' de ' + c.n + '.' }
  };
  // partida nueva o vieja: favor 50/50 y sin misión
  /* Saber (I5): estado de investigación. Solo datos; las reglas (G.inv*) llegan en I5-B. */
  G.migrarInv = function (s) {
    const i = s.inv;
    if (!i || typeof i !== 'object') { s.inv = { v: 1, edad: 1, hechas: {}, cola: null, copia: {}, rev: 0 }; return; }
    if (!i.v) i.v = 1; if (!(i.edad >= 1)) i.edad = 1; if (!i.hechas) i.hechas = {}; if (i.cola === undefined) i.cola = null; if (!i.copia) i.copia = {}; if (!(i.rev >= 0)) i.rev = 0;
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
    if (alta > 0 && !G.canAfford({ oro: alta })) { if (previo) c.sabios = previo; else delete c.sabios; return { ok: false, motivo: 'Faltan ' + Math.ceil(alta - G.disponible('oro')) + ' denarios' }; }
    if (alta > 0) gasta('oro', alta);
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
  G.invTiempo = id => { const d = invDe(id); return d ? d.time * D.SABER.tiempoMul * mejorTipo('invTiempo') : 0; };
  const nomR = { madera: 'madera', piedra: 'piedra', hierro: 'hierro', grano: 'grano', oro: 'oro' };
  G.invEstado = function (id) {
    const s = G.state, i = s.inv, d = invDe(id); if (!d) return { e: 'req', motivo: 'No existe' };
    if (i.hechas[id] !== undefined) return { e: 'hecha', motivo: 'Hecha' };
    if (i.cola && i.cola.id === id) return { e: 'curso', motivo: 'En curso' };
    if (D.EDADES[id]) { if (id !== 'E' + (i.edad + 1)) return { e: 'edad', motivo: i.edad >= 4 ? 'Ya estás en la última edad' : 'Antes sube a la Edad ' + ROMANO[i.edad + 1] }; }
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
    G.log((D.EDADES[id] ? '🏛️ Empiezas la ' + D.EDADES[id].n : '📜 Empiezas a estudiar ' + D.INVEST[id].n) + ' (' + Math.round(P) + ' meses).'); emit('dirty'); return { ok: true, motivo: '' };
  };
  G.edadUp = function () { const e = G.state.inv.edad; if (e >= 4) return { ok: false, motivo: 'Ya estás en la última edad' }; return G.invUp('E' + (e + 1)); };
  G.eurekaMul = function (id) { const d = D.INVEST[id], e = d && d.eureka; if (!e) return 1; const l = Array.isArray(e) ? e : [e]; return l.some(c => G.state.cities[c] && G.state.cities[c].owner === 'roma') ? 4 / 3 : 1; };
  G.invTick = function (dm) {
    const i = G.state.inv, q = i && i.cola; if (!q) return;
    q.p += dm * G.saberVel() * G.eurekaMul(q.id); if (q.p >= q.P - 1e-9) G.invCompleta(q.id);
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
    const s = G.state, i = s.inv, sig = i.edad < 4 ? 'E' + (i.edad + 1) : null, q = i.cola, ramas = { ca: 0, of: 0, gu: 0, ma: 0 };
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
  };
  const topeFavor = v => Math.max(D.SENADO.min, Math.min(D.SENADO.max, v));
  G.favor = function () { const s = G.state; G.migrarSenado(s); return { senado: Math.round(s.favor.senado), pueblo: Math.round(s.favor.pueblo) }; };
  G.favorBajo = () => { const s = G.state; G.migrarSenado(s); return s.favor.senado < D.SENADO.bajo; };
  G.senadoMotivo = () => G.favorBajo() ? 'El Senado te mira con malos ojos (favor ' + Math.round(G.state.favor.senado) + '): niega tratados con ciudades ajenas y levas extra.' : '';
  G.misionActual = function () {
    const s = G.state; G.migrarSenado(s); const x = s.mision, m = x && D.MISIONES[x.id]; if (!m) return null;
    return { m: m, t0: x.t0, t1: x.t1, quedan: Math.max(0, x.t1 - Math.floor(s.t + 1e-9)), falta: G.MISION_TIPOS[m.cond.tipo].falta(s, m.cond) };
  };
  const aplicaMision = (e, signo) => {
    const s = G.state; if (!e) return; if (e.oro) s.res.oro += e.oro;
    s.favor.senado = topeFavor(s.favor.senado + (e.favorSenado || 0)); s.favor.pueblo = topeFavor(s.favor.pueblo + (e.favorPueblo || 0));
  };
  G.favorAplica = (senado, pueblo) => { G.migrarSenado(G.state); aplicaMision({ favorSenado: senado || 0, favorPueblo: pueblo || 0 }); };
  // asigna la siguiente misión: la primera por orden que no se hizo y cuyo año está en su ventana
  G.senadoAsignar = function () {
    const s = G.state; G.migrarSenado(s); if (s.mision) return null;
    const y = G.yearOf(s.t), mes = Math.floor(s.t + 1e-9);
    const m = Object.values(D.MISIONES).find(q => !s.misionesHechas[q.id] && y <= q.desde && y >= q.desde - D.SENADO.ventana && G.MISION_TIPOS[q.cond.tipo]);
    if (!m) return null;
    s.mision = { id: m.id, t0: mes, t1: mes + m.plazo };
    G.log('🏛️ El Senado te encarga: ' + m.n + '. ' + m.texto, '');
    return m;
  };
  // cada cierre de mes: el pueblo se acerca al ánimo medio; oro en rojo baja al Senado; se evalúa la misión
  G.senadoMes = function (rojo) {
    const s = G.state; G.migrarSenado(s); const S = D.SENADO, mes = Math.floor(s.t + 1e-9), mis = propias(s);
    if (mis.length) { let a = 0; for (const id of mis) a += G.felicidad(s.cities[id]); a /= mis.length; s.favor.pueblo += (a - s.favor.pueblo) * S.inercia; }
    if (rojo || s.res.oro < 0) { s.favor.senado += S.oroRojo; G.log('🏛️ El Senado desconfía: el mes cierra con el oro en rojo.', 'bad'); }
    const x = s.mision, m = x && D.MISIONES[x.id];
    if (x && !m) s.mision = null;
    else if (x && G.MISION_TIPOS[m.cond.tipo].cumple(s, m.cond)) {
      aplicaMision(Object.assign({ favorSenado: S.premio }, m.premio)); s.misionesHechas[m.id] = 'ok'; s.mision = null; s.proxMision = mes + S.pausa;
      G.log('🏛️ Misión cumplida: ' + m.n + '. El Senado lo agradece.', 'good');
    } else if (x && mes >= x.t1) {
      aplicaMision(Object.assign({ favorSenado: S.castigo }, m.castigo)); s.misionesHechas[m.id] = 'fallo'; s.mision = null; s.proxMision = mes + S.pausa;
      G.log('🏛️ Misión fallida: ' + m.n + '. El Senado se queja.', 'bad');
    }
    s.favor.senado = topeFavor(s.favor.senado); s.favor.pueblo = topeFavor(s.favor.pueblo);
    if (!s.mision && mes >= s.proxMision) G.senadoAsignar();
  };
  G.wipe = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ } };

  root.Game = G;
  if (typeof module !== 'undefined') { module.exports = G; try { G.usarCiudad(require('./ciudad.js')); } catch (e) { /* sin ciudad nueva: el juego sigue con números */ } }
})(typeof window !== 'undefined' ? window : globalThis);
