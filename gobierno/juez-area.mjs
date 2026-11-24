#!/usr/bin/env node
/* AQVILA — juez de área y portero de archivos (gobierno/MINISTERIOS.md; tabla en gobierno/areas.json).
   Uso:  node gobierno/juez-area.mjs batallas              pasa las pruebas del área (lógica y navegador)
         node gobierno/juez-area.mjs batallas --rapido     solo la lógica del área (segundos o pocos minutos)
         node gobierno/juez-area.mjs batallas --archivos [base]   dice de quién es cada archivo cambiado desde <base>
                                                           (por defecto origin/claude/roman-strategy-mobile-game-bx9oq2)
         node gobierno/juez-area.mjs --dueno js/ui.js      dice de quién es un archivo
         node gobierno/juez-area.mjs batallas --todo       repite también las pruebas sin cambios (JZ1: por defecto se saltan)
   JZ1: cada prueba guarda en gobierno/jueces-cache.json la huella de sus archivos al dar APTO; si no cambió ninguno, no se repite.
   Sale con código 1 si falla una prueba o si se tocó un archivo vetado (de otra área).
   NO sustituye a los jueces completos: esos se pasan una vez, antes de subir a main (los pasa la sesión de subida). */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cierre, servido, huella, leer as leeMemoria, guardar as guardaMemoria } from './jueces-cache.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = JSON.parse(readFileSync(join(RAIZ, 'gobierno', 'areas.json'), 'utf8'));
const args = process.argv.slice(2);

const casa = (patron, ruta) => patron.endsWith('/') && !patron.includes('*') ? ruta.startsWith(patron)
  : new RegExp('^' + patron.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + (patron.endsWith('/') ? '' : '$')).test(ruta);

// De quién es una ruta: { clase: 'area' | 'comun' | 'vigia' | 'libre' | 'nadie', area?, taller? }. Gana el patrón más largo.
function dueno(ruta) {
  let mejor = { clase: 'nadie', largo: -1 };
  const prueba = (lista, d) => { for (const p of lista || []) if (casa(p, ruta) && p.length > mejor.largo) mejor = { ...d, largo: p.length }; };
  prueba(T.comunes.archivos, { clase: 'comun' });
  prueba(T.comunes.solo_vigia, { clase: 'vigia' });
  prueba(T.libres.archivos, { clase: 'libre' });
  for (const [id, a] of Object.entries(T.areas)) { prueba(a.propios, { clase: 'area', area: id }); prueba(a.taller, { clase: 'area', area: id, taller: true }); }
  return mejor;
}
const dice = d => d.clase === 'area' ? `de ${d.area}${d.taller ? ' (taller)' : ''}${T.areas[d.area].en_vigor ? '' : ' [aún no en vigor]'}`
  : d.clase === 'comun' ? 'COMÚN: solo la sesión «de paso»' : d.clase === 'vigia' ? 'solo el vigía' : d.clase === 'libre' ? 'libre (archivos nuevos con tu ID)' : 'sin dueño: pregunta al vigía';

if (args[0] === '--dueno') { for (const r of args.slice(1)) console.log(r + ' → ' + dice(dueno(r))); process.exit(0); }

const id = args[0], A = T.areas[id];
if (!A) { console.error('Áreas: ' + Object.keys(T.areas).join(', ') + '. Uso en la cabecera de este archivo.'); process.exit(2); }
console.log(`Juez de área · ${A.nombre}${A.en_vigor ? '' : ' · PROPUESTA, no en vigor'}`);

const git = (...a) => spawnSync('git', a, { cwd: RAIZ, encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
function cambiados(base) {
  const s = new Set([...git('diff', '--name-only', base + '...HEAD'), ...git('diff', '--name-only', 'HEAD'), ...git('ls-files', '--others', '--exclude-standard')]);
  return [...s].sort();
}

if (args.includes('--archivos')) {
  const base = args[args.indexOf('--archivos') + 1] || 'origin/claude/roman-strategy-mobile-game-bx9oq2';
  let vetados = 0, pases = 0;
  for (const r of cambiados(base)) {
    const d = dueno(r);
    const mio = d.clase === 'area' && d.area === id, ajeno = d.clase === 'area' && !mio && T.areas[d.area].en_vigor;
    const marca = mio || d.clase === 'libre' ? '  ok   ' : ajeno || d.clase === 'vigia' ? ' VETADO' : d.clase === 'comun' ? '  PASE ' : ' aviso ';
    if (marca === ' VETADO') vetados++; if (marca === '  PASE ') pases++;
    console.log(marca + ' ' + r + (mio ? '' : '  ← ' + dice(d)));
  }
  console.log(vetados ? `NO APTO: ${vetados} archivo(s) vetado(s). Deshazlos o pásaselos a su dueño en el parte.`
    : pases ? `Con ${pases} archivo(s) comunes: hace falta ser la sesión «de paso» (pregunta al vigía) o pedir el pase en el parte.` : 'Archivos: todo en casa.');
  process.exit(vetados ? 1 : 0);
}

const tocaArte = cambiados('origin/claude/roman-strategy-mobile-game-bx9oq2').some(r => r.startsWith('assets/') || r.startsWith('tools/'));
const lista = [...A.juez.logica, ...(args.includes('--rapido') ? [] : A.juez.navegador), ...(tocaArte ? A.juez.si_toca_arte : [])];
const t0 = Date.now(); let fallos = 0;
const MEM = leeMemoria(), TODO = args.includes('--todo'); let saltadas = 0;
/* archivos de los que depende cada prueba: lo que importa en cadena; si abre un navegador o recorre carpetas, todo lo que se sirve */
const huellaDe = p => { const f = p.split(' ')[0], c = cierre([f]); const nav = /--area|playwright/.test(p + c.map(x => /\.m?js$/.test(x) ? /playwright|readdirSync|readdir\(/.test(readFileSync(join(RAIZ, x), 'utf8')) ? ' playwright' : '' : '').join(''));
  return huella([...c, ...(nav ? servido() : []), 'gobierno/juez-area.mjs', 'gobierno/jueces-cache.mjs']); };
for (const p of lista) {
  const clave = 'area:' + p, h = huellaDe(p), m = MEM[clave];
  if (!TODO && m && m.ok && m.huella === h) { saltadas++; console.log(`  ok   ${p} (sin cambios desde su APTO del ${m.fecha.slice(0, 16).replace('T', ' ')}; memoria)`); continue; }
  const t = Date.now(), r = spawnSync(process.execPath, p.split(' '), { cwd: RAIZ, encoding: 'utf8', timeout: 2400000 });   // MIN4: «archivo --opción valor»
  const ok = r.status === 0; if (!ok) fallos++;
  if (ok) { const mm = leeMemoria(); mm[clave] = { huella: h, ok: true, fecha: new Date().toISOString() }; guardaMemoria(mm); }
  console.log(`${ok ? '  ok  ' : ' FALLA'} ${p} (${Math.round((Date.now() - t) / 1000)} s)`);
  if (!ok) console.log(((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-12).map(l => '        ' + l).join('\n'));
}
console.log(`${fallos ? 'NO APTO' : 'APTO'} · área ${id} · ${lista.length} pruebas${saltadas ? ' (' + saltadas + ' sin cambios, de memoria)' : ''} · ${Math.round((Date.now() - t0) / 1000)} s${args.includes('--rapido') ? ' · solo lógica' : ''}`);
process.exit(fallos ? 1 : 0);
