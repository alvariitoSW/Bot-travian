#!/usr/bin/env node
/* AQVILA — liga de bots desde partidas ya avanzadas (J20b, 25/11; decisión del usuario: «Bots desde partidas ya avanzadas: Sí»).
   La liga vieja (`node gobierno/jueces.mjs --liga`: test/sim.test.js entero, investigador y ajustes) juega todo desde el año 1 y
   tarda ~26 min. Esta juega solo la segunda mitad: carga guardados de mitad de partida y los acaba con el mismo bot de siempre
   (test/campana-bot.js), así se ve en pocos minutos cómo acaba una partida con cada bot.

   Uso:
     node gobierno/liga.mjs --hacer-partidas   genera (una vez) los guardados de mitad de partida en gobierno/liga/partidas/<id>.json.
                                               Son el texto que guarda el juego (G.exportar()): se cargan con G.load, como en el móvil.
     node gobierno/liga.mjs                    carga cada guardado y lo acaba con cada bot (pacífico, agresivo, el que investiga) y dos
                                               semillas fijas, repartido entre los núcleos (un proceso por partida). Escribe
                                               gobierno/liga/ultima.json y añade la pasada a gobierno/liga/historial.json (las 30 últimas).
     node gobierno/liga.mjs &                  en segundo plano: no frena ninguna subida (ver abajo).
   Vara (APTO / NO APTO): toda partida termina sin error y su estado sigue siendo serializable al final (G.exportar → G.load).
   Quién gana, el año de fin y la economía se INFORMAN; no deciden (no hay umbrales de victoria nuevos).

   No frena las subidas: la liga corre con prioridad baja (nice 19) y en su propio grupo de procesos, y deja un candado
   gobierno/liga/.corre (fuera de git) con su pid. Cuando `node gobierno/jueces.mjs` (sin --liga) empieza y hay una liga viva, la
   pausa entera (SIGSTOP al grupo) y la reanuda (SIGCONT) al acabar, también si falla o se corta. El tiempo de guardia de cada
   partida solo cuenta el rato en que la liga corre (no el de la pausa); los segundos que se informan son de procesador.
   Solo puede correr una liga a la vez: si el candado es de una liga viva, sale con error. */
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const ESTE = fileURLToPath(import.meta.url);
const RAIZ = join(dirname(ESTE), '..');
const DIR = join(RAIZ, 'gobierno', 'liga'), DIR_P = join(DIR, 'partidas');
const CANDADO = join(DIR, '.corre'), ULTIMA = join(DIR, 'ultima.json'), HISTORIAL = join(DIR, 'historial.json');
const SAVE_KEY = 'aqvila-save-v1';
const GUARDIA_MS = 15 * 60000;   // una partida que pasa de 15 min de trabajo (sin contar pausas) se da por colgada

/* los guardados de mitad de partida: de qué partida sale (bot, semilla, región o modo) y en qué año se para */
export const PARTIDAS = [
  { id: 'roma-pacifico-220', que: 'Campaña larga (Roma), bot pacífico, parada hacia el 220 a.C.', ag: false, semilla: 2, anio: 220 },
  { id: 'roma-agresivo-220', que: 'Campaña larga (Roma), bot agresivo, parada hacia el 220 a.C.', ag: true, semilla: 2, anio: 220 },
  { id: 'roma-agresivo-240', que: 'Campaña larga (Roma), bot agresivo, parada hacia el 240 a.C.', ag: true, semilla: 3, anio: 240 },
  { id: 'italia-pacifico-268', que: 'Italia, bot pacífico, parada hacia el 268 a.C.', ag: false, semilla: 1, region: 'italia', anio: 268 },
  { id: 'italia-agresivo-266', que: 'Italia, bot agresivo, parada hacia el 266 a.C.', ag: true, semilla: 2, region: 'italia', anio: 266 },
  { id: 'corta-enpie-agresivo-262', que: 'Partida corta «en pie», bot agresivo, parada hacia el 262 a.C.', ag: true, semilla: 1, opciones: { modo: 'corta', inicio: 'enPie' }, anio: 262 },
  { id: 'corta-fundar-pacifico-275', que: 'Partida corta «fundar», bot pacífico, parada hacia el 275 a.C.', ag: false, semilla: 2, opciones: { modo: 'corta', inicio: 'fundar' }, anio: 275 },
  { id: 'corta-fundar-agresivo-274', que: 'Partida corta «fundar», bot agresivo, parada hacia el 274 a.C.', ag: true, semilla: 3, opciones: { modo: 'corta', inicio: 'fundar' }, anio: 274 },
];
/* los bots que acaban cada guardado (los mismos de test/sim.test.js) y sus semillas fijas */
export const BOTS = { pacifico: { ag: false }, agresivo: { ag: true }, investiga: { ag: true, opciones: { investiga: true } } };
const NOMBRE_BOT = { pacifico: 'pacífico', agresivo: 'agresivo', investiga: 'investiga' };
const SEMILLAS = [11, 12];

