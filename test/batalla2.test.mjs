// AQVILA — NB1: motor del choque sin pantalla. node test/batalla2.test.mjs
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
require('../js/data.js');
const B = require('../js/batalla2.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }

const x = (tipo, k, o) => Array.from({ length: k }, () => Object.assign({ tipo, n: 80 }, o));
const ejercito = () => [].concat(x('hastati', 4), x('principes', 3), x('triarii', 2), x('velites', 2), x('equites', 1));
const CARS = ['equilibrado', 'astuto', 'impetuoso', 'prudente'];
const igualada = (sd, extra) => B.crear(Object.assign({ semilla: sd, bandos: [{ nombre: 'Roma', regs: ejercito(), car: CARS[(sd + 1) % 4] }, { nombre: 'Cartago', regs: ejercito(), car: CARS[sd % 4] }] }, extra || {}));
const correr = (e, sd, max) => { while (!e.fin && e.pulsos < (max || 700)) e = B.pulso(e, sd).estado; return e; };
const enCampo = (e, b) => Object.values(e.regs).filter(r => r.bando === b && ['frente', 'apoyo', 'reserva'].includes(r.lugar));
const sinTiempo = e => { e.programados = []; return e; };

t('crear: tres sectores, filas de hasta 3, mando 5 y estado serializable', () => {
  const e = igualada(1);
  assert.strictEqual(e.sectores.length, 3);
  for (const s of e.sectores) { assert.strictEqual(s.linea, 0); for (let b = 0; b < 2; b++) assert(s.filas[b].frente.length <= 3 && s.filas[b].apoyo.length <= 3); }
  assert.strictEqual(e.bandos[0].mando, 5); assert.strictEqual(enCampo(e, 0).length, 12);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(e)), e);
  const sin = B.crear({ bandos: [{ regs: ejercito(), general: null }, { regs: ejercito() }] }); assert.strictEqual(sin.bandos[0].mando, 2, 'sin general, mando 2');
});

t('despliegue: la caballería va a las alas y los tiradores al apoyo', () => {
  const e = igualada(1); const cav = Object.values(e.regs).find(r => r.bando === 0 && r.cls === 'cav');
  assert.strictEqual(cav.lugar, 'frente'); assert(cav.sector === 0 || cav.sector === 2);
  for (const r of Object.values(e.regs)) if (r.bando === 0 && r.cls === 'rng') assert.strictEqual(r.lugar, 'apoyo');
});

t('tope de 20 en campo y cola de refuerzos', () => {
  const e = B.crear({ bandos: [{ regs: x('hastati', 30) }, { regs: x('hastati', 5) }] });
  assert.strictEqual(enCampo(e, 0).length, 20); assert.strictEqual(e.bandos[0].cola.length, 10);
  assert(e.bandos[0].reserva.length >= 1, 'con tantos, parte va a la reserva');
  for (let b = 0; b < 2; b++) assert(enCampo(e, b).length <= B.TOPE_CAMPO);
});

t('pulso: avanza 2 s, no toca el estado de entrada y es determinista', () => {
  const e = igualada(3), antes = JSON.stringify(e);
  const r1 = B.pulso(e, 7), r2 = B.pulso(e, 7);
  assert.strictEqual(JSON.stringify(e), antes, 'no muta la entrada');
  assert.strictEqual(r1.estado.t, 2); assert.strictEqual(r1.estado.pulsos, 1);
  assert.strictEqual(JSON.stringify(r1.estado), JSON.stringify(r2.estado));
  assert(Array.isArray(r1.sucesos)); assert('pausa' in r1);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r1.estado)), r1.estado);
});

t('mando: las órdenes cuestan, se rechaza lo que no alcanza y se recarga 1 cada 10 s', () => {
  let e = igualada(2); e.bandos[1].ia = false;
  let r = B.aplicar(e, [{ orden: 'avanzar', sector: 0 }, { orden: 'cargar', sector: 1 }, { orden: 'aguantar', sector: 2 }], 0);
  assert.strictEqual(r.gasto, 2); assert.strictEqual(r.mando, 3);
  r = B.aplicar(r.estado, [{ orden: 'relevar', sector: 1 }, { orden: 'retirarse', sector: 2 }, { orden: 'avanzar', sector: 2 }], 0);
  assert(r.rechazadas.length >= 1 && r.mando >= 0, 'rechaza lo que no alcanza: ' + JSON.stringify(r.rechazadas));
  e = r.estado; e.bandos[0].mando = 0; e.bandos[0].mandoT = 0; e.bandos[1].ia = false;
  for (let i = 0; i < 5; i++) e = B.pulso(e, 1).estado;
  assert.strictEqual(e.bandos[0].mando, 1, 'a los 10 s, +1');
  assert(B.aplicar(e, [{ orden: 'rodear', sector: 0 }], 0).rechazadas.length === 1, 'sin vado, bosque ni cerro no se rodea');
});

