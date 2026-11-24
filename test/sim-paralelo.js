/* JZ1: reparte las campañas largas de test/sim.test.js entre varios procesos (las 100 partidas del bot eran ≈45–60 min seguidas).
   - Al cargarse desde test/sim.test.js arranca N «obreros» (este mismo archivo con SIM_OBRERO) que juegan las campañas de TAREAS
     en orden, cada una en su proceso. El proceso principal sigue con el resto de pruebas y, al llegar a cada campaña, recoge
     el resultado; si nadie la ha empezado, la juega él. Mismo bot (test/campana-bot.js), misma semilla: mismo resultado.
   - Los criterios de aprobado no cambian: siguen en test/sim.test.js y se miran en el proceso principal.
   - SIM_HILOS=1 lo hace todo en serie, como antes. Por defecto: un obrero por núcleo; el principal casi solo espera y recoge. */
const fs = require('fs'), os = require('os'), path = require('path');
const { spawn } = require('child_process');

const clave = (ag, seed, region, opciones) => JSON.stringify([!!ag, seed || 0, region || null, opciones || null]);
/* las campañas que se juegan fuera, en el orden en que las pide test/sim.test.js. ctx: el estado del juego que tiene alrededor */
const TAREAS = [];
for (const ag of [false, true]) for (let sd = 1; sd <= 10; sd++) TAREAS.push({ k: clave(ag, sd), a: [ag, sd], ctx: 'base' });
for (const ag of [false, true]) for (let sd = 1; sd <= 10; sd++) TAREAS.push({ k: clave(ag, sd, 'italia'), a: [ag, sd, 'italia'], ctx: 'base' });
/* Partida corta (60 partidas, ≈1 h en serie): SOLO con SIM_CORTA_FUERA=1, en pruebas. Medido el 24/11: jugadas fuera, «fundar» dio 0/10
   victorias del agresivo; en serie, sin medir aún (el bloque I8-a deja en D cambios de pruebas anteriores que un proceso nuevo no tiene).
   Hasta comprobar que salen igual que en serie, se juegan en el proceso principal, como siempre. */
if (process.env.SIM_CORTA_FUERA) {
for (const ini of ['enPie', 'fundar']) for (const ag of [true, false]) for (let sd = 1; sd <= 10; sd++) { const o = { modo: 'corta', inicio: ini }; TAREAS.push({ k: clave(ag, sd, null, o), a: [ag, sd, null, o], ctx: 'corta' }); }
for (const ini of ['enPie', 'fundar']) for (let sd = 1; sd <= 10; sd++) { const o = { modo: 'corta', inicio: ini, investiga: true }; TAREAS.push({ k: clave(true, sd, null, o), a: [true, sd, null, o], ctx: 'corta' }); }
}
const indice = {}; TAREAS.forEach((t, i) => { indice[t.k] = i; });
const toma = (dir, i) => { try { fs.closeSync(fs.openSync(path.join(dir, i + '.toma'), 'wx')); return true; } catch (e) { return false; } };   // el primero que crea el archivo se la queda
const duerme = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/* el contexto que la campaña tiene en test/sim.test.js: «base» (bloques 5 e I6: sin almacén del navegador, ciudad nueva enchufada)
   o «corta» (bloque I8-a: ciudad nueva y un localStorage en memoria) */
function contexto(ctx) {
  const G = require('../js/game.js');
  G.usarCiudad(require('../js/ciudad.js')); G.usarMercado(null);
  if (ctx === 'corta') { const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } }; }
  else delete global.localStorage;
}

if (process.env.SIM_OBRERO) {   // ---- obrero: juega en orden las campañas que nadie ha tomado ----
  const dir = process.env.SIM_OBRERO, { campaign } = require('./campana-bot.js');
  for (let i = 0; i < TAREAS.length; i++) {
    if (!toma(dir, i)) continue;
    const t = TAREAS[i];
    try { contexto(t.ctx); const s = campaign(...t.a); fs.writeFileSync(path.join(dir, i + '.tmp'), JSON.stringify(s)); fs.renameSync(path.join(dir, i + '.tmp'), path.join(dir, i + '.json')); }
    catch (e) { try { fs.writeFileSync(path.join(dir, i + '.err'), String(e && e.stack || e)); } catch (x) { process.exit(1); } }
  }
  process.exit(0);
}

/* ---- proceso principal ---- */
const HILOS = Math.max(1, +process.env.SIM_HILOS || os.cpus().length);
let DIR = null; const hijos = [];
if (HILOS > 1) {
  DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'aqvila-sim-'));
  for (let i = 0; i < HILOS; i++) hijos.push(spawn(process.execPath, [__filename], { env: Object.assign({}, process.env, { SIM_OBRERO: DIR }), stdio: ['ignore', 'inherit', 'inherit'] }));
  for (const h of hijos) h.unref();   // al acabar las pruebas el proceso sale sin esperarlos (y el «exit» de abajo los cierra)
  process.on('exit', () => { for (const h of hijos) try { h.kill(); } catch (e) { } try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) { } });
}

function campana(ag, seed, region, opciones) {
  const { campaign } = require('./campana-bot.js'), i = indice[clave(ag, seed, region, opciones)];
  if (!DIR || i === undefined || !fs.existsSync(DIR) || toma(DIR, i)) return campaign(ag, seed, region, opciones);   // nadie la ha empezado (o no se reparte): la juega este proceso
  const f = path.join(DIR, i + '.json'), err = path.join(DIR, i + '.err'), t0 = Date.now();
  while (!fs.existsSync(f)) {
    if (fs.existsSync(err) || !fs.existsSync(DIR) || Date.now() - t0 > 45 * 60000) return campaign(ag, seed, region, opciones);   // falló fuera (o el obrero murió): se repite aquí para que el fallo salga con su mensaje
    duerme(150);
  }
  /* como si la hubiera jugado aquí: la partida queda en G.state y sus colonias fundadas, registradas en D (igual que al cargar).
     Así las pruebas que siguen ven lo mismo que en serie (p. ej. D.regionCiudades('italia', true) con la colonia del bot). */
  const s = JSON.parse(fs.readFileSync(f, 'utf8')), G = require('../js/game.js');
  G.state = s; if (G.quitarColonias && G.migrarColonias) { G.quitarColonias(); G.migrarColonias(s); }
  return s;
}

module.exports = { campana, TAREAS, HILOS };
