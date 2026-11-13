/* NB7: ataca una ciudad con la batalla nueva (aviso → maniobra → choque → resultado) y deja capturas gobierno/capturas-tarea/NB7-*.png.
   Uso: node gobierno/captura-nb7.mjs [clasica] */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const modo = process.argv[2] || 'nueva';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.woff2': 'font/woff2', '.webmanifest': 'application/json', '.svg': 'image/svg+xml' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })).newPage();
const errores = []; page.on('console', m => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); }); page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 200)));
const f = n => join(RAIZ, 'gobierno/capturas-tarea', 'NB7-' + n + '.png');
await page.goto('http://127.0.0.1:' + srv.address().port + '/'); await page.waitForTimeout(1500);
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(10000);
await page.evaluate(() => { const b = document.querySelector('#modal .btn'); if (b) b.click(); }); await page.waitForTimeout(800);
await page.evaluate(m => { const G = window.Game; G.ponerAjustes({ batalla: m }); const s = G.state;
  s.cities.capua.owner = 'campanos'; s.cities.capua.units = { hoplitas: 250, milicia: 200 }; s.cities.roma.units = { hastati: 400, principes: 250, velites: 60 }; s.marches = [];
  G.send('roma', 'capua', { hastati: 400, principes: 250, velites: 60 }, false); s.marches[0].t1 = s.t + 0.01; G.tick(G.turnos ? Math.max(0.02, G.finTurno() - s.t) : 0.05); }, modo);
for (let i = 0; i < 8; i++) { await page.waitForTimeout(1200); if (await page.locator('#modal:not([hidden]) [data-act="bview"]').count()) break; const b = page.locator('#modal:not([hidden]) .btn').first(); if (await b.count()) await b.click(); }
await page.waitForSelector('#modal:not([hidden]) [data-act="bview"]', { timeout: 20000 });
await page.screenshot({ path: f('1-aviso') });
await page.click('[data-act="bview"]'); await page.waitForTimeout(1500);
if (modo === 'nueva') {
  await page.screenshot({ path: f('2-maniobra') });
  for (let i = 0; i < 12 && !(await page.locator('.m-choque [data-a="batalla"]').count()); i++) { await page.click('[data-a="pasar"]'); await page.waitForTimeout(400); }
  await page.screenshot({ path: f('3-choque-aviso') });
  await page.setViewportSize({ width: 844, height: 390 });
  if (await page.locator('[data-a="batalla"]').count()) await page.click('[data-a="batalla"]'); await page.waitForTimeout(5000);
  await page.screenshot({ path: f('4-choque') });
  for (let i = 0; i < 400 && !(await page.locator('[data-a="fin"], .b2-fin').count()); i++) { await page.evaluate(() => { UIBatalla2._pulso(); }); if (i % 40 === 0) await page.waitForTimeout(50); }
  await page.waitForTimeout(1500); await page.screenshot({ path: f('5-fin') });
  await page.setViewportSize({ width: 390, height: 844 }); const fin = page.locator('[data-a="fin"]'); if (await fin.count()) await fin.first().click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(1500); await page.screenshot({ path: f('6-resultado') });
  console.log('botones:', await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.dataset.a || b.dataset.act).join(',')));
}
console.log('errores de consola:', errores.length ? errores : 'ninguno'); await br.close(); srv.close();
