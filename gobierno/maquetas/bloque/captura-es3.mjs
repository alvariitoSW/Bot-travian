/* ES3b · Capturas y prueba en navegador de tus tiradores en la combinada (?formacion=combinada&tiradores=honderos). Guarda ES3-vertical.jpg (390×844)
   y ES3-horizontal.jpg (844×390) en gobierno/capturas-tarea/: tiradores elegidos, arco de alcance, blanco marcado y una salva en el aire con estelas.
   Comprueba: quinta ficha, estandarte «Honderos 20», botones, tocar un bloque rival lo marca, 0 errores de consola y las llamadas de dibujo
   en el peor momento (salva en el aire, choque): ≤ 30. Uso: node gobierno/maquetas/bloque/captura-es3.mjs [honderos|arqueros|velites] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8479, TIPO = process.argv[2] || 'honderos';
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (n, ok, x = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + n + (x ? ' · ' + x : '')); if (!ok) fallos++; };
try {
  for (const [w, h, f] of [[390, 844, 'ES3-vertical'], [844, 390, 'ES3-horizontal']]) {
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const err = []; p.on('pageerror', e => err.push(e.message)); p.on('console', m => { if (m.type() === 'error') err.push(m.text()); });
    console.log('— ' + f + ' · ' + TIPO);
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/index.html?formacion=combinada&tiradores=${TIPO}&nivel=normal&semilla=3`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 150000 });
    await p.waitForTimeout(8000);
    vale('hay tira con 5 fichas', await p.locator('#tira .ficha').count() === 5);
    vale('estandarte «' + TIPO + '» con la munición', /\d+$/.test(await p.locator('#ests .est.r').last().innerText()), await p.locator('#ests .est.r').last().innerText());
    const dist = await p.evaluate(() => { const S = window.__bloque.S, X = window.__bloque.tiradores; return +(X.b.z - S.tuyo.z).toFixed(1); });
    vale('a 20 m detrás de tu línea', Math.abs(dist - 20) < 1.5, dist + ' m');
    await p.locator('#tira .ficha[data-id="tiradores"]').click(); await p.waitForTimeout(1200);
    vale('tiradores elegidos', await p.evaluate(() => window.__bloque.mando.elegido) === 'tiradores');
    const bot = (await p.locator('.orden b').allTextContents()).join();
    vale('botones de tiradores', bot === 'Tirar,Hostigar,Retirarse,Alto' || bot === 'Alto el fuego,Hostigar,Retirarse,Alto', bot);
    /* tocar un bloque rival lo marca */
    const pt = await p.evaluate(() => { const S = window.__bloque.S, c = S.ene.centro; return window.__bloque.proyecta(c.x, 1.2, c.z - 0); });
    await p.touchscreen.tap(pt[0], pt[1]); await p.waitForTimeout(600);
    vale('tocar el bloque rival lo marca como blanco', await p.evaluate(() => window.__bloque.tiradores.T.blanco) !== null, 'blanco ' + await p.evaluate(() => window.__bloque.tiradores.T.blanco));
    /* hostigar y esperar la primera salva en el aire */
    await p.locator('.orden[data-o="hostigar"]').click();
    let pico = 0, vio = false;
    for (let i = 0; i < 400 && !vio; i++) {
      await p.waitForTimeout(150);
      const e = await p.evaluate(() => ({ pend: window.__bloque.tiradores.pend.length, v: window.__bloque.estado().llamadas, hay: window.__bloque.tiradores.salvas.length }));
      pico = Math.max(pico, e.v || 0); if (e.pend > 0 && e.hay >= 1) { await p.waitForTimeout(700); vio = (await p.evaluate(() => window.__bloque.tiradores.pend.length)) > 0; }
    }
    vale('hay una salva en el aire', vio);
    const lla = await p.evaluate(() => window.__bloque.estado().llamadas); pico = Math.max(pico, lla);
    await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(500);
    await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/${f}.jpg`, type: 'jpeg', quality: 82 });
    const n = await p.evaluate(() => ({ tir: window.__bloque.tiradores.salvas.length, mun: window.__bloque.tiradores.T.municion, estela: !!document.querySelector('canvas') }));
    vale('el hondero tira y gasta munición', n.tir >= 1 && n.mun < 20, JSON.stringify(n));
    await p.evaluate(() => window.__bloque.congela(false));
    /* seguir hasta el choque para medir el peor momento */
    for (let i = 0; i < 120; i++) { await p.waitForTimeout(300); const e = await p.evaluate(() => ({ v: window.__bloque.estado().llamadas, ch: window.__bloque.S.tuyo.contactos.length, t: window.__bloque.S.T })); pico = Math.max(pico, e.v || 0); if (e.ch && i > 20) break; if (e.t > 120) break; }
    console.log('  llamadas de dibujo, pico:', pico);
    vale('llamadas ≤ 30', pico <= 30, String(pico));
    vale('0 errores de consola', err.length === 0, err.slice(0, 3).join(' | ')); await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `MAL (${fallos})` : 'APTO'); process.exit(fallos ? 1 : 0);
