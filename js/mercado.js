/* AQVILA — CE4: el mercado de los recursos. Lógica pura (corre en Node), sin pantalla ni Math.random.
   Solo escribe en s.mercado = { v, semilla, rng, seq, S, prev, sucesos, rutas, viajes, portoria, contratos, rivales, avisos, mig, ult }.
   No toca s.res ni s.bienes: lo que mueve dinero o mercancía lo devuelve como `delta` y el juego lo aplica.
   Diseño: gobierno/estudios/CE4-mercado.md. Mes 0 = enero; mes = floor(s.t) % 12 (llamar a MER.mes con s.t ya avanzado).
   Convención de la oferta S (en [-1,1], por ciudad y producto): S alto = sobra = precio bajo (precio × (1 − 0,4·S)).
   HISTORIA: grano barato a la plebe (Livio 30.26.6; 31.4.6; 31.50.1) -> contrato annona; precios cisalpinos y vino a los galos
   (Polibio 2.15.1; Diodoro 5.26.3) -> origen/demanda; portoria en Capua y Puteoli (Livio 32.7.3; 40.51.8); acaparar grano
   multado (Livio 38.35.5); tratados con Cartago (Polibio 3.22-24) -> contrato tratado y casa púnica.
   Todo lo demás (precios base, estación, empuje, flete, riesgo, tasa 2,5 %, rivales) es LICENCIA DE JUEGO. */
