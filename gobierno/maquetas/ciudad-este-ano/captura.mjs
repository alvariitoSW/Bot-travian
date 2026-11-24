// CE5: pantalla «Este año». Saca capturas a gobierno/capturas-tarea/CE5-*.jpg y comprueba lo básico.
// Uso: node gobierno/maquetas/ciudad-este-ano/captura.mjs   (sale con 1 si algo falla)
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { mkdir } from 'fs/promises';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..', '..'), SAL = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const br = await chromium.launch(); await mkdir(SAL, { recursive: true });
let malas = 0; const errores = [];
const chk = (nom, ok, det) => { console.log((ok ? 'OK    ' : 'FALLO ') + nom + (det ? ' — ' + det : '')); if (!ok) malas++; };
const base = pathToFileURL(join(AQUI, 'index.html')).href;
async function pag(q) {
  const p = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); }); p.on('pageerror', e => errores.push(String(e)));
  await p.goto(base + (q || '')); await p.waitForSelector('.ea-card'); await p.waitForTimeout(500); return p;
}
const foto = async (q, nom, entera) => {
  const p = await pag(q);
  if (entera) { await p.addStyleTag({ content: '.ea-fondo{position:static!important}.ea-hoja{max-height:none!important}.ea-cuerpo{overflow:visible!important}html,body{height:auto!important;overflow:visible!important}' }); }
  if (q && q.includes('tributo')) await p.evaluate(() => { const h = [...document.querySelectorAll('.ea-h')].find(x => x.textContent.includes('Tributo')); if (h) h.scrollIntoView({ block: 'start' }); });
  await p.screenshot({ path: join(SAL, nom), type: 'jpeg', quality: 85, fullPage: !!entera }); await p.close();
};
await foto('', 'CE5-imperio.jpg'); await foto('?ambito=capua', 'CE5-ciudad.jpg'); await foto('?tributo=suspendido', 'CE5-tributo-suspendido.jpg');
await foto('?abierta=denarios', 'CE5-detalle.jpg'); await foto('', 'CE5-entera.jpg', true);
chk('5 capturas', true);
const p = await pag('');
chk('sin scroll horizontal', await p.evaluate(() => { const c = document.querySelector('.ea-cuerpo'); return c.scrollWidth <= c.clientWidth + 1 && document.documentElement.scrollWidth <= 390; }));
chk('botones >= 44 px', await p.evaluate(() => [...document.querySelectorAll('.ea-hoja button')].every(b => b.getBoundingClientRect().height >= 43.5)));
await p.locator('[data-act=eafila][data-v=grano]').click(); chk('fila se despliega', await p.locator('.ea-det').count() === 1);
await p.locator('[data-act=eaambito][data-v=capua]').click(); chk('cambia de ámbito', await p.locator('.ea-ficha.on').innerText() === 'Capua');
await p.locator('[data-act=eacaja]').click(); chk('caja dispara data-act', await p.evaluate(() => window.ULTIMA) === 'eacaja');
chk('sin errores de consola', errores.length === 0, errores.slice(0, 3).join(' | '));
await br.close(); process.exit(malas ? 1 : 0);
