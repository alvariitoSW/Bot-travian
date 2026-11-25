/* AQVILA · BT1 (Gráficos): «Un solo campo y una sola luz». Prueba en navegador (390×844) de lo que se ve:
   1. la batalla grande y la escena a pie («Bajar a pie» desde ella) usan el mismo mundo: misma luz, bruma, cielo, exposición y suelo
      (window.__mundo, que ponen js/gfx/campo-mando.js y gobierno/maquetas/bloque/escena.js);
   2. ningún tinte rojo cubre la pantalla: con el aviso de salva encendido en el testudo, la franja de arriba es fina y el color medio
      de la parte de arriba de la captura no es rojo;
   3. en Ásculo la bruma no tapa las tropas: a la distancia de juego hay menos de un 10 % de bruma.
   Y 0 errores de consola. Uso: node test/graficos-bt1.mjs */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const RAIZ = new URL('../', import.meta.url).pathname, PUERTO = 8494;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const URL0 = `http://localhost:${PUERTO}/`;
let n = 0, mal = 0; const errores = [];
const t = (nombre, ok, info) => { if (ok) { n++; console.log('bien', nombre); } else { mal++; console.log('MAL', nombre, info === undefined ? '' : '— ' + JSON.stringify(info)); } };
async function pagina(w = 390, h = 844) {
  const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true, isMobile: w < h });
  p.on('pageerror', e => errores.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 200)); });
  return p;
}
/* lo que se compara del mundo (sin funciones) y la bruma a la distancia de juego */
const MUNDO = () => { const m = window.__mundo; if (!m) return null; return { id: m.id, sol: m.sol, bruma: m.bruma, horiz: m.horiz, suelo: m.suelo, exposicion: m.exposicion }; };
const BRUMA = () => { const m = window.__mundo; if (!m || !m.vista) return null; const D = m.vista(), k = m.densidad(); return { D, k, a15: 1 - Math.exp(-((k * 1.5 * D) ** 2)) }; };
/* color medio (r, g, b) de la franja de arriba de la pantalla, de una captura */
async function colorArriba(p, frac) {
  const b64 = (await p.screenshot({ type: 'png' })).toString('base64');
  return p.evaluate(async ([b, f]) => { const im = new Image(); im.src = 'data:image/png;base64,' + b; await im.decode();
    const c = document.createElement('canvas'), h = Math.round(im.height * f); c.width = im.width; c.height = h; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, im.width, h).data; let r = 0, gg = 0, bb = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; } const k = d.length / 4; return [r / k, gg / k, bb / k]; }, [b64, frac]);
}
try {
  /* 1 · la batalla grande y «Bajar a pie» */
  {
    const p = await pagina();
    await p.goto(URL0, { waitUntil: 'load' }); await p.waitForSelector('#menu .mesc', { timeout: 60000 }); await p.waitForTimeout(1000);
    await p.click('#menu .mesc'); await p.waitForTimeout(1000); await p.click('#hoja .cg2-go'); await p.waitForSelector('#br-el', { timeout: 30000 });
    await p.click('#br-el [data-k="vivo"]'); await p.waitForFunction(() => window.__mn && window.__mn.lista, null, { timeout: 240000 }); await p.waitForTimeout(3000);
    const arriba = await p.evaluate(MUNDO), bArriba = await p.evaluate(BRUMA);
    t('la batalla grande dice qué mundo pinta', !!arriba, arriba);
    t('desde arriba, la bruma no tapa las tropas (< 10 % a 1,5 veces la distancia de juego)', bArriba && bArriba.a15 < 0.1, bArriba);
    const r = await p.evaluate(() => { const S = window.__mn.S; for (const u of S.man) if (u.lado === 0 && !window.__mn.bajar(u.id)) return u.id; return null; });
    t('se puede bajar a pie', r !== null, r);
    for (let i = 0; i < 160; i++) { await p.waitForTimeout(1500); const a = await p.evaluate(() => window.__mn.apie()); if (a && a.lista) break; }
    await p.waitForTimeout(2000);
    const abajo = await p.evaluate(m => { const f = window.__mn.capa(); return f ? f.contentWindow.eval('(' + m + ')()') : null; }, MUNDO.toString());
    t('a pie dice qué mundo pinta', !!abajo, abajo);
    t('a pie, el mismo campo y la misma luz que arriba (id, sol, bruma, cielo, exposición, suelo)', !!arriba && !!abajo && JSON.stringify(arriba) === JSON.stringify(abajo), { arriba, abajo });
    await p.close();
  }
  /* 2 · el testudo con el aviso de salva: sin tinte rojo a pantalla completa */
  {
    const p = await pagina();
    await p.goto(URL0 + 'gobierno/maquetas/a-pie/?semilla=7&nivel=normal&fase=testudo', { waitUntil: 'load' });
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 240000 }); await p.waitForTimeout(4000);
    const alto = await p.evaluate(() => { const b = document.getElementById('borde-a'); if (!b) return 0; b.classList.add('ve'); b.classList.remove('late'); return b.getBoundingClientRect().height; });
    await p.waitForTimeout(600);
    t('el aviso de arriba es solo una línea en el borde (≤ 4 px)', alto <= 4, alto);
    const [r, g, b] = await colorArriba(p, 0.2), cociente = g / Math.max(1, r);
    t('la parte de arriba con el aviso encendido no es roja (verde/rojo ≥ 0,7)', cociente >= 0.7 && r - b < 110, { r: Math.round(r), g: Math.round(g), b: Math.round(b), cociente: +cociente.toFixed(2) });
    await p.close();
  }
  /* 3 · Ásculo: la cámara abierta, sin bruma sobre las tropas */
  {
    const p = await pagina();
    await p.goto(URL0 + 'gobierno/maquetas/bloque/index.html?formacion=combinada&escenario=asculo&bando=pirro&semilla=7&nivel=normal&fase=lucha', { waitUntil: 'load' });
    await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 240000 }); await p.waitForTimeout(4000);
    const b = await p.evaluate(BRUMA);
    t('Ásculo: la bruma no tapa las tropas (< 10 % a 1,5 veces la distancia de juego)', b && b.a15 < 0.1, b);
    await p.close();
  }
} catch (e) { mal++; console.log('MAL (se paró)', e.message); }
finally { await nav.close(); srv.kill(); }
t('0 errores de consola', errores.length === 0, errores.slice(0, 4));
console.log(`\n${n} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
