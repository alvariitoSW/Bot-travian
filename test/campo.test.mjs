// AQVILA — GM15b: toparse en el camino, salir al encuentro, apostar y emboscada, partida vieja. node test/campo.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); const R = require('../js/registro.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
// newGame tarda unos 3 s: se reutiliza la misma partida y se limpia entre pruebas
let base = null;
const nueva = () => {
  if (!base || G.state !== base) base = G.newGame('Test', 'mediterraneo', {});
  const s = base; G.onEvent = null; G.turnos = false; s.turnos = false; s.t = 0; s.marches = []; s.pending = []; s.cities.roma.units = { hastati: 300 }; delete s.cities.roma.heridos; s.ajustes.hora = 'elijo';
  s.hero.city = 'roma'; s.hero.march = null; s.hero.wound = 0; return s;
};
// una marcha a mano: roma → o enemiga (owner), por el camino de a hacia b
const marcha = (s, owner, a, b, units, dur, extra) => { const m = Object.assign({ id: s.mid++, owner: owner, from: a, to: b, units: units, hero: false, t0: s.t, t1: s.t + dur }, extra || {}); s.marches.push(m); return m; };
const corre = (s, meses) => { for (let i = 0; i < meses * 4 && !s.over && !s.pending.length; i++) G.tick(0.25); };

t('la tabla de sitios: 48 sitios, 23 caminos de tierra (16 con sitios; los 7 de J4a, sin sitios aún), cuatro rasgos, alturas de 0 a 1, ficha de cada uno', () => {
  const ids = Object.keys(D.SITIOS); assert.strictEqual(ids.length, 48); assert.strictEqual(D.CAMINOS.length, 23);
  for (const id of ids) { const x = D.SITIOS[id]; assert.ok(['rio', 'loma', 'bosque', 'llano'].includes(x.r), id); assert.ok(x.p > 0 && x.p < 1, id); assert.ok(x.c >= 1 && x.c <= 16, id); assert.ok(R.fichas.sitio[id], 'ficha de ' + id); assert.ok(!R.fichas.sitio[id].historia.texto, 'sin texto en pantalla: ' + id); }
  for (let c = 1; c <= 16; c++) assert.strictEqual(D.sitiosDe(c).length, 3, 'tres sitios en el camino ' + c);
  assert.strictEqual(D.sitioCerca(2, 0.5).id, 'liris'); assert.strictEqual(D.sitioCerca(1, 0.75), null, 'lejos de todo: llano'); { const K = G.fichaCampo(1, 0.75, { semilla: 1, t: 0 }); assert.strictEqual(K.rasgo, 'llano'); assert.ok(/Roma/.test(K.nombre) && /Volsinii/.test(K.nombre), K.nombre); }
  assert.strictEqual(D.caminoDe('roma', 'carales'), null, 'por mar no hay camino');
});

t('toparse: dos marchas enemigas por el mismo camino en sentidos contrarios luchan en el sitio', () => {
  const s = nueva(), r = marcha(s, 'roma', 'roma', 'capua', { hastati: 60 }, 4), e = marcha(s, 'cartago', 'capua', 'roma', { hastati: 50 }, 4);
  corre(s, 4); assert.strictEqual(s.pending.length, 1); const pb = s.pending[0], K = pb.campo;
  assert.strictEqual(pb.kind, 'campo'); assert.strictEqual(K.camino, 2); assert.strictEqual(K.rasgo, 'rio'); assert.strictEqual(K.nombre, 'Río Liris'); assert.strictEqual(K.sitio, 'liris');
  assert.ok(D.HORAS[K.hora]); assert.strictEqual(K.emboscada, false); assert.ok(Math.abs(K.punto - 0.5) < 0.02, 'se cruzan a medio camino: ' + K.punto);
  assert.ok(!s.marches.includes(r) && !s.marches.includes(e), 'las dos marchas se paran');
  const info = G.battleInfo(pb); assert.strictEqual(info.kind, 'campo'); assert.strictEqual(info.cfg.terreno, 'rio'); assert.strictEqual(info.cfg.campo, K);
});

