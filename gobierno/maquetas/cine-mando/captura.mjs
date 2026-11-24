/* CG8a: capturas y medidas de la batalla grande de manípulos (js/ui-mando.js): plano de apertura y choque, en horizontal y vertical.
   Uso: servir el juego (python3 -m http.server 8123) y node gobierno/maquetas/cine-mando/captura.mjs <prefijo> [url].
   Deja CG8a-<prefijo>-*.jpg en gobierno/capturas-tarea/ y escribe las medidas (llamadas, triángulos, ms por cuadro). */
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), CAPS = join(AQUI, '..', '..', 'capturas-tarea'), pre = process.argv[2] || 'x', url = process.argv[3] || 'http://localhost:8123/';
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
const page = await ctx.newPage(), errores = [];
page.on('console', m => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 200)));
const E = (fn, a) => page.evaluate(fn, a), espera = ms => page.waitForTimeout(ms);
const foto = async nom => { await E(() => window.__mn.cuadro(0)); await page.screenshot({ path: join(CAPS, 'CG8a-' + pre + '-' + nom + '.jpg'), type: 'jpeg', quality: 80, timeout: 60000 }); };
/* ms por cuadro: n cuadros de 0,05 s seguidos, con la pintura forzada (gl.finish por readPixels de 1 px) */
const mide = async n => E(n => { const M = window.__mn, cv = document.querySelector('#mn-lienzo'), gl = cv.getContext('webgl2') || cv.getContext('webgl'), px = new Uint8Array(4);
  M.cuadro(0.05); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const t0 = performance.now();
  for (let k = 0; k < n; k++) { M.cuadro(0.05); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
  const e = M.estado(); return { ms: Math.round((performance.now() - t0) / n), llamadas: e.llamadas, tri: e.tri, figuras: e.figuras, caidas: e.caidas, t: Math.round(e.t) }; }, n);
const medidas = {};
try {
  await page.goto(url, { waitUntil: 'load' }); await page.waitForSelector('#menu [data-act="new"]', { timeout: 60000 });
  await page.click('#menu .mesc'); await espera(800); await page.click('[data-act="escempieza"]');
  await page.waitForFunction(() => window.__mn && window.__mn.lista === true, null, { timeout: 240000 });
  for (const [w, h, k] of [[844, 390, 'h'], [390, 844, 'v']]) {
    await page.setViewportSize({ width: w, height: h }); await espera(300);
    medidas['cine-' + k] = await E(() => window.__mn.cine(1));
    await E(() => window.__mn.pausa(true)); await foto('apertura-' + k);
    await E(() => window.__mn.cine(4.2)); await foto('bajada-' + k);
    await E(() => window.__mn.cine(true)); await page.waitForFunction(() => window.__mn.cine() !== 'apertura', null, { timeout: 60000 }).catch(() => {});
    if (k === 'h') medidas.apertura = await mide(12);
    await foto('mando-' + k);
  }
  /* al choque: todos cargan y se corre hasta que hay contacto */
  await page.setViewportSize({ width: 844, height: 390 }); await espera(400);
  const ch = await E(() => { const M = window.__mn; M.pausa(false); M.elegir(M.S.man.filter(u => u.lado === 0).map(u => u.id)); M.ordenar({ tipo: 'cargar' }); M.elegir([]);
    for (let k = 0; k < 400; k++) { M.salta(0.5); if (M.S.cont && Object.values(M.S.cont).some(c => c && c.length) || M.S.fase === 'fin') break; }
    M.salta(4); return M.S.t; });
  console.log('choque en t =', Math.round(ch));
  await E(() => { for (let i = 0; i < 30; i++) window.__mn.cuadro(0.05); });
  medidas.choque = await mide(12);
  await E(() => window.__mn.pausa(true)); await foto('choque-h');
  await page.setViewportSize({ width: 390, height: 844 }); await espera(600); await E(() => { const M = window.__mn; M.pausa(false); for (let i = 0; i < 6; i++) M.cuadro(0.05); M.pausa(true); }); await foto('choque-v');
  /* más tarde: caídos en el suelo, de cerca */
  await page.setViewportSize({ width: 844, height: 390 }); await espera(400);
  await E(() => { const M = window.__mn; M.pausa(false); M.salta(25); for (let i = 0; i < 40; i++) M.cuadro(0.05); M.pausa(true); });
  medidas.despues = await E(() => { const e = window.__mn.estado(); return { caidas: e.caidas, figuras: e.figuras, t: Math.round(e.t) }; });
  await foto('despues-h');
  /* de cerca: caídos y la caballería (¿se ve negra?) */
  await E(() => { const M = window.__mn, i = Object.keys(M.S.cont || {}).find(i => M.S.cont[i] && M.S.cont[i].length) || 0, u = M.S.man[i]; M.camara({ x: u.x, z: -u.y + 20, d: 70 }); M.cuadro(0); });
  await foto('cerca-h');
  await E(() => { const M = window.__mn, u = M.S.man.find(u => /equites|jinetes|numidas|tesalios/.test(u.tropa) && u.n > 0) || M.S.man[0]; M.camara({ x: u.x, z: -u.y + 15, d: 55 }); M.cuadro(0); });
  await foto('caballos-h');
} catch (e) { console.log('FALLO', e.message); await page.screenshot({ path: join(CAPS, 'CG8a-' + pre + '-fallo.jpg') }).catch(() => {}); }
console.log('MEDIDAS', JSON.stringify(medidas));
console.log('errores de consola:', errores.length, errores.slice(0, 5));
await br.close();
