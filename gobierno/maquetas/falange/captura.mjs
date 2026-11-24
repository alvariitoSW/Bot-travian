// Falange a pie (TP7a): la sintagma de Pirro contra un manípulo romano. Deja las capturas en gobierno/capturas-tarea/TP7a-*
// y falla si algo no cuadra o hay errores de consola. Parte del de a-pie (TP1).
// Uso:  node gobierno/maquetas/falange/captura.mjs                    -> todo (dpr 2)
//       node gobierno/maquetas/falange/captura.mjs dpr=1 solo=marcha,choque -> solo esas fotos
//       node gobierno/maquetas/falange/captura.mjs dpr=1 parte=medidas  -> solo las cifras (partida, astas, patinaje)
//       node gobierno/maquetas/falange/captura.mjs dpr=1 parte=loco     -> TP8b-P2: los dos bots (a lo loco pierde; bien gana en 60–110 s)
//       node gobierno/maquetas/falange/captura.mjs --servir             -> solo sirve la página
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8384 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/falange/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = join(SALIDA, (op.pref || 'TP7a') + '-'), errores = [], COSTE = [];
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
function escucha(page) {
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
const lista = page => page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });
const V = [390, 844], Hz = [844, 390];
async function abre(q, w, h, d = dpr) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + q + (q.includes('?') ? '&' : '?') + 'antiguo=1'); await lista(page); await page.waitForTimeout(1500); return { ctx, page };
}
async function botones(page, nombre, w, h) {
  const cajas = await page.evaluate(() => [...document.querySelectorAll('.boton,.pildora,.gordo')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return { id: b.id, l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height, w: r.width }; }));
  bien(cajas.every(c => c.l >= 0 && c.r <= w && c.t >= 0 && c.b <= h && c.h >= 44 && c.w >= 44), `${nombre}: los botones caben enteros y miden al menos 44 px (${cajas.map(c => c.id).join(', ')})`);
  bien(cajas.filter(c => c.id !== 'otra').every(c => c.t > h * 0.55 || c.b < h * 0.2), `${nombre}: ningún botón tapa el centro`);
}
async function foto(fase, nombre, w, h, extra = '') {
  const { ctx, page } = await abre('?fase=' + fase + extra, w, h);
  const info = await page.evaluate(() => { const r = window.__tp.renderer.info.render; return { calls: r.calls, tri: r.triangles }; });
  const e = await page.evaluate(() => ({ ...window.__tp.estado(), pant: window.__tp.enPantalla(), astas: window.__tp.astas(), minAstas: window.__tp.astasMin(), arriba: document.getElementById('nos').textContent + ' | ' + document.getElementById('ellos').textContent }));
  COSTE.push({ nombre, calls: info.calls, tri: info.tri });
  await botones(page, nombre, w, h);
  await page.screenshot({ path: prefijo + nombre + '.jpg', type: 'jpeg', quality: 84, timeout: 240000 });
  console.log(`${nombre}: ${info.calls} llamadas, ${Math.round(info.tri / 1000)} mil triángulos, fase ${e.fase}, picas ${e.kFrente}, cinta «${e.cinta}», arriba «${e.arriba}»; astas: separación mínima entre ejes ${e.minAstas.min} m (${e.minAstas.par}; grosor ${e.minAstas.grosor})`);
  bien(e.minAstas.min > e.minAstas.grosor, `${nombre}: ninguna sarisa atraviesa a otra (mínimo ${e.minAstas.min} m > ${e.minAstas.grosor})`);
  await ctx.close(); return { ...e, info };
}
/* el paso a picas abajo: cinco fotogramas juntos en una tira */
async function tiraBajar() {
  const fotos = [], ts = [0.1, 0.5, 0.9, 1.4, 2.4];
  for (const t of ts) { const { ctx, page } = await abre('?fase=bajar&t=' + t, ...V, 1); fotos.push((await page.screenshot({ type: 'jpeg', quality: 80, timeout: 240000 })).toString('base64')); await ctx.close(); }
  const p = await br.newPage({ viewport: { width: 1950, height: 844 } });
  await p.setContent('<body style="margin:0;background:#222;display:flex;font:22px sans-serif;color:#fff">' + fotos.map((f, i) => `<div style="position:relative"><img src="data:image/jpeg;base64,${f}" style="display:block;width:390px"><span style="position:absolute;left:8px;top:120px;background:#000a;padding:2px 6px">${ts[i]} s</span></div>`).join('') + '</body>');
  await p.screenshot({ path: prefijo + 'tira-picas-abajo.jpg', type: 'jpeg', quality: 82 }); await p.close();
  console.log('  tira: ' + prefijo + 'tira-picas-abajo.jpg');
}
async function medidas() {
  const { ctx, page } = await abre('', ...V, 1);
  const r = await page.evaluate(() => { const t = window.__tp; t.parar(true); return { bot: t.partida(true), nada: t.partida(false), fAlzadas: t.patinaje('f', 'alzadas', 4), fBajas: t.patinaje('f', 'bajas', 4), rAnda: t.patinaje('r', 'anda', 4, 90) }; });
  const a = await page.evaluate(() => { const t = window.__tp; t.parar(true); t.salta(1, false); t.orden('avanzar'); t.salta(3, false); const x = t.astas(); t.orden('picas'); t.salta(3, false); return { alzadas: x, bajas: t.astas() }; });
  await ctx.close();
  console.log('  partida con órdenes: ' + JSON.stringify(r.bot)); console.log('  partida sin órdenes: ' + JSON.stringify(r.nada));
  bien(r.bot.fin && r.bot.ganador && r.bot.porRuptura, `la partida entera acaba con ganador por ruptura (con órdenes: gana ${r.bot.ganador} en ${r.bot.segundos} s; bajas ${r.bot.bajasF} tuyos y ${r.bot.bajasR} romanos)`);
  bien(r.nada.fin && r.nada.porRuptura, `sin órdenes también acaba por ruptura (gana ${r.nada.ganador} en ${r.nada.segundos} s)`);
  bien(r.bot.ganador === 'falange' && r.nada.ganador === 'romanos', 'las órdenes cuentan: bien mandada gana la falange; sin bajar las picas, rompe');
  bien(r.bot.pila.filter(x => x === 2).length >= 3, `pila clavados en el bosque de astas: ${r.bot.pila.filter(x => x === 2).length}; en escudos ${r.bot.pila.filter(x => x === 3).length}; en hombres ${r.bot.pila.filter(x => x === 4).length}; al suelo ${r.bot.pila.filter(x => x === 5).length}`);
  /* los romanos arrancan de quietos a los 1,5 s: se mide desde 1,5 s después, como a los falangitas tras su orden */
  for (const k of ['fAlzadas', 'fBajas', 'rAnda']) bien(r[k].media <= 5 && r[k].apoyos > 20, `patinaje ${k}: media ${r[k].media} cm por apoyo (peor ${r[k].peor}; ${r[k].apoyos} apoyos; tope 5)`);
  bien(r.fAlzadas.dispersion >= 0.3, `los pasos no van a la vez (dispersión ${r.fAlzadas.dispersion})`);
  bien(a.alzadas.dispersion >= 0.5 && a.alzadas.separacion > 1 && a.bajas.separacion > 0.3, `las astas no van todas a la vez: dispersión de fase ${a.alzadas.dispersion}; separación media ${a.alzadas.separacion}° alzadas y ${a.bajas.separacion}° bajadas`);
  return { r, a };
}
/* TP8b-P2: la partida entera (tiempo de la escena, sin dibujar) con dos bots: a lo loco debe perder; bien mandada, ganar en 60–110 s */
async function loco() {
  const { ctx, page } = await abre('', ...V, 1);
  const r = await page.evaluate(() => { const t = window.__tp; t.parar(true); return { loco: t.partida('loco'), bien: t.partida('bien') }; });
  await ctx.close();
  for (const k of ['loco', 'bien']) console.log(`  bot «${k}»: gana ${r[k].ganador}; rompe a los ${r[k].tRoto} s; terreno ${r[k].ganado} m; cohesión ${r[k].coh}; bajas ${r[k].bajasF} tuyos y ${r[k].bajasR} romanos; golpes ${r[k].golpes.buenos} al compás y ${r[k].golpes.parados} a destiempo`);
  bien(r.loco.fin && r.loco.ganador === 'romanos', `a lo loco pierde (gana ${r.loco.ganador} a los ${r.loco.tRoto} s)`);
  bien(r.bien.ganador === 'falange' && r.bien.tRoto >= 60 && r.bien.tRoto <= 110, `bien mandada gana entre 60 y 110 s (${r.bien.ganador} a los ${r.bien.tRoto} s)`);
}
const LOCO = op.parte === 'loco';
if (LOCO || (!op.solo && !op.parte)) await loco();
const med = !LOCO && (op.parte === 'medidas' || !op.solo) ? await medidas() : null;
if (op.parte !== 'medidas' && !LOCO) {
  const fases = op.solo ? op.solo.split(',').filter(f => f !== 'tira') : ['marcha', 'astas', 'pila', 'choque', 'golpe', 'huida', 'final', 'choque-h'];
  for (const f of fases) {
    /* TP8b: alias de foto: bajan (a media ola) y lado (de costado, horizontal) */
    const ALIAS = { bajan: ['bajar', '&t=0.55'], lado: ['caidos', '&lado=1'] }, base = f.replace(/-h$/, ''), hz = f.endsWith('-h') || f === 'lado', [fa, extra] = ALIAS[base] || [base, ''];
    const e = await foto(fa, f === 'lado' ? 'lado' : (hz ? 'h-' : 'v-') + base, ...(hz ? Hz : V), extra);
    if (fa === 'marcha') bien(e.kFrente === 0 && e.kB.every(k => k === 0), 'marcha: todas las picas alzadas');
    if (fa === 'pila') bien(e.pila.some(x => x === 1), 'pila: la salva está en el aire o llegando');
    if (fa === 'choque') bien(e.choque && e.kFrente > 0.9, 'choque: los romanos contra el muro de puntas, picas abajo (' + e.kFrente + ')');
    if (fa === 'golpe') bien(/golpe|Parado|herido|Estocada|destiempo/i.test(e.cinta), 'golpe: respuesta en palabras («' + e.cinta + '»)');
    if (fa === 'huida') bien(!!e.ganador, 'huida: alguien rompe y huye (' + e.ganador + ')');
    if (fa === 'final') bien(e.fase === 'fin', 'final: tarjeta con veredicto');
    if (['choque', 'golpe'].includes(fa)) { const c = e.info; bien(c.calls <= 30 && c.tri <= 750000, `${f}: ${c.calls} llamadas de dibujo (tope 30) y ${Math.round(c.tri / 1000)} mil triángulos (tope 750)`); }
    bien(/en pie · (firme|duda|rompe) · (fresca|cansada|agotada) · (ganando|igualado|perdiendo)/.test(e.arriba), `${f}: estado en palabras arriba («${e.arriba}»)`);
  }
  if (!op.solo || op.solo.includes('tira')) await tiraBajar();
}
console.log('Coste: ' + COSTE.map(c => `${c.nombre} ${c.calls} llamadas, ${Math.round(c.tri / 1000)} mil tri`).join(' · '));
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO\n' + errores.join('\n') : 'APTO');
process.exit(errores.length ? 1 : 0);
