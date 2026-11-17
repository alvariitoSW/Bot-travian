// Maqueta GM4c — «antes y después» acumulando: antes -> +figuras -> +figuras+campo -> todo. Mismo instante y misma cámara en todas.
// Uso:  node gobierno/maquetas/guerra-arte/comparar.mjs                    -> capturas GM4c-* (844x390, dpr 2) y medidas con 10 000 por bando
//       node gobierno/maquetas/guerra-arte/comparar.mjs solo=capturas       -> sin medidas;  solo=medidas -> sin capturas
//       node gobierno/maquetas/guerra-arte/comparar.mjs dpr=1 estados=antes,todo prefijo=/ruta/p-
// Estados: antes = ?arte=antes (el GM4 tal cual); figuras = ?sin=campo,color; campo = ?sin=color; todo = sin nada apagado.
// La fluidez de aquí es con render por software: sirve para comparar un estado con otro, no como dato de un móvil.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8379 : 0, '127.0.0.1', () => ok(s)); });
const BASE = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/', URL0 = BASE + 'guerra-arte/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GM4c-'), errores = [], tabla = [];
const espera = (p, ms) => p.waitForTimeout(ms);
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
async function abrir(url, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  const t0 = Date.now(); await page.goto(url); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 300000 });
  return { ctx, page, carga: (Date.now() - t0) / 1000 };
}
/* milisegundos por imagen, con la batalla en marcha (60 imágenes seguidas) */
const ritmo = page => page.evaluate(() => new Promise(ok => { let k = 0, t0 = 0; const f = t => { if (!t0) t0 = t; if (++k > 60) ok((t - t0) / 60); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));

const ESTADOS = { antes: '?arte=antes', figuras: '?sin=campo,color', campo: '?sin=color', todo: '' }, orden = { antes: 0, figuras: 1, campo: 2, todo: 3 };
const lista = (op.estados || 'antes,figuras,campo,todo').split(','), medidas = [];
async function escena(est, hombres, w, h, fotos, midiendo) {
  const q = ESTADOS[est], url = URL0 + (q ? q + '&' : '?') + 'semilla=4242&hombres=' + hombres, { page, ctx } = await abrir(url, w, h);
  const g = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]), pulsa = async sel => { await page.tap(sel); await espera(page, 250); };
  const foto = async n => { await espera(page, 1500); await g('mirar', -1, 0); await espera(page, 600); await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 82, timeout: 240000 }); return g('estado'); };
  const nom = orden[est] + '-' + est, vert = h > w;
  await g('pausa', true); await g('salta', 3); await g('salta', 6); await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="empujar"]'); await g('salta', 5);
  let lejos, cerca; const fila = { est, hombres };
  if (fotos) lejos = await foto(nom + (vert ? '-vertical' : '-lejos')); else { await g('mirar', -1, 0); await espera(page, 1500); lejos = await g('estado'); }
  if (midiendo) { await g('pausa', false); fila.msLejos = await ritmo(page); await g('pausa', true); const e = await g('estado'); fila.triLejos = e.tri; fila.llamLejos = e.llamadas; fila.mb = e.cartonesMB; }
  if (!vert) {
    await pulsa('#ojo'); await g('pausa', false); await espera(page, 2500); if (midiendo) fila.msCerca = await ritmo(page); await g('pausa', true);
    if (fotos) cerca = await foto(nom + '-cerca'); else { await g('mirar', -1, 0); await espera(page, 1500); cerca = await g('estado'); }
    if (midiendo) { fila.triCerca = cerca.tri; fila.llamCerca = cerca.llamadas; fila.figs = cerca.figs; }
    if (fotos && (est === 'antes' || est === 'todo')) {          // primer plano de dos o tres soldados: la cámara baja a pie de fila
      const c = await g('camara'); await page.evaluate(c => { window.__camLibre = { ...c, d: 5.5, p: 0.2, y: 1.3 }; }, c); await g('pausa', false); await espera(page, 1800); await g('pausa', true);
      await foto('primer-plano-' + (est === 'antes' ? 'antes' : 'despues'));
    }
  }
  if (midiendo) medidas.push(fila); await ctx.close();
}
const cuales = op.solo || 'todo';
if (cuales === 'vertical') await escena('todo', 5000, 390, 844, true, false); else if (cuales !== 'medidas') { for (const e of lista) await escena(e, 5000, 844, 390, true, false); if (lista.includes('todo')) await escena('todo', 5000, 390, 844, true, false); }
if (cuales !== 'capturas') for (const e of lista.filter(e => e === 'antes' || e === 'todo')) await escena(e, 10000, 844, 390, false, true);
if (medidas.length) { console.log('\nMEDIDAS con 10 000 por bando, 844x390 (render por software: valen para comparar entre sí)\nestado | de lejos: triángulos · llamadas · ms/imagen | de cerca: figuras · triángulos · llamadas · ms/imagen | cartones MB');
  for (const m of medidas) console.log(`${m.est.padEnd(7)}| ${m.triLejos} · ${m.llamLejos} · ${m.msLejos.toFixed(0)} | ${m.figs} · ${m.triCerca} · ${m.llamCerca} · ${m.msCerca.toFixed(0)} | ${m.mb}`);
  const a = medidas.find(m => m.est === 'antes'), t = medidas.find(m => m.est === 'todo'); if (a && t) console.log(`coste de «todo» frente a «antes»: de lejos ${((t.msLejos / a.msLejos - 1) * 100).toFixed(0)} % · de cerca ${((t.msCerca / a.msCerca - 1) * 100).toFixed(0)} %`); }
console.log(errores.length ? 'NO APTO · ' + errores.length + ' fallos:\n' + errores.join('\n') : 'APTO · sin errores de consola');
await br.close(); srv.close(); process.exit(errores.length ? 1 : 0);
