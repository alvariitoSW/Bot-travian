// Prueba de js/caminos.js (CE10). Se ejecuta con: node test/caminos.test.mjs
import assert from 'node:assert';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const CAM = require('../js/caminos.js');
let n = 0;
const t = (nombre, f) => { f(); n++; };

const buena = (o) => Object.assign({ cartago: false, plazas: 0, denarios: 0, renta: 0, ciudades: 1, rutas: 0, acuerdos: 0, cargo: 'ninguno', favorSenado: 0, bandos: [], planesBien: 0, barrios: { cubiertos: 0, total: 5 }, nivelUrbe: 1 }, o || {});
const armasOk = { cartago: true, plazas: 8 };
const comercioOk = { renta: CAM.CIFRAS.comercio.rentaPorCiudad, rutas: CAM.CIFRAS.comercio.rutas, acuerdos: CAM.CIFRAS.comercio.acuerdos };   // CE12: sigue a las cifras
const politicaOk = { cargo: 'princeps', bandos: [{ id: 'a', humor: 70, escanos: 10 }], planesBien: CAM.CIFRAS.politica.planesBien };   // CE12: sigue a las cifras
const ciudadOk = { barrios: { cubiertos: 5, total: 5 }, nivelUrbe: 4 };
const junta = (...fs) => buena(Object.assign({}, ...fs));

