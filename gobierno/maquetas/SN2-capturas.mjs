// SN2 Pantalla del Senado: capturas a 390x844 en gobierno/capturas-tarea/SN2-*.jpg
// Uso: node gobierno/maquetas/SN2-capturas.mjs  (necesita playwright)
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const srv = createServer(async (rq, rs) => { try { const p = normalize(decodeURIComponent(rq.url.split('?')[0])); const f = join(RAIZ, p.endsWith('/') ? p + 'index.html' : p); rs.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'application/octet-stream' }); rs.end(await readFile(f)); } catch { rs.writeHead(404); rs.end(); } }).listen(0);
const port = srv.address().port;
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => m.type() === 'error' && errs.push(m.text()));
await page.goto('http://localhost:' + port + '/index.html'); await page.waitForTimeout(1500);
await page.evaluate(() => { document.querySelector('[data-act="new"]').click(); });
await page.waitForTimeout(500);
await page.evaluate(() => { document.querySelector('#tabs3 [data-act="tab3"][data-v="ciudad"]').click(); });
await page.waitForTimeout(8000);
for (let i = 0; i < 4; i++) { await page.evaluate(() => { const b = document.querySelector('#modal [data-act="close"]'); if (b) b.click(); }); await page.waitForTimeout(400); }
const sacar = async n => { await page.waitForTimeout(800); await page.screenshot({ path: join(SALIDA, n + '.jpg'), type: 'jpeg', quality: 82 }); console.log('captura', n); };
const ev = f => page.evaluate(f);
// abre una votación de guerra con la sala dividida
await ev(() => { const G = Game, s = G.state; s.speed = 0; G.senadoEstacion(); const q = s.senado; q.votacion = { id: 'guerra-cartago', turno: G.turnoN(s.t), cambiada: false }; q.humor.ter = 55; q.humor.mer = 50; q.humor.mil = 75; UI.tab = 'senado'; UI.dirty = true; document.querySelector('[data-act="tab3"][data-v="imperio"]').click(); });
await page.waitForTimeout(500);
await ev(() => document.querySelector('#view [data-act="tab"][data-v="senado"]').click());
await sacar('SN2-1-sala');
console.log('desborda:', await ev(() => { const p = document.querySelector('.sn2'); return p ? p.scrollHeight - p.clientHeight : 'sin .sn2'; }));
await ev(() => { const b = document.querySelector('.sn2-trato[data-b="ter"]'); if (b) b.click(); });
await sacar('SN2-2-trato');
await ev(() => { const b = document.querySelector('[data-act="sn2-cambiar"]'); if (b) b.click(); });
await sacar('SN2-3-cambiar');
await ev(() => { const b = document.querySelector('[data-act="close"]'); if (b) b.click(); });
await page.waitForTimeout(300);
await ev(() => { const b = document.querySelector('[data-act="sn2-votar"]'); if (b) b.click(); });
await sacar('SN2-4-resultado');
// veto: pueblo bajo y ley que castiga a la plebe
await ev(() => { const G = Game, s = G.state, q = s.senado; q.votacion = { id: 'leva-volones', turno: G.turnoN(s.t), cambiada: false }; s.favor.pueblo = 20; document.querySelector('[data-act="tab3"][data-v="imperio"]').click(); });
await page.waitForTimeout(400);
await ev(() => document.querySelector('#view [data-act="tab"][data-v="senado"]').click());
await sacar('SN2-5-veto');
// pasar turno: el consejo de estación avisa y su botón lleva al Senado
await ev(() => { const G = Game, s = G.state; s.favor.pueblo = 60; G.dejarPasar(); document.querySelector('[data-act="tab3"][data-v="ciudad"]').click(); });
await page.waitForTimeout(600);
await ev(() => document.getElementById('turno').click());
await page.waitForTimeout(3000);
await sacar('SN2-6-consejo');
console.log('botón Ir al Senado:', await ev(() => !!document.getElementById('inf-senado')));
await ev(() => { const b = document.getElementById('inf-senado'); if (b) b.click(); });
await sacar('SN2-7-desde-consejo');
console.log('desborda larga:', await ev(() => { const p = document.querySelector('.sn2'); return p ? p.scrollHeight - p.clientHeight : 'sin .sn2'; }));
console.log('scrollX:', await ev(() => document.documentElement.scrollWidth > innerWidth));
console.log('errores de consola:', errs.length ? errs : 'ninguno');
await br.close(); srv.close();
