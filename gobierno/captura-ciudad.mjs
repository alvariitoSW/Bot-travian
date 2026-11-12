/* Capturas propias de la ciudad 3D del juego a 390×844 (carril Ciudad, desde Q1d).
   Uso: node gobierno/captura-ciudad.mjs <prefijo> [vistas=ciudad,media,calle,ejercito,toque,grande] [ciudad=roma] [dpr=2]
   Deja gobierno/capturas-tarea/<prefijo>-<vista>.jpg y escribe triángulos y llamadas de dibujo de cada una.
   Vistas: ciudad (la de entrada), media (más cerca), calle, ejercito, toque (toca el foro: medalla elegida y ficha),
   grande (todos los edificios a nivel 5, para medir contra el tope de triángulos). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [pref = 'ciudad', ...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => a.split('=')));
const vistas = (op.vistas || 'ciudad,media,calle,ejercito,toque,grande').split(','), ciudad = op.ciudad || 'roma', dpr = +(op.dpr || 2);
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
await page.evaluate(c => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = c; UI.city = c; document.body.appendChild(b); b.click(); b.remove(); }, ciudad);
await page.waitForTimeout(12000); await cierra();
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
const medir = () => page.evaluate(() => { const i = UI.cityV.r.info.render; return i.triangles + ' triángulos, ' + i.calls + ' llamadas'; });
for (const v of vistas) {
  await page.evaluate(v => { const V = UI.cityV; UI.bsel = null;
    if (v === 'grande') { const c = Game.state.cities[UI.city]; for (const b in DATA.BUILD) c.b[b] = Math.max(c.b[b] || 0, 5); V.view('ciudad'); }
    else if (v === 'media') { V.view('ciudad'); V.c.dist = 250; }
    else if (v === 'toque') V.view('ciudad');
    else V.view(v); }, v);
  await page.waitForTimeout(v === 'grande' ? 9000 : 3500);
  if (v === 'toque') { const p = await page.evaluate(() => { const e = UI.cityV.els.foro, r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); await page.touchscreen.tap(p[0], p[1]); await page.waitForTimeout(3500); }
  const f = join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + v + '.jpg');
  for (let i = 0; ; i++) { try { await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } }
  console.log(f + ' · ' + await medir() + (v === 'toque' ? ' · elegido: ' + await page.evaluate(() => UI.bsel) : ''));
}
if (errores.length) console.log('ERRORES DE CONSOLA:\n' + [...new Set(errores)].join('\n')); else console.log('Sin errores de consola.');
await br.close(); srv.close();
