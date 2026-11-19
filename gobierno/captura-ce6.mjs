/* CE6: capturas del Senado de familias a 390×844. Uso: node gobierno/captura-ce6.mjs <guardado v1.json>
   Deja gobierno/capturas-tarea/CE6-nueva-sala.jpg, CE6-nueva-bandos.jpg, CE6-crecida-sala.jpg, CE6-crecida-bandos.jpg, CE6-vieja-bandos.jpg. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(RAIZ, 'gobierno/capturas-tarea');
const vieja = process.argv[2] ? await readFile(process.argv[2], 'utf8') : null;
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'Content-Type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errores = [];
async function pagina(guardado) {
  const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
  if (guardado) await page.addInitScript(g => { try { localStorage.setItem('aqvila-save-v1', g); } catch (e) {} }, guardado);
  await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await page.waitForSelector(guardado ? '#menu [data-act="continue"]' : '#menu [data-act="new"]', { timeout: 60000 }).catch(async () => { errores.push('menú sin botón; html: ' + (await page.evaluate(() => (document.getElementById('menu') || {}).innerText || '')).slice(0, 300)); });
  await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
  await page.click(guardado ? '#menu [data-act="continue"]' : '#menu [data-act="new"]'); await page.waitForTimeout(4000);
  return page;
}
const cierra = p => p.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
const alSenado = p => p.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'tab'; b.dataset.v = 'senado'; document.body.appendChild(b); b.click(); b.remove(); });
const foto = async (p, n, abajo) => { await cierra(p); await alSenado(p); await p.waitForTimeout(800); if (abajo) await p.evaluate(() => { document.querySelectorAll('*').forEach(e => { if (e.scrollHeight > e.clientHeight + 4) e.scrollTop = e.scrollHeight; }); }); await p.evaluate(() => document.querySelectorAll('.toast,#toast').forEach(t => t.remove())); await p.waitForTimeout(400); await p.screenshot({ path: join(OUT, 'CE6-' + n + '.jpg'), quality: 80 }); console.log('captura CE6-' + n + '.jpg'); };
const sinVoto = p => p.evaluate(() => { Game.state.senado.votacion = null; });
const info = p => p.evaluate(() => { const b = Game.senadoBandos(); return b.total + ' escaños, mayoría ' + b.mayoria + ', familia ' + b.familia + ' · ' + b.bandos.filter(x => x.activo).map(x => x.fam + ' ' + x.escanos + ' (humor ' + x.humor + ')').join(', '); });
await mkdir(OUT, { recursive: true });
// 1. partida nueva
let p = await pagina(null);
await p.evaluate(() => { if (!Game.senadoSala()) { Game.state.senado.turnoVista = -1; Game.senadoEstacion(); } });
console.log('nueva:', await info(p));
await foto(p, 'nueva-sala'); await sinVoto(p); await foto(p, 'nueva-bandos', true);
// 2. Roma crecida: ciudades en Italia y fuera, templos y mucha plebe
await p.evaluate(() => { const s = Game.state; for (const id of ['tarentum', 'volsinii', 'neapolis', 'perusia', 'syracusae', 'messana', 'saguntum']) if (s.cities[id]) s.cities[id].owner = 'roma'; for (const id of Game.myCities()) { const c = s.cities[id]; c.pop = 900; c.b.templo = Math.max(c.b.templo || 0, 1); } s.senado.turnoVista = -1; Game.senadoEstacion(); if (!Game.senadoSala()) { s.senado.turnoVista = -1; Game.senadoEstacion(); } });
console.log('crecida:', await info(p));
await foto(p, 'crecida-sala'); await sinVoto(p); await foto(p, 'crecida-bandos', true);
// 3. partida vieja (Senado v1)
if (vieja) { const q = await pagina(vieja); console.log('vieja: v', await q.evaluate(() => Game.state.senado.v), '·', await info(q)); await sinVoto(q); await foto(q, 'vieja-bandos', true); }
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'Sin errores de consola');
await br.close(); srv.close();
