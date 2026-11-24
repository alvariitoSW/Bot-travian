// FE3 «Elefantes que no rebotan como una pelota»: tira de 8 fotos seguidas (cada 0,2 s) del elefante en la lucha, de costado.
// Uso: node gobierno/maquetas/falange/captura-fe3.mjs pref=FE3-despues [semilla=9] [extra=fisica=0]  → gobierno/capturas-tarea/<pref>-h.jpg y -v.jpg
// Una carga de página por tamaño; se juega sin dibujar hasta 2 s de lucha y luego se avanza a pasos de 0,2 s con el dibujo.
// Las 8 fotos se juntan en una sola imagen (844 de ancho), con el instante de cada una. Imprime APTO o NO APTO (errores de consola).
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/falange/';
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const dpr = 1, pref = op.pref || 'FE3', SEMILLA = op.semilla || '9', errores = [];
const PREP = `const F = t.F; for (let i = 0; i < 5; i++) F.fila(i, true); F.orden('aguantar');
  const miraA = (cx, cy, cz, tx, ty, tz) => { const dx = tx - cx, dy = ty - cy, dz = tz - cz; t.mira(cx, cy, cz, Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz))); };
  const fr = () => [Math.sin(S.giro), -Math.cos(S.giro)], de = () => [Math.cos(S.giro), Math.sin(S.giro)];
  const anda = s => { for (let x = 0; x < s - 1e-6; x += 0.1) { t.salta(0.1, false); t.rivPaso(0.1); } }, hasta = (c, m = 3000) => { let k = 0; while (!c() && k++ < m) anda(0.1); };`;
/* 2 s después de que un elefante entre en la lucha; cámara de costado, baja (se ve si bota), a la altura del lomo */
const MOMENTO = `let t0 = null; hasta(() => { const e = S.ene.find(e => e.tipo === 'elefante' && e.vivo && e.est === 'lucha'); if (e && t0 === null) t0 = S.T; return t0 !== null && S.T - t0 >= 2; });
  const e = S.ene.filter(e => e.tipo === 'elefante' && e.vivo && e.est === 'lucha').sort((a, b) => Math.abs(b.x - S.xF) - Math.abs(a.x - S.xF))[0], [fx, fz] = fr(), [rx, rz] = de(), lado = e.x > S.xF ? 1 : -1, g = t.H(e.x, e.z);
  miraA(e.x + rx * lado * 10 + fx * 1.5, g + 1.7, e.z + rz * lado * 10 + fz * 1.5, e.x - fx * 1.2, g + 1.5, e.z - fz * 1.2); window.__fe3 = e;`;
const tam = { h: [844, 390], v: [390, 844] }, tiras = {};
for (const [k, [w, h]] of Object.entries(tam)) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { const x = m.text(); if (m.type() === 'error' && !/GPU stall|GL Driver|willReadFrequently/.test(x)) errores.push(k + ': ' + x.slice(0, 300)); });
  page.on('pageerror', e => errores.push(k + ': ' + e.message));
  await page.goto(URL0 + '?rival=elefantes&inicio=0&semilla=' + SEMILLA + (op.extra ? '&' + op.extra : ''));
  await page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000, polling: 500 });
  await page.evaluate(() => window.__tp.parar(true));
  const r = await page.evaluate(`(() => { const t = window.__tp, S = t.S; ${PREP} ${MOMENTO}; return { T: +S.T.toFixed(2), e: window.__fe3.i }; })()`);
  await page.waitForTimeout(2500);
  const fotos = [];
  for (let i = 0; i < 8; i++) {
    if (i) await page.evaluate(() => { const t = window.__tp; t.salta(0.1, false); t.rivPaso(0.1); t.salta(0.1, false); t.rivPaso(0.1); });
    await page.evaluate(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok))));
    fotos.push((await page.screenshot({ type: 'jpeg', quality: 85 })).toString('base64'));
  }
  console.log(k + ': ' + JSON.stringify(r));
  tiras[k] = { w, h, fotos, T: r.T };
  await ctx.close();
}
/* juntar: horizontal en 2 columnas × 4 filas (844 de ancho); vertical en 4 columnas × 2 filas (844 de alto) */
for (const [k, { w, h, fotos, T }] of Object.entries(tiras)) {
  const col = k === 'h' ? 2 : 4, cw = w / 2, ch = h / 2, W = cw * col, Hh = ch * Math.ceil(8 / col);
  const ctx = await br.newContext({ viewport: { width: W, height: Hh }, deviceScaleFactor: 1 }), page = await ctx.newPage();
  await page.setContent(`<body style="margin:0;background:#000;display:grid;grid-template-columns:repeat(${col},${cw}px);font:bold 13px sans-serif">${fotos.map((f, i) => `<div style="position:relative;width:${cw}px;height:${ch}px"><img src="data:image/jpeg;base64,${f}" style="width:100%;height:100%;display:block"><span style="position:absolute;left:4px;top:3px;color:#fff;text-shadow:0 0 3px #000">${i + 1} · +${(i * 0.2).toFixed(1)} s</span></div>`).join('')}</body>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(SALIDA, pref + '-' + k + '.jpg'), type: 'jpeg', quality: 85 });
  await ctx.close();
}
await br.close(); srv.close();
console.log(errores.length ? 'NO APTO\n  ' + errores.join('\n  ') : 'APTO');
process.exit(errores.length ? 1 : 0);
