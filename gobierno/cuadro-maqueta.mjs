#!/usr/bin/env node
/* CM6 · MAQUETA del cuadro simplificado (usuario 25/11: «demasiada información que no significa nada… lo útil muy disperso…
   cosas muy repetidas… juntar los botones»). Solo para enseñar y decidir: no escribe en la base de datos.
   Usa los mismos estilos que el cuadro y datos reales de hoy (tablero, fase, preguntas, versión del móvil).
   Uso: node gobierno/cuadro.mjs && node gobierno/cuadro-maqueta.mjs  →  gobierno/cuadro-maqueta.html */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { RAIZ, estadoLineas, faseActual } from './estado-lineas.mjs';

const lee = f => readFileSync(join(RAIZ, 'gobierno', f), 'utf8');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const plantilla = lee('cuadro.plantilla.html'), css = plantilla.slice(plantilla.indexOf('<style>') + 7, plantilla.indexOf('</style>'));
const actual = lee('cuadro.html');
const EL = estadoLineas(), F = faseActual(EL.tablero, EL.porId, JSON.parse(lee('camino.json'))), M = F.meta;
const git = a => { try { return execSync('git ' + a, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (e) { return ''; } };
const ver = r => (git('show ' + r + ':sw.js').match(/aqvila-(v[\w.]+)/) || [])[1] || '¿?';
const vMain = ver('origin/main'), vRama = ver('origin/claude/roman-strategy-mobile-game-bx9oq2');
const preguntas = (actual.match(/<section aria-label="Preguntas">([\s\S]*?)<\/section>/) || ['', ''])[1];
const llega = (actual.match(/Llegará a tu móvil en la próxima subida[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/) || ['', ''])[1];
const veredicto = (actual.match(/<span class="veredicto[^"]*">([^<]*)/) || ['', ''])[1];

// foto de la colección «sesiones» del 25/11 por la tarde (en el cuadro de verdad sale en vivo)
const SES = [
  ['AM2b', 'Arte de Mapas', 'Mejora el aspecto del mapa vivo de Grecia de 7,6 a 8,5.'],
  ['PN2', 'Ciudades', 'Que en Partida nueva elijas entre 8 polis griegas, cada una con su cultura.'],
  ['J20b', 'Gobierno', 'Pone a jugar a los bots aparte, con sus cifras en el cuadro.'],
  ['EB1', 'Batallas', 'Cómo están hoy las escaramuzas y plan para mejorarlas (habla contigo).'],
  ['CM6', 'Gobierno', 'Cuadro de mando: porcentajes y esta propuesta.'],
];
const C = { hecha: ['si', '✔', 'hecha'], obra: ['medias', '◐', 'en obra'], pendiente: ['falta', '○', 'falta'], aparte: ['falta', '‖', 'en pausa'] };
const marca = c => '<span class="marca ' + C[c][0] + '"><i aria-hidden="true">' + C[c][1] + '</i>' + C[c][2] + '</span>';
const enSesion = new Set(SES.map(s => s[0]));
const orden = ['obra', 'pendiente', 'hecha', 'aparte'];
const fila = t =>
  '<li><b>' + esc(t.id) + '</b><span>' + esc(t.titulo) + '</span>' +
  (t.clase === 'pendiente' && !enSesion.has(t.id) ? '<button class="boton fino lleno">Encárgala</button>' : marca(t.clase)) + '</li>';
const ts = M ? [...M.tareas].sort((a, b) => orden.indexOf(a.clase) - orden.indexOf(b.clase)) : [];
const filas = ts.filter(t => t.clase !== 'hecha').map(fila).join('') + (ts.some(t => t.clase === 'hecha') ? '</ul><details class="plegable"><summary>' + ts.filter(t => t.clase === 'hecha').length + ' hechas</summary><ul class="meta-t">' + ts.filter(t => t.clase === 'hecha').map(fila).join('') + '</ul></details><ul class="meta-t">' : '');
const hechasM = M ? M.tareas.filter(t => t.clase === 'hecha').length : 0;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cuadro nuevo (maqueta)</title><style>${css}
/* maqueta CM6 */
.pestanas { grid-template-columns: repeat(4, 1fr) !important; }
.meta-t { list-style: none; padding: 0; margin: .6rem 0 0; display: grid; gap: .35rem; }
.meta-t li { display: flex; gap: .5rem; align-items: center; font-size: .95rem; }
.meta-t li b { min-width: 3.2rem; } .meta-t li > :last-child { margin-left: auto; flex: none; }
.ses { list-style: none; padding: 0; margin: 0; display: grid; gap: .5rem; }
.ses li { display: grid; grid-template-columns: auto 1fr; gap: .1rem .6rem; }
.ses .eq { grid-column: 2; font-size: .8rem; color: var(--tenue); }
.ses i.vivo { width: .6rem; height: .6rem; border-radius: 50%; background: var(--bien); margin-top: .45rem; grid-row: span 2; }
.chips { display: flex; gap: .4rem; flex-wrap: wrap; margin: .4rem 0; }
.mas details { border-top: 1px solid var(--raya); padding: .2rem 0; } .mas summary { padding: .7rem 0; font-weight: 600; cursor: pointer; }
.mas summary .sub { display: block; font-weight: 400; font-size: .85rem; color: var(--tenue); }
.etiqueta-maqueta { position: sticky; top: 0; z-index: 9; background: #7a2a52; color: #fff; text-align: center; font-size: 12px; padding: 3px; }
</style></head><body>
<div class="etiqueta-maqueta">MAQUETA · los botones no hacen nada</div>
<div class="hoja">

<div class="vista" data-vista="parati" id="parati">
  <header class="estandarte"><div class="lema"><h1>AQVILA</h1><p class="sub">Cuadro de mando · 25 de noviembre</p></div>
    <span class="veredicto bien">${esc(veredicto || 'Jueces: APTO')}</span><a class="jugar" href="#">Jugar ahora</a><div class="greca" aria-hidden="true"></div></header>
  <section class="ficha vigia"><p><b>Has pulsado 2 cosas que aún no se han aplicado</b></p>
    <button class="boton lleno grande">Llamar al vigía ahora</button><p class="nota">Sale solo cuando hay algo sin aplicar. Un solo sitio.</p></section>
  <section aria-label="Preguntas"><h2>Te esperan</h2>${preguntas}</section>
  <section class="ficha"><h2>Pide algo</h2>
    <div class="chips"><button class="chip" aria-pressed="true">Un pedido</button><button class="chip" aria-pressed="false">Una idea para más adelante</button></div>
    <textarea placeholder="Escribe lo que quieres. El vigía lo coloca donde toca."></textarea>
    <div class="fila"><button class="boton lleno">Enviar</button></div>
    <p class="nota">Junta «Pedido libre», «Proponer algo para la 2.0» y «A la nevera»: eran tres cajas para lo mismo.</p></section>
  <section class="ficha"><details class="plegable"><summary>Juzgar la 1.0 en tu móvil · 18 pruebas<span class="sub">Bien o Mal + nota en cada una. Tus «Mal» van a CR20.</span></summary><p class="nota">(igual que hoy)</p></details></section>
</div>

<div class="vista" data-vista="ahora" id="ahora" hidden>
  ${M ? `<section class="ficha camino"><h2>Ahora: ${esc(F.version)} · ${esc(M.meta)} ${esc(M.nombre)}</h2>
    <div class="cpct"><b>${M.pct} %</b><span>hecho · queda ${100 - M.pct} %</span></div>
    <div class="cbarra"><span style="width:${M.pct}%"></span></div>
    <p class="nota">${hechasM} hechas, ${M.obra} en obra y ${M.pendientes} sin empezar. Lo que falta tiene su botón «Encárgala»; lo hecho, plegado abajo.</p>
    <ul class="meta-t">${filas}</ul></section>` : ''}
  <section class="ficha"><h2>Trabajando ahora · ${SES.length}</h2>
    <ul class="ses">${SES.map(s => '<li><i class="vivo"></i><span><b>' + esc(s[0]) + '</b> ' + esc(s[2]) + '</span><span class="eq">' + esc(s[1]) + '</span></li>').join('')}</ul>
    <div class="fila"><button class="boton fino">Cerrar las acabadas</button><button class="boton fino">Parar al acabar</button></div></section>
  <section class="ficha"><h2>Mejorar un equipo</h2>
    <div class="chips">${['Batallas', 'Ciudades', 'Política', 'Mapa y menús', 'Arte', 'Sonido', 'Gobierno'].map((e, i) => '<button class="chip" aria-pressed="' + (i ? 'false' : 'true') + '">' + e + '</button>').join('')}</div>
    <textarea placeholder="Qué mejorarías en este equipo"></textarea><div class="fila"><button class="boton lleno">Recomendar mejora</button></div>
    <p class="nota">Un solo «Recomendar mejora» con el equipo elegido, en vez de una ficha larga por equipo.</p></section>
</div>

<div class="vista" data-vista="movil" id="movil" hidden>
  <section class="mcabeza ficha"><p class="grande">Tu móvil tiene la <b>${esc(vMain)}</b>. Ya está terminada la <b>${esc(vRama)}</b>, pero aún no está en tu móvil.</p>
    <p><b>Llegará con la próxima subida</b></p><ul>${llega}</ul>
    <button class="boton lleno grande">Subir lo terminado a mi móvil</button></section>
  <section class="ficha"><h2>Lo nuevo, en capturas</h2><p class="nota">Las capturas nuevas de cada tarea y el recorrido de los jueces, juntos aquí (hoy están en Taller).</p></section>
</div>

<div class="vista mas" data-vista="mas" id="mas" hidden>
  <h2>Más</h2>
  <details><summary>Arte · 124 piezas<span class="sub">Fotos con «Pedir cambio» (igual que hoy)</span></summary></details>
  <details><summary>La 1.0 · terminada<span class="sub">Su camino, cómo quedó por órganos, sus 18 líneas y sus pruebas</span></summary></details>
  <details><summary>Ideas guardadas para más adelante<span class="sub">La nevera, solo para leer</span></summary></details>
  <details><summary>Informes<span class="sub">«¿A dónde vamos?» y los informes guardados</span></summary></details>
  <details><summary>Tus pedidos<span class="sub">Lo que has pulsado y qué se hizo</span></summary></details>
  <details><summary>El tablero entero<span class="sub">Para buscar una tarea; cada una con un solo botón «Encárgala»</span></summary></details>
</div>
</div>
<nav class="pestanas" aria-label="Vistas">
  <a href="#parati"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/></svg>Para ti</a>
  <a href="#ahora"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/></svg>Ahora</a>
  <a href="#movil"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM11 18.5h2"/></svg>Tu móvil</a>
  <a href="#mas"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01"/></svg>Más</a>
</nav>
<script>
function ver(){const h=(location.hash||'#parati').slice(1);document.querySelectorAll('.vista').forEach(v=>v.hidden=v.dataset.vista!==h);
document.querySelectorAll('.pestanas a').forEach(a=>a.setAttribute('aria-current',a.getAttribute('href')==='#'+h?'page':'false'));scrollTo(0,0);}
addEventListener('hashchange',ver);ver();
</script></body></html>`;
writeFileSync(join(RAIZ, 'gobierno/cuadro-maqueta.html'), html);
console.log('Maqueta: gobierno/cuadro-maqueta.html · ' + Math.round(html.length / 1024) + ' KB · ' + (html.match(/<button/g) || []).length + ' botones');
