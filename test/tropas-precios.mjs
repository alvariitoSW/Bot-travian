// AQVILA — CG9 pieza C: el bot de precios. El precio sale de batallas, no del gusto.
// Uso: node test/tropas-precios.mjs [--escribir] [--semillas=12]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
require('../js/data.js');
const Z = require('../js/simulador.js');
const Tropas = require('../js/tropas.js');
const SEM = +((process.argv.find(a => a.startsWith('--semillas=')) || '').split('=')[1] || 12);
const PUEBLOS = { roma: ['hastati', 'principes', 'triarii', 'velites', 'equites'], cartago: ['libios', 'honderos', 'numidas', 'elefantes', 'iberos', 'sagrada'],
  epiro: ['falange', 'hoplitas', 'peltastas', 'tesalios', 'elefantes'], macedonia: ['falange', 'peltastas', 'tesalios'], galos: ['galos', 'jinetes'], iberos: ['iberos', 'honderos', 'jinetes'] };
export const TIPICO = {
  roma: { hastati: 4, principes: 4, triarii: 3, velites: 3, equites: 2 },
  cartago: { libios: 4, honderos: 3, numidas: 2, elefantes: 1, iberos: 3, sagrada: 3 },
  epiro: { falange: 5, hoplitas: 5, peltastas: 3, tesalios: 2, elefantes: 1 },
  macedonia: { falange: 8, peltastas: 5, tesalios: 3 },
  galos: { galos: 13, jinetes: 3 },
  iberos: { iberos: 7, honderos: 6, jinetes: 3 } };
export const TROPAS = ['hastati', 'principes', 'triarii', 'velites', 'equites', 'libios', 'honderos', 'numidas', 'elefantes', 'iberos', 'sagrada', 'falange', 'hoplitas', 'peltastas', 'tesalios', 'galos', 'jinetes'];
const casa = t => Object.keys(PUEBLOS).find(p => PUEBLOS[p].includes(t));
const tam = t => Z.TAM[t] || 120;

/* Reparte hombres en manípulos de su tamaño (el último, incompleto): el simulador recibe {tropa: hombres} */
/* true si gana el ejército medido (ej[1]); la semilla impar lo pone en el lado 1 y la par en el 0, para que el sesgo de lado se anule */
export function gana(ej, pueblos, sem) {
  const inv = sem % 2 === 0, e = inv ? [ej[1], ej[0]] : ej, p = inv ? [pueblos[1], pueblos[0]] : pueblos;
  const S = Z.crear({ semilla: sem, ejercitos: Object.assign(e, { pueblos: p }) });
  Z.avanzar(S, 900);
  const v = !!S.resultado && S.resultado.como === 'victoria';
  return inv ? v : !v;
}
export function tasa(ej, pueblos, n) { let g = 0; for (let s = 1; s <= n; s++) if (gana(ej, pueblos, s * 7 + 1)) g++; return g / n; }

const REF1 = { hastati: 480 }, REF2 = { hastati: 360, velites: 120, equites: 60 };
const suma = o => Object.values(o).reduce((a, b) => a + b, 0);
/* Menor número de hombres de la tropa que empata (>=50 %) contra la referencia */
function necesarios(t, ref) {
  const p = casa(t); let lo = 5, hi = 3000;
  const ok = n => tasa([ref, { [t]: n }], ['roma', p], SEM) >= 0.5;
  while (lo < hi) { const m = (lo + hi) >> 1; if (ok(m)) hi = m; else lo = m + 1; }
  return lo;
}
const r50 = x => Math.round(x / 50) * 50;

