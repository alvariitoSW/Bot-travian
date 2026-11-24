// Capturas de MN4c (portada y láminas). Uso: node gobierno/maquetas/portada/capturas.mjs [antes|despues|maqueta|todo]
// «antes» = juego real sin css/portada.css ni js/portada.js. «despues» = el mismo juego con ambos inyectados por Playwright (el enganche real son 1 <link> y 1 <script>).
import { createRequire } from 'node:module'; import { createServer } from 'node:http'; import { readFile, writeFile } from 'node:fs/promises'; import { join, extname, dirname } from 'node:path'; import { fileURLToPath } from 'node:url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '../../..'), SAL = join(RAIZ, 'gobierno/capturas-tarea'), modo = process.argv[2] || 'todo';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok)); const URL = 'http://127.0.0.1:' + srv.address().port;
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = async (w, h, inyecta) => { const c = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, serviceWorkers: 'block' }); const p = await c.newPage();
  p.on('pageerror', e => console.log('ERROR', String(e.message).slice(0, 200)));
  if (inyecta) await p.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { for (const h of ['css/aspecto.css', 'css/portada.css']) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; document.head.appendChild(l); } const s = document.createElement('script'); s.src = 'js/portada.js'; document.head.appendChild(s); }));
  return p; };
const jpg = (p, n, o) => p.screenshot({ path: join(SAL, 'MN4c-' + n + '.jpg'), type: 'jpeg', quality: 80, ...(o || {}) });
const espera = async p => { await p.waitForSelector('#menu [data-act]', { timeout: 30000 }); await p.waitForTimeout(2500); };
const repinta = async (p, act, v) => p.evaluate(([a, v]) => { const b = document.createElement('button'); b.dataset.act = a; if (v !== undefined) b.dataset.v = v; document.body.appendChild(b); b.click(); b.remove(); }, [act, v]);

if (modo === 'volcado' || modo === 'todo' || modo === 'maqueta') {   // marcado real de showMenu, sin portada, para la maqueta
  const p = await ctx(390, 844, false); await p.goto(URL + '/'); await espera(p);
  const quita = () => p.evaluate(() => document.getElementById('menu').innerHTML);
  const sin = await quita();
  await p.click('#menu [data-act="new"]'); await p.waitForTimeout(2500);
  await p.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
  await repinta(p, 'menu'); await p.waitForTimeout(800); const con = await quita();
  await repinta(p, 'mpanel', 'nueva'); await p.waitForTimeout(800); const nueva = await quita();
  await writeFile(join(AQUI, 'datos.js'), '/* Marcado real de showMenu() volcado del juego (sin partida, con partida, panel Nueva campaña). Lo regenera capturas.mjs */\nwindow.MENUS = ' + JSON.stringify({ sin, con, nueva }) + ';\n');
  await p.context().close();
}
if (modo === 'antes') { const p = await ctx(390, 844, false); await p.goto(URL + '/'); await espera(p); await jpg(p, 'antes-portada'); await p.context().close(); }
if (modo === 'despues' || modo === 'todo') {
  const p = await ctx(390, 844, true); await p.goto(URL + '/'); await espera(p); await p.waitForTimeout(1200);
  await jpg(p, 'despues-portada-sin');                              // sin partida: el menú se pinta por primera vez ya con portada
  await p.click('#menu [data-act="new"]'); await p.waitForTimeout(2500);
  await p.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
  await repinta(p, 'menu'); await p.waitForTimeout(1200); await jpg(p, 'despues-portada');     // con partida guardada, repintado por ui.js
  await repinta(p, 'mpanel', 'nueva'); await p.waitForTimeout(1200); await jpg(p, 'despues-portada-nueva');
  await repinta(p, 'mpanel', ''); await p.waitForTimeout(800);
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(1000); await jpg(p, 'despues-portada-h');
  const d = await p.evaluate(() => { const m = document.getElementById('menu'); return { sh: m.scrollHeight, ch: m.clientHeight, sw: m.scrollWidth, cw: m.clientWidth }; }); console.log('horizontal', JSON.stringify(d));
  await p.context().close();
}
if (modo === 'maqueta' || modo === 'todo') {
  const m = await ctx(390, 844, false); const ir = async h => { await m.goto(URL + '/gobierno/maquetas/portada/index.html?k=' + Math.random() + h); await m.waitForTimeout(900); };
  await ir('#laminas1'); await jpg(m, 'laminas-saber-senado'); await ir('#laminas2'); await jpg(m, 'laminas-tropas-imperio'); await ir('#ficha'); await jpg(m, 'ficha-edificio'); await ir('#minis'); await jpg(m, 'miniaturas');
  await ir('#con'); await jpg(m, 'maqueta-con-version'); await m.context().close();
}
await br.close(); srv.close();