t('sectores: el más fuerte empuja la línea y el más débil se rompe', () => {
  const fuerte = [].concat(x('principes', 6), x('triarii', 3)), flojo = x('milicia', 3);
  let e = B.crear({ semilla: 1, bandos: [{ regs: fuerte, general: null }, { regs: flojo, ia: false, general: null }] });
  e.bandos[0].ia = false;
  e = correr(e, 1, 400);
  assert(e.fin && e.fin.ganador === 0, 'gana el fuerte: ' + JSON.stringify(e.fin));
  assert(e.sectores.some(s => s.linea > 0 || s.roto[1]), 'la línea se movió');
  for (const s of e.sectores) assert(s.linea >= -2 && s.linea <= 2);
});

t('terreno: el cerro favorece a su dueño y el puente deja un solo regimiento de frente', () => {
  const mk = tipo => B.crear({ semilla: 1, terreno: { sectores: [{}, { tipo: tipo, dueno: 1 }, {}] }, bandos: [{ regs: ejercito() }, { regs: ejercito() }] });
  const c = mk('cerro'), l = mk('llano');
  assert(B.golpe(c, 1, 1).g > B.golpe(l, 1, 1).g * 1.15 && B.golpe(c, 1, 0).g === B.golpe(l, 1, 0).g);
  assert.strictEqual(mk('puente').sectores[1].filas[0].frente.length, 1);
});

t('ánimo: el que pierde por más de un 50 % baja de estado hasta huir; cansancio sube y baja', () => {
  let e = B.crear({ semilla: 1, bandos: [{ regs: x('principes', 6), general: null, ia: false }, { regs: x('milicia', 3), general: null, ia: false }] });
  const flojo = Object.values(e.regs).filter(r => r.bando === 1);
  let vistos = new Set(), huyo = false;
  for (let i = 0; i < 200 && !huyo; i++) { const r = B.pulso(e, 1); e = r.estado; flojo.forEach(f => vistos.add(e.regs[f.id].animo)); huyo = r.sucesos.some(s => s.tipo === 'huye'); }
  assert(vistos.has(1) && vistos.has(2) && huyo, 'pasa por Vacilante y Desordenado y huye: ' + [...vistos]);
  // cansancio: presionar gasta, el apoyo recupera
  let c = igualada(4); c.bandos[0].ia = false; c.bandos[1].ia = false; c.bandos[0].mando = 5;
  c = B.aplicar(c, [{ orden: 'avanzar', sector: 1 }], 0).estado;
  for (let i = 0; i < 15; i++) c = B.pulso(c, 2).estado;
  const fr = c.sectores[1].filas[0].frente.map(id => c.regs[id]);
  assert(fr.some(r => r.fat >= 1), 'presionar cansa');
  const ap = c.regs[c.sectores[1].filas[0].apoyo[0]]; if (ap) { ap.fat = 2; ap.fatT = 0; for (let i = 0; i < 12; i++) c = B.pulso(c, 2).estado; assert(c.regs[ap.id].fat < 2, 'el apoyo recupera'); }
  // un regimiento con los tres puntos no puede presionar: su golpe vuelve al de aguantar
  const d = igualada(5); const r0 = d.regs[d.sectores[1].filas[0].frente[0]]; const g1 = B.golpe(d, 1, 0, ['avanzar', 'aguantar']).g; r0.fat = 3;
  const g2 = B.golpe(d, 1, 0, ['avanzar', 'aguantar']).g, g3 = B.golpe(d, 1, 0, ['aguantar', 'aguantar']).g;
  assert(g2 < g1 && g2 > g3 * 0.7, 'agotado no presiona');
});

