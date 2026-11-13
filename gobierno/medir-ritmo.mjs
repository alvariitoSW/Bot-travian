// AQVILA — medir el ritmo del mes (CN25a): node gobierno/medir-ritmo.mjs [--rapido]
// Mide: (1) cuánto dura un mes/turno en tiempo real a cada velocidad, (2) cuántos meses de una campaña de 60 meses
// no dejan nada útil que hacer (con dos bots), (3) cuánto tardan obras y marchas. Escribe gobierno/estudios/CN25-medidas.md.
// --rapido omite el navegador (solo cifras de lógica). No toca el juego.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = require('../js/data.js'), G = require('../js/game.js'), { Battle } = require('../js/battle.js');
const RAPIDO = process.argv.includes('--rapido');
const f1 = x => (Math.round(x * 10) / 10).toString().replace('.', ',');
const tabla = (cab, filas) => ['| ' + cab.join(' | ') + ' |', '| ' + cab.map(() => '---').join(' | ') + ' |', ...filas.map(r => '| ' + r.join(' | ') + ' |')].join('\n');
const mulberry32 = a => function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const out = [];
const P = (t = '') => { out.push(t); console.log(t); };

/* ---------- 1. teoría del reloj ---------- */
// ui.js: frame() hace G.tick(dt * velocidad / 4) con dt en segundos (tope 0,25 s por cuadro) → 1 mes = 4 s / velocidad.
const SEG_MES = 4;
P('# CN25 · Medidas del ritmo del mes\n'); P('Generado por `node gobierno/medir-ritmo.mjs` (' + new Date().toISOString().slice(0, 10) + ').\n');
P('## 1. Cuánto dura un mes y un turno\n');
P('Cómo avanza el reloj: en cada cuadro de pantalla `G.tick(dt × velocidad / 4)`, con dt en segundos y tope de 0,25 s por cuadro. Un mes de juego = 4 s a ×1. Un turno (estación) = ' + D.TURNO_MESES + ' meses. En modo turnos (el que usa la partida nueva) solo hay «parado» y ×1, y al llegar al fin del turno el reloj se para solo (`speed = 0`) y sale el consejo del Senado.\n');
P('Cifra teórica (cuadros a 4 fps o más):\n');
P(tabla(['Velocidad', 'Mes (s)', 'Turno (s)', 'Año (s)', 'Dónde existe'], [['parado (II)', '∞ (no avanza)', '∞', '∞', 'ambos modos'], ['×1 (▶)', '4', '12', '48', 'modo turnos y continuo'], ['×2 (▶▶)', '2', '6', '24', 'solo continuo (sin turnos)'], ['×4 (▶▶▶)', '1', '3', '12', 'solo continuo (sin turnos)']]));
P('\nHallazgo de código: la partida nueva de la interfaz activa `G.turnos = true`, así que ×2 y ×4 no se pueden elegir (el botón alterna solo II y ▶). Las ×2/×4 solo existen en el modo continuo de las pruebas.');
P('Con cuadros lentos el mes dura más: el tope dt = 0,25 s significa que por debajo de 4 cuadros/s el juego va a cámara lenta (a 2 cuadros/s un mes tarda 8 s a ×1).\n');

