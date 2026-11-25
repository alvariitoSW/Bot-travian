// AQVILA — PN3e: equilibrio de la partida de polis con el bot de polis (test/polis-bot.js). node test/polis-equilibrio.mjs
// Vara (usuario, «5B»: no se relaja): con el bot que compra hierro, tu polis no cae antes de los 15 años en ninguna de 5 semillas.
// Se prueban Atenas, Esparta y Calcis (la única con veta) y Mégara (la de leva más ligera). --todas: las 8. --sin: también sin comprar hierro (solo informa).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { jugarPolis } = require('./polis-bot.js');
const todas = process.argv.includes('--todas'), sin = process.argv.includes('--sin');
const POLIS = todas ? ['atenas', 'esparta', 'corinto', 'argos', 'tebas', 'megara', 'mileto', 'calcis'] : ['atenas', 'esparta', 'megara', 'calcis'];
const SEMILLAS = [1, 2, 3, 4, 5], ANOS = 15;
let mal = 0;
for (const compra of sin ? [true, false] : [true]) {
  console.log(compra ? '— comprando hierro —' : '— sin comprar hierro (solo informa) —');
  for (const p of POLIS) {
    const r = SEMILLAS.map(sem => jugarPolis(p, sem, { anos: ANOS, compraHierro: compra }));
    const caidas = r.filter(x => x.cae != null), h = r.map(x => x.hombres);
    console.log((caidas.length && compra ? 'MAL ' : 'bien ') + p.padEnd(8) + ' hombres a los ' + ANOS + ' años: ' + Math.min(...h) + '–' + Math.max(...h) +
      ' · hierro comprado ' + Math.min(...r.map(x => x.hierro)) + '–' + Math.max(...r.map(x => x.hierro)) + (r[0].veta ? ' · con veta' : '') +
      (caidas.length ? ' · cae en ' + caidas.map(x => x.cae + ' a.C. (sem. ' + x.semilla + ')').join(', ') : ''));
    if (compra && caidas.length) mal++;
  }
}
console.log(mal ? 'POLIS-EQUILIBRIO: NO APTO (' + mal + ' polis caen antes de ' + ANOS + ' años)' : 'POLIS-EQUILIBRIO: APTO');
process.exit(mal ? 1 : 0);
