/* Saca J1-maqueta-A.jpg y J1-maqueta-B.jpg a gobierno/capturas-tarea/. Uso: node gobierno/maquetas/_captura.mjs */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const D = dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch();
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
for (const m of ['A', 'B']) {
  await page.goto(pathToFileURL(join(D, m + '.html')).href); await page.waitForTimeout(400);
  await page.screenshot({ path: join(D, '..', 'capturas-tarea', 'J1-maqueta-' + m + '.jpg'), type: 'jpeg', quality: 82, fullPage: true });
}
await br.close();
