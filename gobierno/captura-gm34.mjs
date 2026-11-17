/* AQVILA — GM34 «Movimiento vivo»: batalla real de cerca, medidas de tri/llamadas y tiras de 5 fotogramas (marcha, reposo, lucha)
   en gobierno/capturas-tarea/GM34-*.jpg. Uso: node gobierno/captura-gm34.mjs [raiz=/otra/copia]
   Recorre: atacar Capua (marcha, choque, orden elegida, final en horizontal, resultado), una retirada en horizontal,
   y recargar la página a mitad de una batalla y retomarla. Sale con código 1 si hay errores de consola o falla una comprobación. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const dpr = 1, prefijo = op.prefijo || join(SALIDA, 'GM34-');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.woff2': 'font/woff2', '.webmanifest': 'application/json', '.svg': 'image/svg+xml' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(op.raiz || RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
const fallos = [], esp = ms => page.waitForTimeout(ms);
page.on('console', m => { if (m.type() === 'error' && !/GPU stall|GL Driver/.test(m.text())) { fallos.push('consola: ' + m.text().slice(0, 250)); console.log('  [error] ' + m.text().slice(0, 250)); } });
page.on('pageerror', e => { fallos.push('excepción: ' + String(e.message).slice(0, 250)); console.log('  [excepción] ' + e.message.slice(0, 250)); });
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) fallos.push('prueba: ' + texto); };
const foto = async n => { await esp(1200); for (let i = 0; ; i++) { try { await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 82, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } } console.log('  captura ' + n); };
const gc = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]);
const pulsa = async sel => { await page.tap(sel); await esp(250); };
const modal = () => page.evaluate(() => { const m = document.querySelector('#modal:not([hidden])'); return m ? m.textContent.slice(0, 80) : ''; });

/* provoca un ataque a Capua con un ejército que da una escaramuza (menos de 600 hombres: sin maniobra) y espera el aviso de batalla */
async function provoca() {
  await page.evaluate(() => { const G = window.Game, s = G.state; s.cities.capua.owner = 'campanos'; s.cities.capua.units = { hoplitas: 150, milicia: 100 }; s.cities.roma.units = { hastati: 200, principes: 100 }; s.marches = [];
    G.send('roma', 'capua', { hastati: 200, principes: 100 }, false); s.marches[0].t1 = s.t + 0.01; G.tick(G.turnos ? Math.max(0.02, G.finTurno() - s.t) : 0.05); });
  for (let i = 0; i < 10; i++) { await esp(1000); if (await page.locator('#modal:not([hidden]) [data-act="bview"], #modal:not([hidden]) [data-act="bcont"]').count()) break; const b = page.locator('#modal:not([hidden]) .btn').first(); if (await b.count()) await b.click(); }
  await page.waitForSelector('#modal:not([hidden]) [data-act="bview"], #modal:not([hidden]) [data-act="bcont"]', { timeout: 20000 });
}
async function abreBatalla() { await page.click('#modal [data-act="bview"]'); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 120000 }); await esp(1500); }

