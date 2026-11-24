#!/usr/bin/env node
/* AQVILA — genera la página del cuadro de mando a partir de la lista de la 1.0, el tablero, la bitácora y las capturas.
   Uso:  node gobierno/cuadro.mjs   →  escribe gobierno/cuadro.html (no se guarda en git; se publica como Artifact).
   Regla del 18/11: el cuadro enseña el juego, no las tareas. La portada sale de gobierno/lista.json.
   La página es estática salvo pedidos, sesiones y vigía, que viven en la base de datos del Artifact. */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
/* Seguro: no generar el cuadro desde una copia atrasada (el 12/11 una sesión publicó un cuadro viejo y al usuario le salió lo ya contestado como pendiente). */
try {
  const { execSync } = await import('node:child_process');
  const rama = JSON.parse(await readFile(join(AQUI, 'cuadro.json'), 'utf8')).rama, o = { cwd: AQUI, stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 };
  if (rama && !process.argv.includes('--sin-comprobar')) {
    execSync('git fetch -q origin ' + rama, o);
    const atras = Number(execSync('git rev-list --count HEAD..origin/' + rama, o).toString().trim());
    if (atras > 0) { console.error('CUADRO NO GENERADO: tu copia va ' + atras + ' cambios por detrás de la rama. Haz antes: git pull --rebase origin ' + rama); process.exit(1); }
  }
} catch (e) { /* sin red o sin git: se genera igual */ }
const lee = f => readFile(join(AQUI, f), 'utf8');
const RAIZ = join(AQUI, '..');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/(https?:\/\/[^\s<)]+[^\s<).,])/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
const plano = s => s.replace(/\*\*|`/g, '');
// título corto de una tarea: hasta el primer signo de puntuación fuerte
const corto = s => { const p = plano(s), m = p.slice(12).search(/[:.;(]/); return (m < 0 ? p : p.slice(0, 12 + m)).trim(); };
const avisos = [];
const avisa = t => { avisos.push(t); console.warn('AVISO: ' + t); };

/* une las líneas de continuación (sangradas) a su viñeta; una sub-viñeta con marca de tarea (  - ⬜ GP2 …) es una tarea propia */
function vinetas(lineas) {
  const out = [];
  for (const l of lineas) {
    if (/^(-|\d+\.)\s/.test(l) || /^\s+-\s+(⬜|🔶|✅)/u.test(l)) out.push(l.trim().replace(/^(-|\d+\.)\s+/, ''));
    else if (/^\s+\S/.test(l) && out.length) out[out.length - 1] += ' ' + l.trim();
  }
  return out;
}
function secciones(texto) {
  const s = {}; let actual = null;
  for (const l of texto.split('\n')) { const m = l.match(/^## (.+)/); if (m) { actual = m[1].trim(); s[actual] = []; } else if (actual) s[actual].push(l); }
  return s;
}
const seccion = (s, inicio) => s[Object.keys(s).find(k => k.startsWith(inicio))] || [];

const tablero = secciones(await lee('TABLERO.md')), bitacora = secciones(await lee('BITACORA.md'));
const config = JSON.parse(await lee('cuadro.json'));
const lista = JSON.parse(await lee('lista.json'));
const ESTADO = { '⬜': ['pend', 'por hacer'], '🔶': ['medias', 'a medias'], '✅': ['hecho', 'hecho'] };

/* ---------- el tablero (solo para el archivo y para cruzar con la lista) ---------- */
let carriles = Object.keys(tablero).filter(k => /^Carril |^Gobierno/.test(k)).map(k => {
  const m = k.match(/^Carril (\w+) — (.+)/), letra = m ? m[1] : 'G', nombre = m ? m[2] : 'Gobierno';
  const tareas = vinetas(tablero[k]).flatMap(v => {
    // los ids pueden llevar guion (GM-K6a)
    const t = v.match(/^(⬜|🔶|✅)\s+(?:\((en pausa[^)]*)\)\s+)?([\w-]+)\s+(.*)$/u); if (!t) return [];
    const fila = [{ est: t[1], id: t[3], texto: t[4], pausa: t[2] || '' }];
    const q = t[1] === '✅' && t[4].match(/Queda ⬜ ([\w-]+):?\s*(.*)$/u);   // una hecha que deja una parte pendiente (p. ej. C2 → C2b)
    if (q) fila.push({ est: '⬜', id: q[1], texto: q[2], pausa: '', queda: true });
    return fila;
  });
  return { letra, nombre, corto: ({ A: 'Guerra', B: 'Ciudad', C: 'Mapa', D: 'Técnica', E: 'Arte', F: 'Modos', H: 'Historia', I: 'Gran diseño', J: 'Interfaz', K: 'Concurso', L: 'Interfaz guerra', N: 'Guerra nueva', O: 'Economía', V: 'Versión 1.0' })[letra] || nombre.replace(/\s*[\(—].*$/, ''), tareas };
});
// una parte «Queda ⬜ X» se olvida si X ya tiene su propia viñeta en el tablero
const reales = new Set(carriles.flatMap(c => c.tareas.filter(t => !t.queda).map(t => t.id)));
for (const c of carriles) c.tareas = c.tareas.filter(t => !t.queda || !reales.has(t.id));
carriles.splice(0, carriles.length, ...carriles.filter(c => c.tareas.length));
const pendientes = c => c.tareas.filter(t => t.est !== '✅');
carriles.sort((a, b) => (pendientes(b).length > 0) - (pendientes(a).length > 0));
const porId = new Map();
for (const c of carriles) for (const t of c.tareas) if (!porId.has(t.id) || t.est !== '✅') porId.set(t.id, t);
const hecha = id => porId.get(id)?.est === '✅';
const libre = id => { const t = porId.get(id); return t && t.est !== '✅' && !t.pausa; };

function tareaHtml(t, c) {
  const [cls, rot] = ESTADO[t.est], ok = t.est === '✅', titulo = corto(t.texto), id = esc(t.id), tit = esc(titulo);
  return '<details class="tarea' + (ok ? ' hecha' : '') + '" data-ref="' + id + '"' + (ok ? '' : ' data-carril="' + esc(c.letra) + '" data-pausa="' + (t.pausa ? 1 : 0) + '" data-busca="' + esc((t.id + ' ' + plano(t.texto) + ' ' + c.corto).toLowerCase()) + '"') + '><summary>' +
    (ok ? '' : '<input type="checkbox" class="sel" data-sel="' + id + '" data-titulo="' + tit + '" aria-label="Elegir ' + id + '">') +
    '<span class="id">' + id + '</span><span class="que">' + esc(titulo) + (ok ? '' : '<small>' + esc(c.letra) + ' · ' + esc(c.corto) + (t.pausa ? ' · ' + esc(t.pausa) : '') + '</small>') + '</span>' +
    '<span class="estado ' + (t.pausa ? 'pausa' : cls) + '">' + (t.pausa ? 'en pausa' : rot) + '</span></summary>' +
    '<div class="cuerpo"><p>' + md(t.texto) + '</p>' +
    '<div class="fila">' + (ok ? '' : '<button class="boton lleno" data-pedir="abrir" data-ref="' + id + '" data-titulo="' + tit + '">Abrir sesión</button><button class="boton" data-pedir="priorizar" data-ref="' + id + '" data-titulo="' + tit + '">Dar prioridad</button><button class="boton" data-pedir="orden" data-ref="' + (t.pausa ? 'reanudar:' : 'pausar:') + id + '" data-titulo="' + tit + '">' + (t.pausa ? 'Quitar la pausa' : 'Dejar en pausa') + '</button>') +
    '<button class="boton" data-abrir="c-' + id + '">Pedir un cambio</button></div>' +
    '<div class="cambio" id="c-' + id + '" hidden><label class="quien" for="tx-' + id + '">Qué cambiarías en ' + id + '</label><textarea id="tx-' + id + '"></textarea>' +
    '<div class="fila"><button class="boton lleno" data-pedir="cambio" data-ref="' + id + '" data-titulo="' + tit + '" data-texto="tx-' + id + '">Enviar cambio</button></div></div></div></details>';
}
// archivo: todo lo pendiente en una sola lista (lo activo primero, lo que está en pausa al final) y lo hecho por carril
const listaPend = [];
for (const c of carriles) for (const t of pendientes(c)) listaPend.push({ t, c });
listaPend.sort((a, b) => (!!a.t.pausa) - (!!b.t.pausa));
const nPausa = listaPend.filter(x => x.t.pausa).length, nActivas = listaPend.length - nPausa;
const htmlPendiente = listaPend.map(x => tareaHtml(x.t, x.c)).join('') || '<p class="nota">No queda nada por hacer en el tablero.</p>';
const htmlChips = carriles.filter(c => pendientes(c).length).map(c => '<button class="chip" data-filtro="carril:' + esc(c.letra) + '">' + esc(c.letra) + ' · ' + esc(c.corto) + ' <b>' + pendientes(c).length + '</b></button>').join('');
let nHechas = 0;
const htmlCarriles = carriles.map(c => {
  const ok = c.tareas.filter(t => t.est === '✅'); nHechas += ok.length;
  return ok.length ? '<details class="carril"><summary><span class="letra">' + esc(c.letra) + '</span><span class="nombre">' + esc(c.nombre) + '</span><span class="cuenta">' + ok.length + ' hechas</span></summary><div class="tareas">' + ok.map(t => tareaHtml(t, c)).join('') + '</div></details>' : '';
}).join('');
const kHecho = Object.keys(tablero).find(k => /^Hecho/.test(k));
const hechos = kHecho ? tablero[kHecho].join(' ').split('✅').map(s => s.replace(/·\s*$/, '').trim()).filter(Boolean) : [];

/* ---------- la lista de la 1.0 ---------- */
const MARCA = { hecha: ['si', '✔', 'hecha'], medias: ['medias', '◐', 'a medias'], falta: ['falta', '○', 'falta'] };
const marca = e => { const [c, s, t] = MARCA[e] || MARCA.falta; return '<span class="marca ' + c + '"><i aria-hidden="true">' + s + '</i>' + t + '</span>'; };
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
async function imagen(ruta, alt) {
  if (!ruta) return '';
  try { const b64 = (await readFile(join(RAIZ, ruta))).toString('base64'), ext = (ruta.split('.').pop() || '').toLowerCase();
    return '<img class="captura" loading="lazy" alt="' + esc(alt) + '" src="data:' + (MIME[ext] || 'image/jpeg') + ';base64,' + b64 + '">'; } catch (e) { avisa('falta la captura ' + ruta); return ''; }
}
const lineas = lista.lineas || [], organos = lista.organos || [];
const enLinea = new Map();
for (const l of lineas) {
  for (const id of l.tareas || []) { enLinea.set(id, l.id); if (!porId.has(id)) avisa(l.id + ': la tarea ' + id + ' no está en el tablero'); }
  const ts = l.tareas || [];
  if (ts.length && ts.every(hecha) && l.estado !== 'hecha') avisa(l.id + ': todas sus tareas están hechas en el tablero, pero la línea dice «' + l.estado + '»');
  if (ts.length && l.estado === 'hecha' && !ts.every(hecha)) avisa(l.id + ': la línea dice «hecha», pero en el tablero quedan ' + ts.filter(id => !hecha(id)).join(', '));
}
async function lineaHtml(l) {
  const id = esc(l.id), tit = esc(l.titulo), ts = l.tareas || [], prim = ts.find(libre);
  let dentro = '<p class="rotulo">Qué verás</p><p>' + md(l.veras || '') + '</p>';
  if (l.hecho) dentro += '<p class="rotulo">Qué se hizo</p><p>' + md(l.hecho) + '</p>' + await imagen(l.captura, l.titulo);
  if (l.falta) dentro += '<p class="rotulo">Qué falta</p><p>' + md(l.falta) + '</p>';
  if (ts.length) dentro += '<p class="tareas-l">Tareas del tablero: ' + ts.map(t => esc(t) + (hecha(t) ? ' ✔' : porId.get(t)?.pausa ? ' (en pausa)' : '')).join(', ') + '</p>';
  dentro += '<div class="fila">' + (prim ? '<button class="boton lleno" data-pedir="abrir" data-ref="' + esc(prim) + '" data-linea="' + id + '" data-titulo="' + id + ' · ' + tit + '">Encárgala</button>' : '') +
    '<button class="boton" data-abrir="c-' + id + '">Pedir un cambio</button></div>' +
    '<div class="cambio" id="c-' + id + '" hidden><label class="quien" for="tx-' + id + '">Qué cambiarías en esta línea</label><textarea id="tx-' + id + '"></textarea>' +
    '<div class="fila"><button class="boton lleno" data-pedir="cambio" data-ref="' + id + '" data-titulo="' + id + ' · ' + tit + '" data-texto="tx-' + id + '">Enviar cambio</button></div></div>';
  return '<details class="linea" data-ref="' + id + '"><summary>' + marca(l.estado) + '<span class="que">' + tit + '</span></summary><div class="cuerpo">' + dentro + '</div></details>';
}
let htmlOrganos = '', htmlLista = '';
for (const o of organos) {
  const ls = lineas.filter(l => l.organo === o.id), h = ls.filter(l => l.estado === 'hecha').length, m = ls.filter(l => l.estado === 'medias').length;
  const segs = '<span class="segs" role="img" aria-label="' + h + ' de ' + ls.length + ' líneas hechas y ' + m + ' a medias">' + ls.map(l => '<i class="s-' + (MARCA[l.estado] || MARCA.falta)[0] + '"></i>').join('') + '</span>';
  htmlOrganos += '<a class="organo" href="#lista-' + esc(o.id) + '"><span class="cab"><b>' + esc(o.nombre) + '</b><span class="ir">Ver sus líneas ›</span></span><span class="nota">' + esc(o.que) + '</span>' + segs +
    '<span class="cuenta">' + h + ' de ' + ls.length + ' hechas' + (m ? ' · ' + m + ' a medias' : '') + '</span></a>';
  let items = ''; for (const l of ls) items += await lineaHtml(l);
  htmlLista += '<section id="lista-' + esc(o.id) + '" aria-labelledby="t-' + esc(o.id) + '"><h2 id="t-' + esc(o.id) + '">' + esc(o.nombre) + ' <span class="n">' + h + ' de ' + ls.length + '</span></h2><p class="nota">' + esc(o.que) + '</p><div class="lineas">' + items + '</div></section>';
}
const sinOrgano = lineas.filter(l => !organos.some(o => o.id === l.organo));
if (sinOrgano.length) avisa('líneas sin órgano conocido: ' + sinOrgano.map(l => l.id).join(', '));
const htmlComprob = (lista.comprobaciones || []).map((c, i) => '<li class="comprob"><span class="num">' + (i + 1) + '</span><span class="que"><b>' + esc(c.texto) + '</b>' + (c.nota ? '<span class="nota">' + esc(c.nota) + '</span>' : '') + '</span>' + marca(c.estado === 'si' ? 'hecha' : c.estado) + '</li>').join('');
const htmlPropuesta = lista.estado === 'propuesta' ? '<div class="ficha aviso-lista"><p><b>Propuesta: aún no la has aprobado. El tablero no se ha tocado.</b></p><a class="boton lleno" href="#decidir">Ir a decidir</a></div>' : '';

/* ---------- qué pasa con el resto del tablero ---------- */
const reparto = lista.reparto || {}, colocada = new Map(enLinea);
const grupos = [];
const grupo = (clave, rotulo, items) => { const g = { clave, rotulo, items: [] };
  for (const it of items) { const ids = (it.tareas || []).filter(id => { if (!porId.has(id)) { avisa('reparto: la tarea ' + id + ' no está en el tablero'); return false; } if (hecha(id) || colocada.has(id)) return false; colocada.set(id, clave); return true; });
    g.items.push({ nota: it.nota || '', de: it.de || '', ids }); }
  grupos.push(g); return g; };
const gLista = { clave: 'lista', rotulo: 'Sirven a la lista', items: [{ nota: 'Las tareas que tienen las líneas de arriba.', ids: [...enLinea.keys()].filter(id => porId.has(id) && !hecha(id)) }] };
grupos.push(gLista);
grupo('depende', 'Dependen de una pregunta', reparto.depende || []);
const gDespues = grupo('despues', 'Después de la 1.0', reparto.despues || []);
const pausadas = [...porId.values()].filter(t => t.est !== '✅' && t.pausa && !colocada.has(t.id)).map(t => t.id);
pausadas.forEach(id => colocada.set(id, 'despues'));
if (pausadas.length) gDespues.items.push({ nota: 'Las que el tablero ya tiene en pausa.', ids: pausadas });
grupo('sobra', 'Sobran', reparto.sobra || []);
grupo('gobierno', 'Del gobierno del proyecto', [{ nota: 'Cómo se trabaja, no el juego.', tareas: reparto.gobierno || [] }]);
const sueltas = [...porId.values()].filter(t => t.est !== '✅' && !t.pausa && !colocada.has(t.id)).map(t => t.id);
if (sueltas.length) { grupos.push({ clave: 'suelta', rotulo: 'Sin colocar', items: [{ nota: 'Están en el tablero sin pausa, pero en ninguna línea ni en el reparto. El director debe colocarlas.', ids: sueltas }] }); avisa(sueltas.length + ' tareas pendientes sin colocar en la lista: ' + sueltas.join(', ')); }
const nGrupo = g => g.items.reduce((s, it) => s + it.ids.length, 0);
const htmlResto = grupos.filter(g => nGrupo(g) || g.clave === 'sobra').map(g => '<div class="grupo g-' + g.clave + '"><p><b>' + esc(g.rotulo) + '</b> <span class="n">' + nGrupo(g) + '</span></p>' +
  g.items.filter(it => it.ids.length).map(it => '<p class="nota">' + (it.de ? 'De «' + esc(it.de) + '». ' : '') + esc(it.nota) + '</p><p class="ids">' + it.ids.map(esc).join(', ') + '</p>').join('') + '</div>').join('');
const resumenResto = grupos.filter(g => g.clave !== 'gobierno').map(g => nGrupo(g) + ' ' + ({ lista: 'sirven a la lista', depende: 'dependen de una pregunta', despues: 'van después de la 1.0', sobra: 'sobran', suelta: 'sin colocar' })[g.clave]).join(' · ');

/* ---------- la nevera: «Después de la 1.0» de la bitácora (solo las viñetas con guion) ---------- */
const nevera = vinetas(seccion(bitacora, 'Después de la 1.0').filter(l => /^-\s|^\s+\S/.test(l)));
const htmlNevera = nevera.map(n => '<li>' + md(n) + '</li>').join('');

/* ---------- lo que espera al usuario: solo las tres primeras ---------- */
const romano = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n);
const espera = vinetas(seccion(bitacora, 'Esperando algo del usuario'));
const MAX = 3, vistas = espera.slice(0, MAX), enCola = Math.max(0, espera.length - MAX);
// forma: **Título**: pregunta (A) opción [recomendado]; (B) opción. Por qué: frase.
function pregunta(e) {
  const m = e.match(/^(?:\d{1,2}\/\d{1,2}\/\d{4} — )?\*\*(.+?)\*\*:?\s*([^]*)$/), tit = m ? plano(m[1]) : corto(e), resto = m ? m[2] : e;
  const pq = resto.search(/Por qué:/), cuerpo = pq < 0 ? resto : resto.slice(0, pq), porque = pq < 0 ? '' : resto.slice(pq + 8).trim();
  const partes = cuerpo.split(/\(([A-D])\)\s*/);
  const ops = []; for (let i = 1; i + 1 < partes.length; i += 2) { let t = partes[i + 1].trim().replace(/[;.]\s*$/, '').trim(); const rec = /\[recomendado\]/i.test(t); t = t.replace(/\s*\[recomendado\]\s*/i, ' ').trim(); ops.push({ letra: partes[i], texto: t, rec }); }
  return { tit, preg: (ops.length > 1 ? partes[0] : cuerpo).trim(), ops: ops.length > 1 ? ops : [], porque, sino: /sí o no|aprobar o rechazar|\?/i.test(cuerpo) };
}
const htmlEspera = vistas.map((e, i) => {
  const p = pregunta(e), ref = 'E' + (i + 1), tit = esc(p.tit), rec = p.ops.find(o => o.rec);
  const dato = ' data-pedir="respuesta" data-ref="' + ref + '" data-titulo="' + tit + '"';
  const botones = p.ops.length ? p.ops.map(o => '<button class="boton opcion' + (o.rec ? ' lleno' : '') + '"' + dato + ' data-valor="' + esc(o.letra + ' · ' + plano(o.texto)) + '"><span class="l">' + o.letra + '</span><span class="t">' + esc(plano(o.texto)) + (o.rec ? '<span class="rec">Recomendado</span>' : '') + '</span></button>').join('')
    : p.sino ? ['Sí', 'No'].map(v => '<button class="boton lleno"' + dato + ' data-valor="' + v + '">' + v + '</button>').join('') : '';
  return '<li class="ficha toca pregunta"><p class="asunto"><span class="num">' + romano(i + 1) + '</span><b>' + tit + '</b></p>' + (p.preg ? '<p>' + md(p.preg.charAt(0).toUpperCase() + p.preg.slice(1)) + '</p>' : '') +
    '<div class="opciones' + (p.ops.length ? '' : ' fila') + '">' + botones + '</div>' +
    (p.porque ? '<p class="porque">' + (rec ? 'Recomiendo ' + rec.letra + ' porque ' : 'Por qué: ') + md(p.porque) + '</p>' : '') +
    (rec ? '<div class="delega"><button class="boton"' + dato + ' data-valor="Decide tú" data-recomendado="' + esc(rec.letra + ' · ' + plano(rec.texto)) + '">Decide tú</button><span class="nota">Se hará lo recomendado y quedará apuntado como delegado.</span></div>' : '') +
    '<div class="fila"><button class="boton fino" data-abrir="r-' + i + '">Escribir otra respuesta</button></div>' +
    '<div class="cambio" id="r-' + i + '" hidden><label class="quien" for="rx-' + i + '">Tu respuesta</label><textarea id="rx-' + i + '"></textarea>' +
    '<div class="fila"><button class="boton lleno"' + dato + ' data-texto="rx-' + i + '">Enviar respuesta</button></div></div></li>';
}).join('') || '<li class="nota">Nada espera respuesta tuya. El proyecto sigue sin ti.</li>';
const htmlCola = enCola ? '<p class="nota cola">Hay ' + enCola + ' más en cola. No hace falta que las mires: saldrán cuando contestes estas.</p>' : '';
const htmlTeEsperan = vistas.length ? '<div class="ficha esperan"><p><b>Te ' + (vistas.length === 1 ? 'espera 1 pregunta' : 'esperan ' + vistas.length + ' preguntas') + '</b></p><a class="boton lleno" href="#decidir">Ir a decidir</a></div>'
  : '<p class="nota esperan">Nada espera respuesta tuya.</p>';

/* ---------- sesiones apuntadas en cuadro.json (si la colección en vivo está vacía) ---------- */
const sesiones = config.sesiones || [];
const htmlMarcha = sesiones.length ? sesiones.map(x =>
  '<li class="sig"><span class="id">' + esc(x.tarea || '') + '</span><span class="que"><b>' + esc(x.titulo || '') + '</b>' + (x.nota ? '<span class="nota">' + esc(x.nota) + '</span>' : '') + '</span>' +
  (x.url ? '<a class="boton fino" href="' + esc(x.url) + '" target="_blank" rel="noopener">Ver</a>' : '') + '</li>').join('')
  : '<li class="nota">No hay ninguna sesión apuntada. Encarga una línea desde «Lista».</li>';

/* ---------- capturas y veredicto de los jueces (gobierno/capturas/ puede no existir) ---------- */
let informe = null; try { informe = JSON.parse(await lee('capturas/informe.json')); } catch (e) { }
let htmlCapturas = '', notaCapturas = 'Aún no hay capturas. Salen al ejecutar los jueces (node gobierno/jueces.mjs).', veredicto = 'Jueces sin ejecutar', vClase = 'nada';
if (informe) {
  const bien = informe.pasos.filter(p => p.ok).length, dia = new Date(informe.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  veredicto = (informe.ok ? 'Jueces: apto · ' : 'Jueces: no apto · ') + bien + ' de ' + informe.pasos.length; vClase = informe.ok ? 'ok' : 'no';
  notaCapturas = 'Recorrido automático del ' + dia + ' en un móvil simulado de 390 px. Desliza hacia un lado.';
  const figs = [];
  for (const p of informe.pasos) {
    if (!p.captura) continue;
    /* algunas capturas del recorrido se guardan en capturas-tarea/ (R3, R4): se buscan en los dos sitios y, si faltan, se saltan */
    let b64 = null; for (const d of ['capturas', 'capturas-tarea']) { try { b64 = (await readFile(join(AQUI, d, p.captura))).toString('base64'); break; } catch (e) { } }
    if (!b64) continue;
    figs.push('<figure class="' + (/batalla\.jpg$/.test(p.captura) && !/aviso/.test(p.captura) || /resultado/.test(p.captura) ? 'ancha' : '') + (p.ok ? '' : ' mal') + '"><img alt="' + esc(p.nombre) + '" src="data:image/jpeg;base64,' + b64 + '"><figcaption><b>' + (p.ok ? '✔ ' : '✘ ') + esc(p.nombre) + '</b>' + esc(p.detalle) + '</figcaption></figure>');
  }
  htmlCapturas = figs.join('');
}

/* ---------- para enseñarte: capturas de tareas e informes (lista en cuadro.json) ---------- */
let htmlEnsenar = '';
for (const c of (config.capturas || []).slice(-10).reverse()) {
  try { const b64 = (await readFile(join(RAIZ, c.archivo))).toString('base64'), ext = (c.archivo.split('.').pop() || '').toLowerCase();
    htmlEnsenar += '<figure class="' + (c.ancha ? 'ancha' : '') + '"><img alt="' + esc(c.pie) + '" src="data:' + (MIME[ext] || 'image/jpeg') + ';base64,' + b64 + '"><figcaption><b>' + esc(c.tarea || '') + '</b>' + esc(c.pie) + '</figcaption></figure>'; } catch (e) { }
}
if (!htmlEnsenar) htmlEnsenar = '<p class="nota">Aún no hay capturas de tareas.</p>';
// Markdown mínimo: títulos, viñetas, tablas y párrafos
function informeHtml(texto) {
  const out = []; let lst = [], tabla = [];
  const cierra = () => { if (lst.length) { out.push('<ul>' + lst.map(l => '<li>' + md(l) + '</li>').join('') + '</ul>'); lst = []; }
    if (tabla.length) { out.push('<div class="rollo"><table>' + tabla.map((f, i) => '<tr>' + f.map(c => (i ? '<td>' : '<th>') + md(c) + (i ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</table></div>'); tabla = []; } };
  for (const l of texto.split('\n')) {
    if (/^\s*\|/.test(l)) { if (lst.length) cierra(); if (!/^\s*\|[\s:|-]+\|\s*$/.test(l)) tabla.push(l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())); continue; }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) { if (tabla.length) cierra(); lst.push(l.replace(/^\s*([-*]|\d+\.)\s+/, '')); continue; }
    if (/^\s+\S/.test(l) && lst.length) { lst[lst.length - 1] += ' ' + l.trim(); continue; }
    cierra();
    const h = l.match(/^#+\s+(.*)/); if (h) out.push('<h3>' + md(h[1]) + '</h3>'); else if (l.trim() && !/^```/.test(l)) out.push('<p>' + md(l) + '</p>');
  }
  cierra(); return out.join('');
}
let htmlInformes = '';
for (const inf of (config.informes || []).slice().reverse()) {
  try { htmlInformes += '<details class="informe"><summary>' + esc(inf.titulo) + '</summary><div class="md">' + informeHtml(await readFile(join(RAIZ, inf.archivo), 'utf8')) + '</div></details>'; } catch (e) { }
}

