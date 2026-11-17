// Maqueta GM43c «Testudo a pie»: deja las capturas en gobierno/capturas-tarea/ y falla si algo no cuadra o hay errores de consola.
// Uso:  node gobierno/maquetas/testudo-a-pie/captura.mjs            -> GM43c-v-* (390x844, como juega el usuario) y GM43c-h-* (844x390), dpr 2
//       node gobierno/maquetas/testudo-a-pie/captura.mjs dpr=1 prefijo=/ruta/p-   -> rápido, para iterar
//       node gobierno/maquetas/testudo-a-pie/captura.mjs --servir                 -> solo sirve la página (puerto 8381)
// Cada captura abre la maqueta con ?fase=… : la escena se coloca en ese momento y se congela.
// Además de las fotos comprueba con cifras: encuadre (tú a la izquierda, tu compañero a la derecha, el enemigo en la rendija),
// que la mano llega al asa del escudo, los gestos, una partida entera y que cada sonido suena sin saturar.
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.bin': 'application/octet-stream', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8381 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/testudo-concurso/a/';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }

const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'GM43d-a-'), errores = [];
const bien = (ok, texto) => { console.log((ok ? '  bien: ' : '  MAL: ') + texto); if (!ok) errores.push('PRUEBA: ' + texto); };
const entre = (v, a, b) => v >= a && v <= b;
function escucha(page) {
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|willReadFrequently/.test(m.text())) { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
}
const lista = page => page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000 });

async function foto(fase, nombre, w, h) {
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0 + (fase ? '?fase=' + fase : '')); await lista(page); await page.waitForTimeout(1500);
  const e = await page.evaluate(() => ({ ...window.__tp.estado(), cuadro: window.__tp.encuadre(), yo: window.__tp.medidas(2), detras: window.__tp.medidas(9) }));
  const cajas = await page.evaluate(() => [...document.querySelectorAll('.boton,.pildora,.gordo')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return { id: b.id, l: r.left, r: r.right, t: r.top, b: r.bottom, h: r.height }; }));
  bien(cajas.every(c => c.l >= 0 && c.r <= w && c.t >= 0 && c.b <= h && c.h >= 44), `${nombre}: los botones caben enteros y miden al menos 44 px (${cajas.map(c => c.id).join(', ')})`);
  bien(cajas.filter(c => c.id !== 'otra').every(c => c.t > h * 0.55 || c.b < h * 0.2), `${nombre}: ningún botón tapa el centro`);
  await page.screenshot({ path: prefijo + nombre + '.jpg', type: 'jpeg', quality: 84, timeout: 240000 });
  console.log(`${nombre}: k ${e.k.toFixed(2)}, ${e.vivos} en pie, fase ${e.fase}, tu cabeza en (${e.cuadro.yo.x}, ${e.cuadro.yo.y}), compañero en (${e.cuadro.comp.x}, ${e.cuadro.comp.y}), rendija de ${e.cuadro.techo.y} a ${e.cuadro.muro.y}, enemigo en (${e.cuadro.enemigo.x}, ${e.cuadro.enemigo.y})`);
  await ctx.close(); return e;
}
/* el encuadre «de Ryse»: tú a la izquierda, tu compañero a la derecha y, entre el canto del techo y el del muro, el enemigo */
function encuadre(e, nombre, vertical) {
  const c = e.cuadro;
  bien(entre(c.yo.x, 0.05, 0.42) && entre(c.yo.y, 0.25, 0.8), `${nombre}: tu soldado queda a la izquierda y dentro de cuadro`);
  bien(entre(c.comp.x, 0.58, 0.95), `${nombre}: tu compañero queda a la derecha`);
  bien(c.enemigo.delante && entre(c.enemigo.x, 0.3, 0.7) && c.enemigo.y > c.techo.y + 0.02 && c.enemigo.y < c.muro.y - 0.02, `${nombre}: el enemigo se ve por la rendija, entre el techo y el muro`);
  bien(c.techo.y < (vertical ? 0.3 : 0.36), `${nombre}: el techo ocupa menos de un tercio de la pantalla (${(c.techo.y * 100).toFixed(0)} %)`);
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  /* en el muro el brazo no da más de sí: la mano queda unos 11 cm detrás del asa, en la línea de la cámara (no se nota) */
  bien(d(e.yo.manoI, e.yo.escudo) < 0.13 && d(e.detras.manoI, e.detras.escudo) < 0.08, `${nombre}: la mano llega al asa del escudo (muro a ${(d(e.yo.manoI, e.yo.escudo) * 100).toFixed(0)} cm, techo a ${(d(e.detras.manoI, e.detras.escudo) * 100).toFixed(0)} cm)`);
  bien(entre(e.yo.cabeza[1], 1.45, 1.8) && e.detras.escudo[1] - e.yo.cabeza[1] > 0.25, `${nombre}: tu cabeza va agachada bajo el techo (a ${e.yo.cabeza[1].toFixed(2)} m; el techo, a ${e.detras.escudo[1].toFixed(2)} m)`);
}

