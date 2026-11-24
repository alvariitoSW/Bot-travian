/* FU5 · Capturas y prueba en navegador del muro de escudos, el orden abierto y el abanico (390×844 y 844×390).
   Guarda gobierno/capturas-tarea/FU5-<caso>-<v|h>.jpg.
   Casos: abanico (tocar el estandarte de verdad: se abre con tres botones; tocar «Muro» pone la forma) · muro (muro de escudos, vista
   oficial o de arriba) · abierto (orden abierto bajo una salva). Uso: node gobierno/maquetas/bloque/captura-fu5.mjs [caso,caso,...] [v|h|vh] [vista] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8477;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const CASOS = (process.argv[2] || 'abanico,muro,abierto').split(',');
const ORI = process.argv[3] || 'vh', VISTA = process.argv[4] || '';
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (nombre, ok, extra = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + nombre + (extra ? ' · ' + extra : '')); if (!ok) fallos++; };
try {
  for (const o of ORI.split('')) for (const caso of CASOS) {
    const [w, h] = o === 'v' ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    const v = VISTA ? '&vista=' + VISTA : '';
    const q = { abanico: '?nivel=normal&semilla=3&fase=carga', muro: '?nivel=normal&semilla=3&fase=muro' + v, abierto: '?nivel=normal&semilla=3&fase=abierto' + v }[caso];
    const foto = async n => { const r = `gobierno/capturas-tarea/FU5-${n}-${o}.jpg`; await p.screenshot({ path: RAIZ + r, type: 'jpeg', quality: 80 }); console.log(r); };
    const est = () => p.evaluate(() => ({ ...window.__bloque.estado(), forma: window.__bloque.S.tuyo.forma, ab: window.__bloque.abanico.abierto() }));
    console.log(`— ${caso} ${o}`);
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/${q}`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 120000 });
    await p.waitForTimeout(6000);
    if (caso === 'abanico') {
      const cen = async sel => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height]; }, sel);
      let e = await est(); vale('empieza cerrada y sin abanico', e.forma === 'cerrada' && !e.ab);
      const [x, y] = await cen('.est.tuyo i'); await p.touchscreen.tap(x, y); await p.waitForTimeout(2500);
      e = await est(); vale('tocar el estandarte abre el abanico', e.ab);
      const bs = await p.evaluate(() => [...document.querySelectorAll('#abanico .ab')].map(b => { const r = b.getBoundingClientRect(); return { f: b.dataset.f, l: r.left, t: r.top, r: r.right, b: r.bottom, w: b.offsetWidth }; }));
      vale('tres botones de ≥ 52 px dentro de la pantalla', bs.length === 3 && bs.every(b => b.w >= 52 && b.l >= 0 && b.r <= w && b.t >= 0 && b.b <= h), JSON.stringify(bs.map(b => [b.f, Math.round(b.l), Math.round(b.t), Math.round(b.w)])));
      await foto('abanico'); e = await est(); vale('llamadas de dibujo ≤ 30', e.llamadas <= 30, 'llamadas ' + e.llamadas);
      const [mx, my] = await cen('#abanico .ab[data-f="muro"]'); await p.touchscreen.tap(mx, my); await p.waitForTimeout(500);
      e = await est(); vale('tocar «Muro» pone el muro y cierra el abanico', e.forma === 'muro' && !e.ab, 'forma ' + e.forma);
      await p.waitForTimeout(1500); await foto('abanico-muro');
    } else {
      const e = await est(); vale(caso === 'muro' ? 'forma muro' : 'forma abierto', e.forma === caso, 'forma ' + e.forma);
      await foto(caso); vale('llamadas de dibujo ≤ 30', e.llamadas <= 30, 'llamadas ' + e.llamadas);
    }
    vale('sin errores de consola', !errores.length, errores.join(' | '));
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `NO APTO: ${fallos} fallos` : 'APTO');
process.exit(fallos ? 1 : 0);
