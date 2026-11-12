/* Capturas de C6 (escalones del mapa): Mare Nostrum y tras tocar Italia, a 390×844 con dpr 1. Uso: node gobierno/maquetas/C6-capturas.mjs */
/* Capturas propias del MAPA de campaña a 390×844 (C2b: relieve real y espuma).
   Uso: node gobierno/captura-mapa.mjs <prefijo> [vistas=italia,alpes,sicilia,grecia,costa,baja] [dpr=2]
   Deja gobierno/capturas-tarea/<prefijo>-<vista>.jpg y escribe triángulos, llamadas, tiempo de arranque del mapa
   y la altura bajo cada ciudad. Vistas: italia (entera), alpes (Mediolanum), sicilia (Etna), grecia (Olimpo),
   costa (de cerca, dist 14, Roma), baja (cámara baja, pitch 0,62, Alpes). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dpr = 1;
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 300)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
await cierra();
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'modo'; b.dataset.v = 'guerra'; document.body.appendChild(b); b.click(); b.remove(); });
await page.waitForFunction(() => window.UI && UI.map, null, { timeout: 60000 });
await page.waitForTimeout(12000); await cierra();
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
const foto = async n => { const f = join(RAIZ, 'gobierno/capturas-tarea', 'C6-' + n + '.jpg'); for (let i = 0; ; i++) { try { await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } } console.log(f); };
await page.evaluate(() => { const m = UI.map; m.c.x = 94; m.c.z = 46; m.c.dist = 330; m.clamp(); });
await page.waitForTimeout(3000); await foto('mare');
console.log(await page.evaluate(() => Object.keys(UI.map.cities).map(i => i + ':' + UI.map.cities[i].z.toFixed(0)).join(' ')));
console.log(await page.evaluate(() => [...document.querySelectorAll('.mlabel.zona')].map(e => e.textContent + ':' + e.style.display + ':' + Math.round(e.getBoundingClientRect().x) + ',' + Math.round(e.getBoundingClientRect().y)).join(' | ') + ' · ' + document.querySelector('.mmigas').innerText.replace(/\n/g, ' ')));
const d0 = await page.evaluate(() => UI.map.c.dist);
await page.evaluate(() => [...document.querySelectorAll('.mlabel.zona')].find(e => e.textContent === 'Italia').click());
await page.waitForTimeout(1500); await foto('italia');
console.log(d0, await page.evaluate(() => UI.map.c.dist), await page.evaluate(() => document.querySelector('.mmigas').innerText.replace(/\n/g, ' ')));
if (errores.length) console.log('ERRORES DE CONSOLA:\n' + [...new Set(errores)].join('\n')); else console.log('Sin errores de consola.');
await page.evaluate(() => document.querySelector('.mmigas [data-volver]').click()); await page.waitForTimeout(1500);
console.log('tras volver:', await page.evaluate(() => UI.map.c.x.toFixed(2) + ',' + UI.map.c.z.toFixed(2) + ',' + UI.map.c.dist.toFixed(2) + ' · ' + document.querySelector('.mmigas').innerText.replace(/\s+/g, ' ')));
await br.close(); srv.close();
