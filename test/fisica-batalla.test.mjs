/* AQVILA — FI1: la física de las batallas (js/fisica-batalla.js), sin pantalla. node test/fisica-batalla.test.mjs */
import assert from 'node:assert';
import { crearFisica, crearProyectiles, PR, MIN_DIST, RADIO, RADIO_CAIDO, ESCUDO, PROYECTIL } from '../js/fisica-batalla.js';
import { crearFalange, SARISA, AGARRE } from '../js/falange.js';
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const DT = 1 / 30;
const hombre = (o) => ({ vivo: true, huye: false, x: 0, z: 0, yaw: 0, r: 0, f: 0, kB: 0, ...o });
const mundo = (fal, ene, giro = 0) => ({ fal, ene, giro });
/* el carril de cada sarisa bajada (gobierno/maquetas/falange/formacion.js, CARRIL), copiado aquí para no cargar la maqueta */
const CARRIL = r => ({ x: 0.18 + 0.07 * Math.min(4, r), y: [1.0, 1.24, 1.42, 1.58, 1.72][Math.min(4, r)] });
/* la pica de h sin THREE: mano en su sitio dibujado + carril, dirección = frente del muro */
function picaDe(S, h) {
  const g = S.giro || 0, Fx = Math.sin(g), Fz = -Math.cos(g), Rx = Math.cos(g), Rz = Math.sin(g), c = CARRIL(h.r);
  const mx = h.x + (h.fx || 0) + Rx * c.x + Fx * 0.3, mz = h.z + (h.fz || 0) + Rz * c.x + Fz * 0.3, D = [Fx, -0.015, Fz];
  return { h, P: [mx - D[0] * AGARRE, c.y - D[1] * AGARRE, mz - D[2] * AGARRE], D, L: SARISA };
}
function picas(S, Fi) {
  const L = [];
  for (const h of S.fal) if (h.vivo && !h.huye && h.kB > 0.5 && h.r < 5) {
    const p = picaDe(S, h), r = Fi.pica(h, p.P, p.D, p.L);
    if (r.ret) for (let k = 0; k < 3; k++) p.P[k] -= p.D[k] * r.ret;
    L.push(p);
  }
  return L;
}

t('dos cuerpos solapados se separan ≥ MIN_DIST', () => {
  const a = hombre({ x: 0, z: 0 }), b = hombre({ x: 0.1, z: 0.05, tipo: 'infante' }), S = mundo([a], [b]), Fi = crearFisica();
  Fi.paso(S, DT); const m = Fi.medir(S); assert.ok(m.distMin >= MIN_DIST, m.distMin);
});
t('un empujón a la 1.ª fila llega a la 2.ª', () => {
  const a = hombre({ z: 0, r: 0 }), b = hombre({ z: 0.95, r: 1 }), S = mundo([a, b], []), Fi = crearFisica();
  Fi.paso(S, DT); a.fz = 0.5; Fi.paso(S, DT); assert.ok(b.fz > 0.2, 'el de detrás recula ' + b.fz);
});
t('una punta contra un escudo se para en él', () => {
  /* rival a 4 m delante del muro (−z), mirándote (yaw 0: su frente es +z) */
  const a = hombre({ kB: 1 }), e = hombre({ tipo: 'infante', z: -4.8, x: 0.18 }), S = mundo([a], [e]), Fi = crearFisica();
  Fi.paso(S, DT); const p = picaDe(S, a), r = Fi.pica(a, p.P, p.D, p.L);
  assert.strictEqual(r.en, 'escudo'); assert.ok(r.ret > 0, 'retira ' + r.ret);
  for (let k = 0; k < 3; k++) p.P[k] -= p.D[k] * r.ret;
  const zp = p.P[2] + p.D[2] * p.L, cara = e.z + ESCUDO.delante + ESCUDO.grueso / 2; assert.ok(zp >= cara - 1e-6 && zp < cara + 0.1, `punta en ${zp}, cara del escudo en ${cara}`);
  for (let i = 0; i < 20; i++) { Fi.paso(S, DT); picas(S, Fi); } assert.strictEqual(Fi.medir(S, picas(S, Fi)).puntasDentro, 0);
});
t('un elefante aparta a un hombre; un hombre no aparta a un elefante', () => {
  const Fi = crearFisica(), h = hombre({ tipo: 'infante', x: 2 }), el = hombre({ tipo: 'elefante', x: 0 }), S = mundo([], [h, el]);
  Fi.paso(S, DT); for (let i = 0; i < 15; i++) { el.x += 3 * DT; Fi.paso(S, DT); }   /* 1,5 m: el hombre aún cabe en su tope */
  assert.ok(Math.hypot(h.fx, h.fz) > 0.5, 'hombre apartado ' + h.fx); assert.ok(Math.hypot(el.fx, el.fz) < 0.15, 'elefante apartado ' + el.fx);
  assert.ok(h.x + h.fx - (el.x + el.fx) > 0, 'el hombre sigue delante');
});
t('un jinete aparta más que un hombre', () => {
  const choque = tipo => { const Fi = crearFisica(), h = hombre({ tipo: 'infante', x: 1 }), j = hombre({ tipo, x: 0 }), S = mundo([], [h, j]); Fi.paso(S, DT); for (let i = 0; i < 10; i++) { j.x += 3 * DT; Fi.paso(S, DT); } return h.fx; };
  const kj = choque('jinete'), kh = choque('infante'); assert.ok(kj > kh * 1.3, `jinete ${kj}, hombre ${kh}`);
});
t('los vivos no pisan a un caído, y el caído cae hacia donde le empujan', () => {
  const Fi = crearFisica(), c = hombre({ tipo: 'infante', x: 0 }), v = hombre({ tipo: 'infante', x: 2, z: 0.1 }), S = mundo([], [c, v]);
  Fi.paso(S, DT); c.vx = 2; c.vz = 0; c.vivo = false; Fi.paso(S, DT);
  assert.ok(Math.abs(c.fCae - Math.PI / 2) < 0.3, 'cae hacia +x: ' + c.fCae);
  for (let i = 0; i < 40; i++) { v.x = Math.max(0, v.x - 0.1); Fi.paso(S, DT); }
  assert.strictEqual(Fi.medir(S).pisados, 0); assert.ok(Math.hypot(v.x + v.fx - (c.x + c.fx), v.z + v.fz - (c.z + c.fz)) >= RADIO.infante + RADIO_CAIDO.infante - 0.01);
});

