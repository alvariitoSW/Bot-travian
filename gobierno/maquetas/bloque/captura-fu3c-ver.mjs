/* FU3c · Capturas de lo que se veía poco: el muñón de la pica rota, los pila de los manípulos y los brazos con la sarisa bajada.
   Guarda en gobierno/capturas-tarea/: FU3c-munon-390, FU3c-munon-844, FU3c-pila-844, FU3c-brazos-844.
   GANCHOS DE PRUEBA (solo capturas, no tocan reglas): para el muñón se parte a mano la pica de cinco hombres de la primera fila
   (h.picaRota = true, como lo hace falange-rivales.js al romperse una pica) y la cámara se coloca cerca con __bloque.vista.fija().
   Comprueba: 0 errores de consola, llamadas de dibujo ≤ 30, hay muñones y pila dibujados.
   Uso: node gobierno/maquetas/bloque/captura-fu3c-ver.mjs [caso,caso,...] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8478;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const CASOS = (process.argv[2] || 'munon-390,munon-844,pila-844,brazos-844,brazos-390,diagonal-390').split(',');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (nombre, ok, extra = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + nombre + (extra ? ' · ' + extra : '')); if (!ok) fallos++; };
const CAM = JSON.parse(process.env.CAM || 'null') || {};
try {
  for (const caso of CASOS) {
    const [w, h] = caso.endsWith('390') ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    console.log('— ' + caso);
    const fase = caso.startsWith('pila') ? 'duelo' : 'choque';
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/index.html?formacion=falange&semilla=3&fase=${fase}&vista=oficial`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 150000 });
    await p.waitForTimeout(7000);
    let objetivo = null;   /* adónde mira la cámara de prueba: { p, mira } */
    if (caso.startsWith('munon')) {
      /* gancho de prueba: la pica de la punta derecha de la primera fila y la de sus cuatro vecinos, partidas; la cámara, en el flanco de fuera */
      await p.evaluate(() => { const F = window.__bloque.S.fal, fila = F.fal.filter(h => h.r === 0 && h.vivo).sort((a, b) => b.x - a.x);
        fila.slice(0, 5).forEach(h => { h.picaRota = true; h.tRota = F.T; }); window.__lim = { x: fila[0].x, z: fila[0].z }; });
      /* con ?fase=choque la partida está congelada: se descongela para que el muñón caiga (0,45 s de partida) y se vuelve a congelar */
      await p.evaluate(() => window.__bloque.congela(false));
      await p.waitForFunction(t0 => window.__bloque.S.fal.T > t0 + 1.2, await p.evaluate(() => window.__bloque.S.fal.T), { timeout: 90000, polling: 'raf' });
      await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(500);
      const m = await p.evaluate(() => { const M = window.__bloque.mallas, e = new M.V.M.constructor(); if (!M.mun.count) return null; const c = [0, 0, 0]; for (let i = 0; i < M.mun.count; i++) { M.mun.getMatrixAt(i, e); c[0] += e.elements[12]; c[1] += e.elements[13]; c[2] += e.elements[14]; } return c.map(v => v / M.mun.count); });   /* el centro de los muñones caídos */
      vale('hay muñones dibujados', !!m); if (m) objetivo = caso.endsWith('390') ? { p: [m[0] + 1.2, m[1] + 1.7, m[2] - 4.2], mira: [m[0], m[1] + 0.4, m[2] + 1.5], fov: 66 } : { p: [m[0] + 2.0, m[1] + 2.6, m[2] + 4.2], mira: [m[0], m[1], m[2] - 0.5], fov: 52 };
    }
    if (caso.startsWith('pila')) {
      /* GANCHO DE PRUEBA: en ?fase=duelo los pila vuelan solo en un momento fijo y la captura por software no lo pilla. Se congela y se ponen a mano seis
         pila en el aire (est 1, con p y dir como los deja la física de js/falange.js) delante de la línea, rumbo a ella. Los clavados y caídos ya son de verdad. */
      await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(400);
      const m = await p.evaluate(() => { const F = window.__bloque.S.fal, yo = F.fal[F.yo.i];
        for (let k = 0; k < 6; k++) F.proyectiles.push({ est: 1, t0: F.T - 1, p: [yo.x - 2.5 + k * 1.0, 2.7 + (k % 3) * 0.35, yo.z - 8 - (k % 2) * 2.2], p0: [0, 0, 0], v: [0, 0, 0], dir: [0.06, -0.4, 1], dur: 99, b: yo });
        return { x: yo.x, z: yo.z }; });
      vale('pila en el aire puestos', !!m); if (m) objetivo = { p: [m.x + 5.0, 2.0, m.z - 5.0], mira: [m.x, 2.8, m.z - 9.0], fov: 58 };
    }
    if (caso.startsWith('brazos') || caso.startsWith('diagonal') || caso.startsWith('manos')) {
      await p.evaluate(() => window.__bloque.congela(true)); await p.waitForTimeout(500);
      const m = await p.evaluate(() => { const F = window.__bloque.S.fal, yo = F.fal[F.yo.i]; return yo ? { x: yo.x, z: yo.z } : null; });
      vale('el oficial a la vista', !!m); if (m) objetivo = caso.startsWith('manos') ? { p: [m.x + 0.1, 2.3, m.z + 0.5], mira: [m.x - 0.2, 1.1, m.z - 0.3], fov: 42 } : caso.startsWith('diagonal') ? { p: [m.x - 3.2, 6.0, m.z + 5.5], mira: [m.x + 0.5, 1.0, m.z - 3.5], fov: 62 } : caso === 'brazos-390' ? { p: [m.x - 2.2, 1.8, m.z + 2.8], mira: [m.x + 0.1, 1.1, m.z - 1.2], fov: 64 } : CAM.brazos || { p: [m.x - 3.0, 1.9, m.z + 2.4], mira: [m.x + 0.2, 1.1, m.z - 1.2], fov: 60 };
    }
    if (objetivo) {
      if (CAM[caso]) objetivo = CAM[caso];
      await p.evaluate(o => { window.__bloque.vista.fija(o); }, objetivo); await p.waitForTimeout(2500);
    }
    await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/FU3c-${caso}.jpg`, type: 'jpeg', quality: 80 });
    const e = await p.evaluate(() => window.__bloque.estado()); vale('llamadas de dibujo ≤ 30', e.llamadas <= 30, 'llamadas ' + e.llamadas);
    vale('sin errores de consola', !errores.length, errores.slice(0, 3).join(' | '));
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `${fallos} MAL` : 'todo bien'); process.exit(fallos ? 1 : 0);
