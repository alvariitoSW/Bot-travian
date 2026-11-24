/* AQVILA — CB2: poses sacadas del estado del motor (js/combate-poses.js). node test/combate-poses.test.mjs */
import assert from 'node:assert';
import { crearHombre, crearAzar, paso, T_GOLPE } from '../js/combate.js';
import { poseDe, rotuloDe, T_CAIDA } from '../js/combate-poses.js';
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }

t('escudo alzado más arriba y delante que bajo', () => {
  const h = crearHombre({ id: 'h' });
  const a = poseDe(h, 0); h.izq.estado = 'bajo'; const b = poseDe(h, 0);
  assert.ok(a.manoI[1] > b.manoI[1] + 0.2 && a.manoI[2] > b.manoI[2], `${a.manoI} / ${b.manoI}`);
  assert.strictEqual(a.escudo, 'alzado'); assert.strictEqual(b.escudo, 'bajo');
});

t('la estocada sale adelante; el tajo baja de arriba', () => {
  const h = crearHombre({ id: 'h', arma: 'gladius' }), g = poseDe(h, 0);
  h.der.estado = 'golpea'; h.der.t = T_GOLPE * 0.45; const e = poseDe(h, 0);
  assert.strictEqual(e.arma, 'estocada'); assert.ok(e.manoD[2] > g.manoD[2] + 0.4, `${e.manoD[2]} vs ${g.manoD[2]}`);
  const s = crearHombre({ id: 's', arma: 'espada_gala' }); s.der.estado = 'golpea';
  s.der.t = T_GOLPE * 0.35; const arriba = poseDe(s, 0); s.der.t = T_GOLPE; const abajo = poseDe(s, 0);
  assert.strictEqual(arriba.arma, 'tajo'); assert.ok(arriba.manoD[1] > abajo.manoD[1] + 0.6);
});

t('parada y golpe de umbo se ven', () => {
  const h = crearHombre({ id: 'h' }), g = poseDe(h, 0);
  h.izq.estado = 'para'; h.izq.t = 0.1; const p = poseDe(h, 0);
  h.izq.estado = 'empuja'; h.izq.t = 0.15; const u = poseDe(h, 0);
  assert.ok(p.manoI[1] > g.manoI[1] + 0.1); assert.ok(u.manoI[2] > g.manoI[2] + 0.25);
  assert.strictEqual(rotuloDe(h), 'golpe de umbo');
});

t('testudo agacha; la caída progresa de 0 a 1 tras «cae»', () => {
  const h = crearHombre({ id: 'h', guardia: 'testudo' }); assert.strictEqual(poseDe(h, 0).agacha, 1);
  const a = crearHombre({ id: 'a', bando: 'a', x: 0, z: 0, yaw: 0 }), b = crearHombre({ id: 'b', bando: 'b', x: 0, z: -1, yaw: Math.PI, escudo: 'ninguno' });
  const rnd = crearAzar(3); let k = 0;
  while (b.vivo && k++ < 3000) paso([a, b], 1 / 30, { rnd });
  assert.ok(!b.vivo); const c0 = poseDe(b, 0).cae;
  for (let i = 0; i < 15; i++) paso([a, b], 1 / 30, { rnd });
  const c1 = poseDe(b, 0).cae;
  for (let i = 0; i < 60; i++) paso([a, b], 1 / 30, { rnd });
  const c2 = poseDe(b, 0).cae;
  console.log(`   caída: ${c0.toFixed(2)} → ${c1.toFixed(2)} → ${c2.toFixed(2)} (T_CAIDA ${T_CAIDA} s)`);
  assert.ok(c0 < 0.1 && c1 > c0 && c1 < 1 && c2 === 1);
  assert.ok(['cae', 'caído'].includes(rotuloDe(b)));
});

console.log(`\n${n} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
