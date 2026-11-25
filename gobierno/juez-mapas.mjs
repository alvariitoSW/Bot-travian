#!/usr/bin/env node
/* AQVILA — juez de navegador del Departamento de Arte de Mapas (AM0, 25/11).
   Uso: node gobierno/juez-mapas.mjs            (lo lanza `node gobierno/juez-area.mjs mapas`)
   Abre el juego en un navegador (playwright, 390×844, dpr 1) con gobierno/captura-mapa.mjs, entra al mapa de campaña y
   saca dos capturas: Italia entera y Grecia (el sitio del mapa vivo de la 2.0). Deja en gobierno/capturas-area/mapas/:
     AM-juez-italia.jpg, AM-juez-grecia.jpg
   APTO si: el script acaba bien, sin errores de consola, cada captura existe y no está vacía (> 15 KB: una pantalla negra
   o en blanco pesa menos), el mapa pinta triángulos y arranca en menos de 20 s.
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

if (fallos) console.log(sal.trim().split('\n').slice(-15).map(l => '        ' + l).join('\n'));
console.log(`${fallos ? 'NO APTO' : 'APTO'} · juez de mapas · capturas en ${DIR}/ (míralas)`);
process.exit(fallos ? 1 : 0);
