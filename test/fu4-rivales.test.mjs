/* AQVILA — FU4: el rival vivo (sin espejo, más numeroso, hasta el 15 %). node test/fu4-rivales.test.mjs (menos de 2 min)
   a) sin vivo, combate() da el mismo resumen que crearFalange directo (las cifras de FA1 no cambian; perdidos y matados cuadran);
   b) con vivo y los bots de FA1 por el adaptador (semillas 1–20): nogira pierde por el flanco ≥ 18/20; compas no rompe por el
      flanco y gana o sigue en pie ≥ 18/20;
   c) anti-espejo: en el choque giras 30°; el rival tarda en verlo, gira a su paso y vuelve a encararte; nadie salta;
   d) con vivo y el bot «bueno» contra manípulos, falange e hoplitas (semillas 1–5): hay ganador, el que pierde queda con el 15 %
      (+1), dura un minuto o más y el rival empieza con 144.
   FU4 (elefantes y caballería en vivo, usuario 24/11: «los elefantes se atraviesan… deberían ser el enemigo más duro del juego»):
   e) elefantes en vivo y bot bueno (semillas 1–5): el que pierde queda con el 15 % (+1), ≥ 90 s, ≥ 8 picas rotas por partida y
      de media pierdes más que contra manípulos, falange e hoplitas;
   f) anti-espejo de elefantes: en la lucha giras 30°; en el primer segundo ninguna bestia gira más de 0,7 rad y nadie salta 0,4 m;
   g) ninguna bestia viva a menos de 1,6 m de un falangita vivo ni a menos de 2,6 m de otra (muestras cada 0,5 s, partidas de e);
   h) caballería en vivo y bot bueno (semillas 1–5): ganas ≥ 3 de 5 con ≥ 15 bajas tuyas de media. */
import assert from 'node:assert';
import { crearFalange, FIN_LUCHA, BAJAN } from '../js/falange.js';
import { rivalDe, ELE_VIVO } from '../js/falange-rivales.js';
import { crearPaso, velocidad, pisa } from '../gobierno/maquetas/falange/locomocion.js';
import { combate } from '../gobierno/maquetas/bloque/formaciones/falange.js';
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const DT = 1 / 30, GR = Math.PI / 180, SEMILLAS = Array.from({ length: 20 }, (_, i) => i + 1);
const cuenta = (L, f) => L.filter(f).length;
const linea = L => L.map(r => `${r.ganador || '-'}/${r.causa || '-'}@${Math.round(r.T)}`).join(' ');
const LOC = { locomocion: { crearPaso, velocidad, pisa }, zancadas: { walk: 1.5, run: 2.2 } };

t('a) sin vivo: combate() = crearFalange directo (fin null y FIN_LUCHA), y perdidos/matados cuadran', () => {
  for (const fin of [null, FIN_LUCHA]) for (const modo of ['compas', 'nogira']) for (const s of [1, 2, 3]) {
    const F = crearFalange({ semilla: s, fin, ...LOC }); while (F.S.T < 180 && !F.S.ganador) { F.bot(modo); F.paso(DT); }
    const C = combate({ semilla: s, fin }); while (C.S.T < 180 && !C.S.ganador) { C.bot(modo); C.paso(DT); }
    const r = C.resumen(); assert.deepStrictEqual(r, F.resumen(), `${modo} ${s} ${fin}`);
    assert.strictEqual(r.perdidos, 96 - r.enPieU); assert.strictEqual(r.matados, 96 - r.enPieR); assert.strictEqual(C.S.fal.vivo, false);
  }
});

const R = {}; for (const modo of ['nogira', 'compas']) R[modo] = SEMILLAS.map(s => { const C = combate({ semilla: s, vivo: true }); while (C.S.T < 400 && !C.S.ganador) { C.bot(modo); C.paso(DT); } return C.resumen(); });
t('b) vivo: nogira pierde por el flanco en ≥ 18 de 20', () => {
  const k = cuenta(R.nogira, r => r.ganador === 'rival' && r.causa === 'flanco'); console.log('   nogira', k, '/20 ·', linea(R.nogira)); assert.ok(k >= 18, linea(R.nogira));
});
t('b) vivo: compas gana o sigue en pie en ≥ 18 de 20 y nunca rompe por el flanco', () => {
  const k = cuenta(R.compas, r => r.ganador !== 'rival'); console.log('   compas', k, '/20 ·', linea(R.compas));
  assert.ok(k >= 18, linea(R.compas)); assert.strictEqual(cuenta(R.compas, r => r.causa === 'flanco' && r.ganador === 'rival'), 0);
});

