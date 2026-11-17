// EV2 · juega «Gobernar Roma» un año entero en un móvil simulado (390×844) con toques y deja las capturas EV2-*.jpg.
// Uso: node gobierno/maquetas/politica-grande/captura.mjs [dpr=1 prefijo=/ruta/p-] [--servir]
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8380 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/politica-grande/?semilla=1';
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch();
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = op.prefijo || join(SALIDA, 'EV2-'), errores = [];
const bien = (ok, t) => { console.log((ok ? '  bien: ' : '  MAL: ') + t); if (!ok) errores.push('PRUEBA: ' + t); };
async function juego() {
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
  page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
  const J = {
    page, ev: () => page.evaluate(() => window.__ev2.estado()), lugar: () => page.evaluate(() => window.__ev2.lugar()),
    espera: ms => page.waitForTimeout(ms),
    toca: async sel => { await page.tap(sel); await page.waitForTimeout(350); },
    foto: async (n, ms = 500) => { await page.waitForTimeout(ms); await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 85 }); console.log('  captura ' + n); },
    ir: async l => { await J.toca(`[data-a="lugar"][data-x="${l}"]`); },
    texto: async s => (await page.textContent(s)) || '',
    revisa: async t => {
      const r = await page.evaluate(() => {
        const b = document.querySelector('#principal'), q = b && b.getBoundingClientRect(); let fuera = 0;
        for (const el of document.querySelectorAll('#app *')) { const r = el.getBoundingClientRect(); if (r.width && (r.right > 390.5 || r.left < -0.5) && !el.closest('svg')) fuera++; }
        return { ancho: document.documentElement.scrollWidth, fuera, vis: !!q && q.top >= 0 && q.bottom <= innerHeight && q.width > 0, alto: q ? q.height : 0 };
      });
      bien(r.ancho <= 390 && r.fuera === 0, t + ': nada se sale de 390 (ancho ' + r.ancho + ', fuera ' + r.fuera + ')'); bien(r.vis && r.alto >= 44, t + ': botón principal visible de ' + Math.round(r.alto) + ' px');
    },
    cierra: async () => { await J.toca('#principal'); await J.espera(300); },
  };
  await page.goto(URL0); await page.waitForFunction('window.__ev2 && window.__ev2.lista === true');
  return J;
}
/* partida 1: un año entero con el dedo */
console.log('Partida 1 · un año con el dedo');
{ const J = await juego(), { page } = J;
  bien(await J.lugar() === 'casa', 'se empieza en Casa');
  await J.revisa('Casa (primavera)'); await J.foto('01-casa', 700);
  await J.ir('foro'); await J.revisa('Foro'); await J.foto('02-foro');
  await J.toca('[data-a="ficha"][data-x="consul"]'); await J.foto('03-magistrado');
  await J.toca('[data-a="orden"][data-y="refuerza"]'); bien((await J.ev()).ordenes.consul === 'refuerza', 'la orden del cónsul cambia con un toque');
  await J.toca('[data-a="cands"][data-x="consul"]'); await J.foto('04-candidatos');
  await J.toca('#capa [data-a="ficha"][data-x="consul"]'); await J.toca('#capa [data-a="volver"]');
  await J.ir('curia'); await J.revisa('Curia'); await J.foto('05-curia');
  await J.toca('[data-a="trato"][data-x="mil"]'); await J.toca('[data-a="trato"][data-x="ter"]'); await J.foto('06-tratos');
  await J.toca('#principal'); bien(/terratenientes/.test(await J.texto('#principal')), 'el recuento empieza por los terratenientes y espera el toque');
  await J.toca('#principal'); await J.foto('07-recuento', 300);
  await J.toca('#principal'); await J.toca('#principal');
  let e = await J.ev(); if (e.marcas.pendiente) { await J.toca('[data-a="elegir"][data-x="pueblo"]'); e = await J.ev(); }
  bien(e.marcas.hecho0 === true && e.marcas.cruza === true, 'el voto de primavera queda hecho');
  await J.revisa('Curia (resultado)'); await J.cierra();
  await J.foto('08-paso-estacion', 300); bien(/Verano/.test(await J.texto('#capa')), 'pantalla de paso: Verano'); await J.revisa('Paso de estación'); await J.toca('#principal');
  bien((await J.ev()).estacion === 1, 'estamos en verano'); await J.foto('09-partes', 300);
  await J.toca('[data-a="ajuste"][data-x="todo"]'); await J.revisa('Casa (verano)');
  bien(/consulta|pregunta/i.test(await J.texto('#cuerpo')), 'con «Todo» te consultan'); await page.evaluate(() => document.getElementById('consultas').scrollIntoView()); await J.foto('10-consultas', 300);
  bien(/Falta/.test(await J.texto('#principal')), 'el botón dice qué falta');
  /* verano: nombrar un edil que cuesta oro */
  await J.ir('foro'); const oro0 = (await J.ev()).oro; await J.toca('[data-a="ficha"][data-x="edil"]'); await J.toca('[data-a="cands"][data-x="edil"]'); await J.toca('#capa [data-a="nombrar"][data-y="junio"]');
  bien((await J.ev()).cargos.edil === 'junio' && (await J.ev()).oro < oro0, 'nombrar a un edil cuesta oro'); await J.toca('#capa [data-a="volver"]');
  await J.ir('curia'); await J.toca('[data-a="opc"][data-x="sitio"]'); await J.toca('#principal');
  for (let i = 0; i < 3; i++) await J.toca('#principal');
  await J.ir('casa');
  while (/Falta/.test(await J.texto('#principal'))) { await J.toca('[data-a="decidir"]:not([disabled])'); }
  await J.cierra(); await J.toca('#principal');
  /* otoño */
  await J.ir('curia'); await J.toca('#principal'); for (let i = 0; i < 3; i++) await J.toca('#principal');
  await J.ir('casa'); while (/Falta/.test(await J.texto('#principal'))) { await J.toca('[data-a="decidir"]:not([disabled])'); }
  await J.cierra(); await J.toca('#principal');
  e = await J.ev(); bien(e.cerrado === true, 'el año llega al cierre'); bien(await J.lugar() === 'casa', 'el cierre se ve en Casa');
  await J.revisa('Casa (cierre)');
  await J.toca('[data-a="ciudad"]'); await J.foto('11-ciudad-grande'); await J.toca('#capa [data-a="volver"]');
  await page.evaluate(() => { document.getElementById('cuerpo').scrollTop = 0; const t = [...document.querySelectorAll('.tit')].find(x => /hilo/i.test(x.textContent)); t.scrollIntoView(); }); await J.foto('12-cierre', 300);
  bien(/Gobernar otro año/.test(await J.texto('#principal')), 'botón «Gobernar otro año»');
  await J.toca('#principal'); e = await J.ev(); bien(e.estacion === 0 && !e.cerrado && e.oro === 200, '«Gobernar otro año» empieza de cero');
  await page.reload(); await page.waitForFunction('window.__ev2 && window.__ev2.lista'); bien((await J.ev()).estacion === 0, 'la partida se retoma al recargar');
}
/* partida 2: ajuste «Nada», sin votar */
console.log('Partida 2 · ajuste Nada');
{ const J = await juego(); await J.toca('[data-a="ajuste"][data-x="nada"]');
  await J.ir('curia'); bien(/llevará este asunto por ti/.test(await J.texto('#cuerpo')), 'cartel del cónsul'); bien(/Votar yo/.test(await J.texto('#pie')), 'botón «Votar yo»'); await J.revisa('Curia (Nada)');
  await J.ir('casa');
  for (let i = 0; i < 3; i++) { await J.cierra(); await J.toca('#principal'); }
  const e = await J.ev(); bien(e.cerrado === true && e.despachos.length === 20, 'con «Nada» el año llega al cierre sin votar'); await J.revisa('Casa (cierre, Nada)');
}
await br.close(); srv.close();
const malos = errores.length;
console.log(malos ? '\nNO APTO · ' + malos + ' fallos' : '\nAPTO'); process.exit(malos ? 1 : 0);
