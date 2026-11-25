/* CM6 (usuario, 25/11: «los porcentajes siempre me aparecen mal»). Falla si:
   · la barra «Camino a la 1.0» no es la de sus pasos (gobierno/camino.json);
   · una línea sale «hecha» con tareas activas pendientes en el tablero;
   · gobierno/avance.mjs (menú del juego, js/novedades.js) y el cuadro dan % distintos.
   Genera el cuadro de verdad (gobierno/cuadro.mjs --sin-comprobar) y lee la página.
   Lee: gobierno/TABLERO.md, gobierno/lista.json, gobierno/camino.json, gobierno/cuadro.plantilla.html */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { RAIZ, estadoLineas, estadoLinea, leeTablero, pctCamino, pctDe, faseActual } from '../gobierno/estado-lineas.mjs';
import { avance } from '../gobierno/avance.mjs';

let malos = 0;
const ok = (c, t) => { console.log((c ? 'bien ' : 'MAL ') + t); if (!c) malos++; };

/* 1. las reglas, con un tablero de juguete */
{
  const { porId } = leeTablero(['## Carril Z — Prueba', '- ✅ A1 **hecha**', '- 🔶 A2 **a medias**', '- ⬜ A3 **sin empezar**',
    '- ⬜ (en pausa: después de la 1.0) A4 **en pausa**', '- ⬜ A5 **después por reparto**', '- ✅ A6 **hecha** Queda ⬜ A7: un resto'].join('\n'));
  const D = new Set(['A5']), e = ts => estadoLinea({ tareas: ts }, porId, D).estado;
  ok(e(['A1']) === 'hecha', 'todas hechas → hecha');
  ok(e(['A1', 'A4', 'A5']) === 'hecha', 'hechas + en pausa + después de la 1.0 → hecha');
  ok(e(['A4', 'A5']) === 'falta', 'solo en pausa o después, ninguna hecha → falta');
  ok(e(['A1', 'A3']) === 'medias', 'una hecha y una sin empezar → a medias');
  ok(e(['A2', 'A3']) === 'medias', 'una a medias → a medias');
  ok(e(['A3']) === 'falta', 'ninguna empezada → falta');
  ok(e(['A1', 'NOEXISTE']) === 'medias', 'una tarea que el tablero no tiene cuenta como pendiente');
  ok(e(['A6', 'A7']) === 'medias', '«Queda ⬜ X» de una hecha cuenta como pendiente');
  ok(estadoLinea({ tareas: [], falta: 'Nada para la 1.0.' }, porId, D).estado === 'hecha' && estadoLinea({ tareas: [], falta: 'Subir lo de batallas' }, porId, D).estado === 'falta', 'línea sin tareas: hecha solo si no le falta nada');
  ok(pctDe([{ estado: 'hecha' }, { estado: 'medias' }, { estado: 'falta' }, { estado: 'falta' }]) === 38, '% de la lista = (hechas + ½ a medias) / total');
  ok(pctCamino({ pasos: [{ pct: 60, estado: 'hecho' }, { pct: 100, estado: 'hecho' }] }) === 100, 'camino: todos los pasos hechos → 100 %');
  ok(pctCamino({ pasos: [{ pct: 60, estado: 'hecho' }, { pct: 80, estado: 'prueba' }, { pct: 100, estado: 'esperando' }] }) === 60, 'camino: el % del último paso hecho');
}

/* 2. el tablero de hoy: ninguna línea «hecha» con tareas activas */
const EL = estadoLineas(), A = avance();
for (const l of EL.lineas) if (l.estado === 'hecha' && l.activas.length) ok(false, l.id + ' sale «hecha» con tareas activas pendientes: ' + l.activas.join(', '));
ok(EL.lineas.every(l => l.estado !== 'hecha' || !l.activas.length), 'ninguna de las ' + EL.lineas.length + ' líneas sale «hecha» con tareas activas');
ok(EL.lineas.every(l => l.estadoEscrito == null), 'lista.json no escribe el estado de las líneas a mano');

/* 3. avance.mjs = estado-lineas = js/novedades.js */
ok(A.hecho === EL.pct, 'avance.mjs da ' + A.hecho + ' % y estado-lineas ' + EL.pct + ' %');
const N = createRequire(import.meta.url)('../js/novedades.js');
ok(JSON.stringify(N.avance) === JSON.stringify(A), 'el menú del juego (js/novedades.js) tiene el ' + (N.avance && N.avance.hecho) + ' % y avance.mjs da ' + A.hecho + ' % (si no: node gobierno/avance.mjs)');

