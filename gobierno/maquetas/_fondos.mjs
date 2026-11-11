/* Saca del juego real los fondos de las maquetas (ciudad 3D y mapa, sin paneles). Uso: node gobierno/maquetas/_fondos.mjs */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })).newPage();
await page.goto('http://127.0.0.1:' + srv.address().port + '/'); await page.waitForTimeout(1500);
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
for (let i = 0; i < 12; i++) { const b = page.locator('#modal:not([hidden]) [data-act="close"]').first(); if (!(await b.count())) break; await b.click(); await page.waitForTimeout(120); }
const limpia = () => page.addStyleTag({ content: '#top,#tabs,#zoom,#ctop,#csheet,#sheet,#toasts{display:none!important}' });
await page.click('#tabs [data-v="map"]'); await page.waitForTimeout(9000); await limpia(); await page.waitForTimeout(500);
await page.screenshot({ path: join(RAIZ, 'gobierno/maquetas/fondo-mapa.jpg'), type: 'jpeg', quality: 80 });
await page.reload(); await page.waitForTimeout(1500);
await page.click('#menu [data-act="continue"]').catch(() => {}); await page.waitForTimeout(1500);
for (let i = 0; i < 12; i++) { const b = page.locator('#modal:not([hidden]) [data-act="close"]').first(); if (!(await b.count())) break; await b.click(); await page.waitForTimeout(120); }
await page.click('#tabs [data-v="city"]'); await page.waitForTimeout(10000); await limpia(); await page.waitForTimeout(500);
await page.screenshot({ path: join(RAIZ, 'gobierno/maquetas/fondo-ciudad.jpg'), type: 'jpeg', quality: 80 });
await br.close(); srv.close();