t('refuerzos: si uno huye o cae, entra uno de la cola', () => {
  let e = B.crear({ semilla: 1, bandos: [{ regs: x('hastati', 24), general: null, ia: false }, { regs: x('hastati', 6), general: null, ia: false }] });
  assert.strictEqual(e.bandos[0].cola.length, 4);
  const v = e.regs[e.sectores[1].filas[0].frente[0]]; v.animo = 3;
  let r = B.pulso(e, 1); assert(r.sucesos.some(s => s.tipo === 'huye'));
  e = r.estado; const entra = []; for (let i = 0; i < 6; i++) { r = B.pulso(e, 1); e = r.estado; r.sucesos.filter(s => s.tipo === 'refuerzo' && s.bando === 0).forEach(s => entra.push(s)); }
  assert(entra.length >= 1 && e.bandos[0].cola.length <= 3, 'entra un refuerzo');
  assert(enCampo(e, 0).length <= 20);
});

t('avisos: carga, flanco abierto, regimiento que huye, general en peligro y reserva enemiga', () => {
  // carga
  let e = igualada(1); e.bandos[1].ia = false; e = B.aplicar(e, [{ orden: 'cargar', sector: 0 }, { orden: 'cargar', sector: 2 }], 0).estado;
  let p = null; for (let i = 0; i < 3 && !(p && p.tipo === 'carga'); i++) { const r = B.pulso(e, 1); e = r.estado; p = r.pausa; } assert(p && p.tipo === 'carga', 'carga: ' + JSON.stringify(p));
  // flanco abierto
  e = igualada(1); e.bandos[1].ia = false; e.sectores[0].linea = -1; p = B.pulso(e, 1).pausa; assert(p && p.tipo === 'flanco' && /Flanco/.test(p.motivo), 'flanco: ' + JSON.stringify(p));
  // huye
  e = igualada(1); e.bandos[1].ia = false; e.regs[e.sectores[1].filas[0].frente[0]].animo = 3; p = B.pulso(e, 1).pausa; assert(p && p.tipo === 'huye' && p.grave, 'huye: ' + JSON.stringify(p));
  // general en peligro
  e = igualada(1); e.bandos[1].ia = false; e.sectores[1].linea = -2; p = B.pulso(e, 1).pausa; assert(p && p.tipo === 'general', 'general: ' + JSON.stringify(p));
  // reserva enemiga
  e = B.crear({ semilla: 1, bandos: [{ regs: x('hastati', 12) }, { regs: x('hastati', 17), ia: false }] });
  assert(e.bandos[1].reserva.length >= 1);
  e = B.aplicar(e, [{ orden: 'relevar', sector: 1 }], 1).estado; p = B.pulso(e, 1).pausa;
  assert(p && /reserva enemiga/.test(p.motivo), 'reserva: ' + JSON.stringify(p));
  // ajuste «ninguna»: no hay pausas
  e = igualada(1, { pausas: 'ninguna' }); e.regs[e.sectores[1].filas[0].frente[0]].animo = 3; assert.strictEqual(B.pulso(e, 1).pausa, null);
  // «graves»: la carga no para, la huida sí
  e = igualada(1, { pausas: 'graves' }); e.bandos[1].ia = false; e = B.aplicar(e, [{ orden: 'cargar', sector: 0 }], 0).estado; assert.strictEqual(B.pulso(e, 1).pausa, null, 'graves: carga no para');
});

t('fin: dos sectores rotos, general caído con tropa desmoralizada, resistir y tope', () => {
  let e = igualada(1); e.bandos[1].ia = false; e.sectores[0].roto[1] = true; e.sectores[2].roto[1] = true;
  let r = B.pulso(e, 1); assert(r.estado.fin && r.estado.fin.ganador === 0 && r.pausa.tipo === 'fin');
  assert(r.estado.fin.resultado[0].hombres0 > 0 && r.sucesos.some(s => s.tipo === 'fin'));
  assert.strictEqual(B.pulso(r.estado, 1).pausa, null, 'terminada: no sigue');
  e = igualada(1); e.bandos[0].general.vivo = false; for (const r0 of enCampo(e, 0)) r0.animo = 2; r = B.pulso(e, 1);
  assert(r.estado.fin && r.estado.fin.ganador === 1 && /general/.test(r.estado.fin.motivo));
  e = igualada(1, { objetivo: { tipo: 'resistir', seg: 20 } }); e.bandos[1].ia = false; e = correr(e, 1, 12);
  assert(e.fin && e.fin.ganador === 0 && e.t === 20, 'resistir: ' + JSON.stringify(e.fin));
  e = igualada(1); e.t = 898; e = B.pulso(e, 1).estado; assert(e.fin && /tope/.test(e.fin.motivo));
});

