#!/usr/bin/env node
/* AQVILA — jueces: un solo comando que dice si el juego funciona.
   Uso:  node gobierno/jueces.mjs            (todo)
         node gobierno/jueces.mjs --rapido   (solo la lógica, sin navegador)
         node gobierno/jueces.mjs --area cerebro|musculo|batallas
              (MIN4: solo los pasos de navegador de esa área, más los que la preparan; capturas en
               gobierno/capturas-area/<área>/. Lo usa gobierno/juez-area.mjs. Sin lógica ni juez de la guerra.)
   Pasa test/sim.test.js, recorre el juego en un navegador a 390×844 y deja las capturas
   y un informe en gobierno/capturas/. Sale con código 1 si algo falla. */
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAPIDO = process.argv.includes('--rapido');
/* MIN4: cada paso del navegador dice de qué área es (de) y a qué otras áreas prepara (para): con --area solo corren los suyos,
   los comunes y los que preparan su estado. Sin --area corre todo, en el mismo orden de siempre (las mismas 43 comprobaciones). */
const AREA = process.argv.includes('--area') ? process.argv[process.argv.indexOf('--area') + 1] : null;
if (AREA !== null && !['batallas', 'cerebro', 'musculo'].includes(AREA)) { console.error('Áreas con pasos de navegador: batallas, cerebro, musculo.'); process.exit(2); }
const CAPS = AREA ? join(RAIZ, 'gobierno', 'capturas-area', AREA) : join(RAIZ, 'gobierno', 'capturas');
const CAPS_TAREA = AREA ? CAPS : join(RAIZ, 'gobierno', 'capturas-tarea');   // R3 y R4 dejan ahí sus capturas fijas
const pasos = [];                       // { nombre, ok, detalle, captura }
const errores = [];                     // errores de consola del navegador
const t0 = Date.now();

function apunta(nombre, ok, detalle, captura) {
  pasos.push({ nombre, ok: !!ok, detalle: detalle || '', captura: captura || null });
  console.log((ok ? '  ✔ ' : '  ✘ ') + nombre + (detalle ? ' — ' + detalle : ''));
}

/* ---------- 1. Lógica (con --area no corre: el juez de área pasa la lógica de su área) ---------- */
if (!AREA) {
console.log('Juez 1 · lógica (test/sim.test.js)');
{
  const r = spawnSync(process.execPath, ['test/sim.test.js'], { cwd: RAIZ, encoding: 'utf8', timeout: 2400000 });
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

/* ---------- 1S. Encargos del Senado, hitos y carácter de barrio (CN17, sin pantalla) ---------- */
console.log('Juez 1S · encargos e hitos (test/encargos.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/encargos.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l)), mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Encargos del Senado e hitos', r.status === 0, r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | ')).slice(0, 400));
}

/* ---------- 1T. Hecho para el móvil (CN18): copia en archivo, nota, parada y crónica, sin pantalla ---------- */
console.log('Juez 1T · copia, nota y parada (test/movil.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/movil.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l)), mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Copia de la partida, nota y parada', r.status === 0, r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | ')).slice(0, 400));
}

/* ---------- 1a. Ciudad nueva (reglas sin pantalla) ---------- */
console.log('Juez 1a · ciudad nueva (test/ciudad.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/ciudad.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 120000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l));
  const mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Reglas de la ciudad nueva', r.status === 0, (r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | '))).slice(0, 400));
}

/* ---------- 1g. Senado nuevo (SN1: sala de votos, reglas sin pantalla) ---------- */
console.log('Juez 1g · Senado (test/senado.test.js)');
{
  const r = spawnSync(process.execPath, ['test/senado.test.js'], { cwd: RAIZ, encoding: 'utf8', timeout: 120000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l));
  const mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Senado nuevo (sala de votos)', r.status === 0, (r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | '))).slice(0, 400));
}

/* ---------- 1k. Toparse en el camino (GM15b: sitios, salir al encuentro, apostar, partida vieja) ---------- */
console.log('Juez 1k · Toparse en el camino (test/campo.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/campo.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 180000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l));
  const mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Toparse en el camino (campaña, sin pantalla)', r.status === 0, (r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | '))).slice(0, 400));
}

/* ---------- 1h. Guerra nueva (GC3: motor de la batalla nueva, sin pantalla) ---------- */
console.log('Juez 1h · Guerra nueva (test/guerra.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/guerra.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 120000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l));
  const mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Guerra nueva (motor sin pantalla)', r.status === 0, (r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | '))).slice(0, 400));
}

/* ---------- 1h3. Simulador de batallas (CG3: manípulos, sin pantalla; aún no lo usa el juego) ---------- */
console.log('Juez 1h3 · Simulador de batallas (test/simulador.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/simulador.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 120000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l));
  const mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Simulador de batallas (manípulos)', r.status === 0, (r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | '))).slice(0, 400));
}

