/* AQVILA — CG4b: juez de la batalla de la campaña jugada de verdad (antes GC2, con la pantalla vieja js/ui-guerra.js).
   Desde CG4b la campaña lucha con el simulador de manípulos (js/simulador.js), como Escaramuzas: «Ir al choque» abre la hoja
   «¿Cómo quieres librar la batalla?» (js/ui-batalla-rapida.js: Jugar en vivo, Batalla rápida, Resolver) y «Jugar en vivo» abre el
   mando (js/ui-mando.js, ganchos window.__mn). Este juez lo recorre como el jugador, desde el mapa:
     A · ataque: hoja de tres opciones y «Volver»; en vivo, «Retirarse» libre mientras carga, una orden con el dedo a un manípulo
         (que obedece), arte cargado y medido, todo cabe (vertical y horizontal), la cámara sigue al choque y cede al dedo.
     B · salir: «Retirarse» pregunta, «Seguir luchando» sigue, dos toques bastan; «Ver el resultado» y el resultado va a la campaña.
     R · recargar a mitad: la batalla se guarda sola (al pausar); tras recargar, «Seguir la batalla» la retoma donde iba; se termina.
     Q · «Batalla rápida» y S · «Resolver» desde la campaña: acaban en el resultado de la campaña.
     C · defensa. D · maniobra (más de 600 hombres) hasta el choque y la batalla, y retirarse en la maniobra.
   Uso: node gobierno/juez-guerra.mjs [dpr=2] [prefijo=/ruta/CG4b-]      (lo llama gobierno/jueces.mjs; se salta con --rapido)
   Capturas: gobierno/capturas-tarea/CG4b-*.jpg. Sale con código 1 si hay errores de consola o falla una comprobación. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'CG4b-');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true });
/* J20a: fotogramas espaciados (gobierno/ritmo-pruebas.js; RITMO_MS=0 lo quita): la página responde al juez en milisegundos */
const RITMO_MS = process.env.RITMO_MS === undefined ? 1000 : +process.env.RITMO_MS;
if (RITMO_MS > 0) await ctx.addInitScript({ content: 'window.__ritmoMs=' + RITMO_MS + ';' + await readFile(join(RAIZ, 'gobierno', 'ritmo-pruebas.js'), 'utf8') });
const page = await ctx.newPage();
const fallos = [], esp = ms => page.waitForTimeout(ms);
page.setDefaultTimeout(120000);   /* a ~1 fotograma/s y con la máquina cargada, 30 s no bastan */
page.on('console', m => { if (m.type() === 'error' && !/GPU stall|GL Driver/.test(m.text())) { fallos.push('consola: ' + m.text().slice(0, 250)); console.log('  [error] ' + m.text().slice(0, 250)); } });
page.on('pageerror', e => { fallos.push('excepción: ' + String(e.message).slice(0, 250)); console.log('  [excepción] ' + e.message.slice(0, 250)); });
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) fallos.push('prueba: ' + texto); };
const foto = async n => { await esp(1200); for (let i = 0; ; i++) { try { await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 82, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } } console.log('  captura ' + n); };
const mn = (f, ...a) => page.evaluate(([f, a]) => window.__mn[f](...a), [f, a]);
const pulsa = async sel => { await tapa(sel); await esp(250); };
const batallas = () => page.evaluate(() => Game.state.stats.battles);
const PRE = '#modal:not([hidden]) [data-act="bview"], #modal:not([hidden]) [data-act="bcont"]';

