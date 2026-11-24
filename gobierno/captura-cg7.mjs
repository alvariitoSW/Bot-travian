/* AQVILA — CG7: capturas y prueba de la batalla rápida (js/ui-batalla-rapida.js), a 390×844 y 844×390.
   Uso: node gobierno/captura-cg7.mjs   → gobierno/capturas-tarea/CG7-*.jpg. Sale con código 1 si hay errores de consola o de página. */
import { createRequire } from 'node:module';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const { chromium } = createRequire(import.meta.url)('playwright');
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..'), SAL = join(RAIZ, 'gobierno/capturas-tarea'), PUERTO = 8793;
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
const espera = ms => new Promise(r => setTimeout(r, ms));
const errores = [];
let nav;
try {
  await espera(1200);
  nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error' && !/GPU stall|GL Driver/.test(m.text())) errores.push('consola: ' + m.text()); });
  page.on('pageerror', e => errores.push('página: ' + e.message));
  await page.goto('http://localhost:' + PUERTO + '/', { waitUntil: 'load' });
  await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
  await espera(2500);
  const foto = async n => { await espera(500); await page.screenshot({ path: join(SAL, 'CG7-' + n + '.jpg'), type: 'jpeg', quality: 80, timeout: 120000 }); console.log('foto', n); };
  const toca = async v => { await page.click('#hoja [data-act="escel"][data-v="' + v + '"]'); await espera(400); };
  const fase = () => page.evaluate(() => window.__br && window.__br.fase);
  const veloVisible = () => page.evaluate(() => { const v = document.querySelector('#br .br-velo'); return !!v && !v.hidden; });

  await page.click('#menu .mesc'); await espera(1000);
  await toca('paso:4'); await foto('1-entrada');
  await toca('rapida:'); await page.waitForSelector('#br canvas', { timeout: 20000 }); await espera(1200); await foto('2-planear');
  await page.click('#br .br-ala:nth-child(2) [data-k="cargar"]'); await espera(300);
  const id = await page.evaluate(() => { const u = window.__br.R.S.man.find(m => m.lado === 0 && m.estado === 'firme'); return u ? u.id : null; });
  const p = await page.evaluate(i => window.__br.pos(i), id);
  await page.mouse.click(p[0], p[1]); await espera(400); await foto('3-unidad');
  await page.mouse.click(20, 120); await espera(300);   // el suelo: vuelve a las alas
  await page.click('#br .br-mirar'); await espera(1000);
  const c0 = await page.evaluate(() => window.__br.cuadros); await espera(4000);
  await foto('4-mirar');
  const c1 = await page.evaluate(() => window.__br.cuadros); await espera(3000);
  const c2 = await page.evaluate(() => window.__br.cuadros);
  console.log('fps en mirar (software, 390×844): ' + ((c2 - c0) / 8.5).toFixed(1));
  for (let i = 0; i < 20 && !(await veloVisible()); i++) {
    const f = await fase();
    if (f === 'planear') { await page.click('#br .br-mirar'); await espera(300); }
    else if (f === 'mirar') { await page.click('#br .br-saltar'); await espera(500); }
    else await espera(500);
    if (i === 3) await foto('4b-ronda-siguiente');
  }
  await page.waitForSelector('#br .br-velo:not([hidden])', { timeout: 15000 }); await foto('5-fin');
  await page.click('#br .br-ver'); await espera(600);
  console.log('nodo cerrado:', await page.evaluate(() => !document.getElementById('br') && !window.__br));
  await foto('5b-aviso-tras-ver');
  await toca('paso:4'); await toca('resolver:'); await page.waitForSelector('#br .br-velo:not([hidden])', { timeout: 15000 }); await foto('6-resolver');
  await page.click('#br .br-ver'); await espera(500);
  await page.evaluate(() => window.UIBatallaRapida.elegir({ semilla: 3, ejercitos: [{ hastati: 480, principes: 480, triarii: 240 }, { galos: 1500 }] }, () => {}));
  await foto('7-elegir');
  await page.click('#br-el [data-k="volver"]'); await espera(300);
  await page.setViewportSize({ width: 844, height: 390 }); await espera(500);
  await page.evaluate(() => window.UIBatallaRapida.abrir({ semilla: 9, col: '#2a6b8a', ejercitos: [{ hastati: 480, principes: 480, triarii: 240, velites: 300 }, { galos: 1500, jinetes: 200 }] }, () => {}));
  await page.waitForSelector('#br canvas'); await espera(1500); await foto('8-horizontal-planear');
  await page.click('#br .br-mirar'); await espera(5000); await foto('9-horizontal-mirar');
  const f0 = await page.evaluate(() => window.__br.cuadros); await espera(3000);
  console.log('fps en mirar (software, 844×390): ' + ((await page.evaluate(() => window.__br.cuadros) - f0) / 3).toFixed(1));
} catch (e) { errores.push('guion: ' + e.message); }
finally { if (nav) await nav.close(); srv.kill(); }
console.log(errores.length ? 'ERRORES:\n' + errores.join('\n') : 'sin errores de consola ni de página');
process.exit(errores.length ? 1 : 0);