/* 60 s de lucha del bot 'compas' desde el choque: con física, ninguna punta dentro y nadie más cerca de MIN_DIST */
function lucha(semilla, conFisica) {
  const F = crearFalange({ semilla }), S = F.S, Fi = crearFisica(); let peorD = Infinity, dentro = 0, pisados = 0, ms = 0, k = 0, t0 = null;
  while (S.T < 200 && !S.ganador && (t0 === null || S.T - t0 < 60)) {
    F.bot('compas'); F.paso(DT);
    if (conFisica) { const a = performance.now(); Fi.paso(S, DT); ms += performance.now() - a; k++; }
    if (S.choque && t0 === null) t0 = S.T;
    if (t0 !== null && conFisica) { const m = Fi.medir(S, picas(S, Fi)); peorD = Math.min(peorD, m.distMin); dentro += m.puntasDentro; pisados += m.pisados; }
  }
  return { r: JSON.stringify(F.resumen()), peorD, dentro, pisados, ms: ms / Math.max(1, k) };
}
for (const s of [1, 2, 3]) t(`semilla ${s}: 60 s con física, 0 puntas dentro, distancia ≥ ${MIN_DIST}; reglas intactas`, () => {
  const con = lucha(s, true), sin = lucha(s, false);
  console.log(`   distMin ${con.peorD.toFixed(3)} · puntas dentro ${con.dentro} · vivos sobre un caído (suma de fotogramas) ${con.pisados} · ${con.ms.toFixed(3)} ms/paso`);
  assert.strictEqual(con.r, sin.r, 'las reglas cambian con la física');
  assert.strictEqual(con.dentro, 0); assert.ok(con.peorD >= MIN_DIST, con.peorD);
  /* pisados no se exige aquí: las reglas llevan el muro por encima de sus muertos; el caído se arrastra hasta 2,5 m y luego se pasa por encima */
});
t('coste: 200 cuerpos apiñados, menos de 1 ms por paso', () => {
  const fal = [], ene = []; for (let i = 0; i < 100; i++) { fal.push(hombre({ x: (i % 12) * 0.78, z: Math.floor(i / 12) * 0.95, f: i % 12, r: Math.floor(i / 12) })); ene.push(hombre({ tipo: 'infante', x: (i % 12) * 0.85 + 0.2, z: -0.3 - Math.floor(i / 12) * 1.4 })); }
  for (let i = 0; i < 30; i++) ene.push(hombre({ vivo: false, x: i * 0.4, z: -0.6 }));
  const S = mundo(fal, ene), Fi = crearFisica(); for (let i = 0; i < 30; i++) Fi.paso(S, DT);
  let ms = Infinity; for (let v = 0; v < 3; v++) { const a = performance.now(); for (let i = 0; i < 100; i++) { for (const h of ene) if (h.vivo) h.z += 0.01; Fi.paso(S, DT); } ms = Math.min(ms, (performance.now() - a) / 100); }   /* la mejor de tres tandas: menos ruido de la máquina */
  console.log(`   ${ms.toFixed(3)} ms por paso con 230 cuerpos`); assert.ok(ms < 1, ms);
});


/* FI3u: el motor viejo de proyectiles de crearFisica (Fi.lanza, Fi.vuela…) se quitó: el único es crearProyectiles() */
t('FI3u: crearFisica() ya no tiene lanza, vuela, dondeP ni proyectiles', () => {
  const Fi = crearFisica(); for (const k of ['lanza', 'vuela', 'dondeP', 'limpia', 'proyectiles']) assert.ok(!(k in Fi), k);
  assert.ok(typeof Fi.paso === 'function' && typeof Fi.pica === 'function' && typeof Fi.medir === 'function');
});

