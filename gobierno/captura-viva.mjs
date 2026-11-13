/* Ciudad viva (CN15a): node gobierno/captura-viva.mjs [prefijo] [vistas=a,b] → gobierno/capturas-tarea/<prefijo>-<vista>.jpg y triángulos de cada vista.
   Vistas: plaza (puestos del foro), plaza-cart (plaza con cultura púnica), barrios (casas ricas y pobres juntas), primavera/verano/otono/invierno (misma vista), grie (ciudad griega, cámara pegada, todo a nivel 4).
   Copiado de captura-cultura.mjs (captura-ciudad.mjs no se toca). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [pref = 'CN15a', ...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => a.split('='))), dpr = +(op.dpr || 1);
const ciudad = 'roma', vistas = (op.vistas || 'plaza,plaza-cart,barrios,primavera,verano,otono,invierno,grie').split(',');
const LUZ_ESTACIONAL = true;          // Q11: false = sin mes= ni vistas de luz (la ciudad usa la luz de siempre)
const ponerFecha = (mes, frac) => page.evaluate(([m, f]) => { Game.state.speed = 0; Game.state.t = 24 + (m - 1) + f; }, [mes, frac]);     // inversa de G.estacion: enero = invierno, 3 meses por turno
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
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
const elegir = c => page.evaluate(c => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = c; UI.city = c; document.body.appendChild(b); b.click(); b.remove(); }, c);
await page.evaluate(() => { Game.state.speed = 0; const c = Game.state.cities.roma; for (const b in DATA.BUILD) c.b[b] = Math.max(c.b[b] || 0, 5); });
const mirarPlaza = (d, az) => page.evaluate(([d, az]) => { const E = Game.ciudadE('roma'); UI.cityV.view('ciudad'); UI.cityV.mirar(E.foro.x, E.foro.z, d, az); }, [d, az]);
for (const v of vistas) {
  const est = { primavera: 4, verano: 7, otono: 10, invierno: 1 }[v];
  const cul = v === 'plaza-cart' ? 'cart' : v === 'grie' ? 'grie' : 'roma';
  await page.evaluate(([cul, v]) => { const E = Game.ciudadE('roma'); E.cultura = cul;
    for (const l of E.parcelas) if (l.casa) { l.casa.ruina = 0; l.casa.nivel = v === 'grie' ? 4 : l.casa.nivel; }
    if (v === 'barrios') { E.barrios.forEach((b, i) => { b.nivel = i % 2 ? 4 : 1; }); for (const l of E.parcelas) if (l.casa) l.casa.nivel = E.barrios[l.barrio] && E.barrios[l.barrio].nivel === 4 ? 4 : 2; }
    E.rev++; }, [cul, v]);
  await elegir('capua'); await page.waitForTimeout(2500); await elegir('roma'); await page.waitForTimeout(9000); await cierra();
  if (est) await ponerFecha(est, 0.3);
  if (v === 'grie') await mirarPlaza(150, 0.5); else if (v === 'barrios') { await page.evaluate(() => { const E = Game.ciudadE('roma'); const l = E.parcelas.find(l => l.casa && !l.fuera && E.barrios[l.barrio] && E.barrios[l.barrio].nivel === 4 && Math.hypot(l.x - E.foro.x, l.z - E.foro.z) > 40) || E.parcelas.find(l => l.casa); UI.cityV.view('ciudad'); UI.cityV.mirar(l.x, l.z, 90, 0.6); }); }
  else if (est) await mirarPlaza(330, 0.5); else await mirarPlaza(+(op.d || 110), 0.4);
  await page.waitForTimeout(5000);
  const f = join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + v + '.jpg');
  for (let i = 0; ; i++) { try { await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } }
  console.log(f + ' · ' + await medir());
}
if (errores.length) console.log('ERRORES DE CONSOLA:\n' + [...new Set(errores)].join('\n')); else console.log('Sin errores de consola.');
await br.close(); srv.close();
