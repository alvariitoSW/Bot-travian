// Q7 Senado: dos capturas a 390x844 en gobierno/capturas-tarea/Q7-{1-mision,2-favor-bajo}.jpg
// Uso: node gobierno/maquetas/Q7-capturas.mjs  (necesita playwright)
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const srv = createServer(async (rq, rs) => { try { const p = normalize(decodeURIComponent(rq.url.split('?')[0])); const f = join(RAIZ, p.endsWith('/') ? p + 'index.html' : p); rs.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'application/octet-stream' }); rs.end(await readFile(f)); } catch { rs.writeHead(404); rs.end(); } }).listen(0);
const port = srv.address().port;
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
await page.goto('http://localhost:' + port + '/index.html'); await page.waitForTimeout(1500);
await page.evaluate(() => { document.querySelector('[data-act="new"]').click(); });
await page.waitForTimeout(500);
await page.evaluate(() => { document.querySelector('#tabs3 [data-act="tab3"][data-v="ciudad"]').click(); });
await page.waitForTimeout(10000);


await poner0();
async function poner0() { for (let i = 0; i < 4; i++) { await page.evaluate(() => { const b = document.querySelector('#modal [data-act="close"]'); if (b) b.click(); }); await page.waitForTimeout(400); } }
const sacar = async n => { await page.waitForTimeout(800); await page.screenshot({ path: join(SALIDA, n + '.jpg'), type: 'jpeg', quality: 82 }); };
await page.evaluate(() => { Game.state.speed = 0; if (!Game.state.mision) Game.senadoAsignar(); if (!Game.state.mision) { const y = Game.state.t; Game.state.t += 12 * 6; Game.senadoAsignar(); Game.state.t = y; } document.querySelector('[data-act="tab3"][data-v="imperio"]').click(); });
await page.waitForTimeout(600);
console.log('mision:', await page.evaluate(() => JSON.stringify(Game.state.mision)));
await page.evaluate(() => document.querySelector('#view [data-act="tab"][data-v="senado"]').click());
await sacar('Q7-1-mision');
await page.evaluate(() => { Game.state.favor.senado = 10; UI.dirty = true; });
await sacar('Q7-2-favor-bajo');
console.log('scrollX:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
console.log('errores de consola:', errs.length ? errs : 'ninguno');
await br.close(); srv.close();