// EV8 · juega «Gobierno y ciudad juntos» con toques en un móvil simulado (390×844, dpr 1) y deja las capturas EV8-*.jpg
// en gobierno/capturas-tarea/. Elige plan, delega un cargo, mejora a mano, hace un acto, vota leyes y llega al final.
// Falla si hay errores de consola o algo se sale de 390.  Uso: node gobierno/maquetas/gobierno-turnos/captura.mjs [semilla=3]
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const PUERTO = 8700 + Math.floor(Math.random() * 200);
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO), '--bind', '127.0.0.1'], { cwd: AQUI, stdio: 'ignore' });
const fuera = c => { try { srv.kill(); } catch (_) { } process.exit(c); };
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch();
await mkdir(SALIDA, { recursive: true });
const prefijo = join(SALIDA, 'EV8-'), errores = [];
const bien = (ok, t) => { console.log((ok ? '  bien: ' : '  MAL: ') + t); if (!ok) errores.push('PRUEBA: ' + t); };
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true }), page = await ctx.newPage();
page.on('console', m => {
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  const url = (m.location() || {}).url || '';
  if (/imagenes\//.test(url) && /404/.test(m.text())) { console.log('  (aviso: falta ' + url.split('/').pop() + ')'); return; }
  errores.push(m.text().slice(0, 300)); console.log('  [' + m.type() + '] ' + m.text().slice(0, 300) + ' ' + url);
});
page.on('pageerror', e => { errores.push(e.message); console.log('  [error de página] ' + e.message.slice(0, 400)); });
const ev = () => page.evaluate(() => window.__ev8.estado());
const espera = ms => page.waitForTimeout(ms);
const toca = async sel => { await page.tap(sel); await espera(220); };
const clic = async sel => { await page.$eval(sel, el => el.dispatchEvent(new MouseEvent('click', { bubbles: true }))); await espera(220); };
const fotos = [];
const foto = async (n, ms = 350) => { await espera(ms); await page.screenshot({ path: prefijo + n + '.jpg', type: 'jpeg', quality: 85 }); fotos.push(n); console.log('  captura ' + n); };
const revisa = async t => {
  const r = await page.evaluate(() => {
    let fuera = 0; const malos = [];
    for (const el of document.querySelectorAll('#app *')) { if (el.closest('svg') || el.closest('.mapa')) continue; const q = el.getBoundingClientRect(); if (!q.width) continue; if (q.right > 390.5 || q.left < -0.5) { fuera++; malos.push(el.tagName + '.' + el.className); } }
    return { ancho: document.documentElement.scrollWidth, fuera, malos: malos.slice(0, 3) };
  });
  bien(r.ancho <= 390 && r.fuera === 0, `${t}: nada se sale de 390 (fuera ${r.fuera} ${r.malos.join(' ')})`);
};
const arriba = () => page.evaluate(() => { document.getElementById('cuerpo').scrollTop = 0; });

try {
  await page.goto(`http://127.0.0.1:${PUERTO}/?semilla=${op.semilla || 3}`);
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.waitForFunction(() => window.__ev8 && window.__ev8.lista);
  await toca('[data-a="nueva"]');
  let hechoMano = false, hechoActo = false, fotoMarcas = false, fotoJuicio = false, delegado = false;
  for (let vuelta = 0; vuelta < 14; vuelta++) {
    let s = await ev(); if (s.fase === 'fin') break;
    console.log(`Estación ${s.turno + 1} · fase ${s.fase}`);
    // 1 · consejo del año
    if (s.fase === 'consejo') {
      if ((await page.evaluate(() => window.__ev8.lugar())) !== 'consejo') await toca('#principal');
      const ids = await page.evaluate(() => { const R = window.__ev8.R, e = window.__ev8.estado(); const pr = x => x.tipo === 'obra' ? ({ granja: e.grano < 90 ? 95 : 20, foro: x.n === 2 ? 90 : 25, mercado: 85, muelle: 80, muralla: 50, templo: 40, cuartel: 20 })[x.obj] : x.tipo === 'saber' ? 74 : 30; return R.encargosPropuestos(e).filter(x => x.puede).sort((a, b) => pr(b) - pr(a)).map(x => x.id).slice(0, 3); });
      for (const id of ids) await clic(`.encargo[data-x="${id}"]`);
      if (!delegado) { await clic('.consejero [data-a="delegar"][data-x="edil"]'); delegado = true; }
      if (s.turno === 0) { await arriba(); await foto('01-consejo'); await page.evaluate(() => document.querySelector('.consejero').scrollIntoView()); await foto('01b-consejeros'); await revisa('consejo'); }
      await toca('#principal');
      s = await ev(); bien(s.plan.length === ids.length, `plan del año con ${s.plan.length} encargos`);
    }
    // 2 · Senado: juicio y cuestión de Estado
    if (await page.evaluate(() => window.__ev8.lugar()) !== 'senado') await toca('#principal');
    if (!fotoJuicio && s.turno >= 1) { await foto('05-juicio'); await revisa('juicio'); fotoJuicio = true; }
    await toca('#principal'); // a la cuestión de Estado
    const mejor = await page.evaluate(() => { const R = window.__ev8.R, e = window.__ev8.estado(); let b = 0, m = -1; e.cartas.forEach((l, i) => { const p = R.prevision(e, i); const bon = { edad: 25, estudiar: 4, impuestos: e.oro < 60 ? 8 : -4, reclutar: e.grano < 80 ? -12 : 2, socios: e.grano < 80 ? -12 : 2, granoBarato: e.plebe < 45 ? 8 : -6 }[l.tipo] || 0; if (p && !p.veto && p.esperado + bon > m) { m = p.esperado + bon; b = i; } }); return b; });
    await clic(`.carta[data-x="${mejor}"]`);
    // tratos con oro a los bandos que dudan si hay oro de sobra
    const tr = await page.evaluate(() => { const R = window.__ev8.R, e = window.__ev8.estado(), p = R.prevision(e); return p.esperado < 18 ? R.BS.filter(b => p.bandos[b].dudosos > 2 && !p.bandos[b].yaTeVotan && e.oro > 60) : []; });
    for (const b of tr) await clic(`.tratos [data-x="${b}"]`);
    if (s.turno === 1) { await arriba(); await foto('06-leyes'); await page.evaluate(() => document.querySelector('.cartas').scrollIntoView()); await foto('06b-leyes-ciudad'); await revisa('leyes'); }
    await toca('#principal');
    await espera(s.turno === 1 ? 2200 : 300);
    if (s.turno === 1) await foto('07-recuento', 0);
    await page.evaluate(() => window.__ev8.saltar()); await espera(300);
    if (s.turno === 1) await foto('07b-recuento-fin', 200);
    await toca('[data-a="a-ciudad"]');
    // 3 · ciudad: ficha y obra a mano
    if (!hechoMano) {
      await arriba(); await foto('02-ciudad', 900); await revisa('ciudad');
      await toca('[data-a="zoom"][data-x="1"]');
      await foto('02b-ciudad-zoom');
      await toca('[data-a="zoom"][data-x="0"]');
      const id = await page.evaluate(() => { const R = window.__ev8.R, e = window.__ev8.estado(); return R.ORDEN_EDIF.find(k => R.fichaEdificio(e, k).puede) || 'templo'; });
      await clic(`[data-edif="${id}"]`);
      await foto('03-ficha'); await revisa('ficha');
      const ok = await page.$(`[data-a="mejorar"][data-x="${id}"]:not([disabled])`);
      if (ok) { await toca(`[data-a="mejorar"][data-x="${id}"]`); hechoMano = (await ev()).ordenes.some(o => o.mano); bien(hechoMano, 'mejora a mano: ' + id); await foto('03b-ficha-en-obra'); }
      await toca('[data-a="cerrar"]');
    }
    // obras del plan que estén a mano y, si falta grano, las granjas
    for (let k = 0; k < 3; k++) { const b = await page.$('[data-a="empezar"]:not([disabled])'); if (!b) break; await clic('[data-a="empezar"]:not([disabled])'); }
    if ((await ev()).grano < 60) { await clic('[data-edif="granja"]'); if (await page.$('[data-a="mejorar"]:not([disabled])')) await clic('[data-a="mejorar"]:not([disabled])'); await clic('[data-a="cerrar"]'); }
    // 4 · un acto
    s = await ev();
    if (!hechoActo && s.oro >= 30) {
      await toca('[data-a="actos"]'); await foto('04-actos');
      await toca('[data-a="acto"][data-x="juegos"]'); await foto('04b-acto', 600);
      await toca('[data-a="aprende"]'); await foto('04c-aprendes', 800); await revisa('aprendes');
      await toca('[data-a="cerrar"]'); hechoActo = true;
    } else if (s.turno % 3 === 2 && s.oro >= 50) { await toca('[data-a="actos"]'); await toca('[data-a="acto"][data-b="ter"]'); await toca('[data-a="aprende"]'); await toca('[data-a="cerrar"]'); }
    // 5 · terminar la estación
    await page.evaluate(() => { document.getElementById('cuerpo').scrollTop = 0; });
    await toca('#principal'); await espera(300);
    const u = await page.evaluate(() => window.__ev8.ui());
    if (!fotoMarcas && u.informe && u.informe.aprobadas.length && u.informe.cambiosCiudad.length) {
      await foto('08-marcas', 600); await page.evaluate(() => document.querySelector('.cambios') && document.querySelector('.cambios').scrollIntoView()); await foto('08b-que-ha-cambiado'); await revisa('marcas'); fotoMarcas = true;
    }
    if ((await ev()).fase === 'fin') break;
  }
  const s = await ev();
  bien(s.fase === 'fin', 'la partida llega al final: ' + (s.fin && s.fin.titulo));
  await espera(1200); await foto('09-final', 300); await revisa('final');
  await toca('[data-a="ver-ciudad"]'); await foto('09b-ciudad-final', 600);
  // recargar no pierde la partida
  await page.reload(); await page.waitForFunction(() => window.__ev8 && window.__ev8.lista);
  bien((await ev()).turno === s.turno, 'recargar conserva la partida');
  bien(fotoMarcas, 'hubo una ley aprobada con marcas en la ciudad');
} catch (x) { errores.push('EXCEPCIÓN: ' + x.message); console.log(x); }
await br.close();
console.log('Capturas: ' + fotos.join(', '));
if (errores.length) { console.log('FALLA:\n' + errores.join('\n')); fuera(1); }
console.log('APTO'); fuera(0);
