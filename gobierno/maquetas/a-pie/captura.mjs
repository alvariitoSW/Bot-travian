// Escena a pie (TP1): une A (testudo-pilum-a) y B (testudo-lucha) en piezas, con el andar y el correr nuevos.
// TP1b: el centurión, las cuatro órdenes, el estado en palabras, tu duelo y quién rompe (parte=tp1b, o todo).
// Deja las capturas en gobierno/capturas-tarea/TP1b-* y falla si algo no cuadra o hay errores de consola.
// Uso:  node gobierno/maquetas/a-pie/captura.mjs                 -> todo: fases de A, la lucha de B, tiras de costado, medidas del paso
//       node gobierno/maquetas/a-pie/captura.mjs dpr=1 parte=tp1b  -> solo lo de TP1b
//       node gobierno/maquetas/a-pie/captura.mjs dpr=1 parte=pies  -> solo medidas del paso y tiras (rápido, para iterar)
//       node gobierno/maquetas/a-pie/captura.mjs dpr=1 solo=lucha,carga -> solo esas fotos
//       node gobierno/maquetas/a-pie/captura.mjs dpr=1 parte=loco    -> TP8b-L2: dos bots en tu duelo (a lo loco y bien), solo cifras
//       node gobierno/maquetas/a-pie/captura.mjs dpr=1 parte=duelo etiqueta=L2 [vert=1] -> TP8b-L2-{1..6} (o TP8b-L2-v-{1..3} en vertical)
//       node gobierno/maquetas/a-pie/captura.mjs --servir          -> solo sirve la página (puerto 8384)
// Medidas del paso: mientras un pie es el más bajo (apoyado), cuánto se desliza; media y peor por apoyo, en cm,
// andando y corriendo, romanos y galos, con el andar de A (?antes=1) y con el nuevo. Objetivo: media de 3 cm o menos.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { M, YO } from './formacion.js';   /* TP8b-F1: las cifras de la escena, no fijas */
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.mp3': 'audio/mpeg', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8384 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/a-pie/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'TP1b-'), errores = [];
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
const entre = (v, a, b) => v >= a && v <= b, COSTE = [];
function escucha(page) {
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
const lista = page => page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });

async function foto(fase, nombre, w, h, pre = prefijo, antesFoto = null) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + (fase ? '?fase=' + fase : '')); await lista(page); if (antesFoto) await page.evaluate(antesFoto); await page.waitForTimeout(1500);
  const info = await page.evaluate(() => { const r = window.__tp.renderer.info.render; return { calls: r.calls, tri: r.triangles }; });   /* GM43e: coste del último fotograma (con la pasada de sombras) */
  const e = await page.evaluate(() => ({ ...window.__tp.estado(), cuadro: window.__tp.encuadre(), yo: window.__tp.medidas(2), detras: window.__tp.medidas(9), gesto: window.__tp.gesto(), galos: window.__tp.galos(), medidor: window.__tp.medidor(), lucha: window.__tp.lucha(), duelo: window.__tp.duelo(), bandos: window.__tp.bandos(), primera: window.__tp.primera(), textos: ['est-r', 'est-g', 'cinta', 'eco', 'fin-t', 'fin-p'].map(id => document.getElementById(id).textContent), fin: !document.getElementById('fin').hidden }));
  COSTE.push(`${nombre}: ${info.calls} llamadas, ${Math.round(info.tri / 1000)} mil triángulos`); e.calls = info.calls; e.tri = info.tri; if (/carga|lucha|final/.test(fase || '') && info.calls > 61) console.log(`  AVISO: ${nombre} pasa de 61 llamadas de dibujo (${info.calls})`);
  const cajas = e.cajas = await page.evaluate(() => [...document.querySelectorAll('.boton,.pildora,.gordo')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return { id: b.id, l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height }; }));
  bien(cajas.every(c => c.l >= 0 && c.r <= w && c.t >= 0 && c.b <= h && c.h >= 44), `${nombre}: los botones caben enteros y miden al menos 44 px (${cajas.map(c => c.id).join(', ')})`);
  bien(cajas.filter(c => c.id !== 'otra').every(c => c.t > h * 0.55 || c.b < h * 0.2), `${nombre}: ningún botón tapa el centro`);
  await page.screenshot({ path: (nombre.startsWith('_') ? join(tmpdir(), 'TP1' + nombre) : pre + nombre) + '.jpg', type: 'jpeg', quality: 84, timeout: 240000 });
  console.log(`${nombre}: ${info.calls} llamadas, ${Math.round(info.tri / 1000)} mil triángulos, k ${e.k.toFixed(2)}, ${e.vivos} en pie, fase ${e.fase}, tu cabeza en (${e.cuadro.yo.x}, ${e.cuadro.yo.y}), compañero en (${e.cuadro.comp.x}, ${e.cuadro.comp.y}), rendija de ${e.cuadro.techo.y} a ${e.cuadro.muro.y}, enemigo en (${e.cuadro.enemigo.x}, ${e.cuadro.enemigo.y})`);
  await ctx.close(); return e;
}
/* el encuadre «de Ryse»: tú a la izquierda, tu compañero a la derecha y, entre el canto del techo y el del muro, el enemigo */
function encuadre(e, nombre, vertical) {
  const c = e.cuadro;
  bien(entre(c.yo.x, 0.05, 0.42) && entre(c.yo.y, 0.25, 0.8), `${nombre}: tu soldado queda a la izquierda y dentro de cuadro`);
  bien(entre(c.comp.x, 0.58, 0.95), `${nombre}: tu compañero queda a la derecha`);
  bien(c.enemigo.delante && entre(c.enemigo.x, 0.3, 0.7) && c.enemigo.y > c.techo.y + 0.02 && c.enemigo.y < c.muro.y - 0.02, `${nombre}: el enemigo se ve por la rendija, entre el techo y el muro`);
  bien(c.techo.y < (vertical ? 0.3 : 0.36), `${nombre}: el techo ocupa menos de un tercio de la pantalla (${(c.techo.y * 100).toFixed(0)} %)`);
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  /* en el muro el brazo no da más de sí: la mano queda unos 11 cm detrás del asa, en la línea de la cámara (no se nota) */
  bien(d(e.yo.manoI, e.yo.escudo) < 0.13 && d(e.detras.manoI, e.detras.escudo) < 0.08, `${nombre}: la mano llega al asa del escudo (muro a ${(d(e.yo.manoI, e.yo.escudo) * 100).toFixed(0)} cm, techo a ${(d(e.detras.manoI, e.detras.escudo) * 100).toFixed(0)} cm)`);
  bien(entre(e.yo.cabeza[1], 1.45, 1.8) && e.detras.escudo[1] - e.yo.cabeza[1] > 0.25, `${nombre}: tu cabeza va agachada bajo el techo (a ${e.yo.cabeza[1].toFixed(2)} m; el techo, a ${e.detras.escudo[1].toFixed(2)} m)`);
}

