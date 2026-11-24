/* PIL3: capturas del pilum lanzado en la escena «Bajar a pie» de la batalla de mando (js/ui-mando.js).
   Uso: servir el juego (python3 -m http.server 8123) y node gobierno/maquetas/soldado-pil3/captura.mjs [url]. Deja PIL3-*.jpg en gobierno/capturas-tarea/. */
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), CAPS = join(AQUI, '..', '..', 'capturas-tarea'), url = process.argv[2] || 'http://localhost:8123/';
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
const page = await ctx.newPage(), errores = [];
page.on('console', m => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 200)));
const E = (fn, a) => page.evaluate(fn, a), espera = ms => page.waitForTimeout(ms);
const foto = async (nom, w, h) => { await page.setViewportSize({ width: w, height: h }); await espera(600); await E(() => { window.__mn.cuadro(0); }); await page.screenshot({ path: join(CAPS, 'PIL3-' + nom + '.jpg'), type: 'jpeg', quality: 80, timeout: 180000 }); console.log('foto', nom); };
try {
  await page.goto(url, { waitUntil: 'load' }); await page.waitForSelector('#menu [data-act="new"]', { timeout: 60000 });
  await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 }).catch(() => {});
  await page.click('#menu .mesc'); await espera(800); await page.click('[data-act="escempieza"]');
  await page.waitForFunction(() => window.__mn && window.__mn.lista === true, null, { timeout: 240000 });
  await E(() => window.__mn.pausa(true));
  /* la primera tropa propia que empieza a lanzar (vélites o hastati), un paso de medio segundo cada vez */
  /* hastati quietos («Aguantar») al empezar; el lanzamiento se fuerza abajo */
  /* hastati quietos («Aguantar») hasta que el enemigo más cercano está a unos 30 m; el lanzamiento se fuerza abajo */
  const ti = await E(() => { const M = window.__mn; M.pausa(false); M.salta(1); M.pausa(true); const u = M.S.man.find(u => u.lado === 0 && u.tropa === 'hastati'); M.elegir([u.id]); M.ordenar({ tipo: 'aguantar' }); M.pausa(false);
    let d = 1e9; for (let k = 0; k < 300; k++) { d = 1e9; for (const e of M.S.man) if (e.lado !== 0 && e.n > 0) d = Math.min(d, Math.hypot(e.x - u.x, e.y - u.y)); if (d < 32 || M.S.man.some(w => w.lado === 0 && w.tirando >= 0) || M.S.fase === "fin") break; M.salta(0.5); }
    M.pausa(true); return { id: u.id, tropa: u.tropa, t: M.S.t, d }; });
  console.log('lanzan', JSON.stringify(ti)); const id = ti.id; if (id < 0) throw new Error('nadie lanza');
  const no = await E(i => { window.__mn.elegir([i]); return window.__mn.bajar(i); }, id); if (no) console.log('no baja:', no);
  /* escena preparada para la foto: la tropa sigue tirando al enemigo más cercano aunque el simulador la trabe (solo en esta prueba) */
  await E(i => { const M = window.__mn, Sim = M.Sim, av = Sim.avanzar; Sim.avanzar = function (S, dt) { const r = av.apply(this, arguments); const u = S.man[i];
    let b = -1, d = 1e9; for (const e of S.man) if (e.lado !== u.lado && e.n > 0 && e.estado !== 'fuera') { const k = Math.hypot(e.x - u.x, e.y - u.y); if (k < d) { d = k; b = e.id; } } u.tirando = b; return r; }; }, id);
  await E(i => { window.__i = i; window.__mn.pausa(false); }, id);
  /* que la palanca gire al centurión hacia su propia fila: se ven los que lanzan de frente */
  let r = null;
  for (let k = 0; k < 60; k++) { r = await E(() => { const M = window.__mn; for (let j = 0; j < 3; j++) M.cuadro(0.05); return { pila: M.pila(), clips: M.tiran(window.__i), t: M.S.t, tira: M.S.man.filter(u => u.tirando >= 0).length }; }); if (k % 10 === 0) console.log(JSON.stringify(r)); if (r.pila >= 10) break; }
  console.log('en el aire', r);
  await E(() => window.__mn.pausa(true));
  await foto('a-pie-horizontal', 844, 390);
  await foto('a-pie-vertical', 390, 844);
  /* de cara a la fila que lanza: el centurión se da la vuelta (solo la cámara de la prueba) */
  await page.setViewportSize({ width: 844, height: 390 }); await espera(500);
  await E(() => { const M = window.__mn; M.girar(Math.PI * 0.85); M.pausa(false); });
  for (let k = 0; k < 30; k++) { r = await E(() => { const M = window.__mn; M.cuadro(0.05); M.girar(0); return { pila: M.pila(), clips: M.tiran(window.__i) }; }); if (k > 6 && /lanzar/.test(r.clips)) break; }
  await E(() => window.__mn.pausa(true));
  await foto('de-cara-horizontal', 844, 390);
  await foto('de-cara-vertical', 390, 844);
  /* el mando, de cerca, a la altura de los que lanzan */
  await E(() => window.__mn.pausa(false));
  await E(() => window.__mn.subir()); await espera(800);
  await E(i => { const M = window.__mn, u = M.S.man[i]; M.camara({ x: u.x, z: -u.y - 30, d: 45 }); for (let k = 0; k < 12; k++) M.cuadro(0.05); M.pausa(true); }, id);
  await foto('mando-horizontal', 844, 390);
  await foto('mando-vertical', 390, 844);
} catch (e) { console.log('FALLO', e.message); await page.screenshot({ path: join(CAPS, 'PIL3-fallo.jpg') }).catch(() => {}); }
console.log('errores de consola:', errores.length, errores.slice(0, 5));
await br.close();
