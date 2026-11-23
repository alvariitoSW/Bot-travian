/* AQVILA — FA1: las reglas de la falange sin pantalla. node test/falange.test.mjs (menos de 20 s) */
import assert from 'node:assert';
import * as FA from '../js/falange.js';
const { crearFalange, PULSO, ALCANCE, DZ, DX, FILES, V_GIRO } = FA;
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const DT = 1 / 30, SEMILLAS = Array.from({ length: 20 }, (_, i) => i + 1);
const vacio = () => ({ nombre: 'x', crea(S) { S.ene = []; }, paso() {}, choque() {} });
const grados = r => r * 180 / Math.PI;
/* una partida entera con un bot */
function juega(modo, semilla, avisa) {
  const F = crearFalange({ semilla, avisa });
  while (F.S.T < 180 && !F.S.ganador) { F.bot(modo); F.paso(DT); }
  return F.resumen();
}
const R = {}; for (const modo of FA.BOTS) R[modo] = SEMILLAS.map(s => juega(modo, s));
const cuenta = (L, f) => L.filter(f).length;
const linea = L => L.map(r => `${r.ganador || '-'}/${r.causa || '-'}@${Math.round(r.T)}`).join(' ');

t('a) nogira pierde por el flanco en ≥ 18 de 20', () => {
  const k = cuenta(R.nogira, r => r.ganador === 'rival' && r.causa === 'flanco'); console.log('   nogira', k, '/20'); assert.ok(k >= 18, linea(R.nogira));
});
t('a) compas gana o sigue en pie en ≥ 18 de 20, y nunca rompe por el flanco', () => {
  const k = cuenta(R.compas, r => r.ganador !== 'rival'); console.log('   compas en pie o gana', k, '/20');
  assert.ok(k >= 18, linea(R.compas)); assert.strictEqual(cuenta(R.compas, r => r.causa === 'flanco' && r.ganador === 'rival'), 0);
});
t('b) compas gana ≥ 15 m y vence en la mayoría', () => {
  const k = cuenta(R.compas, r => r.ganador === 'falange' && r.ganado >= 15); console.log('   compas vence con ≥ 15 m', k, '/20'); assert.ok(k >= 11, linea(R.compas));
});
t('b) destiempo acaba con S.ganado < 0 y pierde', () => {
  assert.strictEqual(cuenta(R.destiempo, r => r.ganado < 0), 20, R.destiempo.map(r => r.ganado).join(' '));
  const k = cuenta(R.destiempo, r => r.ganador === 'rival'); console.log('   destiempo pierde', k, '/20'); assert.ok(k >= 18, linea(R.destiempo));
});
t('b) loco pierde antes que compas en todas', () => {
  SEMILLAS.forEach((s, i) => { const l = R.loco[i], c = R.compas[i]; assert.strictEqual(l.ganador, 'rival', 'semilla ' + s); assert.ok(l.T < c.T, `semilla ${s}: ${l.T} ≥ ${c.T}`); });
});

t('c) giro: 8°/s exactos, tope de 90°', () => {
  const F = crearFalange({ rival: vacio() }); F.gira(1); for (let i = 0; i < 150; i++) F.paso(DT);
  assert.ok(Math.abs(grados(F.S.giro) - 40) <= 0.5, grados(F.S.giro)); assert.strictEqual(V_GIRO, 8 * Math.PI / 180);
  for (let i = 0; i < 450; i++) F.paso(DT); assert.ok(Math.abs(grados(F.S.giro) - 90) < 1e-6, grados(F.S.giro));
  F.gira(-1); for (let i = 0; i < 1500; i++) F.paso(DT); assert.ok(Math.abs(grados(F.S.giro) + 90) < 1e-6);
});
t('c) con giro, los puestos giran y local() invierte puesto()', () => {
  const F = crearFalange({ rival: vacio() }), S = F.S, M = S.motor;
  S.giro = Math.PI / 2; const p = M.puesto(11, 0);
  assert.ok(Math.abs(p.x - S.xF) < 1e-9 && Math.abs(p.z - S.zF - 5.5 * DX) < 1e-9, JSON.stringify(p));
  for (const g of [0, 0.3, -1.1, Math.PI / 2]) { S.giro = g; for (const [f, r] of [[0, 0], [11, 7], [5, 3]]) {
    const l = M.local(M.puesto(f, r).x, M.puesto(f, r).z); assert.ok(Math.abs(l.delante + r * DZ) < 1e-9 && Math.abs(l.lado - (f - (FILES - 1) / 2) * DX) < 1e-9); } }
  S.giro = 0; const d = M.local(S.xF, S.zF - 3); assert.ok(Math.abs(d.delante - 3) < 1e-9 && Math.abs(d.lado) < 1e-9);
});

