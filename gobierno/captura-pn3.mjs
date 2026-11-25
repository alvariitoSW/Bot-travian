/* AQVILA — PN3: capturas de la comarca aleatoria y el arranque mínimo de la polis. Uso: node gobierno/captura-pn3.mjs
   Deja en gobierno/capturas-tarea/ (390×844): PN3-a-atenas-arriba, PN3-b-atenas-cerca, PN3-c-atenas-otra-semilla, PN3-d-tebas, PN3-d-esparta,
   PN3-e-barra-800, PN3-f-ficha-agora. Cuenta los errores de consola (deben ser 0). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = process.env.AQ_RAIZ || join(dirname(fileURLToPath(import.meta.url)), '..'), SAL = join(dirname(fileURLToPath(import.meta.url)), 'capturas-tarea'), SOLO = process.env.AQ_SOLO_ROMA, B2 = process.env.AQ_B2 || process.env.AQ_B3, B3 = process.env.AQ_B3;
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SAL, { recursive: true });
const errores = [];
async function sesion(ancho, alto, f) {
  if ((SOLO && !f.roma) || (B2 && !f.b2)) return;
  const ctx = await br.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, serviceWorkers: 'block' }), page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
  page.on('dialog', d => d.accept());
  await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await page.waitForSelector('#menu .pn-carta [data-pn="nueva"]', { timeout: 30000 }); await page.waitForTimeout(1500);
  await f(page); await ctx.close();
}
const foto = (page, n) => page.screenshot({ path: join(SAL, n + '.jpg'), type: 'jpeg', quality: 80 });
const desborda = page => page.evaluate(() => { const m = document.getElementById('menu'); return { scrollW: m.scrollWidth, clientW: m.clientWidth, scrollH: m.scrollHeight, clientH: m.clientHeight }; });

const ciudad = page => page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = 'roma'; document.body.appendChild(b); b.click(); b.remove(); });
const accion = (page, a, v) => page.evaluate(([a, v]) => { const b = document.createElement('button'); b.dataset.act = a; if (v) b.dataset.v = v; document.body.appendChild(b); b.click(); b.remove(); }, [a, v]);
const cierra = page => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; const h = document.getElementById('popsheet'); if (h) h.hidden = true; if (window.Game && Game.state) Game.state.speed = 0; });
async function empezar(page, polis, semilla) {
  await page.evaluate(s => { UI.semillaPolis = s; }, semilla);
  await page.click('#menu .pn-carta [data-pn="nueva"]'); await page.waitForTimeout(400);
  await page.click('#menu [data-pnpolis="' + polis + '"]'); await page.waitForTimeout(300);
  await page.click('#menu [data-act="newpolis"]'); await page.waitForTimeout(4000); await cierra(page);
  await ciudad(page); await page.waitForTimeout(10000); await cierra(page);
  const info = await page.evaluate(() => { const E = Game.ciudadE('roma'), k = Game.state.comarca; return { comarca: k && (k.nombre + ' · ' + k.terreno + ' · ' + k.agua + ' · semilla ' + k.semilla), casas: E.parcelas.filter(l => l.casa && !l.casa.ruina).length, pop: Game.state.cities.roma.pop, urbe: !!E.urbe, sitio: E.sitio, fecha: Game.dateStr(Game.state.t), foro: DATA.BUILD.foro.n }; });
  console.log(polis, JSON.stringify(info));
}
const plano = async (page, arriba) => { const en = await page.evaluate(() => !!(UI.cityV && UI.cityV.enPlano)); if (en !== arriba) { await accion(page, 'cplano'); await page.waitForTimeout(2500); } };
await sesion(390, 844, async page => {
  await empezar(page, 'atenas', 1013);
  await plano(page, true); await foto(page, 'PN3b-a-atenas-arriba');
  await plano(page, false); await foto(page, 'PN3b-b-atenas-cerca');
  await page.evaluate(() => { UI.bsel = { k: 'foro' }; }); await accion(page, 'cvistas'); await page.waitForTimeout(300); await accion(page, 'cvistas'); await page.waitForTimeout(1200);
  await foto(page, 'PN3b-f-ficha-agora');
  console.log('ficha', JSON.stringify(await page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('Comarca de'); return { agora: /Ágora/.test(t), foro: /\bForo\b/.test(t), comarca: i >= 0 ? t.slice(i, i + 160) : null }; })));
  await page.evaluate(() => { UI.bsel = null; }); await accion(page, 'cclose'); await page.waitForTimeout(400);
  await accion(page, 'tab', 'map'); await page.waitForTimeout(3000); await cierra(page);
  await foto(page, 'PN3b-e-barra-800');
  console.log('barra', JSON.stringify(await page.evaluate(() => { const t = document.body.innerText; const m = t.match(/[^\n]{0,40}800 a\.C\.[^\n]{0,20}/); return m ? m[0] : null; })));
});
await sesion(390, 844, async page => { await empezar(page, 'atenas', 77777); await plano(page, true); await foto(page, 'PN3b-c-atenas-otra-semilla'); });
await sesion(390, 844, async page => { await empezar(page, 'tebas', 4242); await plano(page, true); await foto(page, 'PN3b-d-tebas'); });
await sesion(390, 844, async page => { await empezar(page, 'esparta', 31337); await plano(page, false); await foto(page, 'PN3b-d-esparta'); });
/* PN3b: Roma antes/después (AQ_SOLO_ROMA=etiqueta: solo esa captura, con AQ_RAIZ apuntando a otra copia del código) y una en horizontal */
const romaFoto = async (page, n) => { await accion(page, 'newregion', 'italia'); await page.waitForTimeout(3500); await cierra(page); await ciudad(page); await page.waitForTimeout(10000); await cierra(page); await plano(page, false); await page.waitForTimeout(1500); await foto(page, n); };
if (B3) {
  const a = async page => { await empezar(page, 'atenas', 1013); await plano(page, true); await foto(page, 'PN3b3-arriba'); await plano(page, false); await foto(page, 'PN3b3-cerca');
    await accion(page, 'tab', 'imperio'); await page.waitForTimeout(2500); await cierra(page); await foto(page, 'PN3b3-imperio'); };
  a.b2 = true; await sesion(390, 844, a);
  const t = async page => { await empezar(page, 'tebas', 4242); await plano(page, false); await foto(page, 'PN3b3-tebas'); }; t.b2 = true; await sesion(390, 844, t);
}
else if (B2) {
  const a = async page => { await empezar(page, 'atenas', 1013); await plano(page, false); await foto(page, 'PN3b2-atenas-cerca'); await plano(page, true); await foto(page, 'PN3b2-atenas-arriba');
    await accion(page, 'tab', 'imperio'); await page.waitForTimeout(2500); await cierra(page); await foto(page, 'PN3b2-imperio-polis'); console.log('imperio', JSON.stringify(await page.evaluate(() => { const t = document.body.innerText; return { armas: /Dominio por las armas[^\n]*/.exec(t)?.[0], caminos: /Tus caminos/.test(t) }; }))); };
  a.b2 = true; await sesion(390, 844, a);
  const r = async page => { await romaFoto(page, 'PN3b2-roma-cerca'); await page.evaluate(() => { const E = Game.ciudadE('roma'); UI.cityV.mirar(E.foro.x + 30, E.foro.z + 30, 110); }); await page.waitForTimeout(2500); await foto(page, 'PN3b2-roma-aldeanos'); }; r.b2 = true; await sesion(390, 844, r);
}
else if (SOLO) { const f = page => romaFoto(page, 'PN3b-roma-' + SOLO); f.roma = true; await sesion(390, 844, f); }
else {
  await sesion(390, 844, page => romaFoto(page, 'PN3b-roma-despues'));
  await sesion(844, 390, async page => { await empezar(page, 'atenas', 1013); await plano(page, false); await foto(page, 'PN3b-horizontal-atenas'); });
}
await br.close(); srv.close();
console.log(errores.length ? 'ERRORES DE CONSOLA (' + errores.length + '):\n' + errores.join('\n') : 'Errores de consola: 0');
