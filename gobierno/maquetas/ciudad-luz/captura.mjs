/* CR4: capturas de la maqueta de luz a 390×844 y medida del tiempo por cuadro (luz de hoy frente a luz nueva).
   Uso: node gobierno/maquetas/ciudad-luz/captura.mjs [estacion=1] [dpr=1] [vistas=hoy,amanecer,mediodia,atardecer,amanecer@este] [prefijo=CR4] [vista=oeste|este|cerca|arriba] [turno=0]
   Cada vista es una hora (o «hoy») y, tras @, la cámara.
   Deja gobierno/capturas-tarea/<prefijo>-<vista>.jpg. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const op = Object.fromEntries(process.argv.slice(2).map(a => [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)]));
const est = +(op.estacion ?? 1), dpr = +(op.dpr || 1), pref = op.prefijo || 'CR4', vistas = (op.vistas || 'hoy,amanecer,mediodia,atardecer').split(',');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [];
const mira = p => { p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); }); p.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500))); };
mira(page);
await page.goto('http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/ciudad-luz/index.html' + (op.vista ? '?vista=' + op.vista : ''), { waitUntil: 'load' });
await page.waitForFunction(() => window.__luz && window.__luz.listo, null, { timeout: 180000 });
await page.evaluate(e => window.__luz.estacion(e), est); await page.waitForTimeout(8000);      // que carguen modelos y texturas
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
const medir = async (seg) => page.evaluate(async s => { const m = window.__luz.med, n0 = m.lista.length; const l0 = m.n, ms0 = m.ms; await new Promise(ok => setTimeout(ok, s * 1000)); return { cuadros: m.n - l0, ms: (m.ms - ms0) / Math.max(1, m.n - l0) }; }, seg);
const resultado = {};
for (const vv of vistas) {
  const [v, cam] = vv.split('@'); if (cam) { await page.evaluate(c => window.__luz.vista(c), cam); await page.waitForTimeout(1500); }
  if (v === 'hoy') await page.evaluate(() => { window.__luz.H.activa = false; });
  else await page.evaluate(h => { const H = window.__luz.H; H.activa = true; H.ya(h); }, v);
  await page.waitForTimeout(2500);
  resultado[vv] = await medir(6);
  await page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + vv.replace('@', '-') + '.jpg'), type: 'jpeg', quality: 85 });
  console.log(vv + ': ' + resultado[vv].ms.toFixed(1) + ' ms por cuadro (' + resultado[vv].cuadros + ' cuadros)');
}
if (op.turno !== '0') {      // el paso de turno entero, con fotos en medio para ver que no hay saltos ni noche
  await page.evaluate(() => { const H = window.__luz.H; H.activa = true; H.ya('mediodia'); }); await page.waitForTimeout(800);
  await page.tap('#panel [data-h="turno"]'); const t0 = Date.now(), m0 = await page.evaluate(() => ({ n: window.__luz.med.n, ms: window.__luz.med.ms }));
  for (const [ms, n] of [[1500, 'turno-1'], [4800, 'turno-2'], [12000, 'turno-3'], [24000, 'turno-4']]) { await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0))); await page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + n + '.jpg'), type: 'jpeg', quality: 80 }); }
  await page.waitForTimeout(Math.max(0, 36500 - (Date.now() - t0)));
  const m1 = await page.evaluate(() => ({ n: window.__luz.med.n, ms: window.__luz.med.ms, sigue: window.__luz.H.enMarcha(), hora: window.__luz.H.ultimaHora }));
  console.log('turno (con sombras rehechas en el paso): ' + ((m1.ms - m0.ms) / Math.max(1, m1.n - m0.n)).toFixed(1) + ' ms por cuadro; hora final ' + m1.hora + (m1.sigue ? ' (aún en marcha)' : ' (terminado)'));
}
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'sin errores de consola');
await br.close(); srv.close();
