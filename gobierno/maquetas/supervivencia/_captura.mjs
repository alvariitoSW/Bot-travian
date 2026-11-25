/* Saca las capturas SUP1-*.jpg de las maquetas del modo supervivencia. Uso: node gobierno/maquetas/supervivencia/_captura.mjs */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const D = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch();
const paginas = process.argv.slice(2).length ? process.argv.slice(2) :
  ['menu', 'arriba-dia', 'etapas', 'noche', 'oficial', 'amanecer', 'tiempo'];
for (const p of paginas) {
  const h = p === 'oficial';
  const page = await (await br.newContext({ viewport: h ? { width: 844, height: 390 } : { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errores = []; page.on('pageerror', e => errores.push(e.message));
  await page.goto(pathToFileURL(join(D, p + '.html')).href); await page.waitForTimeout(500);
  await page.screenshot({ path: join(D, '..', '..', 'capturas-tarea', 'SUP1-' + p + '.jpg'), type: 'jpeg', quality: 84, fullPage: true });
  console.log(p, errores.length ? 'ERRORES: ' + errores.join(' | ') : 'ok');
}
await br.close();
