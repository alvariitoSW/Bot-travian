/* AQVILA — CB1: el motor de lucha cuerpo a cuerpo (js/combate.js), sin pantalla. node test/combate.test.mjs */
import assert from 'node:assert';
import {
  crearAzar, crearHombre, crearManipulo, paso, golpear, pelea, tablaMedia, cicloEfectivo, proyectil, ponerGuardia,
  ARMAS, ESCUDOS, GUARDIAS
} from '../js/combate.js';
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const DT = 1 / 30;
const media = (L) => L.reduce((s, v) => s + v, 0) / L.length;

/* golpes de espada gala que aguanta un legionario hasta la primera herida (de frente, a 1 m) */
function golpesHastaHerida(escudo, semillas = 200) {
  const L = [];
  for (let s = 1; s <= semillas; s++) {
    const rnd = crearAzar(s);
    const leg = crearHombre({ id: 'leg', bando: 'a', x: 0, z: 0, yaw: 0, arma: 'gladius', escudo });
    const gal = crearHombre({ id: 'gal', bando: 'b', x: 0, z: -1, yaw: Math.PI, arma: 'espada_gala', escudo: 'thureos' });
    let k = 0;
    while (k < 200) { k++; const ev = golpear(gal, leg, rnd); if (ev.some(e => e.tipo === 'herida')) break; }
    L.push(k);
  }
  return media(L);
}

t('a. el scutum de frente aguanta muchos más golpes de espada gala que sin escudo', () => {
  const X = golpesHastaHerida('scutum'), Y = golpesHastaHerida('ninguno');
  console.log(`   con scutum: ${X.toFixed(1)} golpes hasta la primera herida; sin escudo: ${Y.toFixed(1)} (×${(X / Y).toFixed(1)})`);
  assert.ok(X >= 3 * Y, `${X} < 3×${Y}`);
});

/* golpe llegando desde un ángulo dado: fracción que entra al cuerpo y daño medio */
function desde(angGrados, N = 2000) {
  const rnd = crearAzar(11); let entra = 0, dano = 0;
  for (let i = 0; i < N; i++) {
    const def = crearHombre({ id: 'd', bando: 'a', x: 0, z: 0, yaw: 0, escudo: 'scutum' });
    const r = angGrados * Math.PI / 180;
    /* posición del atacante: frente del defensor = (0, −1); izquierda = (−1, 0) */
    const ax = -Math.sin(r), az = -Math.cos(r);
    const atk = crearHombre({ id: 'g', bando: 'b', x: ax, z: az, yaw: 0, arma: 'gladius' });
    for (const e of golpear(atk, def, rnd)) if (e.tipo === 'herida') { entra++; dano += e.dano; }
  }
  return { entra: entra / N, dano: dano / Math.max(1, entra) };
}

t('b. por la derecha descubierta o la espalda entra más y hace más daño que de frente', () => {
  const fr = desde(0), de = desde(-80), es = desde(180);
  console.log(`   entra al cuerpo: frente ${(fr.entra * 100).toFixed(0)} %, derecha ${(de.entra * 100).toFixed(0)} %, espalda ${(es.entra * 100).toFixed(0)} %; daño medio ${fr.dano.toFixed(2)} / ${de.dano.toFixed(2)} / ${es.dano.toFixed(2)}`);
  assert.ok(de.entra > 3 * fr.entra && es.entra > 3 * fr.entra);
  assert.ok(de.dano > fr.dano && es.dano > de.dano);
});