t('consejo: tres planes de tres tipos distintos, con etiqueta y motivo', () => {
  const e = igualada(2); const c = B.consejo(e, 0);
  assert.strictEqual(c.planes.length, 3); assert.deepStrictEqual(c.planes.map(p => p.id), ['prudente', 'agresivo', 'astuto']);
  for (const p of c.planes) { assert(['Favorable', 'Dudoso', 'Arriesgado'].includes(p.etiqueta)); assert(p.motivo.length > 15 && p.motivo.endsWith('.')); assert(p.tribuno.n); assert.strictEqual(p.posturas.length, 3); assert(p.ordenes.length >= 3 && p.gasto >= 0); }
  const firmas = new Set(c.planes.map(p => p.posturas.join('|') + '/' + p.ordenes.length + '/' + p.sectorClave)); assert.strictEqual(firmas.size, 3, 'planes distintos: ' + [...firmas]);
  assert(c.gesto && /\./.test(c.gesto)); assert.strictEqual(c.mando, 5);
  // etiquetas por umbral: con mucha ventaja en el sector clave, el plan agresivo es Favorable; con desventaja, Arriesgado
  const f = igualada(2); for (const id of f.sectores[1].filas[0].frente.concat(f.sectores[1].filas[0].apoyo)) f.regs[id].n = 10;
  const d = B.consejo(f, 0); assert(d.planes.some(p => p.etiqueta === 'Arriesgado'), 'desventaja: algún plan Arriesgado: ' + JSON.stringify(d.planes.map(p => [p.id, p.etiqueta, p.razon])));
  const g = igualada(2); for (const id of g.sectores[0].filas[1].frente.concat(g.sectores[0].filas[1].apoyo)) g.regs[id].n = 8;
  assert(B.consejo(g, 0).planes.some(p => p.etiqueta === 'Favorable'), 'ventaja: algún plan Favorable');
  // los planes se pueden aplicar
  const r = B.aplicar(e, c.planes.find(p => p.factible).ordenes, 0); assert(r.rechazadas.length === 0, JSON.stringify(r.rechazadas));
});

t('enemigo: anuncia gesto y elige plan de Battle.PLANES', () => {
  const e = igualada(2); const eg = e.bandos[1];
  assert(Object.keys(B.PLANES).includes(eg.plan)); assert(eg.gesto && /\.$/.test(eg.gesto.texto));
  const vistos = new Set(); for (let s = 1; s <= 30; s++) vistos.add(igualada(s).bandos[1].plan); assert(vistos.size >= 3, 'varios planes: ' + [...vistos]);
});

// ---- el bot que elige siempre «Favorable» ----
function botBatalla(sd, modo) {
  let e = igualada(sd), pausas = 0;
  while (!e.fin && e.pulsos < 700) {
    if (modo === 'bot' && e.pulsos % 5 === 1) {
      const c = B.consejo(e, 0); let p = null;
      for (const et of ['Favorable', 'Dudoso', 'Arriesgado']) { p = c.planes.filter(q => q.etiqueta === et && q.factible).sort((a, b) => b.razon - a.razon)[0]; if (p) break; }
      if (p) e = B.aplicar(e, p.ordenes, 0).estado;
    }
    const r = B.pulso(e, sd); e = r.estado; if (r.pausa && r.pausa.tipo !== 'fin') pausas++;
  }
  return { e: e, pausas: pausas };
}
let bot = 0, pasivo = 0; const duraciones = [];
t('bot «siempre Favorable»: gana 4 o más de 10 batallas igualadas (semillas 1 a 10)', () => {
  for (let s = 1; s <= 10; s++) { const r = botBatalla(s, 'bot'); assert(r.e.fin, 'termina ' + s); if (r.e.fin.ganador === 0) bot++; const q = botBatalla(s, 'pasivo'); if (q.e.fin.ganador === 0) pasivo++; duraciones.push(q.e.t); }
  console.log('     bot', bot + '/10', '· sin órdenes', pasivo + '/10');
  assert(bot >= 4, 'el bot ganó solo ' + bot);
});
t('una batalla igualada dura unos 4 minutos de reloj (sin contar pausas)', () => {
  const d = [];
  for (let s = 1; s <= 10; s++) { let e = igualada(s); e.bandos[0].ia = true; e.bandos[0].car = CARS[(s + 1) % 4]; e = correr(e, s, 900); d.push(e.t); }
  d.sort((a, b) => a - b); const med = d[5], media = d.reduce((a, b) => a + b, 0) / d.length;
  console.log('     duraciones (s):', d.join(' '), '· mediana', med);
  assert(med >= 180 && med <= 300 && media >= 170 && media <= 320, 'mediana ' + med + ', media ' + Math.round(media));
});


