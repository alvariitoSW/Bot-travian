// AQVILA — pruebas rápidas del Saber (I5-B), sin navegador: node test/saber.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js');
const fallos = []; let n = 0;
const t = (nombre, f) => { n++; try { f(); console.log('bien  ' + nombre); } catch (e) { fallos.push(nombre); console.log('MAL   ' + nombre + ' → ' + e.message); } };
const near = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, (m || '') + ' ' + a + ' vs ' + b);

// partida nueva, sin turnos, con caja de sobra y los edificios de los requisitos
function nueva() {
  G.turnos = false; const s = G.newGame('Prueba'); G.turnos = false; s.turnos = false;
  for (const r of D.RES) { s.res[r] = 100000; s.alm[r] = 0; }
  const c = s.cities.roma; Object.assign(c.b, { foro: 3, puerto: 1, mercado: 3, granja: 6, cuartel: 3, muralla: 3, templo: 3, almacen: 4 });
  return s;
}
const hecho = (s, ids) => { for (const id of [].concat(ids)) s.inv.hechas[id] = 0; s.inv.rev++; };
const clon = s => JSON.parse(JSON.stringify(s));
// mide f() en una copia de la partida base con esos saberes hechos
function con(base, ids, f) { const cp = clon(base); G.state = cp; hecho(cp, ids || []); try { return f(cp); } finally { G.state = base; } }
const dueno = (s, ids) => { for (const id of ids) s.cities[id].owner = 'roma'; };

t('hay 22 saberes y 3 edades', () => { assert.strictEqual(Object.keys(D.INVEST).length, 22); assert.strictEqual(Object.keys(D.EDADES).length, 3); });

t('requisitos: cada tipo de la gramática', () => {
  const s = nueva(), q = r => G.invReq(null, r);
  assert.ok(q({ edad: 1 }) && !q({ edad: 2 })); s.inv.edad = 2; assert.ok(q({ edad: 2 }));
  assert.ok(q({ b: ['foro', 3] }) && !q({ b: ['foro', 4] }) && !q({ b: ['puerto', 3] }));
  assert.ok(q({ b: ['escuela', 3] }), 'atajo mientras no existe la Escuela'); assert.ok(!D.BUILD.escuela);
  assert.ok(q({ barrio: 1 }) && !q({ barrio: 5 }));
  assert.ok(q({ ciudades: 2 }) && !q({ ciudades: 3 }));
  assert.ok(!q({ tiene: ['syracusae'] })); dueno(s, ['syracusae']); assert.ok(q({ tiene: ['syracusae'] }));
  assert.ok(!q({ fac: 'cartago' })); dueno(s, ['panormus']); assert.ok(q({ fac: 'cartago' }));
  assert.ok(!q({ inv: ['griego'] })); hecho(s, 'griego'); assert.ok(q({ inv: ['griego'] }));
  assert.ok(!q({ saberes: 2 })); hecho(s, 'apio'); assert.ok(q({ saberes: 2 }));
  assert.ok(!q({ ramas: 2 })); assert.ok(q({ ramas: 1 })); hecho(s, 'castra'); assert.ok(q({ ramas: 2 }));
  assert.ok(!q({ y: 250 })); s.t = 12 * 40; assert.ok(q({ y: 250 }) && q({ y: 240 }) && !q({ y: 239 }));   // año 240
  assert.ok(q({ o: [{ y: 1 }, { edad: 1 }] }) && !q({ o: [{ y: 1 }, { edad: 4 }] }));
  for (const id in D.INVEST) for (const r of D.INVEST[id].req) assert.ok(typeof G.invReqTxt(r) === 'string' && G.invReqTxt(r) !== '?', id);
  assert.strictEqual(G.invReqLista('medicina').length, D.INVEST.medicina.req.length);
});

t('Medicina: abre con el año 219 o con 5 ciudades (probar los dos lados)', () => {
  const s = nueva(); s.inv.edad = 3; const o = D.INVEST.medicina.req.find(r => r.o);
  s.t = 12 * 60; assert.strictEqual(G.yearOf(s.t), 220); assert.ok(!G.invReq(null, o), 'año 220 y 2 ciudades: cerrada');
  s.t = 12 * 61; assert.strictEqual(G.yearOf(s.t), 219); assert.ok(G.invReq(null, o), 'año 219: abierta');
  s.t = 0; assert.ok(!G.invReq(null, o)); dueno(s, ['tarentum', 'agrigentum', 'syracusae']); assert.strictEqual(G.myCities().length, 5); assert.ok(G.invReq(null, o), '5 ciudades: abierta');
  assert.strictEqual(G.invEstado('medicina').e, 'ok');
});