t('c. cada arma se distingue: alcance, escudo, rapidez; el pilum se arroja una vez', () => {
  assert.ok(ARMAS.sarisa.alcance > ARMAS.gladius.alcance);
  /* gladius contra falangita a 4 m: solo pega la sarisa */
  const leg = crearHombre({ id: 'leg', bando: 'a', x: 0, z: 0, yaw: 0, arma: 'gladius', escudo: 'scutum' });
  const fal = crearHombre({ id: 'fal', bando: 'b', x: 0, z: -4, yaw: Math.PI, arma: 'sarisa', escudo: 'pelta' });
  const rnd = crearAzar(3), cuenta = { leg: 0, fal: 0 };
  for (let i = 0; i < 300 && leg.vivo; i++) for (const e of paso([leg, fal], DT, { rnd })) if (e.tipo === 'golpe') cuenta[e.de]++;
  console.log(`   a 4 m en 10 s: golpes de la sarisa ${cuenta.fal}, del gladius ${cuenta.leg}`);
  assert.ok(cuenta.fal > 0 && cuenta.leg === 0);
  assert.ok(ARMAS.falcata.danoEscudo > ARMAS.gladius.danoEscudo && ARMAS.espada_gala.danoEscudo > ARMAS.gladius.danoEscudo);
  for (const k of ['hasta', 'sarisa', 'falcata', 'espada_gala']) assert.ok(ARMAS.gladius.ciclo < ARMAS[k].ciclo, k);
  /* escudo gastado por cada golpe parado */
  const gasto = (arma) => { const r = crearAzar(5), d = crearHombre({ id: 'd', yaw: 0, escudo: 'scutum' }); let p = 0;
    while (d.izq.estado !== 'roto' && p < 1000) { const a = crearHombre({ id: 'a', bando: 'b', x: 0, z: -1, yaw: Math.PI, arma }); if (golpear(a, d, r).some(e => e.tipo === 'para')) p++; d.vida = 1; d.vivo = true; }
    return { porParada: ESCUDOS.scutum.resistencia / p, paradas: p }; };
  const gG = gasto('gladius'), gF = gasto('falcata'), gE = gasto('espada_gala');
  console.log(`   paradas hasta romper el scutum: gladius ${gG.paradas}, espada gala ${gE.paradas}, falcata ${gF.paradas}`);
  assert.ok(gF.porParada > gG.porParada && gE.porParada > gG.porParada);
  /* pilum: un tiro a 10 m y después gladius */
  const has = crearHombre({ id: 'has', bando: 'a', x: 0, z: 0, yaw: 0, arma: 'pilum' });
  const blanco = crearHombre({ id: 'bl', bando: 'b', x: 0, z: -10, yaw: Math.PI, arma: 'espada_gala', escudo: 'thureos' });
  let tiros = 0; for (let i = 0; i < 90; i++) for (const e of paso([has, blanco], DT, { rnd })) if (e.tipo === 'lanza') tiros++;
  assert.strictEqual(tiros, 1); assert.strictEqual(has.arma, 'gladius');
});

t('d. cansancio: tras un rato en primera fila golpea más lento; descansando baja', () => {
  const leg = crearHombre({ id: 'leg', bando: 'a', x: 0, z: 0, yaw: 0, arma: 'gladius', escudo: 'scutum' });
  const gal = crearHombre({ id: 'gal', bando: 'b', x: 0, z: -1, yaw: Math.PI, arma: 'espada_gala', escudo: 'thureos' });
  const rnd = crearAzar(9), golpes = [];
  for (let s = 0; s < 120; s++) {
    let g = 0;
    for (let i = 0; i < 30; i++) {
      for (const e of paso([leg, gal], DT, { rnd })) if (e.tipo === 'golpe' && e.de === 'leg') g++;
      for (const h of [leg, gal]) { h.vivo = true; h.vida = 1; h.escudoVida = 12; h.izq.estado = h.cansancio >= 0.75 ? 'bajo' : 'alzado'; }   /* el duelo no acaba */
    }
    golpes.push(g);
  }
  const g0 = media(golpes.slice(0, 20)), g1 = media(golpes.slice(100));
  console.log(`   golpes/s: primeros 20 s ${g0.toFixed(2)}, de 100 a 120 s ${g1.toFixed(2)}; cansancio ${leg.cansancio.toFixed(2)}; ciclo ${cicloEfectivo(leg).toFixed(2)} s`);
  assert.ok(g1 < g0 && leg.cansancio > 0.5);
  /* a descansar: detrás, sin enemigo */
  const c0 = leg.cansancio; for (let i = 0; i < 600; i++) paso([leg], DT, { rnd });
  console.log(`   tras 20 s detrás: cansancio ${c0.toFixed(2)} → ${leg.cansancio.toFixed(2)}`);
  assert.ok(leg.cansancio < c0 - 0.2);
});

