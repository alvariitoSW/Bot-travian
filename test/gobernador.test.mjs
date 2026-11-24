// AQVILA — MN3: el gobernador. node test/gobernador.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const GOB = require('../js/gobernador.js');
const N = await import('../js/necesidades.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const J = x => JSON.stringify(x);
const nueva = () => ({ t: 3, cities: { a: { owner: 'roma', b: { foro: 1, templo: 1 } }, b: { owner: 'cartago', b: {} } }, ministros: { encargos: {} } });
const cob = (o) => Object.assign({ alimento: 1, agua: 1, limpieza: 1, salud: 1, trabajo: 1, cultura: 1, culto: 1, orden: 1 }, o);
const barrio = (i, c, mem) => ({ i, nombre: 'Barrio' + i, casas: 10, cob: cob(c), mem: Object.assign({ revuelta: false, desc: 0, mal: {} }, mem) });
const ayuda = (bs, huecos, grano) => ({ barrios: () => bs, huecosLibres: () => huecos, prod: () => ({ grano }), disponible: () => 999 });
const dec = (s, a) => GOB.decidir(GOB.vista(s, 'a', a));

t('migrar es idempotente y repara', () => {
  const s = nueva(); GOB.migrar(s); const a = J(s.gobernador); GOB.migrar(s); assert.strictEqual(J(s.gobernador), a);
  s.gobernador = { ciudades: 5 }; GOB.migrar(s); assert.deepStrictEqual(s.gobernador, { v: 1, ciudades: {}, informes: {} });
});
t('poner y quitar; ciudades solo las de Roma', () => {
  const s = nueva(); GOB.poner(s, 'a', true); GOB.poner(s, 'b', true); assert.ok(GOB.activo(s, 'a'));
  assert.deepStrictEqual(GOB.ciudades(s), ['a']); GOB.poner(s, 'a', false); assert.ok(!GOB.activo(s, 'a')); assert.deepStrictEqual(GOB.ciudades(s), []);
});
t('revuelta: calmar primero', () => {
  const r = dec(nueva(), ayuda([barrio(1, {}, { revuelta: true }), barrio(2)], 1, 50));
  assert.deepStrictEqual(r.calmar, [{ barrio: 1, remedios: ['grano', 'juegos', 'tropas'].sort((a, b) => N.REMEDIOS_REVUELTA.indexOf(a) - N.REMEDIOS_REVUELTA.indexOf(b)) }]);
});
t('sin agua y sin orden: fuente y cuartel antes que lo demás', () => {
  const r = dec(nueva(), ayuda([barrio(1, { agua: 0, orden: 0 }), barrio(2, { agua: 0.2, orden: 0.1 })], 3, 50));
  assert.deepStrictEqual(r.obras.slice(0, 2).map(o => o.tipo).sort(), ['cuartel', 'fuente']);
  const f = r.obras.find(o => o.tipo === 'fuente'); assert.strictEqual(f.necesidad, 'agua'); assert.strictEqual(f.porque, 'faltaba agua en 2 barrios');
  assert.strictEqual(r.obras.length, 3);
});
t('grano negativo: la granja es la primera obra', () => {
  const r = dec(nueva(), ayuda([barrio(1, { agua: 0 })], 2, -4));
  assert.strictEqual(r.obras[0].tipo, 'granja'); assert.strictEqual(r.obras[0].porque, 'falta comida'); assert.strictEqual(r.obras[1].tipo, 'fuente');
});
t('sin huecos: encargos a ministros libres y no a ocupados', () => {
  const s = nueva(); const bs = [barrio(1, { culto: 0, cultura: 0, orden: 0 })];
  let r = dec(s, ayuda(bs, 0, 50));
  assert.deepStrictEqual(r.obras, []); assert.deepStrictEqual(r.encargos.map(e => e.mid).sort(), ['culto', 'ejercito']);
  const e = r.encargos.find(x => x.mid === 'culto').e; assert.deepStrictEqual(e, { tipo: 'nivel', ciudad: 'a', b: 'templo', objetivo: 2, libre: true, necesidad: 'culto' });
  s.ministros.encargos.culto = { x: 1 }; r = dec(s, ayuda(bs, 0, 50));
  assert.ok(!r.encargos.some(x => x.mid === 'culto'));
});
t('con huecos libres y todo cubierto: regla del bot', () => {
  const r = dec(nueva(), ayuda([barrio(1)], 2, 50));
  assert.strictEqual(r.obras.length, 2); r.obras.forEach(o => { assert.strictEqual(o.porque, 'para crecer'); assert.ok(!['herreria', 'escuela', 'muralla', 'viviendas', 'foro'].includes(o.tipo)); });
});
t('es determinista', () => {
  const s = nueva(), a = ayuda([barrio(1, { agua: 0, salud: 0.3 }), barrio(2, { orden: 0.5 }, { revuelta: true })], 1, 3);
  assert.strictEqual(J(dec(s, a)), J(dec(s, a))); assert.ok(!('gobernador' in s));
});
t('estacion: fallo da línea «No pudo…», informe ≤6 líneas', () => {
  const s = nueva(); const bs = []; for (let i = 0; i < 9; i++) bs.push(barrio(i, { agua: 0 }, { revuelta: true }));
  const hacer = { calmar: () => ({ ok: false }), obra: () => ({ ok: false, motivo: 'Faltan recursos' }), encargar: () => ({ ok: false, motivo: 'x' }) };
  const inf = GOB.estacion(s, 'a', 3, ayuda(bs, 2, 50), hacer);
  assert.ok(inf.lineas.length <= 6 && inf.lineas.every(l => l.texto.startsWith('No pudo') && !l.ok)); assert.strictEqual(GOB.informe(s, 'a'), inf);
  const o = GOB.estacion(nueva(), 'a', 3, ayuda([barrio(1, { agua: 0 })], 1, 50), { obra: () => ({ ok: true }) });
  assert.strictEqual(o.lineas[0].texto, 'Levantó una fuente: faltaba agua en 1 barrio.');
});
t('estacion: calma con el primer remedio que vale; sin nada, todo en orden', () => {
  const s = nueva(); const inf = GOB.estacion(s, 'a', 1, ayuda([barrio(1, {}, { revuelta: true })], 0, 50), { calmar: (c, i, r) => ({ ok: r === 'grano' }) });
  assert.strictEqual(inf.lineas[0].texto, 'Calmó el barrio Barrio1 con grano.');
  const v = GOB.estacion(nueva(), 'a', 1, ayuda([barrio(1)], 0, 50), {}); assert.strictEqual(v.lineas[0].texto, 'Todo en orden: no hizo falta nada.');
  assert.strictEqual(GOB.informe(nueva(), 'a'), null); assert.ok(GOB.LICENCIA.length > 20);
});
t('la tabla copiada coincide con necesidades.js', () => {
  assert.deepStrictEqual(GOB.COPIA.NEC, N.NECESIDADES.map(x => [x.id, x.ministro]));
  for (const k in GOB.COPIA.SERV) { assert.ok(N.SERVICIOS[k], k); assert.deepStrictEqual(GOB.COPIA.SERV[k].cubre, N.SERVICIOS[k].cubre); assert.strictEqual(GOB.COPIA.SERV[k].alcance, N.SERVICIOS[k].alcance); }
  assert.strictEqual(Object.keys(GOB.COPIA.SERV).length, Object.keys(N.SERVICIOS).length);
  assert.strictEqual(GOB.COPIA.UMBRAL.cubierta, N.UMBRAL.cubierta); assert.deepStrictEqual(GOB.COPIA.REMEDIOS, N.REMEDIOS_REVUELTA);
});
t('MIN_NIVEL coincide con ministros.js', () => {
  const M = require('../js/ministros.js'); const ex = {};
  M.DATOS.filter(x => x.tipos.includes('nivel')).forEach(x => { ex[x.id] = x.edificios.filter(b => D.BUILD[b]); });
  assert.deepStrictEqual(GOB.COPIA.MIN_NIVEL, ex);
});
t('no encarga a ciencia ni hacienda ni edificios que el ministro no lleva', () => {
  const r = dec(nueva(), ayuda([barrio(1, { cultura: 0, trabajo: 0, salud: 0 })], 0, 50));
  assert.ok(!r.encargos.some(e => e.mid === 'ciencia' || e.mid === 'infra')); assert.deepStrictEqual(r.encargos.map(e => e.e.b), ['mercado']);
});
t('no propone obra ni encargo de lo que ya está en obra', () => {
  const a = Object.assign(ayuda([barrio(1, { trabajo: 0, culto: 0 })], 2, 50), { obras: () => ['mercado', 'taller'] });
  assert.deepStrictEqual(GOB.vista(nueva(), 'a', a).enObra, ['mercado', 'taller']);
  let r = dec(nueva(), a); assert.ok(!r.obras.some(o => ['mercado', 'taller'].includes(o.tipo)));
  r = dec(nueva(), Object.assign(ayuda([barrio(1, { trabajo: 0 })], 0, 50), { obras: () => ['mercado'] })); assert.ok(!r.encargos.some(e => e.e.b === 'mercado'));
});
t('no encarga lo que ya va como obra esa estación', () => {
  const r = dec(nueva(), ayuda([barrio(1, { culto: 0 })], 1, 50));
  assert.strictEqual(r.obras[0].tipo, 'templo'); assert.strictEqual(r.encargos.length, 0);
});
t('el nombre del barrio no repite «barrio»', () => {
  const h = { calmar: () => ({ ok: true }) };
  const m = nom => GOB.estacion(nueva(), 'a', 1, ayuda([Object.assign(barrio(1, {}, { revuelta: true }), { nombre: nom })], 0, 50), h).lineas[0].texto;
  assert.strictEqual(m('Barrio del Foro'), 'Calmó el Barrio del Foro con tropas.'); assert.strictEqual(m('Subura'), 'Calmó el barrio Subura con tropas.');
});
t('encargo con gramática llana', () => {
  const inf = GOB.estacion(nueva(), 'a', 1, ayuda([barrio(1, { culto: 0 })], 0, 50), { encargar: () => ({ ok: true }) });
  assert.strictEqual(inf.lineas[0].texto, 'Encargó al ministro de culto: ' + D.BUILD.templo.n + ' a nivel 2.');
});
console.log(n + ' bien, ' + mal + ' mal'); process.exit(mal ? 1 : 0);
