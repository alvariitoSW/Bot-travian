// AQVILA — pruebas de js/ciudad.js SIN pantalla (Node): node test/ciudad.test.mjs
// Porta las 17 comprobaciones de la maqueta (fundar, colocar, 5 años) y añade radio, mejoras, determinismo y guardado.
import * as R from '../js/ciudad.js';
import assert from 'node:assert';
import { createRequire } from 'node:module';
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
ok(e.empedradas > 0, e.empedradas + ' calles empedradas'); ok(e.muralla.fase === 2, 'muralla de piedra'); ok(e.barrios.length === 2, 'dos barrios'); ok(['fuente', 'granero', 'granja', 'templo', 'mercado', 'taller', 'muelle', 'muralla', 'compitum'].every(t => e.abiertas.includes(t)), 'las 9 fichas de siempre abiertas'); ok(sucesos.crecida >= 4, 'crecidas de primavera');

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

/* ---------- CN2a: catálogo único, costes en 5 recursos, mejoras, siembra y fundación automática ---------- */
const RES = ['madera', 'piedra', 'hierro', 'grano', 'oro'], suma = c => RES.reduce((t, r) => t + c[r], 0);
prueba('cada pieza tiene coste de 5 claves y 3 mejoras crecientes', () => { assert.equal(Object.keys(R.EDIF).length, 17); assert.deepEqual([...R.ORDEN].sort(), Object.keys(R.EDIF).sort());
  for (const [k, D] of Object.entries(R.EDIF)) { assert.deepEqual(Object.keys(D.coste), RES, k); assert.equal(D.mejoras.length, 3, k); let ant = suma(D.coste); assert.ok(ant > 0, k);
    for (const m of D.mejoras) { assert.deepEqual(Object.keys(m.coste), RES, k); assert.ok(suma(m.coste) > ant, k + ' mejora creciente'); ant = suma(m.coste); } } });
prueba('PIEZA_DE es biyectiva con los bid; niveles de mejora', () => { const bids = Object.values(R.EDIF).map(D => D.bid).filter(Boolean); assert.equal(bids.length, 13); assert.equal(Object.keys(R.PIEZA_DE).length, 13);
  for (const [k, D] of Object.entries(R.EDIF)) if (D.bid) assert.equal(R.PIEZA_DE[D.bid], k); else assert.ok(['fuente', 'granero', 'taller', 'compitum'].includes(k));
  assert.equal(R.PIEZA_DE.puerto, 'muelle'); assert.deepEqual(R.NIVEL_MEJORA, [1, 3, 6, 10]);
  assert.deepEqual([0, 1, 2, 3, 4, 6, 7, 10].map(R.MEJORA_DE_NIVEL), [-1, 0, 1, 1, 2, 2, 3, 3]); });
prueba('el coste de mejora I de la granja = niveles 1 y 2 de D.BUILD (40,40,20,10 x1.5 y x2.25)', () => { const c = R.EDIF.granja.mejoras[0].coste; assert.deepEqual(c, { madera: 150, piedra: 150, hierro: 75, grano: 40, oro: 0 }); assert.deepEqual(R.EDIF.granja.coste, { madera: 40, piedra: 40, hierro: 20, grano: 10, oro: 0 }); });
prueba('las 7 piezas nuevas se colocan con mejorSitio tras fundar', () => { const F = R.crear(1); R.fundar(F, 172, -196);
  for (const id of ['aserradero', 'cantera', 'mina', 'cuartel', 'establo', 'herreria', 'almacen']) { const s = R.mejorSitio(F, id); assert.ok(s, id + ' sin sitio'); const n = R.notaSitio(F, id, s[0], s[1]); assert.ok(n.vale && n.razones.length, id); const r = R.colocar(F, id, s[0], s[1], true); assert.ok(r.ok, id + ': ' + r.motivo); }
  assert.equal(F.edificios.length, 7); });
prueba('reglas de sitio: razones claras fuera de su sitio', () => { const F = R.crear(1); R.fundar(F, 172, -196);
  assert.match(R.notaSitio(F, 'almacen', F.foro.x + 300, F.foro.z).razones[0], /surco|territorio|agua|empinado/); assert.match(R.notaSitio(F, 'cantera', F.foro.x + 160, F.foro.z + 120).razones[0] || '', /./);
  assert.ok(!R.notaSitio(F, 'cuartel', F.foro.x, F.foro.z + 5).vale); assert.ok(!R.notaSitio(F, 'cantera', 200, -330).vale, 'sin roca en el llano'); });
