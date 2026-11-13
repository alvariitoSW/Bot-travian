// I8-b Partida corta: capturas a 390x844 en gobierno/capturas-tarea/I8-{1-menu,2-fundar,3-mapa-italia,4-final-victoria,4b-final-derrota}.jpg
// Uso: node gobierno/maquetas/I8-capturas.mjs  (necesita playwright)
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const srv = createServer(async (rq, rs) => { try { const p = normalize(decodeURIComponent(rq.url.split('?')[0])); const f = join(RAIZ, p.endsWith('/') ? p + 'index.html' : p); rs.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'application/octet-stream' }); rs.end(await readFile(f)); } catch { rs.writeHead(404); rs.end(); } }).listen(0);
await new Promise(r => srv.on('listening', r));
const port = srv.address().port;
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
const foto = async n => page.screenshot({ path: join(SALIDA, n + '.jpg'), type: 'jpeg', quality: 82 });
const cierra = async () => { for (let i = 0; i < 5; i++) { await page.evaluate(() => { const b = document.querySelector('#modal:not([hidden]) [data-act="close"]'); if (b) b.click(); }); await page.waitForTimeout(300); } };
await page.goto('http://localhost:' + port + '/index.html'); await page.waitForTimeout(2000);
await page.evaluate(() => { document.querySelector('#menu').scrollTop = 99999; });
await page.waitForTimeout(300);
await foto('I8-1-menu');
// 2: fundar de la nada (se espera a los modelos y a que la pantalla de fundar abra sola)
await page.evaluate(() => document.querySelector('[data-act="cortafun"]').click());
await page.waitForTimeout(1500); await cierra(); await page.waitForFunction(() => window.UI && UI.cityV && UI.cityV.listo, null, { timeout: 90000 }); await cierra();
await page.waitForFunction(() => window.UI && UI.fundar && UI.fundar.vale, null, { timeout: 30000 });
await page.waitForTimeout(2500);
await foto('I8-2-fundar');
await page.evaluate(() => document.getElementById('b-si').click());
await page.waitForFunction(() => !UI.fundar && Game.myCities().length === 1, null, { timeout: 30000 });
await page.waitForTimeout(1500); await cierra();
console.log('fundada:', await page.evaluate(() => ({ ciudades: Game.myCities(), city: UI.city, fase: Game.modoFase(), capital: Game.state.capital })));
// 3: mapa de Italia con la ciudad en pie (modo «Roma y Capua en pie»)
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2500);
await page.evaluate(() => document.querySelector('[data-act="cortaen"]').click()); await page.waitForTimeout(3000); await cierra();
await page.evaluate(() => { Game.state.speed = 0; UI.dirty = true; document.querySelector('[data-act="menumodo"]').click(); document.querySelector('[data-act="menumodo"]').click(); document.querySelector('[data-act="modo"][data-v="guerra"]').click(); });
await page.waitForTimeout(3000);
console.log('mapa:', await page.evaluate(() => UI.map ? Object.keys(UI.map.cities).filter(i => UI.map.cities[i].grp.visible && Game.state.cities[i]).length : -1));
await foto('I8-3-mapa-italia');
// 4: finales (se fuerzan sobre la partida en curso)
const fin = (win, why) => page.evaluate(([w, y]) => { const s = Game.state; s.over = { win: w, why: y, resumen: Game.resumen() }; Object.assign(s.stats, { battles: 7, wins: w ? 6 : 3, kills: 1840, lost: 910 }); s.over.resumen = Game.resumen(); s.t = 52 * 3; s.over.resumen = Game.resumen(); UI.overShown = false; closeModalSeguro(); Game.onEvent('over'); }, [win, why]);
await page.evaluate(() => { window.closeModalSeguro = () => { UI.modalQ = []; UI.modalOpen = false; document.getElementById('modal').hidden = true; }; });
await fin(true, 'Tarento ha caído en 262 a.C. Toda la Italia peninsular reconoce tu poder: el Sur ya no tiene rey.'); await page.waitForTimeout(800); await foto('I8-4-final-victoria');
await fin(false, 'Tu capital ha caído en 265 a.C. ante Epiro. Vae victis.'); await page.waitForTimeout(800); await foto('I8-4b-final-derrota');
console.log('errores de consola:', errs.length ? errs : 'ninguno');
await br.close(); srv.close();
