/* LP4 · Capturas y prueba de la vista del oficial (390×844 y 844×390). Guarda gobierno/capturas-tarea/LP4-<caso>-<v|h>.jpg.
   Casos: arriba (partida en marcha, con el botón) · oficial · salva · choque (saltos con ?vista=oficial) ·
   pellizco: dedos de verdad (toques del navegador): abre los dedos → baja (captura a mitad y abajo), arrastra un dedo
   por el suelo → raya y frente nuevo, toca «Testudo» → orden, cierra los dedos → vuelve arriba. Imprime cada comprobación.
   Uso: node gobierno/maquetas/bloque/captura-lp4.mjs [caso,caso,...] [v|h|vh] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8474;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const CASOS = (process.argv[2] || 'arriba,oficial,salva,choque,pellizco').split(',');
const ORI = process.argv[3] || 'vh';
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (nombre, ok, extra = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + nombre + (extra ? ' · ' + extra : '')); if (!ok) fallos++; };
try {
  for (const o of ORI.split('')) for (const caso of CASOS) {
    const [w, h] = o === 'v' ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    const q = { arriba: '?nivel=normal&semilla=3', oficial: '?nivel=normal&semilla=3&vista=oficial', salva: '?fase=salva&semilla=3&vista=oficial',
      choque: '?fase=choque&semilla=3&vista=oficial', pellizco: '?nivel=normal&semilla=3' }[caso];
    const foto = async n => { const r = `gobierno/capturas-tarea/LP4-${n}-${o}.jpg`; await p.screenshot({ path: RAIZ + r, type: 'jpeg', quality: 80 }); console.log(r); };
    const espera = async (f, ms = 45000) => { try { await p.waitForFunction(f, null, { timeout: ms, polling: 200 }); } catch (e) { /* lo dice la comprobación */ } };
    const est = () => p.evaluate(() => ({ ...window.__bloque.estado(), modo: window.__bloque.vista.modo(), t: window.__bloque.vista.t(), meta: !!(window.__bloque.S.B && window.__bloque.S.B.meta), cam: window.__bloque.cam }));
    console.log(`— ${caso} ${o}`);
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/${q}`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 120000 });
    await p.waitForTimeout(8000);
    if (caso !== 'pellizco') { await foto(caso); const e = await est(); vale('modo ' + e.modo, caso === 'arriba' ? e.modo === 'arriba' : e.modo === 'oficial', `llamadas ${e.llamadas}, triángulos ${(e.triangulos / 1e6).toFixed(2)} M`); }
    else {
      const cdp = await p.context().newCDPSession(p), toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
      const cx = w / 2, cy = h * 0.55, pasos = async (d0, d1, n = 8) => { for (let i = 0; i <= n; i++) { const d = d0 + (d1 - d0) * i / n; await toque(i ? 'touchMove' : 'touchStart', [[cx - d, cy], [cx + d, cy]]); await p.waitForTimeout(30); } await toque('touchEnd', []); };
      const m0 = (await est()).meta;
      await pasos(40, 130); await p.waitForTimeout(500); await foto('bajando');
      let e = await est(); vale('pellizco abre → baja', e.modo === 'oficial' && e.t > 0, 'a medio camino t=' + e.t.toFixed(2));
      vale('el pellizco no dibuja frente', e.meta === m0);
      await espera(() => window.__bloque.vista.t() === 1); e = await est(); vale('llega abajo', e.t === 1); await foto('pellizco');
      /* un dedo por el suelo, desde abajo */
      const y = h * (o === 'v' ? 0.66 : 0.72), x0 = w * 0.3, x1 = w * 0.7;
      await toque('touchStart', [[x0, y]]); for (let i = 1; i <= 10; i++) { await toque('touchMove', [[x0 + (x1 - x0) * i / 10, y - 6 * i / 10]]); await p.waitForTimeout(30); }
      await foto('dibuja'); await toque('touchEnd', []); await p.waitForTimeout(300);
      e = await est(); vale('desde abajo se dibuja el frente', e.meta);
      await p.tap('[data-o="testudo"]'); await p.waitForTimeout(1500); e = await est(); vale('las órdenes siguen vivas (Testudo)', e.orden === 'testudo', 'orden=' + e.orden);
      await foto('testudo');
      await pasos(130, 40); await espera(() => window.__bloque.vista.t() === 0); e = await est(); vale('pellizco cierra → vuelve arriba', e.modo === 'arriba' && e.t === 0);
      await foto('vuelve');
      await p.tap('#vista'); await espera(() => window.__bloque.vista.t() === 1); e = await est(); vale('botón «Oficial» baja', e.modo === 'oficial' && e.t === 1);
      await p.tap('#vista'); await espera(() => window.__bloque.vista.t() === 0); e = await est(); vale('botón «Arriba» sube', e.modo === 'arriba' && e.t === 0);
    }
    vale('sin errores de consola', !errores.length, errores.join(' | '));
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `NO APTO: ${fallos} fallos` : 'APTO');
process.exit(fallos ? 1 : 0);
