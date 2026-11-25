#!/usr/bin/env node
/* AQVILA · AM2 — hornea el suelo del mapa vivo de Grecia: abre tools/mapa-grecia/hornear.html en un navegador sin pantalla,
   pinta los dos estilos y las máscaras (pintura.js) y los guarda en assets/mapa-grecia/ (suelo-a.webp, suelo-b.webp, mascaras.webp).
   Uso: node tools/mapa-grecia/hornear.mjs      (tarda ~1 min; hay que repetirlo si cambia alturas.png, pintura.js o las comarcas de datos) */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
const srv = createServer(async (q, r) => { try { const p = decodeURIComponent(q.url.split('?')[0]); if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch(), page = await br.newPage();
page.on('pageerror', e => { console.error('ERROR', e.message); process.exitCode = 1; });
await page.goto('http://127.0.0.1:' + srv.address().port + '/tools/mapa-grecia/hornear.html'); await page.waitForFunction(() => window.__listo);
const t0 = Date.now(), sal = await page.evaluate(() => window.__hornear());
for (const [n, b64] of Object.entries(sal)) { const b = Buffer.from(b64, 'base64'); await writeFile(join(RAIZ, 'assets/mapa-grecia', n), b); console.log(n, (b.length / 1024).toFixed(0) + ' KB'); }
console.log('hecho en', ((Date.now() - t0) / 1000).toFixed(0), 's'); await br.close(); srv.close();
