/* AQVILA — FA7: fotos del banco de rivales de la falange (banco-rivales.html), con Playwright y render por software.
   Uso: node gobierno/maquetas/falange/captura-fa7.mjs [nombre …]   (sin nombres, todas; el nombre es el del JPG sin «FA7-» ni «.jpg»)
   Una carga de página por foto, siempre con parar=1; la simulación avanza con __fa7.hasta o salta, sin esperas largas.
   Deja los JPG en gobierno/capturas-tarea/. Por foto mide peso, desfase, aviso y errores. Imprime APTO o NO APTO y sale con 0 o 1. */
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
/* nombre, tamaño, rival, bot, vista, cómo avanzar: ['hasta', tipo, max, extra] o ['salta', seg] */
const FOTOS = [
  ['h-elefantes-carga', H, 'elefantes', 'gana', 'hombro', ['hasta', 'barrito', 120, 3]],
  ['h-elefantes-estrellan', H, 'elefantes', 'gana', 'choque', ['hasta', 'espanta', 120, 0.5]],
  ['h-elefantes-hueco', H, 'elefantes', 'pierde', 'hombro', ['hasta', 'hueco', 120, 0.6]],
  ['v-elefantes-estrellan', V, 'elefantes', 'gana', 'hombro', ['hasta', 'espanta', 120, 0.5]],
  ['h-caballeria-rodea', H, 'caballeria', 'gana', 'alto', ['hasta', 'flanco', 60, 5]],
  ['h-caballeria-frena', H, 'caballeria', 'gana', 'choque', ['hasta', 'flancoParado', 120, 0.4]],
  ['h-caballeria-entra', H, 'caballeria', 'pierde', 'alto', ['hasta', 'flancoEntra', 120, 1]],
  ['v-caballeria-frena', V, 'caballeria', 'gana', 'hombro', ['hasta', 'flancoParado', 120, 0.4]],
  ['h-falange', H, 'falange', 'gana', 'choque', ['salta', 20]],
  ['h-hoplitas', H, 'hoplitas', 'gana', 'hombro', ['salta', 20]],
];
const TOPE = { llamadas: 30, triangulos: 750000, desfase: 1.5 };
const pide = process.argv.slice(2);
const lista = pide.length ? FOTOS.filter(f => pide.includes(f[0]) || pide.includes('FA7-' + f[0])) : FOTOS;
if (!lista.length) { console.log('No conozco esas fotos. Hay: ' + FOTOS.map(f => f[0]).join(', ')); process.exit(1); }
const libre = () => new Promise((ok, mal) => { const s = createServer(); s.on('error', mal); s.listen(0, () => { const p = s.address().port; s.close(() => ok(p)); }); });
const espera = ms => new Promise(r => setTimeout(r, ms));
const PUERTO = await libre();
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO), '--bind', '127.0.0.1'], { cwd: RAIZ, stdio: 'ignore' });
const filas = [];
let nav;
try {
  await espera(1200);
  nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [nombre, tam, rival, bot, vista, paso] of lista) {
    const t0 = Date.now(), errores = [], fila = { nombre, aviso: paso[0] === 'hasta' ? paso[1] : '—', llego: true, motivos: [] };
    const page = await nav.newPage({ viewport: tam });
    page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); }); page.on('pageerror', e => errores.push(String(e)));
    try {
      await page.goto(`http://127.0.0.1:${PUERTO}/gobierno/maquetas/falange/banco-rivales.html?rival=${rival}&bot=${bot}&vista=${vista}&parar=1&semilla=1`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.__fa7 && window.__fa7.lista, null, { timeout: 180000, polling: 1000 });
      const r = await page.evaluate(([p]) => {
        const f = window.__fa7; let res;
        if (p[0] === 'hasta') res = f.hasta(p[1], p[2], p[3]); else res = { T: f.salta(p[1]), llego: true };
        const pe = f.peso();
        return { T: res.T, llego: res.llego, llamadas: pe.llamadas, triangulos: pe.triangulos, desfase: f.RIV ? f.RIV.desfase() : -1, err: f.errores.slice(), fase: f.S.fase, riv: f.S.riv && f.S.riv.fase };
      }, [paso]);
      await page.screenshot({ path: join(SAL, 'FA7-' + nombre + '.jpg'), type: 'jpeg', quality: 80 });
      Object.assign(fila, r); errores.push(...r.err);
    } catch (e) { errores.push('guion: ' + String(e.message || e).split('\n')[0]); fila.llego = false; }
    fila.errores = errores.length; fila.seg = Math.round((Date.now() - t0) / 1000);
    if (!fila.llego) fila.motivos.push('no llegó el aviso ' + fila.aviso);
    if (!(fila.llamadas <= TOPE.llamadas)) fila.motivos.push('llamadas ' + fila.llamadas);
    if (!(fila.triangulos <= TOPE.triangulos)) fila.motivos.push('triángulos ' + fila.triangulos);
    if (!(fila.desfase >= 0 && fila.desfase <= TOPE.desfase)) fila.motivos.push('desfase ' + (fila.desfase ?? '?'));
    if (errores.length) fila.motivos.push('errores: ' + errores.slice(0, 2).join(' | ').slice(0, 200));
    console.log(`${nombre}: T=${(fila.T ?? 0).toFixed(1)} s · ${fila.riv || '?'} · aviso ${fila.aviso} ${fila.llego ? 'sí' : 'NO'} · ${fila.seg} s` + (fila.motivos.length ? ' · ' + fila.motivos.join('; ') : ''));
    filas.push(fila);
    await page.close();
  }
} finally { if (nav) await nav.close(); srv.kill(); }
console.log('\n| foto | T (s) | aviso | llegó | llamadas | triángulos | desfase (m) | errores |\n|---|---|---|---|---|---|---|---|');
for (const f of filas) console.log(`| ${f.nombre} | ${(f.T ?? 0).toFixed(1)} | ${f.aviso} | ${f.llego ? 'sí' : 'no'} | ${f.llamadas ?? '?'} | ${f.triangulos ?? '?'} | ${f.desfase == null ? '?' : f.desfase.toFixed(2)} | ${f.errores} |`);
const malas = filas.filter(f => f.motivos.length);
console.log(malas.length ? 'NO APTO: ' + malas.map(f => f.nombre + ' (' + f.motivos.join('; ') + ')').join(' · ') : 'APTO');
process.exit(malas.length ? 1 : 0);
