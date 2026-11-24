// LP6 «La falange con el mismo control que Manípulo a pie»: fotos, medidas y prueba de dedos de verdad (toques del navegador).
// Uso: node gobierno/maquetas/falange/captura-lp6.mjs [solo=marcha-v,...] [dpr=1] [pref=LP6] [dedos=0]
// Cada foto: una carga de página con ?fase=lp-… (semilla fija): se juega con el bot de mando.js hasta el momento y se congela.
// Mide llamadas de dibujo, triángulos, la física y los errores de consola. La prueba de dedos dibuja el frente arrastrando,
// toca una orden y pellizca hasta la vista del oficial. Imprime APTO o NO APTO.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/falange/';
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 1), pref = op.pref || 'LP6', errores = [], filas = [];
const TOPE = { llamadas: 30, triangulos: 750000, fisicaMs: 1 };
function escucha(page, nombre) {
  page.on('console', m => { const t = m.text(); if (/\[LP6\]/.test(t)) console.log('  ' + t.slice(0, 300)); if (m.type() === 'error' && !/GPU stall|GL Driver|willReadFrequently/.test(t)) { errores.push(nombre + ': ' + t.slice(0, 300)); console.log('  [error] ' + t.slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(nombre + ': ' + e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
const V = [390, 844], Hz = [844, 390];
const FOTOS = [];
for (const [n, q] of [['inicio', 'inicio=1'], ['dibuja', 'fase=lp-inicio'], ['marcha', 'fase=lp-marcha&t=7'], ['picas', 'fase=lp-picas'], ['choque', 'fase=lp-choque'], ['lucha', 'fase=lp-lucha&t=30'], ['oficial', 'fase=lp-lucha&t=22&vista=oficial'], ['final', 'fase=lp-final']])
  for (const [o, wh] of [['v', V], ['h', Hz]]) FOTOS.push([n + '-' + o, wh, q]);
const solo = op.solo ? op.solo.split(',') : null, SEMILLA = op.semilla || '12';
/* un dedo que arrastra por el suelo (toques de verdad por CDP); fin = false lo deja puesto (foto de la raya mientras se dibuja) */
async function arrastra(page, cdp, a, b, fin = true) {
  const P = (x, y) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: P(a[0], a[1]) });
  for (let k = 1; k <= 12; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: P(a[0] + (b[0] - a[0]) * k / 12, a[1] + (b[1] - a[1]) * k / 12) }); await page.waitForTimeout(30); }
  if (fin) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function pellizca(page, cdp, abre = true) {
  const c = [195, 470], d0 = abre ? 30 : 140, d1 = abre ? 140 : 30, P = d => [{ x: c[0] - d, y: c[1], id: 1 }, { x: c[0] + d, y: c[1], id: 2 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: P(d0) });
  for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: P(d0 + (d1 - d0) * k / 10) }); await page.waitForTimeout(30); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
const medir = page => page.evaluate(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(() => ok({ ...window.__tp.info(), fisica: window.__tp.fisica ? window.__tp.fisica().ms : 0 })))));
for (const [nombre, [w, h], q] of FOTOS) {
  if (solo && !solo.includes(nombre)) continue;
  const t0 = Date.now(), ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page, nombre);
  try {
    await page.goto(URL0 + '?antiguo=1&' + q + '&semilla=' + SEMILLA + (op.extra ? '&' + op.extra : ''));
    await page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 150000, polling: 500 });
    await page.waitForTimeout(2500);
    if (nombre.startsWith('dibuja')) { const cdp = await ctx.newCDPSession(page); await arrastra(page, cdp, [w * 0.3, h * 0.42], [w * 0.78, h * 0.36], false); await page.waitForTimeout(600); }
    const r = await page.evaluate(() => { const S = window.__tp.S, L = window.__tp.lee(); return { T: +S.T.toFixed(1), choque: S.choque, filas: S.filas.filter(Boolean).length, U: S.U.enPie, R: S.R.enPie, ganador: S.ganador, conviene: L.conviene, objetivo: document.getElementById('objetivo').textContent, raya: window.__tp.dedosActivo() }; });
    const m = await medir(page);
    await page.screenshot({ path: join(SALIDA, pref + '-' + nombre + '.jpg'), type: 'jpeg', quality: 82 });
    const fila = { nombre, ...r, ...m, seg: Math.round((Date.now() - t0) / 1000) }; filas.push(fila);
    console.log(JSON.stringify(fila));
  } catch (e) { errores.push(nombre + ': guion: ' + String(e.message || e).split('\n')[0]); console.log('  MAL ' + nombre + ': ' + e.message.split('\n')[0]); }
  await ctx.close();
}
/* la prueba de dedos (vertical): partida viva, sin congelar */
const pruebas = [];
if (op.dedos !== '0') {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page, 'dedos');
  const ok = (n, v, d = '') => { pruebas.push([n, !!v, d]); console.log((v ? 'ok  ' : 'MAL ') + n + (d ? ' — ' + d : '')); };
  try {
    await page.goto(URL0 + '?antiguo=1&semilla=' + SEMILLA); await page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 150000, polling: 500 });
    ok('la tarjeta de inicio para la partida', await page.evaluate(() => !document.getElementById('inicio').hidden));
    await page.tap('#empieza'); await page.waitForTimeout(400);
    const cdp = await ctx.newCDPSession(page);
    const a = await page.evaluate(() => ({ x: window.__tp.S.xF, z: window.__tp.S.zF }));
    await arrastra(page, cdp, [110, 360], [300, 330]); await page.waitForTimeout(300);
    const meta = await page.evaluate(() => { const m = window.__tp.mando().meta(); return m ? { x: m.x, z: m.z, rumbo: m.rumbo } : null; });
    ok('arrastrar por el suelo pone el frente', meta, JSON.stringify(meta));
    await page.waitForFunction(a0 => { const S = window.__tp.S; return Math.hypot(S.xF - a0.x, S.zF - a0.z) > 1 || Math.abs(S.giro) > 0.05; }, a, { timeout: 120000, polling: 300 }).then(() => ok('el muro se mueve hacia la raya', true), () => ok('el muro se mueve hacia la raya', false));
    await page.tap('.orden[data-o=picas]'); await page.waitForTimeout(300);
    ok('«Bajar picas» baja las cinco filas', await page.evaluate(() => window.__tp.S.filas.every(Boolean)));
    ok('y el botón pasa a «Alzar picas»', await page.evaluate(() => document.querySelector('.orden[data-o=picas] b').textContent === 'Alzar picas'));
    const m0 = await page.evaluate(() => JSON.stringify(window.__tp.mando().meta()));
    await pellizca(page, cdp, true); await page.waitForTimeout(500);
    ok('el pellizco baja a la vista del oficial', await page.evaluate(() => window.__tp.vista().modo() === 'oficial'));
    ok('el pellizco no dibuja frente', await page.evaluate(m => JSON.stringify(window.__tp.mando().meta()) === m || !window.__tp.mando().meta(), m0));
    await page.waitForFunction(() => window.__tp.vista().t() >= 1, null, { timeout: 60000, polling: 200 }).then(() => ok('llega al hombro', true), () => ok('llega al hombro', false));
    const mm = await medir(page); ok('abajo: llamadas ≤ 30 y triángulos ≤ 750 mil', mm.llamadas <= 30 && mm.triangulos <= 750000, JSON.stringify(mm));
    await page.tap('.orden[data-o=alto]'); await page.waitForTimeout(200);
    ok('desde abajo, las órdenes siguen vivas («Alto» para la marcha)', await page.evaluate(() => !window.__tp.mando().meta() || window.__tp.S.choque));
    await pellizca(page, cdp, false); await page.waitForTimeout(400);
    ok('el pellizco al revés sube', await page.evaluate(() => window.__tp.vista().modo() === 'arriba'));
    const P = await page.evaluate(() => ({ bien: window.__tp.partidaMando('bien'), nada: window.__tp.partidaMando('nada') }));
    ok('partida con el mando (bot que toca lo iluminado): gana', P.bien.ganador === 'falange', JSON.stringify(P.bien));
    ok('partida sin bajar las picas: pierde', P.nada.ganador === 'rival', JSON.stringify(P.nada));
  } catch (e) { errores.push('dedos: guion: ' + String(e.message || e).split('\n')[0]); console.log('  MAL dedos: ' + e.message.split('\n')[0]); }
  await ctx.close();
}
await br.close(); srv.close();
const mal = [...errores, ...pruebas.filter(p => !p[1]).map(p => 'prueba: ' + p[0])];
for (const f of filas) { if (f.llamadas > TOPE.llamadas) mal.push(f.nombre + ': llamadas ' + f.llamadas); if (f.triangulos > TOPE.triangulos) mal.push(f.nombre + ': triángulos ' + f.triangulos); if (f.fisica > TOPE.fisicaMs) mal.push(f.nombre + ': física ' + f.fisica + ' ms'); }
console.log(mal.length ? 'NO APTO\n  ' + mal.join('\n  ') : 'APTO');
process.exit(mal.length ? 1 : 0);
