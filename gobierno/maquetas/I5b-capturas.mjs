// I5b Escuela y sabios: capturas a 390x844 en gobierno/capturas-tarea/I5b/
// Uso: node gobierno/maquetas/I5b-capturas.mjs  (necesita playwright)
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea', 'I5b');
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
for (let i = 0; i < 4; i++) { await page.evaluate(() => { const b = document.querySelector('#modal [data-act="close"]'); if (b) b.click(); }); await page.waitForTimeout(300); }
const sacar = async n => { await page.waitForTimeout(500); const w = await page.evaluate(() => document.documentElement.scrollWidth); console.log(n, 'scrollWidth', w, w <= 390 ? 'OK' : 'MAL'); await page.screenshot({ path: join(SALIDA, n + '.jpg'), type: 'jpeg', quality: 82 }); };
// preparar: Preceptores hechos, pop alta, esclavos, oro; Escuela puesta en el mejor sitio y obra terminada
await page.waitForTimeout(6000);
await page.evaluate(() => { const G = Game, s = G.state, c = s.cities.roma; c.pop = 900; c.esc = 60; for (const r of DATA.RES) { s.res[r] = 3000; s.alm[r] = 3000; } const E = G.ciudadE('roma'); if (!E.abiertas.includes('escuela')) E.abiertas.push('escuela'); UI.dirty = true; });
await page.waitForTimeout(2500);
const cierra = async () => { for (let i = 0; i < 4; i++) { await page.evaluate(() => { const b = document.querySelector('#modal [data-act="close"]'); if (b) b.click(); }); await page.waitForTimeout(250); } };
const bandeja = async () => { await page.evaluate(() => { const e = document.querySelector('#bandeja [data-id="escuela"]'); if (e) e.scrollIntoView({ inline: 'center', block: 'nearest' }); }); await page.waitForTimeout(300); console.log('bandeja:', await page.evaluate(() => [...document.querySelectorAll('#bandeja .pza')].map(b => b.dataset.id + (b.classList.contains('cerrada') ? '(cerrada)' : '')).join(','))); };
await bandeja(); await sacar('I5b-0a-bandeja-cerrada');
const prep = await page.evaluate(async () => {
  const Ciudad = await import('/js/ciudad.js'); const G = Game, s = G.state; s.inv.hechas.griego = 0; s.inv.rev++;
  const E = G.ciudadE('roma'), st = Ciudad.mejorSitio(E, 'escuela'); if (!st) return 'sin sitio'; const r = G.colocar('roma', 'escuela', st[0], st[1]); if (!r.ok) return r.motivo;
  for (let i = 0; i < 6; i++) G.tick(1); UI.dirty = true; return 'ok ' + (E.edificios.some(q => q.tipo === 'escuela') ? 'pieza' : 'sin pieza');
});
console.log('preparacion', prep); await page.waitForTimeout(2500);
await cierra(); await bandeja(); await sacar('I5b-0b-bandeja-abierta');
await page.evaluate(() => { const E = Game.ciudadE('roma'), e = E.edificios.find(q => q.tipo === 'escuela'); if (e) { UI.bsel = { k: 'pieza', id: e.id, x: e.x, z: e.z }; } UI.dirty = true; });
await page.waitForTimeout(1200);
await sacar('I5b-1-ficha-escuela');
// toque REAL en Plena
const bb = await page.locator('.esc-b[data-v="3"]').boundingBox(); console.log('caja Plena', bb);
await page.locator('.esc-b[data-v="3"]').scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const antes = await page.evaluate(() => Game.state.cities.roma.sabios && Game.state.cities.roma.sabios.dot);
await page.locator('.esc-b[data-v="3"]').click();
await page.waitForTimeout(600);
const desp = await page.evaluate(() => ({ dot: Game.state.cities.roma.sabios && Game.state.cities.roma.sabios.dot, ficha: !document.getElementById('fichab').hidden, on: document.querySelector('.esc-b.on[data-act="dotsab"]') && document.querySelector('.esc-b.on[data-act="dotsab"]').dataset.v }));
console.log('toque dotacion: antes', antes, 'despues', JSON.stringify(desp), desp.dot === 3 && desp.ficha && desp.on === '3' ? 'OK' : 'MAL');
await page.locator('.esc-c[data-v="ciu"]').scrollIntoViewIfNeeded(); await page.locator('.esc-c[data-v="ciu"]').click(); await page.waitForTimeout(500);
console.log('clase:', await page.evaluate(() => Game.state.cities.roma.sabios.clase), 'ficha abierta:', await page.evaluate(() => !document.getElementById('fichab').hidden));
await page.locator('.esc-c[data-v="ple"]').click(); await page.waitForTimeout(400);
await page.evaluate(() => { document.querySelector('.esc').scrollIntoView({ block: 'center' }); });
await sacar('I5b-2-dotacion-puesta');
// Saber con investigacion en curso
await page.evaluate(() => { const s = Game.state, i = s.inv; i.edad = 2; i.cola = { id: 'fasti', p: 6, P: Game.invTiempo('fasti'), t0: s.t - 6 }; i.rev++; UI.bsel = null; UI.dirty = true; document.querySelector('#tabs3 [data-v="imperio"]').click(); });
await page.waitForTimeout(1500);
await page.evaluate(() => { UI.svSel = null; UI.svDown = false; const b = document.querySelector('#view [data-v="saber"]'); if (b) b.click(); UI.dirty = true; });
await page.waitForTimeout(1000); await page.evaluate(() => { const e = document.querySelector('.sv-cola'); if (e) e.scrollIntoView({ block: 'center' }); }); await sacar('I5b-3-saber-ritmo');
console.log('texto ritmo:', await page.evaluate(() => (document.querySelector('.sv-cola') || {}).innerText));
// Cuentas
await page.evaluate(() => { document.querySelector('#tabs3 [data-v="gobierno"]').click(); UI.dirty = true; document.getElementById('res').click(); });
await page.waitForTimeout(800); await page.evaluate(() => { const e = [...document.querySelectorAll('#cuentas .cu-oro span')].find(x => x.textContent === 'Sabios'); if (e) e.scrollIntoView({ block: 'center' }); }); await page.screenshot({ path: join(SALIDA, 'I5b-4-cuentas.jpg'), type: 'jpeg', quality: 82 });
console.log('cuentas Sabios:', await page.evaluate(() => /Sabios/.test(document.getElementById('cuentas').innerText)));
console.log('errores de consola:', errs.length ? errs : 'ninguno');
await br.close(); srv.close();