t('{ciudades:n} se recorta a las de la región menos una', () => {
  const s = nueva(); const nr = G.ciudadesRegion().length; assert.ok(nr > 2);
  const rg = G.region; G.ciudadesRegion = () => ['roma', 'capua', 'x']; assert.ok(G.invReq(null, { ciudades: 7 }), 'región de 3: pide 2');
  G.ciudadesRegion = () => D.regionCiudades(G.regionId()); assert.ok(!G.invReq(null, { ciudades: 7 }));
});

t('exclusiones: el gemelo queda cerrado, en los dos sentidos', () => {
  let pares = 0;
  for (const id in D.INVEST) for (const x of D.INVEST[id].excl) {
    pares++; assert.ok(D.INVEST[x].excl.includes(id), 'simétrica ' + id + '/' + x);
    const s = nueva(); s.inv.edad = 4; hecho(s, id); const e = G.invEstado(x); assert.strictEqual(e.e, 'excl', x); assert.strictEqual(e.excl, id);
  }
  assert.strictEqual(pares, 12);
});

t('pago al empezar, una sola cosa en cola, y estados', () => {
  const s = nueva(); assert.strictEqual(G.invEstado('griego').e, 'ok');
  const antes = {}; D.RES.forEach(r => { antes[r] = G.disponible(r); }); const c = G.invCoste('griego');
  const r = G.invUp('griego'); assert.ok(r.ok, r.motivo);
  D.RES.forEach(k => near(G.disponible(k), antes[k] - c[k], k)); assert.strictEqual(s.inv.cola.id, 'griego'); near(s.inv.cola.P, 12);
  assert.strictEqual(G.invEstado('griego').e, 'curso'); assert.strictEqual(G.invEstado('apio').e, 'cola');
  assert.ok(!G.invUp('apio').ok); assert.strictEqual(G.invEstado('quinque').e, 'edad');
  const s2 = nueva(); s2.res.hierro = 0; s2.alm.hierro = 0; const e = G.invEstado('griego'); assert.strictEqual(e.e, 'falta'); assert.ok(/hierro/.test(e.motivo));
  assert.ok(!G.invUp('griego').ok, 'sin fondos no paga'); assert.strictEqual(s2.inv.cola, null);
  G.invCompleta('griego'); assert.strictEqual(s2.inv.hechas.griego, 0); assert.strictEqual(G.invEstado('griego').e, 'hecha');
});

t('precio fijo: nada de pm/escala; tope 0.8 × G.cap(); tipo artesanos', () => {
  const s = nueva(); assert.strictEqual(s.inv.pm, undefined); assert.strictEqual(G.escala, undefined);
  const c0 = G.invCoste('magon'); D.RES.forEach(r => assert.strictEqual(c0[r], D.INVEST.magon.cost[r]));
  for (const k of D.RES) s.res[k] = 5000;
  const cap = G.cap(), old = D.SABER.tope; D.SABER.tope = 0.1;
  try { const c = G.invCoste('magon'); D.RES.forEach(r => assert.ok(c[r] <= Math.floor(0.1 * cap) && c[r] === Math.min(D.INVEST.magon.cost[r], Math.floor(0.1 * cap)), r));
    } finally { D.SABER.tope = old; }
  assert.strictEqual(old, 0.8); assert.ok(D.RES.every(r => G.invCoste('E4')[r] <= 0.8 * cap));
  s.cities.roma.tipo = 'saber'; const c2 = G.invCoste('griego'); assert.strictEqual(c2.piedra, Math.round(50 * 0.75)); near(G.invTiempo('griego'), 12 * 0.75);
  hecho(s, ['griego', 'apio']); s.cities.roma.b.foro = 2; D.SABER.tope = 0.02; try { for (const k of D.RES) s.res[k] = 0; assert.strictEqual(G.invEstado('E2').e, 'almacen'); D.SABER.tope = old; assert.strictEqual(G.invEstado('E2').e, 'falta'); } finally { D.SABER.tope = old; }
});

