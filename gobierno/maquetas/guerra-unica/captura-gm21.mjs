// Maqueta GM21 — el despliegue y el plan antes de marchar, en un móvil simulado (toques de dedo). Deja las capturas GM21-* y dice bien/MAL.
// Uso:  node gobierno/maquetas/guerra-unica/captura-gm21.mjs                       -> capturas GM21-* (dpr 2) en gobierno/capturas-tarea/
//       node gobierno/maquetas/guerra-unica/captura-gm21.mjs dpr=1 prefijo=/ruta/p-  -> rápido, para iterar
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.txt': 'text/plain' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.includes('..')) throw 0; const b = await readFile(join(RAIZ, r)); res.writeHead(200, { 'content-type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(b); } catch (e) { res.writeHead(404); res.end('no'); } }).listen(0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/guerra-unica/';
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GM21-'), errores = [];
const espera = (p, ms) => p.waitForTimeout(ms);
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
async function abrir(url, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  await page.goto(url); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 300000 });
  return { ctx, page };
}
const ayudas = page => ({
  g: (f, ...a) => page.evaluate(([f, a]) => { const v = window.__gc[f]; return typeof v === 'function' ? v(...a) : v; }, [f, a]),
  foto: async n => { await espera(page, 1200); for (let i = 0; ; i++) { try { await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 80, timeout: 240000 }); break; } catch (e) { if (i > 3) throw e; } } console.log('  captura ' + prefijo + n + '.jpg'); },
  pulsa: async sel => { await page.tap(sel); await espera(page, 400); },
  /* ningún texto del panel se sale de su caja; el panel cabe en la pantalla y no tapa más de la mitad */
  caja: () => page.evaluate(() => { const p = document.getElementById('plan'), r = p.getBoundingClientRect(), mal = []; for (const e of p.querySelectorAll('button, button span, .cr-s, .cr-n, .pl-t')) { if (!e.offsetParent) continue; if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) mal.push((e.className || e.tagName) + ': «' + e.textContent.slice(0, 28) + '»'); }
    const bajos = [...p.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().height < 43.5).map(b => b.textContent.slice(0, 20)); return { mal, bajos, x: r.x, y: r.y, w: r.width, h: r.height, vw: innerWidth, vh: innerHeight }; }),
});
async function revisa(page, A, etiqueta, maxFrac) {
  const c = await A.caja();
  bien(c.mal.length === 0, `${etiqueta}: ningún texto se sale de su caja ${c.mal.join(' | ')}`);
  bien(c.bajos.length === 0, `${etiqueta}: todos los botones miden al menos 44 px de alto ${c.bajos.join(',')}`);
  bien(c.x >= 0 && c.x + c.w <= c.vw + 0.5 && c.y >= 0 && c.y + c.h <= c.vh + 0.5, `${etiqueta}: el panel cabe en la pantalla (${Math.round(c.w)}×${Math.round(c.h)} en ${c.vw}×${c.vh})`);
  bien(c.h / c.vh <= maxFrac, `${etiqueta}: el panel ocupa ${Math.round(100 * c.h / c.vh)} % del alto (tope ${Math.round(100 * maxFrac)} %)`);
}
const URLP = '?semilla=4242&hombres=5000';

