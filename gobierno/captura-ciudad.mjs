/* Capturas propias de la ciudad 3D del juego a 390×844 (carril Ciudad, desde Q1d; adaptado a la ciudad nueva en CN3).
   Uso: node gobierno/captura-ciudad.mjs <prefijo> [vistas=a,b,c] [ciudad=roma] [dpr=2]
   Por defecto saca SOLO las vistas de CN4: bandeja, fantasma, rojo, ficha, obra (unos 2-3 min). Las viejas de CN3 se piden con --vistas: vistas=ciudad,media,...
   Deja gobierno/capturas-tarea/<prefijo>-<vista>.jpg y escribe triángulos y llamadas de dibujo de cada una.
   Vistas de CN4 (por defecto): bandeja (ciudad mirando con la bandeja de fichas), fantasma (ficha elegida, fantasma y mapa verde/ocre), rojo (fantasma en mal sitio con su razón),
   ficha (ficha de una pieza colocada), obra (tras «Construir aquí», obra en marcha).
   Vistas de CN3 (en este orden): ciudad (Roma recién convertida), media (más cerca), calle, ejercito, toque (toca una pieza y luego el suelo: ficha del edificio o línea del barrio),
   meses24 (avanza la partida 24 meses con Game.tick: casas suben de nivel, calles empedradas), capua (otra ciudad propia), lejos (cámara alta),
   ruina (varias casas con casa.ruina = 5), obras (dos andamios en c.obras), muralla (empalizada a 2/3), piedra (muralla de piedra), grande (todos los edificios a nivel 5,
   para medir contra el tope de triángulos). */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const [pref = 'ciudad', ...resto] = process.argv.slice(2), op = Object.fromEntries(resto.map(a => a.split('=')));
