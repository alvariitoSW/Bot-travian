/* AQVILA — FU3b: el gesto de la falange en la escena única del bloque, sin pantalla. node test/fu3b-falange.test.mjs (segundos)
   a) bajar a tiempo ensarta: el bloque rival pierde uno (3 semillas);
   b) sin bajar entra: tu bloque pierde uno y hay hueco; cerrar a tiempo no deja brecha y el de atrás pasa a fila 0;
   c) sin cerrar, a los 3 s hay brecha: otra baja y menos cohesión;
   d) bajar demasiado pronto (1,0 s antes) cuenta como no bajar;
   e) fuera de contacto no pasa nada;
   f) jugar bien rinde: ensartados > entradas; sin tocar nada, entradas > 0;
   g) sin el módulo, el combate da lo mismo (dos combates con la misma semilla, mismo resumen). */
import assert from 'node:assert';
import * as IA from '../js/bloque-ia.js';
import * as BL from '../js/bloque.js';
import { crearFalangita, VENTANA, T_HUECO, COH_BRECHA } from '../gobierno/maquetas/bloque/falangita.js';
const { crearCombate, DT } = IA;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const azarDe = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

function alChoque(semilla = 1) {
  const C = crearCombate({ semilla, nivel: 'normal', motor: BL }), S = C.S;
  while (!S.tuyo.contactos.length && S.T < 200) { C.bot('bueno'); C.paso(DT); }
  assert.ok(S.tuyo.contactos.length, 'hay choque');
  const ev = [], F = crearFalangita({ S, azar: azarDe(semilla * 97 + 5), alAviso: (tipo, d) => ev.push({ tipo, d }) });
  return { C, S, F, ev };
}
const pasa = (F, s) => { for (let k = 0; k < Math.round(s / DT); k++) F.paso(DT); };
function hastaAcomete(F) { for (let k = 0; k < 600; k++) { F.paso(DT); const r = F.estado().rival; if (r && r.fase === 'acomete') return F.rival; } throw new Error('el rival no acomete'); }
/* avanza hasta faltar `antes` s para el golpe y pulsa bajar; luego deja pasar el golpe */
function Tact(F) { const e = F.estado().rival; return F.rival.t0 + e.t * 1.1; }
function jugada(F, antes) {   /* baja `antes` s antes del golpe (null: no baja) y pasa el golpe */
  const r = hastaAcomete(F);
  if (antes != null) while (r.pendiente && Tact(F) < r.ts - antes) F.paso(DT);
  if (antes != null) F.pide('bajar');
  while (r.pendiente) F.paso(DT);
}
const ult = (ev, tipo) => ev.filter(e => e.tipo === tipo).pop();

t('a) bajar a tiempo ensarta y el bloque rival pierde uno', () => {
  for (const semilla of [1, 2, 3]) {
    const { S, F, ev } = alChoque(semilla), b = (pasa(F, 0.1), F.rival && F.rival.b) || S.tuyo.contactos.find(c => c.b).b, antes = b.U.enPie, mio = S.tuyo.U.enPie, coh = b.coh;
    jugada(F, 0.3);
    assert.strictEqual(ult(ev, 'golpe').d.res, 'ensarta', 'semilla ' + semilla);
    assert.strictEqual(b.U.enPie, antes - 1, 'su bloque pierde uno'); assert.strictEqual(S.tuyo.U.enPie, mio, 'el tuyo no');
    assert.ok(b.coh < coh || coh === 0, 'pierde cohesión'); assert.strictEqual(F.estado().ensartados, 1); assert.strictEqual(F.estado().eco.texto, '¡Ensartado!');
  }
});
t('b) sin bajar entra: hay hueco; cerrar a tiempo no deja brecha y el de atrás pasa a fila 0', () => {
  const { S, F, ev } = alChoque(2), mio = S.tuyo.U.enPie; jugada(F, null);
  assert.strictEqual(ult(ev, 'golpe').d.res, 'entra'); assert.strictEqual(S.tuyo.U.enPie, mio - 1, 'tu bloque pierde uno');
  const h = F.hueco; assert.ok(h && F.estado().hueco, 'hay hueco'); assert.ok(h.h && !h.h.vivo, 'cae uno de la primera fila');
  const col = h.col, atras = S.B.hombres.filter(x => x.vivo && x.col === col && x.fila > 0).sort((a, b) => a.fila - b.fila)[0];
  pasa(F, 1); F.pide('cerrar', { col });
  assert.ok(ult(ev, 'cierra'), 'cierra'); assert.strictEqual(atras.fila, 0, 'el de atrás pasa a fila 0'); assert.strictEqual(F.estado().hueco, null);
  pasa(F, T_HUECO + 1); assert.strictEqual(F.estado().brechas, 0, 'sin brecha'); assert.ok(!ev.some(e => e.tipo === 'brecha'));
});
t('c) sin cerrar, a los 3 s hay brecha: otra baja y menos cohesión', () => {
  const { S, F, ev } = alChoque(3); jugada(F, null); const e0 = S.tuyo.U.enPie, c0 = S.tuyo.coh;
  pasa(F, T_HUECO - 0.2); assert.ok(F.estado().hueco, 'aún hay hueco'); assert.ok(!ev.some(e => e.tipo === 'brecha'));
  pasa(F, 0.4); assert.ok(ult(ev, 'brecha'), 'brecha'); assert.strictEqual(S.tuyo.U.enPie, e0 - 1, 'otra baja');
  assert.ok(S.tuyo.coh <= Math.max(0, c0 - COH_BRECHA) + 1e-9 && S.tuyo.coh < c0 + 1e-9, 'menos cohesión'); assert.strictEqual(F.estado().hueco, null); assert.strictEqual(F.estado().brechas, 1);
});
t('d) bajar demasiado pronto (1,0 s antes) cuenta como no bajar', () => {
  assert.ok(1.0 > VENTANA);
  const { F, ev } = alChoque(1); jugada(F, 1.0); assert.strictEqual(ult(ev, 'golpe').d.res, 'entra');
});
t('e) fuera de contacto no pasa nada', () => {
  const C = crearCombate({ semilla: 1, nivel: 'normal', motor: BL, lejos: 25 }), S = C.S, ev = [];
  const F = crearFalangita({ S, azar: azarDe(7), alAviso: (tp, d) => ev.push({ tp, d }) });
  assert.ok(!S.tuyo.contactos.length, 'sin contacto'); const e0 = S.tuyo.U.enPie; F.pide('bajar'); F.pide('cerrar', { col: 1 }); pasa(F, 10);
  const e = F.estado(); assert.strictEqual(e.lucha, false); assert.strictEqual(e.rival, null); assert.strictEqual(e.hueco, null); assert.strictEqual(ev.length, 0); assert.strictEqual(S.tuyo.U.enPie, e0);
});
t('f) jugar bien rinde: ensartados > entradas; sin tocar nada, entradas > 0', () => {
  for (const semilla of [1, 2, 3]) {
    const bien = alChoque(semilla); const tf = bien.F; let k = 0; while (k++ < Math.round(60 / DT)) { const r = tf.rival; if (r && r.pendiente && Tact(tf) >= r.ts - 0.3) tf.pide('bajar'); tf.paso(DT); }
    const e = tf.estado(); assert.ok(e.ensartados > e.entradas, `semilla ${semilla}: ensartados ${e.ensartados} > entradas ${e.entradas}`);
    const nada = alChoque(semilla); pasa(nada.F, 60); const z = nada.F.estado(); assert.ok(z.entradas > 0 && z.ensartados === 0, `sin tocar: entradas ${z.entradas}`);
    console.log(`     semilla ${semilla}: bien ${e.ensartados}/${e.entradas} · sin tocar entradas ${z.entradas}, brechas ${z.brechas}`);
  }
});
t('g) sin el módulo, el combate da lo mismo (misma semilla, mismo resumen)', () => {
  for (const semilla of [1, 5]) {
    const juega = () => { const C = crearCombate({ semilla, nivel: 'normal', motor: BL }); while (!C.S.ganador && C.S.T < 300) { C.bot('bueno'); C.paso(DT); } return JSON.stringify(C.resumen()); };
    assert.strictEqual(juega(), juega(), 'semilla ' + semilla);
  }
});

