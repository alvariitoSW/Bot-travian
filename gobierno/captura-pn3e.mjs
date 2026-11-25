/* AQVILA — PN3e: capturas del hierro de la polis. Uso: node gobierno/captura-pn3e.mjs
   Deja en gobierno/capturas-tarea/ (390×844): PN3e-a-ficha-calcis (Partida nueva: veta y bien especial), PN3e-b-leccion-hierro (Atenas, la
   primera lección) y PN3e-c-mina-calcis (Calcis puede levantar sus Minas de Eubea). Cuenta los errores de consola (deben ser 0). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = process.env.AQ_RAIZ || join(dirname(fileURLToPath(import.meta.url)), '..'), SAL = join(dirname(fileURLToPath(import.meta.url)), 'capturas-tarea'), SOLO = process.env.AQ_SOLO_ROMA, B2 = process.env.AQ_B2 || process.env.AQ_B3, B3 = process.env.AQ_B3;
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SAL, { recursive: true });
const errores = [];
async function sesion(ancho, alto, f) {
  if ((SOLO && !f.roma) || (B2 && !f.b2)) return;
  const ctx = await br.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, serviceWorkers: 'block' }), page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
  page.on('dialog', d => d.accept());
  await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await page.waitForSelector('#menu .pn-carta [data-pn="nueva"]', { timeout: 30000 }); await page.waitForTimeout(1500);
  await f(page); await ctx.close();
}
const foto = (page, n) => page.screenshot({ path: join(SAL, n + '.jpg'), type: 'jpeg', quality: 80 });
const desborda = page => page.evaluate(() => { const m = document.getElementById('menu'); return { scrollW: m.scrollWidth, clientW: m.clientWidth, scrollH: m.scrollHeight, clientH: m.clientHeight }; });

const ciudad = page => page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = 'roma'; document.body.appendChild(b); b.click(); b.remove(); });
const accion = (page, a, v) => page.evaluate(([a, v]) => { const b = document.createElement('button'); b.dataset.act = a; if (v) b.dataset.v = v; document.body.appendChild(b); b.click(); b.remove(); }, [a, v]);
const cierra = page => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; const h = document.getElementById('popsheet'); if (h) h.hidden = true; if (window.Game && Game.state) Game.state.speed = 0; });
async function empezar(page, polis, semilla) {
  await page.evaluate(s => { UI.semillaPolis = s; }, semilla);
  await page.click('#menu .pn-carta [data-pn="nueva"]'); await page.waitForTimeout(400);
  await page.click('#menu [data-pnpolis="' + polis + '"]'); await page.waitForTimeout(300);
  await page.click('#menu [data-act="newpolis"]'); await page.waitForTimeout(4000); await cierra(page);
  await ciudad(page); await page.waitForTimeout(10000); await cierra(page);
  const info = await page.evaluate(() => { const E = Game.ciudadE('roma'), k = Game.state.comarca; return { comarca: k && (k.nombre + ' · ' + k.terreno + ' · ' + k.agua + ' · semilla ' + k.semilla), casas: E.parcelas.filter(l => l.casa && !l.casa.ruina).length, pop: Game.state.cities.roma.pop, urbe: !!E.urbe, sitio: E.sitio, fecha: Game.dateStr(Game.state.t), foro: DATA.BUILD.foro.n }; });
  console.log(polis, JSON.stringify(info));
}

await sesion(390, 844, async page => {
  await page.click('#menu .pn-carta [data-pn="nueva"]'); await page.waitForTimeout(400);
  await page.click('#menu [data-pnpolis="calcis"]'); await page.waitForTimeout(800);
  await page.evaluate(() => { const d = [...document.querySelectorAll('#menu dt')].find(e => /Edificio propio/.test(e.textContent)); if (d) d.scrollIntoView({ block: 'start' }); });
  await page.waitForTimeout(500); await foto(page, 'PN3e-a-ficha-calcis');
  console.log('ficha', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('#menu dd')].map(e => e.textContent).filter(t => /hierro|Bien especial/.test(t)))));
});
await sesion(390, 844, async page => {
  await empezar(page, 'atenas', 1013); await page.waitForTimeout(1500);
  await foto(page, 'PN3e-b-leccion-hierro');
  console.log('linea', JSON.stringify(await page.evaluate(() => { const l = document.getElementById('linea'); return l && !l.hidden ? l.innerText : null; })));
});
await sesion(390, 844, async page => {
  await empezar(page, 'calcis', 4242);
  console.log('mina calcis', JSON.stringify(await page.evaluate(() => ({ veta: Game.vetaHierro('roma'), motivo: Game.minaMotivo('roma'), hierro: Game.prod().hierro }))));
  await page.evaluate(() => { UI.bsel = { k: 'mina' }; }); await accion(page, 'cvistas'); await page.waitForTimeout(300); await accion(page, 'cvistas'); await page.waitForTimeout(1200);
  await foto(page, 'PN3e-c-mina-calcis');
});
console.log('errores de consola:', errores.length); for (const e of errores) console.log('  ', e);
await br.close(); srv.close();