prueba('pago y monedero: pago decide; sin pago se usa E.monedas; modoJuego no suma renta', () => { const F = R.crear(1); R.fundar(F, 172, -196); const s = R.mejorSitio(F, 'aserradero'); let visto = null;
  assert.ok(!R.colocar(F, 'aserradero', s[0], s[1], false, c => { visto = c; return false; }).ok); assert.deepEqual(visto, R.EDIF.aserradero.coste); assert.equal(F.edificios.length, 0);
  const m0 = F.monedas; assert.ok(R.colocar(F, 'aserradero', s[0], s[1], false, () => true).ok); assert.equal(F.monedas, m0);
  const s2 = R.mejorSitio(F, 'cantera'); F.monedas = 1000; assert.ok(R.colocar(F, 'cantera', s2[0], s2[1]).ok); assert.equal(F.monedas, 1000 - suma(R.EDIF.cantera.coste));
  assert.equal(F.modoJuego, false); for (let i = 0; i < 3; i++) R.mes(F); const m1 = F.monedas; F.modoJuego = true; R.mes(F); assert.equal(F.monedas, m1);
  assert.ok(!('modoJuego' in R.aDatos(F))); });
prueba('sembrarCasas(E, 287) deja población entre 287 y 330; y más si se pide más', () => { const F = R.crear(1); R.fundar(F, 172, -196); const p = R.sembrarCasas(F, 287); assert.ok(p >= 287 && p <= 330, p); assert.equal(p, R.poblacion(F));
  const G2 = R.crear(2); R.fundar(G2, 172, -196); const q = R.sembrarCasas(G2, 600); console.log('      (sembrar 600 -> ' + q + ')'); assert.ok(q >= 600 || R.estado(G2).parcelasLibres === 0); assert.ok(R.casas(G2).length > 20); });
prueba('fundarAuto: dos semillas, dos sitios; rápido', () => { const t = Date.now(), sitios = []; for (const sem of [1, 2, 3, 4]) { const F = R.crear(1), r = R.fundarAuto(F, sem); assert.ok(r && F.fundada && R.poblacion(F) >= 250, 'sem ' + sem); sitios.push(r.join(',')); }
  console.log('      (' + sitios.join(' | ') + ' en ' + (Date.now() - t) + ' ms)'); assert.ok(new Set(sitios).size >= 3, sitios.join(' ')); assert.deepEqual((() => { const F = R.crear(1); return R.fundarAuto(F, 2); })(), sitios[1].split(',').map(Number), 'determinista'); assert.ok(Date.now() - t < 12000); });
prueba('ida y vuelta con piezas nuevas y siembra: misma población y casas; JSON pequeño', () => { const F = R.crear(4); R.fundarAuto(F, 9); R.sembrarCasas(F, 400); let n = 0;
  for (const id of ['aserradero', 'cantera', 'mina', 'cuartel', 'establo', 'herreria', 'almacen', 'fuente', 'granero', 'granja', 'templo']) { const s = R.mejorSitio(F, id); if (s && R.colocar(F, id, s[0], s[1], true).ok) n++; }
  for (let i = 0; i < 6; i++) R.mes(F); R.mejorar(F, F.edificios[0].id, true); R.sembrarCasas(F, 500); for (let i = 0; i < 4; i++) R.mes(F);
  const J = JSON.stringify(R.aDatos(F)), B = R.deDatos(JSON.parse(J)); console.log('      (' + n + ' piezas, JSON ' + J.length + ' bytes)');
  assert.ok(n >= 8); assert.equal(R.poblacion(B), R.poblacion(F)); assert.equal(R.casas(B).length, R.casas(F).length); assert.deepEqual(R.aDatos(B), R.aDatos(F)); assert.deepEqual(B.edificios.map(e => e.tipo), F.edificios.map(e => e.tipo));
  assert.ok(J.length < 8000, J.length); assert.ok(R.aDatos(F).piezas.every(p => !ArrayBuffer.isView(p.x))); });
prueba('CN5: una colonia se funda desde el juego, guarda y recarga la misma ciudad', () => {
  const rq = createRequire(import.meta.url), D = rq('../js/data.js'), G = rq('../js/game.js'); G.usarCiudad(R);
  const store = {}; globalThis.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  try {
    const s = G.newGame('CN5'); assert.ok(!D.CITIES.cosa, 'el sitio no es ciudad'); s.res.grano = 900; s.res.oro = 900; s.cities.roma.pop = 500;
    assert.ok(G.enviarColonos('roma', 'cosa').ok); let n = 0; while (G.state.colonias.cosa.estado === 'camino' && n++ < 60) G.tick(1);
    assert.equal(G.state.colonias.cosa.estado, 'pendiente'); assert.equal(G.fundarColonia('cosa', 100, -450).ok, false);
    assert.ok(G.fundarColonia('cosa', 172, -196).ok); const a = JSON.stringify(R.aDatos(G.ciudadE('cosa')));
    G.save(); assert.ok(G.load()); assert.equal(JSON.stringify(R.aDatos(G.ciudadE('cosa'))), a, 'misma ciudad tras cargar');
    assert.equal(R.estado(G.ciudadE('cosa')).casas, 20); G.newGame('x'); assert.ok(!D.CITIES.cosa);
  } finally { delete globalThis.localStorage; G.usarCiudad(null); } });
process.exit(fallos.length ? 1 : 0);
