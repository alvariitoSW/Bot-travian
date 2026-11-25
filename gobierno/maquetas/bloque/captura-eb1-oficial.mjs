/* EB1 · Vista del oficial hoy (falange contra manípulos y testudo): capturas EB1-oficial-*.jpg. Solo mira.
   Uso: node gobierno/maquetas/bloque/captura-eb1-oficial.mjs */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8492;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const CASOS = [['falange', 'gobierno/maquetas/falange/?rival=manipulos&semilla=7&nivel=normal&vista=oficial&fase=picas'],
  ['falange-lucha', 'gobierno/maquetas/falange/?rival=manipulos&semilla=7&nivel=normal&vista=oficial&fase=lucha'],
  ['testudo', 'gobierno/maquetas/a-pie/?semilla=7&nivel=normal&vista=oficial&fase=testudo'],
  ['manipulo', 'gobierno/maquetas/bloque/?semilla=7&nivel=normal&vista=oficial&fase=lucha']];
try {
  for (const [k, ruta] of CASOS) for (const [w, h, o] of [[390, 844, 'v'], [844, 390, 'h']]) {
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true });
    const err = []; p.on('pageerror', e => err.push(e.message));
    await p.goto(`http://localhost:${PUERTO}/` + ruta, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 240000 }); await p.waitForTimeout(9000);
    await p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/EB1-oficial-${k}-${o}.jpg`, type: 'jpeg', quality: 78, timeout: 240000 });
    console.log('captura', k, o, 'errores', err.length, err.slice(0, 2).join(' | ')); await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log('hecho');
