/* Cada subida escribe sus novedades: la primera versión de js/novedades.js debe ser la de la caché de sw.js. */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url), N = req('../js/novedades.js');
const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), m = sw.match(/const CACHE = 'aqvila-v(\d+)'/);
const fallos = [];
if (!m) fallos.push('no encuentro la versión de la caché en sw.js');
else if (N[0].v !== +m[1]) fallos.push('sw.js está en v' + m[1] + ' y js/novedades.js empieza por v' + N[0].v + ': escribe las novedades de esta subida');
for (const e of N) if (!e.cosas || e.cosas.length < 1 || e.cosas.length > 6) fallos.push('v' + e.v + ': entre 1 y 6 frases');
if (!/js\/novedades\.js/.test(sw)) fallos.push('js/novedades.js no está en FILES de sw.js');
if (fallos.length) { console.log('FALLO novedades:\n  ' + fallos.join('\n  ')); process.exit(1); }
console.log('novedades: v' + N[0].v + ' coincide con la caché. OK');
