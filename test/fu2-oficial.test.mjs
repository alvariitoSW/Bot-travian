/* AQVILA — FU2: el duelo del oficial en la escena única del bloque, sin pantalla. node test/fu2-oficial.test.mjs (unos segundos)
   a) parar a tiempo abre al galo y dos estocadas abiertas lo matan (su bloque pierde uno);
   b) sin parar, a la 3.ª herida caes y pasas al siguiente de tu columna (o de la primera fila); tu bloque pierde uno;
   c) estocada sin abrir: te la para y su contraataque no se puede parar;
   d) mantener la guardia gasta aliento y, sin aliento, no para;
   e) pilum: dos lanzamientos, el 3.º no; uno al centro de un bloque enemigo mata a uno;
   f) en 200 s de lucha con el bot, las reglas no matan al hombre que eres tú mientras quede otro;
   g) sin oficial, el combate da lo mismo que antes (resumen igual con y sin h.yo). */
import assert from 'node:assert';
import * as IA from '../js/bloque-ia.js';
import * as BL from '../js/bloque.js';
import { crearOficial, VENTANA, C_PAR, HERIDAS, CONTRA } from '../gobierno/maquetas/bloque/oficial.js';
const { crearCombate, DT } = IA;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const azarDe = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

/* lleva el combate al choque con el bot y lo deja quieto ahí (las pruebas del duelo solo mueven el oficial) */
function alChoque(semilla = 1) {
  const C = crearCombate({ semilla, nivel: 'normal', motor: BL }), S = C.S;
  while (!S.tuyo.contactos.length && S.T < 200) { C.bot('bueno'); C.paso(DT); }
  assert.ok(S.tuyo.contactos.length, 'hay choque');
  const ev = [], O = crearOficial({ S, azar: azarDe(semilla * 97 + 5), alAviso: (tipo, d) => ev.push({ tipo, d }) });
  return { C, S, O, ev };
}
const pasa = (O, s) => { for (let k = 0; k < Math.round(s / DT); k++) O.paso(DT); };
function hastaArma(O) { for (let k = 0; k < 200; k++) { O.paso(DT); const r = O.estado().rival; if (r && r.fase === 'arma') return O.rival; } throw new Error('el galo no arma'); }
/* para a tiempo: empieza a mantener 0,3 s antes del golpe y suelta cuando ha golpeado */
function paraATiempo(O) {
  const r = hastaArma(O); let falta = r.ts - r.t0;   /* el galo acaba de armar: falta lo que va de t0 al golpe */
  while (O.rival.pendiente && falta > 0.3) { O.paso(DT); falta -= DT; }
  O.pide('parar'); while (O.rival.pendiente) O.paso(DT); O.pide('suelta-parar');
}

