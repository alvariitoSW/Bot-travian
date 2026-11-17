// GR1 · juega un año con toques en un móvil de 390×844 y deja gobierno/capturas-tarea/GR1-*.jpg
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { const r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '') || 'index.html'; const f = join(AQUI, r.replace(/^.*provincias\//, '')); res.writeHead(200, { 'content-type': TIPOS[extname(f)] || 'text/plain' }); res.end(await readFile(f)); } catch { res.writeHead(404); res.end(); } }); s.listen(0, '127.0.0.1', () => ok(s)); });
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch(); await mkdir(SALIDA, { recursive: true });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), page = await ctx.newPage();
const errores = []; const bien = (c, t) => { console.log((c ? '  bien: ' : '  MAL:  ') + t); if (!c) errores.push(t); };
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.text()); });
page.on('pageerror', x => errores.push(x.message));
const toca = async s => { await page.tap(s); await page.waitForTimeout(250); };
const foto = async n => { await page.waitForTimeout(250); await page.screenshot({ path: join(SALIDA, 'GR1-' + n + '.jpg'), type: 'jpeg', quality: 85 }); };
const pant = () => page.evaluate(() => window.__gr1.pantalla());
async function revisa(t) {
  const r = await page.evaluate(() => { let fuera = 0; for (const el of document.querySelectorAll('#app *')) { const r = el.getBoundingClientRect(); if (r.width && (r.right > 390.5 || r.left < -0.5) && !el.closest('svg')) fuera++; }
    const b = document.querySelector('#principal'), q = b && b.getBoundingClientRect(); return { ancho: document.documentElement.scrollWidth, fuera, alto: q ? q.height : 99, vis: !q || (q.bottom <= innerHeight && q.top >= 0) }; });
  bien(r.ancho <= 390 && r.fuera === 0 && r.alto >= 44 && r.vis, t + ' (ancho ' + r.ancho + ', fuera ' + r.fuera + ', botón ' + Math.round(r.alto) + ')');
}
await page.goto('http://127.0.0.1:' + srv.address().port + '/index.html?semilla=1'); await page.waitForFunction('window.__gr1');
await revisa('portada'); await foto('1-portada'); await toca('#principal');
const oficios = ['granero', 'forja', 'puerto', 'plaza'];
for (let i = 0; i < 4; i++) {
  const d = await page.evaluate(i => [...document.querySelectorAll('[data-a="oficio"]')].map(b => b.dataset.x), i);
  const quiere = oficios[i]; await toca('[data-a="oficio"][data-x="' + quiere + '"]');
  if (i === 0) { await revisa('oficio capua'); await foto('2-oficio-capua'); } await toca('#principal');
}
bien(await pant() === 'region', 'tras repartir se llega a la región'); await revisa('región'); await foto('3-region');
// primavera: Juegos en Tarento; luego cerrar
await toca('[data-a="ciudad"][data-x="tarento"]'); await toca('[data-a="decreto"][data-x="juegos"]'); await revisa('decreto'); await foto('4-decreto'); await toca('#principal');
await toca('#principal'); bien(await pant() === 'parte', 'parte de primavera'); await revisa('parte'); await toca('#principal');
// verano: suceso
await toca('#principal'); bien(await pant() === 'suceso', 'suceso de verano'); await revisa('suceso'); await toca('[data-a="suceso"][data-x="aguantar"]'); await toca('#principal');
// otoño: partida, vender, comprar armas, véneta
await toca('[data-a="partida"]'); await revisa('partida'); await foto('5-partida'); await toca('[data-a="vender"]'); await toca('[data-a="comprar"][data-x="armas"]'); await toca('#principal');
await toca('#principal'); await toca('[data-a="suceso"][data-x="pagar"]'); await toca('#principal');
bien(await pant() === 'batalla', 'batalla'); await revisa('batalla'); await foto('6-batalla'); await toca('#principal');
await revisa('cuentas'); await foto('7-cuentas');
const alto = await page.evaluate(() => { const c = document.querySelector('#cuerpo'); return c.scrollHeight; }); console.log('  altura de las cuentas ' + alto);
const e = await page.evaluate(() => window.__gr1.estado()); console.log('  final: ' + e.batalla.res.titulo + ' (' + e.batalla.ej.fuerza + ' contra ' + e.batalla.gala.total + ')');
await toca('#principal'); bien(await pant() === 'reparto', 'se puede probar otro reparto');
await br.close(); srv.close();
if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); process.exit(1); } console.log('APTO'); process.exit(0);