if (process.argv[1] && process.argv[1].endsWith('tropas-precios.mjs')) {
  const filas = {}, t0 = Date.now();
  let base1 = suma(REF1), base2 = suma(REF2);   /* se recalibran con los hastati medidos: hastati vale siempre 1,00 */
  console.log('tropa      n(línea) n(mixta)  valor/hombre  hombres/manípulo  precio');
  for (const t of TROPAS) {
    const n1 = necesarios(t, REF1), n2 = necesarios(t, REF2);
    if (t === 'hastati') { base1 = n1; base2 = n2; }
    const mixta = ['equites', 'jinetes', 'numidas', 'tesalios', 'velites', 'honderos', 'peltastas'].includes(t);
    const v1 = base1 / n1, v2 = base2 / n2, v = mixta ? (v1 + v2) / 2 : v1;
    const precio = Math.max(150, r50(700 * v * tam(t) / 120));
    filas[t] = precio;
    console.log(t.padEnd(10), String(n1).padStart(8), String(n2).padStart(9), v.toFixed(2).padStart(13), String(tam(t)).padStart(16), String(precio).padStart(10), mixta ? ' (media)' : '');
  }
  /* Fase 2 («Normal»): factor por pueblo para que, con el mismo dinero, su ejército típico empate con la Roma típica */
  const BOLSA = Tropas.BOLSAS.mediana, PP = {}, FACT = {};   /* la misma bolsa que juzga la prueba */
  const pr = (t, f) => Math.max(150, r50(filas[t] * f));
  const ejTip = (p, f) => { const tip = TIPICO[p], c = Object.entries(tip).reduce((a, [k, m]) => a + m * pr(k, f), 0), r = BOLSA / c, ej = {}; for (const k in tip) ej[k] = Math.max(1, Math.round(tip[k] * tam(k) * r)); return ej; };
  const romaTip = ejTip('roma', 1);
  for (const p of Object.keys(PUEBLOS).filter(x => x !== 'roma')) {
    let lo = 0.5, hi = 2;
    for (let i = 0; i < 8; i++) { const f = (lo + hi) / 2; const g = tasa([romaTip, ejTip(p, f)], ['roma', p], 16); if (g >= 0.5) lo = f; else hi = f; }   // más precio = menos hombres = menos victorias
    FACT[p] = (lo + hi) / 2; console.log('factor', p, FACT[p].toFixed(2));
  }
  for (const p in PUEBLOS) { PP[p] = {}; for (const t of PUEBLOS[p]) PP[p][t] = pr(t, FACT[p] || 1); }
  const coste = p => Object.entries(TIPICO[p]).reduce((a, [k, m]) => a + m * PP[p][k], 0);
  const media = Object.keys(PUEBLOS).reduce((a, p) => a + coste(p), 0) / 6, med = Math.round(media / 500) * 500;
  console.log('coste típico 16 manípulos:', Object.keys(PUEBLOS).map(p => p + ' ' + coste(p)).join(', '), '| media', Math.round(media), '→ bolsas', med / 2, med, med * 1.5);
  console.log('PRECIO_PUEBLO', JSON.stringify(PP));
  console.log('tiempo', ((Date.now() - t0) / 1000).toFixed(0), 's');
  if (process.argv.includes('--escribir')) {
    const bolsas = '{ pequena: ' + Tropas.BOLSAS.pequena + ', mediana: ' + Tropas.BOLSAS.mediana + ', grande: ' + Tropas.BOLSAS.grande + ' }';   /* fijas: la fase 2 equilibra a esta bolsa */
    const f = new URL('../js/tropas.js', import.meta.url).pathname;
    let s = fs.readFileSync(f, 'utf8');
    const fecha = new Date().toISOString().slice(0, 10);
    const cuerpo = '{ ' + Object.entries(filas).map(([k, v]) => k + ': ' + v).join(', ') + ' }';
    const bloque = '/* Precio de un manípulo (curtido). Medido el ' + fecha + ' con test/tropas-precios.mjs: ' + SEM + ' semillas; por bisección, hombres que empatan contra 4 manípulos de hastati (480)\n     y, para caballería y tiradores, también contra 3 hastati + 1 velites + 1 equites (media). Precio = 700 × valor por hombre × hombres del manípulo / 120, a 50; mínimo 150. */\n  const PRECIO = ' + cuerpo + ';';
    const pp = '{\n' + Object.entries(PP).map(([p, o]) => '    ' + p + ': { ' + Object.entries(o).map(([k, v]) => k + ': ' + v).join(', ') + ' }').join(',\n') + '\n  }';
    const re = /(\/\* Precio de un manípulo[\s\S]*?\*\/\s*)?const PRECIO = \{[^;]*\};/;
    if (!re.test(s)) throw new Error('no encuentro PRECIO');
    s = s.replace(re, () => bloque + '\n  /* Precio final por pueblo (medido): el precio base por un factor (' + Object.entries(FACT).map(([p, v]) => p + ' ' + v.toFixed(2)).join(', ') + ') para que, con el mismo dinero, su ejército típico empate con el romano. */\n  const PRECIO_PUEBLO = ' + pp + ';');
    s = s.replace(/\/\* Precio final por pueblo[\s\S]*?\};\n(?=[\s\S]*\/\* Precio final por pueblo)/, '');
    s = s.replace(/const BOLSAS = \{[^}]*\};/, 'const BOLSAS = ' + bolsas + ';');
    fs.writeFileSync(f, s);
    console.log('escrito en js/tropas.js');
  }
}
