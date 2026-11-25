/* UN3 · La escaramuza combinada unida al juego: se entra desde el menú de Escaramuzas («Pruebas rápidas» → «Ásculo, 279 a.C.»),
   se elige Pirro o Roma y se lucha. Capturas en gobierno/capturas-tarea/UN3-*.jpg a 390×844 (v) y 844×390 (h).
   Comprueba: la entrada existe y lleva a la elección, cada bando arranca con 5 fichas y su objetivo, 0 errores de consola, llamadas ≤ 30.
   Uso: node gobierno/maquetas/bloque/captura-un3.mjs */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8486;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (n, ok, x = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + n + (x ? ' · ' + x : '')); if (!ok) fallos++; };
const foto = (p, f) => p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/UN3-${f}.jpg`, type: 'jpeg', quality: 82 });
try {
  for (const [w, h, o] of [[390, 844, 'v'], [844, 390, 'h']]) {
    for (const bando of ['pirro', 'roma']) {
      const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
      const err = []; p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) err.push(m.text()); });
      console.log(`— ${bando} ${o}`);
      await p.goto(`http://localhost:${PUERTO}/`, { waitUntil: 'load' });
      await p.waitForSelector('#menu .mesc', { timeout: 60000 }); await p.waitForTimeout(1500);
      await p.click('#menu .mesc'); await p.waitForTimeout(1200);
      const ent = p.locator('#hoja a.esc-asculo');
      vale('entrada «Ásculo, 279 a.C.» en Escaramuzas', await ent.count() === 1);
      await ent.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
      if (bando === 'pirro') await foto(p, `menu-${o}`);
      await ent.click();
      await p.waitForSelector('#entrada-asculo button', { timeout: 60000 }); await p.waitForTimeout(1500);
      vale('la entrada lleva a la elección Pirro/Roma', await p.locator('#entrada-asculo button').count() === 2);
      vale('la elección tiene «Volver al menú»', await p.locator('#entrada-asculo a').count() === 1);
      if (bando === 'pirro') await foto(p, `eleccion-${o}`);
      await p.locator(`#entrada-asculo button[data-b="${bando}"]`).click();
      await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 150000 });
      await p.waitForTimeout(3000);
      const h1 = await p.locator('#inicio h1').innerText();
      vale('tarjeta de entrada de Ásculo (no la del manípulo)', /Ásculo/.test(h1) && !/galos/.test(await p.locator('#inicio').innerText()), h1);
      await foto(p, `tarjeta-${bando}-${o}`);
      await p.locator('#inicio [data-nivel="normal"]').click(); await p.waitForTimeout(5000);
      const obj = await p.locator('#objetivo').innerText();
      vale('objetivo de Ásculo', /Ásculo, 279 a\.C\./.test(obj), obj);
      vale('5 fichas', await p.locator('#tira .ficha').count() === 5);
      let pico = 0;
      await p.locator('#tira .ficha').first().click().catch(() => {});
      await p.locator('.orden[data-o="avanzar"]').click({ timeout: 3000 }).catch(() => {});
      for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); pico = Math.max(pico, (await p.evaluate(() => window.__bloque.estado().llamadas)) || 0); }
      await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(500);
      await foto(p, `${bando}-${o}`);
      await p.evaluate(() => window.__bloque.congela(false));
      console.log('  llamadas de dibujo, pico:', pico);
      vale('llamadas ≤ 30', pico <= 30, String(pico));
      vale('0 errores de consola', err.length === 0, err.slice(0, 3).join(' | ')); await p.close();
    }
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `MAL (${fallos})` : 'APTO'); process.exit(fallos ? 1 : 0);