t('necesarios', () => { assert.strictEqual(CAM.necesarios(4), 3); assert.strictEqual(CAM.necesarios(5), 4); assert.strictEqual(CAM.necesarios(), 3); });
t('foto con estado falso', () => {
  const s = { t: 12.5, cities: { carthago: { owner: 'roma' }, roma: { owner: 'roma', barrio: 4 }, capua: { owner: 'roma' } }, res: { denarios: 100 }, alm: { denarios: 50 },
    rutas: [1], mercado: { rutas: [1, 2], contratos: [{ id: 'tratado', hasta: 20 }, { id: 'tratado', hasta: 5 }] }, dip: { x: { estado: 'alianza' }, y: { estado: 'guerra' } },
    favor: { senado: 85 }, senado: { humor: { a: 60, b: 20 }, escanos: { a: 5, b: 5 } }, planSenado: { historial: [{ juicio: 'bien' }, { juicio: 'mal' }] } };
  const f = CAM.foto(s, null);
  assert.strictEqual(f.cartago, true); assert.strictEqual(f.denarios, 150); assert.strictEqual(f.rutas, 2); assert.strictEqual(f.acuerdos, 2);
  assert.strictEqual(f.cargo, 'princeps'); assert.strictEqual(f.bandos.length, 2); assert.strictEqual(f.planesBien, 1); assert.strictEqual(f.nivelUrbe, 4);
  assert.deepStrictEqual(f.barrios, { cubiertos: 1, total: 1 });
});
t('foto con estado vacío', () => { assert.doesNotThrow(() => CAM.foto({})); assert.doesNotThrow(() => CAM.foto(null)); assert.strictEqual(CAM.foto({}).cargo, 'ninguno'); });
t('foto con barrioInfo', () => {
  const G = { barrioInfo: () => ({ barrios: [{ falta: '', nivel: 2, objetivo: 2 }, { falta: 'agua', nivel: 1, objetivo: 2 }], falta: [] }) };
  assert.deepStrictEqual(CAM.foto({ cities: { roma: {} } }, G).barrios, { cubiertos: 1, total: 2 });
});
t('evaluar vacío', () => { const e = CAM.evaluar({}); assert.strictEqual(e.cumplen, 0); e.caminos.forEach((c) => assert.strictEqual(c.avance, 0)); });
t('evaluar no muta', () => { const f = buena(); const j = JSON.stringify(f); CAM.evaluar(f); assert.strictEqual(JSON.stringify(f), j); });
t('Cartago sola no gana', () => {
  const s = {}; let r;
  for (let m = 1; m <= 30; m++) r = CAM.paso(s, buena({ cartago: true, plazas: 8 }), m);
  assert.strictEqual(s.caminos.victoria, null); assert.strictEqual(s.caminos.estado.armas.logrado, true);
});
t('comercio exige sus meses seguidos', () => {
  const N = CAM.CIFRAS.sostener.comercio, s = {};   // CE12: la cifra la fija el equilibrio
  for (let m = 1; m < N; m++) CAM.paso(s, buena(comercioOk), m);
  assert.strictEqual(s.caminos.estado.comercio.logrado, false);
  const r = CAM.paso(s, buena(comercioOk), N);
  assert.strictEqual(s.caminos.estado.comercio.logrado, true); assert.deepStrictEqual(r.logra, ['comercio']);
  const s2 = {};
  for (let m = 1; m < N; m++) CAM.paso(s2, buena(comercioOk), m);
  CAM.paso(s2, buena(), N);
  for (let m = N + 1; m < 2 * N; m++) CAM.paso(s2, buena(comercioOk), m);
  assert.strictEqual(s2.caminos.estado.comercio.logrado, false);
});
t('se pierde a los 3 meses', () => {
  const s = {}; CAM.paso(s, buena(armasOk), 1);
  let r = CAM.paso(s, buena(), 2); assert.strictEqual(r.efectos[0].tono, 'warn');
  CAM.paso(s, buena(), 3); assert.strictEqual(s.caminos.estado.armas.logrado, true);
  r = CAM.paso(s, buena(), 4);
  assert.strictEqual(s.caminos.estado.armas.logrado, false); assert.deepStrictEqual(r.pierde, ['armas']); assert.strictEqual(s.caminos.estado.armas.perdidoEn, 4);
  assert.strictEqual(r.efectos[0].tono, 'bad');
});
t('recuperar dentro de la gracia', () => {
  const s = {}; CAM.paso(s, buena(armasOk), 1); CAM.paso(s, buena(), 2); CAM.paso(s, buena(), 3); CAM.paso(s, buena(armasOk), 4); CAM.paso(s, buena(), 5); CAM.paso(s, buena(), 6);
  assert.strictEqual(s.caminos.estado.armas.logrado, true);
});
t('3 de 4 da victoria y se mantiene', () => {
  const s = {}; const f = junta(armasOk, ciudadOk, politicaOk, comercioOk);
  const sin = junta(armasOk, ciudadOk, politicaOk);
  let gana = false;
  const SO = Math.max(CAM.CIFRAS.sostener.armas, CAM.CIFRAS.sostener.ciudad, CAM.CIFRAS.sostener.politica);   // CE12
  for (let m = 1; m <= SO; m++) { const r = CAM.paso(s, sin, m); gana = gana || r.gana; }
  assert.strictEqual(gana, true); assert.strictEqual(s.caminos.victoria.caminos.length, 3);
  const v = CAM.vista(s, sin); assert.strictEqual(v.nuevaVictoria, true); assert.strictEqual(v.logrados, 3);
  for (let m = SO + 1; m <= SO + 6; m++) CAM.paso(s, buena(), m);
  assert.strictEqual(s.caminos.estado.armas.logrado, false);
  assert.ok(s.caminos.victoria); assert.strictEqual(CAM.vista(s, buena()).logrados, 0);
  void f;
});
t('marcarVista', () => {
  const s = {}; for (let m = 1; m <= 12; m++) CAM.paso(s, junta(armasOk, ciudadOk, politicaOk), m);
  assert.strictEqual(CAM.vista(s, {}).nuevaVictoria, true); CAM.marcarVista(s); assert.strictEqual(CAM.vista(s, {}).nuevaVictoria, false);
});
t('migrar con basura', () => {
  [null, undefined, 5, [], 'x', { caminos: 7 }, { caminos: [] }, { caminos: { estado: [], avisos: 3, victoria: 'x' } }, { caminos: { estado: { armas: 4, comercio: { sost: 'a' } } } }].forEach((b) => {
    assert.doesNotThrow(() => CAM.migrar(b));
    if (b && typeof b === 'object' && !Array.isArray(b)) { assert.strictEqual(b.caminos.v, 1); assert.strictEqual(b.caminos.estado.armas.sost, 0); assert.strictEqual(b.caminos.estado.comercio.sost, 0); assert.ok(Array.isArray(b.caminos.avisos)); }
  });
  const s = {}; CAM.migrar(s); const j = JSON.stringify(s); CAM.migrar(s); assert.strictEqual(JSON.stringify(s), j);
  assert.doesNotThrow(() => CAM.paso(null, {}, 1)); assert.doesNotThrow(() => CAM.vista(null, null));
});
t('determinismo y nunca s.over', () => {
  const corre = () => { const s = {}; const r = []; for (let m = 1; m <= 40; m++) r.push(CAM.paso(s, m % 7 ? junta(armasOk, ciudadOk, politicaOk) : buena(), m)); return JSON.stringify([s, r]); };
  assert.strictEqual(corre(), corre());
  const s = {}; for (let m = 1; m <= 20; m++) CAM.paso(s, junta(armasOk, ciudadOk, politicaOk, comercioOk), m);
  assert.strictEqual('over' in s, false);
});
t('avisos solo 8', () => { const s = {}; for (let m = 1; m <= 40; m++) CAM.paso(s, m % 4 === 0 ? buena(armasOk) : buena(), m); assert.ok(s.caminos.avisos.length <= 8); });
t('vista con textos', () => {
  const v = CAM.vista({}, buena({ plazas: 5, renta: 140, cartago: true }));
  assert.strictEqual(v.total, 4); assert.strictEqual(v.necesarios, 3);
  const a = v.caminos[0].hitos, c = v.caminos[1].hitos;
  assert.strictEqual(a[0].texto, 'Hecho'); assert.strictEqual(a[1].texto, '5 de ' + CAM.CIFRAS.armas.plazas); assert.strictEqual(c[0].texto, '140 de ' + CAM.CIFRAS.comercio.rentaPorCiudad.toLocaleString('de-DE') + ' denarios al año');
  v.caminos.forEach((k) => k.hitos.forEach((h) => assert.ok(typeof h.texto === 'string' && h.texto.length)));
});
t('bandos hostiles', () => {
  const f = buena({ bandos: [{ id: 'a', humor: 90, escanos: 9 }, { id: 'b', humor: 20, escanos: 1 }] });
  const h = CAM.evaluar(f).caminos[2].hitos[1]; assert.strictEqual(h.ok, false); assert.ok(h.v <= 0.99);
});
t('fuentes', () => { assert.ok(CAM.FUENTES.every((x) => x.tema && x.cita && ['histórico', 'licencia de juego'].includes(x.dictamen))); });
t('comercio: la renta es la neta del año anterior y el umbral crece con las ciudades', () => {
  const R = CAM.CIFRAS.comercio.rentaPorCiudad, libro = { v: 1, anio: -270, c: { roma: { denarios: { entra: { impuestos: R * 3, comercio: 50 }, sale: { obras: R * 2 } } }, _imperio: { denarios: { entra: {}, sale: { legiones: 10 } } } } };
  const s = { t: 30, cities: { roma: { owner: 'roma', b: {}, barrio: 2 }, capua: { owner: 'roma', b: {}, barrio: 1 } }, esteAno: { v: 1, actual: { v: 1, anio: -269, c: {} }, anterior: libro } };
  const f = CAM.foto(s, null);
  assert.strictEqual(f.renta, R * 3 + 50 - R * 2 - 10); assert.strictEqual(f.ciudades, 2);
  const h = CAM.evaluar(f).caminos[1].hitos[0];
  assert.strictEqual(h.meta, R * 2); assert.strictEqual(h.ok, f.renta >= R * 2);
  assert.strictEqual(CAM.foto({ cities: {} }, null).renta, 0);
  assert.strictEqual(CAM.evaluar(Object.assign({}, f, { renta: R * 2 - 1 })).caminos[1].hitos[0].ok, false);
});
console.log('caminos: ' + n + ' pruebas OK');

