// AQVILA — GC4 / CG4b: la batalla de la campaña dentro del juego, con el simulador de manípulos (js/simulador.js).
// G.cfgSim, G.estadoGuerra, G.jugarGuerra (deciden los tribunos), guardar a mitad, G.resultadoNueva, heridos y cautivos. node test/guerra-juego.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); const Z = require('../js/simulador.js');
const store = {}; global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const info = (u0, u1, seed = 77, fac = 'cartago') => ({ city: 'capua', kind: 'attack', cfg: { seed, defender: 1, wall: 1, terreno: 'colina', sides: [{ name: 'Roma', units: u0 }, { name: D.FACTIONS[fac].n, fac, units: u1 }] } });
const ROMA = { hastati: 360, principes: 360, triarii: 180, equites: 60 }, ENEM = { galos: 690, libios: 780, iberos: 690, numidas: 60 };
const hombres = u => Object.values(u || {}).reduce((a, b) => a + b, 0);
const jugar = (S, hasta) => { Z.avanzar(S, Math.max(0, hasta - S.t)); return S; };
G.newGame('T');

t('cfgSim: ejércitos de la ciudad, pueblos de cada bando, campo, color del rival y tácticas', () => {
  const c = G.cfgSim(info(ROMA, ENEM), null);
  assert.deepStrictEqual(Object.assign({}, c.ejercitos[0]), ROMA); assert.deepStrictEqual(Object.assign({}, c.ejercitos[1]), ENEM);
  assert.deepStrictEqual(c.ejercitos.pueblos, ['roma', 'cartago']); assert.strictEqual(c.campo, 'colina'); assert.strictEqual(c.col, D.FACTIONS.cartago.col);
  assert.strictEqual(c.tacticas, true); assert.strictEqual(c.semilla, 77); assert.strictEqual(c.pueblo, 'roma');
  assert.strictEqual(G.cfgSim(info(ROMA, ENEM, 77, 'campanos'), null).ejercitos.pueblos[1], null, 'otra facción: sin pueblo (datos base)');
  const sinFac = info(ROMA, ENEM); delete sinFac.cfg.sides[1].fac; assert.strictEqual(G.cfgSim(sinFac, null).ejercitos.pueblos[1], 'cartago', 'sin fac: por el nombre');
  assert.strictEqual(G.cfgSim(Object.assign(info(ROMA, ENEM), { campo: { rasgo: 'bosque' } }), null).campo, 'bosque', 'batalla de camino: el rasgo del sitio');
});
t('estadoGuerra: es la misma batalla con la misma semilla, y otra con otra', () => {
  const a = G.estadoGuerra(info(ROMA, ENEM), null), b = G.estadoGuerra(info(ROMA, ENEM), null);
  const directo = Z.crear({ semilla: 77, ejercitos: [ROMA, ENEM] });   // el simulador reparte en manípulos de 60 a 120: 780 libios son 7 de 111
  assert.deepStrictEqual(a.n0, directo.n0, 'los ejércitos de la ciudad, tal cual'); assert.deepStrictEqual(a.n0[0], ROMA); for (const k in ENEM) assert(Math.abs(a.n0[1][k] - ENEM[k]) <= 6, k);
  assert(a.tac, 'con tácticas de la época');
  assert(a.man.some(u => u.lado === 1 && u.pueblo === 'cartago'), 'el rival lleva su pueblo');
  assert.strictEqual(Z.guardar(a), Z.guardar(b));
  jugar(a, 60); jugar(b, 60); assert.strictEqual(Z.guardar(a), Z.guardar(b), 'misma semilla, misma batalla a los 60 s');
  const c = jugar(G.estadoGuerra(info(ROMA, ENEM, 78), null), 60); assert.notStrictEqual(Z.guardar(a), Z.guardar(c));
});
t('estadoGuerra: con choque de maniobra usa los ejércitos del choque, no los de la ciudad', () => {
  const ch = { sides: [{ units: { hastati: 100, principes: 80 } }, { units: { galos: 150 } }] };
  const e = G.estadoGuerra(info(ROMA, ENEM), ch); assert.deepStrictEqual(e.n0[0], { hastati: 100, principes: 80 }); assert.deepStrictEqual(e.n0[1], { galos: 150 });
});
t('los tribunos juegan hasta el final y G.resultadoNueva da la forma que espera applyBattle', () => {
  const i = info(ROMA, ENEM), S = G.jugarGuerra(G.estadoGuerra(i, null)); assert.strictEqual(S.fase, 'fin');
  const r2 = Z.resumen(S), res = G.resultadoNueva(i, r2, null);
  assert(res.nueva && res.dead.length === 2 && typeof res.winner === 'number' && res.dead[0] + res.dead[1] > 0);
  for (const k in res.lost[0]) assert(res.lost[0][k] <= ROMA[k]);
  assert(res.heridos && typeof res.cautivos === 'number', 'trae heridos y cautivos');
  const her = hombres(res.heridos[0]), sobre = hombres(res.surv[0]);
  assert.strictEqual(sobre + her + res.dead[0], hombres(ROMA), 'sanos + heridos + bajas = los que fueron');
  if (res.winner === 0) {
    assert.strictEqual(her, r2.bajas.filter(x => x.bando === 0).reduce((a, x) => a + x.recuperados, 0), 'tus heridos son los recuperados del resumen');
    assert.strictEqual(res.prisioneros, r2.bajas.filter(x => x.bando === 1).reduce((a, x) => a + x.prisioneros, 0), 'cautivos = heridos del vencido');
  } else assert(her === 0 && res.prisioneros === 0);
});
t('los tribunos ganan con mucha ventaja y pierden con mucha desventaja', () => {
  const x = (u, k) => { const o = {}; for (const q in u) o[q] = Math.round(u[q] * k); return o; }, E = { libios: 600, iberos: 300 };
  let gF = 0, gD = 0; const N = 4;
  for (let s = 1; s <= N; s++) { if (G.jugarGuerra(G.estadoGuerra(info(x(ROMA, 1.5), x(E, 0.5), s * 131), null)).resultado.como === 'victoria') gF++; if (G.jugarGuerra(G.estadoGuerra(info(x(ROMA, 0.4), x(E, 1.5), s * 131), null)).resultado.como === 'victoria') gD++; }
  console.log('      con ventaja', gF, 'de', N, '· con desventaja', gD, 'de', N);
  assert(gF >= N - 1, 'con ventaja gana ' + gF); assert(gD <= 1, 'con desventaja gana ' + gD);
});
t('guardar a mitad y cargar da el mismo final', () => {
  const i = info(ROMA, ENEM, 5), A = jugar(G.estadoGuerra(i, null), 40); G.guardarGuerra(i, A, { x: 1 });
  const resto = G.guerraGuardada(i); assert(resto && Math.abs(resto.estado.t - A.t) < 1e-9 && resto.estM.x === 1);
  const Zc = G.jugarGuerra(G.estadoGuerra(i, null)), C = G.jugarGuerra(resto.estado);
  assert.strictEqual(Z.guardar(C), Z.guardar(Zc), 'otro final tras recargar');
});
t('la partida a medias es de su batalla: otra batalla no la ve, y se borra; un guardado viejo de la Guerra se descarta', () => {
  const i = info(ROMA, ENEM, 9); G.guardarGuerra(i, G.estadoGuerra(i, null), null);
  assert(G.guerraGuardada(i)); assert.strictEqual(G.guerraGuardada(info(ROMA, ENEM, 10)), null); assert.strictEqual(G.guerraGuardada(Object.assign({}, i, { city: 'roma' })), null);
  G.borrarGuerra(); assert.strictEqual(G.guerraGuardada(i), null);
  G.guardarGuerra(i, G.estadoGuerra(i, null), null); G.newGame('T'); assert.strictEqual(G.guerraGuardada(i), null, 'una partida nueva la borra');
  store['aqvila-guerra-v1'] = JSON.stringify({ clave: ['capua', 9, 'attack'].join('|'), B: '{"fase":"lejos","sect":[]}', estM: null });
  assert.strictEqual(G.guerraGuardada(i), null, 'guardado viejo: no carga'); assert(!('aqvila-guerra-v1' in store), 'y se borra');
  store['aqvila-guerra-v1'] = 'basura'; assert.strictEqual(G.guerraGuardada(i), null, 'basura: no rompe');
});
t('G.jugarNueva resuelve una batalla entera sin pantalla (escaramuza, maniobra y al triple)', () => {
  G.newGame('T');
  for (const [a, b] of [[{ hastati: 120 }, { hoplitas: 90 }], [ROMA, ENEM], [{ hastati: 900 }, { milicia: 200 }]]) {
    const i = info(a, b), res = G.jugarNueva(i, { bono0: 1 }); assert(res && typeof res.winner === 'number', JSON.stringify(G.planBatalla(i)));
  }
});
t('ejércitos raros: sin caballería, sin infantería de línea y muy pequeños', () => {
  for (const [a, b] of [[{ hastati: 30 }, { galos: 20 }], [{ equites: 40 }, { galos: 50 }], [{ velites: 60, hastati: 5 }, { elefantes: 4, galos: 10 }], [{ hastati: 3 }, { hoplitas: 3 }], [{ hastati: 50, vigiles: 40 }, { galos: 60 }]]) {
    const S = G.jugarGuerra(G.estadoGuerra(info(a, b), null)); assert.strictEqual(S.fase, 'fin'); G.resultadoNueva(info(a, b), Z.resumen(S), null);
  }
});

