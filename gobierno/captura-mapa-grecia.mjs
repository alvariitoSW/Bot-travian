/* AQVILA · AM2 — capturas y medidas del MAPA VIVO DE GRECIA (js/gfx/mapa-grecia*.js), en la página suelta gobierno/maquetas/mapa-vivo/.
   Uso: node gobierno/captura-mapa-grecia.mjs <prefijo> [modo=completo|juez] [dir=gobierno/capturas-tarea] [dpr=2]
   completo: vertical (390×844) y horizontal (844×390) × estilo a/b × lejos/comarca/polis; en vertical además «recursos» y «puerto».
             Mide fluidez (cuadros reales en 4 s, a dpr 1 y 2), gestos con dedos de verdad (CDP) y la pantalla (botones, rótulos).
   juez:     rápido (<60 s): vertical, dpr 1, <prefijo>-vivo-a.jpg (corazón) y -vivo-b.jpg (comarca), pantalla y gestos de pellizco y arrastre.
   Escribe <dir>/<prefijo>-medidas.json. Sale con 1 si hay algún FALLA o error de consola.
   AVISO: el render es por SOFTWARE (sin GPU). Las cifras de fluidez sirven para comparar alturas entre sí, no como cifra del móvil. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [pref = 'mapa-grecia', ...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => a.split('='))), modo = op.modo || 'completo', JUEZ = modo === 'juez';
const DPR = JUEZ ? 1 : +(op.dpr || 2), DIR = op.dir || 'gobierno/capturas-tarea';
const ALTURAS = { lejos: 'entera', comarca: { lon: 22.78, lat: 37.6, a: 3.2 }, polis: { lon: 22.72, lat: 37.63, a: 0.2 } };
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end('no'); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/mapa-vivo/index.html';
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errores = [], M = { modo, dpr: DPR, capturas: [], fluidez: [], gestos: {}, pantalla: {}, aviso: 'render por software (sin GPU): vale para comparar alturas, no como cifra del móvil' };
let fallos = 0;
const linea = (tipo, nombre, bien, dato) => { console.log(`${tipo} ${nombre}: ${bien ? 'ok' : 'FALLA'} (${dato})`); if (!bien) fallos++; return { bien, dato }; };
await mkdir(join(RAIZ, DIR), { recursive: true });

async function nueva(w, h, dpr) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, serviceWorkers: 'block' }), page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 300)));
  return { ctx, page };
}
async function abrir(page, q) {
  await page.goto(BASE + '?' + q, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__mapa && window.__mapa.listo, null, { timeout: 120000 });
}
const vista = (page, v) => page.evaluate(v => window.__mapa.vista(v), v);
async function captura(page, nombre, extra) {
  await page.waitForTimeout(2500);
  const f = join(RAIZ, DIR, nombre);
  for (let i = 0; ; i++) { try { await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } }
  const i = await page.evaluate(() => { const m = __mapa.info(); return { tri: m.triangulos, llamadas: m.llamadas, ancho: m.ancho, arranqueMs: m.arranqueMs }; });
  console.log(`${nombre} · ${i.tri} triángulos · ${i.llamadas} llamadas · ancho ${i.ancho}`);
  M.capturas.push(Object.assign({ archivo: nombre }, i, extra || {})); return i;
}

/* ---------- gestos con dedos de verdad ---------- */
async function dedos(page) {
  const cdp = await page.context().newCDPSession(page);
  const tp = (...p) => p.map(([x, y], id) => ({ x, y, id }));
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const estado = () => page.evaluate(() => ({ x: __mapa.V.x, z: __mapa.V.z, upx: __mapa.V.upx }));
  return { cdp, T, tp, estado,
    async pellizco(cx, cy, d0, d1, pasos, reg) {   // dos dedos en horizontal, simétricos respecto a (cx, cy)
      const par = d => tp([cx - d / 2, cy], [cx + d / 2, cy]); await T('touchStart', par(d0)); await page.waitForTimeout(40);
      for (let k = 1; k <= pasos; k++) { const d = d0 + (d1 - d0) * k / pasos; const antes = reg ? (await estado()).upx : 0; await T('touchMove', par(d)); await page.waitForTimeout(70);
        if (reg) { let u = (await estado()).upx; for (let i = 0; i < 20 && u === antes; i++) { await page.waitForTimeout(50); u = (await estado()).upx; } reg.push(u); } }   // el navegador reparte los toques al ritmo de los cuadros: se espera a que el paso llegue
      await page.waitForTimeout(100); await T('touchEnd', []); await page.waitForTimeout(150);
    },
    async arrastre(x0, y, dx, pasos) {
      await T('touchStart', tp([x0, y])); await page.waitForTimeout(40);
      for (let k = 1; k <= pasos; k++) { await T('touchMove', tp([x0 + dx * k / pasos, y])); await page.waitForTimeout(40); }
      await page.waitForTimeout(150); await T('touchEnd', []); await page.waitForTimeout(300);
    },
    async toque(x, y) { await T('touchStart', tp([x, y])); await page.waitForTimeout(30); await T('touchEnd', []); }
  };
}
async function gestos(page, completo) {
  const d = await dedos(page), G = M.gestos;
  // (a) pellizco para acercar: zoom continuo y punto bajo el centro quieto
  await vista(page, 'corazon'); await page.waitForTimeout(1500);
  const dims = await page.evaluate(() => ({ w: __mapa.host.clientWidth, h: __mapa.host.clientHeight }));
  const proy = () => page.evaluate(async ([P]) => { const { THREE } = await import('/js/gfx/models.js'), m = __mapa, v = new THREE.Vector3(P[0], 0, P[1]).project(m.cam); return [(v.x * .5 + .5) * m.host.clientWidth, (-v.y * .5 + .5) * m.host.clientHeight]; }, [null]).catch(() => null);
  const P = await page.evaluate(([cx, cy]) => { const m = __mapa, V = m.V, w = m.host.clientWidth, h = m.host.clientHeight; return [V.x + (cx - w / 2) * V.upx, V.z + (cy - h / 2) * V.upx / Math.sin(m._el)]; }, [195, 500]);
  const pantallaDe = P => page.evaluate(async P => { const { THREE } = await import('/js/gfx/models.js'), m = __mapa; m.cam.updateMatrixWorld(); const v = new THREE.Vector3(P[0], 0, P[1]).project(m.cam); return [(v.x * .5 + .5) * m.host.clientWidth, (-v.y * .5 + .5) * m.host.clientHeight]; }, P);
  const antes = await pantallaDe(P), reg = [], u0 = (await d.estado()).upx;
  await d.pellizco(195, 500, 80, 80 * 1.12 ** 12, 12, reg); await page.waitForTimeout(400);
  const des = await pantallaDe(P), mov = Math.hypot(des[0] - antes[0], des[1] - antes[1]); const sec = [u0, ...reg];
  let bajaSiempre = true, saltoMax = 1; for (let k = 1; k < sec.length; k++) { if (!(sec[k] < sec[k - 1])) bajaSiempre = false; saltoMax = Math.max(saltoMax, sec[k - 1] / sec[k]); }
  console.log("   upx por paso (ancho): " + sec.map(u => (u * 390).toFixed(2)).join(" ")); G.pellizco = linea('gesto', 'pellizco acercar', bajaSiempre && saltoMax <= 1.6 && mov <= 25, `upx ${(u0 * 390).toFixed(2)}→${(sec[sec.length - 1] * 390).toFixed(2)} (ancho), salto máx ×${saltoMax.toFixed(2)}, ${bajaSiempre ? 'baja en cada paso' : 'NO baja en cada paso'}, el punto bajo los dedos se movió ${mov.toFixed(1)} px`);
  // (b) arrastre de 120 px a la derecha
  await vista(page, 'corazon'); await page.waitForTimeout(1200);
  const e0 = await d.estado(); await d.arrastre(120, 500, 120, 12); const e1 = await d.estado(), dx = e0.x - e1.x, esp = 120 * e0.upx;
  G.arrastre = linea('gesto', 'arrastre 120 px', Math.abs(dx - esp) <= esp * 0.2, `V.x bajó ${dx.toFixed(4)}, esperado ${esp.toFixed(4)} (±20 %)`);
  if (!completo) return;
  // (c) doble toque
  await vista(page, 'corazon'); await page.waitForTimeout(1200);
  let f0, f1;   // el navegador reparte los toques al ritmo de los cuadros (a software, 1-3 por segundo, un toque tarda ~1 s en llegar y la ventana del doble toque es de 320 ms): se para el bucle de dibujo mientras se dan los dos toques; hasta 3 intentos
  for (let k = 0; k < 3; k++) { await vista(page, 'corazon'); await page.waitForTimeout(1200); await page.waitForTimeout(500); f0 = (await d.estado()).upx; await page.evaluate(() => __mapa.pausa(true)); await d.toque(195, 500); await page.waitForTimeout(60); await d.toque(195, 500); await page.waitForTimeout(100); await page.evaluate(() => __mapa.pausa(false)); await page.waitForTimeout(2500); f1 = (await d.estado()).upx; if (f1 < f0 * 0.6) break; }
  G.dobleToque = linea('gesto', 'doble toque', f1 < f0 * 0.6, `upx ×${(f1 / f0).toFixed(2)} en 600 ms (debe ser < 0,6)`);
  // (d) topes
  const UPX_MIN = 0.12 / 390; await vista(page, 'corazon'); await page.waitForTimeout(800);
  let minVisto = 1e9; for (let k = 0; k < 8; k++) { await d.pellizco(195, 500, 60, 300, 5); minVisto = Math.min(minVisto, (await d.estado()).upx); }
  const dentro = (await d.estado()).upx;
  G.topeCerca = linea('gesto', 'tope al acercar', minVisto >= UPX_MIN * 0.999 && dentro <= UPX_MIN * 1.05, `upx mínimo ${(minVisto * 390).toFixed(3)} (ancho) ≥ ${(UPX_MIN * 390).toFixed(3)}, queda en ${(dentro * 390).toFixed(3)}`);
  let maxVisto = 0; for (let k = 0; k < 10; k++) { await d.pellizco(195, 500, 300, 60, 5); maxVisto = Math.max(maxVisto, (await d.estado()).upx); }
  const fin = (await d.estado()).upx, tope = await page.evaluate(() => __mapa._upxMax);   // el tope de alejar depende de la altura de la cámara: se lee al final
  G.topeLejos = linea('gesto', 'tope al alejar', maxVisto <= tope * 1.001 && fin >= tope * 0.95, `upx máx ${maxVisto.toFixed(5)} ≤ _upxMax ${tope.toFixed(5)}, queda en ${fin.toFixed(5)}`);
}