const arg = process.argv.slice(2);
const HACER = arg.includes('--hacer-partidas');

/* ---------- obrero: juega una sola partida en su proceso y escribe el resultado en una línea JSON ---------- */
function juego() {
  const require = createRequire(import.meta.url);
  require('../js/data.js'); const G = require('../js/game.js');
  G.usarCiudad(require('../js/ciudad.js')); G.usarMercado(null);
  const store = {}; global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const bot = require('../test/campana-bot.js');
  const carga = txt => { store[SAVE_KEY] = txt; return G.load(); };
  return { G, bot, carga };
}
function obreroHacer(p) {
  const { G, bot, carga } = juego();
  const s = bot.campaign(p.ag, p.semilla, p.region, p.opciones, st => G.yearOf(st.t) <= p.anio);
  if (s.over) throw new Error('la partida terminó antes del ' + p.anio + ' a.C. (' + G.yearOf(s.t) + ': ' + s.over.why + '); elige otra semilla o año');
  const txt = G.exportar(), anio = G.yearOf(s.t), mias = G.myCities().length;
  if (!carga(txt)) throw new Error('el guardado recién hecho no se vuelve a cargar');
  writeFileSync(join(DIR_P, p.id + '.json'), txt);
  return { id: p.id, anio, ciudades: mias, kb: Math.round(txt.length / 1024) };
}
function obreroJugar(t) {
  const { G, bot, carga } = juego(), b = BOTS[t.bot], cpu0 = process.cpuUsage();
  if (!carga(readFileSync(join(DIR_P, t.partida + '.json'), 'utf8'))) throw new Error('no carga el guardado ' + t.partida);
  const anioIni = G.yearOf(G.state.t);
  bot.continuar(b.ag, t.semilla, b.opciones);
  const s = G.state, n = f => { try { const v = f(); return Number.isFinite(v) ? Math.round(v) : null; } catch (e) { return null; } };
  const r = { partida: t.partida, bot: t.bot, semilla: t.semilla, anioIni, gana: !!(s.over && s.over.win), motivo: s.over ? String(s.over.why || '') : '', anioFin: G.yearOf(s.t),
    denarios: n(() => G.disponible('denarios')), grano: n(() => G.prod().grano), ciudades: n(() => G.myCities().length),
    poblacion: n(() => G.myCities().reduce((a, id) => a + (s.cities[id].pop || 0), 0)) };
  /* vara: el estado sigue siendo serializable (el texto del guardado se lee y se vuelve a cargar) */
  let ser = false; try { const txt = G.exportar(); JSON.parse(txt); ser = carga(txt) && G.yearOf(G.state.t) === r.anioFin; } catch (e) { ser = false; }
  r.serializable = ser;
  const c = process.cpuUsage(cpu0); r.segundos = Math.round((c.user + c.system) / 1e5) / 10;
  return r;
}
if (arg[0] === '--obrero') {
  const t = JSON.parse(arg[1]);
  let out; try { out = { ok: true, r: t.hacer ? obreroHacer(t.hacer) : obreroJugar(t) }; } catch (e) { out = { ok: false, error: String(e && e.stack || e).split('\n').slice(0, 4).join(' | ') }; }
  process.stdout.write('\nRESULTADO ' + JSON.stringify(out) + '\n');
  process.exit(0);
}

/* ---------- jefe de la liga: grupo de procesos propio, prioridad baja y candado ---------- */
const vivaLiga = pid => { try { process.kill(pid, 0); return /liga\.mjs/.test(readFileSync('/proc/' + pid + '/cmdline', 'utf8')); } catch (e) { return false; } };
if (!process.env.LIGA_RELANZADA) {
  /* siempre se relanza en un grupo de procesos propio (y este proceso, fuera de él, solo espera): así la pausa (SIGSTOP al grupo)
     para la liga y nada más, y quien la lanzó (una terminal, un guion, jueces.mjs) no ve parado a su hijo directo */
  const h = spawn(process.execPath, [ESTE, ...arg], { detached: true, stdio: 'inherit', env: Object.assign({}, process.env, { LIGA_RELANZADA: '1' }) });
  for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => { try { process.kill(-h.pid, 'SIGCONT'); process.kill(-h.pid, sg); } catch (e) { } });
  h.on('exit', (code, sg) => process.exit(code === null ? 1 : code));
} else await jefe();

