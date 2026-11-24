/* Vigila el juego sin conexión: todo archivo .js que se carga (desde index.html o importado por otro archivo de FILES, maquetas incluidas)
   tiene que estar en FILES de sw.js. Si falta uno, sin red no carga. Uso: node test/sw-archivos.test.mjs */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), '..');
const sw = readFileSync(join(R, 'sw.js'), 'utf8');
const files = new Set([...sw.matchAll(/'([^']+)'/g)].map(m => m[1]));
const pend = [], vistos = new Set(), falta = [];
const mira = (rel, desde) => { const n = posix.normalize(rel); if (vistos.has(n)) return; vistos.add(n); if (!existsSync(join(R, n))) return; if (!files.has(n)) falta.push(n + '  (lo carga ' + desde + ')'); pend.push(n); };
const html = readFileSync(join(R, 'index.html'), 'utf8');
for (const m of html.matchAll(/src="([^"?#]+\.js)/g)) mira(m[1].replace(/^\.\//, ''), 'index.html');
for (const m of html.matchAll(/from\s+['"]\.\/([^'"]+\.js)['"]|import\(\s*['"]\.\/([^'"]+\.js)['"]/g)) mira(m[1] || m[2], 'index.html');
for (const f of files) if (f.endsWith('.js') && existsSync(join(R, f))) { vistos.add(f); pend.push(f); }   // también lo que ya está en FILES (maquetas, assets): sus import deben estar
while (pend.length) {
  const f = pend.shift(), txt = readFileSync(join(R, f), 'utf8'), dir = posix.dirname(f);
  for (const m of txt.matchAll(/(?:from\s+|import\(\s*)['"](\.{1,2}\/[^'"]+\.js)['"]/g)) mira(posix.join(dir, m[1]), f);
}
if (falta.length) { console.log('FALLO: faltan en FILES de sw.js:\n  ' + falta.join('\n  ')); process.exit(1); }
console.log('sw-archivos: ' + vistos.size + ' archivos .js cargados, todos en la caché sin conexión. OK');
