// Maqueta Q1: interfaz nueva de ciudad, gobierno y economía SOBRE la ciudad 3D real. No toca el juego.
// Uso: node gobierno/maquetas/ciudad-nueva.mjs  ->  gobierno/capturas-tarea/Q1-{1..4}-*.jpg
import { createRequire } from 'module';
import { createServer } from 'http';
import { readFile, mkdir } from 'fs/promises';
import { join, extname, normalize, dirname } from 'path';
import { fileURLToPath } from 'url';
const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, '..', '..'), SALIDA = join(RAIZ, 'gobierno', 'capturas-tarea');
const { chromium } = createRequire(join(RAIZ, 'x.js'))('playwright');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

// ---- iconos de línea 24x24 propios ----
const P = {
  madera: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v11c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M9.5 6.2c1-.5 4-.5 5 0"/>',
  piedra: '<path d="M3 10l9-5 9 5v9H3z"/><path d="M3 10l9 5 9-5M12 15v4"/>',
  hierro: '<path d="M3 15l3-6h12l3 6z"/><path d="M6 9l-2-3h16l-2 3M3 15v3h18v-3"/>',
  grano: '<path d="M12 21V8"/><path d="M12 8c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4zM12 14c-3 0-4-2-4-4 3 0 4 2 4 4zm0 0c3 0 4-2 4-4-3 0-4 2-4 4z"/>',
  oro: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path d="M10 9.5v5M10 9.5h2.2a1.6 1.6 0 010 3H10"/>',
  agua: '<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 01-12 0c0-3.5 2.5-6.5 6-11z"/><path d="M9 15a3 3 0 003 3"/>',
  comida: '<path d="M4 15c0-4 3.5-7 8-7s8 3 8 7v2H4z"/><path d="M8.5 11l1 3M13 10.5l.5 3.5M16.5 11.5l.5 2.5"/>',
  templo: '<path d="M3 9l9-5 9 5zM5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18"/>',
  ocio: '<path d="M4 9c0-3 3.5-4 8-4s8 1 8 4c0 5-3 9-8 9s-8-4-8-9z"/><path d="M8.5 9.5l2 1M15.5 9.5l-2 1M9 14c1.8 1.6 4.2 1.6 6 0"/>',
  termas: '<path d="M3 9c3-2 6 2 9 0s6 2 9 0M3 14c3-2 6 2 9 0s6 2 9 0M3 19c3-2 6 2 9 0s6 2 9 0"/>',
  obras: '<path d="M14 4l6 6-2 2-6-6z"/><path d="M13 7L4 16l-1 5 5-1 9-9"/>',
  cuentas: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  senado: '<path d="M3 20h18M5 20v-9M9.5 20v-9M14.5 20v-9M19 20v-9M3 11l9-6 9 6z"/>',
  foro: '<path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6"/>',
  casa: '<path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5"/>',
  cuartel: '<path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z"/><path d="M9 11h6M12 8v7"/>',
  almacen: '<path d="M3 9l9-5 9 5v11H3z"/><path d="M8 20v-7h8v7M8 16.5h8"/>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
  aviso: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  gente: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
  toga: '<circle cx="12" cy="6" r="3"/><path d="M8 21l1-9c1-2 5-2 6 0l1 9M9 12l6 8"/>',
  plebe: '<circle cx="9" cy="7" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-4 2.5-6 6-6s6 2 6 6M15 20c0-2.6 1-4 3.5-4s2.5 1.5 2.5 4"/>',
  cadena: '<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><path d="M11 12h2"/>',
  pan: '<path d="M4 14c0-4 3.5-7 8-7s8 3 8 7v2H4z"/><path d="M9 11l1 3M14 11l.5 3"/>',
  juegos: '<ellipse cx="12" cy="12" rx="9" ry="5.5"/><path d="M7 12h10M12 6.5v11"/>',
  tierra: '<path d="M3 18c4-3 8-3 18 0M3 13c4-3 8-3 18 0M5 8c4-2 7-2 14 0"/>',
  sube: '<path d="M12 20V6M6 12l6-6 6 6"/>',
  baja: '<path d="M12 4v14M6 12l6 6 6-6"/>',
  acueducto: '<path d="M2 8h20M4 8v12M10 8v12M16 8v12M22 8v12M4 20c0-4 6-4 6 0M10 20c0-4 6-4 6 0"/>',
  copa: '<path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 20h8"/>',
};
const ic = (n, cl = '') => `<svg class="i ${cl}" viewBox="0 0 24 24">${P[n]}</svg>`;

