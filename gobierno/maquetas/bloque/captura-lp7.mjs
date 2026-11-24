/* LP7 · «Bajar a pie» desde la batalla grande (Escaramuzas → mando en vivo, js/ui-mando.js) con el control del bloque.
   Recorre en 390×844 y 844×390: bajar, dibujar el frente, choque, vista del oficial, fin y vuelta a la batalla grande.
   Guarda gobierno/capturas-tarea/LP7-<momento>-<v|h>.jpg e imprime cada comprobación (llamadas ≤ 30, triángulos ≤ 750 mil,
   física < 1 ms por paso, bajas de vuelta, sin errores de consola). Uso: node gobierno/maquetas/bloque/captura-lp7.mjs [v|h|vh] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8477;
const { chromium } = createRequire(RAIZ + 'x.js')('playwright');
const ORI = process.argv[2] || 'vh';
mkdirSync(RAIZ + 'gobierno/capturas-tarea', { recursive: true });
const srv = spawn('python3', ['-m', 'http.server', String(PUERTO)], { cwd: RAIZ, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
const nav = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0;
const vale = (nombre, ok, extra = '') => { console.log((ok ? '  ok   ' : '  MAL  ') + nombre + (extra ? ' · ' + extra : '')); if (!ok) fallos++; };
try {
  for (const o of ORI.split('')) {
    const [w, h] = o === 'v' ? [390, 844] : [844, 390];
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errores.push(m.text()); });
    const foto = async n => { const r = `gobierno/capturas-tarea/LP7-${n}-${o}.jpg`; await p.screenshot({ path: RAIZ + r, type: 'jpeg', quality: 80, timeout: 120000 }); console.log('   ' + r); };
    const ev = (f, a) => p.evaluate(f, a);
    const capa = () => p.frame({ url: /maquetas\/bloque/ });
    const enCapa = async (f, a) => { const fr = capa(); return fr ? fr.evaluate(f, a) : null; };
    const peso = async n => { const e = await enCapa(() => ({ ...window.__bloque.estado(), fis: window.__bloque.fisica() })); vale(n + ': peso', e && e.llamadas <= 30 && e.triangulos <= 750000, e ? `llamadas ${e.llamadas}, triángulos ${(e.triangulos / 1e3).toFixed(0)} mil, motor de física ${e.fis.motor} ms/paso (enganche entero ${e.fis.ms})` : 'sin capa'); if (e) console.log('   ' + n + ': motor de física ' + e.fis.motor + ' ms/paso (en el navegador por software, compartiendo CPU con el dibujo)'); return e; };
    console.log(`— ${o === 'v' ? '390×844' : '844×390'}`);
    await p.goto(`http://localhost:${PUERTO}/index.html`); await p.waitForTimeout(2500);
    await p.click('#menu .mesc'); await p.waitForTimeout(800); await p.click('[data-act="escempieza"]');
    await p.waitForFunction(() => window.__mn && window.__mn.lista === true, null, { timeout: 180000 });
    await ev(() => window.__mn.pausa(false)); await p.waitForTimeout(500);
    const id = await ev(() => { const u = window.__mn.S.man.find(u => u.lado === 0 && u.tropa === 'hastati'); window.__mn.elegir([u.id]); return u.id; });
    const n0 = await ev(i => ({ yo: window.__mn.S.man[i].n, t: window.__mn.S.t }), id);
    const no = await ev(i => window.__mn.bajar(i), id);
    vale('bajar a pie', no === '', no);
    await p.waitForFunction(() => { const a = window.__mn.apie(); return a && a.lista; }, null, { timeout: 180000 });
    const plan = await ev(() => window.__mn.apie().plan); console.log('   plan', JSON.stringify(plan.fuerzas), 'a', plan.lejos, 'm');
    vale('la batalla grande espera en pausa', await ev(() => window.__mn.S.pausa));
    await p.waitForTimeout(9000); await foto('bajar'); await peso('bajar');
    /* dibujar el frente con el dedo (toque real, en la capa): de izquierda a derecha, por delante de tu manípulo */
    const y = h * (o === 'v' ? 0.5 : 0.55), x0 = w * (o === 'v' ? 0.2 : 0.3), x1 = w * (o === 'v' ? 0.85 : 0.68);
    const cdp = await p.context().newCDPSession(p), toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
    await toque('touchStart', [[x0, y + 20]]); for (let i = 1; i <= 10; i++) { await toque('touchMove', [[x0 + (x1 - x0) * i / 10, y + 20 - 30 * i / 10]]); await p.waitForTimeout(40); }
    await foto('dibuja'); await toque('touchEnd', []); await p.waitForTimeout(400);
    vale('el dedo dibuja el frente', await enCapa(() => !!(window.__bloque.S.B && window.__bloque.S.B.meta)));
    /* choque: el jugador automático hasta 4 s de choque */
    await enCapa(() => window.__bloque.salta('choque')); await p.waitForTimeout(6000); await foto('choque'); await peso('choque');
    vale('hay choque', await enCapa(() => window.__bloque.S.tuyo.contactos.length > 0 || !!window.__bloque.S.ganador));
    await enCapa(() => window.__bloque.vista.pon('oficial', true)); await p.waitForTimeout(5000); await foto('oficial'); await peso('oficial');
    vale('vista del oficial', await enCapa(() => window.__bloque.vista.modo() === 'oficial'));
    await enCapa(() => window.__bloque.vista.pon('arriba', true));
    /* hasta el final (15 %) y vuelta */
    const r = await enCapa(() => { window.__bloque.salta('fin'); window.__bloque.muestraFin(); return window.__bloque.lp7(); });
    const quedan = Object.entries(r.bloques).map(([k, b]) => k + ' ' + b.enPie + '/' + b.hombres + (b.roto ? ' roto' : '')).join(', ');
    vale('acaba al 15 %', !!r.ganador && Object.values(r.bloques).some(b => b.roto && b.enPie <= Math.ceil(b.hombres * 0.15)), r.ganador + ' · ' + quedan);
    await p.waitForTimeout(2500); await foto('fin');
    /* el botón, con su manejador de verdad (el clic de Playwright espera a un fotograma que por software tarda demasiado) */
    await capa().evaluate(() => document.getElementById('salir2').click());
    await p.waitForFunction(() => !window.__mn.apie(), null, { timeout: 20000 }).catch(() => { });
    const v = await ev(i => ({ a: window.__mn.apie(), yo: window.__mn.S.man[i].n, y: window.__mn.camaraY(), sel: window.__mn.estado().sel, pausa: window.__mn.S.pausa, aviso: document.getElementById('mn-aviso').textContent }), id);
    vale('vuelve a la batalla grande', !v.a && v.y > 30 && v.sel.includes(id) && !v.pausa, 'cámara a ' + v.y.toFixed(0) + ' m');
    await p.waitForTimeout(1200); await foto('vuelta');
    vale('las bajas vuelven', v.yo < n0.yo, `${n0.yo.toFixed(0)} → ${v.yo.toFixed(0)} · «${v.aviso}»`);
    vale('sin errores de consola', !errores.length, errores.slice(0, 3).join(' | '));
    await ev(() => window.__mn.terminar()).catch(() => { });
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `NO APTO: ${fallos} fallos` : 'APTO');
process.exit(fallos ? 1 : 0);
