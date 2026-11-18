// AQVILA — CN17: carácter de barrio, plazas en los cruces, encargos del Senado e hitos. node test/encargos.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const nueva = () => { const s = G.newGame('Test', 'mediterraneo', {}); G.onEvent = null; return s; };
function con(med, f) { const a = {}; for (const k in med) { a[k] = G.MEDIDAS[k]; G.MEDIDAS[k] = typeof med[k] === 'function' ? med[k] : () => med[k]; } try { f(); } finally { Object.assign(G.MEDIDAS, a); } }
const ceros = { casas: 0, barrios: 0, barrioNivel: 0, fuentes: 0, denarios: 0, encargos: 0 };

t('migración: partida sin encargos ni hitos los recibe', () => { const s = nueva(); delete s.encargos; delete s.hitos; G.migrarSenado(s); assert.ok(s.encargos && s.encargos.activo === null && s.hitos && typeof s.hitos === 'object'); });

t('se asigna un encargo, uno solo, y no se repite la casilla de las misiones', () => {
  const s = nueva(); s.encargos.activo = null; s.encargos.prox = 0;
  con(ceros, () => { G.encargosMes(0); const a = G.encargoActual(); assert.ok(a && a.e.id === 'techo-30', 'primero techo-30'); G.encargosMes(1); assert.strictEqual(G.encargoActual().e.id, 'techo-30', 'sigue el mismo'); });
  assert.ok(s.mision === null || s.mision.id !== 'techo-30');
});

t('cumplir un encargo da el premio, queda hecho y no vuelve', () => {
  const s = nueva(); s.encargos.activo = { id: 'techo-30', t0: 0, t1: 12 }; const oro = s.res.denarios, fs = s.favor.senado;
  con(Object.assign({}, ceros, { casas: 30 }), () => G.encargosMes(1));
  assert.strictEqual(s.encargos.hechos['techo-30'], 'ok'); assert.strictEqual(s.res.denarios, oro + 120); assert.ok(s.favor.senado > fs);
  assert.ok(s.log.some(l => /Encargo cumplido/.test(l.x)), 'aviso en el diario');
  const sinEnc = Object.assign({}, ceros, { casas: 30 }); delete sinEnc.encargos;
  con(sinEnc, () => { G.encargosMes(5); assert.notStrictEqual((G.encargoActual() || { e: {} }).e.id, 'techo-30'); });
  assert.ok(s.hitos['casas-50'] === undefined && s.hitos['primer-encargo'] !== undefined, 'el primer encargo es hito');
});

t('pasado el plazo, el encargo se da por perdido y no castiga', () => {
  const s = nueva(); s.encargos.activo = { id: 'techo-30', t0: 0, t1: 5 }; const fs = s.favor.senado;
  con(ceros, () => G.encargosMes(6)); assert.strictEqual(s.encargos.hechos['techo-30'], 'fallo'); assert.strictEqual(s.favor.senado, fs);
});

t('los encargos mayores esperan al hito del barrio de nivel 3', () => {
  const s = nueva(); for (const id of Object.keys(D.ENCARGOS)) if (!D.ENCARGOS[id].req) s.encargos.hechos[id] = 'ok'; s.encargos.activo = null; s.encargos.prox = 0;
  con(ceros, () => { G.encargosMes(2); assert.strictEqual(G.encargoActual(), null, 'sin hito no se asignan'); });
  con(Object.assign({}, ceros, { barrioNivel: 3 }), () => { G.encargosMes(3); assert.ok(s.hitos['barrio-3'] !== undefined, 'hito logrado'); });
  con(Object.assign({}, ceros, { barrioNivel: 3 }), () => { s.encargos.prox = 0; G.encargosMes(6); assert.ok(G.encargoActual(), 'ya hay encargo mayor'); });
});

t('hito: se cobra una sola vez y queda guardado', () => {
  const s = nueva(), fp = s.favor.pueblo;
  con(Object.assign({}, ceros, { casas: 60 }), () => { G.encargosMes(1); G.encargosMes(2); });
  assert.strictEqual(s.hitos['casas-50'], 1); assert.ok(s.favor.pueblo > fp && s.favor.pueblo <= fp + 4.01, 'favor del pueblo una sola vez');
  assert.strictEqual(JSON.parse(JSON.stringify(s)).hitos['casas-50'], 1);
});

t('barrios: carácter derivado y plazas en cruces', () => {
  const s = nueva(), c = s.cities.roma, bi = G.barrioInfo(c); if (!bi.barrios.length) return;
  const E = G.ciudadDe ? G.ciudadDe(c) : null; const CI = require('../js/ciudad.js');
  for (const b of bi.barrios) assert.ok(['foro', 'ribera', 'loma', 'llano'].includes(b.caracter), 'carácter ' + b.caracter);
  assert.ok(CI.FRASE_CARACTER.foro && /·/.test(bi.barrios[0].texto), 'el panel lleva la frase');
});

t('plazasCruce: sin foro y solo donde una vía toca a otra', () => {
  const CI = require('../js/ciudad.js'), E = CI.crear(1); E.foro = { x: 0, z: 0, ang: 0, w: 46, d: 34 }; E.RS = [100, 100, 100, 100]; E.barrios.push({ nombre: 'Barrio del Foro', corto: 'Foro', x: 0, z: 0, tipo: 'foro', nivel: 1, bdef: 0, caracter: 'foro' }, { nombre: 'Barrio de prueba', corto: 'p', x: 300, z: 0, tipo: 'compitum', nivel: 1, bdef: 0 });
  E.vias.push({ id: 1, t: 'calle', w: 2, p: [[200, 0], [300, 0], [400, 0]] }, { id: 2, t: 'calle', w: 2, p: [[300, 2], [300, 60]] });
  const L = CI.plazasCruce(E); assert.strictEqual(L.length, 1); assert.strictEqual(L[0].barrio, 1); assert.ok(['ribera', 'loma', 'llano'].includes(L[0].car));
  E.vias.pop(); assert.strictEqual(CI.plazasCruce(E).length, 0, 'sin cruce no hay plaza');
});
console.log(mal ? 'FALLAN ' + mal : 'OK ' + n);
process.exit(mal ? 1 : 0);
