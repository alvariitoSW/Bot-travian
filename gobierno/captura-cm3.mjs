#!/usr/bin/env node
/* AQVILA — CM3: prueba de los apartados «Arte» y «Equipos» del cuadro de mando en un móvil simulado (390×844, claro y oscuro).
   Uso:  node gobierno/cuadro.mjs && node gobierno/captura-cm3.mjs
   Abre gobierno/cuadro.html con una base de datos simulada (en memoria), pulsa «Pedir cambio» y «Recomendar mejora»,
   comprueba que el pedido se guarda con su tipo y su ref, que no hay desplazamiento horizontal y que los botones miden 44 px,
   y deja las capturas en gobierno/capturas-tarea/CM3-*.jpg. Sale con código 1 si algo falla. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';

const AQUI = dirname(fileURLToPath(import.meta.url)), SAL = join(AQUI, 'capturas-tarea');
const { chromium } = createRequire(import.meta.url)('playwright');
/* base de datos de mentira con la misma forma que usa la página: collection().doc().set/update/delete y onSnapshot */
const SIMULA = `<script>
(function () {
  var datos = { pedidos: {}, estado: {}, sesiones: {
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
const pagina = join(tmpdir(), 'cm3-cuadro-prueba.html');
await writeFile(pagina, '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}</style>' + SIMULA + '</head><body>' + cuerpo + '</body></html>');
await mkdir(SAL, { recursive: true });

const fallos = [], bien = [];
const mira = (ok, que) => { (ok ? bien : fallos).push(que); console.log((ok ? '✔ ' : '✘ ') + que); };
const b = await chromium.launch();
try {
  for (const tema of ['light', 'dark']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: tema, hasTouch: true, isMobile: true });
    const errores = []; p.on('pageerror', e => errores.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errores.push(m.text()); });
    const T = tema === 'light' ? 'claro' : 'oscuro', foto = n => p.screenshot({ path: join(SAL, 'CM3-' + n + '.jpg'), type: 'jpeg', quality: 80 });
    const ancho = async donde => mira(await p.evaluate(() => document.scrollingElement.scrollWidth <= innerWidth), T + ' · ' + donde + ': sin desplazamiento horizontal');
    const bajos = async sel => { const m = await p.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent && e.getBoundingClientRect().height < 43.5).map(e => e.textContent.trim().slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().height)), sel); mira(!m.length, T + ' · botones de 44 px en ' + sel + (m.length ? ' (bajos: ' + m.slice(0, 4).join('; ') + ')' : '')); };

    await p.goto(pathToFileURL(pagina).href + '#arte'); await p.waitForTimeout(700);
    mira(await p.evaluate(() => !document.getElementById('arte').hidden && document.getElementById('juego').hidden), T + ' · la pestaña Arte abre su vista');
    mira(await p.evaluate(() => [...document.querySelectorAll('#arte-soldado .pieza:not(.mas) img')].every(i => i.complete && i.naturalWidth === 240)), T + ' · las fotos del primer grupo cargan (240 px)');
    await ancho('Arte'); await bajos('#arte .boton, #arte .chip, .pestanas a');
    if (tema === 'light') await foto('1-arte');
    // «Ver más» despliega el grupo
    const antes = await p.locator('#arte-soldado .pieza:visible').count(); await p.locator('#arte-soldado [data-vermas]').click();
    mira(await p.locator('#arte-soldado .pieza:visible').count() > antes, T + ' · «Ver más» enseña el resto del grupo');
    // «Pedir cambio»: abre la hoja, no guarda vacío, guarda con texto
    await p.locator('[data-marca="soldado:galo-grande"] [data-hoja]').click(); await p.waitForTimeout(250);
    mira(await p.evaluate(() => document.getElementById('hoja').open), T + ' · «Pedir cambio» abre la hoja de escribir');
    await p.locator('#hoja-enviar').click(); await p.waitForTimeout(150);
    mira(await p.evaluate(() => Object.keys(window.__datos.pedidos).length === 0 && document.getElementById('hoja').open), T + ' · sin texto no guarda nada');
    await p.locator('#hoja-texto').fill('Que lleve torques de oro y el pelo más claro');
    if (tema === 'dark') await foto('2-pedir-cambio-oscuro');
    await p.locator('#hoja-enviar').click(); await p.waitForTimeout(350);
    let ped = await p.evaluate(() => Object.values(window.__datos.pedidos));
    mira(ped.length === 1 && ped[0].tipo === 'arte' && ped[0].ref === 'soldado:galo-grande' && ped[0].estado === 'pendiente' && /torques/.test(ped[0].texto) && !isNaN(Date.parse(ped[0].creado)), T + ' · el pedido de arte se guarda (tipo arte, ref soldado:galo-grande, texto, pendiente, creado)');
    mira(await p.evaluate(() => !document.getElementById('hoja').open && !!document.querySelector('[data-marca="soldado:galo-grande"] .estado.pedido')), T + ' · la hoja se cierra y la pieza queda marcada «pedido»');

    // Equipos
    await p.evaluate(() => { location.hash = '#equipos'; }); await p.waitForTimeout(400);
    mira(await p.locator('.equipo:visible').count() === 8, T + ' · se ven las 8 fichas de equipo');
    const vivo = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-eq-ahora]')].map(u => [u.dataset.eqAhora, u.querySelectorAll('li:not(.nota)').length])));
    mira(vivo.fisicas === 1 && vivo.ciudades === 1 && vivo.gobierno === 1 && vivo.batallas === 1 && vivo.arte === 0, T + ' · las sesiones vivas caen en su equipo (' + JSON.stringify(vivo) + ')');
    await ancho('Equipos'); await bajos('#equipos .boton, #equipos .chip');
    if (tema === 'light') { await p.waitForTimeout(3600); await foto('3-equipos'); }
    await p.locator('#eq-fisicas [data-hoja]').click(); await p.waitForTimeout(250);
    await p.locator('#hoja-texto').fill('Que los escudos se oigan y se muevan al recibir un pilum');
    await p.locator('#hoja-enviar').click(); await p.waitForTimeout(350);
    ped = await p.evaluate(() => Object.values(window.__datos.pedidos));
    const mej = ped.find(x => x.tipo === 'mejora');
    mira(ped.length === 2 && mej && mej.ref === 'fisicas' && mej.estado === 'pendiente' && /escudos/.test(mej.texto), T + ' · la mejora se guarda (tipo mejora, ref fisicas, texto, pendiente)');
    mira(await p.evaluate(() => !!document.querySelector('#eq-fisicas .estado.pedido')), T + ' · el equipo queda marcado «pedido»');
    await p.locator('#eq-fisicas').scrollIntoViewIfNeeded(); await p.evaluate(() => document.getElementById('eq-fisicas').scrollIntoView({ block: 'start' })); await p.waitForTimeout(3700);
    if (tema === 'dark') await foto('4-equipos-oscuro');
    // el pedido sale en «Tus pedidos» del Taller y se puede deshacer
    await p.evaluate(() => { location.hash = '#taller'; }); await p.waitForTimeout(300);
    mira(await p.locator('#pedidos li.ficha').count() === 2 && /Cambio de arte · «Galo grande»/.test(await p.locator('#pedidos').textContent()) && /Mejora · Físicas/.test(await p.locator('#pedidos').textContent()) , T + ' · los dos pedidos salen en «Tus pedidos» del Taller');
    await ancho('Taller');
    mira(!errores.length, T + ' · sin errores de consola' + (errores.length ? ': ' + errores.slice(0, 3).join(' | ') : ''));
    await p.close();
  }
} finally { await b.close(); }
console.log(fallos.length ? 'CM3: NO APTO · ' + fallos.length + ' fallos' : 'CM3: APTO · ' + bien.length + ' comprobaciones');
process.exit(fallos.length ? 1 : 0);
