// AQVILA — medida de la regla 4.16 (I5c): cada efecto de guerra del Saber, SOLO, a su valor máximo permitido, mueve ≤ 10 puntos el % de victoria
// en una pelea pareja (480 hastati contra 480 hastati, 80 semillas). Uso: node tools/calibra-combate.mjs [--n 80]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const { Battle } = require('../js/battle.js');
const N = +(process.argv[process.argv.indexOf('--n') + 1]) || 80, HAST = 480, T = D.SABER.techos, IV = D.INVEST;
const lado = x => Object.assign({ units: { hastati: HAST }, name: 'x', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, x || {});
const pct = (defender, wall, a, b) => { let g = 0; for (let s = 1; s <= N; s++) { const bt = new Battle({ sides: [lado(a), lado(b)], defender, wall, seed: s }); bt.finish(); if (bt.result().winner === 0) g++; } return Math.round(100 * g / N); };
const ef = id => IV[id].ef;
// atacante A (lado 0) contra defensor en muralla 4; con defensor A (defender 0) para defMuro
const CASOS = [
  { n: 'mor (techo +' + T.mor + ')', sin: () => pct(1, 0), con: () => pct(1, 0, { mor: T.mor }) },
  { n: 'atk (techo ×' + T.atk + ')', sin: () => pct(1, 0), con: () => pct(1, 0, { atkMul: T.atk }) },
  { n: 'atkMar (corvus ×' + ef('corvus').atkMar + ', por mar)', sin: () => pct(1, 0), con: () => pct(1, 0, { atkMul: Math.min(T.atk, ef('corvus').atkMar) }) },
  { n: 'atkMar sin mar (no actúa)', sin: () => pct(1, 0), con: () => pct(1, 0, { atkMul: 1 }) },
  { n: 'defMuro (arquimedes, muralla 4)', sin: () => pct(0, 4), con: () => pct(0, 4, { defMul: 1 + ef('arquimedes').defMuro * 4 }) },
  { n: 'brecha (sambuca, muralla 4)', sin: () => pct(1, 4), con: () => pct(1, 4, null, { defMul: (1 + 0.1 * Math.max(0, 4 - ef('sambuca').brecha)) / (1 + 0.1 * 4) }) }
];
console.log('Regla 4.16: efecto, % sin, % con, diferencia (n=' + N + ')'); let mal = 0;
for (const c of CASOS) { const a = c.sin(), b = c.con(), d = b - a; if (Math.abs(d) > 10) mal++; console.log('  ' + c.n.padEnd(40) + String(a).padStart(4) + ' %' + String(b).padStart(5) + ' %' + String((d >= 0 ? '+' : '') + d).padStart(5) + (Math.abs(d) > 10 ? '  SE PASA' : '')); }
console.log(mal ? 'FALLA: ' + mal + ' efecto(s) pasan de 10 puntos' : 'APTO: todos ≤ 10 puntos');
process.exit(mal ? 1 : 0);