t('Eureka: ×4/3 mientras se posee la ciudad, P intacto', () => {
  const s = nueva(); s.inv.edad = 2; assert.strictEqual(D.INVEST.quinque.eureka, 'tarentum');
  assert.strictEqual(G.eurekaMul('quinque'), 1); assert.strictEqual(G.eurekaMul('griego'), 1);
  dueno(s, ['tarentum']); assert.strictEqual(G.eurekaMul('quinque'), 4 / 3);
  assert.ok(G.invUp('quinque').ok); const P = s.inv.cola.P; G.invTick(3); near(s.inv.cola.p, 4); near(s.inv.cola.P, P);
  s.cities.tarentum.owner = 'samnitas'; assert.strictEqual(G.eurekaMul('quinque'), 1); G.invTick(3); near(s.inv.cola.p, 7); near(s.inv.cola.P, P);
  dueno(s, ['tarentum']); G.invTick(20); assert.strictEqual(s.inv.hechas.quinque !== undefined, true); assert.strictEqual(s.inv.cola, null);
  const e = nueva(); e.inv.edad = 3; assert.deepStrictEqual([].concat(D.INVEST.astilleros.eureka), ['panormus', 'lilybaeum']);
  dueno(e, ['lilybaeum']); assert.strictEqual(G.eurekaMul('astilleros'), 4 / 3);
});

t('subida de edad ocupa la cola y la completa', () => {
  const s = nueva(); assert.ok(!G.edadUp().ok, 'sin 2 saberes no sube'); hecho(s, ['griego', 'apio']); s.cities.roma.b.foro = 2;
  assert.strictEqual(G.invEstado('E2').e, 'ok'); assert.strictEqual(G.invEstado('E3').e, 'edad');
  assert.ok(G.edadUp().ok); assert.strictEqual(s.inv.cola.id, 'E2'); assert.strictEqual(G.invEstado('castra').e, 'cola');
  G.invTick(24); assert.strictEqual(s.inv.edad, 2); assert.strictEqual(s.inv.cola, null); assert.ok(s.inv.hechas.E2 !== undefined);
  assert.strictEqual(G.invVista().edadNombre, 'Roma sale al mar'); assert.strictEqual(G.invVista().sig.id, 'E3');
  s.inv.edad = 4; assert.ok(!G.edadUp().ok); assert.strictEqual(G.invVista().sig, null);
});

t('efectos de una vez: pts y favor no se repiten al cargar', () => {
  const s = nueva(); const p0 = s.hero.pts, f0 = { s: s.favor.senado, p: s.favor.pueblo };
  G.invCompleta('perseo'); assert.strictEqual(s.hero.pts, p0 + 2);
  G.invCompleta('medicina'); assert.strictEqual(s.favor.senado, f0.s - 3); assert.strictEqual(s.favor.pueblo, f0.p + 3);
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  try { G.save(); assert.ok(G.load()); const s2 = G.state; assert.strictEqual(s2.hero.pts, p0 + 2); assert.strictEqual(s2.favor.senado, f0.s - 3); assert.ok(s2.inv.hechas.perseo !== undefined);
    G.invTick(10); assert.strictEqual(G.state.hero.pts, p0 + 2); assert.ok(G.invMul('crece') > 1); } finally { delete global.localStorage; }
});

t('techos de la ciencia con los 22 forzados', () => {
  const s = nueva(); hecho(s, Object.keys(D.INVEST)); const T = D.SABER.techos;
  for (const k of ['grano', 'crece', 'impuestos', 'oroCom', 'rutaRenta']) assert.ok(G.invMul(k) <= T[k] + 1e-12, k + ' ' + G.invMul(k));
  for (const k of ['obra', 'paga', 'instr']) assert.ok(G.invMul(k) >= T[k] - 1e-12, k + ' ' + G.invMul(k));
  assert.ok(G.invSum('mor') <= T.mor && G.invSum('defMuro') <= T.defMuro + 1e-12);
  near(G.invMul('grano'), 1.08); near(G.invMul('crece'), 1.2); near(G.invMul('impuestos'), 1.12); near(G.invMul('obra'), 0.88); near(G.invMul('instr'), 0.94 > 0.9 ? 0.94 : 0.9);
  const tra = G.viajeCiencia('viajeTierra', 12), mar = G.viajeCiencia('viajeMar', 20); near(tra, 9); near(mar, 14);   // mar: quinque -3, remeros -3 (techo -6)
  near(G.invMul('hambre'), 0.5); near(G.invMul('inqMeses'), 0.6);
});