/* dos ejércitos iguales: hastati delante y principes 6 m detrás. a (yaw π) mira a +z desde z < 0; b mira a −z */
function ejercitosBien(s) {
  const mk = (bando, linea, z, yaw, k) => crearManipulo({ id: bando + linea, bando, linea, filas: 4, frente: 10, x: 0, z, yaw, arma: 'gladius', escudo: 'scutum', semilla: s * 10 + k });
  return {
    a: [mk('a', 'hastati', -0.5, Math.PI, 1), mk('a', 'principes', -0.5 - 4 * 1.2 - 6, Math.PI, 2)],
    b: [mk('b', 'hastati', 0.5, 0, 3), mk('b', 'principes', 0.5 + 4 * 1.2 + 6, 0, 4)]
  };
}

t('e. el relevo a tiempo gana a la misma tropa sin relevo (≥ 8 de 10 semillas)', () => {
  let gana = 0; const tiempos = [], bajas = [];
  for (let s = 1; s <= 10; s++) {
    const E = ejercitosBien(s);
    const r = pelea({ a: E.a, b: E.b, dt: DT, tMax: 900, semilla: s, relevo: { a: { umbralCansancio: 0.3 }, b: null } });
    if (r.gana === 'a') gana++;
    tiempos.push(r.tiempo); bajas.push(`${r.bajas.a}/${r.bajas.b}`);
  }
  console.log(`   gana quien releva: ${gana}/10; duración media ${media(tiempos).toFixed(0)} s; bajas a/b ${bajas.join(' ')}`);
  assert.ok(gana >= 8, gana);
});

t('f. determinismo: misma semilla, mismo resultado', () => {
  const r1 = pelea({ ...ejercitosBien(4), dt: DT, tMax: 300, semilla: 4, relevo: { a: { umbralCansancio: 0.5 } } });
  const r2 = pelea({ ...ejercitosBien(4), dt: DT, tMax: 300, semilla: 4, relevo: { a: { umbralCansancio: 0.5 } } });
  assert.deepStrictEqual(r1, r2);
});

t('g. coste por paso: 2+2 manípulos de 120 (480 hombres) < 1 ms', () => {
  const mk = (bando, z, yaw, k) => crearManipulo({ id: bando + k, bando, filas: 6, frente: 20, x: 0, z, yaw, arma: 'gladius', escudo: 'scutum', semilla: k });
  const H = [mk('a', -0.5, Math.PI, 1), mk('a', -14, Math.PI, 2), mk('b', 0.5, 0, 3), mk('b', 14, 0, 4)].flatMap(M => M.hombres);
  const rnd = crearAzar(1), ev = [];
  for (let i = 0; i < 60; i++) { ev.length = 0; paso(H, DT, { rnd, eventos: ev }); }   /* calentar */
  const N = 600, t0 = performance.now();
  for (let i = 0; i < N; i++) { ev.length = 0; paso(H, DT, { rnd, eventos: ev }); }
  const ms = (performance.now() - t0) / N;
  console.log(`   ${H.length} hombres: ${ms.toFixed(3)} ms por paso (dt = 1/30)`);
  assert.ok(ms < 1, ms);
});

t('h. testudo bajo lluvia de proyectiles desde arriba: entran muchos menos', () => {
  const caer = (guardia) => {
    const M = crearManipulo({ id: 'T' + guardia, bando: 'a', filas: 4, frente: 6, yaw: 0, guardia }), rnd = crearAzar(21); let entra = 0, N = 0;
    for (let i = 0; i < 2000; i++) for (const h of M.hombres) { N++; if (!proyectil(h, 20 + rnd() * 30, -30 + rnd() * 60, 'flecha', rnd).para) entra++; }
    return 100 * entra / N;
  };
  const tes = caer('testudo'), nor = caer('normal');
  console.log(`   proyectiles que entran (caída de 20-50° desde la vertical): testudo ${tes.toFixed(1)} %, guardia normal ${nor.toFixed(1)} %`);
  assert.ok(tes * 4 < nor);
});

