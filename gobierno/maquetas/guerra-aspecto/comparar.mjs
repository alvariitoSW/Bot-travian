// Maqueta GM4 — juega la batalla grande en un móvil simulado, deja las capturas y MIDE (hombres, cartones, figuras, triángulos, fluidez).
// Uso:  node gobierno/maquetas/guerra-aspecto/captura.mjs                         -> capturas GM4-* (dpr 2) en gobierno/capturas-tarea/
//       node gobierno/maquetas/guerra-aspecto/captura.mjs dpr=1 prefijo=/ruta/p-   -> rápido, para iterar
//       node gobierno/maquetas/guerra-aspecto/captura.mjs --servir                 -> solo sirve la página
// Los toques son de dedo de verdad sobre los botones; el tiempo se adelanta con el gancho window.__gc.salta.
// La fluidez de aquí es con render por software: sirve para comparar unos tamaños con otros y con GC1, no como dato de un móvil.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8379 : 0, '127.0.0.1', () => ok(s)); });
const BASE = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/', URL0 = BASE + 'guerra-aspecto/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GM32-'), errores = [], tabla = [];
const espera = (p, ms) => p.waitForTimeout(ms);
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
async function abrir(url, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  const t0 = Date.now(); await page.goto(url); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 300000 });
  return { ctx, page, carga: (Date.now() - t0) / 1000 };
}
/* milisegundos por imagen, con la batalla en marcha (60 imágenes seguidas) */
const ritmo = page => page.evaluate(() => new Promise(ok => { let k = 0, t0 = 0; const f = t => { if (!t0) t0 = t; if (++k > 60) ok((t - t0) / 60); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));


/* GM32: la MISMA escena (semilla 4242, 5 000 por bando) con aspecto=0 y con aspecto encendido; mide triángulos y ms por imagen */
const hombres = +(op.hombres || 5000), medidas = [];
async function escena(modo, nombre, w, h, extra) {
  const { ctx, page } = await abrir(URL0 + '?semilla=4242&hombres=' + hombres + (modo === 'antes' ? '&aspecto=0' : '') + (op.sin ? '&sin=' + op.sin : ''), w, h);
  const g = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]), pulsa = async sel => { await page.tap(sel); await espera(page, 250); };
  await g('pausa', true); await g('salta', 3);
  const foto = async n => { await espera(page, 1500); await g('mirar', -1, 0); await espera(page, 600); await page.screenshot({ path: prefijo + modo + '-' + n + '.jpg', type: 'jpeg', quality: 80, timeout: 240000 }); const e = await g('estado'); return e; };
  if (nombre === 'vertical') {
    const a = await foto('vertical-1-llegada'); medidas.push({ modo, v: 'llegada', tri: a.tri });
    await g('salta', 6); await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="empujar"]'); await g('salta', 5);
    const b = await foto('vertical-2-choque'); await g('pausa', false); const ms = await ritmo(page); await g('pausa', true); medidas.push({ modo, v: 'choque vertical', tri: b.tri, ms });
    await pulsa('#ojo'); await g('pausa', false); await espera(page, 2500); const msC = await ritmo(page); await g('pausa', true);
    const c = await foto('vertical-3-cerca'); medidas.push({ modo, v: 'de cerca', tri: c.tri, figs: c.figs, ms: msC });
  } else {
    await g('salta', 14); await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="empujar"]'); await g('salta', 5);
    const b = await foto('horizontal-2-choque'); await g('pausa', false); const ms = await ritmo(page); await g('pausa', true); medidas.push({ modo, v: 'choque horizontal', tri: b.tri, ms });
    await pulsa('#ojo'); await g('pausa', false); await espera(page, 2500); await g('pausa', true); await foto('horizontal-3-cerca');
  }
  await ctx.close();
}
for (const modo of ['antes', 'despues']) { if (op.modo && op.modo !== modo) continue; if (op.vista !== 'horizontal') await escena(modo, 'vertical', 390, 844); if (op.vista !== 'vertical') await escena(modo, 'horizontal', 844, 390); }
console.log('\nMEDIDAS (' + hombres + ' por bando, render por software):'); for (const m of medidas) console.log(`${m.modo.padEnd(8)} ${m.v.padEnd(18)} triángulos ${String(m.tri).padStart(8)}${m.figs !== undefined ? ' · figuras ' + m.figs : ''}${m.ms ? ' · ' + m.ms.toFixed(0) + ' ms/imagen' : ''}`);
console.log(errores.length ? 'NO APTO · ' + errores.length + ' fallos:\n' + errores.join('\n') : 'APTO · sin errores de consola');
await br.close(); srv.close(); process.exit(errores.length ? 1 : 0);
