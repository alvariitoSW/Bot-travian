/* AQVILA — ES3a: las reglas de los tiradores (js/tiro.js), sin pantalla. node test/es3-tiro.test.mjs */
import assert from 'node:assert';
import { TIRADORES, V_TIRO, AJUSTE, angulos, cruzaTuyos, cortaCuerpo, eligeModo, crearTiradores, pasoTiro, rutaRetirada } from '../js/tiro.js';
import { crearProyectiles, PROYECTIL } from '../js/fisica-batalla.js';
let n = 0, mal = 0;
function t(nombre, f) { try { f(); n++; console.log('bien', nombre); } catch (e) { mal++; console.log('MAL', nombre, '—', e.message); } }
const cuerpo = (o) => ({ bando: 0, ang: 0, ancho: 20, fondo: 6, tipo: 'manipulo', hombres: 100, ...o });
/* tiradores en (0,0) mirando a −z; rival a 40 m delante */
const rival = (o = {}) => cuerpo({ id: 'r', bando: 1, x: 0, z: -40, ang: Math.PI, ...o });
const falangeTuya = (o = {}) => cuerpo({ id: 'f', tipo: 'falange', x: 0, z: -15, ancho: 40, ...o });
/* muertos medios de un cuerpo de tiradores en varias semillas: una salva por semilla */
function media(tipo, cuerpos, orden = 'tirar', semillas = 60) {
  let m = 0, p = 0, modo = null;
  for (let s = 1; s <= semillas; s++) {
    const T = crearTiradores({ tipo, semilla: s, orden, blanco: 'r' });
    const S = pasoTiro(T, 0.1, { cuerpos: [...cuerpos] }); for (const x of S) { m += x.muertos; p += x.bajasPropias; modo = x.modo; }
  }
  return { m: m / semillas, p: p / semillas, modo };
}

