/* CD5b: capturas de barrios, ficha y capa de necesidades. (Copia de captura-cd1a.mjs.) CV4a: captura de la vista de plano de una ciudad a 390×844. Uso: node gobierno/captura-cv4a.mjs <nombre> [ciudad=roma] [dpr=2] [mes=1] [cerca=1]
   Deja gobierno/capturas-tarea/CV4a-<nombre>.jpg. cerca=1 saca además CV4a-<nombre>-cerca.jpg (la vista de siempre). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [nombre = 'plano', ...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => a.split('='))), ciudad = op.ciudad || 'roma', dpr = +(op.dpr || 2);
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
await page.evaluate(() => UI.cityV.planoBase()); await page.waitForTimeout(5000);
await page.waitForFunction(() => window.BarrioUI && window.BarrioUI.estado.D, null, { timeout: 30000 });
/* escenario: unas obras terminadas junto a las casas para que haya zonas, gotas y barras variadas (solo para la captura) */
const puesto = await page.evaluate(async () => {
  const CI = await import('/js/ciudad.js'), E = Game.ciudadE(UI.city), cs = E.parcelas.filter(p => p.casa), out = [];
  for (const tipo of ['fuente', 'templo', 'escuela', 'fuente']) {
    let ok = false;
    for (const p of cs) { for (const [dx, dz] of [[22, 0], [-22, 0], [0, 22], [0, -22], [30, 14], [-30, -14], [14, 32], [-14, -32]]) { const x = p.x + dx, z = p.z + dz; if (!CI.notaSitio(E, tipo, x, z).vale) continue; const r = CI.colocar(E, tipo, x, z, true); if (r.ok) { r.e.obra = 0; E.rev++; ok = true; out.push(tipo + '@' + (x | 0) + ',' + (z | 0)); break; } } if (ok) break; }
  }
  return out;
});
console.log('obras:', puesto.join(' '));
await page.waitForTimeout(1500);
await page.waitForTimeout(1500);
await foto('barrios');
const info = await page.evaluate(() => { const D = BarrioUI.estado.D; return { barrios: D.barrios.map(b => [b.i, b.nombre, b.n, b.animo, b.estado, b.ficha.nivel.id].join(' ')), casas: D.casas.length, servicios: D.servicios.map(s => s.tipo) }; });
console.log(JSON.stringify(info));
const mejor = await page.evaluate(() => { const D = BarrioUI.estado.D; return D.barrios.reduce((a, b) => b.n > a.n ? b : a).i; });
await page.evaluate(i => BarrioUI.abrirFicha(i), op.barrio !== undefined ? +op.barrio : mejor); await page.waitForTimeout(1500);
await foto('ficha');
await page.evaluate(() => BarrioUI.cerrar()); await page.waitForTimeout(500);
await page.click('#bui-capa'); await page.waitForTimeout(600);
await page.evaluate(n => BarrioUI.ponerCapa(n), op.capa || 'agua'); await page.waitForTimeout(1500);
await foto('capa-agua');
console.log(await page.evaluate(() => { const i = UI.cityV.r.info.render; return i.triangles + ' triángulos, ' + i.calls + ' llamadas'; }));
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'sin errores de consola');
await br.close(); srv.close();
