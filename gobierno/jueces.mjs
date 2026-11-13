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
  const r = spawnSync(process.execPath, ['test/sim.test.js'], { cwd: RAIZ, encoding: 'utf8', timeout: 900000 });
  const ultima = ((r.status === 0 ? r.stdout : r.stderr || r.stdout) || '').trim().split('\n').filter(Boolean).slice(r.status === 0 ? -1 : -6).join(' | ');
  apunta('Pruebas de lógica', r.status === 0, ultima.slice(0, 400));
}

/* ---------- 1R. Pausas del reloj (R3, sin pantalla) ---------- */
console.log('Juez 1R · pausas del reloj (test/pausas.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/pausas.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 120000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l)), mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Pausas del reloj con motivo', r.status === 0, r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | ')).slice(0, 400));
}

/* ---------- 1a. Ciudad nueva (reglas sin pantalla) ---------- */
console.log('Juez 1a · ciudad nueva (test/ciudad.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/ciudad.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 120000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l));
  const mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Reglas de la ciudad nueva', r.status === 0, (r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | '))).slice(0, 400));
}

/* ---------- 1b. Fichas (registro de piezas) ---------- */
console.log('Juez 1b · fichas (gobierno/fichas.mjs)');
{
  const r = spawnSync(process.execPath, ['gobierno/fichas.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
  const lineas = (r.stdout || '').trim().split('\n').filter(Boolean);
  apunta('Fichas de las piezas', r.status === 0, (r.status === 0 ? lineas.filter(l => /^Resumen/.test(l)).join('') : lineas.filter(l => /✘ /.test(l) && !/^  ✘ (edificio|tropa|ciudad|hecho|faccion|mejora) /.test(l)).slice(0, 3).join(' | ')).slice(0, 400));
}

/* ---------- 1c. Alturas del mapa (C2b) ---------- */
console.log('Juez 1c · alturas del mapa (test/mapa.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/mapa.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
  apunta('Alturas reales del mapa', r.status === 0, ((r.stdout || '').trim().split('\n').slice(-2).join(' | ') || (r.stderr || '').trim().split('\n').slice(-2).join(' | ')).slice(0, 400));
}

/* ---------- 1c. Saber (I5: investigación y edades, reglas sin pantalla) ---------- */
console.log('Juez 1c · saber (test/saber.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/saber.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 120000 });
  const ult = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  apunta('Reglas del Saber', r.status === 0, ult.slice(0, 200));
}
if (!RAPIDO) {   // bot investigador (~40 s): solo en el recorrido completo
  console.log('Juez 1d · bot investigador (test/investigador.test.mjs)');
  const r = spawnSync(process.execPath, ['test/investigador.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 240000 });
  const ult = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  apunta('Bot investigador', r.status === 0, ult.slice(0, 200));
}

/* ---------- 1e. Ajustes y dificultades (bot por nivel, ~90 s; también en --rapido) ---------- */
console.log('Juez 1e · ajustes y dificultades (test/ajustes.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/ajustes.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 150000 });
  const ult = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  apunta('Ajustes y dificultades (bot por nivel)', r.status === 0, ult.slice(0, 200));
}

/* ---------- 1f. Sonido de la ciudad (CN15c; lógica pura, segundos; también en --rapido) ---------- */
console.log('Juez 1f · sonido de la ciudad (test/sonido-ciudad.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/sonido-ciudad.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
  const ult = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  apunta('Sonido de la ciudad', r.status === 0, ult.slice(0, 200));
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
      await estado(() => { const a = Game.state.ajustes; if (a) a.asesor = false; });      // CN14-C: el asesor de serie no cambia el recorrido
      const ok = await estado(() => !!Game.state && !UI.menu && Game.myCities().includes('roma'));
      return { ok, detalle: ok ? await estado(() => Game.dateStr(Game.state.t)) : 'no hay partida', captura: await foto('mapa') };
    });

    await paso('Ciudad en 3D', async () => {
      await espera(3000);   // la partida nueva abre en Gobierno (ciudad)
      const ok = await estado(() => !document.getElementById('citywrap').hidden && !!document.querySelector('#citywrap canvas'));
      return { ok, detalle: ok ? '' : 'no aparece la vista 3D de la ciudad', captura: await foto('ciudad') };
    });

    await paso('Ajustes y asesor: dificultad en Gobierno', async () => {
      await page.click('#tabs3 [data-v="gobierno"]'); await espera(500);
      await page.click('#view [data-act="hoja"][data-v="ajustes"]'); await espera(400);   // K12a: Ajustes es una hoja inferior
      const hay = await estado(() => !!document.getElementById('ajustes') && !!document.getElementById('dif-g') && !!document.getElementById('ase-g'));
      let dura = false, sigue = false, alto = 0;
      if (hay) {
        alto = await estado(() => Math.min(...[...document.querySelectorAll('#ajustes .chip')].map(b => b.getBoundingClientRect().height)));
        await page.click('#ajustes [data-act="dif"][data-v="dura"]'); await espera(300);
        dura = await estado(() => Game.ajustes().dif === 'dura');
        sigue = await estado(() => { Game.save(); return JSON.parse(localStorage.getItem('aqvila-save-v1')).ajustes.dif === 'dura'; });
        await page.click('#ajustes [data-act="dif"][data-v="normal"]'); await espera(300);
      }
      const normal = await estado(() => Game.ajustes().dif === 'normal');
      await page.click('#hoja [data-act="hojax"]'); await espera(300);
      await page.click('#tabs3 [data-v="ciudad"]'); await espera(500);
      const ok = hay && dura && sigue && normal && alto >= 40;
      return { ok, detalle: ok ? 'bloque Ajustes presente; «Dura» se guarda; vuelve a Normal' : 'ajustes=' + hay + ' dura=' + dura + ' guardada=' + sigue + ' normal=' + normal + ' botón=' + alto + ' px' };
    });

    await paso('Construir un edificio', async () => {
      // Ciudad: se elige una ficha de la bandeja, se ve el fantasma, se pulsa «Construir aquí»; luego ficha de pieza y Gobierno limpio
      const fallos = [];
      await page.click('#tabs3 [data-v="ciudad"]'); await espera(1500); await cierraAvisos();
      await page.waitForSelector('.pza', { timeout: 10000 }).catch(() => fallos.push('no hay bandeja de fichas'));
      const sel = (await page.locator('.pza[data-id="granja"]:not(.cara)').count()) ? '.pza[data-id="granja"]' : '.pza:not(.cara)';
      await page.locator(sel).first().scrollIntoViewIfNeeded(); await page.locator(sel).first().tap(); await espera(1200);
      const linea = () => estado(() => { const l = document.getElementById('linea'); return l.hidden ? '' : l.textContent.trim(); });
      const lin = await linea(); if (!lin) fallos.push('al elegir la ficha no aparece el fantasma ni la línea');
      // CN14-A: la cifra grande de la línea sale al colocar una pieza con efecto y cambia al moverla (se lee antes y después)
      { const cifra = () => estado(() => { const c = document.getElementById('l-cifra'); return c ? c.textContent.trim() : null; });
        const conEf = await estado(() => { const r = UI.sel3 && Game.notaSitio('roma', UI.sel3.id, UI.sel3.x, UI.sel3.z); return !!(r && r.efecto); });
        if (conEf) { const c1 = await cifra(); if (c1 === null) fallos.push('no existe #l-cifra'); else if (!c1) fallos.push('la cifra del efecto está vacía al elegir la pieza');
          const pt = await estado(() => { const E = Game.ciudadE('roma'), pz = UI.sel3.id; let a = null, ef = Game.notaSitio('roma', pz, UI.sel3.x, UI.sel3.z).efecto; for (let x = E.foro.x - 200; x <= E.foro.x + 200; x += 20) for (let z = E.foro.z - 200; z <= E.foro.z + 200; z += 20) { const n = Game.notaSitio('roma', pz, x, z); if (n && n.efecto && n.efecto.txt !== ef.txt && (!a || n.vale)) a = { x, z }; } if (!a) return null; UI.cityV.mirar(a.x, a.z, 300, 0); return UI.cityV.aPantalla(a.x, a.z, 0); });
          if (pt) { await espera(600); await page.touchscreen.tap(pt.x, pt.y); await espera(800); const c2 = await cifra(); if (c2 === c1) fallos.push('la cifra no cambia al mover la pieza (' + c1 + ')'); } } }
      const captura = await foto('construir');
      // si el sitio no vale, se toca el suelo en el mejor sitio verde
      if (await estado(() => document.getElementById('b-si').disabled)) {
        const pt = await estado(() => { const E = Game.ciudadE('roma'), pz = UI.bsel && UI.bsel.id || 'granja'; let m = null; for (let x = E.foro.x - 250; x <= E.foro.x + 250; x += 10) for (let z = E.foro.z - 250; z <= E.foro.z + 250; z += 10) { const n = Game.notaSitio('roma', pz, x, z); if (n && n.vale && (!m || n.nota > m.n)) m = { n: n.nota, x, z }; } if (!m) return null; UI.cityV.mirar(m.x, m.z, 300, 0); return UI.cityV.aPantalla(m.x, m.z, 0); });
        if (pt) { await espera(800); await page.touchscreen.tap(pt.x, pt.y); await espera(700); } else fallos.push('no hay ningún sitio verde');
      }
      await page.click('#b-si', { timeout: 5000 }).catch(() => fallos.push('«Construir aquí» no se puede pulsar')); await espera(1500);
      const obra = await estado(() => { const c = Game.state.cities.roma.obras[0]; return c ? { n: Game.state.cities.roma.obras.length, t: c.b ? DATA.BUILD[c.b].n : c.pieza } : null; });
      if (!obra || obra.n !== 1) fallos.push('la obra no entró en la cola (' + (obra ? obra.n : 0) + ' obras)');
      // ficha de una pieza ya colocada
      let fichaOk = false;
      for (let k = 0; k < 4 && !fichaOk; k++) {
        const e = await estado(() => { const E = Game.ciudadE('roma'), e = E.edificios.find(q => !q.obra && !q.ruina && DATA.BUILD[q.tipo] && q.x !== undefined); if (!e) return null; UI.cityV.mirar(e.x, e.z, 260, 0); return { x: e.x, z: e.z }; });
        if (!e) break; await espera(2500);
        const p = await page.evaluate(e => UI.cityV.aPantalla(e.x, e.z, 4), e); await page.touchscreen.tap(p.x, p.y); await espera(700);
        fichaOk = await estado(() => !!document.querySelector('#fichab .ficha [data-act="mejpz"]'));
      }
      if (!fichaOk) fallos.push('la ficha de una pieza no enseña «mejorar»');
      const captura2 = await foto('construir-ficha');
      await estado(() => { const c = document.querySelector('#fichab [data-act="cclose"]'); if (c) c.click(); });
      await page.click('#tabs3 [data-v="gobierno"]'); await espera(1200);
      const gob = await estado(() => ({ up: document.querySelectorAll('#view [data-act="up"]').length, solar: /solar/i.test(document.getElementById('view').innerText), anillo: !!document.querySelector('#view .gani'), atajos: document.querySelectorAll('#view .gatajos .gat').length, scroll: document.getElementById('view').scrollHeight - document.getElementById('view').clientHeight }));
      if (gob.up) fallos.push('Gobierno aún tiene botones de subir edificio'); if (gob.solar) fallos.push('Gobierno aún dice «solar»');
      if (!gob.anillo || gob.atajos < 4) fallos.push('Gobierno (K12a) sin anillo de felicidad o sin atajos'); if (gob.scroll > 2) fallos.push('Gobierno hace scroll de página (' + gob.scroll + ' px)');
      const enObras = await estado(() => /obra|construy|hasta|⏳|🔨/i.test(document.getElementById('view').innerText));
      await page.click('#tabs3 [data-v="imperio"]'); await espera(1000);
      const imp = await estado(() => document.getElementById('view').innerText.length > 40); if (!imp) fallos.push('Imperio no abre');
      await page.click('#tabs3 [data-v="ciudad"]'); await espera(500);
      return { ok: !fallos.length, detalle: fallos.length ? fallos.join('; ') : 'en obras: ' + obra.t + ' · fantasma «' + lin.slice(0, 50) + '» · ficha con mejorar · Gobierno limpio' + (enObras ? '' : ' (sin texto de obra en Gobierno)'), captura };
    });

    await paso('Reclutar tropas', async () => {
      await page.click('#bmas'); await page.click('#hoja [data-act="modo"][data-v="guerra"]'); await espera(500); await page.click('#bact'); await espera(500);
      const b = page.locator('#view [data-act="train"]:not(.no)').first(); await b.scrollIntoViewIfNeeded(); await b.click(); await espera(500);
      const q = await estado(() => Game.state.cities.roma.train.map(t => t.n + ' ' + DATA.UNITS[t.u].n).join(', '));
      return { ok: !!q, detalle: q ? 'en instrucción: ' + q : 'no se reclutó nada', captura: await foto('reclutar') };
    });

    await paso('Abrir el Códice', async () => {
      await page.click('#bmodo'); await page.click('#hoja [data-act="tab"][data-v="log"]'); await espera(500);
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
      await page.click('#bmodo'); await page.click('#hoja [data-act="modo"][data-v="guerra"]'); await espera(600);
      await page.click('#sheet [data-act="pick"]'); await espera(500);
      const captura = await foto('atacar');
      await page.click('#mbox [data-act="send"]'); await espera(400);
      const ok = await estado(() => Game.state.marches.some(m => m.owner === 'roma'));
      return { ok, detalle: ok ? 'el ejército marcha hacia ' + await page.evaluate(id => DATA.CITIES[id].n, objetivo) : 'el ejército no salió', captura };
    });

    await paso('Llega la batalla', async () => {
      // NB7: este recorrido prueba la batalla clásica (la red de seguridad); la nueva la cubren test/nb7.test.mjs y captura-nb7.mjs
      await estado(() => Game.ponerAjustes({ batalla: 'clasica' }));
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
      if (await carta.count() && await carta.isVisible()) { await carta.click(); await espera(300); await page.mouse.click(520, 150); await espera(2500); }
      if (await page.locator('#bctl [data-act="bejec"]').count()) { await page.click('#bctl [data-act="bejec"]'); await espera(3000); }
      const captura = await foto('batalla');
      const vivos = await estado(() => UI.battle ? UI.battle.b.men(0) + ' contra ' + UI.battle.b.men(1) : '');
      return { ok: en3d, detalle: en3d ? vivos : 'la batalla no se ve en 3D (vista de reserva)', captura };
    });

    // N7: formaciones, tres líneas y sombras por tiempos (se prueba sobre la batalla en curso)
    await paso('N7: formaciones, líneas y sombras a 10/20/30 s', async () => {
      const r = await estado(() => {
        const b = UI.battle && UI.battle.b; if (!b || !window.Battle && !b.formacionesPosibles) return { ok: false, t: 'sin batalla' };
        const mios = b.regs.filter(q => q.side === 0 && q.st === 'ok');
        const conForma = mios.filter(q => b.formacionesPosibles(q).length > 1).length;
        const lineas = mios.filter(q => q.linea).length;
        const pv = b.prevision([10, 20, 30]);
        const okPv = Array.isArray(pv) && pv.length === 3 && pv.every(x => x.sombras && x.sombras.length);
        const dim = mios.every(q => { const f = b.constructor.forma(q); return f && f.ancho > 0 && f.fondo > 0; });
        return { ok: conForma > 0 && okPv && dim, t: conForma + ' regimientos con formaciones · ' + lineas + ' con línea · sombras ' + (okPv ? 'a 3 tiempos' : 'mal') };
      });
      return { ok: !!(r && r.ok), detalle: r && r.t };
    });

    await paso('La batalla termina y se aplica el resultado', async () => {
      // «Resolver» está en la fila durante la ejecución y, en el plan, dentro del panel «Más»
      if (!(await page.locator('[data-act="bskip"]').count())) {
        if (await page.locator('#bctl [data-act="bseguir"]').count()) { await page.click('#bctl [data-act="bseguir"]'); await espera(300); }
        if (await page.locator('#bctl [data-act="bamano"]').count()) { await page.click('#bctl [data-act="bamano"]'); await espera(300); }   // R2: en el plan hay tarjetas; «Más» está en «A mano»
        if (await page.locator('#bctl [data-act="bmas"]').count()) { await page.click('#bctl [data-act="bmas"]'); await espera(300); }
      }
      await page.click('[data-act="bskip"]');
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

    await paso('Mapa por escalones: tocar Italia acerca y «← volver» devuelve', async () => {
      await estado(() => { Game.state.speed = 0; UI.dirty = true; const b = document.createElement('button'); b.dataset.act = 'modo'; b.dataset.v = 'guerra'; document.body.appendChild(b); b.click(); b.remove(); const m = document.getElementById('modal'); if (m) m.hidden = true; UI.map.esc.anim = null; UI.map.esc.zona = null; UI.map.esc.pila = []; UI.map.c.x = 94; UI.map.c.z = 46; UI.map.c.dist = 330; UI.map.clamp(); });
      await espera(1500);
      const antes = await estado(() => ({ x: UI.map.c.x, z: UI.map.c.z, dist: UI.map.c.dist, zonas: [...document.querySelectorAll('.mlabel.zona')].filter(e => e.style.display !== 'none').length }));
      const fotoMare = await foto('escalon-mare');
      await page.evaluate(() => [...document.querySelectorAll('.mlabel.zona')].find(e => e.textContent === 'Italia').click());
      await espera(1500);
      const dentro = await estado(() => ({ dist: UI.map.c.dist, migas: document.querySelector('.mmigas').innerText.replace(/\s+/g, ' '), volver: !!document.querySelector('.mmigas [data-volver]') }));
      const fotoZona = await foto('escalon-italia');
      await page.evaluate(() => document.querySelector('.mmigas [data-volver]').click());
      await espera(3000);   // 13/11: con la máquina cargada la animación de vuelta tardaba más de 1,5 s y el juez fallaba sin que el juego fallara
      const fin = await estado(() => ({ x: UI.map.c.x, z: UI.map.c.z, dist: UI.map.c.dist, migas: document.querySelector('.mmigas').innerText.replace(/\s+/g, ' ') }));
      const igual = Math.abs(fin.x - antes.x) < 0.01 && Math.abs(fin.z - antes.z) < 0.01 && Math.abs(fin.dist - antes.dist) < 0.01;
      const ok = antes.zonas === 6 && dentro.dist < antes.dist * 0.6 && /Italia/.test(dentro.migas) && dentro.volver && igual && !/Italia/.test(fin.migas);
      return { ok, detalle: ok ? 'seis zonas; Italia acerca la cámara (' + Math.round(antes.dist) + ' a ' + Math.round(dentro.dist) + ') y «← volver» la devuelve' : 'zonas ' + antes.zonas + ', dist ' + Math.round(antes.dist) + ' a ' + Math.round(dentro.dist) + ', migas «' + dentro.migas + '», volver ' + dentro.volver + ', igual ' + igual + ', migas finales «' + fin.migas + '»', captura: fotoZona, detalle2: fotoMare };
    });

    await paso('CN22 avisos: máx. 2 avisos y tarjeta de estación baja', async () => {
      await estado(() => { const a = Game.state.ajustes; if (a) a.asesor = false; Game.state.speed = 0; });
      await cierraAvisos();
      if (!(await page.locator('#turno:not([hidden])').count())) return { ok: false, detalle: 'no hay botón «Pasar turno»' };
      await page.evaluate(() => { const b = document.getElementById('inf'); if (b) b.remove(); document.getElementById('turno').click(); });
      await espera(500);
      const toasts = await estado(() => document.querySelectorAll('#toasts .toast').length);
      await cierraAvisos();
      await estado(() => { const b = document.getElementById('inf'); if (b) b.remove(); UI.consejoModal(); });
      await espera(200);
      const m = await estado(() => { const r = id => { const e = document.getElementById(id); return e ? e.getBoundingClientRect() : null; }; const i = r('inf'), a = r('inf-mas'), b = r('inf-seguir'); return { i: i && i.height, a: a && a.height, b: b && b.height }; });
      await page.click('#inf-mas'); await espera(200);
      const d = await estado(() => { const e = document.getElementById('inf-mas'); if (!e) return null; const r = e.getBoundingClientRect(); return { b: r.bottom, l: r.left, r: r.right }; });
      const captura = await foto('inf-detalle');
      await estado(() => { const b = document.getElementById('inf'); if (b) b.remove(); UI.dirty = true; });
      const dentro = !!d && d.b <= 844 && d.l >= 0 && d.r <= 390;
      const ok = toasts <= 2 && !!m.i && m.i <= 281 && m.a >= 40 && m.b >= 40 && dentro;
      return { ok, detalle: 'avisos=' + toasts + ' #inf=' + (m.i | 0) + ' px; «Ver más»=' + (m.a | 0) + ' «Seguir»=' + (m.b | 0) + ' px; detalle ' + (dentro ? 'dentro' : 'FUERA') + ' de pantalla', captura };
    });

    await paso('R3 pausas: la obra que termina para el reloj con su motivo; el ajuste cambia', async () => {
      await mkdir(join(RAIZ, 'gobierno', 'capturas-tarea'), { recursive: true });
      const tarea = async nombre => { await page.screenshot({ path: join(RAIZ, 'gobierno', 'capturas-tarea', nombre), type: 'jpeg', quality: 80 }); return nombre; };
      await cierraAvisos(); await estado(() => { UI.modalQ = []; UI.modalOpen = false; document.getElementById('modal').hidden = true; const inf = document.getElementById('inf'); if (inf) inf.remove(); });
      await estado(() => document.querySelector('#tabs3 [data-v="ciudad"]').click()); await espera(1200);
      await estado(() => { const s = Game.state; if (s.ajustes) { s.ajustes.asesor = false; s.ajustes.pausas = 'todas'; } s.speed = 0; UI.pausa = null; const inf = document.getElementById('inf'); if (inf) inf.remove(); for (const r in s.res) s.res[r] = Math.max(s.res[r], 900); });
      const emp = await estado(() => { const s = Game.state, c = s.cities.roma; const b = Object.keys(window.DATA.BUILD).find(k => Game.upgrade('roma', k)); if (!b) return false; c.obras.forEach(o => { o.t1 = s.t + 0.2; }); s.speed = 1; return true; });
      const salio = await page.waitForFunction(() => !document.getElementById('pausa').hidden, null, { timeout: 20000 }).then(() => true, () => false);
      await espera(400);
      const m = await estado(() => { const e = document.getElementById('pausa'), r = e.getBoundingClientRect(), b = e.querySelector('button').getBoundingClientRect(), tb = document.getElementById('tabs3'), tr = tb ? tb.getBoundingClientRect() : null; return { speed: Game.state.speed, txt: document.getElementById('p-txt').innerText, l: r.left, r: r.right, t: r.top, b: r.bottom, alto: r.height, bt: b.height, abajo: tr ? tr.top : 844, modal: !document.getElementById('modal').hidden }; });
      const f1 = await tarea('R3-pausa.jpg'); await tarea('R4-aviso-pausa.jpg');
      await page.click('#pausa button'); await espera(400);
      const sigue = await estado(() => ({ speed: Game.state.speed, oculto: document.getElementById('pausa').hidden }));
      const ok1 = emp && salio && m.speed === 0 && /Obra terminada/.test(m.txt) && m.l >= 0 && m.r <= 390 && m.alto <= 70 && m.bt >= 32 && m.b < m.abajo && !m.modal && sigue.speed > 0 && sigue.oculto;
      // el ajuste
      await estado(() => { Game.state.speed = 0; });
      await estado(() => document.querySelector('#tabs3 [data-v="gobierno"]').click()); await espera(600);
      await page.click('#view [data-act="hoja"][data-v="ajustes"]'); await espera(400);   // K12a: Ajustes es una hoja inferior
      await estado(() => { const e = document.getElementById('aj-pausas'); if (e) e.scrollIntoView({ block: 'center' }); });
      await espera(300);
      const hay = await estado(() => !!document.getElementById('aj-pausas'));
      let cambia = false, alto = 0, norm = false;
      if (hay) {
        alto = await estado(() => Math.min(...[...document.querySelectorAll('#aj-pausas .chip')].map(b => b.getBoundingClientRect().height)));
        await page.click('#aj-pausas [data-act="pausas"][data-v="graves"]'); await espera(300);
        cambia = await estado(() => Game.ajustes().pausas === 'graves' && document.querySelector('#aj-pausas .chip.on').dataset.v === 'graves');
        await estado(() => { const e = document.getElementById('aj-pausas'); if (e) e.scrollIntoView({ block: 'center' }); }); await espera(200);
        var f2 = await tarea('R3-ajuste.jpg');
        await page.click('#aj-pausas [data-act="pausas"][data-v="todas"]'); await espera(300);
        norm = await estado(() => Game.ajustes().pausas === 'todas');
      }
      await estado(() => { const x = document.querySelector('#hoja [data-act="hojax"]'); if (x) x.click(); }); await espera(300);
      await estado(() => document.querySelector('#tabs3 [data-v="ciudad"]').click()); await espera(500);
      const ok = ok1 && hay && cambia && norm && alto >= 40;
      return { ok, detalle: ok ? 'la obra para el reloj («' + m.txt.slice(0, 60) + '»); «Continuar» lo reanuda; el ajuste cambia a «graves» y vuelve a «todas»' : JSON.stringify({ emp, salio, m, sigue, hay, cambia, norm, alto }), captura: f1 };
    });

    await paso('R4 aviso del asesor: una frase corta que se lee entera', async () => {
      const tarea = async nombre => { await page.screenshot({ path: join(RAIZ, 'gobierno', 'capturas-tarea', nombre), type: 'jpeg', quality: 80 }); return nombre; };
      await cierraAvisos(); await estado(() => { UI.modalQ = []; UI.modalOpen = false; document.getElementById('modal').hidden = true; const inf = document.getElementById('inf'); if (inf) inf.remove(); const s = Game.state; s.speed = 0; UI.pausa = null; if (s.ajustes) { s.ajustes.asesor = true; s.ajustes.vistos = []; delete s.ajustes.asesorMes; delete s.ajustes.asesorMs; } UI.modo3 = 'mirar'; UI.linK = null; });
      await estado(() => document.querySelector('#tabs3 [data-v="ciudad"]').click()); await espera(800);
      const salio = await page.waitForFunction(() => { const l = document.getElementById('linea'); return l && !l.hidden && /leccion/.test(l.className); }, null, { timeout: 20000 }).then(() => true, () => false);
      await espera(300);
      const m = await estado(() => { const l = document.getElementById('linea'), r = l.getBoundingClientRect(), t = document.getElementById('l-texto'); return { txt: t.innerText, n: t.innerText.length, l: r.left, r: r.right, alto: r.height, rotoH: t.scrollWidth > t.clientWidth + 1 }; });
      const f = await tarea('R4-aviso-asesor.jpg');
      await estado(() => { const s = Game.state; if (s.ajustes) s.ajustes.asesor = false; UI.linK = null; });
      const ok = salio && m.n <= 80 && m.l >= 0 && m.r <= 390 && m.alto <= 90 && !m.rotoH;
      return { ok, detalle: ok ? '«' + m.txt + '» (' + m.n + ' caracteres, ' + Math.round(m.alto) + ' px de alto)' : JSON.stringify({ salio, m }), captura: f };
    });

    await paso('Región de Italia: mapa con 7 ciudades', async () => {
      await page.evaluate(() => Game.save());
      await page.reload({ waitUntil: 'load' });
      await page.waitForSelector('#menu [data-act="newregion"]', { timeout: 30000 });
      await page.waitForFunction(() => window.UI && window.UI.map, null, { timeout: 60000 }).catch(() => { });
      await page.click('#menu [data-act="newregion"]'); await espera(3500); await cierraAvisos();
      await page.evaluate(() => { Game.state.speed = 0; UI.dirty = true; document.querySelector('[data-act="menumodo"]').click(); document.querySelector('[data-act="menumodo"]').click(); document.querySelector('[data-act="modo"][data-v="guerra"]').click(); }); await espera(2500);
      const r = await estado(() => ({ reg: Game.regionId(), vis: UI.map ? Object.keys(UI.map.cities).filter(i => UI.map.cities[i].grp.visible && Game.state.cities[i]).length : -1, fantasmas: UI.map ? Object.keys(UI.map.cities).filter(i => UI.map.cities[i].grp.visible && !Game.state.cities[i]).length : 0, rutas: UI.map ? UI.map.aristas.filter(e => e.line.visible).length : -1 }));
      const ok = r.reg === 'italia' && r.vis === 7 && r.fantasmas === 0;
      return { ok, detalle: ok ? '7 ciudades visibles, ' + r.rutas + ' rutas' : 'región ' + r.reg + ', visibles ' + r.vis + ', fantasmas ' + r.fantasmas, captura: await foto('italia') };
    });

    await paso('I8 partida corta: menú, en pie, fundar, continuar y final con resumen', async () => {
      const recarga = async () => { await page.evaluate(() => Game.save()); await page.reload({ waitUntil: 'load' }); await page.waitForSelector('#menu [data-act="hoja"][data-v="corta"]', { timeout: 30000 }); await page.waitForFunction(() => window.UI && window.UI.cityV && window.UI.cityV.listo, null, { timeout: 90000 }).catch(() => { }); };
      await recarga();   // el menú vuelve a estar a la vista (la partida de Italia seguía abierta)
      const abreCorta = async () => { await page.click('#menu [data-act="hoja"][data-v="corta"]'); await espera(400); };
      await abreCorta();   // K12a-B: «Partida corta» vive en una hoja inferior (#hoja), no en #menu
      const menu = await estado(() => { const m = document.getElementById('menu'), h = document.getElementById('hoja'), b = [...h.querySelectorAll('[data-act="cortaen"],[data-act="cortafun"]')]; return { n: b.length, fuera: b.some(e => e.getBoundingClientRect().right > 390 || e.getBoundingClientRect().left < 0), sw: Math.max(m.scrollWidth, h.scrollWidth) }; });
      const fm = await foto('i8-menu');
      // 1) en pie: región de Italia con el modo
      await page.click('#hoja [data-act="cortaen"]'); await espera(3000); await cierraAvisos();
      const pie = await estado(() => ({ modo: Game.modo() && Game.modo().id, fase: Game.modoFase(), reg: Game.regionId(), mias: Game.myCities().length, vis: UI.map ? Object.keys(UI.map.cities).filter(i => UI.map.cities[i].grp.visible && Game.state.cities[i]).length : -1, city: UI.city }));
      // 2) fundar de la nada: abre la pantalla de fundar con el reloj parado
      await recarga(); await abreCorta();
      await page.click('#hoja [data-act="cortafun"]'); await espera(1500); await cierraAvisos();
      await page.waitForFunction(() => window.UI.fundar && window.UI.fundar.vale, null, { timeout: 60000 });
      const t0 = await estado(() => { Game.state.speed = 1; return Game.state.t; }); await espera(1500);
      const fun = await estado(() => ({ fundando: Game.fundando(), t: Game.state.t, mias: Game.myCities().length, linea: (document.getElementById('linea').innerText || '') }));
      const ff = await foto('i8-fundar');
      // continuar: la partida a medio fundar se recupera con su pantalla de fundar
      await recarga(); await page.click('#menu [data-act="continue"]');
      await page.waitForFunction(() => window.UI.fundar, null, { timeout: 60000 });
      await page.waitForFunction(() => window.UI.fundar.vale, null, { timeout: 30000 });
      await page.click('#b-si'); await page.waitForFunction(() => !window.UI.fundar && Game.myCities().length === 1, null, { timeout: 40000 }); await espera(800); await cierraAvisos();
      const fd = await estado(() => ({ fase: Game.modoFase(), mias: Game.myCities(), city: UI.city, cap: Game.state.capital }));
      // 3) final con resumen (se fuerza) y final de campaña sin resumen
      await estado(() => { const s = Game.state; s.over = { win: true, why: 'Prueba', resumen: Game.resumen() }; UI.overShown = false; UI.modalQ = []; UI.modalOpen = false; document.getElementById('modal').hidden = true; Game.onEvent('over'); });
      await espera(500);
      const fin = await estado(() => ({ res: !!document.querySelector('#mbox .resumen'), btn: !!document.querySelector('#mbox [data-act="tomenu"]'), filas: document.querySelectorAll('#mbox .rs-f').length }));
      const fo = await foto('i8-final');
      const ok = menu.n === 2 && !menu.fuera && menu.sw <= 390 && pie.modo === 'corta' && pie.fase === 'jugando' && pie.reg === 'italia' && pie.mias === 2 && pie.vis === 7 &&
        fun.fundando && fun.t === t0 && fun.mias === 0 && /Beneventum/.test(fun.linea) && fd.fase === 'jugando' && fd.mias.length === 1 && fd.city === fd.cap && fd.cap === 'beneventum' && fin.res && fin.btn && fin.filas >= 8;
      return { ok, detalle: ok ? 'menú con 2 botones; en pie: Italia, 2 ciudades, 7 en el mapa; fundar: reloj parado, continuar reabre, ciudad ' + fd.cap + ' es tuya; final con ' + fin.filas + ' filas' : JSON.stringify({ menu, pie, fun, t0, fd, fin }), captura: fo };
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
