// Copia piezas propias (maquetas) a la carpeta de estáticos y fusiona sus entradas en static.json.
// Uso: node tools/piezas_propias.mjs <carpeta destino> <carpeta piezas> <lista>
// Idempotente: si la pieza o textura ya está igual, no cambia nada. Las texturas solo se copian si faltan.
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
const [dest, orig, lista] = process.argv.slice(2);
if (!dest || !orig || !lista) { console.error('Uso: node piezas_propias.mjs <destino> <piezas> <lista>'); process.exit(2); }
const nombres = readFileSync(lista, 'utf8').split('\n').map(l => l.replace(/#.*/, '').trim()).filter(Boolean);
const fuente = JSON.parse(readFileSync(join(orig, 'static.json'), 'utf8'));
const jsonDest = join(dest, 'static.json');
const destino = existsSync(jsonDest) ? JSON.parse(readFileSync(jsonDest, 'utf8')) : {};
for (const n of nombres) {
  const e = fuente[n];
  if (!e) { console.error('Falta en ' + orig + '/static.json: ' + n); process.exit(1); }
  if (!existsSync(join(orig, n + '.bin'))) { console.error('Falta ' + n + '.bin en ' + orig); process.exit(1); }
  copyFileSync(join(orig, n + '.bin'), join(dest, n + '.bin'));
  for (const g of e.groups) for (const k of ['file', 'aoFile', 'normFile', 'specFile']) {
    const f = g[k]; if (!f || existsSync(join(dest, f))) continue;
    if (!existsSync(join(orig, f))) { console.error('Falta la textura ' + f + ' de ' + n); process.exit(1); }
    copyFileSync(join(orig, f), join(dest, f));
  }
  destino[n] = e;
}
writeFileSync(jsonDest, JSON.stringify(destino));
console.log('Piezas propias: ' + nombres.join(', '));
