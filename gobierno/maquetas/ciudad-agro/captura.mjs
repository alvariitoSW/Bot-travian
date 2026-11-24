/* Capturas del banco de campos AG1-B a 390×844 (dpr 1). Uso: node gobierno/maquetas/ciudad-agro/captura.mjs [prefijo=AG1-banco] [vistas=primavera;primavera-mejoras;otono;otono-mejoras] (separadas por ;, o una cadena de parámetros de URL)
   Vistas extra: verano, invierno, aceituna, ... (se piden con vistas=). Deja gobierno/capturas-tarea/<prefijo>-<vista>.jpg y escribe triángulos y llamadas de dibujo. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const op = Object.fromEntries(process.argv.slice(2).map(a => [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)])), pref = op.prefijo || 'AG1-banco';
const VISTAS = { primavera: 'est=0&mejoras=0', 'primavera-mejoras': 'est=0&mejoras=1', verano: 'est=1&mejoras=0', 'verano-mejoras': 'est=1&mejoras=1', otono: 'est=2&mejoras=0', 'otono-mejoras': 'est=2&mejoras=1', invierno: 'est=3&mejoras=0', 'invierno-mejoras': 'est=3&mejoras=1' };
const lista = (op.vistas || 'primavera;primavera-mejoras;otono;otono-mejoras').split(';');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const srv = createServer(async (q, r) => { try { const p = decodeURIComponent(q.url.split('?')[0]); if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
for (const v of lista) {
  await page.goto('http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/ciudad-agro/index.html?' + (VISTAS[v] || v), { waitUntil: 'load' });
  await page.waitForFunction('window.__banco && window.__banco.listo', null, { timeout: 120000 }).catch(() => {}); await page.waitForTimeout(600);
  const m = await page.evaluate(() => window.__banco ? window.__banco.triangulos + ' triángulos, ' + window.__banco.llamadas + ' llamadas, ' + window.__banco.parcelas.length + ' campos' : 'sin banco');
  await page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + v.replace(/[^a-z0-9-]+/gi, '_') + '.jpg'), type: 'jpeg', quality: 88 }); console.log(v + ': ' + m);
}
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'sin errores de consola'); await br.close(); srv.close();
