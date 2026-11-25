/* BT1 (constructor C · Gráficos): «Un solo campo y una sola luz». Capturas de la batalla grande (al empezar, en el choque,
   de cerca), «Bajar a pie» desde ella, el testudo en la salva y Ásculo en lucha, a 390×844 (v) y 844×390 (h).
   Deja gobierno/capturas-tarea/BT1-C-<fase>-<escena>-<v|h>.jpg y BT1-C-<fase>-informe.json con llamadas de dibujo y triángulos.
   Uso: node gobierno/captura-graficos-bt1.mjs fase=antes|despues [solo=vivo,testudo,asculo] [dpr=2] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const RAIZ = new URL('../', import.meta.url).pathname, PUERTO = 8493;
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split('=')));
const FASE = op.fase || 'despues', SOLO = op.solo ? op.solo.split(',') : null, DPR = +(op.dpr || 2);
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const URL0 = `http://localhost:${PUERTO}/`, informe = {};
const ORI = [[390, 844, 'v'], [844, 390, 'h']].filter(x => !op.ori || x[2] === op.ori);
const quiere = k => !SOLO || SOLO.includes(k);
async function pagina(w, h) {
  const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: DPR, hasTouch: true, isMobile: w < h });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|GPU stall|GL Driver/.test(m.text())) err.push(m.text().slice(0, 200)); });
  p.__err = err; return p;
}
const foto = (p, n) => p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/BT1-C-${FASE}-${n}.jpg`, type: 'jpeg', quality: 78, timeout: 240000 }).then(() => console.log('  captura', n));
const fin = async (p, n) => { informe[n] = Object.assign(informe[n] || {}, { errores: p.__err.length, ej: p.__err.slice(0, 3) }); console.log('  errores', n, p.__err.length, p.__err.slice(0, 2).join(' | ')); await p.close(); };
const mide = async (p, n) => { const e = await p.evaluate(() => { const s = window.__mn.estado(); return { llamadas: s.llamadas, tri: s.tri }; }).catch(() => null); informe[n] = Object.assign(informe[n] || {}, { dibujo: e }); console.log('  dibujo', n, JSON.stringify(e)); };
try {
  if (quiere('vivo')) for (const [w, h, o] of ORI) {
    console.log('— batalla grande', o);
    const p = await pagina(w, h); await p.goto(URL0, { waitUntil: 'load' }); await p.waitForSelector('#menu .mesc', { timeout: 60000 }); await p.waitForTimeout(1500);
    await p.click('#menu .mesc'); await p.waitForTimeout(1200);
    await p.click('#hoja .cg2-go'); await p.waitForSelector('#br-el', { timeout: 30000 }); await p.waitForTimeout(800);
    await p.click('#br-el [data-k="vivo"]');
    await p.waitForFunction(() => window.__mn && window.__mn.lista, null, { timeout: 240000 }); await p.waitForTimeout(8000);
    await foto(p, `vivo-inicio-${o}`); await mide(p, `vivo-inicio-${o}`);
    await p.evaluate(() => { window.__mn.cine && window.__mn.cine('mando'); window.__mn.salta(40); }); await p.waitForTimeout(6000);
    await foto(p, `vivo-lucha-${o}`); await mide(p, `vivo-lucha-${o}`);
    await p.evaluate(() => { const S = window.__mn.S, u = S.man.find(m => m.lado === 0 && m.estado !== 'roto') || S.man[0]; window.__mn.camara({ x: u.x, y: u.y, d: 28 }); });
    await p.waitForTimeout(5000); await foto(p, `vivo-cerca-${o}`); await mide(p, `vivo-cerca-${o}`);
    if (o === 'v') {
      const r = await p.evaluate(() => { const S = window.__mn.S; for (const u of S.man) if (u.lado === 0) { const m = window.__mn.bajar(u.id); if (!m) return 'bajó ' + u.id; } return 'no pudo'; });
      console.log('  bajar:', r);
      for (let i = 0; i < 120; i++) { await p.waitForTimeout(1500); const a = await p.evaluate(() => window.__mn.apie()); if (a && a.lista) break; }
      await p.waitForTimeout(6000); await foto(p, `bajar-${o}`);
    }
    await fin(p, `vivo-${o}`);
  }
  const BLOQUE = [['testudo', 'gobierno/maquetas/a-pie/?semilla=7&nivel=normal&fase=testudo'], ['asculo', 'gobierno/maquetas/bloque/index.html?formacion=combinada&escenario=asculo&bando=pirro&semilla=7&nivel=normal&fase=lucha']];
  for (const [k, ruta] of BLOQUE) {
    if (!quiere(k)) continue;
    for (const [w, h, o] of ORI) {
      console.log('—', k, o);
      const p = await pagina(w, h);
      await p.goto(URL0 + ruta, { waitUntil: 'load' });
      await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 240000 }); await p.waitForTimeout(7000);
      await foto(p, `${k}-${o}`);
      informe[`${k}-${o}`] = { dibujo: await p.evaluate(() => { const e = window.__bloque.estado(); return { llamadas: e.llamadas, tri: e.triangulos }; }).catch(() => null) };
      await fin(p, `${k}-${o}`);
    }
  }
} catch (e) { console.log('FALLO', e.message); informe.fallo = e.message; }
finally { await nav.close(); srv.kill(); }
writeFileSync(RAIZ + `gobierno/capturas-tarea/BT1-C-${FASE}-informe.json`, JSON.stringify(informe, null, 1));
console.log('hecho');
