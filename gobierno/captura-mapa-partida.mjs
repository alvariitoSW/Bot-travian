/* AQVILA — AM4: la pestaña MAPA de la partida de polis es el mapa vivo de Grecia. Uso: node gobierno/captura-mapa-partida.mjs [polis]
   Empieza una partida de polis (Mégara por defecto), entra por la pestaña MAPA y deja en gobierno/capturas-tarea/
   (390×844 «-v» y 844×390 «-h», a 2 puntos por píxel):
     AM4-lejos-{v,h}     lo que se ve al abrir la pestaña (tu polis y sus vecinas)
     AM4-comarca-{v,h}   la comarca de tu polis, con los recursos
     AM4-polis-{v,h}     tu polis de cerca
     AM4-hoja-v          tras tocar tu polis: su hoja del juego
     AM4-marcha-v        una marcha de Corinto contra tu polis (puesta a mano en la partida)
     AM4-entrar-v        segundo toque: se entra en la ciudad; AM4-volver-v al volver al mapa
     AM4-roma-{v,h}      la campaña de Roma: su mapa de siempre
   Comprueba (y escribe AM4-medidas.json): ni un rótulo romano en el mapa de polis, tu polis marcada, la hoja abre la tuya,
   se entra en la ciudad, la marcha se pinta, la campaña de Roma sigue con map3d.js; 0 errores de consola. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SAL = join(RAIZ, 'gobierno/capturas-tarea'), POLIS = process.argv[2] || 'megara';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SAL, { recursive: true });
const errores = [], medidas = {}, fallos = [];
const ok = (c, txt) => { if (!c) fallos.push(txt); console.log((c ? 'bien ' : 'FALLA ') + txt); };
const foto = (page, n) => page.screenshot({ path: join(SAL, 'AM4-' + n + '.jpg'), type: 'jpeg', quality: 80 });
const accion = (page, a, v) => page.evaluate(([a, v]) => { const b = document.createElement('button'); b.dataset.act = a; if (v) b.dataset.v = v; document.body.appendChild(b); b.click(); b.remove(); }, [a, v]);
const cierra = page => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; const h = document.getElementById('popsheet'); if (h) h.hidden = true; const l = document.getElementById('linea'); if (l) l.hidden = true; if (window.Game && Game.state) Game.state.speed = 0; });
const ROMANOS = /\b(Roma|Mediolanum|Tarentum|Syracusae|Messana|Volsinii|Capua|Ostia|Carthago|Mare Internum|Tyrrhenum)\b/;
/* lo que dice el mapa de la pestaña: rótulos de Grecia visibles y si queda algún nombre romano a la vista */
const lee = page => page.evaluate(() => {
  const caja = document.querySelector('#mapwrap .mpg'), vis = e => e.offsetParent !== null && getComputedStyle(e).display !== 'none';
  const rot = caja ? [...caja.querySelectorAll('.mg-e')].filter(vis).map(e => e.textContent.trim()) : [];
  const mia = caja && caja.querySelector('.mg-polis.mia'); const g = UI.map.gr && UI.map.gr.mapa;
  const romanos = [...document.querySelectorAll('#mapwrap .mlabel, #mapwrap .mmigas')].filter(e => { const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return vis(e) && r.width && top && e.contains(top); }).map(e => e.textContent.trim());
  return { grecia: !!caja, rotulos: rot, mia: mia ? mia.textContent : null, miaVista: !!(mia && vis(mia)), ancho: g ? +g.ancho.toFixed(2) : null, estilo: g ? g.est : null, romanosEncima: romanos, info: g ? g.info() : null };
});
async function sesion(ancho, alto, f) {
  const ctx = await br.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, serviceWorkers: 'block' }), page = await ctx.newPage();
  page.on('console', m => { if (/^AM4/.test(m.text())) console.log(m.text()); if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
  page.on('dialog', d => d.accept());
  await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await page.waitForSelector('#menu .pn-carta [data-pn="nueva"]', { timeout: 30000 }); await page.waitForTimeout(1500);
  await f(page); await ctx.close();
}
async function empezarPolis(page) {
  await page.evaluate(() => { UI.semillaPolis = 1013; try { localStorage.removeItem('aqvila-mapa-estilo'); } catch (e) {} });
  await page.click('#menu .pn-carta [data-pn="nueva"]'); await page.waitForTimeout(400);
  await page.click('#menu [data-pnpolis="' + POLIS + '"]'); await page.waitForTimeout(300);
  await page.click('#menu [data-act="newpolis"]'); await page.waitForTimeout(3000); await cierra(page);
  await accion(page, 'tab', 'map'); await page.waitForFunction(() => UI.map.gr && UI.map.gr.mapa && UI.map.gr.mapa.listo, null, { timeout: 60000 });
  await page.waitForTimeout(5000); await cierra(page);
}
const ir = (page, lon, lat, a) => page.evaluate(([lon, lat, a]) => { const m = UI.map.gr.mapa; m.vista({ lon, lat, a }); }, [lon, lat, a]);
const miPolis = page => page.evaluate(() => { const p = UI.map.gr.p; return [p.lon, p.lat]; });

for (const [w, h, s] of [[390, 844, 'v'], [844, 390, 'h']]) await sesion(w, h, async page => {
  await empezarPolis(page);
  let L = await lee(page); medidas['lejos-' + s] = L; await foto(page, 'lejos-' + s);
  ok(L.grecia, s + ': la pestaña MAPA de la polis es el mapa de Grecia');
  ok(!L.rotulos.some(t => ROMANOS.test(t)) && !L.romanosEncima.length, s + ': ni un nombre romano a la vista (' + L.romanosEncima.join(', ') + ')');
  ok(L.miaVista && /tu polis/.test(L.mia || ''), s + ': tu polis marcada y a la vista al abrir');
  ok(L.estilo === 'a', s + ': abre en «Relieve natural»');
  const [lon, lat] = await miPolis(page);
  await page.evaluate(() => { const b = document.querySelector('.mpg [data-a="recursos"]'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
  await ir(page, lon - 0.05, lat - 0.02, 3.2); await page.waitForTimeout(4000); medidas['comarca-' + s] = await lee(page); await foto(page, 'comarca-' + s);
  await page.evaluate(() => { const b = document.querySelector('.mpg [data-a="recursos"]'); if (b && b.getAttribute('aria-pressed') === 'true') b.click(); });
  await ir(page, lon, lat, 0.5); await page.waitForTimeout(5000); medidas['polis-' + s] = await lee(page); await foto(page, 'polis-' + s);
  if (s !== 'v') return;
  /* tocar tu polis: la hoja del juego */
  await ir(page, lon, lat, 6); await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelector('.mpg .mg-polis.mia').click()); await page.waitForTimeout(1500);
  const hoja = await page.evaluate(() => ({ sel: UI.sel, hoja: !document.getElementById('sheet').hidden, texto: document.getElementById('sheet').innerText.slice(0, 160) }));
  medidas.hoja = hoja; await foto(page, 'hoja-v'); ok(hoja.sel === 'roma' && hoja.hoja, 'tocar tu polis abre su hoja del juego');
  /* PN3c: una marcha de Corinto contra tu polis y otra tuya contra Atenas (rivales griegas: ya nada llega «de poniente») */
  await page.evaluate(() => { const s = Game.state; s.marches.push({ id: 9001, owner: 'corinto', from: 'corinto', to: 'roma', units: { hoplitas: 800 }, t0: s.t - 1, t1: s.t + 0.6 }, { id: 9002, owner: 'roma', from: 'roma', to: 'atenas', units: { hoplitas: 300 }, t0: s.t - 0.3, t1: s.t + 1 }); });
  await page.evaluate(() => UI.map.gr.opts.onSelect(null)); await ir(page, 23.35, 37.95, 14); await page.waitForTimeout(3000);
  const mar = await page.evaluate(() => [...document.querySelectorAll('.mpg .mpg-ej')].filter(e => e.style.display !== 'none').map(e => e.textContent));
  medidas.marchas = mar; await foto(page, 'marcha-v'); ok(mar.length === 2 && !mar.some(t => /poniente/.test(t)), 'las dos marchas se pintan (' + mar.join(' | ') + ')');
  ok(!mar.some(t => ROMANOS.test(t)), 'las marchas no nombran ciudades de Italia');
  const bm = await page.evaluate(() => { const b = document.getElementById('bmarchas'); return b && !b.hidden && b.textContent; }); ok(/Marchas/.test(bm || ''), 'el botón «Marchas» sigue en el mapa');
  await accion(page, 'marchas'); await page.waitForTimeout(800); await foto(page, 'marchas-hoja-v');
  const hm = await page.evaluate(() => document.getElementById('hoja').innerText); medidas.hojaMarchas = hm.slice(0, 300); ok(!/minimapa/i.test(hm), 'la hoja «Marchas» no ofrece el minimapa de Italia');
  await accion(page, 'marchas'); await page.evaluate(() => { const s = Game.state; s.marches = s.marches.filter(m => m.id < 9000); }); await page.waitForTimeout(400);
  /* entrar en la ciudad con un segundo toque, y volver */
  await ir(page, lon, lat, 6); await page.waitForTimeout(2000);
  await page.evaluate(() => document.querySelector('.mpg .mg-polis.mia').click()); await page.waitForTimeout(700);
  await page.evaluate(() => document.querySelector('.mpg .mg-polis.mia').click()); await page.waitForTimeout(9000); await cierra(page);
  const ent = await page.evaluate(() => UI.tab); medidas.entrar = ent; await foto(page, 'entrar-v'); ok(ent === 'city', 'el segundo toque entra en la ciudad');
  await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'tab'; b.dataset.v = 'map'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(3000); await cierra(page);
  L = await lee(page); medidas.volver = L; await foto(page, 'volver-v'); ok(L.grecia && L.miaVista, 'al volver, el mapa de Grecia con tu polis');
  /* la pestaña Ciudad para el mapa (no gasta) */
  await accion(page, 'tab', 'city'); await page.waitForTimeout(4000); const parado = await page.evaluate(() => { const g = UI.map.gr; console.log('AM4 parado', UI.tab, g.mapa._raf, g.caja.hidden, Math.round(performance.now() - g.ultUpdate)); return !g.mapa._raf && g.caja.hidden; }); ok(parado, 'fuera de la pestaña MAPA el mapa de Grecia se para');
});

for (const [w, h, s] of [[390, 844, 'v'], [844, 390, 'h']]) await sesion(w, h, async page => {
  await accion(page, 'new'); await page.waitForTimeout(4000); await cierra(page); await accion(page, 'tab', 'map'); await page.waitForTimeout(9000); await cierra(page);
  const R = await page.evaluate(() => ({ grecia: !!document.querySelector('#mapwrap .mpg'), polis: Game.polis(), etiquetas: [...document.querySelectorAll('#mapwrap .mlabel')].filter(e => e.style.display !== 'none').map(e => e.textContent.trim()).filter(Boolean).slice(0, 12), dist: UI.map.c && +UI.map.c.dist.toFixed(1) }));
  medidas['roma-' + s] = R; await foto(page, 'roma-' + s);
  ok(!R.grecia && !R.polis && R.etiquetas.some(t => /Roma/.test(t)), s + ': la campaña de Roma sigue con su mapa (' + R.etiquetas.slice(0, 4).join(', ') + ')');
});
await br.close(); srv.close();
medidas.errores = errores; medidas.fallos = fallos;
await writeFile(join(SAL, 'AM4-medidas.json'), JSON.stringify(medidas, null, 1));
console.log(errores.length ? 'ERRORES DE CONSOLA (' + errores.length + '):\n' + errores.join('\n') : 'Errores de consola: 0');
console.log(fallos.length ? 'FALLAN ' + fallos.length : 'TODO BIEN');
process.exit(fallos.length || errores.length ? 1 : 0);
