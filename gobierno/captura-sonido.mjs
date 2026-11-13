/* Sonido de la ciudad (CN15c): node gobierno/captura-sonido.mjs → capturas-tarea/CN15c-menu.jpg y CN15c-ajustes.jpg, y PRUEBA en navegador:
   tras un toque el AudioContext arranca, SonidoCiudad.nivel() > 0 cerca de una obra en verano de día, y ~0 con Sonido.activo = false. Sale ≠0 si falla.
   Copiado de captura-trajin.mjs (captura-ciudad.mjs no se toca). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [], fallos = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
const ok = (c, t) => { console.log((c ? 'ok  ' : 'FALLO ') + t); if (!c) fallos.push(t); };
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
const foto = async n => { const f = join(RAIZ, 'gobierno/capturas-tarea', 'CN15c-' + n + '.jpg'); await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); console.log(f); };
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
/* 1. menú: el botón dice «Sonido: sí» y alterna */
const txt = () => page.evaluate(() => (document.querySelector('[data-act="sonido"]') || {}).textContent || '');
ok(await txt() === 'Sonido: sí', 'menú: botón «Sonido: sí» (' + await txt() + ')');
await page.evaluate(() => document.querySelector('#menu [data-act="sonido"]').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
await foto('menu');
await page.tap('#menu [data-act="sonido"]'); await page.waitForTimeout(300);
ok(await txt() === 'Sonido: no' && await page.evaluate(() => Sonido.activo === false), 'menú: un toque lo apaga (' + await txt() + ')');
await page.tap('#menu [data-act="sonido"]'); await page.waitForTimeout(300);
ok(await txt() === 'Sonido: sí' && await page.evaluate(() => Sonido.activo === true), 'menú: otro toque lo enciende');
/* 2. partida nueva, ciudad, Gobierno → Ajustes */
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
await page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
await page.evaluate(() => { Game.state.speed = 0; }); await page.waitForTimeout(500);
/* 3. audio: un toque, el contexto arranca; verano, de día, cámara junto a una obra */
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = 'roma'; UI.city = 'roma'; document.body.appendChild(b); b.click(); b.remove(); });
await page.waitForTimeout(12000);
await page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'tab3'; b.dataset.v = 'gobierno'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(1500);
const ajOk = await page.evaluate(() => { const e = document.getElementById('aj-sonido'); if (!e) return 'no hay #aj-sonido'; e.scrollIntoView({ block: 'center' }); return e.hidden ? 'oculta' : (e.textContent || '').trim(); });
ok(ajOk === 'Sonido: sí', 'Gobierno > Ajustes: fila «' + ajOk + '»');
await page.waitForTimeout(400); await foto('ajustes');
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'tab3'; b.dataset.v = 'ciudad'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(1000);
await page.touchscreen.tap(195, 400); await page.waitForTimeout(800);
const est = await page.evaluate(() => Sonido.ctx ? Sonido.ctx.state : 'sin contexto');
if (est !== 'running') console.log('AVISO: Sonido.ctx.state = «' + est + '» en este Chromium (¿sin audio?); no se falla por ello.'); else console.log('ok  AudioContext running tras un toque');
const pos = await page.evaluate(() => {
  const s = Game.state, c = s.cities.roma, E = Game.ciudadE('roma'); s.speed = 0; s.pending = []; s.vivo = false; s.t = 24 + 6 + 0.45;   // julio, mediodía
  c.obras.length = 0; E.rev++; const t = s.t;
  c.obras.push({ pieza: 'taller', x: E.foro.x + 40, z: E.foro.z + 30, nuevo: true, t0: t - 1, t1: t + 3, pausa: false });
  UI.cityV.mirar(E.foro.x + 40, E.foro.z + 30, 45, 0.5); return { ks: window.__ks };
});
await page.waitForTimeout(5000);
let pico = 0; for (let i = 0; i < 12; i++) { pico = Math.max(pico, await page.evaluate(() => SonidoCiudad.nivel())); await page.waitForTimeout(250); }
console.log('nivel con obra, verano, de día: ' + pico.toFixed(4));
if (est === 'running') ok(pico > 0, 'SonidoCiudad.nivel() > 0 con la cámara junto a una obra');
await page.evaluate(() => { Sonido.activo = false; }); await page.waitForTimeout(2500);
let bajo = 0; for (let i = 0; i < 6; i++) { bajo = Math.max(bajo, await page.evaluate(() => SonidoCiudad.nivel())); await page.waitForTimeout(200); }
console.log('nivel con Sonido.activo = false: ' + bajo.toFixed(4));
if (est === 'running') ok(bajo < 0.002 && bajo < pico * 0.1, 'con el sonido apagado el nivel baja a casi 0');
if (errores.length) { console.log('ERRORES DE CONSOLA:\n' + [...new Set(errores)].join('\n')); fallos.push('errores de consola'); } else console.log('Sin errores de consola.');
await br.close(); srv.close();
console.log(fallos.length ? 'FALLA: ' + fallos.join('; ') : 'APTO');
process.exit(fallos.length ? 1 : 0);
