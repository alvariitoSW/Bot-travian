/* PL3 Politeia: prueba de navegador de la pantalla de política (390x844). Uso: node test/politeia-ui.test.mjs [--capturas]
   1) Página mínima propia (css + 3 scripts): se abre, 7 medallones, se juega en Consejo/Tu casa/Ágora, debate, juicio y fin del año pulsando Pasar.
   2) index.html: carga el juego, existe POLITEIA_UI y el botón de la ficha del ágora está enganchado en ui.js. Falla (exit 1) si algo no se cumple. */
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), RAIZ = path.resolve(AQUI, '..');
const CAP = process.argv.includes('--capturas'), DIR_CAP = path.join(RAIZ, 'gobierno/capturas/pl3');
const SEMILLA = 4242, T0 = Date.now();
const fallos = [], ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };
const PAGINA = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>prueba politeia</title><link rel="stylesheet" href="/css/politeia.css">
<style>body{margin:0;background:#222}</style></head><body><script src="/js/politeia-datos.js"></script><script src="/js/politeia.js"></script><script src="/js/politeia-ui.js"></script></body></html>`;
const srv = createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/__pt.html') { res.writeHead(200, { 'content-type': MIME['.html'] }); return res.end(PAGINA); }
  const f = path.join(RAIZ, u === '/' ? 'index.html' : u);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('no'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const URL0 = 'http://127.0.0.1:' + srv.address().port;
let chromium; try { chromium = createRequire(import.meta.url)('playwright').chromium; } catch (e) { console.log('MAL   no hay playwright: ' + e.message); process.exit(1); }
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
if (CAP) fs.mkdirSync(DIR_CAP, { recursive: true });
const errores = [];
async function pagina() {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errores.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errores.push('consola: ' + m.text()); });
  return p;
}
const foto = async (p, n) => { if (CAP) await p.screenshot({ path: path.join(DIR_CAP, n + '.png') }); };
const visible = (p, s) => p.locator(s).first().isVisible().catch(() => false);
const estado = p => p.evaluate(() => { const P = POLITEIA_UI._estado(); return P ? { pasos: P.pasos, est: P.estacion, duelo: !!P.duelo, juicio: !!P.juicio, fin: !!P.fin, cron: P.cronica.length, plata: P.casas.tuya.plata, fama: P.casas.tuya.fama } : null; });
try {
  // ---------- 1. Página mínima ----------
  const p = await pagina();
  await p.goto(URL0 + '/__pt.html');
  await p.evaluate(s => { try { localStorage.clear(); } catch (e) {} POLITEIA_UI.abrir({ polis: 'atenas', semilla: s }); }, SEMILLA);
  ok(await visible(p, '#pt-raiz'), 'se abre la pantalla (#pt-raiz)');
  ok(await p.locator('.pt-medallon').count() === 7, 'hay 7 medallones');
  for (const id of ['consejo', 'casa', 'agora', 'asamblea', 'tribunal', 'santuario', 'puerto']) ok(await p.locator('.pt-medallon[data-lugar="' + id + '"]').count() === 1, 'medallón ' + id);
  const h = await p.evaluate(() => ({ sh: document.querySelector('#pt-scroll').scrollHeight, ch: document.querySelector('#pt-scroll').clientHeight, ho: document.documentElement.scrollWidth, w: innerWidth }));
  ok(h.sh > h.ch * 1.5, 'la ciudad es más alta que la pantalla y se desliza (' + h.sh + ' > ' + h.ch + ')');
  ok(h.ho <= h.w, 'sin desplazamiento horizontal');
  ok(await visible(p, '#pt-pasar'), '«Pasar» visible al abrir');
  await foto(p, '01-ciudad');
  await p.evaluate(() => { document.querySelector('#pt-scroll').scrollTop = 560; }); await p.waitForTimeout(150); await foto(p, '02-ciudad-abajo');
  await p.evaluate(() => { document.querySelector('#pt-scroll').scrollTop = 0; });

  // juega una acción real desde el pergamino de un lugar
  async function jugarEn(lugar, foto_) {
    if (await visible(p, '#pt-pergamino')) await p.click('#pt-pergamino .pt-cerrar[data-x="cerrar"]');
    const antes = await estado(p);
    await p.click('.pt-medallon[data-lugar="' + lugar + '"]'); await p.waitForTimeout(450);
    const verPerg = await visible(p, '#pt-pergamino'), n = await p.locator('#pt-pergamino .pt-accion').count();
    ok(verPerg && n > 0, 'al tocar ' + lugar + ' sale el pergamino con acciones (' + n + ')');
    ok(await visible(p, '#pt-pasar'), '«Pasar» visible con el pergamino de ' + lugar);
    if (foto_) await foto(p, foto_);
    if (!n) return null;
    const id = await p.locator('#pt-pergamino .pt-accion').first().getAttribute('data-id');
    await p.locator('#pt-pergamino .pt-accion').first().click(); await p.waitForTimeout(100);
    if (await p.locator('.pt-objetivo').count()) {
      const frases = await p.locator('.pt-objetivo').allInnerTexts();
      ok(frases.every(f => f.trim().length > 2 && !/^[a-z]+[:>]/.test(f) && !/undefined|null/.test(f)), 'objetivos en frases llanas de ' + id + ': ' + frases.slice(0, 2).join(' | '));
      await p.locator('.pt-objetivo').first().click(); await p.waitForTimeout(100);
    }
    const des = await estado(p);
    ok(des.cron > antes.cron, 'se jugó «' + id + '» en ' + lugar + ' (la crónica crece)');
    return id;
  }
  const viaPasar = async () => { const b = p.locator('#pt-pasar'); await b.click(); await p.waitForTimeout(60); };
  const pasarHasta = async (cond, max = 12) => { for (let i = 0; i < max; i++) { const e = await estado(p); if (cond(e)) return e; ok(await visible(p, '#pt-pasar') || e.fin, '«Pasar» visible'); await viaPasar(); } return estado(p); };

  // Primavera: Consejo
  let e = await estado(p); ok(e.est === 0, 'empieza en primavera');
  await jugarEn('consejo', '03-consejo');
  e = await pasarHasta(x => x.est === 1);
  // Verano: Tu casa y Ágora
  ok(e.est === 1, 'llega el verano pulsando Pasar');
  await jugarEn('casa', '04-casa');
  await jugarEn('agora', '05-agora');
  if (await visible(p, '#pt-pergamino')) await p.click('#pt-pergamino .pt-cerrar[data-x="cerrar"]');
  e = await pasarHasta(x => x.est === 2);
  // Otoño: una jugada en la asamblea (si se puede) y debate
  ok(e.est === 2, 'llega el otoño');
  if ((await p.locator('.pt-medallon[data-lugar="asamblea"].hay').count())) await jugarEn('asamblea', null);
  e = await pasarHasta(x => x.duelo, 8);
  ok(e.duelo, 'el otoño acaba en debate');
  await p.waitForTimeout(500);
  ok(await visible(p, '#pt-pergamino') && await p.locator('#pt-pergamino[data-lugar="asamblea"]').count() === 1, 'el pergamino del debate se abre solo');
  ok(await visible(p, '#pt-pasar'), '«Pasar» visible en el debate');
  ok(await p.locator('#pt-pergamino .pt-accion').count() > 0, 'el debate ofrece acciones');
  // Preguntar de verdad: así el debate tiene frases
  if (await p.locator('#pt-pergamino .pt-accion[data-id="preguntar"]').count()) {
    await p.click('#pt-pergamino .pt-accion[data-id="preguntar"]'); await p.waitForTimeout(100);
    ok(await p.locator('.pt-objetivo').count() > 0, 'preguntar ofrece objetivos');
    await p.locator('.pt-objetivo').last().click(); await p.waitForTimeout(100);
    ok(/Preguntaste a/.test(await p.locator('#pt-pergamino').innerText()), 'el debate cuenta lo dicho en frases');
  }
  await foto(p, '06-debate');
  // responder de verdad cuando toca
  for (let i = 0; i < 6; i++) { const s = await estado(p); if (!s.duelo) break; const a = p.locator('#pt-pergamino .pt-accion[data-id="verdad"], #pt-pergamino .pt-accion[data-id="callar"]'); if (await a.count()) { await a.first().click(); await p.waitForTimeout(80); } else await viaPasar(); }
  e = await pasarHasta(x => !x.duelo && x.est >= 2, 12);
  e = await pasarHasta(x => x.est === 3 || x.fin, 12);
  // Invierno: tribunal
  if (!e.fin) {
    if (e.juicio) ok(await p.locator('#pt-pergamino[data-lugar="tribunal"]').count() === 1 && await visible(p, '#pt-pergamino'), 'con juicio, el tribunal se abre solo');
    else await p.click('.pt-medallon[data-lugar="tribunal"]').catch(() => {});
    await p.waitForTimeout(500); await foto(p, '07-tribunal');
    if (await visible(p, '#pt-pergamino')) await p.click('#pt-pergamino .pt-cerrar[data-x="cerrar"]').catch(() => {});
  } else await foto(p, '07-tribunal');
  // Hasta el final del año solo con Pasar (máx. 300)
  let n = 0; while (n < 300 && !(await visible(p, '#pt-fin'))) { const s = await estado(p); if (s.fin) break; await p.locator('#pt-pasar').click({ timeout: 4000 }); n++; }
  await p.waitForTimeout(300);
  ok(await visible(p, '#pt-fin'), 'se llega a #pt-fin pulsando Pasar (' + n + ' veces)');
  const finTxt = await p.locator('#pt-fin').innerText().catch(() => '');
  ok(/Fin del año/.test(finTxt) && /La crónica/.test(finTxt) && /Otro año/.test(finTxt) && /Salir/.test(finTxt), 'el final del año trae resultado, crónica y botones');
  ok(!/Senado|Partenón|moneda/i.test(await p.locator('#pt-raiz').innerText()), 'sin «Senado», Partenón ni monedas en la pantalla');
  await foto(p, '08-fin');
  await p.click('#pt-otro'); await p.waitForTimeout(200);
  ok(!(await visible(p, '#pt-fin')) && (await estado(p)).est === 0, '«Otro año» empieza otro año');
  await p.click('#pt-salir'); await p.waitForTimeout(100);
  ok(await p.locator('#pt-raiz').count() === 0, '«Salir» quita la pantalla');
  ok(errores.length === 0, 'sin errores de consola en la pantalla (' + errores.slice(0, 3).join(' / ') + ')');

  // ---------- 2. El juego entero ----------
  const errAntes = errores.length;
  const q = await pagina();
  await q.goto(URL0 + '/index.html', { waitUntil: 'load' });
  await q.waitForFunction(() => typeof window.POLITEIA_UI === 'object' && typeof window.POLITEIA === 'object', null, { timeout: 20000 }).catch(() => {});
  ok(await q.evaluate(() => typeof window.POLITEIA_UI === 'object' && typeof POLITEIA_UI.abrir === 'function'), 'index.html carga POLITEIA_UI');
  const uiSrc = fs.readFileSync(path.join(RAIZ, 'js/ui.js'), 'utf8');
  ok(/case 'politeia'/.test(uiSrc) && /data-act="politeia"/.test(uiSrc), 'js/ui.js trae el botón y el case «politeia» (no se arranca una partida de polis entera: sería lento y frágil)');
  const sw = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
  ok(['js/politeia-ui.js', 'css/politeia.css', 'assets/politeia/ciudad.svg'].every(f => sw.includes(f)), 'sw.js lista los archivos nuevos');
  const mal = errores.slice(errAntes).filter(x => !/Failed to load resource|favicon|manifest|service ?worker/i.test(x));
  ok(mal.length === 0, 'sin errores de consola en index.html (' + mal.slice(0, 3).join(' / ') + ')');
} catch (err) { ok(false, 'la prueba se rompió: ' + (err && err.stack || err)); }
await br.close(); srv.close();
const seg = ((Date.now() - T0) / 1000).toFixed(1);
console.log(fallos.length ? '\n' + fallos.length + ' MAL en ' + seg + ' s' : '\npoliteia-ui: todo bien en ' + seg + ' s');
process.exit(fallos.length ? 1 : 0);