/* provoca un ataque a Capua con un ejército pequeño (menos de 600 hombres: sin maniobra) y espera el aviso de batalla */
async function provoca() {
  await page.evaluate(() => { const G = window.Game, s = G.state; s.cities.capua.owner = 'campanos'; s.cities.capua.units = { hoplitas: 150, milicia: 100 }; s.cities.roma.units = { hastati: 200, principes: 100 }; s.marches = [];
    G.send('roma', 'capua', { hastati: 200, principes: 100 }, false); s.marches[0].t1 = s.t + 0.01; G.tick(G.turnos ? Math.max(0.02, G.finTurno() - s.t) : 0.05); });
  await esperaAviso();
}
/* ejército grande a Capua: más de 600 hombres, así que pasa antes por la maniobra */
async function provocaGrande() {
  await page.evaluate(() => { const G = window.Game, s = G.state; s.cities.capua.owner = 'campanos'; s.cities.capua.units = { hoplitas: 400, milicia: 300 }; s.cities.roma.units = { hastati: 500, principes: 300, triarii: 100 }; s.marches = [];
    G.send('roma', 'capua', { hastati: 500, principes: 300, triarii: 100 }, false); s.marches[0].t1 = s.t + 0.01; G.tick(G.turnos ? Math.max(0.02, G.finTurno() - s.t) : 0.05); });
  await esperaAviso();
}
/* los avisos que salgan antes (hechos históricos…) se cierran con su primer botón, salvo que ya esté el de la batalla */
async function esperaAviso() {
  for (let i = 0; i < 12; i++) { await esp(900); if (await page.locator(PRE).count()) break; const b = page.locator('#modal:not([hidden]) .btn').first(); if (await b.count()) await b.evaluate(e => e.click()); }
  await page.waitForSelector(PRE, { timeout: 20000 });
}
/* «Ir al choque» → la hoja de tres opciones */
/* el clic va por el DOM: a ~1 fotograma/s Playwright puede no recibir el acuse de un clic de ratón aunque llegue */
const clic = sel => page.evaluate(q => { const e = document.querySelector(q); if (!e) throw new Error('no está ' + q); e.click(); }, sel);
/* un toque con el dedo; si Playwright no recibe el acuse (máquina cargada, ~1 fotograma/s), el clic va por el DOM */
const tapa = async (sel, o) => { try { await page.tap(sel, Object.assign({ noWaitAfter: true, timeout: 45000 }, o || {})); } catch (e) { if (o && o.soloDedo) throw e; await clic(sel); } };
async function hoja() { await clic('#modal [data-act="bview"]'); await page.waitForSelector('#br-el', { timeout: 30000 }); await esp(400); }
/* una opción de la hoja; «vivo» espera a que el mando esté listo */
async function elige(k) {
  await tapa('#br-el [data-k="' + k + '"]');
  if (k === 'vivo') { await page.waitForFunction('window.__mn && window.__mn.lista === true && !window.__mn.cerrado', null, { timeout: 180000 }); await esp(1200); }
}
/* acaba la batalla en vivo deprisa (el mismo simulador, sin pintar cada paso) y pulsa «Ver el resultado» */
async function acabaVivo(n) {
  await page.evaluate(() => { const g = window.__mn, S = g.S; if (S.pausa) g.pausa(false); g.Sim.avanzar(S, Math.max(0, S.limite - S.t) + 1); g.salta(1); });
  await page.waitForSelector('#mn-seguir:visible', { timeout: 30000 }); if (n) await foto(n);
  await verResultado('#mn-seguir');
}
/* «Ver el resultado» (mando o batalla rápida) y el modal de la campaña con «bdone». Devuelve el título del modal */
async function verResultado(sel) {
  try { await tapa(sel, { timeout: 60000 }); } catch (e) { /* a ~1 fotograma/s el acuse del toque puede no llegar: se mira el efecto */ }
  await page.waitForSelector('#modal:not([hidden]) [data-act="bdone"]', { timeout: 60000 });
  return page.evaluate(() => (document.querySelector('#modal:not([hidden]) h2') || {}).textContent || '');
}
const cierraResultado = async () => { const b = page.locator('#modal:not([hidden]) [data-act="bdone"]'); if (await b.count()) { await b.evaluate(e => e.click()); await esp(600); } };
/* botones del mando: caben enteros y miden al menos 40 px (los de pantalla; los velos ocultos no cuentan) */
const dentro = () => page.evaluate(() => [...document.querySelectorAll('#mn .mn-o, #mn .mn-b1, #mn-varios')].filter(b => b.offsetParent !== null).every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 0.5 && r.top >= 0 && r.bottom <= innerHeight + 0.5 && r.height >= 40; }));

await page.goto('http://127.0.0.1:' + srv.address().port + '/'); await esp(1500);
await clic('#menu [data-act="new"]'); await esp(10000);
await page.evaluate(() => { const b = document.querySelector('#modal .btn'); if (b) b.click(); }); await esp(800);

