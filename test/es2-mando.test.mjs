/* AQVILA — ES2: el mando de varios cuerpos, sin pantalla. node test/es2-mando.test.mjs */
import assert from 'node:assert';
import * as IA from '../js/bloque-ia.js';
import * as BL from '../js/bloque.js';
import { crearMando } from '../js/mando-varios.js';
const { crearCombate, juega, DT, V_TESTUDO, centro } = IA;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const ORO = {"n1": ["tuyo", 117.4, 57, 172], "m1": ["tuyo", 130.9, 70, 169], "n2": ["tuyo", 128.8, 61, 181], "m2": ["enemigo", 126.5, 68, 155], "n3": ["enemigo", 112.5, 67, 152], "m3": ["tuyo", 101.2, 33, 147]};
const nueva = (sem = 1, nivel = 'normal') => {
  const C = crearCombate({ semilla: sem, nivel, motor: BL, bloque: BL.crearBloque({ id: 'yo', bando: 'yo', tipo: 'falange', x: 0, z: 0, rumbo: 0 }), fuerzas: { tuyo: 128 } });
  return { C, M: crearMando(C, { MO: BL }) };
};
const pasos = (C, s) => { for (let i = 0; i < s / DT && !C.S.ganador; i++) C.paso(DT); };
const D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

t('el manípulo solo da lo mismo que antes (misma semilla)', () => {
  for (const s of [1, 2, 3]) {
    const a = juega('normal', 'bueno', s), b = juega('normal', 'bueno', s, DT, BL);
    assert.deepStrictEqual([a.ganador, a.T, a.perdidos, a.matados], ORO['n' + s], 'sin motor ' + s);
    assert.deepStrictEqual([b.ganador, b.T, b.perdidos, b.matados], ORO['m' + s], 'con motor ' + s);
  }
});
t('combinada: tres cuerpos, falange al centro y manípulos con hueco de 8 m', () => {
  const { C, M } = nueva(); const S = C.S;
  assert.deepStrictEqual(M.cuerpos.map(c => c.id), ['falange', 'man1', 'man2']);
  assert.strictEqual(M.elegido, 'todos');
  const f = S.tuyo, [a, b] = S.amigas;
  assert.ok(a.x < f.x && b.x > f.x);
  assert.ok(Math.abs((f.x - f.ancho / 2) - (a.x + a.ancho / 2) - 8) < 0.01 && Math.abs((b.x - b.ancho / 2) - (f.x + f.ancho / 2) - 8) < 0.01, 'hueco de 8 m');
  assert.deepStrictEqual(M.ordenesDe('falange'), ['picas', 'cerrar', 'avanzar', 'alto']);
  assert.deepStrictEqual(M.ordenesDe('man1'), ['testudo', 'cargar', 'relevo', 'alto']);
  assert.deepStrictEqual(M.ordenesDe('todos'), ['avanzar', 'alto', 'cargar', 'retirada']);
});
t('elegir cuerpo y frente del elegido mueve solo a ese', () => {
  const { C, M } = nueva(); const S = C.S, f0 = { x: S.tuyo.x, z: S.tuyo.z }, b0 = { x: S.amigas[1].x, z: S.amigas[1].z };
  assert.ok(M.elige('man1') && !M.elige('nadie') && M.elegido === 'man1');
  const a0 = { x: S.amigas[0].x, z: S.amigas[0].z };
  M.dibujaFrente({ x: a0.x - 8, z: -20 }, { x: a0.x + 8, z: -20 });
  pasos(C, 12);
  assert.ok(D(S.amigas[0], a0) > 8, 'el elegido avanza');
  assert.ok(D(S.amigas[1], b0) < 0.01 && D(S.tuyo, f0) < 0.01, 'los demás siguen donde estaban');
});
t('frente de Todos coloca los tres con sus huecos', () => {
  const { C, M } = nueva(); const S = C.S; M.elige('todos');
  M.dibujaFrente({ x: -6, z: -12 }, { x: 6, z: -12 });
  pasos(C, 30);
  const f = S.tuyo, [a, b] = S.amigas;
  for (const c of [f, a, b]) assert.ok(Math.abs(c.z + 12) < 2.5 && D(c, f) < 60, 'llega a la raya z=-12: ' + c.z);
  assert.ok(Math.abs((f.x - f.ancho / 2) - (a.x + a.ancho / 2) - 8) < 1.5 && Math.abs((b.x - b.ancho / 2) - (f.x + f.ancho / 2) - 8) < 1.5, 'huecos de 8 m: ' + [a.x, f.x, b.x]);
});
t('la pausa no avanza el tiempo y las órdenes dadas en pausa se cumplen al reanudar', () => {
  const { C, M } = nueva(); const S = C.S; M.elige('man2');
  M.pon(true); const T0 = S.T, x0 = S.amigas[1].x, z0 = S.amigas[1].z;
  assert.ok(M.orden('cargar') || true); M.dibujaFrente({ x: x0 - 8, z: -15 }, { x: x0 + 8, z: -15 });
  for (let i = 0; i < 50; i++) C.paso(DT);
  assert.strictEqual(S.T, T0, 'el reloj no corre'); assert.ok(D(S.amigas[1], { x: x0, z: z0 }) < 1e-9); assert.strictEqual(M.cola.length, 2);
  M.pon(false); assert.strictEqual(M.cola.length, 0); pasos(C, 10);
  assert.ok(S.T > T0 && D(S.amigas[1], { x: x0, z: z0 }) > 5, 'ahora sí marcha');
});
t('Testudo del manípulo: V_TESTUDO, no carga y «Cargar» no se ilumina', () => {
  const { C, M } = nueva(); const S = C.S, m = S.amigas[0]; M.elige('man1');
  assert.ok(M.orden('testudo') && m.orden === 'testudo');
  assert.strictEqual(M.orden('cargar'), false, 'bajo el techo no se carga'); assert.strictEqual(m.orden, 'testudo');
  assert.notStrictEqual(M.util('man1'), 'cargar');
  M.dibujaFrente({ x: m.x - 8, z: -30 }, { x: m.x + 8, z: -30 }); assert.strictEqual(m.orden, 'testudo', 'marchar no lo quita');
  const z0 = m.z; pasos(C, 5); assert.ok(m.v > 0 && m.v <= V_TESTUDO + 1e-6, 'v=' + m.v); assert.ok(Math.abs(m.z - z0) <= V_TESTUDO * 5 + 0.5);
  assert.ok(M.orden('testudo') && m.orden === 'alto', 'Testudo otra vez lo abre');
});
t('la partida acaba sin errores con el mando', () => {
  for (const s of [1, 2]) {
    const { C, M } = nueva(s); M.elige('todos'); M.orden('avanzar');
    let i = 0; while (!C.S.ganador && i++ < 4000) { if (i % 100 === 1) { M.elige(['falange', 'man1', 'man2', 'todos'][(i / 100 | 0) % 4]); M.orden(M.ordenesDe(M.elegido)[1]); } C.paso(DT); }
    assert.ok(C.S.ganador, 'acaba');
  }
});
console.log(`${n} bien, ${mal} mal`); process.exit(mal ? 1 : 0);
