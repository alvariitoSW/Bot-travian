/* CB3: el motor de lucha (js/combate.js) decide la lucha a pie de la escena de bloques («Bajar a pie»), por js/combate-tropas.js.
   Caso contable: con el motor, romanos contra galos (despliegue de serie, nivel normal, el bot «bueno»): cuántas de 10 gana tu manípulo
   y cuánto dura. El «antes» (sin motor, solo reglas de bloque, la misma escena con física) se mide aquí mismo con las mismas semillas.
   Varas: gana lo mismo que antes; dura ±30 % de antes; el motor tumba de verdad (y cada caído suyo es la figura que cae); coste del
   motor de lucha < 1 ms por paso con las fuerzas tope de «Bajar a pie» (600 hombres, LP7); misma semilla, misma partida. */
import assert from 'node:assert';
import * as BL from '../js/bloque.js';
import { crearCombate } from '../js/bloque-ia.js';
import { FIN_LUCHA } from '../js/falange.js';
import { crearTropas } from '../gobierno/maquetas/bloque/tropas.js';
import { crearFisicaBloque } from '../gobierno/maquetas/bloque/fisica.js';
import { crearLucha, TROPA } from '../js/combate-tropas.js';

let bien = 0, mal = 0;
const t = (n, f) => { try { f(); bien++; console.log('  ✓ ' + n); } catch (e) { mal++; console.log('  ✗ ' + n + '\n    ' + e.message); } };
const DT = 0.1, SEMILLAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const LP7 = { fuerzas: { tuyo: 120, centro: 120, amigas: [70, 70], alas: [70, 70], reserva: 50, tiradores: 30 }, lejos: 50, fin: FIN_LUCHA };

function partida(semilla, lucha, extra = {}, tMax = 300) {
  const C = crearCombate({ semilla, nivel: 'normal', motor: BL, avisa: () => {}, lucha, ...extra }), S = C.S;
  const TR = crearTropas({ S }), FS = crearFisicaBloque({ S, TR, semilla }), LU = lucha === 'motor' ? crearLucha({ C, TR, semilla }) : null;
  let marcadosVivos = 0;
  while (!S.ganador && S.T < tMax) {
    C.bot('bueno'); C.paso(DT); TR.paso(DT, S.T); FS.paso(DT); LU && LU.paso(DT);
    /* el que tumbó el motor cae en el paso siguiente de tropas.js: no debe quedar ninguno marcado en pie dos pasos después */
    for (const f of TR.figs) if (f.marcado && f.marcadoT == null) f.marcadoT = S.T; else if (f.marcado && S.T - f.marcadoT > 2.5 * DT && !f.duelo) marcadosVivos++;
  }
  const choque = Math.min(...S.bloques.map(b => b.tPrimer ?? Infinity));
  return { ganador: S.ganador, T: +S.T.toFixed(1), lucha: +(S.T - choque).toFixed(1), tuyo: S.tuyo.U.enPie, lu: LU && LU.medir(), marcadosVivos, caidos: TR.caidos.length };
}
const resume = L => ({ gana: L.filter(r => r.ganador === 'tuyo').length, T: +(L.reduce((a, r) => a + r.T, 0) / L.length).toFixed(1), lucha: +(L.reduce((a, r) => a + r.lucha, 0) / L.length).toFixed(1) });

console.log('CB3 · el motor de lucha en la batalla a pie');
const antes = SEMILLAS.map(s => partida(s, 'reglas')), con = SEMILLAS.map(s => partida(s, 'motor'));
const A = resume(antes), M = resume(con);
const caeMotor = con.reduce((a, r) => a + (r.lu.eventos.cae || 0), 0) / con.length;
console.log(`   antes (reglas): gana tu manípulo ${A.gana} de 10, dura ${A.T} s (lucha ${A.lucha} s)`);
console.log(`   con el motor:   gana tu manípulo ${M.gana} de 10, dura ${M.T} s (lucha ${M.lucha} s); caídos del motor ${caeMotor.toFixed(0)} por partida; ` +
  `motor ${(con.reduce((a, r) => a + r.lu.ms, 0) / con.length).toFixed(3)} ms/paso con ${Math.round(con.reduce((a, r) => a + r.lu.hombres, 0) / con.length)} hombres`);

t('todas las tropas del juego tienen arma y escudo del motor', () => { for (const k of ['manipulo', 'galos', 'nobles', 'tiradores']) assert.ok(TROPA[k] && TROPA[k].arma && TROPA[k].escudo, k); });
t(`con el motor gana tu manípulo lo mismo que antes (${M.gana} de 10; antes ${A.gana})`, () => assert.ok(M.gana >= A.gana, `${M.gana} < ${A.gana}`));
t(`dura parecido: ${M.T} s con el motor, ${A.T} s antes (±30 %)`, () => assert.ok(Math.abs(M.T - A.T) <= 0.3 * A.T, `${M.T} vs ${A.T}`));
t('el motor tumba de verdad (≥ 40 caídos por partida) y cada caído suyo es una figura que cae', () => {
  assert.ok(caeMotor >= 40, 'caídos del motor ' + caeMotor);
  for (const r of con) assert.strictEqual(r.marcadosVivos, 0, 'figuras tumbadas por el motor que siguen en pie');
});
t('misma semilla, misma partida', () => {
  const a = partida(3, 'motor', {}, 60), b = partida(3, 'motor', {}, 60);
  assert.deepStrictEqual({ ...a, lu: a.lu.eventos }, { ...b, lu: b.lu.eventos });
});
t('coste: con las fuerzas tope de «Bajar a pie» (600 hombres) el motor de lucha cuesta < 1 ms por paso', () => {
  const r = partida(7, 'motor', LP7, 200);
  console.log(`   LP7 (600 hombres): ${r.lu.ms} ms por paso de media con ${r.lu.hombres} hombres en el motor (el peor paso ${r.lu.msMax} ms); gana ${r.ganador} en ${r.T} s`);
  assert.ok(r.lu.ms < 1, r.lu.ms + ' ms');
  assert.strictEqual(r.ganador, 'tuyo');
});
console.log(`\n${bien} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
