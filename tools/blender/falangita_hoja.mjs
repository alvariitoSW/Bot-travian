/* FA2: hoja de fotos del falangita y su oficial.
   node tools/blender/falangita_hoja.mjs [1 2 3 4 5]   (sin números: todas; la 5 solo con ANTES)
   Variables opcionales: TROPA (falangita), OFICIAL (oficial-falange), ANTES (carpeta del falangita viejo, desde la raíz), ANTES_CLAVE.
   Cada toma sale en 390×844 (-v) y 844×390 (-h), JPG calidad 85, a doble densidad, en gobierno/capturas-tarea/. */
import { createRequire } from 'module'; import { spawn } from 'child_process'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const { chromium } = createRequire(import.meta.url)('playwright');
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), sal = path.join(raiz, 'gobierno/capturas-tarea'), PUERTO = 8798;
const NOMBRES = { 1: 'siluetas', 2: 'color', 3: 'espalda', 4: 'lejos', 5: 'antes-despues' };
const E = process.env, ANTES = E.ANTES || '';
let tomas = process.argv.slice(2).filter(t => NOMBRES[t]); if (!tomas.length) tomas = ['1', '2', '3', '4', '5'];
if (!ANTES) { if (process.argv.includes('5')) console.log('Toma 5 omitida: falta ANTES=<carpeta>'); tomas = tomas.filter(t => t !== '5'); }
fs.mkdirSync(sal, { recursive: true });
const qs = new URLSearchParams({ tropa: E.TROPA || 'falangita', oficial: E.OFICIAL || 'oficial-falange' }); if (ANTES) qs.set('antes', ANTES); if (E.ANTES_CLAVE) qs.set('antesClave', E.ANTES_CLAVE);
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO), '-d', raiz], { stdio: 'ignore' }); await new Promise(r => setTimeout(r, 1200));
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let fallos = 0;
try {
  for (const t of tomas) for (const [suf, w, h] of [['v', 390, 844], ['h', 844, 390]]) {
    const nombre = `FA2-${t}-${NOMBRES[t]}-${suf}`, t0 = Date.now();
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    p.on('console', m => { const x = m.text(); if (/Failed to load resource|GL Driver Message/.test(x)) return; /* los 404 salen abajo con su dirección */ if (m.type() === 'error' || m.type() === 'warning') console.log('  consola', m.type(), m.text().slice(0, 400)); });
    p.on('pageerror', e => console.log('  error de página:', e.message.slice(0, 400)));
    p.on('response', r => { if (r.status() >= 400 && !r.url().includes('/' + (E.OFICIAL || 'oficial-falange'))) console.log('  ', r.status(), r.url()); });
    try {
      await p.goto(`http://localhost:${PUERTO}/tools/blender/falangita_hoja.html?toma=${t}&${qs}`);
      await p.waitForFunction('window.__listo || window.__fallo', null, { timeout: 300000 });
      const fallo = await p.evaluate('window.__fallo'); if (fallo) throw new Error(fallo);
      await p.waitForTimeout(800);
      await p.screenshot({ path: path.join(sal, nombre + '.jpg'), type: 'jpeg', quality: 85, timeout: 240000 });
      console.log(nombre, Math.round((Date.now() - t0) / 1000) + ' s', JSON.stringify(await p.evaluate('window.__info()')));
    } catch (e) { fallos++; console.log(nombre, 'FALLA:', e.message.slice(0, 400)); }
    await p.close();
  }
} finally { await b.close(); srv.kill(); }
process.exit(fallos ? 1 : 0);
