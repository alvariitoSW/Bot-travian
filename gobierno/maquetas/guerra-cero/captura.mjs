// Maqueta GC1 — juega una batalla en un móvil simulado (vertical 390×844 y horizontal 844×390) y deja las capturas.
// Uso:  node gobierno/maquetas/guerra-cero/captura.mjs                    -> capturas GC1-* (dpr 2) en gobierno/capturas-tarea/
//       node gobierno/maquetas/guerra-cero/captura.mjs dpr=1 prefijo=/ruta/p-   -> rápido, para iterar
//       node gobierno/maquetas/guerra-cero/captura.mjs --servir              -> solo sirve la página
// Los toques son de dedo de verdad sobre los botones; el tiempo se adelanta con el gancho window.__gc.salta.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8379 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/guerra-cero/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GC1-'), errores = [];
const espera = (p, ms) => p.waitForTimeout(ms);
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };

async function partida(nombre, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  const g = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]);
  const foto = async n => { await espera(page, 1500); for (let i = 0; ; i++) { try { await page.screenshot({ path: prefijo + nombre + '-' + n + '.jpg', type: 'jpeg', quality: 82, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } } const e = await g('estado'); console.log(`${nombre}-${n}: t=${e.t.toFixed(0)} s · ${e.fase} · ${e.figs} figuras · ${e.tri} triángulos · ${e.llamadas} llamadas`); };
  const pulsa = async sel => { await page.tap(sel); await espera(page, 250); };
  const t0 = Date.now();
  await page.goto(URL0 + '?semilla=4242'); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 300000 });
  console.log(nombre + ': cargada en ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  /* 1 · lo primero que se ve: sin tocar nada, ya hay cuatro órdenes y «Retirarse» */
  await g('pausa', true); await g('salta', 3); await foto('1-llegada');
  bien(await page.isVisible('#retirar'), '«Retirarse» está a la vista desde el primer segundo');
  bien(await page.locator('.orden').count() === 4 && await page.locator('.cuerpo').count() === 3, 'tres cuerpos y cuatro órdenes en pantalla');
  const cabe = await page.evaluate(() => [...document.querySelectorAll('.orden,.cuerpo,#retirar')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && r.height >= 40; }));
  bien(cabe, 'todos los botones caben enteros y miden al menos 40 px de alto');
  /* 2 · el choque: los galos cargan por la izquierda; el jugador aguanta ahí y empuja en el centro (toques de dedo) */
  await g('salta', 6); await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="empujar"]');
  bien((await g('estado')).sel === 1 && await page.evaluate(() => window.__gc.B.sect[1].c[0].postura) === 'empujar', 'el primer toque en «Empujar» hace empujar al centro');
  await g('salta', 5); await g('mirar', -1, 0); await foto('2-choque');
  /* 3 · la cámara baja sola al relevo */
  await g('salta', 22); await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="relevo"]'); await g('salta', 1.6); await g('mirar', 1, 30); await foto('3-relevo');
  bien(await page.evaluate(() => window.__gc.B.sect[1].c[0].lineas[0].tipo) === 'principes', 'el relevo mete a los príncipes en primera línea');
  /* 4 · caballería al flanco */
  await g('mirar', -1, 0); await pulsa('.cuerpo[data-i="0"]'); await pulsa('.orden[data-o="empujar"]'); await pulsa('.orden[data-o="caballeria"]'); await g('salta', 4.2); await g('mirar', 0, 30); await foto('4-caballeria');
  await g('mirar', -1, 0);
  /* 5 · se juega con cabeza hasta el final (mismo criterio que el bot «con cabeza» de prueba.mjs) */
  await page.evaluate(() => { const G = window.__gc, R = G.R, B = G.B; let n = 0;
    while (B.fase !== 'fin' && n++ < 400) {
      for (let i = 0; i < 3; i++) { const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto) continue; const fe = R.frente(e).fatiga, l = R.frente(c), sig = c.lineas[1];
        R.ordenar(B, i, (e.postura === 'aguantar' && l.fatiga < 0.75) || fe > 0.6 || e.flanqueado || e.golpe > 0 ? 'empujar' : 'aguantar');
        if (sig && sig.fatiga < 0.4 && (l.fatiga > 0.7 || l.hombres < 0.45 * l.max)) R.ordenar(B, i, 'relevo'); }
      if (B.cab.estado === 'lista' && (B.num.estado === 'hostiga' || B.num.estado === 'llega')) R.ordenar(B, B.num.sect, 'caballeria');
      for (let k = 0; k < 6 && !B.sect.some(s => s.c[1].roto); k++) G.salta(0.25);
      if (B.sect.some(s => s.c[1].roto)) break; } });
  await g('salta', 0.7); await g('mirar', await page.evaluate(() => window.__gc.B.sect.findIndex(s => s.c[1].roto)), 30); await foto('5-ruptura'); await g('mirar', -1, 0);
  await page.evaluate(() => { const G = window.__gc, R = G.R, B = G.B; let n = 0; while (B.fase !== 'fin' && n++ < 400) { for (let i = 0; i < 3; i++) { const s = B.sect[i]; if (!s.c[0].roto && !s.c[1].roto) R.ordenar(B, i, 'empujar'); } G.salta(1.5); } });
  await g('pausa', false); await espera(page, 4000); await foto('6-final');
  const r = (await g('estado')).res; console.log('  resultado: ' + JSON.stringify(r));
  bien(r && r.t >= 60 && r.t <= 180, 'la batalla dura entre uno y tres minutos (' + Math.round(r.t) + ' s)');
  bien(await page.isVisible('#fin') && await page.isVisible('#otra'), 'al acabar sale el resultado con «Otra batalla»');
  /* 7 · salir en cualquier momento: otra batalla, «Retirarse», confirmar */
  await pulsa('#otra'); await espera(page, 1200); await pulsa('#retirar'); await foto('7-retirarse');
  bien(await page.isVisible('#salir-si') && await page.isVisible('#salir-no'), '«Retirarse» pregunta una vez y deja seguir luchando');
  await pulsa('#salir-si'); await espera(page, 800);
  bien((await g('estado')).res.como === 'retirada' && await page.isVisible('#otra'), 'dos toques bastan para salir de la batalla');
  await ctx.close();
}
const cual = op.solo || 'ambas';
if (cual !== 'horizontal') await partida('vertical', 390, 844);
if (cual !== 'vertical') await partida('horizontal', 844, 390);
console.log(errores.length ? 'NO APTO · ' + errores.length + ' fallos:\n' + errores.join('\n') : 'APTO · sin errores de consola');
await br.close(); srv.close(); process.exit(errores.length ? 1 : 0);