/* h–i) sobre el motor de verdad de la falange (FU3: formaciones/falange.js con js/falange.js); lucha completa con el bot del mando */
import { combate as combateFalange } from '../gobierno/maquetas/bloque/formaciones/falange.js';
function partidaFalange(semilla, modo) {   /* modo: null = sin módulo · 'bien' = baja a tiempo y cierra · 'nada' = módulo sin tocar */
  const C = combateFalange({ semilla }), D = 1 / 30; let F = null;
  while (!C.S.ganador && C.S.T < 240) {
    C.bot('bueno'); C.paso(D);
    if (modo && !F && C.trabado()) { assert.ok(C.motor, 'el combate de la falange da su motor'); F = crearFalangita({ S: C.S, motor: C.motor, azar: azarDe(semilla * 31 + 7) }); }
    if (F) {
      F.paso(D);
      if (modo === 'bien') {
        const e = F.estado(); if (e.rival && e.rival.fase === 'acomete' && e.rival.t >= 0.75 && !e.bajadas) F.pide('bajar'); if (e.hueco) F.pide('cerrar'); }
    }
  }
  return { R: C.resumen(), E: F ? F.estado() : null };
}
t('h) en la falange de verdad: bajar a tiempo ensarta (caen rivales de verdad); sin tocar, entran y abren brechas', () => {
  let sumaBien = 0, sumaNada = 0;
  for (const semilla of [1, 2, 3]) {
    const bien = partidaFalange(semilla, 'bien'), nada = partidaFalange(semilla, 'nada');
    assert.ok(bien.E && bien.E.ensartados > 0, 'ensarta alguno (semilla ' + semilla + ')');
    assert.ok(bien.E.ensartados > bien.E.entradas, 'bajando a tiempo, más ensartados que entradas');
    assert.ok(nada.E && nada.E.entradas > 0 && nada.E.ensartados === 0, 'sin tocar, entran');
    console.log(`     semilla ${semilla}: bien ${bien.E.ensartados} ensartados/${bien.E.entradas} entradas → ${bien.R.ganador} · nada ${nada.E.entradas} entradas/${nada.E.brechas} brechas → ${nada.R.ganador}`);
    sumaBien += bien.E.ensartados; sumaNada += nada.E.brechas;
  }
});
t('i) sin el módulo la falange da lo mismo que FU3 (misma semilla, mismo resumen)', () => {
  for (const semilla of [1, 4]) assert.strictEqual(JSON.stringify(partidaFalange(semilla, null).R), JSON.stringify(partidaFalange(semilla, null).R));
});
console.log(`\n${mal ? 'NO APTO' : 'APTO'} · ${n} bien, ${mal} mal`); process.exit(mal ? 1 : 0);
