// Maqueta GM11 — juega la batalla que empieza de lejos en un móvil simulado (toques de dedo), comprueba lo que debe verse y deja las capturas.
// Uso:  node gobierno/maquetas/guerra-unica/captura.mjs                         -> capturas GM11-* (dpr 2) en gobierno/capturas-tarea/
//       node gobierno/maquetas/guerra-unica/captura.mjs dpr=1 prefijo=/ruta/p-   -> rápido, para iterar
//       node gobierno/maquetas/guerra-unica/captura.mjs --servir                 -> solo sirve la página
// Los toques son de dedo de verdad sobre los botones; el tiempo se adelanta con el gancho window.__gc.salta.
// La fluidez de aquí es con render por software: sirve para comparar unos tamaños con otros y con GC1, no como dato de un móvil.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8379 : 0, '127.0.0.1', () => ok(s)); });
const BASE = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/', URL0 = BASE + 'guerra-unica/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GM11-'), errores = [], tabla = [];
const espera = (p, ms) => p.waitForTimeout(ms);
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
async function abrir(url, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  const t0 = Date.now(); await page.goto(url); await page.waitForFunction('window.__gc && window.__gc.lista === true', null, { timeout: 300000 });
  return { ctx, page, carga: (Date.now() - t0) / 1000 };
}

