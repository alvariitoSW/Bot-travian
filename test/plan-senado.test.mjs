// AQVILA — CD4: el Plan del Senado (reglas). node test/plan-senado.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const D = require('../js/data.js'); const G = require('../js/game.js'); const M = require('../js/ministros.js'); const P = require('../js/plan-senado.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const nueva = () => { const s = G.newGame('Test', 'mediterraneo', {}); G.onEvent = null; G.state = s; return s; };
const J = x => JSON.stringify(x);
const pon = (s, ciudad, b, est) => { const r = P.poner(s, { ciudad, b, est }); assert.ok(r.ok, b + ': ' + r.motivo); return r.obra; };
// plan aprobado a mano para probar la ejecución
const aprobado = (s, obras, estaciones, prioridad) => {
  assert.ok(P.nuevo(s, estaciones || 4, prioridad || 'crecer').ok); obras.forEach(o => pon(s, o[0], o[1], o[2]));
  const r = P.votar(s, 0, { si: 30, total: 30, mayoria: 16 }); assert.ok(r.sale, 'el plan debe salir'); return r;
};

t('constantes y prioridades', () => {
  assert.deepStrictEqual([P.MIN_EST, P.MAX_EST, P.POR_EST, P.MAX_OBRAS, P.VOTOS_EST, P.ABANDONO], [4, 8, 3, 16, 3, -3]);
  assert.deepStrictEqual(P.JUICIO, { bien: 0.67, mal: 0.5, premio: 2, castigo: -3 });   // CE12: bien 0,8→0,67
  assert.strictEqual(Object.keys(P.PRIORIDADES).length, 4); assert.strictEqual(P.PRIORIDADES.crecer.bando, 'ter');
});
t('migrar crea el estado y es idempotente', () => {
  const s = nueva(); P.migrar(s); const a = J(s.planSenado); P.migrar(s); assert.strictEqual(J(s.planSenado), a);
  assert.deepStrictEqual([s.planSenado.v, s.planSenado.seq, s.planSenado.borrador, s.planSenado.plan], [1, 0, null, null]);
  assert.deepStrictEqual(s.planSenado.votacion, { est: -1, n: 0, firmas: [] });
});
t('migrar repara sin pisar lo que hay', () => {
  const s = nueva(); s.planSenado = { seq: 5, avisos: 'x', votacion: { n: 2 }, historial: [{ id: 'p1' }] }; P.migrar(s);
  assert.strictEqual(s.planSenado.seq, 5); assert.ok(Array.isArray(s.planSenado.avisos)); assert.strictEqual(s.planSenado.votacion.n, 2);
  assert.strictEqual(s.planSenado.votacion.est, -1); assert.strictEqual(s.planSenado.historial[0].id, 'p1');
});
t('ministroDe: dueño que admite nivel; Foro y escuela los hace el Censor; sin D.BUILD, nadie', () => {
  assert.strictEqual(P.ministroDe('granja'), 'agricultura'); assert.strictEqual(P.ministroDe('cuartel'), 'ejercito');
  assert.strictEqual(P.ministroDe('foro'), 'infra'); assert.strictEqual(P.bandoDe('foro'), 'mer'); assert.strictEqual(P.ministroDe('escuela'), 'infra');
  assert.strictEqual(P.ministroDe('noexiste'), null); assert.strictEqual(P.ministroDe('fuente'), null);
});
t('catálogo: ministro, siguiente nivel y tope del Foro', () => {
  const s = nueva(); const cat = P.catalogo(s);
  assert.ok(cat.length > 0); assert.ok(cat.every(x => x.mid && D.BUILD[x.b] && x.nivel <= D.MAX_LVL && x.texto && x.coste));
  assert.ok(cat.find(x => x.ciudad === 'roma' && x.b === 'foro' && x.nivel === 3 && x.mid === 'infra'));
  assert.ok(!cat.find(x => x.ciudad === 'roma' && x.b === 'granja'), 'granja 4 pide Foro 4 (hay 2)');
  const g = cat.find(x => x.b === 'cuartel' && x.ciudad === 'roma'); assert.strictEqual(g.nivel, 2); assert.strictEqual(g.texto, 'Subir Cuartel a nivel 2 en Roma (Legado)');
  assert.ok(cat.every(x => s.cities[x.ciudad].owner === 'roma'));
  assert.ok(s.cities[cat[0].ciudad].pop >= s.cities[cat[cat.length - 1].ciudad].pop, 'más pobladas primero');
});
t('catálogo cuenta el borrador y un Foro que sube antes', () => {
  const s = nueva(); P.nuevo(s, 4, 'crecer'); pon(s, 'roma', 'cuartel', 0);
  assert.ok(P.catalogo(s, s.planSenado.borrador).find(x => x.ciudad === 'roma' && x.b === 'cuartel' && x.nivel === 3) === undefined, 'cuartel 3 pide Foro 3');
  pon(s, 'roma', 'foro', 0);
  assert.ok(P.catalogo(s, s.planSenado.borrador).find(x => x.ciudad === 'roma' && x.b === 'cuartel' && x.nivel === 3));
});
t('coste: ayuda manda; si no, base por nivel redondeado a 5', () => {
  const s = nueva(); assert.deepStrictEqual(P.coste(s, 'granja', 1), { materiales: 200, denarios: 10 });
  assert.deepStrictEqual(P.coste(s, 'granja', 2, { coste: () => ({ materiales: 7 }) }), { materiales: 7 });
  assert.deepStrictEqual(P.coste(s, 'granja', 0), { materiales: 100, denarios: 5 });
});
t('nuevo valida estaciones y prioridad', () => {
  const s = nueva();
  assert.strictEqual(P.nuevo(s, 3, 'crecer').motivo, 'Elige entre 4 y 8 estaciones'); assert.strictEqual(P.nuevo(s, 9, 'crecer').ok, false);
  assert.strictEqual(P.nuevo(s, 4, 'nada').ok, false); assert.ok(P.nuevo(s, 4, 'crecer').ok); assert.deepStrictEqual(s.planSenado.borrador, { estaciones: 4, prioridad: 'crecer', obras: [] });
});
t('poner: cada motivo', () => {
  const s = nueva(); const p = o => P.poner(s, o).motivo;
  assert.strictEqual(p({ ciudad: 'roma', b: 'cuartel', est: 0 }), 'Elige entre 4 y 8 estaciones');
  P.nuevo(s, 4, 'crecer');
  assert.strictEqual(p({ ciudad: 'roma', b: 'cuartel', est: 4 }), 'Esa estación no está en el plan');
  assert.strictEqual(p({ ciudad: 'roma', b: 'cuartel', est: -1 }), 'Esa estación no está en el plan');
  const aj = Object.keys(s.cities).find(i => s.cities[i].owner !== 'roma');
  assert.strictEqual(p({ ciudad: aj, b: 'cuartel', est: 0 }), 'La ciudad no es tuya');
  assert.strictEqual(p({ ciudad: 'roma', b: 'noexiste', est: 0 }), 'Ningún ministro hace esa obra');
  assert.strictEqual(p({ ciudad: 'roma', b: 'granja', est: 0 }), 'Sube antes el Foro');
  s.cities.roma.b.templo = D.MAX_LVL; assert.strictEqual(p({ ciudad: 'roma', b: 'templo', est: 0 }), 'Ya está al máximo');
  s.cities.roma.b.foro = D.MAX_LVL; assert.strictEqual(p({ ciudad: 'roma', b: 'foro', est: 0 }), 'Ya está al máximo');
  assert.ok(P.poner(s, { ciudad: 'roma', b: 'cuartel', est: 0 }).ok);
});
t('poner: 3 por estación, 16 en total y plan en marcha', () => {
  const s = nueva(); for (const c of ['roma', 'capua']) s.cities[c].b.foro = 5;
  P.nuevo(s, 8, 'crecer'); pon(s, 'roma', 'cuartel', 0); pon(s, 'roma', 'granja', 0); pon(s, 'roma', 'mina', 0);
  assert.strictEqual(P.poner(s, { ciudad: 'roma', b: 'cantera', est: 0 }).motivo, 'Caben 3 obras por estación');
  const B = s.planSenado.borrador; B.obras = [];
  for (let i = 0; i < 16; i++) B.obras.push({ id: 'z' + i, ciudad: 'capua', b: 'escuela', nivel: 1, est: Math.floor(i / 2), mid: 'infra' });
  assert.strictEqual(P.poner(s, { ciudad: 'roma', b: 'templo', est: 7 }).motivo, 'Caben 16 obras');
  s.planSenado.plan = { id: 'p1' }; assert.strictEqual(P.poner(s, { ciudad: 'roma', b: 'templo', est: 0 }).motivo, 'Ya hay un plan en marcha');
  assert.strictEqual(P.nuevo(s, 4, 'crecer').motivo, 'Ya hay un plan en marcha');
});
t('poner da niveles seguidos y no deja ir hacia atrás ni antes del Foro', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; P.nuevo(s, 4, 'crecer');
  const a = pon(s, 'roma', 'cuartel', 1), b = pon(s, 'roma', 'cuartel', 2);
  assert.deepStrictEqual([a.nivel, b.nivel], [2, 3]);
  assert.strictEqual(P.poner(s, { ciudad: 'roma', b: 'cuartel', est: 0 }).ok, false, 'el nivel 4 no va antes del 3');
  const s2 = nueva(); P.nuevo(s2, 4, 'crecer'); pon(s2, 'roma', 'foro', 1);
  assert.strictEqual(P.poner(s2, { ciudad: 'roma', b: 'mina', est: 1 }).motivo, 'Sube antes el Foro'); assert.ok(P.poner(s2, { ciudad: 'roma', b: 'mina', est: 2 }).ok);
});
t('quitar en cadena: niveles posteriores y obras sin Foro', () => {
  const s = nueva(); s.cities.roma.b.foro = 2; P.nuevo(s, 5, 'crecer');
  const f = pon(s, 'roma', 'foro', 0); pon(s, 'roma', 'cuartel', 1); const c3 = pon(s, 'roma', 'cuartel', 2);
  assert.strictEqual(c3.nivel, 3);
  let r = P.quitar(s, f.id); assert.ok(r.ok); assert.strictEqual(r.quitadas, 2, 'el Foro y el cuartel 3'); assert.strictEqual(s.planSenado.borrador.obras.length, 1);
  assert.strictEqual(s.planSenado.borrador.obras[0].b, 'cuartel'); assert.strictEqual(s.planSenado.borrador.obras[0].nivel, 2);
  const s2 = nueva(); s2.cities.roma.b.foro = 5; P.nuevo(s2, 5, 'crecer'); const a = pon(s2, 'roma', 'cuartel', 0); pon(s2, 'roma', 'cuartel', 1); pon(s2, 'roma', 'cuartel', 2);
  r = P.quitar(s2, a.id); assert.strictEqual(r.quitadas, 3); assert.strictEqual(s2.planSenado.borrador.obras.length, 0);
  assert.strictEqual(P.quitar(s2, 'zz').ok, false);
});
t('mover: respeta 3 por estación, orden de niveles y Foro', () => {
  const s = nueva(); s.cities.roma.b.foro = 2; P.nuevo(s, 5, 'crecer');
  const f = pon(s, 'roma', 'foro', 1), c = pon(s, 'roma', 'cuartel', 2), c2 = pon(s, 'roma', 'cuartel', 3);
  assert.strictEqual(P.mover(s, c2.id, 1).ok, false, 'el 3 antes del 2'); assert.strictEqual(P.mover(s, c.id, 3).ok, true);
  assert.strictEqual(P.mover(s, c.id, 5).motivo, 'Esa estación no está en el plan');
  pon(s, 'roma', 'herreria', 0);
  assert.strictEqual(P.mover(s, f.id, 4).ok, false, 'el Foro no puede ir después de lo que permite');
  assert.ok(P.mover(s, f.id, 0).ok);
  const s2 = nueva(); P.nuevo(s2, 4, 'crecer'); const a = pon(s2, 'roma', 'cuartel', 0); pon(s2, 'capua', 'cuartel', 1); pon(s2, 'roma', 'herreria', 1); pon(s2, 'capua', 'herreria', 1);
  assert.strictEqual(P.mover(s2, a.id, 1).motivo, 'Caben 3 obras por estación');
});
t('cambiarPrioridad y cambiarEstaciones (quita las que desaparecen)', () => {
  const s = nueva(); P.nuevo(s, 6, 'crecer'); pon(s, 'roma', 'cuartel', 5); pon(s, 'capua', 'cuartel', 1);
  assert.ok(P.cambiarPrioridad(s, 'plebe').ok); assert.strictEqual(s.planSenado.borrador.prioridad, 'plebe'); assert.strictEqual(P.cambiarPrioridad(s, 'x').ok, false);
  const r = P.cambiarEstaciones(s, 4); assert.ok(r.ok); assert.strictEqual(r.quitadas, 1); assert.strictEqual(s.planSenado.borrador.obras.length, 1);
  assert.strictEqual(P.cambiarEstaciones(s, 2).ok, false);
});
t('postura: equilibrado frente a un solo bando y la prioridad', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; s.cities.capua.b.foro = 5;
  P.nuevo(s, 4, 'crecer'); ['granja', 'granja', 'granja', 'granja'].forEach((b, i) => pon(s, i % 2 ? 'capua' : 'roma', b, i));
  const B = s.planSenado.borrador;
  assert.strictEqual(P.postura(s, B, 'ter'), 2 + 1 - 1 + 0 - 0 - 0 + 0 * 1 - 0 + 0, 'ter: 2 + 1 (afín) - 0');
  assert.strictEqual(P.postura(s, B, 'mil'), -1, 'mil: sin obras en un plan de 4 y su rival pue es afín? no: -1');
  const s2 = nueva(); P.nuevo(s2, 4, 'defender'); pon(s2, 'roma', 'cuartel', 0); pon(s2, 'roma', 'herreria', 1); pon(s2, 'capua', 'cuartel', 2); pon(s2, 'capua', 'herreria', 3);
  const B2 = s2.planSenado.borrador; assert.strictEqual(P.postura(s2, B2, 'mil'), 3 > 2 ? 2 : 0);
  assert.strictEqual(P.postura(s2, B2, 'ter'), -1, 'ter sin obras');
  for (const b of Object.keys(D.BANDOS)) { const x = P.postura(s2, B2, b); assert.ok(x >= -2 && x <= 2); }
});
t('comoLey tiene forma de ley y G.votos la acepta', () => {
  const s = nueva(); P.sugerir(s, 4, 'crecer'); const ley = P.comoLey(s, s.planSenado.borrador);
  assert.deepStrictEqual([ley.id, ley.tipo], ['plan-senado', 'obra']); assert.ok(ley.n.includes('4')); assert.strictEqual(typeof ley.postura.ter, 'number'); assert.deepStrictEqual(ley.chips, {});
  assert.ok(G.votos(ley, []).total > 0);
});
t('P.votos coincide con G.votos(P.comoLey)', () => {
  for (const pr of Object.keys(P.PRIORIDADES)) {
    const s = nueva(); G.senadoEstacion(); P.sugerir(s, 5, pr); const B = s.planSenado.borrador;
    const a = P.votos(s, B), g = G.votos(P.comoLey(s, B), []);
    assert.deepStrictEqual([a.si, a.no, a.duda, a.total, a.mayoria], [g.si, g.no, g.duda, g.total, g.mayoria], pr);
    for (const b in g.porBando) assert.deepStrictEqual([a.porBando[b].si, a.porBando[b].no], [g.porBando[b].si, g.porBando[b].no]);
    assert.strictEqual(a.sale, a.si >= a.mayoria);
  }
});
t('un plan equilibrado sale con el Senado inicial; uno de solo ejército con «defender» no', () => {
  const s = nueva(); P.sugerir(s, 4, 'crecer'); assert.ok(P.votos(s, s.planSenado.borrador).sale, J(P.votos(s, s.planSenado.borrador)));
  // solo ejército con «defender»: no sale (solo granjas sí saldría: los fabios pesan 14 de 30)
  const s2 = nueva(); P.nuevo(s2, 4, 'defender'); pon(s2, 'roma', 'cuartel', 0); pon(s2, 'capua', 'cuartel', 1); pon(s2, 'roma', 'herreria', 2); pon(s2, 'capua', 'herreria', 3);
  assert.strictEqual(P.votos(s2, s2.planSenado.borrador).sale, false);
});
t('puedeVotar: obras en la mitad de las estaciones', () => {
  const s = nueva(); assert.strictEqual(P.puedeVotar(s, 0).ok, false);
  P.nuevo(s, 5, 'crecer'); assert.strictEqual(P.puedeVotar(s, 0).motivo, 'Pon obras en al menos 3 estaciones');
  pon(s, 'roma', 'cuartel', 0); pon(s, 'roma', 'herreria', 0); pon(s, 'capua', 'cuartel', 1); assert.strictEqual(P.puedeVotar(s, 0).motivo, 'Pon obras en al menos 3 estaciones');
  pon(s, 'capua', 'herreria', 4); assert.ok(P.puedeVotar(s, 0).ok);
});
t('rechazo: misma firma no vota, cambiar una obra sí, la 4.ª no; la estación siguiente sí', () => {
  const s = nueva(); for (const c of ['roma', 'capua']) s.cities[c].b.foro = 5;
  P.nuevo(s, 4, 'defender'); pon(s, 'roma', 'granja', 0); pon(s, 'roma', 'granja', 1); pon(s, 'capua', 'granja', 2);
  const no = { si: 1, total: 30, mayoria: 16 };
  let r = P.votar(s, 0, no); assert.ok(r.ok && !r.sale); assert.ok(s.planSenado.borrador, 'el borrador sigue');
  assert.strictEqual(P.puedeVotar(s, 1).motivo, 'Cambia alguna obra antes de votar otra vez');
  assert.strictEqual(P.votar(s, 1, no).ok, false);
  pon(s, 'capua', 'cuartel', 3); assert.ok(P.puedeVotar(s, 1).ok); P.votar(s, 1, no);
  P.quitar(s, s.planSenado.borrador.obras[3].id); pon(s, 'capua', 'herreria', 3);
  assert.ok(P.puedeVotar(s, 2).ok); P.votar(s, 2, no);
  P.quitar(s, s.planSenado.borrador.obras[3].id); pon(s, 'capua', 'establo', 3);
  assert.strictEqual(P.puedeVotar(s, 2).motivo, 'El Senado no se reúne más esta estación');
  assert.ok(P.puedeVotar(s, 3).ok, 'estación siguiente: de nuevo');
  assert.strictEqual(P.votar(s, 3, no).ok, true);
});
t('votar: efectos de humor y registro; aprobar crea el plan', () => {
  const s = nueva(); P.nuevo(s, 4, 'crecer'); s.cities.roma.b.foro = 5; ['granja', 'cuartel', 'mina', 'cantera'].forEach((b, i) => pon(s, 'roma', b, i));
  const B = s.planSenado.borrador, pos = {}; for (const b of ['ter', 'mer', 'mil']) pos[b] = Math.sign(P.postura(s, B, b));
  const r = P.votar(s, 4, { si: 20, total: 30, mayoria: 16 }); assert.ok(r.sale); assert.strictEqual(s.planSenado.borrador, null);
  const pl = s.planSenado.plan; assert.deepStrictEqual([pl.e0, pl.estaciones, pl.aprobado], [1, 4, { si: 20, total: 30 }]); assert.ok(pl.id && pl.obras.length === 4);
  for (const e of r.efectos.filter(x => x.tipo === 'humor')) { assert.ok(e.activo); assert.strictEqual(e.d, pos[e.bando] * D.SENADO.postura); }
  assert.ok(r.efectos.find(x => x.tipo === 'log' && x.tono === 'good' && x.texto.startsWith('🏛️ El Senado aprueba el plan de obras (20 de 30)')));
  const s2 = nueva(); P.nuevo(s2, 4, 'crecer'); pon(s2, 'roma', 'cuartel', 0); pon(s2, 'roma', 'herreria', 1);
  const r2 = P.votar(s2, 0, { si: 5, total: 30, mayoria: 16 }); assert.ok(!r2.sale);
  for (const e of r2.efectos.filter(x => x.tipo === 'humor')) assert.strictEqual(e.d, -Math.sign(P.postura(s2, s2.planSenado.borrador, e.bando)) * D.SENADO.postura / 2);
  assert.ok(r2.efectos.find(x => x.tipo === 'log' && x.tono === 'bad' && x.texto.includes('rechaza')));
});
t('votar sin resultado calcula con P.votos', () => {
  const s = nueva(); P.sugerir(s, 4, 'crecer'); const v = P.votos(s, s.planSenado.borrador);
  const r = P.votar(s, 0); assert.strictEqual(r.sale, v.sale); assert.strictEqual(r.si, v.si); assert.strictEqual(r.total, v.total);
});
t('P.mes: aprobado, los ministros reciben encargos con plan', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; aprobado(s, [['roma', 'cuartel', 0], ['roma', 'granja', 0], ['capua', 'foro', 1], ['capua', 'cuartel', 2]]);
  const r = P.mes(s, 0); const e = s.ministros.encargos;
  assert.ok(e.ejercito && e.ejercito.plan && e.ejercito.b === 'cuartel' && e.ejercito.libre); assert.ok(e.agricultura && e.agricultura.plan);
  assert.strictEqual(e.infra, null, 'la estación 1 aún no toca'); assert.ok(Array.isArray(r.efectos) && Array.isArray(r.avisos));
  // al cumplirse el cuartel, la obra se marca hecha y el ejército pasa a la siguiente pendiente
  s.cities.roma.b.cuartel = 2; M.revisar(s, 1); P.mes(s, 1);
  assert.ok(s.planSenado.plan.obras[0].hecha); assert.strictEqual(s.planSenado.plan.obras[0].atrasada, false);
});
t('P.mes: una obra por ministro a la vez y orden por prioridad', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; aprobado(s, [['roma', 'cuartel', 0], ['capua', 'cuartel', 0], ['roma', 'granja', 0], ['roma', 'mina', 1]], 4, 'defender');
  P.mes(s, 0); assert.strictEqual(s.ministros.encargos.ejercito.ciudad, 'roma');
  const o = s.planSenado.plan.obras; assert.strictEqual(s.ministros.encargos.ejercito.plan, o[0].id);
  s.cities.roma.b.cuartel = 2; M.revisar(s, 1); P.mes(s, 1); assert.strictEqual(s.ministros.encargos.ejercito.plan, o[1].id, 'pasa a la segunda obra');
});
t('P.mes: ministro con encargo propio da aviso y espera', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; M.migrar(s);
  assert.ok(M.encargar(s, 'ejercito', { tipo: 'nivel', ciudad: 'capua', b: 'herreria', objetivo: 1, libre: true }, 0).ok);
  aprobado(s, [['roma', 'cuartel', 0], ['roma', 'granja', 0], ['roma', 'mina', 1]]);
  const r = P.mes(s, 0); assert.ok(!s.ministros.encargos.ejercito.plan, 'el encargo propio sigue');
  assert.ok(r.avisos.find(a => a.texto.startsWith('El legado acaba antes otro encargo: Subir Cuartel a nivel 2 en Roma') && a.texto.endsWith('espera')));
  assert.ok(r.efectos.find(x => x.tipo === 'log' && x.texto.includes('acaba antes otro encargo')));
  assert.strictEqual(P.mes(s, 1).efectos.filter(x => x.texto.includes('acaba antes')).length, 0, 'no se repite');
});
t('P.mes: faltan denarios, un solo aviso por estación', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; aprobado(s, [['roma', 'cuartel', 0], ['roma', 'granja', 0], ['roma', 'mina', 1]]); s.res.denarios = 0;
  const a = P.mes(s, 0), faltan = x => x.avisos.filter(v => /^Faltan \d+ de denarios para las obras de esta estación$/.test(v.texto));
  assert.strictEqual(faltan(a).length, 1); assert.strictEqual(a.avisos.find(v => v.texto.includes('denarios')).tono, 'bad');
  const b = P.mes(s, 1); assert.strictEqual(faltan(b).length, 1); assert.strictEqual(b.efectos.filter(x => x.texto.includes('denarios')).length, 0);
  const c = P.mes(s, 3); assert.strictEqual(faltan(c).length, 1, 'otra estación: de nuevo'); assert.strictEqual(c.efectos.filter(x => x.texto.includes('denarios')).length, 1);
  assert.ok(P.estado(s, 3).avisos.length >= 1);
  s.res.denarios = 1e9; s.res.materiales = 1e9; const d = P.mes(s, 6); assert.strictEqual(d.avisos.filter(v => v.clave && v.clave.startsWith('falta:')).length, 0);
});
t('P.mes: obra atrasada y estado', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; aprobado(s, [['roma', 'cuartel', 0], ['capua', 'cuartel', 1], ['roma', 'granja', 2]]);
  P.mes(s, 3);   // estación 1: la 0 está atrasada
  const o = s.planSenado.plan.obras; assert.strictEqual(o[0].atrasada, true); assert.strictEqual(o[1].atrasada, false);
  const st = P.estado(s, 3); assert.strictEqual(st.plan.k, 1); assert.strictEqual(st.plan.obras[2].estado, 'espera');
  assert.strictEqual(st.plan.obras[0].estado, 'en marcha', 'en marcha gana a atrasada'); assert.strictEqual(st.plan.obras[1].estado, 'espera', 'el Legado solo hace una');
  s.cities.roma.b.cuartel = 2; M.revisar(s, 4); P.mes(s, 4); const st2 = P.estado(s, 4);
  assert.strictEqual(st2.plan.obras[0].estado, 'hecha'); assert.strictEqual(st2.plan.obras[1].estado, 'en marcha'); assert.strictEqual(st2.plan.hechas, 1);
  const s2 = nueva(); s2.cities.roma.b.foro = 5; aprobado(s2, [['roma', 'cuartel', 0], ['roma', 'mina', 2], ['roma', 'granja', 3]]); P.mes(s2, 6); s2.ministros.encargos.ejercito = null;
  assert.strictEqual(P.estado(s2, 6).plan.obras[0].estado, 'atrasada');
});
t('P.mes: ciudad perdida', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; aprobado(s, [['capua', 'cuartel', 0], ['roma', 'granja', 0], ['roma', 'mina', 1], ['roma', 'cantera', 2]]);
  s.cities.capua.owner = 'cartago'; const r = P.mes(s, 0);
  assert.strictEqual(s.planSenado.plan.obras[0].perdida, true); assert.ok(r.efectos.find(x => x.tono === 'bad' && x.texto.includes('Capua')));
  const st = P.estado(s, 0); assert.strictEqual(st.plan.obras[0].estado, 'perdida'); assert.strictEqual(st.plan.total, 3);
});
t('juicio final: bien (+2 a todos), regular, mal (−3 a los que no hicieron)', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; aprobado(s, [['roma', 'cuartel', 0], ['roma', 'granja', 1], ['roma', 'mina', 2], ['roma', 'cantera', 3]]);
  s.cities.roma.b.cuartel = 2; s.cities.roma.b.granja = 4; s.cities.roma.b.mina = 3; s.cities.roma.b.cantera = 4;
  const r = P.mes(s, 12); assert.strictEqual(s.planSenado.plan, null); assert.strictEqual(s.planSenado.historial[0].juicio, 'bien'); assert.strictEqual(s.planSenado.bienTotal, 1, 'CE12: bienTotal suma los planes «bien»');
  assert.deepStrictEqual(r.efectos.filter(x => x.tipo === 'humor').map(x => [x.bando, x.d]), [['ter', 2], ['mer', 2], ['mil', 2]]);
  assert.ok(r.efectos.find(x => x.tono === 'good'));
  const s2 = nueva(); s2.cities.roma.b.foro = 5; aprobado(s2, [['roma', 'cuartel', 0], ['roma', 'granja', 1], ['roma', 'mina', 2], ['roma', 'cantera', 3]]);
  const r2 = P.mes(s2, 12); assert.strictEqual(s2.planSenado.historial[0].juicio, 'mal'); assert.strictEqual(s2.planSenado.bienTotal, 0); assert.deepStrictEqual(s2.planSenado.historial[0].hechas, 0);
  assert.deepStrictEqual(r2.efectos.filter(x => x.tipo === 'humor').map(x => [x.bando, x.d]).sort(), [['mil', -3], ['ter', -3]]);
  assert.ok(r2.efectos.find(x => x.tono === 'bad'));
  const s3 = nueva(); s3.cities.roma.b.foro = 5; aprobado(s3, [['roma', 'cuartel', 0], ['roma', 'granja', 1], ['roma', 'mina', 2], ['roma', 'cantera', 3]]);
  s3.cities.roma.b.cuartel = 2; s3.cities.roma.b.granja = 4;
  const r3 = P.mes(s3, 12); assert.strictEqual(s3.planSenado.historial[0].juicio, 'regular'); assert.ok(!r3.efectos.some(x => x.tipo === 'humor'));
  assert.strictEqual(s3.ministros.encargos.ejercito === null || !s3.ministros.encargos.ejercito.plan, true, 'se cancelan los encargos del plan');
});
t('historial guarda solo los últimos (CE12: 8)', () => {
  const s = nueva(); P.migrar(s);
  for (let i = 0; i < P.HISTORIAL + 2; i++) { s.cities.roma.b.foro = 5; s.cities.roma.b.cuartel = 0; s.cities.roma.b.granja = 1; s.planSenado.plan = null; P.nuevo(s, 4, 'crecer'); pon(s, 'roma', 'cuartel', 0); pon(s, 'roma', 'granja', 1); P.votar(s, 0, { si: 30, total: 30, mayoria: 16 }); P.mes(s, 12); s.cities.roma.b.cuartel = 1; s.cities.roma.b.granja = 2; s.planSenado.votacion = { est: -1, n: 0, firmas: [] }; }
  assert.strictEqual(s.planSenado.historial.length, P.HISTORIAL);
});
t('abandonar: −3 a los bandos con obras sin hacer, historial y encargos', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; aprobado(s, [['roma', 'cuartel', 0], ['roma', 'granja', 0], ['roma', 'mina', 1]]); P.mes(s, 0);
  s.cities.roma.b.cuartel = 2;
  const r = P.abandonar(s, 1); assert.ok(r.ok); assert.strictEqual(s.planSenado.plan, null);
  assert.deepStrictEqual(r.efectos.filter(x => x.tipo === 'humor' && x.d === -3).map(x => [x.bando, x.d]), [['ter', -3]]);
  assert.strictEqual(s.planSenado.historial[0].juicio, 'abandonado'); assert.strictEqual(s.planSenado.historial[0].hechas, 1);
  assert.ok(!s.ministros.encargos.agricultura); assert.strictEqual(P.abandonar(s, 1).ok, false);
});
t('sugerir: determinista y votable', () => {
  const a = nueva(), b = nueva(); P.sugerir(a, 6, 'crecer'); P.sugerir(b, 6, 'crecer');
  assert.strictEqual(J(a.planSenado.borrador), J(b.planSenado.borrador)); assert.ok(a.planSenado.borrador.obras.length >= 6);
  assert.ok(a.planSenado.borrador.obras.every(o => o.est >= 0 && o.est < 6));
  for (let e = 0; e < 6; e++) assert.ok(a.planSenado.borrador.obras.filter(o => o.est === e).length <= 3);
  assert.ok(P.puedeVotar(a, 0).ok); assert.ok(P.votar(a, 0).ok);
  for (const pr of Object.keys(P.PRIORIDADES)) for (const k of [4, 8]) { const s = nueva(); assert.ok(P.sugerir(s, k, pr).ok); assert.ok(P.puedeVotar(s, 0).ok, pr + k); }
  assert.strictEqual(P.sugerir(nueva(), 2, 'crecer').ok, false);
});
t('estado sin errores en todos los casos y con la forma pedida', () => {
  const s = nueva(); let st = P.estado(s, 0); assert.strictEqual(st.prioridades.length, 4); assert.deepStrictEqual([st.borrador, st.plan], [null, null]);
  P.sugerir(s, 5, 'riqueza'); st = P.estado(s, 0); const o = st.borrador.obras[0];
  assert.ok(o.id && o.texto && typeof o.est === 'number' && o.mid && o.cargo && o.i && o.coste && o.bando !== undefined);
  assert.ok(st.borrador.votos && st.borrador.puede);
  P.votar(s, 0, { si: 30, total: 30, mayoria: 16 }); P.mes(s, 0); st = P.estado(s, 0);
  assert.strictEqual(st.borrador, null); assert.ok(st.plan.obras.length && st.plan.obras.every(x => ['hecha', 'en marcha', 'espera', 'atrasada', 'perdida'].includes(x.estado)));
  assert.ok(st.plan.obras.some(x => x.estado === 'en marcha')); assert.strictEqual(st.plan.total, st.plan.obras.length);
  assert.doesNotThrow(() => JSON.stringify(st));
});
t('partida vieja sin s.senado ni s.ministros: nada se rompe', () => {
  const s = nueva(); delete s.senado; delete s.ministros; delete s.planSenado;
  assert.doesNotThrow(() => { P.nuevo(s, 4, 'crecer'); P.sugerir(s, 4, 'crecer'); P.votos(s, s.planSenado.borrador); P.puedeVotar(s, 0); P.estado(s, 0); });
  assert.strictEqual(P.votos(s, s.planSenado.borrador).sale, false);
  const r = P.votar(s, 0, { si: 20, total: 30, mayoria: 16 }); assert.ok(r.ok && r.sale);
  assert.doesNotThrow(() => { P.mes(s, 0); P.mes(s, 3); P.abandonar(s, 3); });
  delete s.cities.roma.b; assert.doesNotThrow(() => P.catalogo(s));
});
t('no escribe fuera de planSenado (y de los encargos al ejecutar)', () => {
  const s = nueva(); const antes = J([s.res, s.senado, s.cities]);
  P.sugerir(s, 4, 'crecer'); P.votar(s, 0, { si: 30, total: 30, mayoria: 16 }); P.estado(s, 0); P.catalogo(s); P.abandonar(s, 0);
  assert.strictEqual(J([s.res, s.senado, s.cities]), antes);
});
t('aprobar y abandonar no deja humor neto de más', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; P.nuevo(s, 4, 'crecer'); pon(s, 'roma', 'cuartel', 0); pon(s, 'roma', 'granja', 1);
  const neto = {}, suma = (ef) => ef.filter(x => x.tipo === 'humor').forEach(x => { neto[x.bando] = (neto[x.bando] || 0) + x.d; });
  suma(P.votar(s, 0, { si: 30, total: 30, mayoria: 16 }).efectos); assert.ok(s.planSenado.plan.humorVoto.ter > 0);
  suma(P.abandonar(s, 0).efectos);
  for (const b in neto) assert.ok(neto[b] <= 0, b + ' ' + neto[b]);
});
t('encargo del plan sin recursos no se castiga antes del fin del plan', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; aprobado(s, [['roma', 'cuartel', 0], ['roma', 'granja', 1]]); P.mes(s, 0);
  assert.strictEqual(s.ministros.encargos.ejercito.plazo, 11);
  const r = M.revisar(s, 11); assert.strictEqual(r.fallidos.length, 0);
});
t('Foro pendiente en la ciudad: sin aviso, espera', () => {
  const s = nueva(); aprobado(s, [['capua', 'foro', 1], ['capua', 'mina', 2], ['roma', 'cuartel', 3]]);
  s.planSenado.plan.obras[1].est = 0;   // la mina 3 pide Foro 3 y el Foro aún no se hizo
  const r = P.mes(s, 0); assert.ok(!r.avisos.some(a => a.texto.includes('Sube antes el Foro')), J(r.avisos));
});
t('ciudad recuperada vuelve a contar; Faltan solo cuenta obras con encargo del plan', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; aprobado(s, [['capua', 'cuartel', 0], ['roma', 'cuartel', 0], ['roma', 'granja', 1]]);
  s.cities.capua.owner = 'cartago'; P.mes(s, 0); assert.ok(s.planSenado.plan.obras[0].perdida);
  s.cities.capua.owner = 'roma'; P.mes(s, 1); assert.strictEqual(s.planSenado.plan.obras[0].perdida, false);
  const s2 = nueva(); s2.cities.roma.b.foro = 5; aprobado(s2, [['roma', 'cuartel', 0], ['capua', 'cuartel', 0], ['roma', 'granja', 1]]); s2.res.denarios = 0;
  P.mes(s2, 0); const f = s2.planSenado.avisos.find(a => a.clave === 'falta:denarios'); assert.ok(f);
  const un = P.coste(s2, 'cuartel', 1).denarios || 0, dos = 2 * un;
  assert.ok(f.texto.includes('Faltan ' + Math.ceil(un) + ' ') || un === 0, f.texto); void dos;
});
t('reparto (usuario, «B»): un plan de un solo bando no sale y dice qué falta', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; P.nuevo(s, 4, 'defender');
  pon(s, 'roma', 'cuartel', 0); pon(s, 'roma', 'herreria', 1); pon(s, 'roma', 'establo', 2);
  const rep = P.reparto(s, s.planSenado.borrador); assert.ok(!rep.ok); assert.ok(rep.motivo.includes('solo beneficia a los Militares'), rep.motivo);
  assert.ok(rep.faltan.some(f => f.bando === 'ter') && rep.motivo.includes('Granja'), rep.motivo);
  assert.strictEqual(P.votos(s, s.planSenado.borrador).sale, false);
  const r = P.votar(s, 0, { si: 30, total: 30, mayoria: 16 }); assert.ok(r.ok && !r.sale); assert.ok(r.motivo.includes('Faltan obras'), r.motivo);
  assert.ok(r.efectos.some(e => e.tipo === 'log' && e.texto.includes('Faltan obras')));
  pon(s, 'roma', 'granja', 3); assert.ok(!P.reparto(s, s.planSenado.borrador).ok, 'tres de cuatro aún es demasiado');
  pon(s, 'roma', 'almacen', 3); assert.ok(P.reparto(s, s.planSenado.borrador).ok, J(P.reparto(s, s.planSenado.borrador)));
  assert.ok(P.votar(s, 0, { si: 30, total: 30, mayoria: 16 }).sale);
});
t('reparto: ninguno se lleva más de dos tercios', () => {
  const s = nueva(); s.cities.roma.b.foro = 5; P.nuevo(s, 4, 'defender');
  pon(s, 'roma', 'cuartel', 0); pon(s, 'roma', 'herreria', 0); pon(s, 'roma', 'establo', 1); pon(s, 'roma', 'muralla', 1); pon(s, 'roma', 'granja', 2);
  const rep = P.reparto(s, s.planSenado.borrador); assert.ok(!rep.ok); assert.ok(rep.motivo.includes('se llevan 4 de 5'), rep.motivo);
});
t('reparto: el plan que sugiere «crecer» sale con el Senado inicial', () => {
  for (const n of [4, 6, 8]) { const s = nueva(); P.sugerir(s, n, 'crecer'); const v = P.votos(s, s.planSenado.borrador); assert.ok(v.reparto.ok && v.sale, n + ' ' + J(v.reparto)); }
});
console.log(n + ' bien, ' + mal + ' mal');
process.exit(mal ? 1 : 0);
