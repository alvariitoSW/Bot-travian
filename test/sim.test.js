/* Pruebas sin navegador: node test/sim.test.js */
const assert = require('assert');
const D = require('../js/data.js');
const { Battle } = require('../js/battle.js');
const G = require('../js/game.js');

const side = (units, extra) => Object.assign({ units, name: 'x', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, extra || {});
function fight(a, b, opt) { const bt = new Battle(Object.assign({ sides: [side(a), side(b)], defender: 1, wall: 0, seed: 42 }, opt || {})); bt.finish(); return bt.result(); }

// 1. Las batallas terminan y gana el más fuerte
let r = fight({ hastati: 300, velites: 60, equites: 40 }, { milicia: 100 });
assert.strictEqual(r.winner, 0, 'ejército superior debe ganar');
r = fight({ hastati: 60 }, { falange: 300, tesalios: 80, elefantes: 10 });
assert.strictEqual(r.winner, 1, 'ejército inferior debe perder');
assert(r.time < 241);

// 2. Igualdad: resultado razonable y con bajas en ambos bandos
r = fight({ hastati: 200 }, { libios: 200 });
assert(r.dead[0] > 20 && r.dead[1] > 20, 'ambos bandos sufren bajas');

// 3. Las lanzas frenan a la caballería; la muralla ayuda al defensor
const cavVsSpear = fight({ equites: 120 }, { hoplitas: 120 }), cavVsInf = fight({ equites: 120 }, { milicia: 160 });
assert(cavVsSpear.dead[0] > cavVsInf.dead[0], 'la caballería sufre más contra lanzas');
let wins = 0; for (let s = 1; s <= 10; s++) if (fight({ hastati: 200 }, { libios: 190 }, { wall: 6, seed: s }).winner === 1) wins++;
assert(wins >= 7, 'la muralla debe inclinar la batalla (' + wins + '/10)');

// 4. Mapa coherente
for (const e of D.EDGES) assert(D.CITIES[e[0]] && D.CITIES[e[1]], 'ruta inválida ' + e);
for (const id in D.CITIES) { assert(D.FACTIONS[D.CITIES[id].f]); for (const k in D.CITIES[id].g) assert(D.UNITS[k], k); }

// 5. Campaña completa con un bot sencillo: no debe lanzar excepciones y debe terminar
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function campaign(aggressive, seed) {
  const rndOrig = Math.random; if (seed) Math.random = mulberry32(seed);
  try { return campaign1(aggressive); } finally { Math.random = rndOrig; }
}
function campaign1(aggressive) {
  const s = G.newGame('Test'); const events = [];
  G.onEvent = (t, p) => { events.push(t); if (process.env.V && t === 'log' && /⚠|🔥|🏆|💀|rechaza|📜/.test(p.x)) console.log('  ', G.yearOf(s.t), p.x); };
  const dist = { carthago: 0 }; for (let q = ['carthago'], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
  let guard = 0;
  while (!s.over && guard++ < 200000) {
    G.tick(0.25);
    while (s.pending.length && !s.over) { const info = G.battleInfo(s.pending[0]); const b = new Battle(info.cfg); b.finish(); G.applyBattle(b.result()); }
    if (guard % 8) continue;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const n = Math.min(150, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); break; } } }
      if (!c.queue) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'acueducto', 'termas', 'anfiteatro'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (G.prod().grano < 25 ? (q === 'granja') - (p === 'granja') : 0) * 3); for (const b of bs) if (G.upgrade(id, b)) break; }
      if (!aggressive) continue;
      const yr = G.yearOf(s.t); if (yr <= 230 && yr >= 209) continue;   // el bot se atrinchera ante la invasión de Aníbal
      // concentración: las tropas avanzan por la ruta más corta hacia Carthago mientras la siguiente plaza sea romana
      const sig = G.neighbors(id).sort((a, b) => dist[a] - dist[b])[0];
      if (id !== 'carthago' && dist[sig] < dist[id] && s.cities[sig].owner === 'roma' && !s.marches.some(m => m.owner === 'roma' && m.from === id)) { const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === "roma" ? 0.15 : 0.65)); if (G.men(u) >= 100 && G.send(id, sig, u, false)) continue; }
      for (const n of G.neighbors(id)) {
        const t = s.cities[n]; if (t.owner === 'roma') continue;
        const keepHome = id === 'roma' ? 0.35 : 0.2, u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (1 - keepHome));
        if (G.power(u) > G.power(t.units) * (1.6 + 0.12 * t.b.muralla) && !s.marches.some(m => m.owner === 'roma' && s.cities[m.to].owner !== 'roma')) { G.send(id, n, u, G.heroAvailable(id)); break; }
      }
    }
  }
  assert(s.over, 'la campaña debe terminar');
  assert(events.includes('event'));
  return s;
}
// 10 semillas del azar de la IA: el agresivo debe tomar Carthago antes del 146 a.C. en la mayoría; el pasivo, nunca
const res = { pas: [], agr: [] }; let activo = null;
for (const ag of [false, true]) for (let sd = 1; sd <= 10; sd++) { const s = campaign(ag, sd); res[ag ? 'agr' : 'pas'].push(s); if (ag && sd === 1) activo = s; }
const resumen = l => l.map(s => (s.over.win ? 'V' : 'd') + G.yearOf(s.t)).join(' ');
console.log('Bot pasivo   →', resumen(res.pas)); console.log('Bot agresivo →', resumen(res.agr));
const ganaAgr = res.agr.filter(s => s.over.win).length, ganaPas = res.pas.filter(s => s.over.win).length;
assert(ganaAgr >= 6, 'el bot agresivo debe tomar Carthago en al menos 6 de 10 semillas (' + ganaAgr + '/10)');
assert.strictEqual(ganaPas, 0, 'un bot pasivo no debe ganar nunca (' + ganaPas + '/10)');
const active = activo;
assert(JSON.parse(JSON.stringify(active)).v === 1, 'el estado debe ser serializable');
assert(G.myCities().length >= 3, 'un bot agresivo debe poder conquistar ciudades');
// 6. Ciudad: población, mercado y puerto
{ const s = G.newGame('Eco'), roma = s.cities.roma;
  assert(roma.pop > 100 && roma.pop <= G.popCap(roma), 'población inicial dentro del tope');
  const before = roma.pop; assert(G.train('roma', 'hastati', 20)); assert.strictEqual(Math.round(before - roma.pop), 20, 'los reclutas salen de la población');
  assert(!G.train('roma', 'hastati', 5000), 'no se recluta más gente de la que hay');
  const mercCapua = s.cities.capua.b.mercado; s.cities.capua.b.mercado = 0;   // Capua (aliada romana) trae su propio mercado
  assert.strictEqual(G.trade('madera', 'hierro', 100), 0, 'sin mercado no hay comercio');
  s.cities.capua.b.mercado = mercCapua;
  roma.b.mercado = 2; const got = G.trade('madera', 'hierro', 100); assert(got > 40 && got < 100, 'el mercado cambia con comisión: ' + got);
  assert(!G.send('roma', 'carales', { hastati: 10 }, false), 'sin puerto no se embarca');
  roma.b.puerto = 1; assert(G.send('roma', 'carales', { hastati: 10 }, false), 'con puerto sí');
  assert(!G.upgrade('volsinii', 'puerto'), 'ciudad ajena o sin mar no construye puerto');
  for (let i = 0; i < 400; i++) G.tick(0.25); assert(roma.pop > before - 20, 'la población se recupera con el tiempo'); }
