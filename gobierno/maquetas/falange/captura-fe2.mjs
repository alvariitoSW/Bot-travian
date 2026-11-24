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
/* antes de cada momento: las cinco filas bajadas y «Aguantar» (como captura-fe1.mjs); la partida salta sin dibujar y el dibujo del
   rival avanza con ella (__tp.rivPaso) */
const PREP = `const F = t.F; for (let i = 0; i < 5; i++) F.fila(i, true); F.orden('aguantar');
  const miraA = (cx, cy, cz, tx, ty, tz) => { const dx = tx - cx, dy = ty - cy, dz = tz - cz; t.mira(cx, cy, cz, Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz))); };
  const fr = () => [Math.sin(S.giro), -Math.cos(S.giro)], de = () => [Math.cos(S.giro), Math.sin(S.giro)];
  /* cámara de costado, por delante del muro, mirando a un hombre (del lado de fuera de la formación) */
  const aHombre = (h, lejos = 3.2, alto = 1.55, delante = 1.4) => { const [fx, fz] = fr(), [rx, rz] = de(), lado = h.f >= 5.5 ? 1 : -1; miraA(h.x + rx * lado * lejos + fx * delante, alto + t.H(h.x, h.z), h.z + rz * lado * lejos + fz * delante, h.x + fx * 0.3, 1.05 + t.H(h.x, h.z), h.z + fz * 0.3); };
  const sobreHombro = (h, atras = 1.7, lado = 1.0, alto = 2.75) => { const [fx, fz] = fr(), [rx, rz] = de(), g = t.H(h.x, h.z); miraA(h.x - fx * atras + rx * lado, g + alto, h.z - fz * atras + rz * lado, h.x + fx * 2.6, g + 0.9, h.z + fz * 2.6); };
  const rotoDe = () => S.fal.filter(h => h.picaRota && h.vivo).sort((a, b) => Math.abs(b.f - 5.5) - Math.abs(a.f - 5.5) || a.tRota - b.tRota)[0];
  const anda = s => { for (let x = 0; x < s - 1e-6; x += 0.1) { t.salta(0.1, false); t.rivPaso(0.1); } }, hasta = (c, m = 3000) => { let k = 0; while (!c() && k++ < m) anda(0.1); };`;