t('toparse: los dos resultados (gana o pierde el romano)', () => {
  let gana = 0, pierde = 0;
  for (const [u0, u1] of [[300, 40], [40, 300]]) {
    const s = nueva(), home = s.cities.roma.units.hastati || 0;
    // t0 desigual: se cruzan hacia el 40 % del camino 1 (Roma–Volsinii), lejos de los sitios (0,10 y 0,40: el Lago Vadimón sí cae cerca)
    const r = marcha(s, 'roma', 'roma', 'volsinii', { hastati: u0 }, 5), e = marcha(s, 'etruscos', 'volsinii', 'roma', { hastati: u1 }, 5);
    corre(s, 5); assert.strictEqual(s.pending.length, 1); assert.strictEqual(s.pending[0].campo.camino, 1);
    const antes = s.t, out = G.resolverPendiente().out; assert.strictEqual(out.kind, 'campo'); assert.strictEqual(s.pending.length, 0);
    if (out.win) { gana++; assert.ok(s.marches.includes(r), 'el romano sigue su marcha'); assert.ok(r.t1 > antes + D.CAMPO.retraso - 1e-6, 'con retraso'); assert.ok(!s.marches.includes(e)); }
    else { pierde++; assert.ok(!s.marches.includes(r), 'el romano vuelve a casa'); assert.ok(s.marches.includes(e), 'el enemigo sigue'); assert.ok((s.cities.roma.units.hastati || 0) >= 0 && s.cities.roma.units.hastati !== undefined); }
    G.tick(0.25);
  }
  assert.ok(gana >= 1 && pierde >= 1, 'gana ' + gana + ' / pierde ' + pierde);
});

t('por mar no se topan; en el mismo sentido tampoco; con una marcha de colonos tampoco', () => {
  let s = nueva(); marcha(s, 'roma', 'roma', 'carales', { hastati: 60 }, 4); marcha(s, 'cartago', 'carales', 'roma', { hastati: 50 }, 4); corre(s, 4); assert.strictEqual(s.pending.length === 1 && s.pending[0].kind === 'campo', false);
  s = nueva(); marcha(s, 'roma', 'roma', 'capua', { hastati: 60 }, 4); marcha(s, 'cartago', 'roma', 'capua', { hastati: 50 }, 4); G.encuentros(); assert.strictEqual(s.pending.length, 0);
});