/* hasta el aviso del flanco, con «nogira»; luego gira (o no) a mano */
function flanco(semilla, girar) {
  let pos0 = null, mov = 0, resuelto = null, lado = 0; const caeF = [];
  const F2 = crearFalange({ semilla, avisa: (tipo, d) => { if (tipo === 'cae' && d.quien === 'f' && d.causa === 'flanco') caeF.push(d.h); } });
  const S2 = F2.S;
  while (S2.T < 120) {
    F2.bot('nogira');
    if (S2.flanco && !pos0) { pos0 = S2.flanco.hombres.map(h => ({ x: h.x, z: h.z })); lado = S2.flanco.lado; }
    if (girar && S2.flanco && S2.flanco.estado === 'viene') F2.gira(Math.abs(S2.giro) < 60 * Math.PI / 180 ? lado : 0);
    F2.paso(DT);
    if (pos0 && !mov && S2.T >= S2.flanco.tI - 0.5) mov = S2.flanco.hombres.reduce((a, h, i) => a + Math.hypot(h.x - pos0[i].x, h.z - pos0[i].z), 0) / pos0.length;
    if (S2.flanco && S2.flanco.estado !== 'viene' && !resuelto) resuelto = { estado: S2.flanco.estado, hombres: S2.flanco.hombres, giro: S2.giro };
    if ((resuelto && S2.T > S2.flanco?.tR + 4) || S2.ganador) break;
  }
  return { S: S2, pos0, mov, resuelto, lado, caeF };
}
t('d) flanco de verdad: 8–10 hombres de S.ene, vivos, que andan; girando 60° se para', () => {
  let caen = 0;
  for (const s of [1, 2, 3, 4, 5]) {
    const r = flanco(s, true); assert.ok(r.pos0, 'sin flanco ' + s);
    const H = r.resuelto.hombres; assert.ok(H.length >= 8 && H.length <= 10, H.length); assert.ok(H.every(h => r.S.ene.includes(h)));
    assert.ok(r.mov > 5, 'se mueven ' + r.mov.toFixed(1) + ' m'); assert.strictEqual(r.resuelto.estado, 'parado', 'semilla ' + s);
    caen += H.filter(h => !h.vivo).length;
  }
  console.log('   caen del flanco parado (5 tiradas):', caen); assert.ok(caen >= 5);
});
t('d) sin girar, el flanco entra y caen falangitas de ese lado', () => {
  for (const s of [1, 2, 3]) {
    const r = flanco(s, false); assert.strictEqual(r.resuelto.estado, 'dentro'); assert.ok(r.caeF.length >= 3, r.caeF.length);
    const del = r.caeF.filter(h => (h.f - (FILES - 1) / 2) * r.lado > 0).length; assert.ok(del > r.caeF.length / 2, `${del} de ${r.caeF.length}`);
  }
});
t('d) al vivo: compas recibe los flancos con las puntas', () => {
  const ev = []; juega('compas', 1, tipo => { if (tipo.startsWith('flanco')) ev.push(tipo); }); assert.ok(ev.includes('flancoParado') && !ev.includes('flancoEntra'), ev.join(' '));
});

t('e) filas: alzadas paran ≈ 60 % de los pila; bajadas, ninguno', () => {
  const F = crearFalange({ rival: vacio() }), S = F.S, b = S.fal[S.fal.length - 1], desde = { x: 0, z: -40 };
  for (let k = 0; k < 20; k++) {
    S.proyectiles.length = 0; for (let i = 0; i < 100; i++) S.motor.proyectil(desde, b, 1);
    for (let i = 0; i < 60; i++) F.paso(DT); b.vivo = true;
    const p = cuenta(S.proyectiles, P => P.est === 2); assert.ok(p >= 45 && p <= 75, 'paran ' + p);
  }
  for (let i = 0; i < 5; i++) F.fila(i, true); S.proyectiles.length = 0; for (let i = 0; i < 200; i++) S.motor.proyectil(desde, b, 1);
  for (let i = 0; i < 60; i++) { F.paso(DT); b.vivo = true; } assert.strictEqual(cuenta(S.proyectiles, P => P.est === 2), 0);
});
t('e) frente(): ALCANCE con la primera bajada; ALCANCE − DZ con solo la segunda; 0 sin ninguna', () => {
  const F = crearFalange({ rival: vacio() }); assert.strictEqual(F.frente(), 0);
  F.fila(1, true); assert.ok(Math.abs(F.frente() - (ALCANCE - DZ)) < 1e-9); F.fila(0, true); assert.ok(Math.abs(F.frente() - ALCANCE) < 1e-9);
  F.fila(0); assert.strictEqual(F.S.filas[0], false);
});
t('e) con 0 bajadas en el choque entran por el frente', () => {
  const F = crearFalange({ semilla: 3 }), S = F.S; let coh = null;
  while (S.T < 60 && !S.ganador) { if (Math.abs(S.T - Math.round(S.T / PULSO) * PULSO) < 0.03) F.toque(); F.paso(DT); if (S.choque && coh === null) coh = S.coh; if (S.choque && S.T - S.tChoque > 3) break; }
  assert.ok(S.choque); assert.ok(S.ene.some(h => h.est === 'dentro' && h.por === 'frente'), 'nadie dentro'); assert.ok(S.coh <= 50, 'coh ' + S.coh);
});

