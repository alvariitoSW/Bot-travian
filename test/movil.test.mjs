// AQVILA — CN18: copia de la partida en archivo, nota de la partida corta, punto de parada y crónica. node test/movil.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const mem = {}; global.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
const nueva = (o) => { const s = G.newGame('Test', 'mediterraneo', o || {}); G.onEvent = null; return s; };

t('exportar da el mismo JSON que se guarda, con ajustes', () => {
  const s = nueva(); G.ponerAjustes({ dif: 'dura' }); const txt = G.exportar(), o = JSON.parse(txt);
  assert.strictEqual(o.v, 1); assert.strictEqual(o.ajustes.dif, 'dura'); assert.ok(o.parada && o.parada.texto, 'lleva el punto de parada');
});
t('importar: lo exportado vuelve igual (ajustes, tiempo y ciudades)', () => {
  const s = nueva(); G.ponerAjustes({ dif: 'dura', suc: { fuego: false } }); s.res.oro = 777; const txt = G.exportar(), t0 = s.t;
  nueva(); G.state.res.oro = 5; const r = G.importar(txt);
  assert.ok(r.ok, r.motivo); assert.strictEqual(G.state.res.oro, 777); assert.strictEqual(G.state.t, t0); assert.strictEqual(G.state.ajustes.dif, 'dura'); assert.strictEqual(G.state.ajustes.suc.fuego, false);
  assert.ok(G.myCities().length >= 1);
});
t('importar rechaza basura sin tocar la partida', () => {
  nueva(); G.state.res.oro = 123; G.save(); const guardado = mem['aqvila-save-v1'];
  for (const txt of ['no es json', '{"v":2}', '{"v":1}', '[]', 'null', JSON.stringify({ v: 1, t: 0, cities: {}, marches: [] })]) { const r = G.importar(txt); assert.ok(!r.ok, 'debió rechazar ' + txt.slice(0, 20)); assert.ok(r.motivo.length > 5); }
  assert.strictEqual(G.state.res.oro, 123); assert.strictEqual(mem['aqvila-save-v1'], guardado, 'el guardado no cambia');
});
t('importar una partida vieja pasa por las migraciones', () => {
  const s = nueva(); const o = JSON.parse(G.exportar()); delete o.ajustes; delete o.parada; delete o.encargos; delete o.hitos;
  const r = G.importar(JSON.stringify(o)); assert.ok(r.ok, r.motivo); assert.strictEqual(G.state.ajustes.dif, 'normal'); assert.strictEqual(G.state.parada, null);
});
t('el punto de parada se guarda y se migra', () => {
  nueva(); G.save(); const p = JSON.parse(mem['aqvila-save-v1']).parada; assert.ok(p && typeof p.texto === 'string' && p.fecha && p.anio);
  G.state.parada = 'roto'; G.migrarParada(G.state); assert.strictEqual(G.state.parada, null);
});
t('nota: de 1 a 10 con cuatro criterios', () => {
  nueva(); const r = G.nota(true); assert.ok(r.nota >= 1 && r.nota <= 10); assert.deepStrictEqual(r.criterios.map(c => c.id), ['ciudad', 'poblacion', 'ejercito', 'anios']);
  for (const c of r.criterios) assert.ok(c.v >= 0 && c.v <= 10 && c.d);
});
t('nota: la dificultad más dura usada cuenta aunque se baje después', () => {
  nueva(); G.ponerAjustes({ dif: 'dura' }); G.ponerAjustes({ dif: 'normal' }); assert.strictEqual(G.nota(true).dif, 'dura');
  nueva({ dificultad: 'tranquila' }); assert.strictEqual(G.nota(true).dif, 'tranquila'); G.ponerAjustes({ dif: 'dura' }); assert.strictEqual(G.nota(true).dif, 'dura');
});
t('nota: Tranquila y sucesos apagados bajan; Dura sube', () => {
  const base = (o) => { const s = nueva(o); s.res.oro = 1e5; for (const id of G.myCities()) { const c = s.cities[id]; c.pop = 900; for (const k of Object.keys(c.b)) c.b[k] = Math.max(c.b[k], 4); } return s; };
  base(); const normal = G.nota(true);
  base({ dificultad: 'tranquila' }); const tr = G.nota(true);
  base(); G.ponerAjustes({ suc: { crecida: false, fuego: false } }); const sin = G.nota(true);
  base(); G.ponerAjustes({ dif: 'dura' }); const du = G.nota(true);
  assert.ok(tr.nota < normal.nota, 'Tranquila baja: ' + tr.nota + ' vs ' + normal.nota); assert.ok(sin.nota < normal.nota && sin.apagados.length === 2, 'sucesos apagados bajan');
  assert.ok(du.nota >= normal.nota, 'Dura no baja'); assert.ok(normal.nota >= 1 && du.nota <= 10);
});
t('nota: una derrota rápida saca menos que una victoria', () => { nueva(); assert.ok(G.nota(false).criterios[3].v < G.nota(true).criterios[3].v + 0.01); });
t('la pantalla final de la partida corta trae la nota', () => {
  const s = nueva({ modo: 'corta', inicio: 'enPie' }); assert.ok(s.modo, 'modo corta'); G.state.t = 3; let fin = null; G.onEvent = (e) => { if (e === 'over') fin = 1; };
  const r = G.resumen(); assert.ok(r); G.state.over = null;
  // fuerza el final por plazo
  G.state.t = (D.START_YEAR - G.hasta() + 2) * 12; try { G.tick(1); } catch (e) { }
  if (G.state.over) assert.ok(G.state.over.resumen.nota && G.state.over.resumen.nota.nota >= 1, 'el resumen final lleva la nota'); else assert.ok(G.nota(false).nota >= 1);
});
t('crónica: texto con nombre, fecha y hitos', () => {
  const s = nueva(); const id = G.myCities()[0]; s.hitos = { [Object.keys(D.HITOS)[0]]: 1 }; const x = G.cronicaTexto(id);
  assert.ok(x.startsWith('CRÓNICA DE ' + D.CITIES[id].n.toUpperCase()), x.slice(0, 40)); assert.ok(/Hitos/.test(x) && x.includes(D.HITOS[Object.keys(D.HITOS)[0]].n)); assert.strictEqual(G.cronicaTexto('noexiste'), '');
});
console.log(mal ? mal + ' fallos' : n + ' comprobaciones'); process.exit(mal ? 1 : 0);
