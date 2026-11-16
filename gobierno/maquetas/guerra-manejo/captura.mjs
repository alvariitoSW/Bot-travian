// Maqueta GM7 — juega la batalla que empieza de lejos en un móvil simulado (toques de dedo), comprueba lo que debe verse y deja las capturas.
// Uso:  node gobierno/maquetas/guerra-lejos/captura.mjs                         -> capturas GM7-* (dpr 2) en gobierno/capturas-tarea/
//       node gobierno/maquetas/guerra-lejos/captura.mjs dpr=1 prefijo=/ruta/p-   -> rápido, para iterar
//       node gobierno/maquetas/guerra-lejos/captura.mjs --servir                 -> solo sirve la página
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
const BASE = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/', URL0 = BASE + 'guerra-manejo/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GM10-rec-'), errores = [], tabla = [];
const espera = (p, ms) => p.waitForTimeout(ms);
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
async function abrir(url, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  const t0 = Date.now(); await page.goto(url); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 300000 });
  return { ctx, page, carga: (Date.now() - t0) / 1000 };
}

async function partida(nombre, w, h, completa, extra) {
  const { ctx, page, carga } = await abrir(URL0 + '?semilla=4242&hombres=5000' + (extra || ''), w, h), id = nombre;
  const g = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]);
  const foto = async n => { await espera(page, 1500); for (let i = 0; ; i++) { try { await page.screenshot({ path: prefijo + id + '-' + n + '.jpg', type: 'jpeg', quality: 80, timeout: 240000 }); break; } catch (e) { if (i >= 2) throw e; } } const e = await g('estado'); console.log(`${id}-${n}: t=${e.t.toFixed(0)} s · a ${e.dist.join('/')} m · ${e.posturas.join('/')} · ${e.volando} proyectiles en el aire · ${e.tejados} tejados · ${e.figs} figuras · botones ${e.botones.join(', ')}`); return e; };
  const pulsa = async sel => { await page.tap(sel); await espera(page, 250); };
  const hasta = (cond, tope) => page.evaluate(([c, tope]) => { const G = window.__gc, B = G.B, R = G.R; let n = 0; while (!eval(c) && B.fase !== 'fin' && n++ < tope * 4) G.salta(0.25); return eval(c); }, [cond, tope || 90]);
  console.log(`\n== ${id}: cargada en ${carga.toFixed(0)} s ==`);
  await g('pausa', true); await g('salta', 2);
  const e1 = await foto('1-de-lejos');
  bien(e1.dist.every(d => d > 130), 'la batalla empieza de lejos: las líneas están a más de 130 m (' + e1.dist.join(', ') + ')');
  bien(e1.botones.join() === 'Avanzar,Escudos,Testudo,Caballería', 'de lejos los cuatro botones dicen Avanzar, Escudos, Testudo y Caballería');
  if (completa) {
    bien(await page.isVisible('#retirar') && await page.isVisible('#ojo') && await page.isVisible('#talla'), '«Retirarse», «De cerca» y el tamaño del ejército están a la vista desde el primer segundo');
    bien(await page.evaluate(() => [...document.querySelectorAll('.orden,.cuerpo,.pildora')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && r.height >= 40; })), 'todos los botones caben enteros y miden al menos 40 px de alto');
  }
  /* los tiradores abren la batalla: se ven los proyectiles y caen hombres sin que las líneas se hayan tocado */
  await hasta('B.porTiroLinea[0] > 20', 40); await g('salta', 2); await g('mirar', -1, 0);
  const e2 = await foto('2-piedras');
  bien(e2.volando > 15, 'se ven los proyectiles en el aire (' + e2.volando + ' a la vez)');
  bien(e2.porTiro[0] > 0 && e2.dist.every(d => d > 20), 'hay bajas por proyectil antes de que las líneas se toquen (' + e2.porTiro[0] + ' romanos, ' + e2.porTiro[1] + ' enemigos)');
  bien(await page.evaluate(() => document.querySelector('.orden[data-o="escudos"]').classList.contains('pide') || !window.__gc.R.tirando(window.__gc.B.sect[window.__gc.estado().sel].c[1])), 'el botón «Escudos» late cuando al cuerpo elegido le tiran y no se cubre');
  /* cubrirse: testudo en el centro, escudos en el ala derecha, nada en la izquierda (no le tiran) */
  await pulsa('.cuerpo[data-i="1"]'); await pulsa('.orden[data-o="testudo"]'); await pulsa('.cuerpo[data-i="2"]'); await pulsa('.orden[data-o="escudos"]');
  const antes = await page.evaluate(() => window.__gc.B.sect.map(s => window.__gc.R.frente(s.c[0]).hombres));
  await g('salta', 5); await g('mirar', -1, 0);
  const e3 = await foto('3-cubiertos');
  bien(e3.posturas.join() === 'avanzar,testudo,escudos' && e3.tejados >= 6, 'los toques forman el testudo en el centro y suben escudos a la derecha, y se ve el tejado de escudos (' + e3.tejados + ' líneas cubiertas)');
  await pulsa('.cuerpo[data-i="1"]'); await pulsa('#ojo'); await g('pausa', false); await espera(page, 2600); await g('pausa', true);
  const e4 = await foto('4-testudo-de-cerca');
  bien(e4.figs > 0 && e4.figs <= 220, 'de cerca siguen saliendo figuras completas, con tope (' + e4.figs + ')');
  const fat = await page.evaluate(() => window.__gc.B.sect.map(s => +window.__gc.R.frente(s.c[0]).fatiga.toFixed(2)));
  bien(fat[1] > fat[2] && fat[2] > fat[0], 'cubrirse cansa: testudo ' + fat[1] + ', escudos ' + fat[2] + ', sin cubrirse ' + fat[0]);
  await pulsa('#ojo');
  if (completa) {
    /* deshacer el testudo a tiempo, la descarga de pila y el choque */
    await pulsa('.orden[data-o="avanzar"]'); await pulsa('.cuerpo[data-i="2"]');
    const pila = await hasta('B.eventos.some(e => e.tipo === "pila" && e.lado === 0)', 60), sp = await page.evaluate(() => window.__gc.B.eventos.find(e => e.tipo === 'pila' && e.lado === 0).sect);
    await g('salta', 0.9); await g('mirar', sp, 30); const e5 = await foto('5-pila');
    bien(pila && e5.volando > 20, 'antes de chocar los legionarios arrojan los pila y se ven (' + e5.volando + ' en el aire)');
    await hasta('B.sect.every(s => !R.lejos(s))', 60); await g('salta', 1.5); await g('mirar', -1, 0); await pulsa('.cuerpo[data-i="1"]');
    const e6 = await foto('6-choque');
    bien(e6.botones.join() === 'Empujar,Aguantar,Relevo,Caballería', 'al chocar, los mismos cuatro botones dicen Empujar, Aguantar, Relevo y Caballería');
    bien(e6.t > 30 && e6.t < 70, 'acercarse dura entre medio minuto y un minuto (' + Math.round(e6.t) + ' s hasta que luchan los tres cuerpos)');
    /* se juega con cabeza hasta el final (mismo criterio que el jugador de mentira de prueba.mjs) */
    await page.evaluate(() => { const G = window.__gc, R = G.R, B = G.B; let n = 0;
      while (B.fase !== 'fin' && n++ < 400) {
        for (let i = 0; i < 3; i++) { const s = B.sect[i], c = s.c[0], e = s.c[1]; if (c.roto || e.roto) continue; const fe = R.frente(e).fatiga, l = R.frente(c), sig = c.lineas[1];
          R.ordenar(B, i, (e.postura === 'aguantar' && l.fatiga < 0.75) || fe > 0.6 || e.flanqueado || e.golpe > 0 ? 'empujar' : 'aguantar');
          if (sig && sig.fatiga < 0.4 && (l.fatiga > 0.7 || l.hombres < 0.45 * l.max)) R.ordenar(B, i, 'relevo'); }
        if (B.cab.estado === 'lista' && (B.num.estado === 'hostiga' || B.num.estado === 'llega')) R.ordenar(B, B.num.sect, 'caballeria');
        G.salta(1.5); } });
    await g('pausa', false); await espera(page, 4000); const fin = await foto('7-final'), r = fin.res; console.log('  resultado: ' + JSON.stringify(r));
    bien(r && r.t >= 100 && r.t <= 250, 'la batalla dura entre dos y cuatro minutos (' + Math.round(r.t) + ' s)');
    bien(r && r.bajas[0] + fin.hombres[0] === r.inicial[0] && r.bajas[1] + fin.hombres[1] === r.inicial[1], 'las cuentas cuadran hombre a hombre: bajas + vivos = los que entraron');
    bien(await page.isVisible('#fin') && await page.isVisible('#otra') && /proyectil/.test(await page.textContent('#fin-c')), 'al acabar sale el resultado, con los caídos por proyectil, y «Otra batalla»');
    await pulsa('#otra'); await espera(page, 1200);
    bien((await g('estado')).dist.every(d => d > 130), '«Otra batalla» vuelve a empezar de lejos');
    /* la caballería a por los honderos */
    await g('pausa', true); await hasta('B.sect[2].c[1].tir.estado === "tira"', 40); await pulsa('.cuerpo[data-i="2"]');
    bien(/honderos/.test(await page.textContent('.orden[data-o="caballeria"] .sub')), 'el botón de la caballería dice «a sus honderos» mientras siguen delante');
    await pulsa('.orden[data-o="caballeria"]'); await hasta('B.cab.estado === "cargando"', 30); await g('salta', 0.6); await g('mirar', 2, 30); await foto('8-jinetes-a-los-honderos');
    bien(await page.evaluate(() => window.__gc.B.sect[2].c[1].tir.huido === true), 'los jinetes barren a los honderos del ala y dejan de tirar');
    await g('mirar', -1, 0); await pulsa('#retirar'); await pulsa('#salir-si'); await espera(page, 800);
    bien((await g('estado')).res.como === 'retirada' && await page.isVisible('#otra'), 'dos toques bastan para salir de la batalla');
  }
  /* GM8: la caballería rodea por fuera, golpea, vuelve; la cámara la sigue */
  if (completa) { await pulsa('#otra'); await espera(page, 1200); }
  await g('pausa', true); await g('mirar', -1, 0); await pulsa('.cuerpo[data-i="0"]'); await pulsa('.orden[data-o="caballeria"]');
  let solapa = 0; const prueba = async () => { const r = await page.evaluate(() => { const c = window.__gc.cab(); return c.regs.filter(q => Math.abs(c.x - q.x) < q.w / 2 && (q.lado === 0 ? c.z > q.z - 1 && c.z < q.z + q.h : c.z < q.z + 1 && c.z > q.z - q.h)).length; }); if (r) console.log('  solape en fase ' + await page.evaluate(() => window.__gc.B.cab.fase + ' x=' + window.__gc.cab().x.toFixed(1) + ' z=' + window.__gc.cab().z.toFixed(1) + ' anc=' + window.__gc.cab().ancho.toFixed(1) + ' regs=' + JSON.stringify(window.__gc.cab().regs.filter(q => Math.abs(window.__gc.cab().x - q.x) < q.w / 2 + 20).map(q => [q.x, q.z, q.lado, q.w, q.h].map(v => Math.round(v)))))); solapa += r; };
  const paso = async (cond, tope) => { for (let k = 0; k < tope * 4; k++) { if (await page.evaluate(([c]) => { const G = window.__gc, B = G.B; return eval(c); }, [cond])) return true; await g('salta', 0.25); await prueba(); } return false; };
  await g('sigue', true); await paso('B.cab.fase === "rodea"', 10); await g('salta', 3.2); await prueba(); await g('mirar', -1, 0); await foto('9-jinetes-rodeando');
  await paso('B.cab.fase === "golpe"', 12); await g('salta', 0.5); await g('mirar', -1, 0); await foto('10-choque');
  await paso('B.cab.fase === "vuelve"', 12); await g('salta', 2); await g('mirar', -1, 0); await foto('11-vuelta-camara-siguiendo');
  bien(await page.evaluate(() => window.__gc.siguiendo), 'la cámara sigue a los jinetes mientras vuelven');
  await paso('B.cab.estado === "lista"', 25); await g('salta', 0.3);
  bien(!(await page.evaluate(() => window.__gc.B.cab.estado !== 'lista' && window.__gc.siguiendo)), 'al acabar la carga se suelta la cámara');
  bien(solapa === 0, 'los jinetes nunca pasan por encima de ninguna línea (' + solapa + ' cuadros solapados)');
  await ctx.close();
}
const cual = op.solo || 'todo';
if (cual === 'todo' || cual === 'vertical') await partida('vertical', 390, 844, true);
if (cual === 'todo' || cual === 'horizontal') await partida('horizontal', 844, 390, false);
if (cual === 'todo' || cual === 'pirro') await partida('pirro', 390, 844, false, '&rival=pirro');      // otro ejército, hecho solo con fichas nuevas
console.log(errores.length ? 'NO APTO · ' + errores.length + ' fallos:\n' + errores.join('\n') : 'APTO · sin errores de consola');
await br.close(); srv.close(); process.exit(errores.length ? 1 : 0);
