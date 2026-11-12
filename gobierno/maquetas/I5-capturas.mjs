// I5 Saber: tres capturas a 390x844 en gobierno/capturas-tarea/I5/
// Uso: node gobierno/maquetas/I5-capturas.mjs  (necesita playwright)
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea', 'I5');
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
await page.evaluate(() => { document.querySelector('#tabs3 [data-v="imperio"]').click(); });
await page.waitForTimeout(10000);
const ir = async () => { await page.evaluate(() => { UI.svSel = null; UI.svDown = false; const b = document.querySelector('#view [data-v="saber"]'); if (b) b.click(); else { UI.tab = 'saber'; } UI.dirty = true; }); await page.waitForTimeout(800); };
const sacar = async n => { await page.waitForTimeout(500); const w = await page.evaluate(() => document.documentElement.scrollWidth); console.log(n, 'scrollWidth', w, w <= 390 ? 'OK' : 'MAL'); await page.screenshot({ path: join(SALIDA, n + '.jpg'), type: 'jpeg', quality: 82 }); };
await ir(); await sacar('I5-1-vacia');
// 2: investigación en curso y edad 2 abierta
await page.evaluate(() => { const s = Game.state, i = s.inv; i.edad = 2; i.hechas.griego = 0; i.hechas.apio = 0; i.rev++; i.cola = { id: 'fasti', p: 6, P: Game.invTiempo('fasti'), t0: s.t - 6 }; for (const r of DATA.RES) { s.res[r] = 600; s.alm[r] = 600; } UI.svSel = 'pilum'; UI.dirty = true; });
await page.waitForTimeout(800); await sacar('I5-2-en-curso');
// 3: par bloqueado (hecha viña, trigo con candado) y detalle abierto de la viña
await page.evaluate(() => { const i = Game.state.inv; i.cola = null; i.hechas.vina = 0; i.rev++; UI.svSel = 'trigo'; UI.dirty = true; });
await page.waitForTimeout(800);
await page.evaluate(() => { const t = document.querySelector('[data-v="trigo"]'); t && t.scrollIntoView({ block: 'center' }); });
await sacar('I5-3-par-bloqueado');
console.log('errores de consola:', errs.length ? errs : 'ninguno');
await br.close(); srv.close();
