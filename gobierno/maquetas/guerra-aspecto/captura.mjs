// Maqueta GM4 — juega la batalla grande en un móvil simulado, deja las capturas y MIDE (hombres, cartones, figuras, triángulos, fluidez).
// Uso:  node gobierno/maquetas/guerra-arte/captura.mjs                         -> capturas GM4-* (dpr 2) en gobierno/capturas-tarea/
//       node gobierno/maquetas/guerra-arte/captura.mjs dpr=1 prefijo=/ruta/p-   -> rápido, para iterar
//       node gobierno/maquetas/guerra-arte/captura.mjs --servir                 -> solo sirve la página
// Los toques son de dedo de verdad sobre los botones; el tiempo se adelanta con el gancho window.__gc.salta.
// La fluidez de aquí es con render por software: sirve para comparar unos tamaños con otros y con GC1, no como dato de un móvil.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8379 : 0, '127.0.0.1', () => ok(s)); });
const BASE = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/', URL0 = BASE + 'guerra-aspecto/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GM4-'), errores = [], tabla = [];
const espera = (p, ms) => p.waitForTimeout(ms);
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
async function abrir(url, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  const t0 = Date.now(); await page.goto(url); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 300000 });
  return { ctx, page, carga: (Date.now() - t0) / 1000 };
}
/* milisegundos por imagen, con la batalla en marcha (60 imágenes seguidas) */
const ritmo = page => page.evaluate(() => new Promise(ok => { let k = 0, t0 = 0; const f = t => { if (!t0) t0 = t; if (++k > 60) ok((t - t0) / 60); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));

async function partida(hombres, nombre, w, h, completa) {
  const { ctx, page, carga } = await abrir(URL0 + '?semilla=4242&hombres=' + hombres + (op.extra ? '&' + op.extra : ''), w, h), id = hombres + '-' + nombre;
  const g = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]);
  const foto = async n => { await espera(page, 1500); for (let i = 0; ; i++) { try { await page.screenshot({ path: prefijo + id + '-' + n + '.jpg', type: 'jpeg', quality: 80, timeout: 240000 }); break; } catch (e) { if (i >= 2) throw e; } } const e = await g('estado'); console.log(`${id}-${n}: t=${e.t.toFixed(0)} s · ${e.hombres[0]} + ${e.hombres[1]} hombres · ${e.cartones} cartones · ${e.figs} figuras · ${e.tri} triángulos · ${e.llamadas} llamadas`); return e; };
  const pulsa = async sel => { await page.tap(sel); await espera(page, 250); };
  console.log(`\n== ${id}: cargada en ${carga.toFixed(0)} s ==`);
  await g('pausa', true); await g('salta', 3);
  if (completa) {
    await foto('1-llegada');
    bien(await page.isVisible('#retirar') && await page.isVisible('#ojo') && await page.isVisible('#talla'), '«Retirarse», «De cerca» y el tamaño del ejército están a la vista desde el primer segundo');
    bien(await page.locator('.orden').count() === 4 && await page.locator('.cuerpo').count() === 3, 'tres cuerpos y cuatro órdenes en pantalla');
    bien(await page.evaluate(() => [...document.querySelectorAll('.orden,.cuerpo,.pildora')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && r.height >= 40; })), 'todos los botones caben enteros y miden al menos 40 px de alto');
  }
  /* el choque, visto de lejos: todos los hombres en pantalla como cartones */
  await g('salta', 6); await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="empujar"]'); await g('salta', 5); await g('mirar', -1, 0);
  const lejos = await foto('2-choque');
  bien(Math.abs(lejos.cartones - lejos.jinetes - lejos.hombres[0] - lejos.hombres[1]) <= 12 && lejos.figs === 0, 'de lejos hay un cartón por hombre vivo (y por jinete) y ninguna figura completa (' + lejos.cartones + ' cartones)');
  bien(await page.evaluate(() => { const B = window.__gc.B, t = document.getElementById('cuenta').textContent.replace(/\s/g, ''); return t.includes('Roma' + Math.round(B.sect.reduce((a, s) => a + window.__gc.R.hombres(s.c[0]), 0))); }), 'la cuenta de arriba dice los hombres que quedan de verdad');
  await g('pausa', false); const msLejos = await ritmo(page); await g('pausa', true);
  /* de cerca: figuras completas solo junto a la cámara, con tope */
  await pulsa('#ojo'); await g('pausa', false); await espera(page, 2500); const msCerca = await ritmo(page); await g('pausa', true);
  const cerca = await foto('3-de-cerca');
  bien(cerca.figs > 0 && cerca.figs <= 220, 'de cerca salen figuras completas y nunca pasan de 220 (' + cerca.figs + ')');
  await pulsa('#ojo'); await espera(page, 600);
  tabla.push({ id, hombres: lejos.hombres[0] + lejos.hombres[1], cartones: lejos.cartones, triLejos: lejos.tri, llamLejos: lejos.llamadas, msLejos, figs: cerca.figs, triCerca: cerca.tri, msCerca, mb: cerca.cartonesMB });
  if (completa) {
    /* caballería al flanco, y luego se juega con cabeza hasta el final (mismo criterio que el bot «con cabeza» de prueba.mjs) */
    await g('salta', 14); await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="relevo"]');
    bien(await page.evaluate(() => window.__gc.B.sect[1].c[0].lineas[0].tipo) === 'principes', 'el relevo mete a los príncipes en primera línea');
    await pulsa('.cuerpo[data-i="0"]'); await pulsa('.orden[data-o="empujar"]'); await pulsa('.orden[data-o="caballeria"]');
    await g('salta', await page.evaluate(() => window.__gc.B.cab.t + 1.5)); await g('mirar', -1, 0); await foto('4-caballeria');
    await page.evaluate(() => { const G = window.__gc, R = G.R, B = G.B; let n = 0;
      while (B.fase !== 'fin' && n++ < 400) {
        for (let i = 0; i < 3; i++) { const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto) continue; const fe = R.frente(e).fatiga, l = R.frente(c), sig = c.lineas[1];
          R.ordenar(B, i, (e.postura === 'aguantar' && l.fatiga < 0.75) || fe > 0.6 || e.flanqueado || e.golpe > 0 ? 'empujar' : 'aguantar');
          if (sig && sig.fatiga < 0.4 && (l.fatiga > 0.7 || l.hombres < 0.45 * l.max)) R.ordenar(B, i, 'relevo'); }
        if (B.cab.estado === 'lista' && (B.num.estado === 'hostiga' || B.num.estado === 'llega')) R.ordenar(B, B.num.sect, 'caballeria');
        for (let k = 0; k < 6 && !B.sect.some(s => s.c[1].roto); k++) G.salta(0.25);
        if (B.sect.some(s => s.c[1].roto)) break; } });
    await g('salta', 2.5); await g('mirar', -1, 0); await foto('5-ruptura');
    await page.evaluate(() => { const G = window.__gc, R = G.R, B = G.B; let n = 0; while (B.fase !== 'fin' && n++ < 400) { for (let i = 0; i < 3; i++) { const s = B.sect[i]; if (!s.c[0].roto && !s.c[1].roto) R.ordenar(B, i, 'empujar'); } G.salta(1.5); } });
    await g('pausa', false); await espera(page, 4000); const fin = await foto('6-final'), r = fin.res; console.log('  resultado: ' + JSON.stringify(r));
    bien(r && r.t >= 60 && r.t <= 185, 'la batalla dura entre uno y tres minutos (' + Math.round(r.t) + ' s)');
    bien(r && r.bajas[0] + fin.hombres[0] === r.inicial[0] && r.bajas[1] + fin.hombres[1] === r.inicial[1], 'las cuentas cuadran hombre a hombre: bajas + vivos = los que entraron');
    bien(await page.isVisible('#fin') && await page.isVisible('#otra'), 'al acabar sale el resultado con «Otra batalla»');
    await pulsa('#otra'); await espera(page, 1200); await pulsa('#talla'); await foto('7-tamano');
    bien(await page.locator('#tallas [data-h]').count() === 4, 'el botón del tamaño deja elegir 1 000, 5 000 o 10 000 hombres');
    await pulsa('#tallas [data-h="0"]'); await pulsa('#retirar'); await pulsa('#salir-si'); await espera(page, 800);
    bien((await g('estado')).res.como === 'retirada' && await page.isVisible('#otra'), 'dos toques bastan para salir de la batalla');
  }
  await ctx.close();
}
/* la vara: la maqueta GC1 (230 figuras completas para unos 1 600 hombres), medida aquí mismo */
async function vara(w, h) {
  const { ctx, page } = await abrir(BASE + 'guerra-cero/?semilla=4242', w, h);
  await page.evaluate(() => { window.__gc.pausa(true); window.__gc.salta(14); window.__gc.mirar(-1, 0); window.__gc.pausa(false); }); await espera(page, 1500);
  const ms = await ritmo(page), e = await page.evaluate(() => window.__gc.estado()); await ctx.close(); return { ms, tri: e.tri, figs: e.figs };
}
const cual = op.solo || 'todo';
if (cual === 'todo' || cual === 'vertical') { await partida(5000, 'vertical', 390, 844, true); await partida(1000, 'vertical', 390, 844); await partida(10000, 'vertical', 390, 844); }
if (cual === 'todo' || cual === 'horizontal') { await partida(5000, 'horizontal', 844, 390, true); await partida(10000, 'horizontal', 844, 390); }
if (cual === 'rapido') await partida(+(op.hombres || 5000), op.como || 'vertical', op.como === 'horizontal' ? 844 : 390, op.como === 'horizontal' ? 390 : 844, !op.corta);
const v = cual === 'rapido' ? null : await vara(390, 844);
console.log('\nMEDIDAS (dpr ' + dpr + ', render por software: valen para comparar, no como dato de un móvil)');
console.log('batalla            | hombres | cartones | de lejos: triángulos · llamadas · ms/imagen | de cerca: figuras · triángulos · ms/imagen | memoria de cartones');
for (const t of tabla) console.log(`${t.id.padEnd(18)} | ${String(t.hombres).padStart(7)} | ${String(t.cartones).padStart(8)} | ${String(t.triLejos).padStart(8)} · ${String(t.llamLejos).padStart(3)} · ${t.msLejos.toFixed(0).padStart(4)} | ${String(t.figs).padStart(4)} · ${String(t.triCerca).padStart(7)} · ${t.msCerca.toFixed(0).padStart(4)} | cartones: ${t.mb === undefined ? '—' : t.mb + ' MB'}`);
if (v) console.log(`GC1 (vara) vertical |    1620 |        0 | ${String(v.tri).padStart(8)} ·   – · ${v.ms.toFixed(0).padStart(4)} | ${v.figs} figuras completas siempre`);
console.log(errores.length ? 'NO APTO · ' + errores.length + ' fallos:\n' + errores.join('\n') : 'APTO · sin errores de consola');
await br.close(); srv.close(); process.exit(errores.length ? 1 : 0);
