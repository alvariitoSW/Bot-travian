// FI2 «La física en el testudo a pie»: las varas del diseño (gobierno/estudios/FI2-diseno-fisica-testudo.md) en una carga a
// 844×390 dpr 1, con y sin física, y luego las fotos a dpr 2 en gobierno/capturas-tarea/FI2-*.jpg. Falla (código ≠ 0) si una
// vara no se cumple o hay errores de consola. Uso: node gobierno/maquetas/a-pie/captura-fi2.mjs [sinfotos] [solo=h-carga,...]
// Basado en gobierno/maquetas/falange/captura-fi1.mjs (mismo servidor y misma forma de abrir).
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8384 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/a-pie/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const prefijo = join(SALIDA, 'FI2-'), errores = [];
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
function escucha(page) {
  /* FU1: a-pie/ ahora lleva al bloque (testudo); estas pruebas miden la escena vieja: &antiguo=1 */
  { const ir = page.goto.bind(page); page.goto = (u, o) => ir(/a-pie\/(\?|$)/.test(u) ? u + (u.includes("?") ? "&" : "?") + "antiguo=1" : u, o); }
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
const lista = page => page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });
async function abre(q, w, h, d) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + q); await lista(page); await page.waitForTimeout(1500); return { ctx, page };
}
const cuadro = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const solo = op.solo ? op.solo.split(',') : null;

/* una carga entera, de la carrera al final de la lucha, sin dibujar (la escena va a saltos, como ?fase=) */
async function mide(q) {
  const { ctx, page } = await abre('?fase=carga' + q, 844, 390, 1);
  const r = await page.evaluate(() => { const t = window.__tp, S = t.S; t.fisicaEmpieza(); for (let i = 0; i < 1500 && S.fase !== 'fin'; i++) t.salta(0.1); return { ...t.fisica(), fin: S.fase, T: +S.T.toFixed(1), caidos: t.lucha().dibujadosCaidos }; });
  await ctx.close(); return r;
}
let tPico = op.t ? +op.t : 0.3, sin = null, con = null;
if (!solo) {
  sin = await mide('&fisica=0'); console.log('sin física ' + JSON.stringify(sin));
  con = await mide(''); console.log('con física ' + JSON.stringify(con));
  bien(con.activa && !sin.activa && con.fin === 'fin', `carga jugada hasta el final (${con.T} s, ${con.muestras} muestras)`);
  bien(con.distMin >= 0.45, `distancia mínima entre vivos dibujados (fuera de las parejas en duelo): ${con.distMin} m (antes ${sin.distMin}) (≥ 0,45; escalada a la figura, 0,51: ${con.distMin >= 0.51 ? 'sí' : 'no'})`);
  bien(con.parMin >= 0.4, `pareja en duelo: distancia mínima ${con.parMin} m (antes ${sin.parMin}) (≥ 0,4, vara de TP8)`);
  bien(con.parDif <= 0.02, `pareja en duelo: la física no cambia su distancia de las reglas más de ${con.parDif} m (≤ 0,02)`);
  bien(con.recula1 >= 0.1, `la 1.ª fila recula en la carga: ${con.recula1} m (antes ${sin.recula1}) (≥ 0,1)`);
  bien(con.recula2 >= con.recula1 / 2, `la 2.ª fila recula: ${con.recula2} m (antes ${sin.recula2}) (≥ la mitad de la 1.ª)`);
  bien(con.ms <= 1, `coste de la física: ${con.ms} ms por fotograma (≤ 1)`);
  if (con.tPico !== null) tPico = con.tPico;
}
/* las fotos a dpr 2 */
const fotos = [
  ['h-carga', '?fase=carga', 844, 390, 'choque'],
  ['h-carga-antes', '?fase=carga&fisica=0', 844, 390, 'choque'],
  ['v-lucha', '?fase=lucha', 390, 844, null],
  ['h-caidos', '?fase=lucha', 844, 390, 'caidos'],
];
const llamadas = {};
if (!args.includes('sinfotos')) for (const [nombre, q, w, h, que] of fotos) {
  if (solo && !solo.includes(nombre)) continue;
  const n0 = errores.length, t0 = Date.now();
  try {
    const { ctx, page } = await abre(q, w, h, 2);
    const est = await page.evaluate(([que, tp]) => { const t = window.__tp, S = t.S;
      if (que === 'choque') { for (let i = 0; i < 900 && !S.choque; i++) t.salta(1 / 30); t.salta(tp); }
      if (que === 'caidos') for (let i = 0; i < 60 && t.lucha().dibujadosCaidos < 6; i++) t.salta(0.5);   /* caídos de la lucha, no de los pila */
      return { T: +S.T.toFixed(2), choque: S.choque, fase: S.fase, romanosCaidos: t.lucha().dibujadosCaidos, galosCaidos: S.galos.filter(g => !g.vivo && !g.reserva).length }; }, [que, tPico]);
    await cuadro(page); await cuadro(page);
    llamadas[nombre] = await page.evaluate(() => window.__tp.renderer.info.render.calls);
    await page.screenshot({ path: prefijo + nombre + '.jpg', type: 'jpeg', quality: 80, timeout: 300000 });
    console.log(`  foto ${nombre}: ${JSON.stringify(est)}, ${llamadas[nombre]} llamadas (${((Date.now() - t0) / 1000).toFixed(0)} s)`); await ctx.close();
  } catch (e) { errores.push('foto ' + nombre + ': ' + e.message.slice(0, 200)); console.log('  MAL foto ' + nombre + ': ' + e.message.slice(0, 200)); }
  if (errores.length > n0) console.log('  (errores en ' + nombre + ')');
}
if (llamadas['h-carga'] !== undefined && llamadas['h-carga-antes'] !== undefined) bien(llamadas['h-carga'] <= llamadas['h-carga-antes'], `sin llamadas de dibujo nuevas: ${llamadas['h-carga']} con física, ${llamadas['h-carga-antes']} sin ella`);
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO: ' + errores.length + ' fallos' : 'APTO');
process.exit(errores.length ? 1 : 0);
