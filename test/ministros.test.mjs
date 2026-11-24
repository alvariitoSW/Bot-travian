// AQVILA — CD3a: los ocho ministros. node test/ministros.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); const M = require('../js/ministros.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const nueva = () => { const s = G.newGame('Test', 'mediterraneo', {}); G.onEvent = null; return s; };
const J = x => JSON.stringify(x);

t('ocho ministros con bando y cargo', () => {
  assert.strictEqual(M.DATOS.length, 8); assert.strictEqual(M.ORDEN.length, 8);
  const cargos = { ejercito: 'Legado', ciencia: 'Sabio', infra: 'Censor', hacienda: 'Cuestor', agricultura: 'Edil del grano', mineria: 'Publicano de minas', artesania: 'Edil del mercado', culto: 'Pontífice' };
  const bandos = { ejercito: 'mil', ciencia: null, infra: 'pue', hacienda: 'mer', agricultura: 'ter', mineria: 'pro', artesania: 'ita', culto: 'sac' };
  for (const f of M.DATOS) { assert.ok(f.bando === null || D.BANDOS[f.bando], f.id); assert.strictEqual(f.cargo, cargos[f.id]); assert.strictEqual(f.bando, bandos[f.id]); assert.ok(f.nota.startsWith('Licencia de juego')); }
});
t('migrar crea el estado y es idempotente', () => {
  const s = nueva(); M.migrar(s); const a = J(s.ministros); M.migrar(s); assert.strictEqual(J(s.ministros), a);
  assert.ok(s.ministros.v === 1 && 'encargos' in s.ministros && 'actos' in s.ministros);
});
t('migrar repara una partida vieja sin lo suyo', () => {
  const s = nueva(); delete s.ministros; M.migrar(s); assert.strictEqual(Object.keys(s.ministros.encargos).length, 8);
  s.ministros = { encargos: { culto: { id: 'x' } }, hechos: { culto: 3 } }; M.migrar(s);
  assert.strictEqual(s.ministros.encargos.culto.id, 'x'); assert.strictEqual(s.ministros.hechos.culto, 3); assert.strictEqual(s.ministros.fallos.ejercito, 0);
});
t('topeForo: foro 1 no deja herrería 2; foro siempre; más de 5 no', () => {
  const c = { b: { foro: 1 } };
  assert.strictEqual(M.topeForo(c, 'herreria', 2), 'Sube antes el Foro'); assert.strictEqual(M.topeForo(c, 'herreria', 1), '');
  assert.strictEqual(M.topeForo(c, 'foro', 2), ''); assert.strictEqual(M.topeForo(c, 'foro', 6), 'Ya está al máximo');
  assert.strictEqual(M.topeForo({ b: {} }, 'cuartel', 2), 'Sube antes el Foro');
});
t('validar rechaza ciudad ajena', () => {
  const s = nueva(); const aj = Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma');
  assert.ok(M.validar(s, { mid: 'ejercito', tipo: 'nivel', ciudad: aj, b: 'cuartel', objetivo: 1 }));
});
t('validar rechaza nivel sobre el Foro', () => {
  const s = nueva(); s.cities.roma.b.foro = 1;
  assert.strictEqual(M.validar(s, { mid: 'ejercito', tipo: 'nivel', ciudad: 'roma', b: 'herreria', objetivo: 2 }), 'Sube antes el Foro');
});
t('validar rechaza tipo no admitido, edificio inexistente y saber hecho', () => {
  const s = nueva();
  assert.ok(M.validar(s, { mid: 'ciencia', tipo: 'nivel', ciudad: 'roma', b: 'escuela', objetivo: 1 }));
  assert.ok(M.validar(s, { mid: 'infra', tipo: 'nivel', ciudad: 'roma', b: 'termas', objetivo: 1 }));
  assert.ok(M.validar(s, { mid: 'culto', tipo: 'acto', acto: 'ruta', objetivo: 1 }));
  const id = Object.keys(D.INVEST)[0]; s.inv.hechas[id] = true; assert.ok(M.validar(s, { mid: 'ciencia', tipo: 'saber', saber: id }));
  assert.ok(M.validar(s, { mid: 'ejercito', tipo: 'tropas', ciudad: 'roma', u: 'noexiste', n: 5 }));
});
t('cada ministro propone algo válido o null, sin pasar el tope del Foro', () => {
  const s = nueva();
  for (const mid of M.ORDEN) {
    const p = M.proponer(s, mid, 0);
    if (p === null) continue;
    assert.strictEqual(M.validar(s, p), '', mid + ': ' + J(p)); assert.ok(p.texto && p.id && p.plazo === (mid === 'ciencia' ? 24 : 12), mid);
    if (p.tipo === 'nivel') assert.strictEqual(M.topeForo(s.cities[p.ciudad], p.b, p.objetivo), '', mid);
  }
  assert.ok(M.proponer(s, 'ejercito', 0), 'el ejército propone'); assert.ok(M.proponer(s, 'culto', 0), 'el culto propone');
});
t('reglas concretas: ejército, infra, hacienda, agricultura', () => {
  const s = nueva();
  assert.strictEqual(M.proponer(s, 'ejercito', 0).b, 'herreria');
  for (const id in s.cities) if (s.cities[id].owner === 'roma') s.cities[id].b.herreria = 1; s.cities.capua.units = { milicia: 10 }; const e = M.proponer(s, 'ejercito', 0); assert.strictEqual(e.tipo, 'tropas'); assert.strictEqual(e.u, 'hastati'); assert.strictEqual(e.objetivo, e.base + 100);
  const i = M.proponer(s, 'infra', 0); assert.strictEqual(i.tipo, 'reserva'); assert.strictEqual(i.objetivo, Math.ceil(s.res.materiales) + 300);
  s.res.denarios = 50; const h = M.proponer(s, 'hacienda', 0); assert.strictEqual(h.nivel, 'alto');
  s.res.grano = 1; const a = M.proponer(s, 'agricultura', 0, { consumoMes: () => 100 }); assert.strictEqual(a.tipo, 'reserva'); assert.strictEqual(a.objetivo, 900);
});
t('propuestas guarda una por ministro libre y aceptar la convierte en encargo', () => {
  const s = nueva(); const p = M.propuestas(s, 0); assert.ok(p.ejercito);
  const r = M.aceptar(s, 'ejercito', 0); assert.ok(r.ok, r.motivo);
  assert.ok(s.ministros.encargos.ejercito && s.ministros.propuestas.ejercito === null);
  assert.strictEqual(M.aceptar(s, 'ejercito', 0).ok, false);
  M.propuestas(s, 0); assert.strictEqual(s.ministros.propuestas.ejercito, null);
});
t('cancelar quita el encargo sin castigo', () => {
  const s = nueva(); M.propuestas(s, 0); M.aceptar(s, 'culto', 0); M.cancelar(s, 'culto');
  assert.strictEqual(s.ministros.encargos.culto, null); assert.strictEqual(s.ministros.fallos.culto, 0);
});
t('órdenes de nivel: sube, no repite si hay obra, pide el Foro si hace falta', () => {
  const s = nueva(); M.migrar(s); s.cities.roma.b.foro = 3;
  assert.ok(M.encargar(s, 'ejercito', { tipo: 'nivel', ciudad: 'roma', b: 'cuartel', objetivo: 3 }, 0).ok);
  let o = M.ordenes(s, 0); assert.strictEqual(o.length, 1); assert.deepStrictEqual([o[0].tipo, o[0].b, o[0].ciudad], ['subir', 'cuartel', 'roma']);
  s.cities.roma.obras = [{ b: 'cuartel' }]; assert.strictEqual(M.ordenes(s, 0).length, 0);
  s.cities.roma.obras = []; s.cities.roma.b.foro = 1; s.cities.roma.b.cuartel = 1;
  o = M.ordenes(s, 0); assert.strictEqual(o[0].b, 'foro');
});
t('órdenes de tropas descuentan lo pedido', () => {
  const s = nueva(); s.cities.roma.b.herreria = 1;
  assert.ok(M.encargar(s, 'ejercito', { tipo: 'tropas', ciudad: 'roma', u: 'hastati', n: 50 }, 0).ok);
  const o = M.ordenes(s, 0); assert.deepStrictEqual([o[0].tipo, o[0].u, o[0].n], ['reclutar', 'hastati', 50]);
  M.anotar(s, o[0], true); assert.strictEqual(s.ministros.encargos.ejercito.pedido, 50); assert.strictEqual(M.ordenes(s, 0).length, 0);
});
t('órdenes de impuesto, saber y fiesta', () => {
  const s = nueva();
  assert.ok(M.encargar(s, 'hacienda', { tipo: 'impuesto', ciudad: 'roma', nivel: 'alto' }, 0).ok);
  assert.deepStrictEqual(M.ordenes(s, 0)[0], { mid: 'hacienda', tipo: 'impuesto', ciudad: 'roma', nivel: 'alto' });
  const id = M.proponer(s, 'ciencia', 0).saber; assert.ok(M.encargar(s, 'ciencia', { tipo: 'saber', saber: id }, 0).ok);
  assert.strictEqual(M.ordenes(s, 0).find(x => x.tipo === 'investigar').saber, id);
  s.inv.cola = { id: 'x' }; assert.ok(!M.ordenes(s, 0).find(x => x.tipo === 'investigar'));
  assert.ok(M.encargar(s, 'culto', { tipo: 'acto', ciudad: 'roma', acto: 'juegos', n: 1 }, 0).ok);
  assert.strictEqual(M.ordenes(s, 0).find(x => x.tipo === 'fiesta').fiesta, 'juegos');
});
t('anotar guarda el aviso si falla y lo borra si sale bien', () => {
  const s = nueva(); s.cities.roma.b.herreria = 1;
  M.encargar(s, 'ejercito', { tipo: 'tropas', ciudad: 'roma', u: 'hastati', n: 10 }, 0);
  const o = M.ordenes(s, 0)[0]; M.anotar(s, o, false, 'Faltan recursos'); assert.strictEqual(s.ministros.avisos.ejercito, 'Faltan recursos');
  assert.strictEqual(s.ministros.encargos.ejercito.pedido || 0, 0); M.anotar(s, o, true); assert.ok(!s.ministros.avisos.ejercito);
});
t('revisar cumple: +4 al bando, -1 a rivales y nueva propuesta', () => {
  const s = nueva(); s.cities.roma.b.foro = 3;
  M.encargar(s, 'ejercito', { tipo: 'nivel', ciudad: 'roma', b: 'cuartel', objetivo: 2 }, 0);
  s.cities.roma.b.cuartel = 2; const r = M.revisar(s, 1);
  assert.deepStrictEqual(r.cumplidos, ['ejercito']); assert.strictEqual(s.ministros.hechos.ejercito, 1); assert.strictEqual(s.ministros.encargos.ejercito, null);
  const h = r.efectos.filter(x => x.tipo === 'humor');
  assert.ok(h.find(x => x.bando === 'mil' && x.d === 4 && x.activo)); assert.ok(h.find(x => x.bando === 'pue' && x.d === -1 && !x.activo));
  assert.ok(r.efectos.find(x => x.tipo === 'log' && x.tono === 'good' && x.texto.includes('Escipiones')));
  assert.ok(s.ministros.propuestas.ejercito, 'deja propuesta');
});
t('revisar falla al pasar el plazo con -3', () => {
  const s = nueva(); M.encargar(s, 'culto', { tipo: 'acto', ciudad: 'roma', acto: 'juegos', n: 1 }, 0);
  assert.strictEqual(M.revisar(s, 12).fallidos.length, 0);
  const r = M.revisar(s, 13); assert.deepStrictEqual(r.fallidos, ['culto']); assert.strictEqual(s.ministros.fallos.culto, 1);
  assert.ok(r.efectos.find(x => x.tipo === 'humor' && x.bando === 'sac' && x.d === -3)); assert.ok(r.efectos.find(x => x.tono === 'bad'));
});
t('un acto cuenta para el encargo de acto', () => {
  const s = nueva(); M.encargar(s, 'artesania', { tipo: 'acto', acto: 'ruta', n: 2 }, 0);
  const e = s.ministros.encargos.artesania; M.acto(s, 'ruta'); assert.strictEqual(M.progreso(s, e), 0.5);
  assert.strictEqual(M.revisar(s, 1).cumplidos.length, 0); M.acto(s, 'ruta'); assert.deepStrictEqual(M.revisar(s, 1).cumplidos, ['artesania']);
});
t('estado devuelve 8 con familia, encargo y propuesta', () => {
  const s = nueva(); M.propuestas(s, 0); M.aceptar(s, 'culto', 0);
  const st = M.estado(s, 0); assert.strictEqual(st.length, 8);
  assert.strictEqual(st[0].familia, 'Escipiones'); assert.strictEqual(st.find(x => x.id === 'agricultura').familia, 'Fabios');
  const c = st.find(x => x.id === 'culto'); assert.ok(c.encargo && c.encargo.texto && c.encargo.plazoEst === 4 && c.propuesta === null);
  assert.ok(st.find(x => x.id === 'ejercito').propuesta.texto);
});
t('costeTropas y pagaTropa', () => {
  const k = M.costeTropas(D, 'hastati', 10); assert.deepStrictEqual(k, { hombres: 10, hierro: 200, denarios: 120, grano: 150 });
  assert.deepStrictEqual(M.pagaTropa(D, 'hastati'), { grano: 0.45, denarios: 0.16 });
});
t('es determinista', () => {
  const a = nueva(), b = nueva();
  for (const s of [a, b]) { M.propuestas(s, 0); M.aceptar(s, 'ejercito', 0); }
  assert.strictEqual(J(a.ministros), J(b.ministros)); assert.strictEqual(J(M.ordenes(a, 0)), J(M.ordenes(b, 0)));
});
t('no escribe en s.res ni en s.senado', () => {
  const s = nueva(); const antes = J([s.res, s.senado]);
  M.propuestas(s, 0); M.aceptar(s, 'ejercito', 0); M.aceptar(s, 'culto', 0); M.ordenes(s, 0); M.acto(s, 'juegos'); M.revisar(s, 20); M.estado(s, 20);
  assert.strictEqual(J([s.res, s.senado]), antes);
});
t('remedio: el templo se encarga al Pontífice; la fuente aún no existe', () => {
  const s = nueva(); assert.ok(D.BUILD.templo); s.cities.roma.b.foro = 3;
  const cid = Object.keys(s.cities).filter(i => s.cities[i].owner === 'roma').sort((a, b) => s.cities[b].pop - s.cities[a].pop)[0];
  const r = M.remedio(s, { necesidad: 'culto', servicio: 'templo', ministro: 'culto', casas: 10, ciudad: 'roma' }, 0);
  assert.ok(r.ok, r.motivo); const e = s.ministros.encargos.culto; assert.deepStrictEqual([e.tipo, e.b, e.ciudad, e.objetivo], ['nivel', 'templo', 'roma', 1]);
  assert.ok(cid);
  const f = M.remedio(s, { necesidad: 'agua', servicio: 'fuente', ministro: 'infra', casas: 10 }, 0);
  assert.deepStrictEqual(f, { ok: false, motivo: 'Ese servicio aún no se puede construir' });
  assert.strictEqual(M.remedio(s, { servicio: 'templo', ministro: 'nadie' }, 0).ok, false);
});
t('ordenes de saber con s.inv ausente no revienta', () => {
  const s = nueva(); const id = M.proponer(s, 'ciencia', 0).saber; M.encargar(s, 'ciencia', { tipo: 'saber', saber: id }, 0);
  const inv = s.inv; delete s.inv; assert.doesNotThrow(() => M.ordenes(s, 0)); s.inv = inv;
});
t('validar rechaza encargos que nacen cumplidos', () => {
  const s = nueva(); s.cities.roma.imp = 'alto';
  assert.strictEqual(M.validar(s, { mid: 'hacienda', tipo: 'impuesto', ciudad: 'roma', nivel: 'alto' }), 'Ya tiene ese impuesto');
  assert.ok(M.validar(s, { mid: 'hacienda', tipo: 'reserva', recurso: 'grano', objetivo: Math.floor(s.res.grano) }));
  assert.ok(M.validar(s, { mid: 'ejercito', tipo: 'nivel', ciudad: 'roma', b: 'cuartel', objetivo: 1 }));
  assert.ok(!M.encargar(s, 'hacienda', { tipo: 'impuesto', ciudad: 'roma', nivel: 'alto' }, 0).ok);
  assert.ok(!M.encargar(s, 'hacienda', { tipo: 'reserva', recurso: 'denarios', objetivo: 1 }, 0).ok);
  assert.ok(M.encargar(s, 'hacienda', { tipo: 'reserva', recurso: 'denarios', objetivo: Math.ceil(s.res.denarios) + 50 }, 0).ok);
});
t('ciudad perdida: sin órdenes, fallo sin castigo y contado aparte', () => {
  const s = nueva(); M.encargar(s, 'hacienda', { tipo: 'impuesto', ciudad: 'roma', nivel: 'alto' }, 0);
  s.cities.roma.owner = 'cartago'; assert.strictEqual(M.ordenes(s, 0).length, 0);
  const r = M.revisar(s, 1); assert.deepStrictEqual(r.perdidos, ['hacienda']); assert.ok(!r.efectos.find(x => x.tipo === 'humor'));
  assert.ok(r.efectos.find(x => x.tipo === 'log' && x.tono === 'bad' && x.texto === 'El encargo se pierde con la ciudad'));
  assert.strictEqual(s.ministros.fallos.hacienda, 0); assert.strictEqual(s.ministros.perdidos.hacienda, 1); assert.strictEqual(s.ministros.encargos.hacienda, null);
});
t('acto sin número se rechaza y el texto nunca sale NaN', () => {
  const s = nueva(); assert.ok(M.validar(s, { mid: 'culto', tipo: 'acto', acto: 'juegos' }));
  assert.ok(!M.encargar(s, 'culto', { tipo: 'acto', ciudad: 'roma', acto: 'juegos' }, 0).ok);
  for (const mid of M.ORDEN) { const p = M.proponer(s, mid, 0); if (p) assert.ok(!/NaN|undefined/.test(p.texto), p.texto); }
});
t('anotar: la cantidad realmente reclutada manda', () => {
  const s = nueva(); s.cities.roma.b.herreria = 1; M.encargar(s, 'ejercito', { tipo: 'tropas', ciudad: 'roma', u: 'hastati', n: 50 }, 0);
  const o = M.ordenes(s, 0)[0]; M.anotar(s, o, true, '', 20); assert.strictEqual(s.ministros.encargos.ejercito.pedido, 20);
  assert.strictEqual(M.ordenes(s, 0)[0].n, 30);
});
t('bloqueado solo por el Foro: propone subir el Foro (partida real)', () => {
  const s = nueva();
  for (const id in s.cities) if (s.cities[id].owner === 'roma') { const c = s.cities[id]; c.b.cuartel = c.b.herreria = c.b.foro || 1; }
  s.cities.capua.units = { milicia: 300 };
  const p = M.proponer(s, 'ejercito', 0); assert.ok(p, 'propone'); assert.strictEqual(p.b, 'foro'); assert.ok(p.libre);
  assert.ok(p.texto.startsWith('Sube antes el Foro para poder'), p.texto); assert.strictEqual(M.validar(s, p), '');
  const c = s.cities[p.ciudad]; assert.strictEqual(p.objetivo, c.b.foro + 1);
  for (const id in s.cities) if (s.cities[id].owner === 'roma') s.cities[id].b.foro = D.MAX_LVL;
  const q = M.proponer(s, 'ejercito', 0); assert.ok(!q || q.b !== 'foro');
});
t('fiesta: reposo contado desde la celebración', () => {
  const s = nueva(); M.encargar(s, 'culto', { tipo: 'acto', ciudad: 'roma', acto: 'juegos', n: 1 }, 0);
  const F = D.FIESTAS.juegos; s.cities.roma.fiesta.juegos = 10;
  assert.ok(!M.ordenes(s, 10 + F.reposo - 1).find(x => x.tipo === 'fiesta'));
  assert.ok(M.ordenes(s, 10 + F.reposo).find(x => x.tipo === 'fiesta'));
});
t('ciencia sin bando: cumple sin humor y sin romper (usuario, 23/11)', () => {
  const s = G.newGame('Test', 'mediterraneo', {}); G.onEvent = null; s.inv = s.inv || { hechas: {}, edad: 1 };
  const id = Object.keys(D.INVEST).find(k => !s.inv.hechas[k] && D.INVEST[k].edad <= (s.inv.edad || 1));
  assert.ok(M.encargar(s, 'ciencia', { tipo: 'saber', saber: id }, 0).ok); s.inv.hechas[id] = true;
  const r = M.revisar(s, 1); assert.deepStrictEqual(r.cumplidos, ['ciencia']); assert.ok(!r.efectos.some(x => x.tipo === 'humor'));
  assert.strictEqual(M.estado(s, 1).find(x => x.id === 'ciencia').familia, null);
});
console.log(n + ' bien, ' + mal + ' mal');
process.exit(mal ? 1 : 0);
