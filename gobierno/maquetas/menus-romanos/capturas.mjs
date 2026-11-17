/* MR1: capturas de la maqueta de menús romanos a 390×844. Uso: node gobierno/maquetas/menus-romanos/capturas.mjs */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const D = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch();
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const err = []; page.on('console', m => m.type() === 'error' && err.push(m.text())); page.on('pageerror', e => err.push(String(e)));
for (const [p, n] of [['imperio', '1-imperio-A'], ['imperio-b', '2-imperio-B'], ['gobierno', '3-gobierno'], ['senado', '4-senado'], ['carta', '5-informe']]) {
  await page.goto(pathToFileURL(join(D, 'index.html')).href + '?p=' + p); await page.waitForTimeout(500);
  await page.screenshot({ path: join(D, '..', '..', 'capturas-tarea', 'MR1-' + n + '.jpg'), type: 'jpeg', quality: 80 });
}
console.log(err.length ? 'ERRORES: ' + err.join(' | ') : 'sin errores de consola');
await br.close();
