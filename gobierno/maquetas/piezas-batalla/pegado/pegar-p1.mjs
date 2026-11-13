/* K10 · pegado de la pieza P1 en la pantalla real de batalla (844×390), sin tocar js/.
   Uso: node pegar-p1.mjs <archivo estandarte.svg.js> <salida.jpg> */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const [arch, salida] = process.argv.slice(2);
const codigo = await readFile(resolve(arch), 'utf8');
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
await page.addScriptTag({ content: codigo });
// Verdad: se reparten estados conocidos a los regimientos de Roma (de izquierda a derecha) y Cartago (idem)
const R_TIPOS = ['hastati', 'equites', 'principes', 'triarios', 'velites', 'hastati', 'principes', 'general', 'triarios'];
const C_TIPOS = ['falange', 'elefantes', 'equites', 'velites', 'hastati', 'falange', 'principes', 'triarios', 'general'];
const info = await page.evaluate(({ R_TIPOS, C_TIPOS }) => {
  const V = UI.battle.view, out = { roma: [], cartago: [] };
  const lista = lado => V.R.filter(R => R.r.side === lado && R.el).map(R => ({ R, x: parseFloat((R.el.style.transform.match(/translate\(([-\d.]+)px/) || [0, 0])[1]) || 0, y: parseFloat((R.el.style.transform.match(/translate\([-\d.]+px,\s*([-\d.]+)px/) || [0, 0, 0])[2]) || 0 })).sort((a, b) => (Math.round(a.y / 25) - Math.round(b.y / 25)) || (a.x - b.x)).map(o => o.R);
  const cfg = {
    0: { animo: ['F', 'F', 'F', 'F', 'D', 'F', 'V', 'F', 'H'], cans: [0, 1, 0, 3, 0, 1, 0, 2, 0], vet: [0, 1, 0, 1, 0, 0, 1, 2, 1] },
    1: { animo: ['F', 'F', 'D', 'F', 'F', 'F', 'V', 'F', 'H'], cans: [0, 0, 1, 0, 2, 0, 0, 3, 0], vet: [1, 0, 0, 2, 0, 1, 0, 0, 1] }
  };
  for (const lado of [0, 1]) lista(lado).forEach((R, i) => {
    const c = cfg[lado], ex = i >= 9, tipo = ex ? (lado ? 'velites' : 'hastati') : (lado ? C_TIPOS : R_TIPOS)[i], d = { bando: lado, tipo, animo: ex ? 'F' : c.animo[i], cansancio: ex ? 0 : c.cans[i], vet: ex ? 0 : c.vet[i], sel: lado === 0 && i === 2 };
    out[lado ? 'cartago' : 'roma'].push(d);
    // se esconde el dibujo viejo y se pone el nuevo; barra y puntos del juego se quedan debajo
    for (const h of R.el.querySelectorAll('i,q')) h.style.display = 'none';
    const sv = document.createElement('div'); sv.className = 'k10'; sv.style.cssText = 'width:36px;height:60px;margin-left:-3px;'; sv.innerHTML = estandarte(d); R.el.insertBefore(sv, R.el.firstChild);
    R.el.style.width = '30px'; R.el.classList.remove('sel');
    R.el.dataset.k10 = '1'; R.el.style.setProperty('left', (150 + (i % 8) * 70) + 'px', 'important'); R.el.style.setProperty('top', (lado ? 100 : 232) + 'px', 'important'); if (i >= 8) R.el.classList.add('k10x');
  });
  const st = document.createElement('style'); st.textContent = '.bflag[data-k10]::before,.bflag[data-k10]::after{display:none!important}.bflag[data-k10]{transform:none!important;display:block!important}.bflag[data-k10].k10x{display:none!important}.bflag.m2 .k10,.bflag.rout .k10{transform:none!important;opacity:1!important;filter:none!important}.bflag.m1,.bflag.m2{filter:drop-shadow(0 2px 3px #000a)!important}'; document.head.appendChild(st);
  return out;
}, { R_TIPOS, C_TIPOS });
await page.waitForTimeout(800);
await page.screenshot({ path: resolve(salida), type: 'jpeg', quality: 80, timeout: 120000 });
console.log(JSON.stringify(info), 'errores:', JSON.stringify(errores));
await br.close(); srv.close();
