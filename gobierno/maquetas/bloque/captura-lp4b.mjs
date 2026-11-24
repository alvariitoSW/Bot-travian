/* LP4b · Capturas de «Trabados» y la «Retirada ordenada» (390×844 y 844×390). Abre la maqueta con ?fase=trabado (el jugador
   automático llega al choque y va perdiendo: «Retirada» se ilumina) y ?fase=retirada (la manda y corre 11 s), congeladas.
   Guarda gobierno/capturas-tarea/LP4b-<fase>-<v|h>.jpg. Uso: node gobierno/maquetas/bloque/captura-lp4b.mjs [v|h|vh]
   Sirve la raíz con python3 -m http.server en el puerto 8474. Render por software: lento. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8474;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const ORI = process.argv[2] || 'vh';
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const foto = async (p, o, fase, errores) => {
  const nombre = `gobierno/capturas-tarea/LP4b-${fase}-${o}.jpg`;
  await p.screenshot({ path: RAIZ + nombre, type: 'jpeg', quality: 80 });
  const e = await p.evaluate(() => { const C = window.__bloque.C, t = C.S.tuyo; return { T: +C.S.T.toFixed(1), estado: t.estado, orden: t.orden, util: C.ordenUtil(), trabado: C.trabado(), enPie: t.U.enPie, coh: Math.round(t.coh), boton: document.querySelector('.orden:last-child b').textContent, luz: [...document.querySelectorAll('.orden.luz b')].map(b => b.textContent).join(','), placa: !!document.querySelector('.est.tuyo.trabado'), marcha: document.getElementById('marcha').textContent, grito: document.getElementById('grito').textContent }; });
  console.log(nombre, JSON.stringify(e), errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores');
};
try {
  for (const o of ORI.split('')) {
    const [w, h] = o === 'v' ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    for (const fase of (process.argv[3] || 'trabado,retirada').split(',')) {
      await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/?fase=${fase}&nivel=normal&semilla=1`);
      await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 120000 });
      await p.waitForTimeout(9000);
      await foto(p, o, fase, errores);
    }
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
