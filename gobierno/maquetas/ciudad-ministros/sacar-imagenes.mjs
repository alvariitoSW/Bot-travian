// CD3b: saca del juego real las miniaturas de edificios y los retratos de tropas para la maqueta (img/edif-<id>.png, img/tropa-<id>.png).
// Uso: node gobierno/maquetas/ciudad-ministros/sacar-imagenes.mjs   (tarda 1-2 min: render por software)
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SAL = join(AQUI, 'img');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const srv = await new Promise(ok => { const s = createServer(async (q, r) => { try { const ruta = normalize(decodeURIComponent(new URL(q.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, ''); let f = join(RAIZ, ruta); if (ruta.endsWith('/')) f = join(f, 'index.html'); const b = await readFile(f); r.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'application/octet-stream' }); r.end(b); } catch { r.writeHead(404); r.end(); } }); s.listen(0, '127.0.0.1', () => ok(s)); });
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
await mkdir(SAL, { recursive: true });
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
await page.waitForFunction(() => window.UI.minis && Object.keys(window.UI.minis).length > 0, null, { timeout: 90000 }).catch(() => {});
const minis = await page.evaluate(() => window.UI.minis || {});
let n = 0; for (const [id, url] of Object.entries(minis)) if (typeof url === 'string' && url.startsWith('data:image')) { await writeFile(join(SAL, 'edif-' + id + '.png'), Buffer.from(url.split(',')[1], 'base64')); n++; }
console.log('edificios: ' + n);
let t = 0;
for (const u of ['hastati', 'principes', 'triarii', 'velites', 'equites']) {
  let url = '';
  for (let i = 0; i < 25 && !url; i++) { url = await page.evaluate(async k => { const m = await import('/js/gfx/units.js'); try { return m.realPortrait(k) || ''; } catch (e) { return ''; } }, u); if (!url) await page.waitForTimeout(2500); }
  if (url.startsWith('data:image')) { await writeFile(join(SAL, 'tropa-' + u + '.png'), Buffer.from(url.split(',')[1], 'base64')); t++; }
}
console.log('tropas: ' + t);
await br.close(); srv.close(); process.exit(n && t ? 0 : 1);
