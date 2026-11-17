// AQVILA — GC4: la Guerra dentro del juego (G.estadoGuerra, el bot, guardar a mitad). node test/guerra-juego.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); const R = require('../js/guerra.js');
const store = {}; global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const info = (u0, u1, seed = 77) => ({ city: 'capua', kind: 'attack', cfg: { seed, defender: 1, wall: 1, sides: [{ name: 'Roma', units: u0 }, { name: 'Enemigo', units: u1 }] } });
const ROMA = { hastati: 360, principes: 360, triarii: 180, equites: 60 }, ENEM = { galos: 690, libios: 780, iberos: 690, numidas: 60 };
G.newGame('T');

t('estadoGuerra: reparte los ejércitos de la ciudad y es la misma batalla con la misma semilla', () => {
  const a = G.estadoGuerra(info(ROMA, ENEM), null), b = G.estadoGuerra(info(ROMA, ENEM), null);
  assert.strictEqual(a.fase, 'lejos'); assert.deepStrictEqual(a.n0[0], ROMA); assert.deepStrictEqual(a.n0[1], ENEM);
  assert.strictEqual(R.guardar(a), R.guardar(b));
  assert.notStrictEqual(R.guardar(a), R.guardar(G.estadoGuerra(info(ROMA, ENEM, 78), null)));
});
t('estadoGuerra: con choque de maniobra usa los ejércitos del choque, no los de la ciudad', () => {
  const ch = { sides: [{ units: { hastati: 100, principes: 80 } }, { units: { galos: 150 } }] };
  const e = G.estadoGuerra(info(ROMA, ENEM), ch); assert.deepStrictEqual(e.n0[0], { hastati: 100, principes: 80 }); assert.deepStrictEqual(e.n0[1], { galos: 150 });
});
t('el bot juega hasta el final y G.resultadoNueva da la forma que espera applyBattle', () => {
  const i = info(ROMA, ENEM), B = G.jugarGuerra(G.estadoGuerra(i, null)); assert.strictEqual(B.fase, 'fin');
  const res = G.resultadoNueva(i, R.resumen(B), null);
  assert(res.nueva && res.dead.length === 2 && typeof res.winner === 'number' && res.dead[0] + res.dead[1] > 0);
  for (const k in res.lost[0]) assert(res.lost[0][k] <= ROMA[k]);
});
t('el bot gana casi siempre a un enemigo parejo (el motor está calibrado así)', () => {
  let g = 0; for (let s = 1; s <= 12; s++) { const B = G.jugarGuerra(G.estadoGuerra(info(ROMA, ENEM, s * 131), null)); if (B.resultado.como === 'victoria') g++; }
  assert(g >= 9, 'ganó ' + g + ' de 12');
});
t('guardar a mitad y cargar da el mismo final (con el mismo bot)', () => {
  const i = info(ROMA, ENEM, 5), A = G.estadoGuerra(i, null); let prox = 0;
  const jugar = (B, hasta) => { while (B.fase !== 'fin' && B.t < hasta) { if (B.t >= prox) { G.botGuerra(B); prox = B.t + 1.5; } R.paso(B, 0.1); } };
  jugar(A, 40); const prox40 = prox; G.guardarGuerra(i, A, { x: 1 });
  const resto = G.guerraGuardada(i); assert(resto && resto.estado.t === A.t && resto.estM.x === 1);
  const Z = G.estadoGuerra(i, null); prox = 0; jugar(Z, 1e9);
  const C = resto.estado; prox = prox40; jugar(C, 1e9);   // el bot decide justo igual que si no hubiera pausa
  assert.strictEqual(R.guardar(C), R.guardar(Z), 'otro final tras recargar');
});
t('la partida a medias es de su batalla: otra batalla no la ve, y se borra', () => {
  const i = info(ROMA, ENEM, 9); G.guardarGuerra(i, G.estadoGuerra(i, null), null);
  assert(G.guerraGuardada(i)); assert.strictEqual(G.guerraGuardada(info(ROMA, ENEM, 10)), null); assert.strictEqual(G.guerraGuardada(Object.assign({}, i, { city: 'roma' })), null);
  G.borrarGuerra(); assert.strictEqual(G.guerraGuardada(i), null);
  G.guardarGuerra(i, G.estadoGuerra(i, null), null); G.newGame('T'); assert.strictEqual(G.guerraGuardada(i), null, 'una partida nueva la borra');
});
t('G.jugarNueva resuelve una batalla entera sin pantalla (escaramuza, maniobra y al triple)', () => {
  const s = G.newGame('T'); void s;
  for (const [a, b] of [[{ hastati: 120 }, { hoplitas: 90 }], [ROMA, ENEM], [{ hastati: 900 }, { milicia: 200 }]]) {
    const i = info(a, b), res = G.jugarNueva(i, { bono0: 1 }); assert(res && typeof res.winner === 'number', JSON.stringify(G.planBatalla(i)));
  }
});
t('ejércitos raros: sin caballería, sin infantería de línea y muy pequeños', () => {
  for (const [a, b] of [[{ hastati: 30 }, { galos: 20 }], [{ equites: 40 }, { galos: 50 }], [{ velites: 60, hastati: 5 }, { elefantes: 4, galos: 10 }], [{ hastati: 3 }, { hoplitas: 3 }]]) {
    const B = G.jugarGuerra(G.estadoGuerra(info(a, b), null)); assert.strictEqual(B.fase, 'fin'); G.resultadoNueva(info(a, b), R.resumen(B), null);
  }
});
delete global.localStorage;
console.log(n + ' bien, ' + mal + ' mal'); process.exit(mal ? 1 : 0);