/* ---------- navegador ---------- */
let medidasNav = null;
async function navegador() {
  const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
  const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const { chromium } = require('playwright');
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
  const errores = []; page.on('pageerror', e => errores.push(String(e.message).slice(0, 200)));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
  await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
  await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
  await page.click('#menu [data-act="new"]'); await page.waitForTimeout(10000);
  const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; if (window.UI) UI.modalOpen = false; });
  await cierra();
  const cuadros = await page.evaluate(() => new Promise(ok => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 > 3000) ok(n / 3); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
  // medida: arranca a la velocidad v, espera hasta avanzar `meses` (o hasta que el reloj se pare solo), devuelve segundos reales
  const medir = (v, meses, turnos) => page.evaluate(([v, meses, turnos]) => new Promise(ok => {
    const s = Game.state; Game.turnos = turnos; s.turnos = turnos; UI.modalOpen = false; s.pending.length = 0;
    if (turnos) s.t = Game.finTurno();   // empieza justo en el inicio de un turno
    const t0 = s.t, w0 = performance.now(), marcas = []; let ult = Math.floor(t0 + 1e-9); s.speed = v;
    const f = () => { UI.modalOpen = false; if (Math.floor(s.t + 1e-9) > ult) { ult = Math.floor(s.t + 1e-9); marcas.push((performance.now() - w0) / 1000); }
      if (s.t - t0 >= meses - 1e-6 || (s.speed === 0 && s.t > t0 + 1e-6) || performance.now() - w0 > 90000) { s.speed = 0; ok({ seg: (performance.now() - w0) / 1000, meses: s.t - t0, marcas: marcas }); } else requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }), [v, meses, turnos]);
  const quieto = await page.evaluate(() => new Promise(ok => { const s = Game.state; s.speed = 0; const t0 = s.t; setTimeout(() => ok(s.t - t0), 3000); }));
  const filas = [];
  for (let rep = 1; rep <= 2; rep++) {
    for (const [nom, v, meses, turnos] of [['turnos ×1, un turno', 1, 3, true], ['continuo ×1, un mes', 1, 1, false], ['continuo ×2, un mes', 2, 1, false], ['continuo ×4, un mes', 4, 1, false]]) {
      const r = await medir(v, meses, turnos); await cierra();
      filas.push({ rep, nom, seg: r.seg, meses: r.meses, marcas: r.marcas });
    }
  }
  await br.close(); srv.close();
  return { cuadros, quieto, filas, errores };
}
if (!RAPIDO) {
  try { medidasNav = await navegador(); } catch (e) { P('(Navegador no disponible: ' + String(e.message).split('\n')[0] + ')\n'); }
}
if (medidasNav) {
  const m = medidasNav;
  P('Medida en navegador (Chromium con render por software, 390×844; muy por debajo de un móvil real en cuadros/s):\n');
  P('- Cuadros por segundo del juego en esa máquina: **' + f1(m.cuadros) + '**' + (m.cuadros < 4 ? ' (por debajo de 4: el tope dt hace que el tiempo vaya más lento que la cifra teórica)' : '') + '.');
  P('- Reloj en «parado» durante 3 s reales: avanza **' + (Math.round(m.quieto * 1000) / 1000) + '** meses (debe ser 0).');
  P('- Errores de página durante la medida: ' + (m.errores.length ? m.errores.join(' · ') : 'ninguno') + '.\n');
  P(tabla(['Repetición', 'Caso', 'Meses avanzados', 'Segundos reales', 'Segundos por mes', 'Teoría (s por mes)'], m.filas.map(r => [r.rep, r.nom, f1(r.meses), f1(r.seg), f1(r.seg / Math.max(r.meses, 1e-9)), /×1/.test(r.nom) ? '4' : /×2/.test(r.nom) ? '2' : '1'])));
  P('\nSegundos reales en que cae cada fin de mes dentro del turno medido: ' + m.filas.filter(r => r.marcas.length).map(r => r.rep + '/' + r.nom + ' → ' + r.marcas.map(x => f1(x)).join(' · ')).join('; ') + '.\n');
} else if (RAPIDO) P('(--rapido: sin medida en navegador; solo vale la cifra teórica.)\n');

/* ---------- 2. campaña de 60 meses ---------- */
function posibles(s) {
  const r = { construir: 0, reclutar: 0, forja: 0, marchar: 0, mercado: 0 };
  for (const id of G.myCities()) {
    const c = s.cities[id];
    if (G.huecosLibres(c) > 0) for (const b in D.BUILD) {
      const L = c.b[b] || 0; if (L >= D.MAX_LVL || (D.BUILD[b].sea && !D.CITIES[id].sea) || G.obraDe(c, b)) continue;
      if (D.BUILD[b].solar && L < 1 && G.solaresUsados(c) >= G.solares(id)) continue;
      if (b === 'viviendas' || b === 'foro' || G.faltaInv(b) || G.faltaEspecial('edificio', b, L)) continue;
      if (G.canAfford(G.planPago(G.cost(b, L), G.buildTime(c, b)).primera)) r.construir++;
    }
    if (c.train.length < 5 && G.recruits(c) >= 1) for (const k in D.UNITS) { if (!G.unitOk(c, k)) continue; const n = Math.min(10, G.recruits(c)); if (G.canAfford(G.planPago(G.unitCost(k, n), G.trainDur(c, k, n)).primera)) r.reclutar++; }
    const f = s.forja; if (f && !f.cola) for (const k in D.FORJA) { const L = f[k]; if (L < D.FORJA_MAX && (c.b.herreria || 0) > L && G.canAfford(G.forjaCost(k, L, id))) r.forja++; }
    if (G.men(c.units) >= 50 && !s.marches.some(m => m.owner === 'roma' && m.from === id)) for (const n of G.neighbors(id)) if (s.cities[n].owner !== 'roma') { r.marchar++; break; }
  }
  if (G.tradeRate() > 0 && D.RES.filter(x => x !== 'oro').some(x => G.disponible(x) >= 100)) r.mercado = 1;
  return r;
}
function bot(s, dist, meta, perfil) {
  for (const id of G.myCities()) {
    const c = s.cities[id];
    if (c.train.length < 4 && G.prod().grano > 8) for (const k of ['triarii', 'principes', 'equites', 'hastati']) { if (G.unitOk(c, k)) { const n = Math.min(150, G.maxTrain(k)); if (n >= 10) { G.train(id, k, n); break; } } }
    for (let hz = 0; G.huecosLibres(c) > 0 && hz < 4; hz++) { const bs = Object.keys(D.BUILD).filter(b => !['herreria', 'escuela', 'muralla'].includes(b) && (c.b[b] || 0) < D.MAX_LVL).sort((p, q) => (c.b[p] || 0) - (c.b[q] || 0) - (G.prod().grano < 25 ? (q === 'granja') - (p === 'granja') : 0) * 3); let hizo = false; for (const b of bs) if (G.upgrade(id, b)) { hizo = true; break; } if (!hizo) break; }
    G.levantarMuralla(id);
    if (perfil !== 'gastador') continue;
    const yr = G.yearOf(s.t); if (yr <= 230 && yr >= 209) continue;
    const sig = G.neighbors(id).sort((a, b) => dist[a] - dist[b])[0];
    if (id !== meta && dist[sig] < dist[id] && s.cities[sig].owner === 'roma' && !s.marches.some(m => m.owner === 'roma' && m.from === id)) { const u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (id === 'roma' ? 0.15 : 0.65)); if (G.men(u) >= 100 && G.send(id, sig, u, false)) continue; }
    for (const n of G.neighbors(id)) { const t = s.cities[n]; if (t.owner === 'roma') continue; const kh = id === 'roma' ? 0.35 : 0.2, u = {}; for (const k in c.units) u[k] = Math.floor(c.units[k] * (1 - kh)); if (G.power(u) > G.power(t.units) * (1.6 + 0.12 * t.b.muralla) && !s.marches.some(m => m.owner === 'roma' && s.cities[m.to].owner !== 'roma')) { G.send(id, n, u, G.heroAvailable(id)); break; } }
  }
}
function campana(perfil, seed, MESES) {
  const rnd0 = Math.random; Math.random = mulberry32(seed);
  try {
    const s = G.newGame('Test'); const meta = G.region().capitalRival; G.onEvent = () => {};
    const dist = {}; dist[meta] = 0; for (let q = [meta], i = 0; i < q.length; i++) for (const n of G.neighbors(q[i])) if (!(n in dist)) { dist[n] = dist[q[i]] + 1; q.push(n); }
    const filas = []; const cada = perfil === 'pasivo' ? 8 : 1; let guard = 0, mes = 0;
    const foto = () => { const p = posibles(s), tot = p.construir + p.reclutar + p.forja + p.marchar + p.mercado; const ob = G.myCities().reduce((a, id) => a + s.cities[id].obras.length, 0), hu = G.myCities().reduce((a, id) => a + G.huecosObra(s.cities[id]), 0), co = G.myCities().reduce((a, id) => a + s.cities[id].train.length, 0); filas.push({ mes, res: D.RES.reduce((a, x) => a + Math.floor(G.disponible(x)), 0), min: Math.min(...D.RES.map(x => Math.floor(G.disponible(x)))), ob, hu, co, tot, p, ciudades: G.myCities().length }); };
    foto();
    while (!s.over && mes < MESES && guard++ < 100000) {
      const m0 = Math.floor(s.t + 1e-9); G.tick(0.25);
      while (s.pending.length && !s.over) { const b = new Battle(G.battleInfo(s.pending[0]).cfg); b.finish(); G.applyBattle(b.result()); }
      if (Math.floor(s.t + 1e-9) > m0) { mes++; foto(); }   // principio de mes: lo que ve el jugador antes de actuar
      if (guard % cada === 0) bot(s, dist, meta, perfil);
    }
    return filas;
  } finally { Math.random = rnd0; }
}
const MESES = 60, SEMILLAS = [1, 2, 3];
P('## 2. Campaña de ' + MESES + ' meses: ¿cuántos meses no hay nada útil que hacer?\n');
G.newGame('T');
P('Partida de arranque real (`G.newGame`: ' + G.myCities().length + ' ciudades al empezar: ' + G.myCities().join(' y ') + '), semillas ' + SEMILLAS.join(', ') + '. Se mira el estado **al empezar cada mes, antes de que el bot actúe**: eso es lo que ve el jugador.');
P('«Acción útil» = algo que el juego permite ahora y cuyo primer pago (cuota 1) alcanza con los recursos libres: **construir/mejorar** un edificio (hueco de obra libre, sin obra igual, solares, requisitos), **reclutar** un lote de hasta 10 (cola < 5, reclutas disponibles), **herrería** (mejora de armas), **marchar** (ejército ≥ 50 hombres, ciudad enemiga vecina, sin marcha en curso), **mercado** (hay mercado y ≥ 100 de algún recurso para cambiar). **Mes muerto** = 0 acciones útiles. No se cuentan misiones del Senado ni investigación (no son acciones de un clic con coste inmediato medible aquí) ni órdenes de batalla.');
P('Perfiles: **pasivo** = construye y recluta cada 2 meses, nunca ataca (el «jugador despistado»); **gastador** = gasta en cuanto puede, cada cuarto de mes, y además ataca (el «jugador atento»).\n');
const resumenes = [];
for (const perfil of ['pasivo', 'gastador']) for (const sd of SEMILLAS) {
  const fs = campana(perfil, sd, MESES).slice(1);   // sin el mes 0
  const muertos = fs.filter(x => x.tot === 0).map(x => x.mes);
  let racha = 0, maxR = 0, finR = 0; fs.forEach(x => { if (x.tot === 0) { racha++; if (racha > maxR) { maxR = racha; finR = x.mes; } } else racha = 0; });
  const ocupados = fs.filter(x => x.ob >= x.hu && x.hu > 0).length, sinColas = fs.filter(x => x.co === 0).length;
  const mediaTot = fs.reduce((a, x) => a + x.tot, 0) / fs.length, minimo1 = fs.filter(x => x.tot <= 1).length;
  const sinEco = fs.filter(x => x.p.construir + x.p.reclutar + x.p.forja === 0).length, perdidas = Math.max(...fs.map(x => 0), fs[0].ciudades - fs[fs.length - 1].ciudades);
  resumenes.push({ sinEco, perdidas, perfil, sd, n: fs.length, muertos, maxR, finR, ocupados, sinColas, mediaTot, minimo1, fs });
}
P(tabla(['Perfil', 'Semilla', 'Meses', 'Meses muertos', 'Racha más larga', 'Meses con ≤ 1 acción', 'Meses sin construir/reclutar/forjar', 'Ciudades perdidas', 'Media de acciones', 'Meses con todos los huecos de obra llenos', 'Meses sin cola de reclutas'],
  resumenes.map(r => [r.perfil, r.sd, r.n, r.muertos.length + ' (' + Math.round(100 * r.muertos.length / r.n) + ' %)', r.maxR ? r.maxR + ' (hasta el mes ' + r.finR + ')' : '0', r.minimo1, r.sinEco, r.perdidas, f1(r.mediaTot), r.ocupados, r.sinColas])));
