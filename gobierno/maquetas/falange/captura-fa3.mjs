// FA3 «Dedos y pantalla limpia» de la falange: mide los gestos con toque emulado y deja las fotos en
// gobierno/capturas-tarea/FA3-*.jpg. Falla si algo no cuadra o hay errores de consola. Base: captura.mjs.
// Uso:  node gobierno/maquetas/falange/captura-fa3.mjs                       -> todo (dpr 2)
//       node gobierno/maquetas/falange/captura-fa3.mjs dpr=1 parte=medidas   -> solo las ocho medidas
//       node gobierno/maquetas/falange/captura-fa3.mjs solo=h-marcha,v-choque -> solo esas fotos
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8384 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/falange/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = join(SALIDA, (op.pref || 'FA3') + '-'), errores = [], COSTE = [];
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
function escucha(page) {
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
const lista = page => page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });
const V = [390, 844], Hz = [844, 390];
async function abre(q, w, h, d = dpr) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + q + (q.includes('?') ? '&' : '?') + 'antiguo=1'); await lista(page); await page.waitForTimeout(1500); return { ctx, page };
}
/* el toque, con marcas de tiempo propias: el navegador va a ~0,4 fps y no se puede esperar tiempo real */
async function dedo(page) {
  const cdp = await page.context().newCDPSession(page); let ts = Date.now() / 1000;
  const ev = (type, pts, dt = 0.03) => { ts += dt; return cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y, id: 1 })), timestamp: ts }); };
  return {
    toca: async (x, y) => { await ev('touchStart', [[x, y]]); await ev('touchEnd', [], 0.06); },
    baja: (x, y) => ev('touchStart', [[x, y]]), mueve: (x, y, dt = 0.05) => ev('touchMove', [[x, y]], dt), suelta: () => ev('touchEnd', [], 0.05),
  };
}
const cuadro = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const caja = (page, sel) => page.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height, l: b.left, r: b.right, t: b.top, b: b.bottom }; }, sel);
/* qué botones se ven y si caben */
const visibles = page => page.evaluate(() => [...document.querySelectorAll('button,.boton,.raya')].filter(b => b.offsetParent && getComputedStyle(b).visibility !== 'hidden').map(b => { const r = b.getBoundingClientRect(); return { id: b.id || b.dataset.o || ('raya' + b.dataset.i), boton: b.classList.contains('boton'), raya: b.classList.contains('raya'), l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; }));
const PERMITIDOS = ['salir', 'estandarte', 'aguantar', 'empujad', 'cerrar', 'retroceder', 'otra'];
async function limpia(page, nombre, w, h) {
  const v = await visibles(page), bot = v.filter(c => !c.raya);
  bien(!v.some(c => c.boton) && bot.every(c => PERMITIDOS.includes(c.id)), `${nombre}: ningún .boton; solo se ven ${bot.map(c => c.id).join(', ') || 'ninguno'}`);
  bien(v.every(c => c.l >= 0 && c.r <= w + 0.5 && c.t >= 0 && c.b <= h + 0.5 && (c.raya ? c.w >= 44 && c.h >= 36 : c.w >= 44 && c.h >= 44)), `${nombre}: toques ≥ 44 px (rayas ≥ 44×36) y dentro de pantalla (${v.map(c => `${c.id} ${Math.round(c.w)}×${Math.round(c.h)}`).join(', ')})`);
}
async function medidas() {
  const [w, h] = Hz, { ctx, page } = await abre('', w, h, 1), D = await dedo(page);
  const S = f => page.evaluate(f);
  await S(() => window.__tp.parar(true));
  await limpia(page, 'marcha', w, h);
  /* 2. tocar a la derecha antes del choque echa a andar */
  await D.toca(w * 0.75, h * 0.7); await page.waitForTimeout(300);
  bien(await S(() => window.__tp.S.andando), 'toque a la derecha antes del choque: la falange echa a andar');
  /* al choque, a un momento libre y justo en el latido */
  await S(() => { const t = window.__tp, s = t.S; for (let i = 0; i < 2400 && !(s.choque && s.T - s.tChoque > 6 && !s.colado && !s.flanco && s.orden !== 'aguantar'); i++) t.salta(0.1, true);
    for (let i = 0; i < 120 && !t.lee().enCompas; i++) t.salta(1 / 30, false); s.pulsoUsado = -99; s.tGolpe = -9; });
  await limpia(page, 'choque', w, h);
  let g0 = await S(() => ({ ...window.__tp.S.golpes }));
  await D.toca(w * 0.75, h * 0.7); await page.waitForTimeout(300);
  let g1 = await S(() => ({ ...window.__tp.S.golpes }));
  bien(g1.buenos === g0.buenos + 1, `toque en el latido: golpes al compás ${g0.buenos} → ${g1.buenos}`);
  await S(() => { const t = window.__tp; t.saltaDedos(0.8); t.S.tGolpe = -9; });
  await D.toca(w * 0.75, h * 0.7); await page.waitForTimeout(300);
  const g2 = await S(() => ({ ...window.__tp.S.golpes }));
  bien(g2.parados === g1.parados + 1, `toque fuera del latido: a destiempo ${g1.parados} → ${g2.parados}`);
  /* 3. deslizar hacia arriba: estocada propia, sin golpe */
  const e0 = await S(() => window.__tp.lee().estocadas);
  await D.baja(w * 0.75, h * 0.75); await D.mueve(w * 0.75, h * 0.75 - 25); await D.mueve(w * 0.75, h * 0.75 - 60); await D.suelta(); await page.waitForTimeout(300);
  const e1 = await S(() => window.__tp.lee().estocadas), g3 = await S(() => ({ ...window.__tp.S.golpes }));
  bien(e1 === e0 + 1 && g3.buenos === g2.buenos && g3.parados === g2.parados, `deslizar arriba: estocadas ${e0} → ${e1}; golpes sin cambiar`);
  /* 4. arrastrar 1 s a la derecha: ~8° de giro */
  await D.baja(w * 0.7, h * 0.7); await D.mueve(w * 0.7 + 20, h * 0.7); await D.mueve(w * 0.7 + 50, h * 0.7); await cuadro(page); /* pointermove va con los fotogramas */
  const gi = await S(() => { const t = window.__tp, a = t.lee().giro; t.saltaDedos(1); return { a, b: t.lee().giro, girando: t.lee().girando }; });
  await D.suelta(); await page.waitForTimeout(200);
  bien(Math.abs(gi.b - gi.a - 8) <= 3, `arrastrar 1 s a la derecha: giro ${gi.a}° → ${gi.b}° (≈ 8 ± 3)`);
  /* con flanco por un lado: arrastrar hacia él pone «aguantar» */
  const fl = await S(() => { const t = window.__tp, s = t.S; for (let i = 0; i < 1200 && !(s.flanco && !s.flanco.hecho) && !s.ganador; i++) t.salta(0.1, true); if (s.orden === 'aguantar') s.orden = null; return s.flanco ? s.flanco.lado : 0; });
  if (fl) {
    await limpia(page, 'flanco', w, h);
    await D.baja(w * 0.75, h * 0.7); await D.mueve(w * 0.75 + fl * 40, h * 0.7); await D.mueve(w * 0.75 + fl * 60, h * 0.7); await D.suelta(); await page.waitForTimeout(300);
    const o = await S(() => window.__tp.S.orden);
    bien(o === 'aguantar', `arrastrar hacia el flanco (${fl > 0 ? 'derecha' : 'izquierda'}): orden «${o}»`);
  } else bien(false, 'no llegó ningún flanco para medir');
  /* 5. rayas: tocar la 3 cambia S.filas[2]; pasar por las cinco cambia las picas */
  await S(() => { const s = window.__tp.S; if (s.ganador) return; s.orden = null; });
  await cuadro(page);
  const r3 = await caja(page, '.raya[data-i="2"]'), f0 = await S(() => window.__tp.lee().filas[2]);
  await D.toca(r3.x, r3.y); await page.waitForTimeout(300);
  const f1 = await S(() => window.__tp.lee().filas[2]);
  bien(f1 !== f0, `tocar la raya 3: fila 3 ${f0 ? 'bajada' : 'alzada'} → ${f1 ? 'bajada' : 'alzada'}`);
  const p0 = await S(() => window.__tp.S.picas), R = [];
  for (let i = 0; i < 5; i++) R.push(await caja(page, `.raya[data-i="${i}"]`));
  await D.baja(R[0].x, R[0].y); for (let i = 1; i < 5; i++) await D.mueve(R[i].x, R[i].y); await D.suelta(); await page.waitForTimeout(300);
  const p1 = await S(() => ({ picas: window.__tp.S.picas, filas: window.__tp.lee().filas }));
  bien(p1.picas !== p0 && p1.filas.every(x => x === p1.picas), `pasar el dedo por las cinco rayas: picas ${p0 ? 'abajo' : 'alzadas'} → ${p1.picas ? 'abajo' : 'alzadas'} (${p1.filas.map(x => x ? 'B' : 'a').join('')})`);
  /* 6. estandarte → abanico → «Empujad» */
  await S(() => { const s = window.__tp.S; s.orden = null; s.coh = Math.max(s.coh, 80); s.flanco = null; });
  const es = await caja(page, '#estandarte');
  await D.toca(es.x, es.y); await page.waitForTimeout(400);
  const ab = await S(() => window.__tp.abanico());
  bien(ab, 'tocar el estandarte abre el abanico');
  if (ab) {
    await limpia(page, 'abanico abierto', w, h);
    const em = await caja(page, '#abanico [data-o="empujad"]');
    await D.toca(em.x, em.y); await page.waitForTimeout(400);
    const r = await S(() => ({ o: window.__tp.S.orden, ab: window.__tp.abanico() }));
    bien(r.o === 'empujar' && !r.ab, `«Empujad» en el abanico: orden «${r.o}», abanico ${r.ab ? 'abierto' : 'cerrado'}`);
  }
  /* 7. la partida entera solo con los dedos */
  const pd = await S(() => window.__tp.partidaDedos());
  console.log('  partida con los dedos: ' + JSON.stringify(pd));
  bien(pd.fin && pd.ganador === 'falange', `partida entera solo por el puente: gana ${pd.ganador} a los ${pd.tRoto} s (golpes ${pd.golpes.buenos} al compás, ${pd.golpes.parados} a destiempo)`);
  await ctx.close();
  /* 8. en vertical: el abanico cabe y no hay botones de golpe */
  const v = await abre('?fase=choque', ...V, 1);
  await v.page.evaluate(() => document.getElementById('estandarte').click());
  await limpia(v.page, 'vertical con abanico', ...V);
  await v.ctx.close();
}
async function foto(nombre, q, w, h, prep) {
  const { ctx, page } = await abre(q, w, h);
  if (prep) await prep(page);
  await cuadro(page);
  await limpia(page, nombre, w, h);
  await page.screenshot({ path: prefijo + nombre + '.jpg', type: 'jpeg', quality: 84, timeout: 240000 });
  const e = await page.evaluate(() => ({ obj: document.getElementById('objetivo').textContent, cinta: document.getElementById('cinta').textContent, lee: window.__tp.lee() }));
  console.log(`  foto ${nombre}: «${e.obj}» · ${JSON.stringify(e.lee)}`);
  await ctx.close(); return e;
}
const FOTOS = {
  'h-marcha': () => foto('h-marcha', '?fase=marcha', ...Hz),
  'h-choque': () => foto('h-choque', '?fase=compas', ...Hz),
  'h-abanico': () => foto('h-abanico', '?fase=choque', ...Hz, p => p.evaluate(() => document.getElementById('estandarte').click())),
  'h-flanco': () => foto('h-flanco', '?fase=flanco', ...Hz),
  'h-giro': () => foto('h-giro', '?fase=choque', ...Hz, async p => { const D = await dedo(p); await D.baja(600, 280); await D.mueve(630, 280); await D.mueve(680, 280); await cuadro(p); await p.evaluate(() => window.__tp.saltaDedos(1.6)); }),
  'h-filas': () => foto('h-filas', '?fase=choque', ...Hz, p => p.evaluate(() => { const P = window.__tp.puente; for (let i = 0; i < 5; i++) P.fila(i, i >= 2); })),
  'v-choque': () => foto('v-choque', '?fase=choque', ...V),
};
if (op.parte === 'medidas' || !op.solo) await medidas();
if (op.parte !== 'medidas') for (const k of op.solo ? op.solo.split(',') : Object.keys(FOTOS)) { if (FOTOS[k]) await FOTOS[k](); else bien(false, 'foto desconocida: ' + k); }
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO\n' + errores.join('\n') : 'APTO');
process.exit(errores.length ? 1 : 0);