(function (root) {
  'use strict';
  const D = root.DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const MER = {};
  const L = 'Licencia de juego: ';
  const CI = D.CITIES;

  // ---------- Productos ----------
  const enOrigen = f => Object.keys(CI).filter(id => f(CI[id], id));
  const bien = id => (D.BIENES && D.BIENES[id]) || null;
  const P = {};
  const prod = (id, n, i, base, peso, origen, demanda, estacion, extra) => { P[id] = Object.assign({ id, n, i, base, peso, origen, demanda, estacion, caduca: 0, nota: L }, extra || {}); };
  // estacion: [primavera, verano, otoño, invierno]. Fuente de la forma: Catón, De agri cultura (cosechas); cifras: licencia de juego.
  const plano = [1, 1, 1, 1];
  prod('grano', 'Grano', '🌾', 2, 1, ['syracusae', 'agrigentum', 'capua', 'carales', 'hadrumetum', 'carthago'], ['roma', 'corinthus', 'pella', 'neapolis'], [1.25, 0.8, 0.9, 1.1]);
  prod('aceite', 'Aceite', '🫒', 5, 1, ['tarentum', 'capua', 'corinthus', 'hadrumetum'], ['roma', 'mediolanum', 'massalia', 'gades'], [1.05, 1.05, 1, 0.85]);
  prod('vino', 'Vino', '🍷', 6, 1, ['messana', 'agrigentum', 'massalia', 'emporion', 'tarraco', 'capua'], ['mediolanum', 'roma', 'carthago'], [1.1, 1.05, 0.8, 1.05]);
  prod('verdura', 'Verdura', '🥬', 2, 1, enOrigen(c => c.tipo === 'agraria'), enOrigen(c => c.w >= 4), [1, 0.85, 0.95, 1.2], { caduca: 0.3 });
  prod('lana', 'Lana', '🐑', 4, 1, ['tarentum', 'mediolanum', 'ambracia', 'capua'], ['roma', 'carthago', 'corinthus'], [0.85, 1, 1.05, 1.1]);
  prod('materiales', 'Materiales', '🧱', 3, 2, ['perusia', 'clusium', 'rusellae', 'syracusae'], ['roma', 'carthago'], plano);
  prod('hierro', 'Hierro', '⚒️', 8, 2, (D.VETAS_HIERRO || []).slice(), enOrigen(c => c.tipo === 'militar'), plano);
  const GRANDES = { caballos: 3, marmol: 3 };
  for (const id of Object.keys(D.BIENES || {})) {
    if (P[id]) continue;
    const b = bien(id);
    prod(id, b.n || id, b.i || '📦', b.precio, GRANDES[id] || 1, enOrigen(c => c.esp === id), ['roma'].concat(enOrigen(c => c.tipo === 'emporio' && c.esp !== id)), plano);
  }
  P.denarios = { id: 'denarios', n: 'Denarios', i: '🪙', base: 1, peso: 0, origen: [], demanda: [], estacion: plano, caduca: 0, moneda: true, nota: 'Es la moneda: no se compra ni se vende.' };
  MER.PRODUCTOS = P;
  MER.ORDEN = Object.keys(P).filter(id => !P[id].moneda);
  // Ciudades sin costa (el comercio entre ellas va por tierra). Licencia de juego (simplificación).
  const INTERIOR = { mediolanum: 1, perusia: 1, clusium: 1, rusellae: 1, volsinii: 1, capua: 1, pella: 1, ambracia: 1 };

  // ---------- Contratos del Senado (bandos del juego: pue, mer, ita, mil, ter...) ----------
  MER.CONTRATOS = {
    annona: { id: 'annona', n: 'Annona', i: '🌾', favor: ['pue'], contra: ['mer'], texto: 'Grano a la plebe a mitad de precio: cuesta denarios cada mes y da +8 de felicidad a la plebe.', nota: 'Livio 30.26.6; 31.4.6; 31.50.1 (ediles repartiendo trigo barato). Cifras: licencia de juego.' },
    monopolio_sal: { id: 'monopolio_sal', n: 'Monopolio de la sal', i: '🧂', favor: ['mer'], contra: ['pue'], texto: 'Solo tú vendes sal: su precio sube un 30 % en tus ciudades y da renta.', nota: L + 'la sal fue monopolio del Estado desde 204 a.C. (Livio 29.37.3); cifras de juego.' },
    tratado: { id: 'tratado', n: 'Tratado comercial', i: '🤝', favor: ['mer', 'ita'], contra: ['mil'], texto: 'Con una facción en paz: sin aduana entre los dos y su casa mercante no compite con tus rutas.', nota: 'Polibio 3.22-24 (tratados de Roma y Cartago sobre dónde comerciar). Cifras: licencia de juego.' },
    flota: { id: 'flota', n: 'Flota del Estado', i: '⚓', favor: ['mil', 'mer'], contra: ['ter'], texto: 'Barcos del Estado: el riesgo del mar baja a la mitad; cuesta denarios cada mes.', nota: L + 'cifras de juego.' }
  };
  MER.DURA_MESES = 24; // 8 estaciones de 3 meses (usuario, 24/11)

  // ---------- Casas mercantes rivales ----------
  MER.CASAS = {
    punicos: { id: 'punicos', n: 'Mercaderes púnicos', f: 'cartago', ciudades: ['carthago', 'gades', 'panormus', 'lilybaeum', 'carales', 'hadrumetum'], nota: 'Polibio 3.22-24. Cifras: licencia de juego.' },
    griegos: { id: 'griegos', n: 'Mercaderes griegos', f: 'griegos', ciudades: ['massalia', 'syracusae', 'neapolis', 'emporion'], nota: L + 'reparto de ciudades por casa.' },
    italicos: { id: 'italicos', n: 'Mercaderes itálicos', f: 'italicos', ciudades: ['capua', 'neapolis', 'tarentum'], nota: L + 'reparto de ciudades por casa.' }
  };
  const CASAS_ORD = Object.keys(MER.CASAS);
  const CARGAS_RIVAL = 4;

  // Constantes de juego (licencia de juego, ver diseño §3-§5)
  const K = { ORIGEN: 0.7, DEMANDA: 1.4, EMPUJE: 30, VUELTA: 0.2, OFERTA: 0.4, FLECHA: 0.03, RUIDO: 0.05, FLETE_TIERRA: 0.03, FLETE_MAR: 0.01, LEGUAS: 10,
    VEL_TIERRA: 4, VEL_MAR: 9, RIESGO_MAR: 0.04, RIESGO_GUERRA: 0.08, RIESGO_TIERRA: 0.01, PORT0: 0.025, PORT_MAX: 0.05, TOPE_NIVEL: 10, MAX_N: 200,
    CADUCA_VIAJE: 0.1, ACAPARA: 3, ACAPARA_PRECIO: 1.5 };

  // ---------- Utilidades ----------
  const obj = x => x && typeof x === 'object' && !Array.isArray(x);
  const r2 = x => Math.round(x * 100) / 100;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const mesAbs = s => Math.floor((s.t || 0) + 1e-9);
  const estIdx = m => { const k = ((m % 12) + 12) % 12; return [3, 3, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3][k]; }; // 0 prim, 1 ver, 2 otoño, 3 inv
  const nomC = id => (CI[id] && CI[id].n) || id;
  function hash(str) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  // Ruido sin estado: misma semilla, mes, ciudad y producto -> mismo valor en [-1, 1].
  const ruido = (m, mes, c, p) => (hash(m.semilla + '|' + mes + '|' + c + '|' + p) / 4294967295) * 2 - 1;
  // Azar con estado (mulberry32 sobre m.rng): solo para sucesos, viajes perdidos y rutas.
  function rnd(m) { m.rng = (m.rng + 0x6D2B79F5) >>> 0; let t = m.rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

  const ciudadesDe = s => Object.keys(s.cities || CI).filter(id => CI[id]);
  const dueno = (s, c, ay) => (ay && ay.dueño ? ay.dueño(c) : null) || (s.cities && s.cities[c] && s.cities[c].owner) || (CI[c] && CI[c].f);
  const nivel = (s, c, b, ay) => (ay && ay.nivel ? ay.nivel(c, b) : ((s.cities && s.cities[c] && s.cities[c].b) || {})[b]) || 0;
  const mias = (s, ay) => ciudadesDe(s).filter(c => dueno(s, c, ay) === 'roma');
  const guerra = (ay, f) => !!(ay && ay.enGuerra && ay.enGuerra(f));

  // ---------- Estado ----------
  MER.migrar = s => {
    if (!obj(s.mercado)) s.mercado = {};
    const m = s.mercado; m.v = 1;
    if (typeof m.semilla !== 'number' || !isFinite(m.semilla)) m.semilla = (hash(String(s.region || '') + '|' + (s.mid || '') + '|' + (s.modo || '')) ^ 0x9e3779b9) >>> 0;
    if (typeof m.rng !== 'number') m.rng = (m.semilla ^ 0x85ebca6b) >>> 0;
    if (typeof m.seq !== 'number') m.seq = 0;
    for (const k of ['S', 'prev', 'portoria', 'rivales', 'mig']) if (!obj(m[k])) m[k] = {};
    for (const k of ['sucesos', 'rutas', 'viajes', 'contratos', 'avisos']) if (!Array.isArray(m[k])) m[k] = [];
    for (const c of ciudadesDe(s)) if (typeof m.portoria[c] !== 'number') m.portoria[c] = K.PORT0; // la quadragesima (licencia de juego en la cifra)
    for (const k of CASAS_ORD) if (!obj(m.rivales[k])) m.rivales[k] = { ult: '', ops: 0 };
    // Rutas viejas {a,b,f} -> ruta con el producto que más gana. No se borra s.rutas (lo hace el juego).
    if (Array.isArray(s.rutas)) for (const r of s.rutas) {
      if (!r || !CI[r.a] || !CI[r.b]) continue;
      const key = r.a + '>' + r.b;
      if (m.mig[key]) continue;
      m.mig[key] = 1;
      let mejor = null, g = -1e9;
      for (const p of MER.ORDEN) { const cu = cuentaCruda(s, { a: r.a, b: r.b, prod: p, cargas: 1 }, null); if (cu.neto > g) { g = cu.neto; mejor = p; } }
      m.rutas.push({ id: 'r' + (++m.seq), a: r.a, b: r.b, prod: mejor, cargas: 4, vieja: true });
    }
    return s;
  };
  const est = s => { if (!obj(s.mercado) || !obj(s.mercado.S)) MER.migrar(s); return s.mercado; };

  // ---------- Precio ----------
  function sucesoMult(m, s, c, p, ay) {
    let x = 1, que = null;
    for (const e of m.sucesos) {
      if (e.t === 'guerra' && (p === 'grano' || p === 'hierro') && dueno(s, c, ay) === e.f) { x *= 1.3; que = que || 'guerra'; }
      else if (e.t === 'bloqueo' && e.c === c) { x *= 1.5; que = 'bloqueo'; }
      else if ((e.t === 'mala' || e.t === 'buena') && p === 'grano' && CI[e.c] && Math.hypot(CI[e.c].lon - CI[c].lon, CI[e.c].lat - CI[c].lat) <= 5) { x *= e.t === 'mala' ? 1.6 : 0.75; que = que || 'cosecha'; }
    }
    return { x, que };
  }
  function contratoMult(m, s, c, p, ay) {
    let x = 1;
    if (p === 'sal' && m.contratos.some(k => k.id === 'monopolio_sal') && dueno(s, c, ay) === 'roma') x *= 1.3;
    return x;
  }
  function origenMult(s, c, p, ay) {
    const f = P[p];
    if (f.origen.indexOf(c) >= 0) return K.ORIGEN;
    if (p === 'verdura' && dueno(s, c, ay) === 'roma' && nivel(s, c, 'granja', ay) >= 3) return K.ORIGEN; // con huerto propio
    if (f.demanda.indexOf(c) >= 0) return K.DEMANDA;
    if (p === 'materiales' && s.cities && s.cities[c] && Array.isArray(s.cities[c].obras) && s.cities[c].obras.length) return K.DEMANDA; // ciudades en obras
    return 1;
  }
  // Precio sin el empuje de la oferta (para simular varias cargas).
  function detalle(s, c, p, mes, ay) {
    const m = est(s), f = P[p];
    if (!f || f.moneda || !CI[c]) return null;
    const o = origenMult(s, c, p, ay), e = f.estacion[estIdx(mes)];
    const sc = sucesoMult(m, s, c, p, ay), k = contratoMult(m, s, c, p, ay);
    const rz = 1 + K.RUIDO * ruido(m, mes, c, p);
    const port = dueno(s, c, ay) === 'roma' ? 1 + ((m.portoria[c] == null ? K.PORT0 : m.portoria[c]) - K.PORT0) : 1; // +1 % por punto sobre el 2,5 %
    return { sinOferta: f.base * o * e * sc.x * k * rz * port, o, e, sc, k };
  }
  const Sget = (m, c, p) => (m.S[c] && m.S[c][p]) || 0;
  const precioEn = (s, c, p, mes, ay) => { const d = detalle(s, c, p, mes, ay); return d ? Math.max(0.05, d.sinOferta * (1 - K.OFERTA * Sget(est(s), c, p))) : 0; };
  MER.precio = (s, c, p, ay) => r2(precioEn(s, c, p, mesAbs(s), ay));
  MER.flecha = (s, c, p, ay) => {
    const m = est(s), pr = m.prev[c] && m.prev[c][p];
    if (!pr) return 0;
    const ahora = precioEn(s, c, p, mesAbs(s), ay);
    return ahora > pr * (1 + K.FLECHA) ? 1 : ahora < pr * (1 - K.FLECHA) ? -1 : 0;
  };
  function motivoDe(s, c, p, ay) {
    const m = est(s), d = detalle(s, c, p, mesAbs(s), ay), S = Sget(m, c, p);
    if (!d) return '';
    if (d.sc.que === 'bloqueo') return 'bloqueo';
    const cand = [
      [d.sc.x, d.sc.que || 'guerra'], [d.o, d.o < 1 ? 'lo produce' : 'lo pide'], [d.e, d.e < 1 ? 'temporada' : 'escasea'], [1 - K.OFERTA * S, S > 0 ? 'sobra' : 'falta']
    ];
    let best = '', mx = 0.07;
    for (const [x, t] of cand) { const v = Math.abs(Math.log(x)); if (v > mx) { mx = v; best = t; } }
    return best;
  }
  MER.tabla = (s, c, ay) => MER.ORDEN.map(p => ({ prod: p, n: P[p].n, i: P[p].i, precio: MER.precio(s, c, p, ay), base: P[p].base, flecha: MER.flecha(s, c, p, ay), motivo: motivoDe(s, c, p, ay) }));
  MER.mejores = (s, p, n, ay) => {
    n = n || 3;
    const l = ciudadesDe(s).map(c => ({ ciudad: c, precio: MER.precio(s, c, p, ay) }));
    return { barato: l.slice().sort((a, b) => a.precio - b.precio || (a.ciudad < b.ciudad ? -1 : 1)).slice(0, n), caro: l.slice().sort((a, b) => b.precio - a.precio || (a.ciudad < b.ciudad ? -1 : 1)).slice(0, n) };
  };

  // ---------- Comprar y vender (mueven S) ----------
  // dir = -1 compra (S baja, precio sube), +1 venta. No muta si `aplicar` es falso.
  function simular(s, c, p, n, dir, ay, aplicar, mes) {
    const m = est(s), d = detalle(s, c, p, mes == null ? mesAbs(s) : mes, ay);
    if (!d) return null;
    const paso = 1 / (K.EMPUJE * Math.max(1, CI[c].w || 1));
    let S = Sget(m, c, p), total = 0;
    for (let k = 0; k < n; k++) { total += Math.max(0.05, d.sinOferta * (1 - K.OFERTA * S)); S = clamp(S + dir * paso, -1, 1); }
    if (aplicar) { if (!m.S[c]) m.S[c] = {}; m.S[c][p] = r2(S * 1000) / 1000 === 0 ? 0 : Math.round(S * 1000) / 1000; }
    return { total: r2(total), medio: r2(total / n) };
  }
  function validarOp(s, c, p, n) {
    if (!CI[c]) return 'Ciudad desconocida';
    if (!P[p]) return 'Producto desconocido';
    if (P[p].moneda) return 'Los denarios no se compran ni se venden';
    if (!(n >= 1) || n !== Math.floor(n) || n > K.MAX_N) return 'Cantidad no válida';
    return '';
  }
  // Una ciudad tuya con mercado o puerto (el juego lo usa antes de comprar o vender).
  MER.puedeComerciar = (s, c, ay) => dueno(s, c, ay) !== 'roma' ? 'Ciudad ajena' : (nivel(s, c, 'mercado', ay) < 1 && nivel(s, c, 'puerto', ay) < 1) ? 'Hace falta un mercado o un puerto' : '';
  MER.comprar = (s, c, p, n, ay) => {
    const mal = validarOp(s, c, p, n); if (mal) return { ok: false, motivo: mal, delta: {}, precioMedio: 0 };
    const r = simular(s, c, p, n, -1, ay, false);
    if (ay && ay.tiene && ay.tiene('denarios') < r.total) return { ok: false, motivo: 'Faltan denarios', delta: {}, precioMedio: r.medio };
    if (ay && ay.cabe && ay.cabe(p) < n) return { ok: false, motivo: 'No cabe en el almacén', delta: {}, precioMedio: r.medio };
    simular(s, c, p, n, -1, ay, true);
    return { ok: true, motivo: '', delta: { denarios: -r.total, [p]: n }, precioMedio: r.medio };
  };
  MER.vender = (s, c, p, n, ay) => {
    const mal = validarOp(s, c, p, n); if (mal) return { ok: false, motivo: mal, delta: {}, precioMedio: 0 };
    if (ay && ay.tiene && ay.tiene(p) < n) return { ok: false, motivo: 'No tienes tanto', delta: {}, precioMedio: 0 };
    const r = simular(s, c, p, n, 1, ay, true);
    return { ok: true, motivo: '', delta: { denarios: r.total, [p]: -n }, precioMedio: r.medio };
  };

  // ---------- Flete ----------
  const costa = c => !INTERIOR[c];
  const dist = (a, b) => Math.hypot((CI[a].lon - CI[b].lon) * 0.8, CI[a].lat - CI[b].lat); // grados; 1 legua de mapa = 0,1 grado
  function viaDe(s, a, b, ay) {
    if (ay && ay.esMar) return ay.esMar(a, b) ? 'mar' : 'tierra';
    return costa(a) && costa(b) ? 'mar' : 'tierra'; // sin juego: mar si las dos tienen costa
  }
  function bloqueado(m, a, b) { return m.sucesos.some(e => e.t === 'bloqueo' && (e.c === a || e.c === b)); }
  function riesgoMes(s, b, via, ay) {
    const m = est(s);
    let r = via === 'mar' ? (guerra(ay, dueno(s, b, ay)) ? K.RIESGO_GUERRA : K.RIESGO_MAR) : K.RIESGO_TIERRA;
    if (via === 'mar' && m.contratos.some(k => k.id === 'flota')) r *= 0.5;
    return r;
  }
  MER.flete = (s, a, b, p, n, ay) => {
    const m = est(s);
    if (!CI[a] || !CI[b] || !P[p]) return { meses: 0, coste: 0, via: 'tierra', riesgo: 0 };
    const via = viaDe(s, a, b, ay), d = dist(a, b);
    const meses = Math.max(1, Math.ceil(ay && ay.travel ? ay.travel(a, b) : d / (via === 'mar' ? K.VEL_MAR : K.VEL_TIERRA)));
    const coste = r2((via === 'mar' ? K.FLETE_MAR : K.FLETE_TIERRA) * P[p].peso * d * K.LEGUAS * n);
    const rm = riesgoMes(s, b, via, ay);
    return { meses, coste, via, riesgo: r2(1 - Math.pow(1 - rm, meses)), bloqueado: via === 'mar' && bloqueado(m, a, b) };
  };

  // ---------- Aduanas ----------
  MER.portoriumFijar = (s, c, tasa) => { const m = est(s); if (!CI[c]) return false; m.portoria[c] = r2(clamp(+tasa || 0, 0, K.PORT_MAX) * 10000) / 10000; return true; };
  const tratados = m => m.contratos.filter(k => k.id === 'tratado' && k.f).map(k => k.f);
  function tasaPaso(s, c, ay) { // lo que paga una mercancía de otro al pasar por la ciudad c
    const m = est(s);
    return m.portoria[c] == null ? K.PORT0 : m.portoria[c];
  }
  // Aduana de un viaje tuyo: solo se paga en ciudades que no son tuyas (sus tasas), salvo tratado con su dueño.
  function portoriaViaje(s, a, b, valorA, valorB, ay) {
    const m = est(s), tr = tratados(m); let x = 0;
    if (dueno(s, a, ay) !== 'roma' && tr.indexOf(dueno(s, a, ay)) < 0) x += valorA * tasaPaso(s, a, ay);
    if (dueno(s, b, ay) !== 'roma' && tr.indexOf(dueno(s, b, ay)) < 0) x += valorB * tasaPaso(s, b, ay);
    return r2(x);
  }

  // ---------- Rutas y viajes ----------
  function cuentaCruda(s, r, ay) {
    const mes = mesAbs(s), n = r.cargas || 1;
    const cp = simular(s, r.a, r.prod, n, -1, ay, false, mes);
    const fl = MER.flete(s, r.a, r.b, r.prod, n, ay);
    const nVend = P[r.prod].caduca ? Math.floor(n * Math.pow(1 - K.CADUCA_VIAJE, fl.meses)) : n;
    const vt = nVend >= 1 ? simular(s, r.b, r.prod, nVend, 1, ay, false, mes) : { total: 0 };
    const port = portoriaViaje(s, r.a, r.b, cp.total, vt.total, ay);
    return { compra: cp.total, venta: vt.total, flete: fl.coste, portoria: port, neto: r2(vt.total - cp.total - fl.coste - port), fl, nVend };
  }
  MER.rutaCuenta = (s, r, ay) => { const c = cuentaCruda(s, r, ay); return { compra: c.compra, venta: c.venta, flete: c.flete, portoria: c.portoria, neto: c.neto }; };
  MER.rutaTope = (s, a, b, ay) => K.TOPE_NIVEL * nivel(s, a, viaDe(s, a, b, ay) === 'mar' ? 'puerto' : 'mercado', ay);
  MER.rutaCrear = (s, o, ay) => {
    const m = est(s);
    if (!CI[o.a] || !CI[o.b] || o.a === o.b) return { ok: false, motivo: 'Ciudades no válidas' };
    if (!P[o.prod] || P[o.prod].moneda) return { ok: false, motivo: 'Producto desconocido' };
    if (dueno(s, o.a, ay) !== 'roma') return { ok: false, motivo: 'La ruta sale de una ciudad tuya' };
    const cargas = Math.floor(o.cargas || 0), tope = MER.rutaTope(s, o.a, o.b, ay);
    if (cargas < 1) return { ok: false, motivo: 'Cantidad no válida' };
    if (cargas > tope) return { ok: false, motivo: tope ? 'Tope de ' + tope + ' cargas al mes' : 'Hace falta un mercado (o puerto por mar) en ' + nomC(o.a) };
    const r = { id: 'r' + (++m.seq), a: o.a, b: o.b, prod: o.prod, cargas };
    m.rutas.push(r);
    return { ok: true, motivo: '', ruta: r };
  };
  MER.rutaQuitar = (s, id) => { const m = est(s), n = m.rutas.length; m.rutas = m.rutas.filter(r => r.id !== id); return m.rutas.length < n; };
  MER.viajeLanzar = (s, o, ay) => {
    const m = est(s), n = Math.floor(o.cargas || 0);
    const mal = validarOp(s, o.a, o.prod, n) || (!CI[o.b] ? 'Ciudad desconocida' : o.a === o.b ? 'Mismo lugar' : '');
    if (mal) return { ok: false, motivo: mal, delta: {} };
    const fl = MER.flete(s, o.a, o.b, o.prod, n, ay);
    if (fl.bloqueado) return { ok: false, motivo: 'Puerto bloqueado: el mar está cortado', delta: {} };
    const cp = simular(s, o.a, o.prod, n, -1, ay, false);
    const total = r2(cp.total + fl.coste);
    if (ay && ay.tiene && ay.tiene('denarios') < total) return { ok: false, motivo: 'Faltan denarios', delta: {} };
    simular(s, o.a, o.prod, n, -1, ay, true);
    const v = { id: 'v' + (++m.seq), a: o.a, b: o.b, prod: o.prod, cargas: n, meses: fl.meses, resta: fl.meses, via: fl.via, coste: total };
    m.viajes.push(v);
    return { ok: true, motivo: '', delta: { denarios: -total }, viaje: v };
  };

  // ---------- Contratos ----------
  const ctrActivo = (m, id) => m.contratos.some(k => k.id === id);
  MER.contratosPosibles = (s, ay) => {
    const m = est(s), pais = {};
    ciudadesDe(s).forEach(c => { const f = dueno(s, c, ay); if (f !== 'roma') pais[f] = 1; });
    const enPaz = Object.keys(pais).filter(f => !guerra(ay, f) && tratados(m).indexOf(f) < 0).sort();
    return Object.keys(MER.CONTRATOS).map(id => { const k = MER.CONTRATOS[id]; return { id, n: k.n, i: k.i, texto: k.texto, favor: k.favor, contra: k.contra, vigente: ctrActivo(m, id) && id !== 'tratado', opciones: id === 'tratado' ? enPaz : null }; });
  };
  MER.contratoProponer = (s, id, op, ay) => {
    const m = est(s), k = MER.CONTRATOS[id];
    if (!k) return { ok: false, aprobado: false, motivo: 'Contrato desconocido' };
    if (id !== 'tratado' && ctrActivo(m, id)) return { ok: false, aprobado: false, motivo: 'Ya está vigente' };
    let f = null;
    if (id === 'tratado') {
      f = op && op.f;
      if (!f || !CI || !ciudadesDe(s).some(c => dueno(s, c, ay) === f && f !== 'roma')) return { ok: false, aprobado: false, motivo: 'Elige una facción' };
      if (guerra(ay, f)) return { ok: false, aprobado: false, motivo: 'Estáis en guerra' };
      if (tratados(m).indexOf(f) >= 0) return { ok: false, aprobado: false, motivo: 'Ya hay tratado con ellos' };
    }
    let r = ay && ay.votar ? ay.votar(k.favor.slice(), k.contra.slice()) : k.favor.length > k.contra.length;
    if (obj(r)) r = r.aprobado != null ? r.aprobado : r.ok;
    const aprobado = !!r;
    if (!aprobado) return { ok: true, aprobado: false, motivo: 'El Senado lo rechaza' };
    const c = { id, hasta: mesAbs(s) + MER.DURA_MESES };
    if (f) c.f = f;
    m.contratos.push(c);
    return { ok: true, aprobado: true, motivo: '' };
  };
  MER.efectos = s => {
    const m = est(s), n = mias(s).length, e = { felicidad: { pue: 0 }, riesgoMar: 1, portoriaCero: tratados(m), costeMes: 0, renta: 0 };
    if (ctrActivo(m, 'annona')) { e.felicidad.pue += 8; e.costeMes += 8 * n; }
    if (ctrActivo(m, 'monopolio_sal')) e.renta += 6 * n;
    if (ctrActivo(m, 'flota')) { e.riesgoMar = 0.5; e.costeMes += 10 * n; }
    return e;
  };

  // ---------- El mes ----------
  const sumar = (d, k, x) => { d[k] = r2((d[k] || 0) + x); };
  function sincronizarSucesos(s, m, ay, mes, av) {
    m.sucesos = m.sucesos.filter(e => !e.juego && e.hasta > mes);
    const owners = {}; ciudadesDe(s).forEach(c => { const f = dueno(s, c, ay); if (f !== 'roma') owners[f] = 1; });
    const fs = Object.keys(owners).sort(), cs = ciudadesDe(s);
    if (ay && ay.enGuerra) fs.forEach(f => { if (ay.enGuerra(f)) m.sucesos.push({ t: 'guerra', f, hasta: mes + 1, juego: 1 }); });
    if (ay && ay.bloqueada) cs.forEach(c => { if (ay.bloqueada(c)) m.sucesos.push({ t: 'bloqueo', c, hasta: mes + 1, juego: 1 }); });
    if (ay && ay.cosecha) cs.forEach(c => { const k = ay.cosecha(c); if (k === 'mala' || k === 'buena') m.sucesos.push({ t: k, c, hasta: mes + 1, juego: 1 }); });
    // Al azar (con semilla) solo lo que el juego no da.
    const falta = [];
    if (!(ay && ay.enGuerra) && fs.length) falta.push('guerra');
    if (!(ay && ay.bloqueada)) falta.push('bloqueo');
    if (!(ay && ay.cosecha)) falta.push('cosecha');
    if (falta.length && m.sucesos.filter(e => !e.juego).length < 4 && rnd(m) < 0.1) {
      const t = falta[Math.floor(rnd(m) * falta.length)], dur = 2 + Math.floor(rnd(m) * 3);
      if (t === 'guerra') { const f = fs[Math.floor(rnd(m) * fs.length)]; m.sucesos.push({ t, f, hasta: mes + dur }); av.push({ texto: 'Guerra con ' + f + ': sube el grano y el hierro allí', tono: 'malo' }); }
      else if (t === 'bloqueo') { const c = cs[Math.floor(rnd(m) * cs.length)]; m.sucesos.push({ t, c, hasta: mes + dur }); av.push({ texto: 'Bloqueo del puerto de ' + nomC(c) + ': todo más caro y sin rutas de mar', tono: 'malo' }); }
      else { const c = cs[Math.floor(rnd(m) * cs.length)], mala = rnd(m) < 0.5; m.sucesos.push({ t: mala ? 'mala' : 'buena', c, hasta: mes + dur }); av.push({ texto: (mala ? 'Mala' : 'Buena') + ' cosecha cerca de ' + nomC(c), tono: mala ? 'malo' : 'bueno' }); }
    }
  }
  function rivales(s, m, ay, delta, av) {
    const tr = tratados(m), pool = ciudadesDe(s), mes = mesAbs(s);
    for (const id of CASAS_ORD) {
      const casa = MER.CASAS[id];
      if (guerra(ay, casa.f)) { m.rivales[id].ult = 'guerra'; continue; } // en guerra con quien esté su facción
      const compite = tr.indexOf(casa.f) >= 0;
      let mejor = null;
      for (const p of MER.ORDEN) {
        let a = null, b = null, pa = 1e9, pb = -1;
        for (const c of pool) {
          if (dueno(s, c, ay) === 'roma' && compite && m.rutas.some(r => r.prod === p && r.b === c)) continue; // el tratado aparta a la casa de tus rutas
          const x = precioEn(s, c, p, mes, ay);
          if (x < pa) { pa = x; a = c; }
          if (x > pb) { pb = x; b = c; }
        }
        if (!a || !b || a === b) continue;
        const fl = MER.flete(s, a, b, p, 1, ay).coste;
        const ta = dueno(s, a, ay) === 'roma' ? tasaPaso(s, a, ay) : 0, tb = dueno(s, b, ay) === 'roma' ? tasaPaso(s, b, ay) : 0;
        const margen = pb * (1 - tb) - pa * (1 + ta) - fl;
        if (margen > 0.08 * pa && (!mejor || margen / pa > mejor.rel)) mejor = { p, a, b, rel: margen / pa, pa, pb, ta, tb };
      }
      if (!mejor) { m.rivales[id].ult = ''; continue; }
      const fr = tratados(m).indexOf(casa.f) >= 0; // con tratado no pagan aduana
      const n = CARGAS_RIVAL;
      const ca = simular(s, mejor.a, mejor.p, n, -1, ay, true), vb = simular(s, mejor.b, mejor.p, n, 1, ay, true);
      if (!fr) { if (mejor.ta) sumar(delta, 'denarios', ca.total * mejor.ta); if (mejor.tb) sumar(delta, 'denarios', vb.total * mejor.tb); }
      m.rivales[id].ult = mejor.p + ':' + mejor.a + '>' + mejor.b; m.rivales[id].ops = (m.rivales[id].ops || 0) + 1;
    }
  }
  MER.mes = (s, ay) => {
    const m = est(s), mes = mesAbs(s), delta = {}, av = [];
    // 1) guardar los precios del mes anterior (para las flechas) antes de mover nada
    const old = typeof m.ult === 'number' ? m.ult : mes - 1;
    for (const c of ciudadesDe(s)) { m.prev[c] = {}; for (const p of MER.ORDEN) m.prev[c][p] = r2(precioEn(s, c, p, old, ay)); }
    // 2) sucesos
    sincronizarSucesos(s, m, ay, mes, av);
    // 3) la oferta vuelve un 20 % hacia 0
    for (const c of Object.keys(m.S)) { for (const p of Object.keys(m.S[c])) { const v = m.S[c][p] * (1 - K.VUELTA); if (Math.abs(v) < 0.005) delete m.S[c][p]; else m.S[c][p] = Math.round(v * 1000) / 1000; } if (!Object.keys(m.S[c]).length) delete m.S[c]; }
    // 4) producción de tus ciudades: lo que sobra abarata el producto allí (S sube; el diseño decía «baja S» pero su convención es S alto = sobra)
    if (ay && ay.produccion) for (const c of mias(s, ay)) { const q = ay.produccion(c, mes) || {}; for (const p of ['aceite', 'vino', 'verdura', 'lana', 'grano']) if (q[p] > 0) { if (!m.S[c]) m.S[c] = {}; m.S[c][p] = Math.round(clamp((m.S[c][p] || 0) + Math.min(0.15, q[p] / 600), -1, 1) * 1000) / 1000; } }
    // 5) rutas que van solas
    for (const r of m.rutas.slice()) {
      const fl = MER.flete(s, r.a, r.b, r.prod, r.cargas, ay);
      if (fl.bloqueado) { av.push({ texto: 'Ruta ' + nomC(r.a) + ' → ' + nomC(r.b) + ' cortada por el bloqueo', tono: 'malo' }); continue; }
      const cu = cuentaCruda(s, r, ay);
      if (ay && ay.tiene && ay.tiene('denarios') + (delta.denarios || 0) < cu.compra + cu.flete) { av.push({ texto: 'Ruta ' + nomC(r.a) + ' → ' + nomC(r.b) + ': faltan denarios', tono: 'malo' }); continue; }
      simular(s, r.a, r.prod, r.cargas, -1, ay, true);
      if (rnd(m) < fl.riesgo) { sumar(delta, 'denarios', -(cu.compra + cu.flete)); av.push({ texto: 'Se pierde la carga de ' + P[r.prod].n + ' en la ruta a ' + nomC(r.b), tono: 'malo' }); continue; }
      if (cu.nVend >= 1) simular(s, r.b, r.prod, cu.nVend, 1, ay, true);
      sumar(delta, 'denarios', cu.neto);
    }
    // 6) viajes a mano
    const quedan = [];
    for (const v of m.viajes) {
      v.resta--;
      if (v.resta > 0) { quedan.push(v); continue; }
      const fl = MER.flete(s, v.a, v.b, v.prod, v.cargas, ay);
      if (rnd(m) < fl.riesgo) { av.push({ texto: 'Se ha perdido el viaje de ' + P[v.prod].n + ' a ' + nomC(v.b), tono: 'malo' }); continue; }
      const nV = P[v.prod].caduca ? Math.floor(v.cargas * Math.pow(1 - K.CADUCA_VIAJE, v.meses)) : v.cargas;
      if (nV < 1) { av.push({ texto: 'La mercancía se ha echado a perder en el viaje a ' + nomC(v.b), tono: 'malo' }); continue; }
      const vt = simular(s, v.b, v.prod, nV, 1, ay, true), port = portoriaViaje(s, v.a, v.b, 0, vt.total, ay);
      sumar(delta, 'denarios', vt.total - port);
      av.push({ texto: 'Llega ' + P[v.prod].n + ' a ' + nomC(v.b) + ': ' + r2(vt.total - port) + ' denarios', tono: 'bueno' });
    }
    m.viajes = quedan;
    // 7) rivales (pagan aduana en tus puertos)
    rivales(s, m, ay, delta, av);
    // 8) contratos: coste, renta y vencimiento
    const ef = MER.efectos(s);
    if (ef.costeMes) sumar(delta, 'denarios', -ef.costeMes);
    if (ef.renta) sumar(delta, 'denarios', ef.renta);
    m.contratos = m.contratos.filter(k => { if (k.hasta > mes) return true; av.push({ texto: 'Vence el contrato: ' + MER.CONTRATOS[k.id].n, tono: 'info' }); return false; });
    const ef2 = MER.efectos(s); ef2.felicidad = { pue: ef.felicidad.pue };
    // 9) verdura que caduca y acaparamiento de grano
    const ex = ay && ay.existencias ? ay.existencias() : (s.bienes || null);
    if (ex) {
      // Caducidad una vez al mes: fracción por ayuda.perdida(prod, ciudad) o, sin ayuda, la del producto (verdura 0,3).
      for (const p of MER.ORDEN) {
        const fr = ay && ay.perdida ? ay.perdida(p, null) : P[p].caduca;
        const q = fr > 0 && ex[p] > 0 ? Math.floor(ex[p] * fr) : 0;
        if (q > 0) { sumar(delta, p, -q); av.push({ texto: 'Se pierden ' + q + ' de ' + P[p].n.toLowerCase(), tono: 'info' }); }
      }
      if (ex.consumoGrano > 0 && ex.grano > K.ACAPARA * ex.consumoGrano && mias(s, ay).some(c => precioEn(s, c, 'grano', mes, ay) > K.ACAPARA_PRECIO * P.grano.base)) {
        ef2.felicidad.pue -= 5; av.push({ texto: 'Los ediles te acusan de acaparar grano: la plebe protesta', tono: 'malo' });
      }
    }
    m.ult = mes;
    m.avisos = (m.avisos.concat(av)).slice(-8);
    return { delta, avisos: av, efectos: ef2 };
  };

  // ---------- Consejo del Edil del mercado ----------
  MER.consejo = (s, ay) => {
    const mes = mesAbs(s), mi = mias(s, ay), srcs = mi.length ? mi : ciudadesDe(s), n = 10;
    let mejor = null;
    for (const p of MER.ORDEN) for (const a of srcs) for (const b of ciudadesDe(s)) {
      if (a === b) continue;
      const pa = precioEn(s, a, p, mes, ay);
      if (pa <= 0 || precioEn(s, b, p, mes, ay) < pa * 1.1) continue; // descarte barato antes de simular
      const cu = cuentaCruda(s, { a, b, prod: p, cargas: n }, ay);
      if (cu.fl.bloqueado) continue;
      if (!mejor || cu.neto > mejor.ganancia) mejor = { prod: p, a, b, ganancia: cu.neto };
    }
    if (!mejor || mejor.ganancia <= 0) return { prod: null, a: null, b: null, ganancia: 0, texto: 'Ahora no hay negocio que valga la pena.' };
    mejor.texto = 'Compra ' + P[mejor.prod].n + ' en ' + nomC(mejor.a) + ' y véndelo en ' + nomC(mejor.b) + ': unos ' + Math.round(mejor.ganancia) + ' denarios por ' + n + ' cargas.';
    return mejor;
  };

  root.MERCADO = MER;
  if (typeof module !== 'undefined' && module.exports) module.exports = MER;
})(typeof window !== 'undefined' ? window : globalThis);
