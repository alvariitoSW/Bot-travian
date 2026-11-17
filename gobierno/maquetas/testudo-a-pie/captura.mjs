// Maqueta GM43 «Testudo a pie»: deja las capturas en gobierno/capturas-tarea/ y falla si hay errores de consola.
// Uso:  node gobierno/maquetas/testudo-a-pie/captura.mjs            -> GM43-h-* (844x390) y GM43-v-* (390x844), dpr 2
//       node gobierno/maquetas/testudo-a-pie/captura.mjs dpr=1 prefijo=/ruta/p-   -> rápido, para iterar
//       node gobierno/maquetas/testudo-a-pie/captura.mjs --servir                 -> solo sirve la página (puerto 8379)
// Cada captura abre la maqueta con ?fase=… : la escena se coloca en ese momento y se congela.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8379 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/testudo-a-pie/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GM43-'), errores = [];
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };

async function foto(fase, nombre, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  await page.goto(URL0 + (fase ? '?fase=' + fase : ''));
  await page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });
  await page.waitForTimeout(1500);
  const e = await page.evaluate(() => window.__tp.estado());
  const cajas = await page.evaluate(() => [...document.querySelectorAll('.boton,.pildora,.gordo')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return { id: b.id, l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height }; }));
  bien(cajas.every(c => c.l >= 0 && c.r <= w && c.t >= 0 && c.b <= h && c.h >= 44), `${nombre}: los botones caben enteros y miden al menos 44 px (${cajas.map(c => c.id).join(', ')})`);
  bien(cajas.filter(c => c.id !== 'otra').every(c => c.t > h * 0.55 || c.b < h * 0.2), `${nombre}: ningún botón tapa el centro`);
  await page.screenshot({ path: prefijo + nombre + '.jpg', type: 'jpeg', quality: 82, timeout: 240000 });
  console.log(`${nombre}: ${JSON.stringify(e)}`);
  await ctx.close(); return e;
}

const H = [844, 390], V = [390, 844];
let e = await foto('avance', 'h-1-avance', ...H); bien(e.vivos === 30 && e.k === 0, 'avance: los 30 en pie y sin testudo');
e = await foto('flechas', 'h-2-flechas', ...H); bien(e.flechas > 20, 'flechas: hay flechas en el aire (' + e.flechas + ')');
e = await foto('testudo', 'h-3-testudo', ...H); bien(e.k > 0.99 && e.vivos < 30, 'testudo: escudos arriba y ya hubo bajas de antes (' + e.vivos + ' en pie)');
e = await foto('pila', 'h-4-pila', ...H); bien(e.fase === 'lanzando', 'pila: los pila están en el aire');
e = await foto('final', 'h-5-final', ...H); bien(e.fase === 'fin', 'final: sale la tarjeta');
await foto('avance', 'v-1-avance', ...V);
await foto('testudo', 'v-3-testudo', ...V);
/* partida en vivo, sin fase: mantener «Avanzar» con el ratón, pulsar «Escudos» con el dedo */
{
  const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage();
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  page.on('console', m => { if (m.type() === 'error') { errores.push(m.text().slice(0, 300)); console.log('  [error] ' + m.text().slice(0, 300)); } });
  await page.goto(URL0); await page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });
  const b = await page.locator('#avanzar').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.waitForTimeout(2500); const e1 = await page.evaluate(() => window.__tp.estado()); await page.mouse.up();
  bien(e1.andando && e1.zF < 0, 'en vivo: mantener «Avanzar» pone el cuerpo en marcha (' + e1.zF.toFixed(1) + ' m con render por software)');
  await page.tap('#escudos'); await page.waitForTimeout(1500); const e2 = await page.evaluate(() => window.__tp.estado());
  bien(e2.k > 0.9, 'en vivo: «Escudos» forma el testudo');
  await ctx.close();
}
await br.close(); srv.close();
if (errores.length) { console.log('\nNO APTO: ' + errores.length + ' errores\n' + errores.join('\n')); process.exit(1); }
console.log('\nAPTO: capturas en ' + SALIDA);
