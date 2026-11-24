/* FU2 · Capturas y prueba en navegador de «Tú en la fila» (390×844 y 844×390). Guarda gobierno/capturas-tarea/FU2-<caso>-<v|h>.jpg.
   Casos: duelo (galo armando, aro rojo; luego paras a tiempo: aro dorado y «¡Parado!»; y la estocada tras parar mata) ·
   testudo (vista bajo el techo cerrado) · pilum (cargando el pilum con un dedo de verdad, antes del choque) · cae (tras caer: «ahora eres …»).
   Uso: node gobierno/maquetas/bloque/captura-fu2.mjs [caso,caso,...] [v|h|vh] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8476;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const CASOS = (process.argv[2] || 'duelo,testudo,pilum,cae').split(',');
const ORI = process.argv[3] || 'vh';
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (nombre, ok, extra = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + nombre + (extra ? ' · ' + extra : '')); if (!ok) fallos++; };
try {
  for (const o of ORI.split('')) for (const caso of CASOS) {
    if ((caso === 'pilum' || caso === 'cae') && o === 'h') continue;   /* esas dos, solo en vertical */
    const [w, h] = o === 'v' ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    const q = { duelo: '?nivel=normal&semilla=3&vista=oficial&fase=duelo', cae: '?nivel=normal&semilla=3&vista=oficial&fase=duelo',
      testudo: '?formacion=testudo&semilla=3&vista=oficial&fase=testudo', pilum: '?nivel=normal&semilla=3&vista=oficial' }[caso];
    const foto = async n => { const r = `gobierno/capturas-tarea/FU2-${n}-${o}.jpg`; await p.screenshot({ path: RAIZ + r, type: 'jpeg', quality: 80 }); console.log(r); };
    const espera = async (f, ms = 60000) => { try { await p.waitForFunction(f, null, { timeout: ms, polling: 100 }); return true; } catch (e) { return false; } };
    const est = () => p.evaluate(() => { const e = window.__bloque.oficial.estado(); return { ...window.__bloque.estado(), duelo: e.duelo, rival: e.rival, heridas: e.heridas, pilum: e.pilum, carga: e.carga, caidas: e.caidas, muertes: e.muertes, eco: e.eco.texto }; });
    console.log(`— ${caso} ${o}`);
    await p.goto(`http://localhost:${PUERTO}/gobierno/maquetas/bloque/${q}`);
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 120000 });
    await p.waitForTimeout(6000);
    if (caso === 'duelo') {
      vale('hay duelo', await espera(() => window.__bloque.oficial.estado().duelo));
      vale('el galo arma', await espera(() => { const r = window.__bloque.oficial.estado().rival; return r && r.fase === 'arma' && r.t > 0.45; }));
      await foto('duelo-arma'); let e = await est(); vale('llamadas de dibujo ≤ 30', e.llamadas <= 30, 'llamadas ' + e.llamadas);
      /* parar a tiempo: se vuelve a pulsar cada fotograma mientras arma, así el gesto cae en la ventana de parada */
      let mata = false, parado = false;
      for (let k = 0; k < 6 && !mata; k++) {
        const ok = await p.evaluate(() => new Promise(res => { const O = window.__bloque.oficial, t0 = performance.now();
          const tic = () => { const r = O.estado().rival; if (r && (r.fase === 'abierto')) return res(true); if (performance.now() - t0 > 40000 || !O.estado().duelo) return res(false);
            if (r && (r.fase === 'arma' || r.fase === 'golpea')) { O.pide('suelta-parar'); O.pide('parar'); } requestAnimationFrame(tic); }; tic(); }));
        if (!ok) continue;
        if (!parado) { parado = true; await p.waitForTimeout(350); await foto('parado'); e = await est(); vale('¡Parado! y el galo abierto', e.eco === '¡Parado!' && e.rival && e.rival.fase === 'abierto', e.eco); }
        const m0 = (await est()).muertes;
        await p.evaluate(() => { window.__bloque.pide('suelta-parar'); window.__bloque.pide('estocada'); });
        mata = (await est()).muertes > m0;
      }
      vale('parar a tiempo y estocada mata al rival', mata);
      await p.waitForTimeout(2500); e = await est(); vale('tras matarlo hay otro rival', e.duelo, 'duelo=' + e.duelo);
    } else if (caso === 'cae') {
      vale('caes y eres otro', await espera(() => window.__bloque.oficial.estado().caidas > 0, 150000));
      await p.waitForTimeout(250); await foto('cae'); const e = await est(); vale('cinta «ahora eres …»', /ahora eres/.test(e.eco), e.eco);
    } else if (caso === 'testudo') {
      await foto('testudo-techo'); const e = await est(); vale('llamadas de dibujo ≤ 30', e.llamadas <= 30, 'llamadas ' + e.llamadas);
    } else if (caso === 'pilum') {
      const cdp = await p.context().newCDPSession(p), toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
      vale('modo pilum', (await est()).pilum === 2);
      await toque('touchStart', [[w * 0.5, h * 0.5]]); await espera(() => window.__bloque.oficial.estado().carga > 0.5, 20000);
      await foto('pilum'); let e = await est(); vale('carga el pilum sin dibujar frente', e.carga > 0.3, 'carga ' + e.carga);
      await toque('touchEnd', []); await p.waitForTimeout(400); e = await est(); vale('suelta el pilum', e.pilum === 1, 'quedan ' + e.pilum);
    }
    vale('sin errores de consola', !errores.length, errores.join(' | '));
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `NO APTO: ${fallos} fallos` : 'APTO');
process.exit(fallos ? 1 : 0);
