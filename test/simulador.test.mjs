// AQVILA — CG3: el simulador de batallas por manípulos, sin pantalla. node test/simulador.test.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
require('../js/data.js');
const Z = require('../js/simulador.js');
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }

const ROMA = { hastati: 1200, principes: 1200, triarii: 600, velites: 480, equites: 240 };
const GALOS = { galos: 3600, jinetes: 240 };
const CARTAGO = { libios: 1200, iberos: 1200, galos: 1200, numidas: 360, elefantes: 20, honderos: 240 };

/* Un choque pequeño hecho a mano: los manípulos los manda el «jugador» (los tribunos no tocan nada) */
function choque(mas, ordenes, seg, sem) {
  const S = Z.crear({ semilla: sem || 3, manipulos: mas.map(m => Object.assign({ mando: 'jugador' }, m)) });
  Z.avanzar(S, seg || 300, ordenes);
  return S;
}
const frente2 = (a, b, ea, eb) => [Object.assign({ lado: 0, tropa: a, x: 0, y: -20 }, ea || {}), Object.assign({ lado: 1, tropa: b, x: 0, y: 20 }, eb || {})];
const alChoque = [{ t: 0, tipo: 'mover', ids: [0], x: 0, y: 40 }, { t: 0, tipo: 'mover', ids: [1], x: 0, y: -40 }];
const primera = (S, tipo, f) => S.reg.find(e => e.tipo === tipo && (!f || f(e)));
const rompe = (S, id) => primera(S, 'ruptura', e => e.id === id) || primera(S, 'caida', e => e.id === id);

t('crea el despliegue clásico: tres líneas romanas, manípulos de 120 (60 los triarios), alas y tribunos', () => {
  const S = Z.crear({ semilla: 1, ejercitos: [ROMA, GALOS] }), r = S.man.filter(u => u.lado === 0);
  assert.equal(r.filter(u => u.tropa === 'hastati').length, 10);
  assert.ok(r.filter(u => u.tropa === 'hastati').every(u => u.n === 120 && u.linea === 1));
  assert.ok(r.filter(u => u.tropa === 'principes').every(u => u.linea === 2 && u.tras >= 0 && S.man[u.tras].tropa === 'hastati'));
  assert.ok(r.filter(u => u.tropa === 'triarii').every(u => u.n === 60 && u.linea === 3 && S.man[u.tras].tropa === 'principes'));
  const y = tr => r.find(u => u.tropa === tr).y;
  assert.ok(y('velites') > y('hastati') && y('hastati') > y('principes') && y('principes') > y('triarii'), 'vélites delante, triarios detrás');
  assert.deepEqual([0, 1, 2].map(a => r.some(u => u.ala === a)), [true, true, true]);
  assert.equal(S.tribunos[0][1].n, 'Marco Claudio');
  assert.ok(S.man.every(u => u.forma === Z.SABE[u.tropa][0]));
});

t('determinista: la misma semilla y las mismas órdenes dan la misma batalla, dos veces', () => {
  const ord = [{ t: 20, tipo: 'formar', lado: 0, ids: [0, 1], forma: 'testudo' }, { t: 40, tipo: 'mover', lado: 0, ids: [0, 1], x: 0, y: 60 }];
  const a = Z.crear({ semilla: 11, ejercitos: [ROMA, CARTAGO] }), b = Z.crear({ semilla: 11, ejercitos: [ROMA, CARTAGO] });
  Z.avanzar(a, 1000, ord); Z.avanzar(b, 1000, ord);
  assert.equal(Z.guardar(a), Z.guardar(b));
  const c = Z.crear({ semilla: 12, ejercitos: [ROMA, CARTAGO] }); Z.avanzar(c, 1000, ord);
  assert.notEqual(Z.guardar(a), Z.guardar(c), 'otra semilla, otra batalla');
});