const V = [390, 844], Hz = [844, 390];
let e = await foto('avance', 'v-1-marcha', ...V); bien(e.vivos === 30 && e.k === 0, 'marcha: los 30 en pie y sin testudo');
bien(Math.abs(e.yo.cabeza[1] - 1.88) < 0.12, `marcha: la cabeza está donde dicen las cuentas, a ${e.yo.cabeza[1].toFixed(2)} m del suelo (las figuras miden 2,15)`);
e = await foto('flechas', 'v-2-salva', ...V); bien(e.flechas > 20, 'salva: hay venablos en el aire (' + e.flechas + ')');
e = await foto('testudo', 'v-3-testudo', ...V); bien(e.k > 0.99 && e.vivos < 30, 'testudo: escudos arriba y ya hubo bajas de antes (' + e.vivos + ' en pie)'); encuadre(e, 'testudo vertical', true);
e = await foto('cara', 'v-4-golpe', ...V); bien(e.k > 0.99 && e.enc > 0.5 && e.clavados > 5, `golpe: cae la salva, tu soldado se encoge (${e.enc.toFixed(2)}) y hay venablos clavados en los escudos (${e.clavados})`);
e = await foto('mira', 'v-5-cara', ...V); bien(e.mira > 0.9 && entre(e.cuadro.yo.x, 0.2, 0.6), 'cara: tu soldado se vuelve a los suyos y la cámara se le arrima (cabeza en ' + e.cuadro.yo.x + ')');
e = await foto('roto', 'v-6-roto', ...V); bien(e.roto, 'roto: tu escudo ya está partido (' + e.golpes + ' golpes)');
e = await foto('pila', 'v-7-pila', ...V); bien(e.fase === 'lanzando', 'pila: los pila están en el aire');
e = await foto('carga', 'v-8-carga', ...V); bien(e.fase === 'carga' && e.enHombre === 0, 'carga: nadie lleva venablos clavados');
e = await foto('final', 'v-9-final', ...V); bien(e.fase === 'fin', 'final: sale la tarjeta');
await foto('avance', 'h-1-marcha', ...Hz);
e = await foto('testudo', 'h-3-testudo', ...Hz); encuadre(e, 'testudo horizontal', false);
e = await foto('mira', 'h-5-cara', ...Hz); bien(e.mira > 0.9, 'cara en horizontal: tu soldado vuelto');