const MOMENTOS = {
  /* la carga: los elefantes a la carrera, a unos 12 m de las puntas */
  carga: `hasta(() => S.ene.some(e => e.tipo === 'elefante' && e.est === 'carga' && e.d < 12))`,
  /* las picas partidas: el primero ya ha soltado el muñón */
  rotas: `hasta(() => S.fal.some(h => h.picaRota && h.vivo && S.T - h.tRota > 0.6))`,
  /* la espada: un hombre con la pica rota ya con la espada en la mano */
  espada: `hasta(() => S.fal.some(h => h.picaRota && h.vivo && S.T - h.tRota > 1.7))`,
  /* el elefante ensartado, cayendo delante del muro */
  ensartado: `hasta(() => S.ene.some(e => e.tipo === 'elefante' && e.est === 'ensartada' && !e.vivo)); anda(1.6)`,
  /* de cerca: soltar la pica y sacar la espada (el de la columna más de fuera con la pica rota) */
  rotasCerca: `hasta(() => S.fal.some(h => h.picaRota && h.vivo && S.T - h.tRota > 0.45)); aHombre(rotoDe())`,
  espadaCerca: `hasta(() => S.fal.some(h => h.picaRota && h.vivo && S.T - h.tRota > 1.8)); aHombre(rotoDe())`,
  /* la espada en la línea: cámara fuera del flanco, algo por delante de la primera fila, mirando a lo largo de ella */
  espadaLinea: `hasta(() => S.fal.some(h => h.picaRota && h.vivo && S.T - h.tRota > 2.2)); const h = rotoDe(), [fx, fz] = fr(), [rx, rz] = de(), lado = h.f >= 5.5 ? 1 : -1, sal = (Math.abs(h.f - 5.5) + 1) * 0.78 + 2.2; miraA(h.x + rx * lado * sal + fx * 0.9, t.H(h.x, h.z) + 1.45, h.z + rz * lado * sal + fz * 0.9, h.x - rx * lado * 0.4, t.H(h.x, h.z) + 1.05, h.z - rz * lado * 0.4)`,
  /* por encima del hombro derecho del hombre de la pica rota: se le ve soltarla (hombroRota) y la espada en la mano (hombroEspada) */
  hombroRota: `hasta(() => S.fal.some(h => h.picaRota && h.vivo && S.T - h.tRota > 0.5)); sobreHombro(S.fal.filter(h => h.picaRota && h.vivo).sort((a, b) => b.tRota - a.tRota).find(h => S.T - h.tRota > 0.5) || rotoDe())`,
  hombroEspada: `hasta(() => S.fal.some(h => h.picaRota && h.vivo && S.T - h.tRota > 2.4)); sobreHombro(S.fal.find(h => h.picaRota && h.vivo && S.T - h.tRota > 2.4))`,
  /* al acabar: la primera fila con las espadas fuera, de frente y en diagonal (el de la pica rota más cerca de la cámara) */
  final: `hasta(() => !!S.ganador); anda(2.5); const vs = S.fal.filter(h => h.picaRota && h.vivo && h.r === 0), h = vs.sort((a, b) => Math.abs(a.f - 5.5) - Math.abs(b.f - 5.5))[0] || rotoDe(), [fx, fz] = fr(), [rx, rz] = de(), g = t.H(h.x, h.z); miraA(h.x + fx * 6.5 + rx * 1.8, g + 3.9, h.z + fz * 6.5 + rz * 1.8, h.x + rx * 0.4, g + 0.9, h.z + rz * 0.4)`,
  /* los soldados nuevos de frente, en diagonal, antes de la carga (tú, el oficial del penacho, a la derecha de la foto) */
  frente: `anda(6); const h = S.fal[S.yo.i], [fx, fz] = fr(), [rx, rz] = de(), g = t.H(h.x, h.z); miraA(h.x + fx * 3.0 + rx * 1.2, g + 1.6, h.z + fz * 3.0 + rz * 1.2, h.x + rx * 1.4, g + 1.1, h.z + rz * 1.4)`,
  /* el elefante ensartado, de costado */
  ensartadoLado: `hasta(() => S.ene.some(e => e.tipo === 'elefante' && e.est === 'ensartada' && !e.vivo)); anda(3.2); const e = S.ene.find(e => e.tipo === 'elefante' && e.est === 'ensartada'), [fx, fz] = fr(), [rx, rz] = de(), lado = e.x > S.xF ? 1 : -1; miraA(e.x + rx * lado * 9 + fx * 7, t.H(e.x, e.z) + 3.4, e.z + rz * lado * 9 + fz * 7, e.x - fx * 0.5, t.H(e.x, e.z) + 0.9, e.z - fz * 0.5)`,
  /* la falange con los soldados nuevos, sarisas bajadas, antes del choque */
  falange: `anda(6)`,
  /* de costado y de cerca (para revisar el soldado) */
  lado: `anda(6); const yo = S.fal[S.yo.i]; t.mira(yo.x + 6, 1.6, yo.z + 1.5, Math.PI / 2 - 0.15, -0.05)`,
};
const FOTOS = [
  ['carga-h', Hz, 'rival=elefantes', 'carga'], ['carga-v', V, 'rival=elefantes', 'carga'],
  ['rotas-h', Hz, 'rival=elefantes', 'rotas'], ['rotas-v', V, 'rival=elefantes', 'rotas'],
  ['espada-h', Hz, 'rival=elefantes', 'espada'], ['espada-v', V, 'rival=elefantes', 'espada'],
  ['ensartado-h', Hz, 'rival=elefantes', 'ensartado'], ['ensartado-v', V, 'rival=elefantes', 'ensartado'],
  ['rotasCerca-h', Hz, 'rival=elefantes', 'rotasCerca'], ['rotasCerca-v', V, 'rival=elefantes', 'rotasCerca'], ['espadaCerca-h', Hz, 'rival=elefantes', 'espadaCerca'], ['espadaCerca-v', V, 'rival=elefantes', 'espadaCerca'],
  ['espadaLinea-h', Hz, 'rival=elefantes', 'espadaLinea'], ['espadaLinea-v', V, 'rival=elefantes', 'espadaLinea'],
  ['hombroRota-h', Hz, 'rival=elefantes', 'hombroRota'], ['hombroRota-v', V, 'rival=elefantes', 'hombroRota'], ['hombroEspada-h', Hz, 'rival=elefantes', 'hombroEspada'], ['hombroEspada-v', V, 'rival=elefantes', 'hombroEspada'],
  ['final-h', Hz, 'rival=elefantes', 'final'], ['final-v', V, 'rival=elefantes', 'final'],
  ['frente-h', Hz, 'rival=elefantes', 'frente'], ['frente-v', V, 'rival=elefantes', 'frente'],
  ['ensartadoLado-h', Hz, 'rival=elefantes', 'ensartadoLado'], ['ensartadoLado-v', V, 'rival=elefantes', 'ensartadoLado'],
  ['falange-h', Hz, 'rival=elefantes', 'falange'], ['falange-v', V, 'rival=elefantes', 'falange'], ['lado-h', Hz, 'rival=elefantes', 'lado'],
];
const solo = op.solo ? op.solo.split(',') : null, SEMILLA = op.semilla || '12';
for (const [nombre, [w, h], q, mom] of FOTOS) {
  if (solo && !solo.includes(nombre)) continue;
  const t0 = Date.now(), ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page, nombre);
  try {
    await page.goto(URL0 + '?antiguo=1&' + q + '&semilla=' + SEMILLA + (op.extra ? '&' + op.extra : ''));
    await page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000, polling: 500 });
    await page.evaluate(() => window.__tp.parar(true));
    const r = await page.evaluate(`(() => { const t = window.__tp, S = t.S; ${PREP} ${MOMENTOS[mom]}; return { T: +S.T.toFixed(2), fase: S.fase, riv: S.riv && S.riv.fase, rotas: S.fal.filter(h => h.picaRota).length, espadas: S.fal.filter(h => h.picaRota && h.vivo && S.T - h.tRota > 1.2).length, ele: S.ene.filter(e => e.tipo === 'elefante').map(e => e.est + (e.vivo ? '' : '†')).join(',') }; })()`);
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
