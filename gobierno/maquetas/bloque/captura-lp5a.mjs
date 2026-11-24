/* LP5a · Capturas de la física en «Manípulo a pie» (390×844 y 844×390). Cada fase abre la página con ?fase=… (salta con el
   jugador automático y congela) y guarda gobierno/capturas-tarea/LP5a-<fase>[-cerca][-antes]-<v|h>.jpg. Uso:
   node gobierno/maquetas/bloque/captura-lp5a.mjs [fase,fase,...] [v|h|vh] [cerca|lejos|antes]
   Sirve la raíz con python3 -m http.server en el puerto 8473. Render por software: lento; pocas fases. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8475;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const FASES = (process.argv[2] || 'choque,flanco,relevo').split(',');
const ORI = process.argv[3] || 'v', MODO = process.argv[4] || 'lejos';
/* cerca: la cámara baja a ras de la línea de choque (d, alto, adelante, abertura); antes: lo mismo con ?fisica=0 */
const CAM = { v: process.env.CAMV || '9,6,15,50', h: process.env.CAMH || '8,4.5,15,40' };
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  for (const o of ORI.split('')) for (const fase of FASES) {
    const [w, h] = o === 'v' ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: +(process.env.DSF || 1), hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    let q = `?fase=${fase}&semilla=3`; if (MODO !== 'lejos') q += `&cam=${CAM[o]}`; if (MODO === 'antes') q += '&fisica=0';
    const t0 = Date.now();
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/${q}`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 120000 });
    await p.waitForTimeout(9000);
    const nombre = `gobierno/capturas-tarea/LP5a-${fase}${MODO === 'lejos' ? '' : '-' + MODO}-${o}.jpg`;
    await p.screenshot({ path: RAIZ + nombre, type: 'jpeg', quality: 80 });
    const e = await p.evaluate(() => ({ ...window.__bloque.estado(), fisica: window.__bloque.fisica() }));
    console.log(nombre, Math.round((Date.now() - t0) / 1000) + ' s', JSON.stringify(e), errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores');
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
