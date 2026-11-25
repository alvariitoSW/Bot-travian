/* CM6 (usuario, 25/11: «quiero que se arregle esa parte de los porcentajes que siempre me aparecen mal»).
   UNA sola fuente para el estado de las líneas de la 1.0 y para los %: lo usan gobierno/cuadro.mjs, gobierno/avance.mjs
   (que lo copia en js/novedades.js para el menú del juego) y test/cuadro-porcentajes.test.mjs.

   El estado de cada línea de gobierno/lista.json NO se escribe a mano: sale del tablero (gobierno/TABLERO.md).
   Cada tarea de una línea es:
     hecha    ✅ en el tablero
     aparte   ⬜/🔶 pero «(en pausa…)» en el tablero, o en reparto.despues de lista.json (después de la 1.0): no cuenta
     obra     🔶 (a medias), sin pausa
     pendiente ⬜ sin pausa, o una tarea que el tablero no tiene
   Y la línea:
     hecha    ninguna obra ni pendiente, y al menos una hecha
     medias   alguna hecha u obra, pero queda alguna obra o pendiente
     falta    ninguna hecha ni obra
   Una línea sin tareas: «hecha» si su texto «falta» está vacío o empieza por «Nada» (nada para la 1.0); si no, «falta».
   % de la lista = (hechas + ½·a medias) / total de líneas, redondeado.
   % del camino (gobierno/camino.json) = 100 si todos los pasos están hechos; si no, el «pct» del último paso hecho. */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/* une las líneas de continuación (sangradas) a su viñeta; una sub-viñeta con marca de tarea (  - ⬜ GP2 …) es una tarea propia */
export function vinetas(lineas) {
  const out = [];
  for (const l of lineas) {
    if (/^(-|\d+\.)\s/.test(l) || /^\s+-\s+(⬜|🔶|✅)/u.test(l)) out.push(l.trim().replace(/^(-|\d+\.)\s+/, ''));
    else if (/^\s+\S/.test(l) && out.length) out[out.length - 1] += ' ' + l.trim();
  }
  return out;
}
export function secciones(texto) {
  const s = {}; let actual = null;
  for (const l of texto.split('\n')) { const m = l.match(/^## (.+)/); if (m) { actual = m[1].trim(); s[actual] = []; } else if (actual) s[actual].push(l); }
  return s;
}
const CORTO = { A: 'Guerra', B: 'Ciudad', C: 'Mapa', D: 'Técnica', E: 'Arte', F: 'Modos', H: 'Historia', I: 'Gran diseño', J: 'Interfaz', K: 'Concurso', L: 'Interfaz guerra', N: 'Guerra nueva', O: 'Economía', V: 'Versión 1.0' };

/* el tablero en carriles y tareas; porId: la fila de cada id (si un id sale dos veces, gana la que no está hecha) */
export function leeTablero(texto) {
  const tablero = secciones(texto);
  const carriles = Object.keys(tablero).filter(k => /^Carril |^Gobierno/.test(k)).map(k => {
    const m = k.match(/^Carril (\w+) — (.+)/), letra = m ? m[1] : 'G', nombre = m ? m[2] : 'Gobierno';
    const tareas = vinetas(tablero[k]).flatMap(v => {
      // los ids pueden llevar guion (GM-K6a)
      const t = v.match(/^(⬜|🔶|✅)\s+(?:\((en pausa[^)]*)\)\s+)?([\w-]+)\s+(.*)$/u); if (!t) return [];
      const fila = [{ est: t[1], id: t[3], texto: t[4], pausa: t[2] || '' }];
      const q = t[1] === '✅' && t[4].match(/Queda ⬜ ([\w-]+):?\s*(.*)$/u);   // una hecha que deja una parte pendiente (p. ej. C2 → C2b)
      if (q) fila.push({ est: '⬜', id: q[1], texto: q[2], pausa: '', queda: true });
      return fila;
    });
    return { letra, nombre, corto: CORTO[letra] || nombre.replace(/\s*[\(—].*$/, ''), tareas };
  });
  // una parte «Queda ⬜ X» se olvida si X ya tiene su propia viñeta en el tablero
  const reales = new Set(carriles.flatMap(c => c.tareas.filter(t => !t.queda).map(t => t.id)));
  for (const c of carriles) c.tareas = c.tareas.filter(t => !t.queda || !reales.has(t.id));
  const porId = new Map();
  for (const c of carriles) for (const t of c.tareas) if (!porId.has(t.id) || t.est !== '✅') porId.set(t.id, t);
  return { tablero, carriles: carriles.filter(c => c.tareas.length), porId };
}

/* ids que lista.json manda a después de la 1.0 (reparto.despues) */
export const despuesDe = lista => new Set(((lista.reparto || {}).despues || []).flatMap(g => g.tareas || []));

export function claseTarea(id, porId, despues) {
  const t = porId.get(id);
  if (!t) return 'pendiente';
  if (t.est === '✅') return 'hecha';
  if (t.pausa || despues.has(id)) return 'aparte';
  return t.est === '🔶' ? 'obra' : 'pendiente';
}

export function estadoLinea(l, porId, despues) {
  const ts = l.tareas || [], c = { hecha: [], aparte: [], obra: [], pendiente: [] };
  for (const id of ts) c[claseTarea(id, porId, despues)].push(id);
  const activas = [...c.obra, ...c.pendiente];
  let estado;
  if (!ts.length) estado = !l.falta || /^\s*nada\b/i.test(l.falta) ? 'hecha' : 'falta';
  else if (!activas.length && c.hecha.length) estado = 'hecha';
  else if (c.hecha.length || c.obra.length) estado = 'medias';
  else estado = 'falta';
  return { estado, ...c, activas, sinTablero: ts.filter(id => !porId.has(id)) };
}

export const pctDe = ls => ls.length ? Math.round(100 * (ls.filter(l => l.estado === 'hecha').length + ls.filter(l => l.estado === 'medias').length / 2) / ls.length) : 0;

export function pctCamino(camino) {
  const ps = (camino && camino.pasos) || [];
  if (!ps.length) return 0;
  if (ps.every(p => p.estado === 'hecho')) return 100;
  const ult = ps.filter(p => p.estado === 'hecho' && p.pct != null).at(-1);
  return ult ? Number(ult.pct) : 0;
}

/* todo de una vez, leyendo los archivos (o los textos que se le den, para las pruebas) */
export function estadoLineas(o = {}) {
  const lee = f => readFileSync(join(o.raiz || RAIZ, 'gobierno', f), 'utf8');
  const lista = o.lista || JSON.parse(lee('lista.json'));
  const { porId, carriles, tablero } = leeTablero(o.tablero != null ? o.tablero : lee('TABLERO.md'));
  const despues = despuesDe(lista);
  const lineas = (lista.lineas || []).map(l => ({ ...l, estadoEscrito: l.estado, ...estadoLinea(l, porId, despues) }));
  return { lista, lineas, porId, carriles, tablero, despues, pct: pctDe(lineas) };
}
