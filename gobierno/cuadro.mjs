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

const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const datos = {
  FECHA: fecha, JUEGO: esc(config.juego), VEREDICTO: esc(veredicto), VEREDICTO_CLASE: vClase, FRASE: esc(lista.frase || ''), VIGIA: esc(config.vigia || ''),
  ORGANOS: htmlOrganos, COMPROBACIONES: htmlComprob, TE_ESPERAN: htmlTeEsperan,
  N_LINEAS: lineas.length, LISTA_PROPUESTA: htmlPropuesta, LISTA: htmlLista, RESTO: htmlResto, RESTO_RESUMEN: esc(resumenResto), N_NEVERA: nevera.length, NEVERA: htmlNevera,
  ESPERA: htmlEspera, COLA: htmlCola, N_ESP: vistas.length, TAB_DECIDIR_OCULTO: vistas.length ? '' : 'hidden',
  MARCHA: htmlMarcha, N_MARCHA: sesiones.length, PENDIENTE: htmlPendiente, CHIPS: htmlChips, N_ACTIVAS: nActivas, N_TODAS: listaPend.length, N_PAUSA: nPausa, N_HECHAS: nHechas, CARRILES: htmlCarriles,
  HECHOS: hechos.map(h => '<li>' + md(h) + '</li>').join(''), ENSENAR: htmlEnsenar, INFORMES: htmlInformes, CAPTURAS: htmlCapturas, CAPTURAS_NOTA: esc(notaCapturas),
};
const html = (await lee('cuadro.plantilla.html')).replace(/\{\{(\w+)\}\}/g, (_, k) => datos[k] ?? '');
await writeFile(join(AQUI, 'cuadro.html'), html);
console.log('Cuadro generado: gobierno/cuadro.html · ' + Math.round(html.length / 1024) + ' KB · lista ' + lista.estado + ' de ' + lineas.length + ' líneas · ' + vistas.length + ' preguntas a la vista y ' + enCola + ' en cola · ' + nevera.length + ' ideas en la nevera · ' + avisos.length + ' avisos');
