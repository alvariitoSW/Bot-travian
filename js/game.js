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
  G.diosDe = c => ((c.b.templo || 0) > 0 || (c.queue && c.queue.b === 'templo')) && D.DIOSES[c.dios] ? D.DIOSES[c.dios] : null;
  G.diosNivel = c => G.diosDe(c) ? (c.b.templo || 0) : 0;
  G.elegirDios = function (cid, k) { const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.DIOSES[k] || (c.b.templo || 0) > 0 || (c.queue && c.queue.b === 'templo') || (D.DIOSES[k].sea && !D.CITIES[cid].sea)) return false; c.dios = k; return true; };
  G.inqMul = c => (c.inq > 0 ? 1 - D.INQ_PROD * Math.min(1, c.inq / D.INQ_MESES) : 1);
  G.tipoDe = c => D.TIPOS[c && c.tipo] || D.TIPOS.municipio;
  G.solares = function (id) { const d = D.CITIES[id], c = G.state && G.state.cities[id]; if (d.solares) return d.solares; return Math.min(D.SOLARES_MAX, D.SOLARES_BASE + Math.floor(((c && c.w) || d.w) / 2)); };
  // edificios urbanos que ocupan solar: nivel 1 o más (o levantándose ahora)
  G.solaresUsados = function (c) { let n = 0; for (const b in D.BUILD) if (D.BUILD[b].solar && ((c.b[b] || 0) >= 1 || (c.queue && c.queue.b === b))) n++; return n; };
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
    const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.BUILD[b] || !D.BUILD[b].solar || b === 'foro' || (c.b[b] || 0) < 1 || (c.queue && c.queue.b === b)) return false;
    const pz = piezaDe(b), r = pz && infoC(c);
    if (r) { const e = menorMejora(r.E, pz); if (!e) return false; quitar(r.E, e.id); sinc(c, r); ponerDatos(c, r); }
    else c.b[b] = 0;
    const pc = G.popCap(c); if (c.pop > pc) c.pop = pc; return true;
  };
  G.cap = () => { let c = 0; for (const id of G.myCities()) c += 600 * Math.pow(1.45, G.state.cities[id].b.almacen || 0); return Math.round(c); };
  G.men = units => { let n = 0; for (const k in units) n += units[k] * (D.UNITS[k].cls === 'ele' ? 1 : 1); return n; };
  G.power = units => { let p = 0; for (const k in units) { const u = D.UNITS[k]; p += units[k] * (u.atk + u.def) * (u.hp || 1) * (u.mass ? 1.6 : 1); } return Math.round(p / 10); };
  G.pos = id => { const c = D.CITIES[id]; return D.proj(c.lon, c.lat); };
  G.regionId = () => (G.state && G.state.region && D.REGIONES[G.state.region]) ? G.state.region : 'mediterraneo';
  G.region = () => D.REGIONES[G.regionId()];
  G.ciudadesRegion = () => D.regionCiudades(G.regionId());
  let aristasC = null;
  G.aristas = () => { const id = G.regionId(), r = G.region(); if (!aristasC || aristasC.id !== id || aristasC.r !== r) aristasC = { id: id, r: r, e: D.regionEdges(id) }; return aristasC.e; };
  G.edge = (a, b) => G.aristas().find(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
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
      if (c.queue && c.queue.nc) { const x = plazosDe(c.queue, c.queue.t1 > T - 1e-9); if (x) out.push({ q: c.queue, c: x, id: id }); }
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
      const q = c.queue; if (q && q.pausa) { if (pagaCuota(q)) { q.pausa = false; G.log('▶️ ' + nom + ': obra reanudada.'); } else q.t1 += dm; }
      for (let i = 0; i < c.train.length; i++) { const l = c.train[i]; if (!l.pausa) continue;
        if (pagaCuota(l)) { l.pausa = false; G.log('▶️ ' + nom + ': instrucción reanudada.'); }
        else for (let j = i; j < c.train.length; j++) { c.train[j].t1 += dm; if (j > i) c.train[j].t0 += dm; } }
    }
  };
  // obras con cuotas por pagar, de mayor a menor cuota pendiente en total
  G.adelantarObra = function (cid) {
    const c = G.state.cities[cid], q = c && c.queue; if (!q || !q.nc || q.pag >= q.nc) return false;
    const rest = G.cuotasRestantes(q); if (!G.canAfford(rest)) return false;
    for (const r in rest) { const de = gasta(r, rest[r]); if (r === 'oro') G.state.obrasMes = (G.state.obrasMes || 0) + de; }
    q.pag = q.nc; q.pausa = false; return true;
  };
  G.obraMayor = function () { let best = null, bv = 0; for (const id of G.myCities()) { const q = G.state.cities[id].queue; if (!q || !q.nc || q.pag >= q.nc) continue; const v = D.RES.reduce((a, r) => a + (G.cuotasRestantes(q)[r] || 0), 0); if (v > bv) { bv = v; best = id; } } return best; };

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
    const s = G.state, pg = G.bonoMul('paga'); let ed = 0, up = 0;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      for (const b in c.b) if (G.CAMPOS.indexOf(b) < 0) ed += c.b[b] || 0;
      for (const k in c.units) up += c.units[k] * D.UNITS[k].up * (G.tipoDe(c).paga || 1) * pg;
    }
    for (const m of s.marches) if (m.owner === 'roma') for (const k in m.units) up += m.units[k] * D.UNITS[k].up;
    const edificios = ed * D.MANT_EDIF, tropas = up * D.MANT_TROPA;
    return { edificios: edificios, tropas: tropas, total: edificios + tropas };
  };

  G.prod = function () {
    const s = G.state, p = { madera: 0, piedra: 0, hierro: 0, grano: 0, oro: 0 };
    const gOk = s.res.grano + s.alm.grano > 0;   // para el ánimo de las clases (sin recursión con barrioInfo)
    let up = 0, comPop = 0; const det = { impuestos: 0, foro: 0 }; const ocm = G.bonoMul('oroCom'), imm = G.bonoMul('impuestos');
    for (const id of G.myCities()) {
      const c = s.cities[id];
      const rp = G.repartoDe(c);
      const mo = G.manoObraDe(c, G.popEfectiva(c, gOk)) * G.inqMul(c), tp = G.tipoDe(c), rm = tp.rec || 1, dg = G.diosDe(c), cer = dg && dg.grano ? 1 + dg.grano * G.diosNivel(c) : 1;
      p.madera += (4 + G.rateCampo(c, 'aserradero')) * rp.madera / 5 * mo * rm; p.piedra += (4 + G.rateCampo(c, 'cantera')) * rp.piedra / 5 * mo * rm; p.hierro += (4 + G.rateCampo(c, 'mina')) * rp.hierro / 5 * mo * rm; p.grano += (6 + G.rateCampo(c, 'granja')) * rp.grano / 5 * mo * rm * cer;
      const oF = (G.rate(c.b.foro) * 0.5 + 5 * (c.b.puerto || 0)) * (tp.oroCom || 1) * ocm, oI = G.cabezasImp(c, gOk) * 0.03 * G.impMult(c) * imm * D.BARRIO[c.barrio || 1].imp, oP = ((tp.oroPuerto || 0) + (dg && dg.oroPuerto ? dg.oroPuerto * G.diosNivel(c) : 0)) * (c.b.puerto || 0);
      p.oro += oF + oI + oP; det.foro += oF + oP; det.impuestos += oI;   // foro + impuestos de la población + comercio del puerto
      p.grano -= (c.pop || 0) * 0.02; comPop += (c.pop || 0) * 0.02;
      for (const k in c.units) up += c.units[k] * D.UNITS[k].up;
    }
    for (const m of s.marches) if (m.owner === 'roma') for (const k in m.units) up += m.units[k] * D.UNITS[k].up;
    p.grano -= up; p.upkeep = up; p.comida = comPop + up; p.det = det;
    p.rutas = 0; for (const r of G.rutasAbiertas()) p.rutas += G.rutaRenta(r);
    p.oro += p.rutas; det.rutas = p.rutas;
    p.mant = G.mantenimiento(); p.oro -= p.mant.total;
    return p;
  };

  /* ---------- bien especial por ciudad (B1) ---------- */
  G.fuentesExtra = [];   // ganchos de otras tareas (rutas comerciales con aliados): cada uno recibe el bien y devuelve ids de ciudad
  G.fuentesEspecial = function (k) { const l = G.myCities().filter(id => D.CITIES[id].esp === k); for (const f of G.fuentesExtra) for (const id of f(k) || []) if (l.indexOf(id) < 0) l.push(id); return l; };
  G.especiales = function () { const o = {}; for (const k in D.ESPECIAL) if (G.fuentesEspecial(k).length) o[k] = true; return o; };
  G.dondeEspecial = k => G.ciudadesRegion().filter(id => D.CITIES[id].esp === k);   // todas las ciudades del mapa que lo dan
  G.bonoMul = function (campo) { let m = 1; const e = G.especiales(); for (const k in e) { const v = D.ESPECIAL[k].bono[campo]; if (v) m *= v; } return m; };
  G.bonoSum = function (campo) { let m = 0; const e = G.especiales(); for (const k in e) m += D.ESPECIAL[k].bono[campo] || 0; return m; };
  // tipo 'edificio' (nivel = el actual, se quiere subir al siguiente) o 'tropa': devuelve el bien que falta o null
  G.faltaEspecial = function (tipo, id, nivel) {
    const e = G.especiales();
    for (const k in D.ESPECIAL) { const a = D.ESPECIAL[k].abre; if (e[k]) continue;
      if (tipo === 'edificio' && a.edificios && a.edificios.indexOf(id) >= 0 && nivel >= D.ESP_NIVEL) return k;
      if (tipo === 'tropa' && a.tropas && a.tropas.indexOf(id) >= 0) return k; }
    return null;
  };
  /* ---------- rutas comerciales (B2) ---------- */
  G.rutasAbiertas = () => (G.state && G.state.rutas) || [];
  G.rutaDe = (a, b) => G.rutasAbiertas().find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a));
  G.rutaMax = c => 1 + Math.floor((c.b.mercado || 0) / D.RUTA_POR_MERCADO) + (G.tipoDe(c).rutas || 0);
  G.rutasDeCiudad = id => G.rutasAbiertas().filter(r => r.a === id).length;
  // marcha en curso entre Roma y la facción f (en cualquier sentido)
  G.hayGuerraCon = function (f) { const s = G.state; return s.marches.some(m => (m.owner === f && s.cities[m.to].owner === 'roma') || (m.owner === 'roma' && s.cities[m.to].owner === f)); };
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
    return v * Math.max(G.tipoDe(ca).oroCom || 1, mia ? (G.tipoDe(cb).oroCom || 1) : 1);
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
    if (c.owner === 'roma' && (c.esc || 0) > 0 && G.animoClases(c).esc < D.CLASES.inquietud) return Math.max(0, f - D.CLASES.inquietudFel);
    return f;
  };
  G.setImp = function (cid, nivel) { const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.IMPUESTOS[nivel]) return false; c.imp = nivel; return true; };

  /* ---------- población ---------- */
  G.popCapViejo = c => { let n = 120; for (const b in D.POP_EDIF) n += D.POP_EDIF[b] * (c.b[b] || 0); return Math.round(n * D.BARRIO[c.barrio || 1].pop); };
  /* Con ciudad nueva: capacidad de sus casas (ciudad.poblacion) x multiplicador de barrio + acueducto y termas heredados. Ya no cuentan viviendas ni foro. */
  G.popCap = c => { const r = infoC(c); if (!r) return G.popCapViejo(c); let n = r.cap; for (const b in D.POP_EDIF) if (b !== 'viviendas' && b !== 'foro') n += D.POP_EDIF[b] * (c.b[b] || 0); return Math.round(n * D.BARRIO[c.barrio || 1].pop); };
  G.rateCampo = (c, b) => { const r = infoC(c); return r ? r.campo[b] : G.rate(c.b[b]); };
  // Barrio (P67): servicios cumplidos, nivel objetivo y meses de retraso. popCap usa c.barrio, no el objetivo.
  G.barrioInfo = function (c) {
    const serv = G.servicios(c, G.prod().grano >= 0);
    let obj = 1; for (let n = 2; n < D.BARRIO.length; n++) { if (D.BARRIO[n].pide.every(k => serv[k])) obj = n; else break; }
    const nivel = c.barrio || 1, sig = D.BARRIO[nivel + 1];
    return { nivel, objetivo: obj, serv, falta: sig ? sig.pide.filter(k => !serv[k]) : [], meses: obj < nivel ? Math.max(0, D.BARRIO_RETRASO - (c.bdef || 0)) : 0 };
  };
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
    return { grano: granoOk, templo: (c.b.templo || 0) >= 1, agua: (c.b.acueducto || 0) >= 1, ocio: (c.b.anfiteatro || 0) >= 1, termas: (c.b.termas || 0) >= 1, lujo: D.LUJO.some(k => e[k]) };
  };
  // ánimo 0-100 por clase. granoOk: si se omite, sale de la producción de grano (G.prod lo pasa para no dar vueltas)
  G.animoClases = function (c, granoOk) {
    const K = D.CLASES, cl = G.clases(c), sv = G.servicios(c, granoOk === undefined ? G.prod().grano >= 0 : granoOk), f = G.felicidadBase(c), lim = x => Math.max(0, Math.min(100, Math.round(x)));
    const pesc = cl.pop > 0 ? Math.min(K.escAnimoTope, K.escAnimo * 100 * cl.esc / cl.pop) : 0;
    return {
      ciu: lim(40 + (sv.lujo ? 20 : 0) + (sv.ocio ? 15 : 0) + (sv.termas ? 15 : 0) + (f - 50) * 0.3),
      ple: lim(40 + (sv.grano ? 20 : 0) + (sv.templo ? 15 : 0) + (f - 50) * 0.3 - pesc),
      esc: lim((sv.grano ? 65 : 45) - 0.3 * (100 - f))
    };
  };
  G.cara = a => a >= D.CLASES.caraBuena ? '😊' : a >= D.CLASES.caraMedia ? '😐' : '😠';
  // población que trabaja (esclavos x1,3; una clase con ánimo bajo rinde la mitad)
  G.popEfectiva = function (c, granoOk) {
    const cl = G.clases(c); if (c.owner !== 'roma') return cl.pop;
    const K = D.CLASES, a = G.animoClases(c, granoOk);
    return cl.ciu + cl.ple * (a.ple < K.bajo ? 0.5 : 1) + cl.esc * (1 + (a.esc < K.bajo ? 0 : K.escTrabajo));
  };
  // impuestos por cabeza: ciudadano x2,5, plebeyo x1, esclavo 0 (ciudadanos con ánimo bajo pagan la mitad)
  G.cabezasImp = function (c, granoOk) {
    const cl = G.clases(c), a = G.animoClases(c, granoOk);
    return cl.ple + cl.ciu * D.CLASES.impCiu * (a.ciu < D.CLASES.bajo ? 0.5 : 1);
  };
  G.darCiudadania = function (cid) {
    const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || G.motivoCiudadania(c)) return false;
    gasta('oro', D.CLASES.ciudadaniaCoste); c.ciu = G.clases(c).ciu + D.CLASES.ciudadaniaLote; return true;
  };
  // por qué no se puede dar la ciudadanía (null si se puede)
  G.motivoCiudadania = function (c) {
    const K = D.CLASES, cl = G.clases(c);
    if ((c.barrio || 1) < K.ciudadaniaBarrio) return 'Pide barrio ' + D.BARRIO[K.ciudadaniaBarrio].n;
    if (cl.ple < K.ciudadaniaLote) return 'Faltan plebeyos';
    if (cl.ciu + K.ciudadaniaLote > cl.pop * K.ciudadaniaMax + 1e-9) return 'Máximo ' + Math.round(K.ciudadaniaMax * 100) + ' % de ciudadanos';
    if (!G.canAfford({ oro: K.ciudadaniaCoste })) return 'Faltan denarios';
    return null;
  };

  G.MIN_POP = 50;                                   // civiles que nunca se reclutan
  G.recruits = c => Math.max(0, Math.floor((c.pop || 0) - G.MIN_POP));

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
  G.huecos = c => 1;                     // obras a la vez por ciudad (Q4b lo subirá)
  const COMPAT = ['almacen', 'templo', 'mercado', 'cuartel', 'establo', 'herreria', 'puerto', 'granja', 'aserradero', 'cantera', 'mina'];
  const piezaDe = b => CI && b && b !== 'muralla' ? CI.PIEZA_DE[b] || null : null;
  const BONO_MIN = 0.8, BONO_MAX = 1.25;
  const bonoSitio = nota => Math.max(BONO_MIN, Math.min(BONO_MAX, 0.9 + 0.04 * (nota || 0)));   // nota 3 = 1,02; vega (+3 a +6) = 1,1 a 1,14
  const semillaDe = id => { let h = 7; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100003; return h + 1; };
  const mesAlin = () => Math.floor(G.state.t + 1e-9) + 9;
  const idDe = c => { const cs = G.state && G.state.cities; if (cs) for (const id in cs) if (cs[id] === c) return id; return null; };
  const limpia = o => { const r = {}; for (const k in o) if (o[k] > 0) r[k] = o[k]; return r; };

  /* c.queue es un alias (no enumerable) de c.obras[0]: la lista de obras tiene UN hueco (G.huecos) y el resto del código sigue leyendo c.queue. */
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
  const datosDe = E => Object.assign(CI.aDatos(E), { n0: E.n0 || 0 });
  const ponerDatos = (c, r) => { c.ciudad = datosDe(r.E); };

  /* ciudad.crear tarda ~0,3 s (el bosque): se hace una vez por semilla y las demás ciudades con esa semilla copian la plantilla (misma ciudad, mismo azar). */
  const plantillas = {};
  function crearE(sem) {
    const T = plantillas[sem] || (plantillas[sem] = CI.crear(sem)), E = Object.assign({}, T);
    E.rnd = CI.azar(sem * 7919 + 13); E.vias = T.vias.map(v => Object.assign({}, v)); E.arboles = T.arboles.map(a => Object.assign({}, a));
    E.parcelas = []; E.bocas = []; E.edificios = []; E.barrios = []; E.puertas = []; E.diario = []; E.abiertas = T.abiertas.slice(); E.muralla = Object.assign({}, T.muralla); E.avisado = {};
    E.ocup = T.ocup.slice(); E.lote = T.lote.slice(); E.dVia = T.dVia.slice(); E.aVia = T.aVia.slice(); E.tVia = T.tVia.slice();
    return E;
  }
  /* Rehace E desde sus datos guardados. Igual que ciudad.deDatos pero desde n0 y con la acción 'd' (derribo). */
  function reconstruir(d) {
    const E = crearE(d.semilla); E.modoJuego = true; E.n0 = d.n0 || 0; E.mesN = E.n0; if (d.sitio) CI.fundar(E, d.sitio.x, d.sitio.z);
    const ac = d.acciones || [];
    for (let n = E.n0; n <= d.mesN; n++) {
      for (const a of ac) { if (a.n !== n) continue;
        if (a.a === 'c') { const r = CI.colocar(E, a.tipo, a.x, a.z, true); if (r.ok) r.e.obra = 0; }
        else if (a.a === 'u') CI.mejorar(E, a.id, true); else if (a.a === 'm') CI.levantarMuralla(E, true);
        else if (a.a === 's') CI.sembrarCasas(E, a.pob); else if (a.a === 'd') quitar(E, a.id); }
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
    c.heredado = her; c.foroMin = Math.max(1, c.b.foro || 0); regE.set(c, { E, id, rev: -1 }); sinc(c, regE.get(c)); ponerDatos(c, regE.get(c));
    return E;
  }
  const MEJORA = n => CI.MEJORA_DE_NIVEL(n);
  function abrir(c) {                    // reconstruye (si hay datos) o convierte
    const id = idDe(c); if (!id) return null; let E = null;
    try {
      if (c.ciudad) { E = reconstruir(c.ciudad); regE.set(c, { E, id, rev: -1 }); const r = regE.get(c); sinc(c, r);
        const alin = mesAlin(); let n = 0; while (E.mesN < alin && n++ < 36) CI.mes(E);       // se pone al día (tope de meses)
        if (n) { sinc(c, r); ponerDatos(c, r); } }
      else E = convertir(c, id);
    } catch (e) { E = null; }
    if (!E) { try { if (c.ciudad) { delete c.ciudad; E = convertir(c, id); } } catch (e2) { E = null; } }
    if (!E) regE.set(c, false);
    return E;
  }
  G.ciudadE = function (id) { const c = G.state && G.state.cities[id]; if (!c || c.owner !== 'roma') return null; const r = infoC(c); return r ? r.E : null; };
  G.convertir = id => { const c = G.state.cities[id]; if (!c || !CI) return null; regE.delete(c); delete c.ciudad; return abrir(c) ? G.ciudadE(id) : null; };
  // una ciudad que deja de ser nuestra pierde su ciudad nueva y se queda con los números
  function soltarCiudad(c) { regE.delete(c); delete c.ciudad; delete c.heredado; if (!c.b.viviendas) c.b.viviendas = 2; }   // sin ciudad nueva, c.b.viviendas (vista derivada = 0) vuelve a un mínimo para que la reconquista no hunda la población
  // una obra de partida vieja (sin pieza) se liga a la pieza que ahora existe si no pasa por encima de lo ya convertido
  function migrarObra(c, antes) {
    const q = c.queue; if (!q || 'nuevo' in q) return; q.pieza = null; q.nuevo = false; q.mejora = null;
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
    c.obras[0] = Object.assign({ b: s.b, pieza: s.pieza, eid: s.eid, x: s.x, z: s.z, nuevo: !!s.nuevo, mejora: s.mejora, t0: G.state.t, t1: G.state.t + dur }, pl); pagaCuota(c.obras[0]);
    return true;
  }
  function especNueva(c, E, pz, x, z) { const D0 = CI.EDIF[pz], b = D0.bid; return { b: b, pieza: pz, x: x, z: z, nuevo: true, mejora: 0, coste: D0.coste, dur: b ? G.buildTime(c, b) : D0.obra * (1 - 0.04 * (c.b.foro || 0)) * G.bonoMul('obra') }; }
  function especMejora(c, e) { const D0 = CI.EDIF[e.tipo], k = e.mejora || 0, b = D0.bid; return { b: b, pieza: e.tipo, eid: e.id, x: e.x, z: e.z, nuevo: false, mejora: k + 1, coste: D0.mejoras[k].coste, dur: b ? durNiveles(c, b, CI.NIVEL_MEJORA[k], CI.NIVEL_MEJORA[k + 1]) : D0.obra * (k + 1) * (1 - 0.04 * (c.b.foro || 0)) * G.bonoMul('obra') }; }
  function menorMejora(E, pz) { let m = null; for (const e of E.edificios) if (e.tipo === pz && (!m || (e.mejora || 0) < (m.mejora || 0))) m = e; return m; }
  function terminarObra(id, c) {
    const q = c.queue, nom = D.CITIES[id].n, r = CI && regE.get(c) || null; c.queue = null; let txt;
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
    if (!CI) return;
    for (const id of G.myCities()) { const c = G.state.cities[id], r = infoC(c); if (!r) continue;
      const alin = mesAlin(); let av = [], k = 0; while (r.E.mesN < alin && k++ < 36) av = av.concat(CI.mes(r.E)); if (!k) continue;
      sinc(c, r); ponerDatos(c, r);
      let n = 0; for (const a of av) { if (n >= 2 || (a.c !== 'crecida' && a.c !== 'fuego' && a.c !== 'hambre')) continue; n++; G.log('🏘️ ' + D.CITIES[id].n + ': ' + a.t, a.p >= 4 ? 'bad' : ''); } }
  }

  /* ---------- API para el modo «colocar» (CN4) ----------  tipo = id de pieza (EDIF de ciudad.js) o id de D.BUILD */
  const tipoPz = t => piezaDe(t) || (CI && CI.EDIF[t] ? t : null);
  const prop = cid => { const c = G.state.cities[cid]; return c && c.owner === 'roma' && CI ? c : null; };
  G.notaSitio = function (cid, tipo, x, z) { const E = G.ciudadE(cid), pz = tipoPz(tipo); return E && pz ? CI.notaSitio(E, pz, x, z) : null; };
  G.mapaCalor = function (cid, tipo) { const E = G.ciudadE(cid), pz = tipoPz(tipo); return E && pz ? CI.mapaCalor(E, pz) : null; };
  G.colocar = function (cid, tipo, x, z) {
    const c = prop(cid), E = c && G.ciudadE(cid), pz = tipoPz(tipo); if (!E || !pz || CI.EDIF[pz].accion) return { ok: false, motivo: 'No se puede' };
    if (!isFinite(x) || !isFinite(z)) return { ok: false, motivo: 'Sitio no válido' };
    if (c.obras.length >= G.huecos(c)) return { ok: false, motivo: 'Ya hay una obra en curso en esta ciudad' };
    const b = CI.EDIF[pz].bid; if (b && (D.BUILD[b].sea && !D.CITIES[cid].sea)) return { ok: false, motivo: 'Aquí no hay mar' };
    if (b && G.faltaEspecial('edificio', b, c.b[b] || 0)) return { ok: false, motivo: 'Falta un bien especial' };
    const n = CI.notaSitio(E, pz, x, z); if (!n.vale) return { ok: false, motivo: n.razones[0] };
    if (b === 'templo' && !G.diosDe(c)) c.dios = D.DIOSES[c.dios] && !(D.DIOSES[c.dios].sea && !D.CITIES[cid].sea) ? c.dios : 'marte';
    if (!empezar(c, especNueva(c, E, pz, x, z))) return { ok: false, motivo: 'Faltan recursos' };
    return { ok: true, obra: c.obras[0] };
  };
  G.mejorarPieza = function (cid, idPieza) {
    const c = prop(cid), E = c && G.ciudadE(cid), e = E && E.edificios.find(p => p.id === idPieza); if (!e) return { ok: false, motivo: 'No existe esa pieza' };
    if (!CI.EDIF[e.tipo].mejoras || (e.mejora || 0) >= 3) return { ok: false, motivo: 'Ya está al máximo' };
    if (c.obras.length >= G.huecos(c)) return { ok: false, motivo: 'Ya hay una obra en curso en esta ciudad' };
    if (e.obra || e.ruina) return { ok: false, motivo: 'Ahora no se puede mejorar' };
    const b = CI.EDIF[e.tipo].bid; if (b && G.faltaEspecial('edificio', b, c.b[b] || 0)) return { ok: false, motivo: 'Falta un bien especial' };
    if (!empezar(c, especMejora(c, e))) return { ok: false, motivo: 'Faltan recursos' };
    return { ok: true, obra: c.obras[0] };
  };
  G.derribarPieza = function (cid, idPieza) {
    const c = prop(cid), r = c && infoC(c), e = r && r.E.edificios.find(p => p.id === idPieza); if (!e) return { ok: false, motivo: 'No existe esa pieza' };
    if (e.tipo === 'compitum') return { ok: false, motivo: 'Una capilla de cruce no se derriba' };
    if (c.queue && c.queue.eid === idPieza) return { ok: false, motivo: 'Se está mejorando' };
    quitar(r.E, idPieza); sinc(c, r); ponerDatos(c, r); const pc = G.popCap(c); if (c.pop > pc) c.pop = pc; return { ok: true };
  };
  G.levantarMuralla = function (cid) {   // paga entera al empezar; no toca c.b.muralla (lo lee battleInfo hasta CN7)
    const c = prop(cid), r = c && infoC(c); if (!r) return { ok: false, motivo: 'No se puede' };
    const res = CI.levantarMuralla(r.E, false, coste => { const k = limpia(coste); if (!G.canAfford(k)) return false; pay(k); return true; });
    if (res.ok) ponerDatos(c, r); return res;
  };

  /* deja una ciudad como romana recién incorporada: sin colas, impuesto normal, mitad de población */
  function incorporar(c, units, conquista) { c.prev = c.owner; c.inq = conquista ? D.INQ_MESES : 0; c.owner = 'roma'; c.tipo = 'municipio'; c.tipoElegido = false; c.imp = 'normal'; c.reparto = G.repartoBase(); c.units = units; G.ligarObras(c); c.queue = null; c.train = []; c.barrio = 1; c.bdef = 0; soltarCiudad(c); c.pop = Math.round(G.popCapViejo(c) * 0.5); c.ciu = 0; c.esc = conquista ? Math.round(c.pop * D.CLASES.escConquista) : 0; if (CI && !cargando) abrir(c); }   // la ciudad nueva nace con la población que ya tenía
  G.incorporar = incorporar;   // para las pruebas

  // edificios iniciales de una ciudad según su riqueza w y su muralla wl
  G.edificiosBase = function (id, w, wl) {
    const d = D.CITIES[id], h = Math.floor(w / 2);
    return { aserradero: w, cantera: w, mina: w, granja: w, viviendas: id === 'roma' ? 2 : w, foro: Math.max(1, h), almacen: Math.max(1, h), mercado: id === 'roma' ? 0 : h, puerto: d.sea && id !== 'roma' ? Math.max(1, h) : 0, cuartel: id === 'roma' ? 1 : h, establo: id === 'roma' ? 0 : Math.max(0, h - 1), muralla: wl, templo: 0, herreria: 0, acueducto: 0, termas: 0, anfiteatro: 0 };
  };
  // guarnición de referencia (refuerzos anuales) de una ciudad según su dueño actual
  G.guarnicionBase = (id, owner) => { const d = D.CITIES[id]; return owner === d.f ? d.g : (d.en228 && owner === 'cartago' ? d.en228.g : (d.post && d.post[owner]) || null); };
  G.newGame = function (heroName, region) {
    region = D.REGIONES[region] ? region : 'mediterraneo';
    G.turnos = false;   // la interfaz lo activa después; las pruebas y el bot siguen en tiempo continuo
    const s = {
      v: 1, region: region, t: 0, speed: 1, res: { madera: 400, piedra: 400, hierro: 400, grano: 400, oro: 200 },
      alm: { madera: 200, piedra: 200, hierro: 200, grano: 200, oro: 0 }, cuarto: { madera: 50, piedra: 50, hierro: 50, grano: 50, oro: 0 }, gastoMes: { madera: 0, piedra: 0, hierro: 0, grano: 0, oro: 0 }, obrasMes: 0, gan: { madera: 0, piedra: 0, hierro: 0, grano: 0, oro: 0 }, informe: [],
      cities: {}, rutas: [], marches: [], log: [], ev: {}, pending: [], over: null, mid: 1,
      mods: { sea: 1, flex: 0 }, forja: { armas: 0, armaduras: 0, cola: null }, stats: { battles: 0, wins: 0, kills: 0, lost: 0 },
      hero: { name: heroName || 'Lucio Cornelio Escipión', lvl: 1, xp: 0, pts: 1, sk: { mando: 0, disc: 0, log: 0 }, city: 'roma', march: null, wound: 0 }
    };
    const ciudades = D.regionCiudades(region);
    for (const id of ciudades) {
      const d = D.CITIES[id];
      s.cities[id] = { owner: d.f, barrio: 1, bdef: 0, tipo: 'municipio', tipoElegido: false, units: Object.assign({}, d.g), obras: [], train: [], reparto: G.repartoBase(), b: G.edificiosBase(id, d.w, d.wl) };
    }
    for (const id in s.cities) { const c = s.cities[id]; c.pop = Math.round(G.popCapViejo(c) * 0.7); c.ciu = 0; c.esc = 0; G.ligarObras(c); }
    for (const id of ciudades) if (D.CITIES[id].f === 'roma' && id !== 'roma') incorporar(s.cities[id], D.CITIES[id].g);   // aliada de Roma (Capua): empieza como ciudad recién incorporada
    G.state = s;
    if (CI) for (const id of G.myCities()) abrir(s.cities[id]);   // Roma y Capua: ciudad nueva con la población de siempre (287 y 270)
    s.evN = D.EVENTS.length; s.evV = EV_VERSION;
    checkEvents(D.START_YEAR);
    G.migrarSenado(s); G.senadoAsignar();
    return s;
  };

  /* ---------- acciones del jugador ---------- */
  G.derivado = (c, b) => (b === 'viviendas' || b === 'foro') && !!c && c.owner === 'roma' && !!infoC(c);   // con ciudad nueva salen de las casas: no se levantan
  G.upgrade = function (cid, b) {
    const c = G.state.cities[cid], L = c.b[b] || 0;
    if (c.owner !== 'roma' || c.queue || L >= D.MAX_LVL || (D.BUILD[b].sea && !D.CITIES[cid].sea)) return false;
    if (D.BUILD[b].solar && L < 1 && G.solaresUsados(c) >= G.solares(cid)) return false;
    if (G.faltaEspecial('edificio', b, L)) return false;   // niveles altos piden un bien especial (B1)   // sin solares no se levanta un edificio urbano nuevo
    const r = infoC(c);
    if (r && (b === 'viviendas' || b === 'foro')) return false;   // salen de las casas
    const pz = r && piezaDe(b);
    if (pz) {   // atajo «mejor sitio»: coloca la primera pieza o mejora la de menor mejora
      let sp; const e = menorMejora(r.E, pz);
      if (e) { if ((e.mejora || 0) >= 3) return false; sp = especMejora(c, e); }
      else { const st = mejorSitioG(r.E, pz); if (st) sp = especNueva(c, r.E, pz, st[0], st[1]); else if (!(c.heredado && c.heredado[b])) return false; }
      if (sp) { if (b === 'templo' && !G.diosDe(c)) c.dios = D.DIOSES[c.dios] && !(D.DIOSES[c.dios].sea && !D.CITIES[cid].sea) ? c.dios : 'marte'; return empezar(c, sp); }
    }
    const cost = G.cost(b, L), dur = G.buildTime(c, b), pl = nuevoPlazo(cost, mesesDe(dur)); if (!G.canAfford(cuotaK(pl, 0))) return false;
    if (b === 'templo' && !G.diosDe(c)) c.dios = D.DIOSES[c.dios] && !(D.DIOSES[c.dios].sea && !D.CITIES[cid].sea) ? c.dios : 'marte';
    c.queue = Object.assign({ b: b, pieza: null, nuevo: false, mejora: null, t0: G.state.t, t1: G.state.t + dur }, pl); pagaCuota(c.queue);
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
  G.trainDur = (c, k, n) => { const u = D.UNITS[k], bl = c.b[Object.keys(u.req)[0]] || 1; return n * u.time * Math.max(0.5, 1 - 0.05 * (bl - 1)) * (G.tipoDe(c).instr || 1) * G.bonoMul('instr'); };
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
    let b = D.SAQUEO_BASE * (c.w || d.w) * (1 + 0.1 * h.sk.log) * (1 + 0.05 * (c.b.almacen || 0)) * (1 - 0.08 * (c.b.muralla || 0));
    if (c.saqueada !== undefined && s.t - c.saqueada < D.SAQUEO_MESES) b *= D.SAQUEO_REPETIDO;
    const o = {}; for (const r of D.RES) o[r] = Math.max(0, Math.round(b * (r === 'oro' ? 0.6 : 1))); return o;
  };
  G.send = function (from, to, units, withHero, mision) {
    const s = G.state, c = s.cities[from];
    if (!c || c.owner !== 'roma' || !G.edge(from, to)) return false;
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
      spawn('epiro', 'tarentum', null, firstMine(['capua', 'roma']), { falange: 70, hoplitas: 50, peltastas: 30, tesalios: 20, elefantes: 3 }, { n: 'Pirro de Epiro', mando: 3, disc: 2 }, 56, 'Pirro');
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
      c.owner = 'cartago'; c.units = Object.assign({}, e.g); c.w = e.w; c.b = Object.assign(c.b, G.edificiosBase('carthagonova', e.w, e.wl)); c.queue = null; c.train = [];
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
      if (ev.fx && FX[ev.fx]) FX[ev.fx](s);
      G.log('📜 ' + ev.y + ' a.C. — ' + ev.t, 'hist');
      emit('event', ev);
    });
  }

  function newYear(year, enTurnos) {
    const s = G.state;
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
    const s = G.state; if (!s || s.over || s.pending.length) return;
    if (dm > 1 && !G.turnos) { let n = 0; while (dm > 1e-9 && n++ < 400 && !s.over && !s.pending.length) { const d = Math.min(1, dm); G.tick(d); dm -= d; } return; }   // un salto largo se trocea mes a mes para cerrar cada cuenta
    const y0 = G.yearOf(s.t), m0 = Math.floor(s.t);
    let B = null;   // modo turnos: si llegamos al final de la estación, B es ese instante exacto
    if (G.turnos) { const fin = G.finTurno(); if (s.t + dm >= fin - 1e-9) { B = fin; dm = Math.max(0, fin - s.t); } }
    s.t += dm; if (B !== null) s.t = B;
    G.rutasRevisar();
    // economía
    const p = G.prod();
    for (const r of D.RES) { const v = p[r] * dm; s.res[r] += v; if (v > 0) s.gan[r] += v; if (s.res[r] < 0) { s.alm[r] = Math.max(0, s.alm[r] + s.res[r]); s.res[r] = 0; } }   // el déficit sale de la caja y, si no alcanza, del almacén
    if (Math.floor(s.t) > m0) G.cierreMes();
    G.reintentarPlazos(dm);
    const crm = G.bonoMul('crece');
    for (const id of G.myCities()) { const c = s.cities[id], pc = G.popCap(c); c.pop = s.res.grano + s.alm.grano > 0 ? (G.felicidad(c) < D.FELICIDAD_MIN_CRECER ? c.pop : Math.min(pc, c.pop + (1 + 0.03 * c.pop * Math.max(0, 1 - c.pop / pc)) * dm * crm)) : Math.max(20, c.pop * (1 - 0.02 * dm)); }
    // inquietud de ciudades conquistadas: se calma con el tiempo (más deprisa con templo); con la gente descontenta se rebela
    for (const id of G.myCities()) { const c = s.cities[id]; if (!(c.inq > 0)) continue;
      if (c.inq > D.INQ_MESES / 2 && G.felicidad(c) < D.INQ_REBELION) { rebelion(id); continue; }
      c.inq = Math.max(0, c.inq - dm * (1 + D.INQ_TEMPLO * G.diosNivel(c))); }
    // herrería
    if (s.forja.cola && s.t >= s.forja.cola.t1) { const k = s.forja.cola.k; s.forja[k]++; s.forja.cola = null; G.log('🔨 Herrería: ' + D.FORJA[k].n + ' nivel ' + s.forja[k] + '.'); emit('dirty'); }
    // colas
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (c.queue && s.t >= c.queue.t1) terminarObra(id, c);
      while (c.train.length && s.t >= c.train[0].t1) { const q = c.train.shift(); c.units[q.u] = (c.units[q.u] || 0) + q.n; G.log('🛡️ ' + D.CITIES[id].n + ': ' + q.n + ' ' + D.UNITS[q.u].n + ' listos.'); emit('dirty'); }
    }
    // modo turnos: al cerrar la estación se resuelve el mundo (año nuevo, rivales) antes de que lleguen las marchas
    if (B !== null) { const yb = G.yearOf(s.t); if (yb < y0) newYear(yb, true); turnoIA(yb, 0.25); }
    // marchas
    for (let i = s.marches.length - 1; i >= 0; i--) {
      const m = s.marches[i]; if (s.t < m.t1 - 1e-9 || (G.turnos && B === null)) continue;
      s.marches.splice(i, 1);
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
    // sin paga: con el oro agotado y el balance negativo, las tropas desertan
    if (Math.floor(s.t) > m0 && s.res.oro + s.alm.oro <= 0 && p.oro < 0) {
      for (const id of G.myCities()) { const u = s.cities[id].units; for (const k in u) u[k] = Math.floor(u[k] * 0.98); }
      if (Math.floor(s.t) % 6 === 0) G.log('🪙 No hay con qué pagar a las tropas. Desertan.', 'bad');
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
    const m = G.mantenimiento(), gm = (s.gastoMes && s.gastoMes.oro) || 0, ob = Math.min(gm, s.obrasMes || 0) + pl.oro, otros = Math.max(0, gm - (s.obrasMes || 0)), d = p.det, ing = d.impuestos + d.foro + d.rutas, gas = m.edificios + m.tropas + ob + otros;
    out.oro = { impuestos: d.impuestos, foro: d.foro, rutas: d.rutas, ingresos: ing, edificios: m.edificios, legiones: m.tropas, obras: ob, otros: otros, plazosOro: pl.oro, gastos: gas, saldo: ing - gas, neto: p.oro };
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
    s.obrasMes = 0;
    mesCiudades();
    G.senadoMes(rojo);
    for (const id of G.myCities()) {   // barrios: sube un nivel si cumple más; baja tras BARRIO_RETRASO meses de déficit
      const c = s.cities[id], bi = G.barrioInfo(c), nom = D.CITIES[id].n;
      if (bi.objetivo > bi.nivel) { c.barrio = bi.nivel + 1; c.bdef = 0; G.log('🏛️ ' + nom + ' sube a ' + D.BARRIO[c.barrio].n + '.'); }
      else if (bi.objetivo < bi.nivel) {
        c.bdef = (c.bdef || 0) + 1;
        if (c.bdef >= D.BARRIO_RETRASO) { const sg = D.BARRIO[bi.nivel].pide.filter(k => !bi.serv[k]).map(k => D.BARRIO_SERV[k].toLowerCase()); c.barrio = bi.nivel - 1; c.bdef = 0; G.log('🏛️ ' + nom + ' baja a ' + D.BARRIO[c.barrio].n + ': falta ' + sg.join(' y ') + '.', 'bad'); }
      } else c.bdef = 0;
      if ((c.esc || 0) > 0 && G.animoClases(c).esc >= D.CLASES.manumision) {   // manumisión: los esclavos contentos se liberan poco a poco
        const k = Math.min(Math.floor(c.esc) || 1, Math.max(1, Math.round(c.esc * D.CLASES.manumisionTasa))); c.esc = Math.max(0, c.esc - k); G.log('⛓️ ' + nom + ': ' + k + (k === 1 ? ' esclavo liberado pasa' : ' esclavos liberados pasan') + ' a plebeyos.');
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
    for (const r of ['grano', 'oro']) if (p[r] < 0 && (s.res[r] + s.alm[r]) / -p[r] < 3) out.push({ k: 'bad', x: (r === 'grano' ? 'El grano' : 'El oro') + ' se acaba en ' + Math.max(1, Math.ceil((s.res[r] + s.alm[r]) / -p[r])) + ' mes(es).' });
    const sin = mis.filter(id => !s.cities[id].queue).map(id => D.CITIES[id].n);
    if (sin.length) { out.push({ k: '', x: 'Sin obras en cola: ' + sin.slice(0, 3).join(', ') + (sin.length > 3 ? '…' : '') + '.' }); rec = rec || 'Pon a trabajar a los constructores.'; }
    for (const x of G.avisoCierre(G.turnos)) out.push({ k: 'bad', x: x });
    const llenos = D.RES.filter(r => s.alm[r] >= cap - 1);
    if (llenos.length) out.push({ k: '', x: 'Almacén lleno: ' + llenos.join(', ') + '. Gasta o amplía.' });
    const mi = G.misionActual(), sen = G.favorBajo() ? { k: 'bad', x: 'Senado: favor bajo; sin tratados ajenos ni levas extra.' } : mi ? { k: '', x: 'Senado: ' + mi.m.n + ', quedan ' + mi.quedan + ' meses. ' + mi.falta } : null;   // sustituye al tercer aviso
    const l = [head].concat(out.slice(0, sen ? 2 : 3)); if (sen) l.push(sen);
    l.push({ k: rec ? '' : 'good', x: rec || 'Estación tranquila: reúne tropas o amplía la ciudad.' });
    return l.slice(0, 5);
  };

  function merge(a, b) { for (const k in b) if (b[k] > 0) a[k] = (a[k] || 0) + b[k]; }

  /* ---------- batallas ---------- */
  G.battleInfo = function (pb) {
    const s = G.state, m = pb.m, cid = m.to, c = s.cities[cid], d = D.CITIES[cid], h = s.hero;
    const fa = G.forjaMul(s, 'armas'), fd = G.forjaMul(s, 'armaduras');
    const hm = { atkMul: (1 + 0.04 * h.sk.mando) * (s.mods.flex ? 1.1 : 1) * fa, defMul: (1 + 0.03 * h.sk.disc) * fd, mor: 4 * h.sk.disc };
    const noHero = { atkMul: (s.mods.flex ? 1.1 : 1) * fa, defMul: fd, mor: 0 };
    let me, foe, heroIn;
    if (pb.kind === 'attack') {
      heroIn = m.hero;
      me = Object.assign({ units: m.units, name: 'Roma', col: D.FACTIONS.roma.col, gen: heroIn ? { n: h.name } : null }, heroIn ? hm : noHero);
      const g = c.owner === d.f ? G.cityGen(cid, G.yearOf(s.t)) : null;
      foe = { units: c.units, name: D.FACTIONS[c.owner].n, col: D.FACTIONS[c.owner].col, gen: g, atkMul: g ? 1 + 0.04 * g.mando : 1, defMul: g ? 1 + 0.03 * g.disc : 1, mor: g ? 4 * g.disc : 0 };
    } else {
      heroIn = G.heroAvailable(cid);
      const u = Object.assign({}, c.units); u.vigiles = 20 + 20 * (c.b.muralla || 0);
      me = Object.assign({ units: u, name: 'Roma', col: D.FACTIONS.roma.col, gen: heroIn ? { n: h.name } : null }, heroIn ? hm : noHero);
      { const dg = G.diosDe(c); if (dg && dg.mor) me.mor += dg.mor * G.diosNivel(c); }
      const g = m.gen;
      foe = { units: m.units, name: D.FACTIONS[m.owner].n, col: D.FACTIONS[m.owner].col, gen: g, atkMul: g ? 1 + 0.04 * g.mando : 1, defMul: g ? 1 + 0.03 * g.disc : 1, mor: g ? 4 * g.disc : 0 };
    }
    return { cfg: { sides: [me, foe], defender: pb.kind === 'attack' ? 1 : 0, wall: c.b.muralla || 0, seed: Math.floor(s.t * 1000) + m.id }, city: cid, heroIn: heroIn, kind: pb.kind };
  };

  const keep = (surv, lost, f, g) => { const o = {}; for (const k in surv) { if (k === 'vigiles') continue; const n = Math.floor(surv[k] * f + (lost[k] || 0) * g); if (n > 0) o[k] = n; } return o; };

  function rebelion(id) {
    const s = G.state, c = s.cities[id], f = c.prev && D.FACTIONS[c.prev] && c.prev !== 'roma' ? c.prev : D.CITIES[id].f;
    soltarCiudad(c); c.owner = f; c.inq = 0; c.queue = null; c.train = []; c.units = Object.assign({}, G.guarnicionBase(id, f) || {});
    if (s.hero.city === id) { s.hero.city = 'roma'; s.hero.march = null; }
    G.log('🔥 ¡' + D.CITIES[id].n + ' se rebela y vuelve a ' + D.FACTIONS[f].n + '! Un templo y una felicidad alta habrían calmado la ciudad.', 'bad'); emit('dirty');
  }
  G.applyBattle = function (res) {
    const s = G.state, pb = s.pending.shift(), m = pb.m, cid = m.to, c = s.cities[cid], d = D.CITIES[cid], h = s.hero;
    const heroIn = pb.kind === 'attack' ? m.hero : G.heroAvailable(cid);
    const win = res.winner === 0, out = { win: win, kind: pb.kind, city: cid, dead: res.dead, lines: [] };
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
        c.units = keep(res.surv[0], res.lost[0], 1, 0.3);
        out.saqueo = true; out.lines.push('🔥 ' + D.FACTIONS[m.owner].n + ' saquea ' + d.n + ' y se marcha: ' + D.RES.map(r => '-' + rob[r] + ' ' + D.RES_ICON[r]).join(' ') + '.', 'Cada almacén esconde ' + D.ESCONDITE + ' de cada recurso.');
        G.log('🔥 ' + d.n + ' ha sido saqueada por ' + D.FACTIONS[m.owner].n + '.', 'bad');
      } else {
        soltarCiudad(c); c.owner = m.owner; c.units = keep(res.surv[1], res.lost[1], 1, 0.3); c.queue = null; c.train = [];
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
      if (res.genDead[0]) { h.wound = s.t + 24; out.lines.push('🩸 ' + h.name + ' ha sido herido: dos años de convalecencia.'); G.log('🩸 ' + h.name + ' cae herido en combate.', 'bad'); }
    }
    G.save();
    if (s.over) emit('over');
    return out;
  };

  /* ---------- guardado ---------- */
  G.save = function () { try { if (typeof localStorage !== 'undefined' && G.state) { for (const id of G.myCities()) { const c = G.state.cities[id], r = CI && regE.get(c); if (r) ponerDatos(c, r); } localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } } catch (e) { /* almacenamiento no disponible */ } };
  G.hasSave = function () { try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  G.load = function () { let ok = false; cargando = true; try { ok = cargar(); } finally { cargando = false; } if (ok && CI) alCargar(); return ok; };
  function cargar() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) { G.state = s; for (const id in s.cities) G.ligarObras(s.cities[id]); if (s.turnos === undefined) s.turnos = true; G.turnos = !!s.turnos; if (G.turnos) { if (s.speed === undefined) s.speed = 0; for (const m of s.marches) { const a = Math.ceil(m.t1 / D.TURNO_MESES - 1e-9) * D.TURNO_MESES; if (a > m.t1) m.t1 = a; } } if (!s.rutas) s.rutas = []; if (!s.forja) s.forja = { armas: 0, armaduras: 0, cola: null }; if (s.evN !== D.EVENTS.length || s.evV !== EV_VERSION) { const y = G.yearOf(s.t); s.ev = {}; D.EVENTS.forEach((e, i) => { if (y <= e.y) s.ev[i] = 1; }); s.evN = D.EVENTS.length; } s.evV = EV_VERSION; for (const id in s.cities) { const c = s.cities[id]; if (!D.TIPOS[c.tipo]) c.tipo = 'municipio'; if (c.tipoElegido === undefined) c.tipoElegido = false; if (c.inq === undefined) c.inq = 0; if (c.bdef === undefined) c.bdef = 0;  if (c.b.templo > 0 && !D.DIOSES[c.dios]) c.dios = 'marte'; if (!D.FACTIONS[c.owner]) c.owner = id === 'messana' ? 'mamertinos' : 'campanos'; if (id === 'messana' && c.owner === 'campanos') c.owner = 'mamertinos'; for (const b of ['viviendas', 'mercado', 'puerto', 'herreria', 'acueducto', 'termas', 'anfiteatro']) if (c.b[b] === undefined) c.b[b] = b === 'viviendas' ? 2 : 0; if (c.pop === undefined) c.pop = Math.round(G.popCap(c) * 0.7); if (!D.IMPUESTOS[c.imp]) c.imp = 'normal'; if (!G.repartoValido(c.reparto)) c.reparto = G.repartoBase(); if (id === 'carthagonova' && c.owner !== 'iberos' && !c.w) c.w = D.CITIES.carthagonova.en228.w; } G.state = s; for (const id in s.cities) if (s.cities[id].barrio === undefined) { const c = s.cities[id]; c.barrio = 1; c.barrio = G.barrioInfo(c).objetivo; } for (const id in s.cities) { const c = s.cities[id]; if (c.esc === undefined) c.esc = 0; if (c.ciu === undefined) c.ciu = (c.barrio || 1) >= 2 ? Math.round((c.pop || 0) * 0.1) : 0; } G.migrarRegion(s); G.migrarCaja(s); G.migrarSenado(s); return true; } } catch (e) { /* partida corrupta */ } return false; }
  // tras cargar: cada ciudad propia recupera (o estrena) su ciudad nueva; la obra en curso de una partida vieja se liga a su pieza
  function alCargar() {
    for (const id of G.myCities()) { const c = G.state.cities[id], antes = Object.assign({}, c.b), tenia = !!c.ciudad; regE.delete(c);
      try { if (abrir(c) && !tenia) migrarObra(c, antes); } catch (e) { regE.set(c, false); } }
  }
  // partida vieja sin caja: los recursos pasan al almacén hasta el tope y el resto queda en la caja (no se pierde nada)
  G.migrarRegion = function (s) { if (!s.region || !D.REGIONES[s.region]) s.region = 'mediterraneo'; };
  G.migrarCaja = function (s) {
    const cero = () => { const o = {}; for (const r of D.RES) o[r] = 0; return o; };
    if (!s.obrasMes) s.obrasMes = 0;
    for (const id in s.cities) { const c = s.cities[id];   // obras y lotes de partidas viejas: pagados enteros
      const vieja = (q, costo) => { if (q && !q.nc) { q.nc = 1; q.pag = 1; q.cuota = costo || {}; q.costo = costo || {}; q.pausa = false; } };
      vieja(c.queue); for (const l of c.train || []) vieja(l); }
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
    oro: { cumple: (s, c) => s.res.oro + s.alm.oro >= c.n, falta: (s, c) => 'Oro: ' + Math.floor(s.res.oro + s.alm.oro) + ' de ' + c.n + '.' }
  };
  // partida nueva o vieja: favor 50/50 y sin misión
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
