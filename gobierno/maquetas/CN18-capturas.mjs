/* CN18: capturas a 390×844 de Postal y copias, crónica, contemplar, punto de parada y nota final. Uso: node gobierno/maquetas/CN18-capturas.mjs */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), SAL = join(RAIZ, 'gobierno/capturas-tarea');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok)); await mkdir(SAL, { recursive: true });
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, serviceWorkers: 'block', acceptDownloads: true }), page = await ctx.newPage();
const errores = []; page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); }); page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 400)));
const foto = n => page.screenshot({ path: join(SAL, 'CN18-' + n + '.jpg'), type: 'jpeg', quality: 70 });
const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; UI.modalOpen = false; });
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 }); await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500); await cierra();
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = 'roma'; UI.city = 'roma'; document.body.appendChild(b); b.click(); b.remove(); Game.state.speed = 0; Game.state.ajustes.asesor = false; });
await page.waitForTimeout(12000); await cierra();
const res = {};
// postal: pulsa el botón del menú y recoge la descarga
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'hoja'; b.dataset.v = 'movil'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(600); await foto('hoja-movil');
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('#hoja [data-act="postal"]')]); const ruta = join(SAL, 'CN18-postal.png'); await dl.saveAs(ruta); res.postal = dl.suggestedFilename();
// crónica
await page.click('#hoja [data-act="hoja"][data-v="cronicac"]'); await page.waitForTimeout(500); await foto('cronica');
const [dt] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#hoja [data-act="crondescargar"]')]); res.txt = dt.suggestedFilename();
// copia en archivo y vuelta
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'hoja'; b.dataset.v = 'movil'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(400);
const [dc] = await Promise.all([page.waitForEvent('download', { timeout: 10000 }), page.click('#hoja [data-act="copiaguardar"]')]); const rj = join(SAL, 'CN18-copia.json'); await dc.saveAs(rj); res.copia = dc.suggestedFilename();
await page.evaluate(() => { Game.state.res.oro = 4321; }); page.once('dialog', d => d.accept());
const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 10000 }), page.click('#hoja [data-act="copiacargar"]')]); await fc.setFiles(rj); await page.waitForTimeout(2500); await cierra();
res.oroTrasCargar = await page.evaluate(() => Game.state.res.oro);
// contemplar
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'hoja'; b.dataset.v = 'movil'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(400);
await page.click('#hoja [data-act="contemplar"]'); await page.waitForTimeout(1500); await foto('contemplar-1'); await page.waitForTimeout(4000); await foto('contemplar-2');
res.az = await page.evaluate(() => UI.cityV.c.yaw); res.velo = await page.evaluate(() => !!document.getElementById('contempla'));
await page.mouse.click(200, 400); await page.waitForTimeout(500); res.velo2 = await page.evaluate(() => !!document.getElementById('contempla')); await foto('tras-contemplar');
// punto de parada: guardar, volver al menú y continuar
await page.evaluate(() => { Game.save(); UI.overShown = false; }); const sv = await page.evaluate(() => JSON.stringify(Game.state.parada)); res.parada = sv;
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'tomenu'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(800);
await page.click('#menu [data-act="continue"]'); await page.waitForTimeout(1500); await foto('parada');
// nota final: partida corta forzada a terminar
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'close'; document.body.appendChild(b); b.click(); b.remove(); Game.ponerAjustes({ dif: 'dura', suc: { fuego: false } }); const s = Game.state; s.modo = { id: 'corta', inicio: 'enPie', fase: 'jugando' }; s.capital = 'roma'; s.over = { win: true, why: 'Tarento ha caído.', resumen: Object.assign(Game.resumen(), { nota: Game.nota(true) }) }; UI.overShown = false; });
await page.evaluate(() => { const m = document.getElementById('modal'); m.hidden = true; UI.modalOpen = false; UI.modalQ = []; Game.onEvent('over'); }); const hay = await page.evaluate(() => !!document.querySelector('#mbox .nota')); const res2 = { notaVisible: hay }; Object.assign(res, res2);
await page.waitForTimeout(800); await foto('nota');
console.log(JSON.stringify(res)); console.log('errores:', errores.length ? errores.join('\n') : 'ninguno');
await br.close(); srv.close();
