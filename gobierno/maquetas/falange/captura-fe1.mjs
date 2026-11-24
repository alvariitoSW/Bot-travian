/* AQVILA — FE1: fotos de la falange contra elefantes en la escena de verdad (index.html?rival=elefantes), con Playwright y render por software.
   Uso: node gobierno/maquetas/falange/captura-fe1.mjs [nombre …]   (sin nombres, todas). Deja FE1-*.jpg en gobierno/capturas-tarea/.
   Cada foto: una carga, semilla fija, las cinco filas bajadas y «Aguantar»; la partida salta sin dibujar hasta el momento pedido, y el dibujo
   del rival avanza con ella (__tp.rivPaso). Mide picas rotas, ensartadas, llamadas y errores. APTO o NO APTO. */
import { createRequire } from 'node:module';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import { createServer } from 'net';
const { chromium } = createRequire(import.meta.url)('playwright');
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../../..'), SAL = join(RAIZ, 'gobierno/capturas-tarea');
mkdirSync(SAL, { recursive: true });
const H = { width: 844, height: 390 }, V = { width: 390, height: 844 };
/* nombre, tamaño, vista (parámetros extra), hasta (condición sobre S), segundos de partida después */
const FOTOS = [
  ['h-carga', H, '', 'S.choque', 0.3],
  ['h-ensartado', H, '&lado=1&semilla=1', 'S.riv.ensartadas > 0', 3],
  ['v-picas-rotas', V, '', 'S.riv.ensartadas > 0', 6],
];
const pide = process.argv.slice(2), lista = pide.length ? FOTOS.filter(f => pide.includes(f[0])) : FOTOS;
const libre = () => new Promise((ok, mal) => { const s = createServer(); s.on('error', mal); s.listen(0, () => { const p = s.address().port; s.close(() => ok(p)); }); });
const espera = ms => new Promise(r => setTimeout(r, ms));
const PUERTO = await libre();
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO), '--bind', '127.0.0.1'], { cwd: RAIZ, stdio: 'ignore' });
let nav, mal = 0;
try {
  await espera(1200);
  nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [nombre, tam, extra, cond, luego] of lista) {
    const errores = [], page = await nav.newPage({ viewport: tam, deviceScaleFactor: 2 });
    page.on('console', m => { if (m.type() === 'error' && !/GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 200)); }); page.on('pageerror', e => errores.push(String(e).slice(0, 200)));
    let r = {};
    try {
      await page.goto(`http://127.0.0.1:${PUERTO}/gobierno/maquetas/falange/index.html?rival=elefantes${extra.includes('semilla') ? '' : '&semilla=12'}${extra}`, { waitUntil: 'load' });
      await page.waitForFunction('window.__tp && window.__tp.lista === true', null, { timeout: 300000, polling: 1000 });
      await page.waitForTimeout(1500);
      r = await page.evaluate(([cond, luego]) => {
        const tp = window.__tp, S = tp.S, F = tp.F; tp.parar(true);
        for (let i = 0; i < 5; i++) F.fila(i, true); F.orden('aguantar');
        const c = new Function('S', 'return ' + cond);
        const anda = s => { for (let t = 0; t < s - 1e-6; t += 0.1) { tp.salta(0.1, false); tp.rivPaso(0.1); } };
        let k = 0; while (!c(S) && k++ < 3000) anda(0.1);
        anda(luego);
        return { T: +S.T.toFixed(1), llego: c(S) };
      }, [cond, luego]);
      await page.waitForTimeout(800);
      Object.assign(r, await page.evaluate(() => { const S = window.__tp.S, i = window.__tp.info(); return { T2: +S.T.toFixed(1), rotas: S.riv.rotas, trozos: S.riv.trozos.length, clavados: S.riv.trozos.filter(t => t.bestia >= 0).length, ensartadas: S.riv.ensartadas, munones: S.fal.filter(h => h.picaRota && h.vivo).length, estados: S.riv.bestias.map(b => b.est + (b.vivo ? '' : '†')).join(' '), llamadas: i.llamadas, triangulos: i.triangulos }; }));
      await page.screenshot({ path: join(SAL, 'FE1-' + nombre + '.jpg'), type: 'jpeg', quality: 82 });
    } catch (e) { errores.push('guion: ' + String(e.message || e).split('\n')[0]); }
    const bien = r.llego && !errores.length && r.llamadas <= 30 && r.triangulos <= 750000;
    if (!bien) mal++;
    console.log(`${bien ? 'bien' : 'MAL '} FE1-${nombre}: ${JSON.stringify(r)}${errores.length ? ' errores: ' + errores.join(' | ') : ''}`);
    await page.close();
  }
} finally { if (nav) await nav.close(); srv.kill(); }
console.log(mal ? `NO APTO (${mal})` : 'APTO');
process.exit(mal ? 1 : 0);