const V = [390, 844], Hz = [844, 390];
/* ---------- TP1 · el paso: medidas de patinaje y «a la vez», antes (andar de A) y ahora ---------- */
async function medidasPaso() {
  const out = {};
  for (const antes of [true, false]) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage(); escucha(page);
    await page.goto(URL0 + (antes ? '?antes=1' : '')); await lista(page);
    out[antes ? 'antes' : 'ahora'] = await page.evaluate(() => { const t = window.__tp; t.parar(true); return { rAnda: t.patinaje('r', 'anda', 4), rCorre: t.patinaje('r', 'corre', 3), rTestudo: t.patinaje('r', 'testudo', 4), rPaso: t.patinaje('r', 'paso', 9), gAnda: t.patinaje('g', 'anda', 3), gCorre: t.patinaje('g', 'corre', 3) }; });
    await ctx.close();
  }
  for (const k of Object.keys(out.ahora)) { const a = out.antes[k], b = out.ahora[k]; console.log(`  ${k}: patina ${a.media} cm de media (peor ${a.peor}) con el andar de A -> ${b.media} cm (90 % por debajo de ${b.p90}, peor ${b.peor}; ${b.apoyos} apoyos); fases ${a.dispersion} -> ${b.dispersion}`); }
  for (const k of ['rAnda', 'rCorre', 'gAnda', 'gCorre']) bien(out.ahora[k].media <= 5 && out.ahora[k].apoyos > 20, `paso ${k}: los pies no patinan (media ${out.ahora[k].media} cm por apoyo; objetivo 3, se admite hasta 5)`);
  bien(out.ahora.rTestudo.media <= 5, `paso en testudo: media ${out.ahora.rTestudo.media} cm (objetivo 3, se admite hasta 5)`);
  bien(out.ahora.rAnda.dispersion >= 0.3 && out.ahora.gCorre.dispersion >= 0.3, `paso: no van todos a la vez (dispersión de fases ${out.ahora.rAnda.dispersion} romanos, ${out.ahora.gCorre.dispersion} galos)`);
  return out;
}
/* tira de 5 fotogramas de costado, en horizontal, juntados en una sola imagen */
async function tira(nombre, quien, modo, tiempos) {
  const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + '?costado=' + quien); await lista(page); await page.waitForTimeout(800);
  const fotos = [], notas = [];
  for (const t of tiempos) { const r = await page.evaluate(([q, m, t]) => window.__tp.tira(q, m, t), [quien, modo, t]); await page.waitForTimeout(900); fotos.push((await page.screenshot({ type: 'jpeg', quality: 80, timeout: 240000 })).toString('base64')); notas.push(`${t.toFixed(2)} s · ${r.v} m/s · modo ${r.g} · fase ${r.fase} · inclina ${r.inclina}`); }
  await ctx.close();
  const p = await br.newPage({ viewport: { width: 844, height: 400 } });
  await p.setContent('<body style="margin:0;background:#222;font:14px sans-serif;color:#fff">' + fotos.map((f, i) => `<div style="position:relative"><img src="data:image/jpeg;base64,${f}" style="display:block;width:844px"><span style="position:absolute;left:8px;top:6px;background:#000a;padding:2px 6px">${i + 1} · ${notas[i]}</span></div>`).join('') + '</body>');
  await p.screenshot({ path: prefijo + 'tira-' + nombre + '.jpg', type: 'jpeg', quality: 82, fullPage: true }); await p.close();
  console.log(`  tira ${nombre}: ${prefijo}tira-${nombre}.jpg (${notas.join(' | ')})`);
}
async function tiras() {
  await tira('romanos-andar', 'r', 'anda', [3.0, 3.15, 3.3, 3.45, 3.6]);
  await tira('romanos-correr', 'r', 'corre', [3.0, 3.08, 3.16, 3.24, 3.32]);
  await tira('romanos-cambios', 'r', 'paso', [0.9, 1.6, 4.3, 6.8, 8.2]);
  await tira('galos-correr', 'g', 'corre', [2.6, 2.68, 2.76, 2.84, 2.92]);
}
/* ---------- TP1b · el centurión, las cuatro órdenes, el estado en palabras, tu duelo y quién rompe ---------- */
/* el jugador que juega bien: para cuando el galo arma (marcado), estoca cuando queda abierto y releva cada 9 s */
const BOT = `(() => { const t = window.__tp, S = t.S; let ult = S.T; for (let i = 0; i < 30 * 150 && S.fase !== 'fin'; i++) { t.salta(1 / 30); const y = S.yo, d = y && y.duelo;
  if (!S.huida && !S.derrota && d && d.activo) { if (d.aviso && d.t0 > 0 && S.T > d.ts - 0.45 && S.T < d.ts && S.T - S.tParar > 0.9) S.pide = 'parar'; else if (S.T < (d.abierto || 0) && !t.duelo().ocupado) S.pide = 'estocada'; }
  if (S.choque && !S.huida && S.T - ult > 9) { ult = S.T; t.ordena('relevo'); } } t.salta(0.5); return { ...t.bandos(), fase: S.fase }; })()`;
