// Prueba de las reglas de EV2 (sin pantalla). Termina con APTO o código 1.
import * as R from './reglas.js';
const { crear, ajustar, ordenar, nombrar, candidatos, asunto, votos, votar, elegir, consultas, decidir, puedeCerrar, cerrarEstacion, cierre, CARGOS, PERSONAS, ORDEN_CARGOS } = R;
let fallos = 0; const ok = (c, t) => { if (!c) { fallos++; console.log('  MAL: ' + t); } };
const mal = [];
const sano = (e, t) => {
  for (const x of [e.oro, e.pueblo, e.ciudad.gente, e.ciudad.nivel, ...Object.values(e.humor)]) if (!Number.isFinite(x)) mal.push('NaN ' + t);
  for (const h of Object.values(e.humor)) if (h < 0 || h > 100) mal.push('humor ' + t);
  if (e.pueblo < 0 || e.pueblo > 100) mal.push('pueblo ' + t); if (e.oro < 0) mal.push('oro ' + t); if (e.ciudad.nivel < 0 || e.ciudad.nivel > 8 || e.ciudad.obras.length !== e.ciudad.nivel) mal.push('nivel ' + t);
};
// juega el año entero. est = {cruza, ii, iii, tratos, sinNada, tras} ; devuelve el estado
function anio(e, est = {}, tras) {
  const llamadas = { votar: 0, decidir: 0 };
  for (let s = 0; s < 4; s++) {
    if (e.ajuste !== 'nada' && s <= 2) {
      llamadas.votar++;
      if (s === 0) { const r = votar(e, 'cruzar', est.tratos0 || []); if (!r.sale) elegir(e, est.cruza === false ? 'acatar' : 'pueblo'); }
      else if (s === 1) votar(e, est.ii || asunto(e).opciones[0].id, est.tratos1 || []);
      else votar(e, est.iii || 'permitir', []);
    }
    if (e.ajuste === 'todo') for (const c of consultas(e)) if (!c.decidida && !c.laDecideElMagistrado) { decidir(e, c.id, c.opciones[0].id); llamadas.decidir++; }
    ok(puedeCerrar(e).ok, 'puede cerrar s' + s); cerrarEstacion(e); sano(e, 'est' + s);
    if (tras) e = tras(e);
  }
  e.llamadas = llamadas; return e;
}
const firma = e => JSON.stringify([e.oro, e.pueblo, e.humor, e.ciudad.nivel, e.ciudad.gente]);
const nada = (mut) => { const e = crear(); ajustar(e, 'nada'); mut && mut(e); return anio(e); };