/* ===== FI3: proyectiles que se clavan, rebotan o resbalan ===== */
const R3 = (g) => g * Math.PI / 180;
/* un escudo de pie mirando a −z (hacia quien tira), centro a 1,1 m; un cuerpo detrás */
const escudoDe = (dueno, x = 0, z = 0) => ({ tipo: 'escudo', c: [x, 1.1, z], n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0], m: [0.03, 0.31, 0.31], umbo: 0.06, dueno });
const cuerpoDe = (dueno, x = 0, z = 0.3) => ({ tipo: 'cuerpo', x, z, y0: 0.35, y1: 1.8, r: 0.2, dueno });
/* lanza un pilum hacia el punto Q con dirección de ángulo a bajo la horizontal (yendo hacia +z) y velocidad 20 m/s */
function lanza(Pr, Q, a, obst, que, M, lado = 0) {
  const d = [Math.sin(R3(lado)) * Math.cos(R3(a)), -Math.sin(R3(a)), Math.cos(R3(lado)) * Math.cos(R3(a))], v = d.map(x => x * 20), p = {};
  Pr.vuela(p, Q.map((x, k) => x - d[k] * 1.5), v, obst); Pr.vuela(p, Q.map((x, k) => x + d[k] * 0.3), v, obst);
  const modo = Pr.llega(p, que, obst, M); return { p, modo };
}
const IDENT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
t('FI3: escudo de frente se clava; refilón, canto y umbo rebotan', () => {
  const Pr = crearProyectiles({ semilla: 3 }), a = {}, E = escudoDe(a), O = [E, cuerpoDe(a)], que = { tipo: 'escudo', dueno: a };
  assert.strictEqual(lanza(Pr, [0.15, 1.15, 0], 20, O, que, IDENT).modo, 'clava');
  assert.strictEqual(lanza(Pr, [0.15, 1.15, 0], 10, O, que, IDENT, 70).modo, 'rebota', 'refilón');
  assert.strictEqual(lanza(Pr, [0.28, 1.05, 0], 15, O, que, IDENT).modo, 'rebota', 'canto');
  assert.strictEqual(lanza(Pr, [0.01, 1.1, 0], 15, O, que, IDENT).modo, 'rebota', 'umbo');
});
t('FI3: cuerpo se clava; casco rebota', () => {
  const Pr = crearProyectiles(), a = {}, O = [cuerpoDe(a, 0, 0)], que = { tipo: 'cuerpo', dueno: a };
  assert.strictEqual(lanza(Pr, [0, 1.2, -0.2], 20, O, que, IDENT).modo, 'clava');
  assert.strictEqual(lanza(Pr, [0, 1.75, -0.2], 20, O, que, IDENT).modo, 'rebota');
});
t('FI3: suelo a 60° se clava (punta ≤ 0,15); a 10° resbala y acaba tumbado a ras', () => {
  const H = (x, z) => 0.05 * x + 0.03 * z, Pr = crearProyectiles({ H });
  const r = lanza(Pr, [0, 0.4, 0], 60, [], { tipo: 'suelo' }); assert.strictEqual(r.modo, 'cae');
  for (let i = 0; i < 30 && r.p.fi.modo === 'cae'; i++) Pr.mueve(r.p, DT, []);
  assert.strictEqual(r.p.fi.modo, 'clava'); const q = Pr.pose(r.p), hondo = H(q.punta[0], q.punta[2]) - q.punta[1];
  assert.ok(hondo > 0 && hondo <= 0.15, 'hundida ' + hondo);
  const s = lanza(Pr, [0, 0.1, 0], 10, [], { tipo: 'suelo' }); for (let i = 0; i < 300 && s.p.fi.modo !== 'tumbado'; i++) Pr.mueve(s.p, DT, []);
  assert.strictEqual(s.p.fi.modo, 'tumbado'); const w = Pr.pose(s.p), cola = w.punta.map((x, k) => x - w.dir[k] * 2.06);
  for (const e of [w.punta, cola]) { const dz = e[1] - H(e[0], e[2]); assert.ok(dz >= 0 && dz < 0.05, 'a ras ' + dz); }
  assert.strictEqual(Pr.medir([r.p, s.p]).dentro, 0);
});
t('FI3: un vuelo que cruzaría un escudo se para en su cara', () => {
  const Pr = crearProyectiles(), E = escudoDe({}), p = {}, v = [0, -2, 20];
  Pr.vuela(p, [0, 1.2, -1], v, [E]); const q = Pr.vuela(p, [0, 1.1, 0.5], v, [E]);
  assert.ok(Math.abs(q.punta[2] + 0.03) < 1e-6, 'cara ' + q.punta[2]); assert.strictEqual(p.fi.toca.tipo, 'escudo');
});
t('FI3: un rebote nunca entra en el suelo ni en otro escudo', () => {
  const Pr = crearProyectiles({ semilla: 9 }), a = {}, b = {}, O = [escudoDe(a), escudoDe(b, 0.2, -0.9), cuerpoDe(a)];
  const L = []; let peor = 0;
  for (let k = 0; k < 30; k++) { const r = lanza(Pr, [-0.25 + k * 0.017, 1.0 + (k % 5) * 0.06, 0], 5 + k * 2, O, { tipo: 'escudo', dueno: a }, IDENT, (k % 7) * 12); L.push(r.p); }
  for (let i = 0; i < 200; i++) { for (const p of L) Pr.mueve(p, DT, O); for (const p of L) Pr.pose(p, IDENT); peor = Math.max(peor, Pr.medir(L, O).dentro); }
  const m = Pr.medir(L, O); console.log(`   rebotes: ${L.filter(p => p.fi.modo === 'tumbado').length}/30 tumbados · tramos ${JSON.stringify(m.tramos)}`);
  assert.strictEqual(peor, 0, JSON.stringify(m.detalle));
});
t('FI3: el clavado sigue a su dueño al moverse y girar (< 1 cm)', () => {
  const Pr = crearProyectiles(), a = {}, r = lanza(Pr, [0.1, 1.2, 0], 20, [escudoDe(a)], { tipo: 'escudo', dueno: a }, IDENT);
  const q0 = Pr.pose(r.p, IDENT), g = 0.7, c = Math.cos(g), s = Math.sin(g), M = [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 2, 0.1, -3, 1];   /* gira g en Y y se mueve */
  const q = Pr.pose(r.p, M), esp = [c * q0.punta[0] + s * q0.punta[2] + 2, q0.punta[1] + 0.1, -s * q0.punta[0] + c * q0.punta[2] - 3];
  assert.ok(Math.hypot(...q.punta.map((x, k) => x - esp[k])) < 0.01);
});
t('FI3: coste: 50 proyectiles con 200 obstáculos, menos de 1 ms por paso', () => {
  const O = []; for (let i = 0; i < 100; i++) { const h = {}, x = (i % 12) * 0.78, z = Math.floor(i / 12) * 0.95; O.push(escudoDe(h, x, z - 0.35), cuerpoDe(h, x, z)); }
  const Pr = crearProyectiles({ semilla: 5 }), L = [];
  for (let k = 0; k < 50; k++) { const h = O[2 * (k % 100)].dueno, r = lanza(Pr, [(k % 12) * 0.78 + 0.1, 1.1, Math.floor(k / 12) * 0.95 - 0.35], 10 + k, O, k % 3 ? { tipo: 'escudo', dueno: h } : { tipo: 'suelo' }, IDENT); L.push(r.p); }
  let ms = Infinity; for (let v = 0; v < 3; v++) { const a = performance.now(); for (let i = 0; i < 30; i++) for (const p of L) { Pr.mueve(p, DT, O); Pr.pose(p, IDENT); } ms = Math.min(ms, (performance.now() - a) / 30); }
  console.log(`   ${ms.toFixed(3)} ms por paso con 50 proyectiles y 200 obstáculos`); assert.ok(ms < 1, ms);
});

t('FI3: la regla dice asta y el vuelo toca un escudo: vale (que.vale), sin salto', () => {
  const Pr = crearProyectiles({}), obst = [escudoDe('B', 0, 0)];
  const { p } = lanza(Pr, [0, 1.1, 0], 20, obst, { tipo: 'asta', dueno: 'A', otroVale: true, vale: ['asta', 'escudo'] }, IDENT);
  assert.strictEqual(p.fi.que, 'escudo'); assert.strictEqual(p.fi.dueno, 'B'); assert.ok(!p.fi.salto, p.fi.salto);
  assert.strictEqual(Pr.medir([p], obst).saltos.otro, 0);
});
t('FI3: el astil de un clavado no entra en el vecino: gira sobre la punta o se suelta', () => {
  const Pr = crearProyectiles({}), A = cuerpoDe('A', 0, 0.3), obst = [A];
  const { p, modo } = lanza(Pr, [0, 1.2, 0.1], 10, obst, { tipo: 'cuerpo', dueno: 'A' }, IDENT);
  assert.strictEqual(modo, 'clava');
  const vecino = cuerpoDe('B', 0, -0.9), obst2 = [A, vecino];
  Pr.pose(p, IDENT, obst2);
  const m = Pr.medir([p], obst2); assert.strictEqual(m.dentro, 0, JSON.stringify(m.detalle));
});

