/* FU3c · Capturas y prueba de los gestos de la falange: acometida (con su línea de primera vez), empuje (mantener) y othismos (compás).
   Guarda FU3c-*.jpg en gobierno/capturas-tarea/. Comprueba aviso visible, que el gesto llega, 0 errores y llamadas de dibujo ≤ 30.
   Uso: node gobierno/maquetas/bloque/captura-fu3c.mjs [caso,...] */
/* FU3b · Capturas y prueba (amplía las de FU3: gesto de la falange, falangitas azules, muñón, pila, raya al marchar, nombre del rival de lp7) en navegador de la falange en la escena del bloque (?formacion=falange). Guarda en gobierno/capturas-tarea/:
   FU3-marcha-390 (390×844, la falange marcha), FU3-picas-844 (844×390, picas bajadas antes del choque), FU3-choque-844 y FU3-choque-390
   (en el choque) y FU3-lp7-844 (abierta con ?lp7= de una falange, como «Bajar a pie» de js/ui-mando.js).
   Comprueba: 0 errores de consola, llamadas de dibujo ≤ 30, la raya del frente llega al mando y la falange marcha, el contrato de lp7.
   Uso: node gobierno/maquetas/bloque/captura-fu3b.mjs [caso,caso,...] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8478;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const CASOS = (process.argv[2] || 'acometida-390,empuje-390,empuje-844,othismos-390,othismos-844').split(',');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (nombre, ok, extra = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + nombre + (extra ? ' · ' + extra : '')); if (!ok) fallos++; };
try {
  for (const caso of CASOS) {
    const [w, h] = caso.endsWith('390') ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    console.log('— ' + caso);
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/index.html?formacion=falange&semilla=3&fase=duelo`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 150000 });
    await p.waitForTimeout(6000);
    const esp = (f, t = 450000) => p.waitForFunction(f, null, { timeout: t, polling: 'raf' });
    const sk = n => p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/FU3c-${n}.jpg`, type: 'jpeg', quality: 80 });
    const toca = (t, id = 7) => p.evaluate(([t, id]) => { const c = document.querySelector('canvas'); c.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: 195, clientY: 300, bubbles: true })); }, [t, id]);
    if (caso.startsWith('acometida')) {
      await esp(() => { const e = window.__bloque.falangita.estado(); return e.rival && e.rival.fase === 'acomete' && e.rival.t > 0.3 && e.primera.acomete; });
      await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(300);
      vale('aviso con línea de primera vez', await p.evaluate(() => document.querySelector('#fal-aviso').classList.contains('ve') && /abajo/.test(document.querySelector('#fal-ayuda-a').textContent)));
      await sk('acometida-390');
    }
    if (caso.startsWith('empuje')) {
      await esp(() => { const e = window.__bloque.falangita.estado(); return e.empuje && e.empuje.fase === 'empuja' && e.empuje.t < 0.5; });
      await toca('pointerdown');
      await p.waitForTimeout(400);
      await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(300);
      const e = await p.evaluate(() => window.__bloque.falangita.estado());
      vale('aviso «¡Aguantad!» a la vista', await p.evaluate(() => document.querySelector('#fal-emp').classList.contains('ve')));
      vale('el dedo mantenido llega: sujeta', e.empuje && e.empuje.sujeta === true);
      vale('sin raya al mantener', await p.evaluate(() => !window.__bloque.S.B.meta));
      await sk(caso);
      await toca('pointerup');
    }
    if (caso.startsWith('othismos')) {
      await esp(() => { const e = window.__bloque.falangita.estado(); return e.othismos && e.othismos.fase === 'empuja'; });
      const f0 = await p.evaluate(() => window.__bloque.falangita.estado().othismos.fuerza);
      /* en la propia página, fotograma a fotograma: toca en el golpe del compás (compás ≈ 0) cuatro veces y congela */
      await p.evaluate(() => new Promise(fin => { const c = document.querySelector('canvas'); let n = 0, listo = true;
        const paso = () => { const o = window.__bloque.falangita.estado().othismos; if (!o || n >= 4) { window.__bloque.congela(true); return fin(); }
          if (o.compas > 0.4 && o.compas < 0.7) listo = true;
          if (o.fase === 'empuja' && listo && (o.compas < 0.12 || o.compas > 0.93)) { listo = false; c.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, clientX: 195, clientY: 300, bubbles: true })); c.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, clientX: 195, clientY: 300, bubbles: true })); n++; }
          requestAnimationFrame(paso); }; paso(); }));
      await p.waitForTimeout(300);
      const o = await p.evaluate(() => window.__bloque.falangita.estado().othismos);
      vale('barra de fuerza a la vista', await p.evaluate(() => document.querySelector('#fal-oth').classList.contains('ve')));
      vale('los toques al compás suben la fuerza', o && o.fuerza > f0, `fuerza ${f0} → ${o && o.fuerza}`);
      await sk(caso);
    }
    const e = await p.evaluate(() => window.__bloque.estado());
    vale('llamadas de dibujo ≤ 30', e.llamadas <= 30, 'llamadas ' + e.llamadas);
    vale('sin errores de consola', !errores.length, errores.slice(0, 3).join(' | '));
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `${fallos} MAL` : 'todo bien'); process.exit(fallos ? 1 : 0);
