/* FA7: comprueba el menú «Elige rival» de la prueba Falange a pie en Escaramuzas, a 390×844 y 844×390.
   Uso: node gobierno/maquetas/falange/captura-fa7-menu.mjs
   Deja gobierno/capturas-tarea/FA7-v-menu.jpg y FA7-h-menu.jpg. Imprime APTO o NO APTO con el motivo. */
import { createRequire } from 'node:module';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../../..'), SAL = join(RAIZ, 'gobierno/capturas-tarea');
mkdirSync(SAL, { recursive: true });
const PUERTO = 8123, RIVALES = ['manipulos', 'caballeria', 'elefantes', 'falange'];
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
const errores = [], fallos = [];
let nav;
try {
  await espera(1200);
  nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await nav.newPage({ viewport: { width: 390, height: 844 } });
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); }); page.on('pageerror', e => errores.push(String(e)));
  await page.goto('http://localhost:' + PUERTO + '/', { waitUntil: 'load' });
  await page.waitForSelector('#menu .mesc', { timeout: 60000 });
  await espera(1500);
  await page.click('#menu .mesc'); await espera(1000);
  /* mide los cuatro enlaces y hace la foto */
  const revisa = async (nombre) => {
    const tarj = page.locator('#hoja .esc-falange');
    await tarj.scrollIntoViewIfNeeded(); await espera(300);
    const abierta = await page.$('#hoja .esc-rv');
    if (!abierta) { await tarj.click(); await espera(500); }
    await page.locator('#hoja .esc-rv').scrollIntoViewIfNeeded(); await espera(300);
    const m = await page.evaluate(() => {
      const vw = innerWidth, vh = innerHeight;
      return { vw, vh, ancho: document.documentElement.scrollWidth, enl: [...document.querySelectorAll('#hoja .esc-rv a')].map(a => {
        const r = a.getBoundingClientRect(), b = a.querySelector('b'), s = a.querySelector('small');
        const corta = e => e && (e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > r.right + 1);
        return { href: a.getAttribute('href'), alto: r.height, izq: r.left, der: r.right, arriba: r.top, abajo: r.bottom, corta: corta(b) || corta(s) };
      }) };
    });
    if (m.enl.length !== 4) fallos.push(nombre + ': hay ' + m.enl.length + ' enlaces, no 4');
    m.enl.forEach((e, i) => {
      if (e.href !== 'gobierno/maquetas/falange/?rival=' + RIVALES[i]) fallos.push(nombre + ': enlace ' + i + ' va a ' + e.href);
      if (e.alto < 48) fallos.push(nombre + ': ' + RIVALES[i] + ' mide ' + Math.round(e.alto) + ' px de alto');
      if (e.izq < 0 || e.der > m.vw || e.arriba < 0 || e.abajo > m.vh) fallos.push(nombre + ': ' + RIVALES[i] + ' no cabe en pantalla');
      if (e.corta) fallos.push(nombre + ': texto cortado en ' + RIVALES[i]);
    });
    if (m.ancho > m.vw) fallos.push(nombre + ': la página se sale de ancho (' + m.ancho + ' > ' + m.vw + ')');
    console.log(nombre, JSON.stringify(m.enl.map(e => Math.round(e.alto) + 'px')));
    await page.screenshot({ path: join(SAL, 'FA7-' + nombre + '-menu.jpg'), type: 'jpeg', quality: 72, timeout: 120000 });
  };
  await revisa('v');
  /* tocar otra vez la tarjeta lo pliega */
  await page.locator('#hoja .esc-falange').click(); await espera(500);
  if (await page.$('#hoja .esc-rv')) fallos.push('tocar otra vez la tarjeta no pliega el menú');
  await page.setViewportSize({ width: 844, height: 390 }); await espera(800);
  await revisa('h');
} catch (e) { fallos.push('el guion falló: ' + e.message); }
finally {
  if (nav) await nav.close(); srv.kill();
  if (errores.length) fallos.push('errores de consola:\n' + errores.join('\n'));
  console.log(fallos.length ? 'NO APTO\n' + fallos.join('\n') : 'APTO');
}
