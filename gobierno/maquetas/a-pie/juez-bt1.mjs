/* AQVILA — BT1 («Lo común, una sola vez», paso 1 del Plan A de batallas): juez de LO QUE SE VE.
   Abre cada batalla como el jugador, a 390×844 y a 844×390, y FALLA si:
     · la barra de abajo no dice exactamente, en este orden: [propia] · Avanzar · Cargar · Alto · Relevo · Retirada
       (la propia: Testudo en manípulo y testudo, Bajar picas en la falange, la del cuerpo elegido en Ásculo, Formar… en la batalla grande);
     · un botón cambia de texto durante la partida (salvo la propia de Ásculo, y solo al elegir otro cuerpo);
     · dos etiquetas visibles se solapan (estandartes y sus palabras, gritos, avisos, «¡Jabalinas!», barras de la batalla grande);
     · una etiqueta visible queda cortada por el borde de la pantalla, o hay torres de más de dos etiquetas apiladas;
   · una etiqueta visible pisa la barra de órdenes, la raya del cansancio, la cabecera del objetivo o la tira de cuerpos;
     · un botón de la barra mide menos de 52 px, se sale de la pantalla o su palabra se sale de su hueco;
     · hay errores de consola.
   Escenas: manípulo y testudo (por gobierno/maquetas/a-pie/ y por la URL vieja sin parámetros), falange con un rival, Ásculo (Pirro y
   Roma), batalla grande desde Escaramuzas en vivo y «Bajar a pie» desde ella. También mira que Escaramuzas tenga UNA sola tarjeta
   para manípulo y testudo.
   Uso: node gobierno/maquetas/a-pie/juez-bt1.mjs [solo=apie,falange,asculo,grande]   Capturas: gobierno/capturas-tarea/BT1-B-*.jpg
   Sale con código 1 si algo falla. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const op = Object.fromEntries(process.argv.slice(2).filter(a => a.includes('=')).map(a => a.split(/=(.*)/s).slice(0, 2)));
const SOLO = op.solo ? op.solo.split(',') : null, quiere = k => !SOLO || SOLO.includes(k);
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const srv = createServer(async (q, r) => { try { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; if (p.includes('..')) throw 0; const d = await readFile(join(RAIZ, p)); r.writeHead(200, { 'content-type': TIPOS[extname(p)] || 'application/octet-stream' }); r.end(d); } catch (e) { r.writeHead(404); r.end(); } });
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const BASE = 'http://127.0.0.1:' + srv.address().port + '/';
const { chromium } = createRequire(import.meta.url)('playwright');
const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
await mkdir(SALIDA, { recursive: true });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
const page = await ctx.newPage(); page.setDefaultTimeout(120000);
const fallos = []; let bienes = 0;
page.on('console', m => { if (m.type() === 'error' && !/GPU stall|GL Driver|Failed to load resource/.test(m.text())) { fallos.push('consola: ' + m.text().slice(0, 200)); console.log('  [error] ' + m.text().slice(0, 200)); } });
page.on('pageerror', e => { fallos.push('excepción: ' + String(e.message).slice(0, 200)); console.log('  [excepción] ' + String(e.message).slice(0, 200)); });
const bien = (ok, t) => { console.log((ok ? '  bien: ' : '  MAL: ') + t); if (ok) bienes++; else fallos.push(t); };
const esp = ms => page.waitForTimeout(ms);
const FIJAS = ['Avanzar', 'Cargar', 'Alto', 'Relevo', 'Retirada'];
const foto = async (f, n) => { try { await (typeof f.page === 'function' ? f.page() : f).screenshot({ path: join(SALIDA, 'BT1-B-' + n + '.jpg'), type: 'jpeg', quality: 78 }); console.log('  captura BT1-B-' + n + '.jpg'); } catch (e) { console.log('  sin captura ' + n + ': ' + e.message); } };

/* lo que se ve en un marco (la página o la capa de «Bajar a pie»): barra, etiquetas y zonas. Corre en el navegador */
const MIRA = () => {
  const ve = e => !!e && e.isConnected && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && (r => r.width > 0 && r.height > 0)(e.getBoundingClientRect());
  const R = e => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
  const grande = !!document.getElementById('mn-ordenes') && !document.getElementById('ordenes');
  const barra = document.querySelector(grande ? '#mn-ordenes' : '#ordenes');
  const bots = barra ? [...barra.querySelectorAll('.orden')] : [];
  const textos = bots.map(b => b.querySelector('b').textContent.trim());
  const medidas = bots.map(b => { const a = b.querySelector('.aro').getBoundingClientRect(), w = b.querySelector('b').getBoundingClientRect(), q = b.getBoundingClientRect(); return { d: Math.min(a.width, a.height), dentro: q.left >= -0.5 && q.right <= innerWidth + 0.5 && q.top >= -0.5 && q.bottom <= innerHeight + 0.5, cabe: w.left >= q.left - 1 && w.right <= q.right + 1 }; });
  const et = [];
  const pon = (n, e) => { if (ve(e)) et.push({ n, ...R(e) }); };
  if (grande) {
    document.querySelectorAll('#mn-capa .mn-e').forEach((e, i) => pon('barra' + i, e));
    pon('aviso', document.getElementById('mn-aviso')); document.querySelectorAll('#mn-cinta > div').forEach((e, i) => pon('cinta' + i, e));
  } else {
    document.querySelectorAll('#ests .est').forEach(e => pon('estandarte «' + (e.querySelector('b') || e).textContent.trim() + '»', e));
    for (const id of ['grito', 'aviso-b', 'borde-t', 'pausa-t']) pon(id, document.getElementById(id));
    for (const id of ['borde-a', 'borde-i', 'borde-d']) { const e = document.getElementById(id); if (ve(e)) pon(id, e.querySelector('span')); }
  }
  const zonas = [];
  for (const [n, sel] of grande ? [['barra de órdenes', '#mn-ordenes'], ['ficha', '#mn-ficha'], ['arriba', '#mn-arriba']] : [['barra de órdenes', '#ordenes'], ['raya del cansancio', '#raya'], ['cabecera del objetivo', '#mision'], ['tira de cuerpos', '#tira']]) { const e = document.querySelector(sel); if (ve(e)) zonas.push({ n, ...R(e) }); }
  const pisa = (a, b, h) => a.l < b.r - h && a.r > b.l + h && a.t < b.b - h && a.b > b.t + h;
  const choques = [];
  for (let i = 0; i < et.length; i++) for (let j = i + 1; j < et.length; j++) if (pisa(et[i], et[j], 2)) choques.push(et[i].n + ' pisa ' + et[j].n);
  for (const a of et) for (const z of zonas) if (pisa(a, z, 0)) choques.push(a.n + ' asoma sobre ' + z.n);
  /* cortadas por el borde de la pantalla (estandartes, avisos del borde, gritos…) */
  for (const a of et) if (a.l < -0.5 || a.r > innerWidth + 0.5 || a.t < -0.5 || a.b > innerHeight + 0.5) choques.push(a.n + ' queda cortada por el borde de la pantalla');
  /* torres: como mucho dos etiquetas apiladas una encima de otra */
  const sobre = (a, b) => a.b <= b.t + 1 && b.t - a.b <= 6 && a.l < b.r - 1 && a.r > b.l + 1;   /* a justo encima de b (a menos de 6 px; rotulos.js TORRE) */
  const altura = (b, n = 1) => { const a = et.find(x => x !== b && sobre(x, b)); return a && n < 9 ? altura(a, n + 1) : n; };
  for (const b of et) { const h = altura(b); if (h > 2) { choques.push('torre de ' + h + ' etiquetas sobre ' + b.n); break; } }
  /* textos cortados: un aviso o grito que no cabe en su caja */
  for (const id of ['grito', 'aviso-b', 'borde-t', 'mn-aviso']) { const e = document.getElementById(id); if (ve(e) && getComputedStyle(e).overflowX !== 'visible' && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) choques.push(id + ' cortado: «' + e.textContent + '»'); }
  /* etiquetas sin dueño: toda etiqueta dice de quién es (la tira de Ásculo pone el nombre con data-n) */
  const SUELTA = /^(fresca|firme|cansada|agotada|cede|huye|se retira|se rehace|testudo|muro|abierto)$/;
  document.querySelectorAll('#ests .est b').forEach(b => { if (!ve(b)) return; const t = (b.dataset.n ? b.dataset.n + ' · ' : '') + b.textContent.trim(); if (SUELTA.test(t)) choques.push('etiqueta sin dueño: «' + t + '»'); });
  /* marcas del suelo (la raya dorada de girar) recortadas por encima de la zona de mando */
  const giro = document.getElementById('giro'), ab = document.getElementById('abajo');
  if (giro && ab && !giro.hasAttribute('hidden')) { const m = /inset\(0(?:px)? 0(?:px)? ([\d.]+)px/.exec(giro.style.clipPath || ''), corte = m ? +m[1] : 0; if (corte < innerHeight - ab.getBoundingClientRect().top) choques.push('la raya de girar se dibuja encima de la barra de órdenes'); }
  /* batalla grande: un distintivo por unidad, sin montón (estandarte 3D con su barra; los rectángulos los da __mn.distintivos) */
  let monton = 0;
  if (grande && window.__mn && window.__mn.distintivos) {
    const D = window.__mn.distintivos(), sup = (a, b) => { const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l), oy = Math.min(a.b, b.b) - Math.max(a.t, b.t); return ox > 0 && oy > 0 && ox * oy > 0.12 * Math.min((a.r - a.l) * (a.b - a.t), (b.r - b.l) * (b.b - b.t)); };
    for (let i = 0; i < D.length; i++) for (let j = i + 1; j < D.length; j++) if (sup(D[i], D[j])) monton++;
    if (monton) choques.push(monton + ' pares de estandartes amontonados');
    for (const d of D) for (const z of zonas) if (pisa(d, z, 0)) { choques.push('un estandarte tapa ' + z.n); break; }
  }
  return { textos, medidas, choques, etiquetas: et.length, monton };
};
/* una escena: mira la barra varias veces mientras se juega; propia = el texto que debe tener el primer hueco */
async function examina(nombre, marco, propia, { muestras = 4, cada = 1500, accion = null, propiaLibre = false } = {}) {
  let primera = null, cambia = '', choques = new Set(), medidas = null, etiquetas = 0;
  for (let k = 0; k < muestras; k++) {
    if (accion) await accion(k);
    const m = await marco.evaluate(MIRA);
    if (!primera) primera = m.textos;
    else for (let i = 0; i < m.textos.length; i++) if (m.textos[i] !== primera[i] && !(i === 0 && propiaLibre)) cambia = `«${primera[i]}» pasó a «${m.textos[i]}»`;
    m.choques.forEach(c => choques.add(c)); medidas = m.medidas; etiquetas = Math.max(etiquetas, m.etiquetas);
    if (k < muestras - 1) await esp(cada);
  }
  const esperado = [propia, ...FIJAS].join(' · ');
  bien(primera && primera.join(' · ') === esperado, `${nombre}: la barra dice «${primera ? primera.join(' · ') : '—'}» (debe: «${esperado}»)`);
  bien(!cambia, `${nombre}: ningún botón cambia de nombre durante la partida${cambia ? ' — ' + cambia : ''}`);
  bien(medidas && medidas.length === 6 && medidas.every(x => x.d >= 52 && x.dentro && x.cabe), `${nombre}: seis botones de ≥ 52 px, dentro de la pantalla y con su palabra dentro de su hueco (${medidas ? medidas.map(x => Math.round(x.d)).join(',') : '—'} px)`);
  bien(!choques.size, `${nombre}: ninguna etiqueta pisa otra ni asoma sobre la barra, la raya, la cabecera o la tira (${etiquetas} etiquetas a la vista)` + (choques.size ? ' — ' + [...choques].slice(0, 4).join('; ') : ''));
}
const listo = async () => { await page.waitForFunction(() => window.__bloque && window.__bloque.listo, null, { timeout: 180000 }); await esp(1500); };
const salta = f => page.evaluate(f => window.__bloque.salta(f), f);
/* un toque de dedo en el centro de un elemento (si Playwright no recibe el acuse, el toque va por el DOM como pointerdown) */
const dedo = async sel => { const b = await page.locator(sel).boundingBox(); try { await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); } catch (e) { await page.evaluate(q => { const e = document.querySelector(q); e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }, sel); } };
/* 3 · el oficial: el botón baja la cámara de verdad */
async function oficial(nombre) {
  await dedo('#vista'); const t0 = Date.now();
  await page.waitForFunction(() => window.__bloque.vista.t() >= 0.9, null, { timeout: 30000 }).catch(() => {});   /* 1,4 s en el móvil; aquí el render va muy lento */
  const t = await page.evaluate(() => window.__bloque.vista.t()); console.log('    (bajó en ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s reales)');
  bien(t >= 0.9, `${nombre}: «Oficial» baja la cámara (bajada ${Math.round(t * 100)} %)`);
}
/* 6 · la tarjeta del final sale siempre, en menos de 6 s */
async function final(nombre, foto_) {
  await salta('fin'); const t0 = Date.now();
  const sale = await page.waitForFunction(() => !document.getElementById('fin').hidden, null, { timeout: 30000 }).then(() => true, () => false);
  const s = (Date.now() - t0) / 1000, txt = await page.evaluate(() => document.getElementById('fin-t').textContent);
  /* en el móvil sale a los 2,5 s; aquí cada fotograma tarda segundos: se dan 6 s más dos fotogramas de los de esta máquina */
  const cuadro = await page.evaluate(() => new Promise(r => requestAnimationFrame(a => requestAnimationFrame(b => r((b - a) / 1000)))));
  bien(sale && s <= 6 + 2 * cuadro, `${nombre}: al acabar sale la tarjeta del final («${txt}») en ${s.toFixed(1)} s (aquí un fotograma tarda ${cuadro.toFixed(1)} s)`);
  if (foto_) await foto(page, foto_);
}
const ORIENT = [['v', 390, 844], ['h', 844, 390]];

