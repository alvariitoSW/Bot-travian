// CE10: capturas de «Tus caminos». Uso: node gobierno/maquetas/caminos/captura.mjs (sale con 1 si hay errores)
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { mkdir } from 'fs/promises';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SAL = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch(); await mkdir(SAL, { recursive: true });
let malas = 0; const errores = [];
const chk = (n, ok, d) => { console.log((ok ? 'OK    ' : 'FALLO ') + n + (d ? ' — ' + d : '')); if (!ok) malas++; };
const base = pathToFileURL(join(AQUI, 'index.html')).href;
async function pag(q) {
  const p = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); }); p.on('pageerror', e => errores.push(String(e)));
  await p.goto(base + q); await p.waitForSelector('.cam-caja'); await p.waitForTimeout(500); return p;
}
const foto = async (q, nom, entera) => { const p = await pag(q); await p.screenshot({ path: join(SAL, nom), type: 'jpeg', quality: 80, fullPage: !!entera });
  const fuera = await p.evaluate(() => { const r = []; document.querySelectorAll('.cam-caja *').forEach(e => { if (e.closest('svg') && e.tagName !== 'svg') return; const b = e.getBoundingClientRect(); if (b.width && (b.right > 390.5 || b.left < -0.5)) r.push(e.className + ':' + Math.round(b.left) + '-' + Math.round(b.right)); }); return r; });
  chk(nom + ' sin desbordes', fuera.length === 0, fuera.slice(0, 4).join(' '));
  const sc = await p.evaluate(() => document.documentElement.scrollWidth); chk(nom + ' sin scroll horizontal', sc <= 390, String(sc)); await p.close(); };
await foto('?caso=medias&vista=tira', 'CE10-tira.jpg');
await foto('?caso=inicio&vista=hoja', 'CE10-hoja-inicio.jpg', true);
await foto('?caso=medias&vista=hoja', 'CE10-hoja-medias.jpg', true);
await foto('?caso=peligro&vista=hoja', 'CE10-hoja-peligro.jpg', true);
await foto('?caso=victoria', 'CE10-victoria.jpg');
const p = await pag('?caso=victoria'); await p.click('[data-cam=seguir]'); await p.click('[data-cam=abrir]');
chk('clics llegan a alAccion', JSON.stringify(await p.evaluate(() => window.ACCIONES)) === '["seguir","abrir"]');
chk('sin errores de consola', errores.length === 0, errores.slice(0, 3).join(' | '));
await br.close(); process.exit(malas ? 1 : 0);