/* 4. el cuadro generado */
try { execFileSync(process.execPath, ['gobierno/cuadro.mjs', '--sin-comprobar'], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 }); }
catch (e) { ok(false, 'cuadro.mjs no se genera: ' + String(e.stderr || e.message).slice(0, 300)); }
const html = readFileSync(join(RAIZ, 'gobierno/cuadro.html'), 'utf8');
const camino = JSON.parse(readFileSync(join(RAIZ, 'gobierno/camino.json'), 'utf8')), pc = pctCamino(camino);
const secCamino = (html.match(/<section class="ficha camino" aria-labelledby="t-camino">[\s\S]*?<\/section>/) || [''])[0];
const cab = secCamino.match(/<div class="cpct"><b>(\d+) %<\/b><span>hecho · queda (\d+) %/), barra = secCamino.match(/<div class="cbarra"[^>]*aria-label="(\d+) % hecho[^"]*"><span style="width:(\d+)%">/);
ok(cab && +cab[1] === pc && +cab[2] === 100 - pc, 'camino: el cuadro dice ' + (cab ? cab[1] + ' % hecho · queda ' + cab[2] : '¿?') + ' % y sus pasos dan ' + pc + ' %');
ok(barra && +barra[1] === pc && +barra[2] === pc, 'camino: la barra va al ' + (barra ? barra[2] : '¿?') + ' % y sus pasos dan ' + pc + ' %');
const pl = html.match(/Objetivos de la lista: (\d+) %/);
ok(pl && +pl[1] === A.hecho, 'el cuadro da «Objetivos de la lista: ' + (pl ? pl[1] : '¿?') + ' %» y el menú del juego ' + A.hecho + ' %');
/* 5. fase dinámica: si el tablero tiene metas («Carril 2.0 · M1 …»), arriba sale la meta en curso con su % y la 1.0 va plegada */
{
  const T = leeTablero(['## Carril 2.0 · M1 Prueba (plan `x.md`)', '  - ✅ B1 **a**', '  - 🔶 B2 **b**', '  - ⬜ B3 **c**', '  - ⬜ (en pausa) B4 **d**', '## Carril 2.0 · M2 Luego', '  - ⬜ B5 **e**'].join('\n'));
  const porId = T.porId, f = faseActual(T.tablero, porId, { pasos: [{ pct: 100, estado: 'hecho' }] });
  ok(f.version === '2.0' && f.meta.meta === 'M1' && f.meta.pct === 50 && f.meta.total === 3 && f.v10.terminada, 'fase: meta en curso M1 al 50 % (una hecha, una en obra, una sin empezar; la de pausa no cuenta)');
  const g = faseActual(leeTablero('## Carril V — Versión 1.0\n- ⬜ X1 **x**').tablero, porId, { pasos: [{ pct: 60, estado: 'hecho' }, { pct: 100, estado: 'esperando' }] });
  ok(g.version === '1.0' && !g.meta, 'fase: sin metas en el tablero, manda la 1.0');
}
const F = faseActual(EL.tablero, EL.porId, camino);
if (F.meta) {
  const cf = html.match(/<h2 id="t-fase">Ahora: ([^<]+)<\/h2><div class="cpct"><b>(\d+) %<\/b>/), bf = html.match(/aria-label="(\d+) % hecho de [^"]+"><span style="width:(\d+)%"><\/span><\/div><p class="nota">De sus/);
  ok(cf && cf[1].includes(F.version + ' · ' + F.meta.meta) && +cf[2] === F.meta.pct, 'arriba sale «Ahora: ' + F.version + ' · ' + F.meta.meta + '» con ' + F.meta.pct + ' % (el cuadro: ' + (cf ? cf[1] + ', ' + cf[2] + ' %' : '¿?') + ')');
  ok(bf && +bf[1] === F.meta.pct && +bf[2] === F.meta.pct, 'la barra de la meta va al ' + F.meta.pct + ' %');
  ok(!/<h2 id="t-camino">Camino a la 1\.0<\/h2>/.test(html) && /<details class="plegable v10"><summary>La 1\.0: /.test(html), 'la 1.0 ya no es lo principal: su camino va plegado');
}
const CLASE = { hecha: 'si', medias: 'medias', falta: 'falta' };
const malMarcadas = EL.lineas.filter(l => { const m = html.match(new RegExp('class="linea" data-ref="' + l.id + '"><summary><span class="marca (\\w+)"')); return !m || m[1] !== CLASE[l.estado]; });
ok(!malMarcadas.length, 'las líneas del cuadro llevan el estado del tablero' + (malMarcadas.length ? ' (mal: ' + malMarcadas.map(l => l.id).join(', ') + ')' : ''));

if (malos) { console.log('FALLO cuadro-porcentajes: ' + malos + ' comprobaciones mal'); process.exit(1); }
console.log('cuadro-porcentajes: ' + (F.meta ? 'fase ' + F.version + ' · ' + F.meta.meta + ' ' + F.meta.pct + ' %, ' : '') + 'camino de la 1.0 ' + pc + ' %, objetivos de la lista ' + A.hecho + ' % (' + A.hechas + ' hechas, ' + A.medias + ' a medias, ' + A.faltan + ' por hacer). OK');
