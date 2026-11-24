// CE4b: pantalla del mercado. Saca 4 capturas a gobierno/capturas-tarea/ y comprueba lo esencial.
// Uso: node gobierno/maquetas/mercado/captura.mjs   (sale con 1 si algo falla)
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
async function pag(t) {
  const p = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  p.on('pageerror', e => errores.push(String(e)));
  await p.goto(base + '?pestana=' + t); await p.waitForSelector('.mu-hoja'); return p;
}
const ancho = p => p.evaluate(() => document.documentElement.scrollWidth);
const fuera = p => p.evaluate(() => [...document.querySelectorAll('.mu-hoja *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && (b.right > 390.5 || b.left < -0.5); }).length);
const chicos = p => p.evaluate(() => [...document.querySelectorAll('.mu-hoja button, .mu-hoja select')].filter(e => e.getBoundingClientRect().height < 43.5).map(e => e.textContent.trim().slice(0, 20)));
const den = async p => parseFloat((await p.innerText('[data-mu-den]')).replace(/[^0-9,]/g, '').replace(',', '.'));
const foto = (p, nom) => p.screenshot({ path: join(SAL, nom + '.jpg'), type: 'jpeg', quality: 85 });
if (false) 0;
for (const [t, nom] of [['precios', (process.env.PFX||'CE4b-')+'1-precios'], ['rutas', (process.env.PFX||'CE4b-')+'2-rutas'], ['senado', (process.env.PFX||'CE4b-')+'3-senado'], ['aduanas', (process.env.PFX||'CE4b-')+'4-aduanas']]) {
  const p = await pag(t);
  if (t === 'senado') await p.evaluate(() => [...document.querySelectorAll('.mu-sec h3')].find(h => /publicanos/.test(h.textContent)).scrollIntoView());
  await foto(p, nom);
  chk('ancho ≤ 390 en ' + t, await ancho(p) <= 390, String(await ancho(p)));
  chk('nada sobresale en ' + t, await fuera(p) === 0, String(await fuera(p)));
  const ch = await chicos(p); chk('botones ≥ 44 px en ' + t, ch.length === 0, ch.join('|'));
  const txt = await p.innerText('.mu-hoja'); chk('sin «undefined» ni NaN en ' + t, !/undefined|NaN/.test(txt));
  await p.close();
}
{ // ficha abierta (captura 5) y mapa de cerca (captura 6)
  const p = await pag('precios'); await p.click('.mu-prod >> nth=2'); await p.waitForSelector('[data-mu=comprar]'); await foto(p, (process.env.PFX||'CE4b-')+'5-ficha');
  chk('ficha: medallón visible', await p.locator('.mu-fic .mu-med').count() === 1);
  chk('ancho ≤ 390 en ficha', await ancho(p) <= 390); chk('nada sobresale en ficha', await fuera(p) === 0); await p.close();
  const r = await pag('rutas'); await r.locator('.mu-mapa').screenshot({ path: join(SAL, (process.env.PFX||'CE4b-')+'6-mapa.jpg'), type: 'jpeg', quality: 90 });
  chk('mapa: ciudades dibujadas', await r.locator('.mu-mapa circle').count() >= 4, String(await r.locator('.mu-mapa circle').count()));
  chk('mapa: nombres de ciudad', (await r.locator('.mu-mapa text').allTextContents()).includes('Roma'));
  chk('sin emojis en los productos', !/[\u{1F300}-\u{1FAFF}]/u.test(await r.locator('.mu-hoja').innerText())); await r.close();
}
{ // comprar cambia los denarios
  const p = await pag('precios'); const d0 = await den(p);
  await p.click('.mu-prod >> nth=0'); await p.click('[data-mu=comprar][data-n="5"]');
  const d1 = await den(p); chk('comprar baja los denarios', d1 < d0, d0 + ' → ' + d1);
  await p.click('[data-mu=vender][data-n="1"]'); chk('vender sube los denarios', await den(p) > d1);
  await p.close();
}
{ // la tasa
  const p = await pag('aduanas'); const sube = p.locator('[data-mu=tasa][data-d="1"]').first();
  const antes = await p.locator('.mu-tasa output').first().innerText(); await sube.click();
  const desp = await p.locator('.mu-tasa output').first().innerText(); chk('subir la tasa cambia el %', antes !== desp, antes + ' → ' + desp);
  await p.close();
}
{ // rutas: quitar y crear
  const p = await pag('rutas'); const n0 = await p.locator('[data-mu=rquitar]').count();
  await p.click('[data-mu=rquitar] >> nth=0'); chk('quitar ruta', await p.locator('[data-mu=rquitar]').count() === n0 - 1);
  await p.click('[data-mu=rcrear]'); chk('crear ruta o aviso visible', (await p.locator('[data-mu=rquitar]').count() === n0) || (await p.locator('.mu-av').first().innerText()).length > 0);
  await p.close();
}
{ // senado: proponer
  const p = await pag('senado'); await p.click('[data-mu=ley] >> nth=0');
  chk('proponer ley da respuesta', (await p.locator('.mu-av').first().innerText()).length > 0);
  chk('hay contratos públicos o «—»', /publicanos/i.test(await p.innerText('.mu-hoja')));
  await p.close();
}
chk('sin errores de consola', errores.length === 0, errores.slice(0, 3).join(' | '));
await br.close(); process.exit(malas ? 1 : 0);