/* ---------- pantalla: botones y rótulos ---------- */
const solapa = (a, b, t) => a.left < b.right - t && a.right > b.left + t && a.top < b.bottom - t && a.bottom > b.top + t;
async function pantalla(page, ori, completo) {
  const W = ori === 'v' ? 390 : 844, H = ori === 'v' ? 844 : 390, R = (M.pantalla[ori] = {});
  await page.evaluate(() => { __mapa.recursos(false); document.querySelector('[data-a="recursos"]').setAttribute('aria-pressed', 'false'); });
  const botones = await page.evaluate(() => [...document.querySelectorAll('.mgp button')].filter(b => b.getClientRects().length).map(b => { const r = b.getBoundingClientRect(); return { n: (b.dataset.a || b.dataset.v || b.dataset.ir || b.className || b.textContent).slice(0, 20), left: r.left, top: r.top, right: r.right, bottom: r.bottom, w: r.width, h: r.height }; }));
  const chicos = botones.filter(b => b.w < 43.5 || b.h < 43.5), fuera = botones.filter(b => b.left < -0.5 || b.top < -0.5 || b.right > W + 0.5 || b.bottom > H + 0.5);
  R.botones = linea('pantalla', `botones ${ori}`, botones.length > 0 && !chicos.length && !fuera.length, `${botones.length} botones` + (chicos.length ? '; menores de 44: ' + chicos.map(b => `${b.n} ${b.w.toFixed(0)}×${b.h.toFixed(0)}`).join(', ') : '') + (fuera.length ? '; fuera: ' + fuera.map(b => b.n).join(', ') : ''));
  const tapados = [], vistas = completo ? ['corazon', 'entera', 'comarca'] : ['corazon'];
  for (const v of vistas) for (const rec of [false, true]) {
    if (rec && v === 'comarca') continue;
    await page.evaluate(([v, rec]) => { __mapa.recursos(rec); __mapa.vista(v); }, [v, rec]); await page.waitForTimeout(1200);
    const r = await page.evaluate(() => { const bs = [...document.querySelectorAll('.mgp button')].filter(b => b.getClientRects().length).map(b => { const q = b.getBoundingClientRect(); return { n: b.dataset.a || b.dataset.v || b.dataset.ir || 'btn', left: q.left, top: q.top, right: q.right, bottom: q.bottom }; });
      const es = __mapa.etq.filter(e => e.visto).map(e => { const q = e.d.getBoundingClientRect(); return { n: (e.polis && e.polis.n) || (e.zona && e.zona.n) || (e.lugar && e.lugar.n) || '?', k: e.polis ? 'polis' : e.zona ? 'zona' : 'lugar', left: q.left, top: q.top, right: q.right, bottom: q.bottom }; });
      return { bs, es, polisVistas: es.filter(e => e.k === 'polis').length, zonasVistas: es.filter(e => e.k === 'zona').length, polisTotal: __mapa.etq.filter(e => e.polis).length }; });
    for (const e of r.es) { for (const b of r.bs) if (solapa(e, b, 2)) tapados.push(`${v}${rec ? '+rec' : ''}: «${e.n}» bajo botón ${b.n}`); }
    for (let i = 0; i < r.es.length; i++) for (let j = i + 1; j < r.es.length; j++) if (solapa(r.es[i], r.es[j], 2)) tapados.push(`${v}${rec ? '+rec' : ''}: «${r.es[i].n}» con «${r.es[j].n}»`);
    if (v === 'corazon' && !rec) { R.polisExisten = linea('pantalla', `8 rótulos de polis ${ori}`, r.polisTotal === 8, `${r.polisTotal} existen`); if (ori === 'v') R.polisVistas = linea('pantalla', 'polis visibles en «corazón» vertical', r.polisVistas >= 6, `${r.polisVistas} de 8 (≥ 6)`); }
    if (v === 'corazon' && rec) { if (ori === 'v') R.zonasv = linea('pantalla', 'rótulos de zona con Recursos (v)', r.zonasVistas >= 8, `${r.zonasVistas} visibles (≥ 8)`); else { R.zonash = { dato: r.zonasVistas }; console.log(`pantalla rótulos de zona con Recursos (h): info (${r.zonasVistas} visibles en «corazón» horizontal; no se exige)`); } }
  }
  R.solapes = linea('pantalla', `rótulos tapados ${ori}`, tapados.length === 0, tapados.length ? tapados.slice(0, 6).join('; ') + (tapados.length > 6 ? ` … (${tapados.length})` : '') : 'ninguno');
  await page.evaluate(() => __mapa.recursos(false));
  if (ori === 'v') {   // cambiar de estilo conserva la vista
    await page.evaluate(() => __mapa.vista('corazon')); await page.waitForTimeout(600);
    const a = await page.evaluate(() => ({ x: __mapa.V.x, z: __mapa.V.z, upx: __mapa.V.upx }));
    await page.click('[data-a="estilo"]'); await page.waitForFunction(() => !document.querySelector('[data-a="estilo"]').disabled, null, { timeout: 60000 }); await page.waitForTimeout(800);
    const b = await page.evaluate(() => ({ x: __mapa.V.x, z: __mapa.V.z, upx: __mapa.V.upx, e: __mapa.est }));
    R.estilo = linea('pantalla', 'cambiar de estilo conserva la vista', Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.z - b.z) < 1e-6 && Math.abs(a.upx - b.upx) < 1e-9, `V antes ${a.x.toFixed(3)},${a.z.toFixed(3)},${(a.upx * 390).toFixed(2)} · después ${b.x.toFixed(3)},${b.z.toFixed(3)},${(b.upx * 390).toFixed(2)} (estilo ${b.e})`);
    await page.click('[data-a="estilo"]'); await page.waitForFunction(() => !document.querySelector('[data-a="estilo"]').disabled, null, { timeout: 60000 });
  }
}

