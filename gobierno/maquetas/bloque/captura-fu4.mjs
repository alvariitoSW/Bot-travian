/* FU4 · Capturas y prueba de la falange contra todos sus rivales en la escena del bloque (?formacion=falange&rival=…), con la física
   de cuerpos (js/fisica-batalla.js) y la vista del oficial sin su propia sarisa. Guarda en gobierno/capturas-tarea/FU4-*.jpg:
   elefantes-844/390 (la carga contra las picas, en la lucha), manipulos-844/390 (en la lucha), oficial-844/390 (&vista=oficial),
   fin-844/390 (la tarjeta del final). Comprueba: 0 errores de consola, llamadas de dibujo ≤ 30, el rival montado, el rótulo y el
   objetivo del rival, y la física (Fi.medir: puntas dentro de cuerpos, distancia mínima). testudo y manípulo: que cargan sin errores.
   Uso: node gobierno/maquetas/bloque/captura-fu4.mjs [caso,caso,...] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8478;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const CASOS = (process.argv[2] || 'elefantes-844,elefantes-390,manipulos-844,manipulos-390,oficial-844,oficial-390,fin-844,fin-390,caballeria-844,testudo-390,manipulo-390').split(',');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (nombre, ok, extra = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + nombre + (extra ? ' · ' + extra : '')); if (!ok) fallos++; };
const Q = { elefantes: 'formacion=falange&rival=elefantes&nivel=normal&fase=lucha', manipulos: 'formacion=falange&rival=manipulos&nivel=normal&fase=lucha',
  oficial: 'formacion=falange&rival=elefantes&nivel=normal&fase=lucha&vista=oficial', fin: 'formacion=falange&rival=elefantes&nivel=normal&fase=fin',
  caballeria: 'formacion=falange&rival=caballeria&nivel=normal&fase=lucha', testudo: 'formacion=testudo&nivel=normal', manipulo: 'nivel=normal' };
try {
  for (const caso of CASOS) {
    const [w, h] = caso.endsWith('390') ? [390, 844] : [844, 390], tipo = caso.replace(/-\d+$/, '');
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    console.log('— ' + caso);
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/index.html?semilla=3&${Q[tipo]}`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 180000 });
    const falange = /falange/.test(Q[tipo]), conRival = falange && !/manipulos/.test(Q[tipo]);
    if (conRival) { await p.waitForFunction(() => !!window.__bloque.rival, null, { timeout: 120000 }).catch(() => {}); vale('el dibujo del rival está montado', await p.evaluate(() => !!window.__bloque.rival)); }
    await p.waitForTimeout(8000);
    if (tipo !== 'fin') { await p.evaluate(() => window.__bloque.congela && window.__bloque.congela(true)); await p.waitForTimeout(1200); }
    await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/FU4-${caso}.jpg`, type: 'jpeg', quality: 80 });
    const e = await p.evaluate(() => window.__bloque.estado());
    vale('llamadas de dibujo ≤ 30', e.llamadas <= 30, 'llamadas ' + e.llamadas + ' · figs ' + e.figs);
    if (falange) {
      await p.evaluate(() => window.__bloque.fisica()); await p.waitForTimeout(1500);   /* la medida de las picas se toma en el fotograma siguiente */
      const fi = await p.evaluate(() => window.__bloque.fisica());
      vale('física de cuerpos activa', fi && fi.activa, JSON.stringify(fi));
      vale('ninguna punta de sarisa dentro de un cuerpo', fi && !fi.puntasDentro);
      const txt = await p.evaluate(() => document.querySelector('#objetivo').parentElement.innerText.replace(/\s+/g, ' '));
      if (conRival) vale('rótulo y objetivo del rival', !/manípulos/i.test(txt), txt.slice(0, 120));
      if (tipo === 'oficial') vale('vista del oficial abajo', await p.evaluate(() => window.__bloque.vista.t() > 0.5));
    }
    vale('sin errores de consola', !errores.length, errores.slice(0, 3).join(' | '));
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `${fallos} MAL` : 'todo bien'); process.exit(fallos ? 1 : 0);
