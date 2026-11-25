/* AQVILA — FU3c: sostener el empuje y othismos, sobre el motor de verdad de la falange. node test/fu3c-falange.test.mjs (segundos)
   a) el ciclo empieza acomete → empuje → othismos;
   b) sujetar todo el empuje: «¡Aguantan!» y sin metros perdidos por él; soltar: cede (ganado y cohesión bajan);
   c) othismos tocando en compás gana (fuerza ≥ 0,25 al acabar el tiempo: con 0,8 s por compás no cabe llegar a +1, ganado sube, cae un rival); sin tocar pierde; a destiempo no gana;
   d) fuera de contacto no pasa nada;
   e) jugar bien (baja, cierra, sujeta, toca en compás) acaba con más en pie y más cohesión que no tocar, en 3 semillas (bots de FA1 al mando);
   f) sin el módulo, las cifras de FU3 no cambian. */
import assert from 'node:assert';
import { combate } from '../gobierno/maquetas/bloque/formaciones/falange.js';
import { crearFalangita } from '../gobierno/maquetas/bloque/falangita.js';
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const azarDe = s => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const D = 1 / 30;

function alChoque(semilla, lejos) {
  const C = combate({ semilla }), ev = [];
  if (lejos) return { C, F: crearFalangita({ S: C.S, motor: C.motor, azar: azarDe(semilla * 31 + 7), alAviso: (tipo, d) => ev.push({ tipo, d }) }), ev };
  while (!C.trabado() && C.S.T < 120) { C.bot('bueno'); C.paso(D); }
  assert.ok(C.trabado(), 'hay choque');
  return { C, F: crearFalangita({ S: C.S, motor: C.motor, azar: azarDe(semilla * 31 + 7), alAviso: (tipo, d) => ev.push({ tipo, d }) }), ev };
}
/* un paso con un jugador: baja y cierra siempre; opts.suj ('si'|'no'|undefined=según el evento), opts.toca ('compas'|'destiempo'|'nada') */
function juega(Z, o = {}) {
  const { C, F } = Z; if (o.bot !== false) C.bot('bueno'); C.paso(D); F.paso(D);
  const e = F.estado();
  if (o.baja !== false) { if (e.rival && e.rival.fase === 'acomete' && e.rival.t >= 0.75 && !e.bajadas) F.pide('bajar'); if (e.hueco) F.pide('cerrar'); }
  F.pide('sostener', { on: o.suj === 'si' ? !!e.empuje : false });
  if (e.othismos && e.othismos.fase === 'empuja' && o.toca) {
    const c = e.othismos.compas, quiere = o.toca === 'compas' ? c < 0.08 : o.toca === 'destiempo' ? Math.abs(c - 0.5) < 0.03 : false;
    if (quiere && !(Z.ult != null && C.S.T - Z.ult < 0.4)) { F.pide('golpe'); Z.ult = C.S.T; }
  }
  return e;
}
const hasta = (Z, o, f, max = 90) => { const T0 = Z.C.S.T; for (;;) { const e = juega(Z, o); if (f(e)) return e; if (Z.C.S.T - T0 > max || Z.C.S.ganador) throw new Error('no llega'); } };
const fal = Z => Z.C.S.fal;
const tipos = ev => ev.map(e => e.tipo);

t('a) el ciclo empieza acomete → empuje → othismos', () => {
  for (const s of [1, 2, 3]) {
    const Z = alChoque(s), orden = [], vis = {};
    while (orden.length < 3 && Z.C.S.T < 120) { const e = juega(Z, { suj: 'si', toca: 'compas' }); const k = e.rival && e.rival.fase === 'acomete' ? 'acomete' : e.empuje ? 'empuje' : e.othismos ? 'othismos' : null; if (k && !vis[k]) { vis[k] = 1; orden.push(k); } }
    assert.deepStrictEqual(orden, ['acomete', 'empuje', 'othismos'], 'semilla ' + s);
    assert.ok(Z.F.estado().primera, 'primera existe');
  }
});

