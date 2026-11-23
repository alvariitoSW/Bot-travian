// FA4 «La escena nueva de la falange»: las varas del diseño (gobierno/estudios/FA4-diseno-escena.md, «Cómo se mide») en UNA
// carga a dpr 1, saltando la partida sin dibujar; luego las fotos del «Guion de fotos», cada una en su carga a dpr 2 con
// ?fase= y semilla fija. Falla si algo no cuadra o hay errores de consola (el 404 de rival.js no cuenta: es el hueco de FA7).
// Uso:  node gobierno/maquetas/falange/captura-fa4.mjs              (todo)
//       node gobierno/maquetas/falange/captura-fa4.mjs solo=h-giro,v-giro   (solo esas fotos, sin medidas)
//       node gobierno/maquetas/falange/captura-fa4.mjs sinfotos         (solo las medidas)
//       node gobierno/maquetas/falange/captura-fa4.mjs solo=picas,v-boton-picas,h-boton-picas   (el botón de las picas: medida y fotos)
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
const dpr = +(op.dpr || 1), prefijo = join(SALIDA, (op.pref || 'FA4') + '-'), errores = [], COSTE = [];
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
function escucha(page) {
  page.on('console', m => { if (/rival\.js/.test((m.location() || {}).url || '')) return; if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
const lista = page => page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });
const V = [390, 844], Hz = [844, 390];
async function abre(q, w, h, d = dpr) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + q); await lista(page); await page.waitForTimeout(1500); return { ctx, page };
}
const cuadro = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const SEMILLA = op.semilla || '20261123', G = 180 / Math.PI;
const solo = op.solo ? op.solo.split(',') : null;
if (!solo) {
const [w, h] = [844, 390], { ctx, page } = await abre('?semilla=' + SEMILLA, w, h);
await page.evaluate(() => window.__tp.parar(true));
/* (a) hecho de la tarea: el bot por el puente gira al aviso y gana; el que no gira pierde por flanco */
const a = await page.evaluate(() => window.__tp.partidaDedos());
console.log('(a) ' + JSON.stringify(a));
bien(a.fin && a.ganador === 'falange', `bot por el puente: gana la falange (${a.ganador}, ${a.causa}, ${a.segundos} s)`);
bien(a.flancosParados >= 1, `al menos un flanco parado girando (${a.flancosParados})`);
const a2 = await page.evaluate(() => { const r = window.__tp.partida('nogira'), S = window.__tp.S; return { ganador: S.ganador, causa: S.causa, T: +S.T.toFixed(1), r }; });
console.log('(a2) ' + JSON.stringify(a2).slice(0, 300));
bien(a2.ganador === 'rival' && a2.causa === 'flanco', `el bot que no gira pierde por flanco (${a2.ganador}, ${a2.causa}, ${a2.T} s)`);
/* (b) girar 5 s por el puente con las cinco filas bajadas */
const b = await page.evaluate(() => {
  const t = window.__tp, S = t.S, G = 180 / Math.PI;
  t.reinicia(); for (let i = 0; i < 5; i++) t.puente.fila(i, true); t.saltaDedos(2);
  t.puente.gira(1); t.saltaDedos(5); t.puente.gira(0); t.saltaDedos(0.6);
  let peor = 0; for (const h of S.fal) if (h.vivo && !h.huye) { const p = S.motor.puesto(h.f, h.r); peor = Math.max(peor, Math.hypot(h.x - p.x, h.z - p.z)); }
  const c = t.cam(), dCam = Math.abs(Math.atan2(Math.sin(c.yaw + S.giro), Math.cos(c.yaw + S.giro))) * G;
  const yo = S.fal[S.yo.i], d = t.dirSarisa(yo.i), fr = [Math.sin(S.giro), 0, -Math.cos(S.giro)], cos = d[0] * fr[0] + d[1] * fr[1] + d[2] * fr[2];
  const cosMin = Math.min(...S.fal.filter(h => h.vivo && h.r === 0).map(h => { const v = t.dirSarisa(h.i); return v[0] * fr[0] + v[1] * fr[1] + v[2] * fr[2]; }));
  return { giro: +(S.giro * G).toFixed(2), peor: +peor.toFixed(3), dCam: +dCam.toFixed(2), cos: +cos.toFixed(4), cosMin: +cosMin.toFixed(4) };
});
console.log('(b) ' + JSON.stringify(b));
bien(Math.abs(b.giro - 40) <= 2, `giro ${b.giro}° (40 ± 2)`);
bien(b.peor < 0.3, `cada hombre a ${b.peor} m de su puesto (< 0,3)`);
bien(b.dCam <= 4, `cámara a ${b.dCam}° de −giro (≤ 4)`);
bien(b.cos > 0.95 && b.cosMin > 0.95, `sarisas de primera fila al frente: tuya ${b.cos}, peor ${b.cosMin} (> 0,95)`);
/* (c) el flanco llega andando: sus hombres se mueven y al menos uno cae dentro de la pantalla con la cámara asomada */
const c = await page.evaluate(() => {
  const t = window.__tp, S = t.S; t.reinicia();
  t.hasta(() => S.flanco && S.flanco.estado === 'viene' && S.T - S.flanco.t0 > 2, 200, 'nogira');
  if (!S.flanco || S.flanco.estado !== 'viene') return { viene: false };
  const L = S.flanco.hombres, p0 = L.map(h => [h.x, h.z]); t.salta(0.5, 'nogira');
  const mov = Math.max(...L.map((h, i) => Math.hypot(h.x - p0[i][0], h.z - p0[i][1])));
  const dentro = L.filter(h => h.vivo).map(h => t.proyecta(h.x, null, h.z)).filter(p => p.delante && p.x > 0 && p.x < 1 && p.y > 0 && p.y < 1).length;
  return { viene: S.flanco.estado === 'viene', n: L.length, mov: +mov.toFixed(2), dentro, asoma: +(t.cam().yaw * 180 / Math.PI + S.giro * 180 / Math.PI).toFixed(1) };
});
console.log('(c) ' + JSON.stringify(c));
bien(c.mov > 0.2, `el flanco anda: ${c.mov} m en 0,5 s (> 0,2)`);
bien(c.dentro >= 1, `del flanco, ${c.dentro} de ${c.n} dentro de la pantalla (≥ 1; cámara asomada ${c.asoma}°)`);
/* (d) el abanico: inclinación media por fila alzada, decreciente (1,5° de holgura: el vaivén; las del tope van todas a 8°); astas sin cruzarse con 0, 3 y 5 bajadas, a 0° y a 40° */
const d = await page.evaluate(() => {
  const t = window.__tp, S = t.S, out = []; t.reinicia(); t.salta(3, false);
  for (const giro of [0, 40]) {
    if (giro) { t.puente.gira(1); t.saltaDedos(5); t.puente.gira(0); t.saltaDedos(0.5); }
    for (const n of [0, 3, 5]) { for (let i = 0; i < 5; i++) t.puente.fila(i, i < n); t.saltaDedos(2.6); out.push({ giro: Math.round(S.giro * 180 / Math.PI), n, incl: t.incl(), astas: t.astasMin() }); }
  }
  return out;
});
for (const x of d) {
  const v = x.incl.filter(a => a !== null), baja = v.every((a, i) => i === 0 || a <= v[i - 1] + 1.5);
  console.log(`(d) giro ${x.giro}°, ${x.n} bajadas: ${JSON.stringify(x.incl)} · astas ${x.astas.min} (${x.astas.par})`);
  bien(baja && Math.abs(v[0] - 34) < 3, `abanico decreciente con ${x.n} bajadas a ${x.giro}° (primera alzada ${v[0]}°, última ${v[v.length - 1]}°)`);
  bien(x.astas.min >= 0.062, `astas sin cruzarse con ${x.n} bajadas a ${x.giro}°: ${x.astas.min} m (≥ 0,062)`);
}
/* (e) un caído no se mueve en 10 s; (f) la punta de tu asta avanza ≥ 0,6 m a los 0,12 s de la estocada */
const e = await page.evaluate(() => {
  const t = window.__tp, S = t.S; t.reinicia(); t.hasta(() => S.ene.some(h => !h.vivo) && S.fal.some(h => !h.vivo), 200);
  const iE = S.ene.findIndex(h => !h.vivo), iF = S.fal.findIndex(h => !h.vivo), e0 = t.posDibujo('r', iE), f0 = t.posDibujo('f', iF), n0 = [S.ene.length, S.fal.length];
  t.salta(10); const e1 = t.posDibujo('r', iE), f1 = t.posDibujo('f', iF);
  return { T: +S.T.toFixed(1), iE, iF, mueveE: +Math.hypot(e1[0] - e0[0], e1[1] - e0[1]).toFixed(3), mueveF: +Math.hypot(f1[0] - f0[0], f1[1] - f0[1]).toFixed(3), siguen: S.ene[iE] && !S.ene[iE].vivo && S.fal[iF] && !S.fal[iF].vivo && S.ene.length >= n0[0] && S.fal.length >= n0[1] };
});
console.log('(e) ' + JSON.stringify(e));
bien(e.iE >= 0 && e.iF >= 0 && e.mueveE < 0.01 && e.mueveF < 0.01 && e.siguen, `caídos quietos 10 s: rival ${e.mueveE} m, falangita ${e.mueveF} m, siguen en su sitio: ${e.siguen}`);
const f = await page.evaluate(() => {
  const t = window.__tp, S = t.S; t.reinicia(); t.salta(3, false);
  const fr = [Math.sin(S.giro), -Math.cos(S.giro)], p0 = t.punta(), r = t.F.estocada(); t.saltaDedos(0.12); const p1 = t.punta();
  const av = ((p1.x - p1.yx) - (p0.x - p0.yx)) * fr[0] + ((p1.z - p1.yz) - (p0.z - p0.yz)) * fr[1];
  return { r, dt: +(S.T - S.yo.tEstocada).toFixed(3), avance: +av.toFixed(3) };
});
console.log('(f) ' + JSON.stringify(f));
bien(f.avance >= 0.6, `tu estocada: la punta avanza ${f.avance} m a los ${f.dt} s (≥ 0,6)`);
/* (g) peso en el choque: llamadas de dibujo y triángulos */
await page.evaluate(() => { const t = window.__tp, S = t.S; t.reinicia(); t.hasta(() => S.choque, 200); t.salta(1); t.parar(true); });
await cuadro(page); await cuadro(page);
const g = await page.evaluate(() => window.__tp.info());
console.log('(g) ' + JSON.stringify(g));
bien(g.llamadas <= 30, `llamadas de dibujo en el choque: ${g.llamadas} (≤ 30)`);
bien(g.triangulos <= 750000, `triángulos en el choque: ${g.triangulos} (≤ 750 000)`);
bien(!errores.some(e => !e.startsWith('PRUEBA')), 'sin errores de consola en la carga de medidas');
await ctx.close();
}
/* el botón «Bajar picas»: con toque emulado a 390×844, baja y alza las cinco filas sin contar como toque de compás */
async function tocaEn(page, sel) {
  const cdp = await page.context().newCDPSession(page), b = await page.evaluate(q => { const r = document.querySelector(q).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
  const ts = Date.now() / 1000; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x, y: b.y, id: 1 }], timestamp: ts });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [], timestamp: ts + 0.06 }); await cdp.detach();
}
const leePicas = page => page.evaluate(() => { const S = window.__tp.S, b = document.getElementById('picas').getBoundingClientRect(), rr = [...document.querySelectorAll('.raya')].map(r => r.getBoundingClientRect());
  return { filas: S.filas.map(Number).join(''), texto: document.getElementById('picas').textContent.trim(), toques: S.toques.buenos + S.toques.malos, andando: !!S.andando, b: { w: Math.round(b.width), h: Math.round(b.height), t: Math.round(b.top), l: Math.round(b.left) }, raya: { w: Math.round(Math.min(...rr.map(r => r.width))), h: Math.round(Math.min(...rr.map(r => r.height))) } }; });