P('\nNota: las semillas del azar dan resultados casi idénticos porque el arranque no depende de ellas en estos 60 meses. «Muerto» cuenta mercado y marcha como acción; la columna «sin construir/reclutar/forjar» es la medida estricta de economía.');
P('\nMeses muertos concretos: ' + resumenes.map(r => r.perfil + '/' + r.sd + ': ' + (r.muertos.length ? r.muertos.join(', ') : 'ninguno')).join(' · ') + '.\n');
// detalle mes a mes de una campaña de cada perfil
for (const r of [resumenes.find(x => x.perfil === 'pasivo'), resumenes.find(x => x.perfil === 'gastador')]) {
  P('Detalle, perfil **' + r.perfil + '**, semilla ' + r.sd + ' (recursos libres = suma de los 5; mín = el recurso más escaso; obras/huecos; colas de reclutas; acciones por tipo C=construir R=reclutar F=forja M=marchar $=mercado):\n');
  P(tabla(['Mes', 'Ciud.', 'Recursos', 'Mín.', 'Obras/huecos', 'Colas', 'C', 'R', 'F', 'M', '$', 'Total'], r.fs.filter(x => x.mes % 3 === 0 || x.tot === 0).map(x => [x.mes, x.ciudades, x.res, x.min, x.ob + '/' + x.hu, x.co, x.p.construir, x.p.reclutar, x.p.forja, x.p.marchar, x.p.mercado, x.tot])));
  P('\n(Se muestra un mes de cada tres, más los meses muertos.)\n');
}

