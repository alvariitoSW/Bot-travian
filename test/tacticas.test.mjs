// AQVILA — TH1: las cuatro tácticas de la época (js/tacticas.js) dentro del simulador. node test/tacticas.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
require('../js/data.js');
const Z = require('../js/simulador.js');
const TAC = require('../js/tacticas.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const PI = Math.PI, r1 = x => Math.round(x * 10) / 10;

/* Un enfrentamiento a mano: los manípulos los manda el «jugador». tac: undefined (sin el campo), false o true */
function crear(mas, tac, fix, sem) {
  const cfg = { semilla: sem || 3, manipulos: mas.map(m => Object.assign({ mando: 'jugador' }, m)) };
  if (tac !== undefined) cfg.tacticas = tac;
  const S = Z.crear(cfg); if (fix) fix(S); return S;
}
const cargan = (ids, obj) => ids.map(i => ({ t: 0, tipo: 'cargar', ids: [i], objetivo: obj }));
const bajas = (S, lado) => S.man.filter(u => u.lado === lado).reduce((a, u) => a + u.n0 - u.n, 0);
const rompe = (S, id) => { const e = S.reg.find(e => (e.tipo === 'ruptura' || e.tipo === 'caida') && e.id === id); return e ? e.t : Infinity; };
const aviso = (S, clave) => S.reg.find(e => e.tipo === 'tactica' && e.tac === clave);
const avisos = (S, clave) => S.reg.filter(e => e.tipo === 'tactica' && e.tac === clave).length;
const sinTac = S => JSON.stringify({ man: S.man, reg: S.reg.filter(e => e.tipo !== 'tactica'), t: S.t, sem: S.sem });
const cifras = (nom, a, b, ex) => console.log('   ' + nom + ' | sin: ' + a + ' | con: ' + b + (ex ? ' | ' + ex : ''));
function corre(mas, ord, seg, tac, fix, sem) { const S = crear(mas, tac, fix, sem); Z.avanzar(S, seg, ord); return S; }

t('sin cfg.tacticas el simulador da exactamente lo de siempre (y sin S.tac)', () => {
  const ROMA = { hastati: 360, principes: 240, triarii: 120 }, GAL = { galos: 720 };
  for (const cfg of [{ semilla: 5, ejercitos: [ROMA, GAL] }]) {
    const a = Z.crear(Object.assign({}, cfg)), b = Z.crear(Object.assign({ tacticas: false }, cfg));
    Z.avanzar(a, 400); Z.avanzar(b, 400);
    assert.equal(Z.guardar(a), Z.guardar(b)); assert.ok(!a.tac && !b.tac);
    assert.ok(!a.reg.some(e => e.tipo === 'tactica'));
  }
  const m = [{ lado: 0, tropa: 'hastati', x: 0, y: -20 }, { lado: 1, tropa: 'hastati', x: 0, y: 20 }];
  assert.equal(Z.guardar(corre(m, cargan([0], 1), 100)), Z.guardar(corre(m, cargan([0], 1), 100, false)));
});

t('con tacticas: true el estado es JSON puro y guardar/cargar a mitad no cambia la batalla', () => {
  const m = [{ lado: 1, tropa: 'falange', x: 0, y: 20, forma: 'falange' }, { lado: 0, tropa: 'hastati', x: 0, y: -20 }, { lado: 0, tropa: 'hastati', x: 60, y: 20, a: PI }];
  const o = cargan([1, 2], 0), a = corre(m, o, 100, true), b = crear(m, true);
  Z.avanzar(b, 12, o); const c = Z.cargar(Z.guardar(b)); Z.avanzar(c, 88, o.map(x => Object.assign({}, x, { t: 0 })));
  assert.ok(a.tac && typeof a.tac === 'object');
  assert.equal(Z.guardar(a), Z.guardar(Z.cargar(Z.guardar(a))));
});

t('falange: atacada de frente y de flanco rompe antes y sale el aviso; solo de frente, igual', () => {
  const m = [{ lado: 1, tropa: 'falange', x: 0, y: 20, forma: 'falange' }, { lado: 0, tropa: 'hastati', x: 0, y: -20 }, { lado: 0, tropa: 'hastati', x: 60, y: 20, a: PI }];
  const o = cargan([1, 2], 0), a = corre(m, o, 120, false), b = corre(m, o, 120, true);
  cifras('falange flanqueada: ruptura (s)', r1(rompe(a, 0)), r1(rompe(b, 0)), 'bajas falange ' + Math.round(bajas(a, 1)) + '/' + Math.round(bajas(b, 1)) + ', bajas romanos ' + Math.round(bajas(a, 0)) + '/' + Math.round(bajas(b, 0)));
  assert.ok(rompe(b, 0) <= rompe(a, 0) * 0.85, 'rompe ≥15 % antes: ' + rompe(a, 0) + ' → ' + rompe(b, 0));
  assert.ok(aviso(b, 'falange') && /sarisas/.test(aviso(b, 'falange').texto)); assert.ok(!aviso(a, 'falange'));
  assert.equal(avisos(b, 'falange'), 1, 'un solo aviso');
  const f = m.slice(0, 2), fa = corre(f, cargan([1], 0), 120, false), fb = corre(f, cargan([1], 0), 120, true);
  cifras('falange solo de frente: ruptura (s)', r1(rompe(fa, 0)), r1(rompe(fb, 0)));
  assert.equal(sinTac(fa), sinTac(fb)); assert.ok(!aviso(fb, 'falange'));
});

t('galos: pegan más al principio y la furia se apaga; avisos de furia y de apagarse', () => {
  const m = [{ lado: 1, tropa: 'galos', x: 0, y: 20, n: 600 }, { lado: 0, tropa: 'hastati', x: 0, y: -20, n: 600 }];
  /* tramos desde el primer contacto (t0): 0-20, 20-40, 40-80. Los dos bandos se mantienen firmes para que la lucha dure. */
  const tramos = tac => {
    const S = crear(m, tac); Z.avanzar(S, 1, cargan([1], 0)); while (!S.man.some((u, i) => S.cont[i].length) && S.t < 60) Z.avanzar(S, 0.2);
    const t0 = S.t, res = []; let ant = S.man[1].n;
    for (const fin of [20, 40, 100]) { while (S.t < t0 + fin && S.fase !== 'fin') { for (const u of S.man) { u.moral = 1; u.fatiga = Math.min(u.fatiga, 0.6); } Z.avanzar(S, 0.2); } res.push(r1(ant - S.man[1].n)); ant = S.man[1].n; }
    return { res, S };
  };
  const a = tramos(false), b = tramos(true);
  cifras('galos: bajas de los hastati por tramo (0-20, 20-40, 40-100 s del choque)', a.res.join('/'), b.res.join('/'));
  assert.ok(b.res[0] > a.res[0], 'a los 20 s los hastati tienen más bajas con tácticas');
  assert.ok(b.res[2] < a.res[2], 'tras t0+40 la ventaja gala es menor');
  assert.ok(/Furia gala/.test(aviso(b.S, 'galos').texto)); assert.ok(b.S.reg.some(e => e.tac === 'galos-fin' && /se apaga/.test(e.texto)));
  assert.equal(avisos(b.S, 'galos'), 1); assert.equal(avisos(b.S, 'galos-fin'), 1);
  /* y la regla pura: ×1,4 hasta 20 s, rampa a ×0,8 hasta 40 s, ×0,8 después */
  const S = { t: 0, tac: { 0: { t0: 0 } } }, u = { id: 0, tropa: 'galos' }, f = s => { S.t = s; return TAC.golpe(S, u); };
  assert.equal(f(10), 1.4); assert.ok(Math.abs(f(30) - 1.1) < 1e-9); assert.ok(Math.abs(f(50) - 0.8) < 1e-9);
});

t('triarios: con los hastati hechos pedazos se alzan, aguantan más y sale «Res ad triarios»', () => {
  const m = [{ lado: 0, tropa: 'hastati', x: -200, y: -100 }, { lado: 0, tropa: 'hastati', x: 200, y: -100 }, { lado: 0, tropa: 'triarii', x: 0, y: -20, moral: 0.7 }, { lado: 1, tropa: 'libios', x: 0, y: 20 }];
  const fix = S => { S.man[0].n = 30; S.man[1].n = 30; };
  const o = cargan([3], 2), a = corre(m, o, 300, false, fix), b = corre(m, o, 300, true, fix);
  cifras('triarios: ruptura (s)', r1(rompe(a, 2)), r1(rompe(b, 2)), 'bajas triarios ' + Math.round(bajas(a, 0)) + '/' + Math.round(bajas(b, 0)) + ', bajas libios ' + Math.round(bajas(a, 1)) + '/' + Math.round(bajas(b, 1)));
  assert.ok(rompe(b, 2) > rompe(a, 2), 'con tácticas aguantan más');
  assert.ok(/Res ad triarios/.test(aviso(b, 'triarios').texto)); assert.equal(avisos(b, 'triarios'), 1);
  const sano = [{ lado: 0, tropa: 'hastati', x: -200, y: -100 }].concat(m.slice(2));
  const c = corre(sano, cargan([2], 1), 100, true); assert.ok(!aviso(c, 'triarios'), 'con los hastati sanos no se alzan');
});

t('envolvimiento: un manípulo atacado por tres lados rompe antes, cae copado y salen los avisos', () => {
  const m = [{ lado: 0, tropa: 'hastati', x: 0, y: 0 }, { lado: 1, tropa: 'hastati', x: 0, y: 30, a: -PI / 2 }, { lado: 1, tropa: 'hastati', x: -45, y: 0, a: 0 }, { lado: 1, tropa: 'hastati', x: 45, y: 0, a: PI }];
  const o = cargan([1, 2, 3], 0), a = corre(m, o, 200, false), b = corre(m, o, 200, true);
  cifras('envuelto: ruptura (s)', r1(rompe(a, 0)), r1(rompe(b, 0)), 'bajas del envuelto ' + Math.round(bajas(a, 0)) + '/' + Math.round(bajas(b, 0)));
  assert.ok(rompe(b, 0) < rompe(a, 0), 'rompe antes con tácticas');
  assert.ok(bajas(b, 0) > 1.3 * bajas(a, 0), 'copados: rodeados, caen muchos más al romper');
  assert.ok(/no tienen por dónde huir/.test(aviso(b, 'copados').texto));
  assert.ok(/envueltos/.test(aviso(b, 'envuelto').texto)); assert.equal(avisos(b, 'envuelto'), 1);
});

t('activas() y multiplicadores valen 1 sin S.tac', () => {
  const S = { man: [], t: 0 }, u = { id: 0, tropa: 'galos' };
  assert.equal(TAC.golpe(S, u), 1); assert.equal(TAC.recibe(S, u, 'frente'), 1); assert.equal(TAC.moral(S, u), 1); assert.deepEqual(TAC.activas(S, u), []);
  assert.ok(TAC.CIFRAS.galos && TAC.CIFRAS.triarios && TAC.CIFRAS.falange && TAC.CIFRAS.envuelto);
});

console.log('\n' + n + ' bien, ' + mal + ' mal'); process.exit(mal ? 1 : 0);
