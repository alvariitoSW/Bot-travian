/* AQVILA — TH1: captura del aviso de una táctica de la época en la batalla dirigida (js/ui-mando.js), a 844×390 y 390×844.
   Uso: node gobierno/captura-th1.mjs → gobierno/capturas-tarea/TH1-*.jpg. Sale con código 1 si hay errores o no sale el aviso.
   Mientras index.html no cargue js/tacticas.js (pase a la sesión de subida), la captura lo añade a la página antes de abrir la batalla. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = createRequire(import.meta.url)('playwright');
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea'), PUERTO = 8797;
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
const fallos = [], bien = (ok, t) => { console.log((ok ? '  bien: ' : '  MAL: ') + t); if (!ok) fallos.push(t); };
await mkdir(SALIDA, { recursive: true });
await new Promise(r => setTimeout(r, 1200));
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
try {
  for (const [w, h, n] of [[844, 390, 'h'], [390, 844, 'v']]) {
    const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), page = await ctx.newPage(), esp = ms => page.waitForTimeout(ms);
    page.on('console', m => { if (m.type() === 'error' && !/GPU stall|GL Driver/.test(m.text())) fallos.push('consola: ' + m.text().slice(0, 250)); });
    page.on('pageerror', e => fallos.push('excepción: ' + String(e.message).slice(0, 250)));
    await page.goto('http://127.0.0.1:' + PUERTO + '/'); await esp(1500);
    if (!(await page.evaluate(() => !!window.Tacticas))) await page.addScriptTag({ url: '/js/tacticas.js' });
    await page.evaluate(() => { window.UIMando.abrir({ semilla: 3, ejercitos: [{ hastati: 600, principes: 600, triarii: 300, equites: 120 }, { galos: 1500, jinetes: 120 }], campo: 'llano' }, () => {}); });
    await page.waitForFunction('window.__mn && window.__mn.lista === true', null, { timeout: 150000 }); await esp(1500);
    bien(await page.evaluate(() => !!window.__mn.S.tac), 'la batalla dirigida lleva las tácticas');
    let ev = null;
    for (let i = 0; i < 60 && !ev; i++) { ev = await page.evaluate(() => { window.__mn.salta(2); return window.__mn.S.reg.find(e => e.tipo === 'tactica') || null; }); }
    bien(!!ev, 'actúa una táctica: ' + (ev && ev.texto));
    await page.evaluate(() => window.__mn.cuadro(0.05)); await esp(800);
    const cinta = await page.evaluate(() => document.getElementById('mn-cinta').textContent);
    bien(ev && cinta.includes(ev.texto), 'el aviso sale en la cinta: «' + cinta.slice(0, 120) + '»');
    await page.screenshot({ path: join(SALIDA, 'TH1-aviso-' + n + '.jpg'), type: 'jpeg', quality: 84, timeout: 180000 }); console.log('  captura TH1-aviso-' + n);
    await ctx.close();
  }
} finally { await br.close(); srv.kill(); }
if (fallos.length) { console.log('MAL:\n' + fallos.join('\n')); process.exit(1); }
console.log('APTO');
