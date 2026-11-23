/* AQVILA — LP1: el bloque y el frente dibujado, sin pantalla. node test/bloque.test.mjs (unos segundos)
   Comprobaciones de gobierno/estudios/LP0-como-se-pelea-a-pie.md §6: 1 (se mueve en bloque) y 2 (el enemigo no te sigue). */
import assert from 'node:assert';
import * as L from '../js/bloque.js';
const { crearBloque, dibujaFrente, paso, formado, crearCampo, manda, pasoCampo, botFrente, rayaPuerta, puesto, local, cierraFilas, LLEGA } = L;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const DT = 1 / 30, G = Math.PI / 180;
const dLinea = (p, a, b) => { const ux = b.x - a.x, uz = b.z - a.z, L2 = Math.hypot(ux, uz); return Math.abs((p.x - a.x) * uz - (p.z - a.z) * ux) / L2; };
const foto = Bs => Bs.map(B => B.hombres.map(h => [h.x, h.z]));
/* corre un bloque hasta formar; mide tiempo, desvío máximo y el salto más largo de un hombre en un paso */
function hastaFormar(B, tope = 60) {
  let T = 0, desv = 0, salto = 0, prev = foto([B])[0];
  while (!formado(B) && T < tope) {
    paso(B, DT); T += DT; desv = Math.max(desv, B.desvioMax);
    const ahora = foto([B])[0]; ahora.forEach((p, i) => { salto = Math.max(salto, Math.hypot(p[0] - prev[i][0], p[1] - prev[i][1])); }); prev = ahora;
  }
  return { T, desv, salto };
}

t('contrato: el bloque nace formado, con su frente de dos puntas', () => {
  for (const tipo of Object.keys(L.TIPOS)) {
    const B = crearBloque({ tipo, x: 3, z: -2, rumbo: 0.4 }), k = L.TIPOS[tipo];
    assert.strictEqual(B.hombres.length, k.hombres); assert.strictEqual(B.cols, k.cols); assert.strictEqual(B.filas, Math.ceil(k.hombres / k.cols));
    assert.ok(Math.abs(B.ancho - (k.cols - 1) * k.dx) < 1e-9 && Math.abs(B.fondo - (B.filas - 1) * k.dz) < 1e-9);
    assert.ok(Math.abs(Math.hypot(B.frente.p1.x - B.frente.p0.x, B.frente.p1.z - B.frente.p0.z) - B.ancho) < 1e-9);
    assert.ok(local(B, B.frente.p1.x, B.frente.p1.z).lado > 0, 'p1 es la punta derecha');
    for (const h of B.hombres) { const p = puesto(B, h.col, h.fila), l = local(B, p.x, p.z);
      assert.ok(Math.hypot(p.x - h.x, p.z - h.z) < 1e-9); assert.ok(Math.abs(l.delante + h.fila * B.dz) < 1e-9); }
    for (const c of ['id', 'bando', 'tipo', 'x', 'z', 'rumbo', 'cols', 'filas', 'dx', 'dz', 'ancho', 'fondo', 'frente', 'meta', 'fase', 'bisagra', 'coh', 'hombres', 'mods', 'orden', 'T'])
      assert.ok(c in B, 'falta B.' + c);
    assert.ok(formado(B)); assert.strictEqual(B.fase, 'quieto'); assert.strictEqual(B.coh, 100);
  }
});

t('§6.1 frente nuevo a 60°: todos llegan, ninguno a más de 1,5 m de su hueco, tarda 6–12 s (tres tipos, dos lados)', () => {
  for (const tipo of Object.keys(L.TIPOS)) for (const g of [60, -60]) {
    const B = crearBloque({ tipo }), r = rayaPuerta(B, g * G, 2), m = dibujaFrente(B, r.p0, r.p1), R = hastaFormar(B);
    console.log(`   ${tipo} ${g}°: ${R.T.toFixed(1)} s, desvío máx ${R.desv.toFixed(2)} m, salto máx ${R.salto.toFixed(3)} m`);
    assert.ok(formado(B), 'no formó'); assert.ok(R.desv <= 1.5, 'desvío ' + R.desv); assert.ok(R.T >= 6 && R.T <= 12, 'tarda ' + R.T);
    assert.ok(Math.abs(B.rumbo - m.rumbo) < 1e-6 && Math.abs(B.rumbo - g * G) < 1e-6, 'rumbo ' + B.rumbo / G);
    for (const h of B.hombres) assert.ok(h.desvio <= LLEGA);
    for (const h of B.hombres.filter(h => h.fila === 0)) assert.ok(dLinea(h, r.p0, r.p1) < 0.3, 'la primera fila queda sobre la raya');
  }
});