// ================= NB2: las cuatro maniobras y el enemigo =================
const CERROS = { sectores: [{ tipo: 'cerro', dueno: 0 }, { tipo: 'cerro', dueno: 0 }, { tipo: 'cerro', dueno: 0 }] };
const mini = (extra, car0, car1, f) => { const e = B.crear(Object.assign({ semilla: 1, bandos: [{ regs: ejercito().map(r => Object.assign({}, r, { n: Math.round(80 * (f || 1)) })), car: car0 || 'equilibrado', ia: false }, { regs: ejercito(), car: car1 || 'equilibrado', ia: false }] }, extra || {})); return e; };
const avanza = (e, seg, sd) => { for (let i = 0; i < seg / 2; i++) e = B.pulso(e, sd || 1).estado; return e; };

t('rodear: pide terreno y mando 2; el regimiento sale y entra ~20 s después por la espalda', () => {
  let e = mini();
  assert.strictEqual(B.aplicar(e, [{ orden: 'rodear', sector: 0, objetivo: 1 }], 0).rechazadas.length, 1, 'llano: no se rodea');
  e = mini({ terreno: { sectores: [{ tipo: 'bosque' }, {}, {}] } });
  assert.strictEqual(B.aplicar(e, [{ orden: 'rodear', sector: 1, objetivo: 1 }], 0).rechazadas.length, 1, 'el centro no es un ala');
  const a = B.aplicar(e, [{ orden: 'rodear', sector: 0, objetivo: 1 }], 0); assert.strictEqual(a.rechazadas.length, 0); assert.strictEqual(a.gasto, 2); assert.strictEqual(a.mando, 3);
  assert(a.sucesos.some(s => s.tipo === 'rodeo' && /por el bosque/.test(s.txt)));
  e = a.estado; const id = a.sucesos.find(s => s.tipo === 'rodeo').reg; assert.strictEqual(e.regs[id].lugar, 'rodeo');
  for (const s of e.sectores) for (const f of [s.filas[0].frente, s.filas[0].apoyo]) assert(!f.includes(id), 'ya no está en ninguna fila');
  let visto = null; for (let i = 0; i < 12 && !visto; i++) { const r = B.pulso(e, 1); e = r.estado; visto = r.sucesos.find(s => s.tipo === 'rodeoLlega'); if (!visto) assert.strictEqual(e.regs[id].lugar, 'rodeo'); }
  assert(visto && e.t >= 20 && e.t <= 22 && /entran por la espalda del centro/.test(visto.txt), JSON.stringify(visto));
  assert.strictEqual(e.regs[id].sector, 1); assert(e.regs[id].lugar === 'frente' || e.regs[id].lugar === 'apoyo'); assert.strictEqual(e.regs[id].animo, 0, 'llega entero');
  assert(B.golpe(e, 1, 0).g > B.golpe(mini(), 1, 0).g * 1.2, 'golpe de sorpresa');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(e)), e);
});

t('rodear: si el enemigo «vigila el flanco», lo intercepta y llega Vacilante', () => {
  let e = mini({ terreno: { sectores: [{ tipo: 'cerro', dueno: 0 }, {}, {}] } });
  e = B.aplicar(e, [{ orden: 'vigilar', sector: 1 }], 1).estado; assert(/vigila el flanco/.test(B.consejo(e, 0).gesto), B.consejo(e, 0).gesto);
  const a = B.aplicar(e, [{ orden: 'rodear', sector: 0, objetivo: 1 }], 0); e = a.estado; const id = a.sucesos.find(s => s.tipo === 'rodeo').reg;
  let v = null; for (let i = 0; i < 12 && !v; i++) { const r = B.pulso(e, 1); e = r.estado; v = r.sucesos.find(s => s.tipo === 'rodeoInterceptado'); }
  assert(v && e.regs[id].animo >= 1 && /Vacilante/.test(v.txt), 'interceptado: ' + JSON.stringify(v));
});