async function tp1b() {
  const dentro = (p, m = 0.02) => p.delante && entre(p.x, m, 1 - m) && entre(p.y, m, 1 - m);
  const ORD = ['escudos', 'accion', 'cargad', 'relevo'], mide = (e, n) => { const c = e.cajas.filter(c => ORD.includes(c.id)); bien(c.length === 4 && c.every(c => c.h >= 44), `${n}: las cuatro órdenes (Escudos, Pila, Cargad, Relevo) a la vista y de 44 px o más (${c.map(c => c.id + ' ' + Math.round(c.h)).join(', ')})`); };
  const palabra = /en pie · (firme|duda|rompe) · (fresca|cansada|agotada) · (ganando|igualado|perdiendo|sin trabar)/;
  let e = await foto('avance', 'centurion', ...V);
  bien(dentro(e.duelo.cresta), `centurión: su cresta se ve desde tu cámara (en ${e.duelo.cresta.x}, ${e.duelo.cresta.y})`); mide(e, 'marcha');
  bien(palabra.test(e.textos[0]) && palabra.test(e.textos[1]), `estado en palabras, tuyos y galos: «${e.textos[0]}» / «${e.textos[1]}»`);
  e = await foto('avance&vista=fuera', 'centurion-fuera', ...V); bien(dentro(e.duelo.cresta), 'centurión desde fuera: cresta roja transversal en el casco');
  e = await foto('aviso', 'aviso', ...V); mide(e, 'lucha');
  bien(e.duelo.arma && e.duelo.aro && e.duelo.centurion, `aviso: tu rival arma el golpe y se marca (faltan ${e.duelo.tAviso} s)`);
  bien(e.calls <= 40, `lucha: ${e.calls} llamadas de dibujo (tope 40), ${Math.round(e.tri / 1000)} mil triángulos`);
  bien(palabra.test(e.textos[0]) && /igualado|ganando|perdiendo/.test(e.textos[0]), `lucha: estado en palabras «${e.textos[0]}»`);
  e = await foto('parada', 'parada', ...V); bien(/Parado/.test(e.duelo.eco) && e.duelo.abierto && e.duelo.heridas === 0, `parada: «${e.duelo.eco}» y el galo queda abierto`);
  e = await foto('estocada', 'estocada', ...V); bien(/Buen golpe/.test(e.duelo.eco), `estocada: tras parar, tu golpe entra («${e.duelo.eco}»)`);
  e = await foto('aviso', 'herido', ...V, prefijo, () => { const t = window.__tp, S = t.S; for (let i = 0; i < 90 && !/Herido/.test(S.eco ? S.eco.texto : ''); i++) t.salta(1 / 30); t.salta(0.2); });
  bien(/Herido/.test(e.duelo.eco) && e.duelo.heridas >= 1, `si no paras, te hiere («${e.duelo.eco}»)`);
  e = await foto('relevo', 'relevo', ...V);
  { const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage(); escucha(page);
    await page.goto(URL0 + '?fase=lucha'); await lista(page);
    const r = await page.evaluate(() => { const t = window.__tp, S = t.S; t.parar(true); t.salta(1.5); const a = t.primera(), fa = +S.unidad.fatiga.toFixed(3); t.ordena('relevo'); t.salta(2.5); return { a, b: t.primera(), fa, fb: +S.unidad.fatiga.toFixed(3), yo: S.yo.i }; });
    const cambian = r.a.filter((x, i) => x !== r.b[i]).length;
    bien(cambian >= r.a.length - 2 && r.b.includes(r.yo) && r.fb < r.fa, `«Relevo»: entra la fila fresca (primera fila ${r.a.join(',')} -> ${r.b.join(',')}; tú sigues delante; fatiga ${r.fa} -> ${r.fb})`);
    await ctx.close(); }
  /* «Escudos» en la lucha: aguanta (te matan menos) y cansa al galo */
  for (const muro of [false, true]) {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage(); escucha(page);
    await page.goto(URL0 + '?fase=lucha'); await lista(page);
    const r = await page.evaluate(m => { const t = window.__tp, S = t.S; t.parar(true); if (m) t.ordena('escudos'); const v0 = S.romanos.filter(h => h.vivo).length; t.salta(12); return { muro: S.muro, bajas: v0 - S.romanos.filter(h => h.vivo).length, fatigaG: +S.unidadG.fatiga.toFixed(2) }; }, muro);
    (muro ? (x => { bien(x.muro && x.fatigaG > tp1b.sin.fatigaG + 0.15 && x.bajas <= tp1b.sin.bajas, `«Escudos» en la lucha: 12 s tras la madera, ${x.bajas} bajas tuyas (sin escudos ${tp1b.sin.bajas}) y el galo se cansa (fatiga ${x.fatigaG}; sin escudos ${tp1b.sin.fatigaG})`); }) : (x => { tp1b.sin = x; }))(r);
    await ctx.close();
  }
  e = await foto('caido', 'caido', ...V);
  bien(!e.duelo.centurion && e.duelo.vivo && e.duelo.yo !== YO && /El centurión ha caído: ahora eres/.test(e.textos[2]), `caído: «${e.textos[2]}» (ahora eres el n.º ${e.duelo.yo}) y sigues en tu duelo`);
  e = await foto('caido', 'caido-orden', ...V, prefijo, () => { const t = window.__tp; t.ordena('relevo'); t.salta(0.3); });
  bien(/tardan/.test(e.textos[2]), `sin centurión las órdenes tardan («${e.textos[2]}»)`);
  e = await foto('huida', 'huida', ...V); bien(e.bandos.ruptura === 'galos' && e.bandos.huyen >= 3, `huida: los galos rompen y ${e.bandos.huyen} huyen corriendo`);
  e = await foto('lucha', 'tarjeta', ...V, prefijo, BOT);
  bien(e.fin && e.bandos.ruptura === 'galos' && /^Victoria/.test(e.textos[4]) && new RegExp(`Bajas: \\d+ de tus ${M} hombres; \\d+ de \\d+ galos`).test(e.textos[5]), `partida jugando bien: gana quien rompe — «${e.textos[4]}»: ${e.textos[5]}`);
  /* y jugando sin tocar nada también acaba, con un bando roto */
  { const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage(); escucha(page);
    await page.goto(URL0 + '?fase=lucha'); await lista(page);
    const r = await page.evaluate(() => { const t = window.__tp, S = t.S; t.parar(true); for (let i = 0; i < 1500 && S.fase !== 'fin'; i++) t.salta(0.1); return { fase: S.fase, ...t.bandos() }; });
    bien(r.fase === 'fin' && !!r.ruptura, `partida sin tocar nada: acaba con un bando roto (${r.ruptura}, «${r.veredicto}», a los ${(r.T - r.tChoque).toFixed(0)} s del choque)`);
    await ctx.close(); }
  e = await foto('aviso', 'h-aviso', ...Hz); mide(e, 'lucha horizontal');
}
if (op.parte === 'tp1b') { await tp1b(); await br.close(); srv.close(); console.log('\nCoste:\n  ' + COSTE.join('\n  ')); console.log(errores.length ? '\nNO APTO\n' + errores.join('\n') : '\nAPTO (TP1b)'); process.exit(errores.length ? 1 : 0); }
/* TP8b-L1 · tu duelo en seis fotogramas, en horizontal (844×390): aviso empezando, aviso a punto, parada, galo abierto,
   estocada entrando, galo doblado. dpr=1 parte=duelo etiqueta=antes|despues; con finta=1, tres de la finta (armar, aguanta, golpe) */
