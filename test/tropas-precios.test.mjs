// AQVILA — CG9 pieza C: prueba rápida de precios y de la pareja entre pueblos. node test/tropas-precios.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
require('../js/data.js');
const Z = require('../js/simulador.js');
const Tropas = require('../js/tropas.js');
import { TIPICO } from './tropas-precios.mjs';
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }

const TROPAS = ['hastati', 'principes', 'triarii', 'velites', 'equites', 'libios', 'honderos', 'numidas', 'elefantes', 'iberos', 'sagrada', 'falange', 'hoplitas', 'peltastas', 'tesalios', 'galos', 'jinetes'];
/* Con el mismo dinero: el típico escalado a la bolsa (en hombres) */
export function ejercito(pueblo, bolsa) {
  const tip = TIPICO[pueblo], coste = Object.entries(tip).reduce((a, [k, m]) => a + m * Tropas.precio(k, pueblo, 'curtido'), 0), f = bolsa / coste, ej = {};
  for (const k in tip) ej[k] = Math.max(1, Math.round(tip[k] * (Z.TAM[k] || 120) * f));
  return ej;
}
export function pareja(otro, sem, bolsa) {
  let g = 0;
  for (let s = 1; s <= sem; s++) {
    const sem = s * 7 + 1, inv = sem % 2 === 0, a = ejercito('roma', bolsa), b = ejercito(otro, bolsa);   /* se alternan los lados: el sesgo se anula */
    const S = Z.crear({ semilla: sem, ejercitos: Object.assign(inv ? [b, a] : [a, b], { pueblos: inv ? [otro, 'roma'] : ['roma', otro] }) });
    Z.avanzar(S, 900); const v = S.resultado && S.resultado.como === 'victoria'; if (inv ? !v : v) g++;
  }
  return g;
}

if (process.argv[1].endsWith('precios.test.mjs')) t('PRECIO tiene las 17 tropas jugables con números ≥150', () => {
  for (const k of TROPAS) assert.ok(Tropas.PRECIO[k] >= 150, k + ' ' + Tropas.PRECIO[k]);
  assert.strictEqual(TROPAS.length, 17);   /* los 20 puestos de los pueblos repiten falange, peltastas, tesalios, elefantes, honderos, iberos, jinetes */
});
if (process.argv[1].endsWith('precios.test.mjs')) t('precio aplica la veteranía', () => {
  const [a, b, c] = ['novato', 'curtido', 'veterano'].map(v => Tropas.precio('hastati', 'roma', v));
  assert.ok(c > b && b > a, a + ' ' + b + ' ' + c);
  assert.strictEqual(b, Tropas.PRECIO.hastati);
});
if (process.argv[1].endsWith("precios.test.mjs")) {
  const res = {};
  for (const o of ['cartago', 'epiro', 'macedonia', 'galos', 'iberos', 'roma']) res[o] = pareja(o, 8, Tropas.BOLSAS.mediana);
  console.log('Roma gana de 8, mismo dinero (' + Tropas.BOLSAS.mediana + '):', JSON.stringify(res));
  t('a igual dinero Roma contra Cartago gana entre 2 y 6 de 8', () => assert.ok(res.cartago >= 2 && res.cartago <= 6, 'ganó ' + res.cartago));
  t('a igual dinero Roma contra galos gana entre 2 y 6 de 8', () => assert.ok(res.galos >= 2 && res.galos <= 6, 'ganó ' + res.galos));
}
if (process.argv[1].endsWith('precios.test.mjs')) { console.log(n + ' bien, ' + mal + ' mal'); process.exit(mal ? 1 : 0); }
