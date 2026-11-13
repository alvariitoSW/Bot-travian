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
const vistas = (op.vistas || (pref === 'CN7' ? 'c7-surco,c7-empalizada-obra,c7-empalizada,c7-piedra,c7-ruina' : 'bandeja,fantasma,rojo,ficha,obra')).split(','), ciudad = op.ciudad || 'roma', dpr = +(op.dpr || 2);
const LUZ_ESTACIONAL = true;          // Q11: false = sin mes= ni vistas de luz (la ciudad usa la luz de siempre)
const ponerFecha = (mes, frac) => page.evaluate(([m, f]) => { Game.state.speed = 0; Game.state.t = 24 + (m - 1) + f; }, [mes, frac]);     // inversa de G.estacion: enero = invierno, 3 meses por turno
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
  // --- Q11: luz por estación y antorchas (reloj en pausa; t se fija a mano) ---
  estaciones: async () => { await page.evaluate(() => { const E = Game.ciudadE(UI.city); UI.cityV.view('ciudad'); UI.cityV.mirar(E.foro.x, E.foro.z, 330, 0.5); }); const out = [], M = await page.evaluate(async () => await import('/js/gfx/city3d.js').then(m => m.medidas.sombras));
    for (const [n, mes] of [['primavera', 5], ['verano', 8], ['otono', 11], ['invierno', 2]]) { await ponerFecha(mes, 0.3); await page.waitForTimeout(2500);
      await page.screenshot({ path: join(RAIZ, 'gobierno/capturas-tarea', pref + '-estaciones-' + n + '.jpg'), type: 'jpeg', quality: 84, timeout: 180000 }); out.push(n + ' ' + await medir()); }
    const M2 = await page.evaluate(async () => await import('/js/gfx/city3d.js').then(m => m.medidas.sombras)); return out.join(' | ') + ' · cálculos de sombra en las 4 estaciones: ' + (M2 - M); },
  atardecer: async () => { await ponerFecha(8, 0.95); await page.evaluate(() => { const E = Game.ciudadE(UI.city); UI.cityV.view('ciudad'); UI.cityV.mirar(E.foro.x, E.foro.z, 150, 0.45); }); await page.waitForTimeout(1500); return 'verano, fracción 0,95 del mes'; },
  // --- CN7: muralla por fases y arrabal en ruina (node gobierno/captura-ciudad.mjs CN7) ---
  'c7-surco': async () => page.evaluate(() => { const E = Game.ciudadE(UI.city), S = E.surco, p = E.puertas[0] || { x: S[0][0], z: S[0][1] }; E.muralla.fase = 0; E.muralla.obra = 0; E.rev++; UI.cityV.view('ciudad'); UI.cityV.mirar(p.x, p.z, 170, 0.5); return 'surco sin muralla (fase 0)'; }),
  'c7-empalizada-obra': async () => page.evaluate(() => { const E = Game.ciudadE(UI.city), S = E.surco, p = E.puertas[0] || { x: S[0][0], z: S[0][1] }; E.muralla.fase = 0; E.muralla.obra = 1; E.rev++; UI.cityV.view('ciudad'); UI.cityV.mirar(p.x, p.z, 170, 0.5); return 'empalizada a medio hacer (fase 0, obra 1)'; }),
  'c7-empalizada': async () => page.evaluate(() => { const E = Game.ciudadE(UI.city), S = E.surco, p = E.puertas[0] || { x: S[0][0], z: S[0][1] }; E.muralla.fase = 1; E.muralla.obra = 0; E.rev++; UI.cityV.view('ciudad'); UI.cityV.mirar(p.x, p.z, 170, 0.5); return 'empalizada completa (fase 1)'; }),
  'c7-piedra': async () => page.evaluate(() => { const E = Game.ciudadE(UI.city), S = E.surco, p = E.puertas[0] || { x: S[0][0], z: S[0][1] }; E.muralla.fase = 2; E.muralla.obra = 0; E.rev++; UI.cityV.view('ciudad'); UI.cityV.mirar(p.x, p.z, 170, 0.5); return 'piedra con torres y puertas (fase 2)'; }),
  'c7-ruina': async () => page.evaluate(async () => { const C = await import('/js/ciudad.js'), E = Game.ciudadE(UI.city); E.muralla.fase = 0; E.muralla.obra = 0; for (const l of E.parcelas) if (l.casa) l.casa.ruina = 0;
    let nat = C.casasArrabal(E); if (nat < 8) { const fu = E.parcelas.filter(l => l.casa && !l.fuera && !l.arrabal).sort((a, b) => Math.hypot(b.x - E.foro.x, b.z - E.foro.z) - Math.hypot(a.x - E.foro.x, a.z - E.foro.z)).slice(0, 14); fu.forEach(l => { l.arrabal = true; }); }      // Roma recién creada no tiene arrabal: se marcan como arrabal las 14 casas más alejadas
    const ant = C.casasArrabal(E), q = C.saquearArrabal(E, 1), ids = new Set(q.ids), rs = E.parcelas.filter(l => ids.has(l.id)); E.rev++;
    if (rs.length) UI.cityV.mirar(rs.reduce((a, l) => a + l.x, 0) / rs.length, rs.reduce((a, l) => a + l.z, 0) / rs.length, 170, 0.6); return 'arrabal: ' + ant + ' casas vivas, ' + q.n + ' en ruina'; }),
  'c7-ficha': async () => { await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'modo'; b.dataset.v = 'guerra'; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(1500); await cierra();
    return page.evaluate(async () => { const s = Game.state, id = Object.keys(s.cities).find(k => s.cities[k].owner !== 'roma'); s.cities[id].b = Object.assign(s.cities[id].b || {}, { muralla: 6 }); UI.sel = id; UI.sheetKey = ''; UI.dirty = true; UI.map.center(id); UI.map.c.dist = 34; UI.map.clamp(); await new Promise(r => setTimeout(r, 2500)); document.getElementById('sheet').hidden = false;
      const sh = document.getElementById('sheet'), ex = [...sh.querySelectorAll('.stat')].filter(e => e.getBoundingClientRect().right > 390).length; return 'ciudad ' + id + ' · ' + (sh.querySelector('.stat') ? [...sh.querySelectorAll('.stat')].map(e => e.textContent).join(' | ') : 'sin .stat') + ' · stats pasados de 390 px: ' + ex + ' · scrollW ' + sh.scrollWidth + '/' + sh.clientWidth; }); },
  // --- CN4: bandeja, fantasma, ficha y obra (todo tocando la pantalla como un dedo) ---
  // --- CN6: barrios (etiquetas con la cámara lejos, capilla de cruce, ficha de la ciudad) ---
  barrios: async () => { await elegir(ciudad); await page.waitForTimeout(3000); await cierra(); return page.evaluate(() => { const s = Game.state, id = UI.city, E = Game.ciudadE(id); for (const r of DATA.RES) { s.res[r] = 1e5; s.alm[r] = 1e5; s.cuarto[r] = 1e5; }
    let ok = 'sin 2.º barrio'; for (let rad = 120; rad <= 260 && E.barrios.length < 2; rad += 20) for (let a = 0; a < 12 && E.barrios.length < 2; a++) { const x = E.foro.x + Math.cos(a / 12 * 6.283) * rad, z = E.foro.z + Math.sin(a / 12 * 6.283) * rad, r = Game.colocar(id, 'compitum', x, z); if (r && r.ok) ok = 'capilla en ' + Math.round(x) + ',' + Math.round(z); }
    s.pending.length = 0; for (let i = 0; i < 24; i++) Game.tick(0.25); s.pending.length = 0; E.barrios.forEach((b, i) => { b.nivel = i ? 1 : 3; }); E.rev++; UI.cityV.view('ciudad'); const m = E.barrios.reduce((a, b) => [a[0] + b.x / E.barrios.length, a[1] + b.z / E.barrios.length], [0, 0]); UI.cityV.mirar(m[0], m[1] + 40, 600, 0.3); return ok + ' · barrios: ' + E.barrios.map(b => b.corto + ' ' + b.nivel).join(', '); }); },
  capilla: async () => page.evaluate(() => { const E = Game.ciudadE(UI.city), b = E.barrios[1] || E.barrios[0]; UI.cityV.mirar(b.x, b.z, 120, 0.5); return 'capilla de cruce de ' + b.nombre; }),
  fichabarrios: async () => { await page.evaluate(() => { UI.cityV.mirar(Game.ciudadE(UI.city).foro.x, Game.ciudadE(UI.city).foro.z, 560, 0.3); document.getElementById('popsheet').hidden = false; }); await page.evaluate(() => { const b = document.createElement('button'); b.dataset.act = 'pill'; document.body.appendChild(b); b.click(); b.remove(); document.getElementById('popsheet').hidden = false; UI.dirty = true; }); await page.waitForTimeout(1500); return page.evaluate(() => (document.querySelector('.barrio') || {}).textContent || 'sin bloque barrio'); },
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
if (op.mes && LUZ_ESTACIONAL) await ponerFecha(+op.mes, +(op.frac || 0));
if (op.sombras30) { const r = await page.evaluate(async () => { const M = await import('/js/gfx/city3d.js'), a = M.medidas.sombras; Game.state.speed = 1; await new Promise(r => setTimeout(r, 30000)); const b = M.medidas.sombras; Game.state.speed = 0; return { pedidas: b - a, t: Game.state.t }; }); console.log('Sombras pedidas en 30 s con el reloj en marcha: ' + r.pedidas + ' (t=' + r.t.toFixed(2) + ')'); }
/* CN5 · fundar colonias: node gobierno/captura-ciudad.mjs CN5 → mapa con sitios, ficha, colonos en marcha aviso, pantalla de fundar (verde y rojo), arado a medio trazar y colonia fundada.
   Todo tocando la pantalla como un dedo; mide los triángulos de cada vista (tope 300.000). */
