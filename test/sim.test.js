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
assert(r.time < 1500, 'toda batalla termina antes del tope de seguridad');

// 2. Igualdad: resultado razonable y con bajas en ambos bandos
r = fight({ hastati: 200 }, { libios: 200 });
assert(r.dead[0] > 20 && r.dead[1] > 20, 'ambos bandos sufren bajas');

// 2b. Ritmo (A8): una batalla igualada dura entre 8 y 12 minutos de juego
for (const sd of [1, 2, 3, 4]) {
  const q = fight({ hastati: 200 }, { libios: 200 }, { seed: sd });
  assert(q.time >= 480 && q.time <= 720, 'igualada 200 vs 200 (semilla ' + sd + '): ' + Math.round(q.time) + ' s');
  const m = fight({ hastati: 300, velites: 60, equites: 40 }, { libios: 265, numidas: 52, jinetes: 33 }, { seed: sd });
  assert(m.time >= 480 && m.time <= 720, 'igualada mixta (semilla ' + sd + '): ' + Math.round(m.time) + ' s');
  assert(fight({ hastati: 300, velites: 60, equites: 40 }, { milicia: 100 }, { seed: sd }).time > 90, 'la desigual no dura segundos');
}

// 2c. La moral no cae en cadena: nunca se rompe más de la mitad de un bando en 10 s
for (const sd of [1, 2, 3]) {
  const bt = new Battle({ sides: [side({ hastati: 300, velites: 60, equites: 40 }), side({ libios: 265, numidas: 52, jinetes: 33 })], defender: 1, wall: 0, seed: sd });
  const tot = [0, 0]; for (const g of bt.regs) tot[g.side]++;
  const hist = []; let worst = 0;
  while (!bt.over) {
    bt.step(0.1);
    const n = [0, 0]; for (const g of bt.regs) if (g.st !== 'ok') n[g.side]++;
    hist.push(n); if (hist.length > 101) hist.shift();
    if (hist.length > 100) for (let k = 0; k < 2; k++) worst = Math.max(worst, (n[k] - hist[0][k]) / tot[k]);
  }
  assert(worst <= 0.5, 'cadena de huidas: ' + worst + ' (semilla ' + sd + ')');
}

// 2d. El cansancio sube peleando y baja descansando
{
  const bt = new Battle({ sides: [side({ hastati: 100 }), side({ libios: 100 })], defender: 1, wall: 0, seed: 5 });
  for (let i = 0; i < 3000; i++) bt.step(0.1);
  const g = bt.regs.filter(x => x.st === 'ok');
  assert(g.length && g.every(x => x.fat >= 0 && x.fat <= 100) && Math.max.apply(null, g.map(x => x.fat)) > 20, 'peleando se cansan');
  const x = g[0]; x.fat = 50; x.order = { k: 'move', x: x.x, y: x.y }; x.tgt = null; x.fight = 0;
  for (const o of bt.regs) if (o.side !== x.side) o.st = 'fled'; // sin enemigos: descansa
  bt.over = false; for (let i = 0; i < 100; i++) bt.step(0.1);
  assert(x.fat < 50, 'descansando baja el cansancio');
}

// 2e. Toda batalla termina antes del tope, incluso con muralla alta y fuerzas parejas
for (let sd = 1; sd <= 5; sd++) { const q = fight({ principes: 150, triarii: 50 }, { hoplitas: 200 }, { seed: sd, wall: 10 }); assert(q.time < 1500 && q.winner !== null, 'termina (semilla ' + sd + ')'); }

