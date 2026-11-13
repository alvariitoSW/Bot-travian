/* K10 · pegado de la pieza P1 en la pantalla real de batalla (844×390), sin tocar js/.
   Uso: node pegar-p1.mjs <archivo estandarte.svg.js> <salida.jpg> */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from "node:fs/promises";
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const [dir, salida] = process.argv.slice(2);
const css = (await readFile(resolve(dir, 'tarjeta.css'), 'utf8')) + '\n' + (await readFile(resolve(dir, 'hud.css'), 'utf8'));
const frag = await readFile(resolve(dir, 'tarjeta.html'), 'utf8');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.message).slice(0, 200)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/'); await page.waitForTimeout(1500);
await page.setViewportSize({ width: 390, height: 844 }); await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
await page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; }); await page.setViewportSize({ width: 844, height: 390 });
await page.evaluate(() => {
  const lado = (units, n, col, gen) => ({ units, name: n, col, gen: gen ? { n: gen } : null, atkMul: 1, defMul: 1, mor: 0 });
  UI.binfo = { cfg: { sides: [lado({ hastati: 240, principes: 160, triarii: 80, velites: 120, equites: 80 }, 'Roma', '#c0281f', 'Cónsul'), lado({ libios: 240, iberos: 160, honderos: 120, numidas: 80, elefantes: 16 }, 'Cartago', '#5b3a8c', 'Sufete')], defender: 1, wall: 0, seed: 7 }, city: 'roma', kind: 'attack' };
  const bt = document.createElement('button'); bt.dataset.act = 'bview'; document.body.appendChild(bt); bt.click(); bt.remove();
});
await page.waitForTimeout(11000); await page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
await page.evaluate(() => { UI.battle.view.intro = 1; });
if (await page.locator('#bctl [data-act="bstart"]').count()) await page.click('#bctl [data-act="bstart"]'); await page.waitForTimeout(2000);
await page.evaluate(() => { UI.battle.panelT = performance.now(); });
await page.click('#bctl [data-act="btarj"][data-v="1"]'); await page.waitForTimeout(2500);

await page.addStyleTag({ content: css + '\n#bpanel,#bhud,#bbottom{display:none!important}' });
const TJ = [['Quinto Fabio', 'Prudente', 'Cerrad filas y aguantad el choque', 'Que se estrellen contra los escudos.', 'Dudoso', 'dud'], ['Cayo Flaminio', 'Agresivo', 'Adelantad el centro', 'Su centro es lo más cercano.', 'Arriesgado', 'arr'], ['Publio Cornelio', 'Astuto', 'La caballería rodea su flanco derecho', 'Los jinetes pueden rodearles.', 'Arriesgado', 'arr']];
await page.evaluate(({ frag, TJ }) => {
  for (const id of ['bhud', 'bbottom', 'bpanel']) { const e = document.getElementById(id); if (e) e.style.setProperty('display', 'none', 'important'); }
  const tj = TJ.map((t, i) => { let h = frag.replaceAll('{{nombre}}', t[0]).replaceAll('{{caracter}}', t[1]).replaceAll('{{titulo}}', t[2]).replaceAll('{{motivo}}', t[3]).replaceAll('{{etiqueta}}', t[4]); const d = document.createElement('div'); d.innerHTML = h.trim(); const b = d.firstElementChild; b.classList.remove('tarjeta--fav', 'tarjeta--dud', 'tarjeta--arr'); b.classList.add('tarjeta--' + t[5]); if (i === 1) b.classList.add('sel'); if (frag.includes('tarjeta--lanza') || document.styleSheets.length) { const m = { Agresivo: 'lanza', Astuto: 'yelmo' }[t[1]]; if (m) b.classList.add('tarjeta--' + m); } return b.outerHTML; }).join('');
  const w = document.createElement('div'); w.style.cssText = 'position:absolute;inset:0;z-index:50;pointer-events:none';
  w.innerHTML = '<div class="hud"><div class="hud-barra"><span class="hud-ronda">Ronda 1 · Plan</span><span class="hud-roma">Roma 700</span><div class="hud-fuerza"><i style="width:52%"></i></div><span class="hud-cart">636 Cartago</span><button class="hud-ala">Ala izq.</button><button class="hud-ala">Centro</button><button class="hud-ala">Ala der.</button></div><div class="hud-objetivo">Cayo Flaminio: Adelantad el centro. Mira el plan sobre el campo y pulsa «Ver la ronda».</div><div class="hud-gesto">La caballería enemiga busca tu flanco izquierdo…</div><button class="hud-seguir">Seguir</button><div class="hud-ordenes"><div class="hud-tarjetas">' + tj + '</div><button class="hud-btn">A mano</button><button class="hud-btn hud-principal">Ver la ronda</button></div></div>';
  document.getElementById('battle').appendChild(w);
}, { frag, TJ });
const med = await page.evaluate(() => {
  const h = document.querySelector('.hud'); const o = { chicas: [], botones: [], tarjetas: [] };
  h.querySelectorAll('*').forEach(e => { const t = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (t) { const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11) o.chicas.push(e.className + ':' + fs); } });
  h.querySelectorAll('button.hud-ala,button.hud-btn,button.hud-seguir,.tarjeta').forEach(e => { const r = e.getBoundingClientRect(); if (e.classList.contains('tarjeta')) o.tarjetas.push(Math.round(r.width) + 'x' + Math.round(r.height)); else if (r.height < 43.5) o.botones.push(e.className + ':' + r.height.toFixed(1)); });
  return o;
});
const PAL = new Set(['#0b1016', '#c0281f', '#e9c063', '#b8862b', '#f1ead9', '#9aa6b4', '#8fae5a', '#d9764a', '#5b3a8c', '#2a6fa8', '#3f8a4a', '#b9873a', '#000000', '#ffffff', '#000', '#fff']);
const fuera = new Set(); for (const m of css.matchAll(/#[0-9a-fA-F]{3,6}\b/g)) { let x = m[0].toLowerCase(); if (x.length === 4) x = '#' + x[1] + x[1] + x[2] + x[2] + x[3] + x[3]; if (!PAL.has(x)) fuera.add(x); }
med.coloresFuera = [...fuera]; console.log('MEDIDAS', JSON.stringify(med));
await page.waitForTimeout(800);
await page.screenshot({ path: resolve(salida), type: 'jpeg', quality: 80, timeout: 120000 });
console.log('errores:', JSON.stringify(errores));
await br.close(); srv.close();