const esperaTexto = (page, t) => page.waitForFunction(x => document.getElementById('picas').textContent.trim() === x, t, { timeout: 120000 }).catch(() => {});
if (!solo || solo.includes('picas')) {
  const [w, h] = V, { ctx, page } = await abre('?semilla=' + SEMILLA, w, h, 1);
  await page.evaluate(() => window.__tp.parar(true));
  const p0 = await leePicas(page); console.log('(p0) ' + JSON.stringify(p0));
  bien(p0.filas === '00000' && p0.texto === 'Bajar picas', `al empezar: filas ${p0.filas} y el botón dice «${p0.texto}»`);
  bien(p0.b.h >= 44 && p0.b.w >= 44 && p0.b.l >= 0 && p0.b.t >= 0, `botón de ${p0.b.w}×${p0.b.h} px dentro de pantalla (≥ 44)`);
  bien(p0.raya.h >= 44 && p0.raya.w >= 120, `cada raya en vertical: ${p0.raya.w}×${p0.raya.h} px (≥ 120×44)`);
  await tocaEn(page, '#picas'); await esperaTexto(page, 'Alzar picas');
  const p1 = await leePicas(page); console.log('(p1) ' + JSON.stringify(p1));
  bien(p1.filas === '11111' && p1.texto === 'Alzar picas', `tocar el botón: filas ${p1.filas} y dice «${p1.texto}»`);
  bien(p1.toques === p0.toques && !p1.andando, `el toque del botón no es de compás: toques ${p0.toques} → ${p1.toques}, andando ${p1.andando}`);
  await tocaEn(page, '#picas'); await esperaTexto(page, 'Bajar picas');
  const p2 = await leePicas(page); console.log('(p2) ' + JSON.stringify(p2));
  bien(p2.filas === '00000' && p2.texto === 'Bajar picas' && p2.toques === p0.toques, `tocar otra vez: filas ${p2.filas}, dice «${p2.texto}», toques ${p2.toques}`);
  bien(!errores.some(e => !e.startsWith('PRUEBA')), 'sin errores de consola en la carga del botón de las picas');
  await ctx.close();
}
/* sus dos fotos: en vertical tras tocar «Bajar picas» y dejar que bajen; en horizontal antes de tocar */
for (const [nombre, [fw, fh], tocar] of [['v-boton-picas', V, true], ['h-boton-picas', Hz, false]]) {
  if ((solo && !solo.includes(nombre)) || args.includes('sinfotos')) continue;
  const t0 = Date.now();
  try {
    const { ctx, page } = await abre('?fase=marcha&semilla=' + SEMILLA, fw, fh, 2);
    if (tocar) { await tocaEn(page, '#picas'); await esperaTexto(page, 'Alzar picas'); await page.evaluate(() => window.__tp.saltaDedos(2.6)); }
    await cuadro(page); await cuadro(page);
    await page.screenshot({ path: prefijo + nombre + '.jpg', type: 'jpeg', quality: 80, timeout: 300000 });
    console.log(`  foto ${nombre}: ${JSON.stringify(await leePicas(page))} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); await ctx.close();
  } catch (e) { errores.push('foto ' + nombre + ': ' + e.message.slice(0, 200)); console.log('  MAL foto ' + nombre + ': ' + e.message.slice(0, 200)); }
}
/* las fotos: cada una en su carga, a dpr 2, con semilla fija */
const FOTOS = {
  'h-marcha': ['marcha', Hz], 'h-filas': ['filas&n=3', Hz], 'h-flanco-viene': ['flanco-viene', Hz], 'h-giro': ['girofl', Hz], 'h-alto-giro': ['girofl&alto=1', Hz],
  'h-estocada': ['estocada', Hz], 'h-caidos': ['caidos', Hz], 'v-choque': ['choque', V], 'v-giro': ['girofl', V],
  /* el enchufe de FA7: con rival.js, al rival lo pinta su módulo */
  'h-rival-elefantes': ['choque&rival=elefantes', Hz], 'h-rival-caballeria': ['choque&rival=caballeria', Hz],
  /* nota del usuario (23/11): al girar, los elefantes no giran contigo */
  'h-alto-elefantes-giro': ['giro&rival=elefantes&alto=1', Hz],
};
if (!args.includes('sinfotos')) for (const [nombre, [fase, [fw, fh]]] of Object.entries(FOTOS)) {
  if (solo && !solo.includes(nombre)) continue;
  const n0 = errores.length, t0 = Date.now();
  try {
    const { ctx, page } = await abre('?fase=' + fase + '&semilla=' + SEMILLA, fw, fh, 2);
    await cuadro(page); await cuadro(page);
    await page.screenshot({ path: prefijo + nombre + '.jpg', type: 'jpeg', quality: 80, timeout: 300000 });
    const est = await page.evaluate(() => { const S = window.__tp.S; return { T: +S.T.toFixed(1), giro: +(S.giro * 180 / Math.PI).toFixed(1), flanco: S.flanco && S.flanco.estado, filas: S.filas.map(Number).join('') }; });
    console.log(`  foto ${nombre}: ${JSON.stringify(est)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); await ctx.close();
  } catch (e) { errores.push('foto ' + nombre + ': ' + e.message.slice(0, 200)); console.log('  MAL foto ' + nombre + ': ' + e.message.slice(0, 200)); }
  if (errores.length > n0) console.log('  (errores en ' + nombre + ')');
}
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO: ' + errores.length + ' fallos' : 'APTO');
process.exit(errores.length ? 1 : 0);