/* ---- 1 · Escaramuzas: una sola tarjeta para manípulo y testudo, que lleva a la partida unida ---- */
if (quiere('apie')) {
  console.log('1 · Escaramuzas: una tarjeta, una partida');
  await page.goto(BASE); await page.waitForSelector('#menu .mesc', { timeout: 60000 }); await page.click('#menu .mesc'); await esp(1000);
  const tarjetas = await page.evaluate(() => [...document.querySelectorAll('#hoja .cg2-pruebas a, #hoja .cg2-pruebas button')].map(a => ({ t: a.querySelector('b') ? a.querySelector('b').textContent : a.textContent, h: a.getAttribute('href') || '' })));
  const mt = tarjetas.filter(x => /testudo|manípulo a pie/i.test(x.t));
  bien(mt.length === 1 && /Manípulo y Testudo a pie/.test(mt[0].t) && /a-pie\/$/.test(mt[0].h), 'Escaramuzas tiene UNA tarjeta «Manípulo y Testudo a pie» que va a gobierno/maquetas/a-pie/ (' + tarjetas.map(x => x.t).join(' | ') + ')');
  await page.locator('#hoja .cg2-pruebas').scrollIntoViewIfNeeded().catch(() => {}); await foto(page, 'escaramuzas-v');

  /* la URL vieja sin parámetros lleva a la misma partida */
  await page.goto(BASE + 'gobierno/maquetas/bloque/?nivel=normal&semilla=7'); await listo();
  const viejo = await page.evaluate(() => ({ t: document.title, esc: !!(window.__bloque.S && window.__bloque.S.escenario) }));
  bien(/Manípulo y Testudo a pie/.test(viejo.t) && viejo.esc, 'la URL vieja sin parámetros abre la partida unida (' + viejo.t + ', cruzar la colina: ' + viejo.esc + ')');

  for (const [o, w, h] of ORIENT) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(BASE + 'gobierno/maquetas/a-pie/?nivel=normal&semilla=7'); await listo();
    const t = await page.evaluate(() => ({ t: document.title, url: location.search }));
    bien(/Manípulo y Testudo a pie/.test(t.t) && /formacion=testudo/.test(t.url), `a-pie/ lleva a la partida unida (${o}: ${t.t})`);
    await examina('manípulo y testudo, cruzando (' + o + ')', page, 'Testudo', { muestras: 3, accion: async k => { if (k === 1) await salta('salva'); if (k === 2) await salta('testudo'); } });
    await foto(page, 'testudo-cruza-' + o);
    await examina('manípulo y testudo, en la lucha (' + o + ')', page, 'Testudo', { muestras: 3, accion: async k => { if (k === 0) await salta('lucha'); if (k === 2) await salta('trabado'); } });
    const trab = await page.evaluate(() => [...document.querySelectorAll('#ordenes .orden')].map(b => b.dataset.h + (b.classList.contains('apagada') ? '-' : '+')).join(' '));
    bien(/alto-/.test(trab) && /retirada\+/.test(trab), `trabados: «Alto» apagado en su sitio y «Retirada» vale (${trab})`);
    await foto(page, 'testudo-lucha-' + o);
    /* 4 · el grito del relevo, entero (partida nueva: se mira justo tras tocar «Relevo») */
    await page.goto(BASE + 'gobierno/maquetas/a-pie/?nivel=normal&semilla=7'); await listo(); await salta('lucha'); await salta('relevo');
    await page.evaluate(() => document.querySelector('#ordenes .orden[data-h="relevo"]').click()); await esp(500);
    const gr = await page.evaluate(() => { const g = document.getElementById('grito'), r = g.getBoundingClientRect(); return { t: g.textContent, ve: g.classList.contains('ve'), dentro: r.left >= 0 && r.right <= innerWidth, cabe: getComputedStyle(g).overflowX === 'visible' || g.scrollWidth <= g.clientWidth + 1 }; });
    bien(gr.ve && gr.dentro && gr.cabe && /fila/i.test(gr.t), `testudo (${o}): el grito del relevo «${gr.t}» se lee entero`);
    await examina('manípulo y testudo, al relevar (' + o + ')', page, 'Testudo', { muestras: 1 }); await foto(page, 'testudo-relevo-' + o);
    /* 2 y 3 · partida nueva: su jefe vuelve por un lado (la raya de girar) y se baja a la vista del oficial */
    await page.goto(BASE + 'gobierno/maquetas/a-pie/?nivel=normal&semilla=7'); await listo();
    await salta('jefe'); await oficial('testudo (' + o + ')');
    const raya = await page.evaluate(() => !document.getElementById('giro').hasAttribute('hidden'));
    await examina('manípulo y testudo, vista del oficial' + (raya ? ' con la raya de girar' : '') + ' (' + o + ')', page, 'Testudo', { muestras: 2 });
    await foto(page, 'testudo-oficial-' + o);
    await final('testudo (' + o + ')', 'testudo-fin-' + o);
  }
}

