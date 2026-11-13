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
prueba('CN6: el barrio sube de uno en uno, baja tras el retraso y se rehace igual', () => {
  assert.equal(R.RETRASO_BARRIO, 3); const F = R.crear(3); R.fundar(F, 172, -196);
  const pon2 = id => { const q = R.mejorSitio(F, id), r = q && R.colocar(F, id, q[0], q[1], true); assert.ok(r && r.ok, id); r.e.obra = 0; };
  assert.equal(F.barrios[0].nivel, 1); pon2('fuente'); pon2('templo'); pon2('mercado'); assert.equal(R.nivelBarrio(F, 0).nivel, 4);
  const niv = []; for (let i = 0; i < 4; i++) { R.mes(F); niv.push(F.barrios[0].nivel); } assert.deepEqual(niv.slice(0, 2), [2, 3], 'un nivel por mes: ' + niv);
  F.edificios = F.edificios.filter(e => e.tipo !== 'templo' && e.tipo !== 'mercado'); F.barrios[0].nivel = 4; F.barrios[0].bdef = 0; F.rev++; assert.ok(R.nivelBarrio(F, 0).nivel < 4);
  R.mes(F); R.mes(F); assert.equal(F.barrios[0].nivel, 4); assert.match(R.textoBarrio(F, 0), /nivel IV.*bajará en 1 mes/); assert.equal(R.mesesParaBajar(F, 0), 1);
  R.mes(F); assert.equal(F.barrios[0].nivel, 3, 'baja un nivel tras 3 meses: ' + JSON.stringify(F.barrios[0]) + R.nivelBarrio(F, 0).nivel); assert.equal(F.barrios[0].bdef, 0);
  const H = R.crear(3); R.fundar(H, 172, -196); for (const id of ['fuente', 'templo']) { const q = R.mejorSitio(H, id); assert.ok(R.colocar(H, id, q[0], q[1], true).ok); } for (let i = 0; i < 7; i++) R.mes(H);
  const B = R.deDatos(JSON.parse(JSON.stringify(R.aDatos(H)))); assert.deepEqual(B.barrios.map(b => [b.nivel, b.bdef]), H.barrios.map(b => [b.nivel, b.bdef]), 'rehecha da los mismos niveles'); assert.ok(H.barrios[0].nivel >= 2); });
prueba('CN7: tabla de muralla y saqueo del arrabal reproducible', () => {
  assert.deepEqual(R.NIVEL_FASE, [0, 3, 6]); assert.deepEqual([-1, 0, 1, 3, 4, 9].map(R.faseDeNivel), [0, 0, 1, 1, 2, 2]);
  const mk = fase => { const F = R.crear(3); R.fundar(F, 172, -196); R.sembrarCasas(F, 400); for (let i = 0; i < 6; i++) R.mes(F); for (const l of F.parcelas) if (l.arrabal && !l.fuera) l.casa = { nivel: 1, desde: 0, nace: 0, ruina: 0 }; F.muralla.fase = fase; return F; };
  const A = mk(0), B = mk(0); assert.equal(R.nivelMuralla(A), 0); A.muralla.fase = 1; assert.equal(R.nivelMuralla(A), 3); A.muralla.fase = 2; assert.equal(R.nivelMuralla(A), 6); A.muralla.nivel = 5; assert.equal(R.nivelMuralla(A), 5); A.muralla.fase = 0; delete A.muralla.nivel;
  const nA = R.casasArrabal(A); assert.ok(nA >= 6, 'hay arrabal: ' + nA); assert.ok(Array.isArray(A.muralla.geo.surco) && A.muralla.geo.surco.length > 8 && A.muralla.geo.puertas.length === A.puertas.length);
  const a = R.saquearArrabal(A, 1), b = R.saquearArrabal(B, 1); assert.deepEqual(a.ids, b.ids, 'misma semilla, mismos ids'); assert.ok(a.n >= 1 && a.n <= 12 && a.n <= Math.max(1, Math.round(nA * 0.6)));
  for (const id of a.ids) assert.equal(A.parcelas[id - 1].casa.ruina, 5); assert.equal(R.casasArrabal(A), nA - a.n);
  const C = mk(1), D2 = mk(2), E0 = mk(0), nn = R.casasArrabal(E0), s0 = R.saquearArrabal(E0, 1).n, s1 = R.saquearArrabal(C, 1).n, s2 = R.saquearArrabal(D2, 1).n;
  assert.ok(s2 <= s1 && s1 <= s0 && s2 < s0, 'piedra < empalizada <= sin muralla: ' + [s2, s1, s0]); assert.ok(R.saquearArrabal(mk(0), 0.3).n <= s0);
  const G2 = mk(0); for (const l of G2.parcelas) if (l.arrabal && l.casa) l.casa.ruina = 3; const r0 = R.saquearArrabal(G2, 1); assert.equal(r0.n, 0);
  const H = R.crear(1); R.fundar(H, 172, -196); R.sembrarCasas(H, 1500); assert.ok(R.casasArrabal(H) > 2); assert.ok(R.saquearArrabal(H, 1).n > 0); const H2 = R.deDatos(JSON.parse(JSON.stringify(R.aDatos(H)))); assert.equal(R.casasArrabal(H2), R.casasArrabal(H), 'el saqueo sobrevive a guardar y cargar');
  const O = mk(0); O.muralla.obra = 1; O.muralla.nivel = 2; R.mes(O); assert.equal(O.muralla.fase, 1); assert.equal(O.muralla.nivel, undefined); assert.equal(R.nivelMuralla(O), 3); assert.equal(O.muralla.geo.fase, 1); });
