// CS3: menú de clases sociales. Saca 4 capturas a gobierno/capturas-tarea/ y comprueba el recorrido.
// Uso: servir la raíz con `python3 -m http.server 8765` y luego `node gobierno/maquetas/clases/captura.mjs`   (sale con 1 si algo falla)
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir, stat } from 'fs/promises';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SAL = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const URL = process.env.URL_BASE || 'http://localhost:8765/gobierno/maquetas/clases/index.html';
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); await mkdir(SAL, { recursive: true });
let malas = 0; const errores = [];
const chk = (nom, ok, det) => { console.log((ok ? 'OK    ' : 'FALLO ') + nom + (det ? ' — ' + det : '')); if (!ok) malas++; };
const p = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); }); p.on('pageerror', e => errores.push(String(e)));
await p.goto(URL); await p.waitForSelector('.cl-card');
await p.waitForTimeout(Number(process.env.ESPERA || 10000));
const foto = async nom => { await p.screenshot({ path: join(SAL, nom), type: 'jpeg', quality: 70 }); const s = await stat(join(SAL, nom)); chk(nom + ' ≤ 150 KB', s.size <= 150 * 1024, Math.round(s.size / 1024) + ' KB'); };
chk('4 tarjetas', await p.locator('.cl-card').count() === 4);
const retratos = await p.evaluate(() => [...document.querySelectorAll('.cl-card img')].filter(i => i.src.startsWith('data:image/png')).length);
console.log('retratos 3D listos: ' + retratos + ' de 8 (el resto son siluetas de reserva)');
await foto('CS3-menu.jpg');
for (const [id, nom] of [['plebe', 'CS3-plebe.jpg'], ['esclavos', 'CS3-esclavos.jpg'], ['patricios', 'CS3-patricios.jpg']]) {
  await p.locator('[data-cl=' + id + ']').click(); await p.waitForTimeout(1500);
  if (id === 'plebe') {
    chk('plebe: hay barrios que protestan', await p.locator('.cl-bq').count() > 0, String(await p.locator('.cl-bq').count()));
    chk('plebe: 8 necesidades', await p.locator('.cl-n').count() === 8);
    await p.locator('.cl-cuerpo').evaluate(e => { e.scrollTop = 190; }); await p.waitForTimeout(300);
  }
  await foto(nom);
  if (id === 'plebe') {
    await p.locator('.cl-enc').first().click(); chk('Encargar al ministro llama al juego', await p.evaluate(() => window.ENCARGOS.length === 1 && window.ENCARGOS[0].barrio !== undefined));
    chk('sale el aviso de encargado', await p.locator('.cl-msg.ok').count() === 1);
  }
  chk(id + ': sin desborde de 390', await p.evaluate(() => [...document.querySelectorAll('.cl-fondo *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > 390.5 || b.left < -0.5); }).length === 0));
  chk(id + ': botones de 44 px', await p.evaluate(() => [...document.querySelectorAll('.cl-fondo button')].filter(b => b.getBoundingClientRect().height < 43.5).length === 0));
  await p.locator('[data-acc=atras]').click(); await p.waitForTimeout(300);
}
chk('Patricios: cifra = 10 % de ciudadanos', await p.evaluate(() => { const t = [...document.querySelectorAll('.cl-card')].map(c => c.querySelector('b').textContent.replace(/\D/g, '')); return Number(t[2]) === 52 && Number(t[1]) === 468; }));
await p.locator('[data-acc=cerrar]').click(); chk('cerrar quita la hoja', await p.locator('.cl-fondo').count() === 0);
chk('sin errores de consola', errores.length === 0, errores.slice(0, 3).join(' | '));
await br.close(); process.exit(malas ? 1 : 0);