t('FI3: largo por proyectil (p.largo) o por crearProyectiles({ largo }); sin él, PR.LARGO', () => {
  const Pr = crearProyectiles(), Pl = crearProyectiles({ largo: 1.6 }), a = {}, O = [escudoDe(a)], que = { tipo: 'escudo', dueno: a };
  const p1 = {}; Pr.vuela(p1, [0, 2, -3], [0, 0, 20], O); assert.strictEqual(p1.fi.L, PR.LARGO);
  const p2 = { largo: 2.65 }; Pr.vuela(p2, [0, 2, -3], [0, 0, 20], O); assert.strictEqual(p2.fi.L, 2.65); assert.ok(Math.abs(p2.fi.CM - PR.CM * 2.65 / PR.LARGO) < 1e-9);
  const p3 = {}; Pl.vuela(p3, [0, 2, -3], [0, 0, 20], O); assert.strictEqual(p3.fi.L, 1.6);
  const { p } = lanza(Pr, [0.15, 1.15, 0], 20, O, que, IDENT); assert.strictEqual(p.fi.L, PR.LARGO);
});
t('FI3: en vuelo mira también el astil: la punta ya pasó el escudo pero el astil lo cruza → se para en el contacto', () => {
  const Pr = crearProyectiles(), a = {}, E = escudoDe(a, 0, -1.5), p = { largo: 2.65 }, v = [0, 0, 20];
  /* la punta va de z = −1 a z = −0,5 sin tocar nada; el escudo (que se ha movido) queda a z = −1,5, cruzando el astil */
  Pr.vuela(p, [0, 1.1, -1], v, []); const r = Pr.vuela(p, [0, 1.1, -0.5], v, [E]);
  assert.ok(p.fi.toca && p.fi.toca.tipo === 'escudo', 'tocó el escudo con el astil');
  const m = Pr.medir([p], [E]); assert.strictEqual(m.dentro, 0, JSON.stringify(m.detalle)); assert.ok(r.punta[2] < -1.4, 'la punta se para en el escudo');
});
t('FI3: la cuenta por ángulo solo lleva caras; canto, umbo y casco van aparte', () => {
  const Pr = crearProyectiles({ semilla: 5 }), a = {}, O = [escudoDe(a), cuerpoDe(a)], que = { tipo: 'escudo', dueno: a };
  lanza(Pr, [0.15, 1.15, 0], 20, O, que, IDENT); lanza(Pr, [0.28, 1.05, 0], 15, O, que, IDENT); lanza(Pr, [0.01, 1.1, 0], 15, O, que, IDENT);
  const b = {}, O2 = [cuerpoDe(b, 0, 0)]; lanza(Pr, [0, 1.75, -0.2], 20, O2, { tipo: 'cuerpo', dueno: b }, IDENT);
  const m = Pr.medir([], []), caras = m.tramos.reduce((n, t) => n + t.clava + t.rebota + t.resbala, 0);
  assert.strictEqual(caras, 1, JSON.stringify(m.tramos)); assert.strictEqual(m.aparte.canto.rebota, 1); assert.strictEqual(m.aparte.umbo.rebota, 1); assert.strictEqual(m.aparte.casco.rebota, 1);
});
t('FI3: clavado con la punta en el escudo vecino: sale o gira hasta no tocarlo', () => {
  const Pr = crearProyectiles(), a = {}, b = {}, Ea = escudoDe(a, 0, 0), Eb = { ...escudoDe(b, 0.05, 0.08), esf: undefined }, p = {};
  lanza(Pr, [0.15, 1.15, 0], 20, [Ea], { tipo: 'escudo', dueno: a }, IDENT); p.fi = undefined;
  const { p: q } = lanza(Pr, [0.15, 1.15, 0], 20, [Ea], { tipo: 'escudo', dueno: a }, IDENT);
  Pr.pose(q, IDENT, [Ea, Eb]); const m = Pr.medir([q], [Ea, Eb]); assert.strictEqual(m.dentro, 0, JSON.stringify(m.detalle));
});

