/* Capturas de la maqueta: node gobierno/maquetas/soldado-rome2/captura.mjs <carpeta> nombre=consulta ...
   Si el nombre lleva «ancho» sale a 844×390; si no, a 390×844. DPR=1|2 (variable de entorno). */
import { createRequire } from 'module'; import { spawn } from 'child_process'; import path from 'path'; import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), sal = process.argv[2] || '.', tomas = process.argv.slice(3), dpr = +(process.env.DPR || 2);
const srv = spawn('python3', ['-m', 'http.server', '8797', '-d', raiz], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 1200));
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try { for (const t of tomas) { const [n, ...q] = t.split('='), qs = q.join('='), an = /ancho/.test(n), w = +(process.env.W || (an ? 844 : 390)), h = +(process.env.H || (an ? 390 : 844));
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr }); p.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text().slice(0, 600)); }); p.on('pageerror', e => console.log('PE', e.message.slice(0, 600)));
  await p.goto('http://localhost:8797/gobierno/maquetas/soldado-rome2/index.html?foto&dpr=' + dpr + '&' + qs); await p.waitForFunction('window.__listo', null, { timeout: 300000 }); await p.waitForTimeout(+(process.env.ESPERA || 1500));
  await p.screenshot({ path: path.join(sal, n + '.jpg'), quality: 84, type: 'jpeg', timeout: 240000 }); console.log(n, JSON.stringify(await p.evaluate('window.__info()'))); await p.close(); } }
finally { await b.close(); srv.kill(); }