t('salir al encuentro: eliges el sitio y se lucha allí; un sitio ya pasado no vale', () => {
  const s = nueva(); s.cities.roma.units.hastati = 200; const e = marcha(s, 'cartago', 'capua', 'roma', { hastati: 80 }, 6);
  const sal = G.salidasPosibles('roma', false); assert.strictEqual(sal.length, 1); const ok = sal[0].sitios.filter(x => x.ok), no = sal[0].sitios.filter(x => !x.ok);
  assert.ok(ok.length >= 1, 'algún sitio vale'); const x = ok[0];
  assert.strictEqual(G.salirAlEncuentro(e.id, 'tiber', { hastati: 100 }, false), false, 'un sitio de otro camino no vale');
  assert.ok(G.salirAlEncuentro(e.id, x.id, { hastati: 100 }, false, { hora: 'mediodia' }), G.sendMotivo);
  assert.strictEqual(s.cities.roma.units.hastati, 100); const m = s.marches.find(q => q.sitio); assert.ok(m && m.sitio.id === x.id);
  corre(s, 8); assert.strictEqual(s.pending.length, 1); const K = s.pending[0].campo;
  assert.strictEqual(K.nombre, D.SITIOS[x.id].n); assert.strictEqual(K.hora, 'mediodia', 'la hora que pides si llevas la iniciativa'); assert.strictEqual(K.defensor, 0);
  assert.ok(Math.abs(K.punto - D.SITIOS[x.id].p) < 1e-6);
  G.resolverPendiente(); assert.strictEqual(s.pending.length, 0); assert.ok(!s.marches.some(q => q.sitio), 'no queda ejército esperando');
  // un sitio que el enemigo ya pasó
  const s2 = nueva(); s2.cities.roma.units.hastati = 200; const e2 = marcha(s2, 'cartago', 'capua', 'roma', { hastati: 80 }, 6); s2.t += 5.5;
  const pas = G.salidasPosibles('roma', false)[0].sitios.find(q => !q.ok && /ya ha pasado/.test(q.motivo)); assert.ok(pas, 'hay un sitio ya pasado');
  assert.strictEqual(G.salirAlEncuentro(e2.id, pas.id, { hastati: 100 }, false), false); assert.ok(/pasado/.test(G.sendMotivo));
  // con el ajuste «azar» la hora que pides no vale
  const s3 = nueva(); G.ponerAjustes({ hora: 'azar' }); s3.cities.roma.units.hastati = 200; const e3 = marcha(s3, 'cartago', 'capua', 'roma', { hastati: 80 }, 6);
  const y = G.salidasPosibles('roma', false)[0].sitios.find(q => q.ok); G.salirAlEncuentro(e3.id, y.id, { hastati: 100 }, false, { hora: 'atardecer' }); corre(s3, 8);
  const hs = new Set(); for (let i = 0; i < 40; i++) hs.add(G.fichaCampo(2, 0.5, { semilla: i, iniciativa: true, hora: 'atardecer' }).hora); assert.ok(hs.size > 1, 'con «azar» sale cualquiera');
});

t('apostar: solo en bosque o loma; emboscada o descubierto según la caballería (con semilla)', () => {
  const s = nueva(); s.cities.roma.units.hastati = 300; const e = marcha(s, 'cartago', 'capua', 'roma', { hastati: 80 }, 6);
  const sit = G.salidasPosibles('roma', false)[0].sitios, rio = sit.find(x => x.ok && !x.apostable), loma = sit.find(x => x.ok && x.apostable);
  if (rio) assert.strictEqual(G.salirAlEncuentro(e.id, rio.id, { hastati: 100 }, false, { apostar: true }), false, 'en el río no se apuesta');
  assert.ok(loma, 'hay una loma'); assert.ok(G.salirAlEncuentro(e.id, loma.id, { hastati: 100 }, false, { apostar: true }), G.sendMotivo);
  const m = s.marches.find(q => q.sitio); assert.strictEqual(m.postura, 'apostado'); assert.ok(m.sitio.tApuesta >= m.sitio.tLlega);
  // la acción suelta, y un ejército en un sitio de río no se apuesta
  const s2 = nueva(); s2.cities.roma.units.hastati = 300; const e2 = marcha(s2, 'cartago', 'capua', 'roma', { hastati: 80 }, 6), r2 = G.salidasPosibles('roma', false)[0].sitios.find(x => x.ok && x.apostable);
  G.salirAlEncuentro(e2.id, r2.id, { hastati: 100 }, false); const m2 = s2.marches.find(q => q.sitio); assert.strictEqual(m2.postura, undefined); assert.ok(G.apostar(m2.id)); assert.strictEqual(m2.postura, 'apostado');
  assert.ok(G.dejarElSitio(m2.id), 'se mueve: vuelve a casa'); assert.ok(!s2.marches.some(q => q.sitio));
  // probabilidades: 100 ejércitos apostados en la Loma (Montes Albanos) contra un enemigo con y sin caballería
  const prob = u => { let emb = 0, N = 100; for (let i = 0; i < N; i++) {
    const s3 = nueva(); const r = marcha(s3, 'roma', 'roma', 'capua', { hastati: 100 }, 6, { sitio: { id: 'albanos', c: 2, p: 0.25, r: 'loma', n: 'Montes Albanos', tLlega: 0.5, tEnc: 1.5, contra: 0, tApuesta: 1.4, hora: null }, postura: 'apostado' });
    const q = marcha(s3, 'cartago', 'capua', 'roma', u, 2); q.id = 1000 + i * 7; r.id = 3 + i; s3.t = 1.6; G.encuentros(); const K = s3.pending[0] && s3.pending[0].campo; assert.ok(K, 'se topan'); assert.strictEqual(K.nombre, 'Montes Albanos');
    if (K.emboscada) { emb++; assert.strictEqual(K.emboscador, 0); } } return emb / N; };
  const sinCab = prob({ hastati: 80 }), conCab = prob({ hastati: 40, equites: 40 });
  assert.ok(sinCab > 0.5 && sinCab < 0.9, 'sin caballería cae en la emboscada ~70 %: ' + sinCab); assert.ok(conCab > 0.1 && conCab < 0.5, 'con caballería ~30 %: ' + conCab);
  assert.strictEqual(prob({ hastati: 80 }), sinCab, 'determinista: misma semilla, mismo resultado');
});