t('G.techoFinal apila bienes + tipos + ciencia', () => {
  near(G.techoFinal('crece', 1.1, 1.1 * 1.2), 1.25);        // Sal x1,1 con ciencia 1,2
  near(G.techoFinal('paga', 0.675, 0.675 * 0.95), 0.675);   // Pieles x0,9 con colonia militar x0,75: la ciencia no empuja más
  near(G.techoFinal('impuestos', 1.1, 1.1 * 1.12), 1.2);
  near(G.techoFinal('oroCom', 1.65, 1.65 * 1.25), 1.65);    // ya pasa del techo sin ciencia: ni suma ni resta
  near(G.techoFinal('obra', 0.95, 0.95 * 0.88), 0.95 * 0.88 > 0.75 ? 0.95 * 0.88 : 0.75);
  near(G.techoFinal('viajeMar', 2, 1), 2); near(G.techoFinal('viajeMar', 5, 1), 3);
  // con la partida real: Roma tiene Sal (crece x1,1)
  const s = nueva(); near(G.bonoMul('crece'), 1.1); hecho(s, ['trigo', 'medicina', 'magon']); near(G.invMul('crece'), 1.2); near(G.bonoMul('crece'), 1.25);
  const s2 = nueva(); hecho(s2, 'castra'); near(G.bonoMul('paga'), 0.95); near(G.bonoMul('paga', 0.75), 0.95); dueno(s2, ['ambracia']); near(G.bonoMul('paga'), 0.9 * 0.95 > 0.7 ? 0.9 * 0.95 : 0.7);
  hecho(s2, ['colon']); near(G.bonoMul('instr', 0.8), 0.9);   // Caballos x0,9 con Colonia militar x0,8 ya pasan del techo x0,78: la ciencia no suma ni resta
  near(G.bonoMul('instr', 1), 0.9 * 0.94 > 0.78 ? 0.9 * 0.94 : 0.78);
});

t('caché: se invalida con s.inv.rev', () => {
  const s = nueva(); assert.strictEqual(G.invMul('grano'), 1); s.inv.hechas.trigo = 0; assert.strictEqual(G.invMul('grano'), 1, 'sin rev sigue en caché');
  s.inv.rev++; near(G.invMul('grano'), 1.05); delete s.inv.hechas.trigo; s.inv.rev++; assert.strictEqual(G.invMul('grano'), 1);
  hecho(s, 'trigo'); const otra = nueva(); assert.strictEqual(G.invMul('grano'), 1, 'otra partida: otra caché');
});

t('con ningún saber hecho todo es idéntico (prod, cuentas, travel, mantenimiento)', () => {
  const s = nueva(); s.cities.roma.units = { hastati: 100, equites: 20 }; s.cities.capua.units = { triarii: 30 };
  const f = () => JSON.stringify([G.prod(), G.cuentas(), G.mantenimiento(), G.popCap(s.cities.roma), G.trainDur(s.cities.roma, 'hastati', 10), G.buildTime(s.cities.roma, 'foro'),
    Object.keys(s.cities).map(a => G.neighbors(a).map(b => G.travel(a, b))), G.felicidad(s.cities.roma), G.rutaMax(s.cities.roma)]);
  const a = f(); const sv = s.inv; delete s.inv; const b = f(); s.inv = sv; assert.strictEqual(a, b, 'sin s.inv igual que con s.inv vacío');
  hecho(s, 'trigo'); assert.notStrictEqual(f(), a); delete s.inv.hechas.trigo; s.inv.rev++; assert.strictEqual(f(), a, 'deshacer vuelve a lo mismo');
});

