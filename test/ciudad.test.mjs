// AQVILA — pruebas de js/ciudad.js SIN pantalla (Node): node test/ciudad.test.mjs
// Porta las 17 comprobaciones de la maqueta (fundar, colocar, 5 años) y añade radio, mejoras, determinismo y guardado.
import * as R from '../js/ciudad.js';
import assert from 'node:assert';
const E = R.crear(+(process.argv[2] || 1)), fallos = [], ok = (c, t) => { if (!c) fallos.push(t); console.log((c ? 'bien  ' : 'MAL   ') + t); };
const loma = R.notaFundar(E, 160, 20), ribera = R.notaFundar(E, 200, -320), alto = R.notaFundar(E, 172, -196);
ok(loma.razones.some(t => /loma/.test(t)), 'en la loma se defiende mejor: ' + loma.razones.join(' · '));
ok(ribera.razones.some(t => /inunda/.test(t)), 'la ribera baja se inunda: ' + ribera.razones.join(' · '));
ok(!R.notaFundar(E, 100, -450).vale, 'en el agua no se funda');
ok(R.fundar(E, 172, -196), 'se funda en ' + alto.razones.join(' · '));
let e = R.estado(E); ok(e.casas === 20 && e.vias === 3 && e.puertas >= 2, `al fundar: ${e.casas} chozas, ${e.vias - 1} calles del foro, ${e.puertas} puertas`);
const pon = id => { const s = R.mejorSitio(E, id); const r = s && R.colocar(E, id, s[0], s[1], true); return !!(r && r.ok); };
ok(!R.notaSitio(E, 'granja', E.foro.x + 60, E.foro.z).vale, 'la granja no vale dentro del surco'); ok(!R.notaSitio(E, 'muelle', E.foro.x, E.foro.z + 40).vale, 'el muelle solo vale en la orilla');
ok(pon('fuente') && pon('granero') && pon('granja'), 'fuente, granero y granja colocados'); const v0 = E.vias.length;
const sucesos = {}; for (let i = 1; i <= 60; i++) { for (const a of R.mes(E)) { const k = /Crecida/.test(a.t) ? 'crecida' : /Incendio/.test(a.t) ? 'incendio' : /apagó/.test(a.t) ? 'fuego apagado' : /hambre/.test(a.t) ? 'hambre' : /Nueva obra/.test(a.t) ? 'ficha' : ''; if (k) sucesos[k] = (sucesos[k] || 0) + 1; }
  if (i === 6) pon('templo'); if (i === 10) pon('mercado'); if (i === 14) { pon('taller'); pon('muelle'); pon('fuente'); } if (i === 16) R.levantarMuralla(E, true); if (i === 22) { pon('compitum'); pon('granja'); } if (i === 28) R.levantarMuralla(E, true); }
e = R.estado(E); console.log(JSON.stringify(e, null, 1)); console.log('sucesos en 5 años:', JSON.stringify(sucesos));
ok(e.casas > 80 && e.casas <= 200, e.casas + ' casas nacidas solas'); ok(e.callejones > 5, e.callejones + ' callejones salidos solos'); ok(e.niveles[2] + e.niveles[3] > 10, 'hay casas de nivel III y IV: ' + e.niveles.join('/'));
ok(e.empedradas > 0, e.empedradas + ' calles empedradas'); ok(e.muralla.fase === 2, 'muralla de piedra'); ok(e.barrios.length === 2, 'dos barrios'); ok(e.abiertas.length === 9, 'las 9 fichas abiertas'); ok(sucesos.crecida >= 4, 'crecidas de primavera');

/* ---------- nuevas ---------- */
const prueba = (t, f) => { try { f(); ok(true, t); } catch (x) { ok(false, t + ' → ' + x.message); } };
prueba('cada ficha tiene su radio', () => { for (const [k, D] of Object.entries(R.EDIF)) assert.ok(typeof D.radio === 'number' && D.radio >= 0, k); });
prueba('radio de efecto: el templo en alto llega más lejos que en llano', () => {
  const E2 = R.crear(1); R.fundar(E2, 172, -196); const h0 = R.alcance(E2, 'templo', E2.foro.x, E2.foro.z);
  let alto = null, llano = null; for (let x = -300; x <= 400; x += 20) for (let z = -400; z <= 300; z += 20) { const r = R.alcance(E2, 'templo', x, z); if (!alto || r > alto[2]) alto = [x, z, r]; if (!llano || r < llano[2]) llano = [x, z, r]; }
  assert.equal(h0, 100); assert.ok(alto[2] > llano[2], alto[2] + ' vs ' + llano[2]); assert.ok(alto[2] <= 230 && llano[2] >= 100);
  assert.equal(R.alcance(E2, 'fuente', 0, 0), 85); assert.equal(R.alcance(E2, 'granero', 0, 0), 0); });