t('c) anti-espejo: el rival no copia tu giro, lo sigue con retraso y nadie salta', () => {
  const F = crearFalange({ semilla: 3, vivo: true, ...LOC }), S = F.S; for (let i = 0; i < BAJAN; i++) F.fila(i, true);
  let antes = new Map(), peor = 0;
  const paso = () => { F.paso(DT); for (const h of S.ene) { const a = antes.get(h); if (a && h.vivo && a.v) peor = Math.max(peor, Math.hypot(h.x - a.x, h.z - a.z)); antes.set(h, { x: h.x, z: h.z, v: h.vivo }); } };
  while (!S.choque && S.T < 60) paso(); assert.ok(S.choque, 'hay choque');
  const t1 = S.T + 3; while (S.T < t1) paso();
  const a0 = S.riv.ang, t0 = S.T; F.gira(1); let a1 = null;
  while (S.T < t0 + 8) { paso(); if (S.giro >= 30 * GR) F.gira(0); if (a1 === null && S.T >= t0 + 1) a1 = S.riv.ang; }
  const d1 = Math.abs(a1 - a0) / GR, d8 = Math.abs(S.riv.ang - S.giro) / GR;
  console.log(`   en 1 s el rival giró ${d1.toFixed(2)}°; a los 8 s le faltan ${d8.toFixed(2)}° (tu giro ${(S.giro / GR).toFixed(1)}°); peor paso ${peor.toFixed(3)} m`);
  assert.ok(d1 < 2, 'gira como un espejo: ' + d1); assert.ok(d8 < 10, 'no vuelve a encararte: ' + d8); assert.ok(peor <= 0.4, 'salta: ' + peor);
  assert.ok(Math.abs(S.giro - 30 * GR) < 1 * GR, 'giraste 30°');
});

t('d) vivo y bot «bueno»: ganador, el que pierde con el 15 % (+1), ≥ 60 s, 144 enemigos', () => {
  for (const rival of ['manipulos', 'falange', 'hoplitas']) {
    const L = [];
    for (let s = 1; s <= 5; s++) {
      const C = combate({ semilla: s, rival, vivo: true }), F = C.S.fal; assert.strictEqual(F.ene.length, 144, rival); assert.strictEqual(F.R.hombres, 144);
      assert.strictEqual(C.S.tuyo.U.fin, FIN_LUCHA); assert.strictEqual(F.R.fin, FIN_LUCHA);
      while (C.S.T < 600 && !C.S.ganador) { C.bot('bueno'); C.paso(DT); }
      const r = { ...C.resumen(), ganador: C.S.ganador }, U = F.U, Rv = F.R; L.push(r);   /* el resumen dice 'falange'/'rival'; C.S, 'tuyo'/'enemigo' */
      assert.ok(r.ganador === 'tuyo' || r.ganador === 'enemigo', `${rival} ${s} sin ganador`);
      const p = r.ganador === 'tuyo' ? Rv : U; assert.ok(p.enPie <= Math.floor(p.hombres * FIN_LUCHA) + 1, `${rival} ${s}: el que pierde aún tiene ${p.enPie}/${p.hombres}`);
      assert.ok(r.T >= 60, `${rival} ${s} dura ${r.T} s`);
    }
    const g = L.filter(r => r.ganador === 'tuyo'), pierde = g.length ? g.reduce((a, r) => a + r.perdidos, 0) / g.length : 0;
    console.log(`   ${rival}: ${L.map(r => `${r.ganador}@${Math.round(r.T)} pierdes ${r.perdidos} matas ${r.matados}`).join(' · ')}`);
    if (g.length) assert.ok(pierde >= 0.2 * 96, `${rival}: ganando pierdes de media ${pierde.toFixed(1)} (< 20 %)`);
  }
});

