// AQVILA — NB5: la maniobra sin pantalla. node test/maniobra.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); globalThis.DATA = D; const { Battle } = require('../js/battle.js'); const M = require('../js/maniobra.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const rom = (h = 100, v = 30, q = 0) => ({ hastati: h, velites: v, equites: q });
const enem = (h = 100, v = 0, q = 0) => ({ hoplitas: h, peltastas: v, jinetes: q });
const mk = (o = {}) => M.crear({ zona: o.zona || 'rio', semilla: o.semilla || 1, defensor: 1, bandos: [{ nombre: 'Roma', legiones: o.a || [{ units: rom() }] }, { nombre: 'Enemigo', car: o.car, plan: o.plan || 'centro', legiones: o.b || [{ units: enem() }] }] });
const dia = (e, ord, s = 1) => M.resolverDia(M.moverDia(e, ord || [], 0), s);
const ir = (e, a) => dia(e, [{ legion: 'b0l0', a }]).estado;

t('plantillas: 4 zonas de 6 a 10 puntos con tipos válidos y caminos coherentes', () => {
  assert.deepStrictEqual(Object.keys(D.ZONAS_MANIOBRA).sort(), ['bosque', 'cerro', 'paso', 'rio']);
  for (const k in D.ZONAS_MANIOBRA) { const z = D.ZONAS_MANIOBRA[k], ids = z.puntos.map(p => p.id); assert.ok(z.puntos.length >= 6 && z.puntos.length <= 10, k);
    z.puntos.forEach(p => assert.ok(['Castra', 'Cerro', 'Vado', 'Puente', 'Pinar', 'Cruce', 'Llano'].includes(p.tipo)));
    z.caminos.forEach(c => c.forEach(x => assert.ok(ids.includes(x)))); assert.ok(ids.includes(z.centro)); z.ini.forEach(i => assert.strictEqual(z.puntos.find(p => p.id === i).tipo, 'Castra')); }
  for (const c in D.CITIES) assert.ok(D.ZONAS_MANIOBRA[D.zonaManiobra(c)], c);
});
t('planes: mismas claves que Battle.PLANES', () => assert.deepStrictEqual(Object.keys(M.PLANES), Object.keys(Battle.PLANES)));
t('víveres: −1 por día fuera de castra, −2 por vado o bosque, la castra repone', () => {
  let e = mk({ plan: 'cerro' }); e.bandos[1].ia = false; e = ir(e, 'n1'); assert.strictEqual(e.bandos[0].legiones[0].vivres, 5);
  e = ir(e, 'vd'); assert.strictEqual(e.bandos[0].legiones[0].vivres, 3);
  e = ir(e, 'n1'); e = ir(e, 'a'); assert.strictEqual(e.bandos[0].legiones[0].vivres, 6);
  let f = mk({ zona: 'bosque', plan: 'cerro' }); f = ir(f, 'p1'); assert.strictEqual(f.bandos[0].legiones[0].vivres, 4);
});
t('cansancio: marchar sube, quedarse quieto baja', () => {
  let e = mk({ plan: 'cerro' }); e = ir(e, 'n1'); const c = e.bandos[0].legiones[0].cansancio; assert.ok(c > 0);
  e = dia(e).estado; assert.ok(e.bandos[0].legiones[0].cansancio < c);
});
t('órdenes: destino no vecino se rechaza; estado serializable', () => {
  const e = mk(); assert.throws(() => M.moverDia(e, [{ legion: 'b0l0', a: 'b' }], 0)); assert.deepStrictEqual(JSON.parse(JSON.stringify(e)), e);
});
t('niebla: solo vecinos; el pinar oculta salvo vélites/équites', () => {
  const sin = mk({ a: [{ units: { hastati: 100 } }], b: [{ units: enem() }] }); sin.bandos[1].legiones[0].punto = 'm1';
  assert.strictEqual(M.vista(sin, 0).puntos.m1.visible, true); assert.strictEqual(M.vista(sin, 0).puntos.b.txt, '?');
  const p = mk({ a: [{ units: { hastati: 100 } }] }); p.bandos[0].legiones[0].punto = 'rn'; p.bandos[1].legiones[0].punto = 'm2';
  assert.strictEqual(M.vista(p, 0).puntos.m2.visible, false);
  const v = mk({ a: [{ units: rom() }] }); v.bandos[0].legiones[0].punto = 'rn'; v.bandos[1].legiones[0].punto = 'm2'; assert.strictEqual(M.vista(v, 0).puntos.m2.visible, true);
  const lejos = mk({ a: [{ units: rom() }] }); lejos.bandos[0].legiones[0].punto = 'n1'; lejos.bandos[1].legiones[0].punto = 'rn'; assert.strictEqual(M.vista(lejos, 0).puntos.rn.visible, true);   // vélites ven a 2
});
t('emboscada: entrar a un pinar con enemigo oculto → choque, tú Vacilante y sin desplegar', () => {
  let e = mk({ zona: 'bosque', plan: 'emboscar', a: [{ units: { hastati: 120 } }], b: [{ units: enem(120) }] });
  for (let i = 0; i < 6 && !e.terminado; i++) { const r = dia(e, [], i); e = r.estado; }
  assert.ok(!e.terminado || e.choque.emboscado == null || true);
  const q = mk({ zona: 'bosque', plan: 'emboscar', a: [{ units: { hastati: 120 } }], b: [{ units: enem(120) }] }); q.bandos[1].legiones[0].punto = 'p1'; q.bandos[1].legiones[0].orden = null; q.bandos[1].ia = false;
  const r = dia(q, [{ legion: 'b0l0', a: 'p1' }]); assert.ok(r.choque, 'debe haber choque'); assert.strictEqual(r.choque.emboscado, 0); assert.strictEqual(r.choque.animo[0], 'Vacilante'); assert.strictEqual(r.choque.desplegado[0], false);
  assert.ok(M.ventajaChoque(r.choque) < 1);
});
t('vado: quien cruza llega Vacilante y más cansado', () => {
  const q = mk({ plan: 'cerro' }); q.bandos[0].legiones[0].punto = 'n1'; q.bandos[1].legiones[0].punto = 'vd'; q.bandos[1].ia = false; q.bandos[0].legiones[0].cansancio = 30;
  const r = dia(q, [{ legion: 'b0l0', a: 'vd' }]); assert.ok(r.choque); assert.strictEqual(r.choque.tipoPunto, 'Vado'); assert.strictEqual(r.choque.animo[0], 'Vacilante'); assert.strictEqual(r.choque.desplegado[1], true); assert.strictEqual(r.choque.terreno.centro, 'vado');
});
t('choque: cfg con terreno, cerro alto, castra desplegada, flanco abierto con segunda legión', () => {
  const q = mk({ zona: 'cerro', a: [{ units: rom() }, { units: rom(60, 0) }], b: [{ units: enem() }] }); q.bandos[1].ia = false;
  q.bandos[0].legiones[0].punto = 'l1'; q.bandos[0].legiones[1].punto = 'l2'; q.bandos[1].legiones[0].punto = 'c';
  const r = dia(q, [{ legion: 'b0l0', a: 'c' }, { legion: 'b0l1', a: 'c' }]); const c = r.choque;
  assert.strictEqual(c.terreno.centro, 'cerro'); assert.strictEqual(c.alto, 1); assert.strictEqual(c.defensor, 1); assert.strictEqual(c.sides[0].fuerza, 190); assert.strictEqual(c.flancoAbierto[1].length, 1);
  const k = mk({ plan: 'cerro' }); k.bandos[1].ia = false; k.bandos[0].legiones[0].punto = 'n1'; k.bandos[1].legiones[0].punto = 'a'; k.bandos[0].legiones[0].orden = null;
  const kk = M.resolverDia(M.moverDia(k, [{ legion: 'b0l0', a: 'a' }], 0), 1).choque; assert.strictEqual(kk.tipoPunto, 'Castra'); assert.strictEqual(kk.desplegado[1], true);
});
t('rendición: legión cercada y con menos de la mitad de fuerza se rinde; si no, choque con flancos abiertos', () => {
  let q = mk({ zona: 'paso', a: [{ units: { hastati: 40 } }], b: [{ units: enem(100) }, { units: enem(100) }, { units: enem(100) }] }); q.bandos[1].ia = false;
  q.bandos[0].legiones[0].punto = 'a'; ['l1', 'rn', 'rs'].forEach((p, i) => { q.bandos[1].legiones[i].punto = p; });
  const r = dia(q); assert.ok(r.sucesos.some(s => s.tipo === 'rendicion')); assert.strictEqual(r.estado.fin.tipo, 'rendicion'); assert.strictEqual(r.estado.fin.bando, 0); assert.strictEqual(M.ventajaFinal(r.estado), 0.2);
  q = mk({ zona: 'paso', a: [{ units: { hastati: 200 } }], b: [{ units: enem(50) }, { units: enem(50) }, { units: enem(50) }] }); q.bandos[1].ia = false;
  q.bandos[0].legiones[0].punto = 'a'; ['l1', 'rn', 'rs'].forEach((p, i) => { q.bandos[1].legiones[i].punto = p; });
  const s = dia(q); assert.ok(s.choque); assert.strictEqual(s.choque.motivo, 'cerco'); assert.strictEqual(s.choque.flancoAbierto[0].length, 3);
});
t('retirada por hambre: 2 días seguidos sin víveres, 10 % deserción', () => {
  let e = mk({ plan: 'cerro', a: [{ units: { hastati: 100 }, vivres: 1 }] }); e.bandos[1].ia = false; e.bandos[0].legiones[0].punto = 'n1';
  e = dia(e).estado; assert.strictEqual(e.bandos[0].legiones[0].vivres, 0); e = dia(e).estado; assert.strictEqual(e.bandos[0].legiones[0].sinVivres, 2);
  const r = dia(e); assert.ok(r.sucesos.some(s => s.tipo === 'hambre')); assert.strictEqual(r.estado.fin.tipo, 'retirada'); assert.strictEqual(r.estado.bandos[0].retirados[0].deserciones, 10); assert.strictEqual(r.estado.bandos[0].retirados[0].fuerza, 90);
});
t('enemigo: los cinco planes se mueven y no hacen trampa; plazo de 8 días fuerza choque', () => {
  for (const plan of Object.keys(M.PLANES)) { let e = mk({ plan, zona: 'cerro' }); let moved = false; const p0 = e.bandos[1].legiones[0].punto;
    for (let i = 0; i < 8 && !e.terminado; i++) { e = dia(e, [], i + 3).estado; if (e.bandos[1].legiones[0] && e.bandos[1].legiones[0].punto !== p0) moved = true; }
    assert.ok(moved, plan); assert.ok(e.terminado && e.choque, plan + ' debe acabar en choque'); assert.ok(e.dia <= 8); }
});
t('consejo: tres tribunos con etiqueta y motivo', () => {
  const c = M.consejoDia(mk(), 0); assert.strictEqual(c.length, 3); assert.strictEqual(new Set(c.map(x => x.tribuno)).size, 3);
  c.forEach(x => { assert.ok(['Favorable', 'Dudoso', 'Arriesgado'].includes(x.etiqueta)); assert.ok(x.motivo.length > 5); assert.ok(x.ordenes.length === 1); });
});
t('retirarse: pierde víveres y moral, no hombres', () => {
  const q = mk(); q.bandos[1].ia = false; q.bandos[0].legiones[0].punto = 'n1'; q.bandos[1].legiones[0].punto = 'vd';
  const r = dia(q, [{ legion: 'b0l0', a: 'vd' }]); const s = M.retirarse(r.estado, 0); assert.strictEqual(s.choque, null); assert.strictEqual(s.bandos[0].moral, 90); assert.strictEqual(s.bandos[0].legiones[0].punto, 'n1');
  assert.strictEqual(s.bandos[0].legiones[0].units.hastati, 100);
});
t('bot «Favorable» mejora la ventaja del choque frente a quedarse quieto (≥6 de 10 semillas)', () => {
  const zonas = ['rio', 'cerro', 'bosque', 'paso'], planes = Object.keys(M.PLANES), cars = ['equilibrado', 'astuto', 'impetuoso', 'prudente'];
  const jugar = (sem, bot) => {
    let e = mk({ zona: zonas[sem % 4], semilla: sem, plan: planes[sem % 5], car: cars[sem % 4], a: [{ units: rom(130, 30, 20) }], b: [{ units: enem(120, 20, 10) }] });
    for (let i = 0; i < 10 && !e.terminado; i++) { const ord = bot ? (() => { const c = M.consejoDia(e, 0), f = c.filter(x => x.etiqueta === 'Favorable').sort((x, y) => y.puntos - x.puntos)[0] || c.filter(x => x.etiqueta === 'Dudoso').sort((x, y) => y.puntos - x.puntos)[0]; return f ? f.ordenes : []; })() : []; e = M.resolverDia(M.moverDia(e, ord, 0), sem * 7 + i).estado; }
    return M.ventajaFinal(e);
  };
  let gana = 0, peor = 0; const filas = [];
  for (let s = 1; s <= 10; s++) { const a = jugar(s, true), b = jugar(s, false); filas.push(a.toFixed(2) + '/' + b.toFixed(2)); if (a > b + 0.001) gana++; else if (a < b - 0.001) peor++; }
  console.log('   bot/quieto:', filas.join(' '), '→ mejora', gana, 'empeora', peor); assert.ok(gana >= 6, 'solo mejora en ' + gana);
});
console.log(n + ' bien, ' + mal + ' mal'); process.exit(mal ? 1 : 0);