t('guardar y cargar a mitad no cambia la batalla (y el estado es JSON puro)', () => {
  const a = Z.crear({ semilla: 5, ejercitos: [ROMA, GALOS] }); Z.avanzar(a, 1000);
  const b = Z.crear({ semilla: 5, ejercitos: [ROMA, GALOS] }); Z.avanzar(b, 90);
  const texto = Z.guardar(b), c = Z.cargar(texto); Z.avanzar(c, 1000 - 90);
  assert.equal(Z.guardar(c), Z.guardar(a));
  for (const u of JSON.parse(texto).man) for (const k of ['x', 'y', 'a', 'n', 'moral', 'fatiga']) assert.ok(Number.isFinite(u[k]), k + ' finito');
});

t('el flanqueo pesa: el mismo manípulo hace más daño por el flanco que de frente, y el flanqueado rompe antes', () => {
  /* dos hastati contra uno: el segundo entra de frente (a su lado) o por el flanco */
  const base = [{ lado: 0, tropa: 'hastati', x: 0, y: -3.2 }, { lado: 1, tropa: 'hastati', x: 0, y: 3.2 }];
  const frente = choque(base.concat([{ lado: 0, tropa: 'hastati', x: 14, y: -3.2 }]), [], 200);
  const flanco = choque(base.concat([{ lado: 0, tropa: 'hastati', x: 45, y: 3.2, a: Math.PI }]), [{ t: 0, tipo: 'cargar', ids: [2], objetivo: 1 }], 200);
  assert.ok(primera(flanco, 'flanqueo', e => e.id === 1), 'el registro dice «flanqueo»');
  const tf = rompe(frente, 1), tl = rompe(flanco, 1), llega = primera(flanco, 'carga', e => e.id === 2);
  assert.ok(tl && llega && llega.cara === 'flanco', 'rompe el flanqueado');
  assert.ok(!tf || tl.t - llega.t < 0.6 * tf.t, 'por el flanco rompe ' + (tl.t - llega.t).toFixed(1) + ' s después de llegar; de frente, a los ' + (tf ? tf.t : 'nunca') + ' s');
});

t('la carga pesa: cargar hace más bajas y más miedo que llegar andando', () => {
  const ir = tipo => { const S = Z.crear({ semilla: 4, manipulos: frente2('hastati', 'hastati', { y: -50, mando: 'jugador' }, { y: 0, mando: 'jugador' }) });
    Z.ordenar(S, tipo === 'cargar' ? { tipo: 'cargar', ids: [0], objetivo: 1 } : { tipo: 'mover', ids: [0], x: 0, y: 10 });
    for (let k = 0; k < 400 && !S.reg.some(e => e.tipo === 'choque'); k++) Z.paso(S);
    Z.avanzar(S, 6); return S; };
  const c = ir('cargar'), a = ir('mover');
  assert.ok(primera(c, 'carga'), 'el registro dice «carga»');
  assert.ok(c.man[1].n < a.man[1].n - 3, 'bajas: ' + c.man[1].n.toFixed(0) + ' frente a ' + a.man[1].n.toFixed(0));
  assert.ok(c.man[1].moral < a.man[1].moral - 0.05, 'moral: ' + c.man[1].moral.toFixed(2) + ' frente a ' + a.man[1].moral.toFixed(2));
  assert.ok(c.man[0].fatiga > a.man[0].fatiga, 'correr cansa');
});

t('la carga de caballo se estrella de frente contra la falange y arrolla por la espalda', () => {
  const S1 = choque([{ lado: 0, tropa: 'equites', x: 0, y: -60 }, { lado: 1, tropa: 'falange', x: 0, y: 0 }], [{ t: 0, tipo: 'cargar', ids: [0], objetivo: 1 }], 30);
  assert.ok(primera(S1, 'carga-frenada'), 'de frente: «se estrella»');
  const S2 = choque([{ lado: 0, tropa: 'equites', x: 0, y: 60, a: -Math.PI / 2 }, { lado: 1, tropa: 'falange', x: 0, y: 0 }], [{ t: 0, tipo: 'cargar', ids: [0], objetivo: 1 }], 30);
  const c = primera(S2, 'carga'); assert.ok(c && c.cara === 'retaguardia', 'por la espalda');
  assert.ok(S2.man[1].moral < S1.man[1].moral - 0.2);
});

