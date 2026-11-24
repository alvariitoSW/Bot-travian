/* AQVILA — FU5: muro de escudos y orden abierto, sin pantalla. node test/fu5-formaciones.test.mjs (unos 15 s)
   1) muro contra la carga: tu manípulo quieto en muro pierde claramente menos y queda con más cohesión que en filas cerradas;
   2) abierto contra jabalinas: la primera salva mata ≤ 0,5×; y en el choque pierde ≥ 1,3×;
   3) el paso: muro ≤ 0,6× de lo que anda cerrada en 15 s; abierto ≥ 1,3×;
   4) el contrato: C.forma, testudo y cargar la devuelven, la guardia de la física, los huecos del bloque y formaUtil. */
import assert from 'node:assert';
import * as IA from '../js/bloque-ia.js';
import * as BL from '../js/bloque.js';
import { guardiaDeSerie } from '../gobierno/maquetas/bloque/fisica.js';
import { crearMuro, PIEZA } from '../gobierno/maquetas/bloque/formaciones/muro.js';
import { crearAbierto } from '../gobierno/maquetas/bloque/formaciones/abierto.js';
const { crearCombate, DT, FORMAS } = IA;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const SEMILLAS = [1, 2, 3, 4, 5, 6];
const nuevo = (semilla, ev) => crearCombate({ semilla, nivel: 'normal', motor: BL, avisa: (tipo, d) => ev && ev.push({ tipo, d }) });

/* tu manípulo quieto con la forma dada; mide muertos y cohesión en los 8 s tras el primer choque con el centro galo */
function choque(semilla, forma) {
  const C = nuevo(semilla), S = C.S, tu = S.tuyo; if (forma) C.forma(forma);
  let t0 = -1, p0 = 0, util = null;
  while (!S.ganador && S.T < 200) {
    if (t0 < 0 && util === null) util = C.formaUtil();
    C.paso(DT);
    if (t0 < 0 && tu.contactos.some(c => c.b === S.ene.centro)) { t0 = S.T; p0 = tu.U.enPie; }
    if (t0 > 0 && S.T - t0 >= 8) break;
  }
  return { muertos: p0 - tu.U.enPie, coh: tu.coh, t0, util };
}
/* muertos de la primera salva sobre ti, con la forma dada */
function salva(semilla, forma) {
  const ev = [], C = nuevo(semilla, ev), S = C.S; if (forma) C.forma(forma);
  while (!S.ganador && S.T < 200 && !ev.some(e => e.tipo === 'jabalinas' && e.d.blanco === S.tuyo)) C.paso(DT);
  const j = ev.find(e => e.tipo === 'jabalinas' && e.d.blanco === S.tuyo); return j ? j.d.muertos : -1;
}
const suma = (xs, f) => xs.reduce((a, x) => a + f(x), 0);

