/* ES4 · Capturas de «Ásculo, 279 a.C.» (?formacion=combinada&escenario=asculo&bando=pirro|roma). Guarda en gobierno/capturas-tarea/:
   ES4-pirro-vertical.jpg (390×844), ES4-pirro-horizontal.jpg (844×390), ES4-roma-vertical.jpg y ES4-entrada-vertical.jpg.
   Comprueba: objetivo, 5 fichas con «Vél.»/«Hond.» entero, los tiradores rivales, 0 errores de consola y llamadas de dibujo ≤ 30. Uso: node gobierno/maquetas/bloque/captura-es4.mjs */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8484;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (n, ok, x = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + n + (x ? ' · ' + x : '')); if (!ok) fallos++; };
const URL_ = q => `http://localhost:${PUERTO}/gobierno/maquetas/bloque/index.html?formacion=combinada&escenario=asculo&nivel=normal&semilla=3${q}`;
try {
  for (const [w, h, f, bando] of [[390, 844, 'ES4-pirro-vertical', 'pirro'], [844, 390, 'ES4-pirro-horizontal', 'pirro'], [390, 844, 'ES4-roma-vertical', 'roma'], [390, 844, 'ES4-entrada-vertical', null]]) {
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const err = []; p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
    console.log('— ' + f);
    await p.goto(URL_(bando ? '&bando=' + bando : ''));
    if (!bando) {
      await p.waitForSelector('#entrada-asculo button', { timeout: 60000 }); await p.waitForTimeout(1500);
      vale('dos botones de entrada', await p.locator('#entrada-asculo button').count() === 2);
      await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/${f}.jpg`, type: 'jpeg', quality: 82 });
      await p.locator('#entrada-asculo button[data-b="roma"]').click(); await p.waitForTimeout(1500);
      vale('el botón recarga con &bando=roma', /bando=roma/.test(p.url()));
      vale('0 errores de consola', err.length === 0, err.slice(0, 3).join(' | ')); await p.close(); continue;
    }
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 150000 });
    await p.waitForTimeout(8000);
    const obj = await p.locator('#objetivo').innerText();
    vale('objetivo de Ásculo', /Ásculo, 279 a\.C\./.test(obj), obj);
    vale('5 fichas', await p.locator('#tira .ficha').count() === 5);
    vale('fichas con figura y nombre largo en aria-label', await p.locator('#tira .ficha svg').count() === 5 && /Vélites|Honderos/.test((await p.locator('#tira .ficha').evaluateAll(e => e.map(x => x.title))).join(' ')));
    vale('hay tiradores rivales', await p.evaluate(() => !!window.__bloque.tiradoresRival));
    let pico = 0;
    await p.locator('#tira .ficha[data-id="tiradores"]').click(); await p.locator('.orden[data-o="hostigar"]').click({ timeout: 3000 }).catch(() => {});
    for (let i = 0; i < 100; i++) {
      await p.waitForTimeout(400); const e = await p.evaluate(() => ({ v: window.__bloque.estado().llamadas, r: window.__bloque.tiradoresRival.salvas.length }));
      pico = Math.max(pico, e.v || 0); if (i > 20 && e.r >= 1 && i % 5 === 0) break;
    }
    await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(500);
    await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/${f}.jpg`, type: 'jpeg', quality: 82 });
    await p.evaluate(() => window.__bloque.congela(false));
    for (let i = 0; i < 60; i++) { await p.waitForTimeout(300); pico = Math.max(pico, (await p.evaluate(() => window.__bloque.estado().llamadas)) || 0); }
    console.log('  llamadas de dibujo, pico:', pico);
    vale('rivales tiraron', await p.evaluate(() => window.__bloque.tiradoresRival.salvas.length) >= 1);
    vale('llamadas ≤ 30', pico <= 30, String(pico));
    vale('0 errores de consola', err.length === 0, err.slice(0, 3).join(' | ')); await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `MAL (${fallos})` : 'APTO'); process.exit(fallos ? 1 : 0);
