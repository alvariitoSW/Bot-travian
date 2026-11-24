/* LP3 · Capturas de la maqueta «Manípulo a pie» (390×844 y 844×390). Cada fase abre la página con ?fase=… (salta con el
   jugador automático y congela) y guarda gobierno/capturas-tarea/LP3-<fase>-<v|h>.jpg. Uso:
   node gobierno/maquetas/bloque/captura-lp3.mjs [fase,fase,...] [v|h|vh]
   Sirve la raíz con python3 -m http.server en el puerto 8473. Render por software: lento; pocas fases. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8473;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const FASES = (process.argv[2] || 'inicio,dibuja,salva,carga,choque,flanco,relevo,datos,fin').split(',');
const ORI = process.argv[3] || 'v';
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  for (const o of ORI.split('')) for (const fase of FASES) {
    const [w, h] = o === 'v' ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    const q = fase === 'inicio' ? '' : fase === 'juego' ? '?nivel=normal&semilla=3' : `?fase=${fase}&semilla=3`;
    const t0 = Date.now();
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/${q}`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 120000 });
    await p.waitForTimeout(fase === 'inicio' ? 6000 : 9000);
    const nombre = `gobierno/capturas-tarea/LP3-${fase}-${o}.jpg`;
    await p.screenshot({ path: RAIZ + nombre, type: 'jpeg', quality: 80 });
    const e = await p.evaluate(() => window.__bloque.estado());
    console.log(nombre, Math.round((Date.now() - t0) / 1000) + ' s', JSON.stringify(e), errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores');
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
