/* Prueba y capturas de la maqueta GM2. Uso: node gobierno/maquetas/guerra-cuerpo/captura.mjs */
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const chromium = createRequire(import.meta.url)('playwright').chromium;

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SALIDA = path.join(RAIZ, 'gobierno/capturas-tarea');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.css': 'text/css' };
const servidor = http.createServer((q, r) => {
  let p = path.join(RAIZ, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.startsWith(RAIZ) || !fs.existsSync(p)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
});
await new Promise(ok => servidor.listen(0, '127.0.0.1', ok));
const BASE = 'http://127.0.0.1:' + servidor.address().port + '/gobierno/maquetas/guerra-cuerpo/';
const navegador = await chromium.launch();
const fallos = [], errores = [], avisos = new Set();
const ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'ok   ' : 'FALLA') + ' ' + t); };

async function abrir(w, h, query, dsf = 1) {
  const ctx = await navegador.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: dsf });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push(String(e)));
  await page.goto(BASE + '?' + query); await page.waitForFunction(() => window.__B && window.__B.t > 0.2, null, { timeout: 15000 });
  return { ctx, page };
}
const esperar = (page, fn, ms = 90000, arg) => page.waitForFunction(fn, arg, { timeout: ms, polling: 40 });
const pausa = (page, v) => page.evaluate(v => { window.__ctl.pausa = v; }, v);
const ritmo = (page, v) => page.evaluate(v => { window.__ctl.rapido = v; }, v);
async function tocar(page, sel) { const b = await page.locator(sel).first().boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); }
async function foto(page, nombre) { await page.waitForTimeout(120); await page.screenshot({ path: path.join(SALIDA, nombre), type: 'jpeg', quality: 80 }); console.log('captura ' + nombre); }
async function avisosVistos(page) { const l = await page.evaluate(() => window.__B.eventos.filter(e => ['flanco', 'impacto', 'numidas-aviso', 'envuelve'].includes(e.tipo)).map(e => e.tipo)); l.forEach(x => avisos.add(x)); }
fs.mkdirSync(SALIDA, { recursive: true });

