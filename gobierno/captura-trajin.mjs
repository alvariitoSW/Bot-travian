/* Trajín (CN15b): node gobierno/captura-viva.mjs [prefijo] [vistas=a,b] → gobierno/capturas-tarea/<prefijo>-<vista>.jpg y triángulos de cada vista.
   Vistas: activa (dos obras con cuadrilla), pausa (una obra parada, sin obreros), recua (mulas por una vía), andamio (primer plano). Con trajin=off se apagan los interruptores de la cuadrilla (no editan archivos: solo mide).
   Copiado de captura-cultura.mjs (captura-ciudad.mjs no se toca). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [pref = 'CN15b', ...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => a.split('='))), dpr = +(op.dpr || 1);
const ciudad = 'roma', vistas = (op.vistas || 'activa,pausa,recua,andamio').split(',');
const LUZ_ESTACIONAL = true;          // Q11: false = sin mes= ni vistas de luz (la ciudad usa la luz de siempre)
const ponerFecha = (mes, frac) => page.evaluate(([m, f]) => { Game.state.speed = 0; Game.state.t = 24 + (m - 1) + f; }, [mes, frac]);     // inversa de G.estacion: enero = invierno, 3 meses por turno
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
await cierra();
await page.evaluate(c => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = c; UI.city = c; document.body.appendChild(b); b.click(); b.remove(); }, ciudad);
await page.waitForTimeout(12000); await cierra();
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
const medir = () => page.evaluate(() => { const i = UI.cityV.r.info.render; return i.triangles + ' triángulos, ' + i.calls + ' llamadas'; });
const elegir = c => page.evaluate(c => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = c; UI.city = c; document.body.appendChild(b); b.click(); b.remove(); }, c);
await page.evaluate(() => { Game.state.speed = 0; const c = Game.state.cities.roma; for (const b in DATA.BUILD) c.b[b] = Math.max(c.b[b] || 0, 5); });
const mirarPlaza = (d, az) => page.evaluate(([d, az]) => { const E = Game.ciudadE('roma'); UI.cityV.view('ciudad'); UI.cityV.mirar(E.foro.x, E.foro.z, d, az); }, [d, az]);

const poner = (conf) => page.evaluate(conf => {
  const c = Game.state.cities.roma, E = Game.ciudadE('roma'), t = Game.state.t; c.obras.length = 0; E.rev++;
  const v = E.vias.find(v => v.p && v.p.length > 2) || E.vias[0], p = v.p[Math.floor(v.p.length / 2)], q = Array.isArray(p) ? { x: p[0], z: p[1] } : p;
  conf.obras.forEach((o, i) => c.obras.push({ pieza: o.pieza, x: E.foro.x + o.dx, z: E.foro.z + o.dz, nuevo: true, t0: t - 1 + 0.0, t1: t + 3, pausa: !!o.pausa }));
  return { foro: E.foro, via: q };
}, conf);
for (const v of vistas) {
  const conf = { activa: { obras: [{ pieza: 'taller', dx: 40, dz: 30 }, { pieza: 'templo', dx: -45, dz: 35 }] }, pausa: { obras: [{ pieza: 'taller', dx: 40, dz: 30, pausa: true }] }, recua: { obras: [] }, andamio: { obras: [{ pieza: 'taller', dx: 40, dz: 30 }] } }[v];
  const r = await poner(conf); await page.waitForTimeout(4000);
  if (v === 'recua') { const rc = await page.evaluate(async () => { const m = await import('/js/gfx/trajin.js'); const a = m.recuas()[0]; return a && { x: a.x, z: a.z }; }); const q = rc || r.via; await page.evaluate(([x, z]) => UI.cityV.mirar(x, z, 60, 0.4), [q.x, q.z]); }
  else if (v === 'andamio') await page.evaluate(([x, z]) => UI.cityV.mirar(x + 40, z + 30, 45, 0.5), [r.foro.x, r.foro.z]);
  else await page.evaluate(([x, z]) => UI.cityV.mirar(x, z, 130, 0.4), [r.foro.x, r.foro.z]);
  await page.waitForTimeout(4000);
  const f = join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + v + '.jpg');
  for (let i = 0; ; i++) { try { await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } }
  const dbg = await page.evaluate(async () => { const m = await import('/js/gfx/trajin.js'); const E = Game.ciudadE('roma'); return JSON.stringify({ ob: m.obreros().length, o0: m.obreros()[0], rc: m.recuas().length, r0: m.recuas()[0] && { x: m.recuas()[0].x, z: m.recuas()[0].z, m0: m.recuas()[0].mulas[0] }, obra: Game.state.cities.roma.obras[0] && [Game.state.cities.roma.obras[0].x, Game.state.cities.roma.obras[0].z], cam: UI.cityV.cam && [UI.cityV.cam.d], vias: E.vias.length, puertas: (E.puertas || []).length, fund: E.fundada, nobras: Game.state.cities.roma.obras.length, t: Game.state.t }); });
  console.log(f + ' · ' + await medir() + ' · ' + dbg);
}
if (errores.length) console.log('ERRORES DE CONSOLA:\n' + [...new Set(errores)].join('\n')); else console.log('Sin errores de consola.');
await br.close(); srv.close();
