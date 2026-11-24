/* AQVILA — FU3 (tanda 1): la falange como formación del motor único, sin pantalla. node test/fu3-falange.test.mjs (menos de 1 min)
   a) con la misma semilla, el adaptador (formaciones/falange.js) con los bots de FA1 da EL MISMO resumen que crearFalange directo
      (con lo mismo que le pone la maqueta: la locomoción y las zancadas), con fin de FA1 (null) y con FIN_LUCHA;
   b) «gira gana, no gira pierde» de FA1 por el adaptador, con las semillas y el criterio de test/falange.test.mjs;
   c) el bot 'bueno' (botMando, por el mando) lleva la partida a un final antes del tope;
   d) la forma del combate que lee la escena del bloque (S.tuyo, S.B.hombres, S.bloques, ordenUtil) y el contrato de las formaciones. */
import assert from 'node:assert';
import { crearFalange, FIN_LUCHA, BOTS } from '../js/falange.js';
import { crearPaso, velocidad, pisa } from '../gobierno/maquetas/falange/locomocion.js';
import { ORDENES } from '../gobierno/maquetas/falange/mando.js';
import { crear as falange, combate } from '../gobierno/maquetas/bloque/formaciones/falange.js';
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const DT = 1 / 30, SEMILLAS = Array.from({ length: 20 }, (_, i) => i + 1);
const cuenta = (L, f) => L.filter(f).length;
const linea = L => L.map(r => `${r.ganador || '-'}/${r.causa || '-'}@${Math.round(r.T)}`).join(' ');

/* la misma partida, directa y por el adaptador */
const directa = (modo, semilla, fin) => {
  const F = crearFalange({ semilla, fin, locomocion: { crearPaso, velocidad, pisa }, zancadas: { walk: 1.5, run: 2.2 } });
  while (F.S.T < 180 && !F.S.ganador) { F.bot(modo); F.paso(DT); }
  return F.resumen();
};
const adaptada = (modo, semilla, fin) => {
  const C = combate({ semilla, fin });
  while (C.S.T < 180 && !C.S.ganador) { C.bot(modo); C.paso(DT); }
  return C.resumen();
};

t('a) mismo resumen que crearFalange directo, con los cuatro bots de FA1 (fin null y FIN_LUCHA)', () => {
  for (const fin of [null, FIN_LUCHA]) for (const modo of BOTS) for (const s of [1, 2, 3, 7, 11])
    assert.deepStrictEqual(adaptada(modo, s, fin), directa(modo, s, fin), `${modo} semilla ${s} fin ${fin}`);
});

const R = {}; for (const modo of ['nogira', 'compas']) R[modo] = SEMILLAS.map(s => adaptada(modo, s, null));
t('b) nogira pierde por el flanco en ≥ 18 de 20 (por el adaptador)', () => {
  const k = cuenta(R.nogira, r => r.ganador === 'rival' && r.causa === 'flanco'); console.log('   nogira', k, '/20'); assert.ok(k >= 18, linea(R.nogira));
});
t('b) compas (gira) gana o sigue en pie en ≥ 18 de 20 y nunca rompe por el flanco (por el adaptador)', () => {
  const k = cuenta(R.compas, r => r.ganador !== 'rival'); console.log('   compas en pie o gana', k, '/20');
  assert.ok(k >= 18, linea(R.compas)); assert.strictEqual(cuenta(R.compas, r => r.causa === 'flanco' && r.ganador === 'rival'), 0);
});

t('c) el bot «bueno» por el mando lleva la partida a un final antes del tope (400 s)', () => {
  const fines = [1, 4, 9].map(s => { const C = combate({ semilla: s }); while (C.S.T < 400 && !C.S.ganador) { C.bot('bueno'); C.paso(DT); } return C.S; });
  console.log('   ', fines.map(S => `${S.ganador}/${S.causa}@${Math.round(S.T)}`).join(' '));
  for (const S of fines) assert.ok(['tuyo', 'enemigo'].includes(S.ganador), 'sin final: ' + S.ganador);
  assert.ok(fines.filter(S => S.ganador === 'tuyo').length >= 2, 'el bot bueno gana casi siempre');
});

t('d) la forma: S.tuyo, S.B.hombres, dos bloques, ordenUtil y el contrato de las formaciones', () => {
  const C = combate({ semilla: 5 }), S = C.S; let util = new Set();
  const mira = () => {
    assert.ok(S.tuyo && S.tuyo === S.bloques[0] && S.bloques.length === 2 && S.ene.centro === S.bloques[1]);
    for (const k of ['x', 'z', 'ang', 'ancho', 'fondo']) { assert.ok(Number.isFinite(S.tuyo[k]), 'tuyo.' + k); assert.ok(Number.isFinite(S.bloques[1][k]), 'rival.' + k); }
    for (const b of S.bloques) { assert.ok(b.U && Number.isFinite(b.U.enPie) && Number.isFinite(b.U.hombres)); assert.ok(Array.isArray(b.contactos)); assert.ok(typeof b.estado === 'string'); }
    assert.ok(S.B.hombres.length === 96); const h = S.B.hombres[0];
    for (const k of ['x', 'z', 'yaw', 'fila', 'col']) assert.ok(Number.isFinite(h[k]), 'hombre.' + k); assert.strictEqual(typeof h.vivo, 'boolean');
    const u = C.ordenUtil(); assert.ok(u === null || ORDENES.includes(u), 'ordenUtil ' + u); util.add(u);
    assert.strictEqual(C.giroUtil(), false);
  };
  mira();
  assert.strictEqual(S.tuyo.x, S.fal.xF); assert.strictEqual(S.tuyo.ang, S.fal.giro);
  /* el bloque rival mira hacia ti: su frente apunta más o menos a tu pivote */
  const r = S.bloques[1], dx = S.tuyo.x - r.x, dz = S.tuyo.z - r.z; assert.ok(Math.sin(r.ang) * dx - Math.cos(r.ang) * dz > 0, 'el rival te da la cara');
  /* frente({x,z,ang}) llega al mando: pone meta */
  assert.ok(C.frente({ x: S.tuyo.x, z: S.tuyo.z - 10, ang: 0 }), 'el frente pone la meta');
  while (S.T < 400 && !S.ganador) { C.bot('bueno'); C.paso(DT); if (Math.round(S.T * 30) % 30 === 0) mira(); }
  mira(); assert.ok(util.size >= 2, 'se ilumina alguna orden: ' + [...util].join(','));
  assert.strictEqual(C.orden('cargar'), null, 'una orden que no es de la falange no hace nada');
  const f = falange();
  for (const k of ['id', 'ordenes', 'objetivo', 'escenario', 'muroDelante', 'util', 'mods', 'guardia', 'monta', 'paso', 'alAviso', 'combate']) assert.ok(k in f, k);
  assert.strictEqual(f.id, 'falange'); assert.deepStrictEqual(f.ordenes, ORDENES); assert.strictEqual(f.escenario, null); assert.strictEqual(f.muroDelante, false);
  assert.strictEqual(f.util(), null); f.monta({ C }); assert.ok(f.util() === null || ORDENES.includes(f.util()));
});

console.log(`\n${n} bien, ${mal} mal`);
if (mal) process.exit(1);
