// Maqueta Q1b2 aligerada (Q1c): saca las capturas de la segunda maqueta de la ciudad itálica. No toca el juego.
// Uso:  node gobierno/maquetas/ciudad2/captura.mjs                 -> las 5 capturas Q1c-* y las 2 comparaciones con las Q1b2-* (dpr 2) en gobierno/capturas-tarea/
//       node gobierno/maquetas/ciudad2/captura.mjs --una vista=cerca cultura=roma [dpr=1] [salida=ruta.jpg] [d=..&el=..]   -> una sola, para iterar
//       node gobierno/maquetas/ciudad2/captura.mjs --servir         -> solo sirve la página (http://127.0.0.1:8377/gobierno/maquetas/ciudad2/)
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));

const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d); } catch (e) { res.writeHead(404); res.end('no'); } }); s.listen(args.includes('--servir') ? 8377 : 0, '127.0.0.1', () => ok(s)); });
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + BASE + 'gobierno/maquetas/ciudad2/'); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const medidas = [];
async function una(nombre, params, dpr = 2) {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr }), page = await ctx.newPage(), t0 = Date.now();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); }); page.on('pageerror', e => console.log('  [error de página] ' + e.message.slice(0, 400)));
  await page.goto(BASE + 'gobierno/maquetas/ciudad2/index.html?quieto&' + params); await page.waitForFunction('window.__lista === true', null, { timeout: 600000 }); await page.waitForTimeout(300);
  const ruta = nombre.includes('/') ? nombre : join(SALIDA, nombre); for (let i = 0; ; i++) { try { await page.screenshot({ path: ruta, type: 'jpeg', quality: 86, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; console.log('  (reintento de captura)'); } }
  const m = await page.evaluate('({ ...window.__medidas, conSombra: window.__medidasConSombra })'); medidas.push({ nombre, ...m });
  console.log(`${nombre}: ${m.triangulos} triángulos, ${m.llamadas} llamadas (con pase de sombra: ${m.conSombra.triangulos} / ${m.conSombra.llamadas}) · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  if (args.includes('--detalle')) console.log(JSON.stringify(m));
  await ctx.close();
}
async function lado(nombre, antes, despues) {
  const ctx = await br.newContext({ viewport: { width: 780, height: 844 }, deviceScaleFactor: 2 }), page = await ctx.newPage();
  const img = async f => 'data:image/jpeg;base64,' + (await readFile(join(SALIDA, f))).toString('base64');
  await page.setContent(`<body style="margin:0;display:flex;background:#000">${[['Antes', await img(antes)], ['Después', await img(despues)]].map(([r, s]) => `<div style="position:relative;width:390px;height:844px"><img src="${s}" style="width:390px;height:844px;display:block"><span style="position:absolute;left:8px;bottom:8px;font:600 12px system-ui,sans-serif;color:#fff;background:#000a;padding:3px 8px;border-radius:4px">${r}</span></div>`).join('')}</body>`);
  await page.waitForTimeout(300); await page.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 86 }); await ctx.close(); console.log(nombre);
}
if (args.includes('--una')) { const { salida, dpr, ...resto } = op; await una(salida || 'Q1c-prueba.jpg', new URLSearchParams(resto).toString(), +(dpr || 1)); }
else {
  await una('Q1c-1-romana-cerca.jpg', 'cultura=roma&vista=cerca'); await una('Q1c-2-romana-lejos.jpg', 'cultura=roma&vista=lejos'); await una('Q1c-3-romana-calle.jpg', 'cultura=roma&vista=calle');
  await una('Q1c-4-griega-cerca.jpg', 'cultura=grecia&vista=cerca'); await una('Q1c-5-punica-cerca.jpg', 'cultura=punica&vista=cerca');
  await lado('Q1c-0-antes-despues-cerca.jpg', 'Q1b2-1-romana-cerca.jpg', 'Q1c-1-romana-cerca.jpg'); await lado('Q1c-0-antes-despues-lejos.jpg', 'Q1b2-2-romana-lejos.jpg', 'Q1c-2-romana-lejos.jpg');
  await writeFile(join(AQUI, 'medidas.json'), JSON.stringify(medidas, null, 1));
}
await br.close(); srv.close();
