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
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [pref = 'mapa', ...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => a.split('='))), dpr = +(op.dpr || 2);
const VISTAS = { italia: { c: 'roma', dist: 120 }, alpes: { c: 'mediolanum', dist: 46 }, sicilia: { lon: 15.0, lat: 37.6, dist: 40 }, grecia: { lon: 22.4, lat: 40.0, dist: 40 }, costa: { c: 'roma', dist: 14 }, baja: { lon: 7.4, lat: 45.7, dist: 14 } };
const vistas = (op.vistas || 'italia,alpes,sicilia,grecia,costa,baja').split(',');
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
const medir = () => page.evaluate(() => { const i = UI.map.r.info.render; return i.triangles + ' triángulos, ' + i.calls + ' llamadas'; });
for (const v of vistas) {
  await page.evaluate(([v, V]) => { const m = UI.map; m.c.dist = V.dist; if (V.c) m.center(V.c); else { m.c.x = (V.lon + 7) * 5; m.c.z = (47 - V.lat) * 6.4; } m.clamp(); }, [v, VISTAS[v]]);
  await page.waitForTimeout(3500);
  const f = join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + v + '.jpg');
  for (let i = 0; ; i++) { try { await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } }
  console.log(f + ' · ' + await medir() + ' · pitch ' + (await page.evaluate(() => UI.map.c.pitch)).toFixed(2));
}
// tiempo de arranque del mapa (crear otro mapa en un contenedor suelto) y ciudades sobre el relieve
console.log(await page.evaluate(() => {
  const M = UI.map, t = performance.now(), host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-999px;width:300px;height:300px'; document.body.appendChild(host);
  const m2 = new M.constructor(host, {}); const ms = Math.round(performance.now() - t); m2.r.dispose(); host.remove();
  const filas = Object.keys(M.cities).map(id => { const c = M.cities[id], h = M.hAt(c.x, c.z); let mn = 9, mx = -9; for (let a = -1; a <= 1; a += 0.5) for (let b = -1; b <= 1; b += 0.5) { const q = M.hAt(c.x + a, c.z + b); mn = Math.min(mn, q); mx = Math.max(mx, q); } return id + ' h=' + h.toFixed(2) + ' (entorno ' + mn.toFixed(2) + '..' + mx.toFixed(2) + ')'; });
  return 'Arranque del mapa: ' + ms + ' ms\nCiudades: ' + filas.join('; ');
}));
if (errores.length) console.log('ERRORES DE CONSOLA:\n' + [...new Set(errores)].join('\n')); else console.log('Sin errores de consola.');
await br.close(); srv.close();