// 1. el año se completa con los tres ajustes; con nada, sin votar ni decidir
for (const a of ['todo', 'grande', 'nada']) {
  const e = crear(); ajustar(e, a); anio(e); ok(e.cerrado && e.despachos.length === 20, 'año completo con ' + a + ' (' + e.despachos.length + ' partes)');
  ok(e.despachos.every(d => d.texto && d.cargo && d.persona && d.orden && Array.isArray(d.cambios)), 'partes bien formados ' + a);
  ok(e.hilo.length >= 3, 'hilo de tres asuntos ' + a); const ci = cierre(e);
  ok(ci.ciudad.obras.length === ci.ciudad.nivel && ci.magistrados.length === 5 && ci.magistrados.every(m => ['bien', 'regular', 'mal'].includes(m.juicio)), 'cierre con ciudad y magistrados ' + a);
  if (a === 'nada') { ok(e.llamadas.votar === 0 && e.llamadas.decidir === 0, 'nada: sin llamadas'); ok(e.consultas.length === 6 && e.consultas.every(c => c.por === 'magistrado'), 'nada: seis consultas por los magistrados'); ok(/Sin que me lo pidieras/.test(e.despachos.filter(d => d.cargo === 'consul')[0].texto), 'nada: se cuenta en el parte del cónsul'); }
  if (a === 'grande') ok(e.consultas.length === 6 && e.consultas.every(c => c.por === 'magistrado'), 'grande: consultas por los magistrados');
  if (a === 'todo') ok(e.consultas.filter(c => c.por === 'jugador').length === 5 && e.consultas.find(c => c.id === 'remeros').por === 'magistrado', 'todo: las decide el jugador salvo Apio (no pide permiso)');
}
// puedeCerrar y errores
{ const e = crear(); ok(!puedeCerrar(e).ok && puedeCerrar(e).falta.length >= 1, 'falta votar'); let t = false; try { cerrarEstacion(e); } catch { t = true; } ok(t, 'cerrar sin votar falla'); ajustar(e, 'nada'); ok(puedeCerrar(e).ok, 'con nada se puede cerrar'); }
{ const e = crear(); ajustar(e, 'todo'); votar(e, 'cruzar', ['ter', 'mer', 'mil']); ok(!puedeCerrar(e).ok, 'todo: faltan consultas'); let t = false; try { votar(e, 'cruzar', []); } catch { t = true; } ok(t, 'no se vota dos veces'); }
// 2. los cuatro rumbos (y promesas) recorriendo estrategias
const rumbos = new Set(); let caminos = 0;
for (const co of ['prudente', 'refuerza', 'ataque']) for (let m = 0; m < 8; m++) for (const cruza of [true, false]) for (const ii of ['a', 'b']) {
  const e = crear(); ajustar(e, 'grande'); ordenar(e, 'consul', co); const tr = ['ter', 'mer', 'mil'].filter((_, i) => m >> i & 1);
  const r0 = votar(e, 'cruzar', tr); if (!r0.sale) elegir(e, cruza ? 'pueblo' : 'acatar'); cerrarEstacion(e);
  const op = asunto(e).opciones[ii === 'a' ? 0 : 1].id; const libres = R.tratos(e).filter(t => !t.usado && (t.id !== 'mer' || e.oro >= 160)).map(t => t.id); votar(e, op, votos(e, op, []).sale ? [] : libres); cerrarEstacion(e); votar(e, 'permitir', []); cerrarEstacion(e); cerrarEstacion(e); sano(e, co + tr + cruza + ii);
  const ci = cierre(e); rumbos.add(ci.rumbo.titulo); caminos++; ok([0, 33, 67, 100].includes(ci.desvio), 'desvío válido');
  ok(ci.desvio === 0 === (ci.rumbo.real && e.marcas.juegos === true), 'desvío 0 solo en el camino real');
}
ok(rumbos.size === 4, 'se alcanzan 4 rumbos, hay ' + rumbos.size + ': ' + [...rumbos].join(', '));
// 3. romper promesas se cobra
{ const e = crear(); ordenar(e, 'consul', 'refuerza'); e.estacion = 1; e.marcas.cruza = true; const mil0 = e.humor.mil;
  const r = votar(e, 'alianza', ['mil', 'ter', 'mer']); ok(r.salio === 'alianza', 'alianza sale'); const rota = r.cambios.find(c => c.nota === 'rota' && c.que === 'mil');
  ok(rota && rota.n === -15 && /Rompes tu promesa a los militares/.test(r.linea) && cierre(e).promesas.some(p => p.id === 'botin' && p.estado === 'rota'), 'botín roto con alianza se cobra'); ok(e.humor.mil < mil0 - 5, 'los militares se enfadan'); }
{ const e = crear(); ordenar(e, 'consul', 'ataque'); e.estacion = 1; e.marcas.cruza = true; e.humor.mil = 100;
  const r = votar(e, 'sitio', ['ter', 'mer', 'mil']); ok(r.salio === 'sitio', 'sitio sale'); ok(r.cambios.some(c => c.que === 'ter' && c.n === -15 && c.nota === 'rota') && cierre(e).promesas.some(p => p.id === 'levas' && p.estado === 'rota') && cierre(e).promesas.some(p => p.id === 'botin' && p.estado === 'cumplida'), 'levas rotas y botín cumplido'); }
{ const e = crear(); votar(e, 'cruzar', ['mer']); let t = false; cerrarEstacion(structuredClone(Object.assign(e, { ajuste: 'nada' }))); try { votar(Object.assign(crear(), { estacion: 0 }), 'cruzar', ['mer', 'mer']); } catch { t = true; } ok(!t, 'repetir un bando en la misma lista no falla'); }
{ const e = crear(); e.estacion = 1; e.marcas.cruza = true; votar(Object.assign(e, { marcas: { ...e.marcas } }), 'alianza', ['mer']); let t = false; e.marcas.hecho1 = false; try { votar(e, 'sitio', ['mer']); } catch { t = true; } ok(t, 'un trato solo una vez al año'); }
// 4. nombrar
{ const e = crear(); const a = nombrar(e, 'edil', 'junio'); ok(a.coste === 0 && e.oro === 200 && e.cargos.edil === 'junio' && e.humor.mer === 53 && e.humor.ter === 50, 'nombrar gratis en primavera (+3 al nombrado)');
  nombrar(e, 'edil', 'fabio'); nombrar(e, 'edil', 'junio'); ok(e.humor.mer === 53, 'no se puede sacar partido nombrando de ida y vuelta');
  ajustar(e, 'nada'); cerrarEstacion(e); const oro = e.oro, ter = e.humor.ter, mil = e.humor.mil; const b = nombrar(e, 'edil', 'duilio'); ok(b.coste === 30 && e.oro === oro - 30 && e.humor.mil === mil + 3, 'nombrar cuesta 30 y da +3 al bando nombrado');
  const e3 = crear(); ajustar(e3, 'nada'); cerrarEstacion(e3); const h3 = structuredClone(e3.humor); nombrar(e3, 'edil', 'junio'); ok(e3.humor.ter === h3.ter - 6 && e3.humor.mer === h3.mer + 3, 'enfada (−6) al bando del destituido');
  let t = false; const e4 = crear(); e4.estacion = 1; e4.oro = 10; try { nombrar(e4, 'edil', 'junio'); } catch { t = true; } ok(t, 'sin oro no se nombra'); }