/* tira de 5 fotogramas seguidos (cada 0,15 s de juego) con la cámara fija y cerca, compuestos en un lienzo de la página */
async function tira(nombre, cam) {
  await gc('camara', cam); await gc('cuadro', 0); await esp(400);
  const url = await page.evaluate(() => {
    const g = window.__gc, cv = g.lienzo, w = 380, h = 330, out = document.createElement('canvas'); out.width = w * 5 + 16; out.height = h; const cx = out.getContext('2d'); cx.fillStyle = '#000'; cx.fillRect(0, 0, out.width, out.height);
    for (let k = 0; k < 5; k++) { if (k) { g.cuadro(0.05); g.cuadro(0.05); g.cuadro(0.05); } else g.cuadro(0); cx.drawImage(cv, (cv.width - w) / 2, (cv.height - h) / 2, w, h, k * (w + 4), 0, w, h); }
    return out.toDataURL('image/jpeg', 0.85);
  });
  await writeFile(prefijo + 'tira-' + nombre + '.jpg', Buffer.from(url.split(',')[1], 'base64')); console.log('  tira ' + nombre);
  await gc('camara', null);
}
const medir = async q => { await gc('mirar', -1, 0); await esp(2500); const e = await gc('estado'); console.log('  MEDIDA ' + q + ': t ' + e.t.toFixed(1) + ' tri ' + e.tri + ' llamadas ' + e.llamadas + ' figuras ' + e.figs); };
/* centro de las filas de un cuerpo (lado 0, sector s): filas [r0, r1) */
const centro = (s, cond) => page.evaluate(([s, cond]) => { const ok = new Function('f', 'return ' + cond), fs = window.__gc.figs.filter(f => f.est === 0 && f.lado === 0 && f.sect === s && ok(f)); const m = fs.reduce((a, f) => [a[0] + f.x / fs.length, a[1] + f.z / fs.length], [0, 0]); return m; }, [s, cond]);
/* ritmo del clip respecto a su velocidad natural, en los que andan: debe quedar entre ~0,6 y ~1,4 */
const ritmos = q => page.evaluate(q => { const g = window.__gc, r = { anda: [], corre: [], atras: 0 }; for (const f of g.figs) { if (f.est !== 0 || !f.marcha) continue; const P = g.paso(f.key); if (f.marcha === -1) r.atras++; else (f.marcha === 2 ? r.corre : r.anda).push(f.ve / (f.marcha === 2 ? P.vr : P.vw)); } const d = a => a.length ? a.length + ' (' + Math.min(...a).toFixed(2) + '–' + Math.max(...a).toFixed(2) + ')' : '0'; const h = g.paso('hastati'); return q + ': andan ' + d(r.anda) + ', corren ' + d(r.corre) + ', ceden ' + r.atras + ' · hastati zancada andar ' + h.zw.toFixed(2) + ' m, correr ' + h.zr.toFixed(2) + ' m, v ' + h.vw.toFixed(2) + '/' + h.vr.toFixed(2) + ' m/s'; }, q).then(t => console.log('  RITMO ' + t));

await page.goto('http://127.0.0.1:' + srv.address().port + '/'); await esp(1500);
await page.click('#menu [data-act="new"]'); await esp(10000);
await page.evaluate(() => { const b = document.querySelector('#modal .btn'); if (b) b.click(); }); await esp(800);
await provoca(); await abreBatalla(); await gc('pausa', true);
await medir('marcha');
const nuevo = await page.evaluate(() => !!window.__gc.cuadro);
if (nuevo) {
  await page.setViewportSize({ width: 844, height: 390 }); await esp(800);
  await gc('salta', 3); await ritmos('marcha'); let [x, z] = await centro(1, 'f.fila < 2');
  await tira('marcha', { x: x + 1.5, y: 0.7, z: z - 1, d: 8, p: 0.12, a: 1.25 });
  await page.setViewportSize({ width: 390, height: 844 }); await esp(800);
}
await gc('salta', nuevo ? 9 : 12); await medir('choque'); if (nuevo) await ritmos('marcha (t 13)');
/* hasta que el centro está en la lucha */
await page.evaluate(() => { const g = window.__gc; let n = 0; while (g.B.fase !== 'fin' && g.R.lejos(g.B.sect[1]) && n++ < 120) g.salta(0.5); g.salta(4); });
await medir('lucha'); if (nuevo) await ritmos('lucha');
await gc('mirar', 1, 60); await esp(2500); await foto('vertical');
if (nuevo) {
  await page.setViewportSize({ width: 844, height: 390 }); await esp(800);
  let [x, z] = await centro(1, 'f.ataca');
  await tira('lucha', { x: x + 1, y: 0.9, z: z - 0.5, d: 8, p: 0.2, a: 0.7 });
  [x, z] = await centro(1, '!f.ataca && f.marcha === 0');
  await tira('reposo', { x: x + 1, y: 0.8, z, d: 8, p: 0.2, a: 0.9 });
  await gc('mirar', 1, 60); await esp(2500); await foto('horizontal');
  await gc('pausa', false); await esp(4000); await gc('pausa', true);
  await page.evaluate(() => { const G = window.Game, g = window.__gc; let n = 0; while (g.B.fase !== 'fin' && n++ < 400) { G.botGuerra(g.B); g.salta(1.5); } });
  await gc('pausa', false); await esp(3000); bien(await page.isVisible('#gu-fin'), 'la batalla acaba y sale el cartel');
}
console.log(fallos.length ? 'NO APTO · ' + fallos.length + ' fallos:\n' + fallos.join('\n') : 'APTO · sin errores de consola');
await br.close(); srv.close(); process.exit(fallos.length ? 1 : 0);
