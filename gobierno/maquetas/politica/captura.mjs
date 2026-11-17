// EV1 · juega «Un año de política» en un móvil simulado (390×844) con toques de dedo y deja las capturas EV1-*.jpg.
// Uso: node gobierno/maquetas/politica/captura.mjs [dpr=1 prefijo=/ruta/p-] [--servir]
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8379 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/politica/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch();
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'EV1-'), errores = [];
const espera = (p, ms) => p.waitForTimeout(ms);
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
let fotos = 0;
async function juego(nombre, query) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  const ev = () => page.evaluate(() => window.__ev.estado());
  const foto = async (n, ms = 1500) => { await espera(page, ms); await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 85 }); fotos++; console.log('  captura ' + n); };
  const toca = async sel => { await page.tap(sel); await espera(page, 300); };
  const revisa = async t => {
    const r = await page.evaluate(() => { const b = document.querySelector('#principal') || document.querySelector('#pueblo'), q = b.getBoundingClientRect(), sc = document.getElementById('cuerpo'); return { ancho: Math.max(document.documentElement.scrollWidth, sc.scrollWidth), vis: q.top >= 0 && q.bottom <= innerHeight && q.width > 0, alto: q.height }; });
    bien(r.ancho <= 390, t + ': nada se sale del ancho (' + r.ancho + ')'); bien(r.vis && r.alto >= 44, t + ': botón principal visible y de ' + Math.round(r.alto) + ' px');
  };
  const sigue = async () => { await toca('#principal'); await espera(page, 700); };
  await page.goto(URL0 + (query || '')); await page.waitForFunction('window.__ev && window.__ev.lista === true');
  return { page, ev, foto, toca, revisa, sigue, ctx };
}
/* 1 · camino real: Senado con trato de los mercaderes, alianza, permitir */
console.log('Partida 1 · camino real');
{ const { page, ev, foto, toca, revisa, sigue, ctx } = await juego('real', '');
  await foto('1-evento', 900); await revisa('Primavera');
  await toca('[data-t="mer"]'); await foto('2-senado', 1200);
  bien(await page.isVisible('.glo'), 'hay un orador con bocadillo a mitad del debate');
  await foto('2b-debate', 800);
  await page.evaluate(() => window.__ev.salta()); await espera(page, 600);
  bien(/Votar ya · 17 de 16/.test(await page.textContent('#principal')), 'con el trato de los mercaderes el botón dice 17 de 16');
  await toca('#principal'); await espera(page, 5200); await foto('2c-resultado', 600);
  bien((await ev()).marcas.via === 'senado', 'el Senado vota y Roma cruza'); await revisa('Resultado del voto'); await sigue();
  await toca('[data-o="alianza"]'); await foto('3-hieron', 400); await revisa('Verano'); await toca('#principal'); await espera(page, 1200); await foto('3b-hieron-resultado', 300); await sigue();
  await toca('[data-o="permitir"]'); await foto('4-foro', 400); await revisa('Otoño'); await toca('#principal'); await espera(page, 1200); await sigue();
  await foto('5-hilo-real', 1600); await revisa('Cierre');
  bien((await ev()).desvio === 0, 'el desvío del camino real es 0 %');
  await ctx.close(); }
/* 2 · camino desviado: votar sin tratos, acatar, flota, prohibir */
console.log('Partida 2 · camino desviado');
{ const { page, ev, foto, toca, revisa, sigue, ctx } = await juego('desvio', '?rapido=1');
  await toca('#principal'); await espera(page, 800);
  bien((await ev()).pend === true, 'sin tratos el voto no sale y aparece la segunda decisión');
  await foto('6-no-sale', 800); await revisa('Segunda decisión'); await toca('#acatar'); await espera(page, 900); await sigue();
  await toca('[data-o="flota"]'); await toca('#principal'); await espera(page, 1000); await sigue();
  await toca('[data-o="prohibir"]'); await toca('#principal'); await espera(page, 1000); await sigue();
  await foto('7-hilo-desvio', 1800); await revisa('Cierre desviado');
  bien((await ev()).desvio === 100, 'el desvío del camino desviado es 100 %');
  await ctx.close(); }
bien(fotos >= 7, 'quedan las capturas (' + fotos + ')');
console.log(errores.length ? 'NO APTO · ' + errores.length + ' fallos:\n' + errores.join('\n') : 'APTO · sin MAL ni errores de consola');
await br.close(); srv.close(); process.exit(errores.length ? 1 : 0);
