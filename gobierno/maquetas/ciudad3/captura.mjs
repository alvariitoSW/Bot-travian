// Maqueta Q1k — «fundar, colocar, crecer»: juega una partida entera en un móvil de 390×844 y deja las capturas. No toca el juego.
// Uso:  node gobierno/maquetas/ciudad3/captura.mjs            -> las 6 capturas Q1k-* (dpr 2) en gobierno/capturas-tarea/ y medidas.json
//       node gobierno/maquetas/ciudad3/captura.mjs dpr=1 hasta=3 prefijo=/ruta/p-   -> rápido, para iterar (para en la captura 3)
//       node gobierno/maquetas/ciudad3/captura.mjs --servir   -> solo sirve la página (http://127.0.0.1:8378/gobierno/maquetas/ciudad3/)
// Los pasos 1 a 3 se hacen con el DEDO (toques y arrastres de verdad); el resto de la partida, con los ganchos window.__q1k.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir, writeFile } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d); } catch (e) { res.writeHead(404); res.end('no'); } }); s.listen(args.includes('--servir') ? 8378 : 0, '127.0.0.1', () => ok(s)); });
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + BASE + 'gobierno/maquetas/ciudad3/'); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), hasta = +(op.hasta || 9), prefijo = op.prefijo || join(SALIDA, 'Q1k-');
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
const errores = [];
page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource|GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
const q = (f, ...a) => page.evaluate(([f, a]) => { const o = window.__q1k; return f.split('.').reduce((x, k) => x[k], o)(...a); }, [f, a]);
const espera = ms => page.waitForTimeout(ms), medidas = [];
async function foto(nombre) { await espera(900); const ruta = prefijo + nombre + '.jpg'; for (let i = 0; ; i++) { try { await page.screenshot({ path: ruta, type: 'jpeg', quality: 85, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } }
  const m = await q('medidas'), e = await q('estado'); medidas.push({ captura: 'Q1k-' + nombre, triangulos: m.triangulos, llamadas: m.llamadas, conPaseDeSombra: m.conSombra, sombrasCalculadas: m.sombras, casas: e.casas, niveles: e.niveles, vias: e.vias, edificios: e.edificios.length, fecha: e.fecha });
  console.log(`${nombre}: ${m.triangulos} triángulos, ${m.llamadas} llamadas (pase de sombra ${m.conSombra}) · ${e.fecha} · ${e.casas} casas ${JSON.stringify(e.niveles)} · ${e.vias} calles`); }
/* dedos de verdad */
const toque = (x, y) => page.touchscreen.tap(x, y);
async function arrastre(x0, y0, x1, y1, pasos = 8) { const P = (x, y) => [{ x, y, id: 1 }]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: P(x0, y0) }); for (let i = 1; i <= pasos; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: P(x0 + (x1 - x0) * i / pasos, y0 + (y1 - y0) * i / pasos) }); await espera(40); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await espera(150); }
async function pellizco(cx, cy, d0, d1, giro = 0, pasos = 8) { const P = (d, a) => [{ x: cx - Math.cos(a) * d / 2, y: cy - Math.sin(a) * d / 2, id: 1 }, { x: cx + Math.cos(a) * d / 2, y: cy + Math.sin(a) * d / 2, id: 2 }]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: P(d0, 0) }); for (let i = 1; i <= pasos; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: P(d0 + (d1 - d0) * i / pasos, giro * i / pasos) }); await espera(40); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await espera(150); }
const comprobar = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
const pon = async (id, cerca) => { const s = await q('mejor', id, cerca || null); if (!s) { console.log('  sin sitio para ' + id); return null; } const r = await q('colocar', id, s[0], s[1], true); if (r !== true) console.log('  no se pudo ' + id + ': ' + r); return s; };

const t0 = Date.now();
await page.goto(BASE + 'gobierno/maquetas/ciudad3/index.html' + (op.semilla ? '?semilla=' + op.semilla : '')); await page.waitForFunction('window.__q1k && window.__q1k.lista === true', null, { timeout: 600000 }); await espera(1500);
console.log('cargada en ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');

