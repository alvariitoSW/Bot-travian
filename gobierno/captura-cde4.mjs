/* CDe4: capturas del enganche final de ciudad a 390×844: tira de recursos con iconos y cifra de 5 cifras, Imperio con «Tus caminos», su hoja, «Este año», ROMA ▾ con Gobernador y «Clases». Uso: node gobierno/captura-cde4.mjs */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.webmanifest': 'application/json' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; UI.modalOpen = false; UI.modalQ.length = 0; });
await cierra(); await page.waitForTimeout(10000); await cierra();
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
await page.evaluate(() => { Game.state.speed = 0; const a = Game.state.ajustes; if (a) a.asesor = false; });
const foto = n => page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea/CDe4-' + n + '.jpg'), type: 'jpeg', quality: 80 });
const dato = {};
await page.waitForTimeout(800); await foto('01-ciudad-tira');
await page.evaluate(() => { Game.state.res.denarios = 12345; Game.state.res.grano = 1234567; Game.state.alm.denarios = 12345; Game.state.alm.grano = 1234567; });
await page.waitForTimeout(900);
dato.tira = await page.evaluate(() => { const r = document.getElementById('res'); const b = r.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), desborda: r.scrollWidth > r.clientWidth + 1, txt: r.innerText.replace(/\s+/g, ' '), iconos: r.querySelectorAll('img.ico').length, hijosFuera: [...r.querySelectorAll('.r')].filter(e => e.getBoundingClientRect().right > 391 || e.scrollWidth > e.clientWidth + 1).map(e => e.id) }; });
await foto('02-tira-5-cifras');
await page.click('#tabs3 [data-v="imperio"]'); await page.waitForTimeout(1500); await cierra();
dato.imperio = await page.evaluate(() => ({ tira: !!document.querySelector('.cam-tira'), hueco: !!document.querySelector('.imp-cam') }));
await foto('03-imperio');
if (dato.imperio.tira) { await cierra(); await page.click('.cam-tira'); await page.waitForTimeout(800); dato.hoja = await page.evaluate(() => !!document.querySelector('#mbox .cam-hoja')); await foto('04-caminos-hoja'); await page.click('#mbox [data-cam="cerrar"]'); await page.waitForTimeout(400); }
await page.click('[data-act="esteano"]'); await page.waitForTimeout(900);
dato.esteano = await page.evaluate(() => !!document.querySelector('#eahoja .ea-hoja'));
await foto('05-este-ano');
if (dato.esteano) { await page.click('#eahoja [data-act="eafila"]').catch(() => { }); await page.waitForTimeout(400); await foto('06-este-ano-fila'); await page.click('#eahoja [data-act="eacerrar"]'); await page.waitForTimeout(300); }
await page.click('#tabs3 [data-v="ciudad"]'); await page.waitForTimeout(1500); await cierra();
await page.click('#citybtn'); await page.waitForTimeout(1200);
dato.gob = await page.evaluate(() => !!document.querySelector('#hoja .gb-bloque'));
await page.evaluate(() => { const b = document.querySelector('#hoja .gb-bloque'); if (b) b.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(400);
await foto('07-roma-gobernador-apagado');
if (dato.gob) { await page.click('#hoja [data-gb="alternar"]'); await page.waitForTimeout(600); dato.gobOn = await page.evaluate(() => ({ aria: document.querySelector('#hoja [data-gb="alternar"]').getAttribute('aria-checked'), guardado: Game.state.gobernador && Game.state.gobernador.ciudades })); await foto('08-roma-gobernador-encendido'); await page.click('#hoja [data-gb="alternar"]'); await page.waitForTimeout(300); }
await page.click('#hoja [data-act="hojax"]').catch(() => { }); await page.waitForTimeout(300);
await page.click('#citybtn'); await page.waitForTimeout(800);
dato.pueblo = await page.evaluate(() => { const b = document.querySelector('[data-act="hoja"][data-v="pueblo"]'); if (b) b.click(); return !!b; });
await page.waitForTimeout(800);
dato.clasesBtn = await page.evaluate(() => !!document.querySelector('[data-act="clases"]'));
await foto('09-pueblo-clases-boton');
if (dato.clasesBtn) { await page.click('[data-act="clases"]'); await page.waitForTimeout(3500); dato.clasesAbre = await page.evaluate(() => !!document.getElementById('cl-fondo')); await foto('10-clases'); }
dato.errores = errores;
console.log(JSON.stringify(dato, null, 1));
await br.close(); srv.close();
