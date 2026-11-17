/* Capturas de la maqueta: node gobierno/maquetas/soldado-fino/captura.mjs <carpeta de salida> [nombre=consulta ...] */
import { createRequire } from 'module'; import { spawn } from 'child_process'; import path from 'path'; import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), sal = process.argv[2] || '.', tomas = process.argv.slice(3);
const srv = spawn('python3', ['-m', 'http.server', '8793', '-d', raiz], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 1200));
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const t of tomas) { const [n, ...q] = t.split('='), qs = q.join('='), ancho = /ancho/.test(n) ? 844 : 390, altoP = /ancho/.test(n) ? 390 : 844;
  const p = await b.newPage({ viewport: { width: ancho, height: altoP }, deviceScaleFactor: +(process.env.DPR || 2) }); p.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text()); }); p.on('pageerror', e => console.log('PE', e.message));
  await p.goto('http://localhost:8793/gobierno/maquetas/soldado-fino/index.html?foto&dpr=2&' + qs); await p.waitForFunction('window.__listo', null, { timeout: 300000 }); await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(sal, n + '.jpg'), quality: 82, type: 'jpeg', timeout: 240000 }); console.log(n, JSON.stringify(await p.evaluate('window.__info()'))); await p.close(); }
await b.close(); srv.kill();
