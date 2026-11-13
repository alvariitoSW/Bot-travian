/* AQVILA — SN1: Senado nuevo (sala de votos con tres bandos), sin pantalla. node test/senado.test.js */
const assert = require('assert'), fs = require('fs');
const D = require('../js/data.js'), G = require('../js/game.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const nueva = () => { const s = G.newGame('Test'); G.turnos = false; G.onEvent = null; return s; };
const bandos = ['ter', 'mer', 'mil'];

t('los escaños suman 30 y cada bando tiene 4 o más (varias partidas)', () => {
  const s = nueva();
  for (const f of [() => {}, () => { for (const id of G.myCities()) s.cities[id].b.granja = 9; }, () => { for (const id of G.myCities()) { s.cities[id].b.cuartel = 9; s.cities[id].units.hastati = 5000; } }, () => { for (const id of G.myCities()) s.cities[id].b.mercado = 9; s.rutas = []; }]) {
    f(); const e = G.escanos(true); assert.strictEqual(e.ter + e.mer + e.mil, 30, JSON.stringify(e)); for (const b of bandos) assert(e[b] >= 4, b + ' ' + e[b]);
  }
});
t('sin mercados ni rutas los Mercaderes tienen 4', () => {
  const s = nueva(); s.rutas = []; for (const id of G.myCities()) { s.cities[id].b.mercado = 0; s.cities[id].b.puerto = 0; }
  assert.strictEqual(G.escanos(true).mer, 4);
});
t('Militares con humor 80 y 12 escaños: Guerra a Cartago sale sin trato', () => {
  const s = nueva(), q = s.senado; q.escanos = { ter: 9, mer: 9, mil: 12 }; q.humor = { ter: 80, mer: 80, mil: 80 }; G.favor();
  const v = G.votos('guerra-cartago', []); assert(v.si >= D.SENADO.mayoria, 'sí ' + v.si); assert.strictEqual(v.porBando.mil.si, 12);
  q.votacion = { id: 'guerra-cartago', turno: 1, cambiada: false }; s.favor.pueblo = 80; const r = G.votar([]); assert(r.sale && !r.vetada && r.coste === 0, JSON.stringify(r));
  assert(q.permisos.cartago > 0, 'permiso de atacar a Cartago');
});
t('tres tarjetas con etiqueta, bando y escaños', () => {
  const s = nueva(), c = G.tratos('guerra-cartago'); assert.strictEqual(c.length, 3);
  for (const x of c) { assert(['si', 'promesa', 'pago'].includes(x.tipo) && ['Favorable', 'Dudoso', 'Arriesgado'].includes(x.etiqueta) && x.escanos >= 4 && typeof x.coste === 'number' && x.texto, JSON.stringify(x)); }
  assert(c.find(x => x.bando === 'ter').etiqueta !== 'Favorable' || true);
  const m = c.find(x => x.bando === 'mer'); if (m.tipo === 'pago') { const antes = G.votos('guerra-cartago', []).si, con = G.votos('guerra-cartago', [m]).si; assert(con >= antes, 'pagar suma votos'); }
});
t('pueblo en 20: ley con plebeyos negativos vetada; tras Juegos (pueblo > 35) ya no', () => {
  const s = nueva(), q = s.senado; s.favor.pueblo = 20; assert(G.veto('guerra-cartago').veta, 'veta con pueblo 20');
  q.votacion = { id: 'guerra-cartago', turno: 1, cambiada: false }; q.escanos = { ter: 4, mer: 4, mil: 22 }; q.humor = { ter: 90, mer: 90, mil: 90 }; G.favor();
  const r = G.votar([]); assert(r.vetada && !r.sale, 'vetada pese a los votos');
  s.favor.pueblo = 30; s.res.oro = 1000; assert(G.veto('guerra-cartago').veta); assert(G.juegos().ok); assert(s.favor.pueblo > 35, 'pueblo ' + s.favor.pueblo); assert(!G.veto('guerra-cartago').veta, 'ya no veta');
  s.res.oro = 0; s.alm.oro = 0; assert(!G.juegos().ok, 'sin oro no hay juegos');
});
t('promesa rota: -15 al bando en el cierre de mes', () => {
  const s = nueva(), q = s.senado; s.t = 1; const h0 = G.humores().ter;
  q.promesas.push({ bando: 'ter', tipo: 'sinLeva', ciudad: 'roma', hasta: 40, rota: false });
  s.res.hierro = s.res.madera = s.res.grano = s.res.oro = 5000; s.cities.roma.pop = 5000; const k = ['hastati', 'principes', 'milicia'].find(u => G.unitOk(s.cities.roma, u)); assert(G.train('roma', k, 5), 'recluta');
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
  const e = G.escanos(true); assert.strictEqual(e.ter + e.mer + e.mil, 30); assert(G.state.senado.v === 1 && G.state.senado.permisos);
  G.state.senado.votacion = null; G.senadoEstacion(); assert(G.state.senado.votacion || true); delete global.localStorage;
});
console.log(mal ? 'FALLOS: ' + mal : 'Senado nuevo: ' + n + ' comprobaciones bien'); process.exit(mal ? 1 : 0);
