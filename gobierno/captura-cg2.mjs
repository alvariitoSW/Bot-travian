/* CG2a: capturas del constructor de ejército de Escaramuzas, a 390×844 y 844×390. Uso: node gobierno/captura-cg2.mjs [prefijo]
   Deja gobierno/capturas-tarea/<prefijo>-v-*.jpg y -h-*.jpg, y lista los errores de consola. */
import { createRequire } from 'node:module';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const { chromium } = createRequire(import.meta.url)('playwright');
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), PRE = process.argv[2] || 'CG2', SAL = join(RAIZ, 'gobierno/capturas-tarea');
const srv = spawn('python3', ['-m', 'http.server', '8792'], { cwd: RAIZ, stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
const errores = [];
try {
  await espera(1200);
  const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await nav.newPage({ viewport: { width: 390, height: 844 } });
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); }); page.on('pageerror', e => errores.push(String(e)));
  await page.goto('http://localhost:8792/', { waitUntil: 'load' });
  await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
  await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 90000 }).catch(() => {});
  await espera(1500);
  const foto = async n => { await espera(500); await page.screenshot({ path: join(SAL, PRE + '-' + n + '.jpg'), type: 'jpeg', quality: 70, timeout: 120000 }); console.log('foto', n); };
  const toca = async v => { await page.click('#hoja [data-act="escel"][data-v="' + v + '"]'); await espera(400); };
  await page.click('#menu .mesc'); await espera(1000);
  console.log('hoja', await page.evaluate(() => { const h = document.querySelector('#hoja'); return h ? h.hidden + ' ' + h.dataset.id + ' ' + h.innerHTML.length : 'no'; }));
  await foto('v-1-bandos');
  await toca('paso:2'); await foto('v-2-ejercito');
  await toca('menos:principes'); await toca('menos:velites'); await toca('mas:hastati'); await toca('filtro:cab'); await foto('v-2b-filtro');
  await toca('filtro:todas'); await toca('ficha:triarii,0'); await foto('v-2c-ficha');
  await toca('fichax:'); await toca('paso:3'); await foto('v-3-rival');
  await toca('editariv:1'); await foto('v-3b-rival-cambiar');
  await toca('editariv:0'); await toca('paso:4'); await foto('v-4-campo');
  await toca('paso:1'); await toca('mio:macedonia'); await toca('riv:roma'); await toca('bolsa:gusto'); await foto('v-1b-gusto');
  await toca('paso:2'); await toca('guarda:'); await foto('v-2d-guardado');
  await page.setViewportSize({ width: 844, height: 390 }); await espera(800);
  await toca('paso:2'); await foto('h-2-ejercito');
  await toca('ficha:falange,0'); await foto('h-2c-ficha');
  await toca('fichax:'); await toca('paso:1'); await foto('h-1-bandos');
  await toca('paso:3'); await foto('h-3-rival');
  const medida = await page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, pie: !!document.querySelector('#hoja .cg2-pie') }));
  console.log('medida', JSON.stringify(medida));
  await nav.close();
} finally { srv.kill(); console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'sin errores de consola'); }