/* empuje: mismo guion, sujetando o soltando; mide el tramo del empuje */
function tramoEmpuje(semilla, suj) {
  const Z = alChoque(semilla); hasta(Z, { suj, bot: false }, e => e.empuje && e.empuje.fase === 'empuja');
  const g0 = fal(Z).ganado, c0 = fal(Z).coh, a0 = Z.F.estado().aguantes, ce0 = Z.F.estado().cedidos;
  hasta(Z, { suj, bot: false }, () => Z.F.estado().aguantes + Z.F.estado().cedidos > a0 + ce0, 10);
  const E = Z.F.estado(); return { dg: fal(Z).ganado - g0, dc: fal(Z).coh - c0, E, Z };
}
t('b) sujetar todo el empuje: ¡Aguantan! y sin metros perdidos; soltar: cede (ganado y cohesión bajan)', () => {
  for (const s of [1, 2, 3]) {
    const si = tramoEmpuje(s, 'si'), no = tramoEmpuje(s, 'no');
    assert.strictEqual(si.E.eco.texto, '¡Aguantan!'); assert.strictEqual(si.E.aguantes, 1); assert.ok(si.dg > -0.05, 'sujeto: ganado ' + si.dg);
    assert.strictEqual(no.E.eco.texto, 'La fila cede'); assert.strictEqual(no.E.cedidos, 1); assert.ok(no.dg < si.dg - 1, `suelto cede: ${no.dg} vs ${si.dg}`); assert.ok(no.dc < si.dc - 5, `cohesión ${no.dc} vs ${si.dc}`);
    console.log(`     semilla ${s}: sujeto ganado ${si.dg.toFixed(2)} coh ${si.dc.toFixed(1)} · suelto ganado ${no.dg.toFixed(2)} coh ${no.dc.toFixed(1)}`);
  }
});
function othismos(semilla, toca) {
  const Z = alChoque(semilla); hasta(Z, { suj: 'si', toca, bot: false }, e => e.othismos && e.othismos.fase === 'empuja');
  const g0 = fal(Z).ganado, v0 = fal(Z).ene.filter(h => h.vivo).length, c0 = fal(Z).coh; let fmax = 0;
  hasta(Z, { suj: 'si', toca, bot: false }, e => { if (e.othismos) fmax = Math.max(fmax, e.othismos.fuerza); return !e.othismos; }, 10);
  const E = Z.F.estado(); return { E, fmax, dg: fal(Z).ganado - g0, caidos: v0 - fal(Z).ene.filter(h => h.vivo).length, dc: fal(Z).coh - c0 };
}
t('c) othismos: en compás gana, sin tocar pierde, a destiempo no gana', () => {
  for (const s of [1, 2, 3]) {
    const bien = othismos(s, 'compas'), nada = othismos(s, 'nada'), mal_ = othismos(s, 'destiempo');
    console.log(`     semilla ${s}: compás ${bien.E.eco.texto} fmax ${bien.fmax.toFixed(2)} ganado ${bien.dg.toFixed(2)} caen ${bien.caidos} · nada ${nada.E.eco.texto} ganado ${nada.dg.toFixed(2)} coh ${nada.dc.toFixed(1)} · destiempo ${mal_.E.eco.texto}`);
    assert.strictEqual(bien.E.othGanados, 1, 'gana'); assert.ok(bien.fmax >= 0.25, 'fuerza llega al umbral de victoria'); assert.ok(bien.dg > 1, 'ganado sube'); assert.ok(bien.caidos >= 1, 'cae un rival');
    assert.strictEqual(nada.E.othPerdidos, 1, 'sin tocar pierde'); assert.ok(nada.dg < bien.dg - 2 && nada.dc < 0, 'sin tocar: ganado ' + nada.dg + ' coh ' + nada.dc);
    assert.strictEqual(mal_.E.othGanados, 0, 'a destiempo no gana');
  }
});
t('d) fuera de contacto no pasa nada', () => {
  const Z = alChoque(1, true), ev = [], F = Z.F; F.pide('sostener', { on: true }); F.pide('golpe');
  for (let k = 0; k < 600; k++) { Z.C.paso(D); F.paso(D); }
  const e = F.estado(); assert.strictEqual(e.lucha, false); assert.strictEqual(e.empuje, null); assert.strictEqual(e.othismos, null); assert.strictEqual(e.aguantes + e.cedidos + e.othGanados + e.othPerdidos, 0);
});
function partida(semilla, modo) {   /* modo: null = sin módulo · 'bien' · 'nada' (el módulo sin gesto) */
  const C = combate({ semilla }); let Z = null;
  while (!C.S.ganador && C.S.T < 240) {
    C.bot('bueno'); C.paso(D);
    if (modo && !Z && C.trabado()) { const m0 = C.motor.cohesion; C.motor.cohesion = x => { if (Z && Z.dentro) Z.perdida += Math.min(0, x); return m0(x); }; Z = { perdida: 0, dentro: false, C, F: crearFalangita({ S: C.S, motor: C.motor, azar: azarDe(semilla * 31 + 7) }) }; }
    if (Z) { Z.sc = (Z.sc || 0) + C.S.fal.coh; Z.n = (Z.n || 0) + 1; Z.mn = Math.min(Z.mn ?? 100, C.S.fal.coh); Z.dentro = true; Z.F.paso(D); Z.dentro = false; const e = Z.F.estado(), bien = modo === 'bien';
      if (bien) { if (e.rival && e.rival.fase === 'acomete' && e.rival.t >= 0.75 && !e.bajadas) Z.F.pide('bajar'); if (e.hueco) Z.F.pide('cerrar'); Z.F.pide('sostener', { on: !!e.empuje });
        if (e.othismos && e.othismos.fase === 'empuja' && e.othismos.compas < 0.08 && !(Z.ult != null && C.S.T - Z.ult < 0.4)) { Z.F.pide('golpe'); Z.ult = C.S.T; } } }
  }
  const F = C.S.fal; return { perdida: Z ? Z.perdida : 0, cohMin: Z ? Z.mn : 100, cohMedia: Z && Z.n ? Z.sc / Z.n : 100, R: C.resumen(), E: Z ? Z.F.estado() : null, pie: F.fal.filter(h => h.vivo).length, coh: F.coh, ganado: F.ganado, rivales: F.ene.filter(h => h.vivo).length, T: C.S.T };
}
t('e) jugar bien: más en pie y más cohesión que sin tocar (3 semillas)', () => {
  const sin = {}, bien = {}, nada = {};
  for (const s of [1, 2, 3]) {
    sin[s] = partida(s, null); bien[s] = partida(s, 'bien'); nada[s] = partida(s, 'nada');
    const f = (nom, p) => `${nom}: en pie ${p.pie}, perdida por gestos ${p.perdida.toFixed(0)}, coh mín ${p.cohMin.toFixed(0)} final ${p.coh.toFixed(0)}, ganado ${p.ganado.toFixed(1)}, rivales ${p.rivales}, ${p.R.ganador || '-'}@${Math.round(p.T)}`;
    console.log(`     semilla ${s} · ${f('sin gesto', sin[s])} · ${f('bien', bien[s])} · ${f('sin tocar', nada[s])}`);
  }
  const suma = (o, k) => [1, 2, 3].reduce((a, s) => a + o[s][k], 0);
  assert.ok(suma(bien, 'pie') > suma(nada, 'pie'), 'más en pie'); assert.ok(suma(bien, 'perdida') > suma(nada, 'perdida'), 'menos cohesión perdida por los gestos'); 
});
t('f) sin el módulo la falange da lo mismo que FU3 (misma semilla, mismo resumen)', () => {
  for (const s of [1, 4]) assert.strictEqual(JSON.stringify(partida(s, null).R), JSON.stringify(partida(s, null).R));
});
console.log(`\n${mal ? 'NO APTO' : 'APTO'} · ${n} bien, ${mal} mal`); process.exit(mal ? 1 : 0);