t('medidas con y sin cada mejora', () => {
  const base = nueva(); base.cities.roma.units = { hastati: 200 }; const c = 'roma';
  base.rutas = []; base.cities.roma.b.mercado = 3; base.cities.capua.b.mercado = 3;
  const med = (ids, f) => con(base, ids, f);
  for (const id in D.INVEST) {
    const ef = D.INVEST[id].ef, B = [id], er = '(' + id + ')';
    if (ef.grano) { const a = med([], () => G.prod().grano), b = med(B, () => G.prod().grano); assert.ok(b > a, 'grano ' + er); }
    if (ef.crece) { const a = med([], () => G.bonoMul('crece')), b = med(B, () => G.bonoMul('crece')); assert.ok(ef.crece > 1 ? b > a : b < a, 'crece ' + er); }
    if (ef.impuestos) { const a = med([], () => G.cuentas().oro.impuestos), b = med(B, () => G.cuentas().oro.impuestos); assert.ok(b > a, 'impuestos ' + er); }
    if (ef.oroCom) { const a = med([], () => G.cuentas().oro.foro), b = med(B, () => G.cuentas().oro.foro); assert.ok(b > a, 'oroCom ' + er); }
    if (ef.obra) { const a = med([], () => G.buildTime(base.cities.roma, 'foro')), b = med(B, () => G.buildTime(base.cities.roma, 'foro')); assert.ok(b < a, 'obra ' + er); }
    if (ef.paga) { const a = med([], () => G.mantenimiento().tropas), b = med(B, () => G.mantenimiento().tropas); assert.ok(b < a, 'paga ' + er); }
    if (ef.instr) { const a = med([], () => G.trainDur(base.cities.roma, 'hastati', 10)), b = med(B, () => G.trainDur(base.cities.roma, 'hastati', 10)); assert.ok(b < a, 'instr ' + er); }
    if (ef.popCap) { const a = med([], () => G.popCap(base.cities.roma)), b = med(B, () => G.popCap(base.cities.roma)); assert.ok(b > a, 'popCap ' + er); }
    if (ef.fel) { const a = med([], () => G.felicidad(base.cities.roma)), b = med(B, () => G.felicidad(base.cities.roma)); assert.ok(ef.fel > 0 ? b > a : b < a, 'fel ' + er); }
    if (ef.rutas) { const a = med([], () => G.rutaMax(base.cities.roma)), b = med(B, () => G.rutaMax(base.cities.roma)); assert.strictEqual(b, a + 1, 'rutas ' + er); }
    if (ef.rutaRenta) { const r = { a: 'roma', b: 'capua', f: 'roma' }; const a = med([], () => G.rutaRenta(r)), b = med(B, () => G.rutaRenta(r)); near(b / a, ef.rutaRenta, 'rutaRenta ' + er); }
    if (ef.cl) { const a = med([], () => G.K()), b = med(B, () => G.K()); for (const k in ef.cl) { assert.strictEqual(b[k], ef.cl[k], 'cl ' + er); assert.strictEqual(a[k], D.CLASES[k] === undefined ? undefined : D.CLASES[k]); } }
    if (ef.sinBien) { const a = med([], () => G.faltaEspecial('edificio', 'puerto', D.ESP_NIVEL)), b = med(B, () => G.faltaEspecial('edificio', 'puerto', D.ESP_NIVEL)); assert.strictEqual(a, 'maderanaval'); assert.strictEqual(b, null); }
    if (ef.inqMeses) { const g = ids => med(ids, () => { const x = G.state.cities.capua; G.incorporar(x, {}, true); return [x.inq, G.inqMul(x)]; }); const a = g([]), b = g(B);
      near(a[0], D.INQ_MESES); near(b[0], D.INQ_MESES * ef.inqMeses); near(a[1], 1 - D.INQ_PROD); near(b[1], 1 - D.INQ_PROD * ef.inqProd); }
    if (ef.hambre) { const g = ids => med(ids, st => { G.turnos = false; const x = st.cities.roma; x.units = { hastati: 6000 }; for (const r of ['grano']) { st.res[r] = 0; st.alm[r] = 0; } x.pop = 200; G.tick(0.25); return x.pop; });
      const a = g([]), b = g(B); assert.ok(a < 200 && b > a, 'hambre ' + er + ' ' + a + ' ' + b); }
  }
});

t('crecimiento real con Trigo', () => {
  const base = nueva(); const g = ids => con(base, ids, st => { G.turnos = false; const x = st.cities.roma; x.pop = 100; x.imp = 'normal'; G.tick(0.5); return x.pop; });
  const a = g([]), b = g(['trigo']); assert.ok(b > a, a + ' vs ' + b);
});

