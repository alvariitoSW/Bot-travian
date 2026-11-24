// AQVILA — pruebas de js/calles.js (CD2a) SIN pantalla: node test/calles.test.mjs
import * as R from '../js/ciudad.js';
import * as K from '../js/calles.js';
import assert from 'node:assert';
const fallos = [], prueba = (t, f) => { try { f(); console.log('bien  ' + t); } catch (x) { fallos.push(t); console.log('MAL   ' + t + ' → ' + x.message); } };
const nueva = () => { const E = R.crear(1); R.fundar(E, 172, -196); const s = R.mejorSitio(E, 'fuente'); R.colocar(E, 'fuente', s[0], s[1], true); return E; };
const E = nueva();
prueba('simplificar reduce puntos', () => { const t = []; for (let i = 0; i <= 40; i++) t.push([i * 3, Math.sin(i / 6) * 0.8]); const s = K.simplificar(t, 3); assert.ok(s.length < t.length / 4 && s.length >= 2, s.length); assert.deepEqual(s[0], t[0]); assert.deepEqual(s[s.length - 1], t[40]); });
prueba('un trazo sobre el río no vale y dice por qué', () => { const r = K.validar(E, [[E.foro.x - 40, -400], [E.foro.x + 40, -400]]); assert.ok(!r.ok && /agua|ciudad/.test(r.motivo), r.motivo); });
prueba('un trazo corto no vale', () => { const r = K.validar(E, [[E.foro.x + 50, E.foro.z + 50], [E.foro.x + 60, E.foro.z + 50]]); assert.ok(!r.ok && /corta/.test(r.motivo), r.motivo); });
prueba('un trazo muy largo no vale', () => { const r = K.validar(E, [[E.foro.x, E.foro.z], [E.foro.x + 300, E.foro.z]]); assert.ok(!r.ok && /larga/.test(r.motivo), r.motivo); });
prueba('sobre un edificio no vale', () => { const e = E.edificios[0]; const r = K.validar(E, [[e.x - 20, e.z], [e.x + 20, e.z]]); assert.ok(!r.ok, 'vale sobre ' + e.tipo); });
prueba('formas: las tres existen y la recta tiene dos puntos', () => { const f = K.formas(E, [[0, 0], [20, 10], [40, 5], [60, 30], [80, 40]]); assert.equal(f.recta.length, 2); assert.ok(f.tal.length >= 2 && f.cuadricula.length >= 2);
  const th = K.anguloEje(E), a = f.cuadricula[0], b = f.cuadricula[1]; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), d = ((ang - th) % (Math.PI / 2) + Math.PI) % (Math.PI / 2); assert.ok(Math.min(d, Math.PI / 2 - d) < 0.02 || f.cuadricula.length === 2, 'primer tramo alineado'); });
/* una calle válida: la propone el arquitecto, que ya prueba que vale; para el test se busca una recta libre cerca del foro */
const libre = (E0) => { for (let r = 70; r < 260; r += 15) for (let t = 0; t < 6.28; t += 0.2) { const x = E0.foro.x + Math.cos(t) * r, z = E0.foro.z + Math.sin(t) * r, pts = [[x, z], [x + Math.cos(t + 1.57) * 80, z + Math.sin(t + 1.57) * 80]]; if (K.validar(E0, pts).ok) return pts; } return null; };
const pts = libre(E);
prueba('hay un trazo válido de prueba', () => assert.ok(pts, 'ninguno'));
let E1;
prueba('trazarCalle: ok, sube vías, nacen parcelas alineadas, diario con k', () => {
  E1 = nueva(); const v0 = E1.vias.length, p0 = E1.parcelas.length, m0 = E1.monedas, r = R.trazarCalle(E1, pts, false);
  assert.ok(r.ok, r.motivo); assert.equal(E1.vias.length, v0 + 1); assert.ok(r.via.trazada); assert.ok(E1.monedas < m0, 'cobra');
  const nuevas = E1.parcelas.filter(l => l.via === r.via.id); assert.ok(nuevas.length >= 2, 'parcelas nuevas: ' + nuevas.length); assert.ok(E1.parcelas.length > p0);
  const tr = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]); for (const l of nuevas) { const d = Math.abs(Math.atan2(Math.sin(l.ang - tr), Math.cos(l.ang - tr))); assert.ok(d < 0.2 || Math.abs(d - Math.PI) < 0.2, 'ángulo ' + d); }
  assert.ok(E1.diario.some(d => d.a === 'k' && d.p.length === 2)); });
prueba('guardar y cargar rehace la misma calle y las mismas parcelas', () => { const D = JSON.parse(JSON.stringify(R.aDatos(E1))), E2 = R.deDatos(D);
  assert.equal(E2.vias.length, E1.vias.length); assert.equal(E2.parcelas.length, E1.parcelas.length); assert.ok(E2.vias.some(v => v.trazada)); });
prueba('datos sin k cargan igual', () => { const D = JSON.parse(JSON.stringify(R.aDatos(E))); assert.ok(!D.acciones.some(a => a.a === 'k')); const E2 = R.deDatos(D); assert.equal(E2.parcelas.length, E.parcelas.length); });
prueba('sin dinero falla con «Faltan»', () => { const F = nueva(); F.monedas = 1; const v0 = F.vias.length, r = R.trazarCalle(F, pts, false); assert.ok(!r.ok && /^Faltan/.test(r.motivo), r.motivo); assert.equal(F.vias.length, v0); assert.ok(!F.diario.some(d => d.a === 'k')); });
prueba('gratis no cobra', () => { const F = nueva(); F.monedas = 1; assert.ok(R.trazarCalle(F, pts, true).ok); assert.equal(F.monedas, 1); });
prueba('un trazo inválido no hace nada', () => { const F = nueva(), n = F.vias.length, r = R.trazarCalle(F, [[0, 0], [5, 0]], true); assert.ok(!r.ok); assert.equal(F.vias.length, n); });
prueba('proponer: devuelve una calle válida y es determinista', () => { const a = K.proponer(E), b = K.proponer(E); assert.ok(a, 'sin propuesta'); assert.ok(K.validar(E, a.pts).ok, 'no vale'); assert.deepEqual(a, b); assert.ok(/\w+ .*\.$/.test(a.porque) && a.porque.length < 140, a.porque); console.log('      ' + a.porque); });
prueba('proponer no traza sola', () => { const F = nueva(), n = F.vias.length; K.proponer(F); assert.equal(F.vias.length, n); });
prueba('aceptar la propuesta funciona', () => { const F = nueva(), p = K.proponer(F), r = R.trazarCalle(F, p.pts, false); assert.ok(r.ok, r.motivo); });
if (fallos.length) { console.log('\n' + fallos.length + ' fallos'); process.exit(1); } else console.log('\ntodo bien');