const vistas = (op.vistas || 'bandeja,fantasma,rojo,ficha,obra').split(','), ciudad = op.ciudad || 'roma', dpr = +(op.dpr || 2);
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true, serviceWorkers: 'block' })).newPage();
const errores = [];
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|GPU stall|GL Driver/.test(m.text())) errores.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + String(e.stack || e.message).slice(0, 500)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 120000 });
await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
const cierra = () => page.evaluate(() => { const m = document.getElementById('modal'); if (m) m.hidden = true; });
await cierra();
await page.evaluate(c => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = c; UI.city = c; document.body.appendChild(b); b.click(); b.remove(); }, ciudad);
await page.waitForTimeout(12000); await cierra();
await mkdir(join(RAIZ, 'gobierno/capturas-tarea'), { recursive: true });
const medir = () => page.evaluate(() => { const i = UI.cityV.r.info.render; return i.triangles + ' triángulos, ' + i.calls + ' llamadas'; });
await page.evaluate(() => { Game.state.speed = 0; });      // el tiempo quieto: las capturas no cambian solas
const elegir = c => page.evaluate(c => { const b = document.createElement('button'); b.dataset.act = 'impc'; b.dataset.v = c; UI.city = c; document.body.appendChild(b); b.click(); b.remove(); }, c);
const lineaTxt = () => page.evaluate(() => { const l = document.getElementById('linea'); return l.hidden ? '(sin línea)' : l.textContent.trim().slice(0, 120); });
const elegirFicha = async id => { await page.evaluate(() => { const n = document.getElementById('b-no'); if (n && n.offsetParent) n.click(); const cc = document.querySelector('#fichab [data-act="cclose"]'); if (cc && cc.offsetParent) cc.click(); const s = Game.state; for (const r of DATA.RES) { s.res[r] = 1e4; s.alm[r] = Math.max(s.alm[r] || 0, 1e4); } }); const f = page.locator('.pza[data-id="' + id + '"]'); await f.scrollIntoViewIfNeeded().catch(() => {}); await f.tap(); await page.waitForTimeout(1200); };
const sitioVerde = async pz => { const p = await page.evaluate(pz => { const id = UI.city, E = Game.ciudadE(id); let m = null; for (let x = E.foro.x - 250; x <= E.foro.x + 250; x += 10) for (let z = E.foro.z - 250; z <= E.foro.z + 250; z += 10) { const n = Game.notaSitio(id, pz, x, z); if (n && n.vale && (!m || n.nota > m.n)) m = { n: n.nota, x, z }; } if (!m) return null; UI.cityV.mirar(m.x, m.z, 300, 0); return { x: m.x, z: m.z }; }, pz); if (!p) return false; for (let k = 0; k < 4; k++) { await page.waitForTimeout(1500); const q = await page.evaluate(m => UI.cityV.aPantalla(m.x, m.z, 0), p); await page.touchscreen.tap(q.x, q.y); await page.waitForTimeout(900); if (await page.evaluate(() => !document.getElementById('b-si').disabled)) break; } return true; };
const tocaPieza = async () => { for (let k = 0; k < 4; k++) { const e = await page.evaluate(() => { const E = Game.ciudadE(UI.city), e = E.edificios.find(q => !q.obra && !q.ruina && DATA.BUILD[q.tipo] && q.x !== undefined); if (!e) return null; UI.cityV.mirar(e.x, e.z, 260, 0); return { x: e.x, z: e.z, t: e.tipo }; }); if (!e) return ''; await page.waitForTimeout(2500); const p = await page.evaluate(e => UI.cityV.aPantalla(e.x, e.z, 4), e); await page.touchscreen.tap(p.x, p.y); await page.waitForTimeout(900); if (await page.evaluate(() => !!document.querySelector('#fichab .ficha'))) return e.t; } return ''; };
const PASOS = {
  // --- CN4: bandeja, fantasma, ficha y obra (todo tocando la pantalla como un dedo) ---
  bandeja: async () => { await page.evaluate(() => { const s = Game.state; for (const r of DATA.RES) { s.res[r] = 1e4; s.alm[r] = Math.max(s.alm[r] || 0, 1e4); } UI.cityV.view('ciudad'); }); await page.waitForTimeout(1500); return 'bandeja: ' + await page.evaluate(() => document.querySelectorAll('.pza').length + ' fichas'); },
  fantasma: async () => { await elegirFicha('granja'); const ok = await sitioVerde('granja'); return 'ficha granja · ' + (ok ? 'fantasma en sitio verde' : 'sin sitio verde') + ' · ' + await lineaTxt(); },
  rojo: async () => { await elegirFicha('granja'); await page.evaluate(() => { const E = Game.ciudadE(UI.city); UI.cityV.mirar(E.foro.x, E.foro.z, 700, 0); }); await page.waitForTimeout(800); await page.touchscreen.tap(30, 250); await page.waitForTimeout(900); return 'fantasma en el borde · ' + await lineaTxt(); },
  ficha: async () => { await page.evaluate(() => { if (UI.modo3 && UI.modo3 !== 'ver') document.querySelector('#b-no').click(); }); await page.waitForTimeout(500); const ok = await tocaPieza(); return ok ? 'ficha de ' + ok : 'no se pudo tocar ninguna pieza'; },
  obra: async () => { await page.waitForTimeout(600); await elegirFicha('granja'); const ok = await sitioVerde('granja'); let dbg = 'verde=' + ok + ' modo=' + await page.evaluate(() => UI.modo3); if (ok) { dbg = await lineaTxt() + ' / ' + await page.evaluate(() => { const b = document.getElementById('b-si'); return b.disabled + ' ' + UI.modo3 + ' ' + b.textContent; }); await page.click('#b-si', { timeout: 5000 }).catch(e => { dbg += ' CLICK: ' + e.message.slice(0, 80); }); await page.waitForTimeout(2500); } return page.evaluate(() => { const o = Game.state.cities[UI.city].obras; if (o[0]) UI.cityV.mirar(o[0].x, o[0].z, 260, 0.3); return o.length + ' obras · ' + (o[0] ? (o[0].pieza || o[0].b) : 'ninguna'); }).then(t => t + ' · ' + dbg); },
  meses24: async () => { await page.evaluate(() => { const s = Game.state, id = UI.city, c = s.cities[id], E = Game.ciudadE(id), lista = ['fuente', 'templo', 'granja', 'mercado', 'almacen', 'cuartel', 'fuente', 'aserradero'];      // 24 meses de juego construyendo para que las casas suban
    const mejor = pz => { let m = null; for (let x = E.foro.x - 150; x <= E.foro.x + 150; x += 15) for (let z = E.foro.z - 150; z <= E.foro.z + 150; z += 15) { const n = Game.notaSitio(id, pz, x, z); if (n && n.vale && (!m || n.nota > m.n)) m = { x, z, n: n.nota }; } return m; };
    s.speed = 0; for (let i = 0; i < 96; i++) { if (i % 4 === 0) for (const r of DATA.RES) { s.res[r] = 1e5; s.alm[r] = 1e5; s.cuarto[r] = 1e5; }
      if (!c.obras.length && lista.length) { const pz = lista.shift(), m = mejor(pz); if (m) Game.colocar(id, pz, m.x, m.z); }
      if (s.pending.length) s.pending.length = 0; Game.tick(0.25); } s.pending.length = 0; UI.cityV.view('ciudad'); });
    return page.evaluate(() => { const E = Game.ciudadE(UI.city), n = [0, 0, 0, 0, 0]; for (const l of E.parcelas) if (l.casa && !l.fuera) n[l.casa.nivel]++; return 'casas por nivel I..IV: ' + n.slice(1).join('/') + ' · calles empedradas: ' + E.vias.filter(v => v.emp).length + ' · edificios: ' + E.edificios.length; }); },
  capua: async () => { await elegir('capua'); await page.waitForTimeout(6000); await cierra(); },
  ruina: async () => { await elegir(ciudad); await page.waitForTimeout(3000); await cierra(); return page.evaluate(() => {      // casas en ruina: la mitad de las de la calle con más casas y unas cuantas más
    const E = Game.ciudadE(UI.city), nc = {}; for (const l of E.parcelas) if (l.casa && !l.fuera) nc[l.via] = (nc[l.via] || 0) + 1;
    let via = null, mejor = 0; for (const q of E.vias) if (q.p && q.p.length > 1 && q.largo >= 40 && (nc[q.id] || 0) > mejor) { mejor = nc[q.id]; via = q; }
    const rs = [], altas = E.parcelas.filter(l => l.casa && !l.fuera && l.casa.nivel >= 2).sort((p, q) => Math.hypot(p.x - E.foro.x, p.z - E.foro.z) - Math.hypot(q.x - E.foro.x, q.z - E.foro.z)); altas.filter((l, i) => i % 3 === 0).slice(0, 10).forEach(l => { l.casa.ruina = 5; rs.push(l); });
    for (const l of E.parcelas) if (l.casa && !l.fuera && !l.casa.ruina && l.id % 9 === 0) { l.casa.ruina = 5; rs.push(l); }
    E.rev++; const m = rs.slice(0, 5); UI.cityV.mirar(m.reduce((a, l) => a + l.x, 0) / m.length, m.reduce((a, l) => a + l.z, 0) / m.length, 95, 0.6); return rs.length + ' casas en ruina (nivel ' + m.map(l => l.casa.nivel).join(',') + ')'; }); },
  obras: async () => { await elegir(ciudad); await page.waitForTimeout(3000); await cierra(); return page.evaluate(() => {
    const id = UI.city, s = Game.state, c = s.cities[id], E = Game.ciudadE(id); for (const r of DATA.RES) { s.res[r] = 1e5; s.alm[r] = 1e5; s.cuarto[r] = 1e5; }
    for (const l of E.parcelas) if (l.casa) l.casa.ruina = 0;
    const mejor = pz => { let m = null; for (let x = E.foro.x - 120; x <= E.foro.x + 120; x += 10) for (let z = E.foro.z - 120; z <= E.foro.z + 120; z += 10) { const n = Game.notaSitio(id, pz, x, z); if (n && n.vale && (!m || n.nota > m.n)) m = { x, z, n: n.nota }; } return m; };
    c.obras.length = 0; const pz = 'mercado', a = mejor(pz), r1 = a && Game.colocar(id, pz, a.x, a.z); let txt = 'obra 1 (' + pz + ', nueva): ' + JSON.stringify(r1 && { ok: r1.ok, motivo: r1.motivo }), pts = [];
    if (r1 && r1.ok) { const o = c.obras[0]; const du = o.t1 - o.t0; o.t0 = s.t - du * 0.45; o.t1 = o.t0 + du; pts.push([o.x, o.z]); }
    const e = E.edificios.find(q => !q.obra && !q.ruina && DATA.BUILD[q.tipo] && CI_MEJORA(q));
    function CI_MEJORA(q) { return q.x !== undefined && (!c.obras[0] || Math.hypot(q.x - c.obras[0].x, q.z - c.obras[0].z) > 20); }
    if (e) { c.obras.push({ b: e.tipo, pieza: e.tipo, eid: e.id, x: e.x, z: e.z, nuevo: false, mejora: 1, t0: s.t - 8, t1: s.t + 2 }); txt += ' · obra 2: mejora de ' + e.tipo; pts.push([e.x, e.z]); }
    E.muralla.fase = 0; E.muralla.obra = 2; E.rev++;
    const mx = pts.reduce((q, p) => q + p[0], 0) / (pts.length || 1), mz = pts.reduce((q, p) => q + p[1], 0) / (pts.length || 1), sep = pts.length > 1 ? Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) : 0;
    UI.cityV.mirar(mx, mz, Math.max(110, sep * 1.3 + 60), 0.4); return txt + ' · ' + c.obras.length + ' entradas en c.obras · separación ' + Math.round(sep); }); },
  muralla: async () => page.evaluate(() => { const E = Game.ciudadE(UI.city), S = E.surco, p = S[Math.floor(S.length * 0.12)]; E.muralla.fase = 0; E.muralla.obra = 1; E.rev++; UI.cityV.mirar(p[0], p[1], 170, 0.5); return 'empalizada a 2/3 en el surco (fase 0, obra 1)'; }),
  piedra: async () => page.evaluate(() => { const E = Game.ciudadE(UI.city), S = E.surco, p = E.puertas[0] || { x: S[0][0], z: S[0][1] }; E.muralla.fase = 2; E.muralla.obra = 0; E.rev++; UI.cityV.mirar(p.x, p.z, 150, 0.5); return 'muralla de piedra (fase 2) junto a la puerta ' + (E.puertas.length); })
};
/* medida=1: triángulos y llamadas de Roma con 200 casas, sin y con guarnición, y tiempos del primer cuadro y de la primera sombra tras cambiar de ciudad */
if (op.medida) {
  const t = await page.evaluate(async () => { const M = await import('/js/gfx/city3d.js'), V = UI.cityV; Game.state.speed = 0;
    let tm = 0, usado = false; const up = V.update.bind(V); V.update = function (...a) { const t0 = performance.now(); up(...a); if (!usado && a[1] === 'roma' && this._visto) { usado = true; tm = performance.now() - t0; } this._visto = a[1]; };
    const espera = f => new Promise(ok => { const q = () => f() ? ok() : requestAnimationFrame(q); q(); });
    UI.city = 'capua'; await new Promise(r => setTimeout(r, 4000)); const s0 = M.medidas.sombras, t0 = performance.now(); UI.city = 'roma';
    await espera(() => usado); const t1 = performance.now(); await espera(() => M.medidas.sombras > s0); V.update = up; return { primerCuadro: Math.round(tm), primeraSombra: Math.round(performance.now() - t0), hasta: Math.round(t1 - t0) }; });
  console.log('Cambio Capua → Roma (render por software): primer cuadro (montar y dibujar) ' + t.primerCuadro + ' ms, primera sombra ' + t.primeraSombra + ' ms desde el cambio');
  const E = await page.evaluate(() => { const E = Game.ciudadE('roma'); let n = 0, ult = 0; for (const l of E.parcelas) { ult = Math.max(ult, l.id); if (l.casa && !l.fuera) n++; } const base = E.parcelas.filter(l => l.casa && !l.fuera), real = n; let i = 0;
    while (n < 200 && base.length) { const l = base[i++ % base.length], k = i * 1.7; E.parcelas.push(Object.assign({}, l, { id: ++ult, x: l.x + Math.cos(k) * (30 + i % 40), z: l.z + Math.sin(k) * (30 + i % 40), casa: Object.assign({}, l.casa, { nivel: 2 + (i % 3) }) })); n++; }
    E.rev++; window.__u = Object.assign({}, Game.state.cities.roma.units); return n + ' casas (' + real + ' reales y el resto copiadas para la prueba)'; });
  for (const guar of [false, true]) { await page.evaluate(g => { const c = Game.state.cities.roma; for (const k in window.__u) c.units[k] = g ? window.__u[k] : 0; UI.cityV.view('ciudad'); }, guar); await page.waitForTimeout(7000);
    console.log('Roma con ' + E + (guar ? ' CON guarnición: ' : ' SIN guarnición: ') + await medir()); }
  await page.evaluate(() => { const c = Game.state.cities.roma; for (const k in window.__u) c.units[k] = window.__u[k]; });
}
for (const v of vistas) {
  let nota = '';
  if (PASOS[v]) nota = (await PASOS[v]()) || '';
  await page.evaluate(v => { const V = UI.cityV; if (!/^(bandeja|fantasma|rojo|ficha|obra)$/.test(v)) UI.bsel = null;
    if (v === 'grande') { const c = Game.state.cities[UI.city]; for (const b in DATA.BUILD) c.b[b] = Math.max(c.b[b] || 0, 5); Object.assign(c.units, { hastati: 400, principes: 300, triarii: 150, velites: 250, equites: 120 }); V.view('ciudad'); }
    else if (v === 'media') { V.view('ciudad'); V.c.dist = 250; }
    else if (v === 'ruina' || v === 'obras' || v === 'muralla' || v === 'piedra') { }
    else if (v === 'lejos') { V.view('ciudad'); V.c.dist *= 2.2; }
    else if (v === 'toque' || v === 'ciudad' || v === 'meses24' || v === 'capua') V.view('ciudad');
    else if (v === 'calle' || v === 'ejercito') V.view(v); }, v);
  await page.waitForTimeout(v === 'grande' ? 9000 : 4500);
  if (v === 'toque') { const t = await tocaPieza(); if (t) nota = ' · ficha de ' + t; else { const g = await page.evaluate(() => { const E = Game.ciudadE(UI.city), V = UI.cityV; V.mirar(E.foro.x + 60, E.foro.z + 60, 260, 0); return 1; }); await page.waitForTimeout(2500); await page.touchscreen.tap(195, 420); await page.waitForTimeout(900); nota = ' · toque en el suelo: ' + await lineaTxt(); } }
  const f = join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + v + '.jpg');
  for (let i = 0; ; i++) { try { await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } }
  console.log(f + ' · ' + await medir() + (nota ? ' · ' + nota : ''));
}
if (errores.length) console.log('ERRORES DE CONSOLA:\n' + [...new Set(errores)].join('\n')); else console.log('Sin errores de consola.');
await br.close(); srv.close();
