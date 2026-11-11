#!/usr/bin/env node
/* AQVILA — genera la página del cuadro de mando a partir del tablero, la bitácora y las capturas.
   Uso:  node gobierno/cuadro.mjs   →  escribe gobierno/cuadro.html (no se guarda en git; se publica como Artifact).
   La página es estática salvo «Tus pedidos», que vive en la base de datos del Artifact (colección `pedidos`). */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const lee = f => readFile(join(AQUI, f), 'utf8');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/(https?:\/\/[^\s<)]+[^\s<).,])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
const plano = s => s.replace(/\*\*|`/g, '');
// título corto de una tarea: hasta el primer signo de puntuación fuerte
const corto = s => { const p = plano(s), m = p.slice(12).search(/[:.;(]/); return (m < 0 ? p : p.slice(0, 12 + m)).trim(); };

/* une las líneas de continuación (sangradas) a su viñeta */
function vinetas(lineas) {
  const out = [];
  for (const l of lineas) {
    if (/^(-|\d+\.)\s/.test(l)) out.push(l.replace(/^(-|\d+\.)\s+/, ''));
    else if (/^\s+\S/.test(l) && out.length) out[out.length - 1] += ' ' + l.trim();
  }
  return out;
}
function secciones(texto) {
  const s = {}; let actual = null;
  for (const l of texto.split('\n')) { const m = l.match(/^## (.+)/); if (m) { actual = m[1].trim(); s[actual] = []; } else if (actual) s[actual].push(l); }
  return s;
}

const tablero = secciones(await lee('TABLERO.md')), bitacora = secciones(await lee('BITACORA.md'));
const config = JSON.parse(await lee('cuadro.json'));
const ESTADO = { '⬜': ['pend', 'por hacer'], '🔶': ['medias', 'a medias'], '✅': ['hecho', 'hecho'] };

/* ---------- carriles ---------- */
let total = 0, hechas = 0, medias = 0;
const carriles = Object.keys(tablero).filter(k => /^Carril |^Gobierno/.test(k)).map(k => {
  const m = k.match(/^Carril (\w+) — (.+)/), letra = m ? m[1] : 'G', nombre = m ? m[2] : 'Gobierno';
  const tareas = vinetas(tablero[k]).map(v => { const t = v.match(/^(⬜|🔶|✅)\s+(\w+)\s+(.*)$/u); return t && { est: t[1], id: t[2], texto: t[3] }; }).filter(Boolean);
  return { letra, nombre, tareas };
}).filter(c => c.tareas.length);

const htmlCarriles = carriles.map(c => {
  const ok = c.tareas.filter(t => t.est === '✅').length; total += c.tareas.length; hechas += ok; medias += c.tareas.filter(t => t.est === '🔶').length;
  return '<details class="carril"><summary><span class="letra">' + esc(c.letra) + '</span><span class="nombre">' + esc(c.nombre) + '</span><span class="cuenta">' + ok + ' de ' + c.tareas.length + '</span></summary><div class="tareas">' +
    c.tareas.map(t => {
      const [cls, rot] = ESTADO[t.est], hecha = t.est === '✅', titulo = corto(t.texto);
      return '<details class="tarea' + (hecha ? ' hecha' : '') + '" data-ref="' + esc(t.id) + '"><summary><span class="id">' + esc(t.id) + '</span><span class="que">' + esc(titulo) + '</span><span class="estado ' + cls + '">' + rot + '</span></summary>' +
        '<div class="cuerpo"><p>' + md(t.texto) + '</p>' +
        '<div class="fila">' + (hecha ? '' : '<button class="boton lleno" data-pedir="priorizar" data-ref="' + esc(t.id) + '" data-titulo="' + esc(titulo) + '">Dar prioridad</button>') +
        '<button class="boton" data-abrir="c-' + esc(t.id) + '">Pedir un cambio</button></div>' +
        '<div class="cambio" id="c-' + esc(t.id) + '" hidden><label class="quien" for="tx-' + esc(t.id) + '">Qué cambiarías en ' + esc(t.id) + '</label><textarea id="tx-' + esc(t.id) + '"></textarea>' +
        '<div class="fila"><button class="boton lleno" data-pedir="cambio" data-ref="' + esc(t.id) + '" data-titulo="' + esc(titulo) + '" data-texto="tx-' + esc(t.id) + '">Enviar cambio</button></div></div></div></details>';
    }).join('') + '</div></details>';
}).join('');

/* ---------- lo que espera al usuario y propuestas ---------- */
const espera = vinetas(bitacora['Esperando algo del usuario'] || []);
const htmlEspera = espera.length ? espera.map((e, i) =>
  '<li class="ficha"><p>' + md(e) + '</p><div class="fila"><button class="boton" data-abrir="r-' + i + '">Responder</button></div>' +
  '<div class="cambio" id="r-' + i + '" hidden><label class="quien" for="rx-' + i + '">Tu respuesta</label><textarea id="rx-' + i + '"></textarea>' +
  '<div class="fila"><button class="boton lleno" data-pedir="respuesta" data-ref="E' + (i + 1) + '" data-titulo="' + esc(corto(e)) + '" data-texto="rx-' + i + '">Enviar respuesta</button></div></div></li>').join('')
  : '<li class="nota">Nada pendiente de ti.</li>';

const propuestas = vinetas(bitacora['Propuestas por aprobar'] || []).map(v => { const m = v.match(/^(P\d+)\s+(.*)$/); return m && { id: m[1], texto: m[2] }; }).filter(Boolean);
const htmlPropuestas = propuestas.length ? propuestas.map(p =>
  '<li class="ficha" data-ref="' + p.id + '"><span class="quien">' + p.id + '</span><p>' + md(p.texto) + '</p><div class="fila">' +
  '<button class="boton lleno" data-pedir="aprobar" data-ref="' + p.id + '" data-titulo="' + esc(corto(p.texto)) + '">Aprobar</button>' +
  '<button class="boton" data-pedir="rechazar" data-ref="' + p.id + '" data-titulo="' + esc(corto(p.texto)) + '">Rechazar</button>' +
  '<button class="boton" data-abrir="c-' + p.id + '">Pedir un cambio</button></div>' +
  '<div class="cambio" id="c-' + p.id + '" hidden><label class="quien" for="tx-' + p.id + '">Qué cambiarías</label><textarea id="tx-' + p.id + '"></textarea>' +
  '<div class="fila"><button class="boton lleno" data-pedir="cambio" data-ref="' + p.id + '" data-texto="tx-' + p.id + '">Enviar cambio</button></div></div></li>').join('')
  : '<li class="nota">No hay propuestas esperando tu visto bueno.</li>';

/* ---------- capturas y veredicto de los jueces ---------- */
let informe = null; try { informe = JSON.parse(await lee('capturas/informe.json')); } catch (e) { }
let htmlCapturas = '', notaCapturas = 'Aún no hay capturas. Salen al ejecutar los jueces (node gobierno/jueces.mjs).', veredicto = 'Jueces sin ejecutar', vClase = 'nada';
if (informe) {
  const bien = informe.pasos.filter(p => p.ok).length, dia = new Date(informe.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  veredicto = (informe.ok ? 'Jueces: apto · ' : 'Jueces: no apto · ') + bien + ' de ' + informe.pasos.length; vClase = informe.ok ? 'ok' : 'no';
  notaCapturas = 'Recorrido automático del ' + dia + ' en un móvil simulado de 390 px. Desliza hacia un lado.';
  const figs = [];
  for (const p of informe.pasos) {
    if (!p.captura) continue;
    const b64 = (await readFile(join(AQUI, 'capturas', p.captura))).toString('base64');
    figs.push('<figure class="' + (/batalla\.jpg$/.test(p.captura) && !/aviso/.test(p.captura) || /resultado/.test(p.captura) ? 'ancha' : '') + (p.ok ? '' : ' mal') + '"><img alt="' + esc(p.nombre) + '" src="data:image/jpeg;base64,' + b64 + '"><figcaption><b>' + (p.ok ? '✔ ' : '✘ ') + esc(p.nombre) + '</b>' + esc(p.detalle) + '</figcaption></figure>');
  }
  htmlCapturas = figs.join('');
}

/* ---------- para enseñarte: capturas de tareas e informes (lista en cuadro.json) ---------- */
const RAIZ = join(AQUI, '..');
let htmlEnsenar = '';
for (const c of (config.capturas || []).slice(-10).reverse()) {
  try { const b64 = (await readFile(join(RAIZ, c.archivo))).toString('base64');
    htmlEnsenar += '<figure class="' + (c.ancha ? 'ancha' : '') + '"><img alt="' + esc(c.pie) + '" src="data:image/jpeg;base64,' + b64 + '"><figcaption><b>' + esc(c.tarea || '') + '</b>' + esc(c.pie) + '</figcaption></figure>'; } catch (e) { }
}
if (!htmlEnsenar) htmlEnsenar = '<p class="nota">Aún no hay capturas de tareas.</p>';
// Markdown mínimo: títulos, viñetas, tablas y párrafos
function informeHtml(texto) {
  const out = []; let lista = [], tabla = [];
  const cierra = () => { if (lista.length) { out.push('<ul>' + lista.map(l => '<li>' + md(l) + '</li>').join('') + '</ul>'); lista = []; }
    if (tabla.length) { out.push('<div class="rollo"><table>' + tabla.map((f, i) => '<tr>' + f.map(c => (i ? '<td>' : '<th>') + md(c) + (i ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</table></div>'); tabla = []; } };
  for (const l of texto.split('\n')) {
    if (/^\s*\|/.test(l)) { if (lista.length) cierra(); if (!/^\s*\|[\s:|-]+\|\s*$/.test(l)) tabla.push(l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())); continue; }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) { if (tabla.length) cierra(); lista.push(l.replace(/^\s*([-*]|\d+\.)\s+/, '')); continue; }
    if (/^\s+\S/.test(l) && lista.length) { lista[lista.length - 1] += ' ' + l.trim(); continue; }
    cierra();
    const h = l.match(/^#+\s+(.*)/); if (h) out.push('<h3>' + md(h[1]) + '</h3>'); else if (l.trim() && !/^```/.test(l)) out.push('<p>' + md(l) + '</p>');
  }
  cierra(); return out.join('');
}
let htmlInformes = '';
for (const inf of (config.informes || []).slice().reverse()) {
  try { htmlInformes += '<details class="informe"><summary>' + esc(inf.titulo) + '</summary><div class="md">' + informeHtml(await readFile(join(RAIZ, inf.archivo), 'utf8')) + '</div></details>'; } catch (e) { }
}

