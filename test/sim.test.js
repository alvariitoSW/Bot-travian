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
function campaign(aggressive) {
  const s = G.newGame('Test'); const events = [];
  G.onEvent = (t, p) => { events.push(t); if (process.env.V && t === 'log' && /⚠|🔥|🏆|💀|rechaza|📜/.test(p.x)) console.log('  ', G.yearOf(s.t), p.x); };
  let guard = 0;
  while (!s.over && guard++ < 200000) {
    G.tick(0.25);
    while (s.pending.length && !s.over) { const info = G.battleInfo(s.pending[0]); const b = new Battle(info.cfg); b.finish(); G.applyBattle(b.result()); }
    if (guard % 8) continue;
    for (const id of G.myCities()) {
      const c = s.cities[id];
      if (c.train.length < 2 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const n = Math.min(40, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); break; } } }
      if (!c.queue) { const bs = Object.keys(D.BUILD).filter(b => (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0)); for (const b of bs) if (G.upgrade(id, b)) break; }
      if (!aggressive) continue;
      for (const n of G.neighbors(id)) {
        const t = s.cities[n]; if (t.owner === 'roma') continue;
        const keepHome = id === 'roma' ? 0.35 : 0.2, u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (1 - keepHome));
        if (G.power(u) > G.power(t.units) * (1.6 + 0.12 * t.b.muralla) && !s.marches.some(m => m.owner === 'roma')) { G.send(id, n, u, G.heroAvailable(id)); break; }
      }
    }
  }
  assert(s.over, 'la campaña debe terminar');
  assert(events.includes('event'));
  return s;
}
const passive = campaign(false);
console.log('Bot pasivo  →', passive.over.win ? 'VICTORIA' : 'derrota', '·', G.yearOf(passive.t), 'a.C. ·', passive.over.why);
const active = campaign(true);
console.log('Bot agresivo →', active.over.win ? 'VICTORIA' : 'derrota', '·', G.yearOf(active.t), 'a.C. · ciudades:', G.myCities().length, '· héroe nv', active.hero.lvl, '·', JSON.stringify(active.stats));
assert(JSON.parse(JSON.stringify(active)).v === 1, 'el estado debe ser serializable');
assert(G.myCities().length >= 3, 'un bot agresivo debe poder conquistar ciudades');
console.log('OK — todas las pruebas superadas');
