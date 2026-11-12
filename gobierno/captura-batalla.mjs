/* Capturas propias de una batalla en horizontal (carril Batallas).
   Uso: node gobierno/captura-batalla.mjs <prefijo> <seg1,seg2,...> [camara 0|1|2] [plantilla clasica|ancha|centro]
   Un tiempo 0 = captura del despliegue (antes de empezar); antes del primer tiempo > 0 se pulsa «Empezar batalla».
   Deja gobierno/capturas-tarea/<prefijo>-<seg>s.jpg. La batalla es fija: romanos contra cartagineses con las tres armas. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [pref = 'batalla', tiempos = '1,12,30', cam = '0', plantilla = ''] = process.argv.slice(2);
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 200)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/'); await page.waitForTimeout(1500);
await page.setViewportSize({ width: 390, height: 844 }); await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
await page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; }); await page.setViewportSize({ width: 844, height: 390 });
await page.evaluate(() => {
  const lado = (units, n, col, gen) => ({ units, name: n, col, gen: gen ? { n: gen } : null, atkMul: 1, defMul: 1, mor: 0 });
  UI.binfo = { cfg: { sides: [lado({ hastati: 240, principes: 160, triarii: 80, velites: 120, equites: 80 }, 'Roma', '#b3261e', 'Cónsul'), lado({ libios: 240, iberos: 160, honderos: 120, numidas: 80, elefantes: 16 }, 'Cartago', '#5b3a8c', 'Sufete')], defender: 1, wall: 0, seed: 7 }, city: 'roma', kind: 'attack' };
  const bt = document.createElement('button'); bt.dataset.act = 'bview'; document.body.appendChild(bt); bt.click(); bt.remove();
});
await page.waitForTimeout(11000);
await page.evaluate(c => { const B = UI.battle; B.view.intro = 1; for (let i = 0; i < +c; i++) B.view.cycleCam(); }, cam);
let empezada = false;
for (const t of tiempos.split(',').map(Number)) {
  if (t === 0 && plantilla) { await page.click('#bctl [data-act="bform"][data-v="' + plantilla + '"]'); await page.waitForTimeout(1500); }
  if (t > 0 && !empezada) { empezada = true; if (await page.locator('#bctl [data-act="bstart"]').count()) await page.click('#bctl [data-act="bstart"]'); await page.evaluate(() => { const h = document.getElementById('bhint'); if (h) h.style.opacity = 0; }); }
  // adelanta la simulación hasta el segundo t y deja 2,5 s reales para que los muñecos lleguen a su sitio
  await page.evaluate(t => { const b = UI.battle.b; while (b.t < t - 2.5 && !b.over) { if (b.fase === "plan") b.ejecutar(); b.step(0.1); } }, t);
  await page.waitForTimeout(2600);
  const f = join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + t + 's.jpg');
  await page.screenshot({ path: f, type: 'jpeg', quality: 70, timeout: 120000 });
  console.log(f, await page.evaluate(() => 't=' + UI.battle.b.t.toFixed(1) + ' ' + UI.battle.b.men(0) + ' contra ' + UI.battle.b.men(1)));
}
console.log(errores.length ? 'ERRORES DE CONSOLA:\n' + errores.join('\n') : 'Sin errores de consola');
await br.close(); srv.close();
