/* Escenas de portada y láminas (MN4c): capturas de la ciudad de Roma 3D del propio juego (modelos de 0 A.D., CC BY-SA 3.0), sin interfaz.
   Uso: node tools/laminas/escenas.mjs <carpeta_salida> [anchoxalto=360x700] [dpr=2]   (deja c1..cN.png con varias cámaras) */
import { createRequire } from 'node:module'; import { createServer } from 'node:http'; import { readFile, mkdir } from 'node:fs/promises'; import { join, extname, dirname } from 'node:path'; import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');
const [sal, dim = '360x700', dpr = '2', lista = ''] = process.argv.slice(2); const [W, H] = dim.split('x').map(Number);
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: +dpr, serviceWorkers: 'block' })).newPage();
page.on('pageerror', e => console.log('ERROR', String(e.message).slice(0, 200)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
await page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = 'roma'; UI.city = 'roma'; document.body.appendChild(b); b.click(); b.remove(); });
await page.waitForTimeout(14000);
await page.addStyleTag({ content: '#app > *:not(#citywrap):not(#mapwrap){display:none!important} #citywrap :not(canvas):not(:has(canvas)){display:none!important} #modal,#toasts,#pausa,#carga{display:none!important}' });
await page.evaluate(() => { Game.state.speed = 0; const n = [...document.querySelectorAll('#citywrap *')].filter(e => /^Foro/.test(e.textContent) && e.children.length < 3).slice(0, 3).map(e => e.tagName + '.' + e.className + ' < ' + e.parentElement.className); console.log(JSON.stringify(n)); });
page.on('console', m => { if (m.text().startsWith('[')) console.log(m.text()); });
await mkdir(sal, { recursive: true });
const vistas = JSON.parse(lista || '[]');
for (let i = 0; i < vistas.length; i++) { const v = vistas[i];
  await page.evaluate(([f, v]) => { Game.state.t = 24 + 5 + f; const E = Game.ciudadE('roma'); UI.cityV.mirar(E.foro.x + v.dx, E.foro.z + v.dz, v.d, v.az); }, [v.f ?? 0.78, v]);
  await page.waitForTimeout(2500); await page.screenshot({ path: join(sal, 'c' + i + '.png') }); console.log('c' + i, JSON.stringify(v)); }
await br.close(); srv.close();
