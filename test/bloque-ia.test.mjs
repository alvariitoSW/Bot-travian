/* AQVILA — LP2: las cuatro órdenes y el enemigo que piensa, sin pantalla. node test/bloque-ia.test.mjs (unos 10 s)
   Corre con el bloque de verdad de LP1 (js/bloque.js) moviendo tu manípulo. Comprobaciones 5, 6 y 7 de LP0 §6. */
import assert from 'node:assert';
import * as IA from '../js/bloque-ia.js';
import * as BL from '../js/bloque.js';
const { crearCombate, juega, ORDENES, NIVELES, NIVEL, SALVA_VUELO, T_RELEVO, AGOTADA, DT } = IA;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const SEM = k => Array.from({ length: k }, (_, i) => i + 1);
const partidas = (nivel, modo, k = 10) => SEM(k).map(s => juega(nivel, modo, s, DT, BL));
const gana = L => L.filter(r => r.ganador === 'tuyo').length;
const media = (L, f) => L.reduce((s, r) => s + f(r), 0) / L.length;
const nuevo = (o = {}) => crearCombate({ semilla: 1, nivel: 'normal', motor: BL, ...o });
/* avanza hasta que se cumpla f (o se acabe el tiempo) */
function hasta(C, f, tMax = 200, modo = null) { while (!C.S.ganador && C.S.T < tMax && !f(C)) { if (modo) C.bot(modo); C.paso(DT); } return f(C); }

/* ---------- el contrato ---------- */
t('contrato: cuatro órdenes (Cargar · Alto · Testudo · Relevo), tres niveles, bloque de LP1 debajo', () => {
  assert.deepStrictEqual(ORDENES, ['cargar', 'alto', 'testudo', 'relevo']);
  assert.deepStrictEqual(NIVELES, ['facil', 'normal', 'dificil']);
  const C = nuevo();
  for (const k of ['paso', 'orden', 'frente', 'dibujaFrente', 'ordenUtil', 'bot', 'resumen']) assert.strictEqual(typeof C[k], 'function', k);
  assert.ok(C.S.B && C.S.B.hombres.length === 120, 'el manípulo es un B de LP1 con 120 hombres');
  assert.ok(C.S.tuyo && C.S.amigas.length === 2 && C.S.ene.centro && C.S.ene.reserva && C.S.ene.tiradores);
});
t('misma semilla, misma partida', () => {
  const a = juega('dificil', 'bueno', 3, DT, BL), b = juega('dificil', 'bueno', 3, DT, BL);
  assert.deepStrictEqual(a, b);
});
t('sin el bloque de LP1 también corre (mover de reserva), sin números rotos', () => {
  for (const nivel of NIVELES) { const r = juega(nivel, 'bueno', 2); assert.ok(r.ganador && Number.isFinite(r.T) && Number.isFinite(r.perdidos), JSON.stringify(r)); }
});