t('f) estocada: aire, enfriamiento, ≈ 70 % al compás y ≈ 35 % fuera', () => {
  const F0 = crearFalange({ rival: vacio() }); assert.strictEqual(F0.estocada(), 'aire'); assert.strictEqual(F0.estocada(), 'espera');
  const riv = { nombre: 'x', crea(S) { const yo = S.fal[S.yo.i], p = S.motor.mundo(2, (yo.f - (FILES - 1) / 2) * DX); S.ene = [{ i: 0, x: p.x, z: p.z, vivo: true, est: 'muro' }]; }, paso() {}, choque() {} };
  const F = crearFalange({ rival: riv, semilla: 7 }), S = F.S, h = S.ene[0]; let a = 0, b = 0; const N = 3000;
  assert.strictEqual(F.marcado(), h);
  for (let i = 0; i < N; i++) { S.T = (10 + i) * PULSO; S.yo.tEstocada = -9; h.vivo = true; if (F.estocada() === 'acierta') a++; assert.strictEqual(S.yo.tEstocada, S.T); }
  for (let i = 0; i < N; i++) { S.T = (10 + i) * PULSO + PULSO / 2; S.yo.tEstocada = -9; h.vivo = true; if (F.estocada() === 'acierta') b++; }
  console.log('   al compás', (a / N).toFixed(3), 'fuera', (b / N).toFixed(3)); assert.ok(Math.abs(a / N - 0.7) < 0.04 && Math.abs(b / N - 0.35) < 0.04); assert.strictEqual(S.yo.muertes, a + b);
});

t('g) terreno roto: marchando por encima la cohesión baja; null lo quita; cambia con la semilla', () => {
  const marcha = terreno => { const F = crearFalange({ semilla: 4, terreno }); let min = 100; while (F.S.T < 18) { F.bot('compas'); F.paso(DT); min = Math.min(min, F.S.coh); } return { min, S: F.S }; };
  const con = marcha({ x: 0, z: -18, r: 5 }), sin = marcha(null); assert.strictEqual(sin.S.terreno, null);
  console.log('   cohesión mínima con roto', con.min.toFixed(1), 'sin', sin.min.toFixed(1)); assert.ok(con.min < sin.min - 10);
  const a = crearFalange({ semilla: 1 }).S.terreno, b = crearFalange({ semilla: 2 }).S.terreno; assert.ok(a && b && (a.x !== b.x || a.z !== b.z)); assert.ok(a.r >= 4 && a.r <= 6);
});

