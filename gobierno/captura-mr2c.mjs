/* MR2c: capturas de Mercado, Rutas, Pueblo, Ajustes, ☰, General, Crónica y Saber. Uso: node gobierno/captura-mr2c.mjs [prefijo] */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), PRE = process.argv[2] || 'MR2c';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; UI.modalQ.length = 0; UI.modalOpen = false; });
await cierra();
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
await page.evaluate(() => { Game.state.speed = 0; const s = Game.state; for (const r of DATA.RES) { s.res[r] = 90000; } Object.assign(s.cities.roma.b, { foro: 3, puerto: 1, mercado: 3, granja: 6, cuartel: 3, almacen: 8 }); });
const clic = (act, v) => page.evaluate(([a, v]) => { const b = document.createElement('button'); b.dataset.act = a; if (v) b.dataset.v = v; document.body.appendChild(b); b.click(); b.remove(); }, [act, v]);
const sc = async n => { await page.waitForTimeout(700); await cierra(); await page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea/' + PRE + '-' + n + '.jpg'), type: 'jpeg', quality: 80 }); };
await clic('modo', 'gobierno'); await page.waitForTimeout(800);
for (const [id, n] of [['menu', '1-menu'], ['ajustes', '2-ajustes'], ['mercado', '3-mercado'], ['rutas', '4-rutas'], ['pueblo', '5-pueblo']]) {
  await clic('hojax'); await clic('hoja', id); await sc(n);
}
await clic('hojax');
for (const [t, n] of [['hero', '6-general'], ['log', '7-cronica'], ['saber', '8-saber']]) { await clic('tab', t); await sc(n); }
await page.evaluate(() => document.querySelector('.mos-cuerpo').scrollTop = 900); await sc('9-saber-abajo');
await page.evaluate(() => { document.querySelector('.cod-fs') || 0; }); await clic('tab', 'log'); await page.evaluate(() => { const f = document.querySelector('.cod-fs'); f.scrollLeft = f.scrollWidth; }); await sc('10-cronica-anales');
await clic('hoja', 'estado'); await sc('11-estado'); await clic('hojax');
const emo = []; for (const id of ['menu', 'ajustes', 'mercado', 'rutas', 'pueblo', 'estado', 'movil', 'creditos']) { await clic('hojax'); await clic('hoja', id); await page.waitForTimeout(200); const m = await page.evaluate(() => (document.getElementById('hoja').innerText.match(/\p{Extended_Pictographic}/gu) || []).join(' ')); if (m) emo.push(id + ': ' + m); } await clic('hojax');
for (const t of ['hero', 'log', 'saber']) { await clic('tab', t); await page.waitForTimeout(300); const m = await page.evaluate(() => (document.getElementById('view').innerText.match(/\p{Extended_Pictographic}/gu) || []).join(' ')); if (m) emo.push(t + ': ' + m); }
console.log('emojis:', emo.length ? emo.join('\n') : 'ninguno');
console.log('errores:', errores.length ? errores.join('\n') : 'ninguno');
await br.close(); srv.close();
