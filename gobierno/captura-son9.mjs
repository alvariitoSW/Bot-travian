/* AQVILA — SON9: capturas de la arenga y de las preguntas de los oficiales (campaña y Escaramuzas) en el navegador.
   Uso: node gobierno/captura-son9.mjs [dpr=2]  → gobierno/capturas-tarea/SON9-*.jpg. Sale con código 1 si hay errores de consola o falla una comprobación.
   Abre las batallas con ?arenga=1 (en pruebas automáticas, navigator.webdriver, la arenga y las preguntas están apagadas salvo con ese parámetro). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const dpr = +(op.dpr || 2);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end('no'); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const fallos = [], bien = (ok, t) => { console.log((ok ? '  bien: ' : '  MAL: ') + t); if (!ok) fallos.push(t); };
const ROMA = { hastati: 360, principes: 360, triarii: 180, equites: 60 }, ENEM = { galos: 690, libios: 780, iberos: 690, numidas: 60, elefantes: 6 };

async function sesion(w, h, quien) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage(), esp = ms => page.waitForTimeout(ms);
  page.on('console', m => { if (m.type() === 'error' && !/GPU stall|GL Driver/.test(m.text())) { fallos.push('consola: ' + m.text().slice(0, 250)); console.log('  [error] ' + m.text().slice(0, 250)); } });
  page.on('pageerror', e => { fallos.push('excepción: ' + String(e.message).slice(0, 250)); console.log('  [excepción] ' + e.message.slice(0, 250)); });
  await page.goto('http://127.0.0.1:' + srv.address().port + '/?arenga=1'); await esp(1500);
  const foto = async n => { await esp(600); await page.screenshot({ path: join(SALIDA, 'SON9-' + n + '.jpg'), type: 'jpeg', quality: 84, timeout: 180000 }); console.log('  captura SON9-' + n); };
  if (quien === 'guerra') {
    await page.evaluate(([R, E]) => { window.UIGuerra.abrir({ estado: window.Guerra.crear({ semilla: 6, ejercitos: [R, E] }), campo: 'llano' }, () => {}); }, [ROMA, ENEM]);
    await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 150000 }); await esp(1200);
  } else {
    await page.evaluate(([R, E]) => { window.UIMando.abrir({ semilla: 3, ejercitos: [R, E], campo: 'llano' }, () => {}); }, [{ hastati: 600, principes: 600, triarii: 300, equites: 120 }, { galos: 1500, jinetes: 120, elefantes: 10 }]);
    await page.waitForFunction('window.__mn && window.__mn.lista === true', null, { timeout: 150000 }); await esp(1200);
  }
  return { page, esp, foto };
}
/* el botón desaparece al pulsarlo y Playwright a veces no recibe el acuse del toque: se comprueba el efecto, no el acuse */
const toca = async (page, sel) => { try { await page.tap(sel, { timeout: 60000 }); } catch (e) { /* se mira el efecto después */ } };
const preg = page => page.evaluate(() => window.__gc.preg && { tipo: window.__gc.preg.tipo, n: window.__gc.preg.opciones.length });

