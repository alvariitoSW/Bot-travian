/* R2: consejo de tribunos. node test/consejo.test.js */
const assert = require('assert');
const D = require('../js/data.js');
const { Battle } = require('../js/battle.js');
const side = (units, extra) => Object.assign({ units, name: 'x', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, extra || {});
const mk = (seed, ex) => new Battle(Object.assign({ sides: [side({ hastati: 150, velites: 40, equites: 40 }, { gen: { n: 'Cónsul' } }), side({ libios: 150, numidas: 40, jinetes: 40 }, { gen: { n: 'Rival' } })], defender: 1, wall: 0, seed: seed, rondas: true }, ex || {}));
const sim = (b) => { let k = 0; while (b.fase === 'ejecucion' && !b.over && k++ < 2000) b.step(0.05); };

// las tarjetas: hasta tres, de tipos distintos, con tribuno, título, motivo y etiqueta
{
  const b = mk(5), c = b.consejo();
  assert(c.length >= 2 && c.length <= 3, 'hay 2 o 3 tarjetas (' + c.length + ')');
  assert.strictEqual(new Set(c.map(x => x.clave)).size, c.length, 'tipos distintos');
  for (const x of c) {
    assert(x.tribuno && x.titulo && x.motivo, 'tribuno, título y motivo'); assert(['Favorable', 'Dudoso', 'Arriesgado'].includes(x.etiqueta), 'etiqueta ' + x.etiqueta);
    const act = x.ordenes.filter(p => p[1].k !== 'quieto').length; assert(act <= b.mandoPuntos().max, 'respeta los puntos de mando');
    for (const p of x.ordenes) { assert.strictEqual(p[0].side, 0, 'solo órdenes propias'); assert(!p[1].ia && p[1].hasta === undefined, 'sin marcas del enemigo'); }
  }
  assert.deepStrictEqual(c.map(x => x.tribuno), [...new Set(c.map(x => x.tribuno))], 'un tribuno por tarjeta');
  assert(b.regs.every(r => !r.order), 'consejo() no cambia nada');
  const lleno = JSON.stringify(b.consejo().map(x => [x.clave, x.etiqueta])); assert.strictEqual(lleno, JSON.stringify(c.map(x => [x.clave, x.etiqueta])), 'es determinista');
  // aplicar = poner las órdenes
  const ap = b.aplicarConsejo(0); assert(ap && b.regs.some(r => r.side === 0 && r.order), 'aplicarConsejo pone órdenes'); assert(b.mandoPuntos().usados <= b.mandoPuntos().max);
  assert.strictEqual(b.aplicarConsejo(9), null);
  assert.strictEqual(b.ejecutar(), true, 'se puede ver la ronda tras una tarjeta');
  assert.deepStrictEqual(mk(5).consejo().length, c.length);
}
// fuera del plan no hay consejo
{ const b = mk(5); b.ejecutar(); assert.deepStrictEqual(b.consejo(), []); const s = new Battle({ sides: [side({ hastati: 50 }), side({ libios: 50 })], defender: 1, wall: 0, seed: 1 }); assert.deepStrictEqual(s.consejo(), []); }
// etiquetas: ventaja clara, flanco libre, inferioridad
{
  const b = mk(5), r0 = b.regs.filter(r => r.side === 0 && r.k !== 'general'), r1 = b.regs.filter(r => r.side === 1);
  const o = [[r0[0], { k: 'atk', r: r1[0], tipo: 'avanzar' }]];
  b.regs.forEach(r => { r.x = r.side === 0 ? 100 : 100; r.y = r.side === 0 ? 700 : 100; });
  for (const r of r0) r.men = 400; for (const r of r1) r.men = 10;
  assert.strictEqual(b.consejoEtiqueta('centro', o), 'Favorable', 'superior en más de 15 %');
  for (const r of r0) r.men = 30; for (const r of r1) r.men = 400;
  assert.strictEqual(b.consejoEtiqueta('centro', o), 'Arriesgado', 'inferior en más de 15 %');
  r0.forEach(r => { r.x = 100; r.y = 100; }); r1.forEach(r => { r.men = r0[0].men; r.x = 100; r.y = 100; }); r0.forEach(r => r.men = r1[0].men);
  assert.strictEqual(b.consejoEtiqueta('centro', o), 'Dudoso', 'parejo');
}
// objetivo de aceptación: se gana una igualada tocando solo tarjetas y «Ver la ronda»
{
  let ganadas = 0, rondas = 0; const N = 8;
  for (let sd = 1; sd <= N; sd++) {
    const b = mk(sd), pref = ['Favorable', 'Dudoso', 'Arriesgado'];
    let g = 0;
    while (!b.over && g++ < 40) {
      const c = b.consejo(); if (!c.length) { b.ejecutar(); sim(b); continue; }
      // el "jugador" lee las etiquetas: la mejor tarjeta
      let mejor = 0; c.forEach((x, i) => { const v = (y) => pref.indexOf(y.etiqueta) * 2 + (y.clave === 'firmes' ? 1 : 0); if (v(x) < v(c[mejor])) mejor = i; });   // la mejor etiqueta; a igualdad, no quedarse quieto
      b.aplicarConsejo(mejor); assert(b.ejecutar(), 'ver la ronda'); sim(b); rondas++;
    }
    assert(b.over, 'la batalla acaba solo con tarjetas (semilla ' + sd + ')'); if (b.winner === 0) ganadas++;
  }
  console.log('R2: tarjetas solas, igualada: ' + ganadas + '/' + N + ' victorias, ' + (rondas / N).toFixed(1) + ' rondas por batalla');
  assert(ganadas >= 3, 'tocando solo tarjetas se puede ganar una igualada (' + ganadas + '/' + N + ')');
}
console.log('R2: consejo de tribunos OK');
