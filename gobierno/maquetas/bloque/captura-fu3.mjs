/* FU3 · Capturas y prueba en navegador de la falange en la escena del bloque (?formacion=falange). Guarda en gobierno/capturas-tarea/:
   FU3-marcha-390 (390×844, la falange marcha), FU3-picas-844 (844×390, picas bajadas antes del choque), FU3-choque-844 y FU3-choque-390
   (en el choque) y FU3-lp7-844 (abierta con ?lp7= de una falange, como «Bajar a pie» de js/ui-mando.js).
   Comprueba: 0 errores de consola, llamadas de dibujo ≤ 30, la raya del frente llega al mando y la falange marcha, el contrato de lp7.
   Uso: node gobierno/maquetas/bloque/captura-fu3.mjs [caso,caso,...] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8477;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const CASOS = (process.argv[2] || 'marcha-390,picas-844,choque-844,choque-390,lp7-844').split(',');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (nombre, ok, extra = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + nombre + (extra ? ' · ' + extra : '')); if (!ok) fallos++; };
const LP7 = { semilla: 3, nivel: 'normal', lejos: 40, rival: { los: 'los romanos', Los: 'Los romanos' }, objetivo: 'Rompe a los manípulos' };
try {
  for (const caso of CASOS) {
    const [w, h] = caso.endsWith('390') ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    const q = { 'marcha-390': 'nivel=normal&semilla=3', 'picas-844': 'semilla=3&fase=picas', 'choque-844': 'semilla=3&fase=choque', 'choque-390': 'semilla=3&fase=choque',
      'lp7-844': 'lp7=' + encodeURIComponent(JSON.stringify(LP7)) }[caso];
    console.log('— ' + caso);
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/index.html?formacion=falange&${q}`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 150000 });
    await p.waitForTimeout(6000);
    const est = () => p.evaluate(() => { const S = window.__bloque.S, F = S.fal; return { ...window.__bloque.estado(), xF: F.xF, zF: F.zF, choque: !!F.choque, kB0: Math.max(...F.fal.filter(h => h.r === 0).map(h => h.kB || 0)), figsR: window.__bloque.S.B.hombres.length, ordenes: [...document.querySelectorAll('.orden b')].map(b => b.textContent).join('/') }; });
    if (caso === 'marcha-390') {
      const e0 = await est();
      const r = await p.evaluate(() => window.__bloque.dibuja({ x: -12, z: -40 }, { x: 12, z: -40 }));
      vale('la raya del frente llega al mando', r !== null && r !== false, JSON.stringify(r).slice(0, 80));
      await p.waitForTimeout(9000); const e = await est();
      vale('la falange marcha', Math.hypot(e.xF - e0.xF, e.zF - e0.zF) > 1, `de (${e0.xF.toFixed(1)}, ${e0.zF.toFixed(1)}) a (${e.xF.toFixed(1)}, ${e.zF.toFixed(1)})`);
      vale('botones de la falange', /picas/i.test(e.ordenes) && /Avanzar/.test(e.ordenes), e.ordenes);
    }
    if (caso === 'picas-844') { const e = await est(); vale('picas bajadas y sin choque', e.kB0 > 0.9 && !e.choque, 'kB ' + e.kB0.toFixed(2) + ' choque ' + e.choque); }
    if (caso.startsWith('choque')) { const e = await est(); vale('en el choque', e.choque); }
    if (caso === 'lp7-844') {
      await p.waitForTimeout(4000); const r = await p.evaluate(() => window.__bloque.lp7());
      vale('contrato lp7 (bloques tuyo y centro, pose)', !!(r && r.bloques && r.bloques.tuyo && r.bloques.centro && r.pose && 'ganador' in r), JSON.stringify(r).slice(0, 160));
    }
    await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/FU3-${caso}.jpg`, type: 'jpeg', quality: 80 });
    const e = await est(); vale('llamadas de dibujo ≤ 30', e.llamadas <= 30, 'llamadas ' + e.llamadas + ' · figs ' + e.figs);
    vale('sin errores de consola', !errores.length, errores.slice(0, 3).join(' | '));
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `${fallos} MAL` : 'todo bien'); process.exit(fallos ? 1 : 0);
