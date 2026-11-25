#!/usr/bin/env node
/* AQVILA — juez de navegador del Departamento de Arte de Mapas (AM0, 25/11).
   Uso: node gobierno/juez-mapas.mjs            (lo lanza `node gobierno/juez-area.mjs mapas`)
   Abre el juego en un navegador (playwright, 390×844, dpr 1) con gobierno/captura-mapa.mjs, entra al mapa de campaña y
   saca dos capturas: Italia entera y Grecia (el sitio del mapa vivo de la 2.0). Deja en gobierno/capturas-area/mapas/:
     AM-juez-italia.jpg, AM-juez-grecia.jpg
   APTO si: el script acaba bien, sin errores de consola, cada captura existe y no está vacía (> 15 KB: una pantalla negra
   o en blanco pesa menos), el mapa pinta triángulos y arranca en menos de 20 s.
   AM2 (25/11): además lanza gobierno/captura-mapa-grecia.mjs AM-juez modo=juez dir=gobierno/capturas-area/mapas dpr=1 (el mapa vivo de
   Grecia: AM-juez-vivo-a.jpg y AM-juez-vivo-b.jpg, pantalla en vertical y gestos de pellizco y arrastre con dedos de verdad).
   FALLA si: sale con código ≠ 0 (incluye cualquier FALLA suyo y los errores de consola), falta una captura o pesa < 15 KB,
   alguna pinta más de 150 000 triángulos o 120 llamadas, o el arranque pasa de 20 000 ms.
   Las capturas hay que MIRARLAS: el juez no juzga la belleza (eso es el «juez de aspecto», nota ≥ 7, en AM1–AM2). */
import { spawnSync } from 'node:child_process';
import { existsSync, statSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = 'gobierno/capturas-area/mapas', PREF = 'AM-juez', VISTAS = ['italia', 'grecia'];
for (const v of VISTAS) rmSync(join(RAIZ, DIR, `${PREF}-${v}.jpg`), { force: true });   // que no valga una captura vieja

const r = spawnSync(process.execPath, ['gobierno/captura-mapa.mjs', PREF, 'vistas=' + VISTAS.join(','), 'dpr=1', 'dir=' + DIR],
  { cwd: RAIZ, encoding: 'utf8', timeout: 900000 });
const sal = (r.stdout || '') + (r.stderr || '');
let fallos = 0;
const ok = (c, msg) => { console.log((c ? '  ok    ' : '  FALLA ') + msg); if (!c) fallos++; };

ok(r.status === 0, 'captura-mapa.mjs termina bien' + (r.status === 0 ? '' : ' (código ' + r.status + ')'));
ok(/Sin errores de consola\./.test(sal), 'sin errores de consola');
for (const v of VISTAS) {
  const f = join(RAIZ, DIR, `${PREF}-${v}.jpg`), kb = existsSync(f) ? statSync(f).size / 1024 : 0;
  const tri = +(new RegExp(`${PREF}-${v}\\.jpg · (\\d+) triángulos`).exec(sal) || [])[1] || 0;
  ok(kb > 15, `captura ${v}: ${kb.toFixed(0)} KB`);
  ok(tri > 0, `mapa pintado en ${v}: ${tri} triángulos`);
}
const ms = +(/Arranque del mapa: (\d+) ms/.exec(sal) || [])[1];
ok(ms > 0 && ms < 20000, 'arranque del mapa: ' + (ms || '?') + ' ms (tope 20 000 con render por software)');

// AM2: el mapa vivo de Grecia
const VIVO = ['vivo-a', 'vivo-b'];
for (const v of VIVO) rmSync(join(RAIZ, DIR, `${PREF}-${v}.jpg`), { force: true });
const g = spawnSync(process.execPath, ['gobierno/captura-mapa-grecia.mjs', PREF, 'modo=juez', 'dir=' + DIR, 'dpr=1'], { cwd: RAIZ, encoding: 'utf8', timeout: 600000 });
const sg = (g.stdout || '') + (g.stderr || '');
ok(g.status === 0, 'captura-mapa-grecia.mjs termina bien (sin FALLA propios)' + (g.status === 0 ? '' : ' (código ' + g.status + ')'));
ok(/Sin errores de consola\./.test(sg), 'mapa de Grecia: sin errores de consola');
for (const v of VIVO) {
  const f = join(RAIZ, DIR, `${PREF}-${v}.jpg`), kb = existsSync(f) ? statSync(f).size / 1024 : 0;
  const m = new RegExp(`${PREF}-${v}\\.jpg · (\\d+) triángulos · (\\d+) llamadas`).exec(sg), tri = m ? +m[1] : -1, ll = m ? +m[2] : -1;
  ok(kb >= 15, `captura ${v}: ${kb.toFixed(0)} KB`);
  ok(tri > 0 && tri <= 150000 && ll > 0 && ll <= 120, `${v}: ${tri} triángulos (tope 150 000), ${ll} llamadas (tope 120)`);
}
const ar = +(/arranque del mapa: (\d+) ms/.exec(sg) || [])[1];
ok(ar > 0 && ar <= 20000, 'arranque del mapa de Grecia: ' + (ar || '?') + ' ms (tope 20 000)');
for (const l of sg.split('\n')) if (/^(gesto|pantalla) /.test(l)) console.log('        ' + l);
if (g.status !== 0) console.log(sg.trim().split('\n').filter(l => /FALLA|ERROR|EXCEP/.test(l)).slice(0, 8).map(l => '        ' + l).join('\n'));

if (fallos) console.log(sal.trim().split('\n').slice(-15).map(l => '        ' + l).join('\n'));
console.log(`${fallos ? 'NO APTO' : 'APTO'} · juez de mapas · capturas en ${DIR}/ (míralas)`);
process.exit(fallos ? 1 : 0);