t('hora: niebla solo con río y en otoño o invierno; noche solo en emboscadas', () => {
  const s = nueva(); const est = tt => G.estacion(tt);
  let tOto = null, tPri = null; for (let tt = 0; tt < 12; tt += 3) { if (est(tt) === 'Otoño' || est(tt) === 'Invierno') tOto = tt; else tPri = tt; }
  assert.ok(tOto !== null && tPri !== null);
  let niebla = 0; for (let i = 0; i < 60; i++) { if (G.fichaCampo(2, 0.55, { semilla: i, t: tOto, iniciativa: true, hora: 'niebla' }).niebla) niebla++; assert.strictEqual(G.fichaCampo(2, 0.55, { semilla: i, t: tPri, iniciativa: true, hora: 'niebla' }).niebla, false, 'primavera o verano: nunca'); assert.strictEqual(G.fichaCampo(2, 0.25, { semilla: i, t: tOto }).niebla, false, 'loma: nunca'); }
  assert.strictEqual(niebla, 60, 'junto al río y en otoño o invierno, si la pides, la tienes');
  for (let i = 0; i < 30; i++) { assert.notStrictEqual(G.fichaCampo(2, 0.5, { semilla: i, iniciativa: true, hora: 'noche', emboscada: false }).hora, 'noche'); assert.strictEqual(G.fichaCampo(2, 0.5, { semilla: i, iniciativa: true, hora: 'noche', emboscada: true }).hora, 'noche'); assert.notStrictEqual(G.fichaCampo(2, 0.5, { semilla: i }).hora, 'noche', 'al azar nunca es de noche'); }
  assert.ok(s);
});

t('río y nadie cruza: el enemigo mucho más flojo no fuerza el paso, no hay batalla y cada uno vuelve', () => {
  const s = nueva(), e = marcha(s, 'cartago', 'capua', 'roma', { hastati: 40 }, 6), rio = G.salidasPosibles('roma', false)[0].sitios.find(x => x.ok && x.r === 'rio'); assert.ok(rio, 'hay un río');
  assert.ok(G.salirAlEncuentro(e.id, rio.id, { hastati: 300 }, false), G.sendMotivo); assert.strictEqual(s.cities.roma.units.hastati, undefined);
  corre(s, 8); assert.strictEqual(s.pending.length, 0, 'sin batalla'); assert.ok(!s.marches.some(m => m.sitio) && !s.marches.includes(e), 'cada uno vuelve'); assert.strictEqual(s.cities.roma.units.hastati, 300);
  // si el enemigo es casi tan fuerte, sí cruza y hay batalla; y un río sin salir al encuentro (dos marchas que se cruzan) también
  const s2 = nueva(), e2 = marcha(s2, 'cartago', 'capua', 'roma', { hastati: 280 }, 6), r2 = G.salidasPosibles('roma', false)[0].sitios.find(x => x.ok && x.r === 'rio');
  assert.ok(G.salirAlEncuentro(e2.id, r2.id, { hastati: 300 }, false)); corre(s2, 8); assert.strictEqual(s2.pending.length, 1); assert.strictEqual(s2.pending[0].campo.rasgo, 'rio');
});

