/* CDe3-F2c: capturas de Agricultura (menú Construir, hoja de plantar, ciudad con un campo de cada). Uso: node gobierno/captura-cde3-agro.mjs [ciudad=roma] */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => a.split('='))), ciudad = op.ciudad || 'roma', dpr = +(op.dpr || 2);
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end('no'); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
const page = await ctx.newPage();
const errores = []; page.setDefaultTimeout(150000);
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
await page.evaluate(t => { Game.state.speed = 0; const a = Game.state.ajustes; if (a) a.asesor = false; if (t) Game.turnos = true; }, op.turnos === '1');
await page.waitForTimeout(1500);
const foto = n => page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea/CDe3-agro-' + n + '.jpg'), type: 'jpeg', quality: 80 });
const clic = sel => page.evaluate(s => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
/* saberes y denarios por código */
await page.evaluate(() => { const s = Game.state; s.inv.hechas.vina = 1; s.inv.hechas.magon = 1; s.cities.roma.b.foro = 5; for (const k of ['denarios', 'materiales']) { s.res[k] = 9000; s.alm[k] = 9000; } UI.dirty = true; });
await clic('#tabs3 [data-v="ciudad"]'); await page.waitForTimeout(1200);
await clic('#cbtn'); await page.waitForTimeout(800); await foto('familias');
await clic('#cmenu [data-f="agricultura"]'); await page.waitForTimeout(800); await foto('construir-agricultura');
await page.evaluate(() => { document.getElementById('cmenu').scrollTop = 400; }); await page.waitForTimeout(300); await foto('construir-agricultura-2');
await page.evaluate(() => { document.getElementById('cmenu').scrollTop = 0; });
await clic('#cmenu [data-id="c:olivar"]'); await page.waitForTimeout(700); await foto('hoja-plantar-olivar');
await clic('#cmenu [data-cm="ag"]'); await page.waitForTimeout(300);
await clic('#cmenu [data-id="c:trigo"]'); await page.waitForTimeout(700); await foto('hoja-plantar-trigo');
await clic('#cmenu [data-cm="x"]'); await page.waitForTimeout(300);
/* un campo de cada tipo: cada uno en su mejor suelo, con sus mejoras */
const res = await page.evaluate(() => { const g = Game, c = UI.city, out = [];
  for (const [campo, suelo] of [['trigo', 'llano'], ['olivar', 'ladera_seca'], ['vina', 'ladera_sol'], ['huerto', 'ribera'], ['pasto', 'baja'], ['trigo', 'llano'], ['olivar', 'ladera_seca'], ['vina', 'ladera_sol']]) { const r = g.plantarCampo(c, campo, suelo); out.push(campo + ':' + (r.ok ? 'ok' : r.motivo)); }
  for (const p of g.parcelas(c)) for (const m of p.posibles) { const r = g.mejorarParcela(c, p.id, m); out.push(m + ':' + (r.ok ? 'ok' : r.motivo)); }
  out.push(JSON.stringify(g.parcelas(c).map(p => p.campo + '@' + p.suelo + (p.granja ? '(granja)' : '')))); return out; });
console.log(res.join('\n'));
await page.waitForTimeout(2500);
const { visto } = await page.evaluate(async () => { const C = await import('/js/gfx/campos.js'); const ps = C.parcelas(); return { visto: ps.map(p => ({ x: Math.round(p.x), z: Math.round(p.z), campo: p.campo, suelo: p.suelo, mej: p.mejoras })) }; });
console.log('vega:', JSON.stringify(visto.map(p => p.campo + '@' + p.suelo + '[' + p.mej.join('+') + ']')));
const vistos = [...new Set(visto.map(p => p.campo))];
for (const campo of ['trigo', 'olivar', 'vina', 'huerto', 'pasto']) { const p = visto.find(q => q.campo === campo); if (!p) { console.log('sin cuadro de', campo); continue; }
  await page.evaluate(q => { UI.cityV.mirar(q.x, q.z, 150, 0); }, p); await page.waitForTimeout(2500); await foto('campo-' + campo); }
const pm = visto.find(q => q.mej.length) || visto[0];
if (visto.length) { const cx = visto.reduce((a, q) => a + q.x, 0) / visto.length, cz = visto.reduce((a, q) => a + q.z, 0) / visto.length; await page.evaluate(q => UI.cityV.mirar(q.x, q.z, 520, 0), { x: cx, z: cz }); await page.waitForTimeout(2500); await foto('ciudad-campos'); }
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'sin errores de consola');
await br.close(); srv.close();
