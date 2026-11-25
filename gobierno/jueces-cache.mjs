/* JZ1 — memoria de los jueces: no repetir una prueba si no cambió nada de lo que lee.
   Cada prueba tiene una «huella»: el hash de los archivos de los que depende. Si la huella es igual a la de su último APTO
   (guardado en gobierno/jueces-cache.json, que va en el repositorio para que lo vea la sesión siguiente), no se repite.
   - Pruebas de Node: sus archivos son el propio script y todo lo que importa (require/import relativos, en cadena), más los
     archivos que nombra entre comillas (p. ej. partida-vieja.json), más el juez que la lanza.
   - Navegador y guerra jugada: todo lo que se sirve al navegador (todo el repositorio salvo documentos, partes y pruebas de Node).
   Los criterios no cambian: lo que se salta es una prueba idéntica a una que ya dio APTO con los mismos archivos. */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVO = join(RAIZ, 'gobierno', 'jueces-cache.json');
const git = (...a) => spawnSync('git', a, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 1 << 28 }).stdout || '';

/* blob de git de cada archivo: el del índice si no cambió; si cambió o es nuevo, su contenido de hoy */
let _blobs = null;
function blobs() {
  if (_blobs) return _blobs;
  _blobs = new Map();
  for (const l of git('ls-files', '-s').split('\n')) { const m = /^\d+ ([0-9a-f]+) \d+\t(.+)$/.exec(l); if (m) _blobs.set(m[2], m[1]); }
  const sucios = new Set([...git('diff', '--name-only').split('\n'), ...git('diff', '--name-only', '--cached').split('\n'), ...git('ls-files', '--others', '--exclude-standard').split('\n')].filter(Boolean));
  for (const r of sucios) { const p = join(RAIZ, r); if (existsSync(p) && statSync(p).isFile()) _blobs.set(r, 'w' + createHash('sha1').update(readFileSync(p)).digest('hex')); else _blobs.delete(r); }
  return _blobs;
}

/* archivos de una prueba de Node: el script y sus importaciones relativas, en cadena */
export function cierre(inicio) {
  const vistos = new Set(), pila = [...inicio];
  while (pila.length) {
    const r = pila.pop(); if (vistos.has(r)) continue;
    const p = join(RAIZ, r); if (!existsSync(p) || !statSync(p).isFile()) continue;
    vistos.add(r); if (!/\.(m?js|cjs)$/.test(r)) continue;
    const txt = readFileSync(p, 'utf8'), dir = dirname(p);
    for (const m of txt.matchAll(/(?:require\(|import\(|from\s+)\s*['"`](\.{1,2}\/[^'"`]+)['"`]/g)) pila.push(relative(RAIZ, resolve(dir, m[1])));
    for (const m of txt.matchAll(/['"`]\/?([\w./-]+\.(?:json|js|mjs|cjs|txt|csv|html|css|webmanifest))['"`]/g)) {   // archivos nombrados (p. ej. __dirname + '/partida-vieja.json')
      for (const c of [resolve(dir, m[1]), resolve(RAIZ, m[1])]) { const rr = relative(RAIZ, c); if (!rr.startsWith('..') && existsSync(c) && statSync(c).isFile()) pila.push(rr); }
    }
  }
  return [...vistos].sort();
}

/* lo que ve el navegador: todo menos documentos, partes, estudios, capturas, pruebas de Node y la propia memoria */
const FUERA = [/\.md$/, /^gobierno\/(partes|estudios|capturas|capturas-area|capturas-tarea)\//, /^gobierno\/cuadro\.json$/, /^gobierno\/jueces-cache\.json$/, /^test\//, /^\.claude\//, /^\.github\//, /^gobierno\/liga\//];
export function servido() { return [...blobs().keys()].filter(r => !FUERA.some(x => x.test(r))).sort(); }

export function huella(archivos) {
  const b = blobs(), h = createHash('sha1').update(process.version + '\n');
  for (const r of [...new Set(archivos)].sort()) h.update(r + ' ' + (b.get(r) || 'nuevo:' + (existsSync(join(RAIZ, r)) ? createHash('sha1').update(readFileSync(join(RAIZ, r))).digest('hex') : 'no')) + '\n');
  return h.digest('hex').slice(0, 16);
}

export function leer() { try { return JSON.parse(readFileSync(ARCHIVO, 'utf8')); } catch (e) { return {}; } }
export function guardar(c) { writeFileSync(ARCHIVO, JSON.stringify(c, null, 1) + '\n'); }
