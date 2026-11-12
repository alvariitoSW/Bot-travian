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
    c.b[b] = 0; const pc = G.popCap(c); if (c.pop > pc) c.pop = pc; return true;
  };
  G.cap = () => { let c = 0; for (const id of G.myCities()) c += 600 * Math.pow(1.45, G.state.cities[id].b.almacen || 0); return Math.round(c); };
  G.men = units => { let n = 0; for (const k in units) n += units[k] * (D.UNITS[k].cls === 'ele' ? 1 : 1); return n; };
  G.power = units => { let p = 0; for (const k in units) { const u = D.UNITS[k]; p += units[k] * (u.atk + u.def) * (u.hp || 1) * (u.mass ? 1.6 : 1); } return Math.round(p / 10); };
  G.pos = id => { const c = D.CITIES[id]; return D.proj(c.lon, c.lat); };
  G.edge = (a, b) => D.EDGES.find(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
  G.neighbors = id => D.EDGES.filter(e => e[0] === id || e[1] === id).map(e => e[0] === id ? e[1] : e[0]);
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
  G.manoObra = c => G.manoObraDe(c, c.pop || 0);

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
    let up = 0, comPop = 0; const det = { impuestos: 0, foro: 0 }; const ocm = G.bonoMul('oroCom'), imm = G.bonoMul('impuestos');
    for (const id of G.myCities()) {
      const c = s.cities[id];
      const rp = G.repartoDe(c);
      const mo = G.manoObra(c) * G.inqMul(c), tp = G.tipoDe(c), rm = tp.rec || 1, dg = G.diosDe(c), cer = dg && dg.grano ? 1 + dg.grano * G.diosNivel(c) : 1;
      p.madera += (4 + G.rate(c.b.aserradero)) * rp.madera / 5 * mo * rm; p.piedra += (4 + G.rate(c.b.cantera)) * rp.piedra / 5 * mo * rm; p.hierro += (4 + G.rate(c.b.mina)) * rp.hierro / 5 * mo * rm; p.grano += (6 + G.rate(c.b.granja)) * rp.grano / 5 * mo * rm * cer;
      const oF = (G.rate(c.b.foro) * 0.5 + 5 * (c.b.puerto || 0)) * (tp.oroCom || 1) * ocm, oI = (c.pop || 0) * 0.03 * G.impMult(c) * imm, oP = ((tp.oroPuerto || 0) + (dg && dg.oroPuerto ? dg.oroPuerto * G.diosNivel(c) : 0)) * (c.b.puerto || 0);
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
  G.dondeEspecial = k => Object.keys(D.CITIES).filter(id => D.CITIES[id].esp === k);   // todas las ciudades del mapa que lo dan
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
  G.felicidad = function (c) {
    let f = D.FELICIDAD_BASE + (D.IMPUESTOS[c.imp] || D.IMPUESTOS.normal).f;
    for (const b in D.FELICIDAD_EDIF) f += D.FELICIDAD_EDIF[b] * ((c.b && c.b[b]) || 0);
    f += (G.tipoDe(c).fel || 0) + G.bonoSum('fel');
    return Math.max(0, Math.min(100, Math.round(f)));
  };
  G.setImp = function (cid, nivel) { const c = G.state.cities[cid]; if (!c || c.owner !== 'roma' || !D.IMPUESTOS[nivel]) return false; c.imp = nivel; return true; };

  /* ---------- población ---------- */
  G.popCap = c => { let n = 120; for (const b in D.POP_EDIF) n += D.POP_EDIF[b] * (c.b[b] || 0); return Math.round(n); };
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

  /* deja una ciudad como romana recién incorporada: sin colas, impuesto normal, mitad de población */
  function incorporar(c, units, conquista) { c.prev = c.owner; c.inq = conquista ? D.INQ_MESES : 0; c.owner = 'roma'; c.tipo = 'municipio'; c.tipoElegido = false; c.imp = 'normal'; c.reparto = G.repartoBase(); c.units = units; c.queue = null; c.train = []; c.pop = Math.round(G.popCap(c) * 0.5); }

  // edificios iniciales de una ciudad según su riqueza w y su muralla wl
  G.edificiosBase = function (id, w, wl) {
    const d = D.CITIES[id], h = Math.floor(w / 2);
    return { aserradero: w, cantera: w, mina: w, granja: w, viviendas: id === 'roma' ? 2 : w, foro: Math.max(1, h), almacen: Math.max(1, h), mercado: id === 'roma' ? 0 : h, puerto: d.sea && id !== 'roma' ? Math.max(1, h) : 0, cuartel: id === 'roma' ? 1 : h, establo: id === 'roma' ? 0 : Math.max(0, h - 1), muralla: wl, templo: 0, herreria: 0, acueducto: 0, termas: 0, anfiteatro: 0 };
  };
  // guarnición de referencia (refuerzos anuales) de una ciudad según su dueño actual
  G.guarnicionBase = (id, owner) => { const d = D.CITIES[id]; return owner === d.f ? d.g : (d.en228 && owner === 'cartago' ? d.en228.g : (d.post && d.post[owner]) || null); };
  G.newGame = function (heroName) {
    G.turnos = false;   // la interfaz lo activa después; las pruebas y el bot siguen en tiempo continuo
    const s = {
      v: 1, t: 0, speed: 1, res: { madera: 400, piedra: 400, hierro: 400, grano: 400, oro: 200 },
      alm: { madera: 200, piedra: 200, hierro: 200, grano: 200, oro: 0 }, cuarto: { madera: 50, piedra: 50, hierro: 50, grano: 50, oro: 0 }, gastoMes: { madera: 0, piedra: 0, hierro: 0, grano: 0, oro: 0 }, obrasMes: 0, gan: { madera: 0, piedra: 0, hierro: 0, grano: 0, oro: 0 }, informe: [],
      cities: {}, rutas: [], marches: [], log: [], ev: {}, pending: [], over: null, mid: 1,
      mods: { sea: 1, flex: 0 }, forja: { armas: 0, armaduras: 0, cola: null }, stats: { battles: 0, wins: 0, kills: 0, lost: 0 },
      hero: { name: heroName || 'Lucio Cornelio Escipión', lvl: 1, xp: 0, pts: 1, sk: { mando: 0, disc: 0, log: 0 }, city: 'roma', march: null, wound: 0 }
    };
    for (const id in D.CITIES) {
      const d = D.CITIES[id];
      s.cities[id] = { owner: d.f, tipo: 'municipio', tipoElegido: false, units: Object.assign({}, d.g), queue: null, train: [], reparto: G.repartoBase(), b: G.edificiosBase(id, d.w, d.wl) };
    }
    for (const id in s.cities) s.cities[id].pop = Math.round(G.popCap(s.cities[id]) * 0.7);
    for (const id in D.CITIES) if (D.CITIES[id].f === 'roma' && id !== 'roma') incorporar(s.cities[id], D.CITIES[id].g);   // aliada de Roma (Capua): empieza como ciudad recién incorporada
    G.state = s;
    s.evN = D.EVENTS.length;
    checkEvents(D.START_YEAR);
    return s;
  };

  /* ---------- acciones del jugador ---------- */
  G.upgrade = function (cid, b) {
    const c = G.state.cities[cid], L = c.b[b] || 0;
    if (c.owner !== 'roma' || c.queue || L >= D.MAX_LVL || (D.BUILD[b].sea && !D.CITIES[cid].sea)) return false;
    if (D.BUILD[b].solar && L < 1 && G.solaresUsados(c) >= G.solares(cid)) return false;
    if (G.faltaEspecial('edificio', b, L)) return false;   // niveles altos piden un bien especial (B1)   // sin solares no se levanta un edificio urbano nuevo
    const cost = G.cost(b, L), dur = G.buildTime(c, b), pl = nuevoPlazo(cost, mesesDe(dur)); if (!G.canAfford(cuotaK(pl, 0))) return false;
    if (b === 'templo' && !G.diosDe(c)) c.dios = D.DIOSES[c.dios] && !(D.DIOSES[c.dios].sea && !D.CITIES[cid].sea) ? c.dios : 'marte';
    c.queue = Object.assign({ b: b, t0: G.state.t, t1: G.state.t + dur }, pl); pagaCuota(c.queue);
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
    s.marches.push({ id: s.mid++, owner: owner, from: fromId, fromXY: fromXY, to: to, units: units, gen: gen || null, t0: s.t, t1: llegada(s.t + eta), label: label || null });
    G.rutasRevisar();
  }
  const firstMine = list => list.find(id => G.state.cities[id].owner === 'roma') || 'roma';

  const FX = {
    pirro: function (s) {
      if (s.cities.tarentum.owner !== 'epiro') return;
      spawn('epiro', 'tarentum', null, firstMine(['capua', 'roma']), { falange: 70, hoplitas: 50, peltastas: 30, tesalios: 20, elefantes: 3 }, { n: 'Pirro de Epiro', mando: 3, disc: 2 }, 20, 'Pirro');
    },
    pirroSeVa: function (s) { const c = s.cities.tarentum; if (c.owner === 'epiro') { delete c.units.elefantes; } },
    // licencia de juego: en 264 Agrigentum pasa a Cartago (en realidad la usó de base en 262, Polibio 1.17-19)
    agrigentoPunica: function (s) {
      const c = s.cities.agrigentum; if (c.owner !== 'akragas') return;
      c.owner = 'cartago'; c.units = Object.assign({}, D.CITIES.agrigentum.post.cartago);
      G.log('⚔️ Cartago ocupa Agrigentum y la convierte en su base de Sicilia.', 'bad');
    },
    aratoCorinto: function (s) {
      const c = s.cities.corinthus; if (c.owner !== 'macedonia') return;
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
      const n = ['messana', 'syracusae', 'agrigentum', 'panormus', 'lilybaeum'].filter(id => s.cities[id].owner === 'roma').length;
      if (n > 0) { s.res.oro += 400 * n; G.log('🪙 Cartago paga ' + 400 * n + ' denarios de indemnización.', 'good'); }
    },
    telamon: function (s) {
      if (s.cities.mediolanum.owner !== 'galos') return;
      spawn('galos', 'mediolanum', null, firstMine(['volsinii', 'roma']), { galos: 480, jinetes: 80 }, { n: 'Concolitano', mando: 2, disc: 1 }, 14, 'Horda gala');
    },
    anibal1: function (s) {
      spawn('cartago', null, D.proj(6.9, 45.1), firstMine(['mediolanum', 'volsinii', 'roma']), { libios: 240, iberos: 160, galos: 160, numidas: 120, elefantes: 12 }, { n: 'Aníbal Barca', mando: 6, disc: 4 }, 18, 'Aníbal');
    },
    anibal2: function (s) {
      spawn('cartago', null, D.proj(16.1, 41.3), firstMine(['capua', 'tarentum', 'roma']), { libios: 280, iberos: 200, galos: 200, numidas: 160 }, { n: 'Aníbal Barca', mando: 6, disc: 4 }, 16, 'Aníbal');
    },
    escipion: function (s) { s.hero.pts++; },
    masinisa: function (s) { const u = s.cities.roma.units; u.numidas = (u.numidas || 0) + 80; },
    flex: function (s) { s.mods.flex = 1; }
  };

  function checkEvents(year) {
    const s = G.state;
    D.EVENTS.forEach((ev, i) => {
      if (s.ev[i] || year > ev.y) return;
      s.ev[i] = 1;
      if (ev.fx && FX[ev.fx]) FX[ev.fx](s);
      G.log('📜 ' + ev.y + ' a.C. — ' + ev.t, 'hist');
      emit('event', ev);
    });
  }

  function newYear(year, enTurnos) {
    const s = G.state;
    if (!enTurnos) turnoIA(year, 1);
    checkEvents(year);
    if (year < D.END_YEAR && !s.over) { s.over = { win: false, why: 'El año 146 a.C. ha terminado y Cartago sigue en pie. La historia recordará a otro.' }; emit('over'); }
  }

  // turno de los rivales: refuerzos de guarnición e incursiones. factor 1 = una vez al año; en turnos se llama 4 veces al año con 0.25
  function turnoIA(year, factor) {
    const s = G.state, mult = 1 + (D.START_YEAR - year) / (D.START_YEAR - D.END_YEAR) * 0.8;
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
      if (c.queue && s.t >= c.queue.t1) { const b = c.queue.b; c.b[b] = (c.b[b] || 0) + 1; c.queue = null; G.log('🏗️ ' + D.CITIES[id].n + ': ' + D.BUILD[b].n + ' nivel ' + c.b[b] + '.'); emit('dirty'); }
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
    const s = G.state, cap = G.cap(), reg = { mes: Math.floor(s.t + 1e-9), tn: Math.floor((Math.floor(s.t + 1e-9) - 1) / D.TURNO_MESES), r: {} }; let pierde = [];
    for (const v of vencen(Math.floor(s.t + 1e-9))) {   // plazos de obras y reclutas, de la caja antes de guardar
      if (!pagaCuota(v.q)) { v.q.pausa = true; G.log('⏸️ ' + D.CITIES[v.id].n + ': ' + (v.q.u ? 'instrucción' : 'obra') + ' detenida por falta de fondos.', 'bad'); } }
    s.obrasMes = 0;
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
    const l = [head].concat(out.slice(0, 3));
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
    c.owner = f; c.inq = 0; c.queue = null; c.train = []; c.units = Object.assign({}, G.guarnicionBase(id, f) || {});
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
        if (cid === 'carthago') { s.over = { win: true, why: 'Cartago ha caído en ' + G.yearOf(s.t) + ' a.C. Sus muros son arrasados y Roma es dueña del Mediterráneo: Mare Nostrum.' }; }
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
        c.owner = m.owner; c.units = keep(res.surv[1], res.lost[1], 1, 0.3); c.queue = null; c.train = [];
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
  G.save = function () { try { if (typeof localStorage !== 'undefined' && G.state) localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) { /* almacenamiento no disponible */ } };
  G.hasSave = function () { try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
  G.load = function () { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.v === 1) { G.state = s; if (s.turnos === undefined) s.turnos = true; G.turnos = !!s.turnos; if (G.turnos) { if (s.speed === undefined) s.speed = 0; for (const m of s.marches) { const a = Math.ceil(m.t1 / D.TURNO_MESES - 1e-9) * D.TURNO_MESES; if (a > m.t1) m.t1 = a; } } if (!s.rutas) s.rutas = []; if (!s.forja) s.forja = { armas: 0, armaduras: 0, cola: null }; if (s.evN !== D.EVENTS.length) { const y = G.yearOf(s.t); s.ev = {}; D.EVENTS.forEach((e, i) => { if (y <= e.y) s.ev[i] = 1; }); s.evN = D.EVENTS.length; } for (const id in s.cities) { const c = s.cities[id]; if (!D.TIPOS[c.tipo]) c.tipo = 'municipio'; if (c.tipoElegido === undefined) c.tipoElegido = false; if (c.inq === undefined) c.inq = 0;  if (c.b.templo > 0 && !D.DIOSES[c.dios]) c.dios = 'marte'; if (!D.FACTIONS[c.owner]) c.owner = id === 'messana' ? 'mamertinos' : 'campanos'; if (id === 'messana' && c.owner === 'campanos') c.owner = 'mamertinos'; for (const b of ['viviendas', 'mercado', 'puerto', 'herreria', 'acueducto', 'termas', 'anfiteatro']) if (c.b[b] === undefined) c.b[b] = b === 'viviendas' ? 2 : 0; if (c.pop === undefined) c.pop = Math.round(G.popCap(c) * 0.7); if (!D.IMPUESTOS[c.imp]) c.imp = 'normal'; if (!G.repartoValido(c.reparto)) c.reparto = G.repartoBase(); if (id === 'carthagonova' && c.owner !== 'iberos' && !c.w) c.w = D.CITIES.carthagonova.en228.w; } G.migrarCaja(s); return true; } } catch (e) { /* partida corrupta */ } return false; };
  // partida vieja sin caja: los recursos pasan al almacén hasta el tope y el resto queda en la caja (no se pierde nada)
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
  G.wipe = function () { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ } };

  root.Game = G;
  if (typeof module !== 'undefined') module.exports = G;
})(typeof window !== 'undefined' ? window : globalThis);