/* ---------- 3. obras y marchas ---------- */
P('## 3. Cuánto tarda una obra y una marcha\n');
const s0 = G.newGame('T'), roma = s0.cities.roma;
P('Una obra dura `tiempo × 1,35^nivel actual × (1 − 0,04 × nivel del foro)` meses y se paga en `ceil(meses)` cuotas mensuales (Q4: una por fin de mes; mínimo 1). Hay 1 hueco de obra con foro 1, hasta 4 con foro 8+ (Q4b: ' + D.HUECOS_OBRA.slice(1).join('-') + '). A ×1 un mes son 4 s reales. Foro de Roma al empezar: nivel ' + (roma.b.foro || 1) + ' (' + G.huecosObra(roma) + ' hueco(s)).\n');
const filasO = [];
for (const b of ['aserradero', 'granja', 'viviendas', 'cuartel', 'mercado', 'puerto', 'templo']) {
  if (!D.BUILD[b]) continue;
  const fila = [D.BUILD[b].n];
  for (const nivel of [1, 3, 5]) { const c = JSON.parse(JSON.stringify(roma)); c.b[b] = nivel - 1; const d = G.buildTime(c, b); const nc = Math.max(1, Math.ceil(d - 1e-9)); fila.push(f1(d) + ' meses · ' + nc + ' cuota(s) · ' + f1(d * SEG_MES) + ' s'); }
  filasO.push(fila);
}
P(tabla(['Edificio', 'Subir a nivel 1', 'Subir a nivel 3', 'Subir a nivel 5'], filasO));
P('\n(Cada celda: duración en meses de juego · cuotas · segundos reales a ×1. Con foro nivel 1.) Con foro 5 las obras duran un ' + Math.round(100 * (1 - (1 - 0.04 * 5) / (1 - 0.04 * 1))) + ' % menos. En modo turnos una obra de menos de 3 meses sigue acabando en su mes exacto (el reloj corre mes a mes dentro del turno); lo que se redondea al turno son las llegadas de marchas.\n');
// marchas
const rutas = []; const vistos = new Set();
for (const a of Object.keys(s0.cities)) for (const b of G.neighbors(a)) { const k = [a, b].sort().join('>'); if (vistos.has(k)) continue; vistos.add(k); rutas.push({ a, b, t: G.travel(a, b, false), mar: !!(G.edge(a, b) || [])[2] }); }
rutas.sort((x, y) => x.t - y.t);
const llegadaT = t => Math.max(Math.ceil((0 + t) / D.TURNO_MESES - 1e-9) * D.TURNO_MESES, D.TURNO_MESES);
const nom = id => D.CITIES[id].n;
const rc = rutas.find(r => [r.a, r.b].sort().join() === 'capua,roma');
// ruta más larga entre dos ciudades por suma de tramos (camino más corto)
const adj = {}; for (const r of rutas) { (adj[r.a] = adj[r.a] || []).push([r.b, r.t]); (adj[r.b] = adj[r.b] || []).push([r.a, r.t]); }
const dij = o => { const d = { [o]: 0 }, q = [o]; while (q.length) { q.sort((x, y) => d[x] - d[y]); const u = q.shift(); for (const [v, w] of adj[u] || []) if (d[v] === undefined || d[u] + w < d[v]) { d[v] = d[u] + w; q.push(v); } } return d; };
const dr = dij('roma'); const lejos = Object.keys(dr).sort((x, y) => dr[y] - dr[x])[0];
const casos = [['Roma → Capua (tramo directo)', rc ? rc.t : G.travel('roma', 'capua', false)], ['Tramo más corto del mapa: ' + nom(rutas[0].a) + ' ↔ ' + nom(rutas[0].b), rutas[0].t], ['Tramo más largo del mapa: ' + nom(rutas[rutas.length - 1].a) + ' ↔ ' + nom(rutas[rutas.length - 1].b), rutas[rutas.length - 1].t], ['Roma → ' + nom(lejos) + ' (la más lejana, suma de tramos)', dr[lejos]]];
P(tabla(['Marcha (a pie, sin héroe)', 'Meses de juego', 'Segundos a ×1', 'Con turnos (llega al fin de turno)', 'Segundos con turnos'], casos.map(([n, t]) => { const ll = llegadaT(t); return [n, f1(t), f1(t * SEG_MES), f1(ll) + ' meses', f1(ll * SEG_MES)]; })));
P('\nMarchas por mar: ' + rutas.filter(r => r.mar).length + ' de ' + rutas.length + ' tramos (con el multiplicador `mods.sea`, el puerto y la ciencia). Mínimo 0,5 mes por tramo. En modo turnos toda marcha llega a un fin de turno, así que el mínimo real es **un turno entero (12 s a ×1)** aunque el tramo sea de medio mes; ida y vuelta, 2 turnos.\n');
P('Cobro en cuotas: un lote de reclutas o una obra de d meses cobra `ceil(d)` cuotas, una por fin de mes (cierreMes). Si en ese fin de mes no hay recursos, la obra se **pausa** y su plazo se corre (G.reintentarPlazos), de modo que la obra «pasa» sin avanzar. Eso es lo que el jugador percibe como «pasa sin que hagas nada» cuando le faltan recursos.\n');
await writeFile(join(RAIZ, 'gobierno/estudios/CN25-medidas.md'), out.join('\n') + '\n');
console.log('\nEscrito gobierno/estudios/CN25-medidas.md');
