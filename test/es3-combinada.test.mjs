/* AQVILA — ES3b: tus tiradores dentro de la partida combinada (js/tiro.js montaTiradores), sin pantalla. node test/es3-combinada.test.mjs */
import assert from 'node:assert';
import * as IA from '../js/bloque-ia.js';
import * as BL from '../js/bloque.js';
import { crearMando } from '../js/mando-varios.js';
import { montaTiradores, TIRADORES, DETRAS } from '../js/tiro.js';
const { crearCombate, DT, centro } = IA;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const nueva = (tipo = 'honderos', sem = 1, nivel = 'normal') => {
  const C = crearCombate({ semilla: sem, nivel, motor: BL, bloque: BL.crearBloque({ id: 'yo', bando: 'yo', tipo: 'falange', x: 0, z: 0, rumbo: 0 }), fuerzas: { tuyo: 128 }, apoyo: { x: 0, z: DETRAS, hombres: 40 } });
  const M = crearMando(C, { MO: BL }); const salvas = [], avisos = [];
  const X = montaTiradores(C, M, { tipo, semilla: sem, alSalva: s => salvas.push(s), avisa: a => avisos.push(a) });
  return { C, M, X, salvas, avisos };
};
const pasos = (C, s, f) => { for (let i = 0; i < s / DT && !C.S.ganador; i++) { C.paso(DT); f && f(); } };
const galos = C => C.S.bloques.filter(b => b.bando === 'g').reduce((s, b) => s + b.U.enPie, 0);

