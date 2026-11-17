/* AQVILA — GC2: juez de la batalla nueva que se juega de verdad (js/ui-guerra.js).
   Uso: node gobierno/juez-guerra.mjs [dpr=2] [prefijo=/ruta/GC2-]      (lo llama gobierno/jueces.mjs; se salta con --rapido)
   Entra en la batalla por defecto (vertical y horizontal), sale con «Retirarse», recorre la maniobra (más de 600 hombres),
   mide cuánto tarda un primer toque útil sin leer nada y mira el arte con medidas objetivas. Capturas: gobierno/capturas-tarea/GC2-*.jpg
   Sale con código 1 si hay errores de consola o falla una comprobación.
   FALLO CONOCIDO (parte GC4): durante la carga el cartel #gu-carga tapa «Retirarse». Mientras FALLO_CARGA_ARREGLADO sea false,
   se imprime como AVISO y no tumba el recorrido. Cuando se arregle en el juego, ponerlo a true (o pasar arregladoCarga=1): pasa a obligatorio. */
const FALLO_CARGA_ARREGLADO = true;
/* FALLO CONOCIDO 2 (hallado por este juez): la maniobra no tiene salida hasta el choque (solo allí sale «Retirarse»). Igual: AVISO hasta que se ponga a true. */
const FALLO_SALIDA_MANIOBRA_ARREGLADO = true;
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GC2-');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.woff2': 'font/woff2', '.webmanifest': 'application/json', '.svg': 'image/svg+xml' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
const fallos = [], esp = ms => page.waitForTimeout(ms);
page.on('console', m => { if (m.type() === 'error' && !/GPU stall|GL Driver/.test(m.text())) { fallos.push('consola: ' + m.text().slice(0, 250)); console.log('  [error] ' + m.text().slice(0, 250)); } });
page.on('pageerror', e => { fallos.push('excepción: ' + String(e.message).slice(0, 250)); console.log('  [excepción] ' + e.message.slice(0, 250)); });
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) fallos.push('prueba: ' + texto); };
const foto = async n => { await esp(1200); for (let i = 0; ; i++) { try { await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 82, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } } console.log('  captura ' + n); };
const gc = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]);
const pulsa = async sel => { await page.tap(sel); await esp(250); };
const modal = () => page.evaluate(() => { const m = document.querySelector('#modal:not([hidden])'); return m ? m.textContent.slice(0, 80) : ''; });

/* provoca un ataque a Capua con un ejército que da una escaramuza (menos de 600 hombres: sin maniobra) y espera el aviso de batalla */
async function provoca() {
  await page.evaluate(() => { const G = window.Game, s = G.state; s.cities.capua.owner = 'campanos'; s.cities.capua.units = { hoplitas: 150, milicia: 100 }; s.cities.roma.units = { hastati: 200, principes: 100 }; s.marches = [];
    G.send('roma', 'capua', { hastati: 200, principes: 100 }, false); s.marches[0].t1 = s.t + 0.01; G.tick(G.turnos ? Math.max(0.02, G.finTurno() - s.t) : 0.05); });
  for (let i = 0; i < 10; i++) { await esp(1000); if (await page.locator('#modal:not([hidden]) [data-act="bview"], #modal:not([hidden]) [data-act="bcont"]').count()) break; const b = page.locator('#modal:not([hidden]) .btn').first(); if (await b.count()) await b.click(); }
  await page.waitForSelector('#modal:not([hidden]) [data-act="bview"], #modal:not([hidden]) [data-act="bcont"]', { timeout: 20000 });
}
async function abreBatalla() { await page.click('#modal [data-act="bview"]'); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 120000 }); await esp(1500); }
const arregladoCarga = FALLO_CARGA_ARREGLADO || op.arregladoCarga === '1';
const arregladoSalida = FALLO_SALIDA_MANIOBRA_ARREGLADO || op.arregladoSalida === '1';
const avisos = [];
const aviso = t => { console.log('  AVISO (fallo conocido): ' + t); avisos.push(t); };
const dentro = () => page.evaluate(() => [...document.querySelectorAll('#gu .orden,#gu .cuerpo,#gu #gu-retirar')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && r.height >= 40; }));
const cierraFin = async () => { try { await page.tap('#gu-seguir', { timeout: 60000 }); } catch (e) { /* Playwright a veces no recibe el acuse del toque porque el botón desaparece al pulsarlo: se comprueba el efecto, no el acuse */ if (!(await page.waitForFunction(() => !window.__gc || window.__gc.cerrado || !!document.querySelector('#modal:not([hidden]) [data-act="bdone"]'), null, { timeout: 30000 }).then(() => true, () => false))) throw e; }   /* JU1: el botón no se quita del DOM y, a ~1 fotograma/s, el toque llega tarde: se espera a que la batalla se cierre o salga el resultado */ await esp(1500); const b = page.locator('#modal:not([hidden]) [data-act="bdone"]'); if (await b.count()) { await b.click(); await esp(600); } };

