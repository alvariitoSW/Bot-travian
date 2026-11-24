/* ES2 · Capturas y prueba en navegador de la combinada (?formacion=combinada). Guarda ES2-vertical.jpg (390×844) y ES2-horizontal.jpg (844×390)
   en gobierno/capturas-tarea/, con un manípulo elegido y su aro. Comprueba 0 errores de consola y mide las llamadas de dibujo (vara ≤ 30).
   Uso: node gobierno/maquetas/bloque/captura-es2.mjs */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8478;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (n, ok, x = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + n + (x ? ' · ' + x : '')); if (!ok) fallos++; };
try {
  for (const [w, h, f] of [[390, 844, 'ES2-vertical'], [844, 390, 'ES2-horizontal']]) {
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const err = []; p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
    console.log('— ' + f);
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/index.html?formacion=combinada&nivel=normal&semilla=3`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 150000 });
    await p.waitForTimeout(8000);
    vale('hay tira con 4 fichas', await p.locator('#tira .ficha').count() === 4);
    await p.locator('#tira .ficha[data-id="man1"]').click(); await p.waitForTimeout(1500);
    vale('Man. I elegido', await p.evaluate(() => window.__bloque.mando.elegido) === 'man1');
    vale('botones de manípulo', (await p.locator('.orden b').allTextContents()).join() === 'Testudo,Cargar,Relevo,Alto');
    const antes = await p.evaluate(() => window.__bloque.S.amigas.map(a => a.z));
    await p.evaluate(() => window.__bloque.dibuja({ x: -30, z: -12 }, { x: -14, z: -12 })); await p.waitForTimeout(5000);
    const desp = await p.evaluate(() => window.__bloque.S.amigas.map(a => a.z));
    vale('el frente mueve solo al elegido', desp[0] < antes[0] - 0.2 && Math.abs(desp[1] - antes[1]) < 0.1, antes.map(z => z.toFixed(1)) + ' → ' + desp.map(z => z.toFixed(1)));
    await p.locator('#pausaB').click(); const T = await p.evaluate(() => window.__bloque.S.T); await p.waitForTimeout(1500);
    vale('pausa: el reloj no corre', Math.abs(await p.evaluate(() => window.__bloque.S.T) - T) < 0.01);
    await p.locator('#pausaB').click();
    const llamadas = await p.evaluate(() => window.__bloque.estado().llamadas);
    console.log('  llamadas de dibujo:', llamadas);
    if (llamadas != null) vale('llamadas ≤ 30', llamadas <= 30);
    await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/${f}.jpg`, type: 'jpeg', quality: 80 });
    vale('0 errores de consola', err.length === 0, err.slice(0, 3).join(' | ')); await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `MAL (${fallos})` : 'APTO'); process.exit(fallos ? 1 : 0);
