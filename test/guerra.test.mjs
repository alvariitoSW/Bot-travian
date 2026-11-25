// AQVILA — CG4b: lo que queda de js/guerra.js (las tablas de tropa que lee el simulador). node test/guerra.test.mjs
// El motor de la batalla vieja y sus pruebas se retiraron en CG4b: la campaña juega con js/simulador.js (test/simulador.test.mjs).
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js');
const R = require('../js/guerra.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }

t('solo quedan las tablas: sin motor (crear, paso, ordenar…)', () => {
  assert.deepStrictEqual(Object.keys(R).sort(), ['CARACTER', 'GENERICO', 'POSTURAS', 'TIRO', 'tiroDe']);
});
t('CARACTER: cada tropa es de verdad y trae calidad, cansancio y mente', () => {
  for (const k in R.CARACTER) {
    const c = R.CARACTER[k]; assert.ok(D.UNITS[k], 'tropa ' + k);
    assert.ok(c.cal > 0 && c.cal < 2 && c.cansa > 0 && c.cansa < 3, k);
    assert.ok(['furia', 'paciencia', 'media'].includes(c.mente), k);
  }
  assert.deepStrictEqual(R.GENERICO, { cal: 1.0, cansa: 1.0, mente: 'media' });
});
t('CARACTER: los rasgos de las fuentes (falange se hunde de flanco; galos, furia; triarios, firmes)', () => {
  assert.ok(R.CARACTER.falange.flanco > 1 && R.CARACTER.falange.firme);
  assert.strictEqual(R.CARACTER.galos.mente, 'furia'); assert.ok(R.CARACTER.galos.cansa > R.CARACTER.hastati.cansa);
  assert.ok(R.CARACTER.triarii.firme); assert.ok(R.CARACTER.elefantes.pavor);
});
t('POSTURAS: el testudo protege más que los escudos y cansa más; avanzar no protege', () => {
  const P = R.POSTURAS;
  assert.ok(P.testudo.recibe < P.escudos.recibe && P.escudos.recibe < P.avanzar.recibe);
  assert.ok(P.testudo.cansa > P.escudos.cansa && P.avanzar.cansa === 0);
  assert.ok(P.testudo.paso < P.escudos.paso && P.escudos.paso < P.avanzar.paso);
});
t('tiroDe: honderos tiran más lejos; la tropa sin ficha, jabalinas a 30 m', () => {
  assert.ok(R.tiroDe('honderos').alc > R.tiroDe('velites').alc);
  assert.deepStrictEqual([R.tiroDe('nadie').arma, R.tiroDe('nadie').alc], ['jabalinas', 30]);
  for (const k in R.TIRO) assert.ok(D.UNITS[k] && D.UNITS[k].cls === 'rng', 'tirador ' + k);
});
t('el simulador lee estas mismas tablas (no copias que se desvíen): honderos que hieren más, más bajas romanas', () => {
  const Sm = require('../js/simulador.js'), EJ = [{ hastati: 240, principes: 240, triarii: 120 }, { galos: 500, honderos: 300 }];
  const juega = () => { const S = Sm.crear({ semilla: 3, ejercitos: EJ }); Sm.avanzar(S, 400); assert.strictEqual(S.fase, 'fin'); return Sm.resumen(S).bajasTotal[0]; };
  const antes = juega(), tiro = R.TIRO.honderos.tiro;
  R.TIRO.honderos.tiro = tiro * 6; let fuerte; try { fuerte = juega(); } finally { R.TIRO.honderos.tiro = tiro; }
  assert.ok(fuerte > antes, antes + ' → ' + fuerte); assert.strictEqual(juega(), antes, 'vuelve igual al restaurar');
});

console.log(mal ? 'MAL: ' + mal + ' de ' + (n + mal) : 'APTO: ' + n + ' comprobaciones');
process.exit(mal ? 1 : 0);