t('§6.1 gira como una puerta: la punta de dentro casi no se mueve, la de fuera anda más', () => {
  for (const g of [60, -60]) {
    const B = crearBloque({}), dentro = B.hombres.find(h => h.fila === 0 && h.col === (g > 0 ? B.cols - 1 : 0)),
      fuera = B.hombres.find(h => h.fila === 0 && h.col === (g > 0 ? 0 : B.cols - 1));
    const r = rayaPuerta(B, g * G, 0); dibujaFrente(B, r.p0, r.p1);
    assert.strictEqual(B.fase, 'gira'); assert.ok(Math.hypot(B.bisagra.x - dentro.x, B.bisagra.z - dentro.z) < 1e-6, 'bisagra en la punta de dentro');
    let andaD = 0, andaF = 0, pd = { ...dentro }, pf = { ...fuera };
    while (!formado(B)) { paso(B, DT); andaD += Math.hypot(dentro.x - pd.x, dentro.z - pd.z); andaF += Math.hypot(fuera.x - pf.x, fuera.z - pf.z); pd = { ...dentro }; pf = { ...fuera }; }
    console.log(`   ${g}°: dentro anda ${andaD.toFixed(2)} m, fuera ${andaF.toFixed(2)} m`);
    assert.ok(andaD < 0.5 && andaF > 9, `${andaD} / ${andaF}`);
  }
});

t('§6.1 pesa: girar sobre el centro tampoco baja de 6 s para 60°', () => {
  const B = crearBloque({}), a = 60 * G, w = B.ancho / 2, D = { x: Math.cos(a), z: Math.sin(a) };
  dibujaFrente(B, { x: -w * D.x, z: -w * D.z }, { x: w * D.x, z: w * D.z }); const R = hastaFormar(B);
  console.log(`   sobre el centro: ${R.T.toFixed(1)} s`); assert.ok(R.T >= 6 && R.T <= 12 && R.desv <= 1.5);
});

t('§6.2 el enemigo no te sigue: girar 90° no mueve a ningún enemigo (quieto y con una IA que avanza)', () => {
  const avanza = (C) => { const R = C.rivales[0]; if (!R.meta && R.T < 0.1) { const { p0, p1 } = R.frente;
    const F = { x: Math.sin(R.rumbo), z: -Math.cos(R.rumbo) }; dibujaFrente(R, { x: p0.x + 25 * F.x, z: p0.z + 25 * F.z }, { x: p1.x + 25 * F.x, z: p1.z + 25 * F.z }); } };
  for (const ia of [null, avanza]) {
    const A = crearCampo({ ia }), B = crearCampo({ ia });
    const r = rayaPuerta(A.yo, 90 * G, 3); manda(A, r.p0, r.p1, { amigas: true });
    let difMax = 0, salto = 0, prev = foto(A.rivales), giro = 0;
    for (let k = 0; k < 600; k++) {
      pasoCampo(A, DT); pasoCampo(B, DT);
      const fa = foto(A.rivales), fb = foto(B.rivales);
      fa.forEach((L2, j) => L2.forEach((p, i) => { difMax = Math.max(difMax, Math.hypot(p[0] - fb[j][i][0], p[1] - fb[j][i][1]));
        salto = Math.max(salto, Math.hypot(p[0] - prev[j][i][0], p[1] - prev[j][i][1])); }));
      prev = fa; giro = Math.max(giro, Math.abs(A.yo.rumbo));
    }
    console.log(`   ia ${ia ? 'avanza' : 'quieta'}: tu giro ${(giro / G).toFixed(0)}°, el enemigo se aparta ${difMax} m, salto máx ${salto.toFixed(3)} m`);
    assert.ok(Math.abs(giro / G - 90) < 1e-6, 'giró ' + giro / G); assert.strictEqual(difMax, 0); assert.ok(salto <= 0.5);
    if (ia) assert.ok(A.rivales[0].z > -45, 'la IA de prueba sí lo movió');
  }
});

t('bot «bien»: frentes limpios durante 2 min, siempre en bloque y con cohesión', () => {
  const C = crearCampo({}); let ordenes = 0, desv = 0, cohMin = 100;
  for (let k = 0; k < 3600; k++) { if (botFrente(C, 'bien')) ordenes++; pasoCampo(C, DT); desv = Math.max(desv, C.yo.desvioMax); cohMin = Math.min(cohMin, C.yo.coh); }
  console.log(`   ${ordenes} frentes, desvío máx ${desv.toFixed(2)} m, cohesión mínima ${cohMin.toFixed(0)}`);
  assert.ok(ordenes >= 9 && desv <= 1.5 && cohMin >= 70);
});

