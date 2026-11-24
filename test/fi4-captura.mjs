/* AQVILA — FI4: capturas y medidas de la física en la batalla de campaña (js/ui-guerra.js) en el navegador.
   Uso: node test/fi4-captura.mjs [vh] [fisica=0] [pref=FI4-]   v = 390×844, h = 844×390. Capturas en gobierno/capturas-tarea/.
   Abre una batalla grande (Roma contra galos, íberos y libios), la lleva hasta la descarga de pila, el choque y la lucha, y en
   cada momento guarda la foto y la medida: llamadas de dibujo, triángulos y la física (__gc.fisica()). Sale con 1 si hay errores. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const arg = process.argv.slice(2), op = Object.fromEntries(arg.filter(a => a.includes('=')).map(a => a.split('=')));
const vistas = (arg.find(a => /^[vh]+$/.test(a)) || 'vh').split(''), fis = op.fisica === '0' ? 0 : 1, pref = op.pref || 'FI4-';
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const errores = [], informe = [];
const EJ = [{ hastati: 1200, principes: 1200, triarii: 600, velites: 960, equites: 300 }, { galos: 2400, iberos: 1500, libios: 1500, velites: 0, numidas: 240 }];
for (const v of vistas) {
  const [W, H] = v === 'v' ? [390, 844] : [844, 390];
  const ctx = await br.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errores.push(v + ': ' + m.text()); }); page.on('pageerror', e => errores.push(v + ': ' + e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html?fisica=${fis}`);
  await page.waitForFunction('window.UIGuerra && window.Guerra && window.DATA', null, { timeout: 60000 });
  await page.evaluate(EJ => { delete EJ[1].velites; window.UIGuerra.abrir({ estado: window.Guerra.crear({ semilla: 20261124, ejercitos: EJ }), campo: 'llano' }, () => {}); }, EJ);
  await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 180000 });
  await page.evaluate(() => window.__gc.pausa(true));
  const gc = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]);
  /* avanza (sin dibujar) hasta que pase algo; luego unos fotogramas dibujados */
  const hasta = async (cond, max) => page.evaluate(([c, max]) => { const g = window.__gc, f = new Function('B', 'return ' + c); let k = 0; while (!f(g.B) && g.B.fase !== 'fin' && k++ < max * 20) g.salta(0.05); return g.B.t; }, [cond, max]);
  const dibuja = async (n, dt = 0.05) => { for (let k = 0; k < n; k++) await gc('cuadro', dt); };
  const cam = async () => { const z = await page.evaluate(() => -window.__gc.B.sect[1].frente * 7); return z; };
  async function foto(nombre, o) {
    const z = await cam(); await gc('camara', Object.assign({ x: 0, y: 0.8, z, d: 22, p: 0.42, a: 0.55 }, o, { z: z + (o && o.dz || 0) })); await dibuja(2, 0.02);
    const e = await gc('estado'), f = await gc('fisica'), ruta = join(SALIDA, pref + nombre + '-' + v + '.jpg');
    await page.screenshot({ path: ruta, type: 'jpeg', quality: 82 });
    informe.push({ v, nombre, t: +e.t.toFixed(1), fase: e.fase, llamadas: e.llamadas, tri: e.tri, figs: e.figs, fisica: f }); console.log(v, nombre, 't', e.t.toFixed(1), 'llamadas', e.llamadas, 'tri', e.tri, JSON.stringify(f));
  }
  /* 1) la descarga de pila: el primer evento «pila» */
  await hasta("B.eventos.some(e => e.tipo === 'pila')", 120); await gc('fisicaCero'); await dibuja(6);
  await foto('pila', { d: 16, p: 0.3, a: 0.75, dz: 3 });
  /* 2) la carga y el choque: los frentes se tocan */
  await dibuja(14); await foto('carga', { d: 15, p: 0.38, a: -0.75, dz: -1 });
  /* 3) la lucha: 25 s después, con caídos */
  await hasta('B.t > ' + ((await page.evaluate(() => window.__gc.B.t)) + 25), 40); await dibuja(8); await foto('lucha', { d: 15, p: 0.5, a: 0.5 });
  if (op.sonda) console.log(JSON.stringify(await page.evaluate(await (await import('node:fs/promises')).readFile(op.sonda, 'utf8')), null, 0));
  /* 4) de lejos, con todo el campo: el peso con más figuras a la vista */
  await gc('camara', null); await dibuja(4); { const e = await gc('estado'), f = await gc('fisica'); await page.screenshot({ path: join(SALIDA, pref + 'campo-' + v + '.jpg'), type: 'jpeg', quality: 82 }); informe.push({ v, nombre: 'campo', llamadas: e.llamadas, tri: e.tri, fisica: f }); console.log(v, 'campo', 'llamadas', e.llamadas, 'tri', e.tri, JSON.stringify(f)); }
  await ctx.close();
}
await br.close(); srv.close();
await writeFile(join(SALIDA, pref + 'informe.json'), JSON.stringify({ fisica: fis, informe, errores }, null, 1));
if (errores.length) { console.log('ERRORES', errores.slice(0, 8)); process.exit(1); }
console.log('sin errores de consola');