/* ejército grande a Capua: más de 600 hombres, así que pasa antes por la maniobra */
async function provocaGrande() {
  await page.evaluate(() => { const G = window.Game, s = G.state; s.cities.capua.owner = 'campanos'; s.cities.capua.units = { hoplitas: 400, milicia: 300 }; s.cities.roma.units = { hastati: 500, principes: 300, triarii: 100 }; s.marches = [];
    G.send('roma', 'capua', { hastati: 500, principes: 300, triarii: 100 }, false); s.marches[0].t1 = s.t + 0.01; G.tick(G.turnos ? Math.max(0.02, G.finTurno() - s.t) : 0.05); });
  for (let i = 0; i < 10; i++) { await esp(1000); if (await page.locator('#modal:not([hidden]) [data-act="bview"]').count()) break; const b = page.locator('#modal:not([hidden]) .btn').first(); if (await b.count()) await b.click(); }
  await page.waitForSelector('#modal:not([hidden]) [data-act="bview"]', { timeout: 20000 });
}

await page.goto('http://127.0.0.1:' + srv.address().port + '/'); await esp(1500);
await page.click('#menu [data-act="new"]'); await esp(10000);
await page.evaluate(() => { const b = document.querySelector('#modal .btn'); if (b) b.click(); }); await esp(800);

/* ---- A · entrar por defecto; «Retirarse» durante la carga; primer toque útil ---- */
console.log('A · ataque normal: carga, primer toque y órdenes');
await provoca();
await page.click('#modal [data-act="bview"]');
let cartelVisto = false, retirarTapado = null, t0 = Date.now();
for (let i = 0; i < 400; i++) {
  const m = await page.evaluate(() => {
    const c = document.querySelector('#gu-carga'), r = document.querySelector('#gu-retirar'); if (!c || !r) return null;
    const cs = getComputedStyle(c), cartel = !c.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
    const q = r.getBoundingClientRect(), e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
    return { cartel, libre: !!e && (e === r || r.contains(e)), lista: !!(window.__gc && window.__gc.lista), tapa: e ? (e.id || e.className || e.tagName) : 'nada' };
  });
  if (m && m.cartel) { cartelVisto = true; if (retirarTapado === null) { retirarTapado = !m.libre; await foto('A0-carga'); } }
  if (m && m.lista && !m.cartel) break;
  await page.waitForTimeout(60);
}
await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 120000 }); await esp(600);
console.log('  cartel de carga visto: ' + cartelVisto + ' · «Retirarse» tapado por él: ' + retirarTapado + ' · ' + Math.round((Date.now() - t0) / 100) / 10 + ' s hasta estar lista');
if (!cartelVisto) console.log('  (no se pilló el cartel: la carga fue más rápida que el muestreo)');
else if (!retirarTapado) bien(true, '«Retirarse» se puede pulsar mientras carga la pantalla');
else if (arregladoCarga) bien(false, '«Retirarse» está tapado por el cartel de carga y debería poder pulsarse');
else aviso('durante la carga el cartel #gu-carga tapa «Retirarse» (parte GC4). Al arreglarlo, poner FALLO_CARGA_ARREGLADO a true.');