// 7. Herrería: mejoras de armas y armaduras
{ const s = G.newGame('Forja'), roma = s.cities.roma;
  assert(!G.forjaUp('roma', 'armas'), 'sin herrería no se forja');
  roma.b.herreria = 1; s.res = { madera: 5000, piedra: 5000, hierro: 5000, grano: 5000, oro: 5000 };
  const h0 = s.res.hierro, pb = { kind: 'attack', m: { to: 'volsinii', units: { hastati: 10 }, hero: false, id: 1 } };
  assert.strictEqual(G.battleInfo(pb).cfg.sides[0].atkMul, 1, 'sin mejoras el ataque es 1');
  assert(G.forjaUp('roma', 'armas'), 'se compra la mejora'); assert(s.res.hierro < h0, 'cobra');
  assert(!G.forjaUp('roma', 'armaduras'), 'solo una mejora a la vez');
  for (let i = 0; i < 400 && s.forja.armas < 1; i++) G.tick(0.1);
  assert.strictEqual(s.forja.armas, 1, 'sube el nivel tras el tiempo'); assert.strictEqual(s.forja.cola, null);
  assert(Math.abs(G.battleInfo(pb).cfg.sides[0].atkMul - 1.05) < 1e-9, 'ataque +5 %');
  assert(!G.forjaUp('roma', 'armas'), 'no pasa del nivel de la herrería');
  roma.b.herreria = 5; assert(G.forjaUp('roma', 'armaduras'));
  for (let i = 0; i < 400 && s.forja.armaduras < 1; i++) G.tick(0.1);
  assert(Math.abs(G.battleInfo(pb).cfg.sides[0].defMul - 1.05) < 1e-9, 'defensa +5 %');
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  localStorage.setItem('aqvila-save-v1', JSON.stringify(Object.assign({}, s, { forja: undefined })));
  assert(G.load() && G.state.forja.armas === 0 && G.state.forja.cola === null, 'una partida vieja se migra'); }