t('la tabla trae las cifras del estudio', () => {
  assert.deepStrictEqual([TIRADORES.honderos.alcance, TIRADORES.arqueros.alcance, TIRADORES.velites.alcance], [60, 80, 25]);
  assert.deepStrictEqual([TIRADORES.honderos.maximo, TIRADORES.arqueros.maximo, TIRADORES.velites.maximo], [75, 100, 25]);
  assert.deepStrictEqual([TIRADORES.honderos.municion, TIRADORES.arqueros.municion, TIRADORES.velites.municion], [20, 24, 7]);
  assert.deepStrictEqual([TIRADORES.honderos.cadencia, TIRADORES.arqueros.cadencia, TIRADORES.velites.cadencia], [6, 5, 6]);
  for (const k in TIRADORES) assert.strictEqual(TIRADORES[k].hombres, 40);
});
t('las velocidades de tiro coinciden con la física', () => {
  for (const k in TIRADORES) { const p = TIRADORES[k].proyectil; assert.strictEqual(V_TIRO[p], PROYECTIL[p].v, p); }
});
t('angulos(): bajo < alto, llega al blanco y es null fuera de alcance', () => {
  const a = angulos(50, 30); assert.ok(a.bajo < a.alto && a.bajo > 0);
  for (const th of [a.bajo, a.alto]) { const tt = 50 / (30 * Math.cos(th)), y = 30 * Math.sin(th) * tt - 0.5 * 9.81 * tt * tt; assert.ok(Math.abs(y) < 1e-6, 'y ' + y); }
  assert.strictEqual(angulos(200, 30), null);
  assert.ok(Math.abs(angulos(0.999 * 30 * 30 / 9.81, 30).bajo - Math.PI / 4) < 0.06, 'a alcance máximo, 45°');
});
t('cruzaTuyos: ve el cuerpo en medio y no el de al lado', () => {
  assert.strictEqual(cruzaTuyos({ x: 0, z: 0 }, { x: 0, z: -40 }, [falangeTuya()]).id, 'f');
  assert.strictEqual(cruzaTuyos({ x: 0, z: 0 }, { x: 0, z: -40 }, [falangeTuya({ x: 60 })]), null);
  assert.strictEqual(cruzaTuyos({ x: 0, z: -15 }, { x: 0, z: -40 }, [falangeTuya()]), null, 'estar dentro no cuenta');
});
t('parábola sobre la falange mata menos que directo', () => {
  const dir = media('honderos', [rival()]), par = media('honderos', [rival(), falangeTuya()]);
  assert.strictEqual(dir.modo, 'directo'); assert.strictEqual(par.modo, 'parabola');
  assert.ok(par.m < dir.m, par.m + ' < ' + dir.m);
});
t('las sarisas alzadas entre medias paran parte de la parábola', () => {
  const sar = cuerpo({ id: 's', bando: 1, tipo: 'falange', x: 0, z: -25, ang: Math.PI, ancho: 40, sarisasAlzadas: true });
  const con = media('arqueros', [rival({ z: -60 }), falangeTuya(), sar], 'tirar', 200), sin = media('arqueros', [rival({ z: -60 }), falangeTuya()], 'tirar', 200);
  assert.ok(con.m < sin.m * 0.85, con.m + ' vs ' + sin.m);
});
t('blanco trabado con un cuerpo tuyo: bajas propias; en alto, ninguna', () => {
  const trab = [rival({ trabado: 'f' }), falangeTuya({ z: -37, fondo: 4 })];
  const r = media('honderos', trab); assert.ok(r.p > 0, 'propias ' + r.p);
  assert.ok(media('honderos', [rival(), falangeTuya()]).p === 0, 'sin trabar no hay');
  const T = crearTiradores({ tipo: 'honderos', orden: 'alto', blanco: 'r' });
  assert.strictEqual(pasoTiro(T, 0.1, { cuerpos: trab }).length, 0);
  const S = pasoTiro(crearTiradores({ tipo: 'honderos', blanco: 'r' }), 0.1, { cuerpos: trab });
  assert.ok(S.avisos.includes('¡Están trabados con los tuyos!'), S.avisos.join('|'));
});
t('parábola da más fuego amigo que directo (25 % contra 10 %)', () => {
  assert.ok(AJUSTE.amigo.parabola > AJUSTE.amigo.directo);
  const flanco = [rival({ trabado: 'f' }), falangeTuya({ x: 60, z: -37 })];
  assert.strictEqual(media('honderos', flanco).modo, 'directo');
});
t('la munición se acaba y avisa', () => {
  const T = crearTiradores({ tipo: 'velites', semilla: 3, blanco: 'r' }), mundo = { cuerpos: [rival({ z: -20 })] }; let salvas = 0, av = [];
  for (let i = 0; i < 600; i++) { const S = pasoTiro(T, 0.1, mundo); salvas += S.length; av.push(...S.avisos); }
  assert.strictEqual(salvas, 7); assert.strictEqual(T.municion, 0); assert.ok(av.includes('¡Sin munición!'));
});
t('la cadencia manda: honderos, una salva cada 6 s', () => {
  const T = crearTiradores({ tipo: 'honderos', semilla: 2 }), mundo = { cuerpos: [rival()] }; let s = 0;
  for (let i = 0; i < 300; i++) s += pasoTiro(T, 0.1, mundo).length; assert.strictEqual(s, 5, 'en 30 s ' + s);
});
t('honderos contra testudo casi no matan', () => {
  const a = media('honderos', [rival()]), b = media('honderos', [rival({ testudo: true })]);
  assert.ok(b.m < a.m * 0.1, b.m + ' vs ' + a.m);
});
t('vélites con su línea delante: sin tiro', () => {
  const T = crearTiradores({ tipo: 'velites', blanco: 'r' }), mundo = { cuerpos: [rival({ z: -20 }), falangeTuya({ z: -8 })] };
  assert.strictEqual(eligeModo('velites', { x: 0, z: 0 }, { x: 0, z: -20 }, mundo.cuerpos.slice(1)), 'sinTiro');
  const S = pasoTiro(T, 0.1, mundo); assert.strictEqual(S.length, 0); assert.ok(S.avisos.includes('Sin tiro')); assert.strictEqual(T.municion, 7);
});
t('arqueros: directo de cerca, parábola de lejos o con los tuyos delante', () => {
  assert.strictEqual(eligeModo('arqueros', { x: 0, z: 0 }, { x: 0, z: -20 }, []), 'directo');
  assert.strictEqual(eligeModo('arqueros', { x: 0, z: 0 }, { x: 0, z: -70 }, []), 'parabola');
  assert.strictEqual(eligeModo('arqueros', { x: 0, z: 0 }, { x: 0, z: -20 }, [falangeTuya({ z: -10 })]), 'parabola');
});
t('el aviso de tirar por encima de la falange sale con el número de tiros', () => {
  const S = pasoTiro(crearTiradores({ tipo: 'arqueros', blanco: 'r' }), 0.1, { cuerpos: [rival(), falangeTuya()] });
  assert.ok(S.avisos.includes('Tirando por encima de la falange · 40 tiros'), S.avisos.join('|'));
});
/* la ruta de retirada: falange a la izquierda (x −44..−4), hueco de 8 m (−4..4) y manípulo (4..20) */
const linea = () => [cuerpo({ id: 'fal', tipo: 'falange', x: -24, z: 20, ancho: 40, fondo: 8 }), cuerpo({ id: 'man', x: 12, z: 20, ancho: 16, fondo: 8 })];
t('la retirada pasa por el hueco entre falange y manípulo', () => {
  const T = crearTiradores({ tipo: 'honderos', x: -30, z: 0 }), ruta = rutaRetirada(T, linea());
  assert.strictEqual(ruta.por, 'hueco');
  let a = { x: T.x, z: T.z }; for (const p of ruta) { for (const c of linea()) assert.ok(!cortaCuerpo(a, p, c), 'cruza ' + c.id); a = p; }
  assert.ok(Math.abs(ruta[ruta.length - 1].x) <= 4 && ruta[ruta.length - 1].z > 24, JSON.stringify(ruta));
});
t('sin hueco (falange pegada al manípulo) rodea por el ala', () => {
  const cs = [cuerpo({ id: 'fal', tipo: 'falange', x: -24, z: 20, ancho: 40, fondo: 8 }), cuerpo({ id: 'man', x: 8, z: 20, ancho: 24, fondo: 8 })];
  const ruta = rutaRetirada(crearTiradores({ tipo: 'honderos', x: -30, z: 0 }), cs);
  assert.strictEqual(ruta.por, 'ala'); let a = { x: -30, z: 0 }; for (const p of ruta) { for (const c of cs) assert.ok(!cortaCuerpo(a, p, c)); a = p; }
});
t('ordenar «retirarse» los lleva por la ruta hasta detrás', () => {
  const T = crearTiradores({ tipo: 'honderos', x: -30, z: 0, orden: 'retirarse' }), mundo = { cuerpos: linea() };
  for (let i = 0; i < 400; i++) pasoTiro(T, 0.1, mundo); assert.ok(T.z > 24 && Math.abs(T.x) <= 4, T.x + ',' + T.z); assert.strictEqual(T.orden, 'alto');
});
t('una carga rompe a los que no se retiran, y a los que sí, no', () => {
  const corre = orden => {
    const T = crearTiradores({ tipo: 'honderos', x: -30, z: 0, orden, semilla: 4 }), car = cuerpo({ id: 'c', bando: 1, x: -30, z: -40, ang: Math.PI, carga: true, ancho: 12, fondo: 4 });
    for (let i = 0; i < 200; i++) { car.z += 5 * 0.1; pasoTiro(T, 0.1, { cuerpos: [car, ...linea()] }); }
    return T;
  };
  assert.strictEqual(corre('tirar').roto, true); assert.strictEqual(corre('retirarse').roto, false);
});
t('hostigar: avanza, tira dos veces y vuelve a su sitio', () => {
  const T = crearTiradores({ tipo: 'velites', orden: 'hostigar', semilla: 5, blanco: 'r' }), mundo = { cuerpos: [rival({ z: -60 })] }; let s = 0, lejos = 0;
  for (let i = 0; i < 1200 && T.orden === 'hostigar'; i++) { s += pasoTiro(T, 0.1, mundo).length; lejos = Math.min(lejos, T.z); }
  assert.strictEqual(s, 2); assert.ok(lejos < -25, 'avanzó ' + lejos); assert.ok(Math.hypot(T.x, T.z) < 0.1); assert.strictEqual(T.orden, 'tirar');
});
t('la piedra no se clava nunca (crearProyectiles)', () => {
  const H = () => 0;
  for (const donde of ['suelo', 'escudo', 'cuerpo', 'asta']) for (let s = 1; s <= 8; s++) {
    const Pr = crearProyectiles({ H, semilla: s, tipo: 'piedra' }), a = {};
    const obst = { escudo: [{ tipo: 'escudo', dueno: a, c: [0, 1, 0], m: [0.3, 0.5, 0.05], n: [0, 0, 1] }], cuerpo: [{ tipo: 'cuerpo', dueno: a, x: 0, z: 0, r: 0.25, y0: 0, y1: 1.8 }], asta: [{ tipo: 'asta', dueno: a, a: [0, 1, -1], b: [0, 1, 1], r: 0.03 }], suelo: [] }[donde];
    const p = { tipo: 'piedra', largo: 0.04, p: [0.1 * s, 1.2, 4], v: [0, -2 * s, -30] };
    let modo; try { modo = Pr.llega(p, { tipo: donde, dueno: a }, obst, null); } catch (e) { modo = 'error ' + e.message; }
    assert.ok(!String(modo).startsWith('clava'), donde + ' ' + modo); assert.notStrictEqual(p.fi && p.fi.modo, 'clava', donde);
  }
  assert.strictEqual(PROYECTIL.piedra.masa, 0.05); assert.strictEqual(PROYECTIL.piedra.v, 30);
});
console.log(`\n${n} bien, ${mal} mal`); process.exit(mal ? 1 : 0);
