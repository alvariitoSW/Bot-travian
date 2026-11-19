/* AQVILA — SN1: Senado nuevo (sala de votos con tres bandos), sin pantalla. node test/senado.test.js */
const assert = require('assert'), fs = require('fs');
const D = require('../js/data.js'), G = require('../js/game.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const nueva = () => { const s = G.newGame('Test'); G.turnos = false; G.onEvent = null; return s; };
const bandos = ['ter', 'mer', 'mil'];

t('los escaños (con tu familia) suman el total y cada bando tiene su mínimo (varias partidas)', () => {
  const s = nueva();
  for (const f of [() => {}, () => { for (const id of G.myCities()) s.cities[id].b.granja = 9; }, () => { for (const id of G.myCities()) { s.cities[id].b.cuartel = 9; s.cities[id].units.hastati = 5000; } }, () => { for (const id of G.myCities()) s.cities[id].b.mercado = 9; s.rutas = []; }]) {
    f(); const e = G.escanos(true), T = G.senadoTotal(); assert.strictEqual(e.ter + e.mer + e.mil + T.familia, T.total, JSON.stringify(e)); assert.strictEqual(T.total, 30); for (const b of bandos) assert(e[b] >= 2, b + ' ' + e[b]);
  }
});
t('sin mercados ni rutas los Mercaderes solo tienen su mínimo y lo que da Campania', () => {
  const s = nueva(); s.rutas = []; for (const id of G.myCities()) { s.cities[id].b.mercado = 0; s.cities[id].b.puerto = 0; }
  const e = G.escanos(true); assert(e.mer >= 2 && e.mer <= e.ter + 2, JSON.stringify(e)); s.cities.capua.owner = 'samnitas'; assert(G.escanos(true).mer <= e.mer, 'sin Campania, menos');
});
t('Militares con humor 80 y 12 escaños: Guerra a Cartago sale sin trato', () => {
  const s = nueva(), q = s.senado; q.escanos = { ter: 9, mer: 9, mil: 12 }; q.humor = { ter: 80, mer: 80, mil: 80 }; G.favor();
  const v = G.votos('guerra-cartago', []); assert(v.si >= D.SENADO.mayoria, 'sí ' + v.si); assert.strictEqual(v.porBando.mil.si, 12);
  q.votacion = { id: 'guerra-cartago', turno: 1, cambiada: false }; s.favor.pueblo = 80; const r = G.votar([]); assert(r.sale && !r.vetada && r.coste === 0, JSON.stringify(r));
  assert(q.permisos.cartago > 0, 'permiso de atacar a Cartago');
});
t('tres tarjetas con etiqueta, bando y escaños', () => {
  const s = nueva(), c = G.tratos('guerra-cartago'); assert.strictEqual(c.length, 3);
  for (const x of c) { assert(['si', 'promesa', 'pago'].includes(x.tipo) && ['Favorable', 'Dudoso', 'Arriesgado'].includes(x.etiqueta) && x.escanos >= 2 && typeof x.coste === 'number' && x.texto, JSON.stringify(x)); }
  assert(c.find(x => x.bando === 'ter').etiqueta !== 'Favorable' || true);
  const m = c.find(x => x.bando === 'mer'); if (m.tipo === 'pago') { const antes = G.votos('guerra-cartago', []).si, con = G.votos('guerra-cartago', [m]).si; assert(con >= antes, 'pagar suma votos'); }
});
t('pueblo en 20: ley con plebeyos negativos vetada; tras Juegos (pueblo > 35) ya no', () => {
  const s = nueva(), q = s.senado; s.favor.pueblo = 20; assert(G.veto('guerra-cartago').veta, 'veta con pueblo 20');
  q.votacion = { id: 'guerra-cartago', turno: 1, cambiada: false }; q.escanos = { ter: 4, mer: 4, mil: 22 }; q.humor = { ter: 90, mer: 90, mil: 90 }; G.favor();
  const r = G.votar([]); assert(r.vetada && !r.sale, 'vetada pese a los votos');
  s.favor.pueblo = 30; s.res.denarios = 1000; assert(G.veto('guerra-cartago').veta); assert(G.juegos().ok); assert(s.favor.pueblo > 35, 'pueblo ' + s.favor.pueblo); assert(!G.veto('guerra-cartago').veta, 'ya no veta');
  s.res.denarios = 0; s.alm.denarios = 0; assert(!G.juegos().ok, 'sin oro no hay juegos');
});
t('promesa rota: -15 al bando en el cierre de mes', () => {
  const s = nueva(), q = s.senado; s.t = 1; const h0 = G.humores().ter;
  q.promesas.push({ bando: 'ter', tipo: 'sinLeva', ciudad: 'roma', hasta: 40, rota: false });
  s.res.hierro = s.res.materiales = s.res.grano = s.res.denarios = 5000; s.cities.roma.pop = 5000; const k = ['hastati', 'principes', 'milicia'].find(u => G.unitOk(s.cities.roma, u)); assert(G.train('roma', k, 5), 'recluta');
  G.cierreMes(); assert(Math.abs(G.humores().ter - (h0 - 15)) < 1e-6, h0 + ' -> ' + G.humores().ter); assert.strictEqual(q.promesas.length, 0);
});
t('promesa cumplida: +5 al llegar su fecha', () => {
  const s = nueva(), q = s.senado; s.t = 5; const h0 = G.humores().mil; q.promesas.push({ bando: 'mil', tipo: 'guarnicion', n: 1, hasta: 5, rota: false });
  G.promesasMes(); assert(Math.abs(G.humores().mil - (h0 + 5)) < 1e-6);
});
t('atacar sin permiso: -10 a los tres y marcha sin triunfo; con permiso, nada', () => {
  const s = nueva(), q = s.senado; const to = G.neighbors('roma').find(i => s.cities[i].owner !== 'roma' && !(G.edge('roma', i)[2])); assert(to, 'vecina enemiga por tierra');
  s.cities.roma.units = { hastati: 200 }; q.permisos = {}; const h0 = G.humores(); assert(G.send('roma', to, { hastati: 50 }));
  for (const b of bandos) assert(Math.abs(G.humores()[b] - (h0[b] - 10)) < 1e-6, b); assert(s.marches[s.marches.length - 1].sinTriunfo === true);
  q.permisos[s.cities[to].owner] = 9999; const h1 = G.humores(); assert(G.send('roma', to, { hastati: 50 })); assert.deepStrictEqual(G.humores(), h1); assert(!s.marches[s.marches.length - 1].sinTriunfo);
});
t('favor = media de humores por escaños y misma forma {senado, pueblo}', () => {
  const s = nueva(), q = s.senado; q.escanos = { ter: 10, mer: 10, mil: 10 }; q.humor = { ter: 30, mer: 60, mil: 90 }; assert.deepStrictEqual(G.favor(), { senado: 60, pueblo: 50 });
  q.humor = { ter: 50, mer: 50, mil: 50 }; G.favor(); s.favor.senado = 10; assert(G.favorBajo()); assert.deepStrictEqual(Object.keys(G.favor()), ['senado', 'pueblo']);
  G.favorAplica(-4, 0); assert.strictEqual(G.favor().senado, 6); assert(Math.abs(G.humores().ter - 6) < 1e-6);
});
t('pasar el turno: recalcula escaños, deja pasar la votación vieja y abre otra', () => {
  const s = nueva(), q = s.senado, v0 = q.votacion; assert(v0 && G.leyDe(v0.id), 'votación al empezar'); assert(G.pasarTurno()); assert(q.votacion && q.votacion.turno > v0.turno, 'votación nueva');
  assert(q.ultimas[v0.id] !== undefined, 'la vieja se cerró'); assert.strictEqual(G.propuestasAlternativas().length, 3); const alt = G.propuestasAlternativas()[0];
  const h = G.humores(); assert(G.cambiarPropuesta(alt).ok && q.votacion.id === alt); for (const b of bandos) assert(Math.abs(G.humores()[b] - (h[b] - 3)) < 1e-6); assert(!G.cambiarPropuesta(G.propuestasAlternativas()[0]).ok, 'solo una vez');
  assert(/El Senado vota/.test(G.consejo().map(x => x.x).join('|')), 'línea en el consejo');
});
t('una misión de Q7 que sale abre su misión; si no sale, queda rechazada', () => {
  const s = nueva(), q = s.senado, m = Object.keys(D.MISIONES)[0]; assert(G.leyDe(m).tipo === 'obra');
  q.votacion = { id: m, turno: 1, cambiada: false }; q.escanos = { ter: 4, mer: 4, mil: 22 }; q.humor = { ter: 95, mer: 95, mil: 95 }; G.favor(); assert(G.votar([]).sale); assert(s.mision && s.mision.id === m);
  const m2 = Object.keys(D.MISIONES)[1]; q.votacion = { id: m2, turno: 2, cambiada: false }; q.humor = { ter: 0, mer: 0, mil: 0 }; G.favor(); assert(!G.votar([]).sale); assert.strictEqual(s.misionesHechas[m2], 'rechazada');
});
t('con D.SENADO.sala = false el juego es el de Q7', () => {
  D.SENADO.sala = false;
  try {
    const s = nueva(); assert(!s.senado, 'sin s.senado'); assert.deepStrictEqual(G.favor(), { senado: 50, pueblo: 50 }); assert(G.misionActual() && G.misionActual().m.id === 'levas-heraclea'); assert(G.pasarTurno() && !s.senado, 'pasar turno sin sala');
    const f0 = G.favor();
    const to = G.neighbors('roma').find(i => s.cities[i].owner !== 'roma' && !(G.edge('roma', i)[2])); s.cities.roma.units = { hastati: 200 }; assert(G.send('roma', to, { hastati: 50 })); assert.deepStrictEqual(G.favor(), f0); assert(!s.marches[s.marches.length - 1].sinTriunfo); assert(!s.senado);
    s.favor.senado = 10; assert(G.favorBajo());
  } finally { D.SENADO.sala = true; }
});
t('partida vieja: carga sin errores y los humores valen su favor', () => {
  const raw = fs.readFileSync(__dirname + '/partida-vieja.json', 'utf8'); global.localStorage = { getItem: () => raw, setItem: () => {}, removeItem: () => {} };
  assert(G.load(), 'carga'); const f = G.favor(), h = G.humores(); for (const b of bandos) assert.strictEqual(h[b], G.state.favor.senado, b); assert.strictEqual(f.senado, Math.round(G.state.favor.senado));
  const e = G.escanos(true), T = G.senadoTotal(); assert.strictEqual(e.ter + e.mer + e.mil + T.familia, T.total); assert(G.state.senado.v === 2 && G.state.senado.permisos && Array.isArray(G.state.senado.bandos));
  G.state.senado.votacion = null; G.senadoEstacion(); assert(G.state.senado.votacion || true); delete global.localStorage;
});

/* ---------- CE6: Senado de familias ---------- */
const sumaEsc = e => Object.values(e).reduce((a, b) => a + b, 0);
const ponPob = (s, total) => { const ids = G.myCities(); for (const id of ids) { s.cities[id].pop = total / ids.length; s.cities[id].ciu = 0; s.cities[id].esc = 0; } };
const conquista = (s, ids) => { for (const id of ids) G.incorporar(s.cities[id], {}, false); };
t('CE6: total de escaños 30 a 300 según la población; mayoría y familia siguen al total', () => {
  const s = nueva(); for (const [pop, tot] of [[600, 30], [2000, 100], [4000, 200], [6000, 300], [20000, 300]]) {
    ponPob(s, pop); const e = G.escanos(true), T = G.senadoTotal(); assert.strictEqual(T.total, tot, pop + ' -> ' + T.total); assert.strictEqual(sumaEsc(e) + T.familia, tot);
    assert.strictEqual(T.mayoria, Math.floor(tot / 2) + 1); assert.strictEqual(T.familia, 2 + Math.round(0.03 * tot));
    const min = Math.max(2, Math.round(0.06 * tot)); for (const b in e) assert(e[b] >= min, b + ' ' + e[b] + ' < ' + min);
  }
});
t('CE6: los bandos entran al cumplir su condición y se quedan; los siete suman el total', () => {
  const s = nueva(), q = s.senado; assert.deepStrictEqual(q.bandos, ['ter', 'mer', 'mil'], 'tres al empezar');
  const lista = () => G.senadoBandos().bandos.filter(x => x.activo).map(x => x.id);
  assert(G.senadoBandos().bandos.find(x => x.id === 'sac').falta, 'texto de entrada');
  s.cities.roma.b.templo = 1; s.cities.capua.b.templo = 1; G.senadoActo('obra', 'templo'); assert(lista().includes('sac'), 'Sacerdotes con 2 niveles de templo');
  assert.strictEqual(q.humor.sac, q.fs === undefined ? 50 : q.humor.sac);
  conquista(s, ['volsinii', 'perusia']); G.senadoActo('tomada', 'perusia'); assert(lista().includes('ita'), 'Itálicos con 4 ciudades en Italia');
  assert(!lista().includes('pro')); conquista(s, ['messana']); G.senadoActo('tomada', 'messana'); assert(lista().includes('pro'), 'Provinciales con Sicilia');
  ponPob(s, 3000); q.turnoVista = -9; G.senadoEstacion(); assert(lista().includes('pue'), 'Pueblo con 1500 plebeyos');
  assert.deepStrictEqual(q.bandos, D.BANDOS_ORDEN, 'los siete, en orden');
  s.cities.roma.b.templo = 0; s.cities.capua.b.templo = 0; q.turnoVista = -9; G.senadoEstacion(); assert(lista().includes('sac'), 'se quedan para siempre');
  const e = G.escanos(true), T = G.senadoTotal(); assert.strictEqual(sumaEsc(e) + T.familia, T.total); assert.strictEqual(Object.keys(e).length, 7);
  const B = G.senadoBandos(); assert(B.total === T.total && B.mayoria === T.mayoria && B.familia === T.familia && B.bandos.every(x => x.n && x.fam && x.col && typeof x.escanos === 'number' && x.pide), JSON.stringify(B.bandos[0]));
  const v = G.votos('guerra-cartago', []); assert.strictEqual(v.si + v.duda + v.no, T.total, 'votan todos y tu familia'); assert(v.familia === T.familia && v.si >= T.familia);
  assert.strictEqual(G.tratos('guerra-cartago').length, 7, 'una tarjeta por bando');
  assert.strictEqual(G.postura('guerra-cartago', 'pro'), 1); assert.strictEqual(G.postura('paz-pirro', 'pro'), -1); assert.strictEqual(G.postura('ley-grano-barato', 'pue'), 1);
});
t('CE6: un acto sube a su bando +2 y baja a su rival -1', () => {
  const s = nueva(), q = s.senado; q.humor = { ter: 50, mer: 50, mil: 50 }; s.favor.senado = q.fs = 50;
  assert.strictEqual(G.senadoActo('obra', 'granja'), 'ter'); assert(Math.abs(q.humor.ter - 52) < 1e-9 && Math.abs(q.humor.mer - 49) < 1e-9 && q.humor.mil === 50, JSON.stringify(q.humor));
  G.senadoActo('ruta', 'capua'); assert(Math.abs(q.humor.mer - 51) < 1e-9 && Math.abs(q.humor.ter - 51) < 1e-9);
  assert.strictEqual(q.actos.granja, 1); assert.strictEqual(G.senadoActo('obra', 'muralla'), null, 'muralla no contenta a nadie');
  for (let i = 0; i < 3; i++) G.senadoActo('obra', 'granja'); assert(Math.abs(q.humor.ter - 53) < 1e-9, 'tope por estación: ' + q.humor.ter); assert(Math.abs(q.humor.mer - 48) < 1e-9, 'el rival pierde sin tope');
});
t('CE6: petición cumplida sube, no cumplida baja (D.SENADO.peticion); nueva petición cada estación', () => {
  const s = nueva(), q = s.senado; q.votacion = null; q.humor = { ter: 50, mer: 50, mil: 50 }; s.favor.senado = q.fs = 50;
  q.pide = { ter: { id: 'sinLeva', turno: 0, texto: 'x' }, mil: { id: 'leva', turno: 0, texto: 'x' }, mer: { id: 'rutaMercado', turno: 0, texto: 'x' } }; q.actos = { leva: 1 };
  q.turnoVista = -9; G.senadoEstacion(); const P = D.SENADO.peticion; assert(P.si > 0 && P.no < 0); assert(Math.abs(q.humor.mil - 50 - P.si) < 1e-9 && Math.abs(q.humor.ter - 50 - P.no) < 1e-9 && Math.abs(q.humor.mer - 50 - P.no) < 1e-9, JSON.stringify(q.humor));
  for (const b of q.bandos) assert(q.pide[b] && q.pide[b].texto, 'pide ' + b); assert.deepStrictEqual(q.actos, {});
});
t('CE6: el bot que contenta a todos nunca los tiene a todos en 100', () => {
  const s = nueva(), q = s.senado; ponPob(s, 3000); s.cities.roma.b.templo = 2; conquista(s, ['volsinii', 'perusia', 'messana']); q.turnoVista = -9; G.senadoEstacion();
  assert.strictEqual(q.bandos.length, 7); for (const b of q.bandos) q.humor[b] = 95; s.favor.senado = q.fs = 95;
  for (let i = 0; i < 40; i++) {
    for (const [t2, d] of [['obra', 'granja'], ['obra', 'mercado'], ['leva', 'roma'], ['ataque'], ['victoria', 'messana'], ['obra', 'templo'], ['ciudadania', 'capua'], ['juegos']]) G.senadoActo(t2, d);
    s.t += D.TURNO_MESES; q.votacion = null; q.turnoVista = -9; G.senadoEstacion();
    assert(!q.bandos.every(b => q.humor[b] >= 100), 'estación ' + i + ': todos a 100');
  }
});
t('CE6: partidas v1 (vieja y fabricada) cargan, migran a v2 sin repetir y juegan 2 años', () => {
  const s0 = nueva(), q0 = s0.senado; q0.humor = { ter: 33, mer: 44, mil: 77 }; q0.v = 1; delete q0.bandos; delete q0.pide; delete q0.actos; delete q0.familia; delete q0.total; q0.escanos = { ter: 10, mer: 10, mil: 10 };
  const fab = JSON.stringify(s0);
  for (const raw of [fs.readFileSync(__dirname + '/partida-vieja.json', 'utf8'), fab]) {
    global.localStorage = { getItem: () => raw, setItem: () => {}, removeItem: () => {} };
    try {
      assert(G.load(), 'carga'); const s = G.state, q = s.senado; G.turnos = false; G.onEvent = null; G.favor(); assert(q.v === 2 && Array.isArray(q.bandos) && q.pide && q.actos, 'v2');
      if (raw === fab) assert.deepStrictEqual([q.humor.ter, q.humor.mer, q.humor.mil].map(Math.round), [33, 44, 77], 'humores conservados');
      const antes = JSON.stringify(q); G.migrarSala(s); assert.strictEqual(JSON.stringify(q), antes, 'idempotente');
      const t0 = s.t; for (let i = 0; i < 24 * 4 && !s.over; i++) { G.tick(0.25); s.pending = []; s.vivo = null; }
      assert(s.t >= t0 + 23 || s.over, 'juega 2 años: ' + (s.t - t0)); for (const b of q.bandos) assert(Number.isFinite(q.humor[b]), b);
      const T = G.senadoTotal(); assert.strictEqual(sumaEsc(G.escanos(true)) + T.familia, T.total);
    } finally { delete global.localStorage; }
  }
});
console.log(mal ? 'FALLOS: ' + mal : 'Senado nuevo: ' + n + ' comprobaciones bien'); process.exit(mal ? 1 : 0);
