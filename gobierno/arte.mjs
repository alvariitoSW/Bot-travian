#!/usr/bin/env node
/* AQVILA — ministerio de Arte: pesa el arte, cuenta triángulos y comprueba las licencias.
   Uso:  node gobierno/arte.mjs   (sale con código 1 si se pasa del presupuesto o falta una licencia)
   El presupuesto está en gobierno/arte.json; lo decide el usuario. */
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = JSON.parse(await readFile(join(RAIZ, 'gobierno', 'arte.json'), 'utf8'));
const MB = b => (b / 1048576).toFixed(1) + ' MB';
const fallos = [];

async function peso(dir) { let t = 0; for (const f of await readdir(dir, { withFileTypes: true })) t += f.isDirectory() ? await peso(join(dir, f.name)) : (await stat(join(dir, f.name))).size; return t; }

let total = 0;
for (const [carpeta, indice, tope, nombre] of [['assets/units', 'units.json', P.triangulosPorUnidad, 'unidad'], ['assets/static', 'static.json', P.triangulosPorEdificio, 'edificio']]) {
  const dir = join(RAIZ, carpeta), b = await peso(dir); total += b;
  const idx = JSON.parse(await readFile(join(dir, indice), 'utf8'));
  const tris = Object.entries(idx).filter(([, v]) => v.verts).map(([k, v]) => [k, Math.round(v.verts / 3)]).sort((a, c) => c[1] - a[1]);   // mallas sin índices: 3 vértices por triángulo
  console.log(carpeta + ' · ' + MB(b) + ' · ' + tris.length + ' piezas · la mayor: ' + tris[0][0] + ' (' + tris[0][1] + ' triángulos)');
  for (const [k, n] of tris) if (n > tope) fallos.push(k + ': ' + n + ' triángulos (tope por ' + nombre + ': ' + tope + ')');
  try { const l = await readFile(join(dir, 'LICENSE.txt'), 'utf8'); if (!/CC BY-SA 3\.0/.test(l) || !/Wildfire Games/.test(l)) fallos.push(carpeta + '/LICENSE.txt no cita a Wildfire Games y la CC BY-SA 3.0'); }
  catch (e) { fallos.push('falta ' + carpeta + '/LICENSE.txt'); }
}
console.log('Descarga total de arte: ' + MB(total) + ' (tope: ' + P.descargaMB + ' MB)');
if (total > P.descargaMB * 1048576) fallos.push('el arte pesa ' + MB(total) + ' y el tope es ' + P.descargaMB + ' MB');
for (const [f, re] of [['README.md', /CC BY-SA 3\.0/], ['js/ui.js', /Wildfire Games/]]) if (!re.test(await readFile(join(RAIZ, f), 'utf8'))) fallos.push('falta el crédito de 0 A.D. en ' + f);

console.log(fallos.length ? 'ARTE: NO APTO\n  ✘ ' + fallos.join('\n  ✘ ') : 'ARTE: APTO' + (P.provisional ? ' (presupuesto provisional, pendiente de que el usuario lo apruebe)' : ''));
process.exit(fallos.length ? 1 : 0);
