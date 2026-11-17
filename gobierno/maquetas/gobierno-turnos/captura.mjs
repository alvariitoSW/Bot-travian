// EV7 · juega «Gobierno por turnos» con toques en un móvil simulado (390×844, dpr 2) y deja las capturas EV7-*.jpg
// en gobierno/capturas-tarea/. Falla si hay errores de consola o algo se sale de 390.
// Uso: node gobierno/maquetas/gobierno-turnos/captura.mjs [semilla=3] [dpr=2] [--servir]
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const args = process.argv.slice(2), op = Object.fromEntries(args.filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const srv = await new Promise(ok => { const s = createServer(async (req, res) => { try { let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, ''); if (r === '' || r.endsWith('/')) r += 'index.html'; if (r.startsWith('..')) throw new Error('fuera'); const d = await readFile(join(RAIZ, r)); res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream' }); res.end(d); } catch (e) { res.writeHead(404); res.end(); } }); s.listen(args.includes('--servir') ? 8381 : 0, '127.0.0.1', () => ok(s)); });
const URL0 = 'http://127.0.0.1:' + srv.address().port + '/gobierno/maquetas/gobierno-turnos/?semilla=' + (op.semilla || 3);
if (args.includes('--servir')) { console.log('Sirviendo en ' + URL0); await new Promise(() => {}); }
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch();
await mkdir(SALIDA, { recursive: true });
const dpr = +(op.dpr || 2), prefijo = join(SALIDA, 'EV7-'), errores = [];
const bien = (ok, t) => { console.log((ok ? '  bien: ' : '  MAL: ') + t); if (!ok) errores.push('PRUEBA: ' + t); };

const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') { errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300)); } });
page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
const ev = () => page.evaluate(() => window.__ev7.estado());
const espera = ms => page.waitForTimeout(ms);
const toca = async sel => { await page.tap(sel); await espera(250); };
const foto = async (n, ms = 400) => { await espera(ms); await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 85 }); console.log('  captura ' + n); };
const revisa = async (t, pg = page, W = 390) => {
  const r = await pg.evaluate(W => {
    let fuera = 0, letra = 99, chico = 0; const malos = [];
    for (const el of document.querySelectorAll('#app *')) {
      if (el.closest('svg')) continue; const q = el.getBoundingClientRect(); if (!q.width) continue;
      if (q.right > W + .5 || q.left < -0.5) { fuera++; malos.push(el.tagName + '.' + el.className); }
      if (el.childNodes.length && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) letra = Math.min(letra, parseFloat(getComputedStyle(el).fontSize));
      if (el.tagName === 'BUTTON' && !el.hidden && q.height < 44) chico++;
    }
    const b = document.querySelector('#principal').getBoundingClientRect();
    return { ancho: document.documentElement.scrollWidth, fuera, malos: malos.slice(0, 3), letra, chico, abajo: b.bottom <= innerHeight && b.height >= 44 };
  }, W);
  bien(r.ancho <= W && r.fuera === 0, `${t}: nada se sale de ${W} (ancho ${r.ancho}, fuera ${r.fuera} ${r.malos.join(' ')})`);
  bien(r.letra >= 13, `${t}: letra mínima ${r.letra} px`); bien(r.chico === 0, `${t}: botones de 44 px o más (${r.chico} más pequeños)`); bien(r.abajo, `${t}: el botón principal se ve abajo`);
};

/* elige la ley con cabeza (lo que se lee en las cartas y en el mando) y compra los votos con toques */
async function votarConCabeza() {
  const plan = await page.evaluate(() => {
    const R = window.__ev7.R, e = window.__ev7.estado();
    const falta = R.amenazaFinal(e) - R.fuerza(e) - e.ordenes.filter(o => o.ley.tipo === 'reclutar').length * R.fuerzaLegion(e);
    const cola = (t, o) => e.ordenes.filter(x => x.ley.tipo === t && (o == null || x.ley.obj === o)).length;
    const valor = l => {
      if (l.tipo === 'edad') return 100;
      if (l.tipo === 'reclutar') return falta > 0 ? 40 + falta / 2 - (e.grano < 30 ? 25 : 0) : 5;
      if (l.tipo === 'ampliar') return e.edad < 2 && R.EDADES[2].edif[l.obj] > e.edif[l.obj] + cola('ampliar', l.obj) ? 60 : l.obj === 'muralla' && falta > 0 ? 35 : l.obj === 'granja' && e.grano < 60 ? 45 : 15;
      if (l.tipo === 'estudiar') return e.edad < 2 && e.saberes.length + cola('estudiar') < 2 ? 58 : l.obj === 'corvus' && falta > 0 ? 50 : 20;
      if (l.tipo === 'impuestos') return e.oro < 60 ? 50 : 5;
      return e.favor < 25 ? 70 : e.plebe < 40 ? 54 - e.plebe / 4 : 3;
    };
    let mejor = 0; e.cartas.forEach((c, i) => { if (valor(c) > valor(e.cartas[mejor]) && !R.prevision(e, i).veto) mejor = i; });
    return mejor;
  });
  await toca(`[data-a="ley"][data-x="${plan}"]`);
  for (let n = 0; n < 3; n++) {
    const quiere = await page.evaluate(() => {
      const R = window.__ev7.R, e = window.__ev7.estado(), pv = R.prevision(e); if (pv.esperado >= 21) return null;
      const g = R.gustoLey(e.cartas[e.sel]);
      const b = R.BS.filter(x => !e.tratos[x] && pv.bandos[x].seguros < e.escanos[x]).sort((a, c) => (pv.bandos[c].dudosos + pv.bandos[c].contra) - (pv.bandos[a].dudosos + pv.bandos[a].contra))[0];
      if (!b) return null; const libre = !e.promesas.some(p => p.bando === b);
      return { b, t: g[b] > 0.15 && libre ? 'promesa' : e.oro - R.costeTrato(e, b) > 50 ? 'oro' : libre && e.favor > 35 ? 'promesa' : null };
    });
    if (!quiere || !quiere.t) break;
    for (let k = 0; k < 3 && (await ev()).tratos[quiere.b] !== quiere.t; k++) await toca(`[data-a="trato"][data-x="${quiere.b}"]`);
  }
}

await page.goto(URL0); await page.waitForFunction('window.__ev7 && window.__ev7.lista === true');
bien(await page.evaluate(() => window.__ev7.portada()), 'se abre la portada');
await foto('00-portada', 300);
await toca('#portada [data-a="nueva"]');
bien(await page.evaluate(() => window.__ev7.lugar()) === 'ciudad' && !(await page.evaluate(() => window.__ev7.portada())), '«Nueva partida» lleva a la Ciudad');
await revisa('Ciudad al empezar'); await foto('01-ciudad-inicio', 600);
const inicial = await ev();
let turnos = 0, destello = null;
for (let t = 0; t < 12; t++) {
  let e = await ev(); if (e.fase === 'fin') break;
  await toca('#principal'); // «Ir al Senado a votar»
  bien(await page.evaluate(() => window.__ev7.lugar()) === 'senado', `estación ${t + 1}: el botón lleva al Senado`);
  await votarConCabeza();
  if (t === 0) { await revisa('Senado antes de votar'); await foto('02-senado', 300); }
  await toca('#principal'); // «Llamar a votar»
  if (t === 0) { await foto('03-recuento-a-mitad', 1900); }
  await page.evaluate(() => window.__ev7.saltar());
  await espera(200);
  if (t === 0) { await revisa('Recuento'); await foto('04-recuento-final', 200); }
  await toca('#capa [data-a="al-mando"]');
  if (t === 0 || t === 4) { await revisa('Mando'); await foto(t === 0 ? '05-mando' : '05b-mando-estacion5', 300); }
  if (t === 4) { const L = await page.$('[data-a="leva"]'); bien(!!L, 'Mando: se ve el botón de leva pagada'); if (L && await L.isEnabled()) { const n = (await ev()).ordenes.length; await toca('[data-a="leva"]'); bien((await ev()).ordenes.length === n + 1, 'la leva pagada entra en la cola de mando'); } }
  await toca('#principal'); // «Terminar la estación»
  if (t === 0) { await revisa('Paso de estación'); await foto('06-paso-estacion', 300); }
  e = await ev(); turnos++;
  if (e.fase === 'fin') { await toca('#capa [data-a="veredicto"]'); break; }
  await toca('#capa [data-a="a-ciudad"]');
  const focos = await page.evaluate(() => window.__ev7.focos());
  if (focos.length && !destello) { destello = focos[0].nombre; await foto('06b-destello-obra-nueva', 1400); await revisa('Destello de obra nueva'); }
  if (t === 2) { await revisa('Ciudad en invierno'); await foto('07-ciudad-invierno', focos.length ? 6500 : 800); }
  if (t === 4) { await foto('07b-ciudad-verano', focos.length ? 6500 : 800); }
  if (t === 10) { await revisa('Ciudad en la estación 12'); await foto('08-ciudad-final', focos.length ? 6500 : 800); }
}
const fin = await ev();
bien(turnos >= 10, `se juegan ${turnos} estaciones con toques`);
bien(fin.fase === 'fin' && !!fin.fin, 'la partida acaba con veredicto: ' + (fin.fin && fin.fin.titulo));
bien(fin.edif.mercado + fin.edif.muelle + fin.saberes.length + fin.legiones > inicial.edif.mercado + inicial.edif.muelle + inicial.saberes.length + inicial.legiones, 'la ciudad ha crecido (obras, saberes o legiones)');
bien(!!destello, 'se ve el destello de una obra nueva con su nombre: ' + destello);
await revisa('Veredicto'); await foto('09-veredicto', 400);
/* al recargar con la partida terminada se ve el veredicto, no otra partida en silencio */
await page.reload(); await page.waitForFunction('window.__ev7 && window.__ev7.lista === true');
bien(await page.evaluate(() => !!document.querySelector('#capa:not([hidden]) .veredicto') && !window.__ev7.portada() && window.__ev7.estado().fase === 'fin'), 'al recargar se ve el veredicto de la partida terminada');
await toca('#capa [data-a="cerrar"]'); await foto('10-ciudad-al-final', 800);
/* jugar otra vez: otra semilla */
await toca('#principal'); await toca('#capa [data-a="otra"]');
const nueva = await ev(); bien(nueva.turno === 0 && nueva.semilla !== fin.semilla, '«Jugar otra vez» empieza otra partida con otra semilla');
await ctx.close();
/* vista tumbada: 844×390, dibujo a la izquierda y controles a la derecha */
{
  const c2 = await br.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true }), p2 = await c2.newPage();
  p2.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errores.push('tumbada: ' + m.text().slice(0, 300)); });
  p2.on('pageerror', e => errores.push('tumbada: ' + e.message));
  await p2.goto(URL0); await p2.waitForFunction('window.__ev7 && window.__ev7.lista === true');
  await p2.screenshot({ path: prefijo + 'T0-tumbada-portada.jpg', type: 'jpeg', quality: 85 });
  await p2.tap('#portada [data-a="nueva"]'); await p2.waitForTimeout(600);
  await revisa('Tumbada: Ciudad', p2, 844); await p2.screenshot({ path: prefijo + 'T1-tumbada-ciudad.jpg', type: 'jpeg', quality: 85 });
  await p2.tap('#principal'); await p2.waitForTimeout(250); await p2.tap('[data-a="ley"][data-x="0"]'); await p2.waitForTimeout(300);
  const lado = await p2.evaluate(() => { const h = document.querySelector('.hemi').getBoundingClientRect(), c = document.querySelector('.cartas').getBoundingClientRect(); return h.right <= c.left + 2; });
  bien(lado, 'Tumbada: el hemiciclo a la izquierda y las cartas a la derecha');
  await revisa('Tumbada: Senado', p2, 844); await p2.screenshot({ path: prefijo + 'T2-tumbada-senado.jpg', type: 'jpeg', quality: 85 });
  await p2.tap('#principal'); await p2.waitForTimeout(1900); await p2.screenshot({ path: prefijo + 'T3-tumbada-recuento.jpg', type: 'jpeg', quality: 85 });
  console.log('  capturas tumbadas T0-T3');
  await c2.close();
}
await br.close(); srv.close();
console.log(errores.length ? `\nNO APTO (${errores.length}):\n` + errores.join('\n') : '\nAPTO');
process.exit(errores.length ? 1 : 0);