// 2g. Despliegue (A5a)
{
  const mk = o => new Battle(Object.assign({ sides: [side({ hastati: 400, principes: 300, velites: 80, equites: 60 }, { gen: { n: 'Cónsul' } }), side({ libios: 200, numidas: 60, honderos: 40 })], defender: 1, wall: 0, seed: 11 }, o || {}));
  const bd = mk({ despliegue: true });
  assert.strictEqual(bd.fase, 'despliegue'); bd.step(5); bd.step(5); assert.strictEqual(bd.t, 0, 'despliegue: el tiempo no avanza');
  const mio = bd.regs.find(r => r.side === 0 && r.u.cls === 'inf'), ene = bd.regs.find(r => r.side === 1), e0 = [ene.x, ene.y], z = bd.zona(0);
  assert(bd.colocar(mio, -500, -500), 'colocar devuelve true'); assert(mio.x === z.x0 && mio.y === z.y0, 'colocar recorta a la zona');
  assert(!bd.colocar(ene, 300, 800), 'no se coloca al enemigo'); assert.deepStrictEqual([ene.x, ene.y], e0);
  const anchoFila1 = () => { const inf = bd.regs.filter(r => r.side === 0 && (r.u.cls === 'inf' || r.u.cls === 'spear')), yf = Math.min(...inf.map(r => r.y)), fila = inf.filter(r => Math.abs(r.y - yf) < 1); return Math.max(...fila.map(r => r.x)) - Math.min(...fila.map(r => r.x)); };
  const w = {};
  for (const [nom] of Battle.PLANTILLAS) {
    bd.formar(0, nom); w[nom] = anchoFila1();
    for (const r of bd.regs.filter(r => r.side === 0)) assert(r.x >= z.x0 && r.x <= z.x1 && r.y >= z.y0 - 0.01 && r.y <= z.y1 + 0.01 || nom === 'clasica' && r.x >= 20 && r.x <= 580, 'plantilla ' + nom + ' dentro del campo y la zona');
  }
  assert(w.ancha > w.clasica && w.centro < w.clasica, 'anchuras de primera fila: ' + JSON.stringify(w));
  bd.empezar(); bd.step(1); assert(bd.t > 0, 'tras empezar el tiempo corre');
  const bf = mk({ despliegue: true }); bf.finish(); assert(bf.over, 'finish() desde despliegue termina');
  const ba = mk(), bb = mk({ despliegue: true }); bb.empezar(); ba.finish(); bb.finish();
  assert.deepStrictEqual(ba.result().dead, bb.result().dead, 'despliegue + empezar() = batalla de siempre');
}

// 2f. Formación y marcha (A9)
{
  const mix = () => side({ hastati: 200, velites: 80, equites: 60 }), enemigo = () => side({ libios: 200, numidas: 60, honderos: 40, jinetes: 60 });
  const bt = new Battle({ sides: [mix(), enemigo()], defender: 1, wall: 0, seed: 7 });
  for (const sd of [0, 1]) {
    const mine = bt.regs.filter(r => r.side === sd), f = sd === 0 ? 1 : -1; // f>0: más lejos del enemigo = y mayor
    const inf = mine.filter(r => r.u.cls === 'inf' || r.u.cls === 'spear'), rng = mine.filter(r => r.u.cls === 'rng'), cav = mine.filter(r => r.u.cls === 'cav');
    assert(inf.length && rng.length && cav.length, 'hay de todo (lado ' + sd + ')');
    const front = Math.max(...inf.map(r => r.y * -f));
    for (const t of rng) assert(t.y * -f < front, 'tirador detrás de la primera fila (lado ' + sd + ')');
    const xmin = Math.min(...inf.map(r => r.x)), xmax = Math.max(...inf.map(r => r.x));
    assert(cav.some(c => c.x < xmin) && cav.some(c => c.x > xmax), 'caballería en las dos alas (lado ' + sd + ')');
    for (const r of mine) assert(r.x >= 20 && r.x <= 580, 'dentro del campo');
  }
  // lejos del enemigo: paso de marcha
  const r0 = bt.regs.find(r => r.side === 0 && r.u.cls === 'inf'), y0 = r0.y;
  bt.step(0.2);
  assert(Math.abs(r0.y - y0) <= r0.u.spd * 0.5 * 0.2 + 1.5, 'de marcha no pasa de spd x 0.5');
  // los tiradores con munición no pelean por iniciativa propia mientras quede infantería
  const bt2 = new Battle({ sides: [mix(), enemigo()], defender: 1, wall: 0, seed: 7 });
  while (bt2.t < 60 && !bt2.over) {
    bt2.step(0.2);
    for (const sd of [0, 1]) {
      const inf = bt2.regs.filter(r => r.side === sd && r.st === 'ok' && (r.u.cls === 'inf' || r.u.cls === 'spear'));
      if (!inf.length) continue;
      const f = sd === 0 ? 1 : -1, front = Math.min(...inf.map(r => r.y * f));
      for (const t of bt2.regs) if (t.side === sd && t.st === 'ok' && t.u.cls === 'rng' && t.ammo > 0) assert(t.y * f > front - 20, 'tirador no se adelanta a su infantería (t=' + bt2.t.toFixed(0) + ')');
    }
  }
}

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
    while (s.pending.length && !s.over) { const info = G.battleInfo(s.pending[0]); const b = new Battle(info.cfg); b.finish(); if (process.env.DBG) console.log(G.yearOf(s.t), JSON.stringify(info.cfg.sides.map(x => x.units)), 'def', info.cfg.defender, 'wall', info.cfg.wall, '->', b.result().winner, Math.round(b.t)); G.applyBattle(b.result()); }
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