t('h) contrato: campos de S con su tipo tras reinicia()', () => {
  const F = crearFalange({ semilla: 9 }); for (let i = 0; i < 400; i++) { F.bot('compas'); F.paso(DT); } F.reinicia(); const S = F.S;
  const tipos = { T: 'number', fase: 'string', rival: 'string', xF: 'number', zF: 'number', giro: 'number', girando: 'number', pulso: 'number', coh: 'number', ganado: 'number', enRoto: 'number', motor: 'object', U: 'object', R: 'object', yo: 'object' };
  for (const k in tipos) assert.strictEqual(typeof S[k], tipos[k], k);
  assert.strictEqual(S.T, 0); assert.strictEqual(S.fase, 'marcha'); assert.strictEqual(S.ganador, null); assert.strictEqual(S.causa, null); assert.strictEqual(S.orden, null); assert.strictEqual(S.flanco, null);
  assert.ok(Array.isArray(S.filas) && S.filas.length === 5 && Array.isArray(S.fal) && S.fal.length === 96 && Array.isArray(S.ene) && S.ene.length === 96 && Array.isArray(S.proyectiles));
  assert.ok(S.terreno === null || typeof S.terreno.r === 'number'); assert.strictEqual(S.rival, 'manipulos');
  for (const k of ['i', 'tEstocada', 'muertes']) assert.strictEqual(typeof S.yo[k], 'number'); assert.ok('blanco' in S.yo);
  for (const k of ['i', 'f', 'r', 'r0', 'x', 'z', 'yaw', 'vivo', 'huye', 'muere', 'kB', 'tG']) assert.ok(k in S.fal[0], 'fal.' + k);
  for (const k of ['i', 'x', 'z', 'yaw', 'vivo', 'muere', 'est', 'tipo', 'toca']) assert.ok(k in S.ene[0], 'ene.' + k);
  for (const k of ['enPie', 'animo', 'cansancio', 'roto']) assert.ok(k in S.U && k in S.R, k);
  for (const k of ['azar', 'avisa', 'local', 'puesto', 'frente', 'bajadas', 'mueve', 'ensarta', 'entra', 'caeRival', 'caeFalangita', 'cohesion', 'flanco', 'proyectil']) assert.strictEqual(typeof S.motor[k], 'function', k);
  for (const k of ['reinicia', 'paso', 'toque', 'estocada', 'gira', 'fila', 'orden', 'marcado', 'frente', 'bot', 'resumen']) assert.strictEqual(typeof F[k], 'function', k);
});
t('h) un rival de mentira recibe crea, paso y choque (en las puntas)', () => {
  const visto = { crea: 0, paso: 0, choque: [] };
  const riv = { nombre: 'x', crea(S) { visto.crea++; const p = S.motor.mundo(12, 0); S.ene = [{ i: 0, x: p.x, z: p.z, vivo: true, est: 'viene' }]; },
    paso(S, dt) { visto.paso++; const h = S.ene[0]; S.motor.mueve(h, S.xF, S.zF, 2, dt); }, choque(S, h) { visto.choque.push(h.toca); } };
  const F = crearFalange({ rival: riv }); for (let i = 0; i < 5; i++) F.fila(i, true);
  for (let i = 0; i < 200 && !visto.choque.length; i++) F.paso(DT);
  assert.strictEqual(visto.crea, 1); assert.ok(visto.paso > 10); assert.strictEqual(visto.choque[0], 'puntas'); assert.strictEqual(F.S.rival, 'x');
});
t('h) misma semilla, mismo resumen; avisa recibe pulso, flanco, rompe y fin', () => {
  const tipos = new Set(); const a = juega('compas', 5, tp => tipos.add(tp)), b = juega('compas', 5);
  assert.deepStrictEqual(a, b); assert.notDeepStrictEqual(a, juega('compas', 6));
  const F = crearFalange({ semilla: 5, avisa: tp => tipos.add(tp) }); while (F.S.fase !== 'fin' && F.S.T < 200) { F.bot('compas'); F.paso(DT); }
  for (const k of ['pulso', 'flanco', 'rompe', 'fin', 'ha', 'choque', 'salva', 'fila']) assert.ok(tipos.has(k), k);
  for (const k of ['ganador', 'causa', 'T', 'ganado', 'coh', 'enPieU', 'enPieR', 'tuyas', 'toquesBuenos', 'toquesMalos']) assert.ok(k in a, k);
});

t('i) órdenes: Empujad pide cohesión ≥ 60; repetir suelta; Retroceder recula; Cerrar remata al colado del frente', () => {
  const F = crearFalange({ semilla: 2 }), S = F.S;
  while (!S.choque && S.T < 60) { F.bot('compas'); F.paso(DT); } assert.ok(S.choque);
  S.orden = null; S.coh = 55; assert.strictEqual(F.orden('empujad'), 'flojo'); assert.strictEqual(S.orden, null);
  S.coh = 80; F.orden('empujad'); assert.strictEqual(S.orden, 'empujar'); F.orden('empujad'); assert.strictEqual(S.orden, null);
  const x0 = S.xF, z0 = S.zF, g0 = S.ganado; F.orden('retroceder'); for (let i = 0; i < 60; i++) F.paso(DT);
  const l = S.motor.local(x0, z0); assert.ok(l.delante > 1, 'recula ' + l.delante); assert.ok(S.ganado < g0); F.orden('retroceder');
  const fr = S.ene.filter(h => h.vivo && h.est === 'muro'), c = fr[0], d = fr[1]; S.motor.entra(c, 'frente'); S.motor.entra(d, 'der');
  F.orden('cerrar'); for (let i = 0; i < 40; i++) F.paso(DT);
  assert.strictEqual(c.vivo, false, 'el colado del frente sigue'); assert.ok(d.est === 'dentro' && d.vivo || d.est === 'vuelve', 'el del flanco no lo remata Cerrar');
});
t('i) Aguantar: el toque no hace nada y la cohesión sube', () => {
  const F = crearFalange({ rival: vacio() }), S = F.S; S.coh = 40; F.orden('aguantar'); for (let i = 0; i < 30; i++) F.paso(DT);
  assert.ok(S.coh > 45); assert.strictEqual(F.toque(), 'nada');
});

console.log(`\n${n} bien, ${mal} mal`);
if (mal) process.exit(1);
/* FI1: la física de las batallas (capa de dibujo sobre estas reglas); si falla, falla esta prueba */
{ const r = (await import('node:child_process')).spawnSync(process.execPath, [new URL('./fisica-batalla.test.mjs', import.meta.url).pathname], { stdio: 'inherit' }); if (r.status !== 0) process.exit(1); }