prueba('CN8: riesgos() anuncia lo que luego pasa (crecida en marzo, fuego, hambre en diciembre) y es pura', () => {
  const mk = () => { const F = R.crear(3); R.fundar(F, 172, -196); R.sembrarCasas(F, 400); for (const l of F.parcelas) if (!l.fuera && R.inundable(l.x, l.z) && !l.casa) l.casa = { nivel: 1, desde: 0, nace: 0, ruina: 0 }; return F; };
  const hasta = (F, m) => { let k = 0; while (R.fecha(F).mes !== m && k++ < 14) R.mes(F); };
  const F = mk(); hasta(F, 1); const sn = JSON.stringify(R.aDatos(F)), r = R.riesgos(F), r2 = R.riesgos(F); assert.equal(JSON.stringify(R.aDatos(F)), sn, 'pura'); assert.deepEqual(r, r2);
  const cr = r.find(x => x.c === 'crecida'); assert.ok(cr && cr.meses === 0 && cr.n >= 1 && cr.pieza === null, JSON.stringify(r)); assert.match(cr.remedio, /ribera baja/);
  const fu = r.find(x => x.c === 'fuego'); assert.ok(fu && fu.meses === 0 && fu.pieza === 'fuente' && /^Pon una fuente cerca del /.test(fu.remedio)); assert.ok(r[0].p >= r[r.length - 1].p);
  const pob0 = R.poblacion(F), av = R.mes(F); assert.equal(R.fecha(F).mes, 2, 'la crecida cae en marzo'); const a = av.find(x => x.c === 'crecida'); assert.ok(a && a.cg && a.cg[0] + a.cg[1] === cr.n, 'anunciada = ocurrida');
  assert.ok(R.poblacion(F) < pob0, 'la población baja con la crecida'); for (let i = 0; i < 4; i++) R.mes(F);
  R.mes(F); assert.ok(R.casas(F).filter(l => R.inundable(l.x, l.z)).every(l => !l.casa.ruina), 'a los 5 meses se recupera'); assert.ok(R.poblacion(F) >= pob0 - 40, 'población recuperada');
  const H = mk(); hasta(H, 9); const h = R.riesgos(H).find(x => x.c === 'hambre'); assert.ok(h && h.meses === 1 && h.pieza === 'granero', JSON.stringify(R.riesgos(H))); assert.match(h.remedio, /granero antes de diciembre/);
  R.mes(H); assert.equal(R.riesgos(H).find(x => x.c === 'hambre').meses, 0); const av2 = R.mes(H); assert.equal(R.fecha(H).mes, 11); assert.ok(av2.some(x => x.c === 'hambre') && H.hambre, 'hambre en diciembre');
  for (let i = 0; i < 2; i++) R.mes(H); assert.equal(R.fecha(H).mes, 1); assert.ok(H.hambre, 'dura hasta febrero'); R.mes(H); assert.ok(!H.hambre, 'termina en marzo');
  const J = mk(); const s = R.mejorSitio(J, 'granero'); R.colocar(J, 'granero', s[0], s[1], true).e.obra = 0; hasta(J, 9); assert.ok(!R.riesgos(J).some(x => x.c === 'hambre'), 'con granero no hay riesgo');
  let visto = 0; for (let sem = 1; sem <= 6 && !visto; sem++) { const K = R.crear(sem); R.fundar(K, 172, -196); R.sembrarCasas(K, 700); for (let i = 0; i < 60 && !visto; i++) { const q = R.riesgos(K).find(x => x.c === 'fuego'), n0 = K.mesN, av3 = R.mes(K); if (av3.some(x => x.c === 'fuego')) { assert.ok(q, 'el fuego se anunció antes'); visto++; } } } assert.ok(visto, 'hay fuego en alguna semilla'); });