t('muro contra la carga: ≤ 0,6× de muertos y más cohesión que en filas cerradas', () => {
  const R = SEMILLAS.map(s => ({ s, c: choque(s, null), m: choque(s, 'muro') }));
  for (const r of R) { assert.ok(r.c.t0 > 0 && r.m.t0 > 0, 'hay choque (semilla ' + r.s + ')'); console.log(`     semilla ${r.s}: cerrada ${r.c.muertos} muertos · coh ${r.c.coh.toFixed(0)} | muro ${r.m.muertos} muertos · coh ${r.m.coh.toFixed(0)} · formaUtil antes: ${r.c.util}`); }
  const mc = suma(R, r => r.c.muertos), mm = suma(R, r => r.m.muertos), cc = suma(R, r => r.c.coh), cm = suma(R, r => r.m.coh);
  console.log(`     TOTAL muertos: cerrada ${mc} · muro ${mm} (${(mm / mc).toFixed(2)}×) · coh media ${(cc / R.length).toFixed(0)} · ${(cm / R.length).toFixed(0)}`);
  assert.ok(mm <= 0.6 * mc, `muro ${mm} > 0,6 × ${mc}`); assert.ok(cm > cc, 'más cohesión con muro');
});
t('abierto contra jabalinas: la primera salva mata ≤ 0,5×; en el choque pierde ≥ 1,3×', () => {
  const S1 = SEMILLAS.map(s => ({ s, c: salva(s, null), a: salva(s, 'abierto') }));
  for (const r of S1) { assert.ok(r.c > 0 && r.a >= 0, 'cae la salva (semilla ' + r.s + ')'); console.log(`     semilla ${r.s}: 1.ª salva · cerrada ${r.c} · abierto ${r.a}`); }
  const sc = suma(S1, r => r.c), sa = suma(S1, r => r.a); console.log(`     TOTAL salva: cerrada ${sc} · abierto ${sa} (${(sa / sc).toFixed(2)}×)`);
  assert.ok(sa <= 0.5 * sc, `abierto ${sa} > 0,5 × ${sc}`);
  const R = SEMILLAS.map(s => ({ c: choque(s, null), a: choque(s, 'abierto') })), mc = suma(R, r => r.c.muertos), ma = suma(R, r => r.a.muertos);
  console.log(`     TOTAL choque: cerrada ${mc} · abierto ${ma} (${(ma / mc).toFixed(2)}×)`); assert.ok(ma >= 1.3 * mc, `abierto ${ma} < 1,3 × ${mc}`);
});
t('el paso: muro ≤ 0,6× y abierto ≥ 1,3× de lo que anda cerrada en 15 s', () => {
  const anda = f => { const C = nuevo(1), S = C.S; if (f) C.forma(f); C.frente({ x: 0, z: -60, ang: 0 }); for (let i = 0; i < 150; i++) C.paso(DT); return Math.hypot(S.tuyo.x, S.tuyo.z); };
  const c = anda(null), m = anda('muro'), a = anda('abierto'); console.log(`     metros en 15 s: cerrada ${c.toFixed(1)} · muro ${m.toFixed(1)} (${(m / c).toFixed(2)}×) · abierto ${a.toFixed(1)} (${(a / c).toFixed(2)}×)`);
  assert.ok(c > 5, 'anda'); assert.ok(m <= 0.6 * c, 'muro lento'); assert.ok(a >= 1.3 * c, 'abierto rápido');
});
t('contrato: C.forma, testudo y cargar, resumen', () => {
  const C = nuevo(2), S = C.S, ev = [];
  assert.strictEqual(S.tuyo.forma, 'cerrada'); assert.ok(S.bloques.every(b => b.forma === 'cerrada'));
  assert.strictEqual(C.forma('nada'), false); assert.strictEqual(C.forma('cerrada'), false);
  assert.strictEqual(C.forma('muro'), true); assert.strictEqual(S.tuyo.forma, 'muro'); assert.strictEqual(C.forma('muro'), false);
  assert.strictEqual(C.orden('testudo'), true); assert.strictEqual(S.tuyo.forma, 'cerrada', 'testudo vuelve a cerrada');
  assert.strictEqual(C.forma('muro'), true); assert.strictEqual(S.tuyo.orden, 'alto', 'forma(muro) en testudo lo abre'); assert.strictEqual(S.tuyo.forma, 'muro');
  assert.strictEqual(C.forma('abierto'), true); C.orden('cargar'); assert.strictEqual(S.tuyo.forma, 'cerrada', 'cargar vuelve a cerrada');
  C.forma('muro'); for (let i = 0; i < 20; i++) C.paso(DT); C.forma('abierto'); for (let i = 0; i < 20; i++) C.paso(DT); const r = C.resumen();
  assert.ok(r.tMuro > 1.5 && r.tAbierto > 1.5, `tiempos ${r.tMuro} ${r.tAbierto}`); void ev;
  S.tuyo.U.roto = true; assert.strictEqual(C.forma('cerrada'), false, 'roto: no');
  const G = nuevo(1); G.S.ganador = 'tuyo'; assert.strictEqual(G.forma('muro'), false, 'con ganador: no');
  for (const k of ['cerrada', 'muro', 'abierto']) for (const c of ['vel', 'salva', 'recibe', 'ataque', 'carga', 'impacto', 'dx', 'dz']) assert.strictEqual(typeof FORMAS[k][c], 'number', k + '.' + c);
});
t('la física y el bloque: guardia en fila 0 con muro, huecos que cambian, formaUtil', () => {
  const S = { tuyo: { orden: null, forma: 'muro' } };
  assert.strictEqual(guardiaDeSerie({ fila: 0 }, S), 'muro'); assert.strictEqual(guardiaDeSerie({ fila: 2 }, S), null);
  S.tuyo.forma = 'cerrada'; assert.strictEqual(guardiaDeSerie({ fila: 0 }, S), null);
  const C = nuevo(3), B = C.S.B, dx0 = B.dx; assert.strictEqual(B.dx0, dx0);
  C.forma('abierto'); for (let i = 0; i < 5; i++) C.paso(DT); assert.ok(Math.abs(B.dx - dx0 * FORMAS.abierto.dx) < 1e-9 && B.dz > B.dz0, 'huecos abiertos');
  C.forma('muro'); C.paso(DT); assert.ok(B.dx < dx0, 'huecos del muro'); C.forma('cerrada'); C.paso(DT); assert.ok(Math.abs(B.dx - dx0) < 1e-9, 'huecos de serie');
  /* formaUtil: muro cuando te vienen cargando de frente; abierto con una salva en el aire (sin testudo) */
  const D = nuevo(1); let vio = null; while (!D.S.ganador && D.S.T < 120 && vio !== 'muro') { D.paso(DT); vio = D.formaUtil(); } assert.strictEqual(vio, 'muro', 'muro cuando cargan');
  const E = nuevo(1); let u = null; while (!E.S.ganador && E.S.T < 120 && !E.S.salva) E.paso(DT); u = E.formaUtil(); assert.strictEqual(u, E.ordenUtil() === 'testudo' ? null : 'abierto', 'con salva en el aire: abierto solo si el testudo no es lo que conviene (' + u + ')');
  const F = nuevo(1); F.forma('muro'); F.paso(DT); assert.strictEqual(F.formaUtil(), 'cerrada', 'en muro y sin peligro: cerrada');
});
t('las formaciones de dibujo exportan sus funciones', () => {
  const M = crearMuro(), A = crearAbierto();
  for (const k of ['monta', 'paso', 'visible']) assert.strictEqual(typeof M[k], 'function', 'muro.' + k);
  for (const k of ['monta', 'paso', 'alAviso']) assert.strictEqual(typeof A[k], 'function', 'abierto.' + k);
  assert.ok(PIEZA.ancho > 0.78 * 1.0, 'las piezas se solapan (más anchas que el hueco del muro)');
  let sonó = 0; A.monta({ Son: { tierra: () => sonó++ } }); A.alAviso('forma', { f: 'abierto' }); for (let i = 0; i < 40; i++) A.paso(0.1); assert.ok(sonó >= 3, 'pasos sueltos al abrirse');
});
console.log(`\n${mal ? 'NO APTO' : 'APTO'} · ${n} bien, ${mal} mal`); process.exit(mal ? 1 : 0);
