#!/usr/bin/env node
/* AQVILA — jueces: un solo comando que dice si el juego funciona.
   Uso:  node gobierno/jueces.mjs            (todo)
         node gobierno/jueces.mjs --rapido   (solo la lógica, sin navegador)
   Pasa test/sim.test.js, recorre el juego en un navegador a 390×844 y deja las capturas
   y un informe en gobierno/capturas/. Sale con código 1 si algo falla. */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CAPS = join(RAIZ, 'gobierno', 'capturas');
const RAPIDO = process.argv.includes('--rapido');
const pasos = [];                       // { nombre, ok, detalle, captura }
const errores = [];                     // errores de consola del navegador
const t0 = Date.now();

function apunta(nombre, ok, detalle, captura) {
  pasos.push({ nombre, ok: !!ok, detalle: detalle || '', captura: captura || null });
  console.log((ok ? '  ✔ ' : '  ✘ ') + nombre + (detalle ? ' — ' + detalle : ''));
}

/* ---------- 1. Lógica ---------- */
console.log('Juez 1 · lógica (test/sim.test.js)');
{
  const r = spawnSync(process.execPath, ['test/sim.test.js'], { cwd: RAIZ, encoding: 'utf8', timeout: 300000 });
  const ultima = ((r.status === 0 ? r.stdout : r.stderr || r.stdout) || '').trim().split('\n').filter(Boolean).slice(r.status === 0 ? -1 : -6).join(' | ');
  apunta('Pruebas de lógica', r.status === 0, ultima.slice(0, 400));
}

