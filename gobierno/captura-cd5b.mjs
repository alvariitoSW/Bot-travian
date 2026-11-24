/* CV4a: captura de la vista de plano de una ciudad a 390×844. Uso: node gobierno/captura-cd5b.mjs <nombre> [ciudad=roma] [dpr=2] [mes=1] [cerca=1]
   Deja gobierno/capturas-tarea/CV4a-<nombre>.jpg. cerca=1 saca además CV4a-<nombre>-cerca.jpg (la vista de siempre). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [nombre = 'plano', ...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)])), ciudad = op.ciudad || 'roma', dpr = +(op.dpr || 2);
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
await page.evaluate(m => { Game.state.speed = 0; const a = Game.state.ajustes; if (a) a.asesor = false; if (m) Game.state.t = 24 + (m - 1) + 0.5; }, +(op.mes || 0));
await page.waitForTimeout(1500);
const foto = n => page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea/CD5b-' + n + '.jpg'), type: 'jpeg', quality: 82 });
await page.evaluate(() => UI.cityV.planoBase()); await page.waitForTimeout(4000);
if (op.js) console.log(await page.evaluate(op.js));
if (op.lleno) { await page.evaluate(() => { const E = Game.ciudadE('roma'); E.parcelas.forEach((l, i) => { if (l.fuera) return; l.casa = l.casa || { nivel: 1, desde: 0, nace: 0, ruina: 0 }; l.casa.nivel = 2 + i % 3; }); for (const b of E.barrios) b.nivel = 4; E.rev++; }); await page.waitForTimeout(4000); }
console.log(await page.evaluate(async () => JSON.stringify((await import('/js/gfx/city3d.js')).solapes())));
await foto('arriba');
await page.evaluate(() => { const c = UI.cityV.cv; for (let i = 0; i < 12; i++) c.dispatchEvent(new WheelEvent('wheel', { deltaY: -150, bubbles: true, cancelable: true })); }); await page.waitForTimeout(3000);
await foto('cerca');
const ir = (x, z, d) => page.evaluate(async ([x, z, d]) => { const m = await import("/js/gfx/city3d.js"); m.cam.tx = x; m.cam.tz = z; m.cam.d = d; }, [x, z, d]);
if (op.estados) {      // tres barrios a la vista: el del foro en revuelta, uno al norte cae, uno al sur sube (estados=sube,cae,revuelta fuerza otros)
  const [e0, e1, e2] = (op.estados === '1' ? 'revuelta,cae,sube' : op.estados).split(',');
  await page.evaluate(async ([a, b, c]) => { const E = Game.ciudadE('roma'), m = await import('/js/gfx/city3d.js'); if (E.barrios.length < 3) E.barrios.push({ nombre: 'Barrio Norte', corto: 'N', x: 235, z: -305, tipo: 'barrio', nivel: 2, bdef: 0, caracter: 'llano' }, { nombre: 'Barrio Sur', corto: 'S', x: 85, z: -175, tipo: 'barrio', nivel: 2, bdef: 0, caracter: 'llano' }); E.rev++;
    await new Promise(r => setTimeout(r, 2500)); m.estadoBarrioVista(0, a); m.estadoBarrioVista(1, b); m.estadoBarrioVista(2, c); }, [e0 || null, e1 || null, e2 || null]);
  await page.waitForTimeout(2500); await ir(160, -240, 260); await page.waitForTimeout(3500); await foto('estados');
  await ir(235, -305, 118); await page.waitForTimeout(3000); await foto('estado-cae');
  await ir(160, -240, 118); await page.waitForTimeout(3000); await foto('estado-revuelta');
  await ir(85, -175, 118); await page.waitForTimeout(3000); await foto('estado-sube');
  console.log(await page.evaluate(() => { const i = UI.cityV.r.info.render; return 'estados: ' + i.triangles + ' triángulos, ' + i.calls + ' llamadas'; }));
}
console.log(await page.evaluate(() => { const i = UI.cityV.r.info.render; return i.triangles + ' triángulos, ' + i.calls + ' llamadas'; }));
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'sin errores de consola');
await br.close(); srv.close();