/* ---------- CM3 · Arte: una foto de cada pieza, por grupos, con «Pedir cambio» (lista y fotos: node gobierno/arte-fotos.mjs) ---------- */
const GRUPOS_ARTE = [['soldado', 'Soldados de las batallas', 'Los que ves luchar de cerca.'], ['tropa', 'Tropas del mapa y de los retratos', 'Las figuras del mapa, los retratos y la ciudad.'],
  ['personaje', 'Personajes de las clases y la política', 'Hechos con Meshy. Aún no están dentro del juego.'], ['edificio', 'Edificios romanos', ''], ['cultura', 'Edificios de otros pueblos', 'Griegos, púnicos, galos e íberos.'],
  ['barco', 'Barcos', ''], ['arbol', 'Árboles', ''], ['objeto', 'Objetos de la ciudad', ''], ['escena', 'Mapa y escenas', 'Lo que se dibuja por código: mapa, ciudad, campos, batalla y menús.']];
let piezasArte = []; try { piezasArte = JSON.parse(await lee('arte-piezas.json')).piezas || []; } catch (e) { avisa('falta gobierno/arte-piezas.json: ejecuta node gobierno/arte-fotos.mjs'); }
let htmlArte = '', htmlArteIndice = '', pesoArte = 0, sinFoto = 0; const A_LA_VISTA = 4;
for (const [g, rot, nota] of GRUPOS_ARTE) {
  const ps = piezasArte.filter(p => p.grupo === g); if (!ps.length) continue;
  let fichas = '';
  for (const [i, p] of ps.entries()) {
    let foto = '<span class="sinfoto">Sin foto</span>';
    if (p.foto) try { const b = await readFile(join(RAIZ, p.foto)); pesoArte += b.length; foto = '<img loading="lazy" width="240" height="240" alt="' + esc(p.nombre) + '" src="data:image/jpeg;base64,' + b.toString('base64') + '">'; } catch (e) { sinFoto++; }
    else sinFoto++;
    fichas += '<figure class="pieza' + (i >= A_LA_VISTA ? ' mas' : '') + '" data-marca="' + esc(p.id) + '">' + foto + '<figcaption><b>' + esc(p.nombre) + '</b><span class="nota">' + esc(p.origen) + ' · ' + esc(p.licencia) + '</span></figcaption>' +
      '<button class="boton fino" data-hoja="arte" data-ref="' + esc(p.id) + '" data-titulo="' + esc(p.nombre) + '">Pedir cambio</button></figure>';
  }
  htmlArteIndice += '<a class="chip" href="#arte-' + g + '">' + esc(rot.split(' ')[0]) + ' <b>' + ps.length + '</b></a>';
  htmlArte += '<section class="grupo-arte" id="arte-' + g + '" aria-labelledby="ta-' + g + '"><h2 id="ta-' + g + '">' + esc(rot) + ' <span class="n">' + ps.length + '</span></h2>' + (nota ? '<p class="nota">' + esc(nota) + '</p>' : '') +
    '<div class="piezas">' + fichas + '</div>' + (ps.length > A_LA_VISTA ? '<button class="boton vermas" data-vermas aria-expanded="false" data-n="' + (ps.length - A_LA_VISTA) + '">Ver ' + (ps.length - A_LA_VISTA) + ' más</button>' : '') + '</section>';
}
if (sinFoto) avisa(sinFoto + ' piezas de arte sin foto');

