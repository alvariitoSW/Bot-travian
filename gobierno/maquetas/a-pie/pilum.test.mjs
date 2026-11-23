/* TP9a · Prueba escrita sin pantalla: el lanzamiento del pilum nunca da filas imposibles ni huesos NaN.
   El fallo viejo: en escena.js, HOM = { ...tab, …, L: LR } pisaba tab.L (la primera fila de lanzar) con un objeto, y
   poseLanza hacía «objeto + 1»: filas basura, huesos NaN, cámara NaN y pila invisibles en cada salva.
   Se pasa con: node gobierno/maquetas/a-pie/pilum.test.mjs  (imprime APTO o NO APTO; sale con código 1 si falla) */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { crearAcciones } from './acciones.js';

const aqui = dirname(fileURLToPath(import.meta.url));
const fallos = [];
const mal = t => fallos.push(t);

/* (a) guardián: el objeto literal de HOM no vuelve a declarar una clave que da generaTabla */
const CLAVES_TABLA = ['T', 'esq', 'N0', 'hues', 'total', 'L', 'LC', 'golpe'];
{
  const src = readFileSync(join(aqui, 'escena.js'), 'utf8');
  const i = src.indexOf('HOM = { ...tab');
  if (i < 0) mal('(a) no encuentro «HOM = { ...tab» en escena.js');
  else {
    /* el objeto entero, contando llaves */
    let n = 0, j = src.indexOf('{', i), fin = -1;
    for (let k = j; k < src.length; k++) { if (src[k] === '{') n++; else if (src[k] === '}') { n--; if (n === 0) { fin = k; break; } } }
    const cuerpo = src.slice(j + 1, fin);
    /* solo las claves del primer nivel */
    let prof = 0, trozo = '', claves = [];
    for (const ch of cuerpo + ',') {
      if (ch === '{' || ch === '[' || ch === '(') prof++;
      if (ch === '}' || ch === ']' || ch === ')') prof--;
      if (ch === ',' && prof === 0) { const t = trozo.trim(); if (t && !t.startsWith('...')) claves.push(t.split(':')[0].trim()); trozo = ''; } else trozo += ch;
    }
    const pisa = claves.filter(c => CLAVES_TABLA.includes(c));
    if (pisa.length) mal(`(a) HOM pisa claves de generaTabla: ${pisa.join(', ')}`);
    else console.log(`(a) HOM no pisa la tabla (${claves.length} claves propias)`);
  }
}

/* un mundo mínimo de mentira para crearAcciones */
const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mundo = L => ({ S: { T: 0 }, Son: {}, panDe: () => 0, chispa: () => {}, V3: null, H: {}, PIES: {}, azarV: () => 0.5, CJ: {}, suave, HOM: { L, total: L + 5 + 20 } });

function recorre(L, esperaBase) {
  const A = crearAcciones(mundo(L)), b = 7;
  let n = 0;
  for (const esYo of [true, false]) for (let k = 0; k <= 120; k++) {
    const tl = k / 100, h = {}, r = A.poseLanza(h, tl, b, esYo);
    n++;
    if (!Array.isArray(r) || r.length !== 3 || !r.every(Number.isFinite)) { mal(`L=${JSON.stringify(L)} tl=${tl} esYo=${esYo}: no finito ${JSON.stringify(r)}`); continue; }
    const [x, y, m] = r;
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) mal(`L=${JSON.stringify(L)} tl=${tl}: filas no enteras o negativas ${x}, ${y}`);
    if (m < 0 || m > 1) mal(`L=${JSON.stringify(L)} tl=${tl}: mezcla fuera de 0..1 (${m})`);
    if (Number.isFinite(L) && (x >= L + 5 && x !== b || y >= L + 5 && y !== b)) mal(`tl=${tl}: fila de lanzar pasada de L+4 (${x}, ${y})`);
    if (esperaBase && (x !== b || y !== b || m !== 0)) mal(`L objeto, tl=${tl}: no devuelve la postura base (${r})`);
  }
  return n;
}
/* (b) con L numérico: siempre finito, filas enteras ≥ 0 y dentro de las cinco de lanzar */
console.log(`(b) L numérico: ${recorre(160, false)} posturas comprobadas`);
/* (c) el fallo viejo: L hecho objeto. El seguro devuelve la postura base, nunca NaN */
console.log(`(c) L objeto (fallo viejo): ${recorre({ m: null }, true)} posturas comprobadas`);

if (fallos.length) { for (const f of fallos.slice(0, 20)) console.log('  FALLO ' + f); console.log(`NO APTO (${fallos.length} fallos)`); process.exit(1); }
console.log('APTO');