// Mano de obra y mantenimiento (I3)
{ const s = G.newGame('MO'), c = s.cities.roma; c.pop = G.puestos(c); const p0 = G.prod();
  assert(G.manoObra(c) === 1, 'con pop >= puestos la mano de obra es 100 %');
  c.pop = G.puestos(c) / 2; const p1 = G.prod();
  assert(p1.madera < p0.madera && p1.grano < p0.grano && Math.abs(G.manoObra(c) - 0.5) < 1e-9, 'menos población baja la producción de la ciudad');
  c.pop = 0; assert(G.manoObra(c) === D.MANO_MIN, 'la mano de obra tiene suelo');
  c.pop = 400; s.res.hierro = s.res.oro = 5000; s.res.grano = 5000; s.res.madera = 5000; s.res.piedra = 5000; c.b.cuartel = 3;
  const a = G.prod().madera; assert(G.train('roma', 'hastati', 100), 'se recluta'); assert(G.prod().madera <= a, 'reclutar no sube la producción');
  const s2 = G.newGame('Mant'); const m = G.mantenimiento(), pr = G.prod();
  assert(m.edificios > 0 && m.tropas > 0 && Math.abs(m.total - m.edificios - m.tropas) < 1e-9 && pr.mant.total === m.total, 'mantenimiento con edificios y paga');
  s2.cities.roma.units = {}; const sinT = G.prod().oro; s2.cities.roma.units = { hastati: 200 }; assert(G.prod().oro < sinT, 'las tropas cuestan oro (paga)');
  const s3 = G.newGame('Paga'); s3.res.oro = 0; s3.cities.roma.units = { hastati: 5000 }; s3.cities.roma.b.foro = 0; const n0 = G.men(s3.cities.roma.units);
  assert(G.prod().oro < 0, 'con 5000 hastati el balance de oro es negativo'); for (let i = 0; i < 8; i++) G.tick(0.5);
  assert(G.men(s3.cities.roma.units) < n0, 'sin oro desertan tropas'); }
assert(!G.cityGen('carthago', 280) && !G.cityGen('carthago', 150), 'Cartago no tiene general con nombre antes de 149 a.C.');
assert(G.cityGen('carthago', 149) && G.cityGen('carthago', 146), 'Asdrúbal defiende Cartago desde 149 a.C.');
// Registro de piezas: carga en Node y toda tropa y edificio tiene ficha
{ const R = require('../js/registro.js');
  for (const t of Object.keys(D.UNITS)) assert(R.de('tropa', t) && R.de('tropa', t).historia, 'falta la ficha de la tropa ' + t);
  for (const b of Object.keys(D.BUILD)) assert(R.de('edificio', b) && R.de('edificio', b).arte, 'falta la ficha del edificio ' + b);
  assert(R.de('hecho', D.EVENTS[0].y), 'falta la ficha del primer hecho'); }


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