/* ---------- las cuatro órdenes ---------- */
t('Testudo: bajo las jabalinas mueren muchos menos (≤ 1 de cada 5)', () => {
  const muertos = conTestudo => {
    const C = nuevo(); hasta(C, () => C.S.T > 5);
    if (conTestudo) C.orden('testudo');
    const antes = C.S.tuyo.U.enPie; C.S.salva = { t: C.S.T + 0.2, blanco: C.S.tuyo }; hasta(C, () => !C.S.salva, C.S.T + 3);
    return antes - C.S.tuyo.U.enPie;
  };
  let sin = 0, con = 0; for (let k = 0; k < 6; k++) { sin += muertos(false); con += muertos(true); }
  console.log('   jabalinas: sin testudo', sin, '· con testudo', con);
  assert.ok(sin >= 30 && con * 5 <= sin, `sin ${sin}, con ${con}`);
});
t('Testudo: anda despacio (≤ 0,6 m/s) y el bloque de LP1 lo sabe (B.mods.vel, B.orden)', () => {
  const C = nuevo(); C.orden('testudo'); C.frente({ x: 0, z: -15, ang: 0 });
  let vmax = 0; hasta(C, () => { vmax = Math.max(vmax, C.S.tuyo.v); return C.S.T > 12; });
  assert.ok(vmax <= 0.62 && vmax > 0.2, `vmax ${vmax}`); assert.strictEqual(C.S.B.orden, 'testudo'); assert.ok(C.S.B.mods.vel < 0.5);
});
t('Cargar: corren (> 2,5 m/s), lanzan el pilum una vez a ≤ 15 m y chocan con golpe de carga', () => {
  const ev = []; const C = nuevo({ avisa: (k, d) => ev.push([k, d, C.S.T]) });
  hasta(C, () => C.ordenUtil() === 'cargar'); C.orden('cargar');
  let vmax = 0; hasta(C, () => { vmax = Math.max(vmax, C.S.tuyo.v); return C.S.tuyo.contactos.length > 0; });
  assert.ok(vmax > 2.5, `vmax ${vmax}`);
  assert.strictEqual(ev.filter(e => e[0] === 'pilum').length, 1, 'un pilum');
  assert.ok(ev.some(e => e[0] === 'carga' && e[1].de === C.S.tuyo), 'golpe de carga tuyo');
  hasta(C, () => C.S.T > 60); assert.strictEqual(C.S.cuenta.pilum, 1, 'el pilum no se repite');
});
t('Relevo: la fila que pelea vuelve fresca; quedan 3 y no se puede abusar', () => {
  const C = nuevo(); C.orden('cargar'); hasta(C, () => C.S.tuyo.fila >= AGOTADA, 150);
  const f0 = C.S.tuyo.fila; assert.ok(C.orden('relevo')); assert.ok(!C.orden('relevo'), 'no dos a la vez');
  hasta(C, () => false, C.S.T + T_RELEVO + 0.3);
  assert.ok(f0 >= AGOTADA && C.S.tuyo.fila < 0.2, `fila ${f0} → ${C.S.tuyo.fila}`);
  assert.strictEqual(C.S.tuyo.relevos, 2);
});
t('Alto: se paran en menos de 3 s y recuperan cohesión fuera del choque', () => {
  const C = nuevo(); C.frente({ x: 0, z: -12, ang: 0 }); hasta(C, () => C.S.T > 4);
  C.S.tuyo.coh = 50; C.orden('alto'); hasta(C, () => false, C.S.T + 3);
  assert.ok(C.S.tuyo.v < 0.3, `v ${C.S.tuyo.v}`); assert.ok(C.S.tuyo.coh > 60, `coh ${C.S.tuyo.coh}`);
});
t('la orden útil se ilumina: Testudo con jabalinas en el aire, Cargar a 30 m, Relevo con la fila agotada', () => {
  const vistas = new Set(); const C = nuevo({ avisa: (k, d) => { if (k === 'ilumina') vistas.add(d.n); } });
  hasta(C, () => C.S.ganador, 300, 'bueno');
  for (const o of ['testudo', 'cargar', 'relevo']) assert.ok(vistas.has(o), `${o} no se iluminó (${[...vistas]})`);
  const D = nuevo(); hasta(D, () => C.S.T > 5); D.S.salva = { t: D.S.T + SALVA_VUELO, blanco: D.S.tuyo };
  assert.strictEqual(D.ordenUtil(), 'testudo');
});

/* ---------- el enemigo que piensa (comprobaciones 5, 6 y 7) ---------- */
const R = {}; for (const nivel of NIVELES) for (const modo of ['bueno', 'quieto', 'sinOrdenes', 'sinTestudo', 'sinRelevo', 'sinCargar']) R[nivel + modo] = partidas(nivel, modo);
const linea = L => L.map(r => `${r.ganador[0]}${r.flanqueado ? 'x' : ''}/${r.perdidos}`).join(' ');
t('5) Normal: la IA flanquea al bot quieto en ≥ 8 de 10, y el quieto pierde las 10', () => {
  const L = R.normalquieto, fl = L.filter(r => r.flanqueado).length; console.log('   flanquea', fl, '/10 · gana el quieto', gana(L));
  assert.ok(fl >= 8, linea(L)); assert.strictEqual(gana(L), 0, linea(L));
});
t('5) Difícil también flanquea (≥ 8 de 10) y finta en todas', () => {
  const L = R.dificilquieto; assert.ok(L.filter(r => r.flanqueado).length >= 8, linea(L));
  assert.ok(R.dificilbueno.every(r => r.fintas >= 1), 'sin finta');
});
t('6) Difícil no es fácil: el bot que juega bien gana entre 4 y 7 de cada 10 (semillas 1–10, 11–20, 21–30, 31–40)', () => {
  const L = partidas('dificil', 'bueno', 40), k = [0, 1, 2, 3].map(i => gana(L.slice(i * 10, i * 10 + 10)));
  console.log('   gana', k.join(' · '));
  for (const x of k) assert.ok(x >= 4 && x <= 7, k.join(' '));
});
t('los niveles se ordenan: el bot bueno gana 10 en Fácil, ≥ 8 en Normal y menos en Difícil', () => {
  const f = gana(R.facilbueno), m = gana(R.normalbueno), d = gana(R.dificilbueno); console.log('   Fácil', f, '· Normal', m, '· Difícil', d);
  assert.strictEqual(f, 10); assert.ok(m >= 8 && m > d, `${m} ${d}`);
});
t('7) las órdenes cuentan: con ellas se pierde menos de la mitad del manípulo; sin ellas, más de la mitad', () => {
  for (const nivel of NIVELES) {
    const con = media(R[nivel + 'bueno'], r => r.perdidos), sin = media(R[nivel + 'sinOrdenes'], r => r.perdidos);
    console.log(`   ${nivel}: con órdenes ${con.toFixed(1)} · sin órdenes ${sin.toFixed(1)} (de 120)`);
    assert.ok(con < 60 && sin > 60, `${nivel} ${con} ${sin}`);
  }
  const f = media(R.facilbueno, r => r.perdidos) / media(R.facilsinOrdenes, r => r.perdidos);
  assert.ok(f < 0.5, `Fácil: los que las usan pierden ${f.toFixed(2)} de lo que pierden los que no`);
});
t('7) cada orden cuenta por sí sola: quitar Testudo o Cargar hace perder más hombres en los tres niveles', () => {
  for (const nivel of NIVELES) for (const sin of ['sinTestudo', 'sinCargar']) {
    const a = media(R[nivel + 'bueno'], r => r.perdidos), b = media(R[nivel + sin], r => r.perdidos);
    assert.ok(b > a, `${nivel} ${sin}: ${b} ≤ ${a}`);
  }
  const a = media(R.facilbueno, r => r.perdidos), b = media(R.facilsinRelevo, r => r.perdidos);
  assert.ok(b > a, `Relevo en Fácil: ${b} ≤ ${a}`);
});