// Revisor CE10: barrioInfo que lanza, bando sin humor, rutas sin doble cuenta, deuda
{
  const Gr = { barrioInfo() { throw new Error('rota'); } };
  const f = CAM.foto({ cities: { roma: { b: {}, barrio: 2 } }, senado: { bandos: ['a', 'b'], humor: { b: 70 }, escanos: { a: 5, b: 5 } }, rutas: [1, 2], mercado: { rutas: [1, 2] }, res: { denarios: -5000 } }, Gr);
  assert.strictEqual(f.rutas, 2); assert.strictEqual(f.bandos.length, 1); assert.strictEqual(f.nivelUrbe, 2);
  const ev = CAM.evaluar(f); assert.ok(ev.caminos.every((c) => c.avance >= 0 && c.hitos.every((h) => h.avance >= 0)));
  const s = { caminos: { victoria: { mes: NaN, caminos: [] }, avisos: [{ texto: 3 }] } }; CAM.migrar(s);
  assert.strictEqual(s.caminos.victoria, null); assert.strictEqual(s.caminos.avisos.length, 0);
  console.log('caminos: revisor OK');
}

// CE12: en la partida corta (sin Cartago en el mapa) cuenta la capital rival y bastan menos plazas
{
  const D = require('../js/data.js');
  const s = { modo: { id: 'corta' }, cities: { roma: { owner: 'roma' }, tarentum: { owner: 'roma' } } };
  const f = CAM.foto(s, null);
  assert.strictEqual(f.corta, true); assert.strictEqual(f.cartago, true);
  const a = CAM.evaluar(Object.assign({}, f, { plazas: CAM.CIFRAS.armas.plazasCorta })).caminos[0];
  assert.strictEqual(a.cumple, true); assert.strictEqual(a.hitos[0].n, D.CITIES.tarentum.n + ' tomada');
  const larga = CAM.foto({ cities: { roma: { owner: 'roma' }, carthago: { owner: 'cartago' }, tarentum: { owner: 'roma' } } }, null);
  assert.strictEqual(larga.corta, false); assert.strictEqual(larga.cartago, false);
  console.log('caminos: CE12 corta OK');
}