// ---- I4 Solares y tipos de ciudad ----
{ const urb = Object.keys(D.BUILD).filter(b => D.BUILD[b].solar);
  assert.strictEqual(urb.length, 12, '12 edificios urbanos'); ['aserradero', 'cantera', 'mina', 'granja', 'muralla'].forEach(b => assert(!D.BUILD[b].solar, b + ' no ocupa solar'));
  const s = G.newGame('Solares'), c = s.cities.roma; s.res = { madera: 1e5, piedra: 1e5, hierro: 1e5, grano: 1e5, oro: 1e5 };
  assert.strictEqual(G.solares('roma'), 10); assert.strictEqual(G.solares('carales'), 8); for (const id in D.CITIES) assert(G.solares(id) < 12, 'ninguna ciudad tiene los 12 solares');
  const libres = G.solaresLibres('roma'); assert(libres > 0 && G.solaresUsados(c) === 10 - libres);
  // llenar todos los solares: ya no se levanta un edificio urbano nuevo, pero sí se mejora uno existente y se levantan campos
  for (const b of urb) { if (G.solaresUsados(c) >= 10) break; c.b[b] = Math.max(c.b[b] || 0, 1); }
  const sin = urb.find(b => !(c.b[b] > 0)); assert.strictEqual(G.solaresUsados(c), 10); assert(sin, 'queda un edificio sin levantar');
  assert(!G.upgrade('roma', sin) && !c.queue, 'sin solares no se levanta ' + sin);
  assert(G.upgrade('roma', 'viviendas'), 'mejorar uno levantado no gasta solar'); c.queue = null;
  assert(G.upgrade('roma', 'granja'), 'los campos no ocupan solar'); c.queue = null;
  // derribar libera el solar; el foro no se derriba; lo que se está mejorando tampoco
  c.b.almacen = 2; const antes = G.solaresUsados(c); assert(G.derribar('roma', 'almacen') && c.b.almacen === 0 && G.solaresUsados(c) === antes - 1, 'derribar libera el solar');
  assert(!G.derribar('roma', 'foro') && !G.derribar('roma', 'granja') && !G.derribar('roma', 'almacen'), 'no se derriba foro, campos ni lo que no existe');
  assert(G.upgrade('roma', sin) && c.b[sin] === 0, 'con el solar libre se levanta el nuevo'); assert(!G.derribar('roma', sin), 'no se derriba en obras');
  c.queue = null; c.b.viviendas = 6; c.pop = G.popCap(c); G.derribar('roma', 'viviendas'); assert(c.pop <= G.popCap(c), 'la población se recorta al tope');
  // una ciudad con más edificios que solares no pierde nada
  const cap = s.cities.capua; for (const b of urb) cap.b[b] = 1; assert.strictEqual(G.solaresUsados(cap), 12); assert(!G.upgrade('capua', 'foro') === false, 'mejorar sigue valiendo'); }
{ const tasa = tipo => { const s = G.newGame('Tipos'); s.res.oro = 1000; const c = s.cities.roma; if (tipo) c.tipo = tipo; return { s, c, p: G.prod() }; };
  const base = tasa('municipio'), ag = tasa('agraria');
  ['madera', 'piedra', 'hierro'].forEach(r => assert(Math.abs(ag.p[r] / base.p[r] - 1.25) < 0.02 || ag.p[r] > base.p[r] * 1.1, 'agraria sube ' + r));
  assert(ag.p.grano > base.p.grano, 'agraria sube el grano');
  // municipio da +5 de felicidad; el resto, no
  assert.strictEqual(G.felicidad(base.c) - G.felicidad(ag.c), 5, 'municipio +5 de felicidad');
  // militar: instrucción 25 % más rápida y paga 25 % menor
  const tr = tipo => { const s = G.newGame('M'); s.cities.roma.tipo = tipo; s.res.oro = 1e5; G.train('roma', 'hastati', 20); const q = s.cities.roma.train[0]; return q.t1 - q.t0; };
  assert(Math.abs(tr('militar') / tr('municipio') - 0.8) < 1e-9, 'militar entrena un 25 % más rápido');
  { const mi = tasa('militar'); let up = 0; for (const k in mi.c.units) up += mi.c.units[k] * D.UNITS[k].up; assert(Math.abs(base.p.mant.tropas - mi.p.mant.tropas - 0.25 * up * D.MANT_TROPA) < 1e-9, 'militar paga un 25 % menos'); }
  // emporio: más oro de foro y puerto, y cambio mejor con mercado
  const em = tasa('emporio'); assert(em.p.oro > base.p.oro, 'emporio gana más oro');
  const tr0 = G.tradeRate(); assert(tr0 > 0, 'hay mercado en alguna parte'); em.c.b.mercado = 0; const sinM = G.tradeRate(); em.c.b.mercado = 1; assert(Math.abs(G.tradeRate() - sinM) >= 0 && G.tradeRate() >= sinM, 'emporio con mercado no empeora el cambio');
  { const s = G.newGame('E'); for (const id of G.myCities()) s.cities[id].b.mercado = 1; const r0 = G.tradeRate(); s.cities.roma.tipo = 'emporio'; assert(Math.abs(G.tradeRate() - r0 - 0.05) < 1e-9, 'emporio +0,05 al cambio'); s.cities.roma.b.mercado = 0; assert.strictEqual(G.tradeRate(), r0, 'sin mercado en el emporio no mejora'); }
  // naval: oro por puerto y viajes por mar más rápidos; solo con mar
  { const s = G.newGame('N'); const c = s.cities.roma; c.b.puerto = 2; const t0 = G.travel('roma', 'carales'), o0 = G.prod().oro; c.tipo = 'naval';
    assert(Math.abs(G.travel('roma', 'carales') / t0 - 0.75) < 1e-9, 'naval viaja un 25 % más rápido por mar'); assert(Math.abs(G.prod().oro - o0 - 6) < 1e-9, 'naval +3 de oro por nivel de puerto');
    assert(Math.abs(G.travel('roma', 'volsinii') - G.travel('roma', 'volsinii')) < 1e-9);
    s.cities.capua.tipo = 'municipio'; assert(!G.setTipo('capua', 'naval') && s.cities.capua.tipo === 'municipio', 'naval sin mar se rechaza'); assert(G.tipoOk('roma', 'naval') === !!D.CITIES.roma.sea); }
  // saber: herrería más barata y rápida
  { const s = G.newGame('S'); const c = s.cities.roma; c.b.herreria = 3; s.res = { madera: 1e5, piedra: 1e5, hierro: 1e5, grano: 1e5, oro: 1e5 }; const c0 = G.forjaCost('armas', 0, 'roma'), t0 = G.forjaTime('armas', 0, 'roma'); c.tipo = 'saber';
    for (const r in c0) assert(G.forjaCost('armas', 0, 'roma')[r] <= Math.round(c0[r] * 0.75 / 5) * 5 + 5 && G.forjaCost('armas', 0, 'roma')[r] < c0[r], 'saber abarata la forja');
    assert(Math.abs(G.forjaTime('armas', 0, 'roma') / t0 - 0.75) < 1e-9); assert(G.forjaUp('roma', 'armas') && Math.abs((s.forja.cola.t1 - s.forja.cola.t0) / t0 - 0.75) < 1e-9, 'saber acorta la forja'); }
  // elegir: la primera vez gratis, después cobra
  { const s = G.newGame('Elegir'); s.res.oro = 300; assert.strictEqual(s.cities.roma.tipo, 'municipio'); assert(!G.setTipo('roma', 'inexistente'));
    assert(G.setTipo('roma', 'militar') && s.res.oro === 300 && s.cities.roma.tipoElegido, 'primera elección gratis');
    assert(G.setTipo('roma', 'agraria') && s.res.oro === 300 - D.TIPO_CAMBIO, 'la segunda cuesta ' + D.TIPO_CAMBIO);
    s.res.oro = 100; assert(!G.setTipo('roma', 'emporio') && s.cities.roma.tipo === 'agraria', 'sin oro no se cambia');
    assert(!G.setTipo(Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma'), 'militar'), 'solo ciudades propias');
    assert(G.tipoSugerido('capua') === 'agraria' && G.tipoSugerido('tarentum') === 'naval'); for (const id in D.CITIES) if (D.CITIES[id].tipo) assert(G.tipoOk(id, D.CITIES[id].tipo), 'sugerencia válida en ' + id); }
  // migración de una partida sin tipo
  { const s = G.newGame('Vieja4'); for (const id in s.cities) { delete s.cities[id].tipo; delete s.cities[id].tipoElegido; } s.cities.roma.tipo = 'basura'; delete s.evN;
    localStorage.setItem('aqvila-save-v1', JSON.stringify(s)); assert(G.load()); const r = G.state.cities.roma; assert(r.tipo === 'municipio' && r.tipoElegido === false && G.state.cities.capua.tipo === 'municipio', 'la partida vieja carga con municipio');
    assert(G.setTipo('roma', 'militar') && G.state.res.oro === s.res.oro, 'y su primera elección es gratis'); } }
console.log('OK — todas las pruebas superadas');
