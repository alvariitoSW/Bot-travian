/* Miniaturas de edificio 160×160 (MN4c). Uso: node tools/laminas/hacer.mjs
   Renderiza los modelos de 0 A.D. (Wildfire Games, CC BY-SA 3.0) de assets/static y escribe assets/laminas/edif/<id>.webp.
   Edificios sin modelo propio (herreria, escuela, termas…) se saltan: no se reutiliza el de otro para no engañar. */
import { createRequire } from 'node:module'; import { createServer } from 'node:http'; import { readFile, writeFile, mkdir } from 'node:fs/promises'; import { join, extname, dirname } from 'node:path'; import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const EDIF = { aserradero: 'aserradero', cantera: 'cantera', mina: 'mina', granja: 'granja', viviendas: 'casa', foro: 'foro', almacen: 'almacen', mercado: 'mercado', puerto: 'puerto', cuartel: 'cuartel', establo: 'establo', muralla: 'torre', templo: 'templo', acueducto: 'arco', compitum: 'vesta' };
const AJ = { muralla: 0.9, puerto: 0.62 };
const T = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await (await br.newContext({ viewport: { width: 320, height: 320 }, serviceWorkers: 'block' })).newPage();
pg.on('pageerror', e => console.log('ERROR', e.message));
await pg.goto('http://127.0.0.1:' + srv.address().port + '/tools/laminas/estudio.html'); await pg.waitForFunction(() => window.listo, null, { timeout: 30000 });
await mkdir(join(RAIZ, 'assets/laminas/edif'), { recursive: true });
const hechos = [], saltados = [];
for (const [id, key] of Object.entries(EDIF)) {
  const png = await pg.evaluate(([k, a]) => window.pinta(k, a), [key, AJ[id]]);
  if (!png) { saltados.push(id); continue; }
  const webp = await pg.evaluate(async d => { const im = new Image(); im.src = d; await im.decode(); const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, 160, 160); return c.toDataURL('image/webp', 0.8); }, png);
  await writeFile(join(RAIZ, 'assets/laminas/edif', id + '.webp'), Buffer.from(webp.split(',')[1], 'base64')); hechos.push(id);
}
console.log('miniaturas:', hechos.join(' ')); console.log('sin modelo:', saltados.join(' ') || '(ninguno)');
await br.close(); srv.close();