/* ---- A · ataque normal: hoja, en vivo, orden con el dedo, arte, cámara ---- */
console.log('A · ataque: hoja, carga, orden con el dedo, arte y cámara');
await provoca(); await hoja();
const opciones = await page.evaluate(() => [...document.querySelectorAll('#br-el [data-k]')].map(b => b.dataset.k));
bien(['vivo', 'rapida', 'resolver', 'volver'].every(k => opciones.includes(k)), 'la hoja ofrece «Jugar en vivo», «Batalla rápida», «Resolver» y «Volver» (' + opciones.join(', ') + ')');
bien(await page.evaluate(() => [...document.querySelectorAll('#br-el button')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.height >= 40; })), 'la hoja cabe en 390 px y sus botones miden al menos 40 px');
await foto('A0-hoja');
await tapa('#br-el [data-k="volver"]'); await esp(900);
bien(!(await page.locator('#br-el').count()) && await page.locator('#modal:not([hidden]) [data-act="bview"]').count() > 0, '«Volver» deja la hoja y vuelve a la pregunta de la batalla (sin librarla)');
await hoja();
await tapa('#br-el [data-k="vivo"]');
let cartelVisto = false, retirarTapado = null; const t0 = Date.now();
for (let i = 0; i < 400; i++) {
  const m = await page.evaluate(() => {
    const c = document.querySelector('#mn-carga'), r = document.querySelector('#mn-retirar'); if (!c || !r) return null;
    const cs = getComputedStyle(c), cartel = !c.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05;
    const q = r.getBoundingClientRect(), e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
    return { cartel, libre: !!e && (e === r || r.contains(e)), lista: !!(window.__mn && window.__mn.lista) };
  });
  if (m && m.cartel) { cartelVisto = true; if (retirarTapado === null) { retirarTapado = !m.libre; await foto('A1-carga'); } }
  if (m && m.lista && !m.cartel) break;
  await page.waitForTimeout(60);
}
await page.waitForFunction('window.__mn && window.__mn.lista === true', null, { timeout: 180000 }); await esp(800);
console.log('  cartel de carga visto: ' + cartelVisto + ' · «Retirarse» tapado por él: ' + retirarTapado + ' · ' + Math.round((Date.now() - t0) / 100) / 10 + ' s hasta estar lista');
if (!cartelVisto) console.log('  (no se pilló el cartel: la carga fue más rápida que el muestreo)');
else bien(!retirarTapado, '«Retirarse» se puede pulsar mientras carga la pantalla');
bien(await page.evaluate(() => { const S = window.__mn.S; return S.man.some(u => u.lado === 0) && S.man.some(u => u.lado === 1) && !!window.__mn.S.reg; }), 'la batalla de la campaña es la del simulador: manípulos de los dos bandos');

/* primer toque útil, con el dedo: tocar un manípulo tuyo y luego «Aguantar». Se espera a que acabe el plano de apertura */
await page.waitForFunction(() => window.__mn.cine() !== 'apertura', null, { timeout: 60000 }).catch(() => {});
const btLista = await page.evaluate(() => window.__mn.S.t);
const id = await page.evaluate(() => { const S = window.__mn.S, u = S.man.find(m => m.lado === 0 && m.tropa === 'hastati' && m.estado === 'firme') || S.man.find(m => m.lado === 0); return u.id; });
let toques = 0, elegido = false;
for (let k = 0; k < 3 && !elegido; k++) {
  const p = await mn('pantalla', id); await page.touchscreen.tap(Math.round(p.x), Math.round(p.y)); toques++; await esp(700);
  elegido = (await mn('estado')).sel.includes(id);
}
bien(elegido, 'tocar con el dedo un manípulo tuyo lo elige (' + toques + ' toque(s))');
const boton = page.locator('#mn-ordenes .mn-o').filter({ hasText: 'Aguantar' }).first();
let obedece = false;
if (elegido && await boton.count()) { await boton.tap({ noWaitAfter: true, timeout: 45000 }).catch(() => boton.evaluate(e => e.click())); toques++; await esp(600); obedece = await page.evaluate(i => { const u = window.__mn.S.man[i]; return u.orden === 'aguantar' && u.mando === 'jugador'; }, id); }
const tEfecto = (await page.evaluate(() => window.__mn.S.t)) - btLista;
bien(obedece, 'el manípulo obedece la orden dada con el dedo («Aguantar»: aguanta y lo llevas tú)');
console.log('  CIFRA primer toque útil: ' + toques + ' toques, ' + tEfecto.toFixed(1) + ' s de batalla desde que la pantalla está lista, sin leer nada');
bien(toques <= 3 && tEfecto <= 15, 'el primer efecto llega con pocos toques y pronto (límite razonable: elegir y mandar, 15 s)');
bien(await dentro(), 'todos los botones del mando caben enteros y miden al menos 40 px (vertical)');
await foto('vivo');