// Acueducto, termas y anfiteatro: tope de población y felicidad
{ const s = G.newGame('Edif'), c = s.cities.roma; const cap0 = G.popCap(c), f0 = G.felicidad(c);
  assert(c.b.acueducto === 0 && c.b.termas === 0 && c.b.anfiteatro === 0, 'empiezan a nivel 0');
  c.b.acueducto = 1; assert.strictEqual(G.popCap(c), cap0 + 40, 'acueducto +40 de población'); c.b.acueducto = 0;
  c.b.termas = 1; assert.strictEqual(G.popCap(c), cap0 + 15, 'termas +15 de población'); assert.strictEqual(G.felicidad(c), f0 + 4, 'termas +4 de felicidad'); c.b.termas = 0;
  c.b.anfiteatro = 1; assert.strictEqual(G.felicidad(c), f0 + 6, 'anfiteatro +6 de felicidad');
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  for (const id in s.cities) for (const b of ['acueducto', 'termas', 'anfiteatro']) delete s.cities[id].b[b];
  localStorage.setItem('aqvila-save-v1', JSON.stringify(s));
  assert(G.load() && G.state.cities.roma.b.termas === 0 && G.state.cities.volsinii.b.anfiteatro === 0, 'una partida vieja sin estos edificios carga'); }
// Impuestos y felicidad
{ const prodOro = k => { const s = G.newGame('Imp'); s.cities.roma.imp = k; return G.prod().oro; };
  const bajo = prodOro('bajo'), normal = prodOro('normal'), alto = prodOro('alto');
  assert(alto > normal && normal > bajo, 'oro: alto > normal > bajo');
  const crece = k => { const s = G.newGame('Imp2'), c = s.cities.roma; G.setImp('roma', k); c.pop = 150; const p0 = c.pop; for (let i = 0; i < 40; i++) G.tick(0.25); return c.pop - p0; };
  assert(G.felicidad(G.newGame('F').cities.roma) === 60, 'felicidad normal = 60');
  assert(crece('alto') === 0, 'con impuestos altos la población no crece');
  assert(crece('normal') > 0, 'con impuestos normales sí crece');
  const s = G.newGame('Imp3'); const ene = Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma'); assert(!G.setImp(ene, 'alto') && s.cities[ene].imp !== 'alto', 'no se tocan ciudades enemigas');
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  for (const id in s.cities) delete s.cities[id].imp;
  localStorage.setItem('aqvila-save-v1', JSON.stringify(s));
  assert(G.load() && G.state.cities.roma.imp === 'normal' && G.felicidad(G.state.cities.roma) === 60, 'partida vieja sin imp carga'); }