/* ---------- ejecución ---------- */
if (op.solo === 'gestos') {   // para depurar: solo gestos y pantalla vertical
  const { page } = await nueva(390, 844, 1); await abrir(page, 'estilo=a&vista=corazon&fija=1'); await gestos(page, true);
} else if (JUEZ) {
  const { page } = await nueva(390, 844, 1);
  await abrir(page, 'estilo=a&vista=corazon&fija=1&t=20'); M.arranqueMs = await page.evaluate(() => __mapa.arranqueMs); console.log('arranque del mapa: ' + M.arranqueMs + ' ms');
  await captura(page, `${pref}-vivo-a.jpg`);
  await page.evaluate(async () => { await __mapa.estilo('b'); __mapa.vista({ lon: 22.78, lat: 37.6, a: 3.2 }); });
  await captura(page, `${pref}-vivo-b.jpg`);
  await page.evaluate(async () => { await __mapa.estilo('a'); });
  await pantalla(page, 'v', false); await gestos(page, false);
} else {
  for (const ori of ['v', 'h']) {
    const [w, h] = ori === 'v' ? [390, 844] : [844, 390], { page } = await nueva(w, h, DPR);
    for (const est of ['a', 'b']) {
      await abrir(page, `estilo=${est}&vista=corazon&fija=1&t=20&dpr=${DPR}`); if (!M.arranqueMs) { M.arranqueMs = await page.evaluate(() => __mapa.arranqueMs); console.log('arranque del mapa: ' + M.arranqueMs + ' ms'); }
      for (const alt in ALTURAS) { await vista(page, ALTURAS[alt]); await captura(page, `${pref}-${est}-${alt}-${ori}.jpg`); }
      if (ori === 'v') {
        await vista(page, 'corazon'); await page.click('[data-a="recursos"]'); await page.waitForTimeout(1500);
        let tocada = true; try { await page.click('.mg-polis[data-polis="atenas"]', { timeout: 8000 }); } catch (e) { tocada = false; }
        const fichaAbierta = await page.evaluate(() => !document.querySelector('.mgp-ficha').hidden);
        linea('pantalla', `tocar el rótulo de Atenas abre su ficha (${est})`, tocada && fichaAbierta, tocada ? (fichaAbierta ? 'ficha abierta' : 'se tocó pero la ficha no se abre') : 'rótulo no tocable: ' + await page.evaluate(() => { const e = __mapa.etq.find(q => q.polis && q.polis.id === 'atenas'), r = e.d.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return `visto=${e.visto} caja ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}; encima: ${t ? t.className || t.tagName : '-'}`; }));
        await captura(page, `${pref}-${est}-recursos-v.jpg`);
        await page.click('[data-a="recursos"]'); await page.evaluate(() => __pantalla.ficha(null));
        await vista(page, { lon: 23.63, lat: 37.945, a: 0.25 }); await captura(page, `${pref}-${est}-puerto-v.jpg`);
      }
    }
    // pantalla y gestos en página limpia (sin t fijo no hace falta; estilo a, dpr 1)
    await page.close();
    const q = await nueva(w, h, 1); await abrir(q.page, 'estilo=a&vista=corazon&fija=1'); await pantalla(q.page, ori, true); if (ori === 'v') await gestos(q.page, true); await q.ctx.close();
  }
  // fluidez: vertical, sin t fijo, cuadros reales durante 4 s
  console.log('FLUIDEZ — render por SOFTWARE (sin GPU): vale para comparar alturas entre sí, no como cifra del móvil.');
  for (const dpr of [1, 2]) for (const est of ['a', 'b']) {
    const { page, ctx } = await nueva(390, 844, dpr); await abrir(page, `estilo=${est}&vista=corazon&fija=1&dpr=${dpr}`);
    for (const alt in ALTURAS) {
      await vista(page, ALTURAS[alt]); await page.waitForTimeout(1500);
      const r = await page.evaluate(() => new Promise(ok => { let n = 0, max = 0, ult = performance.now(); const t0 = ult; const f = t => { n++; max = Math.max(max, t - ult); ult = t; if (t - t0 < 4000) requestAnimationFrame(f); else ok({ n, max, s: (t - t0) / 1000, i: __mapa.info() }); }; requestAnimationFrame(t => { ult = t; requestAnimationFrame(f); }); }));
      const fps = r.n / r.s; M.fluidez.push({ estilo: est, altura: alt, dpr, fps: +fps.toFixed(1), peorMs: Math.round(r.max), triangulos: r.i.triangulos, llamadas: r.i.llamadas, msPorCuadro: r.i.msPorCuadro });
      console.log(`fluidez ${est} ${alt} (dpr ${dpr}): ${fps.toFixed(1)} fps (peor cuadro ${Math.round(r.max)} ms) · ${r.i.triangulos} triángulos · ${r.i.llamadas} llamadas`);
    }
    await ctx.close();
  }
}

M.errores = [...new Set(errores)]; M.fallos = fallos;
await writeFile(join(RAIZ, DIR, `${pref}-medidas.json`), JSON.stringify(M, null, 1));
if (errores.length) { console.log('ERRORES DE CONSOLA:\n' + M.errores.join('\n')); } else console.log('Sin errores de consola.');
await br.close(); srv.close();
process.exit(fallos || errores.length ? 1 : 0);