/* 1. terreno vacío: tocar el terreno con el dedo -> groma, mapa de calor y línea de razones */
{ const c0 = await q('vista', 'general'); await arrastre(200, 520, 150, 470); const c1 = await q('vista', {}); comprobar(Math.hypot(c1.tx - c0.tx, c1.tz - c0.tz) > 20, 'un dedo arrastra la cámara (' + Math.round(c1.tx - c0.tx) + ', ' + Math.round(c1.tz - c0.tz) + ')');
  await pellizco(195, 450, 220, 120); const c2 = await q('vista', {}); comprobar(c2.d > c1.d * 1.3, 'el pellizco aleja (' + Math.round(c1.d) + ' -> ' + Math.round(c2.d) + ')');
  await pellizco(195, 450, 120, 200, 0.6); const c3 = await q('vista', {}); comprobar(Math.abs(c3.az - c2.az) > 0.3, 'dos dedos giran (' + c3.az.toFixed(2) + ')');
  await q('vista', 'general');
  await toque(120, 600); await espera(300); let e = await page.evaluate(() => document.getElementById('l-texto').textContent); comprobar(e.length > 5 && !/Senado/.test(e), 'tocar el terreno da razones: «' + e + '»');
  const p = await q('aPantalla', 172, -196); await toque(p.x, p.y); await espera(300); e = await page.evaluate(() => document.getElementById('linea').textContent); comprobar(/Agua cerca/.test(e), 'razones del sitio elegido: «' + e + '»');
  await foto('1-terreno'); }
/* 2. fundar con el botón */
if (hasta >= 2) { await toque(195, 800); await espera(600); comprobar((await q('estado')).fundada, 'el botón «Fundar aquí» funda'); await espera(5200); await q('pausa', true); await espera(1800); await q('vista', 'foro'); await foto('2-fundada'); }
/* 3. tocar una ficha, arrastrar el fantasma, construir */
if (hasta >= 3) { const f = await page.locator('.ficha[data-id="fuente"]').boundingBox(); await toque(f.x + f.width / 2, f.y + f.height / 2); await espera(400); comprobar((await q('estado')).modo === 'colocar', 'tocar la ficha Fuente enseña el fantasma');
  const a = await page.evaluate(() => { const s = window.__q1k.E, o = window.__q1k; return null; });
  const antes = await page.evaluate(() => document.getElementById('l-texto').textContent); await arrastre(195, 380, 250, 470); const des = await page.evaluate(() => document.getElementById('l-texto').textContent); comprobar(antes !== des, 'arrastrar el fantasma cambia las razones: «' + des + '»');
  const m = await q('mejor', 'fuente'), p = await q('aPantalla', m[0], m[1]); await toque(p.x, p.y); await espera(400); await foto('3-colocar');
  await toque(260, 800); await espera(500); const e = await q('estado'); comprobar(e.edificios.length === 1 && e.modo === 'jugar', 'el botón «Construir aquí» construye (' + e.edificios.join() + ')');
  /* arrastrar desde la ficha */
  const g = await page.locator('.ficha[data-id="granero"]').boundingBox(); await arrastre(g.x + g.width / 2, g.y + 30, 200, 420, 10); const e2 = await q('estado'); comprobar(e2.modo === 'colocar', 'arrastrar la ficha hacia arriba lleva el edificio bajo el dedo'); await q('cancelar');
  await pon('granero'); await pon('templo'); await q('vista', 'cerca'); await espera(2500); await foto('3b-obra'); await q('vista', 'foro'); }
/* 4. a los dos años: calles y casas nacidas solas, varios edificios */
if (hasta >= 4) { await pon('granja'); await q('mes', 9); await pon('mercado'); await q('mes', 4); await pon('fuente'); await pon('granja'); await q('mes', 8); await pon('taller'); await pon('muelle'); await q('mes', 3);
  await q('aviso', '', '', 0); await q('vista', 'foro'); await espera(4000); await foto('4-crece'); }