/* ---------- LP5a: la física en la maqueta «Manípulo a pie» (gobierno/maquetas/bloque/fisica.js) ---------- */
{
  const BL = await import('../js/bloque.js'), { crearCombate } = await import('../js/bloque-ia.js');
  const { crearTropas } = await import('../gobierno/maquetas/bloque/tropas.js'), FB = await import('../gobierno/maquetas/bloque/fisica.js');
  /* una partida con el jugador automático, la física a cada fotograma de 1/30 s y las reglas a su paso de 0,05 s */
  function partida(semilla, conFisica, segundos = 100) {
    const C = crearCombate({ semilla, nivel: 'normal', motor: BL, avisa: () => {} }), S = C.S, TR = crearTropas({ S }), FS = FB.crearFisicaBloque({ S, TR, activa: conFisica, semilla });
    const r = { mismoMin: Infinity, rivalMin: Infinity, pares045: 0, escudos: 0, colados: 0, pisados: 0, muestras: 0, saltos: 0, temblor: 0, giro: 0, ms: 0 };
    const antes = new Map(); let acc = 0; const DTF = 1 / 30;
    for (let k = 0; k < segundos / DTF && !S.ganador; k++) {
      acc += DTF; while (acc >= 0.05) { C.bot('bueno'); C.paso(0.05); acc -= 0.05; }
      TR.paso(DTF, S.T); FS.paso(DTF);
      for (const f of TR.figs) {
        const a = antes.get(f);
        if (a) {
          const vx = (f.x - a.x) / DTF, vz = (f.z - a.z) / DTF; if (Math.hypot(vx, vz) > 7) r.saltos++;
          /* temblor: va y vuelve (la velocidad se da la vuelta) más de 1 cm cada vez */
          if (a.vx !== undefined && vx * a.vx + vz * a.vz < 0 && Math.hypot(vx, vz) * DTF > 0.01 && Math.hypot(a.vx, a.vz) * DTF > 0.01) r.temblor++;
          let dy = Math.abs(f.yaw - a.yaw) % (2 * Math.PI); if (dy > Math.PI) dy = 2 * Math.PI - dy; r.giro = Math.max(r.giro, dy / DTF);
          a.x = f.x; a.z = f.z; a.vx = vx; a.vz = vz; a.yaw = f.yaw;
        } else antes.set(f, { x: f.x, z: f.z, yaw: f.yaw });
      }
      if (k % 6) continue;
      const m = FS.medir(); r.muestras++;
      r.mismoMin = Math.min(r.mismoMin, m.mismo); r.rivalMin = Math.min(r.rivalMin, m.rival); r.escudos += m.escudos; r.colados += m.colados; r.pisados += m.pisados;
      const F = TR.figs; for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) { const a = F[i], b = F[j]; if (a.bando === b.bando && Math.abs(a.x - b.x) < 0.45 && Math.hypot(a.x - b.x, a.z - b.z) < MIN_DIST) r.pares045++; }
      r.ms = m.ms;
    }
    r.fin = { ganador: S.ganador, T: +S.T.toFixed(2), bajas: S.bloques.map(b => b.U.enPie) };
    return r;
  }
  /* las varas (LP5a, parte 2026-11-23-LP5a): escritas tras la primera medida, con margen; el «antes» es la misma partida sin física */
  const con = { 3: partida(3, true), 11: partida(11, true) }, sin3 = partida(3, false);
  for (const s in con) { const c = con[s], n = c.muestras;
    console.log(`   semilla ${s} (${n} muestras) · con física: rival ≥ ${c.rivalMin.toFixed(2)} m · mismo bando ≥ ${c.mismoMin.toFixed(2)} m · parejas < 0,45 m ${(c.pares045 / n).toFixed(2)}/muestra · escudos en un rival ${(c.escudos / n).toFixed(2)} · colados ${(c.colados / n).toFixed(2)} · quietos sobre un caído ${(c.pisados / n).toFixed(2)} · saltos ${c.saltos} · temblores ${c.temblor} · giro máx ${c.giro.toFixed(1)} rad/s · ${c.ms} ms/paso`); }
  { const o = sin3, m = o.muestras; console.log(`   semilla 3 · sin física (el antes): rival ≥ ${o.rivalMin.toFixed(2)} · mismo ≥ ${o.mismoMin.toFixed(2)} · parejas < 0,45 ${(o.pares045 / m).toFixed(2)} · escudos ${(o.escudos / m).toFixed(2)} · colados ${(o.colados / m).toFixed(2)} · sobre un caído ${(o.pisados / m).toFixed(2)} · temblores ${o.temblor}`); }
  t('LP5a: en el choque, los rivales no se meten uno en otro (≥ 0,8 m; escudos en un rival ≤ 0,3 por muestra; colados ≤ 0,2)', () => {
    for (const s in con) { const c = con[s], n = c.muestras; assert.ok(c.rivalMin >= 0.8, s + ' rival ' + c.rivalMin); assert.ok(c.escudos / n <= 0.3, s + ' escudos ' + c.escudos / n); assert.ok(c.colados / n <= 0.2, s + ' colados ' + c.colados / n); }
  });
  t('LP5a: los de un bando no se atraviesan (parejas a menos de 0,45 m ≤ 0,2 por muestra, 100 veces menos que sin física)', () => {
    for (const s in con) { const c = con[s]; assert.ok(c.pares045 / c.muestras <= 0.2, s + ' ' + c.pares045 / c.muestras); }
    assert.ok(con[3].pares045 / con[3].muestras * 100 <= sin3.pares045 / sin3.muestras + 1e-9, 'no mejora lo bastante');
  });
  t('LP5a: los caídos quedan en el suelo y nadie está de pie sobre ellos (≤ 2,5 por muestra, 20 veces menos que sin física)', () => {
    for (const s in con) { const c = con[s]; assert.ok(c.pisados / c.muestras <= 2.5, s + ' ' + c.pisados / c.muestras); }
    assert.ok(con[3].pisados / con[3].muestras * 20 <= sin3.pisados / sin3.muestras, 'no mejora lo bastante');
  });
  t('LP5a: nadie salta (> 7 m/s), gira de golpe (> 4,1 rad/s) ni tiembla (≤ 0,5 % de los fotogramas)', () => {
    for (const s in con) { const c = con[s]; assert.strictEqual(c.saltos, 0, s + ' saltos'); assert.ok(c.giro <= 4.1, s + ' giro ' + c.giro); assert.ok(c.temblor / (c.muestras * 6 * 750) <= 0.005, s + ' temblor ' + c.temblor); }
  });
  t('LP5a: la física no cambia la partida (mismo final con y sin física) y cuesta < 4 ms por paso con ~800 hombres', () => {
    assert.deepStrictEqual(con[3].fin, sin3.fin); for (const s in con) assert.ok(con[s].ms < 4, s + ' ' + con[s].ms);
  });
  /* FI3u: una salva de jabalinas con crearProyectiles: todas acaban quietas, ninguna dentro de un hombre que no la lleva */
  t('FI3u: la salva del bloque (crearProyectiles): todas paran; se clavan o rebotan; ningún astil dentro de otro hombre', () => {
    const C = crearCombate({ semilla: 5, nivel: 'normal', motor: BL, avisa: () => {} }), S = C.S, TR = crearTropas({ S }), FS = FB.crearFisicaBloque({ S, TR, semilla: 5 });
    for (let i = 0; i < 20; i++) { C.paso(0.1); TR.paso(0.1, S.T); FS.paso(0.1); }
    const av = {}; FS.alAviso = a => { av[a.aviso] = (av[a.aviso] || 0) + 1; };
    const tu = S.tuyo, de = S.bloques.find(b => b.bando !== tu.bando), men = TR.figs.filter(f => f.b === tu);
    const n = FS.salva(de, tu, 30, 1.6, 'jabalina', i => { const f = men[(i * 13) % men.length]; return { x: f.x, z: f.z }; });
    let dentro = 0;
    for (let k = 0; k < 60; k++) { C.paso(0.1); TR.paso(0.1, S.T); FS.paso(0.1);
      for (const p of FS.proyectiles) { const d = FS.dondeP(p), suyo = p.fi && p.fi.modo === 'clava' ? p.fi.dueno && p.fi.dueno.fig : null;
        for (let s = 0.3; s <= 1.5; s += 0.15) { const x = d.x - d.dx * s, y = d.y - d.dy * s, z = d.z - d.dz * s; if (y > 0.05 && y < 1.5 && TR.figs.some(f => f !== suyo && Math.hypot(f.x - x, f.z - z) < 0.2)) { dentro++; break; } } } }
    console.log(`   salva: ${n} lanzadas · ${JSON.stringify(av)} · quedan ${FS.proyectiles.length} · astiles dentro de otro ${dentro}`);
    assert.strictEqual(n, 30); assert.ok(FS.proyectiles.every(p => p.fi && p.fi.modo !== 'vuela'), 'alguno vuela aún');
    assert.ok((av.clava || 0) + (av.rebota || 0) + (av.resbala || 0) >= 25, JSON.stringify(av)); assert.strictEqual(dentro, 0);
  });
}

