// FI3 «Pilum que rebotan o se clavan»: las fotos del testudo a pie (gobierno/capturas-tarea/FI3-tes-*.jpg, dpr 2).
// Cada foto abre una ?fase= (testudo o impacto) y sigue a saltos sin dibujar (la física de los proyectiles va en cada paso)
// hasta el instante; luego dos cuadros. ?fisica=0 = el antes, mismo instante.
// Uso: node gobierno/maquetas/a-pie/captura-fi3.mjs [solo=tes-h-venablos,...] [tven=2.2] [tpila=0] [tsuelo=0]
// Basado en captura-fi2.mjs y mide-fi3.mjs (mismo servidor y misma forma de abrir).
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/a-pie/';
const { chromium } = createRequire(join(RAIZ, "x.js"))('playwright');
const br = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
await mkdir(SALIDA, { recursive: true });
const errores = [], V = [390, 844], Hz = [844, 390];
function escucha(page) {
  /* FU1: a-pie/ ahora lleva al bloque (testudo); estas pruebas miden la escena vieja: &antiguo=1 */
  { const ir = page.goto.bind(page); page.goto = (u, o) => ir(/a-pie\/(\?|$)/.test(u) ? u + (u.includes("?") ? "&" : "?") + "antiguo=1" : u, o); }
  page.on("console", m => { if (/rival\.js/.test((m.location() || {}).url || "") || /404/.test(m.text())) return; if ((m.type() === "error" || m.type() === "warning") && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log("  [" + m.type() + "] " + m.text().slice(0, 300)); } });
  page.on("pageerror", e => { errores.push(e.message); console.log("  [error de página] " + e.message.slice(0, 400)); });
}
const cuadro = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
async function abre(q, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + q); await page.waitForFunction("window.__tp && window.__tp.lista === true", null, { timeout: 300000 }); await page.waitForTimeout(1500); return { ctx, page };
}
const solo = op.solo ? op.solo.split(",") : null;
const TV = +(op.tven || 2.2), TP = +(op.tpila || 0), TT = +(op.tsuelo || 0);
/* [consulta, pantalla, venablos (lanza la descarga y sigue esos segundos) o null, segundos de más] */
const FOTOS = {
  /* ?vista=fuera: delante y a la izquierda del testudo (se ven el muro y el techo); ?camm=…,abertura cierra el plano sobre los galos; ?costado=g, a ras junto a los galos */
  'tes-h-venablos': ['?fase=testudo&vista=fuera', Hz, TV, 0], 'tes-h-venablos-antes': ['?fase=testudo&vista=fuera&fisica=0', Hz, TV, 0],
  'tes-v-pila': ['?fase=impacto&camm=4.4,2.85,-0.27,0,44', V, null, TP], 'tes-h-suelo': ['?fase=impacto&costado=g', Hz, null, TT],
};
for (const [nombre, [q, [w, h], ven, mas]] of Object.entries(FOTOS)) {
  if (solo && !solo.includes(nombre)) continue;
  const n0 = errores.length, t0 = Date.now();
  try {
    const { ctx, page } = await abre(q, w, h);
    const r = await page.evaluate(([ven, mas]) => { const t = window.__tp, S = t.S; if (ven !== null) { S.proxima = S.T + 0.2; t.salta(ven); } if (mas) t.salta(mas); const e = t.estado(), g = t.galos(), m = t.proyectilesActiva ? t.proyectiles() : null;
      return { T: +S.T.toFixed(2), venablosClavados: e.clavados, enHombre: e.enHombre, pilaClavados: g.clavados, pilaTierra: g.enTierra, pilaAire: g.enAire, modos: m && m.modos }; }, [ven, mas]);
    await cuadro(page); await cuadro(page);
    await page.screenshot({ path: join(SALIDA, 'FI3-' + nombre + '.jpg'), type: 'jpeg', quality: 80, timeout: 300000 });
    console.log(`  foto ${nombre}: ${JSON.stringify(r)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); await ctx.close();
  } catch (e) { errores.push('foto ' + nombre + ': ' + e.message.slice(0, 200)); console.log('  MAL foto ' + nombre + ': ' + e.message.slice(0, 200)); }
  if (errores.length > n0) console.log('  (errores en ' + nombre + ')');
}
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO: ' + errores.length + ' fallos' : 'APTO');
process.exit(errores.length ? 1 : 0);
