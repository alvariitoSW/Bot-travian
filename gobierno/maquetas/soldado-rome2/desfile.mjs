/* node desfile.mjs salida.jpg "t=hastatus,galo&lv=0" [ancho] */
import { createRequire } from 'module'; import { spawn } from 'child_process';
const { chromium } = createRequire(import.meta.url)('playwright');
const [sal, qs, an] = process.argv.slice(2), port = 8790 + Math.floor(Math.random() * 90);
const srv = spawn('python3', ['-m', 'http.server', String(port), '-d', new URL('../../..', import.meta.url).pathname], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 1000));
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try { const p = await b.newPage({ viewport: an ? { width: 844, height: 390 } : { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('console', m => { if (m.type() === 'error') console.log('ERR', m.text().slice(0, 300)); }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://localhost:${port}/gobierno/maquetas/soldado-rome2/desfile.html?${qs}`); await p.waitForFunction('window.__listo', null, { timeout: 180000 });
  await p.screenshot({ path: sal, type: 'jpeg', quality: 85 }); console.log(JSON.stringify(await p.evaluate('window.__info()')));
} finally { await b.close(); srv.kill(); }