/* ---- 2 · falange con un rival ---- */
if (quiere('falange')) {
  console.log('2 · Falange a pie');
  for (const [o, w, h] of ORIENT) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(BASE + 'gobierno/maquetas/bloque/index.html?formacion=falange&rival=manipulos&nivel=normal&semilla=3'); await listo();
    await examina('falange (' + o + ')', page, 'Bajar picas', { muestras: 3, accion: async k => { if (k === 1) await salta('picas'); if (k === 2) await salta('lucha'); } });
    /* «Retirada» vale (el retroceder del motor) y «Alto» lo para */
    const ret = await page.evaluate(async () => { const q = h => document.querySelector('#ordenes .orden[data-h="' + h + '"]'), F = window.__bloque.S.fal; const ap = q('retirada').classList.contains('apagada'); q('retirada').click(); const r1 = F.orden; await new Promise(r => setTimeout(r, 300)); q('alto').click(); return { ap, r1, r2: F.orden }; });
    bien(!ret.ap && ret.r1 === 'retroceder' && ret.r2 !== 'retroceder', `falange (${o}): «Retirada» recula (${ret.r1}) y «Alto» lo para (${ret.r2})`);
    await foto(page, 'falange-lucha-' + o);
    await final('falange (' + o + ')', o === 'v' ? 'falange-fin-v' : null);
  }
}

