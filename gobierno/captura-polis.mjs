/* AQVILA — PN2: capturas de la elección de polis. Uso: node gobierno/captura-polis.mjs
   Deja en gobierno/capturas-tarea/: PN2-v-eleccion(.jpg, -2), PN2-v-ficha-atenas, PN2-v-ficha-esparta, PN2-v-partida-atenas, PN2-v-cuartel-atenas (390×844)
   y PN2-h-eleccion, PN2-h-ficha-atenas (844×390). Cuenta los errores de consola (deben ser 0). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SAL = join(RAIZ, 'gobierno/capturas-tarea');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SAL, { recursive: true });
const errores = [];
async function sesion(ancho, alto, f) {
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
await sesion(390, 844, async page => {
  await page.click('#menu .pn-carta [data-pn="nueva"]'); await page.waitForTimeout(400);
  await foto(page, 'PN2-v-eleccion'); console.log('rejilla', JSON.stringify(await desborda(page)));
  await page.evaluate(() => { document.getElementById('menu').scrollTop = 700; }); await page.waitForTimeout(200); await foto(page, 'PN2-v-eleccion-2');
  for (const id of ['atenas', 'esparta']) {
    await page.evaluate(() => { document.getElementById('menu').scrollTop = 0; });
    await page.click('#menu [data-pnpolis="' + id + '"]'); await page.waitForTimeout(400); await foto(page, 'PN2-v-ficha-' + id); console.log('ficha', id, JSON.stringify(await desborda(page)));
    if (id === 'atenas') { await page.evaluate(() => { document.getElementById('menu').scrollTop = 99999; }); await page.waitForTimeout(200); await foto(page, 'PN2-v-ficha-atenas-2'); }
    await page.click('#menu .pn-carta .pn-volver'); await page.waitForTimeout(300);
  }
  await page.click('#menu [data-pnpolis="atenas"]'); await page.waitForTimeout(300);
  await page.click('#menu [data-act="newpolis"]'); await page.waitForTimeout(9000);
  await page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; if (window.Game) Game.state.speed = 0; });
  await foto(page, 'PN2-v-partida-atenas');
  console.log('partida', JSON.stringify(await page.evaluate(() => ({ polis: Game.state.polis, ciudad: DATA.CITIES.roma.n, bando: DATA.FACTIONS.roma.n, h1: (document.querySelector('#top, header, #hud') || {}).textContent?.slice(0, 120) }))));
  await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'tab'; b.dataset.v = 'army'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(1500);
  await page.evaluate(() => { const e = [...document.querySelectorAll('.sec')].find(x => x.textContent.trim() === 'Reclutar'); if (e) e.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(500);
  await foto(page, 'PN2-v-cuartel-atenas');
});
await sesion(844, 390, async page => {
  await page.click('#menu .pn-carta [data-pn="nueva"]'); await page.waitForTimeout(400); await foto(page, 'PN2-h-eleccion'); console.log('h rejilla', JSON.stringify(await desborda(page)));
  await page.click('#menu [data-pnpolis="atenas"]'); await page.waitForTimeout(400); await foto(page, 'PN2-h-ficha-atenas'); console.log('h ficha', JSON.stringify(await desborda(page)));
});
await br.close(); srv.close();
console.log(errores.length ? 'ERRORES DE CONSOLA (' + errores.length + '):\n' + errores.join('\n') : 'Errores de consola: 0');