t('mover: 1 de mando, solo a un vecino, tarda ~10 s y el sector queda con uno menos', () => {
  let e = mini(); const antes = e.sectores[1].filas[0].frente.length + e.sectores[1].filas[0].apoyo.length, antes0 = e.sectores[0].filas[0].frente.length + e.sectores[0].filas[0].apoyo.length;
  assert.strictEqual(B.aplicar(e, [{ orden: 'mover', sector: 1, a: 1 }, { orden: 'mover', sector: 0, a: 2 }], 0).rechazadas.length, 2, 'solo vecinos');
  const a = B.aplicar(e, [{ orden: 'mover', sector: 1, a: 0 }], 0); assert.strictEqual(a.gasto, 1); e = a.estado; const id = a.sucesos[0].reg;
  assert.strictEqual(e.regs[id].lugar, 'marcha'); assert.strictEqual(e.sectores[1].filas[0].frente.length + e.sectores[1].filas[0].apoyo.length, antes - 1);
  e = avanza(e, 4); assert.strictEqual(e.regs[id].lugar, 'marcha', 'sigue en marcha');
  e = avanza(e, 8); assert.strictEqual(e.regs[id].sector, 0, 'llega al ala'); assert.strictEqual(e.sectores[0].filas[0].frente.length + e.sectores[0].filas[0].apoyo.length, antes0 + 1);
  assert.strictEqual(B.hombres(e, 0) > 0 && Object.values(e.regs).filter(r => r.bando === 0 && r.lugar === 'marcha').length, 0);
});

t('reserva oculta: el enemigo no la ve ni la cuenta; golpe ×1,3 al entrar; se descubre pasado el minuto 2', () => {
  const regs = () => x('hastati', 12).concat(x('principes', 4));
  let e = B.crear({ semilla: 1, bandos: [{ regs: regs(), general: null }, { regs: regs().map((r, i) => Object.assign({}, r, { oculto: i === 15 })), ia: false }] });
  e.bandos[0].ia = false;
  assert.strictEqual(e.bandos[1].reserva.length, 1); assert(e.regs[e.bandos[1].reserva[0]].oculto);
  assert.strictEqual(B.reservaVisible(e, 1), 0); assert.strictEqual(B.consejo(e, 0).reservaEnemiga, 0, 'el consejo no la cuenta');
  // al entrar: golpe ×1,3 durante 10 s
  const g0 = B.golpe(e, 1, 1).g; let a = B.aplicar(e, [{ orden: 'relevar', sector: 1 }], 1); const rid = e.bandos[1].reserva[0];
  assert(a.estado.regs[rid].lugar !== 'reserva' && !a.estado.regs[rid].oculto && a.sucesos.some(s => /reserva oculta/.test(s.txt)));
  const ref = JSON.parse(JSON.stringify(a.estado)); ref.regs[rid].golpeHasta = 0;
  assert(B.golpe(a.estado, 1, 1).g > B.golpe(ref, 1, 1).g && a.estado.regs[rid].golpeMul === 1.3 && a.estado.regs[rid].golpeHasta === a.estado.t + 10, 'el regimiento golpea ×1,3 durante 10 s al entrar');
  let b2 = avanza(a.estado, 12); assert(b2.regs[rid].golpeHasta <= b2.t, 'pasados 10 s, vuelve a lo normal');
  // se descubre tras el minuto 2 y salta la pausa «reserva enemiga»
  let p = null, d = JSON.parse(JSON.stringify(e)); d.t = 110; while (d.t < 130 && !d.fin && !(p && /reserva enemiga/.test(p.motivo))) { const r = B.pulso(d, 1); d = r.estado; p = r.pausa; }
  assert(p && /reserva enemiga/.test(p.motivo) && d.t >= 120, 'pausa: ' + JSON.stringify(p)); assert(!d.regs[rid].oculto);
  // la orden «reservaOculta» esconde una reserva propia sin gastar mando
  const f = B.crear({ semilla: 1, bandos: [{ regs: x('hastati', 17), general: null }, { regs: x('hastati', 6) }] });
  const h = B.aplicar(f, [{ orden: 'reservaOculta' }], 0); assert.strictEqual(h.gasto, 0); assert(h.estado.regs[h.estado.bandos[0].reserva[0]].oculto);
});

