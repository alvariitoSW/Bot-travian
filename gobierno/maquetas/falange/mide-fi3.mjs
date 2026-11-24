// FI3 «Pilum que rebotan o se clavan»: mide la salva entera (24 pila, bot «compas», semilla 20261123) con y sin física.
// Imprime las cifras y sale con código 1 si una vara falla: reglas distintas con y sin física, algún astil dentro,
// o la media por fotograma de la física de los pila por encima de MS_MEDIA (1 ms; p95 y peor, informativos). Uso: node gobierno/maquetas/falange/mide-fi3.mjs
// Basado en captura-fi1.mjs (mismo servidor y misma forma de abrir).
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
const MS_MEDIA = +(op.msmedia || 1), SEGUNDOS = +(op.segundos || 22);
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errores = [], R = {};
const vara = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push(texto); };
for (const q of ['fisica=0&', '']) {
  const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 }), page = await ctx.newPage();
  page.on('pageerror', e => errores.push('error: ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/404|rival\.js/.test(m.text())) errores.push('consola: ' + m.text().slice(0, 200)); });
  await page.goto(URL0 + '?antiguo=1&' + q + 'semilla=20261123'); await page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });
  await page.evaluate(() => window.__tp.parar(true));
  const r = await page.evaluate(n => { const t = window.__tp; t.reinicia(); return t.proyectilesJuega(n, 'compas'); }, SEGUNDOS);
  R[q ? 'sin' : 'con'] = r; console.log((q ? 'sin física' : 'con física') + ': ' + JSON.stringify(r));
  await ctx.close();
}
await br.close(); srv.close();
const { sin, con } = R;
vara(sin.reglas === con.reglas && sin.bajas === con.bajas, `reglas iguales con y sin física (estados ${con.reglas}, bajas ${con.bajas})`);
vara(con.dentroTotal === 0, `astiles dentro: ${con.dentroTotal} de ${con.muestras} muestras (vara 0)`);
vara(con.msMedia <= MS_MEDIA, `coste de los pila: media ${con.msMedia} ms por fotograma con pila (vara ≤ ${MS_MEDIA}); p95 ${con.msP95} ms y peor ${con.msPeor} ms informativos`);
console.log(`  saltos: ${JSON.stringify(con.saltos)} de ${con.llegan} llegadas; por ángulo (solo cara de escudo, cuerpo y suelo) ${JSON.stringify(con.tramos)}; aparte (canto, umbo, casco, asta, al caer) ${JSON.stringify(con.aparte)}; modos ${JSON.stringify(con.modos)}`);
if (errores.length) { console.log('NO APTO:\n  ' + errores.join('\n  ')); process.exit(1); }
console.log('APTO');
