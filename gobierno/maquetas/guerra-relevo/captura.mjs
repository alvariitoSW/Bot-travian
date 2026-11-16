// Maqueta GM6 — juega batallas en un móvil simulado (vertical 390×844 y horizontal 844×390) y deja las capturas del relevo.
// Uso:  node gobierno/maquetas/guerra-relevo/captura.mjs                    -> capturas GM6-* (dpr 2) en gobierno/capturas-tarea/
//       node gobierno/maquetas/guerra-relevo/captura.mjs dpr=1 prefijo=/ruta/p-   -> rápido, para iterar
//       node gobierno/maquetas/guerra-relevo/captura.mjs solo=vertical            -> una sola orientación
//       node gobierno/maquetas/guerra-relevo/captura.mjs --servir                 -> solo sirve la página
// Los toques son de dedo de verdad sobre los botones; el tiempo se adelanta con el gancho window.__paso(seg).
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8379 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/guerra-relevo/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GM6-'), errores = [];
const espera = (p, ms) => p.waitForTimeout(ms);
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };

async function partida(nombre, w, h, rival) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  const g = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]);
  const foto = async n => { await espera(page, 1200); for (let i = 0; ; i++) { try { await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 80, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } } const e = await g('estado'); console.log(`${nombre} ${n}: t=${e.t.toFixed(0)} s · ${e.fase} · ${e.figs} figuras · ánimo ${e.animo.toFixed(2)} · ${e.tri} triángulos`); };
  const pulsa = async sel => { await page.tap(sel); await espera(page, 250); };
  const t0 = Date.now();
  await page.goto(URL0 + '?semilla=4242&rival=' + rival); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 300000 });
  console.log(nombre + ' (' + rival + '): cargada en ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  await g('pausa', true);
  bien(await page.isVisible('#retirar') && await page.locator('.orden').count() === 4 && await page.locator('.cuerpo').count() === 3, '«Retirarse», tres cuerpos y cuatro órdenes en pantalla');
  bien(await page.isVisible('#animo'), 'la barra «Ánimo de la legión» está arriba');
  const cabe = await page.evaluate(() => [...document.querySelectorAll('.orden,.cuerpo,#retirar')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && r.height >= 40; }));
  bien(cabe, 'todos los botones caben enteros y miden al menos 40 px de alto');
  const solape = await page.evaluate(() => { const a = document.getElementById('animo').getBoundingClientRect(), b = document.getElementById('retirar').getBoundingClientRect(); return a.left >= b.right - 1 && a.right <= innerWidth; });
  bien(solape, 'la barra de ánimo no tapa «Retirarse»');
  /* lo que ve el jugador al llegar: las líneas empiezan separadas, vélites delante */
  await g('salta', 2); await foto(nombre === 'vertical' ? 'llegada-v' : 'llegada-h');
  const dist0 = await page.evaluate(() => window.__B.sect[1].dist);
  bien(dist0 > 60, 'las líneas empiezan separadas (' + Math.round(dist0) + ' m)');
  /* se juega hasta el choque con toques de verdad */
  await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="empujar"]');
  await page.evaluate(() => { const B = window.__B; for (let n = 0; n < 400 && B.sect[1].dist > 3.5; n++) window.__paso(0.5); });
  await g('salta', 6);
  if (nombre === 'horizontal') { await g('mirar', -1, 0); await g('salta', 3); await foto('ancha'); }

  /* RELEVO A TIEMPO: cuerpo del centro, fila cansada, la de atrás fresca, el rival sin cargar */
  const prepara = (i, cansada) => page.evaluate(([i, cansada]) => { const B = window.__B, c = B.sect[i].c[0], e = B.sect[i].c[1]; c.relevo = 0; c.postura = 'aguantar'; const l = c.lineas[0]; l.fatiga = cansada ? 0.78 : 0.05; l.hombres = cansada ? l.max * 0.5 : l.max; if (c.lineas[1]) c.lineas[1].fatiga = 0.05; e.postura = 'aguantar'; e.tPost = 12; return window.__gc.R.juicioRelevo(B, i); }, [i, cansada]);
  const nombres = (i) => page.evaluate(i => window.__B.sect[i].c[0].lineas.map(l => l.tipo).join('>'), i);
  let j = await prepara(1, true); bien(j === 'a-tiempo', 'juicioRelevo da «a-tiempo» con la fila cansada y la reserva fresca (' + j + ')');
  if (nombre === 'vertical') {
    const sub0 = await page.locator('.orden[data-o="relevo"] .sub').textContent(); await page.waitForFunction("/buen momento/.test(document.querySelector('.orden[data-o=relevo] .sub').textContent)", null, { timeout: 20000 }).catch(() => {});
    bien(/buen momento/.test(await page.locator('.orden[data-o="relevo"] .sub').textContent()), 'el botón Relevo dice «buen momento» (antes: ' + sub0 + ')');
    const antes = await nombres(1), animo0 = (await g('estado')).animo;
    await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="relevo"]');
    bien(await page.evaluate(() => !!document.querySelector('.rot.bien')), 'el acierto sale como rótulo dorado sobre el cuerpo');
    bien((await nombres(1)) !== antes, 'el relevo cambia la línea de delante (' + antes + ' → ' + await nombres(1) + ')');
    bien((await g('estado')).animo > animo0, 'mandar bien sube el ánimo de la legión');
    await g('mirar', 1, 14);
    await g('salta', 0.6); await foto('relevo-1');
    await g('salta', 1.4); await foto('relevo-2');
    await g('salta', 1.4); await foto('relevo-3');
    await g('salta', 1.8); await foto('relevo-4');
    await g('salta', 1.6); bien(!(await g('estado')).anim[1], 'el paso de líneas termina solo');
    /* otro acierto en el ala derecha: rótulo dorado y barra de ánimo, con la cámara general */
    await g('mirar', -1, 0); j = await prepara(2, true); await pulsa('.cuerpo[data-i="2"]'); await pulsa('.orden[data-o="relevo"]'); await g('mirar', -1, 0); await g('salta', 0.3);
    await foto('mando-bien');
    /* RELEVO A DESTIEMPO: el ala izquierda está entera y se relevó sin necesidad */
    await g('salta', 5); await g('mirar', -1, 0); j = await prepara(0, false); bien(j === 'sin-necesidad', 'juicioRelevo da «sin-necesidad» con la fila entera (' + j + ')');
    await pulsa('.cuerpo[data-i="0"]'); await page.waitForFunction("/enteros/.test(document.querySelector('.orden[data-o=relevo] .sub').textContent)", null, { timeout: 20000 }).catch(() => {}); bien(/aún están enteros/.test(await page.locator('.orden[data-o="relevo"] .sub').textContent()), 'el botón Relevo dice «aún están enteros»');
    await pulsa('.orden[data-o="relevo"]'); await g('mirar', 0, 14);
    bien(await page.evaluate(() => !!document.querySelector('.rot.mal')), 'el error sale como rótulo rojo sobre el cuerpo');
    await g('salta', 3.2); await foto('relevo-mal');
    await g('salta', 5);
    /* a mano hasta el final, con cabeza */
    await g('mirar', -1, 0);
    await page.evaluate(() => { const G = window.__gc, R = G.R, B = G.B; let n = 0;
      while (B.fase !== 'fin' && n++ < 500) {
        for (let i = 0; i < 3; i++) { const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto) continue; const fe = R.frente(e).fatiga, l = R.frente(c), sig = c.lineas[1];
          R.ordenar(B, i, (e.postura === 'aguantar' && l.fatiga < 0.75) || fe > 0.6 || e.flanqueado || e.golpe > 0 ? 'empujar' : 'aguantar');
          if (sig && sig.fatiga < 0.4 && (l.fatiga > 0.7 || l.hombres < 0.45 * l.max) && R.juicioRelevo(B, i) === 'a-tiempo') R.ordenar(B, i, 'relevo'); }
        if (B.cab.estado === 'lista' && (B.num.estado === 'hostiga' || B.num.estado === 'llega')) R.ordenar(B, B.num.sect, 'caballeria');
        G.salta(0.5); }
      if (B.fase !== 'fin') R.retirarse(B); });
    await g('pausa', false); await espera(page, 4500); await foto('final');
    const r = (await g('estado')).res; console.log('  resultado: ' + JSON.stringify(r));
    bien(await page.isVisible('#fin') && await page.isVisible('#otra'), 'al acabar sale el resultado con «Otra batalla»');
    const lin = await page.locator('.mando-l').textContent(); bien(/Mandaste bien \d+ veces? y mal \d+/.test(lin), 'la pantalla final dice: «' + lin + '»');
  } else {
    /* horizontal: un relevo a tiempo y otro a destiempo, mirando que todo cabe */
    await prepara(1, true); await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="relevo"]'); await g('mirar', 1, 14); await g('salta', 2.6); await foto('relevo-h');
    await g('salta', 6); await g('mirar', -1, 0); await prepara(0, false); await pulsa('.cuerpo[data-i="0"]'); await pulsa('.orden[data-o="relevo"]'); await g('salta', 2.5); await foto('relevo-mal-h');
    await g('salta', 8); await g('pausa', false); await espera(page, 1500);
    await pulsa('#retirar'); bien(await page.isVisible('#salir-si') && await page.isVisible('#salir-no'), '«Retirarse» pregunta una vez y deja seguir luchando');
    await pulsa('#salir-si'); await espera(page, 800);
    bien((await g('estado')).res.como === 'retirada' && await page.isVisible('#otra'), 'dos toques bastan para salir de la batalla');
  }
  await ctx.close();
}
const cual = op.solo || 'ambas';
if (cual !== 'horizontal') await partida('vertical', 390, 844, op.rivalv || 'cartago');
if (cual !== 'vertical') await partida('horizontal', 844, 390, op.rivalh || 'pirro');
console.log(errores.length ? 'NO APTO · ' + errores.length + ' fallos:\n' + errores.join('\n') : 'APTO · sin errores de consola');
await br.close(); srv.close(); process.exit(errores.length ? 1 : 0);
