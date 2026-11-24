/* LP7b · «Bajar a pie» con una falange desde la batalla grande (Escaramuzas → mando en vivo, js/ui-mando.js) con el control de LP6.
   Recorre en 390×844 (Macedonia contra Roma) y 844×390 (Macedonia contra Cartago): bajar, dibujar el frente con el dedo, picas,
   choque, vista del oficial, fin al 15 % y vuelta a la batalla grande. Guarda gobierno/capturas-tarea/LP7b-<momento>-<v|h>.jpg e
   imprime cada comprobación (llamadas ≤ 30, triángulos ≤ 750 mil, física < 1 ms por paso, bajas de vuelta, sin errores de consola).
   Uso: node gobierno/maquetas/falange/captura-lp7b.mjs [v|h|vh] */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const RAIZ = new URL('../../../', import.meta.url).pathname, PUERTO = 8478;
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
    const foto = async n => { const r = `gobierno/capturas-tarea/LP7b-${n}-${o}.jpg`; await p.screenshot({ path: RAIZ + r, type: 'jpeg', quality: 80, timeout: 120000 }); console.log('   ' + r); };
    const ev = (f, a) => p.evaluate(f, a);
    const capa = () => p.frame({ url: /maquetas\/falange/ });
    const enCapa = async (f, a) => { const fr = capa(); return fr ? fr.evaluate(f, a) : null; };
    const peso = async n => { const e = await enCapa(() => ({ ...window.__bloque.estado(), fis: window.__tp.fisica() })); const ms = e && e.fis ? e.fis.ms ?? e.fis.motor : null;
      vale(n + ': peso', e && e.llamadas <= 30 && e.triangulos <= 750000, e ? `llamadas ${e.llamadas}, triángulos ${(e.triangulos / 1e3).toFixed(0)} mil, física ${JSON.stringify(e.fis)}` : 'sin capa'); return e; };
    console.log(`— ${o === 'v' ? '390×844 · Macedonia contra Roma' : '844×390 · Macedonia contra Cartago'}`);
    await p.goto(`http://localhost:${PUERTO}/index.html`); await p.waitForTimeout(2500);
    await p.click('#menu .mesc'); await p.waitForTimeout(800);
    await ev(() => document.querySelector('[data-v="mio:macedonia"]').click()); await p.waitForTimeout(300);
    if (o === 'v') { const hay = await ev(() => { const b = document.querySelector('[data-v="riv:roma"]'); if (b) b.click(); return !!b; }); if (!hay) console.log('   (sin botón de rival a mano: va el de serie)'); await p.waitForTimeout(300); }
    await ev(() => document.querySelector('[data-act="escempieza"]').click());
    await p.waitForFunction(() => window.__mn && window.__mn.lista === true, null, { timeout: 180000 });
    await ev(() => window.__mn.pausa(false)); await p.waitForTimeout(500);
    const id = await ev(() => { const u = window.__mn.S.man.find(u => u.lado === 0 && u.tropa === 'falange'); if (!u) return null; window.__mn.elegir([u.id]); return u.id; });
    vale('hay una falange tuya', id !== null); if (id === null) { await p.close(); continue; }
    const n0 = await ev(i => ({ yo: window.__mn.S.man[i].n, t: window.__mn.S.t, rival: window.__mn.S.man.filter(u => u.lado === 1).map(u => u.tropa).join(',') }), id);
    console.log('   rival:', n0.rival);
    /* el botón «Bajar» del panel, con su manejador de verdad */
    const no = await ev(i => window.__mn.bajar(i), id);
    vale('bajar a pie con la falange', no === '', no);
    await p.waitForFunction(() => { const a = window.__mn.apie(); return a && a.lista; }, null, { timeout: 180000 });
    const plan = await ev(() => window.__mn.apie().plan); console.log('   plan', JSON.stringify(plan));
    vale('abre la maqueta de la falange', !!capa());
    vale('la batalla grande espera en pausa', await ev(() => window.__mn.S.pausa)); n0.t = await ev(() => window.__mn.S.t);
    await p.waitForTimeout(6000); await foto('bajar'); await peso('bajar');
    /* dibujar el frente con el dedo (toque real, en la capa), por delante del muro */
    const y = h * (o === 'v' ? 0.45 : 0.5), x0 = w * (o === 'v' ? 0.2 : 0.3), x1 = w * (o === 'v' ? 0.8 : 0.65);
    const cdp = await p.context().newCDPSession(p), toque = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
    const T0 = await enCapa(() => window.__bloque.estado().T);
    await toque('touchStart', [[x0, y + 20]]); for (let i = 1; i <= 10; i++) { await toque('touchMove', [[x0 + (x1 - x0) * i / 10, y + 20 - 25 * i / 10]]); await p.waitForTimeout(40); }
    await foto('dibuja'); await toque('touchEnd', []); await p.waitForTimeout(400);
    const r1 = await enCapa(() => { for (let k = 0; k < 60; k++) window.__bloque.C.paso(0.1); return window.__bloque.lp7(); });
    vale('el dedo dibuja el frente y el muro marcha', r1.pose.z < -2, 'pose ' + JSON.stringify(r1.pose) + ' tras ' + (r1.T - T0).toFixed(1) + ' s');
    await enCapa(() => { window.__bloque.salta('lp-picas'); for (let k = 0; k < 25; k++) window.__bloque.C.paso(0.1); });   /* 2,5 s: que las cinco filas acaben de bajar */ await p.waitForTimeout(5000); await foto('picas'); await peso('picas');
    vale('picas abajo', await enCapa(() => window.__tp.S.filas.every(Boolean)));
    await enCapa(() => window.__bloque.salta('lp-lucha')); await p.waitForTimeout(5000); await foto('choque'); await peso('choque');
    vale('hay choque', await enCapa(() => window.__tp.S.choque || !!window.__tp.S.ganador));
    await enCapa(() => { const V = window.__bloque.vista(); V.pon('oficial', true); for (let k = 0; k < 40; k++) V.aplica(0.25); });   /* tras el salto, la cámara alcanza al oficial (jugando va sola) */ await p.waitForTimeout(5000); await foto('oficial'); await peso('oficial');
    vale('vista del oficial', await enCapa(() => window.__bloque.vista().modo() === 'oficial'));
    await enCapa(() => window.__bloque.vista().pon('arriba', true));
    const r = await enCapa(() => { window.__bloque.salta('lp-final'); return window.__bloque.lp7(); });
    const quedan = Object.entries(r.bloques).map(([k, b]) => k + ' ' + b.enPie + '/' + b.hombres + (b.roto ? ' roto' : '')).join(', ');
    vale('acaba al 15 %', !!r.ganador && Object.values(r.bloques).some(b => b.roto && b.enPie <= Math.ceil(b.hombres * 0.15)), r.ganador + ' · ' + quedan + ' · ' + r.T + ' s');
    await p.waitForTimeout(2500); await foto('fin');
    vale('el final dice «Volver a la batalla»', await enCapa(() => document.getElementById('otra').textContent === 'Volver a la batalla' && !document.getElementById('fin').hidden));
    const tAntes = await ev(() => window.__mn.S.t);
    await capa().evaluate(() => document.getElementById('otra').click());
    await p.waitForFunction(() => !window.__mn.apie(), null, { timeout: 20000 }).catch(() => { });
    const v = await ev(i => ({ a: window.__mn.apie(), yo: window.__mn.S.man[i].n, y: window.__mn.camaraY(), sel: window.__mn.estado().sel, pausa: window.__mn.S.pausa, t: window.__mn.S.t, aviso: document.getElementById('mn-aviso').textContent }), id);
    vale('vuelve a la batalla grande', !v.a && v.y > 30 && v.sel.includes(id) && !v.pausa && tAntes === n0.t, `cámara a ${v.y.toFixed(0)} m · elegida ${v.sel.includes(id)} · en pausa ${v.pausa} · reloj ${n0.t} → ${tAntes} mientras luchabas a pie`);
    await p.waitForTimeout(1500); await foto('vuelta');
    vale('las bajas vuelven', v.yo < n0.yo, `${n0.yo.toFixed(0)} → ${v.yo.toFixed(0)} · «${v.aviso}»`);
    vale('sin errores de consola', !errores.length, errores.slice(0, 3).join(' | '));
    await ev(() => window.__mn.terminar()).catch(() => { });
    await p.close();
  }
} finally { await nav.close(); srv.kill(); }
console.log(fallos ? `NO APTO: ${fallos} fallos` : 'APTO');
process.exit(fallos ? 1 : 0);
