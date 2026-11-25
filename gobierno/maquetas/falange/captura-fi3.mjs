// FI3 «Pilum que rebotan o se clavan»: las fotos de la falange (gobierno/capturas-tarea/FI3-fal-*.jpg, dpr 2).
// La salva de 24 pila (bot «compas», semilla 20261123) se juega a saltos y sin dibujar con __tp.proyectilesJuega (la física
// de los pila va en cada paso) hasta el instante de la foto; luego se dibujan dos cuadros. ?fisica=0 = el antes, mismo instante.
// Uso: node gobierno/maquetas/falange/captura-fi3.mjs [solo=fal-h-salva,...] [tsalva=19.2] [tsuelo=20.6]
// Basado en captura-fi1.mjs y mide-fi3.mjs (mismo servidor y misma forma de abrir).
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/falange/';
const { chromium } = createRequire(join(RAIZ, "x.js"))('playwright');
const br = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
await mkdir(SALIDA, { recursive: true });
const errores = [], V = [390, 844], Hz = [844, 390];
function escucha(page) {
  page.on("console", m => { if (/rival\.js/.test((m.location() || {}).url || "") || /404/.test(m.text())) return; if ((m.type() === "error" || m.type() === "warning") && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log("  [" + m.type() + "] " + m.text().slice(0, 300)); } });
  page.on("pageerror", e => { errores.push(e.message); console.log("  [error de página] " + e.message.slice(0, 400)); });
}
const cuadro = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
async function abre(q, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + q + (q.includes('?') ? '&' : '?') + 'antiguo=1'); await page.waitForFunction("window.__tp && window.__tp.lista === true", null, { timeout: 300000 }); await page.waitForTimeout(1500); return { ctx, page };
}
const solo = op.solo ? op.solo.split(",") : null;
const TS = +(op.tsalva || 19.2), TT = +(op.tsuelo || 20.6), Q0 = 'semilla=20261123';
const FOTOS = {
  /* ?cam=d,y,cabeceo,giro,abertura (camara.js): d < 0 y giro π, delante del muro mirando a los tuyos, donde caen los pila */
  'fal-h-salva': ['?cam=-9,2.4,-0.14,3.1416,50&' + Q0, Hz, TS], 'fal-h-salva-antes': ['?cam=-9,2.4,-0.14,3.1416,50&fisica=0&' + Q0, Hz, TS],
  'fal-v-clavados': ['?cam=-7,2.4,-0.3,3.1416,62&' + Q0, V, TT], 'fal-h-cerca': ['?cam=-5.5,0.7,-0.03,3.1416,40&' + Q0, Hz, TT],
};
for (const [nombre, [q, [w, h], t]] of Object.entries(FOTOS)) {
  if (solo && !solo.includes(nombre)) continue;
  const n0 = errores.length, t0 = Date.now();
  try {
    const { ctx, page } = await abre(q, w, h);
    const r = await page.evaluate(n => { const tp = window.__tp, S = tp.S; tp.parar(true); tp.reinicia(); const m = tp.proyectilesJuega(n, 'compas'); return { T: +S.T.toFixed(2), choque: S.choque, modos: m.modos, reglas: m.reglas }; }, t);
    await cuadro(page); await cuadro(page);
    await page.screenshot({ path: join(SALIDA, 'FI3-' + nombre + '.jpg'), type: 'jpeg', quality: 80, timeout: 300000 });
    console.log(`  foto ${nombre}: ${JSON.stringify(r)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); await ctx.close();
  } catch (e) { errores.push('foto ' + nombre + ': ' + e.message.slice(0, 200)); console.log('  MAL foto ' + nombre + ': ' + e.message.slice(0, 200)); }
  if (errores.length > n0) console.log('  (errores en ' + nombre + ')');
}
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO: ' + errores.length + ' fallos' : 'APTO');
process.exit(errores.length ? 1 : 0);
