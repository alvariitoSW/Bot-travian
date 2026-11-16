/* AQVILA — GC4: entra al juego real, provoca batallas y las juega con toques de dedo; deja capturas JPG en gobierno/capturas-tarea/GC4-*.jpg
   Uso: node gobierno/captura-guerra.mjs [dpr=2] [prefijo=/ruta/GC4-]
   Recorre: atacar Capua (marcha, choque, orden elegida, final en horizontal, resultado), una retirada en horizontal,
   y recargar la página a mitad de una batalla y retomarla. Sale con código 1 si hay errores de consola o falla una comprobación. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GC4-');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.woff2': 'font/woff2', '.webmanifest': 'application/json', '.svg': 'image/svg+xml' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
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

await page.goto('http://127.0.0.1:' + srv.address().port + '/'); await esp(1500);
await page.click('#menu [data-act="new"]'); await esp(10000);
await page.evaluate(() => { const b = document.querySelector('#modal .btn'); if (b) b.click(); }); await esp(800);

/* 1 · atacar: aviso, marcha y choque en vertical, una orden elegida con el dedo */
await provoca(); await foto('1-aviso');
await abreBatalla(); await gc('pausa', true);
bien(await page.isVisible('#gu-retirar') && await page.locator('#gu .orden').count() === 4 && await page.locator('#gu .cuerpo').count() === 3, '«Retirarse», tres cuerpos y cuatro órdenes a la vista');
await foto('2-marcha');
await gc('salta', 12); await gc('mirar', -1, 0); await foto('3-choque');
await pulsa('#gu .cuerpo[data-i="1"]'); await pulsa('#gu .orden[data-o="empujar"]');
bien(await page.evaluate(() => window.__gc.B.sect[1].c[0].postura) === 'empujar', 'el toque en «Empujar» hace empujar al centro'); await foto('4-orden');
const cabe = await page.evaluate(() => [...document.querySelectorAll('#gu .orden,#gu .cuerpo,#gu #gu-retirar')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && r.height >= 40; }));
bien(cabe, 'todos los botones caben enteros y miden al menos 40 px de alto (vertical)');
/* horizontal: la misma batalla, se juega con el bot hasta el final, con el reloj corriendo */
await page.setViewportSize({ width: 844, height: 390 }); await esp(800); await gc('pausa', false);
bien(await page.evaluate(() => [...document.querySelectorAll('#gu .orden,#gu .cuerpo,#gu #gu-retirar')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })), 'todo cabe en horizontal');
await foto('5-horizontal');
await page.evaluate(() => { const G = window.Game, g = window.__gc; let n = 0; while (g.B.fase !== 'fin' && n++ < 400) { G.botGuerra(g.B); g.salta(1.5); if (g.B.sect.some(s => s.c[1].roto)) break; } });
await gc('salta', 0.6); await foto('6-ruptura');
await page.evaluate(() => { const G = window.Game, g = window.__gc; let n = 0; while (g.B.fase !== 'fin' && n++ < 400) { G.botGuerra(g.B); g.salta(1.5); } });
await esp(2500); await foto('7-final-horizontal');
bien(await page.isVisible('#gu-fin') && await page.isVisible('#gu-seguir'), 'al acabar sale el cartel con el botón «Ver el resultado»');
bien(await page.evaluate(() => /CC BY-SA/.test(document.querySelector('#gu-fin').textContent)), 'el crédito de 0 A.D. (CC BY-SA 3.0) está en el cartel final');
await page.setViewportSize({ width: 390, height: 844 }); await esp(600);
const bat0 = await page.evaluate(() => Game.state.stats.battles);
await pulsa('#gu-seguir'); await esp(1500);
bien(await page.evaluate(() => !document.querySelector('#gu')), 'la pantalla de la batalla se cierra'); await foto('8-resultado');
bien(await page.evaluate(n => Game.state.stats.battles === n + 1, bat0), 'el resultado se aplica a la campaña (batallas +1)');
await page.click('#modal [data-act="bdone"]'); await esp(800);

/* 2 · retirada en horizontal */
await page.setViewportSize({ width: 844, height: 390 });
await provoca(); await abreBatalla(); await gc('salta', 14);
await pulsa('#gu-retirar'); await foto('9-retirada-pregunta');
bien(await page.isVisible('#gu-salir-si') && await page.isVisible('#gu-salir-no'), '«Retirarse» pregunta una vez y deja seguir luchando');
await pulsa('#gu-salir-no'); await esp(300); bien(!(await page.isVisible('#gu-salir')), '«Seguir luchando» cierra la pregunta');
await pulsa('#gu-retirar'); await pulsa('#gu-salir-si'); await esp(1000); await foto('10-retirada-cartel');
bien(await page.evaluate(() => window.__gc.B.resultado.como) === 'retirada', 'dos toques bastan para retirarse');
await pulsa('#gu-seguir'); await esp(1500); await page.setViewportSize({ width: 390, height: 844 }); await esp(500); await foto('11-retirada-resultado');
bien(await page.evaluate(() => /Derrota/.test(document.querySelector('#modal').textContent)), 'retirarse cuenta como derrota en la campaña');
await page.click('#modal [data-act="bdone"]'); await esp(800);

/* 3 · recargar a mitad: la batalla se retoma donde estaba */
await provoca(); await abreBatalla(); await gc('salta', 30); await pulsa('#gu .orden[data-o="aguantar"]'); await esp(4600);
const antes = await page.evaluate(() => ({ t: window.__gc.B.t, sem: window.__gc.B.sem }));
await page.evaluate(() => Game.save()); await foto('12-antes-de-recargar');
await page.reload({ waitUntil: 'load' }); await esp(2000);
await page.click('#menu [data-act="continue"]'); await esp(2500);
for (let i = 0; i < 6 && !(await page.locator('#modal:not([hidden]) [data-act="bcont"]').count()); i++) { await esp(1200); const b = page.locator('#modal:not([hidden]) .btn').first(); if (await b.count() && !(await page.locator('#modal:not([hidden]) [data-act="bview"]').count())) await b.click(); }
bien(await page.locator('#modal:not([hidden]) [data-act="bcont"]').count() === 1, 'tras recargar, el aviso ofrece «Seguir la batalla»'); await foto('13-recargado-aviso');
await page.click('#modal [data-act="bcont"]'); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 120000 }); await esp(1500);
const ahora = await page.evaluate(() => ({ t: window.__gc.B.t, fase: window.__gc.B.fase }));
bien(ahora.t >= antes.t - 0.5 && ahora.t <= antes.t + 8 && ahora.fase !== 'marcha', 'la batalla sigue donde estaba (t ' + Math.round(antes.t) + ' s antes, ' + Math.round(ahora.t) + ' s después)');
await gc('pausa', true); await foto('14-retomada');
await page.evaluate(() => { const G = window.Game, g = window.__gc; let n = 0; while (g.B.fase !== 'fin' && n++ < 400) { G.botGuerra(g.B); g.salta(1.5); } });
await gc('pausa', false); await esp(2500); await pulsa('#gu-seguir'); await esp(1500);
bien(await page.evaluate(() => !document.querySelector('#gu') && !localStorage.getItem('aqvila-guerra-v1')), 'al terminar se borra la batalla guardada');
await page.click('#modal [data-act="bdone"]'); await esp(500);

console.log(fallos.length ? 'NO APTO · ' + fallos.length + ' fallos:\n' + fallos.join('\n') : 'APTO · sin errores de consola y todo en orden');
await br.close(); srv.close(); process.exit(fallos.length ? 1 : 0);