t('bot «mal»: rayas al revés, cortas, fuera, nulas, basura y media vuelta; nada se rompe y luego forma', () => {
  const av = []; const C = crearCampo({ semilla: 7, avisa: (tipo) => av.push(tipo) }); const riv0 = foto(C.rivales);
  let salto = 0, prev = foto([C.yo])[0], cohMin = 100;
  for (let k = 0; k < 3600; k++) {
    botFrente(C, 'mal'); pasoCampo(C, DT); cohMin = Math.min(cohMin, C.yo.coh);
    const f = foto([C.yo])[0]; f.forEach((p, i) => { assert.ok(Number.isFinite(p[0]) && Number.isFinite(p[1]), 'NaN');
      assert.ok(Math.abs(p[0]) <= 120 + 40 && Math.abs(p[1]) <= 120 + 40, 'se salió del campo'); salto = Math.max(salto, Math.hypot(p[0] - prev[i][0], p[1] - prev[i][1])); });
    prev = f;
  }
  let T = 0; while (!formado(C.yo) && T < 60) { pasoCampo(C, DT); T += DT; }
  const T2 = T; while (C.yo.coh < 70 && T < 90) { pasoCampo(C, DT); T += DT; }
  console.log(`   salto máx ${salto.toFixed(3)} m, cohesión mínima ${cohMin.toFixed(0)}, forma en ${T2.toFixed(1)} s, cohesión ${C.yo.coh.toFixed(0)}`);
  assert.ok(salto <= 0.5 && formado(C.yo) && C.yo.coh >= 70);
  for (const a of ['corta', 'recortado', 'gira', 'frente']) assert.ok(av.includes(a), 'falta el aviso ' + a);
  assert.deepStrictEqual(foto(C.rivales), riv0, 'el enemigo no se movió');
});

t('bot «nada»: nadie se mueve, cohesión 100', () => {
  const C = crearCampo({}), f0 = foto(C.todos);
  for (let k = 0; k < 900; k++) { assert.strictEqual(botFrente(C, 'nada'), null); pasoCampo(C, DT); }
  assert.deepStrictEqual(foto(C.todos), f0); assert.strictEqual(C.yo.coh, 100);
});

t('raya corta no cambia el ancho; dibujada al revés no da media vuelta; «dibujo» sí la da', () => {
  const av = [], B = crearBloque({ avisa: t => av.push(t) });
  dibujaFrente(B, { x: -1, z: -5 }, { x: 1, z: -5 }); assert.strictEqual(B.cols, 12); assert.ok(av.includes('corta')); hastaFormar(B);
  assert.ok(Math.abs(B.z + 5) < 1e-6 && Math.abs(B.rumbo) < 1e-9);
  dibujaFrente(B, B.frente.p1, B.frente.p0); assert.ok(Math.abs(B.meta.rumbo - B.rumbo) < 1e-9, 'al revés: sigue mirando igual');
  dibujaFrente(B, B.frente.p1, B.frente.p0, { sentido: 'dibujo' }); assert.ok(Math.abs(Math.abs(B.meta.rumbo - B.rumbo) - Math.PI) < 1e-9);
  const R = hastaFormar(B); assert.ok(formado(B) && R.desv <= 1.5, 'media vuelta ' + R.T);
  assert.strictEqual(dibujaFrente(B, { x: NaN, z: 0 }, { x: 0, z: 0 }), null);
});

t('raya larga ensancha el frente y recoloca a los hombres', () => {
  const B = crearBloque({}); dibujaFrente(B, { x: -7.5, z: -3 }, { x: 7.5, z: -3 });
  assert.strictEqual(B.cols, 18); assert.strictEqual(B.filas, 7); hastaFormar(B); assert.ok(formado(B));
  const pos = new Set(B.hombres.map(h => h.col + ',' + h.fila)); assert.strictEqual(pos.size, 120, 'puestos repetidos');
});

t('cierraFilas: caen 20 de delante, los de atrás cubren sin saltos', () => {
  const B = crearBloque({}); B.hombres.filter(h => h.fila < 2).slice(0, 20).forEach(h => { h.vivo = false; });
  cierraFilas(B); assert.strictEqual(B.filas, 9); assert.strictEqual(B.hombres.filter(h => h.vivo && h.fila === 0).length, 12);
  const R = hastaFormar(B); assert.ok(formado(B) && R.salto <= 0.5);
});

t('misma semilla, misma partida; dt grande da lo mismo que dt pequeño', () => {
  const corre = (s, dt) => { const C = crearCampo({ semilla: s }); for (let T = 0; T < 60; T += dt) { botFrente(C, 'mal'); pasoCampo(C, dt); } return L.resumen(C.yo); };
  assert.deepStrictEqual(corre(3, DT), corre(3, DT));
  const B1 = crearBloque({}), B2 = crearBloque({}), r = rayaPuerta(B1, 45 * G, 4);
  dibujaFrente(B1, r.p0, r.p1); dibujaFrente(B2, r.p0, r.p1);
  for (let k = 0; k < 600; k++) paso(B1, DT); for (let k = 0; k < 40; k++) paso(B2, 0.5);
  assert.ok(Math.hypot(B1.x - B2.x, B1.z - B2.z) < 1e-6 && Math.abs(B1.rumbo - B2.rumbo) < 1e-9);
});

t('mods: LP2 frena el bloque (testudo) y lo tarda más', () => {
  const B = crearBloque({}); B.mods.vel = 0.5; B.mods.giro = 0.5; const r = rayaPuerta(B, 60 * G, 2); dibujaFrente(B, r.p0, r.p1);
  const R = hastaFormar(B); assert.ok(R.T > 12 && formado(B), 'tarda ' + R.T);
});

console.log(`\n${n} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