prueba('casasEnRadio cuenta las casas servidas', () => { const E2 = R.crear(1); R.fundar(E2, 172, -196); const c = R.casasEnRadio(E2, 'fuente', E2.foro.x, E2.foro.z);
  assert.ok(c >= 8 && c <= 20, c); assert.ok(R.casasEnRadio(E2, 'fuente', E2.foro.x, E2.foro.z, 3) >= c); assert.equal(R.casasEnRadio(E2, 'granja', E2.foro.x, E2.foro.z), 0); });
prueba('mejora I, II, III sube el radio y cobra', () => { const E2 = R.crear(1); R.fundar(E2, 172, -196); const s = R.mejorSitio(E2, 'fuente'), r = R.colocar(E2, 'fuente', s[0], s[1], true); assert.ok(r.ok);
  assert.ok(!R.mejorar(E2, r.e.id).ok || E2.monedas >= 0); for (let i = 0; i < 4; i++) R.mes(E2); E2.monedas = 1000; const r0 = r.e.radio, m0 = E2.monedas;
  assert.ok(R.mejorar(E2, r.e.id).ok); assert.equal(r.e.mejora, 1); assert.ok(r.e.radio > r0); assert.ok(E2.monedas < m0);
  assert.ok(R.mejorar(E2, r.e.id).ok && R.mejorar(E2, r.e.id).ok); assert.equal(r.e.mejora, 3); assert.equal(r.e.radio, 85 * 1.5);
  assert.ok(!R.mejorar(E2, r.e.id).ok, 'no hay IV'); assert.equal(R.EDIF.fuente.mejoras.length, 3); assert.ok(R.EDIF.templo.mejoras[2].rinde > R.EDIF.templo.mejoras[0].rinde); });
const juega = sem => { const F = R.crear(sem); R.fundar(F, 172, -196); for (let i = 1; i <= 24; i++) { R.mes(F); if (i === 1) for (const t of ['fuente', 'granero', 'granja']) { const s = R.mejorSitio(F, t); R.colocar(F, t, s[0], s[1], true); } if (i === 6) { const s = R.mejorSitio(F, 'templo'); R.colocar(F, 'templo', s[0], s[1], true); } if (i === 8) R.mejorar(F, F.edificios[0].id, true); if (i === 9) R.levantarMuralla(F, true); } return F; };
const clave = F => { const e = R.estado(F); return JSON.stringify([e.poblacion, e.casas, e.niveles, e.edificios, e.vias, e.monedas]); };
const A = juega(3);
prueba('determinismo: misma semilla, mismo estado', () => { assert.equal(clave(juega(3)), clave(A)); });
prueba('ida y vuelta de datos: misma población y mismas casas', () => { const D = JSON.parse(JSON.stringify(R.aDatos(A))), B = R.deDatos(D);
  assert.equal(R.poblacion(B), R.poblacion(A)); assert.equal(R.casas(B).length, R.casas(A).length); assert.equal(clave(B), clave(A));
  assert.deepEqual(R.casas(B).map(l => [l.x, l.z, l.casa.nivel]), R.casas(A).map(l => [l.x, l.z, l.casa.nivel])); assert.deepEqual(R.aDatos(B), R.aDatos(A)); assert.equal(D.piezas.length, 4); assert.equal(D.piezas[0].mejora, 1); assert.equal(D.muralla.length, 1); });
prueba('60 meses tardan menos de 8 s', () => { const t = Date.now(); const F = R.crear(5); R.fundar(F, 172, -196); for (let i = 0; i < 60; i++) R.mes(F); const ms = Date.now() - t; console.log('      (' + ms + ' ms)'); assert.ok(ms < 8000, ms + ' ms'); });
process.exit(fallos.length ? 1 : 0);