if (pref === 'CN5' && !op.vistas) {
  const act = (a, v) => page.evaluate(([a, v]) => { const b = document.createElement('button'); b.dataset.act = a; if (v) b.dataset.v = v; document.body.appendChild(b); b.click(); b.remove(); }, [a, v]);
  const tri = () => page.evaluate(() => { const m = UI.tab === 'map' && !UI.fundar ? UI.map : UI.cityV; return m.r.info.render.triangles; });
  let maxTri = 0; const informe = [];
  const foto = async (n, nota) => { await page.waitForTimeout(1500); const f = join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + n + '.jpg'); for (let i = 0; ; i++) { try { await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } }
    const t = await tri(); maxTri = Math.max(maxTri, t); informe.push(f + ' · ' + t + ' triángulos' + (nota ? ' · ' + nota : '')); };
  await page.evaluate(() => { const s = Game.state; s.speed = 0; for (const r of DATA.RES) { s.res[r] = 1e4; s.alm[r] = Math.max(s.alm[r] || 0, 1e4); } s.cities.roma.pop = Math.max(s.cities.roma.pop, 400); });
  await page.evaluate(() => { UI.modalOpen = false; document.getElementById('modal').hidden = true; });      // cierra() solo oculta: aquí el modal debe quedar libre para que salga el aviso