/* ---------- 1b. Fichas (registro de piezas) ---------- */
console.log('Juez 1b · fichas (gobierno/fichas.mjs)');
{
  const r = spawnSync(process.execPath, ['gobierno/fichas.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
  const lineas = (r.stdout || '').trim().split('\n').filter(Boolean);
  apunta('Fichas de las piezas', r.status === 0, (r.status === 0 ? lineas.filter(l => /^Resumen/.test(l)).join('') : lineas.filter(l => /✘ /.test(l) && !/^  ✘ (edificio|tropa|ciudad|hecho|faccion|mejora) /.test(l)).slice(0, 3).join(' | ')).slice(0, 400));
}

/* ---------- 2. Navegador ---------- */
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8' };
function servidor() {
  return new Promise(ok => {
    const s = createServer(async (req, res) => {
      try {
        let ruta = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
        if (ruta === '' || ruta.endsWith('/')) ruta += 'index.html';
        if (ruta.startsWith('..')) throw new Error('fuera');
        const datos = await readFile(join(RAIZ, ruta));
        res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(datos);
      } catch (e) { res.writeHead(404); res.end('no encontrado'); }
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

async function navegador() {
  console.log('Juez 2 · recorrido en navegador (390×844)');
  let chromium;
  try { chromium = createRequire(import.meta.url)('playwright').chromium; }
  catch (e) { apunta('Abrir el navegador', false, 'Playwright no está instalado: ' + e.message.split('\n')[0]); return; }
  await rm(CAPS, { recursive: true, force: true }); await mkdir(CAPS, { recursive: true });
  const srv = await servidor(), url = 'http://127.0.0.1:' + srv.address().port + '/';
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  let sinRed = false;
  page.on('console', m => { if (m.type() === 'error' && !(sinRed && /ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(m.text()))) errores.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 300)));

  let n = 0;
  const foto = async nombre => { const f = String(++n).padStart(2, '0') + '-' + nombre + '.jpg'; await page.screenshot({ path: join(CAPS, f), type: 'jpeg', quality: 72 }); return f; };
  const espera = ms => page.waitForTimeout(ms);
  const estado = fn => page.evaluate(fn);
  // cierra los avisos históricos que tapen la pantalla (no los de batalla)
  const cierraAvisos = async () => { for (let i = 0; i < 12; i++) { const b = page.locator('#modal:not([hidden]) [data-act="close"]').first(); if (!(await b.count())) break; await b.click(); await espera(120); } };
  const paso = async (nombre, fn) => {
    try { const r = await fn(); apunta(nombre, r.ok, r.detalle, r.captura); return r.ok; }
    catch (e) { let c = null; try { c = await foto('fallo'); } catch (x) { } apunta(nombre, false, String(e.message).split('\n')[0].slice(0, 300), c); return false; }
  };

  try {
    await paso('El juego carga y aparecen los modelos', async () => {
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
      const t = Date.now();
      const modelos = await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 90000 }).then(() => true, () => false);
      await espera(1500);
      return { ok: modelos, detalle: modelos ? 'modelos listos en ' + ((Date.now() - t) / 1000).toFixed(0) + ' s' : 'los modelos 3D no llegaron a cargar en 90 s', captura: await foto('menu') };
    });

    await paso('Nueva partida: se ve el mapa', async () => {
      await page.click('#menu [data-act="new"]'); await espera(2500); await cierraAvisos();
      const ok = await estado(() => !!Game.state && !UI.menu && Game.myCities().includes('roma'));
      return { ok, detalle: ok ? await estado(() => Game.dateStr(Game.state.t)) : 'no hay partida', captura: await foto('mapa') };
    });

    await paso('Ciudad en 3D', async () => {
      await page.click('#tabs [data-v="city"]'); await espera(3000);
      const ok = await estado(() => !document.getElementById('citywrap').hidden && !!document.querySelector('#citywrap canvas'));
      return { ok, detalle: ok ? '' : 'no aparece la vista 3D de la ciudad', captura: await foto('ciudad') };
    });

    await paso('Construir un edificio', async () => {
      await page.click('#ctop [data-act="clist"]'); await espera(400);
      const b = page.locator('#view [data-act="up"]:not(.no)').first(); await b.scrollIntoViewIfNeeded(); await b.click(); await espera(500);
      const q = await estado(() => { const c = Game.state.cities.roma.queue; return c ? DATA.BUILD[c.b].n : ''; });
      const captura = await foto('construir');
      await page.evaluate(() => { document.getElementById('view').scrollTop = 0; }); await page.click('#view [data-act="clist"]'); await espera(300);
      return { ok: !!q, detalle: q ? 'en obras: ' + q : 'la obra no entró en la cola', captura };
    });

    await paso('Reclutar tropas', async () => {
      await page.click('#tabs [data-v="army"]'); await espera(500);
      const b = page.locator('#view [data-act="train"]:not(.no)').first(); await b.scrollIntoViewIfNeeded(); await b.click(); await espera(500);
      const q = await estado(() => Game.state.cities.roma.train.map(t => t.n + ' ' + DATA.UNITS[t.u].n).join(', '));
      return { ok: !!q, detalle: q ? 'en instrucción: ' + q : 'no se reclutó nada', captura: await foto('reclutar') };
    });

    await paso('Abrir el Códice', async () => {
      await page.click('#tabs [data-v="log"]'); await espera(500);
      await page.click('#view [data-act="codice"]'); await espera(500);
      const r = await page.evaluate(() => ({ n: document.querySelectorAll('#view .cdx').length, h: document.querySelectorAll('#view .lic-h').length, w: document.documentElement.scrollWidth }));
      const ok = r.n >= 15 && r.h > 0;
      const captura = await foto('codice');
      await page.click('#view [data-act="codice"][data-v=""]'); await espera(300);
      return { ok, detalle: r.n + ' fichas, ' + r.h + ' históricas', captura };
    });

    let objetivo = '';
    await paso('Atacar una ciudad vecina', async () => {
      objetivo = await estado(() => Game.neighbors('roma').filter(n => Game.state.cities[n].owner !== 'roma' && !Game.edge('roma', n)[2]).sort((a, b) => Game.power(Game.state.cities[a].units) - Game.power(Game.state.cities[b].units))[0] || '');
      if (!objetivo) return { ok: false, detalle: 'Roma no tiene vecina enemiga por tierra' };
      await page.evaluate(id => { UI.sel = id; UI.sheetKey = ''; }, objetivo);
      await page.click('#tabs [data-v="map"]'); await espera(600);
      await page.click('#sheet [data-act="pick"]'); await espera(500);
      const captura = await foto('atacar');
      await page.click('#mbox [data-act="send"]'); await espera(400);
      const ok = await estado(() => Game.state.marches.some(m => m.owner === 'roma'));
      return { ok, detalle: ok ? 'el ejército marcha hacia ' + await page.evaluate(id => DATA.CITIES[id].n, objetivo) : 'el ejército no salió', captura };
    });

    await paso('Llega la batalla', async () => {
      // se adelanta el reloj del juego en vez de esperar meses de campaña
      for (let i = 0; i < 400; i++) {
        const hay = await estado(() => { for (let k = 0; k < 20 && !Game.state.pending.length && !Game.state.over; k++) Game.tick(0.25); return Game.state.pending.length > 0; });
        await cierraAvisos(); if (hay) break;
      }
      await page.waitForSelector('#mbox [data-act="bview"]', { timeout: 15000 });
      return { ok: true, detalle: await estado(() => document.querySelector('#mbox h2').textContent), captura: await foto('aviso-batalla') };
    });

    await paso('Dirigir la batalla en 3D (horizontal)', async () => {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.click('#mbox [data-act="bview"]'); await espera(7000);
      const en3d = await estado(() => !!UI.battle && !UI.battle.flat && !!document.querySelector('#bfield canvas'));
      const hayDespliegue = await page.locator('#bctl [data-act="bstart"]').count();
      if (!hayDespliegue) return { ok: false, detalle: 'no aparece el botón «Empezar batalla» del despliegue' };
      await page.click('#bctl [data-act="bform"][data-v="ancha"]'); await espera(1500);
      const capDespliegue = await foto('despliegue');
      await page.click('#bctl [data-act="bstart"]'); await espera(500);
      const carta = page.locator('#bcards > *').first();
      if (await carta.count()) { await carta.click(); await espera(300); await page.mouse.click(520, 150); await espera(2500); }
      const captura = await foto('batalla');
      const vivos = await estado(() => UI.battle ? UI.battle.b.men(0) + ' contra ' + UI.battle.b.men(1) : '');
      return { ok: en3d, detalle: en3d ? vivos : 'la batalla no se ve en 3D (vista de reserva)', captura };
    });

    await paso('La batalla termina y se aplica el resultado', async () => {
      await page.click('#bctl [data-act="bskip"]');
      await page.waitForSelector('#mbox [data-act="bdone"]', { timeout: 20000 });
      const titulo = await estado(() => document.querySelector('#mbox h2').textContent);
      const captura = await foto('resultado');
      await page.click('#mbox [data-act="bdone"]'); await espera(500);
      await page.setViewportSize({ width: 390, height: 844 }); await espera(800); await cierraAvisos();
      const ok = await estado(() => !UI.battle && Game.state.stats.battles >= 1);
      return { ok, detalle: titulo, captura };
    });

    await paso('Recargar sin red: la partida sigue', async () => {
      await page.evaluate(() => Game.save());
      const sw = await page.evaluate(() => 'serviceWorker' in navigator ? Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise(r => setTimeout(() => r(false), 15000))]) : false);
      if (!sw) return { ok: false, detalle: 'el service worker no se activó' };
      await page.reload({ waitUntil: 'load' }); await espera(12000);       // segunda carga: llena la caché
      sinRed = true; await ctx.setOffline(true);
      await page.reload({ waitUntil: 'load' });
      await page.waitForSelector('#menu [data-act="continue"]', { timeout: 30000 });
      await page.click('#menu [data-act="continue"]'); await espera(1500); await cierraAvisos();
      const modelos = await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 60000 }).then(() => true, () => false);
      await espera(2500);
      const ok = await estado(() => !!Game.state && Game.state.stats.battles >= 1 && !UI.menu);
      return { ok: ok && modelos, detalle: !ok ? 'la partida guardada no se recuperó' : modelos ? 'partida y modelos disponibles sin conexión' : 'la partida vuelve, pero los modelos 3D no cargan sin red', captura: await foto('sin-red') };
    });
  } finally {
    await br.close().catch(() => { }); srv.close();
  }
  apunta('Sin errores de consola', errores.length === 0, errores.length ? errores.length + ' error(es): ' + errores.slice(0, 3).join(' ‖ ') : '');
}

if (!RAPIDO) await navegador();

const fallos = pasos.filter(p => !p.ok);
const informe = { fecha: new Date().toISOString(), segundos: Math.round((Date.now() - t0) / 1000), ok: fallos.length === 0, rapido: RAPIDO, pasos, errores };
if (!RAPIDO) await writeFile(join(CAPS, 'informe.json'), JSON.stringify(informe, null, 1));
console.log('\n' + (informe.ok ? 'VEREDICTO: APTO' : 'VEREDICTO: NO APTO (' + fallos.length + ' fallo' + (fallos.length > 1 ? 's' : '') + ')') + ' · ' + pasos.length + ' comprobaciones · ' + informe.segundos + ' s' + (RAPIDO ? '' : ' · capturas en gobierno/capturas/'));
process.exit(informe.ok ? 0 : 1);