/* ---- 3 · Ásculo, Pirro y Roma ---- */
if (quiere('asculo')) {
  console.log('3 · Ásculo');
  for (const bando of ['pirro', 'roma']) for (const [o, w, h] of ORIENT) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(BASE + 'gobierno/maquetas/bloque/index.html?formacion=combinada&escenario=asculo&bando=' + bando + '&nivel=normal&semilla=3'); await listo();
    const propia = bando === 'pirro' ? 'Bajar picas' : 'Testudo';
    await examina(`Ásculo, ${bando}, «Todos» (${o})`, page, propia, { muestras: 3, accion: async k => { if (k === 1) await salta('lucha'); } });
    /* elegir otro cuerpo: solo cambia la propia (los tiradores: «Tirar») */
    /* con el dedo; si Playwright no recibe el acuse (render por software, la escena repinta sin parar), el toque va por el DOM */
    await page.locator('#tira .ficha[data-id="tiradores"]').tap({ force: true, timeout: 20000 }).catch(() => page.evaluate(() => document.querySelector('#tira .ficha[data-id="tiradores"]').click())); await esp(800);
    await examina(`Ásculo, ${bando}, tiradores elegidos (${o})`, page, 'Tirar', { muestras: 2 });
    await foto(page, 'asculo-' + bando + '-' + o);
    /* el oficial baja también en Ásculo; y cada etiqueta, de su lado del choque y con su dueño */
    await page.evaluate(() => document.querySelector('#tira .ficha[data-id="todos"]').click()); await oficial(`Ásculo, ${bando} (${o})`);
    await examina(`Ásculo, ${bando}, vista del oficial (${o})`, page, propia, { muestras: 1 });
    const lado = await page.evaluate(() => { const S = window.__bloque.S, mal = []; const E = [...document.querySelectorAll('#ests .est')].filter(e => e.style.visibility !== 'hidden' && e.style.display !== 'none' && e.dataset.b !== undefined);
      for (const a of E) for (const b of E) { const A = S.bloques[+a.dataset.b], B = S.bloques[+b.dataset.b]; if (!A || !B || A.bando !== 'r' || B.bando === 'r' || !(A.contactos || []).some(c => c.b === B)) continue; if (a.getBoundingClientRect().bottom < b.getBoundingClientRect().bottom - 2) mal.push((a.querySelector('b') || a).textContent); }
      return mal; });
    bien(!lado.length, `Ásculo, ${bando} (${o}): trabados, cada etiqueta tuya queda de tu lado del choque${lado.length ? ' — ' + lado.join(', ') : ''}`);
    await foto(page, 'asculo-' + bando + '-oficial-' + o);
    if (o === 'v') await final(`Ásculo, ${bando}`, 'asculo-' + bando + '-fin-v');
  }
}

