/* FU3b · Capturas y prueba (amplía las de FU3: gesto de la falange, falangitas azules, muñón, pila, raya al marchar, nombre del rival de lp7) en navegador de la falange en la escena del bloque (?formacion=falange). Guarda en gobierno/capturas-tarea/:
   FU3-marcha-390 (390×844, la falange marcha), FU3-picas-844 (844×390, picas bajadas antes del choque), FU3-choque-844 y FU3-choque-390
   (en el choque) y FU3-lp7-844 (abierta con ?lp7= de una falange, como «Bajar a pie» de js/ui-mando.js).
   Comprueba: 0 errores de consola, llamadas de dibujo ≤ 30, la raya del frente llega al mando y la falange marcha, el contrato de lp7.
   Uso: node gobierno/maquetas/bloque/captura-fu3b.mjs [caso,caso,...] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8477;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const CASOS = (process.argv[2] || 'marcha-390,choque-390,choque-844,acometida-390,hueco-390,munon-390,lp7-844').split(',');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (nombre, ok, extra = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + nombre + (extra ? ' · ' + extra : '')); if (!ok) fallos++; };
const LP7 = { semilla: 3, nivel: 'normal', lejos: 40, rival: { Los: 'Cartagineses' }, objetivo: 'Rompe su línea: se lucha hasta el 15 %' };
try {
  for (const caso of CASOS) {
    const [w, h] = caso.endsWith('390') ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    const q = { 'marcha-390': 'nivel=normal&semilla=3', 'choque-844': 'semilla=3&fase=choque', 'choque-390': 'semilla=3&fase=choque', 'acometida-390': 'semilla=3&fase=duelo', 'deslizar-390': 'semilla=3&fase=duelo', 'hueco-390': 'semilla=3&fase=duelo', 'munon-390': 'semilla=3&fase=choque',
      'lp7-844': 'lp7=' + encodeURIComponent(JSON.stringify(LP7)) }[caso];
    console.log('— ' + caso);
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/index.html?formacion=falange&${q}`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 150000 });
    await p.waitForTimeout(6000);
    const est = () => p.evaluate(() => { const S = window.__bloque.S, F = S.fal; return { ...window.__bloque.estado(), xF: F.xF, zF: F.zF, choque: !!F.choque, kB0: Math.max(...F.fal.filter(h => h.r === 0).map(h => h.kB || 0)), figsR: window.__bloque.S.B.hombres.length, ordenes: [...document.querySelectorAll('.orden b')].map(b => b.textContent).join('/') }; });
    const fal = () => p.evaluate(() => window.__bloque.falangita.estado());
    if (caso === 'marcha-390') {
      const e0 = await est();
      const r = await p.evaluate(() => window.__bloque.dibuja({ x: -12, z: -40 }, { x: 12, z: -40 }));
      vale('la raya del frente llega al mando', r !== null && r !== false);
      await p.waitForTimeout(3500); const e = await est();
      vale('la falange marcha', Math.hypot(e.xF - e0.xF, e.zF - e0.zF) > 0.5);
      vale('la raya sigue pintada al marchar', await p.evaluate(() => !!window.__bloque.S.B.meta));
    }
    if (caso.startsWith('choque')) { const e = await est(); vale('en el choque', e.choque); }
    if (caso === 'acometida-390') {
      await p.waitForFunction(() => { const e = window.__bloque.falangita.estado(); return e.rival && e.rival.fase === 'acomete' && e.rival.t > 0.35; }, null, { timeout: 90000, polling: 'raf' });
      await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(300);
      vale('aviso «¡Bajad sarisas!» a la vista', await p.evaluate(() => document.querySelector('#fal-aviso').classList.contains('ve')));
      await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/FU3b-${caso}.jpg`, type: 'jpeg', quality: 80 });
    }
    if (caso === 'deslizar-390') {
      await p.waitForFunction(() => { const e = window.__bloque.falangita.estado(); return e.rival && e.rival.fase === 'acomete' && e.rival.t > 0.58 && e.rival.t < 0.9; }, null, { timeout: 90000, polling: 'raf' });
      /* deslizar hacia abajo en cualquier sitio del campo: pide 'bajar' */
      /* eventos propios en una sola vuelta (el navegador por software tarda segundos entre fotogramas y el gesto es de 400 ms) */
      await p.evaluate(() => { const c = document.querySelector('canvas'), ev = (t, y) => c.dispatchEvent(new PointerEvent(t, { pointerId: 7, clientX: 195, clientY: y, bubbles: true }));
        ev('pointerdown', 250); ev('pointermove', 270); ev('pointermove', 300); ev('pointerup', 300); });
      vale('el deslizar hacia abajo baja las sarisas', await p.evaluate(() => window.__bloque.falangita.estado().bajadas));
      await p.waitForFunction(() => window.__bloque.falangita.estado().ensartados > 0, null, { timeout: 60000, polling: 'raf' }).catch(() => {});
      vale('ensarta (eco)', await p.evaluate(() => window.__bloque.falangita.estado().ensartados > 0));
    }
    if (caso === 'hueco-390') {
      await p.waitForFunction(() => { const e = window.__bloque.falangita.estado(); return !!e.hueco && e.hueco.t < 0.9; }, null, { timeout: 120000, polling: 'raf' });
      await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(300);
      vale('anillo del hueco a la vista', await p.evaluate(() => !!document.querySelector('#fal svg.anillo').style.display.match(/block/)));
      await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/FU3b-${caso}.jpg`, type: 'jpeg', quality: 80 });
      const a = await p.evaluate(() => { const m = document.querySelector('#fal svg.anillo').style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/); return { x: +m[1], y: +m[2] }; });
      await p.evaluate(() => window.__bloque.congela(false));
      await p.mouse.move(a.x, a.y + 90); await p.mouse.down(); await p.mouse.move(a.x, a.y, { steps: 4 }); await p.mouse.up();
      vale('arrastrar al anillo cierra el hueco', await p.evaluate(() => window.__bloque.falangita.estado().cerrados > 0));
    }
    if (caso === 'munon-390') {
      await p.evaluate(() => { const F = window.__bloque.S.fal; F.fal.filter(h => h.r === 0 && h.vivo).slice(2, 7).forEach(h => { h.picaRota = true; h.tRota = F.T; }); });
      await p.waitForTimeout(2500);
    }
    if (caso === 'lp7-844') {
      await p.waitForTimeout(3000); const r = await p.evaluate(() => window.__bloque.lp7());
      vale('contrato lp7', !!(r && r.bloques && r.bloques.tuyo && r.bloques.centro && r.pose && 'ganador' in r));
      vale('el rival es el de LP7, no «los manípulos»', await p.evaluate(() => /Cartagineses/.test(document.body.innerText) && !/manípulos a/.test(document.querySelector('#objetivo').parentElement.innerText)), await p.evaluate(() => document.querySelector('#objetivo').parentElement.innerText.replace(/\n/g, ' | ')));
    }
    if (!/^(acometida|hueco|deslizar)/.test(caso)) await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/FU3b-${caso}.jpg`, type: 'jpeg', quality: 80 });
    const e = await est(); vale('llamadas de dibujo ≤ 30', e.llamadas <= 30, 'llamadas ' + e.llamadas + ' · figs ' + e.figs);
    vale('sin errores de consola', !errores.length, errores.slice(0, 3).join(' | '));
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `${fallos} MAL` : 'todo bien'); process.exit(fallos ? 1 : 0);