/* 5. ciudad grande: muralla, barrio nuevo, niveles, etiquetas */
if (hasta >= 5) { await q('muralla', true); await q('mes', 4); const fo = await page.evaluate(() => [window.__q1k.E.foro.x, window.__q1k.E.foro.z]); await pon('compitum', fo); await q('mes', 3); await q('muralla', true); const b = (await q('estado')).barrios.length; await q('mes', 5); const E2 = await page.evaluate(() => { const b = window.__q1k.E.barrios[1]; return b ? [b.x, b.z] : null; }); if (E2) { await pon('fuente', E2); await pon('templo', E2); }
  await q('mes', 16); await q('aviso', '', '', 0); await q('vista', E2 ? { tx: (fo[0] + E2[0]) / 2, tz: (fo[1] + E2[1]) / 2 + 30, d: 740, az: 0 } : 'lejos'); console.log('  barrios: ' + (await q('estado')).barrios.join(' || ')); await espera(4000); await foto('5-barrios');
  await q('vista', 'cerca'); await espera(2500); await foto('5b-cerca'); }
/* 6. un suceso: la crecida de primavera (se pone una granja en la ribera baja para que se vea por qué) */
if (hasta >= 6) { const r = await page.evaluate(() => { const o = window.__q1k, R = o.reglas, E = o.E; let m = null; for (let x = -200; x < 420 && !m; x += 8) for (let z = -400; z < -200; z += 8) { const s = R.notaSitio(E, 'granja', x, z); if (s.vale && s.razones.some(t => /inunda/.test(t)) && Math.hypot(x - E.foro.x, z - E.foro.z) < 330) { m = [x, z]; break; } } if (m) o.colocar('granja', m[0], m[1], true); return m; });
  let av = []; for (let i = 0; i < 14; i++) { av = await q('mes', 1); if (av.some(t => /Crecida/.test(t))) break; } comprobar(av.some(t => /Crecida/.test(t)), 'crecida: «' + av[0] + '»');
  await q('vista', { tx: r ? r[0] : 150, tz: r ? r[1] + 25 : -260, d: 250, az: 0.5, elF: 0.72 }); await espera(5000); await foto('6-crecida');
  await q('mes', 1);
  /* para la foto del incendio se prende a mano una casa lejos de las fuentes (en la partida sale solo, al azar) */
  const c = await page.evaluate(() => { const o = window.__q1k, E = o.E, fu = E.edificios.filter(e => e.tipo === 'fuente'), cs = E.parcelas.filter(l => l.casa && !l.casa.ruina && !l.fuera && l.casa.nivel >= 2), l = cs.sort((a, b) => Math.min(...fu.map(f => Math.hypot(f.x - b.x, f.z - b.z))) - Math.min(...fu.map(f => Math.hypot(f.x - a.x, f.z - a.z))))[0]; if (!l) return null; let n = 0; for (const v of cs) if (Math.hypot(v.x - l.x, v.z - l.z) < 26 && n < 3) { v.casa.ruina = 5; v.casa.arde = true; n++; } E.rev++; o.aviso('Incendio en el ' + E.barrios[l.barrio].nombre + ': ardieron ' + n + ' casas. No había fuente cerca para apagarlo.', 'aviso fuego', 60); return [l.x, l.z]; });
  if (c) { await q('vista', { tx: c[0], tz: c[1] + 6, d: 170, az: -0.4, elF: 0.6 }); await espera(5000); await foto('6b-incendio'); }
  /* empezar de nuevo */
  await q('nueva'); await espera(2500); const e = await q('estado'); comprobar(!e.fundada && e.modo === 'fundar' && e.casas === 0, '«Empezar de nuevo» deja el terreno vacío'); }
if (!op.prefijo) await writeFile(join(AQUI, 'medidas.json'), JSON.stringify({ tope: 300000, nota: 'Triángulos por cuadro (renderer.info.render.triangles) a 390×844, render por software. El pase de sombra solo se hace al cambiar la ciudad.', fases: medidas, errores }, null, 1));
console.log(errores.length ? 'ERRORES: ' + errores.length : 'Sin errores de consola ni de prueba'); console.log('total ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
await br.close(); srv.close();