/* 1. Comprobaciones de lógica de pantalla a 390x844 con dpr 1 */
{
  const { ctx, page } = await abrir(390, 844, 'dpr=1&semilla=7&rapido=3');
  const cajas = await page.$$eval('.orden', bs => bs.map(b => { const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
  ok(cajas.length === 4 && cajas.every(c => c.x >= 0 && c.y >= 0 && c.x + c.w <= 390 && c.y + c.h <= 844 && c.h >= 40 && c.w >= 40), 'los cuatro botones enteros en pantalla y de 40 px o más (vertical)');
  await tocar(page, '.cuerpo[data-i="0"]'); ok(await page.evaluate(() => document.querySelector('.cuerpo.sel').dataset.i) === '0', 'tocar una tarjeta elige el cuerpo');
  await tocar(page, '.cuerpo[data-i="1"]');
  await tocar(page, '.orden[data-o="aguantar"]'); await page.waitForTimeout(300);
  await tocar(page, '.orden[data-o="empujar"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__B.sect[1].c[0].postura) === 'empujar', 'Empujar cambia la postura');
  await esperar(page, () => window.__B.fase === 'lucha', 60000);
  await tocar(page, '.orden[data-o="relevo"]');
  await esperar(page, () => { const oc = document.querySelector('[data-o="caballeria"] .sub').textContent; return window.__B.cab.estado === 'lista'; });
  await tocar(page, '.orden[data-o="caballeria"]');
  ok(await page.evaluate(() => window.__B.cab.estado) === 'yendo' || await page.evaluate(() => window.__B.ordenes) >= 3, 'Caballería responde al toque');
  await ritmo(page, 14);
  const t0 = Date.now(); let pidio = false;
  while (Date.now() - t0 < 60000) {
    if (await page.evaluate(() => window.__B.fase) === 'fin') break;
    if (await page.evaluate(() => document.querySelector('[data-o="caballeria"]').classList.contains('pide'))) pidio = true;
    await avisosVistos(page); await page.waitForTimeout(300);
  }
  await avisosVistos(page);
  ok(await page.evaluate(() => window.__B.fase) === 'fin', 'la batalla termina');
  await page.waitForTimeout(1900); ok(await page.evaluate(() => !document.getElementById('fin').hidden), 'sale el velo final');
  console.log('el botón de caballería latió: ' + pidio);
  await ctx.close();
}
{
  const { ctx, page } = await abrir(390, 844, 'dpr=1&semilla=11');
  await tocar(page, '#retirar'); ok(await page.evaluate(() => !document.getElementById('salir').hidden), 'Retirarse pide confirmación (toque 1)');
  await tocar(page, '#salir-si'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__B.resultado && window.__B.resultado.como) === 'retirada', 'Retirarse sale en dos toques (toque 2)');
  await ctx.close();
}
{
  const { ctx, page } = await abrir(844, 390, 'dpr=1&semilla=7');
  const cajas = await page.$$eval('.orden', bs => bs.map(b => { const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
  ok(cajas.length === 4 && cajas.every(c => c.x >= 0 && c.y >= 0 && c.x + c.w <= 844 && c.y + c.h <= 390 && c.h >= 40 && c.w >= 40), 'los cuatro botones enteros en pantalla y de 40 px o más (horizontal)');
  await ctx.close();
}

/* 2. Capturas (deviceScaleFactor 2) */
{
  const { ctx, page } = await abrir(390, 844, 'semilla=7');
  await esperar(page, () => { const b = window.__B, e = b.eventos.filter(e => e.tipo === 'salva').pop(); return e && b.t - e.t > 0.8 && b.t - e.t < 1.05; }, 60000);
  await pausa(page, true); await foto(page, 'GM2-1-tiro.jpg'); await pausa(page, false); await ritmo(page, 3);
  await esperar(page, () => { const b = window.__B, e = b.eventos.find(e => e.tipo === 'choque'); return e && b.t - e.t > 4; }, 90000);
  await pausa(page, true); await foto(page, 'GM2-2-choque.jpg'); await pausa(page, false); await ritmo(page, 1);
  await tocar(page, '.orden[data-o="caballeria"]');
  try {
    await esperar(page, () => { const b = window.__B; return b.cab.sect >= 0 && b.cab.estado === 'cargando' && b.sect[b.cab.sect].c[1].golpe > 3.2 && (b.sect[b.cab.sect].c[1].flanco.espalda > 0 || b.sect[b.cab.sect].c[1].flanco.costado > 0); }, 20000);
    await pausa(page, true); await foto(page, 'GM2-3-flanco-enemigo.jpg'); await pausa(page, false);
  } catch (e) { fallos.push('no se vio la caballería cogiendo al enemigo'); }
  await ritmo(page, 4); await avisosVistos(page);
  try {
    await esperar(page, () => window.__B.sect.some(s => s.c[0].flanco.espalda > 0 || s.c[0].flanco.costado > 0), 80000);
    await page.waitForTimeout(150);
    await pausa(page, true); await foto(page, 'GM2-4-flanco-roma.jpg'); await pausa(page, false);
  } catch (e) { fallos.push('no apareció aviso de flanco sobre Roma'); }
  await avisosVistos(page); await ctx.close();
}
{
  const { ctx, page } = await abrir(390, 844, 'rival=cartago&semilla=7&rapido=3');
  await esperar(page, () => window.__B.t > 14, 60000); await pausa(page, true); await foto(page, 'GM2-5-cartago.jpg'); await ctx.close();
}
{
  const { ctx, page } = await abrir(844, 390, 'semilla=7&rapido=3');
  await esperar(page, () => { const b = window.__B, e = b.eventos.find(e => e.tipo === 'choque'); return e && b.t - e.t > 3; }, 90000);
  await pausa(page, true); await foto(page, 'GM2-6-horizontal.jpg'); await ctx.close();
}

ok(avisos.size > 0, 'aparece al menos un aviso de flanco (' + [...avisos].join(', ') + ')');
ok(errores.length === 0, 'cero errores de consola' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
await navegador.close(); servidor.close();
console.log(fallos.length ? 'NO APTO: ' + fallos.join('; ') : 'APTO');
process.exit(fallos.length ? 1 : 0);