/* ---------- no te sigue al girar ---------- */
t('al girar tu bloque 90°, ningún enemigo salta (≤ 0,5 m por paso) ni cambia de plan antes de su tiempo de reacción', () => {
  for (const nivel of NIVELES) {
    const C = crearCombate({ semilla: 4, nivel, motor: BL }); hasta(C, () => C.S.T > 12);
    const E = C.S.bloques.filter(b => b.bando === 'g'), pos = new Map(E.map(b => [b, { x: b.x, z: b.z }])), cambios = new Map(E.map(b => [b, []]));
    const objDe = b => (b.obj ? `${b.obj.x.toFixed(2)},${b.obj.z.toFixed(2)}` : '-'); const ultimo = new Map(E.map(b => [b, objDe(b)]));
    C.frente({ x: C.S.tuyo.x, z: C.S.tuyo.z, ang: Math.PI / 2 });
    let salto = 0;
    hasta(C, () => {
      for (const b of E) {
        const p = pos.get(b); salto = Math.max(salto, Math.hypot(b.x - p.x, b.z - p.z)); pos.set(b, { x: b.x, z: b.z });
        const o = objDe(b); if (o !== ultimo.get(b)) { if (o !== '-') cambios.get(b).push(C.S.T); ultimo.set(b, o); }   /* llegar (obj → nada) no es cambiar de plan */
      }
      return C.S.T > 30;
    });
    assert.ok(salto <= 0.5, `${nivel}: salto ${salto.toFixed(2)} m`);
    const r = NIVEL[nivel].reaccion;
    for (const [b, L] of cambios) for (let i = 1; i < L.length; i++) assert.ok(L[i] - L[i - 1] >= r - DT - 1e-6, `${nivel} ${b.papel} cambia de plan a los ${(L[i] - L[i - 1]).toFixed(2)} s`);
    assert.ok(Math.abs(C.S.tuyo.ang) > 60 * Math.PI / 180, 'tu bloque sí giró');
  }
});
t('avisos: la salva se anuncia antes de caer; el flanco y la finta se avisan', () => {
  const ev = []; const C = crearCombate({ semilla: 2, nivel: 'dificil', motor: BL, avisa: (k, d) => ev.push({ k, d, T: C.S.T }) });
  hasta(C, () => C.S.ganador, 300, 'bueno');
  const s = ev.find(e => e.k === 'salva'), j = ev.find(e => e.k === 'jabalinas');
  assert.ok(s && j && Math.abs(j.T - s.T - SALVA_VUELO) < 0.25, 'salva y jabalinas');
  assert.ok(ev.some(e => e.k === 'flanco') && ev.some(e => e.k === 'finta'), 'flanco y finta');
  assert.ok(ev.some(e => e.k === 'fin'), 'fin');
});

console.log(`\n${n} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
