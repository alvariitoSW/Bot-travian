// FE2 «La falange y los elefantes con los soldados nuevos»: fotos y medidas de la escena de la falange con elefantes.
// Uso: node gobierno/maquetas/falange/captura-fe2.mjs [solo=carga-h,...] [dpr=2] [pref=FE2]
// Cada foto: una carga de página (?rival=elefantes, semilla fija), se juega sin dibujar hasta el momento y se congela.
// Mide llamadas de dibujo, triángulos, el paso de la física y los errores de consola. Imprime APTO o NO APTO.
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
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), pref = op.pref || 'FE2', errores = [], filas = [];
const TOPE = { llamadas: 30, triangulos: 750000, fisicaMs: 1 };
function escucha(page, nombre) {
  page.on('console', m => { const t = m.text(); if (/\[FE2\]/.test(t)) console.log('  ' + t.slice(0, 300)); if (m.type() === 'error' && !/GPU stall|GL Driver|willReadFrequently/.test(t)) { errores.push(nombre + ': ' + t.slice(0, 300)); console.log('  [error] ' + t.slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(nombre + ': ' + e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
/* nombre, [ancho, alto], consulta, momento (texto de una función que corre en la página con t = window.__tp) */
const V = [390, 844], Hz = [844, 390];
const MOMENTOS = {
  /* la carga: el elefante a la carrera, a unos 12 m de las puntas */
  carga: `t.hasta(() => S.riv && S.riv.fase === 'carga' && S.ene.some(e => e.tipo === 'elefante' && e.est === 'carga' && e.d < 14), 200, 'compas'); t.salta(0.1)`,
  /* el golpe: las picas se parten contra el elefante y el primero suelta el asta */
  rotas: `t.hasta(() => S.fal.some(h => h.picaRota && S.T - h.picaRota.t > 0.5), 200, 'compas'); t.salta(0.25)`,
  /* la espada: un hombre con la pica rota ya con la espada en la mano */
  espada: `t.hasta(() => S.fal.some(h => h.picaRota && S.T - h.picaRota.t > 1.6), 200, 'compas'); t.salta(0.2)`,
  /* el elefante ensartado, cayendo (o caído) delante del muro */
  ensartado: `t.hasta(() => S.ene.some(e => e.tipo === 'elefante' && !e.vivo && !e.fuera), 400, 'compas'); t.salta(1.4)`,
  /* la falange con los soldados nuevos, de cerca, sarisas bajadas, antes del choque */
  falange: `t.salta(5); for (let i = 0; i < 5; i++) t.acc.fila(i, true); t.salta(2.5, false)`,
  /* de costado y de cerca (para revisar el soldado): ?mira=dx,dy,dz respecto a tu oficial */
  lado: `t.salta(5); for (let i = 0; i < 5; i++) t.acc.fila(i, true); t.salta(2.5, false); const yo = S.fal[S.yo.i]; t.mira(yo.x + 6, 1.6, yo.z + 1.5, Math.PI / 2 - 0.15, -0.05)`,
};
const FOTOS = [
  ['carga-h', Hz, 'rival=elefantes', 'carga'], ['carga-v', V, 'rival=elefantes', 'carga'],
  ['rotas-h', Hz, 'rival=elefantes', 'rotas'], ['rotas-v', V, 'rival=elefantes', 'rotas'],
  ['espada-h', Hz, 'rival=elefantes', 'espada'], ['espada-v', V, 'rival=elefantes', 'espada'],
  ['ensartado-h', Hz, 'rival=elefantes', 'ensartado'], ['ensartado-v', V, 'rival=elefantes', 'ensartado'],
  ['falange-h', Hz, 'rival=elefantes', 'falange'], ['falange-v', V, 'rival=elefantes', 'falange'], ['lado-h', Hz, 'rival=elefantes', 'lado'],
];
const solo = op.solo ? op.solo.split(',') : null, SEMILLA = op.semilla || '20261124';
for (const [nombre, [w, h], q, mom] of FOTOS) {
  if (solo && !solo.includes(nombre)) continue;
  const t0 = Date.now(), ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page, nombre);
  try {
    await page.goto(URL0 + '?' + q + '&semilla=' + SEMILLA + (op.extra ? '&' + op.extra : ''));
    await page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000, polling: 500 });
    await page.evaluate(() => window.__tp.parar(true));
    const r = await page.evaluate(`(() => { const t = window.__tp, S = t.S; ${MOMENTOS[mom]}; return { T: +S.T.toFixed(2), fase: S.fase, riv: S.riv && S.riv.fase, rotas: S.fal.filter(h => h.picaRota).length, espadas: S.fal.filter(h => h.picaRota && S.T - h.picaRota.t > 1.2).length, ele: S.ene.filter(e => e.tipo === 'elefante').map(e => e.est + (e.vivo ? '' : '†')).join(',') }; })()`);
    await page.waitForTimeout(2500);
    const m = await page.evaluate(() => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(() => ok({ ...window.__tp.info(), fisica: window.__tp.fisica ? window.__tp.fisica().ms : 0, soldados: window.__tp.soldados ? window.__tp.soldados() : null })))));
    await page.screenshot({ path: join(SALIDA, pref + '-' + nombre + '.jpg'), type: 'jpeg', quality: 82 });
    const fila = { nombre, ...r, ...m, seg: Math.round((Date.now() - t0) / 1000) }; filas.push(fila);
    console.log(JSON.stringify(fila));
  } catch (e) { errores.push(nombre + ': guion: ' + String(e.message || e).split('\n')[0]); console.log('  MAL ' + nombre + ': ' + e.message.split('\n')[0]); }
  await ctx.close();
}
await br.close(); srv.close();
const mal = [...errores];
for (const f of filas) { if (f.llamadas > TOPE.llamadas) mal.push(f.nombre + ': llamadas ' + f.llamadas); if (f.triangulos > TOPE.triangulos) mal.push(f.nombre + ': triángulos ' + f.triangulos); if (f.fisica > TOPE.fisicaMs) mal.push(f.nombre + ': física ' + f.fisica + ' ms'); }
console.log(mal.length ? 'NO APTO\n  ' + mal.join('\n  ') : 'APTO');
process.exit(mal.length ? 1 : 0);