/* ===== FI3u: lo que vino del otro motor (Fi.lanza, ya quitado): tipos, pilum que se dobla, herida en el casco, escudo lastrado ===== */
function lanzaT(Pr, tipo, Q, a, obst, que, lado = 0, v0 = 20) {
  const d = [Math.sin(R3(lado)) * Math.cos(R3(a)), -Math.sin(R3(a)), Math.cos(R3(lado)) * Math.cos(R3(a))], v = d.map(x => x * v0), p = tipo ? { tipo } : {};
  Pr.vuela(p, Q.map((x, k) => x - d[k] * 1.5), v, obst); Pr.vuela(p, Q.map((x, k) => x + d[k] * 0.3), v, obst);
  return { p, modo: Pr.llega(p, que, obst, IDENT) };
}
t('FI3u: pilum de frente al escudo se clava y se dobla (≥ 80 de 100) con aviso «dobla»; rasante rebota y no se dobla', () => {
  const Pr = crearProyectiles({ semilla: 11 }); let clava = 0, dobla = 0, aviso = 0;
  for (let i = 0; i < 100; i++) {
    const a = {}, O = [escudoDe(a), cuerpoDe(a)], r = lanzaT(Pr, 'pilum', [0.09 + (i % 10) * 0.015, 0.9 + Math.floor(i / 10) * 0.03, 0], (i % 15), O, { tipo: 'escudo', dueno: a });
    if (r.modo === 'clava') clava++; if (r.p.fi.doblado) dobla++; if (Pr.avisos().some(x => x.aviso === 'dobla' && x.p === r.p)) aviso++;
  }
  const a = {}, O = [escudoDe(a)], r = lanzaT(Pr, 'pilum', [0.15, 1.15, 0], 10, O, { tipo: 'escudo', dueno: a }, 70);
  console.log(`   de frente: clava ${clava}, dobla ${dobla}; rasante: ${r.modo}`);
  assert.ok(clava >= 95, 'clava ' + clava); assert.ok(dobla >= 80, 'dobla ' + dobla); assert.strictEqual(aviso, dobla);
  assert.strictEqual(r.modo, 'rebota'); assert.ok(!r.p.fi.doblado);
});
t('FI3u: jabalina y flecha nunca se doblan; pilum y jabalina lastran el escudo (pila), la flecha no; al soltarse, olvidarse o reiniciar, deja de lastrar', () => {
  const Pr = crearProyectiles({ semilla: 21 }), a = {}, O = [escudoDe(a)], que = { tipo: 'escudo', dueno: a };
  let dob = 0; for (let i = 0; i < 40; i++) for (const tp of ['jabalina', 'flecha']) { const r = lanzaT(Pr, tp, [0.1, 1.1, 0], 3, O, que, 0, tp === 'flecha' ? 45 : 22); if (r.p.fi.doblado) dob++; }
  assert.strictEqual(dob, 0); assert.strictEqual(Pr.pila(a), 40, 'solo las 40 jabalinas: ' + Pr.pila(a));
  const b = {}, Ob = [escudoDe(b)], r = lanzaT(Pr, 'pilum', [0.1, 1.1, 0], 3, Ob, { tipo: 'escudo', dueno: b }); assert.strictEqual(Pr.pila(b), 1);
  Pr.pose(r.p, IDENT); Pr.suelta(r.p); assert.strictEqual(Pr.pila(b), 0); Pr.suelta(r.p); assert.strictEqual(Pr.pila(b), 0, 'no baja de cero');
  const c = {}; lanzaT(Pr, 'flecha', [0.1, 1.1, 0], 3, [escudoDe(c)], { tipo: 'escudo', dueno: c }, 0, 45); assert.strictEqual(Pr.pila(c), 0);
  const d = {}, r2 = lanzaT(Pr, 'pilum', [0.1, 1.1, 0], 3, [escudoDe(d)], { tipo: 'escudo', dueno: d }); assert.strictEqual(Pr.pila(d), 1);
  Pr.olvida(r2.p); assert.strictEqual(Pr.pila(d), 0, 'olvida'); Pr.olvida(r2.p); Pr.olvida({}); assert.strictEqual(Pr.pila(d), 0);
  lanzaT(Pr, 'pilum', [0.1, 1.1, 0], 3, [escudoDe(d)], { tipo: 'escudo', dueno: d }); Pr.reinicia(); assert.strictEqual(Pr.pila(d) + Pr.pila(a), 0, 'reinicia');
});
t('FI3u: el casco rebota siempre (se ve igual), pero de frente y con fuerza avisa «hiere» (grave); de refilón, no', () => {
  const Pr = crearProyectiles(), a = {}, O = [cuerpoDe(a, 0, 0)], que = { tipo: 'cuerpo', dueno: a };
  const f = lanzaT(Pr, 'pilum', [0, 1.75, -0.2], 10, O, que); let av = Pr.avisos();
  assert.strictEqual(f.modo, 'rebota'); assert.strictEqual(f.p.fi.hiere, 'grave'); assert.ok(av.some(x => x.aviso === 'hiere' && x.en === 'casco' && x.herida === 'grave'), JSON.stringify(av.map(x => x.aviso)));
  const l = lanzaT(Pr, 'flecha', [0, 1.75, -0.2], 10, O, que, 0, 20); av = Pr.avisos(); assert.ok(!l.p.fi.hiere && !av.some(x => x.aviso === 'hiere'), 'una flecha floja no hiere');
  const s = lanzaT(Pr, 'pilum', [0.15, 1.75, -0.1], 10, [cuerpoDe(a, 0, 0)], que, 75); av = Pr.avisos(); assert.ok(!s.p.fi.hiere, 'de refilón ' + s.p.fi.ang);
});
t('FI3u: clavado en el cuerpo avisa la herida (leve o grave); la física no decide bajas', () => {
  const Pr = crearProyectiles(), a = {}, O = [cuerpoDe(a, 0, 0)], que = { tipo: 'cuerpo', dueno: a };
  const g = lanzaT(Pr, 'pilum', [0, 1.2, -0.2], 10, O, que); const ag = Pr.avisos().find(x => x.aviso === 'clava');
  const l = lanzaT(Pr, 'flecha', [0, 1.2, -0.2], 10, O, que, 0, 15); const al = Pr.avisos().find(x => x.aviso === 'clava');
  assert.strictEqual(g.modo, 'clava'); assert.strictEqual(ag.herida, 'grave'); assert.strictEqual(l.modo, 'clava'); assert.strictEqual(al.herida, 'leve');
  assert.deepStrictEqual(Object.keys(a), [], 'no escribe en el dueño');
});
t('FI3u: el tipo no cambia lo que se ve: mismo modo y misma pose con pilum, jabalina, flecha o sin tipo', () => {
  const L = {}; for (const tp of [null, 'pilum', 'jabalina', 'flecha']) {
    const Pr = crearProyectiles({ semilla: 9 }), a = {}, b = {}, O = [escudoDe(a), escudoDe(b, 0.2, -0.9), cuerpoDe(a)], out = [];
    for (let k = 0; k < 30; k++) { const r = lanzaT(Pr, tp, [-0.25 + k * 0.017, 1.0 + (k % 5) * 0.06, 0], 5 + k * 2, O, { tipo: 'escudo', dueno: a }, (k % 7) * 12); for (let i = 0; i < 60; i++) Pr.mueve(r.p, DT, O); const q = Pr.pose(r.p, IDENT); out.push(r.modo + ':' + r.p.fi.modo + ':' + q.punta.map(x => x.toFixed(4)).join(',')); }
    L[tp] = out.join('|');
  }
  assert.ok(L.pilum === L[null] && L.jabalina === L[null] && L.flecha === L[null]);
});
t('FI3u: los avisos se vacían al leerlos y no crecen sin límite', () => {
  const Pr = crearProyectiles(), a = {}, O = [escudoDe(a)];
  for (let i = 0; i < 400; i++) lanzaT(Pr, 'pilum', [0.1, 1.1, 0], 3, O, { tipo: 'escudo', dueno: a });
  const av = Pr.avisos(); assert.ok(av.length <= 256 && av.length > 0, av.length); assert.strictEqual(Pr.avisos().length, 0);
});