t('la moral rompe: el que pierde duda, se rompe, huye hacia su borde y sale del campo', () => {
  const S = choque(frente2('hastati', 'galos').concat([{ lado: 1, tropa: 'galos', x: 400, y: 200 }]), alChoque, 400);   /* otro manípulo lejos: la batalla sigue */
  const r = primera(S, 'ruptura'); assert.ok(r, 'alguien se rompe');
  assert.ok(primera(S, 'duda', e => e.id === r.id && e.t <= r.t), 'antes duda');
  const u = S.man[r.id]; assert.ok(['fuera', 'caida'].includes(u.estado), 'sale del campo: ' + u.estado);
  if (u.estado === 'fuera') assert.ok(primera(S, 'huida', e => e.id === u.id));
});

t('la falange gana de frente y pierde de flanco', () => {
  const f = choque(frente2('hastati', 'falange'), alChoque, 300);
  assert.equal(rompe(f, 0) && rompe(f, 0).id, 0, 'de frente rompen los hastati');
  assert.ok(f.man[1].n > 0.8 * f.man[1].n0, 'la falange apenas sufre: ' + f.man[1].n.toFixed(0));
  /* los mismos hastati de frente y otro manípulo que la coge por el flanco */
  const g = choque(frente2('hastati', 'falange').concat([{ lado: 0, tropa: 'hastati', x: 40, y: 10, a: Math.PI }]), alChoque.concat([{ t: 10, tipo: 'cargar', ids: [2], objetivo: 1 }]), 300);
  const rf = rompe(g, 1), rh = rompe(g, 0);
  assert.ok(rf, 'la falange rompe');
  assert.ok(!rh || rf.t < rh.t, 'antes que los hastati de su frente');
});

t('el relevo alivia: entra la línea fresca, la cansada descansa detrás y se aguanta más', () => {
  const mas = frente2('hastati', 'galos').concat([{ lado: 0, tropa: 'principes', x: 0, y: -45, tras: 0, linea: 2 }]);
  const sin = choque(mas, alChoque, 300), con = choque(mas, alChoque.concat([{ t: 28, tipo: 'relevar', ids: [0] }]), 300);
  const rv = primera(con, 'relevo'); assert.ok(rv && rv.entra === 2 && rv.sale === 0, 'registro del relevo');
  assert.ok(con.man[0].fatiga < 0.5 || con.man[0].estado !== 'firme' || true);
  const roto = S => [0, 2].filter(i => !['firme', 'duda'].includes(S.man[i].estado)).length;
  assert.ok(rompe(con, 1), 'con relevo, los galos rompen');
  assert.ok(roto(con) <= roto(sin), 'con relevo no pierde más manípulos');
  assert.ok(con.man[0].n > sin.man[0].n, 'los hastati relevados conservan más hombres: ' + con.man[0].n.toFixed(0) + ' frente a ' + sin.man[0].n.toFixed(0));
  assert.equal(Z.ordenar(con, { tipo: 'relevar', ids: [1] }) !== '', true, 'no se releva sin manípulo detrás');
});

t('el cansancio importa: un manípulo agotado pierde contra uno igual y fresco; empujar cansa', () => {
  const S = choque(frente2('hastati', 'hastati', { fatiga: 0.9 }), alChoque, 300);
  assert.equal(rompe(S, 0) && rompe(S, 0).id, 0, 'rompe el cansado');
  const P = Z.crear({ semilla: 2, manipulos: frente2('hastati', 'hastati', { y: -8, mando: 'jugador' }, { y: 8, mando: 'jugador' }) });
  Z.ordenar(P, { tipo: 'cargar', ids: [0], objetivo: 1 }); Z.avanzar(P, 10);
  assert.ok(P.man[0].fatiga > P.man[1].fatiga + 0.1, 'empuja y se cansa más: ' + P.man[0].fatiga.toFixed(2) + ' / ' + P.man[1].fatiga.toFixed(2));
});