/* ---------- 390×844 ---------- */
{
  console.log('\n== vertical 390×844 ==');
  const { ctx, page } = await abrir(URL0 + URLP, 390, 844), A = ayudas(page), { g, foto, pulsa } = A;
  bien(await g('desplegando') === true, 'al cargar se está desplegando');
  const est = await g('estado'); bien(est.t === 0 && est.fase === 'lejos', 'la batalla no ha empezado (t = ' + est.t + ')');
  const vis = await page.evaluate(() => ({ plan: !document.getElementById('plan').hidden, mando: !document.getElementById('mando').hidden, arriba: !document.getElementById('arriba').hidden }));
  bien(vis.plan && !vis.mando && !vis.arriba, 'se ve el plan; no se ven las órdenes ni los botones de arriba');
  const textos = await page.evaluate(() => [...document.querySelectorAll('.pend')].map(d => d.firstChild.textContent));
  bien(textos.length === 3 && textos.every(t => /^[a-zA-ZáéíóúñÁÉÍÓÚ]+$/.test(t)), 'los carteles enemigos dicen el nombre de la tropa: ' + textos.join(', '));
  await revisa(page, A, 'pestaña Formación', 0.5);
  await foto('vertical-1-despliegue');
  const f0 = await g('files');
  for (const i of [0, 1, 2]) await pulsa(`[data-f="${i}:ancho"]`);
  const f1 = await g('files'), p1 = await g('plan');
  bien(f1.every((f, i) => f > f0[i]), `tocar «Ancho» en los tres cuerpos cambia los hombres por fila: ${f0} → ${f1}`);
  bien(p1.fondo.every(f => f === 'ancho'), 'el plan guarda «ancho» en los tres cuerpos');
  const an = await g('anchos'); const xs = await g('xs'); bien(xs[1] - xs[0] >= (an[0] + an[1]) / 2 && xs[2] - xs[1] >= (an[1] + an[2]) / 2, `los cuerpos no se montan: anchos ${an.map(Math.round)}, centros ${xs.map(Math.round)}`);
  await foto('vertical-2-todo-ancho');
  await pulsa('[data-f="1:hondo"]'); const f2 = await g('files'); bien(f2[1] < f1[1] && f2[0] === f1[0], `«Hondo» en el centro lo hace más hondo y no toca las alas: ${f1} → ${f2}`);
  const an2 = await g('anchos'), xs2 = await g('xs'); bien(xs2[1] - xs2[0] >= (an2[0] + an2[1]) / 2 && xs2[2] - xs2[1] >= (an2[1] + an2[2]) / 2, 'con el centro hondo tampoco se montan');
  await pulsa('.pest[data-t="plan"]'); await revisa(page, A, 'pestaña Plan', 0.5);
  await pulsa('[data-d="centro-atras"]'); const d1 = await g('estado'); bien((await g('plan')).disposicion === 'centro-atras' && d1.dist[1] > d1.dist[0], `Centro atrás: el centro sale más lejos (${d1.dist})`);
  await foto('vertical-3-hondo-centro-atras');
  await pulsa('[data-c="derecha"]'); bien((await g('plan')).caballeria === 'derecha', 'el plan guarda la caballería en el ala derecha');
  await revisa(page, A, 'pestaña Plan con caballería', 0.5);
  await foto('vertical-4-plan-caballeria-derecha');
  await pulsa('[data-v="0"]'); bien((await g('plan')).velites === false, 'el plan guarda «sin vélites delante»'); await pulsa('[data-v="1"]');
  /* todo ancho y a marchar */
  await g('planear', { fondo: 'ancho', disposicion: 'recta', caballeria: 'reserva', velites: true });
  await pulsa('.pest[data-t="formacion"]'); await pulsa('#marchar');
  bien(await g('desplegando') === false, 'tras «Marchar» ya no se está desplegando');
  const v2 = await page.evaluate(() => ({ plan: !document.getElementById('plan').hidden, mando: !document.getElementById('mando').hidden, arriba: !document.getElementById('arriba').hidden, cinta: document.getElementById('cinta').textContent }));
  bien(!v2.plan && v2.mando && v2.arriba && /Se acercan/.test(v2.cinta), 'tras «Marchar» se ven las órdenes y la cinta «' + v2.cinta + '»');
  await espera(page, 3000); const e3 = await g('estado'); bien(e3.t > 0.3, 'el tiempo corre tras «Marchar» (t = ' + e3.t.toFixed(1) + ')');
  await g('salta', Math.max(0, 10 - e3.t)); await foto('vertical-5-diez-segundos');
  await ctx.close();
}
/* ---------- ?directo=1 ---------- */
{
  console.log('\n== con ?directo=1 ==');
  const { ctx, page } = await abrir(URL0 + '?directo=1&semilla=4242&hombres=5000', 390, 844), { g } = ayudas(page);
  bien(await g('desplegando') === false, 'con directo=1 no hay despliegue');
  const v = await page.evaluate(() => ({ plan: !document.getElementById('plan').hidden, mando: !document.getElementById('mando').hidden }));
  bien(!v.plan && v.mando, 'con directo=1 se ve el mando y no el plan'); await espera(page, 2500); bien((await g('estado')).t > 0.3, 'con directo=1 el tiempo corre solo');
  await ctx.close();
}
/* ---------- 844×390 ---------- */
{
  console.log('\n== horizontal 844×390 ==');
  const { ctx, page } = await abrir(URL0 + URLP, 844, 390), A = ayudas(page), { g, foto, pulsa } = A;
  for (const i of [0, 1, 2]) await pulsa(`[data-f="${i}:ancho"]`);
  await revisa(page, A, 'horizontal, pestaña Formación', 0.5); await foto('horizontal-6-despliegue-ancho');
  await pulsa('.pest[data-t="plan"]'); await revisa(page, A, 'horizontal, pestaña Plan', 0.5); await foto('horizontal-6b-plan');
  await pulsa('#marchar');
  await page.evaluate(() => { const G = window.__gc; let n = 0; while (!G.B.sect.every(s => !G.R.lejos(s)) && G.B.fase !== 'fin' && n++ < 4000) G.salta(0.25); G.salta(12); G.mirar(-1, 0); });
  await foto('horizontal-7-batalla-ancho');
  await ctx.close();
}
console.log(errores.length ? 'NO APTO · ' + errores.length + ' fallos:\n' + errores.join('\n') : 'APTO · sin errores de consola');
await br.close(); srv.close(); process.exit(errores.length ? 1 : 0);
