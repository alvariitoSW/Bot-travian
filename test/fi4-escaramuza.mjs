/* AQVILA — FI4: la física en una escaramuza (js/ui-mando.js) en el navegador. Uso: node test/fi4-escaramuza.mjs [vh] [fisica=0]
   [mando=/ruta/ui-mando.js]: sirve esa copia en vez de js/ui-mando.js (para probar el parche de FI4 sin tocar el archivo de LP7b).
   Lleva la escaramuza al primer choque y a la lucha; guarda capturas en gobierno/capturas-tarea/FI4-esc-*.jpg y la medida. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const arg = process.argv.slice(2), op = Object.fromEntries(arg.filter(a => a.includes('=')).map(a => a.split('=')));
const vistas = (arg.find(a => /^[vh]+$/.test(a)) || 'vh').split(''), fis = op.fisica === '0' ? 0 : 1, pref = op.pref || 'FI4-esc-';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(p === '/js/ui-mando.js' && op.mando ? op.mando : join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const errores = [];
for (const v of vistas) {
  const [W, H] = v === 'v' ? [390, 844] : [844, 390];
  const ctx = await br.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errores.push(v + ': ' + m.text()); }); page.on('pageerror', e => errores.push(v + ': ' + e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html?fisica=${fis}`);
  await page.waitForFunction('window.UIMando && window.Simulador && window.DATA', null, { timeout: 60000 });
  await page.evaluate(() => { const e = [{ hastati: 960, principes: 960, triarii: 480, velites: 640, equites: 120 }, { galos: 2400, iberos: 960, numidas: 240 }]; e.pueblo = 'roma'; window.UIMando.abrir({ semilla: 20261124, ejercitos: e, campo: 'llano' }, () => {}); });
  await page.waitForFunction('window.__mn && window.__mn.lista === true', null, { timeout: 180000 });
  const mn = (f, ...a) => page.evaluate(([f, a]) => window.__mn[f](...a), [f, a]);
  await mn('pausa', false);
  /* hasta el primer choque (cuadros de 0,1 s: la física corre en cada uno) */
  for (let k = 0; k < 2000; k++) { const c = await page.evaluate(() => { const S = window.__mn.S; for (let j = 0; j < 10; j++) window.__mn.cuadro(0.1); return S.cont && Object.keys(S.cont).some(i => S.cont[i] && S.cont[i].length); }); if (c) break; }
  async function foto(nombre, d) {
    await page.evaluate(d => { const S = window.__mn.S, i = Object.keys(S.cont || {}).find(i => S.cont[i] && S.cont[i].length && S.man[i].lado === 0), u = S.man[i || 0]; window.__mn.camara({ x: u.x, z: -u.y, d }); window.__mn.cuadro(0.05); }, d);
    const e = await mn('estado'), f = await page.evaluate(() => window.__mn.fisica ? window.__mn.fisica() : null);
    await page.screenshot({ path: join(SALIDA, pref + nombre + '-' + v + '.jpg'), type: 'jpeg', quality: 82 });
    console.log(v, nombre, 't', e.t.toFixed(1), 'llamadas', e.llamadas, 'tri', e.tri, JSON.stringify(f));
  }
  await page.evaluate(() => { for (let j = 0; j < 30; j++) window.__mn.cuadro(0.1); }); await foto('choque', 60);
  await page.evaluate(() => { for (let j = 0; j < 200; j++) window.__mn.cuadro(0.1); }); await foto('lucha', 45);
  await ctx.close();
}
await br.close(); srv.close();
if (errores.length) { console.log('ERRORES', errores.slice(0, 8)); process.exit(1); }
console.log('sin errores de consola');
