/* AQVILA — FU1: el testudo con el control del manípulo, sin pantalla. node test/fu1-testudo.test.mjs (unos 10 s)
   1) con la misma semilla, una salva con el bloque en testudo mata mucho menos (≤ 1/3) que sin él;
   2) el escenario «cruzar bajo las salvas» da exactamente DOS salvas mientras cruzas, y después los galos cargan y se lucha hasta el 15 %;
   3) sin escenario todo sigue como antes (cinco salvas, nada en S.escenario);
   4) el contrato de las formaciones (formaciones/manipulo.js y testudo.js) y la guardia de la física. */
import assert from 'node:assert';
import * as IA from '../js/bloque-ia.js';
import * as BL from '../js/bloque.js';
import { FIN_LUCHA } from '../js/falange.js';
import { crear as manipulo } from '../gobierno/maquetas/bloque/formaciones/manipulo.js';
import { crear as testudo, TECHO } from '../gobierno/maquetas/bloque/formaciones/testudo.js';
import { guardiaDeSerie, ESCUDO_ALTO } from '../gobierno/maquetas/bloque/fisica.js';
const { crearCombate, DT } = IA;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const MET = { x: 0, z: -62, ang: 0 };

/* la partida del escenario con un jugador guionizado: cruza hacia la colina; con `cubre`, cierra el testudo cuando viene la salva y lo abre al caer */
function cruza(semilla, cubre, nivel = 'normal') {
  const ev = [], C = crearCombate({ semilla, nivel, motor: BL, escenario: 'testudo', fin: FIN_LUCHA, avisa: (tipo, d) => ev.push({ tipo, T: C.S.T, d }) }), S = C.S;
  C.frente(MET); let contacto = false, tCarga = -1;
  while (!S.ganador && S.T < 300) {
    if (cubre && S.salva && S.tuyo.orden !== 'testudo') C.orden('testudo');
    if (cubre && S.tuyo.orden === 'testudo' && !S.salva && S.cuenta.salvas > 0 && S.escenario.fase === 'cruza') { C.orden('testudo'); C.frente(MET); }   /* cae la salva: abre y sigue cruzando */
    if (S.escenario.fase === 'carga') C.bot('bueno');
    C.paso(DT); if (S.tuyo.contactos.length) contacto = true; if (S.escenario.fase === 'carga' && tCarga < 0) tCarga = S.T;
  }
  return { C, S, ev, contacto, jab: ev.filter(e => e.tipo === 'jabalinas').map(e => e.d.muertos), salvas: ev.filter(e => e.tipo === 'salva').length };
}

t('una salva en testudo mata mucho menos (≤ 1/3) que sin él, con la misma semilla', () => {
  for (const semilla of [1, 2, 3, 4, 5, 6]) {
    const sin = cruza(semilla, false), con = cruza(semilla, true);
    assert.ok(sin.jab[0] > 0, 'sin testudo la primera salva mata a alguien (semilla ' + semilla + ')');
    assert.ok(con.jab[0] * 3 <= sin.jab[0], `semilla ${semilla}: con testudo ${con.jab[0]} · sin él ${sin.jab[0]}`);
    console.log(`     semilla ${semilla}: muertos por la 1.ª salva · sin testudo ${sin.jab[0]} · con testudo ${con.jab[0]}; 2.ª: ${sin.jab[1]} · ${con.jab[1]}`);
  }
});
t('el escenario da exactamente DOS salvas, mientras cruzas, y después los galos cargan y se lucha hasta el 15 %', () => {
  for (const [semilla, nivel] of [[1, 'normal'], [4, 'normal'], [2, 'facil'], [3, 'dificil']]) {
    const r = cruza(semilla, true, nivel), S = r.S;
    assert.strictEqual(r.salvas, 2, 'dos salvas lanzadas (' + nivel + ')'); assert.strictEqual(S.cuenta.salvas, 2, 'dos salvas caídas (' + nivel + ')');
    const tc = r.ev.find(e => e.tipo === 'escenario'); assert.ok(tc && tc.d.fase === 'carga', 'aviso de la carga');
    const ultima = r.ev.filter(e => e.tipo === 'jabalinas').pop(); assert.ok(tc.T >= ultima.T - 1e-9, 'los galos cargan después de la segunda salva');
    assert.ok(r.ev.filter(e => e.tipo === 'salva').every(e => e.T < tc.T), 'las dos salvas, antes de la carga');
    assert.ok(S.tuyo.z < -3 || r.contacto, 'cruzaste');
    assert.ok(r.contacto, 'hay lucha (' + nivel + ')');
    assert.ok(S.ganador, 'la partida acaba (' + nivel + ')'); assert.ok(S.tuyo.U.fin === FIN_LUCHA, 'se lucha hasta el 15 %');
    console.log(`     ${nivel} semilla ${semilla}: 2 salvas (${r.jab.join(' y ')} muertos), carga a los ${tc.T.toFixed(0)} s, acaba «${S.ganador}» a los ${S.T.toFixed(0)} s`);
  }
});
t('los tiradores no lanzan una tercera salva ni esperan al testudo (Normal y Difícil)', () => {
  for (const nivel of ['normal', 'dificil']) { const r = cruza(2, true, nivel); assert.strictEqual(r.salvas, 2, nivel); }
});
t('sin escenario todo sigue como antes: cinco salvas de serie, sin S.escenario', () => {
  const C = crearCombate({ semilla: 1, nivel: 'normal', motor: BL });
  assert.strictEqual(C.S.escenario, undefined); assert.strictEqual(C.S.ia.salvas, IA.SALVAS); assert.strictEqual(C.S.ene.tiradores.z, -58); assert.strictEqual(C.S.ene.centro.z, -70);
});
t('contrato de las formaciones y guardia de la física', () => {
  for (const [F, id, esc] of [[manipulo(), 'manipulo', null], [testudo(), 'testudo', 'testudo']]) {
    assert.strictEqual(F.id, id); assert.strictEqual(F.escenario, esc); assert.deepStrictEqual(F.ordenes, ['testudo', 'cargar', 'relevo', 'alto']);
    for (const k of ['util', 'mods', 'guardia', 'monta', 'paso', 'alAviso']) assert.strictEqual(typeof F[k], 'function', id + '.' + k);
  }
  const S = { tuyo: { orden: 'testudo' } };
  assert.strictEqual(guardiaDeSerie({ fila: 0 }, S), 'muro'); assert.strictEqual(guardiaDeSerie({ fila: 3 }, S), 'alto'); S.tuyo.orden = null; assert.strictEqual(guardiaDeSerie({ fila: 3 }, S), null);
  /* el techo cubre la caja de la física y queda por encima de la cabeza del hastatus de Meshy (1,751 m × talla ≤ 1,05) */
  assert.ok(TECHO.alto - TECHO.grueso / 2 > 1.751 * 1.05, 'techo sobre las cabezas'); assert.ok(Math.abs(TECHO.alto - ESCUDO_ALTO.y) < 0.05, 'techo donde choca la física');
  assert.strictEqual(TECHO.delante, ESCUDO_ALTO.delante);
});
console.log(`\n${mal ? 'NO APTO' : 'APTO'} · ${n} bien, ${mal} mal`); process.exit(mal ? 1 : 0);
