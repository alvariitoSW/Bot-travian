/* EB1 · Estado de las batallas: recorre cada tipo de escaramuza a 390×844 (v) y 844×390 (h) y deja capturas en
   gobierno/capturas-tarea/EB1-*.jpg. Solo mira: no cambia nada del juego. Cuenta errores de consola por escena.
   Uso: node gobierno/maquetas/bloque/captura-eb1.mjs [solo=clave1,clave2] [dpr=2] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8491;
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split('=')));
const SOLO = op.solo ? op.solo.split(',') : null, DPR = +(op.dpr || 2);
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const URL0 = `http://localhost:${PUERTO}/`, informe = {};
const ORI = [[390, 844, 'v'], [844, 390, 'h']].filter(x => !op.ori || x[2] === op.ori), SININICIO = !!op.sininicio;
async function pagina(w, h, clave) {
  const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: DPR, hasTouch: true, isMobile: w < h });
  const err = []; p.on('pageerror', e => err.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|GPU stall|GL Driver/.test(m.text())) err.push(m.text().slice(0, 200)); });
  p.__err = err; p.__clave = clave; return p;
}
const foto = (p, n) => p.screenshot({ path: RAIZ + `gobierno/capturas-tarea/EB1-${n}.jpg`, type: 'jpeg', quality: 78, timeout: 240000 }).then(() => console.log('  captura', n));
const fin = async (p, n) => { informe[n] = { errores: p.__err.length, ej: p.__err.slice(0, 3) }; console.log('  errores', n, p.__err.length, p.__err.slice(0, 2).join(' | ')); await p.close(); };

/* escenas del bloque (Pruebas rápidas): [clave, ruta, descripción] */
const BLOQUE = [
  ['testudo', 'gobierno/maquetas/a-pie/?semilla=7'],
  ['falange-manipulos', 'gobierno/maquetas/falange/?rival=manipulos&semilla=7'],
  ['falange-caballeria', 'gobierno/maquetas/falange/?rival=caballeria&semilla=7'],
  ['falange-elefantes', 'gobierno/maquetas/falange/?rival=elefantes&semilla=7'],
  ['falange-falange', 'gobierno/maquetas/falange/?rival=falange&semilla=7'],
  ['manipulo', 'gobierno/maquetas/bloque/?semilla=7'],
  ['asculo', 'gobierno/maquetas/bloque/index.html?formacion=combinada&escenario=asculo&bando=pirro&semilla=7'],
];
const quiere = k => !SOLO || SOLO.some(s => k.startsWith(s));
try {
  /* 0 · el menú de Escaramuzas */
  if (quiere('menu')) for (const [w, h, o] of ORI) {
    const p = await pagina(w, h); await p.goto(URL0, { waitUntil: 'load' }); await p.waitForSelector('#menu .mesc', { timeout: 60000 }); await p.waitForTimeout(1500);
    await p.click('#menu .mesc'); await p.waitForTimeout(1500); await foto(p, `menu-arriba-${o}`);
    const ent = p.locator('#hoja a.esc-asculo'); await ent.scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await foto(p, `menu-pruebas-${o}`);
    await fin(p, `menu-${o}`);
  }
  /* 1 · escenas del bloque: al empezar (tarjeta y luego vista inicial) y en plena lucha (?fase=lucha la deja quieta en el choque) */
  for (const [k, ruta] of BLOQUE) {
    if (!quiere(k)) continue;
    for (const [w, h, o] of ORI) {
      console.log('—', k, o);
      let p;
      if (!SININICIO) { p = await pagina(w, h);
      await p.goto(URL0 + ruta, { waitUntil: 'load' });
      await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 180000 }); await p.waitForTimeout(6000);
      if (o === 'v') await foto(p, `${k}-tarjeta-${o}`);
      const b = p.locator('#inicio:not([hidden]) [data-nivel="normal"]'); if (await b.count()) { await b.first().click(); await p.waitForTimeout(5000); }
      await foto(p, `${k}-inicio-${o}`);
      await fin(p, `${k}-inicio-${o}`); }
      p = await pagina(w, h);
      const fase = k === 'testudo' ? 'testudo' : 'lucha';
      await p.goto(URL0 + ruta + '&nivel=normal&fase=' + fase, { waitUntil: 'load' });
      await p.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 240000 }); await p.waitForTimeout(7000);
      await foto(p, `${k}-lucha-${o}`);
      const e = await p.evaluate(() => window.__bloque.estado()).catch(() => null); informe[`${k}-estado-${o}`] = e;
      await fin(p, `${k}-lucha-${o}`);
    }
  }
  /* 2 · escaramuza montada en el menú: «¿Cómo quieres librar la batalla?», en vivo (pantalla de mando), bajar a pie y batalla rápida */
  if (quiere('mando')) for (const [w, h, o] of ORI) {
    console.log('— mando', o);
    const p = await pagina(w, h); await p.goto(URL0, { waitUntil: 'load' }); await p.waitForSelector('#menu .mesc', { timeout: 60000 }); await p.waitForTimeout(1500);
    await p.click('#menu .mesc'); await p.waitForTimeout(1200);
    if (o === 'v') await foto(p, `montar-${o}`);
    await p.click('#hoja .cg2-go'); await p.waitForSelector('#br-el', { timeout: 30000 }); await p.waitForTimeout(800);
    await foto(p, `elegir-${o}`);
    await p.click('#br-el [data-k="vivo"]');
    await p.waitForFunction(() => window.__mn && window.__mn.lista, null, { timeout: 240000 }); await p.waitForTimeout(8000);
    await foto(p, `vivo-inicio-${o}`);
    await p.evaluate(() => { window.__mn.cine && window.__mn.cine('mando'); window.__mn.salta(40); }); await p.waitForTimeout(6000);
    await foto(p, `vivo-lucha-${o}`);
    /* acercar la cámara a un manípulo tuyo en lucha */
    await p.evaluate(() => { const S = window.__mn.S, u = S.man.find(m => m.lado === 0 && m.estado !== 'roto') || S.man[0]; window.__mn.camara({ x: u.x, y: u.y, d: 28 }); });
    await p.waitForTimeout(5000); await foto(p, `vivo-cerca-${o}`);
    informe[`vivo-estado-${o}`] = await p.evaluate(() => window.__mn.estado()).catch(() => null);
    if (o === 'v') {   /* Bajar a pie con un manípulo */
      const r = await p.evaluate(() => { const S = window.__mn.S; for (const u of S.man) if (u.lado === 0) { const m = window.__mn.bajar(u.id); if (!m) return 'bajó ' + u.id; } return 'no pudo'; });
      console.log('  bajar:', r);
      for (let i = 0; i < 120; i++) { await p.waitForTimeout(1500); const a = await p.evaluate(() => window.__mn.apie()); if (a && a.lista) break; }
      await p.waitForTimeout(6000); await foto(p, `bajar-${o}`);
      await p.evaluate(() => window.__mn.orden('avanzar')); await p.waitForTimeout(15000); await foto(p, `bajar-avanza-${o}`);
    }
    await fin(p, `mando-${o}`);
  }
  if (quiere('rapida')) for (const [w, h, o] of ORI) {
    console.log('— rápida', o);
    const p = await pagina(w, h); await p.goto(URL0, { waitUntil: 'load' }); await p.waitForSelector('#menu .mesc', { timeout: 60000 }); await p.waitForTimeout(1500);
    await p.click('#menu .mesc'); await p.waitForTimeout(1200);
    await p.click('#hoja .cg2-go'); await p.waitForSelector('#br-el', { timeout: 30000 }); await p.click('#br-el [data-k="rapida"]');
    await p.waitForSelector('#br canvas', { timeout: 30000 }); await p.waitForTimeout(1500); await foto(p, `rapida-planear-${o}`);
    await p.click('#br .br-mirar'); await p.waitForTimeout(6000); await foto(p, `rapida-mirar-${o}`);
    await fin(p, `rapida-${o}`);
  }
} catch (e) { console.log('FALLO', e.message); informe.fallo = e.message; }
finally { await nav.close(); srv.kill(); }
writeFileSync(RAIZ + 'gobierno/capturas-tarea/EB1-informe.json', JSON.stringify(informe, null, 1));
console.log('hecho');
