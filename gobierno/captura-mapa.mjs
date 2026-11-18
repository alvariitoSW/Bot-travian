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
const VISTAS = { italia: { c: 'roma', dist: 120 }, alpes: { c: 'mediolanum', dist: 46 }, sicilia: { lon: 15.0, lat: 37.6, dist: 40 }, grecia: { lon: 22.4, lat: 40.0, dist: 40 }, costa: { c: 'roma', dist: 14 }, baja: { lon: 7.4, lat: 45.7, dist: 14 }, etruria: { c: 'clusium', dist: 30 }, etruriaLejos: { c: 'clusium', dist: 62 }, mare: { c: 'roma', dist: 200 }, izq: { c: 'roma', dist: 400, drag: 1 }, der: { c: 'roma', dist: 400, drag: -1 }, padana: { lon: 10.5, lat: 45.1, dist: 40 }, tiber: { c: 'roma', dist: 22 }, delta: { lon: 12.0, lat: 44.9, dist: 22 }, iberia: { lon: -3.5, lat: 39.5, dist: 60 }, africa: { lon: 8.5, lat: 36.2, dist: 45 },
  /* C9: el mundo ampliado */ egipto: { lon: 31.0, lat: 30.6, dist: 60 }, giza: { lon: 31.13, lat: 29.98, dist: 15 }, faro: { lon: 29.885, lat: 31.214, dist: 15 }, nilo: { lon: 31.0, lat: 30.7, dist: 30 }, asia: { lon: 31.0, lat: 38.5, dist: 100 }, galia: { lon: 1.5, lat: 47.5, dist: 100 }, hispania: { lon: -5.0, lat: 40.0, dist: 100 }, mareEgipto: { lon: 30.0, lat: 32.0, dist: 400 }, mareGalia: { lon: 2.0, lat: 48.5, dist: 400 },
  /* C10: adornos de carta */ tirreno: { lon: 12.0, lat: 39.8, dist: 60 }, rosa: { lon: 19.0, lat: 34.6, dist: 55 }, ponto: { lon: 31.5, lat: 42.5, dist: 90 }, golfo: { lon: -5.5, lat: 45.5, dist: 70 },
  /* C11: pueblos y tribus */ celtiberia: { lon: -3.2, lat: 40.6, dist: 50 }, numidia: { lon: 5.5, lat: 34.8, dist: 50 }, aldea: { lon: -2.4, lat: 41.0, dist: 12 }, mapalia: { lon: 7.3, lat: 35.6, dist: 12 }, balcanes: { lon: 21.5, lat: 43.2, dist: 60 },
  /* C16: ciudades grandes */ cartago: { c: 'carthago', dist: 20 }, rusellae: { c: 'rusellae', dist: 14 }, romaCerca: { c: 'roma', dist: 12 }, siracusa: { c: 'syracusae', dist: 22 },
  /* C12: calzadas y puertos */ apia: { lon: 13.4, lat: 41.5, dist: 30 }, flaminia: { lon: 12.4, lat: 43.2, dist: 60 }, egeo: { lon: 26.0, lat: 35.5, dist: 110 }, ostia: { lon: 12.6, lat: 41.6, dist: 22 } };
const vistas = (op.vistas || 'italia,alpes,sicilia,grecia,costa,baja').split(',');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: +(op.ancho || 390), height: +(op.alto || 844) }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
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
if (op.rutas) await page.evaluate(() => {   // K7a: rutas de prueba con rentas distintas y relaciones con Roma, para ver grosor y marcas
  const G = window.Game, s = G.state, par = [['roma', 'capua'], ['roma', 'neapolis'], ['roma', 'volsinii'], ['roma', 'clusium'], ['neapolis', 'tarentum'], ['roma', 'syracusae']];
  for (const [a, b] of par) if (s.cities[a] && s.cities[b] && !G.rutaDe(a, b)) s.rutas.push({ a: a, b: b, f: s.cities[b].owner });
  if (s.cities.roma) s.cities.roma.b.mercado = 6; s.dip = s.dip || {}; if (s.cities.tarentum) s.dip[s.cities.tarentum.owner] = { estado: 'alianza', desde: s.t }; if (s.cities.syracusae) s.dip[s.cities.syracusae.owner] = { estado: 'tributo', desde: s.t };
});
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
const medir = () => page.evaluate(() => { const i = UI.map.r.info.render; return i.triangles + ' triángulos, ' + i.calls + ' llamadas'; });
for (const v of vistas) {
  await page.evaluate(([v, V]) => { const m = UI.map; m.c.dist = V.dist; if (V.c) m.center(V.c); else { m.c.x = (V.lon + 7) * 5; m.c.z = (47 - V.lat) * 6.4; } m.clamp(); }, [v, VISTAS[v]]);
  await page.waitForTimeout(3500);
  if (VISTAS[v].drag) for (let i = 0; i < 3; i++) { const sx = 195 - VISTAS[v].drag * 140; await page.mouse.move(sx, 480); await page.mouse.down(); for (let k = 1; k <= 10; k++) await page.mouse.move(sx + VISTAS[v].drag * 28 * k, 480 + (k % 2)); await page.mouse.up(); await page.waitForTimeout(800); }
  if (VISTAS[v].drag) { await page.waitForTimeout(2000); console.log(v + ': c.x ' + (await page.evaluate(() => UI.map.c.x)).toFixed(1)); }
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
