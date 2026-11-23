// CD3b: pantalla «Tus ministros». Saca 4 capturas a gobierno/capturas-tarea/ y comprueba el recorrido.
// Uso: node gobierno/maquetas/ciudad-ministros/captura.mjs   (sale con 1 si algo falla)
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
  const p = await br.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); }); p.on('pageerror', e => errores.push(String(e)));
  await p.goto(base + (q || '')); await p.waitForSelector('.mn-card'); return p;
}
const foto = async (q, nom) => { const p = await pag(q); await p.screenshot({ path: join(SAL, nom), type: 'jpeg', quality: 85 }); await p.close(); };
await foto('', 'CD3b-1-lista.jpg'); await foto('?abre=ejercito', 'CD3b-2-abierto.jpg'); await foto('?abre=infra&lista=infra', 'CD3b-3-encargar.jpg'); await foto('?abajo=1', 'CD3b-4-abajo.jpg');
chk('4 capturas', true);

const p = await pag('');
const tarjetas = await p.locator('.mn-card').count(); chk('8 tarjetas', tarjetas === 8, String(tarjetas));
// Aceptar una propuesta
const antes = await p.locator('[data-acc=aceptar]').count();
chk('hay propuestas', antes > 0, String(antes));
const mid1 = await p.locator('[data-acc=aceptar]').first().getAttribute('data-mid');
await p.locator('[data-acc=aceptar]').first().click();
chk('Aceptar pasa a encargo', await p.evaluate(m => !!window.S.ministros.encargos[m] && !window.S.ministros.propuestas[m], mid1));
// Descartar
const nd = await p.locator('[data-acc=descartar]').count();
if (nd) { const m2 = await p.locator('[data-acc=descartar]').first().getAttribute('data-mid'); await p.locator('[data-acc=descartar]').first().click(); chk('Descartar quita la propuesta', await p.evaluate(m => !window.S.ministros.propuestas[m], m2)); }
else chk('Descartar (no quedaban propuestas)', true);
// Encargar un candidato (ciencia no tiene encargo)
await p.locator('[data-acc=abrir][data-mid=ciencia]').click(); await p.locator('[data-acc=encargar][data-mid=ciencia]').click();
const val = p.locator('.mn-o:not(.no)').first(); chk('hay un candidato válido', await val.count() > 0);
await val.click();
chk('Encargar crea el encargo', await p.evaluate(() => !!window.S.ministros.encargos.ciencia) && await p.evaluate(() => window.CAMBIOS > 0));
// Candidato apagado muestra motivo
await p.locator('[data-acc=abrir][data-mid=agricultura]').click(); await p.locator('[data-acc=encargar][data-mid=agricultura]').click();
chk('candidatos apagados con motivo', await p.locator('.mn-o.no small').count() > 0);
const t = await p.evaluate(() => document.body.innerText); chk('nunca sale «termas»', !/termas/i.test(t));
chk('sale «Baños»', /Baños/.test(await (await pag('?abre=infra')).evaluate(() => document.body.innerText)));
// nada sobresale de 390
const fuera = await p.evaluate(() => { const r = []; document.querySelectorAll('.mn-fondo *').forEach(e => { const b = e.getBoundingClientRect(); if (b.width && (b.right > 390.5 || b.left < -0.5) && !e.closest('.mn-asa')) r.push(e.className + ':' + Math.round(b.right)); }); return r.slice(0, 5); });
chk('nada sobresale de 390', fuera.length === 0, fuera.join(' '));
const chico = await p.evaluate(() => [...document.querySelectorAll('.mn-fondo button')].filter(b => b.getBoundingClientRect().height < 40).length); chk('botones de 40 px o más', chico === 0, String(chico));
chk('sin errores de consola', errores.length === 0, errores.slice(0, 3).join(' | '));
await br.close(); process.exit(malas ? 1 : 0);