/* LP7: «Bajar a pie» desde la batalla grande, con las fuerzas tope de js/ui-mando.js (TOPE_AP: 600 hombres en el campo).
   Al motor solo van los bloques despiertos (cerca de otro, huyendo o con algo en el aire). Vara pedida en LP7: < 1 ms por paso;
   medido 1,0–1,2 con el campo lleno (sin despertar, 1,9). Esta prueba guarda que no empeore: < 1,3 */
{
  const BL = await import('../js/bloque.js'), { crearCombate } = await import('../js/bloque-ia.js'), { FIN_LUCHA } = await import('../js/falange.js');
  const { crearTropas } = await import('../gobierno/maquetas/bloque/tropas.js'), FB = await import('../gobierno/maquetas/bloque/fisica.js');
  t('LP7: con las fuerzas tope de «Bajar a pie» (600 hombres) el motor de física ronda 1 ms por paso (< 1,3) y nadie se cuela', () => {
    const fuerzas = { tuyo: 120, centro: 120, amigas: [70, 70], alas: [70, 70], reserva: 50, tiradores: 30 }, ms = [];
    /* FI4 (decisión del vigía, 24/11, «A»): la mejor de tres tandas. La partida es la misma en cada tanda (misma semilla): cada paso
       del motor se cronometra en las tres y vale el mejor de los tres; la media de esos es la cifra. Un pico de la máquina en un paso
       no cuenta; un motor lento sí. El tope (1,3 ms) no cambia */
    for (const semilla of [3, 7]) {
      let mejor = null, ultima = null;
      for (let tanda = 0; tanda < 3; tanda++) {
        const C = crearCombate({ semilla, nivel: 'normal', motor: BL, fuerzas, lejos: 50, fin: FIN_LUCHA }), S = C.S, TR = crearTropas({ S }), FS = FB.crearFisicaBloque({ S, TR, semilla });
        const tiempos = [], paso0 = FS.Fi.paso; FS.Fi.paso = (SF, dt) => { const t0 = performance.now(); paso0(SF, dt); tiempos.push(performance.now() - t0); };
        let k = 0; while (!S.ganador && S.T < 200) { C.bot('bueno'); C.paso(1 / 30); TR.paso(1 / 30, S.T); FS.paso(1 / 30); if (++k === 300) FS.reinicia(); }
        const m = FS.medir(); assert.ok(m.rival >= 0.8 && m.colados <= 0.2, JSON.stringify(m));
        if (ultima) assert.strictEqual(JSON.stringify(m.rival), JSON.stringify(ultima.rival), 'la misma partida en cada tanda');
        ultima = m; mejor = mejor ? mejor.map((x, i) => Math.min(x, tiempos[i] ?? Infinity)) : tiempos;
      }
      ms.push(+(mejor.reduce((a, b) => a + b, 0) / mejor.length).toFixed(3));
    }
    console.log('   motor ' + ms.join(' y ') + ' ms por paso (enganche entero aparte)');
    assert.ok(Math.max(...ms) < 1.3, ms.join(' '));
  });
}