t('la quinta ficha: cuerpo de 40 a 20 m detrás de la línea, con sus cuatro órdenes', () => {
  const { C, M, X } = nueva('honderos'); const S = C.S;
  assert.strictEqual(S.apoyo.U.hombres, 40); assert.deepStrictEqual(M.cuerpos.map(c => c.id), ['falange', 'man1', 'man2', 'tiradores']);
  assert.deepStrictEqual(M.ordenesDe('tiradores'), ['tirar', 'hostigar', 'retirarse', 'alto']);
  assert.ok(Math.abs(S.apoyo.z - S.tuyo.z - DETRAS) < 0.5, 'a 20 m de tu primera fila');
  assert.ok(centro(S.apoyo).z > centro(S.tuyo).z, 'z mayor = detrás de tu línea');
  assert.strictEqual(M.vida('tiradores').n, 40); assert.strictEqual(X.T.municion, TIRADORES.honderos.municion);
});
t('sin apoyo el combate es el de siempre (no hay tiradores)', () => {
  const C = crearCombate({ semilla: 1, nivel: 'normal', motor: BL, bloque: BL.crearBloque({ id: 'yo', bando: 'yo', tipo: 'falange', x: 0, z: 0, rumbo: 0 }), fuerzas: { tuyo: 128 } });
  assert.strictEqual(C.S.apoyo, undefined); assert.strictEqual(montaTiradores(C, crearMando(C, { MO: BL })), null);
});
t('tirar: cuando entran en su alcance salen salvas, gastan munición y mueren galos', () => {
  const { C, X, salvas } = nueva('honderos', 2); const g0 = galos(C);
  assert.ok(X.orden('hostigar'), 'hostigar');
  pasos(C, 70);
  assert.ok(salvas.length >= 1, 'salvas ' + salvas.length); assert.ok(X.T.municion < TIRADORES.honderos.municion, 'munición');
  assert.ok(X.total.muertos > 0 && galos(C) < g0, 'mueren galos: ' + X.total.muertos);
  assert.ok(salvas.every(s => s.proyectil === 'piedra' && s.angulo > 0 && s.n >= 1 && s.vuelo > 0));
});
t('Hostigar: sale por el hueco, tira dos veces y vuelve a su sitio', () => {
  const { C, M, X, salvas } = nueva('honderos', 3); const S = C.S, z0 = X.T.z;
  const cruces = []; X.orden('hostigar'); let min = Infinity, fin = false;
  pasos(C, 120, () => { if (fin) return; min = Math.min(min, X.T.z); if (X.T.z < 8 && X.T.z > -3) cruces.push(X.T.x); if (X.T.orden !== 'hostigar') fin = true; if (fin) { C.S.ganador = C.S.ganador || 'x'; } });
  C.S.ganador = null;
  assert.ok(min < z0 - 15, 'avanzó delante de la línea: ' + min.toFixed(1));
  assert.ok(cruces.length > 0 && cruces.every(x => Math.abs(x) > 8 && Math.abs(x) < 40), 'cruzó la línea por un hueco: ' + cruces.slice(0, 3).map(x => x.toFixed(1)));
  assert.strictEqual(X.T.orden, 'tirar', 'terminó'); assert.ok(salvas.length >= 2, 'tiró ' + salvas.length);
  assert.ok(Math.hypot(X.T.x - 0, X.T.z - z0) < 1.5 || X.T.hostiga === null, 'vuelve');
});
t('Alto el fuego: no tira; Tirar otra vez, sí', () => {
  const { C, X, salvas } = nueva('honderos', 4); X.T.x = 0; X.T.z = -8; X.T.municion = 20;   /* ya a tiro de los galos */
  C.S.ene.centro.x = 0; C.S.ene.centro.z = -50;
  assert.ok(X.orden('tirar') && X.T.orden === 'alto'); pasos(C, 15); assert.strictEqual(salvas.length, 0, 'sin tiros');
  assert.ok(X.orden('tirar') && X.T.orden === 'tirar'); pasos(C, 15); assert.ok(salvas.length >= 1, 'tira otra vez');
});
t('Retirarse: de delante de la línea a detrás, por el hueco entre falange y manípulo', () => {
  const { C, X } = nueva('honderos', 5); const S = C.S;
  X.T.x = 0; X.T.z = -15; const xs = [];
  assert.ok(X.orden('retirarse'));
  pasos(C, 40, () => { if (X.T.z > -3 && X.T.z < 8) xs.push(X.T.x); });
  assert.ok(X.T.z > centro(S.tuyo).z + 3, 'detrás de la línea: ' + X.T.z.toFixed(1));
  assert.ok(xs.length > 0 && xs.every(x => Math.abs(x) > 8), 'por el hueco, no por la falange: ' + xs.slice(0, 3).map(x => x.toFixed(1)));
  assert.strictEqual(X.T.orden, 'alto');
});
t('sin munición se ilumina Retirarse; con una carga cerca, también', () => {
  const { C, X } = nueva('honderos', 6); assert.strictEqual(X.util(), null); X.T.municion = 0; assert.strictEqual(X.util(), 'retirarse');
  X.T.municion = 5; const g = C.S.ene.centro; g.x = 0; g.z = 0; g.orden = 'cargar'; g.v = 3; assert.strictEqual(X.util(), 'retirarse');
});
t('una carga que los alcanza los rompe: huyen y no tiran', () => {
  const { C, X, salvas } = nueva('honderos', 7); const g = C.S.ene.centro, f = centro(X.b);
  g.ang = Math.PI; g.x = X.T.x; g.z = X.T.z - 0.6 + g.fondo / 2; g.orden = 'cargar'; g.v = 4; void f;   /* su primera fila a medio metro de ellos */
  X.paso(DT); assert.ok(X.T.roto && X.T.orden === 'huir', 'rotos'); const n0 = salvas.length; pasos(C, 5); assert.strictEqual(salvas.length, n0);
  assert.strictEqual(X.b.estado, 'huye');
});
t('fuego amigo: con el blanco trabado con los tuyos caen algunos tuyos', () => {
  let propias = 0, aviso = false;
  for (let sem = 1; sem <= 12; sem++) {
    const { C, X, avisos } = nueva('arqueros', sem); const S = C.S;
    S.ene.centro.x = 0; S.ene.centro.z = S.tuyo.z - S.tuyo.fondo - S.ene.centro.fondo / 2 + 1; S.ene.centro.ang = Math.PI;   /* pegado a tu falange */
    X.T.x = 0; X.T.z = 10; X.T.ang = 0; X.marca(S.ene.centro);
    pasos(C, 14); propias += X.total.propias; aviso = aviso || avisos.some(a => /trabados/.test(a));
  }
  assert.ok(propias > 0, 'fuego amigo ' + propias); assert.ok(aviso, 'avisó «trabados»');
});
t('arqueros y vélites también montan su cuerpo (munición y proyectil de su tipo)', () => {
  for (const [tp, mun, pr] of [['arqueros', 24, 'flecha'], ['velites', 7, 'jabalina']]) { const { X } = nueva(tp); assert.strictEqual(X.T.municion, mun); assert.strictEqual(TIRADORES[tp].proyectil, pr); }
});
t('el frente de «Todos» los pone 20 m detrás de la raya', () => {
  const { C, M, X } = nueva('honderos', 8); M.elige('todos'); M.dibujaFrente({ x: -10, z: -20 }, { x: 10, z: -20 }); pasos(C, 40);
  assert.ok(Math.abs(X.T.z - 0) < 2.5 && Math.abs(X.T.x) < 2.5, 'x ' + X.T.x.toFixed(1) + ' z ' + X.T.z.toFixed(1));   /* raya en z=-20, 20 m detrás = 0 */
});
console.log(`\n${n} bien, ${mal} mal`); process.exit(mal ? 1 : 0);
