#!/usr/bin/env node
/* AQVILA — juez de aspecto de los departamentos de batalla (DB0, 25/11; PLAN-2.0 «Departamentos de batalla»).
   Uso: node gobierno/juez-aspecto.mjs animacion|graficos     (lo lanza `node gobierno/juez-area.mjs <área>`)
        node gobierno/juez-aspecto.mjs <id>                   (J20b: cualquier ficha gobierno/aspecto/<id>.md, p. ej. m2-ciudad)
        node gobierno/juez-aspecto.mjs --todas                (J20b: todas las fichas del directorio; lo pasa la subida, gobierno/jueces.mjs)
   Lee la ficha de objetivo gobierno/aspecto/<id>.md y comprueba, sin navegador (segundos):
     · «Lo que se tiene que ver»: entre 8 y 12 cosas concretas, numeradas.
     · «Referencias»: al menos dos; cada ruta `gobierno/...` que cite existe.
     · «Captura de partida»: al menos una captura y existe en el repositorio.
     · «Exámenes»: tabla con al menos una fila. Cada fila con «Cierra: sí» necesita nota ≥ «Nota mínima» (8,5), quien juzga
       escrito y sus capturas presentes. Sin examen que cierre, el juez da APTO y dice la última nota y lo que falta.
   La nota la pone una sesión que NO construyó (examen), mirando capturas contra la ficha. Este juez no mira píxeles:
   comprueba que la ficha está completa y que nadie cierra por debajo de la nota. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(RAIZ, 'gobierno', 'aspecto');
const FICHAS = existsSync(DIR) ? readdirSync(DIR).filter(f => /^[\w-]+\.md$/.test(f)).map(f => f.slice(0, -3)).sort() : [];
const arg = process.argv[2], TODAS = arg === '--todas';
const VALEN = [...new Set(['animacion', 'graficos', ...FICHAS])];   // las dos de batalla valen siempre (si falta su ficha, el juez lo dice)
if (!TODAS && !VALEN.includes(arg)) { console.error('Uso: node gobierno/juez-aspecto.mjs ' + VALEN.join('|') + '|--todas'); process.exit(2); }
if (TODAS && !FICHAS.length) { console.error('No hay fichas en gobierno/aspecto/.'); process.exit(2); }
let malas = 0;
for (const id of TODAS ? FICHAS : [arg]) { if (TODAS) console.log('· ficha ' + id); if (juzga(id)) malas++; }
if (TODAS) console.log(`${malas ? 'NO APTO' : 'APTO'} · juez de aspecto · ${FICHAS.length} fichas (${FICHAS.join(', ')})${malas ? ' · ' + malas + ' con fallos' : ''}`);
process.exit(malas ? 1 : 0);

/* comprueba una ficha con las varas de siempre; devuelve el número de fallos */
function juzga(id) {
const RUTA = `gobierno/aspecto/${id}.md`;
let fallos = 0;
const ok = (c, msg) => { console.log((c ? '  ok    ' : '  FALLA ') + msg); if (!c) fallos++; return c; };
if (!ok(existsSync(join(RAIZ, RUTA)), 'ficha de objetivo ' + RUTA)) { console.log('NO APTO · juez de aspecto · ' + id); return fallos; }

const txt = readFileSync(join(RAIZ, RUTA), 'utf8');
const seccion = t => { const m = new RegExp('^## ' + t + '\\s*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))', 'm').exec(txt); return m ? m[1] : ''; };
const num = s => +String(s).replace(',', '.');
const existe = r => existsSync(join(RAIZ, r));
const rutas = s => [...s.matchAll(/`((?:gobierno|js|test|assets)\/[^`\s]+)`/g)].map(m => m[1]);

const minima = num((/^Nota mínima:\s*([\d,.]+)/m.exec(txt) || [])[1]);
ok(minima >= 8.5, `nota mínima ${minima || '?'} (regla del usuario: ≥ 8,5)`);

const cosas = seccion('Lo que se tiene que ver').split('\n').filter(l => /^\d+\.\s+\S/.test(l));
ok(cosas.length >= 8 && cosas.length <= 12, `lo que se tiene que ver: ${cosas.length} cosas (de 8 a 12)`);

const refs = seccion('Referencias').split('\n').filter(l => /^-\s+\S/.test(l));
ok(refs.length >= 2, `referencias: ${refs.length} (al menos 2)`);
for (const r of rutas(seccion('Referencias'))) { const r2 = r.endsWith('/') || existe(r) ? r : join('gobierno/estudios', r.split('/').pop()); ok(existe(r) || existe(r2), 'referencia existe: ' + r); }

const caps = rutas(seccion('Captura de partida')).filter(r => /\.(jpe?g|png|webp)$/.test(r));
ok(caps.length >= 1, `captura de partida: ${caps.length}`);
for (const c of caps) ok(existe(c), 'captura existe: ' + c);

const filas = seccion('Exámenes').split('\n').filter(l => /^\|/.test(l) && !/^\|\s*-/.test(l) && !/^\|\s*Fecha/.test(l))
  .map(l => l.split('|').slice(1, -1).map(c => c.trim()));
ok(filas.length >= 1, `exámenes apuntados: ${filas.length}`);
for (const [fecha, tarea, quien, nota, cierra, capturas] of filas) {
  if (!/^s[ií]$/i.test(cierra || '')) continue;
  const n = num(nota);
  ok(!!quien && quien !== '—', `${tarea} (${fecha}): juzga «${quien || '?'}», que no la construyó`);
  ok(n >= minima, `${tarea} (${fecha}) cierra con nota ${nota} (mínima ${String(minima).replace('.', ',')})`);
  for (const c of (capturas || '').split(/[\s,;]+/).filter(Boolean)) ok(existe(c), `${tarea}: captura ${c}`);
}
const ult = filas[filas.length - 1];
if (ult) console.log(`  nota  última: ${ult[3]} (${ult[1]}, ${ult[0]}). Para cerrar una tarea hace falta ≥ ${String(minima).replace('.', ',')}.`);
console.log(`${fallos ? 'NO APTO' : 'APTO'} · juez de aspecto · ${id}`);
return fallos;
}
