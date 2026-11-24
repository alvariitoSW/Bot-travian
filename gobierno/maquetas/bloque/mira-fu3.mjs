/* FU3 · mirar la falange de cerca: vista del oficial con las picas bajadas (captura a mano, no es juez) */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8478;
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1500));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  for (const [w, h, nom] of [[844, 390, 'oficial-844'], [390, 844, 'oficial-390']]) {
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const err = []; p.on('pageerror', e => err.push(String(e)));
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/index.html?formacion=falange&fase=picas&vista=oficial`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 150000 });
    await p.waitForTimeout(5000);
    await p.waitForTimeout(5000);
    await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/FU3-${nom}.jpg`, type: 'jpeg', quality: 80 });
    console.log(nom, JSON.stringify(await p.evaluate(() => window.__bloque.estado())), err.length ? err : 'sin errores');
  }
} finally { await nav.close(); srv.kill(); }
