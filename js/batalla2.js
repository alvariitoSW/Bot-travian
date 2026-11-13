/* AQVILA — Batalla nueva (NB1): el choque en tres sectores, sin pantalla.
   Corre en Node y en el navegador (global `Batalla2`). Estado 100 % serializable (JSON).
   API:  crear(cfg) · consejo(estado, bando) · aplicar(estado, ordenes, bando) · pulso(estado, semilla)
   Un pulso = 2 s de batalla. Ver gobierno/estudios/batalla-nueva.md §3.
   Sectores: 0 izquierda, 1 centro, 2 derecha. Línea de choque −2..+2 (+ = gana terreno el bando 0).
   NB2: maniobras del choque (rodear, mover, reserva oculta, retirada fingida, vigilar el flanco) y su uso por el enemigo según su carácter. */
(function (root) {
  'use strict';
  let D = root.DATA, Bat = root.Battle;
  if (typeof require !== 'undefined') {
    try { if (!D) D = require('./data.js'); } catch (e) { /* sin datos: tabla de reserva */ }
    try { if (!Bat) Bat = require('./battle.js').Battle; } catch (e) { /* sin planes del motor viejo */ }
  }
  const PLANES = (Bat && Bat.PLANES) || { centro: 'Centro fuerte', alas: 'Envolver por las alas', cerro: 'Defender el cerro', emboscar: 'Emboscar', hostigar: 'Hostigar y huir' };

  // ---------- cifras (se afinan con test/batalla2.test.mjs) ----------
  const DT = 2;                    // segundos por pulso
  const MANDO_CON = 5, MANDO_SIN = 2, MANDO_SEG = 10;  // puntos de mando; +1 cada 10 s
  const TOPE_CAMPO = 20;           // regimientos por bando en el campo (frente + apoyo + reserva)
  const FILA = 3;                  // regimientos por fila y sector
  const KBAJAS = 0.0015;           // bajas por pulso = golpe enemigo × KBAJAS
  const APOYO_PESO = 0.25;         // el apoyo aporta un cuarto de su fuerza
  const REPARTO_FRENTE = 0.85;     // parte de las bajas que recibe la fila de frente
  const UMBRAL_GANA = 1.15;        // quien gana por más de un 15 % empuja la línea
  const UMBRAL_ANIMO = 0.5;        // quien pierde por más de un 50 % se desmoraliza
  const EMPUJE_PASO = 8;           // pulsos de ventaja acumulada para mover la línea un paso
  const ANIMO_PASO = 4;            // pulsos de derrota clara para bajar un estado de ánimo
  const FAT_PRESIONA = 20, FAT_SOSTIENE = 40, FAT_APOYO = 20;  // segundos por punto de cansancio
  const ANIMO_RECUPERA = 20;       // segundos en retaguardia para subir un estado de ánimo
  const REFUERZO_RETRASO = 6;      // segundos hasta que entra un refuerzo
  const TOPE_SEG = 900;            // tope de seguridad: 15 min
  const UMBRAL_ETIQUETA = 0.15;    // Favorable / Arriesgado a ±15 %
  const ANIMOS = ['Firme', 'Vacilante', 'Desordenado', 'Huye'];
  const ANIMO_PEGA = [1, 0.92, 0.8, 0];
  const SECTORES = ['ala izquierda', 'centro', 'ala derecha'];
  const POSTURAS = {   // coste de mando, familia, multiplicador de golpe
    aguantar: { n: 'Aguantar', coste: 0, fam: 'sostener', mul: 1 },
    avanzar: { n: 'Avanzar', coste: 1, fam: 'presionar', mul: 1.2 },
    cargar: { n: 'Cargar', coste: 1, fam: 'presionar', mul: 1.25 },
    hostigar: { n: 'Hostigar', coste: 1, fam: 'sostener', mul: 1 },
    retirarse: { n: 'Retirarse', coste: 1, fam: 'ceder', mul: 0.55 }
  };
  const COSTE_RELEVAR = 2, COSTE_GENERAL = 1;
  // NB2: las cuatro maniobras del choque (rodear, mover, reserva oculta, retirada fingida) y «vigila el flanco»
  const COSTES = { relevar: 2, general: 1, rodear: 2, mover: 1, reservaOculta: 0, fingir: 2, vigilar: 1 };
  const RODEO_SEG = 20, MOVER_SEG = 10, VIGILA_SEG = 40, DESCUBRE_SEG = 120;
  const GOLPE_SORPRESA = 1.3, SORPRESA_SEG = 10, FLANCO_RODEO_SEG = 20;   // golpe ×1,3 durante 10 s al entrar por sorpresa
  const FINGE_PASO = 6, FINGE_ESPERA = 20, BOLSA_MAX = 40, BOLSA_ANIMO = 10, BOLSA_GOLPE = 1.15;
  const ESPALDA = 2.0;   // golpe contra un sector atacado por la espalda (rodeo que llega, bolsa)
  const LATERAL = ['vado', 'bosque', 'cerro'];   // terreno que permite rodear
  const CARGA_CAB = 1.5;           // «cargar» con caballería o elefantes
  const HOSTIGA_TIRO = 1.3;        // tiradores en «hostigar» (en el apoyo, medio golpe en vez de un cuarto)
  const FLANCO_ABIERTO = 1.2;      // el enemigo golpea así si el flanco está abierto
  const CERRO = 1.2, BOSQUE_TIRO = 0.7, BOSQUE_CAB = 0.8;
  const VET_MUL = 0.12;            // por grado de veteranía
  // contra[atacante][defensor]
  const CONTRA = {
    inf: { inf: 1, spear: 0.95, rng: 1.25, cav: 0.9, ele: 0.85, gen: 1 },
    spear: { inf: 1, spear: 1, rng: 1.2, cav: 1.5, ele: 1.1, gen: 1 },
    rng: { inf: 0.9, spear: 0.9, rng: 1, cav: 1, ele: 1.15, gen: 1 },
    cav: { inf: 1, spear: 0.65, rng: 1.35, cav: 1, ele: 0.8, gen: 1 },
    ele: { inf: 1.25, spear: 0.85, rng: 1.3, cav: 1.2, ele: 1, gen: 1 }
  };
  const TABLA_RESERVA = {
    hastati: { n: 'Hastati', cls: 'inf', atk: 9, def: 9 }, velites: { n: 'Vélites', cls: 'rng', atk: 4, ratk: 7, def: 4 },
    principes: { n: 'Príncipes', cls: 'inf', atk: 12, def: 11 }, triarii: { n: 'Triarios', cls: 'spear', atk: 11, def: 15 },
    equites: { n: 'Équites', cls: 'cav', atk: 14, def: 9 }, libios: { n: 'Infantería libia', cls: 'inf', atk: 9, def: 9 },
    numidas: { n: 'Caballería númida', cls: 'cav', atk: 11, def: 7 }, honderos: { n: 'Honderos baleares', cls: 'rng', atk: 3, ratk: 8, def: 3 },
    elefantes: { n: 'Elefantes de guerra', cls: 'ele', atk: 13, def: 9 }
  };
  const unidad = id => (D && D.UNITS && D.UNITS[id]) || TABLA_RESERVA[id] || { n: id, cls: 'inf', atk: 8, def: 8 };
  const poder = u => (((u.cls === 'rng' ? (u.ratk || u.atk) : u.atk) + u.def) / 2) * (u.cls === 'ele' ? 2.2 : 1);

  // ---------- utilidades ----------
  function rng32(seed) { let a = (seed >>> 0) || 1; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const clon = o => JSON.parse(JSON.stringify(o));
  const romano = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'][n] || String(n);
  const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
  const dir = b => (b === 0 ? 1 : -1);
  const lineaDe = (sec, b) => sec.linea * dir(b);       // + = va bien para el bando b
  const bandoNombre = (est, b) => est.bandos[b].nombre;
  const vivosEnFila = (est, s, b, fila) => est.sectores[s].filas[b][fila].map(id => est.regs[id]);

  // ---------- crear ----------
  function crear(cfg) {
    cfg = cfg || {};
    const est = {
      version: 1, t: 0, pulsos: 0, fin: null, humano: 0, semilla: cfg.semilla || 1,
      ajustes: { pausas: cfg.pausas || 'todas' },
      objetivo: cfg.objetivo || { tipo: 'ganar' },       // {tipo:'resistir', seg:120}
      sectores: [], bandos: [], regs: {}, programados: [], avisosVistos: {}, avisosPend: [],
      ganchos: { maniobras: [] }                          // maniobras en curso (retiradas fingidas); rodeos y marchas van en «programados»
    };
    const terr = (cfg.terreno && cfg.terreno.sectores) || [];
    for (let s = 0; s < 3; s++) {
      const r = terr[s] || {}; const tipo = r.tipo || 'llano';
      est.sectores.push({ id: s, nombre: SECTORES[s], linea: r.linea || 0, emp: 0, rasgo: { tipo: tipo, dueno: r.dueno == null ? null : r.dueno },
        cap: tipo === 'puente' ? 1 : FILA, roto: [false, false], vacio: [0, 0], flancoT: [0, 0], espaldaT: [0, 0], flancoAbierto: [!!(cfg.flancoAbierto && cfg.flancoAbierto[0] === s) || false, !!(cfg.flancoAbierto && cfg.flancoAbierto[1] === s) || false],
        filas: [{ frente: [], apoyo: [] }, { frente: [], apoyo: [] }], posturas: ['aguantar', 'aguantar'], cruza: r.cruza == null ? null : r.cruza });
    }
    for (let b = 0; b < 2; b++) {
      const cb = (cfg.bandos && cfg.bandos[b]) || { regs: [] };
      const g = cb.general === undefined ? { n: b === 0 ? 'Cónsul' : 'Jefe enemigo' } : cb.general;
      const bando = { id: b, nombre: cb.nombre || (b === 0 ? 'Roma' : 'Enemigo'), ia: cb.ia != null ? !!cb.ia : b !== est.humano,
        general: g ? { n: g.n || 'General', sector: g.sector == null ? 1 : g.sector, hp: g.hp || 3, vivo: true, alerta: false } : null,
        mando: g ? MANDO_CON : MANDO_SIN, mandoT: 0, reserva: [], cola: [], huidos: 0, tribunos: cb.tribunos || tribunosPorDefecto(b, cb.nombre),
        car: cb.car || 'equilibrado', plan: cb.plan || null, gesto: null, bono: cb.bono || { fuerza: 1 }, n0: 0, contador: {} };
      est.bandos.push(bando);
      desplegar(est, b, cb.regs || [], cb);
      bando.n0 = Object.keys(est.regs).filter(id => est.regs[id].bando === b).reduce((a, id) => a + est.regs[id].n0, 0);
    }
    // vado: quien cruza llega Vacilante y cansado (gancho que usará la maniobra con cfg.terreno.sectores[i].cruza)
    for (const sec of est.sectores) if (sec.cruza != null) for (const id of sec.filas[sec.cruza].frente.concat(sec.filas[sec.cruza].apoyo)) { est.regs[id].animo = Math.max(est.regs[id].animo, 1); est.regs[id].fat = Math.max(est.regs[id].fat, 1); }
    for (let b = 0; b < 2; b++) if (est.bandos[b].ia) iaElegirPlan(est, b, rng32(est.semilla + b * 101));
    for (let b = 0; b < 2; b++) if (est.bandos[b].ia) iaDecide(est, b, rng32(est.semilla + b * 313), []);
    return est;
  }
  function tribunosPorDefecto(b, nombre) {
    if (b === 0) return [{ n: 'Cayo Fabio', car: 'prudente' }, { n: 'Lucio Quincio', car: 'agresivo' }, { n: 'Marco Valerio', car: 'astuto' }];
    return [{ n: 'Hanón', car: 'prudente' }, { n: 'Magón', car: 'agresivo' }, { n: 'Bomílcar', car: 'astuto' }];
  }
  function nuevoReg(est, b, d) {
    const u = unidad(d.tipo); const bando = est.bandos[b];
    const k = bando.contador[d.tipo] = (bando.contador[d.tipo] || 0) + 1;
    const id = 'b' + b + 'r' + Object.keys(est.regs).filter(x => est.regs[x].bando === b).length;
    const n = d.n || 80;
    est.regs[id] = { id: id, bando: b, tipo: d.tipo, nombre: u.n + ' ' + romano(k), cls: u.cls, n: n, n0: n, animo: 0, fat: 0, fatT: 0, vet: Math.max(0, Math.min(2, d.vet || 0)),
      lugar: 'cola', sector: null, accAnimo: 0, recT: 0, cargando: false, oculto: !!d.oculto };   // «oculto» = reserva oculta
    return est.regs[id];
  }
  // Despliegue automático: caballería a las alas, pesados al centro, tiradores al apoyo; sobrantes a reserva y cola.
  function desplegar(est, b, lista, cb) {
    const regs = lista.map(d => nuevoReg(est, b, d));
    const campo = regs.slice(0, TOPE_CAMPO), cola = regs.slice(TOPE_CAMPO);
    let res = campo.filter((r, i) => lista[i].reserva || lista[i].oculto);
    if (!res.length && campo.length > 15) res = campo.slice(-2);
    const esIA = cb && cb.ia != null ? !!cb.ia : b !== est.humano;
    if (!res.length && esIA && cb && cb.car === 'prudente' && campo.length >= 6) {   // el prudente guarda una reserva oculta
      const c = campo.filter(r => r.cls === 'inf' || r.cls === 'spear').slice(-1)[0]; if (c) { res = [c]; c.oculto = true; }
    }
    const resIds = new Set(res.map(r => r.id)); const libres = campo.filter(r => !resIds.has(r.id));
    const porPoder = (a, c) => poder(unidad(c.tipo)) - poder(unidad(a.tipo));
    const cav = libres.filter(r => r.cls === 'cav' || r.cls === 'ele'), rng = libres.filter(r => r.cls === 'rng'), pesados = libres.filter(r => r.cls !== 'cav' && r.cls !== 'ele' && r.cls !== 'rng').sort(porPoder);
    const frente = [[], [], []], apoyo = [[], [], []], capF = s => est.sectores[s].cap;
    const poner = (arr, s, r, cap) => { if (arr[s].length < cap) { arr[s].push(r); return true; } return false; };
    if (cav[0]) poner(frente, 0, cav.shift(), capF(0));
    if (cav[0]) poner(frente, 2, cav.shift(), capF(2));
    const orden = [1, 0, 2];
    for (const r of pesados.slice()) { let ok = false; for (let k = 0; k < 3 && !ok; k++) ok = poner(frente, orden[k], r, capF(orden[k])); if (ok) pesados.splice(pesados.indexOf(r), 1); }
    let i = 0; for (const r of rng.concat(pesados, cav)) { let ok = false; for (let k = 0; k < 3 && !ok; k++) ok = poner(apoyo, orden[(i + k) % 3], r, FILA); if (ok) i++; else res.push(r); }
    for (let s = 0; s < 3; s++) {
      frente[s].forEach(r => { r.lugar = 'frente'; r.sector = s; est.sectores[s].filas[b].frente.push(r.id); });
      apoyo[s].forEach(r => { r.lugar = 'apoyo'; r.sector = s; est.sectores[s].filas[b].apoyo.push(r.id); });
    }
    res.forEach(r => { r.lugar = 'reserva'; est.bandos[b].reserva.push(r.id); });
    campo.forEach(r => { if (r.lugar !== 'reserva') r.oculto = false; });
    cola.forEach(r => { est.bandos[b].cola.push(r.id); });
    if (est.bandos[b].general === null) return;
  }

  // ---------- fuerza ----------
  function mezclaFrente(est, s, b) {   // composición del frente del bando b, ponderada por hombres
    const m = { inf: 0, spear: 0, rng: 0, cav: 0, ele: 0, gen: 0 }; let t = 0;
    for (const r of vivosEnFila(est, s, b, 'frente')) { m[r.cls] = (m[r.cls] || 0) + r.n; t += r.n; }
    if (t > 0) for (const k in m) m[k] /= t; return m;
  }
  function contraDe(r, mezcla) { const c = CONTRA[r.cls] || CONTRA.inf; let v = 0, t = 0; for (const k in mezcla) { v += mezcla[k] * (c[k] || 1); t += mezcla[k]; } return t > 0 ? v / t : 1; }
  function flancoAbierto(est, s, b) {   // el flanco del bando b en el sector s está abierto
    const sec = est.sectores[s]; if (sec.flancoAbierto[b] || (sec.flancoT && sec.flancoT[b] > est.t)) return true;
    for (const n of [s - 1, s + 1]) { if (n < 0 || n > 2) continue; const sn = est.sectores[n]; if (lineaDe(sn, b) <= -1 && lineaDe(sec, b) >= lineaDe(sn, b) + 1) return true; }
    return false;
  }
  function mulPostura(r, post, en) {   // multiplicador de golpe de un regimiento en el frente
    const P = POSTURAS[post]; let m = P.mul;
    if (P.fam === 'presionar' && r.fat >= 3) m = 1;                      // agotado: no puede presionar
    if (post === 'cargar' && r.fat < 3 && (r.cls === 'cav' || r.cls === 'ele')) m = CARGA_CAB;
    if (post === 'hostigar' && r.cls === 'rng') m = HOSTIGA_TIRO;
    return m;
  }
  // Golpe del bando b en el sector s con las posturas dadas. Devuelve {g, frente, apoyo}.
  function golpe(est, s, b, posturas) {
    const sec = est.sectores[s], post = posturas || sec.posturas, e = 1 - b; const mez = mezclaFrente(est, s, e);
    const bando = est.bandos[b]; let gF = 0, gA = 0;
    const ter = r => { const t = sec.rasgo.tipo; let m = 1; if (t === 'bosque') m = r.cls === 'rng' ? BOSQUE_TIRO : (r.cls === 'cav' ? BOSQUE_CAB : 1); if (t === 'cerro' && sec.rasgo.dueno === b) m = CERRO; return m; };
    const base = r => r.n * poder(unidad(r.tipo)) * ANIMO_PEGA[r.animo] * (1 - 0.1 * r.fat) * (1 + VET_MUL * r.vet) * contraDe(r, mez) * ter(r) * (bando.bono.fuerza || 1) * (r.golpeHasta > est.t ? (r.golpeMul || 1) : 1);
    for (const r of vivosEnFila(est, s, b, 'frente')) gF += base(r) * mulPostura(r, post[b], 1);
    for (const r of vivosEnFila(est, s, b, 'apoyo')) { const p = (post[b] === 'hostigar' && r.cls === 'rng') ? 0.5 : APOYO_PESO; gA += base(r) * p; }
    let g = gF + gA;
    if (bando.general && bando.general.vivo && bando.general.sector === s) g *= 1.05;
    if (flancoAbierto(est, s, e) && false) g *= 1;   // (el flanco abierto lo sufre el otro bando: ver abajo)
    if (sec.espaldaT && sec.espaldaT[e] > est.t) g *= ESPALDA; else if (flancoAbierto(est, s, e)) g *= FLANCO_ABIERTO;   // por la espalda se pega más que por el flanco
    if (sec.roto[e]) g *= 1.4;
    const fg = maniobra(est, 'fingida', b, s); if (fg && fg.fase === 'bolsa') g *= BOLSA_GOLPE;   // la bolsa golpea por el flanco
    return { g: g, frente: gF, apoyo: gA };
  }

  // ---------- maniobras (NB2) ----------
  const listaMan = est => (est.ganchos && est.ganchos.maniobras) || (est.ganchos = { maniobras: [] }).maniobras;
  function maniobra(est, tipo, b, s) { return listaMan(est).find(m => m.tipo === tipo && m.bando === b && (s == null || m.sector === s)) || null; }
  const vecinos = s => [s - 1, s + 1].filter(n => n >= 0 && n <= 2);
  function elegirReg(est, s, b, id, prefCav) {   // regimiento que sale de un sector: el indicado, o uno de apoyo (mejor caballería si se pide)
    const f = est.sectores[s].filas[b], todos = f.frente.concat(f.apoyo); if (todos.length < 2) return null;
    if (id) { const r = est.regs[id]; return r && r.bando === b && todos.indexOf(id) >= 0 ? r : null; }
    const pref = (a, c) => (prefCav ? ((c.cls === 'cav') - (a.cls === 'cav')) : 0) || (a.fat + a.animo) - (c.fat + c.animo);
    const ap = f.apoyo.map(i => est.regs[i]).filter(r => r.animo < 2).sort(pref); if (ap.length) return ap[0];
    const fr = f.frente.map(i => est.regs[i]).filter(r => r.animo < 2).sort(pref); return fr[0] || null;
  }
  function terrenoRodeo(est, s) { const sec = est.sectores[s]; if (s !== 0 && s !== 2) return null; if (sec.cruza != null) return 'el vado'; const t = sec.rasgo.tipo; return LATERAL.indexOf(t) >= 0 ? (t === 'bosque' ? 'el bosque' : t === 'cerro' ? 'el cerro' : 'el vado') : null; }
  function opcionesRodeo(est, b) {   // alas desde las que se puede rodear, con el regimiento que saldría
    const o = []; for (const s of [0, 2]) { const t = terrenoRodeo(est, s); if (!t) continue; const r = elegirReg(est, s, b, null, true); if (r) o.push({ origen: s, por: t, reg: r.id }); } return o;
  }
  function entraSector(est, r, s, b) {   // coloca un regimiento que llega a un sector: frente, luego apoyo; false si no cabe
    const sec = est.sectores[s], f = sec.filas[b];
    if (f.frente.length < sec.cap) { f.frente.push(r.id); r.lugar = 'frente'; } else if (f.apoyo.length < FILA) { f.apoyo.push(r.id); r.lugar = 'apoyo'; } else return false;
    r.sector = s; r.cargando = false; return true;
  }
  const reservaVisible = (est, b) => est.bandos[b].reserva.filter(id => !est.regs[id].oculto).length;   // la oculta no se ve ni se cuenta
  function vigilaActiva(est, b, s) { const v = est.bandos[b].vigila; return !!(v && v.hasta > est.t && (s == null || v.sector === s)); }
  function rompeFingida(est, m, sucesos, motivo) {
    const sec = est.sectores[m.sector], b = m.bando; listaMan(est).splice(listaMan(est).indexOf(m), 1);
    if (motivo === 'rota') { if (!sec.roto[b]) { sec.roto[b] = true; sucesos.push({ t: est.t, tipo: 'roto', bando: b, sector: m.sector, txt: 'La retirada fingida se rompe de verdad: el ' + SECTORES[m.sector] + ' de ' + bandoNombre(est, b) + ' cede' }); } }
    else sucesos.push({ t: est.t, tipo: 'fingida', bando: b, sector: m.sector, txt: motivo === 'vana' ? 'El enemigo no muerde el anzuelo en el ' + SECTORES[m.sector] : 'La bolsa del ' + SECTORES[m.sector] + ' se deshace' });
  }
  function maniobrasPulso(est, sucesos, avisos) {   // cada pulso: reserva oculta que se descubre y retiradas fingidas en curso
    const H = est.humano;
    if (est.t >= DESCUBRE_SEG) for (let b = 0; b < 2; b++) for (const id of est.bandos[b].reserva) { const r = est.regs[id]; if (r.oculto) { r.oculto = false; if (b !== H) avisos.push({ tipo: 'reserva', grave: false, bando: b, sector: 1, motivo: 'Se descubre una reserva enemiga tras el centro' }); } }
    for (const m of listaMan(est).slice()) {
      if (m.tipo !== 'fingida') continue;
      const b = m.bando, e = 1 - b, s = m.sector, sec = est.sectores[s];
      const vecinoCede = vecinos(s).some(n => est.sectores[n].posturas[b] === 'retirarse' || est.sectores[n].roto[b] || listaMan(est).some(x => x.tipo === 'fingida' && x.bando === b && x.sector === n && x.fase === 'cede'));
      if (m.fase === 'cede') {
        if (vecinoCede) { rompeFingida(est, m, sucesos, 'rota'); continue; }
        sec.posturas[b] = 'retirarse'; m.cT += DT;
        if (m.cT >= FINGE_PASO) { m.cT = 0; m.pasos++; sec.linea -= dir(b); sec.emp = 0; sucesos.push({ t: est.t, tipo: 'linea', bando: e, sector: s, txt: cap1(SECTORES[s]) + ': la línea de ' + bandoNombre(est, b) + ' retrocede' }); }
        if (m.pasos >= m.pasosMax) { m.fase = 'espera'; m.espT = 0; sec.posturas[b] = 'aguantar'; }
      } else if (m.fase === 'espera') {
        sec.posturas[b] = 'aguantar'; m.espT += DT;
        if (vecinoCede) { rompeFingida(est, m, sucesos, 'rota'); continue; }
        /* el enemigo ha entrado en el terreno cedido */ if (lineaDe(sec, b) <= -1 && sec.posturas[e] !== 'retirarse' && sec.filas[e].frente.length) { m.fase = 'bolsa'; m.bolsaT = 0; m.animoT = 0; sucesos.push({ t: est.t, tipo: 'bolsa', bando: b, sector: s, txt: '¡El enemigo cae en la bolsa del ' + SECTORES[s] + '!' }); }
        else if (m.espT >= FINGE_ESPERA) rompeFingida(est, m, sucesos, 'vana');
      } else {   // bolsa: golpe por el flanco y −1 ánimo cada 10 s
        sec.posturas[b] = 'aguantar'; sec.flancoT[e] = est.t + DT + 1; sec.espaldaT[e] = est.t + DT + 1; m.bolsaT += DT; m.animoT += DT;
        if (vecinoCede) { rompeFingida(est, m, sucesos, 'rota'); continue; }
        if (m.animoT >= BOLSA_ANIMO) { m.animoT = 0; for (const id of sec.filas[e].frente) { const r = est.regs[id]; if (r.animo < 3) { r.animo++; sucesos.push({ t: est.t, tipo: 'animo', bando: e, sector: s, reg: id, txt: r.nombre + ': ' + ANIMOS[r.animo] }); } } }
        if (m.bolsaT >= BOLSA_MAX || !sec.filas[e].frente.length) rompeFingida(est, m, sucesos, 'fin');
      }
    }
  }

  // ---------- órdenes ----------
  function mandoMax(bando) { return bando.general && bando.general.vivo ? MANDO_CON : MANDO_SIN; }
  function relevarSector(est, b, s, soloReserva) {
    const sec = est.sectores[s], filas = sec.filas[b], bando = est.bandos[b];
    const frente = filas.frente.map(id => est.regs[id]);
    const cansado = frente.slice().sort((a, c) => (c.fat + c.animo * 1.5) - (a.fat + a.animo * 1.5))[0];
    const apoyo = filas.apoyo.map(id => est.regs[id]).filter(r => r.animo < 3).sort((a, c) => (a.fat + a.animo) - (c.fat + c.animo))[0];
    if (!soloReserva && cansado && apoyo && (apoyo.fat + apoyo.animo) < (cansado.fat + cansado.animo)) {   // se intercambian
      filas.frente[filas.frente.indexOf(cansado.id)] = apoyo.id; filas.apoyo[filas.apoyo.indexOf(apoyo.id)] = cansado.id;
      apoyo.lugar = 'frente'; cansado.lugar = 'apoyo'; apoyo.cargando = false;
      return { txt: apoyo.nombre + ' releva a ' + cansado.nombre + ' en el ' + sec.nombre };
    }
    if (bando.reserva.length) {   // entra la reserva
      let k = soloReserva ? bando.reserva.findIndex(i => est.regs[i].oculto) : -1; if (k < 0) k = 0;
      const id = bando.reserva.splice(k, 1)[0], r = est.regs[id], salta = r.oculto; r.sector = s; r.oculto = false;
      if (salta) { r.golpeMul = GOLPE_SORPRESA; r.golpeHasta = est.t + SORPRESA_SEG; }
      if (filas.frente.length < sec.cap) { filas.frente.push(id); r.lugar = 'frente'; } else if (filas.apoyo.length < FILA) { filas.apoyo.push(id); r.lugar = 'apoyo'; } else { bando.reserva.unshift(id); return null; }
      return { txt: (salta ? '¡' + r.nombre + ' sale de la reserva oculta y golpea en el ' : r.nombre + ' entra desde la reserva en el ') + sec.nombre + (salta ? '!' : ''), reserva: id };
    }
    return null;
  }
  // ordenes: [{orden:'avanzar'|'cargar'|'aguantar'|'hostigar'|'retirarse'|'relevar'|'general', sector:0..2}]
  // NB2: además de las posturas, 'rodear' {sector: ala, objetivo, reg?}, 'mover' {sector, a, reg?}, 'reservaOculta' {reg?}, 'fingir' {sector}, 'vigilar' {sector}.
  function ordenar(est, b, o, sucesos) {
    const bando = est.bandos[b], sec = est.sectores[o.sector];
    if (!sec && o.orden !== 'reservaOculta') return { ok: false, motivo: 'Sector desconocido' };
    if (est.fin) return { ok: false, motivo: 'La batalla ha terminado' };
    if (POSTURAS[o.orden]) {
      if (maniobra(est, 'fingida', b, o.sector)) return { ok: false, motivo: 'La retirada fingida manda en el ' + sec.nombre };
      const P = POSTURAS[o.orden], igual = sec.posturas[b] === o.orden, coste = igual ? 0 : P.coste;
      if (coste > bando.mando) return { ok: false, motivo: 'Falta mando (' + bando.mando + ' de ' + coste + ')' };
      bando.mando -= coste; sec.posturas[b] = o.orden; if (!igual) sec.posT = null;
      for (const r of vivosEnFila(est, o.sector, b, 'frente')) if (o.orden !== 'cargar') r.cargando = false;
      return { ok: true, gasto: coste };
    }
    if (o.orden === 'relevar') {
      if (bando.mando < COSTE_RELEVAR) return { ok: false, motivo: 'Falta mando (' + bando.mando + ' de ' + COSTE_RELEVAR + ')' };
      const r = relevarSector(est, b, o.sector, !!o.reserva); if (!r) return { ok: false, motivo: 'No hay con quién relevar en el ' + sec.nombre };
      bando.mando -= COSTE_RELEVAR; if (sucesos) sucesos.push({ t: est.t, tipo: 'relevo', bando: b, sector: o.sector, txt: r.txt, reserva: r.reserva });
      if (r.reserva && b !== est.humano) est.avisosPend.push({ tipo: 'reserva', grave: false, bando: b, sector: o.sector, motivo: 'Aparece una reserva enemiga en el ' + SECTORES[o.sector] });
      return { ok: true, gasto: COSTE_RELEVAR, reserva: r.reserva };
    }
    if (o.orden === 'general') {
      if (!bando.general || !bando.general.vivo) return { ok: false, motivo: 'No hay general' };
      if (bando.general.sector === o.sector) return { ok: true, gasto: 0 };
      if (bando.mando < COSTE_GENERAL) return { ok: false, motivo: 'Falta mando' };
      bando.mando -= COSTE_GENERAL; bando.general.sector = o.sector; bando.general.alerta = false;
      if (sucesos) sucesos.push({ t: est.t, tipo: 'general', bando: b, sector: o.sector, txt: bando.general.n + ' pasa al ' + sec.nombre });
      return { ok: true, gasto: COSTE_GENERAL };
    }
    if (o.orden === 'rodear') {
      const por = terrenoRodeo(est, o.sector); if (!por) return { ok: false, motivo: 'El ' + sec.nombre + ' no tiene vado, bosque ni cerro para rodear' };
      const dest = o.objetivo == null ? 1 : o.objetivo; if (!est.sectores[dest]) return { ok: false, motivo: 'Sector enemigo desconocido' };
      if (bando.mando < COSTES.rodear) return { ok: false, motivo: 'Falta mando (' + bando.mando + ' de ' + COSTES.rodear + ')' };
      const r = elegirReg(est, o.sector, b, o.reg, true); if (!r) return { ok: false, motivo: 'No hay regimiento que pueda salir del ' + sec.nombre };
      bando.mando -= COSTES.rodear; quitarDeFilas(est, r); r.lugar = 'rodeo'; r.sector = null; r.cargando = false;
      est.programados.push({ tipo: 'rodeo', en: est.t + RODEO_SEG, bando: b, sector: dest, reg: r.id, origen: o.sector });
      if (sucesos) sucesos.push({ t: est.t, tipo: 'rodeo', bando: b, sector: o.sector, objetivo: dest, reg: r.id, txt: r.nombre + ' sale del campo por ' + por + ' para rodear el ' + SECTORES[dest] });
      return { ok: true, gasto: COSTES.rodear, reg: r.id };
    }
    if (o.orden === 'mover') {
      const dest = o.a; if (!est.sectores[dest] || Math.abs(dest - o.sector) !== 1) return { ok: false, motivo: 'Solo se mueve a un sector vecino' };
      if (bando.mando < COSTES.mover) return { ok: false, motivo: 'Falta mando' };
      const r = elegirReg(est, o.sector, b, o.reg, false); if (!r) return { ok: false, motivo: 'No hay regimiento que pueda salir del ' + sec.nombre };
      bando.mando -= COSTES.mover; quitarDeFilas(est, r); r.lugar = 'marcha'; r.sector = null; r.cargando = false;
      est.programados.push({ tipo: 'mover', en: est.t + MOVER_SEG, bando: b, sector: dest, reg: r.id, origen: o.sector });
      if (sucesos) sucesos.push({ t: est.t, tipo: 'mover', bando: b, sector: o.sector, objetivo: dest, reg: r.id, txt: r.nombre + ' marcha del ' + sec.nombre + ' al ' + SECTORES[dest] });
      return { ok: true, gasto: COSTES.mover, reg: r.id };
    }
    if (o.orden === 'reservaOculta') {
      const id = o.reg || bando.reserva.find(i => !est.regs[i].oculto); const r = id && est.regs[id];
      if (!r || r.bando !== b || r.lugar !== 'reserva') return { ok: false, motivo: 'No hay reserva que esconder' };
      r.oculto = true; return { ok: true, gasto: 0, reg: id };
    }
    if (o.orden === 'vigilar') {
      if (bando.mando < COSTES.vigilar) return { ok: false, motivo: 'Falta mando' };
      bando.mando -= COSTES.vigilar; bando.vigila = { sector: o.sector, hasta: est.t + VIGILA_SEG };
      if (sucesos) sucesos.push({ t: est.t, tipo: 'vigila', bando: b, sector: o.sector, txt: bandoNombre(est, b) + ' vigila el flanco del ' + sec.nombre });
      return { ok: true, gasto: COSTES.vigilar };
    }
    if (o.orden === 'fingir') {
      if (bando.mando < COSTES.fingir) return { ok: false, motivo: 'Falta mando (' + bando.mando + ' de ' + COSTES.fingir + ')' };
      if (maniobra(est, 'fingida', b, o.sector)) return { ok: false, motivo: 'Ya hay una retirada fingida en ese sector' };
      if (vecinos(o.sector).some(n => maniobra(est, 'fingida', b, n))) return { ok: false, motivo: 'Un sector vecino ya cede: si cedieran dos juntos, se romperían' };
      if (!sec.filas[b].frente.length) return { ok: false, motivo: 'No hay frente que retirar en el ' + sec.nombre };
      const pasos = Math.min(2, lineaDe(sec, b) + 2); if (pasos < 1) return { ok: false, motivo: 'El ' + sec.nombre + ' ya no tiene dónde ceder' };
      bando.mando -= COSTES.fingir; sec.posturas[b] = 'retirarse'; sec.posT = null;
      listaMan(est).push({ tipo: 'fingida', bando: b, sector: o.sector, fase: 'cede', pasos: 0, pasosMax: pasos, cT: 0, t0: est.t });
      if (sucesos) sucesos.push({ t: est.t, tipo: 'fingida', bando: b, sector: o.sector, txt: cap1(sec.nombre) + ': ' + bandoNombre(est, b) + ' cede terreno' });
      return { ok: true, gasto: COSTES.fingir };
    }
    return { ok: false, motivo: 'Orden desconocida: ' + o.orden };
  }
  function aplicar(estado, ordenes, bando) {
    const est = clon(estado), sucesos = [], gasto = { total: 0 }, rechazadas = [];
    for (const o of ordenes || []) { const r = ordenar(est, bando, o, sucesos); if (r.ok) gasto.total += r.gasto || 0; else rechazadas.push({ orden: o, motivo: r.motivo }); }
    est.bandos[bando].gesto = { texto: textoGesto(est, bando), posturas: est.sectores.map(sc => sc.posturas[bando]), t: est.t };   // el gesto anunciado sigue al día (p. ej. «vigila el flanco»)
    return { estado: est, gasto: gasto.total, rechazadas: rechazadas, sucesos: sucesos, mando: est.bandos[bando].mando };
  }

  // ---------- gesto y plan del enemigo (versión sencilla; NB2 lo ampliará) ----------
  function carDe(est, b) { return est.bandos[b].car; }
  function iaElegirPlan(est, b, rand) {
    const bando = est.bandos[b]; if (bando.plan && PLANES[bando.plan]) return;
    const car = bando.car, claves = Object.keys(PLANES);
    const pesos = { equilibrado: { centro: 2, alas: 2, cerro: 1, emboscar: 1, hostigar: 1 }, astuto: { centro: 0.5, alas: 2, cerro: 0.5, emboscar: 2.6, hostigar: 1 }, impetuoso: { centro: 2.4, alas: 0.4, cerro: 0.3, emboscar: 0.2, hostigar: 0.1 }, prudente: { centro: 2.2, alas: 0.4, cerro: 1.8, emboscar: 0.5, hostigar: 0.5 } }[car] || {};
    let t = 0; claves.forEach(k => { t += (pesos[k] || 1); }); let x = rand() * t, el = claves[0];
    for (const k of claves) { x -= (pesos[k] || 1); if (x <= 0) { el = k; break; } }
    bando.plan = el;
  }
  function textoGesto(est, b) {
    const bando = est.bandos[b], p = est.sectores.map(sc => sc.posturas[b]); const nom = bando.nombre;
    const pres = p.map((x, i) => (POSTURAS[x].fam === 'presionar' ? i : -1)).filter(i => i >= 0), ced = p.map((x, i) => (x === 'retirarse' ? i : -1)).filter(i => i >= 0);
    if (ced.length) return nom + ' cede terreno en el ' + SECTORES[ced[0]] + (vigilaActiva(est, b) ? ' y vigila el flanco.' : '.');
    if (pres.length === 3) return nom + ' ataca en todo el frente.';
    if (pres.length === 2) return nom + ' presiona en ' + pres.map(i => 'el ' + SECTORES[i]).join(' y ') + '.';
    if (pres.length === 1) return nom + ' concentra el golpe en el ' + SECTORES[pres[0]] + '.';
    if (p.indexOf('hostigar') >= 0) return nom + ' hostiga con tiradores.';
    if (vigilaActiva(est, b)) return nom + ' vigila el flanco del ' + SECTORES[bando.vigila.sector] + '.';
    return nom + ' se mantiene firme y espera.';
  }
  function ratioSector(est, s, b, posturas) { const a = golpe(est, s, b, posturas).g, c = golpe(est, s, 1 - b, posturas).g; return a / Math.max(c, 1); }
  function cansadoFrente(est, s, b) { const f = vivosEnFila(est, s, b, 'frente'); return f.length ? f.reduce((a, r) => a + r.fat, 0) / f.length : 0; }
  // Maniobras del enemigo según su carácter: astuto = rodeo y retirada fingida; impetuoso = nunca finge; prudente = reserva oculta y vigilar el flanco.
  function iaManiobras(est, b, r, sucesos) {
    const bando = est.bandos[b], e = 1 - b, car = bando.car, peor = r.indexOf(Math.min.apply(null, r));
    if (car === 'prudente') {
      const oculta = bando.reserva.some(i => est.regs[i].oculto);
      if (oculta && ((r[peor] < 0.9 && est.t >= 40) || est.sectores.some(sc => lineaDe(sc, b) <= -1) || est.t >= 100) && bando.mando >= COSTE_RELEVAR) ordenar(est, b, { orden: 'relevar', sector: peor, reserva: true }, sucesos);
      else if (!vigilaActiva(est, b) && bando.mando >= 3) ordenar(est, b, { orden: 'vigilar', sector: peor }, sucesos);
      return;
    }
    if (car !== 'astuto' || bando.mando < COSTES.fingir || est.t < 14 || est.t - (bando.manT == null ? -99 : bando.manT) < 40) return;
    const ops = opcionesRodeo(est, b);
    if (ops.length) {
      let dest = -1; for (let s = 0; s < 3; s++) if (est.sectores[s].filas[e].frente.length && (dest < 0 || r[s] < r[dest])) dest = s;
      if (dest >= 0 && ordenar(est, b, { orden: 'rodear', sector: ops[0].origen, objetivo: dest, reg: ops[0].reg }, sucesos).ok) { bando.manT = est.t; return; }
    }
    let el = -1; for (let s = 0; s < 3; s++) if (candidataFingida(est, b, s, r, true) && (el < 0 || r[s] < r[el])) el = s;
    if (el >= 0 && ordenar(est, b, { orden: 'fingir', sector: el }, sucesos).ok) bando.manT = est.t;
  }
  function candidataFingida(est, b, s, r, estricta) {   // sector donde fingir tiene sentido: nos aprietan, sobra sitio y los vecinos aguantan
    const sec = est.sectores[s]; if (!sec.filas[b].frente.length || lineaDe(sec, b) < -1 || sec.roto[b] || maniobra(est, 'fingida', b, s) || vecinos(s).some(n => maniobra(est, 'fingida', b, n))) return false;
    if (r[s] > (estricta ? 0.9 : 1.05) || (estricta && POSTURAS[sec.posturas[1 - b]].fam !== 'presionar')) return false;
    return vecinos(s).every(n => r[n] >= 0.6 && est.sectores[n].posturas[b] !== 'retirarse' && !est.sectores[n].roto[b]);
  }
  // Decide posturas del bando IA cada 10 s. Sin trampas: mira solo el estado visible (nada de las órdenes del otro).
  function iaDecide(est, b, rand, sucesos) {
    const bando = est.bandos[b], plan = bando.plan || 'centro', e = 1 - b;
    let base = ['aguantar', 'aguantar', 'aguantar'];
    if (plan === 'centro') base = ['aguantar', 'avanzar', 'aguantar'];
    else if (plan === 'alas') base = ['avanzar', 'aguantar', 'avanzar'];
    else if (plan === 'cerro') base = ['aguantar', 'aguantar', 'aguantar'];
    else if (plan === 'emboscar') base = est.t >= 50 ? ['cargar', 'aguantar', 'cargar'] : ['aguantar', 'aguantar', 'aguantar'];
    else if (plan === 'hostigar') base = ['hostigar', 'hostigar', 'hostigar'];
    const r = [0, 1, 2].map(s => ratioSector(est, s, b, ['aguantar', 'aguantar']));
    let peor = 0; for (let s = 1; s < 3; s++) if (r[s] < r[peor]) peor = s;
    bando.mando = Math.max(bando.mando, 0);
    iaManiobras(est, b, r, sucesos);
    const pend = [];
    for (let s = 0; s < 3; s++) {
      let p = base[s]; const f = vivosEnFila(est, s, b, 'frente');
      if (!f.length) { p = 'aguantar'; }
      else if (r[s] > 1.35 && cansadoFrente(est, s, b) < 2) p = plan === 'hostigar' ? 'hostigar' : 'avanzar';
      else if (r[s] < 0.8) p = (r[s] < 0.5 && plan === 'hostigar') ? 'retirarse' : 'aguantar';
      else if (cansadoFrente(est, s, b) >= 2.3) p = 'aguantar';
      if (p === 'cargar' && !f.some(x => x.cls === 'cav' || x.cls === 'ele')) p = 'avanzar';
      pend.push({ orden: p, sector: s });
    }
    if (bando.general && bando.general.vivo && r[peor] < 0.8 && bando.general.sector !== peor) pend.push({ orden: 'general', sector: peor });
    if (r[peor] < 0.75 || (bando.reserva.some(i => !est.regs[i].oculto) && est.t > 100)) pend.push({ orden: 'relevar', sector: peor });
    // primero lo barato, hasta donde llega el mando
    pend.sort((a, c) => (POSTURAS[a.orden] ? POSTURAS[a.orden].coste : COSTES[a.orden]) - (POSTURAS[c.orden] ? POSTURAS[c.orden].coste : COSTES[c.orden]));
    // las posturas gratuitas y las ya activas siempre; el resto según mando
    for (const o of pend) ordenar(est, b, o, sucesos);
    bando.gesto = { texto: textoGesto(est, b), posturas: est.sectores.map(sc => sc.posturas[b]), t: est.t };
  }

  // ---------- pulso ----------
  function quitarDeFilas(est, r) {
    const b = r.bando;
    if (r.lugar === 'reserva') { const i = est.bandos[b].reserva.indexOf(r.id); if (i >= 0) est.bandos[b].reserva.splice(i, 1); return; }
    if (r.sector == null) return; const f = est.sectores[r.sector].filas[b];
    for (const fila of ['frente', 'apoyo']) { const i = f[fila].indexOf(r.id); if (i >= 0) f[fila].splice(i, 1); }
  }
  function entrarRefuerzo(est, b, s, sucesos, avisos) {
    const bando = est.bandos[b]; if (!bando.cola.length) return;
    const total = Object.keys(est.regs).filter(id => est.regs[id].bando === b && ['frente', 'apoyo', 'reserva', 'rodeo', 'marcha'].indexOf(est.regs[id].lugar) >= 0).length;
    if (total >= TOPE_CAMPO) return;
    const sec = est.sectores[s], f = sec.filas[b]; const id = bando.cola.shift(), r = est.regs[id];
    let donde = null;
    if (f.apoyo.length < FILA) donde = 'apoyo'; else if (f.frente.length < sec.cap) donde = 'frente';
    if (!donde) { for (let k = 0; k < 3 && !donde; k++) { const f2 = est.sectores[k].filas[b]; if (f2.apoyo.length < FILA) { donde = 'apoyo'; s = k; } } }
    if (!donde) { bando.cola.unshift(id); return; }
    est.sectores[s].filas[b][donde].push(id); r.lugar = donde; r.sector = s;
    sucesos.push({ t: est.t, tipo: 'refuerzo', bando: b, sector: s, txt: r.nombre + ' entra como refuerzo por el ' + SECTORES[s] });
  }
  function promover(est, s, b) {   // el apoyo sube al frente si falta hueco
    const sec = est.sectores[s], f = sec.filas[b];
    while (f.frente.length < sec.cap && f.apoyo.length) {
      const id = f.apoyo.shift(), r = est.regs[id]; f.frente.push(id); r.lugar = 'frente';
    }
  }
  function sale(est, r, motivo, sucesos, avisos, humano) {
    const b = r.bando, s = r.sector; quitarDeFilas(est, r);
    if (motivo === 'huye') { r.lugar = 'huido'; est.bandos[b].huidos += r.n; } else { r.lugar = 'caido'; est.bandos[b].huidos += 0; }
    const sc = s == null ? 1 : s;
    sucesos.push({ t: est.t, tipo: motivo === 'huye' ? 'huye' : 'cae', bando: b, sector: sc, reg: r.id, txt: r.nombre + (motivo === 'huye' ? ' huye' : ' cae') + ' en el ' + SECTORES[sc] });
    if (motivo === 'huye') {
      avisos.push({ tipo: 'huye', grave: b === humano, bando: b, sector: sc, motivo: r.nombre + ' huye del ' + SECTORES[sc] + (b === humano ? '' : ' (enemigo)') });
      for (const id of est.sectores[sc].filas[b].frente) est.regs[id].accAnimo += 2;   // contagio de miedo
    }
    r.sector = null;
    est.programados.push({ tipo: 'refuerzo', en: est.t + REFUERZO_RETRASO, bando: b, sector: sc });
  }
  const PROGRAMADOS = {
    refuerzo: (est, p, sucesos, avisos) => entrarRefuerzo(est, p.bando, p.sector, sucesos, avisos),
    rodeo: (est, p, sucesos, avisos) => {   // el regimiento rodeado entra por el flanco o la espalda
      const r = est.regs[p.reg]; if (!r || r.lugar !== 'rodeo') return; const b = r.bando, e = 1 - b, sec = est.sectores[p.sector];
      const inter = vigilaActiva(est, e, p.sector);
      if (!entraSector(est, r, p.sector, b)) { const o = est.sectores[p.origen]; if (!entraSector(est, r, p.origen, b)) { est.bandos[b].reserva.push(r.id); r.lugar = 'reserva'; r.sector = null; } return; }
      if (inter) { r.animo = Math.max(r.animo, 1); sucesos.push({ t: est.t, tipo: 'rodeoInterceptado', bando: b, sector: p.sector, reg: r.id, txt: r.nombre + ' topa con la vigilancia enemiga en el ' + SECTORES[p.sector] + ' y llega Vacilante' }); }
      else { r.golpeMul = GOLPE_SORPRESA; r.golpeHasta = est.t + SORPRESA_SEG; sec.flancoT[e] = est.t + FLANCO_RODEO_SEG; sec.espaldaT[e] = est.t + FLANCO_RODEO_SEG; for (const i of sec.filas[e].frente) est.regs[i].accAnimo += 2; sucesos.push({ t: est.t, tipo: 'rodeoLlega', bando: b, sector: p.sector, reg: r.id, txt: '¡' + r.nombre + ' entran por la espalda del ' + SECTORES[p.sector] + '!' }); }
      if (b !== est.humano) avisos.push({ tipo: 'rodeo', grave: true, bando: b, sector: p.sector, motivo: '¡' + r.nombre + ' enemigos entran por la espalda del ' + SECTORES[p.sector] + '!' });
    },
    mover: (est, p, sucesos, avisos) => {
      const r = est.regs[p.reg]; if (!r || r.lugar !== 'marcha') return; const b = r.bando;
      if (!entraSector(est, r, p.sector, b) && !entraSector(est, r, p.origen, b)) { est.bandos[b].reserva.push(r.id); r.lugar = 'reserva'; r.sector = null; return; }
      sucesos.push({ t: est.t, tipo: 'llega', bando: b, sector: r.sector, reg: r.id, txt: r.nombre + ' llega al ' + SECTORES[r.sector] });
    }
  };

  function pulso(estado, semilla) {
    const est = clon(estado), sucesos = [], avisos = [];
    if (est.fin) return { estado: est, sucesos: sucesos, pausa: null };
    const rand = rng32((semilla == null ? est.semilla : semilla) * 2654435761 + est.pulsos * 7919 + 17);
    est.t += DT; est.pulsos++;
    const H = est.humano;
    // programados (refuerzos, rodeos y marchas que llegan)
    const pend = est.programados; est.programados = [];
    for (const p of pend) { if (p.en <= est.t + 1e-9) { const f = PROGRAMADOS[p.tipo]; if (f) f(est, p, sucesos, avisos); } else est.programados.push(p); }
    maniobrasPulso(est, sucesos, avisos);
    // mando
    for (const bando of est.bandos) {
      bando.mandoT += DT; const mx = mandoMax(bando);
      if (bando.mando > mx) bando.mando = mx;
      if (bando.mandoT >= MANDO_SEG) { bando.mandoT -= MANDO_SEG; if (bando.mando < mx) bando.mando++; }
    }
    // el enemigo piensa cada 10 s
    for (let b = 0; b < 2; b++) if (est.bandos[b].ia && est.pulsos % 5 === 0) iaDecide(est, b, rand, sucesos);
    // resolución por sector (los golpes se calculan antes de aplicar bajas)
    const res = [0, 1, 2].map(s => [golpe(est, s, 0), golpe(est, s, 1)]);
    for (let s = 0; s < 3; s++) {
      const sec = est.sectores[s]; const ruido = [0.95 + rand() * 0.1, 0.95 + rand() * 0.1];
      const g = [res[s][0].g * ruido[0], res[s][1].g * ruido[1]];
      // bajas
      for (let b = 0; b < 2; b++) {
        const dano = g[1 - b] * KBAJAS * DT / 2;
        const fr = vivosEnFila(est, s, b, 'frente'), ap = vivosEnFila(est, s, b, 'apoyo');
        const repartir = (lista, total) => { const t = lista.reduce((a, r) => a + r.n, 0); if (t <= 0) return; for (const r of lista) r.n = Math.max(0, r.n - total * r.n / t); };
        if (fr.length) { repartir(fr, dano * (ap.length ? REPARTO_FRENTE : 1)); if (ap.length) repartir(ap, dano * (1 - REPARTO_FRENTE)); } else repartir(ap, dano);
      }
      // quién gana el sector
      const ra = g[0] / Math.max(g[1], 1e-6), hay = [vivosEnFila(est, s, 0, 'frente').length + vivosEnFila(est, s, 0, 'apoyo').length, vivosEnFila(est, s, 1, 'frente').length + vivosEnFila(est, s, 1, 'apoyo').length];
      let ganador = null;
      if (ra > UMBRAL_GANA) ganador = 0; else if (ra < 1 / UMBRAL_GANA) ganador = 1;
      if (ganador === 0 && hay[0] === 0) ganador = null; if (ganador === 1 && hay[1] === 0) ganador = null;
      if (ganador === null) sec.emp *= 0.5; else sec.emp += (ganador === 0 ? 1 : -1) * ((ra > 2 || ra < 0.5) ? 2 : 1);
      if (Math.abs(sec.emp) >= EMPUJE_PASO) {
        const w = sec.emp > 0 ? 0 : 1, l = 1 - w; sec.emp = 0;
        if (maniobra(est, 'fingida', l, s)) { /* cede a propósito: ni línea ni rotura por el empuje */ }
        else if (lineaDe(sec, l) <= -2) {   // pierde otra vez con la línea ya en −2: el sector se rompe
          if (!sec.roto[l]) { sec.roto[l] = true; sucesos.push({ t: est.t, tipo: 'roto', bando: l, sector: s, txt: 'El ' + SECTORES[s] + ' de ' + bandoNombre(est, l) + ' se rompe' }); }
        } else {
          sec.linea += dir(w); sucesos.push({ t: est.t, tipo: 'linea', bando: w, sector: s, txt: cap1(SECTORES[s]) + ': la línea de ' + bandoNombre(est, l) + ' retrocede' });
          for (const r of vivosEnFila(est, s, l, 'frente')) r.accAnimo += 2;
        }
      }
      // ánimo
      for (let b = 0; b < 2; b++) {
        const finge = !!maniobra(est, 'fingida', b, s);
        const perd = !finge && (b === 0 ? g[0] < g[1] * UMBRAL_ANIMO : g[1] < g[0] * UMBRAL_ANIMO) && hay[1 - b] > 0;
        const gen = est.bandos[b].general && est.bandos[b].general.vivo && est.bandos[b].general.sector === s;
        for (const r of vivosEnFila(est, s, b, 'frente')) {
          if (perd) r.accAnimo += 1; else r.accAnimo = Math.max(0, r.accAnimo - 0.25);
          if (r.n < r.n0 * 0.3) r.accAnimo += 0.5;
          if (r.accAnimo >= ANIMO_PASO + (gen ? 1 : 0)) { r.accAnimo = 0; r.animo = Math.min(3, r.animo + 1); if (r.animo < 3) sucesos.push({ t: est.t, tipo: 'animo', bando: b, sector: s, reg: r.id, txt: r.nombre + ': ' + ANIMOS[r.animo] }); }
        }
      }
      // cansancio del frente y descanso en apoyo
      for (let b = 0; b < 2; b++) {
        const P = POSTURAS[sec.posturas[b]], cada = P.fam === 'presionar' ? (sec.posturas[b] === 'cargar' ? FAT_PRESIONA / 2 : FAT_PRESIONA) : P.fam === 'sostener' ? FAT_SOSTIENE : 0;
        for (const r of vivosEnFila(est, s, b, 'frente')) { if (cada > 0) { r.fatT += DT; if (r.fatT >= cada) { r.fatT = 0; r.fat = Math.min(3, r.fat + 1); } } if (r.fat >= 3 && P.fam === 'presionar') { /* no puede presionar: ya lo recoge mulPostura */ } }
        for (const r of vivosEnFila(est, s, b, 'apoyo')) { r.fatT += DT; if (r.fatT >= FAT_APOYO) { r.fatT = 0; if (r.fat > 0) r.fat--; } r.recT += DT; if (r.recT >= ANIMO_RECUPERA && r.animo > 0 && r.animo < 3) { r.recT = 0; r.animo--; } }
      }
      // avisos de carga
      for (let b = 0; b < 2; b++) if (sec.posturas[b] === 'cargar') for (const r of vivosEnFila(est, s, b, 'frente')) {
        if ((r.cls === 'cav' || r.cls === 'ele') && !r.cargando && r.fat < 3 && vivosEnFila(est, s, 1 - b, 'frente').length) {
          r.cargando = true; sucesos.push({ t: est.t, tipo: 'carga', bando: b, sector: s, reg: r.id, txt: '¡' + r.nombre + ' carga en el ' + SECTORES[s] + '!' });
          avisos.push({ tipo: 'carga', grave: false, bando: b, sector: s, motivo: '¡' + r.nombre + ' carga en el ' + SECTORES[s] + (b === H ? '' : ' (enemigo)') + '!' });
        }
      }
    }
    // limpieza: caídos, huidos, ascensos y vacíos
    for (const id of Object.keys(est.regs)) {
      const r = est.regs[id]; if (r.lugar !== 'frente' && r.lugar !== 'apoyo') continue;
      if (r.n < Math.max(2, r.n0 * 0.1)) sale(est, r, 'cae', sucesos, avisos, H);
      else if (r.animo >= 3) sale(est, r, 'huye', sucesos, avisos, H);
    }
    for (let s = 0; s < 3; s++) for (let b = 0; b < 2; b++) {
      promover(est, s, b); const sec = est.sectores[s], f = sec.filas[b];
      const hayEnemigo = est.sectores[s].filas[1 - b].frente.length + est.sectores[s].filas[1 - b].apoyo.length > 0;
      if (!f.frente.length && !f.apoyo.length && hayEnemigo) { sec.vacio[b]++; if (sec.vacio[b] >= 3 && !sec.roto[b] && !est.programados.some(p => p.tipo === 'refuerzo' && p.bando === b && p.sector === s)) { sec.roto[b] = true; sucesos.push({ t: est.t, tipo: 'roto', bando: b, sector: s, txt: 'El ' + SECTORES[s] + ' de ' + bandoNombre(est, b) + ' se rompe: sin tropas' }); } } else sec.vacio[b] = 0;
    }
    // general
    for (let b = 0; b < 2; b++) {
      const bando = est.bandos[b], g = bando.general; if (!g || !g.vivo) continue; const sec = est.sectores[g.sector], l = lineaDe(sec, b);
      const r = ratioSector(est, g.sector, b);
      if (l <= -2 && r < 0.7 && rand() < 0.04) { g.hp--; if (g.hp <= 0) { g.vivo = false; sucesos.push({ t: est.t, tipo: 'generalCae', bando: b, sector: g.sector, txt: g.n + ' cae en el ' + SECTORES[g.sector] }); bando.mando = Math.min(bando.mando, MANDO_SIN); } }
      const peligro = g.vivo && (l <= -2 || (l <= -1 && r < 0.5));
      if (peligro && !g.alerta) { g.alerta = true; avisos.push({ tipo: 'general', grave: b === H, bando: b, sector: g.sector, motivo: g.n + (b === H ? ' está en peligro' : ' (enemigo) está en peligro') + ' en el ' + SECTORES[g.sector] }); }
      if (!peligro && l >= 0) g.alerta = false;
    }
    // avisos de flanco abierto y de reserva enemiga
    for (let s = 0; s < 3; s++) for (let b = 0; b < 2; b++) {
      const k = 'f' + s + b, ab = flancoAbierto(est, s, b) && (est.sectores[s].filas[b].frente.length > 0);
      if (ab && !est.avisosVistos[k]) { est.avisosVistos[k] = true; avisos.push({ tipo: 'flanco', grave: b === H, bando: b, sector: s, motivo: b === H ? 'Flanco abierto: el ' + SECTORES[s] + ' queda al descubierto' : 'Flanco enemigo abierto en el ' + SECTORES[s] }); }
      if (!ab) delete est.avisosVistos[k];
    }
    for (const a of est.avisosPend) avisos.push(a); est.avisosPend = [];   // p. ej. la reserva enemiga que entra
    // fin
    finDeBatalla(est, sucesos);
    est.sucesosRecientes = sucesos.length;
    let pausa = null;
    if (est.fin) pausa = { motivo: 'Fin de la batalla: ' + est.fin.motivo, tipo: 'fin', grave: true };
    else if (est.ajustes.pausas !== 'ninguna') {
      const lista = avisos.filter(a => est.ajustes.pausas === 'todas' || a.grave);
      const orden = { huye: 0, general: 1, rodeo: 1.5, flanco: 2, reserva: 3, carga: 4 };
      lista.sort((a, c) => (c.grave - a.grave) || (orden[a.tipo] - orden[c.tipo]));
      if (lista.length) pausa = { motivo: lista[0].motivo, tipo: lista[0].tipo, grave: !!lista[0].grave, sector: lista[0].sector, bando: lista[0].bando };
    }
    return { estado: est, sucesos: sucesos, pausa: pausa };
  }
  // el aviso de reserva de la IA sale de iaDecide (sucesos propios); pulso los revisa al terminar
  function hombresVivos(est, b) { let n = 0; for (const id of Object.keys(est.regs)) { const r = est.regs[id]; if (r.bando === b && ['frente', 'apoyo', 'reserva', 'cola', 'rodeo', 'marcha'].indexOf(r.lugar) >= 0) n += r.n; } return n; }
  function finDeBatalla(est, sucesos) {
    const rotos = [0, 1].map(b => est.sectores.filter(sc => sc.roto[b]).length);
    let perdedor = null, motivo = '';
    for (let b = 0; b < 2; b++) if (rotos[b] >= 2) { perdedor = b; motivo = 'dos sectores rotos'; }
    if (perdedor === null) for (let b = 0; b < 2; b++) {
      const bando = est.bandos[b], g = bando.general;
      if (g && !g.vivo) { const mios = Object.keys(est.regs).map(id => est.regs[id]).filter(r => r.bando === b && (r.lugar === 'frente' || r.lugar === 'apoyo')); const med = mios.length ? mios.reduce((a, r) => a + r.animo, 0) / mios.length : 3; if (med >= 1) { perdedor = b; motivo = 'cae el general con la tropa desmoralizada'; } }
    }
    if (perdedor === null && est.objetivo.tipo === 'resistir' && est.t >= est.objetivo.seg) { est.fin = { ganador: est.humano, motivo: 'resistió el tiempo pedido', t: est.t }; }
    if (perdedor === null && !est.fin && est.t >= TOPE_SEG) { const a = hombresVivos(est, 0), c = hombresVivos(est, 1); est.fin = { ganador: c > a ? 1 : 0, motivo: 'tope de tiempo: gana quien conserva más hombres', t: est.t }; }
    if (perdedor !== null && !est.fin) est.fin = { ganador: 1 - perdedor, motivo: motivo, t: est.t };
    if (est.fin) {
      est.fin.resultado = [0, 1].map(b => { const bando = est.bandos[b], vivos = hombresVivos(est, b); return { bando: b, hombres0: bando.n0, vivos: Math.round(vivos), huidos: Math.round(bando.huidos), bajas: Math.max(0, Math.round(bando.n0 - vivos - bando.huidos)), general: bando.general ? bando.general.vivo : null }; });
      sucesos.push({ t: est.t, tipo: 'fin', bando: est.fin.ganador, sector: 1, txt: 'Gana ' + bandoNombre(est, est.fin.ganador) + ': ' + est.fin.motivo });
    }
  }

  // ---------- consejo: tres tribunos, tres planes ----------
  function resumenSector(est, b, s) { const sec = est.sectores[s]; const g0 = golpe(est, s, b, ['aguantar', 'aguantar']).g, g1 = golpe(est, s, 1 - b, ['aguantar', 'aguantar']).g; return { s: s, r: g0 / Math.max(g1, 1), cans: cansadoFrente(est, s, b), linea: lineaDe(sec, b), flancoEn: flancoAbierto(est, s, 1 - b), flancoMio: flancoAbierto(est, s, b) }; }
  function tieneTiradores(est, s, b) { return est.sectores[s].filas[b].frente.concat(est.sectores[s].filas[b].apoyo).some(id => est.regs[id].cls === 'rng'); }
  function tieneCab(est, s, b) { return est.sectores[s].filas[b].frente.some(id => est.regs[id].cls === 'cav' || est.regs[id].cls === 'ele'); }
  function evaluar(est, b, posturas, clave) {   // razón de fuerzas en el sector clave con el plan, contra el gesto anunciado
    const post = posturas; const sec = est.sectores[clave]; const ps = [post[clave], sec.posturas[1 - b]]; const pp = b === 0 ? [ps[0], ps[1]] : [ps[1], ps[0]];
    const a = golpe(est, clave, b, pp).g, c = golpe(est, clave, 1 - b, pp).g; return a / Math.max(c, 1);
  }
  function consejo(estado, bando) {
    const est = estado, b = bando == null ? est.humano : bando, e = 1 - b, bd = est.bandos[b];
    const res = [0, 1, 2].map(s => resumenSector(est, b, s));
    const orden = res.slice().sort((x, y) => x.r - y.r), debil = orden[0], fuerte = orden[2];
    const tri = bd.tribunos, quien = car => tri.find(t => t.car === car) || { n: 'Tribuno', car: car };
    const reservaB = bd.reserva.length > 0;
    const planes = [];
    const mk = (id, titulo, posturas, ordenesExtra, clave, motivo, conManiobra) => {
      const ordenes = []; let gasto = 0;
      for (let s = 0; s < 3; s++) { const igual = est.sectores[s].posturas[b] === posturas[s]; ordenes.push({ orden: posturas[s], sector: s }); gasto += igual ? 0 : POSTURAS[posturas[s]].coste; }
      for (const o of ordenesExtra) { ordenes.push(o); gasto += COSTES[o.orden] == null ? 1 : COSTES[o.orden]; }
      const r = evaluar(est, b, posturas, clave);
      const flanco = (res[clave].flancoEn && !res[clave].flancoMio) || !!conManiobra;
      let etiqueta = 'Dudoso';
      if (r > 1 + UMBRAL_ETIQUETA || (flanco && r >= 1 - UMBRAL_ETIQUETA)) etiqueta = 'Favorable'; else if (r < 1 - UMBRAL_ETIQUETA) etiqueta = 'Arriesgado';
      planes.push({ id: id, tribuno: quien(id === 'prudente' ? 'prudente' : id === 'agresivo' ? 'agresivo' : 'astuto'), titulo: titulo, motivo: motivo, etiqueta: etiqueta, posturas: posturas, ordenes: ordenes, gasto: gasto, sectorClave: clave, razon: Math.round(r * 100) / 100, factible: gasto <= bd.mando });
    };
    // prudente: sostiene, refuerza el sector más débil, solo presiona donde sobra fuerza
    {
      const p = res.map(x => (x.r > 1.4 && x.cans < 2 ? 'avanzar' : 'aguantar')); const extra = [];
      if (bd.reserva.some(i => !est.regs[i].oculto) && est.t < 60) extra.push({ orden: 'reservaOculta' });   // el prudente esconde la reserva
      if (debil.cans >= 1.5 || (debil.r < 0.8 && (reservaB || est.sectores[debil.s].filas[b].apoyo.length))) extra.push({ orden: 'relevar', sector: debil.s });
      mk('prudente', 'Cerrar filas y aguantar', p, extra, debil.s, 'Refuerza el ' + SECTORES[debil.s] + (debil.cans >= 1.5 ? ', que está cansado,' : ', el más débil,') + ' y no arriesga donde no sobra fuerza.');
    }
    // agresivo: carga o avanza en lo más fuerte y no cede
    {
      const clave = fuerte.s; const p = res.map(x => (x.cans >= 2.3 ? 'aguantar' : x.r > 0.85 ? 'avanzar' : 'aguantar'));
      if (p[clave] === 'avanzar' && tieneCab(est, clave, b)) p[clave] = 'cargar';
      mk('agresivo', 'Atacar con todo', p, [], clave, 'Carga por el ' + SECTORES[clave] + ', donde tenemos más fuerza, antes de que el enemigo se reorganice.');
    }
    // astuto: golpea donde el enemigo es más débil o tiene el flanco abierto, hostiga con tiradores y mueve al general
    {
      let objetivo = res.slice().sort((x, y) => (y.r + (y.flancoEn ? 0.5 : 0)) - (x.r + (x.flancoEn ? 0.5 : 0)))[0].s;
      if (objetivo === fuerte.s && res[objetivo].r < 1 && res[1].r >= res[objetivo].r - 0.05) objetivo = 1;
      const p = res.map(x => 'aguantar'); p[objetivo] = 'avanzar';
      for (let s = 0; s < 3; s++) if (s !== objetivo && tieneTiradores(est, s, b) && res[s].cans < 2.3) p[s] = 'hostigar';
      const extra = [], r2 = res.map(x => x.r), mando = bd.mando; let man = null, man2 = null, titulo = 'Golpear donde duele', conMan = false, clave = objetivo, mot = null;
      const ops = opcionesRodeo(est, b);
      const rodeo = () => {   // rodear por el vado, el bosque o el cerro hacia el sector enemigo más flojo
        if (!ops.length) return; let dest = -1; for (let s = 0; s < 3; s++) if (est.sectores[s].filas[e].frente.length && (dest < 0 || r2[s] < r2[dest])) dest = s;
        if (dest >= 0) { man = { orden: 'rodear', sector: ops[0].origen, objetivo: dest, reg: ops[0].reg }; titulo = 'Rodear por ' + ops[0].por; clave = dest; mot = 'Manda un regimiento del ' + SECTORES[ops[0].origen] + ' por ' + ops[0].por + ' para entrar por la espalda del ' + SECTORES[dest] + ' en unos ' + RODEO_SEG + ' s; si el enemigo vigila el flanco, lo intercepta y llega Vacilante.'; }
      };
      const finge = tope => {   // retirada fingida en el sector más apretado (y en la otra ala si se puede pagar)
        let el = -1; for (let s = 0; s < 3; s++) if (r2[s] < tope && candidataFingida(est, b, s, r2) && (el < 0 || r2[s] < r2[el])) el = s; if (el < 0) return;
        man = { orden: 'fingir', sector: el }; titulo = 'Retirada fingida'; clave = el; mot = 'Cede el ' + SECTORES[el] + ' dos pasos a propósito, sin perder ánimo: si el enemigo entra y los vecinos aguantan, queda en bolsa; si un vecino cede, se rompe de verdad.';
        const otro = el === 1 ? -1 : 2 - el; if (otro >= 0 && mando >= 2 * COSTES.fingir && r2[otro] < tope && candidataFingida(est, b, otro, r2)) { man2 = { orden: 'fingir', sector: otro }; titulo = 'Retirada fingida en las dos alas'; mot = 'Ceden las dos alas dos pasos a propósito, sin perder ánimo, y el centro aguanta: el enemigo que entre queda en dos bolsas; si el centro cede, se rompe de verdad.'; }
      };
      finge(0.9); if (!man) rodeo(); if (!man) finge(1.05);   // si nos ganan, fingir; si no, rodear; y si no hay terreno, fingir igualmente
      if (man) { conMan = true; for (let s = 0; s < 3; s++) if (man.orden === 'fingir' && (s === man.sector || (man2 && s === man2.sector))) p[s] = 'aguantar'; }
      let gp = 0; for (let s = 0; s < 3; s++) gp += est.sectores[s].posturas[b] === p[s] ? 0 : POSTURAS[p[s]].coste;
      if (man) { const cm = COSTES[man.orden] + (man2 ? COSTES.fingir : 0); while (gp + cm > mando) { let q = -1; for (let s = 0; s < 3; s++) if (est.sectores[s].posturas[b] !== p[s] && p[s] !== 'aguantar' && (q < 0 || s === 0)) q = s; if (q < 0) break; gp -= POSTURAS[p[q]].coste; p[q] = 'aguantar'; gp += est.sectores[q].posturas[b] === 'aguantar' ? 0 : POSTURAS.aguantar.coste; } extra.push(man); if (man2) extra.push(man2); gp += cm; }
      if (bd.general && bd.general.vivo && bd.general.sector !== objetivo && gp + COSTE_GENERAL <= mando) { extra.push({ orden: 'general', sector: objetivo }); gp += COSTE_GENERAL; }
      if (reservaB && gp + COSTE_RELEVAR <= mando) extra.push({ orden: 'relevar', sector: objetivo });
      mk('astuto', titulo, p, extra, clave, mot || ('Concentra el golpe en el ' + SECTORES[objetivo] + (res[objetivo].flancoEn ? ', cuyo flanco está abierto,' : ', donde el enemigo es más flojo,') + ' y hostiga con tiradores en el resto.'), conMan);
    }
    return { bando: b, t: est.t, mando: bd.mando, gesto: est.bandos[e].gesto ? est.bandos[e].gesto.texto : (est.bandos[e].nombre + ' espera.'), sectores: res, planes: planes, reservaEnemiga: reservaVisible(est, e) };
  }

  const Batalla2 = { crear: crear, consejo: consejo, aplicar: aplicar, pulso: pulso,
    // ayudas para la pantalla y las pruebas
    POSTURAS: POSTURAS, ANIMOS: ANIMOS, SECTORES: SECTORES, PLANES: PLANES, DT: DT, TOPE_CAMPO: TOPE_CAMPO, MANDO_SEG: MANDO_SEG,
    COSTES: COSTES, golpe: golpe, hombres: hombresVivos, lineaDe: lineaDe, reservaVisible: reservaVisible, opcionesRodeo: opcionesRodeo };
  root.Batalla2 = Batalla2;
  if (typeof module !== 'undefined') module.exports = Batalla2;
})(typeof window !== 'undefined' ? window : globalThis);