prueba('CN8: el mismo mes llega en modo turnos, con un solo aviso por mes aunque haya varias ciudades; la colonia tiene los mismos sucesos', () => {
  const rq = createRequire(import.meta.url), D = rq('../js/data.js'), G = rq('../js/game.js'); G.usarCiudad(R);
  const store = {}; globalThis.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  try {
    G.newGame('CN8'); const ids = G.myCities(); const alertas = [], meses = []; G.onEvent = (t, p) => { if (t === 'alert') { alertas.push(p); if (/Crecida/.test(p)) meses.push(R.fecha({ mesN: Math.floor(G.state.t + 1e-9) + 9 }).mes); } };
    for (const id of ids) { const E = G.ciudadE(id); if (!E) continue; R.sembrarCasas(E, 300); for (const l of E.parcelas) if (!l.fuera && R.inundable(l.x, l.z) && !l.casa) l.casa = { nivel: 1, desde: 0, nace: 0, ruina: 0 }; }
    assert.ok(ids.length >= 2 && Array.isArray(G.riesgos(ids[0])) && G.riesgos('no existe').length === 0); const imp = G.riesgosImperio(); assert.ok(imp.every(x => Array.isArray(x.ciudades) && x.cid && x.remedio && x.c));
    for (let k = 0; k < 6; k++) G.pasarTurno();
    assert.ok(meses.length >= 1, 'llega la crecida en modo turnos'); assert.ok(meses.every(m => m === 2), 'siempre en marzo: ' + meses);
    const cr = alertas.filter(a => /Crecida/.test(a)); assert.ok(cr.every(a => (a.match(/🌊/g) || []).length === 1) && cr[0].includes(D.CITIES[ids[0]].n) && cr[0].includes(D.CITIES[ids[1]].n), 'una línea con todas las ciudades: ' + cr[0]);
    const s = G.state; s.res.grano = 900; s.res.oro = 900; s.cities.roma.pop = 500; assert.ok(G.enviarColonos('roma', 'cosa').ok); let n = 0; while (G.state.colonias.cosa.estado === 'camino' && n++ < 80) G.tick(1);
    assert.ok(G.fundarColonia('cosa', 172, -196).ok); assert.ok(Array.isArray(G.riesgos('cosa')) && G.ciudadE('cosa').fundada, 'la colonia tiene riesgos igual');
  } finally { delete globalThis.localStorage; G.onEvent = null; G.usarCiudad(null); } });