/* Una partida a la medida de un móvil: de lejos, el choque, el relevo pasando, el aviso de flanco (si sale) y la comprobación de que el relevo dura lo que dicen las reglas. */
async function partida(nombre, w, h, completa, extra) {
  const { ctx, page, carga } = await abrir(URL0 + '?directo=1&semilla=4242&hombres=5000' + (extra || ''), w, h), id = nombre;
  const g = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]);
  const foto = async n => { await espera(page, 1500); for (let i = 0; ; i++) { try { await page.screenshot({ path: prefijo + id + '-' + n + '.jpg', type: 'jpeg', quality: 80, timeout: 240000 }); break; } catch (e) { if (i >= 2) throw e; } } const e = await g('estado'); const cinta = await page.textContent('#cinta'); console.log(`${id}-${n}: t=${e.t.toFixed(0)} s · botones ${e.botones.join(', ')} · cinta «${cinta}»`); return { ...e, cinta }; };
  const pulsa = async sel => { await page.tap(sel); await espera(page, 250); };
  const hasta = (cond, tope) => page.evaluate(([c, tope]) => { const G = window.__gc, B = G.B, R = G.R; let n = 0; while (!eval(c) && B.fase !== 'fin' && n++ < tope * 4) G.salta(0.25); return eval(c); }, [cond, tope || 90]);
  console.log(`\n== ${id}: cargada en ${carga.toFixed(0)} s ==`);
  await g('pausa', true);
  if (completa) { await g('salta', 2); await foto('1-lejos'); }
  await hasta('B.sect.every(s => !R.lejos(s))', 90); await g('salta', 1.5); await g('mirar', 1, 40);
  await pulsa('.cuerpo[data-i="1"]');
  const ch = await foto('2-choque');
  bien(ch.botones.join() === 'Empujar,Aguantar,Relevo,Caballería', 'al chocar los botones dicen Empujar, Aguantar, Relevo y Caballería');
  /* el relevo a tiempo: la línea del centro está agotada y la de refresco espera detrás */
  await page.evaluate(() => { const G = window.__gc, c = G.B.sect[1].c[0]; G.R.frente(c).fatiga = 0.8; const e = G.B.sect[1].c[1]; e.postura = 'aguantar'; e.tPost = 9; });
  await page.waitForFunction(() => /buen momento/.test(document.querySelector('.orden[data-o="relevo"] .sub').textContent), null, { timeout: 15000 }).catch(() => {});
  const sub = await page.textContent('.orden[data-o="relevo"] .sub'); bien(/buen momento/.test(sub), 'el botón «Relevo» avisa «buen momento» cuando la línea está agotada (dice «' + sub + '», juicio ' + await page.evaluate(() => { const G = window.__gc; return G.R.juicioRelevo(G.B, 1) + ' fat ' + G.R.frente(G.B.sect[1].c[0]).fatiga + ' sel ' + G.estado().sel; }) + ')');
  await pulsa('.orden[data-o="relevo"]'); await g('salta', 0.05); const cj = await page.textContent('#cinta'); await g('salta', 0.85); await g('mirar', 1, 30);
  const m = await g('relevo', 1), rv = await foto('3-relevo-en-curso'); const m2 = await g('relevo', 1);
  bien(m.en && m.u > 0.3 && m.u < 0.7 && (m.calle > 0.5 || m.emb > 0.5), 'a mitad del relevo la línea que sale deja calles y la que entra va por ellas (progreso ' + m.u.toFixed(2) + ', calles ' + m.calle.toFixed(2) + ', fila ' + m.emb.toFixed(2) + ')');
  bien(m.juicio === 'a-tiempo' && /Relevo a tiempo/.test(cj), 'la cinta dice el juicio del relevo: «' + cj + '»');
  /* lo que se ve dura lo que dicen las reglas: se cuenta el tiempo del juego desde que el relevo se ve en marcha hasta que deja de verse */
  const durv = await page.evaluate(() => { const G = window.__gc; let t = 0; while (G.relevo(1).en && t < 10) { G.salta(0.05); t += 0.05; } return t; });
  bien(Math.abs(m.dur - 1.92) < 0.01 && Math.abs(0.9 + durv - m.dur) < 0.15, 'el relevo a tiempo se ve durante ' + (0.9 + durv).toFixed(2) + ' s y las reglas dicen ' + m.dur.toFixed(2) + ' s');
  if (completa) {
    /* el relevo con mal juicio: más lento y con desorden (sin calles) */
    await page.evaluate(() => { const G = window.__gc, c = G.B.sect[1].c[0]; G.R.frente(c).fatiga = 0.1; });
    await g('salta', 0.3); await pulsa('.orden[data-o="relevo"]'); await g('salta', 1.2);
    const mm = await g('relevo', 1); bien(mm.en && mm.juicio === 'sin-necesidad' && mm.calle === 0 && mm.dur > 3, 'el relevo sin necesidad se ve más lento (' + mm.dur.toFixed(2) + ' s) y sin calles: la línea se agita');
    await g('salta', 4);
    /* aviso de flanco: cae el cuerpo de la izquierda y el enemigo entra por el hueco */
    await page.evaluate(() => { const G = window.__gc; G.B.sect[0].frente = -(G.R.CEDE || 4) - 3; });
    const hay = await hasta('B.eventos.some(e => e.tipo === "flanco" && e.lado === 0)', 10);
    if (hay) { await g('mirar', 1, 30); const fl = await foto('4-aviso-flanco'); bien(/hueco/i.test(fl.cinta), 'aviso de flanco en pantalla: «' + fl.cinta + '»'); }
    else console.log('  (no se logró provocar el aviso de flanco en esta partida: sin captura)');
  }
  await ctx.close();
}
/* GM11b: caballería (GM8/GM9) y elefantes en la maqueta única */
async function jinetes(nombre, extra, hazlo) {
  const { ctx, page, carga } = await abrir(URL0 + '?directo=1&semilla=4242&hombres=5000' + extra, 390, 844);
  const g = (f, ...a) => page.evaluate(([f, a]) => window.__gc[f](...a), [f, a]);
  const foto = async n => { await espera(page, 1500); for (let i = 0; ; i++) { try { await page.screenshot({ path: (op.prefijo || SALIDA + '/') + n + '.jpg', type: 'jpeg', quality: 80, timeout: 240000 }); break; } catch (e) { if (i >= 2) throw e; } } console.log(n + ' · cinta «' + await page.textContent('#cinta') + '»'); };
  const pulsa = async sel => { await page.tap(sel); await espera(page, 250); };
  const paso = async (cond, tope) => { for (let k = 0; k < tope * 4; k++) { if (await page.evaluate(c => { const G = window.__gc, B = G.B, R = G.R; return eval(c); }, cond)) return true; await g('salta', 0.25); } return false; };
  console.log('\n== ' + nombre + ': cargada en ' + carga.toFixed(0) + ' s ==');
  await g('pausa', true); await hazlo({ g, foto, pulsa, paso, page }); await ctx.close();
}
const solo = op.solo || 'todo';
if (solo === 'todo' || solo === 'gm11b') {
  await jinetes('rodea', '', async ({ g, foto, pulsa, paso, page }) => {
    await g('salta', 2); await g('mirar', -1, 0); await pulsa('.cuerpo[data-i="0"]'); await pulsa('.orden[data-o="caballeria"]');
    await g('sigue', true); await paso('B.cab.fase === "rodea"', 10); await g('salta', 3); await g('mirar', -1, 0);
    const ya = await page.evaluate(() => { const G = window.__gc, c = G.cab(); return { fase: G.B.cab.fase, sig: G.siguiendo, solapa: c.regs.filter(q => Math.abs(c.x - q.x) < q.w / 2 && (q.lado === 0 ? c.z > q.z - 1 && c.z < q.z + q.h : c.z < q.z + 1 && c.z > q.z - q.h)).length, sub: document.querySelector('.orden[data-o="caballeria"] .sub').textContent }; });
    bien(ya.fase === 'rodea' && ya.sig && ya.solapa === 0, 'los jinetes rodean por fuera sin pisar ninguna línea y la cámara los sigue (' + JSON.stringify(ya) + ')');
    await foto('GM11b-a-rodeando');
  });
  await jinetes('duelo', '&rival=pirro', async ({ g, foto, pulsa, paso, page }) => {
    await g('salta', 2); await g('mirar', -1, 0); await pulsa('.cuerpo[data-i="0"]'); await pulsa('.orden[data-o="caballeria"]');
    await g('sigue', true); await paso('B.cab.fase === "rodea"', 10);
    for (let k = 0; k < 40 && await page.evaluate(() => { const c = window.__gc.cab(); return Math.hypot(c.rn.x - c.x, c.rn.z - c.z) > 22 && window.__gc.B.cab.fase === 'rodea'; }); k++) await g('salta', 0.25);
    await g('mirar', -1, 0);
    console.log('  duelo: ' + await page.evaluate(() => { const G = window.__gc, B = G.B; return B.cab.fase + ' guarda ' + B.num.guarda + ' num ' + B.num.estado; }));
    await foto('GM11b-b-duelo-de-jinetes');
  });
  await jinetes('elefantes', '&rival=zama', async ({ g, foto, pulsa, paso, page }) => {
    await paso('B.sect[0].dist < 52', 80); await g('mirar', 0, 30);
    const t = await page.evaluate(() => ({ b: window.__gc.B.sect[0].c[1].lineas.map(l => l.tipo) }));
    console.log('  líneas del cuerpo izquierdo enemigo: ' + t.b.join(','));
    await foto('GM11b-c-elefantes'); await paso('B.eventos.some(e => e.tipo === "elefantes-cargan")', 40); await g('salta', 1); await foto('GM11b-c2-elefantes-cargan');
  });
  await jinetes('no-hay-paso', '', async ({ g, foto, pulsa, paso, page }) => {
    await g('salta', 2); await g('mirar', -1, 0); await pulsa('.cuerpo[data-i="1"]');
    const sub = await page.textContent('.orden[data-o="caballeria"] .sub'), no = await page.evaluate(() => document.querySelector('.orden[data-o="caballeria"]').classList.contains('no'));
    bien(/no hay paso/.test(sub) && no, 'con las dos alas guardadas el botón Caballería del centro dice «no hay paso» (dice «' + sub + '»)');
    await pulsa('.orden[data-o="caballeria"]'); await foto('GM11b-d-no-hay-paso');
  });
}
if (solo === 'gm11b') { console.log(errores.length ? 'NO APTO · ' + errores.join('\n') : 'APTO'); await br.close(); srv.close(); process.exit(errores.length ? 1 : 0); }
if (op.solo !== 'horizontal') await partida('vertical', 390, 844, true);
if (op.solo !== 'vertical') await partida('horizontal', 844, 390, false);
console.log(errores.length ? 'NO APTO · ' + errores.length + ' fallos:\n' + errores.join('\n') : 'APTO · sin errores de consola');
await br.close(); srv.close(); process.exit(errores.length ? 1 : 0);
