#!/usr/bin/env node
/* AQVILA — CM6 (usuario 25/11, «1A»): prueba del cuadro en cuatro pestañas (Para ti · Ahora · Tu móvil · Más) en un móvil
   simulado (390×844, claro y oscuro), con una base de datos de mentira. Comprueba que cada botón que escribe sigue escribiendo
   (respuesta, pedido, idea, encargo, mejora, arte, juicio, subir), que los enlaces viejos (#juego, #taller, #arte-soldado…)
   llevan a su sitio, que no hay desplazamiento horizontal, botones ≥ 44 px, ni errores; deja capturas CM6-final-*.jpg.
   Uso:  node gobierno/cuadro.mjs && node gobierno/captura-cm6.mjs   (sale con 1 si algo falla) */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';

const AQUI = dirname(fileURLToPath(import.meta.url)), SAL = join(AQUI, 'capturas-tarea');
const { chromium } = createRequire(import.meta.url)('playwright');
/* base de datos de mentira con la misma forma que usa la página (copiada de captura-cm3.mjs, con «juicio») */
const SIMULA = `<script>
(function () {
  var datos = { pedidos: {}, estado: {}, juicio: {}, sesiones: {
    s1: { titulo: 'Corazón · FI4 Física en las escaramuzas y en la batalla de campaña (Opus)', estado: 'trabajando', hace: 'pasa el juez de su área', actualizado: new Date().toISOString(), url: '#' },
    s2: { titulo: 'Cerebro · CDe3 Pantalla de ciudad mínima y economía nueva al juego', estado: 'trabajando', hace: 'mira las capturas de la ciudad', area: 'cerebro', actualizado: new Date().toISOString(), url: '#' },
    s3: { titulo: 'Gobierno · CM3 Cuadro: apartados «Arte» y «Equipos»', estado: 'trabajando', hace: 'prueba los botones nuevos', area: 'gobierno', tarea: 'CM3', actualizado: new Date().toISOString(), url: '#' },
    s4: { titulo: 'AQVILA · Combate · CB1 motor de lucha', estado: 'esperando', hace: 'pregunta si abre CB2', actualizado: new Date().toISOString(), url: '#' },
    s5: { titulo: 'Taller · CR4 Maqueta de luz: amanecer y atardecer con el turno', estado: 'terminada', hace: 'ha acabado', area: 'arte', actualizado: new Date().toISOString(), url: '#' } } };
  var oyentes = {}, n = 0;
  function foto(c) { return { metadata: { fromCache: false }, docs: Object.keys(datos[c] || {}).map(function (id) { var d = datos[c][id]; return { id: id, data: function () { return d; } }; }) }; }
  function avisa(c) { (oyentes[c] || []).forEach(function (f) { f(foto(c)); }); }
  function col(c) { datos[c] = datos[c] || {};
    return { doc: function (id) { id = id || 'auto-' + (++n);
        return { id: id, set: function (v) { datos[c][id] = v; avisa(c); return Promise.resolve(); },
          update: function (v) { if (!datos[c][id]) return Promise.reject(new Error('no existe')); Object.assign(datos[c][id], v); avisa(c); return Promise.resolve(); },
          delete: function () { delete datos[c][id]; avisa(c); return Promise.resolve(); } }; },
      onSnapshot: function (f) { (oyentes[c] = oyentes[c] || []).push(f); setTimeout(function () { f(foto(c)); }, 30); return function () { }; } }; }
  window.__datos = datos;
  window.claude = { use: function (q) { return Promise.resolve(q === 'db' ? { collection: col } : null); } };
})();
</script>`;
const cuerpo = await readFile(join(AQUI, 'cuadro.html'), 'utf8');
const pagina = join(tmpdir(), 'cm6-cuadro-prueba.html');
await writeFile(pagina, '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style>' + SIMULA + '</head><body>' + cuerpo + '</body></html>');
await mkdir(SAL, { recursive: true });