// ---------- CG4b: los modificadores de la campaña llegan al simulador ----------
t('mods: sin cfg.mods la batalla es la de siempre; con mods neutros, la misma; con ventaja, mejor', () => {
  const ej = [ROMA, { libios: 600, iberos: 300 }], sin = Z.avanzar(Z.crear({ semilla: 11, ejercitos: ej, tacticas: true }), 900);
  const neutro = Z.avanzar(Z.crear({ semilla: 11, ejercitos: ej, tacticas: true, mods: [{ atk: 1, def: 1, mor: 0 }, {}] }), 900);
  assert(!('mods' in sin), 'sin mods no se apunta nada'); delete neutro.mods; assert.strictEqual(Z.guardar(neutro), Z.guardar(sin), 'mods neutros: byte a byte igual');
  const con = Z.avanzar(Z.crear({ semilla: 11, ejercitos: ej, tacticas: true, mods: [{ atk: 1.3, def: 1.2, mor: 12 }, {}] }), 900);
  const caen = S => Z.resumen(S).bajasTotal; assert(caen(con)[0] < caen(sin)[0] && caen(con)[1] > caen(sin)[1], 'con ventaja caen menos tuyos y más suyos: ' + caen(sin) + ' → ' + caen(con));
  assert(Z.crear({ semilla: 1, ejercitos: ej, mods: [{ mor: 12 }, { mor: -10 }] }).man.every(u => Math.abs(u.moral - (u.lado ? 0.9 : 1)) < 1e-9), 'mor baja en puntos/100; la alta no pasa de 1 (frena la pérdida)');
});
t('cfgSim: lleva atkMul, defMul, mor, bisoñas, bono0 y el carácter del tribuno', () => {
  const i = info(ROMA, ENEM); Object.assign(i.cfg.sides[0], { atkMul: 1.2, defMul: 1.1, mor: 8, bis: 0.5, tribuno: { id: 1, n: 'Marco Claudio', car: 'astuto' } }); Object.assign(i.cfg.sides[1], { atkMul: 0.9, defMul: 1, mor: 0 });
  const c = G.cfgSim(i, null, 0.92);
  assert(Math.abs(c.mods[0].atk - 1.2 * 0.85 * 0.92) < 1e-9 && c.mods[0].def === 1.1 && c.mods[0].mor === 8, JSON.stringify(c.mods)); assert.strictEqual(c.mods[1].atk, 0.9);
  assert.strictEqual(c.tribunos[0][1].car, 'astuto'); assert.strictEqual(c.tribunos[0][1].n, 'Marco Claudio');
  const S = Z.crear(c); assert.strictEqual(S.tribunos[0][1].car, 'astuto'); assert(S.mods);
  assert.strictEqual(G.cfgSim(info(ROMA, ENEM), null).tribunos, undefined, 'sin tribuno: los de siempre');
});

