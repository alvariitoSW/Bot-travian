// AQVILA — CG4b (pase de CG9): cada tropa tiene en js/registro.js lo que lleva, con fuente y dictamen, y coincide con js/tropas.js. node test/registro-lleva.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const R = require('../js/registro.js'), T = require('../js/tropas.js'), D = require('../js/data.js');
const DICT = ['historico', 'probable', 'licencia de juego'];
let n = 0;
for (const id of Object.keys(D.UNITS)) {
  if (id === 'general') continue;   // pieza de juego: sin «Lleva…» en CG9-fuentes.md
  const fi = R.fichas.tropa[id], l = fi && fi.historia && fi.historia.lleva;
  assert(l, 'falta lo que lleva ' + id);
  assert(/^Lleva /.test(l.texto) && l.texto.length <= 140, id + ': texto «Lleva…» de hasta 140 letras');
  assert(l.fuente && DICT.includes(l.dictamen), id + ': fuente y dictamen');
  assert.strictEqual(l.texto, T.DATOS[id].lleva, id + ': el mismo texto que js/tropas.js');
  n++;
}
const hs = Object.values(R.fichas.tropa).map(f => f.historia); assert.strictEqual(new Set(hs).size, hs.length, 'cada ficha tiene su propia historia (nada compartido)');
console.log('registro-lleva: ' + n + ' tropas bien');