const fallos = [], bien = [];
const mira = (ok, que) => { (ok ? bien : fallos).push(que); console.log((ok ? 'bien ' : 'MAL ') + que); };
const b = await chromium.launch();
try {
  for (const tema of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: tema === 'light' ? 2 : 1, colorScheme: tema, hasTouch: true, isMobile: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errores.push(m.text()); });
    const T = tema === 'light' ? 'claro' : 'oscuro', foto = n => p.screenshot({ path: join(SAL, 'CM6-final-' + n + '.jpg'), type: 'jpeg', quality: 72 });
    const ir = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(350); };
    const vista = () => p.evaluate(() => (document.querySelector('[data-vista]:not([hidden])') || {}).id);
    const ancho = async donde => mira(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth), T + ' · ' + donde + ': sin desplazamiento horizontal');
    const bajos = async (sel, donde) => { const m = await p.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent && e.getBoundingClientRect().height < 43.5).map(e => e.textContent.trim().slice(0, 24)), sel);
      mira(!m.length, T + ' · ' + donde + ': botones de 44 px o más' + (m.length ? ' (bajos: ' + m.slice(0, 4).join(' | ') + ')' : '')); };
    const ped = () => p.evaluate(() => Object.values(window.__datos.pedidos));
    await p.goto(pathToFileURL(pagina).href); await p.waitForTimeout(900);

    // pestañas y enlaces viejos
    mira(await p.locator('.pestanas a').count() === 4, T + ' · cuatro pestañas');
    mira(await vista() === 'parati', T + ' · abre en «Para ti»');
    for (const [h, v] of [['#ahora', 'ahora'], ['#movil', 'movil'], ['#mas', 'mas'], ['#juego', 'parati'], ['#decidir', 'parati'], ['#taller', 'ahora'], ['#equipos', 'ahora'], ['#lista', 'mas'], ['#arte', 'mas']]) {
      await ir(h); mira(await vista() === v, T + ' · ' + h + ' lleva a «' + v + '»'); }
    await ir('#arte-soldado');
    mira(await vista() === 'mas' && await p.evaluate(() => document.getElementById('arte').open), T + ' · #arte-soldado abre «Más» con el arte desplegado');
    const nb = await p.evaluate(() => document.querySelectorAll('button').length);
    mira(nb < 450, T + ' · ' + nb + ' botones en toda la página (antes, 1.613)');
    mira(await p.evaluate(() => ![...document.querySelectorAll('button')].some(x => /Dar prioridad|Quitar la pausa|Dejar en pausa|Abrir sesión/.test(x.textContent))), T + ' · sin «Dar prioridad», «Abrir sesión» ni botones de pausa');

    // Para ti
    await ir('#parati'); await ancho('Para ti'); await bajos('#parati .boton:not(.fino), .pestanas a', 'Para ti');
    if (tema === 'light') await foto('1-parati');
    await p.fill('#pide-texto', 'Que los barcos se vean en el puerto'); await p.click('#pide-enviar'); await p.waitForTimeout(250);
    await p.click('[data-pide-tipo="nevera"]'); await p.fill('#pide-texto', 'Juegos en el circo'); await p.click('#pide-enviar'); await p.waitForTimeout(250);
    let P = await ped();
    mira(P.some(x => x.tipo === 'nuevo' && /barcos/.test(x.texto)) && P.some(x => x.tipo === 'nevera' && /circo/.test(x.texto)), T + ' · «Pide algo» guarda un pedido y una idea a la nevera');
    mira(await p.evaluate(() => !document.querySelector('[data-porap]').hidden && /2 cosas/.test(document.getElementById('porap-t').textContent)), T + ' · sale el aviso del vigía con 2 cosas sin aplicar');
    mira(await p.evaluate(() => document.querySelectorAll('[data-llamar]').length === 1), T + ' · «Llamar al vigía ahora» está en un solo sitio');
    const badge = await p.evaluate(() => { const n = document.getElementById('tab-n-parati'); return n.hidden ? 0 : +n.textContent; });
    mira(badge >= 2, T + ' · la pestaña «Para ti» cuenta lo pendiente (' + badge + ')');
    await p.locator('#parati details.plegable summary').first().click();
    const jb = p.locator('[data-juzgar="bien"]').first(); await jb.click(); await p.waitForTimeout(250);
    mira(await p.evaluate(() => Object.values(window.__datos.juicio).some(x => x.veredicto === 'bien')), T + ' · «Bien» en «Juzgar la 1.0» se guarda');
    const resp = p.locator('#decidir [data-pedir="respuesta"]');
    if (await resp.count()) { const btn = resp.first(), caja = await btn.getAttribute('data-texto');
      if (caja) { await p.locator('#decidir [data-abrir]').first().click(); await p.fill('#' + caja, 'Sí, adelante'); }
      await btn.click(); await p.waitForTimeout(250); P = await ped(); mira(P.some(x => x.tipo === 'respuesta'), T + ' · responder una pregunta se guarda'); }

    // Ahora
    await ir('#ahora'); await p.waitForTimeout(200); await ancho('Ahora'); await bajos('#ahora .boton:not(.fino)', 'Ahora');
    mira(await p.locator('#sesiones li').count() === 5, T + ' · «Trabajando ahora» pinta las 5 sesiones vivas');
    if (tema === 'light') { await p.waitForTimeout(3600); await foto('2-ahora'); }
    const enc = p.locator('#ahora [data-pedir="abrir"]');
    if (await enc.count()) { const ref = await enc.first().getAttribute('data-ref'); await enc.first().click(); await p.waitForTimeout(250); P = await ped();
      mira(P.some(x => x.tipo === 'abrir' && x.ref === ref), T + ' · «Encárgala» de la meta guarda el encargo de ' + ref); }
    else mira(true, T + ' · la meta no tiene tareas sin empezar');
    await p.click('[data-mejora-eq="fisicas"]'); await p.fill('#mejora-texto', 'Que los escudos se oigan'); await p.click('#mejora-enviar'); await p.waitForTimeout(250); P = await ped();
    mira(P.some(x => x.tipo === 'mejora' && x.ref === 'fisicas' && /escudos/.test(x.texto)), T + ' · «Recomendar mejora» con el equipo elegido (fisicas)');

    // Tu móvil
    await ir('#movil'); await ancho('Tu móvil'); await bajos('#movil .mcabeza .boton', 'Tu móvil');
    await p.click('[data-subir-abrir]'); await p.waitForTimeout(150);
    mira(await p.evaluate(() => !document.getElementById('subir-ok').hidden), T + ' · «Subir lo terminado a mi móvil» pide confirmación');
    if (tema === 'light') await foto('3-movil');

    // Más
    await ir('#mas'); await ancho('Más');
    await p.evaluate(() => document.querySelectorAll('#mas details').forEach(d => { d.open = false; })); await p.waitForTimeout(3600);
    if (tema === 'light') await foto('4-mas');
    await ir('#arte-soldado'); if (!await p.locator('[data-marca="soldado:galo-grande"] [data-hoja]').isVisible()) await p.locator('#arte-soldado [data-vermas]').click();
    await p.locator('[data-marca="soldado:galo-grande"] [data-hoja]').click(); await p.waitForTimeout(250);
    await p.fill('#hoja-texto', 'Torques de oro'); await p.click('#hoja-enviar'); await p.waitForTimeout(300); P = await ped();
    mira(P.some(x => x.tipo === 'arte' && x.ref === 'soldado:galo-grande'), T + ' · «Pedir cambio» del arte se guarda');
    await ir('#tus-pedidos');
    mira(await p.evaluate(() => document.getElementById('tus-pedidos').open && document.querySelectorAll('#pedidos li.ficha').length >= 5), T + ' · «Tus pedidos» lista lo pulsado');
    await ir('#archivo');
    const arch = await p.evaluate(() => { const t = document.querySelector('#pendiente > .tarea'); return t ? [...t.querySelectorAll('button')].map(x => x.textContent) : ['(vacío)']; });
    mira(arch.length === 1 && arch[0] === 'Encárgala' || arch[0] === '(vacío)', T + ' · en el tablero, un solo botón por tarea («' + arch.join(', ') + '»)');
    await p.fill('#buscar', 'zzzz-nada'); await p.waitForTimeout(100);
    mira(await p.evaluate(() => /Se ven 0/.test(document.getElementById('vistas').textContent)), T + ' · el buscador del tablero filtra');
    mira(!errores.length, T + ' · sin errores de consola' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
    await p.close();
  }
} finally { await b.close(); }
console.log(fallos.length ? 'CM6: NO APTO · ' + fallos.length + ' fallos' : 'CM6: APTO · ' + bien.length + ' comprobaciones');
process.exit(fallos.length ? 1 : 0);
