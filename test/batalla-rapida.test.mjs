// AQVILA — CG7: la batalla rápida (tres rondas sobre el simulador), sin pantalla. node test/batalla-rapida.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
require('../js/data.js');
const Z = require('../js/simulador.js');
const BR = require('../js/batalla-rapida.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }

const ROMA = { hastati: 480, principes: 480, triarii: 240, velites: 300, equites: 120 };
const GALOS = { galos: 1500, jinetes: 200 };
const cfg = (sem, r, g) => ({ semilla: sem || 5, ejercitos: [r || ROMA, g || GALOS] });
const jugar = (R, antes) => { for (let i = 0; i < BR.RONDAS && R.fase !== 'fin'; i++) { if (antes) antes(R, i); BR.mirar(R); BR.saltar(R); } return R; };
const bajas = r => JSON.stringify(r.bajasTotal);

t('tres rondas de mirar y saltar acaban en fin con un resumen completo', () => {
  const R = jugar(BR.crear(cfg()));
  assert.equal(R.fase, 'fin');
  const r = BR.resumen(R);
  assert.ok(r.ganador === 0 || r.ganador === 1);
  assert.equal(typeof r.victoria, 'boolean');
  assert.ok(Array.isArray(r.bajas) && r.bajas.length && r.bajasTotal.length === 2 && r.estado);
});

t('cada ronda avanza SEG segundos salvo la última', () => {
  const R = BR.crear(cfg());
  for (let i = 1; i < BR.RONDAS; i++) {
    const t0 = R.S.t; assert.equal(R.ronda, i); BR.mirar(R); BR.saltar(R);
    assert.ok(Math.abs(R.S.t - t0 - BR.SEG) < 0.21, 'ronda ' + i + ': ' + (R.S.t - t0));
    assert.equal(R.fase, 'planear');
  }
  assert.equal(R.ronda, BR.RONDAS); BR.mirar(R); BR.saltar(R); assert.equal(R.fase, 'fin');
});

t('las cinco órdenes de ala y de unidad se aceptan al empezar; fuera de planear, no', () => {
  for (const o of BR.ORDENES) {
    const R = BR.crear(cfg());
    for (let a = 0; a < 3; a++) assert.equal(BR.ordenarAla(R, a, o.k), '', 'ala ' + o.k);
    const id = BR.grupos(R)[1].ids[0];
    assert.equal(BR.ordenarUnidad(R, id, o.k), '', 'unidad ' + o.k);
    assert.equal(BR.ordenarUnidad(R, id, 'ala'), '');
    assert.ok(!(id in R.ordUni));
  }
  const R = BR.crear(cfg()); BR.mirar(R);
  assert.ok(BR.ordenarAla(R, 0, 'cargar').length > 0);
  assert.ok(BR.ordenarUnidad(R, 0, 'aguantar').length > 0);
});

t('determinismo: misma semilla y órdenes, mismas bajas', () => {
  const f = () => bajas(BR.resumen(jugar(BR.crear(cfg(9)), (R, i) => { if (i === 0) { BR.ordenarAla(R, 0, 'flanquear'); BR.ordenarAla(R, 1, 'aguantar'); } })));
  assert.equal(f(), f());
});

t('resolver(cfg) es igual a crear + avanzar(limite) + resumen', () => {
  const S = Z.crear(cfg(4)); Z.avanzar(S, S.limite);
  const a = Z.resumen(S), b = BR.resolver(cfg(4));
  assert.equal(bajas(a), bajas(b)); assert.equal(a.victoria, b.victoria); assert.equal(a.t, b.t);
});

t('retirarse con todas las alas en la ronda 1 no da victoria', () => {
  const R = BR.crear(cfg());
  for (let a = 0; a < 3; a++) BR.ordenarAla(R, a, 'retirarse');
  jugar(R);
  assert.equal(R.fase, 'fin'); assert.equal(BR.resumen(R).victoria, false);
});

t('cargar con todas las alas cambia el resultado respecto a no tocar nada', () => {
  const base = BR.resumen(jugar(BR.crear(cfg())));
  const R = BR.crear(cfg()); for (let a = 0; a < 3; a++) BR.ordenarAla(R, a, 'cargar');
  const car = BR.resumen(jugar(R));
  assert.notEqual(bajas(base), bajas(car));
});

t('un ala vacía no rompe grupos ni ordenarAla', () => {
  const R = BR.crear(cfg(3, { hastati: 120 }));
  const g = BR.grupos(R), vacias = g.filter(x => !x.ids.length);
  assert.equal(g.length, 3); assert.ok(vacias.length >= 1, 'debería haber un ala vacía');
  for (const v of vacias) { assert.equal(v.hombres, 0); const m = BR.ordenarAla(R, v.ala, 'avanzar'); assert.ok(typeof m === 'string' && m.length > 0); }
  const llena = g.find(x => x.ids.length); assert.equal(BR.ordenarAla(R, llena.ala, 'aguantar'), '');
  jugar(R); assert.equal(R.fase, 'fin');
});

t('avanzar a pasos de 0,05 llega al mismo sitio que saltar (sin perder ni duplicar tiempo)', () => {
  const A = BR.crear(cfg(2)), B = BR.crear(cfg(2));
  BR.mirar(A); BR.mirar(B); BR.saltar(A);
  let i = 0; while (B.fase === 'mirar' && i++ < 5000) BR.avanzar(B, 0.05);
  assert.equal(B.fase, 'planear'); assert.equal(B.ronda, 2);
  assert.ok(Math.abs(A.S.t - B.S.t) < 1e-6, A.S.t + ' vs ' + B.S.t);
  assert.equal(JSON.stringify(Z.vista(A.S)), JSON.stringify(Z.vista(B.S)));
});

console.log(n + ' bien, ' + mal + ' mal');
if (mal) process.exit(1);
