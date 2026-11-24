/* CD2a: banco de capturas de «Calles con el dedo y el arquitecto» a 390×844.
   Uso: node gobierno/maquetas/calles/captura.mjs   → gobierno/capturas-tarea/CD2a-1..6-*.jpg y OK/MAL por paso. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const SALIDA = join(RAIZ, 'gobierno/capturas-tarea');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch { r.writeHead(404); r.end('no'); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false, serviceWorkers: 'block' })).newPage();
const errores = [], fallos = []; let n = 0;
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
const paso = (ok, t) => { console.log((ok ? 'OK   ' : 'MAL  ') + t); if (!ok) fallos.push(t); };
const foto = nombre => page.screenshot({ path: join(SALIDA, 'CD2a-' + nombre + '.jpg'), type: 'jpeg', quality: 82 });
await mkdir(SALIDA, { recursive: true });
try {
  await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
  await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
  await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
  const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
  await cierra();
  await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = 'roma'; UI.city = 'roma'; document.body.appendChild(b); b.click(); b.remove(); });
  await page.waitForTimeout(12000); await cierra();
  await page.evaluate(() => { Game.state.speed = 0; const a = Game.state.ajustes; if (a) a.asesor = false; Game.ciudadE(UI.city).monedas = 2000; });
  paso(await page.evaluate(() => !!(UI.cityV && UI.cityV.calles && Game.ciudadE(UI.city))), 'la ciudad y la vista están');
  await page.evaluate(() => UI.cityV.calles(true)); await page.waitForTimeout(2500);
  paso(await page.evaluate(() => UI.cityV.enCalles && !!document.querySelector('.cl-barra')), 'el modo Calles está activo y sale la barra');
  const visible = await page.evaluate(() => { const E = Game.ciudadE(UI.city), c = UI.cityV; return !!E && c.aPantalla(E.foro.x, E.foro.z, 0).ok; });
  /* busca un trazo recto válido con los dos extremos a la vista, lejos de la barra de abajo */
  const buscar = (cual) => page.evaluate(async cual => { const K = await import('/js/calles.js'), E = Game.ciudadE(UI.city), c = UI.cityV, mejores = [];
    for (let r = 50; r < 280; r += 10) for (let t = 0; t < 6.283; t += 0.15) for (const largo of [80, 110]) { const x = E.foro.x + Math.cos(t) * r, z = E.foro.z + Math.sin(t) * r, t2 = t + 1.57, pts = [[x, z], [x + Math.cos(t2) * largo, z + Math.sin(t2) * largo]];
      const a = c.aPantalla(pts[0][0], pts[0][1], 0), b = c.aPantalla(pts[1][0], pts[1][1], 0); if (![a, b].every(q => q.ok && q.x > 30 && q.x < 360 && q.y > 140 && q.y < 520)) continue;
      const v = K.validar(E, pts); if (cual === 'valido' ? v.ok && K.solaresNuevos(E, pts) >= 4 : !v.ok) { const f = K.formas(E, pts); if (cual === 'valido') { const m = [0, 1, 2].map(() => 0); } mejores.push({ pts, a, b, s: K.solaresNuevos(E, pts) }); } }
    mejores.sort((p, q) => q.s - p.s); return mejores[0] || null; }, cual);
  const arrastra = async (A, B, onda) => { const t0 = Date.now(); await page.mouse.move(A.x, A.y); await page.mouse.down(); const N = 8; for (let i = 1; i <= N; i++) { const u = i / N; await page.mouse.move(A.x + (B.x - A.x) * u + Math.sin(u * 6.28) * onda, A.y + (B.y - A.y) * u); if (process.env.DEPURA) console.log('  mover', i, Date.now() - t0, 'ms'); } await page.mouse.up(); await page.waitForTimeout(600); };
  const medidas = () => page.evaluate(() => { const b = document.querySelector('.cl-barra'), r = b ? b.getBoundingClientRect() : null; const botones = [...document.querySelectorAll('.cl-barra button')].map(x => x.getBoundingClientRect());
    return { barra: r && { x: r.left, w: r.width, y: r.top, h: r.height }, minAlto: Math.min(...botones.map(q => q.height)), maxDer: Math.max(...botones.map(q => q.right), r ? r.right : 0), scroll: document.documentElement.scrollWidth, texto: b ? b.innerText.replace(/\n+/g, ' | ') : '' }; });
  const sano = async t => { const m = await medidas(); paso(m.minAlto >= 44 && m.maxDer <= 390 && m.scroll <= 390 && m.barra && m.barra.x >= 0, t + ': botones ≥44 px (' + Math.round(m.minAlto) + '), nada pasa de 390 (der ' + Math.round(m.maxDer) + ')'); return m; };

  const bueno = await buscar('valido'); paso(!!bueno && visible, 'hay un sitio libre a la vista para trazar' + (bueno ? ' (' + bueno.s + ' solares)' : ''));
  const v0 = await page.evaluate(() => { const E = Game.ciudadE(UI.city); return { vias: E.vias.length, parcelas: E.parcelas.filter(l => !l.fuera).length }; });
  await arrastra(bueno.a, bueno.b, 6);
  let m = await sano('paso 1'); paso(/Como la tracé/.test(m.texto) && /Recta/.test(m.texto) && /Cuadrícula/.test(m.texto) && /Hacer la calle/.test(m.texto) && /Borrar/.test(m.texto), 'el trazo muestra las tres formas, coste y botones: ' + m.texto.slice(0, 120));
  await foto('1-trazo');
  await page.click('.cl-barra button:has-text("Recta")'); await page.waitForTimeout(500);
  m = await sano('paso 2'); paso(/Calle de \d+ m/.test(m.texto), '«Recta»: ' + m.texto.slice(0, 100)); await foto('2-recta');
  /* trazo que no vale: cruza un edificio (el río queda fuera de la vista de arriba) */
  await page.click('.cl-barra button:has-text("Borrar")'); await page.waitForTimeout(300);
  const malo = await page.evaluate(() => { const E = Game.ciudadE(UI.city), c = UI.cityV; for (const e of E.edificios) { const a = c.aPantalla(e.x - 40, e.z, 0), b = c.aPantalla(e.x + 40, e.z, 0); if (a.ok && b.ok && a.y > 140 && a.y < 520 && a.x > 20 && b.x < 370) return { a, b, tipo: e.tipo }; } return null; });
  paso(!!malo, 'hay un edificio a la vista para el trazo que no vale'); if (malo) { await arrastra(malo.a, malo.b, 0); m = await sano('paso 3'); paso(/Choca|agua|Pasa|Cruza|ciudad/.test(m.texto) && /\.$/.test(m.texto.split(' | ')[m.texto.split(' | ').length - 3] || m.texto.split(' | ')[1] || '') || /Choca|agua|Pasa|Cruza|ciudad/.test(m.texto), 'el trazo malo dice por qué: ' + m.texto.slice(0, 130));
    paso(await page.evaluate(() => [...document.querySelectorAll('.cl-barra button')].find(b => /Hacer la calle/.test(b.textContent)).disabled), '«Hacer la calle» queda apagado'); await foto('3-no-vale'); }
  await page.click('.cl-barra button:has-text("Borrar")').catch(() => {}); await page.waitForTimeout(300);
  await arrastra(bueno.a, bueno.b, 6); await page.click('.cl-barra button:has-text("Recta")'); await page.waitForTimeout(300);
  await page.evaluate(() => { UI.cityV.opts.msDestello = 60000; });      // el destello dura lo que tarde la foto con el render por software
  await page.click('.cl-barra button:has-text("Hacer la calle")'); await page.waitForTimeout(100); await foto('4-hecha'); await page.waitForTimeout(2200);
  const v1 = await page.evaluate(() => { const E = Game.ciudadE(UI.city); return { vias: E.vias.length, parcelas: E.parcelas.filter(l => !l.fuera).length, trazadas: E.vias.filter(v => v.trazada).length, monedas: Math.round(E.monedas) }; });
  paso(v1.vias === v0.vias + 1 && v1.trazadas === 1 && v1.parcelas > v0.parcelas, 'la calle se hace: vías ' + v0.vias + '→' + v1.vias + ', solares ' + v0.parcelas + '→' + v1.parcelas + ', monedas ' + v1.monedas);
  m = await sano('paso 4'); paso(/Arrastra el dedo/.test(m.texto), 'la barra vuelve a «Arrastra el dedo»'); 
  await page.click('.cl-barra button:has-text("Que proponga el arquitecto")'); await page.waitForTimeout(800);
  m = await sano('paso 5'); paso(/Aceptar/.test(m.texto) && /Descartar/.test(m.texto) && m.texto.length > 60, 'el arquitecto propone: ' + m.texto.slice(0, 160)); await foto('5-arquitecto');
  const v2 = await page.evaluate(() => Game.ciudadE(UI.city).vias.length); paso(v2 === v1.vias, 'el arquitecto no traza solo');
  await page.click('.cl-barra button:has-text("Aceptar")'); await page.waitForTimeout(100); await foto('6-aceptada'); await page.waitForTimeout(2200);
  const v3 = await page.evaluate(() => { const E = Game.ciudadE(UI.city); return { vias: E.vias.length, parcelas: E.parcelas.filter(l => !l.fuera).length }; });
  paso(v3.vias === v1.vias + 1 && v3.parcelas > v1.parcelas, 'al aceptar nace la calle: vías ' + v3.vias + ', solares ' + v3.parcelas);
  await page.click('.cl-barra button:has-text("Que proponga el arquitecto")'); await page.waitForTimeout(500); await page.click('.cl-barra button:has-text("Descartar")'); await page.waitForTimeout(300);
  paso(await page.evaluate(() => Game.ciudadE(UI.city).vias.length) === v3.vias, 'descartar no cambia nada');
  await page.click('.cl-barra button:has-text("Salir")'); await page.waitForTimeout(500);
  paso(await page.evaluate(() => !UI.cityV.enCalles && !document.querySelector('.cl-barra')), '«Salir» deja el modo y quita la barra');
} catch (x) { paso(false, 'EXCEPCIÓN del guion: ' + x.message.slice(0, 300)); await foto('fallo').catch(() => {}); }
paso(errores.length === 0, 'sin errores de consola' + (errores.length ? ': ' + errores.slice(0, 3).join(' || ') : ''));
await br.close(); srv.close(); console.log(fallos.length ? '\n' + fallos.length + ' pasos MAL' : '\nTodo OK'); process.exit(fallos.length ? 1 : 0);
