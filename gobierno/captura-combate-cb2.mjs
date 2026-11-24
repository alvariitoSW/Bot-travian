/* AQVILA — CB2: capturas de la maqueta «Combate de cerca» (gobierno/maquetas/combate-cerca/).
   Uso: node gobierno/captura-combate-cb2.mjs [semilla]
   Busca en el motor (el mismo montaje que la maqueta) un momento para cada cosa: estocada, golpe de umbo, parada, caída.
   Deja gobierno/capturas-tarea/CB2-1-vertical-estocada.jpg, CB2-2-vertical-umbo.jpg, CB2-3-horizontal-parada.jpg,
   CB2-4-horizontal-caida.jpg. Mide también el coste por cuadro de la maqueta en marcha. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { montar, DT } from './maquetas/combate-cerca/montaje.js';
import { paso } from '../js/combate.js';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SALIDA = join(RAIZ, 'gobierno/capturas-tarea');
const semilla = +(process.argv[2] || 1);

/* el primer momento (tras 2 s) en que un hombre de la primera fila cumple la condición */
function busca(cond, bando = null, tMax = 90) {
  const S = montar(semilla);
  while (S.t < tMax) {
    paso(S.hombres, DT, { rnd: S.rnd }); S.t += DT;
    if (S.t < 2) continue;
    for (const h of S.hombres) if ((h.fila === 0 || !h.vivo) && (h.col === 0 || h.col === 3 || !h.vivo) && (!bando || h.bando === bando) && cond(h)) return { t: S.t, mira: h.id };
  }
  throw new Error('no se encontró el momento');
}
const CAPTURAS = [
  { nombre: 'CB2-1-vertical-estocada', w: 390, h: 844, ...busca(h => h.vivo && h.izq.estado === 'alzado' && h.der.estado === 'golpea' && h.der.golpe === 'punta' && h.der.t > 0.11 && h.der.t < 0.15, 'a') },
  { nombre: 'CB2-2-vertical-umbo', w: 390, h: 844, ...busca(h => h.vivo && h.izq.estado === 'empuja' && h.izq.t > 0.13 && h.izq.t < 0.17, 'a') },
  { nombre: 'CB2-3-horizontal-parada', w: 844, h: 390, ...busca(h => h.vivo && h.izq.estado === 'para' && h.izq.t > 0.08 && h.izq.t < 0.12, 'a') },
  { nombre: 'CB2-4-horizontal-caida', w: 844, h: 390, ...busca(h => !h.vivo && h.muerto > 0.8 && h.muerto < 0.85, 'a') },
];

const PUERTO = 8000 + Math.floor(Math.random() * 900);
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO), '--bind', '127.0.0.1'], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(ok => setTimeout(ok, 800));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errores = [];
async function abre(w, h, q) {
  const page = await (await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })).newPage();
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 200)));
  await page.goto(`http://127.0.0.1:${PUERTO}/gobierno/maquetas/combate-cerca/index.html${q}`);
  await page.waitForFunction(() => window.CB2 && window.CB2.listo, null, { timeout: 60000 });
  return page;
}
try {
  for (const c of CAPTURAS) {
    const page = await abre(c.w, c.h, `?t=${c.t}&semilla=${semilla}&mira=${encodeURIComponent(c.mira)}`);
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => document.getElementById('rotulo').textContent);
    await page.screenshot({ path: join(SALIDA, c.nombre + '.jpg'), type: 'jpeg', quality: 80 });
    console.log(`${c.nombre}: t=${c.t.toFixed(2)} s, mira ${c.mira}, rótulo «${r}»`);
    await page.close();
  }
  /* coste de la maqueta en marcha (render por software: el cuadro entero no dice nada del móvil; motor y poses, sí) */
  const page = await abre(844, 390, `?semilla=${semilla}`);
  await page.waitForTimeout(4000);
  const k = await page.evaluate(() => window.CB2.coste);
  console.log(`maqueta en marcha: ${k.n} cuadros; motor ${(k.motor / k.n).toFixed(3)} ms, poses ${(k.poses / k.n).toFixed(3)} ms, cuadro entero ${(k.cuadro / k.n).toFixed(1)} ms (por cuadro)`);
} finally { await br.close(); srv.kill(); }
console.log(errores.length ? 'ERRORES DE CONSOLA:\n' + errores.join('\n') : 'sin errores de consola');
