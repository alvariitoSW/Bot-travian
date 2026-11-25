/* MN2: capturas del Senado (cuatro pestañas) y del Imperio en vertical (390×844) y horizontal (844×390).
   Uso: node gobierno/captura-mn2.mjs <prefijo>. Deja gobierno/capturas-tarea/<prefijo>-*.jpg y escribe errores y medidas. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), pref = process.argv[2] || 'MN2';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, serviceWorkers: 'block' });
const page = await ctx.newPage(), errores = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 300)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.evaluate(() => window.PORTADA && PORTADA.vista('campana'));   /* PN1: «Empezar la campaña» vive ahora en Partida nueva → Campaña */ await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(3000);
const cierra = () => page.evaluate(() => { Game.state.speed = 0; const m = document.getElementById('modal'); if (m) m.hidden = true; });
await cierra();
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
const foto = async n => { await page.waitForTimeout(500); await page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + n + '.jpg'), type: 'jpeg', quality: 80 }); console.log('foto ' + n); };
const barra = async v => { await page.click('#tabs3 [data-act="barra"][data-v="' + v + '"]'); await page.waitForTimeout(900); await cierra(); };
// más ciudades para que la lista de Imperio se desplace
await page.evaluate(() => { const s = Game.state; let n = 0; for (const id in s.cities) if (n < 8 && s.cities[id].owner !== 'roma' && /latin|etrus|romano|italic/i.test(String((window.Data || {}).CITIES?.[id]?.f || 'x')) ) { s.cities[id].owner = 'roma'; n++; } if (n < 5) for (const id of ['ostia', 'capua', 'veii', 'antium', 'tibur', 'praeneste', 'neapolis', 'clusium']) if (s.cities[id]) s.cities[id].owner = 'roma'; });
for (const [an, al, o] of [[390, 844, 'v'], [844, 390, 'h']]) {
  await page.setViewportSize({ width: an, height: al }); await page.waitForTimeout(800);
  await barra('senado');
  const tabs = await page.$$eval('[data-act="sent"]', b => b.map(x => x.dataset.v));
  if (!tabs.length) await foto(o + '-senado');
  for (const t of tabs) { await page.click('[data-act="sent"][data-v="' + t + '"]'); await page.waitForTimeout(500); await foto(o + '-senado-' + t); }
  await barra('imperio'); await foto(o + '-imperio');
  await page.evaluate(() => { const v = document.getElementById('view'), l = v.querySelector('.mar-lista'); v.scrollTop = 9999; if (l) l.scrollTop = 9999; }); await foto(o + '-imperio-abajo');
  console.log(o + ' medidas', JSON.stringify(await page.evaluate(() => { const t = document.getElementById('top').getBoundingClientRect(), v = document.getElementById('view'), cs = getComputedStyle(v); return { topAbajo: Math.round(t.bottom), viewArriba: Math.round(v.getBoundingClientRect().top), borde: cs.borderTopWidth, pad: cs.paddingTop }; })));
}
console.log(errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores de consola');
await br.close(); srv.close();