// 5. edil obras vs juegos
{ const o = nada(e => ordenar(e, 'edil', 'obras')), j = nada(e => ordenar(e, 'edil', 'juegos')), g = nada(e => ordenar(e, 'edil', 'grano'));
  ok(o.ciudad.nivel >= 6 && o.ciudad.nivel <= 8, 'obras: 6–8 obras (' + o.ciudad.nivel + ')'); ok(j.ciudad.nivel >= 2 && j.ciudad.nivel <= 3 && g.ciudad.nivel <= 3, 'sin obras: 2–3 (' + j.ciudad.nivel + ', ' + g.ciudad.nivel + ')');
  ok(o.ciudad.nivel > j.ciudad.nivel && j.pueblo > o.pueblo, 'obras más ciudad, juegos más pueblo'); ok(g.ciudad.gente > o.ciudad.gente || o.ciudad.gente > j.ciudad.gente, 'la gente crece');
  ok(o.ciudad.obras.map(x => x.id).join() === R.OBRAS.slice(0, o.ciudad.nivel).map(x => x.id).join(), 'obras en el orden fijado'); }
// 6. cada orden y cada candidato cambian el resultado
for (const c of ORDEN_CARGOS) { const f = CARGOS[c].ordenes.map(o => firma(nada(e => ordenar(e, c, o.id)))); ok(new Set(f).size === 3, 'las tres órdenes de ' + c + ' dan resultados distintos'); }
for (const c of ORDEN_CARGOS) { const f = candidatos(crear(), c).map(p => firma(nada(e => { e.cargos[c] = p.id; }))); ok(candidatos(crear(), c).length === 3 && new Set(f).size === 3, 'los tres candidatos de ' + c + ' dan resultados distintos'); }
{ const ds = (c, o) => nada(e => ordenar(e, c, o)); ok(ds('cuestor', 'ahorra').oro - ds('cuestor', 'gasta').oro >= 80, 'cuestor: ahorrar o gastar se nota (≥80 de oro)'); ok(Math.abs(ds('consul', 'ataque').humor.mil - ds('consul', 'prudente').humor.mil) >= 12, 'cónsul: la orden se nota en los militares'); }
// 7. personajes
{ ok(PERSONAS.length === 15 && PERSONAS.every(p => p.id && p.nombre && p.bando && p.habil >= 1 && p.habil <= 3 && p.bueno.titulo && p.malo.texto && p.nota && p.fuente && p.dictamen), '15 personajes completos'); const e = crear();
  ok(ORDEN_CARGOS.every(c => candidatos(e, c).filter(x => x.ocupa).length === 1), 'cada cargo tiene un ocupante');
  ok(CARGOS.consul.ordenes.length === 3 && Object.values(CARGOS).every(c => c.latin && c.lleva && c.ordenes.every(o => o.id && o.titulo && o.texto)), 'cargos con orden'); }
// 8. votos: reparto, consul, topes
{ const e = crear(), v = votos(e, 'cruzar', []); ok(v.si === 15 && !v.sale && v.ter.si + v.ter.duda + v.ter.no === 12 && v.mer.si + v.mer.duda + v.mer.no === 8 && v.mil.si + v.mil.duda + v.mil.no === 10, 'votos iniciales 15');
  ordenar(e, 'consul', 'ataque'); ok(votos(e, 'cruzar', []).si === 17 && votos(e, 'cruzar', []).sale, 'el cónsul «al ataque» da votos a la guerra'); ok(votos(e, 'tratado', []).si < votos(crear(), 'tratado', []).si + 1, 'no da votos a la paz'); }
// 9. fuentes en todos los asuntos y consultas
for (const [cruza, p] of [[true, 0], [true, 1], [false, 1], [true, 2], [true, 3]]) { const e = crear(); e.estacion = p; e.marcas.cruza = cruza; const s = asunto(e); ok(s.fuente && s.dictamen && s.fecha && s.texto, 'fuente y dictamen en ' + s.id); }
for (let s = 0; s < 3; s++) { const e = crear(); e.estacion = s; const cs = consultas(e); ok(cs.length === 2 && cs[0].cargo !== cs[1].cargo && cs.every(c => c.opciones.length === 2 && c.opciones.every(o => o.chips.length) && c.fuente && c.dictamen), 'dos consultas distintas en ' + s); }
{ const e = crear(); e.estacion = 2; e.oro = 59; ok(asunto(e).opciones[2].apagada, 'grandes apagada sin oro'); let t = false; try { votar(e, 'grandes', []); } catch { t = true; } ok(t, 'votar apagada falla'); }
// 10. guardado: pasar por JSON entre estaciones no cambia nada
{ const a = crear(); ajustar(a, 'todo'); anio(a); const b = crear(); ajustar(b, 'todo'); const b2 = anio(b, {}, e => JSON.parse(JSON.stringify(e))); ok(firma(a) === firma(b2) && JSON.stringify(a.despachos) === JSON.stringify(b2.despachos), 'guardar y cargar no cambia el año'); }
ok(mal.length === 0, 'estados sanos: ' + mal.slice(0, 3).join(' | '));
console.log('Caminos hasta el cierre: ' + caminos + ' · rumbos: ' + [...rumbos].join(', '));
console.log(fallos ? 'NO APTO · ' + fallos + ' fallos' : 'APTO'); process.exit(fallos ? 1 : 0);
