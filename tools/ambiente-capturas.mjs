/* E5 «Ambiente de la ciudad»: capturas de la ciudad 3D con Ambiente encendido y apagado en las cuatro estaciones, una con un edificio
   elegido (contorno dorado) y el tiempo medio por fotograma de cada modo.
   Uso: node tools/ambiente-capturas.mjs [frames=60]
   Deja gobierno/capturas-tarea/E5-<estacion>-<on|off>.jpg, E5-contorno.jpg e imprime los ms por fotograma (encendido, apagado, % de diferencia).
   Servidor: python3 -m http.server en un puerto libre. Navegador: Chromium por software a 390×844 (necesita Playwright, como gobierno/captura-*.mjs). */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const FRAMES = +(process.argv[2] || 60) || 60;
const puertoLibre = () => new Promise(ok => { const s = createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
const puerto = await puertoLibre();
const srv = spawn('python3', ['-m', 'http.server', String(puerto), '--bind', '127.0.0.1'], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [];
page.on('console', m => { if ((m.type() === 'error' || (m.type() === 'warning' && /ambiente|efectos/i.test(m.text()))) && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
let codigo = 0;
try {
  await page.goto('http://127.0.0.1:' + puerto + '/', { waitUntil: 'load' });
  await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
  await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
  await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
  const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
  await cierra();
  await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = 'roma'; UI.city = 'roma'; document.body.appendChild(b); b.click(); b.remove(); });
  await page.waitForTimeout(12000); await cierra();      // los modelos tardan ~10 s
  await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
  await page.evaluate(() => { Game.state.speed = 0; const a = Game.state.ajustes; if (a) a.asesor = false; });
  const ponerFecha = (mes, frac) => page.evaluate(([m, f]) => { Game.state.speed = 0; Game.state.t = 24 + (m - 1) + f; }, [mes, frac]);      // enero = invierno; 3 meses por estación
  const ambiente = async on => { const r = await page.evaluate(v => Game.ponerAjustes({ ambiente: v }), on); if (!r.ok) throw new Error('no se pudo poner el ambiente: ' + r.motivo); await page.waitForTimeout(900); };
  const foto = async nombre => { await page.waitForTimeout(900); await page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea/E5-' + nombre + '.jpg'), type: 'jpeg', quality: 85 }); console.log('captura E5-' + nombre + '.jpg'); };
  const ESTACIONES = [['primavera', 5], ['verano', 8], ['otono', 11], ['invierno', 2]];      // mitad de cada estación: luz y tono puros
  for (const [nom, mes] of ESTACIONES) {
    await ponerFecha(mes, 0.5); await page.waitForTimeout(1200);
    for (const on of [true, false]) { await ambiente(on); await foto(nom + '-' + (on ? 'on' : 'off')); }
  }
  /* contorno: se elige el foro (el edificio que siempre hay) con Ambiente encendido */
  await ponerFecha(8, 0.5); await ambiente(true);
  await page.evaluate(() => { UI.bsel = 'foro'; }); await page.waitForTimeout(3500); await foto('contorno');
  await page.evaluate(() => { UI.bsel = null; }); await page.waitForTimeout(800);
  /* neutralidad: con tono y viñeta a cero la imagen con composer debe ser casi igual que sin él (media de la diferencia por canal, 0 a 255) */
  const dif = await page.evaluate(async () => {
    const V = UI.cityV, id = UI.city, c = Game.state.cities[id], cv = V.r.domElement, w = cv.width, h = cv.height, k = document.createElement('canvas'); k.width = w; k.height = h; const g = k.getContext('2d', { willReadFrequently: true });
    const toma = on => { Game.ponerAjustes({ ambiente: on }); V.update(c, id, null, performance.now() / 1000); V.update(c, id, null, performance.now() / 1000); g.drawImage(cv, 0, 0); return g.getImageData(0, 0, w, h).data; };
    V.ambienteNeutro(true); toma(true); const a = toma(true), b = toma(false); V.ambienteNeutro(false);
    let s = 0, n = 0, lA = 0, lB = 0; for (let i = 0; i < a.length; i += 4) { for (let q = 0; q < 3; q++) { s += Math.abs(a[i + q] - b[i + q]); n++; } lA += a[i] + a[i + 1] + a[i + 2]; lB += b[i] + b[i + 1] + b[i + 2]; }
    return { media: s / n, brilloOn: lA / (n), brilloOff: lB / n };
  });
  console.log('neutro con composer vs directo: diferencia media ' + dif.media.toFixed(2) + ' / 255; brillo medio ' + dif.brilloOn.toFixed(1) + ' vs ' + dif.brilloOff.toFixed(1));
  /* tiempo por fotograma: update() seguido de una lectura de un píxel (obliga a terminar el dibujo) (para contar también el trabajo de la tarjeta), tras calentar */
  const medir = on => page.evaluate(async ([v, n]) => {
    Game.ponerAjustes({ ambiente: v }); const V = UI.cityV, gl = V.r.getContext(), id = UI.city, c = Game.state.cities[id], px = new Uint8Array(4);
    for (let i = 0; i < 8; i++) { V.update(c, id, null, performance.now() / 1000); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
    const t0 = performance.now(); for (let i = 0; i < n; i++) { V.update(c, id, null, performance.now() / 1000); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } return (performance.now() - t0) / n;
  }, [on, FRAMES]);
  const res = { on: [], off: [] };
  for (let r = 0; r < 3; r++) { res.off.push(await medir(false)); res.on.push(await medir(true)); }      // tres rondas alternadas; se toma la mediana
  const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const on = med(res.on), off = med(res.off);
  console.log('ms por fotograma (mediana de 3 rondas de ' + FRAMES + '): Ambiente encendido ' + on.toFixed(1) + ' · apagado ' + off.toFixed(1) + ' · diferencia ' + ((on - off) / off * 100).toFixed(1) + ' %');
  console.log('rondas encendido: ' + res.on.map(x => x.toFixed(1)).join(', ') + ' · apagado: ' + res.off.map(x => x.toFixed(1)).join(', '));
} catch (e) { console.log('FALLO: ' + (e.stack || e)); codigo = 1; }
console.log(errores.length ? 'ERRORES DE CONSOLA:\n - ' + errores.join('\n - ') : 'Sin errores de consola.');
if (errores.length) codigo = 1;
await br.close(); srv.kill();
process.exit(codigo);
