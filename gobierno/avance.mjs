/* CDe3 (usuario, 24/11): % de la 1.0 hecho, de la misma fuente que el cuadro (gobierno/lista.json, sus «lineas»).
   Fórmula: (hechas + ½·a medias) / total. Lo escribe en js/novedades.js entre las marcas AVANCE (el juego no lee gobierno/).
   Uso: node gobierno/avance.mjs   (--comprobar: solo dice si js/novedades.js está al día; sale con 1 si no) */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const R = join(dirname(fileURLToPath(import.meta.url)), '..');
export function avance() {
  const L = JSON.parse(readFileSync(join(R, 'gobierno/lista.json'), 'utf8')).lineas || [];
  const n = e => L.filter(l => l.estado === e).length, hechas = n('hecha'), medias = n('medias'), faltan = L.length - hechas - medias;
  return { hecho: Math.round(100 * (hechas + medias / 2) / Math.max(1, L.length)), total: L.length, hechas, medias, faltan,
    pendientes: L.filter(l => l.estado !== 'hecha').map(l => ({ t: l.titulo, e: l.estado === 'medias' ? 'a medias' : 'por hacer' })) };
}
const BLOQUE = a => '/* AVANCE: lo escribe gobierno/avance.mjs desde gobierno/lista.json; no tocar a mano */\n  const AVANCE = ' + JSON.stringify(a) + ';\n  /* FIN AVANCE */';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const f = join(R, 'js/novedades.js'), txt = readFileSync(f, 'utf8'), a = avance(), nuevo = txt.replace(/\/\* AVANCE:[\s\S]*?\/\* FIN AVANCE \*\//, BLOQUE(a));
  if (process.argv.includes('--comprobar')) { const ok = nuevo === txt; console.log(ok ? 'avance al día: ' + a.hecho + ' %' : 'FALLO: js/novedades.js no tiene el avance de lista.json (' + a.hecho + ' %): node gobierno/avance.mjs'); process.exit(ok ? 0 : 1); }
  writeFileSync(f, nuevo); console.log('Hacia la 1.0: ' + a.hecho + ' % hecho (' + a.hechas + ' hechas, ' + a.medias + ' a medias, ' + a.faltan + ' por hacer, de ' + a.total + ')');
}