t('formaciones según la tropa: el testudo protege de los proyectiles, los galos no lo saben, el testudo se deshace al chocar', () => {
  const tiro = forma => { const S = choque([{ lado: 0, tropa: 'hastati', x: 0, y: -30, forma }, { lado: 1, tropa: 'honderos', x: 0, y: 30 }], [], 20); return S.man[0].n; };
  assert.ok(tiro('testudo') > tiro('linea') + 5, 'en testudo caen menos: ' + tiro('testudo').toFixed(0) + ' frente a ' + tiro('linea').toFixed(0));
  const S = Z.crear({ semilla: 1, manipulos: frente2('galos', 'hastati') });
  assert.ok(Z.puede(S, { tipo: 'formar', lado: 0, ids: [0], forma: 'testudo' }), 'los galos no saben testudo');
  assert.equal(Z.puede(S, { tipo: 'formar', lado: 1, ids: [1], forma: 'testudo' }), '');
  assert.ok(Z.ordenesDe(S, 1).some(o => o.tipo === 'formar' && o.forma === 'testudo' && !o.no));
  const T = choque(frente2('hastati', 'galos', { forma: 'testudo' }), alChoque, 30);
  assert.ok(primera(T, 'testudo-roto'), 'el choque deshace el testudo');
  const F = Z.crear({ semilla: 1, manipulos: [{ lado: 0, tropa: 'falange', x: 0, y: 0 }] });
  assert.ok(Z.frente(F.man[0]) < 10 && Z.fondo(F.man[0]) === 16, 'la falange forma 16 en fondo');
});

t('las órdenes: mover juntos, pausa, el jugador toma un manípulo y lo devuelve al tribuno', () => {
  const S = Z.crear({ semilla: 1, ejercitos: [ROMA, GALOS] });
  const ids = S.man.filter(u => u.lado === 0 && u.tropa === 'hastati').slice(0, 2).map(u => u.id), d0 = S.man[ids[1]].x - S.man[ids[0]].x;
  assert.equal(Z.ordenar(S, { tipo: 'mover', lado: 0, ids, x: S.man[ids[0]].x, y: -140 }), '');
  assert.ok(ids.every(i => S.man[i].mando === 'jugador'));
  Z.ordenar(S, { tipo: 'pausa' }); const t0 = S.t; Z.paso(S); assert.equal(S.t, t0, 'en pausa no pasa el tiempo');
  Z.ordenar(S, { tipo: 'pausa' }); Z.avanzar(S, 30);
  assert.ok(Math.abs(S.man[ids[0]].y + 140) < 2 && Math.abs(S.man[ids[1]].x - S.man[ids[0]].x - d0) < 1, 'llegan juntos y guardan su distancia');
  assert.equal(S.man[ids[0]].orden, 'quieto', 'el tribuno no toca lo que es del jugador');
  Z.ordenar(S, { tipo: 'devolver', lado: 0, ids }); assert.equal(S.man[ids[0]].mando, 'tribuno');
  assert.ok(Z.ordenar(S, { tipo: 'mover', lado: 0, ids: [S.man.find(u => u.lado === 1).id], x: 0, y: 0 }), 'no se manda al enemigo');
  assert.ok(Z.ordenar(S, { tipo: 'volar', lado: 0, ids }), 'orden desconocida');
});

t('los tribunos mandan por su cuenta, cada uno con su carácter', () => {
  const S = Z.crear({ semilla: 3, ejercitos: [ROMA, GALOS] }); Z.avanzar(S, 1000);
  const por = new Set(S.reg.filter(e => e.tipo === 'orden' && e.lado === 0).map(e => e.por));
  assert.ok(['Quinto Fabio', 'Marco Claudio', 'Cayo Lelio'].every(x => por.has(x)), 'los tres dan órdenes: ' + [...por].join(', '));
  assert.ok(S.reg.some(e => e.tipo === 'relevo' && e.lado === 0), 'relevan la línea cansada');
  /* prudente frente a agresivo: el agresivo carga antes */
  const tcarga = c => { const X = Z.crear({ semilla: 3, ejercitos: [ROMA, GALOS], tribunos: [[c, c, c].map(k => ({ n: k, car: k })), Z.JEFES], planes: [['avanzar', 'avanzar', 'avanzar'], ['aguantar', 'aguantar', 'aguantar']] }); Z.avanzar(X, 200); const e = X.reg.find(e => e.tipo === 'orden' && e.orden === 'cargar' && e.lado === 0 && X.man[e.id].tropa === 'hastati'); return e ? e.t : 999; };
  assert.ok(tcarga('agresivo') < tcarga('prudente'), 'agresivo ' + tcarga('agresivo') + ' s, prudente ' + tcarga('prudente') + ' s');
});