/* partida entera en vertical, con los dedos: mantener «Avanzar», «Escudos» a cada aviso, lanzar y cargar. El reloj se adelanta a saltos. */
{
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0); await lista(page);
  const b = await page.locator('#avanzar').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  await page.waitForTimeout(2500); const e1 = await page.evaluate(() => ({ ...window.__tp.estado(), son: window.__tp.Son.listo() }));
  bien(e1.andando && e1.zF < 0, 'en vivo: mantener «Avanzar» pone el cuerpo en marcha (' + e1.zF.toFixed(1) + ' m con render por software)');
  bien(e1.son, 'en vivo: el sonido arranca con el primer toque');
  await page.tap('#escudos'); await page.waitForFunction('window.__tp.estado().k > 0.9', null, { timeout: 30000 }).catch(() => {}); const e2 = await page.evaluate(() => window.__tp.estado());
  bien(e2.k > 0.9, 'en vivo: «Escudos» forma el testudo');
  /* el resto, a saltos de reloj (el dedo sigue en «Avanzar»), jugando bien: escudos arriba con cada aviso y abajo cuando ya cayó la salva */
  const e3 = await page.evaluate(() => { const t = window.__tp, S = t.S; t.parar(true); for (let i = 0; i < 1500 && S.fase === 'avance'; i++) { S.escudos = S.aviso || S.impacto > 0; t.salta(0.1); } S.escudos = true; t.salta(1); return t.estado(); });
  bien(e3.fase === 'pila' && e3.vivos >= 25, `partida: llega a tiro de pilum con ${e3.vivos} de 30 subiendo los escudos a cada aviso (escudo propio: ${e3.golpes} golpes${e3.roto ? ', roto' : ''})`);
  await page.mouse.up(); await page.evaluate(() => window.__tp.parar(false)); await page.tap('#escudos'); await page.waitForTimeout(600); await page.tap('#accion');
  const e4 = await page.evaluate(() => { const t = window.__tp; t.parar(true); t.salta(3.4); t.parar(false); return t.estado(); });
  bien(e4.fase === 'cargar', 'partida: tras lanzar los pila toca cargar');
  await page.waitForTimeout(600); await page.tap('#accion');
  const e5 = await page.evaluate(() => { const t = window.__tp; t.parar(true); t.salta(9); t.parar(false); return t.estado(); });
  await page.waitForTimeout(800);
  bien(e5.fase === 'fin' && await page.locator('#fin').isVisible(), 'partida: carga, choque y tarjeta final');
  await ctx.close();
}
/* «Correr» mantenido diez segundos: corre, se queda sin aliento, sigue al paso y vuelve a correr; nunca se para ni va a tirones */
{
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }), page = await ctx.newPage(); escucha(page);
  await page.goto(URL0); await lista(page);
  const b = await page.locator('#correr').boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
  const r = await page.evaluate(() => { const t = window.__tp, S = t.S; t.parar(true); S.proxima = 999; let cambios = 0, antes = S.corriendo, parado = 0, corrio = 0; for (let i = 0; i < 300; i++) { t.salta(1 / 30); if (antes !== S.corriendo) cambios++; antes = S.corriendo; if (S.vel <= 0) parado++; if (S.corriendo) corrio++; } return { cambios, parado, corrio, zF: S.zF }; });
  await page.mouse.up();
  bien(r.corrio > 100 && r.parado === 0 && r.cambios <= 5, `correr: diez segundos con el botón pulsado, corre ${(r.corrio / 30).toFixed(1)} s, no se para nunca y cambia de correr a andar ${r.cambios} veces (avanza ${(-r.zF).toFixed(0)} m)`);
  await ctx.close();
}
/* cada sonido, tocado sin altavoz: tiene que oírse (pico por encima del viento) y no saturar */
{
  const page = await br.newPage(); escucha(page); await page.goto(URL0 + 'sonido.js');
  const r = await page.evaluate(async base => {
    const casos = { cuerno: S => S.cuerno(), salva: S => S.salva(2.2), madera: S => S.madera(1, 0), tierra: S => S.tierra(0), trueno: S => S.trueno(1), paso: S => S.paso(0.8, 1), escudos: S => S.clac(10), 'escudo roto': S => S.crac(), hierro: S => S.hierro(0), pila: S => S.lanza(), choque: S => S.choque() };
    const out = {}; let n = 0;
    for (const [k, f] of Object.entries(casos)) {
      const S = await import(base + 'sonido.js?n=' + (n++)), ctx = new OfflineAudioContext(2, 44100 * 3.2, 44100); S.inicia(ctx); f(S);
      const b = await ctx.startRendering(); let pico = 0; for (const c of [0, 1]) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) pico = Math.max(pico, Math.abs(d[i])); }
      out[k] = +pico.toFixed(2);
    }
    return out;
  }, URL0);
  bien(Object.values(r).every(v => v > 0.08 && v < 1), 'sonido: los once ruidos suenan por encima del viento y sin saturar (' + Object.entries(r).map(([k, v]) => k + ' ' + v).join(', ') + ')');
  await page.close();
}
await br.close(); srv.close();
if (errores.length) { console.log('\nNO APTO: ' + errores.length + ' errores\n' + errores.join('\n')); process.exit(1); }
console.log('\nAPTO: capturas en ' + SALIDA);
