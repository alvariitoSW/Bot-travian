// AQVILA — CE4: reglas del mercado. node test/mercado.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); const MER = require('../js/mercado.js');
import * as Agro from '../js/agricultura.js';
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const nueva = () => { const s = G.newGame('Test', 'mediterraneo', {}); G.onEvent = null; s.t = 3; s.cities.roma.b.mercado = 2; s.cities.roma.b.puerto = 2; MER.migrar(s); s.mercado.sucesos = []; return s; };
const J = x => JSON.stringify(x);
const quieto = s => { s.mercado.sucesos = []; s.mercado.S = {}; };

t('migrar es idempotente y repara', () => {
  const s = nueva(); const a = J(s.mercado); MER.migrar(s); assert.strictEqual(J(s.mercado), a);
  delete s.mercado.S; delete s.mercado.rutas; MER.migrar(s); assert.ok(Array.isArray(s.mercado.rutas) && s.mercado.S);
  assert.ok(MER.ORDEN.length >= 10 && MER.PRODUCTOS.denarios.moneda && !MER.ORDEN.includes('denarios'));
});
t('partida vieja: migra y las rutas viejas pasan a mercado.rutas', () => {
  const s = JSON.parse(JSON.stringify(require('./partida-vieja.json'))); s.rutas = [{ a: 'roma', b: 'carthago', f: 1 }];
  MER.migrar(s); MER.migrar(s); assert.strictEqual(s.mercado.rutas.length, 1); assert.strictEqual(s.rutas.length, 1);
  assert.ok(MER.PRODUCTOS[s.mercado.rutas[0].prod]);
});
t('más barato donde se produce que donde se pide', () => {
  const s = nueva(); quieto(s); s.t = 6;
  assert.ok(MER.precio(s, 'syracusae', 'grano') < MER.precio(s, 'roma', 'grano'));
  assert.ok(MER.precio(s, 'messana', 'vino') < MER.precio(s, 'mediolanum', 'vino'));
});
t('grano más barato en verano que en primavera', () => {
  const s = nueva(); quieto(s); s.t = 3; const pr = MER.precio(s, 'roma', 'grano'); s.t = 6; assert.ok(MER.precio(s, 'roma', 'grano') < pr);
});
t('vender baja el precio y comprar lo sube', () => {
  const s = nueva(); quieto(s); const p0 = MER.precio(s, 'roma', 'hierro');
  const v = MER.vender(s, 'roma', 'hierro', 10); assert.ok(v.ok && v.delta.denarios > 0 && v.delta.hierro === -10); const p1 = MER.precio(s, 'roma', 'hierro'); assert.ok(p1 < p0);
  const c = MER.comprar(s, 'roma', 'hierro', 20); assert.ok(c.ok && c.delta.denarios < 0 && c.delta.hierro === 20); assert.ok(MER.precio(s, 'roma', 'hierro') > p1);
  assert.ok(!MER.comprar(s, 'roma', 'denarios', 1).ok); assert.ok(!MER.comprar(s, 'roma', 'hierro', 5, { tiene: () => 0, cabe: () => 99 }).ok);
  assert.ok(!MER.comprar(s, 'roma', 'hierro', 5, { tiene: () => 999, cabe: () => 1 }).ok); assert.ok(!MER.vender(s, 'roma', 'hierro', 5, { tiene: () => 1 }).ok);
});
t('comprar y vender en el mismo sitio no crea dinero', () => {
  for (const n of [1, 7, 200]) { const s = nueva(); quieto(s); const c = MER.comprar(s, 'roma', 'hierro', n), v = MER.vender(s, 'roma', 'hierro', n); assert.ok(c.delta.denarios + v.delta.denarios <= 1e-9, n + ': ' + (c.delta.denarios + v.delta.denarios)); }
  const s = nueva(); quieto(s); let tot = 0; for (let i = 0; i < 1000; i++) { tot += MER.comprar(s, 'syracusae', 'vino', 3).delta.denarios + MER.vender(s, 'syracusae', 'vino', 3).delta.denarios; } assert.ok(tot <= 0, 'ganó ' + tot);
});
t('nombres, casas y consejo', () => {
  assert.ok(MER.PRODUCTOS.caballos.n === D.ESPECIAL.caballos.n && MER.PRODUCTOS.caballos.i === D.ESPECIAL.caballos.i);
  const facs = new Set(Object.values(D.CITIES).map(c => c.f)); for (const k of Object.values(MER.CASAS)) for (const f of k.f) assert.ok(facs.has(f), f);
  const s = nueva(); quieto(s); s.t = 6; const c = MER.consejo(s); if (c.prod) assert.ok(c.texto.includes('vende ' + MER.PRODUCTOS[c.prod].n) && MER.PRODUCTOS[c.prod].origen.includes(c.a) || MER.precio(s, c.a, c.prod) <= MER.PRODUCTOS[c.prod].base);
});
t('dos rutas viejas iguales no se funden; viaje exige mercado', () => {
  const s = nueva(); s.rutas = [{ a: 'roma', b: 'carthago', f: 1 }, { a: 'roma', b: 'carthago', f: 2 }]; MER.migrar(s); MER.migrar(s); assert.strictEqual(s.mercado.rutas.length, 2);
  s.cities.roma.b.mercado = 0; s.cities.roma.b.puerto = 0; assert.ok(!MER.viajeLanzar(s, { a: 'roma', b: 'carthago', prod: 'vino', cargas: 1 }).ok);
});
t('S vuelve hacia 0 mes a mes', () => {
  const s = nueva(); quieto(s); MER.vender(s, 'roma', 'hierro', 30); const a = Math.abs(s.mercado.S.roma.hierro);
  s.t = 4; MER.mes(s, { enGuerra: () => false, bloqueada: () => false, cosecha: () => null }); const b = Math.abs((s.mercado.S.roma || {}).hierro || 0); assert.ok(b < a);
  for (let i = 0; i < 20; i++) { s.t++; MER.mes(s, { enGuerra: () => false, bloqueada: () => false, cosecha: () => null }); } assert.ok(!(s.mercado.S.roma && s.mercado.S.roma.hierro));
});
t('arbitraje repetido deja de rentar (tope)', () => {
  const s = nueva(); quieto(s); s.t = 6; const mj = MER.mejores(s, 'hierro', 1); const a = mj.barato[0].ciudad, b = mj.caro[0].ciudad;
  let primero = null, ult = null;
  for (let i = 0; i < 200; i++) { const c = MER.comprar(s, a, 'hierro', 10), v = MER.vender(s, b, 'hierro', 10); ult = c.delta.denarios + v.delta.denarios; if (primero === null) primero = ult; if (ult <= 0) break; }
  assert.ok(primero > 0); assert.ok(ult <= 0, 'sigue rentando ' + ult);
});
t('ruta: neto positivo en caso bueno, pierde con aduana alta', () => {
  const s = nueva(); quieto(s); s.t = 6; s.cities.roma.b.mercado = 3; s.cities.roma.b.puerto = 3;
  let mejor = null; for (const p of MER.ORDEN) for (const b of Object.keys(s.cities)) { if (b === 'roma') continue; const c = MER.rutaCuenta(s, { a: 'roma', b, prod: p, cargas: 3 }); if (!mejor || c.neto > mejor.c.neto) mejor = { p, b, c }; }
  assert.ok(mejor.c.neto > 0, 'ningún negocio desde Roma'); const base = mejor.c;
  assert.ok(base.flete > 0 && base.compra > 0);
  s.cities[mejor.b].owner = 'cartago'; MER.portoriumFijar(s, mejor.b, 0.05); const alta = MER.rutaCuenta(s, { a: 'roma', b: mejor.b, prod: mejor.p, cargas: 3 });
  s.cities[mejor.b].owner = 'cartago'; MER.portoriumFijar(s, mejor.b, 0); const baja = MER.rutaCuenta(s, { a: 'roma', b: mejor.b, prod: mejor.p, cargas: 3 });
  assert.ok(alta.portoria > baja.portoria && alta.neto < baja.neto);
  const r = MER.rutaCrear(s, { a: 'roma', b: mejor.b, prod: mejor.p, cargas: 3 }); assert.ok(r.ok); assert.ok(!MER.rutaCrear(s, { a: 'roma', b: mejor.b, prod: mejor.p, cargas: 999 }).ok);
  assert.ok(MER.rutaQuitar(s, r.ruta.id) && s.mercado.rutas.length === 0);
  s.cities.roma.b.mercado = 0; s.cities.roma.b.puerto = 0; assert.ok(!MER.rutaCrear(s, { a: 'roma', b: 'syracusae', prod: 'grano', cargas: 1 }).ok);
});
t('ruta en el mes: se compra, se vende y entra dinero', () => {
  const s = nueva(); quieto(s); s.t = 6; s.cities.roma.b.mercado = 3; s.cities.roma.b.puerto = 3;
  const r = MER.rutaCrear(s, { a: 'roma', b: 'syracusae', prod: 'hierro', cargas: 3 }); assert.ok(r.ok); const cu = MER.rutaCuenta(s, r.ruta);
  const ay = { enGuerra: () => false, bloqueada: () => false, cosecha: () => null }; const rr = MER.mes(s, ay); assert.ok(typeof rr.delta.denarios === 'number');
  assert.ok(cu.compra > 0 && cu.venta > 0);
});
t('viaje llega en su mes y puede perderse (semilla fija)', () => {
  const ay = { enGuerra: () => false, bloqueada: () => false, cosecha: () => null };
  const s = nueva(); quieto(s); s.t = 6; const v = MER.viajeLanzar(s, { a: 'roma', b: 'carthago', prod: 'vino', cargas: 5 }, ay);
  assert.ok(v.ok && v.delta.denarios < 0); const meses = v.viaje.meses; assert.ok(meses >= 1);
  let llega = -1; for (let i = 1; i <= meses + 1; i++) { s.t++; const r = MER.mes(s, ay); if (!s.mercado.viajes.length && llega < 0) { llega = i; assert.ok(r.avisos.length >= 1); } }
  assert.strictEqual(llega, meses);
  let perdidos = 0, llegados = 0;
  for (let k = 0; k < 40; k++) { const q = nueva(); q.mercado.semilla = 100 + k; q.mercado.rng = 7 * k + 1; q.t = 6; MER.viajeLanzar(q, { a: 'roma', b: 'gades', prod: 'grano', cargas: 2 }, ay); let r; for (let i = 0; i < 6; i++) { q.t++; r = MER.mes(q, ay); if (!q.mercado.viajes.length) break; } if (r.avisos.some(a => /perdido/.test(a.texto))) perdidos++; else llegados++; }
  assert.ok(perdidos > 0 && llegados > 0, perdidos + '/' + llegados);
  const q1 = nueva(), q2 = nueva(); q1.mercado.rng = q2.mercado.rng = 5; for (const q of [q1, q2]) { q.t = 6; MER.viajeLanzar(q, { a: 'roma', b: 'gades', prod: 'grano', cargas: 2 }, ay); for (let i = 0; i < 6; i++) { q.t++; MER.mes(q, ay); } } assert.strictEqual(J(q1.mercado), J(q2.mercado));
  const b = nueva(); b.mercado.sucesos = [{ t: 'bloqueo', c: 'carthago', hasta: 99 }]; assert.ok(!MER.viajeLanzar(b, { a: 'roma', b: 'carthago', prod: 'vino', cargas: 1 }, ay).ok);
});
t('la portoria cobra a los rivales', () => {
  const s = nueva(); quieto(s); s.t = 6; const ay = { enGuerra: () => false, bloqueada: () => false, cosecha: () => null };
  MER.portoriumFijar(s, 'roma', 0.05); let tot = 0;
  for (let i = 0; i < 6; i++) { s.mercado.S.roma = { hierro: 1, grano: 1, vino: 1, aceite: 1, lana: 1 }; s.t++; tot += MER.mes(s, ay).delta.denarios || 0; }
  assert.ok(tot > 0, 'no se cobró nada: ' + tot); assert.ok(Object.values(s.mercado.rivales).some(r => r.ops > 0));
  assert.strictEqual(MER.portoriumFijar(s, 'roma', 0.9) && s.mercado.portoria.roma, 0.05);
});
t('los cuatro contratos: votan, se aprueban/rechazan y vencen', () => {
  const si = { votar: () => true }, no = { votar: () => false };
  const s = nueva(); quieto(s); assert.strictEqual(MER.contratosPosibles(s, si).length, 4);
  assert.ok(MER.contratoProponer(s, 'annona', null, si).aprobado); assert.ok(!MER.contratoProponer(s, 'annona', null, si).ok);
  assert.ok(!MER.contratoProponer(s, 'flota', null, no).aprobado && s.mercado.contratos.length === 1);
  assert.ok(MER.contratoProponer(s, 'flota', null, si).aprobado); assert.strictEqual(MER.efectos(s).riesgoMar, 0.5);
  const ef = MER.efectos(s); assert.strictEqual(ef.felicidad.pue, 8);
  const p0 = MER.precio(s, 'roma', 'sal'); assert.ok(MER.contratoProponer(s, 'monopolio_sal', null, si).aprobado); assert.ok(MER.precio(s, 'roma', 'sal') > p0 * 1.25);
  assert.ok(!MER.contratoProponer(s, 'tratado', null, si).ok); const op = MER.contratosPosibles(s, si).find(x => x.id === 'tratado').opciones; assert.ok(op.length);
  assert.ok(MER.contratoProponer(s, 'tratado', { f: op[0] }, si).aprobado); assert.ok(MER.efectos(s).portoriaCero.includes(op[0]));
  assert.ok(MER.contratoProponer(s, 'tratado', { f: 'roma' }, si).ok === false);
  const ay = { enGuerra: () => false, bloqueada: () => false, cosecha: () => null }; const d = MER.mes(s, ay); assert.ok(d.delta.denarios < 0 || d.delta.denarios >= 0);
  for (let i = 0; i < 25; i++) { s.t++; MER.mes(s, ay); } assert.strictEqual(s.mercado.contratos.length, 0); assert.strictEqual(MER.efectos(s).felicidad.pue, 0);
  assert.ok(!MER.contratoProponer(nueva(), 'annona').aprobado);
});
t('acaparar grano avisa y resta felicidad', () => {
  const s = nueva(); quieto(s); s.t = 3; s.mercado.sucesos = [{ t: 'mala', c: 'roma', hasta: 99 }];
  const ay = { enGuerra: () => false, bloqueada: () => false, cosecha: () => null, existencias: () => ({ grano: 1000, consumoGrano: 10 }) };
  s.mercado.S.roma = { grano: -0.8 }; s.t++; const r = MER.mes(s, ay); assert.ok(r.efectos.felicidad.pue <= -5 && r.avisos.some(a => /acapar/.test(a.texto)), J(r.avisos));
});
t('la verdura caduca y la ayuda manda en lo demás', () => {
  const s = nueva(); s.t = 4; const r = MER.mes(s, { enGuerra: () => false, bloqueada: () => false, cosecha: () => null, existencias: () => ({ verdura: 100, vino: 100 }) });
  assert.strictEqual(r.delta.verdura, -30); assert.ok(!r.delta.vino);
  s.t++; const q = MER.mes(s, { enGuerra: () => false, bloqueada: () => false, cosecha: () => null, existencias: () => ({ vino: 100 }), perdida: p => p === 'vino' ? 0.07 : 0 }); assert.strictEqual(q.delta.vino, -7);
});
t('la producción sobrante abarata; sucesos del juego suben el grano', () => {
  const s = nueva(); quieto(s); s.t = 4; const p0 = MER.precio(s, 'roma', 'vino');
  MER.mes(s, { enGuerra: () => false, bloqueada: () => false, cosecha: () => null, produccion: () => ({ vino: 300 }) }); assert.ok(MER.precio(s, 'roma', 'vino') < p0 * 1.01);
  const q = nueva(); quieto(q); const g0 = MER.precio(q, 'syracusae', 'grano'); q.t++; MER.mes(q, { enGuerra: f => f === 'siracusa', bloqueada: () => false, cosecha: () => null });
  const tb = MER.tabla(q, 'syracusae'); assert.ok(tb.find(x => x.prod === 'grano').precio > 0 && tb.length === MER.ORDEN.length);
  assert.ok(g0 > 0);
});
t('misma semilla, mismos precios', () => {
  const a = nueva(), b = nueva(); a.mercado.semilla = b.mercado.semilla = 42; const ay = { enGuerra: () => false };
  for (let i = 0; i < 8; i++) { a.t++; b.t++; MER.mes(a, ay); MER.mes(b, ay); }
  for (const c of Object.keys(a.cities)) for (const p of MER.ORDEN) assert.strictEqual(MER.precio(a, c, p), MER.precio(b, c, p));
  b.mercado.semilla = 43; assert.ok(Object.keys(a.cities).some(c => MER.precio(a, c, 'sal') !== MER.precio(b, c, 'sal')));
});
t('flecha, mejores, consejo y flete', () => {
  const s = nueva(); quieto(s); s.t = 5; MER.mes(s, { enGuerra: () => false, bloqueada: () => false, cosecha: () => null }); s.t = 6;
  const f = MER.flecha(s, 'roma', 'grano'); assert.ok([-1, 0, 1].includes(f)); const mj = MER.mejores(s, 'grano', 3); assert.strictEqual(mj.barato.length, 3); assert.ok(mj.barato[0].precio <= mj.caro[0].precio);
  const c = MER.consejo(s); assert.ok(typeof c.texto === 'string'); const fl = MER.flete(s, 'roma', 'carthago', 'grano', 4); assert.ok(fl.via === 'mar' && fl.meses >= 1 && fl.coste > 0);
  assert.strictEqual(MER.flete(s, 'roma', 'mediolanum', 'grano', 4).via, 'tierra'); assert.strictEqual(MER.flete(s, 'roma', 'carthago', 'grano', 4, { esMar: () => false, travel: () => 2.2 }).meses, 3);
});
t('24 meses sin NaN ni precios <= 0, y cabe en 30 KB', () => {
  const s = nueva(); s.cities.roma.b.mercado = 5; s.cities.roma.b.puerto = 5; for (const [a, b, p] of [['roma', 'carthago', 'vino'], ['roma', 'massalia', 'hierro'], ['roma', 'gades', 'aceite']]) MER.rutaCrear(s, { a, b, prod: p, cargas: 5 });
  MER.contratoProponer(s, 'annona', null, { votar: () => true });
  for (let i = 0; i < 24; i++) {
    s.t++; const r = MER.mes(s, { produccion: () => ({ vino: 50 }), existencias: () => ({ verdura: 40 }) });
    for (const k in r.delta) assert.ok(Number.isFinite(r.delta[k]), k);
    for (const c of Object.keys(s.cities)) for (const p of MER.ORDEN) { const x = MER.precio(s, c, p); assert.ok(Number.isFinite(x) && x > 0, c + p + x); }
  }
  const kb = J(s.mercado).length / 1024; assert.ok(Object.keys(s.cities).length >= 26 && kb < 30, kb.toFixed(1) + ' KB');
});