async function jefe() {
  mkdirSync(DIR_P, { recursive: true });
  if (existsSync(CANDADO)) {
    let c = null; try { c = JSON.parse(readFileSync(CANDADO, 'utf8')); } catch (e) { }
    if (c && c.pid !== process.pid && vivaLiga(c.pid)) { console.error('Ya corre una liga (pid ' + c.pid + ', desde ' + c.inicio + '). Espera a que acabe.'); process.exit(1); }
  }
  try { os.setPriority(0, 19); } catch (e) { }   // nice 19: los hijos lo heredan
  writeFileSync(CANDADO, JSON.stringify({ pid: process.pid, grupo: process.pid, inicio: new Date().toISOString(), que: HACER ? 'hacer-partidas' : 'liga' }) + '\n');
  const hijos = new Set();
  const suelta = () => { try { const c = JSON.parse(readFileSync(CANDADO, 'utf8')); if (c.pid === process.pid) unlinkSync(CANDADO); } catch (e) { } };
  process.on('exit', () => { for (const h of hijos) try { h.kill('SIGKILL'); } catch (e) { } suelta(); });
  for (const sg of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sg, () => process.exit(130));
  /* si quien la lanzó muere (p. ej. jueces.mjs la mata por tiempo), la liga no se queda huérfana */
  if (process.env.LIGA_RELANZADA) { const padre = process.ppid; setInterval(() => { if (process.ppid !== padre) process.exit(1); }, 5000).unref(); }

  const t0 = Date.now();
  const tareas = HACER ? PARTIDAS.map(p => ({ hacer: p, nombre: p.id }))
    : PARTIDAS.flatMap(p => Object.keys(BOTS).flatMap(bot => SEMILLAS.map(semilla => ({ partida: p.id, bot, semilla, nombre: p.id + ' · ' + NOMBRE_BOT[bot] + ' · semilla ' + semilla }))));
  if (!HACER) { const faltan = PARTIDAS.filter(p => !existsSync(join(DIR_P, p.id + '.json'))); if (faltan.length) { console.error('Faltan guardados (' + faltan.map(p => p.id).join(', ') + '): node gobierno/liga.mjs --hacer-partidas'); process.exit(1); } }
  const hilos = Math.max(1, Math.min(tareas.length, +process.env.LIGA_HILOS || os.cpus().length));
  console.log('Liga desde partidas a medias' + (HACER ? ' · haciendo ' + tareas.length + ' guardados' : ' · ' + tareas.length + ' partidas (' + PARTIDAS.length + ' guardados × ' + Object.keys(BOTS).length + ' bots × ' + SEMILLAS.length + ' semillas)') + ' · ' + hilos + ' a la vez');

  const resultados = new Array(tareas.length);
  const una = (t, i) => new Promise(ok => {
    const h = spawn(process.execPath, [ESTE, '--obrero', JSON.stringify(t)], { cwd: RAIZ, stdio: ['ignore', 'pipe', 'pipe'] }); hijos.add(h);
    let out = '', err = '', activo = 0, antes = Date.now();
    h.stdout.on('data', d => { out += d; }); h.stderr.on('data', d => { err += d; });
    /* guardia que no cuenta las pausas: si entre dos vueltas pasan más de 15 s, la liga estuvo parada y ese rato no suma */
    const reloj = setInterval(() => { const ahora = Date.now(), d = ahora - antes; antes = ahora; if (d < 15000) activo += d; if (activo > GUARDIA_MS) h.kill('SIGKILL'); }, 2000);
    h.on('close', (code, sg) => {
      clearInterval(reloj); hijos.delete(h);
      const m = /\nRESULTADO (.+)\n/.exec(out); let x = null; try { x = m && JSON.parse(m[1]); } catch (e) { }
      if (!x) x = { ok: false, error: activo > GUARDIA_MS ? 'pasó de ' + GUARDIA_MS / 60000 + ' min (colgada)' : 'el proceso acabó sin resultado (' + (sg || code) + '): ' + err.trim().split('\n').slice(-3).join(' | ') };
      resultados[i] = x;
      console.log((x.ok && (HACER || x.r.serializable) ? '  bien ' : '  MAL  ') + t.nombre + ' — ' + (!x.ok ? x.error : HACER ? 'parada en ' + x.r.anio + ' a.C., ' + x.r.ciudades + ' ciudades, ' + x.r.kb + ' KB'
        : (x.r.gana ? 'gana' : 'pierde') + ' en ' + x.r.anioFin + ' a.C. (' + x.r.motivo.slice(0, 80) + ') · ' + x.r.segundos + ' s' + (x.r.serializable ? '' : ' · NO SERIALIZABLE')));
      ok();
    });
  });
  const cola = tareas.map((t, i) => [t, i]);
  await Promise.all(Array.from({ length: hilos }, async () => { for (let x; (x = cola.shift());) await una(...x); }));
  const segundos = Math.round((Date.now() - t0) / 1000);

  if (HACER) {
    const malos = resultados.filter(x => !x.ok), grandes = resultados.filter(x => x.ok && x.r.kb > 300);
    for (const g of grandes) console.log('  AVISO ' + g.r.id + ' pesa ' + g.r.kb + ' KB (más de 300)');
    console.log((malos.length ? 'NO APTO' : 'APTO') + ' · guardados de la liga · ' + (resultados.length - malos.length) + '/' + resultados.length + ' hechos en gobierno/liga/partidas/ · ' + segundos + ' s');
    process.exit(malos.length ? 1 : 0);
  }

  /* ultima.json y la tendencia */
  const filas = resultados.map((x, i) => x.ok ? Object.assign({ ok: x.r.serializable }, x.r) : { ok: false, partida: tareas[i].partida, bot: tareas[i].bot, semilla: tareas[i].semilla, error: x.error });
  const media = l => l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : null;
  const porBot = {};
  for (const bot of Object.keys(BOTS)) { const l = filas.filter(f => f.bot === bot && f.ok);
    porBot[bot] = { victorias: l.filter(f => f.gana).length, total: filas.filter(f => f.bot === bot).length, anioMedio: media(l.map(f => f.anioFin)), denariosMedio: media(l.map(f => f.denarios).filter(v => v !== null)), ciudadesMedio: media(l.map(f => f.ciudades).filter(v => v !== null)) }; }
  const buenas = filas.filter(f => f.ok), malas = filas.filter(f => !f.ok);
  const resumen = { partidas: filas.length, bien: buenas.length, victorias: buenas.filter(f => f.gana).length, anioMedio: media(buenas.map(f => f.anioFin)), denariosMedio: media(buenas.map(f => f.denarios).filter(v => v !== null)), porBot };
  const commit = (spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: RAIZ, encoding: 'utf8' }).stdout || '').trim() || null;
  const ok = malas.length === 0, fecha = new Date().toISOString();
  const comprobaciones = [
    { nombre: 'Todas las partidas terminan sin error', ok: filas.every(f => !f.error), detalle: filas.filter(f => f.error).length + ' con error' },
    { nombre: 'El estado sigue siendo serializable al final', ok: filas.every(f => f.error || f.serializable), detalle: filas.filter(f => !f.error && !f.serializable).length + ' sin serializar' },
  ];
  const tmp = ULTIMA + '.tmp';
  writeFileSync(tmp, JSON.stringify({ fecha, commit, ok, segundos, nota: 'Las victorias, años y economía se informan; no deciden. Vara: terminar sin error y seguir siendo serializable.', comprobaciones, resumen,
    guardados: PARTIDAS.map(p => ({ id: p.id, que: p.que })), partidas: filas }, null, 1) + '\n'); renameSync(tmp, ULTIMA);
  let hist = []; try { hist = JSON.parse(readFileSync(HISTORIAL, 'utf8')); } catch (e) { }
  hist.push({ fecha, commit, ok, segundos, partidas: resumen.partidas, victorias: resumen.victorias, anioMedio: resumen.anioMedio, denariosMedio: resumen.denariosMedio,
    porBot: Object.fromEntries(Object.entries(porBot).map(([k, v]) => [k, v.victorias + '/' + v.total])) });
  writeFileSync(HISTORIAL, JSON.stringify(hist.slice(-30), null, 1) + '\n');
  console.log('Por bot: ' + Object.entries(porBot).map(([k, v]) => NOMBRE_BOT[k] + ' ' + v.victorias + '/' + v.total + ' (fin medio ' + v.anioMedio + ' a.C., ' + v.denariosMedio + ' denarios)').join(' · '));
  console.log((ok ? 'APTO' : 'NO APTO') + ' · liga desde partidas a medias · ' + buenas.length + '/' + filas.length + ' terminan y se guardan · victorias ' + resumen.victorias + '/' + filas.length +
    ' · ' + Object.entries(porBot).map(([k, v]) => NOMBRE_BOT[k] + ' ' + v.victorias + '/' + v.total).join(', ') + ' · ' + segundos + ' s');
  process.exit(ok ? 0 : 1);
}
