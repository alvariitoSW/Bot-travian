// I8b Pulir la partida corta: capturas a 390x844 en gobierno/capturas-tarea/I8b-{1-fundar,3-fundada,4-mapa-italia}.jpg
// Uso: node gobierno/maquetas/I8b-capturas.mjs  (necesita playwright). Comprueba también que el reloj espera al arado.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const srv = createServer(async (rq, rs) => { try { const p = normalize(decodeURIComponent(rq.url.split('?')[0])); const f = join(RAIZ, p.endsWith('/') ? p + 'index.html' : p); rs.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'application/octet-stream' }); rs.end(await readFile(f)); } catch { rs.writeHead(404); rs.end(); } }).listen(0);
await new Promise(r => srv.on('listening', r));
const port = srv.address().port;
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
const foto = async n => page.screenshot({ timeout: 90000, path: join(SALIDA, n + '.jpg'), type: 'jpeg', quality: 82 });
const cierra = async () => { for (let i = 0; i < 5; i++) { await page.evaluate(() => { const b = document.querySelector('#modal:not([hidden]) [data-act="close"]'); if (b) b.click(); }); await page.waitForTimeout(300); } };
await page.goto('http://localhost:' + port + '/index.html'); await page.waitForTimeout(2000);
// 1: fundar de la nada: la barra de arriba ya enseña lo que traen los colonos
await page.click('#menu [data-act="hoja"][data-v="corta"]'); await page.waitForTimeout(400); await page.click('#hoja [data-act="cortafun"]');
await page.waitForTimeout(1500); await cierra(); await page.waitForFunction(() => window.UI && UI.cityV && UI.cityV.listo, null, { timeout: 90000 }); await cierra();
await page.waitForFunction(() => window.UI && UI.fundar && UI.fundar.vale, null, { timeout: 30000 });
await page.waitForTimeout(2500);
console.log('barra al fundar:', await page.evaluate(() => ['oro', 'grano', 'madera'].map(r => r + ' ' + document.getElementById('r-' + r).textContent).join(' · ') + ' · fecha «' + document.getElementById('date').textContent + '» · ciudad «' + document.getElementById('citybtn').textContent + '»'));
await foto('I8b-1-fundar');
// 2: «Fundar aquí»: mientras el arado traza el surco, el reloj no corre
await page.evaluate(() => { window.__t0 = Game.state.t; Game.state.speed = 1; document.getElementById('b-si').click(); });
await page.waitForTimeout(3500);
const ar = await page.evaluate(() => ({ fase: Game.modoFase(), t: Game.state.t, t0: window.__t0, ciudades: Game.myCities() }));
console.log('arando:', ar); if (ar.fase !== 'arando' || ar.t !== ar.t0) { console.log('FALLO: el reloj corre mientras ara'); process.exitCode = 1; }
await page.waitForFunction(() => !UI.fundar && Game.myCities().length === 1, null, { timeout: 30000 });
await page.waitForTimeout(1500); await cierra();
await page.evaluate(() => { Game.state.speed = 1; }); await page.waitForTimeout(2500); await cierra();
const fu = await page.evaluate(() => ({ fase: Game.modoFase(), t: Game.state.t, t0: window.__t0 }));
console.log('fundada:', fu); if (fu.fase !== 'jugando' || !(fu.t > fu.t0)) { console.log('FALLO: tras el surco el reloj no corre'); process.exitCode = 1; }
await foto('I8b-3-fundada');
// 3: mapa de Italia («Roma y Capua en pie»): las colonias libres no tapan Roma
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2500);
await page.click('#menu [data-act="hoja"][data-v="corta"]'); await page.waitForTimeout(400); await page.click('#hoja [data-act="cortaen"]'); await page.waitForTimeout(3000); await cierra();
await page.evaluate(() => { Game.state.speed = 0; UI.dirty = true; document.querySelector('[data-act="menumodo"]').click(); document.querySelector('[data-act="menumodo"]').click(); document.querySelector('[data-act="modo"][data-v="guerra"]').click(); });
await page.waitForTimeout(3000); await cierra(); await page.waitForTimeout(500);
const tapa = await page.evaluate(() => { const r = UI.map.cities.roma.el.getBoundingClientRect(), o = []; for (const id in UI.map.sitios) { const e = UI.map.sitios[id].el; if (e.style.display === 'none') continue; const q = e.getBoundingClientRect(); if (q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) o.push(id); } return o; });
console.log('etiquetas de colonias sobre Roma:', tapa.length ? tapa : 'ninguna'); if (tapa.length) process.exitCode = 1;
await foto('I8b-4-mapa-italia');
console.log('errores de consola:', errs.length ? errs : 'ninguno');
await br.close(); srv.close();