for (const [w, h, n] of op.solo === 'mando' ? [] : [[844, 390, 'h'], [390, 844, 'v']]) {
  console.log('Arenga ' + n);
  const { page, esp, foto } = await sesion(w, h, 'guerra');
  bien(await page.locator('.dlg.arenga button').count() === 4, 'el panel de la arenga tiene 3 discursos y «Sin arenga»');
  const cajas = await page.evaluate(() => [...document.querySelectorAll('.dlg.arenga button')].map(b => { const r = b.getBoundingClientRect(); return { h: r.height, ok: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }; }));
  bien(cajas.every(c => c.h >= 44 && c.ok), 'botones de al menos 44 px y dentro de la pantalla (' + cajas.map(c => Math.round(c.h)).join(', ') + ')');
  const alto = await page.evaluate(() => document.querySelector('.dlg.arenga').getBoundingClientRect().height / innerHeight); console.log('  el panel ocupa el ' + Math.round(100 * alto) + ' % del alto');
  bien(alto < (n === 'h' ? 0.62 : 0.5), 'el panel no tapa la vista entera');
  const t0 = await page.evaluate(() => window.__gc.B.t); await esp(800); bien(await page.evaluate(() => window.__gc.B.t) === t0, 'la batalla espera mientras eliges');
  await foto('arenga-' + n);
  if (n === 'h') {
    await toca(page, '.dlg.arenga button[data-a="auspicios"]'); await esp(500);
    const sub = await page.evaluate(() => document.querySelector('.dlg-sub').textContent); bien(/Di nobiscum sunt/.test(sub) && /auspicios son favorables/.test(sub), 'el general dice la arenga con subtítulo en latín y castellano: «' + sub + '»');
    await foto('arenga-dicha-h'); await esp(7000);
    const e = await page.evaluate(() => ({ ar: window.__gc.B.arenga, m: window.__gc.B.sect[1].c[0].mod && window.__gc.B.sect[1].c[0].mod.moral })); bien(e.ar === 'auspicios' && e.m === 0.92, 'tras el clamor la arenga queda aplicada (' + JSON.stringify(e) + ')');
    await page.evaluate(() => { window.Dialogos.TIEMPO_MAX = 90; });   // para fotografiar sin que el oficial se adelante (el móvil de pruebas pinta muy despacio)
    let q = null; for (let i = 0; i < 16 && !q; i++) { await page.evaluate(() => window.__gc.salta(10)); await esp(1300); q = await preg(page); }
    bien(!!q, 'sale una pregunta del oficial: ' + JSON.stringify(q));
    if (q) {
      const t1 = await page.evaluate(() => window.__gc.B.t); await esp(1500); bien(await page.evaluate(() => window.__gc.B.t) === t1, 'la batalla se pausa mientras eliges');
      const cj = await page.evaluate(() => [...document.querySelectorAll('.dlg.pregunta button')].map(b => { const r = b.getBoundingClientRect(); return { h: r.height, ok: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; })); bien(cj.length >= 2 && cj.every(c => c.h >= 44 && c.ok), 'respuestas de al menos 44 px dentro de la pantalla (' + cj.map(c => Math.round(c.h)).join(', ') + ')');
      await foto('pregunta-h');
      const ant = await page.evaluate(() => window.__gc.B.ordenes);
      await toca(page, '.dlg.pregunta button[data-k="1"]'); await esp(600);
      bien(await page.evaluate(() => window.__gc.preg === null && !document.querySelector('.dlg.pregunta')), 'al contestar se cierra el panel y sigue la batalla');
      bien(await page.evaluate(a => window.__gc.B.ordenes > a, ant), 'la respuesta da una orden de verdad');
      await page.evaluate(() => { window.Dialogos.TIEMPO_MAX = 8; });
      let r = null; for (let i = 0; i < 16 && !r; i++) { await page.evaluate(() => window.__gc.salta(10)); await esp(1200); r = (await preg(page)); }
      if (r) {
        await esp(9500); bien(await page.evaluate(() => window.__gc.preg === null), 'si no contestas, a los 8 s el oficial hace lo prudente y la batalla sigue');
        bien(await page.evaluate(() => /mantiene la línea|Tenebo/.test(document.querySelector('#gu-cinta').textContent + document.querySelector('.dlg-sub').textContent)), 'y lo dice (cinta o subtítulo)');
      } else console.log('  (no hubo segunda pregunta en esa batalla)');
    }
  } else {
    await toca(page, '.dlg.arenga button.sin'); await esp(600);
    bien(await page.evaluate(() => !document.querySelector('.dlg') && window.__gc.B.arenga === 'ninguna'), '«Sin arenga» empieza ya');
    await foto('arenga-despues-v');
  }
  await page.context().close();
}
console.log('Escaramuzas');
{
  const { page, esp, foto } = await sesion(844, 390, 'mando');
  bien(await page.locator('.dlg.arenga button').count() === 4, 'Escaramuzas: panel de arenga');
  await foto('arenga-escaramuza');
  await page.evaluate(() => { window.Dialogos.TIEMPO_MAX = 90; });
  await toca(page, '.dlg.arenga button[data-a="hogares"]'); await page.waitForFunction("window.__mn.S.arenga === 'hogares'", null, { timeout: 90000 }).catch(() => {});
  bien(await page.evaluate(() => window.__mn.S.arenga === 'hogares'), 'Escaramuzas: la arenga queda aplicada');
  let q = false; for (let i = 0; i < 20 && !q; i++) { await page.evaluate(() => window.__mn.salta(10)); await esp(1800); q = await page.evaluate(() => !!document.querySelector('.dlg.pregunta')); }
  bien(q, 'Escaramuzas: sale una pregunta del oficial');
  if (q) {
    const t1 = await page.evaluate(() => window.__mn.S.t); await esp(1200); bien(await page.evaluate(() => window.__mn.S.t) === t1 && await page.evaluate(() => window.__mn.S.pausa), 'Escaramuzas: la batalla se pausa mientras eliges');
    const cj = await page.evaluate(() => [...document.querySelectorAll('.dlg.pregunta button')].map(b => { const r = b.getBoundingClientRect(); return { h: r.height, ok: r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; })); bien(cj.length >= 2 && cj.every(c => c.h >= 44 && c.ok), 'Escaramuzas: respuestas de al menos 44 px (' + cj.map(c => Math.round(c.h)).join(', ') + ')');
    await foto('pregunta-escaramuza');
    const ant = await page.evaluate(() => window.__mn.S.ordenes);
    await toca(page, '.dlg.pregunta button[data-k="0"]'); await esp(700);
    bien(await page.evaluate(() => !document.querySelector('.dlg.pregunta') && !window.__mn.S.pausa), 'Escaramuzas: al contestar sigue la batalla');
    bien(await page.evaluate(a => window.__mn.S.ordenes > a, ant), 'Escaramuzas: la respuesta da una orden de verdad');
  }
  await page.context().close();
}
await br.close(); srv.close();
console.log(fallos.length ? 'FALLÓ: ' + fallos.length + '\n' + fallos.join('\n') : 'APTO: capturas SON9');
process.exit(fallos.length ? 1 : 0);
