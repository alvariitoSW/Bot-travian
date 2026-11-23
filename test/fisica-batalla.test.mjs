/* AQVILA — FI1: la física de las batallas (js/fisica-batalla.js), sin pantalla. node test/fisica-batalla.test.mjs */
import assert from 'node:assert';
import { crearFisica, MIN_DIST, RADIO, RADIO_CAIDO, ESCUDO } from '../js/fisica-batalla.js';
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

console.log(`\n${n} bien, ${mal} mal`);
if (mal) process.exit(1);
