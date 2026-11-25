// AQVILA — PN3: comarca aleatoria alrededor de la polis y arranque mínimo. node test/comarca.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js');
const CI = await import('../js/ciudad.js'); G.usarCiudad(CI);
const COM = await import('../js/comarca.js'); G.usarComarca(COM);
const { POLIS: MAPA, ZONAS } = await import('../js/gfx/mapa-grecia-datos.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const IDS = ['atenas', 'esparta', 'corinto', 'argos', 'tebas', 'megara', 'mileto', 'calcis'];
const nueva = (p, semilla) => { const s = G.newGame('Test', 'italia', { polis: p, semilla }); G.onEvent = null; return s; };
const casasE = E => E.parcelas.filter(l => l.casa && !l.casa.ruina);
const ZN = new Set(ZONAS.map(z => z.n));

t('cada polis tiene su perfil de comarca', () => { for (const id of IDS) { assert.ok(COM.PERFILES[id], id); for (const k in COM.PERFILES[id].terrenos) assert.ok(D.TERRENOS[k], id + ' ' + k); } });

for (const id of ['atenas', 'tebas', 'esparta', 'argos']) t('20 comarcas de ' + id + ': distintas, con agua, cultivo y ágora, coherentes', () => {
  const P = MAPA.find(p => p.id === id), vistas = new Set(), terrenos = new Set();
  for (let i = 0; i < 20; i++) { const k = COM.generar(id, 101 + i * 7919);
    assert.strictEqual(k.polis, id); vistas.add(k.semilla + '|' + k.terreno + '|' + k.sitio); terrenos.add(k.terreno);
    assert.ok(k.agua && k.cultivo && k.agora === true && k.sitio, 'agua, cultivo y ágora');
    assert.ok(k.cerca.length && k.cerca.every(z => ZN.has(z.n)), 'recursos cercanos con nombre de AM2');
    assert.strictEqual(k.lujo.id, P.lujo);
    const p = COM.personas(k.casas); assert.ok(k.casas.length >= 5 && k.casas.length <= 8 && p >= 100 && p <= 200, 'casas ' + k.casas.join(''));
    assert.deepStrictEqual(COM.generar(id, k.semilla), k, 'la misma semilla da la misma comarca');
    if (id === 'tebas') assert.ok(['llanura', 'pantano'].includes(k.terreno), 'Tebas nunca costa: ' + k.terreno);
    if (id === 'esparta') assert.ok(['rio', 'terrazas'].includes(k.terreno), 'Esparta: ' + k.terreno);
    if (id === 'tebas' && k.terreno === 'pantano') assert.strictEqual(k.agua, 'lago Copais');
    if (P.costa) assert.ok(k.puerto, 'polis de costa con su puerto');
    if (id === 'atenas') assert.ok(['costa', 'rio'].includes(k.terreno) && k.puerto === 'El Pireo'); }
  assert.strictEqual(vistas.size, 20, 'las 20 distintas'); assert.ok(terrenos.size >= 2, 'el terreno cambia de una partida a otra');
});

const arr = {};
for (const id of IDS) t('arranque de ' + id + ': ágora, 5-8 casas, 100-200 personas, 800 a.C.', () => {
  const s = nueva(id, 4242), c = s.cities.roma, E = G.ciudadE('roma'), cs = casasE(E);
  assert.ok(s.comarca && s.comarca.polis === id, 'comarca guardada'); assert.strictEqual(s.anio0, D.ANIO_POLIS); assert.strictEqual(D.ANIO_POLIS, 800);
  assert.strictEqual(G.yearOf(s.t), 800); assert.ok(/800 a\.C\./.test(G.dateStr(s.t)));
  assert.ok(E && E.foro, 'ágora fundada'); assert.strictEqual(D.BUILD.foro.n, 'Ágora'); assert.strictEqual(E.barrios[0].corto, 'Ágora');
  assert.ok(cs.length >= 5 && cs.length <= 8, cs.length + ' casas'); assert.ok(c.pop >= 100 && c.pop <= 200 && c.pop === CI.poblacion(E), 'personas ' + c.pop);
  assert.ok(!E.urbe, 'sin urbe de relleno'); assert.strictEqual(E.cultura, 'grie'); assert.strictEqual(E.terreno, s.comarca.terreno);
  const tipos = E.edificios.map(e => e.tipo).sort(); assert.ok(tipos.every(x => ['granja', 'granero', 'fuente'].includes(x)) && tipos.includes('fuente') && tipos.includes('granja') && tipos.includes('granero'), tipos.join());
  for (const b of ['almacen', 'mercado', 'cuartel', 'templo', 'puerto', 'muralla']) assert.ok(!c.b[b], b + ' no construido');
  const pz = CI.PIEZA_DE[D.POLIS[id].edificio.id]; assert.ok(E.abiertas.includes(pz), 'edificio propio abierto: ' + pz);
  assert.ok(!Object.keys(s.ev).length, 'ningún hecho romano al empezar');
  arr[id] = { pop: c.pop, casas: cs.length, terreno: E.terreno, sitio: E.sitio };
});
t('el ágora cambia de sitio con la semilla: 20 partidas de Atenas, al menos 4 sitios separados', () => { const sitios = new Map();
  for (let i = 0; i < 20; i++) { nueva('atenas', 101 + i * 7919); const E = G.ciudadE('roma'); assert.ok(E.sitio, 'sitio para el ágora'); sitios.set(E.sitio.x + ',' + E.sitio.z, E.sitio); }
  const L = [...sitios.values()]; assert.ok(L.length >= 4, 'solo ' + L.length + ' sitios');
  const lejos = []; for (const p of L) if (lejos.every(q => Math.hypot(q.x - p.x, q.z - p.z) >= 150)) lejos.push(p); assert.ok(lejos.length >= 4, 'solo ' + lejos.length + ' sitios a 150 o más'); });
t('la primera estación sin hambre y 4 estaciones sin errores', () => { const s = nueva('esparta', 77); const p0 = s.cities.roma.pop; for (let i = 0; i < 4 && !s.over; i++) { G.pasarEstacion(); if (i === 0) assert.ok(s.cities.roma.pop >= p0 && !s.log.some(l => /hambre/i.test(l.x)), 'hambre en la primera estación'); s.pending.length = 0; }
  assert.ok(s.cities.roma.pop > 0 && Number.isFinite(s.res.grano)); assert.ok(G.yearOf(s.t) === 799, 'año ' + G.yearOf(s.t)); assert.ok(!Object.keys(s.ev).length, 'sin hechos romanos'); });

const mem = {}; globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: k => { delete mem[k]; } };
t('guardar y cargar la polis: misma ciudad, sin urbe, ágora y edificio propio', () => {
  const s = nueva('atenas', 31337), E0 = G.ciudadE('roma'), p0 = CI.poblacion(E0), c0 = casasE(E0).length; G.save(); D.polis = null; G.state = null;
  assert.ok(G.load()); const E = G.ciudadE('roma'); assert.strictEqual(G.state.anio0, 800); assert.strictEqual(G.state.comarca.semilla, s.comarca.semilla);
  assert.strictEqual(CI.poblacion(E), p0); assert.strictEqual(casasE(E).length, c0); assert.ok(!E.urbe); assert.strictEqual(E.cultura, 'grie'); assert.ok(E.abiertas.includes('muelle'));
  assert.strictEqual(E.barrios[0].corto, 'Ágora'); assert.deepStrictEqual(E.sitio, E0.sitio); assert.strictEqual(D.BUILD.foro.n, 'Ágora');
});
t('partida vieja de polis (sin comarca ni anio0) carga sin error y sigue en su año', () => {
  nueva('argos', 5); const v = JSON.parse(JSON.stringify(G.state)); delete v.comarca; delete v.anio0; delete v.cities.roma.ciudad; mem['aqvila-save-v1'] = JSON.stringify(v);
  assert.ok(G.load()); assert.strictEqual(G.state.comarca, null); assert.strictEqual(G.yearOf(G.state.t), 280); assert.ok(G.ciudadE('roma'), 'su ciudad se rehace');
});
t('partida de Roma sin cambios: 280 a.C., sin comarca, «Foro» y la Roma de siempre', () => {
  const s = G.newGame('Test', 'mediterraneo', {}); G.onEvent = null; const E = G.ciudadE('roma');
  assert.strictEqual(s.comarca, undefined); assert.strictEqual(s.anio0, undefined); assert.strictEqual(G.yearOf(s.t), 280); assert.strictEqual(D.BUILD.foro.n, 'Foro');
  assert.ok(E && E.urbe && E.cultura === 'roma' && casasE(E).length >= 20, 'Roma con su urbe'); assert.ok(s.cities.capua, 'con Capua');
  const r = G.newGame('Test', 'italia', {}); assert.strictEqual(G.yearOf(r.t), 280); assert.strictEqual(r.comarca, undefined);
  const k = G.newGame('Test', null, { modo: 'corta' }); assert.strictEqual(G.yearOf(k.t), D.START_YEAR); assert.strictEqual(k.comarca, undefined);
});
delete globalThis.localStorage;
console.log('arranques', JSON.stringify(arr));
console.log(mal ? 'comarca: ' + mal + ' MAL de ' + (n + mal) : 'comarca: ' + n + ' bien');
process.exit(mal ? 1 : 0);