// ---- servidor mínimo ----
function servidor() {
  return new Promise(ok => {
    const s = createServer(async (req, res) => {
      try {
        let r = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
        if (r === '' || r.endsWith('/')) r += 'index.html';
        if (r.startsWith('..')) throw new Error('fuera');
        const d = await readFile(join(RAIZ, r));
        res.writeHead(200, { 'Content-Type': TIPOS[extname(r)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(d);
      } catch (e) { res.writeHead(404); res.end('no encontrado'); }
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

const sg = n => (n >= 0 ? '+' : '−') + Math.abs(Math.round(n));
const MAT = ['madera', 'piedra', 'hierro', 'grano', 'oro'];
const NOM = { madera: 'Madera', piedra: 'Piedra', hierro: 'Hierro', grano: 'Grano', oro: 'Oro' };

// ---- cifras: reales del juego (G.prod, G.cap) y, marcado, inventadas ----
function cifras(g) {
  const p = g.p, cap = g.cap, pop = g.pop;
  const imp = pop * 0.03 * (g.imp === 'bajo' ? 0.7 : g.imp === 'alto' ? 1.4 : 1);   // real: impuestos de Roma
  const oroBruto = p.oro + p.mant.total;                                             // real
  const foro = oroBruto - imp - p.rutas;                                             // real: foro y comercio (resto)
  const upGrano = p.upkeep, puebloGrano = pop * 0.02;                                // real
  const granoBruto = p.grano + upGrano + puebloGrano;
  // INVENTADO: compromisos de obras y reclutamiento; existencias de mitad de partida
  const m = {
    madera: { entra: p.madera, obras: 0, tropas: 0, mant: 0, stock: cap - 60 },
    piedra: { entra: p.piedra, obras: 85, tropas: 0, mant: 0, stock: 940 },
    hierro: { entra: p.hierro, obras: 20, tropas: 60, mant: 0, stock: 1210 },
    grano: { entra: granoBruto, obras: 0, tropas: upGrano, mant: puebloGrano, stock: 1180 },
  };
  for (const k in m) { const x = m[k]; x.comp = x.obras + x.tropas + x.mant; x.queda = x.entra - x.comp; x.cabe = Math.max(0, cap - x.stock); x.alm = Math.min(x.queda, x.cabe); x.pierde = Math.max(0, x.queda - x.cabe); }
  const gastosObras = 12;   // INVENTADO
  const oro = { imp, foro, rutas: p.rutas, edif: p.mant.edificios, trop: p.mant.tropas, obras: gastosObras, saldo: oroBruto - p.mant.total - gastosObras };
  return { m, oro, cap, pop };
}

function html(c, g) {
  const { m, oro, cap } = c;
  const top = `<div class="top"><h1 class="cz">Roma · Martius 264 a.C.<span>nivel 2 de 4</span></h1><div class="rec">${
    MAT.map(k => { const v = k === 'oro' ? oro.saldo : m[k].queda; return `<div><span class="r1">${ic(k)}<b>${Math.round(g.res[k] > 0 && k !== 'oro' ? m[k].stock : g.res.oro + 85)}</b></span><small class="${v >= 0 ? 'pos' : 'neg'}">${sg(v)}</small></div>`; }).join('')}</div></div>`;
  const barrio = `<div class="ficha barrio"><div class="l1"><span class="cz" style="font-size:15px;color:var(--oro)">Barrio · nivel 2 de 4</span><span>${Math.round(g.pop)} habitantes</span></div>
    <div class="serv">${[['agua', 'Agua', 0], ['comida', 'Comida', 1], ['templo', 'Templo', 1], ['ocio', 'Ocio', 1], ['termas', 'Termas', 0]].map(([i, n, h]) => `<div class="${h ? 'si' : 'no'}"><i>${ic(i)}</i>${n}</div>`).join('')}</div>
    <div class="falta">${ic('acueducto')}<span>Para nivel 3: falta <b>agua</b> (acueducto)</span></div></div>`;
  const btns = on => `<div class="btns">${[['obras', 'Obras'], ['cuentas', 'Cuentas'], ['senado', 'Senado']].map(([i, n]) => `<div class="${on === i ? 'on' : ''}"><i>${ic(i)}</i>${n}</div>`).join('')}</div>`;
  const med = (x, y, i, nv, al) => `<div class="med ${al ? 'alerta' : ''}" style="left:${x}px;top:${y}px">${ic(i)}<b>${nv}</b></div>`;
  const medallas = [med(...g.pos.foro, 'foro', 'II', 0), med(...g.pos.casa, 'casa', 'II', 0), med(...g.pos.cuartel, 'cuartel', 'I', 0), med(...g.pos.almacen, 'almacen', 'I', 1)].join('');

  // 2 cuentas
  const fila = k => { const x = m[k], t = x.entra; const wc = x.comp / t * 100, wq = x.queda / t * 100;
    return `<div class="mrow">${ic(k)}<div><div class="n"><b>${NOM[k]} <span>entra ${Math.round(t)}</span></b><span>compr. ${Math.round(x.comp)}</span></div><div class="bar"><i class="c" style="width:${wc}%"></i><i class="q" style="width:${wq}%"></i></div></div>
    <div class="a"><b class="pos">${sg(x.queda)}</b><small>al almacén ${Math.round(x.alm)}</small></div>${x.pierde ? `<div class="w">${ic('aviso')}<span>${NOM[k]}: sobran ${Math.round(x.queda)}, caben ${Math.round(x.cabe)}, <b class="neg">se pierden ${Math.round(x.pierde)}</b></span></div>` : ''}</div>`; };
  const cuentas = `<div class="ficha cuentas"><h2 class="cz">Cuentas de Martius<span class="x">${ic('cerrar')}</span></h2>
    <div style="display:flex;justify-content:space-between;align-items:center;margin:-2px 0 2px"><span style="font-size:12px;color:var(--bronce);font-family:Cinzel,serif;font-weight:700;letter-spacing:.1em">MATERIALES</span><span class="tasa"><span class="chip">Impuestos</span><span class="chip">bajo</span><span class="chip on">normal</span><span class="chip">alto</span></span></div>
    ${['madera', 'piedra', 'hierro', 'grano'].map(fila).join('')}
    <div class="sec"><span>Oro</span><span style="letter-spacing:0;font:400 12px system-ui;color:var(--piedra)">${ic('oro').replace('class="i "', 'class="i" style="width:14px;height:14px;vertical-align:-3px"')}</span></div>
    <div class="oro2"><div><div class="ln"><span>Impuestos</span><b class="pos">+${oro.imp.toFixed(1)}</b></div><div class="ln"><span>Foro y comercio</span><b class="pos">+${oro.foro.toFixed(1)}</b></div><div class="ln"><span>Rutas · puerto</span><b>${oro.rutas ? '+' + oro.rutas : '0'}</b></div></div>
    <div><div class="ln"><span>Edificios</span><b class="neg">−${oro.edif.toFixed(1)}</b></div><div class="ln"><span>Legiones</span><b class="neg">−${oro.trop.toFixed(1)}</b></div><div class="ln"><span>Obras</span><b class="neg">−${oro.obras}</b></div></div></div>
    <div class="tot"><span>Saldo del mes</span><b>${sg(oro.saldo).replace('+', '+ ')}${oro.saldo >= 0 ? '' : ''}</b></div></div>`;

  // 3 senado
  const senado = `<div class="ficha senado"><h2 class="cz">Senado y pueblo<span class="x">${ic('cerrar')}</span></h2>
    <div class="fav"><span>Senado</span><div class="bar"><i class="v" style="width:62%"></i></div><b>62</b></div>
    <div class="fav"><span>Pueblo</span><div class="bar"><i class="q" style="width:48%"></i></div><b>48</b></div>
    <div class="sec"><span>Clases</span><span style="letter-spacing:0;font:400 12px system-ui;color:var(--piedra)">ánimo · piden</span></div>
    ${[['toga', 'Ciudadanos', Math.round(g.pop * 0.18), 'Contentos', 'pos', 'sube', 'juegos', 'Juegos'], ['plebe', 'Plebeyos', Math.round(g.pop * 0.52), 'Inquietos', 'neg', 'baja', 'pan', 'Pan'], ['cadena', 'Esclavos', Math.round(g.pop * 0.30), 'Resignados', '', 'tierra', 'tierra', 'Tierras']].map(([i, n, num, an, cl, , pi, pt]) => `<div class="clase">${ic(i)}<div class="n"><b>${n}</b><small>${num}</small></div><span class="cara ${cl}">${an}</span><div class="pide">Piden ${ic(pi).replace('class="i "', 'class="i" style="width:16px;height:16px"')} <b style="color:var(--marmol);font-weight:600">${pt}</b></div></div>`).join('')}
    <div class="sec"><span>Misión del Senado</span></div>
    <div class="mis">Construye un acueducto antes de Iunius<div class="pl"><span>Plazo: 3 meses</span><b>premio 200 oro · +10 favor</b></div></div>
    <div class="sec"><span>Decisión</span></div>
    <div class="dec"><b style="font-size:14px">Repartir grano al pueblo</b><div class="chips"><span class="chip v">Plebeyos +8</span><span class="chip r">Ciudadanos −3</span><span class="chip r">${ic('grano').replace('class="i "', 'class="i" style="width:14px;height:14px"')} −150 grano</span></div><div class="acc"><div class="btn">Ahora no</div><div class="btn p">Repartir grano</div></div></div></div>`;

  // 4 fin de mes
  const ff = k => { const x = m[k], tot = x.stock + x.alm, w = Math.min(100, tot / cap * 100), w0 = x.stock / cap * 100;
    return `<div class="frow">${ic(k)}<span>${NOM[k]}</span><div class="bar ${tot >= cap - 1 ? 'tope' : ''}"><i class="c" style="width:${w0}%"></i><i class="q" style="width:${w - w0}%"></i></div><div class="t"><b class="pos">${sg(x.alm)}</b>${x.pierde ? `<span class="neg">pierdes ${Math.round(x.pierde)}</span>` : '<span style="color:var(--piedra)">cabe todo</span>'}</div></div>`; };
  const fin = `<div class="ficha fin"><h2 class="cz">Cierra Martius</h2><div class="sub">Lo que sobra entra al almacén · tope ${cap}</div>
    ${['madera', 'piedra', 'hierro', 'grano'].map(ff).join('')}
    <div class="tot"><span>${ic('oro').replace('class="i "', 'class="i" style="width:18px;height:18px;vertical-align:-4px;color:var(--bronce)"')} Saldo de oro</span><b>+ ${oro.saldo.toFixed(0)}</b></div>
    <div class="ev">${ic('sube')}<span>El barrio del Foro sube a <b>nivel 2</b>: ya tiene comida y templo.</span></div>
    <div class="btn p" style="margin-top:12px;height:44px;font:700 14px Cinzel,Georgia,serif;letter-spacing:.08em">Abrir Aprilis</div></div>`;
  return { top, barrio, btns, medallas, cuentas, senado, fin };
}

async function main() {
  await mkdir(SALIDA, { recursive: true });
  const srv = await servidor(), url = 'http://127.0.0.1:' + srv.address().port + '/';
  const css = await readFile(join(AQUI, 'ciudad-nueva.css'), 'utf8');
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage(); const errores = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message.slice(0, 200)));
  try {
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('#menu [data-act="new"]', { timeout: 30000 });
    await page.waitForFunction(() => window.UI && window.UI.cityV, null, { timeout: 90000 });
    await page.waitForTimeout(1500);
    await page.click('#menu [data-act="new"]'); await page.waitForTimeout(2500);
    for (let i = 0; i < 12; i++) { const b = page.locator('#modal:not([hidden]) [data-act="close"]').first(); if (!(await b.count())) break; await b.click(); await page.waitForTimeout(120); }
    await page.waitForTimeout(10000);   // modelos
    const g = await page.evaluate(() => { const s = Game.state, c = s.cities.roma; return { p: Game.prod(), cap: Game.cap(), res: s.res, pop: c.pop, imp: c.imp, b: c.b }; });
    console.log('Cifras reales de Roma al mes:', JSON.stringify({ madera: g.p.madera, piedra: g.p.piedra, hierro: g.p.hierro, grano: g.p.grano, oro: g.p.oro.toFixed(1), mant: g.p.mant, tope: g.cap, pop: g.pop }));
    g.pos = JSON.parse(process.env.POS || '{"foro":[110,330],"casa":[270,380],"cuartel":[80,450],"almacen":[300,300]}');
    const c = cifras(g), h = html(c, g);
    const corte = css.indexOf('#mq{');   // antes: fuentes y ocultar el juego (documento); después: la maqueta (sombra, aislada del CSS del juego)
    await page.addStyleTag({ content: css.slice(0, corte) });
    await page.evaluate(cs => { const h = document.createElement('div'); h.style.cssText = 'position:fixed;inset:0;z-index:50;pointer-events:none'; document.body.appendChild(h); const r = h.attachShadow({ mode: 'open' }); r.innerHTML = '<style>' + cs + '</style><div id="mq"></div>'; window.__mq = r; }, css.slice(corte));
    const pon = async (clase, inner, nombre) => {
      await page.evaluate(([cl, ih]) => { const d = window.__mq.getElementById('mq'); d.className = cl; d.innerHTML = '<div class="vel"></div>' + ih; }, [clase, inner]);
      await page.evaluate(cl => { const w = document.getElementById('citywrap'); w.style.transform = /s2/.test(cl) ? 'translateY(-175px)' : /s3/.test(cl) ? 'translateY(-250px)' : /s4/.test(cl) ? 'translateY(110px)' : ''; }, clase);
      await page.waitForTimeout(900);
      await page.screenshot({ path: join(SALIDA, nombre), type: 'jpeg', quality: 82, timeout: 180000 });
      // los textos deben caber: nada se sale del ancho
      const mal = await page.evaluate(() => { const r = []; window.__mq.querySelectorAll('#mq *').forEach(e => { const b = e.getBoundingClientRect(); if (b.width && (b.right > 391 || b.left < -1)) r.push(e.className + ':' + Math.round(b.right)); if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).display !== 'inline' && e.clientWidth && !e.closest('svg')) r.push('desborda ' + (e.className.baseVal ?? e.className) + ' ' + e.scrollWidth + '>' + e.clientWidth); }); return r.slice(0, 6); });
      if (mal.length) console.log(nombre, 'REVISAR:', mal.join(' | '));
    };
    await pon('s1', h.top + h.medallas + h.barrio + h.btns(''), 'Q1-1-ciudad.jpg');
    await pon('s2 sube', h.top + h.cuentas, 'Q1-2-cuentas.jpg');
    await pon('s3 sube', h.top + h.senado, 'Q1-3-senado.jpg');
    await pon('s4', h.top + h.fin, 'Q1-4-fin-de-mes.jpg');
  } finally { await br.close(); srv.close(); }
  console.log(errores.length ? 'ERRORES DE CONSOLA:\n' + errores.join('\n') : 'Sin errores de consola. Capturas en ' + SALIDA);
}
main().catch(e => { console.error(e); process.exit(1); });