await act('modo', 'guerra'); await page.waitForTimeout(1500); await cierra();
  await page.evaluate(() => { UI.sel = null; UI.map.center('cosa'); UI.map.c.dist = 62; UI.map.clamp(); }); await page.waitForTimeout(3000);
  await foto('mapa', 'sitios libres: ' + await page.evaluate(() => Game.coloniasLibres().join(',')));
  await page.evaluate(() => { UI.sel = 'cosa'; UI.sheetKey = ''; UI.map.center('cosa'); UI.map.c.dist = 34; UI.map.clamp(); }); await page.waitForTimeout(2500);
  await foto('ficha', 'ficha de Cosa: ' + await page.evaluate(() => document.getElementById('sheet').innerText.replace(/\n+/g, ' / ').slice(0, 200)));
  const env = await page.evaluate(() => { const r = Game.enviarColonos('roma', 'cosa'); const m = Game.state.marches.find(q => q.colonos); if (m) m.t0 = Game.state.t - (m.t1 - m.t0) * 0.5 + 0 * (m.t1 = Game.state.t + (m.t1 - m.t0) * 0.5); UI.sheetKey = ''; UI.map.c.dist = 34; return JSON.stringify(r) + ' marcha=' + !!m; });
  await page.evaluate(() => { const m = Game.state.marches.find(q => q.colonos); const a = Game.pos(m.from), b = Game.pos(m.to); UI.map.c.x = (a[0] + b[0]) / 2 * 0.1; UI.map.c.z = (a[1] + b[1]) / 2 * 0.1; UI.map.c.dist = 30; UI.map.clamp(); Game.tick(0.001); }); await page.waitForTimeout(2500);
  await foto('colonos', 'enviar: ' + env);
  await page.evaluate(() => { const m = Game.state.marches.find(q => q.colonos); if (m) m.t1 = Game.state.t - 0.01; const tu = Game.turnos; Game.turnos = false; Game.tick(0.01); Game.turnos = tu; });      // en modo turnos las marchas llegan al pasar turno: aquí se fuerza la llegada await page.waitForTimeout(1500);
  for (let i = 0; i < 5 && !(await page.$('#mbox [data-act="fundar"]')); i++) { const c = await page.$('#mbox [data-act="close"]'); if (c) { await c.click(); await page.waitForTimeout(600); } }      // antes puede haber un hecho histórico en cola
  await foto('aviso', 'modal al llegar: ' + await page.evaluate(() => document.getElementById('mbox').innerText.replace(/\n+/g, ' / ').slice(0, 160)));
  await page.click('#mbox [data-act="fundar"]'); await page.waitForTimeout(6000);
  const pts = await page.evaluate(() => { const S = 'cosa'; let ver = null, roj = null; for (let x = -300; x <= 300; x += 40) for (let z = -300; z <= 300; z += 40) { const n = Game.notaFundar(S, x, z); if (!n) continue; if (n.vale && (!ver || n.nota > ver.n)) ver = { x, z, n: n.nota }; if (!n.vale && !roj && Math.hypot(x, z) > 80) roj = { x, z }; } return { ver, roj, modo: UI.modo3 }; });
  const tocar = async p => { const q = await page.evaluate(p => UI.cityV.aPantalla(p.x, p.z, 0), p); await page.touchscreen.tap(q.x, q.y); await page.waitForTimeout(900); };
  if (pts.ver) { await page.evaluate(p => UI.cityV.mirar(p.x, p.z, 700, 0), pts.ver); await page.waitForTimeout(800); await tocar(pts.ver); }
  await foto('fundar-verde', 'modo=' + pts.modo + ' · ' + await lineaTxt() + ' · botón: ' + await page.evaluate(() => document.getElementById('b-si').textContent));
  if (pts.roj) { await page.evaluate(p => UI.cityV.mirar(p.x, p.z, 520, 0), pts.roj); await page.waitForTimeout(800); await tocar(pts.roj); }
  await foto('fundar-rojo', await lineaTxt() + ' · botón: ' + await page.evaluate(() => { const b = document.getElementById('b-si'); return b.textContent + (b.disabled ? ' (desactivado)' : ''); }));
  if (pts.ver) { await page.evaluate(p => UI.cityV.mirar(p.x, p.z, 420, 0), pts.ver); await page.waitForTimeout(800); await tocar(pts.ver); }
  await page.click('#b-si'); await page.waitForTimeout(500);
  await page.evaluate(() => { const E = UI.fundar && UI.fundar.E; if (!E || !E.surco) return; const p = E.surco[Math.floor(E.surco.length * 0.2)]; UI.cityV.mirar(p[0], p[1], 230, 0.5); }); await page.waitForTimeout(500);
  await foto('arado', 'fase=' + await page.evaluate(() => UI.fundar && UI.fundar.fase) + ' · ' + await lineaTxt());
  await page.waitForFunction(() => !UI.fundar, null, { timeout: 60000 }); await page.waitForTimeout(9000); await cierra();
  await page.evaluate(() => UI.cityV.view('ciudad')); await page.waitForTimeout(4000);
  await foto('fundada', 'colonia: ' + await page.evaluate(() => { const c = Game.state.cities.cosa, E = Game.ciudadE('cosa'); return c ? 'tuya=' + (c.owner === 'roma') + ' pestaña=' + UI.tab + ' foro=' + !!(E && E.foro) + ' casas=' + (E ? E.parcelas.filter(l => l.casa).length : 0) : 'no existe'; }));
  await page.evaluate(() => { UI.sel = null; }); await act('modo', 'guerra'); await page.evaluate(() => { UI.map.center('cosa'); UI.map.c.dist = 40; UI.map.clamp(); }); await page.waitForTimeout(3500);
  await foto('mapa-colonia', 'la colonia ya es ciudad en el mapa');
  console.log(informe.join('\n')); console.log('Máximo ' + maxTri + ' triángulos (tope 300000): ' + (maxTri <= 300000 ? 'BIEN' : 'PASADO'));
  if (errores.length) console.log('ERRORES DE CONSOLA:\n' + [...new Set(errores)].join('\n')); else console.log('Sin errores de consola.');
  await br.close(); srv.close(); process.exit(0);
}
for (const v of vistas) {
  let nota = '';
  if (PASOS[v]) nota = (await PASOS[v]()) || '';
  await page.evaluate(v => { const V = UI.cityV; if (!/^(bandeja|fantasma|rojo|ficha|obra)$/.test(v)) UI.bsel = null;
    if (v === 'grande') { const c = Game.state.cities[UI.city]; for (const b in DATA.BUILD) c.b[b] = Math.max(c.b[b] || 0, 5); Object.assign(c.units, { hastati: 400, principes: 300, triarii: 150, velites: 250, equites: 120 }); V.view('ciudad'); }
    else if (v === 'media') { V.view('ciudad'); V.c.dist = 250; }
    else if (/^c7-/.test(v) || v === 'ruina' || v === 'obras' || v === 'muralla' || v === 'piedra') { }
    else if (v === 'lejos') { V.view('ciudad'); V.c.dist *= 2.2; }
    else if (v === 'barrios' || v === 'capilla' || v === 'fichabarrios') { }
    else if (v === 'toque' || v === 'ciudad' || v === 'meses24' || v === 'capua') V.view('ciudad');
    else if (v === 'calle' || v === 'ejercito') V.view(v); }, v);
  if (v === 'estaciones') { console.log(nota); continue; }
  await page.waitForTimeout(v === 'grande' ? 9000 : 4500);
  if (v === 'toque') { const t = await tocaPieza(); if (t) nota = ' · ficha de ' + t; else { const g = await page.evaluate(() => { const E = Game.ciudadE(UI.city), V = UI.cityV; V.mirar(E.foro.x + 60, E.foro.z + 60, 260, 0); return 1; }); await page.waitForTimeout(2500); await page.touchscreen.tap(195, 420); await page.waitForTimeout(900); nota = ' · toque en el suelo: ' + await lineaTxt(); } }
  const f = join(RAIZ, 'gobierno/capturas-tarea', pref + '-' + v.replace(/^c7-/, '') + '.jpg');
  for (let i = 0; ; i++) { try { await page.screenshot({ path: f, type: 'jpeg', quality: 84, timeout: 180000 }); break; } catch (e) { if (i >= 2) throw e; } }
  console.log(f + ' · ' + await medir() + (nota ? ' · ' + nota : ''));
}
if (errores.length) console.log('ERRORES DE CONSOLA:\n' + [...new Set(errores)].join('\n')); else console.log('Sin errores de consola.');
await br.close(); srv.close();
