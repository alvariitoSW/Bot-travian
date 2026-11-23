// FI1 «Físicas en las batallas»: las varas del diseño (gobierno/estudios/FI1-diseno-fisicas.md) en una carga a 844×390 dpr 1
// y luego las fotos a dpr 2 en gobierno/capturas-tarea/FI1-*.jpg. Falla si algo no cuadra o hay errores de consola
// (el 404 de rival.js no cuenta). Uso: node gobierno/maquetas/falange/captura-fi1.mjs [sinfotos] [solo=h-choque,...]
// Basado en captura-fa4.mjs (mismo servidor y misma forma de abrir).
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
const dpr = +(op.dpr || 1), prefijo = join(SALIDA, (op.pref || 'FI1') + '-'), errores = [], COSTE = [];
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
function escucha(page) {
  page.on('console', m => { if (/rival\.js/.test((m.location() || {}).url || '')) return; if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
const lista = page => page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });
const V = [390, 844], Hz = [844, 390];
async function abre(q, w, h, d = dpr) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + q); await lista(page); await page.waitForTimeout(1500); return { ctx, page };
}
const cuadro = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const SEMILLA = op.semilla || '20261123', G = 180 / Math.PI;
const solo = op.solo ? op.solo.split(',') : null;
const mide = async (q) => {
  const { ctx, page } = await abre(q + 'semilla=' + SEMILLA, 844, 390, 1);
  await page.evaluate(() => window.__tp.parar(true));
  const r = await page.evaluate(() => { const t = window.__tp, S = t.S; t.reinicia(); t.hasta(() => S.choque, 200, 'compas'); return t.fisicaJuega(60, 'compas'); });
  await ctx.close(); return r;
};
let tC = op.t || null;
if (!solo) {
  /* (ii) primero sin física: el antes (solo informa) y el instante con más puntas dentro, para las fotos de contacto */
  const sin = await mide('?fisica=0&'); console.log('(ii) sin física ' + JSON.stringify(sin));
  console.log(`  ANTES: puntas dentro ${sin.puntasTotal} (peor ${sin.puntasPeor} a los ${sin.tPeor} s) · distancia mínima ${sin.distMin} m · sobre caídos ${sin.pisados}`);
  tC = sin.tPeor;
  /* (i) con física: 60 s de lucha desde el choque */
  const con = await mide('?'); console.log('(i) con física ' + JSON.stringify(con));
  bien(con.activa && con.segundos >= 30, `lucha jugada: ${con.segundos} s (${con.muestras} muestras)`);
  bien(con.puntasTotal === 0, `puntas dentro de un cuerpo o escudo rival: ${con.puntasTotal} (peor ${con.puntasPeor}) (0)`);
  bien(con.distMin >= 0.45, `distancia mínima entre dos hombres: ${con.distMin} m (≥ 0,45)`);
  console.log(`  coste de la física: ${con.ms} ms por fotograma · vivos sobre un caído (suma de muestras): ${con.pisados}`);
  /* (iii) peso en el instante de contacto */
  const { ctx, page } = await abre('?fase=contacto&t=' + tC + '&semilla=' + SEMILLA, 844, 390, 1);
  await cuadro(page); await cuadro(page);
  const inf = await page.evaluate(() => window.__tp.info()), fm = await page.evaluate(() => window.__tp.fisica());
  console.log('(iii) ' + JSON.stringify(inf) + ' ' + JSON.stringify(fm));
  bien(inf.llamadas <= 30, `llamadas de dibujo en el contacto: ${inf.llamadas} (≤ 30)`);
  bien(inf.triangulos <= 750000, `triángulos en el contacto: ${inf.triangulos} (≤ 750 000)`);
  bien(fm.puntasDentro === 0, `en la foto del contacto, puntas dentro: ${fm.puntasDentro} (0)`);
  await ctx.close();
}
const K = 'contacto&t=' + tC;
const FOTOS = {
  'h-choque': [K, Hz], 'h-choque-antes': [K + '&fisica=0', Hz], 'v-choque': [K, V],
  'h-estocada': ['estocada', Hz], 'h-caidos': ['caidos', Hz], 'v-cerca': [K + '&lado=1&cerca=1', V], 'v-cerca-antes': [K + '&lado=1&cerca=1&fisica=0', V],
};
if (!args.includes('sinfotos')) for (const [nombre, [fase, [fw, fh]]] of Object.entries(FOTOS)) {
  if (solo && !solo.includes(nombre)) continue;
  const n0 = errores.length, t0 = Date.now();
  try {
    const { ctx, page } = await abre('?fase=' + fase + '&semilla=' + SEMILLA, fw, fh, 2);
    await cuadro(page); await cuadro(page);
    await page.screenshot({ path: prefijo + nombre + '.jpg', type: 'jpeg', quality: 80, timeout: 300000 });
    const est = await page.evaluate(() => { const S = window.__tp.S; return { T: +S.T.toFixed(1), giro: +(S.giro * 180 / Math.PI).toFixed(1), flanco: S.flanco && S.flanco.estado, filas: S.filas.map(Number).join('') }; });
    console.log(`  foto ${nombre}: ${JSON.stringify(est)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); await ctx.close();
  } catch (e) { errores.push('foto ' + nombre + ': ' + e.message.slice(0, 200)); console.log('  MAL foto ' + nombre + ': ' + e.message.slice(0, 200)); }
  if (errores.length > n0) console.log('  (errores en ' + nombre + ')');
}
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO: ' + errores.length + ' fallos' : 'APTO');
process.exit(errores.length ? 1 : 0);