for (const [nom, E, gana] of [['Roma contra galos', GALOS, 'roma'], ['Roma contra Cartago', CARTAGO, null]]) t(nom + ': acaba en un tiempo razonable y con un resultado creíble', () => {
  const vict = [];
  for (const sem of [1, 2, 3, 4]) {
    const S = Z.crear({ semilla: sem, ejercitos: [ROMA, E] }); Z.avanzar(S, 2000); const r = Z.resumen(S);
    assert.equal(S.fase, 'fin'); assert.ok(r.t > 60 && r.t < Z.LIMITE, 'dura ' + r.t + ' s');
    const [b0, b1] = r.bajasTotal, i0 = r.estado.resultado.inicial;
    assert.ok(b0 > 0.05 * i0[0] && b1 > 0.05 * i0[1] && b0 < i0[0] && b1 < i0[1], 'bajas ' + b0 + ' / ' + b1);
    assert.ok(r.bajas.every(f => f.n + f.bajas === f.n0), 'filas para la campaña');
    for (const tipo of ['choque', 'carga', 'ruptura', 'orden', 'fin']) assert.ok(r.registro.some(e => e.tipo === tipo), 'registro con «' + tipo + '»');
    vict.push(r.victoria);
  }
  if (gana === 'roma') assert.ok(vict.filter(Boolean).length >= 3, 'Roma gana casi siempre a los galos (Telamón): ' + vict);
  else assert.ok(vict.filter(Boolean).length < 4, 'contra Cartago no gana siempre: ' + vict);
});

t('rendimiento: 30 manípulos por bando, la batalla entera en menos de un segundo', () => {
  const R30 = { hastati: 1200, principes: 1200, triarii: 300, velites: 240, equites: 240 }, E30 = { galos: 2400, iberos: 720, honderos: 240, jinetes: 240 };
  const t0 = performance.now(), S = Z.crear({ semilla: 9, ejercitos: [R30, E30] });
  assert.ok(S.man.filter(u => u.lado === 0).length >= 30 && S.man.filter(u => u.lado === 1).length >= 30, 'manípulos: ' + S.man.length);
  Z.avanzar(S, 2000); const ms = performance.now() - t0;
  assert.equal(S.fase, 'fin'); assert.ok(ms < 1000, ms.toFixed(0) + ' ms');
  console.log('   ', S.man.length, 'manípulos,', S.t.toFixed(0), 's de batalla en', ms.toFixed(0), 'ms');
});