/* ---- 4 · batalla grande desde Escaramuzas, en vivo; y 5 · «Bajar a pie» ---- */
if (quiere('grande')) {
  console.log('4 · Batalla grande en vivo y «Bajar a pie»');
  for (const [o, w, h] of ORIENT) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE); await page.waitForSelector('#menu .mesc', { timeout: 60000 }); await page.click('#menu .mesc'); await esp(800);
    await page.setViewportSize({ width: w, height: h }); await esp(300);
    await page.click('[data-act="escempieza"]'); await page.waitForSelector('#br-el [data-k="vivo"]', { timeout: 20000 }).then(() => page.evaluate(() => document.querySelector('#br-el [data-k="vivo"]').click())).catch(() => {});
    await page.waitForFunction(() => window.__mn && window.__mn.lista === true, null, { timeout: 180000 });
    await page.evaluate(() => window.__mn.pausa(false)); await page.waitForFunction(() => window.__mn.cine() !== 'apertura', null, { timeout: 60000 }).catch(() => {});
    const sinNada = await page.evaluate(() => [...document.querySelectorAll('#mn-ordenes .orden')].every(b => b.classList.contains('apagada')));
    bien(sinNada, `batalla grande (${o}): sin manípulo elegido la barra está, apagada en su sitio`);
    const id = await page.evaluate(() => { const u = window.__mn.S.man.find(u => u.lado === 0 && u.tropa === 'hastati') || window.__mn.S.man.find(u => u.lado === 0); window.__mn.elegir([u.id]); return u.id; });
    await examina('batalla grande en vivo (' + o + ')', page, 'Formar…', { muestras: 4, cada: 2000, accion: async k => { if (k === 2) await page.evaluate(() => window.__mn.salta(20)); } });
    const ficha = await page.evaluate(() => [...document.querySelectorAll('#mn-ficha-b button')].map(b => b.textContent));
    bien(ficha.includes('Bajar a pie') && !(await page.evaluate(() => /Bajar|tribuno/.test(document.getElementById('mn-ordenes').textContent))), `«Bajar a pie» y «Al tribuno» van en la ficha, fuera de la barra (${ficha.join(', ')})`);
    /* «Formar…» abre las formas encima, sin cambiar la barra */
    await page.evaluate(() => document.querySelector('#mn-ordenes .orden[data-h="propia"]').click()); await esp(600);
    const fm = await page.evaluate(() => ({ n: document.querySelectorAll('#mn-formas .mn-f').length, t: [...document.querySelectorAll('#mn-ordenes .orden b')].map(b => b.textContent).join(' · ') }));
    bien(fm.n >= 2 && fm.t === ['Formar…', ...FIJAS].join(' · '), `«Formar…» abre ${fm.n} formas encima y la barra no cambia (${fm.t})`);
    /* 1 · el juez pilla el montón: sin despejar (como en el examen) hay pares amontonados; despejado, ninguno */
    await page.evaluate(() => window.__mn.amontona(true)); await esp(1500);
    const antes = await page.evaluate(MIRA);
    await page.evaluate(() => window.__mn.amontona(false)); await esp(1500);
    const despues = await page.evaluate(MIRA);
    bien(antes.monton > 0 && despues.monton === 0, `batalla grande (${o}): sin despejar el juez ve ${antes.monton} pares de estandartes amontonados; despejado, ${despues.monton}`);
    await foto(page, 'grande-' + o);
    await page.evaluate(() => document.querySelector('#mn-formas [data-volver]') && document.querySelector('#mn-formas [data-volver]').click());
    /* 5 · «Bajar a pie»: la misma barra dentro de la capa */
    await page.evaluate(() => window.__mn.elegir([window.__mn.estado().sel[0]]));
    const no = await page.evaluate(i => window.__mn.bajar(i), id);
    if (no) { bien(false, '«Bajar a pie» no baja: ' + no); continue; }
    await page.waitForFunction(() => { const a = window.__mn.apie(); return a && a.lista; }, null, { timeout: 180000 }); await esp(2000);
    const capa = page.frames().find(f => /maquetas\/bloque/.test(f.url()));
    await examina('«Bajar a pie» (' + o + ')', capa, 'Testudo', { muestras: 3, accion: async k => { if (k === 1) await page.evaluate(() => window.__mn.frente({ x: -10, z: -14 }, { x: 12, z: -20 })); } });
    await foto(page, 'bajar-' + o);
    /* 7 · a pie, el rival con su soldado y sus colores (el que dice la batalla grande), y su nombre */
    const sol = await capa.evaluate(async () => { const m = await import('/gobierno/maquetas/bloque/soldados.js'); const P = JSON.parse(new URLSearchParams(location.search).get('lp7')); return { plan: P.g ? P.g.modelo : null, g: m.SOLDADOS.g.galos[0], rival: P.rival && P.rival.Los, obj: document.getElementById('marcha').textContent }; });
    bien(sol.plan ? sol.g === sol.plan : /^galo/.test(sol.g), `«Bajar a pie» (${o}): el rival «${sol.rival}» sale con su soldado (${sol.g}${sol.plan ? ', pedido ' + sol.plan : ''}) y se nombra («${sol.obj}»)`);
  }
}

console.log('\n' + (fallos.length ? 'NO APTO' : 'APTO') + ' · ' + bienes + ' bien, ' + fallos.length + ' mal');
for (const f of fallos) console.log('  · ' + f);
await br.close(); srv.close();
process.exit(fallos.length ? 1 : 0);