t('i. en testudo golpea mucho menos por minuto', () => {
  const golpesMin = (guardia) => {
    const A = crearManipulo({ id: 'A' + guardia, bando: 'a', filas: 3, frente: 8, z: -0.5, yaw: Math.PI, guardia, semilla: 1 });
    const B = crearManipulo({ id: 'B' + guardia, bando: 'b', filas: 3, frente: 8, z: 0.5, yaw: 0, semilla: 2 });
    const H = [...A.hombres, ...B.hombres], rnd = crearAzar(2); let g = 0;
    for (let i = 0; i < 30 * 30; i++) for (const e of paso(H, DT, { rnd })) if (e.tipo === 'golpe' && e.de[0] === 'A') g++;
    return g * 2;
  };
  const tes = golpesMin('testudo'), nor = golpesMin('normal');
  console.log(`   golpes por minuto del manípulo: testudo ${tes}, normal ${nor}`);
  assert.ok(tes * 2 < nor);
});

t('j. falange de frente contra hastati: pierden; por el flanco ganan', () => {
  const r = { frente: [], flanco: [] };
  for (let s = 1; s <= 5; s++) {
    /* falange: 10 de frente, 8 de fondo, mira a −z; su primera fila en z = 0 */
    const fal = () => crearManipulo({ id: 'F', bando: 'b', linea: 'falange', filas: 8, frente: 10, x: 0, z: 0, yaw: 0, arma: 'sarisa', escudo: 'pelta', semilla: s });
    const F1 = fal();
    const H1 = crearManipulo({ id: 'H', bando: 'a', linea: 'hastati', filas: 3, frente: 10, x: 0, z: -3, yaw: Math.PI, arma: 'gladius', escudo: 'scutum', semilla: s + 50 });
    r.frente.push(pelea({ a: [H1], b: [F1], dt: DT, tMax: 300, semilla: s }));
    /* por el flanco derecho de la falange (derecha = +x), mirando a −x */
    const F2 = fal(), bordeX = 4.5 * 0.9;
    const H2 = crearManipulo({ id: 'H', bando: 'a', linea: 'hastati', filas: 3, frente: 6, x: bordeX + 2, z: 3.15, yaw: -Math.PI / 2, arma: 'gladius', escudo: 'scutum', semilla: s + 50 });
    r.flanco.push(pelea({ a: [H2], b: [F2], dt: DT, tMax: 300, semilla: s }));
  }
  const cuenta = (L) => `gana hastati ${L.filter(x => x.gana === 'a').length}/5, bajas hastati/falange ${L.map(x => x.bajas.a + '/' + x.bajas.b).join(' ')}`;
  console.log(`   de frente: ${cuenta(r.frente)}`);
  console.log(`   por el flanco: ${cuenta(r.flanco)}`);
  assert.ok(r.frente.every(x => x.gana !== 'a' && x.bajas.a > 2 * x.bajas.b));
  assert.ok(r.flanco.filter(x => x.gana === 'a' || x.bajas.b > 2 * x.bajas.a).length >= 4);
});

t('fuentes: cada arma, escudo y guardia lleva fuente y dictamen', () => {
  for (const T of [ARMAS, ESCUDOS, GUARDIAS]) for (const [k, v] of Object.entries(T)) if (k !== 'ninguno' && k !== 'normal') assert.ok(v.fuente && v.dictamen, k);
  void ponerGuardia;
});

t('tabla de medias para la batalla grande', () => {
  const m = tablaMedia('gladius', 'scutum', 'espada_gala', 'thureos', 4);
  console.log(`   gladius+scutum contra espada gala+thureos (10×3, 60 s): bajas/min ${m.bajasMinA.toFixed(1)} / ${m.bajasMinB.toFixed(1)}; paradas ${m.paradasA.toFixed(0)} % / ${m.paradasB.toFixed(0)} %`);
  assert.ok(m.bajasMinA < m.bajasMinB);
});

console.log(`\n${n} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