/* ---------- FU4: elefantes y caballería en vivo ---------- */
function juega(rival, s, mira) {
  const C = combate({ semilla: s, rival, vivo: true }), F = C.S.fal; let tM = 0;
  while (C.S.T < 600 && !C.S.ganador) { C.bot('bueno'); C.paso(DT); if (mira && F.T >= tM) { tM += 0.5; mira(F); } }
  return { ...C.resumen(), ganador: C.S.ganador, F };
}
const media = L => L.reduce((a, r) => a + r.perdidos, 0) / L.length;
const peorCerca = { hombre: 1e9, bestia: 1e9 };
const ELE = [1, 2, 3, 4, 5].map(s => juega('elefantes', s, F => {
  const B = F.riv.bestias.filter(b => b.vivo && !b.fuera);
  for (const b of B) {
    for (const h of F.fal) if (h.vivo && !h.huye) peorCerca.hombre = Math.min(peorCerca.hombre, Math.hypot(b.x - h.x, b.z - h.z));
    for (const c of B) if (c !== b) peorCerca.bestia = Math.min(peorCerca.bestia, Math.hypot(b.x - c.x, b.z - c.z));
  }
}));
t('e) FU4 elefantes en vivo: el más duro; ≥ 90 s, ≥ 8 picas rotas, el que pierde con el 15 % (+1)', () => {
  console.log('   elefantes: ' + ELE.map(r => `${r.ganador}@${Math.round(r.T)} pierdes ${r.perdidos} matas ${r.matados} rotas ${r.F.riv.rotas}`).join(' · '));
  for (const [k, r] of ELE.entries()) {
    const F = r.F, s = k + 1; assert.strictEqual(F.riv.bestias.length, ELE_VIVO.bestias); assert.strictEqual(F.riv.hombres.length, ELE_VIVO.escolta);
    assert.ok(r.ganador === 'tuyo' || r.ganador === 'enemigo', `elefantes ${s} sin ganador`);
    if (r.ganador === 'tuyo') {
      const esc = F.riv.hombres.filter(h => h.vivo).length; assert.ok(esc <= Math.floor(ELE_VIVO.escolta * FIN_LUCHA) + 1, `${s}: la escolta aún tiene ${esc}`);
    } else assert.ok(F.U.enPie <= Math.floor(F.U.hombres * FIN_LUCHA) + 1, `${s}: tu muro aún tiene ${F.U.enPie}`);
    assert.ok(r.T >= 90, `elefantes ${s} dura ${r.T} s`); assert.ok(F.riv.rotas >= 8, `elefantes ${s}: ${F.riv.rotas} picas rotas`);
  }
  const mE = media(ELE);
  for (const rival of ['manipulos', 'falange', 'hoplitas']) {
    const m = media([1, 2, 3, 4, 5].map(s => juega(rival, s))); console.log(`   pierdes de media: elefantes ${mE.toFixed(1)} · ${rival} ${m.toFixed(1)}`);
    assert.ok(mE > m, `contra ${rival} pierdes ${m.toFixed(1)} y contra elefantes ${mE.toFixed(1)}`);
  }
});
t('f) FU4 anti-espejo de elefantes: en la lucha giras 30°; ninguna bestia copia tu giro ni salta', () => {
  const F = crearFalange({ semilla: 2, vivo: true, rival: rivalDe('elefantes'), ...LOC }), S = F.S; for (let i = 0; i < BAJAN; i++) F.fila(i, true);
  const lucha = () => S.riv.bestias.filter(b => b.vivo && b.est === 'lucha' && b.enFrente);
  while (S.T < 90 && !S.ganador && !lucha().length) F.paso(DT); assert.ok(lucha().length, 'hay bestias en la lucha');
  const t1 = S.T + 1; while (S.T < t1) F.paso(DT);
  const B = S.riv.bestias.filter(b => b.vivo && !b.fuera), y0 = new Map(B.map(b => [b, b.yaw])); let antes = new Map(B.map(b => [b, { x: b.x, z: b.z }])), peor = 0, giroMax = 0;
  const t0 = S.T; F.gira(1);
  while (S.T < t0 + 6 && !S.ganador) {
    F.paso(DT); if (S.giro >= 30 * GR) F.gira(0);
    for (const b of B) { if (!b.vivo || b.fuera) continue; const a = antes.get(b); peor = Math.max(peor, Math.hypot(b.x - a.x, b.z - a.z)); antes.set(b, { x: b.x, z: b.z });
      if (S.T <= t0 + 1) giroMax = Math.max(giroMax, Math.abs(Math.atan2(Math.sin(b.yaw - y0.get(b)), Math.cos(b.yaw - y0.get(b))))); }
  }
  console.log(`   en 1 s la bestia que más giró: ${giroMax.toFixed(2)} rad; peor paso ${peor.toFixed(3)} m; tu giro ${(S.giro / GR).toFixed(1)}°`);
  assert.ok(giroMax <= 0.7, 'gira de golpe: ' + giroMax); assert.ok(peor <= 0.4, 'salta: ' + peor);
});
t('g) FU4 ni las bestias se atraviesan ni pisan el sitio de un falangita vivo', () => {
  console.log(`   lo más cerca: bestia–falangita ${peorCerca.hombre.toFixed(2)} m · bestia–bestia ${peorCerca.bestia.toFixed(2)} m`);
  assert.ok(peorCerca.hombre >= 1.6, 'bestia encima de un falangita: ' + peorCerca.hombre); assert.ok(peorCerca.bestia >= 2.6, 'bestias una en otra: ' + peorCerca.bestia);
});
t('h) FU4 caballería en vivo y bot bueno: ganas ≥ 3 de 5 con ≥ 15 bajas de media', () => {
  const L = [1, 2, 3, 4, 5].map(s => juega('caballeria', s)), g = cuenta(L, r => r.ganador === 'tuyo'), m = media(L);
  console.log(`   caballería: ${L.map(r => `${r.ganador}@${Math.round(r.T)} pierdes ${r.perdidos} matas ${r.matados}`).join(' · ')}`);
  assert.ok(g >= 3, `ganas ${g} de 5`); assert.ok(m >= 15, `pierdes de media ${m.toFixed(1)}`);
});

console.log(`\n${n} bien, ${mal} mal`);
if (mal) process.exit(1);