t('retirada fingida: cede 2 pasos sin perder ánimo; si el enemigo entra y los vecinos aguantan, bolsa con −1 ánimo cada 10 s', () => {
  let e = mini({ terreno: CERROS }, 'equilibrado', 'impetuoso', 1);
  assert.strictEqual(B.aplicar(e, [{ orden: 'fingir', sector: 0 }], 0).gasto, 2);
  const a = B.aplicar(e, [{ orden: 'fingir', sector: 0 }], 0); e = a.estado; assert.strictEqual(e.sectores[0].posturas[0], 'retirarse');
  assert.strictEqual(B.aplicar(e, [{ orden: 'fingir', sector: 1 }], 0).rechazadas.length, 1, 'no dos vecinos a la vez');
  assert.strictEqual(B.aplicar(e, [{ orden: 'aguantar', sector: 0 }], 0).rechazadas.length, 1, 'mientras finge, no se cambia la postura a mano');
  const fr = e.sectores[0].filas[0].frente.map(id => e.regs[id]); let bolsa = null, visto = new Set();
  for (let i = 0; i < 40 && !bolsa; i++) { const r = B.pulso(e, 1); e = r.estado; fr.forEach(f => visto.add(e.regs[f.id].animo)); bolsa = r.sucesos.find(s => s.tipo === 'bolsa'); }
  assert(bolsa && /bolsa del ala izquierda/.test(bolsa.txt), 'bolsa: ' + JSON.stringify(bolsa)); assert.strictEqual(e.sectores[0].linea <= -1, true); assert(Math.max.apply(null, [...visto]) === 0, 'no perdió ánimo cediendo');
  const enem = e.sectores[0].filas[1].frente.map(id => e.regs[id]); const a0 = enem.map(r => r.animo);
  e = avanza(e, 12); assert(enem.some((r, i) => e.regs[r.id].animo > a0[i]), 'el enemigo en la bolsa pierde ánimo');
  assert(B.golpe(e, 0, 0).g > 0);
  // si un vecino también cede, se rompe de verdad
  let g = mini({ terreno: CERROS }, 'equilibrado', 'impetuoso', 1); g.bandos[0].mando = 5;
  g = B.aplicar(g, [{ orden: 'fingir', sector: 0 }, { orden: 'retirarse', sector: 1 }], 0).estado;
  let roto = null; for (let i = 0; i < 6 && !roto; i++) { const r = B.pulso(g, 1); g = r.estado; roto = r.sucesos.find(s => s.tipo === 'roto' && /de verdad/.test(s.txt)); }
  assert(roto && g.sectores[0].roto[0], 'se rompe de verdad: ' + JSON.stringify(roto));
});

t('consejo: ofrece planes con las maniobras (el astuto rodea o finge) y se pueden aplicar', () => {
  let e = mini({ terreno: { sectores: [{ tipo: 'bosque' }, {}, {}] } }); let c = B.consejo(e, 0); const ast = c.planes.find(p => p.id === 'astuto');
  assert(ast.ordenes.some(o => o.orden === 'rodear') && /Rodear/.test(ast.titulo) && ast.factible, JSON.stringify(ast.ordenes));
  assert.strictEqual(B.aplicar(e, ast.ordenes, 0).rechazadas.length, 0);
  e = mini({ terreno: CERROS }, 'equilibrado', 'impetuoso', 0.75); e.bandos[0].car = 'astuto'; c = B.consejo(e, 0); const a2 = c.planes.find(p => p.id === 'astuto');
  assert(a2.ordenes.some(o => o.orden === 'fingir' || o.orden === 'rodear') && a2.factible, JSON.stringify(a2.ordenes) + a2.titulo);
  assert.strictEqual(B.aplicar(e, a2.ordenes, 0).rechazadas.length, 0, JSON.stringify(B.aplicar(e, a2.ordenes, 0).rechazadas));
  assert.strictEqual(c.planes.length, 3);
});

