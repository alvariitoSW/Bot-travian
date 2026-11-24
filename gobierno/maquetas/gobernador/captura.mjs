// MN3: bloque «Gobernador». Saca 4 capturas a gobierno/capturas-tarea/ y comprueba el interruptor.
// Uso: node gobierno/maquetas/gobernador/captura.mjs   (sale con 1 si algo falla)
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { mkdir } from 'fs/promises';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SAL = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch(); await mkdir(SAL, { recursive: true });
let malas = 0; const errores = [];
const chk = (nom, ok, det) => { console.log((ok ? 'OK    ' : 'FALLO ') + nom + (det ? ' — ' + det : '')); if (!ok) malas++; };
const base = pathToFileURL(join(AQUI, 'index.html')).href;
async function pag(q) {
  const p = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  p.on('requestfailed', r => { if (!/gobernador\.js$/.test(r.url())) errores.push('no cargó ' + r.url()); }); p.on('pageerror', e => errores.push(String(e)));
  await p.goto(base + '?estado=' + q); await p.waitForSelector('.gb-bloque'); return p;
}
const ancho = p => p.evaluate(() => document.documentElement.scrollWidth);
for (const [q, nom] of [['apagado', 'MN3-1-apagado'], ['vacio', 'MN3-2-encendido'], ['informe', 'MN3-3-informe'], ['fallos', 'MN3-4-fallos']]) {
  const p = await pag(q); await p.screenshot({ path: join(SAL, nom + '.jpg'), type: 'jpeg', quality: 85 });
  chk('ancho ≤ 390 en ' + q, await ancho(p) <= 390, String(await ancho(p)));
  const fuera = await p.evaluate(() => [...document.querySelectorAll('.gb-bloque *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > 390.5 || b.left < -0.5); }).length);
  chk('nada sobresale en ' + q, fuera === 0, String(fuera));
  await p.close();
}
const p = await pag('apagado'); const sw = p.locator('[role=switch]');
chk('apagado: aria-checked=false', await sw.getAttribute('aria-checked') === 'false');
chk('apagado: «Llevas tú la ciudad.»', (await p.innerText('.gb-bloque')).includes('Llevas tú la ciudad.'));
chk('interruptor ≥ 44 px', (await sw.boundingBox()).height >= 44);
await sw.click();
chk('tocar enciende', await sw.getAttribute('aria-checked') === 'true');
chk('texto «Actuará al cambiar de estación.»', (await p.innerText('.gb-bloque')).includes('Actuará al cambiar de estación.'));
await sw.click();
chk('tocar apaga', await sw.getAttribute('aria-checked') === 'false' && (await p.innerText('.gb-bloque')).includes('Llevas tú la ciudad.'));
const f = await pag('fallos'); chk('fallos: línea de aviso', await f.locator('.gb-lin li.mal').count() === 1 && await f.locator('.gb-lin li').count() === 4);
chk('sin errores de consola', errores.length === 0, errores.slice(0, 3).join(' | '));
await br.close(); process.exit(malas ? 1 : 0);
