/* AQVILA — MN3: el gobernador. Lógica pura (corre en Node), sin pantalla. No llama a game.js: el juego o el bot pasan `ayuda` y `hacer`.
   Lleva solo una ciudad de la que el jugador se desentiende: cada estación calma revueltas, levanta lo que falta y encarga a los ministros.
   Solo escribe en s.gobernador = { v:1, ciudades:{cid:true}, informes:{cid:{mes, lineas:[{i,texto,ok}]}} }.
   NOTA HISTÓRICA: en la República no había «gobernador» de ciudad. Es LICENCIA DE JUEGO. Lo más cercano es el praefectus
   (el prefecto que Roma enviaba a gobernar las ciudades de Campania, sin magistrados propios; Livio 9.20, 26.16). */
(function (root) {
  'use strict';
  const D = root.DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
  const GOB = {};
  GOB.LICENCIA = 'Licencia de juego: en la República no había «gobernador» de ciudad; lo más cercano era el praefectus que Roma enviaba a Campania (Livio 9.20).';

  /* COPIA de necesidades.js (módulo ESM que no se puede cargar aquí). Si cambia allí, cambia aquí; la prueba lo comprueba. */
  const NEC = [['alimento', 'agricultura'], ['agua', 'infra'], ['limpieza', 'infra'], ['salud', 'infra'], ['trabajo', 'artesania'], ['cultura', 'ciencia'], ['culto', 'culto'], ['orden', 'ejercito']];
  const SERV = {
    fuente: { cubre: ['agua'], alcance: 28 }, cloaca: { cubre: ['limpieza'], alcance: 56 }, termas: { cubre: ['limpieza', 'salud'], alcance: 56 },
    medico: { cubre: ['salud'], alcance: 56 }, escuela: { cubre: ['cultura'], alcance: 56 }, taller: { cubre: ['trabajo'], alcance: 56 },
    templo: { cubre: ['culto'], alcance: 84 }, mercado: { cubre: ['alimento', 'trabajo'], alcance: 84 }, guardia: { cubre: ['orden'], alcance: 84 },
    granero: { cubre: ['alimento'], alcance: 126 }, teatro: { cubre: ['culto', 'cultura'], alcance: 126 }
  };
  const UMBRAL = { cubierta: 0.8 };
  const REMEDIOS = ['tropas', 'grano', 'juegos'];
  GOB.COPIA = { NEC, SERV, UMBRAL, REMEDIOS };

  /* COPIA de M.DATOS de ministros.js: edificios de D.BUILD que cada ministro admite en un encargo de nivel. La prueba la compara. */
  const MIN_NIVEL = { ejercito: ['cuartel', 'establo', 'herreria', 'muralla'], infra: [], agricultura: ['granja'], mineria: ['cantera', 'mina', 'aserradero'], artesania: ['mercado', 'puerto'], culto: ['templo'] };
  GOB.COPIA.MIN_NIVEL = MIN_NIVEL;
  const ORDEN_NEC = NEC.map(x => x[0]);
  const MINISTRO = {}; NEC.forEach(x => { MINISTRO[x[0]] = x[1]; });
  const PESO = { agua: 3, alimento: 3, orden: 3, salud: 2, limpieza: 2 };
  const MINISTROS = ['ejercito', 'ciencia', 'infra', 'hacienda', 'agricultura', 'mineria', 'artesania', 'culto'];
  const AREA = { ejercito: 'ejército', ciencia: 'ciencia', infra: 'infraestructura', hacienda: 'hacienda', agricultura: 'agricultura', mineria: 'minería', artesania: 'artesanía', culto: 'culto' };
  const FALTA = { alimento: 'comida', agua: 'agua', limpieza: 'limpieza', salud: 'salud', trabajo: 'trabajo', cultura: 'cultura', culto: 'culto', orden: 'orden' };
  const ART = { fuente: 'una fuente', cloaca: 'una cloaca', termas: 'unos baños', medico: 'una tienda del médico', escuela: 'una escuela', taller: 'un taller', templo: 'un templo', mercado: 'un mercado', granero: 'un granero', teatro: 'un teatro', cuartel: 'un cuartel', granja: 'una granja' };
  const BOT_NO = ['herreria', 'escuela', 'muralla', 'viviendas', 'foro'];
  const MAXL = () => (D && D.MAX_LVL) || 5;
  const enBuild = t => !!(D && D.BUILD && D.BUILD[t]);
  const obj = x => x && typeof x === 'object' && !Array.isArray(x);
  const fn = (a, k, def) => (a && typeof a[k] === 'function') ? a[k] : () => def;

  GOB.migrar = s => {
    if (!obj(s.gobernador)) s.gobernador = {};
    const g = s.gobernador; g.v = 1;
    if (!obj(g.ciudades)) g.ciudades = {};
    if (!obj(g.informes)) g.informes = {};
    return s;
  };
  GOB.poner = (s, cid, si) => { GOB.migrar(s); if (si) s.gobernador.ciudades[cid] = true; else delete s.gobernador.ciudades[cid]; return s; };
  GOB.activo = (s, cid) => { GOB.migrar(s); return s.gobernador.ciudades[cid] === true; };
  GOB.ciudades = s => { GOB.migrar(s); return Object.keys(s.gobernador.ciudades).filter(id => s.gobernador.ciudades[id] && s.cities && s.cities[id] && s.cities[id].owner === 'roma'); };

  GOB.vista = (s, cid, ayuda) => {
    const c = (s.cities && s.cities[cid]) || {};
    const enc = (s.ministros && s.ministros.encargos) || {};
    const prod = fn(ayuda, 'prod', {})() || {};
    return {
      cid, nombre: (D && D.CITIES && D.CITIES[cid] && D.CITIES[cid].n) || cid, mes: Math.floor((s.t || 0) + 1e-9),
      b: Object.assign({}, c.b || {}),
      barrios: (fn(ayuda, 'barrios', [])(cid) || []).map(b => ({ i: b.i, nombre: b.nombre || ('Barrio ' + b.i), casas: b.casas || 0, cob: Object.assign({}, b.cob || {}), mem: { revuelta: !!(b.mem && b.mem.revuelta), desc: (b.mem && b.mem.desc) || 0, mal: Object.assign({}, (b.mem && b.mem.mal) || {}) } })),
      huecos: Math.max(0, fn(ayuda, 'huecosLibres', 0)(cid) | 0),
      grano: typeof prod.grano === 'number' ? prod.grano : null,
      enObra: (fn(ayuda, 'obras', [])(cid) || []).slice(),
      libres: MINISTROS.filter(m => !enc[m])
    };
  };

  /* Edificios candidatos para cubrir una necesidad, del de menor alcance al de mayor. Orden: el cuartel; el resto, por SERV. */
  const candidatos = nec => {
    if (nec === 'orden') return ['cuartel'];
    const l = Object.keys(SERV).filter(t => SERV[t].cubre.includes(nec) && t !== 'guardia');
    return l.map((t, k) => ({ t, k })).sort((a, b) => SERV[a.t].alcance - SERV[b.t].alcance || a.k - b.k).map(x => x.t);
  };

  GOB.decidir = v => {
    const r = { calmar: [], obras: [], encargos: [], faltas: [] };
    const barrios = v.barrios || [];
    barrios.forEach(b => { if (b.mem && b.mem.revuelta) r.calmar.push({ barrio: b.i, remedios: REMEDIOS.slice() }); });
    // (2) faltas
    NEC.forEach(([id]) => {
      let def = 0, n = 0;
      let peor = null, dPeor = 0;
      barrios.forEach(b => { const f = b.cob && typeof b.cob[id] === 'number' ? b.cob[id] : 1; if (f < UMBRAL.cubierta) { const d = (b.casas || 0) * (1 - f); def += d; n++; if (d > dPeor) { dPeor = d; peor = b.i; } } });
      if (def > 0) r.faltas.push({ necesidad: id, peso: Math.round((PESO[id] || 1) * def * 100) / 100, barrios: n, barrio: peor });   // barrio: el que más lo necesita (el juego pone la obra cerca)
    });
    r.faltas.sort((a, b) => b.peso - a.peso || ORDEN_NEC.indexOf(a.necesidad) - ORDEN_NEC.indexOf(b.necesidad));
    let huecos = v.huecos || 0;
    const niv = Object.assign({}, v.b || {});
    const libres = (v.libres || []).slice();
    const enObra = v.enObra || [];
    const usados = {};
    enObra.forEach(t => { usados[t] = true; });
    const nivel = t => niv[t] || 0;
    const poner = (tipo, necesidad, barrio, porque) => { r.obras.push({ tipo, necesidad, barrio, porque }); huecos--; niv[tipo] = nivel(tipo) + 1; };
    const texto = f => (f.necesidad === 'alimento' ? 'faltaba comida' : 'faltaba ' + FALTA[f.necesidad]) + (f.barrios > 0 ? ' en ' + f.barrios + (f.barrios === 1 ? ' barrio' : ' barrios') : '');
    // (3) grano bajo: primero la granja
    let granjaEncargo = false;
    if (v.grano !== null && v.grano !== undefined && v.grano < 5 && enBuild('granja') && nivel('granja') < MAXL() && !enObra.includes('granja')) {
      if (huecos > 0) { poner('granja', 'alimento', null, 'falta comida'); usados.granja = true; } else granjaEncargo = true;
    }
    // (4) servicios que cubren cada falta
    const sinHueco = [];
    r.faltas.forEach(f => {
      if (huecos <= 0) { sinHueco.push(f); return; }
      const t = candidatos(f.necesidad).find(x => !usados[x]);
      if (!t) return;
      usados[t] = true; poner(t, f.necesidad, f.barrio, texto(f));
    });
    // (5) lo que no cupo, a su ministro
    const ocupa = {};
    const encargar = (necesidad, b, porque) => {
      const mid = MINISTRO[necesidad];
      if (!libres.includes(mid) || ocupa[mid] || usados[b] || !(MIN_NIVEL[mid] || []).includes(b) || !enBuild(b) || nivel(b) >= MAXL()) return;
      ocupa[mid] = true; r.encargos.push({ mid, e: { tipo: 'nivel', ciudad: v.cid, b, objetivo: nivel(b) + 1, libre: true, necesidad } });
    };
    if (granjaEncargo) encargar('alimento', 'granja');
    sinHueco.forEach(f => { const l = f.necesidad === 'alimento' ? ['granja'].concat(candidatos('alimento')) : candidatos(f.necesidad); const b = l.find(x => enBuild(x) && nivel(x) < MAXL()); if (b) encargar(f.necesidad, b); });
    // (6) huecos que sobran: la regla del bot de siempre
    while (huecos > 0) {
      const ok = Object.keys(D.BUILD).filter(t => !BOT_NO.includes(t) && !enObra.includes(t) && nivel(t) < MAXL());
      if (!ok.length) break;
      let t;
      if (v.grano !== null && v.grano !== undefined && v.grano < 25 && ok.includes('granja')) t = 'granja';
      else { t = ok[0]; ok.forEach(x => { if (nivel(x) < nivel(t)) t = x; }); }
      poner(t, null, null, t === 'granja' && v.grano !== null && v.grano < 25 ? 'falta comida' : 'para crecer');
    }
    return r;
  };

  const nombreB = t => (D.BUILD[t] && D.BUILD[t].n) || t;
  const art = t => ART[t] || ('un ' + String(nombreB(t)).toLowerCase());
  const nombreBarrio = (v, i) => { const b = (v.barrios || []).find(x => x.i === i); const n = (b && b.nombre) || ('Barrio ' + i); return /^barrio\b/i.test(n) ? n : 'barrio ' + n; };
  const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);

  GOB.estacion = (s, cid, mes, ayuda, hacer) => {
    GOB.migrar(s);
    hacer = hacer || {};
    const v = GOB.vista(s, cid, ayuda), d = GOB.decidir(v), L = [];
    const add = (i, texto, ok) => { if (L.length < 6) L.push({ i, texto, ok: !!ok }); };
    d.calmar.forEach(c => {
      const n = nombreBarrio(v, c.barrio); let hecho = null;
      for (const rem of c.remedios) { const x = hacer.calmar ? hacer.calmar(cid, c.barrio, rem) : null; if (x && x.ok) { hecho = rem; break; } }
      if (hecho) add('🕊️', 'Calmó el ' + n + ' con ' + hecho + '.', true); else add('⚠️', 'No pudo calmar el ' + n + '.', false);
    });
    d.obras.forEach(o => {
      const x = hacer.obra ? hacer.obra(cid, o.tipo, o) : null;
      if (x && x.ok) add('🏗️', 'Levantó ' + art(o.tipo) + ': ' + o.porque + '.', true);
      else add('⚠️', 'No pudo levantar ' + art(o.tipo) + ': ' + ((x && x.motivo) || 'Sin motivo') + '.', false);
    });
    d.encargos.forEach(en => {
      const x = hacer.encargar ? hacer.encargar(en.mid, en.e) : null;
      if (x && x.ok) add('📜', 'Encargó al ministro de ' + AREA[en.mid] + ': ' + nombreB(en.e.b) + ' a nivel ' + en.e.objetivo + '.', true);
      else add('⚠️', 'No pudo encargar al ministro de ' + AREA[en.mid] + ' (' + nombreB(en.e.b) + ' a nivel ' + en.e.objetivo + '): ' + ((x && x.motivo) || 'Sin motivo') + '.', false);
    });
    if (!L.length) add('✅', 'Todo en orden: no hizo falta nada.', true);
    return (s.gobernador.informes[cid] = { mes, lineas: L });
  };
  GOB.informe = (s, cid) => { GOB.migrar(s); return s.gobernador.informes[cid] || null; };

  if (typeof module !== 'undefined' && module.exports) module.exports = GOB;
  root.GOBERNADOR = GOB;
})(typeof window !== 'undefined' ? window : globalThis);