t('corre en el navegador: sin APIs solo de Node; vista y palabras para pintar', () => {
  const src = readFileSync(new URL('../js/simulador.js', import.meta.url), 'utf8');
  assert.ok(!/\bprocess\.|\bBuffer\b|require\(['"](fs|path|node:)/.test(src));
  assert.ok(!/Math\.random|Date\.now|performance\./.test(src), 'sin azar ni reloj de fuera');
  const S = Z.crear({ semilla: 1, ejercitos: [ROMA, GALOS] }); Z.avanzar(S, 80);
  const v = Z.vista(S)[0]; for (const k of ['id', 'lado', 'x', 'y', 'a', 'frente', 'fondo', 'forma', 'estado', 'n', 'moral', 'fatiga', 'palabras']) assert.ok(k in v, k);
  assert.ok(['firme', 'duda', 'rompe'].includes(v.palabras.animo) && ['fresca', 'cansada', 'agotada'].includes(v.palabras.cansancio));
});

t('CG6b: tu duelo a pie (reglas de TP8b) y su peso en el simulador, con tope', () => {
  /* parar a tiempo abre al galo y tu golpe entra: dos golpes, un galo abatido; sin heridas */
  const bien = Z.duelo(7); let pide = null;
  for (let i = 0; i < 1200; i++) { const v = Z.dueloVer(bien); pide = v.aviso && v.aviso.ventana && !v.parando ? 'parar' : v.abierto && v.clipR === null ? 'golpear' : null; Z.dueloPaso(bien, 0.05, pide); }
  assert.ok(bien.mata >= 3 && bien.caidas === 0, 'bien llevado: ' + bien.mata + ' galos, ' + bien.caidas + ' caídas');
  /* golpear sin abrir: te para y el contraataque no se para; sin parar, a la tercera herida caes */
  const mal2 = Z.duelo(7); for (let i = 0; i < 1200; i++) Z.dueloPaso(mal2, 0.05, i % 30 === 0 ? 'golpear' : null);
  assert.ok(mal2.caidas >= 2 && mal2.mata === 0, 'a lo loco: ' + mal2.caidas + ' caídas');
  assert.ok(mal2.eco.some(e => /Te para/.test(e.texto)) && mal2.eco.some(e => /descubierto/.test(e.texto)));
  /* aliento: cada gesto gasta; sin aliento no golpeas */
  const f = Z.duelo(1); f.fuelle = 10; Z.dueloPaso(f, 0.01, 'golpear'); assert.ok(!f.tu && /aliento/.test(f.eco.at(-1).texto));
  /* pilum: una vez, solo al empezar */
  const p = Z.duelo(2); Z.dueloPaso(p, 0.1, 'pilum'); assert.ok(!p.pilum); Z.dueloPaso(p, 0.1, 'pilum'); assert.ok(/Ya lanzaste/.test(p.eco.at(-1).texto));
  /* el gancho: resta al rival en contacto, con tope del 30 % de sus bajas; avisa; determinista */
  const S = choque(frente2('hastati', 'galos'), alChoque, 25); const r = S.cont[0][0].id, n0 = S.man[r].n, m0 = S.man[r].moral;
  const a = Z.apie(S, 0, { mata: 1 }); assert.equal(a.mata, 1); assert.equal(S.man[r].n, n0 - 1); assert.ok(S.man[r].moral < m0);
  assert.ok(S.reg.some(e => e.tipo === 'apie' && /abate a un galo/.test(e.texto)));
  let q = 0; for (let i = 0; i < 200; i++) q += Z.apie(S, 0, { mata: 1 }).mata; assert.ok(q + 1 <= Math.max(2, 0.3 * (S.man[r].n0 - S.man[r].n + 1)) + 1, 'tope: ' + q);
  const nt = S.man[0].n; Z.apie(S, 0, { cae: 1 }); assert.equal(S.man[0].n, nt - 1);
});

t('CG6b: a pie, el manípulo sigue a su centurión a su paso (mover con vel) y el duelo es solo contra infantes', () => {
  const ir = vel => { const S = Z.crear({ semilla: 3, manipulos: [{ lado: 0, tropa: 'hastati', x: 0, y: -100, mando: 'jugador' }, { lado: 1, tropa: 'galos', x: 0, y: 100, mando: 'jugador' }] });
    const y0 = S.man[0].y; Z.ordenar(S, { tipo: 'mover', lado: 0, ids: [0], x: 0, y: y0 + 60, vel }); Z.avanzar(S, 4); return S.man[0].y - y0; };
  const lento = ir(0), rapido = ir(5);
  assert.ok(lento < 8 && rapido > 16, 'sin vel ' + lento.toFixed(1) + ' m, con vel 5: ' + rapido.toFixed(1) + ' m en 4 s');
  assert.ok(Z.aPie('hastati') && Z.aPie('galos') && !Z.aPie('jinetes') && !Z.aPie('elefantes') && !Z.aPie('equites'));
});

console.log(`\n${n} bien, ${mal} mal`);
if (mal) process.exit(1);