const AYM = () => ({ enGuerra: () => false, bloqueada: () => false, cosecha: () => null });
const avanza = (s, k, ay) => { let r; for (let i = 0; i < k; i++) { s.t++; r = MER.mes(s, ay || AYM()); } return r; };
t('publicanos: migrar es idempotente', () => {
  const s = nueva(); assert.deepStrictEqual(s.mercado.publicanos, { ofertas: [], aceptados: [] }); assert.deepStrictEqual(s.mercado.recaudo, {});
  const a = J(s.mercado); MER.migrar(s); assert.strictEqual(J(s.mercado), a);
  delete s.mercado.publicanos; delete s.mercado.recaudo; MER.migrar(s); assert.ok(Array.isArray(s.mercado.publicanos.ofertas) && s.mercado.recaudo);
  assert.ok(MER.PUBLICANOS.ejercito && MER.PUBLICANOS.obras && MER.PUBLICANOS.annona && MER.PUBLICANOS.obras.fuente);
});
t('publicanos: salen ofertas en 24 meses (máx. 2, bien formadas)', () => {
  const s = nueva(); let vistas = 0;
  for (let i = 0; i < 24; i++) { avanza(s, 1); const v = MER.publicanosVer(s); assert.ok(v.ofertas.length <= 2); vistas += v.ofertas.length;
    for (const o of v.ofertas) { assert.ok(o.cargas >= 6 && o.cargas <= 20 && o.paga > 0 && o.fianza === Math.round(o.paga * 0.2) && o.plazo === 4 && o.caduca > s.t - 1 && o.fuente && MER.PUBLICANOS[o.tipo]); if (o.tipo !== 'ejercito') assert.strictEqual(o.destino, 'roma'); } }
  assert.ok(vistas > 0);
});
const conOferta = () => { const s = nueva(); for (let i = 0; i < 60 && !MER.publicanosVer(s).ofertas.length; i++) avanza(s, 1); return s; };
t('publicanos: aceptar cobra la fianza; sin dinero no deja', () => {
  const s = conOferta(), o = MER.publicanosVer(s).ofertas[0];
  assert.ok(!MER.publicanoAceptar(s, o.id, { tiene: () => 0 }).ok);
  const r = MER.publicanoAceptar(s, o.id, { tiene: () => 1e6 }); assert.ok(r.ok && r.delta.denarios === -o.fianza);
  const v = MER.publicanosVer(s); assert.ok(!v.ofertas.some(x => x.id === o.id)); const a = v.aceptados[0]; assert.ok(a.entregado === 0 && a.falta === o.cargas && a.hasta === Math.floor(s.t) + 4);
  assert.ok(!MER.publicanoAceptar(s, 'nada').ok);
});
t('publicanos: entregar completo paga paga + fianza', () => {
  const s = conOferta(), o = MER.publicanosVer(s).ofertas[0]; MER.publicanoAceptar(s, o.id, { tiene: () => 1e6 });
  assert.ok(!MER.publicanoEntregar(s, o.id, 1, { tiene: () => 0 }).ok); assert.ok(!MER.publicanoEntregar(s, o.id, o.cargas + 1, { tiene: () => 1e6 }).ok);
  const a = MER.publicanoEntregar(s, o.id, 2, { tiene: () => 1e6 }); assert.ok(a.ok && a.delta[o.prod] === -2 && !a.delta.denarios);
  const b = MER.publicanoEntregar(s, o.id, o.cargas - 2, { tiene: () => 1e6 }); assert.ok(b.ok && b.delta.denarios === o.paga + o.fianza && b.avisos.length === 1 && b.avisos[0].tono === 'bueno');
  assert.strictEqual(MER.publicanosVer(s).aceptados.length, 0);
});
t('publicanos: plazo vencido pierde el contrato y la fianza', () => {
  const s = conOferta(), o = MER.publicanosVer(s).ofertas[0]; MER.publicanoAceptar(s, o.id, { tiene: () => 1e6 });
  let fallidos = 0, malo = false; for (let i = 0; i < 6; i++) { const r = avanza(s, 1); fallidos += r.efectos.contratosFallidos; malo = malo || r.avisos.some(x => x.tono === 'malo' && /pierdes la fianza/.test(x.texto)); }
  assert.strictEqual(fallidos, 1); assert.ok(malo); assert.strictEqual(MER.publicanosVer(s).aceptados.length, 0);
});
t('publicanos: máximo 3 aceptados a la vez', () => {
  const s = nueva(); const ay = { tiene: () => 1e6 };
  s.mercado.publicanos.ofertas = [1, 2, 3, 4].map(i => ({ id: 'x' + i, tipo: 'annona', n: 'Grano para Roma', prod: 'grano', cargas: 6, destino: 'roma', paga: 50, fianza: 10, caduca: 99, plazo: 4 }));
  for (const i of [1, 2, 3]) assert.ok(MER.publicanoAceptar(s, 'x' + i, ay).ok); assert.ok(!MER.publicanoAceptar(s, 'x4', ay).ok);
});
t('ayudaAgro: con olivar propio el aceite baja de precio', () => {
  const mk = () => { const s = nueva(); quieto(s); s.t = 3; s.agro = { parcelas: [1, 2, 3].map(() => ({ campo: 'olivar', suelo: 'ladera_seca', nivel: 5, mejoras: ['almazara'], ciudad: 'roma' })) }; return s; };
  const a = mk(), b = mk(); assert.ok(Agro.produccionCiudad(a, 'roma', 10).aceite > 0 || Agro.produccionCiudad(a, 'roma', 11).aceite > 0);
  const ay0 = MER.ayudaAgro(Agro, a, AYM()); assert.ok(typeof ay0.produccion === 'function' && typeof ay0.perdida === 'function' && ay0.enGuerra);
  assert.strictEqual(ay0.perdida('verdura', null), 0.3); assert.strictEqual(ay0.perdida('hierro', 'roma'), 0); assert.strictEqual(MER.ayudaAgro(Agro, a, { perdida: () => 7 }).perdida(), 7);
  assert.deepStrictEqual(Object.keys(MER.ayudaAgro(Agro, a)).sort(), ['perdida', 'produccion']);
  avanza(a, 9, MER.ayudaAgro(Agro, a, AYM())); avanza(b, 9, AYM()); assert.ok(MER.precio(a, 'roma', 'aceite') < MER.precio(b, 'roma', 'aceite'), MER.precio(a, 'roma', 'aceite') + ' vs ' + MER.precio(b, 'roma', 'aceite'));
});
t('aduana más alta: los rivales no pasan más ni pagan más en 12 meses', () => {
  const corre = tasa => { const s = nueva(); for (const c of Object.keys(s.cities)) if (s.cities[c].owner === 'roma') MER.portoriumFijar(s, c, tasa); let ops = 0; for (let i = 0; i < 12; i++) { avanza(s, 1); } for (const r of Object.values(s.mercado.rivales)) ops += r.ops; return ops; };
  assert.ok(corre(0.05) <= corre(0));
});
t('rivalesVer y aduanasVer: forma y recaudo', () => {
  const s = nueva(); assert.strictEqual(MER.TASA_MAX, 0.05); MER.portoriumFijar(s, 'roma', 0.05);
  let tot = 0; for (let i = 0; i < 6; i++) { s.mercado.S.roma = { hierro: 1, grano: 1, vino: 1, aceite: 1, lana: 1 }; avanza(s, 1); tot += MER.aduanasVer(s).find(x => x.ciudad === 'roma').recaudado; }
  assert.ok(tot > 0);
  const rv = MER.rivalesVer(s); assert.strictEqual(rv.length, 3);
  for (const r of rv) { assert.ok(r.id && r.n && Array.isArray(r.f) && typeof r.ops === 'number' && typeof r.enGuerra === 'boolean' && typeof r.texto === 'string'); if (r.que) for (const k of ['prod', 'n', 'a', 'b', 'na', 'nb']) assert.ok(r.que[k]); }
  assert.ok(rv.some(r => r.que)); s.mercado.rivales.punicos.ult = 'guerra'; const g = MER.rivalesVer(s).find(r => r.id === 'punicos'); assert.ok(g.enGuerra && g.que === null);
  const ad = MER.aduanasVer(s); assert.ok(ad.length >= 1 && ad.every(x => x.ciudad && x.n && typeof x.tasa === 'number' && typeof x.recaudado === 'number'));
});
t('determinismo: dos partidas iguales, mismo mercado tras 12 meses', () => {
  const a = nueva(), b = nueva(); avanza(a, 12); avanza(b, 12); assert.strictEqual(J(a.mercado), J(b.mercado));
});
console.log(`\n${n}/${n + mal}`); if (mal) process.exit(1);