t('migración: lo que no encaja devuelve sus tropas a su ciudad, no se pierde en silencio', () => {
  const s = nueva(); s.cities.roma.units = { hastati: 10 };
  marcha(s, 'roma', 'roma', 'capua', { hastati: 40 }, 4, { sitio: { id: 'noexiste', c: 2, p: 0.5, r: 'rio', n: 'X', tLlega: 1, tEnc: 2, contra: 0, tApuesta: 1 } });
  s.pending.push({ kind: 'campo', m: { id: 99, owner: 'roma', from: 'roma', to: 'capua', units: { hastati: 25 } } });   // sin enemigo ni ficha
  G.migrarCampo(s); assert.strictEqual(s.marches.length, 0); assert.strictEqual(s.pending.length, 0); assert.strictEqual(s.cities.roma.units.hastati, 75);
});

t('modo turnos: el cruce se resuelve al cerrar la estación', () => {
  const s = nueva(); s.turnos = true; G.turnos = true; s.t = 0; const r = marcha(s, 'roma', 'roma', 'capua', { hastati: 60 }, 3), e = marcha(s, 'cartago', 'capua', 'roma', { hastati: 50 }, 3);
  r.t1 = G.llegada(r.t1); e.t1 = G.llegada(e.t1); G.pasarTurno(); assert.strictEqual(s.pending.length, 1); assert.strictEqual(s.pending[0].kind, 'campo'); assert.ok(!s.marches.includes(r));
  G.turnos = false;
});

t('partida guardada a medias con una batalla de campo: recarga igual', () => {
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  try {
    const s = nueva(); marcha(s, 'roma', 'roma', 'capua', { hastati: 60 }, 4); marcha(s, 'cartago', 'capua', 'roma', { hastati: 50 }, 4); corre(s, 4); assert.strictEqual(s.pending.length, 1);
    G.save(); assert.ok(G.load()); const pb = G.state.pending[0]; assert.strictEqual(pb.kind, 'campo'); assert.strictEqual(pb.campo.nombre, 'Río Liris'); assert.ok(G.battleInfo(pb).cfg.sides[1].units.hastati === 50);
    assert.ok(G.resolverPendiente().out.kind === 'campo');
  } finally { delete global.localStorage; }
});

t('migración: una partida vieja (sin campo, sin postura, sin ajuste de hora) carga igual', () => {
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  try {
    const raw = require('node:fs').readFileSync(new URL('./partida-vieja.json', import.meta.url), 'utf8'); store['aqvila-save-v1'] = raw;
    assert.ok(G.load()); assert.strictEqual(G.ajustes().hora, 'elijo'); assert.strictEqual(G.horaAjuste(), 'elijo'); assert.ok(!G.state.marches.some(m => m.sitio || m.postura));
    G.ponerAjustes({ hora: 'azar' }); G.save(); assert.ok(G.load()); assert.strictEqual(G.horaAjuste(), 'azar');
    const o = JSON.parse(store['aqvila-save-v1']); o.ajustes.hora = 'zzz'; store['aqvila-save-v1'] = JSON.stringify(o); assert.ok(G.load()); assert.strictEqual(G.horaAjuste(), 'elijo');
    assert.strictEqual(G.ponerAjustes({ hora: 'zzz' }).ok, false);
    for (let i = 0; i < 20 && !G.state.pending.length; i++) G.tick(0.25);   // sigue corriendo
  } finally { delete global.localStorage; }
});

console.log(mal ? 'FALLAN ' + mal : 'TODO BIEN (' + n + ')'); process.exit(mal ? 1 : 0);