t('a) parar a tiempo deja al galo abierto y dos estocadas abiertas lo matan', () => {
  for (const semilla of [1, 2, 3]) {
    const { S, O, ev } = alChoque(semilla); let estocadas = 0;
    assert.ok(O.yo() && O.yo().yo && O.yo().fila === 0, 'eres uno de la primera fila');
    while (O.estado().muertes === 0 && estocadas < 2) {
      while (O.estado().aliento < 60) O.paso(DT);
      paraATiempo(O);
      assert.strictEqual(ev.filter(e => e.tipo === 'golpe').pop().d.res, 'parado', 'parado a tiempo');
      assert.strictEqual(O.estado().rival.fase, 'abierto', 'el galo queda abierto');
      const b = O.rival.b, antes = b.U.enPie; O.pide('estocada'); estocadas++;
      const e = ev.filter(e => e.tipo === 'estocada').pop().d.res; assert.ok(e === 'entra' || e === 'mata', 'la estocada entra');
      if (e === 'mata') { assert.strictEqual(b.U.enPie, antes - 1, 'su bloque pierde uno'); assert.ok(O.rival.marcado, 'rival marcado para la escena'); }
    }
    assert.strictEqual(O.estado().muertes, 1, 'muere a la 2.ª como mucho (semilla ' + semilla + ')');
    console.log(`     semilla ${semilla}: muerto en ${estocadas} estocada(s) · eres ${O.yo().i}`);
  }
});
t('b) sin parar, a la 3.ª herida caes y pasas al siguiente; tu bloque pierde uno', () => {
  const { S, O, ev } = alChoque(2), yo0 = O.yo(); let antes = S.tuyo.U.enPie, k = 0;
  while (O.estado().caidas === 0 && k++ < 2000) { antes = S.tuyo.U.enPie; O.paso(DT); }
  assert.strictEqual(ev.filter(e => e.tipo === 'golpe' && e.d.res === 'herido').length, HERIDAS - 1, 'dos heridas antes');
  assert.strictEqual(S.tuyo.U.enPie, antes - 1, 'tu bloque pierde uno'); assert.ok(!yo0.vivo && !yo0.yo, 'el de antes cae');
  const yo1 = O.yo(); assert.ok(yo1 && yo1.vivo && yo1.yo && yo1 !== yo0, 'eres otro hombre vivo');
  assert.ok(yo1.col === yo0.col || yo1.fila === 0, 'de tu columna o de la primera fila');
  assert.ok(/^El centurión ha caído: ahora eres /.test(O.estado().eco.texto), O.estado().eco.texto);
  assert.strictEqual(O.estado().heridas, 0, 'el nuevo empieza sano');
});
t('c) estocada sin abrir: te la para y el contraataque no se puede parar', () => {
  const { O, ev } = alChoque(3); pasa(O, 0.2);
  assert.ok(O.estado().duelo, 'hay duelo'); O.pide('estocada');
  assert.strictEqual(ev.filter(e => e.tipo === 'estocada').pop().d.res, 'parada');
  O.pide('parar'); pasa(O, CONTRA + 0.2); O.pide('suelta-parar');
  assert.strictEqual(ev.filter(e => e.tipo === 'golpe').pop().d.res, 'herido', 'el contraataque te hiere aunque pares');
  assert.strictEqual(O.estado().heridas, 1);
});
t('d) mantener gasta aliento y sin aliento no para', () => {
  const { O, ev } = alChoque(4); const a0 = O.estado().aliento; O.pide('parar'); pasa(O, 1);
  assert.ok(Math.abs(a0 - O.estado().aliento - C_PAR) < 3, 'gasta unos ' + C_PAR + ' por segundo (' + O.estado().aliento.toFixed(1) + ')');
  pasa(O, 4); assert.strictEqual(O.estado().aliento, 0, 'sin aliento'); assert.ok(O.estado().parando);
  const h0 = O.estado().heridas, e0 = ev.length; let k = 0; while (O.estado().heridas === h0 && O.estado().caidas === 0 && k++ < 300) O.paso(DT);
  assert.ok(O.estado().heridas > h0 || O.estado().caidas > 0, 'sin aliento, el golpe entra');
  assert.ok(!ev.slice(e0).some(e => e.tipo === 'golpe' && (e.d.res === 'parado' || e.d.res === 'aguanta')), 'no paró nada sin aliento');
});
t('e) pilum: dos lanzamientos, el 3.º no; al centro de un bloque enemigo mata a uno', () => {
  const C = crearCombate({ semilla: 1, nivel: 'normal', motor: BL, lejos: 25 }), S = C.S, ev = [];
  const O = crearOficial({ S, azar: azarDe(7), alAviso: (tipo, d) => ev.push({ tipo, d }) });
  const b = S.ene.centro, c = IA.centro(b), antes = b.U.enPie, coh = b.coh;
  O.pide('pilum-arma'); pasa(O, 1); assert.strictEqual(O.estado().carga, 1, 'carga llena');
  const v1 = O.pide('pilum-suelta', c); assert.ok(v1 && v1.dur > 0, 'primer lanzamiento'); assert.ok(Math.hypot(v1.a.x - c.x, v1.a.z - c.z) < 0.5, 'llega al punto');
  pasa(O, v1.dur + 0.2); assert.strictEqual(b.U.enPie, antes - 1, 'cae uno'); assert.strictEqual(b.coh, coh - 3); assert.strictEqual(O.estado().eco.texto, '¡Pilum! Cae uno');
  O.pide('pilum-arma'); pasa(O, 0.1); assert.strictEqual(O.pide('pilum-suelta', c), null, 'con poca carga no sale');
  O.pide('pilum-arma'); pasa(O, 1); const v2 = O.pide('pilum-suelta', { x: 60, z: 0 }); assert.ok(v2, 'segundo lanzamiento');
  assert.ok(Math.abs(Math.hypot(v2.a.x - v2.de.x, v2.a.z - v2.de.z) - 30) < 0.01, 'alcance máximo 30 m');
  pasa(O, v2.dur + 0.2); assert.strictEqual(O.estado().eco.texto, 'Al suelo');
  O.pide('pilum-arma'); pasa(O, 1); assert.strictEqual(O.pide('pilum-suelta', c), null, 'el 3.º no'); assert.strictEqual(O.estado().pilum, 0);
  assert.strictEqual(ev.filter(e => e.tipo === 'pilum').length, 2);
});
t('f) en 200 s de lucha con el bot, las reglas no matan al hombre que eres tú mientras quede otro', () => {
  for (const conDuelo of [false, true]) for (const semilla of [1, 2, 3]) {
    const C = crearCombate({ semilla, nivel: 'normal', motor: BL }), S = C.S, O = crearOficial({ S, azar: azarDe(semilla) });
    let caidasReglas = 0;
    while (!S.ganador && S.T < 200) {
      const yo = O.yo(), c0 = O.estado().caidas; C.bot('bueno'); C.paso(DT); if (conDuelo) O.paso(DT);
      if (yo && !yo.vivo && O.estado().caidas === c0 && S.B.hombres.some(h => h.vivo)) caidasReglas++;
    }
    assert.strictEqual(caidasReglas, 0, 'semilla ' + semilla); if (!conDuelo) assert.ok(O.yo() && O.yo().vivo || !S.B.hombres.some(h => h.vivo), 'sigues en pie');
    console.log(`     ${conDuelo ? 'con duelo' : 'sin duelo'} semilla ${semilla}: «${S.ganador || 'sin final'}» a los ${S.T.toFixed(0)} s · caídas en duelo ${O.estado().caidas} · muertes ${O.estado().muertes}`);
  }
});
t('g) sin llamar al oficial, el combate da lo mismo con y sin h.yo', () => {
  for (const semilla of [1, 5]) {
    const juega = conYo => { const C = crearCombate({ semilla, nivel: 'normal', motor: BL }); if (conYo) crearOficial({ S: C.S }); while (!C.S.ganador && C.S.T < 300) { C.bot('bueno'); C.paso(DT); } return JSON.stringify(C.resumen()); };
    assert.strictEqual(juega(true), juega(false), 'semilla ' + semilla);
  }
});
console.log(`\n${mal ? 'NO APTO' : 'APTO'} · ${n} bien, ${mal} mal`); process.exit(mal ? 1 : 0);