/* ---------- 1h2. Guerra en el juego (GC4: estadoGuerra, bot, guardar a mitad) ---------- */
console.log('Juez 1h2 · Guerra en el juego (test/guerra-juego.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/guerra-juego.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 120000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l));
  const mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Guerra en el juego (bot y guardar a mitad)', r.status === 0, (r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | ')).slice(0, 300)));
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
  const r = spawnSync(process.execPath, ['test/investigador.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 1200000 });
  const ult = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  apunta('Bot investigador', r.status === 0, ult.slice(0, 200));
}

/* ---------- 1e. Ajustes y dificultades (bot por nivel, ~90 s; también en --rapido) ---------- */
console.log('Juez 1e · ajustes y dificultades (test/ajustes.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/ajustes.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 1800000 });
  const ult = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  apunta('Ajustes y dificultades (bot por nivel)', r.status === 0, ult.slice(0, 200));
}

/* ---------- 1e2. Diplomacia (C3; lógica pura, segundos) ---------- */
console.log('Juez 1e2 · diplomacia e IA que construye (test/diplomacia.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/diplomacia.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
  const lineas = (r.stdout || '').split('\n').filter(l => /^(bien|MAL)\s/.test(l)), mal = lineas.filter(l => /^MAL/.test(l));
  apunta('Diplomacia (alianza, tributo, IA construye)', r.status === 0, (r.status === 0 ? lineas.length + ' comprobaciones bien' : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | '))).slice(0, 400));
}

/* ---------- 1f. Sonido de la ciudad (CN15c; lógica pura, segundos; también en --rapido) ---------- */
console.log('Juez 1f · sonido de la ciudad (test/sonido-ciudad.test.mjs)');
{
  const r = spawnSync(process.execPath, ['test/sonido-ciudad.test.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 60000 });
  const ult = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter(Boolean).slice(-1)[0] || '';
  apunta('Sonido de la ciudad', r.status === 0, ult.slice(0, 200));
}

}   // fin de la lógica

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
  console.log('Juez 2 · recorrido en navegador (390×844)' + (AREA ? ' · área ' + AREA : ''));
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
  const estado = (fn, arg) => page.evaluate(fn, arg);
  // cierra los avisos históricos que tapen la pantalla (no los de batalla)
  const cierraAvisos = async () => { for (let i = 0; i < 12; i++) { const b = page.locator('#modal:not([hidden]) [data-act="close"]').first(); if (!(await b.count())) break; await b.click(); await espera(120); } };
  const paso = async (nombre, quien, fn) => {
    const q = typeof quien === 'string' ? { de: quien } : quien;
    if (AREA && q.de !== 'comun' && q.de !== AREA && !(q.para || []).includes(AREA)) return null;   // de otra área: no corre
    if (AREA && q.de !== 'comun' && q.de !== AREA) nombre += ' (preparación, de ' + q.de + ')';
    try { const r = await fn(); apunta(nombre, r.ok, r.detalle, r.captura); return r.ok; }
    catch (e) { let c = null; try { c = await foto('fallo'); } catch (x) { } apunta(nombre, false, String(e.message).split('\n')[0].slice(0, 300), c); return false; }
  };

  try {
    await paso('El juego carga y aparecen los modelos', 'comun', async () => {
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
      const t = Date.now();
      const modelos = await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 90000 }).then(() => true, () => false);
      await espera(1500);
      return { ok: modelos, detalle: modelos ? 'modelos listos en ' + ((Date.now() - t) / 1000).toFixed(0) + ' s' : 'los modelos 3D no llegaron a cargar en 90 s', captura: await foto('menu') };
    });

    /* GM43f: Escaramuzas lleva a la escena «Testudo a pie» (página aparte) y su «Salir» vuelve al juego */
    await paso('Escaramuzas: «Testudo a pie» abre la escena y vuelve', 'batallas', async () => {
      await page.click('#menu .mesc'); await espera(800);
      const a = page.locator('#hoja a.esc-testudo');
      if (!(await a.count())) return { ok: false, detalle: 'no está la entrada «Testudo a pie» en Escaramuzas', captura: await foto('escaramuzas') };
      await a.scrollIntoViewIfNeeded(); await espera(300);
      const m = await a.evaluate(el => { const r = el.getBoundingClientRect(); return { h: Math.round(r.height), d: Math.round(r.right), t: el.textContent, url: el.href }; });
      const cap = await foto('escaramuzas-testudo');
      if (m.h < 44 || m.d > 390 || !/Testudo a pie/.test(m.t) || !/\/gobierno\/maquetas\/a-pie\/$/.test(m.url)) return { ok: false, detalle: 'entrada mal: alto ' + m.h + ' px, borde ' + m.d + ' px, ' + m.url, captura: cap };
      await a.click(); await page.waitForSelector('#salir', { state: 'visible', timeout: 30000 });
      const titulo = await page.title(); await espera(1500);
      await page.click('#salir'); await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
      await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 90000 }).catch(() => { });
      const ok = /Testudo a pie/.test(titulo);
      return { ok, detalle: 'entrada de ' + m.h + ' px; escena «' + titulo + '»; «Salir» vuelve al menú', captura: cap };
    });

    /* TP7a + FA7: «Falange a pie» es un botón que despliega «Elige rival» (cuatro enlaces con ?rival=); se abre uno, carga sin errores y «Salir» vuelve */
    await paso('Escaramuzas: «Falange a pie» abre la escena y vuelve', 'batallas', async () => {
      await page.click('#menu .mesc'); await espera(800);
      const b = page.locator('#hoja button.esc-falange');
      if (!(await b.count())) return { ok: false, detalle: 'no está el botón «Falange a pie» en Escaramuzas', captura: await foto('escaramuzas') };
      await b.scrollIntoViewIfNeeded(); await espera(300);
      const m = await b.evaluate(el => { const r = el.getBoundingClientRect(); return { h: Math.round(r.height), d: Math.round(r.right), t: el.textContent }; });
      if (m.h < 44 || m.d > 390 || !/Falange a pie/.test(m.t)) return { ok: false, detalle: 'botón mal: alto ' + m.h + ' px, borde ' + m.d + ' px', captura: await foto('escaramuzas-falange') };
      await b.click(); await espera(600);
      const rv = page.locator('#hoja a.esc-rv-b');
      await rv.first().scrollIntoViewIfNeeded().catch(() => { }); await espera(300);
      const rivales = await rv.evaluateAll(as => as.map(a => ({ t: a.textContent, url: a.href, h: Math.round(a.getBoundingClientRect().height), d: Math.round(a.getBoundingClientRect().right) })));
      const cap = await foto('escaramuzas-falange');
      const bienR = rivales.length === 4 && rivales.every(r => /\/gobierno\/maquetas\/falange\/\?rival=\w+$/.test(r.url) && r.h >= 44 && r.d <= 390);
      if (!bienR) return { ok: false, detalle: 'rivales mal: ' + rivales.length + ' enlaces · ' + rivales.map(r => r.url.split('/').pop() + ' ' + r.h + ' px').join(', '), captura: cap };
      const elegido = rivales.find(r => /rival=caballeria$/.test(r.url)) || rivales[0], antes = errores.length;
      await page.locator('#hoja a.esc-rv-b[href$="' + elegido.url.split('/').pop() + '"]').click();
      await page.waitForSelector('#salir', { state: 'visible', timeout: 30000 });
      const titulo = await page.title(), ruta = page.url(); await espera(4000);
      const capE = await foto('falange-escena'), fallosE = errores.slice(antes);
      await page.click('#salir'); await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
      await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 90000 }).catch(() => { });
      const ok = /Falange a pie/.test(titulo) && /\?rival=/.test(ruta) && !fallosE.length;
      return { ok, detalle: 'botón de ' + m.h + ' px; 4 rivales; abre «' + titulo + '» con ' + ruta.split('/').pop() + (fallosE.length ? '; ' + fallosE.length + ' error(es): ' + fallosE[0] : '; sin errores') + '; «Salir» vuelve al menú', captura: ok ? capE : cap };
    });

    /* CG4: «Empezar la batalla» de Escaramuzas abre la pantalla de mando (js/ui-mando.js, window.__mn); se ordena y se mira el efecto
       en el simulador (no el aviso: con render por software va a ~1 fotograma/s); al acabar, la hoja del resultado; la partida guardada no cambia */
    await paso('Escaramuzas: batalla nueva con mando en vivo', 'batallas', async () => {
      await page.setViewportSize({ width: 844, height: 390 }); await espera(500);
      const guardada = await estado(() => localStorage.getItem('aqvila-save-v1'));
      if (!(await page.locator('#hoja .esc').count())) { await page.click('#menu .mesc'); await espera(800); }
      await page.click('[data-act="escempieza"]');
      await page.waitForFunction(() => window.__mn && window.__mn.lista === true, null, { timeout: 180000 }).catch(() => { });
      if (!(await estado(() => !!(window.__mn && window.__mn.lista)))) return { ok: false, detalle: 'la pantalla de mando no llegó a estar lista', captura: await foto('escaramuza-carga') };
      await estado(() => window.__mn.pausa(true)); await espera(1500);
      const id = await estado(() => { const u = window.__mn.S.man.find(u => u.lado === 0 && u.tropa === 'hastati') || window.__mn.S.man.find(u => u.lado === 0); return u.id; });
      const elegidos = await estado(i => window.__mn.elegir([i]), id);
      const meta = await estado(i => { const u = window.__mn.S.man[i]; return { x: u.x + 25, y: u.y + 40 }; }, id);
      const noMueve = await estado(m => window.__mn.ordenar({ tipo: 'mover', x: m.x, y: m.y }), meta);
      const noForma = await estado(() => window.__mn.ordenar({ tipo: 'formar', forma: 'testudo' }));
      await estado(() => { window.__mn.pausa(false); window.__mn.salta(12); window.__mn.cuadro(0.1); });
      const efecto = await estado(i => { const u = window.__mn.S.man[i]; return { mueve: !!u.dest || u.orden === 'mover', testudo: u.forma === 'testudo' || u.luego === 'testudo', forma: u.forma, dest: u.dest }; }, id);
      const cap = await foto('escaramuza-mando');
      const cifras = await estado(() => { const e = window.__mn.estado(); return { tri: e.tri, llamadas: e.llamadas }; });
      await estado(() => { let n = 0; while (window.__mn.S.fase !== 'fin' && n++ < 300) window.__mn.salta(10); });
      await page.waitForSelector('#mn-seguir', { state: 'visible', timeout: 20000 });
      await page.click('#mn-seguir');
      await page.waitForSelector('#hoja .esc-res', { state: 'visible', timeout: 20000 });
      const res = await estado(() => document.querySelector('#hoja .esc-res').textContent);
      const capFin = await foto('escaramuza-resultado');
      await page.click('#hoja [data-act="hojax"]'); await espera(800);
      const despues = await estado(() => localStorage.getItem('aqvila-save-v1'));
      await page.setViewportSize({ width: 390, height: 844 }); await espera(800);
      const ok = elegidos.includes(id) && !noMueve && !noForma && efecto.mueve && efecto.testudo && guardada === despues && !(await page.locator('#mn').count());
      return { ok, detalle: ok ? 'manípulo ' + id + ' en marcha y en testudo; «' + res + '»; ' + cifras.tri + ' triángulos, ' + cifras.llamadas + ' llamadas; partida guardada intacta'
        : 'elegido ' + JSON.stringify(elegidos) + ', aviso mover «' + noMueve + '», aviso testudo «' + noForma + '», efecto ' + JSON.stringify(efecto) + ', guardada igual ' + (guardada === despues), captura: ok ? cap : capFin };
    });

    /* CG6: a pie. Se baja con un hastati, se mira que la cámara va al hombro, se anda con la palanca y se vuelve al mando.
       Se mira el EFECTO (posiciones, cámara, reloj del simulador). El dibujo va a ~1 fotograma/s: se avanza a mano con cuadro(0.1) */
    await paso('Escaramuzas: bajar a pie y volver al mando', 'batallas', async () => { try { return await bajarApie(); } finally {
      /* pase lo que pase, se deja la página como la encontró (en vertical, sin la pantalla de mando): si no, los pasos siguientes fallan */
      await estado(() => { if (window.__mn && !window.__mn.cerrado && window.__mn.terminar) window.__mn.terminar(); }).catch(() => { }); await espera(800);
      if (await page.locator('#hoja [data-act="hojax"]').count()) await page.click('#hoja [data-act="hojax"]').catch(() => { });
      await page.setViewportSize({ width: 390, height: 844 }); await espera(800);
    } });
    async function bajarApie() {
      /* el menú se toca en vertical; tras el paso anterior la hoja del resultado (.esc-fin) sigue en la página, así que se mira el botón */
      if (!(await page.locator('[data-act="escempieza"]').count())) { await page.click('#menu .mesc'); await espera(800); }
      await page.setViewportSize({ width: 844, height: 390 }); await espera(500);
      await page.click('[data-act="escempieza"]');
      await page.waitForFunction(() => window.__mn && window.__mn.lista === true, null, { timeout: 180000 }).catch(() => { });
      if (!(await estado(() => !!(window.__mn && window.__mn.lista)))) return { ok: false, detalle: 'la pantalla de mando no llegó a estar lista', captura: await foto('apie-carga') };
      await estado(() => window.__mn.pausa(false)); await espera(800);
      const id = await estado(() => { const u = window.__mn.S.man.find(u => u.lado === 0 && u.tropa === 'hastati') || window.__mn.S.man.find(u => u.lado === 0); window.__mn.elegir([u.id]); return u.id; });
      const no = await estado(i => window.__mn.bajar(i), id);
      /* LP7: «Bajar a pie» abre el control del bloque (gobierno/maquetas/bloque/) en una capa; la batalla grande espera en pausa */
      await page.waitForFunction(() => { const a = window.__mn.apie(); return a && a.lista; }, null, { timeout: 180000 }).catch(() => { });
      const a0 = await estado(() => window.__mn.apie());
      if (no || !a0 || !a0.lista) return { ok: false, detalle: 'no baja: «' + no + '»', captura: await foto('apie-no') };
      const t0 = await estado(() => window.__mn.S.t);
      /* se dibuja el frente (lo que hace el dedo) y el bloque marcha hacia él */
      const noF = await estado(() => window.__mn.frente({ x: -10, z: -14 }, { x: 12, z: -20 }));
      await estado(() => { for (let k = 0; k < 40; k++) window.__mn.cuadro(0.1); });
      const a1 = await estado(() => window.__mn.apie());
      const anda = Math.hypot(a1.r.pose.x - a0.r.pose.x, a1.r.pose.z - a0.r.pose.z);
      await espera(4000);
      const cap = await page.screenshot({ path: join(CAPS, String(++n).padStart(2, '0') + '-escaramuza-apie.jpg'), type: 'jpeg', quality: 72, timeout: 120000 }).then(() => String(n).padStart(2, '0') + '-escaramuza-apie.jpg').catch(() => null);
      const u1 = await estado(() => ({ t: window.__mn.S.t, pausa: window.__mn.S.pausa, oculto: getComputedStyle(document.getElementById('mn-abajo')).display === 'none' }));
      await estado(() => window.__mn.subir()); await espera(1500);
      const arriba = await estado(() => ({ a: window.__mn.apie(), y: window.__mn.camaraY(), sel: window.__mn.estado().sel, pausa: window.__mn.S.pausa }));
      const ok = !noF && anda > 2 && a1.estado.T > a0.estado.T + 3 && u1.pausa && u1.t === t0 && u1.oculto && !arriba.a && !arriba.pausa && arriba.y > 30 && arriba.sel.includes(id);
      return { ok, detalle: 'a pie, el bloque marcha ' + anda.toFixed(1) + ' m hacia el frente dibujado en ' + (a1.estado.T - a0.estado.T).toFixed(1) + ' s; la batalla grande espera (' + t0.toFixed(1) + ' s); arriba de nuevo a ' + (+arriba.y).toFixed(0) + ' m', captura: cap };
    }

    await paso('Nueva partida: se ve el mapa', 'comun', async () => {
      await page.click('#menu [data-act="new"]'); await espera(2500); await cierraAvisos();
      await estado(() => { const a = Game.state.ajustes; if (a) a.asesor = false; Game.autoVivo = true; });      // CN14-C: el asesor de serie no cambia el recorrido
      const ok = await estado(() => !!Game.state && !UI.menu && Game.myCities().includes('roma'));
      return { ok, detalle: ok ? await estado(() => Game.dateStr(Game.state.t)) : 'no hay partida', captura: await foto('ciudad-inicio') };
    });

    await paso('Ciudad en 3D', 'cerebro', async () => {
      await espera(3000);   // la partida nueva abre en la Ciudad
      const ok = await estado(() => !document.getElementById('citywrap').hidden && !!document.querySelector('#citywrap canvas'));
      return { ok, detalle: ok ? '' : 'no aparece la vista 3D de la ciudad', captura: await foto('ciudad') };
    });

    await paso('Ajustes y asesor: dificultad en Ajustes (☰)', 'musculo', async () => {
      await page.click('#bmas'); await espera(500);   // MN1: Ajustes se abre desde ☰, ya no hay pestaña «Gobierno»
      await page.click('#hoja [data-act="hoja"][data-v="ajustes"]'); await espera(400);   // K12a: Ajustes es una hoja inferior
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

    await paso('Construir un edificio', 'cerebro', async () => {
      // Ciudad: se elige una ficha de la bandeja, se ve el fantasma, se pulsa «Construir aquí»; luego ficha de pieza y Gobierno limpio
      const fallos = [];
      await page.click('#tabs3 [data-v="ciudad"]'); await espera(1500); await cierraAvisos();
      // CD1/CDe1: ya no hay bandeja .pza; se abre «Construir» (#cbtn), la familia Producción y la granja
      await page.waitForSelector('#cbtn', { timeout: 10000 }).catch(() => fallos.push('no hay botón «Construir»'));
      await page.locator('#cbtn').first().tap().catch(() => fallos.push('no se pudo pulsar «Construir»')); await espera(600);
      await page.locator('#cmenu [data-f="produccion"]').first().tap().catch(() => fallos.push('no se abre la familia Producción')); await espera(600);
      await page.locator('#cmenu [data-id="granja"]').first().tap().catch(() => fallos.push('no está la granja en el menú')); await espera(1200);
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
      // CDe4: antes de «Construir aquí» se comprueba con la misma función que usa el juego al colocar (notaSitio → huella de ciudad.js) que el sitio está libre;
      // si no, se busca otro libre y válido y se toca ahí (hasta 5 intentos). Se arregla la prueba: el juego decía «Mal sitio: Ya hay un edificio» con razón.
      const sitioLibre = () => estado(() => { const s = UI.sel3; if (!s || !s.id || s.mover) return false; const n = Game.notaSitio('roma', s.id, s.x, s.z); return !!(n && n.vale) && !document.getElementById('b-si').disabled; });
      const probados = [], nObras = () => estado(() => Game.state.cities.roma.obras.length);
      /* JU1 + CDe4: con fotogramas lentos (render por software) el botón desaparece al pulsarlo antes de que Playwright reciba el acuse del clic, y entre
         comprobar el sitio y pulsar pueden pasar segundos (la ciudad sigue viva). Por eso se comprueba y se pulsa en UN solo paso dentro de la página;
         si el sitio resulta ocupado, se busca otro y se repite (hasta 5 veces). Se mira el efecto (la obra entra en la cola), no el acuse. */
      for (let k = 0; k < 5 && !(await nObras()); k++) {
        for (let j = 0; j < 5 && ((k > 0 && j === 0) || !(await sitioLibre())); j++) {
          const pt = await estado(ex => { const E = Game.ciudadE('roma'), pz = (UI.sel3 && UI.sel3.id) || (UI.bsel && UI.bsel.id) || 'granja'; let m = null; for (let x = E.foro.x - 250; x <= E.foro.x + 250; x += 10) for (let z = E.foro.z - 250; z <= E.foro.z + 250; z += 10) { if (ex.some(q => q.x === x && q.z === z)) continue; const n = Game.notaSitio('roma', pz, x, z); if (n && n.vale && (!m || n.nota > m.n)) m = { n: n.nota, x, z }; } if (!m) return null; UI.cityV.mirar(m.x, m.z, 300, 0); return { ...UI.cityV.aPantalla(m.x, m.z, 0), gx: m.x, gz: m.z }; }, probados);
          if (!pt) { fallos.push('no hay ningún sitio libre y válido'); break; }
          probados.push({ x: pt.gx, z: pt.gz }); await espera(800); await page.touchscreen.tap(pt.x, pt.y); await espera(700);
        }
        const r = await estado(() => { const s = UI.sel3, bs = document.getElementById('b-si'), n = s && s.id && !s.mover && Game.notaSitio('roma', s.id, s.x, s.z); if (!(n && n.vale) || bs.disabled) return 'ocupado: ' + (n && n.razones ? n.razones.join(', ') : 'sin selección'); bs.click(); return 'pulsado'; });
        await espera(1800);
        if (!(await nObras())) { if (k === 4) fallos.push('«Construir aquí» no metió la obra tras 5 intentos (' + r + ' · ' + await estado(() => document.getElementById('linea').textContent.trim().slice(0, 80)) + ')'); }
      }
      await espera(300);
      const obra = await estado(() => { const c = Game.state.cities.roma.obras[0]; return c ? { n: Game.state.cities.roma.obras.length, t: c.b ? DATA.BUILD[c.b].n : c.pieza } : null; });
      if (!obra || obra.n !== 1) fallos.push('la obra no entró en la cola (' + (obra ? obra.n : 0) + ' obras)');
      // ficha de una pieza ya colocada
      let fichaOk = false;
      for (let k = 0; k < 4 && !fichaOk; k++) {
        const e = await estado(() => { const E = Game.ciudadE('roma'), e = E.edificios.find(q => !q.obra && !q.ruina && DATA.BUILD[q.tipo] && q.x !== undefined); if (!e) return null; UI.cityV.mirar(e.x, e.z, 260, 0); return { x: e.x, z: e.z }; });
        if (!e) break; await espera(2500);
        const p = await page.evaluate(e => UI.cityV.aPantalla(e.x, e.z, 4), e); await page.touchscreen.tap(p.x, p.y); await espera(700);
        fichaOk = await estado(() => !!document.querySelector('#fichab .ficha [data-act="mejpz"], #fichab .ficha .nv5-no'));   // CE3: regla de CE1, ningún edificio pasa del Foro; al nivel del Foro la ficha enseña el aviso «⚠ Sube antes el Foro» en vez de «Mejorar»
      }
      if (!fichaOk) fallos.push('la ficha de una pieza no enseña «mejorar»');
      const captura2 = await foto('construir-ficha');
      await estado(() => { const c = document.querySelector('#fichab [data-act="cclose"]'); if (c) c.click(); });
      await page.click('#citybtn'); await espera(1200);   // MN1: lo que era «Gobierno» es ahora la ficha de ROMA ▾ (#hoja .fciu)
      const gob = await estado(() => { const f = document.querySelector('#hoja .fciu'), c = document.querySelector('#hoja .hcuerpo'); if (!f || !c) return { falta: true }; return { up: f.querySelectorAll('[data-act="up"]').length, solar: /solar/i.test(f.innerText), anillo: !!f.querySelector('.gani'), atajos: f.querySelectorAll('.gatajos .gat').length, scroll: Math.round(f.getBoundingClientRect().height - c.clientHeight) }; });
      if (gob.falta) fallos.push('ROMA ▾ no abre la hoja con la ficha de la ciudad (.fciu)');
      if (gob.up) fallos.push('la ficha de ROMA ▾ tiene botones de subir edificio'); if (gob.solar) fallos.push('la ficha de ROMA ▾ dice «solar»');
      if (!gob.falta && (!gob.anillo || gob.atajos < 4)) fallos.push('la ficha de ROMA ▾ (K12a) sin anillo de felicidad o sin atajos (' + gob.atajos + ')'); if (gob.scroll > 2) fallos.push('la ficha de ROMA ▾ no cabe en la hoja: hace scroll (' + gob.scroll + ' px)');
      const enObras = await estado(() => { const f = document.querySelector('#hoja .fciu'); return !!f && /obra|construy|hasta|⏳|🔨/i.test(f.innerText); });
      await estado(() => { const x = document.querySelector('#hoja [data-act="hojax"]'); if (x) x.click(); }); await espera(300);
      await page.click('#tabs3 [data-v="imperio"]'); await espera(1000);
      const imp = await estado(() => document.getElementById('view').innerText.length > 40); if (!imp) fallos.push('Imperio no abre');
      await page.click('#tabs3 [data-v="ciudad"]'); await espera(500);
      return { ok: !fallos.length, detalle: fallos.length ? fallos.join('; ') : 'en obras: ' + obra.t + ' · fantasma «' + lin.slice(0, 50) + '» · ficha con mejorar · ficha de ROMA ▾ limpia' + (enObras ? '' : ' (sin texto de obra en la ficha de ROMA ▾)'), captura };
    });

    await paso('Reclutar tropas', 'cerebro', async () => {
      await page.click('#tabs3 [data-v="mapa"]'); await espera(500); await page.click('#tabs3 [data-v="tropas"]'); await espera(500);   // MN1: sin modos; la barra lleva al mapa y a Tropas
      const b = page.locator('#view [data-act="train"]:not(.no)').first(); await b.scrollIntoViewIfNeeded(); await b.click(); await espera(500);
      const q = await estado(() => Game.state.cities.roma.train.map(t => t.n + ' ' + DATA.UNITS[t.u].n).join(', '));
      return { ok: !!q, detalle: q ? 'en instrucción: ' + q : 'no se reclutó nada', captura: await foto('reclutar') };
    });

    await paso('Abrir el Códice', 'cerebro', async () => {
      await page.click('#bmas'); await page.click('#hoja [data-act="tab"][data-v="log"]'); await espera(500);
      await page.click('#view [data-act="codice"]'); await espera(500);
      const r = await page.evaluate(() => ({ n: document.querySelectorAll('#view .cdx').length, h: document.querySelectorAll('#view .lic-h').length, w: document.documentElement.scrollWidth }));
      const ok = r.n >= 15 && r.h > 0;
      const captura = await foto('codice');
      await page.click('#view [data-act="codice"][data-v=""]'); await espera(300);
      return { ok, detalle: r.n + ' fichas, ' + r.h + ' históricas', captura };
    });

    let objetivo = '';
    await paso('Atacar una ciudad vecina', { de: 'musculo', para: ['batallas'] }, async () => {
      objetivo = await estado(() => Game.neighbors('roma').filter(n => Game.state.cities[n].owner !== 'roma' && !Game.edge('roma', n)[2]).sort((a, b) => Game.power(Game.state.cities[a].units) - Game.power(Game.state.cities[b].units))[0] || '');
      if (!objetivo) return { ok: false, detalle: 'Roma no tiene vecina enemiga por tierra' };
      await page.evaluate(id => { UI.sel = id; UI.sheetKey = ''; }, objetivo);
      await page.click('#tabs3 [data-v="mapa"]'); await espera(600);
      await page.click('#sheet [data-act="pick"]'); await espera(500);
      const captura = await foto('atacar');
      await page.click('#mbox [data-act="send"]'); await espera(400);
      const ok = await estado(() => Game.state.marches.some(m => m.owner === 'roma'));
      return { ok, detalle: ok ? 'el ejército marcha hacia ' + await page.evaluate(id => DATA.CITIES[id].n, objetivo) : 'el ejército no salió', captura };
    });

    await paso('Llega la batalla', { de: 'batallas', para: ['musculo'] }, async () => {
      // se adelanta el reloj del juego en vez de esperar meses de campaña
      for (let i = 0; i < 400; i++) {
        const hay = await estado(() => { for (let k = 0; k < 20 && !Game.state.pending.length && !Game.state.over; k++) Game.tick(0.25); return Game.state.pending.length > 0; });
        await cierraAvisos(); if (hay) break;
      }
      await page.waitForSelector('#mbox [data-act="bview"]', { timeout: 15000 });
      return { ok: true, detalle: await estado(() => document.querySelector('#mbox h2').textContent), captura: await foto('aviso-batalla') };
    });

    // GC4: la batalla es la Guerra (js/ui-guerra.js). Con más de 600 hombres pasa antes por la maniobra.
    await paso('Dirigir la batalla (horizontal): una orden con el dedo', { de: 'batallas', para: ['musculo'] }, async () => {
      await page.setViewportSize({ width: 844, height: 390 });
      await page.click('#mbox [data-act="bview"]'); await espera(1500);
      for (let i = 0; i < 14 && !(await page.locator('#gu').count()); i++) {
        if (await page.locator('.m-choque [data-a="batalla"]').count()) { await page.click('.m-choque [data-a="batalla"]'); await espera(800); break; }
        if (await page.locator('[data-a="pasar"]').count()) { await page.click('[data-a="pasar"]'); await espera(400); } else await espera(400);
      }
      await page.waitForFunction(() => window.__gc && window.__gc.lista === true, null, { timeout: 120000 }).catch(() => {});
      const lista = await estado(() => !!(window.__gc && window.__gc.lista));
      if (!lista) return { ok: false, detalle: 'la pantalla de la batalla no llegó a estar lista' };
      await espera(2000);
      const retirar = await page.isVisible('#gu-retirar'), cuerpos = await page.locator('#gu .cuerpo').count(), ordenes = await page.locator('#gu .orden').count();
      /* GM5: de lejos los botones son Avanzar/Escudos/Testudo; ya trabados, Empujar/Aguantar/Relevo. Se pulsa el segundo: Escudos o Aguantar */
      await page.tap('#gu .cuerpo[data-i="1"]'); const o2 = await page.locator('#gu .orden').nth(1).getAttribute('data-o'); await page.tap('#gu .orden[data-o="' + o2 + '"]'); await espera(500);
      const empuja = await estado(o => window.__gc.B.sect[1].c[0].postura === o, o2);
      const captura = await foto('batalla');
      const ok = retirar && cuerpos === 3 && ordenes === 4 && empuja;
      return { ok, detalle: ok ? 'Retirarse, tres cuerpos, cuatro órdenes; «' + o2 + '» obedece' : 'retirar ' + retirar + ', cuerpos ' + cuerpos + ', órdenes ' + ordenes + ', empuja ' + empuja, captura };
    });

    await paso('La batalla termina y se aplica el resultado', { de: 'batallas', para: ['musculo'] }, async () => {
      // se juega hasta el final con el bot de la campaña de pruebas; el cartel final da paso al resultado
      await estado(() => { const g = window.__gc; let n = 0; while (g.B.fase !== 'fin' && n++ < 600) { Game.botGuerra(g.B); g.salta(1.5); } });
      await page.waitForSelector('#gu-seguir:visible', { timeout: 20000 });
      await page.click('#gu-seguir');
      await page.waitForSelector('#mbox [data-act="bdone"]', { timeout: 20000 });
      const titulo = await estado(() => document.querySelector('#mbox h2').textContent);
      const captura = await foto('resultado');
      await page.click('#mbox [data-act="bdone"]'); await espera(500);
      await page.setViewportSize({ width: 390, height: 844 }); await espera(800); await cierraAvisos();
      const ok = await estado(() => !document.querySelector('#gu') && Game.state.stats.battles >= 1);
      return { ok, detalle: titulo, captura };
    });

    await paso('Recargar sin red: la partida sigue', 'musculo', async () => {
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

    await paso('Mapa por escalones: tocar Italia acerca y «← volver» devuelve', 'musculo', async () => {
      await estado(() => { Game.state.speed = 0; UI.dirty = true; document.querySelector('#tabs3 [data-v="mapa"]').click(); const m = document.getElementById('modal'); if (m) m.hidden = true; UI.map.esc.anim = null; UI.map.esc.zona = null; UI.map.esc.pila = []; UI.map.c.x = 94; UI.map.c.z = 46; UI.map.c.dist = 330; UI.map.clamp(); });
      await espera(1500);
      const antes = await estado(() => ({ x: UI.map.c.x, z: UI.map.c.z, dist: UI.map.c.dist, zonas: [...document.querySelectorAll('.mlabel.zona')].filter(e => e.style.display !== 'none').length }));
      const fotoMare = await foto('escalon-mare');
      await page.evaluate(() => [...document.querySelectorAll('.mlabel.zona')].find(e => e.textContent === 'Italia').click());
      await espera(1500); await page.waitForFunction(() => !UI.map.esc.anim, null, { timeout: 20000 }).catch(() => {});   // C17: con ≈1 fotograma/s la animación de 0,6 s puede no haber acabado a los 1,5 s
      const dentro = await estado(() => ({ dist: UI.map.c.dist, migas: document.querySelector('.mmigas').innerText.replace(/\s+/g, ' '), volver: !!document.querySelector('.mmigas [data-volver]') }));
      const fotoZona = await foto('escalon-italia');
      await page.evaluate(() => document.querySelector('.mmigas [data-volver]').click());
      await espera(3000);   // 13/11: con la máquina cargada la animación de vuelta tardaba más de 1,5 s y el juez fallaba sin que el juego fallara
      const fin = await estado(() => ({ x: UI.map.c.x, z: UI.map.c.z, dist: UI.map.c.dist, migas: document.querySelector('.mmigas').innerText.replace(/\s+/g, ' ') }));
      const igual = Math.abs(fin.x - antes.x) < 0.01 && Math.abs(fin.z - antes.z) < 0.01 && Math.abs(fin.dist - antes.dist) < 0.01;
      const ok = antes.zonas === 8 && dentro.dist < antes.dist * 0.6 && /Italia/.test(dentro.migas) && dentro.volver && igual && !/Italia/.test(fin.migas);
      return { ok, detalle: ok ? 'ocho zonas; Italia acerca la cámara (' + Math.round(antes.dist) + ' a ' + Math.round(dentro.dist) + ') y «← volver» la devuelve' : 'zonas ' + antes.zonas + ', dist ' + Math.round(antes.dist) + ' a ' + Math.round(dentro.dist) + ', migas «' + dentro.migas + '», volver ' + dentro.volver + ', igual ' + igual + ', migas finales «' + fin.migas + '»', captura: fotoZona, detalle2: fotoMare };
    });

    await paso('C8b menú del mapa en cinco cosas; se entra tocando Roma y la miga devuelve al mapa (≥44 px, ≥11 px)', 'musculo', async () => {
      await estado(() => { Game.state.speed = 0; UI.dirty = true; document.querySelector('#tabs3 [data-v="mapa"]').click(); const m = document.getElementById('modal'); if (m) m.hidden = true; });
      await espera(1500);
      const ves = () => estado(() => Object.fromEntries(['res', 'datebox', 'bmas', 'turno', 'tabs3', 'citybtn', 'miga', 'zoom'].map(i => { const e = document.getElementById(i), r = e.getBoundingClientRect(), cs = getComputedStyle(e); return [i, !e.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.bottom > 0 && r.top < innerHeight]; })));
      const medir = () => estado(() => { const m = document.getElementById('miga'), b = document.getElementById('miga-b'), t = document.getElementById('miga-t'); if (!m || m.hidden) return { vis: false, tab: UI.tab }; const r = b.getBoundingClientRect(); return { vis: true, tab: UI.tab, t: t.innerText.replace(/\s+/g, ' '), b: b.innerText, alto: r.height, fuente: parseFloat(getComputedStyle(b).fontSize), dentro: r.left >= 0 && r.right <= innerWidth, sinTapar: r.bottom < innerHeight - 100 }; });
      const v = await ves(); await foto('menu-mapa');
      const cinco = v.res && v.datebox && v.bmas && v.turno && v.tabs3, fuera = !v.citybtn && !v.miga && !v.zoom;
      // MN1: en horizontal la barra de seis es una columna fina a la izquierda; tira, fecha, ☰ y «Pasar turno» siguen a la vista
      await page.setViewportSize({ width: 844, height: 390 }); await espera(1200);
      const vh = await ves(), col = await estado(() => { const r = document.getElementById('tabs3').getBoundingClientRect(); return { w: Math.round(r.width), l: Math.round(r.left), alto: Math.round(r.height) }; });
      await foto('menu-mapa-h');
      await page.setViewportSize({ width: 390, height: 844 }); await espera(1200);
      const horiz = vh.res && vh.datebox && vh.bmas && vh.turno && vh.tabs3 && col.w < 90 && col.l < 10 && col.alto > col.w;
      await estado(() => UI.map.cities.roma.el.click()); await espera(800);
      const ficha = await estado(() => { const b = document.querySelector('#sheet [data-act="entrar"]'); return b ? b.innerText : ''; });
      await estado(() => UI.map.cities.roma.el.click()); await espera(3500);
      const ciu = await medir(); await foto('miga-ciudad');
      await page.click('#miga-b'); await espera(2500);
      const vuelta = await medir();
      const ok = cinco && fuera && horiz && /Entrar en Roma/.test(ficha) && ciu.vis && ciu.tab === 'city' && /Ciudad/.test(ciu.t) && /Salir/.test(ciu.b) && ciu.alto >= 44 && ciu.fuente >= 11 && ciu.dentro && ciu.sinTapar && vuelta.tab === 'map' && !vuelta.vis;
      return { ok, detalle: ok ? 'en el mapa: tira, ☰, «Pasar turno» y la barra de seis (en horizontal, columna de ' + col.w + ' px a la izquierda); la ficha dice «' + ficha + '»; tocar Roma entra y «' + ciu.b + '» vuelve al mapa' : JSON.stringify({ v, vh, col, ficha, ciu, vuelta }) };
    });

    await paso('Barra de seis: Ciudad, Senado, Saber, Tropas, Mapa e Imperio (palabra entera, ≥44 px, cada toque a su vista)', 'musculo', async () => {
      await estado(() => { Game.state.speed = 0; const m = document.getElementById('modal'); if (m) m.hidden = true; const x = document.querySelector('#hoja [data-act="hojax"]'); if (x && !document.getElementById('hoja').hidden) x.click(); }); await espera(400);
      const VISTA = { ciudad: 'city', senado: 'senado', saber: 'saber', tropas: 'army', mapa: 'map', imperio: 'imperio' }, fallos = [];
      const med = await estado(() => [...document.querySelectorAll('#tabs3 [data-act="barra"]')].map(b => { const r = b.getBoundingClientRect(), s = b.querySelector('span') || b, cs = getComputedStyle(b); return { v: b.dataset.v, t: s.textContent.trim(), vis: !b.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.top >= 0 && r.bottom <= innerHeight + 1, alto: Math.round(r.height), corta: b.scrollWidth > b.clientWidth || s.scrollWidth > s.clientWidth || s.getBoundingClientRect().width > b.clientWidth + .5 }; }));
      const vs = med.map(m => m.v).join(',');
      if (vs !== Object.keys(VISTA).join(',')) fallos.push('la barra tiene «' + vs + '»');
      for (const m of med) { if (!m.vis) fallos.push(m.v + ' no se ve'); if (m.alto < 44) fallos.push(m.v + ' mide ' + m.alto + ' px de alto'); if (m.corta || m.t.length < 4) fallos.push(m.v + ' con la palabra cortada («' + m.t + '»)'); }
      let captura = '';
      for (const v of Object.keys(VISTA)) {
        await page.click('#tabs3 [data-act="barra"][data-v="' + v + '"]'); await espera(v === 'mapa' || v === 'ciudad' ? 1500 : 800);
        await estado(() => { const m = document.getElementById('modal'); if (m && !m.hidden) m.hidden = true; });
        const r = await estado(v => { const on = [...document.querySelectorAll('#tabs3 [data-act="barra"].on')].map(b => b.dataset.v); const malos = [...document.querySelectorAll('button, [data-act]')].filter(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && r.bottom > 0 && r.top < innerHeight && /^\s*(Gobierno|Guerra)\s*$/i.test(e.innerText || ''); }).map(e => e.innerText.trim()); return { vista: document.getElementById('app').dataset.vista, on, malos }; }, v);
        if (r.vista !== VISTA[v]) fallos.push(v + ' lleva a «' + r.vista + '»'); if (r.on.join() !== v) fallos.push(v + ' marca .on en «' + r.on.join() + '»'); if (r.malos.length) fallos.push(v + ': botón visible «' + r.malos[0] + '»');
        if (v === 'senado') captura = await foto('barra-seis');
      }
      await page.click('#tabs3 [data-act="barra"][data-v="ciudad"]'); await espera(1200);
      return { ok: !fallos.length, detalle: fallos.length ? fallos.join('; ') : 'seis botones de ' + Math.min(...med.map(m => m.alto)) + ' px o más, palabras enteras (' + med.map(m => m.t).join(' · ') + '); cada toque abre su vista y se marca', captura };
    });

    await paso('CN22 avisos: máx. 2 avisos y tarjeta de estación baja', 'cerebro', async () => {
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

    await paso('R3 pausas: la obra que termina para el reloj con su motivo; el ajuste cambia', 'musculo', async () => {
      await mkdir(CAPS_TAREA, { recursive: true });
      const tarea = async nombre => { await page.screenshot({ path: join(CAPS_TAREA, nombre), type: 'jpeg', quality: 80 }); return nombre; };
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
      await page.click('#bmas'); await espera(600);   // MN1: Ajustes, desde ☰
      await page.click('#hoja [data-act="hoja"][data-v="ajustes"]'); await espera(400);   // K12a: Ajustes es una hoja inferior
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

    await paso('R4 aviso del asesor: una frase corta que se lee entera', 'musculo', async () => {
      const tarea = async nombre => { await page.screenshot({ path: join(CAPS_TAREA, nombre), type: 'jpeg', quality: 80 }); return nombre; };
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

    await paso('Región de Italia: mapa con 7 ciudades', 'musculo', async () => {
      await page.evaluate(() => Game.save());
      await page.reload({ waitUntil: 'load' });
      await page.waitForSelector('#menu [data-act="newregion"]', { timeout: 30000 });
      await page.waitForFunction(() => window.UI && window.UI.map, null, { timeout: 60000 }).catch(() => { });
      await page.click('#menu [data-act="newregion"]'); await espera(3500); await cierraAvisos();
      await page.evaluate(() => { Game.state.speed = 0; UI.dirty = true; document.querySelector('#tabs3 [data-v="mapa"]').click(); }); await espera(2500);
      const r = await estado(() => ({ reg: Game.regionId(), vis: UI.map ? Object.keys(UI.map.cities).filter(i => UI.map.cities[i].grp.visible && Game.state.cities[i]).length : -1, fantasmas: UI.map ? Object.keys(UI.map.cities).filter(i => UI.map.cities[i].grp.visible && !Game.state.cities[i]).length : 0, rutas: UI.map ? UI.map.aristas.filter(e => e.line.visible).length : -1 }));
      const ok = r.reg === 'italia' && r.vis === 7 && r.fantasmas === 0;
      return { ok, detalle: ok ? '7 ciudades visibles, ' + r.rutas + ' rutas' : 'región ' + r.reg + ', visibles ' + r.vis + ', fantasmas ' + r.fantasmas, captura: await foto('italia') };
    });

    await paso('I8 partida corta: menú, en pie, fundar, continuar y final con resumen', 'musculo', async () => {
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
      await cierraAvisos();   // CN18: «Dónde lo dejaste» sale al continuar y tapa los botones
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
  apunta('Sin errores de consola' + (AREA ? ' (pasos de ' + AREA + ')' : ''), errores.length === 0, errores.length ? errores.length + ' error(es): ' + errores.slice(0, 3).join(' ‖ ') : '');
}

if (!RAPIDO) await navegador();

/* ---------- 2. Juez de la guerra jugada de verdad (GC2: gobierno/juez-guerra.mjs, ~4 min, hasta 30 en una máquina lenta; solo en el recorrido completo) ---------- */
if (!RAPIDO && !AREA) {   // con --area batallas, juez-area.mjs lo pasa aparte
  console.log('Juez 2 · Guerra jugada de verdad (gobierno/juez-guerra.mjs)');
  const r = spawnSync(process.execPath, ['gobierno/juez-guerra.mjs'], { cwd: RAIZ, encoding: 'utf8', timeout: 1800000 });
  const lineas = (r.stdout || '').split('\n'), mal = lineas.filter(l => /MAL:|^prueba:|^consola:|^excepción:/.test(l)), avisos = lineas.filter(l => /AVISO/.test(l)).length, bien = lineas.filter(l => /^\s*bien:/.test(l)).length;
  apunta('Guerra jugada de verdad (entrar, salir, maniobra, primer toque, arte)', r.status === 0, r.status === 0 ? bien + ' comprobaciones bien' + (avisos ? ' · ' + avisos + ' aviso(s) de fallos conocidos del juego (ver salida de juez-guerra.mjs)' : '') : (mal.slice(0, 3).join(' | ') || (r.stderr || '').trim().split('\n').slice(-3).join(' | ')).slice(0, 400));
}

const fallos = pasos.filter(p => !p.ok);
const informe = { fecha: new Date().toISOString(), segundos: Math.round((Date.now() - t0) / 1000), ok: fallos.length === 0, rapido: RAPIDO, area: AREA, pasos, errores };
if (!RAPIDO) await writeFile(join(CAPS, 'informe.json'), JSON.stringify(informe, null, 1));
console.log('\n' + (informe.ok ? 'VEREDICTO: APTO' : 'VEREDICTO: NO APTO (' + fallos.length + ' fallo' + (fallos.length > 1 ? 's' : '') + ')') + ' · ' + pasos.length + ' comprobaciones · ' + informe.segundos + ' s' + (AREA ? ' · área ' + AREA : '') + (RAPIDO ? '' : ' · capturas en ' + CAPS.slice(RAIZ.length + 1) + '/'));
process.exit(informe.ok ? 0 : 1);
