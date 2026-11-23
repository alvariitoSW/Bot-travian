/* CV1: capturas de la vista de plano de la ciudad (antes-cerca, plano, plano-vuelta) a 390×844. Uso: node gobierno/captura-plano.mjs [ciudad=roma] [dpr=2] */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [pref = 'ciudad', ...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => a.split('=')));
const vistas = (op.vistas || (pref === 'CN16b' ? 'c16b-puertas,c16b-foro' : pref === 'CN16a' ? 'c16-foro,c16-campo' : pref === 'CN16p' ? 'c16-campo2,c16-torres' : pref === 'CN13c' ? 'c13-cubos' : pref === 'CN13b' ? 'c13-dique,c13-tejas' : pref === 'CN13a' ? 'c13-foro,c13-ofrenda,c13-cuentas,c13-hambre' : pref === 'CN22' ? 'c22-avisos,c22-informe,c22-turno' : pref === 'CN14C' ? 'c14-asesor,c14-ajustes,c14-nueva' : pref === 'CN14B' ? 'c14-sin-crecida' : pref === 'CN14A' ? 'c14-cifra-a,c14-cifra-b' : pref === 'CN9a' ? 'c9-ciudad' : pref === 'CN8' ? 'c8-aviso,c8-crecida,c8-fuego,c8-ruina' : pref === 'CN7' ? 'c7-surco,c7-empalizada-obra,c7-empalizada,c7-piedra,c7-ruina' : 'bandeja,fantasma,rojo,ficha,obra')).split(','), ciudad = op.ciudad || 'roma', dpr = +(op.dpr || 2);
const LUZ_ESTACIONAL = true;          // Q11: false = sin mes= ni vistas de luz (la ciudad usa la luz de siempre)
const ponerFecha = (mes, frac) => page.evaluate(([m, f]) => { Game.state.speed = 0; Game.state.t = 24 + (m - 1) + f; }, [mes, frac]);     // inversa de G.estacion: enero = invierno, 3 meses por turno
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
if (op.semilla) await page.addInitScript(k => { let a = +k >>> 0 || 1; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, op.semilla);      // CI1: azar fijo para repetir el mismo encuadre
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
await cierra();
await page.evaluate(c => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = c; UI.city = c; document.body.appendChild(b); b.click(); b.remove(); }, ciudad);
await page.waitForTimeout(12000); await cierra();
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
await page.evaluate(() => { Game.state.speed = 0; const a = Game.state.ajustes; if (a) a.asesor = false; });
const foto = n => page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea/CV1-' + n + '.jpg'), type: 'jpeg', quality: 80 });
const caja = () => page.evaluate(() => { const b = document.querySelector('#ctop .vo.plano'); const r = b.getBoundingClientRect(); return b.textContent + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height); });
const est = () => page.evaluate(() => { const c = window.UI.cityV; return JSON.stringify({ plano: c.enPlano, niebla: c.r ? undefined : 0 }); });
console.log('boton', await caja()); await foto('antes-cerca');
await page.tap('#ctop .vo.plano'); await page.waitForTimeout(2500);
console.log('boton', await caja()); await foto('plano');
await page.tap('#ctop .vo.plano'); await page.waitForTimeout(2500);
console.log('boton', await caja()); await foto('plano-vuelta');

/* CV1 vuelta: gestos reales en plano */
const ok = (n, v) => console.log((v ? 'OK   ' : 'FALLA') + ' ' + n);
const dato = () => page.evaluate(() => ({ plano: UI.cityV.enPlano, d: Math.round(UI.cityV.c.dist), txt: document.querySelector('#ctop .vo.plano').textContent, sel: !!UI.bsel, tab: UI.tab, foro: UI.cityV.aPantalla(Game.ciudadE(UI.city).foro.x, Game.ciudadE(UI.city).foro.z, 4) }));
await page.tap('#ctop .vo.plano'); await page.waitForTimeout(2500);
let a = await dato(); await page.mouse.move(200, 520); await page.mouse.down(); await page.mouse.move(260, 470, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(400);
let b = await dato(); ok('arrastrar con el ratón desplaza y sigue en plano (foro ' + Math.round(a.foro.x) + ',' + Math.round(a.foro.y) + ' -> ' + Math.round(b.foro.x) + ',' + Math.round(b.foro.y) + ')', b.plano && (Math.abs(a.foro.x - b.foro.x) + Math.abs(a.foro.y - b.foro.y)) > 20);
console.log('   bajo el ratón:', await page.evaluate(() => { const e = document.elementFromPoint(200, 520); return e.tagName + '#' + e.id + '.' + e.className; })); await page.mouse.move(200, 520); for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, -150); await page.waitForTimeout(60); } await page.waitForTimeout(1800);
b = await dato(); ok('rueda hacia dentro sale solo del plano (d=' + b.d + ', botón «' + b.txt + '»)', !b.plano && b.txt === 'Plano' && b.d < 400);
await page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea/CV1-salida-rueda.jpg'), type: 'jpeg', quality: 80 });
await page.evaluate(() => UI.cityV.view('ciudad')); await page.waitForTimeout(800);
await page.tap('#ctop .vo.plano'); await page.waitForTimeout(2500); a = await dato(); await page.touchscreen.tap(a.foro.x, a.foro.y); await page.waitForTimeout(2500); b = await dato();
ok('tocar un edificio en plano abre su ficha (ficha ' + b.sel + ', plano ' + b.plano + ', d=' + b.d + ')', b.sel);
await page.evaluate(() => UI.cityV.view('ciudad'));
await page.evaluate(() => { const c = document.querySelector('#fichab [data-act="cclose"]'); if (c) c.click(); }); await page.waitForTimeout(500);
await page.tap('#ctop .vo.plano'); await page.waitForTimeout(2500); a = await dato(); ok('plano activo antes de salir', a.plano);
await page.tap('#miga-b'); await page.waitForTimeout(2500); a = await dato(); console.log('   tras «Salir al mapa»: pestaña ' + a.tab + ', plano ' + a.plano);
await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'barra'; b.dataset.v = 'ciudad'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(3000); a = await dato();
ok('al volver a la ciudad el plano está apagado (pestaña ' + a.tab + ', botón «' + a.txt + '»)', !a.plano && a.txt === 'Plano');
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'sin errores de consola');
await br.close(); srv.close();
