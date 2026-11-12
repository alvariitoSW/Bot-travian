// Q5 Barrios con servicios: tres capturas a 390x844 en gobierno/capturas-tarea/Q5-{1-aldea,2-ciudad,3-baja}.jpg
// Uso: node gobierno/maquetas/Q5-capturas.mjs  (necesita playwright)
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
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
await page.evaluate(() => { document.querySelector('#tabs3 [data-act="tab3"][data-v="ciudad"]').click(); });
await page.waitForTimeout(10000);
await poner0();

async function poner0() { for (let i = 0; i < 4; i++) { await page.evaluate(() => { const b = document.querySelector('#modal [data-act="close"]'); if (b) b.click(); }); await page.waitForTimeout(400); } }
const sacar = async n => {
  await page.evaluate(() => { const ps = document.getElementById('popsheet'); ps.hidden = true; document.querySelector('[data-act="pill"]').click(); });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(SALIDA, n + '.jpg'), type: 'jpeg', quality: 82 });
};
const poner = f => page.evaluate(f);
// 1: Aldea sin servicios; consejo recomendando el templo (se enseña el consejo con la hoja cerrada y luego la ficha)
await poner(() => { const s = Game.state, c = s.cities.roma; c.b.templo = 0; c.b.acueducto = 0; c.b.anfiteatro = 0; c.b.termas = 0; c.barrio = 1; c.bdef = 0; for (const r of DATA.RES) { s.res[r] = 400; s.alm[r] = 400; } UI.metaK = null; });
await page.waitForTimeout(1500);
await page.screenshot({ path: join(SALIDA, 'Q5-1a-consejo.jpg'), type: 'jpeg', quality: 82 });
await sacar('Q5-1-aldea');
// 2: con templo, acueducto y anfiteatro: Ciudad
await poner(() => { const c = Game.state.cities.roma; c.b.templo = 1; c.b.acueducto = 1; c.b.anfiteatro = 1; c.barrio = 3; c.bdef = 0; });
await sacar('Q5-2-ciudad');
// 3: pierde el agua: déficit
await poner(() => { const c = Game.state.cities.roma; c.b.acueducto = 0; c.bdef = 1; });
await sacar('Q5-3-baja');
console.log('errores de consola:', errs.length ? errs : 'ninguno');
await br.close(); srv.close();
