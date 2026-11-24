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
  page.on("console", m => { if (/rival\.js/.test((m.location() || {}).url || "") || /404/.test(m.text())) return; if ((m.type() === "error" || m.type() === "warning") && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log("  [" + m.type() + "] " + m.text().slice(0, 300)); } });
  page.on("pageerror", e => { errores.push(e.message); console.log("  [error de página] " + e.message.slice(0, 400)); });
}
const cuadro = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
async function abre(q, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + q); await page.waitForFunction("window.__tp && window.__tp.lista === true", null, { timeout: 300000 }); await page.waitForTimeout(1500); return { ctx, page };
}
/* FI3u «El galo suelta el escudo» (César, BG 1.25): las dos salvas de pila (como mide-fi3.mjs) y una foto del escudo en el suelo,
   con la física y sin ella (?fisica=0, el antes: mismo instante y misma cámara). Fotos en gobierno/capturas-tarea/FI3u-*.jpg.
   Uso: node gobierno/maquetas/a-pie/captura-fi3u.mjs [solo=v,h] [salvas=2] [mas=0] [forzar=1: si ningún galo llega a dos pila, la foto hace que suelte el escudo el galo vivo más adelantado] [cual=0] (cual: qué escudo del suelo se mira) */
const FORZAR = op.forzar === '1', SALVAS = +(op.salvas || 2), MAS = +(op.mas || 0), CUAL = +(op.cual || 0), solo = op.solo ? op.solo.split(',') : ['v', 'h'];
async function juega(q, w, h, mira) {
  const { ctx, page } = await abre('?fase=pila' + q, w, h);
  const r = await page.evaluate(([mas, cual, mira, salvas, forzar]) => { const t = window.__tp, S = t.S;
    for (let k = 0; k < salvas; k++) { t.armar(); t.salta(0.84); t.soltar(); for (let i = 0; i < 32; i++) t.salta(0.1); } if (forzar && !(S.galos.suelo || []).length && t.proyectilesActiva) { const g = S.galos.filter(g => g.vivo && !g.reserva).sort((a, b) => b.z - a.z)[0]; if (g) t.sueltaEscudo(g); } if (mas) t.salta(mas);
    const L = S.galos.suelo || [], e = L[cual] ? L[cual].elements : null, sin = S.galos.filter(g => g.sinEscudo), m = t.proyectiles();
    const p = mira || (e ? [e[12], e[13], e[14]] : null);
    if (p) { const cam = t.camara, ren = t.renderer, orig = ren.render.bind(ren);
      /* la cámara, a 3 m del escudo, del lado de los romanos y un poco alta, mirándolo */
      ren.render = (sc, c) => { if (c === cam) { cam.position.set(p[0] + 0.8, p[1] + 2.6, p[2] + 2.2); cam.lookAt(p[0], p[1] + 0.5, p[2]); cam.updateMatrixWorld(); } orig(sc, c); }; }
    return { T: +S.T.toFixed(2), sueltos: m.sueltos, enSuelo: L.length, sinEscudoVivos: sin.filter(g => g.vivo).length, caidos: S.caidos, salvas: S.salvas, enEscudo: m.pilaEnEscudo, mira: p && p.map(x => +x.toFixed(2)) };
  }, [MAS, CUAL, mira, SALVAS, FORZAR]);
  await cuadro(page); await cuadro(page); return { ctx, page, r };
}
for (const [k, [w, h]] of Object.entries({ v: V, h: Hz })) {
  if (!solo.includes(k)) continue;
  try {
    const c = await juega('', w, h, null); console.log(`  ${k} con física: ${JSON.stringify(c.r)}`);
    await c.page.screenshot({ path: join(SALIDA, `FI3u-${k}-suelta.jpg`), type: 'jpeg', quality: 80, timeout: 300000 }); await c.ctx.close();
    if (!c.r.mira) { errores.push('ningún escudo en el suelo'); continue; }
    const a = await juega('&fisica=0', w, h, c.r.mira); console.log(`  ${k} sin física (antes): ${JSON.stringify(a.r)}`);
    await a.page.screenshot({ path: join(SALIDA, `FI3u-${k}-antes.jpg`), type: 'jpeg', quality: 80, timeout: 300000 }); await a.ctx.close();
  } catch (e) { errores.push(k + ': ' + e.message.slice(0, 200)); console.log('  MAL ' + k + ': ' + e.message.slice(0, 300)); }
}
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO: ' + errores.length + ' fallos' : 'APTO');
process.exit(errores.length ? 1 : 0);