/* TP8b-L2 · pulsar a lo loco pierde: un bot pulsa «Estocada» cada 0,25 s; otro para en la ventana y golpea con el galo abierto.
   Sin fotos: la escena avanza a saltos (como ?fase=) hasta que acaba la lucha o pasan 150 s */
if (op.parte === 'loco') {
  const corre = async (modo, aguanta) => {
    const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
    await page.goto(URL0 + '?fase=lucha'); await lista(page);
    const r = await page.evaluate(([modo, aguanta]) => { const t = window.__tp, S = t.S; t.parar(true); let tPide = -9, primera = null, tRompe = null; const t0 = S.T, R0 = S.romanos.filter(h => h.vivo).length, G0 = S.galos.filter(g => g.vivo).length;
      for (let i = 0; i < 30 * 150 && S.fase !== 'fin'; i++) {
        const y = S.yo, d = y && y.duelo;
        if (!S.huida && !S.derrota && d && d.activo && y.vivo) {
          if (modo === 'loco') { if (S.T - tPide >= 0.25) { tPide = S.T; S.pide = 'estocada'; } }
          else { const ven = S.roto ? 0.18 : 0.45; if (d.aviso && d.t0 > 0 && !d.imparable && S.T > d.ts - Math.min(0.3, ven - 0.05) && S.T < d.ts && S.T - S.tParar > 0.8) S.pide = 'parar'; else if ((S.T < (d.abierto || 0) || S.T < (d.deseq || 0)) && !t.duelo().ocupado && S.fuelleY >= 30) S.pide = 'estocada'; }
        }
        if (aguanta) { S.unidad.animo = Math.max(S.unidad.animo, 0.35); S.unidadG.animo = Math.max(S.unidadG.animo, 0.35); }   /* solo el duelo: que la lucha no acabe antes */
        t.salta(1 / 30);
        if (primera === null && S.misCaidas >= 1) primera = { muertes: S.misMuertes, seg: +(S.T - t0).toFixed(1) }; if (tRompe === null && S.ruptura) tRompe = +(S.T - t0).toFixed(1);
        if (aguanta && (S.misCaidas >= 1 || S.misMuertes >= 2 || S.T - t0 > 90)) break;
      }
      return { modo, aguanta, tRompe, refuerzos: S.nRefuerzos || 0, primeraCaida: primera, muertes: S.misMuertes, caidas: S.misCaidas, ruptura: S.ruptura || 'ninguna', animoR: +S.unidad.animo.toFixed(2), animoG: +S.unidadG.animo.toFixed(2), bajasR: R0 - S.romanos.filter(h => h.vivo).length, bajasG: S.unidadG.hombres - S.unidadG.enPie, seg: +(S.T - t0).toFixed(1) };
    }, [modo, aguanta]);
    await ctx.close(); console.log('  ' + JSON.stringify(r)); return r;
  };
  /* primero el duelo solo (el ánimo de los bandos sujeto, para que la lucha no acabe antes); luego la lucha entera, sin tocar */
  /* TP8b-L3: la lucha entera, sin sostener el ánimo: jugando bien dura y se gana; a lo loco, se pierde */
  const bu = await corre('bien', false), lo = await corre('loco', false);
  const mb = bu.primeraCaida ? bu.primeraCaida.muertes : bu.muertes;
  bien(mb >= 3 && bu.ruptura === 'galos' && bu.tRompe >= 35 && bu.tRompe <= 75, `bien: matas a ${mb} galos antes de caer (${bu.caidas} caídas) y rompen los galos a los ${bu.tRompe} s (${bu.refuerzos} refuerzos; ánimo tuyo ${bu.animoR})`);
  bien(lo.primeraCaida && lo.primeraCaida.muertes < 2 && lo.ruptura !== 'galos', `a lo loco: caes tras matar a ${lo.primeraCaida ? lo.primeraCaida.muertes : '?'} (a los ${lo.primeraCaida ? lo.primeraCaida.seg : '?'} s) y ${lo.ruptura === 'romanos' ? 'rompen los tuyos a los ' + lo.tRompe + ' s' : 'no ganas'} (${lo.refuerzos} refuerzos)`);
  await br.close(); srv.close(); console.log(errores.length ? 'NO APTO\n' + errores.join('\n') : 'APTO (loco)'); process.exit(errores.length ? 1 : 0);
}
if (op.parte === 'duelo') {
  const et = op.etiqueta || 'despues', finta = op.finta === '1', vert = op.vert === '1';
  const nom = n => finta ? `TP8b-L1-finta-${n}` : /^L\d/.test(et) ? `TP8b-${et}${vert ? '-v' : ''}-${n}` : `TP8b-L1-${et}-${n}`;
  const ctx = await br.newContext({ viewport: vert ? { width: 390, height: 844 } : { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + '?fase=lucha'); await lista(page);
  const paso = async (cod, n) => { const r = await page.evaluate(cod); await page.waitForTimeout(1200); await page.screenshot({ path: join(SALIDA, nom(n) + '.jpg'), type: 'jpeg', quality: 84, timeout: 240000 }); console.log(`  ${n}: ${JSON.stringify(r)}`); };
  const PRE = `const t = window.__tp, S = t.S; t.parar(true); const tu = () => S.yo && S.yo.duelo, hasta = (c, s = 30) => { for (let i = 0; i < s * 30 && !c(); i++) t.salta(1 / 30); }, info = () => { const d = tu(); return { T: +S.T.toFixed(2), ts: d && +d.ts.toFixed(2), eco: S.eco && S.eco.texto, tipo: d && d.tipo, abierto: !!(d && S.T < (d.abierto || 0)) }; };`;
  const nuevo = `hasta(() => { const d = tu(); return d && d.aviso && d.t0 > 0 && S.T - d.t0 > 0.08 && S.T - d.t0 < 0.2; });`;
  if (vert) {
    /* en vertical: el aviso con su anillo, tu estocada entrando (tras parar) y «Desviar» sin escudo */
    await paso(`(() => { ${PRE} S.forzarGolpe = 'tajo'; ${nuevo} const ts = tu().ts; hasta(() => S.T > ts - 0.4); return info(); })()`, 1);
    await paso(`(() => { ${PRE} const ts = tu().ts; S.pide = 'parar'; hasta(() => S.T > ts + 0.3); S.pide = 'estocada'; t.salta(1 / 30); const t2 = tu().ts; hasta(() => S.T > t2 + 0.02); return info(); })()`, 2);
    await paso(`(() => { ${PRE} S.roto = true; t.salta(1.2); ${nuevo} const ts = tu().ts; hasta(() => S.T > ts - 0.1); S.pide = 'parar'; hasta(() => S.T > ts + 0.03); return { ...info(), boton: document.getElementById('parar-t').textContent }; })()`, 3);
  } else if (!finta) {
    await paso(`(() => { ${PRE} S.forzarGolpe = 'tajo'; ${nuevo} return info(); })()`, 1);
    await paso(`(() => { ${PRE} const ts = tu().ts; hasta(() => S.T > ts - 0.3); return info(); })()`, 2);
    await paso(`(() => { ${PRE} const ts = tu().ts; S.pide = 'parar'; hasta(() => S.T > ts + 0.05); return info(); })()`, 3);
    await paso(`(() => { ${PRE} t.salta(0.3); return info(); })()`, 4);
    await paso(`(() => { ${PRE} S.pide = 'estocada'; t.salta(1 / 30); const ts = tu().ts; hasta(() => S.T > ts + 0.02); return info(); })()`, 5);
    await paso(`(() => { ${PRE} t.salta(0.2); return info(); })()`, 6);
  } else {
    await paso(`(() => { ${PRE} S.forzarGolpe = 'finta'; ${nuevo} t.salta(0.5); S.pide = 'parar'; t.salta(1 / 30); return info(); })()`, 1);
    await paso(`(() => { ${PRE} const ts = tu().ts; hasta(() => S.T > ts - 0.35); return info(); })()`, 2);
    await paso(`(() => { ${PRE} const ts = tu().ts; hasta(() => S.T > ts + 0.06); return info(); })()`, 3);
  }
  await ctx.close(); await br.close(); srv.close(); console.log(errores.length ? 'NO APTO\n' + errores.join('\n') : 'APTO (duelo)'); process.exit(errores.length ? 1 : 0);
}
if (op.parte === 'pies') { await medidasPaso(); await tiras(); await br.close(); srv.close(); console.log(errores.length ? 'NO APTO\n' + errores.join('\n') : 'APTO (paso)'); process.exit(errores.length ? 1 : 0); }

/* para iterar: solo=avance,testudo saca solo esas fases (en vertical; añade h para horizontal: solo=testudo,h) y no hace las pruebas largas */
if (op.solo) { const fs = op.solo.split(','), d = fs.includes('h') ? Hz : V; for (const f of fs.filter(x => x !== 'h')) await foto(f, f, ...d); await br.close(); srv.close(); console.log(errores.length ? 'NO APTO\n' + errores.join('\n') : 'APTO (solo fotos)'); process.exit(errores.length ? 1 : 0); }
let e = await foto('avance', 'v-1-marcha', ...V); bien(e.vivos === M && e.k === 0, 'marcha: los ' + M + ' en pie y sin testudo');
bien(Math.abs(e.yo.cabeza[1] - 1.88) < 0.12, `marcha: la cabeza está donde dicen las cuentas, a ${e.yo.cabeza[1].toFixed(2)} m del suelo (las figuras miden 2,15)`);
e = await foto('flechas', 'v-2-salva', ...V); bien(e.flechas > 20, 'salva: hay venablos en el aire (' + e.flechas + ')');
e = await foto('testudo', 'v-3-testudo', ...V); bien(e.k > 0.99 && e.vivos < M, 'testudo: escudos arriba y ya hubo bajas de antes (' + e.vivos + ' en pie)'); encuadre(e, 'testudo vertical', true);
e = await foto('cara', 'v-4-golpe', ...V); bien(e.k > 0.99 && e.enc > 0.5 && e.clavados > 5, `golpe: cae la salva, tu soldado se encoge (${e.enc.toFixed(2)}) y hay venablos clavados en los escudos (${e.clavados})`);
e = await foto('mira', 'v-5-cara', ...V); bien(e.mira > 0.9 && entre(e.cuadro.yo.x, 0.2, 0.6), 'cara: tu soldado se vuelve a los suyos y la cámara se le arrima (cabeza en ' + e.cuadro.yo.x + ')');
e = await foto('roto', '_v-roto', ...V); bien(e.roto, 'roto: tu escudo ya está partido (' + e.golpes + ' golpes)');
/* GM43h: el gesto se ve (mano y punta del pilum dentro de la pantalla) y los galos vienen */
const dentro = (p, m = 0.02) => p.delante && entre(p.x, m, 1 - m) && entre(p.y, m, 1 - m);
function gesto(e, nombre) {
  const g = e.gesto;
  bien(e.armando && g.conPilum && dentro(g.mano) && dentro(g.punta), `${nombre}: tu brazo armado con el pilum se ve (mano en ${g.mano.x}, ${g.mano.y}; punta en ${g.punta.x}, ${g.punta.y})`);
  bien(entre(e.medidor, 0.3, 0.7), `${nombre}: el medidor va a medias (${e.medidor.toFixed(2)})`);
  bien(e.galos.andan + e.galos.corren >= 12 && dentro(g.galo), `${nombre}: los galos vienen y se ven al fondo (${e.galos.andan} al paso, hueco ${e.galos.hueco} m)`);
}
e = await foto('pila', '_v-pila', ...V); bien(e.fase === 'pila' && e.galos.andan >= 12 && e.galos.hueco < 31, `a tiro: los galos se vienen cuesta abajo (hueco ${e.galos.hueco} m)`);
e = await foto('armar', 'v-7-armar', ...V); gesto(e, 'armar vertical');
e = await foto('vuelo', 'v-8-vuelo', ...V); bien(e.salvas === 1 && e.galos.enAire >= 6 && !e.gesto.conPilum, `vuelo: tu pilum ha salido de la mano y la salva está en el aire (${e.galos.enAire})`);
e = await foto('impacto', 'v-9-impacto', ...V); bien(e.salvas === 2 && e.caidos >= 7 && e.galos.clavados >= 1 && e.galos.enTierra >= 4, `impacto: dos buenas salvas tumban ${e.caidos} galos; pila en escudos ${e.galos.clavados}, en tierra ${e.galos.enTierra}`);
e = await foto('carga', 'v-6-carga', ...V); bien(e.fase === 'carga' && e.enHombre === 0, 'carga: gladios fuera y nadie lleva venablos clavados');
e = await foto('lucha', 'v-10-lucha', ...V); bien(e.choque && e.lucha.duelos >= 3 && e.lucha.dmin >= 0.4, `lucha: duelos a la vez (${e.lucha.duelos}, en ${e.lucha.fases} compases distintos), nadie encima de otro (${e.lucha.dmin} m)`);
bien(e.lucha.caidosG + e.lucha.caidosR >= 2, `lucha: caídos que se quedan en el suelo (${e.lucha.caidosG} galos, ${e.lucha.caidosR} romanos; relevos ${e.lucha.relevos})`);
e = await foto('final', '_v-final', ...V); bien(e.fase === 'fin' && e.choque, 'final: choque y tarjeta');
await foto('avance', 'h-1-marcha', ...Hz);
e = await foto('testudo', 'h-3-testudo', ...Hz); encuadre(e, 'testudo horizontal', false);
e = await foto('mira', '_h-cara', ...Hz); bien(e.mira > 0.9, 'cara en horizontal: tu soldado vuelto');
e = await foto('armar', 'h-7-armar', ...Hz); gesto(e, 'armar horizontal');
e = await foto('vuelo', 'h-8-vuelo', ...Hz);
e = await foto('impacto', 'h-9-impacto', ...Hz);
e = await foto('lucha', 'h-10-lucha', ...Hz);
await medidasPaso(); await tiras(); await tp1b();

/* partida entera en vertical, con los dedos: mantener «Avanzar», «Escudos» a cada aviso, lanzar y cargar. El reloj se adelanta a saltos. */
{
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0); await lista(page);
  const b = await page.locator('#avanzar').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.waitForTimeout(2500); const e1 = await page.evaluate(() => ({ ...window.__tp.estado(), son: window.__tp.Son.listo() }));
  bien(e1.andando && e1.zF < 0, 'en vivo: mantener «Avanzar» pone el cuerpo en marcha (' + e1.zF.toFixed(1) + ' m con render por software)');
  bien(e1.son, 'en vivo: el sonido arranca con el primer toque');
  await page.tap('#escudos'); await page.waitForFunction('window.__tp.estado().k > 0.9', null, { timeout: 30000 }).catch(() => {}); const e2 = await page.evaluate(() => window.__tp.estado());
  bien(e2.k > 0.9, 'en vivo: «Escudos» forma el testudo');
  /* el resto, a saltos de reloj (el dedo sigue en «Avanzar»), jugando bien: escudos arriba con cada aviso y abajo cuando ya cayó la salva */
  const e3 = await page.evaluate(() => { const t = window.__tp, S = t.S; t.parar(true); for (let i = 0; i < 1500 && S.fase === 'avance'; i++) { S.escudos = S.aviso || S.impacto > 0; t.salta(0.1); } S.escudos = true; t.salta(1); return t.estado(); });
  bien(e3.fase === 'pila' && e3.vivos >= Math.round(M * 25 / 30), `partida: llega a tiro de pilum con ${e3.vivos} de ${M} subiendo los escudos a cada aviso (escudo propio: ${e3.golpes} golpes${e3.roto ? ', roto' : ''})`);
  await page.mouse.up(); await page.evaluate(() => window.__tp.parar(false)); await page.waitForTimeout(400);
  /* GM43h: «Lanzar» con el dedo: bajar arma el brazo, subir lanza; un pointercancel lanza igual y no deja el botón enganchado */
  const toque = (tipo) => page.dispatchEvent('#accion', tipo, { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true });
  bien(await page.locator('#accion').isVisible() && (await page.locator('#accion-t').textContent()) === 'Lanzar', 'en vivo: a tiro sale el botón «Lanzar»');
  await toque('pointerdown'); const a1 = await page.evaluate(() => { const t = window.__tp; t.parar(true); t.salta(0.84); return t.estado(); });
  await toque('pointerup'); const a2 = await page.evaluate(() => { const t = window.__tp; t.salta(0.2); return { ...t.estado(), m: t.medidor() }; });
  bien(a1.armando && a1.dedo && !a2.armando && !a2.dedo && a2.salvas === 1 && a2.buenos === 1, `en vivo: mantener y soltar «Lanzar» lanza la primera salva (medidor ${a2.m.toFixed(2)}, buen tiro)`);
  const a3 = await page.evaluate(() => { const t = window.__tp; t.salta(2.1); t.parar(false); return t.estado(); }); await page.waitForTimeout(300);
  bien((await page.locator('#accion-t').textContent()) === 'Segundo pilum', 'en vivo: el botón pasa a «Segundo pilum»');
  await toque('pointerdown'); const a4 = await page.evaluate(() => { const t = window.__tp; t.parar(true); t.salta(0.1); return t.estado(); });
  await toque('pointercancel'); const a5 = await page.evaluate(() => { const t = window.__tp; t.salta(0.1); return t.estado(); });
  bien(a4.armando && !a5.armando && !a5.dedo && a5.salvas === 2, 'en vivo: un toque cancelado por el navegador lanza el segundo pilum (flojo) y suelta el botón');
  const e5 = await page.evaluate(() => { const t = window.__tp, S = t.S; for (let i = 0; i < 1500 && S.fase !== 'fin'; i++) t.salta(0.1); t.parar(false); return t.estado(); });
  await page.waitForTimeout(800);
  bien(e5.fase === 'fin' && e5.choque && await page.locator('#fin').isVisible(), `partida: gladios, choque y tarjeta final (${e5.caidos} galos caídos por los pila)`);
  /* tres partidas desde «a tiro», a saltos de reloj: dos buenas salvas, dos flojas y sin lanzar */
  const r = await page.evaluate(() => {
    const t = window.__tp, S = t.S, juega = (sujeta) => {
      t.reinicia(); S.zF = t.Z_PILA + 0.5; S.andando = true; t.salta(1.5);
      for (const s of sujeta) { for (let i = 0; i < 60 && !t.armar(); i++) t.salta(0.05); t.salta(s); t.soltar(); }
      for (let i = 0; i < 1500 && S.fase !== 'fin'; i++) t.salta(0.1);
      return { caidos: S.caidos, salvas: S.salvas, buenos: S.buenos, choque: S.choque, fase: S.fase };
    };
    t.parar(true); return { buenas: juega([0.84, 0.84]), flojas: juega([0.12, 0.12]), nada: juega([]) };
  });
  bien(r.buenas.salvas === 2 && r.buenas.buenos === 2 && r.buenas.caidos >= 7, `partida: dos salvas buenas tumban ${r.buenas.caidos} galos (7 o más)`);
  bien(r.flojas.salvas === 2 && r.flojas.buenos === 0 && r.flojas.caidos <= 5, `partida: dos salvas flojas tumban ${r.flojas.caidos} (5 o menos)`);
  bien(r.nada.salvas === 0 && r.nada.choque && r.nada.fase === 'fin', 'partida: sin lanzar, los galos llegan y hay choque igual');
  await ctx.close();
}
/* «Correr» mantenido diez segundos: corre, se queda sin aliento, sigue al paso y vuelve a correr; nunca se para ni va a tirones */
{
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0); await lista(page);
  const b = await page.locator('#correr').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  const r = await page.evaluate(() => { const t = window.__tp, S = t.S; t.parar(true); S.proxima = 999; let cambios = 0, antes = S.corriendo, parado = 0, corrio = 0; for (let i = 0; i < 300; i++) { t.salta(1 / 30); if (antes !== S.corriendo) cambios++; antes = S.corriendo; if (S.vel <= 0) parado++; if (S.corriendo) corrio++; } return { cambios, parado, corrio, zF: S.zF }; });
  await page.mouse.up();
  bien(r.corrio > 100 && r.parado === 0 && r.cambios <= 5, `correr: diez segundos con el botón pulsado, corre ${(r.corrio / 30).toFixed(1)} s, no se para nunca y cambia de correr a andar ${r.cambios} veces (avanza ${(-r.zF).toFixed(0)} m)`);
  await ctx.close();
}
/* cada sonido, tocado sin altavoz: tiene que oírse (pico por encima del viento) y no saturar */
{
  const page = await br.newPage(); escucha(page); await page.goto(URL0 + 'sonido.js');
  const r = await page.evaluate(async base => {
    const casos = { cuerno: S => S.cuerno(), salva: S => S.salva(2.2), madera: S => S.madera(1, 0), tierra: S => S.tierra(0), trueno: S => S.trueno(1), paso: S => S.paso(0.8, 1), escudos: S => S.clac(10), 'escudo roto': S => S.crac(), hierro: S => S.hierro(0), pila: S => S.lanza(), choque: S => S.choque(), clamor: S => S.voz('¡Cargad!'), coro: S => S.voz('—¡Ha!'), grito: S => S.voz('¡Ahí vienen!'), esfuerzo: S => S.esfuerzo(0), herido: S => S.herido(0), lucha: S => S.lucha(1) };
    const out = {}; let n = 0;
    for (const [k, f] of Object.entries(casos)) {
      const S = await import(base + 'sonido.js?n=' + (n++)), ctx = new OfflineAudioContext(2, 44100 * 3.2, 44100); S.inicia(ctx); await S.carga(); f(S);   /* GM43i: sonido grabado: espera a que el banco esté descodificado */
      const b = await ctx.startRendering(); let pico = 0; for (const c of [0, 1]) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) pico = Math.max(pico, Math.abs(d[i])); }
      out[k] = +pico.toFixed(2);
    }
    return out;
  }, URL0);
  bien(Object.values(r).every(v => v > 0.08 && v < 1), 'sonido: los dieciocho ruidos grabados suenan y no saturan (' + Object.entries(r).map(([k, v]) => k + ' ' + v).join(', ') + ')');
  await page.close();
}
console.log('\nCoste por fase (último fotograma, con sombras):\n  ' + COSTE.join('\n  '));
await br.close(); srv.close();
if (errores.length) { console.log('\nNO APTO: ' + errores.length + ' errores\n' + errores.join('\n')); process.exit(1); }
console.log('\nAPTO: capturas en ' + SALIDA);