// ---------- CG4b (ES0 §5): heridos y cautivos en la campaña ----------
// una batalla de la campaña resuelta con un resultado hecho a mano (la forma de G.resultadoNueva)
function asalto(s, cid, units, enem) {
  const c = s.cities[cid]; c.owner = 'cartago'; c.units = Object.assign({}, enem);
  s.cities.roma.units = Object.assign({}, units);
  assert(G.send('roma', cid, Object.assign({}, units), false), 'sale el ejército'); const m = s.marches.find(x => x.owner === 'roma' && x.to === cid);
  s.marches.splice(s.marches.indexOf(m), 1); s.pending.push({ kind: 'attack', m }); return G.battleInfo(s.pending[0]);
}
const r2De = (gana, filas) => ({ ganador: gana ? 0 : 1, bajas: filas, prisioneros: 0, general: null });
t('ganas: tus heridos quedan en la ciudad tomada y los del vencido pasan a esclavos de esa ciudad hasta un tercio; el resto se vende', () => {
  const s = G.newGame('T'), cid = G.neighbors('roma').find(x => x !== 'capua') || 'capua';
  const i = asalto(s, cid, { hastati: 400, principes: 200 }, { libios: 300 });
  const res = G.resultadoNueva(i, r2De(true, [
    { bando: 0, tipo: 'hastati', n0: 400, n: 380, bajas: 20, heridos: 60, muertos: 20, prisioneros: 0, recuperados: 60 },
    { bando: 0, tipo: 'principes', n0: 200, n: 200, bajas: 0, heridos: 0, muertos: 0, prisioneros: 0, recuperados: 0 },
    { bando: 1, tipo: 'libios', n0: 300, n: 0, bajas: 300, heridos: 200, muertos: 100, prisioneros: 200, recuperados: 0 }]), null);
  assert.deepStrictEqual(res.heridos[0], { hastati: 60 }); assert.strictEqual(res.surv[0].hastati, 320); assert.strictEqual(res.prisioneros, 200); assert.strictEqual(res.dead[0], 20);
  const den0 = s.res.denarios, out = G.applyBattle(res), c = s.cities[cid];
  assert(out.win && c.owner === 'roma');
  assert.strictEqual(c.units.hastati, 320, 'los heridos no vuelven de golpe (sin el 25 % de antes)'); assert.deepStrictEqual(c.heridos, { hastati: 60 });
  const cl = G.clases(c), lin = out.lines.find(l => /cautivos/.test(l)), m = lin && lin.match(/: (\d+) pasan a esclavos/), k = m ? +m[1] : 0, v = 200 - k;
  assert(lin, 'una línea de cautivos: ' + out.lines.join(' | '));
  assert(cl.esc <= cl.pop / 3 + 1, 'los esclavos no pasan de un tercio');
  assert(s.res.denarios - den0 >= v * 3, 'los que no caben se venden a 3 denarios');
  if (v > 0) assert(/se venden \(\+\d+ denarios\)/.test(lin), lin);
  assert(out.lines.some(l => /🩹 60 heridos vuelven a filas poco a poco en /.test(l)), out.lines.join(' | '));
  assert(!out.lines.some(l => /se venden como esclavos o se piden en rescate/.test(l)), 'la línea vieja se fue');
});
t('esclavos: con sitio, entran todos los cautivos y suben población y esclavos', () => {
  const s = G.newGame('T'), cid = 'capua'; const c = s.cities[cid]; c.owner = 'roma'; c.pop = 3000; c.esc = 0;
  const i = asalto(s, G.neighbors('roma').find(x => x !== 'capua'), { hastati: 300 }, { libios: 100 }); void i;
  s.cities[cid].owner = 'roma';
  const res = { winner: 0, dead: [5, 100], lost: [{ hastati: 5 }, { libios: 100 }], surv: [{ hastati: 295 }, {}], genDead: [false, false], nueva: true, prisioneros: 40, heridos: [{}, {}], cautivos: 0 };
  const tomada = s.pending[0].m.to, ct = s.cities[tomada]; ct.pop = 3000; ct.esc = 0; ct.ciu = 0;
  const out = G.applyBattle(res); void out;
  assert(s.cities[tomada].owner === 'roma'); const c2 = s.cities[tomada];
  assert(c2.esc >= 40 && c2.esc <= c2.pop / 3, 'entran los 40 cautivos (' + c2.esc + ' de ' + c2.pop + ')');
});
t('pierdes: tus heridos caen prisioneros (no vuelven)', () => {
  const s = G.newGame('T'), cid = G.neighbors('roma').find(x => x !== 'capua') || 'capua';
  const i = asalto(s, cid, { hastati: 200 }, { libios: 600 });
  const res = G.resultadoNueva(i, r2De(false, [
    { bando: 0, tipo: 'hastati', n0: 200, n: 50, bajas: 150, heridos: 70, muertos: 80, prisioneros: 70, recuperados: 0 },
    { bando: 1, tipo: 'libios', n0: 600, n: 580, bajas: 20, heridos: 30, muertos: 20, prisioneros: 0, recuperados: 30 }]), null);
  assert.deepStrictEqual(res.heridos[0], {}); assert.strictEqual(res.cautivos, 70); assert.strictEqual(res.prisioneros, 0);
  const out = G.applyBattle(res); assert(!out.win);
  assert(out.lines.some(l => /70 heridos tuyos caen prisioneros/.test(l)), out.lines.join(' | '));
  assert(!Object.values(s.cities).some(c => c.heridos), 'nadie guarda heridos');
});
t('defiendes y ganas: los heridos se curan mes a mes, más despacio cuantos más hay; se ven en la ciudad', () => {
  const s = G.newGame('T'), c = s.cities.roma; c.units = { hastati: 1000 }; c.heridos = { hastati: 100 };
  const v1 = G.curaHeridos('roma'); assert.strictEqual(v1, 28, 'pocos heridos (10 %): casi el 30 % al mes (' + v1 + ')'); assert.strictEqual(c.units.hastati, 1028); assert.strictEqual(c.heridos.hastati, 72);
  c.units = { hastati: 100 }; c.heridos = { hastati: 300 }; assert.strictEqual(G.curaHeridos('roma'), 30, 'más heridos que sanos: 10 %');
  c.heridos = { hastati: 2 }; c.units = { hastati: 1000 }; G.curaHeridos('roma'); G.curaHeridos('roma'); assert(!c.heridos, 'al final vuelven todos y el campo se va');
  c.heridos = { hastati: 50 }; const h0 = c.units.hastati; for (let k = 0; k < 80 && c.heridos; k++) G.tick(0.25);
  assert(!c.heridos && c.units.hastati >= h0 + 50 - 1, 'con el paso de los meses vuelven a filas (' + c.units.hastati + ' de ' + (h0 + 50) + ')');
  assert.deepStrictEqual(G.heridosDe('roma'), {});
});
t('si pierdes la ciudad, sus heridos se pierden', () => {
  const s = G.newGame('T'), c = s.cities.capua; c.heridos = { hastati: 80 }; c.owner = 'campanos';
  for (let k = 0; k < 6; k++) G.tick(0.25); assert(!c.heridos, 'ciudad ajena: sin heridos');
});
t('migración: una partida guardada sin heridos carga igual y un campo raro se limpia', () => {
  const s = G.newGame('T'); s.cities.roma.heridos = { hastati: 12.4, nadie: 3, triarii: -1 }; s.cities.capua.heridos = 'raro'; G.save(); G.state = null;
  assert(G.load()); assert.deepStrictEqual(G.state.cities.roma.heridos, { hastati: 12 }); assert.strictEqual(G.state.cities.capua.heridos, undefined);
  delete G.state.cities.roma.heridos; G.save(); G.state = null; assert(G.load()); assert.strictEqual(G.state.cities.roma.heridos, undefined);
});
t('una batalla entera de la campaña con el simulador: heridos y cautivos cuadran', () => {
  const s = G.newGame('T'), cid = G.neighbors('roma').find(x => x !== 'capua') || 'capua';
  const i = asalto(s, cid, { hastati: 420, principes: 300, triarii: 120 }, { libios: 200, milicia: 150 });
  const S = G.jugarGuerra(G.estadoGuerra(i, null)), res = G.resultadoNueva(i, Z.resumen(S), null), den0 = s.res.denarios, out = G.applyBattle(res);
  const her = hombres(res.heridos[0]);
  if (out.win) { assert.deepStrictEqual(G.heridosDe(cid), res.heridos[0]); if (her) assert(out.lines.some(l => /🩹/.test(l))); if (res.prisioneros) assert(out.lines.some(l => /cautivos/.test(l)) && s.res.denarios >= den0); }
  console.log('      ', out.win ? 'victoria' : 'derrota', '· heridos', her, '· cautivos', res.prisioneros, '·', out.lines.filter(l => /🩹|⛓️/.test(l)).join(' | '));
});
delete global.localStorage;
console.log(n + ' bien, ' + mal + ' mal'); process.exit(mal ? 1 : 0);