/* ---------- lo ya hecho ---------- */
const kHecho = Object.keys(tablero).find(k => /^Hecho/.test(k));
const hechos = kHecho ? tablero[kHecho].join(' ').split('✅').map(s => s.replace(/·\s*$/, '').trim()).filter(Boolean) : [];

const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const datos = {
  FECHA: fecha, JUEGO: esc(config.juego), VEREDICTO: esc(veredicto), VEREDICTO_CLASE: vClase,
  ESPERA: htmlEspera, PROPUESTAS: htmlPropuestas, CARRILES: htmlCarriles,
  RESUMEN: total + ' tareas en ' + carriles.length + ' carriles: ' + hechas + ' hechas, ' + medias + ' a medias y ' + (total - hechas - medias) + ' por hacer.',
  ENSENAR: htmlEnsenar, INFORMES: htmlInformes, CAPTURAS: htmlCapturas, CAPTURAS_NOTA: esc(notaCapturas), HECHOS: hechos.map(h => '<li>' + md(h) + '</li>').join(''),
};
const html = (await lee('cuadro.plantilla.html')).replace(/\{\{(\w+)\}\}/g, (_, k) => datos[k] ?? '');
await writeFile(join(AQUI, 'cuadro.html'), html);
console.log('Cuadro generado: gobierno/cuadro.html · ' + Math.round(html.length / 1024) + ' KB · ' + total + ' tareas · ' + espera.length + ' asuntos esperan al usuario · ' + propuestas.length + ' propuestas');