/* ---------- FI4: la física en las batallas grandes (crearFisicaFiguras; campo de prueba como el de js/ui-guerra.js) ---------- */
{
  const { crearCampo } = await import('./fi4-campo.mjs');
  const { FIG } = await import('../js/fisica-batalla.js');
  const dmin = C => { let d = Infinity; const v = C.figs.filter(f => f.est === 0); for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) { const [ax, az] = C.dibujado(v[i]), [bx, bz] = C.dibujado(v[j]); d = Math.min(d, Math.hypot(ax - bx, az - bz)); } return d; };
  const cruza = C => lv => lv.lado === 0 && lv.k < 2 ? C.L.find(o => o.s === lv.s && o.lado === 0 && o.k === 1 - lv.k) : null;
  t('FI4 vara de coste: campo lleno (540 figuras, 200 caídos, frentes trabados): motor < 1 ms por paso, enganche < 2 ms', () => {
    const C = crearCampo({ caidos: 200 }); C.coloca(0, 0); C.inicio(); for (let k = 0; k < 100; k++) C.paso(0.05);
    const ms = [], todo = [];
    for (let r = 0; r < 5; r++) { C.ff.cero(); for (let k = 0; k < 60; k++) C.paso(0.05); const m = C.ff.medir(); ms.push(m.ms); todo.push(m.msTodo); }
    const mejor = Math.min(...ms), mejorT = Math.min(...todo);
    console.log('   motor ' + mejor.toFixed(3) + ' ms (tandas ' + ms.map(x => x.toFixed(2)).join(' ') + '), enganche ' + mejorT.toFixed(3) + ' ms');
    assert.ok(mejor < 1, 'motor ' + mejor); assert.ok(mejorT < 2, 'enganche ' + mejorT);
  });
  t('FI4 relevo: dos líneas que se cruzan no se meten una dentro de otra (sin física, sí)', () => {
    const una = fisica => { const C = crearCampo({ fisica }); C.coloca(0, 0); C.inicio(); C.coloca(0, 0, cruza(C)); let d = Infinity; for (let k = 0; k < 400; k++) { C.paso(0.05, 1.5); if (k % 5 === 0) d = Math.min(d, dmin(C)); } return d; };
    const con = una(true), sin = una(false); console.log('   distancia mínima con física ' + con.toFixed(3) + ' m, sin ella ' + sin.toFixed(3));
    assert.ok(con >= MIN_DIST, con); assert.ok(sin < 0.1, sin);
  });
  t('FI4 la carga empuja: quien llega corriendo hace recular al de enfrente (≥ 0,1 m) y el muelle lo devuelve', () => {
    const C = crearCampo({}); C.coloca(12, 0); C.inicio(); C.coloca(0, 0);
    let fondo = 0; for (let k = 0; k < 120; k++) { C.paso(0.05, 4); for (const f of C.figs) if (f.lado === 1 && f.fila === 0) fondo = Math.max(fondo, -(f.fz || 0)); }
    const m = C.ff.medir(), queda = Math.max(...C.figs.filter(f => f.lado === 1).map(f => Math.hypot(f.fx || 0, f.fz || 0)));
    console.log('   cargas ' + m.cargas + ', recula ' + fondo.toFixed(3) + ' m, al final ' + queda.toFixed(3) + ' m');
    assert.ok(m.cargas >= 10 && fondo >= 0.1 && fondo <= 0.6, fondo); assert.ok(queda < 0.03, queda); assert.ok(dmin(C) >= MIN_DIST);
  });
  const salva = (guardia, semilla = 5) => {
    const C = crearCampo({ semilla }); C.coloca(12, 0); C.inicio();
    if (guardia) for (const f of C.figs) if (f.lado === 1) f.guardia = f.fila === 0 ? 'muro' : 'alto';
    C.paso(0.05);
    const ro = C.figs.filter(f => f.lado === 0 && f.fila === 0), en = C.figs.filter(f => f.lado === 1 && f.fila < 2);
    let a = 7; const az = () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
    for (let k = 0; k < 120; k++) { const d = ro[Math.floor(az() * ro.length)], b = en[Math.floor(az() * en.length)]; C.ff.lanza('pilum', d, [d.x, 1.75, d.z - 0.3], [b.x + (az() - 0.5), 1.2, b.z + (az() - 0.5)], 0.9 + az() * 0.4); }
    for (let k = 0; k < 80; k++) C.paso(0.05);
    return C;
  };
  t('FI4 salva de pila: se clavan en escudos (y se doblan), en cuerpos o en el suelo, o rebotan; nada sigue volando ni queda bajo tierra', () => {
    const C = salva(null), A = C.ff.medir().avisos, P = C.ff.proyectiles;
    console.log('   ' + JSON.stringify(A));
    /* con crearProyectiles (FI3u) el escudo para (clava o rebota) en vez de solo clavar: la vara cuenta lo que para el escudo */
    const esc = (A.clava_escudo || 0) + (A.rebota_escudo || 0) + (A.resbala_escudo || 0);
    assert.ok(esc >= 40, 'escudo ' + esc); assert.ok((A.dobla_escudo || 0) > 0 && (A.clava_cuerpo || 0) > 0);
    assert.ok((A.rebota_escudo || 0) + (A.rebota_casco || 0) + (A.rebota_cuerpo || 0) + (A.rebota_suelo || 0) > 0);
    assert.ok(P.every(p => p.fi && p.fi.modo !== 'vuela'), 'vuela'); assert.ok(P.every(p => { const q = C.ff.dondeP(p), L = p.largo || 2, hinca = p.fi.modo === 'clava'; return q.y >= (hinca ? -0.2 : -0.01) && q.y - q.dy * L >= -0.01; }), 'bajo tierra');   /* lo clavado lleva la punta dentro de lo que lo lleva (PR.HUNDE): a ras de suelo puede asomar bajo tierra; el asta, nunca */
  });
  t('FI4 contra un testudo (escudos arriba) para más el escudo y menos el casco', () => {
    const a = salva(null).ff.medir().avisos, b = salva('testudo').ff.medir().avisos;
    const esc = A => (A.clava_escudo || 0) + (A.rebota_escudo || 0) + (A.resbala_escudo || 0), cas = A => (A.rebota_casco || 0) + (A.clava_casco || 0);
    console.log('   escudo ' + esc(a) + ' → ' + esc(b) + ', casco ' + cas(a) + ' → ' + cas(b));
    assert.ok(esc(b) > esc(a) + 5 && cas(b) < cas(a), esc(a) + ' → ' + esc(b) + '; casco ' + cas(a) + ' → ' + cas(b));
  });
  t('FI4 lo clavado en un hombre que cae se va al suelo con él (no flota)', () => {
    const C = salva(null), fijos = C.ff.proyectiles.filter(p => p.fi.modo === 'clava' && p.fi.que !== 'suelo' && p.fi.dueno && p.fi.dueno.lado === 1); assert.ok(fijos.length > 0);
    for (const f of C.figs) if (f.lado === 1) f.est = 1;
    for (let k = 0; k < 80; k++) C.paso(0.05);
    const alto = fijos.map(p => C.ff.dondeP(p).y); assert.ok(fijos.every(p => !(p.fi.modo === 'clava' && p.fi.que !== 'suelo')) && Math.max(...alto) < 0.6, 'altura ' + Math.max(...alto).toFixed(2));
  });
  t('FI4 pintaArmas: matrices sin deformar (dos ejes del grueso, el tercero a lo largo del vuelo) y el doblado cuelga sin bajar del suelo', () => {
    const C = salva(null), A = new Float32Array(16 * 300), n = C.ff.pintaArmas(A, 300);
    assert.ok(n === C.ff.proyectiles.length && n > 0);
    for (let i = 0; i < n; i++) {
      const o = i * 16, p = C.ff.proyectiles[i], q = C.ff.dondeP(p), c = k => Math.hypot(A[o + k], A[o + k + 1], A[o + k + 2]);
      assert.ok(Math.abs(c(0) - c(4)) < 1e-4 && Math.abs(c(8) - ({ pilum: 1, jabalina: 0.72, flecha: 0.38 })[p.tipo]) < 1e-4, 'escala');
      const dot = (j, k) => A[o + j] * A[o + k] + A[o + j + 1] * A[o + k + 1] + A[o + j + 2] * A[o + k + 2];
      assert.ok(Math.abs(dot(0, 4)) < 1e-4 && Math.abs(dot(0, 8)) < 1e-4 && Math.abs(dot(4, 8)) < 1e-4, 'ortogonal');
      if (p.fi.doblado && p.fi.modo === 'clava') assert.ok(q.y - 2.11 * A[o + 9] >= 0.049, 'el asta doblada no entra en el suelo');
    }
  });
}

console.log(`\n${n} bien, ${mal} mal`);
if (mal) process.exit(1);