/* ---------- CM3 · Equipos: qué hace cada uno, lo último que entregó, su cola y «Recomendar mejora» (gobierno/equipos.json) ---------- */
/* La misma función reparte aquí los partes y las tareas y, en la página, las sesiones vivas: se copia tal cual al navegador. */
function equipoDe(E, x) {
  var t = String(x.titulo || '').replace(/^AQVILA\s*·\s*/i, '').slice(0, 70), id = String(x.id || ''), i, e, m;
  if (!id) { m = t.match(/(?:^|·\s*)([A-Z][A-Za-z]{0,3}\d[\w-]*)/); if (m) id = m[1]; }
  for (i = 0; i < E.length; i++) { e = E[i]; if (e.gana && e.titulo && new RegExp(e.titulo, 'i').test(t)) return e.id; }
  for (i = 0; i < E.length; i++) { e = E[i]; if (id && e.ids && new RegExp(e.ids).test(id)) return e.id; }
  for (i = 0; i < E.length; i++) { e = E[i]; if (e.titulo && new RegExp(e.titulo, 'i').test(t)) return e.id; }
  for (i = 0; i < E.length; i++) { e = E[i]; if ((x.area && e.areas.indexOf(x.area) >= 0) || (x.organo && e.organos.indexOf(x.organo) >= 0)) return e.id; }
  return '';
}
let cfgEquipos = { equipos: [], orden: [] }; try { cfgEquipos = JSON.parse(await lee('equipos.json')); } catch (e) { avisa('falta gobierno/equipos.json'); }
const EQ = cfgEquipos.equipos, porEquipo = new Map(EQ.map(e => [e.id, { ahora: [], ultimo: [], cola: [] }]));
// partes de los últimos días: el más nuevo primero (hora de su primer commit; si no hay git, la fecha del nombre)
{ const horas = new Map();
  try { const { execSync } = await import('node:child_process');
    let h = 0; for (const l of execSync('git log --since=10.days --diff-filter=A --name-only --format=%ct -- gobierno/partes/', { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 }).toString().split('\n')) { if (/^\d+$/.test(l)) h = +l; else if (l) horas.set(l.split('/').pop(), h); } } catch (e) { }
  const { readdir } = await import('node:fs/promises');
  const fs = (await readdir(join(AQUI, 'partes'))).filter(f => /^\d{4}-\d\d-\d\d-.+\.md$/.test(f)).sort().slice(-90).map(f => ({ f, dia: f.slice(0, 10), h: horas.get(f) || Date.parse(f.slice(0, 10)) / 1000 })).sort((a, b) => b.h - a.h);
  for (const { f, dia } of fs) {
    const id = f.slice(11, -3).replace(/-(maquetas|aspecto|codigo)$/, '');
    let tit = ''; try { tit = ((await readFile(join(AQUI, 'partes', f), 'utf8')).match(/^#\s+(.*)/m) || [])[1] || ''; } catch (e) { }
    tit = plano(tit).replace(/^Parte\b\s*·?\s*/i, '').replace(new RegExp('^' + id.replace(/[-]/g, '\\-') + '\\b\\s*·?\\s*'), '').replace(/\s*[·(,]?\s*\(?\d{1,2}(?:[–-]\d{1,2})?\/11(?:\/2026)?\)?\s*$/, '').replace(/^«([^«»]*)»$/, '$1').trim();
    const eq = porEquipo.get(equipoDe(EQ, { id, titulo: tit })); if (eq && eq.ultimo.length < 3) eq.ultimo.push({ id, tit: tit.charAt(0).toUpperCase() + tit.slice(1), dia: +dia.slice(8) + '/' + +dia.slice(5, 7) });
  } }
// cola: las tareas del tablero sin pausa, en su orden; el órgano de su línea decide si el ID no dice nada
const organoDe = id => { const l = lineas.find(x => x.id === enLinea.get(id)); return l ? l.organo : ''; };
for (const { t, c } of listaPend) { if (t.pausa) continue; const eq = porEquipo.get(equipoDe(EQ, { id: t.id, titulo: corto(t.texto), organo: organoDe(t.id) })); if (eq && eq.cola.length < 3) eq.cola.push({ id: t.id, tit: plano((t.texto.match(/\*\*(.+?)\*\*/) || [])[1] || corto(t.texto)).replace(/\s*\([^)]*$/, ''), medias: t.est === '🔶' }); }
for (const x of sesiones) { const eq = porEquipo.get(equipoDe(EQ, { id: x.tarea, titulo: x.titulo })); if (eq) eq.ahora.push(x); }
const filaEq = (id, txt, cola) => '<li><b>' + esc(id) + '</b><span>' + esc(txt) + (cola || '') + '</span></li>';
let htmlEquipos = '', htmlEquiposIndice = '';
for (const id of cfgEquipos.orden) {
  const e = EQ.find(x => x.id === id), d = porEquipo.get(id); if (!e) continue;
  htmlEquiposIndice += '<a class="chip" href="#eq-' + id + '">' + esc(e.nombre) + ' <b data-eq-n="' + id + '">' + (d.ahora.length || '') + '</b></a>';
  htmlEquipos += '<article class="ficha equipo" id="eq-' + id + '" data-marca="' + id + '"><p class="cab"><b class="nom">' + esc(e.nombre) + '</b><span class="de">' + esc(e.de) + '</span></p><p class="nota">' + esc(e.que) + '</p>' +
    '<p class="rotulo">Qué hace ahora</p><ul class="mini eq" data-eq-ahora="' + id + '">' + (d.ahora.map(x => filaEq(x.tarea || '', (x.titulo || '').replace(/^[^·]{1,12}·\s*\S+\s+/, ''))).join('') || '<li class="nota">Ninguna sesión apuntada.</li>') + '</ul>' +
    '<p class="rotulo">Lo último que entregó</p><ul class="mini eq">' + (d.ultimo.map(x => filaEq(x.id, x.tit, ' <i class="dia">' + x.dia + '</i>')).join('') || '<li class="nota">Nada en los últimos partes.</li>') + '</ul>' +
    '<p class="rotulo">Lo siguiente en su cola</p><ul class="mini eq">' + (d.cola.map(x => filaEq(x.id, x.tit, x.medias ? ' <i class="dia">a medias</i>' : '')).join('') || '<li class="nota">Nada suyo en el tablero sin pausa.</li>') + '</ul>' +
    '<div class="fila"><button class="boton lleno" data-hoja="mejora" data-ref="' + id + '" data-titulo="' + esc(e.nombre) + '">Recomendar mejora</button>' + (id === 'arte' ? '<a class="boton" href="#arte">Ver el arte</a>' : '') + '</div></article>';
}
const equiposJs = 'var EQUIPOS = ' + JSON.stringify(EQ.map(e => ({ id: e.id, nombre: e.nombre, ids: e.ids, titulo: e.titulo, gana: !!e.gana, areas: e.areas, organos: e.organos }))).replace(/</g, '\\u003c') + ';\n  ' + equipoDe.toString();

/* ---------- CM4 · Tu móvil y lo que falta: cada tarea de cada línea, en uno de 4 colores (calculado con git, sin red) ---------- */
/* movil = ya en origin/main · subir = hecha en la rama de trabajo, no en main · obra = 🔶 o con sesión · rama = en otra rama sin unir · falta */
const MOVIL_EST = { movil: 'en tu móvil', subir: 'hecho, sin subir', obra: 'en obra', rama: 'en una rama sin unir', falta: 'falta' };
let htmlMovil = '', movilCab = '', movilLlega = '', movilNota = '', llegaN = 0;
{
  const { execSync } = await import('node:child_process');
  const git = a => { try { return execSync('git ' + a, { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000, maxBuffer: 256 << 20 }).toString(); } catch (e) { return null; } };
  const rama = 'origin/' + (config.rama || 'claude/roman-strategy-mobile-game-bx9oq2'), main = 'origin/main';
  const hayGit = git('rev-parse --verify -q ' + main) !== null && git('rev-parse --verify -q ' + rama) !== null;
  const version = ref => ((git('show ' + ref + ':sw.js') || '').match(/CACHE\s*=\s*'aqvila-(v[\w.]+)'/) || [])[1] || '';
  // los commits que tocan algo fuera de gobierno/ (los apuntes del vigía nombran tareas que aún no están hechas)
  const SEP = '\u0001';
  const mensajes = rango => (git('log --no-merges --format=' + SEP + '%s%n%b ' + rango + ' -- . ":(exclude)gobierno"') || '').split(SEP).filter(Boolean);
  const todasIds = [...new Set(lineas.flatMap(l => l.tareas || []))];
  // MN4b o MN4c cuentan como MN4, salvo que el tablero las tenga como tareas propias (CG6b no es CG6)
  const reId = new Map(todasIds.map(id => [id, new RegExp('(?<![\\w])' + id.replace(/[-]/g, '\\-') + '([a-z]{1,2})?(?![\\w]|-\\d)', 'g')]));
  const nombra = (m, id, re) => [...m.matchAll(re)].some(x => !x[1] || !porId.has(id + x[1]));
  const nombradas = msgs => { const s = new Set(); for (const m of msgs) for (const [id, re] of reId) if (!s.has(id) && nombra(m, id, re)) s.add(id); return s; };
  let soloRama = new Set(), otras = new Map(), vMain = '', vRama = '', horaMain = null;
  if (hayGit) {
    vMain = version(main); vRama = version(rama);
    horaMain = new Date(Number((git('log -1 --format=%ct ' + main) || '0').trim()) * 1000);
    soloRama = nombradas(mensajes(main + '..' + rama));
    // otras ramas remotas: lo que tienen y no está ni en la rama de trabajo ni en main
    const refs = (git('for-each-ref "--format=%(refname:short)" refs/remotes/origin') || '').split('\n').map(s => s.trim()).filter(r => r && r !== 'origin' && r !== 'origin/HEAD' && r !== main && r !== rama);
    for (const r of refs) for (const id of nombradas(mensajes(r + ' --not ' + rama + ' ' + main))) { if (!otras.has(id)) otras.set(id, []); otras.get(id).push(r.replace(/^origin\//, '')); }
  } else avisa('CM4: sin las ramas de git (origin/main y la rama de trabajo); la pestaña «Tu móvil» sale sin colores de git');
  const enSesion = new Set(sesiones.map(x => x.tarea).filter(Boolean));
  const color = id => {
    const t = porId.get(id);
    if (t?.est === '✅') return soloRama.has(id) ? 'subir' : 'movil';
    if (t?.est === '🔶' || enSesion.has(id)) return 'obra';
    if (otras.has(id)) return 'rama';
    return 'falta';
  };
  const ORDEN = ['movil', 'subir', 'obra', 'rama', 'falta'];
  const llega = new Map();
  const segsLinea = l => {
    const ts = l.tareas || [];
    let s = ts.map(id => ({ id, c: color(id) }));
    // la línea manda: si no está hecha y sus tareas ya no dejan hueco, queda un trozo gris por lo que falta sin tarea
    if (!ts.length) s = l.estado === 'hecha' ? [{ id: '', c: 'movil' }] : l.estado === 'medias' ? [{ id: '', c: 'movil' }, { id: '', c: 'falta' }] : [{ id: '', c: 'falta' }];
    else if (l.estado !== 'hecha' && !s.some(x => x.c === 'falta')) s.push({ id: '', c: 'falta' });
    for (const x of s) if (x.c === 'subir' && !llega.has(x.id)) llega.set(x.id, l);
    return s.sort((a, b) => ORDEN.indexOf(a.c) - ORDEN.indexOf(b.c));
  };
  const tit = id => { const t = porId.get(id); return t ? plano((t.texto.match(/\*\*(.+?)\*\*/) || [])[1] || corto(t.texto)).replace(/\s*\([^)]*\)/g, '').replace(/\s*\([^)]*$/, '').trim() : ''; };
  for (const o of organos) {
    let filas = '';
    for (const l of lineas.filter(x => x.organo === o.id)) {
      const s = segsLinea(l), n = c => s.filter(x => x.c === c).length, pc = Math.round(100 * n('movil') / s.length);
      const resumen = ORDEN.filter(c => n(c)).map(c => n(c) + ' ' + MOVIL_EST[c]).join(', ');
      const detalle = (l.tareas || []).map(id => { const c = color(id); return '<li class="m-' + c + '" data-mid="' + esc(id) + '"><i aria-hidden="true"></i><b>' + esc(id) + '</b> <span>' + esc(tit(id)) + '</span> <em>' + esc(MOVIL_EST[c]) + (c === 'rama' ? ' (' + esc(otras.get(id).slice(0, 2).join(', ')) + ')' : '') + '</em></li>'; }).join('');
      filas += '<details class="mlinea"><summary><span class="mcab"><span class="que">' + esc(l.titulo) + '</span><span class="pc">' + pc + ' %</span></span>' +
        '<span class="mbarra" role="img" aria-label="' + esc(l.titulo + ': ' + resumen) + '">' + s.map(x => '<i class="m-' + x.c + '"' + (x.id ? ' data-mid="' + esc(x.id) + '"' : '') + '></i>').join('') + '</span></summary>' +
        '<div class="cuerpo">' + (detalle ? '<ul class="mtareas">' + detalle + '</ul>' : '<p class="nota">Sin tareas en el tablero: el color sale del estado de la línea (' + esc((MARCA[l.estado] || MARCA.falta)[2]) + ').</p>') +
        (l.estado !== 'hecha' && (l.tareas || []).length && s.at(-1).c === 'falta' && !s.at(-1).id ? '<p class="nota">El trozo gris del final es lo que la línea aún pide y no tiene tarea.</p>' : '') + '</div></details>';
    }
    htmlMovil += '<section aria-labelledby="tm-' + esc(o.id) + '"><h2 id="tm-' + esc(o.id) + '">' + esc(o.nombre) + '</h2><div class="mlineas">' + filas + '</div></section>';
  }
  const madrid = { timeZone: 'Europe/Madrid' }, hoyEs = d => d.toLocaleDateString('es-ES', madrid) === new Date().toLocaleDateString('es-ES', madrid);
  if (horaMain) {
    const dia = hoyEs(horaMain) ? 'de hoy' : 'del ' + horaMain.toLocaleDateString('es-ES', { ...madrid, day: 'numeric', month: 'long' });
    const hora = horaMain.toLocaleTimeString('es-ES', { ...madrid, hour: '2-digit', minute: '2-digit' });
    movilCab = 'Tu móvil tiene la versión <b>' + esc(vMain || '¿?') + '</b> ' + dia + ' a las <b>' + hora + '</b>; lo último terminado es <b>' + esc(vRama || '¿?') + '</b>.';
  } else movilCab = 'No se pudo leer qué versión tiene tu móvil.';
  const ls = [...llega.entries()]; llegaN = ls.length;
  movilLlega = ls.length ? ls.slice(0, 8).map(([id, l]) => '<li><b>' + esc(id) + '</b> ' + esc(tit(id)) + ' <span class="nota">· ' + esc(l.titulo) + '</span></li>').join('') + (ls.length > 8 ? '<li class="nota">y ' + (ls.length - 8) + ' más</li>' : '')
    : '<li class="nota">Nada: todo lo terminado ya está en tu móvil.</li>';
  movilNota = 'Calculado por los mensajes de commit' + (hayGit ? ' a las ' + new Date().toLocaleTimeString('es-ES', { ...madrid, hour: '2-digit', minute: '2-digit' }) : '') + ': una tarea hecha cuenta como subida salvo que sus cambios solo estén en la rama de trabajo. Puede fallar si un commit no nombra su tarea. «En obra» se refresca solo con las sesiones abiertas.';
}

/* ---------- CM5 · La 1.0 arriba del todo: camino (gobierno/camino.json), juzgarla (colección «juicio») y hacia la 2.0 ---------- */
/* El % es el del menú del juego (bitácora 24/11): (hechas + ½ a medias) / total de lineas de lista.json. */
const pct10 = lineas.length ? Math.round(100 * (lineas.filter(l => l.estado === 'hecha').length + lineas.filter(l => l.estado === 'medias').length / 2) / lineas.length) : 0;
const ESPANA = { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' };
const horaEs = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('es-ES', ESPANA); };
const EST_CAMINO = { hecho: ['si', '✔', 'hecho'], prueba: ['medias', '◐', 'en prueba'], esperando: ['falta', '○', 'esperando'] };
let camino = { pasos: [], riesgos: [] }; try { camino = JSON.parse(await lee('camino.json')); } catch (e) { avisa('CM5: falta o no se lee gobierno/camino.json'); }
let htmlCamino = '', htmlMarcasCamino = '', caminoCuando = '';
for (const [i, p] of (camino.pasos || []).entries()) {
  if (!EST_CAMINO[p.estado]) avisa('CM5: el paso ' + (i + 1) + ' de camino.json tiene un estado raro («' + p.estado + '»); vale hecho, prueba o esperando');
  const [c, s, t] = EST_CAMINO[p.estado] || EST_CAMINO.esperando;
  const cuando = p.hora ? '~' + horaEs(p.hora) + (p.hasta ? '–' + horaEs(p.hasta) : '') : (p.cuando || '');
  htmlCamino += '<li class="paso p-' + c + '"><span class="pn">' + (i + 1) + '</span><span class="pq">' + md(p.que || '') + '<span class="pd"><b>' + esc(cuando) + '</b>' + (p.pct != null ? ' · <span class="nw">al acabar ' + esc(p.pct) + ' %</span>' : '') + '</span></span>' +
    '<span class="marca ' + c + '"><i aria-hidden="true">' + s + '</i>' + t + '</span></li>';
  if (p.pct != null && p.pct > pct10 && p.pct < 100) htmlMarcasCamino += '<i style="left:' + Number(p.pct) + '%" title="Paso ' + (i + 1) + ': ' + esc(p.pct) + ' %"></i>';
}
if (!htmlCamino) htmlCamino = '<li class="nota">Aún no hay plan apuntado en gobierno/camino.json.</li>';
const ultimo = (camino.pasos || []).filter(p => p.hora).at(-1);
if (ultimo) caminoCuando = 'Fin previsto: <b>~' + esc(horaEs(ultimo.hora)) + '</b> (hora de España).';
if (camino.actualizado) { const d = new Date(camino.actualizado); caminoCuando += (caminoCuando ? ' ' : '') + 'Plan puesto al día ' + (isNaN(d) ? esc(camino.actualizado) : 'el ' + d.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long' }) + ' a las ' + horaEs(camino.actualizado)) + '.'; }
else avisa('CM5: camino.json sin «actualizado»');
const htmlRiesgos = (camino.riesgos || []).length ? '<p class="riesgos"><b>Riesgos:</b> ' + (camino.riesgos || []).map(md).join(' · ') + '</p>' : '';
// juzgar: una prueba por línea de la lista, en el orden de los órganos
const htmlJuicio = organos.map(o => {
  const ls = lineas.filter(l => l.organo === o.id); if (!ls.length) return '';
  return '<p class="rotulo">' + esc(o.nombre) + '</p>' + ls.map(l => { const id = esc(l.id);
    return '<li class="juicio" data-juicio="' + id + '"><p class="jq"><b>' + esc(l.titulo) + '</b><span>Prueba: ' + esc((l.veras || '').charAt(0).toLowerCase() + (l.veras || '').slice(1)) + '</span></p>' +
      '<p class="jv nota" data-jv="' + id + '">Sin juzgar.</p>' +
      '<div class="fila"><button class="boton fino" data-juzgar="bien" data-ref="' + id + '" data-titulo="' + esc(l.titulo) + '">Bien</button><button class="boton fino" data-abrir="jm-' + id + '">Mal + nota</button></div>' +
      '<div class="cambio" id="jm-' + id + '" hidden><label class="quien" for="jt-' + id + '">Qué falla en «' + esc(l.titulo) + '»</label><textarea id="jt-' + id + '"></textarea>' +
      '<div class="fila"><button class="boton lleno" data-juzgar="mal" data-ref="' + id + '" data-titulo="' + esc(l.titulo) + '" data-texto="jt-' + id + '">Guardar «Mal»</button></div></div></li>'; }).join('');
}).join('');
if (!lineas.length) avisa('CM5: no hay líneas que juzgar en lista.json');

const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const datos = {
  PCT10: pct10, PCT10_QUEDA: 100 - pct10, CAMINO: htmlCamino, CAMINO_MARCAS: htmlMarcasCamino, CAMINO_CUANDO: caminoCuando, RIESGOS: htmlRiesgos, JUICIO: htmlJuicio,
  FECHA: fecha, JUEGO: esc(config.juego), VEREDICTO: esc(veredicto), VEREDICTO_CLASE: vClase, FRASE: esc(lista.frase || ''), VIGIA: esc(config.vigia || ''),
  ORGANOS: htmlOrganos, COMPROBACIONES: htmlComprob, TE_ESPERAN: htmlTeEsperan,
  N_LINEAS: lineas.length, LISTA_PROPUESTA: htmlPropuesta, LISTA: htmlLista, RESTO: htmlResto, RESTO_RESUMEN: esc(resumenResto), N_NEVERA: nevera.length, NEVERA: htmlNevera,
  ESPERA: htmlEspera, COLA: htmlCola, N_ESP: vistas.length, TAB_DECIDIR_OCULTO: vistas.length ? '' : 'hidden',
  MARCHA: htmlMarcha, N_MARCHA: sesiones.length, PENDIENTE: htmlPendiente, CHIPS: htmlChips, N_ACTIVAS: nActivas, N_TODAS: listaPend.length, N_PAUSA: nPausa, N_HECHAS: nHechas, CARRILES: htmlCarriles,
  ARTE: htmlArte, ARTE_INDICE: htmlArteIndice, N_ARTE: piezasArte.length, EQUIPOS: htmlEquipos, EQUIPOS_INDICE: htmlEquiposIndice, EQUIPOS_JS: equiposJs, MOVIL: htmlMovil, MOVIL_CAB: movilCab, MOVIL_LLEGA: movilLlega, MOVIL_NOTA: esc(movilNota), N_LLEGA: llegaN,
  HECHOS: hechos.map(h => '<li>' + md(h) + '</li>').join(''), ENSENAR: htmlEnsenar, INFORMES: htmlInformes, CAPTURAS: htmlCapturas, CAPTURAS_NOTA: esc(notaCapturas),
};
const html = (await lee('cuadro.plantilla.html')).replace(/\{\{(\w+)\}\}/g, (_, k) => datos[k] ?? '');
await writeFile(join(AQUI, 'cuadro.html'), html);
console.log('Cuadro generado: gobierno/cuadro.html · ' + Math.round(html.length / 1024) + ' KB · lista ' + lista.estado + ' de ' + lineas.length + ' líneas · ' + vistas.length + ' preguntas a la vista y ' + enCola + ' en cola · ' + nevera.length + ' ideas en la nevera · ' + piezasArte.length + ' piezas de arte (' + Math.round(pesoArte / 1024) + ' KB de fotos) · ' + EQ.length + ' equipos · ' + avisos.length + ' avisos');