t('viajes en meses: 6→3, 3→3, 9→3, con G.turnos true y false', () => {
  for (const tur of [false, true]) {
    G.turnos = tur; const s = nueva(); G.turnos = tur; s.turnos = tur;
    const v = (ids, campo, x) => con(s, ids, () => { G.turnos = tur; return G.viajeCiencia(campo, x); });
    near(v(['apio'], 'viajeTierra', 6), 3); near(v(['apio'], 'viajeTierra', 3), 3); near(v(['apio'], 'viajeTierra', 2), 2); near(v(['apio'], 'viajeTierra', 4), 3);
    near(v(['quinque'], 'viajeMar', 6), 3); near(v(['quinque'], 'viajeMar', 3), 3); near(v(['quinque', 'remeros'], 'viajeMar', 9), 3); near(v(['quinque', 'remeros'], 'viajeMar', 6), 3);
    near(v(['quinque', 'remeros'], 'viajeMar', 12), 6); near(v([], 'viajeMar', 9), 9);
    // trayectos reales de la red: nunca suben, nunca bajan de 3 si empezaban en más de 3
    for (const a of ['roma', 'capua']) for (const b of G.neighbors(a)) {
      const t0 = con(s, [], () => G.travel(a, b)), t1 = con(s, ['apio', 'quinque', 'remeros'], () => G.travel(a, b));
      assert.ok(t1 <= t0 + 1e-12, a + b); assert.ok(t0 <= 3 || t1 >= 3 - 1e-9 || G.travel(a, b) < 3, a + b);
    }
    // una marcha real: la llegada nunca antes de 3 meses
    const s2 = nueva(); G.turnos = tur; s2.turnos = tur; hecho(s2, 'apio'); const c = s2.cities.roma; c.units = { hastati: 50 }; const nb = G.neighbors('roma').find(x => !G.edge('roma', x)[2]);
    G.send('roma', nb, { hastati: 20 }); const m = s2.marches[s2.marches.length - 1]; assert.ok(m && m.t1 - m.t0 >= 3 - 1e-9 || G.travel('roma', nb) < 3);
  }
  G.turnos = false;
});

t('viajes ajenos no cambian (solo cuentan las ciudades romanas)', () => {
  const s = nueva(); const a = Object.keys(s.cities).find(id => s.cities[id].owner !== 'roma' && G.neighbors(id).length); const b = G.neighbors(a)[0];
  const t0 = G.travel(a, b); hecho(s, ['apio', 'quinque', 'remeros']); near(G.travel(a, b), t0);
});

t('Fasti, Astilleros y la Escuela (sin edificio aún)', () => {
  const s = nueva(); assert.strictEqual(G.faltaInv('escuela'), null); assert.strictEqual(G.faltaInv('foro'), null);
  D.BUILD.escuela = { n: 'Escuela', time: 1, cost: {} }; try { assert.ok(/griego|Preceptores/.test(G.faltaInv('escuela'))); hecho(s, 'griego'); assert.strictEqual(G.faltaInv('escuela'), null); } finally { delete D.BUILD.escuela; }
  assert.ok(!G.invReq(null, { b: ['escuela', 1] }) === false);
});

t('partida vieja carga y G.prod no desborda la pila', () => {
  const store = {}; global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
  try {
    const raw = require('node:fs').readFileSync(new URL('./partida-vieja.json', import.meta.url), 'utf8'); store['aqvila-save-v1'] = raw;
    assert.ok(G.load(), 'carga'); const s = G.state; assert.ok(s.inv && s.inv.v === 1 && s.inv.edad === 1 && Object.keys(s.inv.hechas).length === 0 && s.inv.cola === null);
    assert.ok(Number.isFinite(G.prod().oro)); for (let i = 0; i < 6; i++) G.tick(0.25); assert.ok(Number.isFinite(G.prod().grano));
    const f = JSON.parse(raw).forja; if (f) assert.deepStrictEqual(s.forja.armas, f.armas);
    const s2 = nueva(); hecho(s2, Object.keys(D.INVEST)); s2.cities.roma.sabios = { dot: 100 }; assert.ok(Number.isFinite(G.prod().oro)); G.save(); assert.ok(G.load()); assert.ok(Number.isFinite(G.prod().oro));
    assert.ok(Number.isFinite(G.invVista().techos.length));
  } finally { delete global.localStorage; }
});

console.log('\n' + (n - fallos.length) + '/' + n + ' pruebas del Saber' + (fallos.length ? ' — FALLAN: ' + fallos.join(', ') : ' — APTO'));
process.exit(fallos.length ? 1 : 0);
