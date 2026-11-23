/* Saca CD0b-<estilo>-<modo>.jpg y las hojas a gobierno/capturas-tarea/. Uso: node gobierno/maquetas/ciudad-nueva-concurso/captura.mjs [estilo ...] */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
const D = dirname(fileURLToPath(import.meta.url));
const OUT = join(D, '..', '..', 'capturas-tarea');
const { chromium } = createRequire(import.meta.url)('playwright');
const modos = ['ciudad', 'construir', 'necesidades'];
let estilos = readdirSync(D, { withFileTypes: true }).filter(d => d.isDirectory() && !['comun', 'hoja'].includes(d.name) && existsSync(join(D, d.name, 'index.html'))).map(d => d.name).sort();
if (process.argv.length > 2) estilos = estilos.filter(e => process.argv.slice(2).includes(e));
// Servidor estático de la raíz del repo: los estilos con módulos ES (three.js) no cargan por file://
const RAIZ = join(D, '..', '..', '..'), MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = createServer((q, r) => { try { const f = join(RAIZ, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(RAIZ)) throw 0; const b = readFileSync(f); r.writeHead(200, { 'content-type': MIME[f.slice(f.lastIndexOf('.'))] || 'application/octet-stream' }); r.end(b); } catch { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const BASE = `http://127.0.0.1:${srv.address().port}/gobierno/maquetas/ciudad-nueva-concurso/`;
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let errores = 0;
const abrir = async (w, h, dsf) => { const p = await (await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf })).newPage();
  p.on('console', m => { if (m.type() === 'error') { errores++; console.log('ERROR consola:', m.text()); } }); p.on('pageerror', e => { errores++; console.log('ERROR página:', e.message); }); return p; };
const page = await abrir(390, 844, 2);
for (const e of estilos) for (const m of modos) {
  await page.goto(BASE + e + '/index.html?p=' + m);
  await page.waitForFunction(() => window.listo === true, null, { timeout: 30000 }); await page.waitForTimeout(250);
  await page.screenshot({ path: join(OUT, `CD0b-${e}-${m}.jpg`), type: 'jpeg', quality: 82 });
  console.log('ok', e, m);
}
const parcial = process.argv.length > 2; // con estilos concretos no se toca la hoja (faltarían imágenes de los demás)
if (!parcial) writeFileSync(join(D, "hoja", "datos.js"), `window.ESTILOS=${JSON.stringify(["pintado", "maqueta", "lamina"].filter(e => estilos.includes(e)))};\n`); // concurso: los tres que eligió el usuario (23/11); plano-claro es el punto de partida
const hp = await abrir(1600, 1000, 1);
for (const [q, n] of parcial ? [] : [['', 'CD0b-hoja'], ['?v=ciudad', 'CD0b-hoja-ciudad']]) {
  await hp.goto(pathToFileURL(join(D, 'hoja', 'index.html')).href + q);
  await hp.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0), null, { timeout: 30000 }); await hp.waitForTimeout(200);
  await hp.screenshot({ path: join(OUT, n + '.jpg'), type: 'jpeg', quality: 82, fullPage: true });
  console.log('ok', n);
}
await br.close(); srv.close();
if (errores) { console.log(errores + ' errores de consola'); process.exit(1); }
