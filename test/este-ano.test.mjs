// AQVILA — CE5: reglas de «Este año» y tributo de guerra. node test/este-ano.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const EA = require('../js/este-ano.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const J = x => JSON.stringify(x);
const fila = (fs, r) => fs.find(f => f.r === r);

t('apunta y cuentas por ciudad e imperio', () => {
  const l = EA.nuevoLibro(-250);
  EA.apunta(l, 'roma', 'denarios', 100, 'impuestos'); EA.apunta(l, 'roma', 'denarios', -40, 'edificios');
  EA.apunta(l, 'capua', 'aceite', 30, 'cosecha'); EA.apunta(l, 'capua', 'vino', 20, 'cosecha'); EA.apunta(l, 'capua', 'vino', -5, 'comida');
  EA.apunta(l, 'roma', 'verdura', 7, 'cosecha'); EA.apunta(l, 'roma', 'lana', 9, 'comercio'); EA.apunta(l, '_imperio', 'denarios', -30, 'legiones');
  const c = EA.cuentas(l);
  assert.deepStrictEqual(c.imperio.map(f => f.r), ['denarios', 'aceite', 'vino', 'verdura', 'lana']);
  assert.strictEqual(fila(c.imperio, 'denarios').saldo, 30); assert.strictEqual(fila(c.ciudades.roma, 'denarios').saldo, 60);
  assert.ok(!('_imperio' in c.ciudades)); assert.strictEqual(fila(c.ciudades.capua, 'vino').saldo, 15);
  assert.strictEqual(fila(c.imperio, 'denarios').tendencia, null); assert.strictEqual(fila(c.imperio, 'denarios').antes, null);
  assert.deepStrictEqual(fila(c.imperio, 'denarios').motivosSale, [{ m: 'edificios', n: 40 }, { m: 'legiones', n: 30 }]);
});
t('apuntaMes y otros recursos', () => {
  const l = EA.nuevoLibro(1); EA.apuntaMes(l, 'roma', { denarios: { impuestos: 50, obras: -10 }, sal: { comercio: 3 } });
  const c = EA.cuentas(l); assert.strictEqual(fila(c.imperio, 'denarios').saldo, 40); assert.strictEqual(c.imperio[c.imperio.length - 1].r, 'sal');
});
t('tendencia con año anterior', () => {
  const a = EA.nuevoLibro(1), b = EA.nuevoLibro(2);
  EA.apunta(a, 'roma', 'denarios', 100, 'impuestos'); EA.apunta(b, 'roma', 'denarios', 150, 'impuestos');
  EA.apunta(a, 'roma', 'grano', 100, 'cosecha'); EA.apunta(b, 'roma', 'grano', 101, 'cosecha');
  EA.apunta(a, 'roma', 'vino', 100, 'cosecha'); EA.apunta(b, 'roma', 'vino', 50, 'cosecha');
  const c = EA.cuentas(b, a);
  assert.strictEqual(fila(c.imperio, 'denarios').tendencia, 'sube'); assert.strictEqual(fila(c.imperio, 'denarios').antes, 100);
  assert.strictEqual(fila(c.imperio, 'grano').tendencia, 'igual'); assert.strictEqual(fila(c.imperio, 'vino').tendencia, 'baja');
  assert.strictEqual(fila(c.ciudades.roma, 'vino').tendencia, 'baja');
});
t('faltan: saldo negativo en el imperio', () => {
  const l = EA.nuevoLibro(1); EA.apunta(l, 'roma', 'grano', -20, 'comida'); EA.apunta(l, 'roma', 'denarios', 5, 'impuestos');
  assert.deepStrictEqual(EA.cuentas(l).faltan, ['grano']);
});
t('adondeVa: pc suman 100 y caminos', () => {
  const l = EA.nuevoLibro(1);
  EA.apunta(l, 'roma', 'denarios', -1, 'legiones'); EA.apunta(l, 'roma', 'denarios', -1, 'obras'); EA.apunta(l, 'roma', 'denarios', -1, 'senado'); EA.apunta(l, 'roma', 'denarios', -1, 'rareza');
  const a = EA.adondeVa(l);
  assert.strictEqual(a.total, 4); assert.strictEqual(a.partes.reduce((x, p) => x + p.pc, 0), 100); assert.strictEqual(a.caminos.reduce((x, p) => x + p.pc, 0), 100);
  assert.strictEqual(a.partes.find(p => p.motivo === 'rareza').camino, 'otros');
  const l2 = EA.nuevoLibro(1); EA.apunta(l2, 'a', 'denarios', -50, 'legiones'); EA.apunta(l2, 'b', 'denarios', -30, 'tributoGuerra'); EA.apunta(l2, 'b', 'denarios', -20, 'obras');
  const b = EA.adondeVa(l2); assert.strictEqual(b.mayor.motivo, 'legiones'); assert.strictEqual(b.caminos[0].camino, 'guerra'); assert.strictEqual(b.caminos[0].pc, 80);
  const v = EA.adondeVa(EA.nuevoLibro(1)); assert.deepStrictEqual([v.total, v.partes, v.caminos, v.mayor], [0, [], [], null]);
});
t('balanceGuerra', () => {
  const l = EA.nuevoLibro(1);
  EA.apunta(l, '_imperio', 'denarios', -100, 'legiones'); EA.apunta(l, '_imperio', 'denarios', -20, 'tributoGuerra'); EA.apunta(l, 'roma', 'denarios', -10, 'indemnizacion');
  EA.apunta(l, 'roma', 'denarios', 60, 'botin'); EA.apunta(l, 'roma', 'denarios', 15, 'indemnizacion'); EA.apunta(l, 'roma', 'grano', 999, 'botin');
  assert.deepStrictEqual(EA.balanceGuerra(l), { cuesta: 130, gana: 75, saldo: -55 }); assert.deepStrictEqual(EA.cuentas(l).guerra, EA.balanceGuerra(l));
});
t('registro, cerrarAnio no muta, migrar idempotente', () => {
  const r = EA.registro(-250); EA.apunta(r.actual, 'roma', 'denarios', 5, 'impuestos); '.slice(0, 9));
  const antes = J(r), r2 = EA.cerrarAnio(r, -249);
  assert.strictEqual(J(r), antes); assert.strictEqual(r2.anterior, r.actual); assert.strictEqual(r2.actual.anio, -249); assert.deepStrictEqual(r2.actual.c, {});
  const s = {}; assert.strictEqual(EA.migrar(s, 1), true); const x = J(s); assert.strictEqual(EA.migrar(s, 2), false); assert.strictEqual(J(s), x);
  s.esteAno = { v: 1 }; assert.strictEqual(EA.migrar(s, 3), true); assert.strictEqual(s.esteAno.actual.anio, 3);
  s.esteAno = 'roto'; assert.strictEqual(EA.migrar(s, 4), true);
});
t('tributoPrimavera normal', () => {
  const o = EA.tributoPrimavera({ hombresEnArmas: 1000, ciudadanos: 500, botinAnio: 200, indemnizacionAnio: 100, caja: 5000 });
  assert.strictEqual(o.coste, 1200); assert.deepStrictEqual(o.cubre, { botin: 200, indemnizacion: 100 }); assert.strictEqual(o.falta, 900); assert.strictEqual(o.suspendido, false);
  assert.deepStrictEqual(o.opciones.tributo, { cobra: 900, porCiudadano: 1.8, humor: -4, posible: true }); assert.deepStrictEqual(o.opciones.caja, { paga: 900, alcanza: true });
  assert.strictEqual(EA.tributoPrimavera({ hombresEnArmas: 100000, ciudadanos: 10, caja: 0 }).opciones.tributo.humor, -15);
  assert.strictEqual(EA.tributoPrimavera({ hombresEnArmas: 1000, ciudadanos: 5, caja: 10 }).opciones.caja.alcanza, false);
});
t('tributoPrimavera suspendido, sin hombres, sin ciudadanos', () => {
  const s = EA.tributoPrimavera({ hombresEnArmas: 100, ciudadanos: 50, botinAnio: 90, indemnizacionAnio: 500 });
  assert.strictEqual(s.coste, 120); assert.deepStrictEqual(s.cubre, { botin: 90, indemnizacion: 30 }); assert.strictEqual(s.falta, 0); assert.strictEqual(s.suspendido, true); assert.strictEqual(s.opciones.tributo.humor, 0);
  const z = EA.tributoPrimavera({ hombresEnArmas: 0, ciudadanos: 5, botinAnio: 10 }); assert.deepStrictEqual([z.coste, z.falta, z.suspendido], [0, 0, false]);
  const c = EA.tributoPrimavera({ hombresEnArmas: 100, ciudadanos: 0 }); assert.strictEqual(c.opciones.tributo.posible, false); assert.strictEqual(c.opciones.tributo.porCiudadano, 0);
});
t('indemnización con plazos y última cuota', () => {
  const p = EA.indemnizacion({ riquezaAnual: 1001, anios: 1, dureza: 'leve', inicio: 10 });
  assert.deepStrictEqual([p.total, p.plazos, p.cuota, p.pagado, p.inicio], [501, 5, 101, 0, 10]);
  let pl = p, suma = 0; const cuotas = [];
  for (let a = 8; a <= 20; a++) { const r = EA.cobrarCuota(pl, a); pl = r.plan; suma += r.cuota; cuotas.push(r.cuota); }
  assert.deepStrictEqual(cuotas, [0, 0, 101, 101, 101, 101, 97, 0, 0, 0, 0, 0, 0]); assert.strictEqual(suma, 501); assert.strictEqual(pl.pagado, 501);
  assert.strictEqual(p.pagado, 0); assert.strictEqual(EA.cuotaAnio(p, 9), 0);
  const d = EA.indemnizacion({ riquezaAnual: 100, anios: 99, dureza: 'dura', inicio: 0 }); assert.deepStrictEqual([d.total, d.plazos], [2000, 20]);
  assert.strictEqual(EA.indemnizacion({ riquezaAnual: 100, dureza: 'rara', inicio: 0 }).plazos, 10);
});
t('valores raros', () => {
  const l = EA.nuevoLibro(1); const a = J(l);
  for (const v of [NaN, Infinity, -Infinity, 0, '5', null, undefined]) EA.apunta(l, 'roma', 'denarios', v, 'x');
  EA.apunta(l, '', 'denarios', 5, 'x'); EA.apunta(l, 'roma', '', 5, 'x'); assert.strictEqual(J(l), a);
  const o = EA.tributoPrimavera({ hombresEnArmas: -5, ciudadanos: NaN, botinAnio: -3, caja: NaN }); assert.deepStrictEqual([o.coste, o.falta, o.suspendido], [0, 0, false]);
  assert.strictEqual(EA.indemnizacion({ riquezaAnual: -50, inicio: 1 }).total, 0); assert.strictEqual(EA.cuotaAnio(EA.indemnizacion({ riquezaAnual: 0, inicio: 1 }), 1), 0);
  assert.doesNotThrow(() => EA.cuentas(EA.nuevoLibro(1)));
});
t('revisor: ámbito por ciudad, inicio, anterior, redondeo, vetados', () => {
  const l = EA.nuevoLibro(1);
  EA.apunta(l, 'roma', 'denarios', -50, 'legiones'); EA.apunta(l, 'capua', 'denarios', -30, 'obras'); EA.apunta(l, 'capua', 'denarios', 10, 'botin');
  const c = EA.cuentas(l);
  assert.strictEqual(c.porCiudad.roma.adonde.total, 50); assert.strictEqual(c.porCiudad.capua.adonde.mayor.motivo, 'obras');
  assert.deepStrictEqual(c.porCiudad.capua.guerra, { cuesta: 0, gana: 10, saldo: 10 }); assert.deepStrictEqual(EA.balanceGuerra(l, 'roma'), { cuesta: 50, gana: 0, saldo: -50 });
  assert.ok(!('_imperio' in c.porCiudad)); assert.strictEqual(EA.adondeVa(l, 'denarios', 'roma').caminos[0].pc, 100);
  const p = EA.indemnizacion({ riquezaAnual: 100 }); assert.strictEqual(p.inicio, 0); assert.strictEqual(EA.cuotaAnio({ total: 10, cuota: 5, pagado: 0, plazos: NaN, inicio: 0 }, 0), 0);
  assert.strictEqual(EA.cuotaAnio({ total: 10, cuota: 5, pagado: 0, plazos: 2, inicio: undefined }, 0), 0);
  const s = { esteAno: { v: 1, actual: EA.nuevoLibro(7) } }; EA.apunta(s.esteAno.actual, 'r', 'denarios', 3, 'x');
  assert.strictEqual(EA.migrar(s, 99), true); assert.strictEqual(s.esteAno.anterior, null); assert.strictEqual(s.esteAno.actual.anio, 7); assert.strictEqual(EA.migrar(s, 99), false);
  const m = EA.nuevoLibro(1); EA.apunta(m, 'a', 'denarios', -0.3, 'x'); EA.apunta(m, 'a', 'denarios', -20, 'legiones');
  const a = EA.adondeVa(m); assert.strictEqual(a.partes.length, 1); assert.strictEqual(a.total, 20); assert.strictEqual(a.partes[0].pc, 100);
  const v = EA.nuevoLibro(1); for (const k of ['__proto__', 'constructor', 'prototype']) { EA.apunta(v, k, 'denarios', 1, 'x'); EA.apunta(v, 'a', k, 1, 'x'); EA.apunta(v, 'a', 'denarios', 1, k); }
  assert.deepStrictEqual(Object.keys(v.c), []); assert.strictEqual(({}).denarios, undefined);
});
console.log(`\nOK ${n} pruebas`); if (mal) { console.log(`${mal} fallan`); process.exit(1); }