/* primer toque útil: sin leer nada, ¿cuánto hasta que una orden hace efecto? */
const rot = await page.evaluate(() => {
  const o = [...document.querySelectorAll('#gu .orden')];
  return { n: o.length, textos: o.map(b => (b.querySelector('.que') || {}).textContent || ''), subs: o.map(b => (b.querySelector('.sub') || {}).textContent || ''), visibles: o.every(b => { const r = b.getBoundingClientRect(), s = getComputedStyle(b); return r.width > 0 && s.visibility !== 'hidden'; }),
    reglas: !!document.querySelector('#gu [class*="regla"],#gu [class*="tutorial"],#gu [id*="regla"],#gu [id*="ayuda"]') || /reglas|instrucciones|cómo se juega/i.test(document.querySelector('#gu').textContent),
    botonesTotales: [...document.querySelectorAll('#gu button')].filter(b => b.offsetParent !== null && getComputedStyle(b).visibility !== 'hidden' && b.getBoundingClientRect().height > 0).length };
});
console.log('  órdenes: ' + rot.textos.join(' / ') + ' · subtítulos: ' + rot.subs.join(' / '));
bien(rot.n === 4 && rot.n <= 4, 'hay cuatro órdenes (nunca más de 4)');
bien(rot.textos.every(t => { const p = t.trim().split(/\s+/).filter(Boolean).length; return p >= 1 && p <= 3; }), 'cada orden tiene un nombre de 1–3 palabras visible');
bien(rot.subs.every(t => t.trim().length > 2), 'cada orden tiene su subtítulo');
bien(!rot.reglas, 'no hay panel de reglas ni de instrucciones obligatorio');
const pendones = await page.evaluate(() => [...document.querySelectorAll('#gu-pendones .pend')].filter(d => !d.hidden).map(d => d.textContent.trim()));
bien(pendones.length === 3 && pendones.every(t => t.split(/\s+/).length <= 3 && t.length > 0), 'un único rótulo breve por cuerpo enemigo (' + pendones.join(' / ') + ')');
bien(await dentro(), 'todos los botones caben enteros y miden al menos 40 px (vertical)');
let toques = 0, efecto = false, tEfecto = 0, quien = '';
const tLista = Date.now(), btLista = await page.evaluate(() => window.__gc.B.t);   /* JU1: el plazo se mide en tiempo de batalla; aquí el render por software va a ~1 fotograma/s y el reloj de pared no es lo que vive el jugador */
const postura0 = await page.evaluate(() => window.__gc.B.sect.map(s => s.c[0].postura));
for (let ronda = 0; ronda < 12 && !efecto; ronda++) {
  const pide = page.locator('#gu .orden.pide').first(), hay = await pide.count();
  if (hay || ronda >= 6) {
    const b = hay ? pide : page.locator('#gu .orden:not(.no):not(.activa)').first();
    quien = await b.evaluate(e => e.dataset.o + (e.classList.contains('pide') ? ' (late)' : ' (sin latir)')); await b.tap(); toques++; await esp(300);
    efecto = await page.evaluate(p0 => window.__gc.B.sect.some((s, i) => s.c[0].postura !== p0[i]), postura0); tEfecto = (await page.evaluate(() => window.__gc.B.t)) - btLista;
  } else await esp(700);
}
bien(efecto, 'una orden surte efecto con un solo toque: ' + quien);
console.log('  CIFRA primer toque útil: ' + toques + ' toque(s), ' + tEfecto.toFixed(1) + ' s de batalla (' + ((Date.now() - tLista) / 1000).toFixed(1) + ' s de reloj aquí) desde que la pantalla está lista, sin leer nada');
bien(toques <= 2 && tEfecto <= 15, 'el primer efecto llega con pocos toques y pronto (límite razonable: 2 toques, 15 s)');
await foto('A1-primer-efecto');