t('enemigo: el astuto finge o rodea, el impetuoso nunca finge, el prudente esconde reserva y vigila', () => {
  const cuenta = (car, terr) => { const c = { fingir: 0, rodear: 0, vigilar: 0, oculta: 0 };
    for (let sd = 1; sd <= 8; sd++) { let e = B.crear({ semilla: sd, terreno: terr, bandos: [{ regs: ejercito().map(r => Object.assign({}, r, { n: 60 })), car: 'equilibrado', ia: false }, { regs: ejercito(), car: car }] });
      if (e.bandos[1].reserva.some(i => e.regs[i].oculto)) c.oculta++;
      while (!e.fin && e.pulsos < 200) { const r = B.pulso(e, sd); e = r.estado; for (const s of r.sucesos) { if (s.bando === 1 && s.tipo === 'fingida' && /cede terreno/.test(s.txt)) c.fingir++; if (s.bando === 1 && s.tipo === 'rodeo') c.rodear++; if (s.bando === 1 && s.tipo === 'vigila') c.vigilar++; } } }
    return c; };
  const ast = cuenta('astuto', CERROS), imp = cuenta('impetuoso', CERROS), pru = cuenta('prudente', CERROS);
  console.log('     astuto', JSON.stringify(ast), '· impetuoso', JSON.stringify(imp), '· prudente', JSON.stringify(pru));
  assert(ast.fingir + ast.rodear >= 3, 'el astuto usa fingida y rodeo'); assert.strictEqual(imp.fingir, 0, 'el impetuoso nunca finge'); assert.strictEqual(imp.rodear + imp.vigilar, 0);
  assert(pru.oculta >= 6 && pru.vigilar >= 1, 'el prudente guarda reserva oculta y vigila'); assert.strictEqual(pru.fingir + pru.rodear, 0);
  assert.strictEqual(ast.oculta, 0);
  // en llano, un astuto más débil al que aprietan también finge
  let fing = 0; for (let sd = 1; sd <= 8; sd++) { let e = B.crear({ semilla: sd, bandos: [{ regs: ejercito(), car: 'equilibrado', ia: false }, { regs: ejercito().map(r => Object.assign({}, r, { n: 60 })), car: 'astuto' }] });
    e = B.aplicar(e, [{ orden: 'avanzar', sector: 0 }, { orden: 'avanzar', sector: 1 }, { orden: 'avanzar', sector: 2 }], 0).estado;
    while (!e.fin && e.pulsos < 120) { const r = B.pulso(e, sd); e = r.estado; fing += r.sucesos.filter(s => s.bando === 1 && s.tipo === 'fingida' && /cede terreno/.test(s.txt)).length; } }
  console.log('     astuto débil en llano: retiradas fingidas', fing); assert(fing >= 1, 'el astuto sin terreno finge');
});

// ---- ejército a 0,75× con las maniobras bien hechas (bot astuto) frente al mismo sin ellas ----
const MANIOBRAS = ['rodear', 'fingir', 'mover', 'reservaOculta', 'vigilar'];
function botAstuto(sd, conMan, carE) {
  let e = B.crear({ semilla: sd, terreno: CERROS, bandos: [{ nombre: 'Roma', regs: ejercito().map(r => Object.assign({}, r, { n: 60 })), car: 'astuto' }, { nombre: 'Cartago', regs: ejercito(), car: carE }] });
  while (!e.fin && e.pulsos < 700) {
    if (e.pulsos % 5 === 0) { const p = B.consejo(e, 0).planes.find(q => q.id === 'astuto'); if (p && p.factible) e = B.aplicar(e, conMan ? p.ordenes : p.ordenes.filter(o => MANIOBRAS.indexOf(o.orden) < 0), 0).estado; }
    e = B.pulso(e, sd).estado;
  }
  return e.fin && e.fin.ganador === 0;
}
t('ejército a 0,75× con rodeo o retirada fingida bien hechos gana 3 o más de 10; sin maniobras, menos', () => {
  let con = 0, sin = 0;
  for (let sd = 1; sd <= 10; sd++) { if (botAstuto(sd, true, 'impetuoso')) con++; if (botAstuto(sd, false, 'impetuoso')) sin++; }
  console.log('     a 0,75×: con maniobras', con + '/10 · sin ellas', sin + '/10');
  assert(con >= 3, 'con maniobras ganó solo ' + con); assert(sin < con, 'sin maniobras no debe ganar más (' + sin + ')');
});

console.log(mal ? '\n' + mal + ' fallos de ' + (n + mal) : '\n' + n + ' pruebas bien');
process.exit(mal ? 1 : 0);