/* arte: medidas objetivas (límites razonables, no rígidos) */
const arte = await page.evaluate(() => {
  const raiz = document.querySelector('#mn'), els = [raiz, ...raiz.querySelectorAll('#mn-hud *')].filter(e => !e.closest('[hidden]') && !e.closest('.mn-e')), col = new Set(), fam = new Set();
  const norm = c => { const m = c.match(/[\d.]+/g); if (!m || (m.length > 3 && +m[3] === 0)) return null; return m.slice(0, 3).map(v => Math.round(+v / 16) * 16).join(','); };   // se agrupan tonos casi iguales
  for (const e of els) { const s = getComputedStyle(e); for (const p of ['color', 'backgroundColor', 'borderTopColor']) { const k = norm(s[p]); if (k) col.add(k); } fam.add(s.fontFamily.split(',')[0].replace(/["']/g, '').trim()); }
  const rotas = [...raiz.querySelectorAll('img')].filter(i => !i.complete || i.naturalWidth === 0).length;
  const lz = document.querySelector('#mn-lienzo'), r = lz.getBoundingClientRect(), e = window.__mn.estado();
  return { colores: col.size, fam: [...fam], rotas, figuras: e.figuras, tri: e.tri, creditos: /0 A\.D\./.test(raiz.textContent) && /CC BY-SA/.test(raiz.textContent), lienzo: { x: r.left, y: r.top, w: r.width, h: r.height } };
});
console.log('  CIFRAS arte: ' + arte.colores + ' colores de interfaz (agrupados en pasos de 16) · tipografías: ' + arte.fam.join(' | ') + ' · ' + arte.figuras + ' figuras · ' + arte.tri + ' triángulos');
bien(arte.colores <= 20, 'paleta contenida: ' + arte.colores + ' colores (límite razonable 20)');
bien(arte.fam.length <= 2, 'como mucho 2 tipografías (' + arte.fam.length + ')');
bien(arte.rotas === 0, 'sin imágenes rotas');
bien(arte.figuras > 100, 'el arte de los soldados está cargado (' + arte.figuras + ' figuras en pie)');
const buf = await page.screenshot({ type: 'png', clip: { x: Math.max(0, arte.lienzo.x), y: arte.lienzo.y + 60, width: Math.min(390, arte.lienzo.w), height: Math.min(arte.lienzo.h - 60, 330) } });
const px = await page.evaluate(async b64 => { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob()), c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data, k = new Set(); let lum = 0, n = 0; for (let i = 0; i < d.length; i += 40) { k.add((d[i] >> 5) + ',' + (d[i + 1] >> 5) + ',' + (d[i + 2] >> 5)); lum += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; } return { tonos: k.size, luz: Math.round(lum / n) }; }, buf.toString('base64'));
console.log('  CIFRAS lienzo: ' + px.tonos + ' tonos distintos, luz media ' + px.luz + '/255');
bien(px.tonos >= 12 && px.luz > 25, 'el campo tiene contenido (no vacío ni negro)');
bien(arte.creditos, 'los créditos de 0 A.D. (CC BY-SA 3.0) están en la pantalla de la batalla');

/* la cámara sigue al choque: sin tocarla, se desliza hacia la lucha; en cuanto el dedo la mueve, manda él */
await mn('camara');   // como un arrastre: la cámara queda libre unos segundos
const libre = await mn('cine');
await page.evaluate(() => { const g = window.__mn; g.pausa(false); for (let k = 0; k < 40 && !Object.values(g.S.cont || {}).some(c => c && c.length); k++) g.salta(2); });
await esp(7000);   /* más que el descanso tras tocar (6 s de reloj) */
const lejos = () => page.evaluate(() => { const g = window.__mn, S = g.S, c = g.estado().cam; let x = 0, z = 0, n = 0; for (const u of S.man) if ((u.estado === 'firme' || u.estado === 'duda') && S.cont && S.cont[u.id] && S.cont[u.id].length) { x += u.x; z -= u.y; n++; } if (!n) for (const u of S.man) if (u.estado === 'firme' || u.estado === 'duda') { x += u.x; z -= u.y; n++; } return Math.hypot(c.x - x / n, c.z - 25 - z / n); });
const modoSolo = await mn('cine'); await mn('pausa', true);
const d0 = await lejos(); await page.evaluate(() => { const g = window.__mn; g.pausa(false); for (let k = 0; k < 30; k++) g.cuadro(0.1); g.pausa(true); }); await esp(400);
const d1 = await lejos();
console.log('  cámara: tras tocarla «' + libre + '»; sin tocarla «' + modoSolo + '»; distancia al centro de la lucha ' + Math.round(d0) + ' → ' + Math.round(d1) + ' m');
bien(libre === 'mando' && (modoSolo === 'acompana' || modoSolo === 'sigue'), 'la cámara sigue sola al choque si no la tocas, y la deja quieta mientras la mueves tú');
bien(d1 < d0 || d0 < 30, 'la cámara se acerca al centro de la lucha (' + Math.round(d0) + ' → ' + Math.round(d1) + ' m)');

await page.setViewportSize({ width: 844, height: 390 }); await esp(1500);
await mn('elegir', [id]); await esp(600);
bien(await dentro(), 'en horizontal todo cabe y mide al menos 40 px');
await foto('horizontal');

/* ---- B · salir: «Retirarse» pregunta; «Seguir luchando» deja seguir; dos toques fuera; el resultado va a la campaña ---- */
console.log('B · salir');
await mn('pausa', false); const t1 = await page.evaluate(() => window.__mn.S.t), bat0 = await batallas();
await pulsa('#mn-retirar'); await foto('B1-pregunta');
bien(await page.isVisible('#mn-salir-si') && await page.isVisible('#mn-salir-no'), '«Retirarse» pregunta con dos botones');
await pulsa('#mn-salir-no'); await page.evaluate(() => { window.__mn.pausa(false); window.__mn.cuadro(0.1); }); await esp(1200);
bien(!(await page.isVisible('#mn-salir')) && await page.evaluate(t => window.__mn.S.fase !== 'fin' && window.__mn.S.t > t, t1), '«Seguir luchando» cierra la pregunta y la batalla sigue');
await pulsa('#mn-retirar'); await pulsa('#mn-salir-si'); await esp(1000);
bien(await page.evaluate(() => window.__mn.S.resultado && window.__mn.S.resultado.como) === 'retirada', 'dos toques bastan para salir');
const tituloB = await verResultado('#mn-seguir');
bien(await batallas() === bat0 + 1, 'la retirada se aplica a la campaña (' + tituloB.trim() + ')');
await cierraResultado(); await page.setViewportSize({ width: 390, height: 844 }); await esp(500);

/* ---- R · recargar a mitad: la batalla se guarda al pausar y «Seguir la batalla» la retoma ---- */
console.log('R · recargar a mitad y seguir');
await provoca(); await hoja(); await elige('vivo');
await page.evaluate(() => { const g = window.__mn; g.pausa(false); g.salta(25); });
await pulsa('#mn-pausa');   /* al pausar, se guarda (cfg.guardar) */
const antes = await page.evaluate(() => { const S = window.__mn.S; return { t: S.t, sem: S.sem, n: S.man.map(u => Math.round(u.n)).join(','), pausa: S.pausa }; });
const guardada = await page.evaluate(() => { try { return Object.keys(localStorage).some(k => /guerra/i.test(k) && !/save/.test(k)); } catch (e) { return false; } });
bien(antes.pausa && guardada, 'al pausar, la batalla queda guardada a mitad (en el segundo ' + Math.round(antes.t) + ')');
const bat1 = await batallas();
await page.reload({ waitUntil: 'load' }); await esp(2500);
await page.waitForSelector('#menu [data-act="continue"]', { timeout: 30000 }); await clic('#menu [data-act="continue"]'); await esp(3000);
for (let i = 0; i < 12 && !(await page.locator('#modal:not([hidden]) [data-act="bcont"]').count()); i++) { const b = page.locator('#modal:not([hidden]) .btn').first(); if (await b.count()) await b.evaluate(e => e.click()); await esp(900); }
const hayCont = await page.locator('#modal:not([hidden]) [data-act="bcont"]').count() > 0;
bien(hayCont, 'tras recargar, la campaña ofrece «Seguir la batalla»');
if (hayCont) {
  await tapa('#modal [data-act="bcont"]');
  await page.waitForFunction('window.__mn && window.__mn.lista === true && !window.__mn.cerrado', null, { timeout: 180000 }); await esp(1200);
  const despues = await page.evaluate(() => { const S = window.__mn.S; return { t: S.t, n: S.man.map(u => Math.round(u.n)).join(','), fin: S.fase === 'fin' }; });
  bien(!despues.fin && Math.abs(despues.t - antes.t) < 0.6 && despues.n === antes.n, 'la batalla sigue donde iba (segundo ' + Math.round(despues.t) + ', los mismos hombres en pie)');
  await foto('R1-retomada');
  await acabaVivo('resultado-mando');
  const titulo = await page.evaluate(() => (document.querySelector('#modal:not([hidden]) h2') || {}).textContent || '');
  await foto('resultado');
  bien(await batallas() === bat1 + 1 && await page.evaluate(() => !Game.guerraGuardada(UI.binfo)), 'al acabar, el resultado se aplica a la campaña y la batalla guardada se borra (' + titulo.trim() + ')');
  await cierraResultado();
}

/* ---- Q · «Batalla rápida» desde la campaña ---- */
console.log('Q · batalla rápida');
await provoca(); const bat2 = await batallas(); await hoja(); await elige('rapida');
await page.waitForSelector('#br canvas', { timeout: 30000 }); await esp(1500); await foto('rapida');
const veloVisible = () => page.evaluate(() => { const v = document.querySelector('#br .br-velo'); return !!v && !v.hidden; });
for (let i = 0; i < 40 && !(await veloVisible()); i++) {
  const f = await page.evaluate(() => window.__br && window.__br.fase);
  if (f === 'planear' && await page.locator('#br .br-mirar').count()) await tapa('#br .br-mirar');
  else if (f === 'mirar' && await page.locator('#br .br-saltar').count()) await tapa('#br .br-saltar');
  await esp(700);
}
bien(await veloVisible(), 'la batalla rápida llega a su final');
if (await veloVisible()) { await foto('rapida-fin'); const t = await verResultado('#br .br-ver'); bien(await batallas() === bat2 + 1, 'la batalla rápida se aplica a la campaña (' + t.trim() + ')'); await cierraResultado(); }

/* ---- S · «Resolver» desde la campaña ---- */
console.log('S · resolver');
await provoca(); const bat3 = await batallas(); await hoja(); await elige('resolver');
await page.waitForSelector('#br .br-velo:not([hidden])', { timeout: 30000 }); await foto('resolver');
{ const t = await verResultado('#br .br-ver'); bien(await batallas() === bat3 + 1, '«Resolver» se aplica a la campaña (' + t.trim() + ')'); await cierraResultado(); }

/* ---- C · defensa: el ataque rival se provoca poniendo una marcha enemiga (como hace la IA) ---- */
console.log('C · defensa');
const hayDef = await page.evaluate(() => { try { const G = Game, s = G.state; s.marches = []; s.cities.capua.owner = 'campanos'; s.cities.capua.units = { hoplitas: 150, milicia: 100 }; s.cities.roma.units = { hastati: 200, principes: 100 }; s.marches.push({ id: s.mid++, owner: 'campanos', from: 'capua', to: 'roma', units: { hoplitas: 150, milicia: 100 }, hero: false, t0: s.t, t1: s.t + 0.01 }); G.tick(G.turnos ? Math.max(0.02, G.finTurno() - s.t) : 0.05); return true; } catch (e) { return false; } });
let defendido = false;
if (hayDef) { for (let i = 0; i < 10; i++) { await esp(900); if (await page.locator('#modal:not([hidden]) [data-act="bview"]').count()) break; const b = page.locator('#modal:not([hidden]) .btn').first(); if (await b.count()) await b.evaluate(e => e.click()); }
  if (await page.locator('#modal:not([hidden]) [data-act="bview"]').count()) defendido = true; }
if (defendido) {
  const bat4 = await batallas(); await hoja(); await elige('vivo'); await mn('pausa', true);
  const mios = await page.evaluate(() => window.__mn.S.man.filter(u => u.lado === 0).length);
  bien(mios > 0 && await page.isVisible('#mn-retirar'), 'la defensa abre el mismo mando, con tus manípulos y «Retirarse»');
  await mn('elegir', [await page.evaluate(() => window.__mn.S.man.find(u => u.lado === 0).id)]); await esp(500);
  bien(await dentro(), 'defensa: todo cabe y mide ≥ 40 px'); await foto('C1-defensa');
  await acabaVivo(); bien(await batallas() === bat4 + 1, 'la defensa se aplica a la campaña'); await cierraResultado();
} else console.log('  (no se pudo provocar una defensa en el juego real: no se juzga; ver informe)');

/* ---- D · maniobra (más de 600 hombres) ---- */
console.log('D · maniobra');
await page.setViewportSize({ width: 390, height: 844 }); await esp(500);
await provocaGrande(); const bat5 = await batallas();
await clic('#modal [data-act="bview"]'); await esp(2500);
bien(await page.locator('#man').count() > 0 && await page.locator('[data-a="pasar"]').count() > 0, 'con más de 600 hombres se abre primero la maniobra');
bien(await page.locator('#man [data-a="salir"], #man [data-a="fin"]').count() > 0, 'la maniobra tiene salida a la vista desde el primer día');
let choque = false;
for (let i = 0; i < 30 && !choque; i++) {
  if (await page.locator('.m-choque [data-a="batalla"]').count()) { choque = true; break; }
  if (await page.locator('[data-a="pasar"]').count()) await tapa('[data-a="pasar"]'); await esp(500);
}
bien(choque, 'pasando los días se llega al choque (' + (choque ? 'botón «batalla» a la vista' : 'no llegó') + ')');
if (choque) {
  await tapa('.m-choque [data-a="batalla"]'); await page.waitForSelector('#br-el', { timeout: 30000 });
  bien(true, 'tras la maniobra, el choque abre la hoja de tres opciones');
  await elige('vivo'); await foto('D1-batalla-tras-maniobra');
  bien(await page.isVisible('#mn-retirar') && await page.evaluate(() => window.__mn.S.man.some(u => u.lado === 0)), 'tras la maniobra se llega al mando en vivo, con «Retirarse»');
  await acabaVivo();
  bien(await batallas() === bat5 + 1, 'el resultado de la batalla tras la maniobra se aplica a la campaña'); await cierraResultado();
}
/* salir al llegar el choque: «Retirarse» en la maniobra es una jugada; se sigue pasando días hasta que termina */
await provocaGrande(); const bat6 = await batallas();
await clic('#modal [data-act="bview"]'); await esp(2500);
for (let i = 0; i < 30 && !(await page.locator('.m-choque [data-a="retirar"]').count()); i++) { if (await page.locator('[data-a="pasar"]').count()) await tapa('[data-a="pasar"]'); await esp(500); }
bien(await page.locator('.m-choque [data-a="retirar"]').count() > 0, 'en el choque se puede «Retirarse»');
if (await page.locator('.m-choque [data-a="retirar"]').count()) { await tapa('.m-choque [data-a="retirar"]'); await esp(900); }
for (let i = 0; i < 24 && await page.locator('#man').count(); i++) {
  if (await page.locator('#man [data-a="fin"]').count()) await tapa('#man [data-a="fin"]');
  else if (await page.locator('.m-choque [data-a="batalla"]').count()) { await tapa('.m-choque [data-a="batalla"]'); await page.waitForSelector('#br-el', { timeout: 30000 }); await elige('resolver'); await page.waitForSelector('#br .br-velo:not([hidden])', { timeout: 30000 }); await tapa('#br .br-ver').catch(() => {}); await esp(1500); break; }
  else if (await page.locator('[data-a="pasar"]').count()) await tapa('[data-a="pasar"]');
  await esp(600);
}
await esp(1200);
bien(!(await page.locator('#man').count()), 'la maniobra termina tras retirarse y pasar los días');
await page.waitForSelector('#modal:not([hidden]) [data-act="bdone"]', { timeout: 30000 }).catch(() => {});
bien(await batallas() === bat6 + 1, 'el resultado de la maniobra se aplica a la campaña');
await cierraResultado();

console.log(fallos.length ? 'NO APTO · ' + fallos.length + ' fallos:\n' + fallos.join('\n') : 'APTO · sin errores de consola y todo en orden');
await br.close(); srv.close(); process.exit(fallos.length ? 1 : 0);