/* arte: medidas objetivas (límites razonables, no rígidos) */
const arte = await page.evaluate(() => {
  const els = [document.querySelector('#gu'), ...document.querySelectorAll('#gu *')], col = new Set(), fam = new Set();
  const norm = c => { const m = c.match(/[\d.]+/g); if (!m || (m.length > 3 && +m[3] === 0)) return null; return m.slice(0, 3).map(v => Math.round(+v / 16) * 16).join(','); };   // se agrupan tonos casi iguales
  for (const e of els) { const s = getComputedStyle(e); for (const p of ['color', 'backgroundColor', 'borderTopColor']) { const k = norm(s[p]); if (k) col.add(k); } fam.add(s.fontFamily.split(',')[0].replace(/["']/g, '').trim()); }
  const rotas = [...document.querySelectorAll('#gu img')].filter(i => !i.complete || i.naturalWidth === 0).length;
  const lz = document.querySelector('#gu-lienzo'); const r = lz.getBoundingClientRect();
  return { colores: col.size, fam: [...fam], rotas, creditos: /0 A\.D\./.test(document.querySelector('#gu').textContent) && /CC BY-SA/.test(document.querySelector('#gu').textContent), lienzo: { x: r.left, y: r.top, w: r.width, h: r.height } };
});
console.log('  CIFRAS arte: ' + arte.colores + ' colores distintos de interfaz (agrupados en pasos de 16) · tipografías: ' + arte.fam.join(' | '));
bien(arte.colores <= 20, 'paleta contenida: ' + arte.colores + ' colores (límite razonable 20; la interfaz es dorado, rojo, verde y ámbar sobre oscuro)');
bien(arte.fam.length <= 2, 'como mucho 2 tipografías (' + arte.fam.length + ')');
bien(arte.rotas === 0, 'sin imágenes rotas');
const buf = await page.screenshot({ type: 'png', clip: { x: Math.max(0, arte.lienzo.x), y: arte.lienzo.y, width: Math.min(390, arte.lienzo.w), height: Math.min(arte.lienzo.h, 330) } });
const px = await page.evaluate(async b64 => { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob()), c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data, k = new Set(); let lum = 0, n = 0; for (let i = 0; i < d.length; i += 40) { k.add((d[i] >> 5) + ',' + (d[i + 1] >> 5) + ',' + (d[i + 2] >> 5)); lum += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; } return { tonos: k.size, luz: Math.round(lum / n) }; }, buf.toString('base64'));
console.log('  CIFRAS lienzo: ' + px.tonos + ' tonos distintos, luz media ' + px.luz + '/255');
bien(px.tonos >= 12 && px.luz > 25, 'el campo tiene contenido (no vacío ni negro)');
bien(arte.creditos, 'los créditos de 0 A.D. (CC BY-SA 3.0) están en la pantalla de la batalla');

/* defensa: GC9 — G.send solo manda ejércitos romanos; el ataque rival se provoca poniendo una marcha enemiga (como hace la IA con spawn) */
await page.setViewportSize({ width: 844, height: 390 }); await esp(900);
bien(await page.evaluate(() => [...document.querySelectorAll('#gu .orden,#gu .cuerpo,#gu #gu-retirar')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && r.height >= 40; })), 'en horizontal todo cabe y mide al menos 40 px');
await foto('A3-horizontal');

/* ---- B · salir: «Retirarse» pregunta; «Seguir luchando» deja seguir; dos toques fuera ---- */
console.log('B · salir');
const t1 = await page.evaluate(() => window.__gc.B.t);
await pulsa('#gu-retirar'); await foto('B1-pregunta');
bien(await page.isVisible('#gu-salir-si') && await page.isVisible('#gu-salir-no'), '«Retirarse» pregunta con dos botones');
await pulsa('#gu-salir-no'); await esp(1200);
bien(!(await page.isVisible('#gu-salir')) && await page.evaluate(t => window.__gc.B.fase !== 'fin' && window.__gc.B.t > t, t1), '«Seguir luchando» cierra la pregunta y la batalla sigue');
await pulsa('#gu-retirar'); await pulsa('#gu-salir-si'); await esp(1000); await foto('B2-fuera');
bien(await page.evaluate(() => window.__gc.B.resultado && window.__gc.B.resultado.como) === 'retirada', 'dos toques bastan para salir');
await cierraFin(); await page.setViewportSize({ width: 390, height: 844 }); await esp(500);

/* ---- C · defensa ---- */
console.log('C · defensa');
const hayDef = await page.evaluate(() => { try { const G = Game, s = G.state; s.marches = []; s.cities.capua.owner = 'campanos'; s.cities.capua.units = { hoplitas: 150, milicia: 100 }; s.cities.roma.units = { hastati: 200, principes: 100 }; s.marches.push({ id: s.mid++, owner: 'campanos', from: 'capua', to: 'roma', units: { hoplitas: 150, milicia: 100 }, hero: false, t0: s.t, t1: s.t + 0.01 }); G.tick(G.turnos ? Math.max(0.02, G.finTurno() - s.t) : 0.05); return true; } catch (e) { return false; } });
let defendido = false;
if (hayDef) { /* GC9: primero sale el aviso histórico («Pirro marcha sobre Roma», botón «close») y luego la defensa; no se pulsa el primer botón si ya está «bview» (sería abrir la batalla sin querer) */
  for (let i = 0; i < 10; i++) { await esp(900); if (await page.locator('#modal:not([hidden]) [data-act="bview"]').count()) break; const b = page.locator('#modal:not([hidden]) .btn').first(); if (await b.count()) await b.click(); }
  if (await page.locator('#modal:not([hidden]) [data-act="bview"]').count()) { await abreBatalla(); defendido = true; } }
if (defendido) { await gc('pausa', true); bien(await page.locator('#gu .orden').count() === 4 && await page.isVisible('#gu-retirar'), 'la defensa muestra las mismas cuatro órdenes y «Retirarse»'); bien(await dentro(), 'defensa: todo cabe y mide ≥ 40 px'); await foto('C1-defensa'); await gc('pausa', false); /* no se retira: retirarse de la defensa de Roma perdería la capital; se juega con el bot hasta el final */ await page.evaluate(() => { const G = window.Game, g = window.__gc; let n = 0; while (g.B.fase !== 'fin' && n++ < 400) { G.botGuerra(g.B); g.salta(1.5); } }); await esp(2500); await cierraFin(); }
else console.log('  (no se pudo provocar una defensa en el juego real: no se juzga; ver informe)');

/* ---- D · maniobra (más de 600 hombres) ---- */
console.log('D · maniobra');
await page.setViewportSize({ width: 390, height: 844 }); await esp(500);
await provocaGrande();
const bat0 = await page.evaluate(() => Game.state.stats.battles);
await page.click('#modal [data-act="bview"]'); await esp(2500);
bien(await page.locator('#man').count() > 0 && await page.locator('[data-a="pasar"]').count() > 0, 'con más de 600 hombres se abre primero la maniobra');
await foto('D1-maniobra');
const salidaTemprana = await page.locator('#man [data-a="salir"], #man [data-a="fin"]').count() > 0;
if (salidaTemprana) bien(true, 'la maniobra tiene salida a la vista desde el primer día');
else if (arregladoSalida) bien(false, 'la maniobra debería tener «Retirarse» a la vista desde el primer día');
else aviso('la maniobra no tiene salida antes del choque: «Retirarse» solo sale en el panel del choque (js/ui-maniobra.js línea 67).');
let choque = false;
for (let i = 0; i < 30 && !choque; i++) {
  if (await page.locator('.m-choque [data-a="batalla"]').count()) { choque = true; break; }
  if (await page.locator('[data-a="pasar"]').count()) await page.tap('[data-a="pasar"]'); await esp(500);
  if (i === 1) await foto('D2-pasando-dias');
}
bien(choque, 'pasando los días se llega al choque (' + (choque ? 'botón «batalla» a la vista' : 'no llegó') + ')');
if (choque) {
  await foto('D3-choque'); await page.tap('.m-choque [data-a="batalla"]');
  await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 120000 }); await esp(1500); await foto('D4-batalla-tras-maniobra');
  bien(await page.isVisible('#gu-retirar') && await page.locator('#gu .orden').count() === 4, 'tras la maniobra se llega a la batalla con «Retirarse» y cuatro órdenes');
  await page.evaluate(() => { const G = window.Game, g = window.__gc; let n = 0; while (g.B.fase !== 'fin' && n++ < 400) { G.botGuerra(g.B); g.salta(1.5); } });
  await esp(2500); await foto('D5-final'); await cierraFin();
  bien(await page.evaluate(n => Game.state.stats.battles === n + 1, bat0), 'el resultado de la batalla tras la maniobra se aplica a la campaña');
}
/* salir al llegar el choque: «Retirarse» y se aplica el resultado */
await provocaGrande(); const bat1 = await page.evaluate(() => Game.state.stats.battles);
await page.click('#modal [data-act="bview"]'); await esp(2500);
for (let i = 0; i < 30 && !(await page.locator('.m-choque [data-a="retirar"]').count()); i++) { if (await page.locator('[data-a="pasar"]').count()) await page.tap('[data-a="pasar"]'); await esp(500); }
bien(await page.locator('.m-choque [data-a="retirar"]').count() > 0, 'en el choque se puede «Retirarse»');
if (await page.locator('.m-choque [data-a="retirar"]').count()) { await page.tap('.m-choque [data-a="retirar"]'); await esp(900); await foto('D6-retirada-maniobra'); }
/* «Retirarse» en la maniobra es una jugada, no una salida: se sigue pasando días hasta que termina (o hay otro choque) */
for (let i = 0; i < 24 && await page.locator('#man').count(); i++) {
  if (await page.locator('#man [data-a="fin"]').count()) await page.tap('#man [data-a="fin"]');
  else if (await page.locator('.m-choque [data-a="batalla"]').count()) { await page.tap('.m-choque [data-a="batalla"]'); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 120000 }); await page.evaluate(() => { const G = window.Game, g = window.__gc; let n = 0; while (g.B.fase !== 'fin' && n++ < 400) { G.botGuerra(g.B); g.salta(1.5); } }); await esp(2500); await cierraFin(); }
  else if (await page.locator('[data-a="pasar"]').count()) await page.tap('[data-a="pasar"]');
  await esp(600);
}
await esp(1200);
bien(!(await page.locator('#man').count()), 'la maniobra termina tras retirarse y pasar los días');
bien(await page.evaluate(n => Game.state.stats.battles === n + 1, bat1), 'el resultado de la maniobra se aplica a la campaña');
if (await page.locator('#modal:not([hidden]) [data-act="bdone"]').count()) { await page.click('#modal [data-act="bdone"]'); await esp(500); }

console.log(fallos.length ? 'NO APTO · ' + fallos.length + ' fallos:\n' + fallos.join('\n') : 'APTO · sin errores de consola y todo en orden' + (avisos.length ? ' (con ' + avisos.length + ' aviso(s) del fallo conocido)' : ''));
await br.close(); srv.close(); process.exit(fallos.length ? 1 : 0);