// Aldeanos: reparto de la población trabajadora
{ const s = G.newGame('Ald'), c = s.cities.roma; const p0 = G.prod();
  assert(G.repartoValido(c.reparto) && c.reparto.madera === 5, 'reparto por defecto 5/5/5/5');
  assert(G.reparto('roma', 'madera', 1) && G.reparto('roma', 'madera', 1), 'se puede subir la madera');
  const p1 = G.prod(); const sum = () => G.REPARTO_RES.reduce((a, k) => a + c.reparto[k], 0);
  assert(p1.madera > p0.madera && p1.piedra + p1.hierro + p1.grano - p0.piedra - p0.hierro - p0.grano < 0 || p1.piedra < p0.piedra || p1.hierro < p0.hierro || p1.grano < p0.grano, 'subir madera baja la de otro');
  assert(sum() === 20 && c.reparto.madera === 7, 'la suma sigue en 20');
  for (let i = 0; i < 30; i++) G.reparto('roma', 'madera', 1);
  assert(c.reparto.madera === 11 && sum() === 20 && !G.reparto('roma', 'madera', 1), 'tope de 11 partes');
  for (let i = 0; i < 40; i++) G.reparto('roma', 'madera', -1);
  assert(c.reparto.madera === 1 && sum() === 20 && !G.reparto('roma', 'madera', -1), 'mínimo de 1 parte');
  const ene = Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma'); assert(!G.reparto(ene, 'madera', 1), 'no se toca el reparto enemigo');
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, v) => { mem[k] = v; } };
  for (const id in s.cities) delete s.cities[id].reparto;
  localStorage.setItem('aqvila-save-v1', JSON.stringify(s));
  assert(G.load() && G.state.cities.roma.reparto.grano === 5 && G.repartoValido(G.state.cities.roma.reparto), 'partida vieja sin reparto carga 5/5/5/5');
  const n = G.newGame('Ald2'); assert(Math.abs(G.prod().madera - p0.madera) < 1e-9, 'por defecto la producción es la de siempre'); }

assert(!G.cityGen('carthago', 280) && !G.cityGen('carthago', 150), 'Cartago no tiene general con nombre antes de 149 a.C.');
assert(G.cityGen('carthago', 149) && G.cityGen('carthago', 146), 'Asdrúbal defiende Cartago desde 149 a.C.');

console.log('OK — todas las pruebas superadas');

// H7. Mapa de 280 a.C. con sus dueños reales
{ const s = G.newGame('H7');
  assert.strictEqual(s.cities.agrigentum.owner, 'akragas'); assert.strictEqual(s.cities.corinthus.owner, 'macedonia');
  assert.strictEqual(s.cities.capua.owner, 'roma'); assert.strictEqual(s.cities.messana.owner, 'mamertinos');
  for (const id in s.cities) assert(D.FACTIONS[s.cities[id].owner], 'dueño inexistente en ' + id);
  s.t = (280 - 264) * 12 - 0.5; G.tick(1);
  assert.strictEqual(s.cities.agrigentum.owner, 'cartago', 'en 264 Agrigentum pasa a Cartago'); assert.strictEqual(s.cities.agrigentum.units.libios, 140);
  assert.strictEqual(s.cities.corinthus.owner, 'macedonia');
  s.t = (280 - 243) * 12 - 0.5; s.pending = []; s.marches = []; G.tick(1);
  assert.strictEqual(s.cities.corinthus.owner, 'aquea', 'en 243 Arato libera Corinto'); assert.strictEqual(s.cities.corinthus.units.hoplitas, 300);
  // partida antigua con dueños de antes: carga sin error y conserva su mapa
  const v = G.newGame('Vieja'); v.cities.messana.owner = 'campanos'; v.cities.capua.owner = 'campanos'; v.cities.agrigentum.owner = 'cartago'; delete v.evN;
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, x) => { mem[k] = x; } };
  localStorage.setItem('aqvila-save-v1', JSON.stringify(v));
  assert(G.load()); assert.strictEqual(G.state.cities.messana.owner, 'mamertinos'); assert.strictEqual(G.state.cities.capua.owner, 'campanos'); assert.strictEqual(G.state.cities.agrigentum.owner, 'cartago'); }

// H8. Carthago Nova: poblado íbero en 280, cartaginesa hacia 228
{ const s = G.newGame('H8'); const c0 = s.cities.carthagonova;
  assert.strictEqual(c0.owner, 'iberos', 'en 280 es poblado íbero'); assert(c0.units.iberos > 0 && !c0.units.libios && c0.b.muralla === 1);
  s.t = (280 - 228) * 12 - 0.5; s.pending = []; s.marches = []; G.tick(1);
  const c = s.cities.carthagonova;
  assert.strictEqual(c.owner, 'cartago', 'hacia 228 pasa a Cartago'); assert.strictEqual(c.units.libios, 220); assert.strictEqual(c.b.muralla, 3); assert.strictEqual(c.w, 4);
  const mem = {}; global.localStorage = { getItem: k => mem[k] || null, setItem: (k, x) => { mem[k] = x; } };
  G.save(); assert(G.load()); assert.strictEqual(G.state.cities.carthagonova.owner, 'cartago'); assert.strictEqual(G.state.cities.carthagonova.units.libios, 220);
  // si ya era romana, no cambia
  const r = G.newGame('H8b'); r.cities.carthagonova.owner = 'roma'; const u = JSON.stringify(r.cities.carthagonova.units);
  r.t = (280 - 228) * 12 - 0.5; r.pending = []; r.marches = []; G.tick(1);
  assert.strictEqual(r.cities.carthagonova.owner, 'roma'); assert.strictEqual(JSON.stringify(r.cities.carthagonova.units), u);
  // partida antigua ya cartaginesa pasado 228: sigue igual al cargar
  const v = G.newGame('Vieja2'); v.t = (280 - 200) * 12; v.cities.carthagonova.owner = 'cartago'; v.cities.carthagonova.units = { libios: 5 }; delete v.evN;
  localStorage.setItem('aqvila-save-v1', JSON.stringify(v)); assert(G.load());
  assert.strictEqual(G.state.cities.carthagonova.owner, 'cartago'); assert.strictEqual(G.state.cities.carthagonova.units.libios, 5); }