/* ---------- CN9a: ciudades por cultura y plantillas ---------- */
{
  const rq = createRequire(import.meta.url), D9 = rq('../js/data.js'), G9 = rq('../js/game.js'), ids = Object.keys(D9.CITIES);
  const objetivo = id => { const d = D9.CITIES[id]; return Math.round(G9.popCapViejo({ b: G9.edificiosBase(id, d.w, d.wl), barrio: 1 }) * 0.7); };
  const firma = E => JSON.stringify([E.edificios.map(e => [e.tipo, e.x, e.z, e.mejora]), R.poblacion(E), R.casas(E).map(l => [l.x, l.z, l.casa.nivel]), E.mesN, E.n0]);
  const tiempos = {};
  prueba('CN9a culturaDe: todas las facciones', () => {
    const t = (f, c, ti, id) => assert.deepEqual(R.culturaDe(f, id), { cultura: c, tinte: ti }, f);
    t('roma', 'roma', 'roma', 'roma'); t('cartago', 'cart', 'cart', 'carthago'); for (const f of ['epiro', 'siracusa', 'akragas', 'griegos', 'macedonia']) t(f, 'grie', 'grie', 'x');
    for (const f of ['etruscos', 'galos', 'mamertinos', 'iberos']) t(f, 'roma', f, 'x'); t('roma', 'roma', 'campanos', 'capua');
    for (const id of ids) { const c = R.culturaDe(D9.CITIES[id].f, id); assert.ok(['roma', 'grie', 'cart'].includes(c.cultura) && c.tinte, id); } });
  prueba('CN9a tamano', () => { assert.deepEqual([1, 2, 3, 4, 5].map(R.tamano), ['peq', 'peq', 'med', 'gra', 'gra']); });
  prueba('CN9a plantillas: piezas existentes, sin acueducto/termas/anfiteatro, mejora 0..3', () => {
    for (const [c, ts] of Object.entries(R.PLANTILLAS)) for (const [t, P] of Object.entries(ts)) { assert.ok(P.pob > 0 && P.meses >= 0, c + t);
      for (const [pz, m] of P.piezas) { assert.ok(R.EDIF[pz] && !R.EDIF[pz].accion, c + t + pz); assert.ok(!['acueducto', 'termas', 'anfiteatro'].includes(pz)); assert.ok(m >= 0 && m <= 3); } } });
  prueba('CN9a economía: Roma y Capua dan los mismos niveles que edificiosBase', () => {
    for (const id of ['roma', 'capua']) { const d = D9.CITIES[id], base = G9.edificiosBase(id, d.w, d.wl), E = R.desdePlantilla(id, d.f, d.w, { rapido: true }), suma = {};
      for (const e of E.edificios) { const b = R.EDIF[e.tipo].bid; if (b) suma[b] = (suma[b] || 0) + R.NIVEL_MEJORA[e.mejora || 0]; }
      for (const b of ['almacen', 'templo', 'mercado', 'cuartel', 'establo', 'herreria', 'puerto', 'granja', 'aserradero', 'cantera', 'mina']) { const L = base[b] || 0, esp = L < 1 ? 0 : R.NIVEL_MEJORA[R.MEJORA_DE_NIVEL(L)]; assert.equal(suma[b] || 0, esp, id + ' ' + b); }
      assert.ok(E.edificios.some(e => e.tipo === 'granero'), id + ' granero'); } });
  prueba('CN9a determinismo: la misma id da la misma ciudad (normal y rápida)', () => {
    for (const rap of [false, true]) { const d = D9.CITIES.tarentum, a = R.desdePlantilla('tarentum', d.f, d.w, { rapido: rap }), b = R.desdePlantilla('tarentum', d.f, d.w, { rapido: rap }); assert.equal(firma(a), firma(b)); } });
  prueba('CN9a cabe en el terreno: dentro de la rejilla, sin agua, casas sin solaparse', () => {
    for (const id of ['roma', 'tarentum', 'carthago', 'syracusae', 'volsinii']) { const d = D9.CITIES[id], E = R.desdePlantilla(id, d.f, d.w, { rapido: true }), lim = (x, z) => x > R.X0 && x < R.X0 + R.LADO && z > R.Z0 && z < R.Z0 + R.LADO;
      for (const e of E.edificios) { assert.ok(lim(e.x, e.z), id + ' ' + e.tipo + ' fuera'); if (e.tipo !== 'muelle') assert.ok(!R.esAgua(e.x, e.z), id + ' ' + e.tipo + ' en agua'); }
      const cs = R.casas(E).filter(l => !l.fuera); for (const l of cs) { assert.ok(lim(l.x, l.z), id + ' casa fuera'); assert.ok(!R.esAgua(l.x, l.z), id + ' casa en agua'); }
      let m = 1e9; for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) m = Math.min(m, Math.hypot(cs[i].x - cs[j].x, cs[i].z - cs[j].z)); assert.ok(m > 6, id + ' casas a ' + m.toFixed(1)); } });
  prueba('CN9a población dentro de ±15 % de popCapViejo*0.7 (18 ciudades; w=1 queda aparte)', () => {
    for (const id of ids) { const d = D9.CITIES[id]; if (d.w < 2) continue; const t = Date.now(), E = R.desdePlantilla(id, d.f, d.w, { rapido: true }); tiempos['rap ' + id] = Date.now() - t; assert.ok(E, id);
      const o = id === 'roma' ? 287 : objetivo(id), p = R.poblacion(E); assert.ok(p >= o * 0.85 && p <= o * 1.15, `${id}: ${p} vs ${o}`); } });
  prueba('CN9a población en modo normal: Roma, Tarento, Cartago; y tiempos', () => {
    for (const id of ['roma', 'tarentum', 'carthago']) { const d = D9.CITIES[id], t = Date.now(), E = R.desdePlantilla(id, d.f, d.w, { finEn: 9 }); const dt = Date.now() - t; assert.ok(E && E.mesN === 9, id);
      const o = objetivo(id), p = R.poblacion(E); assert.ok(p >= o * 0.85 && p <= o * 1.15, `${id}: ${p} vs ${o}`);
      const t2 = Date.now(), B = R.deDatos(JSON.parse(JSON.stringify(R.aDatos(E)))), dr = Date.now() - t2; console.log(`      ${id}: normal ${dt} ms · reconstruir ${dr} ms`);
      assert.equal(firma(B), firma(E), id + ' ida y vuelta'); assert.ok(dt < 2500 && dr < 1000, `${id} ${dt}/${dr} ms`); } });
  prueba('CN9a aDatos/deDatos conservan cultura y tinte; datos viejos → romana', () => {
    const d = D9.CITIES.syracusae, E = R.desdePlantilla('syracusae', d.f, d.w, { rapido: true }), J = JSON.parse(JSON.stringify(R.aDatos(E)));
    assert.deepEqual([J.cultura, J.tinte, J.tam], ['grie', 'grie', 'gra']); const B = R.deDatos(J); assert.deepEqual([B.cultura, B.tinte, B.tam], ['grie', 'grie', 'gra']);
    const G2 = R.desdePlantilla('volsinii', 'etruscos', 2, { rapido: true }); assert.equal(R.deDatos(JSON.parse(JSON.stringify(R.aDatos(G2)))).tinte, 'etruscos');
    const V = R.aDatos(R.crear(1)); delete V.cultura; delete V.tinte; delete V.tam; const O = R.deDatos(V); assert.deepEqual([O.cultura, O.tinte], ['roma', 'roma']); });
  prueba('CN9a finEn: E.mesN coincide y n0 = finEn - meses', () => { const d = D9.CITIES.tarentum, E = R.desdePlantilla('tarentum', d.f, d.w, { finEn: 20, rapido: true }); assert.equal(E.mesN, 20); const E2 = R.desdePlantilla('tarentum', d.f, d.w, { finEn: 20 }); assert.equal(E2.mesN, 20); assert.equal(E2.n0, 20 - R.PLANTILLAS.grie.med.meses); });
}
process.exit(fallos.length ? 1 : 0);
