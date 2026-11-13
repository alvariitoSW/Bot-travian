/* AQVILA — C3 diplomacia sencilla: alianzas (foedus), tributos e IA que construye. Lógica pura (corre en Node), sin pantalla.
   Datos propios del módulo (no en data.js). Todas las cifras son licencia de juego; ver gobierno/historia/C3-diplomacia.md.
   Estado: s.dip = { [facción]: { estado: 'alianza'|'tributo', desde, hasta? } }  ·  s.dipConq = { [facción]: mes de la última ciudad que Roma le conquistó } */
(function (root) {
  'use strict';
  const D = root.DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const DIP = {
    COSTE_ALIANZA: 150,        // denarios (licencia de juego)
    COMERCIO_ALIADO: 20,       // oro/mes por aliado
    TRIBUTO_POR_CIUDAD: 25,    // oro/mes por cada ciudad que le quede al tributario
    TRIBUTO_MAX_CIUDADES: 2,
    MESES_SIN_CONQUISTA: 24,
    FUERZA_MIN: 0.5,           // fuerza del aliado >= 0,5 x la de Roma
    MESES_MURALLA: 36,         // la IA sube 1 nivel de muralla cada ~3 años
    TOPE_MURALLA_EXTRA: 2,     // tope = w + 2
    ELEGIBLES: { siracusa: { hasta: 263 }, aquea: {}, etruscos: {}, iberos: {} }   // Hierón II pacta con Roma en 263 (Polibio 1.16.9; Diodoro 23.4)
  };
  const dip = s => (s.dip && typeof s.dip === 'object') ? s.dip : (s.dip = {});
  DIP.migrar = s => { if (!s.dip || typeof s.dip !== 'object') s.dip = {}; if (!s.dipConq || typeof s.dipConq !== 'object') s.dipConq = {}; return s; };
  const ciudadesDe = (s, f) => Object.keys(s.cities).filter(id => s.cities[id].owner === f);
  const hombres = (s, f) => { let n = 0; for (const id of ciudadesDe(s, f)) for (const k in s.cities[id].units) n += s.cities[id].units[k]; return n; };
  DIP.fuerza = hombres;
  DIP.estado = (s, f) => (s.dip && s.dip[f] && s.dip[f].estado) || null;
  DIP.pacifica = (s, f) => !!DIP.estado(s, f);   // aliado o tributario: no lanza incursiones
  /* motivo por el que NO se puede (o null si se puede) */
  DIP.motivoAlianza = (s, f, G) => {
    DIP.migrar(s); const e = DIP.ELEGIBLES[f], anio = G.yearOf(s.t);
    if (!e) return 'Esta facción no pacta foedus con Roma.';
    if (DIP.estado(s, f) === 'alianza') return 'Ya es aliada.';
    if (DIP.estado(s, f) === 'tributo') return 'Paga tributo: no es aliada.';
    if (!ciudadesDe(s, f).length) return 'Ya no le queda ciudad.';
    if (e.hasta && anio > e.hasta) return 'Ya pasó su momento (' + (-e.hasta) + ' a. C.).';
    const c = s.dipConq[f];
    if (c !== undefined && s.t - c < DIP.MESES_SIN_CONQUISTA) return 'Roma le tomó una ciudad hace menos de 2 años.';
    if (hombres(s, f) < DIP.FUERZA_MIN * hombres(s, 'roma')) return 'Es demasiado débil: no ve provecho en pactar.';
    if (G.disponible && G.disponible('oro') < DIP.COSTE_ALIANZA) return 'Faltan ' + DIP.COSTE_ALIANZA + ' denarios.';
    return null;
  };
  DIP.proponerAlianza = (s, f, G, gasta) => {
    const m = DIP.motivoAlianza(s, f, G); if (m) return { ok: false, motivo: m };
    gasta('oro', DIP.COSTE_ALIANZA); dip(s)[f] = { estado: 'alianza', desde: s.t };
    return { ok: true };
  };
  DIP.motivoTributo = (s, f) => {
    DIP.migrar(s); const n = ciudadesDe(s, f).length;
    if (f === 'roma' || !s.cities || !D.FACTIONS[f]) return 'No es una facción rival.';
    if (DIP.estado(s, f) === 'alianza') return 'Es aliada.';
    if (DIP.estado(s, f) === 'tributo') return 'Ya paga tributo.';
    if (n === 0) return 'Ya no le queda ciudad.';
    if (n > DIP.TRIBUTO_MAX_CIUDADES) return 'Aún tiene ' + n + ' ciudades: solo se impone a quien conserve ' + DIP.TRIBUTO_MAX_CIUDADES + ' o menos.';
    return null;
  };
  DIP.imponerTributo = (s, f) => {
    const m = DIP.motivoTributo(s, f); if (m) return { ok: false, motivo: m };
    dip(s)[f] = { estado: 'tributo', desde: s.t }; return { ok: true, mensual: DIP.tributoMes(s, f) };
  };
  DIP.tributoMes = (s, f) => DIP.TRIBUTO_POR_CIUDAD * ciudadesDe(s, f).length;
  /* ingreso de oro de un mes (aliados + tributos); limpia a quien ya no tenga ciudades */
  DIP.ingresoMes = s => {
    if (!s.dip) return 0; let o = 0;
    for (const f of Object.keys(s.dip)) {
      const n = ciudadesDe(s, f).length; if (!n) { delete s.dip[f]; continue; }
      o += s.dip[f].estado === 'alianza' ? DIP.COMERCIO_ALIADO : DIP.tributoMes(s, f);
    }
    return o;
  };
  DIP.conquista = (s, f) => { DIP.migrar(s); s.dipConq[f] = s.t; };
  /* Roma envía tropas contra una ciudad: 'alianza' = hay que romperla antes (la UI pide confirmación); el tributo se anula solo */
  DIP.alAtacar = (s, id) => {
    const c = s.cities[id]; const e = c && DIP.estado(s, c.owner); if (!e) return null;
    if (e === 'tributo') { delete s.dip[c.owner]; return 'tributo'; }
    return 'alianza';
  };
  DIP.romper = (s, f) => { if (s.dip && s.dip[f]) { delete s.dip[f]; return true; } return false; };
  /* IA que construye: +1 de muralla cada MESES_MURALLA hasta w+2 (y guarnición +6 %), solo si la facción conserva >= 2 ciudades. Devuelve true si construyó */
  DIP.construye = (s, id) => {
    const c = s.cities[id], d = D.CITIES[id]; if (!c || c.owner === 'roma' || !d) return false;
    if (ciudadesDe(s, c.owner).length < 2) return false;
    if (c.murT === undefined) { c.murT = s.t; return false; }
    const tope = (c.w || d.w) + DIP.TOPE_MURALLA_EXTRA;
    if (s.t - c.murT < DIP.MESES_MURALLA || (c.b.muralla || 0) >= tope) return false;
    c.murT = s.t; c.b.muralla = (c.b.muralla || 0) + 1;
    for (const k in c.units) c.units[k] = Math.ceil(c.units[k] * 1.06);
    return true;
  };
  if (typeof module !== 'undefined') module.exports = DIP; else root.DIPLOMACIA = DIP;
})(typeof window !== 'undefined' ? window : globalThis);
