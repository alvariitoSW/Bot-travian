// AM1 · capturas de las maquetas del mapa vivo: node gobierno/maquetas/mapa-comun/captura.mjs [a,b,c] [vistas]
// Deja gobierno/capturas-tarea/AM1-<maqueta>-<n>.jpg (390×844 y 844×390) y gobierno/capturas-tarea/AM1-medidas.json
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.bin': 'application/octet-stream', '.svg': 'image/svg+xml' };
let bytes = {};
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { const r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r.includes('..')) throw 0; const d = await readFile(join(RAIZ, r)); bytes[r] = d.length; res.writeHead(200, { 'content-type': TIPOS[extname(r)] || 'text/plain' }); res.end(d); } catch { res.writeHead(404); res.end(); } }); s.listen(0, '127.0.0.1', () => ok(s)); });
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); await mkdir(SALIDA, { recursive: true });
const MAQ = { a: 'mapa-a-natural', b: 'mapa-b-carta', c: 'mapa-c-tablero' }, cuales = (process.argv[2] || 'a,b,c').split(','), solo = process.argv[3] ? process.argv[3].split(',') : null;
const TOMAS = [['1-polis-v', 'v', 'vista=corazon'], ['2-recursos-v', 'v', 'vista=corazon&rec=1'], ['3-entera-v', 'v', 'vista=entera&rec=1'], ['4-cerca-v', 'v', 'vista=atenas'], ['5-ficha-v', 'v', 'vista=peloponeso&rec=1&polis=atenas'], ['6-polis-h', 'h', 'vista=corazon&rec=1'], ['7-cerca-h', 'h', 'vista=atenas'], ['8-egeo-h', 'h', 'vista=egeo']];
const errores = [], medidas = {};
for (const m of cuales) { medidas[m] = {};
  for (const [n, o, q] of TOMAS) { if (solo && !solo.includes(n[0])) continue;
    const ctx = await br.newContext({ viewport: o === 'v' ? { width: 390, height: 844 } : { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), page = await ctx.newPage();
    page.on('console', x => { if (x.type() === 'error') errores.push(m + ' ' + n + ': ' + x.text()); }); page.on('pageerror', x => errores.push(m + ' ' + n + ': ' + x.message));
    bytes = {}; await page.goto('http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/' + MAQ[m] + '/index.html?t=40&' + q);
    await page.waitForFunction('window.__mapa && window.__mapa.listo', null, { timeout: 120000 }); await page.waitForTimeout(2500);
    await page.evaluate(() => window.__mapa.medir()); await page.waitForTimeout(2500);
    const info = await page.evaluate(() => window.__mapa.info()), fuera = await page.evaluate(() => { let f = 0; for (const el of document.querySelectorAll('#botones, #leyenda, #ficha:not([hidden]), #titulo')) { const r = el.getBoundingClientRect(); if (r.right > innerWidth + 0.5 || r.left < -0.5 || r.bottom > innerHeight + 0.5) f++; } return f; });
    info.descargaKB = Math.round(Object.values(bytes).reduce((a, b) => a + b, 0) / 1024); info.propiosKB = Math.round(Object.entries(bytes).filter(([k]) => k.includes('maquetas/')).reduce((a, b) => a + b[1], 0) / 1024); medidas[m][n] = info;
    if (fuera) errores.push(m + ' ' + n + ': ' + fuera + ' paneles fuera de la pantalla');
    await page.screenshot({ path: join(SALIDA, 'AM1-' + m + '-' + n + '.jpg'), type: 'jpeg', quality: 86 }); console.log(m, n, JSON.stringify(info)); await ctx.close(); } }
if (!solo && cuales.length === 3) await writeFile(join(SALIDA, 'AM1-medidas.json'), JSON.stringify(medidas, null, 1));
await br.close(); srv.close();
if (errores.length) { console.log('ERRORES:\n' + errores.join('\n')); process.exit(1); } console.log('APTO'); process.exit(0);
