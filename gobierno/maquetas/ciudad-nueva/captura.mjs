/* Saca CD0-<n>-<nombre>.jpg a gobierno/capturas-tarea/. Uso: node gobierno/maquetas/ciudad-nueva/captura.mjs */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const D = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const nombres = ['vista', 'construir', 'calle', 'ministros', 'senado', 'necesidades'];
const ex = [['4b-ministros', '?p=4&abajo=1']];
const br = await chromium.launch();
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
for (let i = 1; i <= 6; i++) {
  await page.goto(pathToFileURL(join(D, 'index.html')).href + '?p=' + i); await page.waitForTimeout(300);
  await page.screenshot({ path: join(D, '..', '..', 'capturas-tarea', `CD0-${i}-${nombres[i - 1]}.jpg`), type: 'jpeg', quality: 82 });
}
for (const [n, q] of ex) {
  await page.goto(pathToFileURL(join(D, 'index.html')).href + q); await page.waitForTimeout(300);
  await page.screenshot({ path: join(D, '..', '..', 'capturas-tarea', `CD0-${n}.jpg`), type: 'jpeg', quality: 82 });
}
await br.close();