// licencia de juego: lo inventado para poder jugar lleva su etiqueta
{ const DD = require('../js/data.js');
  DD.EVENTS.filter(e => e.fx).forEach(e => assert(e.lic, 'hecho con efecto sin lic: ' + e.t));
  ['milicia', 'jinetes', 'vigiles'].forEach(k => assert(DD.UNITS[k].lic, 'unidad sin lic: ' + k));
  assert(!DD.UNITS.hastati.lic, 'hastati no es licencia de juego'); }

// refuerzos de guarnición posteriores a un cambio de manos (Agrigentum púnica) y riqueza de partida antigua
{ const s = G.newGame('Post1'); s.t = (280 - 264) * 12 - 0.5; s.pending = []; s.marches = []; G.tick(1);
  const a = s.cities.agrigentum; assert.strictEqual(a.owner, 'cartago');
  assert(G.guarnicionBase('agrigentum', 'cartago') && G.guarnicionBase('corinthus', 'aquea'));
  a.units = { libios: 10 }; for (let i = 0; i < 40; i++) { s.pending = []; s.marches = s.marches.filter(m => m.owner === 'roma'); G.tick(12 * 30); if (a.owner !== 'cartago') break; }
  if (a.owner === 'cartago') assert((a.units.libios || 0) > 10, 'Agrigentum púnica debe recibir refuerzos');
  const v = G.newGame('Vieja3'); v.cities.carthagonova.owner = 'cartago'; delete v.cities.carthagonova.w; delete v.evN;
  localStorage.setItem('aqvila-save-v1', JSON.stringify(v)); assert(G.load());
  assert.strictEqual(G.state.cities.carthagonova.w, 4); }

// ---- H3 Códice: toda unidad, ciudad y hecho tiene ficha válida ----
{ const CO = require('../js/codice.js'); const T = ['histórico', 'probable', 'licencia de juego'];
  const ids = l => new Set(l.map(f => f.id));
  const ut = ids(CO.tropas), ci = ids(CO.ciudades), he = ids(CO.hechos);
  Object.keys(D.UNITS).forEach(k => assert(ut.has(k), 'Códice: falta tropa ' + k));
  Object.keys(D.CITIES).forEach(k => assert(ci.has(k), 'Códice: falta ciudad ' + k));
  D.EVENTS.forEach(e => assert(he.has(String(e.y)), 'Códice: falta hecho ' + e.y));
  [].concat(CO.tropas, CO.ciudades, CO.hechos).forEach(f => {
    assert(T.includes(f.tag), 'Códice: etiqueta no válida en ' + f.id);
    assert(f.src && f.src.trim(), 'Códice: sin fuente en ' + f.id);
    assert(f.t && f.x.length >= 40 && f.x.length <= 420, 'Códice: texto fuera de 40-420 en ' + f.id + ' (' + f.x.length + ')'); });
  Object.keys(D.UNITS).forEach(k => assert.strictEqual(CO.tropas.find(f => f.id === k).t, D.UNITS[k].n, 'Códice: nombre de ' + k));
  Object.keys(D.CITIES).forEach(k => assert.strictEqual(CO.ciudades.find(f => f.id === k).t, D.CITIES[k].n, 'Códice: nombre de ' + k));
  D.EVENTS.forEach(e => assert.strictEqual(CO.hechos.find(f => f.id === String(e.y)).t, e.t, 'Códice: título de ' + e.y)); }
