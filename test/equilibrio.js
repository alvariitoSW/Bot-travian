/* Bot que mide el equilibrio de las batallas: node test/equilibrio.js [--n 40]
   Auto-batalla sin plan del jugador. Imprime victorias del bando A (lado 0) por tamaño, calidad, bisoñas, terreno y dificultad. */
require('../js/data.js');
const { Battle } = require('../js/battle.js');
const side = (units, extra) => Object.assign({ units, name: 'x', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, extra || {});
const HAST = 480;
function una(opt) {
  opt = opt || {};
  const a = side({ hastati: Math.round(HAST * (opt.k || 1)) }, opt.A), b = side({ hastati: HAST }, opt.B);
  const bt = new Battle(Object.assign({ sides: [a, b], defender: 1, wall: 0, seed: opt.seed || 1 }, opt.cfg || {}));
  bt.finish(); const r = bt.result(); return { gana: r.winner === 0, t: r.time };
}
function serie(n, f) { let g = 0, t = 0; for (let s = 1; s <= n; s++) { const r = una(f(s)); if (r.gana) g++; t += r.t; } return { pct: Math.round(100 * g / n), seg: Math.round(t / n) }; }
// dificultad por contexto: modo rondas con la IA del rival; el jugador no da órdenes (acción automática). Los escenarios van de fácil a duro.
const gen = (n, extra) => ({ gen: Object.assign({ n: n }, extra || {}) });
const ESCENARIOS = [
  { n: 'fácil: mayor, rival impetuoso en llano', yo: [{ hastati: 220, principes: 80, equites: 30 }, gen('Cónsul')], el: [{ galos: 200, jinetes: 40 }, Object.assign(gen('Jefe galo'), { name: 'Galos ínsubres' })], ter: 'llano', def: 1 },
  { n: 'parejo: algo mayor, en llano', yo: [{ hastati: 235, equites: 45 }, gen('Cónsul')], el: [{ libios: 150, iberos: 60, numidas: 60 }, gen('Rival')], ter: 'llano', def: 1 },
  { n: 'duro: parejo, rival en colina, astuto', yo: [{ hastati: 205, equites: 40 }, gen('Cónsul')], el: [{ libios: 150, iberos: 60, numidas: 60 }, Object.assign(gen('Aníbal', { mando: 3, disc: 2 }), { name: 'Cartago' })], ter: 'colina', def: 1 },
  { n: 'muy duro: menor, rival en cerro con general', yo: [{ hastati: 250, equites: 40 }, gen('Cónsul')], el: [{ falange: 190, hoplitas: 50, elefantes: 6 }, Object.assign(gen('Pirro', { mando: 4, disc: 3 }), { name: 'Epiro' })], ter: 'cerro', def: 1 }
];
// (N15b) ventaja clara sin órdenes del jugador: 1,2x y 1,5x de hastati contra hastati con general rival
const VENTAJA = [
  { n: 'ventaja 1,2x en llano (sin órdenes)', yo: [{ hastati: 288 }, gen('Cónsul')], el: [{ hastati: 240 }, gen('Rival')], ter: 'llano', def: 1 },
  { n: 'ventaja 1,5x en llano (sin órdenes)', yo: [{ hastati: 360 }, gen('Cónsul')], el: [{ hastati: 240 }, gen('Rival')], ter: 'llano', def: 1 }
];
// (N15b) 0,67x con buen plan: el jugador defiende en cerro (ataca por iniciativa propia), cierra testudo (las pesadas) y juega la carta de formación cerrada
function conPlan(n, k) {
  let g = 0, t = 0;
  for (let s = 1; s <= n; s++) {
    const e = { yo: [{ hastati: Math.round(HAST * (k || 0.67)) }, gen('Cónsul')], el: [{ hastati: HAST }, gen('Rival')], ter: 'cerro', def: 0 };
    const bt = new Battle(configEscenario(e, s));
    let guardia = 0;
    while (!bt.over && guardia++ < 90) {
      if (bt.ronda === 0 || guardia === 1) { bt.jugarCarta('cerrada'); }
      for (const r of bt.regs) if (r.side === 0 && r.k !== 'general' && r.st === 'ok' && r.form !== 'testudo' && bt.formacionesPosibles(r).indexOf('testudo') >= 0) bt.ponerFormacion(r, 'testudo');
      bt.ejecutar(); let kk = 0; while (bt.fase === 'ejecucion' && !bt.over && kk++ < 400) bt.step(0.1);
    }
    if (bt.over && bt.winner === 0) g++; t += bt.t;
  }
  return { pct: Math.round(100 * g / n), seg: Math.round(t / n) };
}
// (N15c) 0,67x con plan de aguante: el jugador se queda quieto (aguantar) con el relevo puesto y cierra la carta de formación cerrada; el rival, mayor, acaba bajando del cerro
function conAguante(n, k) {
  let g = 0, t = 0;
  for (let s = 1; s <= n; s++) {
    const e = { yo: [{ hastati: Math.round(HAST * (k || 0.67)) }, gen('Cónsul')], el: [{ hastati: HAST }, gen('Rival')], ter: 'cerro', def: 0 };
    const bt = new Battle(configEscenario(e, s));
    let guardia = 0;
    while (!bt.over && guardia++ < 90) {
      if (guardia === 1) bt.jugarCarta('cerrada');
      for (const r of bt.regs) if (r.side === 0 && r.k !== 'general' && r.st === 'ok' && (!r.order || r.order.k === 'quieto')) r.order = { k: 'quieto', tipo: 'aguantar' };
      bt.autoRelevo(0);
      bt.ejecutar(); let kk = 0; while (bt.fase === 'ejecucion' && !bt.over && kk++ < 400) bt.step(0.1);
    }
    if (bt.over && bt.winner === 0) g++; t += bt.t;
  }
  return { pct: Math.round(100 * g / n), seg: Math.round(t / n) };
}
// (N15d) 0,67x con el plan completo, el que exige jugar bien: tomar la cima del cerro antes que el rival (dos tandas, que el mando no da para más),
// carta de formación cerrada, relevo de los cansados, el general pegado a la acción y cargas de los regimientos libres sobre el enemigo más tocado.
// Son pocas órdenes por ronda: un plan que una persona puede ejecutar en el móvil. Nadie se queda quieto con «Aguantar».
function conPlanCompleto(n, k) {
  let g = 0, t = 0;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  for (let s = 1; s <= n; s++) {
    const e = { yo: [{ hastati: Math.round(HAST * (k || 0.67)) }, gen('Cónsul')], el: [{ hastati: HAST }, gen('Rival')], ter: 'cerro', def: 0 };
    const bt = new Battle(configEscenario(e, s));
    const CX = bt.W / 2, CY = bt.H / 2;   // la cima del cerro, en el centro del campo
    let guardia = 0;
    while (!bt.over && guardia++ < 90) {
      const mios = bt.regs.filter(r => r.side === 0 && r.st === 'ok' && r.k !== 'general');
      const ene = bt.regs.filter(r => r.side === 1 && r.st === 'ok' && r.k !== 'general');
      const gl = bt.generalVivo(0);
      if (bt.ronda === 1) bt.jugarCarta('cerrada');
      if (bt.ronda <= 2) {   // subir a la cima en línea compacta, por tandas
        const l = mios.slice().sort((a, b) => Math.abs(a.x - CX) - Math.abs(b.x - CX)), sel = bt.ronda === 1 ? l.slice(0, 4) : l.slice(4, 8);
        sel.forEach((r, i) => { if (bt.cupo(r)) r.order = { k: 'move', x: CX + (i - (sel.length - 1) / 2) * 56, y: CY + (bt.ronda === 1 ? 0 : 55), tipo: 'avanzar' }; });
      } else {
        bt.autoRelevo(0);   // relevo: el cansado atrás, el fresco al frente
        const trabados = ene.filter(q => mios.some(m => dist(q, m) < 70));
        const libres = mios.filter(m => m.fat < 55 && !ene.some(q => dist(q, m) < 75) && !(m.order && m.order.tipo === 'relevar'));
        const usados = new Set(); let c = 0;
        for (const q of trabados.sort((a, b) => (a.mor / a.morMax + a.men / a.max) - (b.mor / b.morMax + b.men / b.max))) {
          if (c >= 2) break;   // dos cargas por ronda: las que caben en el mando
          const m = libres.find(x => !usados.has(x) && dist(x, q) < 300);
          if (m && bt.cupo(m)) { m.order = { k: 'atk', r: q, tipo: 'cargar' }; usados.add(m); c++; }
        }
      }
      if (gl) {   // el general, pegado a la acción: si no, las órdenes llegan tarde
        const ax = ene.length ? ene.reduce((a, r) => a + r.x, 0) / ene.length : CX, ay = ene.length ? ene.reduce((a, r) => a + r.y, 0) / ene.length : CY;
        const gy = Math.min(bt.H - 20, ay + 120);
        if (Math.hypot(gl.x - ax, gl.y - gy) > 60 && bt.cupo(gl)) gl.order = { k: 'move', x: ax, y: gy, tipo: 'avanzar' };
      }
      if (!bt.ejecutar()) break;
      let kk = 0; while (bt.fase === 'ejecucion' && !bt.over && kk++ < 400) bt.step(0.1);
    }
    if (bt.over && bt.winner === 0) g++; t += bt.t;
  }
  return { pct: Math.round(100 * g / n), seg: Math.round(t / n) };
}
// (N15d) trampa: todos quietos con «Aguantar», sin otra orden (ni carta ni relevo) en el terreno dado; no debe ganar contra rivales que no superan 1,3x
function soloAguanta(n, k, ter) {
  let g = 0, t = 0;
  for (let s = 1; s <= n; s++) {
    const e = { yo: [{ hastati: Math.round(HAST * k) }, gen('Cónsul')], el: [{ hastati: HAST }, gen('Rival')], ter: ter || 'cerro', def: 0 };
    const bt = new Battle(configEscenario(e, s));
    let guardia = 0;
    while (!bt.over && guardia++ < 90) {
      for (const r of bt.regs) if (r.side === 0 && r.k !== 'general' && r.st === 'ok') r.order = { k: 'quieto', tipo: 'aguantar' };
      bt.ejecutar(); let kk = 0; while (bt.fase === 'ejecucion' && !bt.over && kk++ < 400) bt.step(0.1);
    }
    if (bt.over && bt.winner === 0) g++; t += bt.t;
  }
  return { pct: Math.round(100 * g / n), seg: Math.round(t / n) };
}
function configEscenario(e, seed) { return { sides: [Object.assign({ units: e.yo[0], name: 'Roma', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, e.yo[1]), Object.assign({ units: e.el[0], name: 'x', col: '#000', atkMul: 1, defMul: 1, mor: 0 }, e.el[1])], defender: e.def, wall: 0, seed: seed, rondas: true, terreno: e.ter }; }
function escenario(e, n) {
  let g = 0, nivel = 0;
  for (let s = 1; s <= n; s++) {
    const bt = new Battle(configEscenario(e, s)); nivel = bt.dif.nivel;
    let guardia = 0;
    while (!bt.over && guardia++ < 40) { bt.ejecutar(); let k = 0; while (bt.fase === 'ejecucion' && !bt.over && k++ < 400) bt.step(0.1); }
    if (bt.over ? bt.winner === 0 : bt.men(0) / bt.start[0] > bt.men(1) / bt.start[1]) g++;
  }
  return { pct: Math.round(100 * g / n), nivel: nivel };
}
function main() {
  const i = process.argv.indexOf('--n'), n = i > 0 ? +process.argv[i + 1] || 40 : 40;
  const fila = (t, r) => console.log('  ' + String(t).padEnd(34) + String(r.pct + ' %').padStart(6) + String(r.seg + ' s').padStart(8));
  console.log('Victorias del bando A (n=' + n + ')');
  console.log('Tamaño de A / B'); for (const k of [1.5, 1, 0.85, 0.67, 0.5]) fila(k + 'x', serie(n, s => ({ k, seed: s })));
  console.log('Calidad de A (ataque y defensa), igual tamaño'); for (const q of [1.05, 1.1, 1.2]) fila(q + 'x calidad', serie(n, s => ({ seed: s, A: { atkMul: q, defMul: q } })));
  console.log('Calidad contra tamaño'); fila('1.2x calidad, 0.85x tamaño', serie(n, s => ({ k: 0.85, seed: s, A: { atkMul: 1.2, defMul: 1.2 } }))); fila('1.2x calidad, 0.67x tamaño', serie(n, s => ({ k: 0.67, seed: s, A: { atkMul: 1.2, defMul: 1.2 } })));
  fila('moral +10', serie(n, s => ({ seed: s, A: { mor: 10 } })));
  console.log('Levas bisoñas de A contra veterana (igual tamaño)'); for (const b of [0.5, 1]) fila('bis ' + b, serie(n, s => ({ seed: s, A: { bis: b } })));
  fila('milicia 200 contra hastati 200', (() => { let g = 0, t = 0; for (let s = 1; s <= n; s++) { const bt = new Battle({ sides: [side({ milicia: 200 }), side({ hastati: 200 })], defender: 1, wall: 0, seed: s }); bt.finish(); const r = bt.result(); if (r.winner === 0) g++; t += r.time; } return { pct: Math.round(100 * g / n), seg: Math.round(t / n) }; })());
  console.log('Terreno (A 0.85x)'); for (const ter of ['llano', 'paso', 'rio']) fila(ter, serie(n, s => ({ k: 0.85, seed: s, cfg: { terreno: ter } })));
  fila('0.67x con buen plan (cerro, testudo)', conPlan(Math.min(n, 30), 0.67)); fila('0.67x con el plan completo', conPlanCompleto(Math.min(n, 30), 0.67)); fila('0.67x con plan de aguante (quieto)', conAguante(n, 0.67)); fila('0.67x sin órdenes (a pelo)', serie(n, s => ({ k: 0.67, seed: s }))); fila('0.85x con buen plan', conPlan(Math.min(n, 30), 0.85));
  console.log('Trampa de aguantar (todos quietos, sin otra orden; cerro / llano)'); for (const k of [0.85, 1, 1.15]) { fila(k + 'x quieto cerro', soloAguanta(Math.min(n, 30), k, 'cerro')); fila(k + 'x quieto llano', soloAguanta(Math.min(n, 30), k, 'llano')); }
  console.log('Dificultad por contexto (rondas, sin órdenes del jugador; victorias del jugador y nivel -1..1)');
  for (const e of ESCENARIOS.concat(VENTAJA)) { const r = escenario(e, Math.min(n, 30)); console.log('  ' + e.n.padEnd(46) + String(r.pct + ' %').padStart(6) + '  nivel ' + r.nivel); }
}
if (require.main === module) main(); else module.exports = { soloAguanta, conAguante, conPlan, conPlanCompleto, VENTAJA, una, serie, escenario, ESCENARIOS, configEscenario };
